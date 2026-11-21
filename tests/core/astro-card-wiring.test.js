/**
 * The astrometrics card's wiring (D3c): the lazy schema (AS3: every card
 * whose config arrives while the schema is still loading is validated once
 * it is registered, not only the first), the card sound on scene actions,
 * and following entities through the core's subscriptions. Cards are made
 * with Object.create (no custom element), base methods stubbed. The scene
 * side is in tests/browser/astrometrics.spec.js.
 */
import { test, mock } from 'node:test';
import assert from 'node:assert/strict';
import { installJsdom } from '../helpers/jsdom-env.js';

const { dom } = installJsdom();
for (const key of Object.getOwnPropertyNames(dom.window)) {
    if (/^[A-Z]/.test(key) && !(key in globalThis)) globalThis[key] = dom.window[key];
}
/** @type {string[]} */
const registered = [];
globalThis.lcards = /** @type {any} */ ({ core: { configManager: { registerCardSchema: (/** @type {string} */ type) => registered.push(type) } } });

const { LCARdSAstrometricsCard, ensureAstrometricsSchema } = await import('../../src/cards/lcards-astrometrics-card.js');

test('every card configured while the schema loads re-processes once it is registered; later cards need not', async () => {
    const base = Object.getPrototypeOf(LCARdSAstrometricsCard.prototype);
    mock.method(base, 'setConfig', function (/** @type {any} */ config) { this._rawConfig = config; });
    const make = () => {
        const card = /** @type {any} */ (Object.create(LCARdSAstrometricsCard.prototype));
        card.reprocessed = 0;
        card._reprocessForThemeChange = () => { card.reprocessed++; };
        return card;
    };
    const a = make();
    const b = make();
    a.setConfig({ type: 'custom:lcards-astrometrics-card' });
    b.setConfig({ type: 'custom:lcards-astrometrics-card' });
    // a's config changes while it waits: still one reprocess (of the latest config)
    a.setConfig({ type: 'custom:lcards-astrometrics-card', height: 300 });
    assert.equal(await ensureAstrometricsSchema(), true);
    await new Promise((r) => setTimeout(r, 0));
    assert.deepEqual(registered, ['astrometrics']);
    assert.equal(a.reprocessed, 1, 'the first card');
    assert.equal(b.reprocessed, 1, 'the second card, configured while the schema loaded');
    const c = make();
    c.setConfig({ type: 'custom:lcards-astrometrics-card' });
    await new Promise((r) => setTimeout(r, 0));
    assert.equal(c.reprocessed, 0, 'validated on its own first process: the schema is there');
    mock.restoreAll();
});

test('every action on a scene object plays the card sound, a fly-to on the card\'s own scene too', () => {
    const card = /** @type {any} */ (Object.create(LCARdSAstrometricsCard.prototype));
    /** @type {string[]} */
    const sounds = [];
    /** @type {any[]} */
    const flights = [];
    card._playSound = (/** @type {string} */ s) => sounds.push(s);
    card._scene = { flyTo: (/** @type {any} */ v) => flights.push(v) };
    card.config = { id: 'here' };
    card._actionHandler = { runAction: () => {} };
    const hit = (/** @type {any} */ action) => ({ kind: 'point', id: 'vega', position: { x: 0, y: 0, z: 0 }, config: { tap_action: action, hold_action: action } });
    assert.equal(card._onSceneAction(hit({ action: 'fly-to', view: 'far' }), 'tap_action'), true);
    assert.equal(card._onSceneAction(hit({ action: 'fly-to', point: 'sol' }), 'hold_action'), true);
    assert.equal(card._onSceneAction(hit({ action: 'fly-to', card: 'here', view: 'far' }), 'tap_action'), true);
    assert.equal(card._onSceneAction(hit({ action: 'fly-to' }), 'hold_action'), true);
    assert.deepEqual(flights.length, 4);
    assert.deepEqual(sounds, ['card_tap', 'card_hold', 'card_tap', 'card_hold']);
    // as the others do
    card._onSceneAction(hit({ action: 'more-info' }), 'tap_action');
    assert.equal(sounds.length, 5);
});

test('entities are followed through the core: one refresh per update with every change, again after a reconnect', async () => {
    /** @type {Map<string, Function[]>} */
    const subs = new Map();
    const card = /** @type {any} */ (Object.create(LCARdSAstrometricsCard.prototype));
    Object.defineProperty(card, 'isConnected', { value: true });
    card._singletons = { systemsManager: {} };
    card._entityUnsubs = [];
    card._subscribedKey = null;
    card._changedEntities = new Set();
    card._entityFlushQueued = false;
    card._onEntityChange = LCARdSAstrometricsCard.prototype._onEntityChange.bind(card);
    card.subscribeToEntity = (/** @type {string} */ id, /** @type {Function} */ fn) => {
        subs.set(id, [...(subs.get(id) ?? []), fn]);
        return () => subs.set(id, (subs.get(id) ?? []).filter((f) => f !== fn));
    };
    /** @type {any[]} */
    const refreshed = [];
    card._runtime = {};
    card._refreshBindings = (/** @type {Set<string>} */ c) => refreshed.push(['bindings', [...c]]);
    card._refreshSettings = (/** @type {Set<string>} */ c) => refreshed.push(['settings', [...c]]);
    card._refreshLabels = (/** @type {any} */ c) => refreshed.push(['labels', [...c.entities]]);
    card._trackedEntities = ['input_number.a', 'light.b', 'input_number.a'];
    card._subscribeEntities();
    assert.deepEqual([...subs.keys()], ['input_number.a', 'light.b']);
    // the same set: no new subscriptions
    card._subscribeEntities();
    assert.equal(subs.get('light.b')?.length, 1);
    // two changes in one update: one refresh with both
    subs.get('input_number.a')?.[0]('input_number.a');
    subs.get('light.b')?.[0]('light.b');
    await Promise.resolve();
    assert.deepEqual(refreshed, [['bindings', ['input_number.a', 'light.b']], ['settings', ['input_number.a', 'light.b']], ['labels', ['input_number.a', 'light.b']]]);
    // a new tracked set: the old one dropped
    card._trackedEntities = ['light.b'];
    card._subscribeEntities();
    assert.equal(subs.get('input_number.a')?.length, 0);
    assert.equal(subs.get('light.b')?.length, 1);
    // a disconnect (the base drops them all), then a reconnect follows them again
    subs.clear();
    card._entityUnsubs = [];
    card._subscribedKey = null;
    card._subscribeEntities();
    assert.equal(subs.get('light.b')?.length, 1);
});
