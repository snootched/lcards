/**
 * The docs Live Demo's sample Home Assistant (tests/helpers/card-env.js with
 * simulateServices): the services the demo views call work without a Home Assistant
 * (increment and decrement, scripts from demo/package.yaml, its automations as the
 * functions in DEMO_AUTOMATIONS).
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { createDemoEnv } from '../helpers/card-env.js';
import { DEMO_STATES, DEMO_AUTOMATIONS } from '../helpers/demo-states.js';
import { loadPackage } from '../../scripts/lib/demo-dashboard.js';
import { SAMPLE_ENTITIES, samplePoints, sampleStatistics } from '../../doc/.vitepress/theme/chart-demo-data.js';

function demoEnv() {
    const env = createDemoEnv({ sample: { SAMPLE_ENTITIES, samplePoints, sampleStatistics }, simulateServices: true, extraStates: DEMO_STATES });
    const call = (domain, service, data, target) => env.hass.callService(domain, service, data, target);
    const state = (id) => env.hass.states[id]?.state;
    return { env, call, state };
}

test('increment and decrement step an input_number and hold inside min and max', async () => {
    const { call, state } = demoEnv();
    const id = 'input_number.lcards_test_stage';
    assert.equal(state(id), '0');
    await call('input_number', 'increment', {}, { entity_id: id });
    await call('input_number', 'increment', { entity_id: id });
    assert.equal(state(id), '2');
    await call('input_number', 'decrement', {}, { entity_id: id });
    assert.equal(state(id), '1');
    for (let i = 0; i < 5; i++) await call('input_number', 'decrement', {}, { entity_id: id });
    assert.equal(state(id), '0', 'held at min');
});

test('every demo/package.yaml automation has a function twin on the same trigger entity', () => {
    const { automation } = loadPackage();
    assert.deepEqual(DEMO_AUTOMATIONS.map(a => a.id).sort(), automation.map(a => a.id).sort());
    for (const a of automation) {
        const twin = DEMO_AUTOMATIONS.find(t => t.id === a.id);
        const entities = a.triggers.flatMap(t => [t.entity_id].flat());
        assert.deepEqual(entities, [twin.entity], `${a.id}: trigger entity`);
    }
});

test('an automation twin runs on its entity\'s change (the mode select sets the alert mode)', async () => {
    const { env, call } = demoEnv();
    env.addAutomations(DEMO_AUTOMATIONS);
    const calls = [];
    // the alert service sets the page's alert mode through window.lcards
    const saved = globalThis.window.lcards;
    globalThis.window.lcards = { ...(saved ?? {}), setAlertMode: async (mode) => { calls.push(mode); } };
    try {
        await call('input_select', 'select_option', { option: 'gamma' }, { entity_id: 'input_select.lcards_test_mode' });
        await new Promise(r => setTimeout(r, 0));
        assert.deepEqual(calls, ['red_alert']);
    } finally {
        globalThis.window.lcards = saved;
    }
});

test('a script runs its steps, is on while it runs, and turn_off stops it', async () => {
    const { env, call, state } = demoEnv();
    env.addScripts({
        demo_steps: {
            alias: 'Demo steps',
            sequence: [
                { action: 'input_number.set_value', target: { entity_id: 'input_number.lcards_test_stage' }, data: { value: 0 } },
                { repeat: { count: 3, sequence: [{ delay: { milliseconds: 20 } }, { action: 'input_number.increment', target: { entity_id: 'input_number.lcards_test_stage' } }] } },
            ],
        },
    });
    assert.equal(state('script.demo_steps'), 'off');
    await call('script', 'turn_on', { entity_id: 'script.demo_steps' });
    assert.equal(state('script.demo_steps'), 'on');
    await new Promise(r => setTimeout(r, 30));
    assert.equal(state('input_number.lcards_test_stage'), '1');
    await call('script', 'turn_off', { entity_id: 'script.demo_steps' });
    assert.equal(state('script.demo_steps'), 'off');
    await new Promise(r => setTimeout(r, 80));
    assert.equal(state('input_number.lcards_test_stage'), '1', 'stopped: no more steps');
});

test('the package\'s scripts load (the showcase tour)', () => {
    const { env, state } = demoEnv();
    env.addScripts(loadPackage().script);
    assert.equal(state('script.lcards_test_tour'), 'off');
});

test('Jinja2 templates render without Home Assistant (ha-jinja): states, filters, inline if, dicts, now()', async () => {
    const { createHaJinja } = await import('../helpers/ha-jinja.js');
    const states = {
        'input_number.lcards_test_shields': { state: '20', attributes: { max: 100 } },
        'input_select.lcards_test_mode': { state: 'beta', attributes: {} },
    };
    const render = createHaJinja(() => states);
    assert.equal(render("{{ 'CRITICAL' if states('input_number.lcards_test_shields') | float(0) < 25 else 'Holding' }}"), 'CRITICAL');
    assert.equal(render("{{ {'alpha': 'green_alert', 'beta': 'yellow_alert'}[states('input_select.lcards_test_mode')] | default('green_alert') }}"), 'yellow_alert');
    assert.equal(render("{{ state_attr('input_number.lcards_test_shields', 'max') }}"), '100');
    assert.equal(render("{{ states.input_number.lcards_test_shields.state | int + 1 }}"), '21');
    assert.equal(render("{{ is_state('input_select.lcards_test_mode', 'beta') }}"), 'true');
    assert.equal(render("{{ states('sensor.nothing') }}"), 'unknown');
    assert.equal(render("{{ 'abc' | float(0) }}"), '0');
    assert.match(render("{{ now().strftime('%H:%M') }}"), /^\d\d:\d\d$/);
    assert.equal(render("{{ (7.456 | round(1)) }}"), '7.5');
});

test('the sample Home Assistant answers render_template subscriptions when given a renderer', async () => {
    const { createHaJinja } = await import('../helpers/ha-jinja.js');
    let latest = {};
    const render = createHaJinja(() => latest);
    const env = createDemoEnv({
        sample: { SAMPLE_ENTITIES, samplePoints, sampleStatistics }, extraStates: DEMO_STATES,
        renderTemplate: (t, v, states) => { latest = states; return render(t, v); },
    });
    const result = await new Promise((resolve) => {
        env.hass.connection.subscribeMessage((r) => resolve(r.result), { type: 'render_template', template: "{{ states('input_number.lcards_test_power') }} %" });
    });
    assert.equal(result, '82 %');
});
