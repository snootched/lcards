/**
 * LCARdS Slider Card
 *
 * Interactive slider and gauge card using SVG component templates with dynamic
 * zone injection. Supports sliders for lights, covers, fans, climate, media players,
 * humidifiers, water heaters, valves, and input_number entities, as well as read-only
 * gauge displays for sensors.
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
 * - Support for light, cover, fan, climate, media_player, humidifier, water_heater,
 *   valve, input_number, number, sensor domains
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
 */


import { html, css } from 'lit';
import { unsafeHTML } from 'lit/directives/unsafe-html.js';
import { LCARdSButton } from './lcards-button.js';
import { lcardsLog } from '../utils/lcards-logging.js';
import { UnifiedTemplateEvaluator } from '../core/templates/UnifiedTemplateEvaluator.js';
import { escapeHtml } from '../utils/StringUtils.js';
import { ColorUtils } from '../core/themes/ColorUtils.js';
import { deepMerge } from '../utils/deepMerge.js';
import { resolveThemeTokensRecursive } from '../utils/lcards-theme.js';
import { haFormatStateParts, extractUnit } from '../utils/ha-entity-display.js';

// Import unified schema
import { getSliderSchema } from './schemas/slider-schema.js';

// Import editor (registers custom element)
import '../editor/cards/lcards-slider-editor.js';

/**
 * COLOR RESOLUTION PATTERNS:
 *
 * This card uses three different color resolution methods depending on the use case:
 *
 * 1. resolveStateColor() - For state-aware colors
 *    - Use when color should change based on entity state (on/off/unavailable)
 *    - Examples: tick colors, label colors, borders with state variants
 *    - Takes: {actualState, classifiedState, colorConfig, fallback}
 *    - Config structure: { default: '#color', active: '#color', inactive: '#color', unavailable: '#color' }
 *
 * 2. ColorUtils.resolveCssVariable() - For static colors
 *    - Use when color is single value, no state awareness needed
 *    - Examples: progress bars, range backgrounds, indicators
 *    - Takes: string (CSS variable or hex color)
 *    - Resolves CSS variables to actual color values
 *
 * 3. _resolveStateBorderColor() - Convenience wrapper for borders
 *    - Wraps resolveStateColor() with border-specific defaults
 *    - Use for all border color resolution (consistent fallback)
 *    - Automatically uses current entity state
 */

export class LCARdSSlider extends LCARdSButton {

    /** Card type identifier for CoreConfigManager */
    static CARD_TYPE = 'slider';

    static get properties() {
        return {
            ...super.properties,
            _sliderValue: {
                type: Number,
                state: true,
                hasChanged(newVal, oldVal) {
                    // Only trigger re-render if value actually changed
                    // Handle NaN edge case (NaN !== NaN is true, but we want false)
                    if (isNaN(newVal) && isNaN(oldVal)) return false;
                    return newVal !== oldVal;
                }
            },
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
                    /* width: 100% omitted — see LCARdSCard base comment (overflows with card_margin).
                     * height: 100% inherited from LCARdSCard base. */
                }

                .slider-container {
                    width: 100%;
                    height: 100%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    position: relative;
                    box-sizing: border-box;
                    overflow: visible;
                    /* CSS borders applied via inline styles from config */
                    /* Floor matches .button-container in lcards-button.js so the slider
                     * is visible in auto-height grid rows (height:100% collapses to 0
                     * when the grid track has no explicit minimum). Overridden at runtime
                     * by config.min_height / config.height inline styles. */
                    min-height: var(--lcards-button-min-height, 56px);
                }

                /* The SVG is positioned absolute so it fills the container without
                 * participating in flow layout. This is the critical break in the
                 * height feedback loop:
                 *   flow SVG → container content height → host height → size-ref → loop
                 * With position:absolute the SVG has zero flow contribution. The
                 * container height is determined entirely by CSS/grid (height:100%
                 * resolves from the grid track), the SVG silently fills it.
                 * NOTE: The SVG is injected via unsafeHTML() so it has no class; the
                 * child selector (.slider-container > svg) is required to reach it.
                 * .slider-svg is kept as a fallback for any direct SVG element usage. */
                .slider-container > svg,
                .slider-svg {
                    position: absolute;
                    inset: 0;
                    display: block;
                    width: 100%;
                    height: 100%;
                    overflow: visible;
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
                    font-family: var(--primary-font-family, 'Antonio', sans-serif);
                    font-size: 14px;
                    line-height: 1.2;
                    color: var(--lcars-text-light, #ffffff);
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
        this._componentLoaded = false;
        this._componentMetadata = null;   // NEW: Component metadata (zones, features, etc.)

        // Render function architecture
        this._componentRenderer = null;           // Component render() function
        this._componentCalculateZones = null;     // Component calculateZones() function

        // Memoization for performance
        this._memoizedTrack = null;
        this._memoizedTrackConfig = null;
        this._memoizedGauge = null;
        this._memoizedGaugeConfig = null;

        // Alert mode subscription
        this._alertModeUnsubscribe = null;

        // Resolved numeric values for value-based (marker) range entries
        this._resolvedMarkerValues = [];

        // Control configuration (derived from config + entity)
        this._controlConfig = {
            min: 0,
            max: 100,
            step: 1,
            attribute: null,
            locked: false
        };

        // Border interaction states (hover/pressed) for Default component
        // Each border can have independent hover/pressed colors
        this._borderHoverStyles = { left: null, top: null, right: null, bottom: null };
        this._borderPressedStyles = { left: null, top: null, right: null, bottom: null };
        this._borderInteractivityCleanups = { left: null, top: null, right: null, bottom: null };
        this._borderActionCleanups = { left: null, top: null, right: null, bottom: null };

        // Unified border hover state (all borders hover together as one frame)
        this._allBordersHovering = false;
        this._borderHoverRestoreTimer = null;
        this._borderElements = { left: null, top: null, right: null, bottom: null };

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
        this._handleVerticalSliderMouseDown = this._handleVerticalSliderMouseDown.bind(this);
        this._handleVerticalSliderMouseMove = this._handleVerticalSliderMouseMove.bind(this);
        this._handleVerticalSliderMouseUp = this._handleVerticalSliderMouseUp.bind(this);
        this._handleVerticalSliderTouchStart = this._handleVerticalSliderTouchStart.bind(this);
        this._handleVerticalSliderTouchMove = this._handleVerticalSliderTouchMove.bind(this);
        this._handleVerticalSliderTouchEnd = this._handleVerticalSliderTouchEnd.bind(this);

        this._isDragging = false;
        this._isHorizontalDragging = false;
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

        // Always load component (defaults to 'default' if not specified)
        this._loadSliderComponent();

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
    /**
     * Bust the SVG memoization cache whenever the light-colour CSS variable
     * changes so subsequent renders pick up the new resolved colour instead
     * of the stale cached SVG (which may have been built before the variable
     * was set on the first render after a card reload).
     * @protected
     * @override
     */
    _onLightColorChanged() {
        this._invalidateMemoization();
    }

    _handleHassUpdate(newHass, oldHass) {
        // Call parent to handle state-based color resolution
        super._handleHassUpdate(newHass, oldHass);

        // Update entity value (only when a primary entity is configured)
        if (this.config.entity && this._entity) {
            // Skip syncing the visual value while the user is actively dragging.
            // HASS can push a new state for the entity mid-drag (polling
            // integrations, unrelated attribute churn, echoed context) before our
            // own service call has gone out on release — overwriting _sliderValue
            // here would snap the handle back to the stale entity value out from
            // under the user's finger/pointer. See issue #392.
            const isDragging = this._isDragging || this._isHorizontalDragging;

            if (!isDragging) {
                // Get new value and set it
                // Lit's hasChanged() automatically determines if re-render is needed
                const newValue = this._getEntityValue(this._entity);
                const previousValue = this._sliderValue;

                this._sliderValue = newValue;

                // Log value changes (first load or actual change)
                if (!oldHass || previousValue !== newValue) {
                    lcardsLog.debug(`[LCARdSSlider] Value ${!oldHass ? 'initialized' : 'changed'}: ${previousValue} -> ${newValue}`);
                }
            } else {
                lcardsLog.trace(`[LCARdSSlider] Skipping value sync from HASS — drag in progress`);
            }

            // Update control config if entity attributes changed
            this._updateControlConfig();
        }

        // Always re-resolve range templates — range bounds and colors may reference
        // entities other than the primary entity (tracked via the _updateTrackedEntities
        // override, so the base class's own re-render gate already covers them).
        // Called unconditionally so cards with no primary entity but with dynamic
        // range templates also respond correctly.
        this._resolveMarkerValues();
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
            this._registerOverlayForRules(`slider-${this.config.id}`, 'slider', ['slider']);
        } else {
            this._registerOverlayForRules(`slider-${this._cardGuid}`, 'slider', ['slider']);
        }

        // Subscribe to alert mode changes so hue-shifts bust the memoization cache
        this._subscribeToAlertMode();
    }

    /**
     * Pre-evaluate Jinja2/JS templates found in the style config so that
     * synchronous SVG generation can call `_resolveTemplateValue()` and get
     * the already-resolved result from `_evaluatedStyleCache`.
     * @protected
     * @override
     */
    async _processCustomTemplates() {
        if (this.config.style) {
            await this._preEvaluateStyleTemplates(this.config.style);
        }
        await this._preEvaluateMarkerLabelTemplates();
        await super._processCustomTemplates();
    }

    /**
     * Pre-evaluate range.label.text templates through the full template pipeline
     * (JS + Token + DataSource + Jinja2 — unlike range value/min/max, which only
     * need the synchronous evaluateSync() subset) and cache results in
     * `_evaluatedStyleCache`, so `_generateGaugeMarkers()` and the pills-generation
     * loop can read them synchronously via `_resolveTemplateValue()` — the same
     * cache/read path already used for range.indicator.color.
     *
     * Called unconditionally (not gated by a Jinja2/JS syntax pre-check like
     * `_preEvaluateStyleTemplates()`) because Token/DataSource-only label text
     * still needs to reach `processTemplate()` to resolve.
     * @private
     */
    async _preEvaluateMarkerLabelTemplates() {
        const ranges = this.config.style?.ranges;
        if (!Array.isArray(ranges)) return;

        for (const range of ranges) {
            const text = range?.label?.text;
            if (typeof text !== 'string' || !text) continue;
            try {
                const result = await this.processTemplate(text, { displayFormat: 'friendly' });
                this._evaluatedStyleCache.set(text, result);
            } catch (e) {
                lcardsLog.warn('[LCARdSSlider] Failed to pre-evaluate marker label template:', e);
            }
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

        // Determine track visual style (pills / gauge / shaped)
        // ✅ ONLY use track.type (never config.mode)
        const trackType = this._sliderStyle?.track?.type;
        const validTypes = ['pills', 'gauge', 'shaped'];

        if (trackType && validTypes.includes(trackType)) {
            this._mode = trackType;
        } else {
            // Default based on domain (fallback if no preset or style.track.type)
            const interactiveDomains = ['light', 'cover', 'fan', 'input_number', 'number', 'climate', 'media_player', 'humidifier', 'water_heater', 'valve'];
            this._mode = interactiveDomains.includes(this._domain) ? 'pills' : 'gauge';
        }

        // When the shaped component is active, always use shaped fill mode —
        // pills and gauge don't make sense inside a clip-path shell.
        const activeComponent = this.config.component || this._sliderStyle?.component;
        if (activeComponent === 'shaped') {
            this._mode = 'shaped';
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
            case 'climate': return 'temperature';
            case 'media_player': return 'volume_level';
            case 'humidifier': return 'humidity';
            case 'water_heater': return 'temperature';
            case 'valve': return 'current_valve_position';
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
        const controllableDomains = ['light', 'cover', 'fan', 'input_number', 'number', 'climate', 'media_player', 'humidifier', 'water_heater', 'valve'];
        const isControllable = controllableDomains.includes(this._domain);

        // Value inversion (explicit only, no auto-detection)
        const invertValue = config.control?.invert_value ?? false;

        // Domain-specific attribute min/max/step defaults
        let defaultMin, defaultMax, defaultStep, defaultUnit;
        if (this._domain === 'climate' || this._domain === 'water_heater') {
            defaultMin = entity?.attributes?.min_temp ?? 15;
            defaultMax = entity?.attributes?.max_temp ?? (this._domain === 'water_heater' ? 60 : 30);
            defaultStep = entity?.attributes?.target_temp_step ?? 0.5;
        } else if (this._domain === 'media_player') {
            // volume_level is 0.0–1.0 internally; slider operates in 0–100 percentage space
            defaultMin = 0;
            defaultMax = 100;
            defaultStep = 1;
            defaultUnit = '%';
        } else if (this._domain === 'humidifier') {
            defaultMin = entity?.attributes?.min_humidity ?? 0;
            defaultMax = entity?.attributes?.max_humidity ?? 100;
            defaultStep = 1;
        } else if (this._domain === 'valve') {
            defaultMin = 0;
            defaultMax = 100;
            defaultStep = 1;
        } else {
            defaultMin = entity?.attributes?.min ?? 0;
            defaultMax = entity?.attributes?.max ?? 100;
            defaultStep = entity?.attributes?.step ?? 1;
        }

        // CONTROL CONFIG: What user can set via slider input
        this._controlConfig = {
            min: config.control?.min ?? defaultMin,
            max: config.control?.max ?? defaultMax,
            step: config.control?.step ?? defaultStep,
            attribute: config.control?.attribute ?? this._getDefaultAttribute(),
            locked: config.control?.locked ?? !isControllable,
            invertValue: !!invertValue  // NEW: Store inversion flag
        };

        // DISPLAY CONFIG: What visual scale shows (from style.track.display)
        // Default to control range if not explicitly configured (no breaking changes)
        // Unit preference: explicit config > HA ToParts unit (locale-correct) > unit_of_measurement fallback
        const haUnit = extractUnit(haFormatStateParts(this.hass, entity));
        this._displayConfig = {
            min: this._sliderStyle?.track?.display?.min ?? this._controlConfig.min,
            max: this._sliderStyle?.track?.display?.max ?? this._controlConfig.max,
            unit: this._sliderStyle?.track?.display?.unit ?? haUnit ?? entity?.attributes?.unit_of_measurement ?? defaultUnit ?? ''
        };

        lcardsLog.debug('[LCARdSSlider] Config resolved:', {
            control: this._controlConfig,
            display: this._displayConfig,
            invertValue: this._controlConfig.invertValue
        });
    }

    /**
     * Get value from entity state and convert to control config range
     * @private
     */
    _getEntityValue(entity) {
        if (!entity) return 0;

        const attribute = this._resolveControlAttribute(this._controlConfig.attribute);
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
            rawValue = (rawValue / 255) * 100;
        } else if (this._domain === 'media_player' && attribute === 'volume_level') {
            // Convert volume_level (0.0–1.0) to percentage (0–100)
            rawValue = rawValue * 100;
        }

        // Apply value inversion if configured
        if (this._controlConfig.invertValue) {
            const { min, max } = this._controlConfig;
            rawValue = max - rawValue + min;
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

        // NEW: Extract fill inversion setting
        const invertFill = style.track?.invert_fill ?? false;
        this._invertFill = !!invertFill;

        this._sliderStyle = style;

        // Extract border interaction styles (hover/pressed) from resolved style
        // Only for Default component borders - Advanced components have custom rendering
        if (this._sliderStyle && this._sliderStyle.border) {
            const borders = ['left', 'top', 'right', 'bottom'];
            borders.forEach(side => {
                const borderConfig = this._sliderStyle.border[side];
                if (borderConfig && borderConfig.enabled) {
                    // Extract hover/pressed from border color config
                    // Structure: style.border.{side}.color.hover/pressed
                    const colorConfig = borderConfig.color;
                    if (colorConfig && typeof colorConfig === 'object') {
                        this._borderHoverStyles[side] = colorConfig.hover
                            ? this._resolveColorValue(String(this._resolveTemplateValue(colorConfig.hover)))
                            : null;
                        this._borderPressedStyles[side] = colorConfig.pressed
                            ? this._resolveColorValue(String(this._resolveTemplateValue(colorConfig.pressed)))
                            : null;

                        lcardsLog.trace(`[LCARdSSlider] Extracted ${side} border interaction:`, {
                            hover: this._borderHoverStyles[side],
                            pressed: this._borderPressedStyles[side]
                        });
                    }
                } else {
                    // Border not enabled - clear any previous interaction styles
                    this._borderHoverStyles[side] = null;
                    this._borderPressedStyles[side] = null;
                }
            });
        }

        // Resolve marker values now that _sliderStyle is set
        this._resolveMarkerValues();
    }

    /**
     * Resolve a range marker `value` template to a numeric position.
     * Supports: static numbers, and — via the shared UnifiedTemplateEvaluator's
     * synchronous evaluateSync() — {entity.state}/{entity.attributes.xxx}/{states.entity_id.state}
     * token templates, [[[JS]]] templates, and {datasource:name} references.
     * Jinja2 is intentionally NOT supported here: this resolver runs on every hass
     * tick (for live-tracking accuracy) and Jinja2 requires an async HA round-trip —
     * see _buildRangeTemplateEvaluator() for the rationale.
     * @param {*} template - Template string or static number
     * @param {UnifiedTemplateEvaluator|null} evaluator - Shared evaluator built by
     *   _buildRangeTemplateEvaluator(), or null if none of this cycle's ranges need one
     * @returns {number|null} Resolved numeric value, or null if unresolvable
     * @private
     */
    _resolveMarkerValue(template, evaluator) {
        if (template === null || template === undefined) return null;
        if (typeof template === 'number') return isNaN(template) ? null : template;

        const str = String(template).trim();

        // Try parsing as a plain numeric string (fast path — no evaluator needed)
        const parsed = parseFloat(str);
        if (!isNaN(parsed) && str === String(parsed)) return parsed;

        if (!evaluator) return null; // hass not yet available; will re-resolve on next update

        try {
            const result = evaluator.evaluateSync(str);
            const v = parseFloat(result);
            return isNaN(v) ? null : v;
        } catch (e) {
            lcardsLog.warn(`[LCARdSSlider] Marker value template error:`, e);
            return null;
        }
    }

    /**
     * Lazily construct a UnifiedTemplateEvaluator for this cycle's range value/min/max
     * templates. Returns null (skipping construction entirely) when every range value
     * is already a plain number — the common case — so all-numeric markers never pay
     * for evaluator construction.
     *
     * displayFormat is 'raw' (not 'friendly'): results feed parseFloat() directly and
     * must not pick up localized/unit-suffixed display formatting.
     * @param {Array} ranges - this._sliderStyle.ranges
     * @returns {UnifiedTemplateEvaluator|null}
     * @private
     */
    _buildRangeTemplateEvaluator(ranges) {
        const isPlainNumber = (v) => {
            if (v === null || v === undefined) return true;
            if (typeof v === 'number') return true;
            const str = String(v).trim();
            const parsed = parseFloat(str);
            return !isNaN(parsed) && str === String(parsed);
        };
        const needsEvaluator = ranges.some(r => !isPlainNumber(r.value) || !isPlainNumber(r.min) || !isPlainNumber(r.max));
        if (!needsEvaluator || !this.hass) return null;

        return new UnifiedTemplateEvaluator({
            hass: this.hass,
            context: {
                entity: this._entity,
                config: this.config,
                hass: this.hass,
                states: this.hass?.states,
                variables: this.config?.variables || {},
                theme: this._singletons?.themeManager?.getActiveTheme?.(),
                displayFormat: 'raw'
            },
            dataSourceManager: window.lcards?.core?.dataSourceManager
        });
    }

    /**
     * Resolve a control attribute template to a string attribute name.
     * Supports token templates ({entity.attributes.xxx}, {entity.state}) and
     * JS templates ([[[return ...]]]). Plain strings are returned as-is.
     * @param {string|null} rawAttr - Raw attribute config value
     * @returns {string|null} Resolved attribute name string
     * @private
     */
    _resolveControlAttribute(rawAttr) {
        if (!rawAttr || typeof rawAttr !== 'string') return rawAttr;
        const str = rawAttr.trim();

        // Token: {entity.attributes.xxx} → resolve to the attribute value as string
        const tokenMatch = str.match(/^\{([^}]+)\}$/);
        if (tokenMatch) {
            const token = tokenMatch[1];
            if (token === 'entity.state') {
                return String(this._entity?.state ?? rawAttr);
            }
            const attrMatch = token.match(/^entity\.attributes\.(.+)$/);
            if (attrMatch) {
                return String(this._entity?.attributes?.[attrMatch[1]] ?? rawAttr);
            }
        }

        // JS template: [[[return expression]]]
        if (str.startsWith('[[[') && str.endsWith(']]]')) {
            if (!this.hass) return rawAttr;
            const jsBody = str.slice(3, -3).trim();
            try {
                // eslint-disable-next-line no-new-func
                const fn = new Function('hass', 'entity', 'states', jsBody);
                const result = fn(this.hass, this._entity, this.hass.states);
                return result != null ? String(result) : rawAttr;
            } catch (e) {
                lcardsLog.warn(`[LCARdSSlider] Control attribute JS template error:`, e);
                return rawAttr;
            }
        }

        // Plain string — return as-is
        return rawAttr;
    }

    /**
     * Resolve all value-based (marker) range entries to numeric positions.
     * Stores a parallel array to style.ranges in this._resolvedMarkerValues.
     * Null entries correspond to band ranges (min/max) or unresolvable templates.
     * Called from _resolveSliderStyleSync() and _handleHassUpdate().
     * @private
     */
    _resolveMarkerValues() {
        const ranges = this._sliderStyle?.ranges || [];
        const evaluator = this._buildRangeTemplateEvaluator(ranges);
        this._resolvedMarkerValues = ranges.map((range, idx) => {
            if (!('value' in range)) return null; // Band range, not a marker
            const resolved = this._resolveMarkerValue(range.value, evaluator);
            lcardsLog.trace(`[LCARdSSlider] Marker range[${idx}] resolved: ${JSON.stringify(range.value)} → ${resolved}`);
            return resolved;
        });
        // Also resolve dynamic band range bounds (min/max templates)
        this._resolveRangeBounds(evaluator);
    }

    /**
     * Resolve band range `min`/`max` templates to numeric values.
     * Supports the same template syntaxes as _resolveMarkerValue(): static numbers,
     * plus (via the shared evaluator) token/JS/datasource templates.
     * Stores a parallel array in this._resolvedRangeBounds indexed to this._sliderStyle.ranges.
     * Null entries correspond to marker ranges (those with a `value` key).
     * Called automatically from _resolveMarkerValues() on every HASS update and style change.
     * @param {UnifiedTemplateEvaluator|null} evaluator - Shared evaluator built by
     *   _buildRangeTemplateEvaluator(), passed through from _resolveMarkerValues()
     * @private
     */
    _resolveRangeBounds(evaluator) {
        const ranges = this._sliderStyle?.ranges || [];
        this._resolvedRangeBounds = ranges.map((range, idx) => {
            if ('value' in range) return null; // Marker range, not a band
            const resolvedMin = this._resolveMarkerValue(range.min, evaluator);
            const resolvedMax = this._resolveMarkerValue(range.max, evaluator);
            lcardsLog.trace(`[LCARdSSlider] Band range[${idx}] bounds resolved: min=${JSON.stringify(range.min)}→${resolvedMin}, max=${JSON.stringify(range.max)}→${resolvedMax}`);
            return { min: resolvedMin, max: resolvedMax };
        });
    }

    /**
     * Scan an array of range configs (min, max, value, label.text) for entity ID
     * references using token syntax ({states.entity_id.state}) or JS bracket syntax
     * (states['entity.id'], hass.states['entity.id']). Jinja2 refs (e.g.
     * {{ states('sensor.x') }}) don't need this scan — those are already caught by
     * the base class's own Jinja2-function-call scan in _updateTrackedEntities().
     * @param {Array} ranges - Raw range configs (this.config.style.ranges)
     * @returns {Set<string>}
     * @private
     */
    _scanRangeTemplatesForEntities(ranges) {
        const entities = new Set();
        if (!Array.isArray(ranges)) return entities;

        const extractFromTemplate = (tmpl) => {
            if (!tmpl || typeof tmpl !== 'string') return;

            // Trim like _resolveMarkerValue()/UnifiedTemplateEvaluator's token matcher
            // do — both tolerate whitespace around/inside the braces (e.g.
            // '{ states.x.state }'), so this scan must match on the same trimmed
            // form or it silently misses entities the real resolver has no trouble with.
            const trimmed = tmpl.trim();

            // Token syntax: {states.entity_id.state} or {states.entity_id.attributes.xxx}
            // (optional whitespace tolerated right after '{', matching the real evaluator)
            const tokenMatch = trimmed.match(/^\{\s*states\.([^.}]+\.[^.}]+)\./)
            if (tokenMatch) {
                entities.add(tokenMatch[1]);
                return;
            }

            // JS template syntax: states['entity.id'] or states["entity.id"]
            // Also matches hass.states['entity.id']
            const jsMatches = trimmed.matchAll(/states\[['"](\S+?)['"]/g);
            for (const m of jsMatches) {
                entities.add(m[1]);
            }
        };

        ranges.forEach(range => {
            extractFromTemplate(range.min);
            extractFromTemplate(range.max);
            extractFromTemplate(range.value); // Marker ranges too
            extractFromTemplate(range.label?.text);
        });

        return entities;
    }

    /**
     * Merge entities referenced by range min/max/value/label.text templates into
     * _trackedEntities, alongside the base class's primary-entity/animation/rule/
     * Jinja2-scan/triggers_update sources (LCARdSCard.js `_updateTrackedEntities()`,
     * whose own docblock says "Subclasses should override to add their specific
     * template sources" — this is exactly what `_extractMapRangeEntities` already
     * does there for `map_range` descriptors).
     *
     * Without this, a range/label template referencing an entity other than the
     * primary `entity` via token ({states.x.state}) or JS-bracket syntax never
     * triggers _scheduleTemplateUpdate() (LCARdSCard.js `_onHassChanged`, which only
     * loops `_trackedEntities`) when that entity changes — so range.label.text's
     * async pre-evaluation and range min/max/value's position never refresh until
     * some unrelated tracked entity happens to change and drags them along.
     *
     * Reads from `this.config.style.ranges` (raw config), not `this._sliderStyle`,
     * because this runs at config-processing time (LCARdSCard.js ~line 386) before
     * `_sliderStyle` is (re)computed — matching how `_extractMapRangeEntities` also
     * scans raw `this.config`, not internally-resolved state.
     * @protected
     * @override
     */
    _updateTrackedEntities() {
        super._updateTrackedEntities();
        const rangeEntities = this._scanRangeTemplatesForEntities(this.config.style?.ranges);
        if (rangeEntities.size > 0) {
            this._trackedEntities = Array.from(new Set([...this._trackedEntities, ...rangeEntities]));
            lcardsLog.trace(`[LCARdSSlider] Added range-template entities to tracked set:`, [...rangeEntities]);
        }
    }

    /**
     * Resolve a range color value with optional state-awareness.
     * If colorConfig is an object, routes through resolveStateColor() so the
     * full state-aware syntax ({ active, inactive, above:70, … }) works on ranges.
     * If colorConfig is a string (or undefined), falls back to _resolveColorValue()
     * for static colors, CSS variables, and computed theme tokens — preserving the
     * existing behavior for users who have not adopted the state-aware syntax.
     * @param {string|Object} colorConfig - Color string or state-aware config object
     * @param {string} [fallback='#888888'] - Fallback color
     * @returns {string} Resolved color
     * @private
     */
    _resolveRangeColor(colorConfig, fallback = '#888888') {
        if (colorConfig && typeof colorConfig === 'object') {
            const resolved = this._resolveStateValue({
                actualState: this._entity?.state,
                classifiedState: this._getButtonState(),
                colorConfig,
                fallback
            });
            // resolveStateColor can return string | number | null; coerce to string, then run
            // through the full pipeline (theme: safety net + var() materialization) since this
            // value is written to SVG attributes.
            return resolved != null ? this._resolveColorValue(String(resolved), fallback) : fallback;
        }
        return this._resolveColorValue(colorConfig, fallback);
    }


    /**
     * Load and parse SVG component
     * @private
     */
    async _loadSliderComponent() {
        // Default to 'default' component if not specified.
        // Also check style.component set by presets (e.g. shaped-vertical / shaped-horizontal sets component: shaped).
        const componentName = this.config.component || this._sliderStyle?.component || 'default';

        lcardsLog.debug(`[LCARdSSlider] Loading component: ${componentName}`);

        try {
            // Get component from ComponentManager
            const core = window.lcards?.core;
            const componentManager = core?.getComponentManager?.();

            if (!componentManager) {
                lcardsLog.error('[LCARdSSlider] ComponentManager not available');
                this._componentLoaded = false;
                this._componentMetadata = null;
                return;
            }

            let component = componentManager.getComponent(componentName);
            let svgContent;

            if (component) {
                // Component found with render function (new architecture)
                if (component.render && typeof component.render === 'function') {
                    // Component provides a render function - use it
                    lcardsLog.debug(`[LCARdSSlider] Component uses render function architecture`);

                    this._componentMetadata = component.metadata;
                    this._componentRenderer = component.render;

                    // Store helper functions if available
                    this._componentCalculateZones = component.calculateZones || null;

                    this._componentLoaded = true;

                    // Set orientation from component metadata
                    if (!this.config.style?.track?.orientation && component.metadata?.orientation) {
                        if (!this._sliderStyle) {
                            this._sliderStyle = {};
                        }
                        const existingTrack = this._sliderStyle.track || {};
                        this._sliderStyle.track = {
                            ...existingTrack,
                            orientation: component.metadata.orientation
                        };
                    }

                    lcardsLog.debug(`[LCARdSSlider] Component loaded with render(), calculateZones: ${!!this._componentCalculateZones}`);
                    this.requestUpdate();
                    return;
                }

                // Component found but doesn't use render architecture
                lcardsLog.error(`[LCARdSSlider] Component "${componentName}" does not use render function architecture`);
                this._componentLoaded = false;
                this._componentMetadata = null;
                return;
            }

            // No component found
            lcardsLog.error(`[LCARdSSlider] Component not found: ${componentName}`);
            this._componentLoaded = false;
            this._componentMetadata = null;

        } catch (error) {
            lcardsLog.error(`[LCARdSSlider] Component load failed:`, error);
            this._componentLoaded = false;
            this._componentMetadata = null;
        }
    }

    /**
     * Resolve state-based border color
     * Uses base class method for consistent color resolution across all cards
     * @param {Object|string} colorConfig - Color configuration (state object or string)
     * @returns {string|number|null} Resolved color
     * @private
     */
    /**
     * Override: treat any entity whose state is a valid finite number as 'active'.
     * input_number, number, counter, and numeric sensors have states like "75" or
     * "0.5" — these aren't in the base class activeStates list so they fall through
     * to 'inactive' (grey) without this override. String-state domains (light,
     * media_player, switch, …) are unaffected because their states are not numeric.
     * @override
     */
    _classifyEntityState(entity = null) {
        const target = entity || this._entity;
        if (target && target.state !== 'unavailable' && target.state !== 'unknown') {
            const n = parseFloat(target.state);
            if (!isNaN(n) && isFinite(n)) return 'active';
        }
        return super._classifyEntityState(entity);
    }

    _resolveStateBorderColor(colorConfig) {
        // Use base class method for state-based color resolution
        return this._resolveEntityStateColor(
            colorConfig,
            'theme:components.slider.border.color.default'
        );
    }

    /**
     * Override of the base class full color-resolution pipeline.
     * Adds a Canvas2D-specific optimization: if the base class resolves match-light
     * to a shadow-DOM CSS variable (var(--lcards-light-color-*)), that var cannot be
     * read by ColorUtils.resolveCssVariable() from document root.  Return the cached
     * concrete value (_lightColorValue) instead so Canvas2D fillStyle never sees a
     * var() string.
     *
     * @override
     * @param {Object|string|null} rawValue - Raw color config: state-object or string
     * @param {string} [fallback=''] - Returned when rawValue is falsy or resolution yields nothing
     * @returns {string} Resolved concrete color string, or fallback
     * @private
     */
    _resolveColorValue(rawValue, fallback = '') {
        const result = super._resolveColorValue(rawValue, fallback);
        // Canvas2D: match-light resolves to a shadow-DOM var that document-root
        // getComputedStyle can't reach. Substitute the cached concrete value.
        if (typeof result === 'string' && result.includes('--lcards-light-color-')) {
            return this._lightColorValue || fallback;
        }
        return result;
    }

    /**
     * Inject borders into an SVG element (works for both _componentSvg and component-based rendering)
     * @param {Element} svgElement - The SVG/HTML element to inject borders into
     * @param {number} width - Container width
     * @param {number} height - Container height
     * @private
     */
    _injectBordersToElement(svgElement, width, height) {
        if (!svgElement) return;

        const borderConfig = this._sliderStyle?.border;
        if (!borderConfig) return;

        // Find or create border-zone group
        let borderZone = svgElement.querySelector('#border-zone');
        if (!borderZone) {
            borderZone = document.createElementNS('http://www.w3.org/2000/svg', 'g');
            borderZone.setAttribute('id', 'border-zone');
            borderZone.setAttribute('data-zone', 'border');
            // Insert before track-zone so borders render behind content
            const trackZone = svgElement.querySelector('#track-zone');
            if (trackZone) {
                svgElement.insertBefore(borderZone, trackZone);
            } else {
                svgElement.appendChild(borderZone);
            }
        }

        // Clear existing borders ONLY for default component
        // Styled components have designed borders that should be preserved
        if (!this.config.component || this.config.component === 'default') {
            borderZone.innerHTML = '';
        } else {
            // For styled components, only remove dynamically added borders (not component's original content)
            const dynamicBorders = borderZone.querySelectorAll('[id^="border-"]');
            dynamicBorders.forEach(el => {
                // Only remove if it was added by slider card (has data-dynamic attribute or matches our IDs)
                if (el.hasAttribute('data-dynamic')) {
                    el.remove();
                }
            });
        }

        // Build all borders in a document fragment (atomic operation)
        const fragment = document.createDocumentFragment();

        // Helper to get border size (prefer .size, fall back to .width for legacy configs)
        const getBorderSize = (borderDef) => borderDef?.size ?? borderDef?.width ?? 0;

        // Left border
        const leftSize = getBorderSize(borderConfig.left);
        if (borderConfig.left?.enabled && leftSize > 0) {
            const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
            rect.setAttribute('id', 'border-left');
            rect.setAttribute('x', '0');
            rect.setAttribute('y', '0');
            rect.setAttribute('width', String(leftSize));
            rect.setAttribute('height', String(height));
            const leftColor = this._resolveStateBorderColor(borderConfig.left.color);
            const resolvedColor = ColorUtils.resolveCssVariable(String(leftColor ?? ''), '#000000', this);
            // Ensure color is valid before setting (never empty/null)
            rect.setAttribute('fill', String(resolvedColor || '#000000'));
            fragment.appendChild(rect);
        }

        // Top border
        const topSize = getBorderSize(borderConfig.top);
        if (borderConfig.top?.enabled && topSize > 0) {
            const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
            rect.setAttribute('id', 'border-top');
            rect.setAttribute('x', '0');
            rect.setAttribute('y', '0');
            rect.setAttribute('width', String(width));
            rect.setAttribute('height', String(topSize));
            const topColor = this._resolveStateBorderColor(borderConfig.top.color);
            const resolvedColor = ColorUtils.resolveCssVariable(String(topColor ?? ''), '#000000', this);
            // Ensure color is valid before setting (never empty/null)
            rect.setAttribute('fill', String(resolvedColor || '#000000'));
            fragment.appendChild(rect);
        }

        // Right border
        const rightSize = getBorderSize(borderConfig.right);
        if (borderConfig.right?.enabled && rightSize > 0) {
            const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
            rect.setAttribute('id', 'border-right');
            rect.setAttribute('x', String(width - rightSize));
            rect.setAttribute('y', '0');
            rect.setAttribute('width', String(rightSize));
            rect.setAttribute('height', String(height));
            const rightColor = this._resolveStateBorderColor(borderConfig.right.color);
            rect.setAttribute('fill', String(ColorUtils.resolveCssVariable(String(rightColor ?? ''), '#000000', this) || '#000000'));
            fragment.appendChild(rect);
        }

        // Bottom border
        const bottomSize = getBorderSize(borderConfig.bottom);
        if (borderConfig.bottom?.enabled && bottomSize > 0) {
            const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
            rect.setAttribute('id', 'border-bottom');
            rect.setAttribute('x', '0');
            rect.setAttribute('y', String(height - bottomSize));
            rect.setAttribute('width', String(width));
            rect.setAttribute('height', String(bottomSize));
            const bottomColor = this._resolveStateBorderColor(borderConfig.bottom.color);
            rect.setAttribute('fill', String(ColorUtils.resolveCssVariable(String(bottomColor ?? ''), '#000000', this) || '#000000'));
            fragment.appendChild(rect);
        }

        // Append all borders atomically in one operation
        borderZone.appendChild(fragment);
    }

    /**
     * Resolve a radius value to a pixel number.
     * Supports:
     *   - number         → returned directly
     *   - "12px"         → 12
     *   - "0.75rem"      → value * 16 (assumes 16px root font-size)
     *   - "var(--prop)"  → resolved via getComputedStyle on this element, then
     *                       recursed so the resolved string is also normalised
     *   - "var(--prop, 12px)" → fallback used when the property is unset / empty
     * @param {string|number} v - Raw radius value
     * @returns {number} Pixel value (0 when unresolvable)
     * @private
     */
    _resolveRadiusValue(v) {
        if (typeof v === 'number') return Math.max(0, v);
        if (typeof v !== 'string') return 0;

        const str = v.trim();
        if (!str) return 0;

        // CSS custom property: var(--foo) or var(--foo, fallback)
        if (str.startsWith('var(')) {
            // Extract property name
            const propMatch = str.match(/^var\(\s*(--[^,)\s]+)/);
            if (propMatch) {
                const propName = propMatch[1].trim();
                try {
                    const resolved = getComputedStyle(this).getPropertyValue(propName).trim();
                    if (resolved) {
                        return this._resolveRadiusValue(resolved);
                    }
                } catch (_e) { /* element not yet in DOM */ }
            }
            // No resolved value → try declared fallback: var(--prop, 12px)
            const fallbackMatch = str.match(/^var\([^,]+,\s*(.+)\)\s*$/);
            if (fallbackMatch) {
                return this._resolveRadiusValue(fallbackMatch[1].trim());
            }
            return 0;
        }

        // Pixel value: "12px"
        if (str.endsWith('px')) {
            const n = parseFloat(str);
            return isNaN(n) ? 0 : Math.max(0, n);
        }

        // Rem value: "0.75rem" — convert assuming 16px root
        if (str.endsWith('rem')) {
            const n = parseFloat(str);
            return isNaN(n) ? 0 : Math.max(0, n * 16);
        }

        // Plain number string: "12"
        const n = parseFloat(str);
        return isNaN(n) ? 0 : Math.max(0, n);
    }

    /**
     * Normalise style.border.radius into a per-corner object {tl, tr, br, bl}.
     * Each value is run through _resolveRadiusValue() so CSS variables and
     * 'px'/'rem' strings are supported alongside plain numbers.
     * Returns null when radius is absent or all corners resolve to zero.
     * @returns {{ tl: number, tr: number, br: number, bl: number } | null}
     * @private
     */
    _getCornerRadii() {
        const r = this._sliderStyle?.border?.radius;
        if (r === undefined || r === null) return null;

        if (typeof r === 'number' || typeof r === 'string') {
            const v = this._resolveRadiusValue(r);
            if (v <= 0) return null;
            return { tl: v, tr: v, br: v, bl: v };
        }
        if (typeof r === 'object') {
            const tl = this._resolveRadiusValue(r.top_left     ?? 0);
            const tr = this._resolveRadiusValue(r.top_right    ?? 0);
            const br = this._resolveRadiusValue(r.bottom_right ?? 0);
            const bl = this._resolveRadiusValue(r.bottom_left  ?? 0);
            if (tl === 0 && tr === 0 && br === 0 && bl === 0) return null;
            return { tl, tr, br, bl };
        }
        return null;
    }

    /**
     * Build an SVG path string for a rounded rectangle with independent per-corner radii.
     * Handles radius=0 corners as sharp corners (no arc emitted).
     * Each radius is clamped to min(w,h)/2 to prevent degenerate paths.
     * @param {number} x - Left edge offset
     * @param {number} y - Top edge offset
     * @param {number} w - Rectangle width
     * @param {number} h - Rectangle height
     * @param {{ tl: number, tr: number, br: number, bl: number }} radii - Per-corner radii
     * @returns {string} SVG path d-attribute value
     * @private
     */
    _buildRoundedRectPath(x, y, w, h, radii) {
        const maxR = Math.min(w, h) / 2;
        const tl = Math.min(Math.max(radii.tl || 0, 0), maxR);
        const tr = Math.min(Math.max(radii.tr || 0, 0), maxR);
        const br = Math.min(Math.max(radii.br || 0, 0), maxR);
        const bl = Math.min(Math.max(radii.bl || 0, 0), maxR);

        const parts = [];
        // Start just right of the top-left arc start point
        parts.push(`M ${x + tl},${y}`);
        // Top edge → into top-right corner
        parts.push(`H ${x + w - tr}`);
        if (tr > 0) parts.push(`A ${tr},${tr} 0 0,1 ${x + w},${y + tr}`);
        // Right edge → into bottom-right corner
        parts.push(`V ${y + h - br}`);
        if (br > 0) parts.push(`A ${br},${br} 0 0,1 ${x + w - br},${y + h}`);
        // Bottom edge → into bottom-left corner
        parts.push(`H ${x + bl}`);
        if (bl > 0) parts.push(`A ${bl},${bl} 0 0,1 ${x},${y + h - bl}`);
        // Left edge → into top-left corner
        parts.push(`V ${y + tl}`);
        if (tl > 0) parts.push(`A ${tl},${tl} 0 0,1 ${x + tl},${y}`);
        parts.push('Z');

        return parts.join(' ');
    }

    /**
     * Apply a corner clip-path to the SVG element so the rendered card has rounded corners.
     * Reads style.border.radius (uniform number or per-corner object).
     * Wraps all visible SVG content in a <g clip-path="..."> keyed to _cardGuid.
     * Safe to call on a freshly-parsed SVG shell (no stale-state issues).
     * Must be called AFTER all other injection methods so every element is clipped.
     * @param {Element} svgElement - Parsed SVG/HTML element root
     * @param {number} width  - Container width in pixels
     * @param {number} height - Container height in pixels
     * @private
     */
    _applyCornerClip(svgElement, width, height) {
        if (!svgElement) return;

        const radii = this._getCornerRadii();
        if (!radii) return;

        const clipId = `corner-clip-${this._cardGuid || 'slider'}`;

        // Ensure <defs> exists (insert as first child if absent)
        let defs = svgElement.querySelector('defs');
        if (!defs) {
            defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
            svgElement.insertBefore(defs, svgElement.firstChild);
        }

        // Build the clip-path element
        const clipPath = document.createElementNS('http://www.w3.org/2000/svg', 'clipPath');
        clipPath.setAttribute('id', clipId);
        const pathEl = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        pathEl.setAttribute('d', this._buildRoundedRectPath(0, 0, width, height, radii));
        clipPath.appendChild(pathEl);
        defs.appendChild(clipPath);

        // Wrap all non-defs children in a clip group
        // (SVG is freshly parsed so there is no pre-existing wrapper to remove)
        const wrapper = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        wrapper.setAttribute('id', 'card-clip-wrapper');
        wrapper.setAttribute('clip-path', `url(#${clipId})`);

        const children = Array.from(svgElement.childNodes).filter(n => n !== defs);
        children.forEach(child => wrapper.appendChild(child));
        svgElement.appendChild(wrapper);

        lcardsLog.trace(`[LCARdSSlider] Applied corner clip ${clipId} (tl=${radii.tl} tr=${radii.tr} br=${radii.br} bl=${radii.bl})`);
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
    /**
     * Calculate all named text zones from the border/margin configuration.
     * Each enabled border becomes a named zone (left/right/top/bottom).
     * The inner track area is always available as 'track'.
     * Used by _renderWithRenderer to populate this._zones for per-field routing.
     * @param {number} width - Slider width
     * @param {number} height - Slider height
     * @returns {{ borderZones: Object.<string,{x,y,width,height}>, trackZone: {x,y,width,height} }}
     * @private
     */
    _calculateZonesFromBorders(width, height) {
        const borderConfig = this._sliderStyle?.border;
        const getBorderSize = (borderDef) => borderDef?.size ?? borderDef?.width ?? 0;

        const leftSize   = borderConfig?.left?.enabled   ? getBorderSize(borderConfig.left)   : 0;
        const topSize    = borderConfig?.top?.enabled    ? getBorderSize(borderConfig.top)    : 0;
        const rightSize  = borderConfig?.right?.enabled  ? getBorderSize(borderConfig.right)  : 0;
        const bottomSize = borderConfig?.bottom?.enabled ? getBorderSize(borderConfig.bottom) : 0;

        // Build a named zone for each enabled border
        const borderZones = /** @type {Object.<string, {x:number, y:number, width:number, height:number}>} */ ({});
        if (leftSize   > 0) borderZones.left   = { x: 0,                   y: 0,                    width: leftSize,   height: height               };
        if (rightSize  > 0) borderZones.right  = { x: width - rightSize,   y: 0,                    width: rightSize,  height: height               };
        if (topSize    > 0) borderZones.top    = { x: 0,                   y: 0,                    width: width,      height: topSize              };
        if (bottomSize > 0) borderZones.bottom = { x: 0,                   y: height - bottomSize,  width: width,      height: bottomSize           };

        // Track zone: interior area inset by all enabled border sizes + track margins
        const margins = this._sliderStyle?.track?.margin || { top: 0, right: 0, bottom: 0, left: 0 };
        const trackZone = {
            x: leftSize   + (margins.left   || 0),
            y: topSize    + (margins.top    || 0),
            width:  width  - leftSize - rightSize  - (margins.left  || 0) - (margins.right  || 0),
            height: height - topSize  - bottomSize - (margins.top   || 0) - (margins.bottom || 0)
        };

        return { borderZones, trackZone };
    }

    /**
     * Override of LCARdSCard._calculateZones — populate this._zones for the slider.
     *
     * Called by _rebuildZones() (base-class) before text injection.
     * - Gets named zones from the active component's calculateZones().
     * - For the 'default' component, also registers the four enabled border zones
     *   and a border-aware track zone so text fields can be routed per-border.
     *
     * @param {number} width
     * @param {number} height
     * @protected
     */
    _calculateZones(width, height) {
        const componentName = this.config.component || 'default';
        const rawZones = this._componentCalculateZones
            ? this._componentCalculateZones(width, height, { style: this._sliderStyle, config: this.config })
            : null;

        if (!rawZones) {
            lcardsLog.warn('[LCARdSSlider] _calculateZones: component calculateZones() missing or returned null');
            return;
        }

        // Internal-only SVG structure zones — used by the component render() template but
        // not meaningful as user-targetable text zones (the border/track zones supersede them).
        const INTERNAL_ZONES = new Set(['text']);

        // Populate this._zones from component-provided zones
        for (const [zoneName, zoneData] of Object.entries(rawZones)) {
            if (!INTERNAL_ZONES.has(zoneName)) {
                this._zones.set(zoneName, { bounds: zoneData });
            }
        }

        // For Default component, also register named border zones + border-aware track zone
        if (componentName === 'default') {
            const { borderZones, trackZone } = this._calculateZonesFromBorders(width, height);
            for (const [name, bounds] of Object.entries(borderZones)) {
                this._zones.set(name, { bounds });
            }
            this._zones.set('track', { bounds: trackZone });
            lcardsLog.debug('[LCARdSSlider] _calculateZones: registered named text zones from borders:', { borderZones, track: trackZone });
        }

        lcardsLog.debug('[LCARdSSlider] _calculateZones: stored zones in Map:', this._zones);
    }

    // _injectTextFieldsToElement is defined on LCARdSButton and inherited by this class.

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
        const width = trackZone?.bounds?.width || (this._containerSize?.width ?? 200) - 20;
        const height = trackZone?.bounds?.height || 20;

        // Generate config hash for cache invalidation
        // Using concatenated string for efficiency instead of JSON.stringify
        const configHash = `${trackConfig?.count || 10}|${trackConfig?.gap || 4}|${trackConfig?.shape?.radius ?? 4}|` +
            `${trackConfig?.size?.height || 12}|${trackConfig?.gradient?.start || ''}|${trackConfig?.gradient?.end || ''}|` +
            `${orientation}|${width}|${height}|` +
            `${JSON.stringify(this._sliderStyle?.ranges || [])}|` +
            `${JSON.stringify(this._resolvedMarkerValues)}|` +
            `${JSON.stringify(this._resolvedRangeBounds)}|` +
            `${this._lightColorValue || ''}|` +
            `${window.lcards?.core?.themeManager?.getAlertMode?.() || 'green_alert'}|` +
            // Entity state + classified state bust the cache when state-aware range
            // colors resolve differently (e.g. { active: red, inactive: gray }).
            `${this._entity?.state ?? ''}|${this._getButtonState?.() ?? ''}`; // Bust cache on alert mode change

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
        let gradientStart = this._resolveColorValue(String(this._resolveStateValue({
            actualState: this._entity?.state,
            classifiedState: this._getButtonState(),
            colorConfig: trackConfig?.gradient?.start,
            fallback: 'theme:components.slider.pills.gradient.start'
        }) ?? ''));
        let gradientEnd = this._resolveColorValue(String(this._resolveStateValue({
            actualState: this._entity?.state,
            classifiedState: this._getButtonState(),
            colorConfig: trackConfig?.gradient?.end,
            fallback: 'theme:components.slider.pills.gradient.end'
        }) ?? ''));
        // Reverse gradient direction when fill is inverted
        if (this._invertFill) {
            [gradientStart, gradientEnd] = [gradientEnd, gradientStart];
        }
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
            // Calculate the value this pill represents (in display space).
            // When invert_fill is active, the pill at index 0 physically represents
            // the display-max end of the value scale (matching the swapped gradient
            // and the reversed fill direction from _updatePillOpacities), so the
            // range lookup must also be mirrored to colour the correct pills.
            const valuePercent = pillIndex / (pillCount - 1 || 1);
            const pillValue = this._invertFill
                ? displayMax - (valuePercent * displayRange)
                : displayMin + (valuePercent * displayRange);

            // Check if this value falls within any defined range
            if (ranges.length > 0) {
                // Use resolved bounds (supports templates for min/max) with fallback to raw config values.
                // FIX: Use inclusive upper boundary (<=) to match standard range notation.
                for (let ri = 0; ri < ranges.length; ri++) {
                    const r = ranges[ri];
                    if ('value' in r) continue; // Skip marker ranges
                    const bounds = this._resolvedRangeBounds?.[ri];
                    const rMin = bounds?.min ?? r.min;
                    const rMax = bounds?.max ?? r.max;
                    if (rMin === null || rMax === null || rMin === undefined || rMax === undefined) continue;
                    if (pillValue >= rMin && pillValue <= rMax) {
                        return this._resolveRangeColor(r.color);
                    }
                }
            }

            // Fallback: use global gradient (existing behavior)
            // Note: ColorUtils.mix(c1, c2, t) returns c2 at t=0, c1 at t=1
            // So we swap params: mix(end, start, t) to get start→end
            const t = pillIndex / (pillCount - 1 || 1);
            return ColorUtils.mix(gradientEnd, gradientStart, t);
        };

        /**
         * Return the unfilled opacity for a specific pill, honoring per-band opacity
         * overrides from style.ranges[].opacity. Falls back to globalDefault when no
         * band covers the pill's value position.
         */
        const getRangeOpacity = (pillIndex, pillCount, globalDefault) => {
            if (!ranges || ranges.length === 0) return globalDefault;
            const valuePercent = pillIndex / (pillCount - 1 || 1);
            const pillValue = this._invertFill
                ? displayMax - (valuePercent * displayRange)
                : displayMin + (valuePercent * displayRange);
            for (let ri = 0; ri < ranges.length; ri++) {
                const r = ranges[ri];
                if ('value' in r) continue; // Skip marker ranges
                if (r.opacity === undefined || r.opacity === null) continue;
                const bounds = this._resolvedRangeBounds?.[ri];
                const rMin = bounds?.min ?? r.min;
                const rMax = bounds?.max ?? r.max;
                if (rMin === null || rMax === null || rMin === undefined || rMax === undefined) continue;
                if (pillValue >= rMin && pillValue <= rMax) return r.opacity;
            }
            return globalDefault;
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

                // Recalculate pill height to perfectly fill the track (edge-to-edge)
                // This eliminates any remainder gap at the top
                pillHeight = (trackHeight - (gap * (count - 1))) / count;

                lcardsLog.debug(`[LCARdSSlider] Vertical auto-count calculation:`, {
                    trackHeight,
                    fixedPillHeight,
                    gap,
                    calculatedCount: count,
                    adjustedPillHeight: pillHeight
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

        // ====================================================================
        // Build marker pill map: pillIndex → { color, strokeEnabled, strokeWidth }
        // Computed after count is determined so each marker maps to its nearest pill.
        // ====================================================================
        const markerPillMap = new Map();
        (this._sliderStyle?.ranges || []).forEach((range, idx) => {
            if (!('value' in range)) return; // Band range, skip
            const resolvedValue = this._resolvedMarkerValues[idx];
            if (resolvedValue === null || resolvedValue === undefined) return;
            const valuePercent = displayRange > 0 ? (resolvedValue - displayMin) / displayRange : 0;
            const pillIdx = Math.max(0, Math.min(count - 1, Math.round(valuePercent * (count - 1))));
            const pillStyle = range.pill_style || {};
            const fillColor = this._resolveRangeColor(range.color || 'var(--lcars-text-light, #ffffff)');

            const rawLabelText = range.label?.text;
            const label = rawLabelText ? {
                text: String(this._resolveTemplateValue(rawLabelText) ?? rawLabelText),
                color: this._resolveColorValue(String(this._resolveStateValue({
                    actualState: this._entity?.state,
                    classifiedState: this._getButtonState(),
                    colorConfig: range.label.color,
                    fallback: 'theme:components.slider.indicator.label.color'
                }) ?? '')),
                fontSize: range.label.font_size ?? 14,
                offsetX: range.label.offset?.x,
                offsetY: range.label.offset?.y
            } : null;

            markerPillMap.set(pillIdx, {
                color: fillColor,
                strokeColor: pillStyle.stroke_color
                    ? this._resolveRangeColor(pillStyle.stroke_color, fillColor)
                    : fillColor,
                strokeEnabled: pillStyle.stroke !== false, // default true
                strokeWidth: pillStyle.stroke_width ?? 2,
                label
            });
        });

        // Calculate pill dimensions
        let pills = '';
        let defs = '<defs>';

        if (isVertical) {
            // Vertical: pills stack from bottom to top
            // Generate per-pill colors (interpolated across the range)
            defs += '</defs>';

            // Generate pills from bottom to top (edge-to-edge, gaps only between pills)
            for (let i = 0; i < count; i++) {
                const y = trackY + trackHeight - ((i + 1) * pillHeight) - (i * gap);
                const x = trackX; // Fill entire track width

                // NEW: Use range color if defined, else gradient
                const color = getPillColor(i, count);

                const markerInfoV = markerPillMap.get(i);
                const markerAttrsV = markerInfoV
                    ? ` data-marker-color="${markerInfoV.color}" data-marker-stroke="${markerInfoV.strokeEnabled ? markerInfoV.strokeWidth : 0}" data-marker-stroke-color="${markerInfoV.strokeColor}"`
                    : '';

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
                        opacity="${getRangeOpacity(i, count, unfilledOpacity)}"
                        data-unfilled-opacity="${getRangeOpacity(i, count, unfilledOpacity)}"
                        data-pill-index="${i}"${markerAttrsV} />
                `;

                if (markerInfoV?.label?.text) {
                    // Default: beside the pill, vertically centered
                    const labelX = x + pillWidth + (markerInfoV.label.offsetX ?? 6);
                    const labelY = y + (pillHeight / 2) + (markerInfoV.label.offsetY ?? 0);
                    pills += `
                        <text x="${labelX}" y="${labelY}"
                              font-size="${markerInfoV.label.fontSize}px" font-weight="400" font-family="var(--primary-font-family, Antonio, sans-serif)"
                              fill="${markerInfoV.label.color}"
                              text-anchor="start" dominant-baseline="middle">${escapeHtml(markerInfoV.label.text)}</text>
                    `;
                }
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

                const markerInfoH = markerPillMap.get(i);
                const markerAttrsH = markerInfoH
                    ? ` data-marker-color="${markerInfoH.color}" data-marker-stroke="${markerInfoH.strokeEnabled ? markerInfoH.strokeWidth : 0}" data-marker-stroke-color="${markerInfoH.strokeColor}"`
                    : '';

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
                        opacity="${getRangeOpacity(i, count, unfilledOpacity)}"
                        data-unfilled-opacity="${getRangeOpacity(i, count, unfilledOpacity)}"
                        data-pill-index="${i}"${markerAttrsH} />
                `;

                if (markerInfoH?.label?.text) {
                    // Default: above the pill, horizontally centered
                    const labelX = x + (pillWidth / 2) + (markerInfoH.label.offsetX ?? 0);
                    const labelY = y + (markerInfoH.label.offsetY ?? -6);
                    pills += `
                        <text x="${labelX}" y="${labelY}"
                              font-size="${markerInfoH.label.fontSize}px" font-weight="400" font-family="var(--primary-font-family, Antonio, sans-serif)"
                              fill="${markerInfoH.label.color}"
                              text-anchor="middle">${escapeHtml(markerInfoH.label.text)}</text>
                    `;
                }
            }
        }

        return defs + pills;
    }

    /**
     * Get indicator configuration if enabled, or null if disabled
     * Consolidates the duplicated config extraction logic
     * @param {Object} gaugeConfig - Gauge configuration object
     * @returns {Object|null} Indicator config object or null if disabled
     * @private
     */
    _getIndicatorConfig(gaugeConfig) {
        const indicatorConfig = gaugeConfig?.indicator;

        // `enabled` may be a literal boolean or a template string (resolved by
        // _preEvaluateStyleTemplates() at this point) — coerce the resolved value
        // to a real boolean. HA's Jinja2 templates can come back as the strings
        // "True"/"False", so a strict `=== true` check isn't enough here.
        let resolvedEnabled = this._resolveTemplateValue(indicatorConfig?.enabled);
        if (typeof resolvedEnabled === 'string') {
            resolvedEnabled = !['false', '0', ''].includes(resolvedEnabled.trim().toLowerCase());
        }

        // Check if indicator is enabled
        const indicatorEnabled = resolvedEnabled === true ||
                                (resolvedEnabled !== false &&
                                 (indicatorConfig?.type || indicatorConfig?.color || indicatorConfig?.size));

        if (!indicatorEnabled) return null;

        // Extract all config parameters
        return {
            type: indicatorConfig.type || 'line',
            color: this._resolveColorValue(String(this._resolveStateValue({
                actualState: this._entity?.state,
                classifiedState: this._getButtonState(),
                colorConfig: indicatorConfig.color,
                fallback: 'theme:components.slider.indicator.color'
            }) ?? '')),
            width: indicatorConfig.size?.width || 4,
            height: indicatorConfig.size?.height || 25,
            rotation: indicatorConfig.rotation || 0,
            offsetX: indicatorConfig.offset?.x || 0,
            offsetY: indicatorConfig.offset?.y || 0,
            borderEnabled: indicatorConfig.border?.enabled !== false,
            borderColor: this._resolveColorValue(String(this._resolveStateValue({
                actualState: this._entity?.state,
                classifiedState: this._getButtonState(),
                colorConfig: indicatorConfig.border?.color,
                fallback: 'theme:components.slider.indicator.border.color'
            }) ?? '')),
            borderWidth: indicatorConfig.border?.width || 1
        };
    }

    /**
     * Render indicator SVG at specified position
     * Supports three types: round (ellipse), triangle (polygon), line (rect)
     * All types support rotation and optional borders
     * @param {string} type - Indicator type: 'round', 'triangle', or 'line'
     * @param {number} centerX - X coordinate of indicator center
     * @param {number} centerY - Y coordinate of indicator center
     * @param {number} width - Indicator width
     * @param {number} height - Indicator height
     * @param {number} rotation - Rotation angle in degrees
     * @param {string} color - Fill color (already resolved)
     * @param {boolean} borderEnabled - Whether border is enabled
     * @param {string} borderColor - Border color (already resolved)
     * @param {number} borderWidth - Border width in pixels
     * @param {boolean} isVertical - Whether gauge is vertical (affects triangle orientation)
     * @returns {string} SVG markup for indicator
     * @private
     */
    _renderIndicator(type, centerX, centerY, width, height, rotation, color, borderEnabled, borderColor, borderWidth, isVertical = false) {
        if (type === 'round') {
            const rx = width / 2;
            const ry = height / 2;
            return `
                <ellipse cx="0" cy="0" rx="${rx}" ry="${ry}"
                         fill="${color}"
                         ${borderEnabled ? `stroke="${borderColor}" stroke-width="${borderWidth}"` : ''}
                         transform="translate(${centerX},${centerY}) rotate(${rotation})" />
            `;
        } else if (type === 'triangle') {
            // Triangle orientation differs for vertical vs horizontal
            let points;
            if (isVertical) {
                // Vertical gauge: triangle points right (default)
                const halfWidth = height / 2;  // For vertical, height is horizontal extent
                const halfHeight = width / 2;  // For vertical, width is vertical extent
                points = `${halfWidth},0 ${-halfWidth},${-halfHeight} ${-halfWidth},${halfHeight}`;
            } else {
                // Horizontal gauge: triangle points down (default)
                const halfWidth = width / 2;
                const halfHeight = height / 2;
                points = `0,${halfHeight} ${-halfWidth},${-halfHeight} ${halfWidth},${-halfHeight}`;
            }
            return `
                <polygon points="${points}"
                         fill="${color}"
                         ${borderEnabled ? `stroke="${borderColor}" stroke-width="${borderWidth}" stroke-linejoin="miter"` : ''}
                         transform="translate(${centerX},${centerY}) rotate(${rotation})" />
            `;
        } else {
            // Line indicator (rect)
            // For vertical gauge, swap dimensions (horizontal line)
            const rectWidth = isVertical ? height : width;
            const rectHeight = isVertical ? width : height;
            const halfWidth = rectWidth / 2;
            const halfHeight = rectHeight / 2;
            return `
                <rect x="${-halfWidth}" y="${-halfHeight}"
                      width="${rectWidth}" height="${rectHeight}"
                      fill="${color}"
                      ${borderEnabled ? `stroke="${borderColor}" stroke-width="${borderWidth}"` : ''}
                      rx="1" ry="1"
                      transform="translate(${centerX},${centerY}) rotate(${rotation})" />
            `;
        }
    }

    /**
     * Generate gauge SVG elements (ruler style with progress bar)
     * Design: Transparent ruler with ticks/labels and a thin progress bar
     * @param {number} trackWidth - Width of the gauge
     * @param {number} trackHeight - Height of the gauge
     * @param {boolean} skipProgressBar - If true, don't render the progress bar (for components with separate progress zones)
     * @private
     */
    _generateGaugeSVG(trackWidth, trackHeight, skipProgressBar = false, skipRanges = false) {
        const gaugeConfig = this._sliderStyle?.gauge;
        const orientation = this._sliderStyle?.track?.orientation || 'horizontal';
        const isVertical = orientation === 'vertical';

        // Config hash for memoization (include entity state for reactive colors)
        const configHash = JSON.stringify({
            gaugeConfig,
            width: trackWidth,
            height: trackHeight,
            orientation,
            value: this._sliderValue,
            ranges: skipRanges ? [] : (this._sliderStyle?.ranges || []),
            skipRanges,
            entityState: this._entity?.state,  // Include state for reactive tick colors
            lightColor: this._lightColorValue || null,  // Bust cache when light colour changes
            alertMode: window.lcards?.core?.themeManager?.getAlertMode?.() || 'green_alert',  // Bust cache on alert mode change
            controlMin: this._controlConfig.min,  // Bust cache when control range changes (affects bg extent)
            controlMax: this._controlConfig.max,
            displayMin: this._displayConfig.min,
            displayMax: this._displayConfig.max,
            classifiedState: this._getButtonState?.() ?? '',
            resolvedMarkerValues: this._resolvedMarkerValues,
            resolvedRangeBounds: this._resolvedRangeBounds
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
        // Range backgrounds (only if not using separate range zone)
        // ====================================================================
        const ranges = skipRanges ? [] : (this._sliderStyle?.ranges || []);
        if (ranges.length > 0) {
            lcardsLog.debug(`[LCARdSSlider] Rendering ${ranges.length} range backgrounds in gauge track`);

            ranges.forEach((rangeConfig, idx) => {
                if ('value' in rangeConfig) return; // Marker ranges are handled separately
                const bounds = this._resolvedRangeBounds?.[idx];
                const rangeMin = bounds?.min ?? rangeConfig.min;
                const rangeMax = bounds?.max ?? rangeConfig.max;
                if (rangeMin === null || rangeMin === undefined || rangeMax === null || rangeMax === undefined) return;
                const rangeColor = this._resolveRangeColor(rangeConfig.color);
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
                              opacity="${rangeOpacity}" />
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
                              opacity="${rangeOpacity}" />
                    `;
                }
            });
        }

        // ====================================================================
        // Tick marks and labels
        // ====================================================================

        // Major tick configuration
        const majorEnabled = tickConfig?.major?.enabled !== false;
        const majorInterval = tickConfig?.major?.interval || 10; // Value units (not percentage)
        const majorColor = this._resolveColorValue(String(this._resolveStateValue({
            actualState: this._entity?.state,
            classifiedState: this._getButtonState(),
            colorConfig: tickConfig?.major?.color,
            fallback: 'theme:components.slider.gauge.tick.major.color.default'
        }) ?? ''));
        const majorHeight = tickConfig?.major?.height; // undefined = full height
        const majorStrokeWidth = tickConfig?.major?.width || 2;

        // Minor tick configuration
        const minorEnabled = tickConfig?.minor?.enabled !== false;
        const minorInterval = tickConfig?.minor?.interval || 2; // Value units (not percentage)
        const minorColor = this._resolveColorValue(String(this._resolveStateValue({
            actualState: this._entity?.state,
            classifiedState: this._getButtonState(),
            colorConfig: tickConfig?.minor?.color,
            fallback: 'theme:components.slider.gauge.tick.minor.color.default'
        }) ?? ''));
        const minorHeight = tickConfig?.minor?.height || 10;
        const minorStrokeWidth = tickConfig?.minor?.width || 1;

        // Label configuration
        const labelsEnabled = labelConfig?.enabled !== false;
        // style.gauge.scale.labels.unit takes priority over entity unit (via _displayConfig.unit).
        // style.gauge.scale.labels.show_unit: false suppresses unit entirely.
        const labelUnit = labelConfig?.show_unit !== false
            ? (labelConfig?.unit ?? this._displayConfig.unit ?? '')
            : '';
        const labelPadding = labelConfig?.padding || 3; // Padding between tick and label

        // Label color - state-aware resolution for tick labels
        const tickLabelColor = this._resolveColorValue(String(this._resolveStateValue({
            actualState: this._entity?.state,
            classifiedState: this._getButtonState(),
            colorConfig: labelConfig?.color,
            fallback: 'theme:components.slider.gauge.label.color.default'
        }) ?? ''));

        // Progress bar configuration
        const progressConfig = gaugeConfig?.progress_bar;
        const progressColor = this._resolveColorValue(String(this._resolveStateValue({
            actualState: this._entity?.state,
            classifiedState: this._getButtonState(),
            colorConfig: progressConfig?.color,
            fallback: 'theme:components.slider.gauge.progress_bar.color.default'
        }) ?? ''));
        const progressHeight = progressConfig?.height || 12;
        // Fill bar radius: uniform number (default 2) or per-end { start, end } object
        const _prRaw = progressConfig?.radius;
        const pr = (_prRaw !== null && typeof _prRaw === 'object')
            ? { start: _prRaw.start ?? 2, end: _prRaw.end ?? 2 }
            : { start: (_prRaw ?? 2), end: (_prRaw ?? 2) };
        // Background radius: independently configurable, defaults to fill radius
        const _bgRRaw = progressConfig?.background?.radius ?? progressConfig?.radius;
        const bgPr = (_bgRRaw !== null && typeof _bgRRaw === 'object')
            ? { start: _bgRRaw.start ?? 2, end: _bgRRaw.end ?? 2 }
            : { start: (_bgRRaw ?? 2), end: (_bgRRaw ?? 2) };
        // Helper: rect (uniform) or path (per-end). isH=true: left=start,right=end; false: bottom=start,top=end
        const pbRect = (rad, px, py, pw, ph, isH, fill, close = '') => {
            if (rad.start === rad.end) {
                return `<rect x="${px}" y="${py}" width="${pw}" height="${ph}" fill="${fill}" rx="${rad.start}" ry="${rad.start}" ${close}/>`;
            }
            const corners = isH
                ? { tl: rad.start, tr: rad.end,   br: rad.end,   bl: rad.start }
                : { tl: rad.end,   tr: rad.end,   br: rad.start, bl: rad.start };
            return `<path d="${this._buildRoundedRectPath(px, py, pw, ph, corners)}" fill="${fill}" ${close}/>`;
        };
        const pbPath   = (px, py, pw, ph, isH, fill) => pbRect(pr,   px, py, pw, ph, isH, fill);
        const bgPbPath = (px, py, pw, ph, isH, fill) => pbRect(bgPr, px, py, pw, ph, isH, fill);
        const progressBgColor = this._resolveColorValue(String(this._resolveStateValue({
            actualState: this._entity?.state,
            classifiedState: this._getButtonState(),
            colorConfig: progressConfig?.background?.color,
            fallback: ''
        }) ?? ''));
        const progressBgThickness = progressConfig?.background?.height ?? progressHeight;
        // Background track extent — explicit background.min/max override control-range clamping
        const _dispMin = this._displayConfig.min;
        const _dispMax = this._displayConfig.max;
        const _dispRange = _dispMax - _dispMin;
        const _ctrlMin = progressConfig?.background?.min ?? this._controlConfig.min;
        const _ctrlMax = progressConfig?.background?.max ?? this._controlConfig.max;
        const bgStartFrac = _dispRange > 0 ? Math.max(0, Math.min(1, (_ctrlMin - _dispMin) / _dispRange)) : 0;
        const bgEndFrac   = _dispRange > 0 ? Math.max(0, Math.min(1, (_ctrlMax - _dispMin) / _dispRange)) : 1;
        lcardsLog.debug('[LCARdSSlider] _generateGaugeSVG() background extent', {
            bgMin: _ctrlMin, bgMax: _ctrlMax, bgStartFrac, bgEndFrac,
            controlMin: this._controlConfig.min, controlMax: this._controlConfig.max,
            displayMin: _dispMin, displayMax: _dispMax
        });

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
                    // Position based on normal iteration (left to right)
                    const positionValue = min + (i * majorInterval);
                    if (positionValue > max) break;

                    // Display value: reversed when inverted (show high→low instead of low→high)
                    const displayValue = this._invertFill ? (max - (positionValue - min)) : positionValue;

                    // Calculate x position as percentage of track width
                    const percent = ((positionValue - min) / range) * 100;
                    let x = (percent / 100) * trackWidth;

                    const edgeClearance = 5; // pixels
                    const isFirstTick = x < edgeClearance;

                    // Inset edge ticks so they're fully visible
                    if (isFirstTick) {
                        x = majorStrokeWidth / 2;
                    }
                    const isAtRightEdge = Math.abs(x - trackWidth) < 0.5; // floating point tolerance
                    if (isAtRightEdge) {
                        x = trackWidth - (majorStrokeWidth / 2);
                    }

                    // Major tick - full height or custom height
                    const tickY2 = majorHeight !== undefined ? majorHeight : trackHeight;
                    svg += `
                    <line x1="${x}" y1="0" x2="${x}" y2="${tickY2}"
                          stroke="${majorColor}" stroke-width="${majorStrokeWidth}" />
                `;

                    // Label - positioned near bottom with proper spacing
                    if (labelsEnabled && !isFirstTick) {
                        // Estimate label width (rough approximation: ~8px per digit + unit)
                        const labelText = Math.round(displayValue) + labelUnit;
                        const estimatedLabelWidth = labelText.length * 8;

                        // Check if label would extend beyond track bounds
                        // For text-anchor="end", text extends LEFT of x position
                        const labelLeftEdge = x - estimatedLabelWidth - labelPadding;

                        // Ensure label doesn't extend past left edge
                        const shouldRenderLabel = labelLeftEdge >= edgeClearance;

                        if (shouldRenderLabel) {
                            svg += `
                        <text x="${x}" y="${labelY}"
                              font-size="${labelFontSize}px" font-weight="400" font-family="var(--primary-font-family, Antonio, sans-serif)"
                              fill="${tickLabelColor}"
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
                    // Position based on normal iteration
                    const positionValue = min + (i * minorInterval);
                    if (positionValue > max) break;

                    // Skip if this is a major tick position
                    const offsetFromMin = positionValue - min;
                    if (offsetFromMin % majorInterval === 0) continue;

                    // Calculate x position as percentage of track width
                    const percent = ((positionValue - min) / range) * 100;
                    const x = (percent / 100) * trackWidth;

                    // Minor tick - from top to minorHeight
                    svg += `
                        <line x1="${x}" y1="0" x2="${x}" y2="${minorHeight}"
                              stroke="${minorColor}" stroke-width="${minorStrokeWidth}" />
                    `;
                }
            }

            // Calculate progress bar dimensions (needed for indicator even if bar is skipped)
            // Apply fill inversion if configured
            let progressWidth = valuePercent * trackWidth;
            let progressX = 0;

            if (this._invertFill) {
                // Fill from right
                progressX = trackWidth - progressWidth;
            }

            // Draw progress bar (at bottom of minor ticks, extends based on value)
            if (!skipProgressBar) {
                // Background track — extent clamped to control range (or background.min/max), optional custom thickness
                if (progressBgColor) {
                    const bgX = bgStartFrac * trackWidth;
                    const bgW = (bgEndFrac - bgStartFrac) * trackWidth;
                    const bgYH = progressY + (progressHeight - progressBgThickness) / 2;
                    svg += bgPbPath(bgX, bgYH, bgW, progressBgThickness, true, progressBgColor);
                }
                svg += pbPath(progressX, progressY, progressWidth, progressHeight, true, progressColor);
            }

        } else {
            // === VERTICAL GAUGE ===
            // Vertical gauges have horizontal tick marks and fill from bottom to top

            // For vertical gauges, progress bar width (not height like horizontal)
            const progressBarWidth = progressConfig?.width || progressConfig?.height || 12;

            // Draw major ticks (horizontal lines) and labels
            if (majorEnabled) {
                const tickCount = Math.floor(range / majorInterval) + 1;

                for (let i = 0; i < tickCount; i++) {
                    // Position based on normal iteration (bottom to top)
                    const positionValue = min + (i * majorInterval);
                    if (positionValue > max) break;

                    // Display value: reversed when inverted (show high→low instead of low→high)
                    const displayValue = this._invertFill ? (max - (positionValue - min)) : positionValue;

                    // Calculate y position as percentage of track height
                    // INVERTED: 0% = top (max value), 100% = bottom (min value)
                    const percent = 100 - (((positionValue - min) / range) * 100);
                    let y = (percent / 100) * trackHeight;

                    const edgeClearance = 5; // pixels
                    const isBottomTick = y > (trackHeight - edgeClearance); // bottom tick (min value)

                    // Inset edge ticks so they're fully visible
                    if (isBottomTick) {
                        y = trackHeight - (majorStrokeWidth / 2);
                    }
                    const isAtTopEdge = y < 0.5; // floating point tolerance
                    if (isAtTopEdge) {
                        y = majorStrokeWidth / 2;
                    }

                    // Determine tick width (full width or custom)
                    const tickX2 = majorHeight !== undefined ? majorHeight : trackWidth;

                    // Draw horizontal tick line
                    svg += `
                    <line x1="0" y1="${y}" x2="${tickX2}" y2="${y}"
                          stroke="${majorColor}" stroke-width="${majorStrokeWidth}" />
                `;

                    // Draw label if enabled (to the right, below the line)
                    if (labelsEnabled && !isBottomTick) {
                        const labelText = `${displayValue}${labelUnit}`;
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
                        <text x="${labelX}" y="${y}" font-size="${labelFontSizeVertical}px" font-weight="400" font-family="var(--primary-font-family, Antonio, sans-serif)"
                              fill="${tickLabelColor}" text-anchor="end"
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
                    // Position based on normal iteration
                    const positionValue = min + (i * minorInterval);
                    if (positionValue > max) break;

                    // Skip if this position has a major tick
                    const offsetFromMin = positionValue - min;
                    if (offsetFromMin % majorInterval === 0) continue;

                    // Calculate y position (inverted like major ticks)
                    const percent = 100 - (((positionValue - min) / range) * 100);
                    const y = (percent / 100) * trackHeight;

                    // Minor tick - short horizontal line from left edge
                    svg += `
                        <line x1="0" y1="${y}" x2="${minorHeight}" y2="${y}"
                              stroke="${minorColor}" stroke-width="${minorStrokeWidth}" />
                    `;
                }
            }

            // Define progress bar position variables (needed for indicator even if progress bar is skipped)
            const progressX = minorHeight;
            const progressBarHeight = valuePercent * trackHeight;
            let progressY = trackHeight - progressBarHeight; // Start from bottom

            // Apply fill inversion if configured
            if (this._invertFill) {
                // Fill from top
                progressY = 0;
            }

            // Draw progress bar (fills from bottom up) - skip if component has separate progress zone
            if (!skipProgressBar) {
                // Background track — vertical axis: y=0=top=max, y=height=bottom=min
                if (progressBgColor) {
                    const bgYV = (1 - bgEndFrac) * trackHeight;
                    const bgHV = (bgEndFrac - bgStartFrac) * trackHeight;
                    const bgXV = progressX + (progressBarWidth - progressBgThickness) / 2;
                    svg += bgPbPath(bgXV, bgYV, progressBgThickness, bgHV, false, progressBgColor);
                }
                svg += pbPath(progressX, progressY, progressBarWidth, progressBarHeight, false, progressColor);
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
     * Update dynamic elements without regenerating structure
     * @private
     */
    _updateDynamicElements() {
        if (!this.shadowRoot) return;

        if (this._mode === 'pills') {
            this._updatePillOpacities();
        }
        // Note: Gauge mode uses full re-render, no incremental updates needed
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

            // Per-pill unfilled opacity: band ranges may specify their own opacity value.
            // The SVG rect has data-unfilled-opacity set at generation time; fall back to
            // the global trackConfig unfilled opacity when the attribute is absent.
            const pillUnfilledOpacity = parseFloat(pill.getAttribute('data-unfilled-opacity') || '') || unfilledOpacity;

            // Determine if this pill should be fully filled (not including transition pill)
            let isFilled;

            if (this._invertFill) {
                // Fill from opposite end (right/top)
                // Fully filled: last Math.floor(fillCount) pills
                isFilled = index >= pills.length - Math.floor(fillCount);
            } else {
                // Fill from start (left/bottom)
                // Fully filled: first Math.floor(fillCount) pills
                isFilled = index < Math.floor(fillCount);
            }

            if (isFilled) {
                // Fully filled
                opacity = filledOpacity;
            } else if (fillCount % 1 !== 0) {
                // Partially filled (smooth transition)
                if (this._invertFill) {
                    // For inverted: transition pill is at the left boundary of filled region
                    const transitionPillIndex = pills.length - Math.ceil(fillCount);
                    if (index === transitionPillIndex) {
                        opacity = pillUnfilledOpacity + ((fillCount % 1) * (filledOpacity - pillUnfilledOpacity));
                    } else {
                        opacity = pillUnfilledOpacity;
                    }
                } else {
                    // For normal: transition pill is at the right boundary of filled region
                    if (index === Math.floor(fillCount)) {
                        opacity = pillUnfilledOpacity + ((fillCount % 1) * (filledOpacity - pillUnfilledOpacity));
                    } else {
                        opacity = pillUnfilledOpacity;
                    }
                }
            } else {
                // Unfilled
                opacity = pillUnfilledOpacity;
            }
            pill.setAttribute('opacity', opacity);
        });

        // Apply marker pill styling: full opacity, marker colour, outline stroke.
        // Runs after the opacity loop so markers always override fill/opacity
        // regardless of where they fall in the filled or unfilled zone.
        pills.forEach((pill) => {
            const markerColor = pill.getAttribute('data-marker-color');
            if (!markerColor) return;
            const strokeWidth = parseFloat(pill.getAttribute('data-marker-stroke') || '0');
            const strokeColor = pill.getAttribute('data-marker-stroke-color') || markerColor;
            pill.setAttribute('opacity', '1');
            pill.setAttribute('fill', markerColor);
            if (strokeWidth > 0) {
                pill.setAttribute('stroke', strokeColor);
                pill.setAttribute('stroke-width', String(strokeWidth));
            }
        });
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
     * Subscribe to alert mode changes via ThemeManager.
     *
     * ThemeManager fires its subscribers AFTER CSS variables have been written,
     * the token resolver cache has been cleared, and currentAlertMode has been
     * updated — so it is safe to call requestUpdate() immediately from the
     * callback without any animation-frame deferral.
     *
     * Previous approach subscribed to the HelperManager's alert_mode helper
     * state change, which fired BEFORE CSS variables were committed, causing
     * the slider to re-render with stale resolved colours ("one mode behind").
     * @private
     */
    _subscribeToAlertMode() {
        this._alertModeUnsubscribe?.();
        this._alertModeUnsubscribe = null;

        const themeManager = window.lcards?.core?.themeManager;
        if (themeManager?.subscribeToAlertMode) {
            this._alertModeUnsubscribe = themeManager.subscribeToAlertMode(
                this._handleAlertModeChange.bind(this)
            );
            lcardsLog.debug('[LCARdSSlider] Subscribed to ThemeManager alert mode changes');
        } else {
            lcardsLog.warn('[LCARdSSlider] ThemeManager.subscribeToAlertMode not available — alert mode subscription skipped');
        }
    }

    /**
     * Called when alert mode changes (red/yellow/blue/green/gray).
     * Busts the memoization cache and triggers a full re-render so all
     * baked-in resolved colours (pills gradient, gauge ticks, etc.) are
     * recomputed from the updated CSS variables.
     *
     * This callback is invoked by ThemeManager AFTER:
     *   - CSS variables (`--lcars-*` and `--lcards-*`) have been written
     *   - `currentAlertMode` has been updated
     *   - the ThemeTokenResolver cache has been cleared
     *
     * Because all state is already consistent when we are called, it is
     * correct (and optimal) to call requestUpdate() immediately — no
     * animation-frame deferral is required.
     *
     * @param {string} newMode
     * @private
     */
    _handleAlertModeChange(newMode) {
        lcardsLog.debug(`[LCARdSSlider] Alert mode changed to ${newMode} — invalidating memoization cache`);
        this._invalidateMemoization();
        this.requestUpdate();
    }

    /**
     * Handle slider input (while dragging)
     * @private
     */
    _handleSliderInput(event) {
                if (!this._isHorizontalDragging) {
            this._isHorizontalDragging = true;
            this._playSound('slider_drag_start');
        } else {
            this._playSound('slider_change');
        }

        let value = parseFloat(event.target.value);
        const rawValue = value;

        // For sliders with inverted fill, flip the value
        // Inverted fill means the slider physical movement is opposite to the visual fill
        if (this._invertFill) {
            const { min, max } = this._controlConfig;
            value = max - value + min;
        }

        const isVertical = this._sliderStyle?.track?.orientation === 'vertical';
        lcardsLog.debug(`[LCARdSSlider] Input event`, {
            raw: rawValue,
            processed: value,
            current: this._sliderValue,
            vertical: isVertical,
            inverted: this._invertFill,
            min: this._controlConfig.min,
            max: this._controlConfig.max,
            inputMin: event.target.min,
            inputMax: event.target.max
        });
        this._sliderValue = value;

        // Update visuals immediately
        this._updateDynamicElements();
    }

    /**
     * Handle slider change (on release)
     * @private
     */
    async _handleSliderChange(event) {
        this._playSound('slider_drag_end');
        this._isHorizontalDragging = false;

        let value = parseFloat(event.target.value);
        const rawValue = value;

        // For sliders with inverted fill, flip the value
        if (this._invertFill) {
            const { min, max } = this._controlConfig;
            value = max - value + min;
        }

        lcardsLog.debug(`[LCARdSSlider] Change event`, {
            raw: rawValue,
            processed: value,
            domain: this._domain,
            entity: this.config.entity
        });

        // Call appropriate service based on entity domain
        await this._setEntityValue(value);
    }

    /**
     * Handle vertical slider mouse down
     * @private
     */
    _handleVerticalSliderMouseDown(event) {
        event.preventDefault();
        this._isDragging = true;
        this._verticalSliderOverlay = event.currentTarget; // Store reference
        this._playSound('slider_drag_start');
        this._updateVerticalSliderValue(event);

        // Add global listeners for drag
        window.addEventListener('mousemove', this._handleVerticalSliderMouseMove);
        window.addEventListener('mouseup', this._handleVerticalSliderMouseUp);
    }

    /**
     * Handle vertical slider mouse move
     * @private
     */
    _handleVerticalSliderMouseMove(event) {
        if (!this._isDragging) return;
        event.preventDefault();
        this._playSound('slider_change');
        this._updateVerticalSliderValue(event);
    }

    /**
     * Handle vertical slider mouse up
     * @private
     */
    async _handleVerticalSliderMouseUp(event) {
        if (!this._isDragging) return;
        this._isDragging = false;

        // Remove global listeners
        window.removeEventListener('mousemove', this._handleVerticalSliderMouseMove);
        window.removeEventListener('mouseup', this._handleVerticalSliderMouseUp);

        this._playSound('slider_drag_end');

        // Call service to update entity
        await this._setEntityValue(this._sliderValue);
    }

    /**
     * Handle vertical slider touch start
     * @private
     */
    _handleVerticalSliderTouchStart(event) {
        event.preventDefault();
        this._isDragging = true;
        this._verticalSliderOverlay = event.currentTarget; // Store reference
        this._playSound('slider_drag_start');
        this._updateVerticalSliderValueFromTouch(event);

        // Add global listeners for drag
        window.addEventListener('touchmove', this._handleVerticalSliderTouchMove, { passive: false });
        window.addEventListener('touchend', this._handleVerticalSliderTouchEnd);
    }

    /**
     * Handle vertical slider touch move
     * @private
     */
    _handleVerticalSliderTouchMove(event) {
        if (!this._isDragging) return;
        event.preventDefault();
        this._playSound('slider_change');
        this._updateVerticalSliderValueFromTouch(event);
    }

    /**
     * Handle vertical slider touch end
     * @private
     */
    async _handleVerticalSliderTouchEnd(event) {
        if (!this._isDragging) return;
        this._isDragging = false;

        // Remove global listeners
        window.removeEventListener('touchmove', this._handleVerticalSliderTouchMove);
        window.removeEventListener('touchend', this._handleVerticalSliderTouchEnd);

        this._playSound('slider_drag_end');

        // Call service to update entity
        await this._setEntityValue(this._sliderValue);
    }

    /**
     * Update vertical slider value from mouse event
     * @private
     */
    _updateVerticalSliderValue(event) {
        if (!this._verticalSliderOverlay) return;
        const rect = this._verticalSliderOverlay.getBoundingClientRect();

        // Calculate relative position (0 = top, 1 = bottom)
        const relativeY = (event.clientY - rect.top) / rect.height;

        // The overlay div is constrained to the control-range band of the track,
        // so relativeY 0→1 maps directly to ctrlMax→ctrlMin (no display range math needed).
        const controlMin = this._controlConfig.min;
        const controlMax = this._controlConfig.max;
        let value = this._invertFill
            ? controlMin + (relativeY * (controlMax - controlMin))
            : controlMax - (relativeY * (controlMax - controlMin));

        // Step snap and safety clamp
        const step = this._controlConfig.step || 1;
        value = Math.max(controlMin, Math.min(controlMax, Math.round(value / step) * step));

        lcardsLog.debug(`[LCARdSSlider] Vertical slider input`, {
            mouseY: event.clientY,
            rectTop: rect.top,
            rectHeight: rect.height,
            relativeY,
            value,
            controlMin,
            controlMax
        });

        this._sliderValue = value;
        this._updateDynamicElements();
        this.requestUpdate();
    }

    /**
     * Update vertical slider value from touch event
     * @private
     */
    _updateVerticalSliderValueFromTouch(event) {
        if (!event.touches || event.touches.length === 0) return;
        if (!this._verticalSliderOverlay) return;
        const rect = this._verticalSliderOverlay.getBoundingClientRect();
        const touch = event.touches[0];

        // Calculate relative position (0 = top, 1 = bottom)
        const relativeY = (touch.clientY - rect.top) / rect.height;

        // The overlay div is constrained to the control-range band of the track,
        // so relativeY 0→1 maps directly to ctrlMax→ctrlMin (no display range math needed).
        const controlMin = this._controlConfig.min;
        const controlMax = this._controlConfig.max;
        let value = this._invertFill
            ? controlMin + (relativeY * (controlMax - controlMin))
            : controlMax - (relativeY * (controlMax - controlMin));

        // Step snap and safety clamp
        const step = this._controlConfig.step || 1;
        value = Math.max(controlMin, Math.min(controlMax, Math.round(value / step) * step));

        this._sliderValue = value;
        this._updateDynamicElements();
        this.requestUpdate();
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

        // Reverse value inversion before sending to entity
        let entityValue = value;
        if (this._controlConfig.invertValue) {
            const { min, max } = this._controlConfig;
            entityValue = max - value + min;
        }

        try {
            if (domain === 'light') {
                // Convert value to 0-255 brightness range
                // The slider value represents a percentage (e.g., min=10, max=50 means 10%-50% brightness)
                // Convert the percentage directly to 0-255 range
                const brightness = Math.round((entityValue / 100) * 255);

                await this.hass.callService('light', 'turn_on', {
                    entity_id: entityId,
                    brightness: brightness
                });
            } else if (domain === 'cover') {
                await this.hass.callService('cover', 'set_cover_position', {
                    entity_id: entityId,
                    position: entityValue
                });
            } else if (domain === 'fan') {
                await this.hass.callService('fan', 'set_percentage', {
                    entity_id: entityId,
                    percentage: entityValue
                });
            } else if (domain === 'input_number' || domain === 'number') {
                await this.hass.callService(domain, 'set_value', {
                    entity_id: entityId,
                    value: entityValue
                });
            } else if (domain === 'climate') {
                await this.hass.callService('climate', 'set_temperature', {
                    entity_id: entityId,
                    temperature: entityValue
                });
            } else if (domain === 'media_player') {
                await this.hass.callService('media_player', 'volume_set', {
                    entity_id: entityId,
                    volume_level: entityValue / 100
                });
            } else if (domain === 'humidifier') {
                await this.hass.callService('humidifier', 'set_humidity', {
                    entity_id: entityId,
                    humidity: Math.round(entityValue)
                });
            } else if (domain === 'water_heater') {
                await this.hass.callService('water_heater', 'set_temperature', {
                    entity_id: entityId,
                    temperature: entityValue
                });
            } else if (domain === 'valve') {
                await this.hass.callService('valve', 'set_valve_position', {
                    entity_id: entityId,
                    position: Math.round(entityValue)
                });
            } else {
                lcardsLog.warn(`[LCARdSSlider] Unsupported domain for value setting: ${domain}`);
            }

            lcardsLog.debug(`[LCARdSSlider] Set ${entityId} to ${entityValue} (slider: ${value}, inverted: ${this._controlConfig.invertValue})`);

        } catch (error) {
            lcardsLog.error(`[LCARdSSlider] Service call failed:`, error);
        }
    }

    /**
     * Render using component's render function (new architecture)
     * @param {number} width - Container width
     * @param {number} height - Container height
     * @returns {TemplateResult} Rendered template
     * @private
     */
    _renderWithRenderer(width, height, containerStyle = '') {
        lcardsLog.debug(`[LCARdSSlider] _renderWithRenderer(${width}, ${height})`);

        // Step 1: Get raw component zones for the render pipeline.
        // These are the unadjusted zone bounds returned by the component — Step 1.5 will
        // apply border/margin insets to them exactly once.
        const componentName = this.config.component || 'default';
        const zones = this._componentCalculateZones
            ? this._componentCalculateZones(width, height, { style: this._sliderStyle, config: this.config })
            : null;

        if (!zones) {
            lcardsLog.error('[LCARdSSlider] Component calculateZones() missing or returned null');
            return html`<div class="slider-error">Component missing calculateZones()</div>`;
        }

        // Step 1.25: Rebuild this._zones via the base-class pipeline for text-field routing.
        // this._zones includes named border zones (left/right/top/bottom) and a border-aware
        // track zone — used by _injectTextFieldsToElement, NOT by the render pipeline below.
        // Keeping these separate avoids double-applying border insets to the render zones.
        this._rebuildZones(width, height);

        lcardsLog.debug('[LCARdSSlider] Stored component zones in _zones Map:', this._zones);

        // Step 1.5: Adjust zones to account for borders and margins (inset content from edges)
        // NOTE: Skip for 'shaped' component — it manages its own geometry entirely through
        // style.shaped.text_bands (left/right/top/bottom band sizes).  Applying additional
        // border/margin insets on top of the text_band offset would double-shift the track.
        const borderConfig = this._sliderStyle?.border;
        // Track margins are under style.track.margin
        const margins = this._sliderStyle?.track?.margin || { top: 0, right: 0, bottom: 0, left: 0 };

        // Calculate total insets (borders + margins)
        const getBorderSize = (borderDef) => borderDef?.size ?? borderDef?.width ?? 0;
        const leftInset = (borderConfig?.left?.enabled ? getBorderSize(borderConfig.left) : 0) + (margins.left || 0);
        const topInset = (borderConfig?.top?.enabled ? getBorderSize(borderConfig.top) : 0) + (margins.top || 0);
        const rightInset = (borderConfig?.right?.enabled ? getBorderSize(borderConfig.right) : 0) + (margins.right || 0);
        const bottomInset = (borderConfig?.bottom?.enabled ? getBorderSize(borderConfig.bottom) : 0) + (margins.bottom || 0);

        if (componentName !== 'shaped' && (leftInset > 0 || topInset > 0 || rightInset > 0 || bottomInset > 0)) {
            // Inset zones that should not overlap borders/margins (track, progress, control, range)
            const zonesToInset = ['track', 'progress', 'control', 'range', 'solidBar'];
            zonesToInset.forEach(zoneName => {
                if (zones[zoneName]) {
                    zones[zoneName].x += leftInset;
                    zones[zoneName].y += topInset;
                    zones[zoneName].width -= (leftInset + rightInset);
                    zones[zoneName].height -= (topInset + bottomInset);
                }
            });

            lcardsLog.debug('[LCARdSSlider] Inset zones for borders and margins:', {
                left: leftInset, top: topInset, right: rightInset, bottom: bottomInset
            });
        }

        // Step 2: Resolve colors using card's existing resolution logic (not component's)
        // Components should receive pre-resolved colors, not do their own resolution
        // (borderConfig already defined above)
        const colors = {
            // Border colors (using card's state-aware resolution)
            borderTop: this._resolveStateBorderColor(borderConfig?.top?.color),
            borderBottom: this._resolveStateBorderColor(borderConfig?.bottom?.color),
            borderLeft: this._resolveStateBorderColor(borderConfig?.left?.color),
            borderRight: this._resolveStateBorderColor(borderConfig?.right?.color),
            // Progress bar color (state-aware)
            progressBar: this._resolveColorValue(String(this._resolveStateValue({
                actualState: this._entity?.state,
                classifiedState: this._getButtonState(),
                colorConfig: this._sliderStyle?.gauge?.progress_bar?.color,
                fallback: 'theme:components.slider.gauge.progress_bar.color.default'
            }) ?? '')),
            // Range frame and borders
            rangeBorder: this._resolveColorValue(String(this._resolveStateValue({
                actualState: this._entity?.state,
                classifiedState: this._getButtonState(),
                colorConfig: this._sliderStyle?.range?.border?.color,
                fallback: 'theme:components.slider.range.border.color'
            }) ?? '')),
            rangeFrame: this._resolveColorValue(String(this._resolveStateValue({
                actualState: this._entity?.state,
                classifiedState: this._getButtonState(),
                colorConfig: this._sliderStyle?.range?.frame?.color,
                fallback: ''
            }) ?? '')) || this._resolveStateBorderColor(borderConfig?.top?.color),
            // Solid bar (defaults to same as top border)
            solidBar: this._resolveColorValue(String(this._resolveStateValue({
                actualState: this._entity?.state,
                classifiedState: this._getButtonState(),
                colorConfig: this._sliderStyle?.solid_bar?.color,
                fallback: ''
            }) ?? '')) || this._resolveStateBorderColor(borderConfig?.top?.color),
            // Animation indicator
            animationIndicator: this._resolveColorValue(String(this._resolveStateValue({
                actualState: this._entity?.state,
                classifiedState: this._getButtonState(),
                colorConfig: this._sliderStyle?.animation?.indicator?.color,
                fallback: 'theme:components.slider.animation.indicator.color'
            }) ?? '')),
            // Shaped component: track background (the "empty" portion inside the shape)
            trackBackground: this._resolveColorValue(String(this._resolveStateValue({
                actualState: this._entity?.state,
                classifiedState: this._getButtonState(),
                colorConfig: this._sliderStyle?.shaped?.track?.background ?? this._sliderStyle?.track?.background,
                fallback: 'var(--lcards-gray-dark, #12121c)'
            }) ?? ''))
        };

        lcardsLog.debug('[LCARdSSlider] Resolved colors using card logic:', colors);

        // Step 3: Build full render context
        const entity = this._entity;
        const context = {
            width,
            height,
            zones,  // Pass adjusted zones to component renderer
            colors,
            config: this.config,
            style: this._sliderStyle,
            state: {
                value: this._sliderValue,
                entity: entity,
                min: this._controlConfig.min,
                max: this._controlConfig.max,
                domain: this._domain
            },
            inverted: this._invertFill,  // Pass inverted flag for proper rendering
            hass: this.hass
        };

        // Step 4: Generate shell SVG with full context
        const shellSvg = this._componentRenderer(context);

        // Step 5: Generate content for zones
        const trackZone = zones.track;
        const progressZone = zones.progress;  // Check if component has separate progress zone
        const rangeZone = zones.range;  // Check if component has separate range zone
        const orientation = this._sliderStyle?.track?.orientation || 'vertical';

        let trackContent = '';
        // Shaped component always uses shaped fill mode — ignore this._mode for it.
        const effectiveMode = (componentName === 'shaped') ? 'shaped' : this._mode;
        if (effectiveMode === 'pills') {
            trackContent = this._generatePillsContent(trackZone, orientation);
        } else if (effectiveMode === 'gauge') {
            // skipProgressBar=true when component has a separate progress zone
            // skipRanges=true ALWAYS — band ranges are injected separately into #range-zone below
            // so they sit under the progress bar and indicators in the SVG paint order
            trackContent = this._generateGaugeContent(trackZone, orientation, !!progressZone, true);
        } else if (effectiveMode === 'shaped') {
            trackContent = this._generateShapedContent(trackZone, orientation);
        }

        // Step 6: Inject content into shell using shadow DOM queries
        // Parse shell to DOM temporarily
        const parser = new DOMParser();
        const doc = parser.parseFromString(shellSvg, 'image/svg+xml');
        const shellElement = doc.documentElement;

        // Inject track content
        const trackZoneElement = shellElement.querySelector('#track-zone');
        if (trackZoneElement && trackContent) {
            trackZoneElement.innerHTML = trackContent;
        }

        // Append gauge value-marker indicators into the track zone (on top of ticks).
        // Markers are rendered here — not in the progress zone — so they always land
        // on the tick/gauge area regardless of component layout (default vs picard etc.)
        if (effectiveMode === 'gauge' && trackZoneElement && trackZone) {
            const markerSvg = this._generateGaugeMarkers(trackZone, orientation);
            if (markerSvg) {
                trackZoneElement.innerHTML += markerSvg;
            }
        }

        // Inject progress bar into the appropriate zone.
        //
        // z-order is controlled by two named zone elements in the component SVG:
        //   #progress-zone-bg  — declared BEFORE #track-zone  → renders behind gauge ticks
        //   #progress-zone     — declared AFTER  #track-zone  → renders in front of gauge ticks
        //
        // The target is selected by config: style.gauge.progress_bar.layer
        //   'background' (default) → prefer #progress-zone-bg
        //   'foreground'           → prefer #progress-zone
        //
        // Fallback: if the requested zone doesn't exist in the component's SVG, try the other.
        // This means picard (which only declares #progress-zone) works correctly regardless of
        // what layer the user configures — it simply uses the one zone it has.
        if (progressZone && this._mode === 'gauge') {
            const progressBarContent = this._generateProgressBar(progressZone, orientation);

            if (progressBarContent) {
                const layer = this._sliderStyle?.gauge?.progress_bar?.layer ?? 'background';
                const preferredId = layer === 'foreground' ? '#progress-zone' : '#progress-zone-bg';
                const fallbackId  = layer === 'foreground' ? '#progress-zone-bg' : '#progress-zone';
                const targetElement =
                    shellElement.querySelector(preferredId) ||
                    shellElement.querySelector(fallbackId);

                if (targetElement) {
                    targetElement.innerHTML = progressBarContent;
                }
            }
        }

        // Inject gauge band ranges into #range-zone (bottom-most layer, always below ticks /
        // progress bar / indicators).  Done for any component that declares a #range-zone —
        // both 'default' and 'picard' have one; unknown/future components get it too if they
        // declare the zone.  skipRanges=true was passed to _generateGaugeContent() above so
        // ranges are never also rendered inside the track-zone SVG.
        if (effectiveMode === 'gauge' && rangeZone) {
            const rangeZoneEl = shellElement.querySelector('#range-zone');
            if (rangeZoneEl) {
                rangeZoneEl.innerHTML = this._generateGaugeBandRanges(rangeZone.width, rangeZone.height);
            }
        }

        // Inject borders if configured
        this._injectBordersToElement(shellElement, width, height);

        // Inject text fields if configured
        this._injectTextFieldsToElement(shellElement, width, height);

        // Debug zone overlay — appended after text so it renders on top
        this._injectZoneDebugOverlay(shellElement);

        // Apply corner clip-path for rounded card corners (must be last — clips everything)
        this._applyCornerClip(shellElement, width, height);

        // Step 7: Serialize back to string
        const serializer = new XMLSerializer();
        const finalSvg = serializer.serializeToString(shellElement);

        // Step 8: Render input overlay using control zone
        // For shaped mode, use the raw _shaped bounds (never touched by Step 1.5 inset)
        // so the overlay aligns exactly with the visible body.
        const controlZone = (effectiveMode === 'shaped' && zones._shaped) ? zones._shaped : zones.control;
        const isVertical = orientation === 'vertical';

        // Map control range into display-range pixel space so the overlay/input
        // spans only the fraction of the track that the control range covers.
        // This keeps the thumb and the progress bar fill in exact alignment even
        // when the display range extends beyond the control range.
        const { min: ctrlMin, max: ctrlMax } = this._controlConfig;
        const dispMin = this._displayConfig.min;
        const dispMax = this._displayConfig.max;
        const dispRange = dispMax - dispMin;
        const ctrlStartFrac = dispRange > 0 ? Math.max(0, Math.min(1, (ctrlMin - dispMin) / dispRange)) : 0;
        const ctrlEndFrac   = dispRange > 0 ? Math.max(0, Math.min(1, (ctrlMax - dispMin) / dispRange)) : 1;

        // For vertical sliders, use a div overlay with mouse events instead of <input type="range">
        // because writing-mode breaks mouse coordinate mapping in browsers
        if (isVertical) {
            // Vertical: y=0 is top = visual max; y=zoneHeight is bottom = visual min.
            // Overlay top aligns with ctrlMax, overlay bottom aligns with ctrlMin.
            const overlayTop    = controlZone.y + (1 - ctrlEndFrac)   * controlZone.height;
            const overlayHeight = (ctrlEndFrac - ctrlStartFrac) * controlZone.height;
            return html`
                <div class="slider-container" style="${containerStyle}">
                    ${unsafeHTML(finalSvg)}
                    ${!this._controlConfig.locked ? html`
                        <div
                            class="slider-input-overlay vertical-slider-overlay"
                            @mousedown="${this._handleVerticalSliderMouseDown}"
                            @touchstart="${this._handleVerticalSliderTouchStart}"
                            style="
                                left: ${controlZone.x}px;
                                top: ${overlayTop}px;
                                width: ${controlZone.width}px;
                                height: ${overlayHeight}px;
                                cursor: pointer;
                            "
                        ></div>
                    ` : ''}
                </div>
            `;
        }

        // Horizontal sliders work fine with <input type="range">
        // Constrain the input to the control-range pixel footprint within the display range
        // so the native thumb position stays in sync with the fill bar.
        // When invert_fill is true, mirror the input value so the thumb visually aligns with
        // the fill end.  Using a CSS scaleX(-1) transform is unreliable because browsers
        // calculate the reported value from the pre-transform coordinate space, causing the
        // thumb and the fill to move in opposite directions during drag.  Feeding the mirrored
        // value (max - value + min) is the reliable equivalent: the event handlers already
        // invert the raw value back to the actual entity value.
        const inputLeft  = controlZone.x + ctrlStartFrac * controlZone.width;
        const inputWidth = (ctrlEndFrac - ctrlStartFrac) * controlZone.width;
        const inputDisplayValue = this._invertFill
            ? String(ctrlMax - this._sliderValue + ctrlMin)
            : String(this._sliderValue);

        return html`
            <div class="slider-container" style="${containerStyle}">
                ${unsafeHTML(finalSvg)}
                ${!this._controlConfig.locked ? html`
                    <input
                        type="range"
                        class="slider-input-overlay"
                        .value="${inputDisplayValue}"
                        .min="${String(ctrlMin)}"
                        .max="${String(ctrlMax)}"
                        .step="${String(this._controlConfig.step || 1)}"
                        ?disabled="${this._controlConfig.locked}"
                        @input="${this._handleSliderInput}"
                        @change="${this._handleSliderChange}"
                        style="
                            left: ${inputLeft}px;
                            top: ${controlZone.y}px;
                            width: ${inputWidth}px;
                            height: ${controlZone.height}px;
                        "
                    />
                ` : ''}
            </div>
        `;
    }

    /**
     * Generate pills content for render function architecture
     * @param {Object} zoneSpec - Zone specification from calculateZones()
     * @param {string} orientation - 'horizontal' or 'vertical'
     * @returns {string} SVG content for pills
     * @private
     */
    _generatePillsContent(zoneSpec, orientation) {
        const trackConfig = this._sliderStyle?.track?.segments;
        const trackBounds = {
            x: 0,  // Content uses zone-local coordinates (zone positioned by transform)
            y: 0,
            width: zoneSpec.width,
            height: zoneSpec.height
        };

        lcardsLog.debug('[LCARdSSlider] _generatePillsContent()', { trackBounds, trackConfig, orientation });

        // Use existing _generatePillsSVG but at zone dimensions
        return this._generatePillsSVG(trackBounds, trackConfig, orientation);
    }

    /**
     * Generate gauge content for render function architecture
     * @param {Object} zoneSpec - Zone specification from calculateZones()
     * @param {string} orientation - 'horizontal' or 'vertical'
     * @param {boolean} skipProgressBar - If true, don't render progress bar (for separate progress zones)
     * @returns {string} SVG content for gauge
     * @private
     */
    _generateGaugeContent(zoneSpec, orientation, skipProgressBar = false, skipRanges = false) {
        lcardsLog.debug('[LCARdSSlider] _generateGaugeContent()', { zoneSpec, orientation, skipProgressBar, skipRanges });

        // Use existing _generateGaugeSVG - pass skip flags
        return this._generateGaugeSVG(zoneSpec.width, zoneSpec.height, skipProgressBar, skipRanges);
    }

    /**
     * Generate SVG band-range background rects for injection into #range-zone.
     * Only processes band ranges (those with min/max keys); marker ranges are rendered
     * as indicator shapes in the progress zone instead.
     * @param {number} zoneWidth - Width of the range zone
     * @param {number} zoneHeight - Height of the range zone
     * @returns {string} SVG markup (rect elements)
     * @private
     */
    _generateGaugeBandRanges(zoneWidth, zoneHeight) {
        const ranges = this._sliderStyle?.ranges || [];
        const orientation = this._sliderStyle?.track?.orientation || 'horizontal';
        const isVertical = orientation === 'vertical';
        const min = this._displayConfig.min;
        const max = this._displayConfig.max;
        const displayRange = max - min;
        if (displayRange <= 0) return '';

        let svg = '';
        ranges.forEach((rangeConfig, idx) => {
            if ('value' in rangeConfig) return; // Skip markers
            const bounds = this._resolvedRangeBounds?.[idx];
            const rangeMin = bounds?.min ?? rangeConfig.min;
            const rangeMax = bounds?.max ?? rangeConfig.max;
            if (rangeMin === null || rangeMin === undefined || rangeMax === null || rangeMax === undefined) return;
            const rangeColor = this._resolveRangeColor(rangeConfig.color);
            const rangeOpacity = rangeConfig.opacity ?? 0.3;
            const startPercent = Math.max(0, (rangeMin - min) / displayRange);
            const endPercent   = Math.min(1, (rangeMax - min) / displayRange);

            if (isVertical) {
                const yStart = zoneHeight * (1 - endPercent);
                const yEnd   = zoneHeight * (1 - startPercent);
                svg += `<rect class="range-bg" x="0" y="${yStart}" width="${zoneWidth}" height="${yEnd - yStart}" fill="${rangeColor}" opacity="${rangeOpacity}" />`;
            } else {
                const xStart = zoneWidth * startPercent;
                const xEnd   = zoneWidth * endPercent;
                svg += `<rect class="range-bg" x="${xStart}" y="0" width="${xEnd - xStart}" height="${zoneHeight}" fill="${rangeColor}" opacity="${rangeOpacity}" />`;
            }
        });
        return svg;
    }

    /**
     * Generate shaped fill content for the shaped component.
     *
     * Emits raw `<rect>` elements only — the component's `<clipPath>` enforces
     * the shape boundary, so no rounding is applied here.
     *
     * Render order (bottom → top):
     *   1. Optional range bands (rendered under the value fill)
     *   2. Solid value fill rect (grows from one end based on progress)
     *
     * Fill direction matches the broader slider convention:
     *   - invert_fill: false → fill rises from bottom (vertical) / left (horizontal)
     *   - invert_fill: true  → fill falls from top  (vertical) / right (horizontal)
     *
     * @param {Object} zoneSpec   - Track zone spec from calculateZones()
     * @param {string} orientation - 'horizontal' | 'vertical'
     * @returns {string} SVG content injected into the track zone
     * @private
     */
    _generateShapedContent(zoneSpec, orientation) {
        const isVertical = orientation === 'vertical';
        // Use absolute SVG coordinates — track-zone group has translate(0,0),
        // so all rects must be positioned using zone's x/y directly.
        const x = zoneSpec.x;
        const y = zoneSpec.y;
        const w = zoneSpec.width;
        const h = zoneSpec.height;

        // Fill colour: shaped-specific override (state-aware) → gauge active colour → default
        const fillColor = this._resolveColorValue(String(this._resolveStateValue({
            actualState: this._entity?.state,
            classifiedState: this._getButtonState(),
            colorConfig: this._sliderStyle?.shaped?.fill?.color,
            fallback: this._sliderStyle?.gauge?.fill?.color?.active ?? 'theme:components.slider.shaped.fill.color'
        }) ?? ''));

        const progress = this._calculateValuePercent();

        let svg = '';

        // Range bands layered under the value fill
        const ranges = this._sliderStyle?.ranges || [];
        if (ranges.length > 0) {
            svg += this._generateShapedRangeBands(zoneSpec, orientation, ranges);
        }

        // Value fill rect (absolute SVG coords)
        if (isVertical) {
            const fillH = h * progress;
            const fillY = this._invertFill ? y : y + h - fillH;
            svg += `<rect x="${x}" y="${fillY}" width="${w}" height="${fillH}" fill="${fillColor}" />`;
        } else {
            const fillW = w * progress;
            const fillX = this._invertFill ? x + w - fillW : x;
            svg += `<rect x="${fillX}" y="${y}" width="${fillW}" height="${h}" fill="${fillColor}" />`;
        }

        lcardsLog.debug('[LCARdSSlider] _generateShapedContent()', { zoneSpec, x, y, w, h, orientation, progress, fillColor });

        return svg;
    }

    /**
     * Generate range band rectangles for shaped fill mode.
     *
     * Bands are full-opacity background blocks rendered under the value fill.
     * Band positions are mirrored when `_invertFill` is set so they always align
     * with the fill direction (0% at the fill origin end).
     *
     * @param {Object} zoneSpec   - Track zone spec (zone-local coordinates)
     * @param {string} orientation - 'horizontal' | 'vertical'
     * @param {Array}  ranges      - Array of range objects {min, max, color, opacity}
     * @returns {string} SVG `<rect>` elements for the range bands
     * @private
     */
    _generateShapedRangeBands(zoneSpec, orientation, ranges) {
        const isVertical = orientation === 'vertical';
        // Absolute SVG coordinates — matches track-zone translate(0,0)
        const x = zoneSpec.x;
        const y = zoneSpec.y;
        const w = zoneSpec.width;
        const h = zoneSpec.height;

        const displayMin   = this._displayConfig.min;
        const displayMax   = this._displayConfig.max;
        const displayRange = displayMax - displayMin;

        if (displayRange <= 0) return '';

        let svg = '';

        ranges.forEach((range, idx) => {
            const bounds = this._resolvedRangeBounds?.[idx];
            const rangeMin = bounds?.min ?? (range.min ?? displayMin);
            const rangeMax = bounds?.max ?? (range.max ?? displayMax);
            // Resolve through full pipeline; state-aware object syntax ({ active, inactive, … }) also supported
            const color    = this._resolveRangeColor(range.color, '#888888');
            const opacity  = range.opacity ?? 1;

            const startPct = Math.max(0, (rangeMin - displayMin) / displayRange);
            const endPct   = Math.min(1, (rangeMax - displayMin) / displayRange);
            const sizePct  = endPct - startPct;

            if (sizePct <= 0) return;

            if (isVertical) {
                const bandH = h * sizePct;
                if (this._invertFill) {
                    // Fill from top → range 0% is at top
                    const bandY = y + h * startPct;
                    svg += `<rect x="${x}" y="${bandY}" width="${w}" height="${bandH}" fill="${color}" opacity="${opacity}" />`;
                } else {
                    // Fill from bottom → range 0% is at bottom
                    const bandY = y + h * (1 - endPct);
                    svg += `<rect x="${x}" y="${bandY}" width="${w}" height="${bandH}" fill="${color}" opacity="${opacity}" />`;
                }
            } else {
                const bandW = w * sizePct;
                if (this._invertFill) {
                    // Fill from right → range 0% is at right
                    const bandX = x + w * (1 - endPct);
                    svg += `<rect x="${bandX}" y="${y}" width="${bandW}" height="${h}" fill="${color}" opacity="${opacity}" />`;
                } else {
                    // Fill from left → range 0% is at left
                    const bandX = x + w * startPct;
                    svg += `<rect x="${bandX}" y="${y}" width="${bandW}" height="${h}" fill="${color}" opacity="${opacity}" />`;
                }
            }
        });

        return svg;
    }

    /**
     * Generate just the progress bar visual for separate progress zone
     * @param {Object} zoneSpec - Progress zone specification from calculateZones()
     * @param {string} orientation - 'horizontal' or 'vertical'
     * @returns {string} SVG content for progress bar
     * @private
     */
    _generateProgressBar(zoneSpec, orientation) {
        const isVertical = orientation === 'vertical';
        const zoneWidth = zoneSpec.width;
        const zoneHeight = zoneSpec.height;

        // Get progress bar configuration
        const gaugeConfig = this._sliderStyle?.gauge;
        const progressBarConfig = gaugeConfig?.progress_bar || {};

        // Get cross-sectional size (height property applies to perpendicular dimension)
        // Vertical mode: height = bar width, Horizontal mode: height = bar height
        const barThickness = progressBarConfig.height ?? null;

        // Get alignment (start/middle/end for cross-sectional positioning)
        // Support legacy 'center' value
        let align = progressBarConfig.align ?? progressBarConfig.position ?? 'middle';
        if (align === 'center') align = 'middle'; // Backward compatibility

        // Get padding - can be specified as individual values or padding object
        const paddingTop = progressBarConfig.padding?.top ?? progressBarConfig.padding_top ?? 0;
        const paddingRight = progressBarConfig.padding?.right ?? progressBarConfig.padding_right ?? 0;
        const paddingBottom = progressBarConfig.padding?.bottom ?? progressBarConfig.padding_bottom ?? 0;
        const paddingLeft = progressBarConfig.padding?.left ?? progressBarConfig.padding_left ?? 0;

        // Calculate effective dimensions based on orientation
        let width, height, x, y;

        if (isVertical) {
            // Vertical: height is controlled by value, width is the cross-section (thickness)
            width = barThickness ?? (zoneWidth - paddingLeft - paddingRight);
            height = zoneHeight - paddingTop - paddingBottom;
            y = paddingTop;

            // Calculate x based on alignment
            if (align === 'start') {
                x = paddingLeft; // Left edge
            } else if (align === 'end') {
                x = zoneWidth - paddingRight - width; // Right edge
            } else { // 'middle'
                x = paddingLeft + ((zoneWidth - paddingLeft - paddingRight - width) / 2); // Centered
            }
        } else {
            // Horizontal: width is controlled by value, height is the cross-section (thickness)
            width = zoneWidth - paddingLeft - paddingRight;
            height = barThickness ?? (zoneHeight - paddingTop - paddingBottom);
            x = paddingLeft;

            // Calculate y based on alignment
            if (align === 'start') {
                y = paddingTop; // Top edge
            } else if (align === 'end') {
                y = zoneHeight - paddingBottom - height; // Bottom edge
            } else { // 'middle'
                y = paddingTop + ((zoneHeight - paddingTop - paddingBottom - height) / 2); // Centered
            }
        }

        // Calculate progress percentage using DISPLAY range (not control range)
        // This ensures the visual position matches the gauge scale
        const min = this._displayConfig.min;
        const max = this._displayConfig.max;
        const value = Number(this._sliderValue);
        const range = max - min;
        const progress = range > 0 ? (value - min) / range : 0;

        lcardsLog.debug('[LCARdSSlider] _generateProgressBar()', {
            zoneSpec,
            orientation,
            sliderValue: this._sliderValue,
            min,
            max,
            value,
            range,
            progress,
            barThickness,
            padding: { top: paddingTop, right: paddingRight, bottom: paddingBottom, left: paddingLeft },
            effectiveDimensions: { x, y, width, height }
        });

        // Get fill color (state-aware progress_bar color)
        const fillColor = this._resolveColorValue(String(this._resolveStateValue({
            actualState: this._entity?.state,
            classifiedState: this._getButtonState(),
            colorConfig: progressBarConfig.color,
            fallback: 'theme:components.slider.gauge.progress_bar.color.default'
        }) ?? ''));
        // Radius: uniform number or per-end { start, end } object
        const _prRawZ = progressBarConfig.radius;
        const prZ = (_prRawZ !== null && typeof _prRawZ === 'object')
            ? { start: _prRawZ.start ?? 2, end: _prRawZ.end ?? 2 }
            : { start: (_prRawZ ?? 2), end: (_prRawZ ?? 2) };
        // Background radius — independently configurable, defaults to fill radius
        const _bgRRawZ = progressBarConfig.background?.radius ?? progressBarConfig.radius;
        const bgPrZ = (_bgRRawZ !== null && typeof _bgRRawZ === 'object')
            ? { start: _bgRRawZ.start ?? 2, end: _bgRRawZ.end ?? 2 }
            : { start: (_bgRRawZ ?? 2), end: (_bgRRawZ ?? 2) };
        const pbPathZ = (rad, px, py, pw, ph, isH, fill) => {
            if (rad.start === rad.end) {
                return `<rect x="${px}" y="${py}" width="${pw}" height="${ph}" fill="${fill}" rx="${rad.start}" ry="${rad.start}"></rect>`;
            }
            const corners = isH
                ? { tl: rad.start, tr: rad.end,   br: rad.end,   bl: rad.start }
                : { tl: rad.end,   tr: rad.end,   br: rad.start, bl: rad.start };
            return `<path d="${this._buildRoundedRectPath(px, py, pw, ph, corners)}" fill="${fill}"></path>`;
        };
        // Optional background track — extent clamped to background.min/max (defaults to control range)
        const bgColor = this._resolveColorValue(String(this._resolveStateValue({
            actualState: this._entity?.state,
            classifiedState: this._getButtonState(),
            colorConfig: progressBarConfig.background?.color,
            fallback: ''
        }) ?? ''));
        const bgThicknessZ = progressBarConfig.background?.height ?? null;
        // Background extent: background.min/max override, defaults to _controlConfig.min/max clamped to display range
        const bgMinVal = progressBarConfig.background?.min ?? this._controlConfig.min;
        const bgMaxVal = progressBarConfig.background?.max ?? this._controlConfig.max;
        const bgStartFracZ = range > 0 ? Math.max(0, Math.min(1, (bgMinVal - min) / range)) : 0;
        const bgEndFracZ   = range > 0 ? Math.max(0, Math.min(1, (bgMaxVal - min) / range)) : 1;
        lcardsLog.debug('[LCARdSSlider] _generateProgressBar() background extent', {
            bgMinVal, bgMaxVal, bgStartFracZ, bgEndFracZ,
            controlMin: this._controlConfig.min, controlMax: this._controlConfig.max,
            displayMin: min, displayMax: max
        });
        let svg = '';

        // Generate progress bar — fill zone based on value percentage
        if (isVertical) {
            const barHeight = height * progress;
            let barY = y + height - barHeight; // Start from bottom (default)

            // Apply fill inversion if configured
            if (this._invertFill) {
                barY = y; // Fill from top instead
            }

            if (bgColor) {
                const bgW   = bgThicknessZ ?? width;
                const bgX2  = x + (width - bgW) / 2;
                // Clamp background to bgStartFracZ..bgEndFracZ (y=0 is top = display max)
                const bgH_z = (bgEndFracZ - bgStartFracZ) * height;
                const bgY_z = y + (1 - bgEndFracZ) * height;
                svg += pbPathZ(bgPrZ, bgX2, bgY_z, bgW, bgH_z, false, bgColor);
            }
            svg += pbPathZ(prZ, x, barY, width, barHeight, false, fillColor);
        } else {
            const barWidth = width * progress;
            let barX = x; // Start from left (default)

            // Apply fill inversion if configured
            if (this._invertFill) {
                barX = x + width - barWidth; // Fill from right instead
            }

            if (bgColor) {
                const bgH   = bgThicknessZ ?? height;
                const bgY2  = y + (height - bgH) / 2;
                // Clamp background to bgStartFracZ..bgEndFracZ (x=0 is left = display min)
                const bgX_z = x + bgStartFracZ * width;
                const bgW_z = (bgEndFracZ - bgStartFracZ) * width;
                svg += pbPathZ(bgPrZ, bgX_z, bgY2, bgW_z, bgH, true, bgColor);
            }
            svg += pbPathZ(prZ, barX, y, barWidth, height, true, fillColor);
        }

        // Render indicator if in gauge mode and enabled
        if (this._mode === 'gauge') {
            const indicator = this._getIndicatorConfig(gaugeConfig);
            if (indicator) {
                if (isVertical) {
                    // Calculate indicator position along value axis (Y)
                    let baseIndicatorY = height * (1 - progress); // From bottom (default)
                    if (this._invertFill) {
                        baseIndicatorY = height * progress; // From top (inverted)
                    }

                    // Position indicator at center of progress bar (X)
                    const indicatorX = x + (width / 2) + indicator.offsetX;
                    const indicatorY = y + baseIndicatorY + indicator.offsetY;

                    svg += this._renderIndicator(
                        indicator.type,
                        indicatorX,
                        indicatorY,
                        indicator.width,
                        indicator.height,
                        indicator.rotation,
                        indicator.color,
                        indicator.borderEnabled,
                        indicator.borderColor,
                        indicator.borderWidth,
                        true // isVertical
                    );
                } else {
                    // Calculate indicator position along value axis (X)
                    let indicatorX = width * progress; // From left (default)
                    if (this._invertFill) {
                        indicatorX = width * (1 - progress); // From right (inverted)
                    }

                    // Position indicator at center of progress bar (Y)
                    indicatorX += x + indicator.offsetX;
                    const indicatorY = y + (height / 2) + indicator.offsetY;

                    svg += this._renderIndicator(
                        indicator.type,
                        indicatorX,
                        indicatorY,
                        indicator.width,
                        indicator.height,
                        indicator.rotation,
                        indicator.color,
                        indicator.borderEnabled,
                        indicator.borderColor,
                        indicator.borderWidth,
                        false // isVertical = false for horizontal
                    );
                }
            }
        }

        return svg;
    }

    /**
     * Generate SVG for value-marker indicators, placed in the track/tick zone.
     * Markers are always rendered here (not in the progress zone) so they sit on
     * top of the gauge ticks regardless of component layout (default vs picard, etc.)
     * @param {Object} zoneSpec - The track zone dimensions {x, y, width, height}
     * @param {string} orientation - 'vertical' | 'horizontal'
     * @returns {string} SVG markup
     * @private
     */
    _generateGaugeMarkers(zoneSpec, orientation) {
        const isVertical = orientation === 'vertical';
        const zoneWidth  = zoneSpec.width;
        const zoneHeight = zoneSpec.height;
        const gaugeConfig = this._sliderStyle?.gauge;

        const markerRanges = (this._sliderStyle?.ranges || [])
            .map((r, i) => ({ range: r, resolvedValue: this._resolvedMarkerValues[i] }))
            .filter(({ range, resolvedValue }) => 'value' in range && resolvedValue !== null);

        if (markerRanges.length === 0) return '';

        const dMin = this._displayConfig.min;
        const dMax = this._displayConfig.max;
        let svg = '';

        // Hardcoded defaults (bottom of fallback chain — preset and per-range config override these):
        //   Horizontal: offset.y = 10 (minor tick height). Bordered presets set
        //               marker_indicator.offset.y = 20 (border + tick height).
        //   Vertical:   offset.x = 0. Border size varies; each preset that needs it
        //               (e.g. picard) sets the correct value in its marker_indicator block.

        for (const { range, resolvedValue } of markerRanges) {
            const globalIndicator = this._getIndicatorConfig(gaugeConfig);
            const riCfg = range.indicator || {};
            // Fallback chain: per-range indicator → style.gauge.marker_indicator (preset) → component-aware defaults
            const presetMarker = gaugeConfig?.marker_indicator || {};
            // Color lives under indicator.color for value markers, not range.color
            // (range.color is the band fill — a separate concept)
            const markerColor = this._resolveColorValue(String(this._resolveStateValue({
                actualState: this._entity?.state,
                classifiedState: this._getButtonState(),
                colorConfig: riCfg.color ?? presetMarker.color,
                fallback: 'theme:components.slider.indicator.color'
            }) ?? ''));
            const markerIndicator = {
                // type: per-range config first, then triangle default.
                // Deliberately does NOT inherit globalIndicator.type — the main
                // indicator shape is a separate concept from a value marker.
                type:          riCfg.type              || presetMarker.type              || 'triangle',
                color:         markerColor,
                width:         riCfg.size?.width       ?? presetMarker.size?.width       ?? 20,
                height:        riCfg.size?.height      ?? presetMarker.size?.height      ?? 20,
                rotation:      riCfg.rotation          ?? presetMarker.rotation          ?? 180,
                // align: cross-axis position within the track zone.
                //   'start'  → left edge (vertical) / top edge (horizontal)
                //   'center' → zone centre
                //   'end'    → right edge (vertical) / bottom edge (horizontal)
                // Default is 'start' for all components; offset adjusts tip position.
                align:         riCfg.align             ?? presetMarker.align             ?? 'start',
                // offsetX/offsetY below double as "cross-axis nudge" (perpendicular to the
                // value axis) in the orientation a preset was authored for, but become the
                // "main-axis" (value-position) coordinate if the SAME preset is reused under
                // the other orientation (e.g. a horizontal preset's offset.y=20, meant to
                // clear a top border, becomes an errant +20px shift along the vertical value
                // axis if orientation is overridden to 'vertical'). So a preset's cross-axis
                // offset is only honoured for the axis it's actually cross-axis on for the
                // CURRENT orientation: offset.x only from presets when vertical, offset.y only
                // from presets when horizontal. Per-range config (riCfg) always applies — the
                // author configuring a range for a specific card knows its orientation.
                // Vertical: ticks are on x-axis, default offset unknown (preset must set it)
                // Horizontal: ticks are on y-axis, default offset = 10 (minor tick height)
                offsetX:       riCfg.offset?.x         ?? (isVertical ? presetMarker.offset?.x : undefined) ?? 0,
                offsetY:       riCfg.offset?.y         ?? (isVertical ? undefined : presetMarker.offset?.y) ?? (isVertical ? 0 : 10),
                borderEnabled: riCfg.border?.enabled   ?? presetMarker.border?.enabled   ?? false,
                borderColor:   this._resolveColorValue(String(this._resolveStateValue({
                    actualState: this._entity?.state,
                    classifiedState: this._getButtonState(),
                    colorConfig: riCfg.border?.color ?? presetMarker.border?.color,
                    fallback: 'theme:components.slider.indicator.border.color'
                }) ?? '')),
                borderWidth:   riCfg.border?.width     ?? presetMarker.border?.width     ?? 1
            };

            const markerPercent = Math.max(0, Math.min(1, (resolvedValue - dMin) / ((dMax - dMin) || 1)));

            if (isVertical) {
                // Y: value position along zone height
                let mY = zoneHeight * (1 - markerPercent);
                if (this._invertFill) mY = zoneHeight * markerPercent;
                // X: cross-axis position determined by align, then fine-tuned by offsetX
                const alignX = markerIndicator.align === 'start' ? 0
                             : markerIndicator.align === 'end'   ? zoneWidth
                             : zoneWidth / 2; // 'center'
                const mX = alignX + markerIndicator.offsetX;
                svg += this._renderIndicator(
                    markerIndicator.type, mX, mY + markerIndicator.offsetY,
                    markerIndicator.width, markerIndicator.height, markerIndicator.rotation,
                    markerIndicator.color, markerIndicator.borderEnabled,
                    markerIndicator.borderColor, markerIndicator.borderWidth, true
                );
                svg += this._renderMarkerLabel(range, markerIndicator, mX, mY + markerIndicator.offsetY, true);
            } else {
                // X: value position along zone width
                let mX = zoneWidth * markerPercent;
                if (this._invertFill) mX = zoneWidth * (1 - markerPercent);
                // Y: cross-axis position determined by align, then fine-tuned by offsetY
                const alignY = markerIndicator.align === 'start' ? 0
                             : markerIndicator.align === 'end'   ? zoneHeight
                             : zoneHeight / 2; // 'center'
                const mY = alignY + markerIndicator.offsetY;
                svg += this._renderIndicator(
                    markerIndicator.type, mX + markerIndicator.offsetX, mY,
                    markerIndicator.width, markerIndicator.height, markerIndicator.rotation,
                    markerIndicator.color, markerIndicator.borderEnabled,
                    markerIndicator.borderColor, markerIndicator.borderWidth, false
                );
                svg += this._renderMarkerLabel(range, markerIndicator, mX + markerIndicator.offsetX, mY, false);
            }
        }
        return svg;
    }

    /**
     * Render an optional text label near a gauge-mode value marker.
     * `drawX`/`drawY` are the same final coordinates passed to `_renderIndicator()`
     * for this marker, so the label's offset is relative to the marker shape as drawn
     * (not the pre-offset value position).
     * Default position (no `label.offset`): above the marker in horizontal orientation,
     * beside it in vertical orientation — matching where there's normally clear space.
     * @param {Object} range - Range config (`range.label` may be undefined)
     * @param {Object} markerIndicator - Resolved indicator geometry (for sizing the default offset)
     * @param {number} drawX - Marker's final drawn X coordinate
     * @param {number} drawY - Marker's final drawn Y coordinate
     * @param {boolean} isVertical
     * @returns {string} SVG markup, or '' if no label configured
     * @private
     */
    _renderMarkerLabel(range, markerIndicator, drawX, drawY, isVertical) {
        const rawText = range.label?.text;
        if (!rawText) return '';

        const labelText = String(this._resolveTemplateValue(rawText) ?? rawText);
        if (!labelText) return '';

        const labelColor = this._resolveColorValue(String(this._resolveStateValue({
            actualState: this._entity?.state,
            classifiedState: this._getButtonState(),
            colorConfig: range.label.color,
            fallback: 'theme:components.slider.indicator.label.color'
        }) ?? ''));
        const labelFontSize = range.label.font_size ?? 14;

        let labelX, labelY, textAnchor;
        if (isVertical) {
            // Default: beside the marker (clear of the value-progress fill along the track)
            labelX = drawX + (range.label.offset?.x ?? (markerIndicator.width / 2 + 6));
            labelY = drawY + (range.label.offset?.y ?? 0);
            textAnchor = 'start';
        } else {
            // Default: above the marker
            labelX = drawX + (range.label.offset?.x ?? 0);
            labelY = drawY + (range.label.offset?.y ?? -(markerIndicator.height / 2 + 6));
            textAnchor = 'middle';
        }

        return `
            <text x="${labelX}" y="${labelY}"
                  font-size="${labelFontSize}px" font-weight="400" font-family="var(--primary-font-family, Antonio, sans-serif)"
                  fill="${labelColor}"
                  text-anchor="${textAnchor}" dominant-baseline="${isVertical ? 'middle' : 'auto'}">${escapeHtml(labelText)}</text>
        `;
    }

    /**
     * Setup unified border interactivity with synchronized hover across all borders
     * Treats all 4 borders as a single interactive frame - hovering any border highlights all
     * Uses debounced restore (30ms) to handle transitions between borders without flicker
     * @private
     */
    _setupUnifiedBorderInteractivity() {
        const borders = ['left', 'top', 'right', 'bottom'];

        // Query and cache all border elements
        borders.forEach(side => {
            this._borderElements[side] = this.shadowRoot?.querySelector(`#border-${side}`);
        });

        // Apply hover color to all borders that have hover configured
        const applyHoverToAllBorders = () => {
            borders.forEach(side => {
                const element = this._borderElements[side];
                const hoverColor = this._borderHoverStyles[side];
                if (element && hoverColor) {
                    element.style.fill = hoverColor;
                }
            });
        };

        // Restore default color to all borders
        const restoreAllBorders = () => {
            borders.forEach(side => {
                const element = this._borderElements[side];
                if (element) {
                    // Clear the inline style so the SVG presentation attribute
                    // (set by the last render via _injectBordersToElement, resolved
                    // against the global theme scope) shows through.  Computing a
                    // restore color here produces a color-mix() expression containing
                    // var(--lcars-card-button-color) which the browser re-resolves
                    // from the element's inherited CSS scope — picking up any
                    // section-scoped theme override and returning the wrong colour.
                    element.style.fill = '';
                }
            });
        };

        // Apply pressed color to all borders that have pressed configured
        const applyPressedToAllBorders = () => {
            borders.forEach(side => {
                const element = this._borderElements[side];
                const pressedColor = this._borderPressedStyles[side];
                if (element && pressedColor) {
                    element.style.fill = pressedColor;
                }
            });
        };

        // Setup unified hover handlers on each border
        borders.forEach(side => {
            const element = this._borderElements[side];
            if (!element) return;

            const hoverColor = this._borderHoverStyles[side];
            const pressedColor = this._borderPressedStyles[side];

            // Skip if no interaction styles configured
            if (!hoverColor && !pressedColor) {
                return;
            }

            // Clean up previous listeners
            if (this._borderInteractivityCleanups[side]) {
                this._borderInteractivityCleanups[side]();
            }

            let isPressed = false;

            const handleMouseEnter = (e) => {
                // Cancel any pending restore timer (mouse moved to another border)
                if (this._borderHoverRestoreTimer) {
                    clearTimeout(this._borderHoverRestoreTimer);
                    this._borderHoverRestoreTimer = null;
                }

                // Set shared hover state and apply to all borders
                if (!isPressed && !this._allBordersHovering) {
                    this._allBordersHovering = true;
                    applyHoverToAllBorders();
                    lcardsLog.trace(`[LCARdSSlider] Unified border hover activated via ${side}`);
                }
                e.stopPropagation();
            };

            const handleMouseLeave = (e) => {
                // Debounce the restore to allow transition between borders
                // If mouse enters another border within 30ms, the timer is cancelled
                if (this._borderHoverRestoreTimer) {
                    clearTimeout(this._borderHoverRestoreTimer);
                }

                this._borderHoverRestoreTimer = setTimeout(() => {
                    if (!isPressed) {
                        this._allBordersHovering = false;
                        restoreAllBorders();
                        lcardsLog.trace(`[LCARdSSlider] Unified border hover deactivated`);
                    }
                    this._borderHoverRestoreTimer = null;
                }, 30); // 30ms debounce for smooth border transitions

                e.stopPropagation();
            };

            const handleMouseDown = (e) => {
                if (pressedColor) {
                    isPressed = true;
                    applyPressedToAllBorders();
                }
                e.stopPropagation();
            };

            const handleMouseUp = (e) => {
                isPressed = false;
                // Return to hover state or restore
                if (this._allBordersHovering) {
                    applyHoverToAllBorders();
                } else {
                    restoreAllBorders();
                }
                e.stopPropagation();
            };

            // Attach listeners
            element.addEventListener('mouseenter', handleMouseEnter);
            element.addEventListener('mouseleave', handleMouseLeave);
            element.addEventListener('mousedown', handleMouseDown);
            element.addEventListener('mouseup', handleMouseUp);

            // Touch support
            element.addEventListener('touchstart', handleMouseDown, { passive: true });
            element.addEventListener('touchend', handleMouseUp);

            // Store cleanup function
            this._borderInteractivityCleanups[side] = () => {
                element.removeEventListener('mouseenter', handleMouseEnter);
                element.removeEventListener('mouseleave', handleMouseLeave);
                element.removeEventListener('mousedown', handleMouseDown);
                element.removeEventListener('mouseup', handleMouseUp);
                element.removeEventListener('touchstart', handleMouseDown);
                element.removeEventListener('touchend', handleMouseUp);
            };

            lcardsLog.trace(`[LCARdSSlider] Setup ${side} border unified interactivity`, {
                hover: hoverColor,
                pressed: pressedColor
            });
        });
    }

    /**
     * Setup border interactivity after render
     * Re-attaches handlers on every render to ensure they target current DOM elements
     * (SVG elements are replaced during re-renders, creating stale references if attached once)
     * @override
     */
    updated(changedProps) {
        super.updated(changedProps);

        // Update dynamic elements when slider value changes
        // Lit's hasChanged() ensures this only fires when value actually changes
        if (changedProps.has('_sliderValue')) {
            this._updateDynamicElements();
        }

        // Update pill opacities after render completes
        // This ensures pills reflect current value on first load and subsequent updates
        if (this._mode === 'pills') {
            this._updatePillOpacities();
        }
        // Note: Gauge mode uses full re-render, no incremental updates needed

        // Only setup border interactivity for Default component
        // Advanced components (Gauge, Pills) have complex custom rendering
        const componentName = this.config.component || 'default';
        if (componentName !== 'default') {
            return;
        }

        // Setup unified border interactivity (all borders hover together)
        this._setupUnifiedBorderInteractivity();

        // Setup action handlers for each enabled border
        // All borders trigger the same actions (tap/hold/double-tap)
        const borders = ['left', 'top', 'right', 'bottom'];
        borders.forEach(side => {
            const borderElement = this.shadowRoot?.querySelector(`#border-${side}`);
            if (!borderElement) {
                return; // Border not rendered
            }

            // Clean up previous action handler for this border
            if (this._borderActionCleanups[side]) {
                this._borderActionCleanups[side]();
            }

            // Build action configurations from card config
            const actions = {
                tap_action: this.config.tap_action,
                hold_action: this.config.hold_action,
                double_tap_action: this.config.double_tap_action
            };

            // Skip if no actions configured
            if (!actions.tap_action && !actions.hold_action && !actions.double_tap_action) {
                return;
            }

            // Get AnimationManager for action triggers
            const getAnimationManager = () => {
                if (this._singletons?.animationManager) {
                    return this._singletons.animationManager;
                }
                return window.lcards?.core?.animationManager;
            };

            // Register border with ActionHandler
            this._borderActionCleanups[side] = this.setupActions(
                /** @type {HTMLElement} */(borderElement),
                actions,
                {
                    animationManager: getAnimationManager(),
                    getAnimationManager,
                    elementId: `slider-${this._cardGuid}-border-${side}`,
                    entity: this.config.entity,
                    animations: this.config.animations
                }
            );

            lcardsLog.trace(`[LCARdSSlider] Setup ${side} border actions`, {
                tap: !!actions.tap_action,
                hold: !!actions.hold_action,
                doubleTap: !!actions.double_tap_action
            });
        });
    }

    /**
     * Cleanup on card removal
     * @override
     */
    disconnectedCallback() {
        super.disconnectedCallback();

        // Unsubscribe from alert mode changes
        this._alertModeUnsubscribe?.();
        this._alertModeUnsubscribe = null;

        // Clear any pending hover restore timer
        if (this._borderHoverRestoreTimer) {
            clearTimeout(this._borderHoverRestoreTimer);
            this._borderHoverRestoreTimer = null;
        }

        // Cleanup border interaction listeners
        const borders = ['left', 'top', 'right', 'bottom'];
        const animationManager = this._singletons?.animationManager;
        borders.forEach(side => {
            if (this._borderInteractivityCleanups[side]) {
                this._borderInteractivityCleanups[side]();
                this._borderInteractivityCleanups[side] = null;
            }
            if (this._borderActionCleanups[side]) {
                this._borderActionCleanups[side]();
                this._borderActionCleanups[side] = null;
            }
            // Clean up main overlay scope (entity subscriptions, while-animations, etc.)
            animationManager?.destroyOverlayScope(`slider-${this._cardGuid}-border-${side}`);
        });
    }

    /**
     * Render the card
     * @override
     */
    _renderCard() {
        // Prefer explicit config dimensions so text zones are correct even before the
        // ResizeObserver fires (which would otherwise give the HA default 56px row height).
        const width  = this._configPx(this.config.width)  || this._containerSize?.width  || 200;
        const height = this._configPx(this.config.height) || this._containerSize?.height || 60;

        // Build inline container styles — mirrors button's containerStyleParts logic:
        //   config.height set    → exact height + min-height: 0 (suppress CSS-var floor)
        //   config.min_height set → min-height floor (CSS-var floor still applies if absent)
        //   neither              → no inline styles; CSS var(--lcards-button-min-height,40px) wins
        const toCssVal = val => { const n = Number(val); return Number.isFinite(n) ? `${n}px` : String(val); };
        const cssHeight    = this.config.height     ? toCssVal(this.config.height)     : '';
        const cssMinHeight = this.config.min_height ? toCssVal(this.config.min_height) : '';
        const containerStyleParts = [];
        if (cssHeight) {
            containerStyleParts.push(`height: ${cssHeight}`);
            containerStyleParts.push('min-height: 0px');
        } else if (cssMinHeight) {
            containerStyleParts.push(`min-height: ${cssMinHeight}`);
        }
        const containerStyle = containerStyleParts.join('; ');

        // Check if component is loaded
        if (this.config.component && !this._componentLoaded) {
            return html`
                <div class="slider-container" style="${containerStyle}">
                    <div class="slider-loading">Loading component...</div>
                </div>
            `;
        }

        // Component uses render function (new architecture)
        if (this._componentRenderer) {
            return this._renderWithRenderer(width, height, containerStyle);
        }

        // Fallback: no component loaded
        lcardsLog.warn('[LCARdSSlider] No component renderer available, showing error');
        return html`
            <div class="slider-container" style="${containerStyle}">
                <div class="slider-loading">Component not loaded</div>
            </div>
        `;
    }

    /**
     * Get card size for Home Assistant layout
     * @returns {number}
     */
    getCardSize() {
        const px = this._configPx(this.config.height);
        if (px !== null) return Math.ceil(px / 50);
        return this.config.grid_rows || 1;
    }

    /**
     * Get layout options
     * @returns {Object}
     */
    getGridOptions() {
        const orientation = this._sliderStyle?.track?.orientation || 'horizontal';
        const isVertical = orientation === 'vertical';
        const go = this.config.grid_options || {};

        if (isVertical) {
            return {
                columns:     go.columns     ?? 1,
                rows:        go.rows,
                min_columns: go.min_columns ?? 1,
                min_rows:    go.min_rows    ?? 1,
            };
        } else {
            return {
                columns:     go.columns,
                rows:        go.rows        ?? 1,
                min_columns: go.min_columns ?? 1,
                min_rows:    go.min_rows    ?? 1,
            };
        }
    }

    /**
     * Get stub config for card picker
     * @returns {Object}
     */
    static getStubConfig() {
        return {
            type: 'custom:lcards-slider',
            component: 'default',
            preset: 'pills-left-border'
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

        // Get available components from ComponentManager
        const componentManager = window.lcards?.core?.componentManager;
        const availableComponents = componentManager ?
            componentManager.getComponentsByType('slider') : [];

        // Position options with proper labels
        const positionEnum = [
            'top-left', 'top-center', 'top-right',
            'center-left', 'center', 'center-right',
            'bottom-left', 'bottom-center', 'bottom-right',
            'top', 'bottom', 'left', 'right',
            'left-center', 'right-center',              // accepted aliases (deprecated)
        ];

        lcardsLog.debug('[LCARdSSlider] Registering schema with presets:', availablePresets);

        // Register schema
        const sliderSchema = getSliderSchema({
            availablePresets,
            availableComponents,
            positionEnum
        });
        configManager.registerCardSchema('slider', sliderSchema, { version: __LCARDS_VERSION__ });

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

lcardsLog.debug('[LCARdSSlider] Card module loaded');

