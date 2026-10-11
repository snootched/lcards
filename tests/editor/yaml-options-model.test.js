/**
 * yaml-options-model + yaml-docs-links: the "Options here" panel content.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import yaml from 'js-yaml';
import { panelAt, insertLinesFor, quoteIfNeeded } from '../../src/editor/utils/yaml-options-model.js';
import { docsFor, docsUrl, normalizeCardType } from '../../src/editor/utils/yaml-docs-links.js';
import { getChartSchema } from '../../src/cards/schemas/chart-schema.js';
import { dataGridSchema } from '../../src/cards/schemas/data-grid-schema.js';

const chart = getChartSchema();
const at = (schema, withCursor, card = 'chart') => {
    const offset = withCursor.indexOf('|');
    return panelAt(schema, withCursor.replace('|', ''), offset, yaml.load, card);
};

test('key position lists the keys for that mapping, with docs links', () => {
    const p = at(chart, 'type: custom:lcards-chart\nsources:\n  - entity: sensor.a\n    |');
    assert.equal(p.kind, 'options');
    assert.equal(p.crumb, 'sources > 0');
    const group = p.options.find(o => o.key === 'group_by');
    assert.equal(group.docs, '/cards/chart/series#grouping');
    assert.ok(!p.options.some(o => o.key === 'entity'), 'present key left out');
});

test('value position offers allowed values', () => {
    const p = at(chart, 'chart_type: |');
    assert.equal(p.kind, 'values');
    assert.equal(p.key, 'chart_type');
    assert.ok(p.choices.some(c => c.value === 'area'));
    assert.equal(p.docs, '/cards/chart/#chart-types');
});

test('end of a container key describes its contents; lists insert list items', () => {
    const style = at(chart, 'style:|');
    assert.equal(style.kind, 'options');
    assert.deepEqual(style.path, ['style']);
    assert.equal(style.indent, 2);
    const sources = at(chart, 'sources:|');
    assert.deepEqual(sources.path, ['sources', 0]);
    assert.equal(sources.listItem, true);
    assert.deepEqual(insertLinesFor({ key: 'entity', container: false }, sources, chart), ['- entity: ']);
    const statistics = sources.options.find(o => o.key === 'statistics');
    assert.deepEqual(insertLinesFor(statistics, sources, chart), ['- statistics:', '    ']);
});

test('insert lines: defaults, first enum value, lists, booleans', () => {
    const top = at(dataGridSchema, 'type: custom:lcards-data-grid\n|', 'data-grid');
    const opt = (k) => top.options.find(o => o.key === k);
    assert.deepEqual(insertLinesFor(opt('format'), top, dataGridSchema), ['format: mixed']);
    assert.deepEqual(insertLinesFor(opt('rows'), top, dataGridSchema), ['rows:', '  - ']);
    assert.deepEqual(insertLinesFor(opt('style'), top, dataGridSchema), ['style:', '  ']);
    assert.deepEqual(insertLinesFor(opt('refresh_cells'), top, dataGridSchema), ['refresh_cells: 1']);
    assert.deepEqual(insertLinesFor(opt('highlight_changes'), top, dataGridSchema), ['highlight_changes: true']);
});

test('quoteIfNeeded protects YAML-special values', () => {
    assert.equal(quoteIfNeeded('#ff0000'), "'#ff0000'");
    assert.equal(quoteIfNeeded('var(--lcars-red)'), 'var(--lcars-red)');
    assert.equal(quoteIfNeeded('a: b'), "'a: b'");
    assert.equal(quoteIfNeeded(true), 'true');
});

test('docs links: detailed maps, common options, card pages, absolute urls', () => {
    assert.equal(normalizeCardType('custom:lcards-data-grid'), 'data-grid');
    assert.equal(docsFor('lcards-data-grid', ['rows', 1, 'values', 0, 'style', 'color']), '/cards/data-grid/data#conditional-colours');
    assert.equal(docsFor('button', ['rules']), '/core/rules/');
    // Processor names are free-form keys: anything under processing links to the reference.
    assert.equal(docsFor('chart', ['data_sources', 'temp', 'processing', 'smoothed', 'alpha']), '/core/datasources/processor-reference');
    assert.equal(docsFor('processor-lab', ['processing', 'smoothed', 'type']), '/core/datasources/processor-reference');
    assert.equal(docsFor('lcards-processor-lab', ['entity']), '/core/datasources/#top-level-fields');
    assert.equal(docsFor('button', ['text', 'label']), '/core/text-fields');
    assert.equal(docsFor('slider', []), '/cards/slider-card/#card-options');
    // Cards without a detailed map fall back to their page.
    assert.equal(docsFor('msd', ['msd', 'anchors']), '/cards/msd/');
    assert.equal(docsUrl('/cards/chart/series#grouping'), 'https://lcards.unimatrix01.ca/cards/chart/series.html#grouping');
    assert.equal(docsUrl('/cards/button/'), 'https://lcards.unimatrix01.ca/cards/button/');
});
