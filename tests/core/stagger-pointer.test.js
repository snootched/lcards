/**
 * Stagger `from: 'pointer'` (tap-ripple): the tap point is normalised to the box
 * anime.js measures a grid `from: [x, y]` against (the targets' centres), and the
 * action handler reads the tap point from mouse and touch events.
 */
import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { installJsdom } from '../helpers/jsdom-env.js';

let staggerArgs, pointerFrom, pointerOf, restore;

before(async () => {
    ({ restore } = installJsdom());
    ({ staggerArgs, pointerFrom } = await import('../../src/utils/lcards-anim-helpers.js'));
    ({ pointerOf } = await import('../../src/base/LCARdSActionHandler.js'));
});
after(() => restore?.());

// A 3 x 2 grid of 100 x 50 cells at the origin: centres x 50..250, y 25..75
const rects = [];
for (let row = 0; row < 2; row++) {
    for (let col = 0; col < 3; col++) rects.push({ left: col * 100, top: row * 50, width: 100, height: 50 });
}

describe('pointerFrom', () => {
    it('maps the centres box to 0..1', () => {
        assert.deepEqual(pointerFrom({ clientX: 50, clientY: 25 }, rects), [0, 0]);
        assert.deepEqual(pointerFrom({ clientX: 250, clientY: 75 }, rects), [1, 1]);
        assert.deepEqual(pointerFrom({ clientX: 150, clientY: 50 }, rects), [0.5, 0.5]);
    });
    it('a tap on the outer half of an edge cell lands outside 0..1', () => {
        const [x, y] = /** @type {[number, number]} */ (pointerFrom({ clientX: 10, clientY: 95 }, rects));
        assert.ok(x < 0, `x ${x}`);
        assert.ok(y > 1, `y ${y}`);
    });
    it('an axis without extent gets 0.5', () => {
        assert.deepEqual(pointerFrom({ clientX: 80, clientY: 10 }, [rects[0], rects[1]]), [0.3, 0.5]);
    });
    it('null without a pointer or targets', () => {
        assert.equal(pointerFrom(null, rects), null);
        assert.equal(pointerFrom({ clientX: 1, clientY: 1 }, []), null);
        assert.equal(pointerFrom({ clientX: NaN, clientY: 1 }, rects), null);
    });
});

describe('staggerArgs from: pointer', () => {
    it('starts at the tap and turns grid on', () => {
        const { options } = staggerArgs({ value: 40, from: 'pointer' }, { pointer: { clientX: 250, clientY: 25 }, rects });
        assert.deepEqual(options, { from: [1, 0], grid: true });
    });
    it('keeps an explicit grid', () => {
        const { options } = staggerArgs({ from: 'pointer', grid: [3, 2] }, { pointer: { clientX: 50, clientY: 25 }, rects });
        assert.deepEqual(options.grid, [3, 2]);
    });
    it('falls back to the centre without a pointer', () => {
        const { options } = staggerArgs({ from: 'pointer' });
        assert.deepEqual(options, { from: 'center', grid: true });
    });
    it('passes jitter and seed through', () => {
        const { options } = staggerArgs({ from: 'pointer', jitter: 20, seed: 3 }, { pointer: { clientX: 50, clientY: 25 }, rects });
        assert.equal(options.jitter, 20);
        assert.equal(options.seed, 3);
    });
});

describe('pointerOf', () => {
    it('reads mouse and touch events', () => {
        assert.deepEqual(pointerOf({ clientX: 10, clientY: 20, detail: 1 }), { clientX: 10, clientY: 20 });
        assert.deepEqual(pointerOf({ touches: [{ clientX: 5, clientY: 6 }] }), { clientX: 5, clientY: 6 });
        assert.deepEqual(pointerOf({ touches: [], changedTouches: [{ clientX: 7, clientY: 8 }] }), { clientX: 7, clientY: 8 });
    });
    it('null for a keyboard click or no event', () => {
        assert.equal(pointerOf({ clientX: 0, clientY: 0, detail: 0 }), null);
        assert.equal(pointerOf(null), null);
    });
});
