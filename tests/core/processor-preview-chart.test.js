/**
 * Processor preview chart options (src/core/data-sources/processor-preview-chart.js).
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { processorPreviewChartOptions, seriesProcessorKey, formatAxisValue } from '../../src/core/data-sources/processor-preview-chart.js';

const series = [
    { name: 'raw', points: [{ t: 1, v: 1000 }], axis: 0, raw: true },
    { name: 'kw', points: [{ t: 1, v: 1 }], axis: 1 },
    { name: 'stats.min', points: [{ t: 1, v: 900 }], axis: 0 },
];

test('raw is dashed and muted; second-axis series share one right-hand axis', () => {
    const o = processorPreviewChartOptions(series, { rawColor: '#888', colors: ['#a', '#b'] });
    assert.deepEqual(o.colors, ['#888', '#a', '#b']);
    assert.deepEqual(o.stroke.dashArray, [3, 0, 0]);
    assert.deepEqual(o.yaxis.map(y => [y.seriesName, y.opposite, y.show]), [['raw', false, true], ['kw', true, true], ['raw', false, false]]);
    assert.deepEqual(o.series.map(s => s.data), [[[1, 1000]], [[1, 1]], [[1, 900]]]);
});

test('the selected processor is drawn heavier, the rest lighter', () => {
    assert.deepEqual(processorPreviewChartOptions(series).stroke.width, [1.5, 2.5, 2.5]);
    assert.deepEqual(processorPreviewChartOptions(series, { selected: 'stats' }).stroke.width, [1.5, 1.5, 3.5]);
});

test('series names map back to their processor; axis labels stay compact', () => {
    assert.equal(seriesProcessorKey('stats.min'), 'stats');
    assert.equal(seriesProcessorKey('warm (min)'), 'warm');
    assert.equal(seriesProcessorKey('kw'), 'kw');
    assert.deepEqual([1234.5, 12.34, 0.01234, 0, NaN].map(formatAxisValue), ['1235', '12.3', '0.012', '0', '']);
    assert.equal(processorPreviewChartOptions([]).series.length, 1); // an empty chart still has the raw slot
});
