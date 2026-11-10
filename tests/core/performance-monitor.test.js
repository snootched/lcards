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
    const saved = { now: performance.now, raf: globalThis.requestAnimationFrame, dispatch: globalThis.dispatchEvent };
    /** @type {any[]} */
    const checks = [];
    performance.now = () => now;
    globalThis.requestAnimationFrame = (cb) => { queue.push(cb); return queue.length; };
    globalThis.dispatchEvent = (event) => { checks.push(/** @type {any} */ (event).detail); return true; };
    return {
        checks,
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
