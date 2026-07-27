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
 * The field is static-and-panning, not continuously changing (the noise
 * function has no time dimension — only the accumulated scroll offset shifts
 * the sampled coordinate), so like ContourFieldEffect it's baked once into a
 * padded offscreen buffer and topped up incrementally each frame (shift +
 * fill only the newly-exposed edge) rather than recomputed at native
 * per-pixel resolution every frame — the previous approach could cost ~14
 * trig calls per pixel per frame with no downsampling knob at all, which at
 * full dashboard-background sizes is the same class of runaway performance
 * bug fixed in ContourFieldEffect.
 *
 * @module core/packs/textures/effects/PlasmaTextureEffect
 */

import { BaseTextureEffect } from './BaseTextureEffect.js';
import { _fbm, parseColorToRgba } from './noise-helpers.js';
import { ColorUtils } from '../../../themes/ColorUtils.js';

/**
 * PlasmaTextureEffect - Vivid alternating two-colour plasma bands
 *
 * @extends BaseTextureEffect
 */
export class PlasmaTextureEffect extends BaseTextureEffect {
    /**
     * Padding (raw px) around the visible canvas in the cached bake buffer.
     * This effect has no downsampling knob (unlike ContourFieldEffect's
     * cell_size), so padding is in raw pixels directly. Only needs to absorb
     * one frame's worth of shift plus slack for an occasional slow frame —
     * steady-state panning is handled by _topUpBake(), not by a big periodic
     * rebake — see ContourFieldEffect.BAKE_PAD_CELLS for the full rationale.
     */
    static BAKE_PAD_PX = 32;

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
        const _r = window.lcards?.core?.themeManager?.resolver;
        const _resolve = (c) => ColorUtils.resolveCssVariable(_r ? _r.resolve(c, c) : c, c);
        this._colorA  = parseColorToRgba(_resolve(config.color_a ?? 'rgba(80,0,255,0.9)'),  'rgba(80,0,255,0.9)');
        this._colorB  = parseColorToRgba(_resolve(config.color_b ?? 'rgba(255,40,120,0.9)'), 'rgba(255,40,120,0.9)');
        this._freq    = config.base_frequency ?? 0.012;
        this._octaves = Math.max(1, Math.min(8, config.num_octaves ?? 3));
        this._speedX  = config.scroll_speed_x ?? 8;
        this._speedY  = config.scroll_speed_y ?? 5;
        this._offsetX = 0;
        this._offsetY = 0;

        // Bake-buffer state — see _bake()/_topUpBake()/_draw() below.
        this._bakeDirty = true;   // forces a bake on the first draw()
        this._visibleW = 0;       // last-seen canvas size (px) — detects resize
        this._visibleH = 0;
        this._bakeOriginX = 0;    // pan (px) at the time of the last bake
        this._bakeOriginY = 0;
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
     * Fill a `w x h` rectangle of `imgData` (the full bake buffer, or a small
     * incremental strip — see _bake()/_topUpBake()) whose top-left corner
     * sits at bake-buffer coordinate `(destX, destY)`, sampling every pixel
     * from its absolute world coordinate `(destX+lx-PAD)-originX`. Because
     * that's a pure function of world coordinate alone, filling the same
     * position at a different time (a fresh bake vs. a top-up strip)
     * reproduces bit-identical values — there's no seam to hide, since
     * nothing is tiled/cut/rejoined.
     * @private
     */
    _fillRegion(imgData, destX, destY, w, h, originX, originY) {
        const PAD = PlasmaTextureEffect.BAKE_PAD_PX;
        const data = imgData.data;
        const { r: rA, g: gA, b: bA, a: baseA } = this._colorA;
        const { r: rB, g: gB, b: bB, a: baseB } = this._colorB;
        const freq = this._freq;
        const oct  = this._octaves;
        const PIk  = Math.PI * oct; // band-density: more octaves = tighter colour cycling

        for (let ly = 0; ly < h; ly++) {
            const worldY = ((destY + ly - PAD) - originY) * freq;
            for (let lx = 0; lx < w; lx++) {
                const worldX = ((destX + lx - PAD) - originX) * freq;

                // fBm noise at this pixel — same algorithm as FluidTextureEffect
                const raw = _fbm(worldX, worldY, oct);
                const n   = (raw + 1) * 0.5; // map [-1,1] → [0,1]

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

                const i = (ly * w + lx) << 2;
                data[i    ] = (rOut + 0.5) | 0;
                data[i + 1] = (gOut + 0.5) | 0;
                data[i + 2] = (bOut + 0.5) | 0;
                data[i + 3] = (outA * 255 + 0.5) | 0;
            }
        }
    }

    /**
     * Full bake: (re)computes the entire padded buffer from scratch. Used for
     * the first-ever draw, a canvas resize, a bake-affecting config change,
     * and as the fallback if a single frame drifts further than the top-up
     * margin can absorb (e.g. the tab was backgrounded and just resumed with
     * a huge deltaTime) — everywhere else, _topUpBake() handles panning far
     * more cheaply.
     * @private
     */
    _bake(w, h, originX, originY) {
        const PAD = PlasmaTextureEffect.BAKE_PAD_PX;
        const bakeW = w + PAD * 2;
        const bakeH = h + PAD * 2;
        this._ensureBuffer(bakeW, bakeH);
        this._fillRegion(this._imgData, 0, 0, bakeW, bakeH, originX, originY);
        this._offCtx.putImageData(this._imgData, 0, 0);
    }

    /**
     * Incremental top-up: shifts the cached bake by however many whole pixels
     * the pan has moved since the last frame (a single native drawImage copy
     * — cheap regardless of shift size) and fills in only the newly exposed
     * sliver(s) at the leading edge(s) with fresh samples. Cost is
     * proportional to how far the field actually moved this frame, not to
     * canvas size.
     * @private
     */
    _topUpBake(w, h, curX, curY) {
        const PAD = PlasmaTextureEffect.BAKE_PAD_PX;
        const bakeW = w + PAD * 2;
        const bakeH = h + PAD * 2;

        const shiftX = Math.trunc(curX - this._bakeOriginX);
        const shiftY = Math.trunc(curY - this._bakeOriginY);
        if (shiftX === 0 && shiftY === 0) return;

        // True pixel-copy shift (not alpha-composited). dest(x,y) must become
        // old(x - shiftX, y - shiftY), which drawImage(source, dx, dy) with
        // dx=shiftX, dy=shiftY realizes directly (dest(x,y)=source(x-dx,y-dy)).
        this._offCtx.globalCompositeOperation = 'copy';
        this._offCtx.drawImage(this._offCanvas, shiftX, shiftY);
        this._offCtx.globalCompositeOperation = 'source-over';

        this._bakeOriginX += shiftX;
        this._bakeOriginY += shiftY;

        // Fill the newly exposed strip(s) — the region 'copy' just cleared to
        // transparent because it fell outside the shifted source image. With
        // dx=shiftX, the vacated range sits on the opposite edge from the
        // shift's own sign (e.g. shiftX>0 vacates [0,shiftX), not the far
        // edge). Filling x then y double-fills one small corner when both
        // axes shifted this frame — harmless, since _fillRegion() is a pure
        // function of world coordinate and just recomputes the same value.
        if (shiftX !== 0) {
            const stripW = Math.min(bakeW, Math.abs(shiftX));
            const stripX = shiftX > 0 ? 0 : bakeW - stripW;
            const strip = this._offCtx.createImageData(stripW, bakeH);
            this._fillRegion(strip, stripX, 0, stripW, bakeH, this._bakeOriginX, this._bakeOriginY);
            this._offCtx.putImageData(strip, stripX, 0);
        }
        if (shiftY !== 0) {
            const stripH = Math.min(bakeH, Math.abs(shiftY));
            const stripY = shiftY > 0 ? 0 : bakeH - stripH;
            const strip = this._offCtx.createImageData(bakeW, stripH);
            this._fillRegion(strip, 0, stripY, bakeW, stripH, this._bakeOriginX, this._bakeOriginY);
            this._offCtx.putImageData(strip, 0, stripY);
        }
    }

    _draw(ctx, w, h) {
        const iw = w | 0;
        const ih = h | 0;
        if (iw < 1 || ih < 1) return;

        const PAD = PlasmaTextureEffect.BAKE_PAD_PX;
        const curX = this._offsetX;
        const curY = this._offsetY;

        const sizeChanged = iw !== this._visibleW || ih !== this._visibleH;

        if (this._bakeDirty || sizeChanged || !this._offCanvas) {
            this._visibleW = iw;
            this._visibleH = ih;
            this._bakeOriginX = curX;
            this._bakeOriginY = curY;
            this._bake(iw, ih, curX, curY);
            this._bakeDirty = false;
        } else if (Math.abs(curX - this._bakeOriginX) > PAD - 1 || Math.abs(curY - this._bakeOriginY) > PAD - 1) {
            // Pan jumped further in one frame than the margin can absorb —
            // fall back to a full rebake for this one frame only.
            this._bakeOriginX = curX;
            this._bakeOriginY = curY;
            this._bake(iw, ih, curX, curY);
        } else {
            this._topUpBake(iw, ih, curX, curY);
        }

        // Fractional (sub-pixel) source offset into the cached bake — NOT
        // rounded — so panning stays continuous frame-to-frame.
        const srcX = PAD - (curX - this._bakeOriginX);
        const srcY = PAD - (curY - this._bakeOriginY);

        // BaseTextureEffect.draw() already set ctx.globalAlpha = this.opacity
        // before calling _draw(), so the blit below picks up live opacity
        // automatically — nothing extra needed here.
        ctx.drawImage(this._offCanvas, srcX, srcY, iw, ih, 0, 0, iw, ih);
    }

    updateConfig(cfg) {
        super.updateConfig(cfg);
        const _r = window.lcards?.core?.themeManager?.resolver;
        const _resolve = (c) => ColorUtils.resolveCssVariable(_r ? _r.resolve(c, c) : c, c);

        // Fields that change the BAKED appearance require a re-bake to take
        // effect immediately rather than waiting for the next scroll-drift
        // top-up. scroll_speed_x/y don't — they only change how fast we pan
        // through the same continuous field.
        let bakeAffected = false;
        if (cfg.color_a        !== undefined) { this._colorA  = parseColorToRgba(_resolve(cfg.color_a), 'rgba(80,0,255,0.9)'); bakeAffected = true; }
        if (cfg.color_b        !== undefined) { this._colorB  = parseColorToRgba(_resolve(cfg.color_b), 'rgba(255,40,120,0.9)'); bakeAffected = true; }
        if (cfg.base_frequency !== undefined) { this._freq    = cfg.base_frequency; bakeAffected = true; }
        if (cfg.num_octaves    !== undefined) { this._octaves = Math.max(1, Math.min(8, cfg.num_octaves)); bakeAffected = true; }
        if (cfg.scroll_speed_x !== undefined) this._speedX  = cfg.scroll_speed_x;
        if (cfg.scroll_speed_y !== undefined) this._speedY  = cfg.scroll_speed_y;
        if (bakeAffected) this._bakeDirty = true;
    }
}
