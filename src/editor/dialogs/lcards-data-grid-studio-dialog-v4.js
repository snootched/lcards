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
            config: { type: Object },
            _workingConfig: { type: Object, state: true },
            _activeTab: { type: String, state: true },
            _basicSubTab: { type: String, state: true },
            _advancedSubTab: { type: String, state: true },
            _validationErrors: { type: Array, state: true },
            _previewMode: { type: String, state: true }
        };
    }

    constructor() {
        super();
        this.hass = null;
        this.config = null;
        this._workingConfig = {};
        this._activeTab = 'basic';
        this._basicSubTab = 'mode';
        this._advancedSubTab = 'styling';
        this._validationErrors = [];
        this._previewMode = 'live'; // 'live' or 'wysiwyg'

        // Create ref for preview container
        this._previewRef = createRef();
        
        // Debounce timer for preview updates
        this._previewUpdateTimer = null;
        
        // Active overlay editor reference
        this._activeOverlay = null;
    }

    connectedCallback() {
        super.connectedCallback();
        // Deep clone initial config
        this._workingConfig = JSON.parse(JSON.stringify(this.config || {}));

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
                rows: 8,
                columns: 12,
                gap: 8
            };
        }

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
        return html`
            <div class="preview-header">
                <span class="preview-title">Live Preview</span>
                <div class="preview-mode-toggle">
                    <button 
                        class="preview-mode-btn ${this._previewMode === 'live' ? 'active' : ''}"
                        @click=${() => this._setPreviewMode('live')}>
                        Live
                    </button>
                    <button 
                        class="preview-mode-btn ${this._previewMode === 'wysiwyg' ? 'active' : ''}"
                        @click=${() => this._setPreviewMode('wysiwyg')}"
                        ?disabled=${this._workingConfig.data_mode !== 'manual'}>
                        WYSIWYG
                    </button>
                </div>
            </div>
            
            ${this._previewMode === 'wysiwyg' && this._workingConfig.data_mode === 'manual' ? html`
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

                <ha-button @click=${this._openTemplateHelper}>
                    <ha-icon icon="mdi:code-braces" slot="icon"></ha-icon>
                    Template Syntax Helper
                </ha-button>
            </lcards-form-section>
        `;
    }

    _renderDataTableModeConfig() {
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
                    .value=${this._workingConfig.layout || 'column-based'}
                    @value-changed=${(e) => this._updateConfig('layout', e.detail.value)}
                    @closed=${(e) => e.stopPropagation()}>
                </ha-selector>

                <lcards-message type="info">
                    ${this._workingConfig.layout === 'row-timeline' 
                        ? 'Each row represents one datasource with historical values'
                        : 'Standard spreadsheet layout with column headers'}
                </lcards-message>
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
                        .value=${this._workingConfig.grid?.rows || 8}
                        @input=${(e) => this._updateConfig('grid.rows', parseInt(e.target.value) || 1)}
                        min="1"
                        max="50"
                        helper="Number of rows">
                    </ha-textfield>

                    <ha-textfield
                        type="number"
                        label="Columns"
                        .value=${this._workingConfig.grid?.columns || 12}
                        @input=${(e) => this._updateConfig('grid.columns', parseInt(e.target.value) || 1)}
                        min="1"
                        max="50"
                        helper="Number of columns">
                    </ha-textfield>
                </lcards-grid-layout>

                <ha-textfield
                    type="number"
                    label="Gap (px)"
                    .value=${this._workingConfig.grid?.gap || 8}
                    @input=${(e) => this._updateConfig('grid.gap', parseInt(e.target.value) || 0)}
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

    _openTemplateHelper() {
        // TODO: Implement template helper dialog
        lcardsLog.info('[DataGridStudioV4] Template helper not yet implemented');
        
        // For now, show a simple alert with examples
        alert(`Template Syntax Examples:

Entity State:
{{states('sensor.temperature')}}

Entity Attribute:
{{state_attr('light.kitchen', 'brightness')}}

Current Time:
{{now().strftime('%H:%M')}}

Conditional:
{% if is_state('light.kitchen', 'on') %}ON{% else %}OFF{% endif %}

Math:
{{(states('sensor.temp') | float * 1.8) + 32}}
`);
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
        
        card.setConfig(cardConfig);
        card.hass = this.hass;

        // Add WYSIWYG click handler if in WYSIWYG mode
        if (this._previewMode === 'wysiwyg') {
            card.addEventListener('click', this._handlePreviewClick.bind(this));
            card.style.cursor = 'pointer';
        }

        // Add to container
        container.appendChild(card);

        lcardsLog.debug('[DataGridStudioV4] Preview card updated');
    }

    /**
     * Handle clicks on preview card in WYSIWYG mode
     * Detects cell/row/column and opens appropriate editor
     */
    _handlePreviewClick(event) {
        // Only handle in WYSIWYG mode and manual mode
        if (this._previewMode !== 'wysiwyg' || this._workingConfig.data_mode !== 'manual') {
            return;
        }

        // Find clicked cell element
        let target = event.target;
        while (target && !target.classList.contains('grid-cell') && target.parentElement) {
            target = target.parentElement;
        }

        if (!target || !target.classList.contains('grid-cell')) {
            lcardsLog.debug('[DataGridStudioV4] Click not on a grid cell');
            return;
        }

        // Get cell position from data attributes (if card supports it)
        // For now, we'll implement basic detection
        const cellIndex = Array.from(target.parentElement.children).indexOf(target);
        const rowElement = target.parentElement;
        const rowIndex = Array.from(rowElement.parentElement.children).indexOf(rowElement);

        lcardsLog.debug('[DataGridStudioV4] Cell clicked:', { row: rowIndex, col: cellIndex });

        // Determine what to open based on modifier keys
        if (event.shiftKey) {
            // Shift + click = row editor
            this._openRowEditor(rowIndex, event);
        } else if (event.ctrlKey || event.metaKey) {
            // Ctrl/Cmd + click = column editor
            this._openColumnEditor(cellIndex, event);
        } else {
            // Normal click = cell editor
            this._openCellEditor(rowIndex, cellIndex, event);
        }

        event.stopPropagation();
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

        return errors;
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
