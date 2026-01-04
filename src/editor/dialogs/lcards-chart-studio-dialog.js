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

export class LCARdSChartStudioDialog extends LitElement {
    static get properties() {
        return {
            hass: { type: Object },
            _initialConfig: { type: Object }, // Store initial config
            _workingConfig: { type: Object, state: true },
            _activeTab: { type: String, state: true },
            _validationErrors: { type: Array, state: true }
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

        lcardsLog.debug('[ChartStudio] Opened with config:', this._workingConfig);

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

    _renderDataSourcesTab() {
        return this._renderComingSoon('Data Sources', 'Phase 2', 
            'Entity picker, multi-series configuration, and advanced DataSource setup');
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
