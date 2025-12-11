/**
 * LCARdS Multi-Text Editor
 *
 * Simplified multi-text field manager for button cards.
 * Manages preset text fields (name, label, state) with basic configuration.
 *
 * @example
 * <lcards-multi-text-editor
 *   .editor=${this}
 *   .textConfig=${this.config.text || {}}
 *   .presetFields=${['name', 'label', 'state']}
 *   .hass=${this.hass}
 *   @value-changed=${this._handleTextChange}>
 * </lcards-multi-text-editor>
 */

import { LitElement, html, css } from 'lit';
import './lcards-form-section.js';
import './lcards-color-section.js';

export class LCARdSMultiTextEditor extends LitElement {

    static get properties() {
        return {
            editor: { type: Object },         // Parent editor reference
            textConfig: { type: Object },     // config.text object
            presetFields: { type: Array },    // ['name', 'label', 'state']
            hass: { type: Object },           // Home Assistant instance
            _expandedField: { type: String, state: true } // Currently expanded field
        };
    }

    constructor() {
        super();
        this.editor = null;
        this.textConfig = {};
        this.presetFields = ['name', 'label', 'state'];
        this.hass = null;
        this._expandedField = null;
    }

    static get styles() {
        return css`
            :host {
                display: block;
            }

            .text-field-list {
                display: flex;
                flex-direction: column;
                gap: 12px;
            }

            .text-field-item {
                border: 1px solid var(--divider-color, #e0e0e0);
                border-radius: 8px;
                padding: 12px;
                background: var(--card-background-color, #fff);
            }

            .field-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 8px;
                cursor: pointer;
            }

            .field-title {
                font-weight: 500;
                color: var(--primary-text-color, #212121);
                font-size: 14px;
                text-transform: capitalize;
            }

            .field-details {
                margin-top: 12px;
                padding-top: 12px;
                border-top: 1px solid var(--divider-color, #e0e0e0);
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
            }

            .form-row .helper-text {
                font-size: 12px;
                color: var(--secondary-text-color, #727272);
                margin-top: 4px;
            }

            ha-textfield,
            ha-selector {
                width: 100%;
                display: block;
            }

            .checkbox-field {
                display: flex;
                align-items: center;
                gap: 8px;
                padding: 8px 0;
            }

            .checkbox-field input[type="checkbox"] {
                cursor: pointer;
            }

            .checkbox-field label {
                cursor: pointer;
                margin: 0;
            }

            mwc-icon-button {
                --mdc-icon-size: 20px;
            }
        `;
    }

    render() {
        return html`
            <lcards-form-section
                header="Text Fields"
                description="Configure text content for the button"
                icon="mdi:format-textbox"
                ?expanded=${true}
                ?outlined=${true}
                headerLevel="4">

                <div class="text-field-list">
                    ${this.presetFields.map(fieldName => this._renderTextField(fieldName))}
                </div>
            </lcards-form-section>
        `;
    }

    /**
     * Render individual text field
     * @param {string} fieldName - Field name (e.g., 'name', 'label', 'state')
     * @returns {TemplateResult}
     * @private
     */
    _renderTextField(fieldName) {
        const fieldConfig = this.textConfig[fieldName] || {};
        const isExpanded = this._expandedField === fieldName;

        return html`
            <div class="text-field-item">
                <div class="field-header" @click=${() => this._toggleExpanded(fieldName)}>
                    <div class="field-title">${fieldName}</div>
                    <mwc-icon-button
                        icon="${isExpanded ? 'mdi:chevron-up' : 'mdi:chevron-down'}"
                        title="${isExpanded ? 'Collapse' : 'Expand'}">
                    </mwc-icon-button>
                </div>

                ${isExpanded ? html`
                    <div class="field-details">
                        ${this._renderFieldForm(fieldName, fieldConfig)}
                    </div>
                ` : html`
                    <div style="font-size: 12px; color: var(--secondary-text-color);">
                        ${fieldConfig.content || 'No content set'}
                    </div>
                `}
            </div>
        `;
    }

    /**
     * Render field configuration form
     * @param {string} fieldName - Field name
     * @param {Object} fieldConfig - Field configuration
     * @returns {TemplateResult}
     * @private
     */
    _renderFieldForm(fieldName, fieldConfig) {
        return html`
            <div class="form-row">
                <label>Content</label>
                <ha-textfield
                    .value=${fieldConfig.content || ''}
                    @input=${(e) => this._updateFieldProperty(fieldName, 'content', e.target.value)}
                    placeholder="Enter text content (supports templates)">
                </ha-textfield>
                <div class="helper-text">
                    Supports templates like {{entity.state}}, {{entity.attributes.friendly_name}}
                </div>
            </div>

            <div class="form-row">
                <label>Position</label>
                <ha-selector
                    .hass=${this.hass}
                    .selector=${{
                        select: {
                            options: [
                                { value: 'top-left', label: 'Top Left' },
                                { value: 'top-center', label: 'Top Center' },
                                { value: 'top-right', label: 'Top Right' },
                                { value: 'left-center', label: 'Left Center' },
                                { value: 'center', label: 'Center' },
                                { value: 'right-center', label: 'Right Center' },
                                { value: 'bottom-left', label: 'Bottom Left' },
                                { value: 'bottom-center', label: 'Bottom Center' },
                                { value: 'bottom-right', label: 'Bottom Right' }
                            ]
                        }
                    }}
                    .value=${fieldConfig.position || 'center'}
                    @value-changed=${(e) => this._updateFieldProperty(fieldName, 'position', e.detail.value)}>
                </ha-selector>
            </div>

            <div class="form-row">
                <label>Font Size (px)</label>
                <ha-textfield
                    type="number"
                    .value=${fieldConfig.fontSize || 14}
                    @input=${(e) => this._updateFieldProperty(fieldName, 'fontSize', Number(e.target.value))}>
                </ha-textfield>
            </div>

            <div class="checkbox-field">
                <input
                    type="checkbox"
                    id="${fieldName}-visible"
                    .checked=${fieldConfig.show !== false}
                    @change=${(e) => this._updateFieldProperty(fieldName, 'show', e.target.checked)}>
                <label for="${fieldName}-visible">Visible</label>
            </div>

            <div class="checkbox-field">
                <input
                    type="checkbox"
                    id="${fieldName}-template"
                    .checked=${fieldConfig.template === true}
                    @change=${(e) => this._updateFieldProperty(fieldName, 'template', e.target.checked)}>
                <label for="${fieldName}-template">Enable Template Processing</label>
            </div>

            <lcards-color-section
                .editor=${this.editor}
                basePath="text.${fieldName}.color"
                header="Text Colors"
                .states=${['default', 'active', 'inactive', 'unavailable']}
                ?expanded=${false}>
            </lcards-color-section>
        `;
    }

    /**
     * Toggle expanded state
     * @param {string} fieldName - Field name
     * @private
     */
    _toggleExpanded(fieldName) {
        this._expandedField = this._expandedField === fieldName ? null : fieldName;
    }

    /**
     * Update field property
     * @param {string} fieldName - Field name
     * @param {string} property - Property name
     * @param {*} value - New value
     * @private
     */
    _updateFieldProperty(fieldName, property, value) {
        const updatedTextConfig = {
            ...this.textConfig,
            [fieldName]: {
                ...(this.textConfig[fieldName] || {}),
                [property]: value
            }
        };

        this.textConfig = updatedTextConfig;

        // Update parent editor
        if (this.editor) {
            this.editor._setConfigValue('text', updatedTextConfig);
        }

        // Dispatch value-changed event
        this.dispatchEvent(new CustomEvent('value-changed', {
            detail: { value: updatedTextConfig },
            bubbles: true,
            composed: true
        }));

        this.requestUpdate();
    }
}

customElements.define('lcards-multi-text-editor', LCARdSMultiTextEditor);
