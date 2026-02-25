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
import { resolveStateColor } from '../utils/state-color-resolver.js';
import { ColorUtils } from '../core/themes/ColorUtils.js';
import { deepMerge } from '../utils/deepMerge.js';
import { resolveThemeTokensRecursive } from '../utils/lcards-theme.js';

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
                    font-family: var(--primary-font-family, 'Antonio', sans-serif);
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
        this._zones = new Map();          // Zone elements and bounds
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
    _handleHassUpdate(newHass, oldHass) {
        // Call parent to handle state-based color resolution
        super._handleHassUpdate(newHass, oldHass);

        // Update entity value
        if (this.config.entity && this._entity) {
            // Get new value and set it
            // Lit's hasChanged() automatically determines if re-render is needed
            const newValue = this._getEntityValue(this._entity);
            const previousValue = this._sliderValue;

            this._sliderValue = newValue;

            // Log value changes (first load or actual change)
            if (!oldHass || previousValue !== newValue) {
                lcardsLog.debug(`[LCARdSSlider] Value ${!oldHass ? 'initialized' : 'changed'}: ${previousValue} -> ${newValue}`);
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
            this._registerOverlayForRules(`slider-${this.config.id}`, 'slider', ['slider']);
        } else {
            this._registerOverlayForRules(`slider-${this._cardGuid}`, 'slider', ['slider']);
        }
    }

    /**
     * Called after each render - update dynamic elements
     * @protected
     */
    updated(changedProperties) {
        super.updated(changedProperties);

        // Update dynamic elements when slider value changes
        // Lit's hasChanged() ensures this only fires when value actually changes
        if (changedProperties.has('_sliderValue')) {
            this._updateDynamicElements();
        }

        // Update pill opacities after render completes
        // This ensures pills reflect current value on first load and subsequent updates
        if (this._mode === 'pills') {
            this._updatePillOpacities();
        }
        // Note: Gauge mode uses full re-render, no incremental updates needed
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

        // Value inversion (explicit only, no auto-detection)
        const invertValue = config.control?.invert_value ?? false;

        // CONTROL CONFIG: What user can set via slider input
        this._controlConfig = {
            min: config.control?.min ?? entity?.attributes?.min ?? 0,
            max: config.control?.max ?? entity?.attributes?.max ?? 100,
            step: config.control?.step ?? entity?.attributes?.step ?? 1,
            attribute: config.control?.attribute ?? this._getDefaultAttribute(),
            locked: config.control?.locked ?? !isControllable,
            invertValue: !!invertValue  // NEW: Store inversion flag
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
            rawValue = (rawValue / 255) * 100;
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
                        this._borderHoverStyles[side] = colorConfig.hover || null;
                        this._borderPressedStyles[side] = colorConfig.pressed || null;

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
    }


    /**
     * Load and parse SVG component
     * @private
     */
    async _loadSliderComponent() {
        // Default to 'default' component if not specified
        // Also check config.style.component (set by style presets like lozenge-basic)
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
     * @returns {string} Resolved color
     * @private
     */
    _resolveStateBorderColor(colorConfig) {
        // Use base class method for state-based color resolution
        return this._resolveEntityStateColor(
            colorConfig,
            'var(--lcars-color-secondary, #000000)'
        );
    }

    /**
     * Inject borders into an SVG element (works for both _componentSvg and component-based rendering)
     * @param {SVGElement} svgElement - The SVG element to inject borders into
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
            rect.setAttribute('width', leftSize);
            rect.setAttribute('height', height);
            const leftColor = this._resolveStateBorderColor(borderConfig.left.color);
            const resolvedColor = ColorUtils.resolveCssVariable(leftColor);
            // Ensure color is valid before setting (never empty/null)
            rect.setAttribute('fill', resolvedColor || '#000000');
            fragment.appendChild(rect);
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
            const resolvedColor = ColorUtils.resolveCssVariable(topColor);
            // Ensure color is valid before setting (never empty/null)
            rect.setAttribute('fill', resolvedColor || '#000000');
            fragment.appendChild(rect);
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
            rect.setAttribute('fill', ColorUtils.resolveCssVariable(rightColor) || '#000000');
            fragment.appendChild(rect);
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
            rect.setAttribute('fill', ColorUtils.resolveCssVariable(bottomColor) || '#000000');
            fragment.appendChild(rect);
        }

        // Append all borders atomically in one operation
        borderZone.appendChild(fragment);
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
     * Calculate zones from border/margin configuration (for sliders without components).
     * Creates zone structure similar to component's calculateZones() output.
     * @param {number} width - Slider width
     * @param {number} height - Slider height
     * @returns {Object} Zones object with text, track, etc.
     * @private
     */
    _calculateZonesFromBorders(width, height) {
        const borderConfig = this._sliderStyle?.border;
        const getBorderSize = (borderDef) => borderDef?.size ?? borderDef?.width ?? 0;

        const borderOffsets = {
            left: borderConfig?.left?.enabled ? getBorderSize(borderConfig.left) : 0,
            top: borderConfig?.top?.enabled ? getBorderSize(borderConfig.top) : 0,
            right: borderConfig?.right?.enabled ? getBorderSize(borderConfig.right) : 0,
            bottom: borderConfig?.bottom?.enabled ? getBorderSize(borderConfig.bottom) : 0
        };

        // Calculate text zone based on textArea config
        const textArea = this.config?.text?.area || 'auto';
        let textZone;

        if (textArea === 'auto' || textArea === 'left') {
            if (borderOffsets.left > 0) {
                // Left border area - full height including top/bottom
                textZone = {
                    x: 0,
                    y: 0,
                    width: borderOffsets.left,
                    height: height
                };
            } else if (borderOffsets.top > 0) {
                // Top border area - full width
                textZone = {
                    x: 0,
                    y: 0,
                    width: width,
                    height: borderOffsets.top
                };
            } else {
                // No borders: use full area
                textZone = { x: 0, y: 0, width, height };
            }
        } else if (textArea === 'top') {
            textZone = {
                x: 0,
                y: 0,
                width: width,
                height: borderOffsets.top || height
            };
        } else if (textArea === 'right') {
            textZone = {
                x: width - borderOffsets.right,
                y: 0,
                width: borderOffsets.right || width,
                height: height
            };
        } else if (textArea === 'bottom') {
            textZone = {
                x: 0,
                y: height - borderOffsets.bottom,
                width: width,
                height: borderOffsets.bottom || height
            };
        } else if (textArea === 'track') {
            // Text in track area (inside borders)
            const margins = this._sliderStyle?.margins || { top: 0, right: 0, bottom: 0, left: 0 };
            textZone = {
                x: borderOffsets.left + margins.left,
                y: borderOffsets.top + margins.top,
                width: width - borderOffsets.left - borderOffsets.right - margins.left - margins.right,
                height: height - borderOffsets.top - borderOffsets.bottom - margins.top - margins.bottom
            };
        } else {
            // Fallback: full area
            textZone = { x: 0, y: 0, width, height };
        }

        // Calculate track zone (inside borders)
        const margins = this._sliderStyle?.track?.margin || { top: 0, right: 0, bottom: 0, left: 0 };
        const trackZone = {
            x: borderOffsets.left + margins.left,
            y: borderOffsets.top + margins.top,
            width: width - borderOffsets.left - borderOffsets.right - margins.left - margins.right,
            height: height - borderOffsets.top - borderOffsets.bottom - margins.top - margins.bottom
        };

        return {
            text: textZone,
            track: trackZone
        };
    }

    /**
     * Inject text fields into a parsed SVG element (new rendering path).
     * This version works with parsed DOM elements instead of _componentSvg.
     * Uses zones from this._zones (always populated before this is called).
     * @param {Element} svgElement - Parsed SVG DOM element
     * @param {number} width - SVG width (fallback only)
     * @param {number} height - SVG height (fallback only)
     * @private
     */
    _injectTextFieldsToElement(svgElement, width, height) {
        // Use button's _resolveTextConfiguration() to get processed templates
        const textFields = this._resolveTextConfiguration();
        if (!textFields || Object.keys(textFields).length === 0) return;

        // Find text-zone in the provided element
        let textZone = svgElement.querySelector('#text-zone');

        // ALWAYS use zones from this._zones (should be populated before calling this)
        const textZoneData = this._zones.get('text');

        if (!textZoneData) {
            lcardsLog.error('[LCARdSSlider] No text zone in this._zones - zones must be calculated before text injection');
            return;
        }

        // Use zone bounds (width and height properties)
        const zoneWidth = textZoneData.bounds.width;
        const zoneHeight = textZoneData.bounds.height;

        if (!textZone) {
            lcardsLog.warn('[LCARdSSlider] No text-zone found in SVG element');
            return;
        }

        // Clear existing text
        textZone.innerHTML = '';

        // Process text fields using button's system with zone-relative dimensions
        const processedFields = this._processTextFields(textFields, zoneWidth, zoneHeight, null);

        // Generate SVG text elements (using button's method)
        const textMarkup = this._generateTextElements(processedFields);

        // Parse markup and append to text zone
        const parser = new DOMParser();
        const wrappedMarkup = `<g>${textMarkup}</g>`;
        const doc = parser.parseFromString(wrappedMarkup, 'image/svg+xml');

        // Check if parsing failed
        const parseError = doc.querySelector('parsererror');
        if (parseError) {
            lcardsLog.trace('[LCARdSSlider] DOMParser failed to parse text markup!');
            return;
        }

        const textElements = doc.documentElement.children;

        // Append all text elements to text zone
        Array.from(textElements).forEach(element => {
            textZone.appendChild(element.cloneNode(true));
        });

        lcardsLog.debug(`[LCARdSSlider] Injected ${processedFields.length} text fields into text-zone`);
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
        let gradientStart = ColorUtils.resolveCssVariable(trackConfig?.gradient?.start || 'var(--error-color, var(--lcards-orange-dark, #cc2200))');
        let gradientEnd = ColorUtils.resolveCssVariable(trackConfig?.gradient?.end || 'var(--success-color, var(--lcards-green-medium, #33cc99))');

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
            // Calculate the value this pill represents (in display space)
            const valuePercent = pillIndex / (pillCount - 1 || 1);
            const pillValue = displayMin + (valuePercent * displayRange);

            // Check if this value falls within any defined range
            if (ranges.length > 0) {
                // FIX: Use inclusive upper boundary (<=) to match standard range notation
                // This ensures pills at exact boundaries (e.g., 66.6, 77.7, 88.8 in 66-100 range) are matched
                const matchingRange = ranges.find(r => pillValue >= r.min && pillValue <= r.max);
                if (matchingRange) {
                    return ColorUtils.resolveCssVariable(matchingRange.color);
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
     * Get indicator configuration if enabled, or null if disabled
     * Consolidates the duplicated config extraction logic
     * @param {Object} gaugeConfig - Gauge configuration object
     * @returns {Object|null} Indicator config object or null if disabled
     * @private
     */
    _getIndicatorConfig(gaugeConfig) {
        const indicatorConfig = gaugeConfig?.indicator;

        // Check if indicator is enabled
        const indicatorEnabled = indicatorConfig?.enabled === true ||
                                (indicatorConfig?.enabled !== false &&
                                 (indicatorConfig?.type || indicatorConfig?.color || indicatorConfig?.size));

        if (!indicatorEnabled) return null;

        // Extract all config parameters
        return {
            type: indicatorConfig.type || 'line',
            color: ColorUtils.resolveCssVariable(indicatorConfig.color || 'var(--lcars-white, #ffffff)'),
            width: indicatorConfig.size?.width || 4,
            height: indicatorConfig.size?.height || 25,
            rotation: indicatorConfig.rotation || 0,
            offsetX: indicatorConfig.offset?.x || 0,
            offsetY: indicatorConfig.offset?.y || 0,
            borderEnabled: indicatorConfig.border?.enabled !== false,
            borderColor: ColorUtils.resolveCssVariable(indicatorConfig.border?.color || 'var(--lcars-black, #000000)'),
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
            entityState: this._entity?.state  // Include state for reactive tick colors
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
                const rangeMin = rangeConfig.min;
                const rangeMax = rangeConfig.max;
                const rangeColor = ColorUtils.resolveCssVariable(rangeConfig.color);
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
        // Tick marks and labels
        // ====================================================================

        // Major tick configuration
        const majorEnabled = tickConfig?.major?.enabled !== false;
        const majorInterval = tickConfig?.major?.interval || 10; // Value units (not percentage)
        const majorColor = resolveStateColor({
            actualState: this._entity?.state,
            classifiedState: this._getButtonState(),
            colorConfig: tickConfig?.major?.color,
            fallback: 'var(--lcars-card-button, #ff9966)'
        });
        const majorHeight = tickConfig?.major?.height; // undefined = full height
        const majorStrokeWidth = tickConfig?.major?.width || 2;

        // Minor tick configuration
        const minorEnabled = tickConfig?.minor?.enabled !== false;
        const minorInterval = tickConfig?.minor?.interval || 2; // Value units (not percentage)
        const minorColor = resolveStateColor({
            actualState: this._entity?.state,
            classifiedState: this._getButtonState(),
            colorConfig: tickConfig?.minor?.color,
            fallback: 'var(--lcars-card-button, #ff9966)'
        });
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
        const tickLabelColor = resolveStateColor({
            actualState: this._entity?.state,
            classifiedState: this._getButtonState(),
            colorConfig: labelConfig?.color,
            fallback: 'var(--lcars-card-button, #ff9966)'
        });

        // Progress bar configuration
        const progressConfig = gaugeConfig?.progress_bar;
        const progressColor = ColorUtils.resolveCssVariable(progressConfig?.color || 'var(--lcards-blue-light, #aaccff)');
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
                svg += `
                    <rect x="${progressX}" y="${progressY}"
                          width="${progressWidth}" height="${progressHeight}"
                          fill="${progressColor}"
                          rx="${progressRadius}" ry="${progressRadius}" />
                `;
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
                svg += `
                    <rect x="${progressX}" y="${progressY}"
                          width="${progressBarWidth}" height="${progressBarHeight}"
                          fill="${progressColor}"
                          rx="${progressRadius}" ry="${progressRadius}" />
                `;
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
                        opacity = unfilledOpacity + ((fillCount % 1) * (filledOpacity - unfilledOpacity));
                    } else {
                        opacity = unfilledOpacity;
                    }
                } else {
                    // For normal: transition pill is at the right boundary of filled region
                    if (index === Math.floor(fillCount)) {
                        opacity = unfilledOpacity + ((fillCount % 1) * (filledOpacity - unfilledOpacity));
                    } else {
                        opacity = unfilledOpacity;
                    }
                }
            } else {
                // Unfilled
                opacity = unfilledOpacity;
            }
            pill.setAttribute('opacity', opacity);
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

        // Convert to value using DISPLAY range (for visual alignment with gauge)
        // Then clamp to CONTROL range (what user can actually set)
        const displayMin = this._displayConfig.min;
        const displayMax = this._displayConfig.max;
        let value = displayMax - (relativeY * (displayMax - displayMin));

        // Apply invert fill if configured
        if (this._invertFill) {
            value = displayMax - value + displayMin;
        }

        // Clamp to control range and apply step
        const controlMin = this._controlConfig.min;
        const controlMax = this._controlConfig.max;
        value = Math.max(controlMin, Math.min(controlMax, value));
        const step = this._controlConfig.step || 1;
        value = Math.round(value / step) * step;

        lcardsLog.debug(`[LCARdSSlider] Vertical slider input`, {
            mouseY: event.clientY,
            rectTop: rect.top,
            rectHeight: rect.height,
            relativeY,
            value,
            displayMin,
            displayMax,
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

        // Convert to value using DISPLAY range (for visual alignment with gauge)
        // Then clamp to CONTROL range (what user can actually set)
        const displayMin = this._displayConfig.min;
        const displayMax = this._displayConfig.max;
        let value = displayMax - (relativeY * (displayMax - displayMin));

        // Apply invert fill if configured
        if (this._invertFill) {
            value = displayMax - value + displayMin;
        }

        // Clamp to control range and apply step
        const controlMin = this._controlConfig.min;
        const controlMax = this._controlConfig.max;
        value = Math.max(controlMin, Math.min(controlMax, value));
        const step = this._controlConfig.step || 1;
        value = Math.round(value / step) * step;

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
    _renderWithRenderer(width, height) {
        lcardsLog.debug(`[LCARdSSlider] _renderWithRenderer(${width}, ${height})`);

        // Step 1: Calculate zones using component's helper
        const zones = this._componentCalculateZones
            ? this._componentCalculateZones(width, height, { style: this._sliderStyle, config: this.config })
            : null;

        if (!zones) {
            lcardsLog.error('[LCARdSSlider] Component calculateZones() missing or returned null');
            return html`<div class="slider-error">Component missing calculateZones()</div>`;
        }

        // Step 1.25: Store zones in Map for unified text field processing
        this._zones.clear();
        for (const [zoneName, zoneData] of Object.entries(zones)) {
            this._zones.set(zoneName, { bounds: zoneData });
        }

        // Step 1.3: For Default component, override text zone with border-aware calculation
        const componentName = this.config.component || 'default';
        if (componentName === 'default') {
            const borderBasedZones = this._calculateZonesFromBorders(width, height);
            zones.text = borderBasedZones.text;
            this._zones.set('text', { bounds: borderBasedZones.text });
            lcardsLog.debug('[LCARdSSlider] Override Default component text zone with border-aware calculation:', zones.text);
        }

        lcardsLog.debug('[LCARdSSlider] Stored component zones in _zones Map:', this._zones);

        // Step 1.5: Adjust zones to account for borders and margins (inset content from edges)
        const borderConfig = this._sliderStyle?.border;
        // Track margins are under style.track.margin
        const margins = this._sliderStyle?.track?.margin || { top: 0, right: 0, bottom: 0, left: 0 };

        // Calculate total insets (borders + margins)
        const getBorderSize = (borderDef) => borderDef?.size ?? borderDef?.width ?? 0;
        const leftInset = (borderConfig?.left?.enabled ? getBorderSize(borderConfig.left) : 0) + (margins.left || 0);
        const topInset = (borderConfig?.top?.enabled ? getBorderSize(borderConfig.top) : 0) + (margins.top || 0);
        const rightInset = (borderConfig?.right?.enabled ? getBorderSize(borderConfig.right) : 0) + (margins.right || 0);
        const bottomInset = (borderConfig?.bottom?.enabled ? getBorderSize(borderConfig.bottom) : 0) + (margins.bottom || 0);

        if (leftInset > 0 || topInset > 0 || rightInset > 0 || bottomInset > 0) {
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
            // Progress bar color
            progressBar: ColorUtils.resolveCssVariable(this._sliderStyle?.gauge?.progress_bar?.color) || '#00EDED',
            // Range frame and borders
            rangeBorder: ColorUtils.resolveCssVariable(this._sliderStyle?.range?.border?.color) || '#000000',
            rangeFrame: ColorUtils.resolveCssVariable(this._sliderStyle?.range?.frame?.color) || this._resolveStateBorderColor(borderConfig?.top?.color),
            // Solid bar (defaults to same as top border)
            solidBar: ColorUtils.resolveCssVariable(this._sliderStyle?.solid_bar?.color) || this._resolveStateBorderColor(borderConfig?.top?.color),
            // Animation indicator
            animationIndicator: ColorUtils.resolveCssVariable(this._sliderStyle?.animation?.indicator?.color) || '#3AA5D0',
            // Lozenge-specific: track background (the "empty" portion of the pill)
            trackBackground: ColorUtils.resolveCssVariable(
                this._sliderStyle?.lozenge?.track?.background
                ?? this._sliderStyle?.track?.background
                ?? 'var(--lcards-black-medium, #12121c)'
            )
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
        if (this._mode === 'pills') {
            trackContent = this._generatePillsContent(trackZone, orientation);
        } else if (this._mode === 'gauge') {
            // Pass skipProgressBar=true if component has a progress zone (render progress bar there instead)
            // Pass skipRanges=true ONLY for non-Default components (Picard renders ranges separately)
            const skipRangesInGauge = componentName !== 'default';
            trackContent = this._generateGaugeContent(trackZone, orientation, !!progressZone, skipRangesInGauge);
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

        // Inject progress bar into progress zone if it exists
        // The progress bar includes the value indicator (marks the end of the bar)
        const progressZoneElement = shellElement.querySelector('#progress-zone');
        if (progressZoneElement && progressZone && this._mode === 'gauge') {
            const progressBarContent = this._generateProgressBar(progressZone, orientation);
            if (progressBarContent) {
                progressZoneElement.innerHTML = progressBarContent;
            }
        }

        // Range rendering is ALWAYS handled internally:
        // - Default component: Ranges integrated into pills colors or gauge background segments
        // - Picard/other components: Ranges rendered by component's own render() function
        // Therefore, NO external range injection needed here

        // Inject borders if configured
        this._injectBordersToElement(shellElement, width, height);

        // Inject text fields if configured
        this._injectTextFieldsToElement(shellElement, width, height);

        // Step 7: Serialize back to string
        const serializer = new XMLSerializer();
        const finalSvg = serializer.serializeToString(shellElement);

        // Step 8: Render input overlay using control zone
        const controlZone = zones.control;
        const isVertical = orientation === 'vertical';

        // For vertical sliders, use a div overlay with mouse events instead of <input type="range">
        // because writing-mode breaks mouse coordinate mapping in browsers
        if (isVertical) {
            return html`
                <div class="slider-container">
                    ${unsafeHTML(finalSvg)}
                    ${!this._controlConfig.locked ? html`
                        <div
                            class="slider-input-overlay vertical-slider-overlay"
                            @mousedown="${this._handleVerticalSliderMouseDown}"
                            @touchstart="${this._handleVerticalSliderTouchStart}"
                            style="
                                left: ${controlZone.x}px;
                                top: ${controlZone.y}px;
                                width: ${controlZone.width}px;
                                height: ${controlZone.height}px;
                                cursor: pointer;
                            "
                        ></div>
                    ` : ''}
                </div>
            `;
        }

        // Horizontal sliders work fine with <input type="range">
        const inputTransform = this._invertFill ? 'scaleX(-1)' : '';

        return html`
            <div class="slider-container">
                ${unsafeHTML(finalSvg)}
                ${!this._controlConfig.locked ? html`
                    <input
                        type="range"
                        class="slider-input-overlay"
                        .value="${String(this._sliderValue)}"
                        .min="${String(this._controlConfig.min)}"
                        .max="${String(this._controlConfig.max)}"
                        .step="${String(this._controlConfig.step || 1)}"
                        ?disabled="${this._controlConfig.locked}"
                        @input="${this._handleSliderInput}"
                        @change="${this._handleSliderChange}"
                        style="
                            left: ${controlZone.x}px;
                            top: ${controlZone.y}px;
                            width: ${controlZone.width}px;
                            height: ${controlZone.height}px;
                            ${inputTransform ? `transform: ${inputTransform};` : ''}
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

        // Get fill color (gauge active color or progress_bar color)
        const fillColor = ColorUtils.resolveCssVariable(
            progressBarConfig.color ||
            gaugeConfig?.fill?.color?.active ||
            '#93e1ff'
        );

        let svg = '';

        // Generate progress bar rect - fill zone based on value percentage
        if (isVertical) {
            const barHeight = height * progress;
            let barY = y + height - barHeight; // Start from bottom (default)

            // Apply fill inversion if configured
            if (this._invertFill) {
                barY = y; // Fill from top instead
            }

            svg += `<rect x="${x}" y="${barY}" width="${width}" height="${barHeight}" fill="${fillColor}" rx="2" ry="2"></rect>`;
        } else {
            const barWidth = width * progress;
            let barX = x; // Start from left (default)

            // Apply fill inversion if configured
            if (this._invertFill) {
                barX = x + width - barWidth; // Fill from right instead
            }

            svg += `<rect x="${barX}" y="${y}" width="${barWidth}" height="${height}" fill="${fillColor}" rx="2" ry="2"></rect>`;
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
                    const borderConfig = this._sliderStyle?.border?.[side];
                    const restoreColor = borderConfig ?
                        this._resolveStateBorderColor(borderConfig.color) :
                        '#000000';
                    element.style.fill = restoreColor;
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
     * @protected
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
                borderElement,
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
     * @protected
     */
    disconnectedCallback() {
        super.disconnectedCallback();

        // Clear any pending hover restore timer
        if (this._borderHoverRestoreTimer) {
            clearTimeout(this._borderHoverRestoreTimer);
            this._borderHoverRestoreTimer = null;
        }

        // Cleanup border interaction listeners
        const borders = ['left', 'top', 'right', 'bottom'];
        borders.forEach(side => {
            if (this._borderInteractivityCleanups[side]) {
                this._borderInteractivityCleanups[side]();
                this._borderInteractivityCleanups[side] = null;
            }
            if (this._borderActionCleanups[side]) {
                this._borderActionCleanups[side]();
                this._borderActionCleanups[side] = null;
            }
        });
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

        // Component uses render function (new architecture)
        if (this._componentRenderer) {
            return this._renderWithRenderer(width, height);
        }

        // Fallback: no component loaded
        lcardsLog.warn('[LCARdSSlider] No component renderer available, showing error');
        return html`
            <div class="slider-container">
                <div class="slider-loading">Component not loaded</div>
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
        const orientation = this._sliderStyle?.track?.orientation || 'horizontal';
        const isVertical = orientation === 'vertical';

        // Vertical sliders should be narrow (1-2 columns wide, tall)
        // Horizontal sliders should be short (1 row tall, wide)
        if (isVertical) {
            return {
                grid_columns: this.config.grid_columns ?? 2,
                grid_rows: this.config.grid_rows,
                grid_min_columns: this.config.grid_min_columns ?? 1,
                grid_min_rows: this.config.grid_min_rows ?? 4
            };
        } else {
            return {
                grid_columns: this.config.grid_columns,
                grid_rows: this.config.grid_rows ?? 1,
                grid_min_columns: this.config.grid_min_columns ?? 4,
                grid_min_rows: this.config.grid_min_rows ?? 1
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
            'left-center', 'center', 'right-center',
            'bottom-left', 'bottom-center', 'bottom-right',
            'top', 'bottom', 'left', 'right'
        ];

        lcardsLog.debug('[LCARdSSlider] Registering schema with presets:', availablePresets);

        // Register schema
        const sliderSchema = getSliderSchema({
            availablePresets,
            availableComponents,
            positionEnum
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

lcardsLog.debug('[LCARdSSlider] Card module loaded');

