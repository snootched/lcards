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
            _snapToGrid: { type: Boolean, state: true },
            // Controls Tab Properties
            _showControlForm: { type: Boolean, state: true },
            _editingControlId: { type: String, state: true },
            _controlFormId: { type: String, state: true },
            _controlFormPosition: { type: Array, state: true },
            _controlFormSize: { type: Array, state: true },
            _controlFormAttachment: { type: String, state: true },
            _controlFormCard: { type: Object, state: true },
            _controlFormActiveSubtab: { type: String, state: true }, // 'msd_config' or 'card_config'
            // Lines Tab Properties (Phase 4 - Fixed to use correct schema)
            _showLineForm: { type: Boolean, state: true },
            _editingLineId: { type: String, state: true },
            _lineFormData: { type: Object, state: true }, // Complete line form data with correct schema
            _lineFormActiveSubtab: { type: String, state: true }, // 'connection' or 'style'
            _connectLineState: { type: Object, state: true }, // { source: null, tempLineElement: null }
            // Channels Tab Properties (Phase 5)
            _editingChannelId: { type: String, state: true },
            _channelFormData: { type: Object, state: true }
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
            // Debug toggles
            anchors: true,
            bounding_boxes: true,
            attachment_points: false,
            routing_channels: false,
            line_paths: true,
            grid: false,
            show_coordinates: false,
            // Grid settings
            grid_color: '#cccccc',
            grid_opacity: 0.3,
            // Scale settings
            debug_scale: 1.0,
            // Preview settings
            auto_refresh: true,
            interactive_preview: false,
            // Visualization colors
            anchor_color: '#00FFFF',
            bbox_color: '#FFA500',
            attachment_color: '#00FF00',
            bundling_color: '#00FF00',
            avoiding_color: '#FF0000',
            waypoint_color: '#0000FF'
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

        // Controls Tab State
        this._showControlForm = false;
        this._editingControlId = null;
        this._controlFormId = '';
        this._controlFormPosition = [0, 0];
        this._controlFormSize = [100, 100];
        this._controlFormAttachment = 'center';
        this._controlFormCard = { type: '' };
        this._controlFormActiveSubtab = 'msd_config';

        // Lines Tab State (Phase 4)
        this._showLineForm = false;
        this._editingLineId = null;
        this._lineFormData = {
            id: '',
            anchor: '',              // Source: anchor name, overlay ID, or [x,y]
            attach_to: '',           // Target: same as anchor
            anchor_side: 'center',   // Source attachment point (for overlays)
            attach_side: 'center',   // Target attachment point (for overlays)
            anchor_gap: 0,           // Source gap (pixels)
            attach_gap: 0,           // Target gap (pixels)
            route: 'auto',           // Routing mode string
            style: {                 // Style object
                color: 'var(--lcars-orange)',
                width: 2,
                dash_array: '',      // e.g., "5,5" for dashed
                marker_end: null     // Optional marker config
            }
        };
        this._lineFormActiveSubtab = 'connection';
        this._connectLineState = { source: null, tempLineElement: null };
        
        // Channels Tab State (Phase 5)
        this._editingChannelId = null;
        this._channelFormData = {
            id: '',
            type: 'bundling',
            bounds: [0, 0, 100, 50],
            priority: 10,
            color: '#00FF00'
        };
        this._drawChannelState = {
            startPoint: null,
            currentPoint: null,
            drawing: false,
            tempRectElement: null
        };

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

        // Add keyboard event listener (Phase 7)
        this._boundKeyDownHandler = this._handleKeyDown.bind(this);
        document.addEventListener('keydown', this._boundKeyDownHandler);

        lcardsLog.debug('[MSDStudio] Opened with config:', this._workingConfig);

        // Schedule initial preview update
        this.updateComplete.then(() => this._schedulePreviewUpdate());
    }

    disconnectedCallback() {
        super.disconnectedCallback();
        if (this._previewUpdateTimer) {
            clearTimeout(this._previewUpdateTimer);
        }
        // Remove keyboard event listener (Phase 7)
        if (this._boundKeyDownHandler) {
            document.removeEventListener('keydown', this._boundKeyDownHandler);
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

            /* Cursor feedback based on mode */
            .preview-panel.mode-view {
                cursor: default;
            }

            .preview-panel.mode-place_anchor,
            .preview-panel.mode-place_control {
                cursor: crosshair;
            }

            .preview-panel.mode-connect_line {
                cursor: crosshair;
            }

            .preview-panel.mode-draw_channel {
                cursor: crosshair;
            }

            .preview-panel.mode-draw_channel.drawing {
                cursor: crosshair;
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
     * Handle save button click (Phase 7 enhanced with validation)
     * @private
     */
    _handleSave() {
        // Run validation
        this._validationErrors = this._validateConfiguration();
        
        if (this._validationErrors.length > 0) {
            this.requestUpdate();
            this._showValidationErrors();
            return;
        }

        lcardsLog.debug('[MSDStudio] Saving config:', this._workingConfig);

        // Dispatch config-changed event
        this.dispatchEvent(new CustomEvent('config-changed', {
            detail: { config: this._workingConfig },
            bubbles: true,
            composed: true
        }));

        this._showSuccessToast('Configuration saved successfully!');
        // Close dialog
        this._handleClose();
    }

    /**
     * Handle cancel button click (Phase 7 enhanced with confirmation)
     * @private
     */
    _handleCancel() {
        if (this._configHasChanges() && !this._confirmAction('Discard unsaved changes?')) {
            return;
        }
        lcardsLog.debug('[MSDStudio] Cancelled');
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
     * Handle reset button click (Phase 7 enhanced with confirmation)
     * @private
     */
    _handleReset() {
        if (!this._confirmAction('Reset to initial configuration? All changes will be lost.')) {
            return;
        }
        lcardsLog.debug('[MSDStudio] Resetting to initial config');
        this._workingConfig = JSON.parse(JSON.stringify(this._initialConfig));
        this._validationErrors = [];
        this._showSuccessToast('Configuration reset to initial state');
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
     * Get mode tooltip (Phase 7)
     * @param {string} mode - Mode constant
     * @returns {string}
     * @private
     */
    _getModeTooltip(mode) {
        const tooltips = {
            [MODES.VIEW]: 'Default mode - navigate and select items',
            [MODES.PLACE_ANCHOR]: 'Click on preview to place named anchors (Tab: Anchors)',
            [MODES.PLACE_CONTROL]: 'Click on preview to place control overlays (Tab: Controls)',
            [MODES.CONNECT_LINE]: 'Click source → target to create line connections (Tab: Lines)',
            [MODES.DRAW_CHANNEL]: 'Click and drag to draw routing channel rectangles (Tab: Channels)'
        };
        return tooltips[mode] || '';
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
                        title="${this._getModeTooltip(mode)}">
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
            this._handlePlaceControlClick(event);
        } else if (this._activeMode === MODES.CONNECT_LINE) {
            this._handleConnectLineClick(event);
        } else if (this._activeMode === MODES.DRAW_CHANNEL) {
            this._handleDrawChannelClick(event);
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
     * Handle place control click (Phase 3)
     * @param {MouseEvent} event - Click event
     * @private
     */
    _handlePlaceControlClick(event) {
        // Get coordinates from click
        const coords = this._getPreviewCoordinates(event);
        if (!coords) {
            lcardsLog.warn('[MSDStudio] Could not get preview coordinates');
            return;
        }

        lcardsLog.debug('[MSDStudio] Place control at:', coords);

        // Generate control ID
        const overlays = this._workingConfig.msd?.overlays || [];
        let controlNum = overlays.filter(o => o.type === 'control').length + 1;
        let controlId = `control_${controlNum}`;
        while (overlays.find(o => o.id === controlId)) {
            controlNum++;
            controlId = `control_${controlNum}`;
        }

        // Open control form with pre-filled position
        this._editingControlId = controlId;
        this._controlFormId = controlId;
        this._controlFormPosition = [coords.x, coords.y];
        this._controlFormSize = [100, 100];
        this._controlFormAttachment = 'center';
        this._controlFormCard = { type: '' };
        this._controlFormActiveSubtab = 'msd_config';
        this._showControlForm = true;

        // Exit Place Control mode
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

    /**
     * Handle draw channel click (Phase 5)
     * @param {MouseEvent} event - Click event
     * @private
     */
    _handleDrawChannelClick(event) {
        const coords = this._getPreviewCoordinates(event);
        if (!coords) {
            lcardsLog.warn('[MSDStudio] Could not get preview coordinates');
            return;
        }

        if (!this._drawChannelState.startPoint) {
            // First click: start drawing
            this._drawChannelState.startPoint = [coords.x, coords.y];
            this._drawChannelState.drawing = true;
            lcardsLog.debug('[MSDStudio] Draw channel started at:', coords);
        } else {
            // Second click: finish drawing
            const startX = this._drawChannelState.startPoint[0];
            const startY = this._drawChannelState.startPoint[1];
            const endX = coords.x;
            const endY = coords.y;

            // Calculate bounds [x, y, width, height]
            const x = Math.min(startX, endX);
            const y = Math.min(startY, endY);
            const width = Math.abs(endX - startX);
            const height = Math.abs(endY - startY);

            lcardsLog.debug('[MSDStudio] Draw channel finished:', { x, y, width, height });

            // Reset draw state
            this._drawChannelState.startPoint = null;
            this._drawChannelState.drawing = false;

            // Open channel form with pre-filled bounds
            this._editingChannelId = '';
            this._channelFormData = {
                id: this._generateChannelId(),
                type: 'bundling',
                bounds: [x, y, width, height],
                priority: 10,
                color: '#00FF00'
            };

            // Exit draw mode
            this._activeMode = MODES.VIEW;
            this.requestUpdate();
        }
    }

    /**
     * Handle preview mouse move (for draw channel visual feedback)
     * @param {MouseEvent} event - Mouse move event
     * @private
     */
    _handlePreviewMouseMove(event) {
        // Only track mouse in draw channel mode while drawing
        if (this._activeMode === MODES.DRAW_CHANNEL && this._drawChannelState.drawing) {
            const coords = this._getPreviewCoordinates(event);
            if (coords) {
                this._drawChannelState.currentPoint = [coords.x, coords.y];
                this.requestUpdate();
            }
        }
    }

    /**
     * Handle preview mouse leave (cancel draw if in progress)
     * @private
     */
    _handlePreviewMouseLeave() {
        // Optional: could cancel draw on mouse leave
        // For now, just clear current point
        if (this._drawChannelState.drawing) {
            this._drawChannelState.currentPoint = null;
            this.requestUpdate();
        }
    }

    /**
     * Render draw channel overlay (Phase 5)
     * Shows temporary rectangle while drawing
     * @returns {TemplateResult}
     * @private
     */
    _renderDrawChannelOverlay() {
        if (this._activeMode !== MODES.DRAW_CHANNEL || !this._drawChannelState.drawing || !this._drawChannelState.currentPoint) {
            return '';
        }

        const [startX, startY] = this._drawChannelState.startPoint;
        const [currentX, currentY] = this._drawChannelState.currentPoint;

        // Calculate rectangle bounds
        const x = Math.min(startX, currentX);
        const y = Math.min(startY, currentY);
        const width = Math.abs(currentX - startX);
        const height = Math.abs(currentY - startY);

        return html`
            <div style="
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                pointer-events: none;
                z-index: 1000;
            ">
                <svg style="width: 100%; height: 100%; position: absolute;">
                    <rect
                        x="${x}px"
                        y="${y}px"
                        width="${width}px"
                        height="${height}px"
                        fill="rgba(0, 255, 0, 0.2)"
                        stroke="#00FF00"
                        stroke-width="2"
                        stroke-dasharray="5,5" />
                </svg>
            </div>
        `;
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
        const settings = {
            ...this._debugSettings,
            grid: this._showGrid,
            gridSpacing: this._gridSpacing,
            grid_spacing: this._gridSpacing,  // Also pass with underscore for consistency
            routing_channels: true  // Always show channels in editor
        };

        // Force bounding boxes when Controls tab is active (Phase 3)
        if (this._activeTab === TABS.CONTROLS) {
            settings.bounding_boxes = true;
        }

        return settings;
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
     * Render Controls tab (Phase 3 placeholder)
     * @returns {TemplateResult}
     * @private
     */
    _renderControlsTab() {
        const controls = this._getControlOverlays();
        const controlCount = controls.length;

        return html`
            <!-- Controls Management -->
            <lcards-form-section
                header="Control Overlays"
                description="HA cards positioned on the MSD canvas"
                icon="mdi:card-multiple"
                ?expanded=${true}>

                ${controlCount === 0 ? html`
                    <lcards-message type="info">
                        <strong>No control overlays defined yet.</strong>
                        <p style="margin: 8px 0; font-size: 13px;">
                            Control overlays are Home Assistant cards positioned on your MSD canvas.
                            Click "Add Control" to place your first control.
                        </p>
                    </lcards-message>
                ` : html`
                    <div class="control-list">
                        ${controls.map(control => this._renderControlItem(control))}
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
     * Get control overlays from config
     * @returns {Array}
     * @private
     */
    _getControlOverlays() {
        const overlays = this._workingConfig.msd?.overlays || [];
        return overlays.filter(o => o.type === 'control');
    }

    /**
     * Render single control item (placeholder)
     * @param {Object} control - Control overlay config
     * @returns {TemplateResult}
     * @private
     */
    _renderControlItem(control) {
        const id = control.id || 'unnamed';
        const cardType = control.card?.type || 'unknown';
        const position = control.position || control.anchor || 'not set';
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
                <ha-icon icon="mdi:card-outline" style="color: var(--primary-color);"></ha-icon>
                <div style="flex: 1;">
                    <div style="font-weight: 600;">${id}</div>
                    <div style="font-size: 12px; color: var(--secondary-text-color); font-family: monospace;">
                        ${cardType} @ ${positionStr}
                    </div>
                </div>
                <div style="display: flex; gap: 4px;">
                    <ha-icon-button
                        icon="mdi:pencil"
                        @click=${() => this._editControl(control)}
                        title="Edit control">
                    </ha-icon-button>
                    <ha-icon-button
                        icon="mdi:eye"
                        @click=${() => this._highlightControlInPreview(control)}
                        title="Highlight in preview">
                    </ha-icon-button>
                    <ha-icon-button
                        icon="mdi:delete"
                        @click=${() => this._deleteControl(control)}
                        title="Delete control">
                    </ha-icon-button>
                </div>
            </div>
        `;
    }

    /**
     * Render control help documentation
     * @returns {TemplateResult}
     * @private
     */
    _renderControlHelp() {
        return html`
            <lcards-message type="info" style="margin-top: 16px;">
                <strong>About Control Overlays:</strong>
                <ul style="margin: 8px 0; padding-left: 20px; font-size: 13px;">
                    <li>Control overlays are HA cards (buttons, entities, custom cards) positioned on your MSD</li>
                    <li>Use anchors or coordinates to position controls</li>
                    <li>Controls can be connected with lines for visual flow</li>
                    <li>Example: Button card at anchor "warp_drive" showing power status</li>
                </ul>
            </lcards-message>
        `;
    }

    // ============================
    // Controls Tab Methods
    // ============================

    /**
     * Open control form for creating new control
     * @private
     */
    _openControlForm() {
        // Generate new control ID
        const overlays = this._workingConfig.msd?.overlays || [];
        let controlNum = overlays.filter(o => o.type === 'control').length + 1;
        let controlId = `control_${controlNum}`;
        while (overlays.find(o => o.id === controlId)) {
            controlNum++;
            controlId = `control_${controlNum}`;
        }

        this._editingControlId = controlId;
        this._controlFormId = controlId;
        this._controlFormPosition = [0, 0];
        this._controlFormSize = [100, 100];
        this._controlFormAttachment = 'center';
        this._controlFormCard = { type: '' };
        this._controlFormActiveSubtab = 'msd_config';
        this._showControlForm = true;

        this.requestUpdate();
    }

    /**
     * Edit existing control
     * @param {Object} control - Control to edit
     * @private
     */
    _editControl(control) {
        this._editingControlId = control.id;
        this._controlFormId = control.id;
        this._controlFormPosition = control.position || control.anchor || [0, 0];
        this._controlFormSize = control.size || [100, 100];
        this._controlFormAttachment = control.attachment || 'center';
        this._controlFormCard = control.card || { type: '' };
        this._controlFormActiveSubtab = 'msd_config';
        this._showControlForm = true;

        this.requestUpdate();
    }

    /**
     * Highlight control in preview (Phase 3)
     * @param {Object} control - Control to highlight
     * @private
     */
    _highlightControlInPreview(control) {
        // Update debug settings to highlight this control
        this._debugSettings = {
            ...this._debugSettings,
            bounding_boxes: true,
            highlighted_control: control.id
        };
        
        this._schedulePreviewUpdate();
        
        // Remove highlight after 2 seconds
        setTimeout(() => {
            const { highlighted_control, ...settings } = this._debugSettings;
            this._debugSettings = settings;
            this._schedulePreviewUpdate();
        }, 2000);
    }

    /**
     * Delete control (Phase 3)
     * @param {Object} control - Control to delete
     * @private
     */
    async _deleteControl(control) {
        const confirmed = await this._showConfirmDialog(
            'Delete Control',
            `Delete control "${control.id}"? This will remove the overlay and its configuration.`
        );
        if (!confirmed) return;

        const overlays = [...(this._workingConfig.msd?.overlays || [])];
        const index = overlays.findIndex(o => o.id === control.id);
        if (index > -1) {
            overlays.splice(index, 1);
            this._setNestedValue('msd.overlays', overlays);
        }
    }

    /**
     * Save control form
     * @private
     */
    _saveControl() {
        const overlays = [...(this._workingConfig.msd?.overlays || [])];
        
        const controlOverlay = {
            type: 'control',
            id: this._controlFormId,
            position: this._controlFormPosition,
            size: this._controlFormSize,
            attachment: this._controlFormAttachment,
            card: this._controlFormCard
        };
        
        // Add or update
        const existingIndex = overlays.findIndex(o => o.id === this._controlFormId);
        if (existingIndex >= 0) {
            overlays[existingIndex] = controlOverlay;
        } else {
            overlays.push(controlOverlay);
        }
        
        this._setNestedValue('msd.overlays', overlays);
        this._closeControlForm();
    }

    /**
     * Close control form
     * @private
     */
    _closeControlForm() {
        this._showControlForm = false;
        this._editingControlId = null;
        this.requestUpdate();
    }

    /**
     * Generate unique control ID
     * @returns {string}
     * @private
     */
    _generateControlId() {
        const overlays = this._workingConfig.msd?.overlays || [];
        let controlNum = overlays.filter(o => o.type === 'control').length + 1;
        let controlId = `control_${controlNum}`;
        while (overlays.find(o => o.id === controlId)) {
            controlNum++;
            controlId = `control_${controlNum}`;
        }
        return controlId;
    }

    /**
     * Render control form dialog (Phase 3)
     * @returns {TemplateResult}
     * @private
     */
    _renderControlFormDialog() {
        const isEditing = !!this._editingControlId && 
                         (this._workingConfig.msd?.overlays || []).some(o => o.id === this._editingControlId);
        const title = isEditing ? `Edit Control: ${this._controlFormId}` : 'Add Control';

        return html`
            <ha-dialog
                open
                @closed=${this._closeControlForm}
                .heading=${title}>
                
                <!-- Subtabs -->
                <div style="display: flex; gap: 8px; padding: 0 24px; border-bottom: 1px solid var(--divider-color);">
                    <button
                        class="tab-button ${this._controlFormActiveSubtab === 'msd_config' ? 'active' : ''}"
                        @click=${() => { this._controlFormActiveSubtab = 'msd_config'; this.requestUpdate(); }}
                        style="padding: 12px 16px; background: transparent; border: none; border-bottom: 3px solid ${this._controlFormActiveSubtab === 'msd_config' ? 'var(--primary-color)' : 'transparent'}; cursor: pointer; font-weight: 500;">
                        MSD Config
                    </button>
                    <button
                        class="tab-button ${this._controlFormActiveSubtab === 'card_config' ? 'active' : ''}"
                        @click=${() => { this._controlFormActiveSubtab = 'card_config'; this.requestUpdate(); }}
                        style="padding: 12px 16px; background: transparent; border: none; border-bottom: 3px solid ${this._controlFormActiveSubtab === 'card_config' ? 'var(--primary-color)' : 'transparent'}; cursor: pointer; font-weight: 500;">
                        Card Config
                    </button>
                </div>

                <!-- Subtab Content -->
                <div style="padding: 16px; max-height: 60vh; overflow-y: auto;">
                    ${this._controlFormActiveSubtab === 'msd_config' 
                        ? this._renderControlFormMSDConfig() 
                        : this._renderControlFormCardConfig()
                    }
                </div>

                <div slot="primaryAction">
                    <ha-button @click=${this._saveControl}>
                        <ha-icon icon="mdi:content-save" slot="icon"></ha-icon>
                        Save
                    </ha-button>
                </div>

                <div slot="secondaryAction">
                    <ha-button @click=${this._closeControlForm}>
                        <ha-icon icon="mdi:close" slot="icon"></ha-icon>
                        Cancel
                    </ha-button>
                </div>
            </ha-dialog>
        `;
    }

    /**
     * Render MSD Config subtab (Phase 3)
     * @returns {TemplateResult}
     * @private
     */
    _renderControlFormMSDConfig() {
        const anchors = this._workingConfig.msd?.anchors || {};
        const anchorOptions = [
            { value: '', label: 'Use Coordinates' },
            ...Object.keys(anchors).map(name => ({ value: name, label: name }))
        ];

        const useAnchor = typeof this._controlFormPosition === 'string';
        const selectedAnchor = useAnchor ? this._controlFormPosition : '';

        return html`
            <div style="display: flex; flex-direction: column; gap: 16px;">
                <ha-textfield
                    label="Control ID"
                    .value=${this._controlFormId}
                    ?disabled=${!!this._editingControlId}
                    @input=${(e) => this._controlFormId = e.target.value}
                    required
                    helper-text="Unique identifier for this control">
                </ha-textfield>

                <lcards-form-section
                    header="Position"
                    description="Set control position using anchor or coordinates"
                    ?expanded=${true}>
                    
                    <ha-selector
                        .hass=${this.hass}
                        .selector=${{
                            select: {
                                options: anchorOptions
                            }
                        }}
                        .value=${selectedAnchor}
                        .label=${'Anchor (or use coordinates)'}
                        @value-changed=${(e) => {
                            if (e.detail.value) {
                                this._controlFormPosition = e.detail.value;
                            } else {
                                this._controlFormPosition = [0, 0];
                            }
                            this.requestUpdate();
                        }}>
                    </ha-selector>

                    ${!useAnchor ? html`
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-top: 12px;">
                            <ha-textfield
                                type="number"
                                label="X Position"
                                .value=${String(this._controlFormPosition[0] || 0)}
                                @input=${(e) => {
                                    this._controlFormPosition = [Number(e.target.value), this._controlFormPosition[1]];
                                    this.requestUpdate();
                                }}>
                            </ha-textfield>
                            <ha-textfield
                                type="number"
                                label="Y Position"
                                .value=${String(this._controlFormPosition[1] || 0)}
                                @input=${(e) => {
                                    this._controlFormPosition = [this._controlFormPosition[0], Number(e.target.value)];
                                    this.requestUpdate();
                                }}>
                            </ha-textfield>
                        </div>
                    ` : ''}
                </lcards-form-section>

                <lcards-form-section
                    header="Size"
                    description="Control dimensions in pixels"
                    ?expanded=${true}>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
                        <ha-textfield
                            type="number"
                            label="Width"
                            .value=${String(this._controlFormSize[0] || 100)}
                            @input=${(e) => {
                                this._controlFormSize = [Number(e.target.value), this._controlFormSize[1]];
                                this.requestUpdate();
                            }}>
                        </ha-textfield>
                        <ha-textfield
                            type="number"
                            label="Height"
                            .value=${String(this._controlFormSize[1] || 100)}
                            @input=${(e) => {
                                this._controlFormSize = [this._controlFormSize[0], Number(e.target.value)];
                                this.requestUpdate();
                            }}>
                        </ha-textfield>
                    </div>
                </lcards-form-section>

                <lcards-form-section
                    header="Attachment Point"
                    description="How control aligns to position"
                    ?expanded=${false}>
                    <ha-selector
                        .hass=${this.hass}
                        .selector=${{
                            select: {
                                options: [
                                    { value: 'top-left', label: 'Top Left' },
                                    { value: 'top', label: 'Top Center' },
                                    { value: 'top-right', label: 'Top Right' },
                                    { value: 'left', label: 'Middle Left' },
                                    { value: 'center', label: 'Center' },
                                    { value: 'right', label: 'Middle Right' },
                                    { value: 'bottom-left', label: 'Bottom Left' },
                                    { value: 'bottom', label: 'Bottom Center' },
                                    { value: 'bottom-right', label: 'Bottom Right' }
                                ]
                            }
                        }}
                        .value=${this._controlFormAttachment}
                        .label=${'Attachment'}
                        @value-changed=${(e) => this._controlFormAttachment = e.detail.value}>
                    </ha-selector>
                </lcards-form-section>
            </div>
        `;
    }

    /**
     * Render Card Config subtab (Phase 3)
     * @returns {TemplateResult}
     * @private
     */
    _renderControlFormCardConfig() {
        const cardType = this._controlFormCard?.type || '';
        
        return html`
            <div style="display: flex; flex-direction: column; gap: 16px;">
                <!-- Card Type Picker -->
                <lcards-form-section
                    header="Card Type"
                    description="Select the type of Home Assistant card to display"
                    ?expanded=${true}>
                    <ha-selector
                        .hass=${this.hass}
                        .selector=${{
                            select: {
                                options: [
                                    { value: '', label: 'Select card type...' },
                                    { value: 'button', label: 'Button Card' },
                                    { value: 'entities', label: 'Entities Card' },
                                    { value: 'entity', label: 'Entity Card' },
                                    { value: 'glance', label: 'Glance Card' },
                                    { value: 'light', label: 'Light Card' },
                                    { value: 'custom:lcards-button', label: 'LCARdS Button' },
                                    { value: 'custom:lcards-gauge', label: 'LCARdS Gauge' },
                                    { value: 'custom:lcards-slider', label: 'LCARdS Slider' },
                                    { value: 'custom:lcards-label', label: 'LCARdS Label' }
                                ],
                                mode: 'dropdown'
                            }
                        }}
                        .value=${cardType}
                        .label=${'Card Type'}
                        @value-changed=${(e) => {
                            const newType = e.detail.value;
                            if (newType) {
                                this._controlFormCard = { type: newType };
                            } else {
                                this._controlFormCard = { type: '' };
                            }
                            this.requestUpdate();
                        }}>
                    </ha-selector>
                </lcards-form-section>

                <!-- Full Card Configuration Editor -->
                ${cardType ? html`
                    <lcards-form-section
                        header="Card Configuration"
                        description="Configure the card properties using HA's UI card editor"
                        ?expanded=${true}>
                        <ha-selector
                            .hass=${this.hass}
                            .selector=${{ ui: {} }}
                            .value=${this._controlFormCard}
                            .label=${'Full Card Config'}
                            @value-changed=${(e) => {
                                this._controlFormCard = e.detail.value || { type: cardType };
                                this.requestUpdate();
                            }}>
                        </ha-selector>
                    </lcards-form-section>
                ` : html`
                    <lcards-message type="info">
                        <strong>Select a card type above to configure</strong>
                        <p style="margin: 8px 0; font-size: 13px;">
                            Choose a card type from the dropdown, then configure its properties below.
                        </p>
                    </lcards-message>
                `}
            </div>
        `;
    }

    /**
     * Render Lines tab (Phase 4)
     * @returns {TemplateResult}
     * @private
     */
    _renderLinesTab() {
        const lines = this._getLineOverlays();
        const lineCount = lines.length;

        return html`
            <!-- Lines Management -->
            <lcards-form-section
                header="Line Overlays"
                description="Connect controls and anchors with lines"
                icon="mdi:vector-line"
                ?expanded=${true}>

                ${lineCount === 0 ? html`
                    <lcards-message type="info">
                        <strong>No line overlays defined yet.</strong>
                        <p style="margin: 8px 0; font-size: 13px;">
                            Line overlays connect anchors and controls on your MSD canvas.
                            Click "Add Line" to create your first connection.
                        </p>
                    </lcards-message>
                ` : html`
                    <div class="line-list">
                        ${lines.map(line => this._renderLineItem(line))}
                    </div>
                `}

                <div style="display: flex; gap: 8px; margin-top: 12px;">
                    <ha-button @click=${this._openLineForm}>
                        <ha-icon icon="mdi:plus" slot="icon"></ha-icon>
                        Add Line
                    </ha-button>
                    <ha-button @click=${() => this._setMode('connect_line')}>
                        <ha-icon icon="mdi:vector-line" slot="icon"></ha-icon>
                        Enter Connect Mode
                    </ha-button>
                </div>
            </lcards-form-section>

            ${this._renderLineHelp()}
        `;
    }

    /**
     * Get line overlays from config
     * @returns {Array}
     * @private
     */
    _getLineOverlays() {
        const overlays = this._workingConfig.msd?.overlays || [];
        return overlays.filter(o => o.type === 'line');
    }

    /**
     * Render single line item
     * @param {Object} line - Line overlay config
     * @returns {TemplateResult}
     * @private
     */
    _renderLineItem(line) {
        const id = line.id || 'unnamed';
        const sourceStr = this._formatConnectionPoint(line.source || line.anchor);
        const targetStr = this._formatConnectionPoint(line.target || line.attach_to);
        const routingMode = line.routing?.mode || 'direct';
        const strokeColor = line.style?.stroke || '#FF9900';
        const strokeWidth = line.style?.stroke_width || 2;

        return html`
            <div class="line-item" style="
                display: flex;
                align-items: center;
                gap: 12px;
                padding: 12px;
                border: 1px solid var(--divider-color);
                border-radius: 4px;
                margin-bottom: 8px;
            ">
                <!-- Line Style Preview -->
                <div style="
                    width: 40px;
                    height: 40px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border: 1px solid var(--divider-color);
                    border-radius: 4px;
                    background: var(--card-background-color);
                ">
                    <svg width="30" height="20" style="overflow: visible;">
                        <line
                            x1="0" y1="10"
                            x2="30" y2="10"
                            stroke="${strokeColor}"
                            stroke-width="${strokeWidth}"
                            stroke-dasharray="${line.style?.stroke_dasharray || ''}">
                        </line>
                    </svg>
                </div>

                <!-- Line Info -->
                <div style="flex: 1;">
                    <div style="font-weight: 600; display: flex; align-items: center; gap: 8px;">
                        ${id}
                        <span style="
                            font-size: 10px;
                            padding: 2px 6px;
                            background: var(--primary-color);
                            color: var(--text-primary-color);
                            border-radius: 3px;
                            font-weight: 500;
                        ">${routingMode}</span>
                    </div>
                    <div style="font-size: 12px; color: var(--secondary-text-color); font-family: monospace;">
                        ${sourceStr} → ${targetStr}
                    </div>
                </div>

                <!-- Action Buttons -->
                <div style="display: flex; gap: 4px;">
                    <ha-icon-button
                        icon="mdi:pencil"
                        @click=${() => this._editLine(line)}
                        title="Edit line">
                    </ha-icon-button>
                    <ha-icon-button
                        icon="mdi:eye"
                        @click=${() => this._highlightLineInPreview(line)}
                        title="Highlight in preview">
                    </ha-icon-button>
                    <ha-icon-button
                        icon="mdi:delete"
                        @click=${() => this._deleteLine(line)}
                        title="Delete line">
                    </ha-icon-button>
                </div>
            </div>
        `;
    }

    /**
     * Format connection point for display
     * @param {string|Object} point - Connection point (anchor name, control ref, or coords)
     * @returns {string}
     * @private
     */
    _formatConnectionPoint(point) {
        if (!point) return 'not set';
        if (typeof point === 'string') return point;
        if (point.type === 'anchor') return `anchor:${point.id}`;
        if (point.type === 'control') {
            const attachPoint = point.point ? `@${point.point}` : '';
            return `control:${point.id}${attachPoint}`;
        }
        if (point.type === 'coords' && Array.isArray(point.position)) {
            return `[${point.position[0]}, ${point.position[1]}]`;
        }
        return 'unknown';
    }

    /**
     * Render line help documentation
     * @returns {TemplateResult}
     * @private
     */
    _renderLineHelp() {
        return html`
            <lcards-message type="info" style="margin-top: 16px;">
                <strong>About Line Overlays:</strong>
                <ul style="margin: 8px 0; padding-left: 20px; font-size: 13px;">
                    <li>Lines connect anchors and controls to show relationships or data flow</li>
                    <li>Use "Enter Connect Mode" to click source → target for easy line creation</li>
                    <li>Routing modes: direct (straight), manhattan (90° angles), bezier (curved), etc.</li>
                    <li>Customize line style: color, width, dash pattern, markers, animations</li>
                </ul>
            </lcards-message>
        `;
    }

    /**
     * Render Channels tab (Phase 5)
     * @returns {TemplateResult}
     * @private
     */
    _renderChannelsTab() {
        const channels = this._workingConfig.msd?.channels || {};
        const channelCount = Object.keys(channels).length;

        return html`
            <div style="padding: 8px;">
                <!-- Channels List -->
                <lcards-form-section
                    header="Routing Channels"
                    description="Define regions that influence line routing behavior"
                    ?expanded=${true}>
                    
                    ${channelCount === 0 ? html`
                        <lcards-message type="info">
                            <strong>No routing channels defined.</strong>
                            <p style="margin: 8px 0; font-size: 13px;">
                                Channels are rectangular regions that guide line routing:
                                <br/>• <strong>Bundling</strong>: Lines prefer to route through these areas
                                <br/>• <strong>Avoiding</strong>: Lines try to avoid these areas
                                <br/>• <strong>Waypoint</strong>: Lines must pass through these areas
                            </p>
                        </lcards-message>
                    ` : html`
                        <div class="channel-list">
                            ${Object.entries(channels).map(([id, channel]) => 
                                this._renderChannelItem(id, channel)
                            )}
                        </div>
                    `}

                    <div style="display: flex; gap: 8px; margin-top: 12px;">
                        <ha-button @click=${this._openChannelForm}>
                            <ha-icon icon="mdi:plus" slot="icon"></ha-icon>
                            Add Channel
                        </ha-button>
                        <ha-button @click=${() => this._setMode('draw_channel')}>
                            <ha-icon icon="mdi:vector-rectangle" slot="icon"></ha-icon>
                            Draw on Canvas
                        </ha-button>
                    </div>
                </lcards-form-section>

                <!-- Channel Help -->
                ${this._renderChannelHelp()}
            </div>

            <!-- Channel Form Dialog -->
            ${this._editingChannelId !== null ? this._renderChannelFormDialog() : ''}
        `;
    }

    /**
     * Render individual channel item in list
     * @param {string} id - Channel ID
     * @param {Object} channel - Channel config
     * @returns {TemplateResult}
     * @private
     */
    _renderChannelItem(id, channel) {
        const typeColors = {
            bundling: '#00FF00',
            avoiding: '#FF0000',
            waypoint: '#0000FF'
        };
        const typeLabels = {
            bundling: 'Bundling',
            avoiding: 'Avoiding',
            waypoint: 'Waypoint'
        };

        const [x, y, width, height] = channel.bounds || [0, 0, 0, 0];
        const boundsStr = `[${x}, ${y}] ${width}×${height}`;

        return html`
            <div class="channel-item" style="
                display: flex;
                align-items: center;
                gap: 12px;
                padding: 12px;
                border: 2px solid ${typeColors[channel.type] || '#888'};
                border-radius: 4px;
                margin-bottom: 8px;
                background: ${typeColors[channel.type]}22;
            ">
                <!-- Type Indicator -->
                <div style="
                    width: 40px;
                    height: 40px;
                    background: ${typeColors[channel.type] || '#888'};
                    border-radius: 4px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: #000;
                    font-weight: bold;
                    font-size: 10px;
                    text-align: center;
                    line-height: 1.2;
                ">
                    ${typeLabels[channel.type]}
                </div>

                <!-- Channel Info -->
                <div style="flex: 1;">
                    <div style="font-weight: 600; margin-bottom: 4px;">${id}</div>
                    <div style="font-size: 12px; color: var(--secondary-text-color); font-family: monospace;">
                        ${boundsStr}
                    </div>
                </div>

                <!-- Actions -->
                <div style="display: flex; gap: 4px;">
                    <ha-icon-button
                        icon="mdi:pencil"
                        @click=${() => this._editChannel(id, channel)}
                        title="Edit channel">
                    </ha-icon-button>
                    <ha-icon-button
                        icon="mdi:eye"
                        @click=${() => this._highlightChannelInPreview(id)}
                        title="Highlight in preview">
                    </ha-icon-button>
                    <ha-icon-button
                        icon="mdi:delete"
                        @click=${() => this._deleteChannel(id)}
                        title="Delete channel">
                    </ha-icon-button>
                </div>
            </div>
        `;
    }

    /**
     * Render channel help message
     * @returns {TemplateResult}
     * @private
     */
    _renderChannelHelp() {
        return html`
            <lcards-message type="info" style="margin-top: 16px;">
                <strong>About Routing Channels:</strong>
                <ul style="margin: 8px 0; padding-left: 20px; font-size: 13px;">
                    <li><strong>Bundling</strong>: Lines prefer to route through these areas (cable management, power corridors)</li>
                    <li><strong>Avoiding</strong>: Lines try to stay out of these areas (sensitive equipment, obstructions)</li>
                    <li><strong>Waypoint</strong>: Lines must pass through these areas (routing hubs, junctions)</li>
                    <li><strong>Priority</strong>: Higher priority channels have stronger influence (1-100)</li>
                </ul>
            </lcards-message>
        `;
    }

    /**
     * Render channel form dialog
     * @returns {TemplateResult}
     * @private
     */
    _renderChannelFormDialog() {
        const isNew = this._editingChannelId === '';
        const channelId = isNew ? '' : this._editingChannelId;
        const data = this._channelFormData;

        return html`
            <ha-dialog
                open
                @closed=${this._closeChannelForm}
                .heading=${isNew ? 'Add Routing Channel' : `Edit Channel: ${channelId}`}>
                
                <div style="padding: 16px;">
                    <!-- Channel ID -->
                    <div class="form-field">
                        <label class="form-label">Channel ID</label>
                        <ha-textfield
                            .value=${data.id}
                            ?disabled=${!isNew}
                            @input=${(e) => this._updateChannelFormField('id', e.target.value)}
                            placeholder="power_corridor"
                            style="width: 100%;">
                        </ha-textfield>
                        ${isNew ? html`
                            <div class="form-helper">Unique identifier (e.g., power_corridor, avoid_zone_1)</div>
                        ` : ''}
                    </div>

                    <!-- Channel Type -->
                    <div class="form-field" style="margin-top: 12px;">
                        <label class="form-label">Channel Type</label>
                        <ha-selector
                            .hass=${this.hass}
                            .selector=${{
                                select: {
                                    options: [
                                        { value: 'bundling', label: 'Bundling (lines prefer)' },
                                        { value: 'avoiding', label: 'Avoiding (lines avoid)' },
                                        { value: 'waypoint', label: 'Waypoint (lines must pass through)' }
                                    ]
                                }
                            }}
                            .value=${data.type}
                            @value-changed=${(e) => this._updateChannelFormField('type', e.detail.value)}>
                        </ha-selector>
                    </div>

                    <!-- Bounds Configuration -->
                    <div class="form-field" style="margin-top: 12px;">
                        <label class="form-label">Channel Bounds</label>
                        <div style="display: grid; grid-template-columns: 1fr 1fr 1fr 1fr; gap: 8px;">
                            <div>
                                <label class="form-label" style="font-size: 12px;">X</label>
                                <ha-textfield
                                    type="number"
                                    .value=${String(data.bounds[0])}
                                    @input=${(e) => this._updateChannelBounds(0, Number(e.target.value))}
                                    style="width: 100%;">
                                </ha-textfield>
                            </div>
                            <div>
                                <label class="form-label" style="font-size: 12px;">Y</label>
                                <ha-textfield
                                    type="number"
                                    .value=${String(data.bounds[1])}
                                    @input=${(e) => this._updateChannelBounds(1, Number(e.target.value))}
                                    style="width: 100%;">
                                </ha-textfield>
                            </div>
                            <div>
                                <label class="form-label" style="font-size: 12px;">Width</label>
                                <ha-textfield
                                    type="number"
                                    .value=${String(data.bounds[2])}
                                    @input=${(e) => this._updateChannelBounds(2, Number(e.target.value))}
                                    style="width: 100%;">
                                </ha-textfield>
                            </div>
                            <div>
                                <label class="form-label" style="font-size: 12px;">Height</label>
                                <ha-textfield
                                    type="number"
                                    .value=${String(data.bounds[3])}
                                    @input=${(e) => this._updateChannelBounds(3, Number(e.target.value))}
                                    style="width: 100%;">
                                </ha-textfield>
                            </div>
                        </div>
                        <div class="form-helper">Rectangle in ViewBox coordinates [x, y, width, height]</div>
                    </div>

                    <!-- Priority -->
                    <div class="form-field" style="margin-top: 12px;">
                        <label class="form-label">Priority (1-100)</label>
                        <ha-selector
                            .hass=${this.hass}
                            .selector=${{ number: { min: 1, max: 100, mode: 'slider' } }}
                            .value=${data.priority || 10}
                            @value-changed=${(e) => this._updateChannelFormField('priority', e.detail.value)}>
                        </ha-selector>
                        <div class="form-helper">Higher priority = stronger influence on routing</div>
                    </div>

                    <!-- Visualization Color -->
                    <div class="form-field" style="margin-top: 12px;">
                        <label class="form-label">Visualization Color</label>
                        <ha-textfield
                            type="color"
                            .value=${data.color}
                            @input=${(e) => this._updateChannelFormField('color', e.target.value)}
                            style="width: 100%;">
                        </ha-textfield>
                        <div class="form-helper">Color for debug visualization in editor</div>
                    </div>
                </div>

                <!-- Dialog Actions -->
                <div slot="primaryAction">
                    <ha-button @click=${this._saveChannel}>
                        ${isNew ? 'Add' : 'Save'}
                    </ha-button>
                </div>
                <div slot="secondaryAction">
                    <ha-button @click=${this._closeChannelForm}>
                        Cancel
                    </ha-button>
                </div>
            </ha-dialog>
        `;
    }

    // ============================
    // Channels Tab Methods (Phase 5)
    // ============================

    /**
     * Open channel form for creating new channel
     * @private
     */
    _openChannelForm() {
        this._editingChannelId = '';
        this._channelFormData = {
            id: '',
            type: 'bundling',
            bounds: [0, 0, 100, 50],
            priority: 10,
            color: '#00FF00'
        };
        this.requestUpdate();
    }

    /**
     * Edit existing channel
     * @param {string} id - Channel ID
     * @param {Object} channel - Channel config
     * @private
     */
    _editChannel(id, channel) {
        this._editingChannelId = id;
        this._channelFormData = {
            id,
            type: channel.type || 'bundling',
            bounds: [...(channel.bounds || [0, 0, 100, 50])],
            priority: channel.priority || 10,
            color: channel.color || '#00FF00'
        };
        this.requestUpdate();
    }

    /**
     * Close channel form dialog
     * @private
     */
    _closeChannelForm() {
        this._editingChannelId = null;
        this.requestUpdate();
    }

    /**
     * Update channel form field
     * @param {string} field - Field name
     * @param {*} value - New value
     * @private
     */
    _updateChannelFormField(field, value) {
        this._channelFormData[field] = value;
        this.requestUpdate();
    }

    /**
     * Update channel bounds array
     * @param {number} index - Array index
     * @param {number} value - New value
     * @private
     */
    _updateChannelBounds(index, value) {
        this._channelFormData.bounds[index] = value;
        this.requestUpdate();
    }

    /**
     * Save channel
     * @private
     */
    _saveChannel() {
        const id = this._channelFormData.id;
        if (!id || id.trim() === '') {
            alert('Channel ID is required');
            return;
        }

        // Ensure channels object exists
        if (!this._workingConfig.msd) {
            this._workingConfig.msd = {};
        }
        if (!this._workingConfig.msd.channels) {
            this._workingConfig.msd.channels = {};
        }

        // Save channel
        this._workingConfig.msd.channels[id] = {
            type: this._channelFormData.type,
            bounds: this._channelFormData.bounds,
            priority: this._channelFormData.priority,
            color: this._channelFormData.color
        };

        this._setNestedValue('msd.channels', this._workingConfig.msd.channels);
        this._closeChannelForm();
        this._schedulePreviewUpdate();
    }

    /**
     * Delete channel
     * @param {string} id - Channel ID
     * @private
     */
    async _deleteChannel(id) {
        if (!confirm(`Delete routing channel "${id}"? Lines using this channel may be affected.`)) {
            return;
        }

        const channels = { ...(this._workingConfig.msd?.channels || {}) };
        delete channels[id];
        this._setNestedValue('msd.channels', channels);
        this._schedulePreviewUpdate();
    }

    /**
     * Highlight channel in preview
     * @param {string} id - Channel ID
     * @private
     */
    _highlightChannelInPreview(id) {
        // Highlight channel in preview for 2 seconds
        const debugSettings = this._getDebugSettings();
        debugSettings.highlighted_channel = id;
        this._schedulePreviewUpdate();

        setTimeout(() => {
            const settings = this._getDebugSettings();
            delete settings.highlighted_channel;
            this._schedulePreviewUpdate();
        }, 2000);
    }

    /**
     * Generate unique channel ID
     * @returns {string}
     * @private
     */
    _generateChannelId() {
        const channels = this._workingConfig.msd?.channels || {};
        let num = Object.keys(channels).length + 1;
        let id = `channel_${num}`;
        while (channels[id]) {
            num++;
            id = `channel_${num}`;
        }
        return id;
    }

    /**
     * Render Debug tab (Phase 6)
     * @returns {TemplateResult}
     * @private
     */
    _renderDebugTab() {
        return html`
            <div style="padding: 8px;">
                <!-- Debug Toggles Section -->
                <lcards-form-section
                    header="Debug Visualization Toggles"
                    description="Show/hide debug overlays in the preview panel"
                    icon="mdi:eye-settings"
                    ?expanded=${true}>
                    
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 12px; margin-top: 12px;">
                        <label style="display: flex; align-items: center; gap: 8px; cursor: pointer;">
                            <input
                                type="checkbox"
                                ?checked=${this._debugSettings.anchors}
                                @change=${(e) => this._updateDebugSetting('anchors', e.target.checked)}
                                style="width: 18px; height: 18px; cursor: pointer;">
                            <span>Show Anchors</span>
                        </label>

                        <label style="display: flex; align-items: center; gap: 8px; cursor: pointer;">
                            <input
                                type="checkbox"
                                ?checked=${this._debugSettings.bounding_boxes}
                                @change=${(e) => this._updateDebugSetting('bounding_boxes', e.target.checked)}
                                style="width: 18px; height: 18px; cursor: pointer;">
                            <span>Show Bounding Boxes</span>
                        </label>

                        <label style="display: flex; align-items: center; gap: 8px; cursor: pointer;">
                            <input
                                type="checkbox"
                                ?checked=${this._debugSettings.attachment_points}
                                @change=${(e) => this._updateDebugSetting('attachment_points', e.target.checked)}
                                style="width: 18px; height: 18px; cursor: pointer;">
                            <span>Show Attachment Points</span>
                        </label>

                        <label style="display: flex; align-items: center; gap: 8px; cursor: pointer;">
                            <input
                                type="checkbox"
                                ?checked=${this._debugSettings.routing_channels}
                                @change=${(e) => this._updateDebugSetting('routing_channels', e.target.checked)}
                                style="width: 18px; height: 18px; cursor: pointer;">
                            <span>Show Routing Channels</span>
                        </label>

                        <label style="display: flex; align-items: center; gap: 8px; cursor: pointer;">
                            <input
                                type="checkbox"
                                ?checked=${this._debugSettings.line_paths}
                                @change=${(e) => this._updateDebugSetting('line_paths', e.target.checked)}
                                style="width: 18px; height: 18px; cursor: pointer;">
                            <span>Show Line Paths</span>
                        </label>

                        <label style="display: flex; align-items: center; gap: 8px; cursor: pointer;">
                            <input
                                type="checkbox"
                                ?checked=${this._debugSettings.grid}
                                @change=${(e) => this._updateDebugSetting('grid', e.target.checked)}
                                style="width: 18px; height: 18px; cursor: pointer;">
                            <span>Show Grid</span>
                        </label>

                        <label style="display: flex; align-items: center; gap: 8px; cursor: pointer;">
                            <input
                                type="checkbox"
                                ?checked=${this._debugSettings.show_coordinates}
                                @change=${(e) => this._updateDebugSetting('show_coordinates', e.target.checked)}
                                style="width: 18px; height: 18px; cursor: pointer;">
                            <span>Show Coordinates</span>
                        </label>
                    </div>
                </lcards-form-section>

                <!-- Grid Settings (when enabled) -->
                ${this._debugSettings.grid ? html`
                    <lcards-form-section
                        header="Grid Settings"
                        description="Configure grid appearance and behavior"
                        icon="mdi:grid"
                        ?expanded=${true}
                        style="margin-top: 16px;">
                        
                        <!-- Grid Spacing -->
                        <div style="margin-top: 12px;">
                            <label class="form-label">Grid Spacing (${this._gridSpacing}px)</label>
                            <ha-selector
                                .hass=${this.hass}
                                .selector=${{
                                    number: {
                                        min: 10,
                                        max: 100,
                                        step: 5,
                                        mode: 'slider'
                                    }
                                }}
                                .value=${this._gridSpacing}
                                @value-changed=${(e) => {
                                    this._gridSpacing = e.detail.value;
                                    this._schedulePreviewUpdate();
                                }}>
                            </ha-selector>
                        </div>

                        <!-- Snap to Grid -->
                        <div style="margin-top: 16px;">
                            <label style="display: flex; align-items: center; gap: 8px; cursor: pointer;">
                                <input
                                    type="checkbox"
                                    ?checked=${this._snapToGrid}
                                    @change=${(e) => {
                                        this._snapToGrid = e.target.checked;
                                        this.requestUpdate();
                                    }}
                                    style="width: 18px; height: 18px; cursor: pointer;">
                                <span>Snap to Grid</span>
                            </label>
                        </div>

                        <!-- Grid Color -->
                        <div style="margin-top: 16px;">
                            <label class="form-label">Grid Color</label>
                            <ha-textfield
                                type="color"
                                .value=${this._debugSettings.grid_color || '#cccccc'}
                                @input=${(e) => this._updateDebugSetting('grid_color', e.target.value)}
                                style="width: 100%;">
                            </ha-textfield>
                        </div>

                        <!-- Grid Opacity -->
                        <div style="margin-top: 16px;">
                            <label class="form-label">Grid Opacity (${(this._debugSettings.grid_opacity ?? 0.3).toFixed(1)})</label>
                            <ha-selector
                                .hass=${this.hass}
                                .selector=${{
                                    number: {
                                        min: 0.1,
                                        max: 1.0,
                                        step: 0.1,
                                        mode: 'slider'
                                    }
                                }}
                                .value=${this._debugSettings.grid_opacity ?? 0.3}
                                @value-changed=${(e) => this._updateDebugSetting('grid_opacity', e.detail.value)}>
                            </ha-selector>
                        </div>
                    </lcards-form-section>
                ` : ''}

                <!-- Scale Settings -->
                <lcards-form-section
                    header="Debug Scale"
                    description="Adjust size of debug markers and labels"
                    icon="mdi:magnify"
                    ?expanded=${true}
                    style="margin-top: 16px;">
                    
                    <div style="margin-top: 12px;">
                        <label class="form-label">Debug Scale (${(this._debugSettings.debug_scale ?? 1.0).toFixed(1)}x)</label>
                        <ha-selector
                            .hass=${this.hass}
                            .selector=${{
                                number: {
                                    min: 0.5,
                                    max: 3.0,
                                    step: 0.1,
                                    mode: 'slider'
                                }
                            }}
                            .value=${this._debugSettings.debug_scale ?? 1.0}
                            @value-changed=${(e) => this._updateDebugSetting('debug_scale', e.detail.value)}>
                        </ha-selector>
                    </div>
                </lcards-form-section>

                <!-- Preview Settings -->
                <lcards-form-section
                    header="Preview Settings"
                    description="Control preview behavior"
                    icon="mdi:monitor-eye"
                    ?expanded=${true}
                    style="margin-top: 16px;">
                    
                    <div style="margin-top: 12px;">
                        <label style="display: flex; align-items: center; gap: 8px; cursor: pointer;">
                            <input
                                type="checkbox"
                                ?checked=${this._debugSettings.auto_refresh ?? true}
                                @change=${(e) => this._updateDebugSetting('auto_refresh', e.target.checked)}
                                style="width: 18px; height: 18px; cursor: pointer;">
                            <span>Auto-refresh (300ms debounce)</span>
                        </label>
                    </div>

                    <div style="margin-top: 12px;">
                        <label style="display: flex; align-items: center; gap: 8px; cursor: pointer;">
                            <input
                                type="checkbox"
                                ?checked=${this._debugSettings.interactive_preview ?? false}
                                @change=${(e) => this._updateDebugSetting('interactive_preview', e.target.checked)}
                                style="width: 18px; height: 18px; cursor: pointer;">
                            <span>Interactive Preview (click to select)</span>
                        </label>
                    </div>

                    <ha-button @click=${() => this._schedulePreviewUpdate()} style="margin-top: 12px;">
                        <ha-icon icon="mdi:refresh" slot="icon"></ha-icon>
                        Manual Refresh
                    </ha-button>
                </lcards-form-section>

                <!-- Visualization Colors -->
                <lcards-form-section
                    header="Visualization Colors"
                    description="Customize debug visualization colors"
                    icon="mdi:palette"
                    ?expanded=${false}
                    style="margin-top: 16px;">
                    
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 16px; margin-top: 12px;">
                        <!-- Anchor Marker Color -->
                        <div>
                            <label class="form-label">Anchor Markers</label>
                            <ha-textfield
                                type="color"
                                .value=${this._debugSettings.anchor_color || '#00FFFF'}
                                @input=${(e) => this._updateDebugSetting('anchor_color', e.target.value)}
                                style="width: 100%;">
                            </ha-textfield>
                        </div>

                        <!-- Bounding Box Color -->
                        <div>
                            <label class="form-label">Bounding Boxes</label>
                            <ha-textfield
                                type="color"
                                .value=${this._debugSettings.bbox_color || '#FFA500'}
                                @input=${(e) => this._updateDebugSetting('bbox_color', e.target.value)}
                                style="width: 100%;">
                            </ha-textfield>
                        </div>

                        <!-- Attachment Point Color -->
                        <div>
                            <label class="form-label">Attachment Points</label>
                            <ha-textfield
                                type="color"
                                .value=${this._debugSettings.attachment_color || '#00FF00'}
                                @input=${(e) => this._updateDebugSetting('attachment_color', e.target.value)}
                                style="width: 100%;">
                            </ha-textfield>
                        </div>

                        <!-- Bundling Channel Color -->
                        <div>
                            <label class="form-label">Bundling Channels</label>
                            <ha-textfield
                                type="color"
                                .value=${this._debugSettings.bundling_color || '#00FF00'}
                                @input=${(e) => this._updateDebugSetting('bundling_color', e.target.value)}
                                style="width: 100%;">
                            </ha-textfield>
                        </div>

                        <!-- Avoiding Channel Color -->
                        <div>
                            <label class="form-label">Avoiding Channels</label>
                            <ha-textfield
                                type="color"
                                .value=${this._debugSettings.avoiding_color || '#FF0000'}
                                @input=${(e) => this._updateDebugSetting('avoiding_color', e.target.value)}
                                style="width: 100%;">
                            </ha-textfield>
                        </div>

                        <!-- Waypoint Channel Color -->
                        <div>
                            <label class="form-label">Waypoint Channels</label>
                            <ha-textfield
                                type="color"
                                .value=${this._debugSettings.waypoint_color || '#0000FF'}
                                @input=${(e) => this._updateDebugSetting('waypoint_color', e.target.value)}
                                style="width: 100%;">
                            </ha-textfield>
                        </div>
                    </div>
                </lcards-form-section>

                <!-- Help Section -->
                ${this._renderDebugHelp()}
            </div>
        `;
    }

    /**
     * Render debug help documentation
     * @returns {TemplateResult}
     * @private
     */
    _renderDebugHelp() {
        return html`
            <lcards-message type="info" style="margin-top: 16px;">
                <strong>About Debug Visualizations:</strong>
                <ul style="margin: 8px 0; padding-left: 20px; font-size: 13px;">
                    <li><strong>Anchors</strong>: Cyan crosshairs with labels showing named anchor positions</li>
                    <li><strong>Bounding Boxes</strong>: Orange dashed rectangles showing control overlay bounds</li>
                    <li><strong>Attachment Points</strong>: Green dots showing 9-point attachment grid on controls</li>
                    <li><strong>Routing Channels</strong>: Colored translucent rectangles showing routing regions</li>
                    <li><strong>Line Paths</strong>: Magenta waypoint markers showing line routing</li>
                    <li><strong>Grid</strong>: Coordinate grid overlay with snap-to-grid support</li>
                    <li><strong>Coordinates</strong>: Mouse position tooltip for precise placement</li>
                </ul>
            </lcards-message>
        `;
    }

    /**
     * Update debug setting
     * @param {string} key - Setting key
     * @param {*} value - New value
     * @private
     */
    _updateDebugSetting(key, value) {
        this._debugSettings = {
            ...this._debugSettings,
            [key]: value
        };
        this._schedulePreviewUpdate();
    }

    // ============================
    // Lines Tab Methods (Phase 4)
    // ============================

    /**
     * Open line form for creating new line
     * @private
     */
    _openLineForm() {
        // Generate new line ID
        const overlays = this._workingConfig.msd?.overlays || [];
        let lineNum = overlays.filter(o => o.type === 'line').length + 1;
        let lineId = `line_${lineNum}`;
        while (overlays.find(o => o.id === lineId)) {
            lineNum++;
            lineId = `line_${lineNum}`;
        }

        this._editingLineId = null;
        this._lineFormData = {
            id: lineId,
            anchor: '',
            attach_to: '',
            anchor_side: 'center',
            attach_side: 'center',
            anchor_gap: 0,
            attach_gap: 0,
            route: 'auto',
            style: {
                color: 'var(--lcars-orange)',
                width: 2,
                dash_array: '',
                marker_end: null
            }
        };
        this._lineFormActiveSubtab = 'connection';
        this._showLineForm = true;

        this.requestUpdate();
    }

    /**
     * Edit existing line
     * @param {Object} line - Line to edit
     * @private
     */
    _editLine(line) {
        this._editingLineId = line.id;
        
        // Parse using correct schema
        this._lineFormData = {
            id: line.id,
            anchor: line.anchor || '',
            attach_to: line.attach_to || '',
            anchor_side: line.anchor_side || 'center',
            attach_side: line.attach_side || 'center',
            anchor_gap: line.anchor_gap || 0,
            attach_gap: line.attach_gap || 0,
            route: line.route || 'auto',
            style: {
                color: line.style?.color || 'var(--lcars-orange)',
                width: line.style?.width || 2,
                dash_array: line.style?.dash_array || '',
                marker_end: line.style?.marker_end || null
            }
        };
        
        this._lineFormActiveSubtab = 'connection';
        this._showLineForm = true;
        this.requestUpdate();
    }

    /**
     * Helper method to check if a value is an overlay ID
     * @param {*} value - Value to check
     * @returns {boolean}
     * @private
     */
    _isOverlayId(value) {
        if (!value || typeof value !== 'string') return false;
        const overlays = this._workingConfig.msd?.overlays || [];
        return overlays.some(o => o.id === value && o.type !== 'line');
    }

    /**
     * Save line form
     * @private
     */
    _saveLine() {
        if (!this._lineFormData.id) {
            lcardsLog.warn('[MSDStudio] Cannot save line without ID');
            return;
        }

        // Build line overlay object with correct schema
        const lineOverlay = {
            type: 'line',
            id: this._lineFormData.id,
            anchor: this._lineFormData.anchor,
            attach_to: this._lineFormData.attach_to,
            route: this._lineFormData.route
        };

        // Only add optional properties if set
        if (this._lineFormData.anchor_side && this._isOverlayId(this._lineFormData.anchor)) {
            lineOverlay.anchor_side = this._lineFormData.anchor_side;
        }
        if (this._lineFormData.attach_side && this._isOverlayId(this._lineFormData.attach_to)) {
            lineOverlay.attach_side = this._lineFormData.attach_side;
        }
        if (this._lineFormData.anchor_gap) {
            lineOverlay.anchor_gap = this._lineFormData.anchor_gap;
        }
        if (this._lineFormData.attach_gap) {
            lineOverlay.attach_gap = this._lineFormData.attach_gap;
        }
        if (this._lineFormData.style && Object.keys(this._lineFormData.style).length > 0) {
            // Only include non-empty style properties
            const style = {};
            if (this._lineFormData.style.color) style.color = this._lineFormData.style.color;
            if (this._lineFormData.style.width) style.width = this._lineFormData.style.width;
            if (this._lineFormData.style.dash_array) style.dash_array = this._lineFormData.style.dash_array;
            if (this._lineFormData.style.marker_end) style.marker_end = this._lineFormData.style.marker_end;
            if (Object.keys(style).length > 0) {
                lineOverlay.style = style;
            }
        }

        // Ensure overlays array exists
        if (!this._workingConfig.msd) {
            this._workingConfig.msd = {};
        }
        if (!this._workingConfig.msd.overlays) {
            this._workingConfig.msd.overlays = [];
        }

        // Update or add
        const existingIndex = this._workingConfig.msd.overlays.findIndex(o => o.id === this._lineFormData.id);
        if (existingIndex >= 0) {
            this._workingConfig.msd.overlays[existingIndex] = lineOverlay;
            lcardsLog.info('[MSDStudio] Updated line:', this._lineFormData.id);
        } else {
            this._workingConfig.msd.overlays.push(lineOverlay);
            lcardsLog.info('[MSDStudio] Added line:', this._lineFormData.id);
        }

        this._closeLineForm();
        this._schedulePreviewUpdate();
    }

    /**
     * Close line form dialog
     * @private
     */
    _closeLineForm() {
        this._showLineForm = false;
        this._editingLineId = null;
        this.requestUpdate();
    }

    /**
     * Delete line overlay
     * @param {Object} line - Line to delete
     * @private
     */
    _deleteLine(line) {
        if (!confirm(`Delete line "${line.id}"?`)) {
            return;
        }

        const overlays = this._workingConfig.msd?.overlays || [];
        const index = overlays.findIndex(o => o.id === line.id);
        if (index >= 0) {
            overlays.splice(index, 1);
            lcardsLog.info('[MSDStudio] Deleted line:', line.id);
            this.requestUpdate();
            this._schedulePreviewUpdate();
        }
    }

    /**
     * Highlight line in preview (temporary visual feedback)
     * @param {Object} line - Line to highlight
     * @private
     */
    _highlightLineInPreview(line) {
        // TODO: Implement highlight via preview component
        lcardsLog.info('[MSDStudio] Highlight line:', line.id);
        // This would need to communicate with the preview component
        // For now, just log
    }

    /**
     * Open line form with pre-filled connection from connect mode
     * @param {string} anchor - Source anchor/overlay
     * @param {string} attachTo - Target anchor/overlay
     * @param {string} anchorSide - Optional source side
     * @param {string} attachSide - Optional target side
     * @private
     */
    _openLineFormWithConnection(anchor, attachTo, anchorSide = null, attachSide = null) {
        this._openLineForm();
        this._lineFormData.anchor = anchor;
        this._lineFormData.attach_to = attachTo;
        if (anchorSide) this._lineFormData.anchor_side = anchorSide;
        if (attachSide) this._lineFormData.attach_side = attachSide;
        this.requestUpdate();
    }

    /**
     * Handle preview click in connect_line mode
     * @param {Event} e - Click event
     * @private
     */
    _handleConnectLineClick(e) {
        // Get clicked element info from event
        const clickedElement = e.target.closest('[data-connection-type]');
        if (!clickedElement) {
            lcardsLog.debug('[MSDStudio] Connect line click on non-connection element');
            return;
        }

        const connectionInfo = {
            type: clickedElement.dataset.connectionType, // 'anchor' or 'control'
            id: clickedElement.dataset.connectionId,
            point: clickedElement.dataset.connectionPoint || null,
            gap: 0
        };

        if (!this._connectLineState.source) {
            // First click - set source
            this._connectLineState.source = connectionInfo;
            lcardsLog.info('[MSDStudio] Connect line source set:', connectionInfo);
            // TODO: Create temp line that follows cursor
            this.requestUpdate();
        } else {
            // Second click - set target and open form
            lcardsLog.info('[MSDStudio] Connect line target set:', connectionInfo);
            this._openLineFormWithConnection(this._connectLineState.source, connectionInfo);
            this._clearConnectLineState();
        }
    }

    /**
     * Clear connect line state
     * @private
     */
    _clearConnectLineState() {
        this._connectLineState = { source: null, tempLineElement: null };
        this.requestUpdate();
    }

    /**
     * Render line form dialog (Phase 4 - Fixed schema)
     * @returns {TemplateResult}
     * @private
     */
    _renderLineFormDialog() {
        const isEditing = !!this._editingLineId;
        const title = isEditing ? `Edit Line: ${this._lineFormData.id}` : 'Add Line';

        return html`
            <ha-dialog
                open
                @closed=${this._closeLineForm}
                .heading=${title}>
                
                <!-- Subtabs -->
                <div style="display: flex; gap: 8px; padding: 0 24px; border-bottom: 1px solid var(--divider-color);">
                    <button
                        class="tab-button ${this._lineFormActiveSubtab === 'connection' ? 'active' : ''}"
                        @click=${() => { this._lineFormActiveSubtab = 'connection'; this.requestUpdate(); }}
                        style="padding: 12px 16px; background: transparent; border: none; border-bottom: 3px solid ${this._lineFormActiveSubtab === 'connection' ? 'var(--primary-color)' : 'transparent'}; cursor: pointer; font-weight: 500;">
                        Connection & Routing
                    </button>
                    <button
                        class="tab-button ${this._lineFormActiveSubtab === 'style' ? 'active' : ''}"
                        @click=${() => { this._lineFormActiveSubtab = 'style'; this.requestUpdate(); }}
                        style="padding: 12px 16px; background: transparent; border: none; border-bottom: 3px solid ${this._lineFormActiveSubtab === 'style' ? 'var(--primary-color)' : 'transparent'}; cursor: pointer; font-weight: 500;">
                        Style & Animation
                    </button>
                </div>

                <!-- Subtab Content -->
                <div style="padding: 16px; max-height: 60vh; overflow-y: auto;">
                    ${this._lineFormActiveSubtab === 'connection' 
                        ? this._renderLineFormConnection() 
                        : this._renderLineFormStyle()
                    }
                </div>

                <div slot="primaryAction">
                    <ha-button @click=${this._saveLine}>
                        <ha-icon icon="mdi:content-save" slot="icon"></ha-icon>
                        Save
                    </ha-button>
                </div>

                <div slot="secondaryAction">
                    <ha-button @click=${this._closeLineForm}>
                        <ha-icon icon="mdi:close" slot="icon"></ha-icon>
                        Cancel
                    </ha-button>
                </div>
            </ha-dialog>
        `;
    }

    /**
     * Render Connection & Routing subtab (Fixed schema)
     * @returns {TemplateResult}
     * @private
     */
    _renderLineFormConnection() {
        const anchors = this._workingConfig.msd?.anchors || {};
        const overlays = this._getControlOverlays();
        const anchorOptions = Object.keys(anchors).map(name => ({ value: name, label: `Anchor: ${name}` }));
        const overlayOptions = overlays.map(o => ({ value: o.id, label: `Overlay: ${o.id}` }));

        // Determine if anchor/attach_to are overlay IDs
        const anchorIsOverlay = this._isOverlayId(this._lineFormData.anchor);
        const attachToIsOverlay = this._isOverlayId(this._lineFormData.attach_to);

        return html`
            <div style="display: flex; flex-direction: column; gap: 16px;">
                <!-- Line ID -->
                <ha-textfield
                    label="Line ID"
                    .value=${this._lineFormData.id}
                    ?disabled=${!!this._editingLineId}
                    @input=${(e) => {
                        this._lineFormData.id = e.target.value;
                        this.requestUpdate();
                    }}
                    required
                    helper-text="Unique identifier for this line">
                </ha-textfield>

                <!-- Source (Anchor) Selection -->
                <lcards-form-section
                    header="Source (Anchor)"
                    description="Starting point for the line"
                    ?expanded=${true}>
                    
                    <ha-selector
                        .hass=${this.hass}
                        .selector=${{
                            select: {
                                options: [
                                    ...anchorOptions,
                                    ...overlayOptions
                                ]
                            }
                        }}
                        .value=${this._lineFormData.anchor}
                        .label=${'Select Anchor or Overlay'}
                        @value-changed=${(e) => {
                            this._lineFormData.anchor = e.detail.value;
                            this.requestUpdate();
                        }}
                        style="margin-top: 12px;">
                    </ha-selector>

                    ${anchorIsOverlay ? html`
                        <!-- Anchor Side (only for overlays) -->
                        <ha-selector
                            .hass=${this.hass}
                            .selector=${{
                                select: {
                                    options: [
                                        { value: 'center', label: 'Center' },
                                        { value: 'top', label: 'Top' },
                                        { value: 'bottom', label: 'Bottom' },
                                        { value: 'left', label: 'Left' },
                                        { value: 'right', label: 'Right' },
                                        { value: 'top-left', label: 'Top Left' },
                                        { value: 'top-right', label: 'Top Right' },
                                        { value: 'bottom-left', label: 'Bottom Left' },
                                        { value: 'bottom-right', label: 'Bottom Right' }
                                    ]
                                }
                            }}
                            .value=${this._lineFormData.anchor_side}
                            .label=${'Anchor Side'}
                            @value-changed=${(e) => {
                                this._lineFormData.anchor_side = e.detail.value;
                                this.requestUpdate();
                            }}
                            style="margin-top: 12px;">
                        </ha-selector>
                    ` : ''}

                    <!-- Anchor Gap -->
                    <ha-textfield
                        type="number"
                        label="Anchor Gap (pixels)"
                        .value=${String(this._lineFormData.anchor_gap || 0)}
                        @input=${(e) => {
                            this._lineFormData.anchor_gap = Number(e.target.value);
                            this.requestUpdate();
                        }}
                        helper-text="Distance from source connection point"
                        style="margin-top: 12px; width: 100%;">
                    </ha-textfield>
                </lcards-form-section>

                <!-- Target (Attach To) Selection -->
                <lcards-form-section
                    header="Target (Attach To)"
                    description="Ending point for the line"
                    ?expanded=${true}>
                    
                    <ha-selector
                        .hass=${this.hass}
                        .selector=${{
                            select: {
                                options: [
                                    ...anchorOptions,
                                    ...overlayOptions
                                ]
                            }
                        }}
                        .value=${this._lineFormData.attach_to}
                        .label=${'Select Anchor or Overlay'}
                        @value-changed=${(e) => {
                            this._lineFormData.attach_to = e.detail.value;
                            this.requestUpdate();
                        }}
                        style="margin-top: 12px;">
                    </ha-selector>

                    ${attachToIsOverlay ? html`
                        <!-- Attach Side (only for overlays) -->
                        <ha-selector
                            .hass=${this.hass}
                            .selector=${{
                                select: {
                                    options: [
                                        { value: 'center', label: 'Center' },
                                        { value: 'top', label: 'Top' },
                                        { value: 'bottom', label: 'Bottom' },
                                        { value: 'left', label: 'Left' },
                                        { value: 'right', label: 'Right' },
                                        { value: 'top-left', label: 'Top Left' },
                                        { value: 'top-right', label: 'Top Right' },
                                        { value: 'bottom-left', label: 'Bottom Left' },
                                        { value: 'bottom-right', label: 'Bottom Right' }
                                    ]
                                }
                            }}
                            .value=${this._lineFormData.attach_side}
                            .label=${'Attach Side'}
                            @value-changed=${(e) => {
                                this._lineFormData.attach_side = e.detail.value;
                                this.requestUpdate();
                            }}
                            style="margin-top: 12px;">
                        </ha-selector>
                    ` : ''}

                    <!-- Attach Gap -->
                    <ha-textfield
                        type="number"
                        label="Attach Gap (pixels)"
                        .value=${String(this._lineFormData.attach_gap || 0)}
                        @input=${(e) => {
                            this._lineFormData.attach_gap = Number(e.target.value);
                            this.requestUpdate();
                        }}
                        helper-text="Distance from target connection point"
                        style="margin-top: 12px; width: 100%;">
                    </ha-textfield>
                </lcards-form-section>

                <!-- Routing Configuration -->
                <lcards-form-section
                    header="Routing"
                    description="Configure how the line is drawn between points"
                    ?expanded=${true}>
                    
                    <ha-selector
                        .hass=${this.hass}
                        .selector=${{
                            select: {
                                options: [
                                    { value: 'auto', label: 'Auto (smart routing)' },
                                    { value: 'direct', label: 'Direct (straight line)' },
                                    { value: 'manhattan', label: 'Manhattan (90° angles)' },
                                    { value: 'orthogonal', label: 'Orthogonal (right angles)' },
                                    { value: 'bezier', label: 'Bezier (curved)' },
                                    { value: 'smart', label: 'Smart (pathfinding)' },
                                    { value: 'grid', label: 'Grid-aligned' }
                                ]
                            }
                        }}
                        .value=${this._lineFormData.route}
                        .label=${'Routing Mode'}
                        @value-changed=${(e) => {
                            this._lineFormData.route = e.detail.value;
                            this.requestUpdate();
                        }}>
                    </ha-selector>
                </lcards-form-section>

                <!-- Enter Connect Mode Button -->
                <ha-button @click=${() => {
                    this._closeLineForm();
                    this._setMode('connect_line');
                }}>
                    <ha-icon icon="mdi:vector-line" slot="icon"></ha-icon>
                    Enter Connect Mode
                </ha-button>
            </div>
        `;
    }

    /**
     * Render Style & Animation subtab (Fixed schema)
     * @returns {TemplateResult}
     * @private
     */
    _renderLineFormStyle() {
        return html`
            <div style="display: flex; flex-direction: column; gap: 16px;">
                <!-- Style Section -->
                <lcards-form-section
                    header="Line Style"
                    description="Configure the visual appearance of the line"
                    ?expanded=${true}>
                    
                    <ha-textfield
                        label="Color"
                        .value=${this._lineFormData.style?.color || 'var(--lcars-orange)'}
                        @input=${(e) => {
                            this._lineFormData.style = { ...this._lineFormData.style, color: e.target.value };
                            this.requestUpdate();
                        }}
                        helper-text="CSS color (e.g., var(--lcars-orange), #FF9900)"
                        style="width: 100%;">
                    </ha-textfield>

                    <ha-selector
                        .hass=${this.hass}
                        .selector=${{
                            number: {
                                min: 1,
                                max: 10,
                                step: 0.5,
                                mode: 'slider'
                            }
                        }}
                        .value=${this._lineFormData.style?.width || 2}
                        .label=${'Width'}
                        @value-changed=${(e) => {
                            this._lineFormData.style = { ...this._lineFormData.style, width: e.detail.value };
                            this.requestUpdate();
                        }}
                        style="margin-top: 12px;">
                    </ha-selector>

                    <ha-textfield
                        label="Dash Array (optional)"
                        .value=${this._lineFormData.style?.dash_array || ''}
                        @input=${(e) => {
                            this._lineFormData.style = { ...this._lineFormData.style, dash_array: e.target.value };
                            this.requestUpdate();
                        }}
                        helper-text="Dash pattern (e.g., '5,5' for dashed, '2,2' for dotted)"
                        style="margin-top: 12px; width: 100%;">
                    </ha-textfield>

                    <ha-selector
                        .hass=${this.hass}
                        .selector=${{
                            select: {
                                options: [
                                    { value: 'none', label: 'None' },
                                    { value: 'arrow', label: 'Arrow' },
                                    { value: 'dot', label: 'Dot' },
                                    { value: 'diamond', label: 'Diamond' },
                                    { value: 'square', label: 'Square' }
                                ]
                            }
                        }}
                        .value=${this._lineFormData.style?.marker_end?.type || 'none'}
                        .label=${'End Marker'}
                        @value-changed=${(e) => {
                            if (e.detail.value === 'none') {
                                this._lineFormData.style = { ...this._lineFormData.style, marker_end: null };
                            } else {
                                this._lineFormData.style = {
                                    ...this._lineFormData.style,
                                    marker_end: { type: e.detail.value, size: 'medium' }
                                };
                            }
                            this.requestUpdate();
                        }}
                        style="margin-top: 12px;">
                    </ha-selector>
                </lcards-form-section>
            </div>
        `;
    }

    // ============================
    // Phase 7: Keyboard Shortcuts & Validation
    // ============================

    /**
     * Handle keyboard shortcuts (Phase 7)
     * @param {KeyboardEvent} e - Keyboard event
     * @private
     */
    _handleKeyDown(e) {
        // Don't interfere with input fields
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'HA-TEXTFIELD') {
            return;
        }

        // Esc - Exit mode or close dialogs
        if (e.key === 'Escape') {
            e.preventDefault();
            if (this._showLineForm) {
                this._closeLineForm();
            } else if (this._showControlForm) {
                this._closeControlForm();
            } else if (this._showAnchorForm) {
                this._closeAnchorForm();
            } else if (this._editingChannelId !== null) {
                this._closeChannelForm();
            } else if (this._activeMode !== MODES.VIEW) {
                this._setMode(MODES.VIEW);
            }
            return;
        }

        // Ctrl+S / Cmd+S - Save config
        if ((e.ctrlKey || e.metaKey) && e.key === 's') {
            e.preventDefault();
            this._handleSave();
            return;
        }

        // Delete - Delete selected item (placeholder for future)
        if (e.key === 'Delete') {
            e.preventDefault();
            // Could implement: delete currently selected anchor/control/line
            lcardsLog.info('[MSDStudio] Delete key pressed - no item selected');
            return;
        }

        // G - Toggle grid
        if (e.key === 'g' || e.key === 'G') {
            e.preventDefault();
            this._debugSettings.grid = !this._debugSettings.grid;
            this._schedulePreviewUpdate();
            return;
        }

        // 1-6 - Switch tabs
        const tabKeys = {
            '1': TABS.BASE_SVG,
            '2': TABS.ANCHORS,
            '3': TABS.CONTROLS,
            '4': TABS.LINES,
            '5': TABS.CHANNELS,
            '6': TABS.DEBUG
        };
        if (tabKeys[e.key]) {
            e.preventDefault();
            this._activeTab = tabKeys[e.key];
            this.requestUpdate();
            return;
        }
    }

    /**
     * Validate current configuration (Phase 7)
     * @returns {Array} Array of validation error objects
     * @private
     */
    _validateConfiguration() {
        const errors = [];
        const msd = this._workingConfig.msd || {};

        // Validate line connections
        const anchors = msd.anchors || {};
        const overlays = msd.overlays || [];
        const lineOverlays = overlays.filter(o => o.type === 'line');

        lineOverlays.forEach(line => {
            // Check if anchor exists
            if (line.anchor && typeof line.anchor === 'string') {
                const anchorExists = anchors[line.anchor] || overlays.find(o => o.id === line.anchor && o.type !== 'line');
                if (!anchorExists) {
                    errors.push({
                        type: 'line',
                        id: line.id,
                        field: 'anchor',
                        message: `Line "${line.id}": Source anchor "${line.anchor}" does not exist`
                    });
                }
            }

            // Check if attach_to exists
            if (line.attach_to && typeof line.attach_to === 'string') {
                const targetExists = anchors[line.attach_to] || overlays.find(o => o.id === line.attach_to && o.type !== 'line');
                if (!targetExists) {
                    errors.push({
                        type: 'line',
                        id: line.id,
                        field: 'attach_to',
                        message: `Line "${line.id}": Target "${line.attach_to}" does not exist`
                    });
                }
            }
        });

        // Validate channel bounds (basic check for positive dimensions)
        const channels = msd.channels || {};
        Object.entries(channels).forEach(([id, channel]) => {
            if (channel.bounds && Array.isArray(channel.bounds)) {
                const [x, y, width, height] = channel.bounds;
                if (width <= 0 || height <= 0) {
                    errors.push({
                        type: 'channel',
                        id,
                        field: 'bounds',
                        message: `Channel "${id}": Width and height must be positive (got ${width}×${height})`
                    });
                }
            }
        });

        // Validate control sizes
        const controlOverlays = overlays.filter(o => o.type === 'control');
        controlOverlays.forEach(control => {
            if (control.size && Array.isArray(control.size)) {
                const [width, height] = control.size;
                if (width <= 0 || height <= 0) {
                    errors.push({
                        type: 'control',
                        id: control.id,
                        field: 'size',
                        message: `Control "${control.id}": Width and height must be positive (got ${width}×${height})`
                    });
                }
            }
        });

        return errors;
    }

    /**
     * Get validation error count (Phase 7)
     * @returns {number}
     * @private
     */
    _getValidationErrorCount() {
        return this._validationErrors.length;
    }

    /**
     * Render validation errors footer (Phase 7)
     * @returns {TemplateResult}
     * @private
     */
    _renderValidationFooter() {
        const errorCount = this._getValidationErrorCount();
        if (errorCount === 0) return '';

        return html`
            <div style="
                padding: 12px 24px;
                background: var(--error-color, #f44336);
                color: white;
                border-top: 1px solid var(--divider-color);
                display: flex;
                align-items: center;
                gap: 12px;
                font-size: 14px;
            ">
                <ha-icon icon="mdi:alert-circle" style="--mdc-icon-size: 20px;"></ha-icon>
                <span><strong>${errorCount}</strong> validation error${errorCount > 1 ? 's' : ''} found</span>
                <ha-button @click=${this._showValidationErrors} style="margin-left: auto;">
                    View Details
                </ha-button>
            </div>
        `;
    }

    /**
     * Show validation errors dialog (Phase 7)
     * @private
     */
    _showValidationErrors() {
        const errorsList = this._validationErrors.map(err => 
            `• ${err.message}`
        ).join('\n');
        
        alert(`Validation Errors:\n\n${errorsList}\n\nPlease fix these issues before saving.`);
    }

    /**
     * Show success toast (Phase 7)
     * @param {string} message - Success message
     * @private
     */
    _showSuccessToast(message) {
        // Simple implementation using alert (can be enhanced with mwc-snackbar)
        const toast = document.createElement('div');
        toast.textContent = message;
        toast.style.cssText = `
            position: fixed;
            bottom: 24px;
            left: 50%;
            transform: translateX(-50%);
            background: var(--success-color, #4caf50);
            color: white;
            padding: 12px 24px;
            border-radius: 4px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.3);
            z-index: 10000;
            font-weight: 500;
        `;
        document.body.appendChild(toast);
        setTimeout(() => {
            toast.remove();
        }, 3000);
    }

    /**
     * Confirm destructive action (Phase 7)
     * @param {string} message - Confirmation message
     * @returns {boolean}
     * @private
     */
    _confirmAction(message) {
        return confirm(message);
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
                    <!-- Help Banner -->
                    <div style="
                        padding: 8px 24px;
                        background: var(--info-color, #2196F3);
                        color: white;
                        display: flex;
                        align-items: center;
                        justify-content: space-between;
                        font-size: 13px;
                    ">
                        <div style="display: flex; align-items: center; gap: 8px;">
                            <ha-icon icon="mdi:information" style="--mdc-icon-size: 18px;"></ha-icon>
                            <span><strong>MSD Configuration Studio</strong> - Full-featured editor for Master Systems Display cards</span>
                        </div>
                        <ha-button style="--mdc-theme-primary: white;" @click=${() => window.open('https://github.com/snootched/LCARdS/tree/main/doc', '_blank')}>
                            <ha-icon icon="mdi:book-open-variant" slot="icon"></ha-icon>
                            Documentation
                        </ha-button>
                    </div>

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
                        <div class="preview-panel mode-${this._activeMode}" 
                             @click=${this._handlePreviewClick}
                             @mousemove=${this._handlePreviewMouseMove}
                             @mouseleave=${this._handlePreviewMouseLeave}>
                            <lcards-msd-live-preview
                                .hass=${this.hass}
                                .config=${this._workingConfig}
                                .debugSettings=${this._getDebugSettings()}
                                .showRefreshButton=${true}>
                            </lcards-msd-live-preview>
                            
                            <!-- Draw Channel Rectangle Overlay -->
                            ${this._renderDrawChannelOverlay()}
                        </div>
                    </div>
                </div>
            </ha-dialog>

            <!-- Anchor Form Dialog (outside main dialog, always available) -->
            ${this._showAnchorForm ? this._renderAnchorFormDialog() : ''}

            <!-- Control Form Dialog (Phase 3) -->
            ${this._showControlForm ? this._renderControlFormDialog() : ''}

            <!-- Line Form Dialog (Phase 4) -->
            ${this._showLineForm ? this._renderLineFormDialog() : ''}
        `;
    }
}

// Register the custom element
customElements.define('lcards-msd-studio-dialog', LCARdSMSDStudioDialog);
