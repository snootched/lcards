/**
 * ChartSeriesFetcher + normalizeChartSources against a mock HA connection.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ChartSeriesFetcher, trimToWindow, windowPoints } from '../../src/charts/chart-series-fetcher.js';
import { normalizeChartSources, arrayChartProblem } from '../../src/charts/chart-sources.js';

const tick = () => new Promise(r => setTimeout(r, 5));

/** Mock connection: records subscriptions, lets the test push stream messages. */
function mockConnection() {
    const subs = [];
    const listeners = new Map();
    const sent = [];
    return {
        subs, sent, listeners,
        async subscribeMessage(cb, message, options) {
            const sub = { cb, message, options, active: true };
            subs.push(sub);
            return async () => { sub.active = false; };
        },
        async sendMessagePromise(message) {
            sent.push(message);
            return { 'sensor.energy': [
                { start: Date.now() - 2 * 3_600_000, mean: 1, min: 0, max: 2, sum: 10 },
                { start: Date.now() - 3_600_000, mean: 3, min: 2, max: 4, sum: 20 }
            ] };
        },
        addEventListener(type, fn) { listeners.set(fn, type); },
        removeEventListener(type, fn) { listeners.delete(fn); },
        fire(type) { for (const [fn, t] of listeners) if (t === type) fn(); }
    };
}

function makeFetcher(connection, dsManager = null) {
    const updates = [];
    const fetcher = new ChartSeriesFetcher({
        getHass: () => ({ connection }),
        getDataSourceManager: () => dsManager,
        onUpdate: (index, points) => updates.push({ index, points }),
        throttleMs: 0
    });
    return { fetcher, updates };
}

test('normalizeChartSources: kinds, legacy migration, rangeArea statistics', () => {
    const series = normalizeChartSources({
        chart_type: 'rangeArea',
        source: 'sensor.legacy'
    });
    assert.deepEqual(series.map(s => s.kind), ['history']);

    const stats = normalizeChartSources({
        chart_type: 'rangeArea',
        sources: [{ entity: 'sensor.e', statistics: { type: 'max' } }, { datasource: 'ds' }]
    });
    assert.equal(stats[0].kind, 'statistics');
    assert.equal(stats[0].statistics.period, 'hour');
    assert.equal(stats[0].fetchMinMax, true);
    assert.equal(stats[1].kind, 'datasource');
    assert.equal(arrayChartProblem(stats[0], 'rangeArea'), null);
    assert.match(arrayChartProblem({ kind: 'history' }, 'boxPlot'), /func: box/);
});

test('trimToWindow keeps a carry-in point at the window start', () => {
    const out = trimToWindow([{ t: 0, v: 1 }, { t: 50, v: 2 }, { t: 150, v: 3 }], 100);
    assert.deepEqual(out, [{ t: 100, v: 2 }, { t: 150, v: 3 }]);
});

test('history: initial stream message replaces, later messages append', async () => {
    const conn = mockConnection();
    const { fetcher, updates } = makeFetcher(conn);
    fetcher.start([{ kind: 'history', entity: 'light.tv' }], { graph_span: '1h' });
    await tick();

    const sub = conn.subs[0];
    assert.equal(sub.message.type, 'history/stream');
    assert.equal(sub.message.no_attributes, true);
    assert.deepEqual(sub.options, { resubscribe: false });

    const now = Date.now() / 1000;
    sub.cb({ states: { 'light.tv': [{ s: 'on', lu: now - 600 }] } });
    sub.cb({ states: { 'light.tv': [{ s: 'off', lu: now - 10 }] } });
    await tick();

    const last = updates.at(-1);
    assert.equal(last.index, 0);
    // the last state carried to now
    assert.deepEqual(last.points.map(p => p.v), [1, 0, 0]);
    fetcher.stop();
});

test('history: reconnect resubscribes with fresh params; stop removes the listener', async () => {
    const conn = mockConnection();
    const { fetcher } = makeFetcher(conn);
    fetcher.start([{ kind: 'history', entity: 'sensor.t', attribute: 'temperature' }], { graph_span: '1h' });
    await tick();
    assert.equal(conn.subs[0].message.no_attributes, false);

    conn.fire('ready');
    await tick();
    assert.equal(conn.subs.length, 2);

    fetcher.stop();
    await tick();
    assert.equal(conn.listeners.size, 0);
    assert.equal(conn.subs[1].active, false);
});

test('history: group_by buckets the stream', async () => {
    const conn = mockConnection();
    const { fetcher, updates } = makeFetcher(conn);
    fetcher.start([{ kind: 'history', entity: 'sensor.t', group_by: { func: 'max', duration: '30min' } }], { graph_span: '1h' });
    await tick();
    const now = Date.now() / 1000;
    conn.subs[0].cb({ states: { 'sensor.t': [{ s: '1', lu: now - 3000 }, { s: '5', lu: now - 2900 }, { s: '2', lu: now - 60 }] } });
    await tick();
    const values = updates.at(-1).points.map(p => p.v);
    assert.ok(values.includes(5), JSON.stringify(values));
    fetcher.stop();
});

test('statistics: requested type/period, min+max for rangeArea', async () => {
    const conn = mockConnection();
    const { fetcher, updates } = makeFetcher(conn);
    fetcher.start([
        { kind: 'statistics', entity: 'sensor.energy', statistics: { type: 'sum', period: 'hour' } },
        { kind: 'statistics', entity: 'sensor.energy', statistics: { type: 'mean', period: 'day' }, fetchMinMax: true }
    ], { graph_span: '24h' });
    await tick();
    assert.deepEqual(conn.sent.map(m => [m.period, m.types]), [['hour', ['sum']], ['day', ['min', 'max']]]);
    const byIndex = Object.fromEntries(updates.map(u => [u.index, u.points.map(p => p.v)]));
    assert.deepEqual(byIndex[0].slice(-2), [10, 20]);
    assert.deepEqual(byIndex[1].slice(-2), [[0, 2], [2, 4]]);
    fetcher.stop();
});

test('datasource: reads the processor buffer and follows updates', async () => {
    const t = Date.now();
    const subscribers = new Set();
    const buffer = (values) => ({ getAll: () => values.map((v, i) => ({ t: t - 1000 + i, v })) });
    let smoothed = buffer([1, 2]);
    const source = {
        buffer: buffer([9]),
        getProcessorBuffer: (key) => (key === 'smoothed' ? smoothed : null),
        subscribe: (fn) => { subscribers.add(fn); return () => subscribers.delete(fn); }
    };
    const { fetcher, updates } = makeFetcher(mockConnection(), { getSource: () => source });
    fetcher.start([{ kind: 'datasource', datasource: 'temp', buffer: 'smoothed' }], { graph_span: '1h' });
    await tick();
    // the last value carried to now
    assert.deepEqual(updates.at(-1).points.map(p => p.v), [1, 2, 2]);

    smoothed = buffer([1, 2, 3]);
    subscribers.forEach(fn => fn());
    await tick();
    assert.deepEqual(updates.at(-1).points.map(p => p.v), [1, 2, 3, 3]);

    fetcher.stop();
    assert.equal(subscribers.size, 0);
});

test('windowPoints: statistics get no carry-in point (it would add a bar)', async () => {
    const { windowPoints } = await import('../../src/charts/chart-series-fetcher.js');
    const span = { start: 100, end: 400 };
    const raw = [{ t: 50, v: 1 }, { t: 150, v: 2 }, { t: 250, v: 3 }];
    assert.deepEqual(windowPoints({ kind: 'statistics' }, raw, span, 1000), [{ t: 150, v: 2 }, { t: 250, v: 3 }]);
    assert.deepEqual(windowPoints({ kind: 'history' }, raw, span, 1000)[0], { t: 100, v: 1 });
});

test('windowPoints: a state holds until it changes: the last value runs to now, or to the end of a window in the past', () => {
    const now = 10_000;
    const span = { start: 4_000, end: 12_000 };
    // unchanged since before the window: one value from the left edge to now (it drew nothing before)
    assert.deepEqual(windowPoints({ kind: 'history' }, [{ t: 1_000, v: 64 }], span, now), [{ t: 4_000, v: 64 }, { t: 10_000, v: 64 }]);
    // the last change, then carried to now
    assert.deepEqual(windowPoints({ kind: 'history' }, [{ t: 5_000, v: 1 }, { t: 8_000, v: 3 }], span, now).at(-1), { t: 10_000, v: 3 });
    // a window that ended in the past stops at its end
    assert.deepEqual(windowPoints({ kind: 'history' }, [{ t: 5_000, v: 1 }], { start: 4_000, end: 6_000 }, now).at(-1), { t: 6_000, v: 1 });
    // a point at now is not doubled; statistics carry nothing
    assert.equal(windowPoints({ kind: 'history' }, [{ t: 10_000, v: 2 }], span, now).filter(p => p.t === 10_000).length, 1);
    assert.deepEqual(windowPoints({ kind: 'statistics' }, [{ t: 5_000, v: 1 }], span, now), [{ t: 5_000, v: 1 }]);
});

test('history: a live change draws at once (a rolling window ends now at every flush, not at the last minute tick)', async () => {
    const conn = mockConnection();
    const { fetcher, updates } = makeFetcher(conn);
    try {
        fetcher.start([{ kind: 'history', entity: 'input_number.power' }], { graph_span: '1h' });
        await tick();
        const sub = conn.subs[0];
        sub.cb({ states: { 'input_number.power': [{ s: '20', lu: Date.now() / 1000 - 600 }] } });
        await tick();
        // later than the window computed at start: before, it waited for the next minute tick
        await new Promise(r => setTimeout(r, 30));
        sub.cb({ states: { 'input_number.power': [{ s: '80', lu: Date.now() / 1000 }] } });
        await tick();
        const values = updates.at(-1).points.map(p => p.v);
        assert.equal(values.at(-1), 80, `latest drawn: ${values}`);
        assert.ok(fetcher.span.end >= Date.now() - 50, 'the window ends now');
    } finally {
        fetcher.stop();
    }
});
