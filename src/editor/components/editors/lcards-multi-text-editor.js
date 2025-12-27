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
import '../shared/lcards-form-section.js';
import '../shared/lcards-form-field.js';
import './lcards-color-section.js';
import './lcards-padding-editor.js';

export class LCARdSMultiTextEditor extends LitElement {

    static get properties() {
        return {
            editor: { type: Object },         // Parent editor reference
            hass: { type: Object },           // Home Assistant instance
            _showCustomInput: { type: Boolean, state: true },
            _customFieldName: { type: String, state: true },
            _selectedField: { type: String, state: true }
        };
    }

    constructor() {
        super();
        this.editor = null;
        this.hass = null;
        this._showCustomInput = false;
        this._customFieldName = '';
        this._selectedField = '';
    }

    static get styles() {
        return css`
            :host {
                display: block;
            }

            .add-field-section {
                margin-top: 12px; /* Reduced from 16px for consistency */
                padding: 12px; /* Reduced from 16px for consistency */
                background: var(--secondary-background-color, #f5f5f5);
                border-radius: 8px;
                display: flex;
                gap: 8px;
                align-items: center;
            }

            .add-field-select {
                flex: 1;
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

            .custom-field-input {
                display: flex;
                gap: 8px;
                align-items: flex-start;
                margin-top: 8px;
                padding-top: 8px;
                border-top: 1px solid var(--divider-color, #e0e0e0);
            }

            .custom-field-input ha-textfield {
                flex: 1;
            }

            .custom-field-form {
                display: flex;
                flex-direction: column;
                gap: 12px;
            }

            .custom-field-actions {
                display: flex;
                gap: 8px;
                justify-content: flex-end;
            }

            .field-actions {
                display: flex;
                gap: 8px;
                margin-top: 8px;
                justify-content: flex-end;
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
                ?expanded=${false}
                ?outlined=${true}
                headerLevel="4">

                ${this._renderDefaultsConfig()}
            </lcards-form-section>

            <!-- Individual Text Fields -->
            <lcards-form-section
                header="Text Fields"
                description="Individual text fields (inherit from defaults)"
                icon="mdi:format-list-text"
                ?expanded=${false}
                ?outlined=${true}
                headerLevel="4">

                ${configuredFields.length === 0 ? html`
                    <div style="padding: 12px; text-align: center; color: var(--secondary-text-color);"> <!-- Reduced from 16px for consistency -->
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
     * Render defaults configuration (legacy structure)
     * @returns {TemplateResult}
     * @private
     */
    _renderDefaultsConfig() {
        return html`
            <!-- Font Section -->
            <lcards-form-section
                header="Font"
                description="Default font settings for all text fields"
                icon="mdi:format-font"
                ?expanded=${false}
                ?outlined=${true}
                headerLevel="5">

                <lcards-form-field
                    .editor=${this.editor}
                    .config=${this.editor.config}
                    path="text.default.font_size"
                    label="Font Size">
                </lcards-form-field>

                <lcards-form-field
                    .editor=${this.editor}
                    .config=${this.editor.config}
                    path="text.default.font_weight"
                    label="Font Weight">
                </lcards-form-field>

                <lcards-form-field
                    .editor=${this.editor}
                    .config=${this.editor.config}
                    path="text.default.font_family"
                    label="Font Family">
                </lcards-form-field>
            </lcards-form-section>

            <!-- Alignment Section (anchor/baseline + text_transform) -->
            <lcards-form-section
                header="Alignment"
                description="Anchor, baseline and text transform settings"
                icon="mdi:format-align-left"
                ?expanded=${false}
                ?outlined=${true}
                headerLevel="5">

                <lcards-form-field
                    .editor=${this.editor}
                    .config=${this.editor.config}
                    path="text.default.anchor"
                    label="Anchor"
                    helper="Text anchor (start/middle/end)">
                </lcards-form-field>

                <lcards-form-field
                    .editor=${this.editor}
                    .config=${this.editor.config}
                    path="text.default.baseline"
                    label="Baseline"
                    helper="Baseline alignment for text">
                </lcards-form-field>

                <lcards-form-field
                    .editor=${this.editor}
                    .config=${this.editor.config}
                    path="text.default.text_transform"
                    label="Text Transform"
                    helper="Text transformation (uppercase/lowercase/capitalize)">
                </lcards-form-field>
            </lcards-form-section>

            <!-- Padding Section -->
            <lcards-form-section
                header="Padding"
                description="Padding around text content"
                icon="mdi:move-resize"
                ?expanded=${false}
                ?outlined=${true}
                headerLevel="5">

                <lcards-padding-editor
                    .editor=${this.editor}
                    .config=${this.editor.config}
                    path="text.default.padding"
                    label="Default Text Padding"
                    helper="Spacing around text fields">
                </lcards-padding-editor>
            </lcards-form-section>

            <!-- Colors Section -->
            <lcards-form-section
                header="Colours"
                description="Default text colors for different states"
                icon="mdi:select-color"
                ?expanded=${false}
                ?outlined=${true}
                headerLevel="5">

                <lcards-color-section
                    .editor=${this.editor}
                    .config=${this.editor.config}
                    basePath="text.default.color"
                    header="Default Colors (no entity/state)"
                    .states=${['default']}
                    ?expanded=${false}>
                </lcards-color-section>

                <lcards-color-section
                    .editor=${this.editor}
                    .config=${this.editor.config}
                    basePath="text.default.color"
                    header="State Colors"
                    .states=${['active', 'inactive', 'unavailable']}
                    ?expanded=${false}>
                </lcards-color-section>
            </lcards-form-section>
        `;
    }

    /**
     * Render individual text field (legacy structure)
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

                <!-- Show Toggle -->
                <lcards-form-field
                    .editor=${this.editor}
                    .config=${this.editor.config}
                    path="text.${fieldName}.show"
                    label="Show ${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)}">
                </lcards-form-field>

                <!-- Content -->
                <lcards-form-field
                    .editor=${this.editor}
                    .config=${this.editor.config}
                    path="text.${fieldName}.content"
                    label="Content"
                    helper="Text content - supports templates like {{entity.state}}">
                </lcards-form-field>

                <!-- Position -->
                <lcards-form-field
                    .editor=${this.editor}
                    .config=${this.editor.config}
                    path="text.${fieldName}.position"
                    label="Position"
                    helper="Where to display this text on the card">
                </lcards-form-field>

                <!-- Font Section -->
                <lcards-form-section
                    header="Font"
                    description="Override default font settings"
                    icon="mdi:format-font"
                    ?expanded=${false}
                    ?outlined=${true}
                    headerLevel="6">

                    <lcards-form-field
                        .editor=${this.editor}
                    .config=${this.editor.config}
                        path="text.${fieldName}.font_size"
                        label="Font Size"
                        helper="${hasDefaults && !fieldConfig.font_size ? 'Inherits from defaults' : ''}">
                    </lcards-form-field>

                    <lcards-form-field
                        .editor=${this.editor}
                    .config=${this.editor.config}
                        path="text.${fieldName}.font_weight"
                        label="Font Weight"
                        helper="${hasDefaults && !fieldConfig.font_weight ? 'Inherits from defaults' : ''}">
                    </lcards-form-field>

                    <lcards-form-field
                        .editor=${this.editor}
                    .config=${this.editor.config}
                        path="text.${fieldName}.font_family"
                        label="Font Family"
                        helper="${hasDefaults && !fieldConfig.font_family ? 'Inherits from defaults' : ''}">
                    </lcards-form-field>
                </lcards-form-section>

                <!-- Alignment Section (anchor/baseline + text_transform) -->
                <lcards-form-section
                    header="Alignment"
                    description="Override anchor/baseline and text transform"
                    icon="mdi:format-align-left"
                    ?expanded=${false}
                    ?outlined=${true}
                    headerLevel="6">

                    <lcards-form-field
                        .editor=${this.editor}
                    .config=${this.editor.config}
                        path="text.${fieldName}.anchor"
                        label="Anchor"
                        helper="${hasDefaults && !fieldConfig.anchor ? 'Inherits from defaults' : 'Text anchor (start/middle/end)'}">
                    </lcards-form-field>

                    <lcards-form-field
                        .editor=${this.editor}
                    .config=${this.editor.config}
                        path="text.${fieldName}.baseline"
                        label="Baseline"
                        helper="${hasDefaults && !fieldConfig.baseline ? 'Inherits from defaults' : 'Baseline alignment'}">
                    </lcards-form-field>

                    <lcards-form-field
                        .editor=${this.editor}
                    .config=${this.editor.config}
                        path="text.${fieldName}.text_transform"
                        label="Text Transform"
                        helper="${hasDefaults && !fieldConfig.text_transform ? 'Inherits from defaults' : 'Text transformation'}">
                    </lcards-form-field>
                </lcards-form-section>

                <!-- Padding Section -->
                <lcards-form-section
                    header="Padding"
                    description="Override default padding settings"
                    icon="mdi:move-resize"
                    ?expanded=${false}
                    ?outlined=${true}
                    headerLevel="6">

                    <lcards-padding-editor
                        .editor=${this.editor}
                    .config=${this.editor.config}
                        path="text.${fieldName}.padding"
                        label="${fieldName} Padding"
                        helper="${hasDefaults && !fieldConfig.padding ? 'Inherits from defaults' : 'Custom padding for this field'}">
                    </lcards-padding-editor>
                </lcards-form-section>

                <!-- Colors Section -->
                <lcards-form-section
                    header="Colours"
                    description="Override default color settings"
                    icon="mdi:select-color"
                    ?expanded=${false}
                    ?outlined=${true}
                    headerLevel="6">

                    <lcards-color-section
                        .editor=${this.editor}
                    .config=${this.editor.config}
                        basePath="text.${fieldName}.color"
                        header="Field Colors (overrides defaults)"
                        .states=${['default', 'active', 'inactive', 'unavailable']}
                        ?expanded=${false}>
                    </lcards-color-section>
                </lcards-form-section>

                <!-- Remove Button -->
                <div class="field-actions">
                    <ha-button
                        variant="danger"
                        size="small"
                        @click=${() => this._removeField(fieldName)}>
                        <ha-icon icon="mdi:delete" slot="icon"></ha-icon>
                        Remove Field
                    </ha-button>
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
        const commonFields = ['name', 'label', 'state'];
        const textConfig = this.editor.config?.text || {};
        const existingFields = Object.keys(textConfig).filter(k => k !== 'default');
        const availableFields = commonFields.filter(f => !existingFields.includes(f));

        return html`
            <div class="add-field-section">
                <ha-selector
                    class="add-field-select"
                    .hass=${this.hass}
                    .label=${'Select field to add'}
                    .selector=${{
                        select: {
                            mode: 'dropdown',
                            options: [
                                ...availableFields.map(field => ({ value: field, label: field })),
                                { value: 'custom', label: 'Custom field name...' }
                            ]
                        }
                    }}
                    .value=${this._selectedField || ''}
                    @value-changed=${(e) => this._handleFieldSelected(e)}>
                </ha-selector>
                ${!this._showCustomInput ? html`
                    <ha-button
                        @click=${this._handleAddField}
                        ?disabled=${!this._selectedField}>
                        <ha-icon icon="mdi:plus" slot="icon"></ha-icon>
                        Add Field
                    </ha-button>
                ` : ''}
            </div>

            ${this._showCustomInput ? html`
                <lcards-form-section header="Custom Field Name" ?expanded=${true}>
                    <div class="custom-field-form">
                        <ha-selector
                            .hass=${this.hass}
                            .label=${'Field Name'}
                            .helper=${'Alphanumeric and underscore only'}
                            .selector=${{ text: {} }}
                            .value=${this._customFieldName}
                            @value-changed=${(e) => this._handleCustomNameInput(e)}>
                        </ha-selector>

                        <div class="custom-field-actions">
                            <ha-button
                                appearance="plain"
                                @click=${this._handleCancelCustom}>
                                Cancel
                            </ha-button>
                            <ha-button
                                variant="brand"
                                appearance="accent"
                                @click=${this._handleAddCustomField}
                                ?disabled=${!this._isValidCustomName()}>
                                <ha-icon icon="mdi:plus" slot="icon"></ha-icon>
                                Add
                            </ha-button>
                        </div>
                    </div>
                </lcards-form-section>
            ` : ''}
        `;
    }

    /**
     * Handle field selection change
     * @private
     */
    _handleFieldSelected(e) {
        const value = e.detail.value;
        this._selectedField = value;

        if (value === 'custom') {
            this._showCustomInput = true;
            this._customFieldName = '';
        } else {
            this._showCustomInput = false;
        }
    }

    /**
     * Handle add field button click
     * @private
     */
    _handleAddField() {
        const fieldName = this._selectedField;

        if (!fieldName) return;

        this._addField(fieldName);

        // Reset select
        const select = this.shadowRoot.getElementById('fieldSelect');
        if (select) {
            select.value = '';
            this._selectedField = '';
        }
    }

    /**
     * Handle custom field name input
     * @private
     */
    _handleCustomNameInput(e) {
        this._customFieldName = e.detail.value;
    }

    /**
     * Validate custom field name
     * @returns {boolean}
     * @private
     */
    _isValidCustomName() {
        return /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(this._customFieldName);
    }

    /**
     * Handle add custom field button click
     * @private
     */
    _handleAddCustomField() {
        if (!this._isValidCustomName()) return;

        this._addField(this._customFieldName);

        // Reset
        const select = this.shadowRoot.getElementById('fieldSelect');
        if (select) {
            select.value = '';
        }
        this._selectedField = '';
        this._showCustomInput = false;
        this._customFieldName = '';
    }

    /**
     * Handle cancel custom field
     * @private
     */
    _handleCancelCustom() {
        const select = this.shadowRoot.getElementById('fieldSelect');
        if (select) {
            select.value = '';
        }
        this._selectedField = '';
        this._showCustomInput = false;
        this._customFieldName = '';
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
            content: `${fieldName}`,
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
