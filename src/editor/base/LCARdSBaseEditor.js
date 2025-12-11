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

export class LCARdSBaseEditor extends LitElement {

    static get properties() {
        return {
            hass: { type: Object },           // HA instance (provided by HA)
            config: { type: Object },         // Card config (provided by HA)
            cardType: { type: String },       // Card type for schema lookup
            _selectedTab: { type: Number, state: true },     // Current tab index
            _yamlValue: { type: String, state: true },       // YAML representation
            _validationErrors: { type: Array, state: true }, // Schema errors
            _singletons: { type: Object, state: true }       // window.lcards.core reference
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
    }

    static get styles() {
        return [
            editorStyles,
            css`
                .tabs-container {
                    display: flex;
                    overflow-x: auto;
                    overflow-y: hidden;
                    flex-wrap: nowrap;
                    scroll-behavior: smooth;
                    scrollbar-width: thin;
                    border-bottom: 2px solid var(--divider-color, #e0e0e0);
                    margin-bottom: 16px;
                    
                    /* Fade indicators for scrollable content */
                    mask-image: linear-gradient(
                        to right, 
                        transparent, 
                        black 20px, 
                        black calc(100% - 20px), 
                        transparent
                    );
                    -webkit-mask-image: linear-gradient(
                        to right, 
                        transparent, 
                        black 20px, 
                        black calc(100% - 20px), 
                        transparent
                    );
                }

                .tabs-container::-webkit-scrollbar {
                    height: 4px;
                }

                .tabs-container::-webkit-scrollbar-thumb {
                    background: var(--primary-color, #03a9f4);
                    border-radius: 2px;
                }

                .tab {
                    flex: 0 0 auto;
                    white-space: nowrap;
                    padding: 12px 24px;
                    cursor: pointer;
                    border-bottom: 3px solid transparent;
                    font-weight: 500;
                    color: var(--secondary-text-color, #727272);
                    transition: all 0.2s ease;
                    user-select: none;
                }

                .tab:hover {
                    color: var(--primary-text-color, #212121);
                    background: var(--secondary-background-color, #f5f5f5);
                }

                .tab.active {
                    color: var(--primary-color, #03a9f4);
                    border-bottom-color: var(--primary-color, #03a9f4);
                }

                .tab-content {
                    padding: 16px 0;
                    min-height: 400px;
                }

                /* Section styles */
                ha-expansion-panel {
                    margin-bottom: 16px;
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
                    margin-bottom: 16px;
                }
                
                /* Two-column grid */
                .form-row-group {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 16px;
                    margin-bottom: 16px;
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

        // Deep clone config
        this.config = JSON.parse(JSON.stringify(config));
        this._yamlValue = configToYaml(this.config);
        this._validateConfig();

        console.debug('[LCARdSBaseEditor] Config initialized:', { config: this.config, yaml: this._yamlValue });

        // Try to access singletons
        if (window.lcards?.core) {
            this._singletons = window.lcards.core;
        }

        this.requestUpdate();
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
                <div class="tabs-container">
                    ${tabs.map((tab, index) => html`
                        <div
                            class="tab ${this._selectedTab === index ? 'active' : ''}"
                            @click=${() => this._handleTabChange(index)}>
                            ${tab.label}
                        </div>
                    `)}
                </div>

                <div class="tab-content">
                    ${this._renderTabContent(tabs[this._selectedTab])}
                </div>

                ${this._renderValidationErrors()}
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
     * Handle tab change
     * @param {number} index - Tab index
     * @private
     */
    _handleTabChange(index) {
        this._selectedTab = index;
        this.requestUpdate();
    }

    /**
     * Update configuration from visual or YAML editor
     * @param {Object} updates - Partial config updates (deep merged)
     * @param {string} source - 'visual' | 'yaml' (prevents circular updates)
     */
    _updateConfig(updates, source = 'visual') {
        // Guard against invalid updates
        if (!updates || typeof updates !== 'object') {
            console.warn('[LCARdSBaseEditor] Invalid config updates:', updates);
            return;
        }

        console.debug('[LCARdSBaseEditor] _updateConfig called with:', { updates, source, currentConfig: this.config });

        // Deep merge updates into config
        this.config = deepMerge(this.config, updates);

        // CRITICAL: Ensure 'type' property is always present (HA requires it)
        if (!this.config.type) {
            console.error('[LCARdSBaseEditor] Config is missing required "type" property after merge!');
            // This shouldn't happen, but if it does, we need to recover
            return;
        }

        console.debug('[LCARdSBaseEditor] Config after merge:', this.config);

        // Validate against schema
        this._validateConfig();

        // Sync YAML editor if update came from visual tab
        if (source === 'visual' && !this._isUpdatingYaml) {
            this._isUpdatingYaml = true;
            this._yamlValue = configToYaml(this.config);
            console.debug('[LCARdSBaseEditor] YAML value updated:', this._yamlValue);
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
        this._validationErrors = validationResult.errors.map(err => ({
            path: err.field || '',
            message: err.message
        }));
    }

    /**
     * Get JSON schema for this card type from CoreConfigManager
     * @returns {Object} JSON Schema object from registered card schema
     */
    _getSchema() {
        const configManager = window.lcards?.core?.configManager;

        if (!configManager) {
            console.warn('[LCARdSBaseEditor] CoreConfigManager not available');
            return {}; // Return empty schema as fallback
        }

        const schema = configManager.getCardSchema(this.cardType);

        if (!schema) {
            console.warn(`[LCARdSBaseEditor] No schema registered for card type: ${this.cardType}`);
            return {};
        }

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
            if (!currentSchema.properties || !currentSchema.properties[key]) {
                return null;
            }
            currentSchema = currentSchema.properties[key];
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
     * Render validation errors
     * @returns {TemplateResult}
     * @protected
     */
    _renderValidationErrors() {
        if (!this._validationErrors || this._validationErrors.length === 0) {
            return html``;
        }

        return html`
            <ha-alert alert-type="error" title="Validation Errors">
                <ul>
                    ${this._validationErrors.map(err => html`
                        <li>${err.path ? `${err.path}: ` : ''}${err.message}</li>
                    `)}
                </ul>
            </ha-alert>
        `;
    }
}
