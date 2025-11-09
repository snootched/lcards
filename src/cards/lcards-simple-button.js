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
import { SimpleButtonRenderer } from './renderers/SimpleButtonRenderer.js';
import { lcardsLog } from '../utils/lcards-logging.js';

export class LCARdSSimpleButtonCard extends LCARdSSimpleCard {

    static get properties() {
        return {
            ...super.properties,
            _processedLabel: { type: String, state: true },
            _processedContent: { type: String, state: true },
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
                    background: rgba(255, 0, 0, 0.1); /* Debug: red tint */
                    border: 1px dashed #ccc; /* Debug: border */
                }

                .button-svg {
                    display: block;
                    width: 200px;
                    height: 60px;
                    cursor: pointer;
                    border: 1px solid #00ff00; /* Debug: green border */
                }

                .button-svg:hover {
                    opacity: 0.8;
                }

                /* Ensure LCARS theme variables are available */
                .button-bg {
                    fill: var(--lcars-orange, #FF9900) !important;
                    stroke: var(--lcars-color-secondary, #000000) !important;
                }

                .button-text {
                    fill: var(--lcars-color-text, #000000) !important;
                }
            `
        ];
    }

    constructor() {
        super();
        this._processedLabel = '';
        this._processedContent = '';
        this._buttonStyle = null;
        this._actionCleanup = null;
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
        // Process templates initially (sync to avoid update cycles)
        this._processTemplatesSync();

        // Setup actions after DOM is ready
        this.updateComplete.then(() => {
            this._setupButtonActions();
        });
    }

    /**
     * Schedule template processing to avoid Lit update cycles
     * @private
     */
    _scheduleTemplateUpdate() {
        if (this._templateUpdateScheduled) return;

        this._templateUpdateScheduled = true;
        requestAnimationFrame(() => {
            this._templateUpdateScheduled = false;

            // Process templates synchronously
            this._processTemplatesSync();

            // Re-render only if we're not in an update cycle
            if (!this.hasUpdated || this.updateComplete === Promise.resolve()) {
                this.requestUpdate();
            } else {
                // Wait for current update to complete
                this.updateComplete.then(() => {
                    this.requestUpdate();
                });
            }
        });
    }

    /**
     * Process templates synchronously to avoid update cycles
     * @private
     */
    _processTemplatesSync() {
        // Process label template
        const rawLabel = this.config.label || this.config.text || '';
        const newLabel = this.processTemplate(rawLabel);

        // Process content template
        const rawContent = this.config.content || this.config.value || '';
        const newContent = this.processTemplate(rawContent);

        // Only update if values actually changed to avoid unnecessary re-renders
        const labelsChanged = this._processedLabel !== newLabel;
        const contentChanged = this._processedContent !== newContent;

        if (labelsChanged || contentChanged) {
            this._processedLabel = newLabel;
            this._processedContent = newContent;

            // Resolve button style after templates change
            this._resolveButtonStyleSync();

            lcardsLog.debug(`[LCARdSSimpleButtonCard] Templates processed:`, {
                label: this._processedLabel,
                content: this._processedContent,
                changed: { labelsChanged, contentChanged }
            });
        }
    }

    /**
     * Resolve button style synchronously to avoid update cycles
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

        // Resolve with theme tokens (only update if changed)
        const newStyle = this.resolveStyle(style, [
            'colors.accent.primary',
            'colors.text.primary'
        ], stateOverrides);

        if (!this._buttonStyle || JSON.stringify(this._buttonStyle) !== JSON.stringify(newStyle)) {
            this._buttonStyle = newStyle;
            lcardsLog.debug(`[LCARdSSimpleButtonCard] Button style resolved:`, this._buttonStyle);
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
     * Setup action handlers on the rendered button
     * @private
     */
    _setupButtonActions() {
        // Clean up previous actions
        if (this._actionCleanup) {
            this._actionCleanup();
            this._actionCleanup = null;
        }

        // Find button element
        const buttonGroup = this.shadowRoot.querySelector('[data-button-id]');
        if (!buttonGroup) {
            lcardsLog.warn(`[LCARdSSimpleButtonCard] Button element not found for action setup`);
            return;
        }

        // Get action configurations
        const actions = {
            tap_action: this.config.tap_action || { action: 'toggle' },
            hold_action: this.config.hold_action,
            double_tap_action: this.config.double_tap_action
        };

        // Setup actions using helper
        this._actionCleanup = this.setupActions(buttonGroup, actions);

        lcardsLog.debug(`[LCARdSSimpleButtonCard] Actions setup complete`);
    }

    /**
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
     * Render button content using SimpleButtonRenderer
     * @private
     */
    _renderButtonContent() {
        const width = this.config.width || 200;
        const height = this.config.height || 60;

        // Build button configuration for ButtonRenderer
        const buttonConfig = {
            id: this._cardGuid,
            label: this._processedLabel,
            content: this._processedContent,
            preset: this.config.preset, // ✅ FIX: Pass preset to renderer
            tap_action: this.config.tap_action,
            hold_action: this.config.hold_action,
            double_tap_action: this.config.double_tap_action
        };

        // Render synchronously with fallback SVG
        try {
            const svgMarkup = this._generateSimpleButtonSVG(width, height, buttonConfig);

            return html`
                <div class="button-container">
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
     * Generate simple button SVG markup directly
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

        return `
            <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
                <defs>
                    <style>
                        .button-bg {
                            fill: ${primary};
                            stroke: var(--lcars-color-secondary, #000000);
                            stroke-width: ${strokeWidth};
                        }
                        .button-text {
                            fill: ${textColor};
                            font-family: 'LCARS', 'Antonio', sans-serif;
                            font-size: 14px;
                            font-weight: bold;
                            text-anchor: middle;
                            dominant-baseline: central;
                        }
                    </style>
                </defs>

                <g data-button-id="simple-button" class="button-group">
                    <rect
                        class="button-bg button-clickable"
                        x="${strokeWidth/2}"
                        y="${strokeWidth/2}"
                        width="${width - strokeWidth}"
                        height="${height - strokeWidth}"
                        rx="${cornerRadius}"
                        ry="${cornerRadius}"
                    />

                    <text
                        class="button-text"
                        x="${width/2}"
                        y="${height/2}">
                        ${this._escapeXML(text)}
                    </text>
                </g>
            </svg>
        `.trim();
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
        if (this._actionCleanup) {
            this._actionCleanup();
            this._actionCleanup = null;
        }
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

// Register with card picker
window.customCards = window.customCards || [];
window.customCards.push({
    type: 'lcards-simple-button',
    name: 'LCARdS Simple Button',
    description: 'Simple LCARS-styled button with actions and templates',
    preview: true
});

lcardsLog.debug('[LCARdSSimpleButtonCard] Card registered');