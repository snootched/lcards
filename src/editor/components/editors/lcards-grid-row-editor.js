/**
 * @fileoverview LCARdS Grid Row Editor
 *
 * Context-aware overlay editor for data grid rows.
 * Appears when user clicks a row in WYSIWYG preview mode.
 * Provides row-level operations and style configuration.
 *
 * @element lcards-grid-row-editor
 * @fires row-updated - When row is updated (detail: { row, style, operations })
 * @fires row-deleted - When row is deleted (detail: { row })
 * @fires row-duplicated - When row is duplicated (detail: { row })
 * @fires closed - When editor is closed
 *
 * @property {Object} hass - Home Assistant instance
 * @property {number} row - Row index
 * @property {Array} cells - Current row cells
 * @property {Object} style - Current row style
 * @property {Object} position - Editor position { top, left }
 */

import { LitElement, html, css } from 'lit';
import { lcardsLog } from '../../../utils/lcards-logging.js';
import '../../components/shared/lcards-form-section.js';

// @ts-ignore - TS2415: duplicate method implementations in LitElement subclass
export class LCARdSGridRowEditor extends LitElement {
    static get properties() {
        return {
            hass: { type: Object },
            row: { type: Number },
            cells: { type: Array },
            style: { type: Object },
            position: { type: Object },
            _editStyle: { type: Object, state: true }
        };
    }

    constructor() {
        super();
        this.hass = null;
        this.row = 0;
        this.cells = [];
        this.style = {};
        this.position = { top: 0, left: 0 };
        this._editStyle = {};
    }

    connectedCallback() {
        super.connectedCallback();
        this._editStyle = { ...this.style };
        lcardsLog.debug('[GridRowEditor] Opened for row:', this.row);
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

            .row-info {
                padding: 12px;
                background: var(--secondary-background-color);
                border-radius: 4px;
                margin-bottom: 12px;
            }

            .row-info-item {
                display: flex;
                justify-content: space-between;
                margin-bottom: 4px;
                font-size: 13px;
            }

            .row-info-label {
                color: var(--secondary-text-color);
            }

            .row-info-value {
                color: var(--primary-text-color);
                font-weight: 600;
            }

            .operations-section {
                display: flex;
                flex-direction: column;
                gap: 8px;
                margin-bottom: 12px;
            }

            .operation-btn {
                width: 100%;
                justify-content: flex-start;
            }

            .style-section {
                border-top: 1px solid var(--divider-color);
                padding-top: 12px;
                margin-top: 12px;
            }

            ha-textfield {
                width: 100%;
                margin-bottom: 8px;
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
                <span class="editor-title">Edit Row ${this.row + 1}</span>
                <button class="close-btn" @click=${this._handleClose}>
                    <ha-icon icon="mdi:close"></ha-icon>
                </button>
            </div>

            <div class="editor-content">
                <!-- Row Info -->
                <div class="row-info">
                    <div class="row-info-item">
                        <span class="row-info-label">Row Index:</span>
                        <span class="row-info-value">${this.row + 1}</span>
                    </div>
                    <div class="row-info-item">
                        <span class="row-info-label">Cells:</span>
                        <span class="row-info-value">${this.cells.length}</span>
                    </div>
                </div>

                <!-- Row Operations -->
                <div class="operations-section">
                    <ha-button class="operation-btn" @click=${this._handleInsertAbove}>
                        <ha-icon icon="mdi:arrow-up-bold" slot="start"></ha-icon>
                        Insert Row Above
                    </ha-button>

                    <ha-button class="operation-btn" @click=${this._handleInsertBelow}>
                        <ha-icon icon="mdi:arrow-down-bold" slot="start"></ha-icon>
                        Insert Row Below
                    </ha-button>

                    <ha-button class="operation-btn" @click=${this._handleDuplicate}>
                        <ha-icon icon="mdi:content-copy" slot="start"></ha-icon>
                        Duplicate Row
                    </ha-button>
                </div>

                <!-- Style Overrides -->
                <details class="style-section" open>
                    <summary style="cursor: pointer; font-weight: 600; margin-bottom: 8px;">
                        Row Style Overrides
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
                        helper="CSS colour value">
                    </ha-textfield>

                    <ha-textfield
                        label="Font Weight"
                        .value=${this._editStyle.font_weight || ''}
                        @input=${(e) => this._updateStyle('font_weight', e.target.value)}
                        helper="100-900">
                    </ha-textfield>

                    <ha-textfield
                        label="Height"
                        .value=${this._editStyle.height || ''}
                        @input=${(e) => this._updateStyle('height', e.target.value)}
                        helper="CSS height (e.g., '40px', 'auto')">
                    </ha-textfield>
                </details>

                <!-- Danger Zone -->
                <div class="danger-zone">
                    <ha-button class="danger-btn" @click=${this._handleDelete}>
                        <ha-icon icon="mdi:delete" slot="start"></ha-icon>
                        Delete Row
                    </ha-button>
                </div>
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

    _updateStyle(key, value) {
        this._editStyle = { ...this._editStyle, [key]: value };
    }

    _handleInsertAbove() {
        this.dispatchEvent(new CustomEvent('row-operation', {
            detail: { operation: 'insert-above', row: this.row },
            bubbles: true,
            composed: true
        }));
        this._handleClose();
    }

    _handleInsertBelow() {
        this.dispatchEvent(new CustomEvent('row-operation', {
            detail: { operation: 'insert-below', row: this.row },
            bubbles: true,
            composed: true
        }));
        this._handleClose();
    }

    _handleDuplicate() {
        this.dispatchEvent(new CustomEvent('row-operation', {
            detail: { operation: 'duplicate', row: this.row },
            bubbles: true,
            composed: true
        }));
        this._handleClose();
    }

    _handleDelete() {
        if (confirm(`Delete row ${this.row + 1}? This cannot be undone.`)) {
            this.dispatchEvent(new CustomEvent('row-operation', {
                detail: { operation: 'delete', row: this.row },
                bubbles: true,
                composed: true
            }));
            this._handleClose();
        }
    }

    _handleSave() {
        lcardsLog.debug('[GridRowEditor] Saving row:', {
            row: this.row,
            style: this._editStyle
        });

        this.dispatchEvent(new CustomEvent('row-updated', {
            detail: {
                row: this.row,
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

customElements.define('lcards-grid-row-editor', /** @type {any} */ (LCARdSGridRowEditor));
