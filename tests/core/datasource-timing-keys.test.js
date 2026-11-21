/**
 * DataSource timing options: snake_case is canonical, camelCase still read.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DataSource } from '../../src/core/data-sources/DataSource.js';

const timing = (cfg) => {
    const ds = new DataSource({ entity: 'sensor.x', ...cfg }, null);
    return { window: ds.windowSeconds, min: ds.minEmitMs, coalesce: ds.coalesceMs, maxDelay: ds.maxDelayMs, same: ds.emitOnSameValue };
};

test('snake_case timing keys (what the editor writes) take effect', () => {
    assert.deepEqual(
        timing({ window_seconds: 120, min_emit_ms: 500, coalesce_ms: 50, max_delay_ms: 900, emit_on_same_value: false }),
        { window: 120, min: 500, coalesce: 50, maxDelay: 900, same: false }
    );
    assert.equal(timing({ window_seconds: '5m' }).window, 300);
});

test('camelCase still works; snake_case wins when both are set', () => {
    assert.deepEqual(
        timing({ windowSeconds: 30, minEmitMs: 200, coalesceMs: 40, maxDelayMs: 600, emitOnSameValue: false }),
        { window: 30, min: 200, coalesce: 40, maxDelay: 600, same: false }
    );
    assert.equal(timing({ sampleMs: 250 }).min, 250);
    assert.equal(timing({ window_seconds: 90, windowSeconds: 30 }).window, 90);
});

test('defaults', () => {
    assert.deepEqual(timing({}), { window: 60, min: 100, coalesce: 40, maxDelay: 120, same: true });
});
