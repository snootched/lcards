/**
 * G2 (D3d): subscribeToEntity() tracks the entity it subscribes to. A card
 * forwards HASS to the core only when one of its own entities changed; an
 * entity the card subscribed to (and does not otherwise track) must count,
 * or its callback never fires. Unsubscribing (or a disconnect) stops it
 * counting, unless the card tracks it for another reason. Real core under
 * jsdom; the card is made with Object.create (no custom element).
 */
import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { createFakeHass, makeStates } from '../helpers/fake-hass.js';
import { installJsdom } from '../helpers/jsdom-env.js';

const { dom } = installJsdom();
for (const key of Object.getOwnPropertyNames(dom.window)) {
    if (/^[A-Z]/.test(key) && !(key in globalThis)) globalThis[key] = dom.window[key];
}
globalThis.lcards = /** @type {any} */ ({ core: {} }); // normally created by src/lcards-main.js
const { lcardsCore } = await import('../../src/core/lcards-core.js');
const startStates = { 'light.own': 'on', 'sensor.other': '1', 'sensor.unrelated': 'a' };
await lcardsCore.initialize(createFakeHass({ states: startStates }));
globalThis.lcards.core = lcardsCore;
after(() => clearInterval(lcardsCore._globalHassTimer));

const { LCARdSCard } = await import('../../src/base/LCARdSCard.js');

/** A hass snapshot: the previous states with some replaced (new objects only for those). */
const snapshot = (/** @type {any} */ prev, /** @type {Record<string, string>} */ changes = {}) =>
    ({ ...prev, states: { ...prev.states, ...makeStates(changes) } });

const flush = () => new Promise((r) => setTimeout(r, 0));

function makeCard() {
    const card = /** @type {any} */ (Object.create(LCARdSCard.prototype));
    Object.assign(card, {
        _cardGuid: 'card-guid-g2', _singletons: { systemsManager: lcardsCore.systemsManager },
        _hassMonitoringSetup: true, _trackedEntities: ['light.own'],
        config: { type: 'custom:lcards-button', entity: 'light.own' },
        _updateLightColorVariable() {}, _trackStateBranches() {}, _scheduleTemplateUpdate() {},
    });
    return card;
}

test('a change to only a subscribed, untracked entity reaches the core and fires the callback', async () => {
    const card = makeCard();
    let hass = createFakeHass({ states: startStates });
    await card._onHassChanged(hass, null);
    await flush();
    /** @type {any[]} */
    const calls = [];
    const off = card.subscribeToEntity('sensor.other', (/** @type {string} */ id, /** @type {any} */ s) => calls.push([id, s?.state]));

    let next = snapshot(hass, { 'sensor.other': '2' });
    await card._onHassChanged(next, hass);
    hass = next;
    await flush();
    assert.deepEqual(calls, [['sensor.other', '2']]);

    // unsubscribed: the entity no longer gates forwarding (nothing else tracks it)
    off();
    next = snapshot(hass, { 'sensor.other': '3' });
    let forwarded = 0;
    const real = lcardsCore.ingestHass;
    lcardsCore.ingestHass = (/** @type {any} */ h) => { forwarded++; return real.call(lcardsCore, h); };
    try {
        await card._onHassChanged(next, hass);
        hass = next;
        assert.equal(forwarded, 0, 'an unsubscribed entity is not forwarded');
        assert.equal(calls.length, 1);
    } finally {
        lcardsCore.ingestHass = real;
    }
    await flush();
});

test('two subscriptions to one entity: it counts until both are gone; a disconnect drops them all', async () => {
    const card = makeCard();
    const a = card.subscribeToEntity('sensor.other', () => {});
    card.subscribeToEntity('sensor.other', () => {});
    card.subscribeToEntity('light.own', () => {});
    assert.equal(card._isSubscribedEntity('sensor.other'), true);
    a();
    a(); // a second call is a no-op
    assert.equal(card._isSubscribedEntity('sensor.other'), true, 'the second subscription still counts');
    card._releaseEntitySubscriptions();
    assert.equal(card._isSubscribedEntity('sensor.other'), false);
    assert.equal(card._isSubscribedEntity('light.own'), false);
    assert.equal(card._entitySubscriptions.size, 0);
    assert.deepEqual(card._trackedEntities, ['light.own'], 'the tracked set itself is untouched');
});
