/**
 * The `'x-required'` lists on the animation preset params schemas
 * (src/cards/schemas/animation-preset-params-schemas.js) are what the config
 * checker warns about. They have to match the preset factories: a preset with a
 * list skips the animation without those params, every other preset runs with
 * none at all.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { installJsdom } from '../helpers/jsdom-env.js';
import { getAnimationPreset, listAnimationPresets } from '../../src/core/animation/presets.js';
import { registerBuiltinAnimationPresets } from '../../src/core/packs/animations/index.js';
import { ANIMATION_PRESET_PARAMS_SCHEMAS, missingPresetParams } from '../../src/cards/schemas/animation-preset-params-schemas.js';

const env = installJsdom();
registerBuiltinAnimationPresets();

/** A value for each required param that the factory accepts. */
const SAMPLE = { color_from: '#ffffff', color_to: '#000000', from: 0, to: 1, path: '#route', steps: [{ scale: 1.2 }] };

/** True when the factory returned an animation that does nothing (the "missing params" path). */
function isNoOp(preset, def) {
    const result = getAnimationPreset(preset)(def);
    if (preset === 'morph') {
        // morph checks `to` when it is set up on the element
        const element = /** @type {any} */ ({});
        result.setup(element);
        return element._animTargets === null;
    }
    return Object.keys(result?.anime ?? {}).length === 0 && !result.setup && !result.batch;
}

test('x-required: a preset with a list does nothing without those params and runs with them; every other preset runs with no params', () => {
    // custom passes the given anime.js props through: none of them in particular is required
    const presets = listAnimationPresets().filter((p) => p !== 'custom');
    const required = Object.fromEntries(presets.map((p) => [p, ANIMATION_PRESET_PARAMS_SCHEMAS[p]?.['x-required'] ?? []]));
    for (const preset of presets) {
        assert.equal(isNoOp(preset, { preset }), required[preset].length > 0, `${preset} with no params`);
        if (preset === 'morph' || !required[preset].length) continue;
        const params = Object.fromEntries(required[preset].map((n) => [n, SAMPLE[n]]));
        assert.equal(isNoOp(preset, { preset, params }), false, `${preset} with ${required[preset].join(', ')}`);
        // each one alone is not enough
        for (const name of required[preset]) {
            const { [name]: _drop, ...rest } = params;
            assert.equal(isNoOp(preset, { preset, params: rest }), true, `${preset} without ${name}`);
        }
    }
    assert.deepEqual(Object.fromEntries(Object.entries(required).filter(([, r]) => r.length)), {
        'color-shift': ['color_from', 'color_to'],
        motionpath: ['path'],
        morph: ['to'],
        sequence: ['steps'],
        'physics-spring': ['from', 'to'],
        'timeline-cascade': ['steps'],
    });
});

test('missingPresetParams: params count from the top level and params, a deprecated alias stands in, templates and unknown presets pass', () => {
    assert.deepEqual(missingPresetParams('color-shift', { preset: 'color-shift' }), ['color_from', 'color_to']);
    assert.deepEqual(missingPresetParams('color-shift', { preset: 'color-shift', color_from: '#fff', params: { color_to: '#000' } }), []);
    assert.deepEqual(missingPresetParams('physics-spring', { preset: 'physics-spring', params: { from: 0 } }), ['to']);
    assert.deepEqual(missingPresetParams('sequence', { preset: 'sequence', params: { steps: [] } }), ['steps']);
    assert.deepEqual(missingPresetParams('morph', { preset: 'morph', params: { morph_to_selector: '#b' } }), []);
    assert.deepEqual(missingPresetParams('color-shift', { preset: 'color-shift', params: '[[[ return {} ]]]' }), []);
    assert.deepEqual(missingPresetParams('my-pack-preset', { preset: 'my-pack-preset' }), []);
    assert.deepEqual(missingPresetParams('pulse', { preset: 'pulse' }), []);
});

test.after(() => env.restore());
