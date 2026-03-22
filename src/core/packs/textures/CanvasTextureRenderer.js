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
        canvas.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none;';
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
        this._effect = new (/** @type {any} */ (presetDef.effectClass))(effectConfig);

        // Set up Canvas2DRenderer.
        // monitorPerformance: false — canvas 2D texture effects are lightweight and
        // must not be paused by the WebGL/3D performance threshold.  The shared
        // PerformanceMonitor was designed for expensive 3D backgrounds, not these
        // simple per-card overlays.  Multiple texture renderers running concurrently
        // would also race on the non-refcounted stop() if monitoring were enabled.
        this._renderer = new Canvas2DRenderer(canvas, { monitorPerformance: false });
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
     * Optionally accepts an updated {shapePath} and/or {border} so that the stored
     * clip geometry stays in sync across renders (e.g. when the card resizes and
     * _generateTextureMarkup() produces a new absolute-pixel SVG path).  When
     * either changes the clip Path2D is rebuilt immediately at the current canvas
     * pixel size and pushed to the effect so the very next frame is correct.
     *
     * _clipPath is NOT included in the standard mergedConfig push — it is managed
     * exclusively by _resizeCanvas() (via ResizeObserver) and by the shape-change
     * path here.  This prevents a stale clip from being pushed back to the effect
     * when the card re-renders before the renderer's own ResizeObserver fires.
     *
     * @param {Object}      resolvedConfig - Fully resolved shape_texture config
     * @param {string|null} [shapePath]    - Updated SVG path d= string, or null
     * @param {Object|null} [border]       - Updated border config, or null
     */
    update(resolvedConfig, shapePath = null, border = null) {
        if (!this._effect) return;

        this._resolvedCfg = resolvedConfig;

        // Detect shape/border changes and rebuild the clip Path2D immediately
        // so the next frame clips to the correct (possibly resized) geometry.
        let clipChanged = false;
        if (shapePath !== null && shapePath !== this._shapePath) {
            this._shapePath = shapePath;
            clipChanged = true;
        }
        if (border !== null && border !== this._border) {
            this._border = border;
            clipChanged = true;
        }
        if (clipChanged && this._canvas) {
            this._clipPath = _buildClipPath(
                this._shapePath,
                this._border,
                this._canvas.width,
                this._canvas.height
            );
        }

        // Build effect config — include _clipPath only when it was just rebuilt
        // (shape changed).  For normal hot-updates the effect's clip is managed
        // solely by _resizeCanvas(); pushing the current value here would risk
        // restoring a stale path between observer firings.
        const mergedConfig = {
            ...(resolvedConfig?.config || {}),
            opacity: resolvedConfig?.opacity ?? 1,
            ...(clipChanged ? { _clipPath: this._clipPath } : {}),
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
     * Move the canvas to a new host element.
     *
     * Called when Lit re-renders the button/elbow card and replaces the inner
     * SVG markup via unsafeHTML().  The previously-created <foreignObject> that
     * was used as the canvas host is destroyed and a fresh one is inserted;
     * this method re-parents the live canvas element into the new foreignObject
     * without interrupting the RAF loop.
     *
     * @param {Element} newHostEl - The new host element (fresh foreignObject)
     */
    reattach(newHostEl) {
        if (!this._canvas || !newHostEl) return;
        if (this._canvas.parentNode === newHostEl) return; // already correct

        // Move canvas
        if (this._canvas.parentNode) {
            this._canvas.parentNode.removeChild(this._canvas);
        }
        newHostEl.appendChild(this._canvas);

        // Update ResizeObserver target
        if (this._resizeObserver) {
            if (this._hostEl) this._resizeObserver.unobserve(this._hostEl);
            this._resizeObserver.observe(newHostEl);
        }

        this._hostEl = /** @type {HTMLElement} */ (newHostEl);
        lcardsLog.debug(`[CanvasTextureRenderer:${this._id}] Canvas reattached to new host`);
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
