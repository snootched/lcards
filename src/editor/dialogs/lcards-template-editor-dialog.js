/**
 * @fileoverview LCARdS Template Editor Dialog
 *
 * Modal dialog for editing template mode rows in the data-grid card.
 * Allows users to configure multi-row grids with per-cell templates and hierarchical styling.
 *
 * @element lcards-template-editor-dialog
 * @fires rows-changed - When rows are saved
 * @fires closed - When dialog is closed
 *
 * @property {Object} hass - Home Assistant instance
 * @property {Array} rows - Array of row configurations
 */

import { LitElement, html, css } from 'lit';
import { lcardsLog } from '../../utils/lcards-logging.js';
import '../components/shared/lcards-dialog.js';
import '../components/shared/lcards-form-section.js';
import '../components/editors/lcards-grid-layout.js';
import '../components/editors/lcards-color-section.js';

export class LCARdSTemplateEditorDialog extends LitElement {
    static get properties() {
        return {
            hass: { type: Object },
            rows: { type: Array },
            _editingRows: { type: Array, state: true },
            _expandedRows: { type: Set, state: true },
            _expandedRowStyles: { type: Set, state: true },
            _expandedCellStyles: { type: Set, state: true },
            _confirmDialog: { type: Object, state: true }
        };
    }

    constructor() {
        super();
        this.hass = null;
        this.rows = [];
        this._editingRows = [];
        this._expandedRows = new Set();
        this._expandedRowStyles = new Set();
        this._expandedCellStyles = new Set();
        this._confirmDialog = null;
        lcardsLog.debug('[LCARdSTemplateEditorDialog] Constructor called');
    }

    static get styles() {
        return css`
            :host {
                display: block;
            }

            lcards-dialog {
                --ha-dialog-width-md: 1000px;
            }

            .dialog-content {
                display: flex;
                flex-direction: column;
                gap: 12px;
                padding: 8px 0;
                max-height: 70vh;
                overflow-y: auto;
            }

            .add-row-button {
                margin-bottom: 12px;
            }

            .row-container {
                border: 2px solid var(--chip-background-color, #e0e0e0);
                border-radius: 8px;
                padding: 12px;
                background: var(--card-background-color, white);
            }

            .row-header {
                display: flex;
                align-items: center;
                gap: 8px;
                cursor: pointer;
                user-select: none;
                padding: 8px;
                background: var(--chip-background-color, #f5f5f5);
                border-radius: 4px;
                margin-bottom: 12px;
            }

            .row-header:hover {
                background: var(--secondary-background-color, #e0e0e0);
            }

            .row-expand-icon {
                transition: transform 0.2s;
            }

            .row-expand-icon.expanded {
                transform: rotate(90deg);
            }

            .row-title {
                flex: 1;
                font-weight: 500;
                font-size: 14px;
            }

            .row-actions {
                display: flex;
                gap: 4px;
            }

            .row-actions mwc-icon-button {
                --mdc-icon-button-size: 32px;
                --mdc-icon-size: 20px;
            }

            .row-content {
                display: flex;
                flex-direction: column;
                gap: 12px;
            }

            .cells-container {
                display: flex;
                flex-direction: column;
                gap: 8px;
            }

            .cell-row {
                display: flex;
                align-items: center;
                gap: 8px;
            }

            .cell-label {
                min-width: 60px;
                font-size: 12px;
                font-weight: 500;
                color: var(--secondary-text-color, #727272);
            }

            .cell-input {
                flex: 1;
            }

            .cell-actions {
                display: flex;
                gap: 4px;
            }

            .entity-picker-button {
                --mdc-icon-button-size: 36px;
                --mdc-icon-size: 20px;
            }

            .style-section {
                margin-top: 12px;
                padding: 12px;
                background: var(--secondary-background-color, #f5f5f5);
                border-radius: 4px;
            }

            .style-header {
                display: flex;
                align-items: center;
                gap: 8px;
                cursor: pointer;
                user-select: none;
                padding: 8px;
                font-weight: 500;
                font-size: 13px;
            }

            .style-header:hover {
                background: var(--chip-background-color, #e0e0e0);
                border-radius: 4px;
            }

            .style-fields {
                display: flex;
                flex-direction: column;
                gap: 12px;
                margin-top: 12px;
            }

            .cell-styles-grid {
                display: grid;
                grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
                gap: 12px;
                margin-top: 12px;
            }

            .cell-style-card {
                border: 1px solid var(--divider-color, #e0e0e0);
                border-radius: 4px;
                padding: 12px;
                background: var(--card-background-color, white);
            }

            .cell-style-header {
                display: flex;
                align-items: center;
                justify-content: space-between;
                margin-bottom: 8px;
                font-weight: 500;
                font-size: 12px;
            }

            .add-cell-button {
                margin-top: 8px;
            }

            ha-textfield {
                width: 100%;
            }

            .empty-state {
                text-align: center;
                padding: 32px;
                color: var(--secondary-text-color, #727272);
            }

            .empty-state ha-icon {
                font-size: 48px;
                margin-bottom: 16px;
                color: var(--disabled-text-color, #bdbdbd);
            }
        `;
    }

    connectedCallback() {
        super.connectedCallback();
        // Deep clone rows for editing (don't mutate props)
        this._editingRows = JSON.parse(JSON.stringify(this.rows || []));
        if (this._editingRows.length === 0) {
            this._addRow(); // Start with one empty row
        }
        lcardsLog.debug('[LCARdSTemplateEditorDialog] Connected with rows:', this._editingRows);
    }

    render() {
        return html`
            <lcards-dialog
                open
                @closed=${(e) => { e.stopPropagation(); this._handleClose(); }}
                .heading=${'Configure Template Rows'}>

                <div class="dialog-content">
                    <ha-button
                        class="add-row-button"
                        raised
                        @click=${this._addRow}>
                        <ha-icon icon="mdi:plus" slot="start"></ha-icon>
                        Add Row
                    </ha-button>

                    ${this._editingRows.length === 0 ? this._renderEmptyState() : ''}
                    ${this._editingRows.map((row, index) => this._renderRow(row, index))}
                </div>

                <ha-button slot="primaryAction" @click=${this._handleSave}>
                    Save
                </ha-button>
                <ha-button slot="secondaryAction" @click=${this._handleCancel}>
                    Cancel
                </ha-button>
            </lcards-dialog>

            ${this._confirmDialog ? html`
                <ha-dialog
                    open
                    .headerTitle=${this._confirmDialog.title}
                    @closed=${(e) => { e.stopPropagation(); this._confirmDialog = null; this.requestUpdate(); }}>
                    <div>${this._confirmDialog.text}</div>
                    <div slot="footer">
                        <ha-button
                            @click=${() => this._confirmDialog.confirmAction()}>
                            Delete
                        </ha-button>
                        <ha-button
                            @click=${() => { this._confirmDialog = null; this.requestUpdate(); }}>
                            Cancel
                        </ha-button>
                    </div>
                </ha-dialog>
            ` : ''}
        `;
    }

    _renderEmptyState() {
        return html`
            <div class="empty-state">
                <ha-icon icon="mdi:table-plus"></ha-icon>
                <div>No rows configured. Click "Add Row" to get started.</div>
            </div>
        `;
    }

    _renderRow(row, index) {
        const isExpanded = this._expandedRows.has(index);
        const values = row.values || [];
        const cellPreview = values.slice(0, 3).map(v => String(v).substring(0, 20)).join(', ');
        const moreText = values.length > 3 ? `, +${values.length - 3} more` : '';

        return html`
            <lcards-collapsible-section
                .title=${`Row ${index + 1}: [${cellPreview}${moreText}]`}
                .count=${values.length}
                countLabel="cells"
                ?expanded=${isExpanded}
                @toggle=${() => this._toggleRowExpanded(index)}>

                <mwc-icon-button
                    slot="actions"
                    @click=${() => this._moveRowUp(index)}
                    ?disabled=${index === 0}
                    title="Move up">
                    <ha-icon icon="mdi:arrow-up"></ha-icon>
                </mwc-icon-button>
                <mwc-icon-button
                    slot="actions"
                    @click=${() => this._moveRowDown(index)}
                    ?disabled=${index === this._editingRows.length - 1}
                    title="Move down">
                    <ha-icon icon="mdi:arrow-down"></ha-icon>
                </mwc-icon-button>
                <mwc-icon-button
                    slot="actions"
                    @click=${() => this._deleteRow(index)}
                    title="Delete row">
                    <ha-icon icon="mdi:delete"></ha-icon>
                </mwc-icon-button>

                ${this._renderRowCells(row, index)}
                ${this._renderRowStyle(row, index)}
                ${this._renderCellStyles(row, index)}
            </lcards-collapsible-section>
        `;
    }

    _renderRowCells(row, rowIndex) {
        const values = row.values || [];

        return html`
            <div class="cells-container">
                <div style="font-weight: 500; font-size: 13px; margin-bottom: 8px;">
                    Cell Values
                </div>
                ${values.map((value, cellIndex) => html`
                    <div class="cell-row">
                        <div class="cell-label">Cell ${cellIndex + 1}:</div>
                        <ha-textfield
                            class="cell-input"
                            .value=${value || ''}
                            placeholder="Enter text or template (e.g., {{states.sensor.temp.state}})"
                            @input=${(e) => this._handleCellValueChange(rowIndex, cellIndex, e.target.value)}>
                        </ha-textfield>
                        <mwc-icon-button
                            class="entity-picker-button"
                            @click=${() => this._openEntityPicker(rowIndex, cellIndex)}
                            title="Insert entity template">
                            <ha-icon icon="mdi:home-assistant"></ha-icon>
                        </mwc-icon-button>
                        <mwc-icon-button
                            @click=${() => this._deleteCell(rowIndex, cellIndex)}
                            title="Remove cell">
                            <ha-icon icon="mdi:close"></ha-icon>
                        </mwc-icon-button>
                    </div>
                `)}
                <ha-button
                    class="add-cell-button"
                    @click=${() => this._addCell(rowIndex)}>
                    <ha-icon icon="mdi:plus" slot="start"></ha-icon>
                    Add Cell
                </ha-button>
            </div>
        `;
    }

    _renderRowStyle(row, rowIndex) {
        const style = row.style || {};

        return html`
            <lcards-form-section
                header="Row Style Overrides"
                description="Style properties that apply to all cells in this row"
                ?expanded=${this._expandedRowStyles.has(rowIndex)}
                @expanded-changed=${(e) => {
                    if (e.detail.expanded) {
                        this._expandedRowStyles.add(rowIndex);
                    } else {
                        this._expandedRowStyles.delete(rowIndex);
                    }
                    this.requestUpdate();
                }}>
                ${this._renderStyleFields(rowIndex, 'row', style)}
            </lcards-form-section>
        `;
    }

    _renderCellStyles(row, rowIndex) {
        const cellStyles = row.cellStyles || [];
        const values = row.values || [];

        return html`
            <lcards-form-section
                header="Cell Style Overrides"
                description="Individual style overrides for specific cells"
                ?expanded=${this._expandedCellStyles.has(rowIndex)}
                @expanded-changed=${(e) => {
                    if (e.detail.expanded) {
                        this._expandedCellStyles.add(rowIndex);
                    } else {
                        this._expandedCellStyles.delete(rowIndex);
                    }
                    this.requestUpdate();
                }}>
                <div class="cell-styles-grid">
                    ${values.map((_, cellIndex) => {
                            const cellStyle = cellStyles[cellIndex] || null;
                            const hasOverride = cellStyle !== null && cellStyle !== undefined;

                            return html`
                                <div class="cell-style-card">
                                    <div class="cell-style-header">
                                        <span>Cell ${cellIndex + 1}</span>
                                        <ha-switch
                                            .checked=${hasOverride}
                                            @change=${(e) => this._toggleCellStyleOverride(rowIndex, cellIndex, e.target.checked)}>
                                        </ha-switch>
                                    </div>
                                    ${hasOverride ? html`
                                        <div class="style-fields">
                                            ${this._renderStyleFields(rowIndex, 'cell', cellStyle || {}, cellIndex)}
                                        </div>
                                    ` : html`
                                        <div style="color: var(--secondary-text-color); font-size: 11px; font-style: italic;">
                                            Using row/grid defaults
                                        </div>
                                    `}
                                </div>
                            `;
                        })}
                </div>
            </lcards-form-section>
        `;
    }

    _renderStyleFields(rowIndex, type, style, cellIndex = null) {
        return html`
            <lcards-color-section
                .editor=${this}
                header="Colors"
                .colorPaths=${[
                    { path: 'background', label: 'Background', helper: 'Cell background color' },
                    { path: 'color', label: 'Text Color', helper: 'Cell text color' }
                ]}
                .getConfigValue=${(path) => style[path] || ''}
                .setConfigValue=${(path, value) => this._handleStyleChange(rowIndex, type, path, value, cellIndex)}
                ?expanded=${true}
                ?useColorPicker=${true}>
            </lcards-color-section>

            <lcards-grid-layout columns="2">
                <ha-textfield
                    label="Font Size"
                    .value=${style.font_size || ''}
                    placeholder="e.g., 14px"
                    @input=${(e) => this._handleStyleChange(rowIndex, type, 'font_size', e.target.value, cellIndex)}>
                </ha-textfield>

                <ha-textfield
                    label="Font Weight"
                    type="number"
                    min="100"
                    max="900"
                    step="100"
                    .value=${style.font_weight || ''}
                    placeholder="e.g., 700"
                    @input=${(e) => this._handleStyleChange(rowIndex, type, 'font_weight', e.target.value, cellIndex)}>
                </ha-textfield>
            </lcards-grid-layout>

            <ha-textfield
                label="Padding"
                .value=${style.padding || ''}
                placeholder="e.g., 8px or 8px 12px"
                @input=${(e) => this._handleStyleChange(rowIndex, type, 'padding', e.target.value, cellIndex)}>
            </ha-textfield>

            <ha-textfield
                label="Border Width"
                .value=${style.border_width || ''}
                placeholder="e.g., 2px"
                @input=${(e) => this._handleStyleChange(rowIndex, type, 'border_width', e.target.value, cellIndex)}>
            </ha-textfield>

            <lcards-color-section
                .editor=${this}
                header="Border Color"
                .colorPaths=${[
                    { path: 'border_color', label: 'Color', helper: 'Border color' }
                ]}
                .getConfigValue=${(path) => style[path] || ''}
                .setConfigValue=${(path, value) => this._handleStyleChange(rowIndex, type, path, value, cellIndex)}
                ?expanded=${true}
                ?useColorPicker=${true}>
            </lcards-color-section>

            <lcards-grid-layout columns="2">

                <ha-selector
                    .hass=${this.hass}
                    .selector=${{
                        select: {
                            mode: 'dropdown',
                            options: ['solid', 'dashed', 'dotted', 'none']
                        }
                    }}
                    .label=${'Border Style'}
                    .value=${style.border_style || 'solid'}
                    @value-changed=${(e) => this._handleStyleChange(rowIndex, type, 'border_style', e.detail.value, cellIndex)}>
                </ha-selector>
            </lcards-grid-layout>
        `;
    }

    // ============================================================================
    // Row Management Methods
    // ============================================================================

    _addRow() {
        const newRow = {
            values: ['', '', ''],
            style: {},
            cellStyles: []
        };
        this._editingRows = [...this._editingRows, newRow];
        this._expandedRows.add(this._editingRows.length - 1);
        this.requestUpdate();
        lcardsLog.debug('[LCARdSTemplateEditorDialog] Added row');
    }

    _deleteRow(index) {
        const row = this._editingRows[index];
        const hasContent = row.values.some(v => v && v.trim() !== '');

        if (hasContent) {
            if (!confirm('This row has content. Are you sure you want to delete it?')) {
                return;
            }
        }

        this._editingRows = this._editingRows.filter((_, i) => i !== index);
        this._expandedRows.delete(index);
        this._expandedRowStyles.delete(index);
        this._expandedCellStyles.delete(index);

        // Adjust expanded indices
        const newExpandedRows = new Set();
        const newExpandedRowStyles = new Set();
        const newExpandedCellStyles = new Set();

        this._expandedRows.forEach(i => {
            if (i > index) newExpandedRows.add(i - 1);
            else if (i < index) newExpandedRows.add(i);
        });
        this._expandedRowStyles.forEach(i => {
            if (i > index) newExpandedRowStyles.add(i - 1);
            else if (i < index) newExpandedRowStyles.add(i);
        });
        this._expandedCellStyles.forEach(i => {
            if (i > index) newExpandedCellStyles.add(i - 1);
            else if (i < index) newExpandedCellStyles.add(i);
        });

        this._expandedRows = newExpandedRows;
        this._expandedRowStyles = newExpandedRowStyles;
        this._expandedCellStyles = newExpandedCellStyles;

        this.requestUpdate();
        lcardsLog.debug('[LCARdSTemplateEditorDialog] Deleted row', index);
    }

    _moveRowUp(index) {
        if (index === 0) return;

        const newRows = [...this._editingRows];
        [newRows[index - 1], newRows[index]] = [newRows[index], newRows[index - 1]];
        this._editingRows = newRows;

        // Update expanded state
        const wasExpanded = this._expandedRows.has(index);
        const wasExpandedAbove = this._expandedRows.has(index - 1);

        this._expandedRows.delete(index);
        this._expandedRows.delete(index - 1);

        if (wasExpanded) this._expandedRows.add(index - 1);
        if (wasExpandedAbove) this._expandedRows.add(index);

        this.requestUpdate();
        lcardsLog.debug('[LCARdSTemplateEditorDialog] Moved row up', index);
    }

    _moveRowDown(index) {
        if (index === this._editingRows.length - 1) return;

        const newRows = [...this._editingRows];
        [newRows[index], newRows[index + 1]] = [newRows[index + 1], newRows[index]];
        this._editingRows = newRows;

        // Update expanded state
        const wasExpanded = this._expandedRows.has(index);
        const wasExpandedBelow = this._expandedRows.has(index + 1);

        this._expandedRows.delete(index);
        this._expandedRows.delete(index + 1);

        if (wasExpanded) this._expandedRows.add(index + 1);
        if (wasExpandedBelow) this._expandedRows.add(index);

        this.requestUpdate();
        lcardsLog.debug('[LCARdSTemplateEditorDialog] Moved row down', index);
    }

    _toggleRowExpanded(index) {
        if (this._expandedRows.has(index)) {
            this._expandedRows.delete(index);
        } else {
            this._expandedRows.add(index);
        }
        this.requestUpdate();
    }

    _toggleRowStyleExpanded(index) {
        if (this._expandedRowStyles.has(index)) {
            this._expandedRowStyles.delete(index);
        } else {
            this._expandedRowStyles.add(index);
        }
        this.requestUpdate();
    }

    _toggleCellStyleExpanded(index) {
        if (this._expandedCellStyles.has(index)) {
            this._expandedCellStyles.delete(index);
        } else {
            this._expandedCellStyles.add(index);
        }
        this.requestUpdate();
    }

    // ============================================================================
    // Cell Management Methods
    // ============================================================================

    _handleCellValueChange(rowIndex, cellIndex, value) {
        const row = this._editingRows[rowIndex];
        if (!row.values) {
            row.values = [];
        }
        row.values[cellIndex] = value;
        this.requestUpdate();
        lcardsLog.debug('[LCARdSTemplateEditorDialog] Cell value changed', { rowIndex, cellIndex, value });
    }

    _addCell(rowIndex) {
        const row = this._editingRows[rowIndex];
        if (!row.values) {
            row.values = [];
        }
        row.values.push('');
        this.requestUpdate();
        lcardsLog.debug('[LCARdSTemplateEditorDialog] Added cell to row', rowIndex);
    }

    _deleteCell(rowIndex, cellIndex) {
        const row = this._editingRows[rowIndex];
        if (row.values && row.values.length > 1) {
            row.values.splice(cellIndex, 1);
            // Also remove corresponding cell style if it exists
            if (row.cellStyles && row.cellStyles[cellIndex] !== undefined) {
                row.cellStyles.splice(cellIndex, 1);
            }
            this.requestUpdate();
            lcardsLog.debug('[LCARdSTemplateEditorDialog] Deleted cell', { rowIndex, cellIndex });
        }
    }

    _openEntityPicker(rowIndex, cellIndex) {
        // Create inline entity picker
        const row = this._editingRows[rowIndex];
        const currentValue = row.values?.[cellIndex] || '';

        // Extract entity ID from template if present
        let currentEntity = '';
        const templateMatch = currentValue.match(/{{states\.([^.}]+\.[^.}]+)/);
        if (templateMatch) {
            currentEntity = templateMatch[1];
        }

        // Create a temporary container for the entity picker
        const container = document.createElement('div');
        container.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: var(--card-background-color, white);
            padding: 24px;
            border-radius: 8px;
            box-shadow: var(--ha-card-box-shadow, 0 8px 16px rgba(0,0,0,0.2));
            z-index: 10000;
            min-width: 400px;
        `;

        // Create title
        const title = document.createElement('div');
        title.textContent = 'Select Entity';
        title.style.cssText = 'margin-bottom: 16px; font-weight: 500;';
        container.appendChild(title);

        // Create ha-selector with entity selector
        const selector = document.createElement('ha-selector');
        // @ts-ignore - TS2339: auto-suppressed
        selector.hass = this.hass;
        // @ts-ignore - TS2339: auto-suppressed
        selector.selector = { entity: {} };
        // @ts-ignore - TS2339: auto-suppressed
        selector.value = currentEntity;
        // @ts-ignore - TS2339: auto-suppressed
        selector.label = 'Entity';
        container.appendChild(selector);

        let selectedEntity = currentEntity;
        selector.addEventListener('value-changed', (e) => {
            // @ts-ignore - TS2339: auto-suppressed
            selectedEntity = e.detail.value;
        });

        // Create button container
        const buttonContainer = document.createElement('div');
        buttonContainer.style.cssText = 'display: flex; gap: 8px; margin-top: 16px; justify-content: flex-end;';

        const cancelBtn = document.createElement('ha-button');
        cancelBtn.textContent = 'Cancel';
        cancelBtn.className = 'cancel-btn';

        const insertBtn = document.createElement('ha-button');
        insertBtn.textContent = 'Insert Template';
        // @ts-ignore - TS2339: auto-suppressed
        insertBtn.raised = true;
        insertBtn.className = 'insert-btn';

        buttonContainer.appendChild(cancelBtn);
        buttonContainer.appendChild(insertBtn);
        container.appendChild(buttonContainer);

        // Create backdrop
        const backdrop = document.createElement('div');
        backdrop.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0,0,0,0.5);
            z-index: 9999;
        `;

        // Unified cleanup function to prevent memory leaks
        const cleanup = () => {
            container.remove();
            backdrop.remove();
        };

        // Insert button handler
        const handleInsert = () => {
            if (selectedEntity) {
                const template = `{{states.${selectedEntity}.state}}`;
                this._handleCellValueChange(rowIndex, cellIndex, template);
            }
            cleanup();
        };

        // Cancel button handler
        const handleCancel = () => {
            cleanup();
        };

        // Backdrop click handler
        const handleBackdropClick = () => {
            cleanup();
        };

        // Attach event listeners
        insertBtn.addEventListener('click', handleInsert);
        cancelBtn.addEventListener('click', handleCancel);
        backdrop.addEventListener('click', handleBackdropClick);

        // Add to DOM
        document.body.appendChild(backdrop);
        document.body.appendChild(container);

        lcardsLog.debug('[LCARdSTemplateEditorDialog] Opening entity picker', { rowIndex, cellIndex });
    }

    // ============================================================================
    // Style Management Methods
    // ============================================================================

    _handleStyleChange(rowIndex, type, property, value, cellIndex = null) {
        const row = this._editingRows[rowIndex];

        if (type === 'row') {
            if (!row.style) {
                row.style = {};
            }
            if (value === '' || value === null || value === undefined) {
                delete row.style[property];
            } else {
                row.style[property] = value;
            }
        } else if (type === 'cell' && cellIndex !== null) {
            if (!row.cellStyles) {
                row.cellStyles = [];
            }
            if (!row.cellStyles[cellIndex]) {
                row.cellStyles[cellIndex] = {};
            }
            if (value === '' || value === null || value === undefined) {
                delete row.cellStyles[cellIndex][property];
            } else {
                row.cellStyles[cellIndex][property] = value;
            }
        }

        this.requestUpdate();
        lcardsLog.debug('[LCARdSTemplateEditorDialog] Style changed', { rowIndex, type, property, value, cellIndex });
    }

    _toggleCellStyleOverride(rowIndex, cellIndex, enabled) {
        const row = this._editingRows[rowIndex];
        if (!row.cellStyles) {
            row.cellStyles = [];
        }

        if (enabled) {
            // Enable override with empty object
            row.cellStyles[cellIndex] = {};
        } else {
            // Disable override (set to null)
            row.cellStyles[cellIndex] = null;
        }

        this.requestUpdate();
        lcardsLog.debug('[LCARdSTemplateEditorDialog] Toggled cell style override', { rowIndex, cellIndex, enabled });
    }

    // ============================================================================
    // Save/Cancel/Close Methods
    // ============================================================================

    _handleSave() {
        // Clean up the rows before saving
        const cleanedRows = this._editingRows.map(row => {
            const cleaned = {
                values: row.values || []
            };

            // Only include style if it has properties
            if (row.style && Object.keys(row.style).length > 0) {
                cleaned.style = row.style;
            }

            // Only include cellStyles if it has meaningful entries (non-null/undefined)
            if (row.cellStyles && row.cellStyles.length > 0) {
                // Filter out trailing nulls and check if any non-null entries exist
                const meaningfulStyles = row.cellStyles.some(style =>
                    style !== null && style !== undefined && Object.keys(style).length > 0
                );

                if (meaningfulStyles) {
                    cleaned.cellStyles = row.cellStyles;
                }
            }

            return cleaned;
        });

        // Fire rows-changed event
        this.dispatchEvent(new CustomEvent('rows-changed', {
            detail: { rows: cleanedRows },
            bubbles: true,
            composed: true
        }));

        lcardsLog.info('[LCARdSTemplateEditorDialog] Rows saved', cleanedRows);
        this._closeDialog();
    }

    _handleCancel() {
        lcardsLog.debug('[LCARdSTemplateEditorDialog] Cancelled');
        this._closeDialog();
    }

    _handleClose(e) {
        lcardsLog.debug('[LCARdSTemplateEditorDialog] Dialog closed');
        this._closeDialog();
    }

    _closeDialog() {
        // Fire closed event for cleanup
        this.dispatchEvent(new CustomEvent('closed', {
            bubbles: true,
            composed: true
        }));
    }
}

customElements.define('lcards-template-editor-dialog', LCARdSTemplateEditorDialog);
