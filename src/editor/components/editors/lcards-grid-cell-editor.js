/**
 * @fileoverview LCARdS Grid Cell Editor
 *
 * Context-aware overlay editor for data grid cells.
 * Appears when user clicks a cell in WYSIWYG preview mode.
 * Positioned near the clicked cell to provide inline editing experience.
 *
 * @element lcards-grid-cell-editor
 * @fires cell-updated - When cell value is updated (detail: { row, col, value, style })
 * @fires closed - When editor is closed
 *
 * @property {Object} hass - Home Assistant instance
 * @property {number} row - Row index
 * @property {number} col - Column index
 * @property {*} value - Current cell value
 * @property {Object} style - Current cell style
 * @property {string} mode - Edit mode: 'static' or 'template'
 * @property {Object} position - Editor position { top, left }
 */

import { LitElement, html, css } from 'lit';
import { lcardsLog } from '../../../utils/lcards-logging.js';
import '../../components/shared/lcards-form-section.js';
import './lcards-color-section.js';

// @ts-ignore - TS2415: duplicate method implementations in LitElement subclass
export class LCARdSGridCellEditor extends LitElement {
    static get properties() {
        return {
            hass: { type: Object },
            row: { type: Number },
            col: { type: Number },
            value: { type: String },
            style: { type: Object },
            mode: { type: String },
            position: { type: Object },
            _editMode: { type: String, state: true },
            _editValue: { type: String, state: true },
            _editStyle: { type: Object, state: true }
        };
    }

    constructor() {
        super();
        this.hass = null;
        this.row = 0;
        this.col = 0;
        this.value = '';
        this.style = {};
        this.mode = 'static';
        this.position = { top: 0, left: 0 };
        this._editMode = 'static';
        this._editValue = '';
        this._editStyle = {};
    }

    connectedCallback() {
        super.connectedCallback();
        // Clone values for editing
        this._editMode = this.mode || 'static';
        this._editValue = this.value || '';
        this._editStyle = { ...this.style };

        lcardsLog.debug('[GridCellEditor] Opened for cell:', this.row, this.col);
    }

    static get styles() {
        return css`
            :host {
                display: block;
                position: fixed;
                z-index: 10000;
                background: var(--card-background-color);
                border: 2px solid var(--primary-color);
                border-radius: 8px;
                box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
                min-width: 320px;
                max-width: 400px;
            }

            .editor-header {
                padding: 12px;
                background: var(--primary-color);
                color: white;
                display: flex;
                align-items: center;
                justify-content: space-between;
                border-radius: 6px 6px 0 0;
            }

            .editor-title {
                font-weight: 600;
                font-size: 14px;
            }

            .close-btn {
                background: transparent;
                border: none;
                color: white;
                cursor: pointer;
                padding: 4px;
                display: flex;
                align-items: center;
                justify-content: center;
            }

            .close-btn:hover {
                background: rgba(255, 255, 255, 0.2);
                border-radius: 4px;
            }

            .editor-content {
                padding: 12px;
                max-height: 400px;
                overflow-y: auto;
            }

            .mode-toggle {
                display: flex;
                gap: 4px;
                margin-bottom: 12px;
                background: var(--secondary-background-color);
                border-radius: 4px;
                padding: 2px;
            }

            .mode-btn {
                flex: 1;
                padding: 8px 12px;
                background: transparent;
                border: none;
                border-radius: 4px;
                color: var(--secondary-text-color);
                font-size: 13px;
                cursor: pointer;
                transition: all 0.2s ease;
            }

            .mode-btn:hover {
                background: var(--divider-color);
            }

            .mode-btn.active {
                background: var(--primary-color);
                color: white;
            }

            .value-editor {
                margin-bottom: 12px;
            }

            ha-textfield {
                width: 100%;
            }

            ha-textarea {
                width: 100%;
            }

            .template-helper {
                font-size: 12px;
                color: var(--secondary-text-color);
                margin-top: 4px;
                padding: 8px;
                background: var(--secondary-background-color);
                border-radius: 4px;
            }

            .template-helper code {
                background: var(--divider-color);
                padding: 2px 4px;
                border-radius: 2px;
                font-family: monospace;
            }

            .style-section {
                border-top: 1px solid var(--divider-color);
                padding-top: 12px;
                margin-top: 12px;
            }

            .editor-actions {
                padding: 12px;
                border-top: 1px solid var(--divider-color);
                display: flex;
                gap: 8px;
                justify-content: flex-end;
            }
        `;
    }

    render() {
        return html`
            <div class="editor-header">
                <span class="editor-title">Edit Cell (R${this.row + 1}:C${this.col + 1})</span>
                <button class="close-btn" @click=${this._handleClose}>
                    <ha-icon icon="mdi:close"></ha-icon>
                </button>
            </div>

            <div class="editor-content">
                <!-- Mode Toggle -->
                <div class="mode-toggle">
                    <button
                        class="mode-btn ${this._editMode === 'static' ? 'active' : ''}"
                        @click=${() => this._setEditMode('static')}>
                        Static Value
                    </button>
                    <button
                        class="mode-btn ${this._editMode === 'template' ? 'active' : ''}"
                        @click=${() => this._setEditMode('template')}>
                        Template
                    </button>
                </div>

                <!-- Value Editor -->
                <div class="value-editor">
                    ${this._editMode === 'static' ? html`
                        <ha-textfield
                            label="Cell Value"
                            .value=${this._editValue}
                            @input=${(e) => this._editValue = e.target.value}
                            helper="Static text or number">
                        </ha-textfield>
                    ` : html`
                        <ha-textarea
                            label="Template"
                            .value=${this._editValue}
                            @input=${(e) => this._editValue = e.target.value}
                            rows="3"
                            helper="Home Assistant template syntax">
                        </ha-textarea>

                        <div class="template-helper">
                            <strong>Template Examples:</strong><br>
                            • <code>{{'{{'}}states('sensor.temperature'){{'}}'}}</code><br>
                            • <code>{{'{{'}}state_attr('light.kitchen', 'brightness'){{'}}'}}</code><br>
                            • <code>{{'{{'}}now().strftime('%H:%M'){{'}}'}}</code>
                        </div>
                    `}
                </div>

                <!-- Style Overrides -->
                <details class="style-section">
                    <summary style="cursor: pointer; font-weight: 600; margin-bottom: 8px;">
                        Style Overrides (Optional)
                    </summary>

                    <ha-textfield
                        label="Text Colour"
                        .value=${this._editStyle.color || ''}
                        @input=${(e) => this._updateStyle('color', e.target.value)}
                        helper="CSS colour value">
                    </ha-textfield>

                    <ha-textfield
                        label="Background Colour"
                        .value=${this._editStyle.background || ''}
                        @input=${(e) => this._updateStyle('background', e.target.value)}
                        helper="CSS colour value"
                        style="margin-top: 8px;">
                    </ha-textfield>

                    <ha-textfield
                        label="Font Weight"
                        .value=${this._editStyle.font_weight || ''}
                        @input=${(e) => this._updateStyle('font_weight', e.target.value)}
                        helper="100-900"
                        style="margin-top: 8px;">
                    </ha-textfield>
                </details>
            </div>

            <div class="editor-actions">
                <ha-button @click=${this._handleClose}>
                    Cancel
                </ha-button>
                <ha-button variant="brand" @click=${this._handleSave}>
                    <ha-icon icon="mdi:check" slot="start"></ha-icon>
                    Apply
                </ha-button>
            </div>
        `;
    }

    _setEditMode(mode) {
        this._editMode = mode;
        lcardsLog.debug('[GridCellEditor] Mode changed to:', mode);
    }

    _updateStyle(key, value) {
        this._editStyle = { ...this._editStyle, [key]: value };
    }

    _handleSave() {
        lcardsLog.debug('[GridCellEditor] Saving cell:', {
            row: this.row,
            col: this.col,
            value: this._editValue,
            mode: this._editMode,
            style: this._editStyle
        });

        this.dispatchEvent(new CustomEvent('cell-updated', {
            detail: {
                row: this.row,
                col: this.col,
                value: this._editValue,
                mode: this._editMode,
                style: this._editStyle
            },
            bubbles: true,
            composed: true
        }));

        this._handleClose();
    }

    _handleClose() {
        this.dispatchEvent(new CustomEvent('closed', {
            bubbles: true,
            composed: true
        }));
    }
}

customElements.define('lcards-grid-cell-editor', /** @type {any} */ (LCARdSGridCellEditor));
