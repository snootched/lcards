/**
 * Data source history (src/core/data-sources/history-fetch.js): what a DataSource
 * preloads, and what the editor's processor preview fetches.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fetchDataSourceHistory, historySettings, statisticValue } from '../../src/core/data-sources/history-fetch.js';

const NOW = Date.UTC(2026, 9, 11, 12);

/** A hass whose websocket answers by message type (a function, a value, or an Error to throw). */
function hassWith(handlers) {
    const sent = [];
    return {
        sent,
        connection: {
            sendMessagePromise: async (msg) => {
                sent.push(msg);
                const h = handlers[msg.type];
                const out = typeof h === 'function' ? h(msg) : h;
                if (out instanceof Error) throw out;
                if (out === undefined) throw new Error(`unexpected ${msg.type}`);
                return out;
            },
        },
        auth: { accessToken: 'token' },
    };
}

test('historySettings: on by default, 6 h, clamped to 1-168; enabled/preload false turn it off', () => {
    assert.deepEqual(historySettings({}), { enabled: true, hours: 6 });
    assert.deepEqual(historySettings({ history: { hours: 500 } }), { enabled: true, hours: 168 });
    assert.deepEqual(historySettings({ history: { days: 2 } }), { enabled: true, hours: 48 });
    assert.deepEqual(historySettings({ history: { hours: 0.2 } }), { enabled: true, hours: 1 });
    assert.equal(historySettings({ history: { enabled: false } }).enabled, false);
    assert.equal(historySettings({ history: { preload: false } }).enabled, false);
    assert.equal(historySettings({ history: { preload: true } }).enabled, true);
});

test('statisticValue prefers mean, then state, sum, max, min', () => {
    assert.equal(statisticValue({ mean: 2, state: 9 }), 2);
    assert.equal(statisticValue({ state: 9, sum: 1 }), 9);
    assert.equal(statisticValue({ min: 4 }), 4);
    assert.equal(statisticValue({}), null);
});

test('hourly statistics first, over the requested span', async () => {
    const hass = hassWith({
        'recorder/statistics_during_period': { 'sensor.t': [
            { start: NOW - 7_200_000, mean: 20.5 }, { start: NOW - 3_600_000, mean: 21 }, { start: NOW, mean: null },
        ] },
    });
    const r = await fetchDataSourceHistory(hass, { entity: 'sensor.t', history: { hours: 2 } }, { now: NOW });
    assert.equal(r.method, 'statistics');
    assert.deepEqual(r.points.map(p => p.v), [20.5, 21]);
    const msg = hass.sent[0];
    assert.equal(msg.period, 'hour');
    assert.equal(new Date(msg.start_time).getTime(), NOW - 2 * 3_600_000);
});

test('no statistics for the entity: state history, with enum_mapping', async () => {
    const hass = hassWith({
        'recorder/statistics_during_period': {},
        'history/history_during_period': { 'select.mode': [{ s: 'heat', lu: NOW / 1000 - 60 }, { s: 'off', lu: NOW / 1000 - 30 }] },
    });
    const r = await fetchDataSourceHistory(hass, { entity: 'select.mode', enum_mapping: { heat: 2, off: 0 } }, { now: NOW });
    assert.equal(r.method, 'history');
    assert.deepEqual(r.points.map(p => p.v), [2, 0]);
});

test('statistics failing falls back to state history; attribute sources skip statistics', async () => {
    const failing = hassWith({
        'recorder/statistics_during_period': new Error('no recorder'),
        'history/history_during_period': { 'sensor.t': [{ s: '5', lu: NOW / 1000 }] },
    });
    assert.equal((await fetchDataSourceHistory(failing, { entity: 'sensor.t' }, { now: NOW })).method, 'history');

    const attr = hassWith({ 'history/history_during_period': { 'light.l': [{ s: 'on', a: { brightness: 99 }, lu: NOW / 1000 }] } });
    const r = await fetchDataSourceHistory(attr, { entity: 'light.l', attribute: 'brightness' }, { now: NOW });
    assert.deepEqual(r.points.map(p => p.v), [99]);
    assert.equal(attr.sent.some(m => m.type === 'recorder/statistics_during_period'), false);
    assert.equal(attr.sent[0].no_attributes, false);
});

test('websocket history failing falls back to REST', async () => {
    const hass = hassWith({
        'recorder/statistics_during_period': {},
        'history/history_during_period': new Error('socket closed'),
    });
    const realFetch = globalThis.fetch;
    let url = null;
    globalThis.fetch = async (u) => { url = u; return { ok: true, json: async () => [[{ state: '7', last_updated: new Date(NOW).toISOString() }]] }; };
    try {
        const r = await fetchDataSourceHistory(hass, { entity: 'sensor.t' }, { now: NOW });
        assert.equal(r.method, 'rest');
        assert.deepEqual(r.points.map(p => p.v), [7]);
        assert.match(url, /filter_entity_id=sensor\.t&minimal_response&no_attributes/);
    } finally {
        globalThis.fetch = realFetch;
    }
});

test('no connection or entity: nothing', async () => {
    assert.deepEqual(await fetchDataSourceHistory({}, { entity: 'sensor.t' }), { points: [], method: 'none' });
    assert.deepEqual(await fetchDataSourceHistory(hassWith({}), {}), { points: [], method: 'none' });
});

import { withHistorySettings } from '../../src/core/data-sources/history-fetch.js';

test('withHistorySettings writes history the current way', () => {
    // Off: enabled false (no deprecated preload); on again: back to the default.
    const off = withHistorySettings({ entity: 'sensor.t' }, { enabled: false });
    assert.deepEqual(off, { entity: 'sensor.t', history: { enabled: false } });
    assert.deepEqual(withHistorySettings(off, { enabled: true }), { entity: 'sensor.t' });
    // A span: kept, clamped; the default span needs no key.
    assert.deepEqual(withHistorySettings({}, { hours: 24 }), { history: { hours: 24 } });
    assert.deepEqual(withHistorySettings({}, { hours: 500 }), { history: { hours: 168 } });
    assert.deepEqual(withHistorySettings({ history: { hours: 24 } }, { hours: 6 }), {});
    // Old spellings: preload true + days become hours; preload false stays off.
    assert.deepEqual(withHistorySettings({ history: { preload: true, days: 2 } }, {}), { history: { hours: 48 } });
    assert.deepEqual(withHistorySettings({ history: { preload: false, hours: 12 } }, {}), { history: { enabled: false, hours: 12 } });
    // Turning it off keeps the span for later.
    assert.deepEqual(withHistorySettings({ history: { hours: 12 } }, { enabled: false }), { history: { enabled: false, hours: 12 } });
});
