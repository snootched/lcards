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
import '../../cards/lcards-chart.js';
import { getChartSchema } from '../../cards/schemas/chart-schema.js';
import '../components/editors/lcards-color-section.js';
import '../components/editors/lcards-color-array.js';

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
            _renderKey: { type: Number, state: true } // Preview render key for forced updates
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

        // Initialize chart schema
        this._chartSchema = getChartSchema();
        
        // Preview render key for forced updates
        this._renderKey = 0;
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
        return this._getSchemaByPath(path);
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
            this._renderKey++; // Force preview re-render
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
    async _handleCancel() {
        // Confirm if changes were made
        const hasChanges = JSON.stringify(this._workingConfig) !== JSON.stringify(this._initialConfig);
        
        if (hasChanges) {
            const confirmed = await this._showConfirmDialog(
                'Unsaved Changes',
                'You have unsaved changes. Are you sure you want to cancel?'
            );
            if (!confirmed) return;
        }

        this._handleClose();
    }

    /**
     * Handle Reset button
     * @private
     */
    async _handleReset() {
        const confirmed = await this._showConfirmDialog(
            'Reset Configuration',
            'Reset all changes to original configuration?'
        );
        if (!confirmed) return;

        this._workingConfig = JSON.parse(JSON.stringify(this._initialConfig));
        this._schedulePreviewUpdate();
        this.requestUpdate();
        lcardsLog.debug('[ChartStudio] Reset to initial config');
    }

    /**
     * Show confirmation dialog using HA design system
     * @private
     * @param {string} title - Dialog title
     * @param {string} message - Dialog message
     * @returns {Promise<boolean>} True if confirmed, false if cancelled
     */
    async _showConfirmDialog(title, message) {
        return new Promise((resolve) => {
            // Create dialog element
            const dialog = document.createElement('ha-dialog');
            dialog.heading = title;
            dialog.open = true;
            
            // Create content
            const content = document.createElement('div');
            content.textContent = message;
            content.style.padding = '16px';
            content.style.lineHeight = '1.5';
            dialog.appendChild(content);
            
            // Create button container
            const buttonContainer = document.createElement('div');
            buttonContainer.slot = 'secondaryAction';
            buttonContainer.style.display = 'flex';
            buttonContainer.style.gap = '8px';
            
            // Cancel button with explicit handler
            const cancelButton = document.createElement('ha-button');
            cancelButton.textContent = 'Cancel';
            cancelButton.addEventListener('click', () => {
                dialog.close();
                resolve(false);
            });
            
            // Confirm button with explicit handler
            const confirmButton = document.createElement('ha-button');
            confirmButton.textContent = 'Continue';
            confirmButton.setAttribute('raised', '');
            confirmButton.addEventListener('click', () => {
                dialog.close();
                resolve(true);
            });
            
            buttonContainer.appendChild(cancelButton);
            buttonContainer.appendChild(confirmButton);
            dialog.appendChild(buttonContainer);
            
            // Handle dialog close (ESC key or backdrop click)
            dialog.addEventListener('closed', () => {
                setTimeout(() => dialog.remove(), 100);
            });
            
            // Append to body
            document.body.appendChild(dialog);
        });
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
                    <ha-selector
                        .hass=${this.hass}
                        .selector=${{ entity: {} }}
                        .value=${entityId}
                        @value-changed=${(e) => this._updateConfig('source', e.detail.value)}>
                    </ha-selector>
                    <div class="form-helper">Select a Home Assistant entity to chart</div>
                </div>

                <div class="form-field">
                    <label class="form-label">Attribute (Optional)</label>
                    <ha-selector
                        .hass=${this.hass}
                        .selector=${{ text: {} }}
                        .value=${attribute}
                        @value-changed=${(e) => this._updateConfig('attribute', e.detail.value)}>
                    </ha-selector>
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
                                    <ha-selector
                                        .hass=${this.hass}
                                        .selector=${{ entity: {} }}
                                        .value=${source}
                                        @value-changed=${(e) => this._updateSeries(index, 'source', e.detail.value)}>
                                    </ha-selector>
                                </div>
                                <div class="form-field">
                                    <label class="form-label">Series Name</label>
                                    <ha-selector
                                        .hass=${this.hass}
                                        .selector=${{ text: {} }}
                                        .value=${seriesNames[index] || source}
                                        @value-changed=${(e) => this._updateSeries(index, 'name', e.detail.value)}>
                                    </ha-selector>
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

                <ha-button class="add-button" @click=${() => this._openDataSourcePicker()}>
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
                    <ha-selector
                        .hass=${this.hass}
                        .selector=${{ entity: {} }}
                        .value=${config.entity || ''}
                        @value-changed=${(e) => this._updateDataSourceConfig(name, 'entity', e.detail.value)}>
                    </ha-selector>
                </div>

                <div class="form-field">
                    <label class="form-label">Window (seconds)</label>
                    <ha-selector
                        .hass=${this.hass}
                        .selector=${{ number: { min: 60, max: 86400, mode: 'box' } }}
                        .value=${windowSeconds}
                        @value-changed=${(e) => this._updateDataSourceConfig(name, 'window_seconds', e.detail.value)}>
                    </ha-selector>
                </div>

                <div class="form-field">
                    <label class="form-label">Min Emit (ms)</label>
                    <ha-selector
                        .hass=${this.hass}
                        .selector=${{ number: { min: 0, max: 10000, mode: 'box' } }}
                        .value=${minEmitMs}
                        @value-changed=${(e) => this._updateDataSourceConfig(name, 'minEmitMs', e.detail.value)}>
                    </ha-selector>
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
                        <label class="form-label">History Hours</label>
                        <ha-selector
                            .hass=${this.hass}
                            .selector=${{ number: { min: 0, max: 168, mode: 'box' } }}
                            .value=${historyHours}
                            @value-changed=${(e) => this._updateDataSourceHistoryConfig(name, 'hours', e.detail.value)}>
                        </ha-selector>
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
    async _switchDataSourceLevel(level) {
        if (level === this._dataSourceLevel) return;

        // Check if config exists and confirm switch
        const hasExistingConfig = this._hasDataSourceConfig();
        if (hasExistingConfig) {
            const confirmed = await this._showConfirmDialog(
                'Switch Data Source Level?',
                'Switching data source levels will reset your current configuration. Continue?'
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
     * Update a series entity or name
     * @param {number} index - Series index
     * @param {string} field - 'source' or 'name'
     * @param {string} value - New value
     * @private
     */
    _updateSeries(index, field, value) {
        if (field === 'source') {
            if (!this._workingConfig.sources) return;
            this._workingConfig.sources[index] = value;
        } else if (field === 'name') {
            if (!this._workingConfig.series_names) {
                this._workingConfig.series_names = [];
            }
            this._workingConfig.series_names[index] = value;
        }
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
     * Open DataSource editor (redirect to main editor)
     * @private
     */
    async _openDataSourcePicker() {
        const confirmed = await this._showConfirmDialog(
            'Open DataSource Editor',
            'Advanced DataSource configuration requires the full editor. Save your changes and open the DataSource editor tab?'
        );
        
        if (confirmed) {
            // Save and close studio
            this._handleSave();
        }
    }

    /**
     * Remove a DataSource
     * @param {string} name - DataSource name
     * @private
     */
    async _removeDataSource(name) {
        const confirmed = await this._showConfirmDialog(
            'Remove DataSource?',
            `Remove DataSource "${name}"? This will also remove it from the sources list.`
        );
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

    /**
     * Get nested config value by dot-notation path
     * @private
     * @param {string} path - Dot-separated path (e.g., 'style.colors.series')
     * @returns {*} Value at path or undefined
     */
    _getNestedValue(path) {
        const parts = path.split('.');
        let value = this._workingConfig;
        for (const part of parts) {
            value = value?.[part];
            if (value === undefined) return undefined;
        }
        return value;
    }

    /**
     * Set nested config value by dot-notation path
     * @private
     * @param {string} path - Dot-separated path
     * @param {*} value - Value to set
     */
    _setNestedValue(path, value) {
        const parts = path.split('.');
        const lastPart = parts.pop();
        
        let target = this._workingConfig;
        for (const part of parts) {
            if (!target[part]) {
                target[part] = {};
            }
            target = target[part];
        }
        
        target[lastPart] = value;
        this.requestUpdate();
        this._updatePreview();
    }

    /**
     * Get schema by dot-notation path
     * Navigates nested schema structure for lcards-form-control
     * @private
     * @param {string} path - Dot-separated path (e.g., 'style.stroke.width')
     * @returns {Object} Schema object or fallback
     */
    _getSchemaByPath(path) {
        const parts = path.split('.');
        let schema = this._chartSchema;
        
        for (const part of parts) {
            if (schema.properties && schema.properties[part]) {
                schema = schema.properties[part];
            } else {
                // Fallback for missing schema paths
                return { type: 'string', 'x-ui-hints': { selector: { text: {} } } };
            }
        }
        
        return schema;
    }

    /**
     * Render single color picker using lcards-color-section
     * @private
     * @param {string} path - Config path
     * @param {string} label - Field label
     * @param {string} fallback - Fallback color value
     * @returns {TemplateResult}
     */
    _renderSingleColorPicker(path, label, fallback) {
        const value = this._getNestedValue(path) || fallback;
        
        return html`
            <lcards-color-section
                .colors=${value ? [value] : []}
                .label=${label}
                .maxColors=${1}
                .allowEmpty=${false}
                @colors-changed=${(e) => {
                    const color = e.detail.colors?.[0];
                    if (color) {
                        this._setNestedValue(path, color);
                    }
                }}>
            </lcards-color-section>
        `;
    }

    /**
     * Render color array editor using lcards-color-array
     * @private
     * @param {string} path - Config path
     * @param {string} label - Field label
     * @param {string} description - Optional description
     * @returns {TemplateResult}
     */
    _renderColorArray(path, label, description = '') {
        const colors = this._getNestedValue(path) || [];
        
        return html`
            <lcards-color-array
                .hass=${this.hass}
                .colors=${colors}
                .label=${label}
                .description=${description}
                @colors-changed=${(e) => {
                    this._setNestedValue(path, e.detail.colors);
                }}>
            </lcards-color-array>
        `;
    }

    /**
     * Render gradient configuration (conditional)
     * @private
     * @returns {TemplateResult}
     */
    _renderGradientConfig() {
        const gradientType = this._getNestedValue('style.fill.gradient.type') || 'vertical';
        const shadeIntensity = this._getNestedValue('style.fill.gradient.shadeIntensity') ?? 0.5;

        return html`
            <div class="gradient-config" style="padding-left: 16px; border-left: 2px solid var(--divider-color); margin-top: 16px;">
                <h4 style="margin: 0 0 12px 0;">Gradient Settings</h4>
                
                ${FormField.renderField(this, 'style.fill.gradient.type', {
                    label: 'Gradient Direction'
                })}

                ${FormField.renderField(this, 'style.fill.gradient.shadeIntensity', {
                    label: 'Shade Intensity'
                })}
            </div>
        `;
    }

    _renderChartTypeTab() {
        const chartTypes = [
            { value: 'line', label: 'Line', icon: 'mdi:chart-line', desc: 'Trends over time' },
            { value: 'area', label: 'Area', icon: 'mdi:chart-areaspline', desc: 'Volume/magnitude' },
            { value: 'bar', label: 'Bar', icon: 'mdi:chart-bar', desc: 'Comparisons' },
            { value: 'column', label: 'Column', icon: 'mdi:chart-bar-stacked', desc: 'Vertical bars' },
            { value: 'scatter', label: 'Scatter', icon: 'mdi:chart-scatter-plot', desc: 'Correlations' },
            { value: 'pie', label: 'Pie', icon: 'mdi:chart-pie', desc: 'Proportions (circle)' },
            { value: 'donut', label: 'Donut', icon: 'mdi:chart-donut', desc: 'Proportions (ring)' },
            { value: 'radar', label: 'Radar', icon: 'mdi:radar', desc: 'Spider chart' },
            { value: 'radialBar', label: 'Radial Bar', icon: 'mdi:chart-arc', desc: 'Gauges' },
            { value: 'rangeBar', label: 'Range Bar', icon: 'mdi:chart-gantt', desc: 'Timelines' },
            { value: 'polarArea', label: 'Polar Area', icon: 'mdi:chart-donut-variant', desc: 'Directional' },
            { value: 'treemap', label: 'Treemap', icon: 'mdi:view-grid', desc: 'Hierarchical' },
            { value: 'rangeArea', label: 'Range Area', icon: 'mdi:chart-bell-curve', desc: 'Ranges' },
            { value: 'heatmap', label: 'Heatmap', icon: 'mdi:grid', desc: 'Matrix data' },
            { value: 'candlestick', label: 'Candlestick', icon: 'mdi:chart-candlestick', desc: 'OHLC data' },
            { value: 'boxPlot', label: 'Box Plot', icon: 'mdi:chart-box-outline', desc: 'Distributions' }
        ];

        const currentType = this._workingConfig.chart_type || 'line';

        return html`
            <lcards-form-section
                header="Chart Type Selection"
                description="Choose the visualization type for your data"
                icon="mdi:chart-line-variant"
                ?expanded=${true}>
                
                <div class="chart-type-grid" style="
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
                    gap: 12px;
                    margin-top: 16px;
                ">
                    ${chartTypes.map(type => html`
                        <div 
                            class="chart-type-card ${currentType === type.value ? 'selected' : ''}"
                            style="
                                padding: 16px;
                                border: 2px solid ${currentType === type.value ? 'var(--primary-color)' : 'var(--divider-color)'};
                                border-radius: 8px;
                                cursor: pointer;
                                transition: all 0.2s;
                                background: ${currentType === type.value ? 'var(--primary-color)' : 'var(--card-background-color)'};
                                color: ${currentType === type.value ? 'white' : 'var(--primary-text-color)'};
                                text-align: center;
                            "
                            @click=${() => this._setConfigValue('chart_type', type.value)}>
                            <ha-icon 
                                icon="${type.icon}" 
                                style="font-size: 32px; margin-bottom: 8px;">
                            </ha-icon>
                            <div style="font-weight: 600; margin-bottom: 4px;">
                                ${type.label}
                            </div>
                            <div style="font-size: 12px; opacity: 0.9;">
                                ${type.desc}
                            </div>
                        </div>
                    `)}
                </div>
            </lcards-form-section>

            <!-- Dimensions -->
            <lcards-form-section
                header="Chart Dimensions"
                description="Configure chart size and data limits"
                icon="mdi:resize"
                ?expanded=${true}>
                
                ${FormField.renderField(this, 'height', {
                    label: 'Height',
                    helper: 'Chart height in pixels'
                })}

                ${FormField.renderField(this, 'max_points', {
                    label: 'Max Data Points',
                    helper: 'Limit data points for performance (0 = unlimited)'
                })}
            </lcards-form-section>

            <!-- X-Axis Type -->
            <lcards-form-section
                header="X-Axis Configuration"
                description="Configure horizontal axis type"
                icon="mdi:axis-x-arrow"
                ?expanded=${true}>
                
                ${FormField.renderField(this, 'xaxis_type', {
                    label: 'X-Axis Type',
                    helper: 'Type of x-axis scaling'
                })}
            </lcards-form-section>
        `;
    }

    _renderColorsTab() {
        return html`
            <!-- Series Colors (Primary) -->
            <lcards-form-section
                header="Series Colors"
                description="Primary colors for data visualization"
                icon="mdi:palette"
                ?expanded=${true}>
                
                ${this._renderColorArray('style.colors.series', 'Series Colors', 'Colors for each data series')}
            </lcards-form-section>

            <!-- Stroke & Fill Colors -->
            <lcards-form-section
                header="Stroke & Fill Colors"
                description="Line and area fill colors"
                icon="mdi:brush"
                ?expanded=${true}>
                
                ${this._renderColorArray('style.colors.stroke', 'Stroke Colors', 'Outline/line colors')}
                ${this._renderColorArray('style.colors.fill', 'Fill Colors', 'Area fill colors')}
            </lcards-form-section>

            <!-- Background & Foreground -->
            <lcards-form-section
                header="Background & Foreground"
                description="Base chart colors"
                icon="mdi:format-color-fill"
                ?expanded=${true}>
                
                ${this._renderSingleColorPicker('style.colors.background', 'Background', 'transparent')}
                ${this._renderSingleColorPicker('style.colors.foreground', 'Foreground', 'var(--lcars-white, #FFFFFF)')}
                ${this._renderSingleColorPicker('style.colors.grid', 'Grid', 'var(--lcars-gray, #999999)')}
            </lcards-form-section>

            <!-- Marker Colors (Collapsed by default) -->
            <lcards-form-section
                header="Marker Colors"
                description="Data point marker styling"
                icon="mdi:circle"
                ?expanded=${false}>
                
                ${this._renderColorArray('style.colors.marker.fill', 'Marker Fill')}
                ${this._renderColorArray('style.colors.marker.stroke', 'Marker Stroke')}
            </lcards-form-section>

            <!-- Axis Colors (Collapsed) -->
            <lcards-form-section
                header="Axis Colors"
                description="X and Y axis styling"
                icon="mdi:axis-arrow"
                ?expanded=${false}>
                
                ${this._renderSingleColorPicker('style.colors.axis.x', 'X-Axis', null)}
                ${this._renderSingleColorPicker('style.colors.axis.y', 'Y-Axis', null)}
                ${this._renderSingleColorPicker('style.colors.axis.border', 'Axis Border', null)}
                ${this._renderSingleColorPicker('style.colors.axis.ticks', 'Axis Ticks', null)}
            </lcards-form-section>

            <!-- Legend Colors (Collapsed) -->
            <lcards-form-section
                header="Legend Colors"
                description="Legend text styling"
                icon="mdi:label"
                ?expanded=${false}>
                
                ${this._renderSingleColorPicker('style.colors.legend.default', 'Legend Text', null)}
                ${this._renderColorArray('style.colors.legend.items', 'Legend Items', 'Per-item legend colors')}
            </lcards-form-section>

            <!-- Data Label Colors (Collapsed) -->
            <lcards-form-section
                header="Data Label Colors"
                description="On-chart data label styling"
                icon="mdi:label-variant"
                ?expanded=${false}>
                
                ${this._renderColorArray('style.colors.data_labels', 'Data Label Colors')}
            </lcards-form-section>
        `;
    }

    _renderStrokeFillTab() {
        const strokeWidth = this._getNestedValue('style.stroke.width') || 2;
        const strokeCurve = this._getNestedValue('style.stroke.curve') || 'smooth';
        const fillType = this._getNestedValue('style.fill.type') || 'solid';
        const fillOpacity = this._getNestedValue('style.fill.opacity') ?? 0.7;

        return html`
            <!-- Stroke Configuration -->
            <lcards-form-section
                header="Stroke Configuration"
                description="Line and border styling"
                icon="mdi:brush"
                ?expanded=${true}>
                
                ${FormField.renderField(this, 'style.stroke.width', {
                    label: 'Stroke Width'
                })}

                ${FormField.renderField(this, 'style.stroke.curve', {
                    label: 'Curve Type'
                })}
            </lcards-form-section>

            <!-- Fill Configuration -->
            <lcards-form-section
                header="Fill Configuration"
                description="Area and background fill styling"
                icon="mdi:format-color-fill"
                ?expanded=${true}>
                
                ${FormField.renderField(this, 'style.fill.type', {
                    label: 'Fill Type'
                })}

                ${FormField.renderField(this, 'style.fill.opacity', {
                    label: 'Fill Opacity'
                })}

                ${fillType === 'gradient' ? this._renderGradientConfig() : ''}
            </lcards-form-section>
        `;
    }

    _renderMarkersGridTab() {
        const markerSize = this._getNestedValue('style.markers.size') ?? 4;
        const markerStrokeWidth = this._getNestedValue('style.markers.stroke.width') ?? 2;
        const showGrid = this._getNestedValue('style.grid.show') ?? true;
        const gridOpacity = this._getNestedValue('style.grid.opacity') ?? 0.3;

        return html`
            <!-- Markers Configuration -->
            <lcards-form-section
                header="Markers Configuration"
                description="Data point marker styling"
                icon="mdi:circle"
                ?expanded=${true}>
                
                ${FormField.renderField(this, 'style.markers.size', {
                    label: 'Marker Size'
                })}

                ${FormField.renderField(this, 'style.markers.stroke.width', {
                    label: 'Marker Stroke Width'
                })}
            </lcards-form-section>

            <!-- Grid Configuration -->
            <lcards-form-section
                header="Grid Configuration"
                description="Background grid styling"
                icon="mdi:grid"
                ?expanded=${true}>
                
                ${FormField.renderField(this, 'style.grid.show', {
                    label: 'Show Grid'
                })}

                ${showGrid ? html`
                    ${FormField.renderField(this, 'style.grid.opacity', {
                        label: 'Grid Opacity'
                    })}

                    ${this._renderColorArray('style.grid.row_colors', 'Grid Row Colors', 'Alternating row background colors')}
                    ${this._renderColorArray('style.grid.column_colors', 'Grid Column Colors', 'Alternating column background colors')}
                ` : ''}
            </lcards-form-section>
        `;
    }

    _renderAxesTab() {
        return html`
            <!-- X-Axis Configuration -->
            <lcards-form-section
                header="X-Axis Configuration"
                description="Horizontal axis styling and labels"
                icon="mdi:axis-x-arrow"
                ?expanded=${true}>
                
                <!-- X-Axis Labels -->
                ${FormField.renderField(this, 'style.xaxis.labels.show', {
                    label: 'Show X-Axis Labels'
                })}

                ${FormField.renderField(this, 'style.xaxis.labels.rotate', {
                    label: 'Label Rotation (degrees)'
                })}

                <!-- X-Axis Border -->
                ${FormField.renderField(this, 'style.xaxis.border.show', {
                    label: 'Show X-Axis Border'
                })}

                <!-- X-Axis Ticks -->
                ${FormField.renderField(this, 'style.xaxis.ticks.show', {
                    label: 'Show X-Axis Ticks'
                })}
            </lcards-form-section>

            <!-- Y-Axis Configuration -->
            <lcards-form-section
                header="Y-Axis Configuration"
                description="Vertical axis styling and labels"
                icon="mdi:axis-y-arrow"
                ?expanded=${true}>
                
                <!-- Y-Axis Labels -->
                ${FormField.renderField(this, 'style.yaxis.labels.show', {
                    label: 'Show Y-Axis Labels'
                })}

                <!-- Y-Axis Border -->
                ${FormField.renderField(this, 'style.yaxis.border.show', {
                    label: 'Show Y-Axis Border'
                })}

                <!-- Y-Axis Ticks -->
                ${FormField.renderField(this, 'style.yaxis.ticks.show', {
                    label: 'Show Y-Axis Ticks'
                })}
            </lcards-form-section>
        `;
    }

    _renderLegendLabelsTab() {
        return html`
            <!-- Legend Configuration -->
            <lcards-form-section
                header="Legend Configuration"
                description="Chart legend positioning and styling"
                icon="mdi:label-multiple"
                ?expanded=${true}>
                
                ${FormField.renderField(this, 'style.legend.show', {
                    label: 'Show Legend'
                })}

                ${this._getNestedValue('style.legend.show') ? html`
                    ${FormField.renderField(this, 'style.legend.position', {
                        label: 'Legend Position'
                    })}

                    ${FormField.renderField(this, 'style.legend.horizontalAlign', {
                        label: 'Horizontal Alignment'
                    })}
                ` : ''}
            </lcards-form-section>

            <!-- Data Labels Configuration -->
            <lcards-form-section
                header="Data Labels"
                description="Labels displayed on data points"
                icon="mdi:label-variant"
                ?expanded=${true}>
                
                ${FormField.renderField(this, 'style.data_labels.show', {
                    label: 'Show Data Labels'
                })}

                ${this._getNestedValue('style.data_labels.show') ? html`
                    ${FormField.renderField(this, 'style.data_labels.offsetY', {
                        label: 'Vertical Offset'
                    })}
                ` : ''}
            </lcards-form-section>

            <!-- Tooltip Configuration -->
            <lcards-form-section
                header="Tooltip Configuration"
                description="Interactive tooltip settings"
                icon="mdi:tooltip-text"
                ?expanded=${true}>
                
                ${FormField.renderField(this, 'style.display.tooltip.show', {
                    label: 'Show Tooltip'
                })}

                ${this._getNestedValue('style.display.tooltip.show') !== false ? html`
                    ${FormField.renderField(this, 'style.display.tooltip.theme', {
                        label: 'Tooltip Theme'
                    })}
                ` : ''}
            </lcards-form-section>
        `;
    }

    _renderThemeTab() {
        const monochromeEnabled = this._getNestedValue('style.theme.monochrome.enabled') ?? false;
        
        return html`
            <!-- Theme Mode -->
            <lcards-form-section
                header="Theme Mode"
                description="Light or dark theme for chart"
                icon="mdi:theme-light-dark"
                ?expanded=${true}>
                
                ${FormField.renderField(this, 'style.theme.mode', {
                    label: 'Theme Mode'
                })}
            </lcards-form-section>

            <!-- Theme Palette -->
            <lcards-form-section
                header="Color Palette"
                description="Predefined color scheme"
                icon="mdi:palette"
                ?expanded=${true}>
                
                ${FormField.renderField(this, 'style.theme.palette', {
                    label: 'Palette',
                    helper: 'Leave blank to use custom series colors'
                })}

                <lcards-message type="info">
                    <strong>Note:</strong> Palette colors override series colors defined in the Colors tab.
                    Leave blank to use custom series colors.
                </lcards-message>
            </lcards-form-section>

            <!-- Monochrome Mode -->
            <lcards-form-section
                header="Monochrome Mode"
                description="Single color with shade variations"
                icon="mdi:invert-colors"
                ?expanded=${false}>
                
                ${FormField.renderField(this, 'style.theme.monochrome.enabled', {
                    label: 'Enable Monochrome'
                })}

                ${monochromeEnabled ? html`
                    <lcards-color-section
                        .colors=${[this._getNestedValue('style.theme.monochrome.color') || '#FF9900']}
                        .label=${"Monochrome Base Color"}
                        .maxColors=${1}
                        @colors-changed=${(e) => this._setNestedValue('style.theme.monochrome.color', e.detail.colors[0])}>
                    </lcards-color-section>

                    ${FormField.renderField(this, 'style.theme.monochrome.shade_to', {
                        label: 'Shade Direction'
                    })}

                    ${FormField.renderField(this, 'style.theme.monochrome.shade_intensity', {
                        label: 'Shade Intensity'
                    })}
                ` : ''}
            </lcards-form-section>
        `;
    }

    _renderAnimationTab() {
        return html`
            <lcards-form-section
                header="Animation Configuration"
                description="Chart animation and transitions"
                icon="mdi:animation"
                ?expanded=${true}>
                
                ${FormField.renderField(this, 'style.animation.preset', {
                    label: 'Animation Preset'
                })}

                <lcards-message type="info">
                    <strong>Animation Presets:</strong>
                    <ul style="margin: 8px 0; padding-left: 20px;">
                        <li><strong>lcars_standard:</strong> Balanced speed and smoothness</li>
                        <li><strong>lcars_dramatic:</strong> Slower, more cinematic</li>
                        <li><strong>lcars_minimal:</strong> Fast, subtle transitions</li>
                        <li><strong>lcars_realtime:</strong> No animation for live data</li>
                        <li><strong>none:</strong> Disable all animations</li>
                    </ul>
                </lcards-message>
            </lcards-form-section>
        `;
    }

    _renderAdvancedTab() {
        return html`
            <!-- Formatters -->
            <lcards-form-section
                header="Formatters"
                description="Custom label and tooltip formatting"
                icon="mdi:code-braces"
                ?expanded=${false}>
                
                ${FormField.renderField(this, 'style.formatters.xaxis_label', {
                    label: 'X-Axis Label Format',
                    helper: "Template: 'MMM DD' or '{value}°C'"
                })}

                ${FormField.renderField(this, 'style.formatters.yaxis_label', {
                    label: 'Y-Axis Label Format'
                })}

                ${FormField.renderField(this, 'style.formatters.tooltip', {
                    label: 'Tooltip Format',
                    helper: "Template: '{x|MMM DD}: {y}°C'"
                })}
            </lcards-form-section>

            <!-- Typography -->
            <lcards-form-section
                header="Typography"
                description="Font family and size"
                icon="mdi:format-text"
                ?expanded=${false}>
                
                ${FormField.renderField(this, 'style.typography.font_family', {
                    label: 'Font Family'
                })}

                ${FormField.renderField(this, 'style.typography.font_size', {
                    label: 'Font Size'
                })}
            </lcards-form-section>

            <!-- Display Options -->
            <lcards-form-section
                header="Display Options"
                description="Toolbar and other UI elements"
                icon="mdi:eye"
                ?expanded=${false}>
                
                ${FormField.renderField(this, 'style.display.toolbar', {
                    label: 'Show Toolbar',
                    helper: 'Download, zoom, pan controls'
                })}
            </lcards-form-section>

            <!-- Raw chart_options Override -->
            <lcards-form-section
                header="Raw ApexCharts Options"
                description="Advanced: Direct ApexCharts configuration override"
                icon="mdi:code-json"
                ?expanded=${false}>
                
                <lcards-message type="warning">
                    <strong>Advanced Users Only:</strong> Direct ApexCharts options override.
                    These settings have highest precedence and may conflict with visual settings above.
                </lcards-message>

                <ha-yaml-editor
                    .hass=${this.hass}
                    .value=${this._getNestedValue('style.chart_options') || {}}
                    .label=${"chart_options (YAML)"}
                    @value-changed=${(e) => this._setNestedValue('style.chart_options', e.detail.value)}>
                </ha-yaml-editor>

                <lcards-message type="info">
                    <strong>Example:</strong>
                    <pre style="background: var(--secondary-background-color); padding: 8px; border-radius: 4px; overflow-x: auto;">
xaxis:
  type: datetime
  labels:
    format: 'HH:mm'
yaxis:
  min: 0
  max: 100
                    </pre>
                </lcards-message>
            </lcards-form-section>
        `;
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
                        <div class="preview-panel" ${ref(this._previewRef)}>
                            <lcards-chart-live-preview
                                .hass=${this.hass}
                                .config=${this._workingConfig}
                                .key=${this._renderKey}
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
