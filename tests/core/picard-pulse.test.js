/**
 * The Picard slider's indicator lights pulse with a CSS opacity animation, not SVG
 * <animate>: SMIL runs on the main thread and repainted every gauge every frame
 * (36 lights: 36 ms/s of main thread, 129 ms/s at a quarter CPU speed; the CSS
 * animation about 1 ms/s, on the compositor). Measured 2026-11-17.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import picard, { pulseStyle } from '../../src/core/packs/components/sliders/picard.js';

const colors = new Proxy({}, { get: () => '#888888' });
const render = (/** @type {any} */ config) => picard.render({ width: 120, height: 400, colors, config, style: {} });

/** @param {boolean} reduced */
function withReducedMotion(reduced, /** @type {() => void} */ fn) {
    const saved = window.matchMedia;
    window.matchMedia = /** @type {any} */ (() => ({ matches: reduced, addEventListener() {}, removeEventListener() {} }));
    try { fn(); } finally { window.matchMedia = saved; }
}

test('both Picard shapes pulse their lights with the CSS animation, staggered', () => {
    withReducedMotion(false, () => {
        for (const config of [{ shape: 'column' }, {}]) {
            const svg = render(config);
            assert.ok(!svg.includes('<animate'), 'no SMIL');
            const pulses = svg.match(/animation: lcards-slider-pulse [^"]*/g) ?? [];
            assert.equal(pulses.length, 3, JSON.stringify(config));
            assert.deepEqual(pulses, [
                'animation: lcards-slider-pulse 2s linear 0s infinite',
                'animation: lcards-slider-pulse 2s linear 0.667s infinite',
                'animation: lcards-slider-pulse 2s linear 1.333s infinite',
            ]);
        }
    });
});

test('no pulse under reduced motion or with show_animation: false', () => {
    withReducedMotion(true, () => assert.ok(!render({ shape: 'column' }).includes('lcards-slider-pulse')));
    withReducedMotion(false, () => assert.ok(!render({ shape: 'column', show_animation: false }).includes('lcards-slider-pulse')));
});

test('only numbers reach the style attribute', () => {
    withReducedMotion(false, () => {
        assert.equal(pulseStyle(/** @type {any} */ ('3"; background: url(x)'), 0), 'style="animation: lcards-slider-pulse 2s linear 0s infinite"');
        assert.equal(pulseStyle(1.5, 0.5), 'style="animation: lcards-slider-pulse 1.5s linear 0.5s infinite"');
    });
});
