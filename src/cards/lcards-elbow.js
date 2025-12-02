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

export class LCARdSElbow extends LCARdSButton {

    /** Card type identifier for CoreConfigManager */
    static CARD_TYPE = 'elbow';

    static get properties() {
        return {
            ...super.properties,
            _elbowConfig: { type: Object, state: true },
            _elbowGeometry: { type: Object, state: true }
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

            lcardsLog.debug(`[LCARdSElbowButton] Elbow config processed`, {
                type: this._elbowConfig.type,
                style: this._elbowConfig.style,
                geometry: this._elbowGeometry
            });
        } else {
            lcardsLog.warn(`[LCARdSElbowButton] No elbow config provided - using defaults`);
            this._elbowConfig = this._getDefaultElbowConfig();
            this._elbowGeometry = this._calculateSimpleElbowGeometry(this._elbowConfig);
        }

        // Adjust text positioning based on elbow type
        this._adjustTextForElbow();
    }

    /**
     * Validate and normalize elbow configuration
     * @param {Object} elbowConfig - Raw elbow config from card config
     * @returns {Object} Validated elbow configuration
     * @private
     */
    _validateElbowConfig(elbowConfig) {
        const validTypes = ['header-left', 'header-right', 'footer-left', 'footer-right'];
        const type = validTypes.includes(elbowConfig.type)
            ? elbowConfig.type
            : 'header-left';

        if (!validTypes.includes(elbowConfig.type)) {
            lcardsLog.warn(`[LCARdSElbowButton] Invalid elbow type "${elbowConfig.type}", defaulting to "header-left"`);
        }

        // Parse style (simple or segmented)
        const validStyles = ['simple', 'segmented'];
        const style = validStyles.includes(elbowConfig.style) ? elbowConfig.style : 'simple';

        // Parse segment configuration
        let segmentConfig;

        if (style === 'simple') {
            // Simple style: single segment
            const segment = elbowConfig.segment || {};

            // Parse bar dimensions
            const bar_width = this._parseUnit(segment.bar_width ?? 90);
            const bar_height = segment.bar_height ?
                this._parseUnit(segment.bar_height) : bar_width;

            // Parse outer curve - 'auto' means use bar_width / 2
            let outer_curve = segment.outer_curve;
            if (outer_curve === 'auto' || outer_curve === undefined) {
                outer_curve = bar_width / 2;
            } else {
                outer_curve = this._parseUnit(outer_curve);
            }

            // Parse inner curve - defaults to LCARS formula (outer_curve / 2)
            let inner_curve;
            if (segment.inner_curve !== undefined) {
                inner_curve = this._parseUnit(segment.inner_curve);
            } else {
                // LCARS formula: inner = outer / 2
                inner_curve = outer_curve / 2;
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
     * Get default elbow configuration
     * @returns {Object} Default elbow config
     * @private
     */
    _getDefaultElbowConfig() {
        return {
            type: 'header-left',
            style: 'simple',
            segment: {
                bar_width: 90,
                bar_height: 90,
                outer_curve: 45,  // bar_width / 2
                inner_curve: 22.5 // outer_curve / 2 (LCARS formula)
            }
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
        const [position, side] = type.split('-'); // 'header-left' → ['header', 'left']

        return {
            position,  // 'header' or 'footer'
            side,      // 'left' or 'right'
            horizontal: segment.bar_width,   // Sidebar width
            vertical: segment.bar_height,    // Top bar height
            outerRadius: segment.outer_curve,
            innerRadius: segment.inner_curve
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
        const [position, side] = type.split('-');

        if (!segments || !segments.outer_segment || !segments.inner_segment) {
            lcardsLog.error(`[LCARdSElbowButton] Segmented style requires outer_segment and inner_segment config`);
            return null;
        }

        const { gap, outer_segment, inner_segment } = segments;

        // Validate required parameters
        if (!outer_segment.bar_width) {
            lcardsLog.error(`[LCARdSElbowButton] outer_segment.bar_width is required`);
            return null;
        }
        if (!inner_segment.bar_width) {
            lcardsLog.error(`[LCARdSElbowButton] inner_segment.bar_width is required`);
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
        const innerOffset = {
            x: side === 'left' ? (outerHorizontal + gap) : 0,
            y: position === 'header' ? (outerVertical + gap) : 0
        };

        lcardsLog.debug(`[LCARdSElbowButton] Segmented geometry:`, {
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
            position,
            side,
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

        const [position, side] = this._elbowConfig.type.split('-');
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

        lcardsLog.trace(`[LCARdSElbowButton] Auto-adjusted text padding for ${this._elbowConfig.type}`);
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
     * Get the background color for the elbow
     * Uses state-aware color resolution with rule patch support
     * @returns {string} CSS background color
     * @private
     */
    _getElbowColor() {
        // Priority 1: Explicit color override in elbow config
        if (this._elbowConfig?.colors?.background) {
            return this._elbowConfig.colors.background;
        }

        // Priority 2: Use button state color from _buttonStyle (includes rule patches)
        const state = this._getButtonState();
        const backgroundColors = this._buttonStyle?.card?.color?.background;
        const stateColor = backgroundColors?.[state] || backgroundColors?.default;

        if (stateColor) {
            return stateColor;
        }

        // Priority 3: Theme token fallback
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

        // Generate path based on elbow type
        // Each path is a closed shape representing the elbow

        if (position === 'header' && side === 'left') {
            // Header-left: Elbow in top-left corner
            // Vertical bar on left, horizontal bar on top
            return this._generateHeaderLeftPath(width, height, horizontal, vertical, clampedOuterRadius, clampedInnerRadius);
        } else if (position === 'header' && side === 'right') {
            // Header-right: Elbow in top-right corner
            // Vertical bar on right, horizontal bar on top
            return this._generateHeaderRightPath(width, height, horizontal, vertical, clampedOuterRadius, clampedInnerRadius);
        } else if (position === 'footer' && side === 'left') {
            // Footer-left: Elbow in bottom-left corner
            // Vertical bar on left, horizontal bar on bottom
            return this._generateFooterLeftPath(width, height, horizontal, vertical, clampedOuterRadius, clampedInnerRadius);
        } else if (position === 'footer' && side === 'right') {
            // Footer-right: Elbow in bottom-right corner
            // Vertical bar on right, horizontal bar on bottom
            return this._generateFooterRightPath(width, height, horizontal, vertical, clampedOuterRadius, clampedInnerRadius);
        }

        return '';
    }

    /**
     * Generate header-left elbow path
     * Elbow in top-left corner: vertical bar on left, horizontal bar on top
     *
     * Shape description (drawing clockwise from top-left):
     * - Start at top edge where outer arc ends
     * - Right along top edge
     * - Down to horizontal bar bottom
     * - Left to inner arc start
     * - Inner arc (concave) to vertical bar
     * - Down vertical bar
     * - Left along bottom
     * - Up vertical bar left edge
     * - Outer arc (convex) back to start
     *
     * Arc geometry:
     * - Outer arc center: (outerRadius, outerRadius)
     * - Inner arc center: (horizontal, vertical)
     *
     * @private
     */
    _generateHeaderLeftPath(width, height, horizontal, vertical, outerRadius, innerRadius) {
        // For seamless joins, arcs must be tangent to straight edges
        // Outer arc: connects left edge (x=0) to top edge (y=0)
        //   Start: (0, outerRadius) - tangent is horizontal (pointing right)
        //   End: (outerRadius, 0) - tangent is vertical (pointing down)
        //   Center: (outerRadius, outerRadius)
        //
        // Inner arc: connects horizontal bar to vertical bar
        //   Start: (horizontal + innerRadius, vertical) - tangent is horizontal (pointing left)
        //   End: (horizontal, vertical + innerRadius) - tangent is vertical (pointing up)
        //   Center: (horizontal, vertical)

        const p = [
            // Start at where outer arc meets top edge (tangent is vertical)
            `M ${outerRadius} 0`,
            // Line along top edge to the right
            `L ${width} 0`,
            // Line down to bottom of horizontal bar
            `L ${width} ${vertical}`,
            // Line left along bottom of horizontal bar to inner arc start (tangent is horizontal)
            `L ${horizontal + innerRadius} ${vertical}`,
            // Inner arc: curves inward (concave)
            // From (horizontal + innerRadius, vertical) to (horizontal, vertical + innerRadius)
            // Goes counter-clockwise (sweep-flag = 0) to curve inward
            `A ${innerRadius} ${innerRadius} 0 0 0 ${horizontal} ${vertical + innerRadius}`,
            // Line down right edge of vertical bar
            `L ${horizontal} ${height}`,
            // Line left along bottom
            `L 0 ${height}`,
            // Line up left edge of vertical bar to outer arc start (tangent is horizontal)
            `L 0 ${outerRadius}`,
            // Outer arc: curves outward (convex)
            // From (0, outerRadius) to (outerRadius, 0)
            // Goes clockwise (sweep-flag = 1) to curve outward
            `A ${outerRadius} ${outerRadius} 0 0 1 ${outerRadius} 0`,
            // Close path
            `Z`
        ];

        return p.join(' ');
    }

    /**
     * Generate header-right elbow path
     * Elbow in top-right corner: vertical bar on right, horizontal bar on top
     * @private
     */
    _generateHeaderRightPath(width, height, horizontal, vertical, outerRadius, innerRadius) {
        // Mirror of header-left
        // Vertical bar on right side: x = (width - horizontal) to x = width
        // Horizontal bar: x = 0 to x = (width - horizontal)

        const vBarLeft = width - horizontal; // Left edge of vertical bar

        const p = [
            // Start at top-right corner (with outer arc radius offset)
            `M ${width - outerRadius} 0`,
            // Outer arc: curves from top to right edge
            `A ${outerRadius} ${outerRadius} 0 0 1 ${width} ${outerRadius}`,
            // Line down right edge to bottom
            `L ${width} ${height}`,
            // Line left along bottom of vertical bar
            `L ${vBarLeft} ${height}`,
            // Line up right edge of content area (left edge of vertical bar)
            `L ${vBarLeft} ${vertical + innerRadius}`,
            // Inner arc: curves inward from vertical bar to horizontal bar
            // Goes counter-clockwise (sweep-flag = 0) to curve inward
            `A ${innerRadius} ${innerRadius} 0 0 0 ${vBarLeft - innerRadius} ${vertical}`,
            // Line left along bottom of horizontal bar
            `L 0 ${vertical}`,
            // Line up left edge
            `L 0 0`,
            // Line right along top to arc start
            `L ${width - outerRadius} 0`,
            // Close path
            `Z`
        ];

        return p.join(' ');
    }

    /**
     * Generate footer-left elbow path
     * Elbow in bottom-left corner: vertical bar on left, horizontal bar on bottom
     * @private
     */
    _generateFooterLeftPath(width, height, horizontal, vertical, outerRadius, innerRadius) {
        // Vertical bar on left: x = 0 to x = horizontal
        // Horizontal bar on bottom: y = (height - vertical) to y = height

        const hBarTop = height - vertical; // Top edge of horizontal bar

        const p = [
            // Start at bottom-left corner (with outer arc radius offset)
            `M 0 ${height - outerRadius}`,
            // Outer arc: curves from left edge to bottom
            `A ${outerRadius} ${outerRadius} 0 0 0 ${outerRadius} ${height}`,
            // Line right along bottom edge
            `L ${width} ${height}`,
            // Line up right edge of horizontal bar
            `L ${width} ${hBarTop}`,
            // Line left along top of horizontal bar to inner arc start
            `L ${horizontal + innerRadius} ${hBarTop}`,
            // Inner arc: curves inward from horizontal bar to vertical bar
            // Goes clockwise (sweep-flag = 1) to curve inward
            `A ${innerRadius} ${innerRadius} 0 0 1 ${horizontal} ${hBarTop - innerRadius}`,
            // Line up left edge of vertical bar
            `L ${horizontal} 0`,
            // Line left along top
            `L 0 0`,
            // Line down left edge to arc start
            `L 0 ${height - outerRadius}`,
            // Close path
            `Z`
        ];

        return p.join(' ');
    }

    /**
     * Generate footer-right elbow path
     * Elbow in bottom-right corner: vertical bar on right, horizontal bar on bottom
     * @private
     */
    _generateFooterRightPath(width, height, horizontal, vertical, outerRadius, innerRadius) {
        // Mirror of footer-left
        // Vertical bar on right: x = (width - horizontal) to x = width
        // Horizontal bar on bottom: y = (height - vertical) to y = height

        const vBarLeft = width - horizontal;
        const hBarTop = height - vertical;

        const p = [
            // Start at bottom-right corner (with outer arc radius offset)
            `M ${width} ${height - outerRadius}`,
            // Line up right edge
            `L ${width} 0`,
            // Line left along top
            `L ${vBarLeft} 0`,
            // Line down left edge of vertical bar to inner arc start
            `L ${vBarLeft} ${hBarTop - innerRadius}`,
            // Inner arc: curves inward from vertical bar to horizontal bar
            // Goes clockwise (sweep-flag = 1) to curve inward
            `A ${innerRadius} ${innerRadius} 0 0 1 ${vBarLeft - innerRadius} ${hBarTop}`,
            // Line left along top of horizontal bar
            `L 0 ${hBarTop}`,
            // Line down left edge
            `L 0 ${height}`,
            // Line right along bottom to arc start
            `L ${width - outerRadius} ${height}`,
            // Outer arc: curves from bottom to right edge
            `A ${outerRadius} ${outerRadius} 0 0 0 ${width} ${height - outerRadius}`,
            // Close path
            `Z`
        ];

        return p.join(' ');
    }

    /**
     * Generate the elbow button SVG
     * Overrides the parent to render elbow shape instead of simple button
     * @param {number} width - SVG width
     * @param {number} height - SVG height
     * @param {Object} config - Button configuration
     * @returns {string} SVG markup string
     * @private
     */
    _generateSimpleButtonSVG(width, height, config) {
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
            return super._generateSimpleButtonSVG(width, height, config);
        }

        // Get button state for text color
        const buttonState = this._buttonStyle?._currentState || this._getButtonState();

        // Text color: text.default.color.{state}
        const textColor = this._buttonStyle?.text?.default?.color?.[buttonState] ||
                         this._buttonStyle?.text?.default?.color?.default ||
                         'var(--lcars-color-text, #000000)';

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
                   data-overlay-id="simple-button"
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
            lcardsLog.error(`[LCARdSElbowButton] Failed to calculate segmented geometry`);
            return this._generateSimpleElbowFallback(width, height, config);
        }

        const { position, side, outer, inner, offset } = segmentGeom;

        // Get colors for outer and inner segments
        const backgroundColor = this._getElbowColor();
        const outerColor = outer.color || backgroundColor;
        const innerColor = inner.color || outerColor;

        // Generate outer segment path (larger elbow)
        const outerPath = this._generateSegmentPath(
            width, height,
            outer.horizontal, outer.vertical,
            outer.outerRadius, outer.innerRadius,
            position, side
        );

        // Generate inner segment path (smaller elbow)
        // Reduce dimensions by the offset since inner is positioned inside outer
        const innerWidth = width - offset.x;
        const innerHeight = height - offset.y;
        const innerPath = this._generateSegmentPath(
            innerWidth, innerHeight,
            inner.horizontal, inner.vertical,
            inner.outerRadius, inner.innerRadius,
            position, side
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
                   data-overlay-id="simple-button"
                   class="elbow-group segmented-elbow"
                   style="pointer-events: visiblePainted; cursor: pointer;">
                    <!-- Outer segment (larger) -->
                    <path
                        class="elbow-outer button-clickable"
                        d="${outerPath}"
                        fill="${outerColor}"
                        style="pointer-events: all;"
                    />
                    <!-- Inner segment (smaller) -->
                    <g transform="translate(${offset.x}, ${offset.y})">
                        <path
                            class="elbow-inner button-clickable"
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
    _generateSegmentPath(width, height, horizontal, vertical, outerRadius, innerRadius, position, side) {
        // Temporarily set geometry for path generation
        const tempGeometry = {
            position,
            side,
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

        const { position, side, horizontal, vertical } = g;

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

        // Default text styling from button style
        const defaultStyle = this._buttonStyle?.text?.default || {};

        // Resolve font size
        const fontSize = field.font_size || defaultStyle.font_size || 14;

        // Resolve color (state-aware)
        let color;
        if (field.color && typeof field.color === 'object') {
            color = field.color[state] || field.color.default || '#000000';
        } else {
            color = field.color || (
                defaultStyle.color && typeof defaultStyle.color === 'object'
                    ? defaultStyle.color[state] || defaultStyle.color.default
                    : defaultStyle.color
            ) || '#000000';
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
     * Get stub config for card picker
     * @returns {Object} Example configuration
     */
    static getStubConfig() {
        return {
            type: 'custom:lcards-elbow',
            elbow: {
                type: 'header-left',
                border: {
                    horizontal: 90,
                    vertical: 20
                },
                radius: {
                    outer: 'auto'
                    // inner calculated automatically using LCARS formula (outer / 2)
                    // or specify inner_factor for legacy behavior
                }
            },
            text: {
                name: {
                    show: false
                },
                state: {
                    show: false
                },
                label: {
                    show: false
                }
            }
        };
    }
}

// NOTE: Card registration moved to src/lcards.js initializeCustomCard().then()
// This ensures all core singletons are initialized before cards can be instantiated.

lcardsLog.info('[LCARdSElbow] Card module loaded');
