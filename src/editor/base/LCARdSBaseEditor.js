/**
 * LCARdS Base Editor
 *
 * Base class for all LCARdS card editors. Handles tab management, config state,
 * YAML coordination, and Home Assistant integration.
 */

import { LitElement, html, css } from 'lit';
import { fireEvent } from 'custom-card-helpers';
import { editorStyles } from './editor-styles.js';
import { configToYaml, yamlToConfig, validateYaml } from '../utils/yaml-utils.js';
import { deepMerge } from '../../core/config-manager/merge-helpers.js';
import { lcardsLog } from '../../utils/lcards-logging.js';

export class LCARdSBaseEditor extends LitElement {

    static get properties() {
        return {
            hass: { type: Object },           // HA instance (provided by HA)
            config: { type: Object },         // Card config (provided by HA)
            cardType: { type: String },       // Card type for schema lookup
            _selectedTab: { type: Number, state: true },     // Current tab index
            _yamlValue: { type: String, state: true },       // YAML representation
            _validationErrors: { type: Array, state: true }, // Schema errors
            _singletons: { type: Object, state: true },      // window.lcards.core reference
            _schemaMissing: { type: Boolean, state: true }   // Schema missing flag
        };
    }

    constructor() {
        super();
        this.config = {};
        this.cardType = '';
        this._selectedTab = 0;
        this._yamlValue = '';
        this._validationErrors = [];
        this._singletons = null;
        this._isUpdatingYaml = false;
        this._configUpdateDebounce = null; // Debounce timer for config updates
        this._schemaMissing = false;
    }

    static get styles() {
        return [
            editorStyles,
            css`
                /* HA native tab group styling (Issue #82) */
                ha-tab-group {
                    display: block;
                    margin-bottom: 12px;
                }

                ha-tab-panel {
                    padding: 8px 0;
                    min-height: 400px;
                }

                /* Section styles */
                ha-expansion-panel {
                    margin-bottom: 12px;
                    border-radius: var(--ha-card-border-radius, 12px);
                }

                ha-expansion-panel[outlined] {
                    border: 2px solid var(--divider-color);
                }

                ha-expansion-panel[expanded] {
                    background-color: var(--secondary-background-color);
                }

                /* Form field spacing */
                .form-field {
                    margin-bottom: 12px;
                }

                /* Two-column grid */
                .form-row-group {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 12px;
                    margin-bottom: 12px;
                }

                @media (max-width: 768px) {
                    .form-row-group {
                        grid-template-columns: 1fr;
                    }
                }
            `
        ];
    }

    /**
     * Set initial configuration (called by HA)
     * @param {Object} config - Card configuration
     */
    setConfig(config) {
        if (!config) {
            throw new Error('Invalid configuration');
        }

        console.debug('[LCARdSBaseEditor] setConfig called with:', config);

        // Deep clone config using structuredClone with fallback to JSON
        // structuredClone is more robust but requires modern browsers
        this.config = (typeof globalThis.structuredClone === 'function')
            ? globalThis.structuredClone(config)
            : JSON.parse(JSON.stringify(config));

        // CRITICAL: Ensure 'type' property is always present (HA requires it)
        if (!this.config.type && this.cardType) {
            lcardsLog.warn('[LCARdSBaseEditor] Config is missing required "type" property! Auto-restoring...');
            this.config.type = `custom:lcards-${this.cardType}`;
            lcardsLog.warn(`[LCARdSBaseEditor] Auto-restored type to: ${this.config.type}`);
        }

        this._yamlValue = configToYaml(this.config);
        this._validateConfig();

        console.debug('[LCARdSBaseEditor] Config initialized:', { config: this.config, yaml: this._yamlValue });

        // Try to access singletons
        if (window.lcards?.core) {
            this._singletons = window.lcards.core;
        }

        this.requestUpdate('config');
    }

    /**
     * Handle config-changed events from child components
     * Intercepts partial config updates and merges them before sending to HA
     * @param {CustomEvent} ev - config-changed event from child component
     * @protected
     */
    _handleChildConfigChange(ev) {
        // Stop event from bubbling to HA until we've merged it properly
        ev.stopPropagation();

        // Extract partial config and merge into full config
        const partialConfig = ev.detail?.config;
        if (partialConfig) {
            this._updateConfig(partialConfig);
        }
    }

    /**
     * Render the editor
     */
    render() {
        const tabs = this._getTabDefinitions();

        return html`
            <div class="editor-container" @config-changed=${this._handleChildConfigChange}>
                ${this._schemaMissing ? html`
                    <ha-alert alert-type="error" title="Schema Not Registered">
                        <p>
                            The schema for card type <code>${this.cardType}</code> is not registered.
                        </p>
                        <p>
                            <strong>For maintainers:</strong> Register a schema for this card type using:
                            <code>core.configManager.registerCardSchema('${this.cardType}', schema)</code>
                        </p>
                        <p>
                            See the <a href="https://github.com/snootched/LCARdS#schema-registration" target="_blank">documentation</a>
                            for more information on schema registration.
                        </p>
                    </ha-alert>
                ` : ''}

                ${this._renderValidationErrors()}

                <!-- Using HA native tab components (Issue #82) -->
                <ha-tab-group @wa-tab-show=${this._handleTabChange}>
                    ${tabs.map((tab, index) => html`
                        <ha-tab-group-tab value="${index}" ?active=${this._selectedTab === index}>
                            ${tab.label}
                        </ha-tab-group-tab>
                    `)}

                    ${tabs.map((tab, index) => html`
                        <ha-tab-panel value="${index}" ?hidden=${this._selectedTab !== index}>
                            ${this._renderTabContent(tab)}
                        </ha-tab-panel>
                    `)}
                </ha-tab-group>
            </div>
        `;
    }

    /**
     * Render the content of the selected tab
     * @param {Object} tab - Tab definition
     * @returns {TemplateResult}
     * @private
     */
    _renderTabContent(tab) {
        if (!tab || !tab.content) {
            return html`<div>No content available</div>`;
        }

        return tab.content();
    }

    /**
     * Handle tab change (from HA native tab group)
     * @param {CustomEvent} event - wa-tab-show event from ha-tab-group
     * @private
     */
    _handleTabChange(event) {
        // CRITICAL: Use getAttribute('value') not .value property (Issue #82)
        const value = event.target.activeTab?.getAttribute('value');
        if (value !== null && value !== undefined) {
            this._selectedTab = parseInt(value, 10);
            this.requestUpdate();
        }
    }

    /**
     * Update configuration from visual or YAML editor
     * @param {Object} updates - Partial config updates (deep merged)
     * @param {string} source - 'visual' | 'yaml' (prevents circular updates)
     */
    _updateConfig(updates, source = 'visual') {
        // Guard against invalid updates
        if (!updates || typeof updates !== 'object') {
            lcardsLog.warn('[LCARdSBaseEditor] Invalid config updates:' + JSON.stringify(updates));
            return;
        }

        // Deep merge updates into config
        this.config = deepMerge(this.config, updates);

        // CRITICAL: Ensure 'type' property is always present (HA requires it)
        if (!this.config.type) {
            lcardsLog.warn('[LCARdSBaseEditor] Config is missing required "type" property after merge! Auto-restoring...');
            // Auto-restore the type based on cardType
            this.config.type = `custom:lcards-${this.cardType}`;
            lcardsLog.warn(`[LCARdSBaseEditor] Auto-restored type to: ${this.config.type}`);
        }

        // Validate against schema
        this._validateConfig();

        // Sync YAML editor if update came from visual tab
        if (source === 'visual' && !this._isUpdatingYaml) {
            this._isUpdatingYaml = true;
            this._yamlValue = configToYaml(this.config);
            requestAnimationFrame(() => {
                this._isUpdatingYaml = false;
            });
        }

        // Notify Home Assistant with debounce to prevent rapid-fire updates
        // This prevents issues with HA's internal processing of config changes
        if (this._configUpdateDebounce) {
            clearTimeout(this._configUpdateDebounce);
        }

        this._configUpdateDebounce = setTimeout(() => {
            fireEvent(this, 'config-changed', { config: this.config });
            this._configUpdateDebounce = null;
        }, 50); // 50ms debounce

        this.requestUpdate();
    }

    /**
     * Handle YAML editor changes
     * @param {CustomEvent} ev - value-changed event from Monaco editor
     */
    _handleYamlChange(ev) {
        if (this._isUpdatingYaml) {
            return;
        }

        this._yamlValue = ev.detail.value;

        // Validate YAML syntax first
        const yamlValidation = validateYaml(this._yamlValue);
        if (!yamlValidation.valid) {
            this._validationErrors = [{
                message: `YAML Syntax Error: ${yamlValidation.error}`,
                line: yamlValidation.lineNumber
            }];
            this.requestUpdate();
            return;
        }

        try {
            // Parse YAML to config object
            const newConfig = yamlToConfig(this._yamlValue);

            // Validate against schema using singleton
            const validationResult = this._validateConfigWithSingleton(newConfig);
            this._validationErrors = validationResult.errors.map(err => ({
                path: err.field || '',
                message: err.message
            }));

            if (validationResult.valid) {
                // Valid - update config (but don't re-sync YAML to prevent loops)
                this._isUpdatingYaml = true;
                this.config = newConfig;
                fireEvent(this, 'config-changed', { config: this.config });
                requestAnimationFrame(() => {
                    this._isUpdatingYaml = false;
                });
            }

            this.requestUpdate();
        } catch (err) {
            // YAML parse error (shouldn't happen as we validated above, but just in case)
            this._validationErrors = [{ message: `Parse Error: ${err.message}` }];
            this.requestUpdate();
        }
    }

    /**
     * Validate configuration using singleton CoreValidationService
     * @param {Object} config - Configuration to validate
     * @returns {Object} Validation result with errors array
     * @private
     */
    _validateConfigWithSingleton(config) {
        const validationService = window.lcards?.core?.validationService;
        const schema = this._getSchema();

        if (!validationService || !schema) {
            // Fallback: no validation if singleton not available
            return { valid: true, errors: [], warnings: [] };
        }

        // Use singleton validation service
        return validationService.validate(config, schema, {
            cardType: this.cardType,
            source: 'editor'
        });
    }

    /**
     * Validate configuration against schema
     * @private
     */
    _validateConfig() {
        const validationResult = this._validateConfigWithSingleton(this.config);

        // Map errors with severity
        const errors = (validationResult.errors || []).map(err => ({
            path: err.field || '',
            message: err.message,
            severity: 'error'
        }));

        // Map warnings with severity
        const warnings = (validationResult.warnings || []).map(warn => ({
            path: warn.field || '',
            message: warn.message,
            severity: 'warning'
        }));

        // Combine errors and warnings
        this._validationErrors = [...errors, ...warnings];
    }

    /**
     * Get JSON schema for this card type from CoreConfigManager
     * @returns {Object} JSON Schema object from registered card schema
     */
    _getSchema() {
        const configManager = window.lcards?.core?.configManager;

        if (!configManager) {
            console.warn('[LCARdSBaseEditor] CoreConfigManager not available');
            this._schemaMissing = true;
            return {}; // Return empty schema as fallback
        }

        const schema = configManager.getCardSchema(this.cardType);

        if (!schema) {
            console.warn(`[LCARdSBaseEditor] No schema registered for card type: ${this.cardType}`);
            this._schemaMissing = true;
            return {};
        }

        this._schemaMissing = false;
        return schema;
    }

    /**
     * Get config value by dot-notation path
     * @param {string} path - Path like 'style.color.border.default'
     * @returns {*} Value at path or undefined
     * @public
     */
    _getConfigValue(path) {
        if (!path) return undefined;

        const keys = path.split('.');
        let value = this.config;

        for (const key of keys) {
            if (value === null || value === undefined) {
                return undefined;
            }
            value = value[key];
        }

        return value;
    }

    /**
     * Set config value by dot-notation path
     * @param {string} path - Path like 'style.color.border.default'
     * @param {*} value - Value to set
     * @public
     */
    _setConfigValue(path, value) {
        if (!path) {
            console.warn('[LCARdSBaseEditor] Cannot set config value with empty path');
            return;
        }

        const keys = path.split('.');
        const updates = {};
        let current = updates;

        // Build nested object structure
        for (let i = 0; i < keys.length - 1; i++) {
            current[keys[i]] = {};
            current = current[keys[i]];
        }

        // Set final value
        current[keys[keys.length - 1]] = value;

        // Merge and update
        this._updateConfig(updates);
    }

    /**
     * Get schema for specific path
     * @param {string} path - Dot-notation path
     * @returns {Object|null} Schema object for property
     * @public
     */
    _getSchemaForPath(path) {
        if (!path) return null;

        const schema = this._getSchema();
        if (!schema || !schema.properties) return null;

        const keys = path.split('.');
        let currentSchema = schema;

        for (const key of keys) {
            // Direct properties
            if (currentSchema.properties && currentSchema.properties[key]) {
                currentSchema = currentSchema.properties[key];
                continue;
            }

            // Handle patternProperties (e.g., text.name, text.label, text.*)
            if (currentSchema.patternProperties) {
                let found = false;
                let matchCount = 0;
                let matchedPattern = null;

                for (const [pattern, patternSchema] of Object.entries(currentSchema.patternProperties)) {
                    try {
                        const regex = new RegExp(pattern);
                        if (regex.test(key)) {
                            matchCount++;
                            if (!found) {
                                currentSchema = patternSchema;
                                matchedPattern = pattern;
                                found = true;
                            }
                        }
                    } catch (err) {
                        console.warn('[LCARdSBaseEditor] Invalid regex in patternProperties:', pattern, err);
                    }
                }

                // Warn if multiple patterns matched
                if (matchCount > 1) {
                    lcardsLog.warn(`[BaseEditor] Multiple patternProperties matched key "${key}"; using first match.`);
                }

                if (found) continue;
            }

            // Handle additionalProperties (e.g., text.test_field1, text.custom_name)
            if (currentSchema.additionalProperties) {
                if (typeof currentSchema.additionalProperties === 'object') {
                    currentSchema = currentSchema.additionalProperties;
                    continue;
                } else if (currentSchema.additionalProperties === true) {
                    // Return a generic schema object for any type
                    return {
                        type: ['string', 'number', 'boolean', 'object', 'array'],
                        description: 'Additional property (no specific schema defined)'
                    };
                }
            }

            // Handle oneOf schemas where the property may be defined inside an object option
            if (Array.isArray(currentSchema.oneOf)) {
                let found = false;
                for (const option of currentSchema.oneOf) {
                    if (option && option.properties && option.properties[key]) {
                        currentSchema = option.properties[key];
                        found = true;
                        break;
                    }
                }
                if (found) continue;
            }

            // If we didn't find the property, return null
            return null;
        }

        return currentSchema;
    }

    /**
     * Evaluate condition for visibility/disabled states
     * Conditions can reference:
     * - config (current config)
     * - hass (Home Assistant instance)
     *
     * @param {string} condition - JavaScript expression to evaluate
     * @returns {boolean} Evaluation result
     * @protected
     */
    _evaluateCondition(condition) {
        if (!condition) return true;

        try {
            const func = new Function('config', 'hass', `return ${condition};`);
            return func(this.config, this.hass);
        } catch (err) {
            console.warn('[LCARdSBaseEditor] Condition evaluation failed:', condition, err);
            return true; // Default to visible on error
        }
    }

    /**
     * Render validation errors and warnings grouped by severity
     * @returns {TemplateResult}
     * @protected
     */
    _renderValidationErrors() {
        if (!this._validationErrors || this._validationErrors.length === 0) {
            return html``;
        }

        // Group by severity
        const errors = this._validationErrors.filter(err => err.severity === 'error');
        const warnings = this._validationErrors.filter(err => err.severity === 'warning');

        return html`
            ${errors.length > 0 ? html`
                <ha-alert alert-type="error" title="Validation Errors (${errors.length})">
                    <ul>
                        ${errors.map(err => html`
                            <li>${err.path ? `${err.path}: ` : ''}${err.message}</li>
                        `)}
                    </ul>
                </ha-alert>
            ` : ''}

            ${warnings.length > 0 ? html`
                <ha-alert alert-type="warning" title="Validation Warnings (${warnings.length})">
                    <ul>
                        ${warnings.map(warn => html`
                            <li>${warn.path ? `${warn.path}: ` : ''}${warn.message}</li>
                        `)}
                    </ul>
                </ha-alert>
            ` : ''}
        `;
    }

    /**
     * Render editor UI from declarative configuration
     *
     * Supports nested structure:
     * - Sections (collapsible panels with headers)
     * - Grids (responsive 2-column layouts)
     * - Fields (automatically rendered based on schema)
     * - Custom components (direct render functions)
     *
     * Example config:
     * {
     *   type: 'section',
     *   header: 'Basic Settings',
     *   expanded: true,
     *   children: [
     *     { type: 'field', path: 'entity' },
     *     { type: 'grid', children: [
     *       { type: 'field', path: 'style.width' },
     *       { type: 'field', path: 'style.height' }
     *     ]}
     *   ]
     * }
     *
     * @param {Object|Array} config - Declarative UI configuration
     * @returns {TemplateResult}
     * @protected
     */
    _renderFromConfig(config) {
        if (!config) return html``;

        // Handle arrays (multiple items)
        if (Array.isArray(config)) {
            return html`${config.map(item => this._renderFromConfig(item))}`;
        }

        // Evaluate visibility condition
        if (config.condition && !this._evaluateCondition(config.condition)) {
            return html``;
        }

        // Render based on type
        switch (config.type) {
            case 'section':
                return this._renderConfigSection(config);

            case 'grid':
                return this._renderConfigGrid(config);

            case 'field':
                return this._renderConfigField(config);

            case 'custom':
                return this._renderConfigCustom(config);

            default:
                console.warn('[LCARdSBaseEditor] Unknown config type:', config.type);
                return html``;
        }
    }

    /**
     * Render a section (collapsible panel)
     * @param {Object} config - Section configuration
     * @returns {TemplateResult}
     * @private
     */
    _renderConfigSection(config) {
        const {
            header = '',
            description = '',
            icon = '',
            expanded = false,
            outlined = true,
            headerLevel = '4',
            children = []
        } = config;

        return html`
            <lcards-form-section
                header="${header}"
                description="${description}"
                icon="${icon}"
                ?expanded=${expanded}
                ?outlined=${outlined}
                headerLevel="${headerLevel}">
                ${this._renderFromConfig(children)}
            </lcards-form-section>
        `;
    }

    /**
     * Render a grid layout (2-column responsive)
     * @param {Object} config - Grid configuration
     * @returns {TemplateResult}
     * @private
     */
    _renderConfigGrid(config) {
        const { children = [] } = config;

        return html`
            <lcards-grid-layout>
                ${this._renderFromConfig(children)}
            </lcards-grid-layout>
        `;
    }

    /**
     * Render a form field (automatically configured from schema)
     * @param {Object} config - Field configuration
     * @returns {TemplateResult}
     * @private
     */
    _renderConfigField(config) {
        const {
            path,
            label = '',
            helper = ''
        } = config;

        if (!path) {
            console.warn('[LCARdSBaseEditor] Field config missing required "path":', config);
            return html``;
        }

        return html`
            <lcards-form-field
                .editor=${this}
                .config=${this.config}
                path="${path}"
                label="${label}"
                helper="${helper}">
            </lcards-form-field>
        `;
    }

    /**
     * Render custom content (direct render function)
     * @param {Object} config - Custom configuration
     * @returns {TemplateResult}
     * @private
     */
    _renderConfigCustom(config) {
        const { render } = config;

        if (typeof render !== 'function') {
            console.warn('[LCARdSBaseEditor] Custom config missing "render" function:', config);
            return html``;
        }

        // Call render function with editor context
        return render.call(this);
    }

    /**
     * Helper: Render text padding configuration (2x2 grid)
     * @param {string} basePath - Path to padding config (e.g., 'text.name.padding')
     * @returns {TemplateResult}
     * @protected
     */
    _renderTextPadding(basePath) {
        // Check if this is a oneOf (simple number vs object)
        const schema = this._getSchemaForPath(basePath);
        const isOneOf = schema && Array.isArray(schema.oneOf);

        if (isOneOf) {
            // For oneOf, let form-field handle it with toggle
            return html`
                <lcards-form-field
                    .editor=${this}
                    .config=${this.config}
                    path="${basePath}"
                    label="Padding">
                </lcards-form-field>
            `;
        }

        // Render as object editor
        return html`
            <lcards-object-editor
                .editor=${this}
                .config=${this.config}
                path="${basePath}"
                .properties=${['top', 'right', 'bottom', 'left']}
                controlType="number"
                .controlConfig=${{ min: 0, max: 100, mode: 'box' }}
                columns="2">
            </lcards-object-editor>
        `;
    }

    /**
     * Helper: Render font configuration (size, weight, family)
     * @param {string} basePath - Path to text config (e.g., 'text.name')
     * @returns {TemplateResult}
     * @protected
     */
    _renderFontConfig(basePath) {
        return html`
            <lcards-form-section
                header="Font Settings"
                description="Configure font size, weight, and family"
                icon="mdi:format-text"
                ?expanded=${false}
                ?outlined=${true}
                headerLevel="5">

                <lcards-grid-layout>
                    <lcards-form-field
                        .editor=${this}
                        .config=${this.config}
                        path="${basePath}.font_size"
                        label="Font Size">
                    </lcards-form-field>

                    <lcards-form-field
                        .editor=${this}
                        .config=${this.config}
                        path="${basePath}.font_weight"
                        label="Font Weight">
                    </lcards-form-field>

                    <lcards-form-field
                        .editor=${this}
                        .config=${this.config}
                        path="${basePath}.font_family"
                        label="Font Family">
                    </lcards-form-field>
                </lcards-grid-layout>
            </lcards-form-section>
        `;
    }

    /**
     * Helper: Render text alignment configuration (2x2 grid)
     * @param {string} basePath - Path to text config (e.g., 'text.name')
     * @returns {TemplateResult}
     * @protected
     */
    _renderTextAlignment(basePath) {
        return html`
            <lcards-form-section
                header="Text Alignment"
                description="Configure text alignment and positioning"
                icon="mdi:format-align-center"
                ?expanded=${false}
                ?outlined=${true}
                headerLevel="5">

                <lcards-grid-layout>
                    <lcards-form-field
                        .editor=${this}
                        .config=${this.config}
                        path="${basePath}.position"
                        label="Position">
                    </lcards-form-field>

                    <lcards-form-field
                        .editor=${this}
                        .config=${this.config}
                        path="${basePath}.rotation"
                        label="Rotation">
                    </lcards-form-field>

                    <lcards-form-field
                        .editor=${this}
                        .config=${this.config}
                        path="${basePath}.justify"
                        label="Horizontal Align">
                    </lcards-form-field>

                    <lcards-form-field
                        .editor=${this}
                        .config=${this.config}
                        path="${basePath}.align"
                        label="Vertical Align">
                    </lcards-form-field>
                </lcards-grid-layout>
            </lcards-form-section>
        `;
    }

    /**
     * Helper: Render text colors section (state-based)
     * @param {string} basePath - Path to color config (e.g., 'text.name.color')
     * @param {Array} states - Array of state names
     * @returns {TemplateResult}
     * @protected
     */
    _renderTextColors(basePath, states = ['default', 'active', 'inactive', 'unavailable']) {
        return html`
            <lcards-color-section
                .editor=${this}
                .config=${this.config}
                basePath="${basePath}"
                header="Text Colors"
                description="State-based text colors"
                .states=${states}
                ?expanded=${false}>
            </lcards-color-section>
        `;
    }

    /**
     * Helper: Render complete text field section
     * @param {string} fieldName - Field name (e.g., 'name', 'label', 'state')
     * @param {boolean} expanded - Initial expanded state
     * @returns {TemplateResult}
     * @protected
     */
    _renderTextFieldSection(fieldName, expanded = false) {
        const basePath = `text.${fieldName}`;
        const fieldLabel = fieldName.charAt(0).toUpperCase() + fieldName.slice(1);

        return html`
            <lcards-form-section
                header="${fieldLabel} Text"
                description="Configure ${fieldLabel.toLowerCase()} text content and styling"
                icon="mdi:text-box"
                ?expanded=${expanded}
                ?outlined=${true}
                headerLevel="4">

                <!-- Content -->
                <lcards-form-field
                    .editor=${this}
                    .config=${this.config}
                    path="${basePath}.content"
                    label="Content"
                    helper="Text content or template (e.g., {{entity.state}})">
                </lcards-form-field>

                <!-- Show Toggle -->
                <lcards-form-field
                    .editor=${this}
                    .config=${this.config}
                    path="${basePath}.show"
                    label="Show ${fieldLabel}">
                </lcards-form-field>

                <!-- Padding -->
                <lcards-form-section
                    header="Padding"
                    description="Text padding (top, right, bottom, left)"
                    ?expanded=${false}
                    ?outlined=${false}
                    headerLevel="5">
                    ${this._renderTextPadding(`${basePath}.padding`)}
                </lcards-form-section>

                <!-- Font Settings -->
                ${this._renderFontConfig(basePath)}

                <!-- Alignment -->
                ${this._renderTextAlignment(basePath)}

                <!-- Colors -->
                ${this._renderTextColors(`${basePath}.color`)}
            </lcards-form-section>
        `;
    }

    /**
     * Clean config when switching modes (preset, component, svg)
     * Creates a new config with only the common properties and mode-specific properties
     *
     * @param {Object} baseConfig - Current configuration
     * @param {string} mode - Target mode ('preset', 'component', 'svg')
     * @param {Array<string>} validKeys - Keys to keep in the cleaned config (in addition to common keys)
     * @returns {Object} Cleaned configuration
     * @protected
     */
    _cleanConfigForMode(baseConfig, mode, validKeys = []) {
        // Common properties to always preserve
        const commonKeys = ['type', 'entity', 'id', 'tap_action', 'hold_action', 'double_tap_action', 'style', 'css_class'];

        // Start with common properties
        const newConfig = {};
        commonKeys.forEach(key => {
            if (baseConfig[key] !== undefined) {
                newConfig[key] = baseConfig[key];
            }
        });

        // Add mode-specific valid keys
        validKeys.forEach(key => {
            if (baseConfig[key] !== undefined) {
                newConfig[key] = baseConfig[key];
            }
        });

        return newConfig;
    }

    /**
     * Helper: Render icon section
     * @returns {TemplateResult}
     * @protected
     */
    _renderIconSection() {
        return html`
            <lcards-form-section
                header="Icon Configuration"
                description="Configure icon display and styling"
                icon="mdi:image"
                ?expanded=${false}
                ?outlined=${true}
                headerLevel="4">

                <!-- Icon Picker -->
                <lcards-form-field
                    .editor=${this}
                    .config=${this.config}
                    path="icon"
                    label="Icon">
                </lcards-form-field>

                <!-- Show Toggle -->
                <lcards-form-field
                    .editor=${this}
                    .config=${this.config}
                    path="show_icon"
                    label="Show Icon">
                </lcards-form-field>

                <!-- Icon Area -->
                <lcards-form-field
                    .editor=${this}
                    .config=${this.config}
                    path="icon_area"
                    label="Icon Area"
                    helper="Reserved space for icon (left, right, top, bottom)">
                </lcards-form-field>

                <!-- Icon Size -->
                <lcards-grid-layout>
                    <lcards-form-field
                        .editor=${this}
                        .config=${this.config}
                        path="icon_style.size"
                        label="Icon Size">
                    </lcards-form-field>

                    <lcards-form-field
                        .editor=${this}
                        .config=${this.config}
                        path="icon_style.padding"
                        label="Icon Padding">
                    </lcards-form-field>
                </lcards-grid-layout>

                <!-- Icon Colors -->
                <lcards-color-section
                    .editor=${this}
                    .config=${this.config}
                    basePath="icon_style.color"
                    header="Icon Colors"
                    description="State-based icon colors"
                    .states=${['default', 'active', 'inactive', 'unavailable']}
                    ?expanded=${false}>
                </lcards-color-section>

                <!-- Icon Area Background Colors -->
                <lcards-color-section
                    .editor=${this}
                    .config=${this.config}
                    basePath="icon_area_background"
                    header="Icon Area Background"
                    description="State-based icon area background colors"
                    .states=${['default', 'active', 'inactive', 'unavailable']}
                    ?expanded=${false}>
                </lcards-color-section>
            </lcards-form-section>
        `;
    }

    /**
     * Standard utility tab renderers
     * Override in child classes if customization needed
     * @protected
     */

    /**
     * Render Data Sources tab
     * @returns {TemplateResult}
     * @protected
     */
    _renderDataSourcesTab() {
        return html`
            <lcards-datasource-editor-tab
                .editor=${this}
                .config=${this.config}
                .hass=${this.hass}>
            </lcards-datasource-editor-tab>
        `;
    }

    /**
     * Render Rules dashboard tab
     * @returns {TemplateResult}
     * @protected
     */
    _renderRulesTab() {
        return html`
            <lcards-rules-dashboard
                .editor=${this}
                .cardId=${this.config.id || this.config.cardId || ''}
                .hass=${this.hass}>
            </lcards-rules-dashboard>
        `;
    }

    /**
     * Render Templates evaluation tab
     * @returns {TemplateResult}
     * @protected
     */
    _renderTemplatesTab() {
        return html`
            <lcards-template-evaluation-tab
                .editor=${this}
                .config=${this.config}
                .hass=${this.hass}>
            </lcards-template-evaluation-tab>
        `;
    }

    /**
     * Render Theme Token Browser tab
     * @returns {TemplateResult}
     * @protected
     */
    _renderThemeTokensTab() {
        return html`
            <lcards-theme-token-browser-tab
                .editor=${this}
                .config=${this.config}
                .hass=${this.hass}>
            </lcards-theme-token-browser-tab>
        `;
    }

    /**
     * Render Provenance inspector tab
     * @returns {TemplateResult}
     * @protected
     */
    _renderProvenanceTab() {
        return html`
            <lcards-provenance-tab
                .editor=${this}
                .config=${this.config}
                .hass=${this.hass}>
            </lcards-provenance-tab>
        `;
    }

    /**
     * Get standard utility tabs (Data Sources, Rules, Templates, Theme Browser, Provenance, YAML)
     * Child editors should call this and append to their card-specific tabs
     * 
     * @example
     * _getTabDefinitions() {
     *     const cardTabs = [
     *         { label: 'Config', content: () => this._renderConfigTab() },
     *         { label: 'Style', content: () => this._renderStyleTab() }
     *     ];
     *     return [...cardTabs, ...this._getUtilityTabs()];
     * }
     * 
     * @returns {Array<{label: string, content: Function}>}
     * @protected
     */
    _getUtilityTabs() {
        return [
            { label: 'Advanced', content: () => this._renderFromConfig(this._getAdvancedTabConfig()) },
            { label: 'Data Sources', content: () => this._renderDataSourcesTab() },
            { label: 'Rules', content: () => this._renderRulesTab() },
            { label: 'Templates', content: () => this._renderTemplatesTab() },
            { label: 'Theme Browser', content: () => this._renderThemeTokensTab() },
            { label: 'Provenance', content: () => this._renderProvenanceTab() },
            { label: 'YAML', content: () => this._renderYamlTab() }
        ];
    }

    /**
     * Get Advanced tab configuration (override in child classes)
     * Default includes CSS class configuration
     * @returns {Array} Advanced tab config
     * @protected
     */
    _getAdvancedTabConfig() {
        return [
            {
                type: 'section',
                header: 'Advanced Options',
                description: 'Additional configuration options',
                icon: 'mdi:cog',
                expanded: true,
                outlined: true,
                children: [
                    { type: 'field', path: 'css_class', label: 'Custom CSS Class', helper: 'Add custom CSS class for styling' }
                ]
            }
        ];
    }

    /**
     * Render YAML editor tab
     * Advanced YAML editor with schema-based validation and autocomplete.
     * Changes made here will be reflected in the visual tabs.
     * @returns {TemplateResult}
     * @protected
     */
    _renderYamlTab() {
        return html`
            <div class="section">
                <div class="section-description">
                    Advanced YAML editor with schema-based autocomplete and inline validation.
                    Changes made here will be reflected in the visual tabs.
                </div>

                <lcards-yaml-editor
                    .value=${this._yamlValue}
                    .schema=${this._getSchema()}
                    .hass=${this.hass}
                    @value-changed=${this._handleYamlChange}>
                </lcards-yaml-editor>
            </div>
        `;
    }
}
