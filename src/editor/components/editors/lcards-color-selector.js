/**
 * LCARdS Color Selector
 *
 * Color picker component with LCARS palette presets and custom color input.
 * Supports both palette colors (token references) and custom hex/rgb values.
 *
 * @example
 * <lcards-color-selector
 *   .hass=${this.hass}
 *   .value=${'#ff9900'}
 *   @value-changed=${this._handleColorChange}>
 * </lcards-color-selector>
 */

import { LitElement, html, css } from 'lit';

export class LCARdSColorSelector extends LitElement {

    static get properties() {
        return {
            hass: { type: Object },
            value: { type: String },
            disabled: { type: Boolean }
        };
    }

    constructor() {
        super();
        this.value = '';
        this.disabled = false;
    }

    static get styles() {
        return css`
            :host {
                display: block;
            }

            .color-selector {
                display: flex;
                flex-direction: column;
                gap: 8px;
            }

            .color-input {
                display: flex;
                gap: 8px;
                align-items: center;
            }

            input[type="color"] {
                width: 60px;
                height: 40px;
                border: 1px solid var(--divider-color, #e0e0e0);
                border-radius: 4px;
                cursor: pointer;
            }

            input[type="color"]:disabled {
                opacity: 0.5;
                cursor: not-allowed;
            }

            .color-text {
                flex: 1;
            }

            .palette-section {
                margin-top: 8px;
            }

            .palette-label {
                font-size: 12px;
                font-weight: 500;
                color: var(--secondary-text-color, #727272);
                margin-bottom: 8px;
            }

            .palette-grid {
                display: grid;
                grid-template-columns: repeat(auto-fill, minmax(40px, 1fr));
                gap: 8px;
            }

            .palette-color {
                width: 40px;
                height: 40px;
                border-radius: 4px;
                cursor: pointer;
                border: 2px solid transparent;
                transition: all 0.2s ease;
            }

            .palette-color:hover {
                transform: scale(1.1);
                border-color: var(--primary-color, #03a9f4);
            }

            .palette-color.selected {
                border-color: var(--primary-color, #03a9f4);
                box-shadow: 0 0 0 2px var(--card-background-color, #fff);
            }
        `;
    }

    /**
     * LCARS color palette
     * @private
     */
    get _lcarsPalette() {
        return [
            { name: 'Orange', value: '#ff9900' },
            { name: 'Red', value: '#cc6666' },
            { name: 'Blue', value: '#9999cc' },
            { name: 'Purple', value: '#cc99cc' },
            { name: 'Tan', value: '#ffcc99' },
            { name: 'Yellow', value: '#ffff99' },
            { name: 'Pink', value: '#ff99cc' },
            { name: 'Peach', value: '#ffcc66' }
        ];
    }

    render() {
        const hasHaSelector = customElements.get('ha-selector');

        // Use ha-selector if available for better HA integration
        if (hasHaSelector) {
            return html`
                <ha-selector
                    .hass=${this.hass}
                    .selector=${{ color_rgb: {} }}
                    .value=${this.value}
                    .disabled=${this.disabled}
                    @value-changed=${this._handleValueChange}>
                </ha-selector>
            `;
        }

        // Fallback to custom implementation
        return html`
            <div class="color-selector">
                <div class="color-input">
                    <input
                        type="color"
                        .value=${this._normalizeColorForInput(this.value)}
                        ?disabled=${this.disabled}
                        @change=${this._handleColorInputChange}>
                    <ha-selector
                        .hass=${this.hass}
                        .selector=${{ text: {} }}
                        .value=${this.value || ''}
                        .disabled=${this.disabled}
                        class="color-text"
                        @value-changed=${this._handleTextChange}
                        placeholder="#ff9900 or rgb(255, 153, 0)">
                    </ha-selector>
                </div>

                <div class="palette-section">
                    <div class="palette-label">LCARS Palette</div>
                    <div class="palette-grid">
                        ${this._lcarsPalette.map(color => html`
                            <div
                                class="palette-color ${this.value === color.value ? 'selected' : ''}"
                                style="background-color: ${color.value}"
                                title="${color.name}"
                                @click=${() => this._selectPaletteColor(color.value)}>
                            </div>
                        `)}
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Normalize color value for HTML color input
     * @param {string} value - Color value
     * @returns {string} Hex color
     * @private
     */
    _normalizeColorForInput(value) {
        if (!value) return '#000000';
        
        // If already hex, return as-is
        if (value.startsWith('#')) {
            return value.length === 7 ? value : '#000000';
        }

        // For other formats, return black as default
        return '#000000';
    }

    /**
     * Handle color input change
     * @param {Event} ev - Change event
     * @private
     */
    _handleColorInputChange(ev) {
        const newValue = ev.target.value;
        this._emitChange(newValue);
    }

    /**
     * Handle text input change
     * @param {CustomEvent} ev - value-changed event
     * @private
     */
    _handleTextChange(ev) {
        const newValue = ev.detail.value;
        this._emitChange(newValue);
    }

    /**
     * Handle ha-selector value change
     * @param {CustomEvent} ev - value-changed event
     * @private
     */
    _handleValueChange(ev) {
        this._emitChange(ev.detail.value);
    }

    /**
     * Select a palette color
     * @param {string} color - Color value
     * @private
     */
    _selectPaletteColor(color) {
        if (this.disabled) return;
        this._emitChange(color);
    }

    /**
     * Emit value-changed event
     * @param {string} value - New color value
     * @private
     */
    _emitChange(value) {
        this.value = value;
        this.dispatchEvent(new CustomEvent('value-changed', {
            detail: { value },
            bubbles: true,
            composed: true
        }));
    }
}

customElements.define('lcards-color-selector', LCARdSColorSelector);
