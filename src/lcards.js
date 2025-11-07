import { lcardsSetGlobalLogLevel, lcardsGetGlobalLogLevel, lcardsLog, lcardsLogBanner} from './utils/lcards-logging.js';
import * as LCARdS from './lcards-vars.js'
import { lcardsCore } from './core/lcards-core.js';

// Check URL for log level override and set it immediately
const urlLogLevel = new URLSearchParams(window.location.search).get('lcards_log_level');
if (urlLogLevel) {
    lcardsSetGlobalLogLevel(urlLogLevel);
}

// Display banner after log level is set
lcardsLogBanner();

// Now import everything else (including MSD system which will use correct log level)
import * as anime from 'animejs';
import { readYamlFile } from './utils/lcards-fileutils.js';
import { preloadSVGs, loadSVGToCache, getSVGFromCache } from './utils/lcards-fileutils.js';
import { LCARdSCardEditor } from './editor/lcards-editor.js';
import { loadFont, loadCoreFonts, loadAllFontsFromConfig } from './utils/lcards-theme.js';
import { getLovelace, checkLovelaceTemplates } from './utils/cb-helpers.js';
import { ButtonCard } from "./lcards-button-card.js"
import { createTimelines } from './utils/lcards-anim-helpers.js';
import { html } from 'lit';

import * as animHelpers from './utils/lcards-anim-helpers.js';
import { animPresets } from './utils/lcards-anim-presets.js';
import * as svgHelpers from './utils/lcards-svg-helpers.js';
import * as anchorHelpers from './utils/lcards-anchor-helpers.js';

// MSD system import
import './msd/index.js';

// Native card imports
import { LCARdSMSDCard } from './cards/lcards-msd.js';

// Unified API system import
import { LCARdSUnifiedAPI } from './api/LCARdSUnifiedAPI.js';


// Ensure global namespace
window.lcards = window.lcards || {};

// Promises for loading the templates and stub configuration
let templatesPromise;
let stubConfigPromise;
let themeColorsPromise;

// Load the templates from our yaml file
let templates = {};
let stubConfig = {};

// Ensure the lcards object exists on the window object
//window.lcards = window.lcards || {};
window.lcards.loadFont = loadFont;


async function initializeCustomCard() {

    // Call log banner function immediately when the script loads
    //window.lcards.lcardsLog = lcardsLog; // Expose the logging function globally

    // Expose debug helpers (the module already attaches API; this ensures references exist)
    window.lcards.debug = window.lcards.debug || {};
    window.lcards.debug.setLevel = lcardsSetGlobalLogLevel;

    // Animation namespace organization
    window.lcards.anim = {
        animejs: anime,                // full animejs module
        anime: anime.animate,          // shortcut for anime.animate
        utils: anime.utils,            // CENTRAL canonical utils reference
        animateElement: animHelpers.animateElement,
        animateWithRoot: animHelpers.animateWithRoot,
        waitForElement: animHelpers.waitForElement,
        presets: animPresets,
        scopes: new Map(),
    };

    // Backward-compatible shortcuts (to be deprecated)
    window.lcards.animejs = window.lcards.anim.animejs;
    window.lcards.anime = window.lcards.anim.anime;
    window.lcards.animateElement = window.lcards.anim.animateElement;
    window.lcards.animateWithRoot = window.lcards.anim.animateWithRoot;
    window.lcards.waitForElement = window.lcards.anim.waitForElement;


    window.lcards.svgHelpers = svgHelpers;
    window.lcards.anchorHelpers = anchorHelpers;
    window.lcards.findSvgAnchors = anchorHelpers.findSvgAnchors;
    window.lcards.getSvgContent = anchorHelpers.getSvgContent;
    window.lcards.getSvgViewBox = anchorHelpers.getSvgViewBox;
    window.lcards.getSvgAspectRatio = anchorHelpers.getSvgAspectRatio;


    window.lcards.loadFont = loadFont;
    window.lcards.loadUserSVG = async function(key, url) {
        return await loadSVGToCache(key, url);
    };
    window.lcards.getSVGFromCache = getSVGFromCache;

    // === CORE INFRASTRUCTURE (NEW) ===
    // Attach the LCARdSCore singleton (imported statically)
    window.lcards.core = lcardsCore;

    // Add core to debug API
    window.lcards.debug.core = () => lcardsCore.getDebugInfo();

    lcardsLog.info('[lcards.js] ✅ LCARdSCore singleton attached to window.lcards.core');

    ///load yaml configs
    // Await YAML configs
    templatesPromise = loadTemplates(LCARdS.templates_uri);
    stubConfigPromise = loadStubConfig(LCARdS.stub_config_uri);
    themeColorsPromise = loadThemeColors(LCARdS.theme_colors_uri);

    // Await SVG preload
    await preloadSVGs(LCARdS.builtin_svg_keys, LCARdS.builtin_svg_basepath)
        .catch(error => lcardsLog.error('[initializeCustomCard] Error preloading built-in SVGs:', error));

    // Await card dependencies
    const cardImports = [
        customElements.whenDefined('lcards-button-card'),
        customElements.whenDefined('my-slider-v2')
    ];
    await Promise.all(cardImports);

    // Await font loading if loadCoreFonts is async
    await loadCoreFonts();

    // Await YAML config loading
    await Promise.all([templatesPromise, stubConfigPromise, themeColorsPromise]);

    // Checks that custom element dependencies are defined for use in the cards
    if (!customElements.get('lcards-button-card')) {
        lcardsLog.error(`[initializeCustomCard] Custom Button Card for LCARS [lcards-button-card] was not found!`);
    }
    if (!customElements.get('my-slider-v2')) {
        lcardsLog.error(`[initializeCustomCard] 'My Cards' MySliderV2 Custom Card [my-slider-v2] was not found!`);
    }
}


// Initialize the custom card and register elements only after setup is complete
initializeCustomCard()
    .then(() => {
        defineCustomElement('lcards-base-card', LCARdSBaseCard, 'lcards-base-card-editor', LCARdSCardEditor);
        defineCustomElement('lcards-label-card', LCARdSLabelCard, 'lcards-label-card-editor', LCARdSCardEditor);
        defineCustomElement('lcards-elbow-card', LCARdSElbowCard, 'lcards-elbow-card-editor', LCARdSCardEditor);
        defineCustomElement('lcards-double-elbow-card', LCARdSDoubleElbowCard, 'lcards-double-elbow-card-editor', LCARdSCardEditor);
        defineCustomElement('lcards-multimeter-card', LCARdSMultimeterCard, 'lcards-multimeter-card-editor', LCARdSCardEditor);
        defineCustomElement('lcards-dpad-card', LCARdSDPADCard, 'lcards-dpad-card-editor', LCARdSCardEditor);
        defineCustomElement('lcards-button-card2', LCARdSButtonCard, 'lcards-button-card2-editor', LCARdSCardEditor);
        // defineCustomElement('lcards-msd-card', LCARdSMSDCard, 'lcards-msd-card-editor', LCARdSCardEditor);
        // ↳ MSD Card now self-registers as native element (no button-card dependency)
    })
    .catch(error => {
        lcardsLog.error('[initializeCustomCard.then()] Error initializing custom card:', error);
    });


async function loadTemplates(filePath) {
    try {
        const yamlContent = await readYamlFile(filePath);

        // Store the YAML content in window.lcards_card_templates
        window.lcards_card_templates = yamlContent.lcards_card_templates;

        // Merge the lcards stanza with the existing window.lcards object
        if (yamlContent.lcards) {
            window.lcards = {
                ...window.lcards,
                ...yamlContent.lcards
            };
        }

        templates = yamlContent || {};
        lcardsLog.debug(`[loadTemplates] LCARdS dashboard templates loaded from source file [${filePath}]`, templates);
    } catch (error) {
        lcardsLog.error('[loadTemplates] Failed to get the LCARdS lovelace templates from source file.', error);
    }
}

async function loadThemeColors(filePath) {
    try {
        const yamlContent = await readYamlFile(filePath);

        // Merge the lcards stanza with the existing window.lcards object
        if (yamlContent.lcards) {
            window.lcards = {
                ...window.lcards,
                ...yamlContent.lcards
            };
        }
        lcardsLog.info(`[loadThemeColors] LCARdS theme colors loaded from source file [${filePath}]`, yamlContent);
        setThemeColors(window.lcards.themes, 'green');
    } catch (error) {
        lcardsLog.error('[loadThemeColors] Failed to get the LCARdS theme colors from source file.', error);
    }
}

function setThemeColors(themes, alertCondition = 'green', clobber = false) {
    const selectedTheme = themes[`${alertCondition}_alert`];
    if (!selectedTheme) {
        lcardsLog.error(`[setThemeColors] Theme for alert condition ${alertCondition} is not defined.`, '', lcardsGetGlobalLogLevel());
        return;
    }

    const colors = selectedTheme.colors;
    const skippedColors = [];

    for (const [colorGroup, colorValues] of Object.entries(colors)) {
        for (const [colorName, colorValue] of Object.entries(colorValues)) {
            const cssVarName = `--${colorName}`;
            const existingValue = getComputedStyle(document.documentElement).getPropertyValue(cssVarName).trim();

            if (clobber || !existingValue) {
                lcardsLog.warn(`[setThemeColors] Color undefined or overridden - Setting ${cssVarName}=${colorValue}`, '', lcardsGetGlobalLogLevel());
                document.documentElement.style.setProperty(cssVarName, colorValue);
            } else {
                // Track skipped colors instead of logging each one
                skippedColors.push(cssVarName);
            }
        }
    }

    // Log summary of skipped colors (if any)
    if (skippedColors.length > 0) {
        lcardsLog.debug(`[setThemeColors] Preserved ${skippedColors.length} theme colors already defined by HA theme`, '', lcardsGetGlobalLogLevel());
    }
}
function setAlertCondition(alertCondition) {
    setThemeColors(window.lcards.themes, alertCondition,true);
}
window.lcards.setAlertCondition = setAlertCondition;

// Load the stub configuration from our yaml file
async function loadStubConfig(filePath) {
    try {
        const yamlContent = await readYamlFile(filePath);
        stubConfig = yamlContent || {};
        lcardsLog.debug(`[loadStubConfig] LCARdS stub configuration loaded from source file [${LCARdS.stub_config_uri}]`, stubConfig);
    } catch (error) {
        lcardsLog.error('[loadStubConfig] Failed to get the LCARdS stub configuration from source file.', error);
    }
}



// --- Anime.js v4 Scopes Manager ---
class LCARdSAnimationScope {
    constructor(id) {
        this.id = id;
        this.scope = window.lcards.animejs.createScope(); // anime.js v4 syntax
        this.animations = []; // Array to hold animation instances for inspection
        this._runningByTarget = new Map(); // Map<targetId, animation>
    }

    // Resolve the root for DOM operations
    _getRoot(options) {
        return (options && options.root) || document;
    }

    // Normalize targets into Element[]
    _resolveTargets(options) {
        const root = this._getRoot(options);
        const t = options && options.targets;
        if (!t) return [];
        if (t instanceof Element) return [t];
        if (Array.isArray(t)) return t.filter(Boolean);
        if (typeof t === 'string') {
            // Prefer ID fast-path
            if (t.startsWith('#')) {
                const el = root.querySelector(t);
                return el ? [el] : [];
            }
            return Array.from(root.querySelectorAll(t));
        }
        return [];
    }

    // Remove artifacts created by previous animation runs for a given baseId
    _cleanupArtifactsForTargetId(root, baseId) {
        if (!baseId) return;
        // Only remove preset-owned artifacts
        const trails = root.querySelectorAll(`#${baseId}_trail[data-lcards-owned]`);
        trails.forEach(n => n.parentElement && n.parentElement.removeChild(n));
        const tracers = root.querySelectorAll(`#${baseId}_tracer[data-lcards-owned]`);
        tracers.forEach(n => n.parentElement && n.parentElement.removeChild(n));

        // Clear CSS animation residue on the base element (e.g., march)
        const baseEl = root.getElementById(baseId);
        if (baseEl) {
            if (baseEl.style) baseEl.style.animation = '';
            baseEl.removeAttribute('data-march-anim-id');
        }
    }
    // Stop anime.js animations for the given targets and cleanup artifacts
    _cancelAndCleanupTargets(options) {
        const root = this._getRoot(options);
        const targets = this._resolveTargets(options);
        targets.forEach(el => {
            const id = el && el.id;
            if (!id) return;

            // Stop prior animations on this element (if any)
            if (this.scope && typeof this.scope.remove === 'function') {
                try { this.scope.remove(el); } catch (_) {}
            }

            // Remove previously created artifacts for this target
            this._cleanupArtifactsForTargetId(root, id);

            // Clear inline CSS animation remnants
            el.style && (el.style.animation = '');

            // Forget previous tracking entry
            this._runningByTarget.delete(id);
        });
        return targets;
    }

    /**
     * Adds an animation to the scope using the v4 `scope.add()` pattern.
     * De-duplicates by target: cancels prior animations and removes artifacts before starting a new one.
     * @param {object} options - The animation options for animateElement.
     * @param {object} hass - The Home Assistant hass object.
     */
    animate(options, hass = null) {
        const targets = this._cancelAndCleanupTargets(options);

        // Call the global animateElement helper, passing this instance as the scope.
        const animation = window.lcards.anim.animateElement(this, options, hass);
        if (animation) {
            this.animations.push({ config: options, animation: animation, targets });
            // Track per-target so future runs can be canceled/cleaned deterministically
            targets.forEach(el => el && el.id && this._runningByTarget.set(el.id, animation));
        }
    }

    destroy() {
        // Stop and remove all animations associated with this scope.
        if (this.scope && typeof this.scope.remove === 'function') {
            try {
                const activeAnimations = window.lcards.animejs.get(this.scope);
                if (activeAnimations) {
                    this.scope.remove(activeAnimations.map(anim => anim.targets).flat());
                }
            } catch (_) {}
        }

        // Cleanup artifacts for all tracked targets
        try {
            this.animations.forEach(entry => {
                const root = this._getRoot(entry.config);
                (entry.targets || []).forEach(el => {
                    if (el && el.id) {
                        this._cleanupArtifactsForTargetId(root, el.id);
                        el.style && (el.style.animation = '');
                    }
                });
            });
        } catch (_) {}

        // Clear internal tracking
        this._runningByTarget.clear();
        this.animations = [];
    }
}


class LCARdSBaseCard extends ButtonCard {

    _isResizeObserverEnabled = false;
    _resizeObserver;
    _logLevel = lcardsGetGlobalLogLevel();
    _resizeObserverTarget = 'this';
    _lastWidth = 0;
    _lastHeight = 0;
    _resizeObserverTolerance = 16; // Default tolerance for resize observer.  16 settles infinite resize in preview mode.
    _debounceWait = 100; // Default debounce wait time in milliseconds
    _isUsingLovelaceTemplate = false;
    _overrideTemplates = [];


    constructor () {
        super();
        this._resizeObserverTolerance = window.lcards.resizeObserverTolerance || this._resizeObserverTolerance;
        this._debounceWait = window.lcards.debounceWait || this._debounceWait;
        this._resizeObserver = new ResizeObserver(() => {
            lcardsLog.trace('[LCARdSBaseCard.constructor()] Resize observer fired', this, this._logLevel);
            this._debouncedResizeHandler();
        });
        this._debouncedResizeHandler = this._debounce(() => this._updateCardSize(), this._debounceWait);
    }


    setHass(hass) {
        lcardsLog.trace('[LCARdSBaseCard.setHass()] 🎯 RECEIVED setHass call:', {
            cardType: this.constructor.cardType,
            entity: this._config?.entity,
            oldState: this.hass?.states?.[this._config?.entity]?.state,
            newState: hass?.states?.[this._config?.entity]?.state,
            stateChanged: this.hass?.states?.[this._config?.entity]?.state !== hass?.states?.[this._config?.entity]?.state,
            timestamp: new Date().toISOString(),
            callerStack: new Error().stack.split('\n').slice(1, 3).map(line => line.trim()).join(' → ')
        });

        // Store the old HASS for LitElement change detection
        const oldHass = this.hass;

        // CRITICAL: Update _stateObj BEFORE setting HASS property to maintain sync with custom-button-card
        if (this._config?.entity && hass?.states?.[this._config.entity]) {
            const newStateObj = hass.states[this._config.entity];
            if (this._stateObj !== newStateObj) {
                lcardsLog.trace('[LCARdSBaseCard.setHass()] Updating _stateObj for entity:', this._config.entity, {
                    oldState: this._stateObj?.state,
                    newState: newStateObj?.state
                });
                this._stateObj = newStateObj;
            }
        }

        // Use property assignment to trigger LitElement's reactive system
        this.hass = hass;
        this._hass = hass; // Also set internal property for compatibility

        // Trigger LitElement's requestUpdate for proper change detection
        if (typeof this.requestUpdate === 'function') {
            this.requestUpdate('hass', oldHass);
            this.requestUpdate('_hass', oldHass);

            // Also trigger update for state object if it changed
            if (this._config?.entity && this._stateObj) {
                this.requestUpdate('_stateObj');
            }
        }

        lcardsLog.trace('[LCARdSBaseCard.setHass()] Completed with property assignment approach');
    }


    setConfig(config) {
        if (!config) {
            throw new Error("The 'lcards_card_config' section is required in the configuration.");
        }

        // DEBUGGING: Log the incoming config to see what MSD is passing
        lcardsLog.trace('[LCARdSBaseCard.setConfig()] Called with config:', {
            type: config.type,
            entity: config.entity,
            triggersUpdate: config.triggers_update,
            hasSetConfigFromMSD: config._msdGenerated || false,
            fullConfig: config
        });

        // Handle merging of templates array
        const defaultTemplates = ['lcards-base'];
        const userTemplates = (config.template) ? [...config.template] : [];
        const mergedTemplates = [...defaultTemplates, ...userTemplates];

        //REMOVE THIS
        // Set the _logLevel property from the location bar, config, or global function
        //const urlLogLevel = new URLSearchParams(window.location.search).get('lcards_log_level');
        //this._logLevel = urlLogLevel || config.lcards_log_level || lcardsGetGlobalLogLevel();
        //if (urlLogLevel) {
        //    lcardsSetGlobalLogLevel(urlLogLevel);
        //}

        // ENHANCED: Skip entity collection entirely for MSD cards
        let triggersUpdate = [];
        const isMSDCard = config.type === 'lcards-msd-card' ||
                        this.constructor.cardType === 'lcards-msd-card' ||
                        mergedTemplates.includes('lcards-msd');

        if (isMSDCard) {
            // MSD cards: NO entity tracking at all
            triggersUpdate = [];
            lcardsLog.trace(`[LCARdSBaseCard.setConfig()] MSD card detected: Completely disabling triggers_update`);
        } else {
            // Non-MSD cards: Normal entity collection
            const foundEntities = collectEntities(config);
            triggersUpdate = Array.isArray(config.triggers_update) ? config.triggers_update : [];

            if (config.triggers_update === 'all') {
                triggersUpdate = 'all';
            } else if (foundEntities.length > 0) {
                triggersUpdate = Array.from(new Set([...triggersUpdate, ...foundEntities]));
                lcardsLog.trace(`[LCARdSBaseCard.setConfig()] Non-MSD card - found entities for triggers_update:`, foundEntities);
            }
        }


        // Create a new object to avoid modifying the original config
        this._config = {
            ...config,
            template: mergedTemplates,
            triggers_update: triggersUpdate  // FIXED: Re-enabled triggers_update
        };

        //console.log('[LCARdSBaseCard.setConfig()] Final config triggers_update:', this._config.triggers_update);

        // Load all fonts from the config (dynamically loads fonts based on the config)
        loadAllFontsFromConfig(this._config);

        // Check if the card is using a template from the dashboard's yaml.
        // this will override the card's configuration
        // this could be on purpose for testing/customization - but more likely holdovers from the original version that used that method
        const { isUsingLovelaceTemplate, overriddenTemplates } = checkLovelaceTemplates(this._config);
        this._isUsingLovelaceTemplate = isUsingLovelaceTemplate;
        this._overrideTemplates = overriddenTemplates;

        // Log a warning if the card is using a template from the dashboard's yaml
        // add the card to a list of tainted cards
        if(isUsingLovelaceTemplate) {
            lcardsLog.warn(`[LCARdSBaseCard.setConfig()] Card configuration templates are being overridden with local dashboard YAML configuration.  Templates: ${overriddenTemplates.join(', ')}`, this, this._logLevel);
            window.lcards.taintedCards = window.lcards.taintedCards || [];
            window.lcards.taintedCards.push({card: this, templates: overriddenTemplates});
        }


        // Set up the resizeObserver properties
        this._resizeObserverTarget = config.resize_observer_target || 'this';
        this._isResizeObserverEnabled = (config.enable_resize_observer || (config.variables && config.variables.enable_resize_observer)) || false;
        this._resizeObserverTolerance = config.resize_observer_tolerance || this._resizeObserverTolerance;
        this._debounceWait = config.debounce_wait || this._debounceWait;
        // Enable the resize observer if any merged template contains the word 'animation'
        // this allows us to enable the observer for added animation templates without needed to explicity add it to the config
        if (mergedTemplates.some(template => template.includes('animation') || template.includes('symbiont'))) {
            this._isResizeObserverEnabled = true;
        }

        // Enable the resize observer if the configuration option is enabled
        if (this._isResizeObserverEnabled) {
            this.enableResizeObserver();
        }

        super.setConfig(this._config);
        //console.log('[LCARdSBaseCard.setConfig()] Called super.setConfig with final config:', {
        //    triggers_update: this._config.triggers_update,
        //    entity: this._config.entity,
        //    type: this._config.type
        //});

        // ADDED: Force state re-evaluation for LCARdS cards after config change
        if (this.hass && this._config.entity) {
            lcardsLog.trace('[LCARdSBaseCard.setConfig()] Forcing state re-evaluation after setConfig');

            // Force the card to re-evaluate its state-based styling
            setTimeout(() => {
                try {
                    lcardsLog.trace('[LCARdSBaseCard.setConfig()] Skipping forced setHass - will rely on normal HA update cycle');

                    // Method 2: Force render update (SAFE)
                    if (typeof this.requestUpdate === 'function') {
                        lcardsLog.trace('[LCARdSBaseCard.setConfig()] Forcing requestUpdate');
                        this.requestUpdate();
                    }

                    // Method 3: REMOVED - manual state manipulation can cause issues

                } catch (e) {
                    lcardsLog.warn('[LCARdSBaseCard.setConfig()] Failed to force state re-evaluation:', e);
                }
            }, 100);
        }

        lcardsLog.trace(`[LCARdSBaseCard.setConfig()] called with:`, this._config, this._logLevel);
    }

    static get editorType() {
        return 'lcards-base-card-editor';
    }
    static get cardType() {
        return 'lcards-base-card';
    }

    static get defaultConfig() {
        return {
            label: "LCARdS Base Card",
            show_label: true
        };
    }

    static getConfigElement() {

        const editorType = this.editorType;

        try {
            if (!customElements.get(editorType)) {
                lcardsLog.error(`[LCARdSBaseCard.getConfigElement()] Graphical editor element [${editorType}] is not defined defined in Home Assistant!`, null, this._logLevel);
                return null;
            }
            const element = document.createElement(editorType);
            //console.log('Element created:', element);
            return element;
        } catch (error) {
            lcardsLog.error(`[LCARdSBaseCard.getConfigElement()] Error creating element ${editorType}: `, error, this._logLevel);
            return null;
        }
    }

    static getStubConfig() {
        const cardType = this.cardType;
        if (stubConfig[cardType]) {
            return stubConfig[cardType];
        } else {
            return this.defaultConfig;
        }
    }

    getCardSize() {
        //return this._card ? this._card.getCardSize() : 4;
        super.getCardSize();
    }

    getLayoutOptions() {
        return {
          grid_rows: 1,
          grid_columns: 4
        };
      }


    connectedCallback() {
        super.connectedCallback();
        // --- Anime.js Scope creation ---
        this._animationScopeId = `card-${this.id || this.cardType || Math.random().toString(36).slice(2)}`;
        this._animationScope = new LCARdSAnimationScope(this._animationScopeId);
        window.lcards.anim.scopes.set(this._animationScopeId, this._animationScope);

        // CLEANUP: Stop previous timelines if any
        if (this._timelines && Array.isArray(this._timelines)) {
            this._timelines.forEach(tl => tl && typeof tl.pause === 'function' && tl.pause());
            this._timelines = null;
        }

        // NEW: Timelines now live under this._config.variables.msd.timelines
        // Build overlay config map from variables.msd.overlays for element-level merge
        const msdVars = this._config?.variables?.msd || {};
        const timelinesCfg = msdVars.timelines || null;
        const overlaysArr = Array.isArray(msdVars.overlays) ? msdVars.overlays : [];
        const overlayConfigsById = overlaysArr.reduce((acc, o) => {
            if (o && o.id) acc[o.id] = o;
            return acc;
        }, {});

        // Defer timeline creation until after the SVG/overlays have been stamped into the shadowRoot
        if (timelinesCfg) {
            requestAnimationFrame(() => {
            requestAnimationFrame(async () => {
                try {
                this._timelines = await animHelpers.createTimelines(
                    timelinesCfg,
                    this._animationScopeId,
                    this.shadowRoot,
                    overlayConfigsById,
                    this.hass || null,
                    msdVars.presets || {}      // <-- pass presets for state_resolver in timeline steps
                );
                // Do not force play(); let autoplay govern start/paused state
                } catch (e) {
                lcardsLog.error('[LCARdSBaseCard.connectedCallback] Error creating timelines:', e);
                }
            });
            });
        }

        // Check if the parent element has the class 'preview'
        if (this.parentElement && this.parentElement.classList.contains('preview')) {
            this.style.height = '60px';
            this.style.minHeight = '60px';
        } else {
            this.style.height = '100%';

            // Enable the resize observer when the card is connected to the DOM
            // but only if not in preview mode
            if (this._isResizeObserverEnabled) {
            this.enableResizeObserver();
            window.addEventListener('resize', this._debouncedResizeHandler);
            }
        }
    }

    disconnectedCallback() {
        super.disconnectedCallback();
        // --- Anime.js Scope cleanup ---
        const animationScope = window.lcards.anim.scopes.get(this._animationScopeId);
        if (animationScope) {
            //animationScope.destroy();
            animationScope.destroy();
            window.lcards.anim.scopes.delete(this._animationScopeId);
        }
        this.disableResizeObserver();
        window.removeEventListener('resize', this._debouncedResizeHandler)
    }

    _updateCardSize() {

        //lcardsLog('debug',`this.offset* dimensions: ${this.offsetWidth} x ${this.offsetHeight}`, this, this._logLevel);
        //lcardsLog('debug',`this.offsetParent.offset* dimensions: ${this.offsetParent.offsetWidth} x ${this.offsetParent.offsetHeight}`, this, this._logLevel);
        //lcardsLog('debug',`this.parentElement.offset* dimensions: ${this.parentElement.offsetWidth} x ${this.parentElement.offsetHeight}`, this, this._logLevel);

        const parentWidth = this.parentElement.offsetWidth;
        const parentHeight = this.parentElement.offsetHeight;
        //lcardsLog.debug(`Going with dimensions: ${parentWidth} x ${parentHeight}`, this, this._logLevel);

        const significantChange = this._resizeObserverTolerance;
        // Only update if there is a significant change
        if (parentWidth > 0 && parentHeight > 0 && (Math.abs(parentWidth - this._lastWidth) > significantChange || Math.abs(parentHeight - this._lastHeight) > significantChange)) {
            //if (Math.abs(parentWidth - this._lastWidth) > significantChange || Math.abs(parentHeight - this._lastHeight) > significantChange) {
            this._lastWidth = parentWidth;
            this._lastHeight = parentHeight;

            // Set CSS variables for the child card's dimensions
            this.style.setProperty('--button-card-width', `${parentWidth}px`);
            this.style.setProperty('--button-card-height', `${parentHeight}px`);

            if (!this._config) {
                lcardsLog.trace('[LCARdSBaseCard._updateCardSize()] Config is not defined. Skipping resize handling.', this, this._logLevel);
                return;
            }

            // Store the dimensions in the card's config
            if (!this._config.variables) {
                this._config.variables = { card: {} };
            }
            this._config.variables.card.width = `${parentWidth}px`;
            this._config.variables.card.height = `${parentHeight}px`;

            // Trigger an update if necessary
            this.setConfig(this._config);
        }
    }

    _updateResizeObserver() {
        if (this._isResizeObserverEnabled) {
            this.enableResizeObserver();
        } else {
            this.disableResizeObserver();
        }
    }

    enableResizeObserver() {
        const targetElement = this.resolveTargetElement(this._resizeObserverTarget);

        if (targetElement && this.isConnected) {
            this._resizeObserver.observe(targetElement);
            lcardsLog.trace(`[LCARdSBaseCard.enableResizeObserver()] Resize observer enabled on [${this._resizeObserverTarget}]`, this, this._logLevel);
        }
    }

    disableResizeObserver() {
        if (this._resizeObserver) {
            this._resizeObserver.disconnect();
        }
        lcardsLog.trace(`[LCARdSBaseCard.disableResizeObserver()] Resize observer disabled`, this._logLevel);
    }

    toggleResizeObserver() {
        this._isResizeObserverEnabled = !this._isResizeObserverEnabled;
        this._updateResizeObserver();
    }

    resolveTargetElement(target) {
        const targetMapping = {
            'this': () => this,
            'this.parentElement': () => this.parentElement,
            'this.offsetParent': () => this.offsetParent,
            // Add more mappings as needed
        };

        return targetMapping[target] ? targetMapping[target]() : this;
    }
    _debounce(func, wait) {
        let timeout;
        return function(...args) {
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(this, args), wait);
        };
    }

    /**
     * Rebuild timelines for this card instance.
     * Safe to call after overlays have been stamped; uses double-rAF for DOM availability.
     * @param {object} timelinesCfg
     * @param {object} overlayConfigsById
     * @param {object} presets
     */
    _rebuildTimelines(timelinesCfg, overlayConfigsById = {}, presets = {}) {
        if (!timelinesCfg) return;

        // Stop previous timelines
        if (this._timelines && Array.isArray(this._timelines)) {
        this._timelines.forEach(tl => tl && typeof tl.pause === 'function' && tl.pause());
        this._timelines = null;
        }

        // Defer to next paints to ensure DOM is present
        requestAnimationFrame(() => {
        requestAnimationFrame(async () => {
            try {
            this._timelines = await window.lcards.anim.createTimelines
                ? window.lcards.anim.createTimelines(
                    timelinesCfg,
                    this._animationScopeId,
                    this.shadowRoot,
                    overlayConfigsById,
                    this.hass || null,
                    presets || {}
                )
                : createTimelines(
                    timelinesCfg,
                    this._animationScopeId,
                    this.shadowRoot,
                    overlayConfigsById,
                    this.hass || null,
                    presets || {}
                );
            } catch (e) {
            lcardsLog.error('[LCARdSBaseCard._rebuildTimelines] Error creating timelines:', e);
            }
        });
        });
    }
}

// Helper: Recursively collect all 'entity' and 'entity_id' values in an object
function collectEntities(obj, entities = []) {
    if (Array.isArray(obj)) {
        obj.forEach(item => collectEntities(item, entities));
    } else if (obj && typeof obj === 'object') {
        for (const [key, value] of Object.entries(obj)) {
            if ((key === 'entity' || key === 'entity_id') && typeof value === 'string') {
                entities.push(value);
            } else {
                collectEntities(value, entities);
            }
        }
    }
    return entities;
}

class LCARdSLabelCard extends LCARdSBaseCard {
    static get editorType() {
        return 'lcards-label-card-editor';
    }

    static get cardType() {
        return 'lcards-label-card';
    }

    static get defaultConfig() {
        return {
            label: "LCARdS Label",
            show_label: true
        };
    }

    setConfig(config) {
        const defaultCardType = 'lcards-label';
        const defaultTemplates = [config.lcards_card_type ? config.lcards_card_type : defaultCardType];
        const userTemplates = (config.template) ? [...config.template] : [];
        const mergedTemplates = [...defaultTemplates, ...userTemplates];

        const specialConfig = {
            ...config,
            template: mergedTemplates,
        };

        super.setConfig(specialConfig);
    }
}

class LCARdSElbowCard extends LCARdSBaseCard {
    static get editorType() {
        return 'lcards-elbow-card-editor';
    }

    static get cardType() {
        return 'lcards-elbow-card';
    }

    static get defaultConfig() {
        return {
            variables: {
                card: {
                    border: {
                        left: { size: 90 },
                        top: { size: 20 }
                    }
                }
            }
        };
    }

    setConfig(config) {

        const defaultCardType = 'lcards-header';
        const defaultTemplates = [config.lcards_card_type ? config.lcards_card_type : defaultCardType];
        const userTemplates = (config.template) ? [...config.template] : [];
        const mergedTemplates = [...defaultTemplates, ...userTemplates];

        const specialConfig = {
            ...config,
            template: mergedTemplates,
        };
        super.setConfig(specialConfig);
    }

    getLayoutOptions() {
        return {
            grid_rows: 1,
            grid_columns: 4
        };
      }
}

class LCARdSDoubleElbowCard extends LCARdSBaseCard {
    static get editorType() {
        return 'lcards-double-elbow-card-editor';
    }

    static get cardType() {
        return 'lcards-double-elbow-card';
    }

    static get defaultConfig() {
        return {
            };
    }

    setConfig(config) {

        const defaultCardType = 'lcards-header-picard';
        const defaultTemplates = [config.lcards_card_type ? config.lcards_card_type : defaultCardType];
        const userTemplates = (config.template) ? [...config.template] : [];
        const mergedTemplates = [...defaultTemplates, ...userTemplates];

        const specialConfig = {
            ...config,
            template: mergedTemplates,
        };
        super.setConfig(specialConfig);
    }

    getLayoutOptions() {
        return {
            grid_rows: 1,
            grid_columns: 4
        };
      }
}

class LCARdSMultimeterCard extends LCARdSBaseCard {
    static get editorType() {
        return 'lcards-multimeter-card-editor';
    }

    static get cardType() {
        return 'lcards-multimeter-card';
    }

    static get defaultConfig() {
        return {
            variables: {
                _mode: 'gauge'
            }
        };
    }

    constructor() {
        super();
        this._enableResizeObserver = true;
    }

    setConfig(config) {

        const defaultTemplates = ['lcards-multimeter'];
        const userTemplates = (config.template) ? [...config.template] : [];
        const mergedTemplates = [...defaultTemplates, ...userTemplates];

        const specialConfig = {
            ...config,
            template: mergedTemplates,
        };
        super.setConfig(specialConfig);
    }

    getLayoutOptions() {
        return {
            grid_rows: 1,
            grid_columns: 4
        };
      }

    render() {
        if (!customElements.get('my-slider-v2')) {
            return html`<ha-alert alert-type="error" title="LCARdS - Dependency Error">Required 'my-slider-v2' card is not available - Please refer to the documentation.</ha-alert>`;
        }

        // Render the card normally
        return super.render();
    }
}

class LCARdSDPADCard extends LCARdSBaseCard {
    static get editorType() {
        return 'lcards-dpad-card-editor';
    }

    static get cardType() {
        return 'lcards-dpad-card';
    }

    static get defaultConfig() {
        return {};
    }

    setConfig(config) {

        const defaultTemplates = ['lcards-dpad'];
        const userTemplates = (config.template) ? [...config.template] : [];
        const mergedTemplates = [...defaultTemplates, ...userTemplates];

        const specialConfig = {
            ...config,
            template: mergedTemplates,
        };
        super.setConfig(specialConfig);
    }

    getLayoutOptions() {
        return {
            grid_rows: 4,
            grid_columns: 2
        };
      }
}

class LCARdSButtonCard extends LCARdSBaseCard {
    static get editorType() {
        return 'lcards-button-card-editor';
    }

    static get cardType() {
        return 'lcards-button-card';
    }

    static get defaultConfig() {
        return {
            label: "LCARdS Button",
            show_label: true
        };
    }

    setConfig(config) {

        const defaultCardType = 'lcards-button-lozenge';
        const defaultTemplates = [config.lcards_card_type ? config.lcards_card_type : defaultCardType];
        const userTemplates = (config.template) ? [...config.template] : [];
        const mergedTemplates = [...defaultTemplates, ...userTemplates];

        const specialConfig = {
            ...config,
            template: mergedTemplates,
        };
        super.setConfig(specialConfig);

    }

    getLayoutOptions() {
        return {
            grid_min_rows: 1,
            grid_rows: 1,
            grid_columns: 2,
            grid_min_columns: 1
        };
      }
}

// Helper function to define custom elements and their editors
function defineCustomElement(cardType, cardClass, editorType, editorClass) {
    customElements.define(cardType, cardClass);
    customElements.define(editorType, class extends editorClass {
        constructor() {
            super(cardType);
        }
    });
}

// Register the cards to be available in the GUI editor
window.customCards = window.customCards || [];
const LCARdSCardClasses = [
    {
        type: 'lcards-base-card',
        name: 'LCARdS Base Card',
        description: 'For advanced use: the LCARdS base card for full manual configuration.',
        documentationURL: "https://cb-lcars.unimatrix01.ca",
    },
    {
        type: 'lcards-label-card',
        name: 'LCARdS Label',
        preview: true,
        description: 'LCARdS label card for text.',
        documentationURL: "https://cb-lcars.unimatrix01.ca",
    },
    {
        type: 'lcards-elbow-card',
        name: 'LCARdS Elbow',
        preview: true,
        description: 'LCARdS Elbow card',
        documentationURL: "https://cb-lcars.unimatrix01.ca",
    },
    {
        type: 'lcards-double-elbow-card',
        name: 'LCARdS Double Elbow',
        preview: true,
        description: 'LCARdS Double Elbow card',
        documentationURL: "https://cb-lcars.unimatrix01.ca",
    },
    {
        type: 'lcards-multimeter-card',
        name: 'LCARdS Multimeter',
        preview: true,
        description: 'LCARdS Multimeter card',
        documentationURL: "https://cb-lcars.unimatrix01.ca",
    },
    {
        type: 'lcards-dpad-card',
        name: 'LCARdS D-Pad',
        preview: true,
        description: 'LCARdS D-Pad card',
        documentationURL: "https://cb-lcars.unimatrix01.ca",
    },
    {
        type: 'lcards-button-card2',
        name: 'LCARdS Button',
        preview: true,
        description: 'LCARdS Buttons [various styles]',
        documentationURL: "https://cb-lcars.unimatrix01.ca",
    },
    {
        type: 'lcards-msd-card',
        name: 'LCARdS MSD',
        preview: true,
        description: 'LCARdS Master Systems Display (MSD) card',
        documentationURL: "https://cb-lcars.unimatrix01.ca",
    }
];

window.customCards.push(...LCARdSCardClasses);