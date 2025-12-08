/**
 * Card Configuration Section Component
 * 
 * Reusable component for basic card configuration (entity, ID, tags, etc.)
 */

import { LitElement, html, css } from 'lit';

export class LCARdSCardConfigSection extends LitElement {
    
    static get properties() {
        return {
            hass: { type: Object },
            config: { type: Object },
            schema: { type: Object }
        };
    }
    
    constructor() {
        super();
        this.config = {};
        this.schema = {};
    }
    
    static get styles() {
        return css`
            :host {
                display: block;
            }
            
            .config-section {
                display: flex;
                flex-direction: column;
                gap: 16px;
            }
            
            .form-row {
                display: flex;
                flex-direction: column;
                gap: 8px;
            }
            
            .form-row-group {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 16px;
            }
            
            label {
                font-weight: 500;
                color: var(--primary-text-color, #212121);
                font-size: 14px;
            }
            
            .helper-text {
                font-size: 12px;
                color: var(--secondary-text-color, #727272);
                margin-top: 4px;
                line-height: 1.4;
            }
            
            .section-header {
                font-size: 16px;
                font-weight: 500;
                margin-top: 16px;
                margin-bottom: 8px;
                color: var(--primary-text-color, #212121);
                border-bottom: 1px solid var(--divider-color, #e0e0e0);
                padding-bottom: 8px;
            }
            
            input[type="text"],
            input[type="number"],
            select {
                width: 100%;
                padding: 8px 12px;
                border: 1px solid var(--divider-color, #e0e0e0);
                border-radius: 4px;
                font-size: 14px;
                font-family: inherit;
                background: var(--card-background-color, #fff);
                color: var(--primary-text-color, #212121);
            }
            
            input:focus,
            select:focus {
                outline: none;
                border-color: var(--primary-color, #03a9f4);
            }
            
            @media (max-width: 768px) {
                .form-row-group {
                    grid-template-columns: 1fr;
                }
            }
        `;
    }
    
    render() {
        const hasHaEntityPicker = customElements.get('ha-entity-picker');
        const hasHaSelector = customElements.get('ha-selector');
        
        return html`
            <div class="config-section">
                
                <!-- Entity Picker -->
                <div class="form-row">
                    <label>Entity</label>
                    ${hasHaEntityPicker ? html`
                        <ha-entity-picker
                            .hass=${this.hass}
                            .value=${this.config.entity}
                            @value-changed=${this._entityChanged}>
                        </ha-entity-picker>
                    ` : html`
                        <input
                            type="text"
                            .value=${this.config.entity || ''}
                            @input=${(e) => this._entityChangedSimple(e)}
                            placeholder="light.example">
                    `}
                    ${this._getSchemaDescription('entity')}
                </div>
                
                <!-- Card ID -->
                <div class="form-row">
                    <label>Card ID (optional)</label>
                    <input
                        type="text"
                        .value=${this.config.id || ''}
                        @input=${(e) => this._valueChanged('id', e.target.value)}
                        placeholder="auto-generated">
                    ${this._getSchemaDescription('id')}
                </div>
                
                <!-- Tags -->
                <div class="form-row">
                    <label>Tags (comma-separated)</label>
                    <input
                        type="text"
                        .value=${(this.config.tags || []).join(', ')}
                        @input=${this._tagsChanged}
                        placeholder="sensor, temperature, critical">
                    ${this._getSchemaDescription('tags')}
                </div>
                
                <!-- Preset Selector (if applicable) -->
                ${this.schema?.properties?.preset ? html`
                    <div class="form-row">
                        <label>Preset</label>
                        ${hasHaSelector ? html`
                            <ha-selector
                                .hass=${this.hass}
                                .selector=${{
                                    select: {
                                        mode: 'dropdown',
                                        options: (this.schema.properties.preset.enum || []).map(p => ({
                                            value: p,
                                            label: this._formatPresetLabel(p)
                                        }))
                                    }
                                }}
                                .value=${this.config.preset}
                                @value-changed=${(e) => this._valueChanged('preset', e.detail.value)}>
                            </ha-selector>
                        ` : html`
                            <select 
                                .value=${this.config.preset || ''}
                                @change=${(e) => this._valueChanged('preset', e.target.value)}>
                                <option value="">Select preset...</option>
                                ${(this.schema.properties.preset.enum || []).map(p => html`
                                    <option value="${p}">${this._formatPresetLabel(p)}</option>
                                `)}
                            </select>
                        `}
                        ${this._getSchemaDescription('preset')}
                    </div>
                ` : ''}
                
                <!-- Grid Layout -->
                <div class="section-header">Layout</div>
                <div class="form-row-group">
                    <div class="form-row">
                        <label>Grid Columns</label>
                        <input
                            type="number"
                            min="1"
                            max="12"
                            .value=${this.config.grid_columns || 4}
                            @input=${(e) => this._valueChanged('grid_columns', parseInt(e.target.value))}>
                        <div class="helper-text">Number of columns to span (1-12)</div>
                    </div>
                    <div class="form-row">
                        <label>Grid Rows</label>
                        <input
                            type="number"
                            min="1"
                            max="12"
                            .value=${this.config.grid_rows || 1}
                            @input=${(e) => this._valueChanged('grid_rows', parseInt(e.target.value))}>
                        <div class="helper-text">Number of rows to span (1-12)</div>
                    </div>
                </div>
                
            </div>
        `;
    }
    
    /**
     * Handle entity selection change (ha-entity-picker)
     * @param {CustomEvent} ev - value-changed event
     * @private
     */
    _entityChanged(ev) {
        this._fireConfigChanged({ entity: ev.detail.value });
    }
    
    /**
     * Handle entity input change (simple input fallback)
     * @param {Event} ev - input event
     * @private
     */
    _entityChangedSimple(ev) {
        this._fireConfigChanged({ entity: ev.target.value });
    }
    
    /**
     * Handle tags input change
     * @param {Event} ev - input event
     * @private
     */
    _tagsChanged(ev) {
        const tags = ev.target.value
            .split(',')
            .map(t => t.trim())
            .filter(t => t.length > 0);
        this._fireConfigChanged({ tags });
    }
    
    /**
     * Handle generic value change
     * @param {string} key - Config key
     * @param {*} value - New value
     * @private
     */
    _valueChanged(key, value) {
        this._fireConfigChanged({ [key]: value });
    }
    
    /**
     * Fire config-changed event
     * @param {Object} updates - Partial config updates
     * @private
     */
    _fireConfigChanged(updates) {
        this.dispatchEvent(new CustomEvent('config-changed', {
            detail: { config: updates },
            bubbles: true,
            composed: true
        }));
    }
    
    /**
     * Get schema description for a property
     * @param {string} prop - Property name
     * @returns {TemplateResult|string}
     * @private
     */
    _getSchemaDescription(prop) {
        const desc = this.schema?.properties?.[prop]?.description;
        return desc ? html`<div class="helper-text">${desc}</div>` : '';
    }
    
    /**
     * Format preset label for display
     * @param {string} preset - Preset ID
     * @returns {string}
     * @private
     */
    _formatPresetLabel(preset) {
        return preset
            .split(/[-_]/)
            .map(w => w.charAt(0).toUpperCase() + w.slice(1))
            .join(' ');
    }
}

customElements.define('lcards-card-config-section', LCARdSCardConfigSection);
