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
 * type: custom:lcar                <g data-button-id="simple-button"
                   data-overlay-id="simple-button"
                   data-overlay-type="button"
                   class="button-group"
                   style="pointer-events: all; cursor: pointer;">
                    <rectimple-button
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
     * Get state-based style overrides
     * @private
     */
    _getStateOverrides() {
        if (!this._entity) {
            return {};
        }

        const state = this._entity.state;
        const overrides = {};

        // Apply state-specific colors
        switch (state) {
            case 'on':
                overrides.color = 'var(--accent-color, #ff9900)';
                break;
            case 'off':
                overrides.color = 'var(--disabled-color, #666666)';
                overrides.opacity = 0.6;
                break;
            case 'unavailable':
                overrides.color = 'var(--error-color, #ff0000)';
                overrides.opacity = 0.4;
                break;
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

        const width = this.config.width || 200;
        const height = this.config.height || 60;

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
    _generateSimpleButtonSVG(width, height, config) {
        const cornerRadius = config.preset === 'lozenge' ? 30 :
                            config.preset === 'pill' ? 50 :
                            config.preset === 'rectangle' ? 5 : 20;

        const primary = this._buttonStyle?.primary || 'var(--lcars-orange, #FF9900)';
        const textColor = this._buttonStyle?.textColor || 'var(--lcars-color-text, #FFFFFF)';

        const strokeWidth = 2;
        const text = config.label || 'Button';

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
                        rx="${cornerRadius}"
                        ry="${cornerRadius}"
                        style="fill: ${primary}; stroke: var(--lcars-color-secondary, #000000); stroke-width: ${strokeWidth};"
                    />

                    <text
                        class="button-text"
                        style="pointer-events: none; fill: ${textColor}; font-family: 'LCARS', 'Antonio', sans-serif; font-size: 14px; font-weight: bold; text-anchor: middle; dominant-baseline: central;"
                        x="${width/2}"
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

        // Clear element reference
        this._lastActionElement = null;

        super.disconnectedCallback();
    }

    /**
     * Get card size for Home Assistant layout
     */
    getCardSize() {
        return 1;
    }

    /**
     * Get stub config for card picker
     */
    static getStubConfig() {
        return {
            type: 'custom:lcards-simple-button',
            entity: 'light.example',
            label: 'Example Button',
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
            entity: {
                type: 'string',
                description: 'Entity ID to control'
            },
            label: {
                type: 'string',
                description: 'Button label text (supports templates)'
            },
            content: {
                type: 'string',
                description: 'Additional content text (supports templates)'
            },
            preset: {
                type: 'string',
                description: 'Style preset name (e.g., "lozenge", "pill")'
            },
            show_label: {
                type: 'boolean',
                description: 'Whether to display the label'
            },
            show_icon: {
                type: 'boolean',
                description: 'Whether to display an icon'
            },
            enable_hold_action: {
                type: 'boolean',
                description: 'Whether hold action is enabled'
            },
            enable_double_tap: {
                type: 'boolean',
                description: 'Whether double-tap is enabled'
            },
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
            style: {
                type: 'object',
                description: 'Style overrides'
            }
        },
        required: ['entity']
    }, { version: '1.0' });

    lcardsLog.debug('[LCARdSSimpleButtonCard] Registered with CoreConfigManager');
}

// Register with card picker
window.customCards = window.customCards || [];
window.customCards.push({
    type: 'lcards-simple-button',
    name: 'LCARdS Simple Button',
    description: 'Simple LCARS-styled button with actions and templates',
    preview: true
});

lcardsLog.debug('[LCARdSSimpleButtonCard] Card registered');