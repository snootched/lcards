/**
 * @fileoverview LCARdS Data Grid Configuration Studio V4
 *
 * 2-mode architecture:
 * - Decorative Mode: Auto-generated random LCARS data
 * - Data Mode: Real entities/sensors with custom templates per cell
 *
 * Key Features:
 * - Live preview with configurable grid dimensions
 * - Grid layout: Flexible spreadsheet-style data display with auto-detected cell types
 * - Visual hierarchy diagrams for styling
 * - Split-panel layout (50/50 config/preview) with independent scrolling
 * - Canvas toolbar with gridlines and animations toggle
 *
 * @element lcards-data-grid-studio-dialog-v4
 * @fires config-changed - When configuration is saved (detail: { config })
 * @fires closed - When dialog is closed
 *
 * @property {Object} hass - Home Assistant instance
 * @property {Object} config - Initial card configuration
 */

import { LitElement, html, css } from 'lit';
import { createRef, ref } from 'lit/directives/ref.js';
import { lcardsLog } from '../../utils/lcards-logging.js';
import { editorStyles } from '../base/editor-styles.js';
import { studioDialogStyles } from './studio-dialog-styles.js';
import { LCARdSFormFieldHelper as FormField } from '../components/shared/lcards-form-field.js';
import { dataGridSchema } from '../../cards/schemas/data-grid-schema.js';
import '../components/shared/lcards-form-section.js';
import '../components/shared/lcards-message.js';
import '../components/shared/lcards-style-hierarchy-diagram.js';
import '../components/editors/lcards-color-section.js';
import '../components/editors/lcards-padding-editor.js';
import '../components/editors/lcards-grid-layout.js';
import '../components/editors/lcards-font-selector.js';
import '../components/lcards-animation-editor.js';
import '../components/lcards-filter-editor.js';
import '../../cards/lcards-data-grid.js';

export class LCARdSDataGridStudioDialogV4 extends LitElement {
    static get properties() {
        return {
            hass: { type: Object },
            _initialConfig: { type: Object }, // Store initial config here
            _workingConfig: { type: Object, state: true },
            _activeTab: { type: String, state: true },
            _validationErrors: { type: Array, state: true },
            _activeCellEdit: { type: Object, state: true }, // {row, col, value}
            _activeRowEdit: { type: Number, state: true }, // row index
            _activeColumnEdit: { type: Number, state: true }, // column index
            _showGridLines: { type: Boolean, state: true }, // preview gridlines toggle
            _showAnimations: { type: Boolean, state: true }, // preview animations toggle
            _gridStylesSubTab: { type: String, state: true } // Grid Styles sub-tab: 'hierarchy', 'table', 'row-column', 'cell'
        };
    }

    constructor() {
        super();
        this.hass = null;
        this._initialConfig = null;
        this._workingConfig = {};
        this._activeTab = 'mode';
        this._validationErrors = [];

        // Create ref for preview container
        this._previewRef = createRef();

        // Debounce timer for preview updates
        this._previewUpdateTimer = null;

        // Inline editing state
        this._activeCellEdit = null;
        this._activeRowEdit = null;
        this._activeColumnEdit = null;

        // Preview toggles
        this._showGridLines = true; // Show gridlines by default for editing clarity
        this._showAnimations = false; // Hide animations by default to avoid distraction

        // Grid Styles sub-tab state
        this._gridStylesSubTab = 'hierarchy'; // Default to hierarchy view
    }

    /**
     * Getter for config property that returns _workingConfig
     * This is needed for lcards-color-section compatibility which expects editor.config
     */
    get config() {
        return this._workingConfig;
    }

    /**
     * Setter for config property - stores initial config
     */
    set config(value) {
        this._initialConfig = value;
        // Initialize _workingConfig if not already set
        if (!this._workingConfig || Object.keys(this._workingConfig).length === 0) {
            this._workingConfig = JSON.parse(JSON.stringify(value || {}));
        }
    }

    /**
     * Get row count from grid template
     * @returns {number} Number of rows
     */
    get _gridRowCount() {
        const grid = this._workingConfig.grid || {};

        // For data mode with actual rows, use the actual row count
        if (this._workingConfig.data_mode === 'data' && Array.isArray(this._workingConfig.rows) && this._workingConfig.rows.length > 0) {
            return this._workingConfig.rows.length;
        }

        // Parse from grid-template-rows
        const rows = grid['grid-template-rows'] || grid.rows || 'repeat(8, auto)';
        const match = rows.match(/repeat\((\d+)/);
        return match ? parseInt(match[1]) : 8;
    }

    /**
     * Get column count from grid template
     * @returns {number} Number of columns
     */
    get _gridColumnCount() {
        const grid = this._workingConfig.grid || {};

        // For data mode with actual rows, calculate columns from first row
        if (this._workingConfig.data_mode === 'data' && Array.isArray(this._workingConfig.rows) && this._workingConfig.rows.length > 0) {
            const firstRow = this._workingConfig.rows[0];
            if (Array.isArray(firstRow) && firstRow.length > 0) {
                return firstRow.length;
            }
        }

        // Parse from grid-template-columns
        const columns = grid['grid-template-columns'] || grid.columns || 'repeat(12, 1fr)';
        const match = columns.match(/repeat\((\d+)/);
        return match ? parseInt(match[1]) : 12;
    }

    /**
     * Get gap value from grid config
     * @returns {number} Gap in pixels
     */
    get _gridGapValue() {
        const grid = this._workingConfig.grid || {};
        const gap = grid.gap || grid['grid-gap'] || '8px';
        const match = String(gap).match(/(\d+)/);
        return match ? parseInt(match[1]) : 8;
    }

    connectedCallback() {
        super.connectedCallback();
        // Deep clone initial config
        this._workingConfig = JSON.parse(JSON.stringify(this._initialConfig || {}));

        // Ensure data_mode is set and detect editor mode
        this._detectAndNormalizeMode();

        // Normalize rows to object format (convert old array format)
        this._normalizeRowsFormat();

        // Ensure grid defaults
        if (!this._workingConfig.grid) {
            this._workingConfig.grid = {
                'grid-template-rows': 'repeat(8, auto)',
                'grid-template-columns': 'repeat(12, 1fr)',
                gap: '8px'
            };
        }

        // Initialize Data mode with sample rows matching grid dimensions
        if (this._workingConfig.data_mode === 'data' && !this._workingConfig.rows) {
            this._initializeGridRows();
        }

        lcardsLog.debug('[DataGridStudioV4] Opened with config:', this._workingConfig);

        // Schedule initial preview update
        this.updateComplete.then(() => this._updatePreviewCard());
    }

    /**
     * Detect editor mode from card config and normalize
     * @private
     */
    _detectAndNormalizeMode() {
        if (!this._workingConfig.data_mode) {
            this._workingConfig.data_mode = 'decorative';
            return;
        }

        // Normalize legacy modes
        if (this._workingConfig.data_mode === 'random') {
            this._workingConfig.data_mode = 'decorative';
        } else if (this._workingConfig.data_mode === 'template' || this._workingConfig.data_mode === 'datasource') {
            this._workingConfig.data_mode = 'data';
        }

        // Clean up old timeline/layout properties if they exist
        delete this._workingConfig.layout;
        delete this._workingConfig.source;
        delete this._workingConfig.history_hours;
        delete this._workingConfig.value_template;
    }

    /**
     * Normalize rows to object format
     * Converts old array format [val1, val2, ...] to {values: [...], style: {}, cellStyles: []}
     * @private
     */
    _normalizeRowsFormat() {
        if (!this._workingConfig.rows || !Array.isArray(this._workingConfig.rows)) {
            return;
        }

        this._workingConfig.rows = this._workingConfig.rows.map(row => {
            // Already in object format
            if (row && typeof row === 'object' && !Array.isArray(row) && row.values) {
                // Ensure required properties exist
                if (!row.style) row.style = {};
                if (!row.cellStyles) row.cellStyles = [];
                return row;
            }

            // Convert array format to object format
            if (Array.isArray(row)) {
                return {
                    values: row,
                    style: {},
                    cellStyles: []
                };
            }

            // Unexpected format - return as-is with warning
            lcardsLog.warn('[DataGridStudioV4] Unexpected row format:', row);
            return row;
        });

        lcardsLog.debug('[DataGridStudioV4] Normalized rows to object format');
    }

    /**
     * Get schema for a given path (required for FormField)
     * @param {string} path - Config path
     * @returns {Object|null} Schema definition
     * @private
     */
    _getSchemaForPath(path) {
        const parts = path.split('.');
        let schema = dataGridSchema.properties;

        for (const part of parts) {
            if (!schema || !schema[part]) return null;
            schema = schema[part];
            if (schema.properties) schema = schema.properties;
        }

        return schema;
    }

    /**
     * Get config value at path (required for FormField)
     * @param {string} path - Config path
     * @returns {*} Config value
     * @private
     */
    // @ts-ignore - TS2393: auto-suppressed
    _getConfigValue(path) {
        const parts = path.split('.');
        let value = this._workingConfig;

        for (const part of parts) {
            if (value === undefined || value === null) return undefined;
            value = value[part];
        }

        return value;
    }

    /**
     * Set config value at path (required for FormField)
     * @param {string} path - Config path
     * @param {*} value - New value
     * @private
     */
    // @ts-ignore - TS2393: auto-suppressed
    _setConfigValue(path, value) {
        this._updateConfig(path, value);
    }

    disconnectedCallback() {
        super.disconnectedCallback();
        if (this._previewUpdateTimer) {
            clearTimeout(this._previewUpdateTimer);
        }
    }

    static get styles() {
        return [
            editorStyles,
            studioDialogStyles,
            css`
            :host {
                display: block;
            }

            .dialog-content {
                display: flex;
                flex-direction: column;
                min-height: 70vh;
                max-height: 80vh;
                gap: 0;
            }

            /* Tab content scrolling - matches MSD Studio pattern */
            .tab-content {
                flex: 1;
                overflow-y: auto;
                overflow-x: hidden;
                padding: 16px;
                min-height: 0;
            }

            /* Prevent tabs from shrinking */
            ha-tab-group {
                flex-shrink: 0;
            }

            ha-tab-group-tab {
                flex-shrink: 0;
                min-width: 120px;
                white-space: nowrap;
            }

            /* Canvas toolbar button states */
            .canvas-toolbar-button.inactive {
                opacity: 0.5;
            }

            .canvas-toolbar-button.inactive:hover {
                opacity: 0.7;
            }

            /* Preview container adjustments */
            .preview-container {
                flex: 1;
                padding: 24px;
                background: var(--primary-background-color);
            }

            /* Make grid cells visible in preview */
            .preview-container lcards-data-grid {
                display: block;
                width: 100%;
                min-height: 300px;
            }

            /* Template Examples Styling */
            .template-examples {
                display: flex;
                flex-direction: column;
                gap: 20px;
            }

            .example-group {
                border-left: 3px solid var(--primary-color);
                padding-left: 16px;
            }

            .example-title {
                font-weight: 600;
                font-size: 14px;
                margin-bottom: 12px;
                color: var(--primary-text-color);
            }

            .example-item {
                display: flex;
                flex-direction: column;
                gap: 4px;
                margin-bottom: 12px;
            }

            .example-code-row {
                display: flex;
                align-items: center;
                gap: 8px;
            }

            .example-item code {
                flex: 1;
                font-family: 'Courier New', monospace;
                font-size: 12px;
                background: var(--secondary-background-color);
                padding: 6px 10px;
                border-radius: 4px;
                color: var(--primary-color);
                display: block;
                overflow-x: auto;
            }

            .example-item .copy-button {
                --mdc-icon-button-size: 32px;
                --mdc-icon-size: 18px;
            }

            .example-description {
                font-size: 12px;
                color: var(--secondary-text-color);
                padding-left: 10px;
            }

            /* Mode selector cards */
            .mode-selector {
                display: grid;
                grid-template-columns: repeat(2, 1fr);
                gap: 12px;
                margin-bottom: 24px;
            }

            .mode-card {
                padding: 20px;
                border: 2px solid var(--divider-color);
                border-radius: 8px;
                cursor: pointer;
                transition: all 0.2s ease;
                text-align: center;
                background: var(--card-background-color);
            }

            .mode-card:hover {
                border-color: var(--secondary-text-color);
                transform: translateY(-2px);
                box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
            }

            .mode-card.active {
                border-color: var(--primary-color);
                border-width: 3px;
                background: linear-gradient(135deg,
                    rgba(var(--rgb-primary-color, 3, 169, 244), 0.1) 0%,
                    transparent 100%);
            }

            .mode-icon {
                font-size: 48px;
                margin-bottom: 12px;
                color: var(--secondary-text-color);
            }

            .mode-card.active .mode-icon {
                color: var(--primary-color);
            }

            /* Sub-tabs styling */
            .sub-tabs {
                display: flex;
                gap: 8px;
                margin-bottom: 16px;
                padding: 8px;
                background: var(--secondary-background-color);
                border-radius: 8px;
                overflow-x: auto;
            }

            .sub-tab {
                display: flex;
                align-items: center;
                gap: 6px;
                padding: 8px 16px;
                background: var(--card-background-color);
                border: 1px solid var(--divider-color);
                border-radius: 6px;
                cursor: pointer;
                transition: all 0.2s ease;
                white-space: nowrap;
                font-size: 14px;
            }

            .sub-tab:hover {
                background: var(--primary-color);
                color: white;
                border-color: var(--primary-color);
            }

            .sub-tab.active {
                background: var(--primary-color);
                color: white;
                border-color: var(--primary-color);
                font-weight: 500;
            }

            .sub-tab ha-icon {
                --mdc-icon-size: 18px;
            }

            .mode-title {
                font-size: 16px;
                font-weight: 600;
                margin-bottom: 6px;
                color: var(--primary-text-color);
            }

            .mode-description {
                font-size: 12px;
                color: var(--secondary-text-color);
                line-height: 1.4;
            }

            /* Form section spacing - match main editor */
            lcards-form-section {
                display: block;
                margin-bottom: 20px;
            }

            lcards-form-section:last-child {
                margin-bottom: 0;
            }

            /* Validation errors */
            .validation-errors {
                margin-bottom: 16px;
            }

            /* Cell type selector buttons */
            .cell-type-button {
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 6px;
                font-size: 13px;
                font-weight: 500;
                color: var(--primary-text-color);
            }

            .cell-type-button:hover {
                border-color: var(--primary-color) !important;
                background: var(--secondary-background-color) !important;
            }

            .cell-type-button.active {
                border-color: var(--primary-color) !important;
                background: linear-gradient(135deg,
                    rgba(var(--rgb-primary-color, 3, 169, 244), 0.15) 0%,
                    transparent 100%) !important;
                color: var(--primary-color);
            }

            @media (max-width: 768px) {
                .mode-selector {
                    grid-template-columns: 1fr;
                }
            }
        `];
    }

    render() {
        return html`
            <ha-dialog
                open
                @closed=${(e) => { e.stopPropagation(); this._handleCancel(); }}
                header-title="Data Grid Studio">

                <div class="dialog-content">
                    <!-- Split Layout: Config (33%) | Preview (66%) -->
                    <div class="studio-layout">
                        <!-- Left Panel: Config -->
                        <div class="config-panel">
                            <!-- HA Tab Group (headers only) -->
                            <ha-tab-group @wa-tab-show=${this._handleMainTabChange}>
                                <ha-tab-group-tab value="mode" ?active=${this._activeTab === 'mode'}>
                                    <ha-icon icon="mdi:view-grid"></ha-icon>
                                    Data Mode
                                </ha-tab-group-tab>
                                <ha-tab-group-tab value="grid-structure" ?active=${this._activeTab === 'grid-structure'}>
                                    <ha-icon icon="mdi:table-settings"></ha-icon>
                                    Grid Structure
                                </ha-tab-group-tab>
                                <ha-tab-group-tab value="grid-styles" ?active=${this._activeTab === 'grid-styles'}>
                                    <ha-icon icon="mdi:palette"></ha-icon>
                                    Grid Styles
                                </ha-tab-group-tab>
                                <ha-tab-group-tab value="effects" ?active=${this._activeTab === 'effects'}>
                                    <ha-icon icon="mdi:auto-fix"></ha-icon>
                                    Effects
                                </ha-tab-group-tab>
                                <ha-tab-group-tab value="advanced" ?active=${this._activeTab === 'advanced'}>
                                    <ha-icon icon="mdi:cog"></ha-icon>
                                    Advanced
                                </ha-tab-group-tab>
                            </ha-tab-group>

                            <!-- Tab Content Wrapper (scrollable) -->
                            <div class="tab-content">
                                ${this._renderValidationErrors()}
                                ${this._renderActiveTab()}
                            </div>
                        </div>

                        <!-- Right Panel: Live Preview -->
                        <div class="preview-panel">
                            <!-- Canvas Toolbar -->
                            <div class="canvas-toolbar">
                                <div class="canvas-toolbar-buttons">
                                    <button
                                        class="canvas-toolbar-button ${this._showGridLines ? 'active' : ''}"
                                        @click=${this._toggleGridLines}
                                        title="Toggle Grid Lines">
                                        <ha-icon icon="mdi:grid"></ha-icon>
                                    </button>
                                </div>
                            </div>

                            <!-- Live Preview Container -->
                            <div class="preview-container">
                                ${this._renderPreviewCard()}
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Dialog Actions -->
                <div slot="footer">
                    <ha-button
                        appearance="plain"
                        @click=${this._handleCancel}>
                        Cancel
                    </ha-button>
                    <ha-button
                        variant="brand"
                        @click=${this._handleSave}>
                        <ha-icon icon="mdi:check" slot="start"></ha-icon>
                        Save
                    </ha-button>
                </div>
            </ha-dialog>
        `;
    }

    // ========================================
    // Rendering Methods
    // ========================================

    _renderValidationErrors() {
        if (this._validationErrors.length === 0) return '';

        return html`
            <div class="validation-errors">
                <ha-alert alert-type="error">
                    <strong>Validation Errors:</strong>
                    <ul>
                        ${this._validationErrors.map(err => html`<li>${err}</li>`)}
                    </ul>
                </ha-alert>
            </div>
        `;
    }

    _renderActiveTab() {
        switch (this._activeTab) {
            case 'mode':
                return this._renderModeTab();
            case 'grid-structure':
                return this._renderGridStructureTab();
            case 'grid-styles':
                return this._renderGridStylesTab();
            case 'effects':
                return this._renderEffectsTab();
            case 'advanced':
                return this._renderAdvancedTab();
            default:
                return html`<p>Unknown tab: ${this._activeTab}</p>`;
        }
    }

    /**
     * Render live preview card using ref
     */
    _renderPreviewCard() {
        return html`
            <div ${ref(this._previewRef)}>
                <!-- Card will be inserted here by _updatePreviewCard() -->
            </div>
        `;
    }

    /**
     * Toggle grid lines in preview
     */
    // @ts-ignore - TS2393: auto-suppressed
    _toggleGridLines() {
        this._showGridLines = !this._showGridLines;
        this._updatePreviewCard();
        lcardsLog.debug('[DataGridStudioV4] Grid lines toggled:', this._showGridLines);
    }

    /**
     * Toggle animations in preview
     */
    // @ts-ignore - TS2393: auto-suppressed
    _toggleAnimations() {
        this._showAnimations = !this._showAnimations;
        this._updatePreviewCard();
        lcardsLog.debug('[DataGridStudioV4] Animations toggled:', this._showAnimations);
    }

    // ========================================
    // MODE TAB (Main Tab)
    // ========================================

    _renderModeTab() {
        const dataMode = this._workingConfig.data_mode || 'decorative';

        const modes = [
            {
                id: 'decorative',
                icon: 'mdi:shimmer',
                title: 'Decorative',
                description: 'Auto-generated random LCARS data'
            },
            {
                id: 'data',
                icon: 'mdi:table-edit',
                title: 'Data',
                description: 'Real entities/sensors with custom templates'
            }
        ];

        return html`
            <lcards-form-section
                header="Data Mode"
                description="Choose how the grid gets its data"
                icon="mdi:view-grid"
                ?expanded=${true}>

                <div class="mode-selector">
                    ${modes.map(mode => html`
                        <div
                            class="mode-card ${dataMode === mode.id ? 'active' : ''}"
                            @click=${() => this._handleModeChange(mode.id)}>
                            <div class="mode-icon">
                                <ha-icon icon="${mode.icon}"></ha-icon>
                            </div>
                            <div class="mode-title">${mode.title}</div>
                            <div class="mode-description">${mode.description}</div>
                        </div>
                    `)}
                </div>
            </lcards-form-section>

            ${this._renderModeSpecificConfig()}
        `;
    }

    _renderModeSpecificConfig() {
        // All mode-specific config moved to Grid Structure tab
        return '';
    }

    // @ts-ignore - TS2393: auto-suppressed
    _renderDecorativeModeConfig() {
        return html`
            <lcards-form-section
                header="Decorative Mode Settings"
                description="Configure auto-generated random data"
                icon="mdi:shimmer"
                ?expanded=${true}>

                ${FormField.renderField(this, 'format')}
                ${FormField.renderField(this, 'refresh_interval')}
            </lcards-form-section>
        `;
    }

    _renderManualModeConfig() {
        const rows = this._workingConfig.rows || [];
        const numColumns = this._gridColumnCount;

        return html`
            <lcards-form-section
                header="Grid Editor"
                description="Click cells to edit content. Use static values or HA templates."
                icon="mdi:table-edit"
                ?expanded=${true}>

                <lcards-message type="info">
                    <strong>Live Preview Above</strong> shows the final result.
                    <strong>Edit Grid Below</strong> to modify cell content.
                </lcards-message>

                <!-- Editable Grid -->
                <div class="editable-grid" style="
                    display: grid;
                    grid-template-columns: auto repeat(${numColumns}, 1fr);
                    gap: 2px;
                    margin-top: 16px;
                    background: var(--divider-color);
                    padding: 2px;
                    border-radius: 4px;
                ">
                    <!-- Column Headers -->
                    <div class="grid-corner" style="
                        background: var(--card-background-color);
                        padding: 8px;
                        font-weight: 600;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                    "></div>
                    ${Array.from({ length: numColumns }, (_, col) => html`
                        <div class="column-header" style="
                            background: var(--primary-color);
                            color: white;
                            padding: 8px;
                            text-align: center;
                            font-weight: 600;
                            font-size: 11px;
                            cursor: pointer;
                        " @click=${() => this._editColumn(col)}>
                            Col ${col + 1}
                        </div>
                    `)}

                    <!-- Data Rows -->
                    ${rows.map((row, rowIndex) => html`
                        <!-- Row Header -->
                        <div class="row-header" style="
                            background: var(--primary-color);
                            color: white;
                            padding: 8px;
                            text-align: center;
                            font-weight: 600;
                            font-size: 11px;
                            cursor: pointer;
                        " @click=${() => this._editRow(rowIndex)}>
                            Row ${rowIndex + 1}
                        </div>

                        <!-- Row Cells -->
                        ${Array.from({ length: numColumns }, (_, col) => {
                            const value = row.values?.[col] || '';
                            return html`
                                <div class="editable-cell" style="
                                    background: var(--card-background-color);
                                    padding: 8px;
                                    min-height: 36px;
                                    cursor: pointer;
                                    border: 1px solid transparent;
                                    transition: all 0.2s;
                                    overflow: hidden;
                                    text-overflow: ellipsis;
                                    white-space: nowrap;
                                "
                                @click=${() => this._editCell(rowIndex, col, value)}
                                @mouseenter=${(e) => e.target.style.borderColor = 'var(--primary-color)'}
                                @mouseleave=${(e) => e.target.style.borderColor = 'transparent'}>
                                    ${value || html`<span style="opacity: 0.3;">—</span>`}
                                </div>
                            `;
                        })}
                    `)}
                </div>

                <!-- Grid Controls -->
                <div style="display: flex; gap: 8px; margin-top: 12px;">
                    <ha-button @click=${this._addManualRow}>
                        <ha-icon icon="mdi:table-row-plus-after" slot="start"></ha-icon>
                        Add Row
                    </ha-button>
                    <ha-button @click=${this._addManualColumn}>
                        <ha-icon icon="mdi:table-column-plus-after" slot="start"></ha-icon>
                        Add Column
                    </ha-button>
                </div>
            </lcards-form-section>

            <!-- Inline Cell Editor (appears when cell clicked) -->
            ${this._activeCellEdit ? this._renderCellEditor() : ''}

            <!-- Inline Row Editor (appears when row header clicked) -->
            ${this._activeRowEdit !== null ? this._renderRowEditor() : ''}

            <!-- Inline Column Editor (appears when column header clicked) -->
            ${this._activeColumnEdit !== null ? this._renderColumnEditor() : ''}
        `;
    }

    /**
     * Copy text to clipboard
     */
    _copyToClipboard(text) {
        navigator.clipboard.writeText(text).then(() => {
            // Show a brief success message
            lcardsLog.info('[DataGridStudioV4] Copied to clipboard:', text);
            // TODO: Could show a toast notification here
        }).catch(err => {
            lcardsLog.error('[DataGridStudioV4] Failed to copy:', err);
        });
    }

    // ========================================
    // GRID STRUCTURE TAB (Main Tab)
    // ========================================

    _renderGridStructureTab() {
        const dataMode = this._workingConfig.data_mode || 'decorative';
        const layout = this._workingConfig.layout || 'grid';

        // Determine editor mode
        let editorMode = dataMode;
        if (dataMode === 'data') {
            editorMode = (layout === 'timeline') ? 'data' : 'manual';
        }

        return html`
            <lcards-form-section
                header="Grid Dimensions"
                description="Define grid size"
                icon="mdi:ruler"
                ?expanded=${true}>

                ${editorMode === 'manual' ? html`
                    <lcards-message type="info">
                        <strong>Tip:</strong> Grid dimensions sync with spreadsheet editor.
                        You can add/remove rows/columns here or in the spreadsheet below.
                        <strong>Warning:</strong> Reducing dimensions will remove data from deleted cells.
                    </lcards-message>
                ` : ''}

                <lcards-grid-layout>
                    <ha-selector
                        .hass=${this.hass}
                        .selector=${{number: {min: 1, max: 50, mode: 'box'}}}
                        .value=${this._gridRowCount}
                        .label=${'Rows'}
                        .helper=${'Number of rows'}
                        @value-changed=${(e) => this._handleGridRowsChange(parseInt(e.detail.value) || 1)}
                        @closed=${(e) => e.stopPropagation()}>
                    </ha-selector>

                    <ha-selector
                        .hass=${this.hass}
                        .selector=${{number: {min: 1, max: 50, mode: 'box'}}}
                        .value=${this._gridColumnCount}
                        .label=${'Columns'}
                        .helper=${'Number of columns'}
                        @value-changed=${(e) => this._handleGridColumnsChange(parseInt(e.detail.value) || 1)}
                        @closed=${(e) => e.stopPropagation()}>
                    </ha-selector>
                </lcards-grid-layout>

                <ha-selector
                    .hass=${this.hass}
                    .selector=${{number: {min: 0, max: 50, mode: 'box'}}}
                    .value=${this._gridGapValue}
                    .label=${'Gap (px)'}
                    .helper=${'Space between cells'}
                    @value-changed=${(e) => this._handleGridGapChange(parseInt(e.detail.value) || 0)}
                    @closed=${(e) => e.stopPropagation()}>
                </ha-selector>
            </lcards-form-section>

            ${dataMode === 'decorative' ? this._renderDecorativeModeConfig() : ''}
            ${dataMode === 'data' ? html`
                ${this._renderGridDataEditor()}
            ` : ''}
        `;
    }

    // @ts-ignore - TS2393: auto-suppressed
    _renderDecorativeModeConfig() {
        return html`
            <lcards-form-section
                header="Decorative Mode Settings"
                description="Configure auto-generated random data"
                icon="mdi:shimmer"
                ?expanded=${true}>

                <ha-selector
                    .hass=${this.hass}
                    .selector=${{select: {mode: 'dropdown', options: [
                        { value: 'digit', label: 'Digit (0042, 1337)' },
                        { value: 'float', label: 'Float (42.17, 3.14)' },
                        { value: 'alpha', label: 'Alpha (AB, XY)' },
                        { value: 'hex', label: 'Hex (A3F1, 00FF)' },
                        { value: 'mixed', label: 'Mixed (various)' }
                    ]}}}
                    .label=${'Data Format'}
                    .value=${this._workingConfig.format || 'mixed'}
                    @value-changed=${(e) => this._updateConfig('format', e.detail.value)}
                    @closed=${(e) => e.stopPropagation()}>
                </ha-selector>

                <ha-textfield
                    type="number"
                    label="Refresh Interval (ms)"
                    .value=${this._workingConfig.refresh_interval || 0}
                    @input=${(e) => this._updateConfig('refresh_interval', parseInt(e.target.value) || 0)}
                    helper="Auto-refresh interval (0 = disabled)">
                </ha-textfield>
            </lcards-form-section>
        `;
    }

    _renderManualModeEditor() {
        const rows = this._workingConfig.rows || [];
        const numColumns = this._gridColumnCount;

        return html`
            <lcards-form-section
                header="Grid Editor"
                description="Click cells to edit content. Use static values or HA templates."
                icon="mdi:table-edit"
                ?expanded=${true}>

                <lcards-message type="info">
                    <strong>Live Preview Above</strong> shows the final result.
                    <strong>Edit Grid Below</strong> to modify cell content.
                </lcards-message>

                <!-- Editable Grid -->
                <div class="editable-grid" style="
                    display: grid;
                    grid-template-columns: auto repeat(${numColumns}, 1fr);
                    gap: 2px;
                    margin-top: 16px;
                    background: var(--divider-color);
                    padding: 2px;
                    border-radius: 4px;
                ">
                    <!-- Column Headers -->
                    <div class="grid-corner" style="
                        background: var(--card-background-color);
                        padding: 8px;
                        font-weight: 600;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                    "></div>
                    ${Array.from({ length: numColumns }, (_, col) => html`
                        <div class="column-header" style="
                            background: var(--primary-color);
                            color: white;
                            padding: 8px;
                            text-align: center;
                            font-weight: 600;
                            font-size: 11px;
                            cursor: pointer;
                        " @click=${() => this._editColumn(col)}>
                            Col ${col + 1}
                        </div>
                    `)}

                    <!-- Data Rows -->
                    ${rows.map((row, rowIndex) => html`
                        <!-- Row Header -->
                        <div class="row-header" style="
                            background: var(--primary-color);
                            color: white;
                            padding: 8px;
                            text-align: center;
                            font-weight: 600;
                            font-size: 11px;
                            cursor: pointer;
                        " @click=${() => this._editRow(rowIndex)}>
                            Row ${rowIndex + 1}
                        </div>

                        <!-- Row Cells -->
                        ${Array.from({ length: numColumns }, (_, col) => {
                            const value = row.values?.[col] || '';
                            return html`
                                <div class="editable-cell" style="
                                    background: var(--card-background-color);
                                    padding: 8px;
                                    min-height: 36px;
                                    cursor: pointer;
                                    border: 1px solid transparent;
                                    transition: all 0.2s;
                                    overflow: hidden;
                                    text-overflow: ellipsis;
                                    white-space: nowrap;
                                "
                                @click=${() => this._editCell(rowIndex, col, value)}
                                @mouseenter=${(e) => e.target.style.borderColor = 'var(--primary-color)'}
                                @mouseleave=${(e) => e.target.style.borderColor = 'transparent'}>
                                    ${value || html`<span style="opacity: 0.3;">—</span>`}
                                </div>
                            `;
                        })}
                    `)}
                </div>

                <!-- Grid Controls -->
                <div style="display: flex; gap: 8px; margin-top: 12px;">
                    <ha-button @click=${this._addManualRow}>
                        <ha-icon icon="mdi:table-row-plus-after" slot="start"></ha-icon>
                        Add Row
                    </ha-button>
                    <ha-button @click=${this._addManualColumn}>
                        <ha-icon icon="mdi:table-column-plus-after" slot="start"></ha-icon>
                        Add Column
                    </ha-button>
                </div>

                <!-- Inline Cell Editor (shown when cell clicked) -->
                ${this._activeCellEdit ? this._renderCellEditor() : ''}

                <!-- Inline Row Editor (shown when row header clicked) -->
                ${this._activeRowEdit !== null ? this._renderRowEditor() : ''}

                <!-- Inline Column Editor (shown when column header clicked) -->
                ${this._activeColumnEdit !== null ? this._renderColumnEditor() : ''}
            </lcards-form-section>
        `;
    }

    _renderGridDataEditor() {
        const rows = this._workingConfig.rows || [];
        const numColumns = this._gridColumnCount;

        return html`
            <lcards-form-section
                header="Data Editor"
                description="Configure grid data using static values, entities, or templates."
                icon="mdi:table-edit"
                ?expanded=${true}>

                <lcards-message type="info">
                    <strong>Data Mode</strong>: Define grid structure below. Each cell can contain:
                    <ul style="margin: 8px 0; padding-left: 20px;">
                        <li>Static text (e.g., "Temperature")</li>
                        <li>Entities (e.g., sensor.temperature) - auto-resolves to current state</li>
                        <li>Templates (e.g., {{states('sensor.temp')}}°C)</li>
                        <li>JavaScript expressions (e.g., [[[return value.toFixed(2);]]])</li>
                    </ul>
                    Click any cell below to edit its content.
                </lcards-message>

                <!-- Editable Grid (same structure as Manual mode) -->
                <div class="editable-grid" style="
                    display: grid;
                    grid-template-columns: auto repeat(${numColumns}, 1fr);
                    gap: 2px;
                    margin-top: 16px;
                    background: var(--divider-color);
                    padding: 2px;
                    border-radius: 4px;
                ">
                    <!-- Column Headers -->
                    <div class="grid-corner" style="
                        background: var(--card-background-color);
                        padding: 8px;
                        font-weight: 600;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                    "></div>
                    ${Array.from({ length: numColumns }, (_, col) => html`
                        <div class="column-header" style="
                            background: var(--primary-color);
                            color: white;
                            padding: 8px;
                            text-align: center;
                            font-weight: 600;
                            font-size: 11px;
                            cursor: pointer;
                        " @click=${() => this._editColumn(col)}>
                            Col ${col + 1}
                        </div>
                    `)}

                    <!-- Data Rows -->
                    ${rows.map((row, rowIndex) => html`
                        <!-- Row Header -->
                        <div class="row-header" style="
                            background: var(--primary-color);
                            color: white;
                            padding: 8px;
                            text-align: center;
                            font-weight: 600;
                            font-size: 11px;
                            cursor: pointer;
                        " @click=${() => this._editRow(rowIndex)}>
                            Row ${rowIndex + 1}
                        </div>

                        <!-- Row Cells -->
                        ${Array.from({ length: numColumns }, (_, col) => {
                            const value = row.values?.[col] || '';
                            return html`
                                <div class="editable-cell" style="
                                    background: var(--card-background-color);
                                    padding: 8px;
                                    min-height: 36px;
                                    cursor: pointer;
                                    border: 1px solid transparent;
                                    transition: all 0.2s;
                                    overflow: hidden;
                                    text-overflow: ellipsis;
                                    white-space: nowrap;
                                "
                                @click=${() => this._editCell(rowIndex, col, value)}
                                @mouseenter=${(e) => e.target.style.borderColor = 'var(--primary-color)'}
                                @mouseleave=${(e) => e.target.style.borderColor = 'transparent'}>
                                    ${value || html`<span style="opacity: 0.3;">—</span>`}
                                </div>
                            `;
                        })}
                    `)}
                </div>

                <!-- Grid Controls -->
                <div style="display: flex; gap: 8px; margin-top: 12px;">
                    <ha-button @click=${this._addManualRow}>
                        <ha-icon icon="mdi:table-row-plus-after" slot="start"></ha-icon>
                        Add Row
                    </ha-button>
                    <ha-button @click=${this._addManualColumn}>
                        <ha-icon icon="mdi:table-column-plus-after" slot="start"></ha-icon>
                        Add Column
                    </ha-button>
                </div>

                <!-- Inline Cell Editor (shown when cell clicked) -->
                ${this._activeCellEdit ? this._renderCellEditor() : ''}

                <!-- Inline Row Editor (shown when row header clicked) -->
                ${this._activeRowEdit !== null ? this._renderRowEditor() : ''}

                <!-- Inline Column Editor (shown when column header clicked) -->
                ${this._activeColumnEdit !== null ? this._renderColumnEditor() : ''}
            </lcards-form-section>
        `;
    }


    // ========================================
    // GRID STYLES TAB (Main Tab - merged Configuration + Styling)
    // ========================================

    _renderGridStylesTab() {
        const subTabs = [
            { id: 'hierarchy', label: 'Style Hierarchy', icon: 'mdi:file-tree' },
            { id: 'table', label: 'Table Level', icon: 'mdi:table' }
        ];

        return html`
            <ha-tab-group @wa-tab-show=${this._handleStylesSubTabChange}>
                ${subTabs.map(tab => html`
                    <ha-tab-group-tab value="${tab.id}" ?active=${this._gridStylesSubTab === tab.id}>
                        <ha-icon icon="${tab.icon}"></ha-icon>
                        ${tab.label}
                    </ha-tab-group-tab>
                `)}
            </ha-tab-group>

            ${this._gridStylesSubTab === 'hierarchy' ? this._renderStyleHierarchySubTab() : ''}
            ${this._gridStylesSubTab === 'table' ? this._renderTableLevelStylesSubTab() : ''}
        `;
    }

    _renderStyleHierarchySubTab() {
        return html`
            <lcards-form-section
                header="Style Hierarchy"
                description="Understanding style precedence"
                icon="mdi:file-tree"
                ?expanded=${true}>

                <lcards-style-hierarchy-diagram>
                </lcards-style-hierarchy-diagram>
            </lcards-form-section>
        `;
    }

    _renderTableLevelStylesSubTab() {
        return html`
            <lcards-message type="info">
                These are grid-wide defaults. For row/column/cell-specific overrides, click the respective headers or cells in the Grid Structure tab.
            </lcards-message>

            <lcards-form-section
                header="Typography"
                description="Font settings for all cells"
                icon="mdi:format-font"
                ?expanded=${false}>

                <lcards-font-selector
                    .hass=${this.hass}
                    .value=${this._workingConfig.style?.font_family || ''}
                    .showPreview=${true}
                    .label=${'Font Family'}
                    @value-changed=${(e) => this._updateConfig('style.font_family', e.detail.value)}>
                </lcards-font-selector>

                <lcards-grid-layout style="margin-top: 12px;">
                    <ha-selector
                        .hass=${this.hass}
                        .selector=${{text: {}}}
                        .label=${'Font Size'}
                        .value=${this._workingConfig.style?.font_size || ''}
                        .placeholder=${'18'}
                        .helper=${'Font size in px or with unit (e.g., \'18px\', \'1.2rem\')'}
                        @value-changed=${(e) => this._updateConfig('style.font_size', e.detail.value)}
                        @closed=${(e) => e.stopPropagation()}>
                    </ha-selector>

                    <ha-selector
                        .hass=${this.hass}
                        .selector=${{number: {
                            mode: 'box',
                            min: 100,
                            max: 900,
                            step: 100
                        }}}
                        .label=${'Font Weight'}
                        .value=${this._workingConfig.style?.font_weight || 400}
                        @value-changed=${(e) => this._updateConfig('style.font_weight', e.detail.value)}
                        @closed=${(e) => e.stopPropagation()}>
                    </ha-selector>
                </lcards-grid-layout>

                <lcards-grid-layout>
                    <ha-selector
                        .hass=${this.hass}
                        .selector=${{select: {
                            mode: 'dropdown',
                            options: [
                                { value: 'none', label: 'None' },
                                { value: 'uppercase', label: 'UPPERCASE' },
                                { value: 'lowercase', label: 'lowercase' },
                                { value: 'capitalize', label: 'Capitalize' }
                            ]
                        }}}
                        .label=${'Text Transform'}
                        .value=${this._workingConfig.style?.text_transform || 'none'}
                        @value-changed=${(e) => this._updateConfig('style.text_transform', e.detail.value)}
                        @closed=${(e) => e.stopPropagation()}>
                    </ha-selector>

                    <ha-selector
                        .hass=${this.hass}
                        .selector=${{text: {}}}
                        .label=${'Letter Spacing'}
                        .value=${this._workingConfig.style?.letter_spacing || ''}
                        .placeholder=${'normal'}
                        .helper=${'e.g., \'0.05em\', \'1px\', \'normal\''}
                        @value-changed=${(e) => this._updateConfig('style.letter_spacing', e.detail.value)}
                        @closed=${(e) => e.stopPropagation()}>
                    </ha-selector>
                </lcards-grid-layout>

                <ha-selector
                    .hass=${this.hass}
                    .selector=${{text: {}}}
                    .label=${'Line Height'}
                    .value=${this._workingConfig.style?.line_height || ''}
                    .placeholder=${'normal'}
                    .helper=${'e.g., \'1.5\', \'24px\', \'normal\''}
                    @value-changed=${(e) => this._updateConfig('style.line_height', e.detail.value)}
                    @closed=${(e) => e.stopPropagation()}>
                </ha-selector>
            </lcards-form-section>

            <lcards-form-section
                header="Alignment & Wrapping"
                description="Text wrapping and cell content alignment"
                icon="mdi:format-align-center"
                ?expanded=${false}>

                <ha-selector
                    .hass=${this.hass}
                    .selector=${{select: {
                        mode: 'dropdown',
                        options: [
                            { value: 'nowrap', label: 'No Wrap (truncate with ellipsis)' },
                            { value: 'normal', label: 'Wrap (word boundaries)' },
                            { value: 'pre-wrap', label: 'Wrap (preserve line breaks)' },
                            { value: 'pre-line', label: 'Wrap (collapse spaces, preserve \\n)' }
                        ]
                    }}}
                    .label=${'Text Wrapping'}
                    .value=${this._workingConfig.style?.white_space || 'nowrap'}
                    @value-changed=${(e) => this._updateConfig('style.white_space', e.detail.value)}
                    @closed=${(e) => e.stopPropagation()}>
                </ha-selector>

                <lcards-grid-layout style="margin-top: 12px;">
                    <ha-selector
                        .hass=${this.hass}
                        .selector=${{select: {
                            mode: 'dropdown',
                            options: [
                                { value: 'flex-start', label: 'Top' },
                                { value: 'center', label: 'Center' },
                                { value: 'flex-end', label: 'Bottom' },
                                { value: 'baseline', label: 'Baseline' }
                            ]
                        }}}
                        .label=${'Vertical Align'}
                        .value=${this._workingConfig.style?.align_items || 'center'}
                        @value-changed=${(e) => this._updateConfig('style.align_items', e.detail.value)}
                        @closed=${(e) => e.stopPropagation()}>
                    </ha-selector>

                    <ha-selector
                        .hass=${this.hass}
                        .selector=${{select: {
                            mode: 'dropdown',
                            options: [
                                { value: 'flex-start', label: 'Left' },
                                { value: 'center', label: 'Center' },
                                { value: 'flex-end', label: 'Right' },
                                { value: 'space-between', label: 'Space Between' }
                            ]
                        }}}
                        .label=${'Horizontal Align'}
                        .value=${this._workingConfig.style?.justify_content || 'flex-end'}
                        @value-changed=${(e) => this._updateConfig('style.justify_content', e.detail.value)}
                        @closed=${(e) => e.stopPropagation()}>
                    </ha-selector>
                </lcards-grid-layout>
            </lcards-form-section>

            <lcards-form-section
                header="Padding & Spacing"
                description="Cell padding control"
                icon="mdi:move-resize"
                ?expanded=${false}>

                <lcards-padding-editor
                    .editor=${this}
                    .config=${this._workingConfig}
                    path="style.padding"
                    label="Cell Padding"
                    helper="Padding inside each cell (supports per-side: '8px' or '4px 8px')">
                </lcards-padding-editor>
            </lcards-form-section>

            <lcards-color-section
                .editor=${this}
                header="Colours"
                description="Default colours for all cells"
                .colorPaths=${[
                    { path: 'style.color', label: 'Text Colour', helper: 'Cell text colour' },
                    { path: 'style.background', label: 'Background Colour', helper: 'Cell background' }
                ]}
                ?expanded=${false}
                ?useColorPicker=${true}>
            </lcards-color-section>

            <lcards-form-section
                header="Border Settings"
                description="Cell border configuration"
                icon="mdi:border-all"
                ?expanded=${false}>

                <lcards-grid-layout>
                    <ha-textfield
                        type="number"
                        label="Border Width"
                        .value=${this._workingConfig.style?.border_width || 0}
                        @input=${(e) => this._updateConfig('style.border_width', parseInt(e.target.value) || 0)}
                        helper="Border width in pixels">
                    </ha-textfield>

                    <ha-textfield
                        label="Border Colour"
                        .value=${this._workingConfig.style?.border_color || ''}
                        @input=${(e) => this._updateConfig('style.border_color', e.target.value)}
                        helper="Border colour">
                    </ha-textfield>
                </lcards-grid-layout>

                <ha-selector
                    .hass=${this.hass}
                    .selector=${{select: {mode: 'dropdown', options: [
                        { value: 'solid', label: 'Solid' },
                        { value: 'dashed', label: 'Dashed' },
                        { value: 'dotted', label: 'Dotted' },
                        { value: 'double', label: 'Double' },
                        { value: 'groove', label: 'Groove' },
                        { value: 'ridge', label: 'Ridge' },
                        { value: 'inset', label: 'Inset' },
                        { value: 'outset', label: 'Outset' },
                        { value: 'none', label: 'None' },
                        { value: 'hidden', label: 'Hidden' }
                    ]}}}
                    .label=${'Border Style'}
                    .value=${this._workingConfig.style?.border_style || 'solid'}
                    @value-changed=${(e) => this._updateConfig('style.border_style', e.detail.value)}
                    @closed=${(e) => e.stopPropagation()}>
                </ha-selector>
            </lcards-form-section>
        `;
    }

    // ========================================
    // EFFECTS TAB (Animations + Filters - Standard Pattern)
    // ========================================

    _renderEffectsTab() {
        return html`
            <lcards-message
                type="info"
                message="Configure animations (cascade effect recommended) and visual filters for the data grid.">
            </lcards-message>

            <!-- Animations Section -->
            <lcards-form-section
                header="Animations"
                description="Trigger visual animations on load, hover, or data changes"
                icon="mdi:animation"
                ?expanded=${true}>

                <lcards-animation-editor
                    .hass=${this.hass}
                    .animations=${this._workingConfig.animations || []}
                    @animations-changed=${(e) => {
                        this._updateConfig('animations', e.detail.value);
                    }}>
                </lcards-animation-editor>
            </lcards-form-section>

            <!-- Filters Section -->
            <lcards-form-section
                header="Filters"
                description="Apply visual filters to the entire data grid (blur, brightness, etc.)"
                icon="mdi:auto-fix"
                ?expanded=${false}>

                <lcards-filter-editor
                    .hass=${this.hass}
                    .filters=${this._workingConfig.filters || []}
                    @filters-changed=${(e) => {
                        this._updateConfig('filters', e.detail.value);
                    }}>
                </lcards-filter-editor>
            </lcards-form-section>
        `;
    }

    _renderGridStructureSubTab() {
        return html`
            <lcards-form-section
                header="Grid Dimensions"
                description="Define grid size"
                icon="mdi:ruler"
                ?expanded=${true}>

                <lcards-grid-layout>
                    <ha-textfield
                        type="number"
                        label="Rows"
                        .value=${this._gridRowCount}
                        @input=${(e) => this._handleGridRowsChange(parseInt(e.target.value) || 1)}
                        min="1"
                        max="50"
                        helper="Number of rows">
                    </ha-textfield>

                    <ha-textfield
                        type="number"
                        label="Columns"
                        .value=${this._gridColumnCount}
                        @input=${(e) => this._handleGridColumnsChange(parseInt(e.target.value) || 1)}
                        min="1"
                        max="50"
                        helper="Number of columns">
                    </ha-textfield>
                </lcards-grid-layout>

                <ha-textfield
                    type="number"
                    label="Gap (px)"
                    .value=${this._gridGapValue}
                    @input=${(e) => this._handleGridGapChange(parseInt(e.target.value) || 0)}
                    min="0"
                    max="50"
                    helper="Uniform spacing between cells">
                </ha-textfield>

                <lcards-message
                    type="info"
                    message="You can also use row-gap and column-gap separately for different vertical and horizontal spacing.">
                </lcards-message>

                <lcards-grid-layout>
                    <ha-textfield
                        label="Row Gap"
                        .value=${this._workingConfig.grid?.['row-gap'] || ''}
                        @input=${(e) => this._updateConfig('grid.row-gap', e.target.value)}
                        helper="Vertical spacing (e.g., '8px')">
                    </ha-textfield>

                    <ha-textfield
                        label="Column Gap"
                        .value=${this._workingConfig.grid?.['column-gap'] || ''}
                        @input=${(e) => this._updateConfig('grid.column-gap', e.target.value)}
                        helper="Horizontal spacing (e.g., '8px')">
                    </ha-textfield>
                </lcards-grid-layout>
            </lcards-form-section>
        `;
    }

    _renderConfigurationSubTab() {
        return html`
            <lcards-form-section
                header="Typography"
                description="Font settings for all cells"
                icon="mdi:format-font"
                ?expanded=${true}>

                <lcards-font-selector
                    .hass=${this.hass}
                    .value=${this._workingConfig.style?.font_family || ''}
                    .showPreview=${true}
                    .label=${'Font Family'}
                    @value-changed=${(e) => this._updateConfig('style.font_family', e.detail.value)}>
                </lcards-font-selector>

                <lcards-grid-layout>
                    ${FormField.renderField(this, 'style.font_size')}
                    ${FormField.renderField(this, 'style.font_weight')}
                </lcards-grid-layout>
            </lcards-form-section>

            <lcards-color-section
                .editor=${this}
                header="Colours"
                description="Default colours for all cells"
                .colorPaths=${[
                    { path: 'style.color', label: 'Text Colour', helper: 'Cell text colour' },
                    { path: 'style.background', label: 'Background Colour', helper: 'Cell background' }
                ]}
                ?expanded=${true}
                ?useColorPicker=${true}>
            </lcards-color-section>
        `;
    }

    // ========================================
    // ADVANCED TAB (CSS Grid only)
    // ========================================

    _renderAdvancedTab() {
        return html`
            <lcards-message type="info">
                <ha-icon icon="mdi:information" slot="start"></ha-icon>
                Advanced CSS Grid properties. Changes affect the entire grid container.
                Use the live preview panel to see results in real-time.
            </lcards-message>

            <lcards-form-section
                header="Grid Template"
                description="Define row and column sizing"
                icon="mdi:table-cog"
                ?expanded=${true}>

                <ha-textfield
                    label="Grid Template Rows"
                    .value=${this._workingConfig.grid?.['grid-template-rows'] || 'repeat(8, auto)'}
                    @input=${(e) => this._updateConfig('grid.grid-template-rows', e.target.value)}
                    helper="e.g., 'repeat(8, auto)', '100px 1fr 2fr'">
                </ha-textfield>

                <ha-textfield
                    label="Grid Template Columns"
                    .value=${this._workingConfig.grid?.['grid-template-columns'] || 'repeat(12, 1fr)'}
                    @input=${(e) => this._updateConfig('grid.grid-template-columns', e.target.value)}
                    helper="e.g., 'repeat(12, 1fr)', '200px 1fr 1fr'">
                </ha-textfield>

                <ha-textfield
                    label="Grid Gap"
                    .value=${this._workingConfig.grid?.gap || '8px'}
                    @input=${(e) => this._updateConfig('grid.gap', e.target.value)}
                    helper="e.g., '8px', '1rem 2rem'">
                </ha-textfield>
            </lcards-form-section>

            <lcards-form-section
                header="Grid Flow & Alignment"
                description="Control item placement and alignment"
                icon="mdi:arrow-decision"
                ?expanded=${true}>

                <ha-selector
                    .hass=${this.hass}
                    .selector=${{select: {mode: 'dropdown', options: [
                        { value: 'row', label: 'Row' },
                        { value: 'column', label: 'Column' },
                        { value: 'row dense', label: 'Row Dense' },
                        { value: 'column dense', label: 'Column Dense' }
                    ]}}}
                    .label=${'Grid Auto Flow'}
                    .value=${this._workingConfig.grid?.['grid-auto-flow'] || 'row'}
                    @value-changed=${(e) => this._updateConfig('grid.grid-auto-flow', e.detail.value)}
                    @closed=${(e) => e.stopPropagation()}>
                </ha-selector>

                <lcards-grid-layout style="margin-top: 12px;">
                    <ha-selector
                        .hass=${this.hass}
                        .selector=${{select: {mode: 'dropdown', options: [
                            { value: 'stretch', label: 'Stretch' },
                            { value: 'start', label: 'Start' },
                            { value: 'end', label: 'End' },
                            { value: 'center', label: 'Center' }
                        ]}}}
                        .label=${'Justify Items'}
                        .value=${this._workingConfig.grid?.['justify-items'] || 'stretch'}
                        @value-changed=${(e) => this._updateConfig('grid.justify-items', e.detail.value)}
                        @closed=${(e) => e.stopPropagation()}>
                    </ha-selector>

                    <ha-selector
                        .hass=${this.hass}
                        .selector=${{select: {mode: 'dropdown', options: [
                            { value: 'stretch', label: 'Stretch' },
                            { value: 'start', label: 'Start' },
                            { value: 'end', label: 'End' },
                            { value: 'center', label: 'Center' }
                        ]}}}
                        .label=${'Align Items'}
                        .value=${this._workingConfig.grid?.['align-items'] || 'stretch'}
                        @value-changed=${(e) => this._updateConfig('grid.align-items', e.detail.value)}
                        @closed=${(e) => e.stopPropagation()}>
                    </ha-selector>
                </lcards-grid-layout>
            </lcards-form-section>

            <lcards-form-section
                header="Additional Grid Options"
                description="Container alignment and implicit grid sizing"
                icon="mdi:cog"
                ?expanded=${false}>

                <lcards-grid-layout>
                    <ha-textfield
                        label="Auto Columns"
                        .value=${this._workingConfig.grid?.['grid-auto-columns'] || ''}
                        @input=${(e) => this._updateConfig('grid.grid-auto-columns', e.target.value)}
                        helper="Width of implicit columns (e.g., 100px, 1fr)">
                    </ha-textfield>

                    <ha-textfield
                        label="Auto Rows"
                        .value=${this._workingConfig.grid?.['grid-auto-rows'] || ''}
                        @input=${(e) => this._updateConfig('grid.grid-auto-rows', e.target.value)}
                        helper="Height of implicit rows (e.g., 50px, auto)">
                    </ha-textfield>
                </lcards-grid-layout>

                <lcards-grid-layout>
                    <ha-selector
                        .hass=${this.hass}
                        .selector=${{select: {mode: 'dropdown', options: [
                            { value: 'start', label: 'Start' },
                            { value: 'end', label: 'End' },
                            { value: 'center', label: 'Center' },
                            { value: 'stretch', label: 'Stretch' },
                            { value: 'space-around', label: 'Space Around' },
                            { value: 'space-between', label: 'Space Between' },
                            { value: 'space-evenly', label: 'Space Evenly' }
                        ]}}}
                        .label=${'Justify Content'}
                        .value=${this._workingConfig.grid?.['justify-content'] || 'start'}
                        @value-changed=${(e) => this._updateConfig('grid.justify-content', e.detail.value)}
                        @closed=${(e) => e.stopPropagation()}>
                    </ha-selector>

                    <ha-selector
                        .hass=${this.hass}
                        .selector=${{select: {mode: 'dropdown', options: [
                            { value: 'start', label: 'Start' },
                            { value: 'end', label: 'End' },
                            { value: 'center', label: 'Center' },
                            { value: 'stretch', label: 'Stretch' },
                            { value: 'space-around', label: 'Space Around' },
                            { value: 'space-between', label: 'Space Between' },
                            { value: 'space-evenly', label: 'Space Evenly' }
                        ]}}}
                        .label=${'Align Content'}
                        .value=${this._workingConfig.grid?.['align-content'] || 'start'}
                        @value-changed=${(e) => this._updateConfig('grid.align-content', e.detail.value)}
                        @closed=${(e) => e.stopPropagation()}>
                    </ha-selector>
                </lcards-grid-layout>
            </lcards-form-section>
        `;
    }

    _renderCssGridSubTab() {
        return html`
            <lcards-form-section
                header="CSS Grid Expert Mode"
                description="Advanced CSS Grid properties"
                ?expanded=${true}>

                <lcards-message type="warning">
                    These are advanced CSS Grid properties. Use with caution.
                </lcards-message>

                <ha-textfield
                    label="Grid Template Columns"
                    .value=${this._workingConfig.grid?.template_columns || ''}
                    @input=${(e) => this._updateConfig('grid.template_columns', e.target.value)}
                    helper="Custom CSS Grid template-columns (overrides columns count)">
                </ha-textfield>

                <ha-textfield
                    label="Grid Template Rows"
                    .value=${this._workingConfig.grid?.template_rows || ''}
                    @input=${(e) => this._updateConfig('grid.template_rows', e.target.value)}
                    helper="Custom CSS Grid template-rows (overrides rows count)">
                </ha-textfield>

                <ha-textfield
                    label="Grid Auto Flow"
                    .value=${this._workingConfig.grid?.auto_flow || ''}
                    @input=${(e) => this._updateConfig('grid.auto_flow', e.target.value)}
                    helper="CSS grid-auto-flow value (e.g., 'row', 'column', 'dense')">
                </ha-textfield>
            </lcards-form-section>
        `;
    }

    // ========================================
    // Event Handlers
    // ========================================

    _handleMainTabChange(e) {
        const value = e.target.activeTab?.getAttribute('value');
        if (value !== null && value !== undefined) {
            this._activeTab = value;
            lcardsLog.debug('[DataGridStudioV4] Main tab changed to:', value);
            this.requestUpdate();
        }
    }

    _handleStylesSubTabChange(e) {
        const value = e.target.activeTab?.getAttribute('value');
        if (value !== null && value !== undefined) {
            this._gridStylesSubTab = value;
            lcardsLog.debug('[DataGridStudioV4] Styles sub-tab changed to:', value);
            this.requestUpdate();
        }
    }

    _handleModeChange(mode) {
        const oldMode = this._workingConfig.data_mode;

        this._updateConfig('data_mode', mode);

        // Clean up mode-specific config when switching
        if (mode === 'decorative') {
            // Switching to decorative: remove data mode properties
            delete this._workingConfig.rows;

            // Ensure decorative mode defaults
            if (!this._workingConfig.format) {
                this._workingConfig.format = 'mixed';
            }
            if (this._workingConfig.refresh_interval === undefined) {
                this._workingConfig.refresh_interval = 0;
            }
        } else if (mode === 'data') {
            // Switching to data: remove decorative properties
            delete this._workingConfig.format;
            delete this._workingConfig.refresh_interval;

            // Initialize data mode with sample rows if needed
            if (!this._workingConfig.rows || this._workingConfig.rows.length === 0) {
                this._initializeGridRows();
            }
        }

        lcardsLog.info('[DataGridStudioV4] Mode changed:', { from: oldMode, to: mode });
    }

    // @ts-ignore - TS2393: auto-suppressed
    _toggleGridLines(e) {
        e?.stopPropagation();
        this._showGridLines = !this._showGridLines;
        this.requestUpdate();
        // Need to update preview to inject/remove gridline styles from shadow DOM
        this._updatePreviewCard();
        lcardsLog.debug('[DataGridStudioV4] Toggled gridlines:', this._showGridLines);
    }

    // @ts-ignore - TS2393: auto-suppressed
    _toggleAnimations(e) {
        e?.stopPropagation();
        this._showAnimations = !this._showAnimations;
        this.requestUpdate();
        // Immediately update preview to add/remove animation config
        this._updatePreviewCard();
        lcardsLog.debug('[DataGridStudioV4] Toggled animations:', this._showAnimations);
    }

    _setPreviewMode(mode) {
        this._previewMode = mode;
        lcardsLog.debug('[DataGridStudioV4] Preview mode changed to:', mode);

        // Re-render preview to enable/disable click handlers
        this._updatePreviewCard();
    }

    /**
     * Initialize grid rows array matching current grid dimensions
     * @private
     */
    _initializeGridRows() {
        const numRows = this._gridRowCount;
        const numCols = this._gridColumnCount;

        this._workingConfig.rows = [];

        // Create sample rows with object format (ready for styles)
        for (let r = 0; r < numRows; r++) {
            const values = [];
            for (let c = 0; c < numCols; c++) {
                // Sample data for first two rows
                if (r === 0) {
                    values.push(c === 0 ? 'Label' : (c === 1 ? 'Value' : ''));
                } else if (r === 1) {
                    values.push(c === 0 ? 'CPU' : (c === 1 ? 'sensor.cpu_usage' : ''));
                } else {
                    values.push('');
                }
            }
            // Use object format from the start
            this._workingConfig.rows.push({
                values: values,
                style: {},
                cellStyles: []
            });
        }

        lcardsLog.debug('[DataGridStudioV4] Initialized grid rows:', {
            rows: numRows,
            cols: numCols,
            rowsArray: this._workingConfig.rows
        });
    }

    /**
     * Handle grid rows change - generates CSS Grid string and syncs rows array
     * @param {number} value - Number of rows
     * @private
     */
    _handleGridRowsChange(value) {
        // Generate CSS Grid string
        const cssValue = `repeat(${value}, auto)`;
        this._updateConfig('grid.grid-template-rows', cssValue);

        // Sync rows array for data mode
        if (this._workingConfig.data_mode === 'data' && this._workingConfig.rows) {
            const currentRows = this._workingConfig.rows.length;
            if (value > currentRows) {
                // Add empty rows
                for (let i = currentRows; i < value; i++) {
                    const emptyRow = Array(this._gridColumnCount).fill('');
                    this._workingConfig.rows.push(emptyRow);
                }
            } else if (value < currentRows) {
                // Remove excess rows
                this._workingConfig.rows.splice(value);
            }
        }

        lcardsLog.debug('[DataGridStudioV4] Grid rows changed:', { value, cssValue, rowsLength: this._workingConfig.rows?.length });
    }

    /**
     * Handle grid columns change - generates CSS Grid string and syncs columns in rows
     * @param {number} value - Number of columns
     * @private
     */
    _handleGridColumnsChange(value) {
        // Generate CSS Grid string
        const cssValue = `repeat(${value}, 1fr)`;
        this._updateConfig('grid.grid-template-columns', cssValue);

        // Sync columns in all rows for data mode
        if (this._workingConfig.data_mode === 'data' && this._workingConfig.rows) {
            this._workingConfig.rows = this._workingConfig.rows.map(row => {
                if (!Array.isArray(row)) return row;

                const currentCols = row.length;
                if (value > currentCols) {
                    // Add empty cells
                    return [...row, ...Array(value - currentCols).fill('')];
                } else if (value < currentCols) {
                    // Remove excess cells
                    return row.slice(0, value);
                } else {
                    return row;
                }
            });
        }

        lcardsLog.debug('[DataGridStudioV4] Grid columns changed:', { value, cssValue, firstRowLength: this._workingConfig.rows?.[0]?.length });
    }

    /**
     * Handle grid gap change - converts to string with units
     * @param {number} value - Gap in pixels
     * @private
     */
    _handleGridGapChange(value) {
        // Gap can be number or string with units
        const cssValue = `${value}px`;
        this._updateConfig('grid.gap', cssValue);

        lcardsLog.debug('[DataGridStudioV4] Grid gap changed:', { value, cssValue });
    }

    // ========================================
    // Config Management
    // ========================================

    /**
     * Update config at a given path
     * @param {string} path - Dot-notation path (e.g., 'style.font_family')
     * @param {*} value - New value
     */
    _updateConfig(path, value) {
        const parts = path.split('.');
        let obj = this._workingConfig;

        // Navigate to parent object
        for (let i = 0; i < parts.length - 1; i++) {
            if (!obj[parts[i]]) {
                obj[parts[i]] = {};
            }
            obj = obj[parts[i]];
        }

        // Set value
        obj[parts[parts.length - 1]] = value;

        lcardsLog.debug('[DataGridStudioV4] Config updated:', path, '=', value);

        // Trigger re-render
        this.requestUpdate();

        // Debounce preview update
        this._schedulePreviewUpdate();
    }

    /**
     * Get config value at a given path (for lcards-color-section)
     * @param {string} path - Dot-notation path
     * @returns {*} Value at path
     */
    // @ts-ignore - TS2393: auto-suppressed
    _getConfigValue(path) {
        // Handle special cell style paths from color-section
        if (path.startsWith('_cellStyle_')) {
            const match = path.match(/_cellStyle_(\d+)_(\d+)_(\w+)/);
            if (match) {
                const [, row, col, property] = match;
                return this._getCellStyleValue(parseInt(row), parseInt(col), property);
            }
        }

        const parts = path.split('.');
        let obj = this._workingConfig;

        for (const part of parts) {
            if (obj === undefined || obj === null) return undefined;
            obj = obj[part];
        }

        return obj;
    }

    /**
     * Set config value at a given path (for lcards-color-section compatibility)
     * This is an alias for _updateConfig to match the interface expected by lcards-color-section
     * @param {string} path - Dot-notation path
     * @param {*} value - New value
     */
    // @ts-ignore - TS2393: auto-suppressed
    _setConfigValue(path, value) {
        // Handle special cell style paths from color-section
        if (path.startsWith('_cellStyle_')) {
            const match = path.match(/_cellStyle_(\d+)_(\d+)_(\w+)/);
            if (match) {
                const [, row, col, property] = match;
                this._setCellStyleValue(parseInt(row), parseInt(col), property, value);
                return;
            }
        }

        this._updateConfig(path, value);
    }

    /**
     * Public updateConfig method (for lcards-color-section compatibility)
     * This is an alias for _updateConfig
     * @param {string} path - Dot-notation path
     * @param {*} value - New value
     */
    updateConfig(path, value) {
        // Handle special cell style paths from color-section
        if (path.startsWith('_cellStyle_')) {
            const match = path.match(/_cellStyle_(\d+)_(\d+)_(\w+)/);
            if (match) {
                const [, row, col, property] = match;
                this._setCellStyleValue(parseInt(row), parseInt(col), property, value);
                return;
            }
        }

        this._updateConfig(path, value);
    }

    /**
     * Get cell style value at specific row/col
     * @param {number} row - Row index
     * @param {number} col - Column index
     * @param {string} property - Style property name
     * @returns {*} Style value or empty string
     * @private
     */
    _getCellStyleValue(row, col, property) {
        const rowData = this._workingConfig.rows?.[row];
        if (!rowData) return '';

        // Handle object format with cellStyles
        if (typeof rowData === 'object' && !Array.isArray(rowData)) {
            return rowData.cellStyles?.[col]?.[property] || '';
        }

        return '';
    }

    /**
     * Set cell style value at specific row/col
     * @param {number} row - Row index
     * @param {number} col - Column index
     * @param {string} property - Style property name
     * @param {*} value - Style value
     * @private
     */
    _setCellStyleValue(row, col, property, value) {
        // Ensure row exists
        if (!this._workingConfig.rows[row]) {
            this._workingConfig.rows[row] = Array(this._gridColumnCount).fill('');
        }

        // Convert row to object format if it's an array
        let rowData = this._workingConfig.rows[row];
        if (Array.isArray(rowData)) {
            rowData = {
                values: [...rowData],
                cellStyles: []
            };
            this._workingConfig.rows[row] = rowData;
        }

        // Ensure cellStyles array exists
        if (!rowData.cellStyles) {
            rowData.cellStyles = [];
        }

        // Ensure cell style object exists
        if (!rowData.cellStyles[col]) {
            rowData.cellStyles[col] = {};
        }

        // Set the property (or remove if empty)
        if (value === '' || value === null || value === undefined) {
            delete rowData.cellStyles[col][property];

            // Clean up empty objects
            if (Object.keys(rowData.cellStyles[col]).length === 0) {
                rowData.cellStyles[col] = null;
            }
        } else {
            rowData.cellStyles[col][property] = value;
        }

        lcardsLog.debug('[DataGridStudioV4] Cell style updated:', { row, col, property, value });

        this.requestUpdate();
        this._schedulePreviewUpdate();
    }

    /**
     * Clear all styles for a specific cell
     * @param {number} row - Row index
     * @param {number} col - Column index
     * @private
     */
    _clearCellStyle(row, col) {
        const rowData = this._workingConfig.rows?.[row];
        if (!rowData || typeof rowData !== 'object' || Array.isArray(rowData)) {
            return;
        }

        if (rowData.cellStyles && rowData.cellStyles[col]) {
            rowData.cellStyles[col] = null;
            lcardsLog.info('[DataGridStudioV4] Cell style cleared:', { row, col });
            this.requestUpdate();
            this._schedulePreviewUpdate();
        }
    }

    /**
     * Get row style value
     * @param {number} row - Row index
     * @param {string} property - Style property name
     * @returns {string} Property value or empty string
     * @private
     */
    _getRowStyleValue(row, property) {
        const rowData = this._workingConfig.rows?.[row];
        if (!rowData || typeof rowData !== 'object' || Array.isArray(rowData)) {
            return '';
        }
        return rowData.style?.[property] || '';
    }

    /**
     * Get column style value
     * @param {number} col - Column index
     * @param {string} property - Style property name
     * @returns {string} Property value or empty string
     * @private
     */
    _getColumnStyleValue(col, property) {
        const colData = this._workingConfig.columns?.[col];
        if (!colData || typeof colData !== 'object') {
            return '';
        }
        return colData.style?.[property] || '';
    }

    /**
     * Set row style value
     * @param {number} row - Row index
     * @param {string} property - Style property name
     * @param {*} value - Property value
     * @private
     */
    _setRowStyleValue(row, property, value) {
        let rowData = this._workingConfig.rows?.[row];
        if (!rowData) return;

        // Convert simple array to object structure if needed
        if (Array.isArray(rowData)) {
            rowData = {
                values: rowData,
                style: {},
                cellStyles: []
            };
            this._workingConfig.rows[row] = rowData;
        }

        // Initialize style object if needed
        if (!rowData.style) {
            rowData.style = {};
        }

        // Set or remove the property
        if (value === '' || value === null || value === undefined) {
            delete rowData.style[property];
        } else {
            rowData.style[property] = value;
        }

        lcardsLog.debug('[DataGridStudioV4] Row style updated:', { row, property, value });
        this.requestUpdate();
        this._schedulePreviewUpdate();
    }

    /**
     * Set column style value
     * @param {number} col - Column index
     * @param {string} property - Style property name
     * @param {*} value - Property value
     * @private
     */
    _setColumnStyleValue(col, property, value) {
        // Initialize columns array if needed
        if (!this._workingConfig.columns) {
            this._workingConfig.columns = [];
        }

        // Initialize column object if needed
        if (!this._workingConfig.columns[col]) {
            this._workingConfig.columns[col] = { style: {} };
        }

        // Initialize style object if needed
        if (!this._workingConfig.columns[col].style) {
            this._workingConfig.columns[col].style = {};
        }

        // Set or remove the property
        if (value === '' || value === null || value === undefined) {
            delete this._workingConfig.columns[col].style[property];
        } else {
            this._workingConfig.columns[col].style[property] = value;
        }

        lcardsLog.debug('[DataGridStudioV4] Column style updated:', { col, property, value });
        this.requestUpdate();
        this._schedulePreviewUpdate();
    }

    /**
     * Clear all style overrides for a row
     * @param {number} row - Row index
     * @private
     */
    _clearRowStyle(row) {
        const rowData = this._workingConfig.rows?.[row];
        if (!rowData || typeof rowData !== 'object' || Array.isArray(rowData)) {
            return;
        }

        if (rowData.style && Object.keys(rowData.style).length > 0) {
            rowData.style = {};
            lcardsLog.info('[DataGridStudioV4] Row style cleared:', { row });
            this.requestUpdate();
            this._schedulePreviewUpdate();
        }
    }

    /**
     * Clear all style overrides for a column
     * @param {number} col - Column index
     * @private
     */
    _clearColumnStyle(col) {
        const colData = this._workingConfig.columns?.[col];
        if (!colData || typeof colData !== 'object') {
            return;
        }

        if (colData.style && Object.keys(colData.style).length > 0) {
            colData.style = {};
            lcardsLog.info('[DataGridStudioV4] Column style cleared:', { col });
            this.requestUpdate();
            this._schedulePreviewUpdate();
        }
    }

    /**
     * Schedule debounced preview update
     */
    _schedulePreviewUpdate() {
        if (this._previewUpdateTimer) {
            clearTimeout(this._previewUpdateTimer);
        }

        this._previewUpdateTimer = setTimeout(() => {
            this._updatePreviewCard();
        }, 300); // 300ms debounce
    }

    /**
     * Update preview card (manual DOM manipulation)
     */
    _updatePreviewCard() {
        const container = this._previewRef.value;
        if (!container) {
            lcardsLog.warn('[DataGridStudioV4] Preview container not ready');
            return;
        }

        // Remove existing card
        while (container.firstChild) {
            container.removeChild(container.firstChild);
        }

        // Create new card instance
        const card = document.createElement('lcards-data-grid');

        // Convert config for backward compatibility with card
        const cardConfig = this._convertConfigForCard(this._workingConfig);

        // Control animations via explicit flag
        if (!this._showAnimations) {
            // Disable all animation-related config
            if (cardConfig.animation) {
                cardConfig.animation = { ...cardConfig.animation, enabled: false };
            }
            if (cardConfig.animations) {
                cardConfig.animations = cardConfig.animations.map(anim => ({
                    ...anim,
                    enabled: false
                }));
            }
        }

        lcardsLog.debug('[DataGridStudioV4] Setting card config:', cardConfig);

        // @ts-ignore - TS2339: auto-suppressed
        card.setConfig(cardConfig);
        // @ts-ignore - TS2339: auto-suppressed
        card.hass = this.hass;

        // Add to container
        container.appendChild(card);

        // Inject gridline styles into card's shadow DOM if enabled
        if (this._showGridLines) {
            this._injectGridlineStyles(card);
        }

        lcardsLog.debug('[DataGridStudioV4] Preview card updated');
    }

    /**
     * Inject gridline styles into card's shadow DOM
     */
    _injectGridlineStyles(card) {
        // Wait for card to render
        requestAnimationFrame(() => {
            const shadowRoot = card.shadowRoot;
            if (!shadowRoot) {
                lcardsLog.warn('[DataGridStudioV4] Card has no shadow root');
                return;
            }

            // Check if style already injected
            const existingStyle = shadowRoot.querySelector('#editor-gridlines-style');
            if (existingStyle) {
                return;
            }

            // Create style element
            const style = document.createElement('style');
            style.id = 'editor-gridlines-style';
            style.textContent = `
                .grid-cell {
                    outline: 2px dashed rgba(var(--rgb-primary-color, 3, 169, 244), 0.6) !important;
                    outline-offset: -1px;
                }
            `;

            shadowRoot.appendChild(style);
            lcardsLog.debug('[DataGridStudioV4] Gridline styles injected into shadow DOM');
        });
    }

    /**
     * Convert editor config to card-compatible config
     * Simply returns a deep copy - no migration/conversion needed
     */
    _convertConfigForCard(config) {
        // Deep copy config
        return JSON.parse(JSON.stringify(config));
    }

    /**
     * Validate configuration
     * @returns {Array<string>} Array of error messages
     */
    _validateConfig() {
        const errors = [];

        // Required fields
        if (!this._workingConfig.data_mode) {
            errors.push('Data mode is required');
        }

        // Grid dimensions
        if (this._workingConfig.grid) {
            if (this._workingConfig.grid.rows < 1 || this._workingConfig.grid.rows > 50) {
                errors.push('Grid rows must be between 1 and 50');
            }
            if (this._workingConfig.grid.columns < 1 || this._workingConfig.grid.columns > 50) {
                errors.push('Grid columns must be between 1 and 50');
            }
        }

        // Data mode validation
        if (this._workingConfig.data_mode === 'data') {
            // Grid layout validation
            const rows = this._workingConfig.rows || [];
            if (rows.length === 0) {
                errors.push('Data mode: At least one row is required');
            }
        }

        return errors;
    }

    // ========================================
    // Data Table Mode Operations
    // ========================================

    /**
     * Add new column (column-based layout)
     */
    _addColumn() {
        if (!this._workingConfig.columns) {
            this._workingConfig.columns = [];
        }

        this._workingConfig.columns.push({
            header: `Column ${this._workingConfig.columns.length + 1}`,
            width: 'auto',
            align: 'left',
            style: {}
        });

        lcardsLog.info('[DataGridStudioV4] Column added');
        this.requestUpdate();
        this._schedulePreviewUpdate();
    }

    /**
     * Edit column configuration
     */
    // @ts-ignore - TS2393: auto-suppressed
    _editColumn(index) {
        lcardsLog.info('[DataGridStudioV4] Edit column:', index);

        const column = this._workingConfig.columns?.[index];
        if (!column) {
            lcardsLog.error('[DataGridStudioV4] Column not found:', index);
            return;
        }

        // Create overlay with column editor
        this._activeOverlay = {
            type: 'column',
            colIndex: index,
            data: { ...column }
        };

        this.requestUpdate();
    }

    /**
     * Delete column
     */
    // @ts-ignore - TS2393: auto-suppressed
    _deleteColumn(index) {
        if (!this._workingConfig.columns) return;

        this._workingConfig.columns.splice(index, 1);

        // Also remove cells from all rows
        if (this._workingConfig.rows) {
            this._workingConfig.rows.forEach(row => {
                if (row.sources && Array.isArray(row.sources)) {
                    row.sources.splice(index, 1);
                }
            });
        }

        lcardsLog.info('[DataGridStudioV4] Column deleted:', index);
        this.requestUpdate();
        this._schedulePreviewUpdate();
    }

    /**
     * Add new row (column-based layout)
     */
    _addRow() {
        if (!this._workingConfig.rows) {
            this._workingConfig.rows = [];
        }

        const numColumns = this._workingConfig.columns?.length || 0;
        const newRow = {
            sources: Array(numColumns).fill(null).map(() => ({
                type: 'static',
                value: '',
                column: 0
            }))
        };

        this._workingConfig.rows.push(newRow);

        lcardsLog.info('[DataGridStudioV4] Row added');
        this.requestUpdate();
        this._schedulePreviewUpdate();
    }

    /**
     * Edit row configuration
     */
    // @ts-ignore - TS2393: auto-suppressed
    _editRow(index) {
        // TODO: Open row editor dialog
        lcardsLog.info('[DataGridStudioV4] Edit row:', index);
    }

    /**
     * Delete row
     */
    _deleteRow(index) {
        if (!this._workingConfig.rows) return;

        this._workingConfig.rows.splice(index, 1);

        lcardsLog.info('[DataGridStudioV4] Row deleted:', index);
        this.requestUpdate();
        this._schedulePreviewUpdate();
    }

    /**
     * Move row up or down
     */
    _moveRow(index, direction) {
        if (!this._workingConfig.rows) return;

        const rows = this._workingConfig.rows;
        const newIndex = direction === 'up' ? index - 1 : index + 1;

        if (newIndex < 0 || newIndex >= rows.length) return;

        // Swap rows
        [rows[index], rows[newIndex]] = [rows[newIndex], rows[index]];

        lcardsLog.info('[DataGridStudioV4] Row moved:', direction, index, newIndex);
        this.requestUpdate();
        this._schedulePreviewUpdate();
    }

    /**
     * Add new row for Manual mode
     */
    _addManualRow() {
        if (!this._workingConfig.rows) {
            this._workingConfig.rows = [];
        }

        const numColumns = this._gridColumnCount;
        const newRow = {
            values: Array(numColumns).fill(''),
            style: {},
            cellStyles: []
        };

        this._workingConfig.rows.push(newRow);

        // Update grid template to match new row count
        const newRowCount = this._workingConfig.rows.length;
        const cssValue = `repeat(${newRowCount}, auto)`;
        this._updateConfig('grid.grid-template-rows', cssValue);

        lcardsLog.info('[DataGridStudioV4] Manual row added, new row count:', newRowCount);
        this.requestUpdate();
        this._schedulePreviewUpdate();
    }

    /**
     * Delete row in Manual mode
     */
    _deleteManualRow(index) {
        if (!this._workingConfig.rows) return;

        this._workingConfig.rows.splice(index, 1);

        // Update grid template to match new row count
        const newRowCount = this._workingConfig.rows.length;
        const cssValue = `repeat(${newRowCount}, auto)`;
        this._updateConfig('grid.grid-template-rows', cssValue);

        lcardsLog.info('[DataGridStudioV4] Manual row deleted:', index, 'new row count:', newRowCount);
        this.requestUpdate();
        this._schedulePreviewUpdate();
    }

    /**
     * Add column in Manual mode
     */
    _addManualColumn() {
        if (!this._workingConfig.rows) {
            this._workingConfig.rows = [];
        }

        // Add empty cell to each row's values array
        this._workingConfig.rows.forEach(row => {
            if (row.values) {
                row.values.push('');
            }
        });

        // Update grid template to match new column count
        const newColumnCount = this._gridColumnCount;
        const cssValue = `repeat(${newColumnCount}, 1fr)`;
        this._updateConfig('grid.grid-template-columns', cssValue);

        lcardsLog.info('[DataGridStudioV4] Manual column added, new column count:', newColumnCount);
        this.requestUpdate();
        this._schedulePreviewUpdate();
    }

    /**
     * Edit cell in Manual mode (inline editor)
     */
    _editCell(row, col, value) {
        this._activeCellEdit = { row, col, value };
        this._activeRowEdit = null;
        this._activeColumnEdit = null;
        lcardsLog.debug('[DataGridStudioV4] Edit cell:', { row, col, value });
        this.requestUpdate();
    }

    /**
     * Edit row in Manual mode
     */
    // @ts-ignore - TS2393: auto-suppressed
    _editRow(rowIndex) {
        this._activeRowEdit = rowIndex;
        this._activeCellEdit = null;
        this._activeColumnEdit = null;
        lcardsLog.debug('[DataGridStudioV4] Edit row:', rowIndex);
        this.requestUpdate();
    }

    /**
     * Edit column in Manual mode
     */
    // @ts-ignore - TS2393: auto-suppressed
    _editColumn(colIndex) {
        this._activeColumnEdit = colIndex;
        this._activeCellEdit = null;
        this._activeRowEdit = null;
        lcardsLog.debug('[DataGridStudioV4] Edit column:', colIndex);
        this.requestUpdate();
    }

    /**
     * Save cell edit
     */
    _saveCellEdit() {
        if (!this._activeCellEdit) return;

        const { row, col, value } = this._activeCellEdit;

        // Ensure row exists as object format
        if (!this._workingConfig.rows[row]) {
            this._workingConfig.rows[row] = { values: [], style: {}, cellStyles: [] };
        }

        // Ensure values array exists
        const rowData = this._workingConfig.rows[row];
        if (!rowData.values) {
            rowData.values = [];
        }

        // Update cell value
        rowData.values[col] = value;

        // Close editor
        this._activeCellEdit = null;

        lcardsLog.info('[DataGridStudioV4] Cell saved:', { row, col, value });
        this.requestUpdate();
        this._schedulePreviewUpdate();
    }

    /**
     * Cancel cell edit
     */
    _cancelCellEdit() {
        this._activeCellEdit = null;
        this.requestUpdate();
    }

    /**
     * Set cell content type (text, entity, template)
     * @param {string} type - Cell type
     * @private
     */
    _setCellType(type) {
        if (!this._activeCellEdit) return;

        const currentValue = this._activeCellEdit.value || '';

        if (type === 'entity') {
            // If current value is a template, extract entity if possible
            const entityMatch = currentValue.match(/(?:states|state_attr)\(['"]([a-z_]+\.[a-z0-9_]+)['"]/);
            if (entityMatch) {
                this._activeCellEdit.value = entityMatch[1];
            }
            this._activeCellEdit.type = 'entity';
        } else {
            // Text mode - accepts anything (plain text, templates, expressions)
            this._activeCellEdit.type = 'text';
        }

        this.requestUpdate();
    }

    /**
     * Render inline cell editor
     */
    _renderCellEditor() {
        const { row, col, value } = this._activeCellEdit;

        // Auto-detect cell type from value if not explicitly set
        let cellType = this._activeCellEdit.type;
        if (!cellType) {
            const isEntityId = /^[a-z_]+\.[a-z0-9_]+$/.test(value?.trim() || '');
            cellType = isEntityId ? 'entity' : 'text';
        }

        // Get current cell style if it exists
        const rowData = this._workingConfig.rows[row];
        const cellStyle = (rowData && typeof rowData === 'object' && !Array.isArray(rowData))
            ? rowData.cellStyles?.[col]
            : null;
        const hasCellStyle = cellStyle && Object.keys(cellStyle).length > 0;

        // Use explicit type from user selection (with auto-detection fallback)
        const isEntityMode = cellType === 'entity';
        const isTemplateMode = cellType === 'template';

        return html`
            <lcards-form-section
                header="Edit Cell (Row ${row + 1}, Col ${col + 1})"
                description="Entity ID or static text"
                ?expanded=${true}>

                <!-- Content Type Selector -->
                <div style="margin-bottom: 16px;">
                    <label style="display: block; font-size: 14px; font-weight: 600; margin-bottom: 8px; color: var(--primary-text-color);">
                        Cell Type
                    </label>
                    <div style="display: flex; gap: 8px;">
                        <button
                            class="cell-type-button ${cellType === 'entity' ? 'active' : ''}"
                            @click=${() => this._setCellType('entity')}
                            style="flex: 1; padding: 8px 12px; border: 2px solid var(--divider-color); border-radius: 6px; background: var(--card-background-color); cursor: pointer; transition: all 0.2s;">
                            <ha-icon icon="mdi:home-assistant" style="--mdc-icon-size: 18px;"></ha-icon>
                            Entity
                        </button>
                        <button
                            class="cell-type-button ${cellType === 'text' ? 'active' : ''}"
                            @click=${() => this._setCellType('text')}
                            style="flex: 1; padding: 8px 12px; border: 2px solid var(--divider-color); border-radius: 6px; background: var(--card-background-color); cursor: pointer; transition: all 0.2s;">
                            <ha-icon icon="mdi:text" style="--mdc-icon-size: 18px;"></ha-icon>
                            Text
                        </button>
                    </div>
                </div>

                <!-- Entity Picker (for entity mode) -->
                ${isEntityMode ? html`
                    <div style="margin-bottom: 16px;">
                        <ha-selector
                            .hass=${this.hass}
                            .selector=${{entity: {}}}
                            .value=${value}
                            @value-changed=${(e) => {
                                this._activeCellEdit.value = e.detail.value || '';
                                this.requestUpdate();
                            }}>
                        </ha-selector>
                        <div style="font-size: 12px; color: var(--secondary-text-color); margin-top: 4px;">
                            Select entity to display its current state
                        </div>
                    </div>
                ` : ''}

                <!-- Text Input -->
                ${!isEntityMode ? html`
                    <div style="margin-bottom: 8px;">
                        <label style="display: block; font-size: 14px; font-weight: 600; margin-bottom: 8px; color: var(--primary-text-color);">
                            Cell Content
                        </label>
                        <ha-code-editor
                            mode="jinja2"
                            .value=${value || ''}
                            @value-changed=${(e) => {
                                this._activeCellEdit.value = e.detail.value;
                                this.requestUpdate();
                            }}
                            dir="ltr"
                            autofocus>
                        </ha-code-editor>
                    </div>
                    <div style="font-size: 12px; color: var(--secondary-text-color); margin-top: 4px;">
                        Enter static text, Jinja2 templates ({{...}}), or JavaScript expressions ([[[...]]])
                    </div>
                ` : ''}

                <div style="display: flex; gap: 8px; margin-top: 12px;">
                    <ha-button @click=${this._saveCellEdit}>
                        <ha-icon icon="mdi:check" slot="start"></ha-icon>
                        Save
                    </ha-button>
                    <ha-button appearance="plain" @click=${this._cancelCellEdit}>
                        <ha-icon icon="mdi:close" slot="start"></ha-icon>
                        Cancel
                    </ha-button>
                </div>

                <!-- Cell Style Overrides Section -->
                <details style="margin-top: 16px;" ?open=${hasCellStyle}>
                    <summary style="cursor: pointer; font-weight: 600; padding: 8px 0; user-select: none;">
                        <ha-icon icon="mdi:palette" style="margin-right: 8px;"></ha-icon>
                        Cell Style Overrides ${hasCellStyle ? '(Active)' : ''}
                    </summary>

                    <div style="margin-top: 12px; padding-left: 12px; border-left: 3px solid var(--primary-color);">
                        <lcards-message type="info" style="margin-bottom: 12px;">
                            Cell styles override row and table-level styles. Leave empty to inherit from parent styles.
                        </lcards-message>

                        <lcards-color-section
                            .editor=${this}
                            header="Cell Colors"
                            .colorPaths=${[
                                { path: `_cellStyle_${row}_${col}_color`, label: 'Text Color', helper: 'Override cell text color' },
                                { path: `_cellStyle_${row}_${col}_background`, label: 'Background', helper: 'Override cell background' }
                            ]}
                            ?expanded=${true}
                            ?useColorPicker=${true}>
                        </lcards-color-section>

                        <!-- Typography -->
                        <div style="font-weight: 600; margin-top: 12px; margin-bottom: 8px; color: var(--primary-text-color);">Typography</div>
                        <lcards-grid-layout>
                            <ha-selector
                                .hass=${this.hass}
                                .selector=${{text: {}}}
                                .label=${'Font Size'}
                                .value=${this._getCellStyleValue(row, col, 'font_size') || ''}
                                .placeholder=${'Inherit'}
                                .helper=${'Leave empty to inherit'}
                                @value-changed=${(e) => this._setCellStyleValue(row, col, 'font_size', e.detail.value)}
                                @closed=${(e) => e.stopPropagation()}>
                            </ha-selector>

                            <ha-selector
                                .hass=${this.hass}
                                .selector=${{number: {
                                    mode: 'box',
                                    min: 100,
                                    max: 900,
                                    step: 100
                                }}}
                                .label=${'Font Weight'}
                                .value=${this._getCellStyleValue(row, col, 'font_weight')}
                                @value-changed=${(e) => this._setCellStyleValue(row, col, 'font_weight', e.detail.value)}
                                @closed=${(e) => e.stopPropagation()}>
                            </ha-selector>
                        </lcards-grid-layout>

                        <lcards-grid-layout>
                            <ha-selector
                                .hass=${this.hass}
                                .selector=${{select: {
                                    mode: 'dropdown',
                                    options: [
                                        { value: '', label: 'Inherit' },
                                        { value: 'none', label: 'None' },
                                        { value: 'uppercase', label: 'UPPERCASE' },
                                        { value: 'lowercase', label: 'lowercase' },
                                        { value: 'capitalize', label: 'Capitalize' }
                                    ]
                                }}}
                                .value=${this._getCellStyleValue(row, col, 'text_transform') || ''}
                                .label=${'Text Transform'}
                                @value-changed=${(e) => this._setCellStyleValue(row, col, 'text_transform', e.detail.value)}
                                @closed=${(e) => e.stopPropagation()}>
                            </ha-selector>

                            <ha-selector
                                .hass=${this.hass}
                                .selector=${{text: {}}}
                                .label=${'Letter Spacing'}
                                .value=${this._getCellStyleValue(row, col, 'letter_spacing') || ''}
                                .placeholder=${'Inherit'}
                                .helper=${'Leave empty to inherit'}
                                @value-changed=${(e) => this._setCellStyleValue(row, col, 'letter_spacing', e.detail.value)}
                                @closed=${(e) => e.stopPropagation()}>
                            </ha-selector>
                        </lcards-grid-layout>

                        <!-- Wrapping & Alignment -->
                        <div style="font-weight: 600; margin-top: 16px; margin-bottom: 8px; color: var(--primary-text-color);">Wrapping & Alignment</div>
                        <ha-selector
                            .hass=${this.hass}
                            .selector=${{select: {
                                mode: 'dropdown',
                                options: [
                                    { value: 'nowrap', label: 'No Wrap (truncate with ellipsis)' },
                                    { value: 'normal', label: 'Wrap (word boundaries)' },
                                    { value: 'pre-wrap', label: 'Wrap (preserve line breaks)' },
                                    { value: 'pre-line', label: 'Wrap (collapse spaces, preserve \\n)' }
                                ]
                            }}}
                            .value=${this._getCellStyleValue(row, col, 'white_space') || 'nowrap'}
                            .label=${'Text Wrapping'}
                            @value-changed=${(e) => this._setCellStyleValue(row, col, 'white_space', e.detail.value)}
                            @closed=${(e) => e.stopPropagation()}>
                        </ha-selector>

                        <lcards-grid-layout style="margin-top: 12px;">
                            <ha-selector
                                .hass=${this.hass}
                                .selector=${{select: {
                                    mode: 'dropdown',
                                    options: [
                                        { value: '', label: 'Inherit' },
                                        { value: 'flex-start', label: 'Top' },
                                        { value: 'center', label: 'Center' },
                                        { value: 'flex-end', label: 'Bottom' },
                                        { value: 'baseline', label: 'Baseline' }
                                    ]
                                }}}
                                .value=${this._getCellStyleValue(row, col, 'align_items') || ''}
                                .label=${'Vertical Align'}
                                @value-changed=${(e) => this._setCellStyleValue(row, col, 'align_items', e.detail.value)}
                                @closed=${(e) => e.stopPropagation()}>
                            </ha-selector>

                            <ha-selector
                                .hass=${this.hass}
                                .selector=${{select: {
                                    mode: 'dropdown',
                                    options: [
                                        { value: '', label: 'Inherit' },
                                        { value: 'flex-start', label: 'Left' },
                                        { value: 'center', label: 'Center' },
                                        { value: 'flex-end', label: 'Right' },
                                        { value: 'space-between', label: 'Space Between' }
                                    ]
                                }}}
                                .value=${this._getCellStyleValue(row, col, 'justify_content') || ''}
                                .label=${'Horizontal Align'}
                                @value-changed=${(e) => this._setCellStyleValue(row, col, 'justify_content', e.detail.value)}
                                @closed=${(e) => e.stopPropagation()}>
                            </ha-selector>
                        </lcards-grid-layout>

                        <ha-button
                            appearance="plain"
                            @click=${() => this._clearCellStyle(row, col)}
                            style="margin-top: 12px;"
                            .disabled=${!hasCellStyle}>
                            <ha-icon icon="mdi:eraser" slot="start"></ha-icon>
                            Clear Cell Styles
                        </ha-button>
                    </div>
                </details>

                ${this._renderTemplateExamples()}
            </lcards-form-section>
        `;
    }

    /**
     * Render template examples with insert/copy buttons
     */
    _renderTemplateExamples() {
        const examples = [
            {
                category: 'Basic',
                items: [
                    { label: 'Static Text', template: 'DECK 1', description: 'Plain text' },
                    { label: 'Entity State', template: "{{states('sensor.temperature')}}", description: 'Current entity state' },
                    { label: 'Entity Attribute', template: "{{state_attr('light.kitchen', 'brightness')}}", description: 'Specific attribute' }
                ]
            },
            {
                category: 'Formatted Numbers',
                items: [
                    { label: 'Temperature', template: "{{states('sensor.temp')|float|round(1)}}°C", description: 'Rounded to 1 decimal' },
                    { label: 'Percentage', template: "{{states('sensor.battery')|int}}%", description: 'Integer percentage' },
                    { label: 'Power', template: "{{(states('sensor.power')|float / 1000)|round(2)}} kW", description: 'Watts to kilowatts' }
                ]
            },
            {
                category: 'Conditionals',
                items: [
                    { label: 'On/Off', template: "{% if is_state('light.kitchen', 'on') %}ON{% else %}OFF{% endif %}", description: 'Binary state' },
                    { label: 'Threshold', template: "{% if states('sensor.temp')|float > 25 %}HOT{% else %}OK{% endif %}", description: 'Numeric comparison' },
                    { label: 'Status', template: "{% if is_state('binary_sensor.door', 'on') %}OPEN{% else %}CLOSED{% endif %}", description: 'Binary sensor' }
                ]
            },
            {
                category: 'Time & Date',
                items: [
                    { label: 'Last Changed', template: "{{relative_time(states.sensor.temperature.last_changed)}}", description: 'Relative time' },
                    { label: 'Current Time', template: "{{now().strftime('%H:%M')}}", description: '24-hour format' },
                    { label: 'Date', template: "{{now().strftime('%Y-%m-%d')}}", description: 'ISO date format' }
                ]
            }
        ];

        return html`
            <lcards-form-section
                header="Template Examples"
                description="Click to insert or copy common patterns"
                ?expanded=${false}
                style="margin-top: 12px;">

                ${examples.map(category => html`
                    <div style="margin-bottom: 16px;">
                        <div style="font-weight: 600; margin-bottom: 8px; color: var(--primary-text-color);">
                            ${category.category}
                        </div>
                        ${category.items.map(item => html`
                            <div style="display: grid; grid-template-columns: 1fr auto auto; gap: 8px; align-items: center; padding: 8px; background: var(--card-background-color); border: 1px solid var(--divider-color); border-radius: 4px; margin-bottom: 8px;">
                                <div>
                                    <div style="font-weight: 500; margin-bottom: 4px;">${item.label}</div>
                                    <code style="font-size: 11px; color: var(--secondary-text-color); word-break: break-all;">
                                        ${item.template}
                                    </code>
                                    <div style="font-size: 12px; color: var(--secondary-text-color); margin-top: 4px;">
                                        ${item.description}
                                    </div>
                                </div>
                                <ha-icon-button
                                    @click=${() => this._insertTemplate(item.template)}
                                    title="Insert template into cell"
                                    style="--mdc-icon-button-size: 36px;">
                                    <ha-icon icon="mdi:arrow-left-bold"></ha-icon>
                                </ha-icon-button>
                                <ha-icon-button
                                    @click=${() => this._copyTemplate(item.template)}
                                    title="Copy to clipboard"
                                    style="--mdc-icon-button-size: 36px;">
                                    <ha-icon icon="mdi:content-copy"></ha-icon>
                                </ha-icon-button>
                            </div>
                        `)}
                    </div>
                `)}
            </lcards-form-section>
        `;
    }

    /**
     * Insert template into active cell
     */
    _insertTemplate(template) {
        if (this._activeCellEdit) {
            this._activeCellEdit.value = template;
            this.requestUpdate();
            lcardsLog.info('[DataGridStudioV4] Template inserted:', template);
        }
    }

    /**
     * Copy template to clipboard
     */
    async _copyTemplate(template) {
        try {
            await navigator.clipboard.writeText(template);
            lcardsLog.info('[DataGridStudioV4] Template copied to clipboard:', template);

            // Show brief success feedback (optional)
            // Could trigger a toast notification here if available
        } catch (err) {
            lcardsLog.error('[DataGridStudioV4] Failed to copy template:', err);
        }
    }

    /**
     * Render inline row editor
     */
    _renderRowEditor() {
        const rowIndex = this._activeRowEdit;
        const rowData = this._workingConfig.rows[rowIndex];

        // Check if row has style overrides
        const rowStyle = (rowData && typeof rowData === 'object' && !Array.isArray(rowData))
            ? rowData.style
            : null;
        const hasRowStyle = rowStyle && Object.keys(rowStyle).length > 0;

        return html`
            <lcards-form-section
                header="Row ${rowIndex + 1} Operations"
                description="Bulk operations for this row"
                ?expanded=${true}>

                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 8px;">
                    <ha-button @click=${() => this._insertRowBefore(rowIndex)}>
                        <ha-icon icon="mdi:table-row-plus-before" slot="start"></ha-icon>
                        Insert Before
                    </ha-button>

                    <ha-button @click=${() => this._insertRowAfter(rowIndex)}>
                        <ha-icon icon="mdi:table-row-plus-after" slot="start"></ha-icon>
                        Insert After
                    </ha-button>

                    <ha-button @click=${() => this._moveRowUp(rowIndex)} .disabled=${rowIndex === 0}>
                        <ha-icon icon="mdi:arrow-up-bold" slot="start"></ha-icon>
                        Move Up
                    </ha-button>

                    <ha-button @click=${() => this._moveRowDown(rowIndex)} .disabled=${rowIndex === this._workingConfig.rows.length - 1}>
                        <ha-icon icon="mdi:arrow-down-bold" slot="start"></ha-icon>
                        Move Down
                    </ha-button>

                    <ha-button variant="danger" @click=${() => this._deleteManualRow(rowIndex)}>
                        <ha-icon icon="mdi:delete" slot="start"></ha-icon>
                        Delete Row
                    </ha-button>

                    <ha-button appearance="plain" @click=${() => { this._activeRowEdit = null; this.requestUpdate(); }}>
                        <ha-icon icon="mdi:close" slot="start"></ha-icon>
                        Close
                    </ha-button>
                </div>

                <!-- Row Style Overrides Section -->
                <details style="margin-top: 16px;" ?open=${hasRowStyle}>
                    <summary style="cursor: pointer; font-weight: 600; padding: 8px 0; user-select: none;">
                        <ha-icon icon="mdi:palette" style="margin-right: 8px;"></ha-icon>
                        Row Style Overrides ${hasRowStyle ? '(Active)' : ''}
                    </summary>

                    <div style="margin-top: 12px; padding-left: 12px; border-left: 3px solid var(--primary-color);">
                        <lcards-message type="info" style="margin-bottom: 12px;">
                            Row styles apply to all cells in this row, but can be overridden by individual cell styles. Leave empty to inherit from table-level styles.
                        </lcards-message>

                        <lcards-color-section
                            .editor=${this}
                            header="Row Colors"
                            .colorPaths=${[
                                { path: `rows.${rowIndex}.style.color`, label: 'Text Color', helper: 'Override row text color' },
                                { path: `rows.${rowIndex}.style.background`, label: 'Background', helper: 'Override row background' }
                            ]}
                            ?expanded=${true}
                            ?useColorPicker=${true}>
                        </lcards-color-section>

                        <!-- Typography -->
                        <div style="font-weight: 600; margin-top: 12px; margin-bottom: 8px; color: var(--primary-text-color);">Typography</div>
                        <lcards-grid-layout>
                            <ha-selector
                                .hass=${this.hass}
                                .selector=${{text: {}}}
                                .label=${'Font Size'}
                                .value=${this._getRowStyleValue(rowIndex, 'font_size') || ''}
                                .placeholder=${'Inherit'}
                                .helper=${'Leave empty to inherit'}
                                @value-changed=${(e) => this._setRowStyleValue(rowIndex, 'font_size', e.detail.value)}
                                @closed=${(e) => e.stopPropagation()}>
                            </ha-selector>

                            <ha-selector
                                .hass=${this.hass}
                                .selector=${{number: {
                                    mode: 'box',
                                    min: 100,
                                    max: 900,
                                    step: 100
                                }}}
                                .label=${'Font Weight'}
                                .value=${this._getRowStyleValue(rowIndex, 'font_weight')}
                                @value-changed=${(e) => this._setRowStyleValue(rowIndex, 'font_weight', e.detail.value)}
                                @closed=${(e) => e.stopPropagation()}>
                            </ha-selector>
                        </lcards-grid-layout>

                        <lcards-grid-layout>
                            <ha-selector
                                .hass=${this.hass}
                                .selector=${{select: {
                                    mode: 'dropdown',
                                    options: [
                                        { value: '', label: 'Inherit' },
                                        { value: 'none', label: 'None' },
                                        { value: 'uppercase', label: 'UPPERCASE' },
                                        { value: 'lowercase', label: 'lowercase' },
                                        { value: 'capitalize', label: 'Capitalize' }
                                    ]
                                }}}
                                .value=${this._getRowStyleValue(rowIndex, 'text_transform') || ''}
                                .label=${'Text Transform'}
                                @value-changed=${(e) => this._setRowStyleValue(rowIndex, 'text_transform', e.detail.value)}
                                @closed=${(e) => e.stopPropagation()}>
                            </ha-selector>

                            <ha-selector
                                .hass=${this.hass}
                                .selector=${{text: {}}}
                                .label=${'Letter Spacing'}
                                .value=${this._getRowStyleValue(rowIndex, 'letter_spacing') || ''}
                                .placeholder=${'Inherit'}
                                .helper=${'Leave empty to inherit'}
                                @value-changed=${(e) => this._setRowStyleValue(rowIndex, 'letter_spacing', e.detail.value)}
                                @closed=${(e) => e.stopPropagation()}>
                            </ha-selector>
                        </lcards-grid-layout>

                        <!-- Wrapping & Alignment -->
                        <div style="font-weight: 600; margin-top: 16px; margin-bottom: 8px; color: var(--primary-text-color);">Wrapping & Alignment</div>
                        <ha-selector
                            .hass=${this.hass}
                            .selector=${{select: {
                                mode: 'dropdown',
                                options: [
                                    { value: 'nowrap', label: 'No Wrap (truncate with ellipsis)' },
                                    { value: 'normal', label: 'Wrap (word boundaries)' },
                                    { value: 'pre-wrap', label: 'Wrap (preserve line breaks)' },
                                    { value: 'pre-line', label: 'Wrap (collapse spaces, preserve \\n)' }
                                ]
                            }}}
                            .value=${this._getRowStyleValue(rowIndex, 'white_space') || 'nowrap'}
                            .label=${'Text Wrapping'}
                            @value-changed=${(e) => this._setRowStyleValue(rowIndex, 'white_space', e.detail.value)}
                            @closed=${(e) => e.stopPropagation()}>
                        </ha-selector>

                        <lcards-grid-layout style="margin-top: 12px;">
                            <ha-selector
                                .hass=${this.hass}
                                .selector=${{select: {
                                    mode: 'dropdown',
                                    options: [
                                        { value: '', label: 'Inherit' },
                                        { value: 'flex-start', label: 'Top' },
                                        { value: 'center', label: 'Center' },
                                        { value: 'flex-end', label: 'Bottom' },
                                        { value: 'baseline', label: 'Baseline' }
                                    ]
                                }}}
                                .value=${this._getRowStyleValue(rowIndex, 'align_items') || ''}
                                .label=${'Vertical Align'}
                                @value-changed=${(e) => this._setRowStyleValue(rowIndex, 'align_items', e.detail.value)}
                                @closed=${(e) => e.stopPropagation()}>
                            </ha-selector>

                            <ha-selector
                                .hass=${this.hass}
                                .selector=${{select: {
                                    mode: 'dropdown',
                                    options: [
                                        { value: '', label: 'Inherit' },
                                        { value: 'flex-start', label: 'Left' },
                                        { value: 'center', label: 'Center' },
                                        { value: 'flex-end', label: 'Right' },
                                        { value: 'space-between', label: 'Space Between' }
                                    ]
                                }}}
                                .value=${this._getRowStyleValue(rowIndex, 'justify_content') || ''}
                                .label=${'Horizontal Align'}
                                @value-changed=${(e) => this._setRowStyleValue(rowIndex, 'justify_content', e.detail.value)}
                                @closed=${(e) => e.stopPropagation()}>
                            </ha-selector>
                        </lcards-grid-layout>

                        <ha-button
                            appearance="plain"
                            @click=${() => this._clearRowStyle(rowIndex)}
                            style="margin-top: 12px;"
                            .disabled=${!hasRowStyle}>
                            <ha-icon icon="mdi:eraser" slot="start"></ha-icon>
                            Clear Row Styles
                        </ha-button>
                    </div>
                </details>
            </lcards-form-section>
        `;
    }

    /**
     * Render inline column editor
     */
    _renderColumnEditor() {
        const colIndex = this._activeColumnEdit;

        // Check if column has style overrides
        const colStyle = this._workingConfig.columns?.[colIndex]?.style;
        const hasColumnStyle = colStyle && Object.keys(colStyle).length > 0;

        return html`
            <lcards-form-section
                header="Column ${colIndex + 1} Operations"
                description="Bulk operations for this column"
                ?expanded=${true}>

                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 8px;">
                    <ha-button @click=${() => this._insertColumnBefore(colIndex)}>
                        <ha-icon icon="mdi:table-column-plus-before" slot="start"></ha-icon>
                        Insert Before
                    </ha-button>

                    <ha-button @click=${() => this._insertColumnAfter(colIndex)}>
                        <ha-icon icon="mdi:table-column-plus-after" slot="start"></ha-icon>
                        Insert After
                    </ha-button>

                    <ha-button @click=${() => this._moveColumnLeft(colIndex)} .disabled=${colIndex === 0}>
                        <ha-icon icon="mdi:arrow-left-bold" slot="start"></ha-icon>
                        Move Left
                    </ha-button>

                    <ha-button @click=${() => this._moveColumnRight(colIndex)} .disabled=${colIndex === this._gridColumnCount - 1}>
                        <ha-icon icon="mdi:arrow-right-bold" slot="start"></ha-icon>
                        Move Right
                    </ha-button>

                    <ha-button variant="danger" @click=${() => this._deleteColumn(colIndex)}>
                        <ha-icon icon="mdi:delete" slot="start"></ha-icon>
                        Delete Column
                    </ha-button>

                    <ha-button appearance="plain" @click=${() => { this._activeColumnEdit = null; this.requestUpdate(); }}>
                        <ha-icon icon="mdi:close" slot="start"></ha-icon>
                        Close
                    </ha-button>
                </div>

                <!-- Column Style Overrides Section -->
                <details style="margin-top: 16px;" ?open=${hasColumnStyle}>
                    <summary style="cursor: pointer; font-weight: 600; padding: 8px 0; user-select: none;">
                        <ha-icon icon="mdi:palette" style="margin-right: 8px;"></ha-icon>
                        Column Style Overrides ${hasColumnStyle ? '(Active)' : ''}
                    </summary>

                    <div style="margin-top: 12px; padding-left: 12px; border-left: 3px solid var(--primary-color);">
                        <lcards-message type="info" style="margin-bottom: 12px;">
                            Column styles apply to all cells in this column, but can be overridden by row or individual cell styles. Leave empty to inherit from table-level styles.
                        </lcards-message>

                        <lcards-color-section
                            .editor=${this}
                            header="Column Colors"
                            .colorPaths=${[
                                { path: `columns.${colIndex}.style.color`, label: 'Text Color', helper: 'Override column text color' },
                                { path: `columns.${colIndex}.style.background`, label: 'Background', helper: 'Override column background' }
                            ]}
                            ?expanded=${true}
                            ?useColorPicker=${true}>
                        </lcards-color-section>

                        <!-- Typography -->
                        <div style="font-weight: 600; margin-top: 12px; margin-bottom: 8px; color: var(--primary-text-color);">Typography</div>
                        <lcards-grid-layout>
                            <ha-selector
                                .hass=${this.hass}
                                .selector=${{text: {}}}
                                .label=${'Font Size'}
                                .value=${this._getColumnStyleValue(colIndex, 'font_size') || ''}
                                .placeholder=${'Inherit'}
                                .helper=${'Leave empty to inherit'}
                                @value-changed=${(e) => this._setColumnStyleValue(colIndex, 'font_size', e.detail.value)}
                                @closed=${(e) => e.stopPropagation()}>
                            </ha-selector>

                            <ha-selector
                                .hass=${this.hass}
                                .selector=${{number: {
                                    mode: 'box',
                                    min: 100,
                                    max: 900,
                                    step: 100
                                }}}
                                .label=${'Font Weight'}
                                .value=${this._getColumnStyleValue(colIndex, 'font_weight')}
                                @value-changed=${(e) => this._setColumnStyleValue(colIndex, 'font_weight', e.detail.value)}
                                @closed=${(e) => e.stopPropagation()}>
                            </ha-selector>
                        </lcards-grid-layout>

                        <lcards-grid-layout>
                            <ha-selector
                                .hass=${this.hass}
                                .selector=${{select: {
                                    mode: 'dropdown',
                                    options: [
                                        { value: '', label: 'Inherit' },
                                        { value: 'none', label: 'None' },
                                        { value: 'uppercase', label: 'UPPERCASE' },
                                        { value: 'lowercase', label: 'lowercase' },
                                        { value: 'capitalize', label: 'Capitalize' }
                                    ]
                                }}}
                                .value=${this._getColumnStyleValue(colIndex, 'text_transform') || ''}
                                .label=${'Text Transform'}
                                @value-changed=${(e) => this._setColumnStyleValue(colIndex, 'text_transform', e.detail.value)}
                                @closed=${(e) => e.stopPropagation()}>
                            </ha-selector>

                            <ha-selector
                                .hass=${this.hass}
                                .selector=${{text: {}}}
                                .label=${'Letter Spacing'}
                                .value=${this._getColumnStyleValue(colIndex, 'letter_spacing') || ''}
                                .placeholder=${'Inherit'}
                                .helper=${'Leave empty to inherit'}
                                @value-changed=${(e) => this._setColumnStyleValue(colIndex, 'letter_spacing', e.detail.value)}
                                @closed=${(e) => e.stopPropagation()}>
                            </ha-selector>
                        </lcards-grid-layout>

                        <!-- Wrapping & Alignment -->
                        <div style="font-weight: 600; margin-top: 16px; margin-bottom: 8px; color: var(--primary-text-color);">Wrapping & Alignment</div>
                        <ha-selector
                            .hass=${this.hass}
                            .selector=${{select: {
                                mode: 'dropdown',
                                options: [
                                    { value: 'nowrap', label: 'No Wrap (truncate with ellipsis)' },
                                    { value: 'normal', label: 'Wrap (word boundaries)' },
                                    { value: 'pre-wrap', label: 'Wrap (preserve line breaks)' },
                                    { value: 'pre-line', label: 'Wrap (collapse spaces, preserve \\n)' }
                                ]
                            }}}
                            .value=${this._getColumnStyleValue(colIndex, 'white_space') || 'nowrap'}
                            .label=${'Text Wrapping'}
                            @value-changed=${(e) => this._setColumnStyleValue(colIndex, 'white_space', e.detail.value)}
                            @closed=${(e) => e.stopPropagation()}>
                        </ha-selector>

                        <lcards-grid-layout style="margin-top: 12px;">
                            <ha-selector
                                .hass=${this.hass}
                                .selector=${{select: {
                                    mode: 'dropdown',
                                    options: [
                                        { value: '', label: 'Inherit' },
                                        { value: 'flex-start', label: 'Top' },
                                        { value: 'center', label: 'Center' },
                                        { value: 'flex-end', label: 'Bottom' },
                                        { value: 'baseline', label: 'Baseline' }
                                    ]
                                }}}
                                .value=${this._getColumnStyleValue(colIndex, 'align_items') || ''}
                                .label=${'Vertical Align'}
                                @value-changed=${(e) => this._setColumnStyleValue(colIndex, 'align_items', e.detail.value)}
                                @closed=${(e) => e.stopPropagation()}>
                            </ha-selector>

                            <ha-selector
                                .hass=${this.hass}
                                .selector=${{select: {
                                    mode: 'dropdown',
                                    options: [
                                        { value: '', label: 'Inherit' },
                                        { value: 'flex-start', label: 'Left' },
                                        { value: 'center', label: 'Center' },
                                        { value: 'flex-end', label: 'Right' },
                                        { value: 'space-between', label: 'Space Between' }
                                    ]
                                }}}
                                .value=${this._getColumnStyleValue(colIndex, 'justify_content') || ''}
                                .label=${'Horizontal Align'}
                                @value-changed=${(e) => this._setColumnStyleValue(colIndex, 'justify_content', e.detail.value)}
                                @closed=${(e) => e.stopPropagation()}>
                            </ha-selector>
                        </lcards-grid-layout>

                        <ha-button
                            appearance="plain"
                            @click=${() => this._clearColumnStyle(colIndex)}
                            style="margin-top: 12px;"
                            .disabled=${!hasColumnStyle}>
                            <ha-icon icon="mdi:eraser" slot="start"></ha-icon>
                            Clear Column Styles
                        </ha-button>
                    </div>
                </details>
            </lcards-form-section>
        `;
    }

    // ========================================
    // Row/Column Operations
    // ========================================

    _insertRowBefore(index) {
        const emptyRow = {
            values: Array(this._gridColumnCount).fill(''),
            style: {},
            cellStyles: []
        };
        this._workingConfig.rows.splice(index, 0, emptyRow);
        this._activeRowEdit = null;

        // Update grid template to match new row count
        const newRowCount = this._workingConfig.rows.length;
        const cssValue = `repeat(${newRowCount}, auto)`;
        this._updateConfig('grid.grid-template-rows', cssValue);

        lcardsLog.info('[DataGridStudioV4] Row inserted before:', index, 'new row count:', newRowCount);
        this.requestUpdate();
        this._schedulePreviewUpdate();
    }

    _insertRowAfter(index) {
        const emptyRow = {
            values: Array(this._gridColumnCount).fill(''),
            style: {},
            cellStyles: []
        };
        this._workingConfig.rows.splice(index + 1, 0, emptyRow);
        this._activeRowEdit = null;

        // Update grid template to match new row count
        const newRowCount = this._workingConfig.rows.length;
        const cssValue = `repeat(${newRowCount}, auto)`;
        this._updateConfig('grid.grid-template-rows', cssValue);

        lcardsLog.info('[DataGridStudioV4] Row inserted after:', index, 'new row count:', newRowCount);
        this.requestUpdate();
        this._schedulePreviewUpdate();
    }

    _moveRowUp(index) {
        if (index === 0) return;
        const row = this._workingConfig.rows.splice(index, 1)[0];
        this._workingConfig.rows.splice(index - 1, 0, row);
        this._activeRowEdit = index - 1;
        lcardsLog.info('[DataGridStudioV4] Row moved up:', index);
        this.requestUpdate();
        this._schedulePreviewUpdate();
    }

    _moveRowDown(index) {
        if (index === this._workingConfig.rows.length - 1) return;
        const row = this._workingConfig.rows.splice(index, 1)[0];
        this._workingConfig.rows.splice(index + 1, 0, row);
        this._activeRowEdit = index + 1;
        lcardsLog.info('[DataGridStudioV4] Row moved down:', index);
        this.requestUpdate();
        this._schedulePreviewUpdate();
    }

    _insertColumnBefore(index) {
        this._workingConfig.rows.forEach(row => {
            if (row.values) {
                row.values.splice(index, 0, '');
            }
        });

        // Update grid template to match new column count
        const newColumnCount = this._gridColumnCount;
        const cssValue = `repeat(${newColumnCount}, 1fr)`;
        this._updateConfig('grid.grid-template-columns', cssValue);

        this._activeColumnEdit = null;
        lcardsLog.info('[DataGridStudioV4] Column inserted before:', index, 'new column count:', newColumnCount);
        this.requestUpdate();
        this._schedulePreviewUpdate();
    }

    _insertColumnAfter(index) {
        this._workingConfig.rows.forEach(row => {
            if (row.values) {
                row.values.splice(index + 1, 0, '');
            }
        });

        // Update grid template to match new column count
        const newColumnCount = this._gridColumnCount;
        const cssValue = `repeat(${newColumnCount}, 1fr)`;
        this._updateConfig('grid.grid-template-columns', cssValue);

        this._activeColumnEdit = null;
        lcardsLog.info('[DataGridStudioV4] Column inserted after:', index, 'new column count:', newColumnCount);
        this.requestUpdate();
        this._schedulePreviewUpdate();
    }

    _moveColumnLeft(index) {
        if (index === 0) return;
        this._workingConfig.rows.forEach(row => {
            if (row.values) {
                const temp = row.values[index];
                row.values[index] = row.values[index - 1];
                row.values[index - 1] = temp;
            }
        });
        this._activeColumnEdit = index - 1;
        lcardsLog.info('[DataGridStudioV4] Column moved left:', index);
        this.requestUpdate();
        this._schedulePreviewUpdate();
    }

    _moveColumnRight(index) {
        if (index === this._gridColumnCount - 1) return;
        this._workingConfig.rows.forEach(row => {
            if (row.values) {
                const temp = row.values[index];
                row.values[index] = row.values[index + 1];
                row.values[index + 1] = temp;
            }
        });
        this._activeColumnEdit = index + 1;
        lcardsLog.info('[DataGridStudioV4] Column moved right:', index);
        this.requestUpdate();
        this._schedulePreviewUpdate();
    }

    // @ts-ignore - TS2393: auto-suppressed
    _deleteColumn(index) {
        this._workingConfig.rows.forEach(row => {
            if (row.values) {
                row.values.splice(index, 1);
                // Also remove cell style if it exists
                if (row.cellStyles && row.cellStyles[index] !== undefined) {
                    row.cellStyles.splice(index, 1);
                }
            }
        });

        // Update grid template to match new column count
        const newColumnCount = this._gridColumnCount;
        const cssValue = `repeat(${newColumnCount}, 1fr)`;
        this._updateConfig('grid.grid-template-columns', cssValue);

        this._activeColumnEdit = null;
        lcardsLog.info('[DataGridStudioV4] Column deleted:', index, 'new column count:', newColumnCount);
        this.requestUpdate();
        this._schedulePreviewUpdate();
    }

    // ========================================
    // Dialog Actions
    // ========================================

    _handleSave() {
        // Validate config
        const errors = this._validateConfig();
        if (errors.length > 0) {
            this._validationErrors = errors;
            lcardsLog.warn('[DataGridStudioV4] Validation failed:', errors);
            return;
        }

        // Convert config back for card
        const finalConfig = this._convertConfigForCard(this._workingConfig);

        lcardsLog.info('[DataGridStudioV4] Configuration saved:', finalConfig);

        // Fire event
        this.dispatchEvent(new CustomEvent('config-changed', {
            detail: { config: finalConfig },
            bubbles: true,
            composed: true
        }));

        // Close dialog
        this._close();
    }

    _handleCancel() {
        lcardsLog.debug('[DataGridStudioV4] Configuration cancelled');
        this._close();
    }

    _close() {
        this.dispatchEvent(new CustomEvent('closed', {
            bubbles: true,
            composed: true
        }));
    }
}

customElements.define('lcards-data-grid-studio-dialog-v4', LCARdSDataGridStudioDialogV4);
