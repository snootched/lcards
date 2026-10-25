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

/** Config keys the scene reads; a change to anything else does not rebuild it */
const SCENE_KEYS = ['camera', 'backdrop', 'labels', 'points', 'objects'];

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
            _failure: { type: String, state: true }
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
        this._startScene();
    }

    /**
     * Back after a view switch: rebuild (the scene was disposed on disconnect).
     * @protected
     */
    async _onConnected() {
        await super._onConnected();
        if (this._firstUpdateDone && !this._inPicker && !this._scene && this.isConnected) this._startScene();
    }

    /**
     * The scene-relevant part of the config (camera, backdrop, labels, points, objects).
     * @private
     */
    _sceneConfig() {
        /** @type {Record<string, any>} */
        const out = {};
        for (const key of SCENE_KEYS) if (this.config?.[key] !== undefined) out[key] = this.config[key];
        return out;
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
        this._scene = runtime.createAstroScene(host, config, {
            hass: this.hass,
            resolveColor,
            onTap: (hit) => this._onSceneAction(hit, 'tap_action'),
            onHold: (hit) => { this._onSceneAction(hit, 'hold_action'); },
            onFail: (reason) => { this._failure = reason in FAILURES ? reason : 'render failed'; }
        });
        this._syncBackground();
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
                this._scene.setConfig(config);
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
        if (action.action === 'fly-to') {
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
        this._actionHandler.runAction(action, this.hass, this, this.config?.entity ?? null);
        return true;
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
                ${failure ? html`
                    <div class="astro-failure" role="status">
                        <div class="title">3D VIEW UNAVAILABLE</div>
                        <div class="reason">${failure}</div>
                    </div>` : ''}
            </div>
        `;
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
