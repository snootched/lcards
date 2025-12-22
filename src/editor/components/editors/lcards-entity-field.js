/**
 * LCARdS Entity Field
 *
 * Wrapper component for entity picker with optional domain filtering and
 * device class filtering. Provides a consistent interface for entity selection.
 *
 * @example
 * <lcards-entity-field
 *   .hass=${this.hass}
 *   .value=${'light.living_room'}
 *   .domain=${'light'}
 *   @value-changed=${this._handleEntityChange}>
 * </lcards-entity-field>
 */

import { LitElement, html, css } from 'lit';

export class LCARdSEntityField extends LitElement {

    static get properties() {
        return {
            hass: { type: Object },
            value: { type: String },
            domain: { type: String },           // Optional domain filter (e.g., 'light', 'sensor')
            deviceClass: { type: String },      // Optional device class filter
            disabled: { type: Boolean },
            label: { type: String },
            helper: { type: String }
        };
    }

    constructor() {
        super();
        this.value = '';
        this.domain = '';
        this.deviceClass = '';
        this.disabled = false;
        this.label = '';
        this.helper = '';
    }

    static get styles() {
        return css`
            :host {
                display: block;
            }

            .entity-field {
                display: flex;
                flex-direction: column;
                gap: 8px;
            }

            label {
                font-weight: 500;
                color: var(--primary-text-color, #212121);
                font-size: 14px;
            }

            .helper-text {
                font-size: 12px;
                color: var(--secondary-text-color, #727272);
                line-height: 1.4;
            }

            ha-entity-picker {
                width: 100%;
            }
        `;
    }

    render() {
        const hasEntityPicker = customElements.get('ha-entity-picker');
        const hasSelector = customElements.get('ha-selector');

        return html`
            <div class="entity-field">
                ${this.label ? html`<label>${this.label}</label>` : ''}
                
                ${hasEntityPicker ? this._renderEntityPicker() : 
                  hasSelector ? this._renderSelector() :
                  this._renderFallback()}
                
                ${this.helper ? html`<div class="helper-text">${this.helper}</div>` : ''}
            </div>
        `;
    }

    /**
     * Render ha-entity-picker (preferred)
     * @private
     */
    _renderEntityPicker() {
        const includeDomains = this.domain ? [this.domain] : undefined;

        return html`
            <ha-entity-picker
                .hass=${this.hass}
                .value=${this.value}
                .includeDomains=${includeDomains}
                .disabled=${this.disabled}
                @value-changed=${this._handleValueChange}>
            </ha-entity-picker>
        `;
    }

    /**
     * Render ha-selector (alternative)
     * @private
     */
    _renderSelector() {
        const selectorConfig = {
            entity: {}
        };

        if (this.domain) {
            selectorConfig.entity.domain = this.domain;
        }

        if (this.deviceClass) {
            selectorConfig.entity.device_class = this.deviceClass;
        }

        return html`
            <ha-selector
                .hass=${this.hass}
                .selector=${selectorConfig}
                .value=${this.value}
                .disabled=${this.disabled}
                @value-changed=${this._handleValueChange}>
            </ha-selector>
        `;
    }

    /**
     * Render fallback input
     * @private
     */
    _renderFallback() {
        return html`
            <input
                type="text"
                .value=${this.value || ''}
                ?disabled=${this.disabled}
                @input=${this._handleInputChange}
                placeholder="entity_id (e.g., light.living_room)"
                style="
                    width: 100%;
                    padding: 8px 12px;
                    border: 1px solid var(--divider-color, #e0e0e0);
                    border-radius: 4px;
                    font-size: 14px;
                    font-family: inherit;
                    background: var(--card-background-color, #fff);
                    color: var(--primary-text-color, #212121);
                ">
        `;
    }

    /**
     * Handle value change from picker/selector
     * @param {CustomEvent} ev - value-changed event
     * @private
     */
    _handleValueChange(ev) {
        this.value = ev.detail.value;
        this._emitChange();
    }

    /**
     * Handle input change from fallback
     * @param {Event} ev - input event
     * @private
     */
    _handleInputChange(ev) {
        this.value = ev.target.value;
        this._emitChange();
    }

    /**
     * Emit value-changed event
     * @private
     */
    _emitChange() {
        this.dispatchEvent(new CustomEvent('value-changed', {
            detail: { value: this.value },
            bubbles: true,
            composed: true
        }));
    }
}

customElements.define('lcards-entity-field', LCARdSEntityField);
