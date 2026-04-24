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

    // Parse hex colour into RGB components for per-pixel tinting.
    // Use isNaN-safe parsing so that a component of 0 (e.g. #000000) is not
    // misread as 255 by the || operator (parseInt('00',16) === 0 which is falsy).
    const hex = color.replace('#', '');
    const _h  = (s) => { const v = parseInt(s, 16); return isNaN(v) ? 255 : v; };
    const tr  = _h(hex.slice(0, 2));
    const tg  = _h(hex.slice(2, 4));
    const tb  = _h(hex.slice(4, 6));

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

    function tick() {
        if (!running) return;
        _syncSize();

        const ctx = canvas.getContext('2d');
        const img = ctx.createImageData(canvas.width, canvas.height);
        const d   = img.data;

        for (let i = 0; i < d.length; i += 4) {
            const v    = Math.random() * 255;
            d[i]       = v + (tr - v) * tintStrength;
            d[i + 1]   = v + (tg - v) * tintStrength;
            d[i + 2]   = v + (tb - v) * tintStrength;
            d[i + 3]   = 200;
        }
        ctx.putImageData(img, 0, 0);
        rafId = requestAnimationFrame(tick);
    }

    rafId = requestAnimationFrame(tick);

    return () => {
        running = false;
        if (rafId !== null) cancelAnimationFrame(rafId);
        // Reset canvas styles
        canvas.style.opacity        = '';
        canvas.style.imageRendering = '';
        canvas.style.mixBlendMode   = '';
    };
}
