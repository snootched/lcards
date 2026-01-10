/**
 * LCARdS MSD Configuration Studio
 *
 * Full-screen immersive editor for configuring MSD (Master Systems Display) cards.
 * Phase 1: Foundation with mode system, 6-tab structure, and live preview.
 *
 * Tab Structure:
 * 1. Base SVG - SVG source, viewBox, filters (Phase 2)
 * 2. Anchors - Named anchor management (Phase 2)
 * 3. Controls - Control overlay list with card editor (Phase 3)
 * 4. Lines - Line overlay list with routing config (Phase 4)
 * 5. Channels - Routing channel management (Phase 5)
 * 6. Debug - Debug visualization settings (Phase 6)
 *
 * Mode System:
 * - View: Default mode for navigation
 * - Place Anchor: Click to place named anchors (Phase 2)
 * - Place Control: Click to place control overlays (Phase 3)
 * - Connect Line: Click source → target workflow (Phase 4)
 * - Draw Channel: Draw routing channel rectangles (Phase 5)
 *
 * @element lcards-msd-studio-dialog
 * @fires config-changed - When configuration is saved (detail: { config })
 * @fires closed - When dialog is closed
 *
 * @property {Object} hass - Home Assistant instance
 * @property {Object} config - Initial card configuration
 */

import { LitElement, html, css } from 'lit';
import { lcardsLog } from '../../utils/lcards-logging.js';
import { editorStyles } from '../base/editor-styles.js';
import '../components/shared/lcards-form-section.js';
import '../components/shared/lcards-message.js';
import '../components/lcards-msd-live-preview.js';

// Mode constants
const MODES = {
    VIEW: 'view',
    PLACE_ANCHOR: 'place_anchor',
    PLACE_CONTROL: 'place_control',
    CONNECT_LINE: 'connect_line',
    DRAW_CHANNEL: 'draw_channel'
};

// Tab constants
const TABS = {
    BASE_SVG: 'base_svg',
    ANCHORS: 'anchors',
    CONTROLS: 'controls',
    LINES: 'lines',
    CHANNELS: 'channels',
    DEBUG: 'debug'
};

export class LCARdSMSDStudioDialog extends LitElement {
    static get properties() {
        return {
            hass: { type: Object },
            _initialConfig: { type: Object },
            _workingConfig: { type: Object, state: true },
            _activeTab: { type: String, state: true },
            _activeMode: { type: String, state: true },
            _validationErrors: { type: Array, state: true },
            _debugSettings: { type: Object, state: true },
            // Base SVG Tab Properties
            _viewBoxMode: { type: String, state: true }, // 'auto' or 'custom'
            _customFiltersEnabled: { type: Boolean, state: true },
            // Anchors Tab Properties
            _showAnchorForm: { type: Boolean, state: true },
            _editingAnchorName: { type: String, state: true },
            _anchorFormName: { type: String, state: true },
            _anchorFormPosition: { type: Array, state: true },
            _anchorFormUnit: { type: String, state: true },
            _showGrid: { type: Boolean, state: true },
            _gridSpacing: { type: Number, state: true },
            _snapToGrid: { type: Boolean, state: true }
        };
    }

    constructor() {
        super();
        this.hass = null;
        this._initialConfig = null;
        this._workingConfig = {};
        this._activeTab = TABS.BASE_SVG;
        this._activeMode = MODES.VIEW;
        this._validationErrors = [];
        this._debugSettings = {
            anchors: true,
            bounding_boxes: true,
            attachment_points: false,
            routing_channels: false,
            line_paths: true,
            grid: false
        };

        // Debounce timer for preview updates
        this._previewUpdateTimer = null;

        // Base SVG Tab State
        this._viewBoxMode = 'auto';
        this._customFiltersEnabled = false;

        // Anchors Tab State
        this._showAnchorForm = false;
        this._editingAnchorName = null;
        this._anchorFormName = '';
        this._anchorFormPosition = [0, 0];
        this._anchorFormUnit = 'vb';
        this._showGrid = false;
        this._gridSpacing = 50;
        this._snapToGrid = false;

        lcardsLog.debug('[MSDStudio] Initialized');
    }

    /**
     * Getter for config property
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
            this._workingConfig.type = 'custom:lcards-msd';
        }

        // Ensure MSD config structure
        if (!this._workingConfig.msd) {
            this._workingConfig.msd = {};
        }

        lcardsLog.debug('[MSDStudio] Opened with config:', this._workingConfig);

        // Schedule initial preview update
        this.updateComplete.then(() => this._schedulePreviewUpdate());
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

            /* ha-dialog Sizing */
            ha-dialog {
                --mdc-dialog-min-width: 95vw;
                --mdc-dialog-max-width: 95vw;
                --mdc-dialog-min-height: 90vh;
            }

            /* Dialog Content */
            .dialog-content {
                display: flex;
                flex-direction: column;
                min-height: 80vh;
                max-height: 90vh;
                gap: 0;
            }

            /* Mode Toolbar */
            .mode-toolbar {
                display: flex;
                gap: 8px;
                padding: 12px 24px;
                background: var(--secondary-background-color);
                border-bottom: 1px solid var(--divider-color);
            }

            .mode-button {
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 4px;
                padding: 8px 12px;
                background: var(--card-background-color);
                border: 2px solid var(--divider-color);
                border-radius: 8px;
                cursor: pointer;
                transition: all 0.2s;
            }

            .mode-button:hover {
                background: var(--primary-background-color);
                border-color: var(--primary-color);
            }

            .mode-button.active {
                background: var(--primary-color);
                color: var(--text-primary-color);
                border-color: var(--primary-color);
            }

            .mode-button ha-icon {
                --mdc-icon-size: 24px;
            }

            .mode-button-label {
                font-size: 11px;
                font-weight: 500;
                white-space: nowrap;
            }

            /* Split Panel Layout */
            .studio-layout {
                flex: 1;
                display: grid;
                grid-template-columns: 60% 40%;
                gap: 0;
                overflow: hidden;
                background: var(--primary-background-color);
            }

            .config-panel {
                display: flex;
                flex-direction: column;
                overflow: hidden;
                border-right: 2px solid var(--divider-color);
            }

            .preview-panel {
                display: flex;
                flex-direction: column;
                overflow: hidden;
            }

            /* Tab Navigation */
            .tab-nav {
                display: flex;
                gap: 0;
                padding: 0 16px;
                background: var(--card-background-color);
                border-bottom: 2px solid var(--divider-color);
            }

            .tab-button {
                padding: 12px 20px;
                background: transparent;
                border: none;
                border-bottom: 3px solid transparent;
                cursor: pointer;
                font-size: 14px;
                font-weight: 500;
                color: var(--secondary-text-color);
                transition: all 0.2s;
            }

            .tab-button:hover {
                background: var(--primary-background-color);
                color: var(--primary-text-color);
            }

            .tab-button.active {
                color: var(--primary-color);
                border-bottom-color: var(--primary-color);
                border-bottom-width: 4px;
            }

            /* Tab Content */
            .tab-content {
                flex: 1;
                overflow-y: auto;
                padding: 16px;
            }

            /* Placeholder Content */
            .placeholder-content {
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                padding: 48px 24px;
                text-align: center;
                color: var(--secondary-text-color);
            }

            .placeholder-content ha-icon {
                --mdc-icon-size: 64px;
                margin-bottom: 16px;
                opacity: 0.5;
            }

            .placeholder-title {
                font-size: 20px;
                font-weight: 600;
                margin: 0 0 12px 0;
            }

            .placeholder-description {
                font-size: 14px;
                margin: 0;
                max-width: 500px;
            }

            /* Mode Status Badge */
            .mode-status {
                display: flex;
                align-items: center;
                gap: 8px;
                padding: 6px 12px;
                background: var(--primary-background-color);
                border-radius: 12px;
                font-size: 12px;
                font-weight: 500;
                color: var(--primary-text-color);
                margin-left: auto;
            }

            /* Responsive */
            @media (max-width: 1024px) {
                .studio-layout {
                    grid-template-columns: 1fr;
                    grid-template-rows: 1fr 1fr;
                }

                .config-panel {
                    border-right: none;
                    border-bottom: 2px solid var(--divider-color);
                }
            }
            `
        ];
    }

    /**
     * Set active mode
     * @param {string} mode - Mode identifier
     * @private
     */
    _setMode(mode) {
        // Toggle off if clicking active mode
        if (this._activeMode === mode) {
            this._activeMode = MODES.VIEW;
        } else {
            this._activeMode = mode;
        }
        lcardsLog.debug('[MSDStudio] Mode changed:', this._activeMode);
        this.requestUpdate();
    }

    /**
     * Set active tab
     * @param {string} tabId - Tab identifier
     * @private
     */
    _setActiveTab(tabId) {
        this._activeTab = tabId;
        lcardsLog.debug('[MSDStudio] Tab changed:', this._activeTab);
        this.requestUpdate();
    }

    /**
     * Update config value at nested path
     * @param {string} path - Dot-separated path (e.g., 'msd.base_svg.builtin')
     * @param {*} value - New value
     * @private
     */
    _setNestedValue(path, value) {
        const keys = path.split('.');
        let obj = this._workingConfig;

        for (let i = 0; i < keys.length - 1; i++) {
            if (!obj[keys[i]]) {
                obj[keys[i]] = {};
            }
            obj = obj[keys[i]];
        }

        obj[keys[keys.length - 1]] = value;

        lcardsLog.debug('[MSDStudio] Config updated:', { path, value });
        this._schedulePreviewUpdate();
        this.requestUpdate();
    }

    /**
     * Schedule debounced preview update
     * @private
     */
    _schedulePreviewUpdate() {
        if (this._previewUpdateTimer) {
            clearTimeout(this._previewUpdateTimer);
        }

        this._previewUpdateTimer = setTimeout(() => {
            this._previewUpdateTimer = null;
            this.requestUpdate();
        }, 300);
    }

    /**
     * Handle save button click
     * @private
     */
    _handleSave() {
        lcardsLog.debug('[MSDStudio] Saving config:', this._workingConfig);

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
     * Handle cancel button click
     * @private
     */
    _handleCancel() {
        lcardsLog.debug('[MSDStudio] Cancelled');
        this._handleClose();
    }

    /**
     * Handle reset button click
     * @private
     */
    _handleReset() {
        lcardsLog.debug('[MSDStudio] Resetting to initial config');
        this._workingConfig = JSON.parse(JSON.stringify(this._initialConfig));
        this._schedulePreviewUpdate();
        this.requestUpdate();
    }

    /**
     * Close dialog and dispatch closed event
     * @private
     */
    _handleClose() {
        this.dispatchEvent(new CustomEvent('closed', {
            bubbles: true,
            composed: true
        }));
    }

    /**
     * Get mode label text
     * @param {string} mode - Mode identifier
     * @returns {string}
     * @private
     */
    _getModeLabel(mode) {
        const labels = {
            [MODES.VIEW]: 'View',
            [MODES.PLACE_ANCHOR]: 'Place Anchor',
            [MODES.PLACE_CONTROL]: 'Place Control',
            [MODES.CONNECT_LINE]: 'Connect Line',
            [MODES.DRAW_CHANNEL]: 'Draw Channel'
        };
        return labels[mode] || 'Unknown';
    }

    /**
     * Get mode icon
     * @param {string} mode - Mode identifier
     * @returns {string}
     * @private
     */
    _getModeIcon(mode) {
        const icons = {
            [MODES.VIEW]: 'mdi:cursor-default',
            [MODES.PLACE_ANCHOR]: 'mdi:map-marker-plus',
            [MODES.PLACE_CONTROL]: 'mdi:widgets',
            [MODES.CONNECT_LINE]: 'mdi:vector-line',
            [MODES.DRAW_CHANNEL]: 'mdi:chart-timeline-variant'
        };
        return icons[mode] || 'mdi:help';
    }

    /**
     * Render mode toolbar
     * @returns {TemplateResult}
     * @private
     */
    _renderModeToolbar() {
        const modes = [
            MODES.VIEW,
            MODES.PLACE_ANCHOR,
            MODES.PLACE_CONTROL,
            MODES.CONNECT_LINE,
            MODES.DRAW_CHANNEL
        ];

        return html`
            <div class="mode-toolbar">
                ${modes.map(mode => html`
                    <div
                        class="mode-button ${this._activeMode === mode ? 'active' : ''}"
                        @click=${() => this._setMode(mode)}
                        title=${this._getModeLabel(mode)}>
                        <ha-icon icon=${this._getModeIcon(mode)}></ha-icon>
                        <span class="mode-button-label">${this._getModeLabel(mode)}</span>
                    </div>
                `)}
                <!-- Mode Status Badge -->
                <div class="mode-status">
                    <ha-icon icon=${this._getModeIcon(this._activeMode)}></ha-icon>
                    <span>Mode: ${this._getModeLabel(this._activeMode)}</span>
                </div>
            </div>
        `;
    }

    /**
     * Render tab navigation
     * @returns {TemplateResult}
     * @private
     */
    _renderTabNav() {
        const tabs = [
            { id: TABS.BASE_SVG, label: 'Base SVG', icon: 'mdi:image' },
            { id: TABS.ANCHORS, label: 'Anchors', icon: 'mdi:map-marker' },
            { id: TABS.CONTROLS, label: 'Controls', icon: 'mdi:widgets' },
            { id: TABS.LINES, label: 'Lines', icon: 'mdi:vector-line' },
            { id: TABS.CHANNELS, label: 'Channels', icon: 'mdi:chart-timeline-variant' },
            { id: TABS.DEBUG, label: 'Debug', icon: 'mdi:bug' }
        ];

        return html`
            <div class="tab-nav">
                ${tabs.map(tab => html`
                    <button
                        class="tab-button ${this._activeTab === tab.id ? 'active' : ''}"
                        @click=${() => this._setActiveTab(tab.id)}>
                        ${tab.label}
                    </button>
                `)}
            </div>
        `;
    }

    /**
     * Render tab content based on active tab
     * @returns {TemplateResult}
     * @private
     */
    _renderTabContent() {
        switch (this._activeTab) {
            case TABS.BASE_SVG:
                return this._renderBaseSvgTab();
            case TABS.ANCHORS:
                return this._renderAnchorsTab();
            case TABS.CONTROLS:
                return this._renderControlsTab();
            case TABS.LINES:
                return this._renderLinesTab();
            case TABS.CHANNELS:
                return this._renderChannelsTab();
            case TABS.DEBUG:
                return this._renderDebugTab();
            default:
                return html`<div>Unknown tab</div>`;
        }
    }

    /**
     * Render placeholder tab content
     * @param {string} title - Tab title
     * @param {string} description - Tab description
     * @param {string} phase - Implementation phase
     * @param {string} icon - Icon name
     * @returns {TemplateResult}
     * @private
     */
    _renderPlaceholder(title, description, phase, icon) {
        return html`
            <div class="placeholder-content">
                <ha-icon icon=${icon}></ha-icon>
                <h2 class="placeholder-title">${title}</h2>
                <p class="placeholder-description">
                    ${description}
                </p>
                <p class="placeholder-description" style="margin-top: 16px; font-weight: 600;">
                    Coming in ${phase}
                </p>
            </div>
        `;
    }

    // ============================
    // Base SVG Tab Helper Methods
    // ============================

    /**
     * Render SVG source helper text
     * @returns {TemplateResult}
     * @private
     */
    _renderSvgSourceHelper() {
        return html`
            <ha-alert alert-type="info">
                <strong>Builtin Templates:</strong><br>
                • builtin:ncc-1701-a (Enterprise-A)<br>
                • builtin:ncc-1701-a-blue (Enterprise-A Blue)<br>
                • builtin:ncc-1701-d (Enterprise-D)<br>
                <br>
                <strong>Custom SVG:</strong><br>
                • /local/my-ship.svg (from www/ folder)<br>
                • /hacsfiles/lcards/ships/custom.svg<br>
            </ha-alert>
        `;
    }

    /**
     * Render viewBox helper text
     * @returns {TemplateResult}
     * @private
     */
    _renderViewBoxHelper() {
        return html`
            <ha-alert alert-type="info">
                ViewBox defines the coordinate system for your MSD display.<br>
                <strong>Auto:</strong> Extract from SVG (recommended)<br>
                <strong>Custom:</strong> Define [minX, minY, width, height] manually
            </ha-alert>
        `;
    }

    /**
     * Render custom filters sliders
     * @returns {TemplateResult}
     * @private
     */
    _renderCustomFilters() {
        const filters = this._workingConfig.msd?.base_svg?.filters || {};

        return html`
            <div style="display: flex; flex-direction: column; gap: 12px; padding: 12px; background: var(--secondary-background-color); border-radius: 8px;">
                <ha-selector
                    .hass=${this.hass}
                    .selector=${{ number: { min: 0, max: 1, step: 0.1, mode: 'slider' } }}
                    .value=${filters.opacity ?? 1}
                    .label=${'Opacity'}
                    @value-changed=${(e) => this._setNestedValue('msd.base_svg.filters.opacity', e.detail.value)}>
                </ha-selector>

                <ha-textfield
                    type="text"
                    label="Blur (px)"
                    .value=${filters.blur || '0px'}
                    @input=${(e) => this._setNestedValue('msd.base_svg.filters.blur', e.target.value)}
                    helper-text="e.g., 0px, 2px, 5px">
                </ha-textfield>

                <ha-selector
                    .hass=${this.hass}
                    .selector=${{ number: { min: 0, max: 2, step: 0.1, mode: 'slider' } }}
                    .value=${filters.brightness ?? 1}
                    .label=${'Brightness'}
                    @value-changed=${(e) => this._setNestedValue('msd.base_svg.filters.brightness', e.detail.value)}>
                </ha-selector>

                <ha-selector
                    .hass=${this.hass}
                    .selector=${{ number: { min: 0, max: 2, step: 0.1, mode: 'slider' } }}
                    .value=${filters.contrast ?? 1}
                    .label=${'Contrast'}
                    @value-changed=${(e) => this._setNestedValue('msd.base_svg.filters.contrast', e.detail.value)}>
                </ha-selector>

                <ha-selector
                    .hass=${this.hass}
                    .selector=${{ number: { min: 0, max: 1, step: 0.1, mode: 'slider' } }}
                    .value=${filters.grayscale ?? 0}
                    .label=${'Grayscale'}
                    @value-changed=${(e) => this._setNestedValue('msd.base_svg.filters.grayscale', e.detail.value)}>
                </ha-selector>
            </div>
        `;
    }

    /**
     * Handle viewBox mode change
     * @param {string} mode - 'auto' or 'custom'
     * @private
     */
    _handleViewBoxModeChange(mode) {
        this._viewBoxMode = mode;
        if (mode === 'auto') {
            // Remove explicit view_box when switching to auto
            if (this._workingConfig.msd?.view_box) {
                delete this._workingConfig.msd.view_box;
                this._schedulePreviewUpdate();
            }
        } else {
            // Initialize view_box array if not present
            if (!this._workingConfig.msd.view_box) {
                this._setNestedValue('msd.view_box', [0, 0, 400, 200]);
            }
        }
        this.requestUpdate();
    }

    /**
     * Update viewBox value at specific index
     * @param {number} index - Index in viewBox array (0-3)
     * @param {string} value - New value
     * @private
     */
    _updateViewBoxValue(index, value) {
        const viewBox = [...(this._workingConfig.msd?.view_box || [0, 0, 400, 200])];
        viewBox[index] = parseFloat(value) || 0;
        this._setNestedValue('msd.view_box', viewBox);
    }

    /**
     * Disable custom filters
     * @private
     */
    _disableCustomFilters() {
        if (this._workingConfig.msd?.base_svg?.filters) {
            delete this._workingConfig.msd.base_svg.filters;
            this._schedulePreviewUpdate();
            this.requestUpdate();
        }
    }

    /**
     * Render Base SVG tab (Phase 2)
     * @returns {TemplateResult}
     * @private
     */
    _renderBaseSvgTab() {
        // Initialize base_svg structure if not present
        if (!this._workingConfig.msd) {
            this._workingConfig.msd = {};
        }
        if (!this._workingConfig.msd.base_svg) {
            this._workingConfig.msd.base_svg = { source: '' };
        }

        const baseSvg = this._workingConfig.msd.base_svg;
        const viewBox = this._workingConfig.msd.view_box || [];

        return html`
            <div style="padding: 8px;">
                <!-- SVG Source Section -->
                <lcards-form-section
                    header="SVG Source"
                    description="Configure the base SVG template for your MSD display"
                    ?expanded=${true}>
                    <div style="display: flex; flex-direction: column; gap: 12px;">
                        <ha-textfield
                            label="SVG Source"
                            .value=${baseSvg.source || ''}
                            @input=${(e) => this._setNestedValue('msd.base_svg.source', e.target.value)}
                            helper-text="Enter builtin template (e.g., builtin:ncc-1701-a) or custom path (e.g., /local/my-ship.svg)">
                        </ha-textfield>
                        ${this._renderSvgSourceHelper()}
                    </div>
                </lcards-form-section>

                <!-- ViewBox Section -->
                <lcards-form-section
                    header="ViewBox"
                    description="Configure the coordinate system for your MSD display"
                    ?expanded=${true}>
                    <div style="display: flex; flex-direction: column; gap: 12px;">
                        <ha-formfield label="Auto-detect from SVG">
                            <ha-radio
                                name="viewbox-mode"
                                value="auto"
                                ?checked=${this._viewBoxMode === 'auto'}
                                @change=${() => this._handleViewBoxModeChange('auto')}>
                            </ha-radio>
                        </ha-formfield>
                        <ha-formfield label="Custom viewBox">
                            <ha-radio
                                name="viewbox-mode"
                                value="custom"
                                ?checked=${this._viewBoxMode === 'custom'}
                                @change=${() => this._handleViewBoxModeChange('custom')}>
                            </ha-radio>
                        </ha-formfield>

                        ${this._viewBoxMode === 'custom' ? html`
                            <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; margin-top: 8px;">
                                <ha-textfield
                                    type="number"
                                    label="Min X"
                                    .value=${String(viewBox[0] || 0)}
                                    @input=${(e) => this._updateViewBoxValue(0, e.target.value)}>
                                </ha-textfield>
                                <ha-textfield
                                    type="number"
                                    label="Min Y"
                                    .value=${String(viewBox[1] || 0)}
                                    @input=${(e) => this._updateViewBoxValue(1, e.target.value)}>
                                </ha-textfield>
                                <ha-textfield
                                    type="number"
                                    label="Width"
                                    .value=${String(viewBox[2] || 400)}
                                    @input=${(e) => this._updateViewBoxValue(2, e.target.value)}>
                                </ha-textfield>
                                <ha-textfield
                                    type="number"
                                    label="Height"
                                    .value=${String(viewBox[3] || 200)}
                                    @input=${(e) => this._updateViewBoxValue(3, e.target.value)}>
                                </ha-textfield>
                            </div>
                        ` : ''}
                        ${this._renderViewBoxHelper()}
                    </div>
                </lcards-form-section>

                <!-- Filters Section -->
                <lcards-form-section
                    header="Filters"
                    description="Apply visual filters to the base SVG"
                    ?expanded=${true}>
                    <div style="display: flex; flex-direction: column; gap: 12px;">
                        <ha-selector
                            .hass=${this.hass}
                            .selector=${{
                                select: {
                                    options: [
                                        { value: '', label: 'None' },
                                        { value: 'dimmed', label: 'Dimmed' },
                                        { value: 'subtle', label: 'Subtle' },
                                        { value: 'backdrop', label: 'Backdrop' },
                                        { value: 'faded', label: 'Faded' },
                                        { value: 'red-alert', label: 'Red Alert' },
                                        { value: 'monochrome', label: 'Monochrome' }
                                    ]
                                }
                            }}
                            .value=${baseSvg.filter_preset || ''}
                            .label=${'Filter Preset'}
                            @value-changed=${(e) => {
                                this._setNestedValue('msd.base_svg.filter_preset', e.detail.value);
                                if (!e.detail.value) {
                                    // Clear preset when None selected
                                    this._setNestedValue('msd.base_svg.filter_preset', undefined);
                                }
                            }}>
                        </ha-selector>

                        <ha-formfield label="Enable Custom Filters">
                            <ha-switch
                                ?checked=${this._customFiltersEnabled}
                                @change=${(e) => {
                                    this._customFiltersEnabled = e.target.checked;
                                    if (!e.target.checked) {
                                        this._disableCustomFilters();
                                    }
                                }}>
                            </ha-switch>
                        </ha-formfield>

                        ${this._customFiltersEnabled ? this._renderCustomFilters() : ''}
                    </div>
                </lcards-form-section>
            </div>
        `;
    }

    /**
     * Render Anchors tab (Phase 2)
     * @returns {TemplateResult}
     * @private
     */
    _renderAnchorsTab() {
        // Initialize anchors structure if not present
        if (!this._workingConfig.msd) {
            this._workingConfig.msd = {};
        }
        if (!this._workingConfig.msd.anchors) {
            this._workingConfig.msd.anchors = {};
        }

        const anchors = this._workingConfig.msd.anchors;
        const anchorEntries = Object.entries(anchors);

        return html`
            <div style="padding: 8px;">
                <!-- Anchor Actions -->
                <div style="display: flex; gap: 12px; margin-bottom: 16px;">
                    <ha-button @click=${this._openAnchorForm} raised>
                        <ha-icon icon="mdi:map-marker-plus" slot="icon"></ha-icon>
                        Add Anchor
                    </ha-button>
                    <ha-button @click=${() => this._setMode(MODES.PLACE_ANCHOR)} 
                               ?disabled=${this._activeMode === MODES.PLACE_ANCHOR}>
                        <ha-icon icon="mdi:cursor-default-click" slot="icon"></ha-icon>
                        Place on Canvas
                    </ha-button>
                </div>

                <!-- Coordinate Helpers -->
                ${this._renderCoordinateHelpers()}

                <!-- Anchor List -->
                <lcards-form-section
                    header="Anchors"
                    description="Named reference points for positioning overlays"
                    ?expanded=${true}>
                    ${anchorEntries.length === 0 ? html`
                        <div style="text-align: center; padding: 24px; color: var(--secondary-text-color);">
                            <ha-icon icon="mdi:map-marker-off" style="--mdc-icon-size: 48px; opacity: 0.5;"></ha-icon>
                            <p>No anchors defined. Click "Add Anchor" or "Place on Canvas" to create one.</p>
                        </div>
                    ` : html`
                        <div style="display: flex; flex-direction: column; gap: 12px;">
                            ${anchorEntries.map(([name, position]) => this._renderAnchorItem(name, position))}
                        </div>
                    `}
                </lcards-form-section>

                <!-- Anchor Form Dialog -->
                ${this._showAnchorForm ? this._renderAnchorFormDialog() : ''}
            </div>
        `;
    }

    // ============================
    // Anchors Tab Helper Methods
    // ============================

    /**
     * Render coordinate helpers
     * @returns {TemplateResult}
     * @private
     */
    _renderCoordinateHelpers() {
        return html`
            <lcards-form-section
                header="Coordinate Helpers"
                description="Visual aids for precise anchor placement"
                ?expanded=${false}>
                <div style="display: flex; flex-direction: column; gap: 12px;">
                    <ha-formfield label="Show Grid Overlay">
                        <ha-switch
                            ?checked=${this._showGrid}
                            @change=${(e) => {
                                this._showGrid = e.target.checked;
                                this._updateDebugSetting('grid', e.target.checked);
                            }}>
                        </ha-switch>
                    </ha-formfield>

                    <ha-selector
                        .hass=${this.hass}
                        .selector=${{
                            select: {
                                options: [
                                    { value: 10, label: '10px' },
                                    { value: 20, label: '20px' },
                                    { value: 50, label: '50px' },
                                    { value: 100, label: '100px' }
                                ]
                            }
                        }}
                        .value=${this._gridSpacing}
                        .label=${'Grid Spacing'}
                        @value-changed=${(e) => {
                            this._gridSpacing = e.detail.value;
                            this._updateDebugSetting('gridSpacing', e.detail.value);
                        }}>
                    </ha-selector>

                    <ha-formfield label="Snap to Grid">
                        <ha-switch
                            ?checked=${this._snapToGrid}
                            @change=${(e) => this._snapToGrid = e.target.checked}>
                        </ha-switch>
                    </ha-formfield>
                </div>
            </lcards-form-section>
        `;
    }

    /**
     * Render individual anchor item
     * @param {string} name - Anchor name
     * @param {Array} position - Anchor position [x, y]
     * @returns {TemplateResult}
     * @private
     */
    _renderAnchorItem(name, position) {
        const [x, y] = Array.isArray(position) ? position : [0, 0];

        return html`
            <ha-card style="padding: 12px;">
                <div style="display: flex; align-items: center; gap: 12px;">
                    <ha-icon icon="mdi:map-marker" style="--mdc-icon-size: 32px; color: var(--primary-color);"></ha-icon>
                    <div style="flex: 1;">
                        <div style="font-weight: 600; margin-bottom: 4px;">${name}</div>
                        <div style="font-size: 12px; color: var(--secondary-text-color);">
                            Position: [${x}, ${y}]
                        </div>
                    </div>
                    <div style="display: flex; gap: 8px;">
                        <ha-icon-button
                            @click=${() => this._editAnchor(name)}
                            .label=${'Edit'}
                            .path=${'M20.71,7.04C21.1,6.65 21.1,6 20.71,5.63L18.37,3.29C18,2.9 17.35,2.9 16.96,3.29L15.12,5.12L18.87,8.87M3,17.25V21H6.75L17.81,9.93L14.06,6.18L3,17.25Z'}>
                        </ha-icon-button>
                        <ha-icon-button
                            @click=${() => this._highlightAnchorInPreview(name)}
                            .label=${'Highlight'}
                            .path=${'M12,2A7,7 0 0,1 19,9C19,11.38 17.19,13.47 14.39,17.31C13.57,18.45 12.61,19.74 12,20.65C11.39,19.74 10.43,18.45 9.61,17.31C6.81,13.47 5,11.38 5,9A7,7 0 0,1 12,2M12,6A3,3 0 0,0 9,9A3,3 0 0,0 12,12A3,3 0 0,0 15,9A3,3 0 0,0 12,6Z'}>
                        </ha-icon-button>
                        <ha-icon-button
                            @click=${() => this._deleteAnchor(name)}
                            .label=${'Delete'}
                            .path=${'M19,4H15.5L14.5,3H9.5L8.5,4H5V6H19M6,19A2,2 0 0,0 8,21H16A2,2 0 0,0 18,19V7H6V19Z'}>
                        </ha-icon-button>
                    </div>
                </div>
            </ha-card>
        `;
    }

    /**
     * Render anchor form dialog
     * @returns {TemplateResult}
     * @private
     */
    _renderAnchorFormDialog() {
        const isEditing = !!this._editingAnchorName;
        const title = isEditing ? `Edit Anchor: ${this._editingAnchorName}` : 'Add Anchor';

        return html`
            <ha-dialog
                open
                @closed=${this._closeAnchorForm}
                .heading=${title}>
                <div style="display: flex; flex-direction: column; gap: 12px; padding: 8px;">
                    <ha-textfield
                        label="Anchor Name"
                        .value=${this._anchorFormName}
                        ?disabled=${isEditing}
                        @input=${(e) => this._anchorFormName = e.target.value}
                        required
                        helper-text="Unique identifier for this anchor">
                    </ha-textfield>

                    <div style="display: grid; grid-template-columns: 1fr 1fr 100px; gap: 12px;">
                        <ha-textfield
                            type="number"
                            label="X Position"
                            .value=${String(this._anchorFormPosition[0] || 0)}
                            @input=${(e) => this._updateAnchorFormPosition(0, e.target.value)}>
                        </ha-textfield>
                        <ha-textfield
                            type="number"
                            label="Y Position"
                            .value=${String(this._anchorFormPosition[1] || 0)}
                            @input=${(e) => this._updateAnchorFormPosition(1, e.target.value)}>
                        </ha-textfield>
                        <ha-selector
                            .hass=${this.hass}
                            .selector=${{
                                select: {
                                    options: [
                                        { value: 'vb', label: 'vb' },
                                        { value: 'px', label: 'px' },
                                        { value: '%', label: '%' }
                                    ]
                                }
                            }}
                            .value=${this._anchorFormUnit}
                            .label=${'Unit'}
                            @value-changed=${(e) => this._anchorFormUnit = e.detail.value}>
                        </ha-selector>
                    </div>

                    <ha-alert alert-type="info">
                        <strong>Units:</strong><br>
                        • <strong>vb</strong>: ViewBox coordinates (default)<br>
                        • <strong>px</strong>: Pixel coordinates<br>
                        • <strong>%</strong>: Percentage of viewBox dimensions
                    </ha-alert>
                </div>

                <div slot="primaryAction">
                    <ha-button @click=${this._saveAnchor}>
                        <ha-icon icon="mdi:content-save" slot="icon"></ha-icon>
                        Save
                    </ha-button>
                </div>

                <div slot="secondaryAction">
                    <ha-button @click=${this._closeAnchorForm}>
                        <ha-icon icon="mdi:close" slot="icon"></ha-icon>
                        Cancel
                    </ha-button>
                </div>
            </ha-dialog>
        `;
    }

    /**
     * Open anchor form dialog
     * @private
     */
    _openAnchorForm() {
        this._showAnchorForm = true;
        this._editingAnchorName = null;
        this._anchorFormName = this._generateAnchorName();
        this._anchorFormPosition = [0, 0];
        this._anchorFormUnit = 'vb';
        this.requestUpdate();
    }

    /**
     * Edit existing anchor
     * @param {string} name - Anchor name to edit
     * @private
     */
    _editAnchor(name) {
        const position = this._workingConfig.msd?.anchors?.[name];
        if (!position) return;

        this._showAnchorForm = true;
        this._editingAnchorName = name;
        this._anchorFormName = name;
        this._anchorFormPosition = Array.isArray(position) ? [...position] : [0, 0];
        this._anchorFormUnit = 'vb';
        this.requestUpdate();
    }

    /**
     * Save anchor (create or update)
     * @private
     */
    _saveAnchor() {
        // Validate name
        if (!this._anchorFormName || this._anchorFormName.trim() === '') {
            alert('Anchor name is required');
            return;
        }

        // Check for duplicate names (only when creating new)
        if (!this._editingAnchorName) {
            const existingAnchors = this._workingConfig.msd?.anchors || {};
            if (existingAnchors[this._anchorFormName]) {
                alert(`Anchor name "${this._anchorFormName}" already exists`);
                return;
            }
        }

        // If editing and name changed, delete old entry
        if (this._editingAnchorName && this._editingAnchorName !== this._anchorFormName) {
            delete this._workingConfig.msd.anchors[this._editingAnchorName];
        }

        // Save anchor
        const path = `msd.anchors.${this._anchorFormName}`;
        this._setNestedValue(path, [...this._anchorFormPosition]);

        // Close dialog
        this._closeAnchorForm();
        lcardsLog.debug('[MSDStudio] Anchor saved:', this._anchorFormName, this._anchorFormPosition);
    }

    /**
     * Delete anchor
     * @param {string} name - Anchor name to delete
     * @private
     */
    async _deleteAnchor(name) {
        const confirmed = await this._showConfirmDialog(
            'Delete Anchor',
            `Are you sure you want to delete anchor "${name}"?`
        );
        
        if (!confirmed) {
            return;
        }

        if (this._workingConfig.msd?.anchors?.[name]) {
            delete this._workingConfig.msd.anchors[name];
            this._schedulePreviewUpdate();
            this.requestUpdate();
            lcardsLog.debug('[MSDStudio] Anchor deleted:', name);
        }
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

            // Cancel button
            const cancelButton = document.createElement('ha-button');
            cancelButton.textContent = 'Cancel';
            cancelButton.addEventListener('click', () => {
                dialog.close();
                resolve(false);
            });

            // Confirm button
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
     * Close anchor form dialog
     * @private
     */
    _closeAnchorForm() {
        this._showAnchorForm = false;
        this._editingAnchorName = null;
        this._anchorFormName = '';
        this._anchorFormPosition = [0, 0];
        this.requestUpdate();
    }

    /**
     * Highlight anchor in preview
     * @param {string} name - Anchor name
     * @private
     */
    _highlightAnchorInPreview(name) {
        // TODO: Implement highlight animation in preview
        lcardsLog.debug('[MSDStudio] Highlight anchor in preview:', name);
        // This would trigger a temporary highlight effect in the live preview
    }

    /**
     * Update anchor form position
     * @param {number} index - Position array index (0 or 1)
     * @param {string} value - New value
     * @private
     */
    _updateAnchorFormPosition(index, value) {
        this._anchorFormPosition = [...this._anchorFormPosition];
        this._anchorFormPosition[index] = parseFloat(value) || 0;
        this.requestUpdate();
    }

    /**
     * Generate unique anchor name
     * @returns {string}
     * @private
     */
    _generateAnchorName() {
        const anchors = this._workingConfig.msd?.anchors || {};
        let counter = 1;
        let name = `anchor_${counter}`;
        while (anchors[name]) {
            counter++;
            name = `anchor_${counter}`;
        }
        return name;
    }

    // ============================
    // Place Anchor Mode Methods
    // ============================

    /**
     * Handle preview click
     * @param {MouseEvent} event - Click event
     * @private
     */
    _handlePreviewClick(event) {
        // Only handle clicks in specific modes
        if (this._activeMode === MODES.PLACE_ANCHOR) {
            this._handlePlaceAnchorClick(event);
        } else if (this._activeMode === MODES.PLACE_CONTROL) {
            // Phase 3: Handle control placement
            lcardsLog.debug('[MSDStudio] Place Control mode - Phase 3');
        } else if (this._activeMode === MODES.CONNECT_LINE) {
            // Phase 4: Handle line connection
            lcardsLog.debug('[MSDStudio] Connect Line mode - Phase 4');
        }
    }

    /**
     * Handle place anchor click
     * @param {MouseEvent} event - Click event
     * @private
     */
    _handlePlaceAnchorClick(event) {
        // Get coordinates from click
        const coords = this._getPreviewCoordinates(event);
        if (!coords) {
            lcardsLog.warn('[MSDStudio] Could not get preview coordinates');
            return;
        }

        lcardsLog.debug('[MSDStudio] Place anchor at:', coords);

        // Coordinates are already snapped to grid if enabled in _getPreviewCoordinates
        const { x, y } = coords;

        // Open anchor form with pre-filled position
        this._showAnchorForm = true;
        this._editingAnchorName = null;
        this._anchorFormName = this._generateAnchorName();
        this._anchorFormPosition = [x, y];
        this._anchorFormUnit = 'vb';

        // Exit Place Anchor mode
        this._activeMode = MODES.VIEW;

        this.requestUpdate();
    }

    /**
     * Get preview coordinates from click event
     * Converts screen coordinates to ViewBox coordinates
     * @param {MouseEvent} event - Click event
     * @returns {Object|null} {x, y} in ViewBox coordinates, or null
     * @private
     */
    _getPreviewCoordinates(event) {
        // Find the preview panel and then the lcards-msd-live-preview component
        const previewPanel = event.currentTarget;
        const livePreview = previewPanel.querySelector('lcards-msd-live-preview');
        
        if (!livePreview) {
            lcardsLog.warn('[MSDStudio] No live preview component found');
            return null;
        }

        // Access the live preview's shadow root to find the card container
        const livePreviewShadow = livePreview.shadowRoot;
        if (!livePreviewShadow) {
            lcardsLog.warn('[MSDStudio] No shadow root on live preview');
            return null;
        }

        const cardContainer = livePreviewShadow.querySelector('.preview-card-container');
        if (!cardContainer) {
            lcardsLog.warn('[MSDStudio] No card container in live preview');
            return null;
        }

        // Find the MSD card element in the container
        const msdCard = cardContainer.querySelector('lcards-msd-card');
        if (!msdCard) {
            lcardsLog.warn('[MSDStudio] No MSD card in preview');
            return null;
        }

        // Access shadow root to find SVG element
        const shadowRoot = msdCard.shadowRoot || msdCard.renderRoot;
        if (!shadowRoot) {
            lcardsLog.warn('[MSDStudio] No shadow root on MSD card');
            return null;
        }

        const svg = shadowRoot.querySelector('svg');
        if (!svg) {
            lcardsLog.warn('[MSDStudio] No SVG found in preview');
            return null;
        }

        // Get bounding rect of SVG element
        const rect = svg.getBoundingClientRect();
        
        // Calculate click position relative to SVG
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;

        // Get viewBox from config
        const viewBox = this._workingConfig.msd?.view_box;
        let vbX = 0, vbY = 0, vbWidth = 1920, vbHeight = 1200;

        if (Array.isArray(viewBox) && viewBox.length === 4) {
            [vbX, vbY, vbWidth, vbHeight] = viewBox;
        } else if (viewBox === 'auto') {
            // Try to extract from SVG viewBox attribute
            const svgViewBox = svg.getAttribute('viewBox');
            if (svgViewBox) {
                const parts = svgViewBox.split(/\s+/).map(Number);
                if (parts.length === 4) {
                    [vbX, vbY, vbWidth, vbHeight] = parts;
                }
            }
        }

        // Calculate scale from screen pixels to viewBox units
        const scaleX = vbWidth / rect.width;
        const scaleY = vbHeight / rect.height;

        // Convert to viewBox coordinates
        let coordX = vbX + (x * scaleX);
        let coordY = vbY + (y * scaleY);

        // Apply snap-to-grid if enabled
        const debugSettings = this._getDebugSettings();
        if (debugSettings.snap_to_grid) {
            const gridSpacing = debugSettings.grid_spacing || 50;
            coordX = Math.round(coordX / gridSpacing) * gridSpacing;
            coordY = Math.round(coordY / gridSpacing) * gridSpacing;
        }

        lcardsLog.debug('[MSDStudio] Converted coordinates:', {
            screen: { x, y },
            viewBox: { x: coordX, y: coordY },
            scale: { x: scaleX, y: scaleY },
            rect: { width: rect.width, height: rect.height }
        });

        return { x: Math.round(coordX), y: Math.round(coordY) };
    }

    // ============================
    // Debug Settings Methods
    // ============================

    /**
     * Get debug settings (merges defaults with editor state)
     * @returns {Object}
     * @private
     */
    _getDebugSettings() {
        return {
            ...this._debugSettings,
            grid: this._showGrid,
            gridSpacing: this._gridSpacing
        };
    }

    /**
     * Update debug setting
     * @param {string} key - Setting key
     * @param {*} value - Setting value
     * @private
     */
    _updateDebugSetting(key, value) {
        this._debugSettings = {
            ...this._debugSettings,
            [key]: value
        };
        this._schedulePreviewUpdate();
        this.requestUpdate();
    }

    /**
     * Render Controls tab (Phase 3)
     * @returns {TemplateResult}
     * @private
     */
    _renderControlsTab() {
        const overlays = this._workingConfig.msd?.overlays || [];
        const controlOverlays = overlays.filter(o => o.type === 'control');
        const controlCount = controlOverlays.length;

        return html`
            <lcards-form-section
                header="Control Overlays"
                description="Manage card overlays positioned on the MSD canvas"
                icon="mdi:card-multiple"
                ?expanded=${true}>

                ${controlCount === 0 ? html`
                    <lcards-message type="info">
                        <strong>No control overlays defined yet.</strong>
                        <p style="margin: 8px 0; font-size: 13px;">
                            Control overlays are Home Assistant cards (buttons, sensors, etc.) 
                            positioned on your MSD display. Click "Add Control" to create your first overlay.
                        </p>
                    </lcards-message>
                ` : html`
                    <div class="control-list">
                        ${controlOverlays.map(overlay => this._renderControlItem(overlay))}
                    </div>
                `}

                <div style="display: flex; gap: 8px; margin-top: 12px;">
                    <ha-button @click=${this._openControlForm}>
                        <ha-icon icon="mdi:plus" slot="icon"></ha-icon>
                        Add Control
                    </ha-button>
                    <ha-button @click=${() => this._setMode('place_control')}>
                        <ha-icon icon="mdi:cursor-default-click" slot="icon"></ha-icon>
                        Place on Canvas
                    </ha-button>
                </div>
            </lcards-form-section>

            ${this._renderControlHelp()}
        `;
    }

    /**
     * Render control item in list
     * @param {Object} overlay - Control overlay config
     * @returns {TemplateResult}
     * @private
     */
    _renderControlItem(overlay) {
        const cardType = overlay.card?.type || 'unknown';
        const position = overlay.position || overlay.anchor || 'not set';
        const positionStr = Array.isArray(position) ? `[${position[0]}, ${position[1]}]` : position;

        return html`
            <div class="control-item" style="
                display: flex;
                align-items: center;
                gap: 12px;
                padding: 12px;
                border: 1px solid var(--divider-color);
                border-radius: 4px;
                margin-bottom: 8px;
            ">
                <ha-icon icon="mdi:card" style="color: var(--primary-color);"></ha-icon>
                <div style="flex: 1;">
                    <div style="font-weight: 600;">${overlay.id || 'Unnamed'}</div>
                    <div style="font-size: 12px; color: var(--secondary-text-color);">
                        ${cardType} @ ${positionStr}
                    </div>
                </div>
                <div style="display: flex; gap: 4px;">
                    <ha-icon-button
                        icon="mdi:pencil"
                        @click=${() => this._editControl(overlay)}
                        title="Edit control">
                    </ha-icon-button>
                    <ha-icon-button
                        icon="mdi:content-duplicate"
                        @click=${() => this._duplicateControl(overlay)}
                        title="Duplicate control">
                    </ha-icon-button>
                    <ha-icon-button
                        icon="mdi:delete"
                        @click=${() => this._deleteControl(overlay)}
                        title="Delete control">
                    </ha-icon-button>
                </div>
            </div>
        `;
    }

    /**
     * Render control help section
     * @returns {TemplateResult}
     * @private
     */
    _renderControlHelp() {
        return html`
            <lcards-message type="info" style="margin-top: 16px;">
                <strong>About Control Overlays:</strong>
                <ul style="margin: 8px 0; padding-left: 20px; font-size: 13px;">
                    <li>Control overlays are Home Assistant cards positioned on your MSD</li>
                    <li>Use any HA card type: button, sensor, gauge, custom cards, etc.</li>
                    <li>Position using anchors or absolute coordinates</li>
                    <li>Configure size, card properties, and visual styling</li>
                </ul>
            </lcards-message>
        `;
    }

    // Placeholder methods for Phase 3 full implementation
    /**
     * Open control form dialog (Phase 3 full)
     * @private
     */
    _openControlForm() {
        alert('Control form dialog will be implemented in Phase 3 full version');
    }

    /**
     * Edit control overlay (Phase 3 full)
     * @param {Object} overlay - Control overlay config
     * @private
     */
    _editControl(overlay) {
        lcardsLog.debug('[MSDStudio] Edit control:', overlay);
        alert('Control editor will be implemented in Phase 3 full version');
    }

    /**
     * Duplicate control overlay (Phase 3 full)
     * @param {Object} overlay - Control overlay config
     * @private
     */
    _duplicateControl(overlay) {
        lcardsLog.debug('[MSDStudio] Duplicate control:', overlay);
        alert('Control duplication will be implemented in Phase 3 full version');
    }

    /**
     * Delete control overlay (Phase 3 full)
     * @param {Object} overlay - Control overlay config
     * @private
     */
    _deleteControl(overlay) {
        lcardsLog.debug('[MSDStudio] Delete control:', overlay);
        alert('Control deletion will be implemented in Phase 3 full version');
    }

    /**
     * Render Lines tab (Phase 4)
     * @returns {TemplateResult}
     * @private
     */
    _renderLinesTab() {
        return this._renderPlaceholder(
            'Line Overlays',
            'Connect controls and anchors with lines. Configure routing modes (Manhattan, smart, bezier), line styles, and animations. Use the Connect Line mode to visually connect elements.',
            'Phase 4',
            'mdi:vector-line'
        );
    }

    /**
     * Render Channels tab (Phase 5)
     * @returns {TemplateResult}
     * @private
     */
    _renderChannelsTab() {
        return this._renderPlaceholder(
            'Routing Channels',
            'Define routing channels to control line behavior. Create bundling channels to group lines, avoiding channels to keep lines out of specific areas, or waypoint channels to guide line routing.',
            'Phase 5',
            'mdi:chart-timeline-variant'
        );
    }

    /**
     * Render Debug tab (Phase 6)
     * @returns {TemplateResult}
     * @private
     */
    _renderDebugTab() {
        return this._renderPlaceholder(
            'Debug Visualization',
            'Control debug overlays in the preview panel. Toggle anchor markers, bounding boxes, attachment points, routing channels, and line paths to better understand your MSD configuration.',
            'Phase 6',
            'mdi:bug'
        );
    }

    /**
     * Render component
     */
    render() {
        return html`
            <ha-dialog
                open
                @closed=${this._handleClose}
                .heading=${'MSD Configuration Studio'}>

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
                    <!-- Mode Toolbar -->
                    ${this._renderModeToolbar()}

                    <!-- Split Panel Layout -->
                    <div class="studio-layout">
                        <!-- Configuration Panel (60%) -->
                        <div class="config-panel">
                            ${this._renderTabNav()}
                            <div class="tab-content">
                                ${this._renderTabContent()}
                            </div>
                        </div>

                        <!-- Preview Panel (40%) -->
                        <div class="preview-panel" @click=${this._handlePreviewClick}>
                            <lcards-msd-live-preview
                                .hass=${this.hass}
                                .config=${this._workingConfig}
                                .debugSettings=${this._getDebugSettings()}
                                .showRefreshButton=${true}>
                            </lcards-msd-live-preview>
                        </div>
                    </div>
                </div>
            </ha-dialog>
        `;
    }
}

// Register the custom element
customElements.define('lcards-msd-studio-dialog', LCARdSMSDStudioDialog);
