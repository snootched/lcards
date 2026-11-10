/**
 * Rules, MSD and validation wiring bugs from the D3b docs rewrite, on the real
 * core under jsdom:
 *  - R3: a card sets its rules again on every config change and releases them a
 *    little after a disconnect (kept when it reconnects in time: a move)
 *  - R4: the shared RulesEngine had no DataSourceManager
 *  - R7: lcardsCore.getRulesCount() / getRulesInfo() threw (removed)
 *  - R8: the MSD registered itself with the type ['msd-card'] (an array), so
 *    type:msd-card selectors never matched it
 *  - R9: an MSD wrote strict mode onto the shared validation service
 */
import { test, after, mock } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createFakeHass } from '../helpers/fake-hass.js';
import { installJsdom } from '../helpers/jsdom-env.js';

const { dom } = installJsdom();
for (const key of Object.getOwnPropertyNames(dom.window)) {
    if (/^[A-Z]/.test(key) && !(key in globalThis)) globalThis[key] = dom.window[key];
}
globalThis.lcards = { core: {} }; // normally created by src/lcards-main.js
const { lcardsCore } = await import('../../src/core/lcards-core.js');
await lcardsCore.initialize(createFakeHass());
globalThis.lcards.core = lcardsCore;
after(() => clearInterval(lcardsCore._globalHassTimer));

const { LCARdSCard, RULES_RELEASE_MS } = await import('../../src/base/LCARdSCard.js');
const { LCARdSMSDCard } = await import('../../src/cards/lcards-msd.js');
const { CoreValidationService } = await import('../../src/core/validation-service/index.js');

test('R4: the shared RulesEngine has the shared DataSourceManager', () => {
    assert.ok(lcardsCore.dataSourceManager);
    assert.equal(lcardsCore.rulesManager.dataSourceManager, lcardsCore.dataSourceManager);
    assert.ok(lcardsCore.rulesManager._dataSourceUnsubscribe, 'and listens for its updates');
});

test('R7: the throwing rules helpers are gone from the core', () => {
    assert.equal(/** @type {any} */ (lcardsCore).getRulesCount, undefined);
    assert.equal(/** @type {any} */ (lcardsCore).getRulesInfo, undefined);
});

test('R3: a card replaces its rules on a config change; a disconnect releases them unless it comes back', () => {
    const engine = lcardsCore.rulesManager;
    const card = /** @type {any} */ (Object.create(LCARdSCard.prototype));
    Object.assign(card, {
        _cardGuid: 'card-guid-r3', _singletons: { rulesEngine: engine }, _ownsRules: false,
        _rulesReleaseTimer: null, _hasRulesToLoad: false,
        config: { type: 'custom:lcards-button', id: 'b1', rules: [{ id: 'r3', when: { entity: 'light.x', state: 'on' }, apply: {} }] },
    });
    Object.defineProperty(card, 'isConnected', { value: false, writable: true });

    card._loadRulesFromConfig(card.config.rules);
    assert.equal(engine.rulesById.get('r3')?._sourceCardId, 'b1');

    card._loadRulesFromConfig([{ id: 'r3', when: { entity: 'light.x', state: 'off' }, apply: {} }]);
    assert.equal(engine.rulesById.get('r3').when.state, 'off', 'edit applies without a reload');

    mock.timers.enable({ apis: ['setTimeout'] });
    try {
        card._scheduleRulesRelease();
        card._cancelRulesRelease(); // reconnected (a move): rules kept
        mock.timers.tick(RULES_RELEASE_MS + 1);
        assert.ok(engine.rulesById.has('r3'));

        card._scheduleRulesRelease(); // removed from the dashboard
        mock.timers.tick(RULES_RELEASE_MS + 1);
        assert.equal(engine.rulesById.has('r3'), false, 'released');
        assert.equal(card._hasRulesToLoad, true, 'set again if the card connects again');
    } finally {
        mock.timers.reset();
    }

    card._loadRulesFromConfig(card.config.rules);
    assert.ok(engine.rulesById.has('r3'));
    card._loadRulesFromConfig([]);
    assert.equal(engine.rulesById.has('r3'), false, 'rules taken out of the config are removed');
});

test('R8: the MSD registers itself with the type msd-card (a string)', () => {
    /** @type {any[]} */
    const calls = [];
    const card = /** @type {any} */ (Object.create(LCARdSMSDCard.prototype));
    Object.assign(card, {
        _cardGuid: 'msd-guid', _msdConfig: { overlays: [] }, _singletons: null,
        _registerOverlayForRules: (...args) => calls.push(args),
    });
    Object.defineProperty(card, 'hass', { value: null, writable: true });
    card._registerOverlaysWithRulesEngine();
    assert.equal(calls.length, 1);
    assert.equal(calls[0][0], 'msd-guid');
    assert.equal(calls[0][1], 'msd-card');
});

test('R9: warnings never invalidate a result (no strict mode); the MSD pipeline does not write the shared config', () => {
    const service = new CoreValidationService({ validateEntities: false, cacheResults: true });
    const schema = { type: 'object', properties: { old: { type: 'string', deprecated: true } } };
    const data = { old: 'x' };
    const loose = service.validate(data, schema);
    assert.ok(loose.warnings.length > 0, 'a deprecated key is a warning');
    assert.equal(loose.valid, true);
    assert.equal(service.validate(data, schema, { strict: true }).valid, true, 'strict mode was removed');
    assert.equal('strict' in service.config, false);

    const pipeline = readFileSync(new URL('../../src/msd/pipeline/PipelineCore.js', import.meta.url), 'utf8');
    assert.doesNotMatch(pipeline, /validationService\.config\.\w+\s*=/);
});
