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
    assert.deepEqual(Object.keys(engine.createEmptyResult()).sort(), ['animations', 'baseSvgUpdate', 'overlayPatches']);
    const aggregated = engine.aggregateResults([
        { overlayPatches: [], animations: [{ preset: 'pulse' }], baseSvgUpdate: { transition: 100 }, priority: 1 },
        { overlayPatches: [], animations: [{ preset: 'glow' }], baseSvgUpdate: { transition: 900 }, priority: 0 },
    ]);
    assert.deepEqual(Object.keys(aggregated).sort(), ['animations', 'baseSvgUpdate', 'overlayPatches']);
    assert.deepEqual(aggregated.animations.map(a => a.preset), ['pulse', 'glow']);
    assert.equal(aggregated.baseSvgUpdate.transition, 100); // highest priority wins
});
