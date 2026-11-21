/**
 * RulesEngine bugs from the D3b docs rewrite:
 *  - R1: rules that read the clock (time_between, weekday_in, random_chance) were
 *    never checked again once the state_changed subscription existed
 *  - R3: card rules were never replaced or removed (an existing id was skipped)
 *  - R4: rules naming a data source never re-checked when the source updated
 *    (and the shared engine had no DataSourceManager at all)
 */
import { test, mock } from 'node:test';
import assert from 'node:assert/strict';
import * as RulesEngineModule from '../../src/core/rules/RulesEngine.js';

const { RulesEngine } = RulesEngineModule;
const TIME_REFRESH_MS = RulesEngineModule.TIME_REFRESH_MS ?? 60000;

const tick = () => new Promise((resolve) => setImmediate(resolve));

test('R1: time rules are marked dirty every minute, even with the state_changed subscription', () => {
    mock.timers.enable({ apis: ['setTimeout', 'Date'], now: Date.UTC(2026, 10, 9, 10, 0, 30) });
    try {
        const engine = new RulesEngine([
            { id: 'night', when: { time_between: '22:00-06:00' }, apply: {} },
            { id: 'weekday', when: { all: [{ weekday_in: ['mon'] }, { entity: 'light.x', state: 'on' }] }, apply: {} },
            { id: 'ent', when: { entity: 'light.x', state: 'on' }, apply: {} },
        ], null);
        engine.hassUnsubscribe = () => {}; // monitoring active: ingestHass no longer marks all dirty
        let calls = 0;
        engine.setReEvaluationCallback(() => { calls++; });
        engine.dirtyRules.clear();

        engine.ingestHass({ states: {} });
        assert.equal(engine.dirtyRules.size, 0, 'a hass update alone leaves time rules clean');

        mock.timers.tick(TIME_REFRESH_MS / 2 + 100); // past the next minute boundary
        assert.deepEqual([...engine.dirtyRules].sort(), ['night', 'weekday'], 'entity-only rules stay clean');
        assert.equal(calls, 1, 'cards re-evaluate');

        engine.dirtyRules.clear();
        mock.timers.tick(TIME_REFRESH_MS);
        assert.equal(engine.dirtyRules.size, 2, 'and again the minute after');
        assert.equal(calls, 2);

        engine.destroy();
        assert.equal(engine._timeRefreshTimer, null, 'destroy() stops the timer');
    } finally {
        mock.timers.reset();
    }
});

test('R1: no timer without time rules', () => {
    const engine = new RulesEngine([{ id: 'ent', when: { entity: 'light.x', state: 'on' }, apply: {} }], null);
    assert.equal(engine._timeRefreshTimer, null);
});

test('R3: a card\'s changed rule replaces the live one, a dropped rule is removed', async () => {
    const engine = new RulesEngine([], null);
    let calls = 0;
    engine.setReEvaluationCallback(() => { calls++; });
    const meta = { sourceCardId: 'btn', sourceCardType: 'lcards-button' };

    engine.setCardRules('guid-a', [
        { id: 'r1', when: { entity: 'light.x', state: 'on' }, apply: { overlays: { a: { style: { color: 'red' } } } } },
        { id: 'r2', when: { entity: 'light.y', state: 'on' }, apply: {} },
    ], meta);
    assert.deepEqual(engine.rules.map(r => r.id), ['r1', 'r2']);
    assert.equal(engine.rulesById.get('r1')._sourceCardId, 'btn');
    await tick();
    assert.equal(calls, 1, 'cards re-evaluate after the change');

    const counts = engine.setCardRules('guid-a', [
        { id: 'r1', when: { entity: 'light.x', state: 'off' }, apply: { overlays: { a: { style: { color: 'blue' } } } } },
    ], meta);
    assert.deepEqual(counts, { added: 0, replaced: 1, removed: 1 });
    assert.deepEqual(engine.rules.map(r => r.id), ['r1']);
    assert.equal(engine.rulesById.get('r1').when.state, 'off');
    assert.equal(engine.compiledRules.has('r2'), false);
    assert.equal(engine.dependencyIndex.entityToRules.has('light.y'), false);

    engine.removeCardRules('guid-a');
    assert.equal(engine.rules.length, 0);
});

test('R3: two cards with one id (dashboard card + editor preview) share it; the newest definition is live', () => {
    const engine = new RulesEngine([], null);
    const v1 = { id: 'r1', when: { entity: 'light.x', state: 'on' }, apply: {} };
    const v2 = { id: 'r1', when: { entity: 'light.x', state: 'off' }, apply: {} };
    engine.setCardRules('dashboard', [v1]);
    engine.setCardRules('preview', [v2]);
    assert.equal(engine.rulesById.get('r1').when.state, 'off', 'the preview shows the edit');
    engine.setCardRules('dashboard', [v1]);
    assert.equal(engine.rulesById.get('r1').when.state, 'off', 'the same config set again does not take it back');
    engine.removeCardRules('preview');
    assert.equal(engine.rulesById.get('r1').when.state, 'on', 'dialog closed: the saved card\'s rule');
    engine.removeCardRules('dashboard');
    assert.equal(engine.rules.length, 0);
});

test('R3: pack rules are never replaced or removed by a card', () => {
    const pack = { id: 'pack_rule', when: { entity: 'light.x', state: 'on' }, apply: {} };
    const engine = new RulesEngine([pack], null);
    engine.setCardRules('guid-a', [{ id: 'pack_rule', when: { entity: 'light.x', state: 'off' }, apply: {} }]);
    assert.equal(engine.rulesById.get('pack_rule'), pack);
    engine.removeCardRules('guid-a');
    assert.equal(engine.rulesById.get('pack_rule'), pack);
});

test('R4: a rule naming a data source is checked again when the source updates', async () => {
    /** @type {Set<Function>} */
    const listeners = new Set();
    const data = { v: 10, transformations: { celsius: 30 } };
    const source = { cfg: { entity: 'sensor.raw' }, getCurrentData: () => data };
    const dsm = {
        sources: new Map([['temp_ds', source]]),
        getSource: (name) => (name === 'temp_ds' ? source : undefined),
        getEntity: () => null,
        addEntityChangeListener: (cb) => { listeners.add(cb); return () => listeners.delete(cb); },
    };
    const engine = new RulesEngine([
        { id: 'hot', when: { entity: 'temp_ds.transformations.celsius', above: 25 }, apply: {} },
        { id: 'other', when: { entity: 'light.x', state: 'on' }, apply: {} },
    ], dsm);
    assert.equal(listeners.size, 1, 'the engine listens to the DataSourceManager');
    let calls = 0;
    engine.setReEvaluationCallback(() => { calls++; });
    engine.dirtyRules.clear();

    for (const cb of listeners) cb(['sensor.raw']);
    assert.deepEqual([...engine.dirtyRules], ['hot']);
    assert.equal(calls, 1);
    const result = await engine.evaluateDirty({ getEntity: () => null });
    assert.ok(engine._matchedResults.has('hot'), 'matched from the source value');
    assert.ok(result);

    for (const cb of listeners) cb(['sensor.unrelated']);
    assert.equal(calls, 1, 'other entities do nothing');

    await engine.destroy();
    assert.equal(listeners.size, 0, 'destroy() removes the listener');
});
