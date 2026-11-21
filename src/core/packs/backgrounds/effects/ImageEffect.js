/**
 * @fileoverview ImageEffect — renders a user-supplied image on the full background canvas.
 *
 * Integrates into the Background Animation system as a standard effect.
 * The image is drawn behind the card SVG (z-index: -1) and composited with any
 * other stacked effects in the Background Animation effects array.
 *
 * Config supports template syntax in `url` — e.g. `'{entity.attributes.entity_picture}'`
 * — because BackgroundAnimationRenderer.updateHass() evaluates all effect config values
 * as templates before calling updateConfig(), giving entity-reactive images for free.
 *
 * @module core/packs/backgrounds/effects/ImageEffect
 */

import { BaseEffect }     from './BaseEffect.js';
import { loadImage }      from '../../shared/ImageLoader.js';
import { ImageDrawUtils } from '../../shared/ImageDrawUtils.js';
import { lcardsLog }      from '../../../../utils/lcards-logging.js';
import { numProp }        from './animatable-props.js';

/**
 * Draws a static (or entity-reactive) image across the full background canvas.
 *
 * No continuous animation by default — a single draw per frame is a single GPU blit
 * and negligible at 30 fps.  The image is re-fetched only when the URL changes.
 *
 * @extends BaseEffect
 */
export class ImageEffect extends BaseEffect {
    // Static: no speed. draw() reads _opacity; keep BaseEffect's opacity in step
    static animatableProps = {
        opacity: numProp('_opacity', { min: 0, max: 1, after: (e) => { e.opacity = e._opacity; } })
    };

    /**
     * @param {Object}  config
     * @param {string}  [config.source='']        - Image source: URL, /local/ path, builtin:key, or template.
     * @param {string}  [config.size='cover']     - 'cover' | 'contain' | 'fill' | '<n>px'
     * @param {string}  [config.position='center'] - CSS background-position style string.
     * @param {boolean} [config.repeat=false]     - If true, tile the image across the canvas.
     * @param {number}  [config.opacity=1]        - Composite opacity (0–1).
     */
    constructor(config = {}) {
        super(config);

        this._url      = config.source ?? '';
        this._size     = config.size     ?? 'cover';
        this._position = config.position ?? 'center';
        this._repeat   = config.repeat   ?? false;
        this._opacity  = config.opacity  ?? 1;

        /** @type {HTMLImageElement|null} */
        this._img       = null;
        this._loadError = false;

        if (this._url) this._load();
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Private helpers
    // ─────────────────────────────────────────────────────────────────────────

    _load() {
        this._img       = null;
        this._loadError = false;
        loadImage(this._url)
            .then(img => { this._img = img; })
            .catch(err => {
                this._loadError = true;
                lcardsLog.warn('[ImageEffect]', err.message);
            });
    }

    // ─────────────────────────────────────────────────────────────────────────
    // BaseEffect contract
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Hot-update config properties without destroying the effect.
     * Called by BackgroundAnimationRenderer.updateHass() on every HASS update.
     * Does NOT call super.updateConfig() — BaseEffect has no such method.
     *
     * @param {Object} newConfig - Partial config to apply.
     */
    updateConfig(newConfig) {
        if (newConfig.source !== undefined) {
            const newUrl = newConfig.source ?? '';
            if (newUrl !== this._url) {
                this._url = newUrl;
                if (this._url) {
                    this._load();
                } else {
                    this._img       = null;
                    this._loadError = false;
                }
            }
        }

        if (newConfig.size     !== undefined) this._size     = newConfig.size;
        if (newConfig.position !== undefined) this._position = newConfig.position;
        if (newConfig.repeat   !== undefined) this._repeat   = newConfig.repeat;
        if (newConfig.opacity  !== undefined) this._opacity  = newConfig.opacity;
        // Also keep BaseEffect's animatable .opacity in sync for anime.js targets
        if (newConfig.opacity  !== undefined) this.opacity   = newConfig.opacity;
    }

    /**
     * Draw the image onto the canvas.
     * Canvas2DRenderer does NOT apply save/restore or globalAlpha — we must do it.
     *
     * @param {CanvasRenderingContext2D} ctx
     * @param {number} width
     * @param {number} height
     */
    draw(ctx, width, height) {
        if (!this._img || this._loadError) return;

        ctx.save();
        ctx.globalAlpha = Math.max(0, Math.min(1, this._opacity));

        if (this._repeat) {
            const pattern = ctx.createPattern(this._img, 'repeat');
            if (pattern) {
                ctx.fillStyle = pattern;
                ctx.fillRect(0, 0, width, height);
            }
        } else {
            const { sx, sy, sw, sh, dx, dy, dw, dh } =
                ImageDrawUtils.computeDrawParams(this._img, width, height, this._size, this._position);
            ctx.drawImage(this._img, sx, sy, sw, sh, dx, dy, dw, dh);
        }

        ctx.restore();
    }
}
