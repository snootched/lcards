/**
 * LCARdS Grid Column Editor
 *
 * Context-aware overlay editor for data grid columns.
 * Appears when user clicks a column in WYSIWYG preview mode.
 * Provides column-level configuration and style settings.
 *
 * @element lcards-grid-column-editor
 * @fires column-updated - When column is updated (detail: { col, width, alignment, style })
 * @fires column-deleted - When column is deleted (detail: { col })
 * @fires closed - When editor is closed
 *
 * @property {Object} hass - Home Assistant instance
 * @property {number} col - Column index
 * @property {string} width - Column width (CSS value or 'auto')
 * @property {string} alignment - Column text alignment
 * @property {Object} style - Current column style
 * @property {Object} position - Editor position { top, left }
 */

import { LitElement, html, css } from 'lit';
import { lcardsLog } from '../../../utils/lcards-logging.js';
import '../../components/shared/lcards-form-section.js';

export class LCARdSGridColumnEditor extends LitElement {
    static get properties() {
        return {
            hass: { type: Object },
            col: { type: Number },
            width: { type: String },
            alignment: { type: String },
            style: { type: Object },
            position: { type: Object },
            _editWidth: { type: String, state: true },
            _editAlignment: { type: String, state: true },
            _editStyle: { type: Object, state: true }
        };
    }

    constructor() {
        super();
        this.hass = null;
        this.col = 0;
        this.width = 'auto';
        this.alignment = 'left';
        this.style = {};
        this.position = { top: 0, left: 0 };
        this._editWidth = 'auto';
        this._editAlignment = 'left';
        this._editStyle = {};
    }

    connectedCallback() {
        super.connectedCallback();
        this._editWidth = this.width || 'auto';
        this._editAlignment = this.alignment || 'left';
        this._editStyle = { ...this.style };
        lcardsLog.debug('[GridColumnEditor] Opened for column:', this.col);
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

            .column-info {
                padding: 12px;
                background: var(--secondary-background-color);
                border-radius: 4px;
                margin-bottom: 12px;
            }

            .column-info-item {
                display: flex;
                justify-content: space-between;
                margin-bottom: 4px;
                font-size: 13px;
            }

            .column-info-label {
                color: var(--secondary-text-color);
            }

            .column-info-value {
                color: var(--primary-text-color);
                font-weight: 600;
            }

            .config-section {
                margin-bottom: 12px;
            }

            ha-textfield {
                width: 100%;
                margin-bottom: 8px;
            }

            .alignment-buttons {
                display: grid;
                grid-template-columns: repeat(3, 1fr);
                gap: 4px;
                margin-bottom: 8px;
            }

            .align-btn {
                padding: 8px;
                background: var(--secondary-background-color);
                border: 2px solid transparent;
                border-radius: 4px;
                cursor: pointer;
                transition: all 0.2s ease;
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 4px;
            }

            .align-btn:hover {
                border-color: var(--divider-color);
            }

            .align-btn.active {
                border-color: var(--primary-color);
                background: rgba(var(--rgb-primary-color, 3, 169, 244), 0.1);
            }

            .align-btn ha-icon {
                font-size: 24px;
            }

            .align-btn-label {
                font-size: 11px;
                color: var(--secondary-text-color);
            }

            .style-section {
                border-top: 1px solid var(--divider-color);
                padding-top: 12px;
                margin-top: 12px;
            }

            .operations-section {
                display: flex;
                flex-direction: column;
                gap: 8px;
                margin-top: 12px;
            }

            .operation-btn {
                width: 100%;
                justify-content: flex-start;
            }

            .editor-actions {
                padding: 12px;
                border-top: 1px solid var(--divider-color);
                display: flex;
                gap: 8px;
                justify-content: flex-end;
            }

            .danger-zone {
                border-top: 1px solid var(--divider-color);
                padding-top: 12px;
                margin-top: 12px;
            }

            .danger-btn {
                --mdc-theme-primary: var(--error-color);
            }
        `;
    }

    render() {
        return html`
            <div class="editor-header">
                <span class="editor-title">Edit Column ${this.col + 1}</span>
                <button class="close-btn" @click=${this._handleClose}>
                    <ha-icon icon="mdi:close"></ha-icon>
                </button>
            </div>

            <div class="editor-content">
                <!-- Column Info -->
                <div class="column-info">
                    <div class="column-info-item">
                        <span class="column-info-label">Column Index:</span>
                        <span class="column-info-value">${this.col + 1}</span>
                    </div>
                    <div class="column-info-item">
                        <span class="column-info-label">Current Width:</span>
                        <span class="column-info-value">${this._editWidth}</span>
                    </div>
                </div>

                <!-- Column Configuration -->
                <div class="config-section">
                    <label style="display: block; margin-bottom: 8px; font-weight: 600; color: var(--primary-text-color);">
                        Column Width
                    </label>
                    <ha-textfield
                        label="Width"
                        .value=${this._editWidth}
                        @input=${(e) => this._editWidth = e.target.value}
                        helper="CSS value (e.g., '100px', '1fr', 'auto')">
                    </ha-textfield>
                </div>

                <!-- Text Alignment -->
                <div class="config-section">
                    <label style="display: block; margin-bottom: 8px; font-weight: 600; color: var(--primary-text-color);">
                        Text Alignment
                    </label>
                    <div class="alignment-buttons">
                        <button 
                            class="align-btn ${this._editAlignment === 'left' ? 'active' : ''}"
                            @click=${() => this._editAlignment = 'left'}>
                            <ha-icon icon="mdi:format-align-left"></ha-icon>
                            <span class="align-btn-label">Left</span>
                        </button>
                        <button 
                            class="align-btn ${this._editAlignment === 'center' ? 'active' : ''}"
                            @click=${() => this._editAlignment = 'center'}>
                            <ha-icon icon="mdi:format-align-center"></ha-icon>
                            <span class="align-btn-label">Center</span>
                        </button>
                        <button 
                            class="align-btn ${this._editAlignment === 'right' ? 'active' : ''}"
                            @click=${() => this._editAlignment = 'right'}>
                            <ha-icon icon="mdi:format-align-right"></ha-icon>
                            <span class="align-btn-label">Right</span>
                        </button>
                    </div>
                </div>

                <!-- Column Operations -->
                <div class="operations-section">
                    <ha-button class="operation-btn" @click=${this._handleInsertLeft}>
                        <ha-icon icon="mdi:arrow-left-bold" slot="icon"></ha-icon>
                        Insert Column Left
                    </ha-button>

                    <ha-button class="operation-btn" @click=${this._handleInsertRight}>
                        <ha-icon icon="mdi:arrow-right-bold" slot="icon"></ha-icon>
                        Insert Column Right
                    </ha-button>
                </div>

                <!-- Style Overrides -->
                <details class="style-section">
                    <summary style="cursor: pointer; font-weight: 600; margin-bottom: 8px;">
                        Column Style Overrides
                    </summary>

                    <ha-textfield
                        label="Text Color"
                        .value=${this._editStyle.color || ''}
                        @input=${(e) => this._updateStyle('color', e.target.value)}
                        helper="CSS color value">
                    </ha-textfield>

                    <ha-textfield
                        label="Background Color"
                        .value=${this._editStyle.background || ''}
                        @input=${(e) => this._updateStyle('background', e.target.value)}
                        helper="CSS color value">
                    </ha-textfield>

                    <ha-textfield
                        label="Font Weight"
                        .value=${this._editStyle.font_weight || ''}
                        @input=${(e) => this._updateStyle('font_weight', e.target.value)}
                        helper="100-900">
                    </ha-textfield>
                </details>

                <!-- Danger Zone -->
                <div class="danger-zone">
                    <ha-button class="danger-btn" @click=${this._handleDelete}>
                        <ha-icon icon="mdi:delete" slot="icon"></ha-icon>
                        Delete Column
                    </ha-button>
                </div>
            </div>

            <div class="editor-actions">
                <ha-button @click=${this._handleClose}>
                    Cancel
                </ha-button>
                <ha-button variant="brand" @click=${this._handleSave}>
                    <ha-icon icon="mdi:check" slot="icon"></ha-icon>
                    Apply
                </ha-button>
            </div>
        `;
    }

    _updateStyle(key, value) {
        this._editStyle = { ...this._editStyle, [key]: value };
    }

    _handleInsertLeft() {
        this.dispatchEvent(new CustomEvent('column-operation', {
            detail: { operation: 'insert-left', col: this.col },
            bubbles: true,
            composed: true
        }));
        this._handleClose();
    }

    _handleInsertRight() {
        this.dispatchEvent(new CustomEvent('column-operation', {
            detail: { operation: 'insert-right', col: this.col },
            bubbles: true,
            composed: true
        }));
        this._handleClose();
    }

    _handleDelete() {
        if (confirm(`Delete column ${this.col + 1}? This cannot be undone.`)) {
            this.dispatchEvent(new CustomEvent('column-operation', {
                detail: { operation: 'delete', col: this.col },
                bubbles: true,
                composed: true
            }));
            this._handleClose();
        }
    }

    _handleSave() {
        lcardsLog.debug('[GridColumnEditor] Saving column:', {
            col: this.col,
            width: this._editWidth,
            alignment: this._editAlignment,
            style: this._editStyle
        });

        this.dispatchEvent(new CustomEvent('column-updated', {
            detail: {
                col: this.col,
                width: this._editWidth,
                alignment: this._editAlignment,
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

customElements.define('lcards-grid-column-editor', LCARdSGridColumnEditor);
