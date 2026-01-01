/**
 * LCARdS Data Grid Configuration Studio V3
 *
 * Complete redesign with proper tab pattern and manual card instantiation preview.
 * Fixes critical preview update issue by using manual DOM manipulation instead of
 * Lit child rendering.
 *
 * @element lcards-data-grid-studio-dialog-v3
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
import '../../cards/lcards-data-grid.js';

export class LCARdSDataGridStudioDialogV3 extends LitElement {
    static get properties() {
        return {
            hass: { type: Object },
            config: { type: Object },
            _workingConfig: { type: Object, state: true },
            _activeTab: { type: String, state: true },
            _dataSubTab: { type: String, state: true },
            _appearanceSubTab: { type: String, state: true },
            _animationSubTab: { type: String, state: true },
            _advancedSubTab: { type: String, state: true },
            _validationErrors: { type: Array, state: true },
            _expertGridMode: { type: Boolean, state: true }
        };
    }

    constructor() {
        super();
        this.hass = null;
        this.config = null;
        this._workingConfig = {};
        this._activeTab = 'data';
        this._dataSubTab = 'mode';
        this._appearanceSubTab = 'typography';
        this._animationSubTab = 'cascade';
        this._advancedSubTab = 'performance';
        this._validationErrors = [];
        this._expertGridMode = false;

        // Create ref for preview container
        this._previewRef = createRef();
    }

    connectedCallback() {
        super.connectedCallback();
        // Deep clone initial config
        this._workingConfig = JSON.parse(JSON.stringify(this.config || {}));

        // Ensure data_mode is set
        if (!this._workingConfig.data_mode) {
            this._workingConfig.data_mode = 'random';
        }

        // Ensure grid defaults
        if (!this._workingConfig.grid) {
            this._workingConfig.grid = {};
        }

        lcardsLog.debug('[DataGridStudioV3] Opened with config:', this._workingConfig);
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
            ha-tab-group {
                display: block;
                margin-bottom: 12px;
                border-bottom: 2px solid var(--divider-color);
            }

            ha-tab-group-tab {
                display: inline-flex;
                align-items: center;
                gap: 8px;
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

            .preview-container {
                min-height: 400px;
                padding: 16px;
            }

            /* Sub-tabs styling */
            .sub-tabs {
                margin-bottom: 16px;
            }

            .sub-tabs ha-tab-group {
                border-bottom: 1px solid var(--divider-color);
            }

            /* Validation Errors */
            .validation-errors {
                margin-bottom: 16px;
            }

            /* Expert mode toggle */
            .expert-toggle {
                margin: 16px 0;
            }

            /* Mode Selector Cards */
            .mode-selector {
                display: grid;
                grid-template-columns: repeat(3, 1fr);
                gap: 16px;
                margin: 16px 0;
            }

            .mode-card {
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                padding: 24px 16px;
                border: 2px solid var(--divider-color);
                border-radius: 12px;
                cursor: pointer;
                transition: all 0.2s ease;
                background: var(--card-background-color);
                text-align: center;
                min-height: 140px;
            }

            .mode-card:hover {
                border-color: var(--primary-color);
                background: var(--secondary-background-color);
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
                .heading=${'Data Grid Configuration Studio'}>

                <div class="dialog-content">
                    <!-- Main Tab Navigation -->
                    <ha-tab-group @wa-tab-show=${this._handleMainTabChange}>
                        <ha-tab-group-tab value="data" ?active=${this._activeTab === 'data'}>
                            <ha-icon icon="mdi:database"></ha-icon>
                            Data
                        </ha-tab-group-tab>
                        <ha-tab-group-tab value="appearance" ?active=${this._activeTab === 'appearance'}>
                            <ha-icon icon="mdi:palette"></ha-icon>
                            Appearance
                        </ha-tab-group-tab>
                        <ha-tab-group-tab value="animation" ?active=${this._activeTab === 'animation'}>
                            <ha-icon icon="mdi:animation"></ha-icon>
                            Animation
                        </ha-tab-group-tab>
                        <ha-tab-group-tab value="advanced" ?active=${this._activeTab === 'advanced'}>
                            <ha-icon icon="mdi:cog"></ha-icon>
                            Advanced
                        </ha-tab-group-tab>
                    </ha-tab-group>

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
            case 'data':
                return this._renderDataTab();
            case 'appearance':
                return this._renderAppearanceTab();
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
     * This is the CRITICAL fix for preview updates
     */
    _renderPreview() {
        return html`
            <div class="preview-container" ${ref(this._previewRef)}>
                <!-- Card will be inserted here by _updatePreviewCard() -->
            </div>
        `;
    }

    // ========================================
    // TAB 1: DATA (3 sub-tabs)
    // ========================================

    _renderDataTab() {
        return html`
            <!-- Sub-tabs for Data -->
            <div class="sub-tabs">
                <ha-tab-group @wa-tab-show=${this._handleDataSubTabChange}>
                    <ha-tab-group-tab value="mode" ?active=${this._dataSubTab === 'mode'}>
                        Mode & Source
                    </ha-tab-group-tab>
                    <ha-tab-group-tab value="grid" ?active=${this._dataSubTab === 'grid'}>
                        Grid Layout
                    </ha-tab-group-tab>
                    <ha-tab-group-tab value="config" ?active=${this._dataSubTab === 'config'}>
                        Data Configuration
                    </ha-tab-group-tab>
                </ha-tab-group>
            </div>

            ${this._renderDataSubTab()}
        `;
    }

    _renderDataSubTab() {
        switch (this._dataSubTab) {
            case 'mode':
                return this._renderDataModeSubTab();
            case 'grid':
                return this._renderGridLayoutSubTab();
            case 'config':
                return this._renderDataConfigSubTab();
            default:
                return '';
        }
    }

    _renderDataModeSubTab() {
        const dataMode = this._workingConfig.data_mode || 'random';

        const modes = [
            {
                id: 'random',
                icon: 'mdi:dice-multiple',
                title: 'Random',
                description: 'Auto-generated decorative data for LCARS-style ambiance'
            },
            {
                id: 'template',
                icon: 'mdi:table-edit',
                title: 'Template',
                description: 'Manual grid with Home Assistant template syntax'
            },
            {
                id: 'datasource',
                icon: 'mdi:database',
                title: 'DataSource',
                description: 'Real-time data from entities or DataSources'
            }
        ];

        return html`
            <lcards-form-section
                header="Data Mode"
                description="Choose how the grid receives its data"
                ?expanded=${true}>

                <div class="mode-selector">
                    ${modes.map(mode => html`
                        <div
                            class="mode-card ${dataMode === mode.id ? 'active' : ''}"
                            @click=${() => this._updateConfig('data_mode', mode.id)}>
                            <ha-icon class="mode-icon" icon="${mode.icon}"></ha-icon>
                            <div class="mode-title">${mode.title}</div>
                            <div class="mode-description">${mode.description}</div>
                        </div>
                    `)}
                </div>
            </lcards-form-section>
        `;
    }

    _renderGridLayoutSubTab() {
        return html`
            <lcards-form-section
                header="Grid Dimensions"
                description="Configure rows and columns"
                ?expanded=${true}>

                <ha-textfield
                    type="text"
                    label="Grid Template Columns"
                    .value=${this._workingConfig.grid?.['grid-template-columns'] || ''}
                    @input=${(e) => this._updateConfig('grid.grid-template-columns', e.target.value)}
                    helper="CSS Grid columns (e.g., 'repeat(12, 1fr)')">
                </ha-textfield>

                <ha-textfield
                    type="text"
                    label="Grid Template Rows"
                    .value=${this._workingConfig.grid?.['grid-template-rows'] || ''}
                    @input=${(e) => this._updateConfig('grid.grid-template-rows', e.target.value)}
                    helper="CSS Grid rows (e.g., 'repeat(8, auto)')">
                </ha-textfield>

                <ha-textfield
                    type="text"
                    label="Gap"
                    .value=${this._workingConfig.grid?.gap || ''}
                    @input=${(e) => this._updateConfig('grid.gap', e.target.value)}
                    helper="Uniform spacing (e.g., '8px')">
                </ha-textfield>
            </lcards-form-section>

            <!-- Expert Grid Mode Toggle -->
            <div class="expert-toggle">
                <ha-formfield label="Expert Grid Mode (Show all CSS Grid properties)">
                    <ha-switch
                        .checked=${this._expertGridMode}
                        @change=${(e) => { this._expertGridMode = e.target.checked; this.requestUpdate(); }}>
                    </ha-switch>
                </ha-formfield>
            </div>

            ${this._expertGridMode ? this._renderExpertGridProperties() : ''}
        `;
    }

    _renderExpertGridProperties() {
        return html`
            <lcards-form-section
                header="Advanced Grid Properties"
                description="Full CSS Grid control"
                ?expanded=${true}>

                <lcards-grid-layout columns="2">
                    <ha-textfield
                        label="Row Gap"
                        .value=${this._workingConfig.grid?.['row-gap'] || ''}
                        @input=${(e) => this._updateConfig('grid.row-gap', e.target.value)}>
                    </ha-textfield>

                    <ha-textfield
                        label="Column Gap"
                        .value=${this._workingConfig.grid?.['column-gap'] || ''}
                        @input=${(e) => this._updateConfig('grid.column-gap', e.target.value)}>
                    </ha-textfield>

                    <ha-textfield
                        label="Auto Columns"
                        .value=${this._workingConfig.grid?.['grid-auto-columns'] || ''}
                        @input=${(e) => this._updateConfig('grid.grid-auto-columns', e.target.value)}>
                    </ha-textfield>

                    <ha-textfield
                        label="Auto Rows"
                        .value=${this._workingConfig.grid?.['grid-auto-rows'] || ''}
                        @input=${(e) => this._updateConfig('grid.grid-auto-rows', e.target.value)}>
                    </ha-textfield>
                </lcards-grid-layout>

                <ha-selector
                    .hass=${this.hass}
                    .selector=${{select: {mode: 'dropdown', options: [
                        { value: 'row', label: 'Row' },
                        { value: 'column', label: 'Column' },
                        { value: 'dense', label: 'Dense' },
                        { value: 'row dense', label: 'Row Dense' },
                        { value: 'column dense', label: 'Column Dense' }
                    ]}}}
                    .label=${'Auto Flow'}
                    .value=${this._workingConfig.grid?.['grid-auto-flow'] || 'row'}
                    @value-changed=${(e) => this._updateConfig('grid.grid-auto-flow', e.detail.value)}
                    @closed=${(e) => e.stopPropagation()}>
                </ha-selector>

                <lcards-grid-layout columns="2">
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

                    <ha-selector
                        .hass=${this.hass}
                        .selector=${{select: {mode: 'dropdown', options: [
                            { value: '', label: 'Default' },
                            { value: 'start', label: 'Start' },
                            { value: 'end', label: 'End' },
                            { value: 'center', label: 'Center' },
                            { value: 'space-between', label: 'Space Between' },
                            { value: 'space-around', label: 'Space Around' },
                            { value: 'space-evenly', label: 'Space Evenly' }
                        ]}}}
                        .label=${'Justify Content'}
                        .value=${this._workingConfig.grid?.['justify-content'] || ''}
                        @value-changed=${(e) => this._updateConfig('grid.justify-content', e.detail.value)}
                        @closed=${(e) => e.stopPropagation()}>
                    </ha-selector>

                    <ha-selector
                        .hass=${this.hass}
                        .selector=${{select: {mode: 'dropdown', options: [
                            { value: '', label: 'Default' },
                            { value: 'start', label: 'Start' },
                            { value: 'end', label: 'End' },
                            { value: 'center', label: 'Center' },
                            { value: 'space-between', label: 'Space Between' },
                            { value: 'space-around', label: 'Space Around' },
                            { value: 'space-evenly', label: 'Space Evenly' }
                        ]}}}
                        .label=${'Align Content'}
                        .value=${this._workingConfig.grid?.['align-content'] || ''}
                        @value-changed=${(e) => this._updateConfig('grid.align-content', e.detail.value)}
                        @closed=${(e) => e.stopPropagation()}>
                    </ha-selector>
                </lcards-grid-layout>
            </lcards-form-section>
        `;
    }

    _renderDataConfigSubTab() {
        const dataMode = this._workingConfig.data_mode || 'random';

        switch (dataMode) {
            case 'random':
                return this._renderRandomConfig();
            case 'template':
                return this._renderTemplateConfig();
            case 'datasource':
                return this._renderDataSourceConfig();
            default:
                return html`<p>Select a data mode first.</p>`;
        }
    }

    _renderRandomConfig() {
        return html`
            <lcards-form-section
                header="Random Data Settings"
                ?expanded=${true}>

                <ha-selector
                    .hass=${this.hass}
                    .selector=${{select: {mode: 'dropdown', options: [
                        { value: 'digit', label: 'Digit (0042)' },
                        { value: 'float', label: 'Float (42.17)' },
                        { value: 'alpha', label: 'Alpha (AB)' },
                        { value: 'hex', label: 'Hex (A3F1)' },
                        { value: 'mixed', label: 'Mixed' }
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

    _renderTemplateConfig() {
        return html`
            <lcards-form-section
                header="Template Configuration"
                ?expanded=${true}>

                <lcards-message
                    type="info"
                    message="Template mode allows manual grid configuration. Use the main editor's Configuration tab to open the Template Editor dialog for full row editing.">
                </lcards-message>

                <ha-alert alert-type="info">
                    Template row editing is available in the main Data Grid Editor.
                    Close this studio and use the "Open Configuration Studio" button for template editing.
                </ha-alert>
            </lcards-form-section>
        `;
    }

    _renderDataSourceConfig() {
        const layout = this._workingConfig.layout || 'timeline';

        return html`
            <lcards-form-section
                header="DataSource Settings"
                ?expanded=${true}>

                <ha-selector
                    .hass=${this.hass}
                    .selector=${{select: {mode: 'dropdown', options: [
                        { value: 'timeline', label: 'Timeline (Flowing Data)' },
                        { value: 'spreadsheet', label: 'Spreadsheet (Structured Grid)' }
                    ]}}}
                    .label=${'Layout Type'}
                    .value=${layout}
                    @value-changed=${(e) => this._updateConfig('layout', e.detail.value)}
                    @closed=${(e) => e.stopPropagation()}>
                </ha-selector>

                ${layout === 'timeline' ? html`
                    <ha-textfield
                        label="Data Source"
                        .value=${this._workingConfig.source || ''}
                        @input=${(e) => this._updateConfig('source', e.target.value)}
                        helper="Entity ID or DataSource name">
                    </ha-textfield>

                    <ha-textfield
                        type="number"
                        label="History Hours"
                        .value=${this._workingConfig.history_hours || 1}
                        @input=${(e) => this._updateConfig('history_hours', parseInt(e.target.value) || 1)}
                        helper="Hours of historical data to preload">
                    </ha-textfield>

                    <ha-textfield
                        label="Value Template"
                        .value=${this._workingConfig.value_template || '{value}'}
                        @input=${(e) => this._updateConfig('value_template', e.target.value)}
                        helper="Format template (e.g., '{value}°C')">
                    </ha-textfield>
                ` : html`
                    <lcards-message
                        type="info"
                        message="Spreadsheet layout configuration is available in the main editor. Close this studio to access the Spreadsheet Editor.">
                    </lcards-message>
                `}
            </lcards-form-section>
        `;
    }

    // ========================================
    // TAB 2: APPEARANCE (4 sub-tabs)
    // ========================================

    _renderAppearanceTab() {
        return html`
            <!-- Sub-tabs for Appearance -->
            <div class="sub-tabs">
                <ha-tab-group @wa-tab-show=${this._handleAppearanceSubTabChange}>
                    <ha-tab-group-tab value="typography" ?active=${this._appearanceSubTab === 'typography'}>
                        Typography
                    </ha-tab-group-tab>
                    <ha-tab-group-tab value="colors" ?active=${this._appearanceSubTab === 'colors'}>
                        Colors
                    </ha-tab-group-tab>
                    <ha-tab-group-tab value="borders" ?active=${this._appearanceSubTab === 'borders'}>
                        Borders
                    </ha-tab-group-tab>
                    ${this._shouldShowHeaderStyleTab() ? html`
                        <ha-tab-group-tab value="header" ?active=${this._appearanceSubTab === 'header'}>
                            Header Style
                        </ha-tab-group-tab>
                    ` : ''}
                </ha-tab-group>
            </div>

            ${this._renderAppearanceSubTab()}
        `;
    }

    _shouldShowHeaderStyleTab() {
        return this._workingConfig.data_mode === 'datasource' &&
               this._workingConfig.layout === 'spreadsheet';
    }

    _renderAppearanceSubTab() {
        switch (this._appearanceSubTab) {
            case 'typography':
                return this._renderTypographySubTab();
            case 'colors':
                return this._renderColorsSubTab();
            case 'borders':
                return this._renderBordersSubTab();
            case 'header':
                return this._renderHeaderStyleSubTab();
            default:
                return '';
        }
    }

    _renderTypographySubTab() {
        return html`
            <lcards-form-section
                header="Typography"
                description="Font settings for all cells"
                ?expanded=${true}>

                <ha-textfield
                    type="text"
                    label="Font Size"
                    .value=${this._workingConfig.style?.font_size || ''}
                    @input=${(e) => this._updateConfig('style.font_size', e.target.value)}
                    helper="Font size (e.g., '18px', '1.2rem')">
                </ha-textfield>

                <ha-textfield
                    label="Font Family"
                    .value=${this._workingConfig.style?.font_family || ''}
                    @input=${(e) => this._updateConfig('style.font_family', e.target.value)}
                    helper="Font family (e.g., 'Antonio', 'Arial')">
                </ha-textfield>

                <ha-textfield
                    type="number"
                    label="Font Weight"
                    .value=${this._workingConfig.style?.font_weight || ''}
                    @input=${(e) => this._updateConfig('style.font_weight', e.target.value)}
                    helper="Font weight (100-900)">
                </ha-textfield>

                <ha-selector
                    .hass=${this.hass}
                    .selector=${{select: {mode: 'dropdown', options: [
                        { value: 'left', label: 'Left' },
                        { value: 'center', label: 'Center' },
                        { value: 'right', label: 'Right' }
                    ]}}}
                    .label=${'Text Alignment'}
                    .value=${this._workingConfig.style?.align || 'right'}
                    @value-changed=${(e) => this._updateConfig('style.align', e.detail.value)}
                    @closed=${(e) => e.stopPropagation()}>
                </ha-selector>

                <ha-textfield
                    label="Padding"
                    .value=${this._workingConfig.style?.padding || ''}
                    @input=${(e) => this._updateConfig('style.padding', e.target.value)}
                    helper="Cell padding (e.g., '8px', '4px 8px')">
                </ha-textfield>
            </lcards-form-section>
        `;
    }

    _renderColorsSubTab() {
        return html`
            <lcards-color-section
                .editor=${this}
                header="Grid-Wide Colors"
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

    _renderBordersSubTab() {
        return html`
            <lcards-form-section
                header="Cell Borders"
                description="Border styling for all cells"
                ?expanded=${true}>

                <ha-textfield
                    type="number"
                    label="Border Width"
                    .value=${this._workingConfig.style?.border_width || ''}
                    @input=${(e) => this._updateConfig('style.border_width', parseInt(e.target.value) || 0)}
                    helper="Border width in pixels">
                </ha-textfield>

                <ha-textfield
                    label="Border Color"
                    .value=${this._workingConfig.style?.border_color || ''}
                    @input=${(e) => this._updateConfig('style.border_color', e.target.value)}
                    helper="Border color">
                </ha-textfield>

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

    _renderHeaderStyleSubTab() {
        return html`
            <lcards-form-section
                header="Header Row Style"
                description="Styling for spreadsheet header row"
                ?expanded=${true}>

                <ha-textfield
                    type="number"
                    label="Font Size"
                    .value=${this._workingConfig.header_style?.font_size || ''}
                    @input=${(e) => this._updateConfig('header_style.font_size', parseInt(e.target.value) || 0)}
                    helper="Header font size in pixels">
                </ha-textfield>

                <ha-textfield
                    type="number"
                    label="Font Weight"
                    .value=${this._workingConfig.header_style?.font_weight || ''}
                    @input=${(e) => this._updateConfig('header_style.font_weight', parseInt(e.target.value) || 0)}
                    helper="Header font weight (100-900)">
                </ha-textfield>

                <ha-selector
                    .hass=${this.hass}
                    .selector=${{select: {mode: 'dropdown', options: [
                        { value: 'none', label: 'None' },
                        { value: 'uppercase', label: 'Uppercase' },
                        { value: 'lowercase', label: 'Lowercase' },
                        { value: 'capitalize', label: 'Capitalize' }
                    ]}}}
                    .label=${'Text Transform'}
                    .value=${this._workingConfig.header_style?.text_transform || 'uppercase'}
                    @value-changed=${(e) => this._updateConfig('header_style.text_transform', e.detail.value)}
                    @closed=${(e) => e.stopPropagation()}>
                </ha-selector>

                <lcards-color-section
                    .editor=${this}
                    header="Header Colors"
                    .colorPaths=${[
                        { path: 'header_style.color', label: 'Text Color', helper: 'Header text color' },
                        { path: 'header_style.background', label: 'Background Color', helper: 'Header background' }
                    ]}
                    ?expanded=${true}
                    ?useColorPicker=${true}>
                </lcards-color-section>

                <ha-textfield
                    label="Padding"
                    .value=${this._workingConfig.header_style?.padding || ''}
                    @input=${(e) => this._updateConfig('header_style.padding', e.target.value)}
                    helper="Header padding (e.g., '12px 8px')">
                </ha-textfield>

                <ha-textfield
                    type="number"
                    label="Bottom Border Width"
                    .value=${this._workingConfig.header_style?.border_bottom_width || ''}
                    @input=${(e) => this._updateConfig('header_style.border_bottom_width', parseInt(e.target.value) || 0)}
                    helper="Bottom border width in pixels">
                </ha-textfield>

                <ha-textfield
                    label="Bottom Border Color"
                    .value=${this._workingConfig.header_style?.border_bottom_color || ''}
                    @input=${(e) => this._updateConfig('header_style.border_bottom_color', e.target.value)}
                    helper="Bottom border color">
                </ha-textfield>

                <ha-selector
                    .hass=${this.hass}
                    .selector=${{select: {mode: 'dropdown', options: [
                        { value: 'solid', label: 'Solid' },
                        { value: 'dashed', label: 'Dashed' },
                        { value: 'dotted', label: 'Dotted' }
                    ]}}}
                    .label=${'Bottom Border Style'}
                    .value=${this._workingConfig.header_style?.border_bottom_style || 'solid'}
                    @value-changed=${(e) => this._updateConfig('header_style.border_bottom_style', e.detail.value)}
                    @closed=${(e) => e.stopPropagation()}>
                </ha-selector>
            </lcards-form-section>
        `;
    }

    // ========================================
    // TAB 3: ANIMATION (2 sub-tabs)
    // ========================================

    _renderAnimationTab() {
        return html`
            <!-- Sub-tabs for Animation -->
            <div class="sub-tabs">
                <ha-tab-group @wa-tab-show=${this._handleAnimationSubTabChange}>
                    <ha-tab-group-tab value="cascade" ?active=${this._animationSubTab === 'cascade'}>
                        Cascade
                    </ha-tab-group-tab>
                    <ha-tab-group-tab value="changes" ?active=${this._animationSubTab === 'changes'}>
                        Change Detection
                    </ha-tab-group-tab>
                </ha-tab-group>
            </div>

            ${this._renderAnimationSubTab()}
        `;
    }

    _renderAnimationSubTab() {
        switch (this._animationSubTab) {
            case 'cascade':
                return this._renderCascadeSubTab();
            case 'changes':
                return this._renderChangeDetectionSubTab();
            default:
                return '';
        }
    }

    _renderCascadeSubTab() {
        const animationType = this._workingConfig.animation?.type || 'none';

        return html`
            <lcards-form-section
                header="Cascade Animation"
                description="Waterfall color cycling effect"
                ?expanded=${true}>

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

                ${animationType === 'cascade' ? html`
                    <ha-selector
                        .hass=${this.hass}
                        .selector=${{select: {mode: 'dropdown', options: [
                            { value: 'default', label: 'Default (Varied Organic)' },
                            { value: 'niagara', label: 'Niagara (Smooth Uniform)' },
                            { value: 'fast', label: 'Fast (Quick Waterfall)' },
                            { value: 'custom', label: 'Custom' }
                        ]}}}
                        .label=${'Timing Pattern'}
                        .value=${this._workingConfig.animation?.pattern || 'default'}
                        @value-changed=${(e) => this._updateConfig('animation.pattern', e.detail.value)}
                        @closed=${(e) => e.stopPropagation()}>
                    </ha-selector>

                    <lcards-color-section
                        .editor=${this}
                        header="Cascade Colors"
                        description="3-color cycle"
                        .colorPaths=${[
                            { path: 'animation.colors.start', label: 'Start Color', helper: 'Starting color (75% dwell)' },
                            { path: 'animation.colors.text', label: 'Middle Color', helper: 'Middle color (10% snap)' },
                            { path: 'animation.colors.end', label: 'End Color', helper: 'Ending color (10% brief)' }
                        ]}
                        ?expanded=${true}
                        ?useColorPicker=${true}>
                    </lcards-color-section>

                    <ha-textfield
                        type="number"
                        label="Speed Multiplier"
                        .value=${this._workingConfig.animation?.speed_multiplier || 1.0}
                        @input=${(e) => this._updateConfig('animation.speed_multiplier', parseFloat(e.target.value) || 1.0)}
                        helper="Animation speed (2.0 = 2x fast, 0.5 = half speed)"
                        step="0.1"
                        min="0.1"
                        max="10">
                    </ha-textfield>

                    <ha-textfield
                        type="number"
                        label="Override Duration (ms)"
                        .value=${this._workingConfig.animation?.duration || ''}
                        @input=${(e) => this._updateConfig('animation.duration', parseInt(e.target.value) || undefined)}
                        helper="Override all row durations (leave empty for pattern timing)">
                    </ha-textfield>

                    <ha-textfield
                        label="Easing Function"
                        .value=${this._workingConfig.animation?.easing || 'linear'}
                        @input=${(e) => this._updateConfig('animation.easing', e.target.value)}
                        helper="Animation easing (e.g., 'linear', 'ease-in-out')">
                    </ha-textfield>
                ` : ''}
            </lcards-form-section>
        `;
    }

    _renderChangeDetectionSubTab() {
        const highlightChanges = this._workingConfig.animation?.highlight_changes || false;

        return html`
            <lcards-form-section
                header="Change Detection"
                description="Highlight cells when values change"
                ?expanded=${true}>

                <ha-formfield label="Highlight Changes">
                    <ha-switch
                        .checked=${highlightChanges}
                        @change=${(e) => this._updateConfig('animation.highlight_changes', e.target.checked)}>
                    </ha-switch>
                </ha-formfield>

                ${highlightChanges ? html`
                    <ha-selector
                        .hass=${this.hass}
                        .selector=${{select: {mode: 'dropdown', options: [
                            { value: 'pulse', label: 'Pulse (Scale & Fade)' },
                            { value: 'glow', label: 'Glow (Shadow Effect)' },
                            { value: 'flash', label: 'Flash (Background Color)' }
                        ]}}}
                        .label=${'Change Animation Preset'}
                        .value=${this._workingConfig.animation?.change_preset || 'pulse'}
                        @value-changed=${(e) => this._updateConfig('animation.change_preset', e.detail.value)}
                        @closed=${(e) => e.stopPropagation()}>
                    </ha-selector>

                    <ha-textfield
                        type="number"
                        label="Duration (ms)"
                        .value=${this._workingConfig.animation?.change_duration || 500}
                        @input=${(e) => this._updateConfig('animation.change_duration', parseInt(e.target.value) || 500)}
                        helper="Animation duration">
                    </ha-textfield>

                    <ha-textfield
                        label="Easing"
                        .value=${this._workingConfig.animation?.change_easing || 'easeOutQuad'}
                        @input=${(e) => this._updateConfig('animation.change_easing', e.target.value)}
                        helper="Easing function">
                    </ha-textfield>

                    <ha-textfield
                        type="number"
                        label="Max Cells"
                        .value=${this._workingConfig.animation?.max_highlight_cells || 50}
                        @input=${(e) => this._updateConfig('animation.max_highlight_cells', parseInt(e.target.value) || 50)}
                        helper="Maximum cells to animate per update">
                    </ha-textfield>
                ` : ''}
            </lcards-form-section>
        `;
    }

    // ========================================
    // TAB 4: ADVANCED (3 sub-tabs)
    // ========================================

    _renderAdvancedTab() {
        return html`
            <!-- Sub-tabs for Advanced -->
            <div class="sub-tabs">
                <ha-tab-group @wa-tab-show=${this._handleAdvancedSubTabChange}>
                    <ha-tab-group-tab value="performance" ?active=${this._advancedSubTab === 'performance'}>
                        Performance
                    </ha-tab-group-tab>
                    <ha-tab-group-tab value="metadata" ?active=${this._advancedSubTab === 'metadata'}>
                        Metadata
                    </ha-tab-group-tab>
                    <ha-tab-group-tab value="expert" ?active=${this._advancedSubTab === 'expert'}>
                        Expert Settings
                    </ha-tab-group-tab>
                </ha-tab-group>
            </div>

            ${this._renderAdvancedSubTab()}
        `;
    }

    _renderAdvancedSubTab() {
        switch (this._advancedSubTab) {
            case 'performance':
                return this._renderPerformanceSubTab();
            case 'metadata':
                return this._renderMetadataSubTab();
            case 'expert':
                return this._renderExpertSubTab();
            default:
                return '';
        }
    }

    _renderPerformanceSubTab() {
        return html`
            <lcards-form-section
                header="Performance Settings"
                description="Optimization for large grids"
                ?expanded=${true}>

                <lcards-message
                    type="info"
                    message="For large grids (100+ cells), consider: reducing refresh_interval, limiting max_highlight_cells, or disabling animations.">
                </lcards-message>

                <ha-textfield
                    type="number"
                    label="Refresh Interval (ms)"
                    .value=${this._workingConfig.refresh_interval || 0}
                    @input=${(e) => this._updateConfig('refresh_interval', parseInt(e.target.value) || 0)}
                    helper="Auto-refresh interval (0 = disabled, higher = better performance)">
                </ha-textfield>

                <ha-textfield
                    type="number"
                    label="Max Highlight Cells"
                    .value=${this._workingConfig.animation?.max_highlight_cells || 50}
                    @input=${(e) => this._updateConfig('animation.max_highlight_cells', parseInt(e.target.value) || 50)}
                    helper="Maximum cells to animate per update (lower = better performance)">
                </ha-textfield>
            </lcards-form-section>
        `;
    }

    _renderMetadataSubTab() {
        return html`
            <lcards-form-section
                header="Card Metadata"
                description="Identification and categorization"
                ?expanded=${true}>

                <ha-textfield
                    label="Card ID"
                    .value=${this._workingConfig.id || ''}
                    @input=${(e) => this._updateConfig('id', e.target.value)}
                    helper="Unique identifier for rules engine targeting">
                </ha-textfield>

                <ha-textfield
                    label="Tags"
                    .value=${(this._workingConfig.tags || []).join(', ')}
                    @input=${(e) => {
                        const tags = e.target.value.split(',').map(t => t.trim()).filter(t => t);
                        this._updateConfig('tags', tags);
                    }}
                    helper="Comma-separated tags for rules engine categorization">
                </ha-textfield>
            </lcards-form-section>
        `;
    }

    _renderExpertSubTab() {
        return html`
            <lcards-form-section
                header="Expert Settings"
                description="Advanced configuration options"
                ?expanded=${true}>

                <lcards-message
                    type="warning"
                    message="These settings are for advanced users. Incorrect values may cause rendering issues.">
                </lcards-message>

                <ha-alert alert-type="info">
                    Expert settings like custom animation timing arrays and complex DataSource configurations
                    should be edited in the main editor's YAML tab for full control.
                </ha-alert>
            </lcards-form-section>
        `;
    }

    // ========================================
    // Event Handlers
    // ========================================

    /**
     * Handle main tab change
     * CRITICAL: Stops event propagation to prevent bubbling
     */
    _handleMainTabChange(event) {
        event.stopPropagation(); // CRITICAL: Prevent bubbling

        const tab = event.target.activeTab?.getAttribute('value');
        if (tab && tab !== this._activeTab) {
            this._activeTab = tab;
            lcardsLog.debug(`[StudioV3] Main tab changed to: ${tab}`);
        }
    }

    /**
     * Handle Data sub-tab change
     * CRITICAL: Must stop propagation for nested tabs
     */
    _handleDataSubTabChange(event) {
        event.stopPropagation(); // CRITICAL: Prevent bubbling to main handler

        const tab = event.target.activeTab?.getAttribute('value');
        if (tab && tab !== this._dataSubTab) {
            this._dataSubTab = tab;
            lcardsLog.debug(`[StudioV3] Data sub-tab changed to: ${tab}`);
        }
    }

    /**
     * Handle Appearance sub-tab change
     */
    _handleAppearanceSubTabChange(event) {
        event.stopPropagation();

        const tab = event.target.activeTab?.getAttribute('value');
        if (tab && tab !== this._appearanceSubTab) {
            this._appearanceSubTab = tab;
            lcardsLog.debug(`[StudioV3] Appearance sub-tab changed to: ${tab}`);
        }
    }

    /**
     * Handle Animation sub-tab change
     */
    _handleAnimationSubTabChange(event) {
        event.stopPropagation();

        const tab = event.target.activeTab?.getAttribute('value');
        if (tab && tab !== this._animationSubTab) {
            this._animationSubTab = tab;
            lcardsLog.debug(`[StudioV3] Animation sub-tab changed to: ${tab}`);
        }
    }

    /**
     * Handle Advanced sub-tab change
     */
    _handleAdvancedSubTabChange(event) {
        event.stopPropagation();

        const tab = event.target.activeTab?.getAttribute('value');
        if (tab && tab !== this._advancedSubTab) {
            this._advancedSubTab = tab;
            lcardsLog.debug(`[StudioV3] Advanced sub-tab changed to: ${tab}`);
        }
    }

    // ========================================
    // Config Update Methods
    // ========================================

    /**
     * UNIFIED config update - ONLY method to modify config
     * Triggers Lit reactivity by creating new reference
     *
     * @param {string} path - Dot-separated path (e.g., 'style.font_size')
     * @param {*} value - New value
     */
    _updateConfig(path, value) {
        if (!path) return;

        // Deep clone entire config
        const newConfig = JSON.parse(JSON.stringify(this._workingConfig));

        // Navigate path and set value
        const keys = path.split('.');
        const lastKey = keys.pop();
        let target = newConfig;

        for (const key of keys) {
            if (!target[key]) target[key] = {};
            target = target[key];
        }

        target[lastKey] = value;

        // Atomic assignment - triggers Lit reactivity
        this._workingConfig = newConfig;

        lcardsLog.debug(`[StudioV3] Config updated: ${path}`, value);
    }

    /**
     * Alias for compatibility with lcards-color-section
     */
    _setConfigValue(path, value) {
        this._updateConfig(path, value);
    }

    /**
     * Alias for compatibility
     */
    _updateConfigValue(path, value) {
        this._updateConfig(path, value);
    }

    /**
     * Get config value - required by lcards-color-section
     */
    _getConfigValue(path) {
        if (!path) return undefined;

        const keys = path.split('.');
        let value = this._workingConfig;

        for (const key of keys) {
            if (value === undefined || value === null) return undefined;
            value = value[key];
        }

        return value;
    }

    // ========================================
    // Preview Update (CRITICAL)
    // ========================================

    /**
     * Lifecycle hook - detect config changes and update preview
     * This is the CRITICAL fix for preview updates
     */
    updated(changedProperties) {
        super.updated(changedProperties);

        if (changedProperties.has('_workingConfig')) {
            this._updatePreviewCard();
        }
    }

    /**
     * Manual card instantiation and replacement
     * This pattern works 100% reliably vs Lit child rendering
     */
    _updatePreviewCard() {
        if (!this._previewRef.value) return;

        // Remove existing card
        while (this._previewRef.value.firstChild) {
            this._previewRef.value.firstChild.remove();
        }

        // Create new card instance
        const card = document.createElement('lcards-data-grid');
        card.hass = this.hass;

        // Deep clone config to prevent mutations
        const clonedConfig = JSON.parse(JSON.stringify(this._workingConfig));
        card.setConfig(clonedConfig);

        // Insert into container
        this._previewRef.value.appendChild(card);

        lcardsLog.debug('[StudioV3] Preview card updated');
    }

    // ========================================
    // Validation & Save/Cancel
    // ========================================

    _validateConfig() {
        this._validationErrors = [];

        // Basic validation
        if (!this._workingConfig.data_mode) {
            this._validationErrors.push('Data mode is required');
        }

        if (this._workingConfig.data_mode === 'template' && !this._workingConfig.rows?.length) {
            this._validationErrors.push('Template mode requires at least one row');
        }

        if (this._workingConfig.data_mode === 'datasource') {
            if (!this._workingConfig.layout) {
                this._validationErrors.push('DataSource mode requires layout selection');
            }
            if (this._workingConfig.layout === 'timeline' && !this._workingConfig.source) {
                this._validationErrors.push('Timeline layout requires a data source');
            }
            if (this._workingConfig.layout === 'spreadsheet' && !this._workingConfig.columns?.length) {
                this._validationErrors.push('Spreadsheet layout requires at least one column');
            }
        }

        return this._validationErrors.length === 0;
    }

    _handleSave() {
        if (!this._validateConfig()) {
            lcardsLog.warn('[StudioV3] Validation failed:', this._validationErrors);
            this.requestUpdate(); // Force re-render to show errors
            return;
        }

        lcardsLog.info('[StudioV3] Saving config:', this._workingConfig);

        this.dispatchEvent(new CustomEvent('config-changed', {
            detail: { config: this._workingConfig },
            bubbles: true,
            composed: true
        }));

        this._handleClose();
    }

    _handleCancel() {
        lcardsLog.debug('[StudioV3] Cancelled, discarding changes');
        this._handleClose();
    }

    _handleClose() {
        this.dispatchEvent(new CustomEvent('closed', {
            bubbles: true,
            composed: true
        }));
    }
}

customElements.define('lcards-data-grid-studio-dialog-v3', LCARdSDataGridStudioDialogV3);
