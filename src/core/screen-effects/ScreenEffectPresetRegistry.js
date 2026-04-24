/**
 * @fileoverview ScreenEffectPresetRegistry — named preset library for screen-wide effects.
 *
 * Works analogously to the animation preset registry
 * (`core/animation/presets.js`) but targets full-screen overlay slots managed
 * by `ScreenEffectManager`.
 *
 * ## Preset shape
 *
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
//
// Each preset may optionally declare:
//   label         — human-readable name shown in the visual editor dropdown.
//   params_schema — array of param field specs consumed by the editor:
//                   { key, type, label, [placeholder], [helper],
//                     [min], [max], [step] }
//                   type values: 'text' | 'color-text' | 'number'
// ─────────────────────────────────────────────────────────────────────────────

// ── Backdrop (CSS backdrop-filter) ───────────────────────────────────────────

screenEffectPresetRegistry.register('blur', {
    label:  'Blur',
    slot:   'backdrop',
    defaults: { amount: '8px' },
    params_schema: [
        { key: 'amount', type: 'text', label: 'Blur Amount', placeholder: '8px',
          helper: 'CSS blur value — e.g. 4px (subtle), 8px (standard), 20px (heavy)' },
    ],
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
    label:  'Saturate',
    slot:   'backdrop',
    defaults: { amount: '200%' },
    params_schema: [
        { key: 'amount', type: 'text', label: 'Amount', placeholder: '200%',
          helper: 'CSS saturate value — e.g. 150%, 200%, 300%' },
    ],
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
    label:  'Grayscale',
    slot:   'backdrop',
    defaults: { amount: '100%' },
    params_schema: [
        { key: 'amount', type: 'text', label: 'Amount', placeholder: '100%',
          helper: 'CSS grayscale amount — 100% = full grayscale, 0% = no effect' },
    ],
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
    label:  'Contrast',
    slot:   'backdrop',
    defaults: { amount: '200%' },
    params_schema: [
        { key: 'amount', type: 'text', label: 'Amount', placeholder: '200%',
          helper: 'CSS contrast value — e.g. 150%, 200%' },
    ],
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
    label:  'Hue Rotate',
    slot:   'backdrop',
    defaults: { angle: '180deg' },
    params_schema: [
        { key: 'angle', type: 'text', label: 'Angle', placeholder: '180deg',
          helper: 'CSS hue-rotate angle — e.g. 90deg, 180deg, 270deg' },
    ],
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
    label:  'Color Tint',
    slot:   'color',
    defaults: { color: 'rgba(0,0,0,0.5)' },
    params_schema: [
        { key: 'color', type: 'color-text', label: 'Tint Color', placeholder: 'rgba(0,0,0,0.5)',
          helper: 'CSS colour — use rgba() to control opacity via the alpha channel, e.g. rgba(180,0,0,0.4)' },
    ],
    enter(el, params) {
        el.style.background = params.color ?? 'rgba(0,0,0,0.5)';
        return () => { el.style.background = ''; };
    },
});

screenEffectPresetRegistry.register('vignette', {
    label:  'Vignette',
    slot:   'color',
    defaults: { opacity: 0.7 },
    params_schema: [
        { key: 'opacity', type: 'number', label: 'Opacity', min: 0, max: 1, step: 0.05,
          helper: 'Edge darkness strength (0–1)' },
    ],
    enter(el, params) {
        const op = params.opacity ?? 0.7;
        el.style.background = `radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,${op}) 100%)`;
        return () => { el.style.background = ''; };
    },
});

// ── Canvas effects ────────────────────────────────────────────────────────────

screenEffectPresetRegistry.register('static', {
    label:  'Static (TV Noise)',
    slot:   'canvas',
    defaults: { opacity: 0.55, scale: 4 },
    params_schema: [
        { key: 'opacity', type: 'number', label: 'Opacity',    min: 0, max: 1,  step: 0.05,
          helper: 'Overall effect opacity (0–1)' },
        { key: 'scale',   type: 'number', label: 'Grain Scale', min: 1, max: 16, step: 1,
          helper: 'Pixel grain size — larger = chunkier noise' },
    ],
    enter: StaticEffect,
});

screenEffectPresetRegistry.register('pixelate', {
    label:  'Pixelate',
    slot:   'canvas',
    defaults: { pixelSize: 8, opacity: 0.75, variance: 0.35, baseLight: 80 },
    params_schema: [
        { key: 'pixelSize',  type: 'number', label: 'Pixel Size',      min: 2,   max: 64,  step: 2,
          helper: 'Size of each mosaic pixel block' },
        { key: 'opacity',    type: 'number', label: 'Opacity',          min: 0,   max: 1,   step: 0.05,
          helper: 'Overall effect opacity' },
        { key: 'variance',   type: 'number', label: 'Light Variance',   min: 0,   max: 1,   step: 0.05,
          helper: 'Brightness variation between blocks (0 = uniform)' },
        { key: 'baseLight',  type: 'number', label: 'Base Lightness',   min: 0,   max: 255, step: 5,
          helper: 'Base gray level (0 = black, 255 = white, 80 ≈ dark gray)' },
    ],
    enter: PixelateEffect,
});

screenEffectPresetRegistry.register('glitch', {
    label:  'Glitch',
    slot:   'canvas',
    defaults: { intensity: 0.08, maxShift: 40, bandHeight: 4, opacity: 0.85, fps: 20 },
    params_schema: [
        { key: 'intensity',  type: 'number', label: 'Intensity',   min: 0.01, max: 0.5,  step: 0.01,
          helper: 'Fraction of lines displaced per frame (0.01–0.5)' },
        { key: 'maxShift',   type: 'number', label: 'Max Shift',   min: 1,    max: 200,  step: 1,
          helper: 'Maximum horizontal displacement in pixels' },
        { key: 'bandHeight', type: 'number', label: 'Band Height', min: 1,    max: 32,   step: 1,
          helper: 'Height of each glitch strip in pixels' },
        { key: 'opacity',    type: 'number', label: 'Opacity',     min: 0,    max: 1,    step: 0.05,
          helper: 'Overall effect opacity' },
        { key: 'fps',        type: 'number', label: 'FPS',         min: 1,    max: 60,   step: 1,
          helper: 'Animation frame rate' },
    ],
    enter: GlitchEffect,
});

screenEffectPresetRegistry.register('scanlines', {
    label:  'Scanlines',
    slot:   'canvas',
    defaults: { lineHeight: 4, opacity: 0.25, scroll: 0 },
    params_schema: [
        { key: 'lineHeight', type: 'number', label: 'Line Height', min: 1, max: 20, step: 1,
          helper: 'Height of each scanline in pixels' },
        { key: 'opacity',    type: 'number', label: 'Opacity',     min: 0, max: 1,  step: 0.05,
          helper: 'Darkness of the scanline bands (0–1)' },
        { key: 'scroll',     type: 'number', label: 'Scroll Speed', min: 0, max: 10, step: 0.5,
          helper: 'Scroll speed — 0 = static lines' },
    ],
    enter: ScanlineEffect,
});

