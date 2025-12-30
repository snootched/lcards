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
import '../editors/lcards-position-picker.js';
import '../editors/lcards-font-selector.js';

export class LCARdSFormField extends LitElement {

    static get properties() {
        return {
            path: { type: String },           // Config path (e.g., 'style.color.border')
            editor: { type: Object },         // Parent editor reference
            config: { type: Object },         // Editor config (for reactivity)
            label: { type: String },          // Optional label override
            helper: { type: String },         // Optional helper text override
            required: { type: Boolean },      // Required field
            disabled: { type: Boolean },      // Disabled state
            selectorOverride: { type: Object }, // Override selector config (highest priority)
            oneOfBranch: { type: Number },    // Force specific oneOf branch (0-indexed)
            _selectedOneOfIndex: { type: Number, state: true }  // Selected oneOf index
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
        this.selectorOverride = null;
        this.oneOfBranch = null;
        this._selectedOneOfIndex = 0;
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
                margin-bottom: var(--lcards-section-spacing, 16px);
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
        return this._effectiveLabelWithHints;
    }

    /**
     * Get effective helper text
     * @returns {string}
     * @private
     */
    get _effectiveHelper() {
        return this._effectiveHelperWithHints;
    }

    /**
     * Get effective helper text
     * @returns {string}
     * @private
     */
    get _effectiveHelper() {
        return getEffectiveHelper(this._schema, this.helper);
    }

    /**
     * Get selector configuration with priority: override > x-ui-hints > auto-generated
     * @returns {Object} Selector configuration
     * @private
     */
    _getSelectorConfig() {
        // 1. Field-level override (highest priority)
        if (this.selectorOverride) {
            return this.selectorOverride;
        }

        const schema = this._schema;
        if (!schema) return this._generateDefaultSelector();

        // 2. Schema x-ui-hints.selector
        const hints = schema['x-ui-hints'];
        if (hints?.selector) {
            // If already has choose selector, use it
            if (hints.selector.choose) {
                return hints.selector;
            }
            
            // Otherwise merge with schema constraints
            return this._mergeWithSchemaConstraints(hints.selector, schema);
        }

        // 3. Auto-generate choose for oneOf
        if (Array.isArray(schema.oneOf)) {
            return this._generateChooseSelectorForOneOf(schema);
        }

        // 4. Fallback to type-based auto-generation
        return this._generateSelectorFromSchema(schema);
    }

    /**
     * Legacy method for backward compatibility with type-specific selector config
     * @param {string} selectorType - Type of selector (e.g., 'number', 'entity', 'select')
     * @param {Object} autoConfig - Auto-generated selector config
     * @returns {Object} Merged selector configuration
     * @private
     */
    _getSelectorConfigLegacy(selectorType, autoConfig = {}) {
        // Priority 1: Field-level selectorOverride (highest priority)
        if (this.selectorOverride && this.selectorOverride[selectorType]) {
            return this._mergeWithSchemaConstraints(
                selectorType,
                this.selectorOverride[selectorType],
                autoConfig
            );
        }

        // Priority 2: Schema x-ui-hints.selector
        const xUiHints = this._schema?.['x-ui-hints'];
        if (xUiHints?.selector && xUiHints.selector[selectorType]) {
            return this._mergeWithSchemaConstraints(
                selectorType,
                xUiHints.selector[selectorType],
                autoConfig
            );
        }

        // Priority 3: Auto-generated (fallback)
        return autoConfig;
    }

    /**
     * Merge selector config with schema constraints
     * Ensures min/max/step from schema are respected even with overrides
     * 
     * @param {*} selectorTypeOrConfig - Type of selector or full selector config object
     * @param {Object} override - Override configuration
     * @param {Object} schemaConstraints - Auto-generated constraints from schema
     * @returns {Object} Merged configuration
     * @private
     */
    _mergeWithSchemaConstraints(selectorTypeOrConfig, override, schemaConstraints) {
        // If first arg is an object (full selector config), return it directly
        if (typeof selectorTypeOrConfig === 'object') {
            return selectorTypeOrConfig;
        }

        const selectorType = selectorTypeOrConfig;

        // For number selectors, schema constraints should be preserved
        if (selectorType === 'number') {
            return {
                ...schemaConstraints,
                ...override,
                // Ensure schema min/max are respected if not overridden
                min: override.min !== undefined ? override.min : schemaConstraints.min,
                max: override.max !== undefined ? override.max : schemaConstraints.max,
                step: override.step !== undefined ? override.step : schemaConstraints.step
            };
        }

        // For other selectors, simple merge
        return { ...schemaConstraints, ...override };
    }

    /**
     * Generate default selector for unknown schema
     * @returns {Object} Default selector config
     * @private
     */
    _generateDefaultSelector() {
        return { text: {} };
    }

    /**
     * Generate selector from schema type
     * @param {Object} schema - JSON Schema
     * @returns {Object} Selector configuration
     * @private
     */
    _generateSelectorFromSchema(schema) {
        if (!schema) return this._generateDefaultSelector();

        // Handle based on type
        if (isType(schema, 'number') || isType(schema, 'integer')) {
            return {
                number: {
                    min: schema.minimum,
                    max: schema.maximum,
                    step: schema.type === 'integer' ? 1 : (schema.multipleOf || 0.1),
                    mode: 'box'
                }
            };
        }

        if (isType(schema, 'boolean')) {
            return { boolean: {} };
        }

        if (hasEnum(schema)) {
            return {
                select: {
                    mode: 'dropdown',
                    options: getEnumOptions(schema)
                }
            };
        }

        // Default to text
        return { text: {} };
    }

    /**
     * Auto-generate ha-selector-choose for oneOf schemas
     * Uses HA's required "choices" object structure (not "options" array)
     * @param {Object} schema - JSON Schema with oneOf
     * @returns {Object} Choose selector configuration
     * @private
     */
    _generateChooseSelectorForOneOf(schema) {
        if (!Array.isArray(schema.oneOf)) {
            return this._generateDefaultSelector();
        }

        const choices = {};
        
        schema.oneOf.forEach((branch, index) => {
            const label = this._getLabelForOneOfBranch(branch);
            const branchSelector = this._generateSelectorFromSchema(branch);
            
            // Generate key from label (lowercase, no spaces, underscores)
            const key = label.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
            
            choices[key] = {
                selector: branchSelector
            };
        });

        return {
            choose: {
                choices: choices  // ← Object with named keys (HA requirement)
            }
        };
    }

    /**
     * Get human-readable label for oneOf branch based on type and pattern
     * @param {Object} branch - oneOf schema branch
     * @returns {string} Display label
     * @private
     */
    _getLabelForOneOfBranch(branch) {
        // Use title if provided
        if (branch.title) return branch.title;

        if (branch.type === 'number' || branch.type === 'integer') {
            return 'Number';
        }
        
        if (branch.type === 'string') {
            // Check if it's a theme token pattern
            if (branch.pattern?.includes('theme:') || branch.pattern?.includes('\\{theme:')) {
                return 'Theme Token';
            }
            // Check for enum with single value (like "theme")
            if (branch.enum && branch.enum.length === 1 && branch.enum[0] === 'theme') {
                return 'Theme Binding';
            }
            return 'Text';
        }
        
        if (branch.type === 'object') {
            const props = branch.properties || {};
            
            // Check if it's padding-like (top/right/bottom/left)
            if (props.top && props.right && props.bottom && props.left) {
                return 'Per Side';
            }
            
            // Check if it's state-based colors (default/active/inactive)
            if (props.default && props.active) {
                return 'By State';
            }
            
            return 'Advanced';
        }
        
        if (branch.type === 'boolean') {
            return 'Toggle';
        }
        
        return `Option ${branch.title || ''}`;
    }

    /**
     * Get effective label from x-ui-hints or fallback
     * @returns {string}
     * @private
     */
    get _effectiveLabelWithHints() {
        // Explicit prop takes precedence
        if (this.label) return this.label;

        // Check x-ui-hints.label
        const xUiHints = this._schema?.['x-ui-hints'];
        if (xUiHints?.label) return xUiHints.label;

        // Fallback to schema title or formatted path
        return getEffectiveLabel(this._schema, this.path, '');
    }

    /**
     * Get effective helper from x-ui-hints or fallback
     * @returns {string}
     * @private
     */
    get _effectiveHelperWithHints() {
        // Explicit prop takes precedence
        if (this.helper) return this.helper;

        // Check x-ui-hints.helper
        const xUiHints = this._schema?.['x-ui-hints'];
        if (xUiHints?.helper) return xUiHints.helper;

        // Fallback to schema description
        return this._schema?.description || '';
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
        // Check if we have a choose selector (from override, x-ui-hints, or auto-generated)
        // This takes precedence over legacy oneOf handling
        const selectorConfig = this._getSelectorConfig();
        if (selectorConfig?.choose) {
            return this._renderChooseSelector(selectorConfig);
        }

        // Handle oneOf schemas with legacy dropdown - render selector for choosing which schema to use
        if (Array.isArray(schema.oneOf) && schema.oneOf.length > 0) {
            return this._renderOneOfSelector(schema);
        }

        // Check for tags field (special multi-select with chips)
        if (this.path === 'tags') {
            return this._renderTagsSelector();
        }

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
     * Render ha-selector-choose for oneOf schemas
     * HA's choose selector automatically detects which choice matches the value type
     * @param {Object} selectorConfig - Selector configuration with choose.choices
     * @returns {TemplateResult}
     * @private
     */
    _renderChooseSelector(selectorConfig) {
        return html`
            <ha-selector
                .hass=${this.editor.hass}
                .selector=${selectorConfig}
                .value=${this._value}
                .label=${this._effectiveLabel}
                .helper=${this._effectiveHelper}
                .disabled=${this.disabled}
                .required=${this.required}
                @value-changed=${this._handleValueChange}>
            </ha-selector>
        `;
    }

    /**
     * Render oneOf selector - allows choosing between multiple schema options
     * Supports x-ui-hints.defaultOneOfBranch and oneOfBranch property
     * @param {Object} schema - Schema with oneOf array
     * @returns {TemplateResult}
     * @private
     */
    _renderOneOfSelector(schema) {
        const DESCRIPTION_MAX_LENGTH = 30; // Maximum length for description truncation

        // Determine default branch: oneOfBranch prop > x-ui-hints.defaultOneOfBranch > 0
        let defaultBranch = 0;
        if (this.oneOfBranch !== null && this.oneOfBranch !== undefined) {
            defaultBranch = this.oneOfBranch;
        } else {
            const xUiHints = schema['x-ui-hints'];
            if (xUiHints?.defaultOneOfBranch !== undefined) {
                defaultBranch = xUiHints.defaultOneOfBranch;
            }
        }

        // Initialize _selectedOneOfIndex if needed
        if (this._selectedOneOfIndex === undefined || this._selectedOneOfIndex === null) {
            this._selectedOneOfIndex = defaultBranch;
        }

        const options = schema.oneOf.map((option, index) => {
            // Use option.title if available, otherwise generate label from type
            let label = option.title || `Option ${index + 1}`;
            if (!option.title && option.type) {
                label = `${option.type}`;
                if (option.description) {
                    const desc = option.description;
                    label += ` (${desc.length > DESCRIPTION_MAX_LENGTH ? desc.substring(0, DESCRIPTION_MAX_LENGTH) + '...' : desc})`;
                }
            }
            return { value: index, label };
        });

        // Get the selected schema
        const selectedSchema = schema.oneOf[this._selectedOneOfIndex] || schema.oneOf[0];

        // If oneOfBranch is set (forced branch), skip the type selector UI
        const skipSelector = this.oneOfBranch !== null && this.oneOfBranch !== undefined;

        return html`
            <div class="oneof-selector">
                ${!skipSelector ? html`
                    <label>${this._effectiveLabel}</label>

                    <!-- Schema type selector -->
                    <ha-selector
                        .hass=${this.editor.hass}
                        .selector=${{
                            select: {
                                mode: 'dropdown',
                                options: options.map(opt => ({ value: String(opt.value), label: opt.label }))
                            }
                        }}
                        .value=${String(this._selectedOneOfIndex)}
                        @value-changed=${this._handleOneOfChange}>
                    </ha-selector>

                    <!-- Render sub-editor for selected schema -->
                    <div class="oneof-content" style="margin-top: 12px;">
                        ${this._renderControl(selectedSchema)}
                    </div>
                ` : html`
                    <!-- Direct rendering without type selector -->
                    ${this._renderControl(selectedSchema)}
                `}

                ${this._effectiveHelper ? html`
                    <div class="helper-text">${this._effectiveHelper}</div>
                ` : ''}
            </div>
        `;
    }

    /**
     * Handle oneOf selection change
     * @param {CustomEvent} ev - value-changed event
     * @private
     */
    _handleOneOfChange(ev) {
        ev.stopPropagation();
        const newIndex = parseInt(ev.detail.value, 10);
        if (!isNaN(newIndex)) {
            this._selectedOneOfIndex = newIndex;
            this.requestUpdate();
        }
    }

    /**
     * Render entity picker
     * @returns {TemplateResult}
     * @private
     */
    _renderEntityPicker() {
        // Get effective config with priority handling
        const selectorConfig = this._getSelectorConfigLegacy('entity', {});

        return html`
            <ha-selector
                .hass=${this.editor.hass}
                .selector=${{ entity: selectorConfig }}
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
        // Get effective config with priority handling
        const selectorConfig = this._getSelectorConfigLegacy('ui_color', {});

        return html`
            <ha-selector
                .hass=${this.editor.hass}
                .selector=${{ ui_color: selectorConfig }}
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
        // Get effective config with priority handling
        const selectorConfig = this._getSelectorConfigLegacy('icon', {});

        return html`
            <ha-selector
                .hass=${this.editor.hass}
                .selector=${{ icon: selectorConfig }}
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
            <ha-selector
                .hass=${this.editor.hass}
                .selector=${{ ui_action: {} }}
                .value=${this._value || { action: 'none' }}
                @value-changed=${this._handleValueChange}>
            </ha-selector>
        `;
    }

    /**
     * Render tags selector (multi-select with chips and custom input)
     * @returns {TemplateResult}
     * @private
     */
    _renderTagsSelector() {
        const systemsManager = window.lcards?.core?.systemsManager;
        const availableTags = systemsManager?.getAllTags() || [];

        // Convert to selector option format
        const options = availableTags.map(tag => ({
            value: tag,
            label: tag
        }));

        return html`
            <ha-selector
                .hass=${this.editor.hass}
                .selector=${{
                    select: {
                        mode: 'list',
                        multiple: true,
                        custom_value: true,
                        options: options
                    }
                }}
                .value=${this._value || []}
                @value-changed=${this._handleValueChange}>
            </ha-selector>
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

        // Auto-generate config from schema
        const autoConfig = {
            mode: 'dropdown',
            options
        };

        // Get effective config with priority handling
        const selectorConfig = this._getSelectorConfigLegacy('select', autoConfig);

        return html`
            <ha-selector
                .hass=${this.editor.hass}
                .selector=${{ select: selectorConfig }}
                .value=${this._value}
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
        // Auto-generate config from schema
        const autoConfig = {
            min: schema.minimum,
            max: schema.maximum,
            step: schema.type === 'integer' ? 1 : (schema.multipleOf || 0.1),
            mode: 'box'
        };

        // Get effective config with priority handling
        const selectorConfig = this._getSelectorConfigLegacy('number', autoConfig);

        return html`
            <ha-selector
                .hass=${this.editor.hass}
                .selector=${{ number: selectorConfig }}
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
