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
            _basicSubTab: { type: String, state: true },
            _advancedSubTab: { type: String, state: true },
            _validationErrors: { type: Array, state: true },
            _previewMode: { type: String, state: true },
            _isEditMode: { type: Boolean, state: true },
            _gridRows: { type: Number, state: true },
            _gridColumns: { type: Number, state: true },
            _gridGap: { type: Number, state: true }
        };
    }

    constructor() {
        super();
        this.hass = null;
        this._initialConfig = null;
        this._workingConfig = {};
        this._activeTab = 'basic';
        this._basicSubTab = 'mode';
        this._advancedSubTab = 'styling';
        this._validationErrors = [];
        this._previewMode = 'live'; // 'live' or 'wysiwyg'
        this._isEditMode = false; // Initialize edit mode

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

            /* Sub-tabs styling */
            .sub-tabs {
                display: flex;
                gap: 8px;
                margin-bottom: 16px;
                border-bottom: 1px solid var(--divider-color);
                padding-bottom: 8px;
            }

            .sub-tab {
                padding: 8px 16px;
                background: transparent;
                border: 1px solid transparent;
                border-radius: 4px;
                color: var(--secondary-text-color);
                font-size: 13px;
                cursor: pointer;
                transition: all 0.2s ease;
            }

            .sub-tab:hover {
                background: var(--secondary-background-color);
                border-color: var(--divider-color);
            }

            .sub-tab.active {
                background: var(--primary-color);
                color: white;
                border-color: var(--primary-color);
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
                            class="main-tab ${this._activeTab === 'basic' ? 'active' : ''}"
                            @click=${() => this._handleMainTabChange('basic')}>
                            <ha-icon icon="mdi:view-grid"></ha-icon>
                            Basic
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
            case 'basic':
                return this._renderBasicTab();
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
        const showEditToggle = this._workingConfig.data_mode === 'manual' || this._workingConfig.data_mode === 'data-table';
        
        return html`
            <div class="preview-header">
                <span class="preview-title">Live Preview</span>
                ${showEditToggle ? html`
                    <ha-button
                        @click=${this._toggleEditMode}
                        .label=${this._isEditMode ? 'Switch to Preview' : 'Switch to Edit Mode'}>
                        <ha-icon 
                            icon=${this._isEditMode ? 'mdi:eye' : 'mdi:pencil'} 
                            slot="icon">
                        </ha-icon>
                        ${this._isEditMode ? 'Preview Mode' : 'Edit Mode'}
                    </ha-button>
                ` : ''}
            </div>
            
            ${this._isEditMode && (this._workingConfig.data_mode === 'manual' || this._workingConfig.data_mode === 'data-table') ? html`
                <div style="padding: 12px; background: var(--info-color, #2196F3); color: white; font-size: 12px;">
                    <strong>WYSIWYG Mode:</strong> Click cells to edit • Shift+Click for row • Ctrl/Cmd+Click for column
                </div>
            ` : ''}
            
            <div class="preview-container" ${ref(this._previewRef)}>
                <!-- Card will be inserted here by _updatePreviewCard() -->
            </div>
        `;
    }

    // ========================================
    // BASIC TAB (3 sub-tabs)
    // ========================================

    _renderBasicTab() {
        return html`
            <!-- Sub-tabs for Basic -->
            <div class="sub-tabs">
                <button 
                    class="sub-tab ${this._basicSubTab === 'mode' ? 'active' : ''}"
                    @click=${() => this._handleBasicSubTabChange('mode')}>
                    Mode Selection
                </button>
                <button 
                    class="sub-tab ${this._basicSubTab === 'grid' ? 'active' : ''}"
                    @click=${() => this._handleBasicSubTabChange('grid')}>
                    Grid Structure
                </button>
                <button 
                    class="sub-tab ${this._basicSubTab === 'config' ? 'active' : ''}"
                    @click=${() => this._handleBasicSubTabChange('config')}>
                    Configuration
                </button>
            </div>

            ${this._renderBasicSubTab()}
        `;
    }

    _renderBasicSubTab() {
        switch (this._basicSubTab) {
            case 'mode':
                return this._renderModeSelectionSubTab();
            case 'grid':
                return this._renderGridStructureSubTab();
            case 'config':
                return this._renderConfigurationSubTab();
            default:
                return '';
        }
    }

    _renderModeSelectionSubTab() {
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
                description: 'User-defined cell values with WYSIWYG editing'
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
        const dataMode = this._workingConfig.data_mode || 'decorative';

        switch (dataMode) {
            case 'decorative':
                return this._renderDecorativeModeConfig();
            case 'manual':
                return this._renderManualModeConfig();
            case 'data-table':
                return this._renderDataTableModeConfig();
            default:
                return '';
        }
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
        return html`
            <lcards-form-section
                header="Manual Mode Settings"
                description="Configure manual grid editing"
                ?expanded=${true}>

                <lcards-message type="info">
                    Click cells in the preview panel (WYSIWYG mode) to edit their content.
                    You can use static values or Home Assistant templates.
                </lcards-message>
            </lcards-form-section>

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

    _renderDataTableModeConfig() {
        const layout = this._workingConfig.layout || 'column-based';
        
        return html`
            <lcards-form-section
                header="Data Table Mode Settings"
                description="Configure datasource-based grid"
                ?expanded=${true}>

                <ha-selector
                    .hass=${this.hass}
                    .selector=${{select: {mode: 'dropdown', options: [
                        { value: 'column-based', label: 'Column-based (Standard Spreadsheet)' },
                        { value: 'row-timeline', label: 'Row-timeline (Historical Data)' }
                    ]}}}
                    .label=${'Layout Type'}
                    .value=${layout}
                    @value-changed=${(e) => this._updateConfig('layout', e.detail.value)}
                    @closed=${(e) => e.stopPropagation()}>
                </ha-selector>

                <lcards-message type="info">
                    ${layout === 'row-timeline' 
                        ? 'Each row represents one datasource with historical values'
                        : 'Standard spreadsheet layout with column headers'}
                </lcards-message>
            </lcards-form-section>

            ${layout === 'column-based' ? this._renderColumnBasedConfig() : this._renderRowTimelineConfig()}
        `;
    }

    /**
     * Render column-based layout configuration
     */
    _renderColumnBasedConfig() {
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
    // ADVANCED TAB (3 sub-tabs)
    // ========================================

    _renderAdvancedTab() {
        return html`
            <!-- Sub-tabs for Advanced -->
            <div class="sub-tabs">
                <button 
                    class="sub-tab ${this._advancedSubTab === 'styling' ? 'active' : ''}"
                    @click=${() => this._handleAdvancedSubTabChange('styling')}>
                    Styling
                </button>
                <button 
                    class="sub-tab ${this._advancedSubTab === 'animation' ? 'active' : ''}"
                    @click=${() => this._handleAdvancedSubTabChange('animation')}>
                    Animation
                </button>
                <button 
                    class="sub-tab ${this._advancedSubTab === 'css-grid' ? 'active' : ''}"
                    @click=${() => this._handleAdvancedSubTabChange('css-grid')}>
                    CSS Grid
                </button>
            </div>

            ${this._renderAdvancedSubTab()}
        `;
    }

    _renderAdvancedSubTab() {
        switch (this._advancedSubTab) {
            case 'styling':
                return this._renderStylingSubTab();
            case 'animation':
                return this._renderAnimationSubTab();
            case 'css-grid':
                return this._renderCssGridSubTab();
            default:
                return '';
        }
    }

    _renderStylingSubTab() {
        const isDataTableMode = this._workingConfig.data_mode === 'data-table';
        const layoutType = this._workingConfig.layout || 'column-based';
        const showHeaderStyles = isDataTableMode && layoutType === 'column-based';

        return html`
            <lcards-form-section
                header="Style Hierarchy"
                description="Visual diagram of style precedence"
                ?expanded=${true}>

                <lcards-message type="info">
                    <strong>Style Precedence (highest to lowest):</strong><br>
                    Cell Style → Row Style → Column Style → Header Style → Grid Style
                </lcards-message>
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

    _handleBasicSubTabChange(subTab) {
        this._basicSubTab = subTab;
        lcardsLog.debug('[DataGridStudioV4] Basic sub-tab changed to:', subTab);
    }

    _handleAdvancedSubTabChange(subTab) {
        this._advancedSubTab = subTab;
        lcardsLog.debug('[DataGridStudioV4] Advanced sub-tab changed to:', subTab);
    }

    _handleModeChange(mode) {
        this._updateConfig('data_mode', mode);
        lcardsLog.debug('[DataGridStudioV4] Mode changed to:', mode);
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
    _toggleEditMode() {
        lcardsLog.debug('[DataGridStudioV4] Toggle edit mode', { 
            before: this._isEditMode 
        });
        
        this._isEditMode = !this._isEditMode;
        
        lcardsLog.debug('[DataGridStudioV4] Toggle edit mode', { 
            after: this._isEditMode 
        });
        
        this.requestUpdate();
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
        
        // Add editorMode flag if in edit mode
        if (this._isEditMode) {
            cardConfig.editorMode = true;
        }
        
        card.setConfig(cardConfig);
        card.hass = this.hass;

        // Add WYSIWYG click handler if in edit mode
        if (this._isEditMode) {
            card.addEventListener('click', this._handlePreviewClick.bind(this));
            card.style.cursor = 'pointer';
        }

        // Add to container
        container.appendChild(card);

        lcardsLog.debug('[DataGridStudioV4] Preview card updated', { 
            isEditMode: this._isEditMode,
            editorMode: cardConfig.editorMode 
        });
    }

    /**
     * Handle clicks on preview card in WYSIWYG mode
     * Detects cell/row/column and opens appropriate editor
     */
    _handlePreviewClick(event) {
        // Only handle in edit mode and manual mode
        if (!this._isEditMode || this._workingConfig.data_mode !== 'manual') {
            return;
        }

        lcardsLog.debug('[DataGridStudioV4] Preview clicked', event.target);

        // The card renders in shadow DOM, so we need to get the composed path
        const path = event.composedPath();
        
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

        lcardsLog.debug('[DataGridStudioV4] Cell clicked:', { 
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

        // Data Table mode validation
        if (this._workingConfig.data_mode === 'data-table') {
            const layout = this._workingConfig.layout || 'column-based';

            if (layout === 'column-based') {
                // Column-based validation
                const columns = this._workingConfig.columns || [];
                const rows = this._workingConfig.rows || [];

                if (columns.length === 0) {
                    errors.push('Data Table (column-based): At least one column is required');
                }

                if (rows.length === 0) {
                    errors.push('Data Table (column-based): At least one row is required');
                }

                // Validate that all rows have cells for all columns
                rows.forEach((row, rowIndex) => {
                    if (!row.sources || row.sources.length < columns.length) {
                        errors.push(`Data Table (column-based): Row ${rowIndex + 1} is missing cells for all columns`);
                    }
                });

                // Validate column headers
                columns.forEach((col, colIndex) => {
                    if (!col.header || col.header.trim() === '') {
                        errors.push(`Data Table (column-based): Column ${colIndex + 1} is missing a header`);
                    }
                });
            } else if (layout === 'row-timeline') {
                // Row-timeline validation
                const rows = this._workingConfig.rows || [];

                if (rows.length === 0) {
                    errors.push('Data Table (row-timeline): At least one row is required');
                }

                // Validate that all rows have valid entity/datasource
                rows.forEach((row, rowIndex) => {
                    if (!row.source || row.source.trim() === '') {
                        errors.push(`Data Table (row-timeline): Row ${rowIndex + 1} is missing a datasource/entity`);
                    }

                    if (!row.history_hours || row.history_hours < 1 || row.history_hours > 24) {
                        errors.push(`Data Table (row-timeline): Row ${rowIndex + 1} history hours must be between 1 and 24`);
                    }
                });
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
        // TODO: Open column editor dialog
        lcardsLog.info('[DataGridStudioV4] Edit column:', index);
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
        // TODO: Open timeline row editor dialog
        lcardsLog.info('[DataGridStudioV4] Edit timeline row:', index);
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
