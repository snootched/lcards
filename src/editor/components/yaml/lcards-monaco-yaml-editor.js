/**
 * Monaco YAML Editor Component
 * 
 * Monaco editor wrapper with JSON schema validation, IntelliSense, and YAML support.
 * Note: Monaco editor is large and may not be suitable for all use cases.
 * This is a basic implementation that can be enhanced over time.
 */

import { LitElement, html, css } from 'lit';
import { configToYaml, yamlToConfig } from '../../utils/yaml-utils.js';

export class LCARdSMonacoYamlEditor extends LitElement {
    
    static get properties() {
        return {
            value: { type: String },           // YAML string
            schema: { type: Object },          // JSON Schema
            errors: { type: Array },           // External validation errors
            readOnly: { type: Boolean }
        };
    }
    
    constructor() {
        super();
        this.value = '';
        this.schema = null;
        this.errors = [];
        this.readOnly = false;
        this._editorInstance = null;
        this._isUpdating = false;
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
            }
            
            .simple-yaml-editor {
                width: 100%;
                height: 500px;
                font-family: 'Courier New', monospace;
                font-size: 14px;
                padding: 12px;
                border: 1px solid var(--divider-color, #e0e0e0);
                border-radius: 4px;
                background: var(--card-background-color, #fafafa);
                color: var(--primary-text-color, #212121);
                resize: vertical;
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
        `;
    }
    
    /**
     * Render the editor
     * Monaco is quite large and complex, so for Phase 1 we'll use a simple textarea
     * and add Monaco support in a future update.
     */
    render() {
        return html`
            <div class="editor-wrapper">
                <textarea
                    class="simple-yaml-editor"
                    .value=${this.value}
                    ?readonly=${this.readOnly}
                    @input=${this._handleInput}
                    spellcheck="false"
                    autocomplete="off"
                    placeholder="# Enter YAML configuration here"></textarea>
                
                ${this.errors && this.errors.length > 0 ? html`
                    <div class="error-list">
                        <strong>Validation Errors:</strong>
                        ${this.errors.map(err => html`
                            <div class="error-item">
                                ${err.path ? `${err.path}: ` : ''}${err.message}
                            </div>
                        `)}
                    </div>
                ` : ''}
            </div>
        `;
    }
    
    /**
     * Handle input changes
     * @param {Event} ev - Input event
     * @private
     */
    _handleInput(ev) {
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
        
        // Sync external value changes to editor
        if (changedProperties.has('value') && !this._isUpdating) {
            const textarea = this.shadowRoot.querySelector('.simple-yaml-editor');
            if (textarea && textarea.value !== this.value) {
                this._isUpdating = true;
                textarea.value = this.value;
                // Allow input event to fire before resetting flag
                requestAnimationFrame(() => {
                    this._isUpdating = false;
                });
            }
        }
    }
}

customElements.define('lcards-monaco-yaml-editor', LCARdSMonacoYamlEditor);
