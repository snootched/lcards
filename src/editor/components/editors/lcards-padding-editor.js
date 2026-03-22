/**
 * @fileoverview LCARdS Padding Editor
 *
 * Compact visual padding editor with 4 inputs arranged in T/R/B/L pattern.
 * Shows inputs in a cross layout around a center square representing the content.
 *
 * @example
 * <lcards-padding-editor
 *   .editor=${this.editor}
 *   path="icon_style.padding"
 *   label="Padding">
 * </lcards-padding-editor>
 */

import { LitElement, html, css } from 'lit';

export class LCARdSPaddingEditor extends LitElement {

    static get properties() {
        return {
            editor: { type: Object },     // Parent editor reference
            path: { type: String },       // Config path (e.g., "icon_style.padding")
            label: { type: String },      // Label text
            helper: { type: String },     // Helper text
            disabled: { type: Boolean }   // Disabled state
        };
    }

    constructor() {
        super();
        /** @type {any} */
        this.hass = undefined;
        this.editor = null;
        this.path = '';
        this.label = 'Padding';
        this.helper = '';
        this.disabled = false;
    }

    static get styles() {
        return css`
            :host {
                display: block;
            }

            .padding-editor {
                display: flex;
                flex-direction: column;
                gap: 12px;
                padding: 8px;
            }

            .label {
                font-weight: 500;
                color: var(--primary-text-color, #212121);
                font-size: 14px;
                padding: 2px 8px;
            }

            .padding-grid {
                display: grid;
                grid-template-columns: 80px 80px 80px;
                grid-template-rows: 60px 60px 60px;
                gap: 8px;
                justify-content: center;
                align-items: center;
                padding: 16px 16px 24px 16px;
                background: var(--primary-background-color, #fff);
                border: 2px solid var(--divider-color, #e0e0e0);
                border-radius: var(--ha-card-border-radius, 12px);
            }

            .padding-cell {
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                gap: 4px;
            }

            .padding-cell.top {
                grid-column: 2;
                grid-row: 1;
            }

            .padding-cell.left {
                grid-column: 1;
                grid-row: 2;
            }

            .padding-cell.center {
                grid-column: 2;
                grid-row: 2;
                background: var(--primary-color, #f5f5f5);
                border: 2px solid var(--divider-color, #e0e0e0);
                border-radius: 12px;
                font-size: 12px;
                color: var(--text-primary-color, #757575);
                font-weight: 600;
                text-transform: uppercase;
                letter-spacing: 0.5px;
            }

            .padding-cell.right {
                grid-column: 3;
                grid-row: 2;
            }

            .padding-cell.bottom {
                grid-column: 2;
                grid-row: 3;
            }

            .padding-label {
                font-size: 11px;
                font-weight: 700;
                color: var(--secondary-text-color, #757575);
                text-transform: uppercase;
                letter-spacing: 1px;
                margin-bottom: 2px;
            }

            input[type="number"] {
                width: 70px;
                height: 36px;
                padding: 8px;
                border: 2px solid var(--divider-color, #e0e0e0);
                border-radius: 4px;
                background: var(--card-background-color, #fff);
                color: var(--primary-text-color, #212121);
                font-size: 14px;
                font-weight: 500;
                text-align: center;
                font-family: inherit;
                transition: all 0.2s ease;
                box-sizing: border-box;
            }

            input[type="number"]:focus {
                outline: none;
                border-color: var(--primary-color, #03a9f4);
                box-shadow: 0 0 0 1px var(--primary-color, #03a9f4);
            }

            input[type="number"]:hover:not(:disabled) {
                border-color: var(--primary-color, #03a9f4);
            }

            input[type="number"]:disabled {
                opacity: 0.5;
                cursor: not-allowed;
                background: var(--disabled-color, #f0f0f0);
            }

            .helper {
                font-size: 12px;
                color: var(--secondary-text-color, #757575);
                padding: 0 8px;
                font-style: italic;
            }
        `;
    }

    /**
     * Get current padding value
     * @returns {Object|number|null}
     * @private
     */
    _getValue() {
        return this.editor?._getConfigValue(this.path);
    }

    /**
     * Get padding for specific side
     * @param {string} side - 'top', 'right', 'bottom', or 'left'
     * @returns {number|string}
     * @private
     */
    _getSideValue(side) {
        const value = this._getValue();
        if (value === null || value === undefined) return '';
        if (typeof value === 'number') return value;
        if (typeof value === 'object') return value[side] || '';
        return '';
    }

    /**
     * Check if using uniform padding
     * @returns {boolean}
     * @private
     */
    _isUniform() {
        const value = this._getValue();
        return typeof value === 'number' || value === null || value === undefined;
    }

    /**
     * Handle selector change
     * @param {string} side - 'top', 'right', 'bottom', or 'left'
     * @param {CustomEvent} event - value-changed event from ha-selector
     * @private
     */
    _handleSelectorChange(side, event) {
        if (this.disabled) return;

        const newValue = event.detail.value;
        const currentValue = this._getValue();

        if (typeof currentValue === 'number' || currentValue === null || currentValue === undefined) {
            // Converting from uniform to object
            const uniformVal = currentValue || 0;
            const newPadding = {
                top: uniformVal,
                right: uniformVal,
                bottom: uniformVal,
                left: uniformVal
            };
            newPadding[side] = newValue === '' ? 0 : Number(newValue);
            this.editor._setConfigValue(this.path, newPadding);
        } else {
            // Already an object, just update the side
            const newPadding = { ...currentValue };
            newPadding[side] = newValue === '' ? 0 : Number(newValue);
            this.editor._setConfigValue(this.path, newPadding);
        }

        this.requestUpdate();
    }

    /**
     * Render padding input for a side
     * @param {string} side - 'top', 'right', 'bottom', or 'left'
     * @param {string} label - Label for the side
     * @returns {TemplateResult}
     * @private
     */
    _renderSideInput(side, label) {
        const value = this._getSideValue(side);
        return html`
            <div class="padding-cell ${side}">
                <div class="padding-label">${label}</div>
                <ha-selector
                    // @ts-ignore - TS2339: auto-suppressed
                    .hass=${this.hass}
                    .selector=${{
                        number: {
                            min: 0,
                            step: 1,
                            mode: 'box'
                        }
                    }}
                    .value=${value}
                    .disabled=${this.disabled}
                    @value-changed=${(e) => this._handleSelectorChange(side, e)}>
                </ha-selector>
            </div>
        `;
    }

    render() {
        return html`
            <div class="padding-editor">
                ${this.label ? html`<div class="label">${this.label}</div>` : ''}

                <div class="padding-grid">
                    ${this._renderSideInput('top', 'TOP')}
                    ${this._renderSideInput('left', 'LEFT')}

                    <div class="padding-cell center">
                        Content
                    </div>

                    ${this._renderSideInput('right', 'RIGHT')}
                    ${this._renderSideInput('bottom', 'BOTTOM')}
                </div>

                ${this.helper ? html`<div class="helper">${this.helper}</div>` : ''}
            </div>
        `;
    }
}

customElements.define('lcards-padding-editor', LCARdSPaddingEditor);
