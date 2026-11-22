/**
 * Home Assistant targets and labels (src/utils/ha-targets.js; reports/ha-labels-plan.md 1a).
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
    resolveTarget, labelsOf, hasLabel, entityArea, registryKey, sameRegistries,
    fetchLabelRegistry, clearLabelRegistry,
} from '../../src/utils/ha-targets.js';

const state = (id) => ({ entity_id: id, state: 'on', attributes: {} });
const ids = [
    'light.lamp', 'sensor.battery', 'sensor.room_temp', 'sensor.diag', 'sensor.hidden',
    'switch.own_area', 'sensor.no_device',
];
const hass = {
    states: Object.fromEntries([...ids, 'sensor.no_registry'].map(id => [id, state(id)])),
    floors: { deck1: { floor_id: 'deck1' } },
    areas: {
        bridge: { area_id: 'bridge', floor_id: 'deck1', labels: ['command'] },
        galley: { area_id: 'galley', floor_id: 'deck2', labels: [] },
    },
    devices: {
        dev_lamp: { id: 'dev_lamp', area_id: 'bridge', labels: ['lighting'] },
        dev_sensor: { id: 'dev_sensor', area_id: 'galley', labels: ['low_battery'] },
    },
    entities: {
        'light.lamp': { entity_id: 'light.lamp', device_id: 'dev_lamp', labels: ['lighting', 'favourite'] },
        'sensor.battery': { entity_id: 'sensor.battery', device_id: 'dev_sensor', labels: [] },
        'sensor.room_temp': { entity_id: 'sensor.room_temp', device_id: 'dev_sensor', labels: ['climate'] },
        'sensor.diag': { entity_id: 'sensor.diag', device_id: 'dev_sensor', entity_category: 'diagnostic', labels: ['climate'] },
        'sensor.hidden': { entity_id: 'sensor.hidden', area_id: 'bridge', hidden: true, labels: ['climate'] },
        // its own area wins over its device's
        'switch.own_area': { entity_id: 'switch.own_area', device_id: 'dev_sensor', area_id: 'bridge', labels: [] },
        'sensor.no_device': { entity_id: 'sensor.no_device', labels: ['low_battery'] },
        // in the registry, no state: never resolved
        'sensor.gone': { entity_id: 'sensor.gone', labels: ['low_battery'] },
    },
};
const r = (target) => resolveTarget(hass, target).sort();

test('resolveTarget: a label on the entity, its device or its area', () => {
    assert.deepEqual(r({ label_id: 'favourite' }), ['light.lamp'], 'on the entity');
    assert.deepEqual(r({ label_id: 'low_battery' }), ['sensor.battery', 'sensor.no_device', 'sensor.room_temp', 'switch.own_area'],
        "the device's label reaches all its entities (also one in another area), not entity-category ones");
    assert.deepEqual(r({ label_id: 'command' }), ['light.lamp', 'switch.own_area'], "the area's label: the device's area, or the entity's own");
    assert.deepEqual(r({ label_id: ['climate', 'lighting'] }), ['light.lamp', 'sensor.room_temp'], 'a list of labels; hidden and diagnostic entities left out');
});

test('resolveTarget: hidden and entity-category entities only when named; unknown and stateless ids dropped', () => {
    assert.deepEqual(r({ entity_id: ['sensor.diag', 'sensor.hidden'] }), ['sensor.diag', 'sensor.hidden']);
    assert.deepEqual(r({ entity_id: 'sensor.nope' }), []);
    assert.deepEqual(r({ label_id: 'no_such_label' }), []);
    assert.ok(!r({ label_id: 'low_battery' }).includes('sensor.gone'));
    assert.deepEqual(r({ entity_id: 'sensor.no_registry' }), ['sensor.no_registry'], 'named directly, no registry entry');
    assert.deepEqual(r(undefined), []);
    assert.deepEqual(r(null), []);
    assert.deepEqual(resolveTarget({}, { label_id: 'x' }), [], 'no registries at all');
});

test('resolveTarget: floors, areas and devices', () => {
    assert.deepEqual(r({ floor_id: 'deck1' }), ['light.lamp', 'switch.own_area']);
    assert.deepEqual(r({ area_id: 'galley' }), ['sensor.battery', 'sensor.room_temp']);
    assert.deepEqual(r({ device_id: 'dev_lamp' }), ['light.lamp']);
    assert.deepEqual(r({ device_id: 'dev_lamp', entity_id: 'sensor.no_device' }), ['light.lamp', 'sensor.no_device'], 'keys combine');
});

test('entityArea: the entity\'s own area, else its device\'s', () => {
    assert.equal(entityArea(hass, 'switch.own_area'), 'bridge');
    assert.equal(entityArea(hass, 'sensor.battery'), 'galley');
    assert.equal(entityArea(hass, 'sensor.no_device'), null);
    assert.equal(entityArea(hass, 'light.nope'), null);
});

test('labelsOf: own, device and area labels, each once, marked with where it comes from', () => {
    assert.deepEqual(labelsOf(hass, 'light.lamp'), [
        { id: 'lighting', from: 'entity' }, { id: 'favourite', from: 'entity' }, { id: 'command', from: 'area' },
    ], "the device's 'lighting' is already the entity's own");
    assert.deepEqual(labelsOf(hass, 'sensor.battery'), [{ id: 'low_battery', from: 'device' }]);
    assert.deepEqual(labelsOf(hass, 'switch.own_area'), [{ id: 'low_battery', from: 'device' }, { id: 'command', from: 'area' }]);
    assert.deepEqual(labelsOf(hass, 'sensor.hidden'), [{ id: 'climate', from: 'entity' }, { id: 'command', from: 'area' }], 'hidden entities keep their labels');
    assert.deepEqual(labelsOf(hass, 'sensor.no_registry'), []);
    assert.deepEqual(labelsOf(hass, undefined), []);
    assert.deepEqual(labelsOf(undefined, 'light.lamp'), []);
});

test('hasLabel', () => {
    assert.equal(hasLabel(hass, 'switch.own_area', 'command'), true);
    assert.equal(hasLabel(hass, 'switch.own_area', 'lighting'), false);
    assert.equal(hasLabel(hass, null, 'command'), false);
});

test('registryKey: a replaced registry object means resolve again', () => {
    const a = registryKey(hass);
    assert.equal(sameRegistries(a, registryKey({ ...hass })), true, 'a new hass with the same registries');
    assert.equal(sameRegistries(a, registryKey({ ...hass, devices: { ...hass.devices } })), false);
    assert.equal(sameRegistries(a, null), false);
});

test('fetchLabelRegistry: one call, kept; a failure gives an empty map and tries again', async () => {
    clearLabelRegistry();
    let calls = 0;
    const ok = { callWS: async (msg) => { calls++; assert.equal(msg.type, 'config/label_registry/list'); return [{ label_id: 'low_battery', name: 'Low battery', icon: 'mdi:battery-alert' }]; } };
    const first = await fetchLabelRegistry(ok);
    const second = await fetchLabelRegistry(ok);
    assert.equal(calls, 1);
    assert.equal(first, second);
    assert.equal(first.get('low_battery')?.name, 'Low battery');

    clearLabelRegistry();
    let failures = 0;
    const bad = { callWS: async () => { failures++; throw new Error('nope'); } };
    assert.equal((await fetchLabelRegistry(bad)).size, 0);
    assert.equal((await fetchLabelRegistry(bad)).size, 0);
    assert.equal(failures, 2, 'a failed fetch is not kept');

    clearLabelRegistry();
    assert.equal((await fetchLabelRegistry({})).size, 0, 'no connection');
    clearLabelRegistry();
});
