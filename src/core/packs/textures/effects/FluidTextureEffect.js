/**
 * @fileoverview FluidTextureEffect - Canvas fluid noise-field texture
 *
 * Renders a continuously scrolling fBm (fractional Brownian motion) Perlin-style
 * value-noise field inside the shape boundary.  Each frame the noise offset
 * advances, producing a seamlessly morphing colour-wash — similar to the old
 * SVG feTurbulence/feColorMatrix look, without any dependency on NebulaEffect.
 *
 * The field is static-and-panning, not continuously changing (the noise
 * function has no time dimension — only the accumulated scroll offset shifts
 * the sampled coordinate), so like ContourFieldEffect/PlasmaTextureEffect it's
 * baked once into a padded offscreen buffer and topped up incrementally each
 * frame (shift + fill only the newly-exposed edge) rather than fully
 * recomputed every frame.
 *
 * @module core/packs/textures/effects/FluidTextureEffect
 */

import { BaseTextureEffect } from './BaseTextureEffect.js';
import { _fbm, parseColorToRgba } from './noise-helpers.js';
import { ColorUtils } from '../../../themes/ColorUtils.js';

// ---------------------------------------------------------------------------

const CELL = 4; // px — grid tile size (performance vs quality trade-off)

/**
 * FluidTextureEffect - Perlin fBm noise colour-wash
 *
 * @extends BaseTextureEffect
 */
export class FluidTextureEffect extends BaseTextureEffect {
    /**
     * Padding (raw px) around the visible canvas in the cached bake buffer —
     * see ContourFieldEffect.BAKE_PAD_CELLS for the full rationale (steady-
     * state panning is handled by _topUpBake(), not a big periodic rebake, so
     * this only needs to absorb one frame's worth of shift plus slack).
     */
    static BAKE_PAD_PX = 32;

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
        const _r = window.lcards?.core?.themeManager?.resolver;
        const _resolve = (c) => ColorUtils.resolveCssVariable(_r ? _r.resolve(c, c) : c, c);
        this._color    = parseColorToRgba(_resolve(config.color ?? 'rgba(100,180,255,0.8)'), 'rgba(100,180,255,0.8)');
        this._freq     = config.base_frequency   ?? 0.010;
        this._octaves  = Math.max(1, Math.min(8, config.num_octaves ?? 4));
        this._speedX   = config.scroll_speed_x   ?? 7;
        this._speedY   = config.scroll_speed_y   ?? 10;
        this._offsetX  = 0;
        this._offsetY  = 0;

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
     * Fill a `w x h` rectangle of `imgData` (the full bake buffer, or a small
     * incremental strip — see _bake()/_topUpBake()) whose top-left corner
     * sits at bake-buffer coordinate `(destX, destY)`. Noise is sampled once
     * per CELLxCELL block (matching the original per-canvas implementation's
     * cost profile) and replicated across it, flat — but the block grid is
     * quantized against the ABSOLUTE world pixel coordinate
     * `(destX+lx-PAD)-originX`, not against this call's own local (0,0). That
     * absolute anchoring is what keeps a top-up strip's blocks aligned with
     * the rest of the buffer instead of landing out of phase at the seam
     * (the one correctness risk this effect has that ContourField/Plasma's
     * continuous per-pixel sampling doesn't).
     * @private
     */
    _fillRegion(imgData, destX, destY, w, h, originX, originY) {
        const PAD = FluidTextureEffect.BAKE_PAD_PX;
        const data = imgData.data;
        const { r, g, b, a: baseAlpha } = this._color;
        const freq = this._freq;
        const oct  = this._octaves;
        const a255 = baseAlpha * 255;

        const worldOriginX = destX - PAD - originX;
        const worldOriginY = destY - PAD - originY;

        for (let ly = 0; ly < h; ly++) {
            const worldY = worldOriginY + ly;
            const blockY = Math.floor(worldY / CELL) * CELL;
            const noiseY = blockY * freq;

            let curBlockX = null;
            let aInt = 0;
            for (let lx = 0; lx < w; lx++) {
                const worldX = worldOriginX + lx;
                const blockX = Math.floor(worldX / CELL) * CELL;
                if (blockX !== curBlockX) {
                    curBlockX = blockX;
                    const raw = _fbm(blockX * freq, noiseY, oct);
                    // Fast integer round; Uint8ClampedArray clamps to [0,255] automatically
                    aInt = ((raw + 1) * 0.5 * a255 + 0.5) | 0;
                }

                const i = (ly * w + lx) << 2;
                data[i    ] = r;
                data[i + 1] = g;
                data[i + 2] = b;
                data[i + 3] = aInt;
            }
        }
    }

    /**
     * Full bake: (re)computes the entire padded buffer from scratch. Used for
     * the first-ever draw, a canvas resize, a bake-affecting config change,
     * and as the fallback if a single frame drifts further than the top-up
     * margin can absorb — everywhere else, _topUpBake() handles panning far
     * more cheaply.
     * @private
     */
    _bake(w, h, originX, originY) {
        const PAD = FluidTextureEffect.BAKE_PAD_PX;
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
        const PAD = FluidTextureEffect.BAKE_PAD_PX;
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
        // shift's own sign. Filling x then y double-fills one small corner
        // when both axes shifted this frame — harmless, since _fillRegion()
        // is a pure function of world coordinate and just recomputes the same
        // value there.
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

    /**
     * Render the cached noise field to the clipped main ctx.
     *
     * `putImageData` ignores the clip path; `drawImage` respects it — which
     * is why the offscreen-buffer + drawImage approach is required here.
     */
    _draw(ctx, w, h) {
        const iw = w | 0;
        const ih = h | 0;
        if (iw < 1 || ih < 1) return;

        const PAD = FluidTextureEffect.BAKE_PAD_PX;
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
        if (cfg.color          !== undefined) { this._color   = parseColorToRgba(_resolve(cfg.color), 'rgba(100,180,255,0.8)'); bakeAffected = true; }
        if (cfg.base_frequency !== undefined) { this._freq    = cfg.base_frequency; bakeAffected = true; }
        if (cfg.num_octaves    !== undefined) { this._octaves = Math.max(1, Math.min(8, cfg.num_octaves)); bakeAffected = true; }
        if (cfg.scroll_speed_x !== undefined) this._speedX  = cfg.scroll_speed_x;
        if (cfg.scroll_speed_y !== undefined) this._speedY  = cfg.scroll_speed_y;
        if (bakeAffected) this._bakeDirty = true;
    }
}
