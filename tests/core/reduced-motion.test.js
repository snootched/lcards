/**
 * prefers-reduced-motion: the helper reads the media query live, AnimationManager
 * settles animations instead of playing them (finite ones jump to the end, loops
 * revert), and the Canvas2D background loop holds one frame.
 */
import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { installJsdom } from '../helpers/jsdom-env.js';

/** A controllable matchMedia stub for the reduced-motion query. */
function installMatchMedia(initial) {
    const listeners = new Set();
    const mql = {
        matches: initial,
        media: '(prefers-reduced-motion: reduce)',
        addEventListener: (type, fn) => { if (type === 'change') listeners.add(fn); },
        removeEventListener: (type, fn) => { if (type === 'change') listeners.delete(fn); },
    };
    const saved = Object.getOwnPropertyDescriptor(globalThis, 'matchMedia');
    Object.defineProperty(globalThis, 'matchMedia', { value: () => mql, configurable: true, writable: true });
    return {
        set(value) {
            mql.matches = value;
            for (const fn of [...listeners]) fn({ matches: value });
        },
        get listenerCount() { return listeners.size; },
        restore() {
            if (saved) Object.defineProperty(globalThis, 'matchMedia', saved);
            else delete globalThis.matchMedia;
        },
    };
}

/** Fake anime.js instance recording which settle method was called. */
function fakeInstance({ iterationCount = 1, withComplete = true } = {}) {
    const calls = [];
    /** @type {any} */
    const inst = {
        iterationCount,
        completed: false,
        revert: () => calls.push('revert'),
        pause: () => calls.push('pause'),
        calls,
    };
    if (withComplete) inst.complete = () => calls.push('complete');
    return inst;
}

const { prefersReducedMotion, onReducedMotionChange } = await import('../../src/utils/reduced-motion.js');
const { AnimationManager } = await import('../../src/core/animation/AnimationManager.js');

describe('reduced-motion helper', () => {
    let media;
    afterEach(() => media?.restore());

    it('reads the media query each call', () => {
        media = installMatchMedia(false);
        assert.equal(prefersReducedMotion(), false);
        media.set(true);
        assert.equal(prefersReducedMotion(), true);
    });

    it('is false and silent without matchMedia', () => {
        const saved = Object.getOwnPropertyDescriptor(globalThis, 'matchMedia');
        delete globalThis.matchMedia;
        try {
            assert.equal(prefersReducedMotion(), false);
            const unsubscribe = onReducedMotionChange(() => {});
            assert.equal(typeof unsubscribe, 'function');
            unsubscribe();
        } finally {
            if (saved) Object.defineProperty(globalThis, 'matchMedia', saved);
        }
    });

    it('notifies changes until unsubscribed', () => {
        media = installMatchMedia(false);
        const seen = [];
        const unsubscribe = onReducedMotionChange((reduced) => seen.push(reduced));
        media.set(true);
        unsubscribe();
        media.set(false);
        assert.deepEqual(seen, [true]);
        assert.equal(media.listenerCount, 0);
    });
});

describe('AnimationManager reduced-motion gate', () => {
    let media;
    let manager;
    beforeEach(() => {
        media = installMatchMedia(false);
        manager = new AnimationManager(null);
    });
    afterEach(() => {
        manager.dispose();
        media.restore();
    });

    it('a finite animation jumps to its end state', () => {
        const inst = fakeInstance({ iterationCount: 1 });
        manager._settleForReducedMotion(inst);
        assert.deepEqual(inst.calls, ['complete']);
    });

    it('a looping animation is reverted', () => {
        const inst = fakeInstance({ iterationCount: Infinity });
        manager._settleForReducedMotion(inst);
        assert.deepEqual(inst.calls, ['revert']);
    });

    it('a CSS keyframe handle (no complete, no iteration count) is reverted', () => {
        const inst = fakeInstance({ iterationCount: undefined, withComplete: false });
        manager._settleForReducedMotion(inst);
        assert.deepEqual(inst.calls, ['revert']);
    });

    it('switching reduced motion on settles every running animation', () => {
        const loop = fakeInstance({ iterationCount: Infinity });
        const once = fakeInstance({ iterationCount: 1 });
        const done = fakeInstance({ iterationCount: 1 });
        done.completed = true;
        manager.scopes.set('card-a', {
            runningInstances: new Map([['on_load', [loop, once]], ['on_tap', [done]]]),
            liveSpeedBindings: new Map(),
        });
        media.set(true);
        assert.deepEqual(loop.calls, ['revert']);
        assert.deepEqual(once.calls, ['complete']);
        assert.deepEqual(done.calls, [], 'already completed: untouched');
        assert.equal(manager.scopes.get('card-a').runningInstances.size, 0);
    });

    it('dispose stops listening', () => {
        assert.equal(media.listenerCount, 1);
        manager.dispose();
        assert.equal(media.listenerCount, 0);
    });
});

describe('Canvas2DRenderer under reduced motion', async () => {
    const { Canvas2DRenderer } = await import('../../src/core/packs/backgrounds/renderers/Canvas2DRenderer.js');
    let env;
    let media;
    let frames;
    let savedRaf;
    let savedCaf;

    beforeEach(() => {
        env = installJsdom(); // the renderer listens for visibilitychange on document
        media = installMatchMedia(true);
        frames = [];
        savedRaf = globalThis.requestAnimationFrame;
        savedCaf = globalThis.cancelAnimationFrame;
        globalThis.requestAnimationFrame = (fn) => { frames.push(fn); return frames.length; };
        globalThis.cancelAnimationFrame = () => {};
    });
    afterEach(() => {
        globalThis.requestAnimationFrame = savedRaf;
        globalThis.cancelAnimationFrame = savedCaf;
        media.restore();
        env.restore();
    });

    /** Run queued frames until the loop stops asking for more (bounded). */
    const drain = (limit = 10) => {
        let ran = 0;
        while (frames.length && ran < limit) { frames.shift()(performance.now()); ran++; }
        return ran;
    };

    function makeRenderer() {
        let draws = 0;
        const ctx = { clearRect() {} };
        const canvas = /** @type {any} */ ({ width: 100, height: 50, getContext: () => ctx });
        const renderer = new Canvas2DRenderer(canvas, { monitorPerformance: false, targetFps: 0 });
        renderer.addEffect({ isActive: () => true, update() {}, draw() { draws++; } });
        return { renderer, draws: () => draws };
    }

    it('draws one frame and schedules no more', () => {
        const { renderer, draws } = makeRenderer();
        renderer.start();
        drain();
        assert.equal(draws(), 1);
        assert.equal(frames.length, 0);
        renderer.stop();
    });

    it('resumes when reduced motion is switched off', () => {
        const { renderer, draws } = makeRenderer();
        renderer.start();
        drain();
        media.set(false);
        drain(3);
        assert.ok(draws() > 1, `expected the loop to resume, drew ${draws()}`);
        assert.ok(frames.length > 0, 'loop keeps scheduling');
        renderer.stop();
    });
});
