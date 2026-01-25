/**
 * LCARdS Elbow Card
 *
 * Extends lcards-button with classic LCARS elbow/corner treatments.
 * Elbows are positioned borders with rounded corners that create the
 * iconic LCARS interface aesthetic (header/footer "caps").
 *
 * Features:
 * - 4 elbow positions (header-left/right, footer-left/right)
 * - 2 styles: 'simple' (single elbow) and 'segmented' (Picard-style double elbow)
 * - LCARS arc formula-based geometry for authentic curves
 * - Configurable bar dimensions (horizontal/vertical)
 * - Inherits all LCARdSButton functionality (actions, rules, animations, templates)
 *
 * The elbow creates an L-shaped design with:
 * - A horizontal bar (top or bottom edge)
 * - A vertical bar (left or right edge)
 * - A curved corner connecting them (the "elbow")
 *
 * Segmented style adds concentric elbows with gap (TNG aesthetic).
 *
 * LCARS Arc Formula:
 * The LCARS elbow uses a specific geometric relationship:
 * - Outer arc radius (when 'auto') = horizontal / 2 (bar width divided by 2)
 *   This creates a corner where the arc reaches the flat edge at 50% of the bar width
 * - Inner arc circumference (semicircle) = (outer_radius / 2) × π
 *
 * Example: For horizontal border = 150px:
 *   outer radius (auto) = 75px (tangent at halfway point)
 *   inner radius = 37.5px (LCARS formula: outer / 2)
 *   outer arc = 75 × π ≈ 235.62
 *   inner arc = 37.5 × π ≈ 117.81
 *
 * For SVG rendering, this translates to:
 *   outer SVG radius = outer_radius (e.g., 75px)
 *   inner SVG radius = outer_radius / 2 (e.g., 37.5px)
 *
 * Configuration:
 * ```yaml
 * type: custom:lcards-elbow
 * entity: light.example
 * elbow:
 *   type: header-left          # Position of the elbow corner
 *   style: simple              # 'simple' (default) or 'segmented' (double elbow)
 *   border:
 *     horizontal: 90           # Width of vertical sidebar (pixels)
 *     vertical: 20             # Height of horizontal bar (pixels)
 *   radius:
 *     outer: 'auto'            # Outer corner radius (or 'auto' to match horizontal)
 *     inner_factor: 2          # Legacy mode: inner radius = outer / factor
 *                               # (omit for LCARS formula: inner = outer / 2)
 *   # For segmented style (TNG Picard aesthetic):
 *   segments:
 *     gap: 4                   # Gap between outer/inner segments (pixels)
 *     factor: 4                # Segment sizing: outer = (total-gap)*3/4, inner = (total-gap)/4
 *     colors:
 *       outer: '#FF9C00'       # Outer segment color (optional, uses main color if omitted)
 *       inner: '#FFCC99'       # Inner segment color (optional, uses main color if omitted)
 * ```
 *
 * @extends {LCARdSButton}
 */

import { html, css } from 'lit';
import { unsafeHTML } from 'lit/directives/unsafe-html.js';
import { LCARdSButton } from './lcards-button.js';
import { lcardsLog } from '../utils/lcards-logging.js';
import { resolveStateColor } from '../utils/state-color-resolver.js';
import { getElbowSchema } from './schemas/elbow-schema.js';
import { getElbowComponent, getElbowTypeNames, hasElbowComponent } from '../core/packs/components/elbows/index.js';

// Import editor component for getConfigElement()
import '../editor/cards/lcards-elbow-editor.js';

export class LCARdSElbow extends LCARdSButton {

    /** Card type identifier for CoreConfigManager */
    static CARD_TYPE = 'elbow';

    static get properties() {
        return {
            ...super.properties,
            _elbowConfig: { type: Object, state: true },
            _elbowGeometry: { type: Object, state: true },
            _themeBarDimensions: { type: Object, state: true } // Track input_number values
        };
    }

    static get styles() {
        return [
            super.styles,
            css`
                /* Elbow-specific styling */
                :host {
                    display: block;
                    width: 100%;
                    height: 100%;
                }

                .elbow-container {
                    width: 100%;
                    height: 100%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: transparent;
                }

                .elbow-svg {
                    display: block;
                    width: 100%;
                    height: 100%;
                    cursor: pointer;
                }

                .elbow-svg:hover {
                    opacity: 0.8;
                }
            `
        ];
    }

    constructor() {
        super();
        this._elbowConfig = null;
        this._elbowGeometry = null;
        this._themeBarDimensions = { horizontal: null, vertical: null };
        this._themeEntityUnsubscribes = []; // Track subscriptions for cleanup
    }

    /**
     * Override config processing to extract elbow configuration
     * @protected
     */
    _onConfigSet(config) {
        super._onConfigSet(config);

        // Extract and validate elbow config
        if (config.elbow) {
            this._elbowConfig = this._validateElbowConfig(config.elbow);

            // Calculate geometry based on style
            if (this._elbowConfig.style === 'segmented') {
                this._elbowGeometry = this._calculateSegmentedGeometry(this._elbowConfig);
            } else {
                this._elbowGeometry = this._calculateSimpleElbowGeometry(this._elbowConfig);
            }

            lcardsLog.debug(`[LCARdSElbow] Elbow config processed`, {
                type: this._elbowConfig.type,
                style: this._elbowConfig.style,
                geometry: this._elbowGeometry
            });
        } else {
            lcardsLog.warn(`[LCARdSElbow] No elbow config provided - using defaults`);
            this._elbowConfig = this._getDefaultElbowConfig();
            this._elbowGeometry = this._calculateSimpleElbowGeometry(this._elbowConfig);
        }

        // Adjust text positioning based on elbow type
        this._adjustTextForElbow();
    }

    /**
     * First update lifecycle hook - subscribe to theme input_number entities
     * @protected
     */
    _handleFirstUpdate(changedProps) {
        super._handleFirstUpdate?.(changedProps);

        // Subscribe to theme input_number entities if configured to use them
        this._subscribeToThemeEntities();
    }

    /**
     * HASS update lifecycle hook - update theme dimensions if entities changed
     * @protected
     */
    _handleHassUpdate(newHass, oldHass) {
        super._handleHassUpdate?.(newHass, oldHass);

        // Check if theme entities have changed
        this._updateThemeDimensionsFromHass();
    }

    /**
     * Subscribe to theme input_number entities for dynamic updates
     * @private
     */
    _subscribeToThemeEntities() {
        if (!this.hass || !this._elbowConfig) return;

        // Handle both simple and segmented modes
        const segment = this._elbowConfig.style === 'segmented'
            ? this._elbowConfig.segments?.outer_segment
            : this._elbowConfig.segment;

        if (!segment) return;

        // Cleanup existing subscriptions
        this._unsubscribeThemeEntities();

        // Check if using theme entities
        const useThemeHorizontal = segment.bar_height === 'theme' || segment.bar_height === 'input_number.lcars_horizontal';
        const useThemeVertical = segment.bar_width === 'theme' || segment.bar_width === 'input_number.lcars_vertical';

        if (useThemeHorizontal) {
            const entityId = 'input_number.lcars_horizontal';
            if (this.hass.states[entityId]) {
                lcardsLog.debug(`[LCARdSElbow] Subscribing to theme entity: ${entityId}`);
                // We'll update on HASS changes via _handleHassUpdate
                this._themeEntityUnsubscribes.push(() => {
                    lcardsLog.debug(`[LCARdSElbow] Unsubscribed from ${entityId}`);
                });
            } else {
                lcardsLog.warn(`[LCARdSElbow] Theme entity ${entityId} not found in HASS`);
            }
        }

        if (useThemeVertical) {
            const entityId = 'input_number.lcars_vertical';
            if (this.hass.states[entityId]) {
                lcardsLog.debug(`[LCARdSElbow] Subscribing to theme entity: ${entityId}`);
                // We'll update on HASS changes via _handleHassUpdate
                this._themeEntityUnsubscribes.push(() => {
                    lcardsLog.debug(`[LCARdSElbow] Unsubscribed from ${entityId}`);
                });
            } else {
                lcardsLog.warn(`[LCARdSElbow] Theme entity ${entityId} not found in HASS`);
            }
        }
    }

    /**
     * Unsubscribe from theme entities
     * @private
     */
    _unsubscribeThemeEntities() {
        this._themeEntityUnsubscribes.forEach(unsub => unsub());
        this._themeEntityUnsubscribes = [];
    }

    /**
     * Update theme dimensions from HASS state
     * @private
     */
    _updateThemeDimensionsFromHass() {
        if (!this.hass || !this._elbowConfig) return;

        // Handle both simple and segmented modes
        // Simple mode: config.elbow.segment
        // Segmented mode: config.elbow.segments.outer_segment (for theme checking)
        const segment = this._elbowConfig.style === 'segmented'
            ? this._elbowConfig.segments?.outer_segment
            : this._elbowConfig.segment;

        if (!segment) return;

        let dimensionsChanged = false;

        // Check horizontal (bar_height)
        const useThemeHorizontal = segment.bar_height === 'theme' || segment.bar_height === 'input_number.lcars_horizontal';
        if (useThemeHorizontal) {
            const entity = this.hass.states['input_number.lcars_horizontal'];
            if (entity) {
                const newValue = parseFloat(entity.state);
                if (this._themeBarDimensions.horizontal !== newValue) {
                    this._themeBarDimensions.horizontal = newValue;
                    dimensionsChanged = true;
                    lcardsLog.debug(`[LCARdSElbow] Theme horizontal updated: ${newValue}px`);
                }
            }
        } else {
            this._themeBarDimensions.horizontal = null;
        }

        // Check vertical (bar_width)
        const useThemeVertical = segment.bar_width === 'theme' || segment.bar_width === 'input_number.lcars_vertical';
        if (useThemeVertical) {
            const entity = this.hass.states['input_number.lcars_vertical'];
            if (entity) {
                const newValue = parseFloat(entity.state);
                if (this._themeBarDimensions.vertical !== newValue) {
                    this._themeBarDimensions.vertical = newValue;
                    dimensionsChanged = true;
                    lcardsLog.debug(`[LCARdSElbow] Theme vertical updated: ${newValue}px`);
                }
            }
        } else {
            this._themeBarDimensions.vertical = null;
        }

        // Recalculate geometry if dimensions changed
        if (dimensionsChanged) {
            lcardsLog.debug(`[LCARdSElbow] Recalculating geometry due to theme entity changes`);

            // Recalculate based on style
            if (this._elbowConfig.style === 'segmented') {
                this._elbowGeometry = this._calculateSegmentedGeometry(this._elbowConfig);
            } else {
                this._elbowGeometry = this._calculateSimpleElbowGeometry(this._elbowConfig);
            }

            this.requestUpdate();
        }
    }

    /**
     * Override button's segment animation setup - elbows don't use button segments
     * @protected
     */
    _setupSegmentAnimations() {
        // Elbow cards render their own SVG geometry, not button segments
        // Skip button's segment animation setup to avoid warnings
        return;
    }

    /**
     * Disconnect callback - cleanup theme entity subscriptions
     * @protected
     */
    disconnectedCallback() {
        this._unsubscribeThemeEntities();
        super.disconnectedCallback();
    }

    /**
     * Validate and normalize elbow configuration
     * @param {Object} elbowConfig - Raw elbow config from card config
     * @returns {Object} Validated elbow configuration
     * @private
     */
    _validateElbowConfig(elbowConfig) {
        // Get valid types from core component registry
        const validTypes = getElbowTypeNames();
        const type = validTypes.includes(elbowConfig.type)
            ? elbowConfig.type
            : 'header-left';

        if (!validTypes.includes(elbowConfig.type)) {
            lcardsLog.warn(`[LCARdSElbow] Invalid elbow type "${elbowConfig.type}", defaulting to "header-left". Valid types: ${validTypes.join(', ')}`);
        }

        // Get valid styles from the component's features
        const component = getElbowComponent(type);
        const validStyles = component?.features || ['simple'];
        const style = validStyles.includes(elbowConfig.style) ? elbowConfig.style : validStyles[0];

        if (elbowConfig.style && !validStyles.includes(elbowConfig.style)) {
            lcardsLog.warn(`[LCARdSElbow] Invalid style "${elbowConfig.style}" for type "${type}". Valid styles: ${validStyles.join(', ')}. Defaulting to "${validStyles[0]}"`);
        }

        // Parse segment configuration
        let segmentConfig;

        if (style === 'simple') {
            // Simple style: single segment
            const segment = elbowConfig.segment || {};

            // Parse bar dimensions - support 'theme' keyword
            let bar_width = segment.bar_width;
            let bar_height = segment.bar_height;

            // Store the raw value for later resolution
            if (bar_width === 'theme' || bar_width === 'input_number.lcars_vertical') {
                // Will be resolved dynamically from HASS state
                bar_width = 'theme';
            } else {
                bar_width = this._parseUnit(bar_width ?? 90);
            }

            if (bar_height === 'theme' || bar_height === 'input_number.lcars_horizontal') {
                // Will be resolved dynamically from HASS state
                bar_height = 'theme';
            } else if (bar_height !== undefined) {
                bar_height = this._parseUnit(bar_height);
            } else {
                // Default: same as bar_width (if bar_width is not 'theme')
                bar_height = bar_width === 'theme' ? 'theme' : bar_width;
            }

            // Parse outer curve - 'auto' means use bar_width / 2
            let outer_curve = segment.outer_curve;
            if (outer_curve === 'auto' || outer_curve === undefined) {
                outer_curve = 'auto'; // Will be resolved in geometry calculation
            } else {
                outer_curve = this._parseUnit(outer_curve);
            }

            // Parse inner curve - defaults to LCARS formula (outer_curve / 2)
            let inner_curve;
            if (segment.inner_curve !== undefined) {
                inner_curve = this._parseUnit(segment.inner_curve);
            } else {
                // LCARS formula: inner = outer / 2 (will be calculated)
                inner_curve = undefined;
            }

            segmentConfig = {
                bar_width,
                bar_height,
                outer_curve,
                inner_curve,
                color: segment.color
            };

        } else {
            // Segmented style: outer and inner segments
            segmentConfig = {
                gap: this._parseUnit(elbowConfig.segments?.gap ?? 4),

                // Outer segment (the frame)
                outer_segment: elbowConfig.segments?.outer_segment ? {
                    bar_width: this._parseUnit(elbowConfig.segments.outer_segment.bar_width),
                    bar_height: elbowConfig.segments.outer_segment.bar_height ?
                        this._parseUnit(elbowConfig.segments.outer_segment.bar_height) : undefined,
                    outer_curve: elbowConfig.segments.outer_segment.outer_curve ?
                        this._parseUnit(elbowConfig.segments.outer_segment.outer_curve) : undefined,
                    inner_curve: elbowConfig.segments.outer_segment.inner_curve ?
                        this._parseUnit(elbowConfig.segments.outer_segment.inner_curve) : undefined,
                    color: elbowConfig.segments.outer_segment.color
                } : null,

                // Inner segment (the content area)
                inner_segment: elbowConfig.segments?.inner_segment ? {
                    bar_width: this._parseUnit(elbowConfig.segments.inner_segment.bar_width),
                    bar_height: elbowConfig.segments.inner_segment.bar_height ?
                        this._parseUnit(elbowConfig.segments.inner_segment.bar_height) : undefined,
                    outer_curve: elbowConfig.segments.inner_segment.outer_curve ?
                        this._parseUnit(elbowConfig.segments.inner_segment.outer_curve) : undefined,
                    inner_curve: elbowConfig.segments.inner_segment.inner_curve ?
                        this._parseUnit(elbowConfig.segments.inner_segment.inner_curve) : undefined,
                    color: elbowConfig.segments.inner_segment.color
                } : null
            };
        }

        return {
            type,
            style,
            segment: style === 'simple' ? segmentConfig : null,
            segments: style === 'segmented' ? segmentConfig : null,
            colors: elbowConfig.colors || {}
        };
    }

    /**
     * Get default elbow configuration from schema
     * @returns {Object} Default elbow config
     * @private
     */
    _getDefaultElbowConfig() {
        // Get defaults from schema for consistency
        const schema = getElbowSchema({
            availablePresets: [],
            positionEnum: []
        });

        const segmentDefaults = schema.properties.elbow.properties.segment.default || {
            bar_width: 90,
            bar_height: 90,
            outer_curve: 'auto'
        };

        return {
            type: 'header-left',
            style: 'simple',
            segment: { ...segmentDefaults }
        };
    }

    /**
     * Calculate elbow geometry for simple style
     * @param {Object} config - Validated elbow configuration
     * @returns {Object} Computed geometry for rendering
     * @private
     */
    _calculateSimpleElbowGeometry(config) {
        const { type, segment } = config;

        // Resolve theme values to actual dimensions
        let bar_width = segment.bar_width;
        let bar_height = segment.bar_height;
        let outer_curve = segment.outer_curve;
        let inner_curve = segment.inner_curve;

        // Resolve bar_width (vertical dimension in LCARS)
        if (bar_width === 'theme') {
            bar_width = this._themeBarDimensions?.vertical ?? 90;
            lcardsLog.debug(`[LCARdSElbow] Resolved bar_width from theme: ${bar_width}px`);
        }

        // Resolve bar_height (horizontal dimension in LCARS)
        if (bar_height === 'theme') {
            bar_height = this._themeBarDimensions?.horizontal ?? 90;
            lcardsLog.debug(`[LCARdSElbow] Resolved bar_height from theme: ${bar_height}px`);
        }

        // Resolve outer_curve ('auto' means bar_width / 2)
        if (outer_curve === 'auto') {
            outer_curve = bar_width / 2;
            lcardsLog.debug(`[LCARdSElbow] Calculated auto outer_curve: ${outer_curve}px`);
        }

        // Resolve inner_curve (defaults to outer_curve / 2 - LCARS formula)
        if (inner_curve === undefined) {
            inner_curve = outer_curve / 2;
            lcardsLog.debug(`[LCARdSElbow] Calculated LCARS inner_curve: ${inner_curve}px`);
        }

        return {
            type,  // Full type string (e.g., 'header-left', 'corner-inset-left', etc.)
            horizontal: bar_width,   // Sidebar width
            vertical: bar_height,    // Top bar height
            outerRadius: outer_curve,
            innerRadius: inner_curve
        };
    }

    /**
     * Calculate segmented elbow geometry (Picard-style double elbow)
     *
     * Creates two concentric elbows with a gap between them.
     * Each segment has 4 parameters: bar_width, bar_height, outer_curve, inner_curve
     * Sensible defaults provided for all optional parameters.
     *
     * @param {Object} config - Validated elbow configuration
     * @returns {Object} Computed segment geometries
     * @private
     */
    _calculateSegmentedGeometry(config) {
        const { type, segments } = config;

        if (!segments || !segments.outer_segment || !segments.inner_segment) {
            lcardsLog.error(`[LCARdSElbow] Segmented style requires outer_segment and inner_segment config`);
            return null;
        }

        const { gap, outer_segment, inner_segment } = segments;

        // Validate required parameters
        if (!outer_segment.bar_width) {
            lcardsLog.error(`[LCARdSElbow] outer_segment.bar_width is required`);
            return null;
        }
        if (!inner_segment.bar_width) {
            lcardsLog.error(`[LCARdSElbow] inner_segment.bar_width is required`);
            return null;
        }

        // === OUTER SEGMENT ===
        // Apply defaults
        const outerHorizontal = outer_segment.bar_width;
        const outerVertical = outer_segment.bar_height ?? outer_segment.bar_width;
        const outerSegmentOuterRadius = outer_segment.outer_curve ?? outer_segment.bar_width / 2;
        const outerSegmentInnerRadius = outer_segment.inner_curve ?? outerSegmentOuterRadius / 2;

        // === INNER SEGMENT ===
        // Apply defaults
        const innerHorizontal = inner_segment.bar_width;
        const innerVertical = inner_segment.bar_height ?? inner_segment.bar_width;

        // Default for inner outer_curve: concentric calculation
        const innerSegmentOuterRadius = inner_segment.outer_curve ??
            Math.max(0, outerSegmentInnerRadius - gap);

        // Default for inner inner_curve: LCARS formula
        const innerSegmentInnerRadius = inner_segment.inner_curve ??
            innerSegmentOuterRadius / 2;

        // Calculate positioning offset for inner segment
        // header-left: inner is right+down from outer
        // header-right: inner is down from outer (no x offset)
        // footer-left: inner is right from outer (no y offset)
        // footer-right: inner has no offset (overlaps at corner)
        const innerOffset = {
            x: side === 'left' ? (outerHorizontal + gap) : 0,
            y: position === 'header' ? (outerVertical + gap) : 0
        };

        lcardsLog.debug(`[LCARdSElbow] Segmented geometry:`, {
            gap,
            outer_segment: {
                bar_width: outerHorizontal,
                bar_height: outerVertical,
                outer_curve: outerSegmentOuterRadius,
                inner_curve: outerSegmentInnerRadius
            },
            inner_segment: {
                bar_width: innerHorizontal,
                bar_height: innerVertical,
                outer_curve: innerSegmentOuterRadius,
                inner_curve: innerSegmentInnerRadius
            },
            offset: innerOffset
        });

        return {
            type,
            outer: {
                horizontal: outerHorizontal,
                vertical: outerVertical,
                outerRadius: outerSegmentOuterRadius,
                innerRadius: outerSegmentInnerRadius,
                color: outer_segment.color
            },
            inner: {
                horizontal: innerHorizontal,
                vertical: innerVertical,
                outerRadius: innerSegmentOuterRadius,
                innerRadius: innerSegmentInnerRadius,
                color: inner_segment.color
            },
            gap,
            offset: innerOffset
        };
    }

    /**
     * Adjust text positioning based on elbow type
     * Auto-configure padding and alignment for optimal LCARS aesthetics
     * @private
     */
    _adjustTextForElbow() {
        if (!this._elbowConfig || !this._elbowConfig.type) return;

        // Get position and side from component layout metadata
        const component = getElbowComponent(this._elbowConfig.type);
        const position = component?.layout?.position || 'header';
        const side = component?.layout?.side || 'left';

        const config = this.config;

        // Initialize text config if needed
        if (!config.text) config.text = {};

        // Calculate padding to clear elbow bars
        let horizontalPadding, verticalPadding;

        if (this._elbowConfig.style === 'simple') {
            horizontalPadding = this._elbowConfig.segment.bar_width + 20;
            verticalPadding = this._elbowConfig.segment.bar_height + 10;
        } else {
            // For segmented, use outer segment dimensions
            horizontalPadding = this._elbowConfig.segments.outer_segment.bar_width + 20;
            verticalPadding = (this._elbowConfig.segments.outer_segment.bar_height ||
                              this._elbowConfig.segments.outer_segment.bar_width) + 10;
        }

        // Set defaults for all text fields if not explicitly set
        Object.keys(config.text).forEach(fieldId => {
            const field = config.text[fieldId];
            if (!field) return;

            // Set alignment based on elbow side if not explicitly set
            if (!field.align) {
                field.align = side === 'left' ? 'left' : 'right';
            }

            // Auto-adjust padding based on elbow position
            if (field.padding_left === undefined && side === 'left') {
                field.padding_left = horizontalPadding;
            }
            if (field.padding_right === undefined && side === 'right') {
                field.padding_right = horizontalPadding;
            }
            if (field.padding_top === undefined && position === 'header') {
                field.padding_top = verticalPadding;
            }
            if (field.padding_bottom === undefined && position === 'footer') {
                field.padding_bottom = verticalPadding;
            }
        });

        lcardsLog.trace(`[LCARdSElbow] Auto-adjusted text padding for ${this._elbowConfig.type}`);
    }

    /**
     * Parse CSS unit value to number (pixels)
     *
     * Note: This is intentionally kept as a local method rather than using a shared
     * utility to ensure stable behavior independent of parent class changes and to
     * maintain encapsulation of elbow-specific configuration parsing.
     *
     * @param {string|number} value - Value with or without unit
     * @returns {number} Numeric value in pixels
     * @private
     */
    _parseUnit(value) {
        if (typeof value === 'number') return value;
        if (typeof value === 'string') {
            const parsed = parseFloat(value);
            return isNaN(parsed) ? 0 : parsed;
        }
        return 0;
    }

    /**
     * Resolve theme tokens in a color value
     * Handles both simple strings and state-based color objects
     * @param {string|Object} colorValue - Color value (string or state object)
     * @param {string} [currentState] - Current button/entity state for state-based colors
     * @returns {string} Resolved CSS color value
     * @private
     */
    _resolveColorValue(colorValue, currentState = 'default') {
        if (!colorValue) return null;

        // Handle state-based color object
        if (typeof colorValue === 'object') {
            const stateColor = colorValue[currentState] || colorValue.default;
            if (!stateColor) return null;
            // Recursively resolve the state-specific color
            return this._resolveColorValue(stateColor, currentState);
        }

        // Handle simple string color
        if (typeof colorValue === 'string') {
            // Check if it's a theme token (theme:path.to.token)
            if (colorValue.startsWith('theme:')) {
                const tokenPath = colorValue.replace('theme:', '');
                const resolvedValue = this.getThemeToken(tokenPath, colorValue);

                // If resolved value is still a theme token or computed token, resolve it again
                if (resolvedValue && resolvedValue !== colorValue) {
                    return this._resolveColorValue(resolvedValue, currentState);
                }

                return resolvedValue || colorValue;
            }

            // Return as-is (CSS color, var(), rgb(), etc.)
            return colorValue;
        }

        return null;
    }

    /**
     * Get the background color for the elbow (or a specific segment)
     * Uses state-aware color resolution with rule patch support
     * @param {string} [segmentType] - Optional segment type ('outer' or 'inner' for segmented mode)
     * @param {Object} [segmentConfig] - Optional segment configuration object
     * @returns {string} CSS background color
     * @private
     */
    _getElbowColor(segmentType = null, segmentConfig = null) {
        // Get current button state for state-aware color resolution
        const state = this._getButtonState();

        // For segmented mode with segment-specific entity
        if (segmentType && segmentConfig?.entity_id) {
            const entity = this.hass.states[segmentConfig.entity_id];
            if (entity) {
                const actualEntityState = entity.state;
                const classifiedState = this._getEntityState(entity);
                const backgroundColors = this._buttonStyle?.card?.color?.background;

                // Try state-specific color first
                const stateColor = resolveStateColor({
                    actualState: actualEntityState,
                    classifiedState: classifiedState,
                    colorConfig: backgroundColors
                });
                if (stateColor) {
                    return this._resolveColorValue(stateColor, classifiedState);
                }
            }
        }

        // For segmented mode with static/state-based color in segment config
        if (segmentType && segmentConfig?.color) {
            const actualEntityState = this._entity?.state;
            const resolvedColor = resolveStateColor({
                actualState: actualEntityState,
                classifiedState: state,
                colorConfig: segmentConfig.color
            });
            if (resolvedColor) {
                const resolved = this._resolveColorValue(resolvedColor, state);
                if (resolved) return resolved;
            }
        }

        // Priority 1: Simple elbow - check segment.color from elbow config
        if (this._elbowConfig?.segment?.color) {
            const actualEntityState = this._entity?.state;
            const resolvedColor = resolveStateColor({
                actualState: actualEntityState,
                classifiedState: state,
                colorConfig: this._elbowConfig.segment.color
            });
            if (resolvedColor) {
                const resolved = this._resolveColorValue(resolvedColor, state);
                if (resolved) return resolved;
            }
        }

        // Priority 2: Explicit color override in elbow.colors.background (legacy support)
        if (this._elbowConfig?.colors?.background) {
            const actualEntityState = this._entity?.state;
            const resolvedColor = resolveStateColor({
                actualState: actualEntityState,
                classifiedState: state,
                colorConfig: this._elbowConfig.colors.background
            });
            if (resolvedColor) {
                const resolved = this._resolveColorValue(resolvedColor, state);
                if (resolved) return resolved;
            }
        }

        // Priority 3: Use button state color from _buttonStyle (includes rule patches and config.style)
        const actualEntityState = this._entity?.state;
        const stateColor = resolveStateColor({
            actualState: actualEntityState,
            classifiedState: state,
            colorConfig: this._buttonStyle?.card?.color?.background
        });
        if (stateColor) {
            const resolved = this._resolveColorValue(stateColor, state);
            if (resolved) return resolved;
        }

        // Priority 4: Theme token fallback
        const themeColor = this.getThemeToken('colors.accent.primary', 'var(--lcars-orange, #FF9900)');
        return themeColor;
    }

    /**
     * Generate SVG path for the LCARS elbow shape
     *
     * The elbow path creates an L-shaped figure with a curved corner.
     * It's constructed as a single closed path that includes:
     * - The horizontal bar (along top or bottom edge)
     * - The curved corner (quarter circle arc)
     * - The vertical bar (along left or right edge)
     *
     * @param {number} width - Total button width
     * @param {number} height - Total button height
     * @returns {string} SVG path data string
     * @private
     */
    _generateElbowPath(width, height) {
        const g = this._elbowGeometry;
        if (!g) return '';

        const { position, side, horizontal, vertical, outerRadius, innerRadius } = g;

        // Basic validation: ensure radii are non-negative
        // Allow large radii for LineOverlay-style arcs (uniform width curved lines)
        // Only clamp to prevent extreme values that would break rendering
        const maxOuterRadius = Math.max(width, height); // Allow up to the larger dimension
        const clampedOuterRadius = Math.max(0, Math.min(outerRadius, maxOuterRadius));

        // Inner radius should be smaller than outer, with minimum 1px gap
        const clampedInnerRadius = Math.max(0, Math.min(innerRadius, clampedOuterRadius - 1));

        // Get component from registry using the full type
        const elbowType = g.type;
        const component = getElbowComponent(elbowType);

        if (!component || !component.pathGenerator) {
            lcardsLog.error(`[LCARdSElbow] No path generator for type: ${elbowType}`);
            return '';
        }

        // Pass geometry and container dimensions to generator
        const generatorConfig = {
            geometry: {
                type: elbowType,
                horizontal,
                vertical,
                outerRadius: clampedOuterRadius,
                innerRadius: clampedInnerRadius
            },
            container: { width, height }
        };

        return component.pathGenerator(generatorConfig);
    }

    /**
     * Generate the elbow button SVG
     * Overrides the parent to render elbow shape instead of button
     * @param {number} width - SVG width
     * @param {number} height - SVG height
     * @param {Object} config - Button configuration
     * @returns {string} SVG markup string
     * @private
     */
    _generateButtonSVG(width, height, config) {
        // Route to segmented rendering if style is 'segmented'
        if (this._elbowConfig?.style === 'segmented') {
            return this._generateSegmentedElbowSVG(width, height, config);
        }

        // Simple elbow rendering
        // Get elbow color (state-aware)
        const backgroundColor = this._getElbowColor();

        // Generate the elbow path
        const elbowPath = this._generateElbowPath(width, height);

        if (!elbowPath) {
            // Fallback to parent rendering if no elbow geometry
            return super._generateButtonSVG(width, height, config);
        }

        // Get button state for text color
        const buttonState = this._buttonStyle?._currentState || this._getButtonState();
        const actualEntityState = this._entity?.state;

        // Text color: text.default.color.{state}
        // Try actual entity state first (e.g., "heat"), then fall back to classified state (e.g., "inactive")
        const textColor = resolveStateColor({
            actualState: actualEntityState,
            classifiedState: buttonState,
            colorConfig: this._buttonStyle?.text?.default?.color,
            fallback: 'var(--lcars-color-text, #000000)'
        });

        // Font properties
        const fontSize = this._buttonStyle?.text?.default?.font_size || '14px';
        const fontWeight = this._buttonStyle?.text?.default?.font_weight || 'bold';
        const fontFamily = this._buttonStyle?.text?.default?.font_family || "'LCARS', 'Antonio', sans-serif";

        // Process icon if present
        let iconData = { markup: '', widthUsed: 0 };
        if (this._processedIcon) {
            const iconArea = this._processedIcon?.area || 'none';
            if (iconArea !== 'none') {
                iconData = this._generateAreaBasedIconMarkup(this._processedIcon, width, height);
            } else {
                iconData = this._generateFlexibleIconMarkup(this._processedIcon, width, height);
            }
        }

        // Check if we're in icon-only mode
        const iconOnly = this._processedIcon?.iconOnly && this._processedIcon?.show;

        // Generate text markup
        let textMarkup = '';
        if (!iconOnly) {
            const textFields = this._resolveTextConfiguration();
            // Convert object to array of field values
            const textFieldsArray = Object.values(textFields);
            const processedFields = this._processTextFieldsForElbow(textFieldsArray, width, height);
            textMarkup = this._generateTextElements(processedFields);
        }

        // Compose SVG
        const svgString = `
            <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
                <g data-button-id="elbow"
                   data-overlay-id="button"
                   class="elbow-group"
                   style="pointer-events: visiblePainted; cursor: pointer;">
                    <!-- Elbow background shape -->
                    <path
                        class="elbow-bg button-clickable"
                        d="${elbowPath}"
                        fill="${backgroundColor}"
                        style="pointer-events: all;"
                    />
                    ${iconData.markup}
                    ${textMarkup}
                </g>
            </svg>
        `.trim();

        return svgString;
    }

    /**
     * Generate segmented (Picard-style) elbow button SVG
     * Renders two concentric elbows with a gap between them
     * @param {number} width - SVG width
     * @param {number} height - SVG height
     * @param {Object} config - Button configuration
     * @returns {string} SVG markup string
     * @private
     */
    _generateSegmentedElbowSVG(width, height, config) {
        // Calculate segmented geometry
        const segmentGeom = this._calculateSegmentedGeometry(this._elbowConfig);

        if (!segmentGeom) {
            lcardsLog.error(`[LCARdSElbow] Failed to calculate segmented geometry`);
            return super._generateButtonSVG(width, height, config);
        }

        const { type, outer, inner, offset, gap } = segmentGeom;

        // Get colors for outer and inner segments using state-aware resolution
        const outerSegmentConfig = this._elbowConfig.segments.outer_segment;
        const innerSegmentConfig = this._elbowConfig.segments.inner_segment;

        const outerColor = this._getElbowColor('outer', outerSegmentConfig);
        const innerColor = this._getElbowColor('inner', innerSegmentConfig);

        // Generate outer segment path (larger elbow)
        const outerPath = this._generateSegmentPath(
            width, height,
            outer.horizontal, outer.vertical,
            outer.outerRadius, outer.innerRadius,
            type
        );

        // Generate inner segment path (smaller elbow)
        // The inner segment must fit within the outer segment's content area
        // Reduce width by outer horizontal bar + gap
        // Reduce height by outer vertical bar + gap
        const innerWidth = width - (outer.horizontal + gap);
        const innerHeight = height - (outer.vertical + gap);

        const innerPath = this._generateSegmentPath(
            innerWidth, innerHeight,
            inner.horizontal, inner.vertical,
            inner.outerRadius, inner.innerRadius,
            type
        );

        // Process icon and text (same as simple elbow)
        let iconData = { markup: '', widthUsed: 0 };
        if (this._processedIcon) {
            const iconArea = this._processedIcon?.area || 'none';
            if (iconArea !== 'none') {
                iconData = this._generateAreaBasedIconMarkup(this._processedIcon, width, height);
            } else {
                iconData = this._generateFlexibleIconMarkup(this._processedIcon, width, height);
            }
        }

        const iconOnly = this._processedIcon?.iconOnly && this._processedIcon?.show;

        let textMarkup = '';
        if (!iconOnly) {
            const textFields = this._resolveTextConfiguration();
            const textFieldsArray = Object.values(textFields);
            const processedFields = this._processTextFieldsForElbow(textFieldsArray, width, height);
            textMarkup = this._generateTextElements(processedFields);
        }

        // Compose segmented SVG with two elbow paths
        const svgString = `
            <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
                <g data-button-id="elbow"
                   data-overlay-id="button"
                   class="elbow-group segmented-elbow"
                   style="pointer-events: visiblePainted; cursor: pointer;">
                    <!-- Outer segment (larger) -->
                    <path
                        class="elbow-outer button-clickable"
                        data-overlay-id="outer-segment"
                        d="${outerPath}"
                        fill="${outerColor}"
                        style="pointer-events: all;"
                    />
                    <!-- Inner segment (smaller) -->
                    <g transform="translate(${offset.x}, ${offset.y})">
                        <path
                            class="elbow-inner button-clickable"
                            data-overlay-id="inner-segment"
                            d="${innerPath}"
                            fill="${innerColor}"
                            style="pointer-events: all;"
                        />
                    </g>
                    ${iconData.markup}
                    ${textMarkup}
                </g>
            </svg>
        `.trim();

        return svgString;
    }

    /**
     * Generate a single segment path for segmented elbows
     * Wrapper around _generateElbowPath with segment-specific dimensions
     * @private
     */
    _generateSegmentPath(width, height, horizontal, vertical, outerRadius, innerRadius, type) {
        // Temporarily set geometry for path generation
        const tempGeometry = {
            type,
            horizontal,
            vertical,
            outerRadius,
            innerRadius
        };

        const savedGeometry = this._elbowGeometry;
        this._elbowGeometry = tempGeometry;

        const path = this._generateElbowPath(width, height);

        this._elbowGeometry = savedGeometry;

        return path;
    }

    /**
     * Process text fields with elbow-specific positioning
     * Adjusts text position to be within the content area (not overlapping the elbow)
     * @private
     */
    _processTextFieldsForElbow(textFields, width, height) {
        if (!textFields || !Array.isArray(textFields) || textFields.length === 0) {
            return [];
        }

        const g = this._elbowGeometry;
        if (!g) {
            // Fallback to parent processing
            return this._processTextFields(textFields, width, height, this._processedIcon);
        }

        // Get position and side from component layout metadata
        const component = getElbowComponent(g.type);
        const position = component?.layout?.position || 'header';
        const side = component?.layout?.side || 'left';

        const { horizontal, vertical } = g;

        // Calculate content area (area not occupied by elbow bars)
        let contentArea = {
            x: 0,
            y: 0,
            width: width,
            height: height
        };

        // Adjust content area based on elbow position
        if (position === 'header') {
            // Horizontal bar at top, vertical bar on left or right
            contentArea.y = vertical;
            contentArea.height = height - vertical;
        } else {
            // Footer: horizontal bar at bottom
            contentArea.height = height - vertical;
        }

        if (side === 'left') {
            // Vertical bar on left
            contentArea.x = horizontal;
            contentArea.width = width - horizontal;
        } else {
            // Vertical bar on right
            contentArea.width = width - horizontal;
        }

        // Process each text field with adjusted positioning
        return textFields.map(field => {
            const processed = this._processTextField(field, width, height, this._processedIcon);

            // Adjust position to be within content area
            // Only adjust if no explicit x/y was provided
            if (!field.x && !field.x_percent) {
                // Horizontal positioning
                if (side === 'left') {
                    // Content area is on the right of vertical bar
                    const effectiveWidth = contentArea.width;
                    if (field.position?.includes('left') || field.align === 'left') {
                        processed.x = contentArea.x + (processed.padding?.left || 10);
                        processed.anchor = 'start';
                    } else if (field.position?.includes('right') || field.align === 'right') {
                        processed.x = width - (processed.padding?.right || 10);
                        processed.anchor = 'end';
                    } else {
                        // Center in content area
                        processed.x = contentArea.x + effectiveWidth / 2;
                        processed.anchor = 'middle';
                    }
                } else {
                    // Content area is on the left of vertical bar
                    const effectiveWidth = contentArea.width;
                    if (field.position?.includes('left') || field.align === 'left') {
                        processed.x = processed.padding?.left || 10;
                        processed.anchor = 'start';
                    } else if (field.position?.includes('right') || field.align === 'right') {
                        processed.x = contentArea.width - (processed.padding?.right || 10);
                        processed.anchor = 'end';
                    } else {
                        // Center in content area
                        processed.x = effectiveWidth / 2;
                        processed.anchor = 'middle';
                    }
                }
            }

            if (!field.y && !field.y_percent) {
                // Vertical positioning
                if (position === 'header') {
                    // Content area is below horizontal bar
                    if (field.position?.includes('top')) {
                        processed.y = contentArea.y + (processed.padding?.top || 10) + (processed.size / 2);
                    } else if (field.position?.includes('bottom')) {
                        processed.y = height - (processed.padding?.bottom || 10);
                    } else {
                        // Center vertically in content area
                        processed.y = contentArea.y + contentArea.height / 2;
                    }
                } else {
                    // Footer: content area is above horizontal bar
                    if (field.position?.includes('top')) {
                        processed.y = (processed.padding?.top || 10) + (processed.size / 2);
                    } else if (field.position?.includes('bottom')) {
                        processed.y = contentArea.height - (processed.padding?.bottom || 10);
                    } else {
                        // Center vertically in content area
                        processed.y = contentArea.height / 2;
                    }
                }
            }

            return processed;
        });
    }

    /**
     * Process a single text field (helper method)
     * @private
     */
    _processTextField(field, width, height, iconConfig) {
        // Get state for color resolution
        const state = this._getButtonState();
        const actualEntityState = this._entity?.state;

        // Default text styling from button style
        const defaultStyle = this._buttonStyle?.text?.default || {};

        // Resolve font size
        const fontSize = field.font_size || defaultStyle.font_size || 14;

        // Resolve color (state-aware)
        let color;
        if (field.color) {
            color = resolveStateColor({
                actualState: actualEntityState,
                classifiedState: state,
                colorConfig: field.color,
                fallback: '#000000'
            });
        } else {
            color = resolveStateColor({
                actualState: actualEntityState,
                classifiedState: state,
                colorConfig: defaultStyle.color,
                fallback: '#000000'
            });
        }

        return {
            id: field.id || `text-${Math.random().toString(36).substring(2, 11)}`,
            content: field.content || '',
            x: field.x || 0,
            y: field.y || 0,
            size: fontSize,
            color: color,
            font_weight: field.font_weight || defaultStyle.font_weight || 'bold',
            font_family: field.font_family || defaultStyle.font_family || "'LCARS', 'Antonio', sans-serif",
            anchor: field.anchor || 'middle',
            baseline: field.baseline || 'central',
            rotation: field.rotation || 0,
            padding: {
                top: field.padding_top || field.padding || 0,
                right: field.padding_right || field.padding || 0,
                bottom: field.padding_bottom || field.padding || 0,
                left: field.padding_left || field.padding || 0
            },
            position: field.position,
            background: field.background,
            background_padding: field.background_padding,
            background_radius: field.background_radius
        };
    }

    /**
     * Get card size for Home Assistant layout
     * Elbows typically use more vertical space
     * @returns {number} Grid rows
     */
    getCardSize() {
        return this.config.grid_rows || 2;
    }

    /**
     * Get layout options for Home Assistant grid system
     * @returns {Object} Layout configuration
     */
    getLayoutOptions() {
        // HA uses grid_options.columns and grid_options.rows
        // Provide sensible defaults for elbow cards
        const gridOptions = this.config.grid_options || {};
        return {
            grid_columns: gridOptions.columns || 4,  // Default to 4 columns
            grid_rows: gridOptions.rows || 2,        // Default to 2 rows (elbows need more vertical space)
            grid_min_columns: 1,
            grid_min_rows: 1
        };
    }

    /**
     * Get stub config for card picker
     * @returns {Object} Example configuration
     */
    static getStubConfig() {
        return {
            type: 'custom:lcards-elbow',
            elbow: {
                type: 'header-left',
                segment: {
                    bar_width: 90,
                    bar_height: 20
                },
                radius: {
                    outer: 'auto'
                    // inner calculated automatically using LCARS formula (outer / 2)
                    // or specify inner_factor for legacy behavior
                }
            }
        };
    }

    /**
     * Get config element for HA editor
     * @returns {HTMLElement}
     */
    static getConfigElement() {
        // Static import - editor bundled with card (webpack config doesn't support splitting)
        return document.createElement('lcards-elbow-editor');
    }

    /**
     * Register schema with CoreConfigManager
     * Called by lcards.js after core initialization
     * @static
     */
    static registerSchema() {
        const configManager = window.lcards?.core?.configManager;

        if (!configManager) {
            lcardsLog.error('[LCARdSElbow] CoreConfigManager not available for schema registration');
            return;
        }

        // Get available presets from StylePresetManager (inherits from button)
        const stylePresetManager = window.lcards?.core?.stylePresetManager;
        const availablePresets = stylePresetManager?.getAvailablePresets('button') || [];

        lcardsLog.debug('[LCARdSElbow] Registering schema with presets:', availablePresets);

        // Register behavioral defaults (elbow extends button, inherits defaults)
        configManager.registerCardDefaults('elbow', {
            enable_hold_action: true,   // Hold actions enabled (inherited)
            enable_double_tap: false    // Double-tap disabled by default (inherited)
        });

        // Position options with proper labels (same as button)
        const positionEnum = [
            'top-left', 'top-center', 'top-right',
            'left-center', 'center', 'right-center',
            'bottom-left', 'bottom-center', 'bottom-right',
            'top', 'bottom', 'left', 'right'
        ];

        // Build complete schema using schema factory function
        const elbowSchema = getElbowSchema({
            availablePresets,
            positionEnum
        });

        // Register JSON schema for validation (v1.24.0+)
        configManager.registerCardSchema('elbow', elbowSchema, { version: '1.24.0' });

        lcardsLog.debug('[LCARdSElbow] Schema registered with CoreConfigManager');
    }
}

// NOTE: Card registration moved to src/lcards.js initializeCustomCard().then()
// This ensures all core singletons are initialized before cards can be instantiated.

lcardsLog.info('[LCARdSElbow] Card module loaded');
