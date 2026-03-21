/**
 * @fileoverview ShimmerTextureEffect - Canvas shimmer/sweep highlight
 *
 * Draws a wide linear gradient band that sweeps across the shape at a configurable
 * angle and speed.  The band tiles seamlessly — when it exits one side it
 * immediately re-enters from the other.
 *
 * @module core/packs/textures/effects/ShimmerTextureEffect
 */

import { BaseTextureEffect } from './BaseTextureEffect.js';

/**
 * ShimmerTextureEffect - Sweeping highlight band
 *
 * @extends BaseTextureEffect
 */
export class ShimmerTextureEffect extends BaseTextureEffect {
    /**
     * @param {object} config
     * @param {string} [config.color='rgba(255,255,255,0.55)'] - Highlight colour
     * @param {number} [config.highlight_width=0.35] - Width of highlight as fraction of diagonal
     * @param {number} [config.speed=2.5]            - Sweep speed (px/s along diagonal)
     * @param {number} [config.opacity=1] - Opacity (0-1)
     * @param {number} [config.angle=30]             - Sweep angle in degrees (0=horiz, 90=vert)
     */
    constructor(config = {}) {
        super(/** @type {any} */ (config));
        this._color          = config.color           ?? 'rgba(255,255,255,0.55)';
        this._highlightWidth = config.highlight_width ?? 0.35;
        this._sweepSpeed     = config.speed           ?? 2.5;
        this._angle          = config.angle           ?? 30;
        this._sweepOffset    = 0;
    }

    update(dt, w, h) {
        super.update(dt, w, h);
        // Let _draw() handle totalRange wrapping — just accumulate offset here
        this._sweepOffset += this._sweepSpeed * this.speed * (dt / 1000);
    }

    _draw(ctx, w, h) {
        const diag    = Math.sqrt(w * w + h * h);
        const rad     = (this._angle * Math.PI) / 180;
        const cos     = Math.cos(rad);
        const sin     = Math.sin(rad);
        const bandLen = diag * this._highlightWidth;
        // totalRange: full cycle distance from off-screen entry to off-screen exit
        const totalRange = diag + bandLen;

        // Current center position along the sweep direction (can be negative = off-screen)
        const t   = (this._sweepOffset % totalRange) - bandLen * 0.5;
        const cx  = cos * t;
        const cy  = sin * t;

        // Gradient runs along the sweep direction, centered at (cx, cy)
        const halfBand = bandLen * 0.5;
        const gx0 = cx - cos * halfBand;
        const gy0 = cy - sin * halfBand;
        const gx1 = cx + cos * halfBand;
        const gy1 = cy + sin * halfBand;

        // Guard against degenerate gradient (zero length)
        if (Math.abs(gx1 - gx0) < 0.001 && Math.abs(gy1 - gy0) < 0.001) return;

        const grad = ctx.createLinearGradient(gx0, gy0, gx1, gy1);
        grad.addColorStop(0,    'rgba(255,255,255,0)');
        grad.addColorStop(0.35, this._color);
        grad.addColorStop(0.65, this._color);
        grad.addColorStop(1,    'rgba(255,255,255,0)');

        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, w, h);
    }

    updateConfig(cfg) {
        super.updateConfig(cfg);
        if (cfg.color           !== undefined) this._color          = cfg.color;
        if (cfg.highlight_width !== undefined) this._highlightWidth = cfg.highlight_width;
        if (cfg.speed           !== undefined) this._sweepSpeed     = cfg.speed;
        if (cfg.angle           !== undefined) this._angle          = cfg.angle;
    }
}
