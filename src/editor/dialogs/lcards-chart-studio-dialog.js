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
            // Note: _renderKey is NOT reactive - plain property to avoid requestUpdate() on increment
            _darkPreview: { type: Boolean, state: true }, // Preview background toggle
            _showDataSourceEditor: { type: Boolean, state: true } // DataSource editor overlay
        };
    }

    constructor() {
        super();
        this.hass = null;
        this._initialConfig = null;
        this._workingConfig = {};
        this._activeTab = 'data';
        this._validationErrors = [];

        // Create ref for preview container
        this._previewRef = createRef();

        // Debounce timer for preview updates
        this._previewUpdateTimer = null;

        // Preview state
        this._previewLoading = false;
        this._previewError = null;

        // Initialize state
        this._selectedEntity = '';
        this._renderKey = 0; // Plain property, not reactive
        this._showDataSourceEditor = false;

        // Data Sources tab state
        this._dataSourceLevel = 'simple';

        // Initialize chart schema
        this._chartSchema = getChartSchema();

        // Preview render key for forced updates
        this._renderKey = 0;

        // Preview UI state
        this._darkPreview = true; // Default to dark background for charts

        // DataSource editor state
        this._showDataSourceEditor = false;
    }

    /**
     * Getter for config property that returns _workingConfig
     */
    get config() {
        return this._workingConfig;
    }

    /**
     * Setter for config property - updates both initial and working config
     * This is called by datasource-editor-tab when DataSources are added/edited
     */
    set config(value) {
        this._initialConfig = value;
        // Always update _workingConfig to reflect changes from embedded components
        this._workingConfig = JSON.parse(JSON.stringify(value || {}));
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

        // Detect data source level
        this._dataSourceLevel = this._detectDataSourceLevel();

        lcardsLog.debug('[ChartStudio] Opened with config:', this._workingConfig);
        lcardsLog.debug('[ChartStudio] Detected data source level:', this._dataSourceLevel);

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
        // Clean up transient datasources created during chart studio session
        this._cleanupTransientDataSources();
    }

    /**
     * Clean up transient datasources (series_N, series_N_placeholder)
     * These are temporary datasources created during editing that should not persist
     * @private
     */
    _cleanupTransientDataSources() {
        const dsManager = window.lcards?.core?.dataSourceManager;
        if (!dsManager) return;

        const sources = dsManager.sources;
        if (!sources || !(sources instanceof Map)) return;

        const toRemove = [];
        sources.forEach((source, name) => {
            // Remove series_N and series_N_placeholder datasources
            if (name.match(/^series_\d+(_placeholder)?$/)) {
                toRemove.push({ name, source });
            }
        });

        toRemove.forEach(({ name, source }) => {
            lcardsLog.debug('[ChartStudio] Cleaning up transient datasource:', name);

            // Destroy the DataSource instance
            if (source && typeof source.destroy === 'function') {
                source.destroy();
            }

            // Remove from DataSourceManager
            dsManager.sources.delete(name);

            // Remove from entity index if it exists
            if (source?.cfg?.entity) {
                dsManager.entityIndex.delete(source.cfg.entity);
            }
        });

        if (toRemove.length > 0) {
            lcardsLog.info('[ChartStudio] Cleaned up', toRemove.length, 'transient datasources');
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

            .preview-container > *:not(.preview-loading):not(.preview-error) {
                width: 100%;
                height: 100%;
            }

            /* Preview loading state */
            .preview-loading {
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                display: flex;
                flex-direction: column;
                align-items: center;
                z-index: 10;
            }

            /* Preview error state */
            .preview-error {
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                display: flex;
                flex-direction: column;
                align-items: center;
                text-align: center;
                padding: 24px;
                max-width: 400px;
                z-index: 10;
            }

            /* Preview empty/incomplete state */
            .preview-empty {
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                text-align: center;
                padding: 24px;
                max-width: 400px;
                color: var(--secondary-text-color);
                min-height: 500px;
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

            /* DataSource Editor Overlay */
            .datasource-editor-overlay {
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(0, 0, 0, 0.5);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 1000;
                backdrop-filter: blur(2px);
            }

            .datasource-editor-panel {
                width: 90%;
                max-width: 900px;
                height: 80%;
                background: var(--card-background-color);
                border-radius: 12px;
                box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
                display: flex;
                flex-direction: column;
                overflow: hidden;
            }

            .datasource-editor-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 16px 20px;
                border-bottom: 1px solid var(--divider-color);
                background: var(--secondary-background-color);
            }

            .datasource-editor-header h3 {
                margin: 0;
                font-size: 18px;
                font-weight: 600;
                color: var(--primary-text-color);
            }

            .datasource-editor-content {
                flex: 1;
                overflow-y: auto;
                padding: 0;
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
            this._renderKey++; // Force preview re-render
            this._updatePreviewCard();
            this._previewUpdateTimer = null;
            // DO NOT call requestUpdate() here - preview update is manual DOM manipulation
            // and doesn't affect the dialog's Lit template. Calling requestUpdate() while
            // the preview card is initializing causes Lit rendering race conditions.
        }, 300);
    }

    /**
     * Update preview card (manual DOM manipulation)
     * @private
     */
    _updatePreviewCard() {
        const container = this._previewRef.value;
        if (!container) {
            lcardsLog.warn('[ChartStudio] Preview container ref not available');
            return;
        }

        // Clear existing preview
        while (container.firstChild) {
            container.firstChild.remove();
        }

        // Get preview config with defaults
        const previewConfig = this._getPreviewConfig();
        if (!previewConfig) {
            lcardsLog.debug('[ChartStudio] No valid config for preview - showing empty state');

            // Show "incomplete config" message instead of trying to render
            const emptyMsg = document.createElement('div');
            emptyMsg.className = 'preview-empty';
            emptyMsg.innerHTML = `
                <ha-icon icon="mdi:chart-line-variant" style="--mdc-icon-size: 64px; opacity: 0.3; margin-bottom: 16px;"></ha-icon>
                <div style="font-weight: 500; font-size: 16px; margin-bottom: 8px;">Configure Data Sources</div>
                <div style="font-size: 14px; opacity: 0.8;">Add at least one data source or entity to see the chart preview</div>
            `;
            container.appendChild(emptyMsg);
            return;
        }

        try {
            // Show loading state briefly
            this._previewLoading = true;

            // Manually create card element
            const card = document.createElement('lcards-chart');

            lcardsLog.debug('[ChartStudio] Creating preview card with config:', previewConfig);
            lcardsLog.debug('[ChartStudio] HASS object available:', !!this.hass);

            // CRITICAL: Set config and hass BEFORE appending (like data-grid does)
            // This ensures firstUpdate has config available
            // @ts-ignore - TS2339: auto-suppressed
            card.setConfig(previewConfig);
            // @ts-ignore - TS2339: auto-suppressed
            card.hass = this.hass;

            // NOW append to DOM after card is fully configured
            container.appendChild(card);

            // Hide loading state after card is rendered
            setTimeout(() => {
                this._previewLoading = false;

                // Force update to ensure DataSources are hydrated
                // @ts-ignore - TS2339: auto-suppressed
                if (card.hass) {
                    // @ts-ignore - TS2339: auto-suppressed
                    card.hass = { ...this.hass }; // Trigger update
                }
            }, 100);

            lcardsLog.debug('[ChartStudio] Preview card configured and appended');
        } catch (error) {
            lcardsLog.error('[ChartStudio] Failed to update preview:', error);
            this._previewLoading = false;
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
     * Check if config has valid data configuration
     * @private
     * @param {Object} config - Config to validate
     * @returns {boolean} True if config has valid data sources
     */
    _hasValidDataConfig(config) {
        // Check for sources array with at least one entry
        if (config.sources && Array.isArray(config.sources) && config.sources.length > 0) {
            // Each source must be either:
            // 1. A string (datasource name or entity)
            // 2. An object with datasource property
            const hasValidSources = config.sources.some(source => {
                let sourceName;

                if (typeof source === 'string') {
                    sourceName = source;
                } else if (typeof source === 'object' && source !== null) {
                    sourceName = source.datasource;
                } else {
                    return false;
                }

                if (!sourceName || sourceName.trim() === '') {
                    return false;
                }

                // Check if this is a local datasource reference
                if (config.data_sources && config.data_sources[sourceName]) {
                    const ds = config.data_sources[sourceName];
                    // Local datasource must have a valid entity
                    return ds.entity && ds.entity.trim() !== '';
                }

                // Check if it's a global datasource
                const dsManager = window.lcards?.core?.dataSourceManager;
                if (dsManager?.sources?.has(sourceName)) {
                    return true; // Global datasources are always valid
                }

                // Check if it looks like a direct entity reference
                if (sourceName.includes('.')) {
                    return true; // Assume entity_id format is valid
                }

                return false;
            });

            if (hasValidSources) return true;
        }

        // Check for legacy single source
        if (config.source && typeof config.source === 'string' && config.source.trim() !== '') {
            // If it's a datasource reference, check if it has entity
            if (config.data_sources && config.data_sources[config.source]) {
                const ds = config.data_sources[config.source];
                return ds.entity && ds.entity.trim() !== '';
            }
            // Otherwise assume it's valid (entity or global datasource)
            return true;
        }

        // Check for data_sources with entities
        if (config.data_sources && typeof config.data_sources === 'object') {
            const dsEntries = Object.entries(config.data_sources);
            if (dsEntries.length > 0) {
                // At least one datasource must have a valid entity
                const hasEntity = dsEntries.some(([name, ds]) => {
                    return ds.entity && ds.entity.trim() !== '';
                });
                if (hasEntity) return true;
            }
        }

        // No valid data configuration found
        return false;
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
        console.log('[ChartStudio] FULL CONFIG AT SAVE:', JSON.stringify(this._workingConfig, null, 2));
        console.log('[ChartStudio] style.colors at save:', this._workingConfig?.style?.colors);

        // Clean up empty data_sources object if no local sources defined
        if (this._workingConfig.data_sources && Object.keys(this._workingConfig.data_sources).length === 0) {
            delete this._workingConfig.data_sources;
            lcardsLog.debug('[ChartStudio] Removed empty data_sources object');
        }

        // Clean up transient datasources before saving
        this._cleanupTransientDataSources();

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
     * Handle Reset button
     * @private
     */
    _handleReset() {
        if (!this._confirmAction('Reset to initial configuration? All changes will be lost.')) {
            return;
        }
        lcardsLog.debug('[ChartStudio] Resetting to initial config');
        this._workingConfig = JSON.parse(JSON.stringify(this._initialConfig));
        this._schedulePreviewUpdate();
        this.requestUpdate();
    }

    async _confirmAction(message) {
        return await this._showConfirmDialog('Confirm Action', message);
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
            // @ts-ignore - TS2339: auto-suppressed
            dialog.headerTitle = title;
            // @ts-ignore - TS2339: auto-suppressed
            dialog.open = true;

            // Create content
            const content = document.createElement('div');
            content.innerHTML = message;
            content.style.padding = '16px';
            dialog.appendChild(content);

            // Cancel button
            const cancelButton = document.createElement('ha-button');
            cancelButton.slot = 'footer';
            cancelButton.textContent = 'Cancel';
            cancelButton.setAttribute('appearance', 'plain');
            cancelButton.addEventListener('click', () => {
                // @ts-ignore - TS2339: auto-suppressed
                dialog.open = false;
                resolve(false);
            });

            // Discard button
            const confirmButton = document.createElement('ha-button');
            confirmButton.textContent = 'Discard';
            confirmButton.setAttribute('variant', 'danger');
            confirmButton.addEventListener('click', () => {
                // @ts-ignore - TS2339: auto-suppressed
                dialog.open = false;
                resolve(true);
            });

            // Wrap both buttons in a single footer container
            const footerDiv = document.createElement('div');
            footerDiv.slot = 'footer';
            footerDiv.appendChild(cancelButton);
            footerDiv.appendChild(confirmButton);
            dialog.appendChild(footerDiv);

            // Handle dialog close
            dialog.addEventListener('closed', () => {
                dialog.remove();
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
            { id: 'data', icon: 'mdi:database-arrow-right', label: 'Data' },
            { id: 'appearance', icon: 'mdi:palette-advanced', label: 'Appearance' },
            { id: 'elements', icon: 'mdi:widgets', label: 'Elements' },
            { id: 'theme', icon: 'mdi:theme-light-dark', label: 'Theme' },
            { id: 'effects', icon: 'mdi:shimmer', label: 'Effects' },
            { id: 'advanced', icon: 'mdi:cog', label: 'Advanced' }
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

                <!-- Chart Type Selector -->
                ${this._renderChartTypeSelector()}

                ${this._renderDataSourceHelp()}
            </div>
        `;
    }

    /**
     * Render level selector (Quick Start / Advanced)
     * @returns {TemplateResult}
     * @private
     */
    _renderLevelSelector() {
        const levels = [
            {
                id: 'quick',
                title: '🚀 Quick Start',
                description: 'Add entities with one click. Perfect for most charts.'
            },
            {
                id: 'advanced',
                title: '⚙️ Advanced',
                description: 'Full DataSource control with history, throttling, and transformations.'
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
     * Render Quick Start Mode (simplified DataSource creation)
     * @returns {TemplateResult}
     * @private
     */
    _renderQuickStartMode() {
        // Quick Start uses data_sources under the hood with auto-generated names
        const dataSources = this._workingConfig.data_sources || {};
        const sources = this._workingConfig.sources || [];
        const seriesCount = sources.length;

        return html`
            <lcards-form-section
                header="${seriesCount === 0 ? 'Add Your First Entity' : 'Series Configuration'}"
                icon="mdi:chart-timeline-variant"
                description="Each series will track its history automatically"
                ?expanded=${true}>

                ${seriesCount === 0 ? html`
                    <lcards-message type="info">
                        <strong>📊 Start Your Chart</strong><br>
                        Select an entity to begin. LCARdS will automatically track its history to build your chart.
                    </lcards-message>
                ` : ''}

                <!-- Series List -->
                ${sources.map((sourceName, index) => {
                    const dsConfig = dataSources[sourceName] || {};
                    const entityId = dsConfig.entity || '';
                    const windowHours = (dsConfig.window_seconds || 3600) / 3600;

                    return html`
                        <div class="series-item" style="margin-bottom: 16px;">
                            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                                <strong>Series ${index + 1}</strong>
                                <div class="series-controls">
                                    <ha-icon-button
                                        @click=${() => this._moveQuickSeries(index, -1)}
                                        .disabled=${index === 0}>
                                        <ha-icon icon="mdi:arrow-up"></ha-icon>
                                    </ha-icon-button>
                                    <ha-icon-button
                                        @click=${() => this._moveQuickSeries(index, 1)}
                                        .disabled=${index === sources.length - 1}>
                                        <ha-icon icon="mdi:arrow-down"></ha-icon>
                                    </ha-icon-button>
                                    <ha-icon-button
                                        @click=${() => this._removeQuickSeries(index)}>
                                        <ha-icon icon="mdi:delete"></ha-icon>
                                    </ha-icon-button>
                                </div>
                            </div>

                            <div class="series-content">
                                <!-- Entity Picker -->
                                ${FormField.renderField(this, `quick_series_${index}_entity`, {
                                    label: 'Entity',
                                    // @ts-ignore - TS2353: auto-suppressed
                                    selector: { entity: {} },
                                    value: entityId,
                                    onChange: (value) => this._updateQuickSeriesEntity(index, value)
                                })}

                                <!-- History Window Slider -->
                                ${FormField.renderField(this, `quick_series_${index}_window`, {
                                    label: `History Window: ${windowHours}h`,
                                    helper: 'How far back to show data (1 hour to 7 days)',
                                    // @ts-ignore - TS2353: auto-suppressed
                                    selector: { number: { min: 1, max: 168, step: 1, mode: 'slider', unit_of_measurement: 'hours' } },
                                    value: windowHours,
                                    onChange: (value) => this._updateQuickSeriesWindow(index, value)
                                })}
                            </div>
                        </div>
                    `;
                })}

                <!-- Add Series Button -->
                <ha-button
                    class="add-button"
                    @click=${() => this._addQuickSeries()}>
                    <ha-icon icon="mdi:plus" slot="start"></ha-icon>
                    ${seriesCount === 0 ? 'Add Entity' : 'Add Another Series'}
                </ha-button>
            </lcards-form-section>

            <!-- Global History Options -->
            ${seriesCount > 0 ? html`
                <lcards-form-section
                    header="History Options"
                    icon="mdi:history"
                    ?expanded=${false}>

                    <div class="form-field">
                        <label class="form-label">
                            <ha-checkbox
                                .checked=${this._getGlobalHistoryPreload()}
                                @change=${(e) => this._setGlobalHistoryPreload(e.target.checked)}>
                            </ha-checkbox>
                            Preload History
                        </label>
                        <div class="form-helper">Load historical data immediately when chart opens (recommended)</div>
                    </div>

                    ${FormField.renderField(this, 'max_points', {
                        label: 'Max Data Points',
                        helper: 'Limit points for performance (500 recommended)',
                        // @ts-ignore - TS2353: auto-suppressed
                        selector: { number: { min: 50, max: 1000, step: 50, mode: 'box' } },
                        value: this._workingConfig.max_points || 500,
                        onChange: (value) => this._updateConfig('max_points', value)
                    })}
                </lcards-form-section>
            ` : ''}
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
            <lcards-form-section
                header="Data Source Configuration"
                icon="mdi:database-cog"
                description="Configure individual data sources with entities and settings">
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
                        message="No data sources configured. Click 'Add Data Source' to get started.">
                    </lcards-message>
                `}

                <ha-button class="add-button" @click=${() => this._openDataSourcePicker()}>
                    <ha-icon icon="mdi:plus" slot="start"></ha-icon>
                    Add DataSource
                </ha-button>
            </lcards-form-section>

            ${sources.length > 0 ? html`
                <lcards-form-section
                    header="Sources Order"
                    icon="mdi:sort"
                    description="Drag to reorder series display order"
                    ?expanded=${false}>
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
        const minEmitMs = config.min_emit_ms || 0;
        const historyPreload = config.history?.preload || false;
        const historyHours = config.history?.hours || 0;

        return html`
            <div style="margin-top: 12px;">
                ${FormField.renderField(this, `datasource_${name}_entity`, {
                    label: 'Entity',
                    // @ts-ignore - TS2353: auto-suppressed
                    selector: { entity: {} },
                    value: config.entity || '',
                    onChange: (value) => this._updateDataSourceConfig(name, 'entity', value)
                })}

                ${FormField.renderField(this, `datasource_${name}_window`, {
                    label: 'Window (seconds)',
                    helper: 'Time window for data aggregation',
                    // @ts-ignore - TS2353: auto-suppressed
                    selector: { number: { min: 60, max: 86400, mode: 'box' } },
                    value: windowSeconds,
                    onChange: (value) => this._updateDataSourceConfig(name, 'window_seconds', value)
                })}

                ${FormField.renderField(this, `datasource_${name}_minEmit`, {
                    label: 'Min Emit (ms)',
                    helper: 'Minimum time between updates (throttling)',
                    // @ts-ignore - TS2353: auto-suppressed
                    selector: { number: { min: 0, max: 10000, mode: 'box' } },
                    value: minEmitMs,
                    onChange: (value) => this._updateDataSourceConfig(name, 'min_emit_ms', value)
                })}

                <div class="form-field">
                    <label class="form-label">
                        <ha-checkbox
                            .checked=${historyPreload}
                            @change=${(e) => this._updateDataSourceHistoryConfig(name, 'preload', e.target.checked)}>
                        </ha-checkbox>
                        Preload History
                    </label>
                </div>

                ${historyPreload ? FormField.renderField(this, `datasource_${name}_history_hours`, {
                    label: 'History Hours',
                    helper: 'Hours of historical data to preload (0-168)',
                    // @ts-ignore - TS2353: auto-suppressed
                    selector: { number: { min: 0, max: 168, mode: 'box' } },
                    value: historyHours,
                    onChange: (value) => this._updateDataSourceHistoryConfig(name, 'hours', value)
                }) : ''}
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
            <lcards-form-section
                header="History Configuration"
                icon="mdi:history"
                description="Configure historical data loading">
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
                    <span class="entity-preview-value">${haFormatState(this.hass, entityState)}</span>
                </div>
                ${entityState.attributes?.unit_of_measurement ? html`
                    <div class="entity-preview-item">
                        <span class="entity-preview-label">Unit:</span>
                        <span class="entity-preview-value">${entityState.attributes.unit_of_measurement}</span>
                    </div>
                ` : ''}
                <div class="entity-preview-item">
                    <span class="entity-preview-label">Friendly Name:</span>
                    <span class="entity-preview-value">${haFormatEntityName(this.hass, entityState)}</span>
                </div>
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
                infoText: 'Plots a continuous line from entity history. Works out of the box with any DataSource — each {t, v} point becomes a data point. Best for temperature, power, or any value that changes over time.'
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
                infoText: 'Grid of color-intensity cells. Each series becomes one row, and values over time form the columns. Works with entity history — great for showing daily/weekly patterns across multiple entities.'
            },
            {
                value: 'pie', label: 'Pie', icon: 'mdi:chart-pie', minSeries: 2,
                desc: 'Proportions (2+ series)',
                special: true,
                infoText: 'Shows proportional slices of a whole. Requires 2+ series, each holding a single numeric value (not a time-series). Use sensors that naturally return a single current value — e.g., energy usage per zone. Time-series history buffers are not suited for this type.'
            },
            {
                value: 'donut', label: 'Donut', icon: 'mdi:chart-donut', minSeries: 2,
                desc: 'Proportions (2+ series)',
                special: true,
                infoText: 'Like Pie but with an open centre. Same data requirements — 2+ series each with a single numeric value. The centre can display a total or label.'
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
                infoText: 'Equal-angle segments with varying radius. Similar to Pie — requires category counts, one value per series. Each series becomes one segment, sized by its value. Not suited for time-series history buffers.'
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
                infoText: 'Gantt-style horizontal bars spanning a start–end range. Each data point must be { x: "Label", y: [startMs, endMs] }. Use a DataSource processor with rolling_statistics or build a custom datasource to produce range arrays. Not compatible with standard entity history.'
            },
            {
                value: 'rangeArea', label: 'Range Area', icon: 'mdi:chart-bell-curve', minSeries: 1,
                desc: 'Confidence bands',
                special: true,
                infoText: 'Shaded band between two values over time (e.g., min/max, confidence intervals). Each point must be { x: timestamp, y: [low, high] }. Use a rolling_statistics processor that outputs a [min, max] array per window.'
            },
            {
                value: 'candlestick', label: 'Candlestick', icon: 'mdi:chart-candlestick', minSeries: 1,
                desc: 'OHLC financial data',
                special: true,
                infoText: 'Classic OHLC chart for financial or volatility data. Each point must be { x: timestamp, y: [open, high, low, close] }. Use a rolling_statistics processor configured to output OHLC arrays, or wire a custom datasource.'
            },
            {
                value: 'boxPlot', label: 'Box Plot', icon: 'mdi:chart-box-outline', minSeries: 1,
                desc: 'Statistical distribution',
                special: true,
                infoText: 'Shows statistical distribution per category. Each point needs { x: label, y: [min, q1, median, q3, max] }. Use a rolling_statistics processor set to produce boxplot-format arrays from a window of entity readings.'
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
                                    ${selected.special ? html`<span style="font-size: 11px; font-weight: 400; opacity: 0.8;"> — requires custom data format</span>` : ''}
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
        // Both Quick Start and Advanced use sources array
        const sources = this._workingConfig.sources || [];
        return sources.length;
    }

    /**
     * Render data source help documentation
     * @returns {TemplateResult}
     * @private
     */
    _renderDataSourceHelp() {
        return html`
            <lcards-form-section header="Help" icon="mdi:help-circle" ?expanded=${false}>
                <div style="font-size: 14px; line-height: 1.6;">
                    <h4>🚀 Quick Start Mode</h4>
                    <p>Simplified interface for creating charts quickly. Each entity gets automatic history tracking with customizable time windows. Perfect for most use cases.</p>

                    <h4>⚙️ Advanced Mode</h4>
                    <p>Full DataSource control with custom names, throttling, transformations, and fine-grained history settings. For power users and complex scenarios.</p>

                    <h4>📊 History Tracking</h4>
                    <p>Both modes use DataSource buffers to track entity history over time. Charts need historical data to display trends - current values alone aren't enough!</p>
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
        }

        // Everything else is Quick Start (single source or sources array)
        return 'quick';
    }

    /**
     * Switch data source level
     * @param {string} level - 'quick' | 'advanced'
     * @private
     */
    async _switchDataSourceLevel(level) {
        if (level === this._dataSourceLevel) return;

        // Check if config exists and confirm switch
        const hasExistingConfig = this._hasDataSourceConfig();
        if (hasExistingConfig) {
            const confirmed = await this._showConfirmDialog(
                'Switch Data Mode?',
                `Switching to ${level === 'quick' ? 'Quick Start' : 'Advanced'} mode will reset your current configuration. Continue?`
            );
            if (!confirmed) return;
        }

        // Clear incompatible config properties
        this._clearDataSourceConfig();

        // Update level
        this._dataSourceLevel = level;

        // Initialize for new level
        if (level === 'quick') {
            // Quick Start uses source (single) or sources (multi)
            // Initialize with one empty series if none exist
            if (!this._workingConfig.data_sources) {
                this._workingConfig.data_sources = {};
            }
            if (!this._workingConfig.sources || this._workingConfig.sources.length === 0) {
                this._addQuickSeries(); // Add first series automatically
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

    // ============================================================================
    // QUICK START MODE HELPERS
    // ============================================================================

    /**
     * Add a new series in Quick Start mode
     * @private
     */
    _addQuickSeries() {
        if (!this._workingConfig.data_sources) {
            this._workingConfig.data_sources = {};
        }
        if (!this._workingConfig.sources) {
            this._workingConfig.sources = [];
        }

        // Generate unique DataSource name
        const index = this._workingConfig.sources.length;
        const dsName = `series_${index + 1}`;

        // Create DataSource config with defaults
        this._workingConfig.data_sources[dsName] = {
            entity: '',
            window_seconds: 3600, // 1 hour default
            history: {
                preload: true,
                hours: 1
            }
        };

        // Add to sources array
        this._workingConfig.sources.push(dsName);

        lcardsLog.debug('[ChartStudio] Added Quick Start series:', dsName);
        this.requestUpdate();
        this._schedulePreviewUpdate();
    }

    /**
     * Remove a series in Quick Start mode
     * @param {number} index - Series index
     * @private
     */
    _removeQuickSeries(index) {
        const dsName = this._workingConfig.sources[index];

        // Remove from sources array
        this._workingConfig.sources.splice(index, 1);

        // Remove DataSource config
        delete this._workingConfig.data_sources[dsName];

        lcardsLog.debug('[ChartStudio] Removed Quick Start series:', dsName);
        this.requestUpdate();
        this._schedulePreviewUpdate();
    }

    /**
     * Move a series up/down in Quick Start mode
     * @param {number} index - Current index
     * @param {number} direction - -1 for up, 1 for down
     * @private
     */
    _moveQuickSeries(index, direction) {
        const newIndex = index + direction;
        if (newIndex < 0 || newIndex >= this._workingConfig.sources.length) return;

        const sources = this._workingConfig.sources;
        [sources[index], sources[newIndex]] = [sources[newIndex], sources[index]];

        this.requestUpdate();
        this._schedulePreviewUpdate();
    }

    /**
     * Update entity for a Quick Start series
     * @param {number} index - Series index
     * @param {string} entityId - Entity ID
     * @private
     */
    _updateQuickSeriesEntity(index, entityId) {
        const dsName = this._workingConfig.sources[index];
        if (!this._workingConfig.data_sources[dsName]) return;

        this._workingConfig.data_sources[dsName].entity = entityId;

        lcardsLog.debug('[ChartStudio] Updated Quick Start series entity:', dsName, entityId);
        this.requestUpdate();
        this._schedulePreviewUpdate();
    }

    /**
     * Update history window for a Quick Start series
     * @param {number} index - Series index
     * @param {number} hours - Window in hours
     * @private
     */
    _updateQuickSeriesWindow(index, hours) {
        const dsName = this._workingConfig.sources[index];
        if (!this._workingConfig.data_sources[dsName]) return;

        const seconds = hours * 3600;
        this._workingConfig.data_sources[dsName].window_seconds = seconds;

        // Update history hours to match
        if (!this._workingConfig.data_sources[dsName].history) {
            this._workingConfig.data_sources[dsName].history = {};
        }
        this._workingConfig.data_sources[dsName].history.hours = hours;

        lcardsLog.debug('[ChartStudio] Updated Quick Start series window:', dsName, hours + 'h');
        this.requestUpdate();
        this._schedulePreviewUpdate();
    }

    /**
     * Get global history preload setting
     * @returns {boolean}
     * @private
     */
    _getGlobalHistoryPreload() {
        const dataSources = this._workingConfig.data_sources || {};
        const firstDs = Object.values(dataSources)[0];
        return firstDs?.history?.preload ?? true;
    }

    /**
     * Set history preload for all Quick Start series
     * @param {boolean} enabled - Enable preload
     * @private
     */
    _setGlobalHistoryPreload(enabled) {
        const dataSources = this._workingConfig.data_sources || {};

        Object.values(dataSources).forEach(ds => {
            if (!ds.history) ds.history = {};
            ds.history.preload = enabled;
        });

        lcardsLog.debug('[ChartStudio] Set global history preload:', enabled);
        this.requestUpdate();
        this._schedulePreviewUpdate();
    }

    // ============================================================================
    // LEGACY SERIES HELPERS (for old multi mode - can be removed)
    // ============================================================================

    /**
     * Convert single entity to multi-series mode
     * @private
     */
    _convertToMultiSeries() {
        // If we have a single source, convert to sources array
        if (this._workingConfig.source && !this._workingConfig.sources) {
            this._workingConfig.sources = [this._workingConfig.source];
            delete this._workingConfig.source;
        } else if (!this._workingConfig.sources) {
            this._workingConfig.sources = [];
        }

        // Add empty slot for new series
        this._workingConfig.sources.push('');

        lcardsLog.debug('[ChartStudio] Converted to multi-series mode');
        this.requestUpdate();
        this._schedulePreviewUpdate();
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

    // ============================================================================
    // ADVANCED MODE HELPERS
    // ============================================================================

    /**
     * Open DataSource editor inline (Advanced mode)
     * @private
     */
    _openDataSourcePicker() {
        this._showDataSourceEditor = true;
        this.requestUpdate();
        lcardsLog.debug('[ChartStudio] Opened inline DataSource editor');
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
     * Handle DataSource config changes from embedded editor tab
     * @param {CustomEvent} event - config-changed event from datasource-editor-tab
     * @private
     */
    _handleDataSourceConfigChanged(event) {
        // Stop event from bubbling to parent editor
        event.stopPropagation();

        // The datasource-editor-tab fires config-changed when DataSources are added/edited
        // Extract the updated data_sources from the event
        const updatedConfig = event.detail.config;

        if (updatedConfig.data_sources) {
            // Update working config with new/edited DataSources
            this._workingConfig.data_sources = { ...updatedConfig.data_sources };

            lcardsLog.info('[ChartStudio] DataSources updated from embedded editor:',
                Object.keys(this._workingConfig.data_sources));

            // Trigger preview update
            // @ts-ignore - TS2551: auto-suppressed
            this._updatePreview();
            this.requestUpdate();
        }
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
     * Handle DataSource selection from picker
     * @param {string} sourceId - Selected DataSource ID
     * @private
     */
    _handleDataSourceSelected(sourceId) {
        if (!this._workingConfig.sources) {
            this._workingConfig.sources = [];
        }

        // Add to sources array if not already present
        if (!this._workingConfig.sources.includes(sourceId)) {
            this._workingConfig.sources.push(sourceId);
            lcardsLog.debug('[ChartStudio] Added DataSource to chart:', sourceId);
            this.requestUpdate();
            this._schedulePreviewUpdate();
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
                <strong>🎨 Color System</strong><br>
                Colors use CSS variables (e.g., <code>var(--lcars-blue)</code>) or hex codes.
                Array colors cycle through series - add more colors to create variety!
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
                <strong>📍 Chart Elements</strong><br>
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
                    <strong>🎨 Theme vs Colors</strong><br>
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
                                ${this._renderValidationErrors()}
                                ${this._renderTabContent()}
                            </div>
                        </div>

                        <!-- Right Panel: Live Preview -->
                        <div class="preview-panel">
                            <!-- Preview Toolbar -->
                            <div class="canvas-toolbar">
                                <div class="canvas-toolbar-buttons">
                                    <!-- Refresh Preview -->
                                    <button
                                        class="canvas-toolbar-button"
                                        @click=${() => this._updatePreviewCard()}
                                        ?disabled=${this._previewLoading}
                                        title="Refresh Preview">
                                        <ha-icon icon="mdi:refresh"></ha-icon>
                                    </button>
                                </div>
                            </div>

                            <!-- Live Preview Container -->
                            <div
                                class="preview-container"
                                ${ref(this._previewRef)}>

                                ${this._previewLoading ? html`
                                    <div class="preview-loading">
                                        <ha-circular-progress active></ha-circular-progress>
                                        <div style="margin-top: 12px; color: var(--secondary-text-color);">Updating chart...</div>
                                    </div>
                                ` : ''}

                                ${this._previewError ? html`
                                    <div class="preview-error">
                                        <ha-icon icon="mdi:alert-circle" style="--mdc-icon-size: 48px; color: var(--error-color);"></ha-icon>
                                        <div style="margin-top: 12px; font-weight: 600;">Chart Error</div>
                                        <div style="margin-top: 8px; color: var(--secondary-text-color); font-size: 14px;">${this._previewError}</div>
                                    </div>
                                ` : ''}

                                <!-- Preview card rendered here via manual DOM manipulation -->
                            </div>
                        </div>
                    </div>

                    <!-- DataSource Editor Overlay -->
                    ${this._showDataSourceEditor ? html`
                        <div class="datasource-editor-overlay">
                            <div class="datasource-editor-panel">
                                <div class="datasource-editor-header">
                                    <h3>DataSource Configuration</h3>
                                    <ha-icon-button
                                        @click=${this._closeDataSourceEditor}
                                        title="Close">
                                        <ha-icon icon="mdi:close"></ha-icon>
                                    </ha-icon-button>
                                </div>
                                <div class="datasource-editor-content">
                                    <lcards-datasource-editor-tab
                                        .editor=${this}
                                        .hass=${this.hass}
                                        @config-changed=${this._handleDataSourceConfigChanged}>
                                    </lcards-datasource-editor-tab>
                                </div>
                            </div>
                        </div>
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
customElements.define('lcards-chart-studio-dialog', LCARdSChartStudioDialog);
