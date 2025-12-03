/**
 * LCARdS Slider Card
 *
 * Native slider/gauge card for interactive controls and display-only sensors.
 * Replaces CB-LCARS multimeter with modern LCARdSCard architecture.
 *
 * Features:
 * - Dual mode: interactive sliders + display-only gauges
 * - Native HTML range input (no external slider dependency)
 * - SVG gradient bars background for authentic LCARS aesthetic
 * - Gauge mode with tick marks and labels
 * - L-shaped elbow borders
 * - Picard-style range zones
 * - Support for light, cover, fan, input_number, number, sensor domains
 *
 * Configuration:
 * ```yaml
 * type: custom:lcards-slider
 * entity: light.bedroom
 * mode: slider  # slider | gauge
 * slider:
 *   mode: brightness
 *   background:
 *     style: gradient-bars
 * ```
 *
 * @extends {LCARdSCard}
 */

import { html, css } from 'lit';
import { LCARdSCard } from '../base/LCARdSCard.js';
import { lcardsLog } from '../utils/lcards-logging.js';

export class LCARdSSlider extends LCARdSCard {

    /** Card type identifier for CoreConfigManager */
    static CARD_TYPE = 'slider';

    static get properties() {
        return {
            ...super.properties,
            _sliderValue: { type: Number, state: true },
            _isDragging: { type: Boolean, state: true },
            _mode: { type: String, state: true },
            _orientation: { type: String, state: true },
            _sliderConfig: { type: Object, state: true },
            _gaugeConfig: { type: Object, state: true },
            _elbowConfig: { type: Object, state: true },
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

                .slider-card-container {
                    position: relative;
                    width: 100%;
                    height: 100%;
                    display: flex;
                    flex-direction: column;
                }

                .slider-container {
                    position: relative;
                    width: 100%;
                    flex: 1;
                    display: flex;
                    align-items: center;
                }

                .slider-container.vertical {
                    flex-direction: column;
                }

                /* SVG background layer */
                .slider-background {
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    pointer-events: none;
                }

                /* Native range input styling */
                .slider-input {
                    position: relative;
                    width: 100%;
                    height: 100%;
                    margin: 0;
                    padding: 0;
                    background: transparent;
                    -webkit-appearance: none;
                    appearance: none;
                    cursor: pointer;
                    z-index: 10;
                }

                .slider-input.vertical {
                    writing-mode: vertical-lr;
                    direction: rtl;
                }

                /* Track styling (hidden - we use SVG background) */
                .slider-input::-webkit-slider-runnable-track {
                    background: transparent;
                    height: 100%;
                }

                .slider-input::-moz-range-track {
                    background: transparent;
                    height: 100%;
                }

                /* Thumb styling */
                .slider-input::-webkit-slider-thumb {
                    -webkit-appearance: none;
                    appearance: none;
                    width: var(--slider-thumb-size, 15px);
                    height: var(--slider-thumb-size, 15px);
                    background: var(--slider-thumb-color, white);
                    border: var(--slider-thumb-border-width, 3px) solid var(--slider-thumb-border-color, black);
                    border-radius: var(--slider-thumb-radius, 50%);
                    cursor: pointer;
                    margin-top: calc((100% - var(--slider-thumb-size, 15px)) / 2);
                }

                .slider-input::-moz-range-thumb {
                    width: var(--slider-thumb-size, 15px);
                    height: var(--slider-thumb-size, 15px);
                    background: var(--slider-thumb-color, white);
                    border: var(--slider-thumb-border-width, 3px) solid var(--slider-thumb-border-color, black);
                    border-radius: var(--slider-thumb-radius, 50%);
                    cursor: pointer;
                }

                .slider-input:disabled {
                    cursor: not-allowed;
                    opacity: 0.6;
                }

                .slider-input:disabled::-webkit-slider-thumb {
                    cursor: not-allowed;
                }

                .slider-input:disabled::-moz-range-thumb {
                    cursor: not-allowed;
                }

                /* Progress mask overlay */
                .slider-mask {
                    position: absolute;
                    top: 0;
                    right: 0;
                    height: 100%;
                    pointer-events: none;
                    transition: width 0.1s ease-out;
                }

                .slider-mask.vertical {
                    top: auto;
                    bottom: 0;
                    left: 0;
                    width: 100%;
                    height: auto;
                }

                /* Elbow border styling */
                .elbow-border {
                    position: absolute;
                    pointer-events: none;
                }

                .elbow-border-left {
                    left: 0;
                    top: 0;
                    height: 100%;
                }

                .elbow-border-top {
                    left: 0;
                    top: 0;
                    width: 100%;
                }

                .elbow-border-right {
                    right: 0;
                    top: 0;
                    height: 100%;
                }

                .elbow-border-bottom {
                    left: 0;
                    bottom: 0;
                    width: 100%;
                }

                /* Gauge mode styling */
                .gauge-container {
                    position: relative;
                    width: 100%;
                    height: 100%;
                }

                .gauge-svg {
                    width: 100%;
                    height: 100%;
                }

                /* Loading state */
                .slider-loading {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    min-height: 40px;
                    color: var(--primary-text-color);
                    font-size: 14px;
                    opacity: 0.7;
                }
            `
        ];
    }

    constructor() {
        super();

        // Initialize state
        this._sliderValue = 0;
        this._isDragging = false;
        this._mode = 'slider';
        this._orientation = 'horizontal';
        this._containerSize = { width: 200, height: 40 };
        this._sliderConfig = null;
        this._gaugeConfig = null;
        this._elbowConfig = null;

        // Bind event handlers
        this._handleSliderInput = this._handleSliderInput.bind(this);
        this._handleSliderChange = this._handleSliderChange.bind(this);
        this._handleSliderMouseDown = this._handleSliderMouseDown.bind(this);
        this._handleSliderMouseUp = this._handleSliderMouseUp.bind(this);
    }

    // ============================================================================
    // LIFECYCLE METHODS
    // ============================================================================

    /**
     * Process configuration
     * @protected
     */
    _onConfigSet(config) {
        super._onConfigSet(config);

        // Extract and normalize configuration
        this._mode = config.mode || 'slider';
        this._sliderConfig = this._normalizeSliderConfig(config.slider || {});
        this._gaugeConfig = this._normalizeGaugeConfig(config.gauge || {});
        this._elbowConfig = this._normalizeElbowConfig(config.elbow || {});
        this._orientation = this._sliderConfig.orientation || 'horizontal';

        lcardsLog.debug(`[LCARdSSlider] Config set`, {
            mode: this._mode,
            orientation: this._orientation,
            entity: config.entity
        });
    }

    /**
     * Handle HASS updates
     * @protected
     */
    _handleHassUpdate(newHass, oldHass) {
        // Update slider value from entity
        this._updateSliderValue();
    }

    /**
     * First update hook - setup observers
     * @protected
     */
    _handleFirstUpdate(changedProperties) {
        // Call parent method if it exists (LCARdSCard extends LCARdSNativeCard)
        if (super._handleFirstUpdate) {
            super._handleFirstUpdate(changedProperties);
        }

        // Register overlay for rules
        const overlayId = this.config?.id || `slider-${this._cardGuid}`;
        if (this._registerOverlayForRules) {
            this._registerOverlayForRules({
                id: overlayId,
                type: 'slider'
            });
        }

        // Setup auto-sizing (ResizeObserver)
        this._setupAutoSizing((width, height) => {
            this._containerSize = { width, height };
            this.requestUpdate();
        });

        // Initial value update
        this._updateSliderValue();
    }

    // ============================================================================
    // CONFIGURATION NORMALIZATION
    // ============================================================================

    /**
     * Normalize slider configuration with defaults
     * @param {Object} config - Raw slider config
     * @returns {Object} Normalized config
     * @private
     */
    _normalizeSliderConfig(config) {
        const entity = this._entity;
        const domain = entity?.entity_id?.split('.')[0];

        // Determine slider mode from config or entity domain
        const mode = config.mode || this._inferSliderMode(domain);

        // Get min/max from entity attributes or config
        const { min, max, step } = this._getEntityRangeConfig(entity, mode, config);

        return {
            mode,
            min,
            max,
            step,
            locked: config.locked ?? false,
            orientation: config.orientation || 'horizontal',
            height: config.height || '40px',
            width: config.width || '100%',
            flipped: config.flipped ?? false,

            background: {
                style: config.background?.style || 'gradient-bars',
                bar_count: config.background?.bar_count || 'auto',
                bar_spacing: this._parseUnit(config.background?.bar_spacing ?? 5),
                bar_thickness: this._parseUnit(config.background?.bar_thickness ?? 10),
                bar_radius: this._parseUnit(config.background?.bar_radius ?? 2),
                gradient_start: config.background?.gradient_start || 'var(--error-color, #f44336)',
                gradient_end: config.background?.gradient_end || 'var(--success-color, #4caf50)',
                gradient_angle: config.background?.gradient_angle || '90deg'
            },

            thumb: {
                enabled: config.thumb?.enabled ?? true,
                size: this._parseUnit(config.thumb?.size ?? 15),
                color: config.thumb?.color || 'white',
                border_color: config.thumb?.border_color || 'black',
                border_width: this._parseUnit(config.thumb?.border_width ?? 3),
                border_radius: config.thumb?.border_radius || '50%'
            },

            mask: {
                enabled: config.mask?.enabled ?? false,
                color: config.mask?.color || 'rgba(0, 0, 0, 0.6)',
                opacity: config.mask?.opacity ?? 0.6
            }
        };
    }

    /**
     * Normalize gauge configuration with defaults
     * @param {Object} config - Raw gauge config
     * @returns {Object} Normalized config
     * @private
     */
    _normalizeGaugeConfig(config) {
        const sliderConfig = this._sliderConfig || {};

        return {
            min: config.min ?? sliderConfig.min ?? 0,
            max: config.max ?? sliderConfig.max ?? 100,
            increment: config.increment || 10,

            ticks: {
                show: config.ticks?.show ?? true,
                size: this._parseUnit(config.ticks?.size ?? 10),
                thickness: this._parseUnit(config.ticks?.thickness ?? 2),
                color: config.ticks?.color || 'var(--primary-color, #03a9f4)',
                connect: config.ticks?.connect ?? false,
                connect_thickness: this._parseUnit(config.ticks?.connect_thickness ?? 1)
            },

            sub_ticks: {
                show: config.sub_ticks?.show ?? true,
                count: config.sub_ticks?.count || 4,
                size: this._parseUnit(config.sub_ticks?.size ?? 5),
                thickness: this._parseUnit(config.sub_ticks?.thickness ?? 1),
                color: config.sub_ticks?.color || 'var(--secondary-color, #9e9e9e)'
            },

            labels: {
                show: config.labels?.show ?? true,
                font_size: config.labels?.font_size || '14px',
                font_family: config.labels?.font_family || 'Antonio, sans-serif',
                font_weight: config.labels?.font_weight || 400,
                color: config.labels?.color || 'var(--primary-text-color, #ffffff)',
                decimal_places: config.labels?.decimal_places ?? 0,
                show_unit: config.labels?.show_unit ?? true,
                unit_suffix: config.labels?.unit_suffix || ''
            },

            background: {
                active: config.background?.active || 'transparent',
                inactive: config.background?.inactive || 'transparent'
            },

            ranges: {
                enabled: config.ranges?.enabled ?? false,
                width_ratio: config.ranges?.width_ratio || 1.9,
                height_ratio: config.ranges?.height_ratio || 2,
                zones: config.ranges?.zones || [],
                inset: {
                    border: {
                        size: this._parseUnit(config.ranges?.inset?.border?.size ?? 4),
                        color: config.ranges?.inset?.border?.color || 'black'
                    },
                    gap: this._parseUnit(config.ranges?.inset?.gap ?? 5)
                }
            }
        };
    }

    /**
     * Normalize elbow border configuration
     * @param {Object} config - Raw elbow config
     * @returns {Object} Normalized config
     * @private
     */
    _normalizeElbowConfig(config) {
        if (!config || config.enabled === false) {
            return { enabled: false };
        }

        return {
            enabled: config.enabled ?? false,
            border: {
                left: this._parseUnit(config.border?.left ?? 90),
                top: this._parseUnit(config.border?.top ?? 20),
                right: this._parseUnit(config.border?.right ?? 0),
                bottom: this._parseUnit(config.border?.bottom ?? 0)
            },
            color: {
                active: config.color?.active || 'var(--lcars-orange, #ff9900)',
                inactive: config.color?.inactive || 'var(--lcars-card-button-off, #666666)',
                unavailable: config.color?.unavailable || 'var(--lcars-card-button-unavailable, #444444)'
            },
            radius: {
                top_left: this._parseUnit(config.radius?.top_left ?? 40),
                top_right: this._parseUnit(config.radius?.top_right ?? 0),
                bottom_left: this._parseUnit(config.radius?.bottom_left ?? 0),
                bottom_right: this._parseUnit(config.radius?.bottom_right ?? 0)
            }
        };
    }

    /**
     * Parse unit value (removes 'px' suffix if present)
     * @param {string|number} value - Value to parse
     * @returns {number} Numeric value
     * @private
     */
    _parseUnit(value) {
        if (typeof value === 'number') return value;
        if (typeof value === 'string') {
            return parseFloat(value.replace(/px$/, '')) || 0;
        }
        return 0;
    }

    /**
     * Infer slider mode from entity domain
     * @param {string} domain - Entity domain
     * @returns {string} Slider mode
     * @private
     */
    _inferSliderMode(domain) {
        switch (domain) {
            case 'light':
                return 'brightness';
            case 'cover':
                return 'position';
            case 'fan':
                return 'percentage';
            case 'input_number':
            case 'number':
                return 'value';
            case 'sensor':
                return 'value';
            default:
                return 'brightness';
        }
    }

    /**
     * Get min/max/step from entity attributes or config
     * @param {Object} entity - Entity state object
     * @param {string} mode - Slider mode
     * @param {Object} config - User config
     * @returns {Object} { min, max, step }
     * @private
     */
    _getEntityRangeConfig(entity, mode, config) {
        if (!entity) {
            return {
                min: config.min ?? 0,
                max: config.max ?? 100,
                step: config.step ?? 1
            };
        }

        const domain = entity.entity_id.split('.')[0];

        // Entity-specific range logic
        switch (domain) {
            case 'light':
                if (mode === 'temperature') {
                    return {
                        min: config.min ?? entity.attributes.min_mireds ?? 153,
                        max: config.max ?? entity.attributes.max_mireds ?? 500,
                        step: config.step ?? 10
                    };
                } else if (mode === 'hue') {
                    return {
                        min: config.min ?? 0,
                        max: config.max ?? 360,
                        step: config.step ?? 1
                    };
                }
                // brightness: 0-100
                return {
                    min: config.min ?? 0,
                    max: config.max ?? 100,
                    step: config.step ?? 1
                };

            case 'input_number':
            case 'number':
                return {
                    min: config.min ?? entity.attributes.min ?? 0,
                    max: config.max ?? entity.attributes.max ?? 100,
                    step: config.step ?? entity.attributes.step ?? 1
                };

            case 'cover':
            case 'fan':
                return {
                    min: config.min ?? 0,
                    max: config.max ?? 100,
                    step: config.step ?? 1
                };

            default:
                return {
                    min: config.min ?? 0,
                    max: config.max ?? 100,
                    step: config.step ?? 1
                };
        }
    }

    // ============================================================================
    // VALUE MANAGEMENT
    // ============================================================================

    /**
     * Update slider value from entity
     * @private
     */
    _updateSliderValue() {
        if (!this._entity) {
            this._sliderValue = this._sliderConfig?.min ?? 0;
            return;
        }

        const value = this._getEntityValue();
        this._sliderValue = this._normalizeValue(value);
    }

    /**
     * Get current value from entity based on slider mode
     * @returns {number} Current value
     * @private
     */
    _getEntityValue() {
        if (!this._entity) return 0;

        const domain = this._entity.entity_id.split('.')[0];
        const mode = this._sliderConfig?.mode || 'brightness';

        switch (domain) {
            case 'light':
                if (mode === 'brightness') {
                    // Convert 0-255 to 0-100
                    const brightness = this._entity.attributes.brightness;
                    return brightness !== undefined ? (brightness / 255) * 100 : 0;
                } else if (mode === 'temperature') {
                    return this._entity.attributes.color_temp || 0;
                } else if (mode === 'saturation') {
                    return this._entity.attributes.hs_color?.[1] || 0;
                } else if (mode === 'hue') {
                    return this._entity.attributes.hs_color?.[0] || 0;
                }
                break;

            case 'cover':
                return this._entity.attributes.current_position ?? 0;

            case 'fan':
                return this._entity.attributes.percentage ?? 0;

            case 'input_number':
            case 'number':
                return parseFloat(this._entity.state) || 0;

            case 'sensor':
                return parseFloat(this._entity.state) || 0;
        }

        return 0;
    }

    /**
     * Normalize value to min/max range
     * @param {number} value - Raw value
     * @returns {number} Normalized value
     * @private
     */
    _normalizeValue(value) {
        if (!this._sliderConfig) return value;
        const { min, max } = this._sliderConfig;
        return Math.max(min, Math.min(max, value));
    }

    // ============================================================================
    // EVENT HANDLERS
    // ============================================================================

    /**
     * Handle slider input (drag in progress)
     * @param {Event} e - Input event
     * @private
     */
    _handleSliderInput(e) {
        this._sliderValue = parseFloat(e.target.value);
        this.requestUpdate();
    }

    /**
     * Handle slider change (drag complete)
     * @param {Event} e - Change event
     * @private
     */
    async _handleSliderChange(e) {
        const newValue = parseFloat(e.target.value);
        this._sliderValue = newValue;

        // Call entity service
        await this._callEntityService(newValue);
    }

    /**
     * Handle slider mouse down
     * @private
     */
    _handleSliderMouseDown() {
        this._isDragging = true;
    }

    /**
     * Handle slider mouse up
     * @private
     */
    _handleSliderMouseUp() {
        this._isDragging = false;
    }

    /**
     * Call Home Assistant service to update entity
     * @param {number} value - New value
     * @private
     */
    async _callEntityService(value) {
        if (!this._entity || this._sliderConfig?.locked) {
            return;
        }

        const domain = this._entity.entity_id.split('.')[0];
        const mode = this._sliderConfig?.mode || 'brightness';

        try {
            const { service, serviceData } = this._getServiceCall(domain, mode, value);

            await this.callService(domain, service, {
                entity_id: this._entity.entity_id,
                ...serviceData
            });

            lcardsLog.debug(`[LCARdSSlider] Service called`, {
                service: `${domain}.${service}`,
                data: serviceData
            });

        } catch (error) {
            lcardsLog.error(`[LCARdSSlider] Service call failed:`, error);
        }
    }

    /**
     * Get service call details for entity domain/mode
     * @param {string} domain - Entity domain
     * @param {string} mode - Slider mode
     * @param {number} value - New value
     * @returns {Object} { service, serviceData }
     * @private
     */
    _getServiceCall(domain, mode, value) {
        switch (domain) {
            case 'light':
                if (mode === 'brightness') {
                    return {
                        service: 'turn_on',
                        serviceData: { brightness_pct: Math.round(value) }
                    };
                } else if (mode === 'temperature') {
                    return {
                        service: 'turn_on',
                        serviceData: { color_temp: Math.round(value) }
                    };
                } else if (mode === 'saturation') {
                    const hue = this._entity.attributes.hs_color?.[0] || 0;
                    return {
                        service: 'turn_on',
                        serviceData: { hs_color: [hue, value] }
                    };
                } else if (mode === 'hue') {
                    const sat = this._entity.attributes.hs_color?.[1] || 100;
                    return {
                        service: 'turn_on',
                        serviceData: { hs_color: [value, sat] }
                    };
                }
                break;

            case 'cover':
                return {
                    service: 'set_cover_position',
                    serviceData: { position: Math.round(value) }
                };

            case 'fan':
                return {
                    service: 'set_percentage',
                    serviceData: { percentage: Math.round(value) }
                };

            case 'input_number':
            case 'number':
                return {
                    service: 'set_value',
                    serviceData: { value }
                };
        }

        return { service: 'turn_on', serviceData: {} };
    }

    // ============================================================================
    // RENDERING
    // ============================================================================

    /**
     * Main card render method
     * @returns {TemplateResult} Card HTML
     * @protected
     */
    _renderCard() {
        if (!this._initialized || !this._sliderConfig) {
            return html`
                <div class="slider-loading">
                    <span>Loading slider...</span>
                </div>
            `;
        }

        const isActive = this._entity?.state === 'on' || 
                        this._entity?.state === 'open' ||
                        (this._entity?.state !== 'off' && 
                         this._entity?.state !== 'closed' && 
                         this._entity?.state !== 'unavailable');

        return html`
            <div class="slider-card-container">
                ${this._elbowConfig?.enabled ? this._renderElbowBorders(isActive) : ''}
                ${this._renderContent()}
            </div>
        `;
    }

    /**
     * Render content based on mode
     * @returns {TemplateResult} Content HTML
     * @private
     */
    _renderContent() {
        if (this._mode === 'slider') {
            return this._renderSliderMode();
        } else if (this._mode === 'gauge' || this._mode === 'gauge-picard') {
            return this._renderGaugeMode();
        }

        return html`<div>Unknown mode: ${this._mode}</div>`;
    }

    /**
     * Render slider mode (interactive control)
     * @returns {TemplateResult} Slider HTML
     * @private
     */
    _renderSliderMode() {
        const config = this._sliderConfig;
        const isVertical = this._orientation === 'vertical';
        const containerClass = isVertical ? 'slider-container vertical' : 'slider-container';

        // Calculate thumb CSS variables
        const thumbStyles = config.thumb.enabled ? {
            '--slider-thumb-size': `${config.thumb.size}px`,
            '--slider-thumb-color': config.thumb.color,
            '--slider-thumb-border-color': config.thumb.border_color,
            '--slider-thumb-border-width': `${config.thumb.border_width}px`,
            '--slider-thumb-radius': config.thumb.border_radius
        } : {
            '--slider-thumb-size': '0px'
        };

        const thumbStyleString = Object.entries(thumbStyles)
            .map(([key, value]) => `${key}: ${value}`)
            .join('; ');

        return html`
            <div class="${containerClass}" style="height: ${config.height}; width: ${config.width};">
                <!-- SVG background -->
                ${this._renderSliderBackground()}
                
                <!-- Progress mask (optional) -->
                ${config.mask.enabled ? this._renderSliderMask() : ''}
                
                <!-- Native HTML range input -->
                <input
                    type="range"
                    class="slider-input ${isVertical ? 'vertical' : ''}"
                    .value="${this._sliderValue}"
                    .min="${config.min}"
                    .max="${config.max}"
                    .step="${config.step}"
                    ?disabled="${config.locked}"
                    @input="${this._handleSliderInput}"
                    @change="${this._handleSliderChange}"
                    @mousedown="${this._handleSliderMouseDown}"
                    @mouseup="${this._handleSliderMouseUp}"
                    @touchstart="${this._handleSliderMouseDown}"
                    @touchend="${this._handleSliderMouseUp}"
                    style="${thumbStyleString}"
                />
            </div>
        `;
    }

    /**
     * Render SVG slider background with gradient bars
     * @returns {TemplateResult} SVG background HTML
     * @private
     */
    _renderSliderBackground() {
        const config = this._sliderConfig;
        const { width, height } = this._containerSize;

        if (config.background.style === 'none') {
            return html``;
        }

        if (config.background.style === 'gradient-bars') {
            return this._renderGradientBars(width, height);
        }

        if (config.background.style === 'solid-gradient') {
            return this._renderSolidGradient(width, height);
        }

        if (config.background.style === 'solid') {
            return this._renderSolidBackground(width, height);
        }

        return html``;
    }

    /**
     * Render gradient bars background (LCARS aesthetic)
     * @param {number} width - Container width
     * @param {number} height - Container height
     * @returns {TemplateResult} SVG with gradient bars
     * @private
     */
    _renderGradientBars(width, height) {
        const config = this._sliderConfig.background;
        const isVertical = this._orientation === 'vertical';

        // Calculate bar count
        let barCount = config.bar_count;
        if (barCount === 'auto') {
            const availableSpace = isVertical ? height : width;
            const barWithSpacing = config.bar_thickness + config.bar_spacing;
            barCount = Math.floor(availableSpace / barWithSpacing);
        }

        // Generate bars with gradient coloring
        const bars = [];
        for (let i = 0; i < barCount; i++) {
            const progress = i / (barCount - 1);
            const color = this._interpolateColor(
                config.gradient_start,
                config.gradient_end,
                progress
            );

            let x, y, barWidth, barHeight;
            if (isVertical) {
                x = 0;
                y = height - (i + 1) * (config.bar_thickness + config.bar_spacing);
                barWidth = width;
                barHeight = config.bar_thickness;
            } else {
                x = i * (config.bar_thickness + config.bar_spacing);
                y = (height - config.bar_thickness) / 2;
                barWidth = config.bar_thickness;
                barHeight = config.bar_thickness;
            }

            bars.push(html`
                <rect
                    x="${x}"
                    y="${y}"
                    width="${barWidth}"
                    height="${barHeight}"
                    rx="${config.bar_radius}"
                    ry="${config.bar_radius}"
                    fill="${color}"
                />
            `);
        }

        return html`
            <svg class="slider-background" viewBox="0 0 ${width} ${height}" preserveAspectRatio="none">
                ${bars}
            </svg>
        `;
    }

    /**
     * Render solid gradient background
     * @param {number} width - Container width
     * @param {number} height - Container height
     * @returns {TemplateResult} SVG with gradient
     * @private
     */
    _renderSolidGradient(width, height) {
        const config = this._sliderConfig.background;
        const gradientId = `gradient-${this._cardGuid}`;

        return html`
            <svg class="slider-background" viewBox="0 0 ${width} ${height}" preserveAspectRatio="none">
                <defs>
                    <linearGradient id="${gradientId}" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" style="stop-color:${config.gradient_start}" />
                        <stop offset="100%" style="stop-color:${config.gradient_end}" />
                    </linearGradient>
                </defs>
                <rect x="0" y="0" width="${width}" height="${height}" fill="url(#${gradientId})" />
            </svg>
        `;
    }

    /**
     * Render solid background
     * @param {number} width - Container width  
     * @param {number} height - Container height
     * @returns {TemplateResult} SVG with solid fill
     * @private
     */
    _renderSolidBackground(width, height) {
        const config = this._sliderConfig.background;
        return html`
            <svg class="slider-background" viewBox="0 0 ${width} ${height}" preserveAspectRatio="none">
                <rect x="0" y="0" width="${width}" height="${height}" fill="${config.gradient_start}" />
            </svg>
        `;
    }

    /**
     * Render slider progress mask
     * @returns {TemplateResult} Mask overlay HTML
     * @private
     */
    _renderSliderMask() {
        const config = this._sliderConfig;
        const { min, max } = config;
        const progress = (this._sliderValue - min) / (max - min);
        const isVertical = this._orientation === 'vertical';

        const maskStyle = isVertical
            ? `height: ${(1 - progress) * 100}%; background: ${config.mask.color}; opacity: ${config.mask.opacity};`
            : `width: ${(1 - progress) * 100}%; background: ${config.mask.color}; opacity: ${config.mask.opacity};`;

        return html`
            <div class="slider-mask ${isVertical ? 'vertical' : ''}" style="${maskStyle}"></div>
        `;
    }

    /**
     * Render gauge mode (display only with tick marks)
     * @returns {TemplateResult} Gauge HTML
     * @private
     */
    _renderGaugeMode() {
        const config = this._gaugeConfig;
        const sliderConfig = this._sliderConfig;
        const { width, height } = this._containerSize;
        const isVertical = this._orientation === 'vertical';

        const { min, max, increment } = config;
        const range = max - min;
        const tickCount = Math.floor(range / increment) + 1;

        // Generate tick marks and labels
        const ticks = [];
        const labels = [];

        for (let i = 0; i < tickCount; i++) {
            const value = min + i * increment;
            const progress = (value - min) / range;

            let x, y, x2, y2;
            if (isVertical) {
                x = 0;
                y = height - progress * height;
                x2 = config.ticks.size;
                y2 = y;
            } else {
                x = progress * width;
                y = height / 2 - config.ticks.size / 2;
                x2 = x;
                y2 = height / 2 + config.ticks.size / 2;
            }

            // Major tick mark
            if (config.ticks.show) {
                ticks.push(html`
                    <line
                        x1="${x}"
                        y1="${y}"
                        x2="${isVertical ? x2 : x}"
                        y2="${isVertical ? y : y2}"
                        stroke="${config.ticks.color}"
                        stroke-width="${config.ticks.thickness}"
                    />
                `);
            }

            // Tick label
            if (config.labels.show) {
                const labelValue = value.toFixed(config.labels.decimal_places);
                const unit = config.labels.show_unit ? (config.labels.unit_suffix || this._getEntityUnit()) : '';
                const labelX = isVertical ? config.ticks.size + 5 : x;
                const labelY = isVertical ? y + 4 : height - 5;

                labels.push(html`
                    <text
                        x="${labelX}"
                        y="${labelY}"
                        font-size="${config.labels.font_size}"
                        font-family="${config.labels.font_family}"
                        font-weight="${config.labels.font_weight}"
                        fill="${config.labels.color}"
                        text-anchor="${isVertical ? 'start' : 'middle'}"
                    >${labelValue}${unit}</text>
                `);
            }

            // Sub-ticks
            if (config.sub_ticks.show && i < tickCount - 1) {
                const subTickCount = config.sub_ticks.count;
                const subTickSpacing = increment / (subTickCount + 1);

                for (let j = 1; j <= subTickCount; j++) {
                    const subValue = value + j * subTickSpacing;
                    const subProgress = (subValue - min) / range;

                    let sx, sy, sx2, sy2;
                    if (isVertical) {
                        sx = 0;
                        sy = height - subProgress * height;
                        sx2 = config.sub_ticks.size;
                        sy2 = sy;
                    } else {
                        sx = subProgress * width;
                        sy = height / 2 - config.sub_ticks.size / 2;
                        sx2 = sx;
                        sy2 = height / 2 + config.sub_ticks.size / 2;
                    }

                    ticks.push(html`
                        <line
                            x1="${sx}"
                            y1="${sy}"
                            x2="${isVertical ? sx2 : sx}"
                            y2="${isVertical ? sy : sy2}"
                            stroke="${config.sub_ticks.color}"
                            stroke-width="${config.sub_ticks.thickness}"
                        />
                    `);
                }
            }
        }

        // Render range zones if enabled (Picard style)
        const rangeZones = config.ranges.enabled ? this._renderRangeZones(width, height) : [];

        // Current value indicator
        const valueProgress = (this._sliderValue - min) / range;
        const indicatorPos = isVertical
            ? height - valueProgress * height
            : valueProgress * width;

        return html`
            <div class="gauge-container" style="height: ${sliderConfig?.height || '40px'}; width: ${sliderConfig?.width || '100%'};">
                <svg class="gauge-svg" viewBox="0 0 ${width} ${height}" preserveAspectRatio="none">
                    <!-- Range zones (Picard style) -->
                    ${rangeZones}
                    
                    <!-- Tick marks -->
                    ${ticks}
                    
                    <!-- Tick labels -->
                    ${labels}
                    
                    <!-- Current value indicator -->
                    <line
                        x1="${isVertical ? 0 : indicatorPos}"
                        y1="${isVertical ? indicatorPos : 0}"
                        x2="${isVertical ? width : indicatorPos}"
                        y2="${isVertical ? indicatorPos : height}"
                        stroke="white"
                        stroke-width="2"
                    />
                </svg>
            </div>
        `;
    }

    /**
     * Render Picard-style range zones
     * @param {number} width - Container width
     * @param {number} height - Container height
     * @returns {Array} SVG elements for range zones
     * @private
     */
    _renderRangeZones(width, height) {
        const config = this._gaugeConfig;
        const { min, max } = config;
        const range = max - min;
        const isVertical = this._orientation === 'vertical';

        // Ratio divisor for scaling width_ratio/height_ratio to percentage of container
        // A ratio of 10 means 100% of container dimension, ratio of 1 means 10%
        const RATIO_SCALE_FACTOR = 10;

        return config.ranges.zones.map(zone => {
            const startProgress = (zone.from - min) / range;
            const endProgress = (zone.to - min) / range;

            let x, y, zoneWidth, zoneHeight;
            if (isVertical) {
                x = 0;
                y = height - endProgress * height;
                zoneWidth = width * config.ranges.width_ratio / RATIO_SCALE_FACTOR;
                zoneHeight = (endProgress - startProgress) * height;
            } else {
                x = startProgress * width;
                y = 0;
                zoneWidth = (endProgress - startProgress) * width;
                zoneHeight = height * config.ranges.height_ratio / RATIO_SCALE_FACTOR;
            }

            return html`
                <rect
                    x="${x}"
                    y="${y}"
                    width="${zoneWidth}"
                    height="${zoneHeight}"
                    fill="${zone.color}"
                />
            `;
        });
    }

    /**
     * Render elbow borders
     * @param {boolean} isActive - Whether entity is active
     * @returns {TemplateResult} Elbow border HTML
     * @private
     */
    _renderElbowBorders(isActive) {
        const config = this._elbowConfig;
        const color = isActive ? config.color.active : config.color.inactive;
        const borders = [];

        if (config.border.left > 0) {
            borders.push(html`
                <div 
                    class="elbow-border elbow-border-left" 
                    style="width: ${config.border.left}px; background: ${color}; border-radius: ${config.radius.top_left}px 0 0 ${config.radius.bottom_left}px;">
                </div>
            `);
        }

        if (config.border.top > 0) {
            borders.push(html`
                <div 
                    class="elbow-border elbow-border-top" 
                    style="height: ${config.border.top}px; background: ${color}; border-radius: ${config.radius.top_left}px ${config.radius.top_right}px 0 0;">
                </div>
            `);
        }

        if (config.border.right > 0) {
            borders.push(html`
                <div 
                    class="elbow-border elbow-border-right" 
                    style="width: ${config.border.right}px; background: ${color}; border-radius: 0 ${config.radius.top_right}px ${config.radius.bottom_right}px 0;">
                </div>
            `);
        }

        if (config.border.bottom > 0) {
            borders.push(html`
                <div 
                    class="elbow-border elbow-border-bottom" 
                    style="height: ${config.border.bottom}px; background: ${color}; border-radius: 0 0 ${config.radius.bottom_right}px ${config.radius.bottom_left}px;">
                </div>
            `);
        }

        return borders;
    }

    /**
     * Get entity unit of measurement
     * @returns {string} Unit string
     * @private
     */
    _getEntityUnit() {
        return this._entity?.attributes?.unit_of_measurement || '';
    }

    /**
     * Interpolate between two CSS colors
     * Supports CSS variables by falling back to hex colors
     * @param {string} color1 - Start color
     * @param {string} color2 - End color  
     * @param {number} progress - Progress 0-1
     * @returns {string} Interpolated color
     * @private
     */
    _interpolateColor(color1, color2, progress) {
        // For CSS variables, we can't interpolate directly
        // Return the end color when past halfway, start color otherwise
        if (color1.startsWith('var(') || color2.startsWith('var(')) {
            return progress < 0.5 ? color1 : color2;
        }

        // Parse hex colors
        const parseHex = (hex) => {
            const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
            return result ? {
                r: parseInt(result[1], 16),
                g: parseInt(result[2], 16),
                b: parseInt(result[3], 16)
            } : { r: 0, g: 0, b: 0 };
        };

        const c1 = parseHex(color1);
        const c2 = parseHex(color2);

        const r = Math.round(c1.r + (c2.r - c1.r) * progress);
        const g = Math.round(c1.g + (c2.g - c1.g) * progress);
        const b = Math.round(c1.b + (c2.b - c1.b) * progress);

        return `rgb(${r}, ${g}, ${b})`;
    }
}
