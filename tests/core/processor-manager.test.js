/**
 * ProcessorManager: processor creation, dependency order (input_source), cycles,
 * and chained processing.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ProcessorManager } from '../../src/core/data-sources/ProcessorManager.js';
import { RollingBuffer } from '../../src/core/data-sources/RollingBuffer.js';

function manager(processing) {
    const pm = new ProcessorManager({ hass: null }, {});
    pm.initialize(processing, new RollingBuffer(10));
    return pm;
}

test('execution order follows input_source chains regardless of key order', () => {
    const pm = manager({
        rounded: { type: 'round', input_source: 'smoothed', precision: 1 },
        smoothed: { type: 'smooth', input_source: 'fahrenheit', alpha: 0.5 },
        fahrenheit: { type: 'convert_unit', from: 'c', to: 'f' },
        clamped: { type: 'clamp', min: 0, max: 30 },
    });
    const order = pm._executionOrder;
    assert.ok(order.indexOf('fahrenheit') < order.indexOf('smoothed'));
    assert.ok(order.indexOf('smoothed') < order.indexOf('rounded'));
    assert.equal(order.length, 4);
});

test('process: each step reads its input_source result; roots read the raw value', () => {
    const pm = manager({
        fahrenheit: { type: 'convert_unit', from: 'c', to: 'f' },
        smoothed: { type: 'smooth', input_source: 'fahrenheit', alpha: 0.5 },
        rounded: { type: 'round', input_source: 'smoothed' },
        clamped: { type: 'clamp', min: 0, max: 30 },
    });
    assert.deepEqual(pm.process(100, 1_000, null), { fahrenheit: 212, smoothed: 212, rounded: 212, clamped: 30 });
    const second = pm.process(0, 2_000, null);
    assert.deepEqual(second, { fahrenheit: 32, smoothed: 122, rounded: 122, clamped: 0 });
    assert.deepEqual(pm.getResults(), second);
    assert.deepEqual(pm.getBuffer('rounded').getArrays().v, [212, 122]);
});

test('`from:` is not a chaining key (it is convert_unit\'s unit field)', () => {
    // A processor configured with `from: <other key>` reads the raw value.
    const pm = manager({
        doubled: { type: 'expression', expression: 'v * 2' },
        rounded: { type: 'round', from: 'doubled' },
    });
    assert.equal(pm.getProcessor('rounded').getDependency(), null);
    assert.deepEqual(pm.process(1.4, 1_000, null), { doubled: 2.8, rounded: 1 });
});

test('expression sources read earlier results', () => {
    const pm = manager({
        a: { type: 'expression', expression: 'v + 1' },
        sum: { type: 'expression', expression: 'sources[0] + v', sources: ['a'], input_source: 'a' },
    });
    // sum's own input is a's result (11), plus sources[0] (also 11).
    assert.deepEqual(pm.process(10, 1_000, null), { a: 11, sum: 22 });
});

test('initialize errors: unknown type, missing type, unknown dependency, cycles, array config', () => {
    assert.throws(() => manager({ x: { type: 'warp' } }), /Unknown processor type: warp/);
    assert.throws(() => manager({ x: {} }), /missing required "type"/);
    assert.throws(() => manager({ x: { type: 'round', input_source: 'ghost' } }), /depends on unknown processor: ghost/);
    assert.throws(() => manager({
        a: { type: 'round', input_source: 'b' },
        b: { type: 'round', input_source: 'a' },
        c: { type: 'round' },
    }), /Circular dependency detected in processors: a, b/);
    assert.throws(() => manager([{ type: 'round' }]), /expected object, got array/);
});

test('empty or missing config is a no-op; invalidate stops processing', () => {
    const pm = new ProcessorManager({ hass: null }, {});
    pm.initialize(null, new RollingBuffer(5));
    assert.deepEqual(pm.getProcessorKeys(), []);
    const live = manager({ r: { type: 'round' } });
    live.invalidate();
    assert.deepEqual(live.process(1.2, 1_000, null), {});
});
