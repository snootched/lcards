/**
 * @fileoverview LCARdS Base Editor
 *
 * Base class for all LCARdS card editors. Handles tab management, config state,
 * YAML coordination, and Home Assistant integration.
 */

import { LitElement, html, css } from 'lit';
import { fireEvent } from 'custom-card-helpers';
import { editorStyles } from './editor-styles.js';
import { messageStyles } from './surface-styles.js';
import { renderInfoGuide } from '../components/shared/info-guide.js';
import { configToYaml, yamlToConfig, validateYaml } from '../utils/yaml-utils.js';
import { deepMerge } from '../../core/config-manager/merge-helpers.js';
import { lcardsLog } from '../../utils/lcards-logging.js';
import { getAttributeOptions } from '../../utils/attribute-options.js';
import { LCARdSFormFieldHelper as FormField } from '../components/shared/lcards-form-field.js';
import '../components/sound/lcards-card-sound-tab.js';
import '../components/lcards-zone-list-editor.js';
import '../components/shared/lcards-form-section.js';
import '../components/theme-browser/lcards-card-theme-tab.js';
import { docsUrl, DOCS } from '../../utils/docs-url.js';
import { editorTabDocs } from '../utils/yaml-docs-links.js';

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
            _schemaMissing: { type: Boolean, state: true },  // Schema missing flag
            _developerSubTab: { type: Number, state: true }  // Developer sub-tab index
        };
    }

    constructor() {
        super();
        /** @type {any} */
        this.hass = undefined;
        /** @type {any} */
        this.lovelace = undefined;
        /** @type {any} */
        this.config = {};
        this.cardType = '';
        this._selectedTab = 0;
        this._yamlValue = '';
        this._validationErrors = [];
        this._singletons = null;
        this._isUpdatingYaml = false;
        this._configUpdateDebounce = null; // Debounce timer for config updates
        this._schemaMissing = false;
        this._developerSubTab = 0;
    }

    static get styles() {
        return [editorStyles, messageStyles, css`
            .main-engineering-hint {
                margin: 0 0 var(--ha-space-2);
            }
            ha-tab-group-tab ha-icon {
                --mdc-icon-size: 18px;
                margin-right: var(--ha-space-2);
            }
            /* "Docs" link at the top of each tab: opens the page in a new tab */
            .tab-docs {
                display: flex;
                justify-content: flex-end;
                margin: var(--ha-space-3) 0 var(--ha-space-3);
            }
            .tab-docs a {
                display: inline-flex;
                align-items: center;
                gap: var(--ha-space-1);
                padding: var(--ha-space-1) var(--ha-space-3);
                background: color-mix(in srgb, var(--primary-text-color) 10%, transparent);
                border-radius: var(--ha-border-radius-pill);
                color: var(--primary-text-color);
                font-size: var(--ha-font-size-m, 14px);
                font-weight: var(--ha-font-weight-medium, 500);
                line-height: 1.4;
                text-decoration: none;
            }
            .tab-docs a:hover {
                background: color-mix(in srgb, var(--primary-text-color) 20%, transparent);
            }
            .tab-docs ha-icon {
                --mdc-icon-size: 18px;
            }
        `];
    }

    /**
     * Set initial configuration (called by HA)
     * @param {Object} config - Card configuration
     */
    setConfig(config) {
        if (!config) {
            throw new Error('Invalid configuration');
        }

        lcardsLog.debug('[LCARdSBaseEditor] setConfig called with:', config);

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

        lcardsLog.debug('[LCARdSBaseEditor] Config initialized:', { config: this.config, yaml: this._yamlValue });

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
     * Override in subclasses to return tab definitions array.
     * @protected
     * @returns {Array}
     */
    _getTabDefinitions() {
        return [];
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
                            See <a href=${docsUrl(DOCS.buildingAnEditor)} target="_blank" rel="noopener">Building an Editor</a>
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
                        <div class="tab-panel" ?hidden=${this._selectedTab !== index}>
                            ${this._renderTabContent(tab)}
                        </div>
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

        // A tab may name its own page (`docs:`); otherwise the card's tab map.
        const docs = tab.docs ?? editorTabDocs(this.cardType, tab.label);
        return html`
            ${docs ? html`
                <div class="tab-docs">
                    <a href=${docsUrl(docs)} target="_blank" rel="noopener noreferrer">
                        Docs<ha-icon icon="mdi:open-in-new"></ha-icon>
                    </a>
                </div>
            ` : ''}
            ${tab.content()}
        `;
    }

    /**
     * Handle tab change (from HA native tab group)
     * @param {CustomEvent} event - wa-tab-show event from ha-tab-group
     * @private
     */
    _handleTabChange(event) {
        // CRITICAL: Use getAttribute('value') not .value property (Issue #82)
        const value = (/** @type {any} */ (event.target)).activeTab?.getAttribute('value');
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

        // Deep merge updates into config (deepMerge already returns new object)
        const oldConfig = this.config;
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

        // Trigger Lit reactivity for config property
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
     * @protected
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
     * Whether the current card's entity is a light entity.
     * Used to conditionally show the "Match Light Colour" option in color pickers.
     * @returns {boolean}
     * @protected
     */
    get _isLightEntity() {
        return typeof this.config?.entity === 'string' && this.config.entity.startsWith('light.');
    }

    /**
     * Get JSON schema for this card type from CoreConfigManager
     * @returns {Object} JSON Schema object from registered card schema
     */
    _getSchema() {
        const configManager = window.lcards?.core?.configManager;

        if (!configManager) {
            lcardsLog.warn('⚠️ [LCARdSBaseEditor] CoreConfigManager not available');
            this._schemaMissing = true;
            return {}; // Return empty schema as fallback
        }

        const schema = configManager.getCardSchema(this.cardType);

        if (!schema) {
            lcardsLog.warn(`⚠️ [LCARdSBaseEditor] No schema registered for card type: ${this.cardType}`);
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
            lcardsLog.warn('⚠️ [LCARdSBaseEditor] Cannot set config value with empty path');
            return;
        }

        const keys = path.split('.');

        // For array paths (e.g., style.ranges.0.min), we need to clone the actual array
        // and update the specific index, not create nested objects
        const hasArrayIndex = keys.some(key => !isNaN(Number(key)));

        if (hasArrayIndex) {
            // Deep clone the current config to avoid mutations
            const newConfig = JSON.parse(JSON.stringify(this.config || {}));
            let current = newConfig;

            // Navigate to the parent of the final key, creating structure as needed
            for (let i = 0; i < keys.length - 1; i++) {
                const key = keys[i];
                const nextKey = keys[i + 1];
                const isNextNumeric = !isNaN(Number(nextKey));

                // If next key is numeric, ensure current[key] is an array
                if (isNextNumeric) {
                    if (!Array.isArray(current[key])) {
                        current[key] = [];
                    }
                } else {
                    // Otherwise ensure it's an object
                    if (!current[key] || typeof current[key] !== 'object') {
                        current[key] = {};
                    }
                }

                current = current[key];
            }

            // Set the final value
            const finalKey = keys[keys.length - 1];
            current[finalKey] = value;

            // Fire config change event
            const oldConfig = this.config;
            this.config = newConfig;
            fireEvent(this, 'config-changed', { config: this.config });
            this.requestUpdate('config', oldConfig);
            return;
        }

        // Original logic for non-array paths
        const updates = {};
        let current = updates;

        // Build nested object structure
        for (let i = 0; i < keys.length - 1; i++) {
            current[keys[i]] = {};
            current = current[keys[i]];
        }

        // Set final value
        current[keys[keys.length - 1]] = value;

        // Check if value is empty/null/undefined - if so, remove it and clean up empty parents
        if (value === undefined || value === null || value === '') {
            this._removeConfigPath(path);
        } else {
            // Merge and update normally
            this._updateConfig(updates);
        }
    }

    /**
     * Remove a config path and clean up empty parent objects
     * @param {string} path - Path like 'style.gauge.indicator.offset.x'
     * @protected
     */
    _removeConfigPath(path) {
        if (!path) return;

        const keys = path.split('.');
        const newConfig = JSON.parse(JSON.stringify(this.config || {}));

        // Navigate to parent and delete the key
        let current = newConfig;
        for (let i = 0; i < keys.length - 1; i++) {
            if (!current[keys[i]]) return; // Path doesn't exist
            current = current[keys[i]];
        }

        // Delete the final key
        delete current[keys[keys.length - 1]];

        // Clean up empty parent objects recursively
        for (let i = keys.length - 2; i >= 0; i--) {
            const parentPath = keys.slice(0, i + 1);
            let parent = newConfig;

            // Navigate to the parent object
            for (let j = 0; j < parentPath.length - 1; j++) {
                parent = parent[parentPath[j]];
            }

            const currentKey = parentPath[parentPath.length - 1];
            const currentObj = parent[currentKey];

            // If object is empty, delete it
            if (currentObj && typeof currentObj === 'object' && !Array.isArray(currentObj)) {
                if (Object.keys(currentObj).length === 0) {
                    delete parent[currentKey];
                } else {
                    // Stop cleanup if object has other keys
                    break;
                }
            } else {
                // Stop if it's not an object
                break;
            }
        }

        // Fire config change event
        const oldConfig = this.config;
        this.config = newConfig;
        fireEvent(this, 'config-changed', { config: this.config });
        this.requestUpdate('config', oldConfig);
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
            // Handle array indices (e.g., ranges.0.min)
            // If the key is numeric and currentSchema is an array type, use items schema
            if (!isNaN(Number(key)) && currentSchema.type === 'array' && currentSchema.items) {
                currentSchema = currentSchema.items;
                continue;
            }

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
                        lcardsLog.warn('⚠️ [LCARdSBaseEditor] Invalid regex in patternProperties:', pattern, err);
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
            lcardsLog.warn('⚠️ [LCARdSBaseEditor] Condition evaluation failed:', condition, err);
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
                lcardsLog.warn('⚠️ [LCARdSBaseEditor] Unknown config type:', config.type);
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
            lcardsLog.warn('⚠️ [LCARdSBaseEditor] Field config missing required "path":', config);
            return html``;
        }

        return FormField.renderField(this, path, {
            label: label,
            helper: helper
        });
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
            lcardsLog.warn('⚠️ [LCARdSBaseEditor] Custom config missing "render" function:', config);
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
            return FormField.renderField(this, basePath, {
                label: 'Padding'
            });
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
                    ${FormField.renderField(this, `${basePath}.font_size`, {
                        label: 'Font Size'
                    })}

                    ${FormField.renderField(this, `${basePath}.font_weight`, {
                        label: 'Font Weight'
                    })}

                    ${FormField.renderField(this, `${basePath}.font_family`, {
                        label: 'Font Family'
                    })}
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
                    ${FormField.renderField(this, `${basePath}.position`, {
                        label: 'Position'
                    })}

                    ${FormField.renderField(this, `${basePath}.rotation`, {
                        label: 'Rotation'
                    })}

                    ${FormField.renderField(this, `${basePath}.justify`, {
                        label: 'Horizontal Align'
                    })}

                    ${FormField.renderField(this, `${basePath}.align`, {
                        label: 'Vertical Align'
                    })}
                </lcards-grid-layout>
            </lcards-form-section>
        `;
    }

    /**
     * Build ha-selector option list for the ranges_attribute dropdown.
     * Injects the virtual "brightness_pct" option right after "brightness" (when present)
     * so users get a clearly-labelled 0–100% computed value instead of the raw 0–255.
     *
     * @param {string} [entityId] - Entity to list attributes for. Defaults to the card's own entity.
     * @returns {Array<{value:string, label:string}>}
     * @protected
     */
    _getRangesAttributeOptions(entityId = this.config?.entity) {
        return getAttributeOptions(this.hass, entityId);
    }

    /**
     * Render the ranges_attribute dropdown selector.
     *
     * This attribute feeds the numeric value for ALL above:/below:/between: range
     * conditions across the card — icons, colors, borders, backgrounds, text, and
     * the state-driven ranges preset switcher.  Belongs next to the entity, not
     * inside any specific feature section.
     *
     * Automatically promotes raw "brightness" selection to "brightness_pct" so
     * range thresholds use the human-readable 0–100 scale.
     *
     * @returns {TemplateResult}
     * @protected
     */
    _renderRangesAttributeSelector() {
        const entityId = this.config?.entity;
        const current = this.config?.ranges_attribute || '';
        const options = [
            { value: '__none__', label: '(Use entity state)' },
            ...this._getRangesAttributeOptions()
        ];
        return html`
            <ha-selector
                .hass=${this.hass}
                .label=${'Range Attribute'}
                .helper=${'Attribute value compared against range conditions (above:/below:/between:). Select "(Use entity state)" to clear.'}
                .disabled=${!entityId}
                .selector=${{ select: { mode: 'dropdown', options, custom_value: true } }}
                .value=${current || '__none__'}
                @value-changed=${(e) => {
                    let v = (e.detail.value ?? '').trim();
                    if (v === '__none__' || !v) { this._removeConfigPath('ranges_attribute'); return; }
                    if (v === 'brightness') v = 'brightness_pct';
                    this._setConfigValue('ranges_attribute', v);
                }}>
            </ha-selector>
        `;
    }

    /**
     * Build ha-selector option list for the state_attribute dropdown.
     * Lists all entity attributes as string-match candidates (no virtual attrs needed).
     *
     * @returns {Array<{value:string, label:string}>}
     * @protected
     */
    _getStateAttributeOptions() {
        const entityId = this.config?.entity;
        const options = [];
        if (!entityId || !this.hass?.states?.[entityId]) return options;
        const attrs = Object.keys(this.hass.states[entityId].attributes || {}).sort();
        for (const attr of attrs) {
            options.push({ value: attr, label: attr });
        }
        return options;
    }

    /**
     * Render the state_attribute dropdown selector.
     *
     * When set, String(entity.attributes[state_attribute]) is used as the
     * highest-priority key for ALL exact-match state-color lookups across the card,
     * overriding the raw entity.state string. Useful for boolean attributes
     * (true→"true" / false→"false") and discrete string attributes (e.g. "fade").
     * Classified state (active/inactive) is always derived from entity.state.
     *
     * @returns {TemplateResult}
     * @protected
     */
    _renderStateAttributeSelector() {
        const entityId = this.config?.entity;
        const current = this.config?.state_attribute || '';
        const options = entityId && this.hass?.states?.[entityId]
            ? Object.keys(this.hass.states[entityId].attributes || {}).sort()
                  .map(attr => ({ value: attr, label: attr }))
            : [];
        const allOptions = [
            { value: '__none__', label: '(Use entity state)' },
            ...options
        ];
        return html`
            <ha-selector
                .hass=${this.hass}
                .label=${'State Attribute'}
                .helper=${'Attribute whose string value is matched against color-config keys (e.g. "fade", "true"). Select "(Use entity state)" to clear.'}
                .disabled=${!entityId}
                .selector=${{ select: { mode: 'dropdown', options: allOptions, custom_value: true } }}
                .value=${current || '__none__'}
                @value-changed=${(e) => {
                    const v = (e.detail.value ?? '').trim();
                    if (v === '__none__' || !v) { this._removeConfigPath('state_attribute'); return; }
                    this._setConfigValue('state_attribute', v);
                }}>
            </ha-selector>
        `;
    }

    /**
     * Render the state_classification.else dropdown selector.
     *
     * Controls which style bucket unrecognised entity states fall into when they
     * don't match any explicit color key or the built-in active/inactive lists.
     * The active/inactive array fields are YAML-only for now.
     *
     * @returns {TemplateResult}
     * @protected
     */
    _renderStateClassificationElseSelector() {
        const current = this.config?.state_classification?.else ?? '__none__';
        const options = [
            { value: '__none__',  label: '(Inactive, default)' },
            { value: 'default',   label: 'Default' },
            { value: 'active',    label: 'Active' },
            { value: 'inactive',  label: 'Inactive' },
        ];
        return html`
            <ha-selector
                .hass=${this.hass}
                .label=${'Unmapped State Class'}
                .helper=${'Style bucket for states not in the active/inactive lists. Use "Default" so custom zones reach your default colour instead of the preset inactive colour.'}
                .selector=${{ select: { mode: 'dropdown', options } }}
                .value=${current}
                @value-changed=${(e) => {
                    const v = (e.detail.value ?? '').trim();
                    if (v === '__none__' || !v) {
                        const sc = { ...(this.config?.state_classification ?? {}) };
                        delete sc.else;
                        if (Object.keys(sc).length === 0) {
                            this._removeConfigPath('state_classification');
                        } else {
                            this._setConfigValue('state_classification', sc);
                        }
                        return;
                    }
                    this._setConfigValue('state_classification', {
                        ...(this.config?.state_classification ?? {}),
                        else: v,
                    });
                }}>
            </ha-selector>
        `;
    }

    /**
     * Build standard config tab structure with flexible field control
     *
     * @param {Object} options - Config tab options
     * @param {string} options.infoMessage - Info message at top of tab
     * @param {Array} options.modeSections - Mode-specific sections (preset/component/svg)
     * @param {Array} options.basicFields - Basic config fields (default: entity, id, tags)
     * @param {boolean} options.showBasicSection - Show Basic Configuration section (default: true)
     * @param {string} options.basicSectionHeader - Header for basic section (default: 'Basic Configuration')
     * @param {string} options.basicSectionDescription - Description for basic section
     * @param {string} options.basicSectionIcon - Icon for basic section (default: 'mdi:cog')
     * @param {boolean} options.basicSectionExpanded - Expand basic section (default: true)
     *
     * @returns {Array} Config tab definition
     *
     * @example Default usage (all fields)
     * _getConfigTabConfig() {
     *     return this._buildConfigTab({
     *         infoMessage: 'Configure your button card.',
     *         modeSections: [...]
     *     });
     * }
     *
     * @example Custom field subset (slider: no entity, appears in Control tab)
     * _getConfigTabConfig() {
     *     return this._buildConfigTab({
     *         infoMessage: 'Configure your slider card.',
     *         modeSections: [...],
     *         basicFields: [
     *             { path: 'id', label: 'Card ID', helper: 'Custom ID for rules' },
     *             { path: 'tags', label: 'Tags', helper: 'Tags for rule targeting' }
     *         ]
     *     });
     * }
     *
     * @example Hide basic section entirely
     * _getConfigTabConfig() {
     *     return this._buildConfigTab({
     *         infoMessage: 'Configure your card.',
     *         modeSections: [...],
     *         showBasicSection: false
     *     });
     * }
     *
     * @param {any} [options]
     * @protected
     */
    // @ts-ignore - TS2740: auto-suppressed
    _buildConfigTab(options = {}) {
        const {
            infoMessage = 'Configure your LCARdS card settings.',
            modeSections = [],
            basicFields = [
                { path: 'entity' },
                { path: 'id', label: 'Card ID', helper: '[Optional] Custom ID for targeting with rules and animations' },
                { path: 'tags', label: 'Tags', helper: 'Select existing tags or type new ones for rule targeting' }
            ],
            showBasicSection = true,
            basicSectionHeader = 'Card Identification',
            basicSectionDescription = 'Identification for rules engine targeting',
            basicSectionIcon = 'mdi:cog',
            basicSectionExpanded = false
        } = options;

        const config = [
            {
                type: 'custom',
                render: () => html`
                    <lcards-message type="info" message="${infoMessage}"></lcards-message>
                `
            },
            ...modeSections
        ];

        // Add basic section if enabled and has fields
        if (showBasicSection && basicFields.length > 0) {
            config.push({
                type: 'section',
                header: basicSectionHeader,
                description: basicSectionDescription,
                icon: basicSectionIcon,
                expanded: basicSectionExpanded,
                outlined: true,
                children: basicFields.map(field => ({
                    type: 'field',
                    path: field.path,
                    label: field.label || '',
                    helper: field.helper || ''
                }))
            });
        }

        return config;
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
        const commonKeys = ['type', 'entity', 'id', 'tap_action', 'hold_action', 'double_tap_action', 'style'];

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
     * Standard utility tab renderers
     * Override in child classes if customization needed
     * @protected
     */

    /**
     * Render a compact info hint for the Sizing section, shown only when
     * lovelace-layout-card (`custom:layout-card`) is installed: LCARdS cards
     * collapse inside its grid, so it points at `custom:lcards-layout-card`.
     *
     * Called as the last child of every card's Sizing section so users
     * see it without needing to open docs.
     *
     * @returns {TemplateResult}
     * @protected
     */
    _renderLayoutCardHint() {
        // Only when lovelace-layout-card is installed: otherwise there is nothing to warn about.
        if (!customElements.get('layout-card')) return html``;
        return html`
            ${renderInfoGuide({
                header: 'Inside a custom:layout-card?',
                icon: 'mdi:view-grid-outline',
                body: html`
                    <p>Cards can collapse to their minimum height in a <code>custom:layout-card</code> grid, and its
                        <code>card_margin</code> is ignored. Use LCARdS's own <strong>Layout Card</strong> instead:
                        change <code>type</code> to <code>custom:lcards-layout-card</code> and remove
                        <code>layout_type</code>. Your <code>layout</code> and <code>view_layout</code> keys stay the same.</p>
                    <div class="info-guide-links">
                        <a href=${docsUrl(DOCS.sizingInLayoutCard)} target="_blank" rel="noopener noreferrer">Documentation</a>
                    </div>
                `,
            })}
        `;
    }

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
     * Render the card's Theme tab (its tokens; links to the panel's Theme Studio)
     * @returns {TemplateResult}
     * @protected
     */
    _renderThemeTokensTab() {
        return html`
            <lcards-card-theme-tab
                .config=${this.config}
                .hass=${this.hass}>
            </lcards-card-theme-tab>
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
     * Render Developer Tab with sub-tabs for developer tools
     * Consolidates Data Sources, Rules, Templates, Theme Browser, and Provenance
     * @returns {TemplateResult}
     * @protected
     */
    _renderDeveloperTab() {
        const active = this._developerSubTab || 0;
        const tabs = [
            { icon: 'mdi:database', label: 'Data Sources', render: () => this._renderDataSourcesTab() },
            { icon: 'mdi:format-list-checks', label: 'Rules', render: () => this._renderRulesTab() },
            { icon: 'mdi:palette-swatch', label: 'Theme', render: () => this._renderThemeTokensTab() },
            { icon: 'mdi:layers-search', label: 'Provenance', render: () => this._renderProvenanceTab() },
            { icon: 'mdi:code-braces-box', label: 'Templates', render: () => this._renderTemplatesTab() },
        ];
        return html`
            <p class="hint main-engineering-hint">
                This card's data sources, rules, theme tokens, templates, and where each setting comes from.
            </p>

            <ha-tab-group @wa-tab-show=${this._handleDeveloperSubTabChange}>
                ${tabs.map((tab, i) => html`
                    <ha-tab-group-tab value=${String(i)} ?active=${active === i}>
                        <ha-icon icon=${tab.icon}></ha-icon>
                        ${tab.label}
                    </ha-tab-group-tab>
                `)}
                <!-- Only the active sub-tab is rendered (the others would poll and load for nothing). -->
                <div class="tab-panel">${tabs[active]?.render()}</div>
            </ha-tab-group>
        `;
    }

    /**
     * Handle developer sub-tab change
     * CRITICAL: Stops event propagation to prevent bubbling to main tab handler
     * @param {CustomEvent} event - wa-tab-show event from nested ha-tab-group
     * @private
     */
    _handleDeveloperSubTabChange(event) {
        // CRITICAL: Stop propagation to prevent bubbling to main tab handler
        event.stopPropagation();

        const value = (/** @type {any} */ (event.target)).activeTab?.getAttribute('value');
        if (value !== null) {
            this._developerSubTab = parseInt(value, 10);
            this.requestUpdate();
        }
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
            { label: '🖖 Main Engineering', content: () => this._renderDeveloperTab() },
            { label: 'YAML', content: () => this._renderYamlTab() }
        ];
    }

    /**
     * Zones tab — add/edit/remove custom zones that override or extend the
     * card's automatically calculated zones.  Text fields reference zones by
     * name via the `zone:` key.
     *
     * The tab is identical for all card types because zone management is
     * handled entirely by the base-class _mergeUserZones / _rebuildZones pipeline.
     *
     * @returns {TemplateResult}
     * @protected
     */
    _renderZonesTab() {
        const zones = this.config?.zones || {};
        const debugZones = this.config?.debug_zones === true;
        return html`
            <lcards-form-section
                header="Custom Zones"
                icon="mdi:vector-rectangle"
                ?expanded=${true}>
                <lcards-zone-list-editor
                    .zones=${zones}
                    @zones-changed=${(e) => {
                        // CRITICAL: Replace zones entirely — deepMerge would re-add stripped
                        // px/percent fields after a unit-mode toggle in the editor.
                        this.config = { ...this.config, zones: e.detail.value };
                        this._updateConfig(this.config, 'visual');
                    }}>
                </lcards-zone-list-editor>
            </lcards-form-section>

            <lcards-form-section
                header="Developer Tools"
                icon="mdi:bug-outline"
                ?expanded=${debugZones}>
                <div class="control-row" style="display:flex;align-items:center;justify-content:space-between;padding:4px 0;">
                    <div class="control-label" style="display:flex;flex-direction:column;gap:2px;">
                        <span>Show zone debug overlay</span>
                        <span class="hint" style="font-size:0.8em;opacity:0.7;">Renders coloured outlines and labels over each zone</span>
                    </div>
                    <ha-switch
                        .checked=${debugZones}
                        @change=${(e) => {
                            const newConfig = { ...this.config };
                            if (e.target.checked) {
                                newConfig.debug_zones = true;
                            } else {
                                delete newConfig.debug_zones;
                            }
                            this.config = newConfig;
                            this._updateConfig(this.config, 'visual');
                        }}
                    ></ha-switch>
                </div>
            </lcards-form-section>
        `;
    }

    /**
     * Render per-card sound configuration tab.
     *
     * Shows a master card-level mute toggle and per-event asset override dropdowns.
     * The events list is card-type-specific — pass only the events that are relevant
     * for the card being edited.
     *
     * @param {string[]} [events] - Event keys to show (defaults to card tap/hold/hover set)
     * @returns {TemplateResult}
     * @protected
     */
    _renderSoundTab(events = ['card_tap', 'card_hold', 'card_double_tap', 'card_hover']) {
        return html`
            <lcards-card-sound-tab
                .editor=${this}
                .hass=${this.hass}
                .events=${events}
            ></lcards-card-sound-tab>
        `;
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
                    .cardType=${this.cardType}
                    @value-changed=${this._handleYamlChange}>
                </lcards-yaml-editor>
            </div>
        `;
    }
}
