/**
 * @fileoverview LCARdS Chart Configuration Studio
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
import { haFormatState, haFormatEntityName } from '../../utils/ha-entity-display.js';
import { editorStyles } from '../base/editor-styles.js';
import { studioDialogStyles } from './studio-dialog-styles.js';
import { LCARdSFormFieldHelper as FormField } from '../components/shared/lcards-form-field.js';
import '../components/shared/lcards-form-section.js';
import '../components/shared/lcards-message.js';
import '../components/datasources/lcards-datasource-editor-tab.js';
import '../components/lcards-chart-series-list-editor.js';
import '../../cards/lcards-chart.js';  // Import card directly for manual instantiation
import { getChartSchema } from '../../cards/schemas/chart-schema.js';
import '../components/shared/lcards-color-picker.js';
import '../components/shared/lcards-color-list.js';
import { mountDialogNearHomeAssistant } from '../../utils/lcards-shared-helpers.js';
import { renderInfoGuide } from '../components/shared/info-guide.js';
import { migrateChartConfig } from '../../charts/chart-config-migration.js';
import { normalizeChartSources } from '../../charts/chart-sources.js';
import { showConfirmDeleteDialog } from '../../views/layout-edit-dialogs.js';
import '../components/yaml/lcards-studio-yaml-tab.js';

export class LCARdSChartStudioDialog extends LitElement {
    static get properties() {
        return {
            hass: { type: Object },
            _initialConfig: { type: Object }, // Store initial config
            _workingConfig: { type: Object, state: true },
            _activeTab: { type: String, state: true },
            _showDataSourceEditor: { type: Boolean, state: true }, // DataSource editor overlay
            _previewEmpty: { type: Boolean, state: true },
            _previewError: { type: String, state: true }
        };
    }

    constructor() {
        super();
        this.hass = null;
        this._initialConfig = null;
        this._workingConfig = {};
        this._activeTab = 'data';

        // Create ref for preview container
        this._previewRef = createRef();

        // Debounce timer for preview updates
        this._previewUpdateTimer = null;

        // Preview state
        this._previewEmpty = false;
        this._previewError = null;

        this._showDataSourceEditor = false;

        // Initialize chart schema
        this._chartSchema = getChartSchema();
    }

    /**
     * Getter for config property that returns _workingConfig
     */
    get config() {
        return this._workingConfig;
    }

    /**
     * Setter for config property. The first value is the baseline for the
     * unsaved-changes check; later values only replace the working copy.
     */
    set config(value) {
        if (this._initialConfig === null) {
            this._initialConfig = value;
        }
        this._workingConfig = JSON.parse(JSON.stringify(value || {}));
    }

    /**
     * Host object for the embedded DataSource editor tab. It reads and writes
     * this studio's working config and its events stay inside the studio
     * (firing on the dialog would commit to the card before Save).
     * @returns {Object}
     * @private
     */
    get _dataSourceHost() {
        const studio = this;
        return {
            get hass() { return studio.hass; },
            get config() { return studio._workingConfig; },
            set config(value) { studio._workingConfig = JSON.parse(JSON.stringify(value || {})); },
            get _cardGuid() { return studio._workingConfig?.id ?? 'chart-studio'; },
            requestUpdate: () => {
                studio.requestUpdate();
                studio._schedulePreviewUpdate();
            },
            dispatchEvent: () => {
                studio.requestUpdate();
                studio._schedulePreviewUpdate();
                return true;
            }
        };
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

        // Migrate old color format (style.colors as array) to new nested format
        this._migrateColorConfig();

        // Legacy series formats (source, series_N data_sources, series_names...)
        this._workingConfig = migrateChartConfig(this._workingConfig).config;

        lcardsLog.debug('[ChartStudio] Opened with config:', this._workingConfig);

        // Schedule initial preview update
        this.updateComplete.then(() => this._updatePreviewCard());
    }

    /**
     * Migrate old color configuration format to new nested format
     * Old: style.colors = ['#FF0000', '#00FF00']
     * New: style.colors.series = ['#FF0000', '#00FF00']
     * @private
     */
    _migrateColorConfig() {
        if (!this._workingConfig.style?.colors) {
            return; // No colors config
        }

        const colors = this._workingConfig.style.colors;

        // Check if colors is an array (old format)
        if (Array.isArray(colors)) {
            lcardsLog.info('[ChartStudio] Migrating old color format to style.colors.series');
            this._workingConfig.style.colors = {
                series: colors
            };
        }
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
            studioDialogStyles,
            css`
            :host {
                display: block;
            }

            /* Override studio layout for 40/60 split (more preview space for charts) */
            .studio-layout {
                grid-template-columns: 40% 60%;
                gap: 24px;
                align-items: start; /* Align to top for sticky to work */
            }

            /* Config panel - scrollable */
            .config-panel {
                display: flex;
                flex-direction: column;
            }

            /* Tab content wrapper - scrollable area */
            .tab-content {
                max-height: 70vh;
                overflow-y: auto;
                padding-right: 8px; /* Space for scrollbar */
            }

            /* Preview panel - sticky positioning */
            .preview-panel {
                position: sticky;
                top: 0;
                height: fit-content;
                max-height: 85vh; /* Prevent overflow */
            }

            /* Chart preview container - dark background for charts */
            .preview-container {
                flex: 1;
                min-height: 400px;
                padding: 16px;
                overflow: auto;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: background-color 0.3s ease;
                background: var(--primary-background-color);
                position: relative;
            }

            .preview-mount,
            .preview-mount > * {
                width: 100%;
                height: 100%;
            }

            /* Empty / error states sit over the preview mount */
            .preview-state {
                position: absolute;
                inset: 0;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                text-align: center;
                gap: var(--ha-space-2);
                padding: var(--ha-space-6);
                color: var(--secondary-text-color);
            }
            .preview-state ha-icon {
                --mdc-icon-size: 48px;
                opacity: 0.5;
            }
            .preview-state-title {
                font-weight: 600;
                color: var(--primary-text-color);
            }
            .preview-error ha-icon {
                color: var(--error-color);
                opacity: 1;
            }

            .time-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
                gap: var(--ha-space-2);
            }
            .axis-row {
                display: grid;
                grid-template-columns: 1.2fr 1fr 1fr auto auto;
                gap: var(--ha-space-2);
                align-items: center;
                margin-bottom: var(--ha-space-2);
            }
            .hint {
                color: var(--secondary-text-color);
                margin: var(--ha-space-1) 0 var(--ha-space-2);
            }

            .data-actions {
                display: flex;
                justify-content: flex-end;
                margin: var(--ha-space-2) 0 var(--ha-space-4);
            }

            .help-text {
                font-size: 14px;
                line-height: 1.6;
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

            ha-input {
                width: 100%;
            }

            /* Data sources dialog: sized to its content, not the studio's 90vh */
            ha-dialog.datasources-dialog {
                --ha-dialog-width-md: min(900px, 95vw);
                --ha-dialog-min-height: auto;
                --ha-dialog-max-height: 85vh;
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

        // Set value; empty values remove the key so YAML stays clean
        if (value === undefined || value === null || value === '') {
            delete target[lastKey];
        } else {
            target[lastKey] = value;
        }

        lcardsLog.debug(`[ChartStudio] Updated ${path} =`, value);

        // Re-render Lit template immediately so UI (e.g. chart type tiles, form values) reflects
        // the new config. Preview update is debounced separately below.
        this.requestUpdate();

        // Trigger debounced preview card rebuild
        this._schedulePreviewUpdate();
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
            this._previewUpdateTimer = null;
            this._updatePreviewCard();
        }, 300);
    }

    /**
     * Rebuild the preview card in its mount element. The empty and error
     * states are rendered by Lit next to the mount, never inside it.
     * @private
     */
    _updatePreviewCard() {
        const mount = this._previewRef.value;
        if (!mount) return;

        mount.replaceChildren();
        const previewConfig = this._getPreviewConfig();
        this._previewEmpty = !previewConfig;
        this._previewError = null;
        if (!previewConfig) return;

        try {
            const card = /** @type {any} */ (document.createElement('lcards-chart'));
            // Config and hass before connecting, so the first update has both.
            card.setConfig(previewConfig);
            card.hass = this.hass;
            mount.appendChild(card);
        } catch (error) {
            lcardsLog.error('[ChartStudio] Failed to update preview:', error);
            this._previewError = error.message || 'Failed to render chart';
        }
    }

    /**
     * Get preview config with sensible defaults
     * @private
     * @returns {Object|null} Preview config or null
     */
    _getPreviewConfig() {
        if (!this._workingConfig) return null;

        try {
            // Deep clone to avoid modifying working config
            const previewConfig = JSON.parse(JSON.stringify(this._workingConfig));

            // Ensure type is set
            if (!previewConfig.type) {
                previewConfig.type = 'custom:lcards-chart';
            }

            // Ensure chart_type default
            if (!previewConfig.chart_type) {
                previewConfig.chart_type = 'line';
            }

            // Ensure height for preview
            if (!previewConfig.height) {
                previewConfig.height = 300;
            }

            // VALIDATION: Check if config has required data sources
            // Skip preview if no valid data configured yet
            const hasValidData = this._hasValidDataConfig(previewConfig);
            if (!hasValidData) {
                lcardsLog.debug('[ChartStudio] Skipping preview - config incomplete (no valid data sources)');
                return null;
            }

            return previewConfig;
        } catch (error) {
            lcardsLog.error('[ChartStudio] Error preparing preview config:', error);
            return null;
        }
    }

    /**
     * Whether the config has at least one plottable series. Uses the same
     * normaliser as the card, so legacy and current formats agree.
     * @param {Object} config
     * @returns {boolean}
     * @private
     */
    _hasValidDataConfig(config) {
        return normalizeChartSources(config).length > 0;
    }

    /**
     * Handle tab switch
     * @private
     */
    _handleMainTabChange(e) {
        const value = e.target.activeTab?.getAttribute('value');
        if (value !== null && value !== undefined) {
            this._activeTab = value;
            lcardsLog.debug('[ChartStudio] Switched to tab:', value);
            this.requestUpdate();
        }
    }

    /**
     * Handle Save button
     * @private
     */
    _handleSave() {
        lcardsLog.debug('[ChartStudio] Saving config:', this._workingConfig);

        // Clean up empty data_sources object if no local sources defined
        if (this._workingConfig.data_sources && Object.keys(this._workingConfig.data_sources).length === 0) {
            delete this._workingConfig.data_sources;
            lcardsLog.debug('[ChartStudio] Removed empty data_sources object');
        }

        // Clean up transient datasources before saving

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
        if (this._configHasChanges()) {
            // Show confirmation - only close if user confirms
            this._confirmAction('Discard unsaved changes?').then(confirmed => {
                if (confirmed) {
                    lcardsLog.debug('[ChartStudio] Cancelled - changes discarded');
                    this._handleClose();
                }
                // If not confirmed, do nothing - stay in studio
            });
            return;
        }
        lcardsLog.debug('[ChartStudio] Cancelled');
        this._handleClose();
    }

    /**
     * Check if config has changes
     * @returns {boolean}
     * @private
     */
    _configHasChanges() {
        const initial = JSON.stringify(this._initialConfig);
        const current = JSON.stringify(this._workingConfig);
        return initial !== current;
    }

    /**
     * Ask before discarding changes.
     * @param {string} message
     * @returns {Promise<boolean>}
     * @private
     */
    _confirmAction(message) {
        return showConfirmDeleteDialog({ title: 'Discard changes?', message, confirmText: 'Discard' });
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
     * Apply a config edited in the YAML tab (legacy series formats are migrated).
     * @param {CustomEvent} e - detail: { config }
     * @private
     */
    _handleYamlConfig(e) {
        const config = migrateChartConfig(e.detail.config).config;
        if (!config.type) config.type = 'custom:lcards-chart';
        this._workingConfig = config;
        this.requestUpdate();
        this._schedulePreviewUpdate();
    }

    /**
     * Render tab navigation
     * @returns {TemplateResult}
     * @private
     */
    _renderTabNavigation() {
        const tabs = [
            { id: 'data', icon: 'mdi:database-arrow-right', label: 'Data' },
            { id: 'appearance', icon: 'mdi:palette-advanced', label: 'Appearance' },
            { id: 'elements', icon: 'mdi:widgets', label: 'Elements' },
            { id: 'theme', icon: 'mdi:theme-light-dark', label: 'Theme' },
            { id: 'effects', icon: 'mdi:shimmer', label: 'Effects' },
            { id: 'advanced', icon: 'mdi:cog', label: 'Advanced' },
            { id: 'yaml', icon: 'mdi:code-braces', label: 'YAML' }
        ];

        return html`
            <ha-tab-group @wa-tab-show=${this._handleMainTabChange}>
                ${tabs.map(tab => html`
                    <ha-tab-group-tab value="${tab.id}" ?active=${this._activeTab === tab.id}>
                        <ha-icon icon="${tab.icon}"></ha-icon>
                        ${tab.label}
                    </ha-tab-group-tab>
                `)}
            </ha-tab-group>
        `;
    }

    /**
     * Render active tab content
     * @returns {TemplateResult}
     * @private
     */
    _renderTabContent() {
        switch (this._activeTab) {
            case 'data':
                return this._renderDataTab();
            case 'appearance':
                return this._renderAppearanceTab();
            case 'elements':
                return this._renderElementsTab();
            case 'theme':
                return this._renderThemeTab();
            case 'effects':
                return this._renderEffectsTab();
            case 'advanced':
                return this._renderAdvancedTab();
            case 'yaml':
                return html`
                    <lcards-studio-yaml-tab
                        .hass=${this.hass}
                        .config=${this._workingConfig}
                        .schema=${this._chartSchema}
                        cardType="chart"
                        @yaml-config-changed=${this._handleYamlConfig}>
                    </lcards-studio-yaml-tab>
                `;
            default:
                return html`<p>Unknown tab: ${this._activeTab}</p>`;
        }
    }

    // ============================================================================
    // TAB CONTENT RENDERERS (Phase 1 Placeholders)
    // ============================================================================

    /**
     * Render Data tab (merged Data Sources + Chart Type)
     * @returns {TemplateResult}
     * @private
     */
    _renderDataTab() {
        return html`
            <div class="data-tab">
                <!-- Series List Editor Component -->
                <lcards-chart-series-list-editor
                    .hass=${this.hass}
                    .config=${this._workingConfig}
                    @config-changed=${this._handleSeriesConfigChanged}>
                </lcards-chart-series-list-editor>

                <div class="data-actions">
                    <ha-button appearance="outlined" @click=${() => { this._showDataSourceEditor = true; }}>
                        <ha-icon icon="mdi:database-cog" slot="start"></ha-icon>
                        Manage data sources
                    </ha-button>
                </div>

                <!-- Chart Type Selector -->
                ${this._renderChartTypeSelector()}

                ${this._renderTimeAndAxes()}

                ${this._renderDataSourceHelp()}
            </div>
        `;
    }

    /**
     * Render chart type selector with validation
     * @returns {TemplateResult}
     * @private
     */
    _renderChartTypeSelector() {
        const currentType = this._workingConfig.chart_type || 'line';
        const seriesCount = this._getSeriesCount();

        // Chart type definitions
        // special: true  = requires non-standard data format (not plain entity history)
        // infoText        = shown in the info panel when this type is selected
        const chartTypes = [
            {
                value: 'line', label: 'Line', icon: 'mdi:chart-line', minSeries: 1,
                desc: 'Trends over time',
                infoText: 'Plots a continuous line from entity history. Works out of the box with any DataSource: each {t, v} point becomes a data point. Best for temperature, power, or any value that changes over time.'
            },
            {
                value: 'area', label: 'Area', icon: 'mdi:chart-areaspline', minSeries: 1,
                desc: 'Volume visualization',
                infoText: 'Like Line, but fills the area below the curve. Works directly with entity history. Good for showing volume or magnitude over time.'
            },
            {
                value: 'bar', label: 'Bar', icon: 'mdi:chart-bar', minSeries: 1,
                desc: 'Horizontal comparisons',
                infoText: 'Horizontal bars from entity history. Each data point becomes a bar. Good for comparing values across time intervals or when you have discrete categories.'
            },
            {
                value: 'column', label: 'Column', icon: 'mdi:chart-bar-stacked', minSeries: 1,
                desc: 'Vertical comparisons',
                infoText: 'Vertical bars (classic bar chart) from entity history. Works the same as Bar but oriented vertically. Good for time-bucketed comparisons.'
            },
            {
                value: 'scatter', label: 'Scatter', icon: 'mdi:chart-scatter-plot', minSeries: 1,
                desc: 'Correlations',
                infoText: 'Plots individual data points as dots without connecting lines. Works with entity history. Useful for spotting patterns and outliers. Add multiple series to compare two sensors side-by-side. Tip: increase Marker Size in Appearance if dots are too small to see.'
            },
            {
                value: 'heatmap', label: 'Heatmap', icon: 'mdi:grid', minSeries: 1,
                desc: 'Matrix / density',
                infoText: 'Grid of color-intensity cells. Each series becomes one row, and values over time form the columns. Works with entity history, great for showing daily/weekly patterns across multiple entities.'
            },
            {
                value: 'pie', label: 'Pie', icon: 'mdi:chart-pie', minSeries: 2,
                desc: 'Proportions (2+ series)',
                special: true,
                infoText: 'Shows proportional slices of a whole. Requires 2+ series, each holding a single numeric value (not a time-series). Use sensors that naturally return a single current value, e.g., energy usage per zone. Time-series history buffers are not suited for this type.'
            },
            {
                value: 'donut', label: 'Donut', icon: 'mdi:chart-donut', minSeries: 2,
                desc: 'Proportions (2+ series)',
                special: true,
                infoText: 'Like Pie but with an open centre. Same data requirements: 2+ series each with a single numeric value. The centre can display a total or label.'
            },
            {
                value: 'radar', label: 'Radar', icon: 'mdi:radar', minSeries: 1,
                desc: 'Spider chart',
                special: true,
                infoText: 'Plots values along multiple named axes arranged in a polygon. Each series provides values for each axis. Best when you have multiple entities each contributing one value (e.g., room-by-room energy breakdown). Not suited for time-series history.'
            },
            {
                value: 'radialBar', label: 'Radial Bar', icon: 'mdi:chart-arc', minSeries: 1,
                desc: 'Circular gauges',
                infoText: 'Circular gauge arcs, one per series. Works well if your entity returns 0–100 values (percent). Each series arc shows the latest value. Great for battery %, CPU %, or humidity sensors.'
            },
            {
                value: 'polarArea', label: 'Polar', icon: 'mdi:chart-donut-variant', minSeries: 1,
                desc: 'Directional data',
                special: true,
                infoText: 'Equal-angle segments with varying radius. Similar to Pie; requires category counts, one value per series. Each series becomes one segment, sized by its value. Not suited for time-series history buffers.'
            },
            {
                value: 'treemap', label: 'Treemap', icon: 'mdi:view-grid', minSeries: 1,
                desc: 'Hierarchical data',
                special: true,
                infoText: 'Nested rectangles where box area = value. Requires one numeric value per series (category label + value). Not suited for time-series history. Good for showing proportional breakdowns like storage or energy cost by category.'
            },
            {
                value: 'rangeBar', label: 'Range Bar', icon: 'mdi:chart-gantt', minSeries: 1,
                desc: 'Timelines / Gantt',
                special: true,
                infoText: 'Gantt-style bars spanning a start and end time. The chart can not build this data from entities yet; supply it through style.chart_options or a custom data source.'
            },
            {
                value: 'rangeArea', label: 'Range Area', icon: 'mdi:chart-bell-curve', minSeries: 1,
                desc: 'Confidence bands',
                special: true,
                infoText: 'Shaded band between a low and a high value over time. Set each series to Grouping: Min/max band, or use long-term statistics (the band runs from each period min to max).'
            },
            {
                value: 'candlestick', label: 'Candlestick', icon: 'mdi:chart-candlestick', minSeries: 1,
                desc: 'OHLC financial data',
                special: true,
                infoText: 'Open/high/low/close bars per time bucket. Set each series to Grouping: Open/high/low/close with a bucket length (e.g. 1h).'
            },
            {
                value: 'boxPlot', label: 'Box Plot', icon: 'mdi:chart-box-outline', minSeries: 1,
                desc: 'Statistical distribution',
                special: true,
                infoText: 'Distribution per time bucket (min, quartiles, median, max). Set each series to Grouping: Box plot values with a bucket length (e.g. 1d).'
            }
        ];

        return html`
            <lcards-form-section
                header="Chart Type"
                description="Choose visualization - some types require multiple series"
                icon="mdi:chart-line-variant"
                ?expanded=${true}>

                <!-- Contextual info panel - shown ABOVE tiles so it's immediately visible -->
                ${(() => {
                    const selected = chartTypes.find(t => t.value === currentType);
                    if (!selected) return '';
                    return html`
                        <div style="
                            margin-bottom: 14px;
                            padding: 12px 14px;
                            border-radius: 8px;
                            border-left: 3px solid ${selected.special ? 'var(--warning-color, #f59e0b)' : 'var(--info-color, var(--primary-color))'} ;
                            background: ${selected.special ? 'rgba(245,158,11,0.08)' : 'rgba(var(--rgb-primary-color, 33,150,243), 0.07)'};
                            display: flex;
                            gap: 10px;
                            align-items: flex-start;">
                            <ha-icon
                                icon="${selected.special ? 'mdi:alert-circle-outline' : 'mdi:information-outline'}"
                                style="
                                    --mdc-icon-size: 20px;
                                    color: ${selected.special ? 'var(--warning-color, #f59e0b)' : 'var(--primary-color)'};
                                    flex-shrink: 0;
                                    margin-top: 1px;">
                            </ha-icon>
                            <div>
                                <div style="font-weight: 600; font-size: 13px; margin-bottom: 4px;">
                                    ${selected.label}
                                    ${selected.special ? html`<span style="font-size: 11px; font-weight: 400; opacity: 0.8;"> (requires custom data format)</span>` : ''}
                                </div>
                                <div style="font-size: 13px; line-height: 1.5; color: var(--secondary-text-color);">
                                    ${selected.infoText}
                                </div>
                            </div>
                        </div>
                    `;
                })()}

                <div style="
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
                    gap: 10px;">
                    ${chartTypes.map(type => {
                        const isCompatible = seriesCount >= type.minSeries;
                        const isSelected = currentType === type.value;

                        return html`
                            <div
                                class="chart-type-card ${isSelected ? 'selected' : ''} ${!isCompatible ? 'disabled' : ''}"
                                style="
                                    padding: 12px;
                                    border: 2px solid ${isSelected ? 'var(--primary-color)' : 'var(--divider-color)'};
                                    border-radius: 8px;
                                    cursor: ${isCompatible ? 'pointer' : 'not-allowed'};
                                    transition: all 0.2s;
                                    background: ${isSelected ? 'var(--primary-color)' : 'var(--card-background-color)'};
                                    color: ${isSelected ? 'white' : 'var(--primary-text-color)'};
                                    text-align: center;
                                    opacity: ${isCompatible ? '1' : '0.4'};
                                    position: relative;
                                "
                                @click=${() => {
                                    if (isCompatible) {
                                        this._setConfigValue('chart_type', type.value);
                                    }
                                }}
                                title="${!isCompatible ? `Requires ${type.minSeries}+ series` : type.desc}">

                                <ha-icon icon="${type.icon}" style="font-size: 28px; margin-bottom: 6px;"></ha-icon>
                                <div style="font-weight: 600; font-size: 13px; margin-bottom: 2px;">
                                    ${type.label}
                                </div>
                                <div style="font-size: 11px; opacity: 0.8; margin-top: 2px;">
                                    ${type.desc}
                                </div>
                                ${type.minSeries > 1 ? html`
                                    <div style="
                                        font-size: 10px;
                                        opacity: 0.8;
                                        margin-top: 4px;
                                        padding: 2px 6px;
                                        background: ${isCompatible ? 'rgba(0,0,0,0.2)' : 'rgba(255,0,0,0.2)'};
                                        border-radius: 4px;
                                        display: inline-block;">
                                        ${type.minSeries}+ series
                                    </div>
                                ` : ''}
                            </div>
                        `;
                    })}
                </div>

                ${seriesCount < 2 ? html`
                    <lcards-message type="info" style="margin-top: 12px;">
                        <strong>Tip:</strong> Pie and Donut charts require 2+ series. Add more series in the Data Sources tab to unlock them.
                    </lcards-message>
                ` : ''}
            </lcards-form-section>
        `;
    }

    /**
     * Get current series count for validation
     * @returns {number}
     * @private
     */
    _getSeriesCount() {
        return normalizeChartSources(this._workingConfig).length;
    }

    /**
     * Time window (graph_span, span) and Y axes (yaxis[]).
     * @returns {TemplateResult}
     * @private
     */
    _renderTimeAndAxes() {
        const config = this._workingConfig;
        const axes = Array.isArray(config.yaxis) ? config.yaxis : [];
        const spanUnits = [
            { value: '', label: '(Rolling, ends now)' },
            ...['minute', 'hour', 'day', 'week', 'month', 'year'].map(u => ({ value: u, label: `Start of ${u}` }))
        ];
        const setAxes = (next) => this._updateConfig('yaxis', next.length ? next : undefined);
        const patchAxis = (index, patch) => setAxes(axes.map((a, i) => {
            if (i !== index) return a;
            const merged = { ...a, ...patch };
            return Object.fromEntries(Object.entries(merged).filter(([, v]) => v !== undefined && v !== '' && v !== null));
        }));

        return html`
            <lcards-form-section header="Time and axes" icon="mdi:clock-outline" ?expanded=${true}>
                <div class="time-grid">
                    <ha-selector
                        .hass=${this.hass}
                        .label=${'Time span'}
                        .helper=${'e.g. 6h, 2d, 1w (default 24h)'}
                        .value=${config.graph_span ?? ''}
                        .selector=${{ text: { placeholder: '24h' } }}
                        @value-changed=${(e) => this._updateConfig('graph_span', e.detail.value)}>
                    </ha-selector>
                    <ha-selector
                        .hass=${this.hass}
                        .label=${'Align window'}
                        .value=${config.span?.start ?? ''}
                        .selector=${{ select: { mode: 'dropdown', options: spanUnits } }}
                        @value-changed=${(e) => this._updateConfig('span.start', e.detail.value)}>
                    </ha-selector>
                    <ha-selector
                        .hass=${this.hass}
                        .label=${'Offset'}
                        .helper=${'e.g. -1d to show the same window yesterday'}
                        .value=${config.span?.offset ?? ''}
                        .selector=${{ text: { placeholder: '-1d' } }}
                        @value-changed=${(e) => this._updateConfig('span.offset', e.detail.value)}>
                    </ha-selector>
                </div>

                <h4>Y axes</h4>
                ${axes.length === 0 ? html`
                    <p class="hint">One automatic axis. Add axes to give series different scales.</p>
                ` : axes.map((axis, index) => html`
                    <div class="axis-row">
                        <ha-selector .hass=${this.hass} .label=${'Id'} .value=${axis.id ?? ''}
                            .selector=${{ text: {} }}
                            @value-changed=${(e) => patchAxis(index, { id: e.detail.value })}>
                        </ha-selector>
                        <ha-selector .hass=${this.hass} .label=${'Min'} .value=${axis.min}
                            .selector=${{ number: { mode: 'box', step: 'any' } }}
                            @value-changed=${(e) => patchAxis(index, { min: e.detail.value })}>
                        </ha-selector>
                        <ha-selector .hass=${this.hass} .label=${'Max'} .value=${axis.max}
                            .selector=${{ number: { mode: 'box', step: 'any' } }}
                            @value-changed=${(e) => patchAxis(index, { max: e.detail.value })}>
                        </ha-selector>
                        <ha-selector .hass=${this.hass} .label=${'Right side'} .value=${axis.opposite ?? false}
                            .selector=${{ boolean: {} }}
                            @value-changed=${(e) => patchAxis(index, { opposite: e.detail.value || undefined })}>
                        </ha-selector>
                        <ha-icon-button .label=${'Remove axis'}
                            @click=${() => setAxes(axes.filter((_, i) => i !== index))}>
                            <ha-icon icon="mdi:delete"></ha-icon>
                        </ha-icon-button>
                    </div>
                `)}
                <ha-button appearance="outlined"
                    @click=${() => setAxes([...axes, { id: `axis_${axes.length + 1}`, ...(axes.length ? { opposite: true } : {}) }])}>
                    <ha-icon icon="mdi:plus" slot="start"></ha-icon>
                    Add Y axis
                </ha-button>
            </lcards-form-section>
        `;
    }

    /**
     * Render data source help documentation
     * @returns {TemplateResult}
     * @private
     */
    _renderDataSourceHelp() {
        return html`
            <lcards-form-section variant="guide" header="Chart sources: help" icon="mdi:help-circle" ?expanded=${false} outlined>
                <div class="help-text">
                    <h4>Entity history</h4>
                    <p>Plots an entity's recorded history for the chart's time span, then follows live changes.</p>

                    <h4>Entity long-term statistics</h4>
                    <p>Plots hourly, daily or monthly statistics (mean, min, max, sum, ...) for sensors with a state class. Best for long spans.</p>

                    <h4>Data source</h4>
                    <p>Plots a named data source, optionally one of its processor buffers (smoothing, rate, statistics, ...). Use "Manage data sources" to add one.</p>

                    <h4>Grouping</h4>
                    <p>Buckets points into fixed intervals. Range area, box plot and candlestick charts need min/max band, box plot values or open/high/low/close grouping.</p>
                </div>
            </lcards-form-section>
        `;
    }

    /**
     * Close DataSource editor
     * @private
     */
    _closeDataSourceEditor() {
        this._showDataSourceEditor = false;
        this.requestUpdate();
        lcardsLog.debug('[ChartStudio] Closed inline DataSource editor');
    }

    /**
     * Handle series config changes from series-list-editor
     * @param {CustomEvent} event - config-changed event from series-list-editor
     * @private
     */
    _handleSeriesConfigChanged(event) {
        // Stop event from bubbling to parent editor
        event.stopPropagation();

        const updatedConfig = event.detail.config;

        // Update working config with new series configuration
        if (updatedConfig.sources !== undefined) {
            this._workingConfig.sources = updatedConfig.sources;
        }

        if (updatedConfig.data_sources !== undefined) {
            this._workingConfig.data_sources = { ...updatedConfig.data_sources };
        }

        lcardsLog.info('[ChartStudio] Series configuration updated:',
            { seriesCount: this._workingConfig.sources?.length || 0,
              dataSourceCount: Object.keys(this._workingConfig.data_sources || {}).length });

        // Trigger preview update
        this._updatePreviewCard();
        this.requestUpdate();
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

        // Debug logging for color changes
        if (path.includes('colors')) {
            lcardsLog.debug(`[ChartStudio] Color config updated: ${path} =`, value);
        }

        // Re-render Lit template immediately so UI reflects the new value
        this.requestUpdate();

        // Debounced preview card rebuild
        this._schedulePreviewUpdate();
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
     * Render single color picker using lcards-color-picker
     * @private
     * @param {string} path - Config path
     * @param {string} label - Field label
     * @returns {TemplateResult}
     */
    _renderSingleColorPicker(path, label, helper = '') {
        const value = this._getNestedValue(path) || '';

        return html`
            <div style="margin-bottom: 12px;">
                <label class="field-label">${label}</label>
                ${helper ? html`<div class="helper-text">${helper}</div>` : ''}
                <lcards-color-picker
                    .hass=${this.hass}
                    .value=${value}
                    @value-changed=${(e) => {
                        this._setNestedValue(path, e.detail.value);
                    }}>
                </lcards-color-picker>
            </div>
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
    _renderColorList(path, label, description = '') {
        const colors = this._getNestedValue(path) || [];

        return html`
            <lcards-color-list
                .hass=${this.hass}
                .colors=${colors}
                .label=${label}
                .description=${description}
                @colors-changed=${(e) => {
                    this._setNestedValue(path, e.detail.colors);
                }}>
            </lcards-color-list>
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

    /**
     * Render Appearance tab (merged Colors + Stroke & Fill)
     * @returns {TemplateResult}
     * @private
     */
    _renderAppearanceTab() {
        const fillType = this._getNestedValue('style.fill.type') || 'solid';

        return html`
            <lcards-message type="info">
                Colours are CSS variables (<code>var(--lcars-blue)</code>) or hex codes; a list cycles through the series.
            </lcards-message>

            <!-- Series Colors (Primary) -->
            <lcards-form-section
                header="Series Colors"
                description="Primary colors for data series (array of colors)"
                icon="mdi:palette"
                ?expanded=${true}>

                ${this._renderColorList('style.colors.series', 'Series Colors', 'Colors for each data series - cycles through array')}
            </lcards-form-section>

            <!-- Stroke Configuration -->
            <lcards-form-section
                header="Stroke Configuration"
                description="Line and border styling"
                icon="mdi:brush"
                ?expanded=${true}>

                ${FormField.renderField(this, 'style.stroke.width', {
                    label: 'Stroke Width',
                    helper: 'Line thickness in pixels (affects all series)'
                })}

                ${FormField.renderField(this, 'style.stroke.curve', {
                    label: 'Curve Type',
                    helper: 'Choose straight lines or smooth curves between data points'
                })}

                ${FormField.renderField(this, 'style.stroke.dash_array', {
                    label: 'Dash Pattern',
                    helper: 'Dashed line pattern length (0 = solid line)'
                })}

                ${this._renderColorList('style.colors.stroke', 'Stroke Colors', 'Outline/line colors - cycles through array')}
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

                ${this._renderColorList('style.colors.fill', 'Fill Colors', 'Area fill colors - cycles through array')}

                ${fillType === 'gradient' ? this._renderGradientConfig() : ''}
            </lcards-form-section>

            <!-- Background & Foreground (Single Colors) -->
            <lcards-form-section
                header="Background & Foreground"
                description="Base chart colors (single values)"
                icon="mdi:format-color-fill"
                ?expanded=${false}>

                <div style="display: grid; gap: 12px;">
                    ${this._renderSingleColorPicker('style.colors.background', 'Background', 'Chart background')}
                    ${this._renderSingleColorPicker('style.colors.foreground', 'Foreground', 'Text and labels')}
                    ${this._renderSingleColorPicker('style.colors.grid', 'Grid Lines', 'Grid line color')}
                </div>
            </lcards-form-section>

            <!-- Marker Colors (Collapsed by default) -->
            <lcards-form-section
                header="Marker Colors"
                description="Data point marker styling (arrays)"
                icon="mdi:circle"
                ?expanded=${false}>

                ${this._renderColorList('style.colors.marker.fill', 'Marker Fill', 'Fill colors for markers')}
                ${this._renderColorList('style.colors.marker.stroke', 'Marker Stroke', 'Stroke colors for markers')}
            </lcards-form-section>

            <!-- Axis Colors (Collapsed) -->
            <lcards-form-section
                header="Axis Colors"
                description="X and Y axis styling (single values)"
                icon="mdi:axis-arrow"
                ?expanded=${false}>

                <div style="display: grid; gap: 12px;">
                    ${this._renderSingleColorPicker('style.colors.axis.x', 'X-Axis', 'X-axis color')}
                    ${this._renderSingleColorPicker('style.colors.axis.y', 'Y-Axis', 'Y-axis color')}
                    ${this._renderSingleColorPicker('style.colors.axis.border', 'Axis Border', 'Border around chart')}
                    ${this._renderSingleColorPicker('style.colors.axis.ticks', 'Axis Ticks', 'Tick mark color')}
                </div>
            </lcards-form-section>

            <!-- Legend Colors (Collapsed) -->
            <lcards-form-section
                header="Legend Colors"
                description="Legend text styling"
                icon="mdi:label"
                ?expanded=${false}>

                <div style="display: grid; gap: 12px;">
                    ${this._renderSingleColorPicker('style.colors.legend.default', 'Legend Text', 'Default legend text')}
                </div>
                ${this._renderColorList('style.colors.legend.items', 'Legend Items', 'Per-item legend colors (optional)')}
            </lcards-form-section>

            <!-- Data Label Colors (Collapsed) -->
            <lcards-form-section
                header="Data Label Colors"
                description="On-chart data label styling (array)"
                icon="mdi:label-variant"
                ?expanded=${false}>

                ${this._renderColorList('style.colors.data_labels', 'Data Label Colors', 'Colors for data point labels')}
            </lcards-form-section>
        `;
    }

    /**
     * Render Elements tab (merged Markers & Grid + Axes + Legend & Labels)
     * @returns {TemplateResult}
     * @private
     */
    _renderElementsTab() {
        const showGrid = this._getNestedValue('style.grid.show') ?? true;

        return html`
            <lcards-message type="info">
                <strong>Chart elements</strong><br>
                Configure markers (data points), grid lines, axes, and legends.
                Most settings are optional - use defaults for clean charts.
            </lcards-message>

            <!-- Markers Configuration -->
            <lcards-form-section
                header="Markers Configuration"
                description="Data point marker styling"
                icon="mdi:circle"
                ?expanded=${true}>

                ${FormField.renderField(this, 'style.markers.size', {
                    label: 'Marker Size',
                    helper: 'Size of data point circles (0 to hide markers)'
                })}

                ${FormField.renderField(this, 'style.markers.shape', {
                    label: 'Marker Shape'
                })}

                ${FormField.renderField(this, 'style.markers.stroke.width', {
                    label: 'Marker Stroke Width',
                    helper: 'Border width around markers'
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

                    ${this._renderColorList('style.grid.row_colors', 'Grid Row Colors', 'Alternating row background colors')}
                    ${this._renderColorList('style.grid.column_colors', 'Grid Column Colors', 'Alternating column background colors')}
                ` : ''}
            </lcards-form-section>

            <!-- X-Axis Configuration -->
            <lcards-form-section
                header="X-Axis Configuration"
                description="Horizontal axis styling and labels"
                icon="mdi:axis-x-arrow"
                ?expanded=${true}>

                ${FormField.renderField(this, 'style.xaxis.labels.show', {
                    label: 'Show X-Axis Labels',
                    helper: 'Display labels below the chart (typically timestamps or categories)'
                })}

                ${FormField.renderField(this, 'style.xaxis.labels.rotate', {
                    label: 'Label Rotation (degrees)',
                    helper: 'Rotate labels to prevent overlap (-90 for vertical)'
                })}

                ${FormField.renderField(this, 'style.xaxis.border.show', {
                    label: 'Show X-Axis Border'
                })}

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

                ${FormField.renderField(this, 'style.yaxis.labels.show', {
                    label: 'Show Y-Axis Labels',
                    helper: 'Display value labels on the left side of the chart'
                })}

                ${FormField.renderField(this, 'style.yaxis.border.show', {
                    label: 'Show Y-Axis Border'
                })}

                ${FormField.renderField(this, 'style.yaxis.ticks.show', {
                    label: 'Show Y-Axis Ticks'
                })}

                ${FormField.renderField(this, 'style.yaxis.decimals', {
                    label: 'Value Decimal Places',
                    helper: 'Round displayed values to N decimal places (applies to axis labels, tooltips, and data labels). Leave empty for full precision.'
                })}
            </lcards-form-section>

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
                ?expanded=${false}>

                ${FormField.renderField(this, 'style.data_labels.show', {
                    label: 'Show Data Labels',
                    helper: 'Display values directly on data points (can be cluttered with many points)'
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
                ?expanded=${false}>

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

    /**
     * Render Effects tab (renamed from Animation)
     * @returns {TemplateResult}
     * @private
     */
    _renderEffectsTab() {
        // Delegate to existing animation tab renderer
        return this._renderAnimationTab();
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

                <lcards-message type="info">
                    <strong>Theme vs colours</strong><br>
                    Theme mode sets the overall look. Use Appearance tab for detailed color control.
                </lcards-message>

                ${FormField.renderField(this, 'style.theme.mode', {
                    label: 'Theme Mode',
                    helper: 'Choose light or dark base theme'
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
                    <lcards-color-picker
                        .hass=${this.hass}
                        .value=${this._getNestedValue('style.theme.monochrome.color') || '#FF9900'}
                        @value-changed=${(e) => this._setNestedValue('style.theme.monochrome.color', e.detail.value)}>
                    </lcards-color-picker>

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

                ${renderInfoGuide({
                    header: 'Animation presets',
                    body: html`
                        <ul>
                            <li><strong>lcars_standard</strong>: balanced speed and smoothness.</li>
                            <li><strong>lcars_dramatic</strong>: slower, more cinematic.</li>
                            <li><strong>lcars_minimal</strong>: fast, subtle transitions.</li>
                            <li><strong>lcars_realtime</strong>: no animation, for live data.</li>
                            <li><strong>none</strong>: no animations at all.</li>
                        </ul>
                    `,
                })}
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

    render() {
        return html`
            <ha-dialog
                open
                @closed=${(e) => { e.stopPropagation(); this._handleClose(); }}
                header-title="Chart Studio">

                <div class="dialog-content">
                    <!-- Split Layout: Config (40%) | Preview (60%) -->
                    <div class="studio-layout">
                        <!-- Left Panel: Config -->
                        <div class="config-panel">
                            <!-- Tab Navigation -->
                            ${this._renderTabNavigation()}

                            <!-- Tab Content Wrapper (scrollable) -->
                            <div class="tab-content">
                                ${this._renderTabContent()}
                            </div>
                        </div>

                        <!-- Right Panel: Live Preview -->
                        <div class="preview-panel">
                            <!-- Preview Toolbar -->
                            <div class="canvas-toolbar">
                                <div class="canvas-toolbar-buttons">
                                    <ha-icon-button
                                        .label=${'Refresh preview'}
                                        @click=${() => this._updatePreviewCard()}>
                                        <ha-icon icon="mdi:refresh"></ha-icon>
                                    </ha-icon-button>
                                </div>
                            </div>

                            <!-- Live Preview Container -->
                            <div class="preview-container">
                                <div class="preview-mount" ${ref(this._previewRef)}></div>

                                ${this._previewEmpty ? html`
                                    <div class="preview-state">
                                        <ha-icon icon="mdi:chart-line-variant"></ha-icon>
                                        <div class="preview-state-title">Add a series</div>
                                        <div>Add at least one series to see the chart preview.</div>
                                    </div>
                                ` : ''}

                                ${this._previewError ? html`
                                    <div class="preview-state preview-error">
                                        <ha-icon icon="mdi:alert-circle"></ha-icon>
                                        <div class="preview-state-title">Chart error</div>
                                        <div>${this._previewError}</div>
                                    </div>
                                ` : ''}
                            </div>
                        </div>
                    </div>

                    <!-- Data sources: the Main Engineering tab, in its own dialog -->
                    ${this._showDataSourceEditor ? html`
                        <ha-dialog
                            open
                            class="datasources-dialog"
                            header-title="Data sources"
                            @closed=${(e) => { e.stopPropagation(); this._closeDataSourceEditor(); }}>
                            <lcards-datasource-editor-tab
                                .editor=${this._dataSourceHost}
                                .hass=${this.hass}>
                            </lcards-datasource-editor-tab>
                            <div slot="footer">
                                <ha-button appearance="plain" data-dialog="close">Close</ha-button>
                            </div>
                        </ha-dialog>
                    ` : ''}
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
}

// Register custom element
if (!customElements.get('lcards-chart-studio-dialog')) customElements.define('lcards-chart-studio-dialog', LCARdSChartStudioDialog);
