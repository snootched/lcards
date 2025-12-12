/**
 * LCARdS Multi-Text Editor v2
 *
 * Comprehensive text field manager with defaults and dynamic field management.
 * 
 * Structure:
 * - text.default: Default styling for all fields (font_size, color, position, etc.)
 * - text.{fieldName}: Individual fields that inherit from default
 * 
 * @example
 * <lcards-multi-text-editor
 *   .editor=${this}
 *   .hass=${this.hass}>
 * </lcards-multi-text-editor>
 */

import { LitElement, html, css } from 'lit';
import './lcards-form-section.js';
import './lcards-form-field.js';
import './lcards-color-section.js';

export class LCARdSMultiTextEditor extends LitElement {

    static get properties() {
        return {
            editor: { type: Object },         // Parent editor reference
            hass: { type: Object }            // Home Assistant instance
        };
    }

    constructor() {
        super();
        this.editor = null;
        this.hass = null;
    }

    static get styles() {
        return css`
            :host {
                display: block;
            }

            .add-field-section {
                margin-top: 16px;
                padding: 16px;
                background: var(--secondary-background-color, #f5f5f5);
                border-radius: 8px;
                display: flex;
                gap: 8px;
                align-items: center;
            }

            .add-field-select {
                flex: 1;
                padding: 8px;
                border: 1px solid var(--divider-color, #e0e0e0);
                border-radius: 4px;
                background: white;
            }

            .add-field-button {
                padding: 8px 16px;
                background: var(--primary-color, #03a9f4);
                color: white;
                border: none;
                border-radius: 4px;
                cursor: pointer;
                font-size: 14px;
            }

            .add-field-button:hover {
                opacity: 0.9;
            }

            .add-field-button:disabled {
                opacity: 0.5;
                cursor: not-allowed;
            }

            .field-actions {
                display: flex;
                gap: 8px;
                margin-top: 8px;
            }

            .remove-button {
                padding: 6px 12px;
                background: var(--error-color, #f44336);
                color: white;
                border: none;
                border-radius: 4px;
                cursor: pointer;
                font-size: 12px;
            }

            .remove-button:hover {
                opacity: 0.9;
            }

            .inherited-hint {
                font-size: 11px;
                color: var(--secondary-text-color, #727272);
                font-style: italic;
                margin-top: 4px;
            }
        `;
    }

    render() {
        if (!this.editor) {
            return html`<div>Multi-text editor requires 'editor' property</div>`;
        }

        const textConfig = this.editor.config?.text || {};
        const configuredFields = Object.keys(textConfig).filter(key => key !== 'default');

        return html`
            <!-- Text Defaults Section -->
            <lcards-form-section
                header="Text Defaults"
                description="Default styling inherited by all text fields"
                icon="mdi:format-text"
                ?expanded=${true}
                ?outlined=${true}
                headerLevel="4">

                ${this._renderDefaultsConfig()}
            </lcards-form-section>

            <!-- Individual Text Fields -->
            <lcards-form-section
                header="Text Fields"
                description="Individual text fields (inherit from defaults)"
                icon="mdi:format-list-text"
                ?expanded=${true}
                ?outlined=${true}
                headerLevel="4">

                ${configuredFields.length === 0 ? html`
                    <div style="padding: 16px; text-align: center; color: var(--secondary-text-color);">
                        No text fields configured. Add one below.
                    </div>
                ` : ''}

                ${configuredFields.map(fieldName => this._renderTextField(fieldName))}

                <!-- Add Field Section -->
                ${this._renderAddFieldSection()}
            </lcards-form-section>
        `;
    }

    /**
     * Render defaults configuration
     * @returns {TemplateResult}
     * @private
     */
    _renderDefaultsConfig() {
        return html`
            <lcards-form-field
                .editor=${this.editor}
                path="text.default.font_size"
                label="Font Size (px)">
            </lcards-form-field>

            <lcards-form-field
                .editor=${this.editor}
                path="text.default.font_weight"
                label="Font Weight">
            </lcards-form-field>

            <lcards-form-field
                .editor=${this.editor}
                path="text.default.font_family"
                label="Font Family">
            </lcards-form-field>

            <lcards-form-field
                .editor=${this.editor}
                path="text.default.position"
                label="Default Position">
            </lcards-form-field>

            <lcards-color-section
                .editor=${this.editor}
                basePath="text.default.color"
                header="Default Text Colors"
                .states=${['default', 'active', 'inactive', 'unavailable']}
                ?expanded=${false}>
            </lcards-color-section>

            <lcards-form-field
                .editor=${this.editor}
                path="text.default.padding"
                label="Default Padding">
            </lcards-form-field>
        `;
    }

    /**
     * Render individual text field
     * @param {string} fieldName - Field name (e.g., 'name', 'label', 'state')
     * @returns {TemplateResult}
     * @private
     */
    _renderTextField(fieldName) {
        const textConfig = this.editor.config?.text || {};
        const fieldConfig = textConfig[fieldName] || {};
        const hasDefaults = textConfig.default !== undefined;

        return html`
            <lcards-form-section
                header="${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)} Field"
                ?expanded=${false}
                ?outlined=${true}
                headerLevel="5">

                <lcards-form-field
                    .editor=${this.editor}
                    path="text.${fieldName}.content"
                    label="Content"
                    helper="Supports templates: {{entity.state}}, {{entity.attributes.brightness}}">
                </lcards-form-field>

                <lcards-form-field
                    .editor=${this.editor}
                    path="text.${fieldName}.show"
                    label="Show Field">
                </lcards-form-field>

                <lcards-form-field
                    .editor=${this.editor}
                    path="text.${fieldName}.position"
                    label="Position"
                    helper="${hasDefaults && !fieldConfig.position ? 'Inherits from defaults' : ''}">
                </lcards-form-field>

                <lcards-form-field
                    .editor=${this.editor}
                    path="text.${fieldName}.font_size"
                    label="Font Size (px)"
                    helper="${hasDefaults && !fieldConfig.font_size ? 'Inherits from defaults' : ''}">
                </lcards-form-field>

                <lcards-color-section
                    .editor=${this.editor}
                    basePath="text.${fieldName}.color"
                    header="Field Colors (overrides defaults)"
                    .states=${['default', 'active', 'inactive', 'unavailable']}
                    ?expanded=${false}>
                </lcards-color-section>

                <lcards-form-field
                    .editor=${this.editor}
                    path="text.${fieldName}.rotation"
                    label="Rotation (degrees)">
                </lcards-form-field>

                <div class="field-actions">
                    <button class="remove-button" @click=${() => this._removeField(fieldName)}>
                        Remove Field
                    </button>
                </div>
            </lcards-form-section>
        `;
    }

    /**
     * Render add field section
     * @returns {TemplateResult}
     * @private
     */
    _renderAddFieldSection() {
        const commonFields = ['name', 'label', 'state', 'value', 'unit'];
        const textConfig = this.editor.config?.text || {};
        const existingFields = Object.keys(textConfig).filter(k => k !== 'default');
        const availableFields = commonFields.filter(f => !existingFields.includes(f));

        return html`
            <div class="add-field-section">
                <select class="add-field-select" id="fieldSelect">
                    <option value="">-- Select field to add --</option>
                    ${availableFields.map(field => html`
                        <option value="${field}">${field}</option>
                    `)}
                    <option value="custom">Custom field name...</option>
                </select>
                <button 
                    class="add-field-button"
                    @click=${this._handleAddField}>
                    Add Field
                </button>
            </div>
        `;
    }

    /**
     * Handle add field button click
     * @private
     */
    _handleAddField() {
        const select = this.shadowRoot.getElementById('fieldSelect');
        const fieldName = select.value;

        if (!fieldName) return;

        if (fieldName === 'custom') {
            const customName = prompt('Enter custom field name (alphanumeric and underscore only):');
            if (!customName || !/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(customName)) {
                alert('Invalid field name. Must start with letter or underscore, contain only alphanumeric and underscore.');
                return;
            }
            this._addField(customName);
        } else {
            this._addField(fieldName);
        }

        // Reset select
        select.value = '';
    }

    /**
     * Add a new text field
     * @param {string} fieldName - Name of the field to add
     * @private
     */
    _addField(fieldName) {
        const textConfig = this.editor.config?.text || {};
        
        // Check if field already exists
        if (textConfig[fieldName]) {
            alert(`Field "${fieldName}" already exists!`);
            return;
        }

        // Create new field with minimal config
        const newField = {
            content: `{{entity.${fieldName}}}`,
            show: true
        };

        // Update config
        const updatedText = {
            ...textConfig,
            [fieldName]: newField
        };

        this.editor._setConfigValue('text', updatedText);
        this.requestUpdate();
    }

    /**
     * Remove a text field
     * @param {string} fieldName - Name of the field to remove
     * @private
     */
    _removeField(fieldName) {
        if (!confirm(`Remove "${fieldName}" field?`)) {
            return;
        }

        const textConfig = { ...(this.editor.config?.text || {}) };
        delete textConfig[fieldName];

        this.editor._setConfigValue('text', textConfig);
        this.requestUpdate();
    }
}

customElements.define('lcards-multi-text-editor', LCARdSMultiTextEditor);
