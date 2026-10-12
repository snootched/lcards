/**
 * Template tools (Templates tab + sandbox): the evaluator context matches the
 * card's, references, template fields, syntax mistakes, test values, and the
 * completion options of the template editor.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
    templateContext, templateRefs, templateFields, templateKinds, templateMistakes,
    parseTestValues, withValueAt, pathSegments, unresolvedParts,
} from '../../src/editor/components/templates/template-context.js';
import { templateCompletions } from '../../src/editor/components/templates/template-completions.js';
import * as templateTools from '../../src/editor/components/templates/template-context.js';
import { UnifiedTemplateEvaluator } from '../../src/core/templates/UnifiedTemplateEvaluator.js';

const hass = {
    states: {
        'light.kitchen': { entity_id: 'light.kitchen', state: 'on', attributes: { brightness: 200, friendly_name: 'Kitchen' } },
        'sensor.temp': { entity_id: 'sensor.temp', state: '21.5', attributes: { unit_of_measurement: '°C' } },
    },
    user: { name: 'Jean-Luc' },
};
const config = { type: 'custom:lcards-button', entity: 'light.kitchen', variables: { unit: 'kW', deck: { name: 'Bridge' } } };

test('the context carries variables and states like a card (variables tokens resolve)', async () => {
    const context = templateContext({ hass, config, entity: hass.states['light.kitchen'] });
    assert.equal(context.variables.unit, 'kW');
    assert.equal(context.states, hass.states);
    const evaluator = new UnifiedTemplateEvaluator({ hass, context, dataSourceManager: null });
    assert.equal(evaluator.evaluateSync('{variables.unit}'), 'kW');
    assert.equal(evaluator.evaluateSync('[[[ return variables.unit ]]]'), 'kW');
    // Test values override the card's variables
    assert.equal(templateContext({ hass, config, variables: { unit: 'MW' } }).variables.unit, 'MW');
});

test('references: the entity, other entities (token, JS, Jinja2), data sources, theme tokens, variables', () => {
    const refs = templateRefs(
        '{entity.state} {states.sensor.temp.state} [[[ return states["light.desk"].state ]]] {{ states("switch.fan") }} {ds:cpu:.1f} {theme:colors.ui.primary} {variables.unit}',
        { entityId: 'light.kitchen' });
    assert.deepEqual(refs.entities.sort(), ['light.desk', 'light.kitchen', 'sensor.temp', 'switch.fan']);
    assert.deepEqual(refs.datasources, ['cpu']);
    assert.deepEqual(refs.themeTokens, ['colors.ui.primary']);
    assert.deepEqual(refs.variables, ['unit']);
    assert.equal(templateRefs('plain {states.sensor.temp.state}', { entityId: 'light.kitchen' }).usesEntity, false);
});

test('template fields: one per field (not per token), in config order, with kinds and mistakes', () => {
    const fields = templateFields({
        type: 'custom:lcards-button',
        text: { label: { content: 'Value {entity.state} {variables.unit}' }, name: { content: 'Plain' } },
        segments: [{ text: '{{ states("sensor.temp") }}' }],
        style: { color: '{colors.ui.primary}' },
        rules: [{ id: 'x', apply: { overlays: { a: { text: '{entity.state}' } } } }],
    });
    assert.deepEqual(fields.map(f => f.path), ['text.label.content', 'segments[0].text', 'style.color']);
    assert.deepEqual(fields[0].kinds, ['Token']);
    assert.deepEqual(fields[1].kinds, ['Jinja2']);
    assert.equal(fields[2].mistakes[0].message, 'Missing the theme: prefix: {theme:colors.text.onDark}');
    // The dot form resolves (a walk of the theme tree), so it isn't flagged
    assert.deepEqual(templateMistakes('{theme.colors.text.onDark}'), []);
    assert.deepEqual(templateKinds('[[[ return 1 ]]] {ds:a} {theme:x}'), ['JavaScript', 'Theme', 'Data source']);
    assert.deepEqual(templateMistakes('{{theme:x}} {ds.cpu}').map(m => m.match), ['{{theme:x}}', '{ds.cpu}']);
});

test('save to field: a copy with the value at the path replaced (config untouched)', () => {
    const cfg = Object.freeze({ text: Object.freeze({ label: Object.freeze({ content: 'a' }) }), segments: Object.freeze([Object.freeze({ text: 'x' })]) });
    assert.deepEqual(pathSegments('segments[0].text'), ['segments', 0, 'text']);
    assert.equal(withValueAt(cfg, 'text.label.content', 'b').text.label.content, 'b');
    const next = withValueAt(cfg, 'segments[0].text', 'y');
    assert.ok(Array.isArray(next.segments));
    assert.equal(next.segments[0].text, 'y');
    assert.equal(cfg.text.label.content, 'a');
});

test('test values parse as YAML (nested attributes, lists, quotes)', () => {
    const { value, error } = parseTestValues('state: "on"\nattributes:\n  brightness: 200\n  rgb: [255, 0, 0]\n  name: "a: b"');
    assert.equal(error, '');
    assert.deepEqual(value, { state: 'on', attributes: { brightness: 200, rgb: [255, 0, 0], name: 'a: b' } });
    assert.deepEqual(parseTestValues('').value, {});
    assert.match(parseTestValues('- a').error, /mapping/);
    assert.match(parseTestValues('a: [').error, /YAML error/);
});

test('unresolved parts of a result', () => {
    assert.deepEqual(unresolvedParts('42 {theme:x.y} [[[ bad ]]] {{ x }}').sort(), ['[[[ bad ]]]', '{theme:x.y}', '{{ x }}']);
    assert.deepEqual(unresolvedParts('All good 21.5 °C'), []);
    assert.deepEqual(unresolvedParts('Brightness {entity.attributes.'), ['{entity.attributes.']);
});

const data = {
    entity: hass.states['light.kitchen'],
    states: hass.states,
    datasources: ['cpu', 'temp_smooth'],
    themeTokens: { colors: { ui: { primary: '#ff9900', secondary: '#99ccff' }, text: { onDark: '#fff' } } },
    variables: config.variables,
    config,
};
const at = (before) => {
    const r = templateCompletions(before, data);
    return r && { from: r.from, labels: r.options.map(o => o.label), apply: Object.fromEntries(r.options.map(o => [o.label, o.apply ?? o.label])) };
};

test('completion: token roots after {', () => {
    const r = at('Value {');
    assert.equal(r.from, 7);
    assert.ok(['entity.', 'states.', 'ds:', 'theme:', 'variables.', 'config.'].every(l => r.labels.includes(l)));
    assert.equal(at('Value {{'), null); // Jinja2, not a token
    assert.equal(at('{% if'), null);
});

test('completion: entity state and attributes', () => {
    assert.deepEqual(at('{entity.').labels, ['state', 'attributes.']);
    const attrs = at('{entity.attributes.bri');
    assert.equal(attrs.from, '{entity.attributes.'.length);
    assert.equal(attrs.apply.brightness, 'brightness}');
});

test('completion: another entity by id, then its state and attributes', () => {
    const ids = at('{states.light.ki');
    assert.equal(ids.from, '{states.'.length);
    assert.ok(ids.labels.includes('light.kitchen'));
    assert.equal(ids.apply['light.kitchen'], 'light.kitchen.');
    assert.deepEqual(at('{states.sensor.temp.').labels, ['state', 'attributes.']);
    assert.ok(at('{states.sensor.temp.attributes.').labels.includes('unit_of_measurement'));
});

test('completion: data sources, theme token paths, variables, config, user', () => {
    assert.deepEqual(at('{ds:').labels, ['cpu', 'temp_smooth']);
    assert.equal(at('{datasource:c').from, '{datasource:'.length);
    assert.deepEqual(at('{theme:').labels, ['colors']);
    const ui = at('{theme:colors.ui.pr');
    assert.equal(ui.from, '{theme:colors.ui.'.length);
    assert.equal(ui.apply.primary, 'primary}');
    assert.deepEqual(at('{variables.').labels, ['unit', 'deck']);
    assert.equal(at('{variables.').apply.deck, 'deck.');
    assert.deepEqual(at('{variables.deck.').labels, ['name']);
    assert.ok(at('{config.').labels.includes('entity'));
    assert.deepEqual(at('{hass.user.').labels, ['name']);
});

test('completion: Jinja2 entity arguments and JavaScript', () => {
    const j = at('{{ states(\'sensor.');
    assert.ok(j.labels.includes('sensor.temp'));
    assert.equal(j.from, "{{ states('".length);
    assert.ok(at('{{ is_state("li').labels.includes('light.kitchen'));
    assert.ok(at('[[[ return entity.attributes.').labels.includes('brightness'));
    assert.ok(at('[[[ return variables.').labels.includes('unit'));
    assert.ok(at("[[[ return states['").labels.includes('sensor.temp'));
    assert.equal(at('[[[ return 1 ]]] {').from, '[[[ return 1 ]]] {'.length);
});

test('test values: the entity, another entity, variables (live values stay underneath)', () => {
    const { withTestValues } = templateTools;
    const applied = withTestValues({ hass, entityId: 'light.kitchen', test: {
        entity: { attributes: { brightness: 50 } },
        states: { 'sensor.outdoor': { state: '12.5' } },
        variables: { unit: 'MW' },
        ds: { cpu: 42 },
    } });
    assert.equal(applied.entity.state, 'on'); // live state kept
    assert.equal(applied.entity.attributes.brightness, 50);
    assert.equal(applied.entity.attributes.friendly_name, 'Kitchen');
    assert.deepEqual(applied.testEntities.sort(), ['light.kitchen', 'sensor.outdoor']);
    assert.equal(hass.states['sensor.outdoor'], undefined); // live hass untouched
    const context = templateContext({ hass: applied.hass, config, entity: applied.entity, variables: applied.variables });
    const evaluator = new UnifiedTemplateEvaluator({ hass: applied.hass, context, dataSourceManager: null });
    assert.equal(evaluator.evaluateSync('{states.sensor.outdoor.state}|{entity.attributes.brightness}|{variables.unit}'), '12.5|50|MW');
    assert.equal(evaluator.evaluateSync('[[[ return states["sensor.outdoor"].state ]]]'), '12.5');
    // No test values: everything live
    assert.equal(withTestValues({ hass, entityId: 'light.kitchen' }).hass, hass);
});

test('every example has a template, a name and well-formed test values', async () => {
    const { EXAMPLE_TEMPLATES } = await import('../../src/editor/components/templates/template-examples.js');
    for (const [id, ex] of Object.entries(EXAMPLE_TEMPLATES)) {
        assert.ok(ex.name && ex.template && ex.description, id);
        if (ex.test) for (const key of Object.keys(ex.test)) assert.ok(['entity', 'states', 'ds', 'variables'].includes(key), `${id}: ${key}`);
    }
});
