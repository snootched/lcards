/**
 * LCARdS Slider Card
 *
 * Interactive slider and gauge card using SVG component templates with dynamic
 * zone injection. Supports sliders for lights, covers, fans, and input_number
 * entities, as well as read-only gauge displays for sensors.
 *
 * Architecture:
 * - SVG Component: Card loads a static SVG file defining the visual shell
 *   (borders, masks, elbows) with marked zones via data-zone attributes
 * - Dynamic Generation: Pills/gauge elements are dynamically generated and
 *   injected into the correct zone at runtime
 * - Track System: Pills rendered using count/gap/shape parameters from config
 * - Control Overlay: HTML <input type="range"> overlayed as invisible control
 * - Preset System: Style presets define visual appearance (pills-basic, gauge-basic)
 *
 * Visual Styles:
 * - Pills: Segmented bar style (preset: 'pills-basic')
 * - Gauge: Ruler with tick marks (preset: 'gauge-basic')
 *
 * Interactivity:
 * - Automatically determined by entity domain (lights, fans, etc. = interactive)
 * - Can be explicitly controlled via control.locked: true|false
 * - Sensors and unknown domains default to locked (display-only)
 *
 * Features:
 * - Preset-based styling matching button card pattern
 * - Separate visual style (pills/gauge) from interactivity (locked state)
 * - Support for light, cover, fan, input_number, number, sensor domains
 * - Configurable control attribute (e.g., brightness, temperature, etc.)
 * - Dynamic pill generation with count, gap, radius, color interpolation
 * - Gauge mode with ruler, ticks, labels, and progress indicator
 * - Memoized content generation for performance
 * - SVG zone-based layout system for flexible visual designs
 * - Inherits text field system from LCARdSButton for consistent API
 *
 * @example Basic Light Slider with Pills (using preset)
 * ```yaml
 * type: custom:lcards-slider
 * entity: light.bedroom
 * preset: pills-basic
 * orientation: horizontal
 * control:
 *   attribute: brightness
 * ```
 *
 * @example Gauge Display (using preset)
 * ```yaml
 * type: custom:lcards-slider
 * entity: sensor.temperature
 * preset: gauge-basic
 * orientation: horizontal
 * ```
 *
 * @example Advanced - Custom style overrides
 * ```yaml
 * type: custom:lcards-slider
 * entity: light.desk
 * preset: pills-basic
 * orientation: vertical
 * style:
 *   track:
 *     segments:
 *       count: 20
 *       gap: 2
 *   gauge:
 *     scale:
 *       tick_marks:
 *         major:
 *           interval: 20
 * control:
 *   locked: false
 * ```
 *
 * @example Advanced SVG Component
 * ```yaml
 * type: custom:lcards-slider
 * entity: light.bedroom
 * preset: pills-basic
 * component: picard-vertical  # Advanced SVG component
 * ```
 *
 * @extends {LCARdSButton}
 */


import { html, css } from 'lit';
import { unsafeHTML } from 'lit/directives/unsafe-html.js';
import { LCARdSButton } from './lcards-button.js';
import { lcardsLog } from '../utils/lcards-logging.js';
import { deepMerge } from '../utils/deepMerge.js';
import { resolveThemeTokensRecursive } from '../utils/lcards-theme.js';
import { ColorUtils } from '../core/themes/ColorUtils.js';
import { getSliderComponent, getSliderComponentNames } from '../core/packs/components/sliders/index.js';

// Import unified schema
import { getSliderSchema } from './schemas/slider-schema.js';

// Import editor (registers custom element)
import '../editor/cards/lcards-slider-editor.js';

export class LCARdSSlider extends LCARdSButton {

    /** Card type identifier for CoreConfigManager */
    static CARD_TYPE = 'slider';

    static get properties() {
        return {
            ...super.properties,
            _sliderValue: { type: Number, state: true },
            _mode: { type: String, state: true },
            _sliderStyle: { type: Object, state: true },
            _containerSize: { type: Object, state: true }
        };
    }

    static get styles() {
        return [
            super.styles,
            css`
                :host {
                    display: block;
                    width: 100%;
                    height: 100%;
                }

                .slider-container {
                    width: 100%;
                    height: 100%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    position: relative;
                    box-sizing: border-box;
                    /* CSS borders applied via inline styles from config */
                }

                .slider-svg {
                    display: block;
                    width: 100%;
                    height: 100%;
                }

                .text-overlay {
                    position: absolute;
                    display: flex;
                    flex-direction: column;
                    gap: 2px;
                    pointer-events: none;
                    z-index: 5;
                }

                .text-field {
                    font-family: 'LCARS', 'Antonio', sans-serif;
                    font-size: 14px;
                    line-height: 1.2;
                    color: var(--lcars-white, #ffffff);
                    white-space: nowrap;
                }

                .slider-input-overlay {
                    position: absolute;
                    margin: 0;
                    padding: 0;
                    -webkit-appearance: none;
                    appearance: none;
                    background: transparent;
                    border: none;
                    outline: none;
                    opacity: 0;
                    cursor: pointer;
                    z-index: 10;
                    pointer-events: auto;
                }

                /* Slider track styling */
                .slider-input-overlay::-webkit-slider-runnable-track {
                    background: transparent;
                    border: none;
                    cursor: pointer;
                    height: 100%;
                }

                .slider-input-overlay::-moz-range-track {
                    background: transparent;
                    border: none;
                    cursor: pointer;
                    height: 100%;
                }

                .slider-input-overlay::-webkit-slider-thumb {
                    -webkit-appearance: none;
                    appearance: none;
                    width: 20px;
                    height: 100%;
                    background: transparent;
                    cursor: pointer;
                    border: none;
                }

                .slider-input-overlay::-moz-range-thumb {
                    width: 20px;
                    height: 100%;
                    background: transparent;
                    cursor: pointer;
                    border: none;
                }

                .slider-loading {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    min-height: 40px;
                    color: var(--primary-text-color, var(--lcards-moonlight, #d3d3d3));
                    font-size: 14px;
                    opacity: 0.7;
                }

                /* Pills styling */
                .pill {
                    transition: opacity 0.15s ease-out;
                }

                /* Gauge indicator styling */
                .gauge-indicator {
                    transition: cy 0.15s ease-out, cx 0.15s ease-out;
                }
            `
        ];
    }

    constructor() {
        super();

        // Slider state
        this._sliderValue = 0;
        this._mode = 'pills'; // 'pills' or 'gauge'
        this._sliderStyle = null;
        this._containerSize = { width: 200, height: 60 };

        // SVG component state
        this._componentSvg = null;       // Parsed SVG DOM
        this._zones = new Map();          // Zone elements and bounds
        this._componentLoaded = false;
        this._componentMetadata = null;   // NEW: Component metadata (zones, features, etc.)

        // Memoization for performance
        this._memoizedTrack = null;
        this._memoizedTrackConfig = null;
        this._memoizedGauge = null;
        this._memoizedGaugeConfig = null;

        // Control configuration (derived from config + entity)
        this._controlConfig = {
            min: 0,
            max: 100,
            step: 1,
            attribute: null,
            locked: false
        };

        // Display configuration (derived from config + entity)
        // Defines visual scale range (what pills/gauge render)
        this._displayConfig = {
            min: 0,
            max: 100,
            unit: ''
        };

        // Entity domain for behavior
        this._domain = null;

        // Bind event handlers
        this._handleSliderInput = this._handleSliderInput.bind(this);
        this._handleSliderChange = this._handleSliderChange.bind(this);
    }

    /**
     * Called when config is set
     * Overrides button's _onConfigSet to skip button style resolution
     * @protected
     * @override
     */
    _onConfigSet(config) {
        // Call LCARdSCard._onConfigSet() directly, skipping button's override
        // This prevents button's _resolveButtonStyleSync() from running
        // We need LCARdSCard's setup (entity, rules, datasources) but not button's style resolution
        Object.getPrototypeOf(LCARdSButton.prototype)._onConfigSet.call(this, config);

        // Process SVG configuration (slider-specific logic)
        this._processSvgConfig();

        // Resolve style FIRST (synchronously, with manual preset resolution)
        // This happens BEFORE CoreConfigManager async processing
        this._resolveSliderStyleSync();

        // Update entity context (reads style.track.type from merged style)
        this._updateEntityContext();

        // Load SVG component if specified
        if (config.component) {
            this._loadSliderComponent();
        }

        // Re-process templates now that slider style is resolved
        if (this._initialized) {
            this._scheduleTemplateUpdate();
        } else {
            this._needsInitialTemplateProcessing = true;
        }

        lcardsLog.debug(`[LCARdSSlider] Config set`, {
            entity: config.entity,
            component: config.component,
            mode: this._mode,
            domain: this._domain
        });
    }

    /**
     * Hook called when config is updated by CoreConfigManager
     * Re-resolve slider style to use the merged config with provenance tracking
     * @protected
     * @override
     */
    _onConfigUpdated() {
        lcardsLog.debug(`[LCARdSSlider] Config updated by CoreConfigManager, re-resolving slider style`);

        // Re-process SVG configuration (in case config was replaced by CoreConfigManager)
        this._processSvgConfig();

        // Re-resolve slider style with the new merged config (has provenance!)
        this._resolveSliderStyleSync();

        // Re-load component if specified (now that preset is merged, track.type will be preserved)
        if (this.config.component) {
            this._loadSliderComponent();
        }

        // Re-update entity context (now reads the correct style.track.type from merged preset)
        this._updateEntityContext();
    }

    /**
     * Hook called after templates are processed (from base class)
     * Overrides button's version to use slider style resolution
     * @protected
     * @override
     */
    _onTemplatesChanged() {
        lcardsLog.debug(`[LCARdSSlider] Templates changed, re-resolving slider style`);

        // Resolve slider style after templates change
        this._resolveSliderStyleSync();

        // CRITICAL: Always trigger re-render when templates change
        this.requestUpdate();
    }

    /**
     * Override button's SVG config processing
     * Slider has its own component system and doesn't use button presets
     * @protected
     * @override
     */
    _processSvgConfig() {
        // Skip button's preset loading - slider handles components via _loadSliderComponent()
        // This prevents "Component preset not found" errors for slider components
        lcardsLog.debug(`[LCARdSSlider] _processSvgConfig override - skipping button preset logic`);
    }

    /**
     * Handle HASS updates
     * @protected
     */
    _handleHassUpdate(newHass, oldHass) {
        // Update entity value
        if (this.config.entity && this._entity) {
            const oldState = oldHass?.states[this.config.entity];
            const newState = this._entity;

            // Get values
            const oldValue = this._getEntityValue(oldState);
            const newValue = this._getEntityValue(newState);

            // Initialize value on first load (oldHass is null/undefined)
            // OR update if value changed
            if (!oldHass || oldValue !== newValue) {
                const previousValue = this._sliderValue;
                this._sliderValue = newValue;

                lcardsLog.debug(`[LCARdSSlider] Value ${!oldHass ? 'initialized' : 'changed'}: ${previousValue} -> ${newValue}`);

                // Update pill opacities without regenerating track
                this._updateDynamicElements();
            }

            // Update control config if entity attributes changed
            this._updateControlConfig();
        }
    }

    /**
     * First update hook - setup ResizeObserver and initial value
     * @protected
     */
    _handleFirstUpdate(changedProperties) {
        // NOTE: Do NOT call super._handleFirstUpdate() - it doesn't exist
        // This is an optional hook called by parent's _onFirstUpdated()

        // Setup auto-sizing
        this._setupAutoSizing((width, height) => {
            this._containerSize = { width, height };
            this._invalidateMemoization();
            this.requestUpdate();
        });

        // Initialize slider value from entity
        if (this._entity) {
            this._sliderValue = this._getEntityValue(this._entity);
        }

        // NEW: Trigger initial pill opacity update
        if (this._mode === 'pills') {
            // Use requestAnimationFrame to ensure SVG is rendered before updating
            requestAnimationFrame(() => {
                this._updatePillOpacities();
            });
        }

        // Register for rules
        if (this.config.id) {
            this._registerOverlayForRules(`slider-${this.config.id}`, ['slider']);
        } else {
            this._registerOverlayForRules(`slider-${this._cardGuid}`, ['slider']);
        }
    }

    /**
     * Called after each render - update dynamic elements
     * @protected
     */
    updated(changedProperties) {
        super.updated(changedProperties);

        // Update pill opacities after render completes
        // This ensures pills reflect current value on first load and subsequent updates
        if (this._mode === 'pills') {
            this._updatePillOpacities();
        } else {
            this._updateGaugeIndicator();
        }
    }

    /**
     * Update entity context and determine track visual style
     * @private
     */
    _updateEntityContext() {
        // Extract domain from entity ID (if entity is defined)
        if (this.config.entity) {
            this._domain = this.config.entity.split('.')[0];
        } else {
            this._domain = null;
        }

        // Determine track visual style (pills vs gauge ruler)
        // ✅ ONLY use track.type (never config.mode)
        const trackType = this._sliderStyle?.track?.type;
        const validTypes = ['pills', 'gauge'];

        if (trackType && validTypes.includes(trackType)) {
            this._mode = trackType;
        } else {
            // Default based on domain (fallback if no preset or style.track.type)
            const interactiveDomains = ['light', 'cover', 'fan', 'input_number', 'number'];
            this._mode = interactiveDomains.includes(this._domain) ? 'pills' : 'gauge';
        }

        // Update control config (handles locked state based on domain)
        this._updateControlConfig();
    }

    /**
     * Get default attribute for current entity domain
     * @private
     * @returns {string|null}
     */
    _getDefaultAttribute() {
        switch (this._domain) {
            case 'light': return 'brightness';
            case 'cover': return 'current_position';
            case 'fan': return 'percentage';
            default: return null;
        }
    }

    /**
     * Update control and display configuration from entity and config
     * Separates control range (what user can set) from display range (what visuals show)
     * @private
     */
    _updateControlConfig() {
        const config = this.config;
        const entity = this._entity;

        // Determine if entity is controllable based on domain
        const controllableDomains = ['light', 'cover', 'fan', 'input_number', 'number'];
        const isControllable = controllableDomains.includes(this._domain);

        // CONTROL CONFIG: What user can set via slider input
        this._controlConfig = {
            min: config.control?.min ?? entity?.attributes?.min ?? 0,
            max: config.control?.max ?? entity?.attributes?.max ?? 100,
            step: config.control?.step ?? entity?.attributes?.step ?? 1,
            attribute: config.control?.attribute ?? this._getDefaultAttribute(),
            locked: config.control?.locked ?? !isControllable
        };

        // DISPLAY CONFIG: What visual scale shows (from style.track.display)
        // Default to control range if not explicitly configured (no breaking changes)
        this._displayConfig = {
            min: this._sliderStyle?.track?.display?.min ?? this._controlConfig.min,
            max: this._sliderStyle?.track?.display?.max ?? this._controlConfig.max,
            unit: this._sliderStyle?.track?.display?.unit ?? entity?.attributes?.unit_of_measurement ?? ''
        };

        lcardsLog.debug('[LCARdSSlider] Config resolved:', {
            control: this._controlConfig,
            display: this._displayConfig
        });
    }

    /**
     * Get value from entity state and convert to control config range
     * @private
     */
    _getEntityValue(entity) {
        if (!entity) return 0;

        const attribute = this._controlConfig.attribute;
        let rawValue = 0;

        if (attribute && entity.attributes?.[attribute] !== undefined) {
            rawValue = parseFloat(entity.attributes[attribute]) || 0;
        } else {
            // Use state directly for input_number, number, sensor
            const state = parseFloat(entity.state);
            rawValue = isNaN(state) ? 0 : state;
        }

        // Convert from entity's native range to slider value range
        // This is necessary for lights (brightness 0-255 → percentage 0-100)
        if (this._domain === 'light' && attribute === 'brightness') {
            // Convert brightness (0-255) to percentage (0-100)
            // The slider operates in percentage space, regardless of control min/max
            return (rawValue / 255) * 100;
        }

        // For other domains, return raw value (already in correct range)
        return rawValue;
    }

    /**
     * Resolve slider style synchronously
     * NOTE: CoreConfigManager has already merged: behavioral → theme → preset → component → user
     * This method only needs to apply dynamic rule patches
     * @private
     */
    _resolveSliderStyleSync() {
        // Start with config.style (already has preset + component merged by CoreConfigManager)
        let style = this.config.style ? deepMerge({}, this.config.style) : {};

        lcardsLog.debug(`[LCARdSSlider] Resolving slider style`, {
            hasStyle: !!this.config.style,
            styleKeys: Object.keys(style)
        });

        // Apply rule patches (dynamic, happens at render time)
        style = this._getMergedStyleWithRules(style);

        this._sliderStyle = style;
    }


    /**
     * Load and parse SVG component
     * @private
     */
    async _loadSliderComponent() {
        const componentName = this.config.component;
        if (!componentName) {
            this._componentSvg = null;
            this._componentLoaded = false;
            this._componentMetadata = null; // NEW
            return;
        }

        lcardsLog.debug(`[LCARdSSlider] Loading component: ${componentName}`);

        try {
            // Get component metadata object
            let component = getSliderComponent(componentName);
            let svgContent;

            if (component) {
                // Component found in registry - use metadata
                svgContent = component.svg;
                
                // NEW: Store metadata for later use
                this._componentMetadata = component.metadata;

                // Set orientation from component metadata if not explicitly configured
                if (!this.config.style?.track?.orientation) {
                    if (!this._sliderStyle) {
                        this._sliderStyle = {};
                    }

                    // Preserve existing track properties (don't wipe out type: 'pills' from preset)
                    const existingTrack = this._sliderStyle.track || {};
                    lcardsLog.debug(`[LCARdSSlider] Setting orientation, existing track:`, existingTrack);

                    this._sliderStyle.track = {
                        ...existingTrack,
                        orientation: component.orientation
                    };

                    lcardsLog.debug(`[LCARdSSlider] Using component orientation: ${component.orientation}, track:`, this._sliderStyle.track);
                }

                // Log component features for debugging
                if (component.features && component.features.length > 0) {
                    lcardsLog.debug(`[LCARdSSlider] Component features: ${component.features.join(', ')}`);
                }

            } else {
                // Try to fetch from external URL
                svgContent = await this._fetchExternalComponent(componentName);
                this._componentMetadata = null; // No metadata for external components
            }

            if (!svgContent) {
                lcardsLog.error(`[LCARdSSlider] Component not found: ${componentName}`);
                this._componentSvg = null;
                this._componentLoaded = false;
                this._componentMetadata = null;
                return;
            }

            // Parse SVG to DOM
            const parser = new DOMParser();
            const doc = parser.parseFromString(svgContent, 'image/svg+xml');

            // Check for parse errors
            const parserError = doc.querySelector('parsererror');
            if (parserError) {
                lcardsLog.error(`[LCARdSSlider] SVG parse error:`, parserError.textContent);
                this._componentSvg = null;
                this._componentLoaded = false;
                this._componentMetadata = null;
                return;
            }

            this._componentSvg = doc.documentElement;

            // Replace color placeholders
            this._injectComponentColors();

            // Extract zone definitions
            this._extractZones();

            this._componentLoaded = true;

            lcardsLog.debug(`[LCARdSSlider] Component loaded with ${this._zones.size} zones`);

            this.requestUpdate();

        } catch (error) {
            lcardsLog.error(`[LCARdSSlider] Component load failed:`, error);
            this._componentSvg = null;
            this._componentLoaded = false;
            this._componentMetadata = null;
        }
    }

    /**
     * Fetch external component SVG
     * @private
     */
    async _fetchExternalComponent(componentName) {
        // Try common paths
        const paths = [
            `/hacsfiles/lcards/components/slider-backgrounds/${componentName}.svg`,
            `/local/lcards/components/slider-backgrounds/${componentName}.svg`,
            `/local/components/slider-backgrounds/${componentName}.svg`
        ];

        for (const path of paths) {
            try {
                const response = await fetch(path);
                if (response.ok) {
                    return await response.text();
                }
            } catch {
                // Continue to next path
            }
        }

        return null;
    }

    /**
     * Inject colors into component SVG placeholders
     * @private
     */
    _injectComponentColors() {
        if (!this._componentSvg) return;

        const colorMap = {
            '{{BORDER_COLOR}}': this._sliderStyle?.border?.color?.active || 'var(--lcars-orange, var(--lcards-orange-medium, #ff7700))',
            '{{BORDER_COLOR_INACTIVE}}': this._sliderStyle?.border?.color?.inactive || 'var(--lcars-gray, var(--lcards-gray-medium, #666688))',
            '{{GRADIENT_START}}': this._sliderStyle?.track?.segments?.gradient?.start || 'var(--error-color, var(--lcards-orange-dark, #cc2200))',
            '{{GRADIENT_END}}': this._sliderStyle?.track?.segments?.gradient?.end || 'var(--success-color, var(--lcards-green-medium, #33cc99))',
            '{{TRACK_BG}}': this._sliderStyle?.track?.background || 'rgba(0,0,0,0.3)',
            '{{TEXT_COLOR}}': this._sliderStyle?.text?.value?.color || 'var(--lcars-white, var(--lcards-moonlight, #ffffff))'
        };

        // Replace placeholder attributes in parsed SVG
        const allElements = this._componentSvg.querySelectorAll('*');
        allElements.forEach(el => {
            Array.from(el.attributes).forEach(attr => {
                let value = attr.value;
                for (const [placeholder, color] of Object.entries(colorMap)) {
                    if (value.includes(placeholder)) {
                        value = value.replace(placeholder, this._resolveCssVariable(color));
                    }
                }
                attr.value = value;
            });
        });
    }

    /**
     * Resolve CSS variable to actual color value
     * @private
     */
    _resolveCssVariable(value) {
        if (!value || typeof value !== 'string') return value;

        // Check if it's a CSS variable
        if (value.startsWith('var(')) {
            const match = value.match(/var\(([^,)]+)(?:,\s*([^)]+))?\)/);
            if (match) {
                const varName = match[1].trim();
                const fallback = match[2]?.trim();

                // Try to get computed value
                const computedValue = getComputedStyle(document.documentElement)
                    .getPropertyValue(varName).trim();

                return computedValue || fallback || value;
            }
        }

        return value;
    }

    /**
     * Resolve state-based border color
     * Supports: border.color[state], border.color.default, border.color (plain string), theme fallback
     * @param {Object|string} colorConfig - Color configuration (state object or string)
     * @returns {string} Resolved color
     * @private
     */
    _resolveStateBorderColor(colorConfig) {
        // If no color configured, get default from theme tokens
        if (!colorConfig) {
            const themeManager = this._singletons?.themeManager;
            if (themeManager) {
                const themeColor = themeManager.getToken('components.slider.border.color');
                if (themeColor) {
                    // If theme token is a state object, resolve based on current state
                    if (typeof themeColor === 'object' && !Array.isArray(themeColor)) {
                        const sliderState = this._getButtonState();
                        const tokenValue = themeColor[sliderState] || themeColor.default || themeColor;
                        // Resolve any nested theme tokens (e.g., 'colors.card.button' -> actual value)
                        const resolved = themeManager.resolver?.resolve(tokenValue, tokenValue) || tokenValue;
                        lcardsLog.debug(`[LCARdSSlider] Using theme border color for state '${sliderState}':`, resolved);
                        return resolved;
                    }
                    // Plain string theme token - resolve any nested tokens
                    const resolved = themeManager.resolver?.resolve(themeColor, themeColor) || themeColor;
                    lcardsLog.debug(`[LCARdSSlider] Using theme border color:`, resolved);
                    return resolved;
                }
            }
            lcardsLog.debug(`[LCARdSSlider] No color config or theme token, using fallback`);
            return 'var(--lcars-color-secondary, #000000)'; // Ultimate fallback
        }

        // If it's a plain string, return it directly
        if (typeof colorConfig === 'string') {
            lcardsLog.debug(`[LCARdSSlider] Border color is plain string:`, colorConfig);
            return colorConfig;
        }

        // State-based color resolution (matches button pattern)
        const sliderState = this._getButtonState(); // Inherited from LCARdSButton
        lcardsLog.debug(`[LCARdSSlider] Resolving border color for state '${sliderState}':`, colorConfig);

        const resolvedColor = colorConfig[sliderState] ||
                             colorConfig.default ||
                             colorConfig ||
                             'var(--lcars-color-secondary, #000000)';

        lcardsLog.debug(`[LCARdSSlider] Resolved border color:`, resolvedColor);
        return resolvedColor;
    }

    /**
     * Inject SVG border elements from config
     * Generates rect elements for left/top/right/bottom borders
     * @private
     */
    _injectBorders() {
        if (!this._componentSvg) return;

        const borderConfig = this._sliderStyle?.border;
        if (!borderConfig) return;

        const width = this._containerSize.width || 300;
        const height = this._containerSize.height || 60;

        // Find or create border-zone group
        let borderZone = this._componentSvg.querySelector('#border-zone');
        if (!borderZone) {
            borderZone = document.createElementNS('http://www.w3.org/2000/svg', 'g');
            borderZone.setAttribute('id', 'border-zone');
            borderZone.setAttribute('data-zone', 'border');
            // Insert before track-zone so borders render behind content
            const trackZone = this._componentSvg.querySelector('#track-zone');
            if (trackZone) {
                this._componentSvg.insertBefore(borderZone, trackZone);
            } else {
                this._componentSvg.appendChild(borderZone);
            }
        }

        // Clear existing borders
        borderZone.innerHTML = '';

        // Helper to get border size (prefer .size, fall back to .width for legacy configs)
        const getBorderSize = (borderDef) => borderDef?.size ?? borderDef?.width ?? 0;

        // Left border
        const leftSize = getBorderSize(borderConfig.left);
        if (borderConfig.left?.enabled && leftSize > 0) {
            const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
            rect.setAttribute('id', 'border-left');
            rect.setAttribute('x', '0');
            rect.setAttribute('y', '0');
            rect.setAttribute('width', leftSize);
            rect.setAttribute('height', height);
            const leftColor = this._resolveStateBorderColor(borderConfig.left.color);
            rect.setAttribute('fill', this._resolveCssVariable(leftColor));
            borderZone.appendChild(rect);
        }

        // Top border
        const topSize = getBorderSize(borderConfig.top);
        if (borderConfig.top?.enabled && topSize > 0) {
            const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
            rect.setAttribute('id', 'border-top');
            rect.setAttribute('x', '0');
            rect.setAttribute('y', '0');
            rect.setAttribute('width', width);
            rect.setAttribute('height', topSize);
            const topColor = this._resolveStateBorderColor(borderConfig.top.color);
            rect.setAttribute('fill', this._resolveCssVariable(topColor));
            borderZone.appendChild(rect);
        }

        // Right border
        const rightSize = getBorderSize(borderConfig.right);
        if (borderConfig.right?.enabled && rightSize > 0) {
            const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
            rect.setAttribute('id', 'border-right');
            rect.setAttribute('x', width - rightSize);
            rect.setAttribute('y', '0');
            rect.setAttribute('width', rightSize);
            rect.setAttribute('height', height);
            const rightColor = this._resolveStateBorderColor(borderConfig.right.color);
            rect.setAttribute('fill', this._resolveCssVariable(rightColor));
            borderZone.appendChild(rect);
        }

        // Bottom border
        const bottomSize = getBorderSize(borderConfig.bottom);
        if (borderConfig.bottom?.enabled && bottomSize > 0) {
            const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
            rect.setAttribute('id', 'border-bottom');
            rect.setAttribute('x', '0');
            rect.setAttribute('y', height - bottomSize);
            rect.setAttribute('width', width);
            rect.setAttribute('height', bottomSize);
            const bottomColor = this._resolveStateBorderColor(borderConfig.bottom.color);
            rect.setAttribute('fill', this._resolveCssVariable(bottomColor));
            borderZone.appendChild(rect);
        }

        lcardsLog.debug(`[LCARdSSlider] Injected borders:`, {
            left: leftSize,
            top: topSize,
            right: rightSize,
            bottom: bottomSize
        });
    }

    /**
     * Inject range backgrounds with optional inset borders (Picard mode)
     * Creates outer border rects (black) and inner colored rects for each range.
     * Ranges are positioned based on display min/max and stack bottom-to-top in vertical mode.
     * 
     * Requires:
     * - Component with 'range' zone defined
     * - style.ranges array configured
     * - Component metadata with insetBorder config (optional, defaults to 4px border, 5px gap)
     * 
     * @private
     * @example
     * // Picard component with inset ranges
     * style: {
     *   ranges: [
     *     { min: 0, max: 20, color: 'gray', label: 'Low' },
     *     { min: 20, max: 80, color: 'blue', label: 'Normal' }
     *   ],
     *   gauge: {
     *     range: {
     *       inset: {
     *         border: { color: 'black', size: 4 },
     *         gap: 5
     *       }
     *     }
     *   }
     * }
     */
    _injectRanges() {
        if (!this._componentSvg) return;

        const ranges = this._sliderStyle?.ranges || [];
        if (ranges.length === 0) return;

        const rangeZone = this._zones.get('range');
        if (!rangeZone) return; // Only Picard and similar components have range zone

        rangeZone.element.innerHTML = '';

        const { width, height } = rangeZone.bounds;
        const orientation = this._sliderStyle?.track?.orientation || 'horizontal';
        const isVertical = orientation === 'vertical';

        // Get inset config from component metadata or style
        const componentMetadata = this._componentMetadata;
        const insetConfig = this._sliderStyle?.gauge?.range?.inset || 
                           componentMetadata?.insetBorder || {};
        const borderSize = insetConfig?.border?.size || insetConfig?.size || 4;
        const borderColor = insetConfig?.border?.color || insetConfig?.color || 'black';
        const gap = insetConfig?.gap || 5;

        const displayMin = this._displayConfig.min;
        const displayMax = this._displayConfig.max;
        const displayRange = displayMax - displayMin;

        const svgNS = 'http://www.w3.org/2000/svg';

        lcardsLog.debug(`[LCARdSSlider] Injecting ${ranges.length} inset ranges`, {
            width,
            height,
            borderSize,
            gap,
            orientation
        });

        ranges.forEach((range, idx) => {
            const startPercent = (range.min - displayMin) / displayRange;
            const endPercent = (range.max - displayMin) / displayRange;

            if (isVertical) {
                // Vertical: ranges stack from bottom to top
                // Y position is inverted (0% = bottom/max, 100% = top/min)
                const yStart = height * (1 - endPercent);
                const yEnd = height * (1 - startPercent);
                const rangeHeight = yEnd - yStart;

                // Outer rect (black border)
                const outerRect = document.createElementNS(svgNS, 'rect');
                outerRect.setAttribute('x', '0');
                outerRect.setAttribute('y', yStart);
                outerRect.setAttribute('width', width);
                outerRect.setAttribute('height', rangeHeight);
                outerRect.setAttribute('fill', borderColor);
                outerRect.setAttribute('data-range-index', idx);
                outerRect.setAttribute('data-range-label', range.label || '');
                rangeZone.element.appendChild(outerRect);

                // Inner rect (range color, inset by gap)
                const innerRect = document.createElementNS(svgNS, 'rect');
                innerRect.setAttribute('x', gap);
                innerRect.setAttribute('y', yStart + gap);
                innerRect.setAttribute('width', width - 2 * gap);
                innerRect.setAttribute('height', Math.max(0, rangeHeight - 2 * gap));
                innerRect.setAttribute('fill', this._resolveCssVariable(range.color));
                innerRect.setAttribute('data-range-index', idx);
                rangeZone.element.appendChild(innerRect);

                lcardsLog.trace(`[LCARdSSlider] Range ${idx} (${range.min}-${range.max}):`, {
                    yStart,
                    yEnd,
                    rangeHeight,
                    innerHeight: rangeHeight - 2 * gap
                });
            } else {
                // Horizontal: ranges extend from left to right
                const xStart = width * startPercent;
                const xEnd = width * endPercent;
                const rangeWidth = xEnd - xStart;

                // Outer rect (black border)
                const outerRect = document.createElementNS(svgNS, 'rect');
                outerRect.setAttribute('x', xStart);
                outerRect.setAttribute('y', '0');
                outerRect.setAttribute('width', rangeWidth);
                outerRect.setAttribute('height', height);
                outerRect.setAttribute('fill', borderColor);
                outerRect.setAttribute('data-range-index', idx);
                outerRect.setAttribute('data-range-label', range.label || '');
                rangeZone.element.appendChild(outerRect);

                // Inner rect (range color, inset by gap)
                const innerRect = document.createElementNS(svgNS, 'rect');
                innerRect.setAttribute('x', xStart + gap);
                innerRect.setAttribute('y', gap);
                innerRect.setAttribute('width', Math.max(0, rangeWidth - 2 * gap));
                innerRect.setAttribute('height', height - 2 * gap);
                innerRect.setAttribute('fill', this._resolveCssVariable(range.color));
                innerRect.setAttribute('data-range-index', idx);
                rangeZone.element.appendChild(innerRect);
            }
        });

        lcardsLog.debug(`[LCARdSSlider] Injected ${ranges.length} inset ranges`);
    }

    /**
     * Override button's text area calculation to support slider-specific areas
     * Provides text positioning in border caps (left/top/right/bottom) and track area
     * Includes adjacent borders when they form a continuous visual border
     * @param {number} sliderWidth - Slider width
     * @param {number} sliderHeight - Slider height
     * @param {Object} iconConfig - Icon configuration (unused for slider)
     * @returns {Object} Text area bounds {left, top, width, height}
     * @override
     */
    _calculateTextAreaBounds(sliderWidth, sliderHeight, iconConfig) {
        // Get border configuration
        const borderConfig = this._sliderStyle?.border;

        // Calculate border offsets
        // Helper to get border size (prefer .size, fall back to .width for legacy configs)
        const getBorderSize = (borderDef) => borderDef?.size ?? borderDef?.width ?? 0;

        const borderOffsets = {
            left: borderConfig?.left?.enabled ? getBorderSize(borderConfig.left) : 0,
            top: borderConfig?.top?.enabled ? getBorderSize(borderConfig.top) : 0,
            right: borderConfig?.right?.enabled ? getBorderSize(borderConfig.right) : 0,
            bottom: borderConfig?.bottom?.enabled ? getBorderSize(borderConfig.bottom) : 0
        };

        // Determine text area from config (default: 'auto' uses largest border)
        const textArea = this.config?.text?.area || 'auto';

        // Auto-select: use left border if available, else top, else track
        if (textArea === 'auto') {
            if (borderOffsets.left > 0) {
                // Left border cap - INCLUDE adjacent top/bottom borders for continuous visual area
                return {
                    left: 0,
                    top: 0,  // Include top border if present
                    width: borderOffsets.left,
                    height: sliderHeight  // Full height including top and bottom borders
                };
            } else if (borderOffsets.top > 0) {
                // Top border cap - INCLUDE adjacent left/right borders
                return {
                    left: 0,  // Include left border if present
                    top: 0,
                    width: sliderWidth,  // Full width including left and right borders
                    height: borderOffsets.top
                };
            } else {
                // No borders: use full track area
                const margins = this._sliderStyle?.margins || { top: 0, right: 0, bottom: 0, left: 0 };
                return {
                    left: borderOffsets.left + margins.left,
                    top: borderOffsets.top + margins.top,
                    width: sliderWidth - borderOffsets.left - borderOffsets.right - margins.left - margins.right,
                    height: sliderHeight - borderOffsets.top - borderOffsets.bottom - margins.top - margins.bottom
                };
            }
        }

        // Explicit area selection - INCLUDE adjacent borders for continuous visual area
        if (textArea === 'left' && borderOffsets.left > 0) {
            return {
                left: 0,
                top: 0,  // Include top border
                width: borderOffsets.left,
                height: sliderHeight  // Include bottom border
            };
        } else if (textArea === 'top' && borderOffsets.top > 0) {
            return {
                left: 0,  // Include left border
                top: 0,
                width: sliderWidth,  // Include right border
                height: borderOffsets.top
            };
        } else if (textArea === 'right' && borderOffsets.right > 0) {
            return {
                left: sliderWidth - borderOffsets.right,
                top: 0,  // Include top border
                width: borderOffsets.right,
                height: sliderHeight  // Include bottom border
            };
        } else if (textArea === 'bottom' && borderOffsets.bottom > 0) {
            return {
                left: 0,  // Include left border
                top: sliderHeight - borderOffsets.bottom,
                width: sliderWidth,  // Include right border
                height: borderOffsets.bottom
            };
        } else if (textArea === 'track') {
            // Track area (inset by borders and margins)
            const margins = this._sliderStyle?.margins || { top: 0, right: 0, bottom: 0, left: 0 };
            return {
                left: borderOffsets.left + margins.left,
                top: borderOffsets.top + margins.top,
                width: sliderWidth - borderOffsets.left - borderOffsets.right - margins.left - margins.right,
                height: sliderHeight - borderOffsets.top - borderOffsets.bottom - margins.top - margins.bottom
            };
        }

        // Fallback: full slider area
        return {
            left: 0,
            top: 0,
            width: sliderWidth,
            height: sliderHeight
        };
    }

    /**
     * Inject text fields using button's text processing system
     * Creates SVG text elements in the configured text area
     * @param {number} width - Slider width
     * @param {number} height - Slider height
     * @private
     */
    _injectTextFields(width, height) {
        if (!this._componentSvg) return;

        // Use button's _resolveTextConfiguration() to get processed templates
        // This reads from this.config.text which has been modified by _processCustomTemplates
        const textFields = this._resolveTextConfiguration();
        if (!textFields || Object.keys(textFields).length === 0) return;

        // Get text area from config (slider-specific property)
        const textArea = this.config.text?.area || 'auto';

        // Find or create text-zone group
        let textZone = this._componentSvg.querySelector('#text-zone');
        if (!textZone) {
            textZone = document.createElementNS('http://www.w3.org/2000/svg', 'g');
            textZone.setAttribute('id', 'text-zone');
            textZone.setAttribute('data-zone', 'text');
            // Insert before track-zone so text renders above borders but below track
            const trackZone = this._componentSvg.querySelector('#track-zone');
            if (trackZone) {
                this._componentSvg.insertBefore(textZone, trackZone);
            } else {
                this._componentSvg.appendChild(textZone);
            }
        }

        // Clear existing text
        textZone.innerHTML = '';

        // Process text fields using button's system
        const processedFields = this._processTextFields(textFields, width, height, null);

        // Generate SVG text elements (using button's method)
        const textMarkup = this._generateTextElements(processedFields);

        lcardsLog.debug(`[LCARdSSlider] Generated text markup:`, textMarkup);

        // Parse markup and append to text zone
        const parser = new DOMParser();
        const doc = parser.parseFromString(`<g>${textMarkup}</g>`, 'image/svg+xml');
        const textElements = doc.documentElement.children;

        // Append all text elements to text zone
        Array.from(textElements).forEach(element => {
            textZone.appendChild(element.cloneNode(true));
        });

        lcardsLog.debug(`[LCARdSSlider] Injected ${processedFields.length} text fields into text-zone`);
    }

    /**
     * Extract zone elements and bounds from component SVG
     * @private
     */
    _extractZones() {
        if (!this._componentSvg) {
            this._zones.clear();
            return;
        }

        this._zones.clear();

        const zoneElements = this._componentSvg.querySelectorAll('[data-zone]');

        zoneElements.forEach(el => {
            const zoneName = el.getAttribute('data-zone');
            const boundsStr = el.getAttribute('data-bounds');

            if (!boundsStr) {
                lcardsLog.warn(`[LCARdSSlider] Zone "${zoneName}" missing data-bounds attribute`);
                // Use sensible defaults for zones without explicit bounds
                // Note: getBBox() is unreliable before SVG is rendered, so we use defaults
                const defaultBounds = { x: 0, y: 0, width: 100, height: 20 };
                this._zones.set(zoneName, {
                    element: el,
                    bounds: defaultBounds
                });
                return;
            }

            // Parse bounds: "x,y,width,height"
            const [x, y, width, height] = boundsStr.split(',').map(v => parseFloat(v.trim()));

            this._zones.set(zoneName, {
                element: el,
                bounds: { x, y, width, height }
            });

            lcardsLog.trace(`[LCARdSSlider] Zone "${zoneName}" bounds:`, { x, y, width, height });
        });
    }

    /**
     * Generate track content (pills or gradient bar)
     * Memoized - only regenerates if config changes
     * @private
     */
    _generateTrackContent() {
        const trackConfig = this._sliderStyle?.track?.segments;
        const orientation = this._sliderStyle?.track?.orientation || 'horizontal';

        // Get track zone bounds
        const trackZone = this._zones.get('track');
        const width = trackZone?.bounds?.width || this._containerSize.width - 20;
        const height = trackZone?.bounds?.height || 20;

        // Generate config hash for cache invalidation
        // Using concatenated string for efficiency instead of JSON.stringify
        const configHash = `${trackConfig?.count || 10}|${trackConfig?.gap || 4}|${trackConfig?.shape?.radius ?? 4}|` +
            `${trackConfig?.size?.height || 12}|${trackConfig?.gradient?.start || ''}|${trackConfig?.gradient?.end || ''}|` +
            `${trackConfig?.gradient?.interpolated || false}|${orientation}|${width}|${height}|` +
            `${JSON.stringify(this._sliderStyle?.ranges || [])}`; // NEW: Include ranges

        // Check memoization cache
        if (this._memoizedTrack && this._memoizedTrackConfig === configHash) {
            lcardsLog.trace(`[LCARdSSlider] Using memoized track content`);
            return this._memoizedTrack;
        }

        lcardsLog.debug(`[LCARdSSlider] Generating track content (cache miss)`);

        // Generate pills with track zone dimensions (relative to track zone origin)
        // The track zone itself is positioned via transform, so pills use relative coords
        const trackBounds = { x: 0, y: 0, width: trackZone?.bounds?.width || width, height: trackZone?.bounds?.height || height };
        const content = this._generatePillsSVG(trackBounds, trackConfig, orientation);

        // Cache result
        this._memoizedTrack = content;
        this._memoizedTrackConfig = configHash;

        return content;
    }

    /**
     * Generate pill SVG elements
     * @private
     */
    _generatePillsSVG(trackBounds, trackConfig, orientation = 'horizontal') {
        const gap = parseInt(trackConfig?.gap) || 4;
        const radius = trackConfig?.shape?.radius ?? 4;
        const interpolated = trackConfig?.gradient?.interpolated ?? false;
        const gradientStart = this._resolveCssVariable(trackConfig?.gradient?.start || 'var(--error-color, var(--lcards-orange-dark, #cc2200))');
        const gradientEnd = this._resolveCssVariable(trackConfig?.gradient?.end || 'var(--success-color, var(--lcards-green-medium, #33cc99))');
        const unfilledOpacity = trackConfig?.appearance?.unfilled?.opacity ?? 0.2;

        const trackWidth = trackBounds.width;
        const trackHeight = trackBounds.height;
        const trackX = trackBounds.x || 0; // X offset of track zone within viewBox
        const trackY = trackBounds.y || 0; // Y offset of track zone within viewBox

        const isVertical = orientation === 'vertical';

        // ====================================================================
        // NEW: Get ranges configuration (optional for pills)
        // ====================================================================
        const ranges = this._sliderStyle?.ranges || [];
        const displayMin = this._displayConfig.min;
        const displayMax = this._displayConfig.max;
        const displayRange = displayMax - displayMin;

        /**
         * Get color for a specific pill index based on ranges
         * If ranges are defined and pill value falls within a range, use range color.
         * Otherwise, use default gradient interpolation.
         * @param {number} pillIndex - Index of the pill (0-based)
         * @param {number} pillCount - Total number of pills
         * @returns {string} Color value (hex, rgb, or CSS variable)
         * @private
         */
        const getPillColor = (pillIndex, pillCount) => {
            // Calculate the value this pill represents (in display space)
            const valuePercent = pillIndex / (pillCount - 1 || 1);
            const pillValue = displayMin + (valuePercent * displayRange);

            // Check if this value falls within any defined range
            if (ranges.length > 0) {
                // FIX: Use inclusive upper boundary (<=) to match standard range notation
                // This ensures pills at exact boundaries (e.g., 66.6, 77.7, 88.8 in 66-100 range) are matched
                const matchingRange = ranges.find(r => pillValue >= r.min && pillValue <= r.max);
                if (matchingRange) {
                    return this._resolveCssVariable(matchingRange.color);
                }
            }

            // Fallback: use global gradient (existing behavior)
            // Note: ColorUtils.mix(c1, c2, t) returns c2 at t=0, c1 at t=1
            // So we swap params: mix(end, start, t) to get start→end
            const t = pillIndex / (pillCount - 1 || 1);
            return ColorUtils.mix(gradientEnd, gradientStart, t);
        };

        // Calculate count and dimensions based on orientation
        let count, pillWidth, pillHeight;

        if (isVertical) {
            // Vertical: pill width fills track width (expands with container)
            pillWidth = trackWidth;

            // Pill height is FIXED - doesn't change with container size
            const fixedPillHeight = parseInt(trackConfig?.size?.height) || 12;

            // Auto-calculate count to fill available height with fixed-size pills
            const configCount = trackConfig?.count;

            lcardsLog.debug(`[LCARdSSlider] Vertical config inspection:`, {
                trackConfig,
                configCount,
                configCountType: typeof configCount,
                isUndefined: configCount === undefined,
                isNull: configCount === null,
                isAuto: configCount === 'auto'
            });

            if (configCount === 'auto' || configCount === undefined || configCount === null) {
                // Calculate how many fixed-size pills fit in the track height
                count = Math.floor((trackHeight + gap) / (fixedPillHeight + gap));
                pillHeight = fixedPillHeight; // Use the fixed height

                lcardsLog.debug(`[LCARdSSlider] Vertical auto-count calculation:`, {
                    trackHeight,
                    fixedPillHeight,
                    gap,
                    calculatedCount: count
                });
            } else {
                // User explicitly specified count - calculate pill height to fit
                count = parseInt(configCount);
                pillHeight = (trackHeight - (gap * (count - 1))) / count;

                lcardsLog.debug(`[LCARdSSlider] Vertical fixed count:`, {
                    count,
                    trackHeight,
                    recalculatedPillHeight: pillHeight
                });
            }
        } else {
            // Horizontal: pill height fills track height (expands with container)
            pillHeight = trackHeight;

            // Pill width is FIXED - doesn't change with container size
            const fixedPillWidth = parseInt(trackConfig?.size?.width) || 12;

            // Auto-calculate count to fill available width with fixed-size pills
            const configCount = trackConfig?.count;
            if (configCount === 'auto' || configCount === undefined || configCount === null) {
                // Calculate how many fixed-size pills fit in the track width
                count = Math.floor((trackWidth + gap) / (fixedPillWidth + gap));
                // Use the FIXED width (don't recalculate to fill space)
                pillWidth = fixedPillWidth;

                lcardsLog.debug(`[LCARdSSlider] Horizontal auto-count calculation:`, {
                    trackWidth,
                    fixedPillWidth,
                    gap,
                    calculatedCount: count,
                    pillWidth: pillWidth
                });
            } else {
                count = parseInt(configCount) || 10;
                // If user specifies count, recalculate pill width to fill space
                pillWidth = (trackWidth - (gap * (count - 1))) / count;

                lcardsLog.debug(`[LCARdSSlider] Horizontal fixed count:`, {
                    count,
                    trackWidth,
                    recalculatedPillWidth: pillWidth
                });
            }
        }

        // Calculate pill dimensions
        let pills = '';
        let defs = '<defs>';

        if (isVertical) {
            // Vertical: pills stack from bottom to top
            // Generate per-pill colors (interpolated across the range)
            defs += '</defs>';

            // Generate pills from bottom to top
            for (let i = 0; i < count; i++) {
                const y = trackY + trackHeight - ((i + 1) * pillHeight) - (i * gap);
                const x = trackX; // Fill entire track width

                // NEW: Use range color if defined, else gradient
                const color = getPillColor(i, count);

                pills += `
                    <rect
                        id="pill-${i}"
                        class="pill"
                        x="${x}"
                        y="${y}"
                        width="${pillWidth}"
                        height="${pillHeight}"
                        rx="${radius}"
                        ry="${radius}"
                        fill="${color}"
                        opacity="${unfilledOpacity}"
                        data-pill-index="${i}" />
                `;
            }
        } else {
            // Horizontal: pills stretch from left to right
            const availableWidth = trackWidth - (gap * (count - 1));
            pillWidth = availableWidth / count;

            // Generate per-pill colors (interpolated across the range)
            defs += '</defs>';

            // Generate pills from left to right
            for (let i = 0; i < count; i++) {
                const x = trackX + (i * (pillWidth + gap));
                // Pills fill the entire track height
                const y = trackY;

                // NEW: Use range color if defined, else gradient
                const color = getPillColor(i, count);

                pills += `
                    <rect
                        id="pill-${i}"
                        class="pill"
                        x="${x}"
                        y="${y}"
                        width="${pillWidth}"
                        height="${pillHeight}"
                        rx="${radius}"
                        ry="${radius}"
                        fill="${color}"
                        opacity="${unfilledOpacity}"
                        data-pill-index="${i}" />
                `;
            }
        }

        return defs + pills;
    }

    /**
     * Generate gauge SVG elements (ruler style with progress bar)
     * Design: Transparent ruler with ticks/labels and a thin progress bar
     * @private
     */
    _generateGaugeSVG(trackWidth, trackHeight) {
        const gaugeConfig = this._sliderStyle?.gauge;
        const orientation = this._sliderStyle?.track?.orientation || 'horizontal';
        const isVertical = orientation === 'vertical';

        // Config hash for memoization
        const configHash = JSON.stringify({
            gaugeConfig,
            width: trackWidth,
            height: trackHeight,
            orientation,
            value: this._sliderValue,
            ranges: this._sliderStyle?.ranges || []  // NEW: Include ranges
        });

        if (this._memoizedGauge && this._memoizedGaugeConfig === configHash) {
            return this._memoizedGauge;
        }

        let svg = '';

        // Get scale configuration - use DISPLAY range for visual scale
        const min = this._displayConfig.min;
        const max = this._displayConfig.max;
        const range = max - min;
        const tickConfig = gaugeConfig?.scale?.tick_marks;
        const labelConfig = gaugeConfig?.scale?.labels;

        // ====================================================================
        // NEW: Inject range backgrounds FIRST (behind ticks/labels)
        // ====================================================================
        const ranges = this._sliderStyle?.ranges || [];
        if (ranges.length > 0) {
            lcardsLog.debug(`[LCARdSSlider] Rendering ${ranges.length} range backgrounds`);

            ranges.forEach((rangeConfig, idx) => {
                const rangeMin = rangeConfig.min;
                const rangeMax = rangeConfig.max;
                const rangeColor = this._resolveCssVariable(rangeConfig.color);
                const rangeOpacity = rangeConfig.opacity ?? 0.3;

                // Calculate range position as percentage of display range
                const startPercent = (rangeMin - min) / range;
                const endPercent = (rangeMax - min) / range;

                if (isVertical) {
                    // Vertical: ranges stack from bottom to top
                    // Y position is inverted (0% = bottom/max, 100% = top/min)
                    const yStart = trackHeight * (1 - endPercent);
                    const yEnd = trackHeight * (1 - startPercent);
                    const rangeHeight = yEnd - yStart;

                    svg += `
                        <rect class="range-bg"
                              x="0" y="${yStart}"
                              width="${trackWidth}" height="${rangeHeight}"
                              fill="${rangeColor}"
                              opacity="${rangeOpacity}"
                              data-range-index="${idx}"
                              data-range-label="${rangeConfig.label || ''}" />
                    `;
                } else {
                    // Horizontal: ranges extend from left to right
                    const xStart = trackWidth * startPercent;
                    const xEnd = trackWidth * endPercent;
                    const rangeWidth = xEnd - xStart;

                    svg += `
                        <rect class="range-bg"
                              x="${xStart}" y="0"
                              width="${rangeWidth}" height="${trackHeight}"
                              fill="${rangeColor}"
                              opacity="${rangeOpacity}"
                              data-range-index="${idx}"
                              data-range-label="${rangeConfig.label || ''}" />
                    `;
                }
            });
        }

        // ====================================================================
        // NEW: Render labels for ranges (after background rects)
        // ====================================================================
        if (ranges.length > 0) {
            const labelColor = this._resolveCssVariable(
                gaugeConfig?.scale?.labels?.color ||
                'var(--primary-text-color, #ffffff)'
            );
            const labelFontSize = gaugeConfig?.scale?.labels?.font_size || 12;

            ranges.forEach((rangeConfig, idx) => {
                if (!rangeConfig.label) return; // Skip if no label configured

                const rangeMin = rangeConfig.min;
                const rangeMax = rangeConfig.max;
                const rangeMidValue = (rangeMin + rangeMax) / 2;
                const midPercent = (rangeMidValue - min) / range;

                if (isVertical) {
                    // Vertical: label at midpoint Y, right-aligned
                    const yPos = trackHeight * (1 - midPercent);
                    const xPos = trackWidth - 5; // 5px from right edge

                    svg += `
                        <text class="range-label"
                              x="${xPos}" y="${yPos}"
                              font-size="${labelFontSize}px"
                              font-weight="400"
                              font-family="Antonio"
                              fill="${labelColor}"
                              text-anchor="end"
                              dy="0.35em">${rangeConfig.label}</text>
                    `;
                } else {
                    // Horizontal: label at midpoint X, centered
                    const xPos = trackWidth * midPercent;
                    const yPos = 15; // 15px from top

                    svg += `
                        <text class="range-label"
                              x="${xPos}" y="${yPos}"
                              font-size="${labelFontSize}px"
                              font-weight="400"
                              font-family="Antonio"
                              fill="${labelColor}"
                              text-anchor="middle">${rangeConfig.label}</text>
                    `;
                }
            });
        }

        // ====================================================================
        // Continue with existing major ticks rendering...
        // ====================================================================

        // Major tick configuration
        const majorEnabled = tickConfig?.major?.enabled !== false;
        const majorInterval = tickConfig?.major?.interval || 10; // Value units (not percentage)
        const majorColor = this._resolveCssVariable(tickConfig?.major?.color || 'var(--lcars-card-button, #ff9966)');
        const majorHeight = tickConfig?.major?.height; // undefined = full height
        const majorStrokeWidth = tickConfig?.major?.width || 2;

        // Minor tick configuration
        const minorEnabled = tickConfig?.minor?.enabled !== false;
        const minorInterval = tickConfig?.minor?.interval || 2; // Value units (not percentage)
        const minorColor = this._resolveCssVariable(tickConfig?.minor?.color || 'var(--lcars-card-button, #ff9966)');
        const minorHeight = tickConfig?.minor?.height || 10;
        const minorStrokeWidth = tickConfig?.minor?.width || 1;

        // Label configuration
        const labelsEnabled = labelConfig?.enabled !== false;
        const labelUnit = this._displayConfig.unit || labelConfig?.unit || '';
        const labelPadding = labelConfig?.padding || 3; // Padding between tick and label

        // Progress bar configuration
        const progressConfig = gaugeConfig?.progress_bar;
        const progressColor = this._resolveCssVariable(progressConfig?.color || 'var(--lcards-blue-light, #aaccff)');
        const progressHeight = progressConfig?.height || 12;
        const progressRadius = progressConfig?.radius !== undefined ? progressConfig?.radius : 2;

        // Calculate progress bar position (at bottom of minor ticks)
        const progressY = minorHeight;

        // Calculate label positioning
        // Labels need space at the bottom - use height minus label space
        const labelFontSize = 14; // px
        const labelBottomMargin = 5; // px breathing room
        const labelY = trackHeight - labelBottomMargin; // Position labels near bottom with margin (horizontal)
        const labelX = trackWidth - labelBottomMargin; // Position labels near right edge with margin (vertical)

        // Calculate current value percentage
        const valuePercent = this._calculateValuePercent();

        if (!isVertical) {
            // === HORIZONTAL GAUGE ===

            // Draw major ticks (full height or custom height) and labels
            if (majorEnabled) {
                // Calculate number of major ticks based on value range and interval
                const tickCount = Math.floor(range / majorInterval) + 1;

                for (let i = 0; i < tickCount; i++) {
                    const scaleValue = min + (i * majorInterval);
                    if (scaleValue > max) break;

                    // Calculate x position as percentage of track width
                    const percent = ((scaleValue - min) / range) * 100;
                    let x = (percent / 100) * trackWidth;

                    // Skip first tick (adjacent to left border when present)
                    const edgeClearance = 5; // pixels
                    const isFirstTick = x < edgeClearance;

                    if (!isFirstTick) {
                        // If tick is at the very edge (no border), inset by half stroke width
                        // so the full stroke is visible instead of being cut off
                        const isAtRightEdge = Math.abs(x - trackWidth) < 0.5; // floating point tolerance
                        if (isAtRightEdge) {
                            x = trackWidth - (majorStrokeWidth / 2);
                        }

                        // Major tick - full height or custom height
                        const tickY2 = majorHeight !== undefined ? majorHeight : '100%';
                        svg += `
                    <line x1="${x}" y1="0" x2="${x}" y2="${tickY2}"
                          stroke="${majorColor}" stroke-width="${majorStrokeWidth}" />
                `;
                    }

                    // Label - positioned near bottom with proper spacing
                    if (labelsEnabled && !isFirstTick) {
                        // Estimate label width (rough approximation: ~8px per digit + unit)
                        const labelText = Math.round(scaleValue) + labelUnit;
                        const estimatedLabelWidth = labelText.length * 8;

                        // Check if label would extend beyond track bounds
                        // For text-anchor="end", text extends LEFT of x position
                        const labelLeftEdge = x - estimatedLabelWidth - labelPadding;

                        // Ensure label doesn't extend past left edge
                        const shouldRenderLabel = labelLeftEdge >= edgeClearance;

                        if (shouldRenderLabel) {
                            svg += `
                        <text x="${x}" y="${labelY}"
                              font-size="${labelFontSize}px" font-weight="400" font-family="Antonio"
                              fill="${majorColor}"
                              text-anchor="end"
                              dx="${-labelPadding}" dy="0">${labelText}</text>
                    `;
                        }
                    }
                }
            }

            // Draw minor ticks (shorter, between majors)
            if (minorEnabled) {
                const minorTickCount = Math.floor(range / minorInterval) + 1;

                for (let i = 0; i < minorTickCount; i++) {
                    const scaleValue = min + (i * minorInterval);
                    if (scaleValue > max) break;

                    // Skip if this is a major tick position
                    const offsetFromMin = scaleValue - min;
                    if (offsetFromMin % majorInterval === 0) continue;

                    // Calculate x position as percentage of track width
                    const percent = ((scaleValue - min) / range) * 100;
                    const x = (percent / 100) * trackWidth;

                    // Minor tick - from top to minorHeight
                    svg += `
                        <line x1="${x}" y1="0" x2="${x}" y2="${minorHeight}"
                              stroke="${minorColor}" stroke-width="${minorStrokeWidth}" />
                    `;
                }
            }

            // Draw progress bar (at bottom of minor ticks, extends based on value)
            const progressWidth = valuePercent * trackWidth;
            svg += `
                <rect x="0" y="${progressY}"
                      width="${progressWidth}" height="${progressHeight}"
                      fill="${progressColor}"
                      rx="${progressRadius}" ry="${progressRadius}" />
            `;

            // Draw indicator if enabled
            const indicatorConfig = gaugeConfig?.indicator;
            // Enable indicator if explicitly enabled OR if indicator properties are configured
            const indicatorEnabled = indicatorConfig?.enabled === true ||
                                    (indicatorConfig?.enabled !== false &&
                                     (indicatorConfig?.type || indicatorConfig?.color || indicatorConfig?.size));

            if (indicatorEnabled) {
                const indicatorType = indicatorConfig.type || 'line';
                const indicatorColor = this._resolveCssVariable(indicatorConfig.color || 'var(--lcars-white, #ffffff)');
                const indicatorWidth = indicatorConfig.size?.width || 4;
                const indicatorHeight = indicatorConfig.size?.height || 25;
                const borderEnabled = indicatorConfig.border?.enabled !== false;
                const borderColor = this._resolveCssVariable(indicatorConfig.border?.color || 'var(--lcars-black, #000000)');
                const borderWidth = indicatorConfig.border?.width || 1;

                // Calculate indicator position
                const indicatorX = valuePercent * trackWidth;

                if (indicatorType === 'thumb') {
                    // Circular thumb indicator
                    const radius = indicatorWidth / 2;
                    const centerY = trackHeight / 2;

                    svg += `
                        <circle cx="${indicatorX}" cy="${centerY}" r="${radius}"
                                fill="${indicatorColor}"
                                ${borderEnabled ? `stroke="${borderColor}" stroke-width="${borderWidth}"` : ''} />
                    `;
                } else {
                    // Line indicator (default)
                    const lineX = indicatorX - (indicatorWidth / 2); // Center the line
                    const lineY = (trackHeight - indicatorHeight) / 2; // Center vertically

                    svg += `
                        <rect x="${lineX}" y="${lineY}"
                              width="${indicatorWidth}" height="${indicatorHeight}"
                              fill="${indicatorColor}"
                              ${borderEnabled ? `stroke="${borderColor}" stroke-width="${borderWidth}"` : ''}
                              rx="1" ry="1" />
                    `;
                }
            }

        } else {
            // === VERTICAL GAUGE ===
            // Vertical gauges have horizontal tick marks and fill from bottom to top

            // Draw major ticks (horizontal lines) and labels
            if (majorEnabled) {
                const tickCount = Math.floor(range / majorInterval) + 1;

                for (let i = 0; i < tickCount; i++) {
                    const scaleValue = min + (i * majorInterval);
                    if (scaleValue > max) break;

                    // Calculate y position as percentage of track height
                    // INVERTED: 0% = top (max value), 100% = bottom (min value)
                    const percent = 100 - (((scaleValue - min) / range) * 100);
                    let y = (percent / 100) * trackHeight;

                    // Skip bottom tick (adjacent to bottom border when present)
                    const edgeClearance = 5; // pixels
                    const isBottomTick = y > (trackHeight - edgeClearance); // bottom tick (min value)

                    if (!isBottomTick) {
                        // If tick is at the very top edge (no border), inset by half stroke width
                        // so the full stroke is visible instead of being cut off
                        const isAtTopEdge = y < 0.5; // floating point tolerance
                        if (isAtTopEdge) {
                            y = majorStrokeWidth / 2;
                        }

                        // Determine tick width (full width or custom)
                        const tickX2 = majorHeight !== undefined ? majorHeight : '100%';

                        // Draw horizontal tick line
                        svg += `
                    <line x1="0" y1="${y}" x2="${tickX2}" y2="${y}"
                          stroke="${majorColor}" stroke-width="${majorStrokeWidth}" />
                `;
                    }

                    // Draw label if enabled (to the right, below the line)
                    if (labelsEnabled && !isBottomTick) {
                        const labelText = `${scaleValue}${labelUnit}`;
                        const labelColor = this._resolveCssVariable(labelConfig?.color || 'var(--lcars-card-button, #ff9966)');
                        const labelFontSizeVertical = labelConfig?.font_size || labelFontSize;

                        // Estimate label width and check bounds
                        const estimatedLabelWidth = labelText.length * 8;
                        const labelLeftEdge = labelX - estimatedLabelWidth;

                        // Ensure label doesn't extend past left edge
                        // Position labels below tick line for better readability
                        const labelVerticalOffset = labelFontSizeVertical + 2; // Position below tick, not at tick
                        const shouldRenderLabel = labelLeftEdge >= edgeClearance;

                        if (shouldRenderLabel) {
                            svg += `
                        <text x="${labelX}" y="${y}" font-size="${labelFontSizeVertical}px" font-weight="400" font-family="Antonio"
                              fill="${labelColor}" text-anchor="end"
                              dx="0" dy="${labelVerticalOffset}">${labelText}</text>
                    `;
                        }
                    }
                }
            }

            // Draw minor ticks (short horizontal lines from left edge)
            if (minorEnabled) {
                const minorTickCount = Math.floor(range / minorInterval) + 1;

                for (let i = 0; i < minorTickCount; i++) {
                    const scaleValue = min + (i * minorInterval);
                    if (scaleValue > max) break;

                    // Skip if this position has a major tick
                    const offsetFromMin = scaleValue - min;
                    if (offsetFromMin % majorInterval === 0) continue;

                    // Calculate y position (inverted like major ticks)
                    const percent = 100 - (((scaleValue - min) / range) * 100);
                    const y = (percent / 100) * trackHeight;

                    // Minor tick - short horizontal line from left edge
                    svg += `
                        <line x1="0" y1="${y}" x2="${minorHeight}" y2="${y}"
                              stroke="${minorColor}" stroke-width="${minorStrokeWidth}" />
                    `;
                }
            }

            // Draw progress bar (fills from bottom up)
            // Position at left side after minor ticks
            const progressX = minorHeight;
            const progressBarHeight = valuePercent * trackHeight;
            const progressY = trackHeight - progressBarHeight; // Start from bottom

            svg += `
                <rect x="${progressX}" y="${progressY}"
                      width="${progressHeight}" height="${progressBarHeight}"
                      fill="${progressColor}"
                      rx="${progressRadius}" ry="${progressRadius}" />
            `;

            // Draw indicator if enabled
            const indicatorConfig = gaugeConfig?.indicator;
            // Enable indicator if explicitly enabled OR if indicator properties are configured
            const indicatorEnabled = indicatorConfig?.enabled === true ||
                                    (indicatorConfig?.enabled !== false &&
                                     (indicatorConfig?.type || indicatorConfig?.color || indicatorConfig?.size));

            if (indicatorEnabled) {
                const indicatorType = indicatorConfig.type || 'line';
                const indicatorColor = this._resolveCssVariable(indicatorConfig.color || 'var(--lcars-white, #ffffff)');
                const indicatorWidth = indicatorConfig.size?.width || 4;
                const indicatorHeight = indicatorConfig.size?.height || 25;
                const borderEnabled = indicatorConfig.border?.enabled !== false;
                const borderColor = this._resolveCssVariable(indicatorConfig.border?.color || 'var(--lcars-black, #000000)');
                const borderWidth = indicatorConfig.border?.width || 1;

                // Calculate indicator position (inverted Y)
                const indicatorY = trackHeight - (valuePercent * trackHeight);

                if (indicatorType === 'thumb') {
                    // Circular thumb indicator
                    const radius = indicatorWidth / 2;
                    const centerX = trackWidth / 2;

                    svg += `
                        <circle cx="${centerX}" cy="${indicatorY}" r="${radius}"
                                fill="${indicatorColor}"
                                ${borderEnabled ? `stroke="${borderColor}" stroke-width="${borderWidth}"` : ''} />
                    `;
                } else {
                    // Line indicator (horizontal for vertical gauge)
                    // For vertical gauge: width controls line length (horizontal), height controls thickness (vertical)
                    const lineY = indicatorY - (indicatorWidth / 2); // Center the line (width is now thickness)
                    const lineX = (trackWidth - indicatorHeight) / 2; // Center horizontally (height is now length)

                    svg += `
                        <rect x="${lineX}" y="${lineY}"
                              width="${indicatorHeight}" height="${indicatorWidth}"
                              fill="${indicatorColor}"
                              ${borderEnabled ? `stroke="${borderColor}" stroke-width="${borderWidth}"` : ''}
                              rx="1" ry="1" />
                    `;
                }
            }
        }

        // Cache result
        this._memoizedGauge = svg;
        this._memoizedGaugeConfig = configHash;

        return svg;
    }

    /**
     * Calculate value as percentage (0-1) within DISPLAY range
     * Used for visual rendering of pills/gauge position
     * @private
     * @returns {number} Percentage (0-1)
     */
    _calculateValuePercent() {
        // Use DISPLAY range (visual scale), not control range
        const displayMin = this._displayConfig.min;
        const displayMax = this._displayConfig.max;
        const value = this._sliderValue;

        return Math.max(0, Math.min(1, (value - displayMin) / (displayMax - displayMin)));
    }

    /**
     * Inject dynamic content into component zones
     * @private
     */
    _injectContentIntoZones() {
        if (!this._componentSvg) return;

        // NEW: Inject ranges FIRST (background layer, only if range zone exists)
        this._injectRanges();

        // Inject track content based on visual style (on top of ranges)
        const trackZone = this._zones.get('track');
        if (trackZone) {
            const trackContent = this._mode === 'pills'
                ? this._generateTrackContent()  // Pills (segmented bar)
                : this._generateGaugeSVG(trackZone.bounds.width, trackZone.bounds.height);  // Gauge ruler
            trackZone.element.innerHTML = trackContent;
        }
    }

    /**
     * Update dynamic elements without regenerating structure
     * @private
     */
    _updateDynamicElements() {
        if (!this.shadowRoot) return;

        if (this._mode === 'pills') {
            this._updatePillOpacities();
        } else {
            this._updateGaugeIndicator();
        }
    }

    /**
     * Update pill opacities based on current value
     * @private
     */
    _updatePillOpacities() {
        const trackConfig = this._sliderStyle?.track?.segments;
        const filledOpacity = trackConfig?.appearance?.filled?.opacity ?? 1.0;
        const unfilledOpacity = trackConfig?.appearance?.unfilled?.opacity ?? 0.2;

        // Find pills in shadow DOM
        const pills = this.shadowRoot?.querySelectorAll('.pill');
        if (!pills || pills.length === 0) return;

        const fillRatio = this._calculateValuePercent();
        const fillCount = fillRatio * pills.length;

        pills.forEach((pill, index) => {
            let opacity;
            if (index < Math.floor(fillCount)) {
                // Fully filled
                opacity = filledOpacity;
            } else if (index === Math.floor(fillCount) && fillCount % 1 !== 0) {
                // Partially filled (smooth transition)
                opacity = unfilledOpacity + ((fillCount % 1) * (filledOpacity - unfilledOpacity));
            } else {
                // Unfilled
                opacity = unfilledOpacity;
            }
            pill.setAttribute('opacity', opacity);
        });
    }

    /**
     * Update gauge indicator position
     * @private
     */
    _updateGaugeIndicator() {
        // In new gauge design, we need to regenerate the entire gauge
        // because the progress bar width changes (it's not just a position update)
        // The memoization will be invalidated by the value change in config hash
        if (this._mode === 'gauge') {
            // Force regeneration by clearing cache
            this._memoizedGauge = null;
            this._memoizedGaugeConfig = null;

            // Re-inject content into zones
            this._injectContentIntoZones();
        }
    }

    /**
     * Get control zone bounds for input positioning
     * @private
     */
    _getControlZoneBounds() {
        const controlZone = this._zones.get('control');
        if (controlZone) {
            return controlZone.bounds;
        }

        // Fallback to track zone
        const trackZone = this._zones.get('track');
        if (trackZone) {
            return trackZone.bounds;
        }

        // Default bounds
        return { x: 0, y: 0, width: this._containerSize.width, height: this._containerSize.height };
    }

    /**
     * Invalidate memoization cache
     * @private
     */
    _invalidateMemoization() {
        this._memoizedTrack = null;
        this._memoizedTrackConfig = null;
        this._memoizedGauge = null;
        this._memoizedGaugeConfig = null;
    }

    /**
     * Handle slider input (while dragging)
     * @private
     */
    _handleSliderInput(event) {
        const value = parseFloat(event.target.value);
        this._sliderValue = value;

        // Update visuals immediately
        this._updateDynamicElements();
    }

    /**
     * Handle slider change (on release)
     * @private
     */
    async _handleSliderChange(event) {
        const value = parseFloat(event.target.value);

        // Call appropriate service based on entity domain
        await this._setEntityValue(value);
    }

    /**
     * Set entity value via service call
     * @private
     */
    async _setEntityValue(value) {
        if (!this.hass || !this.config.entity) return;

        const domain = this._domain;
        const entityId = this.config.entity;
        const attribute = this._controlConfig.attribute;

        try {
            if (domain === 'light') {
                // Convert value to 0-255 brightness range
                // The slider value represents a percentage (e.g., min=10, max=50 means 10%-50% brightness)
                // Convert the percentage directly to 0-255 range
                const brightness = Math.round((value / 100) * 255);

                await this.hass.callService('light', 'turn_on', {
                    entity_id: entityId,
                    brightness: brightness
                });
            } else if (domain === 'cover') {
                await this.hass.callService('cover', 'set_cover_position', {
                    entity_id: entityId,
                    position: value
                });
            } else if (domain === 'fan') {
                await this.hass.callService('fan', 'set_percentage', {
                    entity_id: entityId,
                    percentage: value
                });
            } else if (domain === 'input_number' || domain === 'number') {
                await this.hass.callService(domain, 'set_value', {
                    entity_id: entityId,
                    value: value
                });
            } else {
                lcardsLog.warn(`[LCARdSSlider] Unsupported domain for value setting: ${domain}`);
            }

            lcardsLog.debug(`[LCARdSSlider] Set ${entityId} to ${value}`);

        } catch (error) {
            lcardsLog.error(`[LCARdSSlider] Service call failed:`, error);
        }
    }

    /**
     * Generate fallback slider (no component loaded)
     * @private
     */
    _generateFallbackSlider(width, height) {
        const orientation = this._sliderStyle?.track?.orientation || 'horizontal';
        const isVertical = orientation === 'vertical';

        // Track dimensions
        const trackWidth = isVertical ? 20 : width - 20;
        const trackHeight = isVertical ? height - 20 : 20;
        const trackX = isVertical ? (width - trackWidth) / 2 : 10;
        const trackY = isVertical ? 10 : (height - trackHeight) / 2;

        // Generate track content
        const trackContent = this._mode === 'pills'
            ? this._generatePillsSVG(trackWidth, trackHeight, this._sliderStyle?.track?.segments, orientation)
            : this._generateGaugeSVG(trackWidth, trackHeight);

        return `
            <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
                <g class="slider-fallback" transform="translate(${trackX}, ${trackY})">
                    ${trackContent}
                </g>
            </svg>
        `;
    }

    /**
     * Render the card
     * @protected
     */
    _renderCard() {
        const width = this._containerSize.width || 200;
        const height = this._containerSize.height || 60;

        // Check if component is loaded
        if (this.config.component && !this._componentLoaded) {
            return html`
                <div class="slider-container">
                    <div class="slider-loading">Loading component...</div>
                </div>
            `;
        }

        let svgContent;

        if (this._componentSvg) {
            // Adjust viewBox to match container dimensions
            // This prevents distortion when container aspect ratio differs from viewBox
            const orientation = this._sliderStyle?.track?.orientation || 'horizontal';

            // Use container dimensions as viewBox
            // 1 viewBox unit = 1 rendered pixel
            this._componentSvg.setAttribute('viewBox', `0 0 ${width} ${height}`);

            // Helper function to get border size (supports both .size and .width properties)
            const getBorderSize = (borderDef) => borderDef?.size ?? borderDef?.width ?? 0;

            // Calculate border offsets for zone positioning
            const borderConfig = this._sliderStyle?.border;
            const borderOffsets = {
                left: borderConfig?.left?.enabled ? getBorderSize(borderConfig.left) : 0,
                top: borderConfig?.top?.enabled ? getBorderSize(borderConfig.top) : 0,
                right: borderConfig?.right?.enabled ? getBorderSize(borderConfig.right) : 0,
                bottom: borderConfig?.bottom?.enabled ? getBorderSize(borderConfig.bottom) : 0
            };

            // Parse margin configuration (can be number or {top, right, bottom, left})
            // Gauge mode defaults to zero margins for seamless ruler design
            const defaultMargin = this._mode === 'gauge' ? 0 : 10;
            const marginConfig = this._sliderStyle?.track?.margin ?? defaultMargin;

            lcardsLog.debug(`[LCARdSSlider] Mode: ${this._mode}, Default margin: ${defaultMargin}, Margin config:`, marginConfig);

            let margins;
            if (typeof marginConfig === 'number') {
                // Single value applies to all sides
                margins = { top: marginConfig, right: marginConfig, bottom: marginConfig, left: marginConfig };
            } else {
                // Object with per-side values (with defaults)
                margins = {
                    top: marginConfig.top ?? defaultMargin,
                    right: marginConfig.right ?? defaultMargin,
                    bottom: marginConfig.bottom ?? defaultMargin,
                    left: marginConfig.left ?? defaultMargin
                };
            }

            lcardsLog.debug(`[LCARdSSlider] ${orientation} viewBox adjustment:`, {
                containerWidth: width,
                containerHeight: height,
                borderOffsets,
                margins
            });

            // Apply margins and border offsets to track zone
            // Track zone is inset from borders AND margins
            const trackZone = this._zones.get('track');
            if (trackZone) {
                trackZone.bounds = {
                    x: borderOffsets.left + margins.left,
                    y: borderOffsets.top + margins.top,
                    width: width - borderOffsets.left - borderOffsets.right - margins.left - margins.right,
                    height: height - borderOffsets.top - borderOffsets.bottom - margins.top - margins.bottom
                };

                lcardsLog.debug(`[LCARdSSlider] Track zone bounds:`, trackZone.bounds);

                // Update data-bounds attribute and position via transform
                trackZone.element.setAttribute('data-bounds',
                    `${trackZone.bounds.x},${trackZone.bounds.y},${trackZone.bounds.width},${trackZone.bounds.height}`);
                trackZone.element.setAttribute('transform',
                    `translate(${trackZone.bounds.x}, ${trackZone.bounds.y})`);
            }

            // Control zone should match track zone for proper slider alignment
            // This ensures the slider input overlay aligns with the visual track area
            const controlZone = this._zones.get('control');
            if (controlZone && trackZone) {
                controlZone.bounds = {
                    x: trackZone.bounds.x,
                    y: trackZone.bounds.y,
                    width: trackZone.bounds.width,
                    height: trackZone.bounds.height
                };

                // Update control zone element
                const controlElement = this._componentSvg.querySelector('#control-zone');
                if (controlElement) {
                    controlElement.setAttribute('data-bounds',
                        `${trackZone.bounds.x},${trackZone.bounds.y},${trackZone.bounds.width},${trackZone.bounds.height}`);
                    controlElement.setAttribute('x', trackZone.bounds.x);
                    controlElement.setAttribute('y', trackZone.bounds.y);
                    controlElement.setAttribute('width', trackZone.bounds.width);
                    controlElement.setAttribute('height', trackZone.bounds.height);
                }
            }

            // Inject SVG borders from config
            this._injectBorders();

            // Inject text fields using button's text system
            this._injectTextFields(width, height);

            // Inject dynamic content into zones
            this._injectContentIntoZones();            // Serialize component SVG
            svgContent = new XMLSerializer().serializeToString(this._componentSvg);
        } else {
            // Generate fallback slider
            svgContent = this._generateFallbackSlider(width, height);
        }

        // Get control zone bounds for input positioning
        const controlBounds = this._getControlZoneBounds();
        const orientation = this._sliderStyle?.track?.orientation || 'horizontal';
        const isVertical = orientation === 'vertical';

        // Calculate scale factor from viewBox to actual container size
        const svgViewBoxWidth = this._componentSvg ?
            (parseFloat(this._componentSvg.getAttribute('viewBox')?.split(' ')[2]) || 200) : 200;
        const svgViewBoxHeight = this._componentSvg ?
            (parseFloat(this._componentSvg.getAttribute('viewBox')?.split(' ')[3]) || 30) : 30;

        const scaleX = width / svgViewBoxWidth;
        const scaleY = height / svgViewBoxHeight;

        // Calculate where control range sits within display range
        const displayMin = this._displayConfig.min;
        const displayMax = this._displayConfig.max;
        const displayRange = displayMax - displayMin;

        const controlMin = this._controlConfig.min;
        const controlMax = this._controlConfig.max;

        // What percentage of display range does control span?
        const controlStartPercent = (controlMin - displayMin) / displayRange;
        const controlEndPercent = (controlMax - displayMin) / displayRange;
        const controlWidthPercent = controlEndPercent - controlStartPercent;

        // Scale and adjust the control bounds
        const trackWidth = controlBounds.width * scaleX;
        const trackHeight = controlBounds.height * scaleY;

        const scaledBounds = {
            x: (controlBounds.x * scaleX) + (trackWidth * controlStartPercent),
            y: controlBounds.y * scaleY,
            width: isVertical ? trackWidth : (trackWidth * controlWidthPercent),
            height: isVertical ? (trackHeight * controlWidthPercent) : trackHeight
        };

        // For vertical sliders, adjust y position (top) instead of x
        if (isVertical) {
            scaledBounds.x = controlBounds.x * scaleX;
            scaledBounds.y = (controlBounds.y * scaleY) + (trackHeight * (1 - controlEndPercent));
        }

        return html`
            <div class="slider-container">
                ${unsafeHTML(svgContent)}

                ${!this._controlConfig.locked ? html`
                    <input
                        type="range"
                        class="slider-input-overlay"
                        value="${String(this._sliderValue)}"
                        min="${String(this._controlConfig.min)}"
                        max="${String(this._controlConfig.max)}"
                        step="${this._controlConfig.step || 1}"
                        ?disabled="${this._controlConfig.locked}"
                        @input="${this._handleSliderInput}"
                        @change="${this._handleSliderChange}"
                        style="
                            left: ${scaledBounds.x}px;
                            top: ${scaledBounds.y}px;
                            width: ${scaledBounds.width}px;
                            height: ${scaledBounds.height}px;
                            ${isVertical ? '-webkit-appearance: slider-vertical; writing-mode: bt-lr;' : ''}
                        "
                    />
                ` : ''}
            </div>
        `;
    }

    /**
     * Get card size for Home Assistant layout
     * @returns {number}
     */
    getCardSize() {
        return this.config.grid_rows || 1;
    }

    /**
     * Get layout options
     * @returns {Object}
     */
    getLayoutOptions() {
        return {
            grid_columns: this.config.grid_columns ?? 'full',
            grid_rows: this.config.grid_rows ?? 1,
            grid_min_columns: this.config.grid_min_columns ?? 4,
            grid_min_rows: this.config.grid_min_rows ?? 1
        };
    }

    /**
     * Get stub config for card picker
     * @returns {Object}
     */
    static getStubConfig() {
        return {
            type: 'custom:lcards-slider',
            component: 'basic',
            preset: 'pills-basic'
        };
    }

    /**
     * Register slider card with CoreConfigManager
     * Called by lcards.js after core initialization
     * @static
     */
    static registerSchema() {
        const configManager = window.lcards?.core?.configManager;
        if (!configManager) {
            lcardsLog.error('[LCARdSSlider] CoreConfigManager not available for schema registration');
            return;
        }

        // Get available presets
        const stylePresetManager = window.lcards?.core?.stylePresetManager;
        const availablePresets = stylePresetManager?.getAvailablePresets('slider') || [];

        // Get available components
        const availableComponents = getSliderComponentNames();

        lcardsLog.debug('[LCARdSSlider] Registering schema with presets:', availablePresets);

        // Register schema
        const sliderSchema = getSliderSchema({
            availablePresets,
            availableComponents
        });
        configManager.registerCardSchema('slider', sliderSchema, { version: '1.22.0' });

        // Register behavioral defaults ONLY (no styles)
        configManager.registerCardDefaults('slider', {
            orientation: 'horizontal'  // Simple default
            // NO preset, NO style, NO mode
        });

        lcardsLog.debug('[LCARdSSlider] Registered with CoreConfigManager');
    }

    /**
     * Get configuration editor element
     * Returns slider-specific editor (extends button editor with cardType='slider')
     * @static
     * @override
     */
    static getConfigElement() {
        return document.createElement('lcards-slider-editor');
    }
}

// NOTE: Card registration handled in src/lcards.js initializeCustomCard().then()

lcardsLog.info('[LCARdSSlider] Card module loaded');

