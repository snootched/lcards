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
         * }>}
         */
        this._slots = new Map();

        /** Tracks compound-preset slots so `clear()` knows which slots to release. */
        this._compoundActive = new Map(); // presetName → slot[]
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
            });
        }

        document.body.appendChild(this._portal);
        lcardsLog.debug('[ScreenEffectManager] Portal created on document.body');
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
        const anyActive = [...this._slots.values()].some(s => s.active);
        this._portal.style.display = anyActive ? '' : 'none';
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
        if (preset.compound) {
            lcardsLog.warn(`[ScreenEffectManager] _applySlot() called on compound preset '${presetName}' — use apply() instead`);
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

        // Activate — show portal first so offsetWidth/offsetHeight resolve
        // correctly when the effect's enter() function measures the slot element.
        slotState.el.style.display = '';
        slotState.active  = true;
        this._syncPortalVisibility();

        try {
            slotState.cleanup = preset.enter(slotState.el, resolved) ?? null;
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
     * Apply a named effect persistently.
     *
     * Handles both standard (single-slot) and compound presets.
     * Replaces any currently-active effect on the affected slot(s).
     *
     * @param {string} presetName - Registered preset name.
     * @param {Object} [params]   - Override preset defaults.
     * @returns {boolean} `true` if at least one slot was activated.
     */
    apply(presetName, params = {}) {
        this._ensurePortal();

        const preset = screenEffectPresetRegistry.get(presetName);
        if (!preset) {
            lcardsLog.warn(`[ScreenEffectManager] apply() — unknown preset: '${presetName}'`);
            return false;
        }

        if (preset.compound) {
            const appliedSlots = [];
            for (const layer of (preset.layers ?? [])) {
                const sub = screenEffectPresetRegistry.get(layer.preset);
                if (!sub || sub.compound) {
                    lcardsLog.warn(`[ScreenEffectManager] Compound preset '${presetName}': invalid layer '${layer.preset}' — skipped`);
                    continue;
                }
                const ok = this._applySlot(sub.slot, layer.preset, { ...(layer.params ?? {}), ...params });
                if (ok) appliedSlots.push(sub.slot);
            }
            this._compoundActive.set(presetName, appliedSlots);
            return appliedSlots.length > 0;
        }

        return this._applySlot(preset.slot, presetName, params);
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
        this._compoundActive.clear();
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

        // Determine which slot(s) to auto-dismiss.
        const preset = screenEffectPresetRegistry.get(presetName);
        const slotsToDispose = preset?.compound
            ? (this._compoundActive.get(presetName) ?? [])
            : [preset?.slot].filter(Boolean);

        return new Promise(resolve => {
            const timer = setTimeout(() => {
                for (const slot of slotsToDispose) this._releaseSlot(slot);
                if (preset?.compound) this._compoundActive.delete(presetName);
                this._syncPortalVisibility();
                lcardsLog.debug(`[ScreenEffectManager] playTransition '${presetName}' auto-dismissed after ${duration}ms`);
                resolve();
            }, duration);

            // Store timer on first affected slot so clearSlot() can cancel it.
            const firstSlot = slotsToDispose[0];
            if (firstSlot) {
                const state = this._slots.get(firstSlot);
                if (state) state.timer = timer;
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
