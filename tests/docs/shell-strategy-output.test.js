/**
 * The dashboards the LCARS shell strategy generates are valid LCARdS config: the
 * config checker (scripts/lcards-validate.mjs) finds no errors or warnings in any
 * variant. (It once emitted a dead `elbow.radius`, header elbows without a type,
 * and a 0.01 bar the schema rejected.)
 */
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { installJsdom } from '../helpers/jsdom-env.js';

let env;
let strategy;
let validateTexts;
before(async () => {
    env = installJsdom();
    // Lit's node build reads these constructors as globals.
    for (const k of ['Document', 'CSSStyleSheet', 'ShadowRoot']) globalThis[k] ??= env.dom.window[k];
    ({ LCARdSShellDashboardStrategy: strategy } = await import('../../src/strategies/lcards-shell-strategy.js'));
    ({ validateTexts } = await import('../../scripts/lcards-validate.mjs'));
});
after(() => env?.restore());

const hass = {
    states: {
        'input_select.rooms': { state: 'Bridge', attributes: { options: ['Bridge', 'Engineering'] } },
        'input_text.area': { state: '' },
        'input_boolean.top': { state: 'on' },
        'input_boolean.right': { state: 'on' },
    },
    areas: { bridge: { area_id: 'bridge', name: 'Bridge' } },
};

for (const [name, config] of [
    ['no entities (placeholders)', {}],
    ['entity mode, every option', { room_selector_entity: 'input_select.rooms', page_selector_entity: 'input_select.rooms', top_bar_entity: 'input_boolean.top', right_sidebar_entity: 'input_boolean.right' }],
    ['auto-areas mode', { room_selector_entity: 'input_text.area' }],
]) {
    test(`shell strategy output is valid: ${name}`, async () => {
        const dashboard = await strategy.generate(config, hass);
        assert.ok(dashboard.views?.length);
        const issues = await validateTexts([{ name, text: JSON.stringify(dashboard) }]);
        assert.deepEqual(issues.map(i => `${i.severity} ${i.path}: ${i.message}`), []);
    });
}
