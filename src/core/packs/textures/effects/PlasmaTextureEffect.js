/**
 * @fileoverview PlasmaTextureEffect - Dual-nebula plasma texture
 *
 * Composites two NebulaEffect instances using 'screen' blend mode to create a
 * vivid plasma effect inside the shape boundary.
 *
 * @module core/packs/textures/effects/PlasmaTextureEffect
 */

import { NebulaEffect } from '../../backgrounds/effects/NebulaEffect.js';
import { BaseTextureEffect } from './BaseTextureEffect.js';

/**
 * PlasmaTextureEffect - Two-colour plasma blobs composited via screen blending
 *
 * @extends BaseTextureEffect
 */
export class PlasmaTextureEffect extends BaseTextureEffect {
    /**
     * @param {Object} config
     * @param {string} [config.color_a='rgba(80,0,255,0.9)']   - First cloud colour
     * @param {string} [config.color_b='rgba(255,40,120,0.9)'] - Second cloud colour
     * @param {number} [config.base_frequency=0.012]           - Controls noiseScale
     * @param {number} [config.scroll_speed_x=8]               - Horizontal drift (px/s)
     * @param {number} [config.scroll_speed_y=5]               - Vertical drift (px/s)
     * @param {number} [config.speed=1]                        - Speed multiplier
     */
    constructor(config = {}) {
        super(config);
        const noiseScale = config.base_frequency ? config.base_frequency * 800 : 10;
        this._nebulaA = new NebulaEffect({
            colors:       [config.color_a ?? 'rgba(80,0,255,0.9)'],
            noiseScale,
            cloudCount:   3,
            scrollSpeedX: config.scroll_speed_x ?? 8,
            scrollSpeedY: config.scroll_speed_y ?? 5,
            speed:        config.speed ?? 1,
            opacity:      1,
        });
        this._nebulaB = new NebulaEffect({
            colors:       [config.color_b ?? 'rgba(255,40,120,0.9)'],
            noiseScale,
            cloudCount:   3,
            scrollSpeedX: -(config.scroll_speed_x ?? 8),
            scrollSpeedY: -(config.scroll_speed_y ?? 5),
            speed:        config.speed ?? 1,
            opacity:      1,
        });
        // Cached offscreen canvas for plasma compositing — avoids per-frame allocation
        this._offscreen    = null;
        this._offscreenW   = 0;
        this._offscreenH   = 0;
    }

    update(dt, w, h) {
        super.update(dt, w, h);
        this._nebulaA.speed = this.speed;
        this._nebulaB.speed = this.speed;
        this._nebulaA.update(dt, w, h);
        this._nebulaB.update(dt, w, h);
    }

    _draw(ctx, w, h) {
        // Both nebulae must be composited together on an offscreen canvas before
        // being drawn to the clipped context.  Setting globalCompositeOperation
        // inside _draw() would be reset by BaseTextureEffect's save()/restore()
        // wrapper between the two nebula draw calls (issue #6).
        //
        // Re-use a cached offscreen canvas; only recreate when dimensions change
        // to avoid per-frame canvas allocation overhead.
        if (!this._offscreen || this._offscreenW !== w || this._offscreenH !== h) {
            this._offscreen  = document.createElement('canvas');
            this._offscreenW = w;
            this._offscreenH = h;
        }
        this._offscreen.width  = w;
        this._offscreen.height = h;
        const offCtx = this._offscreen.getContext('2d');

        // Draw first nebula normally
        this._nebulaA.draw(offCtx, w, h);

        // Draw second nebula using screen blend on the offscreen context
        offCtx.globalCompositeOperation = 'screen';
        this._nebulaB.draw(offCtx, w, h);
        offCtx.globalCompositeOperation = 'source-over';

        // Blit the composited result to the main (clipped) context
        ctx.drawImage(this._offscreen, 0, 0);
    }

    updateConfig(cfg) {
        super.updateConfig(cfg);
        if (cfg.color_a        !== undefined) this._nebulaA.colors       = [cfg.color_a];
        if (cfg.color_b        !== undefined) this._nebulaB.colors       = [cfg.color_b];
        if (cfg.scroll_speed_x !== undefined) {
            this._nebulaA.scrollSpeedX =  cfg.scroll_speed_x;
            this._nebulaB.scrollSpeedX = -cfg.scroll_speed_x;
        }
        if (cfg.scroll_speed_y !== undefined) {
            this._nebulaA.scrollSpeedY =  cfg.scroll_speed_y;
            this._nebulaB.scrollSpeedY = -cfg.scroll_speed_y;
        }
    }
}
