/**
 * The rules engine watches only its rules' entities (HA-LCARS feedback, Fire HD 8
 * kiosk, 2026-11-18): it listened to every state change in Home Assistant ('*') and
 * filtered locally, which kept the page's shared subscription unfiltered. Now one
 * listener per rule entity, in step with the rules as cards add and remove them;
 * the shared subscription asks Home Assistant for those entities only.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createFakeHass } from '../helpers/fake-hass.js';
import { RulesEngine } from '../../src/core/rules/RulesEngine.js';

const flush = () => new Promise((resolve) => setImmediate(resolve));
/** @param {any} hass */
const filter = (hass) => hass.connection.subs.filter((/** @type {any} */ s) => s.active && s.message?.type === 'subscribe_entities').map((/** @type {any} */ s) => s.message.entity_ids);

test("rule entities are watched by name, follow the card's rules, and a change marks its rule dirty", async () => {
    const hass = createFakeHass({ states: { 'light.a': 'off', 'light.b': 'off', 'light.unrelated': 'off' } });
    const engine = new RulesEngine([], null);
    engine.setCardRules('card-1', [{ id: 'r1', when: { entity: 'light.a', state: 'on' }, apply: {} }]);
    await engine.setupHassMonitoring(hass);
    await flush();
    assert.deepEqual(filter(hass), [['light.a']], 'only the rule entity, no every-entity subscription');
    assert.ok(engine.hassUnsubscribe, 'monitoring is active');

    // a second card brings a rule on light.b: watched too
    engine.setCardRules('card-2', [{ id: 'r2', when: { entity: 'light.b', state: 'on' }, apply: {} }]);
    await flush();
    assert.deepEqual(filter(hass), [['light.a', 'light.b']]);

    engine.dirtyRules.clear();
    hass.pushStateChange('light.b', 'on');
    assert.ok(engine.dirtyRules.has('r2'), 'the change on light.b marks r2 dirty');
    assert.equal(engine.dirtyRules.has('r1'), false);

    // the first card goes: light.a is no longer watched
    engine.removeCardRules('card-1');
    await flush();
    assert.deepEqual(filter(hass), [['light.b']]);

    await engine.destroy();
    await flush();
    assert.deepEqual(filter(hass), [], 'destroy closes it');
});

test('rules naming no entity: no subscription, and ingestHass keeps marking rules dirty', async () => {
    const hass = createFakeHass({ states: { 'light.a': 'off' } });
    const engine = new RulesEngine([], null);
    engine.setCardRules('card-1', [{ id: 't', when: { time_between: '08:00-20:00' }, apply: {} }]);
    await engine.setupHassMonitoring(hass);
    await flush();
    assert.deepEqual(filter(hass), []);
    assert.equal(engine.hassUnsubscribe, null);
});
