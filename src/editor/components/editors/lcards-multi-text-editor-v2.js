/**
 * LCARdS Multi-Text Editor V2
 *
 * Redesigned text field manager with list-based UI matching animation/filter editors.
 * Features collapsible fields with drag-and-drop reordering (Phase 2).
 *
 * Structure:
 * - text.default: Default styling for all fields (font_size, color, position, etc.)
 * - text.{fieldName}: Individual fields that inherit from default
 *
 * @example
 * <lcards-multi-text-editor-v2
 *   .text=${this.config.text || {}}
 *   .hass=${this.hass}
 *   @text-changed=${(e) => this._updateConfig({ text: e.detail.value })}>
 * </lcards-multi-text-editor-v2>
 */

import { LitElement, html, css } from 'lit';
import { editorWidgetStyles } from './editor-widget-styles.js';
import '../shared/lcards-form-section.js';
import { LCARdSFormFieldHelper as FormField } from '../shared/lcards-form-field.js';
import './lcards-color-section-v2.js';
import './lcards-padding-editor.js';
import { lcardsLog } from '../../../utils/lcards-logging.js';

export class LCARdSMultiTextEditorV2 extends LitElement {

    static get properties() {
        return {
            editor: { type: Object },         // Parent editor reference (for child components)
            text: { type: Object },           // Text configuration object (our managed state)
            hass: { type: Object },           // Home Assistant instance
            _expandedFields: { type: Object, state: true }, // Track which fields are expanded
            _showAddDialog: { type: Boolean, state: true },
            _newFieldName: { type: String, state: true }
        };
    }

    constructor() {
        super();
        this.editor = null;
        this.text = {};
        this.hass = null;
        this._expandedFields = {};
        this._showAddDialog = false;
        this._newFieldName = '';
    }

    /**
     * Lifecycle: called when properties change
     * Sync internal state when .text property is updated externally
     */
    updated(changedProps) {
        super.updated(changedProps);

        // If .text property changed externally (from parent editor updates via FormField/padding/color components)
        // we need to re-render to show the updated values
        if (changedProps.has('text')) {
            this.requestUpdate();
        }
    }

    static get styles() {
        return [
            editorWidgetStyles,
            css`
                :host {
                    display: block;
                }

                /* Add Dialog */
                .add-dialog {
                    background: var(--card-background-color);
                    border: 2px solid var(--divider-color);
                    border-radius: 12px;
                    padding: 16px;
                    margin-top: 12px;
                }

                .add-dialog-header {
                    font-size: 16px;
                    font-weight: 600;
                    color: var(--primary-text-color);
                    margin-bottom: 12px;
                }

                .add-dialog-content {
                    display: flex;
                    flex-direction: column;
                    gap: 12px;
                }

                .quick-add-buttons {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 8px;
                }

                .quick-add-buttons ha-button {
                    flex: 1;
                    min-width: 100px;
                }

                .custom-field-input {
                    display: flex;
                    gap: 8px;
                    align-items: center;
                    padding-top: 8px;
                    border-top: 1px solid var(--divider-color);
                }

                .custom-field-input ha-textfield {
                    flex: 1;
                }

                .empty-state {
                    text-align: center;
                    padding: 32px 16px;
                    color: var(--secondary-text-color);
                }

                .empty-state ha-icon {
                    font-size: 48px;
                    opacity: 0.3;
                    margin-bottom: 12px;
                    display: block;
                }

                .inherited-hint {
                    font-size: 11px;
                    color: var(--secondary-text-color);
                    font-style: italic;
                    margin-top: 4px;
                    padding: 0 8px;
                }

                /* Action buttons - ensure visibility */
                .editor-item-actions ha-icon-button {
                    --mdc-icon-button-size: 40px;
                    --mdc-icon-size: 20px;
                    color: var(--primary-text-color);
                }

                .editor-item-actions ha-icon-button:hover {
                    color: var(--error-color);
                }
            `
        ];
    }

    render() {
        const fieldNames = Object.keys(this.text).filter(key => key !== 'default');

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

            <!-- Text Fields List -->
            <lcards-form-section
                header="Text Fields"
                description="Individual text fields (inherit from defaults)"
                icon="mdi:format-list-text"
                ?expanded=${true}
                ?outlined=${true}
                headerLevel="4">

                <!-- Add Button -->
                <ha-button class="add-button" @click=${this._toggleAddDialog}>
                    <ha-icon icon="mdi:plus" slot="icon"></ha-icon>
                    Add Text Field
                </ha-button>

                <!-- Add Dialog -->
                ${this._showAddDialog ? this._renderAddDialog() : ''}

                ${fieldNames.length === 0 ? html`
                    <div class="empty-state">
                        <ha-icon icon="mdi:text-box-outline"></ha-icon>
                        <p>No text fields defined. Click "Add Text Field" to create one.</p>
                    </div>
                ` : html`
                    <div class="editor-list">
                        ${fieldNames.map((fieldName) => this._renderFieldItem(fieldName))}
                    </div>
                `}
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
            <!-- Font Section -->
            <lcards-form-section
                header="Font"
                description="Default font settings for all text fields"
                icon="mdi:format-font"
                ?expanded=${false}
                ?outlined=${true}
                headerLevel="5">

                ${FormField.renderField(this.editor, 'text.default.font_size', {
                    label: 'Font Size'
                })}

                ${FormField.renderField(this.editor, 'text.default.font_weight', {
                    label: 'Font Weight'
                })}

                ${FormField.renderField(this.editor, 'text.default.font_family', {
                    label: 'Font Family'
                })}
            </lcards-form-section>

            <!-- Alignment Section -->
            <lcards-form-section
                header="Alignment"
                description="Anchor, baseline and text transform settings"
                icon="mdi:format-align-left"
                ?expanded=${false}
                ?outlined=${true}
                headerLevel="5">

                ${FormField.renderField(this.editor, 'text.default.anchor', {
                    label: 'Anchor',
                    helper: 'Text anchor (start/middle/end)'
                })}

                ${FormField.renderField(this.editor, 'text.default.baseline', {
                    label: 'Baseline',
                    helper: 'Baseline alignment for text'
                })}

                ${FormField.renderField(this.editor, 'text.default.text_transform', {
                    label: 'Text Transform',
                    helper: 'Text transformation (uppercase/lowercase/capitalize)'
                })}
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

            <!-- Text Colors -->
            <lcards-color-section-v2
                .editor=${this.editor}
                .config=${this.editor.config}
                basePath="text.default.color"
                header="Text Colors"
                description="Default text colors for different states"
                .suggestedStates=${['default', 'active', 'inactive', 'unavailable']}
                ?allowCustomStates=${true}
                ?expanded=${false}>
            </lcards-color-section-v2>
        `;
    }

    /**
     * Render a single text field item
     * @param {string} fieldName - Field name
     * @returns {TemplateResult}
     * @private
     */
    _renderFieldItem(fieldName) {
        const fieldConfig = this.text[fieldName] || {};
        const isExpanded = this._expandedFields[fieldName] || false;

        // Get field content for subtitle preview
        const content = fieldConfig.content || fieldName;
        const contentPreview = content.length > 50 ? content.substring(0, 50) + '...' : content;

        return html`
            <div class="editor-item" ?expanded=${isExpanded}>
                <div class="editor-item-header" @click=${() => this._toggleField(fieldName)}>
                    <ha-icon class="drag-handle" icon="mdi:drag"></ha-icon>
                    <ha-icon class="editor-item-icon" icon="mdi:format-text"></ha-icon>
                    <div class="editor-item-info">
                        <div class="editor-item-title">${fieldName}</div>
                        <div class="editor-item-subtitle">${contentPreview}</div>
                    </div>
                    <div class="editor-item-actions" @click=${(e) => e.stopPropagation()}>
                        <ha-icon-button
                            .label=${'Delete'}
                            .path=${'M19,4H15.5L14.5,3H9.5L8.5,4H5V6H19M6,19A2,2 0 0,0 8,21H16A2,2 0 0,0 18,19V7H6V19Z'}
                            @click=${(e) => this._deleteField(e, fieldName)}>
                        </ha-icon-button>
                    </div>
                    <ha-icon
                        class="expand-icon ${isExpanded ? 'expanded' : ''}"
                        icon="mdi:chevron-down">
                    </ha-icon>
                </div>
                ${isExpanded ? html`
                    <div class="editor-item-content">
                        ${this._renderFieldConfig(fieldName, fieldConfig)}
                    </div>
                ` : ''}
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
    _renderFieldConfig(fieldName, fieldConfig) {
        const hasDefaults = this.text.default !== undefined;

        return html`
            <!-- Show Toggle -->
            ${FormField.renderField(this.editor, `text.${fieldName}.show`, {
                label: `Show ${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)}`
            })}

            <!-- Content -->
            ${FormField.renderField(this.editor, `text.${fieldName}.content`, {
                label: 'Content',
                helper: 'Text content - supports templates like {{entity.state}}'
            })}

            <!-- Position -->
            ${FormField.renderField(this.editor, `text.${fieldName}.position`, {
                label: 'Position',
                helper: 'Where to display this text on the card'
            })}

            <!-- Font Section -->
            <lcards-form-section
                header="Font"
                description="Override default font settings"
                icon="mdi:format-font"
                ?expanded=${false}
                ?outlined=${true}
                headerLevel="6"
                ?compact=${true}>

                ${FormField.renderField(this.editor, `text.${fieldName}.font_size`, {
                    label: 'Font Size',
                    helper: hasDefaults && !fieldConfig.font_size ? 'Inherits from defaults' : ''
                })}

                ${FormField.renderField(this.editor, `text.${fieldName}.font_weight`, {
                    label: 'Font Weight',
                    helper: hasDefaults && !fieldConfig.font_weight ? 'Inherits from defaults' : ''
                })}

                ${FormField.renderField(this.editor, `text.${fieldName}.font_family`, {
                    label: 'Font Family',
                    helper: hasDefaults && !fieldConfig.font_family ? 'Inherits from defaults' : ''
                })}
            </lcards-form-section>

            <!-- Alignment Section -->
            <lcards-form-section
                header="Alignment"
                description="Override anchor/baseline and text transform"
                icon="mdi:format-align-left"
                ?expanded=${false}
                ?outlined=${true}
                headerLevel="6"
                ?compact=${true}>

                ${FormField.renderField(this.editor, `text.${fieldName}.anchor`, {
                    label: 'Anchor',
                    helper: hasDefaults && !fieldConfig.anchor ? 'Inherits from defaults' : 'Text anchor (start/middle/end)'
                })}

                ${FormField.renderField(this.editor, `text.${fieldName}.baseline`, {
                    label: 'Baseline',
                    helper: hasDefaults && !fieldConfig.baseline ? 'Inherits from defaults' : 'Baseline alignment'
                })}

                ${FormField.renderField(this.editor, `text.${fieldName}.text_transform`, {
                    label: 'Text Transform',
                    helper: hasDefaults && !fieldConfig.text_transform ? 'Inherits from defaults' : 'Text transformation'
                })}
            </lcards-form-section>

            <!-- Padding Section -->
            <lcards-form-section
                header="Padding"
                description="Override default padding settings"
                icon="mdi:move-resize"
                ?expanded=${false}
                ?outlined=${true}
                headerLevel="6"
                ?compact=${true}>

                <lcards-padding-editor
                    .editor=${this.editor}
                    .config=${this.editor.config}
                    path="text.${fieldName}.padding"
                    label="${fieldName} Padding"
                    helper="${hasDefaults && !fieldConfig.padding ? 'Inherits from defaults' : 'Custom padding for this field'}">
                </lcards-padding-editor>
            </lcards-form-section>

            <!-- Field Colors -->
            <lcards-color-section-v2
                .editor=${this.editor}
                .config=${this.editor.config}
                basePath="text.${fieldName}.color"
                header="Field Colors"
                description="Override default color settings"
                .suggestedStates=${['default', 'active', 'inactive', 'unavailable']}
                ?allowCustomStates=${true}
                ?expanded=${false}>
            </lcards-color-section-v2>
        `;
    }

    /**
     * Render add field dialog
     * @returns {TemplateResult}
     * @private
     */
    _renderAddDialog() {
        const existingFields = Object.keys(this.text).filter(k => k !== 'default');
        const commonFields = ['name', 'label', 'state'];
        const availableCommonFields = commonFields.filter(f => !existingFields.includes(f));

        return html`
            <div class="add-dialog">
                <div class="add-dialog-header">Add Text Field</div>
                <div class="add-dialog-content">
                    ${availableCommonFields.length > 0 ? html`
                        <div>
                            <div class="field-label">Quick Add</div>
                            <div class="quick-add-buttons">
                                ${availableCommonFields.map(fieldName => html`
                                    <ha-button @click=${() => this._addField(fieldName)}>
                                        <ha-icon icon="mdi:plus" slot="icon"></ha-icon>
                                        ${fieldName}
                                    </ha-button>
                                `)}
                            </div>
                        </div>
                    ` : ''}

                    <div class="custom-field-input">
                        <ha-textfield
                            .label=${'Custom Field Name'}
                            .helper=${'Alphanumeric and underscore only'}
                            .value=${this._newFieldName}
                            @input=${(e) => this._newFieldName = e.target.value}
                            @keydown=${(e) => {
                                if (e.key === 'Enter' && this._isValidFieldName(this._newFieldName)) {
                                    this._addField(this._newFieldName);
                                }
                            }}>
                        </ha-textfield>
                        <ha-button
                            variant="brand"
                            @click=${() => this._addField(this._newFieldName)}
                            ?disabled=${!this._isValidFieldName(this._newFieldName)}>
                            <ha-icon icon="mdi:plus" slot="icon"></ha-icon>
                            Add
                        </ha-button>
                    </div>

                    <ha-button appearance="plain" @click=${this._toggleAddDialog}>
                        Cancel
                    </ha-button>
                </div>
            </div>
        `;
    }

    /**
     * Toggle field expansion
     * @param {string} fieldName - Field name
     * @private
     */
    _toggleField(fieldName) {
        this._expandedFields = {
            ...this._expandedFields,
            [fieldName]: !this._expandedFields[fieldName]
        };
    }

    /**
     * Toggle add dialog
     * @private
     */
    _toggleAddDialog() {
        this._showAddDialog = !this._showAddDialog;
        if (!this._showAddDialog) {
            this._newFieldName = '';
        }
    }

    /**
     * Validate field name
     * @param {string} name - Field name to validate
     * @returns {boolean}
     * @private
     */
    _isValidFieldName(name) {
        return name && /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(name);
    }

    /**
     * Add a new text field
     * @param {string} fieldName - Name of the field to add
     * @private
     */
    _addField(fieldName) {
        if (!this._isValidFieldName(fieldName)) {
            return;
        }

        // Check if field already exists
        if (this.text[fieldName]) {
            alert(`Field "${fieldName}" already exists!`);
            return;
        }

        // Get smart default content based on field name
        let defaultContent;
        switch (fieldName.toLowerCase()) {
            case 'name':
                defaultContent = '[[[return entity.attributes.friendly_name || entity.entity_id]]]';
                break;
            case 'state':
                defaultContent = '{entity.state}';
                break;
            case 'label':
                defaultContent = 'LCARdS';
                break;
            default:
                defaultContent = fieldName; // Fallback to field name
        }

        // Create new field with smart default
        const newField = {
            content: defaultContent,
            show: true
        };

        // Update text config
        const updatedText = {
            ...this.text,
            [fieldName]: newField
        };

        // Auto-expand the newly added field
        this._expandedFields = {
            ...this._expandedFields,
            [fieldName]: true
        };

        // Close dialog and reset
        this._showAddDialog = false;
        this._newFieldName = '';

        this._emitChange(updatedText);
    }

    /**
     * Delete a text field
     * @param {Event} e - Click event
     * @param {string} fieldName - Name of the field to delete
     * @private
     */
    _deleteField(e, fieldName) {
        e.stopPropagation();
        e.preventDefault();

        lcardsLog.debug(`[MultiTextEditorV2] Deleting field: ${fieldName}`);

        // Clone config and remove field
        const textConfig = { ...this.text };
        delete textConfig[fieldName];
        delete this._expandedFields[fieldName];

        this._emitChange(textConfig);
    }

    /**
     * Update a field property
     * @param {string} fieldName - Field name
     * @param {string} property - Property name
     * @param {*} value - New value
     * @private
     */
    _updateField(fieldName, property, value) {
        const updatedText = { ...this.text };
        updatedText[fieldName] = {
            ...updatedText[fieldName],
            [property]: value
        };
        this._emitChange(updatedText);
    }

    /**
     * Emit text change event (follows animation/filter editor pattern)
     * @param {Object} text - Updated text configuration
     * @private
     */
    _emitChange(text) {
        lcardsLog.info('[MultiTextEditorV2] _emitChange called');
        lcardsLog.debug('[MultiTextEditorV2] New text value:', text);
        lcardsLog.debug('[MultiTextEditorV2] Event will bubble:', true, 'composed:', true);

        this.text = text;

        const event = new CustomEvent('text-changed', {
            detail: { value: text },
            bubbles: true,
            composed: true
        });

        lcardsLog.info('[MultiTextEditorV2] Dispatching text-changed event');
        this.dispatchEvent(event);
        this.requestUpdate();
    }
}

customElements.define('lcards-multi-text-editor-v2', LCARdSMultiTextEditorV2);
