/**
 * chart-span (time window) and chart-group-by (bucketing).
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseDuration, computeSpan, startOfUnit, endOfUnit } from '../../src/charts/chart-span.js';
import { groupBy } from '../../src/charts/chart-group-by.js';

const H = 3_600_000;
const local = (...args) => new Date(...args).getTime();

test('parseDuration: units, signs, plurals, invalid', () => {
    assert.equal(parseDuration('10min'), 600_000);
    assert.equal(parseDuration('1h'), H);
    assert.equal(parseDuration('2 days'), 2 * 24 * H);
    assert.equal(parseDuration('-1d'), -24 * H);
    assert.equal(parseDuration('+30s'), 30_000);
    assert.equal(parseDuration('1.5h'), 1.5 * H);
    assert.equal(parseDuration('1mo'), 30 * 24 * H);
    assert.equal(parseDuration('soon'), null);
    assert.equal(parseDuration(undefined), null);
});

test('computeSpan: rolling window ending now (default 24h)', () => {
    const now = local(2026, 9, 7, 15, 30);
    assert.deepEqual(computeSpan({}, now), { start: now - 24 * H, end: now, duration: 24 * H, live: true });
    assert.equal(computeSpan({ graph_span: '6h' }, now).start, now - 6 * H);
});

test('computeSpan: span.start aligns to the start of today', () => {
    const now = local(2026, 9, 7, 15, 30);
    const span = computeSpan({ graph_span: '24h', span: { start: 'day' } }, now);
    assert.equal(span.start, local(2026, 9, 7));
    assert.equal(span.end, local(2026, 9, 8));
    assert.equal(span.live, true);
});

test('computeSpan: span.end and offset (yesterday is not live)', () => {
    const now = local(2026, 9, 7, 15, 30);
    const thisWeek = computeSpan({ graph_span: '7d', span: { end: 'week' } }, now);
    assert.equal(thisWeek.end, local(2026, 9, 12)); // Monday after Wed 7 Oct is 12 Oct
    const yesterday = computeSpan({ graph_span: '24h', span: { start: 'day', offset: '-1d' } }, now);
    assert.equal(yesterday.start, local(2026, 9, 6));
    assert.equal(yesterday.live, false);
});

test('startOfUnit/endOfUnit: week start and month rollover', () => {
    const wed = local(2026, 9, 7, 12);
    assert.equal(startOfUnit(wed, 'week', 1), local(2026, 9, 5)); // Monday
    assert.equal(startOfUnit(wed, 'week', 0), local(2026, 9, 4)); // Sunday
    assert.equal(endOfUnit(local(2026, 11, 31, 23), 'month'), local(2027, 0, 1));
});

test('startOfUnit: day across a DST change is local midnight', () => {
    // Whatever the test machine's zone, the result must be local midnight.
    const t = local(2026, 2, 29, 12);
    const d = new Date(startOfUnit(t, 'day'));
    assert.equal(d.getHours(), 0);
    assert.equal(d.getDate(), 29);
});

const pts = (...pairs) => pairs.map(([t, v]) => ({ t, v }));
const win = { start: 0, end: 4 * H };
const NOW = 10 * H;

test('groupBy: scalar functions per bucket', () => {
    const points = pts([0, 1], [0.5 * H, 3], [H, 10], [1.5 * H, 20]);
    const run = (func) => groupBy(points, { func, duration: '1h', fill: 'null' }, { start: 0, end: 2 * H }, NOW).map(p => p.v);
    assert.deepEqual(run('avg'), [2, 15]);
    assert.deepEqual(run('min'), [1, 10]);
    assert.deepEqual(run('max'), [3, 20]);
    assert.deepEqual(run('first'), [1, 10]);
    assert.deepEqual(run('last'), [3, 20]);
    assert.deepEqual(run('sum'), [4, 30]);
    assert.deepEqual(run('delta'), [2, 10]);
    assert.deepEqual(run('diff'), [0, 17]);
});

test('groupBy: array functions for range charts', () => {
    const points = pts([0, 5], [0.2 * H, 1], [0.4 * H, 9], [0.6 * H, 3], [0.8 * H, 7]);
    const one = (func) => groupBy(points, { func, duration: '1h' }, { start: 0, end: H }, NOW)[0].v;
    assert.deepEqual(one('minmax'), [1, 9]);
    assert.deepEqual(one('box'), [1, 3, 5, 7, 9]);
    assert.deepEqual(one('ohlc'), [5, 9, 1, 7]);
    assert.equal(one('median'), 5);
});

test('groupBy: fill modes for empty buckets, seeded by points before the window', () => {
    const points = pts([-H, 4], [2.5 * H, 8]);
    const run = (fill) => groupBy(points, { func: 'avg', duration: '1h', fill }, win, NOW).map(p => p.v);
    assert.deepEqual(run('last'), [4, 4, 8, 8]);
    assert.deepEqual(run('null'), [null, null, 8, null]);
    assert.deepEqual(run('zero'), [0, 0, 8, 0]);
});

test('groupBy: never creates buckets in the future, stamps bucket starts', () => {
    const out = groupBy(pts([0, 1]), { duration: '1h' }, { start: 0, end: 24 * H }, 2.5 * H);
    assert.deepEqual(out.map(p => p.t), [0, H, 2 * H]);
});

test('groupBy: invalid duration returns points unchanged', () => {
    const points = pts([0, 1]);
    assert.equal(groupBy(points, { duration: 'nope' }, win, NOW), points);
});
