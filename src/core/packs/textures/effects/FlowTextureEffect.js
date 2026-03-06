/**
 * @fileoverview FlowTextureEffect - Directional streaming streaks
 *
 * Draws N horizontal gradient bands with sine-wave Y offsets that scroll,
 * giving the impression of flowing current streaks inside the shape.
 *
 * @module core/packs/textures/effects/FlowTextureEffect
 */

import { BaseTextureEffect } from './BaseTextureEffect.js';

/**
 * FlowTextureEffect - Animated flow streaks
 *
 * @extends BaseTextureEffect
 */
export class FlowTextureEffect extends BaseTextureEffect {
    /**
     * @param {Object} config
     * @param {string} [config.color='rgba(0,200,255,0.7)'] - Streak colour
     * @param {number} [config.wave_scale=8]                - Sine amplitude multiplier (px)
     * @param {number} [config.scroll_speed_x=50]           - Horizontal sweep speed (px/s)
     * @param {number} [config.scroll_speed_y=0]            - Vertical drift speed (px/s)
     * @param {number} [config.base_frequency=0.012]        - Controls streak density
     * @param {number} [config.speed=1]                     - Speed multiplier
     */
    constructor(config = {}) {
        super(config);
        this._color        = config.color           ?? 'rgba(0,200,255,0.7)';
        this._waveScale    = config.wave_scale       ?? 8;
        this._scrollSpeedX = config.scroll_speed_x  ?? 50;
        this._scrollSpeedY = config.scroll_speed_y  ?? 0;
        this._frequency    = config.base_frequency  ?? 0.012;
        this._offsetX      = 0;
        this._offsetY      = 0;

        // Pre-generate streak phase offsets for variety
        this._streakCount  = 8;
        this._streakPhases = Array.from({ length: this._streakCount }, () => Math.random() * Math.PI * 2);
    }

    update(dt, w, h) {
        super.update(dt, w, h);
        const dt_s = dt / 1000;
        this._offsetX += this._scrollSpeedX * this.speed * dt_s;
        this._offsetY += this._scrollSpeedY * this.speed * dt_s;

        // Normalize accumulators modulo their visual tile size to prevent
        // float-precision drift over long sessions (e.g. multi-hour dashboards).
        // Use the positive-modulo pattern because scroll speeds can be negative,
        // which would otherwise produce a negative accumulator value.
        // Only normalize when we have valid canvas dimensions (w/h > 0).
        if (w > 0) this._offsetX = ((this._offsetX % w) + w) % w;
        if (h > 0) {
            const streakH = h / this._streakCount;
            this._offsetY = ((this._offsetY % streakH) + streakH) % streakH;
        }
    }

    _draw(ctx, w, h) {
        const streakHeight = h / this._streakCount;

        for (let i = 0; i < this._streakCount; i++) {
            // Use positive modulo to handle negative scroll_speed_y correctly
            const baseY = i * streakHeight + ((this._offsetY % streakHeight) + streakHeight) % streakHeight;

            // Sine-wave Y displacement
            const phase = this._streakPhases[i] + this._offsetX * this._frequency * Math.PI;
            const waveY = Math.sin(phase) * this._waveScale;

            const y0 = baseY + waveY - streakHeight * 0.4;
            const y1 = baseY + waveY + streakHeight * 0.4;
            const x  = (this._offsetX % w);

            // Horizontal gradient streak — spans 3× the canvas width so the visible
            // portion is always the solid central region (no hard edge artifacts).
            // vGrad was previously created here but was dead code: fillStyle was set
            // to `grad` (not `vGrad`), so it was allocating 8 gradient objects per
            // frame without effect.  Removed.
            const grad = ctx.createLinearGradient(x - w, 0, x + w * 2, 0);
            grad.addColorStop(0,   'rgba(0,0,0,0)');
            grad.addColorStop(0.3, this._color);
            grad.addColorStop(0.5, this._color);
            grad.addColorStop(0.7, this._color);
            grad.addColorStop(1,   'rgba(0,0,0,0)');

            ctx.save();
            ctx.beginPath();
            ctx.rect(0, Math.max(0, y0), w, Math.min(h, y1 - y0));
            ctx.fillStyle = grad;
            ctx.fill();
            ctx.restore();
        }
    }

    updateConfig(cfg) {
        super.updateConfig(cfg);
        if (cfg.color          !== undefined) this._color        = cfg.color;
        if (cfg.wave_scale     !== undefined) this._waveScale    = cfg.wave_scale;
        if (cfg.scroll_speed_x !== undefined) this._scrollSpeedX = cfg.scroll_speed_x;
        if (cfg.scroll_speed_y !== undefined) this._scrollSpeedY = cfg.scroll_speed_y;
        if (cfg.base_frequency !== undefined) this._frequency    = cfg.base_frequency;
    }
}
