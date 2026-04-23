/**
 * @fileoverview ScreenEffectPresetRegistry — named preset library for screen-wide effects.
 *
 * Works analogously to the animation preset registry
 * (`core/animation/presets.js`) but targets full-screen overlay slots managed
 * by `ScreenEffectManager`.
 *
 * ## Preset shapes
 *
 * ### Standard preset
 * ```js
 * {
 *   slot:     'canvas' | 'backdrop' | 'color',
 *   defaults: { ... },                 // merged with caller params
 *   enter(slotEl, resolvedParams) {    // activate the effect
 *     // set up CSS / start rAF loop
 *     return () => { /* cleanup *\/ }; // returned fn stops the effect
 *   },
 * }
 * ```
 *
 * ### Compound preset
 * ```js
 * {
 *   compound: true,
 *   layers: [
 *     { preset: 'blur',       params: { amount: '8px' } },
 *     { preset: 'color-tint', params: { color: 'rgba(200,0,0,0.35)' } },
 *   ],
 * }
 * ```
 * Compound presets apply multiple single-slot presets simultaneously.
 * The `ScreenEffectManager` resolves them recursively before activation.
 *
 * @module core/screen-effects/ScreenEffectPresetRegistry
 */

import { StaticEffect   } from './effects/StaticEffect.js';
import { PixelateEffect } from './effects/PixelateEffect.js';
import { GlitchEffect   } from './effects/GlitchEffect.js';
import { ScanlineEffect } from './effects/ScanlineEffect.js';
import { lcardsLog      } from '../../utils/lcards-logging.js';

// ─────────────────────────────────────────────────────────────────────────────
// Registry implementation
// ─────────────────────────────────────────────────────────────────────────────

class ScreenEffectPresetRegistry {
    constructor() {
        /** @type {Map<string, Object>} */
        this._presets = new Map();
    }

    /**
     * Register (or replace) a named preset.
     *
     * @param {string} name   - Unique effect name (e.g. `'blur'`, `'my-custom'`).
     * @param {Object} preset - Preset definition (see module-level doc for shape).
     */
    register(name, preset) {
        if (!name || typeof name !== 'string') {
            lcardsLog.warn('[ScreenEffectPresetRegistry] register() called with invalid name:', name);
            return;
        }
        if (!preset || typeof preset !== 'object') {
            lcardsLog.warn('[ScreenEffectPresetRegistry] register() called with invalid preset:', name);
            return;
        }
        if (this._presets.has(name)) {
            lcardsLog.debug(`[ScreenEffectPresetRegistry] Overwriting preset: '${name}'`);
        }
        this._presets.set(name, preset);
    }

    /**
     * Retrieve a preset by name.
     *
     * @param {string} name
     * @returns {Object|undefined}
     */
    get(name) {
        return this._presets.get(name);
    }

    /**
     * Check whether a preset is registered.
     *
     * @param {string} name
     * @returns {boolean}
     */
    has(name) {
        return this._presets.has(name);
    }

    /**
     * List all registered preset names.
     *
     * @returns {string[]}
     */
    list() {
        return [...this._presets.keys()];
    }
}

// Module-level singleton
export const screenEffectPresetRegistry = new ScreenEffectPresetRegistry();

// ─────────────────────────────────────────────────────────────────────────────
// Built-in presets
// ─────────────────────────────────────────────────────────────────────────────

// ── Backdrop (CSS backdrop-filter) ───────────────────────────────────────────

screenEffectPresetRegistry.register('blur', {
    slot: 'backdrop',
    defaults: { amount: '8px' },
    enter(el, params) {
        const val = `blur(${params.amount ?? '8px'})`;
        el.style.backdropFilter       = val;
        el.style.webkitBackdropFilter = val;
        return () => {
            el.style.backdropFilter       = '';
            el.style.webkitBackdropFilter = '';
        };
    },
});

screenEffectPresetRegistry.register('saturate', {
    slot: 'backdrop',
    defaults: { amount: '200%' },
    enter(el, params) {
        const val = `saturate(${params.amount ?? '200%'})`;
        el.style.backdropFilter       = val;
        el.style.webkitBackdropFilter = val;
        return () => {
            el.style.backdropFilter       = '';
            el.style.webkitBackdropFilter = '';
        };
    },
});

screenEffectPresetRegistry.register('grayscale', {
    slot: 'backdrop',
    defaults: { amount: '100%' },
    enter(el, params) {
        const val = `grayscale(${params.amount ?? '100%'})`;
        el.style.backdropFilter       = val;
        el.style.webkitBackdropFilter = val;
        return () => {
            el.style.backdropFilter       = '';
            el.style.webkitBackdropFilter = '';
        };
    },
});

screenEffectPresetRegistry.register('contrast', {
    slot: 'backdrop',
    defaults: { amount: '200%' },
    enter(el, params) {
        const val = `contrast(${params.amount ?? '200%'})`;
        el.style.backdropFilter       = val;
        el.style.webkitBackdropFilter = val;
        return () => {
            el.style.backdropFilter       = '';
            el.style.webkitBackdropFilter = '';
        };
    },
});

screenEffectPresetRegistry.register('hue-rotate', {
    slot: 'backdrop',
    defaults: { angle: '180deg' },
    enter(el, params) {
        const val = `hue-rotate(${params.angle ?? '180deg'})`;
        el.style.backdropFilter       = val;
        el.style.webkitBackdropFilter = val;
        return () => {
            el.style.backdropFilter       = '';
            el.style.webkitBackdropFilter = '';
        };
    },
});

// ── Color tint overlay ────────────────────────────────────────────────────────

screenEffectPresetRegistry.register('color-tint', {
    slot: 'color',
    defaults: { color: 'rgba(0,0,0,0.5)' },
    enter(el, params) {
        el.style.background = params.color ?? 'rgba(0,0,0,0.5)';
        return () => { el.style.background = ''; };
    },
});

screenEffectPresetRegistry.register('vignette', {
    slot: 'color',
    defaults: { opacity: 0.7 },
    enter(el, params) {
        const op = params.opacity ?? 0.7;
        el.style.background = `radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,${op}) 100%)`;
        return () => { el.style.background = ''; };
    },
});

// ── Canvas effects ────────────────────────────────────────────────────────────

screenEffectPresetRegistry.register('static', {
    slot: 'canvas',
    defaults: { opacity: 0.55, scale: 4 },
    enter: StaticEffect,
});

screenEffectPresetRegistry.register('pixelate', {
    slot: 'canvas',
    defaults: { pixelSize: 8, opacity: 0.75, variance: 0.35, baseLight: 80 },
    enter: PixelateEffect,
});

screenEffectPresetRegistry.register('glitch', {
    slot: 'canvas',
    defaults: { intensity: 0.08, maxShift: 40, bandHeight: 4, opacity: 0.85, fps: 20 },
    enter: GlitchEffect,
});

screenEffectPresetRegistry.register('scanlines', {
    slot: 'canvas',
    defaults: { lineHeight: 4, opacity: 0.25, scroll: 0 },
    enter: ScanlineEffect,
});

// ── Compound presets ──────────────────────────────────────────────────────────

screenEffectPresetRegistry.register('alert-red', {
    compound: true,
    layers: [
        { preset: 'blur',       params: { amount: '10px' } },
        { preset: 'color-tint', params: { color: 'rgba(180,0,0,0.35)' } },
    ],
});

screenEffectPresetRegistry.register('alert-yellow', {
    compound: true,
    layers: [
        { preset: 'blur',       params: { amount: '8px' } },
        { preset: 'color-tint', params: { color: 'rgba(200,160,0,0.35)' } },
    ],
});

screenEffectPresetRegistry.register('alert-blue', {
    compound: true,
    layers: [
        { preset: 'blur',       params: { amount: '8px' } },
        { preset: 'color-tint', params: { color: 'rgba(0,80,200,0.35)' } },
    ],
});

screenEffectPresetRegistry.register('alert-gray', {
    compound: true,
    layers: [
        { preset: 'blur',       params: { amount: '6px' } },
        { preset: 'color-tint', params: { color: 'rgba(80,80,80,0.40)' } },
    ],
});

screenEffectPresetRegistry.register('alert-black', {
    compound: true,
    layers: [
        { preset: 'blur',       params: { amount: '4px' } },
        { preset: 'color-tint', params: { color: 'rgba(0,0,0,0.60)' } },
    ],
});
