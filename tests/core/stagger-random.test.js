/**
 * Stagger presets hand anime.js v4 the options their docs promise (staggerArgs maps
 * the LCARdS aliases), and the random presets are reproducible under a seed and
 * draw a new pattern on each loop.
 */
import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { installJsdom } from '../helpers/jsdom-env.js';

let staggerArgs, presetRandom, getAnimationPreset, restore;

before(async () => {
    ({ restore } = installJsdom());
    ({ staggerArgs, presetRandom } = await import('../../src/utils/lcards-anim-helpers.js'));
    const { registerBuiltinAnimationPresets } = await import('../../src/core/packs/animations/presets/index.js');
    registerBuiltinAnimationPresets();
    ({ getAnimationPreset } = await import('../../src/core/animation/presets.js'));
});
after(() => restore?.());

describe('staggerArgs', () => {
    const cases = [
        ['start is first', { from: 'start' }, { from: 'first' }],
        ['end is last', { from: 'end' }, { from: 'last' }],
        ['edges is centre, reversed', { from: 'edges' }, { from: 'center', reversed: true }],
        ['edges reversed is centre outward', { from: 'edges', reversed: true }, { from: 'center' }],
        ['legacy direction reverse', { direction: 'reverse' }, { reversed: true }],
        ['direction is never passed', { direction: 'normal' }, {}],
        ['unknown from falls back to first', { from: 'middle' }, { from: 'first' }],
        ['axis aliases', { axis: 'row', grid: true }, { axis: 'x', grid: true }],
        ['column is y', { axis: 'column' }, { axis: 'y' }],
        ['v4 extras pass through', { jitter: [0, 40], seed: 3, start: 200, total: 9, grid: [3, 3], from: [0.5, 0] },
            { jitter: [0, 40], seed: 3, start: 200, total: 9, grid: [3, 3], from: [0.5, 0] }],
    ];
    for (const [name, marker, expected] of cases) {
        it(name, () => {
            assert.deepEqual(staggerArgs({ _stagger: true, value: 50, ...marker }).options, expected);
        });
    }

    it('keeps the value, a [start, end] range included, and defaults to 100', () => {
        assert.equal(staggerArgs({ _stagger: true }).value, 100);
        assert.deepEqual(staggerArgs({ _stagger: true, value: [0, 500] }).value, [0, 500]);
    });

    it('resolves the ease through resolveEasing', () => {
        assert.equal(staggerArgs({ _stagger: true, ease: 'outQuad' }).options.ease, 'outQuad');
    });
});

describe('stagger presets', () => {
    const marker = (name, params) => getAnimationPreset(name)({ params }).anime.delay;

    it('stagger-grid turns a [col, row] cell into the fractions anime.js reads', () => {
        assert.deepEqual(marker('stagger-grid', { grid: [5, 3], from: [4, 1] }).from, [1, 0.5]);
        assert.deepEqual(marker('stagger-grid', { grid: [1, 3], from: [0, 2] }).from, [0, 1]);
    });

    it('stagger-grid defaults to first and passes the extras', () => {
        const d = marker('stagger-grid', { grid: [3, 3], axis: 'row', reversed: true, jitter: 20, seed: 1 });
        assert.equal(d.from, 'first');
        assert.deepEqual([d.axis, d.reversed, d.jitter, d.seed], ['row', true, 20, 1]);
    });

    it('stagger-wave reverse sets reversed (the old direction option did nothing)', () => {
        assert.equal(marker('stagger-wave', { direction: 'reverse' }).reversed, true);
        assert.equal(marker('stagger-wave', { reversed: true }).reversed, true);
        assert.equal(marker('stagger-wave', {}).reversed, undefined);
    });

    it('stagger-radial measures real positions (grid: true) and needs no second marker', () => {
        const d = marker('stagger-radial', { from: [0, 0] });
        assert.deepEqual([d._stagger, d.grid, d._radial], [true, true, undefined]);
    });

    it('cascade uses the marker, so multiple targets take one batched call', () => {
        assert.deepEqual(marker('cascade', { stagger: 80 }), { _stagger: true, value: 80 });
    });

    it('cascade-color staggers with a marker; column order uses layout positions', () => {
        assert.deepEqual(marker('cascade-color', { stagger_from: 'last', stagger_delay: 60 }),
            { _stagger: true, value: 60, from: 'last' });
        assert.deepEqual(marker('cascade-color', { stagger_from: 'first', axis: 'column' }),
            { _stagger: true, value: 100, from: 'first', grid: true, axis: 'column' });
    });
});

describe('random presets', () => {
    /** Evaluate every function-based keyframe value of a preset result once. */
    const draw = (result) => result.anime.keyframes.map((kf) =>
        Object.fromEntries(Object.entries(kf).map(([k, v]) => [k, typeof v === 'function' ? v() : v])));

    it('presetRandom is reproducible with a seed and stays between 0 and 1', () => {
        const a = presetRandom(42);
        const b = presetRandom(42);
        const seqA = Array.from({ length: 20 }, () => a());
        assert.deepEqual(seqA, Array.from({ length: 20 }, () => b()));
        assert.ok(seqA.every((v) => v >= 0 && v <= 1));
        assert.ok(new Set(seqA).size > 10, 'not constant');
        assert.equal(presetRandom(undefined), Math.random);
    });

    for (const name of ['flicker', 'glitch']) {
        it(`${name}: the same seed gives the same pattern, each draw differs (a loop re-rolls)`, () => {
            const one = getAnimationPreset(name)({ params: { seed: 9 } });
            const two = getAnimationPreset(name)({ params: { seed: 9 } });
            const first = draw(one);
            assert.deepEqual(first, draw(two));
            assert.notDeepEqual(draw(one), first, 'second draw is a new pattern');
            assert.equal(typeof one.anime.onLoop, 'function');
        });
    }

    it('chaos: seeded values repeat and it re-rolls on loop', () => {
        const values = (r) => [r.anime.duration(), r.anime.translateX(), r.anime.rotate()];
        const a = getAnimationPreset('chaos')({ params: { seed: 5 } });
        const b = getAnimationPreset('chaos')({ params: { seed: 5 } });
        assert.deepEqual(values(a), values(b));
        let refreshed = 0;
        a.anime.onLoop({ refresh: () => { refreshed++; } });
        assert.equal(refreshed, 1);
    });
});
