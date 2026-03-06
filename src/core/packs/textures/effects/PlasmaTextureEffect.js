/**
 * @fileoverview PlasmaTextureEffect - Two-colour Perlin plasma texture
 *
 * Renders a vivid alternating two-colour plasma field using a shared fBm
 * value-noise source.  For each grid cell the noise value is mapped through
 * sin/cos to derive independent alpha values for color_a and color_b,
 * producing the characteristic interleaved colour bands of classic plasma —
 * completely independent of NebulaEffect.
 *
 * @module core/packs/textures/effects/PlasmaTextureEffect
 */

import { BaseTextureEffect } from './BaseTextureEffect.js';

// ---------------------------------------------------------------------------
// Inline value-noise helpers (shared with FluidTextureEffect pattern)
// ---------------------------------------------------------------------------

function _hash(ix, iy) {
    return (Math.sin(ix * 127.1 + iy * 311.7) * 43758.5453) % 1 * 2;
}

function _smoothNoise(x, y) {
    const ix = Math.floor(x);
    const iy = Math.floor(y);
    const fx = x - ix;
    const fy = y - iy;
    const ux = fx * fx * (3 - 2 * fx);
    const uy = fy * fy * (3 - 2 * fy);
    const a  = _hash(ix,     iy);
    const b  = _hash(ix + 1, iy);
    const c  = _hash(ix,     iy + 1);
    const d  = _hash(ix + 1, iy + 1);
    return a + (b - a) * ux + (c - a) * uy + (a + d - b - c) * ux * uy;
}

function _fbm(x, y, octaves) {
    let value = 0;
    let amplitude = 0.5;
    let frequency = 1;
    for (let i = 0; i < octaves; i++) {
        value     += amplitude * _smoothNoise(x * frequency, y * frequency);
        amplitude *= 0.5;
        frequency *= 2;
    }
    return value;
}

function _parseRgba(str) {
    const m = str.match(/rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)(?:\s*,\s*([\d.]+))?\s*\)/);
    if (!m) return { r: 128, g: 0, b: 255, a: 0.9 };
    return { r: +m[1], g: +m[2], b: +m[3], a: m[4] !== undefined ? +m[4] : 1 };
}

// ---------------------------------------------------------------------------

const CELL = 4; // px — grid tile size

/**
 * PlasmaTextureEffect - Vivid alternating two-colour plasma bands
 *
 * @extends BaseTextureEffect
 */
export class PlasmaTextureEffect extends BaseTextureEffect {
    /**
     * @param {Object} config
     * @param {string} [config.color_a='rgba(80,0,255,0.9)']   - First plasma colour (RGBA)
     * @param {string} [config.color_b='rgba(255,40,120,0.9)'] - Second plasma colour (RGBA)
     * @param {number} [config.base_frequency=0.012]           - Noise frequency (lower = wider bands)
     * @param {number} [config.num_octaves=3]                  - fBm octave count
     * @param {number} [config.scroll_speed_x=8]               - Horizontal scroll speed (px/s)
     * @param {number} [config.scroll_speed_y=5]               - Vertical scroll speed (px/s)
     * @param {number} [config.speed=1]                        - Global speed multiplier
     */
    constructor(config = {}) {
        super(config);
        this._colorA  = _parseRgba(config.color_a ?? 'rgba(80,0,255,0.9)');
        this._colorB  = _parseRgba(config.color_b ?? 'rgba(255,40,120,0.9)');
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
     * Render combined plasma bands into an ImageData buffer, then blit via drawImage.
     *
     * The original implementation called fillStyle (string) + fillRect twice per cell
     * (once per colour), causing N×M×2 string allocations + canvas state flushes per
     * frame.  This replacement:
     *   1. Pre-composites color_a and color_b using Porter-Duff source-over directly
     *      into a Uint8ClampedArray — no strings, no per-cell canvas API calls.
     *   2. Flushes via one putImageData to an offscreen canvas.
     *   3. blits via drawImage (clip-safe; putImageData ignores the clip path).
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
        const ox   = this._offsetX * freq;
        const oy   = this._offsetY * freq;
        const k    = oct; // band-density constant
        const PIk  = Math.PI * k;

        for (let cy = 0; cy < ih; cy += CELL) {
            const yEnd   = Math.min(cy + CELL, ih);
            const noiseY = cy * freq + oy;
            for (let cx = 0; cx < iw; cx += CELL) {
                const raw    = _fbm(cx * freq + ox, noiseY, oct);
                const n      = (raw + 1) * 0.5;
                const alphaA = Math.abs(Math.sin(n * PIk)) * baseA;
                const alphaB = Math.abs(Math.cos(n * PIk)) * baseB;

                // Porter-Duff source-over: color_b drawn over color_a.
                // outAlpha = alphaB + alphaA * (1 − alphaB)
                const outA = alphaA + alphaB * (1 - alphaA);
                let rOut = 0, gOut = 0, bOut = 0;
                if (outA > 0.001) {
                    const wa = alphaA * (1 - alphaB);
                    rOut = (rA * wa + rB * alphaB) / outA;
                    gOut = (gA * wa + gB * alphaB) / outA;
                    bOut = (bA * wa + bB * alphaB) / outA;
                }

                const aInt = (outA * 255 + 0.5) | 0;
                const rInt = (rOut  + 0.5) | 0;
                const gInt = (gOut  + 0.5) | 0;
                const bInt = (bOut  + 0.5) | 0;

                const xEnd = Math.min(cx + CELL, iw);
                for (let py = cy; py < yEnd; py++) {
                    let i = (py * iw + cx) << 2;
                    for (let px = cx; px < xEnd; px++, i += 4) {
                        data[i    ] = rInt;
                        data[i + 1] = gInt;
                        data[i + 2] = bInt;
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
        if (cfg.color_a        !== undefined) this._colorA  = _parseRgba(cfg.color_a);
        if (cfg.color_b        !== undefined) this._colorB  = _parseRgba(cfg.color_b);
        if (cfg.base_frequency !== undefined) this._freq    = cfg.base_frequency;
        if (cfg.num_octaves    !== undefined) this._octaves = cfg.num_octaves;
        if (cfg.scroll_speed_x !== undefined) this._speedX  = cfg.scroll_speed_x;
        if (cfg.scroll_speed_y !== undefined) this._speedY  = cfg.scroll_speed_y;
    }
}
