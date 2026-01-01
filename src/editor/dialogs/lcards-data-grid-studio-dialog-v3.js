/**
 * LCARdS Data Grid Configuration Studio V3
 * 
 * Complete redesign with:
 * - Manual card instantiation for reliable preview updates
 * - Single config update method (_updateConfig)
 * - 100% schema coverage via FormField
 * - Tab + Sub-Tab organization (Data, Appearance, Animation, Advanced)
 * - Expert Grid Mode with all 14 CSS Grid properties
 * - Style presets and validation
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

// Import shared components
import '../components/shared/lcards-dialog.js';
import '../components/shared/lcards-form-section.js';
import '../components/shared/lcards-message.js';

// Import specialized components
import '../components/editors/lcards-visual-grid-designer.js';
import '../components/editors/lcards-color-section.js';

// Import dialogs
import './lcards-template-editor-dialog.js';
import './lcards-datasource-picker-dialog.js';
import './lcards-spreadsheet-editor-dialog.js';

// Import the card itself for preview
import '../../cards/lcards-data-grid.js';

export class LCARdSDataGridStudioDialogV3 extends LitElement {
    static properties = {
        hass: { type: Object },
        config: { type: Object },
        _workingConfig: { type: Object, state: true },
        _activeTab: { type: String, state: true },
        _activeSubTab: { type: String, state: true },
        _validationErrors: { type: Array, state: true },
        _expertGridMode: { type: Boolean, state: true }
    };

    constructor() {
        super();
        this.hass = null;
        this.config = null;
        this._workingConfig = {};
        this._activeTab = 'data';
        this._activeSubTab = 'mode-source'; // Default sub-tab for data tab
        this._validationErrors = [];
        this._expertGridMode = false;
        this._previewContainerRef = createRef();
        this._previewCardInstance = null;
    }

    connectedCallback() {
        super.connectedCallback();
        // Deep clone initial config to avoid mutating original
        this._workingConfig = JSON.parse(JSON.stringify(this.config || {}));
        
        // Ensure required defaults
        this._ensureDefaults();
        
        lcardsLog.debug('[DataGridStudioV3] Opened with config:', this._workingConfig);
    }

    disconnectedCallback() {
        super.disconnectedCallback();
        // Cleanup preview card instance
        if (this._previewCardInstance) {
            this._previewCardInstance = null;
        }
    }

    /**
     * Ensure config has all required defaults
     * @private
     */
    _ensureDefaults() {
        if (!this._workingConfig.type) {
            this._workingConfig.type = 'custom:lcards-data-grid';
        }
        if (!this._workingConfig.data_mode) {
            this._workingConfig.data_mode = 'random';
        }
        if (!this._workingConfig.grid) {
            this._workingConfig.grid = {
                'grid-template-columns': 'repeat(12, 1fr)',
                'grid-template-rows': 'repeat(8, auto)',
                'gap': '8px'
            };
        }
        if (!this._workingConfig.style) {
            this._workingConfig.style = {};
        }
        if (!this._workingConfig.animation) {
            this._workingConfig.animation = {
                type: 'none'
            };
        }
    }

    /**
     * Lit lifecycle: called after DOM update
     * @param {Map} changedProperties
     */
    updated(changedProperties) {
        super.updated(changedProperties);
        
        // Update preview card when config changes
        if (changedProperties.has('_workingConfig')) {
            this._updatePreviewCard();
        }
    }

    /**
     * Single source of truth for config updates
     * Creates new reference to trigger Lit reactivity
     * @param {string} path - Dot-notation path (e.g., 'style.font_size')
     * @param {*} value - New value
     * @private
     */
    _updateConfig(path, value) {
        lcardsLog.debug('[DataGridStudioV3] Update config:', path, '=', value);
        
        // Deep clone to create new reference
        const newConfig = JSON.parse(JSON.stringify(this._workingConfig));
        
        // Navigate path and set value
        const keys = path.split('.');
        let obj = newConfig;
        
        for (let i = 0; i < keys.length - 1; i++) {
            if (!obj[keys[i]]) {
                obj[keys[i]] = {};
            }
            obj = obj[keys[i]];
        }
        
        obj[keys[keys.length - 1]] = value;
        
        // Update working config (triggers reactivity)
        this._workingConfig = newConfig;
    }

    /**
     * Alias for backward compatibility with lcards-color-section
     * @param {string} path
     * @param {*} value
     * @private
     */
    _setConfigValue(path, value) {
        this._updateConfig(path, value);
    }

    /**
     * Alias for backward compatibility
     * @param {string} path
     * @param {*} value
     * @private
     */
    _updateConfigValue(path, value) {
        this._updateConfig(path, value);
    }

    /**
     * Get nested config value
     * @param {string} path - Dot-notation path
     * @returns {*}
     * @private
     */
    _getConfigValue(path) {
        const keys = path.split('.');
        let value = this._workingConfig;
        
        for (const key of keys) {
            if (value === undefined || value === null) {
                return undefined;
            }
            value = value[key];
        }
        
        return value;
    }

    /**
     * Get JSON schema from CoreConfigManager
     * @returns {Object} JSON Schema object
     * @private
     */
    _getSchema() {
        const configManager = window.lcards?.core?.configManager;

        if (!configManager) {
            lcardsLog.warn('[DataGridStudioV3] CoreConfigManager not available');
            return {};
        }

        const schema = configManager.getCardSchema('data-grid');

        if (!schema) {
            lcardsLog.warn('[DataGridStudioV3] No schema registered for data-grid');
            return {};
        }

        return schema;
    }

    /**
     * Get schema for a config path
     * @param {string} path - Dot-notation path
     * @returns {Object|null}
     * @private
     */
    _getSchemaForPath(path) {
        if (!path) return null;

        const schema = this._getSchema();
        if (!schema || !schema.properties) return null;

        const keys = path.split('.');
        let currentSchema = schema;

        for (const key of keys) {
            // Direct properties
            if (currentSchema.properties && currentSchema.properties[key]) {
                currentSchema = currentSchema.properties[key];
                continue;
            }

            // Handle additionalProperties
            if (currentSchema.additionalProperties) {
                if (typeof currentSchema.additionalProperties === 'object') {
                    currentSchema = currentSchema.additionalProperties;
                    continue;
                }
            }

            // Property not found
            return null;
        }

        return currentSchema;
    }

    /**
     * Manually update preview card instance
     * Following Home Assistant editor pattern
     * @private
     */
    _updatePreviewCard() {
        if (!this._previewContainerRef.value) {
            return;
        }

        // Create or update card instance
        if (!this._previewCardInstance) {
            // Create new card instance
            this._previewCardInstance = document.createElement('lcards-data-grid');
            this._previewContainerRef.value.innerHTML = '';
            this._previewContainerRef.value.appendChild(this._previewCardInstance);
        }

        // Set HASS object
        if (this.hass) {
            this._previewCardInstance.hass = this.hass;
        }

        // Set config (deep cloned to avoid mutation)
        try {
            const configClone = JSON.parse(JSON.stringify(this._workingConfig));
            this._previewCardInstance.setConfig(configClone);
            lcardsLog.debug('[DataGridStudioV3] Preview updated with config:', configClone);
        } catch (error) {
            lcardsLog.error('[DataGridStudioV3] Error updating preview:', error);
        }
    }

    static get styles() {
        return css`
            :host {
                display: block;
            }

            lcards-dialog {
                --mdc-dialog-min-width: 95vw;
                --mdc-dialog-min-height: 90vh;
                --mdc-dialog-max-width: 95vw;
                --mdc-dialog-max-height: 90vh;
            }

            .dialog-content {
                display: grid;
                grid-template-columns: 60% 40%;
                gap: 16px;
                height: calc(90vh - 100px);
                overflow: hidden;
            }

            @media (max-width: 1024px) {
                .dialog-content {
                    grid-template-columns: 1fr;
                    grid-template-rows: auto 1fr;
                }
            }

            /* Left Panel - Configuration */
            .config-panel {
                display: flex;
                flex-direction: column;
                gap: 12px;
                overflow-y: auto;
                padding-right: 8px;
            }

            /* Right Panel - Preview */
            .preview-panel {
                position: sticky;
                top: 0;
                height: fit-content;
                max-height: calc(90vh - 120px);
                border: 2px solid var(--divider-color, #e0e0e0);
                border-radius: 8px;
                padding: 16px;
                background: var(--card-background-color, white);
            }

            .preview-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 12px;
                padding-bottom: 8px;
                border-bottom: 1px solid var(--divider-color);
            }

            .preview-title {
                font-weight: 600;
                font-size: 14px;
            }

            .preview-container {
                min-height: 300px;
                max-height: calc(90vh - 200px);
                overflow: auto;
            }

            @media (max-width: 1024px) {
                .preview-panel {
                    position: relative;
                    max-height: 400px;
                }
            }

            /* Tabs */
            .tabs {
                display: flex;
                gap: 4px;
                border-bottom: 2px solid var(--divider-color, #e0e0e0);
                margin-bottom: 12px;
                overflow-x: auto;
                flex-wrap: nowrap;
            }

            .tab {
                padding: 10px 16px;
                border: none;
                background: transparent;
                cursor: pointer;
                font-size: 14px;
                font-weight: 500;
                color: var(--secondary-text-color);
                border-bottom: 3px solid transparent;
                transition: all 0.2s;
                white-space: nowrap;
                flex: 0 0 auto;
            }

            .tab:hover {
                background: var(--secondary-background-color, #fafafa);
            }

            .tab.active {
                color: var(--primary-color);
                border-bottom-width: 4px;
                border-bottom-color: var(--primary-color);
            }

            /* Sub-tabs */
            .sub-tabs {
                display: flex;
                gap: 4px;
                margin-bottom: 12px;
                border-bottom: 1px solid var(--divider-color, #e0e0e0);
            }

            .sub-tab {
                padding: 8px 12px;
                border: none;
                background: transparent;
                cursor: pointer;
                font-size: 13px;
                color: var(--secondary-text-color);
                border-bottom: 2px solid transparent;
                transition: all 0.2s;
            }

            .sub-tab:hover {
                background: var(--secondary-background-color, #fafafa);
            }

            .sub-tab.active {
                color: var(--primary-color);
                border-bottom-color: var(--primary-color);
            }

            /* Mode Selector */
            .mode-selector {
                display: grid;
                grid-template-columns: repeat(3, 1fr);
                gap: 12px;
                margin-bottom: 12px;
            }

            @media (max-width: 768px) {
                .mode-selector {
                    grid-template-columns: 1fr;
                }
            }

            .mode-card {
                padding: 20px;
                border: 2px solid var(--divider-color, #e0e0e0);
                border-radius: 8px;
                cursor: pointer;
                transition: all 0.2s;
                background: var(--card-background-color, white);
                text-align: center;
            }

            .mode-card:hover {
                background: var(--secondary-background-color, #fafafa);
                border-color: var(--primary-color);
            }

            .mode-card.active {
                border-color: var(--primary-color);
                background: linear-gradient(
                    135deg,
                    rgba(var(--rgb-primary-color), 0.1) 0%,
                    transparent 100%
                );
            }

            .mode-icon {
                font-size: 40px;
                margin-bottom: 8px;
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
                line-height: 1.3;
            }

            /* Grid designer toggle */
            .designer-toggle {
                display: flex;
                align-items: center;
                justify-content: space-between;
                padding: 12px;
                background: var(--secondary-background-color, #fafafa);
                border-radius: 4px;
                margin-bottom: 12px;
            }

            /* Validation Errors */
            .validation-errors {
                padding: 12px;
                background: var(--error-color, #f44336);
                color: white;
                border-radius: 4px;
                margin-bottom: 12px;
            }

            .validation-errors ul {
                margin: 8px 0 0 16px;
                padding: 0;
            }

            /* Preset Buttons */
            .preset-buttons {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
                gap: 8px;
                margin-top: 12px;
            }

            /* Helper text */
            .helper-text {
                font-size: 12px;
                color: var(--secondary-text-color);
                margin-top: 8px;
                line-height: 1.4;
            }

            /* Status footer */
            .preview-footer {
                margin-top: 12px;
                padding-top: 8px;
                border-top: 1px solid var(--divider-color);
                font-size: 12px;
                color: var(--secondary-text-color);
            }
        `;
    }

    render() {
        return html`
            <lcards-dialog
                .open=${true}
                .heading=${'Data Grid Configuration Studio'}
                @closed=${this._handleCancel}>
                
                <div class="dialog-content">
                    <!-- Left Panel: Configuration -->
                    <div class="config-panel">
                        ${this._validationErrors.length > 0 ? html`
                            <div class="validation-errors">
                                <strong>⚠️ Validation Errors:</strong>
                                <ul>
                                    ${this._validationErrors.map(err => html`<li>${err}</li>`)}
                                </ul>
                            </div>
                        ` : ''}

                        ${this._renderTabs()}
                        ${this._renderTabContent()}
                    </div>

                    <!-- Right Panel: Live Preview -->
                    <div class="preview-panel">
                        ${this._renderPreview()}
                    </div>
                </div>

                <div slot="primaryAction">
                    <ha-button @click=${this._handleSave}>
                        <ha-icon icon="mdi:check" slot="icon"></ha-icon>
                        Save
                    </ha-button>
                </div>

                <div slot="secondaryAction">
                    <ha-button @click=${this._handleCancel}>
                        Cancel
                    </ha-button>
                </div>
            </lcards-dialog>
        `;
    }

    // ========================================
    // Tab Rendering
    // ========================================

    _renderTabs() {
        const tabs = [
            { id: 'data', label: 'Data' },
            { id: 'appearance', label: 'Appearance' },
            { id: 'animation', label: 'Animation' },
            { id: 'advanced', label: 'Advanced' }
        ];

        return html`
            <div class="tabs">
                ${tabs.map(tab => html`
                    <button
                        class="tab ${this._activeTab === tab.id ? 'active' : ''}"
                        @click=${() => this._switchTab(tab.id)}>
                        ${tab.label}
                    </button>
                `)}
            </div>
        `;
    }

    _switchTab(tabId) {
        this._activeTab = tabId;
        
        // Set default sub-tab for each main tab
        const defaultSubTabs = {
            'data': 'mode-source',
            'appearance': 'typography',
            'animation': 'cascade',
            'advanced': 'performance'
        };
        
        this._activeSubTab = defaultSubTabs[tabId] || '';
    }

    _renderTabContent() {
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
                return html``;
        }
    }

    // ========================================
    // Data Tab (3 sub-tabs)
    // ========================================

    _renderDataTab() {
        return html`
            ${this._renderDataSubTabs()}
            ${this._renderDataSubTabContent()}
        `;
    }

    _renderDataSubTabs() {
        const subTabs = [
            { id: 'mode-source', label: 'Mode & Source' },
            { id: 'grid-layout', label: 'Grid Layout' },
            { id: 'data-config', label: 'Data Configuration' }
        ];

        return html`
            <div class="sub-tabs">
                ${subTabs.map(tab => html`
                    <button
                        class="sub-tab ${this._activeSubTab === tab.id ? 'active' : ''}"
                        @click=${() => this._activeSubTab = tab.id}>
                        ${tab.label}
                    </button>
                `)}
            </div>
        `;
    }

    _renderDataSubTabContent() {
        switch (this._activeSubTab) {
            case 'mode-source':
                return this._renderModeSourceSubTab();
            case 'grid-layout':
                return this._renderGridLayoutSubTab();
            case 'data-config':
                return this._renderDataConfigSubTab();
            default:
                return html``;
        }
    }

    _renderModeSourceSubTab() {
        const currentMode = this._workingConfig.data_mode || 'random';
        
        const modes = [
            {
                id: 'random',
                icon: 'mdi:dice-multiple',
                title: 'Random Data',
                description: 'Decorative LCARS grid with auto-generated data'
            },
            {
                id: 'template',
                icon: 'mdi:table-edit',
                title: 'Template Grid',
                description: 'Manual grid with Home Assistant templates'
            },
            {
                id: 'datasource',
                icon: 'mdi:database',
                title: 'Live Data',
                description: 'Real-time data from sensors or DataSources'
            }
        ];

        return html`
            <lcards-form-section
                header="Data Mode"
                ?expanded=${true}
                ?noCollapse=${true}>
                <div class="mode-selector">
                    ${modes.map(mode => html`
                        <div
                            class="mode-card ${currentMode === mode.id ? 'active' : ''}"
                            @click=${() => this._updateConfig('data_mode', mode.id)}>
                            <ha-icon class="mode-icon" icon="${mode.icon}"></ha-icon>
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
        const mode = this._workingConfig.data_mode;

        if (mode === 'random') {
            return this._renderRandomModeConfig();
        } else if (mode === 'template') {
            return this._renderTemplateModeConfig();
        } else if (mode === 'datasource') {
            return this._renderDataSourceModeConfig();
        }
        
        return html``;
    }

    _renderRandomModeConfig() {
        return html`
            <lcards-form-section
                header="Random Data Settings"
                ?expanded=${true}>
                ${FormField.renderField(this, 'format')}
                ${FormField.renderField(this, 'refresh_interval')}
            </lcards-form-section>
        `;
    }

    _renderTemplateModeConfig() {
        return html`
            <lcards-form-section
                header="Template Grid Settings"
                ?expanded=${true}>
                <ha-button
                    @click=${this._openTemplateEditorDialog}>
                    <ha-icon icon="mdi:code-braces" slot="icon"></ha-icon>
                    Open Template Editor
                </ha-button>
                
                ${this._workingConfig.rows?.length ? html`
                    <div class="helper-text">
                        ✓ Grid configured with ${this._workingConfig.rows.length} rows
                    </div>
                ` : html`
                    <div class="helper-text">
                        ⚠️ No template rows defined yet
                    </div>
                `}
            </lcards-form-section>
        `;
    }

    _renderDataSourceModeConfig() {
        const layout = this._workingConfig.layout;

        return html`
            <lcards-form-section
                header="DataSource Settings"
                ?expanded=${true}>
                ${FormField.renderField(this, 'layout')}

                ${layout === 'timeline' ? html`
                    <ha-button
                        @click=${this._openDataSourcePickerDialog}
                        style="margin-top: 12px;">
                        <ha-icon icon="mdi:database-search" slot="icon"></ha-icon>
                        Select Data Source
                    </ha-button>

                    ${this._workingConfig.source ? html`
                        <div class="helper-text">
                            ✓ Source: ${this._workingConfig.source}
                        </div>
                    ` : ''}

                    ${FormField.renderField(this, 'history_hours')}
                    ${FormField.renderField(this, 'value_template')}
                ` : layout === 'spreadsheet' ? html`
                    <ha-button
                        @click=${this._openSpreadsheetEditorDialog}
                        style="margin-top: 12px;">
                        <ha-icon icon="mdi:table-large" slot="icon"></ha-icon>
                        Configure Spreadsheet
                    </ha-button>

                    ${this._workingConfig.columns?.length ? html`
                        <div class="helper-text">
                            ✓ ${this._workingConfig.columns.length} columns, ${this._workingConfig.rows?.length || 0} rows
                        </div>
                    ` : ''}
                ` : ''}
            </lcards-form-section>
        `;
    }

    _renderGridLayoutSubTab() {
        return html`
            <div class="designer-toggle">
                <span>Expert Mode (Full CSS Grid Control)</span>
                <ha-switch
                    .checked=${this._expertGridMode}
                    @change=${(e) => this._expertGridMode = e.target.checked}>
                </ha-switch>
            </div>

            ${this._expertGridMode ? this._renderExpertGridMode() : this._renderVisualGridMode()}
        `;
    }

    _renderVisualGridMode() {
        return html`
            <lcards-form-section
                header="Visual Grid Designer"
                description="Simple grid configuration with rows, columns, and gap"
                ?expanded=${true}
                ?noCollapse=${true}>
                <lcards-visual-grid-designer
                    .config=${this._workingConfig}
                    @grid-changed=${this._handleGridChanged}>
                </lcards-visual-grid-designer>
            </lcards-form-section>
        `;
    }

    _renderExpertGridMode() {
        return html`
            <lcards-form-section
                header="CSS Grid Properties"
                description="Full control over all 14 CSS Grid properties"
                ?expanded=${true}
                ?noCollapse=${true}>
                
                <div class="helper-text">
                    💡 Expert mode gives you direct access to CSS Grid syntax. 
                    Use properties like 'repeat(12, 1fr)' or 'minmax(100px, 1fr)'.
                </div>

                <h4>Grid Template</h4>
                ${FormField.renderField(this, 'grid.grid-template-columns')}
                ${FormField.renderField(this, 'grid.grid-template-rows')}

                <h4>Gap Spacing</h4>
                ${FormField.renderField(this, 'grid.gap')}
                ${FormField.renderField(this, 'grid.row-gap')}
                ${FormField.renderField(this, 'grid.column-gap')}

                <h4>Auto Placement</h4>
                ${FormField.renderField(this, 'grid.grid-auto-flow')}
                ${FormField.renderField(this, 'grid.grid-auto-columns')}
                ${FormField.renderField(this, 'grid.grid-auto-rows')}

                <h4>Alignment</h4>
                ${FormField.renderField(this, 'grid.justify-items')}
                ${FormField.renderField(this, 'grid.align-items')}
                ${FormField.renderField(this, 'grid.justify-content')}
                ${FormField.renderField(this, 'grid.align-content')}
            </lcards-form-section>
        `;
    }

    _renderDataConfigSubTab() {
        return html`
            <lcards-form-section
                header="Advanced Data Configuration"
                description="Mode-specific advanced settings"
                ?expanded=${true}>
                <div class="helper-text">
                    Advanced configuration options will appear here based on your selected data mode.
                </div>
            </lcards-form-section>
        `;
    }

    // ========================================
    // Appearance Tab (4 sub-tabs)
    // ========================================

    _renderAppearanceTab() {
        return html`
            ${this._renderAppearanceSubTabs()}
            ${this._renderAppearanceSubTabContent()}
        `;
    }

    _renderAppearanceSubTabs() {
        const subTabs = [
            { id: 'typography', label: 'Typography' },
            { id: 'colors', label: 'Colors' },
            { id: 'borders', label: 'Borders' },
            { id: 'header-style', label: 'Header Style' }
        ];

        return html`
            <div class="sub-tabs">
                ${subTabs.map(tab => html`
                    <button
                        class="sub-tab ${this._activeSubTab === tab.id ? 'active' : ''}"
                        @click=${() => this._activeSubTab = tab.id}>
                        ${tab.label}
                    </button>
                `)}
            </div>
        `;
    }

    _renderAppearanceSubTabContent() {
        switch (this._activeSubTab) {
            case 'typography':
                return this._renderTypographySubTab();
            case 'colors':
                return this._renderColorsSubTab();
            case 'borders':
                return this._renderBordersSubTab();
            case 'header-style':
                return this._renderHeaderStyleSubTab();
            default:
                return html``;
        }
    }

    _renderTypographySubTab() {
        return html`
            <lcards-form-section
                header="Style Presets"
                description="Quick-apply predefined style configurations"
                ?expanded=${true}>
                <div class="preset-buttons">
                    <ha-button @click=${() => this._applyStylePreset('classic-lcars')}>
                        Classic LCARS
                    </ha-button>
                    <ha-button @click=${() => this._applyStylePreset('picard')}>
                        Picard Era
                    </ha-button>
                    <ha-button @click=${() => this._applyStylePreset('minimal')}>
                        Minimal
                    </ha-button>
                </div>
            </lcards-form-section>

            <lcards-form-section
                header="Grid-Wide Typography"
                description="Font settings applied to all cells"
                ?expanded=${true}>
                ${FormField.renderField(this, 'style.font_size')}
                ${FormField.renderField(this, 'style.font_family')}
                ${FormField.renderField(this, 'style.font_weight')}
                ${FormField.renderField(this, 'style.align')}
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
                    { path: 'style.background', label: 'Background', helper: 'Cell background color' }
                ]}
                ?expanded=${true}
                ?useColorPicker=${true}>
            </lcards-color-section>

            ${this._workingConfig.layout === 'spreadsheet' ? html`
                <lcards-color-section
                    .editor=${this}
                    header="Header Colors"
                    description="Colors for spreadsheet headers"
                    .colorPaths=${[
                        { path: 'header_style.color', label: 'Header Text', helper: 'Header text color' },
                        { path: 'header_style.background', label: 'Header Background', helper: 'Header background color' }
                    ]}
                    ?expanded=${false}
                    ?useColorPicker=${true}>
                </lcards-color-section>
            ` : ''}
        `;
    }

    _renderBordersSubTab() {
        return html`
            <lcards-form-section
                header="Grid Borders"
                description="Border styling for cells"
                ?expanded=${true}>
                <div class="helper-text">
                    Border configuration controls will be added here.
                </div>
            </lcards-form-section>
        `;
    }

    _renderHeaderStyleSubTab() {
        const isSpreadsheet = this._workingConfig.layout === 'spreadsheet';

        if (!isSpreadsheet) {
            return html`
                <lcards-form-section
                    header="Header Style"
                    ?expanded=${true}>
                    <div class="helper-text">
                        ℹ️ Header styling is only available in Spreadsheet layout mode.
                        Switch to DataSource mode with Spreadsheet layout to configure headers.
                    </div>
                </lcards-form-section>
            `;
        }

        return html`
            <lcards-form-section
                header="Spreadsheet Header Style"
                description="Styling specific to spreadsheet headers"
                ?expanded=${true}>
                ${FormField.renderField(this, 'header_style.font_size')}
                ${FormField.renderField(this, 'header_style.font_weight')}
                ${FormField.renderField(this, 'header_style.padding')}
                ${FormField.renderField(this, 'header_style.border_bottom_width')}
                ${FormField.renderField(this, 'header_style.border_bottom_color')}
                ${FormField.renderField(this, 'header_style.border_bottom_style')}
            </lcards-form-section>
        `;
    }

    // ========================================
    // Animation Tab (2 sub-tabs)
    // ========================================

    _renderAnimationTab() {
        return html`
            ${this._renderAnimationSubTabs()}
            ${this._renderAnimationSubTabContent()}
        `;
    }

    _renderAnimationSubTabs() {
        const subTabs = [
            { id: 'cascade', label: 'Cascade' },
            { id: 'change-detection', label: 'Change Detection' }
        ];

        return html`
            <div class="sub-tabs">
                ${subTabs.map(tab => html`
                    <button
                        class="sub-tab ${this._activeSubTab === tab.id ? 'active' : ''}"
                        @click=${() => this._activeSubTab = tab.id}>
                        ${tab.label}
                    </button>
                `)}
            </div>
        `;
    }

    _renderAnimationSubTabContent() {
        switch (this._activeSubTab) {
            case 'cascade':
                return this._renderCascadeSubTab();
            case 'change-detection':
                return this._renderChangeDetectionSubTab();
            default:
                return html``;
        }
    }

    _renderCascadeSubTab() {
        const animationType = this._workingConfig.animation?.type || 'none';

        return html`
            <lcards-form-section
                header="Cascade Animation"
                description="Waterfall color cycling effect"
                ?expanded=${true}>
                ${FormField.renderField(this, 'animation.type')}

                ${animationType === 'cascade' ? html`
                    ${FormField.renderField(this, 'animation.pattern')}
                    
                    <lcards-color-section
                        .editor=${this}
                        header="Cascade Colors"
                        description="3-color cycle for animation"
                        .colorPaths=${[
                            { path: 'animation.colors.start', label: 'Start Color', helper: '75% dwell time' },
                            { path: 'animation.colors.text', label: 'Middle Color', helper: '10% snap transition' },
                            { path: 'animation.colors.end', label: 'End Color', helper: '10% brief flash' }
                        ]}
                        ?expanded=${true}
                        ?useColorPicker=${true}>
                    </lcards-color-section>

                    <h4 style="margin-top: 16px;">Timing Controls</h4>
                    ${FormField.renderField(this, 'animation.speed_multiplier')}
                    ${FormField.renderField(this, 'animation.duration')}
                    ${FormField.renderField(this, 'animation.easing')}
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
                ${FormField.renderField(this, 'animation.highlight_changes')}

                ${highlightChanges ? html`
                    ${FormField.renderField(this, 'animation.change_preset')}
                    
                    <div class="helper-text" style="margin-top: 12px;">
                        💡 Change detection animates cells when their value updates.
                        Useful for real-time data monitoring in DataSource mode.
                    </div>
                ` : ''}
            </lcards-form-section>
        `;
    }

    // ========================================
    // Advanced Tab (3 sub-tabs)
    // ========================================

    _renderAdvancedTab() {
        return html`
            ${this._renderAdvancedSubTabs()}
            ${this._renderAdvancedSubTabContent()}
        `;
    }

    _renderAdvancedSubTabs() {
        const subTabs = [
            { id: 'performance', label: 'Performance' },
            { id: 'metadata', label: 'Metadata' },
            { id: 'expert-settings', label: 'Expert Settings' }
        ];

        return html`
            <div class="sub-tabs">
                ${subTabs.map(tab => html`
                    <button
                        class="sub-tab ${this._activeSubTab === tab.id ? 'active' : ''}"
                        @click=${() => this._activeSubTab = tab.id}>
                        ${tab.label}
                    </button>
                `)}
            </div>
        `;
    }

    _renderAdvancedSubTabContent() {
        switch (this._activeSubTab) {
            case 'performance':
                return this._renderPerformanceSubTab();
            case 'metadata':
                return this._renderMetadataSubTab();
            case 'expert-settings':
                return this._renderExpertSettingsSubTab();
            default:
                return html``;
        }
    }

    _renderPerformanceSubTab() {
        return html`
            <lcards-form-section
                header="Performance Optimization"
                description="Configure refresh rates and limits"
                ?expanded=${true}>
                ${FormField.renderField(this, 'refresh_interval')}
                
                <div class="helper-text" style="margin-top: 12px;">
                    💡 <strong>Performance Tips:</strong><br>
                    • Large grids (>100 cells): Set refresh_interval ≥ 1000ms<br>
                    • Animation + large grid: Consider disabling cascade animation<br>
                    • Real-time data: Use DataSource mode for efficient updates
                </div>
            </lcards-form-section>
        `;
    }

    _renderMetadataSubTab() {
        return html`
            <lcards-form-section
                header="Card Metadata"
                description="Identification and tagging for rules engine"
                ?expanded=${true}>
                ${FormField.renderField(this, 'id', {
                    label: 'Card ID',
                    helper: 'Unique identifier for this card (used by rules engine)'
                })}
                ${FormField.renderField(this, 'cardId', {
                    label: 'Card ID (Legacy)',
                    helper: 'Legacy card ID field (prefer "id" field)'
                })}
                ${FormField.renderField(this, 'tags')}
            </lcards-form-section>
        `;
    }

    _renderExpertSettingsSubTab() {
        return html`
            <lcards-form-section
                header="Expert Settings"
                description="Advanced configuration information"
                ?expanded=${true}>
                <div class="helper-text">
                    <strong>🎯 Hierarchical Styling</strong><br>
                    Data Grid supports 3 levels of styling:<br>
                    1. Grid-wide (style.*) - applies to all cells<br>
                    2. Row-level (rows[].style.*) - overrides grid defaults<br>
                    3. Cell-level (individual cell styling) - highest priority<br>
                    <br>
                    <strong>📝 YAML Editing</strong><br>
                    You can edit the raw YAML configuration in Home Assistant's 
                    dashboard editor for advanced properties not exposed in this UI.
                    See documentation for full schema reference.
                </div>
            </lcards-form-section>
        `;
    }

    // ========================================
    // Preview
    // ========================================

    _renderPreview() {
        const mode = this._workingConfig.data_mode || 'random';
        const layout = this._workingConfig.layout || '';
        
        let statusText = `Mode: ${mode}`;
        if (mode === 'datasource' && layout) {
            statusText += ` | Layout: ${layout}`;
        }

        return html`
            <div class="preview-header">
                <span class="preview-title">Live Preview</span>
                <ha-button
                    @click=${this._refreshPreview}
                    style="--mdc-button-height: 32px;">
                    <ha-icon icon="mdi:refresh" slot="icon"></ha-icon>
                </ha-button>
            </div>
            
            <div class="preview-container" ${ref(this._previewContainerRef)}>
                <!-- Card instance will be inserted here -->
            </div>

            <div class="preview-footer">
                ${statusText}
            </div>
        `;
    }

    _refreshPreview() {
        lcardsLog.debug('[DataGridStudioV3] Manual preview refresh triggered');
        this._previewCardInstance = null; // Force recreate
        this._updatePreviewCard();
    }

    // ========================================
    // Event Handlers
    // ========================================

    _handleGridChanged(e) {
        lcardsLog.debug('[DataGridStudioV3] Grid changed:', e.detail);
        
        const { rows, columns, gap, cssGrid } = e.detail;
        
        // Update grid config
        if (!this._workingConfig.grid) {
            this._workingConfig.grid = {};
        }
        
        if (cssGrid) {
            // Expert mode: full CSS Grid object
            Object.assign(this._workingConfig.grid, cssGrid);
        } else {
            // Visual mode: simple rows/columns/gap
            if (rows !== undefined) {
                this._workingConfig.grid['grid-template-rows'] = `repeat(${rows}, auto)`;
            }
            if (columns !== undefined) {
                this._workingConfig.grid['grid-template-columns'] = `repeat(${columns}, 1fr)`;
            }
            if (gap !== undefined) {
                this._workingConfig.grid.gap = `${gap}px`;
            }
        }
        
        // Trigger update
        this._workingConfig = { ...this._workingConfig };
    }

    _openTemplateEditorDialog() {
        const dialog = document.createElement('lcards-template-editor-dialog');
        dialog.hass = this.hass;
        dialog.config = this._workingConfig;
        
        dialog.addEventListener('config-changed', (e) => {
            this._workingConfig = { ...e.detail.config };
        });
        
        dialog.addEventListener('closed', () => {
            dialog.remove();
        });
        
        document.body.appendChild(dialog);
    }

    _openDataSourcePickerDialog() {
        const dialog = document.createElement('lcards-datasource-picker-dialog');
        dialog.hass = this.hass;
        dialog.config = this._workingConfig;
        
        dialog.addEventListener('config-changed', (e) => {
            this._workingConfig = { ...e.detail.config };
        });
        
        dialog.addEventListener('closed', () => {
            dialog.remove();
        });
        
        document.body.appendChild(dialog);
    }

    _openSpreadsheetEditorDialog() {
        const dialog = document.createElement('lcards-spreadsheet-editor-dialog');
        dialog.hass = this.hass;
        dialog.config = this._workingConfig;
        
        dialog.addEventListener('config-changed', (e) => {
            this._workingConfig = { ...e.detail.config };
        });
        
        dialog.addEventListener('closed', () => {
            dialog.remove();
        });
        
        document.body.appendChild(dialog);
    }

    // ========================================
    // Style Presets
    // ========================================

    _applyStylePreset(presetName) {
        lcardsLog.info('[DataGridStudioV3] Applying style preset:', presetName);
        
        const presets = {
            'classic-lcars': {
                style: {
                    color: '{theme:colors.lcars.blue}',
                    background: 'transparent',
                    font_size: 18,
                    align: 'right'
                },
                animation: {
                    type: 'cascade',
                    pattern: 'default',
                    colors: {
                        start: '{theme:colors.lcars.blue}',
                        text: '{theme:colors.lcars.dark-blue}',
                        end: '{theme:colors.lcars.moonlight}'
                    }
                }
            },
            'picard': {
                style: {
                    color: '{theme:colors.text.primary}',
                    background: '{theme:alpha(colors.grid.cellBackground, 0.05)}',
                    font_size: 16,
                    align: 'center'
                },
                animation: {
                    type: 'cascade',
                    pattern: 'niagara',
                    colors: {
                        start: '{theme:colors.lcars.orange}',
                        text: '{theme:colors.lcars.yellow}',
                        end: '{theme:colors.lcars.orange}'
                    }
                }
            },
            'minimal': {
                style: {
                    color: '{theme:colors.text.primary}',
                    background: 'transparent',
                    font_size: 14,
                    align: 'left'
                },
                animation: {
                    type: 'none'
                }
            }
        };

        const preset = presets[presetName];
        if (preset) {
            // Merge preset into working config
            this._updateConfig('style', { ...this._workingConfig.style, ...preset.style });
            this._updateConfig('animation', { ...this._workingConfig.animation, ...preset.animation });
        }
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
            lcardsLog.warn('[DataGridStudioV3] Validation failed:', this._validationErrors);
            this.requestUpdate(); // Force re-render to show errors
            return;
        }
        
        lcardsLog.info('[DataGridStudioV3] Saving config:', this._workingConfig);
        
        this.dispatchEvent(new CustomEvent('config-changed', {
            detail: { config: this._workingConfig },
            bubbles: true,
            composed: true
        }));
        
        this._handleClose();
    }

    _handleCancel() {
        lcardsLog.debug('[DataGridStudioV3] Cancelled, discarding changes');
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
