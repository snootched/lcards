/**
 * @fileoverview StaticEffect — TV static / noise screen effect.
 *
 * Draws chunky random pixel noise on a low-resolution canvas scaled up with
 * `image-rendering: pixelated`.  Optionally tinted with a base colour.
 *
 * Adapted from the `effect_static` alert-transition implementation in
 * `core/themes/alertTransitions.js`.  Extracted here so the same visual is
 * available to the `ScreenEffectManager` preset registry for use outside the
 * alert-transition pipeline.
 *
 * @module core/screen-effects/effects/StaticEffect
 */

import { ColorUtils } from '../../themes/ColorUtils.js';
import { prefersReducedMotion } from '../../../utils/reduced-motion.js';

/**
 * TV-static noise effect for a `<canvas>` slot element.
 *
 * @param {HTMLCanvasElement} canvas - The managed canvas slot element.
 * @param {Object} params
 * @param {number}  [params.opacity=0.55]   - Overall canvas opacity (0–1).
 * @param {number}  [params.scale=4]        - Down-sample factor: higher = chunkier pixels.
 * @param {string}  [params.color='#ffffff'] - Base tint colour (hex).
 * @param {number}  [params.tintStrength=0] - 0–1 blend toward `color` per pixel.
 * @returns {() => void} Cleanup function that stops the rAF loop.
 */
export function StaticEffect(canvas, params = {}) {
    const {
        opacity     = 0.55,
        scale       = 4,
        color       = '#ffffff',
        tintStrength = 0,
    } = params;

    canvas.style.opacity        = String(opacity);
    canvas.style.imageRendering = 'pixelated';
    canvas.style.mixBlendMode   = 'overlay';

    // Parse the tint colour into RGB components for per-pixel tinting.
    // ColorUtils._parseColor() accepts hex, rgb()/rgba(), and named CSS colors
    // (e.g. 'cornflowerblue') — by the time params reach here they have already
    // been through ScreenEffectManager's var()/theme-token resolution, so this
    // only needs to handle the final concrete color string.
    const [tr, tg, tb] = ColorUtils._parseColor(color) ?? [255, 255, 255];

    let rafId = null;
    let running = true;

    /** Resize canvas to low-res dimensions based on current slot size and scale. */
    function _syncSize() {
        const w = Math.max(1, Math.floor((canvas.parentElement?.offsetWidth  || window.innerWidth)  / scale));
        const h = Math.max(1, Math.floor((canvas.parentElement?.offsetHeight || window.innerHeight) / scale));
        if (canvas.width !== w || canvas.height !== h) {
            canvas.width  = w;
            canvas.height = h;
        }
    }

    // The noise is generated once into a buffer twice the canvas size (in each
    // direction); every frame copies a window of it at a random offset, which reads
    // as fresh static. Generating 100,000 random pixels every frame cost about
    // 250 ms of main thread a second at a quarter CPU speed (2026-11-17).
    /** @type {HTMLCanvasElement|null} */
    let noise = null;

    /** Fill the noise buffer for the current canvas size. */
    function _makeNoise() {
        const w = canvas.width * 2;
        const h = canvas.height * 2;
        if (!noise) noise = document.createElement('canvas');
        noise.width = w;
        noise.height = h;
        const nctx = /** @type {CanvasRenderingContext2D} */ (noise.getContext('2d'));
        const img = nctx.createImageData(w, h);
        const d   = img.data;
        for (let i = 0; i < d.length; i += 4) {
            const v    = Math.random() * 255;
            d[i]       = v + (tr - v) * tintStrength;
            d[i + 1]   = v + (tg - v) * tintStrength;
            d[i + 2]   = v + (tb - v) * tintStrength;
            d[i + 3]   = 200;
        }
        nctx.putImageData(img, 0, 0);
    }

    function tick() {
        if (!running) return;
        const before = `${canvas.width}x${canvas.height}`;
        _syncSize();
        if (!noise || `${canvas.width}x${canvas.height}` !== before) _makeNoise();

        const ctx = /** @type {CanvasRenderingContext2D} */ (canvas.getContext('2d'));
        const w = canvas.width;
        const h = canvas.height;
        const sx = Math.floor(Math.random() * w);
        const sy = Math.floor(Math.random() * h);
        ctx.clearRect(0, 0, w, h);
        ctx.drawImage(/** @type {HTMLCanvasElement} */ (noise), sx, sy, w, h, 0, 0, w, h);
        if (prefersReducedMotion()) return; // reduced motion: hold this frame
        rafId = requestAnimationFrame(tick);
    }

    rafId = requestAnimationFrame(tick);

    return () => {
        running = false;
        if (rafId !== null) cancelAnimationFrame(rafId);
        noise = null;
        // Reset canvas styles
        canvas.style.opacity        = '';
        canvas.style.imageRendering = '';
        canvas.style.mixBlendMode   = '';
    };
}
