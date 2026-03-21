/**
 * @fileoverview GridTextureEffect - Canvas grid texture for button/elbow shapes
 *
 * Delegates to GridEffect for rendering. Supports grid, diagonal, hexagonal,
 * and dots patterns, all scrolling via the existing GridEffect infrastructure.
 *
 * @module core/packs/textures/effects/GridTextureEffect
 */

import { GridEffect } from '../../backgrounds/effects/GridEffect.js';
import { BaseTextureEffect } from './BaseTextureEffect.js';

/**
 * GridTextureEffect - Scrolling grid/dots texture
 *
 * @extends BaseTextureEffect
 */
export class GridTextureEffect extends BaseTextureEffect {
    /**
     * @param {object} config
     * @param {number}  [config.line_spacing=40]    - Space between grid lines (px)
     * @param {number}  [config.line_width=1]       - Line width (px)
     * @param {string}  [config.color]              - Line/dot color
     * @param {number}  [config.scroll_speed_x=20]  - Horizontal scroll speed (px/s)
     * @param {number}  [config.scroll_speed_y=0]   - Vertical scroll speed (px/s)
     * @param {string}  [config.pattern='both']     - 'both', 'horizontal', 'vertical', 'diagonal', 'hexagonal', 'dots'
     * @param {number}  [config.hex_radius=20]      - Hex cell radius (when pattern='hexagonal')
     * @param {number}  [config.dot_radius=2]       - Dot radius (when pattern='dots')
     * @param {number}  [config.spacing=20]         - Dot grid spacing (when pattern='dots')
     * @param {number}  [config.speed=1]            - Speed multiplier
     */
    constructor(config = {}) {
        super(/** @type {any} */ (config));
        this._grid = new GridEffect(/** @type {any} */ ({
            lineSpacing:    config.line_spacing  ?? 40,
            lineWidthMinor: config.line_width     ?? 1,
            color:          config.color          ?? 'rgba(255,255,255,0.3)',
            scrollSpeedX:   config.scroll_speed_x ?? 20,
            scrollSpeedY:   config.scroll_speed_y ?? 0,
            pattern:        config.pattern        ?? 'both',
            hexRadius:      config.hex_radius      ?? 20,
            dotRadius:      config.dot_radius      ?? 2,
            spacing:        config.spacing         ?? 20,
            speed:          config.speed           ?? 1,
        }));
    }

    update(dt, w, h) {
        super.update(dt, w, h);
        this._grid.speed = this.speed;
        this._grid.update(dt, w, h);
    }

    _draw(ctx, w, h) {
        this._grid.draw(ctx, w, h);
    }

    updateConfig(cfg) {
        super.updateConfig(cfg);
        if (cfg.color          !== undefined) this._grid.color          = cfg.color;
        if (cfg.scroll_speed_x !== undefined) this._grid.scrollSpeedX   = cfg.scroll_speed_x;
        if (cfg.scroll_speed_y !== undefined) this._grid.scrollSpeedY   = cfg.scroll_speed_y;
        if (cfg.line_spacing   !== undefined) this._grid.lineSpacing     = cfg.line_spacing;
        if (cfg.line_width     !== undefined) this._grid.lineWidthMinor  = cfg.line_width;
    }
}
