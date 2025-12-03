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
 *
 * Features:
 * - Dual mode: slider (interactive) and gauge (display-only)
 * - Support for light, cover, fan, input_number, number, sensor domains
 * - Dynamic pill generation with count, gap, radius, color interpolation
 * - Gauge mode with ruler, ticks, and indicator
 * - Memoized content generation for performance
 * - SVG zone-based layout system for flexible visual designs
 *
 * @example Basic Light Slider
 * ```yaml
 * type: custom:lcards-slider
 * entity: light.bedroom
 * component: slider-horizontal
 * control:
 *   attribute: brightness
 *   min: 0
 *   max: 100
 * style:
 *   track:
 *     segments:
 *       count: 15
 *       gap: 4px
 * ```
 *
 * @extends {LCARdSCard}
 */

import { html, css } from 'lit';
import { unsafeHTML } from 'lit/directives/unsafe-html.js';
import { LCARdSCard } from '../base/LCARdSCard.js';
import { lcardsLog } from '../utils/lcards-logging.js';
import { deepMerge } from '../utils/deepMerge.js';
import { ColorUtils } from '../core/themes/ColorUtils.js';

export class LCARdSSlider extends LCARdSCard {

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
                    background: transparent;
                    position: relative;
                }

                .slider-svg {
                    display: block;
                    width: 100%;
                    height: 100%;
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
                }

                /* Slider track styling */
                .slider-input-overlay::-webkit-slider-runnable-track {
                    background: transparent;
                    border: none;
                    cursor: pointer;
                }

                .slider-input-overlay::-moz-range-track {
                    background: transparent;
                    border: none;
                    cursor: pointer;
                }

                .slider-input-overlay::-webkit-slider-thumb {
                    -webkit-appearance: none;
                    appearance: none;
                    width: 100%;
                    height: 100%;
                    background: transparent;
                    cursor: pointer;
                }

                .slider-input-overlay::-moz-range-thumb {
                    width: 100%;
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
                    color: var(--primary-text-color);
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
        this._mode = 'slider'; // 'slider' or 'gauge'
        this._sliderStyle = null;
        this._containerSize = { width: 200, height: 60 };

        // SVG component state
        this._componentSvg = null;       // Parsed SVG DOM
        this._zones = new Map();          // Zone elements and bounds
        this._componentLoaded = false;

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

        // Entity domain for behavior
        this._domain = null;
    }

    /**
     * Called when config is set
     * @protected
     */
    _onConfigSet(config) {
        super._onConfigSet(config);

        // Determine entity domain and mode
        this._updateEntityContext();

        // Resolve slider style
        this._resolveSliderStyle();

        // Load SVG component if specified
        if (config.component) {
            this._loadSliderComponent();
        }

        lcardsLog.debug(`[LCARdSSlider] Config set`, {
            entity: config.entity,
            component: config.component,
            mode: this._mode,
            domain: this._domain
        });
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

            // Check if value changed
            const oldValue = this._getEntityValue(oldState);
            const newValue = this._getEntityValue(newState);

            if (oldValue !== newValue) {
                this._sliderValue = newValue;

                lcardsLog.debug(`[LCARdSSlider] Value changed: ${oldValue} -> ${newValue}`);

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
        super._handleFirstUpdate(changedProperties);

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

        // Register for rules
        if (this.config.id) {
            this._registerOverlayForRules(`slider-${this.config.id}`, ['slider']);
        } else {
            this._registerOverlayForRules(`slider-${this._cardGuid}`, ['slider']);
        }
    }

    /**
     * Update entity context (domain, mode, etc.)
     * @private
     */
    _updateEntityContext() {
        if (!this.config.entity) {
            this._domain = null;
            this._mode = 'gauge';
            return;
        }

        // Extract domain from entity ID
        this._domain = this.config.entity.split('.')[0];

        // Determine mode based on entity domain
        const interactiveDomains = ['light', 'cover', 'fan', 'input_number', 'number'];
        const gaugeDomains = ['sensor'];

        if (this.config.mode) {
            // Explicit mode from config
            this._mode = this.config.mode;
        } else if (interactiveDomains.includes(this._domain)) {
            this._mode = 'slider';
        } else if (gaugeDomains.includes(this._domain)) {
            this._mode = 'gauge';
        } else {
            // Default to gauge for unknown domains
            this._mode = 'gauge';
        }

        // Update control config
        this._updateControlConfig();
    }

    /**
     * Update control configuration from entity and config
     * @private
     */
    _updateControlConfig() {
        const config = this.config;
        const entity = this._entity;

        // Start with config values
        this._controlConfig = {
            min: config.control?.min ?? 0,
            max: config.control?.max ?? 100,
            step: config.control?.step ?? 1,
            attribute: config.control?.attribute ?? null,
            locked: config.control?.locked ?? false
        };

        // Override from entity attributes if available
        if (entity?.attributes) {
            if (entity.attributes.min !== undefined && config.control?.min === undefined) {
                this._controlConfig.min = entity.attributes.min;
            }
            if (entity.attributes.max !== undefined && config.control?.max === undefined) {
                this._controlConfig.max = entity.attributes.max;
            }
            if (entity.attributes.step !== undefined && config.control?.step === undefined) {
                this._controlConfig.step = entity.attributes.step;
            }
        }

        // Domain-specific defaults
        if (this._domain === 'light' && !this._controlConfig.attribute) {
            this._controlConfig.attribute = 'brightness';
            this._controlConfig.min = 0;
            this._controlConfig.max = 255;
        } else if (this._domain === 'cover' && !this._controlConfig.attribute) {
            this._controlConfig.attribute = 'current_position';
            this._controlConfig.min = 0;
            this._controlConfig.max = 100;
        } else if (this._domain === 'fan' && !this._controlConfig.attribute) {
            this._controlConfig.attribute = 'percentage';
            this._controlConfig.min = 0;
            this._controlConfig.max = 100;
        }
    }

    /**
     * Get value from entity state
     * @private
     */
    _getEntityValue(entity) {
        if (!entity) return 0;

        const attribute = this._controlConfig.attribute;

        if (attribute && entity.attributes?.[attribute] !== undefined) {
            return parseFloat(entity.attributes[attribute]) || 0;
        }

        // Use state directly for input_number, number, sensor
        const state = parseFloat(entity.state);
        return isNaN(state) ? 0 : state;
    }

    /**
     * Resolve slider style from config, preset, and theme tokens
     * @private
     */
    _resolveSliderStyle() {
        // Start with defaults
        let style = {
            // Border/frame colors
            border: {
                color: {
                    active: 'var(--lcars-orange)',
                    inactive: 'var(--lcars-gray)'
                }
            },
            // Track configuration
            track: {
                orientation: 'horizontal', // or 'vertical'
                segments: {
                    enabled: true,
                    count: 10,
                    gap: 4,
                    shape: {
                        radius: 4
                    },
                    size: {
                        height: 12,
                        width: null // Auto-calculated
                    },
                    gradient: {
                        interpolated: false,
                        start: 'var(--error-color, #f44336)',
                        end: 'var(--success-color, #4caf50)'
                    },
                    appearance: {
                        unfilled: {
                            opacity: 0.2
                        },
                        filled: {
                            opacity: 1.0
                        }
                    }
                }
            },
            // Gauge configuration
            gauge: {
                indicator: {
                    type: 'line', // 'line', 'thumb', 'triangle'
                    color: 'var(--lcars-white, #ffffff)',
                    size: {
                        width: 4,
                        height: 20
                    },
                    border: {
                        color: 'var(--lcars-black, #000000)',
                        width: 1
                    }
                },
                scale: {
                    tick_marks: {
                        major: {
                            enabled: true,
                            interval: 20,
                            color: 'var(--lcars-white, #ffffff)',
                            height: 12,
                            width: 2
                        },
                        minor: {
                            enabled: true,
                            interval: 10,
                            color: 'var(--lcars-gray, #999999)',
                            height: 6,
                            width: 1
                        }
                    },
                    labels: {
                        enabled: false,
                        interval: 20,
                        color: 'var(--lcars-white, #ffffff)',
                        font_size: 10
                    }
                }
            },
            // Text labels
            text: {
                value: {
                    enabled: true,
                    template: '{entity.state}',
                    color: 'var(--lcars-white, #ffffff)',
                    font_size: 14,
                    position: 'right'
                },
                label: {
                    enabled: false,
                    template: '{entity.attributes.friendly_name}',
                    color: 'var(--lcars-gray, #999999)',
                    font_size: 12,
                    position: 'left'
                }
            }
        };

        // Apply preset if specified
        if (this.config.preset) {
            const preset = this.getStylePreset('slider', this.config.preset);
            if (preset) {
                style = deepMerge(style, preset);
            }
        }

        // Apply config overrides
        if (this.config.style) {
            style = deepMerge(style, this.config.style);
        }

        // Apply rule patches
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
            return;
        }

        lcardsLog.debug(`[LCARdSSlider] Loading component: ${componentName}`);

        try {
            // Try to get from component registry first
            const { getSliderComponent } = await import('../core/packs/components/sliders/index.js');
            let svgContent = getSliderComponent(componentName);

            if (!svgContent) {
                // Try to fetch from external URL
                svgContent = await this._fetchExternalComponent(componentName);
            }

            if (!svgContent) {
                lcardsLog.error(`[LCARdSSlider] Component not found: ${componentName}`);
                this._componentSvg = null;
                this._componentLoaded = false;
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
            '{{BORDER_COLOR}}': this._sliderStyle?.border?.color?.active || 'var(--lcars-orange)',
            '{{BORDER_COLOR_INACTIVE}}': this._sliderStyle?.border?.color?.inactive || 'var(--lcars-gray)',
            '{{GRADIENT_START}}': this._sliderStyle?.track?.segments?.gradient?.start || 'var(--error-color)',
            '{{GRADIENT_END}}': this._sliderStyle?.track?.segments?.gradient?.end || 'var(--success-color)',
            '{{TRACK_BG}}': this._sliderStyle?.track?.background || 'rgba(0,0,0,0.3)',
            '{{TEXT_COLOR}}': this._sliderStyle?.text?.value?.color || 'var(--lcars-white)'
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
            `${trackConfig?.gradient?.interpolated || false}|${orientation}|${width}|${height}`;

        // Check memoization cache
        if (this._memoizedTrack && this._memoizedTrackConfig === configHash) {
            lcardsLog.trace(`[LCARdSSlider] Using memoized track content`);
            return this._memoizedTrack;
        }

        lcardsLog.debug(`[LCARdSSlider] Generating track content (cache miss)`);

        // Generate pills
        const content = this._generatePillsSVG(width, height, trackConfig, orientation);

        // Cache result
        this._memoizedTrack = content;
        this._memoizedTrackConfig = configHash;

        return content;
    }

    /**
     * Generate pill SVG elements
     * @private
     */
    _generatePillsSVG(trackWidth, trackHeight, trackConfig, orientation = 'horizontal') {
        const count = trackConfig?.count || 10;
        const gap = parseInt(trackConfig?.gap) || 4;
        const radius = trackConfig?.shape?.radius ?? 4;
        const pillHeight = parseInt(trackConfig?.size?.height) || 12;
        const interpolated = trackConfig?.gradient?.interpolated ?? false;
        const gradientStart = this._resolveCssVariable(trackConfig?.gradient?.start || 'var(--error-color)');
        const gradientEnd = this._resolveCssVariable(trackConfig?.gradient?.end || 'var(--success-color)');
        const unfilledOpacity = trackConfig?.appearance?.unfilled?.opacity ?? 0.2;

        const isVertical = orientation === 'vertical';

        // Calculate pill dimensions
        let pillWidth, pills = '';
        let defs = '<defs>';

        if (isVertical) {
            // Vertical: pills stack from bottom to top
            const availableHeight = trackHeight - (gap * (count - 1));
            const pillSize = availableHeight / count;
            pillWidth = trackWidth;

            // Generate gradient definitions if interpolated
            if (interpolated) {
                for (let i = 0; i < count; i++) {
                    const t = i / (count - 1 || 1);
                    const color = ColorUtils.interpolateColor(gradientStart, gradientEnd, t);
                    defs += `<linearGradient id="pill-grad-${i}"><stop offset="0%" stop-color="${color}"/></linearGradient>`;
                }
            }
            defs += '</defs>';

            // Generate pills from bottom to top
            for (let i = 0; i < count; i++) {
                const y = trackHeight - ((i + 1) * pillSize) - (i * gap);
                const x = 0;

                const fill = interpolated
                    ? `url(#pill-grad-${i})`
                    : (gradientStart || 'var(--lcars-orange)');

                pills += `
                    <rect
                        id="pill-${i}"
                        class="pill"
                        x="${x}"
                        y="${y}"
                        width="${pillWidth}"
                        height="${pillSize}"
                        rx="${radius}"
                        ry="${radius}"
                        fill="${fill}"
                        opacity="${unfilledOpacity}"
                        data-pill-index="${i}" />
                `;
            }
        } else {
            // Horizontal: pills stretch from left to right
            const availableWidth = trackWidth - (gap * (count - 1));
            pillWidth = availableWidth / count;

            // Generate gradient definitions if interpolated
            if (interpolated) {
                for (let i = 0; i < count; i++) {
                    const t = i / (count - 1 || 1);
                    const color = ColorUtils.interpolateColor(gradientStart, gradientEnd, t);
                    defs += `<linearGradient id="pill-grad-${i}"><stop offset="0%" stop-color="${color}"/></linearGradient>`;
                }
            }
            defs += '</defs>';

            // Generate pills from left to right
            for (let i = 0; i < count; i++) {
                const x = i * (pillWidth + gap);
                const y = (trackHeight - pillHeight) / 2;

                const fill = interpolated
                    ? `url(#pill-grad-${i})`
                    : (gradientStart || 'var(--lcars-orange)');

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
                        fill="${fill}"
                        opacity="${unfilledOpacity}"
                        data-pill-index="${i}" />
                `;
            }
        }

        return defs + pills;
    }

    /**
     * Generate gauge SVG elements
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
            orientation
        });

        if (this._memoizedGauge && this._memoizedGaugeConfig === configHash) {
            return this._memoizedGauge;
        }

        let svg = '';

        // Background gradient rect
        const gradientStart = this._resolveCssVariable(
            this._sliderStyle?.track?.segments?.gradient?.start || 'var(--error-color)'
        );
        const gradientEnd = this._resolveCssVariable(
            this._sliderStyle?.track?.segments?.gradient?.end || 'var(--success-color)'
        );

        // Add gradient definition
        svg += `<defs>
            <linearGradient id="gauge-gradient" ${isVertical ? 'x1="0%" y1="100%" x2="0%" y2="0%"' : 'x1="0%" y1="0%" x2="100%" y2="0%"'}>
                <stop offset="0%" stop-color="${gradientStart}" />
                <stop offset="100%" stop-color="${gradientEnd}" />
            </linearGradient>
        </defs>`;

        // Background fill
        svg += `
            <rect x="0" y="0"
                  width="${trackWidth}"
                  height="${trackHeight}"
                  fill="url(#gauge-gradient)"
                  opacity="0.85" />
        `;

        // Tick marks
        const tickConfig = gaugeConfig?.scale?.tick_marks;

        // Major ticks
        if (tickConfig?.major?.enabled !== false) {
            const interval = tickConfig?.major?.interval || 20;
            const tickCount = Math.floor(100 / interval);
            const tickColor = tickConfig?.major?.color || 'white';
            const tickHeight = tickConfig?.major?.height || 12;
            const tickWidth = tickConfig?.major?.width || 2;

            for (let i = 0; i <= tickCount; i++) {
                const percent = i * interval;

                if (isVertical) {
                    const y = trackHeight - ((percent / 100) * trackHeight);
                    svg += `
                        <line x1="0" y1="${y}" x2="${tickHeight}" y2="${y}"
                              stroke="${tickColor}" stroke-width="${tickWidth}" />
                    `;
                } else {
                    const x = (percent / 100) * trackWidth;
                    svg += `
                        <line x1="${x}" y1="0" x2="${x}" y2="${tickHeight}"
                              stroke="${tickColor}" stroke-width="${tickWidth}" />
                    `;
                }
            }
        }

        // Minor ticks
        if (tickConfig?.minor?.enabled) {
            const interval = tickConfig?.minor?.interval || 10;
            const majorInterval = tickConfig?.major?.interval || 20;
            const tickColor = tickConfig?.minor?.color || 'gray';
            const tickHeight = tickConfig?.minor?.height || 6;
            const tickWidth = tickConfig?.minor?.width || 1;

            for (let percent = 0; percent <= 100; percent += interval) {
                // Skip if this would be a major tick
                if (percent % majorInterval === 0) continue;

                if (isVertical) {
                    const y = trackHeight - ((percent / 100) * trackHeight);
                    svg += `
                        <line x1="0" y1="${y}" x2="${tickHeight}" y2="${y}"
                              stroke="${tickColor}" stroke-width="${tickWidth}" />
                    `;
                } else {
                    const x = (percent / 100) * trackWidth;
                    svg += `
                        <line x1="${x}" y1="0" x2="${x}" y2="${tickHeight}"
                              stroke="${tickColor}" stroke-width="${tickWidth}" />
                    `;
                }
            }
        }

        // Indicator (positioned dynamically)
        const indicatorConfig = gaugeConfig?.indicator;
        const indicatorType = indicatorConfig?.type || 'line';
        const indicatorColor = indicatorConfig?.color || 'white';
        const indicatorWidth = parseInt(indicatorConfig?.size?.width) || 4;
        const indicatorHeight = parseInt(indicatorConfig?.size?.height) || trackHeight;

        const valuePercent = this._calculateValuePercent();

        if (indicatorType === 'line') {
            if (isVertical) {
                const y = trackHeight - (valuePercent * trackHeight);
                svg += `
                    <line class="gauge-indicator" id="gauge-indicator"
                          x1="0" y1="${y}" x2="${trackWidth}" y2="${y}"
                          stroke="${indicatorColor}" stroke-width="${indicatorWidth}" />
                `;
            } else {
                const x = valuePercent * trackWidth;
                svg += `
                    <line class="gauge-indicator" id="gauge-indicator"
                          x1="${x}" y1="0" x2="${x}" y2="${trackHeight}"
                          stroke="${indicatorColor}" stroke-width="${indicatorWidth}" />
                `;
            }
        } else if (indicatorType === 'thumb') {
            if (isVertical) {
                const y = trackHeight - (valuePercent * trackHeight);
                svg += `
                    <ellipse class="gauge-indicator" id="gauge-indicator"
                             cx="${trackWidth / 2}" cy="${y}"
                             rx="${indicatorWidth / 2}" ry="${indicatorHeight / 2}"
                             fill="${indicatorColor}"
                             stroke="${indicatorConfig?.border?.color || 'black'}"
                             stroke-width="${indicatorConfig?.border?.width || 1}" />
                `;
            } else {
                const x = valuePercent * trackWidth;
                svg += `
                    <ellipse class="gauge-indicator" id="gauge-indicator"
                             cx="${x}" cy="${trackHeight / 2}"
                             rx="${indicatorWidth / 2}" ry="${indicatorHeight / 2}"
                             fill="${indicatorColor}"
                             stroke="${indicatorConfig?.border?.color || 'black'}"
                             stroke-width="${indicatorConfig?.border?.width || 1}" />
                `;
            }
        }

        // Cache result
        this._memoizedGauge = svg;
        this._memoizedGaugeConfig = configHash;

        return svg;
    }

    /**
     * Calculate value as percentage (0-1)
     * @private
     */
    _calculateValuePercent() {
        const min = this._controlConfig.min;
        const max = this._controlConfig.max;
        const value = this._sliderValue;

        return Math.max(0, Math.min(1, (value - min) / (max - min)));
    }

    /**
     * Inject dynamic content into component zones
     * @private
     */
    _injectContentIntoZones() {
        if (!this._componentSvg) return;

        // Inject track content
        const trackZone = this._zones.get('track');
        if (trackZone) {
            const trackContent = this._mode === 'slider'
                ? this._generateTrackContent()
                : this._generateGaugeSVG(trackZone.bounds.width, trackZone.bounds.height);
            trackZone.element.innerHTML = trackContent;
        }

        // Inject text content
        const textZone = this._zones.get('text');
        if (textZone && this._sliderStyle?.text?.value?.enabled) {
            const textContent = this._generateTextContent();
            textZone.element.innerHTML = textContent;
        }
    }

    /**
     * Generate text content for text zone
     * @private
     */
    _generateTextContent() {
        const textConfig = this._sliderStyle?.text?.value;
        if (!textConfig?.enabled) return '';

        const value = this._sliderValue;
        const unit = this._entity?.attributes?.unit_of_measurement || '';
        const color = textConfig.color || 'var(--lcars-white)';
        const fontSize = textConfig.font_size || 14;

        // Simple value display
        const displayValue = Number.isInteger(value) ? value : value.toFixed(1);

        return `
            <text x="50%" y="50%"
                  text-anchor="middle"
                  dominant-baseline="central"
                  fill="${color}"
                  font-size="${fontSize}"
                  font-family="'LCARS', 'Antonio', sans-serif">
                ${displayValue}${unit}
            </text>
        `;
    }

    /**
     * Update dynamic elements without regenerating structure
     * @private
     */
    _updateDynamicElements() {
        if (!this.shadowRoot) return;

        if (this._mode === 'slider') {
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
        const indicator = this.shadowRoot?.querySelector('.gauge-indicator');
        if (!indicator) return;

        const trackZone = this._zones.get('track');
        if (!trackZone) return;

        const { width, height } = trackZone.bounds;
        const orientation = this._sliderStyle?.track?.orientation || 'horizontal';
        const isVertical = orientation === 'vertical';
        const valuePercent = this._calculateValuePercent();

        // Use uppercase comparison for efficiency (tagName is always uppercase in SVG)
        if (indicator.tagName === 'line' || indicator.tagName === 'LINE') {
            if (isVertical) {
                const y = height - (valuePercent * height);
                indicator.setAttribute('y1', y);
                indicator.setAttribute('y2', y);
            } else {
                const x = valuePercent * width;
                indicator.setAttribute('x1', x);
                indicator.setAttribute('x2', x);
            }
        } else if (indicator.tagName === 'ellipse' || indicator.tagName === 'ELLIPSE') {
            if (isVertical) {
                const y = height - (valuePercent * height);
                indicator.setAttribute('cy', y);
            } else {
                const x = valuePercent * width;
                indicator.setAttribute('cx', x);
            }
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

        lcardsLog.debug(`[LCARdSSlider] Slider changed to ${value}`, {
            domain: this._domain,
            entity: this.config.entity
        });

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
                // The value from the slider represents percentage (0-100 typically)
                // We calculate brightness as percentage of the range, then scale to 0-255
                const min = this._controlConfig.min;
                const max = this._controlConfig.max;
                const percent = (value - min) / (max - min);
                const brightness = Math.round(percent * 255);
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
        const trackContent = this._mode === 'slider'
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
            // Inject dynamic content into zones
            this._injectContentIntoZones();

            // Serialize component SVG
            svgContent = new XMLSerializer().serializeToString(this._componentSvg);
        } else {
            // Generate fallback slider
            svgContent = this._generateFallbackSlider(width, height);
        }

        // Get control zone bounds for input positioning
        const controlBounds = this._getControlZoneBounds();
        const orientation = this._sliderStyle?.track?.orientation || 'horizontal';
        const isVertical = orientation === 'vertical';

        return html`
            <div class="slider-container">
                ${unsafeHTML(svgContent)}

                ${this._mode === 'slider' ? html`
                    <input
                        type="range"
                        class="slider-input-overlay"
                        .value="${this._sliderValue}"
                        .min="${this._controlConfig.min}"
                        .max="${this._controlConfig.max}"
                        .step="${this._controlConfig.step}"
                        ?disabled="${this._controlConfig.locked}"
                        @input="${this._handleSliderInput}"
                        @change="${this._handleSliderChange}"
                        style="
                            left: ${controlBounds.x}px;
                            top: ${controlBounds.y}px;
                            width: ${controlBounds.width}px;
                            height: ${controlBounds.height}px;
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
            grid_min_columns: this.config.grid_min_columns ?? 1,
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
            entity: 'light.example',
            style: {
                track: {
                    segments: {
                        count: 10,
                        gap: 4
                    }
                }
            }
        };
    }
}

// NOTE: Card registration handled in src/lcards.js initializeCustomCard().then()

lcardsLog.info('[LCARdSSlider] Card module loaded');
