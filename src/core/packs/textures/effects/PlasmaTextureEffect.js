/**
 * @fileoverview PlasmaTextureEffect - Two-colour fBm plasma texture
 *
 * Renders a vivid two-colour plasma field using the same fractional Brownian
 * motion (fBm) value-noise as FluidTextureEffect.  This matches the organic
 * gaseous appearance of the original SVG feTurbulence implementation.
 *
 * The fBm noise value is mapped to independent alpha values for color_a and
 * color_b via sin/cos bands, producing the characteristic interleaved colour
 * structure of classic plasma without the geometric ring artefacts of
 * sin-wave interference formulas.
 *
 * Per-pixel cost: num_octaves calls to _smoothNoise (≈ 3 ops each).
 * At LCARS button sizes this is ≈ 1–3 ms/card — within frame budget.
 *
 * @module core/packs/textures/effects/PlasmaTextureEffect
 */

import { BaseTextureEffect } from './BaseTextureEffect.js';
import { _fbm, parseColorToRgba } from './noise-helpers.js';

/**
 * PlasmaTextureEffect - Vivid alternating two-colour plasma bands
 *
 * @extends BaseTextureEffect
 */
export class PlasmaTextureEffect extends BaseTextureEffect {
    /**
     * @param {object} config
     * @param {string} [config.color_a='rgba(80,0,255,0.9)']   - First plasma colour (RGBA)
     * @param {string} [config.color_b='rgba(255,40,120,0.9)'] - Second plasma colour (RGBA)
     * @param {number} [config.base_frequency=0.012]           - Noise frequency (lower = wider bands)
     * @param {number} [config.num_octaves=3]                  - fBm octave count
     * @param {number} [config.scroll_speed_x=8]               - Horizontal scroll speed (px/s)
     * @param {number} [config.scroll_speed_y=5]               - Vertical scroll speed (px/s)
     * @param {number} [config.speed=1]                        - Global speed multiplier
     * @param {number} [config.opacity=1] - Opacity (0-1)
     */
    constructor(config = {}) {
        super(/** @type {any} */ (config));
        this._colorA  = parseColorToRgba(config.color_a ?? 'rgba(80,0,255,0.9)',  'rgba(80,0,255,0.9)');
        this._colorB  = parseColorToRgba(config.color_b ?? 'rgba(255,40,120,0.9)', 'rgba(255,40,120,0.9)');
        this._freq    = config.base_frequency ?? 0.012;
        this._octaves = config.num_octaves    ?? 3;
        this._speedX  = config.scroll_speed_x ?? 8;
        this._speedY  = config.scroll_speed_y ?? 5;
        this._offsetX = 0;
        this._offsetY = 0;
    }

    update(dt, w, h) {
        super.update(dt, w, h);
        // dt is in milliseconds — convert to seconds for px/s speed values
        const dt_s = dt / 1000;
        const s = this.speed;
        this._offsetX += this._speedX * s * dt_s;
        this._offsetY += this._speedY * s * dt_s;
    }

    /**
     * Ensure the offscreen canvas and ImageData buffer match the current canvas size.
     * @param {number} w
     * @param {number} h
     * @private
     */
    _ensureBuffer(w, h) {
        if (this._bufW === w && this._bufH === h) return;
        this._bufW = w;
        this._bufH = h;
        this._offCanvas        = document.createElement('canvas');
        this._offCanvas.width  = w;
        this._offCanvas.height = h;
        this._offCtx   = this._offCanvas.getContext('2d');
        this._imgData  = this._offCtx.createImageData(w, h);
    }

    /**
     * Render fBm plasma into an ImageData buffer, then blit via drawImage.
     *
     * Uses the same fractional Brownian motion noise as FluidTextureEffect to
     * produce the organic gaseous appearance that matches SVG feTurbulence.
     * The noise value is mapped to two independent alpha channels (via sin/cos
     * bands) which are Porter-Duff composited into each pixel — no Canvas API
     * strings, no per-cell fills, one putImageData + one drawImage per frame.
     *
     * Scroll offsets are negated at the sample site so that positive
     * scroll_speed_x/y moves features rightward/downward.
     */
    _draw(ctx, w, h) {
        const iw = w | 0;
        const ih = h | 0;
        if (iw < 1 || ih < 1) return;

        this._ensureBuffer(iw, ih);

        const data = this._imgData.data;
        const { r: rA, g: gA, b: bA, a: baseA } = this._colorA;
        const { r: rB, g: gB, b: bB, a: baseB } = this._colorB;
        const freq = this._freq;
        const oct  = this._octaves;
        const PIk  = Math.PI * oct; // band-density: more octaves = tighter colour cycling
        // Negate offsets: positive speed scrolls features rightward/downward.
        const ox = -this._offsetX * freq;
        const oy = -this._offsetY * freq;

        for (let cy = 0; cy < ih; cy++) {
            const noiseY = cy * freq + oy;
            for (let cx = 0; cx < iw; cx++) {
                // fBm noise at this pixel — same algorithm as FluidTextureEffect
                const raw    = _fbm(cx * freq + ox, noiseY, oct);
                const n      = (raw + 1) * 0.5; // map [-1,1] → [0,1]

                const alphaA = Math.abs(Math.sin(n * PIk)) * baseA;
                const alphaB = Math.abs(Math.cos(n * PIk)) * baseB;

                // Porter-Duff source-over: color_a and color_b blended by their alphas
                const outA = alphaA + alphaB * (1 - alphaA);
                let rOut = 0, gOut = 0, bOut = 0;
                if (outA > 0.001) {
                    const wa = alphaA * (1 - alphaB);
                    rOut = (rA * wa + rB * alphaB) / outA;
                    gOut = (gA * wa + gB * alphaB) / outA;
                    bOut = (bA * wa + bB * alphaB) / outA;
                }

                const i = (cy * iw + cx) << 2;
                data[i    ] = (rOut + 0.5) | 0;
                data[i + 1] = (gOut + 0.5) | 0;
                data[i + 2] = (bOut + 0.5) | 0;
                data[i + 3] = (outA * 255 + 0.5) | 0;
            }
        }

        this._offCtx.putImageData(this._imgData, 0, 0);
        ctx.drawImage(this._offCanvas, 0, 0);
    }

    updateConfig(cfg) {
        super.updateConfig(cfg);
        if (cfg.color_a        !== undefined) this._colorA  = parseColorToRgba(cfg.color_a, 'rgba(80,0,255,0.9)');
        if (cfg.color_b        !== undefined) this._colorB  = parseColorToRgba(cfg.color_b, 'rgba(255,40,120,0.9)');
        if (cfg.base_frequency !== undefined) this._freq    = cfg.base_frequency;
        if (cfg.num_octaves    !== undefined) this._octaves = cfg.num_octaves;
        if (cfg.scroll_speed_x !== undefined) this._speedX  = cfg.scroll_speed_x;
        if (cfg.scroll_speed_y !== undefined) this._speedY  = cfg.scroll_speed_y;
    }
}
