/**
 * @fileoverview FlowTextureEffect - Directional streaming streaks
 *
 * Draws N horizontal gradient bands with sine-wave Y offsets that scroll,
 * giving the impression of flowing current streaks inside the shape.
 *
 * @module core/packs/textures/effects/FlowTextureEffect
 */

import { BaseTextureEffect } from './BaseTextureEffect.js';
import { ColorUtils } from '../../../themes/ColorUtils.js';

/**
 * FlowTextureEffect - Animated flow streaks
 *
 * @extends BaseTextureEffect
 */
export class FlowTextureEffect extends BaseTextureEffect {
    /**
     * @param {object} config
     * @param {string} [config.color='rgba(0,200,255,0.7)'] - Streak colour
     * @param {number} [config.num_streaks=8]              - Number of parallel bands
     * @param {number} [config.streak_width=0.8]           - Band height as fraction of slot (>1 = overlap/blend)
     * @param {number} [config.wave_scale=8]               - Sine amplitude multiplier (px)
     * @param {number} [config.blur=0]                     - Gaussian blur radius (px); softens band edges
     * @param {number} [config.scroll_speed_x=50]          - Horizontal sweep speed (px/s)
     * @param {number} [config.scroll_speed_y=0]           - Vertical drift speed (px/s)
     * @param {number} [config.base_frequency=0.012]       - Controls streak sine-wave density
     * @param {number} [config.speed=1]                    - Speed multiplier
     * @param {number} [config.opacity=1] - Opacity (0-1)
     */
    constructor(config = {}) {
        super(/** @type {any} */ (config));
        this._color        = ColorUtils.resolveCssVariable(config.color ?? 'rgba(0,200,255,0.7)', 'rgba(0,200,255,0.7)');
        this._waveScale    = config.wave_scale       ?? 8;
        this._scrollSpeedX = config.scroll_speed_x  ?? 50;
        this._scrollSpeedY = config.scroll_speed_y  ?? 0;
        this._frequency    = config.base_frequency  ?? 0.012;
        this._streakWidth  = config.streak_width    ?? 0.8;
        this._blur         = config.blur            ?? 0;
        this._offsetX      = 0;
        this._offsetY      = 0;

        // Pre-generate streak phase offsets for variety
        this._streakCount  = config.num_streaks ?? 8;
        this._streakPhases = Array.from({ length: this._streakCount }, () => Math.random() * Math.PI * 2);
    }

    update(dt, w, h) {
        super.update(dt, w, h);
        const dt_s = dt / 1000;
        this._offsetX += this._scrollSpeedX * this.speed * dt_s;
        this._offsetY += this._scrollSpeedY * this.speed * dt_s;

        // Do NOT normalise _offsetX here — _draw() reads it unbounded for the
        // sine-wave phase calculation.  Normalising in-place would reset the
        // accumulator to [0,w) every wrap, causing a phase jump and a visible
        // streak-Y discontinuity.  Float64 is precise to sub-pixel levels for
        // years of continuous scrolling, so precision drift is not a concern.
        // _offsetY is still normalised because it is only used for toroidal
        // band translation (no phase coupling).
        if (h > 0) {
            const streakH = h / this._streakCount;
            this._offsetY = ((this._offsetY % streakH) + streakH) % streakH;
        }
    }

    _draw(ctx, w, h) {
        const streakHeight = h / this._streakCount;
        // Re-normalise at draw time using the current canvas dimensions.
        // update() normalises against the w/h it receives, but a ResizeObserver
        // can change the canvas between update() and _draw(), putting _offsetX
        // outside [0, new_w) and breaking the partition-of-unity tile coverage.
        const x       = ((this._offsetX   % w)           + w)           % w;
        const offsetY = ((this._offsetY   % streakHeight) + streakHeight) % streakHeight;

        // Optional Gaussian blur for soft band edges. ctx.filter is part of
        // the canvas state stack and is restored automatically by the parent
        // draw() save/restore, so no manual cleanup is needed here.
        if (this._blur > 0) ctx.filter = `blur(${this._blur}px)`;

        // Half-height of each streak rect.  streak_width=1.0 fills the full slot;
        // values >1.0 bleed into adjacent slots and blend naturally via alpha overlap.
        const halfH = streakHeight * this._streakWidth * 0.5;

        for (let i = 0; i < this._streakCount; i++) {
            const baseY = i * streakHeight + offsetY;

            // Sine-wave Y displacement.
            // Use the raw (unbounded) accumulator for phase, NOT the normalised x.
            // If x were used, the phase would drop by w*frequency*π every time x
            // wraps from w→0, causing every streak's Y position to jump visibly.
            const phase = this._streakPhases[i] + this._offsetX * this._frequency * Math.PI;
            const waveY = Math.sin(phase) * this._waveScale;

            const y0  = baseY + waveY - halfH;
            const y1  = baseY + waveY + halfH;
            const ry0 = Math.max(0, y0);
            const rh  = Math.min(h, y1) - ry0;
            if (rh <= 0) continue;

            // Seamless tiling via THREE copies at tx = x-w, x, x+w.
            //
            // Each copy uses a symmetric triangle gradient centered at tx:
            //   T(p, center) = max(0, 1 - |p - center| / w)
            // Three consecutive triangles satisfy the partition-of-unity identity:
            //   T(p, x-w) + T(p, x) + T(p, x+w) = 1  for all p ∈ [0, w]
            // This means total brightness is constant regardless of wrap position —
            // no bright surge as streaks exit/enter the canvas edge.
            for (const tx of [x - w, x, x + w]) {
                const grad = ctx.createLinearGradient(tx - w, 0, tx + w, 0);
                grad.addColorStop(0,   'rgba(0,0,0,0)');
                grad.addColorStop(0.5, this._color);   // peak at tx
                grad.addColorStop(1,   'rgba(0,0,0,0)');

                ctx.save();
                ctx.beginPath();
                ctx.rect(0, ry0, w, rh);
                ctx.fillStyle = grad;
                ctx.fill();
                ctx.restore();
            }
        }
    }

    updateConfig(cfg) {
        super.updateConfig(cfg);
        if (cfg.color          !== undefined) {
            const _res = window.lcards?.core?.themeManager?.resolver;
            this._color = ColorUtils.resolveCssVariable(_res ? _res.resolve(cfg.color, cfg.color) : cfg.color, 'rgba(0,200,255,0.7)');
        }
        if (cfg.wave_scale     !== undefined) this._waveScale    = cfg.wave_scale;
        if (cfg.scroll_speed_x !== undefined) this._scrollSpeedX = cfg.scroll_speed_x;
        if (cfg.scroll_speed_y !== undefined) this._scrollSpeedY = cfg.scroll_speed_y;
        if (cfg.base_frequency !== undefined) this._frequency    = cfg.base_frequency;
        if (cfg.streak_width   !== undefined) this._streakWidth  = cfg.streak_width;
        if (cfg.blur           !== undefined) this._blur         = cfg.blur;
        if (cfg.num_streaks    !== undefined) {
            this._streakCount  = cfg.num_streaks;
            // Regenerate phases when streak count changes
            this._streakPhases = Array.from({ length: this._streakCount }, () => Math.random() * Math.PI * 2);
        }
    }
}
