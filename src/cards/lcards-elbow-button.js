/**
 * LCARdS Elbow Button Card
 *
 * Extends simple-button with classic LCARS elbow/corner treatments.
 * Elbows are positioned borders with rounded corners that create the
 * iconic LCARS interface aesthetic (header/footer "caps").
 *
 * Features:
 * - 4 elbow positions (header-left/right, footer-left/right)
 * - LCARS arc formula-based geometry for authentic curves
 * - Configurable bar dimensions (horizontal/vertical)
 * - Inherits all SimpleButton functionality (actions, rules, animations, templates)
 *
 * The elbow creates an L-shaped design with:
 * - A horizontal bar (top or bottom edge)
 * - A vertical bar (left or right edge)
 * - A curved corner connecting them (the "elbow")
 *
 * LCARS Arc Formula:
 * The outer arc radius equals the width of the vertical bar (sidebar).
 * The inner arc radius is typically the vertical bar width divided by inner_factor.
 *
 * Configuration:
 * ```yaml
 * type: custom:lcards-elbow-button
 * entity: light.example
 * elbow:
 *   type: header-left          # Position of the elbow corner
 *   border:
 *     horizontal: 90           # Width of vertical sidebar (pixels)
 *     vertical: 20             # Height of horizontal bar (pixels)
 *   radius:
 *     outer: 40                # Outer corner radius (or 'auto' to match horizontal)
 *     inner_factor: 4          # Inner radius = outer / factor
 * ```
 *
 * @extends {LCARdSSimpleButtonCard}
 */

import { html, css } from 'lit';
import { unsafeHTML } from 'lit/directives/unsafe-html.js';
import { LCARdSSimpleButtonCard } from './lcards-simple-button.js';
import { lcardsLog } from '../utils/lcards-logging.js';

export class LCARdSElbowButtonCard extends LCARdSSimpleButtonCard {

    /** Card type identifier for CoreConfigManager */
    static CARD_TYPE = 'elbow-button';

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
            this._elbowGeometry = this._calculateElbowGeometry(this._elbowConfig);

            lcardsLog.debug(`[LCARdSElbowButton] Elbow config processed`, {
                type: this._elbowConfig.type,
                geometry: this._elbowGeometry
            });
        } else {
            lcardsLog.warn(`[LCARdSElbowButton] No elbow config provided - using defaults`);
            this._elbowConfig = this._getDefaultElbowConfig();
            this._elbowGeometry = this._calculateElbowGeometry(this._elbowConfig);
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

        // Parse border dimensions
        const horizontal = this._parseUnit(elbowConfig.border?.horizontal ?? 90);
        const vertical = this._parseUnit(elbowConfig.border?.vertical ?? 20);

        // Parse radius - 'auto' means use horizontal (sidebar width) as outer radius
        let outerRadius = elbowConfig.radius?.outer;
        if (outerRadius === 'auto' || outerRadius === undefined) {
            outerRadius = horizontal;
        } else if (typeof outerRadius === 'string') {
            // Could be CSS variable or number string
            outerRadius = this._parseUnit(outerRadius);
            if (outerRadius === 0) {
                outerRadius = horizontal; // Fallback to horizontal if parsing failed
            }
        }

        const innerFactor = elbowConfig.radius?.inner_factor ?? 4;

        return {
            type,
            style: elbowConfig.style || 'simple',
            border: {
                horizontal: horizontal,
                vertical: vertical,
                gap: this._parseUnit(elbowConfig.border?.gap ?? 4)
            },
            radius: {
                outer: outerRadius,
                inner: outerRadius / innerFactor,
                inner_factor: innerFactor
            },
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
            border: {
                horizontal: 90,
                vertical: 20,
                gap: 4
            },
            radius: {
                outer: 90, // Match horizontal by default
                inner: 22.5, // 90/4
                inner_factor: 4
            },
            colors: {}
        };
    }

    /**
     * Calculate elbow layer geometry using LCARS formulas
     *
     * The elbow shape consists of:
     * - A vertical bar (sidebar) on the left or right
     * - A horizontal bar (top bar) on the top or bottom
     * - A curved corner connecting them
     *
     * The geometry is calculated so that the outer arc radius matches
     * the width of the vertical bar for authentic LCARS proportions.
     *
     * @param {Object} config - Validated elbow configuration
     * @returns {Object} Computed geometry for rendering
     * @private
     */
    _calculateElbowGeometry(config) {
        const { type, border, radius } = config;
        const [position, side] = type.split('-'); // 'header-left' → ['header', 'left']

        // LCARS arc calculations
        // The outer arc circumference follows: arc = radius² × π (for quarter circle)
        // We use the horizontal (sidebar width) as the outer arc radius
        const outerArcRadius = radius.outer;
        const innerArcRadius = radius.inner;

        // Calculate arc lengths (for reference/debugging)
        const outerArcLength = (Math.PI / 2) * outerArcRadius; // Quarter circle arc
        const innerArcLength = (Math.PI / 2) * innerArcRadius;

        lcardsLog.trace(`[LCARdSElbowButton] Arc calculations`, {
            outerRadius: outerArcRadius,
            innerRadius: innerArcRadius,
            outerArcLength: outerArcLength.toFixed(2),
            innerArcLength: innerArcLength.toFixed(2)
        });

        return {
            position,  // 'header' or 'footer'
            side,      // 'left' or 'right'
            horizontal: border.horizontal,  // Sidebar width
            vertical: border.vertical,      // Top bar height
            outerRadius: outerArcRadius,
            innerRadius: innerArcRadius,
            outerArcLength,
            innerArcLength
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

        // Calculate padding to clear elbow borders
        const horizontalPadding = this._elbowConfig.border.horizontal + 20;
        const verticalPadding = this._elbowConfig.border.vertical + 10;

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
        const stateColor = this._buttonStyle?.card?.color?.background?.[state] ||
                          this._buttonStyle?.card?.color?.background?.default;

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

        // Clamp radii to prevent overflow
        // Outer radius cannot exceed either the horizontal or vertical bar size
        const maxOuterRadius = Math.min(horizontal, height - vertical);
        const clampedOuterRadius = Math.max(0, Math.min(outerRadius, maxOuterRadius));
        // Ensure inner radius is non-negative and less than outer radius
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
     * Shape description:
     * - Starts at top-left of horizontal bar
     * - Goes right along top edge
     * - Down right edge of horizontal bar
     * - Curves with inner arc toward the vertical bar
     * - Down the right edge of vertical bar
     * - Left along bottom of vertical bar
     * - Up left edge of vertical bar
     * - Outer arc curving to horizontal bar
     * - Closes path
     *
     * @private
     */
    _generateHeaderLeftPath(width, height, horizontal, vertical, outerRadius, innerRadius) {
        // Key points:
        // - Outer arc center: (horizontal, vertical)
        // - Inner arc center: (horizontal, vertical)
        // - Horizontal bar: y = 0 to y = vertical, x = horizontal to x = width
        // - Vertical bar: x = 0 to x = horizontal, y = vertical to y = height

        // SVG arc: A rx ry x-axis-rotation large-arc-flag sweep-flag x y
        // sweep-flag: 0 = counter-clockwise, 1 = clockwise

        const p = [
            // Start at top of outer arc (on the top edge)
            `M ${outerRadius} 0`,
            // Line along top edge to the right
            `L ${width} 0`,
            // Line down right edge of horizontal bar
            `L ${width} ${vertical}`,
            // Line left along bottom of horizontal bar to where inner arc starts
            `L ${horizontal + innerRadius} ${vertical}`,
            // Inner arc: curves from bottom of horizontal bar to right of vertical bar
            // Goes clockwise (sweep-flag = 1) from horizontal to vertical
            `A ${innerRadius} ${innerRadius} 0 0 1 ${horizontal} ${vertical + innerRadius}`,
            // Line down the right edge of vertical bar
            `L ${horizontal} ${height}`,
            // Line left along bottom of vertical bar
            `L 0 ${height}`,
            // Line up left edge of vertical bar to outer arc start
            `L 0 ${outerRadius}`,
            // Outer arc: curves from left edge to top edge
            // Goes clockwise (sweep-flag = 1)
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
            // Inner arc: curves from vertical bar to horizontal bar
            `A ${innerRadius} ${innerRadius} 0 0 1 ${vBarLeft - innerRadius} ${vertical}`,
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
            // Inner arc: curves from horizontal bar to vertical bar
            `A ${innerRadius} ${innerRadius} 0 0 0 ${horizontal} ${hBarTop - innerRadius}`,
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
            // Inner arc: curves from vertical bar to horizontal bar
            `A ${innerRadius} ${innerRadius} 0 0 0 ${vBarLeft - innerRadius} ${hBarTop}`,
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
            const processedFields = this._processTextFieldsForElbow(textFields, width, height);
            textMarkup = this._generateTextElements(processedFields);
        }

        // Compose SVG
        const svgString = `
            <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
                <g data-button-id="elbow-button"
                   data-overlay-id="elbow-button"
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
     * Process text fields with elbow-specific positioning
     * Adjusts text position to be within the content area (not overlapping the elbow)
     * @private
     */
    _processTextFieldsForElbow(textFields, width, height) {
        if (!textFields || textFields.length === 0) {
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
        if (typeof field.color === 'object') {
            color = field.color[state] || field.color.default || '#000000';
        } else {
            color = field.color || (
                typeof defaultStyle.color === 'object'
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
            type: 'custom:lcards-elbow-button',
            entity: 'light.example',
            elbow: {
                type: 'header-left',
                border: {
                    horizontal: 90,
                    vertical: 20
                },
                radius: {
                    outer: 'auto',
                    inner_factor: 4
                }
            },
            text: {
                name: {
                    content: 'Engineering'
                }
            },
            tap_action: {
                action: 'toggle'
            }
        };
    }
}

// NOTE: Card registration moved to src/lcards.js initializeCustomCard().then()
// This ensures all core singletons are initialized before cards can be instantiated.

lcardsLog.info('[LCARdSElbowButtonCard] Card module loaded');
