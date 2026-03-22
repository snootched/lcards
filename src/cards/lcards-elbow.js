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
 */

import { html, css } from 'lit';
import { unsafeHTML } from 'lit/directives/unsafe-html.js';
import { LCARdSButton } from './lcards-button.js';
import { lcardsLog } from '../utils/lcards-logging.js';
import { resolveStateColor } from '../utils/state-color-resolver.js';
import { getElbowSchema } from './schemas/elbow-schema.js';
import {
    createCardElement,
    applyHassToCard,
    applyCardConfig,
    isCardModAvailable
} from '../utils/ha-card-factory.js';

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
            // _symbiotElement and _symbiotMounted are plain instance properties (not Lit reactive)
            // to avoid triggering re-renders on imperative DOM reference changes
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
                    position: relative;
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

                /* Wrapper gives position:relative context for the absolute symbiont container */
                .lcards-symbiont-wrapper {
                    position: relative;
                    width: 100%;
                    height: 100%;
                }

                .lcards-symbiont-container {
                    position: absolute;
                    overflow: hidden;
                    pointer-events: auto;
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

        // Symbiont state (plain instance properties — not Lit reactive to avoid update loops)
        this._symbiotElement = null;
        this._symbiotMounted = false;
        this._lastSymbiontConfigJson = null; // Dirty-check for symbiont config changes
        this._lastImprintCss = null;         // Cache last injected imprint CSS

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
            if (this._elbowConfig.type === 'frame') {
                this._elbowGeometry = this._calculateFrameGeometry(this._elbowConfig);
            } else if (this._elbowConfig.style === 'segmented') {
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

        // Handle symbiont enable/disable when card is already initialized
        // Use dirty-check to avoid remounting on every non-symbiont property change from the editor
        if (this._initialized) {
            const newSymbiontJson = JSON.stringify(config.symbiont);
            if (newSymbiontJson !== this._lastSymbiontConfigJson) {
                this._lastSymbiontConfigJson = newSymbiontJson;
                if (config.symbiont?.enabled) {
                    this._unmountSymbiontCard();
                    this._mountSymbiontCard();
                } else {
                    this._unmountSymbiontCard();
                }
            }
        }
    }

    /**
     * Called after CoreConfigManager processes config (async)
     * This is where we add provenance for dynamically-computed values
     * @protected
     */
    _onConfigUpdated() {
        lcardsLog.debug('[LCARdSElbow] _onConfigUpdated called - adding provenance for dynamic colors');

        // Track provenance for dynamically-added color fields
        // This runs AFTER CoreConfigManager has processed the config
        // and AFTER _initializeElbowDefaultColors() has added the color defaults
        this._trackColorProvenance();

        // Call parent
        if (super._onConfigUpdated) {
            super._onConfigUpdated();
        }
    }

    /**
     * Track provenance for dynamically-added color values
     * Must be called AFTER _initializeElbowDefaultColors() has run
     * @private
     */
    _trackColorProvenance() {
        // Use _provenance (from CoreConfigManager result) not config.__provenance
        // This follows the same pattern as button/slider cards
        if (!this._provenance?.field_sources) {
            lcardsLog.warn('[LCARdSElbow] Cannot track color provenance - no _provenance.field_sources');
            return;
        }

        if (!this._elbowConfig) {
            lcardsLog.warn('[LCARdSElbow] Cannot track color provenance - no _elbowConfig');
            return;
        }

        let trackedCount = 0;

        // Track segment colors
        if (this._elbowConfig.segment?.color) {
            Object.entries(this._elbowConfig.segment.color).forEach(([colorKey, tokenValue]) => {
                const fieldPath = `elbow.segment.color.${colorKey}`;

                // Check if this field already has provenance (from user config or card defaults)
                if (!this._provenance.field_sources[fieldPath]) {
                    this._provenance.field_sources[fieldPath] = {
                        layers: { card_defaults: tokenValue },
                        final: 'card_defaults'
                    };
                    trackedCount++;
                }
            });
        }

        // Track segmented mode colors
        if (this._elbowConfig.style === 'segmented' && this._elbowConfig.segments) {
            // Outer segment
            if (this._elbowConfig.segments.outer_segment?.color) {
                Object.entries(this._elbowConfig.segments.outer_segment.color).forEach(([colorKey, tokenValue]) => {
                    const fieldPath = `elbow.segments.outer_segment.color.${colorKey}`;
                    if (!this._provenance.field_sources[fieldPath]) {
                        this._provenance.field_sources[fieldPath] = {
                            layers: { card_defaults: tokenValue },
                            final: 'card_defaults'
                        };
                        trackedCount++;
                    }
                });
            }

            // Inner segment
            if (this._elbowConfig.segments.inner_segment?.color) {
                Object.entries(this._elbowConfig.segments.inner_segment.color).forEach(([colorKey, tokenValue]) => {
                    const fieldPath = `elbow.segments.inner_segment.color.${colorKey}`;
                    if (!this._provenance.field_sources[fieldPath]) {
                        this._provenance.field_sources[fieldPath] = {
                            layers: { card_defaults: tokenValue },
                            final: 'card_defaults'
                        };
                        trackedCount++;
                    }
                });
            }
        }

        if (trackedCount > 0) {
            lcardsLog.debug(`[LCARdSElbow] Tracked provenance for ${trackedCount} dynamically-added colors`);
        }
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
        const component = this._getElbowComponent(this._elbowConfig.type);
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
                // frame uses 'header' tokens as the nearest semantic match
                const positionForToken = (position === 'footer') ? 'footer' : 'header';
                const positionTokenPath = `components.elbow.${positionForToken}.background`;
                tokenBase = `theme:${positionTokenPath}`;
                lcardsLog.debug(`[LCARdSElbow] Falling back to position tokens: ${positionTokenPath}`);
            }
        } else {
            // No theme manager - use position-based tokens as fallback
            lcardsLog.warn('[LCARdSElbow] No theme manager available, using position-based tokens');
            const positionForToken = (position === 'footer') ? 'footer' : 'header';
            const positionTokenPath = `components.elbow.${positionForToken}.background`;
            tokenBase = `theme:${positionTokenPath}`;
        }

        // ALWAYS set elbow colors into segment.color - this is where elbows read from
        // Initialize segment structure if needed
        if (!this._elbowConfig.segment) this._elbowConfig.segment = {};

        // Create defaults object
        const colorDefaults = {
            default: `${tokenBase}.default`,
            active: `${tokenBase}.active`,
            inactive: `${tokenBase}.inactive`,
            unavailable: `${tokenBase}.unavailable`,
            hover: `${tokenBase}.hover`,
            pressed: `${tokenBase}.pressed`
        };

        // Track which colors exist before we add defaults
        const existingSegmentColors = this._elbowConfig.segment.color || {};

        // Merge defaults with user config (user values override defaults)
        // Create new object to avoid frozen object errors from HA config
        this._elbowConfig.segment.color = {
            ...colorDefaults,
            ...existingSegmentColors
        };

        // For segmented mode, also set into segments.outer_segment and segments.inner_segment
        if (this._elbowConfig.style === 'segmented') {
            if (!this._elbowConfig.segments) this._elbowConfig.segments = {};

            // Outer segment
            if (!this._elbowConfig.segments.outer_segment) this._elbowConfig.segments.outer_segment = {};
            const existingOuterColors = this._elbowConfig.segments.outer_segment.color || {};
            this._elbowConfig.segments.outer_segment.color = {
                ...colorDefaults,
                ...existingOuterColors
            };

            // Inner segment
            if (!this._elbowConfig.segments.inner_segment) this._elbowConfig.segments.inner_segment = {};
            const existingInnerColors = this._elbowConfig.segments.inner_segment.color || {};
            this._elbowConfig.segments.inner_segment.color = {
                ...colorDefaults,
                ...existingInnerColors
            };
        }

        // For frame mode, also set inner frame segment color (segmented frames)
        if (this._elbowConfig.type === 'frame' && this._elbowConfig.style === 'segmented'
            && this._elbowConfig.frame?.segments?.inner) {
            const innerFrame = this._elbowConfig.frame.segments.inner;
            if (!innerFrame.color) {
                innerFrame.color = { ...colorDefaults };
            }
        }

        lcardsLog.debug(`[LCARdSElbow] Set elbow segment color defaults:`, {
            type: componentType,
            position,
            tokenBase,
            segmentColor: this._elbowConfig.segment?.color
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
     * Extracts interaction styles (hover/pressed) from segment.color for dynamic state handling
     * @private
     */
    _injectElbowColors() {
        if (!this._elbowConfig || !this._buttonStyle) return;

        // Get theme manager for token resolution
        const themeManager = this._singletons?.themeManager;

        // Check if segmented or simple elbow
        const isSegmented = this._elbowConfig?.style === 'segmented';

        if (isSegmented) {
            // Extract interaction styles for OUTER segment from segments.outer_segment.color
            const outerColor = this._elbowConfig.segments?.outer_segment?.color;
            if (outerColor?.hover || outerColor?.pressed) {
                let hoverColor = outerColor.hover;
                let pressedColor = outerColor.pressed;

                // Resolve theme tokens
                if (hoverColor && typeof hoverColor === 'string' && hoverColor.startsWith('theme:')) {
                    const tokenPath = hoverColor.substring(6);
                    hoverColor = themeManager?.getToken(tokenPath) || hoverColor;
                }
                if (pressedColor && typeof pressedColor === 'string' && pressedColor.startsWith('theme:')) {
                    const tokenPath = pressedColor.substring(6);
                    pressedColor = themeManager?.getToken(tokenPath) || pressedColor;
                }

                this._elbowOuterHoverStyle = hoverColor ? { backgroundColor: hoverColor } : null;
                this._elbowOuterPressedStyle = pressedColor ? { backgroundColor: pressedColor } : null;

                lcardsLog.debug('[LCARdSElbow] Extracted outer segment interaction styles', {
                    hasHover: !!this._elbowOuterHoverStyle,
                    hasPressed: !!this._elbowOuterPressedStyle
                });
            }

            // Extract interaction styles for INNER segment from segments.inner_segment.color
            const innerColor = this._elbowConfig.segments?.inner_segment?.color;
            if (innerColor?.hover || innerColor?.pressed) {
                let hoverColor = innerColor.hover;
                let pressedColor = innerColor.pressed;

                // Resolve theme tokens
                if (hoverColor && typeof hoverColor === 'string' && hoverColor.startsWith('theme:')) {
                    const tokenPath = hoverColor.substring(6);
                    hoverColor = themeManager?.getToken(tokenPath) || hoverColor;
                }
                if (pressedColor && typeof pressedColor === 'string' && pressedColor.startsWith('theme:')) {
                    const tokenPath = pressedColor.substring(6);
                    pressedColor = themeManager?.getToken(tokenPath) || pressedColor;
                }

                this._elbowInnerHoverStyle = hoverColor ? { backgroundColor: hoverColor } : null;
                this._elbowInnerPressedStyle = pressedColor ? { backgroundColor: pressedColor } : null;

                lcardsLog.debug('[LCARdSElbow] Extracted inner segment interaction styles', {
                    hasHover: !!this._elbowInnerHoverStyle,
                    hasPressed: !!this._elbowInnerPressedStyle
                });
            }
        } else {
            // Simple elbow - extract from segment.color
            const segmentColor = this._elbowConfig.segment?.color;
            if (segmentColor?.hover || segmentColor?.pressed) {
                let hoverColor = segmentColor.hover;
                let pressedColor = segmentColor.pressed;

                // Resolve theme tokens
                if (hoverColor && typeof hoverColor === 'string' && hoverColor.startsWith('theme:')) {
                    const tokenPath = hoverColor.substring(6);
                    hoverColor = themeManager?.getToken(tokenPath) || hoverColor;
                }
                if (pressedColor && typeof pressedColor === 'string' && pressedColor.startsWith('theme:')) {
                    const tokenPath = pressedColor.substring(6);
                    pressedColor = themeManager?.getToken(tokenPath) || pressedColor;
                }

                this._elbowHoverStyle = hoverColor ? { backgroundColor: hoverColor } : null;
                this._elbowPressedStyle = pressedColor ? { backgroundColor: pressedColor } : null;

                lcardsLog.debug('[LCARdSElbow] Extracted simple segment interaction styles', {
                    hasHover: !!this._elbowHoverStyle,
                    hasPressed: !!this._elbowPressedStyle
                });
            }
        }
    }

    /**
     * First update lifecycle hook - register as elbow type and subscribe to theme entities
     * @protected
     */
    /** @override */
    _getOverlayType() {
        return 'elbow';
    }

    /** @override */
    _getOverlayTags() {
        const tags = ['elbow'];
        if (this.config.preset) {
            tags.push(this.config.preset);
        }
        if (this._entity) {
            tags.push('entity-based');
        }
        if (this.config.tags && Array.isArray(this.config.tags)) {
            tags.push(...this.config.tags);
        }
        return tags;
    }

    _handleFirstUpdate(changedProps) {
        // CRITICAL: Call parent implementation first to enable auto-sizing and background animations.
        // Registration now uses _getOverlayType()/_getOverlayTags() so the correct 'elbow' type
        // is registered by the parent call — no second registration needed here.
        super._handleFirstUpdate(changedProps);

        // Subscribe to theme input_number entities if configured to use them
        this._subscribeToThemeEntities();

        // Mount symbiont card if configured
        if (this.config?.symbiont?.enabled) {
            this._mountSymbiontCard();
        }
    }

    /**
     * Elbows are decorative/structural elements and should not fire any action
     * by default (unlike buttons which default to toggle). Users can still
     * configure explicit tap/hold actions in YAML as normal.
     * @returns {Object} Default tap action configuration
     * @protected
     */
    _getDefaultTapAction() {
        return { action: 'none' };
    }

    /**
     * Override animation setup to specify 'elbow' type
     * @protected
     */
    _getAnimationSetup() {
        return {
            overlayId: `elbow-${this._cardGuid}`,
            type: 'elbow',
            elementSelector: '[data-overlay-id="button"]'
        };
    }

    /**
     * Lit lifecycle - called after every render when DOM updates
     * Setup interactivity on the rendered elbow element
     * @public
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

        // Re-attach symbiont element after each render (Lit may recreate container div)
        if (this._symbiotElement) {
            this._attachSymbiontToContainer();
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

        // Forward HASS to symbiont card
        if (this._symbiotElement) {
            this._applySymbiontHass(newHass);
        }
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

            // Recalculate based on type/style
            if (this._elbowConfig.type === 'frame') {
                this._elbowGeometry = this._calculateFrameGeometry(this._elbowConfig);
            } else if (this._elbowConfig.style === 'segmented') {
                this._elbowGeometry = this._calculateSegmentedGeometry(this._elbowConfig);
            } else {
                this._elbowGeometry = this._calculateSimpleElbowGeometry(this._elbowConfig);
            }

            // Update background animation inset when geometry changes (for 'auto' inset)
            const bgConfig = this.config?.background_animation;
            if (this._backgroundRenderer && bgConfig && !Array.isArray(bgConfig) && bgConfig.inset === 'auto') {
                this._backgroundRenderer.updateInset(this._resolveBackgroundAnimationInset('auto'));
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
     * Resolve background animation inset for elbow cards.
     * `'auto'` computes the correct inset from elbow bar geometry,
     * framing the canvas inside the LCARS bars.
     *
     * @param {Object|string|null} rawInset - Raw inset value from config
     * @returns {{ top: number, right: number, bottom: number, left: number }}
     * @protected
     */
    _resolveBackgroundAnimationInset(rawInset) {
        if (rawInset !== 'auto') {
            return super._resolveBackgroundAnimationInset(rawInset);
        }

        // Compute from elbow geometry (mirrors symbiont container inset logic)
        const g = this._elbowGeometry;
        if (!g) return { top: 0, right: 0, bottom: 0, left: 0 };

        // ── Frame type: all 4 sides contribute ────────────────────────────────
        if (g.type === 'frame') {
            const sides = g.inner
                ? {
                    top:    (g.sides.top.enabled    ? g.sides.top.thickness    : 0) + (g.gap ?? 0) + (g.inner.sides.top.enabled    ? g.inner.sides.top.thickness    : 0),
                    bottom: (g.sides.bottom.enabled ? g.sides.bottom.thickness : 0) + (g.gap ?? 0) + (g.inner.sides.bottom.enabled ? g.inner.sides.bottom.thickness : 0),
                    left:   (g.sides.left.enabled   ? g.sides.left.thickness   : 0) + (g.gap ?? 0) + (g.inner.sides.left.enabled   ? g.inner.sides.left.thickness   : 0),
                    right:  (g.sides.right.enabled  ? g.sides.right.thickness  : 0) + (g.gap ?? 0) + (g.inner.sides.right.enabled  ? g.inner.sides.right.thickness  : 0)
                  }
                : {
                    top:    g.sides.top.enabled    ? g.sides.top.thickness    : 0,
                    bottom: g.sides.bottom.enabled ? g.sides.bottom.thickness : 0,
                    left:   g.sides.left.enabled   ? g.sides.left.thickness   : 0,
                    right:  g.sides.right.enabled  ? g.sides.right.thickness  : 0
                  };
            lcardsLog.debug('[LCARdSElbow] Resolved background animation inset (frame)', sides);
            return sides;
        }

        // ── Standard elbow (L-shaped) ─────────────────────────────────────────
        const position = this._elbowConfig?.type?.includes('footer') ? 'footer' : 'header';
        const side     = this._elbowConfig?.type?.includes('right')  ? 'right'  : 'left';

        const hBar = g.inner
            ? (g.outer.horizontal + (g.gap ?? 0) + g.inner.horizontal)
            : (g.horizontal ?? 0);
        const vBar = g.inner
            ? (g.outer.vertical   + (g.gap ?? 0) + g.inner.vertical)
            : (g.vertical   ?? 0);

        const inset = { top: 0, right: 0, bottom: 0, left: 0 };
        if (position === 'header') inset.top    = vBar;
        else                       inset.bottom = vBar;
        if (side === 'left')       inset.left   = hBar;
        else                       inset.right  = hBar;

        lcardsLog.debug('[LCARdSElbow] Resolved background animation inset from geometry', inset);
        return inset;
    }

    /**
     * Disconnect callback - cleanup theme entity subscriptions
     * @public
     */
    disconnectedCallback() {
        this._unsubscribeThemeEntities();

        // Unmount symbiont card
        this._unmountSymbiontCard();

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
     * Returns the container element as the host for the canvas texture overlay.
     *
     * The elbow card renders its SVG inside the button's `.button-container` wrapper
     * (inherited from `_renderButtonContent()`), which already has
     * `position: relative; width: 100%; height: 100%` — exactly what the absolutely-
     * positioned canvas overlay requires.  There is no separate `.elbow-container`
     * element created by any Lit template, so targeting it always returns null and
     * silently skips canvas creation.  We therefore target `.button-container`
     * directly, matching the parent class default.
     *
     * @override
     * @returns {HTMLElement|null}
     * @protected
     */
    _getTextureHostEl() {
        return this.renderRoot?.querySelector('.button-texture-host')
            ?? this.renderRoot?.querySelector('.button-container')
            ?? null;
    }

    /**
     * Elbow cards always support shape_texture, regardless of whether a `component:`
     * key appears in the config.  LCARdSButton._supportsShapeTexture() blocks textures
     * when `config.component` is truthy (because button components provide their own
     * SVG rendering pipeline).  For the elbow card, texture markup is injected explicitly
     * via `_generateTextureMarkup(width, height, {}, elbowPath)` in the elbow renderer,
     * so the `component:` restriction does not apply here.
     *
     * @override
     * @returns {boolean}
     * @protected
     */
    _supportsShapeTexture() {
        return !this._processedSvg && !this.config?.svg;
    }

    // ──────────────────────────────────────────────────────────────
    // Component Lookup Helpers
    //
    // Use ComponentManager (single source of truth) so that
    // third-party packs with custom elbow types work automatically.
    // Fall back to the static registry if core is not yet ready.
    // ──────────────────────────────────────────────────────────────

    /**
     * Get an elbow component by type via ComponentManager.
     * @param {string} type - Elbow type name (e.g. 'header-left')
     * @returns {Object|undefined}
     * @private
     */
    _getElbowComponent(type) {
        const cm = window.lcards?.core?.componentManager;
        if (!cm) {
            lcardsLog.warn('[LCARdSElbow] ComponentManager not ready — component lookup failed for:', type);
            return undefined;
        }
        return cm.getComponent(type);
    }

    /**
     * Get all registered elbow type names via ComponentManager.
     * @returns {string[]}
     * @private
     */
    _getElbowTypeNames() {
        const cm = window.lcards?.core?.componentManager;
        if (!cm) {
            lcardsLog.warn('[LCARdSElbow] ComponentManager not ready — defaulting elbow type to header-left');
            return ['header-left'];
        }
        return cm.getComponentsByType('elbow');
    }

    /**
     * Validate and normalize elbow configuration
     * @param {Object} elbowConfig - Raw elbow config from card config
     * @returns {Object} Validated elbow configuration
     * @private
     */
    _validateElbowConfig(elbowConfig) {
        // Get valid types from core component registry
        const validTypes = this._getElbowTypeNames();
        const type = validTypes.includes(elbowConfig.type)
            ? elbowConfig.type
            : 'header-left';

        if (!validTypes.includes(elbowConfig.type)) {
            lcardsLog.warn(`[LCARdSElbow] Invalid elbow type "${elbowConfig.type}", defaulting to "header-left". Valid types: ${validTypes.join(', ')}`);
        }

        // Get valid styles from the component's features
        const component = this._getElbowComponent(type);
        const validStyles = component?.features || ['simple'];
        const style = validStyles.includes(elbowConfig.style) ? elbowConfig.style : validStyles[0];

        if (elbowConfig.style && !validStyles.includes(elbowConfig.style)) {
            lcardsLog.warn(`[LCARdSElbow] Invalid style "${elbowConfig.style}" for type "${type}". Valid styles: ${validStyles.join(', ')}. Defaulting to "${validStyles[0]}"`);
        }

        // ── Frame type: entirely different config structure ───────────────────────
        if (type === 'frame') {
            const fc = elbowConfig.frame || {};

            // Shorthand defaults (all sides / all corners)
            const defBW = this._parseUnit(fc.bar_width  ?? 90);        // left/right default
            const defBH = this._parseUnit(fc.bar_height ?? defBW);     // top/bottom default
            const defOC = this._parseUnit(fc.outer_curve ?? Math.round(defBW / 2));
            const defIC = this._parseUnit(fc.inner_curve ?? Math.round(defOC / 2));

            const parseSide = (key) => {
                const raw = fc[key] || {};
                // 'top'/'bottom' default to bar_height; 'left'/'right' default to bar_width
                const defaultT = (key === 'top' || key === 'bottom') ? defBH : defBW;
                const thickness =
                    raw.bar_width  !== undefined ? this._parseUnit(raw.bar_width) :
                    raw.bar_height !== undefined ? this._parseUnit(raw.bar_height) :
                    raw.thickness  !== undefined ? this._parseUnit(raw.thickness)  :
                    defaultT;
                return {
                    thickness,
                    enabled: raw.enabled !== false,
                    color: raw.color ?? null
                };
            };

            const parseCorner = (ck) => {
                const c = fc.corners?.[ck] || {};
                return {
                    outer: c.outer_curve !== undefined ? this._parseUnit(c.outer_curve) : defOC,
                    inner: c.inner_curve !== undefined ? this._parseUnit(c.inner_curve) : defIC
                };
            };

            const frameConfig = {
                sides: {
                    top:    parseSide('top'),
                    bottom: parseSide('bottom'),
                    left:   parseSide('left'),
                    right:  parseSide('right')
                },
                corners: {
                    top_left:     parseCorner('top_left'),
                    top_right:    parseCorner('top_right'),
                    bottom_left:  parseCorner('bottom_left'),
                    bottom_right: parseCorner('bottom_right')
                },
                color: fc.color ?? null
            };

            // Segmented (double-ring) mode: frame.segments.inner_frame
            if (style === 'segmented') {
                const seg     = fc.segments    || {};
                const innerFc = seg.inner_frame || {};
                const gap     = this._parseUnit(seg.gap ?? 4);

                const iDefBW = this._parseUnit(innerFc.bar_width  ?? 28);
                const iDefBH = this._parseUnit(innerFc.bar_height ?? iDefBW);
                const iDefOC = this._parseUnit(innerFc.outer_curve ?? Math.round(iDefBW / 2));
                const iDefIC = this._parseUnit(innerFc.inner_curve ?? Math.round(iDefOC / 2));

                const parseInnerSide = (key) => {
                    const raw = innerFc[key] || {};
                    const defaultT = (key === 'top' || key === 'bottom') ? iDefBH : iDefBW;
                    const thickness =
                        raw.bar_width  !== undefined ? this._parseUnit(raw.bar_width) :
                        raw.bar_height !== undefined ? this._parseUnit(raw.bar_height) :
                        raw.thickness  !== undefined ? this._parseUnit(raw.thickness)  :
                        defaultT;
                    return { thickness, enabled: raw.enabled !== false, color: raw.color ?? null };
                };

                const parseInnerCorner = (ck) => {
                    const c = innerFc.corners?.[ck] || {};
                    return {
                        outer: c.outer_curve !== undefined ? this._parseUnit(c.outer_curve) : iDefOC,
                        inner: c.inner_curve !== undefined ? this._parseUnit(c.inner_curve) : iDefIC
                    };
                };

                frameConfig.segments = {
                    gap,
                    inner: {
                        sides: {
                            top:    parseInnerSide('top'),
                            bottom: parseInnerSide('bottom'),
                            left:   parseInnerSide('left'),
                            right:  parseInnerSide('right')
                        },
                        corners: {
                            top_left:     parseInnerCorner('top_left'),
                            top_right:    parseInnerCorner('top_right'),
                            bottom_left:  parseInnerCorner('bottom_left'),
                            bottom_right: parseInnerCorner('bottom_right')
                        },
                        color: innerFc.color ?? null
                    }
                };
            }

            return {
                type,
                style,
                // Preserve user-authored segment block so elbow.segment.color survives
                // into _initializeElbowDefaultColors (which reads existingSegmentColors from it).
                // Shallow-clone so _initializeElbowDefaultColors can write .color onto it
                // (HA config objects are frozen/non-extensible).
                segment:  elbowConfig.segment ? { ...elbowConfig.segment } : null,
                segments: null,
                frame: frameConfig,
                colors: elbowConfig.colors || {}
            };
        }

        // ── Standard elbow (non-frame) ────────────────────────────────────────────
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
        const component = this._getElbowComponent(type);
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
     * Calculate frame geometry from a validated frame config.
     * Simply lifts the already-parsed `config.frame` data into the `_elbowGeometry`
     * shape so all geometry consumers can read it via `g.type === 'frame'`.
     * @param {Object} config - Validated elbow config (type === 'frame')
     * @returns {Object} Frame geometry object
     * @private
     */
    _calculateFrameGeometry(config) {
        const fc = config.frame;
        if (!fc) return null;

        const geom = {
            type:    'frame',
            sides:   fc.sides,
            corners: fc.corners,
            color:   fc.color
        };

        // Segmented (double-ring) — mirrors _calculateSegmentedGeometry's .outer/.inner/.gap
        if (config.style === 'segmented' && fc.segments) {
            geom.inner = fc.segments.inner;
            geom.gap   = fc.segments.gap;
        }

        return geom;
    }

    /**
     * Adjust text positioning based on elbow type
     * Auto-configure padding and alignment for optimal LCARS aesthetics
     * @private
     */
    _adjustTextForElbow() {
        if (!this._elbowConfig || !this._elbowConfig.type) return;

        // Get position and side from component layout metadata
        const component = this._getElbowComponent(this._elbowConfig.type);
        const position = component?.layout?.position || 'header';
        const side = component?.layout?.side || 'left';

        const config = this.config;

        // Initialize text config if needed
        if (!config.text) config.text = {};

        // ── Frame type: auto-pad all active sides individually ─────────────────
        if (this._elbowConfig.type === 'frame') {
            const g = this._elbowGeometry;
            if (!g || g.type !== 'frame') return;

            const sidePad = (sideKey) => {
                const s = g.sides[sideKey];
                if (!s?.enabled) return 0;
                const thickness = s.thickness;
                if (g.inner) {
                    // Segmented: outer + gap + inner thickness, plus breathing room
                    const inner = g.inner.sides[sideKey];
                    return thickness + (g.gap ?? 0) + (inner?.enabled ? inner.thickness : 0) + 10;
                }
                return thickness + 10;
            };

            const padTop    = sidePad('top');
            const padBottom = sidePad('bottom');
            const padLeft   = sidePad('left');
            const padRight  = sidePad('right');

            Object.keys(config.text).forEach(fieldId => {
                const field = config.text[fieldId];
                if (!field) return;

                const autoSet = (padKey, padVal) => {
                    if (padVal <= 0) return;
                    if (field.padding === undefined) {
                        field.padding = { [padKey]: padVal };
                    } else if (typeof field.padding === 'object' && field.padding !== null && field.padding[padKey] === undefined) {
                        field.padding[padKey] = padVal;
                    }
                };

                autoSet('top',    padTop);
                autoSet('bottom', padBottom);
                autoSet('left',   padLeft);
                autoSet('right',  padRight);
            });

            lcardsLog.trace(`[LCARdSElbow] Auto-adjusted text padding for frame`);
            return;
        }

        // ── Standard elbow (L-shaped) ──────────────────────────────────────────
        // Calculate padding to clear elbow bars
        let horizontalPadding, verticalPadding;

        if (this._elbowConfig.style === 'simple') {
            horizontalPadding = this._elbowConfig.segment.bar_width + 20;
            verticalPadding = this._elbowConfig.segment.bar_height + 10;
        } else {
            // For segmented, account for both bars plus the gap between them
            const { gap, outer_segment, inner_segment } = this._elbowConfig.segments;
            horizontalPadding = outer_segment.bar_width + (gap ?? 0) + inner_segment.bar_width + 20;
            verticalPadding = (outer_segment.bar_height || outer_segment.bar_width) +
                              (gap ?? 0) +
                              (inner_segment.bar_height || inner_segment.bar_width) + 10;
        }

        // Set defaults for all text fields if not explicitly set
        Object.keys(config.text).forEach(fieldId => {
            const field = config.text[fieldId];
            if (!field) return;

            // Set alignment based on elbow side if not explicitly set
            if (!field.align) {
                field.align = side === 'left' ? 'left' : 'right';
            }

            // Auto-adjust padding based on elbow position.
            // Use nested padding object format — same as _resolveTextConfiguration reads.
            // Only set a side when the user hasn't already specified it.
            if (side === 'left') {
                if (field.padding === undefined) {
                    field.padding = { left: horizontalPadding };
                } else if (typeof field.padding === 'object' && field.padding !== null && field.padding.left === undefined) {
                    field.padding.left = horizontalPadding;
                }
            }
            if (side === 'right') {
                if (field.padding === undefined) {
                    field.padding = { right: horizontalPadding };
                } else if (typeof field.padding === 'object' && field.padding !== null && field.padding.right === undefined) {
                    field.padding.right = horizontalPadding;
                }
            }
            if (position === 'header') {
                if (field.padding === undefined) {
                    field.padding = { top: verticalPadding };
                } else if (typeof field.padding === 'object' && field.padding !== null && field.padding.top === undefined) {
                    field.padding.top = verticalPadding;
                }
            }
            if (position === 'footer') {
                if (field.padding === undefined) {
                    field.padding = { bottom: verticalPadding };
                } else if (typeof field.padding === 'object' && field.padding !== null && field.padding.bottom === undefined) {
                    field.padding.bottom = verticalPadding;
                }
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
            const elbowOuter = /** @type {HTMLElement|null} */ (this.shadowRoot?.querySelector('.elbow-outer'));
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
            const elbowInner = /** @type {HTMLElement|null} */ (this.shadowRoot?.querySelector('.elbow-inner'));
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
            const elbowBg = /** @type {HTMLElement|null} */ (this.shadowRoot?.querySelector('.elbow-bg'));

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
            // Resolve match-light token after theme resolution
            return String(this._resolveMatchLightColor(tokenValue));
        }

        // Resolve match-light token → var(--lcards-light-color-{guid})
        return String(this._resolveMatchLightColor(resolved));
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
        const component = this._getElbowComponent(elbowType);

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
     * @protected
     */
    _generateButtonSVG(width, height, config) {
        // Route to frame rendering if type is 'frame'
        if (this._elbowConfig?.type === 'frame') {
            return this._generateFrameSVG(width, height, config);
        }

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

        // Generate shape texture layer
        const textureMarkup = this._generateTextureMarkup(width, height, {}, elbowPath);

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
                    ${textureMarkup}
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

    // ──────────────────────────────────────────────────────────────
    // Frame rendering — rectangular ring (2–4 sided border)
    // ──────────────────────────────────────────────────────────────

    /**
     * Build a rounded-rectangle SVG path segment.
     *
     * @param {number} x1  - Left edge
     * @param {number} y1  - Top edge
     * @param {number} x2  - Right edge
     * @param {number} y2  - Bottom edge
     * @param {number} tlR - Top-left corner radius
     * @param {number} trR - Top-right corner radius
     * @param {number} brR - Bottom-right corner radius
     * @param {number} blR - Bottom-left corner radius
     * @param {boolean} clockwise - true = CW (solid fill), false = CCW (hole)
     * @returns {string} SVG path data fragment (no leading M/Z required from caller)
     * @private
     */
    /**
     * Draw a CW rounded-rectangle path (sweep=1 arcs).
     * Used for the outer boundary of a frame ring.
     * @private
     */
    _roundedRectPath(x1, y1, x2, y2, tlR, trR, brR, blR) {
        const w = x2 - x1, h = y2 - y1;
        if (w <= 0 || h <= 0) return '';
        const mx = w / 2, my = h / 2;
        const c = (r) => Math.max(0, Math.min(Math.abs(r), mx, my));
        const tl = c(tlR), tr = c(trR), br = c(brR), bl = c(blR);
        const a = (r, nx, ny) => r > 0 ? `A ${r} ${r} 0 0 1 ${nx} ${ny}` : `L ${nx} ${ny}`;
        return [
            `M ${x1 + tl} ${y1}`,
            `L ${x2 - tr} ${y1}`, a(tr, x2, y1 + tr),
            `L ${x2} ${y2 - br}`, a(br, x2 - br, y2),
            `L ${x1 + bl} ${y2}`, a(bl, x1, y2 - bl),
            `L ${x1} ${y1 + tl}`, a(tl, x1 + tl, y1),
            `Z`
        ].join(' ');
    }

    /**
     * Build the filled path for one frame ring.
     *
     * Two closed CW sub-paths combined with fill-rule="evenodd":
     *   1. Outer boundary — CW rounded rect.
     *   2. Inner boundary — also CW, tracing the inner edge of the bar material.
     *
     * Even-odd fill: a point inside both sub-paths = 2 crossings (even → hole).
     * A point inside only the outer = 1 crossing (odd → filled bar material).
     *
     * Inner corner radii are only applied when BOTH adjacent sides are enabled.
     * Open-side corners always use r=0 (sharp 90° butt end). This keeps every
     * coordinate strictly within the valid inner bounding box.
     *
     * @param {number} ox1,oy1,ox2,oy2 - outer bounding box
     * @param {Object} sides    - { top, bottom, left, right } each { thickness, enabled }
     * @param {Object} corners  - { top_left, top_right, bottom_right, bottom_left }
     *                            each { outer: number, inner: number }
     * @returns {string} SVG `d` value  (use with fill-rule="evenodd")
     * @private
     */
    _generateFrameRingPath(ox1, oy1, ox2, oy2, sides, corners) {
        const tT = sides.top.enabled    ? sides.top.thickness    : 0;
        const tB = sides.bottom.enabled ? sides.bottom.thickness : 0;
        const tL = sides.left.enabled   ? sides.left.thickness   : 0;
        const tR = sides.right.enabled  ? sides.right.thickness  : 0;

        const ix1 = ox1 + tL, iy1 = oy1 + tT;
        const ix2 = ox2 - tR, iy2 = oy2 - tB;

        const C  = corners;
        const ow = ox2 - ox1, oh = oy2 - oy1;
        const iw = Math.max(0, ix2 - ix1), ih = Math.max(0, iy2 - iy1);

        const clamp = (r, ...maxes) => Math.max(0, Math.min(Math.abs(r), ...maxes));

        // Outer corner radii
        const oTL = clamp(C.top_left.outer,     ow/2, oh/2);
        const oTR = clamp(C.top_right.outer,    ow/2, oh/2);
        const oBR = clamp(C.bottom_right.outer, ow/2, oh/2);
        const oBL = clamp(C.bottom_left.outer,  ow/2, oh/2);

        // Inner corner radii (raw — applied only when both adjacent sides are enabled)
        const iTL = clamp(C.top_left.inner,     iw/2, ih/2);
        const iTR = clamp(C.top_right.inner,    iw/2, ih/2);
        const iBR = clamp(C.bottom_right.inner, iw/2, ih/2);
        const iBL = clamp(C.bottom_left.inner,  iw/2, ih/2);

        const topOn = sides.top.enabled, botOn = sides.bottom.enabled;
        const lefOn = sides.left.enabled, rigOn = sides.right.enabled;

        // Outer sub-path: standard CW rounded rect
        const outerPath = this._roundedRectPath(ox1, oy1, ox2, oy2, oTL, oTR, oBR, oBL);

        // Inner sub-path: CW rounded rect.
        // Open corners (either adjacent side disabled) get r=0 → sharp 90° butt ends.
        // This guarantees all coordinates stay within [ix1,ix2] × [iy1,iy2].
        const rTL = (topOn && lefOn) ? iTL : 0;
        const rTR = (topOn && rigOn) ? iTR : 0;
        const rBR = (botOn && rigOn) ? iBR : 0;
        const rBL = (botOn && lefOn) ? iBL : 0;

        const innerPath = this._roundedRectPath(ix1, iy1, ix2, iy2, rTL, rTR, rBR, rBL);

        return `${outerPath} ${innerPath}`;
    }

    /**
     * Generate frame SVG (type: 'frame').
     * Simple mode = single ring. Segmented mode = two concentric rings with a gap.
     * @param {number} width  - SVG width
     * @param {number} height - SVG height
     * @param {Object} config - Button configuration
     * @returns {string} SVG markup string
     * @private
     */
    _generateFrameSVG(width, height, config) {
        const g = this._elbowGeometry;
        if (!g || g.type !== 'frame') {
            return super._generateButtonSVG(width, height, config);
        }

        // Outer ring color (uses same segment.color resolution as simple elbows)
        const outerColor = this._getElbowColor();

        // Build outer ring path
        const outerRingPath = this._generateFrameRingPath(0, 0, width, height, g.sides, g.corners);

        // Build inner ring path (segmented mode)
        let innerRingPath = '';
        let innerColor = '';
        if (g.inner) {
            const gap = g.gap ?? 0;
            // Inner ring's outer boundary is inset by outer ring thickness + gap on each active side
            const oT = g.sides.top.enabled    ? g.sides.top.thickness    : 0;
            const oB = g.sides.bottom.enabled ? g.sides.bottom.thickness : 0;
            const oL = g.sides.left.enabled   ? g.sides.left.thickness   : 0;
            const oR = g.sides.right.enabled  ? g.sides.right.thickness  : 0;

            const ix1 = oL + gap;
            const iy1 = oT + gap;
            const ix2 = width  - oR - gap;
            const iy2 = height - oB - gap;

            innerRingPath = this._generateFrameRingPath(ix1, iy1, ix2, iy2, g.inner.sides, g.inner.corners);
            // Inner ring gets its color from frame.segments.inner.color, falling back to outer color
            // Use state-aware resolution so a state-map at frame.segments.inner_frame.color works
            innerColor = g.inner.color
                ? this._getElbowColor('inner-frame', { color: g.inner.color })
                : outerColor;
        }

        // Text and icon processing
        let iconData = { markup: '', widthUsed: 0 };
        if (this._processedIcon) {
            const iconArea = this._processedIcon?.area || 'none';
            iconData = iconArea !== 'none'
                ? this._generateAreaBasedIconMarkup(this._processedIcon, width, height)
                : this._generateFlexibleIconMarkup(this._processedIcon, width, height);
        }

        const iconOnly = this._processedIcon?.iconOnly && this._processedIcon?.show;
        let textMarkup = '';
        if (!iconOnly) {
            const textFields = this._resolveTextConfiguration();
            const textFieldsArray = Object.values(textFields);
            const processedFields = this._processTextFieldsForElbow(textFieldsArray, width, height);
            textMarkup = this._generateTextElements(processedFields);
        }

        const textureMarkup = this._generateTextureMarkup(width, height, {}, outerRingPath);

        const svgString = `
            <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"
                 xmlns="http://www.w3.org/2000/svg">
                <g data-button-id="frame"
                   data-overlay-id="button"
                   class="elbow-group frame-elbow"
                   style="pointer-events: visiblePainted; cursor: pointer;">
                    <!-- Outer frame ring -->
                    <path
                        class="elbow-bg button-clickable"
                        data-overlay-id="frame-outer"
                        d="${outerRingPath}"
                        fill="${outerColor}"
                        fill-rule="evenodd"
                        style="pointer-events: all;"
                    />
                    ${g.inner ? `
                    <!-- Inner frame ring (segmented) -->
                    <path
                        class="elbow-frame-inner button-clickable"
                        data-overlay-id="frame-inner"
                        d="${innerRingPath}"
                        fill="${innerColor}"
                        fill-rule="evenodd"
                        style="pointer-events: all;"
                    />` : ''}
                    ${textureMarkup}
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
        const component = this._getElbowComponent(g.type);
        const position = component?.layout?.position || 'header';
        const side = component?.layout?.side || 'left';

        // For segmented mode, use TOTAL bar dimensions (outer + gap + inner);
        // for simple mode, use direct geometry — mirrors _resolveBackgroundAnimationInset.
        const horizontal = g.inner
            ? (g.outer.horizontal + (g.gap ?? 0) + g.inner.horizontal)
            : (g.horizontal ?? 0);
        const vertical = g.inner
            ? (g.outer.vertical + (g.gap ?? 0) + g.inner.vertical)
            : (g.vertical ?? 0);

        // Calculate content area (area not occupied by elbow bars)
        let contentArea = {
            x: 0,
            y: 0,
            width: width,
            height: height
        };

        // ── Frame type: 4-sided content area ──────────────────────────────────
        if (g.type === 'frame') {
            const frameInset = (sideKey, inner) => {
                const s = g.sides[sideKey];
                if (!s?.enabled) return 0;
                if (inner && g.inner) {
                    const is = g.inner.sides[sideKey];
                    return s.thickness + (g.gap ?? 0) + (is?.enabled ? is.thickness : 0);
                }
                return s.thickness;
            };
            const fL = frameInset('left');
            const fT = frameInset('top');
            const fR = frameInset('right');
            const fB = frameInset('bottom');
            contentArea = { x: fL, y: fT, width: width - fL - fR, height: height - fT - fB };

            return processedFields.map(field => {
                const processed = { ...field };
                const originalField = textFieldsObject[field.id];
                if (!originalField) return processed;

                const hasExplicitCoords = (originalField.x !== null && originalField.x !== undefined)
                                       && (originalField.y !== null && originalField.y !== undefined);
                const hasPercentCoords  = (originalField.x_percent !== null && originalField.x_percent !== undefined)
                                       && (originalField.y_percent !== null && originalField.y_percent !== undefined);
                if (hasExplicitCoords || hasPercentCoords) return processed;

                const isLeftAligned   = originalField.position?.includes('left')   || originalField.align === 'left';
                const isRightAligned  = originalField.position?.includes('right')  || originalField.align === 'right';
                const isTopAligned    = originalField.position?.includes('top');
                const isBottomAligned = originalField.position?.includes('bottom');
                const isCenterX = !isLeftAligned && !isRightAligned;
                const isCenterY = !isTopAligned && !isBottomAligned;

                const rawPadding = originalField.padding;
                const fp = typeof rawPadding === 'number'
                    ? { left: rawPadding, right: rawPadding, top: rawPadding, bottom: rawPadding }
                    : { left: rawPadding?.left ?? 10, right: rawPadding?.right ?? 10,
                        top: rawPadding?.top  ?? 10, bottom: rawPadding?.bottom ?? 10 };

                if (isLeftAligned)      processed.x = contentArea.x + fp.left;
                else if (isRightAligned) processed.x = contentArea.x + contentArea.width - fp.right;
                else if (isCenterX)      processed.x = contentArea.x + contentArea.width / 2;

                if (isTopAligned)        processed.y = contentArea.y + fp.top;
                else if (isBottomAligned) processed.y = contentArea.y + contentArea.height - fp.bottom;
                else if (isCenterY)      processed.y = contentArea.y + contentArea.height / 2;

                return processed;
            });
        }

        // ── Standard elbow (L-shaped) ─────────────────────────────────────────
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

            // Extract padding from the resolved original field config.
            // processed.padding is never set by _processTextFields — we must read from originalField.
            const rawPadding = originalField.padding;
            const fieldPad = typeof rawPadding === 'number'
                ? { left: rawPadding, right: rawPadding, top: rawPadding, bottom: rawPadding }
                : {
                    left:   rawPadding?.left   ?? 10,
                    right:  rawPadding?.right  ?? 10,
                    top:    rawPadding?.top    ?? 10,
                    bottom: rawPadding?.bottom ?? 10
                };

            // Adjust horizontal position based on content area
            if (side === 'left') {
                // Content area is on the right of vertical bar
                if (isLeftAligned) {
                    processed.x = contentArea.x + fieldPad.left;
                } else if (isRightAligned) {
                    processed.x = width - fieldPad.right;
                } else if (isCenterX) {
                    // Center within content area
                    processed.x = contentArea.x + (contentArea.width / 2);
                }
            } else {
                // Content area is on the left of vertical bar (side === 'right')
                if (isLeftAligned) {
                    processed.x = fieldPad.left;
                } else if (isRightAligned) {
                    processed.x = contentArea.width - fieldPad.right;
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

    // ──────────────────────────────────────────────────────────────
    // Symbiont — embedded card with optional style imprinting
    // ──────────────────────────────────────────────────────────────

    /**
     * Override _renderCard() to add symbiont container when enabled.
     *
     * The wrapper div provides the position:relative context that the
     * absolute-positioned symbiont container needs to anchor correctly.
     * @public
     */
    _renderCard() {
        const parentContent = super._renderCard();

        if (!this.config?.symbiont?.enabled) {
            return parentContent;
        }

        const pos = this.config.symbiont?.position || {};

        // Compute base insets from elbow geometry so the container starts
        // inside the bar borders (sidebar + top/bottom bar), not under them.
        let baseTop    = 0;
        let baseBottom = 0;
        let baseLeft   = 0;
        let baseRight  = 0;

        const g = this._elbowGeometry;
        if (g) {
            if (g.type === 'frame') {
                // Frame: all 4 sides contribute to the inset
                const activeSides = g.inner
                    ? {
                        top:    (g.sides.top.enabled    ? g.sides.top.thickness    : 0) + (g.gap ?? 0) + (g.inner.sides.top.enabled    ? g.inner.sides.top.thickness    : 0),
                        bottom: (g.sides.bottom.enabled ? g.sides.bottom.thickness : 0) + (g.gap ?? 0) + (g.inner.sides.bottom.enabled ? g.inner.sides.bottom.thickness : 0),
                        left:   (g.sides.left.enabled   ? g.sides.left.thickness   : 0) + (g.gap ?? 0) + (g.inner.sides.left.enabled   ? g.inner.sides.left.thickness   : 0),
                        right:  (g.sides.right.enabled  ? g.sides.right.thickness  : 0) + (g.gap ?? 0) + (g.inner.sides.right.enabled  ? g.inner.sides.right.thickness  : 0)
                      }
                    : {
                        top:    g.sides.top.enabled    ? g.sides.top.thickness    : 0,
                        bottom: g.sides.bottom.enabled ? g.sides.bottom.thickness : 0,
                        left:   g.sides.left.enabled   ? g.sides.left.thickness   : 0,
                        right:  g.sides.right.enabled  ? g.sides.right.thickness  : 0
                      };
                baseTop    = activeSides.top;
                baseBottom = activeSides.bottom;
                baseLeft   = activeSides.left;
                baseRight  = activeSides.right;
            } else {
                const component = this._getElbowComponent(g.type);
                const position  = component?.layout?.position || 'header';
                const side      = component?.layout?.side     || 'left';
                // For segmented elbows, the content area starts after the full bar stack:
                // outer bars + gap + inner bars.  Simple elbows use direct values.
                const hBar = g.inner
                    ? (g.outer.horizontal + g.gap + g.inner.horizontal)
                    : g.horizontal;
                const vBar = g.inner
                    ? (g.outer.vertical   + g.gap + g.inner.vertical)
                    : g.vertical;

                if (position === 'header') baseTop    = vBar;
                else                       baseBottom = vBar;
                if (side === 'left')       baseLeft   = hBar;
                else                       baseRight  = hBar;
            }
        }

        // User-configured padding is additional offset inside the content area
        const top    = baseTop    + (pos.top    ?? 0);
        const right  = baseRight  + (pos.right  ?? 0);
        const bottom = baseBottom + (pos.bottom ?? 0);
        const left   = baseLeft   + (pos.left   ?? 0);

        // Use CSS inset shorthand: top right bottom left
        return html`
            <div class="lcards-symbiont-wrapper">
                ${parentContent}
                <div class="lcards-symbiont-container"
                     id="lcards-symbiont-host"
                     style="inset: ${top}px ${right}px ${bottom}px ${left}px;">
                </div>
            </div>
        `;
    }

    /**
     * Mount the symbiont (embedded) card.
     *
     * Uses the shared HACardFactory for 3-strategy element creation.
     * HASS is applied BEFORE config (required order — same as MSD controls).
     * Imprint injection uses a retry loop instead of a single RAF so lazy
     * shadow roots (hui-* cards) are caught reliably.
     * @private
     */
    async _mountSymbiontCard() {
        const symbConfig = this.config?.symbiont;
        if (!symbConfig?.enabled) return;

        if (!symbConfig?.card?.type) {
            lcardsLog.warn('[LCARdSElbow] Symbiont enabled but no card.type specified');
            return;
        }

        const cardConfig = symbConfig.card;
        lcardsLog.debug('[LCARdSElbow] Mounting symbiont card', { type: cardConfig.type });

        // Create element via shared factory (3-strategy with upgrade wait)
        const cardElement = await createCardElement(cardConfig.type, 'symbiont');
        if (!cardElement) {
            lcardsLog.warn('[LCARdSElbow] Symbiont: could not create card element for type:', cardConfig.type);
            return;
        }

        // Apply HASS BEFORE config (required — same order as MSD controls)
        if (this.hass) {
            applyHassToCard(cardElement, this.hass, 'symbiont-mount');
        }

        // Apply config
        await applyCardConfig(cardElement, cardConfig, 'symbiont');

        this._symbiotElement = cardElement;
        this._attachSymbiontToContainer();

        // Inject imprint with retry loop to handle lazy shadow roots
        if (symbConfig.imprint?.enabled !== false) {
            this._injectSymbiontImprintWithRetry();
        }
    }

    /**
     * Forward HASS to symbiont and re-inject imprint when state-based colors may change.
     * Uses HACardFactory for consistent per-card-type HASS application.
     * @param {Object} hass - New HASS object
     * @private
     */
    _applySymbiontHass(hass) {
        if (!this._symbiotElement) return;

        applyHassToCard(this._symbiotElement, hass, 'symbiont-hass');

        // Re-inject imprint — entity state may have changed so resolved colors differ
        if (this.config?.symbiont?.imprint?.enabled !== false) {
            this._injectSymbiontImprint(this._symbiotElement);
        }
    }

    /**
     * Unmount symbiont card and clean up DOM
     * @private
     */
    _unmountSymbiontCard() {
        if (this._symbiotElement) {
            this._symbiotElement.remove?.();
            this._symbiotElement = null;
        }
        this._symbiotMounted = false;
        this._lastImprintCss = null; // Reset cache so next mount re-injects fresh styles
    }

    /**
     * Attach symbiont element to the container div in shadow root
     * Called after each render to ensure the element is in the DOM
     * @private
     */
    _attachSymbiontToContainer() {
        if (!this._symbiotElement) return;

        const container = /** @type {HTMLElement|null} */ (this.renderRoot?.querySelector('#lcards-symbiont-host'));
        if (!container) return;

        if (!container.contains(this._symbiotElement)) {
            container.appendChild(this._symbiotElement);
            this._symbiotMounted = true;
            lcardsLog.debug('[LCARdSElbow] Symbiont: attached to container');
        }
    }

    /**
     * Schedule imprint injection with retry loop.
     * Retries up to 12 times (100 ms apart) so shadow roots that initialise
     * lazily (hui-* cards) are caught reliably instead of a single-RAF gamble.
     * @private
     */
    _injectSymbiontImprintWithRetry(maxAttempts = 12, delayMs = 100) {
        let attempts = 0;
        const tryInject = () => {
            // Abort if symbiont was unmounted while we were waiting
            if (!this._symbiotElement) return;
            if (this._injectSymbiontImprint(this._symbiotElement)) return;
            if (++attempts < maxAttempts) setTimeout(tryInject, delayMs);
        };
        requestAnimationFrame(tryInject);
    }

    /**
     * Inject imprint styles into symbiont card's shadowRoot.
     *
     * Returns true if injection succeeded (shadow root was available) or was
     * skipped legitimately (no CSS, card-mod active, no change). Returns false
     * only when the shadow root is not ready yet — the retry loop uses this.
     *
     * CSS selector targets both `ha-card` (most cards) and `:host` (cards that
     * render directly on the host element) plus `hui-entities-card` for legacy
     * compatibility.
     *
     * @param {HTMLElement} cardElement
     * @returns {boolean} true = done, false = shadow root not ready yet
     * @private
     */
    _injectSymbiontImprint(cardElement) {
        if (!cardElement) return true;

        // If the card config includes a card_mod block AND card-mod is loaded,
        // let card-mod own the styling — don't compete with it.
        const cardConfig = this.config?.symbiont?.card;
        if (cardConfig?.card_mod && isCardModAvailable()) {
            lcardsLog.debug('[LCARdSElbow] Symbiont: card_mod present and available — skipping native imprint');
            return true;
        }

        const imprintCss   = this._buildImprintStyle();
        const customCss    = this.config?.symbiont?.custom_style || '';
        const fullCss      = [imprintCss, customCss].filter(Boolean).join('\n\n');

        // Skip DOM mutation when styles haven't changed (called on every HASS update)
        if (fullCss === this._lastImprintCss) return true;
        this._lastImprintCss = fullCss;

        if (!fullCss) return true;

        // Inject into shadow root — return false if not ready yet
        const shadowRoot = cardElement.shadowRoot;
        if (!shadowRoot) return false;

        let styleEl = shadowRoot.querySelector('#lcards-symbiont-imprint');
        if (!styleEl) {
            styleEl = document.createElement('style');
            styleEl.id = 'lcards-symbiont-imprint';
            shadowRoot.appendChild(styleEl);
        }
        styleEl.textContent = fullCss;

        // Also propagate resolved colors as CSS custom-properties on the
        // container element as a fallback for light-DOM / slotted cards.
        const container = /** @type {HTMLElement|null} */ (this.renderRoot?.querySelector('#lcards-symbiont-host'));
        if (container && this.config?.symbiont?.imprint) {
            const imprint    = this.config.symbiont.imprint;
            const buttonState = this._getButtonState();
            const actualState = this._entity?.state;

            if (imprint.background) {
                const bg = resolveStateColor({
                    actualState,
                    classifiedState: buttonState,
                    colorConfig: imprint.background,
                    fallback: null
                });
                if (bg) container.style.setProperty('--ha-card-background', String(bg));
            }

            if (imprint.text?.color) {
                const tc = resolveStateColor({
                    actualState,
                    classifiedState: buttonState,
                    colorConfig: imprint.text.color,
                    fallback: null
                });
                if (tc) container.style.setProperty('--primary-text-color', String(tc));
            }
        }

        return true;
    }

    /**
     * Build CSS string for ha-card style injection into symbiont shadowRoot
     * Only includes properties with non-null/non-empty values
     * @returns {string} CSS string or empty string
     * @private
     */
    _buildImprintStyle() {
        const imprint = this.config?.symbiont?.imprint;
        if (!imprint) return '';

        const buttonState = this._getButtonState();
        const actualState = this._entity?.state;

        // Resolve background color
        let bgColor = null;
        if (imprint.background) {
            bgColor = resolveStateColor({
                actualState,
                classifiedState: buttonState,
                colorConfig: imprint.background,
                fallback: null
            });
        }

        // Resolve text color
        let textColor = null;
        if (imprint.text?.color) {
            textColor = resolveStateColor({
                actualState,
                classifiedState: buttonState,
                colorConfig: imprint.text.color,
                fallback: null
            });
        }

        const fontSize = imprint.text?.font_size || null;
        const fontFamily = imprint.text?.font_family || null;

        // Compute border radii
        const radii = this._deriveSymbiontBorderRadius();

        // Build CSS rules
        const rules = [];
        if (bgColor) rules.push(`  background: ${bgColor} !important;`);
        if (textColor) rules.push(`  color: ${textColor} !important;`);
        if (fontSize) rules.push(`  font-size: ${fontSize} !important;`);
        if (fontFamily) rules.push(`  font-family: ${fontFamily} !important;`);
        if (radii.topLeft != null) rules.push(`  border-top-left-radius: ${radii.topLeft}px !important;`);
        if (radii.topRight != null) rules.push(`  border-top-right-radius: ${radii.topRight}px !important;`);
        if (radii.bottomLeft != null) rules.push(`  border-bottom-left-radius: ${radii.bottomLeft}px !important;`);
        if (radii.bottomRight != null) rules.push(`  border-bottom-right-radius: ${radii.bottomRight}px !important;`);

        if (rules.length === 0) return '';

        // Target ha-card (standard cards), :host (cards that render on host),
        // and hui-entities-card (legacy HA element used by entities card).
        const selector = 'ha-card, hui-entities-card, :host';
        return `${selector} {\n${rules.join('\n')}\n}`;
    }

    /**
     * Derive border radii for symbiont card
     * If match_host is true, derives from elbow inner arc geometry
     * If false, uses manual top_left/top_right/bottom_left/bottom_right values
     * @returns {Object} Object with topLeft, topRight, bottomLeft, bottomRight (px or null)
     * @private
     */
    _deriveSymbiontBorderRadius() {
        const borderRadius = this.config?.symbiont?.imprint?.border_radius;

        // Resolve the inner arc radius from geometry for 'match' corners
        const innerRadius = this._elbowGeometry?.innerRadius ||
                            this._elbowGeometry?.inner?.innerRadius || 0;

        /**
         * Resolve a single corner value:
         *   undefined / null → don't inject (null return)
         *   'match'          → use elbow inner arc radius
         *   number           → use as-is (px)
         * Legacy: if borderRadius has match_host boolean, apply old behaviour.
         */
        const resolve = (val) => {
            if (val === 'match') return innerRadius;
            if (typeof val === 'number') return val;
            return null; // don't inject
        };

        // ── Legacy compat: match_host: true/false ────────────────────────────
        if (!borderRadius || borderRadius.match_host !== undefined) {
            if (!borderRadius || borderRadius.match_host !== false) {
                // Old "match all" mode — auto-apply inner radius to the elbow corner only
                if (!this._elbowGeometry) return {};
                const component = this._getElbowComponent(this._elbowConfig?.type);
                const position = component?.layout?.position || 'header';
                const side     = component?.layout?.side     || 'left';
                if (position === 'header' && side === 'left')  return { topLeft: innerRadius, topRight: null, bottomLeft: null, bottomRight: null };
                if (position === 'header' && side === 'right') return { topLeft: null, topRight: innerRadius, bottomLeft: null, bottomRight: null };
                if (position === 'footer' && side === 'left')  return { topLeft: null, topRight: null, bottomLeft: innerRadius, bottomRight: null };
                if (position === 'footer' && side === 'right') return { topLeft: null, topRight: null, bottomLeft: null, bottomRight: innerRadius };
                return {};
            }
            // match_host: false → fall through to manual values below
        }

        // ── Per-corner mode: null | 'match' | number ─────────────────────────
        return {
            topLeft:     resolve(borderRadius?.top_left),
            topRight:    resolve(borderRadius?.top_right),
            bottomLeft:  resolve(borderRadius?.bottom_left),
            bottomRight: resolve(borderRadius?.bottom_right),
        };
    }

    /**
     * Get card size for Home Assistant layout
     * Elbows typically use more vertical space
     * @returns {number} Grid rows
     */
    getCardSize() {
        const px = this._configPx(this.config.height);
        if (px !== null) return Math.ceil(px / 50);
        return this.config.grid_rows || 2;
    }

    /**
     * Get layout options for Home Assistant grid system
     * @returns {Object} Layout configuration
     */
    getGridOptions() {
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

        // Register JSON schema for validation
        configManager.registerCardSchema('elbow', elbowSchema, { version: __LCARDS_VERSION__ });

        lcardsLog.debug('[LCARdSElbow] Schema registered with CoreConfigManager');
    }
}

// NOTE: Card registration moved to src/lcards.js initializeCustomCard().then()
// This ensures all core singletons are initialized before cards can be instantiated.

lcardsLog.debug('[LCARdSElbow] Card module loaded');
