/**
 * TemplateDetector, TemplateParser and LCARdSCardTemplateEvaluator.
 *
 * Syntaxes: [[[ js ]]], {token}, {{ jinja2 }} (+ {% %} {# #}), {datasource:x},
 * and legacy MSD {source.path:format}.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { TemplateDetector as D } from '../../src/core/templates/TemplateDetector.js';
import { TemplateParser as P } from '../../src/core/templates/TemplateParser.js';
import { LCARdSCardTemplateEvaluator } from '../../src/core/templates/LCARdSCardTemplateEvaluator.js';
import { createFakeHass } from '../helpers/fake-hass.js';

// ── Detector ───────────────────────────────────────────────────────────

test('detectTemplateTypes: each syntax and mixed content', () => {
    const cases = [
        // content, hasMSD, hasDatasources, hasJinja2, hasJavaScript, hasTokens
        ['plain text', false, false, false, false, false],
        ['{entity.state}', true, false, false, false, true],
        ['{{ states("a.b") }}', false, false, true, false, false],
        // hasTokens is loose for {% %} / {# #} (current behaviour); harmless because
        // the evaluator's token regex skips them.
        ['{% if x %}y{% endif %}', true, false, true, false, true],
        ['{# comment #}', true, false, true, false, true],
        ['[[[ return 1 ]]]', false, false, false, true, false],
        ['[[[ unterminated', false, false, false, false, false],
        ['{datasource:power}', true, true, false, false, true],
        ['{sensor.temp}', true, false, false, false, false], // MSD domain prefix is not a token
        ['{entity.state} {{ states("a.b") }}', true, false, true, false, true],
        ['{{ a }} [[[ return 1 ]]]', false, false, true, true, false],
    ];
    for (const [content, hasMSD, hasDatasources, hasJinja2, hasJavaScript, hasTokens] of cases) {
        assert.deepEqual(D.detectTemplateTypes(content), { hasMSD, hasDatasources, hasJinja2, hasJavaScript, hasTokens }, content);
    }
    assert.deepEqual(D.detectTemplateTypes(null), { hasMSD: false, hasDatasources: false, hasJinja2: false, hasJavaScript: false, hasTokens: false });
});

test('hasTemplates and getTemplateTypes', () => {
    assert.equal(D.hasTemplates('no templates'), false);
    assert.equal(D.hasTemplates('{x}'), true);
    assert.equal(D.hasTemplates(42), false);
    // Token is not listed when Jinja2 is present.
    assert.deepEqual(D.getTemplateTypes('{entity.state} {{ x }}'), ['MSD', 'HA']);
    assert.deepEqual(D.getTemplateTypes('[[[ return 1 ]]] {config.name}'), ['MSD', 'JavaScript', 'Token']);
});

// ── Parser ─────────────────────────────────────────────────────────────

test('parseMSDReference / parseDatasourceReference: source, path, format', () => {
    assert.deepEqual(P.parseMSDReference('temp.v:.1f'), { source: 'temp', path: ['v'], format: '.1f' });
    assert.deepEqual(P.parseMSDReference('temp'), { source: 'temp', path: [], format: null });
    assert.deepEqual(P.parseMSDReference(''), { source: '', path: [], format: null });
    assert.deepEqual(P.parseDatasourceReference('datasource:power.history.avg:.2f'),
        { source: 'power', path: ['history', 'avg'], format: '.2f' });
    assert.deepEqual(P.parseDatasourceReference('power'), { source: 'power', path: [], format: null });
});

test('extractMSDReferences skips {{ }}; extractDatasourceReferences finds every {datasource:}', () => {
    assert.deepEqual(P.extractMSDReferences('T {temp.v:.1f} and {{ x }} {a.b}').map(r => r.match), ['{temp.v:.1f}', '{a.b}']);
    const ds = P.extractDatasourceReferences('{datasource:a} / {datasource:b.c:int}');
    assert.deepEqual(ds.map(r => [r.source, r.path, r.format]), [['a', [], null], ['b', ['c'], 'int']]);
    assert.deepEqual(P.extractDatasourceReferences(undefined), []);
});

test('extractJavaScript: every block, trimmed code, context references', () => {
    const js = P.extractJavaScript('a [[[ return entity.state ]]] b [[[\nreturn hass && config\n]]]');
    assert.deepEqual(js.map(t => t.code), ['return entity.state', 'return hass && config']);
    assert.deepEqual(js.map(t => t.tokens), [['entity'], ['hass', 'config']]);
});

test('extractTokens: excludes jinja2, datasource and MSD-domain forms', () => {
    const content = '{entity.state} {{ states("x") }} {% if %} {# c #} {sensor.t} {datasource:x} {config.name}';
    const tokens = P.extractTokens(content);
    // Regression: the inner "{ states("x") }" of {{ }} was returned as a token.
    assert.deepEqual(tokens.map(t => t.path), ['entity.state', 'config.name']);
    assert.deepEqual(tokens[0].parts, ['entity', 'state']);
    assert.equal(content.slice(tokens[1].start, tokens[1].end), '{config.name}');
});

test('extractJinja2 keeps only expressions with a call or filter; extractJinja2Entities', () => {
    assert.deepEqual(P.extractJinja2('{{ states("a.b") }} {{ plain }} {{ x | int }}').map(t => t.expression), ['states("a.b")', 'x | int']);
    const tpl = "{{ states('sensor.a') }} {{ state_attr('light.b', 'x') }} {{ is_state(\"switch.c\", 'on') }} {{ has_value('d.e') }} {{ states('sensor.a') }}";
    assert.deepEqual(P.extractJinja2Entities(tpl).sort(), ['d.e', 'light.b', 'sensor.a', 'switch.c']);
});

test('extractDependencies: MSD sources, token roots and Jinja2 entities', () => {
    // Regression: the Jinja2 call also produced a junk "states('sensor" dependency.
    assert.deepEqual(P.extractDependencies("{temp.value} {entity.state} {{ states('sensor.x') }}").sort(), ['entity', 'sensor.x', 'temp']);
});

test('parseFormatSpec', () => {
    const cases = [
        ['.2f', { type: 'float', precision: 2, options: {} }],
        ['.0f', { type: 'float', precision: 0, options: {} }],
        ['int', { type: 'integer', precision: null, options: {} }],
        ['integer', { type: 'integer', precision: null, options: {} }],
        ['str', { type: 'string', precision: null, options: {} }],
        ['boolean', { type: 'boolean', precision: null, options: {} }],
        [' %Y ', { type: 'custom', precision: null, options: { spec: '%Y' } }],
        ['', { type: 'none', precision: null, options: {} }],
    ];
    for (const [spec, expected] of cases) assert.deepEqual(P.parseFormatSpec(spec), expected, spec);
});

// ── Card evaluator ─────────────────────────────────────────────────────

function makeEvaluator(extra = {}) {
    const hass = createFakeHass({
        states: {
            'light.desk': { state: 'on', attributes: { friendly_name: 'Desk', brightness: 200 } },
            'sensor.temp': { state: '21.5', attributes: { unit_of_measurement: '°C' } },
        },
    });
    const ev = new LCARdSCardTemplateEvaluator({
        hass,
        entity: hass.states['sensor.temp'],
        config: { name: 'Card' },
        variables: { color: 'red' },
        ...extra,
    });
    const sentToHA = [];
    ev._haEvaluator.evaluate = async (s) => { sentToHA.push(s); return s.replace(/\{\{.*?\}\}/g, 'J'); };
    return { ev, sentToHA };
}

test('evaluate: JavaScript blocks get entity/config/hass/states/variables', () => {
    const { ev } = makeEvaluator();
    assert.equal(ev.evaluate("[[[ return entity.state + ' ' + config.name ]]]"), '21.5 Card');
    assert.equal(ev.evaluate("[[[ return states['light.desk'].attributes.brightness ]]]"), '200');
    assert.equal(ev.evaluate('[[[ return variables.color ]]]'), 'red');
    assert.equal(ev.evaluate('[[[ return null ]]]'), '');
    assert.equal(ev.evaluate('plain'), 'plain');
});

test('evaluate: a JavaScript error leaves the original block in place', () => {
    const { ev } = makeEvaluator();
    assert.equal(ev.evaluate('x [[[ throw new Error("boom") ]]] y'), 'x [[[ throw new Error("boom") ]]] y');
});

test('evaluate: tokens and display_format', () => {
    const { ev } = makeEvaluator();
    assert.equal(ev.evaluate('{config.name}'), 'Card');
    assert.equal(ev.evaluate('{entity.state}'), '21.5 °C'); // friendly (default)
    assert.equal(ev.evaluate('{states.light.desk.state}'), 'on');
    assert.equal(ev.evaluate('{states.light.desk.attributes.brightness}'), '200');
    assert.equal(ev.evaluate('{states.light.gone.state}'), '');
    assert.equal(ev.evaluate('[{missing.path}]'), '[]');
    for (const [format, expected] of [['raw', '21.5'], ['parts', '21.5 °C'], ['unit', '°C'], ['friendly', '21.5 °C']]) {
        assert.equal(makeEvaluator({ displayFormat: format }).ev.evaluate('{entity.state}'), expected, format);
    }
});

test('evaluateAsync: JS, then tokens, then Jinja2 sent to HA intact', async () => {
    const { ev, sentToHA } = makeEvaluator();
    // Regression: token replacement used to blank the inside of {{ }} first,
    // so HA received "21.5 °C {}" and the Jinja2 expression was lost.
    assert.equal(await ev.evaluateAsync("{entity.state} {{ states('light.desk') }}"), '21.5 °C J');
    assert.deepEqual(sentToHA, ["21.5 °C {{ states('light.desk') }}"]);
    assert.equal(await ev.evaluateAsync("[[[ return config.name ]]]: {{ x | int }}"), 'Card: J');
    assert.equal(await ev.evaluateAsync('no templates'), 'no templates');
});

test('getDependencies: JS context refs and token roots', () => {
    const { ev } = makeEvaluator();
    assert.deepEqual(ev.getDependencies('[[[ return entity.state ]]] {variables.color} {{ states("x") }}').sort(), ['entity', 'variables']);
});

test('evaluate: {theme:path} tokens resolve through the theme manager (inline, beside text)', () => {
    const hass = createFakeHass({});
    // No theme manager: the context's theme tree
    const withTheme = new LCARdSCardTemplateEvaluator({ hass, theme: { colors: { text: { onDark: '#fff' } } } });
    assert.equal(withTheme.evaluate('a {theme:colors.text.onDark} b'), 'a #fff b');
    assert.equal(withTheme.evaluate('{theme:colors.nope}'), '');
    // The theme manager's resolver wins (references and computed tokens resolve there)
    const before = window.lcards;
    window.lcards = { core: { themeManager: { getToken: (path) => (path === 'colors.ui.primary' ? 'var(--lcars-orange)' : undefined) } } };
    try {
        const ev = new LCARdSCardTemplateEvaluator({ hass, theme: { colors: { ui: { primary: 'raw' } } } });
        assert.equal(ev.evaluate('{theme:colors.ui.primary}'), 'var(--lcars-orange)');
        assert.equal(ev.evaluate('{ theme:colors.ui.primary }'), 'var(--lcars-orange)');
    } finally {
        window.lcards = before;
    }
});
