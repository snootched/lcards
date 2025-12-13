/**
 * LCARdS Position Picker
 *
 * Graphical 3x3 grid picker for selecting text/icon positions.
 * Shows a visual representation where users can click to select position.
 *
 * @example
 * <lcards-position-picker
 *   .value=${'top-left'}
 *   .label=${'Text Position'}
 *   .helper=${'Click to select position'}
 *   @value-changed=${this._handleChange}>
 * </lcards-position-picker>
 */

import { LitElement, html, css } from 'lit';

export class LCARdSPositionPicker extends LitElement {

    static get properties() {
        return {
            value: { type: String },      // Current position value
            label: { type: String },      // Label text
            helper: { type: String },     // Helper text
            disabled: { type: Boolean }   // Disabled state
        };
    }

    constructor() {
        super();
        this.value = 'center';
        this.label = '';
        this.helper = '';
        this.disabled = false;
    }

    static get styles() {
        return css`
            :host {
                display: block;
            }

            .position-picker {
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
                gap: 16px;
                align-items: center;
                padding: 8px;
            }

            .position-grid {
                display: grid;
                grid-template-columns: repeat(3, 40px);
                grid-template-rows: repeat(3, 40px);
                gap: 4px;
                background: var(--card-background-color, #fff);
                border: 2px solid var(--divider-color, #e0e0e0);
                border-radius: 8px;
                padding: 8px;
            }

            .position-cell {
                width: 40px;
                height: 40px;
                border: 2px solid var(--divider-color, #e0e0e0);
                border-radius: 4px;
                background: var(--secondary-background-color, #fafafa);
                cursor: pointer;
                transition: all 0.2s ease;
                display: flex;
                align-items: center;
                justify-content: center;
                position: relative;
            }

            .position-cell:hover:not(.disabled) {
                background: var(--primary-color, #03a9f4);
                border-color: var(--primary-color, #03a9f4);
                transform: scale(1.1);
            }

            .position-cell.selected {
                background: var(--primary-color, #03a9f4);
                border-color: var(--primary-color, #03a9f4);
                box-shadow: 0 0 0 2px var(--primary-color, #03a9f4);
            }

            .position-cell.selected::after {
                content: '';
                width: 12px;
                height: 12px;
                background: white;
                border-radius: 50%;
                position: absolute;
            }

            .position-cell.disabled {
                opacity: 0.5;
                cursor: not-allowed;
            }

            .position-label {
                font-size: 12px;
                color: var(--secondary-text-color, #727272);
                min-width: 120px;
                padding: 8px;
                background: var(--secondary-background-color, #fafafa);
                border-radius: 4px;
                text-align: center;
            }

            .helper-text {
                font-size: 12px;
                color: var(--secondary-text-color, #727272);
                line-height: 1.4;
                padding: 0 8px;
            }
        `;
    }

    /**
     * Map grid position to position value
     * Grid is [row][col] where 0,0 is top-left
     */
    _getPositionValue(row, col) {
        const positions = [
            ['top-left', 'top-center', 'top-right'],
            ['left-center', 'center', 'right-center'],
            ['bottom-left', 'bottom-center', 'bottom-right']
        ];
        return positions[row][col];
    }

    /**
     * Map position value to grid coordinates
     */
    _getGridCoordinates(value) {
        // Normalize edge shortcuts
        const normalized = {
            'top': 'top-center',
            'bottom': 'bottom-center',
            'left': 'left-center',
            'right': 'right-center'
        }[value] || value;

        const positions = {
            'top-left': [0, 0],
            'top-center': [0, 1],
            'top-right': [0, 2],
            'left-center': [1, 0],
            'center': [1, 1],
            'right-center': [1, 2],
            'bottom-left': [2, 0],
            'bottom-center': [2, 1],
            'bottom-right': [2, 2]
        };

        return positions[normalized] || [1, 1]; // Default to center
    }

    /**
     * Format position value for display
     */
    _formatPositionLabel(value) {
        if (!value) return 'None';

        // Convert kebab-case to Title Case
        return value
            .split('-')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    }

    /**
     * Check if cell is selected
     */
    _isSelected(row, col) {
        const [selectedRow, selectedCol] = this._getGridCoordinates(this.value);
        return row === selectedRow && col === selectedCol;
    }

    /**
     * Handle cell click
     */
    _handleCellClick(row, col) {
        if (this.disabled) return;

        const newValue = this._getPositionValue(row, col);

        // Update local value to trigger re-render
        this.value = newValue;

        // Fire value-changed event
        this.dispatchEvent(new CustomEvent('value-changed', {
            detail: { value: newValue },
            bubbles: true,
            composed: true
        }));
    }

    render() {
        return html`
            <div class="position-picker">
                ${this.label ? html`
                    <div class="label">${this.label}</div>
                ` : ''}

                <div class="grid-container">
                    <div class="position-grid">
                        ${[0, 1, 2].map(row => html`
                            ${[0, 1, 2].map(col => html`
                                <div
                                    class="position-cell ${this._isSelected(row, col) ? 'selected' : ''} ${this.disabled ? 'disabled' : ''}"
                                    @click=${() => this._handleCellClick(row, col)}
                                    title=${this._formatPositionLabel(this._getPositionValue(row, col))}>
                                </div>
                            `)}
                        `)}
                    </div>

                    <div class="position-label">
                        ${this._formatPositionLabel(this.value)}
                    </div>
                </div>

                ${this.helper ? html`
                    <div class="helper-text">${this.helper}</div>
                ` : ''}
            </div>
        `;
    }
}

customElements.define('lcards-position-picker', LCARdSPositionPicker);
