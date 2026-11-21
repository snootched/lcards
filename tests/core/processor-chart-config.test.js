/**
 * Chart config for a processor preview (src/core/data-sources/processor-chart-config.js),
 * offered by the data source dialog and the docs lab.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import yaml from 'js-yaml';
import { processorChartConfig, processorChartYaml } from '../../src/core/data-sources/processor-chart-config.js';
import { runProcessorPreview } from '../../src/core/data-sources/processor-preview.js';

const pts = Array.from({ length: 30 }, (_, i) => ({ t: i * 60_000, v: 1000 + (i % 5) * 100 }));
const entry = {
    entity: 'sensor.power',
    history: { hours: 12 },
    processing: {
        kw: { type: 'convert_unit', from: 'w', to: 'kw' },
        stats: { type: 'statistics', window: '1h', stats: ['max'] },
    },
};

test('one series per charted output, a second axis when the preview has one, helpers for object outputs', () => {
    const { series } = runProcessorPreview(entry, pts);
    const { chart, helpers } = processorChartConfig(entry, series);
    assert.equal(chart.type, 'custom:lcards-chart');
    assert.equal(chart.graph_span, '12h');
    assert.deepEqual(Object.keys(chart.data_sources), ['power']);
    assert.deepEqual(chart.sources.map(s => s.buffer ?? 'raw'), ['raw', 'kw', 'stats_max']);
    assert.equal(chart.sources.find(s => s.buffer === 'kw').yaxis_id, 'second');
    assert.deepEqual(helpers, ['stats_max']);
    assert.equal(chart.data_sources.power.processing.stats_max.type, 'expression');
    // The chart's data source still runs cleanly, and the helper produces numbers.
    const rerun = runProcessorPreview(chart.data_sources.power, pts);
    assert.deepEqual(rerun.errors, []);
    assert.ok(rerun.series.some(s => s.name === 'stats_max'));
});

test('name and span options; nothing without an entity or series; YAML notes the helpers', () => {
    const { series } = runProcessorPreview(entry, pts);
    assert.deepEqual(Object.keys(processorChartConfig(entry, series, { name: 'house', hours: 48 }).chart.data_sources), ['house']);
    assert.equal(processorChartConfig(entry, series, { hours: 48 }).chart.data_sources.power.history.hours, 48);
    assert.equal(processorChartConfig({ processing: {} }, series), null);
    assert.equal(processorChartConfig(entry, []), null);
    const text = processorChartYaml(entry, series);
    assert.match(text, /^# Added for the chart \(a series plots numbers\): stats_max\n/);
    assert.equal(yaml.load(text).type, 'custom:lcards-chart');
});
