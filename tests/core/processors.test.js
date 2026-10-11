/**
 * Data-source processors: each type over a sample sequence, plus config validation.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ClampProcessor } from '../../src/core/data-sources/processors/ClampProcessor.js';
import { RoundProcessor } from '../../src/core/data-sources/processors/RoundProcessor.js';
import { ScaleProcessor } from '../../src/core/data-sources/processors/ScaleProcessor.js';
import { DeltaProcessor } from '../../src/core/data-sources/processors/DeltaProcessor.js';
import { RateProcessor } from '../../src/core/data-sources/processors/RateProcessor.js';
import { SmoothProcessor } from '../../src/core/data-sources/processors/SmoothProcessor.js';
import { StatisticsProcessor } from '../../src/core/data-sources/processors/StatisticsProcessor.js';
import { TrendProcessor } from '../../src/core/data-sources/processors/TrendProcessor.js';
import { ThresholdProcessor } from '../../src/core/data-sources/processors/ThresholdProcessor.js';
import { DurationProcessor } from '../../src/core/data-sources/processors/DurationProcessor.js';
import { ConvertUnitProcessor } from '../../src/core/data-sources/processors/ConvertUnitProcessor.js';
import { ExpressionProcessor } from '../../src/core/data-sources/processors/ExpressionProcessor.js';

/** Minimal main buffer: getAll() over the given points. */
const bufferOf = (points = []) => ({ getAll: () => points });

/** Feed values (timestamps 1s apart unless given as [t, v]) and collect outputs. */
function run(proc, values, buffer = bufferOf()) {
    return values.map((item, i) => {
        const [t, v] = Array.isArray(item) ? item : [i * 1000, item];
        return proc.process(v, t, buffer, {});
    });
}

const near = (a, b, eps = 1e-9) => assert.ok(Math.abs(a - b) <= eps, `${a} !~ ${b}`);

test('clamp: bounds, defaults, invalid input', () => {
    assert.deepEqual(run(new ClampProcessor({ min: 0, max: 10 }), [-5, 0, 5, 10, 15, NaN, null]), [0, 0, 5, 10, 10, null, null]);
    assert.deepEqual(run(new ClampProcessor({ min: 0 }), [-1, 1e9]), [0, 1e9]);
    assert.throws(() => new ClampProcessor({ min: 5, max: 1 }), /min must be <= max/);
});

test('round: precision and method', () => {
    assert.deepEqual(run(new RoundProcessor({}), [1.4, 1.5, -1.5]), [1, 2, -1]);
    assert.deepEqual(run(new RoundProcessor({ precision: 2 }), [3.14159, 2.346]), [3.14, 2.35]);
    assert.deepEqual(run(new RoundProcessor({ precision: 1, method: 'floor' }), [1.99, -1.01]), [1.9, -1.1]);
    assert.deepEqual(run(new RoundProcessor({ method: 'ceil' }), [1.01]), [2]);
    assert.deepEqual(run(new RoundProcessor({}), [Infinity]), [null]);
    assert.throws(() => new RoundProcessor({ method: 'trunc' }), /method must be one of/);
});

test('scale: curves map the input range onto the output range', () => {
    const lin = new ScaleProcessor({ input_range: [0, 1000], output_range: [0, 1] });
    assert.deepEqual(run(lin, [0, 500, 1000, 2000]), [0, 0.5, 1, 2]); // not clamped
    const inv = new ScaleProcessor({ input_range: [0, 100], output_range: [100, 0] });
    assert.deepEqual(run(inv, [25]), [75]);
    const exp = new ScaleProcessor({ input_range: [0, 10], output_range: [0, 100], curve: 'exponential' });
    near(run(exp, [5])[0], 25);
    const log = new ScaleProcessor({ input_range: [0, 10], output_range: [0, 1], curve: 'logarithmic' });
    near(run(log, [10])[0], 1);
    const sig = new ScaleProcessor({ input_range: [0, 10], output_range: [0, 1], curve: 'sigmoid' });
    near(run(sig, [5])[0], 0.5);
    assert.deepEqual(run(new ScaleProcessor({}), [50]), [0.5]); // defaults [0,100] -> [0,1]
    assert.throws(() => new ScaleProcessor({ input_range: [0] }), /input_range/);
    assert.throws(() => new ScaleProcessor({ curve: 'cubic' }), /Unknown curve/);
});

test('delta: first value is 0; optional absolute; invalid input is 0', () => {
    assert.deepEqual(run(new DeltaProcessor({}), [10, 12, 9, NaN, 9]), [0, 2, -3, 0, 0]);
    assert.deepEqual(run(new DeltaProcessor({ absolute: true }), [10, 12, 9]), [0, 2, 3]);
});

test('rate: per unit time, zero dt keeps last rate, optional smoothing', () => {
    const perSec = new RateProcessor({});
    assert.deepEqual(run(perSec, [[0, 0], [1000, 10], [3000, 20], [3000, 99]]), [0, 10, 5, 5]);
    const perMin = new RateProcessor({ unit: 'per_minute' });
    assert.deepEqual(run(perMin, [[0, 0], [30_000, 1]]), [0, 2]);
    const smooth = new RateProcessor({ smoothing: true });
    const out = run(smooth, [[0, 0], [1000, 10], [2000, 30]]);
    near(out[2], 0.3 * 20 + 0.7 * 10);
    // Invalid input returns the last rate (null before any rate exists).
    assert.equal(new RateProcessor({}).process(NaN, 0, null, {}), null);
    assert.throws(() => new RateProcessor({ unit: 'per_day' }), /Unknown rate unit/);
});

test('smooth: exponential, moving average, gaussian', () => {
    const exp = run(new SmoothProcessor({ alpha: 0.5 }), [10, 20, 20]);
    assert.deepEqual(exp, [10, 15, 17.5]);
    assert.deepEqual(run(new SmoothProcessor({ method: 'moving_average', window: 2 }), [2, 4, 6]), [2, 3, 5]);
    // Gaussian weighs its own recent inputs (not the main buffer), newest heaviest.
    const g = run(new SmoothProcessor({ method: 'gaussian', window: 4 }), [1, 2, 3, 4]).at(-1);
    assert.ok(g > 2.5 && g < 4, String(g));
    // Fewer than 3 inputs so far: value passes through.
    assert.deepEqual(run(new SmoothProcessor({ method: 'gaussian' }), [7, 9]), [7, 9]);
    // Unknown method passes values through.
    assert.deepEqual(run(new SmoothProcessor({ method: 'nope' }), [3, 9]), [3, 9]);
});

test('smooth: invalid input returns the previous smoothed value (0 becomes null, current behaviour)', () => {
    const p = new SmoothProcessor({});
    assert.deepEqual(run(p, [5, NaN]), [5, 5]);
    const zero = new SmoothProcessor({});
    assert.deepEqual(run(zero, [0, NaN]), [0, null]);
});

test('statistics: session window, every stat', () => {
    const p = new StatisticsProcessor({ stats: ['min', 'max', 'mean', 'median', 'std_dev', 'q1', 'q3', 'range', 'count', 'sum'] });
    const out = run(p, [4, 1, 3, 2]).at(-1);
    assert.deepEqual(
        { ...out, std_dev: Math.round(out.std_dev * 1e6) / 1e6 },
        { min: 1, max: 4, mean: 2.5, median: 2.5, std_dev: 1.118034, q1: 1.75, q3: 3.25, range: 3, count: 4, sum: 10, oldest: 0, newest: 3000, window: 'session' }
    );
    assert.equal(new StatisticsProcessor({}).process(NaN, 0, bufferOf(), {}), null);
});

test('statistics: time window over its own inputs; max_points returns a series', () => {
    // Its own inputs, not the main buffer: with input_source they are another
    // processor's output (found with the S7 processor preview).
    const p = new StatisticsProcessor({ window: '30s', stats: ['mean', 'count'] });
    const buf = bufferOf([{ t: 0, v: 999 }]);
    p.process(100, 0, buf, {});
    p.process(1, 50_000, buf, {});
    const r = p.process(3, 60_000, buf, {});
    assert.equal(r.mean, 2);
    assert.equal(r.count, 2);
    const series = new StatisticsProcessor({ stats: ['max'], max_points: 2 });
    const outs = run(series, [1, 5, 3]);
    assert.deepEqual(outs.at(-1).map(r => r.max), [5, 5]);
    assert.equal(outs.at(-1).length, 2);
    // Unknown window strings fall back to one hour.
    assert.equal(new StatisticsProcessor({ window: 'weekly' })._windowMs, 3_600_000);
});

test('trend: slope over recent samples against a threshold', () => {
    assert.deepEqual(run(new TrendProcessor({ samples: 3 }), [1, 2, 3, 3, 2, 1]),
        ['stable', 'increasing', 'increasing', 'increasing', 'decreasing', 'decreasing']);
    assert.deepEqual(run(new TrendProcessor({ threshold: 1 }), [1, 1.5, 2]), ['stable', 'stable', 'stable']);
    const p = new TrendProcessor({});
    run(p, [1, 5]);
    assert.equal(p.process(NaN, 9, null, {}), 'increasing'); // invalid keeps last trend
});

test('threshold: initial state, hysteresis band, custom outputs', () => {
    const p = new ThresholdProcessor({ threshold: 50, hysteresis: 10 });
    // Start above; must drop to <=45 to switch below; must rise to >=55 to switch back.
    assert.deepEqual(run(p, [50, 46, 45, 54, 55, NaN]), [1, 1, 0, 0, 1, 1]);
    assert.deepEqual(run(new ThresholdProcessor({ threshold: 0, above: 'hot', below: 'cold' }), [-1, 1]), ['cold', 'hot']);
    assert.throws(() => new ThresholdProcessor({}), /requires "threshold"/);
});

test('duration: time in condition, reset_on, human format', () => {
    const p = new DurationProcessor({ condition: '> 20', reset_on: '< 0' });
    const out = run(p, [[0, 25], [90_000, 30], [3_700_000, 30], [3_800_000, 10], [3_900_000, 25], [4_000_000, -1]]);
    assert.deepEqual(out.map(o => o.duration_ms), [0, 90_000, 3_700_000, 0, 0, 0]);
    assert.deepEqual(out.map(o => o.duration_human), ['0ms', '1m 30s', '1h 1m', '0ms', '0ms', '0s']);
    assert.deepEqual(out.map(o => o.in_condition), [true, true, true, false, true, false]);
    assert.equal(p._formatDuration(2 * 86_400_000 + 3_600_000), '2d 1h 0m');
    for (const [cond, v, want] of [['>= 5', 5, true], ['<= 5', 6, false], ['== 5', 5, true], ['!= 5', 5, false], ['<5', 4, true]]) {
        assert.equal(new DurationProcessor({ condition: cond })._conditionFn(v), want, cond);
    }
    assert.throws(() => new DurationProcessor({ condition: 'above 5' }), /Invalid condition/);
    assert.throws(() => new DurationProcessor({ condition: '=> 5' }), /Unknown operator/);
});

test('convert_unit: direct, reverse and alias conversions', () => {
    const cases = [
        ['c', 'f', 100, 212], ['f', 'c', 32, 0], ['celsius', 'kelvin', 0, 273.15], ['K', 'F', 273.15, 32],
        ['w', 'kw', 1500, 1.5], ['kw', 'w', 1.5, 1500], ['C', 'c', 7, 7],
    ];
    for (const [from, to, input, want] of cases) {
        near(new ConvertUnitProcessor({ from, to }).process(input, 0, null, {}), want, 1e-9);
    }
    assert.equal(new ConvertUnitProcessor({ from: 'c', to: 'f' }).process(null, 0, null, {}), null);
    assert.throws(() => new ConvertUnitProcessor({ from: 'c' }), /requires "from" and "to"/);
    assert.throws(() => new ConvertUnitProcessor({ from: 'c', to: 'kw' }), /No conversion available/);
});

test('expression: value, sources, Math helpers, entity; errors give null', () => {
    const p = new ExpressionProcessor({ expression: 'round(v * 2) + sources[0]', sources: ['a'] });
    assert.equal(p.process(1.4, 0, null, { a: 10 }), 13);
    assert.equal(new ExpressionProcessor({ expression: 'sources[0]', sources: ['missing'] }).process(1, 0, null, {}), null);
    const withEntity = new ExpressionProcessor({
        expression: 'entity.attributes.max - value',
        dataSource: { hass: { states: { 'sensor.x': { state: '5', attributes: { max: 9 } } } }, cfg: { entity: 'sensor.x' } },
    });
    assert.equal(withEntity.process(5, 0, null, {}), 4);
    assert.equal(new ExpressionProcessor({ expression: 'nope.x' }).process(1, 0, null, {}), null);
    assert.throws(() => new ExpressionProcessor({ expression: 'return (' }), /Invalid expression/);
    assert.throws(() => new ExpressionProcessor({}), /requires "expression"/);
});

test('base processor: disabled passes through; stats count executions', () => {
    const off = new ClampProcessor({ min: 0, max: 1, enabled: false });
    assert.equal(off.process(5, 0, null, {}), 5);
    const on = new ClampProcessor({ min: 0, max: 1 });
    run(on, [5, 6]);
    assert.equal(on.getStats().executions, 2);
    on.resetStats();
    assert.equal(on.getStats().executions, 0);
});
