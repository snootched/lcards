/**
 * Chart card bugs found by the D2 docs audit (2026-11-07):
 * - a registered card default (xaxis_type) masqueraded as a user choice, so
 *   horizontal bars got a datetime axis on a real dashboard;
 * - `||` turned 0 into the default for gauge angles and threshold opacity/width;
 * - chart-type defaults were merged over the user's style;
 * - style.formatters.yaxis_label was lost when yaxis: is a list;
 * - schema defaults and placement that did not match the code.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';

// CSS variables resolve to their fallback: no theme is loaded in node. These
// stubs must exist before the module loads, hence the dynamic import.
globalThis.document ??= { documentElement: {} };
globalThis.getComputedStyle ??= () => ({ getPropertyValue: () => '' });
const { ApexChartsAdapter } = await import('../../src/charts/ApexChartsAdapter.js');
const { buildChartOptions, CHART_CARD_DEFAULTS } = await import('../../src/charts/chart-options-builder.js');
const { deepMerge } = await import('../../src/utils/deepMerge.js');
const { getChartSchema } = await import('../../src/cards/schemas/chart-schema.js');

const gen = (style, context = {}) => ApexChartsAdapter.generateOptions(style, [400, 200], context);

test('bar charts get a category axis after the card defaults are merged (as on a dashboard)', () => {
    // CoreConfigManager merges the registered defaults under the user config.
    const config = deepMerge(deepMerge({}, CHART_CARD_DEFAULTS), { chart_type: 'bar' });
    const opts = buildChartOptions({ config, style: {}, series: [{ name: 'a' }], points: [[{ t: 1, v: 2 }]] });
    assert.equal(opts.xaxis.type, 'category');
    // Other time charts still get the datetime axis, and an explicit choice wins.
    const line = deepMerge(deepMerge({}, CHART_CARD_DEFAULTS), {});
    assert.equal(buildChartOptions({ config: line, style: {}, series: [{ name: 'a' }], points: [[]] }).xaxis.type, 'datetime');
    const own = deepMerge(deepMerge({}, CHART_CARD_DEFAULTS), { chart_type: 'bar', xaxis_type: 'datetime' });
    assert.equal(buildChartOptions({ config: own, style: {}, series: [{ name: 'a' }], points: [[]] }).xaxis.type, 'datetime');
});

test('gauge angles of 0 mean the top, not the -90/90 default', () => {
    const o = gen({ chart_type: 'radialBar', gauge_start_angle: 0, gauge_end_angle: 0 });
    assert.equal(o.plotOptions.radialBar.startAngle, 0);
    assert.equal(o.plotOptions.radialBar.endAngle, 0);
    const quarter = gen({ chart_type: 'radialBar', gauge_start_angle: 0, gauge_end_angle: 90 });
    assert.equal(quarter.plotOptions.radialBar.startAngle, 0);
    assert.equal(quarter.plotOptions.radialBar.endAngle, 90);
    const plain = gen({ chart_type: 'radialBar' });
    assert.equal(plain.plotOptions.radialBar.startAngle, -90);
    assert.equal(plain.plotOptions.radialBar.endAngle, 90);
});

test('threshold opacity 0 and width 0 are kept; unset values default to 0.7 and 2', () => {
    const o = gen({ chart_type: 'line', thresholds: [{ value: 1, opacity: 0, width: 0 }, { value: 2 }] });
    assert.equal(o.annotations.yaxis[0].opacity, 0);
    assert.equal(o.annotations.yaxis[0].borderWidth, 0);
    assert.equal(o.annotations.yaxis[1].opacity, 0.7);
    assert.equal(o.annotations.yaxis[1].borderWidth, 2);
});

test('scatter: the user style wins over the type defaults, which apply when nothing is set', () => {
    const own = gen({
        chart_type: 'scatter',
        data_labels: { show: true },
        markers: { stroke: { width: 3 } },
        grid: { stroke_dash_array: 0 },
        colors: { grid: '#123456', legend: { default: '#abcdef' } },
        legend: { font_size: 20 }
    });
    assert.equal(own.dataLabels.enabled, true);
    assert.equal(own.markers.strokeWidth, 3);
    assert.equal(own.grid.strokeDashArray, 0);
    assert.equal(own.grid.borderColor, '#123456');
    assert.equal(own.legend.fontSize, '20px');
    assert.equal(own.legend.labels.colors, '#abcdef');
    const items = gen({ chart_type: 'scatter', colors: { legend: { items: ['#111111', '#222222'] } } });
    assert.deepEqual(items.legend.labels.colors, ['#111111', '#222222']);

    const plain = gen({ chart_type: 'scatter' });
    assert.equal(plain.dataLabels.enabled, false);
    assert.equal(plain.markers.strokeWidth, 0);
    assert.equal(plain.markers.size, 6);
    assert.equal(plain.grid.strokeDashArray, 4);
    assert.equal(plain.legend.fontSize, '12px');
    assert.equal(plain.legend.position, 'top');
});

test('polarArea: the user style wins over the type defaults, which apply when nothing is set', () => {
    const own = gen({
        chart_type: 'polarArea',
        stroke: { width: 5 },
        colors: { stroke: ['#123456'], legend: { default: '#abcdef' } },
        fill: { opacity: 0.3 },
        legend: { font_size: 20 }
    });
    assert.equal(own.stroke.width, 5);
    assert.deepEqual(own.stroke.colors, ['#123456']);
    assert.equal(own.fill.opacity, 0.3);
    assert.equal(own.legend.fontSize, '20px');
    assert.equal(own.legend.labels.colors, '#abcdef');

    const plain = gen({ chart_type: 'polarArea' });
    assert.equal(plain.stroke.width, 2);
    assert.deepEqual(plain.stroke.colors, ['#000000']);
    assert.equal(plain.fill.opacity, 0.8);
    assert.equal(plain.legend.fontSize, '12px');
});

test('treemap: data_labels.show false hides the labels; they are on by default', () => {
    assert.equal(gen({ chart_type: 'treemap', data_labels: { show: false } }).dataLabels.enabled, false);
    assert.equal(gen({ chart_type: 'treemap' }).dataLabels.enabled, true);
});

test('boxPlot: the user stroke wins over the type defaults; style.color colours the boxes', () => {
    const own = gen({ chart_type: 'boxPlot', stroke: { width: 4 }, colors: { stroke: ['#123456'] }, color: '#00ff00' });
    assert.equal(own.stroke.width, 4);
    assert.deepEqual(own.stroke.colors, ['#123456']);
    assert.equal(own.plotOptions.boxPlot.colors.upper, '#00ff00');
    assert.equal(own.plotOptions.boxPlot.colors.lower, '#00ff00');
    const plain = gen({ chart_type: 'boxPlot' });
    assert.equal(plain.stroke.width, 2);
    assert.equal(plain.stroke.colors.length, 1);
});

test('legend colours: colors.legend.default colours the legend on every chart type', () => {
    assert.equal(gen({ chart_type: 'line', colors: { legend: { default: '#abcdef' } } }).legend.labels.colors, '#abcdef');
});

test('style.formatters.yaxis_label applies to every axis when yaxis: is a list', () => {
    const o = gen(
        { chart_type: 'line', formatters: { yaxis_label: '{value} u' } },
        { series: [{ name: 'A' }, { name: 'B', yaxis_id: 'b' }], yaxis: [{ id: 'a' }, { id: 'b', opposite: true }] }
    );
    assert.ok(Array.isArray(o.yaxis));
    assert.equal(o.yaxis[0].labels.formatter(3), '3 u');
    assert.equal(o.yaxis[1].labels.formatter(4.25), '4.3 u');
    // A single axis keeps working.
    assert.equal(gen({ chart_type: 'line', formatters: { yaxis_label: '{value} u' } }).yaxis.labels.formatter(3), '3 u');
});

const schema = getChartSchema();
const style = schema.properties.style.properties;

test('schema defaults describe what the code does', () => {
    assert.equal(style.markers.properties.size.default, 0);
    assert.notEqual(style.legend.properties.font_size.default, 14);
    assert.match(style.legend.properties.font_size.description, /2/);
    assert.notEqual(style.typography.properties.font_family.default, 'Antonio, Helvetica Neue, sans-serif');
    assert.match(style.typography.properties.font_family.description, /theme/i);
    assert.ok(style.color?.description, 'style.color (boxPlot) is in the schema');
    assert.notEqual(schema.properties.xaxis_type.default, 'datetime');
});

test('rules, sounds, variables and zones are card keys, not group_by keys; triggers_update exists', () => {
    const series = schema.properties.sources.items;
    const branches = series.anyOf ?? [series];
    for (const key of ['rules', 'sounds', 'variables', 'zones', 'debug_zones']) {
        assert.ok(schema.properties[key], `card: ${key}`);
        for (const branch of branches) {
            assert.equal(branch.properties?.group_by?.properties?.[key], undefined, `group_by: ${key}`);
        }
    }
    assert.ok(schema.properties.triggers_update);
});

test('style.theme.palette is deprecated and not passed to ApexCharts (it never took effect)', () => {
    const o = gen({ chart_type: 'donut', theme: { palette: 'palette7' } });
    assert.equal(o.theme?.palette, undefined);
    const palette = getChartSchema({}).properties.style.properties.theme.properties.palette;
    assert.equal(palette.deprecated, true);
});
