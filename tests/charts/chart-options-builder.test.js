/**
 * chart-options-builder: series conversion per chart type, window axis,
 * theme defaults. Shared by the card and the docs' live demos.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';

globalThis.window ??= globalThis;
globalThis.__LCARDS_VERSION__ ??= 'test';
globalThis.document ??= { documentElement: {} };
globalThis.getComputedStyle ??= () => ({ getPropertyValue: () => '' });
const { buildApexSeries, buildChartOptions, windowAxis, chartStyleDefaults } =
    await import('../../src/charts/chart-options-builder.js');

const series = [{ name: 'A' }, { name: 'B', type: 'column' }];
const points = [[{ t: 1, v: 3 }, { t: 2, v: 4 }], [{ t: 1, v: 7 }]];

test('time charts get {x, y} data and per-series type (column -> bar)', () => {
    const out = buildApexSeries({ series, points, chartType: 'line' });
    assert.deepEqual(out[0], { name: 'A', data: [{ x: 1, y: 3 }, { x: 2, y: 4 }] });
    assert.equal(out[1].type, 'bar');
});

test('one-value charts get the latest value of each series', () => {
    assert.deepEqual(buildApexSeries({ series, points, chartType: 'pie' }), [4, 7]);
    assert.deepEqual(buildApexSeries({ series, points, chartType: 'radialBar' }), [4, 7]);
    assert.deepEqual(buildApexSeries({ series, points, chartType: 'treemap' }), [{ data: [{ x: 'A', y: 4 }, { x: 'B', y: 7 }] }]);
    assert.deepEqual(buildApexSeries({ series, points, chartType: 'radar' }), [{ name: 'Current', data: [4, 7] }]);
});

test('buildChartOptions labels one-value charts and categorises radar', () => {
    const pie = buildChartOptions({ config: { chart_type: 'pie' }, style: {}, series, points });
    assert.deepEqual(pie.labels, ['A', 'B']);
    assert.deepEqual(pie.series, [4, 7]);
    const radar = buildChartOptions({ config: { chart_type: 'radar' }, style: {}, series, points });
    assert.deepEqual(radar.xaxis.categories, ['A', 'B']);
});

test('windowAxis only applies to datetime time charts', () => {
    const span = { start: 10, end: 20 };
    assert.deepEqual(windowAxis({ chart_type: 'line' }, span), { min: 10, max: 20 });
    assert.deepEqual(windowAxis({ chart_type: 'pie' }, span), {});
    assert.deepEqual(windowAxis({ chart_type: 'line', xaxis_type: 'category' }, span), {});
    const opts = buildChartOptions({ config: { chart_type: 'line' }, style: {}, series, points, span });
    assert.equal(opts.xaxis.min, 10);
});

test('chartStyleDefaults maps components.chart tokens to style', () => {
    const tokens = { 'components.chart.colors': ['#f90'], 'components.chart.gridColor': '#333', 'components.chart.fontSize': 11 };
    assert.deepEqual(chartStyleDefaults(p => tokens[p]), {
        colors: { series: ['#f90'], grid: '#333' },
        typography: { font_size: 11 }
    });
});

test('time charts default to a datetime x-axis without xaxis_type', () => {
    const opts = buildChartOptions({ config: { chart_type: 'column' }, style: {}, series, points });
    assert.equal(opts.xaxis.type, 'datetime');
    const cat = buildChartOptions({ config: { chart_type: 'line', xaxis_type: 'category' }, style: {}, series, points });
    assert.equal(cat.xaxis.type, 'category');
});
