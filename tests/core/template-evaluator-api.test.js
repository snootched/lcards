/**
 * UnifiedTemplateEvaluator bugs from the D3b docs rewrite:
 *  - R5: updateHass() and extractDependencies() threw (they called methods
 *    HATemplateEvaluator does not have)
 *  - R6: a legacy {source} data source reference sharing the text with a real
 *    token was emptied by the token phase ('{config.name} {temp}' -> 'N ')
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { UnifiedTemplateEvaluator } from '../../src/core/templates/UnifiedTemplateEvaluator.js';

const source = {
    getCurrentData: () => ({ v: 21.5, metadata: {}, processing: { smoothed: { v: 20.25 } } }),
};
const dataSourceManager = { getSource: (name) => (name === 'temp' ? source : null), hass: null };
const make = (context = { config: { name: 'N' } }) =>
    new UnifiedTemplateEvaluator({ context, dataSourceManager });

test('R6: legacy {source} keeps its value next to a real token', async () => {
    const ev = make();
    assert.equal(await ev.evaluateAsync('{config.name} {temp:.1f}'), 'N 21.5');
    assert.equal(ev.evaluateSync('{config.name} {temp.smoothed:.1f}'), 'N 20.3');
    assert.equal(await ev.evaluateAsync('{temp:.1f}'), '21.5', 'alone too');
    assert.equal(await ev.evaluateAsync('{config.name} {ds:temp:.1f}'), 'N 21.5', 'explicit form unchanged');
});

test('R6: tokens still win on a name clash; unknown tokens still empty', async () => {
    const ev = make({ config: { name: 'N' }, temp: 'ctx' });
    assert.equal(await ev.evaluateAsync('{config.name} {temp}'), 'N ctx', 'a context key is a token');
    assert.equal(await make().evaluateAsync('{config.name} {nope}'), 'N ', 'unresolved token: empty');
    assert.equal(await make().evaluateAsync('{config.name} {theme:colors.x}'), 'N ', 'theme: is never a data source');
});

test('R5: updateHass() swaps hass for tokens and Jinja2; extractDependencies() lists Jinja2 entities', () => {
    const ev = make({ config: {} });
    const hass = { states: { 'sensor.x': { state: '5', attributes: {} } } };
    assert.doesNotThrow(() => ev.updateHass(hass));
    assert.equal(ev.hass, hass);
    assert.equal(ev.context.hass, hass);
    assert.equal(ev.lcardsCardEvaluator._haEvaluator.context.hass, hass, 'Jinja2 renders with the new hass');
    assert.deepEqual(ev.extractDependencies("{{ states('sensor.x') }} {{ is_state('light.y', 'on') }}").sort(), ['light.y', 'sensor.x']);
});

test('R5: updateContext() keeps the Jinja2 evaluator on the same context', () => {
    const ev = make({ config: {} });
    ev.updateContext({ variables: { a: 1 } });
    assert.equal(ev.lcardsCardEvaluator._haEvaluator.context, ev.lcardsCardEvaluator.context);
    assert.equal(ev.context.variables.a, 1);
});
