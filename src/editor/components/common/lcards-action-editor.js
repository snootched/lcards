/**
 * Action Editor Component
 * 
 * Provides a UI for configuring tap, double-tap, and hold actions
 * using Home Assistant's standard ui-action selector.
 */

import { LitElement, html, css } from 'lit';

export class LCARdSActionEditor extends LitElement {
    
    static get properties() {
        return {
            hass: { type: Object },
            action: { type: Object },
            label: { type: String }
        };
    }
    
    constructor() {
        super();
        this.action = { action: 'none' };
        this.label = 'Action';
    }
    
    static get styles() {
        return css`
            :host {
                display: block;
            }
            
            .action-editor {
                display: flex;
                flex-direction: column;
                gap: 8px;
            }
            
            label {
                font-weight: 500;
                color: var(--primary-text-color, #212121);
                font-size: 14px;
            }
        `;
    }
    
    render() {
        // Check if ha-selector is available (it should be in HA environment)
        // If not, we'll use a simple fallback
        const hasHaSelector = customElements.get('ha-selector');
        
        if (!hasHaSelector) {
            return this._renderSimpleFallback();
        }
        
        return html`
            <div class="action-editor">
                ${this.label ? html`<label>${this.label}</label>` : ''}
                <ha-selector
                    .hass=${this.hass}
                    .selector=${{ ui_action: {} }}
                    .value=${this.action}
                    @value-changed=${this._actionChanged}>
                </ha-selector>
            </div>
        `;
    }
    
    /**
     * Render simple fallback when ha-selector is not available
     * @private
     */
    _renderSimpleFallback() {
        const actionType = this.action?.action || 'none';
        
        return html`
            <div class="action-editor">
                ${this.label ? html`<label>${this.label}</label>` : ''}
                <select 
                    .value=${actionType}
                    @change=${this._handleSimpleChange}
                    style="padding: 8px; border: 1px solid var(--divider-color, #e0e0e0); border-radius: 4px;">
                    <option value="none">None</option>
                    <option value="toggle">Toggle</option>
                    <option value="more-info">More Info</option>
                    <option value="navigate">Navigate</option>
                    <option value="url">Open URL</option>
                    <option value="call-service">Call Service</option>
                </select>
                
                ${actionType === 'navigate' ? html`
                    <input
                        type="text"
                        .value=${this.action?.navigation_path || ''}
                        @input=${this._handleNavigationPath}
                        placeholder="Navigation path (e.g., /lovelace/0)"
                        style="padding: 8px; border: 1px solid var(--divider-color, #e0e0e0); border-radius: 4px;">
                ` : ''}
                
                ${actionType === 'url' ? html`
                    <input
                        type="text"
                        .value=${this.action?.url_path || ''}
                        @input=${this._handleUrlPath}
                        placeholder="URL (e.g., https://example.com)"
                        style="padding: 8px; border: 1px solid var(--divider-color, #e0e0e0); border-radius: 4px;">
                ` : ''}
                
                ${actionType === 'call-service' ? html`
                    <input
                        type="text"
                        .value=${this.action?.service || ''}
                        @input=${this._handleService}
                        placeholder="Service (e.g., light.turn_on)"
                        style="padding: 8px; border: 1px solid var(--divider-color, #e0e0e0); border-radius: 4px;">
                ` : ''}
            </div>
        `;
    }
    
    /**
     * Handle action change from ha-selector
     * @param {CustomEvent} ev - value-changed event
     * @private
     */
    _actionChanged(ev) {
        this.dispatchEvent(new CustomEvent('value-changed', {
            detail: { value: ev.detail.value },
            bubbles: true,
            composed: true
        }));
    }
    
    /**
     * Handle simple action type change
     * @param {Event} ev - Change event
     * @private
     */
    _handleSimpleChange(ev) {
        const newAction = { action: ev.target.value };
        this.dispatchEvent(new CustomEvent('value-changed', {
            detail: { value: newAction },
            bubbles: true,
            composed: true
        }));
    }
    
    /**
     * Handle navigation path input
     * @param {Event} ev - Input event
     * @private
     */
    _handleNavigationPath(ev) {
        const newAction = {
            ...this.action,
            navigation_path: ev.target.value
        };
        this.dispatchEvent(new CustomEvent('value-changed', {
            detail: { value: newAction },
            bubbles: true,
            composed: true
        }));
    }
    
    /**
     * Handle URL path input
     * @param {Event} ev - Input event
     * @private
     */
    _handleUrlPath(ev) {
        const newAction = {
            ...this.action,
            url_path: ev.target.value
        };
        this.dispatchEvent(new CustomEvent('value-changed', {
            detail: { value: newAction },
            bubbles: true,
            composed: true
        }));
    }
    
    /**
     * Handle service input
     * @param {Event} ev - Input event
     * @private
     */
    _handleService(ev) {
        const newAction = {
            ...this.action,
            service: ev.target.value
        };
        this.dispatchEvent(new CustomEvent('value-changed', {
            detail: { value: newAction },
            bubbles: true,
            composed: true
        }));
    }
}

customElements.define('lcards-action-editor', LCARdSActionEditor);
