/**
 * @fileoverview LCARdS Icon Area Picker
 *
 * Graphical picker for selecting icon area position (top, bottom, left, right, none).
 * Shows a visual representation with a center square representing the text area
 * and surrounding cells for icon placement.
 *
 * @example
 * <lcards-icon-area-picker
 *   .value=${'left'}
 *   .label=${'Icon Area'}
 *   .helper=${'Where icon's reserved space is'}
 *   @value-changed=${this._handleChange}>
 * </lcards-icon-area-picker>
 */

import { LitElement, html, css } from 'lit';

export class LCARdSIconAreaPicker extends LitElement {

    static get properties() {
        return {
            value: { type: String },      // Current icon area value
            label: { type: String },      // Label text
            helper: { type: String },     // Helper text
            disabled: { type: Boolean }   // Disabled state
        };
    }

    constructor() {
        super();
        this.value = 'left';
        this.label = '';
        this.helper = '';
        this.disabled = false;
    }

    static get styles() {
        return css`
            :host {
                display: block;
            }

            .icon-area-picker {
                display: flex;
                flex-direction: column;
                gap: 8px;
            }

            .label {
                font-weight: 500;
                color: var(--primary-text-color, #212121);
                font-size: 14px;
                padding: 2px 8px;
            }

            .grid-container {
                display: flex;
                gap: 12px;
                align-items: center;
                padding: 8px;
            }

            .icon-area-grid {
                display: grid;
                grid-template-columns: repeat(3, 50px);
                grid-template-rows: repeat(3, 50px);
                gap: 6px;
                background: var(--primary-background-color, #fff);
                border: 2px solid var(--divider-color, #e0e0e0);
                border-radius: 8px;
                padding: 12px;
            }

            .area-cell {
                width: 50px;
                height: 50px;
                border: 2px solid var(--divider-color, #e0e0e0);
                border-radius: 6px;
                cursor: pointer;
                transition: all 0.2s ease;
                display: flex;
                align-items: center;
                justify-content: center;
                position: relative;
                font-size: 20px;
            }

            .area-cell.clickable {
                background: var(--disabled-text-color, #9e9e9e);
            }

            .area-cell.clickable:hover:not(.disabled) {
                background: var(--primary-color, #03a9f4);
                border-color: var(--primary-color, #03a9f4);
                transform: scale(1.05);
            }

            .area-cell.selected {
                background: var(--primary-color, #03a9f4);
                border-color: var(--primary-color, #03a9f4);
                box-shadow: 0 0 0 2px var(--primary-color, #03a9f4);
            }

            .area-cell.selected::after {
                content: '✓';
                color: white;
                font-size: 24px;
                font-weight: bold;
            }

            .area-cell.center {
                background: var(--primary-background-color, #f5f5f5);
                border-color: var(--secondary-text-color, #757575);
                cursor: default;
                pointer-events: none;
            }

            .area-cell.center::before {
                content: 'Text';
                color: var(--secondary-text-color, #757575);
                font-size: 11px;
                font-weight: 500;
            }

            .area-cell.none-option {
                grid-column: 1 / -1;
                width: auto;
                background: var(--disabled-text-color, #9e9e9e);
                cursor: pointer;
                margin-top: 6px;
            }

            .area-cell.none-option:hover:not(.disabled) {
                background: var(--primary-color, #03a9f4);
                border-color: var(--primary-color, #03a9f4);
            }

            .area-cell.none-option.selected {
                background: var(--primary-color, #03a9f4);
            }

            .area-cell.none-option::before {
                content: 'None (No Divider)';
                color: white;
                font-size: 13px;
                font-weight: 500;
            }

            .area-cell.none-option.selected::before {
                content: '';
            }

            .area-cell.disabled {
                opacity: 0.5;
                cursor: not-allowed;
            }

            .selected-label {
                font-size: 14px;
                color: var(--primary-text-color, #212121);
                font-weight: 500;
                padding: 4px 8px;
                background: var(--secondary-background-color, #fafafa);
                border-radius: 4px;
                min-width: 120px;
                text-align: center;
            }

            .helper {
                font-size: 12px;
                color: var(--secondary-text-color, #757575);
                padding: 0 8px;
            }

            /* Corner cells - not clickable, visual only */
            .area-cell.corner {
                background: transparent;
                border: none;
                pointer-events: none;
            }
        `;
    }

    /**
     * Map grid position to icon area value
     * @param {number} row - Row index (0-2)
     * @param {number} col - Column index (0-2)
     * @returns {string|null} Icon area value or null for invalid
     * @private
     */
    _getAreaValue(row, col) {
        const map = {
            '0,1': 'top',      // Top center
            '1,0': 'left',     // Middle left
            '1,2': 'right',    // Middle right
            '2,1': 'bottom'    // Bottom center
        };
        return map[`${row},${col}`] || null;
    }

    /**
     * Map icon area value to grid coordinates
     * @param {string} value - Icon area value
     * @returns {Object|null} {row, col} or null
     * @private
     */
    _getGridCoordinates(value) {
        const map = {
            'top': { row: 0, col: 1 },
            'left': { row: 1, col: 0 },
            'right': { row: 1, col: 2 },
            'bottom': { row: 2, col: 1 }
        };
        return map[value] || null;
    }

    /**
     * Handle cell click
     * @param {number} row - Row index
     * @param {number} col - Column index
     * @private
     */
    _handleCellClick(row, col) {
        if (this.disabled) return;

        const newValue = this._getAreaValue(row, col);
        if (newValue) {
            this.value = newValue;
            this.dispatchEvent(new CustomEvent('value-changed', {
                detail: { value: newValue },
                bubbles: true,
                composed: true
            }));
        }
    }

    /**
     * Handle "none" option click
     * @private
     */
    _handleNoneClick() {
        if (this.disabled) return;

        this.value = 'none';
        this.dispatchEvent(new CustomEvent('value-changed', {
            detail: { value: 'none' },
            bubbles: true,
            composed: true
        }));
    }

    /**
     * Get display label for current value
     * @returns {string}
     * @private
     */
    _getDisplayLabel() {
        const labels = {
            'top': 'Top',
            'bottom': 'Bottom',
            'left': 'Left',
            'right': 'Right',
            'none': 'None (No Divider)'
        };
        return labels[this.value] || 'Left';
    }

    render() {
        const coords = this._getGridCoordinates(this.value);

        return html`
            <div class="icon-area-picker">
                ${this.label ? html`<div class="label">${this.label}</div>` : ''}

                <div class="grid-container">
                    <div class="icon-area-grid">
                        ${[0, 1, 2].map(row => [0, 1, 2].map(col => {
                            const areaValue = this._getAreaValue(row, col);

                            // Center cell (text area)
                            if (row === 1 && col === 1) {
                                return html`
                                    <div class="area-cell center"></div>
                                `;
                            }

                            // Corner cells (disabled)
                            if ((row === 0 && col === 0) ||
                                (row === 0 && col === 2) ||
                                (row === 2 && col === 0) ||
                                (row === 2 && col === 2)) {
                                return html`
                                    <div class="area-cell corner"></div>
                                `;
                            }

                            // Clickable cells (top, bottom, left, right)
                            const isSelected = coords && coords.row === row && coords.col === col && this.value !== 'none';
                            return html`
                                <div
                                    class="area-cell clickable ${isSelected ? 'selected' : ''} ${this.disabled ? 'disabled' : ''}"
                                    @click=${() => this._handleCellClick(row, col)}>
                                </div>
                            `;
                        }))}

                        <!-- None option -->
                        <div
                            class="area-cell none-option ${this.value === 'none' ? 'selected' : ''} ${this.disabled ? 'disabled' : ''}"
                            @click=${this._handleNoneClick}>
                        </div>
                    </div>

                    <div class="selected-label">
                        ${this._getDisplayLabel()}
                    </div>
                </div>

                ${this.helper ? html`<div class="helper">${this.helper}</div>` : ''}
            </div>
        `;
    }
}

customElements.define('lcards-icon-area-picker', LCARdSIconAreaPicker);
