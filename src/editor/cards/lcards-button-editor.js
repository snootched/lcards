/**
 * LCARdS Button Editor
 * 
 * Visual editor for LCARdS Button card. Demonstrates tab structure and component integration.
 */

import { html } from 'lit';
import { LCARdSBaseEditor } from '../base/LCARdSBaseEditor.js';
import { BUTTON_SCHEMA } from '../schemas/button-schema.js';
import '../components/common/lcards-card-config-section.js';
import '../components/common/lcards-action-editor.js';
import '../components/yaml/lcards-monaco-yaml-editor.js';

export class LCARdSButtonEditor extends LCARdSBaseEditor {
    
    /**
     * Get tab definitions for Button editor
     * @returns {Array<Object>} Tab configuration
     * @override
     */
    _getTabDefinitions() {
        return [
            {
                label: 'Card Config',
                content: () => this._renderCardConfigTab()
            },
            {
                label: 'Actions',
                content: () => this._renderActionsTab()
            },
            {
                label: 'Advanced (YAML)',
                content: () => this._renderYamlTab()
            }
        ];
    }
    
    /**
     * Get JSON schema for Button
     * @returns {Object} JSON Schema
     * @override
     */
    _getSchema() {
        return BUTTON_SCHEMA;
    }
    
    /**
     * Render Card Configuration tab
     * @returns {TemplateResult}
     * @private
     */
    _renderCardConfigTab() {
        return html`
            <lcards-card-config-section
                .hass=${this.hass}
                .config=${this.config}
                .schema=${this._getSchema()}
                @config-changed=${this._handleSectionChange}>
            </lcards-card-config-section>
            
            <div class="section" style="margin-top: 24px;">
                <div class="section-header">Text Content</div>
                <div class="section-description">
                    Configure the button's text labels. Each text field can be positioned independently.
                </div>
                ${this._renderTextConfig()}
            </div>
            
            <div class="section" style="margin-top: 24px;">
                <div class="section-header">Icon</div>
                <div class="section-description">
                    Configure the button's icon. Use "entity" to automatically use the entity's icon.
                </div>
                ${this._renderIconConfig()}
            </div>
        `;
    }
    
    /**
     * Render text configuration
     * @returns {TemplateResult}
     * @private
     */
    _renderTextConfig() {
        const textConfig = this.config.text || {};
        const fieldNames = Object.keys(textConfig);
        
        // For now, just show the primary text field (name)
        // Future enhancement: allow adding/removing fields
        const nameField = textConfig.name || { content: '' };
        
        return html`
            <div class="form-row">
                <label>Primary Text Content</label>
                <input
                    type="text"
                    .value=${nameField.content || ''}
                    @input=${(e) => this._updateTextField('name', 'content', e.target.value)}
                    placeholder="Enter button text (supports {{entity.state}})">
                <div class="helper-text">
                    Supports templates like {{entity.state}}, {{entity.attributes.brightness}}
                </div>
            </div>
            
            ${nameField.position !== undefined ? html`
                <div class="form-row">
                    <label>Text Position</label>
                    <select 
                        .value=${nameField.position || 'center'}
                        @change=${(e) => this._updateTextField('name', 'position', e.target.value)}>
                        <option value="top-left">Top Left</option>
                        <option value="top-center">Top Center</option>
                        <option value="top-right">Top Right</option>
                        <option value="left-center">Left Center</option>
                        <option value="center">Center</option>
                        <option value="right-center">Right Center</option>
                        <option value="bottom-left">Bottom Left</option>
                        <option value="bottom-center">Bottom Center</option>
                        <option value="bottom-right">Bottom Right</option>
                    </select>
                </div>
            ` : ''}
        `;
    }
    
    /**
     * Update text field property
     * @param {string} fieldName - Field name (e.g., 'name')
     * @param {string} property - Property name (e.g., 'content')
     * @param {*} value - New value
     * @private
     */
    _updateTextField(fieldName, property, value) {
        const text = { ...this.config.text };
        text[fieldName] = {
            ...(text[fieldName] || {}),
            [property]: value
        };
        this._updateConfig({ text });
    }
    
    /**
     * Render icon configuration
     * @returns {TemplateResult}
     * @private
     */
    _renderIconConfig() {
        const icon = this.config.icon || {};
        const iconValue = typeof icon === 'string' ? icon : icon.icon;
        
        return html`
            <div class="form-row">
                <label>Icon</label>
                <input
                    type="text"
                    .value=${iconValue || ''}
                    @input=${(e) => this._updateIcon('icon', e.target.value)}
                    placeholder="mdi:lightbulb or 'entity' for entity icon">
                <div class="helper-text">
                    Use "entity" to use the entity's icon, or specify an MDI icon like "mdi:lightbulb"
                </div>
            </div>
            
            <div class="form-row">
                <label>Icon Area</label>
                <select 
                    .value=${this.config.icon_area || 'left'}
                    @change=${(e) => this._updateConfig({ icon_area: e.target.value })}>
                    <option value="left">Left</option>
                    <option value="right">Right</option>
                    <option value="top">Top</option>
                    <option value="bottom">Bottom</option>
                    <option value="none">None (Absolute Position)</option>
                </select>
                <div class="helper-text">
                    Where the icon's reserved space is located
                </div>
            </div>
        `;
    }
    
    /**
     * Update icon property
     * @param {string} property - Property name
     * @param {*} value - New value
     * @private
     */
    _updateIcon(property, value) {
        const currentIcon = this.config.icon || {};
        
        if (typeof currentIcon === 'string') {
            // If currently a simple string, convert to object
            this._updateConfig({
                icon: { icon: value }
            });
        } else {
            // If already an object, update the property
            this._updateConfig({
                icon: {
                    ...currentIcon,
                    [property]: value
                }
            });
        }
    }
    
    /**
     * Render Actions tab
     * @returns {TemplateResult}
     * @private
     */
    _renderActionsTab() {
        return html`
            <div class="section">
                <div class="section-header">Tap Action</div>
                <div class="section-description">
                    Action to perform when the button is tapped
                </div>
                <lcards-action-editor
                    .hass=${this.hass}
                    .action=${this.config.tap_action || { action: 'toggle' }}
                    @value-changed=${(e) => this._updateConfig({ tap_action: e.detail.value })}>
                </lcards-action-editor>
            </div>
            
            <div class="section">
                <div class="section-header">Double Tap Action (Optional)</div>
                <div class="section-description">
                    Action to perform when the button is double-tapped
                </div>
                <lcards-action-editor
                    .hass=${this.hass}
                    .action=${this.config.double_tap_action || { action: 'none' }}
                    @value-changed=${(e) => this._updateConfig({ double_tap_action: e.detail.value })}>
                </lcards-action-editor>
            </div>
            
            <div class="section">
                <div class="section-header">Hold Action (Optional)</div>
                <div class="section-description">
                    Action to perform when the button is held
                </div>
                <lcards-action-editor
                    .hass=${this.hass}
                    .action=${this.config.hold_action || { action: 'more-info' }}
                    @value-changed=${(e) => this._updateConfig({ hold_action: e.detail.value })}>
                </lcards-action-editor>
            </div>
        `;
    }
    
    /**
     * Render YAML editor tab
     * @returns {TemplateResult}
     * @private
     */
    _renderYamlTab() {
        return html`
            <div class="section">
                <div class="section-description">
                    Advanced YAML editor with validation. Changes made here will be reflected in the visual tabs.
                </div>
                <lcards-monaco-yaml-editor
                    .value=${this._yamlValue}
                    .schema=${this._getSchema()}
                    .errors=${this._validationErrors}
                    @value-changed=${this._handleYamlChange}>
                </lcards-monaco-yaml-editor>
            </div>
        `;
    }
    
    /**
     * Handle config change from section component
     * @param {CustomEvent} ev - config-changed event
     * @private
     */
    _handleSectionChange(ev) {
        this._updateConfig(ev.detail.config);
    }
}

customElements.define('lcards-button-editor', LCARdSButtonEditor);
