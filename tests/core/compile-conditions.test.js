/**
 * Rules engine conditions: compileRule (node types, deps) and evalCompiled.
 */
import { test, mock } from 'node:test';
import assert from 'node:assert/strict';
import { compileRule, evalCompiled } from '../../src/core/rules/compileConditions.js';

const compile = (when, issues = []) => compileRule({ id: 'r1', when }, issues);
const run = (when, ctx = {}) => evalCompiled(compile(when).tree, ctx);

/** Fake evaluation context with a small entity table. */
function ctx(extra = {}) {
    const entities = {
        'light.desk': { state: 'on', attributes: { brightness: 200, effect: 'fade' } },
        'sensor.temp': { state: '21.5', attributes: { unit: 'C' } },
        'sensor.zero': { state: '0', attributes: {} },
        'sensor.bad': { state: 'unavailable', attributes: {} },
    };
    return {
        getEntity: (id) => entities[id],
        hass: { states: entities },
        sun: { elevation: 12 },
        getPerf: (key) => ({ fps: 58, mem: 'n/a' })[key],
        flags: { debug_overlay: true },
        ...extra,
    };
}

test('compile: missing/empty when is always true', async () => {
    assert.deepEqual(compileRule({ id: 'x' }, []).tree, { type: 'always' });
    assert.equal(await run(null), true);
});

test('compile: each node type', () => {
    const cases = [
        [[{ entity: 'a.b' }], 'all'],
        [{ all: [] }, 'all'],
        [{ any: [] }, 'any'],
        [{ not: { entity: 'a.b' } }, 'not'],
        [{ condition: '[[[ return 1 ]]]' }, 'javascript'],
        [{ condition: '{{ true }}' }, 'jinja2'],
        [{ jinja2: '{{ 1 }}' }, 'jinja2'],
        [{ javascript: 'return 1' }, 'javascript'],
        [{ js: 'return 1' }, 'javascript'],
        [{ map_range_cond: { entity: 'a.b' } }, 'map_range_cond'],
        [{ entity: 'a.b' }, 'entity'],
        [{ entity_attr: 'a.b', attribute: 'y' }, 'entity_attr'],
        [{ time_between: '08:00-09:00' }, 'time_between'],
        [{ weekday_in: ['mon'] }, 'weekday_in'],
        [{ sun_elevation: { above: 0 } }, 'sun_elevation'],
        [{ perf_metric: { key: 'fps' } }, 'perf_metric'],
        [{ flag: { debugFlagName: 'x' } }, 'flag'],
        [{ random_chance: 0 }, 'random_chance'],
        [{ bogus_key: 1 }, 'invalid'],
    ];
    for (const [when, type] of cases) assert.equal(compile(when).tree.type, type, JSON.stringify(when));
});

test('compile: entity `state:` is normalised to `equals:`', () => {
    const { c } = compile({ entity: 'light.desk', state: 'on' }).tree;
    assert.equal(c.equals, 'on');
    assert.equal('state' in c, false);
    // An explicit equals wins and state is kept as-is.
    assert.equal(compile({ entity: 'light.desk', state: 'on', equals: 'off' }).tree.c.equals, 'off');
});

test('compile: [[[ ]]] with surrounding whitespace (YAML block scalar) still parses', async () => {
    // Regression: `condition: |` keeps a trailing newline; slicing the raw
    // string produced "return true; ]" and the rule silently never matched.
    for (const cond of ['[[[ return true; ]]]', '[[[\n  return true;\n]]]\n', '  [[[ return true; ]]]  ']) {
        const { tree } = compile({ condition: cond });
        assert.equal(tree.code, 'return true;', JSON.stringify(cond));
        assert.equal(await evalCompiled(tree, ctx()), true);
    }
});

test('compile: plain-string condition reports an error but compiles to always-true (current behaviour)', async () => {
    const issues = [];
    const { tree } = compile({ condition: 'light.desk is on' }, issues);
    assert.equal(issues.length, 1);
    assert.equal(issues[0].severity, 'error');
    assert.deepEqual(tree, { type: 'always' });
    assert.equal(await evalCompiled(tree, ctx()), true);
});

test('compile: an unrecognised key compiles to invalid and evaluates false', async () => {
    assert.equal(await run({ entitty: 'light.desk', state: 'on' }, ctx()), false);
});

test('deps: entities, perf keys and flags are collected through nesting', () => {
    const { deps } = compile({
        all: [
            { entity: 'light.desk' },
            { any: [{ entity_attr: 'sensor.temp', attribute: 'unit' }, { not: { map_range_cond: { entity: 'sensor.zero' } } }] },
            { perf_metric: { key: 'fps', above: 30 } },
            { flag: { debugFlagName: 'debug_overlay' } },
            { condition: "{{ is_state('switch.a', 'on') and states('sensor.b') | float > 1 }}" },
        ],
    });
    assert.deepEqual([...deps.entities].sort(), ['light.desk', 'sensor.b', 'sensor.temp', 'sensor.zero', 'switch.a']);
    assert.deepEqual([...deps.perf], ['fps']);
    assert.deepEqual([...deps.flags], ['debug_overlay']);
});

test('deps: JavaScript conditions contribute no entity deps (current behaviour)', () => {
    const { deps } = compile({ condition: "[[[ return states['light.desk'].state === 'on' ]]]" });
    assert.equal(deps.entities.size, 0);
});

test('entity: equals/not_equals/in/not_in/regex/bounds/existence', async () => {
    const c = ctx();
    const cases = [
        [{ entity: 'light.desk', equals: 'on' }, true],
        [{ entity: 'light.desk', state: 'off' }, false],
        [{ entity: 'sensor.temp', equals: 21.5 }, true], // loose == against the string state
        [{ entity: 'light.desk', not_equals: 'off' }, true],
        [{ entity: 'light.desk', in: ['on', 'dim'] }, true],
        [{ entity: 'light.desk', not_in: ['on'] }, false],
        [{ entity: 'light.desk', regex: '^o' }, true],
        [{ entity: 'light.desk', regex: '(' }, false], // invalid regex
        [{ entity: 'sensor.temp', above: 21, below: 22 }, true],
        [{ entity: 'sensor.temp', at_most: 21 }, false],
        [{ entity: 'sensor.bad', above: 0 }, false], // non-numeric with bounds
        [{ entity: 'sensor.zero' }, true],  // no operator: truthy existence ('0' is a non-empty string)
        [{ entity: 'sensor.missing', equals: 'on' }, false],
    ];
    for (const [when, expected] of cases) assert.equal(await run(when, c), expected, JSON.stringify(when));
});

test('entity_attr: documented form and editor form both compare the attribute', async () => {
    const c = ctx();
    // Regression: `entity_attr: <id>` never found the entity (always false), and
    // `entity: <id>` + `attribute:` compiled as a state check.
    const documented = { entity_attr: 'light.desk', attribute: 'brightness', above: 128 };
    const editor = { entity: 'light.desk', attribute: 'brightness', above: 128 };
    for (const when of [documented, editor]) {
        assert.equal(compile(when).tree.type, 'entity_attr');
        assert.equal(compile(when).tree.c.entity, 'light.desk');
        assert.deepEqual([...compile(when).deps.entities], ['light.desk']);
        assert.equal(await run(when, c), true, JSON.stringify(when));
        assert.equal(await run({ ...when, above: 250 }, c), false);
    }
    assert.equal(await run({ entity_attr: 'light.desk', attribute: 'effect', state: 'fade' }, c), true);
    assert.equal(await run({ entity_attr: 'light.desk', above: 1 }, c), false); // no attribute
    assert.equal(await run({ entity_attr: 'light.desk', attribute: 'nope', equals: 'x' }, c), false);
    assert.equal(await run({ entity_attr: 'light.gone', attribute: 'brightness', above: 0 }, c), false);
});

test('map_range_cond: maps the state then compares; clamp optional', async () => {
    const c = ctx();
    // 21.5 in [0,100] -> 0.215 in [0,1]
    assert.equal(await run({ map_range_cond: { entity: 'sensor.temp', input: [0, 100], output: [0, 1], above: 0.2, below: 0.3 } }, c), true);
    // 21.5 in [0,10] -> 2.15 unclamped, 1 clamped
    assert.equal(await run({ map_range_cond: { entity: 'sensor.temp', input: [0, 10], output: [0, 1], above: 1 } }, c), true);
    assert.equal(await run({ map_range_cond: { entity: 'sensor.temp', input: [0, 10], output: [0, 1], clamp: true, above: 1 } }, c), false);
    assert.equal(await run({ map_range_cond: { entity: 'sensor.temp', input: [0], output: [0, 1], above: 0 } }, c), false);
    assert.equal(await run({ map_range_cond: { entity: 'sensor.bad', input: [0, 1], output: [0, 1], above: 0 } }, c), false);
});

test('time_between: inclusive window, wraps past midnight, bad format false', async () => {
    const at = (hhmm) => ctx({ now: new Date(`2026-10-09T${hhmm}:00`).getTime() });
    const cases = [
        ['08:00-09:00', '08:00', true], ['08:00-09:00', '09:00', true], ['08:00-09:00', '09:01', false],
        ['22:00-06:00', '23:30', true], ['22:00-06:00', '02:00', true], ['22:00-06:00', '06:00', true],
        ['22:00-06:00', '12:00', false], ['8:00-9:00', '08:30', false],
    ];
    for (const [range, now, expected] of cases) {
        assert.equal(await run({ time_between: range }, at(now)), expected, `${range} @ ${now}`);
    }
});

test('weekday_in: case-insensitive short names; empty list false', async () => {
    const friday = ctx({ now: new Date('2026-10-09T12:00:00').getTime() }); // 2026-10-09 is a Friday
    assert.equal(await run({ weekday_in: ['Fri', 'sat'] }, friday), true);
    assert.equal(await run({ weekday_in: ['mon'] }, friday), false);
    assert.equal(await run({ weekday_in: [] }, friday), false);
    assert.equal(await run({ weekday_in: ['friday'] }, friday), false); // full names are not recognised
});

test('sun_elevation, perf_metric, flag', async () => {
    const c = ctx();
    assert.equal(await run({ sun_elevation: { above: 10, below: 20 } }, c), true);
    assert.equal(await run({ sun_elevation: { above: 0 } }, ctx({ sun: {} })), false);
    assert.equal(await run({ perf_metric: { key: 'fps', at_least: 50 } }, c), true);
    assert.equal(await run({ perf_metric: { key: 'fps', equals: 58 } }, c), true);
    assert.equal(await run({ perf_metric: { key: 'mem', above: 0 } }, c), false);
    assert.equal(await run({ flag: { debugFlagName: 'debug_overlay' } }, c), true);
    assert.equal(await run({ flag: { debugFlagName: 'debug_overlay', is: false } }, c), false);
    assert.equal(await run({ flag: { debugFlagName: 'missing', is: false } }, c), true);
});

test('random_chance compares Math.random() against p', async (t) => {
    t.mock.method(Math, 'random', () => 0.4);
    assert.equal(await run({ random_chance: 0.5 }), true);
    assert.equal(await run({ random_chance: 0.3 }), false);
    assert.equal(await run({ random_chance: 0 }), false);
});

test('all / any / not / array combine results', async () => {
    const c = ctx();
    const on = { entity: 'light.desk', equals: 'on' };
    const off = { entity: 'light.desk', equals: 'off' };
    assert.equal(await run({ all: [on, on] }, c), true);
    assert.equal(await run({ all: [on, off] }, c), false);
    assert.equal(await run({ any: [off, on] }, c), true);
    assert.equal(await run({ any: [off] }, c), false);
    assert.equal(await run({ not: off }, c), true);
    assert.equal(await run([on, off], c), false);
    assert.equal(await run({ all: [] }, c), true);
    assert.equal(await run({ any: [] }, c), false);
});

test('javascript: gets entity, hass, states; errors evaluate false', async () => {
    const c = ctx({ entity: { state: 'on' } });
    assert.equal(await run({ condition: "[[[ return states['sensor.temp'].state > 20 ]]]" }, c), true);
    assert.equal(await run({ javascript: "return entity.state === 'on' && !!hass" }, c), true);
    assert.equal(await run({ js: 'return 0' }, c), false);
    assert.equal(await run({ js: 'throw new Error("x")' }, c), false);
    assert.equal(await run({ js: 'return (' }, c), false); // syntax error
});

test('jinja2: result strings map to booleans; no evaluator or a throw is false', async () => {
    const results = new Map([
        ['{{ a }}', 'True'], ['{{ b }}', ' off '], ['{{ c }}', '2.5'], ['{{ d }}', '0.0'],
        ['{{ e }}', 'hello'], ['{{ f }}', ''], ['{{ g }}', 'None'], ['{{ h }}', true], ['{{ i }}', 0],
    ]);
    const evaluator = { evaluateAsync: async (tpl) => { if (tpl === '{{ boom }}') throw new Error('x'); return results.get(tpl); } };
    const c = ctx({ unifiedTemplateEvaluator: evaluator });
    const expected = { '{{ a }}': true, '{{ b }}': false, '{{ c }}': true, '{{ d }}': false, '{{ e }}': true, '{{ f }}': false, '{{ g }}': false, '{{ h }}': true, '{{ i }}': false };
    for (const [tpl, want] of Object.entries(expected)) assert.equal(await run({ jinja2: tpl }, c), want, tpl);
    assert.equal(await run({ jinja2: '{{ boom }}' }, c), false);
    assert.equal(await run({ jinja2: '{{ a }}' }, ctx()), false);
});

test('RulesEngine.extractEntityReferences: entity_attr indexes the full entity id', async () => {
    const { RulesEngine } = await import('../../src/core/rules/RulesEngine.js');
    const engine = new RulesEngine([], null);
    const refs = engine.extractEntityReferences({
        when: { any: [{ entity_attr: 'light.living_room', attribute: 'brightness', above: 128 }, { entity: 'sensor.temp', above: 1 }] },
    });
    // Regression: was indexed as 'light', so attribute changes never re-evaluated the rule.
    assert.deepEqual(refs.sort(), ['light.living_room', 'sensor.temp']);
});
