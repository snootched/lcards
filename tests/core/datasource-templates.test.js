/**
 * DataSourceTemplateEvaluator: {ds:...} / {datasource:...} references, including the
 * documented short form for a processor's output ({ds:temp.smoothed}), which used to
 * stay unresolved (only {ds:temp.processing.smoothed} worked).
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DataSourceTemplateEvaluator } from '../../src/core/templates/DataSourceTemplateEvaluator.js';

const source = {
    getCurrentData: () => ({
        v: 20.77,
        metadata: { unit_of_measurement: '°C' },
        processing: { smoothed: { v: 20.4321 }, fahrenheit: 69.4 },
    }),
};
const manager = { getSource: (name) => (name === 'temp' ? source : null), hass: null };
const evaluate = (text) => new DataSourceTemplateEvaluator(manager).evaluate(text);

test('base value: HA-native with unit; explicit format without', () => {
    assert.match(evaluate('{ds:temp}'), /^20[.,]77\s?°C$/u); // HA puts a no-break space before the unit
    assert.equal(evaluate('{ds:temp:.1f}'), '20.8');
});

test('processor output: short form and the explicit processing. form agree, no unit appended', () => {
    assert.equal(evaluate('{datasource:temp.smoothed:.1f}'), '20.4');
    assert.equal(evaluate('{ds:temp.processing.smoothed:.1f}'), '20.4');
    assert.equal(evaluate('{datasource:temp.fahrenheit:.0f} °F'), '69 °F');
    assert.equal(evaluate('{ds:temp.smoothed}'), evaluate('{ds:temp.processing.smoothed}'));
});

test('unknown sources, processors and paths stay as written', () => {
    assert.equal(evaluate('{ds:nope}'), '{ds:nope}');
    assert.equal(evaluate('{ds:temp.nope}'), '{ds:temp.nope}');
});

// The percent format read the source's unit from a `metadata` variable that was never
// passed in, so every {ds:x:.1f%} threw "metadata is not defined" (found by the typecheck).
test('percent format: a fraction is scaled, a value already in % is not', () => {
    const percent = (v, unit) => new DataSourceTemplateEvaluator({
        getSource: () => ({ getCurrentData: () => ({ v, metadata: { unit_of_measurement: unit } }) }),
        hass: null,
    }).evaluate('{ds:x:.1f%}');
    assert.equal(percent(0.42, ''), '42.0%');
    assert.equal(percent(42, '%'), '42.0%');
});
