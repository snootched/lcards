// One shared state_changed subscription per page (#405, #408): every
// state_changed subscription receives every state change in Home Assistant, so
// one per helper, per data source and for the rules engine multiplied the
// traffic per tab until a burst overflowed Home Assistant's 4096-message queue.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createFakeHass } from '../helpers/fake-hass.js';
import { onStateChanged, stateChangeSubscriptionCount } from '../../src/core/state-change-hub.js';
import { LCARdSHelperManager } from '../../src/core/helpers/lcards-helper-manager.js';
import { DataSource } from '../../src/core/data-sources/DataSource.js';

const flush = () => new Promise((resolve) => setImmediate(resolve));
const stateSubs = (hass) => hass.connection.subs.filter((s) => s.message?.event_type === 'state_changed');
const change = (entity_id, state) => ({ event_type: 'state_changed', data: { entity_id, old_state: null, new_state: { entity_id, state, attributes: {} } } });

test('helpers and every data source share one state_changed subscription', async () => {
    const hass = createFakeHass({ states: { 'sensor.a': '1', 'sensor.b': '2', 'sensor.c': '3' } });
    const helpers = new LCARdSHelperManager();
    helpers.updateHass(hass);
    const sources = ['sensor.a', 'sensor.b', 'sensor.c'].map((entity) => new DataSource({ entity, history: { enabled: false } }, hass));
    for (const source of sources) await source.start();
    await flush();

    assert.equal(stateSubs(hass).length, 1, 'one subscription for 49 helpers and 3 sources');
    assert.equal(stateChangeSubscriptionCount(hass.connection), 1);

    const seen = [];
    sources[1].subscribers.add((data) => seen.push(data.v));
    hass.connection.push(hass.connection.subs.indexOf(stateSubs(hass)[0]), change('sensor.b', '42'));
    hass.connection.push(hass.connection.subs.indexOf(stateSubs(hass)[0]), change('sensor.unrelated', '7'));
    assert.deepEqual(seen.filter((v) => v === 42 || v === 7), [42], 'only sensor.b reaches its source');

    for (const source of sources) await source.stop();
    helpers.destroy();
    await flush();
    assert.equal(stateSubs(hass)[0].active, false, 'closed after the last listener left');
    assert.equal(stateChangeSubscriptionCount(hass.connection), 0);
});

test("a '*' listener gets every change; one entity's listener only its own", async () => {
    const hass = createFakeHass();
    const all = [];
    const mine = [];
    const offAll = onStateChanged(hass.connection, '*', (data) => all.push(data.entity_id));
    const offMine = onStateChanged(hass.connection, 'light.a', (data) => mine.push(data.entity_id));
    await flush();
    const index = hass.connection.subs.indexOf(stateSubs(hass)[0]);
    hass.connection.push(index, change('light.a', 'on'));
    hass.connection.push(index, change('light.b', 'on'));
    assert.deepEqual(all, ['light.a', 'light.b']);
    assert.deepEqual(mine, ['light.a']);

    offMine();
    offMine(); // twice is harmless
    assert.equal(stateSubs(hass)[0].active, true, 'still open for the * listener');
    offAll();
    assert.equal(stateSubs(hass)[0].active, false);

    // a new listener opens a fresh subscription
    const offAgain = onStateChanged(hass.connection, 'light.a', () => {});
    await flush();
    assert.equal(stateSubs(hass).filter((s) => s.active).length, 1);
    offAgain();
});

test('a listener that throws does not stop the others', async () => {
    const hass = createFakeHass();
    const seen = [];
    onStateChanged(hass.connection, 'light.a', () => { throw new Error('boom'); });
    onStateChanged(hass.connection, 'light.a', (data) => seen.push(data.entity_id));
    await flush();
    hass.connection.push(hass.connection.subs.indexOf(stateSubs(hass)[0]), change('light.a', 'on'));
    assert.deepEqual(seen, ['light.a']);
});
