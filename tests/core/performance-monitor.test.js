/**
 * M6 (D3c): the PerformanceMonitor checked the FPS on every frame once its
 * 60-frame window was full, so "3 consecutive low checks" took 3 frames (about
 * 50 ms), not about 3 s. It checks once per 60 frames now.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { AnimationPerformanceMonitor } from '../../src/core/animation/PerformanceMonitor.js';

/** Fake clock + RAF: each frame advances the clock by frameMs. */
function fakeFrames(frameMs) {
    let now = 0;
    /** @type {Function[]} */
    let queue = [];
    let ids = 0;
    const saved = { now: performance.now, raf: globalThis.requestAnimationFrame, caf: globalThis.cancelAnimationFrame, dispatch: globalThis.dispatchEvent };
    /** @type {any[]} */
    const checks = [];
    performance.now = () => now;
    globalThis.requestAnimationFrame = (cb) => { const id = ++ids; queue.push(Object.assign((/** @type {number} */ t) => cb(t), { id })); return id; };
    globalThis.cancelAnimationFrame = (id) => { queue = queue.filter(f => /** @type {any} */ (f).id !== id); };
    globalThis.dispatchEvent = (event) => { checks.push(/** @type {any} */ (event).detail); return true; };
    return {
        checks,
        /** frames queued right now: one per running loop */
        pending: () => queue.length,
        run(frames) {
            for (let i = 0; i < frames; i++) {
                now += frameMs;
                const next = queue; queue = [];
                next.forEach(cb => cb(now));
            }
        },
        restore() {
            performance.now = saved.now;
            globalThis.requestAnimationFrame = saved.raf;
            globalThis.cancelAnimationFrame = saved.caf;
            globalThis.dispatchEvent = saved.dispatch;
        },
    };
}

test('M6: one check per 60 frames; disable only after 3 low checks (about 3 s of frames)', () => {
    const clock = fakeFrames(100); // 10 fps: below both thresholds
    try {
        const monitor = new AnimationPerformanceMonitor();
        monitor._settleMs = 0;
        monitor.start();
        clock.run(60 * 2);
        assert.equal(clock.checks.length, 2, 'two checks in 120 frames');
        assert.equal(clock.checks.at(-1).shouldDisable3D, false, 'not after 2 low checks');
        assert.equal(clock.checks.at(-1).fps, 10);
        assert.equal(clock.checks.at(-1).shouldReduceEffects, true);
        clock.run(60);
        assert.equal(clock.checks.length, 3);
        assert.equal(clock.checks.at(-1).shouldDisable3D, true, 'after the 3rd');
        monitor.stop();
    } finally {
        clock.restore();
    }
});

test('M6: a restart does not count the stopped time as a frame', () => {
    const clock = fakeFrames(16);
    try {
        const monitor = new AnimationPerformanceMonitor();
        monitor._settleMs = 0;
        monitor.start();
        clock.run(60);
        monitor.stop();
        clock.run(1); // loop ends
        performance.now = (() => { const t = performance.now() + 60_000; return () => t; })();
        monitor.start();
        assert.ok(monitor.frames.length <= 1, 'window starts over');
        assert.ok(Math.max(0, ...monitor.frames) < 1000, 'no 60 s frame');
    } finally {
        clock.restore();
    }
});

// 2026-11-17: stop() left its queued frame. While a tab is hidden that frame doesn't
// run; start() on show then began a second loop beside it, one more per hide/show,
// and the near-zero frame times made the FPS read high, so the fallbacks never fired.
test('hide/show cycles keep one measurement loop and a true FPS', () => {
    const clock = fakeFrames(100); // 10 fps
    try {
        const monitor = new AnimationPerformanceMonitor();
        monitor._settleMs = 0;
        monitor.start();
        clock.run(3);
        for (let i = 0; i < 5; i++) {
            monitor.stop();  // tab hidden: no frames run
            monitor.start(); // tab shown
        }
        assert.equal(clock.pending(), 1, 'one loop');
        clock.run(130);
        assert.equal(clock.pending(), 1, 'still one loop');
        assert.equal(clock.checks.at(-1).fps, 10, 'the FPS is the real one');
        assert.equal(clock.checks.at(-1).shouldReduceEffects, true);
        monitor.stop();
        assert.equal(clock.pending(), 0, 'stop cancels the queued frame');
    } finally {
        clock.restore();
    }
});
