/**
 * @fileoverview LCARdS Multi-Text Editor V2
 *
 * Redesigned text field manager with list-based UI matching animation/filter editors.
 * Features collapsible fields with drag-and-drop reordering.
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
            availableZones: { type: Object }, // Named zones for routing (from card zone map or component def)
            componentTextFields: { type: Array }, // Preset field names from component def (may be null)
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
        this.availableZones = null;
        this.componentTextFields = null;
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
                    border: var(--ha-border-width-md) solid var(--divider-color);
                    border-radius: var(--ha-card-border-radius, 12px);
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
                    border-top: var(--ha-border-width-sm) solid var(--divider-color);
                }

                .custom-field-input ha-input {
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
                    --ha-icon-button-size: 40px;
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
                    <ha-icon icon="mdi:plus" slot="start"></ha-icon>
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
            <!-- Display Format (card-wide default) -->
            ${FormField.renderField(this.editor, 'text.default.display_format', {
                label: 'Default Display Format',
                helper: 'How {entity.state} tokens are rendered across all fields: friendly = HA-translated, raw = actual state, parts = value+unit, unit = unit only'
            })}

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
                description="Anchor, baseline, text transform, and rotation settings"
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

                ${FormField.renderField(this.editor, 'text.default.rotation', {
                    label: 'Rotation',
                    helper: 'Default rotation angle in degrees (0 = no rotation)'
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

            <!-- Background Section (defaults) -->
            <lcards-form-section
                header="Background"
                description="Default text background (bar-break effect)"
                icon="mdi:rectangle"
                ?expanded=${false}
                ?outlined=${true}
                headerLevel="5">

                <lcards-color-section-v2
                    .editor=${this.editor}
                    .config=${this.editor.config}
                    basePath="text.default.background"
                    header="Background Colour"
                    description="Background colour for different entity states"
                    .suggestedStates=${['default', 'active', 'inactive', 'unavailable', 'zero', 'non_zero']}
                    ?allowCustomStates=${true}
                    ?expanded=${false}>
                </lcards-color-section-v2>

                ${FormField.renderField(this.editor, 'text.default.background_padding', {
                    label: 'Background Padding'
                })}

                ${FormField.renderField(this.editor, 'text.default.background_radius', {
                    label: 'Background Corner Radius'
                })}

                ${FormField.renderField(this.editor, 'text.default.background_width', {
                    label: 'Background Width (Fixed)',
                    helper: 'Exact px width — overrides auto-sizing. Text overflows if content is wider.'
                })}

                ${FormField.renderField(this.editor, 'text.default.background_min_width', {
                    label: 'Background Min Width',
                    helper: 'Auto-sizes with text but never shrinks below this value — safe for dynamic content.'
                })}
            </lcards-form-section>

            <!-- Text Colors -->
            <lcards-color-section-v2
                .editor=${this.editor}
                .config=${this.editor.config}
                basePath="text.default.color"
                header="Text Colours"
                description="Default text colours for different states"
                .suggestedStates=${['default', 'active', 'inactive', 'unavailable', 'zero', 'non_zero']}
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
                helper: 'Text content - supports templates like {entity.state}'
            })}

            <!-- Display Format -->
            ${FormField.renderField(this.editor, `text.${fieldName}.display_format`, {
                label: 'Display Format',
                helper: hasDefaults && !fieldConfig.display_format
                    ? 'Inherits from defaults — friendly = HA-translated, raw = actual state, parts = value+unit, unit = unit only'
                    : 'How entity state tokens are rendered: friendly, raw, parts, or unit'
            })}

            <!-- Position -->
            ${FormField.renderField(this.editor, `text.${fieldName}.position`, {
                label: 'Position',
                helper: 'Where to display this text on the card'
            })}

            <!-- Zone selector (only shown when >1 named zone is available) -->
            ${this.availableZones && Object.keys(this.availableZones).length > 1 ? html`
                <ha-selector
                    .hass=${this.editor?.hass}
                    .selector=${{ select: { mode: 'dropdown', options: Object.keys(this.availableZones).map(k => ({ value: k, label: k.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) })) } }}
                    .value=${this.editor?.config?.text?.[fieldName]?.zone || Object.keys(this.availableZones)[0]}
                    .label=${'Zone'}
                    .helper=${'Which named layout zone this text field is routed to'}
                    @value-changed=${(e) => this.editor?._setConfigValue?.(`text.${fieldName}.zone`, e.detail.value)}>
                </ha-selector>
            ` : ''}

            <!-- Font Section -->
            <lcards-form-section
                header="Font"
                description="Set font family, weight, and sizing"
                icon="mdi:format-font"
                ?expanded=${false}
                ?outlined=${true}
                headerLevel="6"
                ?compact=${true}>

                ${FormField.renderField(this.editor, `text.${fieldName}.font_weight`, {
                    label: 'Font Weight',
                    helper: hasDefaults && !fieldConfig.font_weight ? 'Inherits from defaults' : ''
                })}

                ${FormField.renderField(this.editor, `text.${fieldName}.font_family`, {
                    label: 'Font Family',
                    helper: hasDefaults && !fieldConfig.font_family ? 'Inherits from defaults' : ''
                })}

                <!-- Fixed size -->
                ${FormField.renderField(this.editor, `text.${fieldName}.font_size`, {
                    label: 'Font Size (px)',
                    helper: hasDefaults && !fieldConfig.font_size
                        ? 'Inherits from defaults — use this OR Font Size %, not both'
                        : 'Absolute font size in px — overrides Font Size % when set explicitly'
                })}

                <!-- Fill-sizing group -->
                <lcards-form-section
                    header="Fill Sizing"
                    description="Scale text to fill the card height. Use Font Size % + Cap Height Ratio instead of Font Size (px)."
                    icon="mdi:arrow-expand-vertical"
                    ?expanded=${!!(fieldConfig.font_size_percent || fieldConfig.cap_height_ratio || fieldConfig.stretch)}
                    ?outlined=${false}
                    headerLevel="6"
                    ?compact=${true}>

                    ${FormField.renderField(this.editor, `text.${fieldName}.font_size_percent`, {
                        label: 'Font Size (% of height)',
                        helper: 'Scales font so cap glyphs fill this % of the card height (when Cap Height Ratio is also set). Use instead of Font Size (px).'
                    })}

                    ${FormField.renderField(this.editor, `text.${fieldName}.cap_height_ratio`, {
                        label: 'Cap Height Ratio',
                        helper: 'Ratio of visible cap glyph height to the font em-square. Antonio ≈ 0.86. Adjust per font until caps fill the box. Has no effect without Font Size %.'
                    })}

                    ${FormField.renderField(this.editor, `text.${fieldName}.stretch`, {
                        label: 'Stretch Width',
                        helper: 'Stretch/compress glyphs to fill a fraction of the available width. true or 1 = 100%, 0.8 = 80%'
                    })}

                </lcards-form-section>

            </lcards-form-section>

            <!-- Alignment Section -->
            <lcards-form-section
                header="Alignment"
                description="Override anchor/baseline, text transform, and rotation"
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

                ${FormField.renderField(this.editor, `text.${fieldName}.rotation`, {
                    label: 'Rotation',
                    helper: hasDefaults && !fieldConfig.rotation ? 'Inherits from defaults (0°)' : 'Rotation angle in degrees'
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

            <!-- Background Section -->
            <lcards-form-section
                header="Background"
                description="Text background rectangle (bar-break effect)"
                icon="mdi:rectangle"
                ?expanded=${false}
                ?outlined=${true}
                headerLevel="6"
                ?compact=${true}>

                <lcards-color-section-v2
                    .editor=${this.editor}
                    .config=${this.editor.config}
                    basePath="text.${fieldName}.background"
                    header="Background Colour"
                    description="${hasDefaults ? 'Override default background colour per state' : 'Background colour for different entity states'}"
                    .suggestedStates=${['default', 'active', 'inactive', 'unavailable', 'zero', 'non_zero']}
                    ?allowCustomStates=${true}
                    ?expanded=${false}>
                </lcards-color-section-v2>

                ${FormField.renderField(this.editor, `text.${fieldName}.background_padding`, {
                    label: 'Background Padding',
                    helper: hasDefaults && fieldConfig.background_padding === undefined ? 'Inherits from defaults' : ''
                })}

                ${FormField.renderField(this.editor, `text.${fieldName}.background_radius`, {
                    label: 'Background Corner Radius',
                    helper: hasDefaults && fieldConfig.background_radius === undefined ? 'Inherits from defaults' : ''
                })}

                ${FormField.renderField(this.editor, `text.${fieldName}.background_width`, {
                    label: 'Background Width (Fixed)',
                    helper: 'Exact px width — overrides auto-sizing. Text overflows if content is wider.'
                })}

                ${FormField.renderField(this.editor, `text.${fieldName}.background_min_width`, {
                    label: 'Background Min Width',
                    helper: 'Auto-sizes with text but never shrinks below this value — safe for dynamic content.'
                })}
            </lcards-form-section>

            <!-- Field Colors -->
            <lcards-color-section-v2
                .editor=${this.editor}
                .config=${this.editor.config}
                basePath="text.${fieldName}.color"
                header="Field Colours"
                description="Override default colour settings"
                .suggestedStates=${['default', 'active', 'inactive', 'unavailable', 'zero', 'non_zero']}
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

        // Component-preset fields — shown first in a distinct accent-colored group
        const availableComponentFields = this.componentTextFields
            ? this.componentTextFields.filter(f => !existingFields.includes(f))
            : [];

        return html`
            <div class="add-dialog">
                <div class="add-dialog-header">Add Text Field</div>
                <div class="add-dialog-content">

                    <!-- Component preset fields (shown only in component mode) -->
                    ${availableComponentFields.length > 0 ? html`
                        <div>
                            <div class="field-label" style="color: var(--accent-color); font-size: 12px; font-weight: 600; margin-bottom: 6px;">
                                Component fields
                            </div>
                            <div class="quick-add-buttons">
                                ${availableComponentFields.map(fieldName => html`
                                    <ha-button
                                        @click=${() => this._addField(fieldName)}
                                        style="--mdc-theme-primary: var(--accent-color)">
                                        <ha-icon icon="mdi:plus" slot="start"></ha-icon>
                                        ${fieldName}
                                    </ha-button>
                                `)}
                            </div>
                        </div>
                    ` : ''}

                    <!-- Generic quick-add fields -->
                    ${availableCommonFields.length > 0 ? html`
                        <div>
                            <div class="field-label" style="font-size: 12px; margin-bottom: 6px;">Quick Add</div>
                            <div class="quick-add-buttons">
                                ${availableCommonFields.map(fieldName => html`
                                    <ha-button @click=${() => this._addField(fieldName)}>
                                        <ha-icon icon="mdi:plus" slot="start"></ha-icon>
                                        ${fieldName}
                                    </ha-button>
                                `)}
                            </div>
                        </div>
                    ` : ''}

                    <div class="custom-field-input">
                        <ha-input
                            .label=${'Custom Field Name'}
                            .helper=${'Alphanumeric and underscore only'}
                            .value=${this._newFieldName}
                            @input=${(e) => this._newFieldName = e.target.value}
                            @keydown=${(e) => {
                                if (e.key === 'Enter' && this._isValidFieldName(this._newFieldName)) {
                                    this._addField(this._newFieldName);
                                }
                            }}>
                        </ha-input>
                        <ha-button
                            variant="brand"
                            @click=${() => this._addField(this._newFieldName)}
                            ?disabled=${!this._isValidFieldName(this._newFieldName)}>
                            <ha-icon icon="mdi:plus" slot="start"></ha-icon>
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
                defaultContent = '[[[ return (((Math.floor(Math.random() * 256).toString(16).padStart(2, \'0\')) + "-" + (Math.floor(Math.random() * 4096).toString(16).padStart(3, \'0\')))) ]]]';
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

if (!customElements.get('lcards-multi-text-editor-v2')) customElements.define('lcards-multi-text-editor-v2', LCARdSMultiTextEditorV2);
