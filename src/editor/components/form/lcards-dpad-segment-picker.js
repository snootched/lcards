/**
 * LCARdS D-Pad Segment Picker
 *
 * Visual 3x3 grid picker for selecting dpad segments.
 * Shows a visual representation where users can click to select which segment to edit.
 * Based on lcards-position-picker.js pattern.
 *
 * @example
 * <lcards-dpad-segment-picker
 *   .value=${'up'}
 *   .segmentConfigs=${this.config.dpad?.segments || {}}
 *   .label=${'Select Segment'}
 *   @value-changed=${this._handleSegmentSelect}>
 * </lcards-dpad-segment-picker>
 */

import { LitElement, html, css } from 'lit';

// Constants
const GRID_SIZE = 3;
const GRID_INDICES = [0, 1, 2];
const EMPTY_LABEL = 'None';

export class LCARdSDpadSegmentPicker extends LitElement {

    static get properties() {
        return {
            value: { type: String },              // Currently selected segment ID
            segmentConfigs: { type: Object },     // Segment configurations (to show indicators)
            label: { type: String },              // Label text
            helper: { type: String },             // Helper text
            disabled: { type: Boolean }           // Disabled state
        };
    }

    constructor() {
        super();
        this.value = 'center';
        this.segmentConfigs = {};
        this.label = '';
        this.helper = '';
        this.disabled = false;
    }

    static get styles() {
        return css`
            :host {
                display: block;
            }

            .segment-picker {
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

            .segment-grid {
                display: grid;
                grid-template-columns: repeat(3, 60px);
                grid-template-rows: repeat(3, 60px);
                gap: 8px;
                background: var(--card-background-color, #fff);
                border: 2px solid var(--divider-color, #e0e0e0);
                border-radius: 8px;
                padding: 12px;
            }

            .segment-cell {
                width: 60px;
                height: 60px;
                border: 2px solid var(--divider-color, #e0e0e0);
                border-radius: 6px;
                background: var(--disabled-text-color, #9e9e9e);
                cursor: pointer;
                transition: all 0.2s ease;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                position: relative;
                font-size: 11px;
                color: var(--primary-background-color, #fff);
                font-weight: 500;
                text-align: center;
                line-height: 1.2;
            }

            .segment-cell:hover:not(.disabled) {
                background: var(--primary-color, #03a9f4);
                border-color: var(--primary-color, #03a9f4);
                transform: scale(1.05);
            }

            .segment-cell.selected {
                background: var(--primary-color, #03a9f4);
                border-color: var(--primary-color, #03a9f4);
                box-shadow: 0 0 0 2px var(--primary-color, #03a9f4);
            }

            .segment-cell.selected::after {
                content: '✓';
                position: absolute;
                top: 2px;
                right: 4px;
                color: white;
                font-size: 16px;
                font-weight: bold;
            }

            .segment-cell.configured {
                background: var(--success-color, #4caf50);
                border-color: var(--success-color, #4caf50);
            }

            .segment-cell.configured:not(.selected)::before {
                content: '●';
                position: absolute;
                top: 2px;
                left: 4px;
                color: white;
                font-size: 12px;
            }

            .segment-cell.disabled {
                opacity: 0.5;
                cursor: not-allowed;
            }

            .segment-icon {
                font-size: 18px;
                margin-bottom: 2px;
            }

            .segment-label {
                font-size: 9px;
                text-transform: uppercase;
                opacity: 0.9;
            }

            .segment-info {
                flex: 1;
                display: flex;
                flex-direction: column;
                gap: 8px;
                min-width: 180px;
            }

            .segment-name {
                font-size: 14px;
                color: var(--primary-text-color, #212121);
                font-weight: 600;
                padding: 8px;
                background: var(--secondary-background-color, #fafafa);
                border-radius: 4px;
                text-align: center;
            }

            .segment-status {
                font-size: 12px;
                color: var(--secondary-text-color, #727272);
                padding: 8px;
                background: var(--secondary-background-color, #fafafa);
                border-radius: 4px;
            }

            .status-item {
                display: flex;
                align-items: center;
                gap: 6px;
                margin-bottom: 4px;
            }

            .status-item:last-child {
                margin-bottom: 0;
            }

            .status-icon {
                width: 16px;
                height: 16px;
                border-radius: 50%;
            }

            .status-icon.configured {
                background: var(--success-color, #4caf50);
            }

            .status-icon.empty {
                background: var(--disabled-text-color, #9e9e9e);
            }

            .helper-text {
                font-size: 12px;
                color: var(--secondary-text-color, #727272);
                line-height: 1.4;
                padding: 0 8px;
            }

            .legend {
                display: flex;
                gap: 16px;
                font-size: 11px;
                color: var(--secondary-text-color, #727272);
                padding: 8px;
                justify-content: center;
            }

            .legend-item {
                display: flex;
                align-items: center;
                gap: 4px;
            }

            .legend-dot {
                width: 8px;
                height: 8px;
                border-radius: 50%;
            }

            .legend-dot.configured {
                background: var(--success-color, #4caf50);
            }

            .legend-dot.selected {
                background: var(--primary-color, #03a9f4);
            }
        `;
    }

    /**
     * Map grid position to segment ID
     * Grid is [row][col] where 0,0 is top-left
     */
    _getSegmentId(row, col) {
        const segments = [
            ['up-left', 'up', 'up-right'],
            ['left', 'center', 'right'],
            ['down-left', 'down', 'down-right']
        ];
        return segments[row][col];
    }

    /**
     * Map segment ID to grid coordinates
     */
    _getGridCoordinates(segmentId) {
        const positions = {
            'up-left': [0, 0],
            'up': [0, 1],
            'up-right': [0, 2],
            'left': [1, 0],
            'center': [1, 1],
            'right': [1, 2],
            'down-left': [2, 0],
            'down': [2, 1],
            'down-right': [2, 2]
        };
        return positions[segmentId] || [1, 1]; // Default to center
    }

    /**
     * Get icon for segment
     */
    _getSegmentIcon(segmentId) {
        const icons = {
            'up-left': '↖',
            'up': '↑',
            'up-right': '↗',
            'left': '←',
            'center': '●',
            'right': '→',
            'down-left': '↙',
            'down': '↓',
            'down-right': '↘'
        };
        return icons[segmentId] || '●';
    }

    /**
     * Format segment ID for display
     */
    _formatSegmentLabel(segmentId) {
        if (!segmentId) return EMPTY_LABEL;
        
        return segmentId
            .split('-')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    }

    /**
     * Check if segment is configured
     */
    _isSegmentConfigured(segmentId) {
        const config = this.segmentConfigs[segmentId];
        if (!config) return false;
        
        // Check if any meaningful config exists
        return !!(
            config.entity ||
            config.tap_action ||
            config.hold_action ||
            config.double_tap_action ||
            config.style ||
            (config.animations && config.animations.length > 0)
        );
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

        const newValue = this._getSegmentId(row, col);

        // Update local value to trigger re-render
        this.value = newValue;

        // Fire value-changed event
        this.dispatchEvent(new CustomEvent('value-changed', {
            detail: { value: newValue },
            bubbles: true,
            composed: true
        }));
    }

    /**
     * Get status info for currently selected segment
     */
    _getSegmentStatus(segmentId) {
        const config = this.segmentConfigs[segmentId];
        if (!config) {
            return { configured: false, items: [] };
        }

        const items = [];
        if (config.entity) items.push(`Entity: ${config.entity}`);
        if (config.tap_action) items.push(`Tap: ${config.tap_action.action || 'configured'}`);
        if (config.hold_action) items.push(`Hold: ${config.hold_action.action || 'configured'}`);
        if (config.animations && config.animations.length > 0) {
            items.push(`${config.animations.length} animation(s)`);
        }

        return {
            configured: items.length > 0,
            items
        };
    }

    render() {
        const status = this._getSegmentStatus(this.value);

        return html`
            <div class="segment-picker">
                ${this.label ? html`
                    <div class="label">${this.label}</div>
                ` : ''}

                <div class="grid-container">
                    <div class="segment-grid">
                        ${GRID_INDICES.map(row => html`
                            ${GRID_INDICES.map(col => {
                                const segmentId = this._getSegmentId(row, col);
                                const isSelected = this._isSelected(row, col);
                                const isConfigured = this._isSegmentConfigured(segmentId);
                                
                                return html`
                                    <div
                                        class="segment-cell ${isSelected ? 'selected' : ''} ${isConfigured ? 'configured' : ''} ${this.disabled ? 'disabled' : ''}"
                                        @click=${() => this._handleCellClick(row, col)}
                                        title="${this._formatSegmentLabel(segmentId)}">
                                        <div class="segment-icon">${this._getSegmentIcon(segmentId)}</div>
                                        <div class="segment-label">${segmentId}</div>
                                    </div>
                                `;
                            })}
                        `)}
                    </div>

                    <div class="segment-info">
                        <div class="segment-name">
                            ${this._formatSegmentLabel(this.value)}
                        </div>

                        <div class="segment-status">
                            ${status.configured ? html`
                                ${status.items.map(item => html`
                                    <div class="status-item">
                                        <div class="status-icon configured"></div>
                                        <span>${item}</span>
                                    </div>
                                `)}
                            ` : html`
                                <div class="status-item">
                                    <div class="status-icon empty"></div>
                                    <span>Not configured</span>
                                </div>
                            `}
                        </div>
                    </div>
                </div>

                <div class="legend">
                    <div class="legend-item">
                        <div class="legend-dot selected"></div>
                        <span>Selected</span>
                    </div>
                    <div class="legend-item">
                        <div class="legend-dot configured"></div>
                        <span>Configured</span>
                    </div>
                </div>

                ${this.helper ? html`
                    <div class="helper-text">${this.helper}</div>
                ` : ''}
            </div>
        `;
    }
}

customElements.define('lcards-dpad-segment-picker', LCARdSDpadSegmentPicker);
