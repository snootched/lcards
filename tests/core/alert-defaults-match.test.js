/**
 * The built-in alert transforms match the alert_lab_* helper defaults (the user,
 * 2026-11-08): the Lab's Reset and the Helpers tab's "Reset to Defaults" gave
 * different colours (blue range 70 vs 60, black lightness 70% vs 30% ...).
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { HELPER_REGISTRY } from '../../src/core/helpers/lcards-helper-registry.js';
import { getDefaultAlertModeTransform } from '../../src/core/themes/alertModeTransform.js';

const helper = (k) => HELPER_REGISTRY[`alert_lab_${k}`]?.default_value;

test('every alert_lab_* helper default equals the built-in transform', () => {
    const diff = [];
    for (const mode of ['red', 'yellow', 'blue', 'gray', 'black']) {
        const t = getDefaultAlertModeTransform(`${mode}_alert`);
        const check = (key, actual, scale = 1) => {
            const h = helper(`${mode}_${key}`);
            if (h !== undefined && Math.abs(h - actual * scale) > 1e-9) diff.push(`${mode}_${key}: helper ${h}, built-in ${actual * scale}`);
        };
        check('hue', t.hueShift);
        check('hue_strength', t.hueStrength);
        check('saturation', t.saturationMultiplier, 100);
        check('lightness', t.lightnessMultiplier, 100);
        if (t.hueAnchor) {
            check('center_hue', t.hueAnchor.centerHue);
            check('range', t.hueAnchor.range);
            check('strength', t.hueAnchor.strength);
        }
        if (t.contrastEnhancement) {
            check('threshold', t.contrastEnhancement.threshold);
            check('dark_multiplier', t.contrastEnhancement.darkMultiplier);
            check('light_multiplier', t.contrastEnhancement.lightMultiplier);
        }
    }
    assert.deepEqual(diff, []);
});
