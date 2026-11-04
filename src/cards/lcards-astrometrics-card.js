/**
 * LCARdS Astrometrics Card
 *
 * A 3D scene in the style of the astrometrics lab and stellar cartography:
 * grids (sector maps, galaxy discs, sky domes), see-through territory
 * volumes, globes, orbits, routes and beams, with named points that carry
 * LCARS labels and markers. Drag to orbit, wheel or pinch to zoom, tap a
 * point to fly to it, fly between named views.
 *
 * The scene runtime (src/core/astrometrics/, with three.js) is a lazy chunk
 * loaded on first render; it draws on demand through the page's one shared
 * WebGL context, so an idle card costs nothing. This card passes it the
 * config, hass and a colour resolver, runs the point and object actions, and
 * puts an optional `background_animation` behind the scene (flat: any
 * background preset, as on the MSD card).
 *
 * @example
 * ```yaml
 * type: custom:lcards-astrometrics-card
 * height: 400
 * camera:
 *   views:
 *     galaxy: { target: core, yaw: 20, tilt: 35, distance: 260 }
 * points:
 *   - { id: core, xyz: [0, 0, 0], label: GALACTIC CORE, style: title }
 *   - { id: vega, polar: [64, 160], marker: triangle, label: Vega }
 * objects:
 *   - { type: grid, shape: disc, radius: 100, ring_labels: { step: 30 } }
 *   - { type: glow, at: core, size: 50 }
 * ```
 *
 * @see doc/cards/astrometrics/
 */

import { html, svg, css } from 'lit';
import { LCARdSCard } from '../base/LCARdSCard.js';
import { lcardsLog } from '../utils/lcards-logging.js';
import { resolveColor } from '../core/themes/resolve-color.js';
import { BackgroundAnimationRenderer } from '../core/packs/backgrounds/BackgroundAnimationRenderer.js';
import { WarpDrive, warpOn } from '../core/astrometrics/warp-drive.js';
import { resolveStateColor } from '../utils/state-color-resolver.js';
import { deepMergeImmutable } from '../utils/deepMerge.js';
import { flattenSystems } from '../core/astrometrics/names.js';
import { registerAstrometricsCard, unregisterAstrometricsCard } from './astrometrics-registry.js';
import { cameraButtonLayout, timeMode, BUTTONS_IDLE_MS, TIME_STOPS, timeStop, PAD_AREAS, dpadPaths, padTokenStyle } from './astrometrics-buttons.js';
import { DATE_STOPS, dateStop, formatSceneDate, LIVE_RATE } from '../core/astrometrics/clock.js';
import { createHuiCardWrapper, createCardElement, applyHassToCard, applyCardConfig } from '../utils/ha-card-factory.js';

/** Keys a rules engine patch carries besides the patch itself */
const PATCH_META = new Set(['id', 'ruleId', 'ruleCondition']);

/**
 * The sky as label templates see it: angles to one decimal (a token such as
 * `{sky.sun.altitude}` cannot format a number), illumination in whole percent.
 * @param {import('../core/astrometrics/sky.js').SkyState | null} sky
 */
function templateSky(sky) {
    if (!sky) return null;
    const r1 = (/** @type {number} */ n) => Math.round(n * 10) / 10;
    return {
        sun: { azimuth: r1(sky.sun.azimuth), altitude: r1(sky.sun.altitude) },
        moon: { azimuth: r1(sky.moon.azimuth), altitude: r1(sky.moon.altitude), illumination: sky.moon.illumination, waxing: sky.moon.waxing },
        time: sky.time
    };
}

/**
 * A rule patch as point / object keys: the engine's metadata dropped, and an
 * MSD-style `style: { ... }` object spread (a string style is the label style).
 * @param {Record<string, any>} patch
 */
function normalizeScenePatch(patch) {
    /** @type {Record<string, any>} */
    const out = {};
    for (const [k, v] of Object.entries(patch ?? {})) {
        if (PATCH_META.has(k)) continue;
        if (k === 'style' && v && typeof v === 'object' && !Array.isArray(v)) Object.assign(out, v);
        else out[k] = v;
    }
    return out;
}

/** Config keys the scene reads; a change to anything else does not rebuild it */
/**
 * Taps on reset: the first waits RESET_TAP_MS for a second (one tap resets the view; Home Assistant waits
 * 250 ms for a double tap, this is kinder), and once a second has come no reset is coming, so the third
 * and fourth may take RESET_SEQUENCE_MS each: four in a row play the tribute at an easy pace
 */
const RESET_TAP_MS = 500;
const RESET_SEQUENCE_MS = 900;

const SCENE_KEYS = ['camera', 'backdrop', 'labels', 'points', 'objects', 'units', 'time_scale', 'clock', 'look', 'model_scale'];

/** Shown when the scene cannot draw, by the runtime's failure reason */
const FAILURES = {
    'no webgl': 'This browser has no WebGL, which the 3D view needs.',
    'context lost': 'The graphics context was lost. Reload the page to restart the view.',
    'render failed': 'The scene could not be drawn. Reload the page to try again.',
    'load failed': 'The 3D view could not be loaded. Reload the page to try again.'
};

/** @type {Promise<typeof import('../core/astrometrics/index.js')> | null} */
let runtimePromise = null;

/**
 * Load the scene runtime (and three.js) on first use. A failed load is not
 * cached, so a later render can try again.
 */
function loadRuntime() {
    runtimePromise ??= import('../core/astrometrics/index.js').catch((error) => {
        runtimePromise = null;
        throw error;
    });
    return runtimePromise;
}

/** @type {Promise<boolean> | null} */
let schemaPromise = null;

/**
 * Register the card's schema with CoreConfigManager, loading it on first use:
 * it is large (every object type) and most dashboards have no astrometrics
 * card, so it stays out of the main chunk. Resolves true once registered;
 * a failure (or no config manager yet) is not cached.
 * @returns {Promise<boolean>}
 */
export function ensureAstrometricsSchema() {
    schemaPromise ??= import('./schemas/astrometrics-schema.js').then(({ astrometricsSchema }) => {
        const configManager = window.lcards?.core?.configManager;
        if (!configManager) {
            schemaPromise = null;
            return false;
        }
        configManager.registerCardSchema('astrometrics', astrometricsSchema, { version: __LCARDS_VERSION__ });
        return true;
    }).catch((error) => {
        lcardsLog.warn('[LCARdSAstrometricsCard] Could not load the card schema:', error);
        schemaPromise = null;
        return false;
    });
    return schemaPromise;
}

export class LCARdSAstrometricsCard extends LCARdSCard {
    static CARD_TYPE = 'astrometrics';

    static get properties() {
        return {
            ...super.properties,
            _failure: { type: String, state: true },
            _pick: { type: Object, state: true },
            _buttonsIdle: { type: Boolean, state: true },
            _buttonsFolded: { type: Boolean, state: true },
            _timeScale: { type: Number, state: true },
            _clockText: { type: String, state: true },
            _clockRate: { type: Number, state: true },
            _timeShows: { type: String, state: true },
            _modelScale: { type: String, state: true },
            _hasRealModels: { type: Boolean, state: true }
        };
    }

    static get styles() {
        return [
            super.styles,
            css`
                :host {
                    display: block;
                    min-height: 120px;
                }
                .astro-card {
                    position: relative;
                    width: 100%;
                    height: 100%;
                    overflow: hidden;
                }
                .astro-bg,
                .astro-warp,
                .astro-host {
                    position: absolute;
                    inset: 0;
                }
                .astro-bg,
                .astro-warp {
                    pointer-events: none;
                }
                .astro-buttons {
                    position: absolute;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: var(--ha-space-2, 8px);
                    width: var(--pad-size, 180px);
                    margin: var(--ha-space-3, 12px);
                    z-index: 1;
                }
                .astro-buttons[data-pos^='top'] { top: 0; }
                .astro-buttons[data-pos^='bottom'] { bottom: 0; }
                .astro-buttons[data-pos$='left'] { left: 0; align-items: flex-start; }
                .astro-buttons[data-pos$='right'] { right: 0; align-items: flex-end; }
                .astro-buttons[data-pos^='center'] { top: 50%; translate: 0 -50%; }
                .astro-buttons[data-pos$='center'] { left: 50%; translate: -50% 0; }
                .astro-buttons[data-pos='center'] { translate: -50% -50%; }
                .astro-buttons {
                    transition: opacity var(--ha-animation-duration-normal, 0.2s);
                }
                .astro-buttons[data-idle] {
                    opacity: 0;
                    pointer-events: none;
                }
                @media (prefers-reduced-motion: reduce) {
                    .astro-buttons { transition: none; }
                    .astro-pad path.seg { transition: none; }
                }
                /* the LCARdS D-pad (camera pad): its paths in the D-pad theme tokens' colours */
                .astro-pad {
                    position: relative;
                    width: var(--pad-size, 180px);
                    height: var(--pad-size, 180px);
                }
                .astro-pad svg {
                    display: block;
                    width: 100%;
                    height: 100%;
                }
                .astro-pad path.seg {
                    fill: var(--pad-k-fill-rest);
                    stroke: var(--pad-k-stroke-rest);
                    stroke-width: var(--pad-k-width-rest);
                    transition: fill var(--ha-animation-duration-fast, 0.15s);
                }
                .astro-pad path.seg.hover {
                    fill: var(--pad-k-fill-hover);
                    stroke: var(--pad-k-stroke-hover);
                    stroke-width: var(--pad-k-width-hover);
                }
                .astro-pad path.seg.pressed {
                    fill: var(--pad-k-fill-pressed);
                    stroke: var(--pad-k-stroke-pressed);
                    stroke-width: var(--pad-k-width-pressed);
                }
                .astro-pad path.seg.off {
                    fill: var(--pad-k-fill-off);
                    stroke: var(--pad-k-stroke-off);
                    stroke-width: var(--pad-k-width-off);
                    opacity: 0.5;
                }
                .astro-pad path.glyph {
                    fill: none;
                    stroke: var(--pad-k-glyph);
                    stroke-width: 2.5;
                    stroke-linecap: round;
                    stroke-linejoin: round;
                    pointer-events: none;
                }
                /* an arm's tip is small: its mark (on the centre's plus) lights in the tip's colour with it */
                .astro-pad path.glyph[data-kind='directional'].hover,
                .astro-pad path.glyph[data-kind='directional'].pressed { stroke: var(--pad-k-fill-rest); }
                .astro-pad [data-kind='directional'] {
                    --pad-k-fill-rest: var(--pad-directional-fill-rest, var(--lcars-card-button, var(--lcards-gray-medium)));
                    --pad-k-stroke-rest: var(--pad-directional-stroke-rest, var(--lcars-background-color, black));
                    --pad-k-width-rest: var(--pad-directional-width-rest, 1);
                    --pad-k-fill-hover: var(--pad-directional-fill-hover, var(--pad-k-fill-rest));
                    --pad-k-stroke-hover: var(--pad-directional-stroke-hover, var(--pad-k-stroke-rest));
                    --pad-k-width-hover: var(--pad-directional-width-hover, var(--pad-k-width-rest));
                    --pad-k-fill-pressed: var(--pad-directional-fill-pressed, var(--pad-k-fill-hover));
                    --pad-k-stroke-pressed: var(--pad-directional-stroke-pressed, var(--pad-k-stroke-hover));
                    --pad-k-width-pressed: var(--pad-directional-width-pressed, var(--pad-k-width-hover));
                    --pad-k-fill-off: var(--pad-directional-fill-off, var(--lcards-gray-medium));
                    --pad-k-stroke-off: var(--pad-directional-stroke-off, none);
                    --pad-k-width-off: var(--pad-directional-width-off, 0.25);
                    --pad-k-glyph: var(--pad-directional-glyph, black);
                }
                .astro-pad [data-kind='diagonal'] {
                    --pad-k-fill-rest: var(--pad-diagonal-fill-rest, var(--lcars-ui-secondary, var(--lcards-gray-medium-light)));
                    --pad-k-stroke-rest: var(--pad-diagonal-stroke-rest, var(--lcars-background-color, black));
                    --pad-k-width-rest: var(--pad-diagonal-width-rest, 1);
                    --pad-k-fill-hover: var(--pad-diagonal-fill-hover, var(--pad-k-fill-rest));
                    --pad-k-stroke-hover: var(--pad-diagonal-stroke-hover, var(--pad-k-stroke-rest));
                    --pad-k-width-hover: var(--pad-diagonal-width-hover, var(--pad-k-width-rest));
                    --pad-k-fill-pressed: var(--pad-diagonal-fill-pressed, var(--pad-k-fill-hover));
                    --pad-k-stroke-pressed: var(--pad-diagonal-stroke-pressed, var(--pad-k-stroke-hover));
                    --pad-k-width-pressed: var(--pad-diagonal-width-pressed, var(--pad-k-width-hover));
                    --pad-k-fill-off: var(--pad-diagonal-fill-off, var(--lcards-gray-medium));
                    --pad-k-stroke-off: var(--pad-diagonal-stroke-off, none);
                    --pad-k-width-off: var(--pad-diagonal-width-off, 0.25);
                    --pad-k-glyph: var(--pad-diagonal-glyph, black);
                }
                .astro-pad [data-kind='center'] {
                    --pad-k-fill-rest: var(--pad-center-fill-rest, var(--lcars-ui-primary, var(--lcards-gray-medium)));
                    --pad-k-stroke-rest: var(--pad-center-stroke-rest, var(--lcars-background-color, black));
                    --pad-k-width-rest: var(--pad-center-width-rest, 1);
                    --pad-k-fill-hover: var(--pad-center-fill-hover, var(--pad-k-fill-rest));
                    --pad-k-stroke-hover: var(--pad-center-stroke-hover, var(--pad-k-stroke-rest));
                    --pad-k-width-hover: var(--pad-center-width-hover, var(--pad-k-width-rest));
                    --pad-k-fill-pressed: var(--pad-center-fill-pressed, var(--pad-k-fill-hover));
                    --pad-k-stroke-pressed: var(--pad-center-stroke-pressed, var(--pad-k-stroke-hover));
                    --pad-k-width-pressed: var(--pad-center-width-pressed, var(--pad-k-width-hover));
                    --pad-k-fill-off: var(--pad-center-fill-off, var(--lcards-gray-medium));
                    --pad-k-stroke-off: var(--pad-center-stroke-off, none);
                    --pad-k-width-off: var(--pad-center-width-off, 0.25);
                    --pad-k-glyph: var(--pad-center-glyph, black);
                }
                /* input: a 3 x 3 grid of transparent buttons over the drawn pad */
                .astro-pad-hits {
                    position: absolute;
                    inset: 0;
                    display: grid;
                    grid-template-columns: repeat(3, 1fr);
                    grid-template-rows: repeat(3, 1fr);
                }
                .astro-pad-hits button {
                    padding: 0;
                    border: none;
                    border-radius: var(--ha-border-radius-md, 8px);
                    background: transparent;
                    cursor: pointer;
                    touch-action: none;
                    -webkit-tap-highlight-color: transparent;
                }
                /* browsers still send pointer events to disabled buttons */
                .astro-pad-hits button:disabled { cursor: default; pointer-events: none; }
                .astro-pad-hits button:focus-visible { outline: var(--ha-border-width-md) solid var(--primary-color); outline-offset: -2px; }
                .astro-fold {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    width: 32px;
                    height: 32px;
                    padding: 0;
                    border: none;
                    border-radius: var(--ha-border-radius-pill, 9999px);
                    background: var(--lcars-ui-tertiary, var(--lcards-gray-medium-light));
                    color: var(--primary-background-color);
                    cursor: pointer;
                    opacity: 0.85;
                }
                .astro-fold:hover,
                .astro-fold:focus-visible { opacity: 1; }
                /* the model size button: an LCARS bar in the pad's centre colour, its arms' colour while models are drawn larger */
                .astro-scale {
                    align-self: stretch;
                    height: 22px;
                    padding: 0 var(--ha-space-3, 12px);
                    border: none;
                    border-radius: var(--ha-border-radius-pill, 9999px);
                    background: var(--pad-center-fill-rest, var(--lcars-ui-primary, var(--lcards-gray-medium)));
                    color: var(--pad-directional-glyph, black);
                    font-family: var(--lcars-font, 'Antonio'), 'Antonio', sans-serif;
                    font-size: 14px;
                    text-transform: uppercase;
                    text-align: right;
                    cursor: pointer;
                }
                .astro-scale:hover { background: var(--pad-center-fill-hover, var(--lcars-ui-tertiary, var(--lcards-gray-light))); }
                .astro-scale[aria-pressed='true'] { background: var(--pad-directional-fill-rest, var(--lcars-card-button, var(--lcards-gray-medium))); }
                .astro-scale[aria-pressed='true']:hover { background: var(--pad-directional-fill-hover, var(--lcars-ui-tertiary, var(--lcards-gray-light))); }
                .astro-scale:focus-visible { outline: var(--ha-border-width-md) solid var(--primary-color); outline-offset: 1px; }
                .astro-fold:focus-visible { outline: var(--ha-border-width-md) solid var(--primary-color); outline-offset: 1px; }
                /* the time slider as an LCARS bar: a rounded cap, a flat track filling in the
                   button colour with a block thumb, the value in a rounded block; segments
                   apart by a gap, colours from the slider and D-pad theme tokens */
                .astro-time {
                    --bar: 22px;
                    --bar-gap: 3px;
                    --bar-cap: var(--pad-center-fill-rest, var(--lcars-ui-primary, var(--lcards-gray-medium)));
                    --bar-value: var(--pad-directional-fill-rest, var(--lcars-card-button, var(--lcards-gray-medium)));
                    --bar-track: var(--pad-track, var(--lcars-card-button-off, var(--lcards-gray-medium-dark)));
                    --bar-fill: var(--pad-track-fill, var(--lcars-card-button, var(--lcards-gray-medium)));
                    --bar-thumb: var(--pad-directional-fill-hover, var(--lcars-ui-tertiary, var(--lcards-gray-light)));
                    --bar-text: var(--pad-directional-glyph, black);
                    --bar-edge: var(--lcars-background-color, black);
                    align-self: stretch;
                    display: flex;
                    align-items: center;
                    gap: var(--bar-gap);
                    color: var(--bar-text);
                }
                .astro-time-cap,
                .astro-buttons .astro-time button.astro-time-swap {
                    flex: none;
                    width: 18px;
                    height: var(--bar);
                    padding: 0 0 0 4px;
                    border: none;
                    border-radius: var(--ha-border-radius-pill, 9999px) 0 0 var(--ha-border-radius-pill, 9999px);
                    background: var(--bar-cap);
                    color: var(--bar-text);
                }
                .astro-buttons .astro-time button.astro-time-swap {
                    width: 28px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                }
                .astro-time input {
                    flex: 1;
                    min-width: 0;
                    height: var(--bar);
                    margin: 0;
                    background: transparent;
                    -webkit-appearance: none;
                    appearance: none;
                    cursor: pointer;
                    touch-action: none;
                }
                .astro-time input:focus-visible { outline: var(--ha-border-width-md) solid var(--primary-color); outline-offset: 1px; }
                .astro-time input::-webkit-slider-runnable-track {
                    height: var(--bar);
                    background: linear-gradient(to right, var(--bar-fill) var(--p, 0%), var(--bar-track) var(--p, 0%));
                }
                .astro-time input::-webkit-slider-thumb {
                    -webkit-appearance: none;
                    width: 10px;
                    height: var(--bar);
                    border: var(--ha-border-width-md) solid var(--bar-edge);
                    background: var(--bar-thumb);
                }
                .astro-time input::-moz-range-track {
                    height: var(--bar);
                    background: var(--bar-track);
                }
                .astro-time input::-moz-range-progress {
                    height: var(--bar);
                    background: var(--bar-fill);
                }
                .astro-time input::-moz-range-thumb {
                    width: 10px;
                    height: var(--bar);
                    border: var(--ha-border-width-md) solid var(--bar-edge);
                    border-radius: 0;
                    background: var(--bar-thumb);
                }
                .astro-time-value {
                    flex: none;
                    display: flex;
                    align-items: center;
                    justify-content: flex-end;
                    min-width: 3ch;
                    height: var(--bar);
                    padding: 0 var(--ha-space-2, 8px) 0 var(--ha-space-1, 4px);
                    border-radius: 0 var(--ha-border-radius-pill, 9999px) var(--ha-border-radius-pill, 9999px) 0;
                    background: var(--bar-value);
                    font-family: var(--lcars-font, 'Antonio'), sans-serif;
                    font-size: 14px;
                    text-transform: uppercase;
                }
                /* the date panel and the switch need more room than the pad is wide:
                   wider, reaching away from the card edge the buttons sit on */
                .astro-time.astro-time-wide {
                    align-self: auto;
                    width: 232px;
                    flex: none;
                }
                .astro-date {
                    flex-direction: column;
                    align-items: stretch;
                }
                .astro-date-row {
                    display: flex;
                    align-items: center;
                    gap: var(--bar-gap);
                }
                /* the rate label keeps one width, so the slider does not jump as it changes */
                .astro-time-wide .astro-time-value:last-child {
                    min-width: 7ch;
                }
                .astro-date-text {
                    flex: 1;
                    display: flex;
                    align-items: center;
                    height: var(--bar);
                    padding: 0 var(--ha-space-2, 8px) 0 var(--ha-space-3, 12px);
                    border-radius: var(--ha-border-radius-pill, 9999px) 0 0 var(--ha-border-radius-pill, 9999px);
                    background: var(--bar-cap);
                    font-family: var(--lcars-font, 'Antonio'), sans-serif;
                    font-size: 14px;
                    white-space: nowrap;
                }
                .astro-buttons .astro-time button.astro-time-now {
                    flex: none;
                    height: var(--bar);
                    padding: 0 var(--ha-space-3, 12px) 0 var(--ha-space-2, 8px);
                    border: none;
                    border-radius: 0 var(--ha-border-radius-pill, 9999px) var(--ha-border-radius-pill, 9999px) 0;
                    background: var(--bar-value);
                    color: var(--bar-text);
                    font-family: var(--lcars-font, 'Antonio'), sans-serif;
                    font-size: 14px;
                    cursor: pointer;
                }
                .astro-time button:focus-visible { outline: var(--ha-border-width-md) solid var(--primary-color); outline-offset: 1px; }
                .astro-buttons .astro-time button svg {
                    width: 14px;
                    height: 14px;
                }
                .astro-fold svg,
                .astro-time svg {
                    width: 20px;
                    height: 20px;
                    fill: none;
                    stroke: currentColor;
                    stroke-width: 3;
                    stroke-linecap: round;
                    stroke-linejoin: round;
                }
                .astro-pick {
                    position: absolute;
                    top: var(--ha-space-2, 8px);
                    left: 50%;
                    translate: -50% 0;
                    z-index: 2;
                    display: flex;
                    align-items: center;
                    gap: var(--ha-space-3, 12px);
                    padding: var(--ha-space-1, 4px) var(--ha-space-1, 4px) var(--ha-space-1, 4px) var(--ha-space-4, 16px);
                    border-radius: var(--ha-border-radius-pill, 9999px);
                    background: var(--lcars-orange, var(--lcards-orange-medium));
                    color: var(--primary-background-color);
                    font-family: var(--lcars-font, 'Antonio'), sans-serif;
                    font-size: 16px;
                    letter-spacing: 1px;
                    pointer-events: auto;
                    white-space: nowrap;
                }
                .astro-pick button {
                    border: none;
                    border-radius: var(--ha-border-radius-pill, 9999px);
                    padding: var(--ha-space-1, 4px) var(--ha-space-3, 12px);
                    background: var(--primary-background-color);
                    color: var(--lcars-orange, var(--lcards-orange-medium));
                    font: inherit;
                    cursor: pointer;
                }
                .astro-failure {
                    position: absolute;
                    inset: 0;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    gap: var(--ha-space-2);
                    padding: var(--ha-space-4);
                    text-align: center;
                    font-family: var(--lcars-font, 'Antonio'), sans-serif;
                    color: var(--lcards-moonlight);
                }
                .astro-failure .title {
                    font-size: 22px;
                    letter-spacing: 1px;
                    color: var(--lcars-orange, var(--lcards-orange-medium));
                }
                .astro-failure .reason {
                    font-size: 14px;
                    opacity: 0.8;
                }
                .astro-preview {
                    width: 100%;
                    height: 100%;
                    display: block;
                }
                .astro-preview .grid {
                    fill: none;
                    stroke: var(--lcars-blue, var(--lcards-blue-medium));
                    stroke-width: 1;
                    opacity: 0.6;
                }
                .astro-preview .rim {
                    fill: none;
                    stroke: var(--lcars-orange, var(--lcards-orange-medium));
                    stroke-width: 2;
                }
                .astro-preview .core {
                    fill: var(--lcards-moonlight);
                }
                .astro-preview text {
                    fill: var(--lcards-moonlight);
                    font-family: var(--lcars-font, 'Antonio'), sans-serif;
                    font-size: 14px;
                    letter-spacing: 1px;
                }
            `
        ];
    }

    constructor() {
        super();
        /** @type {import('../core/astrometrics/scene-runtime.js').AstroSceneApi | null} */
        this._scene = null;
        /** @type {BackgroundAnimationRenderer | null} */
        this._backgroundRenderer = null;
        /** @type {string | null} why the scene cannot draw (a FAILURES key) */
        this._failure = null;
        /** `buttons.hide: idle`: the camera buttons have faded out */
        this._buttonsIdle = false;
        /** `buttons.hide: toggle`: folded away */
        this._buttonsFolded = false;
        /** @type {{ theme: string, style: string } | null} the pad's token colours (_padStyle) */
        this._padStyleCache = null;
        /** @type {number | null} the time slider's speed (null: the config's time_scale) */
        this._timeScale = null;
        /** The scene date as the time slider shows it (minutes), and its rate (days per second) */
        this._clockText = '';
        this._clockRate = LIVE_RATE;
        /** @type {'speed' | 'date'} what the time slider sets with `buttons.time: both` */
        this._timeShows = 'date';
        /** @type {{ date: number, rate: number, wall: number } | null} a date or rate the slider or an action set (kept when the scene is made again) */
        this._clockSet = null;
        /** @type {'real' | 'visible'} models at their real size, or drawn larger to stay visible (the size button) */
        this._modelScale = 'real';
        /** Whether any model is at its real size (the size button shows) */
        this._hasRealModels = false;
        /** @type {'real' | 'visible' | null} a model scale the button, the V key or an action set (kept when the scene is made again) */
        this._modelScaleSet = null;
        /** The config's model_scale the set one was made against (a config change drops it) */
        this._modelScaleCfg = 'real';
        /** @type {ReturnType<typeof setTimeout> | undefined} */
        this._buttonsTimer = undefined;
        /** A camera button is held (the buttons never fade meanwhile) */
        this._cameraHeld = false;
        this._sceneKey = '';
        this._backgroundKey = '';
        /** Bumped on every start and teardown, so a stale lazy load is dropped */
        this._sceneGeneration = 0;
        this._firstUpdateDone = false;
        this._inPicker = false;
        /** @type {typeof import('../core/astrometrics/index.js') | null} the loaded runtime module */
        this._runtime = null;
        /** @type {import('../core/astrometrics/point-data.js').LabelSource[]} labels the card resolves */
        this._labelSources = [];
        /** @type {Map<string, import('../core/astrometrics/scene-runtime.js').AstroLabelValues>} resolved, by point id */
        this._labelValues = new Map();
        /** @type {Map<string, number>} latest evaluation per field, so a slow (Jinja2) result never overwrites a newer one */
        this._labelSeq = new Map();
        /** @type {{ id: string, point: any, entityId: string }[]} points placed from entities */
        this._bindings = [];
        /** @type {Set<string>} points already warned about (binding without numbers) */
        this._bindingWarned = new Set();
        /** @type {{ points: Set<string>, objects: Set<string> }} ids registered as rule targets */
        this._sceneTargets = { points: new Set(), objects: new Set() };
        /** @type {any} the config _flat was made from */
        this._flatFor = undefined;
        /** @type {any} the config with systems flattened (_flatConfig) */
        this._flat = undefined;
        /** @type {Record<string, any>} the merged rule patch per point or object id */
        this._scenePatches = {};
        /** @type {import('../core/astrometrics/bindings.js').SettingBinding[]} settings that follow entities or templates (R4b) */
        this._settings = [];
        /** @type {Map<string, number | string | null>} each setting's value now, by bindingKey */
        this._settingValues = new Map();
        /** @type {Map<string, number>} latest evaluation per templated setting (a slow Jinja2 result never wins over a newer one) */
        this._settingSeq = new Map();
        /** @type {Set<string>} points and objects (scope:id) waiting to be patched with new setting values */
        this._settingDirty = new Set();
        /** @type {ReturnType<typeof setTimeout> | undefined} */
        this._settingTimer = undefined;
        /** @type {Map<string, number>} what each live setting with a `most` (a belt's bound count) was last built for, by bindingKey */
        this._settingMost = new Map();
        /** @type {Record<string, any> | null} camera.view as a guided tour ({ entity, views }) */
        this._tour = null;
        /** @type {{ entity: string, attribute?: string } | null} the look's entity (looks.js) */
        this._lookEntity = null;
        /** @type {{ entity: string, attribute?: string } | null} the entity that engages warp (warp-drive.js) */
        this._warpEntity = null;
        /** @type {{ entity: string, attribute?: string } | null} camera.warp's entity (fly-tos streak while it is on) */
        this._flightWarpEntity = null;
        /** @type {WarpDrive | null} made on the first engage */
        this._warp = null;
        /** @type {number | null} the warp factor from an entity or template */
        this._warpFactor = null;
        /** Whether the config (or its entity) wants warp, kept while the tribute drives it */
        this._warpWanted = false;
        /** Taps on reset in a row (RESET_TAP_MS, RESET_SEQUENCE_MS: one resets, four play the tribute) */
        this._resetTaps = 0;
        /** @type {ReturnType<typeof setTimeout> | undefined} */
        this._resetTimer = undefined;
        /** @type {{ stop: () => void, done: Promise<void>, seek: (ms: number) => void } | null} the tribute while it plays */
        this._tribute = null;
        /** @type {string | null} the tour stop flown to last (JSON) */
        this._tourAt = null;
        /** @type {{ pointId: string, form: string, object?: string, label: string, missed?: boolean, resolve: (value: number[] | string | null) => void } | null} picking a position for the Studio */
        this._pick = null;
        this._inEditDialog = false;
        /** @type {import('../core/astrometrics/scene-runtime.js').AstroEditHooks | null} the Astrometrics Studio's hooks (attachStudio) */
        this._studioHooks = null;
        /** @type {((scene: import('../core/astrometrics/scene-runtime.js').AstroSceneApi) => void)[]} waiting for the scene (studioScene) */
        this._sceneWaiters = [];
        this._onPickKey = this._onPickKey.bind(this);
    }

    /**
     * The first config of the page processes before the lazy schema has
     * arrived (it is not validated then); once it is registered, process
     * again so the config is validated.
     * @param {any} config
     */
    setConfig(config) {
        super.setConfig(config);
        if (schemaPromise) return;
        ensureAstrometricsSchema().then((registered) => {
            if (registered && this._rawConfig) this._reprocessForThemeChange();
        });
    }

    /** @protected */
    _handleFirstUpdate() {
        // LCARdSCard has no _handleFirstUpdate of its own
        this._registerOverlayForRules(this.config.id || `astrometrics-${this._cardGuid}`, 'astrometrics', this.config.tags || []);
        this._inPicker = this._checkForAncestor(['hui-card-picker']);
        this._firstUpdateDone = true;
        if (this._inPicker) {
            this.requestUpdate();
            return;
        }
        registerAstrometricsCard(this);
        this._inEditDialog = this._checkForAncestor(['hui-dialog-edit-card']);
        this._startScene();
    }

    /**
     * Back after a view switch: rebuild (the scene was disposed on disconnect).
     * @protected
     */
    async _onConnected() {
        await super._onConnected();
        if (this._firstUpdateDone && !this._inPicker && this.isConnected) registerAstrometricsCard(this);
        if (this._firstUpdateDone && !this._inPicker && !this._scene && this.isConnected) this._startScene();
    }

    /**
     * The scene-relevant part of the config (camera, backdrop, labels, points, objects).
     * @private
     */
    _sceneConfig() {
        /** @type {Record<string, any>} */
        const out = {};
        const flat = this._flatConfig();
        for (const key of SCENE_KEYS) if (flat?.[key] !== undefined) out[key] = flat[key];
        return out;
    }

    /**
     * The config with every system's points and objects in the card's own
     * lists (flattenSystems: ids are card-wide), worked out once per config.
     * @private
     * @returns {any}
     */
    _flatConfig() {
        if (this._flatFor !== this.config) {
            this._flatFor = this.config;
            this._flat = flattenSystems(this.config ?? {});
        }
        return this._flat;
    }

    /**
     * A scene config with the rule patches on its points and objects merged.
     * @private
     * @param {Record<string, any>} config
     */
    _withScenePatches(config) {
        const patches = this._scenePatches;
        const pick = (/** @type {any} */ item, /** @type {Set<string>} */ ids) =>
            item && item.id !== undefined && ids.has(String(item.id)) && patches[String(item.id)] ? deepMergeImmutable(item, patches[String(item.id)]) : item;
        const patched = !Object.keys(patches).length ? config : {
            ...config,
            ...(Array.isArray(config.points) ? { points: config.points.map((p) => pick(p, this._sceneTargets.points)) } : {}),
            ...(Array.isArray(config.objects) ? { objects: config.objects.map((o) => pick(o, this._sceneTargets.objects)) } : {})
        };
        return this._withSettingValues(patched);
    }

    /**
     * Settings that follow entities, as their values now (bindings.js settingConfig).
     * @private
     * @param {Record<string, any>} config
     */
    _withSettingValues(config) {
        return this._settings.length && this._runtime ? this._runtime.settingConfig(config, this._settings, this._settingValues) : config;
    }

    /**
     * Load the runtime and create the scene in the host element.
     * @private
     */
    async _startScene() {
        const generation = ++this._sceneGeneration;
        let runtime;
        try {
            runtime = await loadRuntime();
        } catch (error) {
            lcardsLog.error('[LCARdSAstrometricsCard] Could not load the scene runtime:', error);
            if (generation === this._sceneGeneration) this._failure = 'load failed';
            return;
        }
        await this.updateComplete;
        const host = /** @type {HTMLElement | null} */ (this.renderRoot.querySelector('.astro-host'));
        if (generation !== this._sceneGeneration || !this.isConnected || !host || this._scene) return;
        const config = this._sceneConfig();
        this._failure = null;
        this._sceneKey = JSON.stringify(config);
        this._runtime = runtime;
        this._scene = runtime.createAstroScene(host, this._withScenePatches(config), {
            hass: this.hass,
            resolveColor,
            onTap: (hit) => this._onSceneAction(hit, 'tap_action'),
            onHold: (hit) => { this._onSceneAction(hit, 'hold_action'); },
            onFail: (reason) => { this._failure = reason in FAILURES ? reason : 'render failed'; },
            onSky: () => { this._refreshLabels({ sky: true }); },
            onClock: (c) => this._onClock(c),
            onModelScale: (mode, has) => {
                this._modelScale = mode;
                this._hasRealModels = has;
                // the button, the V key or an action (not the config) set it: keep it when the scene is made again
                const fromConfig = this.config?.model_scale === 'visible' ? 'visible' : 'real';
                this._modelScaleSet = mode !== fromConfig ? mode : null;
                // the Studio's toolbar toggle follows it
                this.dispatchEvent(new CustomEvent('astro-model-scale', { detail: { mode, hasRealModels: has } }));
            },
            mountCard: (card) => this._mountPointCard(card),
            setCardHass: (el, hass) => this._setPointCardHass(el, hass)
        });
        if (this._studioHooks) this._scene.setEditMode(this._studioHooks);
        // a model scale set on screen stays, until the config's own changes
        const configScale = config?.model_scale === 'visible' ? 'visible' : 'real';
        if (configScale !== this._modelScaleCfg) {
            this._modelScaleCfg = configScale;
            this._modelScaleSet = null;
        }
        if (this._modelScaleSet) this._scene.setModelScale(this._modelScaleSet);
        // back after a view switch: the slider's speed and the date stay
        if (this._timeScale !== null) this._scene.setTimeScale(this._timeScale);
        if (this._clockSet) {
            const c = this._clockSet;
            this._scene.setClock({ date: c.date + (performance.now() - c.wall) * c.rate * 86400, rate: c.rate });
        }
        this._rebuildPointData();
        this._syncBackground();
        const waiters = this._sceneWaiters;
        this._sceneWaiters = [];
        for (const w of waiters) w(this._scene);
        lcardsLog.debug(`[LCARdSAstrometricsCard] Scene created for ${this.config?.id || this._cardGuid}`);
    }

    /**
     * Dispose the scene and the background layer.
     * @private
     */
    _stopScene() {
        this._sceneGeneration++;
        clearTimeout(this._settingTimer);
        this._settingTimer = undefined;
        this._settingDirty.clear();
        this._tourAt = null;
        this._scene?.dispose();
        this._scene = null;
        this._sceneKey = '';
        this._backgroundRenderer?.destroy();
        this._backgroundRenderer = null;
        this._backgroundKey = '';
        clearTimeout(this._resetTimer);
        this._resetTaps = 0;
        this._tribute?.stop();
        this._warp?.destroy();
        this._warp = null;
    }

    /**
     * Go to warp or drop out (`warp`, warp-drive.js): the streak layer behind
     * the scene, the scene's own stars streaming along the view.
     * @param {boolean} on
     * @param {boolean} [own] - the tribute's own warp (the config's state is kept for after it)
     */
    _setWarp(on, own = false) {
        // the tribute drives warp itself while it plays (own); the config's wish waits
        if (!own) this._warpWanted = on;
        if (this._tribute && !own) return;
        if (!on && !this._warp?.engaged) return;
        if (!this._warp) {
            const layer = /** @type {HTMLElement | null} */ (this.renderRoot?.querySelector('.astro-warp'));
            if (!layer || !this._scene) return;
            this._warp = new WarpDrive(layer, this, { onLevel: (l, f) => this._scene?.setCruise(l, f) });
            const f = this._flatConfig()?.warp_factor;
            this._warp.setFactor(typeof f === 'number' ? f : this._warpFactor);
        }
        this._warp.set(on);
    }

    /**
     * Push the config to the scene when its scene part changed (a theme
     * re-process with the same values does not rebuild), and the background
     * layer when its part changed.
     * @private
     */
    _syncConfig() {
        if (this._scene) {
            const config = this._sceneConfig();
            const key = JSON.stringify(config);
            if (key !== this._sceneKey) {
                // a new time_scale or clock in the config wins over the slider (the runtime does the same)
                const before = this._sceneKey ? JSON.parse(this._sceneKey) : null;
                if (before && before.time_scale !== config.time_scale) this._timeScale = null;
                if (before && JSON.stringify(before.clock ?? null) !== JSON.stringify(config.clock ?? null)) this._clockSet = null;
                this._sceneKey = key;
                this._registerSceneTargets();
                this._scene.setConfig(this._withScenePatches(config));
                this._rebuildPointData();
            }
        }
        this._syncBackground();
    }

    /**
     * `background_animation`: a flat layer behind the scene (any background
     * preset), rebuilt when its config changes.
     * @private
     */
    _syncBackground() {
        const cfg = this.config?.background_animation;
        const key = cfg ? JSON.stringify(cfg) : '';
        if (key === this._backgroundKey && (this._backgroundRenderer || !key)) return;
        this._backgroundKey = key;
        this._backgroundRenderer?.destroy();
        this._backgroundRenderer = null;
        const layer = /** @type {HTMLElement | null} */ (this.renderRoot?.querySelector('.astro-bg'));
        if (!key || !layer || !this._scene) return;
        layer.replaceChildren();
        const renderer = new BackgroundAnimationRenderer(layer, cfg, this);
        if (!renderer.init()) {
            lcardsLog.warn('[LCARdSAstrometricsCard] Background animation could not start');
            renderer.destroy();
            return;
        }
        this._backgroundRenderer = renderer;
        if (this.hass) renderer.updateHass(this.hass, null, this.config);
    }

    // ── Live point data: labels (templates, state colours), entity positions ──

    /**
     * The config's points changed (or the scene just started): work out which
     * labels the card resolves and which points follow entities, then resolve
     * them all once.
     * @private
     */
    _rebuildPointData() {
        const runtime = this._runtime;
        if (!runtime) return;
        const flat = this._flatConfig();
        const points = this._withScenePatches({ points: Array.isArray(flat?.points) ? flat.points : [] }).points;
        this._labelSources = runtime.labelSources(points, this.config?.labels);
        this._labelValues.clear();
        this._labelSeq.clear();
        this._bindings = [];
        for (const point of points) {
            const entityId = runtime.bindingEntity(point);
            if (entityId) this._bindings.push({ id: String(point.id), point, entityId });
        }
        this._bindingWarned.clear();
        this._collectSettings();
        this._updateTrackedEntities();
        this._refreshBindings(null);
        this._refreshSettings(null);
        this._refreshLabels({ all: true });
    }

    /**
     * Settings that follow entities or templates, and a camera tour, from
     * the config (R4b). Values of settings still there are kept.
     * @private
     */
    _collectSettings() {
        const runtime = this._runtime;
        if (!runtime) return;
        const flat = this._flatConfig();
        this._settings = runtime.collectBindings(flat);
        const keys = new Set(this._settings.map((b) => runtime.bindingKey(b)));
        for (const k of [...this._settingValues.keys()]) if (!keys.has(k)) this._settingValues.delete(k);
        // a live key built for the most it can reach changes in place and never rebuilds its object: build it
        // once for that most (the scene's first build has no settings yet; an edited output changes it)
        for (const b of this._settings) {
            if (b.most === undefined) continue;
            const key = runtime.bindingKey(b);
            if (this._settingMost.get(key) === b.most) continue;
            this._settingMost.set(key, b.most);
            this._settingDirty.add(`${b.scope}:${b.id}`);
        }
        for (const k of [...this._settingMost.keys()]) if (!keys.has(k)) this._settingMost.delete(k);
        if (this._settingDirty.size && this._settingTimer === undefined) this._settingTimer = setTimeout(() => this._flushSettings(), 250);
        const view = flat?.camera?.view;
        const tour = runtime.isTourView(view) ? view : null;
        if (JSON.stringify(tour) !== JSON.stringify(this._tour)) this._tourAt = null;
        this._tour = tour;
        // a look that follows an entity (its state, or an attribute, names it)
        const look = flat?.look;
        this._lookEntity = look && typeof look === 'object' && typeof look.entity === 'string' && look.entity ? look : null;
        // warp: true / false, or an entity that engages it; the factor as a plain number (an entity's: a setting)
        const warp = flat?.warp;
        this._warpEntity = warp && typeof warp === 'object' && typeof warp.entity === 'string' && warp.entity ? warp : null;
        if (!this._warpEntity) this._setWarp(warp === true);
        // camera.warp from an entity: fly-tos streak while it is on
        const flight = flat?.camera?.warp;
        this._flightWarpEntity = flight && typeof flight === 'object' && typeof flight.entity === 'string' && flight.entity ? flight : null;
        if (!this._flightWarpEntity) this._scene?.setFlightWarp(null);
        if (typeof flat?.warp_factor === 'number') this._warp?.setFactor(flat.warp_factor);
    }

    /**
     * Resolve the settings (and the tour) whose entities changed (all with
     * null) and hand them to the scene: live keys ease in place, the card's
     * clock and time_scale go straight to it, the rest patch their point or
     * object (at most four times a second).
     * @private
     * @param {Set<string> | null} changed
     */
    _refreshSettings(changed) {
        const runtime = this._runtime;
        if (!runtime || !this._scene) return;
        for (const b of this._settings) {
            if (changed && !b.entities.some((e) => changed.has(e))) continue;
            if (b.spec) {
                const entity = this.hass?.states?.[b.spec.entity];
                this._applySetting(b, b.kind === 'date' ? runtime.dateValue(b.spec, entity)
                    : b.kind === 'color' ? runtime.entityColor(b.spec, entity, entity ? this._classifyEntityState(entity) : 'unavailable')
                        : runtime.mapEntity(b.spec, entity), !changed);
                continue;
            }
            const key = runtime.bindingKey(b);
            const seq = (this._settingSeq.get(key) ?? 0) + 1;
            this._settingSeq.set(key, seq);
            this.processTemplate(/** @type {string} */ (b.template), { entity: null, field: key }).then((out) => {
                if (this._settingSeq.get(key) !== seq) return;
                this._applySetting(b, b.kind === 'date' ? runtime.dateValue(null, out)
                    : b.kind === 'color' ? runtime.templateColor(out) : runtime.mapNumber(null, out), !changed);
            }).catch((/** @type {any} */ error) => lcardsLog.warn(`[LCARdSAstrometricsCard] ${key}: template failed`, error));
        }
        const flight = this._flightWarpEntity;
        if (flight && (!changed || changed.has(flight.entity))) {
            const st = this.hass?.states?.[flight.entity];
            this._scene.setFlightWarp(warpOn(flight.attribute ? st?.attributes?.[flight.attribute] : st?.state));
        }
        const warp = this._warpEntity;
        if (warp && (!changed || changed.has(warp.entity))) {
            const st = this.hass?.states?.[warp.entity];
            this._setWarp(warpOn(warp.attribute ? st?.attributes?.[warp.attribute] : st?.state));
        }
        const look = this._lookEntity;
        if (look && (!changed || changed.has(look.entity))) {
            const st = this.hass?.states?.[look.entity];
            const value = look.attribute ? st?.attributes?.[look.attribute] : st?.state;
            if (value !== undefined) this._scene.setLook(value);
        }
        const tour = this._tour;
        if (tour && (!changed || changed.has(tour.entity))) {
            const stop = runtime.tourStop(tour, this.hass?.states?.[tour.entity]);
            const at = stop ? JSON.stringify(stop) : null;
            if (stop && at !== this._tourAt) {
                const first = this._tourAt === null;
                this._tourAt = at;
                this._scene.flyTo(stop.view, first ? { duration: 0 } : {});
                if (stop.date !== undefined || stop.rate !== undefined) this._scene.setClock({ date: stop.date, rate: stop.rate });
            }
        }
    }

    /**
     * One setting's new value to the scene.
     * @private
     * @param {import('../core/astrometrics/bindings.js').SettingBinding} b
     * @param {number | string | null} value
     * @param {boolean} [force] - send it even when unchanged (a full refresh: a new scene has none of them)
     */
    _applySetting(b, value, force = false) {
        const runtime = this._runtime;
        if (!runtime || !this._scene) return;
        // a whole-number key (count, arms, ...) rounded: it rebuilds only when the whole number changes
        value = runtime.roundedSetting(b, value);
        const key = runtime.bindingKey(b);
        if (!force && this._settingValues.has(key) && this._settingValues.get(key) === value) return;
        const prev = this._settingValues.get(key);
        this._settingValues.set(key, value);
        const path = b.path.join('.');
        if (b.scope === 'card') {
            if (path === 'time_scale') this._scene.setLive([{ id: '', key: 'time_scale', value: typeof value === 'number' ? value : null, smooth: b.smooth }]);
            else if (path === 'warp_factor') {
                this._warpFactor = typeof value === 'number' ? value : null;
                this._warp?.setFactor(this._warpFactor);
            }
            else if (path === 'clock.rate' && value !== null) this._scene.setClock({ rate: value });
            else if (path === 'clock.date' && value !== null) this._scene.setClock({ date: value });
            return;
        }
        if (b.live) {
            this._scene.setLive([{ id: b.id, key: path, value: typeof value === 'number' ? value : null, smooth: b.smooth }]);
            // a size scales against the size the object was built at: built before the first value, it has
            // none, so the first value also rebuilds it at that size
            const sized = path === 'radius' || path === 'size';
            if (!(sized && typeof value === 'number' && typeof prev !== 'number')) return;
        }
        this._settingDirty.add(`${b.scope}:${b.id}`);
        if (this._settingTimer === undefined) this._settingTimer = setTimeout(() => this._flushSettings(), 250);
    }

    /**
     * Patch the points and objects whose (rebuild) settings changed.
     * @private
     */
    _flushSettings() {
        this._settingTimer = undefined;
        if (!this._scene || !this._settingDirty.size) return;
        const patched = this._withScenePatches(this._sceneConfig());
        /** @type {{ points: Record<string, any>, objects: Record<string, any> }} */
        const send = { points: {}, objects: {} };
        for (const item of this._settingDirty) {
            const [scope, id] = [item.slice(0, item.indexOf(':')), item.slice(item.indexOf(':') + 1)];
            const list = scope === 'point' ? patched.points : patched.objects;
            const found = (Array.isArray(list) ? list : []).find((/** @type {any} */ x) => String(x?.id) === id);
            if (found) (scope === 'point' ? send.points : send.objects)[id] = found;
        }
        this._settingDirty.clear();
        this._scene.patch(send);
    }

    /**
     * Positions from entities: push the numbers of the bindings whose entity
     * changed (all with null).
     * @private
     * @param {Set<string> | null} changed
     */
    _refreshBindings(changed) {
        const runtime = this._runtime;
        if (!runtime || !this._scene || !this._bindings.length) return;
        /** @type {Record<string, Record<string, number[] | null>>} */
        const values = {};
        for (const b of this._bindings) {
            if (changed && !changed.has(b.entityId)) continue;
            const entity = this.hass?.states?.[b.entityId];
            const r = runtime.bindingValue(b.point, entity);
            if (!r) continue;
            values[b.id] = { [r.form]: r.value };
            if (!r.value && entity && !this._bindingWarned.has(b.id)) {
                this._bindingWarned.add(b.id);
                lcardsLog.warn(`[LCARdSAstrometricsCard] point '${b.id}': ${b.entityId} has no numbers for ${r.form}; the point is hidden until it has`);
            }
        }
        if (Object.keys(values).length) this._scene.updatePoints(values);
    }

    /**
     * A state colour map for a point's entity, as a CSS value (var() stays
     * live). No entity: the default key.
     * @private
     * @param {any} colorConfig
     * @param {any} entity
     * @returns {string | undefined}
     */
    _pointStateColor(colorConfig, entity) {
        const picked = resolveStateColor({
            actualState: entity?.state,
            classifiedState: entity ? this._classifyEntityState(entity) : 'default',
            colorConfig,
            fallback: null
        });
        if (picked === null || picked === undefined || picked === '') return undefined;
        return String(resolveColor(picked));
    }

    /**
     * Resolve the label fields a change touches (templates through
     * processTemplate with the point's entity, `sky` and `point`; state
     * colours) and push the changed values to the scene.
     * @private
     * @param {{ all?: boolean, ids?: Set<string>, entities?: Set<string>, sky?: boolean, ds?: boolean }} change - ids: only these points
     */
    async _refreshLabels(change) {
        const runtime = this._runtime;
        if (!runtime || !this._labelSources.length) return;
        const sky = templateSky(this._scene?.sky() ?? null);
        /** @type {Promise<void>[]} */
        const jobs = [];
        /** @type {Record<string, import('../core/astrometrics/scene-runtime.js').AstroLabelValues>} */
        const out = {};
        const put = (/** @type {string} */ id) => (out[id] ??= { fields: {} });
        for (const src of this._labelSources) {
            if (change.ids && !change.ids.has(src.id)) continue;
            const entity = src.entityId ? this.hass?.states?.[src.entityId] ?? null : null;
            const entityChanged = !!(src.entityId && change.entities?.has(src.entityId));
            if (src.color && (change.all || entityChanged)) {
                const c = this._pointStateColor(src.color, entity);
                if (c !== undefined) put(src.id).color = c;
            }
            for (const f of src.fields) {
                if (!runtime.fieldNeedsUpdate(f.deps, change)) continue;
                /** @type {{ color?: string, background?: string }} */
                const values = {};
                /** @type {Record<string, any>} */ (put(src.id).fields)[f.name] = values;
                if (f.color) {
                    const c = this._pointStateColor(f.color, entity);
                    if (c !== undefined) values.color = c;
                }
                if (f.background) {
                    const b = this._pointStateColor(f.background, entity);
                    if (b !== undefined) values.background = b;
                }
                if (!f.templated) continue;
                const key = `${src.id}\u0000${f.name}`;
                const seq = (this._labelSeq.get(key) ?? 0) + 1;
                this._labelSeq.set(key, seq);
                jobs.push(this.processTemplate(f.content, {
                    entity,
                    extra: { sky, point: src.point },
                    displayFormat: f.displayFormat,
                    field: `points.${src.id}.text.${f.name}.content`
                }).then((text) => {
                    if (this._labelSeq.get(key) !== seq) return;
                    this._pushLabelValues({ [src.id]: { fields: { [f.name]: { text: String(text ?? '') } } } });
                }));
            }
        }
        // Colours now; templates as they resolve (Jinja2 round trips)
        this._pushLabelValues(out);
        await Promise.all(jobs);
    }

    /**
     * Keep the values (a scene started later gets them) and send them.
     * @private
     * @param {Record<string, import('../core/astrometrics/scene-runtime.js').AstroLabelValues>} values
     */
    _pushLabelValues(values) {
        /** @type {Record<string, import('../core/astrometrics/scene-runtime.js').AstroLabelValues>} */
        const send = {};
        for (const [id, v] of Object.entries(values)) {
            const hasFields = v.fields && Object.values(v.fields).some((f) => Object.keys(f).length);
            if (!hasFields && v.color === undefined) continue;
            const prev = this._labelValues.get(id) ?? { fields: {} };
            const fields = { ...prev.fields };
            for (const [name, f] of Object.entries(v.fields ?? {})) fields[name] = { ...(fields[name] ?? {}), ...f };
            this._labelValues.set(id, { ...prev, ...v, fields });
            send[id] = v;
        }
        if (Object.keys(send).length) this._scene?.setLabelValues(send);
    }

    /**
     * Entities the card follows (for the core and rules): the points' own and
     * their bindings', on top of the base's (templates, triggers_update).
     * @protected
     */
    _updateTrackedEntities() {
        super._updateTrackedEntities();
        const tracked = new Set(this._trackedEntities ?? []);
        for (const p of Array.isArray(this._flatConfig()?.points) ? this._flatConfig().points : []) {
            if (typeof p?.entity === 'string' && p.entity) tracked.add(p.entity);
        }
        for (const b of this._bindings) tracked.add(b.entityId);
        for (const b of this._settings) b.entities.forEach((e) => tracked.add(e));
        if (this._tour?.entity) tracked.add(this._tour.entity);
        if (this._lookEntity) tracked.add(this._lookEntity.entity);
        if (this._warpEntity) tracked.add(this._warpEntity.entity);
        if (this._flightWarpEntity) tracked.add(this._flightWarpEntity.entity);
        for (const src of this._labelSources) for (const f of src.fields) f.deps.entities.forEach((e) => tracked.add(e));
        this._trackedEntities = [...tracked];
    }

    /**
     * A data source a template reads changed (the base subscribes them).
     * @protected
     */
    async _processCustomTemplates() {
        await this._refreshLabels({ ds: true });
    }

    // ── Rules on points and objects ─────────────────────────────────────────

    /**
     * Points and objects with an id are rule targets (as MSD overlays):
     * `vega`, `tag:hostile`, `type:astrometrics-point`. Registered before the
     * card itself, so the first evaluation sees them.
     * @protected
     * @param {string} overlayId
     * @param {any} type
     * @param {any} [tags]
     */
    _registerOverlayForRules(overlayId, type, tags = []) {
        this._registerSceneTargets();
        super._registerOverlayForRules(overlayId, type, tags);
    }

    /** @protected */
    _unregisterOverlayFromRules() {
        this._unregisterSceneTargets();
        super._unregisterOverlayFromRules();
    }

    /**
     * Register the config's point and object ids (again: drops ids that went).
     * @private
     */
    _registerSceneTargets() {
        const systems = this._singletons?.systemsManager;
        if (!systems) return;
        const had = this._overlayRegistered;
        this._unregisterSceneTargets();
        /** @param {any} item @param {'astrometrics-point' | 'astrometrics-object'} type @param {Set<string>} set */
        const add = (item, type, set) => {
            if (!item || typeof item !== 'object' || item.id === undefined || item.id === null || item.id === '') return;
            const id = String(item.id);
            if (id === this._overlayId) return;
            systems.registerOverlay(id, { id, type, tags: Array.isArray(item.tags) ? item.tags : [], sourceCardId: this._cardGuid });
            set.add(id);
        };
        const flat = this._flatConfig();
        for (const p of Array.isArray(flat?.points) ? flat.points : []) add(p, 'astrometrics-point', this._sceneTargets.points);
        for (const o of Array.isArray(flat?.objects) ? flat.objects : []) add(o, 'astrometrics-object', this._sceneTargets.objects);
        // A config change while registered: evaluate the rules again for the new ids
        if (had && this._rulesCallback && this.hass) {
            this._singletons?.rulesEngine?.markAllDirty();
            this._rulesCallback();
        }
    }

    /** @private */
    _unregisterSceneTargets() {
        const systems = this._singletons?.systemsManager;
        for (const id of [...this._sceneTargets.points, ...this._sceneTargets.objects]) systems?.unregisterOverlay(id);
        this._sceneTargets = { points: new Set(), objects: new Set() };
    }

    /**
     * Patches for the card itself go the base way (they patch the config);
     * patches for points and objects go to the scene without a rebuild.
     * @protected
     * @param {any[]} overlayPatches
     */
    _applyRulePatches(overlayPatches) {
        super._applyRulePatches(overlayPatches);
        const targets = this._sceneTargets;
        /** @type {Record<string, any[]>} */
        const byId = {};
        for (const patch of Array.isArray(overlayPatches) ? overlayPatches : []) {
            const id = patch?.id;
            if (typeof id !== 'string' || (!targets.points.has(id) && !targets.objects.has(id))) continue;
            (byId[id] ??= []).push(patch);
        }
        /** @type {Record<string, any>} */
        const next = {};
        for (const [id, list] of Object.entries(byId)) {
            // Highest priority first from the engine: merge from the end so it wins
            const merged = [...list].reverse().reduce((acc, p) => deepMergeImmutable(acc, normalizeScenePatch(p)), {});
            // A rule's label replaces the label text, also over an explicit text.label.content
            if (targets.points.has(id) && merged.label !== undefined) {
                merged.text = deepMergeImmutable(merged.text ?? {}, { label: { content: String(merged.label) } });
            }
            next[id] = merged;
        }
        const prev = this._scenePatches;
        const changed = [...new Set([...Object.keys(prev), ...Object.keys(next)])]
            .filter((id) => JSON.stringify(prev[id]) !== JSON.stringify(next[id]));
        if (!changed.length) return;
        this._scenePatches = next;
        if (!this._scene) return;
        const patched = this._withScenePatches(this._sceneConfig());
        /** @type {{ points: Record<string, any>, objects: Record<string, any> }} */
        const send = { points: {}, objects: {} };
        for (const id of changed) {
            if (targets.points.has(id)) send.points[id] = (patched.points ?? []).find((/** @type {any} */ p) => String(p?.id) === id);
            else send.objects[id] = (patched.objects ?? []).find((/** @type {any} */ o) => String(o?.id) === id);
        }
        this._scene.patch(send);
        // Labels the card resolves (templates, state colours) for the patched points
        const ids = new Set(Object.keys(send.points));
        if (ids.size && this._runtime) {
            const fresh = this._runtime.labelSources(Object.values(send.points), this.config?.labels);
            this._labelSources = [...this._labelSources.filter((src) => !ids.has(src.id)), ...fresh];
            for (const id of ids) this._labelValues.delete(id);
            this._refreshLabels({ all: true, ids });
        }
        lcardsLog.debug(`[LCARdSAstrometricsCard] Rule patches on ${changed.join(', ')}`);
    }

    /**
     * A tap or hold on a point or object. fly-to without a view (and a tap
     * on a point with no tap_action) is left to the scene: it selects the
     * point and flies there. Everything else runs here.
     * @private
     * @param {import('../core/astrometrics/scene-runtime.js').AstroTapHit} hit
     * @param {'tap_action' | 'hold_action'} key
     * @returns {boolean} true when handled
     */
    _onSceneAction(hit, key) {
        const action = hit.config?.[key];
        if (!action || typeof action !== 'object') return false;
        // fly-to another card goes through the action handler like any card's
        if (action.action === 'fly-to' && action.card !== undefined && action.card !== this.config?.id) {
            this._playSound(key === 'tap_action' ? 'card_tap' : 'card_hold');
            this._actionHandler.runAction(action, this.hass, this);
            return true;
        }
        // set-model-scale on this card (no card, or its own id)
        if (action.action === 'set-model-scale' && (action.card === undefined || action.card === this.config?.id)) {
            this._playSound(key === 'tap_action' ? 'card_tap' : 'card_hold');
            this.setModelScale(action.model_scale ?? 'toggle');
            return true;
        }
        // set-clock on this card (no card, or its own id) sets the date here
        if (action.action === 'set-clock' && (action.card === undefined || action.card === this.config?.id)) {
            this._playSound(key === 'tap_action' ? 'card_tap' : 'card_hold');
            this.setClock({ date: action.date, rate: action.rate });
            return true;
        }
        if (action.action === 'fly-to') {
            /** @type {{ duration?: number, warp?: boolean }} */
            const flight = {};
            if (action.duration !== undefined) flight.duration = action.duration;
            if (typeof action.warp === 'boolean') flight.warp = action.warp;
            if (action.point) {
                this._scene?.flyTo({ point: action.point }, flight);
                return true;
            }
            if (action.view) {
                this._scene?.flyTo(action.view, flight);
                return true;
            }
            if (key === 'tap_action') return false;
            const p = hit.position;
            this._scene?.flyTo(hit.kind === 'point' ? { point: hit.id, ...hit.config.view } : { target: [p.x, p.y, p.z], ...hit.config.view }, flight);
            return true;
        }
        if (action.action === 'none') return true;
        this._playSound(key === 'tap_action' ? 'card_tap' : 'card_hold');
        // A point's own entity, else the card's, for more-info and toggle
        this._actionHandler.runAction(action, this.hass, this, hit.config?.entity ?? this.config?.entity ?? null);
        return true;
    }

    /**
     * The element for a point's Lovelace card: HA's `hui-card` (it loads
     * lazy card types and applies the card's own visibility conditions;
     * preview in the card editor shows it whatever they say), else the
     * element itself, created into a holder (no `hui-card`: outside a
     * dashboard, such as the test harness).
     * @private
     * @param {Record<string, any>} card
     * @returns {HTMLElement}
     */
    _mountPointCard(card) {
        if (customElements.get('hui-card')) return createHuiCardWrapper(card, this.hass, { editMode: this._inEditDialog });
        const holder = document.createElement('div');
        holder.className = 'astro-card-holder';
        createCardElement(card.type, 'astrometrics-point').then(async (el) => {
            if (!el || !holder.parentElement) return;
            holder.append(el);
            if (this.hass) applyHassToCard(el, this.hass, 'astrometrics-point');
            await applyCardConfig(el, card, 'astrometrics-point');
        });
        return holder;
    }

    /**
     * @private
     * @param {HTMLElement} el - from _mountPointCard
     * @param {any} hass
     */
    _setPointCardHass(el, hass) {
        if (el.tagName === 'HUI-CARD') /** @type {any} */ (el).hass = hass;
        else if (el.firstElementChild) applyHassToCard(el.firstElementChild, hass, 'astrometrics-point');
    }

    /** @protected */
    _onConfigUpdated() {
        this._syncConfig();
    }

    /** @protected */
    _onRulePatchesChanged() {
        this._syncConfig();
    }

    /**
     * @protected
     * @param {any} newHass
     * @param {any} oldHass
     */
    _handleHassUpdate(newHass, oldHass) {
        super._handleHassUpdate?.(newHass, oldHass);
        this._scene?.setHass(newHass);
        if (this._runtime) {
            if (!oldHass) {
                this._refreshBindings(null);
                this._refreshSettings(null);
                this._refreshLabels({ all: true });
            } else {
                /** @type {Set<string>} */
                const changed = new Set();
                for (const id of this._trackedEntities ?? []) {
                    if (oldHass.states?.[id] !== newHass?.states?.[id]) changed.add(id);
                }
                if (changed.size) {
                    this._refreshBindings(changed);
                    this._refreshSettings(changed);
                    this._refreshLabels({ entities: changed });
                }
            }
        }
        this._backgroundRenderer?.updateHass(newHass, null, this.config);
    }

    /**
     * Alert mode rewrote the palette: re-resolve the WebGL colours (one
     * rebuild, the camera stays). Labels use CSS colours and follow already.
     * @protected
     * @param {string} _mode
     */
    _onAlertModeChanged(_mode) {
        this._scene?.recolor();
        this._refreshBackgroundAnimationColors();
    }

    /** @protected */
    _renderCard() {
        if (this._inPicker) return this._renderPreview();
        const failure = this._failure ? FAILURES[/** @type {keyof typeof FAILURES} */ (this._failure)] : null;
        return html`
            <div class="astro-card"
                @pointermove=${this._wakeButtons} @pointerdown=${this._wakeButtons}
                @wheel=${this._wakeButtons} @keydown=${this._wakeButtons} @focusin=${this._wakeButtons}>
                <div class="astro-bg"></div>
                <div class="astro-warp"></div>
                <div class="astro-host"></div>
                ${failure ? '' : this._renderCameraButtons()}
                ${this._pick ? html`
                    <div class="astro-pick" role="status">
                        <span>${this._pick.missed ? `MISSED: TAP ON ${this._pick.object ? this._pick.object.toUpperCase() : 'THE GROUND'}` : `TAP TO PLACE ${this._pick.label.toUpperCase()}`}</span>
                        <button type="button" @click=${() => this._endPick(null)}>CANCEL</button>
                    </div>` : ''}
                ${failure ? html`
                    <div class="astro-failure" role="status">
                        <div class="title">3D VIEW UNAVAILABLE</div>
                        <div class="reason">${failure}</div>
                    </div>` : ''}
            </div>
        `;
    }

    /**
     * Fly the camera (the registry, `lcards.fly_to` and fly-to actions from
     * other cards call this): a view name or point id, `{ point }`, or keys.
     * @param {string | Record<string, any>} view
     * @param {{ duration?: number }} [opts]
     * @returns {Promise<void>}
     */
    flyTo(view, opts = {}) {
        if (!this._scene) {
            lcardsLog.debug('[LCARdSAstrometricsCard] fly-to before the scene is ready: ignored');
            return Promise.resolve();
        }
        return this._scene.flyTo(view, opts);
    }

    /**
     * Models at their real size, or drawn at least 40 px across to stay
     * visible (the size button, set-model-scale actions and the registry
     * call this). Not saved; it stays until the config's model_scale changes.
     * @param {'real' | 'visible' | 'toggle'} mode
     * @returns {boolean} false before the scene is ready, or for an unknown mode
     */
    setModelScale(mode) {
        if (!this._scene || !['real', 'visible', 'toggle'].includes(mode)) return false;
        const next = mode === 'toggle' ? (this._scene.modelScale() === 'visible' ? 'real' : 'visible') : mode;
        this._scene.setModelScale(next);
        return true;
    }

    /**
     * Set the scene date and or rate (the registry, `lcards.set_clock`, the
     * time slider and set-clock actions call this). It stays until the
     * config's `clock` changes.
     * @param {{ date?: any, rate?: any }} opts - date: now, ISO or ms; rate: live or days per second
     * @returns {boolean} false before the scene is ready, or when a value was not understood
     */
    setClock(opts = {}) {
        const clock = {
            ...(opts.date !== undefined && opts.date !== null && opts.date !== '' ? { date: opts.date } : {}),
            ...(opts.rate !== undefined && opts.rate !== null && opts.rate !== '' ? { rate: opts.rate } : {})
        };
        if (!this._scene) {
            lcardsLog.debug('[LCARdSAstrometricsCard] set-clock before the scene is ready: ignored');
            return false;
        }
        const ok = this._scene.setClock(clock);
        const c = this._scene.clock();
        this._clockSet = { date: c.date, rate: c.rate, wall: performance.now() };
        if (!ok) lcardsLog.warn(`[LCARdSAstrometricsCard] set-clock: could not read ${JSON.stringify(clock)} (date: now or an ISO date; rate: live or days per second)`);
        return ok;
    }

    /**
     * The scene date moved (every frame while it runs): the slider's readout
     * changes once a minute of scene time at most.
     * @private
     * @param {import('../core/astrometrics/scene-runtime.js').AstroClockState} c
     */
    _onClock(c) {
        const text = formatSceneDate(c.date);
        if (text !== this._clockText) this._clockText = text;
        if (c.rate !== this._clockRate) this._clockRate = c.rate;
    }

    // ── The Astrometrics Studio (its live preview is this card) ──

    /**
     * Edit mode for the Studio: taps select (hooks.onSelect) instead of
     * running actions, points can be dragged (hooks.onDrag). Kept across
     * scene rebuilds; null ends it.
     * @param {import('../core/astrometrics/scene-runtime.js').AstroEditHooks | null} hooks
     */
    attachStudio(hooks) {
        this._studioHooks = hooks;
        this._scene?.setEditMode(hooks);
    }

    /**
     * The scene API, once the scene exists (the Studio's camera views,
     * highlight, fly-to).
     * @returns {Promise<import('../core/astrometrics/scene-runtime.js').AstroSceneApi>}
     */
    studioScene() {
        if (this._scene) return Promise.resolve(this._scene);
        return new Promise((resolve) => this._sceneWaiters.push(resolve));
    }

    /**
     * A model object's part names: null until it has loaded (or not a model).
     * @param {string} objectId
     * @returns {string[] | null}
     */
    partNames(objectId) {
        return this._scene?.partNames(String(objectId)) ?? null;
    }

    /**
     * The next tap on the scene places a point: resolves with the placement
     * form's value, or null when cancelled (Cancel, Escape, a new pick).
     * @param {{ pointId: string, form: string, object?: string, label?: string }} request
     * @returns {Promise<number[] | string | null>}
     */
    pickPosition(request) {
        this._endPick(null);
        if (!this._scene) return Promise.resolve(null);
        return new Promise((resolve) => {
            this._pick = { pointId: String(request.pointId), form: request.form, object: request.object || undefined, label: String(request.label || request.pointId), resolve };
            this._scene?.setPickHandler((x, y) => {
                const pick = this._pick;
                if (!pick || !this._scene) return;
                // a point in a system is placed on its system's ground, in its units
                const system = this._flatConfig().points?.find((/** @type {any} */ p) => String(p?.id) === pick.pointId)?._system;
                const value = this._scene.placeAt(x, y, pick.form, pick.object, system);
                if (value === null || value === undefined) {
                    this._pick = { ...pick, missed: true };
                    return;
                }
                this._playSound('card_tap');
                this._endPick(value);
            });
            window.addEventListener('keydown', this._onPickKey, true);
        });
    }

    /** End a pick without a value. */
    cancelPick() {
        this._endPick(null);
    }

    /** @private @param {KeyboardEvent} e */
    _onPickKey(e) {
        if (e.key !== 'Escape' || !this._pick) return;
        e.stopPropagation();
        e.preventDefault();
        this._endPick(null);
    }

    /**
     * Leave pick mode with a value, or null when cancelled.
     * @private
     * @param {number[] | string | null} value
     */
    _endPick(value) {
        const pick = this._pick;
        if (!pick) return;
        this._pick = null;
        this._scene?.setPickHandler(null);
        window.removeEventListener('keydown', this._onPickKey, true);
        pick.resolve(value);
    }

    /**
     * `camera.buttons`: the LCARdS D-pad over the scene (arms pan, centre
     * resets, corners zoom and fly forward and back), the time slider under
     * it and, with `hide: toggle`, the fold button nearest the card's edge.
     * The pad is drawn from the D-pad component's paths in its theme tokens'
     * colours; transparent buttons on a 3 x 3 grid over it take the input.
     * @private
     */
    _renderCameraButtons() {
        const layout = cameraButtonLayout(this.config?.camera?.buttons, { folded: this._buttonsFolded });
        if (!layout) return '';
        const idle = layout.hide === 'idle' && this._buttonsIdle;
        const top = layout.position.startsWith('top');
        const fold = layout.fold ? (() => {
            const [cmd, , label, path] = /** @type {string[]} */ (layout.fold);
            return html`
                <button type="button" class="astro-fold" data-cmd=${cmd} aria-label=${label} title=${label}
                    aria-expanded=${cmd === 'fold' ? 'true' : 'false'}
                    @click=${() => { this._playSound('card_tap'); this._buttonsFolded = cmd === 'fold'; }}>
                    <svg viewBox="0 0 24 24" aria-hidden="true"><path d=${path}/></svg>
                </button>`;
        })() : '';
        const paths = dpadPaths();
        return html`
            <div class="astro-buttons" data-pos=${layout.position} style=${`--pad-size: ${layout.size}px; ${this._padStyle()}`}
                ?data-idle=${idle} ?inert=${idle}>
                ${top ? fold : ''}
                ${layout.pad ? html`
                    <div class="astro-pad">
                        <svg viewBox="0 0 80 80" aria-hidden="true">
                            ${layout.segments.map((s) => svg`<path class=${s.on ? 'seg' : 'seg off'} data-seg=${s.seg} data-kind=${s.kind} d=${paths[s.seg] ?? ''}/>`)}
                            ${layout.segments.filter((s) => s.on).map((s) => svg`<path class="glyph" data-seg=${s.seg} data-kind=${s.kind} d=${s.glyph}/>`)}
                        </svg>
                        <div class="astro-pad-hits" style=${`grid-template-areas: ${PAD_AREAS}`}>
                            ${layout.segments.map((s) => html`
                                <button type="button" data-cmd=${s.cmd} data-seg=${s.seg} style=${`grid-area: ${s.area}`} aria-label=${s.label} title=${s.label}
                                    ?disabled=${!s.on}
                                    @pointerenter=${() => this._padState(s.seg, 'hover', true)}
                                    @pointerleave=${() => this._padState(s.seg, 'hover', false)}
                                    @pointerdown=${(/** @type {PointerEvent} */ e) => { if (!s.on) return; if (e.button === 0) this._padState(s.seg, 'pressed', true); this._pressCamera(s.cmd, e); }}
                                    @pointerup=${() => this._releasePad(s.seg)}
                                    @pointercancel=${() => this._releasePad(s.seg)}
                                    @lostpointercapture=${() => this._releasePad(s.seg)}
                                    @keydown=${(/** @type {KeyboardEvent} */ e) => { if ((e.key === 'Enter' || e.key === ' ') && !e.repeat) { e.preventDefault(); this._padState(s.seg, 'pressed', true); this._pressCamera(s.cmd); } }}
                                    @keyup=${() => this._releasePad(s.seg)}
                                    @contextmenu=${(/** @type {Event} */ e) => e.preventDefault()}></button>`)}
                        </div>
                    </div>` : ''}
                ${layout.scale && this._hasRealModels ? this._renderScaleButton() : ''}
                ${layout.time ? this._renderTimeSlider('time', 'Time speed') : ''}
                ${top ? '' : fold}
            </div>
        `;
    }

    /**
     * `buttons.scale`: models at their real size or drawn larger to stay
     * visible (shown while a model is at its real size), as the V key.
     * @private
     */
    _renderScaleButton() {
        const visible = this._modelScale === 'visible';
        const label = visible ? 'Show models at their real size' : 'Draw small models larger, to see them';
        return html`
            <button type="button" class="astro-scale" data-cmd="model-scale" aria-pressed=${visible ? 'true' : 'false'} aria-label=${label} title=${`${label} (V)`}
                @click=${() => { this._playSound('card_tap'); this.setModelScale('toggle'); }}>${visible ? 'Visible size' : 'Real size'}</button>`;
    }

    /**
     * The pad's colours from the D-pad theme tokens, as CSS variables;
     * read again only when the theme changes.
     * @private
     * @returns {string}
     */
    _padStyle() {
        const theme = this._singletons?.themeManager?.activeThemeId ?? '';
        const cached = this._padStyleCache;
        if (cached && cached.theme === theme) return cached.style;
        const style = padTokenStyle((path) => this.getThemeToken(path));
        this._padStyleCache = { theme, style };
        return style;
    }

    /**
     * Hover and pressed looks on a pad segment (a class on its path and its
     * mark; the buttons over the pad take the input, the paths show it).
     * @private
     * @param {string} seg
     * @param {'hover' | 'pressed'} state
     * @param {boolean} on
     */
    _padState(seg, state, on) {
        this.renderRoot?.querySelectorAll(`.astro-pad path[data-seg="${seg}"]`).forEach((p) => p.classList.toggle(state, on));
    }

    /** @private @param {string} seg */
    _releasePad(seg) {
        this._padState(seg, 'pressed', false);
        this._releaseCamera();
    }

    /**
     * `buttons.time`: the speed slider (how fast the scene's motion runs), the
     * date slider (the scene clock's rate, with the date and a NOW button),
     * or both with a switch between them.
     * @private
     * @param {string} area
     * @param {string} label
     */
    _renderTimeSlider(area, label) {
        const mode = timeMode(this.config?.camera?.buttons, !!this.config?.clock);
        const shows = mode === 'both' ? this._timeShows : mode;
        const swap = mode === 'both' ? html`
            <button type="button" class="astro-time-swap" data-cmd="time-mode"
                aria-label=${shows === 'date' ? 'Show the speed slider' : 'Show the date slider'} title=${shows === 'date' ? 'Speed' : 'Date'}
                @click=${(/** @type {Event} */ e) => { e.preventDefault(); this._playSound('card_tap'); this._timeShows = shows === 'date' ? 'speed' : 'date'; }}>
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d=${shows === 'date' ? 'M5 15a7 7 0 0 1 14 0M12 15l4-5' : 'M12 5a7 7 0 1 0 0 14a7 7 0 1 0 0-14M12 8v4l3 2'}/></svg>
            </button>` : '';
        return shows === 'date' ? this._renderDateSlider(area, swap) : this._renderSpeedSlider(area, label, swap);
    }

    /**
     * The date slider: the scene date, the rate by stops, NOW.
     * @private
     * @param {string} area
     * @param {any} swap - the mode switch (both), or ''
     */
    _renderDateSlider(area, swap) {
        const stop = dateStop(this._clockRate);
        const rateText = DATE_STOPS[stop].label.toUpperCase();
        return html`
            <div class="astro-time astro-time-wide astro-date" style=${`grid-area: ${area}`}>
                <div class="astro-date-row">
                    <span class="astro-date-text">${this._clockText || '-'}</span>
                    <button type="button" class="astro-time-now" data-cmd="clock-now" aria-label="Back to now" title="Now"
                        @click=${() => { this._playSound('card_tap'); this.setClock({ date: 'now', rate: 'live' }); }}>NOW</button>
                </div>
                <div class="astro-date-row">
                    ${swap || html`<span class="astro-time-cap"></span>`}
                    <input type="range" min="0" max=${DATE_STOPS.length - 1} step="1" .value=${String(stop)}
                        style=${`--p: ${(stop / (DATE_STOPS.length - 1)) * 100}%`}
                        aria-label="Scene date rate" aria-valuetext=${rateText}
                        @input=${(/** @type {Event} */ e) => this.setClock({ rate: DATE_STOPS[Number(/** @type {HTMLInputElement} */ (e.target).value)]?.rate ?? LIVE_RATE })}>
                    <span class="astro-time-value">${rateText}</span>
                </div>
            </div>
        `;
    }

    /**
     * The speed slider: how fast decorative motion runs, by stops (0 holds it).
     * @private
     * @param {string} area
     * @param {string} label
     * @param {any} swap - the mode switch (both), or ''
     */
    _renderSpeedSlider(area, label, swap) {
        const cfgScale = Number(this.config?.time_scale ?? 1);
        const scale = this._timeScale ?? (Number.isFinite(cfgScale) ? Math.max(0, cfgScale) : 1);
        const stop = timeStop(scale);
        const text = scale === 0 ? 'HOLD' : `${scale}×`;
        return html`
            <label class=${swap ? 'astro-time astro-time-wide' : 'astro-time'} style=${`grid-area: ${area}`} title=${label}>
                ${swap || html`<span class="astro-time-cap"></span>`}
                <input type="range" min="0" max=${TIME_STOPS.length - 1} step="1" .value=${String(stop)}
                    style=${`--p: ${(stop / (TIME_STOPS.length - 1)) * 100}%`}
                    aria-label=${label} aria-valuetext=${text}
                    @input=${(/** @type {Event} */ e) => this._setTimeScale(TIME_STOPS[Number(/** @type {HTMLInputElement} */ (e.target).value)] ?? 1)}>
                <span class="astro-time-value">${text}</span>
            </label>
        `;
    }

    /**
     * @private
     * @param {number} scale
     */
    _setTimeScale(scale) {
        this._timeScale = scale;
        this._scene?.setTimeScale(scale);
    }

    /**
     * A camera button went down: one step now, held motion after a moment.
     * @private
     * @param {string} cmd
     * @param {PointerEvent} [e]
     */
    _pressCamera(cmd, e) {
        if (e) {
            if (e.button > 0) return;
            e.preventDefault();
            /** @type {HTMLElement} */ (e.currentTarget).setPointerCapture?.(e.pointerId);
        }
        this._playSound('card_tap');
        // reset waits to see whether more taps follow: one tap resets, four quick taps play the tribute
        // (there are four lights, tribute.js), two or three do nothing
        if (cmd === 'reset') {
            this._resetTaps++;
            clearTimeout(this._resetTimer);
            if (this._resetTaps >= 4) {
                this._resetTaps = 0;
                this._playTribute();
                return;
            }
            this._resetTimer = setTimeout(() => {
                const taps = this._resetTaps;
                this._resetTaps = 0;
                if (taps === 1) {
                    this._scene?.press('reset');
                    this._scene?.release();
                }
            }, this._resetTaps > 1 ? RESET_SEQUENCE_MS : RESET_TAP_MS);
            return;
        }
        this._cameraHeld = true;
        this._scene?.press(cmd);
    }

    /**
     * The tribute to Sir Patrick Stewart (tribute.js, a lazy chunk): warp, his
     * constellation, ENGAGE. Again while it plays: it ends.
     * @returns {Promise<void>}
     */
    async _playTribute() {
        if (this._tribute) {
            this._tribute.stop();
            return;
        }
        const root = /** @type {HTMLElement | null} */ (this.renderRoot?.querySelector('.astro-card'));
        const host = /** @type {HTMLElement | null} */ (this.renderRoot?.querySelector('.astro-host'));
        if (!root || !host || !this._scene) return;
        const { playTribute } = await import('../core/astrometrics/tribute.js');
        host.style.transition = 'opacity 1.2s ease';
        const t = playTribute({
            root,
            element: this,
            warp: (on, factor, strength = 1) => {
                if (on) {
                    this._setWarp(true, true);
                    if (factor) this._warp?.setFactor(factor);
                    this._warp?.setStrength(strength);
                } else this._setWarp(this._warpWanted, true);
            },
            dim: (a) => {
                host.style.opacity = String(a);
                // the camera buttons step back with the scene
                const buttons = /** @type {HTMLElement | null} */ (this.renderRoot?.querySelector('.astro-buttons'));
                if (buttons) buttons.style.opacity = a < 1 ? '0.15' : '';
            }
        });
        this._tribute = t;
        await t.done;
        if (this._tribute === t) this._tribute = null;
        const f = this._flatConfig()?.warp_factor;
        this._warp?.setFactor(typeof f === 'number' ? f : this._warpFactor);
        this._warp?.setStrength(1);
        this._setWarp(this._warpWanted, true);
    }

    /** @private */
    _releaseCamera() {
        this._cameraHeld = false;
        this._scene?.release();
        this._wakeButtons();
    }

    /**
     * Input on the card: show the camera buttons (`hide: idle`) and fade them
     * out again after BUTTONS_IDLE_MS without input; never while one is held
     * or has the keyboard focus.
     * @private
     */
    _wakeButtons = () => {
        const b = this.config?.camera?.buttons;
        clearTimeout(this._buttonsTimer);
        this._buttonsTimer = undefined;
        if (!b || (b !== true && b.hide !== undefined && b.hide !== 'idle')) {
            this._buttonsIdle = false;
            return;
        }
        this._buttonsIdle = false;
        this._buttonsTimer = setTimeout(() => {
            this._buttonsTimer = undefined;
            if (this._cameraHeld || this.renderRoot?.querySelector('.astro-buttons:focus-within')) this._wakeButtons();
            else this._buttonsIdle = true;
        }, BUTTONS_IDLE_MS);
    };

    /**
     * Card picker: a static drawing (no WebGL for a thumbnail).
     * @private
     */
    _renderPreview() {
        return html`
            <svg class="astro-preview" viewBox="0 0 400 220" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
                <ellipse class="grid" cx="200" cy="120" rx="150" ry="55"/>
                <ellipse class="grid" cx="200" cy="120" rx="100" ry="37"/>
                <ellipse class="grid" cx="200" cy="120" rx="50" ry="18"/>
                <line class="grid" x1="50" y1="120" x2="350" y2="120"/>
                <line class="grid" x1="200" y1="65" x2="200" y2="175"/>
                <ellipse class="rim" cx="200" cy="120" rx="160" ry="59"/>
                <circle class="core" cx="200" cy="120" r="5"/>
                <text x="200" y="40" text-anchor="middle">ASTROMETRICS</text>
            </svg>
        `;
    }

    /**
     * @protected
     */
    _onDisconnected() {
        clearTimeout(this._buttonsTimer);
        this._buttonsTimer = undefined;
        unregisterAstrometricsCard(this);
        this._endPick(null);
        this._stopScene();
        super._onDisconnected();
    }

    /**
     * The idle fade starts with the first render of the buttons (and again
     * after a config change brings them back).
     * @param {Map<string, any>} changedProperties
     */
    updated(changedProperties) {
        super.updated(changedProperties);
        if (this._buttonsTimer === undefined && !this._buttonsIdle && this.renderRoot?.querySelector('.astro-buttons')) this._wakeButtons();
    }

    /** @protected */
    _getCardSize() {
        return Math.ceil((this._configPx(this.config?.height) || 400) / 50);
    }

    getGridOptions() {
        const go = this.config.grid_options || {};
        // a pixel height takes the rows it needs (56 px rows, 8 px gaps), so the card never runs into the next one
        const h = this._configPx(this.config?.height);
        return {
            columns: go.columns ?? 12,
            rows: go.rows ?? (h ? Math.max(3, Math.ceil((h + 8) / 64)) : 8),
            min_columns: 3,
            min_rows: 3
        };
    }

    static getStubConfig() {
        return {
            type: 'custom:lcards-astrometrics-card',
            height: 400,
            camera: {
                view: 'galaxy',
                views: {
                    galaxy: { target: 'core', yaw: 20, tilt: 35, distance: 260 },
                    map: { target: 'core', tilt: 90, distance: 300 }
                }
            },
            backdrop: { stars: true },
            points: [
                { id: 'core', xyz: [0, 0, 0], label: 'GALACTIC CORE', style: 'title' },
                { id: 'vega', polar: [64, 160], marker: 'triangle', label: 'Vega' },
                { id: 'rigel', polar: [88, 95], marker: 'diamond', label: 'Rigel' }
            ],
            objects: [
                { type: 'grid', shape: 'disc', radius: 100, pattern: 'polar', line_spacing: 10, spoke_count: 36, ring_labels: { step: 30 } },
                { type: 'ring', radius: 100, width: 2 },
                { type: 'glow', at: 'core', size: 50 }
            ]
        };
    }

    static async getConfigElement() {
        // Editors load on demand, keeping them out of the bundle every dashboard loads
        await import('../editor/cards/lcards-astrometrics-editor.js');
        return document.createElement('lcards-astrometrics-editor');
    }

    /**
     * Register the defaults with CoreConfigManager (lcards-main.js, after core
     * initialization). The schema registers when it is first needed
     * (ensureAstrometricsSchema).
     */
    static registerSchema() {
        const configManager = window.lcards?.core?.configManager;
        if (!configManager) {
            lcardsLog.error('[LCARdSAstrometricsCard] CoreConfigManager not available for schema registration');
            return;
        }
        configManager.registerCardDefaults('astrometrics', { height: 400 });
    }
}

// NOTE: Card registration (customElements.define and window.customCards) handled in src/lcards-main.js
