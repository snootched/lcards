/**
 * sync_group (E1.3): the shared time cursor bus and plot maths
 * (charts/chart-sync-group.js), and the ApexCharts group options.
 */
import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { joinSyncGroup, publishSyncTime, apexShowsCursor, timeAtX, xAtTime, resetSyncGroups } from '../../src/charts/chart-sync-group.js';

globalThis.document ??= /** @type {any} */ ({ documentElement: {} });
globalThis.getComputedStyle ??= /** @type {any} */ (() => ({ getPropertyValue: () => '' }));
const { buildChartOptions, windowAxis, SYNC_GROUP_LABEL_WIDTH, SYNC_WINDOW_STEP_MS } = await import('../../src/charts/chart-options-builder.js');

beforeEach(() => resetSyncGroups());

const member = (window = { min: 0, max: 100 }, synced = true) => {
    const seen = [];
    return { seen, showTime: (t, source) => seen.push([t, source]), window: () => window, apexSynced: () => synced };
};

test('publishSyncTime: every other member of the group hears it, the source and other groups do not', () => {
    const a = member(); const b = member(); const c = member(); const other = member();
    joinSyncGroup('g', a); joinSyncGroup('g', b); const leaveC = joinSyncGroup('g', c); joinSyncGroup('h', other);
    publishSyncTime('g', a, 42);
    assert.deepEqual(a.seen, []);
    assert.deepEqual(b.seen, [[42, a]]);
    assert.deepEqual(c.seen, [[42, a]]);
    assert.deepEqual(other.seen, []);
    leaveC();
    publishSyncTime('g', a, null);
    assert.equal(c.seen.length, 1, 'a member that left hears nothing more');
    assert.deepEqual(b.seen.at(-1), [null, a]);
});

test('apexShowsCursor: only between non-timeline charts with the same window', () => {
    assert.equal(apexShowsCursor(member(), member()), true);
    assert.equal(apexShowsCursor(member({ min: 0, max: 100 }), member({ min: 1, max: 100 })), false, 'ApexCharts needs the very same range');
    assert.equal(apexShowsCursor(member({ min: 0, max: 100 }), member({ min: 0, max: 5000 })), false, 'another window');
    assert.equal(apexShowsCursor(member(undefined, false), member()), false, 'a timeline never syncs');
});

test('timeAtX / xAtTime: across the plot, null outside it', () => {
    const w = { min: 1000, max: 2000 };
    assert.equal(timeAtX(50, 200, w), 1250);
    assert.equal(timeAtX(-1, 200, w), null);
    assert.equal(timeAtX(201, 200, w), null);
    assert.equal(xAtTime(1250, 200, w), 50);
    assert.equal(xAtTime(999, 200, w), null);
    assert.equal(xAtTime(1500, 200, { min: 5, max: 5 }), null);
});

test('buildChartOptions sync_group: ApexCharts group and id, y labels at least 60 px; timelines keep out of the group', () => {
    const base = { style: {}, series: [{ name: 'A' }], points: [[{ t: 0, v: 1 }]], span: { start: 0, end: 10 } };
    const line = buildChartOptions({ ...base, config: { chart_type: 'line', sync_group: 'hall' }, chartId: 'lcards-chart-x' });
    assert.equal(line.chart.group, 'hall');
    assert.equal(line.chart.id, 'lcards-chart-x');
    const axes = Array.isArray(line.yaxis) ? line.yaxis : [line.yaxis];
    assert.ok(axes.every((a) => a.labels.minWidth === SYNC_GROUP_LABEL_WIDTH));
    const timeline = buildChartOptions({ ...base, config: { chart_type: 'rangeBar', sync_group: 'hall' }, points: [[{ t: 0, v: 'on' }, { t: 10, v: 'on' }]], chartId: 'lcards-chart-y' });
    assert.equal(timeline.chart.group, undefined);
    const plain = buildChartOptions({ ...base, config: { chart_type: 'line' } });
    assert.equal(plain.chart.group, undefined);
    // a width of the user's own wins
    const own = buildChartOptions({ ...base, config: { chart_type: 'line', sync_group: 'hall' }, style: { chart_options: { yaxis: { labels: { minWidth: 90 } } } } });
    assert.equal((Array.isArray(own.yaxis) ? own.yaxis[0] : own.yaxis).labels.minWidth, 90);
});

test('windowAxis sync_group: a rolling window ends on the next whole minute, so members match', () => {
    const span = (now) => ({ start: now - 3_600_000, end: now });
    const config = { chart_type: 'line', sync_group: 'hall' };
    const a = windowAxis(config, span(1_000_000_123));
    const b = windowAxis(config, span(1_000_010_456));
    assert.deepEqual(a, b, 'two cards a few seconds apart');
    assert.equal(a.max % SYNC_WINDOW_STEP_MS, 0);
    assert.equal(a.max - a.min, 3_600_000);
    assert.deepEqual(windowAxis({ chart_type: 'line' }, span(1_000_000_123)), { min: 1_000_000_123 - 3_600_000, max: 1_000_000_123 }, 'no group: unchanged');
    assert.deepEqual(windowAxis({ ...config, span: { start: 'day' } }, span(1_000_000_123)).max, 1_000_000_123, 'aligned windows are already shared');
});
