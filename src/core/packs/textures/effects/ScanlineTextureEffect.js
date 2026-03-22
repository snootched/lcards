/**
 * @fileoverview ScanlineTextureEffect - CRT scanline texture
 *
 * Draws evenly-spaced horizontal or vertical lines with an optional scrolling
 * offset, simulating a CRT scanline overlay.
 *
 * @module core/packs/textures/effects/ScanlineTextureEffect
 */

import { BaseTextureEffect } from './BaseTextureEffect.js';

/**
 * ScanlineTextureEffect - Scrolling CRT scanlines
 *
 * @extends BaseTextureEffect
 */
export class ScanlineTextureEffect extends BaseTextureEffect {
    /**
     * @param {object} config
     * @param {string} [config.color='rgba(0,0,0,0.25)']   - Scanline colour
     * @param {number} [config.line_spacing=4]             - Pixels between lines (centre-to-centre)
     * @param {number} [config.line_width=1.5]             - Stroke width of each line (px)
     * @param {string} [config.direction='horizontal']     - 'horizontal' or 'vertical'
     * @param {number} [config.scroll_speed_x=0]           - Horizontal scroll speed (px/s)
     * @param {number} [config.scroll_speed_y=0]           - Vertical scroll speed (px/s)
     * @param {number} [config.opacity=1] - Opacity (0-1)
     */
    constructor(config = {}) {
        super(/** @type {any} */ (config));
        this._color        = config.color           ?? 'rgba(0,0,0,0.25)';
        this._lineSpacing  = config.line_spacing     ?? 4;
        this._lineWidth    = config.line_width       ?? 1.5;
        this._direction    = config.direction        ?? 'horizontal';
        this._scrollSpeedX = config.scroll_speed_x  ?? 0;
        this._scrollSpeedY = config.scroll_speed_y  ?? 0;
        this._offsetX      = 0;
        this._offsetY      = 0;
    }

    update(dt, w, h) {
        super.update(dt, w, h);
        const dt_s = dt / 1000;
        this._offsetX += this._scrollSpeedX * this.speed * dt_s;
        this._offsetY += this._scrollSpeedY * this.speed * dt_s;
        // Wrap offsets to one tile period to avoid floating-point drift
        if (this._lineSpacing > 0) {
            this._offsetX %= this._lineSpacing;
            this._offsetY %= this._lineSpacing;
        }
    }

    _draw(ctx, w, h) {
        ctx.strokeStyle = this._color;
        ctx.lineWidth   = this._lineWidth;

        if (this._direction === 'vertical') {
            // Vertical lines — scroll horizontally
            const startX = (this._offsetX % this._lineSpacing) - this._lineSpacing;
            for (let x = startX; x < w + this._lineSpacing; x += this._lineSpacing) {
                ctx.beginPath();
                ctx.moveTo(x, 0);
                ctx.lineTo(x, h);
                ctx.stroke();
            }
        } else {
            // Horizontal lines — scroll vertically
            const startY = (this._offsetY % this._lineSpacing) - this._lineSpacing;
            for (let y = startY; y < h + this._lineSpacing; y += this._lineSpacing) {
                ctx.beginPath();
                ctx.moveTo(0, y);
                ctx.lineTo(w, y);
                ctx.stroke();
            }
        }
    }

    updateConfig(cfg) {
        super.updateConfig(cfg);
        if (cfg.color          !== undefined) this._color        = cfg.color;
        if (cfg.line_spacing   !== undefined) this._lineSpacing  = cfg.line_spacing;
        if (cfg.line_width     !== undefined) this._lineWidth    = cfg.line_width;
        if (cfg.direction      !== undefined) this._direction    = cfg.direction;
        if (cfg.scroll_speed_x !== undefined) this._scrollSpeedX = cfg.scroll_speed_x;
        if (cfg.scroll_speed_y !== undefined) this._scrollSpeedY = cfg.scroll_speed_y;
    }
}
