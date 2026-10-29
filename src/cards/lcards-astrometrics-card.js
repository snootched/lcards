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

import { html, css } from 'lit';
import { LCARdSCard } from '../base/LCARdSCard.js';
import { lcardsLog } from '../utils/lcards-logging.js';
import { resolveColor } from '../core/themes/resolve-color.js';
import { BackgroundAnimationRenderer } from '../core/packs/backgrounds/BackgroundAnimationRenderer.js';
import { resolveStateColor } from '../utils/state-color-resolver.js';
import { deepMergeImmutable } from '../utils/deepMerge.js';
import { flattenSystems } from '../core/astrometrics/names.js';
import { registerAstrometricsCard, unregisterAstrometricsCard } from './astrometrics-registry.js';
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

/** On-card camera buttons: command, grid area, label, SVG path (24 x 24) */
const CAMERA_BUTTONS = {
    pan: [
        ['pan-up', 'up', 'Pan up', 'M6 15l6-6 6 6'],
        ['pan-left', 'left', 'Pan left', 'M15 6l-6 6 6 6'],
        ['pan-right', 'right', 'Pan right', 'M9 6l6 6-6 6'],
        ['pan-down', 'down', 'Pan down', 'M6 9l6 6 6-6']
    ],
    zoom: [
        ['zoom-out', 'zout', 'Zoom out', 'M6 12h12'],
        ['zoom-in', 'zin', 'Zoom in', 'M6 12h12M12 6v12']
    ],
    reset: [['reset', 'reset', 'Reset view', 'M12 5a7 7 0 1 0 0 14a7 7 0 1 0 0-14M12 10a2 2 0 1 0 0 4a2 2 0 1 0 0-4']]
};

/**
 * The button grid for `camera.buttons`: which buttons, and the grid areas.
 * @param {any} cfg - `camera.buttons`
 * @returns {{ position: string, areas: string, buttons: string[][] } | null}
 */
export function cameraButtonLayout(cfg) {
    if (!cfg) return null;
    const o = cfg === true ? {} : cfg;
    const pan = o.pan !== false;
    const zoom = o.zoom !== false;
    const reset = o.reset !== false;
    /** @type {string[]} */
    const rows = [];
    if (pan) rows.push('". up ."', `"left ${reset ? 'reset' : '.'} right"`, '". down ."');
    if (zoom) rows.push(`"zout ${reset && !pan ? 'reset' : '.'} zin"`);
    if (!pan && !zoom && reset) rows.push('". reset ."');
    if (!rows.length) return null;
    const buttons = [...(pan ? CAMERA_BUTTONS.pan : []), ...(zoom ? CAMERA_BUTTONS.zoom : []), ...(reset ? CAMERA_BUTTONS.reset : [])];
    return { position: typeof o.position === 'string' ? o.position : 'bottom-right', areas: rows.join(' '), buttons };
}

/** Config keys the scene reads; a change to anything else does not rebuild it */
const SCENE_KEYS = ['camera', 'backdrop', 'labels', 'points', 'objects', 'units'];

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
            _pick: { type: Object, state: true }
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
                .astro-host {
                    position: absolute;
                    inset: 0;
                }
                .astro-bg {
                    pointer-events: none;
                }
                .astro-buttons {
                    position: absolute;
                    display: grid;
                    grid-template-columns: repeat(3, 32px);
                    grid-auto-rows: 32px;
                    gap: var(--ha-space-1, 4px);
                    margin: var(--ha-space-3, 12px);
                    z-index: 1;
                }
                .astro-buttons[data-pos^='top'] { top: 0; }
                .astro-buttons[data-pos^='bottom'] { bottom: 0; }
                .astro-buttons[data-pos$='left'] { left: 0; }
                .astro-buttons[data-pos$='right'] { right: 0; }
                .astro-buttons[data-pos^='center'] { top: 50%; translate: 0 -50%; }
                .astro-buttons[data-pos$='center'] { left: 50%; translate: -50% 0; }
                .astro-buttons[data-pos='center'] { translate: -50% -50%; }
                .astro-buttons button {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 0;
                    border: none;
                    border-radius: var(--ha-border-radius-md, 8px);
                    background: var(--lcars-ui-secondary, var(--lcards-blue-medium));
                    color: var(--primary-background-color);
                    cursor: pointer;
                    touch-action: none;
                    opacity: 0.85;
                    transition: opacity var(--ha-animation-duration-fast, 0.15s);
                }
                .astro-buttons button:hover,
                .astro-buttons button:focus-visible { opacity: 1; }
                .astro-buttons button:focus-visible { outline: var(--ha-border-width-md) solid var(--primary-color); outline-offset: 1px; }
                .astro-buttons button[data-cmd^='zoom'] {
                    border-radius: var(--ha-border-radius-pill, 9999px);
                    background: var(--lcars-orange, var(--lcards-orange-medium));
                }
                .astro-buttons button[data-cmd='reset'] {
                    border-radius: var(--ha-border-radius-circle, 50%);
                    background: var(--lcars-ui-tertiary, var(--lcards-gray-medium-light));
                }
                .astro-buttons svg {
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
        if (!Object.keys(patches).length) return config;
        const pick = (/** @type {any} */ item, /** @type {Set<string>} */ ids) =>
            item && item.id !== undefined && ids.has(String(item.id)) && patches[String(item.id)] ? deepMergeImmutable(item, patches[String(item.id)]) : item;
        return {
            ...config,
            ...(Array.isArray(config.points) ? { points: config.points.map((p) => pick(p, this._sceneTargets.points)) } : {}),
            ...(Array.isArray(config.objects) ? { objects: config.objects.map((o) => pick(o, this._sceneTargets.objects)) } : {})
        };
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
            mountCard: (card) => this._mountPointCard(card),
            setCardHass: (el, hass) => this._setPointCardHass(el, hass)
        });
        if (this._studioHooks) this._scene.setEditMode(this._studioHooks);
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
        this._scene?.dispose();
        this._scene = null;
        this._sceneKey = '';
        this._backgroundRenderer?.destroy();
        this._backgroundRenderer = null;
        this._backgroundKey = '';
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
        this._updateTrackedEntities();
        this._refreshBindings(null);
        this._refreshLabels({ all: true });
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
        if (action.action === 'fly-to') {
            if (action.point) {
                this._scene?.flyTo({ point: action.point }, action.duration !== undefined ? { duration: action.duration } : {});
                return true;
            }
            if (action.view) {
                this._scene?.flyTo(action.view);
                return true;
            }
            if (key === 'tap_action') return false;
            const p = hit.position;
            this._scene?.flyTo(hit.kind === 'point' ? { point: hit.id, ...hit.config.view } : { target: [p.x, p.y, p.z], ...hit.config.view });
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
                this._refreshLabels({ all: true });
            } else {
                /** @type {Set<string>} */
                const changed = new Set();
                for (const id of this._trackedEntities ?? []) {
                    if (oldHass.states?.[id] !== newHass?.states?.[id]) changed.add(id);
                }
                if (changed.size) {
                    this._refreshBindings(changed);
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
            <div class="astro-card">
                <div class="astro-bg"></div>
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
                const value = this._scene.placeAt(x, y, pick.form, pick.object);
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
     * `camera.buttons`: pan arrows, zoom, reset over the scene.
     * @private
     */
    _renderCameraButtons() {
        const layout = cameraButtonLayout(this.config?.camera?.buttons);
        if (!layout) return '';
        return html`
            <div class="astro-buttons" data-pos=${layout.position} style=${`grid-template-areas: ${layout.areas}`}>
                ${layout.buttons.map(([cmd, area, label, path]) => html`
                    <button type="button" data-cmd=${cmd} style=${`grid-area: ${area}`} aria-label=${label} title=${label}
                        @pointerdown=${(/** @type {PointerEvent} */ e) => this._pressCamera(cmd, e)}
                        @pointerup=${() => this._releaseCamera()}
                        @pointercancel=${() => this._releaseCamera()}
                        @lostpointercapture=${() => this._releaseCamera()}
                        @keydown=${(/** @type {KeyboardEvent} */ e) => { if ((e.key === 'Enter' || e.key === ' ') && !e.repeat) { e.preventDefault(); this._pressCamera(cmd); } }}
                        @keyup=${() => this._releaseCamera()}
                        @contextmenu=${(/** @type {Event} */ e) => e.preventDefault()}>
                        <svg viewBox="0 0 24 24" aria-hidden="true"><path d=${path}/></svg>
                    </button>`)}
            </div>
        `;
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
        this._scene?.press(cmd);
    }

    /** @private */
    _releaseCamera() {
        this._scene?.release();
    }

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
        unregisterAstrometricsCard(this);
        this._endPick(null);
        this._stopScene();
        super._onDisconnected();
    }

    /** @protected */
    _getCardSize() {
        return Math.ceil((this._configPx(this.config?.height) || 400) / 50);
    }

    getGridOptions() {
        const go = this.config.grid_options || {};
        return {
            columns: go.columns ?? 12,
            rows: go.rows ?? 8,
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
