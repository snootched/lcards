/**
 * yaml-schema-path: cursor path detection and schema lookup for editor help.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import yaml from 'js-yaml';
import { yamlPathAt, schemaAt, optionsAt, valueChoicesAt, lenientParse } from '../../src/editor/utils/yaml-schema-path.js';
import { getChartSchema } from '../../src/cards/schemas/chart-schema.js';
import { dataGridSchema } from '../../src/cards/schemas/data-grid-schema.js';

/** Position at the `|` marker (marker removed). */
function at(textWithCursor) {
    const offset = textWithCursor.indexOf('|');
    const text = textWithCursor.replace('|', '');
    return { text, offset, pos: yamlPathAt(text, offset) };
}

test('top-level key and value positions', () => {
    assert.deepEqual(at('type: custom:lcards-chart\nchar|').pos, { path: [], position: 'key', partial: 'char', indent: 0 });
    const v = at('chart_type: ar|').pos;
    assert.equal(v.position, 'value');
    assert.equal(v.key, 'chart_type');
    assert.equal(v.partial, 'ar');
    assert.deepEqual(at('style:\n  |').pos.path, ['style']);
});

test('sequence items: - key: lines, sibling numbering, compact sequences', () => {
    const text = 'sources:\n  - entity: sensor.a\n    name: A\n  - entity: sensor.b\n    |';
    assert.deepEqual(at(text).pos.path, ['sources', 1]);
    assert.deepEqual(at('sources:\n  - ent|').pos, { path: ['sources', 0], position: 'key', partial: 'ent', indent: 4 });
    assert.deepEqual(at('sources:\n- entity: a\n- |').pos.path, ['sources', 1]);
    const nested = 'sources:\n  - entity: sensor.a\n    statistics:\n      |';
    assert.deepEqual(at(nested).pos.path, ['sources', 0, 'statistics']);
});

test('hyphenated and quoted keys; comments and blank lines are ignored', () => {
    assert.deepEqual(at('grid:\n  # columns\n\n  grid-template-columns: 1fr\n  |').pos.path, ['grid']);
    assert.deepEqual(at('"quoted key":\n  |').pos.path, ['quoted key']);
    assert.deepEqual(at('grid:\n  grid-template-columns: rep|').pos.key, 'grid-template-columns');
});

test('rows of cells: path into a cell object', () => {
    const text = 'rows:\n  - values:\n      - Kitchen\n      - value: sensor.p\n        |';
    assert.deepEqual(at(text).pos.path, ['rows', 0, 'values', 1]);
    assert.deepEqual(at('rows:\n  - [a, b]\n  - values: [c]\n    |').pos.path, ['rows', 1]);
});

test('chart: series options inside sources items', () => {
    const schema = getChartSchema();
    const keys = optionsAt(schema, ['sources', 0]).map(o => o.key);
    for (const k of ['entity', 'name', 'statistics', 'group_by']) assert.ok(keys.includes(k), k);
    assert.ok(!keys.includes('id'), 'deprecated series keys hidden');
    const top = optionsAt(schema, []).map(o => o.key);
    assert.ok(top.includes('chart_type'));
    for (const k of ['source', 'series_names', 'history_hours']) assert.ok(!top.includes(k), `${k} is deprecated`);
    assert.ok(valueChoicesAt(schema, [], 'chart_type').some(c => c.value === 'area'));
});

test('data grid: grid keys, cell object keys, colour state map, deprecated hidden', () => {
    const grid = optionsAt(dataGridSchema, ['grid']).map(o => o.key);
    assert.ok(grid.includes('grid-template-columns'));
    assert.ok(!grid.includes('rows') && !grid.includes('cell_width'));
    const cell = optionsAt(dataGridSchema, ['rows', 0, 'values', 1]).map(o => o.key);
    for (const k of ['value', 'entity', 'attribute', 'style', 'tap_action']) assert.ok(cell.includes(k), k);
    const row = optionsAt(dataGridSchema, ['rows', 0]).map(o => o.key);
    assert.ok(row.includes('header') && !row.includes('cellStyles'));
    const color = optionsAt(dataGridSchema, ['style', 'color']).map(o => o.key);
    assert.ok(color.includes('default') && color.includes('active'));
    const top = optionsAt(dataGridSchema, []).map(o => o.key);
    assert.ok(top.includes('highlight_changes') && !top.includes('animation') && !top.includes('font_size'));
    assert.deepEqual(valueChoicesAt(dataGridSchema, [], 'data_mode').map(c => c.value), ['decorative', 'data']);
    assert.ok(valueChoicesAt(dataGridSchema, [], 'format').length === 5);
});

test('present keys are left out; discriminatedBy follows the sibling preset', () => {
    const config = { type: 'custom:lcards-data-grid', format: 'hex', animations: [{ preset: 'cascade-color', params: {} }] };
    assert.ok(!optionsAt(dataGridSchema, [], config).some(o => o.key === 'format'));
    const params = optionsAt(dataGridSchema, ['animations', 0, 'params'], config).map(o => o.key);
    for (const k of ['pattern', 'speed_multiplier', 'timing', 'colors']) assert.ok(params.includes(k), k);
    assert.ok(schemaAt(dataGridSchema, ['animations', 0, 'params', 'pattern'], config).enum.includes('niagara'));
});

test('lenientParse drops a half-typed cursor line', () => {
    const text = 'format: hex\nanimations:\n  - preset: cascade-color\n    par';
    const parsed = lenientParse(text, text.length, yaml.load);
    assert.equal(parsed.format, 'hex');
    assert.equal(parsed.animations[0].preset, 'cascade-color');
});
