/**
 * DataSource emit policy and lifecycle (d3b bugs DS1-DS5).
 *
 * DS1: min_emit_ms / coalesce_ms / max_delay_ms / emit_on_same_value shape when
 *      subscribers are called; the buffer and processors still see every value.
 * DS2: stats.updates counts accepted live updates.
 * DS3: the first value is processed once when the manager creates a source.
 * DS4: ingestHass and getEntity have no dead paths.
 * DS5: a card-created source stops after its last card leaves (with a grace delay).
 */
import { test, mock, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { DataSource } from '../../src/core/data-sources/DataSource.js';
import { DataSourceManager, SOURCE_RELEASE_DELAY_MS } from '../../src/core/data-sources/DataSourceManager.js';
import { ProcessorManager } from '../../src/core/data-sources/ProcessorManager.js';
import { createFakeHass } from '../helpers/fake-hass.js';

const ENTITY = 'sensor.temp';
const NO_HISTORY = { history: { enabled: false } };

afterEach(() => mock.timers.reset());

/** Start a DataSource on a fake HASS; returns helpers to push events and read emits. */
async function startSource(cfg = {}) {
    const hass = createFakeHass({ states: { [ENTITY]: '10' } });
    const ds = new DataSource({ entity: ENTITY, ...NO_HISTORY, ...cfg }, hass);
    await ds.start();
    const subIndex = hass.connection.subs.findIndex(s => s.message?.type === 'subscribe_events');
    const emits = [];
    ds.subscribers.add((data) => emits.push(data));
    const push = (value) => hass.connection.push(subIndex, {
        event_type: 'state_changed',
        data: { entity_id: ENTITY, new_state: { entity_id: ENTITY, state: String(value), attributes: { unit_of_measurement: '°C' } } }
    });
    return { ds, hass, emits, push };
}

const useClock = () => mock.timers.enable({ apis: ['setTimeout', 'setInterval', 'Date'], now: 1_000_000 });

test('DS1: a sparse update emits at once (leading edge, no added lag)', async () => {
    useClock();
    const { emits, push } = await startSource();
    push(11);
    assert.equal(emits.length, 1, 'emitted synchronously');
    assert.equal(emits[0].v, 11);
    mock.timers.tick(500);
    push(12);
    assert.equal(emits.length, 2);
    assert.equal(emits[1].v, 12);
});

test('DS1: a burst inside min_emit_ms coalesces into one trailing emit of the last value', async () => {
    useClock();
    const { ds, emits, push } = await startSource({ min_emit_ms: 100, coalesce_ms: 40, max_delay_ms: 120 });
    const seen = [];
    const orig = ds.processorManager.process.bind(ds.processorManager);
    ds.processorManager.process = (v, t, b) => { seen.push(v); return orig(v, t, b); };

    push(11);                         // leading emit
    for (const v of [12, 13, 14, 15]) { mock.timers.tick(10); push(v); }
    assert.equal(emits.length, 1, 'only the leading emit so far');
    assert.deepEqual(seen, [11, 12, 13, 14, 15], 'processors see every value');

    mock.timers.tick(120);
    assert.equal(emits.length, 2, 'one trailing emit');
    assert.equal(emits[1].v, 15, 'trailing emit carries the latest value');
    assert.equal(ds.getStats().coalesced, 3, 'three values folded into the trailing emit');
});

test('DS1: max_delay_ms caps the debounce for a steady stream', async () => {
    useClock();
    const { ds, emits, push } = await startSource({ min_emit_ms: 50, coalesce_ms: 40, max_delay_ms: 200 });
    const emitTimes = [];
    ds.subscribers.add((data) => emitTimes.push({ at: Date.now(), v: data.v }));
    const arrivals = [];
    // An update every 30 ms keeps restarting the 40 ms debounce. Tick 1 ms at a
    // time: mocked Date only advances to the end of each tick.
    for (let i = 0; i <= 40; i++) {
        if (i) for (let ms = 0; ms < 30; ms++) mock.timers.tick(1);
        arrivals.push({ at: Date.now(), v: i });
        push(i);
    }
    for (let ms = 0; ms < 500; ms++) mock.timers.tick(1);
    assert.ok(emits.length < 20, `throttled (got ${emits.length} emits for 41 updates)`);
    for (const { at, v } of arrivals) {
        const shown = emitTimes.find(e => e.v >= v);
        assert.ok(shown, `value ${v} reached subscribers`);
        assert.ok(shown.at - at <= 200, `value ${v} waited ${shown.at - at} ms (max_delay_ms 200)`);
    }
    assert.equal(emits.at(-1)?.v, 40, 'ends on the latest value');
});

test('DS1: emit_on_same_value: false skips a repeated value; true (default) emits it', async () => {
    useClock();
    const off = await startSource({ emit_on_same_value: false });
    off.push(11);
    mock.timers.tick(500);
    off.push(11);
    assert.equal(off.emits.length, 1);
    assert.equal(off.ds.getStats().skipsSameValue, 1);
    mock.timers.tick(500);
    off.push(12);
    assert.equal(off.emits.length, 2);

    const on = await startSource();
    on.push(11);
    mock.timers.tick(500);
    on.push(11);
    assert.equal(on.emits.length, 2);
});

test('DS1: emit data keeps the shape cards consume', async () => {
    useClock();
    const { emits, push } = await startSource();
    push(11);
    const data = emits[0];
    assert.deepEqual(Object.keys(data).sort(),
        ['buffer', 'entity', 'historyReady', 'processing', 'stats', 't', 'unit_of_measurement', 'v'].sort());
    assert.equal(data.entity, ENTITY);
    assert.equal(data.unit_of_measurement, '°C');
    assert.equal(typeof data.t, 'number');
});

test('DS1: stop() cancels a pending trailing emit', async () => {
    useClock();
    const { ds, emits, push } = await startSource();
    push(11);
    mock.timers.tick(10);
    push(12);
    await ds.stop();
    mock.timers.tick(1000);
    assert.equal(emits.length, 1);
});

test('DS2: stats.updates counts live updates', async () => {
    useClock();
    const { ds, push } = await startSource();
    push(11);
    mock.timers.tick(500);
    push(12);
    assert.equal(ds.getStats().updates, 2);
});

test('DS3: createDataSource processes the first value once', async (t) => {
    const seen = [];
    const orig = ProcessorManager.prototype.process;
    t.after(() => { ProcessorManager.prototype.process = orig; });
    ProcessorManager.prototype.process = function (v, ts, b) { seen.push(v); return orig.call(this, v, ts, b); };

    const manager = new DataSourceManager(createFakeHass({ states: { [ENTITY]: '21.5' } }));
    const source = await manager.createDataSource('temp', { entity: ENTITY, ...NO_HISTORY }, 'card-1');
    assert.deepEqual(seen, [21.5]);
    assert.equal(source.buffer.size(), 1);
    assert.equal(source._lastOriginalState?.state, '21.5', 'original state kept for hass forwarding');
});

test('DS3: attribute_path sources read their initial value from the path', async () => {
    const hass = createFakeHass({ states: { [ENTITY]: { state: 'on', attributes: { forecast: [{ temperature: 7 }] } } } });
    const manager = new DataSourceManager(hass);
    const source = await manager.createDataSource('fc', { entity: ENTITY, attribute_path: 'forecast[0].temperature', ...NO_HISTORY });
    assert.equal(source.buffer.last()?.v, 7);
});

test('DS4: ingestHass refreshes nothing it cannot and reports changes', async () => {
    const hass = createFakeHass({ states: { [ENTITY]: '1' } });
    const manager = new DataSourceManager(hass);
    const source = await manager.createDataSource('temp', { entity: ENTITY, ...NO_HISTORY });
    const before = source.buffer.size();
    const next = { ...hass, states: { ...hass.states, [ENTITY]: { ...hass.states[ENTITY], state: '2' } } };
    const result = manager.ingestHass(next);
    assert.equal(result.hasChanges, true);
    assert.equal(result.changedCount, 1);
    assert.equal(source.buffer.size(), before, 'live events feed the buffer, not ingestHass');
    assert.equal(manager.hass, next);
});

test('DS4: getEntity resolves processing paths and plain source names', async () => {
    const manager = new DataSourceManager(createFakeHass({ states: { [ENTITY]: '20' } }));
    await manager.createDataSource('temp', {
        entity: ENTITY, ...NO_HISTORY,
        processing: { doubled: { type: 'scale', input_range: [0, 1], output_range: [0, 2] } }
    });
    assert.equal(manager.getEntity('temp')?.state, '20');
    assert.equal(manager.getEntity('temp.processing.doubled')?.state, '40');
    assert.equal(manager.getEntity('temp.processing.missing'), null);
    assert.equal(manager.getEntity(ENTITY)?.state, '20', 'entity index lookup');
    assert.equal(typeof manager._resolveDataPath, 'undefined', 'dead transformations/aggregations resolver removed');
});

test('DS5: a card-created source stops after its last card leaves', async () => {
    useClock();
    const hass = createFakeHass({ states: { [ENTITY]: '20' } });
    const manager = new DataSourceManager(hass);
    const source = await manager.createDataSource('temp', { entity: ENTITY, ...NO_HISTORY }, 'card-1');
    const sub = hass.connection.subs.find(s => s.message?.type === 'subscribe_events');
    manager.removeCardFromSource('temp', 'card-1');
    assert.ok(manager.getSource('temp'), 'kept during the grace delay');
    mock.timers.tick(SOURCE_RELEASE_DELAY_MS);
    assert.equal(manager.getSource('temp'), undefined);
    assert.equal(manager.entityIndex.has(ENTITY), false);
    assert.equal(sub?.active, false, 'HA subscription released');
    assert.equal(source._destroyed, true);
});

test('DS5: a card that comes back within the grace delay keeps the source', async () => {
    useClock();
    const manager = new DataSourceManager(createFakeHass({ states: { [ENTITY]: '20' } }));
    const first = await manager.createDataSource('temp', { entity: ENTITY, ...NO_HISTORY }, 'card-1');
    manager.removeCardFromSource('temp', 'card-1');
    mock.timers.tick(10);
    const again = await manager.createDataSource('temp', { entity: ENTITY, ...NO_HISTORY }, 'card-1b');
    mock.timers.tick(SOURCE_RELEASE_DELAY_MS * 2);
    assert.equal(again, first);
    assert.equal(manager.getSource('temp'), first);
});

test('DS5: a source with other subscribers, or not made by a card, keeps running', async () => {
    useClock();
    const manager = new DataSourceManager(createFakeHass({ states: { [ENTITY]: '20', 'sensor.b': '1' } }));
    const shared = await manager.createDataSource('temp', { entity: ENTITY, ...NO_HISTORY }, 'card-1');
    const unsub = shared.subscribe(() => {});   // e.g. a chart or animation subscribed directly
    manager.removeCardFromSource('temp', 'card-1');
    mock.timers.tick(SOURCE_RELEASE_DELAY_MS);
    assert.ok(manager.getSource('temp'), 'still subscribed elsewhere');
    unsub();

    await manager.initializeFromConfig({ msd_src: { entity: 'sensor.b', ...NO_HISTORY } });
    manager.removeCardFromSource('msd_src', 'card-x');
    mock.timers.tick(SOURCE_RELEASE_DELAY_MS);
    assert.ok(manager.getSource('msd_src'), 'config (MSD) sources are not released');

    // A card made it first, then MSD config asked for the same name: MSD keeps it.
    await manager.createDataSource('both', { entity: 'sensor.b', ...NO_HISTORY }, 'card-2');
    await manager.initializeFromConfig({ both: { entity: 'sensor.b', ...NO_HISTORY } });
    manager.removeCardFromSource('both', 'card-2');
    mock.timers.tick(SOURCE_RELEASE_DELAY_MS);
    assert.ok(manager.getSource('both'), 'shared with MSD config');
});
