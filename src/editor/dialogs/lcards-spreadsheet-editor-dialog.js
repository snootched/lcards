/**
 * LCARdS Spreadsheet Editor Dialog
 *
 * Modal dialog for configuring spreadsheet layout in datasource mode.
 * Allows users to define columns with headers/widths/alignment and rows with
 * mixed static/datasource cells, plus hierarchical styling at column/row/cell levels.
 *
 * @element lcards-spreadsheet-editor-dialog
 * @fires config-changed - When configuration is saved (detail: { columns, rows, data_sources })
 * @fires closed - When dialog is closed
 *
 * @property {Object} hass - Home Assistant instance
 * @property {Array} columns - Array of column configurations
 * @property {Array} rows - Array of row configurations
 */

import { LitElement, html, css } from 'lit';
import { lcardsLog } from '../../utils/lcards-logging.js';
import '../components/shared/lcards-dialog.js';
import '../components/shared/lcards-form-section.js';
import '../components/editors/lcards-grid-layout.js';
import '../components/editors/lcards-color-section.js';

export class LCARdSSpreadsheetEditorDialog extends LitElement {
    static get properties() {
        return {
            hass: { type: Object },
            columns: { type: Array },
            rows: { type: Array },
            _editingColumns: { type: Array, state: true },
            _editingRows: { type: Array, state: true },
            _expandedColumns: { type: Set, state: true },
            _expandedRows: { type: Set, state: true },
            _expandedColumnStyles: { type: Set, state: true },
            _expandedRowStyles: { type: Set, state: true },
            _expandedCellStyles: { type: Set, state: true },
            _validationErrors: { type: Array, state: true }
        };
    }

    constructor() {
        super();
        this.hass = null;
        this.columns = [];
        this.rows = [];
        this._editingColumns = [];
        this._editingRows = [];
        this._expandedColumns = new Set();
        this._expandedRows = new Set();
        this._expandedColumnStyles = new Set();
        this._expandedRowStyles = new Set();
        this._expandedCellStyles = new Set();
        this._validationErrors = [];
        lcardsLog.debug('[LCARdSSpreadsheetEditorDialog] Constructor called');
    }

    static get styles() {
        return css`
            :host {
                display: block;
            }

            lcards-dialog {
                --mdc-dialog-min-width: 900px;
                --mdc-dialog-max-width: 1100px;
            }

            .dialog-content {
                display: flex;
                flex-direction: column;
                gap: 16px;
                padding: 8px 0;
                max-height: 70vh;
                overflow-y: auto;
            }

            .section {
                border: 2px solid var(--divider-color, #e0e0e0);
                border-radius: 8px;
                padding: 16px;
                background: var(--card-background-color, white);
            }

            .section-header {
                display: flex;
                align-items: center;
                justify-content: space-between;
                margin-bottom: 12px;
                padding-bottom: 8px;
                border-bottom: 2px solid var(--divider-color, #e0e0e0);
            }

            .section-title {
                font-size: 16px;
                font-weight: 600;
                color: var(--primary-text-color);
            }

            .add-button {
                margin-bottom: 12px;
            }

            .item-container {
                border: 2px solid var(--chip-background-color, #e0e0e0);
                border-radius: 8px;
                padding: 12px;
                background: var(--card-background-color, white);
                margin-bottom: 12px;
            }

            .item-header {
                display: flex;
                align-items: center;
                gap: 8px;
                cursor: pointer;
                user-select: none;
                padding: 8px;
                background: var(--chip-background-color, #f5f5f5);
                border-radius: 4px;
                margin-bottom: 8px;
            }

            .item-header:hover {
                background: var(--secondary-background-color, #e0e0e0);
            }

            .expand-icon {
                transition: transform 0.2s;
            }

            .expand-icon.expanded {
                transform: rotate(90deg);
            }

            .item-title {
                flex: 1;
                font-weight: 500;
                font-size: 14px;
            }

            .item-actions {
                display: flex;
                gap: 4px;
            }

            .item-actions mwc-icon-button {
                --mdc-icon-button-size: 32px;
                --mdc-icon-size: 20px;
            }

            .item-content {
                display: flex;
                flex-direction: column;
                gap: 12px;
                padding: 8px 0;
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

            .cells-grid {
                display: grid;
                grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
                gap: 12px;
                margin-top: 12px;
            }

            .cell-card {
                border: 1px solid var(--divider-color, #e0e0e0);
                border-radius: 4px;
                padding: 12px;
                background: var(--card-background-color, white);
            }

            .cell-header {
                display: flex;
                align-items: center;
                justify-content: space-between;
                margin-bottom: 8px;
                font-weight: 500;
                font-size: 12px;
                color: var(--primary-color);
            }

            .cell-fields {
                display: flex;
                flex-direction: column;
                gap: 8px;
            }

            .validation-errors {
                background: var(--error-color, #ff5252);
                color: white;
                padding: 12px;
                border-radius: 4px;
                margin-bottom: 12px;
            }

            .validation-error {
                margin-bottom: 4px;
            }

            .validation-error:last-child {
                margin-bottom: 0;
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

            ha-textfield,
            ha-selector {
                width: 100%;
            }

            .datasource-button {
                width: 100%;
                margin-bottom: 8px;
            }

            .source-info {
                font-size: 12px;
                color: var(--secondary-text-color);
                padding: 8px;
                background: var(--chip-background-color, #f5f5f5);
                border-radius: 4px;
                margin-bottom: 8px;
            }

            .source-info strong {
                color: var(--primary-text-color);
            }
        `;
    }

    connectedCallback() {
        super.connectedCallback();
        // Deep clone for editing (don't mutate props)
        this._editingColumns = JSON.parse(JSON.stringify(this.columns || []));
        this._editingRows = JSON.parse(JSON.stringify(this.rows || []));

        // Initialize with defaults if empty
        if (this._editingColumns.length === 0) {
            this._addColumn(); // Start with one column
        }
        if (this._editingRows.length === 0) {
            this._addRow(); // Start with one row
        }

        lcardsLog.debug('[LCARdSSpreadsheetEditorDialog] Connected with columns:', this._editingColumns, 'rows:', this._editingRows);
    }

    render() {
        return html`
            <lcards-dialog
                open
                @closed=${this._handleClose}
                .heading=${'Configure Spreadsheet'}>

                <div class="dialog-content">
                    ${this._validationErrors.length > 0 ? this._renderValidationErrors() : ''}

                    <div class="section">
                        <div class="section-header">
                            <div class="section-title">Columns</div>
                            <ha-button
                                dense
                                raised
                                @click=${this._addColumn}>
                                <ha-icon icon="mdi:plus" slot="icon"></ha-icon>
                                Add Column
                            </ha-button>
                        </div>
                        ${this._renderColumnList()}
                    </div>

                    <div class="section">
                        <div class="section-header">
                            <div class="section-title">Rows</div>
                            <ha-button
                                dense
                                raised
                                @click=${this._addRow}>
                                <ha-icon icon="mdi:plus" slot="icon"></ha-icon>
                                Add Row
                            </ha-button>
                        </div>
                        ${this._renderRowList()}
                    </div>
                </div>

                <ha-button
                    slot="primaryAction"
                    @click=${this._handleSave}
                    ?disabled=${!this._canSave()}>
                    Save
                </ha-button>
                <ha-button slot="secondaryAction" @click=${this._handleCancel}>
                    Cancel
                </ha-button>
            </lcards-dialog>
        `;
    }

    // ============================================================================
    // Validation
    // ============================================================================

    _renderValidationErrors() {
        return html`
            <div class="validation-errors">
                <strong>Please fix the following errors:</strong>
                ${this._validationErrors.map(error => html`
                    <div class="validation-error">• ${error}</div>
                `)}
            </div>
        `;
    }

    _canSave() {
        this._validationErrors = [];

        // Validate columns
        if (!this._validateColumns()) return false;

        // Validate rows
        if (!this._validateRows()) return false;

        // Validate data sources
        if (!this._validateDataSources()) return false;

        return true;
    }

    _validateColumns() {
        if (this._editingColumns.length === 0) {
            this._validationErrors.push('At least one column is required');
            return false;
        }

        // Check for empty headers
        const emptyHeaders = this._editingColumns.filter((col, idx) => !col.header || col.header.trim() === '');
        if (emptyHeaders.length > 0) {
            this._validationErrors.push('All columns must have headers');
            return false;
        }

        return true;
    }

    _validateRows() {
        if (this._editingRows.length === 0) {
            this._validationErrors.push('At least one row is required');
            return false;
        }

        // Check that all rows have cells for all columns
        for (let i = 0; i < this._editingRows.length; i++) {
            const row = this._editingRows[i];
            if (!row.sources || row.sources.length === 0) {
                this._validationErrors.push(`Row ${i + 1} has no cells configured`);
                return false;
            }

            // Check all columns are represented
            for (let colIdx = 0; colIdx < this._editingColumns.length; colIdx++) {
                const cellConfig = row.sources.find(s => s.column === colIdx);
                if (!cellConfig) {
                    this._validationErrors.push(`Row ${i + 1} is missing configuration for column ${colIdx + 1}`);
                    return false;
                }
            }
        }

        return true;
    }

    _validateDataSources() {
        // Check that all datasource cells have sources
        for (let i = 0; i < this._editingRows.length; i++) {
            const row = this._editingRows[i];
            if (!row.sources) continue;

            for (const cellConfig of row.sources) {
                if (cellConfig.type === 'datasource' && (!cellConfig.source || cellConfig.source.trim() === '')) {
                    const colHeader = this._editingColumns[cellConfig.column]?.header || `Column ${cellConfig.column + 1}`;
                    this._validationErrors.push(`Row ${i + 1}, ${colHeader}: DataSource cells must have a source selected`);
                    return false;
                }
            }
        }

        return true;
    }

    // ============================================================================
    // Column Management
    // ============================================================================

    _renderColumnList() {
        if (this._editingColumns.length === 0) {
            return html`
                <div class="empty-state">
                    <ha-icon icon="mdi:table-column-plus-after"></ha-icon>
                    <div>No columns configured. Click "Add Column" to get started.</div>
                </div>
            `;
        }

        return html`
            ${this._editingColumns.map((column, index) => this._renderColumn(column, index))}
        `;
    }

    _renderColumn(column, index) {
        const isExpanded = this._expandedColumns.has(index);

        return html`
            <div class="item-container">
                <div class="item-header" @click=${() => this._toggleColumnExpanded(index)}>
                    <ha-icon
                        class="expand-icon ${isExpanded ? 'expanded' : ''}"
                        icon="mdi:chevron-right">
                    </ha-icon>
                    <div class="item-title">
                        Column ${index + 1}: ${column.header || '(No header)'}
                    </div>
                    <div class="item-actions" @click=${(e) => e.stopPropagation()}>
                        <mwc-icon-button
                            @click=${() => this._moveColumnUp(index)}
                            ?disabled=${index === 0}
                            title="Move left">
                            <ha-icon icon="mdi:arrow-left"></ha-icon>
                        </mwc-icon-button>
                        <mwc-icon-button
                            @click=${() => this._moveColumnDown(index)}
                            ?disabled=${index === this._editingColumns.length - 1}
                            title="Move right">
                            <ha-icon icon="mdi:arrow-right"></ha-icon>
                        </mwc-icon-button>
                        <mwc-icon-button
                            @click=${() => this._deleteColumn(index)}
                            title="Delete column">
                            <ha-icon icon="mdi:delete"></ha-icon>
                        </mwc-icon-button>
                    </div>
                </div>

                ${isExpanded ? html`
                    <div class="item-content">
                        ${this._renderColumnFields(column, index)}
                        ${this._renderColumnStyle(column, index)}
                    </div>
                ` : ''}
            </div>
        `;
    }

    _renderColumnFields(column, index) {
        return html`
            <lcards-grid-layout columns="3">
                <ha-textfield
                    label="Header"
                    .value=${column.header || ''}
                    placeholder="Column header"
                    @input=${(e) => this._handleColumnHeaderChange(index, e.target.value)}>
                </ha-textfield>

                <ha-textfield
                    label="Width (px)"
                    type="number"
                    min="50"
                    .value=${column.width || 100}
                    placeholder="100"
                    @input=${(e) => this._handleColumnWidthChange(index, e.target.value)}>
                </ha-textfield>

                <ha-selector
                    .hass=${this.hass}
                    .selector=${{
                        select: {
                            mode: 'dropdown',
                            options: ['left', 'center', 'right']
                        }
                    }}
                    .label=${'Alignment'}
                    .value=${column.align || 'center'}
                    @value-changed=${(e) => this._handleColumnAlignChange(index, e.detail.value)}>
                </ha-selector>
            </lcards-grid-layout>
        `;
    }

    _renderColumnStyle(column, index) {
        const isExpanded = this._expandedColumnStyles.has(index);
        const style = column.style || {};

        return html`
            <div class="style-section">
                <div class="style-header" @click=${() => this._toggleColumnStyleExpanded(index)}>
                    <ha-icon icon="${isExpanded ? 'mdi:chevron-down' : 'mdi:chevron-right'}"></ha-icon>
                    <span>Column Style Overrides</span>
                </div>
                ${isExpanded ? html`
                    <div class="style-fields">
                        ${this._renderStyleFields(index, 'column', style)}
                    </div>
                ` : ''}
            </div>
        `;
    }

    _addColumn() {
        const newColumn = {
            header: `Column ${this._editingColumns.length + 1}`,
            width: 100,
            align: 'center',
            style: {}
        };
        this._editingColumns = [...this._editingColumns, newColumn];

        // Add cells to all rows for this new column
        const columnIndex = this._editingColumns.length - 1;
        this._editingRows = this._editingRows.map(row => {
            const sources = row.sources || [];
            return {
                ...row,
                sources: [...sources, {
                    type: 'static',
                    column: columnIndex,
                    value: ''
                }]
            };
        });

        this._expandedColumns.add(columnIndex);
        this.requestUpdate();
        lcardsLog.debug('[LCARdSSpreadsheetEditorDialog] Added column');
    }

    _deleteColumn(index) {
        const column = this._editingColumns[index];

        if (!confirm(`Delete column "${column.header}"? This will remove the column from all rows.`)) {
            return;
        }

        // Remove column
        this._editingColumns = this._editingColumns.filter((_, i) => i !== index);

        // Remove cells from all rows and adjust column indices
        this._editingRows = this._editingRows.map(row => {
            const sources = (row.sources || [])
                .filter(s => s.column !== index) // Remove cells for deleted column
                .map(s => ({
                    ...s,
                    column: s.column > index ? s.column - 1 : s.column // Adjust indices
                }));
            return {
                ...row,
                sources
            };
        });

        // Clean up expanded state
        this._expandedColumns.delete(index);
        this._expandedColumnStyles.delete(index);

        // Adjust expanded indices
        const newExpandedColumns = new Set();
        const newExpandedColumnStyles = new Set();

        this._expandedColumns.forEach(i => {
            if (i > index) newExpandedColumns.add(i - 1);
            else if (i < index) newExpandedColumns.add(i);
        });
        this._expandedColumnStyles.forEach(i => {
            if (i > index) newExpandedColumnStyles.add(i - 1);
            else if (i < index) newExpandedColumnStyles.add(i);
        });

        this._expandedColumns = newExpandedColumns;
        this._expandedColumnStyles = newExpandedColumnStyles;

        this.requestUpdate();
        lcardsLog.debug('[LCARdSSpreadsheetEditorDialog] Deleted column', index);
    }

    _moveColumnUp(index) {
        if (index === 0) return;

        const columns = [...this._editingColumns];
        [columns[index - 1], columns[index]] = [columns[index], columns[index - 1]];
        this._editingColumns = columns;

        // Swap cell column indices in all rows
        this._editingRows = this._editingRows.map(row => {
            const sources = (row.sources || []).map(s => {
                if (s.column === index) return { ...s, column: index - 1 };
                if (s.column === index - 1) return { ...s, column: index };
                return s;
            });
            return { ...row, sources };
        });

        this.requestUpdate();
    }

    _moveColumnDown(index) {
        if (index === this._editingColumns.length - 1) return;

        const columns = [...this._editingColumns];
        [columns[index], columns[index + 1]] = [columns[index + 1], columns[index]];
        this._editingColumns = columns;

        // Swap cell column indices in all rows
        this._editingRows = this._editingRows.map(row => {
            const sources = (row.sources || []).map(s => {
                if (s.column === index) return { ...s, column: index + 1 };
                if (s.column === index + 1) return { ...s, column: index };
                return s;
            });
            return { ...row, sources };
        });

        this.requestUpdate();
    }

    _toggleColumnExpanded(index) {
        if (this._expandedColumns.has(index)) {
            this._expandedColumns.delete(index);
        } else {
            this._expandedColumns.add(index);
        }
        this.requestUpdate();
    }

    _toggleColumnStyleExpanded(index) {
        if (this._expandedColumnStyles.has(index)) {
            this._expandedColumnStyles.delete(index);
        } else {
            this._expandedColumnStyles.add(index);
        }
        this.requestUpdate();
    }

    _handleColumnHeaderChange(index, value) {
        this._editingColumns[index].header = value;
        this.requestUpdate();
    }

    _handleColumnWidthChange(index, value) {
        this._editingColumns[index].width = parseInt(value) || 100;
        this.requestUpdate();
    }

    _handleColumnAlignChange(index, value) {
        this._editingColumns[index].align = value;
        this.requestUpdate();
    }

    // ============================================================================
    // Row Management
    // ============================================================================

    _renderRowList() {
        if (this._editingRows.length === 0) {
            return html`
                <div class="empty-state">
                    <ha-icon icon="mdi:table-row-plus-after"></ha-icon>
                    <div>No rows configured. Click "Add Row" to get started.</div>
                </div>
            `;
        }

        return html`
            ${this._editingRows.map((row, index) => this._renderRow(row, index))}
        `;
    }

    _renderRow(row, index) {
        const isExpanded = this._expandedRows.has(index);

        return html`
            <div class="item-container">
                <div class="item-header" @click=${() => this._toggleRowExpanded(index)}>
                    <ha-icon
                        class="expand-icon ${isExpanded ? 'expanded' : ''}"
                        icon="mdi:chevron-right">
                    </ha-icon>
                    <div class="item-title">
                        Row ${index + 1}
                    </div>
                    <div class="item-actions" @click=${(e) => e.stopPropagation()}>
                        <mwc-icon-button
                            @click=${() => this._moveRowUp(index)}
                            ?disabled=${index === 0}
                            title="Move up">
                            <ha-icon icon="mdi:arrow-up"></ha-icon>
                        </mwc-icon-button>
                        <mwc-icon-button
                            @click=${() => this._moveRowDown(index)}
                            ?disabled=${index === this._editingRows.length - 1}
                            title="Move down">
                            <ha-icon icon="mdi:arrow-down"></ha-icon>
                        </mwc-icon-button>
                        <mwc-icon-button
                            @click=${() => this._deleteRow(index)}
                            title="Delete row">
                            <ha-icon icon="mdi:delete"></ha-icon>
                        </mwc-icon-button>
                    </div>
                </div>

                ${isExpanded ? html`
                    <div class="item-content">
                        ${this._renderRowCells(row, index)}
                        ${this._renderRowStyle(row, index)}
                    </div>
                ` : ''}
            </div>
        `;
    }

    _renderRowCells(row, rowIndex) {
        const sources = row.sources || [];

        return html`
            <div class="cells-grid">
                ${this._editingColumns.map((column, columnIndex) => {
                    const cellConfig = sources.find(s => s.column === columnIndex) || {
                        type: 'static',
                        column: columnIndex,
                        value: ''
                    };
                    return this._renderCell(cellConfig, rowIndex, columnIndex, column);
                })}
            </div>
        `;
    }

    _renderCell(cellConfig, rowIndex, columnIndex, column) {
        const isDataSource = cellConfig.type === 'datasource';

        return html`
            <div class="cell-card">
                <div class="cell-header">
                    <span>${column.header || `Column ${columnIndex + 1}`}</span>
                </div>

                <div class="cell-fields">
                    <ha-selector
                        .hass=${this.hass}
                        .selector=${{
                            select: {
                                mode: 'dropdown',
                                options: ['static', 'datasource']
                            }
                        }}
                        .label=${'Type'}
                        .value=${cellConfig.type || 'static'}
                        @value-changed=${(e) => this._handleCellTypeChange(rowIndex, columnIndex, e.detail.value)}>
                    </ha-selector>

                    ${isDataSource
                        ? this._renderDataSourceCell(cellConfig, rowIndex, columnIndex)
                        : this._renderStaticCell(cellConfig, rowIndex, columnIndex)}
                </div>
            </div>
        `;
    }

    _renderStaticCell(cellConfig, rowIndex, columnIndex) {
        return html`
            <ha-textfield
                label="Value"
                .value=${cellConfig.value || ''}
                placeholder="Static text"
                @input=${(e) => this._handleStaticValueChange(rowIndex, columnIndex, e.target.value)}>
            </ha-textfield>
        `;
    }

    _renderDataSourceCell(cellConfig, rowIndex, columnIndex) {
        return html`
            <ha-button
                class="datasource-button"
                @click=${() => this._openDataSourcePicker(rowIndex, columnIndex)}>
                <ha-icon icon="mdi:database" slot="icon"></ha-icon>
                ${cellConfig.source ? 'Change Source' : 'Select Source'}
            </ha-button>

            ${cellConfig.source ? html`
                <div class="source-info">
                    <strong>Source:</strong> ${cellConfig.source}
                </div>
            ` : ''}

            <ha-textfield
                label="Format Template"
                .value=${cellConfig.format || '{value}'}
                placeholder="{value}"
                helper-text="Use {value} for the data value"
                @input=${(e) => this._handleFormatChange(rowIndex, columnIndex, e.target.value)}>
            </ha-textfield>

            <ha-selector
                .hass=${this.hass}
                .selector=${{
                    select: {
                        mode: 'dropdown',
                        options: ['last', 'avg', 'min', 'max']
                    }
                }}
                .label=${'Aggregation'}
                .value=${cellConfig.aggregation || 'last'}
                @value-changed=${(e) => this._handleAggregationChange(rowIndex, columnIndex, e.detail.value)}>
            </ha-selector>
        `;
    }

    _renderRowStyle(row, rowIndex) {
        const isExpanded = this._expandedRowStyles.has(rowIndex);
        const style = row.style || {};

        return html`
            <div class="style-section">
                <div class="style-header" @click=${() => this._toggleRowStyleExpanded(rowIndex)}>
                    <ha-icon icon="${isExpanded ? 'mdi:chevron-down' : 'mdi:chevron-right'}"></ha-icon>
                    <span>Row Style Overrides</span>
                </div>
                ${isExpanded ? html`
                    <div class="style-fields">
                        ${this._renderStyleFields(rowIndex, 'row', style)}
                    </div>
                ` : ''}
            </div>
        `;
    }

    _addRow() {
        // Create cells for all columns
        const sources = this._editingColumns.map((_, columnIndex) => ({
            type: 'static',
            column: columnIndex,
            value: ''
        }));

        const newRow = {
            sources,
            style: {}
        };

        this._editingRows = [...this._editingRows, newRow];
        this._expandedRows.add(this._editingRows.length - 1);
        this.requestUpdate();
        lcardsLog.debug('[LCARdSSpreadsheetEditorDialog] Added row');
    }

    _deleteRow(index) {
        if (!confirm('Delete this row?')) {
            return;
        }

        this._editingRows = this._editingRows.filter((_, i) => i !== index);
        this._expandedRows.delete(index);
        this._expandedRowStyles.delete(index);

        // Adjust expanded indices
        const newExpandedRows = new Set();
        const newExpandedRowStyles = new Set();

        this._expandedRows.forEach(i => {
            if (i > index) newExpandedRows.add(i - 1);
            else if (i < index) newExpandedRows.add(i);
        });
        this._expandedRowStyles.forEach(i => {
            if (i > index) newExpandedRowStyles.add(i - 1);
            else if (i < index) newExpandedRowStyles.add(i);
        });

        this._expandedRows = newExpandedRows;
        this._expandedRowStyles = newExpandedRowStyles;

        this.requestUpdate();
        lcardsLog.debug('[LCARdSSpreadsheetEditorDialog] Deleted row', index);
    }

    _moveRowUp(index) {
        if (index === 0) return;

        const rows = [...this._editingRows];
        [rows[index - 1], rows[index]] = [rows[index], rows[index - 1]];
        this._editingRows = rows;
        this.requestUpdate();
    }

    _moveRowDown(index) {
        if (index === this._editingRows.length - 1) return;

        const rows = [...this._editingRows];
        [rows[index], rows[index + 1]] = [rows[index + 1], rows[index]];
        this._editingRows = rows;
        this.requestUpdate();
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

    // ============================================================================
    // Cell Event Handlers
    // ============================================================================

    _handleCellTypeChange(rowIndex, columnIndex, type) {
        const row = this._editingRows[rowIndex];
        if (!row.sources) {
            row.sources = [];
        }

        let cellConfig = row.sources.find(s => s.column === columnIndex);
        if (!cellConfig) {
            cellConfig = {
                type: 'static',
                column: columnIndex,
                value: ''
            };
            row.sources.push(cellConfig);
        }

        cellConfig.type = type;

        // Initialize datasource fields
        if (type === 'datasource') {
            cellConfig.source = cellConfig.source || '';
            cellConfig.format = cellConfig.format || '{value}';
            cellConfig.aggregation = cellConfig.aggregation || 'last';
            delete cellConfig.value;
        } else {
            cellConfig.value = cellConfig.value || '';
            delete cellConfig.source;
            delete cellConfig.format;
            delete cellConfig.aggregation;
        }

        this.requestUpdate();
        lcardsLog.debug('[LCARdSSpreadsheetEditorDialog] Cell type changed', { rowIndex, columnIndex, type });
    }

    _handleStaticValueChange(rowIndex, columnIndex, value) {
        const row = this._editingRows[rowIndex];
        const cellConfig = row.sources.find(s => s.column === columnIndex);
        if (cellConfig) {
            cellConfig.value = value;
            this.requestUpdate();
        }
    }

    _handleFormatChange(rowIndex, columnIndex, format) {
        const row = this._editingRows[rowIndex];
        const cellConfig = row.sources.find(s => s.column === columnIndex);
        if (cellConfig) {
            cellConfig.format = format;
            this.requestUpdate();
        }
    }

    _handleAggregationChange(rowIndex, columnIndex, aggregation) {
        const row = this._editingRows[rowIndex];
        const cellConfig = row.sources.find(s => s.column === columnIndex);
        if (cellConfig) {
            cellConfig.aggregation = aggregation;
            this.requestUpdate();
        }
    }

    async _openDataSourcePicker(rowIndex, columnIndex) {
        // Dynamically import the dialog
        await import('./lcards-datasource-picker-dialog.js');

        const row = this._editingRows[rowIndex];
        const cellConfig = row.sources.find(s => s.column === columnIndex);

        const dialog = document.createElement('lcards-datasource-picker-dialog');
        dialog.hass = this.hass;
        dialog.currentSource = cellConfig?.source || '';
        dialog.open = true;

        dialog.addEventListener('source-selected', (e) => {
            this._handleDataSourceSelected(rowIndex, columnIndex, e.detail.source);
        });

        // Cleanup on close
        dialog.addEventListener('closed', () => {
            dialog.remove();
        });

        document.body.appendChild(dialog);
        lcardsLog.debug('[LCARdSSpreadsheetEditorDialog] Opened DataSource picker', { rowIndex, columnIndex });
    }

    _handleDataSourceSelected(rowIndex, columnIndex, source) {
        const row = this._editingRows[rowIndex];
        const cellConfig = row.sources.find(s => s.column === columnIndex);

        if (cellConfig) {
            cellConfig.source = source;
            this.requestUpdate();
            lcardsLog.debug('[LCARdSSpreadsheetEditorDialog] DataSource selected', { rowIndex, columnIndex, source });
        }
    }

    // ============================================================================
    // Style Fields Rendering
    // ============================================================================

    _renderStyleFields(index, type, style, cellIndex = null) {
        return html`
            <lcards-color-section
                .editor=${this}
                header="Colors"
                .colorPaths=${[
                    { path: 'background', label: 'Background', helper: 'Cell background color' },
                    { path: 'color', label: 'Text Color', helper: 'Cell text color' }
                ]}
                .getConfigValue=${(path) => style[path] || ''}
                .setConfigValue=${(path, value) => this._handleStyleChange(index, type, path, value, cellIndex)}
                ?expanded=${true}
                ?useColorPicker=${true}>
            </lcards-color-section>

            <lcards-grid-layout columns="2">
                <ha-textfield
                    label="Font Size"
                    .value=${style.font_size || ''}
                    placeholder="e.g., 14px"
                    @input=${(e) => this._handleStyleChange(index, type, 'font_size', e.target.value, cellIndex)}>
                </ha-textfield>

                <ha-textfield
                    label="Font Weight"
                    type="number"
                    min="100"
                    max="900"
                    step="100"
                    .value=${style.font_weight || ''}
                    placeholder="e.g., 700"
                    @input=${(e) => this._handleStyleChange(index, type, 'font_weight', e.target.value, cellIndex)}>
                </ha-textfield>
            </lcards-grid-layout>

            <ha-textfield
                label="Padding"
                .value=${style.padding || ''}
                placeholder="e.g., 8px or 8px 12px"
                @input=${(e) => this._handleStyleChange(index, type, 'padding', e.target.value, cellIndex)}>
            </ha-textfield>
        `;
    }

    _handleStyleChange(index, type, property, value, cellIndex = null) {
        if (type === 'column') {
            if (!this._editingColumns[index].style) {
                this._editingColumns[index].style = {};
            }
            this._editingColumns[index].style[property] = value;
        } else if (type === 'row') {
            if (!this._editingRows[index].style) {
                this._editingRows[index].style = {};
            }
            this._editingRows[index].style[property] = value;
        }

        this.requestUpdate();
    }

    // ============================================================================
    // Save/Cancel Handlers
    // ============================================================================

    _handleSave() {
        if (!this._canSave()) {
            lcardsLog.warn('[LCARdSSpreadsheetEditorDialog] Validation failed, cannot save');
            this.requestUpdate(); // Force re-render to show errors
            return;
        }

        // Clean up empty style objects
        const cleanedColumns = this._editingColumns.map(col => ({
            ...col,
            style: col.style && Object.keys(col.style).length > 0 ? col.style : undefined
        })).map(col => {
            const cleaned = { ...col };
            if (!cleaned.style) delete cleaned.style;
            return cleaned;
        });

        const cleanedRows = this._editingRows.map(row => ({
            ...row,
            style: row.style && Object.keys(row.style).length > 0 ? row.style : undefined
        })).map(row => {
            const cleaned = { ...row };
            if (!cleaned.style) delete cleaned.style;
            return cleaned;
        });

        // Fire config-changed event
        this.dispatchEvent(new CustomEvent('config-changed', {
            detail: {
                columns: cleanedColumns,
                rows: cleanedRows
            },
            bubbles: true,
            composed: true
        }));

        lcardsLog.info('[LCARdSSpreadsheetEditorDialog] Configuration saved', {
            columns: cleanedColumns,
            rows: cleanedRows
        });

        // Close dialog
        this._handleClose();
    }

    _handleCancel() {
        lcardsLog.debug('[LCARdSSpreadsheetEditorDialog] Configuration cancelled');
        this._handleClose();
    }

    _handleClose() {
        this.dispatchEvent(new CustomEvent('closed', {
            bubbles: true,
            composed: true
        }));
    }
}

customElements.define('lcards-spreadsheet-editor-dialog', LCARdSSpreadsheetEditorDialog);
