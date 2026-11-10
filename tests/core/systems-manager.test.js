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
