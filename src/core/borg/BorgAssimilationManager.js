/**
 * @fileoverview BorgAssimilationManager — orchestrates the Borg assimilation Easter egg.
 *
 * Coordinates five systems in sequence:
 *   1. Alert palette swap → `borg_alert` via ThemeManager
 *   2. Font injection     → `borgFontAssimilation.injectBorgFont()`
 *   3. Canvas intro       → `borg-assimilation` SEM preset, persistent until the user
 *                           clicks anywhere on the canvas (or an optional timeout fires)
 *   4. Persistent effects → zero or more SEM presets applied after the intro is dismissed
 *   5. Deassimilation     → glitch outro, palette + font revert, SEM clear
 *
 * Exposed on `window.lcards.core.borgAssimilationManager` and accessed via the
 * `window.lcards.borg.*` console API defined in `src/lcards.js`.
 *
 * @module core/borg/BorgAssimilationManager
 */

import { BaseService      } from '../BaseService.js';
import { lcardsLog        } from '../../utils/lcards-logging.js';
import { injectBorgFont, revertBorgFont } from '../themes/borgFontAssimilation.js';
import {
    setAlertModeTransformParameter,
    getAlertModeTransform,
    resetAlertModeTransform,
} from '../themes/alertModeTransform.js';

/**
 * Default layers for each stage of the assimilation/deassimilation sequence.
 *
 * All three stages use the same layers dict format as `lcards.trigger_effect`:
 *   { slot: { preset, ...params } }
 *
 * `intro.canvas` is special — the preset is always hardcoded to `borg-assimilation`;
 * any `preset` key the caller includes is silently ignored for that slot.
 * `intro.backdrop` and `intro.color` go through sem.applySlot() normally.
 */
const DEFAULTS = {
    /**
     * Intro layers. Canvas params (siteCount, tendrilsPerSite, etc.) are forwarded
     * to the hardcoded `borg-assimilation` SEM effect. Backdrop/color are optional
     * supplementary effects shown alongside the intro and cleared on dismiss.
     */
    intro: {
        canvas: { siteCount: 8, tendrilsPerSite: 5, tendrilLength: 600, particleCount: 2, color: 'var(--lcars-martian)', glowColor: 'var(--lcards-yellow)' },
        backdrop: { preset: 'saturate', amount: '200%' },
        color:    { preset: 'color-tint', color: 'rgba(0,60,0,0.25)' },
    },

    /**
     * Layers applied as the deassimilation outro before palette revert.
     * Same format as trigger_effect layers. `duration` inside each layer's
     * params is used to compute how long to wait before proceeding.
     */
    outroLayers: {
        canvas: { preset: 'glitch', duration: 1200, intensity: 0.4, opacity: 0.7 },
    },

    /** Fallback wait time (ms) when no outro layer specifies a duration. */
    outroDuration: 1200,

    /**
     * Persistent layers applied after the canvas intro is dismissed.
     * Same format as trigger_effect layers: { slot: { preset, ...params } }
     */
    persistentLayers: {
        canvas:   { preset: 'glitch',      intensity: 0.08, maxShift: 400, bandHeight: 3, fps: 20 },
        color:    { preset: 'color-tint',  color: 'rgba(0, 60, 0, 0.10)' },
        backdrop: { preset: 'saturate',    amount: '200%' },
    },
};

export class BorgAssimilationManager extends BaseService {

    constructor() {
        super();
        /** @type {boolean} */
        this._assimilated = false;
        /**
         * Stored dismiss callback while the canvas intro is showing.
         * Allows deassimilate() to cancel the intro immediately without waiting
         * for a user click.
         * @type {(() => void)|null}
         */
        this._introDismiss = null;
        /**
         * Tracks whether the font was actually swapped so deassimilate() knows
         * whether to call revertBorgFont().
         * @type {boolean}
         */
        this._fontWasSwapped = false;
    }

    // ── Public API ────────────────────────────────────────────────────────────

    /**
     * Begin the full Borg assimilation sequence.
     *
     * Steps (in order):
     *   • Palette + font swap fire immediately (non-blocking)
     *   • Intro layers are applied: canvas is hardcoded to `borg-assimilation`;
     *     backdrop/color are optional supplementary effects
     *   • Awaits click-to-dismiss (or optional timeout)
     *   • All intro layers cleared
     *   • Persistent layers applied
     *
     * All layer params use the same format as `lcards.trigger_effect`:
     *   { slot: { preset, ...params } }
     *
     * The `canvas` key of `intro` is special: `preset` is always hardcoded to
     * `borg-assimilation` and any `preset` key is silently ignored. All other
     * keys (siteCount, tendrilsPerSite, color, …) are forwarded as effect params.
     *
     * @param {Object}  [opts]
     * @param {number}  [opts.duration=0]                       Auto-dismiss timeout in ms.
     *                                                          0 (default) = click-to-dismiss only.
     * @param {string}  [opts.transitionStyle='flash']          Palette transition style.
     *                                                          One of: 'flash', 'fade_only', 'blur_fade', 'off'.
     * @param {Object}  [opts.intro]                            Intro layers. Merged per-slot with DEFAULTS.intro.
     *                                                          e.g. { canvas: { siteCount: 12 },
     *                                                                 backdrop: { preset: 'blur', amount: '8px' } }
     * @param {Object}  [opts.persistentLayers]                 Layers applied after the intro.
     *                                                          Omit to use DEFAULTS.persistentLayers;
     *                                                          pass {} to suppress all persistent effects.
     *                                                          e.g. { color: { preset: 'color-tint', color: '...' } }
     * @param {number|null} [opts.paletteHue=null]              Override the borg_alert palette hue (0–359°).
     *                                                          null = use the built-in default (110 = yellow-green).
     * @param {boolean}     [opts.fontSwap=true]                Whether to inject the Borg typeface.
     *                                                          Set to `false` to keep the existing dashboard font
     *                                                          while all other assimilation effects still run.
     * @returns {Promise<void>}
     */
    async assimilate(opts = {}) {
        const {
            duration         = 0,
            transitionStyle  = 'blur_fade',
            intro,                       // undefined → use DEFAULTS.intro
            persistentLayers,            // undefined → use DEFAULTS.persistentLayers
            paletteHue       = null,     // null → use alertModeTransform default (110°)
            fontSwap         = true,     // false = skip font injection
        } = opts;

        if (this._assimilated) {
            lcardsLog.warn('[BorgAssimilationManager] Already assimilated — call deassimilate() first');
            return;
        }

        this._assimilated = true;
        lcardsLog.info('[BorgAssimilationManager] Initiating Borg assimilation sequence…');

        const tm  = window.lcards?.core?.themeManager;
        const sem = window.lcards?.core?.screenEffectManager;

        // ── Apply palette hue override before the swap so it takes effect immediately ─
        if (paletteHue != null) {
            const existing = getAlertModeTransform('borg_alert') ?? {};
            setAlertModeTransformParameter('borg_alert', 'hueShift', paletteHue);
            setAlertModeTransformParameter('borg_alert', 'hueAnchor', {
                ...(existing.hueAnchor ?? {}),
                centerHue: paletteHue,
            });
        }

        // ── Step 1 & 2: palette swap + font (fire-and-forget, run in parallel) ─
        const palettePromise = tm
            ? tm.setAlertMode('borg_alert', { transitionStyle })
            : Promise.resolve();
        this._fontWasSwapped = fontSwap;
        const fontPromise = fontSwap ? injectBorgFont() : Promise.resolve();

        // ── Step 3: intro layers (persistent — awaited until click or timeout) ─
        if (sem) {
            // Merge caller intro per-slot over defaults.
            const introLayers = {
                ...DEFAULTS.intro,
                ...(intro ?? {}),
                canvas: { ...DEFAULTS.intro.canvas, ...((intro ?? {}).canvas ?? {}) },
            };

            // Canvas: always uses the hardcoded borg-assimilation preset.
            const { preset: _ignored, ...canvasParams } = introLayers.canvas;
            sem.apply('borg-assimilation', canvasParams);

            // Backdrop + color: user-defined supplementary layers (optional).
            for (const slot of ['backdrop', 'color']) {
                const layerCfg = introLayers[slot];
                if (layerCfg?.preset) {
                    const { preset, ...params } = layerCfg;
                    sem.applySlot(slot, preset, params);
                }
            }

            // Enable click-to-dismiss on the canvas slot element.
            const canvasEl = sem.portal?.querySelector('[data-lcards-se-slot="canvas"]');
            if (canvasEl) canvasEl.style.pointerEvents = 'auto';

            await new Promise(resolve => {
                let timer = null;

                const dismiss = () => {
                    if (canvasEl) {
                        canvasEl.removeEventListener('click', dismiss);
                        canvasEl.style.pointerEvents = 'none';
                    }
                    if (timer !== null) { clearTimeout(timer); timer = null; }
                    this._introDismiss = null;
                    resolve();
                };

                this._introDismiss = dismiss;
                canvasEl?.addEventListener('click', dismiss);
                if (duration > 0) timer = setTimeout(dismiss, duration);
            });

            // Clear all intro layers.
            sem.clearSlot('canvas');
            sem.clearSlot('backdrop');
            sem.clearSlot('color');
        }

        // Wait for palette + font to finish before applying persistent layers.
        await Promise.allSettled([palettePromise, fontPromise]);

        // ── Step 4: persistent layers (only if still assimilated) ────────────
        if (!this._assimilated) {
            lcardsLog.debug('[BorgAssimilationManager] Deassimilation occurred during intro — skipping persistent layers');
            return;
        }

        const layers = persistentLayers ?? DEFAULTS.persistentLayers;
        if (sem) {
            for (const [slot, layerCfg] of Object.entries(layers)) {
                if (layerCfg?.preset) {
                    const { preset, ...params } = layerCfg;
                    sem.applySlot(slot, preset, params);
                }
            }
        }

        lcardsLog.info('[BorgAssimilationManager] 🟢 Assimilation complete. Resistance is futile.');
    }

    /**
     * Reverse the assimilation — restore palette, font, and clear all SEM effects.
     *
     * Outro uses the same layers format as `lcards.trigger_effect`:
     *   { slot: { preset, ...params } }
     * The `duration` key inside any layer's params determines how long to wait
     * before proceeding to palette revert. The longest duration among all layers
     * is used; falls back to DEFAULTS.outroDuration if none is specified.
     *
     * @param {Object}  [opts]
     * @param {boolean} [opts.withOutro=true]                    Play outro layers before reverting.
     * @param {Object}  [opts.outroLayers]                       Layers dict for the outro.
     *                                                           Omit to use DEFAULTS.outroLayers.
     *                                                           e.g. { canvas: { preset: 'glitch', duration: 800 } }
     * @param {string}  [opts.revertTransitionStyle='fade_only']  Palette transition back to normal.
     *                                                           One of: 'flash', 'fade_only', 'blur_fade', 'off'.
     * @returns {Promise<void>}
     */
    async deassimilate(opts = {}) {
        const {
            withOutro             = true,
            outroLayers,                  // undefined → use DEFAULTS.outroLayers
            revertTransitionStyle = 'fade_only',
        } = opts;

        if (!this._assimilated) {
            lcardsLog.warn('[BorgAssimilationManager] Not currently assimilated — nothing to revert');
            return;
        }

        // Mark false first so any in-flight assimilate() persistent-layer guard fires.
        this._assimilated = false;

        // If the canvas intro is still showing, dismiss it immediately so assimilate()
        // doesn't hang waiting for a user click that will never come.
        if (this._introDismiss) {
            this._introDismiss();
            this._introDismiss = null;
        }

        lcardsLog.info('[BorgAssimilationManager] Initiating deassimilation sequence…');

        const tm  = window.lcards?.core?.themeManager;
        const sem = window.lcards?.core?.screenEffectManager;

        // ── Optional outro ────────────────────────────────────────────────────
        if (withOutro && sem) {
            const layers = outroLayers ?? DEFAULTS.outroLayers;

            // Apply each outro layer.
            for (const [slot, layerCfg] of Object.entries(layers)) {
                if (layerCfg?.preset) {
                    const { preset, ...params } = layerCfg;
                    sem.applySlot(slot, preset, params);
                }
            }

            // Wait for the longest duration found in any layer's params.
            const maxDuration = Math.max(
                DEFAULTS.outroDuration,
                ...Object.values(layers).map(l => l?.duration ?? 0),
            );
            await new Promise(r => setTimeout(r, maxDuration));
        }

        // ── Revert palette → font → SEM (in that order to minimise FOUC) ─────
        // Reset any runtime hue override so the next assimilation starts clean.
        resetAlertModeTransform('borg_alert');
        if (tm) {
            await tm.setAlertMode('green_alert', { transitionStyle: revertTransitionStyle });
        }
        if (this._fontWasSwapped) {
            revertBorgFont();
            this._fontWasSwapped = false;
        }
        if (sem) {
            sem.clear();
        }

        lcardsLog.info('[BorgAssimilationManager] 🟢 Borg signature neutralised. Systems restored.');
    }

    /**
     * Whether the assimilation mode is currently active.
     * @type {boolean}
     */
    get isAssimilated() {
        return this._assimilated;
    }
}
