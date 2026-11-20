/**
 * The Picard shell strategy (custom:lcars-shell-picard, reports/shell-picard-plan.md)
 * generates valid LCARdS config for every option set, reads lights and sensors per
 * area from the registries, and shows them per room by Visibility conditions.
 */
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { installJsdom } from '../helpers/jsdom-env.js';

let env;
let strategy;
let roomSensorsFromRegistries;
let validateTexts;
before(async () => {
    env = installJsdom();
    for (const k of ['Document', 'CSSStyleSheet', 'ShadowRoot']) globalThis[k] ??= env.dom.window[k];
    ({ LCARdSShellPicardDashboardStrategy: strategy, roomSensorsFromRegistries } = await import('../../src/strategies/lcards-shell-picard-strategy.js'));
    ({ validateTexts } = await import('../../scripts/lcards-validate.mjs'));
});
after(() => env?.restore());

const sensor = (device_class, friendly_name) => ({ state: '21', attributes: { device_class, friendly_name } });
const hass = {
    states: {
        'input_select.rooms': { state: 'Bridge', attributes: { options: ['Bridge', 'Engineering'] } },
        'input_select.pages': { state: 'Main', attributes: { options: ['Main', 'Ops', 'Sensors'] } },
        'input_text.area': { state: '' },
        'input_boolean.top': { state: 'on' },
        'input_boolean.right': { state: 'on' },
        'light.a': { state: 'on', attributes: { friendly_name: 'Bridge Lamp' } },
        'light.c': { state: 'off', attributes: { friendly_name: 'Warp Core Light' } },
        'sensor.t': sensor('temperature', 'Bridge Temperature'),
        'sensor.h': sensor('humidity', 'Bridge Humidity'),
        'sensor.p': sensor('power', 'Bridge Power'),
        'sensor.e': sensor('energy', 'Bridge Energy'),
        'sensor.diag': sensor('temperature', 'Diag'),
    },
    areas: {
        bridge: { area_id: 'bridge', name: 'Bridge' },
        engineering: { area_id: 'engineering', name: 'Engineering' },
    },
    entities: {
        'light.a': { entity_id: 'light.a', area_id: 'bridge' },
        'light.c': { entity_id: 'light.c', area_id: 'engineering' },
        'sensor.t': { entity_id: 'sensor.t', area_id: 'bridge' },
        'sensor.h': { entity_id: 'sensor.h', device_id: 'dev1' },
        'sensor.p': { entity_id: 'sensor.p', area_id: 'bridge' },
        'sensor.e': { entity_id: 'sensor.e', area_id: 'bridge' },
        'sensor.diag': { entity_id: 'sensor.diag', area_id: 'bridge', entity_category: 'diagnostic' },
    },
    devices: { dev1: { id: 'dev1', area_id: 'bridge' } },
};
const FULL = { room_selector_entity: 'input_select.rooms', page_selector_entity: 'input_select.pages', top_bar_entity: 'input_boolean.top', right_sidebar_entity: 'input_boolean.right' };

for (const [name, config] of [
    ['no entities (placeholders)', {}],
    ['entity mode, every option', FULL],
    ['auto-areas mode', { room_selector_entity: 'input_text.area' }],
]) {
    test(`Picard shell output is valid: ${name}`, async () => {
        const dashboard = await strategy.generate(config, hass);
        assert.equal(dashboard.views?.[0]?.type, 'custom:lcards-layout-view');
        const issues = await validateTexts([{ name, text: JSON.stringify(dashboard) }]);
        assert.deepEqual(issues.map(i => `${i.severity} ${i.path}: ${i.message}`), []);
    });
}

/** @returns {any[]} every card, depth first */
function allCards(node, out = []) {
    if (Array.isArray(node)) { node.forEach(n => allCards(n, out)); return out; }
    if (!node || typeof node !== 'object') return out;
    if (typeof node.type === 'string' && node.type.startsWith('custom:')) out.push(node);
    for (const v of Object.values(node)) if (v && typeof v === 'object') allCards(v, out);
    return out;
}

test('room sensors: reading classes in order, own area or device area, no entity category', () => {
    assert.deepEqual(roomSensorsFromRegistries(hass), [
        { area_id: 'bridge', name: 'Bridge', sensors: ['sensor.t', 'sensor.h', 'sensor.p'] },
        { area_id: 'engineering', name: 'Engineering', sensors: [] },
    ]);
});

test('Picard shell: lights and readings per room, toggles hide the top bar and side column', async () => {
    const view = (await strategy.generate(FULL, hass)).views[0];
    const cards = allCards(view.cards);
    const byArea = (/** @type {string} */ area) => view.cards.filter((/** @type {any} */ c) => c.view_layout?.['grid-area'] === area);
    // the light bank: ALL ON / ALL OFF for the area and a gauge column per light, per room
    const banks = cards.filter(c => c.visibility?.[0]?.state && c.cards?.some((/** @type {any} */ x) => x.text?.label?.content === 'ALL ON'));
    assert.deepEqual(banks.map(b => [b.visibility[0].state, b.cards.filter((/** @type {any} */ x) => x.entity).map((/** @type {any} */ x) => x.entity)]), [
        [['bridge', 'Bridge'], ['light.a']],
        [['engineering', 'Engineering'], ['light.c']],
    ]);
    const gauge = banks[0].cards.find((/** @type {any} */ x) => x.entity);
    assert.equal(gauge.preset, 'picard-gauge-column');
    assert.equal(gauge.text.name.content, 'LAMP', 'the area name is trimmed');
    assert.deepEqual(banks[0].cards[0].tap_action, { action: 'perform-action', perform_action: 'light.turn_on', target: { area_id: 'bridge' } });
    // readings: the bridge's three sensors, gauges for temperature and humidity only
    const readings = cards.find(c => c.type === 'custom:lcards-data-grid' && c.rows?.[0]?.values?.[2]?.startsWith('sensor.'));
    assert.deepEqual(readings.rows.map((/** @type {any} */ r) => r.values[2]), ['sensor.t', 'sensor.h', 'sensor.p']);
    assert.deepEqual(cards.filter(c => c.preset === 'picard-gauge-column' && c.entity.startsWith('sensor.')).map(c => c.text.name.content), ['TMP', 'HUM']);
    // notes for rooms without lights or sensors use state_not over the filled rooms
    const sensorNote = cards.find(c => c.text?.label?.content === 'NO SENSORS IN THIS ROOM');
    assert.deepEqual(sensorNote.visibility, [{ condition: 'state', entity: 'input_select.rooms', state_not: ['bridge', 'Bridge'] }]);
    // the toggles
    assert.deepEqual(byArea('top')[0].visibility, [{ condition: 'state', entity: 'input_boolean.top', state: 'on' }]);
    assert.deepEqual(byArea('side')[0].visibility, [{ condition: 'state', entity: 'input_boolean.right', state: 'on' }]);
    // page tabs: one column per option
    const tabs = cards.find(c => c.type === 'custom:lcards-select-menu' && c.preset === 'toggle-tab');
    assert.equal(tabs.grid.columns, 3);
    // red alert pill
    assert.ok(cards.some(c => c.tap_action?.perform_action === 'lcards.red_alert'));
});

test('Picard shell: no auto-entities, no hex colours', async () => {
    const text = JSON.stringify(await strategy.generate(FULL, hass));
    assert.doesNotMatch(text, /auto-entities/);
    assert.doesNotMatch(text, /#[0-9a-fA-F]{3,6}\b/);
});

test('Picard shell: the page tabs stay on one row, however many pages there are', async () => {
    // The strip is one row tall: with the columns capped at 8, a ninth page wrapped onto a
    // second row hidden behind the frame (the user's dev dashboard, 2026-11-20).
    for (const count of [3, 9, 12]) {
        const pages = Array.from({ length: count }, (_, i) => `Page ${i + 1}`);
        const h = { ...hass, states: { ...hass.states, 'input_select.pages': { state: pages[0], attributes: { options: pages } } } };
        const text = JSON.stringify(await strategy.generate(FULL, h));
        const tabs = [...text.matchAll(/"entity":"input_select\.pages","preset":"toggle-tab","grid":\{"columns":(\d+)/g)].map((m) => Number(m[1]));
        assert.deepEqual(tabs, [count], `${count} pages: one select menu with a column per page`);
    }
});
