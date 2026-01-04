/**
 * LCARdS Chart Configuration Studio
 *
 * Full-screen immersive editor for configuring chart cards.
 * Phase 1: Foundation with 10-tab structure and live preview.
 *
 * Tab Structure:
 * 1. Data Sources - Entity picker, multi-series, DataSource config
 * 2. Chart Type - Visual type selector (16 types) + dimensions
 * 3. Colors - Series, stroke, fill, background, markers, legend
 * 4. Stroke & Fill - Line styling, fill types, gradients
 * 5. Markers & Grid - Data points, grid configuration
 * 6. Axes - X/Y axis styling, labels, borders, ticks
 * 7. Legend & Labels - Legend position, data labels
 * 8. Theme - Mode, palette, monochrome settings
 * 9. Animation - Preset selector, animation configuration
 * 10. Advanced - Formatters, typography, display options, raw chart_options
 *
 * @element lcards-chart-studio-dialog
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
import { LCARdSFormFieldHelper as FormField } from '../components/shared/lcards-form-field.js';
import '../components/shared/lcards-form-section.js';
import '../components/shared/lcards-message.js';
import '../components/lcards-chart-live-preview.js';
import '../dialogs/lcards-datasource-picker-dialog.js';
import '../../cards/lcards-chart.js';

export class LCARdSChartStudioDialog extends LitElement {
    static get properties() {
        return {
            hass: { type: Object },
            _initialConfig: { type: Object }, // Store initial config
            _workingConfig: { type: Object, state: true },
            _activeTab: { type: String, state: true },
            _validationErrors: { type: Array, state: true },
            // Data Sources tab state
            _dataSourceLevel: { type: String, state: true }, // 'simple' | 'multi' | 'advanced'
            _selectedEntity: { type: String, state: true },
            _showDataSourcePicker: { type: Boolean, state: true }
        };
    }

    constructor() {
        super();
        this.hass = null;
        this._initialConfig = null;
        this._workingConfig = {};
        this._activeTab = 'data-sources';
        this._validationErrors = [];

        // Create ref for preview container
        this._previewRef = createRef();

        // Debounce timer for preview updates
        this._previewUpdateTimer = null;

        // Data Sources tab state
        this._dataSourceLevel = 'simple';
        this._selectedEntity = '';
        this._showDataSourcePicker = false;
    }

    /**
     * Getter for config property that returns _workingConfig
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

        // Ensure type is set
        if (!this._workingConfig.type) {
            this._workingConfig.type = 'custom:lcards-chart';
        }

        // Ensure chart_type default
        if (!this._workingConfig.chart_type) {
            this._workingConfig.chart_type = 'line';
        }

        // Detect data source level
        this._dataSourceLevel = this._detectDataSourceLevel();

        lcardsLog.debug('[ChartStudio] Opened with config:', this._workingConfig);
        lcardsLog.debug('[ChartStudio] Detected data source level:', this._dataSourceLevel);

        // Schedule initial preview update
        this.updateComplete.then(() => this._updatePreviewCard());
    }

    /**
     * Get schema for a given path (required for FormField)
     * @param {string} path - Config path
     * @returns {Object|null} Schema definition
     * @private
     */
    _getSchemaForPath(path) {
        // Chart schema lookup would go here
        // For Phase 1, return null (fields won't auto-populate)
        return null;
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
            css`
            :host {
                display: block;
            }

            ha-dialog {
                --mdc-dialog-min-width: 95vw;
                --mdc-dialog-max-width: 95vw;
                --mdc-dialog-min-height: 90vh;
            }

            .dialog-content {
                display: flex;
                flex-direction: column;
                min-height: 80vh;
                max-height: 90vh;
                gap: 16px;
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
            }

            /* Tab Navigation */
            .tab-navigation {
                display: flex;
                gap: 4px;
                border-bottom: 2px solid var(--divider-color);
                margin-bottom: 16px;
                overflow-x: auto;
                flex-wrap: nowrap;
            }

            .tab-button {
                padding: 12px 16px;
                border: none;
                background: none;
                cursor: pointer;
                border-bottom: 3px solid transparent;
                font-weight: 500;
                font-size: 14px;
                color: var(--primary-text-color);
                white-space: nowrap;
                transition: all 0.2s ease;
                display: flex;
                align-items: center;
                gap: 8px;
            }

            .tab-button:hover {
                background: var(--secondary-background-color);
            }

            .tab-button.active {
                border-bottom-color: var(--primary-color);
                border-bottom-width: 4px;
                color: var(--primary-color);
            }

            .tab-button ha-icon {
                --mdc-icon-size: 18px;
            }

            /* Tab Content */
            .tab-content {
                padding: 8px 0;
            }

            /* Placeholder Styles */
            .coming-soon {
                text-align: center;
                padding: 48px 24px;
                color: var(--secondary-text-color);
            }

            .coming-soon ha-icon {
                --mdc-icon-size: 64px;
                margin-bottom: 16px;
                opacity: 0.5;
            }

            .coming-soon h3 {
                margin: 0 0 8px 0;
                font-size: 20px;
            }

            .coming-soon p {
                margin: 0;
                font-size: 14px;
            }

            /* Validation Errors */
            .validation-errors {
                margin-bottom: 16px;
                padding: 12px;
                background: var(--error-color);
                color: white;
                border-radius: 8px;
            }

            .validation-errors h4 {
                margin: 0 0 8px 0;
            }

            .validation-errors ul {
                margin: 0;
                padding-left: 20px;
            }

            /* Data Sources Tab Styles */
            .level-selector {
                display: flex;
                gap: 12px;
                margin-bottom: 24px;
            }

            .level-card {
                flex: 1;
                padding: 16px;
                border: 2px solid var(--divider-color);
                border-radius: 8px;
                cursor: pointer;
                transition: all 0.2s;
                background: var(--card-background-color);
            }

            .level-card:hover {
                border-color: var(--primary-color);
                background: var(--secondary-background-color);
            }

            .level-card.active {
                border-color: var(--primary-color);
                border-width: 3px;
                background: var(--primary-color);
                color: white;
            }

            .level-card-title {
                font-weight: 600;
                font-size: 16px;
                margin-bottom: 4px;
            }

            .level-card-description {
                font-size: 12px;
                opacity: 0.8;
            }

            .level-card.active .level-card-description {
                opacity: 1;
            }

            .form-field {
                margin-bottom: 12px;
            }

            .form-label {
                display: block;
                font-weight: 500;
                margin-bottom: 8px;
                font-size: 14px;
            }

            .form-helper {
                font-size: 12px;
                color: var(--secondary-text-color);
                margin-top: 4px;
            }

            .entity-preview {
                padding: 12px;
                background: var(--secondary-background-color);
                border-radius: 8px;
                margin-top: 12px;
            }

            .entity-preview-header {
                font-weight: 600;
                margin-bottom: 8px;
            }

            .entity-preview-item {
                display: flex;
                gap: 8px;
                margin-bottom: 4px;
                font-size: 13px;
            }

            .entity-preview-label {
                font-weight: 500;
                min-width: 120px;
            }

            .entity-preview-value {
                color: var(--secondary-text-color);
            }

            .series-list {
                display: flex;
                flex-direction: column;
                gap: 8px;
            }

            .series-item {
                display: flex;
                align-items: center;
                gap: 8px;
                padding: 12px;
                background: var(--card-background-color);
                border: 1px solid var(--divider-color);
                border-radius: 8px;
            }

            .series-controls {
                display: flex;
                gap: 4px;
            }

            .series-content {
                flex: 1;
                display: flex;
                flex-direction: column;
                gap: 8px;
            }

            .add-button {
                margin-top: 12px;
            }

            .datasource-list {
                display: flex;
                flex-direction: column;
                gap: 12px;
            }

            .datasource-item {
                padding: 12px;
                background: var(--card-background-color);
                border: 1px solid var(--divider-color);
                border-radius: 8px;
            }

            .datasource-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 8px;
            }

            .datasource-name {
                font-weight: 600;
                font-size: 14px;
            }

            .datasource-entity {
                font-size: 12px;
                color: var(--secondary-text-color);
            }

            ha-entity-picker {
                width: 100%;
            }

            ha-textfield {
                width: 100%;
            }
            `
        ];
    }

    /**
     * Update config value at path
     * @param {string} path - Dot-notation path (e.g., 'colors.series')
     * @param {*} value - New value
     * @private
     */
    _updateConfig(path, value) {
        const parts = path.split('.');
        const lastKey = parts.pop();
        let target = this._workingConfig;

        // Navigate to parent object, creating if needed
        for (const part of parts) {
            if (!target[part] || typeof target[part] !== 'object') {
                target[part] = {};
            }
            target = target[part];
        }

        // Set value
        target[lastKey] = value;

        lcardsLog.debug(`[ChartStudio] Updated ${path} =`, value);

        // Trigger preview update (debounced)
        this._schedulePreviewUpdate();
        this.requestUpdate();
    }

    /**
     * Schedule preview update with debounce
     * @private
     */
    _schedulePreviewUpdate() {
        if (this._previewUpdateTimer) {
            clearTimeout(this._previewUpdateTimer);
        }

        this._previewUpdateTimer = setTimeout(() => {
            this._updatePreviewCard();
            this._previewUpdateTimer = null;
        }, 300);
    }

    /**
     * Update preview card
     * @private
     */
    _updatePreviewCard() {
        lcardsLog.debug('[ChartStudio] Updating preview with config:', this._workingConfig);
        this.requestUpdate();
    }

    /**
     * Handle tab switch
     * @param {string} tabId - Tab identifier
     * @private
     */
    _handleTabClick(tabId) {
        this._activeTab = tabId;
        lcardsLog.debug('[ChartStudio] Switched to tab:', tabId);
    }

    /**
     * Handle Save button
     * @private
     */
    _handleSave() {
        lcardsLog.debug('[ChartStudio] Saving config:', this._workingConfig);

        // Dispatch config-changed event
        this.dispatchEvent(new CustomEvent('config-changed', {
            detail: { config: this._workingConfig },
            bubbles: true,
            composed: true
        }));

        // Close dialog
        this._handleClose();
    }

    /**
     * Handle Cancel button
     * @private
     */
    _handleCancel() {
        // Confirm if changes were made
        const hasChanges = JSON.stringify(this._workingConfig) !== JSON.stringify(this._initialConfig);
        
        if (hasChanges) {
            const confirmed = confirm('You have unsaved changes. Are you sure you want to cancel?');
            if (!confirmed) return;
        }

        this._handleClose();
    }

    /**
     * Handle Reset button
     * @private
     */
    _handleReset() {
        const confirmed = confirm('Reset all changes to original configuration?');
        if (!confirmed) return;

        this._workingConfig = JSON.parse(JSON.stringify(this._initialConfig));
        this._schedulePreviewUpdate();
        this.requestUpdate();
        lcardsLog.debug('[ChartStudio] Reset to initial config');
    }

    /**
     * Handle dialog close
     * @private
     */
    _handleClose() {
        this.dispatchEvent(new CustomEvent('closed', {
            bubbles: true,
            composed: true
        }));
    }

    /**
     * Render tab navigation
     * @returns {TemplateResult}
     * @private
     */
    _renderTabNavigation() {
        const tabs = [
            { id: 'data-sources', icon: 'mdi:database', label: 'Data Sources' },
            { id: 'chart-type', icon: 'mdi:chart-line', label: 'Chart Type' },
            { id: 'colors', icon: 'mdi:palette', label: 'Colors' },
            { id: 'stroke-fill', icon: 'mdi:brush', label: 'Stroke & Fill' },
            { id: 'markers-grid', icon: 'mdi:chart-scatter-plot', label: 'Markers & Grid' },
            { id: 'axes', icon: 'mdi:axis-arrow', label: 'Axes' },
            { id: 'legend-labels', icon: 'mdi:label', label: 'Legend & Labels' },
            { id: 'theme', icon: 'mdi:theme-light-dark', label: 'Theme' },
            { id: 'animation', icon: 'mdi:animation', label: 'Animation' },
            { id: 'advanced', icon: 'mdi:cog', label: 'Advanced' }
        ];

        return html`
            <div class="tab-navigation">
                ${tabs.map(tab => html`
                    <button
                        class="tab-button ${this._activeTab === tab.id ? 'active' : ''}"
                        @click=${() => this._handleTabClick(tab.id)}>
                        <ha-icon icon="${tab.icon}"></ha-icon>
                        ${tab.label}
                    </button>
                `)}
            </div>
        `;
    }

    /**
     * Render active tab content
     * @returns {TemplateResult}
     * @private
     */
    _renderTabContent() {
        switch (this._activeTab) {
            case 'data-sources':
                return this._renderDataSourcesTab();
            case 'chart-type':
                return this._renderChartTypeTab();
            case 'colors':
                return this._renderColorsTab();
            case 'stroke-fill':
                return this._renderStrokeFillTab();
            case 'markers-grid':
                return this._renderMarkersGridTab();
            case 'axes':
                return this._renderAxesTab();
            case 'legend-labels':
                return this._renderLegendLabelsTab();
            case 'theme':
                return this._renderThemeTab();
            case 'animation':
                return this._renderAnimationTab();
            case 'advanced':
                return this._renderAdvancedTab();
            default:
                return html`<p>Unknown tab: ${this._activeTab}</p>`;
        }
    }

    // ============================================================================
    // TAB CONTENT RENDERERS (Phase 1 Placeholders)
    // ============================================================================

    /**
     * Render Data Sources tab
     * @returns {TemplateResult}
     * @private
     */
    _renderDataSourcesTab() {
        return html`
            <div class="data-sources-tab">
                ${this._renderLevelSelector()}
                
                <div class="level-content">
                    ${this._dataSourceLevel === 'simple' ? this._renderSimpleMode() : ''}
                    ${this._dataSourceLevel === 'multi' ? this._renderMultiMode() : ''}
                    ${this._dataSourceLevel === 'advanced' ? this._renderAdvancedMode() : ''}
                </div>

                ${this._renderDataSourceHelp()}
            </div>

            ${this._showDataSourcePicker ? html`
                <lcards-datasource-picker-dialog
                    .hass=${this.hass}
                    .open=${this._showDataSourcePicker}
                    @source-selected=${this._handleDataSourceSelected}
                    @closed=${() => this._showDataSourcePicker = false}>
                </lcards-datasource-picker-dialog>
            ` : ''}
        `;
    }

    /**
     * Render level selector (Simple / Multi-Series / Advanced)
     * @returns {TemplateResult}
     * @private
     */
    _renderLevelSelector() {
        const levels = [
            {
                id: 'simple',
                title: 'Simple',
                description: 'Single entity reference'
            },
            {
                id: 'multi',
                title: 'Multi-Series',
                description: 'Multiple entities'
            },
            {
                id: 'advanced',
                title: 'Advanced',
                description: 'Full DataSource config'
            }
        ];

        return html`
            <div class="level-selector">
                ${levels.map(level => html`
                    <div
                        class="level-card ${this._dataSourceLevel === level.id ? 'active' : ''}"
                        @click=${() => this._switchDataSourceLevel(level.id)}>
                        <div class="level-card-title">${level.title}</div>
                        <div class="level-card-description">${level.description}</div>
                    </div>
                `)}
            </div>
        `;
    }

    /**
     * Render Simple Mode (single entity)
     * @returns {TemplateResult}
     * @private
     */
    _renderSimpleMode() {
        const entityId = this._workingConfig.source || '';
        const attribute = this._workingConfig.attribute || '';

        return html`
            <lcards-form-section header="Entity Configuration">
                <div class="form-field">
                    <label class="form-label">Entity</label>
                    <ha-entity-picker
                        .hass=${this.hass}
                        .value=${entityId}
                        @value-changed=${(e) => this._updateConfig('source', e.detail.value)}
                        allow-custom-entity>
                    </ha-entity-picker>
                    <div class="form-helper">Select a Home Assistant entity to chart</div>
                </div>

                <div class="form-field">
                    <label class="form-label">Attribute (Optional)</label>
                    <ha-textfield
                        .value=${attribute}
                        @input=${(e) => this._updateConfig('attribute', e.target.value)}
                        placeholder="e.g., temperature">
                    </ha-textfield>
                    <div class="form-helper">Track a specific entity attribute instead of state</div>
                </div>

                ${this._renderEntityPreview(entityId)}
            </lcards-form-section>

            ${this._renderHistoryConfig()}
        `;
    }

    /**
     * Render Multi-Series Mode
     * @returns {TemplateResult}
     * @private
     */
    _renderMultiMode() {
        const sources = this._workingConfig.sources || [];
        const seriesNames = this._workingConfig.series_names || [];

        return html`
            <lcards-form-section header="Series Configuration">
                <div class="series-list">
                    ${sources.map((source, index) => html`
                        <div class="series-item">
                            <div class="series-controls">
                                <ha-icon-button
                                    @click=${() => this._moveSeries(index, -1)}
                                    .disabled=${index === 0}>
                                    <ha-icon icon="mdi:arrow-up"></ha-icon>
                                </ha-icon-button>
                                <ha-icon-button
                                    @click=${() => this._moveSeries(index, 1)}
                                    .disabled=${index === sources.length - 1}>
                                    <ha-icon icon="mdi:arrow-down"></ha-icon>
                                </ha-icon-button>
                                <ha-icon-button
                                    @click=${() => this._removeSeries(index)}>
                                    <ha-icon icon="mdi:delete"></ha-icon>
                                </ha-icon-button>
                            </div>
                            <div class="series-content">
                                <div class="form-field">
                                    <label class="form-label">Entity</label>
                                    <ha-entity-picker
                                        .hass=${this.hass}
                                        .value=${source}
                                        @value-changed=${(e) => this._updateSeries(index, e.detail.value)}
                                        allow-custom-entity>
                                    </ha-entity-picker>
                                </div>
                                <div class="form-field">
                                    <label class="form-label">Series Name</label>
                                    <ha-textfield
                                        .value=${seriesNames[index] || ''}
                                        @input=${(e) => this._updateSeriesName(index, e.target.value)}
                                        placeholder="Custom legend name">
                                    </ha-textfield>
                                </div>
                            </div>
                        </div>
                    `)}
                </div>

                <ha-button class="add-button" @click=${this._addSeries}>
                    <ha-icon icon="mdi:plus" slot="icon"></ha-icon>
                    Add Series
                </ha-button>
            </lcards-form-section>

            ${this._renderHistoryConfig()}
        `;
    }

    /**
     * Render Advanced Mode (DataSource configuration)
     * @returns {TemplateResult}
     * @private
     */
    _renderAdvancedMode() {
        const dataSources = this._workingConfig.data_sources || {};
        const sources = this._workingConfig.sources || [];

        return html`
            <lcards-form-section header="DataSource Configuration">
                <lcards-message
                    type="info"
                    message="Advanced mode provides full control over DataSource configuration including history preload, throttling, and transformations.">
                </lcards-message>

                ${Object.keys(dataSources).length > 0 ? html`
                    <div class="datasource-list">
                        ${Object.entries(dataSources).map(([name, config]) => html`
                            <div class="datasource-item">
                                <div class="datasource-header">
                                    <div>
                                        <div class="datasource-name">${name}</div>
                                        <div class="datasource-entity">${config.entity || 'No entity'}</div>
                                    </div>
                                    <ha-icon-button
                                        @click=${() => this._removeDataSource(name)}>
                                        <ha-icon icon="mdi:delete"></ha-icon>
                                    </ha-icon-button>
                                </div>
                                ${this._renderDataSourceInlineConfig(name, config)}
                            </div>
                        `)}
                    </div>
                ` : html`
                    <lcards-message
                        type="info"
                        message="No DataSources configured. Click 'Add DataSource' to get started.">
                    </lcards-message>
                `}

                <ha-button class="add-button" @click=${() => this._showDataSourcePicker = true}>
                    <ha-icon icon="mdi:plus" slot="icon"></ha-icon>
                    Add DataSource
                </ha-button>
            </lcards-form-section>

            ${sources.length > 0 ? html`
                <lcards-form-section header="Sources Order">
                    <lcards-message
                        type="info"
                        message="Order determines the sequence of series in the chart.">
                    </lcards-message>
                    <div class="series-list">
                        ${sources.map((source, index) => html`
                            <div class="series-item">
                                <div class="series-controls">
                                    <ha-icon-button
                                        @click=${() => this._moveSource(index, -1)}
                                        .disabled=${index === 0}>
                                        <ha-icon icon="mdi:arrow-up"></ha-icon>
                                    </ha-icon-button>
                                    <ha-icon-button
                                        @click=${() => this._moveSource(index, 1)}
                                        .disabled=${index === sources.length - 1}>
                                        <ha-icon icon="mdi:arrow-down"></ha-icon>
                                    </ha-icon-button>
                                </div>
                                <div class="series-content">
                                    <strong>${source}</strong>
                                </div>
                            </div>
                        `)}
                    </div>
                </lcards-form-section>
            ` : ''}
        `;
    }

    /**
     * Render inline DataSource configuration
     * @param {string} name - DataSource name
     * @param {Object} config - DataSource config
     * @returns {TemplateResult}
     * @private
     */
    _renderDataSourceInlineConfig(name, config) {
        const windowSeconds = config.window_seconds || 3600;
        const minEmitMs = config.minEmitMs || 0;
        const historyPreload = config.history?.preload || false;
        const historyHours = config.history?.hours || 0;

        return html`
            <div style="margin-top: 12px;">
                <div class="form-field">
                    <label class="form-label">Entity</label>
                    <ha-entity-picker
                        .hass=${this.hass}
                        .value=${config.entity || ''}
                        @value-changed=${(e) => this._updateDataSourceConfig(name, 'entity', e.detail.value)}
                        allow-custom-entity>
                    </ha-entity-picker>
                </div>

                <div class="form-field">
                    <label class="form-label">Window (seconds): ${windowSeconds}</label>
                    <ha-textfield
                        type="number"
                        min="60"
                        max="86400"
                        .value=${windowSeconds}
                        @input=${(e) => this._updateDataSourceConfig(name, 'window_seconds', parseInt(e.target.value))}>
                    </ha-textfield>
                </div>

                <div class="form-field">
                    <label class="form-label">Min Emit (ms): ${minEmitMs}</label>
                    <ha-textfield
                        type="number"
                        min="0"
                        max="10000"
                        .value=${minEmitMs}
                        @input=${(e) => this._updateDataSourceConfig(name, 'minEmitMs', parseInt(e.target.value))}>
                    </ha-textfield>
                </div>

                <div class="form-field">
                    <label class="form-label">
                        <ha-checkbox
                            .checked=${historyPreload}
                            @change=${(e) => this._updateDataSourceHistoryConfig(name, 'preload', e.target.checked)}>
                        </ha-checkbox>
                        Preload History
                    </label>
                </div>

                ${historyPreload ? html`
                    <div class="form-field">
                        <label class="form-label">History Hours: ${historyHours}</label>
                        <ha-textfield
                            type="number"
                            min="0"
                            max="168"
                            .value=${historyHours}
                            @input=${(e) => this._updateDataSourceHistoryConfig(name, 'hours', parseInt(e.target.value))}>
                        </ha-textfield>
                    </div>
                ` : ''}
            </div>
        `;
    }

    /**
     * Render history configuration (common to simple and multi modes)
     * @returns {TemplateResult}
     * @private
     */
    _renderHistoryConfig() {
        // This would typically be in the chart card's history configuration
        // For now, just show a placeholder
        return html`
            <lcards-form-section header="History Configuration">
                <lcards-message
                    type="info"
                    message="History configuration can be set in the Advanced tab or per DataSource in Advanced mode.">
                </lcards-message>
            </lcards-form-section>
        `;
    }

    /**
     * Render entity preview
     * @param {string} entityId - Entity ID
     * @returns {TemplateResult}
     * @private
     */
    _renderEntityPreview(entityId) {
        if (!entityId || !this.hass || !this.hass.states) {
            return html``;
        }

        const entityState = this.hass.states[entityId];
        if (!entityState) {
            return html`
                <lcards-message
                    type="warning"
                    message="Entity not found in Home Assistant.">
                </lcards-message>
            `;
        }

        return html`
            <div class="entity-preview">
                <div class="entity-preview-header">📋 Entity Preview</div>
                <div class="entity-preview-item">
                    <span class="entity-preview-label">State:</span>
                    <span class="entity-preview-value">${entityState.state}</span>
                </div>
                ${entityState.attributes?.unit_of_measurement ? html`
                    <div class="entity-preview-item">
                        <span class="entity-preview-label">Unit:</span>
                        <span class="entity-preview-value">${entityState.attributes.unit_of_measurement}</span>
                    </div>
                ` : ''}
                ${entityState.attributes?.friendly_name ? html`
                    <div class="entity-preview-item">
                        <span class="entity-preview-label">Friendly Name:</span>
                        <span class="entity-preview-value">${entityState.attributes.friendly_name}</span>
                    </div>
                ` : ''}
            </div>
        `;
    }

    /**
     * Render data source help documentation
     * @returns {TemplateResult}
     * @private
     */
    _renderDataSourceHelp() {
        return html`
            <lcards-form-section header="Help" ?expanded=${false}>
                <div style="font-size: 14px; line-height: 1.6;">
                    <h4>Simple Mode</h4>
                    <p>Quick chart from a single entity. Best for beginners.</p>
                    
                    <h4>Multi-Series Mode</h4>
                    <p>Display multiple entities on the same chart with custom names.</p>
                    
                    <h4>Advanced Mode</h4>
                    <p>Full DataSource control with history preload, throttling, and transformations.</p>
                </div>
            </lcards-form-section>
        `;
    }

    // ============================================================================
    // DATA SOURCES TAB HELPER METHODS
    // ============================================================================

    /**
     * Detect data source level from config
     * @returns {string} 'simple' | 'multi' | 'advanced'
     * @private
     */
    _detectDataSourceLevel() {
        const config = this._workingConfig;
        
        if (config.data_sources && Object.keys(config.data_sources).length > 0) {
            return 'advanced';
        } else if (Array.isArray(config.sources) && config.sources.length > 0) {
            return 'multi';
        } else if (config.source) {
            return 'simple';
        }
        
        return 'simple'; // Default
    }

    /**
     * Switch data source level
     * @param {string} level - 'simple' | 'multi' | 'advanced'
     * @private
     */
    _switchDataSourceLevel(level) {
        if (level === this._dataSourceLevel) return;

        // Check if config exists and confirm switch
        const hasExistingConfig = this._hasDataSourceConfig();
        if (hasExistingConfig) {
            const confirmed = confirm(
                'Switching levels will clear existing data source configuration. Continue?'
            );
            if (!confirmed) return;
        }

        // Clear incompatible config properties
        this._clearDataSourceConfig();

        // Update level
        this._dataSourceLevel = level;

        // Initialize for new level
        if (level === 'simple') {
            // Nothing to initialize
        } else if (level === 'multi') {
            if (!this._workingConfig.sources) {
                this._workingConfig.sources = [];
            }
        } else if (level === 'advanced') {
            if (!this._workingConfig.data_sources) {
                this._workingConfig.data_sources = {};
            }
            if (!this._workingConfig.sources) {
                this._workingConfig.sources = [];
            }
        }

        lcardsLog.debug('[ChartStudio] Switched to level:', level);
        this.requestUpdate();
    }

    /**
     * Check if data source config exists
     * @returns {boolean}
     * @private
     */
    _hasDataSourceConfig() {
        return !!(
            this._workingConfig.source ||
            (this._workingConfig.sources && this._workingConfig.sources.length > 0) ||
            (this._workingConfig.data_sources && Object.keys(this._workingConfig.data_sources).length > 0)
        );
    }

    /**
     * Clear all data source configuration
     * @private
     */
    _clearDataSourceConfig() {
        delete this._workingConfig.source;
        delete this._workingConfig.attribute;
        delete this._workingConfig.sources;
        delete this._workingConfig.series_names;
        delete this._workingConfig.data_sources;
    }

    /**
     * Add a new series (multi mode)
     * @private
     */
    _addSeries() {
        if (!this._workingConfig.sources) {
            this._workingConfig.sources = [];
        }
        this._workingConfig.sources.push('');
        this.requestUpdate();
        this._schedulePreviewUpdate();
    }

    /**
     * Update a series entity
     * @param {number} index - Series index
     * @param {string} value - New entity ID
     * @private
     */
    _updateSeries(index, value) {
        if (!this._workingConfig.sources) return;
        this._workingConfig.sources[index] = value;
        this.requestUpdate();
        this._schedulePreviewUpdate();
    }

    /**
     * Update series name
     * @param {number} index - Series index
     * @param {string} value - New name
     * @private
     */
    _updateSeriesName(index, value) {
        if (!this._workingConfig.series_names) {
            this._workingConfig.series_names = [];
        }
        this._workingConfig.series_names[index] = value;
        this.requestUpdate();
        this._schedulePreviewUpdate();
    }

    /**
     * Move series up or down
     * @param {number} index - Series index
     * @param {number} direction - -1 for up, 1 for down
     * @private
     */
    _moveSeries(index, direction) {
        if (!this._workingConfig.sources) return;
        
        const newIndex = index + direction;
        if (newIndex < 0 || newIndex >= this._workingConfig.sources.length) return;

        // Swap sources
        [this._workingConfig.sources[index], this._workingConfig.sources[newIndex]] = 
        [this._workingConfig.sources[newIndex], this._workingConfig.sources[index]];

        // Swap series names if they exist
        if (this._workingConfig.series_names && this._workingConfig.series_names.length > index) {
            [this._workingConfig.series_names[index], this._workingConfig.series_names[newIndex]] = 
            [this._workingConfig.series_names[newIndex], this._workingConfig.series_names[index]];
        }

        this.requestUpdate();
        this._schedulePreviewUpdate();
    }

    /**
     * Remove a series
     * @param {number} index - Series index
     * @private
     */
    _removeSeries(index) {
        if (!this._workingConfig.sources) return;
        
        this._workingConfig.sources.splice(index, 1);
        
        if (this._workingConfig.series_names && this._workingConfig.series_names.length > index) {
            this._workingConfig.series_names.splice(index, 1);
        }

        this.requestUpdate();
        this._schedulePreviewUpdate();
    }

    /**
     * Handle DataSource selected from picker
     * @param {CustomEvent} e - source-selected event
     * @private
     */
    _handleDataSourceSelected(e) {
        const sourceId = e.detail.source;
        
        if (!this._workingConfig.sources) {
            this._workingConfig.sources = [];
        }
        
        // Add to sources if not already present
        if (!this._workingConfig.sources.includes(sourceId)) {
            this._workingConfig.sources.push(sourceId);
        }

        // Get the DataSource config from manager
        const dsManager = window.lcards?.core?.dataSourceManager;
        if (dsManager && dsManager.sources) {
            const ds = dsManager.sources.get(sourceId);
            if (ds) {
                // Add to data_sources config if not already present
                if (!this._workingConfig.data_sources) {
                    this._workingConfig.data_sources = {};
                }
                
                if (!this._workingConfig.data_sources[sourceId]) {
                    this._workingConfig.data_sources[sourceId] = {
                        entity: ds.config?.entity || '',
                        window_seconds: ds.config?.windowSeconds || 3600,
                        minEmitMs: ds.config?.minEmitMs || 0,
                        history: {
                            preload: false,
                            hours: 0
                        }
                    };
                }
            }
        }

        this._showDataSourcePicker = false;
        this.requestUpdate();
        this._schedulePreviewUpdate();
    }

    /**
     * Remove a DataSource
     * @param {string} name - DataSource name
     * @private
     */
    _removeDataSource(name) {
        const confirmed = confirm(`Remove DataSource "${name}"?`);
        if (!confirmed) return;

        // Remove from data_sources
        if (this._workingConfig.data_sources) {
            delete this._workingConfig.data_sources[name];
        }

        // Remove from sources
        if (this._workingConfig.sources) {
            const index = this._workingConfig.sources.indexOf(name);
            if (index > -1) {
                this._workingConfig.sources.splice(index, 1);
            }
        }

        this.requestUpdate();
        this._schedulePreviewUpdate();
    }

    /**
     * Update DataSource configuration
     * @param {string} name - DataSource name
     * @param {string} key - Config key
     * @param {*} value - New value
     * @private
     */
    _updateDataSourceConfig(name, key, value) {
        if (!this._workingConfig.data_sources || !this._workingConfig.data_sources[name]) return;
        
        this._workingConfig.data_sources[name][key] = value;
        this.requestUpdate();
        this._schedulePreviewUpdate();
    }

    /**
     * Update DataSource history configuration
     * @param {string} name - DataSource name
     * @param {string} key - History config key
     * @param {*} value - New value
     * @private
     */
    _updateDataSourceHistoryConfig(name, key, value) {
        if (!this._workingConfig.data_sources || !this._workingConfig.data_sources[name]) return;
        
        if (!this._workingConfig.data_sources[name].history) {
            this._workingConfig.data_sources[name].history = {};
        }
        
        this._workingConfig.data_sources[name].history[key] = value;
        this.requestUpdate();
        this._schedulePreviewUpdate();
    }

    /**
     * Move source up or down in sources list
     * @param {number} index - Source index
     * @param {number} direction - -1 for up, 1 for down
     * @private
     */
    _moveSource(index, direction) {
        if (!this._workingConfig.sources) return;
        
        const newIndex = index + direction;
        if (newIndex < 0 || newIndex >= this._workingConfig.sources.length) return;

        [this._workingConfig.sources[index], this._workingConfig.sources[newIndex]] = 
        [this._workingConfig.sources[newIndex], this._workingConfig.sources[index]];

        this.requestUpdate();
        this._schedulePreviewUpdate();
    }

    _renderChartTypeTab() {
        return this._renderComingSoon('Chart Type', 'Phase 3',
            'Visual chart type selector with 16 chart types and dimension configuration');
    }

    _renderColorsTab() {
        return this._renderComingSoon('Colors', 'Phase 3',
            'Series colors, stroke colors, fill colors, background, markers, and legend colors');
    }

    _renderStrokeFillTab() {
        return this._renderComingSoon('Stroke & Fill', 'Phase 3',
            'Line styling, stroke width, fill types, gradients, and transparency');
    }

    _renderMarkersGridTab() {
        return this._renderComingSoon('Markers & Grid', 'Phase 3',
            'Data point markers, grid configuration, and axis lines');
    }

    _renderAxesTab() {
        return this._renderComingSoon('Axes', 'Phase 4',
            'X/Y axis styling, labels, borders, ticks, and formatting');
    }

    _renderLegendLabelsTab() {
        return this._renderComingSoon('Legend & Labels', 'Phase 4',
            'Legend position, data labels, tooltips, and annotations');
    }

    _renderThemeTab() {
        return this._renderComingSoon('Theme', 'Phase 4',
            'Theme mode, palette selection, and monochrome settings');
    }

    _renderAnimationTab() {
        return this._renderComingSoon('Animation', 'Phase 4',
            'Animation presets and custom animation configuration');
    }

    _renderAdvancedTab() {
        return this._renderComingSoon('Advanced', 'Phase 5',
            'Formatters, typography, display options, and raw chart_options override');
    }

    /**
     * Render "Coming Soon" placeholder
     * @param {string} title - Tab title
     * @param {string} phase - Phase when it will be implemented
     * @param {string} description - What will be in this tab
     * @returns {TemplateResult}
     * @private
     */
    _renderComingSoon(title, phase, description) {
        return html`
            <div class="coming-soon">
                <ha-icon icon="mdi:hammer-wrench"></ha-icon>
                <h3>${title}</h3>
                <p><strong>Coming in ${phase}</strong></p>
                <p style="margin-top: 12px;">${description}</p>
            </div>
        `;
    }

    /**
     * Render validation errors
     * @returns {TemplateResult|string}
     * @private
     */
    _renderValidationErrors() {
        if (!this._validationErrors || this._validationErrors.length === 0) {
            return '';
        }

        return html`
            <div class="validation-errors">
                <h4>⚠️ Configuration Errors</h4>
                <ul>
                    ${this._validationErrors.map(err => html`<li>${err}</li>`)}
                </ul>
            </div>
        `;
    }

    render() {
        return html`
            <ha-dialog
                open
                @closed=${this._handleClose}
                .heading=${'Chart Configuration Studio'}>
                
                <div slot="primaryAction">
                    <ha-button @click=${this._handleSave}>
                        <ha-icon icon="mdi:content-save" slot="icon"></ha-icon>
                        Save
                    </ha-button>
                </div>

                <div slot="secondaryAction">
                    <ha-button @click=${this._handleReset}>
                        <ha-icon icon="mdi:restore" slot="icon"></ha-icon>
                        Reset
                    </ha-button>
                    <ha-button @click=${this._handleCancel}>
                        <ha-icon icon="mdi:close" slot="icon"></ha-icon>
                        Cancel
                    </ha-button>
                </div>

                <div class="dialog-content">
                    ${this._renderValidationErrors()}

                    <div class="studio-layout">
                        <!-- Configuration Panel (60%) -->
                        <div class="config-panel">
                            ${this._renderTabNavigation()}
                            <div class="tab-content">
                                ${this._renderTabContent()}
                            </div>
                        </div>

                        <!-- Preview Panel (40%) -->
                        <div class="preview-panel">
                            <lcards-chart-live-preview
                                .hass=${this.hass}
                                .config=${this._workingConfig}
                                .showRefreshButton=${true}>
                            </lcards-chart-live-preview>
                        </div>
                    </div>
                </div>
            </ha-dialog>
        `;
    }
}

// Register custom element
customElements.define('lcards-chart-studio-dialog', LCARdSChartStudioDialog);
