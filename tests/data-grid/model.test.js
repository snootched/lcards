/**
 * data-grid-model: tracks, rows/cells, decorative data, styles, cascade timing.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
    splitTrackList, expandTracks, countTracks, joinTracks,
    normalizeRows, classifyCell, dataColumnCount,
    generateDecorativeGrid, refreshDecorativeCells, decorativeValue,
    mergeStyleLayers, styleToCSS, gridContainerStyle, toPx,
    buildCascadeRowTimings, cascadeColorList
} from '../../src/data-grid/data-grid-model.js';

/** Deterministic rng (mulberry32). */
function rng(seed = 1) {
    return () => {
        seed |= 0; seed = seed + 0x6D2B79F5 | 0;
        let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
        t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
        return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
}

test('track lists: split, expand, count, join', () => {
    assert.deepEqual(splitTrackList('minmax(60px, 1fr) repeat(4, 2fr)  80px'), ['minmax(60px, 1fr)', 'repeat(4, 2fr)', '80px']);
    assert.equal(countTracks('repeat(6,minmax(60px,1fr))'), 6);
    assert.equal(countTracks('100px 1fr 2fr'), 3);
    assert.equal(countTracks('minmax(80px, 1fr) repeat(4, 2fr) minmax(80px, 1fr)'), 6);
    assert.equal(countTracks('repeat(2, 1fr 2fr)'), 4);
    assert.equal(countTracks('repeat(auto-fill, 100px)'), null);
    assert.equal(countTracks(''), null);
    assert.deepEqual(expandTracks('repeat(2, 1fr) 80px'), ['1fr', '1fr', '80px']);
    assert.equal(joinTracks(['1fr', '1fr', '1fr']), 'repeat(3, 1fr)');
    assert.equal(joinTracks(['100px', '1fr']), '100px 1fr');
    assert.equal(joinTracks(['1fr']), '1fr');
});

test('normalizeRows handles both row forms', () => {
    assert.deepEqual(normalizeRows([['a', 'b'], { values: ['c'], style: { color: 'x' }, header: true }, 'junk']), [
        { values: ['a', 'b'], style: undefined, header: false },
        { values: ['c'], style: { color: 'x' }, header: true },
        { values: [], style: undefined, header: false }
    ]);
    assert.equal(dataColumnCount([['a'], ['a', 'b', 'c'], { values: ['x', 'y'] }]), 3);
});

test('classifyCell', () => {
    assert.deepEqual(classifyCell('CPU'), { kind: 'static', text: 'CPU', entity: undefined });
    assert.deepEqual(classifyCell(42), { kind: 'static', text: '42', entity: undefined });
    assert.deepEqual(classifyCell('sensor.cpu_temp'), { kind: 'entity', text: 'sensor.cpu_temp', entity: 'sensor.cpu_temp', attribute: undefined });
    assert.equal(classifyCell('{{ states("sensor.x") }}').kind, 'template');
    assert.equal(classifyCell('{datasource:mem:.1f}%').kind, 'template');
    assert.equal(classifyCell('[[[ return 1 ]]]').kind, 'template');
    assert.deepEqual(classifyCell({ entity: 'sensor.up', attribute: 'hours' }), { kind: 'entity', text: '', entity: 'sensor.up', attribute: 'hours' });
    assert.deepEqual(classifyCell({ value: '{{ 1 }}', entity: 'sensor.x' }), { kind: 'template', text: '{{ 1 }}', entity: 'sensor.x', attribute: undefined });
    assert.deepEqual(classifyCell({ value: 'sensor.y', style: {} }).entity, 'sensor.y');
    assert.deepEqual(classifyCell(null), { kind: 'static', text: '' });
});

test('decorative generation honours format and column formats', () => {
    const g = generateDecorativeGrid(3, 4, { format: 'digit', columnFormats: [undefined, 'hex'], rng: rng() });
    assert.equal(g.length, 3);
    assert.equal(g[0].length, 4);
    for (const row of g) {
        assert.match(row[0], /^\d{4}$/);
        assert.match(row[1], /^[0-9A-F]{4}$/);
    }
    assert.match(decorativeValue('alpha', rng(3)), /^[A-Z]{2}$/);
    assert.match(decorativeValue('float', rng(4)), /^\d+\.\d\d$/);
});

test('refreshDecorativeCells changes about the requested fraction', () => {
    const r = rng(7);
    const grid = generateDecorativeGrid(10, 10, { format: 'hex', rng: r });
    const next = refreshDecorativeCells(grid, 0.2, { format: 'alpha', rng: r });
    assert.notEqual(next, grid);
    let changed = 0;
    for (let i = 0; i < 10; i++) for (let j = 0; j < 10; j++) if (next[i][j] !== grid[i][j]) changed++;
    assert.equal(changed, 20); // hex -> alpha always differs
    assert.equal(refreshDecorativeCells(grid, 1, { format: 'alpha', rng: r }).flat().every(v => /^[A-Z]{2}$/.test(v)), true);
});

test('style layers and CSS output', () => {
    assert.deepEqual(mergeStyleLayers({ a: 1, b: 1 }, null, { b: 2 }, undefined), { a: 1, b: 2 });
    assert.equal(
        styleToCSS({ align: 'right', font_size: 18, font_weight: 700, padding: { top: 1, right: 2, bottom: 3, left: 4 }, color: { default: 'x' }, background: '', line_height: 1.2 }),
        'justify-content: flex-end; font-size: 18px; font-weight: 700; padding: 1px 2px 3px 4px; line-height: 1.2'
    );
    assert.equal(styleToCSS({ color: 'red', padding: '4px' }, { exclude: ['color'] }), 'padding: 4px');
});

test('grid container style: defaults, gap px, typography', () => {
    assert.equal(
        gridContainerStyle({}, 3, {}),
        "grid-template-columns: repeat(3, 1fr); gap: 8px; font-family: 'Antonio', 'Helvetica Neue', sans-serif; font-size: 24px; font-weight: 400"
    );
    const s = gridContainerStyle({ 'grid-template-columns': '1fr 2fr', gap: 0 }, 2, { font_size: '22px', line_height: 1.1 });
    assert.match(s, /grid-template-columns: 1fr 2fr; gap: 0px; /);
    assert.match(s, /font-size: 22px/);
    assert.match(s, /line-height: 1.1$/);
    assert.equal(toPx('8px'), 8);
    assert.equal(toPx(6), 6);
    assert.equal(toPx('1rem'), null);
    assert.equal(toPx('4px 8px'), 4);
});

test('cascade row timings', () => {
    assert.deepEqual(buildCascadeRowTimings({}, 2), [{ duration: 3000, delay: 100 }, { duration: 3000, delay: 200 }]);
    assert.deepEqual(buildCascadeRowTimings({ pattern: 'fast', speed_multiplier: 2 }, 1), [{ duration: 500, delay: 0 }]);
    assert.deepEqual(buildCascadeRowTimings({ pattern: 'niagara', duration: 1500 }, 1), [{ duration: 1500, delay: 100 }]);
    const custom = buildCascadeRowTimings({ pattern: 'custom', timing: [{ duration: 100, delay: 0.5 }, { duration: 200, delay: 1 }] }, 3);
    assert.deepEqual(custom, [{ duration: 100, delay: 500 }, { duration: 200, delay: 1000 }, { duration: 100, delay: 500 }]);
    assert.equal(buildCascadeRowTimings({ pattern: 'custom' }, 1)[0].duration, 3000);
    assert.equal(buildCascadeRowTimings({}, 9)[8].duration, 3000); // pattern repeats
});

test('cascade colour list from both forms', () => {
    assert.deepEqual(cascadeColorList(['a', 'b', 'c', 'd']), ['a', 'b', 'c']);
    assert.deepEqual(cascadeColorList({ start: 'a', end: 'c' }), ['a', undefined, 'c']);
    assert.deepEqual(cascadeColorList(undefined), [undefined, undefined, undefined]);
});
