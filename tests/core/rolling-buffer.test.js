/**
 * RollingBuffer: ring order, wrap-around, coalescing, windows.
 *
 * push() coalesces pushes that arrive within 10 ms of wall-clock time and whose
 * timestamps are within 1 s, so tests drive Date.now() with mock timers.
 */
import { test, beforeEach, afterEach, mock } from 'node:test';
import assert from 'node:assert/strict';
import { RollingBuffer } from '../../src/core/data-sources/RollingBuffer.js';

const T0 = Date.UTC(2026, 9, 9, 12, 0, 0);

beforeEach(() => mock.timers.enable({ apis: ['Date'], now: T0 }));
afterEach(() => mock.timers.reset());

/** Push values one second apart (and one second of wall clock apart). */
function fill(buf, values, start = T0) {
    values.forEach((v, i) => {
        mock.timers.tick(1000);
        buf.push(start + i * 1000, v);
    });
}

test('capacity: at least 1, capped at 1000', () => {
    assert.throws(() => new RollingBuffer(0), /at least 1/);
    assert.equal(new RollingBuffer(5000).capacity, 1000);
    assert.equal(new RollingBuffer().capacity, 100);
});

test('getArrays/getAll keep oldest-first order before and after wrap-around', () => {
    const buf = new RollingBuffer(3);
    fill(buf, [1, 2]);
    assert.deepEqual(buf.getArrays().v, [1, 2]);
    fill(buf, [3, 4, 5], T0 + 2000);
    assert.deepEqual(buf.getArrays().v, [3, 4, 5]);
    assert.deepEqual(buf.getAll().map(p => p.v), [3, 4, 5]);
    assert.deepEqual(buf.getArrays().t, [T0 + 2000, T0 + 3000, T0 + 4000]);
    assert.deepEqual(buf.first(), { t: T0 + 2000, v: 3 });
    assert.deepEqual(buf.last(), { t: T0 + 4000, v: 5 });
    assert.equal(buf.size(), 3);
    assert.equal(buf._validateConsistency(), true);
});

test('isFull only turns true on the first overwrite (current behaviour)', () => {
    const buf = new RollingBuffer(2);
    fill(buf, [1, 2]);
    assert.equal(buf.size(), 2);
    assert.equal(buf.isFull(), false);
    fill(buf, [3], T0 + 2000);
    assert.equal(buf.isFull(), true);
});

test('push ignores non-finite values and bad timestamps', () => {
    const buf = new RollingBuffer(5);
    for (const [t, v] of [[T0, NaN], [T0, '5'], [T0, null], [NaN, 1], [-1, 1]]) {
        mock.timers.tick(1000);
        buf.push(t, v);
    }
    assert.equal(buf.size(), 0);
});

test('rapid pushes with close timestamps coalesce into the last slot', () => {
    const buf = new RollingBuffer(5);
    buf.push(T0, 1);
    mock.timers.tick(5);       // < 10 ms wall clock
    buf.push(T0 + 500, 2);     // < 1 s apart: overwrites
    assert.deepEqual(buf.getArrays().v, [2]);
    mock.timers.tick(5);
    buf.push(T0 + 5000, 3);    // far-apart timestamp: kept even though rapid
    assert.deepEqual(buf.getArrays().v, [2, 3]);
    mock.timers.tick(50);
    buf.push(T0 + 5100, 4);    // close timestamp but not rapid: kept
    assert.deepEqual(buf.getArrays().v, [2, 3, 4]);
});

test('sliceSince returns points inside the window', () => {
    const buf = new RollingBuffer(10);
    fill(buf, [1, 2, 3, 4], T0);  // timestamps T0..T0+3000; clock now T0+4000
    assert.deepEqual(buf.sliceSince(2500).v, [3, 4]);
    assert.deepEqual(buf.sliceSince(60_000).v, [1, 2, 3, 4]);
    assert.deepEqual(buf.sliceSince(0).v, []);
    assert.deepEqual(new RollingBuffer(2).sliceSince(1000).v, []);
});

test('sliceSince returns nothing when every point is older than the window', () => {
    // Regression: the start index defaulted to 0, so a window that excluded
    // every point returned the whole buffer instead.
    const buf = new RollingBuffer(10);
    fill(buf, [1, 2], T0);
    mock.timers.tick(60_000);
    assert.deepEqual(buf.sliceSince(1000), { t: [], v: [] });
});

test('getRecent is newest-first; clear empties', () => {
    const buf = new RollingBuffer(3);
    fill(buf, [1, 2, 3, 4]);
    assert.deepEqual(buf.getRecent(2).map(p => p.value), [4, 3]);
    assert.deepEqual(buf.getRecent().map(p => p.v), [4, 3, 2]);
    buf.clear();
    assert.equal(buf.size(), 0);
    assert.equal(buf.last(), null);
    assert.deepEqual(buf.getArrays(), { t: [], v: [] });
});
