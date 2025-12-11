/**
 * LCARdS Icon Editor
 *
 * Configure icon with simple/advanced modes and full styling options.
 * - Simple mode: icon string + basic size/color
 * - Advanced mode: object with background, rotation, padding, state colors
 *
 * @example
 * <lcards-icon-editor
 *   .editor=${this}
 *   path="icon"
 *   label="Icon"
 *   .hass=${this.hass}
 *   @value-changed=${this._handleIconChange}>
 * </lcards-icon-editor>
 */

import { LitElement, html, css } from 'lit';
import './lcards-form-section.js';
import './lcards-color-section.js';

export class LCARdSIconEditor extends LitElement {

    static get properties() {
        return {
            editor: { type: Object },         // Parent editor reference
            path: { type: String },           // Config path (e.g., 'icon')
            label: { type: String },          // Label for the section
            hass: { type: Object },           // Home Assistant instance
            _mode: { type: String, state: true }, // 'simple' or 'advanced'
            _iconConfig: { type: Object, state: true } // Current icon configuration
        };
    }

    constructor() {
        super();
        this.editor = null;
        this.path = 'icon';
        this.label = 'Icon Configuration';
        this.hass = null;
        this._mode = 'simple';
        this._iconConfig = null;
    }

    static get styles() {
        return css`
            :host {
                display: block;
            }

            .mode-selector {
                display: flex;
                gap: 16px;
                margin-bottom: 16px;
                padding: 8px;
                background: var(--secondary-background-color, #f5f5f5);
                border-radius: 8px;
            }

            .mode-option {
                display: flex;
                align-items: center;
                gap: 8px;
            }

            .mode-option input[type="radio"] {
                cursor: pointer;
            }

            .mode-option label {
                cursor: pointer;
                font-weight: 500;
                color: var(--primary-text-color, #212121);
            }

            .form-row {
                margin-bottom: 16px;
            }

            .form-row label {
                display: block;
                font-weight: 500;
                color: var(--primary-text-color, #212121);
                font-size: 14px;
                margin-bottom: 8px;
                padding: 2px 8px;
            }

            .form-row .helper-text {
                font-size: 12px;
                color: var(--secondary-text-color, #727272);
                margin-top: 4px;
                padding: 0 8px;
            }

            ha-selector,
            ha-textfield {
                width: 100%;
                display: block;
            }

            .checkbox-field {
                display: flex;
                align-items: center;
                gap: 8px;
                padding: 8px;
            }

            .checkbox-field input[type="checkbox"] {
                cursor: pointer;
            }

            .checkbox-field label {
                cursor: pointer;
                margin: 0;
            }
        `;
    }

    connectedCallback() {
        super.connectedCallback();
        this._loadIconConfig();
    }

    /**
     * Load icon configuration from editor
     * @private
     */
    _loadIconConfig() {
        if (!this.editor) return;

        const iconValue = this.editor._getConfigValue(this.path);
        
        if (typeof iconValue === 'string') {
            this._mode = 'simple';
            this._iconConfig = { icon: iconValue };
        } else if (typeof iconValue === 'object' && iconValue !== null) {
            this._mode = 'advanced';
            this._iconConfig = iconValue;
        } else {
            this._mode = 'simple';
            this._iconConfig = { icon: '' };
        }
    }

    render() {
        if (!this.editor) {
            return html`<div>Icon editor requires 'editor' property</div>`;
        }

        return html`
            <lcards-form-section
                header="${this.label}"
                description="Configure icon appearance and behavior"
                icon="mdi:alpha-i-circle-outline"
                ?expanded=${true}
                ?outlined=${true}
                headerLevel="4">

                <!-- Mode Selector -->
                <div class="mode-selector">
                    <div class="mode-option">
                        <input
                            type="radio"
                            id="mode-simple"
                            name="icon-mode"
                            value="simple"
                            .checked=${this._mode === 'simple'}
                            @change=${() => this._handleModeChange('simple')}>
                        <label for="mode-simple">Simple</label>
                    </div>
                    <div class="mode-option">
                        <input
                            type="radio"
                            id="mode-advanced"
                            name="icon-mode"
                            value="advanced"
                            .checked=${this._mode === 'advanced'}
                            @change=${() => this._handleModeChange('advanced')}>
                        <label for="mode-advanced">Advanced</label>
                    </div>
                </div>

                ${this._mode === 'simple' ? this._renderSimpleMode() : this._renderAdvancedMode()}
            </lcards-form-section>
        `;
    }

    /**
     * Render simple mode (icon string + basic controls)
     * @returns {TemplateResult}
     * @private
     */
    _renderSimpleMode() {
        const iconValue = typeof this._iconConfig === 'string' ? this._iconConfig : (this._iconConfig?.icon || '');

        return html`
            <div class="form-row">
                <label>Icon</label>
                <ha-selector
                    .hass=${this.hass}
                    .selector=${{ icon: {} }}
                    .value=${iconValue}
                    @value-changed=${(e) => this._handleSimpleIconChange(e.detail.value)}>
                </ha-selector>
                <div class="helper-text">
                    Use 'entity' for entity's icon, or specify an MDI icon like 'mdi:lightbulb'
                </div>
            </div>
        `;
    }

    /**
     * Render advanced mode (full icon configuration)
     * @returns {TemplateResult}
     * @private
     */
    _renderAdvancedMode() {
        const config = this._iconConfig || {};

        return html`
            <!-- Icon Selector -->
            <div class="form-row">
                <label>Icon</label>
                <ha-selector
                    .hass=${this.hass}
                    .selector=${{ icon: {} }}
                    .value=${config.icon || ''}
                    @value-changed=${(e) => this._updateIconProperty('icon', e.detail.value)}>
                </ha-selector>
            </div>

            <!-- Position -->
            <div class="form-row">
                <label>Position</label>
                <ha-selector
                    .hass=${this.hass}
                    .selector=${{ 
                        select: { 
                            options: [
                                { value: 'center', label: 'Center' },
                                { value: 'top-left', label: 'Top Left' },
                                { value: 'top-center', label: 'Top Center' },
                                { value: 'top-right', label: 'Top Right' },
                                { value: 'left-center', label: 'Left Center' },
                                { value: 'right-center', label: 'Right Center' },
                                { value: 'bottom-left', label: 'Bottom Left' },
                                { value: 'bottom-center', label: 'Bottom Center' },
                                { value: 'bottom-right', label: 'Bottom Right' }
                            ]
                        }
                    }}
                    .value=${config.position || 'center'}
                    @value-changed=${(e) => this._updateIconProperty('position', e.detail.value)}>
                </ha-selector>
            </div>

            <!-- Size -->
            <div class="form-row">
                <label>Size (px)</label>
                <ha-textfield
                    type="number"
                    .value=${config.size || 24}
                    @input=${(e) => this._updateIconProperty('size', Number(e.target.value))}>
                </ha-textfield>
            </div>

            <!-- Rotation -->
            <div class="form-row">
                <label>Rotation (degrees)</label>
                <ha-textfield
                    type="number"
                    .value=${config.rotation || 0}
                    min="0"
                    max="360"
                    @input=${(e) => this._updateIconProperty('rotation', Number(e.target.value))}>
                </ha-textfield>
            </div>

            <!-- Show Icon -->
            <div class="checkbox-field">
                <input
                    type="checkbox"
                    id="show-icon"
                    .checked=${config.show !== false}
                    @change=${(e) => this._updateIconProperty('show', e.target.checked)}>
                <label for="show-icon">Show Icon</label>
            </div>

            <!-- Icon Colors -->
            <lcards-color-section
                .editor=${this.editor}
                basePath="${this.path}.color"
                header="Icon Colors"
                .states=${['default', 'active', 'inactive', 'unavailable']}
                ?expanded=${false}>
            </lcards-color-section>

            <!-- Background Configuration -->
            <lcards-form-section
                header="Background"
                description="Configure icon background styling"
                ?expanded=${false}
                ?outlined=${true}
                headerLevel="5">

                <div class="checkbox-field">
                    <input
                        type="checkbox"
                        id="enable-background"
                        .checked=${config.background?.enabled === true}
                        @change=${(e) => this._updateIconProperty('background.enabled', e.target.checked)}>
                    <label for="enable-background">Enable Background</label>
                </div>

                ${config.background?.enabled ? html`
                    <div class="form-row">
                        <label>Background Color</label>
                        <ha-selector
                            .hass=${this.hass}
                            .selector=${{ color_rgb: {} }}
                            .value=${config.background?.color || '#333333'}
                            @value-changed=${(e) => this._updateIconProperty('background.color', e.detail.value)}>
                        </ha-selector>
                    </div>

                    <div class="form-row">
                        <label>Radius (%)</label>
                        <ha-textfield
                            type="number"
                            .value=${config.background?.radius || 50}
                            min="0"
                            max="100"
                            @input=${(e) => this._updateIconProperty('background.radius', Number(e.target.value))}>
                        </ha-textfield>
                    </div>

                    <div class="form-row">
                        <label>Padding (px)</label>
                        <ha-textfield
                            type="number"
                            .value=${config.background?.padding || 8}
                            @input=${(e) => this._updateIconProperty('background.padding', Number(e.target.value))}>
                        </ha-textfield>
                    </div>
                ` : ''}
            </lcards-form-section>
        `;
    }

    /**
     * Handle mode change (simple/advanced)
     * @param {string} mode - New mode ('simple' or 'advanced')
     * @private
     */
    _handleModeChange(mode) {
        this._mode = mode;

        if (mode === 'simple') {
            // Convert advanced config to simple string
            const iconString = typeof this._iconConfig === 'object' ? this._iconConfig.icon : this._iconConfig;
            this._iconConfig = iconString || '';
            this._updateConfig(iconString);
        } else {
            // Convert simple string to advanced object
            const iconString = typeof this._iconConfig === 'string' ? this._iconConfig : (this._iconConfig?.icon || '');
            this._iconConfig = { icon: iconString };
            this._updateConfig(this._iconConfig);
        }
    }

    /**
     * Handle simple icon change
     * @param {string} value - Icon string
     * @private
     */
    _handleSimpleIconChange(value) {
        this._iconConfig = value;
        this._updateConfig(value);
    }

    /**
     * Update icon property in advanced mode
     * @param {string} property - Property path (e.g., 'background.color')
     * @param {*} value - New value
     * @private
     */
    _updateIconProperty(property, value) {
        const keys = property.split('.');
        const updatedConfig = { ...this._iconConfig };
        
        let current = updatedConfig;
        for (let i = 0; i < keys.length - 1; i++) {
            if (!current[keys[i]]) {
                current[keys[i]] = {};
            }
            current = current[keys[i]];
        }
        current[keys[keys.length - 1]] = value;

        this._iconConfig = updatedConfig;
        this._updateConfig(updatedConfig);
    }

    /**
     * Update config in parent editor
     * @param {*} value - New icon configuration
     * @private
     */
    _updateConfig(value) {
        if (this.editor) {
            this.editor._setConfigValue(this.path, value);
        }

        // Also dispatch value-changed event
        this.dispatchEvent(new CustomEvent('value-changed', {
            detail: { value },
            bubbles: true,
            composed: true
        }));
    }
}

customElements.define('lcards-icon-editor', LCARdSIconEditor);
