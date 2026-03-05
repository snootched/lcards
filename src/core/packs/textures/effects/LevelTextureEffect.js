/**
 * @fileoverview LevelTextureEffect - Animated fill-bar level indicator
 *
 * Draws a filled region that represents a percentage fill of the shape, with
 * an optional animated wavy top (or right) edge.
 *
 * @module core/packs/textures/effects/LevelTextureEffect
 */

import { BaseTextureEffect } from './BaseTextureEffect.js';

/**
 * LevelTextureEffect - Animated fill-bar level indicator
 *
 * @extends BaseTextureEffect
 */
export class LevelTextureEffect extends BaseTextureEffect {
    /**
     * @param {Object} config
     * @param {string}  [config.color='rgba(0,200,100,0.7)'] - Fill colour
     * @param {number}  [config.fill_pct=50]     - Fill percentage (0–100)
     * @param {string}  [config.direction='up']  - 'up' (bottom→top) or 'right' (left→right)
     * @param {boolean} [config.edge_glow=true]  - Draw glow line at fill edge
     * @param {number}  [config.wave_height=4]   - Wave amplitude (px); 0 = flat edge
     * @param {number}  [config.wave_speed=20]   - Wave animation speed (px/s)
     * @param {number}  [config.wave_count=4]    - Number of sine cycles across the width
     */
    constructor(config = {}) {
        super(config);
        this._color      = config.color       ?? 'rgba(0,200,100,0.7)';
        this._fillPct    = Math.max(0, Math.min(100, config.fill_pct    ?? 50));
        this._direction  = config.direction   ?? 'up';
        this._edgeGlow   = config.edge_glow   ?? true;
        this._waveHeight = config.wave_height ?? 4;
        this._waveSpeed  = config.wave_speed  ?? 20;
        this._waveCount  = config.wave_count  ?? 4;
        this._waveOffset = 0;
    }

    update(dt, w, h) {
        super.update(dt, w, h);
        // Accumulate directly in radians so the wave phase advances at wave_speed rad/s.
        // wave_speed=20 gives ~3 full cycles per second at default settings.
        this._waveOffset += this._waveSpeed * this.speed * (dt / 1000) * (Math.PI / 180);
    }

    _draw(ctx, w, h) {
        const pct = Math.max(0, Math.min(100, this._fillPct)) / 100;

        if (this._direction === 'right') {
            this._drawHorizontal(ctx, w, h, pct);
        } else {
            this._drawVertical(ctx, w, h, pct);
        }
    }

    /** Fill from bottom upward */
    _drawVertical(ctx, w, h, pct) {
        const fillH = h * pct;
        const fillY = h - fillH;

        if (fillH <= 0) return;

        ctx.beginPath();

        if (this._waveHeight > 0 && fillH < h) {
            // Wave top edge
            const amplitude = this._waveHeight;
            const freq      = (Math.PI * 2 * this._waveCount) / w;
            const offset    = this._waveOffset; // already in radians

            ctx.moveTo(0, h);
            ctx.lineTo(0, fillY + amplitude * Math.sin(offset));

            const steps = Math.max(16, Math.floor(w / 4));
            for (let i = 1; i <= steps; i++) {
                const x    = (i / steps) * w;
                const wave = amplitude * Math.sin(freq * x + offset);
                ctx.lineTo(x, fillY + wave);
            }
            ctx.lineTo(w, h);
        } else {
            ctx.rect(0, fillY, w, fillH);
        }

        ctx.closePath();
        ctx.fillStyle = this._color;
        ctx.fill();

        if (this._edgeGlow && fillH < h) {
            this._drawEdgeGlow(ctx, w, fillY);
        }
    }

    /** Fill from left rightward */
    _drawHorizontal(ctx, w, h, pct) {
        const fillW = w * pct;
        if (fillW <= 0) return;

        ctx.beginPath();

        if (this._waveHeight > 0 && fillW < w) {
            const amplitude = this._waveHeight;
            const freq      = (Math.PI * 2 * this._waveCount) / h;
            const offset    = this._waveOffset; // already in radians

            ctx.moveTo(0, 0);
            ctx.lineTo(fillW + amplitude * Math.sin(offset), 0);

            const steps = Math.max(16, Math.floor(h / 4));
            for (let i = 1; i <= steps; i++) {
                const y    = (i / steps) * h;
                const wave = amplitude * Math.sin(freq * y + offset);
                ctx.lineTo(fillW + wave, y);
            }
            ctx.lineTo(0, h);
        } else {
            ctx.rect(0, 0, fillW, h);
        }

        ctx.closePath();
        ctx.fillStyle = this._color;
        ctx.fill();

        if (this._edgeGlow && fillW < w) {
            this._drawRightEdgeGlow(ctx, h, fillW);
        }
    }

    _drawEdgeGlow(ctx, w, fillY) {
        const grad = ctx.createLinearGradient(0, fillY - 4, 0, fillY + 4);
        grad.addColorStop(0, 'rgba(255,255,255,0)');
        grad.addColorStop(0.5, 'rgba(255,255,255,0.6)');
        grad.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle = grad;
        ctx.fillRect(0, fillY - 4, w, 8);
    }

    _drawRightEdgeGlow(ctx, h, fillX) {
        const grad = ctx.createLinearGradient(fillX - 4, 0, fillX + 4, 0);
        grad.addColorStop(0, 'rgba(255,255,255,0)');
        grad.addColorStop(0.5, 'rgba(255,255,255,0.6)');
        grad.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle = grad;
        ctx.fillRect(fillX - 4, 0, 8, h);
    }

    updateConfig(cfg) {
        super.updateConfig(cfg);
        if (cfg.color       !== undefined) this._color      = cfg.color;
        if (cfg.fill_pct    !== undefined) this._fillPct    = Math.max(0, Math.min(100, cfg.fill_pct));
        if (cfg.direction   !== undefined) this._direction  = cfg.direction;
        if (cfg.edge_glow   !== undefined) this._edgeGlow   = cfg.edge_glow;
        if (cfg.wave_height !== undefined) this._waveHeight = cfg.wave_height;
        if (cfg.wave_speed  !== undefined) this._waveSpeed  = cfg.wave_speed;
        if (cfg.wave_count  !== undefined) this._waveCount  = cfg.wave_count;
    }
}
