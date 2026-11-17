// HelperManager watches all LCARdS helpers through ONE state_changed
// subscription. Each state_changed subscription receives every state change in
// Home Assistant, so one per helper (49 of them) multiplied the per-tab event
// traffic and overflowed HA's 4096 pending-message queue at startup.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createFakeHass } from '../helpers/fake-hass.js';
import { LCARdSHelperManager } from '../../src/core/helpers/lcards-helper-manager.js';
import { getAllHelpers } from '../../src/core/helpers/lcards-helper-registry.js';

function trackSubscriptions(hass) {
  const subs = [];
  const conn = hass.connection;
  conn.subscribeEvents = async (cb, eventType) => {
    const sub = { cb, eventType, unsubscribed: false };
    subs.push(sub);
    return () => { sub.unsubscribed = true; };
  };
  return subs;
}

test('helper manager opens a single state_changed subscription for all helpers', async () => {
  const hass = createFakeHass();
  const subs = trackSubscriptions(hass);
  const manager = new LCARdSHelperManager();
  manager.updateHass(hass);
  manager.updateHass(hass);

  const stateSubs = subs.filter((s) => s.eventType === 'state_changed');
  assert.equal(stateSubs.length, 1);
  assert.ok(getAllHelpers().length > 1, 'registry has several helpers');
  manager.destroy();
});

test('the shared subscription routes changes to the right helper', async () => {
  const hass = createFakeHass();
  const subs = trackSubscriptions(hass);
  const manager = new LCARdSHelperManager();
  manager.updateHass(hass);

  const [helperA, helperB] = getAllHelpers();
  const seen = [];
  manager.subscribeToHelper(helperA.key, (value) => seen.push([helperA.key, value]));
  manager.subscribeToHelper(helperB.key, (value) => seen.push([helperB.key, value]));

  const { cb } = subs.find((s) => s.eventType === 'state_changed');
  cb({ event_type: 'state_changed', data: { entity_id: 'light.unrelated', new_state: { state: 'on' } } });
  cb({ event_type: 'state_changed', data: { entity_id: helperB.entity_id, new_state: { state: 'x' }, old_state: null } });

  assert.deepEqual(seen.filter(([k]) => k === helperB.key).at(-1), [helperB.key, 'x']);
  assert.equal(seen.some(([k, v]) => k === helperA.key && v === 'x'), false);
  manager.destroy();
});

test('destroy really unsubscribes (subscribeEvents resolves to the unsubscribe)', async () => {
  const hass = createFakeHass();
  const subs = trackSubscriptions(hass);
  const manager = new LCARdSHelperManager();
  manager.updateHass(hass);
  manager.destroy();
  await new Promise((r) => setTimeout(r, 0));

  assert.equal(subs.filter((s) => s.eventType === 'state_changed').every((s) => s.unsubscribed), true);
  assert.equal(manager.getDebugInfo().stateListeners, 0);
});

// 2026-11-17: every card passes each new hass to the helper manager, so the same
// object arrived once per card (60 cards: 60 passes over 49 helpers per update).
test('the same hass object again does no work; a new one still updates the values', async () => {
  const hass = createFakeHass({ states: { 'input_select.lcards_alert_mode': 'green_alert' } });
  trackSubscriptions(hass);
  const manager = new LCARdSHelperManager();
  manager.updateHass(hass); // first: sets up
  let passes = 0;
  const original = manager._updateValueCache.bind(manager);
  manager._updateValueCache = () => { passes++; original(); };
  for (let i = 0; i < 30; i++) manager.updateHass(hass);
  assert.equal(passes, 0, 'no pass for the same object');

  const next = { ...hass, states: { ...hass.states, 'input_select.lcards_alert_mode': { ...hass.states['input_select.lcards_alert_mode'], state: 'red_alert' } } };
  manager.updateHass(next);
  manager.updateHass(next);
  assert.equal(passes, 1, 'one pass per new object');
  assert.equal(manager.hass, next);
  assert.equal(manager._valueCache.get('alert_mode'), 'red_alert');
  manager.destroy();
});
