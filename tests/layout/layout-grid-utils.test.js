/**
 * layout-grid-utils (track/area model behind lcards-layout-view and the layout
 * card editor) and layout-render buildGridStyle.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as L from '../../src/views/layout-grid-utils.js';
import { buildGridStyle } from '../../src/views/layout-render.js';

const grid = (str) => L.parseAreasString(str);

// ── Tracks ─────────────────────────────────────────────────────────────

test('parseTrackList keeps functions with spaces intact; round trips', () => {
    const str = '200px minmax(100px, 1fr)  clamp(10px, 5vw, 50px)\t2fr';
    const tracks = L.parseTrackList(str);
    assert.deepEqual(tracks, ['200px', 'minmax(100px, 1fr)', 'clamp(10px, 5vw, 50px)', '2fr']);
    assert.equal(L.trackListToString(tracks), '200px minmax(100px, 1fr) clamp(10px, 5vw, 50px) 2fr');
    assert.deepEqual(L.parseTrackList(''), []);
    assert.deepEqual(L.parseTrackList(null), []);
    // repeat() stays one token; it is not expanded (current behaviour).
    assert.deepEqual(L.parseTrackList('repeat(3, 1fr)'), ['repeat(3, 1fr)']);
});

test('parseTrackValue / serializeTrackValue round trip every kind', () => {
    const cases = [
        ['1fr', { type: 'fr', value: 1 }],
        ['2.5FR', { type: 'fr', value: 2.5 }, '2.5fr'],
        ['120px', { type: 'px', value: 120 }],
        ['50%', { type: 'percent', value: 50 }],
        ['10vh', { type: 'vh', value: 10 }],
        ['3rem', { type: 'rem', value: 3 }],
        ['auto', { type: 'auto' }],
        ['min-content', { type: 'auto' }, 'auto'],
        ['minmax(100px, 1fr)', { type: 'minmax', min: '100px', max: '1fr' }],
        ['minmax(calc(10px + 1em), 2fr)', { type: 'minmax', min: 'calc(10px + 1em)', max: '2fr' }],
        ['clamp(10px, 5vw, 50px)', { type: 'clamp', min: '10px', val: '5vw', max: '50px' }],
        ['calc(100% - 20px)', { type: 'calc', expr: '100% - 20px' }],
        ['subgrid', { type: 'other', raw: 'subgrid' }],
    ];
    for (const [input, parsed, serialized = input] of cases) {
        assert.deepEqual(L.parseTrackValue(input), parsed, input);
        assert.equal(L.serializeTrackValue(parsed), serialized, input);
    }
    assert.deepEqual(L.parseTrackValue(''), { type: 'other', raw: '' });
    assert.equal(L.serializeTrackValue(null), 'auto');
    assert.equal(L.isResizableTrack({ type: 'px' }), true);
    assert.equal(L.isResizableTrack({ type: 'fr' }), true);
    assert.equal(L.isResizableTrack({ type: 'auto' }), false);
});

test('computeFrPx subtracts fixed tracks and gaps', () => {
    // 1000 - 3 gaps * 10 - 200px - 10% (100) = 670 over 2fr
    assert.equal(L.computeFrPx(1000, ['200px', '1fr', '10%', '1fr'], '10px'), 335);
    assert.equal(L.computeFrPx(1000, ['1fr', '3fr'], '0'), 250);
    assert.equal(L.computeFrPx(1000, ['200px', 'auto'], '10px'), 0); // no fr tracks
    assert.equal(L.computeFrPx(100, ['200px', '1fr'], '0'), 0);      // over-full clamps to 0
});

test('resizeAdjacentTracks moves the boundary, keeps units, enforces 20px minimum', () => {
    assert.deepEqual(L.resizeAdjacentTracks(['100px', '100px'], 0, 30, 200, '0'), ['130px', '70px']);
    // 1fr = 500px here; +100px -> 1.2fr / 0.8fr
    assert.deepEqual(L.resizeAdjacentTracks(['1fr', '1fr'], 0, 100, 1000, '0'), ['1.2fr', '0.8fr']);
    // The shrinking side stops at 20px but the other side still takes the full
    // delta (current behaviour): two px tracks then outgrow their original total.
    assert.deepEqual(L.resizeAdjacentTracks(['100px', '1fr'], 0, -500, 600, '0'), ['20px', '2fr']);
    assert.deepEqual(L.resizeAdjacentTracks(['100px', '100px'], 0, -500, 200, '0'), ['20px', '600px']);
    // Non-resizable neighbour or out-of-range index: unchanged (same array).
    const tracks = ['auto', '1fr'];
    assert.equal(L.resizeAdjacentTracks(tracks, 0, 10, 500, '0'), tracks);
    assert.equal(L.resizeAdjacentTracks(tracks, 1, 10, 500, '0'), tracks);
});

// ── Areas ──────────────────────────────────────────────────────────────

test('parseAreasString pads ragged rows; areasToString round trips', () => {
    const g = grid(`"header header" 'side main main'`);
    assert.deepEqual(g, [['header', 'header', '.'], ['side', 'main', 'main']]);
    assert.equal(L.areasToString(g), '"header header ."\n"side main main"');
    assert.deepEqual(grid(L.areasToString(g)), g);
    assert.deepEqual(grid(''), []);
    assert.equal(L.areasToString([]), '');
});

test('getAreaNames / getAreaBounds', () => {
    const g = grid('"a a b" "a a ." ". c c"');
    assert.deepEqual(L.getAreaNames(g), ['a', 'b', 'c']);
    assert.deepEqual(L.getAreaBounds(g, 'a'), { r1: 0, c1: 0, r2: 2, c2: 2 });
    assert.deepEqual(L.getAreaBounds(g, 'c'), { r1: 2, c1: 1, r2: 3, c2: 3 });
    assert.equal(L.getAreaBounds(g, 'zzz'), null);
    // A run of dots is a null cell in CSS, but is treated as an area name here (current behaviour).
    assert.deepEqual(L.getAreaNames(grid('"a ..."')), ['a', '...']);
});

test('cellsToAreaName paints a rectangle, refuses overlaps, never mutates', () => {
    const g = grid('"a . ." ". . ."');
    const ok = L.cellsToAreaName(g, { r1: 0, c1: 1, r2: 2, c2: 3 }, 'b');
    assert.equal(ok.ok, true);
    assert.deepEqual(ok.grid2d, [['a', 'b', 'b'], ['.', 'b', 'b']]);
    assert.deepEqual(g, [['a', '.', '.'], ['.', '.', '.']]);
    const bad = L.cellsToAreaName(g, { r1: 0, c1: 0, r2: 1, c2: 2 }, 'b');
    assert.deepEqual(bad, { ok: false, error: 'Overlaps existing area "a"' });
    // Repainting the same area over itself is fine.
    assert.equal(L.cellsToAreaName(g, { r1: 0, c1: 0, r2: 1, c2: 2 }, 'a').ok, true);
});

test('removeArea / renameArea', () => {
    const g = grid('"a a b"');
    assert.deepEqual(L.removeArea(g, 'a'), [['.', '.', 'b']]);
    assert.deepEqual(L.renameArea(g, 'a', 'hero'), [['hero', 'hero', 'b']]);
});

test('area settings maps follow renames and removals without mutating', () => {
    const map = { a: { bg: 1 }, b: { bg: 2 } };
    assert.deepEqual(L.renameAreaSettings(map, 'a', 'hero'), { b: { bg: 2 }, hero: { bg: 1 } });
    assert.deepEqual(L.renameAreaSettings(map, 'zzz', 'x'), map);
    assert.deepEqual(L.removeAreaSettings(map, 'a'), { b: { bg: 2 } });
    assert.deepEqual(L.pruneAreaSettings(map, ['b', 'c']), { b: { bg: 2 } });
    assert.deepEqual(L.pruneAreaSettings(null, ['a']), {});
    assert.deepEqual(map, { a: { bg: 1 }, b: { bg: 2 } });
});

// ── Track insert/remove/reorder keep areas valid ──────────────────────

/** Every named area must be a filled rectangle (valid grid-template-areas). */
function assertRectangular(g) {
    for (const name of L.getAreaNames(g)) {
        const { r1, c1, r2, c2 } = L.getAreaBounds(g, name);
        for (let r = r1; r < r2; r++) for (let c = c1; c < c2; c++) {
            assert.equal(g[r][c], name, `area ${name} not rectangular at ${r},${c}`);
        }
    }
}

test('removeTrack: single-span areas collapse, wider areas shrink', () => {
    const g = grid('"a a b" "c c b"');
    const cols = ['1fr', '1fr', '100px'];
    const rows = ['auto', '1fr'];
    const col = L.removeTrack(g, cols, rows, 'col', 2);
    assert.deepEqual(col.grid2d, [['a', 'a'], ['c', 'c']]);
    assert.deepEqual(col.columns, ['1fr', '1fr']);
    assert.deepEqual(col.removedAreas, ['b']);
    const shrink = L.removeTrack(g, cols, rows, 'col', 0);
    assert.deepEqual(shrink.grid2d, [['a', 'b'], ['c', 'b']]);
    assert.deepEqual(shrink.removedAreas, []);
    const row = L.removeTrack(g, cols, rows, 'row', 0);
    assert.deepEqual(row.grid2d, [['c', 'c', 'b']]);
    assert.deepEqual(row.rows, ['1fr']);
    assert.deepEqual(row.removedAreas, ['a']);
    for (const r of [col, shrink, row]) assertRectangular(r.grid2d);
    // Out of range: untouched.
    assert.equal(L.removeTrack(g, cols, rows, 'col', 9).grid2d, g);
});

test('insertTrack adds empty cells and the track size', () => {
    const g = grid('"a b"');
    const col = L.insertTrack(g, ['1fr', '1fr'], ['auto'], 'col', 1, '50px');
    assert.deepEqual(col.grid2d, [['a', '.', 'b']]);
    assert.deepEqual(col.columns, ['1fr', '50px', '1fr']);
    const row = L.insertTrack(g, ['1fr', '1fr'], ['auto'], 'row', 0);
    assert.deepEqual(row.grid2d, [['.', '.'], ['a', 'b']]);
    assert.deepEqual(row.rows, ['1fr', 'auto']);
    // Inserting inside a spanning area splits it (current behaviour; the editor
    // only offers boundary insertion).
    const split = L.insertTrack(grid('"a a"'), ['1fr', '1fr'], ['auto'], 'col', 1);
    assert.deepEqual(split.grid2d, [['a', '.', 'a']]);
});

test('reorderTrack moves tracks with their cells, blocks moves that break an area', () => {
    const g = grid('"a a b" "c d b"');
    const ok = L.reorderTrack(g, ['1fr', '2fr', '3fr'], 'col', 2, 0);
    assert.equal(ok.safe, true);
    assert.deepEqual(ok.grid2d, [['b', 'a', 'a'], ['b', 'c', 'd']]);
    assert.deepEqual(ok.tracks, ['3fr', '1fr', '2fr']);
    assertRectangular(ok.grid2d);
    const blocked = L.reorderTrack(g, ['1fr', '2fr', '3fr'], 'col', 0, 2);
    assert.equal(blocked.safe, false);
    assert.equal(blocked.blockedBy, 'a');
    assert.equal(blocked.grid2d, g);
    const rows = L.reorderTrack(g, ['auto', '1fr'], 'row', 1, 0);
    assert.equal(rows.safe, true);
    assert.deepEqual(rows.grid2d, [['c', 'd', 'b'], ['a', 'a', 'b']]);
    assert.deepEqual(L.reorderTrack(g, ['x'], 'col', 1, 1), { safe: true, grid2d: g, tracks: ['x'] });
});

// ── Config round trip ──────────────────────────────────────────────────

test('parseLayoutConfig: defaults, grid-gap/gap aliases, areas fitted to the track grid', () => {
    assert.deepEqual(L.parseLayoutConfig(undefined), {
        columns: ['1fr', '1fr', '1fr'], rows: ['1fr', '1fr', '1fr'],
        areas: [['.', '.', '.'], ['.', '.', '.'], ['.', '.', '.']], gap: '5px',
    });
    const parsed = L.parseLayoutConfig({
        'grid-template-columns': '200px 1fr',
        'grid-template-rows': 'auto 1fr 50px',
        'grid-template-areas': '"side main extra" "side main extra"',
        gap: '8px',
    });
    assert.deepEqual(parsed.areas, [['side', 'main'], ['side', 'main'], ['.', '.']]);
    assert.equal(parsed.gap, '8px');
    assert.equal(L.parseLayoutConfig({ 'grid-gap': '2px', gap: '9px' }).gap, '2px');
});

test('serializeLayoutConfig writes CSS keys, drops legacy keys, keeps the rest', () => {
    const out = L.serializeLayoutConfig(['1fr', '2fr'], ['auto'], [['a', 'b']], '4px',
        { columns: 'old', rows: 'old', areas: 'old', gap: 'old', height: '100%', 'place-items': 'center' });
    assert.deepEqual(out, {
        height: '100%', 'place-items': 'center',
        'grid-template-columns': '1fr 2fr', 'grid-template-rows': 'auto',
        'grid-template-areas': '"a b"', 'grid-gap': '4px',
    });
    const back = L.parseLayoutConfig(out);
    assert.deepEqual([back.columns, back.rows, back.areas, back.gap], [['1fr', '2fr'], ['auto'], [['a', 'b']], '4px']);
});

test('setAreaBounds: move and resize an area; blocked by other areas and the grid edge', () => {
    const g = grid('"a a ." "b . ." ". . ."');
    // Grow a to the right and down over free cells and its own old cells.
    const grown = L.setAreaBounds(g, 'a', { r1: 0, c1: 0, r2: 1, c2: 3 });
    assert.ok(grown.ok);
    assert.equal(L.areasToString(/** @type {any} */ (grown).grid2d), '"a a a"\n"b . ."\n". . ."');
    // Move a down-right: its old cells are freed.
    const moved = L.setAreaBounds(g, 'a', { r1: 1, c1: 1, r2: 2, c2: 3 });
    assert.ok(moved.ok);
    assert.equal(L.areasToString(/** @type {any} */ (moved).grid2d), '". . ."\n"b a a"\n". . ."');
    // Overlapping b is refused; so are empty / out-of-grid / non-integer bounds and unknown areas.
    assert.deepEqual(L.setAreaBounds(g, 'a', { r1: 0, c1: 0, r2: 2, c2: 2 }), { ok: false, error: 'Overlaps existing area "b"' });
    for (const b of [{ r1: 0, c1: 0, r2: 0, c2: 2 }, { r1: 0, c1: 2, r2: 1, c2: 4 }, { r1: -1, c1: 0, r2: 1, c2: 1 }, { r1: 0, c1: 0.5, r2: 1, c2: 2 }]) {
        assert.equal(L.setAreaBounds(g, 'a', b).ok, false);
    }
    assert.equal(L.setAreaBounds(g, 'zz', { r1: 0, c1: 0, r2: 1, c2: 1 }).ok, false);
    // The input grid is not mutated.
    assert.equal(L.areasToString(g), '"a a ."\n"b . ."\n". . ."');
});

// ── buildGridStyle ─────────────────────────────────────────────────────

test('buildGridStyle: default height, overrides, gutter, areas, pass-through keys', () => {
    const style = buildGridStyle({ 'place-items': 'center', 'grid-auto-flow': 'dense', color: 'red' },
        ['1fr', '2fr'], ['auto'], [['a', 'b']], '4px');
    assert.deepEqual(style.split('; '), [
        'height: calc(100dvh - var(--header-height, 56px))',
        'grid-template-columns: 1fr 2fr',
        'grid-template-rows: auto',
        'grid-template-areas: "a b"',
        'gap: 4px',
        'place-items: center',
        'grid-auto-flow: dense',
    ]);
    const custom = buildGridStyle({ height: '500px', margin: '0', padding: '4px' }, ['1fr'], ['1fr'], [['.']], '0',
        { editMode: 'grid', overflowY: 'hidden' });
    // Grid editing reserves the toolbar strip + header gutter on top, the gutter on the left.
    assert.ok(custom.startsWith('height: 500px; overflow-y: hidden; margin: 0; padding: 4px; padding-top: 76px; padding-left: 28px'));
    assert.ok(!custom.includes('grid-template-areas')); // no named areas
    assert.ok(buildGridStyle({ height: '500px' }, ['1fr'], ['1fr'], [['.']], '0', { overrideHeight: '100%' }).startsWith('height: 100%;'));
    assert.ok(!buildGridStyle({ height: 'auto' }, ['1fr'], ['1fr'], [['.']], '0').includes('overflow-y'));
    // Card mode reserves only the toolbar strip; no edit mode reserves nothing.
    const cards = buildGridStyle({}, ['1fr'], ['1fr'], [['.']], '0', { editMode: 'cards' });
    assert.ok(cards.includes('padding-top: 48px') && !cards.includes('padding-left'));
    assert.ok(!buildGridStyle({}, ['1fr'], ['1fr'], [['.']], '0', { editMode: null }).includes('padding'));
});

test('editReserve: room for the edit toolbar strip and header gutter, by mode', () => {
    assert.deepEqual(L.editReserve('grid'),  { top: L.EDIT_BAR_HEIGHT + L.GRID_EDIT_GUTTER, left: L.GRID_EDIT_GUTTER });
    assert.deepEqual(L.editReserve('cards'), { top: L.EDIT_BAR_HEIGHT, left: 0 });
    assert.deepEqual(L.editReserve(null),    { top: 0, left: 0 });
    assert.deepEqual(L.editReserve(undefined), { top: 0, left: 0 });
});

test('countTracks: repeat(N, ...) counts as N times its inner tracks', () => {
    assert.equal(L.countTracks(L.parseTrackList('repeat(3, minmax(0, 1fr))')), 3);
    assert.equal(L.countTracks(L.parseTrackList('120px repeat(2, 1fr 2fr) auto')), 6);
    assert.equal(L.countTracks(L.parseTrackList('repeat(auto-fill, 100px)')), 1);
});

test('parseLayoutConfig keeps every area name when tracks use repeat()', () => {
    // Regression: repeat(3, ...) was one track, so each area row was cut to its first name
    // and cards placed in the other areas collapsed to nothing.
    const { areas } = L.parseLayoutConfig({
        'grid-template-columns': 'repeat(3, minmax(0, 1fr))',
        'grid-template-rows': 'minmax(0, 1fr) 40px',
        'grid-template-areas': '"slider slider slider"\n"p1 p2 p3"',
    });
    assert.deepEqual(areas, [['slider', 'slider', 'slider'], ['p1', 'p2', 'p3']]);
    const auto = L.parseLayoutConfig({
        'grid-template-columns': 'repeat(auto-fill, 100px)',
        'grid-template-areas': '"a b c"',
    });
    assert.deepEqual(auto.areas[0], ['a', 'b', 'c'], 'auto-fill tracks can\'t be counted, so the areas row sets the width');
});
