/**
 * @fileoverview LCARdS Slider Range Visualizer
 *
 * Interactive visual component for configuring slider ranges and direction.
 * Shows relationship between display range (visual scale) and control range (settable values).
 * Includes direction presets and live preview.
 *
 * @fires range-changed - When any range value changes
 * @fires direction-changed - When direction preset is selected
 */

import { LitElement, html, css } from 'lit';
import { lcardsLog } from '../../../utils/lcards-logging.js';

export class LCARdSSliderRangeVisualizer extends LitElement {
    static get properties() {
        return {
            // Range values
            displayMin: { type: Number },
            displayMax: { type: Number },
            controlMin: { type: Number },
            controlMax: { type: Number },

            // Direction settings
            orientation: { type: String },
            invertFill: { type: Boolean },
            invertValue: { type: Boolean },

            // Current value for preview
            currentValue: { type: Number },

            // Display options
            unit: { type: String },
            disabled: { type: Boolean },

            // Internal state
            _dragging: { type: Object, state: true },
            _previewValue: { type: Number, state: true }
        };
    }

    static get styles() {
        return css`
            :host {
                display: block;
                padding: 16px;
                background: var(--card-background-color);
                border-radius: var(--ha-card-border-radius, 12px);
                border: 1px solid var(--divider-color);
            }

            .section {
                margin-bottom: 24px;
            }

            .section:last-child {
                margin-bottom: 0;
            }

            .section-header {
                font-weight: 600;
                font-size: 14px;
                margin-bottom: 12px;
                color: var(--primary-text-color);
                display: flex;
                align-items: center;
                gap: 8px;
            }

            .section-header ha-icon {
                --mdc-icon-size: 20px;
                color: var(--primary-color);
            }

            /* Range Visualizer */
            .range-visualizer {
                position: relative;
                padding: 8px 0;
            }

            .range-bar {
                position: relative;
                height: 40px;
                margin: 12px 0;
                background: var(--disabled-color);
                border-radius: 20px;
                overflow: visible;
            }

            .range-bar-label {
                position: absolute;
                top: -20px;
                left: 0;
                font-size: 12px;
                font-weight: 500;
                color: var(--secondary-text-color);
            }

            .range-bar-values {
                position: absolute;
                bottom: -20px;
                left: 0;
                right: 0;
                display: flex;
                justify-content: space-between;
                font-size: 11px;
                color: var(--secondary-text-color);
            }

            .control-range-overlay {
                position: absolute;
                top: 0;
                height: 100%;
                background: var(--primary-color);
                opacity: 0.6;
                border-radius: 8px;
                transition: left 0.1s, width 0.1s;
            }

            .range-handle {
                position: absolute;
                top: 50%;
                width: 20px;
                height: 20px;
                background: var(--primary-color);
                border: 3px solid var(--card-background-color);
                border-radius: 50%;
                transform: translate(-50%, -50%);
                cursor: grab;
                z-index: 10;
                box-shadow: 0 2px 8px rgba(0,0,0,0.2);
                transition: transform 0.1s, box-shadow 0.1s;
            }

            .range-handle:hover {
                transform: translate(-50%, -50%) scale(1.15);
                box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            }

            .range-handle:active {
                cursor: grabbing;
                box-shadow: 0 2px 6px rgba(0,0,0,0.4);
            }

            .range-handle-label {
                position: absolute;
                top: -30px;
                left: 50%;
                transform: translateX(-50%);
                background: var(--primary-color);
                color: white;
                padding: 3px 10px;
                border-radius: 4px;
                font-size: 13px;
                font-weight: 600;
                white-space: nowrap;
                pointer-events: none;
                opacity: 1; /* Always visible */
                transition: opacity 0.2s;
            }

            .range-handle:hover .range-handle-label,
            .range-handle:active .range-handle-label {
                opacity: 1;
            }

            /* Hide edge labels - they're misleading */
            .range-bar-values {
                display: none;
            }

            /* Preset Buttons */
            .preset-buttons {
                display: grid;
                grid-template-columns: repeat(2, 1fr);
                gap: 6px;
                margin-top: 8px;
            }

            .preset-button {
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 6px;
                padding: 8px 12px;
                background: var(--secondary-background-color);
                border: 2px solid var(--divider-color);
                border-radius: 8px;
                cursor: pointer;
                transition: all 0.2s;
                font-size: 12px;
                font-weight: 600;
            }

            .preset-button:hover {
                background: var(--primary-color);
                color: white;
                border-color: var(--primary-color);
            }

            .preset-button ha-icon {
                --mdc-icon-size: 18px;
            }

            /* Direction Presets */
            .direction-grid {
                display: grid;
                grid-template-columns: repeat(4, 1fr);
                gap: 6px;
            }

            .direction-button {
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 4px;
                padding: 10px 6px;
                background: var(--secondary-background-color);
                border: 2px solid var(--divider-color);
                border-radius: 8px;
                cursor: pointer;
                transition: all 0.2s;
                position: relative;
            }

            .direction-button.active {
                background: var(--primary-color);
                color: white;
                border-color: var(--primary-color);
            }

            .direction-button:hover:not(.active) {
                border-color: var(--primary-color);
            }

            .direction-arrow {
                font-size: 24px;
                font-weight: bold;
                line-height: 1;
            }

            .direction-label {
                font-size: 10px;
                font-weight: 600;
                text-align: center;
            }

            .direction-values {
                font-size: 9px;
                opacity: 0.7;
                text-align: center;
            }

            /* Preview */
            .preview-container {
                margin-top: 12px;
                padding: 20px;
                background: var(--card-background-color);
                border-radius: 12px;
                border: 2px solid var(--primary-color);
                box-shadow: 0 4px 12px rgba(0,0,0,0.1);
            }

            .preview-label {
                font-size: 14px;
                font-weight: 700;
                margin-bottom: 12px;
                color: var(--primary-text-color);
                text-transform: uppercase;
                letter-spacing: 0.5px;
            }

            .preview-slider {
                position: relative;
                height: 32px;
                background: var(--disabled-color);
                border-radius: 16px;
                overflow: hidden;
            }

            .preview-fill {
                position: absolute;
                top: 0;
                height: 100%;
                background: var(--primary-color);
                transition: width 0.2s, left 0.2s;
            }

            .preview-thumb {
                position: absolute;
                top: 50%;
                width: 24px;
                height: 24px;
                background: white;
                border: 3px solid var(--primary-color);
                border-radius: 50%;
                transform: translate(-50%, -50%);
                box-shadow: 0 2px 6px rgba(0,0,0,0.2);
                transition: left 0.2s;
            }

            .preview-value {
                text-align: center;
                margin-top: 8px;
                font-size: 13px;
                font-weight: 600;
                color: var(--primary-text-color);
            }

            /* Manual Input Fields */
            .manual-inputs {
                display: grid;
                grid-template-columns: repeat(2, 1fr);
                gap: 8px;
                margin-top: 8px;
            }

            .input-group {
                display: flex;
                flex-direction: column;
                gap: 4px;
            }

            .input-label {
                font-size: 11px;
                font-weight: 600;
                color: var(--secondary-text-color);
                text-transform: uppercase;
            }

            .input-field {
                padding: 6px 8px;
                border: 1px solid var(--divider-color);
                border-radius: 4px;
                background: var(--card-background-color);
                color: var(--primary-text-color);
                font-size: 13px;
                width: 100%;
            }

            .input-field:focus {
                outline: none;
                border-color: var(--primary-color);
            }
        `;
    }

    constructor() {
        super();

        // Default values
        this.displayMin = 0;
        this.displayMax = 100;
        this.controlMin = 0;
        this.controlMax = 100;
        this.orientation = 'horizontal';
        this.invertFill = false;
        this.invertValue = false;
        this.currentValue = 50;
        this.unit = '';
        this.disabled = false;

        this._dragging = null;
        this._previewValue = 50;
    }

    connectedCallback() {
        super.connectedCallback();
        this._previewValue = this.currentValue;
    }

    /**
     * Get the buffer range (extended range for visualization)
     * Uses a stable range to prevent feedback loop during dragging
     */
    _getBufferRange() {
        // Use the larger of current display range or a minimum range of 10
        const displayRange = Math.max(this.displayMax - this.displayMin, 10);
        const buffer = displayRange * 0.15; // Reduced from 0.2 for less sensitivity

        return {
            min: this.displayMin - buffer,
            max: this.displayMax + buffer,
            range: displayRange + (buffer * 2)
        };
    }

    /**
     * Calculate percentage position for a value within buffer range
     */
    _valueToPercent(value) {
        const buffer = this._getBufferRange();
        return ((value - buffer.min) / buffer.range) * 100;
    }

    /**
     * Calculate value from percentage position within buffer range
     */
    _percentToValue(percent) {
        const buffer = this._getBufferRange();
        return buffer.min + (percent / 100) * buffer.range;
    }

    /**
     * Get relationship between control and display ranges
     */
    _getRelationship() {
        if (this.controlMin === this.displayMin && this.controlMax === this.displayMax) {
            return 'simple';
        }
        if (this.controlMin > this.displayMin || this.controlMax < this.displayMax) {
            return 'clamped';
        }
        return 'extended';
    }

    /**
     * Apply range preset
     */
    _applyPreset(type) {
        let updates = {};

        switch(type) {
            case 'simple':
                // Match ranges - set control range to match display range
                updates = {
                    controlMin: this.displayMin,
                    controlMax: this.displayMax
                };
                break;
            case 'reset':
                // Reset all ranges to defaults (0-100)
                updates = {
                    displayMin: 0,
                    displayMax: 100,
                    controlMin: 0,
                    controlMax: 100
                };
                break;
        }

        this._fireRangeChanged(updates);
    }

    /**
     * Apply direction preset
     */
    _applyDirection(orientation, invertFill) {
        const updates = {
            orientation,
            invertFill,
            invertValue: false // Reset value inversion
        };

        this.dispatchEvent(new CustomEvent('direction-changed', {
            detail: updates,
            bubbles: true,
            composed: true
        }));
    }

    /**
     * Handle range bar click (for quick positioning)
     */
    _handleBarClick(event, type) {
        if (this.disabled) return;

        const rect = event.currentTarget.getBoundingClientRect();
        const percent = ((event.clientX - rect.left) / rect.width) * 100;
        const value = Math.round(this._percentToValue(percent));

        const updates = {};

        if (type === 'control-min') {
            updates.controlMin = Math.min(value, this.controlMax - 1);
        } else if (type === 'control-max') {
            updates.controlMax = Math.max(value, this.controlMin + 1);
        }

        this._fireRangeChanged(updates);
    }

    /**
     * Start dragging a handle
     */
    _startDrag(event, type) {
        if (this.disabled) return;

        event.preventDefault();

        // Store the buffer range at drag start to prevent exponential growth
        this._dragBufferRange = this._getBufferRange();

        this._dragging = {
            type,
            startX: event.clientX,
            startValue: this[type]
        };

        const handleMove = (e) => this._handleDrag(e);
        const handleEnd = () => {
            document.removeEventListener('mousemove', handleMove);
            document.removeEventListener('mouseup', handleEnd);
            this._dragging = null;
        };

        document.addEventListener('mousemove', handleMove);
        document.addEventListener('mouseup', handleEnd);
    }

    /**
     * Handle dragging
     */
    _handleDrag(event) {
        if (!this._dragging) return;

        const handle = this.shadowRoot.querySelector(`.range-handle[data-type="${this._dragging.type}"]`);
        if (!handle) return;

        const bar = handle.closest('.range-bar');
        const rect = bar.getBoundingClientRect();

        const percent = ((event.clientX - rect.left) / rect.width) * 100;

        // Use the stored buffer range from drag start
        const buffer = this._dragBufferRange;
        const value = Math.round(buffer.min + (percent / 100) * buffer.range);

        const updates = {};

        switch(this._dragging.type) {
            case 'displayMin':
                updates.displayMin = Math.min(value, this.displayMax - 1);
                break;
            case 'displayMax':
                updates.displayMax = Math.max(value, this.displayMin + 1);
                break;
            case 'controlMin':
                updates.controlMin = Math.max(this.displayMin, Math.min(value, this.controlMax - 1));
                break;
            case 'controlMax':
                updates.controlMax = Math.min(this.displayMax, Math.max(value, this.controlMin + 1));
                break;
        }

        this._fireRangeChanged(updates);
    }

    /**
     * Fire range changed event
     */
    _fireRangeChanged(updates) {
        // If display range is changing, clamp control range to stay within bounds
        const newDisplayMin = updates.displayMin !== undefined ? updates.displayMin : this.displayMin;
        const newDisplayMax = updates.displayMax !== undefined ? updates.displayMax : this.displayMax;
        const newControlMin = updates.controlMin !== undefined ? updates.controlMin : this.controlMin;
        const newControlMax = updates.controlMax !== undefined ? updates.controlMax : this.controlMax;

        // Clamp control range to display range
        if (updates.displayMin !== undefined || updates.displayMax !== undefined) {
            updates.controlMin = Math.max(newDisplayMin, Math.min(newControlMin, newDisplayMax));
            updates.controlMax = Math.min(newDisplayMax, Math.max(newControlMax, newDisplayMin));
        }

        this.dispatchEvent(new CustomEvent('range-changed', {
            detail: updates,
            bubbles: true,
            composed: true
        }));
    }

    /**
     * Handle manual input changes
     */
    _handleInputChange(event, field) {
        const value = parseFloat(event.target.value);
        if (isNaN(value)) return;

        this._fireRangeChanged({ [field]: value });
    }

    /**
     * Render range visualizer
     */
    _renderRangeVisualizer() {
        // Calculate positions using buffer range
        const displayMinPercent = this._valueToPercent(this.displayMin);
        const displayMaxPercent = this._valueToPercent(this.displayMax);
        const controlMinPercent = this._valueToPercent(this.controlMin);
        const controlMaxPercent = this._valueToPercent(this.controlMax);
        const controlWidth = controlMaxPercent - controlMinPercent;

        const relationship = this._getRelationship();
        let relationshipText = '';
        let relationshipClass = '';

        switch(relationship) {
            case 'simple':
                relationshipText = '✓ Standard: Control and display ranges match';
                break;
            case 'clamped':
                relationshipText = '🔒 Clamped Range: Control range limits prevent extreme values';
                relationshipClass = 'clamped';
                break;
            case 'extended':
                relationshipText = '📊 Extended View: Display shows wider context than settable range';
                relationshipClass = 'extended';
                break;
        }

        return html`
            <div class="range-visualizer">
                <!-- Display Range Bar -->
                <div class="range-bar">
                    <div class="range-bar-label">Display Range (Visual Scale)</div>
                    <div class="range-bar-values">
                        <span>${this.displayMin}${this.unit}</span>
                        <span>${this.displayMax}${this.unit}</span>
                    </div>

                    <!-- Display handles (background) -->
                    <div
                        class="range-handle display-handle"
                        data-type="displayMin"
                        style="left: ${displayMinPercent}%; opacity: 0.6;"
                        @mousedown="${(e) => this._startDrag(e, 'displayMin')}">
                        <div class="range-handle-label">${this.invertFill ? this.displayMax : this.displayMin}${this.unit}</div>
                    </div>

                    <div
                        class="range-handle display-handle"
                        data-type="displayMax"
                        style="left: ${displayMaxPercent}%; opacity: 0.6;"
                        @mousedown="${(e) => this._startDrag(e, 'displayMax')}">
                        <div class="range-handle-label">${this.invertFill ? this.displayMin : this.displayMax}${this.unit}</div>
                    </div>
                </div>

                <!-- Control Range Bar (separate) -->
                <div class="range-bar" style="margin-top: 36px;">
                    <div class="range-bar-label">Control Range (Settable Values)</div>
                    <div class="range-bar-values">
                        <span>${this.controlMin}${this.unit}</span>
                        <span>${this.controlMax}${this.unit}</span>
                    </div>

                    <!-- Control Range Overlay -->
                    <div
                        class="control-range-overlay"
                        style="left: ${controlMinPercent}%; width: ${controlWidth}%">
                    </div>

                    <!-- Control handles (foreground) -->
                    <div
                        class="range-handle"
                        data-type="controlMin"
                        style="left: ${controlMinPercent}%"
                        @mousedown="${(e) => this._startDrag(e, 'controlMin')}">
                        <div class="range-handle-label">${this.invertFill ? this.controlMax : this.controlMin}${this.unit}</div>
                    </div>

                    <div
                        class="range-handle"
                        data-type="controlMax"
                        style="left: ${controlMaxPercent}%"
                        @mousedown="${(e) => this._startDrag(e, 'controlMax')}">
                        <div class="range-handle-label">${this.invertFill ? this.controlMin : this.controlMax}${this.unit}</div>
                    </div>
                </div>

                <!-- Relationship Indicator -->
                ${relationshipText ? html`
                    <lcards-message
                        type="${relationshipClass === 'clamped' ? 'warning' : relationshipClass === 'extended' ? 'info' : 'success'}"
                        message="${relationshipText}">
                    </lcards-message>
                ` : ''}

                <!-- Preset Buttons -->
                <div class="preset-buttons">
                    <button
                        class="preset-button"
                        @click="${() => this._applyPreset('simple')}"
                        ?disabled="${this.disabled}">
                        <ha-icon icon="mdi:equal"></ha-icon>
                        <span>Match Ranges</span>
                    </button>

                    <button
                        class="preset-button"
                        @click="${() => this._applyPreset('reset')}"
                        ?disabled="${this.disabled}">
                        <ha-icon icon="mdi:restore"></ha-icon>
                        <span>Reset Ranges</span>
                    </button>
                </div>

                <!-- Manual Inputs -->
                <div class="manual-inputs">
                    <div class="input-group">
                        <label class="input-label">Display Min</label>
                        <ha-textfield
                            type="number"
                            .value="${String(this.displayMin)}"
                            @change="${(e) => this._handleInputChange(e, 'displayMin')}"
                            ?disabled="${this.disabled}">
                        </ha-textfield>
                    </div>
                    <div class="input-group">
                        <label class="input-label">Display Max</label>
                        <ha-textfield
                            type="number"
                            .value="${String(this.displayMax)}"
                            @change="${(e) => this._handleInputChange(e, 'displayMax')}"
                            ?disabled="${this.disabled}">
                        </ha-textfield>
                    </div>
                    <div class="input-group">
                        <label class="input-label">Control Min</label>
                        <ha-textfield
                            type="number"
                            .value="${String(this.controlMin)}"
                            @change="${(e) => this._handleInputChange(e, 'controlMin')}"
                            ?disabled="${this.disabled}">
                        </ha-textfield>
                    </div>
                    <div class="input-group">
                        <label class="input-label">Control Max</label>
                        <ha-textfield
                            type="number"
                            .value="${String(this.controlMax)}"
                            @change="${(e) => this._handleInputChange(e, 'controlMax')}"
                            ?disabled="${this.disabled}">
                        </ha-textfield>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Render direction presets
     */
    _renderDirectionPresets() {
        const isHorizontalNormal = this.orientation === 'horizontal' && !this.invertFill;
        const isHorizontalReverse = this.orientation === 'horizontal' && this.invertFill;
        const isVerticalNormal = this.orientation === 'vertical' && !this.invertFill;
        const isVerticalInvert = this.orientation === 'vertical' && this.invertFill;

        return html`
            <div style="display: flex; flex-direction: column; gap: 12px;">
                <!-- Direction Presets -->
                <div class="direction-grid">
                    <button
                        class="direction-button ${isHorizontalNormal ? 'active' : ''}"
                        @click="${() => this._applyDirection('horizontal', false)}"
                        ?disabled="${this.disabled}">
                        <div class="direction-arrow">→</div>
                        <div class="direction-label">Left→Right</div>
                        <div class="direction-values">0 → 100</div>
                    </button>

                    <button
                        class="direction-button ${isHorizontalReverse ? 'active' : ''}"
                        @click="${() => this._applyDirection('horizontal', true)}"
                        ?disabled="${this.disabled}">
                        <div class="direction-arrow">←</div>
                        <div class="direction-label">Right→Left</div>
                        <div class="direction-values">100 ← 0</div>
                    </button>

                    <button
                        class="direction-button ${isVerticalNormal ? 'active' : ''}"
                        @click="${() => this._applyDirection('vertical', false)}"
                        ?disabled="${this.disabled}">
                        <div class="direction-arrow">↑</div>
                        <div class="direction-label">Bottom→Top</div>
                        <div class="direction-values">0 ↑ 100</div>
                    </button>

                    <button
                        class="direction-button ${isVerticalInvert ? 'active' : ''}"
                        @click="${() => this._applyDirection('vertical', true)}"
                        ?disabled="${this.disabled}">
                        <div class="direction-arrow">↓</div>
                        <div class="direction-label">Top→Bottom</div>
                        <div class="direction-values">100 ↓ 0</div>
                    </button>
                </div>

                <!-- Manual Toggles -->
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; padding: 8px; background: var(--secondary-background-color); border-radius: 8px;">
                    <ha-formfield .label="${'Invert Fill'}">
                        <ha-switch
                            .checked="${this.invertFill}"
                            @change="${(e) => this._toggleSetting('invertFill', e.target.checked)}"
                            ?disabled="${this.disabled}">
                        </ha-switch>
                    </ha-formfield>

                    <ha-formfield .label="${'Invert Value'}">
                        <ha-switch
                            .checked="${this.invertValue}"
                            @change="${(e) => this._toggleSetting('invertValue', e.target.checked)}"
                            ?disabled="${this.disabled}">
                        </ha-switch>
                    </ha-formfield>
                </div>
            </div>
        `;
    }

    /**
     * Toggle individual setting
     */
    _toggleSetting(setting, value) {
        if (setting === 'invertFill') {
            this.dispatchEvent(new CustomEvent('direction-changed', {
                detail: {
                    orientation: this.orientation,
                    invertFill: value,
                    invertValue: this.invertValue
                },
                bubbles: true,
                composed: true
            }));
        } else if (setting === 'invertValue') {
            this.dispatchEvent(new CustomEvent('direction-changed', {
                detail: {
                    orientation: this.orientation,
                    invertFill: this.invertFill,
                    invertValue: value
                },
                bubbles: true,
                composed: true
            }));
        }
    }

    /**
     * Render live preview
     */
    _renderPreview() {
        const valuePercent = this._valueToPercent(this._previewValue);

        let fillWidth, fillLeft, thumbLeft;

        if (this.invertFill) {
            // Fill from right
            fillWidth = valuePercent;
            fillLeft = 100 - valuePercent;
            thumbLeft = 100 - valuePercent;
        } else {
            // Fill from left
            fillWidth = valuePercent;
            fillLeft = 0;
            thumbLeft = valuePercent;
        }

        return html`
            <div class="preview-container">
                <div class="preview-label">Live Preview</div>
                <div class="preview-slider">
                    <div
                        class="preview-fill"
                        style="width: ${fillWidth}%; left: ${fillLeft}%">
                    </div>
                    <div
                        class="preview-thumb"
                        style="left: ${thumbLeft}%">
                    </div>
                </div>
                <div class="preview-value">
                    ${this._previewValue}${this.unit}
                    (${Math.round(valuePercent)}%)
                </div>

                <input
                    type="range"
                    min="${String(this.controlMin)}"
                    max="${String(this.controlMax)}"
                    .value="${String(this._previewValue)}"
                    @input="${(e) => { this._previewValue = parseFloat(e.target.value); }}"
                    style="width: 100%; margin-top: 8px;"
                    ?disabled="${this.disabled}">
            </div>
        `;
    }

    render() {
        return html`
            <div class="section">
                <div class="section-header">
                    <ha-icon icon="mdi:arrow-decision"></ha-icon>
                    Direction & Orientation
                </div>
                ${this._renderDirectionPresets()}
            </div>

            <div class="section">
                <div class="section-header">
                    <ha-icon icon="mdi:arrow-expand-horizontal"></ha-icon>
                    Range Configuration
                </div>
                ${this._renderRangeVisualizer()}
            </div>
        `;
    }
}

customElements.define('lcards-slider-range-visualizer', LCARdSSliderRangeVisualizer);

lcardsLog.debug('[LCARdSSliderRangeVisualizer] Component registered');
