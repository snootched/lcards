/**
 * LCARS section strategies (src/strategies/lcards-section-strategies.js,
 * reports/strategies-plan.md S5): targets resolve through the registries like Home
 * Assistant's Entities section, each kind builds valid LCARdS config, and the
 * strategy configs themselves pass the config checker.
 */
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { installJsdom } from '../helpers/jsdom-env.js';

let env;
let S;
let validateTexts;
before(async () => {
    env = installJsdom();
    for (const k of ['Document', 'CSSStyleSheet', 'ShadowRoot']) globalThis[k] ??= env.dom.window[k];
    S = await import('../../src/strategies/lcards-section-strategies.js');
    ({ validateTexts } = await import('../../scripts/lcards-validate.mjs'));
});
after(() => env?.restore());

const st = (state, attributes = {}) => ({ state, attributes });
const hass = {
    states: {
        'light.bridge_lamp': st('on', { friendly_name: 'Bridge Lamp' }),
        'light.ready_room': st('off', { friendly_name: 'Ready Room Light' }),
        'switch.bridge_fan': st('off', { friendly_name: 'Bridge Fan' }),
        'sensor.bridge_temperature': st('21.5', { friendly_name: 'Bridge Temperature', device_class: 'temperature', unit_of_measurement: '°C' }),
        'sensor.bridge_humidity': st('46', { friendly_name: 'Bridge Humidity', device_class: 'humidity', unit_of_measurement: '%' }),
        'sensor.bridge_status': st('ok', { friendly_name: 'Bridge Status' }),
        'sensor.bridge_diag': st('3', { friendly_name: 'Diag', unit_of_measurement: 'x' }),
        'input_number.warp': st('5', { friendly_name: 'Warp Factor', min: 0, max: 10 }),
    },
    areas: {
        bridge: { area_id: 'bridge', name: 'Bridge', floor_id: 'deck1', labels: [] },
        ready: { area_id: 'ready', name: 'Ready Room', floor_id: 'deck1', labels: ['command'] },
        cargo: { area_id: 'cargo', name: 'Cargo', floor_id: 'deck2', labels: [] },
    },
    devices: { fan: { id: 'fan', area_id: 'bridge', labels: [] } },
    entities: {
        'light.bridge_lamp': { area_id: 'bridge', labels: [] },
        'light.ready_room': { area_id: 'ready', labels: [] },
        'switch.bridge_fan': { device_id: 'fan', labels: [] },
        'sensor.bridge_temperature': { area_id: 'bridge', labels: [] },
        'sensor.bridge_humidity': { area_id: 'bridge', labels: ['env'] },
        'sensor.bridge_status': { area_id: 'bridge', labels: [] },
        'sensor.bridge_diag': { area_id: 'bridge', entity_category: 'diagnostic', labels: [] },
        'input_number.warp': { labels: [] },
    },
};

test('resolveTarget: entities, devices, areas (own or device), floors, labels; no configuration entities', () => {
    const r = (target) => S.resolveTarget(hass, target).sort();
    assert.deepEqual(r({ area_id: 'bridge' }), ['light.bridge_lamp', 'sensor.bridge_humidity', 'sensor.bridge_status', 'sensor.bridge_temperature', 'switch.bridge_fan']);
    assert.deepEqual(r({ device_id: 'fan' }), ['switch.bridge_fan']);
    assert.deepEqual(r({ floor_id: 'deck1' }).length, 6);
    assert.deepEqual(r({ label_id: 'command' }), ['light.ready_room'], 'an area label');
    assert.deepEqual(r({ label_id: ['env'] }), ['sensor.bridge_humidity'], 'an entity label');
    assert.deepEqual(r({ entity_id: ['input_number.warp', 'sensor.bridge_diag'] }), ['input_number.warp', 'sensor.bridge_diag'], 'named directly');
    assert.deepEqual(r(undefined), []);
});

const cards = (section) => section.cards;

test('sectionLabels drops the leading words every name shares; gauge caps take the last word', () => {
    const h = { states: {
        'sensor.a': st('1', { friendly_name: 'Toronto Apparent Temperature' }),
        'sensor.b': st('1', { friendly_name: 'Toronto Humidity' }),
        'sensor.c': st('1', { friendly_name: 'Toronto' }),
    }, entities: {}, areas: {} };
    assert.deepEqual([...S.sectionLabels(h, ['sensor.a', 'sensor.b']).values()], ['APPARENT TEMPERATURE', 'HUMIDITY']);
    assert.deepEqual([...S.sectionLabels(h, ['sensor.a', 'sensor.c']).values()], ['TORONTO APPARENT TEMPERATURE', 'TORONTO'], 'never empties a name');
    const gauges = S.generateLcarsSection('lcars-gauges', { type: 'custom:lcars-gauges', target: { entity_id: ['sensor.bridge_temperature', 'input_number.warp'] } }, hass);
    assert.deepEqual(gauges.cards.slice(1).map((c) => c.text.name.content), ['TEMP', 'FACTOR']);
});

test('readings: sensors with a class or unit, classes first; title from the one area', () => {
    const out = S.generateLcarsSection('lcars-readings', { type: 'custom:lcars-readings', target: { area_id: 'bridge' } }, hass);
    assert.equal(out.type, 'grid');
    assert.equal(cards(out)[0].text.label.content, 'BRIDGE');
    const grid = cards(out)[1];
    assert.deepEqual(grid.rows.map((r) => [r.values[1], r.values[2]]), [['TEMPERATURE', 'sensor.bridge_temperature'], ['HUMIDITY', 'sensor.bridge_humidity']]);
});

test('gauges, controls, blocks pick their entities; notes without a target or matches', () => {
    const gauges = S.generateLcarsSection('lcars-gauges', { type: 'custom:lcars-gauges', target: { floor_id: 'deck1' }, title: 'LEVELS' }, hass);
    assert.deepEqual(cards(gauges).slice(1).map((c) => c.entity), ['sensor.bridge_humidity', 'sensor.bridge_temperature']);
    const controls = S.generateLcarsSection('lcars-controls', { type: 'custom:lcars-controls', target: { floor_id: 'deck1' } }, hass);
    assert.deepEqual(cards(controls).slice(1).map((c) => [c.entity, c.text.label.content]), [
        ['switch.bridge_fan', 'FAN'], ['light.bridge_lamp', 'LAMP'], ['light.ready_room', 'LIGHT'],
    ]);
    const blocks = S.generateLcarsSection('lcars-blocks', { type: 'custom:lcars-blocks', target: { area_id: 'bridge' } }, hass);
    assert.deepEqual(cards(blocks)[1].cards.slice(1).map((c) => c.entity), ['switch.bridge_fan', 'light.bridge_lamp']);
    assert.match(cards(S.generateLcarsSection('lcars-blocks', { type: 'custom:lcars-blocks' }, hass))[1].text.label.content, /PICK AN AREA/);
    assert.match(cards(S.generateLcarsSection('lcars-gauges', { type: 'custom:lcars-gauges', target: { area_id: 'cargo' } }, hass))[1].text.label.content, /NOTHING TO SHOW/);
});

test('every section kind generates valid LCARdS config, and its strategy config passes the checker', async () => {
    const sections = [];
    for (const key of Object.keys(S.LCARS_SECTIONS)) {
        const strategy = { type: `custom:${key}`, title: 'TEST', target: { area_id: 'bridge', floor_id: ['deck1'] } };
        sections.push({ strategy }, S.generateLcarsSection(key, strategy, hass));
    }
    const dashboard = { views: [{ type: 'sections', sections }] };
    const issues = await validateTexts([{ name: 'sections', text: JSON.stringify(dashboard) }]);
    assert.deepEqual(issues.map((i) => `${i.severity} ${i.path}: ${i.message}`), []);
    // and an unknown key in a strategy block is caught
    const bad = await validateTexts([{ name: 'bad', text: JSON.stringify({ views: [{ type: 'sections', sections: [{ strategy: { type: 'custom:lcars-gauges', entities: [] } }] }] }) }]);
    assert.ok(bad.some((i) => /entities/.test(`${i.path} ${i.message}`)), JSON.stringify(bad));
});

test('the stub targets the area with the most matching entities', async () => {
    (await import('../../src/strategies/strategy-registration.js')).registerLcarsSections();
    const cls = customElements.get('ll-strategy-section-lcars-controls');
    // the registered class loads the generator module on first use
    assert.deepEqual(await cls.getStubConfig(hass), { type: 'custom:lcars-controls', target: { area_id: 'bridge' } });
    assert.equal((await cls.generate({ type: 'custom:lcars-controls', target: { area_id: 'bridge' } }, hass)).type, 'grid');
    const editor = await cls.getConfigElement();
    assert.equal(editor.localName, 'lcards-section-strategy-editor');
    assert.ok(window.customStrategies.some((s) => s.type === 'lcars-readings' && s.strategyType === 'section'));
});
