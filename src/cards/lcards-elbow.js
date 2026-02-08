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
        this._themeBarDimensions = { horizontal: null, vertical: null, angle: null };
        this._themeEntityUnsubscribes = []; // Track subscriptions for cleanup

        // Interaction states (hover/pressed)
        // Simple elbow (single segment)
        this._elbowHoverStyle = null;
        this._elbowPressedStyle = null;
        this._elbowInteractivityCleanup = null;

        // Segmented elbow (outer segment)
        this._elbowOuterHoverStyle = null;
        this._elbowOuterPressedStyle = null;
        this._elbowOuterInteractivityCleanup = null;

        // Segmented elbow (inner segment)
        this._elbowInnerHoverStyle = null;
        this._elbowInnerPressedStyle = null;
        this._elbowInnerInteractivityCleanup = null;
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

        // Initialize position-aware default colors
        this._initializeElbowDefaultColors();
    }

    /**
     * Initialize position-aware default state-based colors for elbows
     * Sets card.color.background defaults based on elbow type and position
     * MUST override any button preset colors
     *
     * Token resolution strategy:
     * 1. Try component-specific: components.elbow.{type}.background.*
     * 2. Fall back to position-specific: components.elbow.{header|footer}.background.*
     * 3. Ultimate fallback handled in _getElbowColor()
     *
     * This allows themes to define colors for specific elbow types (e.g., diagonal-cap-left)
     * while falling back to header/footer defaults for standard elbows.
     *
     * @private
     */
    _initializeElbowDefaultColors() {
        if (!this._elbowConfig) {
            lcardsLog.debug('[LCARdSElbow] _initializeElbowDefaultColors: No elbow config, skipping');
            return;
        }

        // Get component metadata
        const component = getElbowComponent(this._elbowConfig.type);
        const position = component?.layout?.position || 'header';
        const componentType = this._elbowConfig.type; // e.g., 'diagonal-cap-left', 'header-left'

        lcardsLog.debug(`[LCARdSElbow] Initializing elbow colors for type: ${componentType}, position: ${position}`);

        // Try to get component-specific colors from theme first
        const themeManager = this._singletons?.themeManager || window.lcards?.core?.themeManager;

        let tokenBase;
        if (themeManager) {
            // Check if component-specific tokens exist
            const componentTokenPath = `components.elbow.${componentType}.background`;
            const hasComponentTokens = themeManager.getToken(`${componentTokenPath}.default`, null) !== null;

            if (hasComponentTokens) {
                // Use component-specific tokens
                tokenBase = `theme:${componentTokenPath}`;
                lcardsLog.debug(`[LCARdSElbow] Using component-specific tokens: ${componentTokenPath}`);
            } else {
                // Fall back to position-specific tokens
                const positionTokenPath = position === 'footer'
                    ? 'components.elbow.footer.background'
                    : 'components.elbow.header.background';
                tokenBase = `theme:${positionTokenPath}`;
                lcardsLog.debug(`[LCARdSElbow] Falling back to position tokens: ${positionTokenPath}`);
            }
        } else {
            // No theme manager - use position-based tokens as fallback
            lcardsLog.warn('[LCARdSElbow] No theme manager available, using position-based tokens');
            const positionTokenPath = position === 'footer'
                ? 'components.elbow.footer.background'
                : 'components.elbow.header.background';
            tokenBase = `theme:${positionTokenPath}`;
        }

        // ALWAYS set elbow colors - override button preset defaults
        // Initialize nested structure if needed
        if (!this.config.style) this.config.style = {};
        if (!this.config.style.card) this.config.style.card = {};
        if (!this.config.style.card.color) this.config.style.card.color = {};

        // Set state-based colors using determined token path
        this.config.style.card.color.background = {
            default: `${tokenBase}.default`,
            active: `${tokenBase}.active`,
            inactive: `${tokenBase}.inactive`,
            unavailable: `${tokenBase}.unavailable`
        };

        lcardsLog.debug(`[LCARdSElbow] Set elbow background colors:`, {
            type: componentType,
            position,
            tokenBase,
            colors: this.config.style.card.color.background
        });
    }

    /**
     * Override button style resolution to inject elbow-specific colors
     * @protected
     */
    _resolveButtonStyleSync() {
        // Call parent to do normal button style resolution
        super._resolveButtonStyleSync();

        // Now inject elbow colors AFTER parent resolution
        // This ensures elbow colors aren't overwritten by button presets
        this._injectElbowColors();
    }

    /**
     * Inject elbow-specific colors into the resolved button style
     * Called after button style resolution to ensure colors aren't overwritten
     * Uses same fallback logic as _initializeElbowDefaultColors()
     * Also extracts interaction styles (hover/pressed) for dynamic state handling
     * @private
     */
    _injectElbowColors() {
        if (!this._elbowConfig || !this._buttonStyle) return;

        // Check if segmented or simple elbow
        const isSegmented = this._elbowConfig?.style === 'segmented';

        if (isSegmented) {
            // Extract interaction styles for OUTER segment
            const outerColor = this._elbowConfig.segments?.outer_segment?.color;
            if (outerColor) {
                const hoverColor = outerColor.hover;
                const pressedColor = outerColor.pressed;
                const resolvedHover = hoverColor ? this._resolveColorValue(hoverColor, this._getButtonState()) : null;
                const resolvedPressed = pressedColor ? this._resolveColorValue(pressedColor, this._getButtonState()) : null;

                this._elbowOuterHoverStyle = resolvedHover ? { backgroundColor: resolvedHover } : null;
                this._elbowOuterPressedStyle = resolvedPressed ? { backgroundColor: resolvedPressed } : null;

                lcardsLog.debug('[LCARdSElbow] Extracted outer segment interaction styles', {
                    hasHover: !!this._elbowOuterHoverStyle,
                    hasPressed: !!this._elbowOuterPressedStyle,
                    hoverColorResolved: resolvedHover,
                    pressedColorResolved: resolvedPressed
                });
            }

            // Extract interaction styles for INNER segment
            const innerColor = this._elbowConfig.segments?.inner_segment?.color;
            if (innerColor) {
                const hoverColor = innerColor.hover;
                const pressedColor = innerColor.pressed;
                const resolvedHover = hoverColor ? this._resolveColorValue(hoverColor, this._getButtonState()) : null;
                const resolvedPressed = pressedColor ? this._resolveColorValue(pressedColor, this._getButtonState()) : null;

                this._elbowInnerHoverStyle = resolvedHover ? { backgroundColor: resolvedHover } : null;
                this._elbowInnerPressedStyle = resolvedPressed ? { backgroundColor: resolvedPressed } : null;

                lcardsLog.debug('[LCARdSElbow] Extracted inner segment interaction styles', {
                    hasHover: !!this._elbowInnerHoverStyle,
                    hasPressed: !!this._elbowInnerPressedStyle,
                    hoverColorResolved: resolvedHover,
                    pressedColorResolved: resolvedPressed
                });
            }
        } else {
            // Simple elbow - extract from segment.color
            const segmentColor = this._elbowConfig.segment?.color;
            if (segmentColor) {
                const hoverColor = segmentColor.hover;
                const pressedColor = segmentColor.pressed;

                // Resolve theme tokens and CSS variables
                const resolvedHover = hoverColor ? this._resolveColorValue(hoverColor, this._getButtonState()) : null;
                const resolvedPressed = pressedColor ? this._resolveColorValue(pressedColor, this._getButtonState()) : null;

                this._elbowHoverStyle = resolvedHover ? { backgroundColor: resolvedHover } : null;
                this._elbowPressedStyle = resolvedPressed ? { backgroundColor: resolvedPressed } : null;

                lcardsLog.debug('[LCARdSElbow] Extracted simple segment interaction styles', {
                    hasHover: !!this._elbowHoverStyle,
                    hasPressed: !!this._elbowPressedStyle,
                    hoverColorResolved: resolvedHover,
                    pressedColorResolved: resolvedPressed
                });
            }
        }

        // Get component metadata
        const component = getElbowComponent(this._elbowConfig.type);
        const position = component?.layout?.position || 'header';
        const componentType = this._elbowConfig.type;

        // Apply same fallback logic as initialization
        const themeManager = this._singletons?.themeManager || window.lcards?.core?.themeManager;

        let tokenBase;
        if (themeManager) {
            // Check if component-specific tokens exist
            const componentTokenPath = `components.elbow.${componentType}.background`;
            const hasComponentTokens = themeManager.getToken(`${componentTokenPath}.default`, null) !== null;

            if (hasComponentTokens) {
                tokenBase = `theme:${componentTokenPath}`;
            } else {
                const positionTokenPath = position === 'footer'
                    ? 'components.elbow.footer.background'
                    : 'components.elbow.header.background';
                tokenBase = `theme:${positionTokenPath}`;
            }
        } else {
            const positionTokenPath = position === 'footer'
                ? 'components.elbow.footer.background'
                : 'components.elbow.header.background';
            tokenBase = `theme:${positionTokenPath}`;
        }

        // Inject elbow colors into resolved button style
        if (!this._buttonStyle.card) this._buttonStyle.card = {};
        if (!this._buttonStyle.card.color) this._buttonStyle.card.color = {};

        this._buttonStyle.card.color.background = {
            default: `${tokenBase}.default`,
            active: `${tokenBase}.active`,
            inactive: `${tokenBase}.inactive`,
            unavailable: `${tokenBase}.unavailable`
        };

        lcardsLog.debug(`[LCARdSElbow] Injected elbow colors:`, {
            type: componentType,
            position,
            tokenBase
        });
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
     * Lit lifecycle - called after every render when DOM updates
     * Setup interactivity on the rendered elbow element
     * @protected
     */
    updated(changedProps) {
        super.updated?.(changedProps);

        // Always re-setup interaction states after each render
        // This ensures handlers are attached to the current DOM element, not stale references
        const hasSimpleInteraction = this._elbowHoverStyle || this._elbowPressedStyle;
        const hasSegmentedInteraction = this._elbowOuterHoverStyle || this._elbowOuterPressedStyle ||
                                        this._elbowInnerHoverStyle || this._elbowInnerPressedStyle;

        if (hasSimpleInteraction || hasSegmentedInteraction) {
            lcardsLog.debug('[LCARdSElbow] Re-setting up interactivity after render');
            this._setupElbowInteractivity();
        }
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

        // Check if using theme angle
        const useThemeAngle = segment.diagonal_angle === 'theme' || segment.diagonal_angle === 'input_number.lcars_elbow_angle';
        if (useThemeAngle) {
            const entityId = 'input_number.lcars_elbow_angle';
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

        // Check angle (diagonal_angle)
        const useThemeAngle = segment.diagonal_angle === 'theme' || segment.diagonal_angle === 'input_number.lcars_elbow_angle';
        if (useThemeAngle) {
            const entity = this.hass.states['input_number.lcars_elbow_angle'];
            if (entity) {
                const newValue = parseFloat(entity.state);
                if (this._themeBarDimensions.angle !== newValue) {
                    this._themeBarDimensions.angle = newValue;
                    dimensionsChanged = true;
                    lcardsLog.debug(`[LCARdSElbow] Theme angle updated: ${newValue}°`);
                }
            }
        } else {
            this._themeBarDimensions.angle = null;
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

        // Clean up interaction event listeners
        if (this._elbowInteractivityCleanup) {
            this._elbowInteractivityCleanup();
            this._elbowInteractivityCleanup = null;
        }
        if (this._elbowOuterInteractivityCleanup) {
            this._elbowOuterInteractivityCleanup();
            this._elbowOuterInteractivityCleanup = null;
        }
        if (this._elbowInnerInteractivityCleanup) {
            this._elbowInnerInteractivityCleanup();
            this._elbowInnerInteractivityCleanup = null;
        }

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

            // Parse diagonal angle (for diagonal-cap variants) - support 'theme' keyword
            let diagonal_angle;
            if (segment.diagonal_angle === 'theme' || segment.diagonal_angle === 'input_number.lcars_elbow_angle') {
                // Will be resolved dynamically from HASS state
                diagonal_angle = 'theme';
            } else if (segment.diagonal_angle !== undefined) {
                diagonal_angle = parseFloat(segment.diagonal_angle);
            }

            segmentConfig = {
                bar_width,
                bar_height,
                outer_curve,
                inner_curve,
                diagonal_angle,
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
                    diagonal_angle: (elbowConfig.segments.outer_segment.diagonal_angle === 'theme' ||
                                    elbowConfig.segments.outer_segment.diagonal_angle === 'input_number.lcars_elbow_angle') ? 'theme' :
                                   (elbowConfig.segments.outer_segment.diagonal_angle !== undefined ?
                                    parseFloat(elbowConfig.segments.outer_segment.diagonal_angle) : undefined),
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
                    diagonal_angle: (elbowConfig.segments.inner_segment.diagonal_angle === 'theme' ||
                                    elbowConfig.segments.inner_segment.diagonal_angle === 'input_number.lcars_elbow_angle') ? 'theme' :
                                   (elbowConfig.segments.inner_segment.diagonal_angle !== undefined ?
                                    parseFloat(elbowConfig.segments.inner_segment.diagonal_angle) : undefined),
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
        let diagonal_angle = segment.diagonal_angle ?? 45; // Default 45° angle

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

        // Resolve diagonal_angle
        if (diagonal_angle === 'theme') {
            diagonal_angle = this._themeBarDimensions?.angle ?? 45;
            lcardsLog.debug(`[LCARdSElbow] Resolved diagonal_angle from theme: ${diagonal_angle}°`);
        }

        return {
            type,  // Full type string (e.g., 'header-left', 'corner-inset-left', etc.)
            horizontal: bar_width,   // Sidebar width
            vertical: bar_height,    // Top bar height
            outerRadius: outer_curve,
            innerRadius: inner_curve,
            diagonalAngle: diagonal_angle  // Angle for diagonal cuts (0-90°)
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
        let outerDiagonalAngle = outer_segment.diagonal_angle ?? 45;

        // Resolve theme angle if needed
        if (outerDiagonalAngle === 'theme') {
            outerDiagonalAngle = this._themeBarDimensions?.angle ?? 45;
            lcardsLog.debug(`[LCARdSElbow] Resolved outer diagonal_angle from theme: ${outerDiagonalAngle}°`);
        }

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
        let innerDiagonalAngle = inner_segment.diagonal_angle ?? outerDiagonalAngle;

        // Resolve theme angle if needed
        if (innerDiagonalAngle === 'theme') {
            innerDiagonalAngle = this._themeBarDimensions?.angle ?? outerDiagonalAngle;
            lcardsLog.debug(`[LCARdSElbow] Resolved inner diagonal_angle from theme: ${innerDiagonalAngle}°`);
        }

        // Get position and side from component layout metadata
        const component = getElbowComponent(type);
        const position = component?.layout?.position || 'header';
        const side = component?.layout?.side || 'left';

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
                diagonalAngle: outerDiagonalAngle,
                color: outer_segment.color
            },
            inner: {
                horizontal: innerHorizontal,
                vertical: innerVertical,
                outerRadius: innerSegmentOuterRadius,
                innerRadius: innerSegmentInnerRadius,
                diagonalAngle: innerDiagonalAngle,
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
     * Setup elbow interactivity for hover and pressed states
     * Uses base class method for consistent interaction handling
     * @private
     */
    _setupElbowInteractivity() {
        const isSegmented = this._elbowConfig?.style === 'segmented';

        if (isSegmented) {
            // Setup interactivity for OUTER segment
            const elbowOuter = this.shadowRoot?.querySelector('.elbow-outer');
            if (elbowOuter && (this._elbowOuterHoverStyle || this._elbowOuterPressedStyle)) {
                lcardsLog.debug('[LCARdSElbow] Setting up outer segment interactivity', {
                    hasHoverStyle: !!this._elbowOuterHoverStyle,
                    hasPressedStyle: !!this._elbowOuterPressedStyle,
                    hoverColor: this._elbowOuterHoverStyle?.backgroundColor
                });

                // Clean up previous listeners
                if (this._elbowOuterInteractivityCleanup) {
                    this._elbowOuterInteractivityCleanup();
                }

                this._elbowOuterInteractivityCleanup = this._setupBaseInteractivity(elbowOuter, {
                    hoverStyle: this._elbowOuterHoverStyle,
                    pressedStyle: this._elbowOuterPressedStyle,
                    getRestoreColor: () => this._getElbowColor('outer', this._elbowConfig.segments?.outer_segment)
                });
            }

            // Setup interactivity for INNER segment
            const elbowInner = this.shadowRoot?.querySelector('.elbow-inner');
            if (elbowInner && (this._elbowInnerHoverStyle || this._elbowInnerPressedStyle)) {
                lcardsLog.debug('[LCARdSElbow] Setting up inner segment interactivity', {
                    hasHoverStyle: !!this._elbowInnerHoverStyle,
                    hasPressedStyle: !!this._elbowInnerPressedStyle,
                    hoverColor: this._elbowInnerHoverStyle?.backgroundColor
                });

                // Clean up previous listeners
                if (this._elbowInnerInteractivityCleanup) {
                    this._elbowInnerInteractivityCleanup();
                }

                this._elbowInnerInteractivityCleanup = this._setupBaseInteractivity(elbowInner, {
                    hoverStyle: this._elbowInnerHoverStyle,
                    pressedStyle: this._elbowInnerPressedStyle,
                    getRestoreColor: () => this._getElbowColor('inner', this._elbowConfig.segments?.inner_segment)
                });
            }
        } else {
            // Simple elbow - single segment
            const elbowBg = this.shadowRoot?.querySelector('.elbow-bg');

            if (!elbowBg) {
                lcardsLog.warn('[LCARdSElbow] Cannot setup interactivity - .elbow-bg element not found');
                return;
            }

            lcardsLog.debug('[LCARdSElbow] Setting up simple elbow interactivity', {
                hasHoverStyle: !!this._elbowHoverStyle,
                hasPressedStyle: !!this._elbowPressedStyle,
                hoverColor: this._elbowHoverStyle?.backgroundColor,
                elementClass: elbowBg?.className
            });

            // Clean up previous listeners
            if (this._elbowInteractivityCleanup) {
                this._elbowInteractivityCleanup();
            }

            // Use base class method to setup interactivity
            this._elbowInteractivityCleanup = this._setupBaseInteractivity(elbowBg, {
                hoverStyle: this._elbowHoverStyle,
                pressedStyle: this._elbowPressedStyle,
                getRestoreColor: () => this._getElbowColor()
            });
        }
    }

    /**
     * Resolve color value with state-based support and theme token resolution
     * Uses base class method for consistent color resolution across all cards
     * @param {string|Object} colorValue - Color value (string or state object)
     * @param {string} [currentState] - Current button/entity state (not used, kept for compatibility)
     * @returns {string} Resolved CSS color value
     * @private
     */
    _resolveColorValue(colorValue, currentState = 'default') {
        // Use base class method for state-based color resolution with theme token support
        // The base class method handles both state selection and theme token resolution
        const resolved = this._resolveEntityStateColor(colorValue, null);

        if (!resolved) return null;

        // If base class didn't resolve theme token (returns theme:* as-is), resolve it here
        if (typeof resolved === 'string' && resolved.startsWith('theme:')) {
            const tokenPath = resolved.replace('theme:', '');
            const tokenValue = this.getThemeToken(tokenPath, resolved);
            lcardsLog.trace(`[LCARdSElbow] Resolved theme token "${resolved}" -> "${tokenValue}"`);
            return tokenValue;
        }

        return resolved;
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

        // Priority 3: Button style state-based colors (includes presets, config.style, rules)
        // Position-aware defaults are set in _initializeElbowDefaultColors()
        if (this._buttonStyle?.card?.color?.background) {
            const actualEntityState = this._entity?.state;
            const stateColor = resolveStateColor({
                actualState: actualEntityState,
                classifiedState: state,
                colorConfig: this._buttonStyle.card.color.background
            });

            lcardsLog.debug(`[LCARdSElbow] _getElbowColor - state: ${state}, actualState: ${actualEntityState}`);
            lcardsLog.debug(`[LCARdSElbow] _getElbowColor - colorConfig:`, this._buttonStyle.card.color.background);
            lcardsLog.debug(`[LCARdSElbow] _getElbowColor - resolvedStateColor:`, stateColor);

            if (stateColor) {
                const resolved = this._resolveColorValue(stateColor, state);
                lcardsLog.debug(`[LCARdSElbow] _getElbowColor - final resolved:`, resolved);
                if (resolved) return resolved;
            }
        }

        // Priority 4: Final fallback
        lcardsLog.warn('[LCARdSElbow] _getElbowColor - using final fallback color');
        return 'var(--lcars-orange, #FF9900)';
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

        const { position, side, horizontal, vertical, outerRadius, innerRadius, diagonalAngle } = g;

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
                innerRadius: clampedInnerRadius,
                diagonalAngle: diagonalAngle ?? 45  // Pass diagonal angle through
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
            outer.diagonalAngle,
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
            inner.diagonalAngle,
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
    _generateSegmentPath(width, height, horizontal, vertical, outerRadius, innerRadius, diagonalAngle, type) {
        // Temporarily set geometry for path generation
        const tempGeometry = {
            type,
            horizontal,
            vertical,
            outerRadius,
            innerRadius,
            diagonalAngle
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
     * Delegates to parent button card for standard text processing, then adjusts positions.
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

        // Convert array back to object for parent's _processTextFields
        const textFieldsObject = {};
        textFields.forEach(field => {
            const id = field.id || `field-${Math.random().toString(36).substring(2, 11)}`;
            textFieldsObject[id] = field;
        });

        // Let parent button card do the standard processing (show, text_transform, color, etc.)
        const processedFields = super._processTextFields(textFieldsObject, width, height, this._processedIcon);

        // Now adjust positions based on elbow content area
        // Get position and side from component layout metadata
        const component = getElbowComponent(g.type);
        const position = component?.layout?.position || 'header';
        const side = component?.layout?.side || 'left';

        // For segmented mode, use inner segment dimensions; for simple mode, use direct geometry
        const horizontal = g.inner ? g.inner.horizontal : g.horizontal;
        const vertical = g.inner ? g.inner.vertical : g.vertical;
        const offset = g.offset || { x: 0, y: 0 };

        // Calculate content area (area not occupied by elbow bars)
        let contentArea = {
            x: offset.x,
            y: offset.y,
            width: width,
            height: height
        };

        // Adjust content area based on elbow position
        if (position === 'header') {
            // Horizontal bar at top
            contentArea.y += vertical;
            contentArea.height -= vertical;
        } else {
            // Footer: horizontal bar at bottom
            contentArea.height -= vertical;
        }

        if (side === 'left') {
            // Vertical bar on left
            contentArea.x += horizontal;
            contentArea.width -= horizontal;
        } else {
            // Vertical bar on right
            contentArea.width -= horizontal;
        }

        // Adjust each processed field's position based on content area
        return processedFields.map(field => {
            const processed = { ...field };

            // Only adjust auto-positioned fields (those without explicit x/y)
            // Check if this came from a named position or auto-center (not explicit coords)
            const originalField = textFieldsObject[field.id];
            if (!originalField) return processed;

            const hasExplicitCoords = originalField.x !== null && originalField.x !== undefined &&
                                     originalField.y !== null && originalField.y !== undefined;
            const hasPercentCoords = originalField.x_percent !== null && originalField.x_percent !== undefined &&
                                    originalField.y_percent !== null && originalField.y_percent !== undefined;

            if (hasExplicitCoords || hasPercentCoords) {
                // User set explicit coordinates - don't adjust
                return processed;
            }

            // Determine if this is a center position (horizontally)
            const isCenterX = !originalField.position || originalField.position === 'center' ||
                             originalField.position?.includes('center');
            const isLeftAligned = originalField.position?.includes('left') || originalField.align === 'left';
            const isRightAligned = originalField.position?.includes('right') || originalField.align === 'right';

            // Determine vertical alignment first
            const isTopAligned = originalField.position?.includes('top');
            const isBottomAligned = originalField.position?.includes('bottom');

            // Determine if this is a center position (vertically)
            // Includes: 'center', 'left-center', 'right-center' (but not 'top-center' or 'bottom-center')
            const isCenterY = !originalField.position || originalField.position === 'center' ||
                             (originalField.position?.includes('center') && !isTopAligned && !isBottomAligned);

            // Adjust horizontal position based on content area
            if (side === 'left') {
                // Content area is on the right of vertical bar
                if (isLeftAligned) {
                    processed.x = contentArea.x + (processed.padding?.left || 10);
                } else if (isRightAligned) {
                    processed.x = width - (processed.padding?.right || 10);
                } else if (isCenterX) {
                    // Center within content area
                    processed.x = contentArea.x + (contentArea.width / 2);
                }
            } else {
                // Content area is on the left of vertical bar (side === 'right')
                if (isLeftAligned) {
                    processed.x = (processed.padding?.left || 10);
                } else if (isRightAligned) {
                    processed.x = contentArea.width - (processed.padding?.right || 10);
                } else if (isCenterX) {
                    // Center within content area
                    processed.x = contentArea.width / 2;
                }
            }

            // Adjust vertical position based on content area
            if (position === 'header') {
                // Content area is below horizontal bar
                if (isTopAligned) {
                    // Shift down by bar height (parent calculated from full button top)
                    processed.y += vertical;
                } else if (isBottomAligned) {
                    // Bottom stays at bottom - no adjustment needed
                } else if (isCenterY) {
                    // Center within content area
                    processed.y = contentArea.y + (contentArea.height / 2);
                }
            } else {
                // Footer: content area is above horizontal bar
                if (isTopAligned) {
                    // Top stays at top - no adjustment needed
                } else if (isBottomAligned) {
                    // Shift up by bar height (parent calculated from full button bottom)
                    processed.y -= vertical;
                } else if (isCenterY) {
                    // Center within content area
                    processed.y = contentArea.height / 2;
                }
            }

            return processed;
        });
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

lcardsLog.debug('[LCARdSElbow] Card module loaded');
