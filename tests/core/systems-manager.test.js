/**
 * CoreSystemsManager entity cache (D3b): an entity that disappears from
 * hass.states (deleted or renamed in Home Assistant) leaves the cache and
 * its subscribers hear about it, instead of cards showing its last state.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CoreSystemsManager } from '../../src/core/systems-manager/index.js';

const st = (/** @type {string} */ state, t = '1') => ({ state, attributes: {}, last_changed: t, last_updated: t });

test('a removed entity is dropped from the cache and subscribers get (id, null, oldState)', () => {
    const sm = new CoreSystemsManager();
    const a = st('on');
    sm.initialize({ states: { 'light.a': a, 'light.b': st('off') } });
    /** @type {any[]} */
    const calls = [];
    sm.subscribeToEntity('light.a', (id, newState, oldState) => calls.push([id, newState, oldState]));
    /** @type {string[][]} */
    const changed = [];
    sm.addEntityChangeListener((/** @type {string[]} */ ids) => changed.push(ids));

    sm.updateHass({ states: { 'light.b': st('off') } });

    assert.deepEqual(calls, [['light.a', null, a]]);
    assert.deepEqual(changed, [['light.a']]);
    assert.equal(sm.getEntityState('light.a'), null);
    assert.equal(sm.getAllEntityStates().has('light.a'), false);
});

test('an unchanged hass update notifies nobody, and a re-added entity notifies as new', () => {
    const sm = new CoreSystemsManager();
    sm.initialize({ states: { 'light.a': st('on') } });
    /** @type {any[]} */
    const calls = [];
    sm.subscribeToEntity('light.a', (id, newState, oldState) => calls.push([newState?.state ?? null, oldState?.state ?? null]));
    sm.updateHass({ states: { 'light.a': st('on') } });
    assert.deepEqual(calls, []);
    sm.updateHass({ states: {} });
    sm.updateHass({ states: { 'light.a': st('off', '2') } });
    assert.deepEqual(calls, [[null, 'on'], ['off', null]]);
});

// 2026-11-17 (perf review item 15): the scan skips state objects it already has,
// and looks for removed entities only when the cache holds more ids than hass.states
test('a rename in one update (one entity gone, one new) reports both; an attribute-only change still notifies', () => {
    const sm = new CoreSystemsManager();
    const a = st('on');
    const b = st('off');
    sm.initialize({ states: { 'light.a': a, 'light.b': b } });
    /** @type {string[][]} */
    const changed = [];
    sm.addEntityChangeListener((/** @type {string[]} */ ids) => changed.push([...ids].sort()));

    sm.updateHass({ states: { 'light.b': b, 'light.c': st('on') } });
    assert.deepEqual(changed, [['light.a', 'light.c']]);
    assert.equal(sm.getEntityState('light.a'), null);

    // same last_changed, new last_updated: the brightness of a light that stays on
    sm.updateHass({ states: { 'light.b': { ...b, attributes: { brightness: 9 }, last_updated: '2' }, 'light.c': sm.getEntityState('light.c') } });
    assert.deepEqual(changed[1], ['light.b']);
    assert.equal(sm.getEntityState('light.b').attributes.brightness, 9);

    // the same objects again: nothing
    sm.updateHass({ states: { 'light.b': sm.getEntityState('light.b'), 'light.c': sm.getEntityState('light.c') } });
    assert.equal(changed.length, 2);
});
