/**
 * LCARdS Form Field Helper
 *
 * Generates ha-selector configurations from JSON Schema with x-ui-hints.
 * Returns TemplateResult for direct rendering in editor templates (no wrapper element).
 *
 * This refactored version fixes reactivity issues with ha-selector-choose by eliminating
 * double shadow DOM nesting and value transformation.
 *
 * @example
 * // In editor render method:
 * import { LCARdSFormFieldHelper as FormField } from '../components/shared/lcards-form-field.js';
 * 
 * ${FormField.renderField(this, 'style.track.segments.gap')}
 * 
 * // With overrides:
 * ${FormField.renderField(this, 'entity', {
 *     label: 'Primary Entity',
 *     helper: 'Select the entity to control'
 * })}
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

/**
 * Form field helper utilities
 * Static class that generates ha-selector templates from JSON Schema with x-ui-hints
 */
export class LCARdSFormFieldHelper {
    /**
     * Render ha-selector directly from schema with x-ui-hints
     * 
     * @param {Object} editor - Card editor instance (must have hass, _getSchemaForPath, _getConfigValue, _setConfigValue)
     * @param {string} path - Config path (e.g., 'style.track.segments.gap')
     * @param {Object} options - Optional overrides
     * @param {string} [options.label] - Override label from x-ui-hints
     * @param {string} [options.helper] - Override helper text from x-ui-hints
     * @param {Object} [options.selectorOverride] - Override entire selector config
     * @param {boolean} [options.disabled=false] - Disable the selector
     * @param {boolean} [options.required=false] - Mark as required
     * @returns {TemplateResult} ha-selector template (no wrapper element)
     */
    static renderField(editor, path, options = {}) {
        if (!editor || !path) {
            return html`
                <ha-alert alert-type="error">
                    Form field requires 'editor' and 'path' parameters
                </ha-alert>
            `;
        }

        const schema = editor._getSchemaForPath?.(path);
        if (!schema) {
            return html`
                <ha-alert alert-type="warning">
                    No schema found for path: ${path}
                </ha-alert>
            `;
        }

        const rawValue = editor._getConfigValue?.(path);
        const hints = schema?.['x-ui-hints'] || {};
        
        // Get selector config (priority: override > x-ui-hints > auto-generated)
        const selectorConfig = options.selectorOverride 
            || hints.selector 
            || this._getSelectorConfig(schema);
        
        // Get label/helper (priority: override > x-ui-hints > generated)
        const label = options.label || hints.label || getEffectiveLabel(schema, path, '');
        const helper = options.helper || hints.helper || schema?.description || '';
        
        // Check if we need special rendering (format-specific components)
        if (hasFormat(schema, 'font-family')) {
            return this._renderFontSelector(editor, path, rawValue, label, helper, options.disabled);
        }
        
        if (isPositionEnum(schema)) {
            return this._renderPositionPicker(editor, path, rawValue, label, helper, options.disabled);
        }
        
        // Special handling for tags field
        if (path === 'tags') {
            return this._renderTagsSelector(editor, path, rawValue, label, helper);
        }
        
        // Prepare value for selector (transforms for choose selector if needed)
        const value = this._prepareValueForSelector(rawValue, selectorConfig);
        
        // Return ha-selector template directly (no wrapper element)
        return html`
            <ha-selector
                .hass=${editor.hass}
                .selector=${selectorConfig}
                .value=${value}
                .label=${label}
                .helper=${helper}
                .disabled=${options.disabled || false}
                .required=${options.required || false}
                @value-changed=${(ev) => this._handleChange(ev, editor, path)}>
            </ha-selector>
        `;
    }
    
    /**
     * Prepare value for ha-selector rendering
     * Transforms clean config values into choose structure when needed
     * 
     * @param {*} value - Clean value from config (e.g., 23, "{theme:spacing.sm}")
     * @param {Object} selectorConfig - HA selector configuration
     * @returns {*} Value in format expected by selector (choose structure if needed)
     * @private
     * 
     * @example
     * // For choose selector with number value
     * _prepareValueForSelector(23, { choose: { choices: { pixels: {...}, theme: {...} } } })
     * // Returns: { active_choice: "pixels", pixels: 23, theme: "" }
     * 
     * // For non-choose selector
     * _prepareValueForSelector(23, { number: { min: 0, max: 50 } })
     * // Returns: 23 (unchanged)
     */
    static _prepareValueForSelector(value, selectorConfig) {
        // Only transform for choose selectors
        if (!selectorConfig?.choose?.choices) {
            return value;
        }
        
        const choices = selectorConfig.choose.choices;
        
        // Handle undefined/null values - use first choice default
        if (value === undefined || value === null) {
            const firstKey = Object.keys(choices)[0];
            const firstSelector = choices[firstKey]?.selector;
            
            if (firstSelector?.number) {
                value = firstSelector.number.min ?? 0;
            } else if (firstSelector?.text) {
                value = '';
            } else {
                value = null;
            }
        }
        
        // Detect which choice matches the value type
        let activeChoice = null;
        
        if (typeof value === 'number') {
            // Find choice with number selector
            activeChoice = Object.keys(choices).find(key => 
                choices[key]?.selector?.number
            );
        } else if (typeof value === 'string') {
            // Check for theme token pattern
            if (value.startsWith('{theme:') || value.includes('var(--')) {
                activeChoice = Object.keys(choices).find(key => 
                    (key.includes('theme') || key === 'theme_token') && 
                    choices[key]?.selector?.text
                );
            }
            
            // Check for special "theme" enum value (elbow bar_width/height)
            if (!activeChoice && value === 'theme') {
                activeChoice = Object.keys(choices).find(key => 
                    key.includes('theme') || key.includes('binding')
                );
            }
            
            // Find any text selector
            if (!activeChoice) {
                activeChoice = Object.keys(choices).find(key => 
                    choices[key]?.selector?.text || choices[key]?.selector?.select
                );
            }
        } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
            // Find choice with object selector
            activeChoice = Object.keys(choices).find(key => 
                choices[key]?.selector?.object
            );
        }
        
        // Default to first choice if no match
        if (!activeChoice) {
            activeChoice = Object.keys(choices)[0];
        }
        
        // Build choose structure: { active_choice: "key", key: value, otherKeys: defaults }
        const chooseValue = { active_choice: activeChoice };
        
        Object.keys(choices).forEach(key => {
            if (key === activeChoice) {
                // Set the active choice to the actual value
                chooseValue[key] = value;
            } else {
                // Set inactive choices to appropriate defaults
                const selector = choices[key]?.selector;
                if (selector?.number) {
                    chooseValue[key] = selector.number.min ?? 0;
                } else if (selector?.text) {
                    chooseValue[key] = '';
                } else if (selector?.select) {
                    chooseValue[key] = selector.select.options?.[0]?.value ?? '';
                } else {
                    chooseValue[key] = null;
                }
            }
        });
        
        console.log('[FormFieldHelper] Value prepared for choose selector:', {
            path: '(see render context)',
            rawValue: value,
            activeChoice: activeChoice,
            chooseValue: chooseValue
        });
        
        return chooseValue;
    }
    
    /**
     * Handle value change from ha-selector
     * Simple pass-through with HA-SWITCH special handling
     * @private
     */
    static _handleChange(ev, editor, path) {
        ev.stopPropagation();
        
        if (!editor || !path) return;
        
        // Extract value (HA-SWITCH special case)
        let value;
        if (ev.target?.tagName === 'HA-SWITCH') {
            value = ev.target.checked ?? ev.target.__checked;
        } else {
            value = ev.detail?.value;
        }
        
        // Extract actual value from choose structure
        // Choose selector emits: { active_choice: "pixels", pixels: 23, theme: "" }
        // We need to extract just: 23
        if (value && typeof value === 'object' && value.active_choice) {
            const activeChoice = value.active_choice;
            const extractedValue = value[activeChoice];
            
            console.log('[FormFieldHelper] Choose value extracted:', {
                path: path,
                rawValue: value,
                activeChoice: activeChoice,
                extractedValue: extractedValue
            });
            
            value = extractedValue;
        }
        
        // Set config value (now clean, no choose wrapper)
        editor._setConfigValue?.(path, value);
    }
    
    /**
     * Get selector configuration with priority: override > x-ui-hints > auto-generated
     * @param {Object} schema - JSON Schema
     * @returns {Object} HA selector configuration
     * @private
     */
    static _getSelectorConfig(schema) {
        if (!schema) return { text: {} };
        
        // Check x-ui-hints.selector first
        const hints = schema['x-ui-hints'];
        if (hints?.selector) {
            return hints.selector;
        }
        
        // If schema has oneOf, generate choose selector
        if (Array.isArray(schema.oneOf) && schema.oneOf.length > 0) {
            return this._generateChooseSelectorForOneOf(schema);
        }
        
        // Fallback to type-based generation
        return this._autoGenerateSelector(schema);
    }
    
    /**
     * Auto-generate selector from JSON Schema
     * Handles oneOf (choose selector), type-based generation, enums
     * @param {Object} schema - JSON Schema
     * @returns {Object} HA selector configuration
     * @private
     */
    static _autoGenerateSelector(schema) {
        if (!schema) return { text: {} };
        
        // Type-based generation
        if (isType(schema, 'number') || isType(schema, 'integer')) {
            return {
                number: {
                    mode: schema.maximum && schema.maximum <= 100 ? 'slider' : 'box',
                    min: schema.minimum,
                    max: schema.maximum,
                    step: schema.type === 'integer' ? 1 : (schema.multipleOf || 0.1)
                }
            };
        }
        
        if (isType(schema, 'boolean')) {
            return { boolean: {} };
        }
        
        if (isType(schema, 'string')) {
            // Entity format
            if (hasFormat(schema, 'entity')) {
                return { entity: {} };
            }
            
            // Icon format
            if (hasFormat(schema, 'icon')) {
                return { icon: {} };
            }
            
            // Color format
            if (hasFormat(schema, 'color')) {
                return { ui_color: {} };
            }
            
            // Action format
            if (hasFormat(schema, 'action')) {
                return { ui_action: {} };
            }
            
            // Enum → select
            if (hasEnum(schema)) {
                return {
                    select: {
                        mode: 'dropdown',
                        options: getEnumOptions(schema)
                    }
                };
            }
            
            return { text: {} };
        }
        
        if (isType(schema, 'object')) {
            return { object: {} };
        }
        
        // Check for enum (any type)
        if (hasEnum(schema)) {
            return {
                select: {
                    mode: 'dropdown',
                    options: getEnumOptions(schema)
                }
            };
        }
        
        return { text: {} };
    }
    
    /**
     * Generate ha-selector-choose for oneOf schemas
     * Creates choices object with named keys (HA requirement)
     * 
     * @param {Object} schema - JSON Schema with oneOf array
     * @returns {Object} Choose selector configuration
     * @private
     */
    static _generateChooseSelectorForOneOf(schema) {
        const choices = {};
        
        schema.oneOf.forEach((branch, index) => {
            const label = this._getLabelForOneOfBranch(branch);
            const branchSelector = this._autoGenerateSelector(branch);
            
            // Generate key from label (lowercase, underscores, alphanumeric only)
            const key = label.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '') || `option_${index}`;
            
            choices[key] = {
                selector: branchSelector
            };
        });
        
        return {
            choose: {
                choices: choices  // Object with named keys (not array)
            }
        };
    }
    
    /**
     * Get human-readable label for oneOf branch
     * @param {Object} branch - oneOf schema branch
     * @returns {string} Display label
     * @private
     */
    static _getLabelForOneOfBranch(branch) {
        // Use title if provided
        if (branch.title) return branch.title;
        
        if (branch.type === 'number' || branch.type === 'integer') {
            return 'Number';
        }
        
        if (branch.type === 'string') {
            // Theme token pattern
            if (branch.pattern?.includes('theme:') || branch.pattern?.includes('\\{theme:')) {
                return 'Theme Token';
            }
            // Special "theme" enum value (for elbow bar_width/height)
            if (branch.enum?.includes('theme')) {
                return 'Theme Binding';
            }
            return 'Text';
        }
        
        if (branch.type === 'object') {
            const props = branch.properties || {};
            
            // Padding-like (top/right/bottom/left)
            if (props.top && props.right && props.bottom && props.left) {
                return 'Per Side';
            }
            
            // State-based colors (default/active/inactive)
            if (props.default && props.active) {
                return 'By State';
            }
            
            // Per-corner (top_left, top_right, etc.)
            if (props.top_left || props.top_right) {
                return 'Per Corner';
            }
            
            return 'Advanced';
        }
        
        if (branch.type === 'boolean') {
            return 'Toggle';
        }
        
        return 'Option';
    }
    
    /**
     * Render font selector (special component)
     * @private
     */
    static _renderFontSelector(editor, path, value, label, helper, disabled) {
        return html`
            <lcards-font-selector
                .hass=${editor.hass}
                .value=${value || 'Antonio'}
                .label=${label}
                .helper=${helper}
                .disabled=${disabled || false}
                .showPreview=${true}
                @value-changed=${(ev) => this._handleChange(ev, editor, path)}>
            </lcards-font-selector>
        `;
    }
    
    /**
     * Render position picker (graphical 3x3 grid)
     * @private
     */
    static _renderPositionPicker(editor, path, value, label, helper, disabled) {
        return html`
            <lcards-position-picker
                .value=${value}
                .label=${label}
                .helper=${helper}
                .disabled=${disabled || false}
                @value-changed=${(ev) => this._handleChange(ev, editor, path)}>
            </lcards-position-picker>
        `;
    }
    
    /**
     * Render tags selector (multi-select with chips and custom input)
     * @private
     */
    static _renderTagsSelector(editor, path, value, label, helper) {
        const systemsManager = window.lcards?.core?.systemsManager;
        const availableTags = systemsManager?.getAllTags() || [];
        
        // Convert to selector option format
        const options = availableTags.map(tag => ({
            value: tag,
            label: tag
        }));
        
        return html`
            <ha-selector
                .hass=${editor.hass}
                .selector=${{
                    select: {
                        mode: 'list',
                        multiple: true,
                        custom_value: true,
                        options: options
                    }
                }}
                .value=${value || []}
                .label=${label}
                .helper=${helper}
                @value-changed=${(ev) => this._handleChange(ev, editor, path)}>
            </ha-selector>
        `;
    }
}

// Export with both names for flexibility
export const FormFieldHelper = LCARdSFormFieldHelper;


/**
 * DEPRECATED: Custom element wrapper (backward compatibility only)
 * Delegates to FormFieldHelper for actual rendering
 * 
 * @deprecated Will be removed in future version - Use FormFieldHelper.renderField() instead
 */
export class LCARdSFormField extends LitElement {
    static properties = {
        editor: { type: Object },
        path: { type: String },
        label: { type: String },
        helper: { type: String },
        selectorOverride: { type: Object },
        disabled: { type: Boolean },
        required: { type: Boolean }
    };
    
    constructor() {
        super();
        this.editor = null;
        this.path = '';
        this.label = '';
        this.helper = '';
        this.selectorOverride = null;
        this.disabled = false;
        this.required = false;
    }
    
    render() {
        // Delegate to helper (no custom logic)
        return LCARdSFormFieldHelper.renderField(this.editor, this.path, {
            label: this.label,
            helper: this.helper,
            selectorOverride: this.selectorOverride,
            disabled: this.disabled,
            required: this.required
        });
    }
}

// Still register for backward compatibility, but warn
customElements.define('lcards-form-field', LCARdSFormField);

// Warn on first use (only once)
if (!window.__lcardsFormFieldDeprecationWarned) {
    window.__lcardsFormFieldDeprecationWarned = true;
    console.warn(
        '[LCARdS] <lcards-form-field> custom element is deprecated. ' +
        'Use FormFieldHelper.renderField() instead for better performance and reactivity. ' +
        'See doc/editor/migration-form-field.md'
    );
}
