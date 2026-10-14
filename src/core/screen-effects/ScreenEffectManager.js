/**
 * @fileoverview ScreenEffectManager — full-screen composited effect layer.
 *
 * A singleton service that owns a `position:fixed` portal appended to
 * `document.body` (z-index 9100, above the alert overlay portal at 9000).
 * The portal contains a small set of named **slot** elements, each with a
 * distinct rendering responsibility:
 *
 *  | Slot       | Element    | Mechanism                                   |
 *  |------------|------------|---------------------------------------------|
 *  | `backdrop` | `<div>`    | CSS `backdrop-filter` (blur, saturate, …)   |
 *  | `canvas`   | `<canvas>` | Canvas2D rAF loop (static, pixelate, glitch)|
 *  | `color`    | `<div>`    | Opaque / semi-transparent colour tint       |
 *
 * Effects are registered as named presets in `ScreenEffectPresetRegistry`.
 * Each preset declares which slot it targets and provides an `enter(el, params)`
 * function that returns a cleanup callback.  Compound presets compose multiple
 * single-slot presets into one named effect.
 *
 * ## Public API (mirrored on `window.lcards.screenEffect.*`)
 *
 * ```js
 * screenEffectManager.apply('blur',   { amount: '12px' })   // persistent
 * screenEffectManager.play('pixelate',{ duration: 1500 })    // auto-dismiss
 * screenEffectManager.clearSlot('canvas')                     // remove one slot
 * screenEffectManager.clear()                                  // remove all
 * screenEffectManager.registerPreset('my-fx', { ... })        // extend registry
 * ```
 *
 * @module core/screen-effects/ScreenEffectManager
 */

import { BaseService                } from '../BaseService.js';
import { screenEffectPresetRegistry } from './ScreenEffectPresetRegistry.js';
import { lcardsLog                  } from '../../utils/lcards-logging.js';
import { resolveColor               } from '../themes/resolve-color.js';
import { mountDialogNearHomeAssistant } from '../../utils/lcards-shared-helpers.js';

// Ordered slot names — the portal creates them in this order so z-index follows
// document order naturally.  Each slot is a direct child of the portal div.
const SLOT_ORDER = ['backdrop', 'canvas', 'color'];

// ─────────────────────────────────────────────────────────────────────────────

export class ScreenEffectManager extends BaseService {

    constructor() {
        super();

        /** @type {HTMLDivElement|null} top-level portal element on document.body */
        this._portal = null;

        /**
         * Per-slot state.
         *
         * @type {Map<string, {
         *   el:       HTMLElement,
         *   cleanup:  (() => void)|null,
         *   active:   boolean,
         *   timer:    ReturnType<typeof setTimeout>|null,
         *   resolve:  (() => void)|null,
         * }>}
         */
        this._slots = new Map();

        /** @type {boolean} True while the alert overlay has elements in the portal. */
        this._overlayOccupied = false;

    }

    // ─────────────────────────────────────────────────────────────────────────
    // Portal lifecycle
    // ─────────────────────────────────────────────────────────────────────────

    /** Build the portal and all slot elements (idempotent). */
    _ensurePortal() {
        if (this._portal) return;

        this._portal = document.createElement('div');
        this._portal.setAttribute('data-lcards-screen-effect-portal', '');
        Object.assign(this._portal.style, {
            position:      'fixed',
            inset:         '0',
            zIndex:        '9100',
            display:       'none',
            pointerEvents: 'none',
        });

        for (const slot of SLOT_ORDER) {
            const el = this._createSlotElement(slot);
            this._portal.appendChild(el);

            this._slots.set(slot, {
                el,
                cleanup: null,
                active:  false,
                timer:   null,
                resolve: null,
            });
        }

        // Inside <home-assistant> (like HA's own dialogs) so HA cards shown in the
        // portal get Lit contexts and their hass-action/more-info events reach HA.
        mountDialogNearHomeAssistant(this._portal);
        lcardsLog.debug('[ScreenEffectManager] Portal created');
    }

    /** @private */
    _createSlotElement(slot) {
        const isCanvas = slot === 'canvas';
        const el = document.createElement(isCanvas ? 'canvas' : 'div');
        el.setAttribute(`data-lcards-se-slot`, slot);
        Object.assign(el.style, {
            position:      'absolute',
            inset:         '0',
            display:       'none',
            pointerEvents: 'none',
        });
        if (isCanvas) {
            // Explicit width/height keep the CSS visual size pinned to the full
            // portal area regardless of the drawing‑buffer size (canvas.width /
            // canvas.height).  Without these, setting canvas.width resets the
            // element's intrinsic dimensions and the browser collapses the
            // inset:0 stretch, leaving the canvas at its buffer pixel size
            // anchored to the top-right corner.
            el.style.width  = '100%';
            el.style.height = '100%';
            /** @type {HTMLCanvasElement} */ (el).width  = 1;
            /** @type {HTMLCanvasElement} */ (el).height = 1;
        }
        return el;
    }

    /** Update portal display based on whether any slot is active. */
    _syncPortalVisibility() {
        if (!this._portal) return;
        const anyActive = this._overlayOccupied || [...this._slots.values()].some(s => s.active);
        this._portal.style.display = anyActive ? '' : 'none';
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Portal access for trusted consumers (alert overlay)
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Returns the portal element, creating it if needed.
     * The alert overlay uses this to append its own content elements
     * directly into the shared portal stack.
     *
     * @returns {HTMLDivElement}
     */
    get portal() {
        this._ensurePortal();
        return this._portal;
    }

    /**
     * Notify the manager that the alert overlay has appended elements into
     * (or removed them from) the portal.  Keeps the portal visible while
     * the overlay is active even if no effect slots are running.
     *
     * @param {boolean} occupied
     */
    setOverlayOccupied(occupied) {
        this._overlayOccupied = !!occupied;
        this._syncPortalVisibility();
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Core apply / remove
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Activate a single-slot preset.
     * If the target slot already has an active effect, it is removed first.
     *
     * @param {string} slot       - Slot name ('backdrop' | 'canvas' | 'color').
     * @param {string} presetName - Registered preset name.
     * @param {Object} [params]   - Parameters merged with preset defaults.
     * @returns {boolean} `true` if activated successfully.
     */
    _applySlot(slot, presetName, params = {}) {
        this._ensurePortal();

        const preset = screenEffectPresetRegistry.get(presetName);
        if (!preset) {
            lcardsLog.warn(`[ScreenEffectManager] Unknown preset: '${presetName}'`);
            return false;
        }
        const slotState = this._slots.get(slot);
        if (!slotState) {
            lcardsLog.warn(`[ScreenEffectManager] Unknown slot: '${slot}'`);
            return false;
        }

        // Stop any existing effect on this slot.
        this._releaseSlot(slot);

        // Merge caller params with preset defaults.
        const resolved = { ...(preset.defaults ?? {}), ...params };
        // Resolve theme tokens and CSS variables in color-typed params so the
        // browser can apply them (el.style.background cannot consume var() strings).
        const finalParams = this._resolveColorParams(preset, resolved);

        // Activate — show portal first so offsetWidth/offsetHeight resolve
        // correctly when the effect's enter() function measures the slot element.
        slotState.el.style.display = '';
        slotState.active  = true;
        this._syncPortalVisibility();

        try {
            // Backdrop presets apply CSS `backdrop-filter` to whichever element
            // they receive as `el`.  If a canvas slot sibling uses `mix-blend-mode`
            // (static, glitch, pixelate) the browser isolates the portal into its
            // own compositing layer, which prevents any child element's
            // `backdrop-filter` from reaching through to the dashboard behind the
            // portal.  Applying the filter directly on the portal element itself
            // sidesteps the stacking-context isolation: the portal-level filter
            // is resolved before compositing children, so canvas blend-modes work
            // correctly on top of the already-filtered surface.
            const enterEl = slot === 'backdrop' ? this._portal : slotState.el;
            slotState.cleanup = preset.enter(enterEl, finalParams) ?? null;
        } catch (err) {
            lcardsLog.error(`[ScreenEffectManager] Error entering preset '${presetName}':`, err);
            slotState.el.style.display = 'none';
            slotState.active = false;
            this._syncPortalVisibility();
            return false;
        }
        lcardsLog.debug(`[ScreenEffectManager] Applied '${presetName}' → slot '${slot}'`);
        return true;
    }

    /**
     * Release a slot: call its cleanup fn, hide the element, clear the timer.
     *
     * @param {string} slot
     */
    _releaseSlot(slot) {
        const slotState = this._slots.get(slot);
        if (!slotState) return;

        if (slotState.timer !== null) {
            clearTimeout(slotState.timer);
            slotState.timer = null;
        }
        // Resolve any pending play() promise so callers don't hang.
        if (typeof slotState.resolve === 'function') {
            slotState.resolve();
            slotState.resolve = null;
        }
        if (typeof slotState.cleanup === 'function') {
            try { slotState.cleanup(); } catch (e) { /* ignore */ }
            slotState.cleanup = null;
        }
        slotState.el.style.display = 'none';
        slotState.active = false;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Public API
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Apply a preset to a specific slot.
     *
     * @param {string} slot       - Slot name ('backdrop' | 'canvas' | 'color').
     * @param {string} presetName - A registered preset name.
     * @param {Object} [params]   - Parameters merged with preset defaults.
     * @returns {boolean} `true` if activated successfully.
     */
    applySlot(slot, presetName, params = {}) {
        return this._applySlot(slot, presetName, params);
    }

    /**
     * Retrieve the full definition of a registered preset.
     * Useful for the visual editor to read label, params_schema, etc.
     *
     * @param {string} name
     * @returns {Object|undefined}
     */
    getPreset(name) {
        return screenEffectPresetRegistry.get(name);
    }

    /**
     * Return a catalog of all registered presets suitable for the visual editor.
     * Each entry contains: name, label, slot, params_schema.
     *
     * @returns {Array<Object>}
     */
    catalog() {
        return screenEffectPresetRegistry.list().map(name => {
            const p = screenEffectPresetRegistry.get(name);
            return {
                name,
                label:        p.label ?? name,
                slot:         p.slot,
                params_schema: p.params_schema ?? [],
                defaults:     p.defaults ?? {},
            };
        });
    }

    /**
     * Apply a named effect persistently (single-slot preset shorthand).
     * Replaces any currently-active effect on the preset's slot.
     *
     * @param {string} presetName - Registered preset name.
     * @param {Object} [params]   - Override preset defaults.
     * @returns {boolean} `true` if activated successfully.
     */
    apply(presetName, params = {}) {
        this._ensurePortal();

        const preset = screenEffectPresetRegistry.get(presetName);
        if (!preset) {
            lcardsLog.warn(`[ScreenEffectManager] apply() — unknown preset: '${presetName}'`);
            return false;
        }

        return this._applySlot(preset.slot, presetName, params);
    }

    /**
     * Resolve any `color-text` params in a preset's params_schema to concrete
     * CSS colour strings before they are handed to `el.style.*`. Read at call
     * time (resolveColor's concrete mode never caches), so a palette change
     * from an alert mode is picked up on the next call.
     *
     * @param {Object} preset   - Preset definition (may include params_schema).
     * @param {Object} params   - Already-merged param object.
     * @returns {Object} New object with color-text keys resolved.
     */
    _resolveColorParams(preset, params) {
        const schema = preset.params_schema;
        if (!schema?.length) return params;
        const colorKeys = schema.filter(s => s.type === 'color-text').map(s => s.key);
        if (!colorKeys.length) return params;
        const resolve = (raw) => resolveColor(raw, { concrete: true });

        const out = { ...params };
        for (const key of colorKeys) {
            if (out[key] !== undefined) out[key] = resolve(out[key]);
        }
        return out;
    }

    /**
     * Remove the active effect on one slot.
     *
     * @param {string} slot - Slot name ('backdrop' | 'canvas' | 'color').
     */
    clearSlot(slot) {
        this._releaseSlot(slot);
        this._syncPortalVisibility();
        lcardsLog.debug(`[ScreenEffectManager] Cleared slot '${slot}'`);
    }

    /**
     * Remove all active effects and hide the portal.
     */
    clear() {
        for (const slot of SLOT_ORDER) this._releaseSlot(slot);
        this._syncPortalVisibility();
        lcardsLog.debug('[ScreenEffectManager] All effects cleared');
    }

    /**
     * Apply a named effect and auto-dismiss it after `params.duration` ms
     * (defaults to 1 000 ms when not supplied).
     *
     * Returns a Promise that resolves when the effect has been removed.
     *
     * @param {string} presetName
     * @param {Object} [params]
     * @param {number} [params.duration=1000] - Auto-dismiss delay in ms.
     * @returns {Promise<void>}
     */
    play(presetName, params = {}) {
        const duration = params.duration ?? 1000;

        const ok = this.apply(presetName, params);
        if (!ok) return Promise.resolve();

        // Determine which slot holds this preset.
        const preset = screenEffectPresetRegistry.get(presetName);
        const targetSlot = preset?.slot;

        return new Promise(resolve => {
            const timer = setTimeout(() => {
                if (targetSlot) this._releaseSlot(targetSlot);
                this._syncPortalVisibility();
                lcardsLog.debug(`[ScreenEffectManager] play() '${presetName}' auto-dismissed after ${duration}ms`);
                resolve();
            }, duration);

            // Store timer AND resolve on the slot so clearSlot() can cancel the
            // timeout and resolve the promise immediately instead of leaving it
            // pending forever.
            if (targetSlot) {
                const state = this._slots.get(targetSlot);
                if (state) {
                    state.timer   = timer;
                    state.resolve = resolve;
                }
            }
        });
    }

    /**
     * Register (or replace) a preset at runtime, delegating to the shared
     * `ScreenEffectPresetRegistry`.
     *
     * @param {string} name
     * @param {Object} preset
     */
    registerPreset(name, preset) {
        screenEffectPresetRegistry.register(name, preset);
    }

    /**
     * List all registered preset names (built-in + custom).
     *
     * @returns {string[]}
     */
    listPresets() {
        return screenEffectPresetRegistry.list();
    }
}
