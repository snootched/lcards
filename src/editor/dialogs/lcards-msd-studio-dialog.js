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
            _debugSettings: { type: Object, state: true }
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
            line_paths: true
        };

        // Debounce timer for preview updates
        this._previewUpdateTimer = null;

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

            /* Dialog Sizing */
            .dialog-container {
                width: 95vw;
                height: 90vh;
                display: flex;
                flex-direction: column;
                overflow: hidden;
            }

            /* Header */
            .studio-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 16px 24px;
                background: var(--card-background-color);
                border-bottom: 2px solid var(--divider-color);
            }

            .studio-title {
                display: flex;
                align-items: center;
                gap: 12px;
                font-size: 20px;
                font-weight: 600;
            }

            .studio-actions {
                display: flex;
                gap: 8px;
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
            .studio-content {
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

            /* Footer */
            .studio-footer {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 12px 24px;
                background: var(--card-background-color);
                border-top: 2px solid var(--divider-color);
                font-size: 13px;
            }

            .footer-status {
                display: flex;
                align-items: center;
                gap: 8px;
                color: var(--secondary-text-color);
            }

            .footer-mode {
                display: flex;
                align-items: center;
                gap: 8px;
                padding: 4px 12px;
                background: var(--primary-background-color);
                border-radius: 12px;
                font-weight: 500;
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

            /* Responsive */
            @media (max-width: 1024px) {
                .studio-content {
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

    /**
     * Render Base SVG tab (Phase 2)
     * @returns {TemplateResult}
     * @private
     */
    _renderBaseSvgTab() {
        return this._renderPlaceholder(
            'Base SVG Configuration',
            'Configure the base SVG template for your MSD card. Select from builtin templates or provide a custom SVG. Configure viewBox dimensions and apply filters.',
            'Phase 2',
            'mdi:image'
        );
    }

    /**
     * Render Anchors tab (Phase 2)
     * @returns {TemplateResult}
     * @private
     */
    _renderAnchorsTab() {
        return this._renderPlaceholder(
            'Anchor Management',
            'Create and manage named anchors for positioning overlays. Click on the preview to place anchors, or enter coordinates manually. Anchors serve as reference points for controls and lines.',
            'Phase 2',
            'mdi:map-marker'
        );
    }

    /**
     * Render Controls tab (Phase 3)
     * @returns {TemplateResult}
     * @private
     */
    _renderControlsTab() {
        return this._renderPlaceholder(
            'Control Overlays',
            'Add and configure control overlays to embed Home Assistant cards into your MSD display. Position controls visually, select card types, and configure card properties.',
            'Phase 3',
            'mdi:widgets'
        );
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
            <div class="dialog-container">
                <!-- Header -->
                <div class="studio-header">
                    <div class="studio-title">
                        <ha-icon icon="mdi:monitor-dashboard"></ha-icon>
                        <span>MSD Configuration Studio</span>
                    </div>
                    <div class="studio-actions">
                        <ha-button @click=${this._handleReset}>
                            <ha-icon icon="mdi:restore" slot="icon"></ha-icon>
                            Reset
                        </ha-button>
                        <ha-button @click=${this._handleCancel}>
                            Cancel
                        </ha-button>
                        <ha-button raised @click=${this._handleSave}>
                            <ha-icon icon="mdi:content-save" slot="icon"></ha-icon>
                            Save
                        </ha-button>
                    </div>
                </div>

                <!-- Mode Toolbar -->
                ${this._renderModeToolbar()}

                <!-- Split Panel Content -->
                <div class="studio-content">
                    <!-- Configuration Panel (60%) -->
                    <div class="config-panel">
                        ${this._renderTabNav()}
                        <div class="tab-content">
                            ${this._renderTabContent()}
                        </div>
                    </div>

                    <!-- Preview Panel (40%) -->
                    <div class="preview-panel">
                        <lcards-msd-live-preview
                            .hass=${this.hass}
                            .config=${this._workingConfig}
                            .debugSettings=${this._debugSettings}
                            .showRefreshButton=${true}>
                        </lcards-msd-live-preview>
                    </div>
                </div>

                <!-- Footer -->
                <div class="studio-footer">
                    <div class="footer-status">
                        <ha-icon icon="mdi:check-circle" style="color: var(--success-color);"></ha-icon>
                        <span>Ready</span>
                    </div>
                    <div class="footer-mode">
                        <ha-icon icon=${this._getModeIcon(this._activeMode)}></ha-icon>
                        <span>Mode: ${this._getModeLabel(this._activeMode)}</span>
                    </div>
                </div>
            </div>
        `;
    }
}

// Register the custom element
customElements.define('lcards-msd-studio-dialog', LCARdSMSDStudioDialog);
