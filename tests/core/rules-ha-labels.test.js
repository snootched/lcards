/**
 * Rule targets by Home Assistant label (reports/ha-labels-plan.md 1b): the
 * `ha_label:<id>` overlay selector, the `ha_label` animation target, entities
 * recorded on registered targets, and re-evaluation when a registry changes.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { RulesEngine } from '../../src/core/rules/RulesEngine.js';
import { CoreSystemsManager } from '../../src/core/systems-manager/index.js';
import { compileRule, evalCompiled, targetsOf } from '../../src/core/rules/compileConditions.js';

function makeHass() {
    return {
        states: {
            'input_boolean.alert': { state: 'on', attributes: {} },
            'sensor.door_battery': { state: '12', attributes: {} },
            'sensor.window_battery': { state: '80', attributes: {} },
            'light.lamp': { state: 'on', attributes: {} },
        },
        entities: {
            'sensor.door_battery': { entity_id: 'sensor.door_battery', labels: ['low_battery'] },
            'sensor.window_battery': { entity_id: 'sensor.window_battery', device_id: 'window', labels: [] },
            'light.lamp': { entity_id: 'light.lamp', area_id: 'bridge', labels: [] },
        },
        devices: { window: { id: 'window', labels: ['low_battery'] } },
        areas: { bridge: { area_id: 'bridge', labels: ['command'] } },
    };
}

function setup(rules, overlays) {
    const hass = makeHass();
    const engine = new RulesEngine(rules, null);
    engine._systemsManager = { getAllTargetableOverlays: () => overlays, getHass: () => hass };
    const evaluate = () => engine.evaluateDirty({ getEntity: (id) => hass.states[id] });
    const ids = (result) => result.overlayPatches.map(p => p.id).sort();
    return { engine, hass, evaluate, ids };
}

const overlays = [
    { id: 'door', type: 'button', tags: [], entity: 'sensor.door_battery' },
    { id: 'window', type: 'button', tags: [], entity: 'sensor.window_battery' },
    { id: 'lamp', type: 'button', tags: [], entity: 'light.lamp' },
    { id: 'elbow', type: 'elbow', tags: [], entity: null },
    // an MSD control registered by the MSD (not an LCARdS card): its card's entity
    { id: 'tile', type: 'control', tags: [], card: { entity: 'sensor.door_battery' } },
];

test('ha_label: matches targets whose entity carries the label (entity, device or area), not ones without an entity', async () => {
    const { evaluate, ids } = setup([
        { id: 'r', when: { entity: 'input_boolean.alert', state: 'on' },
          apply: { overlays: { 'ha_label:low_battery': { style: { color: 'red' } } } } },
    ], overlays);
    assert.deepEqual(ids(await evaluate()), ['door', 'tile', 'window'], 'the door by its own label, the window by its device\'s, the tile by its card\'s entity');
});

test('ha_label: by an area label, with exclude, merged with another selector', async () => {
    const { evaluate, ids } = setup([
        { id: 'r', when: { entity: 'input_boolean.alert', state: 'on' },
          apply: { overlays: { 'ha_label:command': { style: { color: 'red' } }, 'ha_label:low_battery': { style: { width: 2 } }, exclude: ['window'] } } },
    ], overlays);
    const result = await evaluate();
    assert.deepEqual(ids(result), ['door', 'lamp', 'tile']);
    assert.deepEqual(result.overlayPatches.find(p => p.id === 'lamp').style, { color: 'red' });
});

test('ha_label: an unknown label or no registries match nothing', async () => {
    const { engine, evaluate, ids } = setup([
        { id: 'r', when: { entity: 'input_boolean.alert', state: 'on' },
          apply: { overlays: { 'ha_label:nope': { style: { color: 'red' } } } } },
    ], overlays);
    assert.deepEqual(ids(await evaluate()), []);
    engine._systemsManager.getHass = () => ({ states: makeHass().states });
    engine.markAllDirty();
    assert.deepEqual(ids(await evaluate()), []);
});

test('animation target ha_label resolves from the overlay registry', () => {
    const hass = makeHass();
    const engine = new RulesEngine([], null);
    const registry = new Map(overlays.map(o => [o.id, o]));
    engine._systemsManager = { getOverlayRegistry: () => registry, getHass: () => hass };
    assert.deepEqual(engine._resolveAnimationTargets({ ha_label: 'low_battery', preset: 'pulse' }).sort(), ['door', 'window']);
    assert.deepEqual(engine._resolveAnimationTargets({ ha_label: 'command', preset: 'pulse' }), ['lamp']);
    assert.deepEqual(engine._resolveAnimationTargets({ ha_label: 'nope', preset: 'pulse' }), []);
});

test('registerOverlay keeps the entity, and getEntity is read at match time', () => {
    const systems = new CoreSystemsManager();
    const card = { config: { entity: 'light.lamp' } };
    systems.registerOverlay('card', { id: 'card', type: 'button', tags: [], getEntity: () => card.config.entity });
    systems.registerOverlay('line', { id: 'line', type: 'line', tags: [], entity: 'sensor.door_battery' });
    systems.registerOverlay('plain', { id: 'plain', type: 'elbow', tags: [] });
    const reg = systems.getOverlayRegistry();
    assert.equal(reg.get('card').entity, 'light.lamp');
    card.config = { entity: 'sensor.window_battery' };
    assert.equal(reg.get('card').entity, 'sensor.window_battery', 'a config change is seen without registering again');
    assert.equal(reg.get('line').entity, 'sensor.door_battery');
    assert.equal(reg.get('plain').entity, null);
});

test('a replaced registry marks every rule dirty and re-runs the callbacks; the same registries do not', async () => {
    const { engine, hass, evaluate } = setup([
        { id: 'r', when: { entity: 'input_boolean.alert', state: 'on' },
          apply: { overlays: { 'ha_label:low_battery': { style: { color: 'red' } } } } },
    ], overlays);
    engine.hassUnsubscribe = () => {}; // entity monitoring active: no blanket dirtying on every hass
    let calls = 0;
    engine.setReEvaluationCallback(() => { calls++; });
    engine.ingestHass(hass);
    await evaluate();
    assert.equal(engine.dirtyRules.size, 0);

    engine.ingestHass({ ...hass, states: { ...hass.states } });
    assert.equal(engine.dirtyRules.size, 0, 'same registry objects: nothing to do');
    const before = calls;

    // a label added to the lamp in Home Assistant: a new entity registry object
    engine.ingestHass({ ...hass, entities: { ...hass.entities, 'light.lamp': { ...hass.entities['light.lamp'], labels: ['low_battery'] } } });
    assert.equal(engine.dirtyRules.size, 1);
    assert.equal(calls, before + 1, 'the cards re-evaluate');
});

// ── target conditions (1c): entities picked by label, area, device ────────────

const cond = async (when, hass = makeHass()) => {
    const { tree } = compileRule({ id: 'c', when }, []);
    return evalCompiled(tree, { hass, getEntity: (id) => hass.states[id] });
};

test('target condition: any (default) and all over the labelled entities', async () => {
    // low_battery: the door (12) and the window through its device (80)
    assert.equal(await cond({ target: { label_id: 'low_battery' }, below: 20 }), true, 'any: the door is below 20');
    assert.equal(await cond({ target: { label_id: 'low_battery' }, match: 'all', below: 20 }), false, 'all: the window is not');
    assert.equal(await cond({ target: { label_id: 'low_battery' }, match: 'all', below: 90 }), true);
    assert.equal(await cond({ target: { area_id: 'bridge' }, state: 'on' }), true, 'state is equals, as for an entity condition');
});

test('target condition: no entities is false for any and all; an attribute is compared when given', async () => {
    assert.equal(await cond({ target: { label_id: 'nope' }, below: 100 }), false);
    assert.equal(await cond({ target: { label_id: 'nope' }, match: 'all', below: 100 }), false);
    const hass = makeHass();
    hass.states['light.lamp'] = { state: 'on', attributes: { brightness: 200 } };
    assert.equal(await cond({ target: { label_id: 'command' }, attribute: 'brightness', above: 150 }, hass), true);
    assert.equal(await cond({ target: { label_id: 'command' }, attribute: 'brightness', above: 250 }, hass), false);
    assert.equal(await cond({ not: { target: { label_id: 'command' }, state: 'off' } }, hass), true, 'inside not');
});

test('targetsOf finds target conditions in nested groups', () => {
    const { tree } = compileRule({ id: 'c', when: { all: [{ entity: 'light.lamp', state: 'on' }, { any: [{ target: { label_id: 'a' }, state: 'on' }] }, { not: { target: { area_id: 'b' }, state: 'on' } }] } }, []);
    assert.deepEqual(targetsOf(tree), [{ label_id: 'a' }, { area_id: 'b' }]);
});

test('a target condition watches its resolved entities, and follows a registry change', async () => {
    const hass = makeHass();
    const engine = new RulesEngine([], null);
    engine._systemsManager = { getAllTargetableOverlays: () => overlays, getHass: () => hass, getOverlayRegistry: () => new Map() };
    engine.hassUnsubscribe = () => {};
    engine.rules = [{ id: 'battery', when: { target: { label_id: 'low_battery' }, below: 20 }, apply: { overlays: { door: { style: { color: 'red' } } } } }];
    engine.buildDependencyIndex();
    const watched = () => [...engine.dependencyIndex.entityToRules.keys()].sort();
    assert.deepEqual(watched(), ['sensor.door_battery', 'sensor.window_battery']);

    engine.ingestHass(hass); // first registries
    const next = { ...hass, entities: { ...hass.entities, 'light.lamp': { ...hass.entities['light.lamp'], labels: ['low_battery'] } } };
    engine._systemsManager.getHass = () => next;
    engine.ingestHass(next);
    assert.deepEqual(watched(), ['light.lamp', 'sensor.door_battery', 'sensor.window_battery'], 'the newly labelled lamp is watched');
});
