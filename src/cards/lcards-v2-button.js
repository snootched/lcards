/**
 * LCARdS V2 Button Card
 *
 * Lightweight button card that leverages the singleton architecture.
 * Demonstrates the V2 card pattern with:
 * - Direct singleton integration
 * - Rule-responsive styling
 * - Theme-aware appearance
 * - Simple configuration schema
 *
 * Example configuration:
 * ```yaml
 * type: custom:lcards-v2-button
 * entity: light.bedroom
 * text: "Bedroom Light"
 * icon: mdi:lightbulb
 * tap_action:
 *   action: toggle
 * overlay_id: bedroom_button  # Makes it targetable by rules
 * tags: [lighting, bedroom]   # Tag-based rule targeting
 * ```
 */

import { html, css } from 'lit';
import { LCARdSV2Card } from '../base/LCARdSV2Card.js';
import { lcardsLog } from '../utils/lcards-logging.js';

export class LCARdSV2ButtonCard extends LCARdSV2Card {

    static get properties() {
        return {
            ...super.properties,

            // Button-specific state
            _buttonState: { type: String, state: true },
            _buttonStyle: { type: Object, state: true },
            _isPressed: { type: Boolean, state: true },

            // Template processing results
            _processedText: { type: String, state: true },
            _processedState: { type: String, state: true }
        };
    }

    static get styles() {
        return [
            super.styles,
            css`
                .v2-button {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 12px 24px;
                    border-radius: 8px;
                    cursor: pointer;
                    user-select: none;
                    transition: all 0.2s ease;
                    min-height: 48px;

                    /* Default LCARdS styling */
                    background: var(--lcars-button-background, var(--primary-color));
                    color: var(--lcars-button-text, var(--text-primary-color));
                    border: 2px solid var(--lcars-button-border, var(--primary-color));
                    font-family: var(--lcars-font-family, 'Roboto', sans-serif);
                    font-size: var(--lcars-button-font-size, 14px);
                    font-weight: var(--lcars-button-font-weight, 500);
                }

                .v2-button:hover {
                    opacity: 0.9;
                    transform: translateY(-1px);
                }

                .v2-button:active,
                .v2-button.pressed {
                    transform: translateY(0);
                    opacity: 0.8;
                }

                .v2-button.state-on {
                    background: var(--lcars-button-on-background, var(--accent-color));
                    border-color: var(--lcars-button-on-border, var(--accent-color));
                }

                .v2-button.state-off {
                    background: var(--lcars-button-off-background, var(--disabled-color));
                    border-color: var(--lcars-button-off-border, var(--disabled-color));
                }

                .v2-button.state-unavailable {
                    background: var(--lcars-button-unavailable-background, #666);
                    border-color: var(--lcars-button-unavailable-border, #666);
                    cursor: not-allowed;
                    opacity: 0.5;
                }

                .button-icon {
                    margin-right: 8px;
                    font-size: 18px;
                }

                .button-text {
                    flex: 1;
                    text-align: center;
                }

                .button-state {
                    margin-left: 8px;
                    font-size: 12px;
                    opacity: 0.8;
                }

                /* Rule-based styling overrides */
                .v2-button[data-rule-applied="true"] {
                    position: relative; /* Applied when rules modify the button */
                }
            `
        ];
    }

    constructor() {
        super();

        // Button-specific state
        this._buttonState = 'unknown';
        this._buttonStyle = {};
        this._isPressed = false;

        // Template processing results
        this._processedText = null;
        this._processedState = null;
    }

    /**
     * Set button configuration with validation
     */
    setConfig(config) {
        // Basic validation
        if (!config) {
            throw new Error('V2 Button Card: Configuration required');
        }

        if (!config.entity && !config.text) {
            throw new Error('V2 Button Card: Either entity or text is required');
        }

        // Call parent setConfig
        super.setConfig(config);

        // Register this button as an overlay target for rules
        if (config.overlay_id) {
            setTimeout(() => {
                this._registerOverlayTarget(config.overlay_id, this);
            }, 0);
        }

        // Register tags for rule targeting
        if (config.tags && Array.isArray(config.tags)) {
            config.tags.forEach(tag => {
                this.setAttribute(`data-tag-${tag}`, 'true');
            });
        }
    }

    /**
     * Apply overlay patch from rules engine
     */
    _applyOverlayPatch(patch) {
        super._applyOverlayPatch(patch);

        // Check if this patch targets our button
        const overlayId = this.config?.overlay_id;
        if (!overlayId || patch.selector !== overlayId) {
            // Check tag-based targeting
            if (!this._matchesTagSelector(patch.selector)) {
                return;
            }
        }

        lcardsLog.debug(`[LCARdSV2ButtonCard] Applying patch to button (${this._cardId}):`, patch);

        // Apply style patches
        if (patch.style) {
            this._buttonStyle = { ...this._buttonStyle, ...patch.style };
            this.setAttribute('data-rule-applied', 'true');
            this.requestUpdate();
        }

        // Apply content patches
        if (patch.content) {
            // Button cards can have dynamic text content
            this._dynamicContent = patch.content;
            this.requestUpdate();
        }
    }

    /**
     * Check if button matches tag-based selector
     */
    _matchesTagSelector(selector) {
        // Handle tag selectors like "*[tag~='emergency']"
        if (selector.includes('[tag~=')) {
            const tagMatch = selector.match(/\[tag~=['"]([^'"]+)['"]\]/);
            if (tagMatch) {
                const targetTag = tagMatch[1];
                return this.hasAttribute(`data-tag-${targetTag}`);
            }
        }
        return false;
    }

    /**
     * Handle button tap
     */
    _handleTap(event) {
        if (!this.config || this._buttonState === 'unavailable') {
            return;
        }

        const tapAction = this.config.tap_action || { action: 'toggle' };

        this._isPressed = true;
        setTimeout(() => {
            this._isPressed = false;
            this.requestUpdate();
        }, 150);

        lcardsLog.debug(`[LCARdSV2ButtonCard] Button tapped (${this._cardId}):`, {
            entity: this.config.entity,
            action: tapAction.action
        });

        // Execute tap action
        this._executeTapAction(tapAction);

        this.requestUpdate();
    }

    /**
     * Execute tap action
     */
    _executeTapAction(tapAction) {
        if (!this.hass || !this.config.entity) {
            return;
        }

        switch (tapAction.action) {
            case 'toggle':
                this.hass.callService('homeassistant', 'toggle', {
                    entity_id: this.config.entity
                });
                break;

            case 'turn_on':
                this.hass.callService('homeassistant', 'turn_on', {
                    entity_id: this.config.entity
                });
                break;

            case 'turn_off':
                this.hass.callService('homeassistant', 'turn_off', {
                    entity_id: this.config.entity
                });
                break;

            case 'call-service':
                if (tapAction.service) {
                    const [domain, service] = tapAction.service.split('.');
                    this.hass.callService(domain, service, tapAction.service_data || {});
                }
                break;

            default:
                lcardsLog.warn(`[LCARdSV2ButtonCard] Unknown tap action: ${tapAction.action}`);
        }
    }

    /**
     * Update button state based on entity
     */
    updated(changedProperties) {
        super.updated(changedProperties);

        if (changedProperties.has('hass') && this.hass && this.config?.entity) {
            const entity = this.hass.states[this.config.entity];
            if (entity) {
                this._buttonState = entity.state;
            } else {
                this._buttonState = 'unavailable';
            }

            // Process templates when entity state changes
            this._processTemplates();
        }

        if (changedProperties.has('config') && this.config) {
            // Process templates when config changes
            this._processTemplates();
        }
    }

    /**
     * Process templates for dynamic content
     * @private
     */
    async _processTemplates() {
        if (!this._initialized || !this.systemsManager) {
            return;
        }

        try {
            // Process text template
            if (this.config.text && typeof this.config.text === 'string') {
                this._processedText = await this.processTemplate(this.config.text);
            }

            // Process state display template
            if (this.config.state_display && typeof this.config.state_display === 'string') {
                this._processedState = await this.processTemplate(this.config.state_display);
            }

            // Request re-render if templates were processed
            this.requestUpdate();

        } catch (error) {
            lcardsLog.error(`[LCARdSV2ButtonCard] Template processing failed (${this._cardId}):`, error);
        }
    }

    /**
     * Get state-specific style overrides
     * @private
     */
    _getStateStyleOverrides() {
        const overrides = {};

        // Apply rule-based styling from _buttonStyle
        Object.entries(this._buttonStyle).forEach(([key, value]) => {
            if (key === 'border') {
                if (value.color) overrides.borderColor = value.color;
                if (value.width) overrides.borderWidth = `${value.width}px`;
            } else if (key === 'label_color' || key === 'color') {
                overrides.color = value;
            } else if (key === 'background' || key === 'background_color') {
                overrides.backgroundColor = value;
            } else {
                // Convert camelCase to kebab-case
                const cssKey = key.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
                overrides[cssKey] = value;
            }
        });

        return overrides;
    }

    /**
     * Render the button
     */
    render() {
        if (!this.config) {
            return super.render();
        }

        if (!this._initialized) {
            return html`
                <div class="v2-card-container">
                    <div class="v2-card-loading">
                        Initializing V2 Button...
                    </div>
                </div>
            `;
        }

        const entity = this.hass?.states[this.config.entity];

        // Use template processing for text display
        let displayText;
        let displayState;

        if (this.config.text) {
            // Process text template if it exists
            displayText = this._processedText || this.config.text;
        } else {
            displayText = entity?.attributes.friendly_name || 'Button';
        }

        if (this.config.state_display) {
            // Process state display template if it exists
            displayState = this._processedState || (entity?.state || 'unknown');
        } else {
            displayState = entity?.state || 'unknown';
        }

        // Compute button classes
        const buttonClasses = [
            'v2-button',
            `state-${this._buttonState}`,
            this._isPressed ? 'pressed' : ''
        ].filter(Boolean).join(' ');

        // Resolve styles using V2 style resolver
        const baseStyle = {};
        const themeTokens = [
            'components.button.backgroundColor',
            'components.button.color',
            'components.button.borderColor',
            'components.button.fontSize'
        ];
        const stateOverrides = this._getStateStyleOverrides();

        let resolvedStyle = {};
        if (this.systemsManager) {
            resolvedStyle = this.resolveStyle(baseStyle, themeTokens, stateOverrides);
        } else {
            // Fallback if systems manager not ready
            resolvedStyle = { ...baseStyle, ...stateOverrides };
        }

        // Convert to inline CSS string
        const styleString = Object.entries(resolvedStyle)
            .map(([key, value]) => `${key}: ${value}`)
            .join('; ');

        return html`
            <div class="v2-card-container">
                <div
                    class="${buttonClasses}"
                    style="${styleString}"
                    @click="${this._handleTap}"
                >
                    ${this.config.icon ? html`
                        <ha-icon class="button-icon" .icon="${this.config.icon}"></ha-icon>
                    ` : ''}

                    <span class="button-text">${displayText}</span>

                    ${this.config.show_state !== false ? html`
                        <span class="button-state">${displayState}</span>
                    ` : ''}
                </div>
            </div>
        `;
    }

    /**
     * Get card size
     */
    getCardSize() {
        return 1; // Small button card
    }

    /**
     * Editor configuration schema
     */
    static getConfigElement() {
        // Return editor element when implemented
        return document.createElement('div');
    }

    /**
     * Stub configuration for card picker
     */
    static getStubConfig() {
        return {
            type: 'custom:lcards-v2-button',
            entity: 'light.example',
            text: 'Example Button',
            icon: 'mdi:lightbulb',
            overlay_id: 'example_button',
            tags: ['example']
        };
    }
}

// Register the card
customElements.define('lcards-v2-button', LCARdSV2ButtonCard);

// Register with card picker
window.customCards = window.customCards || [];
window.customCards.push({
    type: 'lcards-v2-button',
    name: 'LCARdS V2 Button',
    description: 'Lightweight button card with singleton architecture support',
    preview: true
});

lcardsLog.debug('[LCARdSV2ButtonCard] V2 Button Card registered');