/**
 * LCARdS Data Grid Configuration Studio V4
 *
 * Complete redesign with WYSIWYG editing and simplified mode architecture:
 * - Decorative Mode: Auto-generated random data (simplest)
 * - Manual Mode: User-defined cell values with WYSIWYG editing
 * - Data Table Mode: Structured data from entities/datasources
 *
 * Key Features:
 * - Click cells/rows/columns in preview to edit
 * - Progressive disclosure (Basic/Advanced tabs)
 * - Visual hierarchy diagrams
 * - No z-index issues (proper overlay management)
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
import { LCARdSFormFieldHelper as FormField } from '../components/shared/lcards-form-field.js';
import '../components/shared/lcards-form-section.js';
import '../components/shared/lcards-message.js';
import '../components/shared/lcards-style-hierarchy-diagram.js';
import '../components/editors/lcards-color-section.js';
import '../components/editors/lcards-grid-layout.js';
import '../components/editors/lcards-font-selector.js';
import '../components/editors/lcards-grid-cell-editor.js';
import '../components/editors/lcards-grid-row-editor.js';
import '../components/editors/lcards-grid-column-editor.js';
import '../../cards/lcards-data-grid.js';

export class LCARdSDataGridStudioDialogV4 extends LitElement {
    static get properties() {
        return {
            hass: { type: Object },
            _initialConfig: { type: Object }, // Store initial config here
            _workingConfig: { type: Object, state: true },
            _activeTab: { type: String, state: true },
            _validationErrors: { type: Array, state: true },
            _gridRows: { type: Number, state: true },
            _gridColumns: { type: Number, state: true },
            _gridGap: { type: Number, state: true },
            _activeCellEdit: { type: Object, state: true }, // {row, col, value}
            _activeRowEdit: { type: Number, state: true }, // row index
            _activeColumnEdit: { type: Number, state: true }, // column index
            _activeTimelineRowEdit: { type: Number, state: true }, // timeline row editor
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

        // Grid UI state variables
        this._gridRows = 8;
        this._gridColumns = 12;
        this._gridGap = 8;

        // Create ref for preview container
        this._previewRef = createRef();

        // Debounce timer for preview updates
        this._previewUpdateTimer = null;

        // Active overlay editor reference
        this._activeOverlay = null;

        // Inline editing state
        this._activeCellEdit = null;
        this._activeRowEdit = null;
        this._activeColumnEdit = null;
        this._activeTimelineRowEdit = null;

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

    connectedCallback() {
        super.connectedCallback();
        // Deep clone initial config
        this._workingConfig = JSON.parse(JSON.stringify(this._initialConfig || {}));

        // Ensure data_mode is set - use new simplified naming
        if (!this._workingConfig.data_mode) {
            this._workingConfig.data_mode = 'decorative';
        } else {
            // Migrate old mode names
            const modeMap = {
                'random': 'decorative',
                'template': 'manual',
                'datasource': 'data-table'
            };
            if (modeMap[this._workingConfig.data_mode]) {
                this._workingConfig.data_mode = modeMap[this._workingConfig.data_mode];
            }
        }

        // Initialize Manual mode with empty row structure to prevent validation errors
        if (this._workingConfig.data_mode === 'manual') {
            // Parse grid config to get column count
            this._parseGridConfigForUI();
            const numColumns = this._gridColumns || 12;

            if (!this._workingConfig.rows || this._workingConfig.rows.length === 0) {
                this._workingConfig.rows = [Array(numColumns).fill('')];
            }
        }

        // Initialize Data Table mode with proper defaults
        if (this._workingConfig.data_mode === 'data-table') {
            // Default to spreadsheet layout if not set
            if (!this._workingConfig.layout) {
                this._workingConfig.layout = 'spreadsheet';
            }

            // Migrate old layout names
            const layoutMap = {
                'column-based': 'spreadsheet',
                'row-timeline': 'timeline'
            };
            if (layoutMap[this._workingConfig.layout]) {
                this._workingConfig.layout = layoutMap[this._workingConfig.layout];
            }

            // Initialize columns/rows for spreadsheet layout
            if (this._workingConfig.layout === 'spreadsheet') {
                if (!this._workingConfig.columns || this._workingConfig.columns.length === 0) {
                    this._workingConfig.columns = [
                        { header: 'Column 1', width: 100, align: 'left' }
                    ];
                }
                if (!this._workingConfig.rows || this._workingConfig.rows.length === 0) {
                    this._workingConfig.rows = [
                        {
                            sources: [
                                { type: 'static', column: 0, value: '' }
                            ]
                        }
                    ];
                }
            }

            // Initialize source for timeline layout
            if (this._workingConfig.layout === 'timeline') {
                if (!this._workingConfig.source) {
                    this._workingConfig.source = '';
                }
                if (!this._workingConfig.rows) {
                    this._workingConfig.rows = [];
                }
            }
        }

        // Ensure grid defaults
        if (!this._workingConfig.grid) {
            this._workingConfig.grid = {
                'grid-template-rows': 'repeat(8, auto)',
                'grid-template-columns': 'repeat(12, 1fr)',
                gap: '8px'
            };
        }

        // Parse CSS Grid strings to numbers for UI sliders
        this._parseGridConfigForUI();

        lcardsLog.debug('[DataGridStudioV4] Opened with config:', this._workingConfig);

        // Schedule initial preview update
        this.updateComplete.then(() => this._updatePreviewCard());
    }

    disconnectedCallback() {
        super.disconnectedCallback();
        if (this._previewUpdateTimer) {
            clearTimeout(this._previewUpdateTimer);
        }
    }

    static get styles() {
        return css`
            :host {
                display: block;
            }

            ha-dialog {
                --mdc-dialog-min-width: 90vw;
                --mdc-dialog-max-width: 1400px;
                --mdc-dialog-min-height: 80vh;
            }

            .dialog-content {
                display: flex;
                flex-direction: column;
                min-height: 70vh;
                max-height: 80vh;
                gap: 16px;
            }

            /* Main Tab Navigation */
            .main-tabs {
                display: flex;
                gap: 4px;
                margin-bottom: 12px;
                border-bottom: 2px solid var(--divider-color);
            }

            .main-tab {
                padding: 12px 24px;
                background: transparent;
                border: none;
                border-bottom: 3px solid transparent;
                color: var(--secondary-text-color);
                font-size: 14px;
                font-weight: 500;
                cursor: pointer;
                transition: all 0.2s ease;
                display: flex;
                align-items: center;
                gap: 8px;
            }

            .main-tab:hover {
                color: var(--primary-text-color);
                background: var(--secondary-background-color);
            }

            .main-tab.active {
                color: var(--primary-color);
                border-bottom-color: var(--primary-color);
                border-bottom-width: 4px;
            }

            /* Studio Layout: Config (60%) | Preview (40%) */
            .studio-layout {
                display: grid;
                grid-template-columns: 60% 40%;
                gap: 16px;
                height: 100%;
                overflow: hidden;
            }

            @media (max-width: 1024px) {
                .studio-layout {
                    grid-template-columns: 1fr;
                    grid-template-rows: 1fr auto;
                }
            }

            .config-panel {
                overflow-y: auto;
                padding-right: 8px;
            }

            .preview-panel {
                position: sticky;
                top: 0;
                height: fit-content;
                max-height: 100%;
                border: 2px solid var(--divider-color);
                border-radius: 8px;
                overflow: hidden;
                background: var(--primary-background-color);
            }

            .preview-header {
                padding: 12px;
                background: var(--secondary-background-color);
                border-bottom: 2px solid var(--divider-color);
                display: flex;
                align-items: center;
                justify-content: space-between;
            }

            .preview-title {
                font-weight: 600;
                color: var(--primary-text-color);
                flex: 1;
            }

            .preview-controls {
                display: flex;
                gap: 4px;
            }

            .preview-controls ha-icon-button {
                --mdc-icon-button-size: 32px;
                --mdc-icon-size: 20px;
            }

            .preview-mode-toggle {
                display: flex;
                gap: 4px;
                background: var(--primary-background-color);
                border-radius: 4px;
                padding: 2px;
            }

            .preview-mode-btn {
                padding: 6px 12px;
                background: transparent;
                border: none;
                border-radius: 4px;
                color: var(--secondary-text-color);
                font-size: 12px;
                cursor: pointer;
                transition: all 0.2s ease;
            }

            .preview-mode-btn:hover {
                background: var(--secondary-background-color);
            }

            .preview-mode-btn.active {
                background: var(--primary-color);
                color: white;
            }

            .preview-container {
                min-height: 400px;
                padding: 16px;
                position: relative;
            }

            /* Gridlines styling via CSS variable */
            .preview-container lcards-data-grid {
                --editor-cell-outline: var(--preview-grid-outline, none);
            }

            /* Make grid cells visible in preview */
            .preview-container lcards-data-grid {
                display: block;
                width: 100%;
                min-height: 300px;
            }

            /* Sub-tabs styling */
            .sub-tabs {
                display: flex;
                gap: 8px;
                margin-bottom: 16px;
                border-bottom: 1px solid var(--divider-color);
                padding-bottom: 8px;
            }

            .sub-tab {
                display: flex;
                align-items: center;
                gap: 6px;
                padding: 8px 16px;
                background: transparent;
                border: 1px solid transparent;
                border-radius: 4px;
                color: var(--secondary-text-color);
                font-size: 13px;
                cursor: pointer;
                transition: all 0.2s ease;
                white-space: nowrap;
            }

            .sub-tab ha-icon {
                --mdc-icon-size: 18px;
            }

            .sub-tab:hover {
                background: var(--secondary-background-color);
                border-color: var(--divider-color);
            }

            .sub-tab.active {
                background: var(--primary-color);
                color: white;
                border-color: var(--primary-color);
                font-weight: 500;
            }

            /* Mode selector cards */
            .mode-selector {
                display: grid;
                grid-template-columns: repeat(3, 1fr);
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

            /* Validation errors */
            .validation-errors {
                margin-bottom: 16px;
            }

            /* Overlay editor styles */
            .editor-overlay {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                z-index: 10000;
                display: flex;
                align-items: center;
                justify-content: center;
            }

            .overlay-backdrop {
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(0, 0, 0, 0.5);
            }

            .overlay-content {
                position: relative;
                background: var(--card-background-color);
                border-radius: 8px;
                padding: 24px;
                max-width: 500px;
                width: 90%;
                max-height: 80vh;
                overflow-y: auto;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
                z-index: 1;
            }

            .overlay-content h3 {
                margin: 0 0 16px 0;
                color: var(--primary-text-color);
            }

            .overlay-actions {
                display: flex;
                gap: 12px;
                justify-content: flex-end;
                margin-top: 24px;
            }

            @media (max-width: 768px) {
                .mode-selector {
                    grid-template-columns: 1fr;
                }
            }
        `;
    }

    render() {
        return html`
            <ha-dialog
                open
                @closed=${this._handleCancel}
                .heading=${'Data Grid Studio'}>

                <div class="dialog-content">
                    <!-- Main Tab Navigation -->
                    <div class="main-tabs">
                        <button
                            class="main-tab ${this._activeTab === 'mode' ? 'active' : ''}"
                            @click=${() => this._handleMainTabChange('mode')}>
                            <ha-icon icon="mdi:view-grid"></ha-icon>
                            Mode
                        </button>
                        <button
                            class="main-tab ${this._activeTab === 'grid-structure' ? 'active' : ''}"
                            @click=${() => this._handleMainTabChange('grid-structure')}>
                            <ha-icon icon="mdi:table-settings"></ha-icon>
                            Grid Structure
                        </button>
                        <button
                            class="main-tab ${this._activeTab === 'grid-styles' ? 'active' : ''}"
                            @click=${() => this._handleMainTabChange('grid-styles')}>
                            <ha-icon icon="mdi:palette"></ha-icon>
                            Grid Styles
                        </button>
                        <button
                            class="main-tab ${this._activeTab === 'animation' ? 'active' : ''}"
                            @click=${() => this._handleMainTabChange('animation')}>
                            <ha-icon icon="mdi:animation"></ha-icon>
                            Animation
                        </button>
                        <button
                            class="main-tab ${this._activeTab === 'advanced' ? 'active' : ''}"
                            @click=${() => this._handleMainTabChange('advanced')}>
                            <ha-icon icon="mdi:cog"></ha-icon>
                            Advanced
                        </button>
                    </div>

                    <!-- Split Layout: Config (60%) | Preview (40%) -->
                    <div class="studio-layout">
                        <div class="config-panel">
                            ${this._renderValidationErrors()}
                            ${this._renderActiveTab()}
                        </div>

                        <div class="preview-panel">
                            ${this._renderPreview()}
                        </div>
                    </div>
                </div>

                <!-- Dialog Actions -->
                <ha-button
                    slot="primaryAction"
                    variant="brand"
                    @click=${this._handleSave}>
                    <ha-icon icon="mdi:check" slot="icon"></ha-icon>
                    Save Configuration
                </ha-button>

                <ha-button
                    slot="secondaryAction"
                    @click=${this._handleCancel}>
                    Cancel
                </ha-button>
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
            case 'animation':
                return this._renderAnimationTab();
            case 'advanced':
                return this._renderAdvancedTab();
            default:
                return html`<p>Unknown tab: ${this._activeTab}</p>`;
        }
    }

    /**
     * Manual card instantiation preview - NOT Lit child rendering
     * This is the proven reliable pattern from v3
     */
    _renderPreview() {
        return html`
            <div class="preview-header">
                <span class="preview-title">Live Preview</span>
                <div class="preview-controls">
                    <ha-icon-button
                        @click=${this._toggleGridLines}
                        title="${this._showGridLines ? 'Hide' : 'Show'} grid lines">
                        <ha-icon icon="${this._showGridLines ? 'mdi:grid' : 'mdi:grid-off'}"></ha-icon>
                    </ha-icon-button>
                    <ha-icon-button
                        @click=${this._toggleAnimations}
                        title="${this._showAnimations ? 'Disable' : 'Enable'} animations">
                        <ha-icon icon="${this._showAnimations ? 'mdi:animation' : 'mdi:animation-outline'}"></ha-icon>
                    </ha-icon-button>
                </div>
            </div>

            <div
                class="preview-container"
                style="${this._showGridLines ? '--preview-grid-outline: 1px dashed rgba(var(--rgb-primary-color, 3, 169, 244), 0.3);' : '--preview-grid-outline: none;'}"
                ${ref(this._previewRef)}>
                <!-- Card will be inserted here by _updatePreviewCard() -->
            </div>
        `;
    }

    // ========================================
    // MODE TAB (Main Tab)
    // ========================================

    _renderModeTab() {
        const dataMode = this._workingConfig.data_mode || 'decorative';

        const modes = [
            {
                id: 'decorative',
                icon: 'mdi:dice-multiple',
                title: 'Decorative',
                description: 'Auto-generated random data for LCARS-style ambiance (simplest)'
            },
            {
                id: 'manual',
                icon: 'mdi:table-edit',
                title: 'Manual',
                description: 'User-defined cell values with inline editing'
            },
            {
                id: 'data-table',
                icon: 'mdi:database',
                title: 'Data Table',
                description: 'Structured data from entities/datasources'
            }
        ];

        return html`
            <lcards-form-section
                header="Data Mode"
                description="Choose how the grid gets its data"
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

    _renderDecorativeModeConfig() {
        return html`
            <lcards-form-section
                header="Decorative Mode Settings"
                description="Configure auto-generated random data"
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

    _renderManualModeConfig() {
        const rows = this._workingConfig.rows || [];
        const numColumns = this._gridColumns || 12;

        return html`
            <lcards-form-section
                header="Grid Editor"
                description="Click cells to edit content. Use static values or HA templates."
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
                            const value = Array.isArray(row) ? (row[col] || '') : '';
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
                        <ha-icon icon="mdi:table-row-plus-after" slot="icon"></ha-icon>
                        Add Row
                    </ha-button>
                    <ha-button @click=${this._addManualColumn}>
                        <ha-icon icon="mdi:table-column-plus-after" slot="icon"></ha-icon>
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

            <lcards-form-section
                header="Template Syntax Help"
                description="Common template patterns you can use in cells"
                ?expanded=${false}>

                ${this._renderTemplateSyntaxExamples()}
            </lcards-form-section>
        `;
    }

    /**
     * Render template syntax examples with copy buttons
     */
    _renderTemplateSyntaxExamples() {
        const examples = [
            {
                title: 'Static Text',
                description: 'Display fixed text',
                code: "'DECK 1'",
                explanation: 'Wrap text in single quotes for static display'
            },
            {
                title: 'Entity State',
                description: 'Display current state of an entity',
                code: "{{states('sensor.temperature')}}",
                explanation: 'Shows the current value of the sensor'
            },
            {
                title: 'Entity Attribute',
                description: 'Access specific attribute of an entity',
                code: "{{state_attr('sensor.temperature', 'unit_of_measurement')}}",
                explanation: 'Access attributes like unit, friendly_name, etc.'
            },
            {
                title: 'Conditional Display',
                description: 'Show different text based on condition',
                code: "{% if states('sensor.temperature')|float > 22 %}WARM{% else %}COOL{% endif %}",
                explanation: 'Use if/else logic to conditionally display text'
            },
            {
                title: 'Formatted Number',
                description: 'Format numeric values',
                code: "{{states('sensor.temperature')|float|round(1)}}°C",
                explanation: 'Round to 1 decimal place and add unit symbol'
            },
            {
                title: 'Time/Date Display',
                description: 'Show current time or date',
                code: "{{as_timestamp(now())|timestamp_custom('%H:%M')}}",
                explanation: 'Format: %H:%M for 24-hour, %I:%M %p for 12-hour'
            },
            {
                title: 'Multiple States Combined',
                description: 'Combine multiple entity states',
                code: "{{states('sensor.temp')}}°C / {{states('sensor.humidity')}}%",
                explanation: 'Show temperature and humidity in one cell'
            }
        ];

        return html`
            <div style="display: flex; flex-direction: column; gap: 16px;">
                ${examples.map((example, index) => html`
                    <div style="border: 1px solid var(--divider-color); border-radius: 8px; padding: 12px; background: var(--card-background-color);">
                        <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 8px;">
                            <div>
                                <div style="font-weight: 600; color: var(--primary-text-color); margin-bottom: 4px;">
                                    ${example.title}
                                </div>
                                <div style="font-size: 12px; color: var(--secondary-text-color); margin-bottom: 8px;">
                                    ${example.description}
                                </div>
                            </div>
                            <ha-icon-button
                                @click=${() => this._copyToClipboard(example.code)}
                                title="Copy to clipboard">
                                <ha-icon icon="mdi:content-copy"></ha-icon>
                            </ha-icon-button>
                        </div>
                        <div style="background: var(--primary-background-color); border-radius: 4px; padding: 10px; font-family: 'Courier New', monospace; font-size: 13px; overflow-x: auto; color: var(--primary-color); border: 1px solid var(--divider-color);">
                            ${example.code}
                        </div>
                        <div style="font-size: 11px; color: var(--secondary-text-color); margin-top: 6px; font-style: italic;">
                            ${example.explanation}
                        </div>
                    </div>
                `)}
            </div>
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

        return html`
            <lcards-form-section
                header="Grid Dimensions"
                description="Define grid size"
                ?expanded=${true}>

                <lcards-grid-layout>
                    <ha-textfield
                        type="number"
                        label="Rows"
                        .value=${this._gridRows}
                        @input=${(e) => this._handleGridRowsChange(parseInt(e.target.value) || 1)}
                        min="1"
                        max="50"
                        helper="Number of rows">
                    </ha-textfield>

                    <ha-textfield
                        type="number"
                        label="Columns"
                        .value=${this._gridColumns}
                        @input=${(e) => this._handleGridColumnsChange(parseInt(e.target.value) || 1)}
                        min="1"
                        max="50"
                        helper="Number of columns">
                    </ha-textfield>
                </lcards-grid-layout>

                <ha-textfield
                    type="number"
                    label="Gap (px)"
                    .value=${this._gridGap}
                    @input=${(e) => this._handleGridGapChange(parseInt(e.target.value) || 0)}
                    min="0"
                    max="50"
                    helper="Space between cells">
                </ha-textfield>
            </lcards-form-section>

            ${dataMode === 'decorative' ? this._renderDecorativeModeConfig() : ''}
            ${dataMode === 'manual' ? this._renderManualModeEditor() : ''}
            ${dataMode === 'data-table' ? html`
                ${this._renderDataTableModeConfig()}
                ${this._renderDataTableModeEditor()}
            ` : ''}
        `;
    }

    _renderDecorativeModeConfig() {
        return html`
            <lcards-form-section
                header="Decorative Mode Settings"
                description="Configure auto-generated random data"
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
        const numColumns = this._gridColumns || 12;

        return html`
            <lcards-form-section
                header="Grid Editor"
                description="Click cells to edit content. Use static values or HA templates."
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
                            const value = Array.isArray(row) ? (row[col] || '') : '';
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
                        <ha-icon icon="mdi:table-row-plus-after" slot="icon"></ha-icon>
                        Add Row
                    </ha-button>
                    <ha-button @click=${this._addManualColumn}>
                        <ha-icon icon="mdi:table-column-plus-after" slot="icon"></ha-icon>
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

            <lcards-form-section
                header="Template Syntax Help"
                description="Common template patterns you can use in cells"
                ?expanded=${false}>

                ${this._renderTemplateSyntaxExamples()}
            </lcards-form-section>
        `;
    }

    _renderDataTableModeEditor() {
        const layout = this._workingConfig.layout || 'spreadsheet';

        // Render different editor based on layout type
        if (layout === 'timeline') {
            return this._renderTimelineDataEditor();
        } else {
            return this._renderSpreadsheetDataEditor();
        }
    }

    _renderSpreadsheetDataEditor() {
        const rows = this._workingConfig.rows || [];
        const numColumns = this._gridColumns || 12;

        return html`
            <lcards-form-section
                header="Spreadsheet Data Editor"
                description="Configure entity mappings per cell (column-based layout)"
                ?expanded=${true}>

                <lcards-message type="info">
                    <strong>Spreadsheet Mode:</strong> Each cell can display data from entities/datasources.
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
                            const value = Array.isArray(row) ? (row[col] || '') : '';
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
                        <ha-icon icon="mdi:table-row-plus-after" slot="icon"></ha-icon>
                        Add Row
                    </ha-button>
                    <ha-button @click=${this._addManualColumn}>
                        <ha-icon icon="mdi:table-column-plus-after" slot="icon"></ha-icon>
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

            <lcards-form-section
                header="Template Syntax Help"
                description="Common template patterns for entity data"
                ?expanded=${false}>

                ${this._renderTemplateSyntaxExamples()}
            </lcards-form-section>
        `;
    }

    _renderTimelineDataEditor() {
        const rows = this._workingConfig.rows || [];

        return html`
            <lcards-form-section
                header="Timeline Data Editor"
                description="Configure datasources for historical timeline display"
                ?expanded=${true}>

                <lcards-message type="info">
                    <strong>Timeline Mode:</strong> Each row displays one entity/datasource with historical values.
                    Configure datasources below - columns will auto-populate with historical data.
                </lcards-message>

                ${rows.length > 0 ? html`
                    <div style="display: flex; flex-direction: column; gap: 8px; margin-top: 16px;">
                        ${rows.map((row, index) => {
                            const entityId = typeof row === 'object' ? row.entity_id : (Array.isArray(row) ? row[0] : '');
                            const label = typeof row === 'object' ? row.label : `Row ${index + 1}`;
                            return html`
                                <div style="display: flex; align-items: center; gap: 8px; padding: 12px; background: var(--card-background-color); border: 1px solid var(--divider-color); border-radius: 4px;">
                                    <div style="flex: 1;">
                                        <div style="font-weight: 500; margin-bottom: 4px;">${label || `Row ${index + 1}`}</div>
                                        <div style="font-size: 12px; color: var(--secondary-text-color);">${entityId || 'No entity selected'}</div>
                                    </div>
                                    <ha-icon-button
                                        @click=${() => this._editTimelineRow(index)}
                                        title="Edit row datasource">
                                        <ha-icon icon="mdi:pencil"></ha-icon>
                                    </ha-icon-button>
                                    <ha-icon-button
                                        @click=${() => this._deleteTimelineRow(index)}
                                        title="Delete row">
                                        <ha-icon icon="mdi:delete"></ha-icon>
                                    </ha-icon-button>
                                </div>
                            `;
                        })}
                    </div>
                ` : html`
                    <lcards-message type="warning" style="margin-top: 16px;">
                        No timeline rows configured. Click "Add Row" to add datasources for historical display.
                    </lcards-message>
                `}

                <ha-button @click=${this._addTimelineRow} style="margin-top: 16px;">
                    <ha-icon icon="mdi:table-row-plus-after" slot="icon"></ha-icon>
                    Add Timeline Row
                </ha-button>

                ${this._activeTimelineRowEdit !== null ? this._renderTimelineRowEditor() : ''}
            </lcards-form-section>
        `;
    }

    _renderTimelineRowEditor() {
        const rowIndex = this._activeTimelineRowEdit;
        const row = this._workingConfig.rows[rowIndex] || {};
        const entityId = typeof row === 'object' ? row.entity_id : (Array.isArray(row) ? row[0] : '');
        const label = typeof row === 'object' ? row.label : '';

        return html`
            <lcards-form-section
                header="Edit Timeline Row ${rowIndex + 1}"
                description="Configure datasource for this timeline row"
                ?expanded=${true}>

                <ha-textfield
                    label="Row Label"
                    .value=${label}
                    @input=${(e) => this._updateTimelineRowLabel(rowIndex, e.target.value)}
                    helper="Display name for this row"
                    style="margin-bottom: 8px;">
                </ha-textfield>

                <ha-entity-picker
                    .hass=${this.hass}
                    .value=${entityId}
                    @value-changed=${(e) => this._updateTimelineRowEntity(rowIndex, e.detail.value)}
                    label="Entity / Datasource"
                    allow-custom-entity>
                </ha-entity-picker>

                <div style="display: flex; gap: 8px; margin-top: 16px;">
                    <ha-button @click=${() => this._closeTimelineRowEditor()}>
                        <ha-icon icon="mdi:close" slot="icon"></ha-icon>
                        Close
                    </ha-button>
                </div>
            </lcards-form-section>
        `;
    }

    _renderDataTableModeConfig() {
        const layout = this._workingConfig.layout || 'spreadsheet';

        return html`
            <lcards-form-section
                header="Data Table Mode Settings"
                description="Configure datasource-based grid"
                ?expanded=${true}>

                <ha-selector
                    .hass=${this.hass}
                    .selector=${{select: {mode: 'dropdown', options: [
                        { value: 'spreadsheet', label: 'Spreadsheet (Column-based)' },
                        { value: 'timeline', label: 'Timeline (Historical)' }
                    ]}}}
                    .label=${'Layout Type'}
                    .value=${layout}
                    @value-changed=${(e) => this._handleLayoutChange(e.detail.value)}
                    @closed=${(e) => e.stopPropagation()}>
                </ha-selector>

                <lcards-message type="info">
                    ${layout === 'timeline'
                        ? 'Timeline mode: Each row displays one datasource/entity with historical values over time'
                        : 'Spreadsheet mode: Standard column-based layout with headers and entity mappings'}
                </lcards-message>

                ${layout === 'timeline' ? this._renderTimelineConfig() : ''}
            </lcards-form-section>
        `;
    }

    _renderTimelineConfig() {
        return html`
            <div style="margin-top: 16px; padding-top: 16px; border-top: 1px solid var(--divider-color);">
                <div style="font-weight: 500; margin-bottom: 8px;">Timeline Settings</div>

                <ha-textfield
                    type="number"
                    label="History Hours"
                    .value=${this._workingConfig.history_hours || 24}
                    @input=${(e) => this._updateConfig('history_hours', parseInt(e.target.value) || 24)}
                    helper="Number of hours of history to display"
                    min="1"
                    max="168"
                    style="margin-bottom: 8px;">
                </ha-textfield>

                <ha-textfield
                    type="number"
                    label="Data Points"
                    .value=${this._workingConfig.data_points || 12}
                    @input=${(e) => this._updateConfig('data_points', parseInt(e.target.value) || 12)}
                    helper="Number of columns (data points) to display"
                    min="3"
                    max="50"
                    style="margin-bottom: 8px;">
                </ha-textfield>

                <ha-selector
                    .hass=${this.hass}
                    .selector=${{select: {mode: 'dropdown', options: [
                        { value: 'avg', label: 'Average' },
                        { value: 'min', label: 'Minimum' },
                        { value: 'max', label: 'Maximum' },
                        { value: 'last', label: 'Last Value' }
                    ]}}}
                    .label=${'Aggregation Method'}
                    .value=${this._workingConfig.aggregation || 'avg'}
                    @value-changed=${(e) => this._updateConfig('aggregation', e.detail.value)}
                    @closed=${(e) => e.stopPropagation()}>
                </ha-selector>

                <lcards-message type="info" style="margin-top: 8px;">
                    Timeline mode will automatically fetch historical data from configured datasources.
                    Each row represents one entity's historical values across the specified time period.
                </lcards-message>
            </div>
        `;
    }

    // ========================================
    // GRID STYLES TAB (Main Tab - merged Configuration + Styling)
    // ========================================

    _renderGridStylesTab() {
        const subTabs = [
            { id: 'hierarchy', label: 'Style Hierarchy', icon: 'mdi:file-tree' },
            { id: 'table', label: 'Table Level', icon: 'mdi:table' },
            { id: 'row-column', label: 'Row/Column', icon: 'mdi:table-row' },
            { id: 'cell', label: 'Cell Level', icon: 'mdi:square' }
        ];

        return html`
            <div class="sub-tabs">
                ${subTabs.map(tab => html`
                    <div
                        class="sub-tab ${this._gridStylesSubTab === tab.id ? 'active' : ''}"
                        @click=${() => { this._gridStylesSubTab = tab.id; this.requestUpdate(); }}>
                        <ha-icon icon="${tab.icon}"></ha-icon>
                        <span>${tab.label}</span>
                    </div>
                `)}
            </div>

            ${this._gridStylesSubTab === 'hierarchy' ? this._renderStyleHierarchySubTab() : ''}
            ${this._gridStylesSubTab === 'table' ? this._renderTableLevelStylesSubTab() : ''}
            ${this._gridStylesSubTab === 'row-column' ? this._renderRowColumnStylesSubTab() : ''}
            ${this._gridStylesSubTab === 'cell' ? this._renderCellLevelStylesSubTab() : ''}
        `;
    }

    _renderStyleHierarchySubTab() {
        // Determine mode for hierarchy diagram
        let hierarchyMode = 'all';
        if (this._workingConfig.data_mode === 'manual') {
            hierarchyMode = 'manual';
        } else if (this._workingConfig.data_mode === 'data-table') {
            hierarchyMode = 'data-table';
        }

        return html`
            <lcards-form-section
                header="Style Hierarchy"
                description="Understanding style precedence"
                ?expanded=${true}>

                <lcards-style-hierarchy-diagram
                    .mode=${hierarchyMode}>
                </lcards-style-hierarchy-diagram>
            </lcards-form-section>
        `;
    }

    _renderTableLevelStylesSubTab() {
        const isDataTableMode = this._workingConfig.data_mode === 'data-table';
        const layoutType = this._workingConfig.layout || 'spreadsheet';
        const showHeaderStyles = isDataTableMode && layoutType === 'spreadsheet';

        return html`

            <lcards-form-section
                header="Typography"
                description="Font settings for all cells"
                ?expanded=${true}>

                <lcards-font-selector
                    .hass=${this.hass}
                    .value=${this._workingConfig.style?.font_family || ''}
                    .showPreview=${true}
                    .label=${'Font Family'}
                    @value-changed=${(e) => this._updateConfig('style.font_family', e.detail.value)}>
                </lcards-font-selector>

                <lcards-grid-layout>
                    <ha-textfield
                        type="text"
                        label="Font Size"
                        .value=${this._workingConfig.style?.font_size || ''}
                        @input=${(e) => this._updateConfig('style.font_size', e.target.value)}
                        helper="e.g., '18px', '1.2rem'">
                    </ha-textfield>

                    <ha-textfield
                        type="number"
                        label="Font Weight"
                        .value=${this._workingConfig.style?.font_weight || ''}
                        @input=${(e) => this._updateConfig('style.font_weight', e.target.value)}
                        helper="100-900">
                    </ha-textfield>
                </lcards-grid-layout>
            </lcards-form-section>

            <lcards-color-section
                .editor=${this}
                header="Colors"
                description="Default colors for all cells"
                .colorPaths=${[
                    { path: 'style.color', label: 'Text Color', helper: 'Cell text color' },
                    { path: 'style.background', label: 'Background Color', helper: 'Cell background' }
                ]}
                ?expanded=${true}
                ?useColorPicker=${true}>
            </lcards-color-section>

            ${showHeaderStyles ? html`
                <lcards-form-section
                    header="Header Style"
                    description="Column header specific styling (Data Table mode only)"
                    ?expanded=${true}>

                    <lcards-message type="info">
                        These styles apply only to column headers in Data Table mode.
                    </lcards-message>

                    <lcards-grid-layout>
                        <ha-textfield
                            label="Font Size"
                            .value=${this._workingConfig.header_style?.font_size || ''}
                            @input=${(e) => this._updateConfig('header_style.font_size', e.target.value)}
                            helper="e.g., '18px', '1.2rem'">
                        </ha-textfield>

                        <ha-textfield
                            type="number"
                            label="Font Weight"
                            .value=${this._workingConfig.header_style?.font_weight || ''}
                            @input=${(e) => this._updateConfig('header_style.font_weight', e.target.value)}
                            helper="100-900">
                        </ha-textfield>
                    </lcards-grid-layout>

                    <ha-selector
                        .hass=${this.hass}
                        .selector=${{select: {mode: 'dropdown', options: [
                            { value: 'none', label: 'None' },
                            { value: 'uppercase', label: 'UPPERCASE' },
                            { value: 'lowercase', label: 'lowercase' },
                            { value: 'capitalize', label: 'Capitalize Each Word' }
                        ]}}}
                        .label=${'Text Transform'}
                        .value=${this._workingConfig.header_style?.text_transform || 'none'}
                        @value-changed=${(e) => this._updateConfig('header_style.text_transform', e.detail.value)}
                        @closed=${(e) => e.stopPropagation()}>
                    </ha-selector>

                    <lcards-color-section
                        .editor=${this}
                        header="Header Colors"
                        description="Colors specific to column headers"
                        .colorPaths=${[
                            { path: 'header_style.color', label: 'Header Text Color', helper: 'Column header text' },
                            { path: 'header_style.background', label: 'Header Background', helper: 'Column header background' }
                        ]}
                        ?expanded=${false}
                        ?useColorPicker=${true}>
                    </lcards-color-section>

                    <div style="margin-top: 12px; padding-top: 12px; border-top: 1px solid var(--divider-color);">
                        <div style="font-weight: 500; margin-bottom: 8px;">Header Border Bottom</div>
                        <lcards-grid-layout>
                            <ha-textfield
                                type="number"
                                label="Width (px)"
                                .value=${this._workingConfig.header_style?.border_bottom_width || 0}
                                @input=${(e) => this._updateConfig('header_style.border_bottom_width', parseInt(e.target.value) || 0)}
                                min="0"
                                max="10"
                                helper="Border below headers">
                            </ha-textfield>

                            <ha-textfield
                                label="Color"
                                .value=${this._workingConfig.header_style?.border_bottom_color || ''}
                                @input=${(e) => this._updateConfig('header_style.border_bottom_color', e.target.value)}
                                helper="Border color">
                            </ha-textfield>
                        </lcards-grid-layout>

                        <ha-selector
                            .hass=${this.hass}
                            .selector=${{select: {mode: 'dropdown', options: [
                                { value: 'solid', label: 'Solid' },
                                { value: 'dashed', label: 'Dashed' },
                                { value: 'dotted', label: 'Dotted' },
                                { value: 'double', label: 'Double' }
                            ]}}}
                            .label=${'Border Style'}
                            .value=${this._workingConfig.header_style?.border_bottom_style || 'solid'}
                            @value-changed=${(e) => this._updateConfig('header_style.border_bottom_style', e.detail.value)}
                            @closed=${(e) => e.stopPropagation()}>
                        </ha-selector>
                    </div>
                </lcards-form-section>
            ` : ''}

            <lcards-form-section
                header="Border Settings"
                description="Cell border configuration"
                ?expanded=${true}>

                <lcards-grid-layout>
                    <ha-textfield
                        type="number"
                        label="Border Width"
                        .value=${this._workingConfig.style?.border_width || 0}
                        @input=${(e) => this._updateConfig('style.border_width', parseInt(e.target.value) || 0)}
                        helper="Border width in pixels">
                    </ha-textfield>

                    <ha-textfield
                        label="Border Color"
                        .value=${this._workingConfig.style?.border_color || ''}
                        @input=${(e) => this._updateConfig('style.border_color', e.target.value)}
                        helper="Border color">
                    </ha-textfield>
                </lcards-grid-layout>

                <ha-selector
                    .hass=${this.hass}
                    .selector=${{select: {mode: 'dropdown', options: [
                        { value: 'solid', label: 'Solid' },
                        { value: 'dashed', label: 'Dashed' },
                        { value: 'dotted', label: 'Dotted' },
                        { value: 'double', label: 'Double' }
                    ]}}}
                    .label=${'Border Style'}
                    .value=${this._workingConfig.style?.border_style || 'solid'}
                    @value-changed=${(e) => this._updateConfig('style.border_style', e.detail.value)}
                    @closed=${(e) => e.stopPropagation()}>
                </ha-selector>
            </lcards-form-section>
        `;
    }

    _renderRowColumnStylesSubTab() {
        return html`
            <lcards-message type="info">
                Row and column specific styling can be configured directly in the Grid Structure tab
                by clicking on row/column headers in the editable grid.
            </lcards-message>

            <lcards-form-section
                header="Row-Level Overrides"
                description="These styles apply to entire rows"
                ?expanded=${false}>
                <lcards-message type="info">
                    Use the inline row editor in Grid Structure tab to configure row-specific styles.
                    Click a row number in the editable grid to access row styling options.
                </lcards-message>
            </lcards-form-section>

            <lcards-form-section
                header="Column-Level Overrides"
                description="These styles apply to entire columns"
                ?expanded=${false}>
                <lcards-message type="info">
                    Use the inline column editor in Grid Structure tab to configure column-specific styles.
                    Click a column header in the editable grid to access column styling options.
                </lcards-message>
            </lcards-form-section>
        `;
    }

    _renderCellLevelStylesSubTab() {
        return html`
            <lcards-message type="info">
                Cell-specific styling can be configured directly in the Grid Structure tab
                by clicking on individual cells in the editable grid.
            </lcards-message>

            <lcards-form-section
                header="Cell-Level Overrides"
                description="These styles have the highest priority"
                ?expanded=${true}>
                <lcards-message type="info">
                    Use the inline cell editor in Grid Structure tab to configure cell-specific styles.
                    Click any cell in the editable grid to access cell styling options.
                    Cell styles will override all table, row, and column styles.
                </lcards-message>
            </lcards-form-section>
        `;
    }

    // ========================================
    // ANIMATION TAB (Main Tab - promoted from Advanced)
    // ========================================

    _renderAnimationTab() {
        return html`
            <lcards-form-section
                header="Cascade Animation"
                description="Background color cycling effect"
                ?expanded=${true}>

                <ha-selector
                    .hass=${this.hass}
                    .selector=${{select: {mode: 'dropdown', options: [
                        { value: 'none', label: 'None' },
                        { value: 'cascade', label: 'Cascade' }
                    ]}}}
                    .label=${'Animation Type'}
                    .value=${this._workingConfig.animation?.type || 'none'}
                    @value-changed=${(e) => this._updateConfig('animation.type', e.detail.value)}
                    @closed=${(e) => e.stopPropagation()}>
                </ha-selector>

                ${this._workingConfig.animation?.type === 'cascade' ? html`
                    <ha-selector
                        .hass=${this.hass}
                        .selector=${{select: {mode: 'dropdown', options: [
                            { value: 'default', label: 'Default' },
                            { value: 'niagara', label: 'Niagara' },
                            { value: 'fast', label: 'Fast' },
                            { value: 'frozen', label: 'Frozen' }
                        ]}}}
                        .label=${'Pattern'}
                        .value=${this._workingConfig.animation?.pattern || 'default'}
                        @value-changed=${(e) => this._updateConfig('animation.pattern', e.detail.value)}
                        @closed=${(e) => e.stopPropagation()}>
                    </ha-selector>

                    <ha-textfield
                        type="number"
                        label="Speed Multiplier"
                        .value=${this._workingConfig.animation?.speed_multiplier || 1.0}
                        @input=${(e) => this._updateConfig('animation.speed_multiplier', parseFloat(e.target.value) || 1.0)}
                        step="0.1"
                        min="0.1"
                        max="10"
                        helper="Speed multiplier (1.0 = normal)">
                    </ha-textfield>

                    <lcards-color-section
                        .editor=${this}
                        header="Cascade Colors"
                        description="3-color cycle for cascade effect"
                        .colorPaths=${[
                            {
                                path: 'animation.colors.start',
                                label: 'Start Color',
                                helper: 'Starting color (75% dwell)'
                            },
                            {
                                path: 'animation.colors.text',
                                label: 'Middle Color',
                                helper: 'Middle color (10% snap)'
                            },
                            {
                                path: 'animation.colors.end',
                                label: 'End Color',
                                helper: 'Ending color (10% brief)'
                            }
                        ]}
                        ?expanded=${true}
                        ?useColorPicker=${true}>
                    </lcards-color-section>
                ` : ''}
            </lcards-form-section>

            <lcards-form-section
                header="Change Detection"
                description="Highlight cells on data changes"
                ?expanded=${true}>

                <ha-selector
                    .hass=${this.hass}
                    .selector=${{select: {mode: 'dropdown', options: [
                        { value: 'none', label: 'None' },
                        { value: 'pulse', label: 'Pulse' },
                        { value: 'glow', label: 'Glow' },
                        { value: 'flash', label: 'Flash' }
                    ]}}}
                    .label=${'Change Animation'}
                    .value=${this._workingConfig.change_animation?.preset || 'none'}
                    @value-changed=${(e) => this._updateConfig('change_animation.preset', e.detail.value)}
                    @closed=${(e) => e.stopPropagation()}>
                </ha-selector>

                ${this._workingConfig.change_animation?.preset !== 'none' ? html`
                    <ha-selector
                        .hass=${this.hass}
                        .selector=${{select: {mode: 'dropdown', options: [
                            { value: 'cell', label: 'Cell' },
                            { value: 'row', label: 'Row' },
                            { value: 'column', label: 'Column' }
                        ]}}}
                        .label=${'Target Mode'}
                        .value=${this._workingConfig.change_animation?.target_mode || 'cell'}
                        @value-changed=${(e) => this._updateConfig('change_animation.target_mode', e.detail.value)}
                        @closed=${(e) => e.stopPropagation()}>
                    </ha-selector>
                ` : ''}
            </lcards-form-section>
        `;
    }

    _renderDataTableModeConfig() {
        const layout = this._workingConfig.layout || 'spreadsheet';

        return html`
            <lcards-form-section
                header="Data Table Mode Settings"
                description="Configure datasource-based grid"
                ?expanded=${true}>

                <ha-selector
                    .hass=${this.hass}
                    .selector=${{select: {mode: 'dropdown', options: [
                        { value: 'spreadsheet', label: 'Spreadsheet (Standard Column-based)' },
                        { value: 'timeline', label: 'Timeline (Historical Data)' }
                    ]}}}
                    .label=${'Layout Type'}
                    .value=${layout}
                    @value-changed=${(e) => this._handleLayoutChange(e.detail.value)}
                    @closed=${(e) => e.stopPropagation()}>
                </ha-selector>

                <lcards-message type="info">
                    ${layout === 'timeline'
                        ? 'Timeline mode: Each row displays a datasource/entity with historical values across time'
                        : 'Spreadsheet mode: Standard column-based layout with headers'}
                </lcards-message>
            </lcards-form-section>

            ${layout === 'spreadsheet' ? this._renderSpreadsheetModeEditor() : this._renderTimelineModeEditor()}
        `;
    }

    /**
     * Render spreadsheet mode editor (column-based layout)
     */
    _renderSpreadsheetModeEditor() {
        const columns = this._workingConfig.columns || [];
        const rows = this._workingConfig.rows || [];

        return html`
            <lcards-form-section
                header="Columns"
                description="Define column structure"
                ?expanded=${true}>

                <lcards-message type="info">
                    Click column headers in preview (WYSIWYG mode) to edit columns, or manage them here.
                </lcards-message>

                ${columns.length > 0 ? html`
                    <div style="display: flex; flex-direction: column; gap: 8px; margin-top: 12px;">
                        ${columns.map((col, index) => html`
                            <div style="display: flex; align-items: center; gap: 8px; padding: 8px; background: var(--card-background-color); border: 1px solid var(--divider-color); border-radius: 4px;">
                                <span style="flex: 1; font-weight: 500;">${col.header || `Column ${index + 1}`}</span>
                                <span style="color: var(--secondary-text-color); font-size: 12px;">${col.width || 'auto'}</span>
                                <ha-icon-button
                                    @click=${() => this._editColumn(index)}
                                    title="Edit column">
                                    <ha-icon icon="mdi:pencil"></ha-icon>
                                </ha-icon-button>
                                <ha-icon-button
                                    @click=${() => this._deleteColumn(index)}
                                    title="Delete column">
                                    <ha-icon icon="mdi:delete"></ha-icon>
                                </ha-icon-button>
                            </div>
                        `)}
                    </div>
                ` : html`
                    <lcards-message type="warning">
                        No columns defined. Click "Add Column" to start.
                    </lcards-message>
                `}

                <ha-button @click=${this._addColumn} style="margin-top: 12px;">
                    <ha-icon icon="mdi:plus" slot="icon"></ha-icon>
                    Add Column
                </ha-button>
            </lcards-form-section>

            <lcards-form-section
                header="Rows"
                description="Define row data"
                ?expanded=${true}>

                <lcards-message type="info">
                    Each row contains cells for all defined columns. Click cells in preview to edit.
                </lcards-message>

                ${rows.length > 0 ? html`
                    <div style="display: flex; flex-direction: column; gap: 8px; margin-top: 12px;">
                        ${rows.map((row, index) => html`
                            <div style="display: flex; align-items: center; gap: 8px; padding: 8px; background: var(--card-background-color); border: 1px solid var(--divider-color); border-radius: 4px;">
                                <span style="flex: 1; font-weight: 500;">Row ${index + 1}</span>
                                <span style="color: var(--secondary-text-color); font-size: 12px;">
                                    ${row.sources?.length || 0} cells
                                </span>
                                <ha-icon-button
                                    @click=${() => this._editRow(index)}
                                    title="Edit row">
                                    <ha-icon icon="mdi:pencil"></ha-icon>
                                </ha-icon-button>
                                <ha-icon-button
                                    @click=${() => this._deleteRow(index)}
                                    title="Delete row">
                                    <ha-icon icon="mdi:delete"></ha-icon>
                                </ha-icon-button>
                            </div>
                        `)}
                    </div>
                ` : html`
                    <lcards-message type="warning">
                        No rows defined. Click "Add Row" to start.
                    </lcards-message>
                `}

                <ha-button @click=${this._addRow} style="margin-top: 12px;">
                    <ha-icon icon="mdi:plus" slot="icon"></ha-icon>
                    Add Row
                </ha-button>
            </lcards-form-section>
        `;
    }

    /**
     * Render row-timeline layout configuration
     */
    _renderRowTimelineConfig() {
        const rows = this._workingConfig.rows || [];

        return html`
            <lcards-form-section
                header="Timeline Rows"
                description="Each row displays historical data from an entity/datasource"
                ?expanded=${true}>

                <lcards-message type="info">
                    Rows automatically populate with historical values (newest → oldest, left to right).
                </lcards-message>

                ${rows.length > 0 ? html`
                    <div style="display: flex; flex-direction: column; gap: 8px; margin-top: 12px;">
                        ${rows.map((row, index) => html`
                            <div style="display: flex; align-items: center; gap: 8px; padding: 8px; background: var(--card-background-color); border: 1px solid var(--divider-color); border-radius: 4px;">
                                <ha-icon icon="mdi:chart-timeline-variant" style="color: var(--primary-color);"></ha-icon>
                                <div style="flex: 1;">
                                    <div style="font-weight: 500;">${row.label || row.source || `Row ${index + 1}`}</div>
                                    <div style="font-size: 12px; color: var(--secondary-text-color);">
                                        ${row.source || 'No source'} • ${row.history_hours || 2}h history
                                    </div>
                                </div>
                                <ha-icon-button
                                    @click=${() => this._editTimelineRow(index)}
                                    title="Edit row">
                                    <ha-icon icon="mdi:pencil"></ha-icon>
                                </ha-icon-button>
                                <ha-icon-button
                                    @click=${() => this._moveRow(index, 'up')}
                                    ?disabled=${index === 0}
                                    title="Move up">
                                    <ha-icon icon="mdi:arrow-up"></ha-icon>
                                </ha-icon-button>
                                <ha-icon-button
                                    @click=${() => this._moveRow(index, 'down')}
                                    ?disabled=${index === rows.length - 1}
                                    title="Move down">
                                    <ha-icon icon="mdi:arrow-down"></ha-icon>
                                </ha-icon-button>
                                <ha-icon-button
                                    @click=${() => this._deleteRow(index)}
                                    title="Delete row">
                                    <ha-icon icon="mdi:delete"></ha-icon>
                                </ha-icon-button>
                            </div>
                        `)}
                    </div>
                ` : html`
                    <lcards-message type="warning">
                        No timeline rows defined. Click "Add Timeline Row" to start.
                    </lcards-message>
                `}

                <ha-button @click=${this._addTimelineRow} style="margin-top: 12px;">
                    <ha-icon icon="mdi:plus" slot="icon"></ha-icon>
                    Add Timeline Row
                </ha-button>
            </lcards-form-section>
        `;
    }

    _renderGridStructureSubTab() {
        return html`
            <lcards-form-section
                header="Grid Dimensions"
                description="Define grid size"
                ?expanded=${true}>

                <lcards-grid-layout>
                    <ha-textfield
                        type="number"
                        label="Rows"
                        .value=${this._gridRows}
                        @input=${(e) => this._handleGridRowsChange(parseInt(e.target.value) || 1)}
                        min="1"
                        max="50"
                        helper="Number of rows">
                    </ha-textfield>

                    <ha-textfield
                        type="number"
                        label="Columns"
                        .value=${this._gridColumns}
                        @input=${(e) => this._handleGridColumnsChange(parseInt(e.target.value) || 1)}
                        min="1"
                        max="50"
                        helper="Number of columns">
                    </ha-textfield>
                </lcards-grid-layout>

                <ha-textfield
                    type="number"
                    label="Gap (px)"
                    .value=${this._gridGap}
                    @input=${(e) => this._handleGridGapChange(parseInt(e.target.value) || 0)}
                    min="0"
                    max="50"
                    helper="Space between cells">
                </ha-textfield>
            </lcards-form-section>
        `;
    }

    _renderConfigurationSubTab() {
        return html`
            <lcards-form-section
                header="Typography"
                description="Font settings for all cells"
                ?expanded=${true}>

                <lcards-font-selector
                    .hass=${this.hass}
                    .value=${this._workingConfig.style?.font_family || ''}
                    .showPreview=${true}
                    .label=${'Font Family'}
                    @value-changed=${(e) => this._updateConfig('style.font_family', e.detail.value)}>
                </lcards-font-selector>

                <lcards-grid-layout>
                    <ha-textfield
                        type="text"
                        label="Font Size"
                        .value=${this._workingConfig.style?.font_size || ''}
                        @input=${(e) => this._updateConfig('style.font_size', e.target.value)}
                        helper="e.g., '18px', '1.2rem'">
                    </ha-textfield>

                    <ha-textfield
                        type="number"
                        label="Font Weight"
                        .value=${this._workingConfig.style?.font_weight || ''}
                        @input=${(e) => this._updateConfig('style.font_weight', e.target.value)}
                        helper="100-900">
                    </ha-textfield>
                </lcards-grid-layout>
            </lcards-form-section>

            <lcards-color-section
                .editor=${this}
                header="Colors"
                description="Default colors for all cells"
                .colorPaths=${[
                    { path: 'style.color', label: 'Text Color', helper: 'Cell text color' },
                    { path: 'style.background', label: 'Background Color', helper: 'Cell background' }
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
        return this._renderCssGridSubTab();
    }

    // Old subtabs removed - Grid Styles is now a main tab, Animation is now a main tab

    _renderCssGridSubTab() {
        return html`
            <lcards-form-section
                header="CSS Grid Expert Mode"
                description="Advanced CSS Grid properties"
                ?expanded=${true}>

                <lcards-style-hierarchy-diagram
                    .mode=${hierarchyMode}>
                </lcards-style-hierarchy-diagram>
            </lcards-form-section>

            ${showHeaderStyles ? html`
                <lcards-form-section
                    header="Header Style"
                    description="Column header specific styling (Data Table mode only)"
                    ?expanded=${true}>

                    <lcards-message type="info">
                        These styles apply only to column headers in Data Table mode.
                    </lcards-message>

                    <lcards-grid-layout>
                        <ha-textfield
                            label="Font Size"
                            .value=${this._workingConfig.header_style?.font_size || ''}
                            @input=${(e) => this._updateConfig('header_style.font_size', e.target.value)}
                            helper="e.g., '18px', '1.2rem'">
                        </ha-textfield>

                        <ha-textfield
                            type="number"
                            label="Font Weight"
                            .value=${this._workingConfig.header_style?.font_weight || ''}
                            @input=${(e) => this._updateConfig('header_style.font_weight', e.target.value)}
                            helper="100-900">
                        </ha-textfield>
                    </lcards-grid-layout>

                    <ha-selector
                        .hass=${this.hass}
                        .selector=${{select: {mode: 'dropdown', options: [
                            { value: 'none', label: 'None' },
                            { value: 'uppercase', label: 'UPPERCASE' },
                            { value: 'lowercase', label: 'lowercase' },
                            { value: 'capitalize', label: 'Capitalize Each Word' }
                        ]}}}
                        .label=${'Text Transform'}
                        .value=${this._workingConfig.header_style?.text_transform || 'none'}
                        @value-changed=${(e) => this._updateConfig('header_style.text_transform', e.detail.value)}
                        @closed=${(e) => e.stopPropagation()}>
                    </ha-selector>

                    <lcards-color-section
                        .editor=${this}
                        header="Header Colors"
                        description="Colors specific to column headers"
                        .colorPaths=${[
                            { path: 'header_style.color', label: 'Header Text Color', helper: 'Column header text' },
                            { path: 'header_style.background', label: 'Header Background', helper: 'Column header background' }
                        ]}
                        ?expanded=${false}
                        ?useColorPicker=${true}>
                    </lcards-color-section>

                    <div style="margin-top: 12px; padding-top: 12px; border-top: 1px solid var(--divider-color);">
                        <div style="font-weight: 500; margin-bottom: 8px;">Header Border Bottom</div>
                        <lcards-grid-layout>
                            <ha-textfield
                                type="number"
                                label="Width (px)"
                                .value=${this._workingConfig.header_style?.border_bottom_width || 0}
                                @input=${(e) => this._updateConfig('header_style.border_bottom_width', parseInt(e.target.value) || 0)}
                                min="0"
                                max="10"
                                helper="Border below headers">
                            </ha-textfield>

                            <ha-textfield
                                label="Color"
                                .value=${this._workingConfig.header_style?.border_bottom_color || ''}
                                @input=${(e) => this._updateConfig('header_style.border_bottom_color', e.target.value)}
                                helper="Border color">
                            </ha-textfield>
                        </lcards-grid-layout>

                        <ha-selector
                            .hass=${this.hass}
                            .selector=${{select: {mode: 'dropdown', options: [
                                { value: 'solid', label: 'Solid' },
                                { value: 'dashed', label: 'Dashed' },
                                { value: 'dotted', label: 'Dotted' },
                                { value: 'double', label: 'Double' }
                            ]}}}
                            .label=${'Border Style'}
                            .value=${this._workingConfig.header_style?.border_bottom_style || 'solid'}
                            @value-changed=${(e) => this._updateConfig('header_style.border_bottom_style', e.detail.value)}
                            @closed=${(e) => e.stopPropagation()}>
                        </ha-selector>
                    </div>
                </lcards-form-section>
            ` : ''}

            <lcards-form-section
                header="Border Settings"
                description="Cell border configuration"
                ?expanded=${true}>

                <lcards-grid-layout>
                    <ha-textfield
                        type="number"
                        label="Border Width"
                        .value=${this._workingConfig.style?.border_width || 0}
                        @input=${(e) => this._updateConfig('style.border_width', parseInt(e.target.value) || 0)}
                        helper="Border width in pixels">
                    </ha-textfield>

                    <ha-textfield
                        label="Border Color"
                        .value=${this._workingConfig.style?.border_color || ''}
                        @input=${(e) => this._updateConfig('style.border_color', e.target.value)}
                        helper="Border color">
                    </ha-textfield>
                </lcards-grid-layout>

                <ha-selector
                    .hass=${this.hass}
                    .selector=${{select: {mode: 'dropdown', options: [
                        { value: 'solid', label: 'Solid' },
                        { value: 'dashed', label: 'Dashed' },
                        { value: 'dotted', label: 'Dotted' },
                        { value: 'double', label: 'Double' }
                    ]}}}
                    .label=${'Border Style'}
                    .value=${this._workingConfig.style?.border_style || 'solid'}
                    @value-changed=${(e) => this._updateConfig('style.border_style', e.detail.value)}
                    @closed=${(e) => e.stopPropagation()}>
                </ha-selector>
            </lcards-form-section>
        `;
    }

    _renderAnimationSubTab() {
        return html`
            <lcards-form-section
                header="Cascade Animation"
                description="Background color cycling effect"
                ?expanded=${true}>

                <ha-selector
                    .hass=${this.hass}
                    .selector=${{select: {mode: 'dropdown', options: [
                        { value: 'none', label: 'None' },
                        { value: 'cascade', label: 'Cascade' }
                    ]}}}
                    .label=${'Animation Type'}
                    .value=${this._workingConfig.animation?.type || 'none'}
                    @value-changed=${(e) => this._updateConfig('animation.type', e.detail.value)}
                    @closed=${(e) => e.stopPropagation()}>
                </ha-selector>

                ${this._workingConfig.animation?.type === 'cascade' ? html`
                    <ha-selector
                        .hass=${this.hass}
                        .selector=${{select: {mode: 'dropdown', options: [
                            { value: 'default', label: 'Default' },
                            { value: 'niagara', label: 'Niagara' },
                            { value: 'fast', label: 'Fast' },
                            { value: 'frozen', label: 'Frozen' }
                        ]}}}
                        .label=${'Pattern'}
                        .value=${this._workingConfig.animation?.pattern || 'default'}
                        @value-changed=${(e) => this._updateConfig('animation.pattern', e.detail.value)}
                        @closed=${(e) => e.stopPropagation()}>
                    </ha-selector>

                    <ha-textfield
                        type="number"
                        label="Speed Multiplier"
                        .value=${this._workingConfig.animation?.speed_multiplier || 1.0}
                        @input=${(e) => this._updateConfig('animation.speed_multiplier', parseFloat(e.target.value) || 1.0)}
                        step="0.1"
                        min="0.1"
                        max="10"
                        helper="Speed multiplier (1.0 = normal)">
                    </ha-textfield>

                    <!-- CASCADE COLORS - Use lcards-color-section -->
                    <lcards-color-section
                        .editor=${this}
                        header="Cascade Colors"
                        description="3-color cycle for cascade effect"
                        .colorPaths=${[
                            {
                                path: 'animation.colors.start',
                                label: 'Start Color',
                                helper: 'Starting color (75% dwell)'
                            },
                            {
                                path: 'animation.colors.text',
                                label: 'Middle Color',
                                helper: 'Middle color (10% snap)'
                            },
                            {
                                path: 'animation.colors.end',
                                label: 'End Color',
                                helper: 'Ending color (10% brief)'
                            }
                        ]}
                        ?expanded=${true}
                        ?useColorPicker=${true}>
                    </lcards-color-section>
                ` : ''}
            </lcards-form-section>

            <lcards-form-section
                header="Change Detection"
                description="Highlight cells on data changes"
                ?expanded=${true}>

                <ha-selector
                    .hass=${this.hass}
                    .selector=${{select: {mode: 'dropdown', options: [
                        { value: 'none', label: 'None' },
                        { value: 'pulse', label: 'Pulse' },
                        { value: 'glow', label: 'Glow' },
                        { value: 'flash', label: 'Flash' }
                    ]}}}
                    .label=${'Change Animation'}
                    .value=${this._workingConfig.change_animation?.preset || 'none'}
                    @value-changed=${(e) => this._updateConfig('change_animation.preset', e.detail.value)}
                    @closed=${(e) => e.stopPropagation()}>
                </ha-selector>

                ${this._workingConfig.change_animation?.preset !== 'none' ? html`
                    <ha-selector
                        .hass=${this.hass}
                        .selector=${{select: {mode: 'dropdown', options: [
                            { value: 'cell', label: 'Cell' },
                            { value: 'row', label: 'Row' },
                            { value: 'column', label: 'Column' }
                        ]}}}
                        .label=${'Target Mode'}
                        .value=${this._workingConfig.change_animation?.target_mode || 'cell'}
                        @value-changed=${(e) => this._updateConfig('change_animation.target_mode', e.detail.value)}
                        @closed=${(e) => e.stopPropagation()}>
                    </ha-selector>
                ` : ''}
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

    _handleMainTabChange(tab) {
        this._activeTab = tab;
        lcardsLog.debug('[DataGridStudioV4] Main tab changed to:', tab);
    }

    _handleModeChange(mode) {
        this._updateConfig('data_mode', mode);

        // Initialize mode-specific config
        if (mode === 'manual') {
            // Initialize with one empty row matching grid columns for manual mode
            const numColumns = this._gridColumns || 12;
            if (!this._workingConfig.rows || this._workingConfig.rows.length === 0) {
                this._workingConfig.rows = [Array(numColumns).fill('')];
            }
        } else if (mode === 'data-table') {
            // Initialize data table with spreadsheet layout
            if (!this._workingConfig.layout) {
                this._workingConfig.layout = 'spreadsheet';
            }

            // Initialize columns/rows for spreadsheet
            if (this._workingConfig.layout === 'spreadsheet') {
                if (!this._workingConfig.columns || this._workingConfig.columns.length === 0) {
                    this._workingConfig.columns = [
                        { header: 'Column 1', width: 100, align: 'left' }
                    ];
                }
                if (!this._workingConfig.rows || this._workingConfig.rows.length === 0) {
                    this._workingConfig.rows = [
                        {
                            sources: [
                                { type: 'static', column: 0, value: '' }
                            ]
                        }
                    ];
                }
            }
        }

        lcardsLog.debug('[DataGridStudioV4] Mode changed to:', mode);
        this.requestUpdate();
        this._schedulePreviewUpdate();
    }

    _toggleGridLines(e) {
        e?.stopPropagation();
        this._showGridLines = !this._showGridLines;
        this.requestUpdate();
        lcardsLog.debug('[DataGridStudioV4] Toggled gridlines:', this._showGridLines);
    }

    _toggleAnimations(e) {
        e?.stopPropagation();
        this._showAnimations = !this._showAnimations;
        this.requestUpdate();
        this._schedulePreviewUpdate();
        lcardsLog.debug('[DataGridStudioV4] Toggled animations:', this._showAnimations);
    }

    _handleLayoutChange(newLayout) {
        this._updateConfig('layout', newLayout);

        // Initialize layout-specific config
        if (newLayout === 'spreadsheet') {
            // Ensure columns exist
            if (!this._workingConfig.columns || this._workingConfig.columns.length === 0) {
                this._workingConfig.columns = [
                    { header: 'Column 1', width: 100, align: 'left' }
                ];
            }
            // Ensure rows exist
            if (!this._workingConfig.rows || this._workingConfig.rows.length === 0) {
                this._workingConfig.rows = [
                    {
                        sources: [
                            { type: 'static', column: 0, value: '' }
                        ]
                    }
                ];
            }
            // Remove timeline-specific fields
            delete this._workingConfig.source;
        } else if (newLayout === 'timeline') {
            // Timeline needs source
            if (!this._workingConfig.source) {
                this._workingConfig.source = '';
            }
            // Timeline doesn't use columns structure
            delete this._workingConfig.columns;
            // Timeline rows are different structure (each row = one datasource)
            if (!this._workingConfig.rows) {
                this._workingConfig.rows = [];
            }
        }

        lcardsLog.debug('[DataGridStudioV4] Layout changed to:', newLayout);
        this.requestUpdate();
        this._schedulePreviewUpdate();
    }

    _setPreviewMode(mode) {
        this._previewMode = mode;
        lcardsLog.debug('[DataGridStudioV4] Preview mode changed to:', mode);

        // Re-render preview to enable/disable click handlers
        this._updatePreviewCard();
    }

    /**
     * Parse CSS Grid strings back to numbers for UI sliders
     * @private
     */
    _parseGridConfigForUI() {
        const grid = this._workingConfig.grid || {};

        // Parse grid-template-rows: "repeat(8, auto)" -> 8
        if (grid['grid-template-rows']) {
            const match = grid['grid-template-rows'].match(/repeat\((\d+),/);
            this._gridRows = match ? parseInt(match[1]) : 8;
        } else if (grid.rows) {
            // Fallback to old shorthand format
            this._gridRows = grid.rows;
        } else {
            this._gridRows = 8;
        }

        // Parse grid-template-columns: "repeat(12, 1fr)" -> 12
        if (grid['grid-template-columns']) {
            const match = grid['grid-template-columns'].match(/repeat\((\d+),/);
            this._gridColumns = match ? parseInt(match[1]) : 12;
        } else if (grid.columns) {
            // Fallback to old shorthand format
            this._gridColumns = grid.columns;
        } else {
            this._gridColumns = 12;
        }

        // Parse gap: "8px" -> 8
        if (grid.gap) {
            const match = String(grid.gap).match(/(\d+)/);
            this._gridGap = match ? parseInt(match[1]) : 8;
        } else {
            this._gridGap = 8;
        }

        lcardsLog.debug('[DataGridStudioV4] Parsed grid config for UI:', {
            rows: this._gridRows,
            columns: this._gridColumns,
            gap: this._gridGap
        });
    }

    /**
     * Handle grid rows change - generates CSS Grid string
     * @param {number} value - Number of rows
     * @private
     */
    _handleGridRowsChange(value) {
        // Generate CSS Grid string
        const cssValue = `repeat(${value}, auto)`;
        this._updateConfig('grid.grid-template-rows', cssValue);

        // Store human-readable value for UI binding
        this._gridRows = value;

        lcardsLog.debug('[DataGridStudioV4] Grid rows changed:', { value, cssValue });
    }

    /**
     * Handle grid columns change - generates CSS Grid string
     * @param {number} value - Number of columns
     * @private
     */
    _handleGridColumnsChange(value) {
        // Generate CSS Grid string
        const cssValue = `repeat(${value}, 1fr)`;
        this._updateConfig('grid.grid-template-columns', cssValue);

        // Store human-readable value for UI binding
        this._gridColumns = value;

        lcardsLog.debug('[DataGridStudioV4] Grid columns changed:', { value, cssValue });
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

        // Store human-readable value for UI binding
        this._gridGap = value;

        lcardsLog.debug('[DataGridStudioV4] Grid gap changed:', { value, cssValue });
    }

    /**
     * Toggle WYSIWYG edit mode
     * @private
     */
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
    _getConfigValue(path) {
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
    _setConfigValue(path, value) {
        this._updateConfig(path, value);
    }

    /**
     * Public updateConfig method (for lcards-color-section compatibility)
     * This is an alias for _updateConfig
     * @param {string} path - Dot-notation path
     * @param {*} value - New value
     */
    updateConfig(path, value) {
        this._updateConfig(path, value);
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

        // Strip animations if toggle is off
        if (!this._showAnimations && cardConfig.animation) {
            delete cardConfig.animation;
        }

        // Add editorMode flag if in edit mode
        if (this._isEditMode) {
            cardConfig.editorMode = true;
        }

        // Ensure style config exists for preview visibility
        if (!cardConfig.style) {
            cardConfig.style = {};
        }

        // Add default colors and padding for visibility in editor
        if (!cardConfig.style.color) {
            cardConfig.style.color = '#99ccff'; // LCARS blue
        }
        if (!cardConfig.style.background) {
            cardConfig.style.background = 'transparent';
        }
        // Override padding for editor visibility
        cardConfig.style.padding = '4px 8px';
        // Add border for visibility
        cardConfig.style.border_width = 1;
        cardConfig.style.border_style = 'solid';
        cardConfig.style.border_color = 'rgba(153, 204, 255, 0.3)';

        lcardsLog.debug('[DataGridStudioV4] Setting card config:', cardConfig);

        card.setConfig(cardConfig);
        card.hass = this.hass;

        // Add to container
        container.appendChild(card);

        lcardsLog.debug('[DataGridStudioV4] Preview card updated');
    }

    // ========================================
    // Row/Column Operations
    // ========================================

    _insertRowBefore(index) {
        lcardsLog.debug('[DataGridStudioV4] Click received', {
            isEditMode: this._isEditMode,
            dataMode: this._workingConfig.data_mode,
            target: event.target
        });

        // Only handle in edit mode and manual mode
        if (!this._isEditMode || this._workingConfig.data_mode !== 'manual') {
            lcardsLog.debug('[DataGridStudioV4] Click ignored - not in edit mode or not manual mode');
            return;
        }

        lcardsLog.debug('[DataGridStudioV4] Processing click for WYSIWYG');

        // The card renders in shadow DOM, so we need to get the composed path
        const path = event.composedPath();

        lcardsLog.debug('[DataGridStudioV4] Composed path length:', path.length);

        // Find the first grid-cell element in the path
        let cellElement = null;
        for (const element of path) {
            if (element.classList && element.classList.contains('grid-cell')) {
                cellElement = element;
                break;
            }
        }

        if (!cellElement) {
            lcardsLog.debug('[DataGridStudioV4] Click not on a grid cell');
            return;
        }

        // Get cell position from data attributes
        const row = parseInt(cellElement.dataset.row);
        const col = parseInt(cellElement.dataset.col);

        // Check if this is a header cell (has data-col but no data-row, or row is undefined)
        const isHeader = cellElement.classList.contains('grid-header');

        lcardsLog.info('[DataGridStudioV4] Cell clicked:', {
            row,
            col,
            isHeader,
            element: cellElement
        });

        // Determine what to open based on click type
        if (isHeader) {
            // Header cell = column editor
            this._openColumnEditor(col, event);
        } else if (event.shiftKey) {
            // Shift + click = row editor
            this._openRowEditor(row, event);
        } else if (event.ctrlKey || event.metaKey) {
            // Ctrl/Cmd + click = column editor
            this._openColumnEditor(col, event);
        } else {
            // Normal click = cell editor
            this._openCellEditor(row, col, event);
        }

        event.stopPropagation();
        event.preventDefault();
    }

    /**
     * Open cell editor overlay
     */
    _openCellEditor(row, col, event) {
        // Close any existing overlay
        this._closeActiveOverlay();

        // Get current cell value and style
        const cellValue = this._getCellValue(row, col);
        const cellStyle = this._getCellStyle(row, col);

        // Create editor
        const editor = document.createElement('lcards-grid-cell-editor');
        editor.hass = this.hass;
        editor.row = row;
        editor.col = col;
        editor.value = cellValue;
        editor.style = cellStyle;
        editor.position = this._calculateOverlayPosition(event);

        // Position editor
        editor.style.top = `${editor.position.top}px`;
        editor.style.left = `${editor.position.left}px`;

        // Listen for events
        editor.addEventListener('cell-updated', (e) => {
            this._handleCellUpdate(e.detail);
        });

        editor.addEventListener('closed', () => {
            this._closeActiveOverlay();
        });

        // Add to DOM
        document.body.appendChild(editor);
        this._activeOverlay = editor;

        lcardsLog.debug('[DataGridStudioV4] Cell editor opened');
    }

    /**
     * Open row editor overlay
     */
    _openRowEditor(row, event) {
        this._closeActiveOverlay();

        const editor = document.createElement('lcards-grid-row-editor');
        editor.hass = this.hass;
        editor.row = row;
        editor.cells = this._getRowCells(row);
        editor.style = this._getRowStyle(row);
        editor.position = this._calculateOverlayPosition(event);

        editor.style.top = `${editor.position.top}px`;
        editor.style.left = `${editor.position.left}px`;

        editor.addEventListener('row-updated', (e) => {
            this._handleRowUpdate(e.detail);
        });

        editor.addEventListener('row-operation', (e) => {
            this._handleRowOperation(e.detail);
        });

        editor.addEventListener('closed', () => {
            this._closeActiveOverlay();
        });

        document.body.appendChild(editor);
        this._activeOverlay = editor;

        lcardsLog.debug('[DataGridStudioV4] Row editor opened');
    }

    /**
     * Open column editor overlay
     */
    _openColumnEditor(col, event) {
        this._closeActiveOverlay();

        const editor = document.createElement('lcards-grid-column-editor');
        editor.hass = this.hass;
        editor.col = col;
        editor.width = this._getColumnWidth(col);
        editor.alignment = this._getColumnAlignment(col);
        editor.style = this._getColumnStyle(col);
        editor.position = this._calculateOverlayPosition(event);

        editor.style.top = `${editor.position.top}px`;
        editor.style.left = `${editor.position.left}px`;

        editor.addEventListener('column-updated', (e) => {
            this._handleColumnUpdate(e.detail);
        });

        editor.addEventListener('column-operation', (e) => {
            this._handleColumnOperation(e.detail);
        });

        editor.addEventListener('closed', () => {
            this._closeActiveOverlay();
        });

        document.body.appendChild(editor);
        this._activeOverlay = editor;

        lcardsLog.debug('[DataGridStudioV4] Column editor opened');
    }

    /**
     * Close active overlay editor
     */
    _closeActiveOverlay() {
        if (this._activeOverlay && this._activeOverlay.parentElement) {
            this._activeOverlay.parentElement.removeChild(this._activeOverlay);
            this._activeOverlay = null;
        }
    }

    /**
     * Calculate overlay position near click
     */
    _calculateOverlayPosition(event) {
        const padding = 20;
        const maxWidth = 400;

        let left = event.clientX + padding;
        let top = event.clientY;

        // Ensure overlay stays on screen
        if (left + maxWidth > window.innerWidth) {
            left = event.clientX - maxWidth - padding;
        }

        if (top + 400 > window.innerHeight) {
            top = window.innerHeight - 400 - padding;
        }

        return { top, left };
    }

    /**
     * Get cell value from config
     */
    _getCellValue(row, col) {
        if (!this._workingConfig.rows || !this._workingConfig.rows[row]) {
            return '';
        }

        const rowData = this._workingConfig.rows[row];
        if (Array.isArray(rowData)) {
            return rowData[col] || '';
        }

        return '';
    }

    /**
     * Get cell style from config
     */
    _getCellStyle(row, col) {
        // TODO: Implement cell-specific style lookup
        return {};
    }

    /**
     * Get row cells
     */
    _getRowCells(row) {
        if (!this._workingConfig.rows || !this._workingConfig.rows[row]) {
            return [];
        }

        const rowData = this._workingConfig.rows[row];
        return Array.isArray(rowData) ? rowData : [];
    }

    /**
     * Get row style
     */
    _getRowStyle(row) {
        // TODO: Implement row-specific style lookup
        return {};
    }

    /**
     * Get column width
     */
    _getColumnWidth(col) {
        // TODO: Implement column width lookup
        return 'auto';
    }

    /**
     * Get column alignment
     */
    _getColumnAlignment(col) {
        // TODO: Implement column alignment lookup
        return 'left';
    }

    /**
     * Get column style
     */
    _getColumnStyle(col) {
        // TODO: Implement column-specific style lookup
        return {};
    }

    /**
     * Handle cell update from editor
     */
    _handleCellUpdate(detail) {
        const { row, col, value, mode, style } = detail;

        // Ensure rows array exists
        if (!this._workingConfig.rows) {
            this._workingConfig.rows = [];
        }

        // Ensure row exists
        while (this._workingConfig.rows.length <= row) {
            this._workingConfig.rows.push([]);
        }

        // Ensure row is array
        if (!Array.isArray(this._workingConfig.rows[row])) {
            this._workingConfig.rows[row] = [];
        }

        // Update cell value
        this._workingConfig.rows[row][col] = value;

        // TODO: Store mode and style information

        lcardsLog.info('[DataGridStudioV4] Cell updated:', { row, col, value });

        this.requestUpdate();
        this._schedulePreviewUpdate();
    }

    /**
     * Handle row update from editor
     */
    _handleRowUpdate(detail) {
        const { row, style } = detail;

        // TODO: Store row-specific style

        lcardsLog.info('[DataGridStudioV4] Row updated:', { row, style });

        this.requestUpdate();
        this._schedulePreviewUpdate();
    }

    /**
     * Handle row operations (insert, delete, duplicate)
     */
    _handleRowOperation(detail) {
        const { operation, row } = detail;

        if (!this._workingConfig.rows) {
            this._workingConfig.rows = [];
        }

        switch (operation) {
            case 'insert-above':
                this._workingConfig.rows.splice(row, 0, []);
                break;
            case 'insert-below':
                this._workingConfig.rows.splice(row + 1, 0, []);
                break;
            case 'duplicate':
                const duplicateRow = [...(this._workingConfig.rows[row] || [])];
                this._workingConfig.rows.splice(row + 1, 0, duplicateRow);
                break;
            case 'delete':
                this._workingConfig.rows.splice(row, 1);
                break;
        }

        lcardsLog.info('[DataGridStudioV4] Row operation:', operation, row);

        this.requestUpdate();
        this._schedulePreviewUpdate();
    }

    /**
     * Handle column update from editor
     */
    _handleColumnUpdate(detail) {
        const { col, width, alignment, style } = detail;

        // TODO: Store column-specific configuration

        lcardsLog.info('[DataGridStudioV4] Column updated:', { col, width, alignment, style });

        this.requestUpdate();
        this._schedulePreviewUpdate();
    }

    /**
     * Handle column operations (insert, delete)
     */
    _handleColumnOperation(detail) {
        const { operation, col } = detail;

        if (!this._workingConfig.rows) {
            this._workingConfig.rows = [];
        }

        switch (operation) {
            case 'insert-left':
                this._workingConfig.rows.forEach(row => {
                    if (Array.isArray(row)) {
                        row.splice(col, 0, '');
                    }
                });
                if (this._workingConfig.grid) {
                    this._workingConfig.grid.columns = (this._workingConfig.grid.columns || 0) + 1;
                }
                break;
            case 'insert-right':
                this._workingConfig.rows.forEach(row => {
                    if (Array.isArray(row)) {
                        row.splice(col + 1, 0, '');
                    }
                });
                if (this._workingConfig.grid) {
                    this._workingConfig.grid.columns = (this._workingConfig.grid.columns || 0) + 1;
                }
                break;
            case 'delete':
                this._workingConfig.rows.forEach(row => {
                    if (Array.isArray(row)) {
                        row.splice(col, 1);
                    }
                });
                if (this._workingConfig.grid) {
                    this._workingConfig.grid.columns = Math.max(1, (this._workingConfig.grid.columns || 1) - 1);
                }
                break;
        }

        lcardsLog.info('[DataGridStudioV4] Column operation:', operation, col);

        this.requestUpdate();
        this._schedulePreviewUpdate();
    }

    /**
     * Convert v4 config to card-compatible config
     * Maps new mode names back to old names for card compatibility
     */
    _convertConfigForCard(config) {
        const converted = { ...config };

        // Map mode names back for card compatibility
        const modeMap = {
            'decorative': 'random',
            'manual': 'template',
            'data-table': 'datasource'
        };

        if (modeMap[converted.data_mode]) {
            converted.data_mode = modeMap[converted.data_mode];
        }

        // Disable animations in preview for cleaner editing experience
        if (converted.animation) {
            delete converted.animation;
        }

        // Convert Data Table structure if needed
        if (config.data_mode === 'data-table') {
            const layout = config.layout || 'spreadsheet';

            if (layout === 'spreadsheet' && config.columns && config.rows) {
                // Convert spreadsheet structure to card-compatible format
                // For preview, we need to convert the sources structure to flat arrays
                const flatRows = [];

                // Add header row
                flatRows.push(config.columns.map(col => col.header || ''));

                // Convert data rows
                config.rows.forEach(row => {
                    if (row.sources && Array.isArray(row.sources)) {
                        // Extract values from sources
                        const flatRow = row.sources.map(source => {
                            if (source.type === 'static') {
                                return source.value || '';
                            } else if (source.type === 'entity') {
                                return source.entity_id || '';
                            } else if (source.type === 'datasource') {
                                return source.datasource_id || '';
                            }
                            return '';
                        });
                        flatRows.push(flatRow);
                    }
                });

                converted.rows = flatRows;

                // Set data_mode to template for preview
                converted.data_mode = 'template';

                lcardsLog.debug('[DataGridStudioV4] Converted data-table to flat rows:', flatRows);
            }
        }

        return converted;
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

        // Manual mode validation - only validate if not in edit mode
        if (this._workingConfig.data_mode === 'manual' && !this._isEditMode) {
            const rows = this._workingConfig.rows || [];

            if (rows.length === 0) {
                errors.push('Manual mode: At least one row is required');
            }
        }

        // Data Table mode validation - skip if in edit mode and config is still being built
        if (this._workingConfig.data_mode === 'data-table') {
            const layout = this._workingConfig.layout || 'spreadsheet';

            if (layout === 'spreadsheet') {
                // Spreadsheet layout validation
                const columns = this._workingConfig.columns || [];
                const rows = this._workingConfig.rows || [];

                // Only validate if not in edit mode
                if (!this._isEditMode) {
                    if (columns.length === 0) {
                        errors.push('Data Table (spreadsheet): At least one column is required');
                    }

                    if (rows.length === 0) {
                        errors.push('Data Table (spreadsheet): At least one row is required');
                    }

                    // Validate that all rows have cells for all columns
                    rows.forEach((row, rowIndex) => {
                        if (!row.sources || row.sources.length < columns.length) {
                            errors.push(`Data Table (spreadsheet): Row ${rowIndex + 1} is missing cells for all columns`);
                        }
                    });

                    // Validate column headers
                    columns.forEach((col, colIndex) => {
                        if (!col.header || col.header.trim() === '') {
                            errors.push(`Data Table (spreadsheet): Column ${colIndex + 1} is missing a header`);
                        }
                    });
                }
            } else if (layout === 'timeline') {
                // Timeline validation
                const rows = this._workingConfig.rows || [];

                // Only validate if not in edit mode
                if (!this._isEditMode && rows.length === 0) {
                    errors.push('Data Table (timeline): At least one row is required');
                }

                // Validate that all rows have valid entity/datasource
                if (!this._isEditMode) {
                    rows.forEach((row, rowIndex) => {
                        if (!row.source || row.source.trim() === '') {
                            errors.push(`Data Table (timeline): Row ${rowIndex + 1} is missing a datasource/entity`);
                        }

                        if (!row.history_hours || row.history_hours < 1 || row.history_hours > 24) {
                            errors.push(`Data Table (timeline): Row ${rowIndex + 1} history hours must be between 1 and 24`);
                        }
                    });
                }
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
     * Add timeline row (row-timeline layout)
     */
    _addTimelineRow() {
        if (!this._workingConfig.rows) {
            this._workingConfig.rows = [];
        }

        this._workingConfig.rows.push({
            source: '',
            label: `Row ${this._workingConfig.rows.length + 1}`,
            format: '{value}',
            history_hours: 2,
            columns: 12
        });

        lcardsLog.info('[DataGridStudioV4] Timeline row added');
        this.requestUpdate();
        this._schedulePreviewUpdate();
    }

    /**
     * Edit timeline row configuration
     */
    _editTimelineRow(index) {
        lcardsLog.info('[DataGridStudioV4] Edit timeline row:', index);

        const row = this._workingConfig.rows?.[index];
        if (!row) {
            lcardsLog.error('[DataGridStudioV4] Row not found:', index);
            return;
        }

        // Create overlay with timeline row editor
        this._activeOverlay = {
            type: 'timeline-row',
            rowIndex: index,
            data: { ...row }
        };

        this.requestUpdate();
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

        const numColumns = this._gridColumns || 12;
        const newRow = Array(numColumns).fill('');

        this._workingConfig.rows.push(newRow);

        lcardsLog.info('[DataGridStudioV4] Manual row added');
        this.requestUpdate();
        this._schedulePreviewUpdate();
    }

    /**
     * Delete row in Manual mode
     */
    _deleteManualRow(index) {
        if (!this._workingConfig.rows) return;

        this._workingConfig.rows.splice(index, 1);

        lcardsLog.info('[DataGridStudioV4] Manual row deleted:', index);
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

        // Add empty cell to each row
        this._workingConfig.rows.forEach(row => {
            if (Array.isArray(row)) {
                row.push('');
            }
        });

        // Update grid columns count
        this._gridColumns = (this._gridColumns || 12) + 1;
        if (this._workingConfig.grid) {
            this._workingConfig.grid['grid-template-columns'] = `repeat(${this._gridColumns}, 1fr)`;
        }

        lcardsLog.info('[DataGridStudioV4] Manual column added');
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

        // Ensure row exists
        if (!this._workingConfig.rows[row]) {
            this._workingConfig.rows[row] = [];
        }

        // Update cell value
        this._workingConfig.rows[row][col] = value;

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
     * Render inline cell editor
     */
    _renderCellEditor() {
        const { row, col, value } = this._activeCellEdit;

        return html`
            <lcards-form-section
                header="Edit Cell (Row ${row + 1}, Col ${col + 1})"
                description="Enter static text or Home Assistant template"
                ?expanded=${true}>

                <ha-textfield
                    label="Cell Value"
                    .value=${value}
                    @input=${(e) => {
                        this._activeCellEdit.value = e.target.value;
                        this.requestUpdate();
                    }}
                    @keydown=${(e) => {
                        if (e.key === 'Enter') {
                            e.stopPropagation();
                            e.preventDefault();
                            this._saveCellEdit();
                        } else if (e.key === 'Escape') {
                            e.stopPropagation();
                            this._cancelCellEdit();
                        }
                    }}
                    style="width: 100%;">
                </ha-textfield>

                <div style="display: flex; gap: 8px; margin-top: 12px;">
                    <ha-button @click=${this._saveCellEdit}>
                        <ha-icon icon="mdi:check" slot="icon"></ha-icon>
                        Save
                    </ha-button>
                    <ha-button @click=${this._cancelCellEdit}>
                        <ha-icon icon="mdi:close" slot="icon"></ha-icon>
                        Cancel
                    </ha-button>
                </div>

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
        const row = this._workingConfig.rows[rowIndex];

        return html`
            <lcards-form-section
                header="Row ${rowIndex + 1} Operations"
                description="Bulk operations for this row"
                ?expanded=${true}>

                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 8px;">
                    <ha-button @click=${() => this._insertRowBefore(rowIndex)}>
                        <ha-icon icon="mdi:table-row-plus-before" slot="icon"></ha-icon>
                        Insert Before
                    </ha-button>

                    <ha-button @click=${() => this._insertRowAfter(rowIndex)}>
                        <ha-icon icon="mdi:table-row-plus-after" slot="icon"></ha-icon>
                        Insert After
                    </ha-button>

                    <ha-button @click=${() => this._moveRowUp(rowIndex)} .disabled=${rowIndex === 0}>
                        <ha-icon icon="mdi:arrow-up-bold" slot="icon"></ha-icon>
                        Move Up
                    </ha-button>

                    <ha-button @click=${() => this._moveRowDown(rowIndex)} .disabled=${rowIndex === this._workingConfig.rows.length - 1}>
                        <ha-icon icon="mdi:arrow-down-bold" slot="icon"></ha-icon>
                        Move Down
                    </ha-button>

                    <ha-button @click=${() => this._deleteManualRow(rowIndex)} style="--mdc-theme-primary: var(--error-color);">
                        <ha-icon icon="mdi:delete" slot="icon"></ha-icon>
                        Delete Row
                    </ha-button>

                    <ha-button @click=${() => { this._activeRowEdit = null; this.requestUpdate(); }}>
                        <ha-icon icon="mdi:close" slot="icon"></ha-icon>
                        Close
                    </ha-button>
                </div>
            </lcards-form-section>
        `;
    }

    /**
     * Render inline column editor
     */
    _renderColumnEditor() {
        const colIndex = this._activeColumnEdit;

        return html`
            <lcards-form-section
                header="Column ${colIndex + 1} Operations"
                description="Bulk operations for this column"
                ?expanded=${true}>

                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 8px;">
                    <ha-button @click=${() => this._insertColumnBefore(colIndex)}>
                        <ha-icon icon="mdi:table-column-plus-before" slot="icon"></ha-icon>
                        Insert Before
                    </ha-button>

                    <ha-button @click=${() => this._insertColumnAfter(colIndex)}>
                        <ha-icon icon="mdi:table-column-plus-after" slot="icon"></ha-icon>
                        Insert After
                    </ha-button>

                    <ha-button @click=${() => this._moveColumnLeft(colIndex)} .disabled=${colIndex === 0}>
                        <ha-icon icon="mdi:arrow-left-bold" slot="icon"></ha-icon>
                        Move Left
                    </ha-button>

                    <ha-button @click=${() => this._moveColumnRight(colIndex)} .disabled=${colIndex === this._gridColumns - 1}>
                        <ha-icon icon="mdi:arrow-right-bold" slot="icon"></ha-icon>
                        Move Right
                    </ha-button>

                    <ha-button @click=${() => this._deleteColumn(colIndex)} style="--mdc-theme-primary: var(--error-color);">
                        <ha-icon icon="mdi:delete" slot="icon"></ha-icon>
                        Delete Column
                    </ha-button>

                    <ha-button @click=${() => { this._activeColumnEdit = null; this.requestUpdate(); }}>
                        <ha-icon icon="mdi:close" slot="icon"></ha-icon>
                        Close
                    </ha-button>
                </div>
            </lcards-form-section>
        `;
    }

    // ========================================
    // Row/Column Operations
    // ========================================

    _insertRowBefore(index) {
        const emptyRow = Array(this._gridColumns).fill('');
        this._workingConfig.rows.splice(index, 0, emptyRow);
        this._activeRowEdit = null;
        lcardsLog.info('[DataGridStudioV4] Row inserted before:', index);
        this.requestUpdate();
        this._schedulePreviewUpdate();
    }

    _insertRowAfter(index) {
        const emptyRow = Array(this._gridColumns).fill('');
        this._workingConfig.rows.splice(index + 1, 0, emptyRow);
        this._activeRowEdit = null;
        lcardsLog.info('[DataGridStudioV4] Row inserted after:', index);
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
            if (Array.isArray(row)) {
                row.splice(index, 0, '');
            }
        });
        this._gridColumns++;
        if (this._workingConfig.grid) {
            this._workingConfig.grid['grid-template-columns'] = `repeat(${this._gridColumns}, 1fr)`;
        }
        this._activeColumnEdit = null;
        lcardsLog.info('[DataGridStudioV4] Column inserted before:', index);
        this.requestUpdate();
        this._schedulePreviewUpdate();
    }

    _insertColumnAfter(index) {
        this._workingConfig.rows.forEach(row => {
            if (Array.isArray(row)) {
                row.splice(index + 1, 0, '');
            }
        });
        this._gridColumns++;
        if (this._workingConfig.grid) {
            this._workingConfig.grid['grid-template-columns'] = `repeat(${this._gridColumns}, 1fr)`;
        }
        this._activeColumnEdit = null;
        lcardsLog.info('[DataGridStudioV4] Column inserted after:', index);
        this.requestUpdate();
        this._schedulePreviewUpdate();
    }

    _moveColumnLeft(index) {
        if (index === 0) return;
        this._workingConfig.rows.forEach(row => {
            if (Array.isArray(row)) {
                const temp = row[index];
                row[index] = row[index - 1];
                row[index - 1] = temp;
            }
        });
        this._activeColumnEdit = index - 1;
        lcardsLog.info('[DataGridStudioV4] Column moved left:', index);
        this.requestUpdate();
        this._schedulePreviewUpdate();
    }

    _moveColumnRight(index) {
        if (index === this._gridColumns - 1) return;
        this._workingConfig.rows.forEach(row => {
            if (Array.isArray(row)) {
                const temp = row[index];
                row[index] = row[index + 1];
                row[index + 1] = temp;
            }
        });
        this._activeColumnEdit = index + 1;
        lcardsLog.info('[DataGridStudioV4] Column moved right:', index);
        this.requestUpdate();
        this._schedulePreviewUpdate();
    }

    _deleteColumn(index) {
        this._workingConfig.rows.forEach(row => {
            if (Array.isArray(row)) {
                row.splice(index, 1);
            }
        });
        this._gridColumns--;
        if (this._workingConfig.grid) {
            this._workingConfig.grid['grid-template-columns'] = `repeat(${this._gridColumns}, 1fr)`;
        }
        this._activeColumnEdit = null;
        lcardsLog.info('[DataGridStudioV4] Column deleted:', index);
        this.requestUpdate();
        this._schedulePreviewUpdate();
    }

    // ========================================
    // Overlay Rendering
    // ========================================

    /**
     * Render active overlay editor
     */
    _renderOverlay() {
        if (!this._activeOverlay) return '';

        switch (this._activeOverlay.type) {
            case 'timeline-row':
                return this._renderTimelineRowEditorOverlay();
            case 'column':
                return this._renderColumnEditorOverlay();
            default:
                return '';
        }
    }

    /**
     * Render timeline row editor overlay
     */
    _renderTimelineRowEditorOverlay() {
        const { rowIndex, data } = this._activeOverlay;

        return html`
            <div class="editor-overlay">
                <div class="overlay-backdrop" @click=${this._closeOverlay}></div>
                <div class="overlay-content">
                    <h3>Edit Timeline Row ${rowIndex + 1}</h3>

                    <ha-entity-picker
                        .hass=${this.hass}
                        .value=${data.source || ''}
                        label="Entity or DataSource"
                        @value-changed=${(e) => {
                            this._activeOverlay.data.source = e.detail.value;
                            this.requestUpdate();
                        }}>
                    </ha-entity-picker>

                    <ha-textfield
                        label="Label (optional)"
                        .value=${data.label || ''}
                        @input=${(e) => {
                            this._activeOverlay.data.label = e.target.value;
                            this.requestUpdate();
                        }}
                        style="margin-top: 16px; width: 100%;">
                    </ha-textfield>

                    <ha-textfield
                        label="Format Template"
                        .value=${data.format || '{value}'}
                        @input=${(e) => {
                            this._activeOverlay.data.format = e.target.value;
                            this.requestUpdate();
                        }}
                        helper="Use {value} for the data value"
                        style="margin-top: 16px; width: 100%;">
                    </ha-textfield>

                    <ha-textfield
                        type="number"
                        label="History Hours"
                        .value=${data.history_hours || 2}
                        @input=${(e) => {
                            this._activeOverlay.data.history_hours = parseInt(e.target.value) || 2;
                            this.requestUpdate();
                        }}
                        min="1"
                        max="24"
                        style="margin-top: 16px; width: 100%;">
                    </ha-textfield>

                    <div class="overlay-actions">
                        <ha-button @click=${this._closeOverlay}>Cancel</ha-button>
                        <ha-button @click=${this._saveTimelineRow}>Save</ha-button>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Render column editor overlay
     */
    _renderColumnEditorOverlay() {
        const { colIndex, data } = this._activeOverlay;

        return html`
            <div class="editor-overlay">
                <div class="overlay-backdrop" @click=${this._closeOverlay}></div>
                <div class="overlay-content">
                    <h3>Edit Column ${colIndex + 1}</h3>

                    <ha-textfield
                        label="Column Header"
                        .value=${data.header || ''}
                        @input=${(e) => {
                            this._activeOverlay.data.header = e.target.value;
                            this.requestUpdate();
                        }}
                        style="margin-top: 16px; width: 100%;">
                    </ha-textfield>

                    <ha-textfield
                        type="number"
                        label="Width (px)"
                        .value=${data.width || 100}
                        @input=${(e) => {
                            this._activeOverlay.data.width = parseInt(e.target.value) || 100;
                            this.requestUpdate();
                        }}
                        min="50"
                        max="500"
                        style="margin-top: 16px; width: 100%;">
                    </ha-textfield>

                    <ha-selector
                        .hass=${this.hass}
                        .selector=${{select: {mode: 'dropdown', options: [
                            { value: 'left', label: 'Left' },
                            { value: 'center', label: 'Center' },
                            { value: 'right', label: 'Right' }
                        ]}}}
                        .label=${'Alignment'}
                        .value=${data.align || 'left'}
                        @value-changed=${(e) => {
                            this._activeOverlay.data.align = e.detail.value;
                            this.requestUpdate();
                        }}
                        @closed=${(e) => e.stopPropagation()}
                        style="margin-top: 16px; width: 100%;">
                    </ha-selector>

                    <div class="overlay-actions">
                        <ha-button @click=${this._closeOverlay}>Cancel</ha-button>
                        <ha-button @click=${this._saveColumn}>Save</ha-button>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Save timeline row changes
     */
    _saveTimelineRow() {
        const { rowIndex, data } = this._activeOverlay;

        // Update config
        this._workingConfig.rows[rowIndex] = data;

        // Close overlay
        this._closeOverlay();

        // Update preview
        this._schedulePreviewUpdate();
        this.requestUpdate();
    }

    /**
     * Save column changes
     */
    _saveColumn() {
        const { colIndex, data } = this._activeOverlay;

        // Update config
        this._workingConfig.columns[colIndex] = data;

        // Close overlay
        this._closeOverlay();

        // Update preview
        this._schedulePreviewUpdate();
        this.requestUpdate();
    }

    /**
     * Close overlay
     */
    _closeOverlay() {
        this._activeOverlay = null;
        this.requestUpdate();
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

    // ========================================
    // Timeline Row Management
    // ========================================

    _addTimelineRow() {
        if (!this._workingConfig.rows) {
            this._workingConfig.rows = [];
        }

        this._workingConfig.rows.push({
            entity_id: '',
            label: `Row ${this._workingConfig.rows.length + 1}`
        });

        lcardsLog.info('[DataGridStudioV4] Timeline row added');
        this.requestUpdate();
        this._schedulePreviewUpdate();
    }

    _editTimelineRow(index) {
        this._activeTimelineRowEdit = index;
        this.requestUpdate();
    }

    _closeTimelineRowEditor() {
        this._activeTimelineRowEdit = null;
        this.requestUpdate();
    }

    _updateTimelineRowEntity(index, entityId) {
        if (this._workingConfig.rows[index]) {
            if (typeof this._workingConfig.rows[index] === 'object') {
                this._workingConfig.rows[index].entity_id = entityId;
            } else {
                this._workingConfig.rows[index] = {
                    entity_id: entityId,
                    label: `Row ${index + 1}`
                };
            }
            this.requestUpdate();
            this._schedulePreviewUpdate();
        }
    }

    _updateTimelineRowLabel(index, label) {
        if (this._workingConfig.rows[index]) {
            if (typeof this._workingConfig.rows[index] === 'object') {
                this._workingConfig.rows[index].label = label;
            } else {
                this._workingConfig.rows[index] = {
                    entity_id: '',
                    label: label
                };
            }
            this.requestUpdate();
        }
    }

    _deleteTimelineRow(index) {
        if (this._workingConfig.rows && this._workingConfig.rows[index]) {
            this._workingConfig.rows.splice(index, 1);
            if (this._activeTimelineRowEdit === index) {
                this._activeTimelineRowEdit = null;
            }
            lcardsLog.info('[DataGridStudioV4] Timeline row deleted:', index);
            this.requestUpdate();
            this._schedulePreviewUpdate();
        }
    }
}

customElements.define('lcards-data-grid-studio-dialog-v4', LCARdSDataGridStudioDialogV4);
