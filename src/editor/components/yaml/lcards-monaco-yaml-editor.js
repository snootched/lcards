/**
 * Monaco YAML Editor Component
 * 
 * Advanced YAML editor with Monaco Editor integration featuring:
 * - Dynamic lazy loading (Monaco loads only when component first renders)
 * - JSON Schema validation with inline error squiggles
 * - IntelliSense autocomplete (Ctrl+Space)
 * - Hover tooltips showing schema descriptions
 * - YAML syntax highlighting and code folding
 * - Dark theme matching Home Assistant
 * - Graceful fallback to simple textarea if Monaco fails to load
 * 
 * @fires value-changed - Fired when editor content changes
 * 
 * @example
 * <lcards-monaco-yaml-editor
 *   .value=${yamlString}
 *   .schema=${cardSchema}
 *   @value-changed=${this._handleYamlChange}>
 * </lcards-monaco-yaml-editor>
 * 
 * @module editor/components/yaml/lcards-monaco-yaml-editor
 */

import { LitElement, html, css } from 'lit';
import { configToYaml, yamlToConfig } from '../../utils/yaml-utils.js';
import { loadMonaco, isMonacoLoaded } from '../../utils/monaco-loader.js';
import { lcardsLog } from '../../../utils/lcards-logging.js';

export class LCARdSMonacoYamlEditor extends LitElement {
    
    static get properties() {
        return {
            value: { type: String },           // YAML string
            schema: { type: Object },          // JSON Schema for validation
            errors: { type: Array },           // External validation errors
            readOnly: { type: Boolean },       // Read-only mode
            _monacoLoading: { type: Boolean, state: true },   // Monaco loading state
            _monacoFailed: { type: Boolean, state: true },    // Monaco load failed
            _useFallback: { type: Boolean, state: true }      // Use fallback textarea
        };
    }
    
    constructor() {
        super();
        this.value = '';
        this.schema = null;
        this.errors = [];
        this.readOnly = false;
        this._editorInstance = null;
        this._monacoInstance = null;
        this._isUpdating = false;
        this._monacoLoading = false;
        this._monacoFailed = false;
        this._useFallback = false;
        this._disposed = false;
    }
    
    static get styles() {
        return css`
            :host {
                display: block;
            }
            
            .monaco-editor-container {
                width: 100%;
                height: 500px;
                border: 1px solid var(--divider-color, #e0e0e0);
                border-radius: 4px;
                overflow: hidden;
                background: var(--code-editor-background-color, #1e1e1e);
            }
            
            .loading-container {
                width: 100%;
                height: 500px;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                border: 1px solid var(--divider-color, #e0e0e0);
                border-radius: 4px;
                background: var(--card-background-color, #fafafa);
            }
            
            .loading-spinner {
                width: 48px;
                height: 48px;
                border: 4px solid var(--divider-color, #e0e0e0);
                border-top-color: var(--primary-color, #03a9f4);
                border-radius: 50%;
                animation: spin 1s linear infinite;
            }
            
            @keyframes spin {
                to { transform: rotate(360deg); }
            }
            
            .loading-text {
                margin-top: 16px;
                color: var(--secondary-text-color, #727272);
                font-size: 14px;
            }
            
            .simple-yaml-editor {
                width: 100%;
                height: 500px;
                font-family: 'Courier New', 'Consolas', monospace;
                font-size: 14px;
                padding: 12px;
                border: 1px solid var(--divider-color, #e0e0e0);
                border-radius: 4px;
                background: var(--code-editor-background-color, #1e1e1e);
                color: var(--primary-text-color, #d4d4d4);
                resize: vertical;
                tab-size: 2;
            }
            
            .error-list {
                margin-top: 8px;
                padding: 8px;
                background: var(--error-background-color, rgba(244, 67, 54, 0.1));
                border: 1px solid var(--error-color, #f44336);
                border-radius: 4px;
            }
            
            .error-item {
                color: var(--error-color, #f44336);
                font-size: 12px;
                margin: 4px 0;
                font-family: monospace;
            }
            
            .fallback-notice {
                margin-top: 8px;
                padding: 8px;
                background: var(--warning-background-color, rgba(255, 152, 0, 0.1));
                border: 1px solid var(--warning-color, #ff9800);
                border-radius: 4px;
                color: var(--warning-color, #ff9800);
                font-size: 13px;
            }
        `;
    }
    
    /**
     * Render the editor
     * - Shows loading spinner while Monaco is loading
     * - Renders Monaco editor when loaded
     * - Falls back to simple textarea if Monaco fails or is unavailable
     */
    render() {
        // Loading state
        if (this._monacoLoading) {
            return html`
                <div class="loading-container">
                    <div class="loading-spinner"></div>
                    <div class="loading-text">⏳ Loading advanced YAML editor...</div>
                </div>
            `;
        }

        // Monaco editor (if loaded successfully)
        if (!this._useFallback && !this._monacoFailed) {
            return html`
                <div class="editor-wrapper">
                    <div class="monaco-editor-container" id="monaco-container"></div>
                    ${this._renderExternalErrors()}
                </div>
            `;
        }

        // Fallback textarea
        return html`
            <div class="editor-wrapper">
                ${this._monacoFailed ? html`
                    <div class="fallback-notice">
                        ⚠️ Advanced editor failed to load. Using basic text editor.
                    </div>
                ` : ''}
                
                <textarea
                    class="simple-yaml-editor"
                    .value=${this.value}
                    ?readonly=${this.readOnly}
                    @input=${this._handleFallbackInput}
                    spellcheck="false"
                    autocomplete="off"
                    placeholder="# Enter YAML configuration here"></textarea>
                
                ${this._renderExternalErrors()}
            </div>
        `;
    }
    
    /**
     * Render external validation errors (passed from parent)
     * @returns {TemplateResult}
     * @private
     */
    _renderExternalErrors() {
        if (!this.errors || this.errors.length === 0) {
            return html``;
        }
        
        return html`
            <div class="error-list">
                <strong>Validation Errors:</strong>
                ${this.errors.map(err => html`
                    <div class="error-item">
                        ${err.path ? `${err.path}: ` : ''}${err.message}
                    </div>
                `)}
            </div>
        `;
    }
    
    /**
     * Component connected to DOM - start Monaco loading
     */
    async connectedCallback() {
        super.connectedCallback();
        
        this._disposed = false;
        
        // Start loading Monaco if not already loaded
        if (!isMonacoLoaded()) {
            this._monacoLoading = true;
            await this._initializeMonaco();
        } else {
            // Monaco already loaded, initialize editor immediately after render
            await this.updateComplete;
            await this._createEditor();
        }
    }
    
    /**
     * Component disconnected from DOM - cleanup
     */
    disconnectedCallback() {
        super.disconnectedCallback();
        this._disposed = true;
        this._disposeEditor();
    }
    
    /**
     * Initialize Monaco Editor
     * @private
     */
    async _initializeMonaco() {
        try {
            lcardsLog.debug('[MonacoYamlEditor] Loading Monaco...');
            
            const monaco = await loadMonaco();
            
            if (this._disposed) {
                lcardsLog.debug('[MonacoYamlEditor] Component disposed during Monaco load');
                return;
            }
            
            if (!monaco) {
                lcardsLog.warn('[MonacoYamlEditor] Monaco load failed, using fallback');
                this._monacoFailed = true;
                this._useFallback = true;
                this._monacoLoading = false;
                return;
            }
            
            this._monacoInstance = monaco;
            this._monacoLoading = false;
            
            // Wait for render to complete
            await this.updateComplete;
            
            // Create editor
            await this._createEditor();
            
        } catch (error) {
            lcardsLog.error('[MonacoYamlEditor] Failed to initialize Monaco:', error);
            this._monacoFailed = true;
            this._useFallback = true;
            this._monacoLoading = false;
        }
    }
    
    /**
     * Create Monaco editor instance
     * @private
     */
    async _createEditor() {
        if (!this._monacoInstance || this._disposed) {
            return;
        }
        
        const container = this.shadowRoot.getElementById('monaco-container');
        if (!container) {
            lcardsLog.warn('[MonacoYamlEditor] Monaco container not found');
            return;
        }
        
        try {
            lcardsLog.debug('[MonacoYamlEditor] Creating Monaco editor instance');
            
            // Configure monaco-yaml before creating editor
            if (this.schema) {
                this._configureYamlSchema();
            }
            
            // Create editor with dark theme
            this._editorInstance = this._monacoInstance.editor.create(container, {
                value: this.value || '',
                language: 'yaml',
                theme: 'vs-dark',
                automaticLayout: true,
                minimap: { enabled: false },
                scrollBeyondLastLine: false,
                wordWrap: 'on',
                lineNumbers: 'on',
                folding: true,
                fontSize: 14,
                tabSize: 2,
                insertSpaces: true,
                readOnly: this.readOnly,
                suggest: {
                    showProperties: true,
                    showKeywords: true,
                    snippetsPreventQuickSuggestions: false
                }
            });
            
            // Listen for content changes
            this._editorInstance.onDidChangeModelContent(() => {
                if (!this._isUpdating) {
                    const newValue = this._editorInstance.getValue();
                    this._fireValueChanged(newValue);
                }
            });
            
            lcardsLog.debug('[MonacoYamlEditor] ✅ Monaco editor created successfully');
            
        } catch (error) {
            lcardsLog.error('[MonacoYamlEditor] Failed to create editor:', error);
            this._monacoFailed = true;
            this._useFallback = true;
            this.requestUpdate();
        }
    }
    
    /**
     * Configure monaco-yaml with JSON schema
     * @private
     */
    _configureYamlSchema() {
        if (!this._monacoInstance || !this._monacoInstance.yamlWorker || !this.schema) {
            return;
        }
        
        try {
            // Get card type from schema or use generic
            const cardType = this.schema.properties?.type?.const || 
                           this.schema.properties?.type?.default || 
                           'card';
            
            lcardsLog.debug(`[MonacoYamlEditor] Configuring YAML schema for ${cardType}`);
            
            // Configure monaco-yaml with schema
            this._monacoInstance.yamlWorker.configureMonacoYaml(this._monacoInstance, {
                enableSchemaRequest: true,
                hover: true,
                completion: true,
                validate: true,
                format: true,
                schemas: [{
                    uri: `lcards://schemas/${cardType}.json`,
                    fileMatch: ['*'],
                    schema: this.schema
                }]
            });
            
            lcardsLog.debug('[MonacoYamlEditor] ✅ YAML schema configured');
            
        } catch (error) {
            lcardsLog.error('[MonacoYamlEditor] Failed to configure YAML schema:', error);
        }
    }
    
    /**
     * Dispose Monaco editor instance
     * @private
     */
    _disposeEditor() {
        if (this._editorInstance) {
            lcardsLog.debug('[MonacoYamlEditor] Disposing Monaco editor instance');
            try {
                this._editorInstance.dispose();
            } catch (error) {
                lcardsLog.error('[MonacoYamlEditor] Error disposing editor:', error);
            }
            this._editorInstance = null;
        }
    }
    
    /**
     * Handle fallback textarea input changes
     * @param {Event} ev - Input event
     * @private
     */
    _handleFallbackInput(ev) {
        if (this._isUpdating) {
            return;
        }
        
        const newValue = ev.target.value;
        this._fireValueChanged(newValue);
    }
    
    /**
     * Fire value-changed event
     * @param {string} value - New YAML value
     * @private
     */
    _fireValueChanged(value) {
        this.dispatchEvent(new CustomEvent('value-changed', {
            detail: { value },
            bubbles: true,
            composed: true
        }));
    }
    
    /**
     * Update the editor value from external source
     * @param {Map} changedProperties - Changed properties
     */
    updated(changedProperties) {
        super.updated(changedProperties);
        
        // Handle external value changes
        if (changedProperties.has('value') && !this._isUpdating) {
            this._syncValueToEditor();
        }
        
        // Handle schema changes
        if (changedProperties.has('schema') && this._editorInstance) {
            this._configureYamlSchema();
        }
        
        // Handle readOnly changes
        if (changedProperties.has('readOnly') && this._editorInstance) {
            this._editorInstance.updateOptions({ readOnly: this.readOnly });
        }
    }
    
    /**
     * Sync external value changes to editor
     * @private
     */
    _syncValueToEditor() {
        // Monaco editor
        if (this._editorInstance && !this._useFallback) {
            const currentValue = this._editorInstance.getValue();
            if (currentValue !== this.value) {
                this._isUpdating = true;
                this._editorInstance.setValue(this.value || '');
                requestAnimationFrame(() => {
                    this._isUpdating = false;
                });
            }
            return;
        }
        
        // Fallback textarea
        if (this._useFallback) {
            const textarea = this.shadowRoot.querySelector('.simple-yaml-editor');
            if (textarea && textarea.value !== this.value) {
                this._isUpdating = true;
                textarea.value = this.value || '';
                requestAnimationFrame(() => {
                    this._isUpdating = false;
                });
            }
        }
    }
}

customElements.define('lcards-monaco-yaml-editor', LCARdSMonacoYamlEditor);
