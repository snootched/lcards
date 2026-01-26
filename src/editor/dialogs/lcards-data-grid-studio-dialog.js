/**
 * LCARdS Data Grid Configuration Studio V4
 *
 * Simplified 2-mode architecture:
 * - Decorative Mode: Auto-generated random data for LCARS ambiance
 * - Data Mode: Real entity/sensor data with grid layout
 *
 * Key Features:
 * - Live preview with configurable grid dimensions
 * - Grid layout: Flexible spreadsheet-style data display
 * - Visual hierarchy diagrams for styling
 * - Split-panel layout (33/66 config/preview)
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
import '../components/editors/lcards-grid-layout.js';
import '../components/editors/lcards-font-selector.js';
import '../components/editors/lcards-visual-grid-designer.js';
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
            _gridRows: { type: Number, state: true },
            _gridColumns: { type: Number, state: true },
            _gridGap: { type: Number, state: true },
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

        // Grid UI state variables
        this._gridRows = 8;
        this._gridColumns = 12;
        this._gridGap = 8;

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

    connectedCallback() {
        super.connectedCallback();
        // Deep clone initial config
        this._workingConfig = JSON.parse(JSON.stringify(this._initialConfig || {}));

        // Migrate old timeline configs to data table mode
        if (this._workingConfig.layout === 'timeline') {
            this._migrateTimelineConfig();
        }

        // Ensure data_mode is set
        if (!this._workingConfig.data_mode) {
            this._workingConfig.data_mode = 'decorative';
        }

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

        // Parse CSS Grid strings to numbers for UI sliders
        this._parseGridConfigForUI();

        // Initialize Data mode (grid layout) with sample rows matching grid dimensions
        if (this._workingConfig.data_mode === 'data' && !this._workingConfig.rows) {
            this._initializeGridRows();
        }

        lcardsLog.debug('[DataGridStudioV4] Opened with config:', this._workingConfig);

        // Schedule initial preview update
        this.updateComplete.then(() => this._updatePreviewCard());
    }

    /**
     * Migrate old timeline configs to data table mode
     * @private
     */
    _migrateTimelineConfig() {
        lcardsLog.warn('[DataGridStudioV4] Migrating deprecated timeline config to manual mode');
        
        // Remove layout property
        delete this._workingConfig.layout;
        
        // If there was a source, we can't easily migrate it to the new grid system
        // Just clear timeline-specific properties
        delete this._workingConfig.source;
        delete this._workingConfig.history_hours;
        delete this._workingConfig.value_template;
        
        // Set to manual/data mode
        this._workingConfig.data_mode = 'data';
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
                flex: 1;
                overflow: hidden;
            }

            /* Tab navigation container */
            .tab-navigation {
                display: flex;
                gap: 0;
                border-bottom: 2px solid var(--divider-color);
                background: var(--secondary-background-color);
            }

            /* Preview container adjustments */
            .preview-container {
                flex: 1;
                padding: 24px;
                overflow: auto;
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
                @closed=${this._handleCancel}
                .heading=${'Data Grid Studio'}>

                <div class="dialog-content">
                    <!-- Split Layout: Config (33%) | Preview (66%) -->
                    <div class="studio-layout">
                        <!-- Left Panel: Config -->
                        <div class="config-panel">
                            <!-- Tab Navigation -->
                            <div class="tab-navigation">
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
                            </div>

                            <!-- Tab Content -->
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
                                    <div class="canvas-toolbar-divider"></div>
                                    <button
                                        class="canvas-toolbar-button ${this._showAnimations ? 'active' : ''}"
                                        @click=${this._toggleAnimations}
                                        title="Toggle Animations">
                                        <ha-icon icon="mdi:animation"></ha-icon>
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
                <ha-button
                    slot="primaryAction"
                    variant="brand"
                    @click=${this._handleSave}>
                    <ha-icon icon="mdi:check" slot="icon"></ha-icon>
                    Save
                </ha-button>

                <ha-button
                    slot="secondaryAction"
                    appearance="plain"
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
    _toggleGridLines() {
        this._showGridLines = !this._showGridLines;
        this._updatePreviewCard();
        lcardsLog.debug('[DataGridStudioV4] Grid lines toggled:', this._showGridLines);
    }

    /**
     * Toggle animations in preview
     */
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
                description: 'Auto-generated random data for LCARS-style ambiance'
            },
            {
                id: 'data',
                icon: 'mdi:database',
                title: 'Data',
                description: 'Real entity/sensor data with grid layout'
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
        const numColumns = this._gridColumns || 12;

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
     * Render consolidated template syntax reference with grouped examples
     */
    _renderTemplateSyntaxExamples() {
        const exampleGroups = [
            {
                title: 'Token Templates',
                examples: [
                    { code: '{{ value }}', description: 'Cell value from entity or datasource' },
                    { code: '{{ timestamp }}', description: 'Data timestamp' },
                    { code: '{{ row }} / {{ column }}', description: 'Grid position' }
                ]
            },
            {
                title: 'Home Assistant Jinja2',
                examples: [
                    { code: "{{states('sensor.temperature')}}", description: 'Get entity state' },
                    { code: "{{state_attr('sensor.weather', 'humidity')}}", description: 'Get entity attribute' },
                    { code: "{% if states('light.kitchen') == 'on' %}ON{% else %}OFF{% endif %}", description: 'Conditional logic' },
                    { code: "{{states('sensor.temperature')|float|round(1)}}°C", description: 'Format numbers' }
                ]
            },
            {
                title: 'JavaScript Expressions',
                examples: [
                    { code: '[[[return value.toFixed(2);]]]', description: 'Format numbers' },
                    { code: '[[[return new Date(timestamp).toLocaleTimeString();]]]', description: 'Format timestamps' },
                    { code: "[[[return value > 20 ? 'WARM' : 'COOL';]]]", description: 'Conditional values' }
                ]
            },
            {
                title: 'Combined Examples',
                examples: [
                    { code: "[[[return `${value}°C (${value * 9/5 + 32}°F)`;]]]", description: 'Temperature with conversion' },
                    { code: "{{states('sensor.temp')}}°C / {{states('sensor.humidity')}}%", description: 'Multiple entities' }
                ]
            }
        ];

        return html`
            <div class="template-examples">
                ${exampleGroups.map(group => html`
                    <div class="example-group">
                        <div class="example-title">${group.title}</div>
                        ${group.examples.map(example => html`
                            <div class="example-item">
                                <div class="example-code-row">
                                    <code>${example.code}</code>
                                    <ha-icon-button
                                        class="copy-button"
                                        @click=${() => this._copyToClipboard(example.code)}
                                        title="Copy to clipboard">
                                        <ha-icon icon="mdi:content-copy"></ha-icon>
                                    </ha-icon-button>
                                </div>
                                <span class="example-description">${example.description}</span>
                            </div>
                        `)}
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
                icon="mdi:ruler"
                ?expanded=${true}>

                ${dataMode === 'data' ? html`
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
                        .value=${this._gridRows}
                        .label=${'Rows'}
                        .helper=${'Number of rows'}
                        @value-changed=${(e) => this._handleGridRowsChange(parseInt(e.detail.value) || 1)}
                        @closed=${(e) => e.stopPropagation()}>
                    </ha-selector>

                    <ha-selector
                        .hass=${this.hass}
                        .selector=${{number: {min: 1, max: 50, mode: 'box'}}}
                        .value=${this._gridColumns}
                        .label=${'Columns'}
                        .helper=${'Number of columns'}
                        @value-changed=${(e) => this._handleGridColumnsChange(parseInt(e.detail.value) || 1)}
                        @closed=${(e) => e.stopPropagation()}>
                    </ha-selector>
                </lcards-grid-layout>

                <ha-selector
                    .hass=${this.hass}
                    .selector=${{number: {min: 0, max: 50, mode: 'box'}}}
                    .value=${this._gridGap}
                    .label=${'Gap (px)'}
                    .helper=${'Space between cells'}
                    @value-changed=${(e) => this._handleGridGapChange(parseInt(e.detail.value) || 0)}
                    @closed=${(e) => e.stopPropagation()}>
                </ha-selector>
            </lcards-form-section>

            ${dataMode === 'decorative' ? this._renderDecorativeModeConfig() : ''}
            ${dataMode === 'data' ? html`
                ${this._renderDataModeConfig()}
                ${this._renderDataModeEditor()}
            ` : ''}
        `;
    }

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
        const numColumns = this._gridColumns || 12;

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
                icon="mdi:code-braces"
                ?expanded=${false}>

                ${this._renderTemplateSyntaxExamples()}
            </lcards-form-section>
        `;
    }

    _renderDataModeEditor() {
        return this._renderGridDataEditor();
    }

    _renderGridDataEditor() {
        const rows = this._workingConfig.rows || [];
        const numColumns = this._gridColumns || 12;

        return html`
            <lcards-form-section
                header="Spreadsheet Data Editor"
                description="Configure entity mappings per cell (column-based layout)"
                icon="mdi:table-edit"
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
                icon="mdi:code-braces"
                ?expanded=${false}>

                ${this._renderTemplateSyntaxExamples()}
            </lcards-form-section>
        `;
    }

    _renderDataModeConfig() {
        return html`
            <lcards-form-section
                header="Data Mode Settings"
                description="Configure real entity/sensor data"
                icon="mdi:database"
                ?expanded=${true}>

                <lcards-message type="info">
                    Grid mode: Rows with auto-detected cells (static text, entity refs, or templates)
                </lcards:message>
            </lcards-form-section>
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
            ${this._gridStylesSubTab === 'row-column' ? this._renderRowColumnStylesSubTab() : ''}
            ${this._gridStylesSubTab === 'cell' ? this._renderCellLevelStylesSubTab() : ''}
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

            <lcards-form-section
                header="Alignment & Padding"
                description="Text alignment and cell padding"
                icon="mdi:format-align-center"
                ?expanded=${true}>

                <lcards-grid-layout>
                    <ha-selector
                        .hass=${this.hass}
                        .selector=${{select: {mode: 'dropdown', options: [
                            { value: 'left', label: 'Left' },
                            { value: 'center', label: 'Center' },
                            { value: 'right', label: 'Right' }
                        ]}}}
                        .label=${'Text Alignment'}
                        .value=${this._workingConfig.style?.align || 'left'}
                        @value-changed=${(e) => this._updateConfig('style.align', e.detail.value)}
                        @closed=${(e) => e.stopPropagation()}>
                    </ha-selector>

                    <ha-textfield
                        label="Padding"
                        .value=${this._workingConfig.style?.padding || ''}
                        @input=${(e) => this._updateConfig('style.padding', e.target.value)}
                        helper="e.g., '8px', '4px 8px'">
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

            <lcards-form-section
                header="Border Settings"
                description="Cell border configuration"
                icon="mdi:border-all"
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

    _renderRowColumnStylesSubTab() {
        return html`
            <lcards-message type="info">
                Row and column specific styling can be configured directly in the Grid Structure tab
                by clicking on row/column headers in the editable grid.
            </lcards-message>

            <lcards-form-section
                header="Row-Level Overrides"
                description="These styles apply to entire rows"
                icon="mdi:table-row"
                ?expanded=${false}>
                <lcards-message type="info">
                    Use the inline row editor in Grid Structure tab to configure row-specific styles.
                    Click a row number in the editable grid to access row styling options.
                </lcards-message>
            </lcards-form-section>

            <lcards-form-section
                header="Column-Level Overrides"
                description="These styles apply to entire columns"
                icon="mdi:table-column"
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
                icon="mdi:square"
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

    // ========================================
    // ANIMATION TAB (DEPRECATED - REPLACED BY EFFECTS TAB)
    // ========================================

    _renderAnimationTab() {
        const animationType = this._workingConfig.animation?.type || 'none';
        const pattern = this._workingConfig.animation?.pattern || 'default';
        const highlightChanges = this._workingConfig.animation?.highlight_changes || false;
        const changePreset = this._workingConfig.animation?.change_preset || 'pulse';

        return html`
            <lcards-message
                type="info"
                message="Configure cascade animation (continuous waterfall effect) and change detection (highlights when values change).">
            </lcards-message>

            <!-- Cascade Animation -->
            <lcards-form-section
                header="Cascade Animation"
                description="Authentic LCARS waterfall color cycling effect"
                icon="mdi:animation"
                ?expanded=${true}
                ?outlined=${true}>

                <div class="form-row-group">
                    <ha-selector
                        .hass=${this.hass}
                        .selector=${{select: {mode: 'dropdown', options: [
                            { value: 'none', label: 'None' },
                            { value: 'cascade', label: 'Cascade' }
                        ]}}}
                        .label=${'Animation Type'}
                        .value=${animationType}
                        @value-changed=${(e) => this._updateConfig('animation.type', e.detail.value)}
                        @closed=${(e) => e.stopPropagation()}>
                    </ha-selector>
                </div>

                ${animationType === 'cascade' ? html`
                    <div class="form-row-group">
                        <ha-selector
                            .hass=${this.hass}
                            .selector=${{select: {mode: 'dropdown', options: [
                                { value: 'default', label: 'Default' },
                                { value: 'niagara', label: 'Niagara' },
                                { value: 'fast', label: 'Fast' },
                                { value: 'frozen', label: 'Frozen' },
                                { value: 'custom', label: 'Custom' }
                            ]}}}
                            .label=${'Timing Pattern'}
                            .value=${pattern}
                            @value-changed=${(e) => this._updateConfig('animation.pattern', e.detail.value)}
                            @closed=${(e) => e.stopPropagation()}>
                        </ha-selector>
                    </div>

                    <!-- 3-Color Cascade -->
                    <lcards-color-section
                        .editor=${this}
                        header="Cascade Colors"
                        description="3-color cycle for cascade effect"
                        .colorPaths=${[
                            { path: 'animation.colors.start', label: 'Start Color', helper: 'Starting color (75% dwell)' },
                            { path: 'animation.colors.text', label: 'Middle Color', helper: 'Middle color (10% snap)' },
                            { path: 'animation.colors.end', label: 'End Color', helper: 'Ending color (10% brief)' }
                        ]}
                        ?expanded=${true}
                        ?useColorPicker=${true}>
                    </lcards-color-section>

                    <!-- Speed Controls -->
                    <lcards-grid-layout>
                        <ha-textfield
                            type="number"
                            label="Speed Multiplier"
                            .value=${this._workingConfig.animation?.speed_multiplier || 1.0}
                            @input=${(e) => this._updateConfig('animation.speed_multiplier', parseFloat(e.target.value) || 1.0)}
                            step="0.1"
                            min="0.1"
                            max="10"
                            helper="2.0 = twice as fast, 0.5 = half speed">
                        </ha-textfield>

                        <ha-textfield
                            type="number"
                            label="Override Duration (ms)"
                            .value=${this._workingConfig.animation?.duration || ''}
                            @input=${(e) => this._updateConfig('animation.duration', parseInt(e.target.value) || undefined)}
                            min="100"
                            max="30000"
                            helper="Override all row durations (leave empty to use pattern)">
                        </ha-textfield>
                    </lcards-grid-layout>

                    <ha-textfield
                        label="Easing Function"
                        .value=${this._workingConfig.animation?.easing || 'linear'}
                        @input=${(e) => this._updateConfig('animation.easing', e.target.value)}
                        helper="Animation easing (e.g., linear, ease-in-out)">
                    </ha-textfield>

                    <!-- Custom Timing (when pattern = custom) -->
                    ${pattern === 'custom' ? html`
                        <ha-alert alert-type="info" style="margin-top: 16px;">
                            <strong>Custom Timing Configuration</strong>
                            <br><br>
                            Custom timing array configuration is not yet available in the visual editor.
                            Use the YAML editor (in main editor) to define per-row timing.
                            <br><br>
                            <strong>Example:</strong>
                            <pre style="margin-top: 8px; font-size: 12px; background: var(--secondary-background-color); padding: 8px; border-radius: 4px;">animation:
  timing:
    - { duration: 3000, delay: 0.1 }
    - { duration: 2000, delay: 0.2 }
    - { duration: 4000, delay: 0.3 }</pre>
                        </ha-alert>
                    ` : ''}
                ` : ''}
            </lcards-form-section>

            <!-- Change Detection -->
            <lcards-form-section
                header="Change Detection"
                description="Highlight cells when values change"
                icon="mdi:alert-circle-outline"
                ?expanded=${true}
                ?outlined=${true}>

                <ha-selector
                    .hass=${this.hass}
                    .selector=${{select: {mode: 'dropdown', options: [
                        { value: false, label: 'Disabled' },
                        { value: true, label: 'Enabled' }
                    ]}}}
                    .label=${'Highlight Changes'}
                    .value=${highlightChanges}
                    @value-changed=${(e) => this._updateConfig('animation.highlight_changes', e.detail.value)}
                    @closed=${(e) => e.stopPropagation()}>
                </ha-selector>

                ${highlightChanges ? html`
                    <ha-selector
                        .hass=${this.hass}
                        .selector=${{select: {mode: 'dropdown', options: [
                            { value: 'pulse', label: 'Pulse' },
                            { value: 'glow', label: 'Glow' },
                            { value: 'flash', label: 'Flash' }
                        ]}}}
                        .label=${'Change Animation Preset'}
                        .value=${changePreset}
                        @value-changed=${(e) => this._updateConfig('animation.change_preset', e.detail.value)}
                        @closed=${(e) => e.stopPropagation()}>
                    </ha-selector>

                    <lcards-grid-layout>
                        <ha-textfield
                            type="number"
                            label="Duration (ms)"
                            .value=${this._workingConfig.animation?.change_duration || 600}
                            @input=${(e) => this._updateConfig('animation.change_duration', parseInt(e.target.value) || 600)}
                            min="100"
                            max="5000"
                            helper="Animation duration">
                        </ha-textfield>

                        <ha-textfield
                            label="Easing"
                            .value=${this._workingConfig.animation?.change_easing || 'ease-in-out'}
                            @input=${(e) => this._updateConfig('animation.change_easing', e.target.value)}
                            helper="Easing function">
                        </ha-textfield>

                        <ha-textfield
                            type="number"
                            label="Max Cells"
                            .value=${this._workingConfig.animation?.max_highlight_cells || 10}
                            @input=${(e) => this._updateConfig('animation.max_highlight_cells', parseInt(e.target.value) || 10)}
                            min="1"
                            max="100"
                            helper="Maximum cells to animate per update">
                        </ha-textfield>
                    </lcards-grid-layout>

                    <!-- Preset-specific parameters info -->
                    <ha-alert alert-type="info">
                        <strong>${changePreset.charAt(0).toUpperCase() + changePreset.slice(1)} Preset Parameters:</strong>
                        <br><br>
                        ${changePreset === 'pulse' ? html`
                            • <strong>max_scale:</strong> Maximum scale factor (default: 1.05)<br>
                            • <strong>min_opacity:</strong> Minimum opacity (default: 0.7)
                        ` : ''}
                        ${changePreset === 'glow' ? html`
                            • <strong>color:</strong> Glow color (default: preset color)<br>
                            • <strong>blur_max:</strong> Maximum blur radius in px (default: 8)
                        ` : ''}
                        ${changePreset === 'flash' ? html`
                            • <strong>color:</strong> Flash color (default: preset color)<br>
                            • <strong>intensity:</strong> Flash intensity 0-1 (default: 0.6)
                        ` : ''}
                        <br>
                        Configure these in <code>animation.change_params</code> via the YAML tab in the main editor.
                        Visual configuration will be added in a future update.
                    </ha-alert>
                ` : ''}
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
        return html`
            <lcards-message type="info">
                <ha-icon icon="mdi:information" slot="icon"></ha-icon>
                Advanced CSS Grid properties. Use the visual designer below to configure grid layout
                with live preview, or switch to code editor for direct CSS input.
            </lcards-message>

            <lcards-visual-grid-designer
                .hass=${this.hass}
                .config=${this._workingConfig.grid || {}}
                @grid-changed=${this._handleGridChanged}
                show-preview
                show-code-editor>
            </lcards-visual-grid-designer>

            <!-- Additional Advanced Options -->
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

    /**
     * Handle grid configuration changes from visual grid designer
     */
    _handleGridChanged(e) {
        this._workingConfig.grid = {
            ...this._workingConfig.grid,
            ...e.detail.grid
        };
        
        // Also update UI state for grid dimensions if they changed
        if (e.detail.grid['grid-template-rows']) {
            this._parseGridConfigForUI();
        }
        
        this.requestUpdate();
        this._schedulePreviewUpdate();
        lcardsLog.debug('[DataGridStudioV4] Grid config updated from visual designer:', e.detail.grid);
    }

    // Old subtabs removed - Grid Styles is now a main tab, Animation is now a main tab

    _renderCssGridSubTab() {
        // This method is no longer used - advanced grid controls moved to _renderAdvancedTab
        return html``;
    }

    _renderAnimationSubTab() {
        return html`
            <lcards-form-section
                header="Cascade Animation"
                description="Background color cycling effect"
                icon="mdi:animation-play"
                ?expanded=${true}>

                ${FormField.renderField(this, 'animation.type')}

                ${this._workingConfig.animation?.type === 'cascade' ? html`
                    ${FormField.renderField(this, 'animation.pattern')}
                    ${FormField.renderField(this, 'animation.speed_multiplier')}

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
                icon="mdi:bell-alert"
                ?expanded=${true}>

                ${FormField.renderField(this, 'change_animation.preset')}
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
            delete this._workingConfig.layout;
            delete this._workingConfig.source;
            delete this._workingConfig.history_hours;
            delete this._workingConfig.value_template;

            // Ensure decorative mode defaults
            if (!this._workingConfig.format) {
                this._workingConfig.format = 'mixed';
            }
            if (this._workingConfig.refresh_interval === undefined) {
                this._workingConfig.refresh_interval = 0;
            }
        } else if (mode === 'data') {
            // Switching to data: remove decorative mode properties
            delete this._workingConfig.format;
            delete this._workingConfig.refresh_interval;

            // Initialize data mode with grid layout by default
            if (!this._workingConfig.layout) {
                this._workingConfig.layout = 'grid';
            }

            // Initialize grid mode with sample rows if needed
            if (!this._workingConfig.rows || this._workingConfig.rows.length === 0) {
                this._initializeGridRows();
            }
        }

        lcardsLog.info('[DataGridStudioV4] Mode changed:', { from: oldMode, to: mode });
    }

    _toggleGridLines(e) {
        e?.stopPropagation();
        this._showGridLines = !this._showGridLines;
        this.requestUpdate();
        // Need to update preview to inject/remove gridline styles from shadow DOM
        this._updatePreviewCard();
        lcardsLog.debug('[DataGridStudioV4] Toggled gridlines:', this._showGridLines);
    }

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
        const numRows = this._gridRows || 8;
        const numCols = this._gridColumns || 12;

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
     * Parse CSS Grid strings back to numbers for UI sliders
     * @private
     */
    _parseGridConfigForUI() {
        const grid = this._workingConfig.grid || {};

        // For data mode with actual rows, use the actual row count
        if (this._workingConfig.data_mode === 'data' && Array.isArray(this._workingConfig.rows) && this._workingConfig.rows.length > 0) {
            this._gridRows = this._workingConfig.rows.length;

            // Sync the grid template to match actual data
            const cssValue = `repeat(${this._gridRows}, auto)`;
            if (grid['grid-template-rows'] !== cssValue) {
                this._workingConfig.grid['grid-template-rows'] = cssValue;
            }
        } else {
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
        }

        // For data mode with actual rows, calculate columns from first row
        if (this._workingConfig.data_mode === 'data' && Array.isArray(this._workingConfig.rows) && this._workingConfig.rows.length > 0) {
            const firstRow = this._workingConfig.rows[0];
            if (Array.isArray(firstRow) && firstRow.length > 0) {
                this._gridColumns = firstRow.length;

                // Sync the grid template to match actual data
                const cssValue = `repeat(${this._gridColumns}, 1fr)`;
                if (grid['grid-template-columns'] !== cssValue) {
                    this._workingConfig.grid['grid-template-columns'] = cssValue;
                }
            } else {
                // Parse from grid template
                if (grid['grid-template-columns']) {
                    const match = grid['grid-template-columns'].match(/repeat\((\d+),/);
                    this._gridColumns = match ? parseInt(match[1]) : 12;
                } else if (grid.columns) {
                    this._gridColumns = grid.columns;
                } else {
                    this._gridColumns = 12;
                }
            }
        } else {
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
            gap: this._gridGap,
            actualRowsLength: this._workingConfig.rows?.length,
            mode: this._workingConfig.data_mode
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

        // Store human-readable value for UI binding
        this._gridRows = value;

        // Sync rows array for data mode
        if (this._workingConfig.data_mode === 'data' && this._workingConfig.rows) {
            const currentRows = this._workingConfig.rows.length;
            if (value > currentRows) {
                // Add empty rows
                for (let i = currentRows; i < value; i++) {
                    const emptyRow = Array(this._gridColumns).fill('');
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

        // Store human-readable value for UI binding
        this._gridColumns = value;

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

        // Store human-readable value for UI binding
        this._gridGap = value;

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
            this._workingConfig.rows[row] = Array(this._gridColumns).fill('');
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

        lcardsLog.debug('[DataGridStudioV4] Setting card config:', cardConfig);

        card.setConfig(cardConfig);
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
        const newRow = {
            values: Array(numColumns).fill(''),
            style: {},
            cellStyles: []
        };

        this._workingConfig.rows.push(newRow);

        // Sync _gridRows and update grid template
        this._gridRows = this._workingConfig.rows.length;
        const cssValue = `repeat(${this._gridRows}, auto)`;
        this._updateConfig('grid.grid-template-rows', cssValue);

        lcardsLog.info('[DataGridStudioV4] Manual row added, grid rows synced to:', this._gridRows);
        this.requestUpdate();
        this._schedulePreviewUpdate();
    }

    /**
     * Delete row in Manual mode
     */
    _deleteManualRow(index) {
        if (!this._workingConfig.rows) return;

        this._workingConfig.rows.splice(index, 1);

        // Sync _gridRows and update grid template
        this._gridRows = this._workingConfig.rows.length;
        const cssValue = `repeat(${this._gridRows}, auto)`;
        this._updateConfig('grid.grid-template-rows', cssValue);

        lcardsLog.info('[DataGridStudioV4] Manual row deleted:', index, 'grid rows synced to:', this._gridRows);
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

        // Update grid columns count and sync grid template
        this._gridColumns = (this._gridColumns || 12) + 1;
        const cssValue = `repeat(${this._gridColumns}, 1fr)`;
        this._updateConfig('grid.grid-template-columns', cssValue);

        lcardsLog.info('[DataGridStudioV4] Manual column added, grid columns synced to:', this._gridColumns);
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
     * Render inline cell editor
     */
    _renderCellEditor() {
        const { row, col, value } = this._activeCellEdit;

        // Get current cell style if it exists
        const rowData = this._workingConfig.rows[row];
        const cellStyle = (rowData && typeof rowData === 'object' && !Array.isArray(rowData))
            ? rowData.cellStyles?.[col]
            : null;
        const hasCellStyle = cellStyle && Object.keys(cellStyle).length > 0;

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
                    <ha-button appearance="plain" @click=${this._cancelCellEdit}>
                        <ha-icon icon="mdi:close" slot="icon"></ha-icon>
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

                        <lcards-grid-layout style="margin-top: 12px;">
                            <ha-textfield
                                type="text"
                                label="Font Size"
                                .value=${this._getCellStyleValue(row, col, 'font_size')}
                                @input=${(e) => this._setCellStyleValue(row, col, 'font_size', e.target.value)}
                                helper="e.g., '18px', '1.2rem'">
                            </ha-textfield>

                            <ha-textfield
                                type="number"
                                label="Font Weight"
                                .value=${this._getCellStyleValue(row, col, 'font_weight')}
                                @input=${(e) => this._setCellStyleValue(row, col, 'font_weight', e.target.value)}
                                helper="100-900">
                            </ha-textfield>
                        </lcards-grid-layout>

                        <ha-button
                            appearance="plain"
                            @click=${() => this._clearCellStyle(row, col)}
                            style="margin-top: 12px;"
                            .disabled=${!hasCellStyle}>
                            <ha-icon icon="mdi:eraser" slot="icon"></ha-icon>
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

                    <ha-button variant="danger" @click=${() => this._deleteManualRow(rowIndex)}>
                        <ha-icon icon="mdi:delete" slot="icon"></ha-icon>
                        Delete Row
                    </ha-button>

                    <ha-button appearance="plain" @click=${() => { this._activeRowEdit = null; this.requestUpdate(); }}>
                        <ha-icon icon="mdi:close" slot="icon"></ha-icon>
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

                        <lcards-grid-layout style="margin-top: 12px;">
                            <ha-textfield
                                type="text"
                                label="Font Size"
                                .value=${this._getRowStyleValue(rowIndex, 'font_size')}
                                @input=${(e) => this._setRowStyleValue(rowIndex, 'font_size', e.target.value)}
                                helper="e.g., '18px', '1.2rem'">
                            </ha-textfield>

                            <ha-textfield
                                type="number"
                                label="Font Weight"
                                .value=${this._getRowStyleValue(rowIndex, 'font_weight')}
                                @input=${(e) => this._setRowStyleValue(rowIndex, 'font_weight', e.target.value)}
                                helper="100-900">
                            </ha-textfield>
                        </lcards-grid-layout>

                        <ha-button
                            appearance="plain"
                            @click=${() => this._clearRowStyle(rowIndex)}
                            style="margin-top: 12px;"
                            .disabled=${!hasRowStyle}>
                            <ha-icon icon="mdi:eraser" slot="icon"></ha-icon>
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

                    <ha-button variant="danger" @click=${() => this._deleteColumn(colIndex)}>
                        <ha-icon icon="mdi:delete" slot="icon"></ha-icon>
                        Delete Column
                    </ha-button>

                    <ha-button appearance="plain" @click=${() => { this._activeColumnEdit = null; this.requestUpdate(); }}>
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
        const emptyRow = {
            values: Array(this._gridColumns).fill(''),
            style: {},
            cellStyles: []
        };
        this._workingConfig.rows.splice(index, 0, emptyRow);
        this._activeRowEdit = null;

        // Sync _gridRows and update grid template
        this._gridRows = this._workingConfig.rows.length;
        const cssValue = `repeat(${this._gridRows}, auto)`;
        this._updateConfig('grid.grid-template-rows', cssValue);

        lcardsLog.info('[DataGridStudioV4] Row inserted before:', index, 'grid rows synced to:', this._gridRows);
        this.requestUpdate();
        this._schedulePreviewUpdate();
    }

    _insertRowAfter(index) {
        const emptyRow = {
            values: Array(this._gridColumns).fill(''),
            style: {},
            cellStyles: []
        };
        this._workingConfig.rows.splice(index + 1, 0, emptyRow);
        this._activeRowEdit = null;

        // Sync _gridRows and update grid template
        this._gridRows = this._workingConfig.rows.length;
        const cssValue = `repeat(${this._gridRows}, auto)`;
        this._updateConfig('grid.grid-template-rows', cssValue);

        lcardsLog.info('[DataGridStudioV4] Row inserted after:', index, 'grid rows synced to:', this._gridRows);
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
        this._gridColumns++;

        // Update grid template using _updateConfig
        const cssValue = `repeat(${this._gridColumns}, 1fr)`;
        this._updateConfig('grid.grid-template-columns', cssValue);

        this._activeColumnEdit = null;
        lcardsLog.info('[DataGridStudioV4] Column inserted before:', index, 'grid columns synced to:', this._gridColumns);
        this.requestUpdate();
        this._schedulePreviewUpdate();
    }

    _insertColumnAfter(index) {
        this._workingConfig.rows.forEach(row => {
            if (row.values) {
                row.values.splice(index + 1, 0, '');
            }
        });
        this._gridColumns++;

        // Update grid template using _updateConfig
        const cssValue = `repeat(${this._gridColumns}, 1fr)`;
        this._updateConfig('grid.grid-template-columns', cssValue);

        this._activeColumnEdit = null;
        lcardsLog.info('[DataGridStudioV4] Column inserted after:', index, 'grid columns synced to:', this._gridColumns);
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
        if (index === this._gridColumns - 1) return;
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
        this._gridColumns--;

        // Update grid template using _updateConfig
        const cssValue = `repeat(${this._gridColumns}, 1fr)`;
        this._updateConfig('grid.grid-template-columns', cssValue);

        this._activeColumnEdit = null;
        lcardsLog.info('[DataGridStudioV4] Column deleted:', index, 'grid columns synced to:', this._gridColumns);
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
