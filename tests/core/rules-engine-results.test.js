/**
 * RulesEngine results: what a matched rule hands to cards. Rule profiles were
 * retired (they never applied), so results carry overlay patches, animations
 * and a base SVG update only.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { RulesEngine } from '../../src/core/rules/RulesEngine.js';

test('results: overlay patches, animations and base_svg; no profile lists', () => {
    const engine = new RulesEngine([], null);
    assert.deepEqual(Object.keys(engine.createEmptyResult()).sort(), ['animations', 'baseSvgUpdate', 'baseSvgUpdates', 'overlayPatches']);
    const aggregated = engine.aggregateResults([
        { overlayPatches: [], animations: [{ preset: 'pulse' }], baseSvgUpdate: { transition: 100 }, priority: 1 },
        { overlayPatches: [], animations: [{ preset: 'glow' }], baseSvgUpdate: { transition: 900 }, priority: 0 },
    ]);
    assert.deepEqual(Object.keys(aggregated).sort(), ['animations', 'baseSvgUpdate', 'baseSvgUpdates', 'overlayPatches']);
    assert.deepEqual(aggregated.animations.map(a => a.preset), ['pulse', 'glow']);
    assert.equal(aggregated.baseSvgUpdate.transition, 100); // highest priority wins
});

test('base_svg updates by source card: each MSD gets its own rule\'s (highest priority first)', () => {
    const engine = new RulesEngine([], null);
    const aggregated = engine.aggregateResults([
        { overlayPatches: [], baseSvgUpdate: { transition: 1 }, sourceCardId: 'msd_a', priority: 0 },
        { overlayPatches: [], baseSvgUpdate: { transition: 2 }, sourceCardId: 'msd_a', priority: 5 },
        { overlayPatches: [], baseSvgUpdate: { transition: 3 }, sourceCardId: 'msd_b', priority: 0 },
        { overlayPatches: [], baseSvgUpdate: { transition: 4 }, priority: 0 },
    ]);
    assert.equal(aggregated.baseSvgUpdates.msd_a.transition, 2);
    assert.equal(aggregated.baseSvgUpdates.msd_b.transition, 3);
    assert.equal(aggregated.baseSvgUpdates['*'].transition, 4);
});

test('a rule marked dirty again while it is evaluated stays dirty (an MSD registering its overlays mid-evaluation)', async () => {
    const engine = new RulesEngine([{ id: 'r1', when: { entity: 'input_boolean.x', state: 'on' }, apply: {} }], null);
    engine.markAllDirty();
    const evaluate = engine.evaluateRule.bind(engine);
    let calls = 0;
    engine.evaluateRule = async (...args) => {
        calls++;
        // the overlays register and mark every rule dirty while this one is being evaluated
        if (calls === 1) engine.markAllDirty();
        return evaluate(...args);
    };
    await engine.evaluateDirty({ getEntity: () => ({ state: 'on' }) });
    assert.ok(engine.dirtyRules.has('r1'), 'still dirty: the next evaluation sees the new overlays');
    await engine.evaluateDirty({ getEntity: () => ({ state: 'on' }) });
    assert.equal(calls, 2);
    assert.equal(engine.dirtyRules.size, 0);
});
