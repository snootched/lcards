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
import { deepMerge, deepClone } from '../utils/config-merger.js';
import { validateAgainstSchema } from '../utils/schema-utils.js';

export class LCARdSBaseEditor extends LitElement {
    
    static get properties() {
        return {
            hass: { type: Object },           // HA instance (provided by HA)
            config: { type: Object },         // Card config (provided by HA)
            _selectedTab: { type: Number, state: true },     // Current tab index
            _yamlValue: { type: String, state: true },       // YAML representation
            _validationErrors: { type: Array, state: true }, // Schema errors
            _singletons: { type: Object, state: true }       // window.lcardsCore reference
        };
    }
    
    constructor() {
        super();
        this.config = {};
        this._selectedTab = 0;
        this._yamlValue = '';
        this._validationErrors = [];
        this._singletons = null;
        this._isUpdatingYaml = false;
    }
    
    static get styles() {
        return [
            editorStyles,
            css`
                .tabs-container {
                    display: flex;
                    border-bottom: 2px solid var(--divider-color, #e0e0e0);
                    margin-bottom: 16px;
                }
                
                .tab {
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
        
        this.config = deepClone(config);
        this._yamlValue = configToYaml(this.config);
        this._validateConfig();
        
        // Try to access singletons
        if (window.lcardsCore) {
            this._singletons = window.lcardsCore;
        }
        
        this.requestUpdate();
    }
    
    /**
     * Render the editor
     */
    render() {
        const tabs = this._getTabDefinitions();
        
        return html`
            <div class="editor-container">
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
        // Deep merge updates into config
        this.config = deepMerge(this.config, updates);
        
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
        
        // Notify Home Assistant
        fireEvent(this, 'config-changed', { config: this.config });
        
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
            
            // Validate against schema
            const errors = validateAgainstSchema(newConfig, this._getSchema());
            this._validationErrors = errors;
            
            if (errors.length === 0) {
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
     * Validate configuration against schema
     * @private
     */
    _validateConfig() {
        const schema = this._getSchema();
        if (schema) {
            this._validationErrors = validateAgainstSchema(this.config, schema);
        } else {
            this._validationErrors = [];
        }
    }
    
    /**
     * Get tab definitions for this card type
     * @returns {Array<{label: string, content: Function}>}
     * @abstract - Subclasses must implement
     */
    _getTabDefinitions() {
        throw new Error('Subclass must implement _getTabDefinitions()');
    }
    
    /**
     * Get JSON schema for this card type
     * @returns {Object} JSON Schema object
     * @abstract - Subclasses must implement
     */
    _getSchema() {
        throw new Error('Subclass must implement _getSchema()');
    }
}
