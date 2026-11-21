// One shared state subscription per page, filtered on the server.
// #405/#408: one state_changed subscription per helper and data source multiplied
// the traffic per tab until a burst overflowed Home Assistant's 4096-message queue.
// 2026-11-18 (HA-LCARS feedback, Fire HD 8 kiosk): the one shared state_changed
// subscription still carried every state change in the house, uncompressed; the
// hub now subscribes with subscribe_entities and entity_ids.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createFakeHass, compressState } from '../helpers/fake-hass.js';
import { onStateChanged, stateChangeSubscriptionCount } from '../../src/core/state-change-hub.js';
import { LCARdSHelperManager } from '../../src/core/helpers/lcards-helper-manager.js';
import { DataSource } from '../../src/core/data-sources/DataSource.js';

const flush = () => new Promise((resolve) => setImmediate(resolve));
/** @param {any} hass */
const entitySubs = (hass) => hass.connection.subs.filter((/** @type {any} */ s) => s.message?.type === 'subscribe_entities');
/** @param {any} hass */
const active = (hass) => entitySubs(hass).filter((/** @type {any} */ s) => s.active);

test('helpers and every data source share one subscription, filtered to their entities', async () => {
    const hass = createFakeHass({ states: { 'sensor.a': '1', 'sensor.b': '2', 'sensor.c': '3', 'sensor.unrelated': '0' } });
    const helpers = new LCARdSHelperManager();
    helpers.updateHass(hass);
    const sources = ['sensor.a', 'sensor.b', 'sensor.c'].map((entity) => new DataSource({ entity, history: { enabled: false } }, hass));
    for (const source of sources) await source.start();
    await flush();

    assert.equal(active(hass).length, 1, 'one subscription for the helpers and 3 sources');
    assert.equal(stateChangeSubscriptionCount(hass.connection), 1);
    const ids = active(hass)[0].message.entity_ids;
    assert.ok(ids.includes('sensor.b'), 'the sources are in the filter');
    assert.ok(!ids.includes('sensor.unrelated'), 'nothing else is');
    assert.equal(state_changed(hass), 0, 'no unfiltered state_changed subscription');

    /** @type {number[]} */
    const seen = [];
    sources[1].subscribers.add((/** @type {any} */ data) => seen.push(data.v));
    hass.pushStateChange('sensor.b', '42');
    hass.pushStateChange('sensor.unrelated', '7');
    assert.deepEqual(seen.filter((v) => v === 42 || v === 7), [42], 'only sensor.b reaches its source');

    for (const source of sources) await source.stop();
    helpers.destroy();
    await flush();
    assert.equal(active(hass).length, 0, 'closed after the last listener left');
    assert.equal(stateChangeSubscriptionCount(hass.connection), 0);
});

/** @param {any} hass */
function state_changed(hass) {
    return hass.connection.subs.filter((/** @type {any} */ s) => s.message?.event_type === 'state_changed' && s.active).length;
}

test('listeners get { entity_id, old_state, new_state }; the first sight of a state is not a change', async () => {
    const hass = createFakeHass({ states: { 'light.a': { state: 'off', attributes: { brightness: 0 } } } });
    /** @type {any[]} */
    const seen = [];
    onStateChanged(hass.connection, 'light.a', (data) => seen.push(data));
    await flush();
    assert.deepEqual(seen, [], 'the initial states are not delivered');
    hass.pushStateChange('light.a', { state: 'on', attributes: { brightness: 200 } });
    assert.equal(seen.length, 1);
    assert.equal(seen[0].entity_id, 'light.a');
    assert.equal(seen[0].old_state.state, 'off');
    assert.equal(seen[0].new_state.state, 'on');
    assert.equal(seen[0].new_state.attributes.brightness, 200);
    assert.ok(seen[0].new_state.last_updated, 'last_updated is decoded');
});

test("a '*' listener subscribes to every entity (no entity_ids); one entity's listener gets only its own", async () => {
    const hass = createFakeHass({ states: { 'light.a': 'off', 'light.b': 'off' } });
    /** @type {string[]} */
    const all = [];
    /** @type {string[]} */
    const mine = [];
    const offAll = onStateChanged(hass.connection, '*', (data) => all.push(data.entity_id));
    const offMine = onStateChanged(hass.connection, 'light.a', (data) => mine.push(data.entity_id));
    await flush();
    assert.equal(active(hass)[0].message.entity_ids, undefined);
    hass.pushStateChange('light.a', 'on');
    hass.pushStateChange('light.b', 'on');
    assert.deepEqual(all, ['light.a', 'light.b']);
    assert.deepEqual(mine, ['light.a']);

    offMine();
    offMine(); // twice is harmless
    await flush();
    assert.equal(active(hass).length, 1, 'still open for the * listener');
    offAll();
    await flush();
    assert.equal(active(hass).length, 0);
});

test('a new entity re-subscribes once; a change between the subscriptions arrives once, never twice', async () => {
    const hass = createFakeHass({ states: { 'light.a': 'off', 'light.b': 'off' } });
    /** @type {string[]} */
    const seen = [];
    onStateChanged(hass.connection, 'light.a', (data) => seen.push(`${data.entity_id}:${data.new_state?.state}`));
    await flush();
    const first = active(hass)[0];
    // light.b joins; before the new subscription opens, light.a changes in Home Assistant
    onStateChanged(hass.connection, 'light.b', (data) => seen.push(`${data.entity_id}:${data.new_state?.state}`));
    onStateChanged(hass.connection, 'light.b', () => {}); // a second listener in the same batch: still one re-subscribe
    hass.setState('light.a', { state: 'on', last_updated: new Date(Date.now() + 5000).toISOString() });
    await flush();
    assert.equal(first.active, false, 'the old subscription is closed');
    assert.equal(active(hass).length, 1);
    assert.deepEqual(active(hass)[0].message.entity_ids, ['light.a', 'light.b']);
    assert.deepEqual(seen, ['light.a:on'], 'the missed change came with the new subscription, once');
    // the replaced subscription can't deliver any more
    first.cb({ c: { 'light.a': { '+': { s: 'off' } } } });
    assert.deepEqual(seen, ['light.a:on']);
});

test('after a reconnect the re-sent states deliver what changed meanwhile, and only that', async () => {
    const hass = createFakeHass({ states: { 'light.a': 'off', 'light.b': 'off' } });
    /** @type {string[]} */
    const seen = [];
    onStateChanged(hass.connection, 'light.a', (data) => seen.push(`${data.entity_id}:${data.new_state?.state}`));
    onStateChanged(hass.connection, 'light.b', (data) => seen.push(`${data.entity_id}:${data.new_state?.state}`));
    await flush();
    const sub = active(hass)[0];
    // home-assistant-js-websocket re-subscribes after a reconnect: Home Assistant sends `a` again
    const changed = hass.setState('light.a', { state: 'on', last_updated: new Date(Date.now() + 5000).toISOString() });
    sub.cb({ a: { 'light.a': compressState(changed), 'light.b': compressState(hass.states['light.b']) } });
    assert.deepEqual(seen, ['light.a:on']);
});

test('a removed entity is delivered with new_state null; attributes removed by a diff are gone', async () => {
    const hass = createFakeHass({ states: { 'light.a': { state: 'on', attributes: { brightness: 9, effect: 'x' } } } });
    /** @type {any[]} */
    const seen = [];
    onStateChanged(hass.connection, 'light.a', (data) => seen.push(data));
    await flush();
    const sub = active(hass)[0];
    sub.cb({ c: { 'light.a': { '+': { s: 'off' }, '-': { a: ['effect'] } } } });
    assert.equal(seen[0].new_state.state, 'off');
    assert.equal(seen[0].new_state.attributes.effect, undefined);
    assert.equal(seen[0].new_state.attributes.brightness, 9);
    sub.cb({ r: ['light.a'] });
    assert.equal(seen[1].new_state, null);
    assert.equal(seen[1].old_state.state, 'off');
});

test('a listener that throws does not stop the others', async () => {
    const hass = createFakeHass({ states: { 'light.a': 'off' } });
    /** @type {string[]} */
    const seen = [];
    onStateChanged(hass.connection, 'light.a', () => { throw new Error('boom'); });
    onStateChanged(hass.connection, 'light.a', (data) => seen.push(data.entity_id));
    await flush();
    hass.pushStateChange('light.a', 'on');
    assert.deepEqual(seen, ['light.a']);
});

test("a change before the subscription's first message is delivered when the caller passed the state it knew", async () => {
    // #410 check (2026-11-18): an alert raised right after a page load, before the
    // subscription was open, arrived as the first sight of the entity and was lost.
    const hass = createFakeHass({ states: { 'input_select.mode': 'green', 'light.x': 'off' } });
    const known = hass.states['input_select.mode'];
    /** @type {string[]} */
    const seen = [];
    onStateChanged(hass.connection, 'input_select.mode', (data) => seen.push(`${data.old_state?.state}>${data.new_state?.state}`), known);
    // without a known state: the first sight is not a change
    onStateChanged(hass.connection, 'light.x', (data) => seen.push(`x:${data.new_state?.state}`));
    hass.setState('input_select.mode', { state: 'red', last_updated: new Date(Date.now() + 5000).toISOString() });
    hass.setState('light.x', { state: 'on', last_updated: new Date(Date.now() + 5000).toISOString() });
    await flush(); // the subscription opens with the current (red) state
    assert.deepEqual(seen, ['green>red']);
});

test('an entity created after the subscription opened is delivered with old_state null', async () => {
    const hass = createFakeHass({ states: { 'light.a': 'off' } });
    /** @type {any[]} */
    const seen = [];
    onStateChanged(hass.connection, 'input_boolean.new', (data) => seen.push(data));
    onStateChanged(hass.connection, 'light.a', () => {});
    await flush();
    hass.pushStateChange('input_boolean.new', 'on'); // unknown so far: sent as `a`, as Home Assistant does
    assert.equal(seen.length, 1);
    assert.equal(seen[0].old_state, null);
    assert.equal(seen[0].new_state.state, 'on');
});
