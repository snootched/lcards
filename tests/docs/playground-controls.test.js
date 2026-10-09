/**
 * Docs playground quick controls: YAML edits keep comments and formatting.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { PLAYGROUNDS, applyControl, controlValue, docsFor } from '../../doc/.vitepress/theme/playground-controls.js';
import { parseDocument } from 'yaml';

const chart = PLAYGROUNDS['lcards-chart'].controls;
const grid = PLAYGROUNDS['lcards-data-grid'].controls;
const byLabel = (list, label) => list.find(c => c.label === label);
const cfg = (text) => parseDocument(text).toJS();

const CHART = `# Living room chart
type: custom:lcards-chart
chart_type: line # try area
sources:
  - entity: sensor.demo_temperature
    name: Inside
`;

test('setting a value keeps comments and every other line', () => {
    const out = applyControl(CHART, byLabel(chart, 'Chart type'), 'area');
    assert.equal(out, CHART.replace('chart_type: line', 'chart_type: area'));
});

test('second series: add, then clear removes the list item', () => {
    const control = byLabel(chart, 'Series 2 entity');
    const added = applyControl(CHART, control, 'sensor.demo_power');
    assert.match(added, /  - entity: sensor\.demo_power\n$/);
    assert.equal(controlValue(control, cfg(added)), 'sensor.demo_power');
    assert.equal(applyControl(added, control, ''), CHART);
});

test('nested key is created; checkbox off removes it again', () => {
    const legend = byLabel(chart, 'Legend');
    const on = applyControl(CHART, legend, true);
    assert.match(on, /style:\n  legend:\n    show: true\n/);
    assert.equal(cfg(applyControl(on, legend, false)).style.legend.show, false);
});

const GRID = `type: custom:lcards-data-grid
data_mode: decorative
grid:
  grid-template-rows: repeat(6,auto)
  grid-template-columns: 100px repeat(5, 1fr)
  gap: 0px
rows:
  - [A, B] # flow row stays flow
`;

test('grid size controls resize tracks and keep sizes', () => {
    const cols = byLabel(grid, 'Columns');
    assert.equal(controlValue(cols, cfg(GRID)), 6);
    const out = applyControl(GRID, cols, 3);
    assert.match(out, /grid-template-columns: 100px 1fr 1fr\n/);
    assert.match(out, /- \[A, B\] # flow row stays flow/);
    assert.match(applyControl(GRID, byLabel(grid, 'Rows'), 8), /grid-template-rows: repeat\(8, auto\)/);
});

test('cascade toggle adds and removes the animation; pattern follows it', () => {
    const cascade = byLabel(grid, 'Cascade');
    const pattern = byLabel(grid, 'Cascade pattern');
    assert.equal(controlValue(cascade, cfg(GRID)), false);
    assert.equal(pattern.show(cfg(GRID)), false);
    const on = applyControl(GRID, cascade, true);
    assert.deepEqual(cfg(on).animations, [{ trigger: 'on_load', preset: 'cascade-color' }]);
    const niagara = applyControl(on, pattern, 'niagara');
    assert.equal(cfg(niagara).animations[0].params.pattern, 'niagara');
    assert.equal(cfg(applyControl(niagara, cascade, false)).animations, undefined);
});

test('decorative-only controls hide in data mode', () => {
    const data = cfg('type: custom:lcards-data-grid\nrows:\n  - [a]\n');
    assert.equal(byLabel(grid, 'Format').show(data), false);
    assert.equal(byLabel(grid, 'Format').show(cfg(GRID)), true);
});

test('invalid YAML is left alone; docs links resolve by prefix', () => {
    assert.equal(applyControl('a: [oops', byLabel(chart, 'Legend'), true), 'a: [oops');
    assert.equal(docsFor('lcards-chart', ['sources', 0, 'group_by', 'func']), '/cards/chart/series#grouping');
    assert.equal(docsFor('lcards-chart', ['sources', 0, 'curve']), '/cards/chart/series#series-options');
    assert.equal(docsFor('lcards-data-grid', ['rows', 2, 'values', 1, 'style', 'color']), '/cards/data-grid/data#conditional-colours');
    assert.equal(docsFor('lcards-data-grid', ['nope']), '/cards/data-grid/#configuration-at-a-glance');
});
