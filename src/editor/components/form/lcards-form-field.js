/**
 * LCARdS Form Field
 *
 * Smart form field component that auto-renders appropriate control based on
 * schema property definition. Supports all standard JSON Schema types plus
 * LCARdS-specific formats (entity, color, action).
 *
 * @example
 * <lcards-form-field
 *   .editor=${this}
 *   path="style.color.border"
 *   label="Border Color"
 *   helper="Color for the button border">
 * </lcards-form-field>
 */

import { LitElement, html, css } from 'lit';
import {
    getEffectiveLabel,
    getEffectiveHelper,
    hasFormat,
    isType,
    hasEnum,
    isPositionEnum,
    getEnumOptions
} from '../../../utils/schema-helpers.js';
import './lcards-position-picker.js';
import './lcards-font-selector.js';

export class LCARdSFormField extends LitElement {

    static get properties() {
        return {
            path: { type: String },           // Config path (e.g., 'style.color.border')
            editor: { type: Object },         // Parent editor reference
            config: { type: Object },         // Editor config (for reactivity)
            label: { type: String },          // Optional label override
            helper: { type: String },         // Optional helper text override
            required: { type: Boolean },      // Required field
            disabled: { type: Boolean }       // Disabled state
        };
    }

    constructor() {
        super();
        this.path = '';
        this.editor = null;
        this.config = null;
        this.label = '';
        this.helper = '';
        this.required = false;
        this.disabled = false;
    }

    static get styles() {
        return css`
            :host {
                display: block;
            }

            .form-field {
                display: flex;
                flex-direction: column;
                gap: 8px;
                margin-bottom: 12px; /* Reduced from 16px for consistency */
            }

            label {
                font-weight: 500;
                color: var(--primary-text-color, #212121);
                font-size: 14px;
                display: flex;
                align-items: center;
                gap: 4px;
                padding: 2px 8px;
            }

            label .required {
                color: var(--error-color, #f44336);
            }

            .helper-text {
                font-size: 12px;
                color: var(--secondary-text-color, #727272);
                line-height: 1.4;
                padding: 0 8px;
            }

            .form-control {
                padding: 2px 8px;
            }

            ha-selector,
            ha-entity-picker,
            ha-textfield {
                width: 100%;
                display: block;
            }

            ha-entity-picker {
                --ha-select-min-width: 200px;
            }
        `;
    }

    /**
     * Get schema for this field's path
     * @returns {Object|null}
     * @private
     */
    get _schema() {
        if (!this.editor || !this.path) return null;
        return this.editor._getSchemaForPath(this.path);
    }

    /**
     * Get current value for this field
     * @returns {*}
     * @private
     */
    get _value() {
        if (!this.editor || !this.path) return undefined;
        return this.editor._getConfigValue(this.path);
    }

    /**
     * Get effective label (prop override or schema title or formatted path)
     * @returns {string}
     * @private
     */
    get _effectiveLabel() {
        return getEffectiveLabel(this._schema, this.path, this.label);
    }

    /**
     * Get effective helper text
     * @returns {string}
     * @private
     */
    get _effectiveHelper() {
        return getEffectiveHelper(this._schema, this.helper);
    }

    render() {
        if (!this.editor || !this.path) {
            return html`
                <div class="form-field">
                    <ha-alert alert-type="error">
                        Form field requires 'editor' and 'path' properties
                    </ha-alert>
                </div>
            `;
        }

        const schema = this._schema;
        if (!schema) {
            return html`
                <div class="form-field">
                    <ha-alert alert-type="warning">
                        No schema found for path: ${this.path}
                    </ha-alert>
                </div>
            `;
        }

        return html`
            <div class="form-field">
                <div class="form-control">
                    ${this._renderControl(schema)}
                </div>
            </div>
        `;
    }

    /**
     * Render appropriate control based on schema
     * @param {Object} schema - Property schema
     * @returns {TemplateResult}
     * @private
     */
    _renderControl(schema) {
        // Check for LCARdS-specific formats first
        if (hasFormat(schema, 'entity')) {
            return this._renderEntityPicker();
        }

        if (hasFormat(schema, 'color')) {
            return this._renderColorSelector();
        }

        if (hasFormat(schema, 'icon')) {
            return this._renderIconSelector();
        }

        if (hasFormat(schema, 'action')) {
            return this._renderActionEditor();
        }

        if (hasFormat(schema, 'font-family')) {
            return this._renderFontSelector();
        }

        // Check for position enum (graphical picker)
        if (isPositionEnum(schema)) {
            return this._renderPositionPicker();
        }

        // Standard JSON Schema types
        if (hasEnum(schema)) {
            return this._renderSelect(schema);
        }

        if (isType(schema, 'boolean')) {
            return this._renderBoolean();
        }

        if (isType(schema, 'number') || isType(schema, 'integer')) {
            return this._renderNumber(schema);
        }

        if (isType(schema, 'array')) {
            return this._renderArray(schema);
        }

        if (isType(schema, 'object')) {
            return html`
                <ha-alert alert-type="info">
                    Object type - use nested form sections
                </ha-alert>
            `;
        }

        // Default to text field
        return this._renderText();
    }

    /**
     * Render entity picker
     * @returns {TemplateResult}
     * @private
     */
    _renderEntityPicker() {
        // Use ha-selector with entity selector (modern approach)
        // This is more consistent and better supported than ha-entity-picker
        return html`
            <ha-selector
                .hass=${this.editor.hass}
                .selector=${{ entity: {} }}
                .configValue=${this.path}
                .value=${this._value || ''}
                .label=${this._effectiveLabel}
                .helper=${this._effectiveHelper}
                .disabled=${this.disabled}
                .required=${this.required}
                @value-changed=${this._handleValueChange}>
            </ha-selector>
        `;
    }

    /**
     * Render color selector
     * @returns {TemplateResult}
     * @private
     */
    _renderColorSelector() {
        // Use HA's ui-color selector for color picking
        return html`
            <ha-selector
                .hass=${this.editor.hass}
                .selector=${{ ui_color: {} }}
                .configValue=${this.path}
                .value=${this._value || ''}
                .label=${this._effectiveLabel}
                .helper=${this._effectiveHelper}
                .disabled=${this.disabled}
                @value-changed=${this._handleValueChange}>
            </ha-selector>
        `;
    }

    /**
     * Render icon selector
     * @returns {TemplateResult}
     * @private
     */
    _renderIconSelector() {
        // Use HA's icon selector for icon picking
        return html`
            <ha-selector
                .hass=${this.editor.hass}
                .selector=${{ icon: {} }}
                .configValue=${this.path}
                .value=${this._value || ''}
                .label=${this._effectiveLabel}
                .helper=${this._effectiveHelper}
                .disabled=${this.disabled}
                @value-changed=${this._handleValueChange}>
            </ha-selector>
        `;
    }

    /**
     * Render action editor
     * @returns {TemplateResult}
     * @private
     */
    _renderActionEditor() {
        return html`
            <lcards-action-editor
                .hass=${this.editor.hass}
                .action=${this._value || { action: 'none' }}
                @value-changed=${this._handleValueChange}>
            </lcards-action-editor>
        `;
    }

    /**
     * Render position picker (graphical 3x3 grid)
     * @returns {TemplateResult}
     * @private
     */
    _renderPositionPicker() {
        return html`
            <lcards-position-picker
                .value=${this._value}
                .label=${this._effectiveLabel}
                .helper=${this._effectiveHelper}
                .disabled=${this.disabled}
                @value-changed=${this._handleValueChange}>
            </lcards-position-picker>
        `;
    }

    /**
     * Render font selector
     * @returns {TemplateResult}
     * @private
     */
    _renderFontSelector() {
        return html`
            <lcards-font-selector
                .hass=${this.editor.hass}
                .value=${this._value || 'Antonio'}
                .label=${this._effectiveLabel}
                .helper=${this._effectiveHelper}
                .disabled=${this.disabled}
                .showPreview=${true}
                @value-changed=${this._handleValueChange}>
            </lcards-font-selector>
        `;
    }

    /**
     * Render select dropdown
     * @param {Object} schema - Property schema
     * @returns {TemplateResult}
     * @private
     */
    _renderSelect(schema) {
        const options = getEnumOptions(schema);

        return html`
            <ha-selector
                .hass=${this.editor.hass}
                .selector=${{
                    select: {
                        mode: 'dropdown',
                        options
                    }
                }}
                .configValue=${this.path}
                .value=${this._value}
                .label=${this._effectiveLabel}
                .helper=${this._effectiveHelper}
                .disabled=${this.disabled}
                @value-changed=${this._handleValueChange}>
            </ha-selector>
        `;
    }

    /**
     * Render boolean switch
     * @returns {TemplateResult}
     * @private
     */
    _renderBoolean() {
        const currentValue = this._value ?? false;

        return html`
            <ha-selector
                .hass=${this.editor.hass}
                .selector=${{ boolean: {} }}
                .value=${currentValue}
                .label=${this._effectiveLabel}
                .helper=${this._effectiveHelper}
                .required=${this.required}
                .disabled=${this.disabled}
                @value-changed=${this._handleValueChange}>
            </ha-selector>
        `;
    }

    /**
     * Handle boolean switch change
     * @param {Event} ev - change event
     * @private
     */
    _handleBooleanSwitch(ev) {
        const newValue = ev.target.checked;
        this.editor._setConfigValue(this.path, newValue);
    }

    /**
     * Render number input
     * @param {Object} schema - Property schema
     * @returns {TemplateResult}
     * @private
     */
    _renderNumber(schema) {
        return html`
            <ha-selector
                .hass=${this.editor.hass}
                .selector=${{
                    number: {
                        min: schema.minimum,
                        max: schema.maximum,
                        step: schema.type === 'integer' ? 1 : (schema.multipleOf || 0.1),
                        mode: 'box'
                    }
                }}
                .configValue=${this.path}
                .value=${this._value}
                .label=${this._effectiveLabel}
                .helper=${this._effectiveHelper}
                .disabled=${this.disabled}
                @value-changed=${this._handleValueChange}>
            </ha-selector>
        `;
    }

    /**
     * Render array input (comma-separated for simple arrays)
     * @param {Object} schema - Property schema
     * @returns {TemplateResult}
     * @private
     */
    _renderArray(schema) {
        // For simple string arrays, use comma-separated input
        if (schema.items?.type === 'string') {
            const arrayValue = this._value || [];
            const stringValue = Array.isArray(arrayValue) ? arrayValue.join(', ') : '';

            return html`
                <ha-selector
                    .hass=${this.editor.hass}
                    .selector=${{ text: {} }}
                    .value=${stringValue}
                    .disabled=${this.disabled}
                    @input=${this._handleArrayInput}
                    placeholder="comma, separated, values">
                </ha-selector>
            `;
        }

        // Complex arrays need custom editor
        return html`
            <ha-alert alert-type="info">
                Complex array - use specialized editor component
            </ha-alert>
        `;
    }

    /**
     * Render text input
     * @returns {TemplateResult}
     * @private
     */
    _renderText() {
        return html`
            <ha-selector
                .hass=${this.editor.hass}
                .selector=${{ text: {} }}
                .configValue=${this.path}
                .value=${this._value || ''}
                .label=${this._effectiveLabel}
                .helper=${this._effectiveHelper}
                .disabled=${this.disabled}
                @value-changed=${this._handleValueChange}>
            </ha-selector>
        `;
    }

    /**
     * Handle value change from control
     * @param {CustomEvent} ev - value-changed event
     * @private
     */
    _handleValueChange(ev) {
        ev.stopPropagation();

        if (!this.editor || !this.path) return;

        // Extract value based on event type and target
        // For HA-SWITCH (inside ha-selector boolean), read .checked property
        let newValue;
        if (ev.target?.tagName === 'HA-SWITCH') {
            newValue = ev.target.checked ?? ev.target.__checked;
        } else {
            newValue = ev.detail?.value;
        }

        this.editor._setConfigValue(this.path, newValue);
    }

    /**
     * Handle array input (comma-separated)
     * @param {Event} ev - input event
     * @private
     */
    _handleArrayInput(ev) {
        const value = ev.target.value;
        const array = value
            .split(',')
            .map(item => item.trim())
            .filter(item => item.length > 0);

        this.editor._setConfigValue(this.path, array);
    }
}

customElements.define('lcards-form-field', LCARdSFormField);
