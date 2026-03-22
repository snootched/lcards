/**
 * @fileoverview FluidTextureEffect - Canvas fluid noise-field texture
 *
 * Renders a continuously scrolling fBm (fractional Brownian motion) Perlin-style
 * value-noise field inside the shape boundary.  Each frame the noise offset
 * advances, producing a seamlessly morphing colour-wash — similar to the old
 * SVG feTurbulence/feColorMatrix look, without any dependency on NebulaEffect.
 *
 * @module core/packs/textures/effects/FluidTextureEffect
 */

import { BaseTextureEffect } from './BaseTextureEffect.js';
import { _fbm, parseColorToRgba } from './noise-helpers.js';

// ---------------------------------------------------------------------------

const CELL = 4; // px — grid tile size (performance vs quality trade-off)

/**
 * FluidTextureEffect - Perlin fBm noise colour-wash
 *
 * @extends BaseTextureEffect
 */
export class FluidTextureEffect extends BaseTextureEffect {
    /**
     * @param {object} config
     * @param {string} [config.color='rgba(100,180,255,0.8)'] - Fill colour (RGBA)
     * @param {number} [config.base_frequency=0.010]          - Noise frequency (lower = larger features)
     * @param {number} [config.num_octaves=4]                 - fBm octave count
     * @param {number} [config.scroll_speed_x=7]              - Horizontal scroll speed (px/s)
     * @param {number} [config.scroll_speed_y=10]             - Vertical scroll speed (px/s)
     * @param {number} [config.speed=1]                       - Global speed multiplier
     * @param {number} [config.opacity=1] - Opacity (0-1)
     */
    constructor(config = {}) {
        super(/** @type {any} */ (config));
        this._color    = parseColorToRgba(config.color ?? 'rgba(100,180,255,0.8)', 'rgba(100,180,255,0.8)');
        this._freq     = config.base_frequency   ?? 0.010;
        this._octaves  = config.num_octaves      ?? 4;
        this._speedX   = config.scroll_speed_x   ?? 7;
        this._speedY   = config.scroll_speed_y   ?? 10;
        this._offsetX  = 0;
        this._offsetY  = 0;
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
     * Reallocates only when dimensions change.
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
     * Render the noise field to an ImageData buffer and blit to the clipped main ctx.
     *
     * Instead of N×M individual `fillStyle` string assignments + `fillRect` calls
     * (which cause massive GC pressure from per-cell string allocations and force
     * the canvas engine to parse a color string on every cell), we:
     *   1. Write RGBA integer bytes directly into a pre-allocated Uint8ClampedArray.
     *   2. Flush the buffer to an offscreen canvas via a single `putImageData` call.
     *   3. Composite the offscreen canvas onto the clipped main ctx via `drawImage`.
     *      (`putImageData` ignores the clip path; `drawImage` respects it — this is why
     *      the two-step offscreen approach is required.)
     */
    _draw(ctx, w, h) {
        const iw = w | 0;
        const ih = h | 0;
        if (iw < 1 || ih < 1) return;

        this._ensureBuffer(iw, ih);

        const data  = this._imgData.data;
        const { r, g, b, a: baseAlpha } = this._color;
        // Negate offsets: positive scroll_speed_x/y scrolls features rightward/downward
        // (without negation, increasing sample coordinate moves the visible features left).
        const freq  = this._freq;
        const oct   = this._octaves;
        const ox    = -this._offsetX * freq;
        const oy    = -this._offsetY * freq;
        const a255  = baseAlpha * 255;

        for (let cy = 0; cy < ih; cy += CELL) {
            const yEnd   = Math.min(cy + CELL, ih);
            const noiseY = cy * freq + oy;
            for (let cx = 0; cx < iw; cx += CELL) {
                const n    = _fbm(cx * freq + ox, noiseY, oct);
                // Fast integer round; Uint8ClampedArray clamps to [0,255] automatically
                const aInt = ((n + 1) * 0.5 * a255 + 0.5) | 0;
                const xEnd = Math.min(cx + CELL, iw);
                for (let py = cy; py < yEnd; py++) {
                    let i = (py * iw + cx) << 2;
                    for (let px = cx; px < xEnd; px++, i += 4) {
                        data[i    ] = r;
                        data[i + 1] = g;
                        data[i + 2] = b;
                        data[i + 3] = aInt;
                    }
                }
            }
        }

        this._offCtx.putImageData(this._imgData, 0, 0);
        ctx.drawImage(this._offCanvas, 0, 0);
    }

    updateConfig(cfg) {
        super.updateConfig(cfg);
        if (cfg.color          !== undefined) this._color   = parseColorToRgba(cfg.color, 'rgba(100,180,255,0.8)');
        if (cfg.base_frequency !== undefined) this._freq    = cfg.base_frequency;
        if (cfg.num_octaves    !== undefined) this._octaves = cfg.num_octaves;
        if (cfg.scroll_speed_x !== undefined) this._speedX  = cfg.scroll_speed_x;
        if (cfg.scroll_speed_y !== undefined) this._speedY  = cfg.scroll_speed_y;
    }
}
