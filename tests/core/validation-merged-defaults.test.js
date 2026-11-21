/**
 * Validation runs on the merged, theme-resolved config, so whatever the
 * builtin presets and default theme produce must pass the card schema.
 *
 * Regression: a new slider (stub config) reported 18 "Format validation failed"
 * errors because default tokens resolve to `black` and to `color-mix(...)`
 * (lighten/darken of a CSS variable), and the colour pattern accepted neither.
 */
import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { createFakeHass } from '../helpers/fake-hass.js';
import { installJsdom } from '../helpers/jsdom-env.js';
import { getSliderSchema } from '../../src/cards/schemas/slider-schema.js';
import { getButtonSchema } from '../../src/cards/schemas/button-schema.js';
import { getElbowSchema } from '../../src/cards/schemas/elbow-schema.js';

installJsdom();
globalThis.lcards = { core: {} }; // normally created by src/lcards-main.js
const { lcardsCore } = await import('../../src/core/lcards-core.js');
await lcardsCore.initialize(createFakeHass());
globalThis.lcards.core = lcardsCore; // as src/lcards-main.js does
// lcardsCore.destroy() throws (AnimationManager has no destroy()); stop the poll directly.
after(() => clearInterval(lcardsCore._globalHassTimer));

// What the cards' registerSchema() passes (lcards-button.js, lcards-slider.js).
const positionEnum = [
    'top-left', 'top-center', 'top-right', 'center-left', 'center', 'center-right',
    'bottom-left', 'bottom-center', 'bottom-right', 'top', 'bottom', 'left', 'right',
    'left-center', 'right-center',
];

const CARDS = [
    ['slider', getSliderSchema, { component: 'default', preset: 'pills-left-border' }],
    ['button', getButtonSchema, { preset: 'lozenge' }],
    ['elbow', getElbowSchema, { elbow: { type: 'header-left' } }],
];

for (const [cardType, getSchema, stub] of CARDS) {
    test(`${cardType}: every builtin preset validates after the merge`, async () => {
        const presets = lcardsCore.stylePresetManager.getAvailablePresets(cardType);
        lcardsCore.configManager.registerCardSchema(cardType, getSchema({ availablePresets: presets, positionEnum }));
        const configs = [stub, ...presets.map(preset => ({ ...stub, preset }))];
        for (const extra of configs) {
            const config = { type: `custom:lcards-${cardType}`, entity: 'light.tv', ...extra };
            const result = await lcardsCore.configManager.processConfig(config, cardType, {});
            const problems = [...result.errors, ...result.warnings].map(e => `${e.field}: ${e.message}`);
            assert.deepEqual(problems, [], `${cardType} ${JSON.stringify(extra)}`);
        }
    });
}
