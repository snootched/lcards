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
    areas: {
        bridge: { area_id: 'bridge', name: 'Bridge' },
        engineering: { area_id: 'engineering', name: 'Engineering' },
        cargo: { area_id: 'cargo', name: 'Cargo Bay' },
    },
    // light.a: own area; light.b: its device's area; light.c: own area wins over the
    // device's; light.hidden and light.diag are left out; switch.x is not a light.
    entities: {
        'light.a': { entity_id: 'light.a', area_id: 'bridge' },
        'light.b': { entity_id: 'light.b', device_id: 'dev1' },
        'light.c': { entity_id: 'light.c', area_id: 'engineering', device_id: 'dev1' },
        'light.hidden': { entity_id: 'light.hidden', area_id: 'bridge', hidden: true },
        'light.diag': { entity_id: 'light.diag', area_id: 'bridge', entity_category: 'diagnostic' },
        'switch.x': { entity_id: 'switch.x', area_id: 'bridge' },
    },
    devices: { dev1: { id: 'dev1', area_id: 'bridge' } },
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

/** Every action config (`*_action` or `actions[]` entry) anywhere in the generated dashboard. */
function collectActions(node, out = []) {
    if (Array.isArray(node)) { node.forEach(n => collectActions(n, out)); return out; }
    if (!node || typeof node !== 'object') return out;
    for (const [key, value] of Object.entries(node)) {
        if (/_action$/.test(key) && value && typeof value === 'object') out.push(value);
        collectActions(value, out);
    }
    return out;
}

test('shell strategy actions use the current Home Assistant grammar (perform-action, perform_action, target)', async () => {
    const all = [];
    for (const config of [
        {},
        { room_selector_entity: 'input_select.rooms', page_selector_entity: 'input_select.rooms', top_bar_entity: 'input_boolean.top', right_sidebar_entity: 'input_boolean.right' },
        { room_selector_entity: 'input_text.area' },
    ]) {
        all.push(...collectActions(await strategy.generate(config, hass)));
    }
    assert.ok(all.length > 0);
    for (const a of all) {
        assert.notEqual(a.action, 'call-service', JSON.stringify(a));
        assert.equal('service' in a, false, `old service key: ${JSON.stringify(a)}`);
        assert.equal('service_data' in a, false, `old service_data key: ${JSON.stringify(a)}`);
    }

    const select = all.find(a => a.action === 'perform-action');
    assert.deepEqual(select, {
        action: 'perform-action',
        perform_action: 'input_text.set_value',
        target: { entity_id: 'input_text.area' },
        data: { value: 'bridge' },
    });
});

/** Every LCARdS card config anywhere in the generated dashboard. */
function collectCards(node, out = []) {
    if (Array.isArray(node)) { node.forEach(n => collectCards(n, out)); return out; }
    if (!node || typeof node !== 'object') return out;
    if (typeof node.type === 'string' && node.type.startsWith('custom:lcards-')) out.push(node);
    for (const value of Object.values(node)) collectCards(value, out);
    return out;
}

test('shell strategy: no top bar row trick, and no dead taps (a toggle on a card with no entity)', async () => {
    for (const config of [{}, { top_bar_entity: 'input_boolean.top', right_sidebar_entity: 'input_boolean.right' }]) {
        const dashboard = await strategy.generate(config, hass);
        const view = dashboard.views[0];
        // One auto top bar row; the layout view collapses it (strategies-plan.md S1.1)
        assert.equal(view.layout['grid-template-rows'].split(' ')[0], 'auto');
        for (const card of collectCards(dashboard)) {
            if (card.tap_action?.action === 'toggle') assert.ok(card.entity, `toggle with no entity: ${JSON.stringify(card).slice(0, 120)}`);
        }
    }
});

/** Every card config anywhere in the generated dashboard, any type. */
function allCards(node, out = []) {
    if (Array.isArray(node)) { node.forEach(n => allCards(n, out)); return out; }
    if (!node || typeof node !== 'object') return out;
    if (typeof node.type === 'string') out.push(node);
    for (const value of Object.values(node)) allCards(value, out);
    return out;
}

test('shell strategy: room lights come from the registries, no auto-entities', async () => {
    const { roomLightsFromRegistries } = await import('../../src/strategies/lcards-shell-strategy.js');
    assert.deepEqual(roomLightsFromRegistries(hass), [
        { area_id: 'bridge', name: 'Bridge', lights: ['light.a', 'light.b'] },
        { area_id: 'cargo', name: 'Cargo Bay', lights: [] },
        { area_id: 'engineering', name: 'Engineering', lights: ['light.c'] },
    ]);
    assert.deepEqual(roomLightsFromRegistries({}), []);

    for (const [selector, config] of [
        ['input_select.rooms', { room_selector_entity: 'input_select.rooms' }],
        ['input_text.area', { room_selector_entity: 'input_text.area' }],
    ]) {
        const cards = allCards(await strategy.generate(config, hass));
        assert.equal(cards.some(c => c.type === 'custom:auto-entities'), false, selector);
        const lists = cards.filter(c => c.type === 'custom:lcards-layout-card' && c.visibility);
        assert.deepEqual(lists.map(l => [l.visibility, l.cards.map(c => c.entity)]), [
            [[{ condition: 'state', entity: selector, state: ['bridge', 'Bridge'] }], ['light.a', 'light.b']],
            [[{ condition: 'state', entity: selector, state: ['engineering', 'Engineering'] }], ['light.c']],
        ], selector);
        const empty = cards.find(c => c.type === 'custom:lcards-button' && c.visibility);
        assert.deepEqual(empty?.visibility, [{ condition: 'state', entity: selector, state: ['cargo', 'Cargo Bay'] }]);
        // the wrapper in the list cell has no condition, so the column never collapses
        const wrapper = cards.find(c => c.view_layout?.['grid-area'] === 'list');
        assert.equal(wrapper?.visibility, undefined);
        assert.equal(wrapper?.cards.length, 3);
    }
});
