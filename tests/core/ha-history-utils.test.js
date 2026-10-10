/**
 * ha-history-utils + DataSource history preload.
 *
 * Regressions covered:
 * - `attribute: 'state'` (written by the old chart series editor) was read as
 *   `attributes.state`, so every editor-built series was empty.
 * - The WS `history/history_during_period` reply was read as `reply[0]` with
 *   `state.state`; HA returns `{ [entity_id]: [{ s, a?, lc?, lu }] }`, so
 *   entities without long-term statistics never loaded history.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
    toNumericValue,
    normalizeAttribute,
    getNestedValue,
    historyNeedsAttributes,
    historyStatesToPoints
} from '../../src/core/data-sources/ha-history-utils.js';
import { DataSource } from '../../src/core/data-sources/DataSource.js';

test('toNumericValue: numbers, numeric strings, booleans, on/off', () => {
    assert.equal(toNumericValue(21.5), 21.5);
    assert.equal(toNumericValue('21.5'), 21.5);
    assert.equal(toNumericValue('on'), 1);
    assert.equal(toNumericValue('OFF'), 0);
    assert.equal(toNumericValue(true), 1);
    assert.equal(toNumericValue('unavailable'), null);
    assert.equal(toNumericValue('heat'), null);
    assert.equal(toNumericValue(NaN), null);
    assert.equal(toNumericValue(undefined), null);
});

test('toNumericValue: enum_mapping wins over parsing', () => {
    assert.equal(toNumericValue('heat', { heat: 2 }), 2);
    assert.equal(toNumericValue('on', { on: 5 }), 5);
    assert.equal(toNumericValue('cool', { heat: 2 }), null);
    assert.equal(toNumericValue('heat', { heat: 'x' }), null);
});

test('normalizeAttribute: state and empty mean the entity state', () => {
    assert.equal(normalizeAttribute('state'), null);
    assert.equal(normalizeAttribute(''), null);
    assert.equal(normalizeAttribute(undefined), null);
    assert.equal(normalizeAttribute('brightness'), 'brightness');
    assert.equal(historyNeedsAttributes({ attribute: 'state' }), false);
    assert.equal(historyNeedsAttributes({ attribute: 'brightness' }), true);
    assert.equal(historyNeedsAttributes({ attribute_path: 'a.b' }), true);
});

test('getNestedValue: dot and bracket paths', () => {
    const attrs = { forecast: [{ temperature: 12 }] };
    assert.equal(getNestedValue(attrs, 'forecast[0].temperature'), 12);
    assert.equal(getNestedValue(attrs, 'forecast.0.temperature'), 12);
    assert.equal(getNestedValue(attrs, 'forecast[3].temperature'), null);
});

test('historyStatesToPoints: compressed WS rows (lc falls back to lu, seconds)', () => {
    const points = historyStatesToPoints([
        { s: 'on', lu: 1000 },
        { s: 'off', lc: 1060, lu: 1090 },
        { s: 'unavailable', lu: 1100 },
        { s: 'on', lu: 1200 }
    ]);
    assert.deepEqual(points, [
        { t: 1_000_000, v: 1 },
        { t: 1_060_000, v: 0 },
        { t: 1_200_000, v: 1 }
    ]);
});

test('historyStatesToPoints: attributes carried forward when rows omit them', () => {
    const points = historyStatesToPoints([
        { s: 'on', a: { brightness: 100 }, lu: 1 },
        { s: 'on', lu: 2 },
        { s: 'on', a: { brightness: 50 }, lu: 3 }
    ], { attribute: 'brightness' });
    assert.deepEqual(points.map(p => p.v), [100, 100, 50]);
});

test('historyStatesToPoints: attribute series are timed by last_updated', () => {
    const points = historyStatesToPoints([
        { s: 'heat', a: { temperature: 20 }, lu: 100 },
        { s: 'heat', a: { temperature: 21 }, lc: 100, lu: 200 }
    ], { attribute: 'temperature' });
    assert.deepEqual(points, [{ t: 100_000, v: 20 }, { t: 200_000, v: 21 }]);
});

test('historyStatesToPoints: REST/full rows and attribute "state"', () => {
    const points = historyStatesToPoints([
        { state: '20.5', last_changed: '2026-10-01T00:00:00Z' },
        { state: '21', last_updated: '2026-10-01T01:00:00Z' }
    ], { attribute: 'state' });
    assert.deepEqual(points.map(p => p.v), [20.5, 21]);
    assert.equal(points[0].t, Date.parse('2026-10-01T00:00:00Z'));
});

/** Minimal fake connection: no statistics, WS history in the compressed shape. */
function fakeHass(entityId, rows, sent) {
    return {
        callService: () => {},
        connection: {
            sendMessagePromise: async (msg) => {
                sent.push(msg);
                if (msg.type === 'recorder/statistics_during_period') return {};
                if (msg.type === 'history/history_during_period') return { [entityId]: rows };
                throw new Error(`unexpected ${msg.type}`);
            }
        }
    };
}

test('DataSource: attribute "state" is normalised away', () => {
    const ds = new DataSource({ entity: 'light.tv', attribute: 'state' }, null);
    assert.equal('attribute' in ds.cfg, false);
});

test('DataSource: WS history preload loads an on/off entity without statistics', async () => {
    const now = Date.now() / 1000;
    const sent = [];
    const ds = new DataSource(
        { entity: 'light.tv', attribute: 'state', history: { hours: 1 } },
        fakeHass('light.tv', [{ s: 'on', lu: now - 600 }, { s: 'off', lu: now - 60 }], sent)
    );
    await ds._preloadHistory();

    assert.deepEqual(ds.buffer.getAll().map(p => p.v), [1, 0]);
    const historyMsg = sent.find(m => m.type === 'history/history_during_period');
    assert.equal(historyMsg.no_attributes, true);
    assert.equal(historyMsg.minimal_response, true);
});

test('DataSource: attribute series skip statistics and request attributes', async () => {
    const now = Date.now() / 1000;
    const sent = [];
    const ds = new DataSource(
        { entity: 'light.tv', attribute: 'brightness', history: { hours: 1 } },
        fakeHass('light.tv', [{ s: 'on', a: { brightness: 128 }, lu: now - 60 }], sent)
    );
    await ds._preloadHistory();

    assert.deepEqual(ds.buffer.getAll().map(p => p.v), [128]);
    assert.equal(sent.some(m => m.type === 'recorder/statistics_during_period'), false);
    const historyMsg = sent.find(m => m.type === 'history/history_during_period');
    assert.equal(historyMsg.no_attributes, false);
    assert.equal(historyMsg.minimal_response, false);
});

test('DataSource: history.enabled false (and legacy preload false) skips preload', async () => {
    for (const history of [{ enabled: false }, { preload: false }]) {
        const sent = [];
        const ds = new DataSource({ entity: 'sensor.t', history }, fakeHass('sensor.t', [], sent));
        await ds._preloadHistory();
        assert.equal(sent.length, 0);
    }
});
