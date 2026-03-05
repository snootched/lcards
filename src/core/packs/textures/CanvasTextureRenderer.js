/**
 * @fileoverview CanvasTextureRenderer - Canvas2D overlay manager for shape textures
 *
 * Manages a <canvas> element absolutely positioned over a button/elbow shape.
 * Uses Canvas2DRenderer for the RAF loop and BaseTextureEffect subclasses for
 * per-preset rendering.  Replaces the SVG/SMIL ShapeTextureRenderer.
 *
 * Size tracking is handled via ResizeObserver — the canvas is created immediately
 * but remains at 1×1 until the first ResizeObserver callback fires, ensuring
 * correct pixel dimensions even when clientWidth/clientHeight are zero at
 * first paint (issue #3).  Subsequent resize events are also handled automatically,
 * keeping the clip path in sync with the element's layout (issue #4).
 *
 * @module core/packs/textures/CanvasTextureRenderer
 */

import { Canvas2DRenderer } from '../backgrounds/renderers/Canvas2DRenderer.js';
import { CANVAS_TEXTURE_PRESETS } from './presets/index.js';
import { lcardsLog } from '../../../utils/lcards-logging.js';

/**
 * CanvasTextureRenderer
 *
 * Lifecycle:
 *   new CanvasTextureRenderer(hostEl, instanceId)
 *   renderer.init(resolvedConfig, shapePath, border)  — creates canvas, starts RAF
 *   renderer.update(resolvedConfig)                   — hot-update effect props
 *   renderer.destroy()                               — stops RAF, removes canvas
 */
export class CanvasTextureRenderer {
    /**
     * @param {HTMLElement} hostEl     - Container element (position:relative) to append canvas into
     * @param {string}      instanceId - Stable short ID (for debug logging)
     */
    constructor(hostEl, instanceId) {
        this._hostEl        = hostEl;
        this._id            = instanceId;
        this._canvas        = null;
        this._renderer      = null;
        this._effect        = null;
        this._clipPath      = null;
        this._shapePath     = null;
        this._border        = null;
        this._resolvedCfg   = null;
        this._resizeObserver = null;
    }

    /**
     * Create the canvas element, start the ResizeObserver and RAF loop.
     *
     * Receives the *already-resolved* config object (theme tokens, templates
     * and state-based values all resolved by the caller) so that the effect
     * sees concrete color strings on the very first frame (issue #9).
     *
     * @param {Object}      resolvedConfig - Fully resolved shape_texture config
     * @param {string|null} shapePath      - SVG path d= string for clip, or null for rect
     * @param {Object|null} border         - Border config { topLeft, topRight, … }
     */
    init(resolvedConfig, shapePath, border) {
        if (this._canvas) {
            lcardsLog.warn(`[CanvasTextureRenderer:${this._id}] init() called but canvas already exists`);
            return;
        }

        const preset = resolvedConfig?.preset;
        const presetDef = CANVAS_TEXTURE_PRESETS[preset];
        if (!presetDef) {
            lcardsLog.warn(`[CanvasTextureRenderer:${this._id}] Unknown preset '${preset}', skipping init`);
            return;
        }

        // Store for ResizeObserver callbacks and future updates
        this._resolvedCfg = resolvedConfig;
        this._shapePath   = shapePath ?? null;
        this._border      = border    ?? null;

        // Create canvas (1×1 — will be resized by ResizeObserver on first callback)
        const canvas = document.createElement('canvas');
        canvas.width  = 1;
        canvas.height = 1;
        canvas.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:1;';
        canvas.style.mixBlendMode = resolvedConfig?.mix_blend_mode || 'normal';

        this._hostEl.appendChild(canvas);
        this._canvas = canvas;

        // Build initial clip path (1×1 placeholder; updated by ResizeObserver)
        this._clipPath = _buildClipPath(shapePath, border, 1, 1);

        // Instantiate effect with resolved config
        const effectConfig = {
            ...presetDef.defaults,
            ...(resolvedConfig?.config || {}),
            opacity:   resolvedConfig?.opacity ?? 1,
            _clipPath: this._clipPath,
        };
        this._effect = new presetDef.effectClass(effectConfig);

        // Set up Canvas2DRenderer
        this._renderer = new Canvas2DRenderer(canvas);
        this._renderer.addEffect(this._effect);
        this._renderer.start();

        // ResizeObserver: handles both zero-size-at-first-paint (#3) and
        // subsequent layout changes (#4).  The first callback fires after layout
        // and provides the correct pixel dimensions.
        this._resizeObserver = new ResizeObserver(entries => {
            const rect = entries[0].contentRect;
            if (rect.width > 0 && rect.height > 0) {
                this._resizeCanvas(rect.width, rect.height);
            }
        });
        this._resizeObserver.observe(this._hostEl);

        lcardsLog.debug(`[CanvasTextureRenderer:${this._id}] Initialized`, { preset });
    }

    /**
     * Hot-update effect properties without teardown/restart.
     * Receives the *already-resolved* config object.
     *
     * @param {Object} resolvedConfig - Fully resolved shape_texture config
     */
    update(resolvedConfig) {
        if (!this._effect) return;

        this._resolvedCfg = resolvedConfig;

        const mergedConfig = {
            ...(resolvedConfig?.config || {}),
            opacity:   resolvedConfig?.opacity ?? 1,
            _clipPath: this._clipPath,
        };

        if (this._canvas) {
            this._canvas.style.mixBlendMode = resolvedConfig?.mix_blend_mode || 'normal';
        }

        if (typeof this._effect.updateConfig === 'function') {
            this._effect.updateConfig(mergedConfig);
        }
    }

    /**
     * Returns the preset key currently active on this renderer.
     * Used by the card to detect preset changes without accessing private fields.
     * @returns {string|null}
     */
    getPreset() {
        return this._resolvedCfg?.preset ?? null;
    }

    /**
     * Stop RAF, disconnect ResizeObserver, and remove the canvas from the DOM.
     */
    destroy() {
        if (this._resizeObserver) {
            this._resizeObserver.disconnect();
            this._resizeObserver = null;
        }
        if (this._renderer) {
            this._renderer.destroy();
            this._renderer = null;
        }
        if (this._canvas && this._canvas.parentNode) {
            this._canvas.parentNode.removeChild(this._canvas);
        }
        this._canvas     = null;
        this._effect     = null;
        this._clipPath   = null;
        this._shapePath  = null;
        this._border     = null;
        this._resolvedCfg = null;
        lcardsLog.debug(`[CanvasTextureRenderer:${this._id}] Destroyed`);
    }

    // ─── Private ──────────────────────────────────────────────────────────────

    /**
     * Resize the canvas pixel buffer and rebuild the clip path.
     * Called by ResizeObserver whenever the host element's size changes.
     * @param {number} w
     * @param {number} h
     * @private
     */
    _resizeCanvas(w, h) {
        const rw = Math.max(1, Math.round(w));
        const rh = Math.max(1, Math.round(h));

        if (this._renderer) {
            this._renderer.resize(rw, rh);
        }

        this._clipPath = _buildClipPath(this._shapePath, this._border, rw, rh);

        if (this._effect) {
            if (typeof this._effect.updateConfig === 'function') {
                this._effect.updateConfig({ _clipPath: this._clipPath });
            } else {
                this._effect._clipPath = this._clipPath;
            }
        }

        lcardsLog.debug(`[CanvasTextureRenderer:${this._id}] Resized`, { w: rw, h: rh });
    }
}

// ─── Internal helpers ─────────────────────────────────────────────────────────

/**
 * Build a Path2D for clipping the canvas to the shape boundary.
 *
 * @param {string|null} shapePath - SVG path d= string, or null for rect/rounded-rect
 * @param {Object|null} border    - Border radii config
 * @param {number}      w
 * @param {number}      h
 * @returns {Path2D}
 */
function _buildClipPath(shapePath, border, w, h) {
    if (shapePath) {
        return new Path2D(shapePath);
    }

    // Rounded rect
    const r = _computeClipRadius(border);
    const p = new Path2D();
    if (r > 0) {
        p.roundRect(0, 0, w, h, r);
    } else {
        p.rect(0, 0, w, h);
    }
    return p;
}

/**
 * Compute a conservative clip radius from border config.
 * @param {Object|null|undefined} border
 * @returns {number}
 */
function _computeClipRadius(border) {
    if (!border) return 0;
    const hasCorners =
        border.topLeft    !== undefined ||
        border.topRight   !== undefined ||
        border.bottomRight !== undefined ||
        border.bottomLeft  !== undefined;
    if (hasCorners) {
        return Math.min(
            Number(border.topLeft     ?? 0),
            Number(border.topRight    ?? 0),
            Number(border.bottomRight ?? 0),
            Number(border.bottomLeft  ?? 0)
        );
    }
    return Number(border.radius ?? 0);
}
