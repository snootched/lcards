/**
 * Every card on a page registers a rules callback, and each one calls
 * evaluateDirty() when an entity changes. Each call used to return patches only
 * for the rules it evaluated itself: the first call consumed the dirty rules, so
 * other cards got no patch (three panels tagged together stayed unpatched), and
 * the next unrelated change cleared a patch that still applied. The calls also
 * ran concurrently and each re-evaluated every dirty rule (hundreds of
 * evaluations a second). Now the calls run one at a time and every call returns
 * the patches of every rule that matches (D1c, 2026-11-06).
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { RulesEngine } from '../../src/core/rules/RulesEngine.js';

function setup() {
    const states = {
        'input_number.power': { state: '90', attributes: {} },
        'input_boolean.lights': { state: 'on', attributes: {} },
    };
    const engine = new RulesEngine([
        { id: 'power-high', when: { entity: 'input_number.power', above: 80 },
          apply: { overlays: { 'tag:panels': { style: { color: 'red' } } } } },
        { id: 'lights-on', when: { entity: 'input_boolean.lights', state: 'on' },
          apply: { overlays: { lamp: { style: { color: 'yellow' } } } } },
    ], null);
    const overlays = [
        { id: 'panel-1', type: 'button', tags: ['panels'] },
        { id: 'panel-2', type: 'button', tags: ['panels'] },
        { id: 'lamp', type: 'button', tags: [] },
    ];
    engine._systemsManager = { getAllTargetableOverlays: () => overlays, getHass: () => ({ states }) };
    const getEntity = (id) => states[id];
    const evaluate = () => engine.evaluateDirty({ getEntity });
    const ids = (result) => result.overlayPatches.map(p => p.id).sort();
    return { engine, states, evaluate, ids };
}

test('every card calling at once gets every matched rule\'s patches, and the rules are evaluated once', async () => {
    const { engine, evaluate, ids } = setup();
    const before = engine.evalCounts.total;
    const results = await Promise.all([evaluate(), evaluate(), evaluate()]);
    for (const r of results) assert.deepEqual(ids(r), ['lamp', 'panel-1', 'panel-2']);
    assert.equal(engine.evalCounts.total - before, 2, 'two dirty rules, evaluated by the first call only');
});

test('a change to another rule\'s entity keeps the patches of rules that still match', async () => {
    const { engine, states, evaluate, ids } = setup();
    await evaluate();
    states['input_boolean.lights'] = { state: 'off', attributes: {} };
    engine.markEntitiesDirty(['input_boolean.lights']);
    const after = await evaluate();
    assert.deepEqual(ids(after), ['panel-1', 'panel-2'], 'power-high still matches; lights-on no longer does');
    states['input_number.power'] = { state: '50', attributes: {} };
    engine.markEntitiesDirty(['input_number.power']);
    assert.deepEqual(ids(await evaluate()), [], 'a rule that stops matching drops its patches');
});
