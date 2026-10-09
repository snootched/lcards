/**
 * migrateDataGridConfig: legacy lcards-data-grid configs to the canonical shape.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { migrateDataGridConfig } from '../../src/data-grid/data-grid-config-migration.js';

const T = 'custom:lcards-data-grid';
const migrate = (config) => migrateDataGridConfig(config);

// The card's own getStubConfig(), copied here to pin the decorative baseline.
const STUB = {
    type: T,
    data_mode: 'decorative',
    format: 'mixed',
    grid: { 'grid-template-rows': 'repeat(6,auto)', 'grid-template-columns': 'repeat(6,minmax(60px,1fr))', gap: '0px' },
    style: { padding: '0px', font_size: '22px' },
    animations: [{ trigger: 'on_load', preset: 'cascade-color' }]
};

test('stub and other canonical configs are returned unchanged (same object)', () => {
    for (const config of [
        STUB,
        { type: T, data_mode: 'data', rows: [['A', 'sensor.a'], { values: ['B', { value: 'sensor.b', style: { color: 'red' } }], header: true }] },
        { type: T, grid: { gap: 4 }, highlight_changes: true },
        { type: T }
    ]) {
        const r = migrate(config);
        assert.equal(r.changed, false);
        assert.equal(r.config, config);
        assert.deepEqual(r.notes, []);
    }
});

test('non-objects pass through', () => {
    assert.equal(migrate(null).changed, false);
    assert.equal(migrate(undefined).config, undefined);
});

test('legacy data_mode values', () => {
    assert.equal(migrate({ type: T, data_mode: 'random' }).config.data_mode, 'decorative');
    assert.equal(migrate({ type: T, data_mode: 'template', rows: [] }).config.data_mode, 'data');
    assert.equal(migrate({ type: T, data_mode: 'datasource', rows: [] }).config.data_mode, 'data');
});

test('grid shorthand becomes CSS Grid templates', () => {
    const r = migrate({ type: T, grid: { rows: 8, columns: 12, gap: 8 } });
    assert.deepEqual(r.config.grid, {
        gap: 8,
        'grid-template-rows': 'repeat(8, auto)',
        'grid-template-columns': 'repeat(12, 1fr)'
    });
    assert.equal(migrate({ type: T, grid: { columns: 4, cell_width: 80 } }).config.grid['grid-template-columns'], 'repeat(4, 80px)');
    assert.equal(migrate({ type: T, grid: { cell_width: '5rem' } }).config.grid['grid-template-columns'], 'repeat(12, 5rem)');
});

test('explicit templates win over shorthand', () => {
    const r = migrate({ type: T, grid: { rows: 8, 'grid-template-rows': '20px 1fr' } });
    assert.deepEqual(r.config.grid, { 'grid-template-rows': '20px 1fr' });
});

test('top-level typography moves into style; existing style wins', () => {
    const r = migrate({ type: T, font_size: 18, align: 'left', style: { font_size: 22 } });
    assert.deepEqual(r.config.style, { font_size: 22, align: 'left' });
    assert.equal('font_size' in r.config, false);
    assert.equal('align' in r.config, false);
});

test('animation.type: cascade becomes a cascade-color animation', () => {
    const r = migrate({
        type: T,
        animation: { type: 'cascade', pattern: 'niagara', colors: { start: 'a', text: 'b', end: 'c' }, easing: 'linear', timing: [{ duration: 1, delay: 0 }] }
    });
    assert.equal('animation' in r.config, false);
    assert.deepEqual(r.config.animations, [{
        trigger: 'on_load',
        preset: 'cascade-color',
        params: { pattern: 'niagara', colors: { start: 'a', text: 'b', end: 'c' }, ease: 'linear', timing: [{ duration: 1, delay: 0 }] }
    }]);
});

test('animation.type: cascade does not add a second cascade', () => {
    const r = migrate({ type: T, animation: { type: 'cascade' }, animations: [{ preset: 'cascade-color', params: { pattern: 'fast' } }] });
    assert.equal(r.config.animations.length, 1);
    assert.deepEqual(r.config.animations[0], { preset: 'cascade-color', params: { pattern: 'fast' } });
});

test('animation.timing moves to the existing cascade params', () => {
    const timing = [{ duration: 3000, delay: 0.1 }];
    const r = migrate({ type: T, animations: [{ preset: 'cascade-color', params: { pattern: 'custom' } }], animation: { timing } });
    assert.deepEqual(r.config.animations[0].params, { pattern: 'custom', timing });
    assert.equal('animation' in r.config, false);
});

test('animation.timing without a cascade is dropped with a note', () => {
    const r = migrate({ type: T, animation: { timing: [{ duration: 1, delay: 0 }] } });
    assert.equal('animation' in r.config, false);
    assert.match(r.notes.join(' '), /timing dropped/);
});

test('change highlight moves to highlight_changes', () => {
    const r = migrate({
        type: T,
        animation: { highlight_changes: true, change_preset: 'glow', change_duration: 600, change_easing: 'outQuad', change_params: { blur_max: 8 }, max_highlight_cells: 20 }
    });
    assert.deepEqual(r.config.highlight_changes, { preset: 'glow', duration: 600, ease: 'outQuad', params: { blur_max: 8 }, max_cells: 20 });
    assert.equal(migrate({ type: T, animation: { highlight_changes: true } }).config.highlight_changes, true);
    assert.equal('highlight_changes' in migrate({ type: T, animation: { highlight_changes: false, change_preset: 'glow' } }).config, false);
});

test('cellStyles become cell objects; sources dropped', () => {
    const r = migrate({
        type: T,
        data_mode: 'data',
        rows: [
            { values: ['A', 'sensor.a', 'C'], style: { color: 'x' }, cellStyles: [null, { color: 'red' }, {}] },
            { values: ['B'], sources: [{ column: 0 }] },
            ['plain']
        ]
    });
    assert.deepEqual(r.config.rows, [
        { values: ['A', { value: 'sensor.a', style: { color: 'red' } }, 'C'], style: { color: 'x' } },
        { values: ['B'] },
        ['plain']
    ]);
    assert.equal(r.notes.length, 2);
});

test('migration is idempotent and does not mutate the input', () => {
    const input = {
        type: T,
        data_mode: 'random',
        font_size: 20,
        grid: { rows: 4, columns: 4 },
        animation: { type: 'cascade', highlight_changes: true },
        rows: [{ values: ['a'], cellStyles: [{ color: 'red' }] }]
    };
    const snapshot = JSON.stringify(input);
    const once = migrate(input);
    assert.equal(JSON.stringify(input), snapshot);
    assert.equal(once.changed, true);
    const twice = migrate(once.config);
    assert.equal(twice.changed, false);
    assert.equal(twice.config, once.config);
});
