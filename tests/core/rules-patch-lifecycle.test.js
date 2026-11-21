/**
 * Rule patch lifecycle on LCARdSCard (D3c):
 *  - RC1: a patch did not come off after a reconnect (the patched config was
 *    snapshot as the base on re-registration)
 *  - RC2: a config re-process (theme override, alert mode) dropped the active
 *    patch, and the next rules callback saw the same patch and returned early
 *  - RC3: _getMergedStyleWithRules(style) merged the whole config-shaped patch
 *    into a style object (values landed under style.style)
 */
import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { installJsdom } from '../helpers/jsdom-env.js';

const env = installJsdom();
for (const k of ['Document', 'CSSStyleSheet', 'ShadowRoot']) {
    if (!(k in globalThis)) /** @type {any} */ (globalThis)[k] = /** @type {any} */ (env.dom.window)[k];
}
after(() => env.restore());

const { LCARdSCard } = await import('../../src/base/LCARdSCard.js');

const RED = [{ id: 'b1', style: { card: { color: { background: 'red' } } } }];
const blueConfig = () => ({ type: 'custom:lcards-button', id: 'b1', style: { card: { color: { background: 'blue' } } } });

/** A bare card with the rules state the constructor sets. */
function makeCard() {
    const card = /** @type {any} */ (Object.create(LCARdSCard.prototype));
    let hookCalls = 0;
    Object.assign(card, {
        _overlayId: 'b1', _lastRulePatches: null, _baseConfig: null, _provenanceTracker: null,
        _overlayRegistered: true, _rulesCallback: null, _singletons: null,
        requestUpdate() {}, _onRulePatchesChanged() { hookCalls++; },
        config: blueConfig(),
    });
    return { card, hooks: () => hookCalls };
}
const bg = (card) => card.config.style.card.color.background;

test('RC1: a rule patch comes off after a disconnect and reconnect', () => {
    const { card } = makeCard();
    card._applyRulePatches(RED);
    assert.equal(bg(card), 'red');

    card._unregisterOverlayFromRules(); // disconnect
    assert.equal(bg(card), 'blue', 'unregistering takes the patch off the config');

    card._overlayId = 'b1'; card._overlayRegistered = true; // re-registration
    card._applyRulePatches(RED);
    assert.equal(bg(card), 'red');
    card._applyRulePatches([]); // rule stops matching
    assert.equal(bg(card), 'blue', 'the base is the unpatched config');
});

test('RC2: a config re-process keeps the active rule patch applied', () => {
    const { card, hooks } = makeCard();
    card._applyRulePatches(RED);
    const before = hooks();

    // what _processConfigAsync does with a fresh merged config
    card.config = { ...blueConfig(), style: { card: { color: { background: 'blue', text: 'white' } } } };
    card._rebaseRulePatches();
    assert.equal(bg(card), 'red', 'patch applied to the new config');
    assert.equal(card.config.style.card.color.text, 'white', 'new config values kept');
    assert.ok(hooks() > before, 'the card re-resolves its styles');

    card._applyRulePatches(RED); // next callback, same patch
    assert.equal(bg(card), 'red');
    card._applyRulePatches([]);
    assert.equal(bg(card), 'blue', 'restore uses the new base');
    assert.equal(card.config.style.card.color.text, 'white');
});

test('RC2: _processConfigAsync calls the rebase after committing the merged config', async () => {
    const { card } = makeCard();
    card._configRunId = 0;
    card._applyRulePatches(RED);
    const prevCore = /** @type {any} */ (globalThis).window.lcards;
    /** @type {any} */ (globalThis).window.lcards = {
        core: { configManager: { initialized: true, processConfig: async () => ({ valid: true, mergedConfig: blueConfig() }) } },
    };
    card._updateTrackedEntities = () => {};
    card._trackStateBranches = () => {};
    card._trackPresetDefaults = () => {};
    try {
        await card._processConfigAsync(blueConfig());
    } finally {
        /** @type {any} */ (globalThis).window.lcards = prevCore;
    }
    assert.equal(bg(card), 'red');
    card._applyRulePatches([]);
    assert.equal(bg(card), 'blue');
});

test('RC2: without an active patch the rebase changes nothing', () => {
    const { card, hooks } = makeCard();
    card._rebaseRulePatches();
    assert.equal(bg(card), 'blue');
    assert.equal(card._baseConfig, null);
    assert.equal(hooks(), 0);
});

test('RC3: _getMergedStyleWithRules merges the patch style into a style object', () => {
    const { card } = makeCard();
    assert.deepEqual(card._getMergedStyleWithRules({ opacity: 0.7 }), { opacity: 0.7 }, 'no patch: unchanged');
    card._applyRulePatches([{ id: 'b1', style: { opacity: 1, card: { color: { background: 'red' } } }, text: { name: { content: 'x' } } }]);
    const merged = card._getMergedStyleWithRules({ opacity: 0.7, card: { color: { text: 'white' } } });
    assert.equal(merged.opacity, 1, 'rule wins over a style default');
    assert.deepEqual(merged.card.color, { text: 'white', background: 'red' });
    assert.equal(merged.style, undefined, 'no nested style key');
    assert.equal(merged.id, undefined, 'no patch metadata');
    assert.equal(merged.text, undefined, 'non-style keys stay on the config');
});
