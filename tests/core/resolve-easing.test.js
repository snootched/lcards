/**
 * resolveEasing() against the real animejs: every config type must produce an
 * ease anime.js can use. The generators (cubicBezier, steps, linear, irregular)
 * are top-level animejs exports, not members of anime.eases; calling them via
 * eases used to throw (or, for linear, return the plain curve) and fall back
 * to linear silently.
 */
import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { installJsdom } from '../helpers/jsdom-env.js';

let env;
let anime;
let resolveEasing;
let getResolvedEasing;

before(async () => {
    // animejs needs a document once `window` exists (the test shims define it)
    env = installJsdom();
    anime = await import('animejs');
    ({ resolveEasing, getResolvedEasing } = await import('../../src/utils/lcards-anim-helpers.js'));
    // Same shape as window.lcards.anim in src/lcards-main.js
    window.lcards = window.lcards || {};
    window.lcards.anim = {
        spring: anime.spring,
        eases: anime.eases,
        cubicBezier: anime.cubicBezier,
        steps: anime.steps,
        linear: anime.linear,
        irregular: anime.irregular,
    };
});

after(() => {
    delete window.lcards?.anim;
    env?.restore();
});

const approx = (actual, expected, eps = 1e-3) =>
    assert.ok(Math.abs(actual - expected) < eps, `expected ~${expected}, got ${actual}`);

describe('resolveEasing', () => {
    it('passes named curves through as strings', () => {
        assert.equal(resolveEasing('inOutQuad'), 'inOutQuad');
        assert.equal(resolveEasing('linear'), 'linear');
        assert.equal(resolveEasing(undefined), 'linear');
    });

    it('builds parametric power, back and elastic curves', () => {
        for (const type of ['in', 'out', 'inOut', 'outIn', 'powerIn', 'inBack', 'outBack',
            'inOutBack', 'outInBack', 'inElastic', 'outElastic', 'inOutElastic', 'outInElastic']) {
            const ease = resolveEasing({ type, params: {} });
            assert.equal(typeof ease, 'function', type);
            approx(ease(0), 0);
            approx(ease(1), 1);
        }
    });

    it('cubicBezier uses the generator', () => {
        const ease = resolveEasing({ type: 'cubicBezier', params: {} });
        assert.equal(typeof ease, 'function');
        approx(ease(0.5), 0.8024, 1e-3);
        approx(resolveEasing({ type: 'cubicBezier', params: { x1: 0, y1: 0, x2: 1, y2: 1 } })(0.3), 0.3);
    });

    it('steps uses the generator', () => {
        const ease = resolveEasing({ type: 'steps', params: { steps: 4 } });
        assert.equal(ease(0.5), 0.5);
        assert.equal(ease(0.3), 0.25);
    });

    it('linear with points uses the generator, not the plain curve', () => {
        const ease = resolveEasing({ type: 'linear', params: { points: [0, 0.25, 1] } });
        approx(ease(0.5), 0.25);
    });

    it('irregular stays within the 0..1 range and ends at 1', () => {
        const ease = resolveEasing({ type: 'irregular', params: { steps: 8, randomness: 1 } });
        assert.equal(typeof ease, 'function');
        for (let t = 0; t <= 1; t += 0.1) {
            const v = ease(t);
            assert.ok(v >= 0 && v <= 1, `irregular(${t}) = ${v}`);
        }
        approx(ease(1), 1);
    });

    it('spring returns a Spring anime.js accepts as an ease', () => {
        const spring = resolveEasing({ type: 'spring', params: { stiffness: 150, damping: 15 } });
        assert.equal(typeof spring.ease, 'function');
    });

    it('resolves a bare generator name with default params', () => {
        approx(resolveEasing('cubicBezier')(0.5), 0.8024, 1e-3);
        assert.equal(resolveEasing('steps')(0.55), 0.5);
        assert.equal(typeof resolveEasing('irregular'), 'function');
        assert.equal(typeof resolveEasing('spring').ease, 'function');
    });

    it('evaluates a generator call written as a string', () => {
        assert.equal(resolveEasing('steps(4)')(0.5), 0.5);
        approx(resolveEasing('cubicBezier(0.25, 0.1, 0.25, 1)')(0.5), 0.8024, 1e-3);
        assert.equal(typeof resolveEasing('spring({ bounce: 0.3 })').ease, 'function');
        assert.equal(resolveEasing('linear'), 'linear');
    });

    it('custom evaluates easing-editor expressions', () => {
        const custom = (customString) => resolveEasing({ type: 'custom', params: { customString } });
        assert.equal(typeof custom('spring({ bounce: 0.4, duration: 500 })').ease, 'function');
        approx(custom('cubicBezier(0.25, 0.1, 0.25, 1)')(0.5), 0.8024, 1e-3);
        assert.equal(custom("'steps(4)'")(0.5), 0.5);
        approx(custom('linear(0, 0.25, 1)')(0.5), 0.25);
        assert.equal(custom('outExpo'), 'outExpo');
    });

    it('custom falls back to linear on bad input', () => {
        const custom = (customString) => resolveEasing({ type: 'custom', params: { customString } });
        assert.equal(custom(''), 'linear');
        assert.equal(custom('42'), 'linear');
        assert.equal(custom('steps('), 'linear');
        assert.equal(resolveEasing({ type: 'custom', params: {} }), 'linear');
    });

    it('getResolvedEasing keeps an ease animateElement already resolved', () => {
        const resolved = resolveEasing({ type: 'steps', params: { steps: 4 } });
        assert.equal(getResolvedEasing({ ease: resolved, ease_params: { steps: 4 } }), resolved);
        assert.equal(getResolvedEasing({ ease: 'steps', ease_params: { steps: 2 } })(0.6), 0.5);
        assert.equal(getResolvedEasing({ ease: 'outQuad' }), 'outQuad');
    });
});
