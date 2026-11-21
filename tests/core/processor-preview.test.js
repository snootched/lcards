/**
 * Processor preview (src/core/data-sources/processor-preview.js): runs a data
 * source's processing pipeline over history points with the real ProcessorManager.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { runProcessorPreview, formatResult } from '../../src/core/data-sources/processor-preview.js';
import { dataSourceBufferSize } from '../../src/core/data-sources/DataSource.js';

const MIN = 60_000;
/** Points one minute apart. */
const pts = (values) => values.map((v, i) => ({ t: i * MIN, v }));
const seriesNames = (r) => r.series.map(s => s.name);
const lastOf = (r, name) => r.series.find(s => s.name === name)?.points.at(-1)?.v;

test('runs processors in dependency order and charts each numeric output', () => {
    const r = runProcessorPreview({
        processing: {
            rounded: { type: 'round', input_source: 'fahrenheit', precision: 0 },
            fahrenheit: { type: 'convert_unit', from: 'c', to: 'f' },
        },
    }, pts([20, 21, 22]));
    assert.deepEqual(r.errors, []);
    assert.deepEqual(r.order, ['fahrenheit', 'rounded']);
    assert.deepEqual(seriesNames(r), ['raw', 'fahrenheit', 'rounded']);
    assert.equal(lastOf(r, 'fahrenheit'), 71.6);
    assert.equal(lastOf(r, 'rounded'), 72);
    assert.deepEqual(r.latest.map(l => [l.key, l.input, l.value]), [['fahrenheit', 'raw', '71.6'], ['rounded', 'fahrenheit', '72']]);
});

test('statistics and duration outputs flatten to one series per number; trend is not charted', () => {
    const r = runProcessorPreview({
        processing: {
            stats: { type: 'statistics', window: 'session', stats: ['min', 'max'] },
            warm: { type: 'duration', condition: '> 20' },
            direction: { type: 'trend', samples: 3 },
        },
    }, pts([18, 21, 22, 23]));
    assert.deepEqual(r.errors, []);
    assert.deepEqual(seriesNames(r), ['raw', 'stats.min', 'stats.max', 'warm (min)']);
    assert.equal(lastOf(r, 'stats.max'), 23);
    assert.equal(lastOf(r, 'warm (min)'), 2); // above 20 since the second sample
    assert.equal(r.latest.find(l => l.key === 'direction').value, 'increasing');
    assert.match(r.latest.find(l => l.key === 'warm').value, /duration_human: 2m/);
});

test('a series on a very different scale goes on the second axis', () => {
    const r = runProcessorPreview({
        processing: {
            kw: { type: 'convert_unit', from: 'w', to: 'kw' },
            smooth: { type: 'smooth', alpha: 0.5 },
        },
    }, pts([1000, 2000, 1500]));
    assert.deepEqual(r.series.map(s => [s.name, s.axis]), [['raw', 0], ['kw', 1], ['smooth', 0]]);
});

test('config errors come back as messages, not exceptions', () => {
    const msg = (processing) => runProcessorPreview({ processing }, pts([1, 2])).errors.join(' ');
    assert.match(msg({ a: { type: 'nope' } }), /Unknown processor type: nope/);
    assert.match(msg({ a: { type: 'round', input_source: 'missing' } }), /depends on unknown processor: missing/);
    assert.match(msg({ a: { type: 'round', input_source: 'b' }, b: { type: 'round', input_source: 'a' } }), /Circular dependency/);
    assert.match(msg({ a: { type: 'round', from: 'b' } }), /Use input_source/);
    assert.match(msg({ a: { precision: 1 } }), /missing required "type"/);
    assert.match(msg([{ type: 'round' }]), /map of processor names/);
    // An expression that throws at runtime returns null for every sample.
    assert.match(msg({ a: { type: 'expression', expression: 'value.nope.deeper' } }), /a: produced no values/);
});

test('the main buffer is sized like a live data source', () => {
    assert.deepEqual(dataSourceBufferSize({}), { windowSeconds: 60, capacity: 600 });
    assert.deepEqual(dataSourceBufferSize({ window_seconds: '5m' }), { windowSeconds: 300, capacity: 3000 });
    assert.deepEqual(dataSourceBufferSize({ windowSeconds: 3 }), { windowSeconds: 3, capacity: 60 });
});

test('formatResult', () => {
    assert.equal(formatResult(null), '-');
    assert.equal(formatResult(1 / 3), '0.333333');
    assert.equal(formatResult({ min: 1, max: 2.5, oldest: 0, newest: 9, window: '1h' }), 'min: 1 · max: 2.5 · window: 1h');
    assert.equal(formatResult('stable'), 'stable');
});

// Window-based processors chained with input_source must work on their input, not
// on the raw entity values in the data source's main buffer.
test('statistics over a time window uses its input_source, not the raw values', () => {
    const r = runProcessorPreview({
        processing: {
            fahrenheit: { type: 'convert_unit', from: 'c', to: 'f' },
            stats: { type: 'statistics', input_source: 'fahrenheit', window: '1h', stats: ['min', 'max'] },
        },
    }, pts([0, 100]));
    assert.equal(lastOf(r, 'stats.min'), 32);
    assert.equal(lastOf(r, 'stats.max'), 212);
});

test('gaussian smoothing uses its input_source, not the raw values', () => {
    const r = runProcessorPreview({
        processing: {
            doubled: { type: 'scale', input_range: [0, 1], output_range: [0, 2] },
            g: { type: 'smooth', method: 'gaussian', input_source: 'doubled', window: 3 },
        },
    }, pts([10, 10, 10, 10]));
    assert.equal(lastOf(r, 'g'), 20);
});

test('an expression runs after the processors in its sources, wherever they are listed', () => {
    const r = runProcessorPreview({
        processing: {
            sum: { type: 'expression', sources: ['a', 'b'], expression: 'sources[0] + sources[1]' },
            a: { type: 'scale', input_range: [0, 1], output_range: [0, 2] },
            b: { type: 'scale', input_range: [0, 1], output_range: [0, 3] },
        },
    }, pts([1, 2]));
    assert.deepEqual(r.errors, []);
    assert.deepEqual(r.order, ['a', 'b', 'sum']);
    assert.equal(lastOf(r, 'sum'), 10);
    assert.equal(r.latest.find(l => l.key === 'sum').input, 'raw + a + b');
    assert.match(runProcessorPreview({ processing: { s: { type: 'expression', sources: ['nope'], expression: 'v' } } }, pts([1])).errors.join(' '),
        /depends on unknown processor: nope/);
});
