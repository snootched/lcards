/**
 * LCARdS Simple Button Card
 *
 * A clean, straightforward button implementation using the SimpleCard foundation.
 * Demonstrates the proper use of the simplified architecture.
 *
 * Features:
 * - Template processing for label/content
 * - Theme token integration
 * - Style preset support
 * - Action handling
 * - SVG rendering via ButtonRenderer
 *
 * Configuration:
 * ```yaml
 * type: custom:lcards-simple-button
 * entity: light.bedroom
 * label: "Bedroom Light"
 * preset: lozenge  # Optional: button style preset
 * tap_action:
 *   action: toggle
 * ```
 */

import { html, css } from 'lit';
import { unsafeHTML } from 'lit/directives/unsafe-html.js';
import { LCARdSSimpleCard } from '../base/LCARdSSimpleCard.js';
import { lcardsLog } from '../utils/lcards-logging.js';

export class LCARdSSimpleButtonCard extends LCARdSSimpleCard {

    /** Card type identifier for CoreConfigManager */
    static CARD_TYPE = 'simple-button';

    static get properties() {
        return {
            ...super.properties,
            _buttonStyle: { type: Object, state: true }
        };
    }

    static get styles() {
        return [
            super.styles,
            css`
                :host {
                    display: block;
                    width: 100%;
                    min-height: 60px;
                }

                .button-container {
                    width: 100%;
                    height: 100%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: transparent;
                }

                .button-svg {
                    display: block;
                    width: 200px;
                    height: 60px;
                    cursor: pointer;
                }

                .button-svg:hover {
                    opacity: 0.8;
                }

                /* These styles are now applied inline for dynamic rule-based changes
                   Removed !important to allow inline styles to work */
            `
        ];
    }

    constructor() {
        super();
        this._buttonStyle = null;
        this._lastActionElement = null; // Track last element actions were attached to
        this._containerSize = { width: 200, height: 60 }; // Default size, updated by ResizeObserver
        this._resizeObserver = null;
    }

    /**
     * Called when config is set (override from base class)
     * @protected
     */
    _onConfigSet(config) {
        super._onConfigSet(config);

        // Re-setup actions if config changes after initial setup
        if (this._actionsInitialized) {
            lcardsLog.debug(`[LCARdSSimpleButtonCard] Config changed, re-setting up actions`);
            this.updateComplete.then(() => {
                this._setupButtonActions();
            });
        }
    }

    /**
     * Handle HASS updates - process templates when entity changes
     * @private
     */
    _handleHassUpdate(newHass, oldHass) {
        // Process templates when entity state changes
        if (this.config.entity && this._entity) {
            const oldState = oldHass?.states[this.config.entity]?.state;
            const newState = this._entity.state;

            if (oldState !== newState) {
                // Schedule template processing to avoid update cycles
                this._scheduleTemplateUpdate();
            }
        }
    }

    /**
     * Handle first update - setup initial state
     * @private
     */
    _handleFirstUpdate(changedProperties) {
        // Register this button with RulesEngine for dynamic styling
        // Tags: button type and preset (if any)
        const tags = ['button'];
        if (this.config.preset) {
            tags.push(this.config.preset);
        }
        if (this._entity) {
            tags.push('entity-based');
        }

        // ⭐ Merge custom tags from config
        if (this.config.tags && Array.isArray(this.config.tags)) {
            tags.push(...this.config.tags);
        }

        // ✅ SIMPLIFIED: Use card ID directly (no suffix)
        // If user sets id:my_button, overlay registers as "my_button" (not "my_button_button")
        const overlayId = this.config.id || this.config.entity || this._cardGuid;

        lcardsLog.debug(`[LCARdSSimpleButtonCard] Registering overlay with ID: ${overlayId}`, {
            hasConfigId: !!this.config.id,
            configId: this.config.id,
            hasEntity: !!this.config.entity,
            entity: this.config.entity,
            cardGuid: this._cardGuid,
            finalOverlayId: overlayId,
            tags: tags  // ⭐ Log tags for debugging
        });

        this._registerOverlayForRules(overlayId, tags);

        // Setup actions after DOM is ready (original simple approach)
        this.updateComplete.then(() => {
            this._setupButtonActions();
            this._actionsInitialized = true;
        });

        // ✨ NEW: Setup ResizeObserver for auto-sizing
        this._setupResizeObserver();
    }

    /**
     * Hook called after templates are processed (from base class)
     * @protected
     */
    _onTemplatesChanged() {
        // Resolve button style after templates change
        this._resolveButtonStyleSync();
    }

    /**
     * Setup ResizeObserver to track container size changes for auto-sizing
     * Enables buttons to automatically fill HA grid cells and responsive containers
     * @private
     */
    _setupResizeObserver() {
        // Clean up existing observer if any
        if (this._resizeObserver) {
            this._resizeObserver.disconnect();
        }

        this._resizeObserver = new ResizeObserver(entries => {
            if (entries.length === 0) return;

            const { width, height } = entries[0].contentRect;

            // Only update if size actually changed (avoid thrashing)
            if (width !== this._containerSize.width || height !== this._containerSize.height) {
                this._containerSize = { width, height };
                lcardsLog.trace(`[LCARdSSimpleButtonCard] Container resized to ${width}x${height}`);
                this.requestUpdate(); // Trigger re-render with new size
            }
        });

        // Observe this element for size changes
        this._resizeObserver.observe(this);
        lcardsLog.debug(`[LCARdSSimpleButtonCard] ResizeObserver setup for auto-sizing`);
    }

    /**
     * Hook called after rule patches change (from base class)
     * @protected
     */
    _onRulePatchesChanged() {
        // Re-resolve button style to merge new rule patches
        this._resolveButtonStyleSync();
    }

    /**
     * Lit lifecycle - called after every render
     * Re-attach actions because Lit recreates DOM elements
     */
    updated(changedProperties) {
        super.updated(changedProperties);

        // Only re-attach actions if we have relevant changes and actions are initialized
        // This prevents excessive re-attachment on every render
        if (this._actionsInitialized) {
            const buttonElement = this.shadowRoot.querySelector('[data-overlay-id="simple-button"]');

            // Check if the button element exists and if we need to re-attach
            // (Lit recreates SVG on every render, so we need to re-attach)
            if (buttonElement && buttonElement !== this._lastActionElement) {
                lcardsLog.debug(`[LCARdSSimpleButtonCard] 🔄 Re-attaching actions after render (element changed)`);
                this._setupButtonActions();
                this._lastActionElement = buttonElement;
            }
        }
    }    /**
     * Resolve button style with full priority chain
     *
     * This method demonstrates the complete style resolution chain for SimpleCard
     * cards with RulesEngine integration:
     *
     * **Style Priority (low to high):**
     * 1. Preset styles (if specified)
     * 2. Config styles (overrides preset)
     * 3. Theme token resolution
     * 4. State-based overrides (e.g., entity state)
     * 5. Rule patches (highest priority via _getMergedStyleWithRules)
     *
     * **Performance:**
     * - Uses JSON.stringify comparison to prevent unnecessary re-renders
     * - Only triggers requestUpdate() if style actually changed
     * - Called on: first update, HASS updates, rule patch changes
     *
     * **CRITICAL:** Always call `this.requestUpdate()` after style changes
     * to trigger Lit re-render. Without this, visual updates won't happen.
     *
     * @private
     */
    _resolveButtonStyleSync() {
        // Start with base style from config
        let style = { ...(this.config.style || {}) };

        // Apply preset if specified
        if (this.config.preset) {
            const preset = this.getStylePreset('button', this.config.preset);
            if (preset) {
                // Preset has lower priority than explicit config
                style = { ...preset, ...style };
                lcardsLog.debug(`[LCARdSSimpleButtonCard] Applied preset '${this.config.preset}'`);
            }
        }

        // Get state-based overrides
        const stateOverrides = this._getStateOverrides();

        // Resolve with theme tokens
        let resolvedStyle = this.resolveStyle(style, [
            'colors.accent.primary',
            'colors.text.primary'
        ], stateOverrides);

        // ✨ NEW: Merge with rules-based styles (rules have highest priority)
        resolvedStyle = this._getMergedStyleWithRules(resolvedStyle);

        // Only update if changed (avoid unnecessary re-renders)
        if (!this._buttonStyle || JSON.stringify(this._buttonStyle) !== JSON.stringify(resolvedStyle)) {
            this._buttonStyle = resolvedStyle;
            lcardsLog.trace(`[LCARdSSimpleButtonCard] Button style resolved, triggering re-render`);
            this.requestUpdate(); // Trigger re-render to apply new styles
        }
    }

    /**
     * Translate HA entity state to button state
     * @private
     * @returns {string} Button state: 'active', 'inactive', or 'unavailable'
     */
    _getButtonState() {
        if (!this._entity) {
            return 'inactive';
        }

        const state = this._entity.state;

        // Unavailable is universal
        if (state === 'unavailable' || state === 'unknown') {
            return 'unavailable';
        }

        // Active states (ON, locked, open, etc.)
        if (state === 'on' || state === 'locked' || state === 'open' ||
            state === 'home' || state === 'playing' || state === 'active') {
            return 'active';
        }

        // Inactive states (OFF, unlocked, closed, etc.)
        return 'inactive';
    }

    /**
     * Get state-based style overrides
     * Reads from theme tokens based on button state (active/inactive/unavailable)
     * @private
     */
    _getStateOverrides() {
        if (!this._entity) {
            return {};
        }

        const buttonState = this._getButtonState();
        const overrides = {};

        // Get state-specific colors from theme tokens
        const bgToken = `components.button.base.background.${buttonState}`;
        const textToken = `components.button.base.text.${buttonState}`;
        const colorToken = `components.button.base.color.${buttonState}`;

        const backgroundColor = this.getThemeToken(bgToken);
        const textColor = this.getThemeToken(textToken);
        const color = this.getThemeToken(colorToken);

        if (backgroundColor) overrides.background_color = backgroundColor;
        if (textColor) overrides.text_color = textColor;
        if (color) overrides.color = color;

        // Apply opacity for non-active states
        if (buttonState === 'inactive') {
            overrides.opacity = 0.7;
        } else if (buttonState === 'unavailable') {
            overrides.opacity = 0.5;
        }

        return overrides;
    }

    /**
     * Setup action handlers on the rendered button using MSD ActionHelpers
     * @private
     */
    /**
     * Setup action handlers on the rendered button
     * Uses base class shadow-DOM-aware action system
     * @private
     */
    _setupButtonActions() {
        if (!this.hass) {
            lcardsLog.trace(`[LCARdSSimpleButtonCard] HASS not available yet, deferring action setup`);
            return;
        }

        // Clean up previous actions
        if (this._actionCleanup) {
            this._actionCleanup();
            this._actionCleanup = null;
        }

        // Find the button group element in shadow DOM
        const buttonElement = this.shadowRoot.querySelector('[data-overlay-id="simple-button"]');

        if (!buttonElement) {
            lcardsLog.trace(`[LCARdSSimpleButtonCard] Button element not found yet`);
            return;
        }

        // Build action configuration
        const actions = {
            tap_action: this.config.tap_action || { action: 'toggle' },
            hold_action: this.config.hold_action,
            double_tap_action: this.config.double_tap_action
        };

        // Get AnimationManager from core singletons (may not be ready yet)
        // Use getter function for late binding
        const getAnimationManager = () => {
            // Try singletons first (card instance)
            if (this._singletons?.animationManager) {
                return this._singletons.animationManager;
            }
            // Fall back to global singleton
            return window.lcards?.core?.animationManager;
        };

        // Build elementId for animation targeting
        const elementId = `simple-button-${this._cardGuid}`;

        // Use base class method to setup actions
        this._actionCleanup = this.setupActions(
            buttonElement,
            actions,
            {
                animationManager: getAnimationManager(),
                getAnimationManager,
                elementId: elementId,
                entity: this.config.entity,
                animations: this.config.animations
            }
        );

        lcardsLog.trace(`[LCARdSSimpleButtonCard] Actions attached successfully`);
    }

    /**
     * Button-specific animation setup configuration
     * @returns {Object} Animation setup for buttons
     * @protected
     */
    _getAnimationSetup() {
        return {
            overlayId: `simple-button-${this._cardGuid}`,
            elementSelector: '[data-overlay-id="simple-button"]'
        };
    }    /**
     * Render the button card
     * @protected
     */
    _renderCard() {
        if (!this._initialized) {
            return super._renderCard();
        }

        // Return a promise-based template for async rendering
        return this._renderButtonContent();
    }

    /**
     * Render button content
     * @private
     */
    _renderButtonContent() {
        lcardsLog.trace(`[LCARdSSimpleButtonCard] Rendering button for ${this._overlayId}`);

        // ✨ Use container size if available, otherwise config or defaults
        // This enables auto-sizing for HA grid cards and responsive layouts
        const width = this.config.width || this._containerSize?.width || 200;
        const height = this.config.height || this._containerSize?.height || 60;

        // Build button configuration
        const buttonConfig = {
            id: 'simple-button',
            label: this._processedTexts.label,
            content: this._processedTexts.content,
            texts: this._processedTexts.texts,
            preset: this.config.preset, // Pass preset for corner radius calculation
            style: this._buttonStyle,
            size: [width, height]
        };

        // Render synchronously with fallback SVG
        try {
            const svgMarkup = this._generateSimpleButtonSVG(width, height, buttonConfig);

            // Add cache-busting comment to force DOM update when style changes
            const timestamp = Date.now();

            return html`
                <div class="button-container" data-render-time="${timestamp}">
                    ${unsafeHTML(svgMarkup)}
                </div>
            `;

        } catch (error) {
            lcardsLog.error(`[LCARdSSimpleButtonCard] Render failed:`, error);

            return html`
                <div class="simple-card-error">
                    Button render failed: ${error.message}
                </div>
            `;
        }
    }

    /**
     * Generate inline SVG for button rendering
     *
     * **CRITICAL DESIGN DECISION:** Uses inline styles instead of CSS classes
     *
     * **Why Inline Styles:**
     * 1. ✅ Evaluated fresh on every render (picks up variable changes)
     * 2. ✅ No browser caching issues with `<style>` blocks
     * 3. ✅ No CSS specificity problems
     * 4. ✅ No `!important` conflicts
     * 5. ✅ Works with Lit's re-rendering system
     *
     * **Why NOT CSS Classes:**
     * - ❌ Browser caches `<style>` blocks even when SVG regenerates
     * - ❌ CSS class definitions are static (don't change when variables change)
     * - ❌ `!important` rules block inline style overrides
     * - ❌ No way to dynamically update without full DOM replacement
     *
     * **Style Variables:**
     * - `primary`: Background color (from resolved style with rule patches)
     * - `textColor`: Text color (from resolved style with rule patches)
     *
     * Both are interpolated directly into style strings, ensuring rule-based
     * changes are immediately reflected in the rendered SVG.
     *
     * @param {number} width - SVG width
     * @param {number} height - SVG height
     * @param {Object} config - Button configuration (preset, label)
     * @returns {string} SVG markup string
     * @private
     */
    _generateIconMarkup(iconConfig, buttonWidth, buttonHeight, position) {
        if (!iconConfig) return { markup: '', widthUsed: 0 };

        const tokens = this._theme?.tokens?.components?.button?.base?.icon || {};
        const requestedSize = iconConfig.size || tokens.size || 24;
        const spacing = tokens.spacing || 8;
        const borderWidth = tokens.interior?.width || 6;
        const borderColor = tokens.interior?.color || 'black';

        // Get padding values (defaults to 0)
        const paddingLeft = iconConfig.padding_left || 0;
        const paddingRight = iconConfig.padding_right || 0;
        const paddingTop = iconConfig.padding_top || 0;
        const paddingBottom = iconConfig.padding_bottom || 0;

        // Account for button stroke (2px on each side)
        const strokeWidth = 2;
        const availableHeight = buttonHeight - (strokeWidth * 2);
        const availableWidth = buttonWidth - (strokeWidth * 2);

        // Calculate icon area total width (requested size controls the AREA, not just icon)
        // Icon area = left spacing + icon + right spacing + border
        const iconAreaWidth = requestedSize + spacing * 2 + borderWidth;

        // Constrain icon to fit within button HEIGHT (with spacing)
        // This is the actual rendered icon size
        const maxIconHeight = availableHeight - (spacing * 2);
        const actualIconSize = Math.min(requestedSize, maxIconHeight);

        // Calculate icon area content width (excluding the border)
        const iconAreaContentWidth = iconAreaWidth - borderWidth;

        // Center icon horizontally within its content area, then apply padding
        const iconXOffset = (iconAreaContentWidth - actualIconSize) / 2 + paddingLeft - paddingRight;

        // Position icon horizontally (from button interior edge)
        const iconX = position === 'left'
            ? strokeWidth + iconXOffset
            : availableWidth + strokeWidth - iconAreaWidth + borderWidth + iconXOffset;

        // Center icon vertically within button bounds, then apply padding
        const iconY = strokeWidth + (availableHeight - actualIconSize) / 2 + paddingTop - paddingBottom;

        // Interior border (divider line) - full height of button
        const borderX = position === 'left'
            ? strokeWidth + iconAreaContentWidth
            : availableWidth + strokeWidth - iconAreaWidth;

        // Determine icon type and rendering
        let iconElement = '';
        if (iconConfig.type === 'entity' || iconConfig.type === 'mdi' || iconConfig.type === 'si') {
            const iconName = iconConfig.type === 'entity'
                ? iconConfig.icon
                : `${iconConfig.type}:${iconConfig.icon}`;

            iconElement = `
                <foreignObject x="${iconX}" y="${iconY}" width="${actualIconSize}" height="${actualIconSize}">
                    <ha-icon xmlns="http://www.w3.org/1999/xhtml"
                             icon="${iconName}"
                             style="width: ${actualIconSize}px; height: ${actualIconSize}px; color: ${iconConfig.color || 'currentColor'}; display: flex; align-items: center; justify-content: center;"></ha-icon>
                </foreignObject>`;
        }

        const markup = `
            <g class="icon-group" data-position="${position}">
                <!-- Interior border divider -->
                <rect
                    class="icon-border"
                    x="${borderX}"
                    y="0"
                    width="${borderWidth}"
                    height="${buttonHeight}"
                    style="fill: ${borderColor};"
                />
                ${iconElement}
            </g>
        `.trim();

        return { markup, widthUsed: iconAreaWidth };
    }

    /**
     * Generate SVG markup for a simple button
     * @param {number} width - SVG width
     * @param {number} height - SVG height
     * @param {Object} config - Button configuration (preset, label)
     * @returns {string} SVG markup string
     * @private
     */
    _generateSimpleButtonSVG(width, height, config) {
        // Read styling from _buttonStyle (resolved from preset/tokens)
        // Note: SVG <rect> only supports uniform border radius
        // If preset uses per-corner radii, use the top-left value as fallback
        let borderRadius = this._buttonStyle?.border_radius;
        if (borderRadius === undefined && this._buttonStyle?.border_radius_top_left !== undefined) {
            borderRadius = this._buttonStyle.border_radius_top_left;
            // TODO: Support per-corner radii using SVG path elements
        }
        borderRadius = borderRadius ?? 20;

        const borderWidth = this._buttonStyle?.border_width ?? 2;
        const backgroundColor = this._buttonStyle?.background_color || this._buttonStyle?.primary || 'var(--lcars-orange, #FF9900)';
        const textColor = this._buttonStyle?.text_color || this._buttonStyle?.textColor || 'var(--lcars-color-text, #FFFFFF)';
        const borderColor = this._buttonStyle?.border_color || 'var(--lcars-color-secondary, #000000)';

        // Font properties
        const fontSize = this._buttonStyle?.font_size ?? '14px';
        const fontWeight = this._buttonStyle?.font_weight ?? 'bold';
        const fontFamily = this._buttonStyle?.font_family ?? "'LCARS', 'Antonio', sans-serif";

        const strokeWidth = borderWidth;
        const text = config.label || 'Button';

        // Generate icon markup if present
        const iconPosition = this._processedIcon?.position || 'left';
        const iconData = this._generateIconMarkup(this._processedIcon, width, height, iconPosition);

        // Calculate text position accounting for icon
        let textX = width / 2;
        if (iconData.widthUsed > 0) {
            const textAreaWidth = width - iconData.widthUsed;
            const textAreaStart = iconPosition === 'left' ? iconData.widthUsed : 0;
            textX = textAreaStart + (textAreaWidth / 2);
        }

        const svgString = `
            <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
                <g data-button-id="simple-button"
                   data-overlay-id="simple-button"
                   class="button-group"
                   style="pointer-events: visiblePainted; cursor: pointer;">
                    <rect
                        class="button-bg button-clickable"
                        x="${strokeWidth/2}"
                        y="${strokeWidth/2}"
                        width="${width - strokeWidth}"
                        height="${height - strokeWidth}"
                        rx="${borderRadius}"
                        ry="${borderRadius}"
                        style="fill: ${backgroundColor}; stroke: ${borderColor}; stroke-width: ${strokeWidth};"
                    />

                    ${iconData.markup}

                    <text
                        class="button-text"
                        style="pointer-events: none; fill: ${textColor}; font-family: ${fontFamily}; font-size: ${fontSize}; font-weight: ${fontWeight}; text-anchor: middle; dominant-baseline: central;"
                        x="${textX}"
                        y="${height/2}">
                        ${this._escapeXML(text)}
                    </text>
                </g>
            </svg>
        `.trim();

        return svgString;
    }

    /**
     * Escape XML characters for safe SVG text
     * @private
     */
    _escapeXML(text) {
        return String(text)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    /**
     * Cleanup on disconnect
     */
    disconnectedCallback() {
        // Clean up action listeners
        if (this._actionCleanup) {
            this._actionCleanup();
            this._actionCleanup = null;
        }

        // Clean up ResizeObserver
        if (this._resizeObserver) {
            this._resizeObserver.disconnect();
            this._resizeObserver = null;
        }

        // Clear element reference
        this._lastActionElement = null;

        super.disconnectedCallback();
    }

    /**
     * Get card size for Home Assistant layout
     * Returns height in units of ~50px rows
     * @returns {number} Card height in rows
     */
    getCardSize() {
        // Calculate based on configured or auto-sized height
        const height = this.config.height || this._containerSize?.height || 60;
        // Convert to HA grid units (each unit is ~50px)
        return Math.ceil(height / 50);
    }

    /**
     * Get layout options for Home Assistant grid system
     * @returns {Object} Layout configuration
     */
    getLayoutOptions() {
        return {
            grid_columns: this.config.grid_columns || 2,  // Default span 2 columns
            grid_rows: this.config.grid_rows || 1,        // Default span 1 row
            grid_min_columns: this.config.grid_min_columns || 1,
            grid_min_rows: this.config.grid_min_rows || 1
        };
    }

    /**
     * Get stub config for card picker
     */
    static getStubConfig() {
        return {
            type: 'custom:lcards-simple-button',
            entity: 'light.example',
            label: 'LCARdS Button',
            preset: 'lozenge',
            tap_action: {
                action: 'toggle'
            }
        };
    }
}

// Register the card
customElements.define('lcards-simple-button', LCARdSSimpleButtonCard);

// Register with CoreConfigManager (behavioral defaults and schema)
if (window.lcardsCore?.configManager) {
    const configManager = window.lcardsCore.configManager;

    // Register behavioral defaults (NO STYLES - those come from theme/presets)
    configManager.registerCardDefaults('simple-button', {
        show_label: true,           // Display label by default
        show_icon: false,           // No icon by default
        enable_hold_action: true,   // Hold actions enabled
        enable_double_tap: false    // Double-tap disabled by default
    });

    // Register JSON schema for validation
    configManager.registerCardSchema('simple-button', {
        type: 'object',
        properties: {
            // Core Properties
            entity: {
                type: 'string',
                description: 'Entity ID to control'
            },
            id: {
                type: 'string',
                description: 'Custom overlay ID for rule targeting (optional - auto-generated if omitted)'
            },
            tags: {
                type: 'array',
                items: { type: 'string' },
                description: 'Tags for bulk rule targeting (e.g., ["controlled", "indicator"])'
            },

            // Display Properties
            label: {
                type: 'string',
                description: 'Button label text (supports Jinja2 templates)'
            },
            content: {
                type: 'string',
                description: 'Additional content text (supports Jinja2 templates)'
            },
            preset: {
                type: 'string',
                description: 'Style preset name (e.g., "lozenge", "pill", "bullet")'
            },
            show_label: {
                type: 'boolean',
                description: 'Whether to display the label'
            },
            show_icon: {
                type: 'boolean',
                description: 'Whether to display an icon'
            },
            icon: {
                oneOf: [
                    { type: 'string' },
                    {
                        type: 'object',
                        properties: {
                            icon: { type: 'string', description: 'Icon name (e.g., "mdi:lightbulb", "entity")' },
                            position: {
                                type: 'string',
                                enum: ['left', 'right', 'center', 'top', 'bottom'],
                                description: 'Icon position relative to text'
                            },
                            size: { type: 'number', description: 'Icon size in pixels (controls area width)' },
                            color: { type: 'string', description: 'Icon color (CSS color or "inherit")' },
                            padding_left: { type: 'number', description: 'Left padding in pixels' },
                            padding_right: { type: 'number', description: 'Right padding in pixels' },
                            padding_top: { type: 'number', description: 'Top padding in pixels' },
                            padding_bottom: { type: 'number', description: 'Bottom padding in pixels' }
                        }
                    }
                ],
                description: 'Icon configuration: string ("entity", "mdi:lightbulb") or object with options'
            },

            // Style Properties
            style: {
                type: 'object',
                description: 'Style overrides (color, textColor, fontSize, etc.)'
            },
            width: {
                type: 'number',
                description: 'Fixed width in pixels (optional - auto-sizes to container by default)'
            },
            height: {
                type: 'number',
                description: 'Fixed height in pixels (optional - auto-sizes to container by default)'
            },

            // Grid Layout Properties
            grid_columns: {
                type: 'number',
                description: 'Number of grid columns to span (default: 2)',
                minimum: 1
            },
            grid_rows: {
                type: 'number',
                description: 'Number of grid rows to span (default: 1)',
                minimum: 1
            },
            grid_min_columns: {
                type: 'number',
                description: 'Minimum columns required (default: 1)',
                minimum: 1
            },
            grid_min_rows: {
                type: 'number',
                description: 'Minimum rows required (default: 1)',
                minimum: 1
            },

            // Action Properties
            tap_action: {
                type: 'object',
                description: 'Action to perform on tap'
            },
            hold_action: {
                type: 'object',
                description: 'Action to perform on hold'
            },
            double_tap_action: {
                type: 'object',
                description: 'Action to perform on double-tap'
            },

            // Rules & Animations
            rules: {
                type: 'array',
                description: 'Card-local rules for dynamic styling based on entity states',
                items: {
                    type: 'object',
                    properties: {
                        id: { type: 'string' },
                        when: { type: 'object' },
                        apply: { type: 'object' }
                    },
                    required: ['id', 'when', 'apply']
                }
            },
            animations: {
                type: 'array',
                description: 'Animation configurations (experimental)',
                items: { type: 'object' }
            }
        }
        // No required fields - allows decorative/static buttons without entities
    }, { version: '1.0' });

    lcardsLog.debug('[LCARdSSimpleButtonCard] Registered with CoreConfigManager');
}

// Register with card picker
window.customCards = window.customCards || [];
window.customCards.push({
    type: 'lcards-simple-button',
    name: 'LCARdS Button',
    description: 'LCARS-styled button with actions and templates',
    preview: true
});

lcardsLog.debug('[LCARdSSimpleButtonCard] Card registered');