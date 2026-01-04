/**
 * LCARdS Color Array Editor
 *
 * Simple component for editing arrays of colors.
 * Provides add/remove buttons and uses ha-selector for color picking.
 *
 * @element lcards-color-array
 * @fires colors-changed - When colors array changes (detail: { colors })
 *
 * @property {Array} colors - Array of color values
 * @property {String} label - Label for the color array
 * @property {String} description - Optional description text
 *
 * @example
 * <lcards-color-array
 *   .colors=${['#ff0000', '#00ff00']}
 *   .label=${"Series Colors"}
 *   .description=${"Colors for each data series"}
 *   @colors-changed=${(e) => this._handleColorsChange(e)}>
 * </lcards-color-array>
 */

import { LitElement, html, css } from 'lit';

export class LCARdSColorArray extends LitElement {

    static get properties() {
        return {
            colors: { type: Array },
            label: { type: String },
            description: { type: String },
            hass: { type: Object }
        };
    }

    constructor() {
        super();
        this.colors = [];
        this.label = '';
        this.description = '';
        this.hass = null;
    }

    static get styles() {
        return css`
            :host {
                display: block;
            }

            .color-array-container {
                margin-bottom: 16px;
            }

            .label {
                font-weight: 500;
                margin-bottom: 8px;
                font-size: 14px;
            }

            .description {
                font-size: 12px;
                color: var(--secondary-text-color);
                margin-bottom: 8px;
            }

            .color-list {
                display: flex;
                flex-direction: column;
                gap: 8px;
                margin-bottom: 8px;
            }

            .color-item {
                display: flex;
                gap: 8px;
                align-items: center;
            }

            .color-item ha-selector {
                flex: 1;
            }

            .add-button {
                margin-top: 8px;
            }
        `;
    }

    render() {
        const colors = this.colors || [];
        
        return html`
            <div class="color-array-container">
                ${this.label ? html`<div class="label">${this.label}</div>` : ''}
                ${this.description ? html`<div class="description">${this.description}</div>` : ''}
                
                <div class="color-list">
                    ${colors.map((color, index) => html`
                        <div class="color-item">
                            <ha-selector
                                .hass=${this.hass}
                                .selector=${{ color_rgb: {} }}
                                .value=${color}
                                .label=${"Color " + (index + 1)}
                                @value-changed=${(e) => this._updateColor(index, e.detail.value)}>
                            </ha-selector>
                            <ha-icon-button
                                @click=${() => this._removeColor(index)}>
                                <ha-icon icon="mdi:delete"></ha-icon>
                            </ha-icon-button>
                        </div>
                    `)}
                </div>
                
                <ha-button @click=${this._addColor} class="add-button">
                    <ha-icon icon="mdi:plus" slot="icon"></ha-icon>
                    Add Color
                </ha-button>
            </div>
        `;
    }

    /**
     * Update a color at a specific index
     * @param {number} index - Array index
     * @param {string} value - New color value
     * @private
     */
    _updateColor(index, value) {
        const newColors = [...(this.colors || [])];
        newColors[index] = value;
        this._emitChange(newColors);
    }

    /**
     * Add a new color to the array
     * @private
     */
    _addColor() {
        const newColors = [...(this.colors || []), '#ffffff'];
        this._emitChange(newColors);
    }

    /**
     * Remove a color from the array
     * @param {number} index - Array index
     * @private
     */
    _removeColor(index) {
        const newColors = [...(this.colors || [])];
        newColors.splice(index, 1);
        this._emitChange(newColors);
    }

    /**
     * Emit colors-changed event
     * @param {Array} colors - New colors array
     * @private
     */
    _emitChange(colors) {
        this.colors = colors;
        this.dispatchEvent(new CustomEvent('colors-changed', {
            detail: { colors },
            bubbles: true,
            composed: true
        }));
        this.requestUpdate();
    }
}

customElements.define('lcards-color-array', LCARdSColorArray);
