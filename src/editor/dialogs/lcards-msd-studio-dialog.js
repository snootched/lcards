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
import { unsafeHTML } from 'lit/directives/unsafe-html.js';
import { lcardsLog } from '../../utils/lcards-logging.js';
import { editorStyles } from '../base/editor-styles.js';
import { OverlayUtils } from '../../msd/renderer/OverlayUtils.js';
import '../components/shared/lcards-form-section.js';
import '../components/shared/lcards-message.js';
import '../components/editors/lcards-color-section.js';
import '../components/editors/lcards-position-picker.js';
import '../components/lcards-msd-live-preview.js';
import '../components/lcards-animation-editor.js';

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
    ROUTING: 'routing'
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
            _svgSourceMode: { type: String, state: true }, // 'asset', 'custom', or 'none'
            _customFiltersEnabled: { type: Boolean, state: true },
            // Anchors Tab Properties
            _showAnchorForm: { type: Boolean, state: true },
            _editingAnchorName: { type: String, state: true },
            _anchorFormName: { type: String, state: true },
            _anchorFormPosition: { type: Array, state: true },
            _anchorFormUnit: { type: String, state: true },
            _showGrid: { type: Boolean, state: true },
            _showGridSettings: { type: Boolean, state: true },  // Popup for grid settings
            _gridSpacing: { type: Number, state: true },
            _snapToGrid: { type: Boolean, state: true },
            _cursorPosition: { type: Object, state: true },  // For crosshair guidelines
            _highlightedAnchor: { type: String, state: true },  // For anchor highlight animation
            _highlightedControl: { type: String, state: true },  // For control highlight animation
            _highlightedLine: { type: String, state: true },  // For line highlight animation
            _highlightedChannel: { type: String, state: true },  // For channel highlight animation
            // Canvas Toolbar Properties
            _canvasToolbarExpanded: { type: Boolean, state: true },
            _showCrosshairs: { type: Boolean, state: true },
            _enableSnapping: { type: Boolean, state: true },
            // Persistent debug overlays
            _showAnchorMarkers: { type: Boolean, state: true },  // Show all anchor markers
            _showBoundingBoxes: { type: Boolean, state: true },  // Show all control bounding boxes
            _showRoutingPaths: { type: Boolean, state: true },  // Show all line routing paths
            _showRoutingChannels: { type: Boolean, state: true },  // Show all routing channel areas
            _showAttachmentPoints: { type: Boolean, state: true },  // Show 9-point attachment grid
            // Controls Tab Properties
            _showControlForm: { type: Boolean, state: true },
            _editingControlId: { type: String, state: true },
            _controlFormId: { type: String, state: true },
            _controlFormPosition: { type: Array, state: true },
            _controlFormSize: { type: Array, state: true },
            _controlFormAttachment: { type: String, state: true },
            _controlFormCard: { type: Object, state: true },
            _controlFormActiveSubtab: { type: String, state: true }, // 'placement' or 'card'
            // Lines Tab Properties (Phase 4 - Fixed to use correct schema)
            _showLineForm: { type: Boolean, state: true },
            _editingLineId: { type: String, state: true },
            _lineFormData: { type: Object, state: true }, // Complete line form data with correct schema
            _lineFormActiveSubtab: { type: String, state: true }, // 'connection' or 'style'
            _connectLineState: { type: Object, state: true }, // { source: null, tempLineElement: null }
            // Channels Tab Properties (Phase 5)
            _editingChannelId: { type: String, state: true },
            _channelFormData: { type: Object, state: true },
            // Drag State (for interactive control dragging)
            _dragState: { type: Object, state: true },
            // Resize State (for interactive control resizing)
            _resizeState: { type: Object, state: true },
            // Anchor Drag State (for interactive anchor dragging)
            _anchorDragState: { type: Object, state: true },
            // Channel Resize State (for interactive channel resizing)
            _channelResizeState: { type: Object, state: true },
            // Line Endpoint Drag State (TEST - for debugging)
            _lineEndpointDragState: { type: Object, state: true }
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
        this._svgSourceMode = 'asset'; // Default to asset library
        this._customFiltersEnabled = false;

        // Anchors Tab State
        this._showAnchorForm = false;
        this._editingAnchorName = null;
        this._anchorFormName = '';
        this._anchorFormPosition = [0, 0];
        this._anchorFormUnit = 'vb';
        this._showGrid = true;  // Enable grid by default
        this._showGridSettings = false;  // Grid settings popup closed by default
        this._gridSpacing = 50;
        this._snapToGrid = false;
        this._showCrosshairs = true;  // Enable crosshairs by default
        this._cursorPosition = null;
        this._highlightedAnchor = null;
        this._showAnchorMarkers = false;
        this._showBoundingBoxes = false;
        this._showRoutingPaths = false;

        // Controls Tab State
        this._showControlForm = false;
        this._editingControlId = null;
        this._controlFormId = '';
        this._controlFormPosition = [0, 0];
        this._controlFormSize = [100, 100];
        this._controlFormAttachment = 'center';
        this._controlFormCard = { type: '' };
        this._controlFormActiveSubtab = 'placement';

        // Lines Tab State (Phase 4)
        this._showLineForm = false;
        this._editingLineId = null;
        this._lineFormData = {
            id: '',
            anchor: '',              // Source: anchor name or control ID
            attach_to: '',           // Target: anchor name or control ID
            anchor_side: 'center',   // Source attachment point (for controls)
            attach_side: 'center',   // Target attachment point (for controls/anchors)
            route: 'auto',           // Routing mode string
            style: {                 // Style object
                color: 'var(--lcars-orange)',
                width: 2,
                dash_array: '',      // e.g., "5,5" for dashed
                marker_end: null     // Optional marker config
            }
        };
        this._lineFormActiveSubtab = 'basic';
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

        // Drag State
        this._dragState = {
            active: false,
            controlId: null,
            startPos: null,
            originalPos: null,
            offsetX: 0,
            offsetY: 0
        };

        // Resize State
        this._resizeState = {
            active: false,
            controlId: null,
            handle: null,  // 'tl', 't', 'tr', 'r', 'br', 'b', 'bl', 'l'
            startPos: null,
            startSize: null,
            startPosition: null
        };

        // Anchor Drag State
        this._anchorDragState = {
            active: false,
            anchorName: null,
            startPos: null,
            originalPos: null
        };

        // Channel Resize State
        this._channelResizeState = {
            active: false,
            channelId: null,
            handle: null,  // 'tl', 't', 'tr', 'r', 'br', 'b', 'bl', 'l'
            startPos: null,
            startBounds: null
        };

        // Line Endpoint Drag State (TEST - for debugging)
        this._lineEndpointDragState = {
            active: false,
            lineId: null,
            endpoint: null,
            startPos: null,
            originalTarget: null
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

        // Add document mouseup listener for drag end
        this._boundMouseUpHandler = this._handleDragEnd.bind(this);
        document.addEventListener('mouseup', this._boundMouseUpHandler);

        // Detect SVG source mode from config
        this._detectSvgSourceMode();

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
        // Remove document mouseup listener
        if (this._boundMouseUpHandler) {
            document.removeEventListener('mouseup', this._boundMouseUpHandler);
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

            /* Canvas Toolbar (Floating) */
            .canvas-toolbar {
                position: absolute;
                top: 12px;
                right: 12px;
                display: flex;
                gap: 8px;
                background: rgba(0, 0, 0, 0.75);
                backdrop-filter: blur(8px);
                border-radius: 24px;
                padding: 8px;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
                z-index: 1000;
                transition: all 0.3s ease;
            }

            .canvas-toolbar.collapsed {
                padding: 8px;
            }

            .canvas-toolbar-toggle {
                width: 40px;
                height: 40px;
                border-radius: 50%;
                background: var(--primary-color);
                border: none;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: all 0.2s;
                flex-shrink: 0;
            }

            .canvas-toolbar-toggle:hover {
                background: var(--primary-color);
                filter: brightness(1.2);
            }

            .canvas-toolbar-toggle ha-icon {
                --mdc-icon-size: 24px;
                color: white;
            }

            .canvas-toolbar-buttons {
                display: flex;
                gap: 4px;
                align-items: center;
            }

            .canvas-toolbar-divider {
                width: 1px;
                height: 32px;
                background: rgba(255, 255, 255, 0.2);
                margin: 0 4px;
            }

            .canvas-toolbar-button {
                width: 40px;
                height: 40px;
                border-radius: 50%;
                background: rgba(255, 255, 255, 0.1);
                border: 2px solid transparent;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: all 0.2s;
                flex-shrink: 0;
            }

            .canvas-toolbar-button:hover {
                background: rgba(255, 255, 255, 0.2);
                border-color: var(--primary-color);
            }

            .canvas-toolbar-button.active {
                background: var(--primary-color);
                border-color: var(--primary-color);
            }

            .canvas-toolbar-button ha-icon {
                --mdc-icon-size: 20px;
                color: white;
            }

            /* Grid Settings Popup */
            .grid-settings-popup {
                position: absolute;
                top: 60px;
                right: 12px;
                width: 280px;
                background: var(--card-background-color);
                border: 1px solid var(--divider-color);
                border-radius: 12px;
                box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
                z-index: 999;
                animation: slideIn 0.2s ease;
            }

            @keyframes slideIn {
                from {
                    opacity: 0;
                    transform: translateY(-10px);
                }
                to {
                    opacity: 1;
                    transform: translateY(0);
                }
            }

            .grid-settings-header {
                display: flex;
                align-items: center;
                justify-content: space-between;
                padding: 12px 16px;
                border-bottom: 1px solid var(--divider-color);
            }

            .grid-settings-content {
                padding: 16px;
                max-height: 400px;
                overflow-y: auto;
            }

            /* Split Panel Layout */
            .studio-layout {
                flex: 1;
                display: grid;
                grid-template-columns: 33.3% 66.6%;
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
                position: relative;
                display: flex;
                flex-direction: column;
                overflow: hidden;
            }

            /* Cursor feedback based on mode */
            .preview-panel.mode-view {
                cursor: default;
            }

            .preview-panel.mode-view.dragging {
                cursor: grabbing !important;
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

            /* Tab Navigation with HA Tab Group */
            ha-tab-group {
                display: block;
                margin-bottom: 12px;
                border-bottom: 2px solid var(--divider-color);
            }

            ha-tab-group-tab ha-icon {
                --mdc-icon-size: 18px;
                margin-right: 8px;
            }

            /* Card Picker Button Styling */
            .card-picker-button {
                height: 80px;
                flex-direction: column;
                --ha-button-text-color: var(--primary-text-color);
            }

            .card-picker-button ha-icon {
                --mdc-icon-size: 32px;
                margin-bottom: 8px;
            }

            .card-picker-button div {
                font-size: 12px;
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

            /* Line Dialog - Connection Flow Layout */
            .line-connection-flow {
                display: grid;
                grid-template-columns: 1fr auto 1fr;
                gap: 16px;
                align-items: start;
                margin: 16px 0;
            }

            .connection-source,
            .connection-target {
                min-width: 0;
            }

            .connection-arrow {
                display: flex;
                align-items: center;
                justify-content: center;
                padding-top: 32px;
                color: var(--lcars-orange);
            }

            .connection-arrow ha-icon {
                --mdc-icon-size: 32px;
            }

            /* Routing Info Panel */
            .routing-info-panel {
                margin-top: 16px;
                padding: 16px;
                background: var(--card-background-color);
                border: 1px solid var(--divider-color);
                border-radius: 8px;
            }

            .routing-info-header {
                display: flex;
                align-items: center;
                gap: 8px;
                font-weight: 600;
                font-size: 14px;
                color: var(--primary-text-color);
                margin-bottom: 8px;
            }

            .routing-info-header ha-icon {
                --mdc-icon-size: 20px;
                color: var(--lcars-orange);
            }

            .routing-info-description {
                font-size: 13px;
                color: var(--secondary-text-color);
                line-height: 1.5;
                margin-bottom: 12px;
            }

            .routing-info-diagram {
                display: flex;
                justify-content: center;
                padding: 12px;
                background: var(--primary-background-color);
                border-radius: 4px;
            }

            .routing-info-diagram svg {
                max-width: 300px;
            }

            /* Routing 2-Column Layout */
            .routing-columns {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 24px;
                align-items: start;
            }

            .routing-mode-column,
            .routing-advanced-column {
                display: flex;
                flex-direction: column;
                gap: 16px;
            }

            /* Responsive */
            /* Interactive Bounding Boxes */
            .interactive-bbox {
                cursor: grab;
                transition: border-color 0.2s, box-shadow 0.2s;
            }

            .interactive-bbox:hover {
                border-color: #00CCFF !important;
                border-width: 3px !important;
                box-shadow: 0 0 12px rgba(0, 204, 255, 0.6);
            }

            .interactive-bbox:active {
                cursor: grabbing;
            }

            .bbox-dragging {
                cursor: grabbing !important;
                border-color: #FF9900 !important;
                border-width: 3px !important;
                box-shadow: 0 0 16px rgba(255, 153, 0, 0.8);
                opacity: 0.8;
            }

            .bbox-resizing {
                border-color: #9900FF !important;
                border-width: 3px !important;
                box-shadow: 0 0 16px rgba(153, 0, 255, 0.8);
                opacity: 0.8;
            }

            /* Resize Handles */
            .resize-handle {
                position: absolute;
                background: white;
                border: 2px solid #0088FF;
                width: 10px;
                height: 10px;
                pointer-events: auto;
                z-index: 1000;
                transition: all 0.2s;
            }

            .resize-handle:hover {
                background: #00CCFF;
                border-color: #00CCFF;
                width: 12px;
                height: 12px;
                box-shadow: 0 0 8px rgba(0, 204, 255, 0.8);
            }

            .resize-handle.active {
                background: #9900FF;
                border-color: #9900FF;
                box-shadow: 0 0 12px rgba(153, 0, 255, 0.8);
            }

            /* Handle positions */
            .resize-handle.tl { top: -5px; left: -5px; cursor: nwse-resize; }
            .resize-handle.t  { top: -5px; left: 50%; transform: translateX(-50%); cursor: ns-resize; }
            .resize-handle.tr { top: -5px; right: -5px; cursor: nesw-resize; }
            .resize-handle.r  { top: 50%; right: -5px; transform: translateY(-50%); cursor: ew-resize; }
            .resize-handle.br { bottom: -5px; right: -5px; cursor: nwse-resize; }
            .resize-handle.b  { bottom: -5px; left: 50%; transform: translateX(-50%); cursor: ns-resize; }
            .resize-handle.bl { bottom: -5px; left: -5px; cursor: nesw-resize; }
            .resize-handle.l  { top: 50%; left: -5px; transform: translateY(-50%); cursor: ew-resize; }

            /* Interactive Anchors */
            .interactive-anchor {
                cursor: grab;
                transition: all 0.2s;
            }

            .interactive-anchor:hover {
                background: #FFFF00 !important;
                width: 16px !important;
                height: 16px !important;
                box-shadow: 0 0 12px rgba(255, 255, 0, 0.8) !important;
            }

            .interactive-anchor:active {
                cursor: grabbing;
            }

            .anchor-dragging {
                cursor: grabbing !important;
                background: #FF9900 !important;
                width: 16px !important;
                height: 16px !important;
                box-shadow: 0 0 16px rgba(255, 153, 0, 0.9) !important;
                opacity: 0.9;
            }

            /* Interactive Channels */
            .interactive-channel {
                transition: border-color 0.2s, box-shadow 0.2s;
            }

            .interactive-channel:hover {
                border-color: #00FFFF !important;
                border-width: 3px !important;
                box-shadow: 0 0 12px rgba(0, 255, 255, 0.6);
            }

            .channel-resizing {
                border-color: #9900FF !important;
                border-width: 3px !important;
                box-shadow: 0 0 16px rgba(153, 0, 255, 0.8);
                opacity: 0.8;
            }

            @media (max-width: 1024px) {
                .studio-layout {
                    grid-template-columns: 1fr;
                    grid-template-rows: 1fr 1fr;
                }

                .config-panel {
                    border-right: none;
                    border-bottom: 2px solid var(--divider-color);
                }

                .line-connection-flow {
                    grid-template-columns: 1fr;
                    gap: 8px;
                }

                .connection-arrow {
                    padding-top: 0;
                    transform: rotate(90deg);
                }

                .routing-columns {
                    grid-template-columns: 1fr;
                    gap: 16px;
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

        // Clear any ongoing drawing/placement state
        if (this._activeMode !== MODES.DRAW_CHANNEL) {
            this._drawChannelState = {
                startPoint: null,
                currentPoint: null,
                drawing: false,
                tempRectElement: null
            };
        }
        if (this._activeMode !== MODES.CONNECT_LINE) {
            this._connectLineState = { source: null, tempLineElement: null };
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
     * Handle main tab change from ha-tab-group
     * @param {CustomEvent} event - Tab change event
     * @private
     */
    _handleMainTabChange(event) {
        event.stopPropagation();
        const tabId = event.target.activeTab?.getAttribute('value');
        if (tabId) {
            this._setActiveTab(tabId);
        }
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
     * Detect SVG source mode from config
     * @private
     */
    _detectSvgSourceMode() {
        const source = this._workingConfig.msd?.base_svg?.source || '';

        if (source === 'none' || source === '') {
            this._svgSourceMode = 'none';
        } else if (source.startsWith('builtin:') || (!source.includes('/') && !source.includes('http'))) {
            this._svgSourceMode = 'asset';
        } else {
            this._svgSourceMode = 'custom';
        }
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
     * Get config value by dot-notation path
     * Required by child components like lcards-color-section
     * @param {string} path - Path like 'style.color'
     * @returns {*} Value at path or undefined
     * @private
     */
    _getConfigValue(path) {
        if (!path) return undefined;

        const keys = path.split('.');
        let value = this._workingConfig;

        for (const key of keys) {
            if (value === null || value === undefined) {
                return undefined;
            }
            value = value[key];
        }

        return value;
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
     * Render canvas toolbar (floating on preview)
     * @returns {TemplateResult}
     * @private
     */
    _renderCanvasToolbar() {
        const modeButtons = [
            { mode: MODES.VIEW, icon: 'mdi:cursor-default', tooltip: 'View Mode' },
            { mode: MODES.PLACE_ANCHOR, icon: 'mdi:map-marker-plus', tooltip: 'Place Anchor' },
            { mode: MODES.PLACE_CONTROL, icon: 'mdi:widgets', tooltip: 'Place Control' },
            { mode: MODES.CONNECT_LINE, icon: 'mdi:vector-line', tooltip: 'Connect Line' },
            { mode: MODES.DRAW_CHANNEL, icon: 'mdi:chart-timeline-variant', tooltip: 'Draw Channel' }
        ];

        const debugToggles = [
            { key: 'snap_to_grid', prop: '_enableSnapping', icon: 'mdi:magnet', tooltip: 'Grid Snapping' },
            { key: 'show_anchor_markers', prop: '_showAnchorMarkers', icon: 'mdi:map-marker', tooltip: 'Anchors' },
            { key: 'show_bounding_boxes', prop: '_showBoundingBoxes', icon: 'mdi:border-outside', tooltip: 'Bounding Boxes' },
            { key: 'show_routing_paths', prop: '_showRoutingPaths', icon: 'mdi:vector-line', tooltip: 'Routing Paths' },
            { key: 'show_channels', prop: '_showRoutingChannels', icon: 'mdi:chart-timeline-variant', tooltip: 'Routing Channels' },
            { key: 'show_attachment_points', prop: '_showAttachmentPoints', icon: 'mdi:target-variant', tooltip: 'Attachment Points' }
        ];

        return html`
            <div class="canvas-toolbar ${this._canvasToolbarExpanded ? '' : 'collapsed'}">
                <!-- Toggle Button -->
                <button
                    class="canvas-toolbar-toggle"
                    @click=${() => { this._canvasToolbarExpanded = !this._canvasToolbarExpanded; this.requestUpdate(); }}
                    title="${this._canvasToolbarExpanded ? 'Collapse Toolbar' : 'Expand Toolbar'}">
                    <ha-icon icon="mdi:${this._canvasToolbarExpanded ? 'chevron-right' : 'tools'}"></ha-icon>
                </button>

                ${this._canvasToolbarExpanded ? html`
                    <div class="canvas-toolbar-buttons">
                        <!-- Mode Controls -->
                        ${modeButtons.map(btn => html`
                            <button
                                class="canvas-toolbar-button ${this._activeMode === btn.mode ? 'active' : ''}"
                                @click=${async (e) => {
                                    e.stopPropagation();
                                    this._setMode(btn.mode);
                                    await this.updateComplete;
                                }}
                                title="${btn.tooltip}">
                                <ha-icon icon="${btn.icon}"></ha-icon>
                            </button>
                        `)}

                        <!-- Divider -->
                        <div class="canvas-toolbar-divider"></div>

                        <!-- Crosshairs Button -->
                        <button
                            class="canvas-toolbar-button ${this._showCrosshairs ? 'active' : ''}"
                            @click=${(e) => { e.stopPropagation(); this._showCrosshairs = !this._showCrosshairs; this.requestUpdate(); }}
                            title="Crosshairs">
                            <ha-icon icon="mdi:crosshairs"></ha-icon>
                        </button>

                        <!-- Grid Settings Button (Special) -->
                        <button
                            class="canvas-toolbar-button ${this._showGrid ? 'active' : ''}"
                            @click=${(e) => {
                                e.stopPropagation();
                                this._showGridSettings = !this._showGridSettings;
                                this.requestUpdate();
                            }}
                            title="Grid Settings">
                            <ha-icon icon="mdi:grid"></ha-icon>
                        </button>

                        <!-- Debug Toggles -->
                        ${debugToggles.map(toggle => html`
                            <button
                                class="canvas-toolbar-button ${this[toggle.prop] ? 'active' : ''}"
                                @click=${(e) => { e.stopPropagation(); this[toggle.prop] = !this[toggle.prop]; this.requestUpdate(); }}
                                title="${toggle.tooltip}">
                                <ha-icon icon="${toggle.icon}"></ha-icon>
                            </button>
                        `)}
                    </div>
                ` : ''}
            </div>
        `;
    }

    /**
     * Render grid settings popup (floating next to toolbar)
     * @returns {TemplateResult}
     * @private
     */
    _renderGridSettingsPopup() {
        if (!this._showGridSettings) return '';

        return html`
            <div class="grid-settings-popup">
                <div class="grid-settings-header">
                    <span style="font-weight: 600; font-size: 14px;">Grid Settings</span>
                    <ha-icon-button
                        @click=${() => { this._showGridSettings = false; this.requestUpdate(); }}
                        style="--mdc-icon-size: 20px;">
                        <ha-icon icon="mdi:close"></ha-icon>
                    </ha-icon-button>
                </div>

                <div class="grid-settings-content">
                    <!-- Enable/Disable Grid -->
                    <ha-formfield label="Show Grid">
                        <ha-switch
                            ?checked=${this._showGrid}
                            @change=${(e) => {
                                this._showGrid = e.target.checked;
                                this._updateDebugSetting('grid', e.target.checked);
                            }}>
                        </ha-switch>
                    </ha-formfield>

                    ${this._showGrid ? html`
                        <!-- Grid Spacing Slider -->
                        <div style="margin-top: 16px;">
                            <ha-selector
                                .hass=${this.hass}
                                .selector=${{
                                    number: {
                                        min: 10,
                                        max: 150,
                                        step: 5,
                                        mode: 'slider'
                                    }
                                }}
                                .value=${this._gridSpacing}
                                .label=${'Grid Size (px)'}
                                @value-changed=${(e) => {
                                    this._gridSpacing = e.detail.value;
                                    this._updateDebugSetting('gridSpacing', e.detail.value);
                                }}>
                            </ha-selector>
                        </div>

                        <!-- Snap to Grid -->
                        <ha-formfield label="Snap to Grid" style="margin-top: 12px;">
                            <ha-switch
                                ?checked=${this._enableSnapping}
                                @change=${(e) => this._enableSnapping = e.target.checked}>
                            </ha-switch>
                        </ha-formfield>

                        <!-- Grid Color -->
                        <div style="margin-top: 12px;">
                            <label style="display: block; margin-bottom: 4px; font-size: 13px;">
                                Grid Color
                            </label>
                            <input
                                type="color"
                                .value=${this._debugSettings.grid_color || '#cccccc'}
                                @input=${(e) => this._updateDebugSetting('grid_color', e.target.value)}
                                style="width: 100%; height: 32px; border: 1px solid var(--divider-color); border-radius: 4px; cursor: pointer;">
                        </div>

                        <!-- Grid Opacity -->
                        <div style="margin-top: 12px;">
                            <ha-selector
                                .hass=${this.hass}
                                .selector=${{
                                    number: {
                                        min: 0.1,
                                        max: 1,
                                        step: 0.1,
                                        mode: 'slider'
                                    }
                                }}
                                .value=${this._debugSettings.grid_opacity || 0.3}
                                .label=${'Grid Opacity'}
                                @value-changed=${(e) => this._updateDebugSetting('grid_opacity', e.detail.value)}>
                            </ha-selector>
                        </div>
                    ` : ''}
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
            { id: TABS.ROUTING, label: 'Routing', icon: 'mdi:routes' }
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
            case TABS.ROUTING:
                return this._renderRoutingTab();
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
     * Handle SVG source mode change
     * @param {string} mode - 'asset', 'custom', or 'none'
     * @private
     */
    _handleSvgSourceModeChange(mode) {
        this._svgSourceMode = mode;

        if (mode === 'none') {
            this._setNestedValue('msd.base_svg.source', 'none');
            // Switch viewBox to custom mode when using none
            if (this._viewBoxMode === 'auto') {
                this._handleViewBoxModeChange('custom');
            }
        } else if (mode === 'asset') {
            // Set to first available SVG or empty
            const svgs = this._getAvailableSvgs();
            if (svgs.length > 0 && this._workingConfig.msd?.base_svg?.source === 'none') {
                this._setNestedValue('msd.base_svg.source', svgs[0].value);
            }
        }

        this._schedulePreviewUpdate();
        this.requestUpdate();
    }

    /**
     * Get available SVGs from AssetManager
     * @returns {Array} Array of {value, label} options
     * @private
     */
    _getAvailableSvgs() {
        const assetManager = window.lcards?.core?.assetManager;
        if (!assetManager) {
            return [{ value: '', label: 'AssetManager not available' }];
        }

        try {
            const svgKeys = assetManager.listAssets('svg');
            const options = svgKeys.map(key => ({
                value: `builtin:${key}`,
                label: key
            }));

            // Sort alphabetically
            options.sort((a, b) => a.label.localeCompare(b.label));

            if (options.length === 0) {
                return [{ value: '', label: 'No SVG assets available' }];
            }

            return options;
        } catch (error) {
            lcardsLog.error('[MSDStudio] Error listing SVG assets:', error);
            return [{ value: '', label: 'Error loading SVG assets' }];
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
                        <!-- Source Mode Selector -->
                        <ha-selector
                            .hass=${this.hass}
                            .selector=${{
                                select: {
                                    options: [
                                        { value: 'asset', label: 'Asset Library' },
                                        { value: 'custom', label: 'Custom Path' },
                                        { value: 'none', label: 'None (ViewBox Only)' }
                                    ]
                                }
                            }}
                            .value=${this._svgSourceMode}
                            .label=${'SVG Source Mode'}
                            @value-changed=${(e) => this._handleSvgSourceModeChange(e.detail.value)}>
                        </ha-selector>

                        <!-- Conditional Content Based on Mode -->
                        ${this._svgSourceMode === 'asset' ? html`
                            <ha-selector
                                .hass=${this.hass}
                                .selector=${{
                                    select: {
                                        mode: 'dropdown',
                                        options: this._getAvailableSvgs()
                                    }
                                }}
                                .value=${baseSvg.source || ''}
                                .label=${'SVG Asset'}
                                @value-changed=${(e) => this._setNestedValue('msd.base_svg.source', e.detail.value)}>
                            </ha-selector>
                        ` : this._svgSourceMode === 'custom' ? html`
                            <ha-textfield
                                label="Custom SVG Path"
                                .value=${baseSvg.source || ''}
                                @input=${(e) => this._setNestedValue('msd.base_svg.source', e.target.value)}
                                helper-text="Enter custom path (e.g., /local/my-ship.svg)">
                            </ha-textfield>
                        ` : html`
                            <ha-alert alert-type="info">
                                No base SVG will be rendered. Overlays will be drawn on a transparent canvas using the viewBox coordinates below.
                                <strong>ViewBox must be configured manually.</strong>
                            </ha-alert>
                        `}
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

                        <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; margin-top: 8px;">
                            <ha-textfield
                                type="number"
                                label="Min X"
                                .value=${String(viewBox[0] || 0)}
                                ?disabled=${this._viewBoxMode === 'auto'}
                                @input=${(e) => this._updateViewBoxValue(0, e.target.value)}>
                            </ha-textfield>
                            <ha-textfield
                                type="number"
                                label="Min Y"
                                .value=${String(viewBox[1] || 0)}
                                ?disabled=${this._viewBoxMode === 'auto'}
                                @input=${(e) => this._updateViewBoxValue(1, e.target.value)}>
                            </ha-textfield>
                            <ha-textfield
                                type="number"
                                label="Width"
                                .value=${String(viewBox[2] || 400)}
                                ?disabled=${this._viewBoxMode === 'auto'}
                                @input=${(e) => this._updateViewBoxValue(2, e.target.value)}>
                            </ha-textfield>
                            <ha-textfield
                                type="number"
                                label="Height"
                                .value=${String(viewBox[3] || 200)}
                                ?disabled=${this._viewBoxMode === 'auto'}
                                @input=${(e) => this._updateViewBoxValue(3, e.target.value)}>
                            </ha-textfield>
                        </div>
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

        // Get base_svg extracted anchors (if any)
        const baseSvgAnchors = this._getBaseSvgAnchors();
        const baseSvgEntries = Object.entries(baseSvgAnchors);

        return html`
            <div style="padding: 8px;">
                <!-- Anchor Actions -->
                <div style="display: flex; gap: 8px; margin-bottom: 16px;">
                    <ha-button @click=${this._openAnchorForm}>
                        <ha-icon icon="mdi:map-marker-plus" slot="icon"></ha-icon>
                        Add Anchor
                    </ha-button>
                    <ha-button @click=${() => this._setMode(MODES.PLACE_ANCHOR)}
                               ?disabled=${this._activeMode === MODES.PLACE_ANCHOR}>
                        <ha-icon icon="mdi:cursor-default-click" slot="icon"></ha-icon>
                        Place on Canvas
                    </ha-button>
                </div>

                <!-- Base SVG Anchors (Read-Only) -->
                ${baseSvgEntries.length > 0 ? html`
                    <lcards-form-section
                        header="Base SVG Anchors"
                        description="Anchors extracted from base SVG (read-only)"
                        icon="mdi:image-marker"
                        ?expanded=${false}
                        style="margin-bottom: 16px;">
                        <lcards-message type="info" style="margin-bottom: 12px;">
                            These anchors are automatically extracted from your base SVG file.
                            You can reference them in control/line overlays but cannot edit them here.
                            <strong>Define custom anchors with the same name to override.</strong>
                        </lcards-message>
                        <div style="display: flex; flex-direction: column; gap: 12px;">
                            ${baseSvgEntries.map(([name, position]) => this._renderBaseSvgAnchorItem(name, position))}
                        </div>
                    </lcards-form-section>
                ` : ''}

                <!-- User Anchors (Editable) -->
                <lcards-form-section
                    header="User Anchors"
                    description="Named reference points for positioning overlays"
                    ?expanded=${true}>
                    ${anchorEntries.length === 0 ? html`
                        <div style="text-align: center; padding: 24px; color: var(--secondary-text-color);">
                            <ha-icon icon="mdi:map-marker-off" style="--mdc-icon-size: 48px; opacity: 0.5;"></ha-icon>
                            <p>No user anchors defined. Click "Add Anchor" or "Place on Canvas" to create one.</p>
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
     * Get anchors extracted from base SVG
     * @returns {Object} Base SVG anchors { name: [x, y] }
     * @private
     */
    _getBaseSvgAnchors() {
        const baseSvgSource = this._workingConfig.msd?.base_svg?.source;

        // Only extract from builtin sources
        if (!baseSvgSource || !baseSvgSource.startsWith('builtin:')) {
            return {};
        }

        // Check if findSvgAnchors is available
        if (!window.lcards?.findSvgAnchors) {
            lcardsLog.warn('[MSDStudio] window.lcards.findSvgAnchors not available');
            return {};
        }

        // Get the SVG content from the live preview
        const livePreview = this.shadowRoot?.querySelector('lcards-msd-live-preview');
        if (!livePreview) return {};

        const livePreviewShadow = livePreview.shadowRoot;
        if (!livePreviewShadow) return {};

        const cardContainer = livePreviewShadow.querySelector('.preview-card-container');
        if (!cardContainer) return {};

        const msdCard = cardContainer.querySelector('lcards-msd-card');
        if (!msdCard) return {};

        const shadowRoot = msdCard.shadowRoot || msdCard.renderRoot;
        if (!shadowRoot) return {};

        const svg = shadowRoot.querySelector('svg');
        if (!svg) return {};

        // Extract SVG content
        const svgContent = svg.outerHTML;
        const extractedAnchors = window.lcards.findSvgAnchors(svgContent);

        // Filter out any anchors that are overridden by user
        const userAnchors = this._workingConfig.msd?.anchors || {};
        const baseSvgAnchors = {};
        for (const [name, position] of Object.entries(extractedAnchors)) {
            if (!userAnchors[name]) {
                baseSvgAnchors[name] = position;
            }
        }

        return baseSvgAnchors;
    }

    /**
     * Render base SVG anchor item (read-only)
     * @param {string} name - Anchor name
     * @param {Array} position - Anchor position [x, y]
     * @returns {TemplateResult}
     * @private
     */
    _renderBaseSvgAnchorItem(name, position) {
        const [x, y] = Array.isArray(position) ? position : [0, 0];

        return html`
            <ha-card style="padding: 12px; background: var(--card-background-color, #fff); opacity: 0.85;">
                <div style="display: flex; align-items: center; gap: 12px;">
                    <ha-icon icon="mdi:image-marker" style="--mdc-icon-size: 32px; color: var(--info-color, #2196F3);"></ha-icon>
                    <div style="flex: 1;">
                        <div style="font-weight: 600; margin-bottom: 4px; display: flex; align-items: center; gap: 8px;">
                            ${name}
                            <span style="font-size: 11px; background: var(--info-color, #2196F3); color: white; padding: 2px 6px; border-radius: 4px;">BASE SVG</span>
                        </div>
                        <div style="font-size: 12px; color: var(--secondary-text-color);">
                            Position: [${x}, ${y}]
                        </div>
                    </div>
                    <div style="display: flex; gap: 8px;">
                        <ha-icon-button
                            @click=${() => this._highlightAnchorInPreview(name)}
                            .label=${'Highlight'}
                            .path=${'M12,2A7,7 0 0,1 19,9C19,11.38 17.19,13.47 14.39,17.31C13.57,18.45 12.61,19.74 12,20.65C11.39,19.74 10.43,18.45 9.61,17.31C6.81,13.47 5,11.38 5,9A7,7 0 0,1 12,2M12,6A3,3 0 0,0 9,9A3,3 0 0,0 12,12A3,3 0 0,0 15,9A3,3 0 0,0 12,6Z'}>
                        </ha-icon-button>
                    </div>
                </div>
            </ha-card>
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
                .heading=${title}
                style="--mdc-dialog-max-width: 600px; --mdc-dialog-min-width: 600px;">
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
                                        { value: 'px', label: 'px' }
                                    ]
                                }
                            }}
                            .value=${this._anchorFormUnit}
                            .label=${'Unit'}
                            @value-changed=${(e) => this._anchorFormUnit = e.detail.value}>
                        </ha-selector>
                    </div>
                </div>

                <div slot="primaryAction">
                    <ha-button @click=${this._saveAnchor}>
                        <ha-icon icon="mdi:content-save" slot="icon"></ha-icon>
                        Save
                    </ha-button>
                </div>

                <div slot="secondaryAction">
                    <ha-button @click=${this._closeAnchorForm} appearance="plain">
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
    async _saveAnchor() {
        // Validate name
        if (!this._anchorFormName || this._anchorFormName.trim() === '') {
            await this._showDialog('Missing Name', 'Anchor name is required', 'error');
            return;
        }

        // Check for duplicate names (only when creating new)
        if (!this._editingAnchorName) {
            const existingAnchors = this._workingConfig.msd?.anchors || {};
            if (existingAnchors[this._anchorFormName]) {
                await this._showDialog('Duplicate Anchor', `Anchor name "${this._anchorFormName}" already exists`, 'error');
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
        lcardsLog.debug('[MSDStudio] Highlight anchor in preview:', name);

        // Set highlighted anchor (triggers re-render with highlight overlay)
        this._highlightedAnchor = name;
        this.requestUpdate();

        // Clear highlight after 2.5 seconds
        setTimeout(() => {
            this._highlightedAnchor = null;
            this.requestUpdate();
        }, 2500);
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
     * Handle preview mousemove for crosshair and draw modes
     * @param {MouseEvent} event - Mouse event
     * @private
     */
    _handlePreviewMouseMove(event) {
        // Handle active drag
        if (this._dragState.active) {
            this._handleDrag(event);
            return;
        }

        // Handle active resize
        if (this._resizeState.active) {
            this._handleResize(event);
            return;
        }

        // Handle active anchor drag
        if (this._anchorDragState.active) {
            this._handleAnchorDrag(event);
            return;
        }

        // Handle active channel resize
        if (this._channelResizeState.active) {
            this._handleChannelResize(event);
            return;
        }

        // Track cursor for crosshair guidelines (when enabled OR in placement modes)
        const shouldTrackCursor = this._showCrosshairs ||
            this._activeMode === MODES.PLACE_ANCHOR ||
            this._activeMode === MODES.PLACE_CONTROL;

        if (shouldTrackCursor) {
            const result = this._getPreviewCoordinatesWithPixels(event);
            if (result) {
                this._cursorPosition = result;
                this.requestUpdate();
            }
        }
        // Track mouse for draw channel rectangle
        else if (this._activeMode === MODES.DRAW_CHANNEL && this._drawChannelState.drawing) {
            const coords = this._getPreviewCoordinates(event);
            if (coords) {
                this._drawChannelState.currentPoint = [coords.x, coords.y];
                this.requestUpdate();
            }
        }
    }

    /**
     * Handle preview mouseleave
     * @private
     */
    _handlePreviewMouseLeave() {
        // Clear crosshair
        this._cursorPosition = null;

        // Clear draw channel current point
        if (this._drawChannelState.drawing) {
            this._drawChannelState.currentPoint = null;
        }

        this.requestUpdate();
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
        this._controlFormActiveSubtab = 'placement';
        this._showControlForm = true;

        // Exit Place Control mode
        this._activeMode = MODES.VIEW;

        this.requestUpdate();
    }

    // ============================
    // Control Drag Methods
    // ============================

    /**
     * Handle drag start on control bounding box
     * @param {MouseEvent} event - Mouse down event
     * @param {string} controlId - Control ID
     * @private
     */
    _handleDragStart(event, controlId) {
        event.stopPropagation();
        event.preventDefault();

        lcardsLog.debug('[MSDStudio] Drag start:', controlId);

        // Find the control
        const control = this._findControl(controlId);
        if (!control) {
            lcardsLog.warn('[MSDStudio] Control not found for drag:', controlId);
            return;
        }

        // Get current position
        const anchors = this._workingConfig.msd?.anchors || {};
        let currentPosition;
        if (control.position && Array.isArray(control.position)) {
            currentPosition = [...control.position];
        } else if (control.anchor) {
            currentPosition = OverlayUtils.resolvePosition(control.anchor, anchors);
            if (!currentPosition) {
                lcardsLog.warn('[MSDStudio] Could not resolve anchor position for drag');
                return;
            }
            currentPosition = [...currentPosition];
        } else {
            lcardsLog.warn('[MSDStudio] Control has no position or anchor');
            return;
        }

        // Get mouse position in ViewBox coordinates
        const coords = this._getPreviewCoordinatesFromMouseEvent(event);
        if (!coords) {
            lcardsLog.warn('[MSDStudio] Could not get coordinates for drag start');
            return;
        }

        // Calculate offset from control position to mouse
        const offsetX = coords.x - currentPosition[0];
        const offsetY = coords.y - currentPosition[1];

        // Set drag state
        this._dragState = {
            active: true,
            controlId,
            startPos: [coords.x, coords.y],
            originalPos: currentPosition,
            offsetX,
            offsetY
        };

        // Add dragging class to preview panel
        const previewPanel = this.shadowRoot.querySelector('.preview-panel');
        if (previewPanel) {
            previewPanel.classList.add('dragging');
        }

        this.requestUpdate();
    }

    /**
     * Handle drag move
     * @param {MouseEvent} event - Mouse move event
     * @private
     */
    _handleDrag(event) {
        if (!this._dragState.active) return;

        // Get mouse position in ViewBox coordinates
        const coords = this._getPreviewCoordinatesFromMouseEvent(event);
        if (!coords) return;

        // Calculate new position with offset
        let newX = coords.x - this._dragState.offsetX;
        let newY = coords.y - this._dragState.offsetY;

        // Apply grid snapping if enabled
        if (this._enableSnapping && this._gridSpacing) {
            newX = Math.round(newX / this._gridSpacing) * this._gridSpacing;
            newY = Math.round(newY / this._gridSpacing) * this._gridSpacing;
        }

        // Update control position
        const control = this._findControl(this._dragState.controlId);
        if (!control) return;

        // Update position (convert anchor to explicit position if needed)
        if (control.anchor) {
            // Convert anchored control to explicitly positioned
            delete control.anchor;
        }
        control.position = [newX, newY];

        this.requestUpdate();
    }

    /**
     * Handle drag end
     * @param {MouseEvent} event - Mouse up event
     * @private
     */
    _handleDragEnd(event) {
        if (!this._dragState.active && !this._resizeState.active && !this._anchorDragState.active && !this._channelResizeState.active) return;

        if (this._dragState.active) {
            lcardsLog.info('[MSDStudio] Drag end:', this._dragState.controlId);

            // Remove dragging class from preview panel
            const previewPanel = this.shadowRoot.querySelector('.preview-panel');
            if (previewPanel) {
                previewPanel.classList.remove('dragging');
            }

            // Clear drag state
            this._dragState = {
                active: false,
                controlId: null,
                startPos: null,
                originalPos: null,
                offsetX: 0,
                offsetY: 0
            };
        }

        if (this._resizeState.active) {
            lcardsLog.info('[MSDStudio] Resize end:', this._resizeState.controlId);

            // Clear resize state
            this._resizeState = {
                active: false,
                controlId: null,
                handle: null,
                startPos: null,
                startSize: null,
                startPosition: null
            };
        }

        if (this._anchorDragState.active) {
            lcardsLog.info('[MSDStudio] Anchor drag end:', this._anchorDragState.anchorName);

            // Clear anchor drag state
            this._anchorDragState = {
                active: false,
                anchorName: null,
                startPos: null,
                originalPos: null
            };
        }

        if (this._channelResizeState.active) {
            lcardsLog.info('[MSDStudio] Channel resize end:', this._channelResizeState.channelId);

            // Clear channel resize state
            this._channelResizeState = {
                active: false,
                channelId: null,
                handle: null,
                startPos: null,
                startBounds: null
            };
        }

        // Schedule preview update to save changes
        this._schedulePreviewUpdate();
        this.requestUpdate();
    }

    // ============================
    // Control Resize Methods
    // ============================

    /**
     * Render resize handles for a control
     * @param {string} controlId - Control ID
     * @param {number} pixelWidth - Width in pixels
     * @param {number} pixelHeight - Height in pixels
     * @param {boolean} isResizing - Whether this control is being resized
     * @returns {TemplateResult}
     * @private
     */
    _renderResizeHandles(controlId, pixelWidth, pixelHeight, isResizing) {
        const handles = ['tl', 't', 'tr', 'r', 'br', 'b', 'bl', 'l'];

        return html`
            ${handles.map(handle => {
                const isActive = isResizing && this._resizeState.handle === handle;
                return html`
                    <div
                        class="resize-handle ${handle} ${isActive ? 'active' : ''}"
                        data-handle="${handle}"
                        @mousedown=${(e) => this._handleResizeStart(e, controlId, handle)}>
                    </div>
                `;
            })}
        `;
    }

    /**
     * Handle resize start on resize handle
     * @param {MouseEvent} event - Mouse down event
     * @param {string} controlId - Control ID
     * @param {string} handle - Handle position ('tl', 't', 'tr', 'r', 'br', 'b', 'bl', 'l')
     * @private
     */
    _handleResizeStart(event, controlId, handle) {
        event.stopPropagation();
        event.preventDefault();

        lcardsLog.debug('[MSDStudio] Resize start:', controlId, handle);

        // Find the control
        const control = this._findControl(controlId);
        if (!control) {
            lcardsLog.warn('[MSDStudio] Control not found for resize:', controlId);
            return;
        }

        // Get current position and size
        const anchors = this._workingConfig.msd?.anchors || {};
        let currentPosition;
        if (control.position && Array.isArray(control.position)) {
            currentPosition = [...control.position];
        } else if (control.anchor) {
            currentPosition = OverlayUtils.resolvePosition(control.anchor, anchors);
            if (!currentPosition) {
                lcardsLog.warn('[MSDStudio] Could not resolve anchor position for resize');
                return;
            }
            currentPosition = [...currentPosition];
        } else {
            lcardsLog.warn('[MSDStudio] Control has no position or anchor');
            return;
        }

        const currentSize = control.size ? [...control.size] : [100, 100];

        // Get mouse position in ViewBox coordinates
        const coords = this._getPreviewCoordinatesFromMouseEvent(event);
        if (!coords) {
            lcardsLog.warn('[MSDStudio] Could not get coordinates for resize start');
            return;
        }

        // Set resize state
        this._resizeState = {
            active: true,
            controlId,
            handle,
            startPos: [coords.x, coords.y],
            startSize: currentSize,
            startPosition: currentPosition
        };

        this.requestUpdate();
    }

    /**
     * Handle resize move
     * @param {MouseEvent} event - Mouse move event
     * @private
     */
    _handleResize(event) {
        if (!this._resizeState.active) return;

        // Get mouse position in ViewBox coordinates
        const coords = this._getPreviewCoordinatesFromMouseEvent(event);
        if (!coords) return;

        // Calculate delta from start
        const deltaX = coords.x - this._resizeState.startPos[0];
        const deltaY = coords.y - this._resizeState.startPos[1];

        // Get control
        const control = this._findControl(this._resizeState.controlId);
        if (!control) return;

        // Convert anchor to explicit position if needed
        if (control.anchor) {
            delete control.anchor;
        }

        // Initialize size if not present
        if (!control.size) {
            control.size = [100, 100];
        }

        const [startWidth, startHeight] = this._resizeState.startSize;
        const [startX, startY] = this._resizeState.startPosition;
        const handle = this._resizeState.handle;

        let newWidth = startWidth;
        let newHeight = startHeight;
        let newX = startX;
        let newY = startY;

        // Apply resize based on handle
        switch (handle) {
            case 'tl': // Top-left corner
                newWidth = startWidth - deltaX;
                newHeight = startHeight - deltaY;
                newX = startX + deltaX;
                newY = startY + deltaY;
                break;
            case 't': // Top edge
                newHeight = startHeight - deltaY;
                newY = startY + deltaY;
                break;
            case 'tr': // Top-right corner
                newWidth = startWidth + deltaX;
                newHeight = startHeight - deltaY;
                newY = startY + deltaY;
                break;
            case 'r': // Right edge
                newWidth = startWidth + deltaX;
                break;
            case 'br': // Bottom-right corner
                newWidth = startWidth + deltaX;
                newHeight = startHeight + deltaY;
                break;
            case 'b': // Bottom edge
                newHeight = startHeight + deltaY;
                break;
            case 'bl': // Bottom-left corner
                newWidth = startWidth - deltaX;
                newHeight = startHeight + deltaY;
                newX = startX + deltaX;
                break;
            case 'l': // Left edge
                newWidth = startWidth - deltaX;
                newX = startX + deltaX;
                break;
        }

        // Apply minimum size constraints
        const minSize = 20;
        if (newWidth < minSize) {
            newWidth = minSize;
            // Adjust position if resizing from left
            if (handle.includes('l')) {
                newX = startX + startWidth - minSize;
            }
        }
        if (newHeight < minSize) {
            newHeight = minSize;
            // Adjust position if resizing from top
            if (handle.includes('t')) {
                newY = startY + startHeight - minSize;
            }
        }

        // Apply grid snapping if enabled (to size)
        if (this._enableSnapping && this._gridSpacing) {
            newWidth = Math.round(newWidth / this._gridSpacing) * this._gridSpacing;
            newHeight = Math.round(newHeight / this._gridSpacing) * this._gridSpacing;
            newX = Math.round(newX / this._gridSpacing) * this._gridSpacing;
            newY = Math.round(newY / this._gridSpacing) * this._gridSpacing;
        }

        // Update control
        control.size = [newWidth, newHeight];
        control.position = [newX, newY];

        this.requestUpdate();
    }

    // ============================
    // Anchor Drag Methods
    // ============================

    /**
     * Handle anchor drag start
     * @param {MouseEvent} event - Mouse down event
     * @param {string} anchorName - Anchor name
     * @private
     */
    _handleAnchorDragStart(event, anchorName) {
        event.stopPropagation();
        event.preventDefault();

        lcardsLog.debug('[MSDStudio] Anchor drag start:', anchorName);

        // Get current anchor position
        const anchors = this._workingConfig.msd?.anchors || {};
        const currentPos = anchors[anchorName];
        if (!currentPos || !Array.isArray(currentPos)) {
            lcardsLog.warn('[MSDStudio] Anchor not found for drag:', anchorName);
            return;
        }

        // Get mouse position in ViewBox coordinates
        const coords = this._getPreviewCoordinatesFromMouseEvent(event);
        if (!coords) {
            lcardsLog.warn('[MSDStudio] Could not get coordinates for anchor drag start');
            return;
        }

        // Set anchor drag state
        this._anchorDragState = {
            active: true,
            anchorName,
            startPos: [coords.x, coords.y],
            originalPos: [...currentPos]
        };

        this.requestUpdate();
    }

    /**
     * Handle anchor drag move
     * @param {MouseEvent} event - Mouse move event
     * @private
     */
    _handleAnchorDrag(event) {
        if (!this._anchorDragState.active) return;

        // Get mouse position in ViewBox coordinates
        const coords = this._getPreviewCoordinatesFromMouseEvent(event);
        if (!coords) return;

        let newX = coords.x;
        let newY = coords.y;

        // Apply grid snapping if enabled
        if (this._enableSnapping && this._gridSpacing) {
            newX = Math.round(newX / this._gridSpacing) * this._gridSpacing;
            newY = Math.round(newY / this._gridSpacing) * this._gridSpacing;
        }

        // Update anchor position
        const anchors = this._workingConfig.msd?.anchors || {};
        if (anchors[this._anchorDragState.anchorName]) {
            anchors[this._anchorDragState.anchorName] = [newX, newY];
            this.requestUpdate();
        }
    }

    /**
     * Handle anchor double-click to edit
     * @param {MouseEvent} event - Double-click event
     * @param {string} anchorName - Anchor name
     * @private
     */
    _handleAnchorDoubleClick(event, anchorName) {
        event.stopPropagation();
        event.preventDefault();

        lcardsLog.debug('[MSDStudio] Anchor double-click:', anchorName);

        // Get anchor position
        const anchors = this._workingConfig.msd?.anchors || {};
        const position = anchors[anchorName];
        if (!position || !Array.isArray(position)) {
            lcardsLog.warn('[MSDStudio] Anchor not found:', anchorName);
            return;
        }

        // Open anchor form in edit mode
        this._editingAnchorName = anchorName;
        this._anchorFormName = anchorName;
        this._anchorFormPosition = [...position];
        this._anchorFormUnit = 'vb';
        this._showAnchorForm = true;

        this.requestUpdate();
    }

    // ============================
    // Channel Resize Methods
    // ============================

    /**
     * Render resize handles for a channel
     * @param {string} channelId - Channel ID
     * @param {number} pixelWidth - Width in pixels
     * @param {number} pixelHeight - Height in pixels
     * @param {boolean} isResizing - Whether this channel is being resized
     * @returns {TemplateResult}
     * @private
     */
    _renderChannelResizeHandles(channelId, pixelWidth, pixelHeight, isResizing) {
        const handles = ['tl', 't', 'tr', 'r', 'br', 'b', 'bl', 'l'];

        return html`
            ${handles.map(handle => {
                const isActive = isResizing && this._channelResizeState.handle === handle;
                return html`
                    <div
                        class="resize-handle ${handle} ${isActive ? 'active' : ''}"
                        data-handle="${handle}"
                        style="background: #00FFAA; border-color: #00FFAA;"
                        @mousedown=${(e) => this._handleChannelResizeStart(e, channelId, handle)}>
                    </div>
                `;
            })}
        `;
    }

    /**
     * Handle channel resize start
     * @param {MouseEvent} event - Mouse down event
     * @param {string} channelId - Channel ID
     * @param {string} handle - Handle position
     * @private
     */
    _handleChannelResizeStart(event, channelId, handle) {
        event.stopPropagation();
        event.preventDefault();

        lcardsLog.debug('[MSDStudio] Channel resize start:', channelId, handle);

        // Get channel
        const channels = this._workingConfig.msd?.channels || {};
        const channel = channels[channelId];
        if (!channel || !channel.bounds) {
            lcardsLog.warn('[MSDStudio] Channel not found or has no bounds:', channelId);
            return;
        }

        // Get mouse position in ViewBox coordinates
        const coords = this._getPreviewCoordinatesFromMouseEvent(event);
        if (!coords) {
            lcardsLog.warn('[MSDStudio] Could not get coordinates for channel resize start');
            return;
        }

        // Set resize state
        this._channelResizeState = {
            active: true,
            channelId,
            handle,
            startPos: [coords.x, coords.y],
            startBounds: [...channel.bounds]
        };

        this.requestUpdate();
    }

    /**
     * Handle channel resize move
     * @param {MouseEvent} event - Mouse move event
     * @private
     */
    _handleChannelResize(event) {
        if (!this._channelResizeState.active) return;

        // Get mouse position in ViewBox coordinates
        const coords = this._getPreviewCoordinatesFromMouseEvent(event);
        if (!coords) return;

        // Calculate delta from start
        const deltaX = coords.x - this._channelResizeState.startPos[0];
        const deltaY = coords.y - this._channelResizeState.startPos[1];

        // Get channel
        const channels = this._workingConfig.msd?.channels || {};
        const channel = channels[this._channelResizeState.channelId];
        if (!channel) return;

        const [startX, startY, startWidth, startHeight] = this._channelResizeState.startBounds;
        const handle = this._channelResizeState.handle;

        let newX = startX;
        let newY = startY;
        let newWidth = startWidth;
        let newHeight = startHeight;

        // Apply resize based on handle (same logic as control resize)
        switch (handle) {
            case 'tl': // Top-left corner
                newWidth = startWidth - deltaX;
                newHeight = startHeight - deltaY;
                newX = startX + deltaX;
                newY = startY + deltaY;
                break;
            case 't': // Top edge
                newHeight = startHeight - deltaY;
                newY = startY + deltaY;
                break;
            case 'tr': // Top-right corner
                newWidth = startWidth + deltaX;
                newHeight = startHeight - deltaY;
                newY = startY + deltaY;
                break;
            case 'r': // Right edge
                newWidth = startWidth + deltaX;
                break;
            case 'br': // Bottom-right corner
                newWidth = startWidth + deltaX;
                newHeight = startHeight + deltaY;
                break;
            case 'b': // Bottom edge
                newHeight = startHeight + deltaY;
                break;
            case 'bl': // Bottom-left corner
                newWidth = startWidth - deltaX;
                newHeight = startHeight + deltaY;
                newX = startX + deltaX;
                break;
            case 'l': // Left edge
                newWidth = startWidth - deltaX;
                newX = startX + deltaX;
                break;
        }

        // Apply minimum size constraints
        const minSize = 50;
        if (newWidth < minSize) {
            newWidth = minSize;
            if (handle.includes('l')) {
                newX = startX + startWidth - minSize;
            }
        }
        if (newHeight < minSize) {
            newHeight = minSize;
            if (handle.includes('t')) {
                newY = startY + startHeight - minSize;
            }
        }

        // Apply grid snapping if enabled
        if (this._enableSnapping && this._gridSpacing) {
            newWidth = Math.round(newWidth / this._gridSpacing) * this._gridSpacing;
            newHeight = Math.round(newHeight / this._gridSpacing) * this._gridSpacing;
            newX = Math.round(newX / this._gridSpacing) * this._gridSpacing;
            newY = Math.round(newY / this._gridSpacing) * this._gridSpacing;
        }

        // Update channel bounds
        channel.bounds = [newX, newY, newWidth, newHeight];

        this.requestUpdate();
    }

    /**
     * Handle channel double-click to edit
     * @param {MouseEvent} event - Double-click event
     * @param {string} channelId - Channel ID
     * @private
     */
    _handleChannelDoubleClick(event, channelId) {
        event.stopPropagation();
        event.preventDefault();

        lcardsLog.debug('[MSDStudio] Channel double-click:', channelId);

        // Get channel
        const channels = this._workingConfig.msd?.channels || {};
        const channel = channels[channelId];
        if (!channel) {
            lcardsLog.warn('[MSDStudio] Channel not found:', channelId);
            return;
        }

        // Open channel form in edit mode
        this._editingChannelId = channelId;
        this._channelFormData = {
            id: channelId,
            type: channel.type || 'bundling',
            bounds: channel.bounds ? [...channel.bounds] : [0, 0, 100, 50],
            priority: channel.priority || 10,
            color: channel.color || '#00FF00'
        };

        this.requestUpdate();
    }

    // ============================
    // Line Endpoint Drag Methods (TEST)
    // ============================

    /**
     * Resolve control position (either direct position or from anchor)
     * @param {Object} control - Control overlay object
     * @returns {Array|null} [x, y] position or null
     * @private
     */
    _resolveControlPosition(control) {
        lcardsLog.debug('[MSDStudio] Resolving control position:', control.id, 'position:', control.position, 'anchor:', control.anchor);
        if (control.position && Array.isArray(control.position)) {
            lcardsLog.debug('[MSDStudio] Control has direct position:', control.position);
            return control.position;
        }

        if (control.anchor) {
            const userAnchors = this._workingConfig.msd?.anchors || {};
            const baseSvgAnchors = this._getBaseSvgAnchors();
            const allAnchors = { ...userAnchors, ...baseSvgAnchors };
            const pos = allAnchors[control.anchor];
            lcardsLog.debug('[MSDStudio] Control resolved from anchor:', control.anchor, '→', pos);
            return pos || null;
        }

        lcardsLog.warn('[MSDStudio] Control has no position or anchor:', control.id);
        return null;
    }

    /**
     * Resolve position with side for controls or anchors
     * Returns the specific attachment point based on side property
     * @param {string} targetId - ID of anchor or control
     * @param {string|null} side - Side specification (e.g., 'top', 'left', 'center', null)
     * @returns {Array|null} [x, y] coordinates or null
     * @private
     */
    _resolvePositionWithSide(targetId, side) {
        const overlays = this._workingConfig.msd?.overlays || [];
        const userAnchors = this._workingConfig.msd?.anchors || {};
        const baseSvgAnchors = this._getBaseSvgAnchors();
        const allAnchors = { ...userAnchors, ...baseSvgAnchors };

        // Check if it's an anchor
        // Anchors are just points - no side offsets (use anchor_gap property instead)
        if (allAnchors[targetId]) {
            return allAnchors[targetId];
        }

        // Check if it's a control
        const control = overlays.find(o => o.id === targetId && o.type === 'control');
        if (control) {
            const pos = this._resolveControlPosition(control);
            if (!pos) return null;

            const [x, y] = pos;
            const size = control.size || [100, 100];
            const [w, h] = size;

            if (!side || side === 'center') {
                return [x + w/2, y + h/2];
            }

            // Return edge point based on side
            switch (side) {
                case 'top': return [x + w/2, y];
                case 'bottom': return [x + w/2, y + h];
                case 'left': return [x, y + h/2];
                case 'right': return [x + w, y + h/2];
                case 'top-left': return [x, y];
                case 'top-right': return [x + w, y];
                case 'bottom-left': return [x, y + h];
                case 'bottom-right': return [x + w, y + h];
                default: return [x + w/2, y + h/2];
            }
        }

        return null;
    }

    /**
     * Get attachment target at coordinates with side detection
     * @param {Array} coords - [x, y] coordinates
     * @returns {Object|null} {type: 'anchor'|'control', id: string, side: string|null} or null
     * @private
     */
    _getAttachmentTargetAt(coords) {
        const [mouseX, mouseY] = coords;
        const threshold = 30; // ViewBox units

        lcardsLog.debug('[MSDStudio] Checking snap at:', mouseX, mouseY);

        // Check controls first (9-point attachment)
        const overlays = this._workingConfig.msd?.overlays || [];
        const controls = overlays.filter(o => o.type === 'control');

        for (const control of controls) {
            const pos = this._resolveControlPosition(control);
            if (!pos) continue;

            const [x, y] = pos;
            const size = control.size || [100, 100];
            const [w, h] = size;

            // 9-point grid: center + 8 edges/corners
            const points = {
                'center': [x + w/2, y + h/2],
                'top': [x + w/2, y],
                'bottom': [x + w/2, y + h],
                'left': [x, y + h/2],
                'right': [x + w, y + h/2],
                'top-left': [x, y],
                'top-right': [x + w, y],
                'bottom-left': [x, y + h],
                'bottom-right': [x + w, y + h]
            };

            for (const [side, [px, py]] of Object.entries(points)) {
                const dist = Math.sqrt(Math.pow(mouseX - px, 2) + Math.pow(mouseY - py, 2));
                if (dist < threshold) {
                    lcardsLog.debug('[MSDStudio] Snap found on control:', control.id, 'side:', side, 'dist:', dist);
                    return { type: 'control', id: control.id, side: side === 'center' ? null : side };
                }
            }
        }

        // Check anchors (single point - gap is controlled by anchor_gap property)
        const userAnchors = this._workingConfig.msd?.anchors || {};
        const baseSvgAnchors = this._getBaseSvgAnchors();
        const allAnchors = { ...userAnchors, ...baseSvgAnchors };

        for (const [name, pos] of Object.entries(allAnchors)) {
            const [x, y] = pos;

            // Anchors are just points - no side attachments
            const dist = Math.sqrt(Math.pow(mouseX - x, 2) + Math.pow(mouseY - y, 2));
            if (dist < threshold) {
                return { type: 'anchor', id: name, side: null };
            }
        }

        return null;
    }

    /**
     * Handle line endpoint drag start (TEST - not connected to events)
     * @param {MouseEvent} event - Mouse down event
     * @param {string} lineId - Line ID
     * @param {string} endpoint - 'start' or 'end'
     * @private
     */
    _handleLineEndpointDragStart(event, lineId, endpoint) {
        event.stopPropagation();
        event.preventDefault();

        lcardsLog.debug('[MSDStudio] Line endpoint drag start:', lineId, endpoint);

        const overlays = this._workingConfig.msd?.overlays || [];
        const line = overlays.find(o => o.id === lineId && o.type === 'line');
        if (!line) {
            lcardsLog.warn('[MSDStudio] Line not found:', lineId);
            return;
        }

        const coords = this._getPreviewCoordinatesFromMouseEvent(event);
        if (!coords) {
            lcardsLog.warn('[MSDStudio] Could not get coordinates');
            return;
        }

        let originalTarget = null;
        if (endpoint === 'start') {
            originalTarget = line.anchor;
        } else if (endpoint === 'end') {
            const attachTo = line.attach_to;
            if (Array.isArray(attachTo)) {
                originalTarget = attachTo[attachTo.length - 1];
            } else {
                originalTarget = attachTo;
            }
        }

        this._lineEndpointDragState = {
            active: true,
            lineId,
            endpoint,
            startPos: [coords.x, coords.y],
            currentPos: [coords.x, coords.y],  // Set immediately so circle renders at start
            originalTarget,
            originalShowAttachmentPoints: this._showAttachmentPoints  // Save original state
        };

        // Enable attachment points during drag
        this._showAttachmentPoints = true;

        // Set up document-level listeners
        const handleMouseMove = (e) => this._handleLineEndpointDrag(e);
        const handleMouseUp = () => {
            this._finishLineEndpointDrag();
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);

            // Restore attachment points state
            const originalState = this._lineEndpointDragState.originalShowAttachmentPoints;
            this._lineEndpointDragState = { active: false, lineId: null, endpoint: null, startPos: null, originalTarget: null };
            this._showAttachmentPoints = originalState;

            this.requestUpdate();
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);

        lcardsLog.debug('[MSDStudio] Line endpoint drag listeners added');
        this.requestUpdate();
    }

    /**
     * Handle line endpoint drag move (TEST - not connected to events)
     * @param {MouseEvent} event - Mouse move event
     * @private
     */
    _handleLineEndpointDrag(event) {
        if (!this._lineEndpointDragState.active) return;

        const coords = this._getPreviewCoordinatesFromMouseEvent(event);
        if (!coords) return;

        this._lineEndpointDragState.currentPos = [coords.x, coords.y];
        this.requestUpdate();
    }

    /**
     * Finish line endpoint drag
     * @private
     */
    _finishLineEndpointDrag() {
        if (!this._lineEndpointDragState.active || !this._lineEndpointDragState.currentPos) return;

        const { lineId, endpoint, currentPos, originalTarget } = this._lineEndpointDragState;

        const target = this._getAttachmentTargetAt(currentPos);
        if (!target) {
            lcardsLog.info('[MSDStudio] No valid target found - canceling drag');
            // No valid target, cancel the drag (don't modify line config)
            return;
        }

        const overlays = this._workingConfig.msd?.overlays || [];
        const line = overlays.find(o => o.id === lineId && o.type === 'line');
        if (!line) return;

        if (endpoint === 'start') {
            // Update anchor
            line.anchor = target.id;

            // Set anchor_side only if attaching to a control (not an anchor point)
            if (target.type === 'control' && target.side) {
                line.anchor_side = target.side;
            } else {
                // Anchor point or center attachment - remove anchor_side
                delete line.anchor_side;
            }

            lcardsLog.info('[MSDStudio] Updated line start to:', target.id, 'side:', target.side);
        } else if (endpoint === 'end') {
            // Update attach_to
            if (typeof line.attach_to === 'string' || !line.attach_to) {
                line.attach_to = target.id;
            } else if (Array.isArray(line.attach_to)) {
                if (line.attach_to.length === 0) {
                    line.attach_to.push(target.id);
                } else {
                    line.attach_to[line.attach_to.length - 1] = target.id;
                }
            }

            // Set attach_side only if attaching to a control (not an anchor point)
            if (target.type === 'control' && target.side) {
                line.attach_side = target.side;
            } else {
                // Anchor point or center attachment - remove attach_side
                delete line.attach_side;
            }

            lcardsLog.info('[MSDStudio] Updated line end to:', target.id, 'side:', target.side);
        }

        // Force preview update to refresh routing paths
        this._schedulePreviewUpdate();

        // Toggle routing paths to force re-render of overlay
        const wasShowingPaths = this._showRoutingPaths;
        if (wasShowingPaths) {
            this._showRoutingPaths = false;
            this.requestUpdate();
            setTimeout(() => {
                this._showRoutingPaths = true;
                this.requestUpdate();
            }, 50);
        } else {
            this.requestUpdate();
        }
    }

    // ============================
    // Control Double-Click Handler
    // ============================

    /**
     * Handle control double-click to edit
     * @param {MouseEvent} event - Double-click event
     * @param {string} controlId - Control ID
     * @private
     */
    _handleControlDoubleClick(event, controlId) {
        event.stopPropagation();
        event.preventDefault();

        lcardsLog.debug('[MSDStudio] Control double-click:', controlId);

        // Find the control
        const control = this._findControl(controlId);
        if (!control) {
            lcardsLog.warn('[MSDStudio] Control not found:', controlId);
            return;
        }

        // Open control form in edit mode
        this._openControlForm(control);
    }

    /**
     * Find control by ID
     * @param {string} controlId - Control ID
     * @returns {Object|null} Control object or null
     * @private
     */
    _findControl(controlId) {
        const overlays = this._workingConfig.msd?.overlays || [];
        return overlays.find(o => o.id === controlId) || null;
    }

    /**
     * Get preview coordinates from mouse event
     * Helper method specifically for drag operations
     * @param {MouseEvent} event - Mouse event
     * @returns {Object|null} {x, y} in ViewBox coordinates, or null
     * @private
     */
    _getPreviewCoordinatesFromMouseEvent(event) {
        // Find the preview panel
        const previewPanel = this.shadowRoot.querySelector('.preview-panel');
        if (!previewPanel) return null;

        const livePreview = previewPanel.querySelector('lcards-msd-live-preview');
        if (!livePreview) return null;

        const livePreviewShadow = livePreview.shadowRoot;
        if (!livePreviewShadow) return null;

        const cardContainer = livePreviewShadow.querySelector('.preview-card-container');
        if (!cardContainer) return null;

        const msdCard = cardContainer.querySelector('lcards-msd-card');
        if (!msdCard) return null;

        const shadowRoot = msdCard.shadowRoot || msdCard.renderRoot;
        if (!shadowRoot) return null;

        const svg = shadowRoot.querySelector('svg');
        if (!svg) return null;

        // Get viewBox
        const viewBox = this._workingConfig.msd?.view_box;
        let viewBoxX = 0, viewBoxY = 0, viewBoxWidth = 1920, viewBoxHeight = 1200;
        if (Array.isArray(viewBox) && viewBox.length === 4) {
            [viewBoxX, viewBoxY, viewBoxWidth, viewBoxHeight] = viewBox;
        }

        // Get SVG rect
        const rect = svg.getBoundingClientRect();
        const panelRect = previewPanel.getBoundingClientRect();

        // Calculate scale
        const scaleX = viewBoxWidth / rect.width;
        const scaleY = viewBoxHeight / rect.height;
        const scale = Math.max(scaleX, scaleY);

        // Calculate offset
        const renderedWidth = viewBoxWidth / scale;
        const renderedHeight = viewBoxHeight / scale;
        const offsetX = (rect.width - renderedWidth) / 2;
        const offsetY = (rect.height - renderedHeight) / 2;

        // Get mouse position relative to preview panel
        const mouseX = event.clientX - panelRect.left;
        const mouseY = event.clientY - panelRect.top;

        // Convert to SVG pixel coordinates
        const svgLeft = rect.left - panelRect.left;
        const svgTop = rect.top - panelRect.top;
        const svgPixelX = mouseX - svgLeft - offsetX;
        const svgPixelY = mouseY - svgTop - offsetY;

        // Convert to ViewBox coordinates
        const x = svgPixelX * scale + viewBoxX;
        const y = svgPixelY * scale + viewBoxY;

        return { x, y };
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

        // Apply snap-to-grid if enabled (check both toolbar toggle and tab setting)
        const snapEnabled = this._enableSnapping || this._snapToGrid;
        if (snapEnabled) {
            const gridSpacing = this._gridSpacing || 50;
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
     * Get preview coordinates with both pixel and viewBox positions
     * @param {MouseEvent} event - Mouse event
     * @returns {Object|null} - Object with {x, y, pixelX, pixelY} or null
     * @private
     */
    _getPreviewCoordinatesWithPixels(event) {
        const previewPanel = event.currentTarget;
        const livePreview = previewPanel.querySelector('lcards-msd-live-preview');
        if (!livePreview) return null;

        const livePreviewShadow = livePreview.shadowRoot;
        if (!livePreviewShadow) return null;

        const cardContainer = livePreviewShadow.querySelector('.preview-card-container');
        if (!cardContainer) return null;

        const msdCard = cardContainer.querySelector('lcards-msd-card');
        if (!msdCard) return null;

        const shadowRoot = msdCard.shadowRoot || msdCard.renderRoot;
        if (!shadowRoot) return null;

        const svg = shadowRoot.querySelector('svg');
        if (!svg) return null;

        // Get bounding rect of SVG element relative to viewport
        const rect = svg.getBoundingClientRect();

        // Get preview panel rect
        const panelRect = previewPanel.getBoundingClientRect();

        // Calculate mouse position relative to SVG
        const svgX = event.clientX - rect.left;
        const svgY = event.clientY - rect.top;

        // Get viewBox from config
        const viewBox = this._workingConfig.msd?.view_box;
        let vbX = 0, vbY = 0, vbWidth = 1920, vbHeight = 1200;

        if (Array.isArray(viewBox) && viewBox.length === 4) {
            [vbX, vbY, vbWidth, vbHeight] = viewBox;
        } else if (viewBox === 'auto') {
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

        // SVG uses preserveAspectRatio="xMidYMid meet" by default, so we need to use
        // the same scale for both axes (the smaller one) to maintain aspect ratio
        const scale = Math.max(scaleX, scaleY);

        // Calculate the actual rendered size of the viewBox content
        const renderedWidth = vbWidth / scale;
        const renderedHeight = vbHeight / scale;

        // Calculate the offset due to centering (letterboxing/pillarboxing)
        const offsetX = (rect.width - renderedWidth) / 2;
        const offsetY = (rect.height - renderedHeight) / 2;

        // Adjust mouse position to account for letterboxing
        const adjustedSvgX = svgX - offsetX;
        const adjustedSvgY = svgY - offsetY;

        // Convert to unsnapped viewBox coordinates
        let coordX = vbX + (adjustedSvgX * scale);
        let coordY = vbY + (adjustedSvgY * scale);

        // Calculate pixel position relative to preview panel (default: actual mouse position)
        let pixelX = event.clientX - panelRect.left;
        let pixelY = event.clientY - panelRect.top;

        // If snap is enabled, snap viewBox coords and convert back to pixels
        const debugSettings = this._getDebugSettings();
        if (debugSettings.snap_to_grid) {
            const gridSpacing = debugSettings.grid_spacing || 50;
            coordX = Math.round(coordX / gridSpacing) * gridSpacing;
            coordY = Math.round(coordY / gridSpacing) * gridSpacing;

            // Convert snapped viewBox coords back to pixel position relative to SVG
            // Account for letterboxing offset
            const snappedSvgX = (coordX - vbX) / scale + offsetX;
            const snappedSvgY = (coordY - vbY) / scale + offsetY;

            // Convert to preview panel coordinates
            pixelX = (rect.left - panelRect.left) + snappedSvgX;
            pixelY = (rect.top - panelRect.top) + snappedSvgY;
        }

        return {
            x: Math.round(coordX),
            y: Math.round(coordY),
            pixelX,
            pixelY
        };
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
     * Render crosshair guidelines when placing elements
     * @returns {TemplateResult|string}
     * @private
     */
    _renderCrosshairGuidelines() {
        // Show crosshairs if toggle is on OR if in placement mode
        const showCrosshairs = this._showCrosshairs ||
            this._activeMode === MODES.PLACE_ANCHOR ||
            this._activeMode === MODES.PLACE_CONTROL;

        if (!this._cursorPosition || !showCrosshairs) return '';

        let { x, y, pixelX, pixelY } = this._cursorPosition;

        // Calculate snapped coordinates for display
        const snapEnabled = this._enableSnapping || this._snapToGrid;
        let displayX = x;
        let displayY = y;
        let snappedPixelX = pixelX;
        let snappedPixelY = pixelY;

        if (snapEnabled) {
            const gridSpacing = this._gridSpacing || 50;
            displayX = Math.round(x / gridSpacing) * gridSpacing;
            displayY = Math.round(y / gridSpacing) * gridSpacing;

            // Calculate snapped pixel position accounting for letterboxing
            const viewBox = this._workingConfig.msd?.view_box;
            let vbX = 0, vbY = 0, vbWidth = 1920, vbHeight = 1200;
            if (Array.isArray(viewBox) && viewBox.length === 4) {
                [vbX, vbY, vbWidth, vbHeight] = viewBox;
            }

            // Find SVG to get rect and calculate letterboxing
            const previewPanel = this.shadowRoot?.querySelector('.preview-panel');
            if (previewPanel) {
                const livePreview = previewPanel.querySelector('lcards-msd-live-preview');
                if (livePreview?.shadowRoot) {
                    const cardContainer = livePreview.shadowRoot.querySelector('.preview-card-container');
                    if (cardContainer) {
                        const msdCard = cardContainer.querySelector('lcards-msd-card');
                        if (msdCard?.shadowRoot) {
                            const svg = msdCard.shadowRoot.querySelector('svg');
                            if (svg) {
                                const rect = svg.getBoundingClientRect();
                                const panelRect = previewPanel.getBoundingClientRect();

                                // Calculate scale accounting for preserveAspectRatio
                                const scaleX = vbWidth / rect.width;
                                const scaleY = vbHeight / rect.height;
                                const scale = Math.max(scaleX, scaleY);

                                // Calculate rendered size and letterboxing offset
                                const renderedWidth = vbWidth / scale;
                                const renderedHeight = vbHeight / scale;
                                const offsetX = (rect.width - renderedWidth) / 2;
                                const offsetY = (rect.height - renderedHeight) / 2;

                                // Convert snapped viewBox coords to pixel position
                                const snappedSvgX = (displayX - vbX) / scale + offsetX;
                                const snappedSvgY = (displayY - vbY) / scale + offsetY;

                                // Convert to preview panel coordinates
                                snappedPixelX = (rect.left - panelRect.left) + snappedSvgX;
                                snappedPixelY = (rect.top - panelRect.top) + snappedSvgY;
                            }
                        }
                    }
                }
            }
        }

        const lineColor = snapEnabled ? 'rgba(0, 255, 0, 0.5)' : 'rgba(255, 153, 0, 0.5)';

        return html`
            <div style="
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                pointer-events: none;
                z-index: 999;
                overflow: hidden;
            ">
                <!-- Vertical guideline -->
                <div style="
                    position: absolute;
                    left: ${snappedPixelX}px;
                    top: 0;
                    width: 2px;
                    height: 100%;
                    background: ${lineColor};
                    box-shadow: 0 0 4px ${lineColor};
                "></div>

                <!-- X coordinate label on vertical line -->
                <div style="
                    position: absolute;
                    left: ${snappedPixelX}px;
                    top: 8px;
                    transform: translateX(-50%);
                    background: rgba(0, 0, 0, 0.75);
                    color: ${snapEnabled ? '#00FF00' : '#FF9900'};
                    padding: 2px 6px;
                    border-radius: 3px;
                    font-family: 'Courier New', monospace;
                    font-size: 11px;
                    font-weight: 600;
                    white-space: nowrap;
                    box-shadow: 0 1px 4px rgba(0,0,0,0.4);
                ">
                    X: ${displayX}
                </div>

                <!-- Horizontal guideline -->
                <div style="
                    position: absolute;
                    top: ${snappedPixelY}px;
                    left: 0;
                    height: 2px;
                    width: 100%;
                    background: ${lineColor};
                    box-shadow: 0 0 4px ${lineColor};
                "></div>

                <!-- Y coordinate label on horizontal line -->
                <div style="
                    position: absolute;
                    left: 8px;
                    top: ${snappedPixelY}px;
                    transform: translateY(-50%);
                    background: rgba(0, 0, 0, 0.75);
                    color: ${snapEnabled ? '#00FF00' : '#FF9900'};
                    padding: 2px 6px;
                    border-radius: 3px;
                    font-family: 'Courier New', monospace;
                    font-size: 11px;
                    font-weight: 600;
                    white-space: nowrap;
                    box-shadow: 0 1px 4px rgba(0,0,0,0.4);
                ">
                    Y: ${displayY}
                </div>

                <!-- Floating coordinate tooltip near cursor -->
                <div style="
                    position: absolute;
                    left: ${snappedPixelX + 15}px;
                    top: ${snappedPixelY - 30}px;
                    background: rgba(0, 0, 0, 0.85);
                    color: ${snapEnabled ? '#00FF00' : '#FF9900'};
                    padding: 4px 8px;
                    border-radius: 4px;
                    font-family: 'Courier New', monospace;
                    font-size: 11px;
                    font-weight: 600;
                    white-space: nowrap;
                    box-shadow: 0 2px 6px rgba(0,0,0,0.5);
                    pointer-events: none;
                ">
                    ${displayX}, ${displayY}${snapEnabled ? ' ⊞' : ''}
                </div>
            </div>
        `;
    }

    /**
     * Render anchor highlight overlay
     * Shows pulsing highlight around selected anchor
     * @returns {TemplateResult}
     * @private
     */
    _renderAnchorHighlight() {
        if (!this._highlightedAnchor) return '';

        // Find the anchor in user-defined anchors first
        const userAnchors = this._workingConfig.msd?.anchors || {};
        let anchorPosition = userAnchors[this._highlightedAnchor];

        // If not found in user anchors, check base_svg anchors
        if (!anchorPosition) {
            const baseSvgAnchors = this._getBaseSvgAnchors();
            anchorPosition = baseSvgAnchors[this._highlightedAnchor];
        }

        if (!anchorPosition || !Array.isArray(anchorPosition)) return '';

        const [vbX, vbY] = anchorPosition;

        // We need to convert viewBox coordinates to pixel position
        // This requires finding the SVG element in the live preview
        // For simplicity, we'll use a setTimeout approach to calculate after render

        // Try to find the SVG to calculate pixel position
        const livePreview = this.shadowRoot.querySelector('lcards-msd-live-preview');
        if (!livePreview) return '';

        const livePreviewShadow = livePreview.shadowRoot;
        if (!livePreviewShadow) return '';

        const cardContainer = livePreviewShadow.querySelector('.preview-card-container');
        if (!cardContainer) return '';

        const msdCard = cardContainer.querySelector('lcards-msd-card');
        if (!msdCard) return '';

        const shadowRoot = msdCard.shadowRoot || msdCard.renderRoot;
        if (!shadowRoot) return '';

        const svg = shadowRoot.querySelector('svg');
        if (!svg) return '';

        // Get viewBox from config
        const viewBox = this._workingConfig.msd?.view_box;
        let viewBoxX = 0, viewBoxY = 0, viewBoxWidth = 1920, viewBoxHeight = 1200;

        if (Array.isArray(viewBox) && viewBox.length === 4) {
            [viewBoxX, viewBoxY, viewBoxWidth, viewBoxHeight] = viewBox;
        }

        // Get SVG rect and calculate position
        const rect = svg.getBoundingClientRect();
        const previewPanel = this.shadowRoot.querySelector('.preview-panel');
        if (!previewPanel) return '';
        const panelRect = previewPanel.getBoundingClientRect();

        // Calculate scale accounting for aspect ratio
        const scaleX = viewBoxWidth / rect.width;
        const scaleY = viewBoxHeight / rect.height;
        const scale = Math.max(scaleX, scaleY);

        // Calculate rendered dimensions
        const renderedWidth = viewBoxWidth / scale;
        const renderedHeight = viewBoxHeight / scale;

        // Calculate offset due to centering
        const offsetX = (rect.width - renderedWidth) / 2;
        const offsetY = (rect.height - renderedHeight) / 2;

        // Convert viewBox coords to SVG pixel position
        const svgPixelX = (vbX - viewBoxX) / scale + offsetX;
        const svgPixelY = (vbY - viewBoxY) / scale + offsetY;

        // Convert to preview panel coordinates
        const pixelX = (rect.left - panelRect.left) + svgPixelX;
        const pixelY = (rect.top - panelRect.top) + svgPixelY;

        return html`
            <div style="
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                pointer-events: none;
                z-index: 998;
            ">
                <!-- Pulsing circle around anchor -->
                <div style="
                    position: absolute;
                    left: ${pixelX}px;
                    top: ${pixelY}px;
                    transform: translate(-50%, -50%);
                    width: 40px;
                    height: 40px;
                    border: 3px solid #FF9900;
                    border-radius: 50%;
                    box-shadow: 0 0 20px rgba(255, 153, 0, 0.8);
                    animation: anchor-pulse 1s ease-in-out infinite;
                "></div>

                <!-- Center dot -->
                <div style="
                    position: absolute;
                    left: ${pixelX}px;
                    top: ${pixelY}px;
                    transform: translate(-50%, -50%);
                    width: 8px;
                    height: 8px;
                    background: #FF9900;
                    border-radius: 50%;
                    box-shadow: 0 0 10px rgba(255, 153, 0, 0.8);
                "></div>

                <!-- Anchor name label -->
                <div style="
                    position: absolute;
                    left: ${pixelX}px;
                    top: ${pixelY - 35}px;
                    transform: translateX(-50%);
                    background: rgba(255, 153, 0, 0.95);
                    color: black;
                    padding: 4px 10px;
                    border-radius: 4px;
                    font-family: 'Courier New', monospace;
                    font-size: 12px;
                    font-weight: 700;
                    white-space: nowrap;
                    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.4);
                ">
                    ${this._highlightedAnchor}
                </div>
            </div>

            <style>
                @keyframes anchor-pulse {
                    0%, 100% {
                        transform: translate(-50%, -50%) scale(1);
                        opacity: 1;
                    }
                    50% {
                        transform: translate(-50%, -50%) scale(1.5);
                        opacity: 0.3;
                    }
                }
            </style>
        `;
    }

    /**
     * Render control highlight overlay
     * Shows pulsing highlight around selected control
     * @returns {TemplateResult}
     * @private
     */
    _renderControlHighlight() {
        if (!this._highlightedControl) return '';

        // Find the control
        const controls = this._workingConfig.msd?.overlays || [];
        const control = controls.find(c => c.id === this._highlightedControl);
        if (!control) return '';

        // Resolve position for both anchored and explicitly positioned controls
        const anchors = this._workingConfig.msd?.anchors || {};
        let resolvedPosition;
        if (control.position && Array.isArray(control.position)) {
            // Explicitly positioned
            resolvedPosition = control.position;
        } else if (control.anchor) {
            // Anchored to a named anchor - resolve using OverlayUtils
            resolvedPosition = OverlayUtils.resolvePosition(control.anchor, anchors);
            if (!resolvedPosition) return '';
        } else {
            return '';
        }

        // Get size - default to 100x100 if not specified
        const size = control.size || [100, 100];
        if (!Array.isArray(size)) return '';

        const [vbX, vbY] = resolvedPosition;
        const [width, height] = size;

        // Get SVG element and calculate pixel positions
        const livePreview = this.shadowRoot.querySelector('lcards-msd-live-preview');
        if (!livePreview) return '';

        const livePreviewShadow = livePreview.shadowRoot;
        if (!livePreviewShadow) return '';

        const cardContainer = livePreviewShadow.querySelector('.preview-card-container');
        if (!cardContainer) return '';

        const msdCard = cardContainer.querySelector('lcards-msd-card');
        if (!msdCard) return '';

        const shadowRoot = msdCard.shadowRoot || msdCard.renderRoot;
        if (!shadowRoot) return '';

        const svg = shadowRoot.querySelector('svg');
        if (!svg) return '';

        // Get viewBox from config
        const viewBox = this._workingConfig.msd?.view_box;
        let viewBoxX = 0, viewBoxY = 0, viewBoxWidth = 1920, viewBoxHeight = 1200;

        if (Array.isArray(viewBox) && viewBox.length === 4) {
            [viewBoxX, viewBoxY, viewBoxWidth, viewBoxHeight] = viewBox;
        }

        // Get SVG rect and calculate position
        const rect = svg.getBoundingClientRect();
        const previewPanel = this.shadowRoot.querySelector('.preview-panel');
        if (!previewPanel) return '';
        const panelRect = previewPanel.getBoundingClientRect();

        // Calculate scale accounting for aspect ratio
        const scaleX = viewBoxWidth / rect.width;
        const scaleY = viewBoxHeight / rect.height;
        const scale = Math.max(scaleX, scaleY);

        // Calculate rendered dimensions
        const renderedWidth = viewBoxWidth / scale;
        const renderedHeight = viewBoxHeight / scale;

        // Calculate offset due to centering
        const offsetX = (rect.width - renderedWidth) / 2;
        const offsetY = (rect.height - renderedHeight) / 2;

        // Convert viewBox coords to SVG pixel position
        const svgPixelX = (vbX - viewBoxX) / scale + offsetX;
        const svgPixelY = (vbY - viewBoxY) / scale + offsetY;
        const pixelWidth = width / scale;
        const pixelHeight = height / scale;

        // Convert to preview panel coordinates
        const pixelX = (rect.left - panelRect.left) + svgPixelX;
        const pixelY = (rect.top - panelRect.top) + svgPixelY;

        return html`
            <div style="
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                pointer-events: none;
                z-index: 998;
            ">
                <!-- Pulsing rectangle around control -->
                <div style="
                    position: absolute;
                    left: ${pixelX}px;
                    top: ${pixelY}px;
                    width: ${pixelWidth}px;
                    height: ${pixelHeight}px;
                    border: 3px solid #FF0099;
                    box-shadow: 0 0 20px rgba(255, 0, 153, 0.8);
                    animation: control-pulse 1s ease-in-out infinite;
                "></div>

                <!-- Control ID label -->
                <div style="
                    position: absolute;
                    left: ${pixelX + pixelWidth / 2}px;
                    top: ${pixelY - 10}px;
                    transform: translate(-50%, -100%);
                    background: rgba(255, 0, 153, 0.95);
                    color: white;
                    padding: 4px 10px;
                    border-radius: 4px;
                    font-family: 'Courier New', monospace;
                    font-size: 12px;
                    font-weight: 700;
                    white-space: nowrap;
                    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.4);
                ">
                    ${control.id}
                </div>
            </div>

            <style>
                @keyframes control-pulse {
                    0%, 100% {
                        opacity: 1;
                        transform: scale(1);
                    }
                    50% {
                        opacity: 0.5;
                        transform: scale(1.05);
                    }
                }
            </style>
        `;
    }

    /**
     * Render line highlight overlay
     * Shows pulsing highlight along selected line path
     * @returns {TemplateResult}
     * @private
     */
    _renderLineHighlight() {
        if (!this._highlightedLine) return '';

        // Find the line in overlays array
        const overlays = this._workingConfig.msd?.overlays || [];
        const lines = overlays.filter(o => o.type === 'line');
        const line = lines.find(l => l.id === this._highlightedLine);
        if (!line || !line.anchor || !line.attach_to) return '';

        // Get anchor positions
        const allAnchors = { ...this._workingConfig.msd?.anchors || {} };

        // Add base_svg anchors
        const baseSvgAnchors = this._getBaseSvgAnchors();
        Object.assign(allAnchors, baseSvgAnchors);

        // Resolve anchor positions (anchor could be an anchor name or overlay ID)
        let startPos = allAnchors[line.anchor];
        if (!startPos) {
            // Try to find in overlays
            const overlays = this._workingConfig.msd?.overlays || [];
            const overlay = overlays.find(o => o.id === line.anchor);
            if (overlay) {
                if (overlay.position) {
                    startPos = overlay.position;
                } else if (overlay.anchor) {
                    startPos = OverlayUtils.resolvePosition(overlay.anchor, allAnchors);
                }
            }
        }

        let endPos = allAnchors[line.attach_to];
        if (!endPos) {
            // Try to find in overlays
            const overlays = this._workingConfig.msd?.overlays || [];
            const overlay = overlays.find(o => o.id === line.attach_to);
            if (overlay) {
                if (overlay.position) {
                    endPos = overlay.position;
                } else if (overlay.anchor) {
                    endPos = OverlayUtils.resolvePosition(overlay.anchor, allAnchors);
                }
            }
        }

        if (!startPos || !endPos) return '';

        const [startX, startY] = startPos;
        const [endX, endY] = endPos;

        // Get SVG element and calculate pixel positions
        const livePreview = this.shadowRoot.querySelector('lcards-msd-live-preview');
        if (!livePreview) return '';

        const livePreviewShadow = livePreview.shadowRoot;
        if (!livePreviewShadow) return '';

        const cardContainer = livePreviewShadow.querySelector('.preview-card-container');
        if (!cardContainer) return '';

        const msdCard = cardContainer.querySelector('lcards-msd-card');
        if (!msdCard) return '';

        const shadowRoot = msdCard.shadowRoot || msdCard.renderRoot;
        if (!shadowRoot) return '';

        const svg = shadowRoot.querySelector('svg');
        if (!svg) return '';

        // Get viewBox from config
        const viewBox = this._workingConfig.msd?.view_box;
        let viewBoxX = 0, viewBoxY = 0, viewBoxWidth = 1920, viewBoxHeight = 1200;

        if (Array.isArray(viewBox) && viewBox.length === 4) {
            [viewBoxX, viewBoxY, viewBoxWidth, viewBoxHeight] = viewBox;
        }

        // Get SVG rect and calculate position
        const rect = svg.getBoundingClientRect();
        const previewPanel = this.shadowRoot.querySelector('.preview-panel');
        if (!previewPanel) return '';
        const panelRect = previewPanel.getBoundingClientRect();

        // Calculate scale accounting for aspect ratio
        const scaleX = viewBoxWidth / rect.width;
        const scaleY = viewBoxHeight / rect.height;
        const scale = Math.max(scaleX, scaleY);

        // Calculate rendered dimensions
        const renderedWidth = viewBoxWidth / scale;
        const renderedHeight = viewBoxHeight / scale;

        // Calculate offset due to centering
        const offsetX = (rect.width - renderedWidth) / 2;
        const offsetY = (rect.height - renderedHeight) / 2;

        // Convert viewBox coords to SVG pixel position
        const pixelStartX = (startX - viewBoxX) / scale + offsetX + (rect.left - panelRect.left);
        const pixelStartY = (startY - viewBoxY) / scale + offsetY + (rect.top - panelRect.top);
        const pixelEndX = (endX - viewBoxX) / scale + offsetX + (rect.left - panelRect.left);
        const pixelEndY = (endY - viewBoxY) / scale + offsetY + (rect.top - panelRect.top);

        return html`
            <div style="
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                pointer-events: none;
                z-index: 998;
            ">
                <svg style="
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                ">
                    <!-- Pulsing line path -->
                    <line
                        x1="${pixelStartX}"
                        y1="${pixelStartY}"
                        x2="${pixelEndX}"
                        y2="${pixelEndY}"
                        stroke="#00FFFF"
                        stroke-width="4"
                        opacity="0.9"
                        style="
                            filter: drop-shadow(0 0 10px rgba(0, 255, 255, 0.8));
                            animation: line-pulse 1s ease-in-out infinite;
                        "
                    />

                    <!-- Start point marker -->
                    <circle
                        cx="${pixelStartX}"
                        cy="${pixelStartY}"
                        r="6"
                        fill="#00FFFF"
                        stroke="white"
                        stroke-width="2"
                    />

                    <!-- End point marker -->
                    <circle
                        cx="${pixelEndX}"
                        cy="${pixelEndY}"
                        r="6"
                        fill="#00FFFF"
                        stroke="white"
                        stroke-width="2"
                    />
                </svg>

                <!-- Line ID label at midpoint -->
                <div style="
                    position: absolute;
                    left: ${(pixelStartX + pixelEndX) / 2}px;
                    top: ${(pixelStartY + pixelEndY) / 2 - 10}px;
                    transform: translate(-50%, -100%);
                    background: rgba(0, 255, 255, 0.95);
                    color: black;
                    padding: 4px 10px;
                    border-radius: 4px;
                    font-family: 'Courier New', monospace;
                    font-size: 12px;
                    font-weight: 700;
                    white-space: nowrap;
                    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.4);
                ">
                    ${line.id}
                </div>
            </div>

            <style>
                @keyframes line-pulse {
                    0%, 100% {
                        opacity: 0.9;
                    }
                    50% {
                        opacity: 0.4;
                    }
                }
            </style>
        `;
    }

    /**
     * Render persistent grid overlay
     * Shows coordinate grid when toggled on in Anchors tab
     * @returns {TemplateResult}
     * @private
     */
    _renderGridOverlay() {
        if (!this._showGrid) return '';

        console.log('[MSDStudio] _renderGridOverlay called, _showGrid:', this._showGrid);

        // Get viewBox from config
        const viewBox = this._workingConfig.msd?.view_box;
        let viewBoxX = 0, viewBoxY = 0, viewBoxWidth = 1920, viewBoxHeight = 1200;

        if (Array.isArray(viewBox) && viewBox.length === 4) {
            [viewBoxX, viewBoxY, viewBoxWidth, viewBoxHeight] = viewBox;
        }

        const gridColor = this._debugSettings.grid_color || '#cccccc';
        const spacing = this._gridSpacing || 50;

        // Generate grid lines - iterate over entire viewBox range
        const verticalLines = [];
        const maxX = viewBoxX + viewBoxWidth;
        for (let x = Math.ceil(viewBoxX / spacing) * spacing; x <= maxX; x += spacing) {
            verticalLines.push(x);
        }

        const horizontalLines = [];
        const maxY = viewBoxY + viewBoxHeight;
        for (let y = Math.ceil(viewBoxY / spacing) * spacing; y <= maxY; y += spacing) {
            horizontalLines.push(y);
        }

        // Get SVG for coordinate conversion
        const livePreview = this.shadowRoot.querySelector('lcards-msd-live-preview');
        if (!livePreview) {
            console.log('[MSDStudio] Could not find lcards-msd-live-preview');
            return '';
        }

        const livePreviewShadow = livePreview.shadowRoot;
        if (!livePreviewShadow) {
            console.log('[MSDStudio] Could not find livePreview.shadowRoot');
            return '';
        }

        const cardContainer = livePreviewShadow.querySelector('.preview-card-container');
        if (!cardContainer) {
            console.log('[MSDStudio] Could not find .preview-card-container');
            return '';
        }

        const msdCard = cardContainer.querySelector('lcards-msd-card');
        if (!msdCard) {
            console.log('[MSDStudio] Could not find lcards-msd-card');
            return '';
        }

        const shadowRoot = msdCard.shadowRoot || msdCard.renderRoot;
        if (!shadowRoot) {
            console.log('[MSDStudio] Could not find msdCard.shadowRoot');
            return '';
        }

        const svg = shadowRoot.querySelector('svg');
        if (!svg) {
            console.log('[MSDStudio] Could not find svg');
            return '';
        }

        console.log('[MSDStudio] Found SVG, calculating grid...');
        console.log('[MSDStudio] Grid lines:', { verticalLines: verticalLines.length, horizontalLines: horizontalLines.length });
        console.log('[MSDStudio] ViewBox:', { viewBoxX, viewBoxY, viewBoxWidth, viewBoxHeight });

        const rect = svg.getBoundingClientRect();
        const previewPanel = this.shadowRoot.querySelector('.preview-panel');
        if (!previewPanel) return '';
        const panelRect = previewPanel.getBoundingClientRect();

        console.log('[MSDStudio] SVG Rect:', rect);
        console.log('[MSDStudio] Panel rect:', panelRect);

        // Calculate scale
        const scaleX = viewBoxWidth / rect.width;
        const scaleY = viewBoxHeight / rect.height;
        const scale = Math.max(scaleX, scaleY);

        console.log('[MSDStudio] Scale:', { scaleX, scaleY, scale });

        const renderedWidth = viewBoxWidth / scale;
        const renderedHeight = viewBoxHeight / scale;
        const offsetX = (rect.width - renderedWidth) / 2;
        const offsetY = (rect.height - renderedHeight) / 2;

        // Calculate preview panel dimensions for full-height/width lines
        const panelWidth = panelRect.width;
        const panelHeight = panelRect.height;

        console.log('[MSDStudio] Rendering grid with', verticalLines.length, 'vertical and', horizontalLines.length, 'horizontal lines');

        // Calculate base_svg boundary position
        const baseSvgLeft = (rect.left - panelRect.left) + offsetX;
        const baseSvgTop = (rect.top - panelRect.top) + offsetY;
        const baseSvgWidth = renderedWidth;
        const baseSvgHeight = renderedHeight;

        // Get grid opacity from settings
        const gridOpacity = this._debugSettings.grid_opacity ?? 0.3;

        return html`
            <div style="
                position: absolute;
                left: ${baseSvgLeft}px;
                top: ${baseSvgTop}px;
                width: ${baseSvgWidth}px;
                height: ${baseSvgHeight}px;
                pointer-events: none;
                z-index: 996;
            ">
                <!-- Base SVG Boundary -->
                <div style="
                    position: absolute;
                    left: 0;
                    top: 0;
                    width: 100%;
                    height: 100%;
                    border: 2px dashed ${gridColor};
                    opacity: ${Math.min(gridOpacity + 0.2, 1.0)};
                "></div>

                <!-- Grid Lines -->
                ${verticalLines.map(x => {
                    const svgPixelX = (x - viewBoxX) / scale;
                    return html`
                        <div style="
                            position: absolute;
                            left: ${svgPixelX}px;
                            top: 0;
                            width: 1px;
                            height: 100%;
                            background: ${gridColor};
                            opacity: ${gridOpacity};
                        "></div>
                    `;
                })}
                ${horizontalLines.map(y => {
                    const svgPixelY = (y - viewBoxY) / scale;
                    return html`
                        <div style="
                            position: absolute;
                            left: 0;
                            top: ${svgPixelY}px;
                            width: 100%;
                            height: 1px;
                            background: ${gridColor};
                            opacity: ${gridOpacity};
                        "></div>
                    `;
                })}
            </div>
        `;
    }

    /**
     * Render persistent anchor markers
     * Shows all anchor positions when toggled on in Anchors tab
     * @returns {TemplateResult}
     * @private
     */
    _renderAnchorMarkers() {
        if (!this._showAnchorMarkers) return '';

        // Get all anchors (user + base_svg)
        const userAnchors = this._workingConfig.msd?.anchors || {};
        const baseSvgAnchors = this._getBaseSvgAnchors();
        const allAnchors = { ...userAnchors, ...baseSvgAnchors };

        if (Object.keys(allAnchors).length === 0) return '';

        // Get SVG for coordinate conversion
        const livePreview = this.shadowRoot.querySelector('lcards-msd-live-preview');
        if (!livePreview) return '';

        const livePreviewShadow = livePreview.shadowRoot;
        if (!livePreviewShadow) return '';

        const cardContainer = livePreviewShadow.querySelector('.preview-card-container');
        if (!cardContainer) return '';

        const msdCard = cardContainer.querySelector('lcards-msd-card');
        if (!msdCard) return '';

        const shadowRoot = msdCard.shadowRoot || msdCard.renderRoot;
        if (!shadowRoot) return '';

        const svg = shadowRoot.querySelector('svg');
        if (!svg) return '';

        const viewBox = this._workingConfig.msd?.view_box;
        let viewBoxX = 0, viewBoxY = 0, viewBoxWidth = 1920, viewBoxHeight = 1200;

        if (Array.isArray(viewBox) && viewBox.length === 4) {
            [viewBoxX, viewBoxY, viewBoxWidth, viewBoxHeight] = viewBox;
        }

        const rect = svg.getBoundingClientRect();
        const previewPanel = this.shadowRoot.querySelector('.preview-panel');
        if (!previewPanel) return '';
        const panelRect = previewPanel.getBoundingClientRect();

        const scaleX = viewBoxWidth / rect.width;
        const scaleY = viewBoxHeight / rect.height;
        const scale = Math.max(scaleX, scaleY);

        const renderedWidth = viewBoxWidth / scale;
        const renderedHeight = viewBoxHeight / scale;
        const offsetX = (rect.width - renderedWidth) / 2;
        const offsetY = (rect.height - renderedHeight) / 2;

        return html`
            <div style="
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                pointer-events: none;
                z-index: 997;
            ">
                ${Object.entries(allAnchors).map(([name, position]) => {
                    if (!Array.isArray(position)) return '';

                    const [vbX, vbY] = position;
                    const svgPixelX = (vbX - viewBoxX) / scale + offsetX;
                    const svgPixelY = (vbY - viewBoxY) / scale + offsetY;
                    const pixelX = (rect.left - panelRect.left) + svgPixelX;
                    const pixelY = (rect.top - panelRect.top) + svgPixelY;

                    const isBaseSvg = !userAnchors[name];
                    const color = isBaseSvg ? '#888888' : '#FFFF00';
                    const isDragging = this._anchorDragState.active && this._anchorDragState.anchorName === name;

                    return html`
                        <!-- Anchor marker -->
                        <div
                            class="${!isBaseSvg ? 'interactive-anchor' : ''} ${isDragging ? 'anchor-dragging' : ''}"
                            data-anchor-name="${name}"
                            style="
                                position: absolute;
                                left: ${pixelX}px;
                                top: ${pixelY}px;
                                transform: translate(-50%, -50%);
                                width: 12px;
                                height: 12px;
                                background: ${color};
                                border: 2px solid white;
                                border-radius: 50%;
                                box-shadow: 0 0 4px rgba(0, 0, 0, 0.5);
                                pointer-events: ${!isBaseSvg ? 'auto' : 'none'};
                            "
                            @mousedown=${!isBaseSvg ? (e) => this._handleAnchorDragStart(e, name) : null}
                            @dblclick=${!isBaseSvg ? (e) => this._handleAnchorDoubleClick(e, name) : null}>
                        </div>
                        <!-- Anchor label -->
                        <div style="
                            position: absolute;
                            left: ${pixelX}px;
                            top: ${pixelY + 8}px;
                            transform: translateX(-50%);
                            background: rgba(0, 0, 0, 0.7);
                            color: ${color};
                            padding: 2px 6px;
                            border-radius: 3px;
                            font-family: 'Courier New', monospace;
                            font-size: 10px;
                            white-space: nowrap;
                        ">
                            ${name}
                        </div>
                    `;
                })}
            </div>
        `;
    }

    /**
     * Render persistent bounding boxes
     * Shows all control bounding boxes when toggled on in Controls tab
     * @returns {TemplateResult}
     * @private
     */
    _renderBoundingBoxes() {
        if (!this._showBoundingBoxes) return '';

        // Only show bounding boxes for control overlays (not lines)
        const controls = (this._workingConfig.msd?.overlays || [])
            .filter(o => o.type === 'control');
        if (controls.length === 0) return '';

        // Get SVG for coordinate conversion
        const livePreview = this.shadowRoot.querySelector('lcards-msd-live-preview');
        if (!livePreview) return '';

        const livePreviewShadow = livePreview.shadowRoot;
        if (!livePreviewShadow) return '';

        const cardContainer = livePreviewShadow.querySelector('.preview-card-container');
        if (!cardContainer) return '';

        const msdCard = cardContainer.querySelector('lcards-msd-card');
        if (!msdCard) return '';

        const shadowRoot = msdCard.shadowRoot || msdCard.renderRoot;
        if (!shadowRoot) return '';

        const svg = shadowRoot.querySelector('svg');
        if (!svg) return '';

        const viewBox = this._workingConfig.msd?.view_box;
        let viewBoxX = 0, viewBoxY = 0, viewBoxWidth = 1920, viewBoxHeight = 1200;

        if (Array.isArray(viewBox) && viewBox.length === 4) {
            [viewBoxX, viewBoxY, viewBoxWidth, viewBoxHeight] = viewBox;
        }

        const rect = svg.getBoundingClientRect();
        const previewPanel = this.shadowRoot.querySelector('.preview-panel');
        if (!previewPanel) return '';
        const panelRect = previewPanel.getBoundingClientRect();

        const scaleX = viewBoxWidth / rect.width;
        const scaleY = viewBoxHeight / rect.height;
        const scale = Math.max(scaleX, scaleY);

        const renderedWidth = viewBoxWidth / scale;
        const renderedHeight = viewBoxHeight / scale;
        const offsetX = (rect.width - renderedWidth) / 2;
        const offsetY = (rect.height - renderedHeight) / 2;

        // Get all anchors for resolving anchored controls
        const anchors = this._workingConfig.msd?.anchors || {};

        return html`
            <div style="
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                pointer-events: none;
                z-index: 997;
            ">
                ${controls.map(control => {
                    // Resolve position for both anchored and explicitly positioned controls
                    let resolvedPosition;
                    if (control.position && Array.isArray(control.position)) {
                        // Explicitly positioned
                        resolvedPosition = control.position;
                    } else if (control.anchor) {
                        // Anchored to a named anchor - resolve using OverlayUtils
                        resolvedPosition = OverlayUtils.resolvePosition(control.anchor, anchors);
                        if (!resolvedPosition) return '';
                    } else {
                        return '';
                    }

                    // Get size - default to 100x100 if not specified
                    const size = control.size || [100, 100];
                    if (!Array.isArray(size)) return '';

                    const [vbX, vbY] = resolvedPosition;
                    const [width, height] = size;

                    const svgPixelX = (vbX - viewBoxX) / scale + offsetX;
                    const svgPixelY = (vbY - viewBoxY) / scale + offsetY;
                    const pixelWidth = width / scale;
                    const pixelHeight = height / scale;

                    const pixelX = (rect.left - panelRect.left) + svgPixelX;
                    const pixelY = (rect.top - panelRect.top) + svgPixelY;

                    const isDragging = this._dragState.active && this._dragState.controlId === control.id;
                    const isResizing = this._resizeState.active && this._resizeState.controlId === control.id;

                    return html`
                        <!-- Bounding box (interactive) -->
                        <div
                            class="interactive-bbox ${isDragging ? 'bbox-dragging' : ''} ${isResizing ? 'bbox-resizing' : ''}"
                            data-control-id="${control.id}"
                            style="
                                position: absolute;
                                left: ${pixelX}px;
                                top: ${pixelY}px;
                                width: ${pixelWidth}px;
                                height: ${pixelHeight}px;
                                border: 2px solid #0088FF;
                                opacity: 0.6;
                                pointer-events: auto;
                            "
                            @mousedown=${(e) => this._handleDragStart(e, control.id)}
                            @dblclick=${(e) => this._handleControlDoubleClick(e, control.id)}>

                            <!-- Resize Handles -->
                            ${this._renderResizeHandles(control.id, pixelWidth, pixelHeight, isResizing)}
                        </div>
                        <!-- Control ID label -->
                        <div style="
                            position: absolute;
                            left: ${pixelX + 4}px;
                            top: ${pixelY + 4}px;
                            background: rgba(0, 136, 255, 0.8);
                            color: white;
                            padding: 2px 6px;
                            border-radius: 3px;
                            font-family: 'Courier New', monospace;
                            font-size: 10px;
                            white-space: nowrap;
                            pointer-events: none;
                        ">
                            ${control.id}
                        </div>
                    `;
                })}
            </div>
        `;
    }

    /**
     * Render persistent routing paths
     * Shows all line routing paths when toggled on in Lines tab
     * @returns {TemplateResult}
     * @private
     */
    _renderRoutingPaths() {
        if (!this._showRoutingPaths) return '';

        console.log('[MSDStudio] _renderRoutingPaths called, _showRoutingPaths:', this._showRoutingPaths);

        const overlays = this._workingConfig.msd?.overlays || [];
        const lines = overlays.filter(o => o.type === 'line');
        if (lines.length === 0) {
            console.log('[MSDStudio] No line overlays found');
            return '';
        }

        console.log('[MSDStudio] Found', lines.length, 'line overlays');

        // Get all anchors (user + base_svg)
        const userAnchors = this._workingConfig.msd?.anchors || {};
        const baseSvgAnchors = this._getBaseSvgAnchors();
        const allAnchors = { ...userAnchors, ...baseSvgAnchors };

        // Get SVG for coordinate conversion
        const livePreview = this.shadowRoot.querySelector('lcards-msd-live-preview');
        if (!livePreview) return '';

        const livePreviewShadow = livePreview.shadowRoot;
        if (!livePreviewShadow) return '';

        const cardContainer = livePreviewShadow.querySelector('.preview-card-container');
        if (!cardContainer) return '';

        const msdCard = cardContainer.querySelector('lcards-msd-card');
        if (!msdCard) return '';

        const shadowRoot = msdCard.shadowRoot || msdCard.renderRoot;
        if (!shadowRoot) return '';

        const svg = shadowRoot.querySelector('svg');
        if (!svg) return '';

        const viewBox = this._workingConfig.msd?.view_box;
        let viewBoxX = 0, viewBoxY = 0, viewBoxWidth = 1920, viewBoxHeight = 1200;

        if (Array.isArray(viewBox) && viewBox.length === 4) {
            [viewBoxX, viewBoxY, viewBoxWidth, viewBoxHeight] = viewBox;
        }

        const rect = svg.getBoundingClientRect();
        const previewPanel = this.shadowRoot.querySelector('.preview-panel');
        if (!previewPanel) return '';
        const panelRect = previewPanel.getBoundingClientRect();

        const scaleX = viewBoxWidth / rect.width;
        const scaleY = viewBoxHeight / rect.height;
        const scale = Math.max(scaleX, scaleY);

        const renderedWidth = viewBoxWidth / scale;
        const renderedHeight = viewBoxHeight / scale;
        const offsetX = (rect.width - renderedWidth) / 2;
        const offsetY = (rect.height - renderedHeight) / 2;

        return html`
            <div style="
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                pointer-events: none;
                z-index: 997;
            ">
                ${lines.map(line => {
                    // Resolve start position with side support
                    const startPos = this._resolvePositionWithSide(line.anchor, line.anchor_side);
                    if (!startPos) return '';

                    // Resolve end position with side support
                    let endTarget = line.attach_to;
                    if (Array.isArray(endTarget)) {
                        endTarget = endTarget[endTarget.length - 1];
                    }
                    const endPos = this._resolvePositionWithSide(endTarget, line.attach_side);
                    if (!endPos) return '';                    if (!startPos || !endPos) return '';

                    const [startX, startY] = startPos;
                    const [endX, endY] = endPos;

                    const pixelStartX = (startX - viewBoxX) / scale + offsetX + (rect.left - panelRect.left);
                    const pixelStartY = (startY - viewBoxY) / scale + offsetY + (rect.top - panelRect.top);
                    const pixelEndX = (endX - viewBoxX) / scale + offsetX + (rect.left - panelRect.left);
                    const pixelEndY = (endY - viewBoxY) / scale + offsetY + (rect.top - panelRect.top);

                    const color = line.style?.color || '#00FFAA';
                    const length = Math.sqrt(Math.pow(pixelEndX - pixelStartX, 2) + Math.pow(pixelEndY - pixelStartY, 2));
                    const angle = Math.atan2(pixelEndY - pixelStartY, pixelEndX - pixelStartX) * 180 / Math.PI;

                    return html`
                        <!-- Line -->
                        <div style="
                            position: absolute;
                            left: ${pixelStartX}px;
                            top: ${pixelStartY}px;
                            width: ${length}px;
                            height: 2px;
                            background: ${color};
                            opacity: 0.7;
                            transform-origin: 0 0;
                            transform: rotate(${angle}deg);
                        "></div>
                        <!-- Start marker -->
                        <div style="
                            position: absolute;
                            left: ${pixelStartX}px;
                            top: ${pixelStartY}px;
                            width: 8px;
                            height: 8px;
                            background: ${color};
                            border-radius: 50%;
                            transform: translate(-50%, -50%);
                        "></div>
                        <!-- End marker -->
                        <div style="
                            position: absolute;
                            left: ${pixelEndX}px;
                            top: ${pixelEndY}px;
                            width: 8px;
                            height: 8px;
                            background: ${color};
                            border-radius: 50%;
                            transform: translate(-50%, -50%);
                        "></div>
                    `;
                })}
            </div>
        `;
    }

    /**
     * Render line endpoint markers (TEST - adding coordinate conversion)
     * @returns {TemplateResult}
     * @private
     */
    _renderLineEndpointMarkers() {
        if (!this._showRoutingPaths) return '';

        const overlays = this._workingConfig.msd?.overlays || [];
        const lines = overlays.filter(o => o.type === 'line');
        if (lines.length === 0) return '';

        // Get anchors
        const userAnchors = this._workingConfig.msd?.anchors || {};
        const baseSvgAnchors = this._getBaseSvgAnchors();
        const allAnchors = { ...userAnchors, ...baseSvgAnchors };

        // Get coordinate conversion context (same as _renderRoutingPaths)
        const livePreview = this.shadowRoot.querySelector('lcards-msd-live-preview');
        if (!livePreview) return '';

        const livePreviewShadow = livePreview.shadowRoot;
        if (!livePreviewShadow) return '';

        const cardContainer = livePreviewShadow.querySelector('.preview-card-container');
        if (!cardContainer) return '';

        const msdCard = cardContainer.querySelector('lcards-msd-card');
        if (!msdCard) return '';

        const shadowRoot = msdCard.shadowRoot || msdCard.renderRoot;
        if (!shadowRoot) return '';

        const svg = shadowRoot.querySelector('svg');
        if (!svg) return '';

        const viewBox = svg.getAttribute('viewBox')?.split(' ').map(Number);
        if (!viewBox || viewBox.length !== 4) return '';

        const [viewBoxX, viewBoxY, viewBoxWidth, viewBoxHeight] = viewBox;
        const rect = svg.getBoundingClientRect();
        const panelRect = this.shadowRoot.querySelector('.preview-panel')?.getBoundingClientRect();
        if (!panelRect) return '';

        const scale = Math.max(viewBoxWidth / rect.width, viewBoxHeight / rect.height);
        const renderedWidth = viewBoxWidth / scale;
        const renderedHeight = viewBoxHeight / scale;
        const offsetX = (rect.width - renderedWidth) / 2;
        const offsetY = (rect.height - renderedHeight) / 2;

        // Detect overlapping endpoints and calculate offsets for them
        const endpointPositions = new Map(); // key: "x,y", value: array of {line, endpoint, pos}

        lines.forEach(line => {
            // Get start position
            const startPos = this._resolvePositionWithSide(line.anchor, line.anchor_side);
            if (startPos) {
                const key = `${startPos[0]},${startPos[1]}`;
                if (!endpointPositions.has(key)) {
                    endpointPositions.set(key, []);
                }
                endpointPositions.get(key).push({ line, endpoint: 'start', pos: startPos });
            }

            // Get end position
            let endTarget = line.attach_to;
            if (Array.isArray(endTarget)) {
                endTarget = endTarget[endTarget.length - 1];
            }
            const endPos = this._resolvePositionWithSide(endTarget, line.attach_side);
            if (endPos) {
                const key = `${endPos[0]},${endPos[1]}`;
                if (!endpointPositions.has(key)) {
                    endpointPositions.set(key, []);
                }
                endpointPositions.get(key).push({ line, endpoint: 'end', pos: endPos });
            }
        });

        // Calculate offsets for overlapping endpoints (spread in circle)
        const endpointOffsets = new Map(); // key: "lineId:endpoint", value: {dx, dy} in pixels
        endpointPositions.forEach((endpoints, posKey) => {
            if (endpoints.length > 1) {
                // Multiple endpoints at this position - spread them in a circle
                const radius = 16; // pixels
                endpoints.forEach((ep, index) => {
                    const angle = (index / endpoints.length) * 2 * Math.PI;
                    const dx = Math.cos(angle) * radius;
                    const dy = Math.sin(angle) * radius;
                    endpointOffsets.set(`${ep.line.id}:${ep.endpoint}`, { dx, dy });
                });
            }
        });

        // TEST: Add lines.map() loop with simple rendering (no state checks)
        return html`
            <div style="
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                pointer-events: none;
                z-index: 999;
            ">
                ${lines.map(line => {
                    // Get start position with side consideration
                    const startPos = this._resolvePositionWithSide(line.anchor, line.anchor_side);
                    if (!startPos) return '';

                    // Get end position with side consideration
                    let endTarget = line.attach_to;
                    if (Array.isArray(endTarget)) {
                        endTarget = endTarget[endTarget.length - 1];
                    }
                    const endPos = this._resolvePositionWithSide(endTarget, line.attach_side);
                    if (!endPos) return '';

                    // Convert to screen coordinates
                    const [startX, startY] = startPos;
                    const [endX, endY] = endPos;

                    const pixelStartX = (startX - viewBoxX) / scale + offsetX + (rect.left - panelRect.left);
                    const pixelStartY = (startY - viewBoxY) / scale + offsetY + (rect.top - panelRect.top);
                    const pixelEndX = (endX - viewBoxX) / scale + offsetX + (rect.left - panelRect.left);
                    const pixelEndY = (endY - viewBoxY) / scale + offsetY + (rect.top - panelRect.top);

                    // Check if this line is being dragged
                    const isDragging = this._lineEndpointDragState.active && this._lineEndpointDragState.lineId === line.id;
                    const dragEndpoint = isDragging ? this._lineEndpointDragState.endpoint : null;

                    // Get offset for overlapping endpoints
                    const startOffset = endpointOffsets.get(`${line.id}:start`) || { dx: 0, dy: 0 };
                    const endOffset = endpointOffsets.get(`${line.id}:end`) || { dx: 0, dy: 0 };

                    // Calculate drag position if applicable
                    let dragPixelX = 0, dragPixelY = 0;
                    if (isDragging && this._lineEndpointDragState.currentPos) {
                        const [dragX, dragY] = this._lineEndpointDragState.currentPos;
                        dragPixelX = (dragX - viewBoxX) / scale + offsetX + (rect.left - panelRect.left);
                        dragPixelY = (dragY - viewBoxY) / scale + offsetY + (rect.top - panelRect.top);
                    }

                    return html`
                        <div class="line-endpoint-marker start"
                             data-line-id="${line.id}"
                             data-endpoint="start"
                             style="position: absolute;
                                    left: ${(dragEndpoint === 'start' && isDragging ? dragPixelX : pixelStartX) + startOffset.dx}px;
                                    top: ${(dragEndpoint === 'start' && isDragging ? dragPixelY : pixelStartY) + startOffset.dy}px;
                                    width: 12px;
                                    height: 12px;
                                    background: var(--lcars-blue, #9999ff);
                                    border: 2px solid var(--lcars-gold, #ff9900);
                                    border-radius: 50%;
                                    transform: translate(-50%, -50%);
                                    pointer-events: auto;
                                    cursor: move;
                                    z-index: 1000;
                                    transition: all 0.2s;"
                             @mousedown=${(e) => this._handleLineEndpointDragStart(e, line.id, 'start')}
                             @mouseenter=${(e) => {
                                 e.target.style.transform = 'translate(-50%, -50%) scale(1.8)';
                                 e.target.style.zIndex = '1100';
                                 e.target.style.boxShadow = '0 0 12px rgba(153, 153, 255, 0.9), 0 0 20px rgba(153, 153, 255, 0.5)';
                             }}
                             @mouseleave=${(e) => {
                                 e.target.style.transform = 'translate(-50%, -50%) scale(1)';
                                 e.target.style.zIndex = '1000';
                                 e.target.style.boxShadow = 'none';
                             }}>
                        </div>
                        <div class="line-endpoint-marker end"
                             data-line-id="${line.id}"
                             data-endpoint="end"
                             style="position: absolute;
                                    left: ${(dragEndpoint === 'end' && isDragging ? dragPixelX : pixelEndX) + endOffset.dx}px;
                                    top: ${(dragEndpoint === 'end' && isDragging ? dragPixelY : pixelEndY) + endOffset.dy}px;
                                    width: 12px;
                                    height: 12px;
                                    background: var(--lcars-red, #ff6666);
                                    border: 2px solid var(--lcars-gold, #ff9900);
                                    border-radius: 50%;
                                    transform: translate(-50%, -50%);
                                    pointer-events: auto;
                                    cursor: move;
                                    z-index: 1000;
                                    transition: all 0.2s;"
                             @mousedown=${(e) => this._handleLineEndpointDragStart(e, line.id, 'end')}
                             @mouseenter=${(e) => {
                                 e.target.style.transform = 'translate(-50%, -50%) scale(1.8)';
                                 e.target.style.zIndex = '1100';
                                 e.target.style.boxShadow = '0 0 12px rgba(255, 102, 102, 0.9), 0 0 20px rgba(255, 102, 102, 0.5)';
                             }}
                             @mouseleave=${(e) => {
                                 e.target.style.transform = 'translate(-50%, -50%) scale(1)';
                                 e.target.style.zIndex = '1000';
                                 e.target.style.boxShadow = 'none';
                             }}>
                        </div>
                    `;
                })}
            </div>
        `;
    }

    /**
     * Render attach point indicators during line endpoint drag
     * (Not needed - attachment points are controlled by property toggle in drag handlers)
     * @returns {TemplateResult}
     * @private
     */
    _renderDragAttachPoints() {
        return '';
    }

    /**
     * Render persistent routing channels overlay
     * Shows all routing channel areas when toggled on in Lines tab
     * @returns {TemplateResult}
     * @private
     */
    _renderChannelsOverlay() {
        if (!this._showRoutingChannels) return '';

        console.log('[MSDStudio] _renderChannelsOverlay called, _showRoutingChannels:', this._showRoutingChannels);

        const channels = this._workingConfig.msd?.channels || {};
        if (Object.keys(channels).length === 0) {
            console.log('[MSDStudio] No channels found');
            return '';
        }

        console.log('[MSDStudio] Found', Object.keys(channels).length, 'channels');

        // Get SVG for coordinate conversion
        const livePreview = this.shadowRoot.querySelector('lcards-msd-live-preview');
        if (!livePreview) return '';

        const livePreviewShadow = livePreview.shadowRoot;
        if (!livePreviewShadow) return '';

        const cardContainer = livePreviewShadow.querySelector('.preview-card-container');
        if (!cardContainer) return '';

        const msdCard = cardContainer.querySelector('lcards-msd-card');
        if (!msdCard) return '';

        const shadowRoot = msdCard.shadowRoot || msdCard.renderRoot;
        if (!shadowRoot) return '';

        const svg = shadowRoot.querySelector('svg');
        if (!svg) return '';

        const viewBox = this._workingConfig.msd?.view_box;
        let viewBoxX = 0, viewBoxY = 0, viewBoxWidth = 1920, viewBoxHeight = 1200;

        if (Array.isArray(viewBox) && viewBox.length === 4) {
            [viewBoxX, viewBoxY, viewBoxWidth, viewBoxHeight] = viewBox;
        }

        const rect = svg.getBoundingClientRect();
        const previewPanel = this.shadowRoot.querySelector('.preview-panel');
        if (!previewPanel) return '';
        const panelRect = previewPanel.getBoundingClientRect();

        const scaleX = viewBoxWidth / rect.width;
        const scaleY = viewBoxHeight / rect.height;
        const scale = Math.max(scaleX, scaleY);

        const renderedWidth = viewBoxWidth / scale;
        const renderedHeight = viewBoxHeight / scale;
        const offsetX = (rect.width - renderedWidth) / 2;
        const offsetY = (rect.height - renderedHeight) / 2;

        return html`
            <div style="
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                pointer-events: none;
                z-index: 997;
            ">
                ${Object.entries(channels).map(([channelId, channel]) => {
                    if (!channel.bounds || !Array.isArray(channel.bounds) || channel.bounds.length !== 4) return '';

                    const [x, y, width, height] = channel.bounds;

                    const svgPixelX = (x - viewBoxX) / scale + offsetX;
                    const svgPixelY = (y - viewBoxY) / scale + offsetY;
                    const pixelWidth = width / scale;
                    const pixelHeight = height / scale;

                    const pixelX = (rect.left - panelRect.left) + svgPixelX;
                    const pixelY = (rect.top - panelRect.top) + svgPixelY;

                    const color = channel.color || '#00FFAA';
                    const isResizing = this._channelResizeState.active && this._channelResizeState.channelId === channelId;

                    return html`
                        <!-- Channel rectangle (interactive) -->
                        <div
                            class="interactive-channel ${isResizing ? 'channel-resizing' : ''}"
                            data-channel-id="${channelId}"
                            style="
                                position: absolute;
                                left: ${pixelX}px;
                                top: ${pixelY}px;
                                width: ${pixelWidth}px;
                                height: ${pixelHeight}px;
                                border: 2px dashed ${color};
                                background: ${color}22;
                                opacity: 0.6;
                                pointer-events: auto;
                                cursor: grab;
                            "
                            @dblclick=${(e) => this._handleChannelDoubleClick(e, channelId)}>

                            <!-- Resize Handles (only render when not dragging) -->
                            ${this._renderChannelResizeHandles(channelId, pixelWidth, pixelHeight, isResizing)}
                        </div>
                        <!-- Channel ID label -->
                        <div style="
                            position: absolute;
                            left: ${pixelX + 4}px;
                            top: ${pixelY + 4}px;
                            background: ${color};
                            color: black;
                            padding: 2px 6px;
                            border-radius: 3px;
                            font-family: 'Courier New', monospace;
                            font-size: 10px;
                            font-weight: 700;
                            white-space: nowrap;
                            pointer-events: none;
                        ">
                            ${channelId}
                        </div>
                    `;
                })}
            </div>
        `;
    }

    /**
     * Render channel highlight overlay
     * Shows pulsing highlight around selected channel
     * @returns {TemplateResult}
     * @private
     */
    _renderChannelHighlight() {
        if (!this._highlightedChannel) return '';

        // Find the channel
        const channels = this._workingConfig.msd?.channels || {};
        const channel = channels[this._highlightedChannel];
        if (!channel || !channel.bounds) return '';

        const [x, y, width, height] = channel.bounds;

        // Get SVG element and calculate pixel positions
        const livePreview = this.shadowRoot.querySelector('lcards-msd-live-preview');
        if (!livePreview) return '';

        const livePreviewShadow = livePreview.shadowRoot;
        if (!livePreviewShadow) return '';

        const cardContainer = livePreviewShadow.querySelector('.preview-card-container');
        if (!cardContainer) return '';

        const msdCard = cardContainer.querySelector('lcards-msd-card');
        if (!msdCard) return '';

        const shadowRoot = msdCard.shadowRoot || msdCard.renderRoot;
        if (!shadowRoot) return '';

        const svg = shadowRoot.querySelector('svg');
        if (!svg) return '';

        // Get viewBox from config
        const viewBox = this._workingConfig.msd?.view_box;
        let viewBoxX = 0, viewBoxY = 0, viewBoxWidth = 1920, viewBoxHeight = 1200;

        if (Array.isArray(viewBox) && viewBox.length === 4) {
            [viewBoxX, viewBoxY, viewBoxWidth, viewBoxHeight] = viewBox;
        }

        // Get SVG rect and calculate position
        const rect = svg.getBoundingClientRect();
        const previewPanel = this.shadowRoot.querySelector('.preview-panel');
        if (!previewPanel) return '';
        const panelRect = previewPanel.getBoundingClientRect();

        // Calculate scale accounting for aspect ratio
        const scaleX = viewBoxWidth / rect.width;
        const scaleY = viewBoxHeight / rect.height;
        const scale = Math.max(scaleX, scaleY);

        // Calculate rendered dimensions
        const renderedWidth = viewBoxWidth / scale;
        const renderedHeight = viewBoxHeight / scale;

        // Calculate offset due to centering
        const offsetX = (rect.width - renderedWidth) / 2;
        const offsetY = (rect.height - renderedHeight) / 2;

        // Convert viewBox coords to SVG pixel position
        const svgPixelX = (x - viewBoxX) / scale + offsetX;
        const svgPixelY = (y - viewBoxY) / scale + offsetY;
        const pixelWidth = width / scale;
        const pixelHeight = height / scale;

        // Convert to preview panel coordinates
        const pixelX = (rect.left - panelRect.left) + svgPixelX;
        const pixelY = (rect.top - panelRect.top) + svgPixelY;

        return html`
            <div style="
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                pointer-events: none;
                z-index: 998;
            ">
                <!-- Pulsing rectangle around channel -->
                <div style="
                    position: absolute;
                    left: ${pixelX}px;
                    top: ${pixelY}px;
                    width: ${pixelWidth}px;
                    height: ${pixelHeight}px;
                    border: 3px solid #FFAA00;
                    box-shadow: 0 0 20px rgba(255, 170, 0, 0.8);
                    animation: channel-pulse 1s ease-in-out infinite;
                "></div>

                <!-- Channel ID label -->
                <div style="
                    position: absolute;
                    left: ${pixelX + pixelWidth / 2}px;
                    top: ${pixelY - 10}px;
                    transform: translate(-50%, -100%);
                    background: rgba(255, 170, 0, 0.95);
                    color: black;
                    padding: 4px 10px;
                    border-radius: 4px;
                    font-family: 'Courier New', monospace;
                    font-size: 12px;
                    font-weight: 700;
                    white-space: nowrap;
                    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.4);
                ">
                    ${this._highlightedChannel}
                </div>
            </div>

            <style>
                @keyframes channel-pulse {
                    0%, 100% {
                        opacity: 1;
                        transform: scale(1);
                    }
                    50% {
                        opacity: 0.5;
                        transform: scale(1.03);
                    }
                }
            </style>
        `;
    }

    /**
     * Render connection attachment points overlay
     * Shows 9-point attachment grid for anchors and controls in connect line mode
     * @returns {TemplateResult}
     * @private
     */
    _renderAttachmentPointsOverlay() {
        // Show attachment points when in connect line mode OR when toggle is on
        if (this._activeMode !== MODES.CONNECT_LINE && !this._showAttachmentPoints) return '';

        // Get all anchors (user-defined + base SVG) and controls
        const userAnchors = this._workingConfig.msd?.anchors || {};
        const baseSvgAnchors = this._getBaseSvgAnchors();
        const anchors = { ...baseSvgAnchors, ...userAnchors };  // Merge, user anchors override
        const controls = this._getControlOverlays();

        // Try to find the SVG to calculate pixel positions
        const livePreview = this.shadowRoot?.querySelector('lcards-msd-live-preview');
        if (!livePreview) return '';

        const livePreviewShadow = livePreview.shadowRoot;
        if (!livePreviewShadow) return '';

        const cardContainer = livePreviewShadow.querySelector('.preview-card-container');
        if (!cardContainer) return '';

        const msdCard = cardContainer.querySelector('lcards-msd-card');
        if (!msdCard) return '';

        const shadowRoot = msdCard.shadowRoot || msdCard.renderRoot;
        if (!shadowRoot) return '';

        const svg = shadowRoot.querySelector('svg');
        if (!svg) return '';

        // Get viewBox from config
        const viewBox = this._workingConfig.msd?.view_box;
        let viewBoxX = 0, viewBoxY = 0, viewBoxWidth = 1920, viewBoxHeight = 1200;

        if (Array.isArray(viewBox) && viewBox.length === 4) {
            [viewBoxX, viewBoxY, viewBoxWidth, viewBoxHeight] = viewBox;
        }

        // Get SVG rect and calculate position helpers
        const rect = svg.getBoundingClientRect();
        const previewPanel = this.shadowRoot.querySelector('.preview-panel');
        if (!previewPanel) return '';
        const panelRect = previewPanel.getBoundingClientRect();

        // Calculate scale accounting for aspect ratio
        const scaleX = viewBoxWidth / rect.width;
        const scaleY = viewBoxHeight / rect.height;
        const scale = Math.max(scaleX, scaleY);

        // Calculate rendered dimensions
        const renderedWidth = viewBoxWidth / scale;
        const renderedHeight = viewBoxHeight / scale;

        // Calculate offset due to centering
        const offsetX = (rect.width - renderedWidth) / 2;
        const offsetY = (rect.height - renderedHeight) / 2;

        // Helper function to convert viewBox coords to pixel position
        const toPixelPos = (vbX, vbY) => {
            const svgPixelX = (vbX - viewBoxX) / scale + offsetX;
            const svgPixelY = (vbY - viewBoxY) / scale + offsetY;
            return {
                x: (rect.left - panelRect.left) + svgPixelX,
                y: (rect.top - panelRect.top) + svgPixelY
            };
        };

        // 9-point attachment positions for controls (relative offsets)
        // Edge points: ±1.0 = AT the edge; center: 0 = at center
        // These match the snap detection coordinates in _getAttachmentTargetAt
        const controlAttachmentPoints = [
            { name: 'top-left', dx: -1.0, dy: -1.0 },
            { name: 'top', dx: 0, dy: -1.0 },
            { name: 'top-right', dx: 1.0, dy: -1.0 },
            { name: 'left', dx: -1.0, dy: 0 },
            { name: 'center', dx: 0, dy: 0 },
            { name: 'right', dx: 1.0, dy: 0 },
            { name: 'bottom-left', dx: -1.0, dy: 1.0 },
            { name: 'bottom', dx: 0, dy: 1.0 },
            { name: 'bottom-right', dx: 1.0, dy: 1.0 }
        ];

        // Anchors are single points (gap is controlled by anchor_gap property in line config)
        // Render attachment points for anchors
        const anchorElements = Object.entries(anchors).map(([name, position]) => {
            if (!Array.isArray(position)) return '';
            const [vbX, vbY] = position;
            const pixelPos = toPixelPos(vbX, vbY);

            // For anchors, show single center point
            const point = { name: 'center', dx: 0, dy: 0 };
            const px = pixelPos.x;
            const py = pixelPos.y;

            const isSource = this._connectLineState.source?.type === 'anchor' &&
                            this._connectLineState.source?.id === name &&
                            this._connectLineState.source?.point === point.name;

            return html`
                <div
                    class="attachment-point"
                    data-connection-type="anchor"
                    data-connection-id="${name}"
                    data-connection-point="${point.name}"
                    @click=${this._handleAttachmentPointClick}
                    style="
                        position: absolute;
                        left: ${px}px;
                        top: ${py}px;
                        transform: translate(-50%, -50%);
                        width: 12px;
                        height: 12px;
                        background: ${isSource ? '#2196F3' : '#00FFFF'};
                        border: 2px solid ${isSource ? '#1976D2' : '#00BCD4'};
                        border-radius: 50%;
                        cursor: pointer;
                        box-shadow: 0 0 8px ${isSource ? 'rgba(33, 150, 243, 0.8)' : 'rgba(0, 255, 255, 0.6)'};
                        transition: all 0.2s;
                        pointer-events: auto;
                        z-index: 1000;
                    "
                    @mouseenter=${(e) => e.target.style.transform = 'translate(-50%, -50%) scale(1.5)'}
                    @mouseleave=${(e) => e.target.style.transform = 'translate(-50%, -50%) scale(1)'}
                ></div>
            `;
        });

        // Render attachment points for controls (rectangles with corners and edges)
        const controlElements = controls.map((control, index) => {
            // Resolve position for both anchored and explicitly positioned controls
            let resolvedPosition;
            if (control.position && Array.isArray(control.position)) {
                // Explicitly positioned
                resolvedPosition = control.position;
            } else if (control.anchor) {
                // Anchored to a named anchor - resolve using OverlayUtils
                resolvedPosition = OverlayUtils.resolvePosition(control.anchor, anchors);
                if (!resolvedPosition) {
                    lcardsLog.warn('[MSDStudio] Failed to resolve anchor for control:', control.id, control.anchor);
                    return '';
                }
            } else {
                // No position info
                lcardsLog.warn('[MSDStudio] Control has neither position nor anchor:', control.id);
                return '';
            }

            if (!control.size) {
                lcardsLog.warn('[MSDStudio] Control missing size:', control.id);
                return '';
            }

            const [vbX, vbY] = resolvedPosition;
            const [width, height] = control.size;

            // Calculate control corners
            const topLeft = toPixelPos(vbX, vbY);
            const bottomRight = toPixelPos(vbX + width, vbY + height);
            const centerX = (topLeft.x + bottomRight.x) / 2;
            const centerY = (topLeft.y + bottomRight.y) / 2;
            const pixelWidth = bottomRight.x - topLeft.x;
            const pixelHeight = bottomRight.y - topLeft.y;

            // Use 9-point grid for controls
            return controlAttachmentPoints.map(point => {
                const px = centerX + (point.dx * pixelWidth / 2);
                const py = centerY + (point.dy * pixelHeight / 2);

                const isSource = this._connectLineState.source?.type === 'control' &&
                                this._connectLineState.source?.id === control.id &&
                                this._connectLineState.source?.point === point.name;

                return html`
                    <div
                        class="attachment-point"
                        data-connection-type="control"
                        data-connection-id="${control.id}"
                        data-connection-point="${point.name}"
                        @click=${this._handleAttachmentPointClick}
                        style="
                            position: absolute;
                            left: ${px}px;
                            top: ${py}px;
                            transform: translate(-50%, -50%);
                            width: 12px;
                            height: 12px;
                            background: ${isSource ? '#2196F3' : '#FF9900'};
                            border: 2px solid ${isSource ? '#1976D2' : '#F57C00'};
                            border-radius: 50%;
                            cursor: pointer;
                            box-shadow: 0 0 8px ${isSource ? 'rgba(33, 150, 243, 0.8)' : 'rgba(255, 153, 0, 0.6)'};
                            transition: all 0.2s;
                            pointer-events: auto;
                            z-index: 1000;
                        "
                        @mouseenter=${(e) => e.target.style.transform = 'translate(-50%, -50%) scale(1.5)'}
                        @mouseleave=${(e) => e.target.style.transform = 'translate(-50%, -50%) scale(1)'}
                    ></div>
                `;
            });
        });

        return html`
            <div style="
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                pointer-events: none;
                z-index: 1000;
            ">
                ${anchorElements}
                ${controlElements}
            </div>
        `;
    }

    /**
     * Handle attachment point click in connect line mode
     * @param {Event} e - Click event
     * @private
     */
    _handleAttachmentPointClick(e) {
        e.stopPropagation();

        const target = e.currentTarget;
        const connectionInfo = {
            type: target.dataset.connectionType,
            id: target.dataset.connectionId,
            point: target.dataset.connectionPoint,
            gap: 0
        };

        if (!this._connectLineState.source) {
            // First click - set source
            this._connectLineState = { ...this._connectLineState, source: connectionInfo };
            lcardsLog.info('[MSDStudio] Connect line source set:', connectionInfo);
            this.requestUpdate();
        } else {
            // Second click - open line form with connection data
            lcardsLog.info('[MSDStudio] Connect line target set:', connectionInfo);
            this._openLineFormWithConnection(this._connectLineState.source, connectionInfo);
            this._clearConnectLineState();
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
            snap_to_grid: this._snapToGrid,   // FIXED: Include snap toggle state
            routing_channels: true,  // Always show channels in editor
            highlighted_anchor: this._highlightedAnchor  // Pass highlighted anchor for pulse animation
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
            <div style="padding: 8px;">
                <!-- Control Actions -->
                <div style="display: flex; gap: 8px; margin-bottom: 16px;">
                    <ha-button @click=${this._openControlForm}>
                        <ha-icon icon="mdi:plus" slot="icon"></ha-icon>
                        Add Control
                    </ha-button>
                    <ha-button @click=${() => this._setMode('place_control')}
                               ?disabled=${this._activeMode === MODES.PLACE_CONTROL}>
                        <ha-icon icon="mdi:cursor-default-click" slot="icon"></ha-icon>
                        Place on Canvas
                    </ha-button>
                </div>

                <!-- Visualization Helpers -->
                <lcards-form-section
                    header="Visualization Helpers"
                    description="Visual aids for control placement"
                    ?expanded=${false}
                    style="margin-bottom: 16px;">
                    <div style="display: flex; flex-direction: column; gap: 12px;">
                        <ha-formfield label="Show Bounding Boxes">
                            <ha-switch
                                ?checked=${this._showBoundingBoxes}
                                @change=${(e) => {
                                    this._showBoundingBoxes = e.target.checked;
                                    this.requestUpdate();
                                }}>
                            </ha-switch>
                        </ha-formfield>
                        <ha-formfield label="Show Attachment Points">
                            <ha-switch
                                ?checked=${this._showAttachmentPoints}
                                @change=${(e) => {
                                    this._showAttachmentPoints = e.target.checked;
                                    this.requestUpdate();
                                }}>
                            </ha-switch>
                        </ha-formfield>
                    </div>
                </lcards-form-section>

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
                </lcards-form-section>

                ${this._renderControlHelp()}
            </div>
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
     * Get routing mode information including description and diagram
     * @param {string} mode - Routing mode (auto, direct, manhattan, grid, smart)
     * @returns {Object} Info object with title, description, icon, diagram
     * @private
     */
    _getRoutingModeInfo(mode) {
        const modes = {
            auto: {
                title: 'Auto (Smart Pathfinding)',
                icon: 'mdi:auto-fix',
                description: 'Intelligent pathfinding that automatically routes around overlays. Finds the shortest valid path while respecting boundaries. Best for general connections.',
                diagram: html`
                    <svg viewBox="0 0 200 80" style="width: 100%; height: auto;">
                        <!-- Source -->
                        <rect x="10" y="25" width="30" height="30" fill="var(--lcars-blue)" rx="4"/>
                        <!-- Obstacle -->
                        <rect x="85" y="20" width="30" height="40" fill="var(--lcars-gray)" rx="4"/>
                        <!-- Target -->
                        <rect x="160" y="25" width="30" height="30" fill="var(--lcars-green)" rx="4"/>
                        <!-- Path around obstacle -->
                        <path d="M 40 40 L 75 40 L 75 15 L 125 15 L 125 40 L 160 40"
                              stroke="var(--lcars-orange)" stroke-width="3" fill="none"/>
                    </svg>
                `
            },
            direct: {
                title: 'Direct (Straight Line)',
                icon: 'mdi:minus',
                description: 'Simple straight line from source to target. No routing or obstacle avoidance. Best when there are no obstacles between points.',
                diagram: html`
                    <svg viewBox="0 0 200 80" style="width: 100%; height: auto;">
                        <!-- Source -->
                        <rect x="10" y="25" width="30" height="30" fill="var(--lcars-blue)" rx="4"/>
                        <!-- Target -->
                        <rect x="160" y="25" width="30" height="30" fill="var(--lcars-green)" rx="4"/>
                        <!-- Direct path -->
                        <path d="M 40 40 L 160 40"
                              stroke="var(--lcars-orange)" stroke-width="3" fill="none"/>
                    </svg>
                `
            },
            manhattan: {
                title: 'Manhattan (90° Angles)',
                icon: 'mdi:vector-square',
                description: 'Right-angle paths using only horizontal and vertical segments. Classic circuit board routing style. Creates clean, orthogonal connections.',
                diagram: html`
                    <svg viewBox="0 0 200 80" style="width: 100%; height: auto;">
                        <!-- Source -->
                        <rect x="10" y="50" width="30" height="30" fill="var(--lcars-blue)" rx="4"/>
                        <!-- Target -->
                        <rect x="160" y="10" width="30" height="30" fill="var(--lcars-green)" rx="4"/>
                        <!-- Manhattan path -->
                        <path d="M 40 65 L 100 65 L 100 25 L 160 25"
                              stroke="var(--lcars-orange)" stroke-width="3" fill="none"/>
                    </svg>
                `
            },
            grid: {
                title: 'Grid (A* Pathfinding)',
                icon: 'mdi:grid',
                description: 'A* grid-based pathfinding with Manhattan distance heuristic. Finds optimal path on grid nodes while avoiding obstacles. Precise control with grid resolution.',
                diagram: html`
                    <svg viewBox="0 0 200 80" style="width: 100%; height: auto;">
                        <!-- Grid -->
                        <pattern id="grid-pattern" width="20" height="20" patternUnits="userSpaceOnUse">
                            <path d="M 20 0 L 0 0 0 20" fill="none" stroke="var(--lcars-gray)" stroke-width="0.5" opacity="0.3"/>
                        </pattern>
                        <rect width="200" height="80" fill="url(#grid-pattern)"/>
                        <!-- Source -->
                        <rect x="10" y="50" width="30" height="30" fill="var(--lcars-blue)" rx="4"/>
                        <!-- Obstacle -->
                        <rect x="85" y="35" width="30" height="30" fill="var(--lcars-gray)" rx="4"/>
                        <!-- Target -->
                        <rect x="160" y="10" width="30" height="30" fill="var(--lcars-green)" rx="4"/>
                        <!-- Grid path -->
                        <path d="M 40 65 L 60 65 L 60 45 L 80 45 L 80 25 L 120 25 L 160 25"
                              stroke="var(--lcars-orange)" stroke-width="3" fill="none"/>
                    </svg>
                `
            },
            smart: {
                title: 'Smart (Cost-Optimized)',
                icon: 'mdi:brain',
                description: 'Advanced routing with cost analysis. Optimizes for shortest distance while penalizing bends and proximity to obstacles. Balances path length with aesthetic quality.',
                diagram: html`
                    <svg viewBox="0 0 200 80" style="width: 100%; height: auto;">
                        <!-- Source -->
                        <rect x="10" y="40" width="30" height="30" fill="var(--lcards-blue)" rx="4"/>
                        <!-- Obstacles -->
                        <rect x="70" y="10" width="25" height="25" fill="var(--lcars-gray)" rx="4"/>
                        <rect x="70" y="45" width="25" height="25" fill="var(--lcars-gray)" rx="4"/>
                        <!-- Target -->
                        <rect x="160" y="40" width="30" height="30" fill="var(--lcars-green)" rx="4"/>
                        <!-- Smart optimized path -->
                        <path d="M 40 55 L 60 55 L 60 38 L 105 38 L 105 55 L 160 55"
                              stroke="var(--lcars-orange)" stroke-width="3" fill="none"/>
                    </svg>
                `
            }
        };

        return modes[mode] || modes.auto;
    }

    /**
     * Render channel routing options for line dialog
     * @returns {TemplateResult}
     * @private
     */
    _renderChannelRoutingOptions() {
        // Get available channels from channels config
        // Channels are stored as object with ID as key: { channel1: {...}, channel2: {...} }
        const channelsObj = this._workingConfig.msd?.channels || {};
        const channelOptions = Object.keys(channelsObj);

        // Initialize route_channels if not set
        if (!this._lineFormData.route_channels) {
            this._lineFormData.route_channels = [];
        }

        if (channelOptions.length === 0) {
            return html`
                <div style="margin-top: 16px; padding: 12px; background: var(--card-background-color); border: 1px solid var(--divider-color); border-radius: 4px; font-size: 13px; color: var(--secondary-text-color);">
                    <ha-icon icon="mdi:information" style="vertical-align: middle; --mdc-icon-size: 18px;"></ha-icon>
                    No routing channels defined. Define channels in the Routing tab to enable channel-based routing.
                </div>
            `;
        }

        return html`
            <div style="margin-top: 16px;">
                <div style="font-weight: 600; font-size: 13px; color: var(--primary-text-color); margin-bottom: 8px;">
                    Channel Routing
                </div>
                <div style="font-size: 12px; color: var(--secondary-text-color); margin-bottom: 12px;">
                    Select which routing channels this line should use. Channels are rectangular regions defined in the Routing tab.
                </div>

                <ha-selector
                    .hass=${this.hass}
                    .selector=${{
                        select: {
                            options: channelOptions,
                            multiple: true,
                            mode: 'list'
                        }
                    }}
                    .value=${this._lineFormData.route_channels || []}
                    .label=${'Select Channels'}
                    @value-changed=${(e) => {
                        this._lineFormData.route_channels = e.detail.value || [];
                        this.requestUpdate();
                    }}>
                </ha-selector>

                ${(this._lineFormData.route_channels && this._lineFormData.route_channels.length > 0) ? html`
                    <ha-selector
                        .hass=${this.hass}
                        .selector=${{
                            select: {
                                options: [
                                    { value: 'prefer', label: 'Prefer (Use when beneficial)' },
                                    { value: 'avoid', label: 'Avoid (Stay away from)' },
                                    { value: 'force', label: 'Force (Must use)' }
                                ]
                            }
                        }}
                        .value=${this._lineFormData.channel_mode || 'prefer'}
                        .label=${'Channel Mode'}
                        @value-changed=${(e) => {
                            this._lineFormData.channel_mode = e.detail.value;
                            this.requestUpdate();
                        }}
                        style="margin-top: 12px;">
                    </ha-selector>
                ` : ''}
            </div>
        `;
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
            <ha-card style="padding: 12px; margin-bottom: 8px;">
                <div style="display: flex; align-items: center; gap: 12px;">
                    <ha-icon icon="mdi:card-outline" style="--mdc-icon-size: 32px; color: var(--primary-color);"></ha-icon>
                    <div style="flex: 1;">
                        <div style="font-weight: 600; margin-bottom: 4px;">${id}</div>
                        <div style="font-size: 12px; color: var(--secondary-text-color); font-family: monospace;">
                            ${cardType} @ ${positionStr}
                        </div>
                    </div>
                    <div style="display: flex; gap: 8px;">
                        <ha-icon-button
                            @click=${() => this._editControl(control)}
                            .label=${'Edit'}
                            .path=${'M20.71,7.04C21.1,6.65 21.1,6 20.71,5.63L18.37,3.29C18,2.9 17.35,2.9 16.96,3.29L15.12,5.12L18.87,8.87M3,17.25V21H6.75L17.81,9.93L14.06,6.18L3,17.25Z'}>
                        </ha-icon-button>
                        <ha-icon-button
                            @click=${() => this._highlightControlInPreview(control)}
                            .label=${'Highlight'}
                            .path=${'M12,9A3,3 0 0,1 15,12A3,3 0 0,1 12,15A3,3 0 0,1 9,12A3,3 0 0,1 12,9M12,4.5C17,4.5 21.27,7.61 23,12C21.27,16.39 17,19.5 12,19.5C7,19.5 2.73,16.39 1,12C2.73,7.61 7,4.5 12,4.5M3.18,12C4.83,15.36 8.24,17.5 12,17.5C15.76,17.5 19.17,15.36 20.82,12C19.17,8.64 15.76,6.5 12,6.5C8.24,6.5 4.83,8.64 3.18,12Z'}>
                        </ha-icon-button>
                        <ha-icon-button
                            @click=${() => this._deleteControl(control)}
                            .label=${'Delete'}
                            .path=${'M19,4H15.5L14.5,3H9.5L8.5,4H5V6H19M6,19A2,2 0 0,0 8,21H16A2,2 0 0,0 18,19V7H6V19Z'}>
                        </ha-icon-button>
                    </div>
                </div>
            </ha-card>
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
        this._controlFormActiveSubtab = 'placement';
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
        this._controlFormActiveSubtab = 'placement';
        this._showControlForm = true;

        this.requestUpdate();
    }

    /**
     * Highlight control in preview (Phase 3)
     * @param {Object} control - Control to highlight
     * @private
     */
    _highlightControlInPreview(control) {
        // Set highlighted control for overlay rendering
        this._highlightedControl = control.id;

        // Also update debug settings for MSD card's bounding box rendering
        this._debugSettings = {
            ...this._debugSettings,
            bounding_boxes: true,
            highlighted_control: control.id
        };

        this._schedulePreviewUpdate();
        this.requestUpdate();

        // Remove highlight after 2 seconds
        setTimeout(() => {
            this._highlightedControl = null;
            const { highlighted_control, ...settings } = this._debugSettings;
            this._debugSettings = settings;
            this._schedulePreviewUpdate();
            this.requestUpdate();
        }, 2500);
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
     * Handle control form tab change
     * @param {CustomEvent} event - Tab change event
     * @private
     */
    _handleControlFormTabChange(event) {
        event.stopPropagation();
        const tabValue = event.target.activeTab?.getAttribute('value');
        if (tabValue) {
            this._controlFormActiveSubtab = tabValue;
            this.requestUpdate();
        }
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
                .heading=${title}
                style="--mdc-dialog-min-width: 900px; --mdc-dialog-max-width: 1200px;">

                <!-- Two-Column Layout: Config (Left) + Preview (Right) -->
                <div style="display: grid; grid-template-columns: 1fr 320px; gap: 20px; padding: 16px;">

                    <!-- LEFT COLUMN: Configuration Panel -->
                    <div class="config-panel">
                        <!-- Subtabs -->
                        <ha-tab-group @wa-tab-show=${this._handleControlFormTabChange} style="margin-bottom: 16px;">
                            <ha-tab-group-tab value="placement" ?active=${this._controlFormActiveSubtab === 'placement'}>Placement</ha-tab-group-tab>
                            <ha-tab-group-tab value="card" ?active=${this._controlFormActiveSubtab === 'card'}>Card</ha-tab-group-tab>
                        </ha-tab-group>

                        <!-- Subtab Content -->
                        <div style="max-height: 60vh; overflow-y: auto;">
                            ${this._controlFormActiveSubtab === 'placement'
                                ? this._renderControlFormPlacement()
                                : this._renderControlFormCard()
                            }
                        </div>
                    </div>

                    <!-- RIGHT COLUMN: Preview Panel (Sticky) -->
                    <div class="preview-panel" style="position: sticky; top: 0; height: fit-content;">
                        ${this._renderControlPreview()}
                    </div>

                </div>

                <div slot="primaryAction">
                    <ha-button @click=${this._saveControl}>
                        <ha-icon icon="mdi:content-save" slot="icon"></ha-icon>
                        Save
                    </ha-button>
                </div>

                <div slot="secondaryAction">
                    <ha-button @click=${this._closeControlForm} appearance="plain">
                        <ha-icon icon="mdi:close" slot="icon"></ha-icon>
                        Cancel
                    </ha-button>
                </div>
            </ha-dialog>
        `;
    }

    /**
     * Get all available anchors (base_svg + user + control IDs)
     * @returns {Object} Merged anchor map
     * @private
     */
    _getAllAvailableAnchors() {
        // Get base SVG anchors
        const baseSvgAnchors = this._getBaseSvgAnchors() || {};

        // Get user-defined anchors
        const userAnchors = this._workingConfig.msd?.anchors || {};

        // Get control IDs (for attaching to other controls)
        const controlIds = (this._workingConfig.msd?.overlays || [])
            .filter(o => o.type === 'control')
            .map(o => o.id);

        // Merge all sources
        return {
            ...baseSvgAnchors,
            ...userAnchors,
            ...Object.fromEntries(controlIds.map(id => [id, null]))
        };
    }

    /**
     * Render Placement subtab (formerly MSD Config)
     * @returns {TemplateResult}
     * @private
     */
    _renderControlFormPlacement() {
        const allAnchors = this._getAllAvailableAnchors();
        const anchorOptions = [
            { value: '', label: 'Use Coordinates' },
            ...Object.keys(allAnchors).sort().map(name => ({ value: name, label: name }))
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
     * Render Card subtab (formerly Card Config)
     * @returns {TemplateResult}
     * @private
     */
    _renderControlFormCard() {
        const cardType = this._controlFormCard?.type || '';

        lcardsLog.debug('[MSDStudio] Rendering Card tab, cardType:', cardType, 'full config:', this._controlFormCard);

        return html`
            <div style="display: flex; flex-direction: column; gap: 16px;">
                ${!cardType ? html`
                    <!-- Card Picker (Visual Grid) -->
                    <lcards-form-section
                        header="Select Card Type"
                        description="Choose a card to display in this control overlay"
                        ?expanded=${true}>
                        <div style="padding: 16px;">
                            ${this._renderCardPicker()}
                        </div>
                    </lcards-form-section>
                ` : html`
                    <!-- Selected Card Info + Change Button -->
                    <div style="display: flex; align-items: center; justify-content: space-between; padding: 12px; background: var(--card-background-color); border: 1px solid var(--divider-color); border-radius: 8px;">
                        <div style="display: flex; align-items: center; gap: 12px;">
                            <ha-icon icon="mdi:card-outline" style="--mdc-icon-size: 24px; color: var(--primary-color);"></ha-icon>
                            <div>
                                <div style="font-weight: 600; font-size: 14px;">${cardType}</div>
                                <div style="font-size: 12px; color: var(--secondary-text-color);">Selected card type</div>
                            </div>
                        </div>
                        <ha-button
                            @click=${() => {
                                this._resetCardPicker();
                                this._controlFormCard = { type: '' };
                                this.requestUpdate();
                            }}
                            appearance="plain">
                            <ha-icon icon="mdi:swap-horizontal" slot="icon"></ha-icon>
                            Change Card
                        </ha-button>
                    </div>

                    <!-- Full Card Configuration Editor -->
                    <lcards-form-section
                        header="Card Configuration"
                        description="Configure the card properties using Home Assistant's native card editor"
                        ?expanded=${true}>
                        <div style="padding: 16px;">
                            <hui-card-element-editor
                                .hass=${this.hass}
                                .lovelace=${this._getRealLovelace()}
                                .value=${this._controlFormCard}
                                @value-changed=${(e) => {
                                    lcardsLog.debug('[MSDStudio] Card config changed:', e.detail.value);
                                    this._controlFormCard = e.detail.value || { type: cardType };
                                    this.requestUpdate();
                                }}>
                            </hui-card-element-editor>
                        </div>
                    </lcards-form-section>
                `}
            </div>
        `;
    }

    /**
     * Get available card types from HA registry
     * @returns {Array} Array of card type objects
     * @private
     */
    _getAvailableCardTypes() {
        const cards = [];

        // Standard HA cards
        const standardCards = [
            { type: 'button', name: 'Button', icon: 'mdi:gesture-tap-button' },
            { type: 'entities', name: 'Entities', icon: 'mdi:format-list-bulleted' },
            { type: 'entity', name: 'Entity', icon: 'mdi:card-bulleted' },
            { type: 'glance', name: 'Glance', icon: 'mdi:view-dashboard' },
            { type: 'light', name: 'Light', icon: 'mdi:lightbulb' },
            { type: 'thermostat', name: 'Thermostat', icon: 'mdi:thermostat' },
            { type: 'media-control', name: 'Media Control', icon: 'mdi:play-circle' },
            { type: 'weather-forecast', name: 'Weather', icon: 'mdi:weather-partly-cloudy' },
            { type: 'sensor', name: 'Sensor', icon: 'mdi:eye' },
            { type: 'gauge', name: 'Gauge', icon: 'mdi:gauge' },
            { type: 'history-graph', name: 'History', icon: 'mdi:chart-line' },
            { type: 'markdown', name: 'Markdown', icon: 'mdi:language-markdown' },
            { type: 'picture', name: 'Picture', icon: 'mdi:image' },
            { type: 'picture-entity', name: 'Picture Entity', icon: 'mdi:image-frame' },
            { type: 'picture-glance', name: 'Picture Glance', icon: 'mdi:view-carousel' },
            { type: 'conditional', name: 'Conditional', icon: 'mdi:eye-check' },
            { type: 'map', name: 'Map', icon: 'mdi:map' }
        ];

        cards.push(...standardCards);

        // Add custom cards from window.customCards
        if (window.customCards) {
            window.customCards
                .filter(card => !card.type?.startsWith('custom:lcards-')) // Exclude our own cards
                .forEach(card => {
                    cards.push({
                        type: card.type,
                        name: card.name || card.type,
                        icon: 'mdi:puzzle'
                    });
                });
        }

        return cards;
    }

    /**
     * Render custom card picker grid (hui-card-picker not available)
     * @returns {TemplateResult}
     * @private
     */
    _renderCardPicker() {
        lcardsLog.debug('[MSDStudio] Rendering custom card picker (hui-card-picker not registered)');

        const cards = this._getAvailableCardTypes();

        return html`
            <div style="padding: 16px;">
                <div style="
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
                    gap: 8px;
                    max-height: 400px;
                    overflow-y: auto;
                ">
                    ${cards.map(card => html`
                        <ha-button
                            class="card-picker-button"
                            @click=${() => this._selectCardType(card.type)}>
                            <ha-icon
                                icon="${card.icon}"
                                slot="icon">
                            </ha-icon>
                            <div>${card.name}</div>
                        </ha-button>
                    `)}
                </div>
            </div>
        `;
    }

    /**
     * Handle card type selection
     * @param {string} cardType - Selected card type
     * @private
     */
    _selectCardType(cardType) {
        lcardsLog.debug('[MSDStudio] Card type selected:', cardType);
        this._controlFormCard = { type: cardType };
        this.requestUpdate();
    }

    /**
     * Handle card type selection from value-changed event (legacy)
     * @param {CustomEvent} e - Value changed event
     * @private
     */
    _handleCardTypeSelected(e) {
        lcardsLog.debug('[MSDStudio] Card type selected from event:', e.detail);
        const cardType = e.detail.value;
        if (cardType) {
            this._selectCardType(cardType);
        }
    }

    /**
     * Reset picker state (legacy)
     * @private
     */
    _resetCardPicker() {
        // No-op - kept for compatibility
    }

    /**
     * Get the real Lovelace instance from Home Assistant UI
     * Required for hui-card-element-editor
     * @returns {Object|null} Real Lovelace instance or null if not found
     * @private
     */
    _getRealLovelace() {
        try {
            let root = document.querySelector('home-assistant');
            root = root && root.shadowRoot;
            root = root && root.querySelector('home-assistant-main');
            root = root && root.shadowRoot;
            root = root && root.querySelector('app-drawer-layout partial-panel-resolver, ha-drawer partial-panel-resolver');
            root = (root && root.shadowRoot) || root;
            root = root && root.querySelector('ha-panel-lovelace');
            root = root && root.shadowRoot;
            root = root && root.querySelector('hui-root');
            if (root && root.lovelace) {
                return root.lovelace;
            }
        } catch (err) {
            lcardsLog.warn('[MSDStudio] Failed to get real Lovelace:', err);
        }
        return null;
    }

    /**
     * Render Control Preview Panel (Right Side)
        const realLovelace = this._getRealLovelace();

        if (realLovelace) {
            lcardsLog.debug('[MSDStudio] Using REAL Lovelace instance:', {
                mode: realLovelace.mode,
                hasConfig: !!realLovelace.config,
                viewsCount: realLovelace.config?.views?.length,
                hasEditMode: realLovelace.editMode !== undefined,
                hasSaveConfig: typeof realLovelace.saveConfig === 'function',
                hasDeleteCard: typeof realLovelace.deleteCard === 'function'
            });
            return realLovelace;
        }

        // Fallback to minimal mock (shouldn't happen in normal HA usage)
        lcardsLog.warn('[MSDStudio] Could not get real Lovelace, using minimal mock');
        const lovelaceConfig = {
            mode: 'storage',
            config: {
                title: 'LCARdS Studio',
                views: [
                    {
                        title: 'Main',
                        cards: []
                    }
                ]
            },
            language: this.hass?.language || 'en',
            editMode: true
        };

        return lovelaceConfig;
    }

    /**
     * Render Control Preview Panel (Right Side)
     * @returns {TemplateResult}
     * @private
     */
    _renderControlPreview() {
        const position = this._controlFormPosition;
        const size = this._controlFormSize;
        const attachment = this._controlFormAttachment;
        const cardType = this._controlFormCard?.type || 'none';

        // Format position display
        const positionDisplay = typeof position === 'string'
            ? `Anchor: ${position}`
            : `Coords: [${position[0]}, ${position[1]}]`;

        return html`
            <div style="background: var(--card-background-color); border: 1px solid var(--divider-color); border-radius: 8px; padding: 16px;">
                <h3 style="margin: 0 0 16px 0; font-size: 16px; font-weight: 600;">Control Preview</h3>

                <!-- Preview Info -->
                <div style="display: flex; flex-direction: column; gap: 12px; margin-bottom: 16px;">
                    <div style="display: flex; justify-content: space-between; font-size: 13px;">
                        <strong>Card Type:</strong>
                        <span style="color: var(--primary-color);">${cardType || 'Not selected'}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; font-size: 13px;">
                        <strong>Position:</strong>
                        <span>${positionDisplay}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; font-size: 13px;">
                        <strong>Size:</strong>
                        <span>${size[0]}px × ${size[1]}px</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; font-size: 13px;">
                        <strong>Attachment:</strong>
                        <span>${attachment}</span>
                    </div>
                </div>

                <!-- Visual Preview -->
                <div style="background: var(--secondary-background-color); border: 1px solid var(--divider-color); border-radius: 4px; padding: 8px;">
                    <div style="font-size: 12px; color: var(--secondary-text-color); margin-bottom: 8px;">Visual Preview:</div>
                    ${this._renderControlVisualization()}
                </div>
            </div>
        `;
    }

    /**
     * Render Control Visualization (Simplified)
     * @returns {TemplateResult}
     * @private
     */
    _renderControlVisualization() {
        const size = this._controlFormSize;
        const attachment = this._controlFormAttachment;

        // Calculate attachment point indicator position
        let attachX = 0, attachY = 0;
        if (attachment.includes('left')) attachX = 0;
        else if (attachment.includes('right')) attachX = 100;
        else attachX = 50;

        if (attachment.includes('top')) attachY = 0;
        else if (attachment.includes('bottom')) attachY = 100;
        else attachY = 50;

        return html`
            <svg viewBox="0 0 280 180" style="width: 100%; height: auto; display: block;">
                <!-- Background -->
                <rect x="0" y="0" width="280" height="180" fill="var(--card-background-color)" stroke="var(--divider-color)" stroke-width="1" />

                <!-- Center reference point -->
                <circle cx="140" cy="90" r="3" fill="var(--secondary-text-color)" opacity="0.3" />
                <text x="140" y="100" text-anchor="middle" font-size="10" fill="var(--secondary-text-color)" opacity="0.5">MSD Center</text>

                <!-- Control box (scaled to fit) -->
                <g transform="translate(140, 90)">
                    <!-- Scale control to fit preview -->
                    ${(() => {
                        const scale = Math.min(200 / size[0], 140 / size[1], 1);
                        const scaledW = size[0] * scale;
                        const scaledH = size[1] * scale;
                        const offsetX = -(scaledW * attachX / 100);
                        const offsetY = -(scaledH * attachY / 100);

                        return html`
                            <!-- Control outline -->
                            <rect
                                x="${offsetX}"
                                y="${offsetY}"
                                width="${scaledW}"
                                height="${scaledH}"
                                fill="var(--primary-color)"
                                opacity="0.2"
                                stroke="var(--primary-color)"
                                stroke-width="2" />

                            <!-- Attachment point indicator -->
                            <circle
                                cx="0"
                                cy="0"
                                r="4"
                                fill="var(--error-color)" />

                            <!-- Size label -->
                            <text
                                x="${offsetX + scaledW/2}"
                                y="${offsetY + scaledH/2}"
                                text-anchor="middle"
                                dominant-baseline="middle"
                                font-size="11"
                                fill="var(--primary-text-color)"
                                font-weight="600">
                                ${size[0]}×${size[1]}
                            </text>
                        `;
                    })()}
                </g>
            </svg>
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
            <div style="padding: 8px;">
                <!-- Line Actions -->
                <div style="display: flex; gap: 8px; margin-bottom: 16px;">
                    <ha-button @click=${this._openLineForm}>
                        <ha-icon icon="mdi:plus" slot="icon"></ha-icon>
                        Add Line
                    </ha-button>
                    <ha-button @click=${() => this._setMode('connect_line')}
                               ?disabled=${this._activeMode === MODES.CONNECT_LINE}>
                        <ha-icon icon="mdi:vector-line" slot="icon"></ha-icon>
                        Enter Connect Mode
                    </ha-button>
                </div>

                <!-- Visualization Helpers -->
                <lcards-form-section
                    header="Visualization Helpers"
                    description="Visual aids for line editing"
                    ?expanded=${false}
                    style="margin-bottom: 16px;">
                    <div style="display: flex; flex-direction: column; gap: 12px;">
                        <ha-formfield label="Show Routing Paths">
                            <ha-switch
                                ?checked=${this._showRoutingPaths}
                                @change=${(e) => {
                                    this._showRoutingPaths = e.target.checked;
                                    this.requestUpdate();
                                }}>
                            </ha-switch>
                        </ha-formfield>
                        <ha-formfield label="Show Routing Channels">
                            <ha-switch
                                ?checked=${this._showRoutingChannels}
                                @change=${(e) => {
                                    this._showRoutingChannels = e.target.checked;
                                    this.requestUpdate();
                                }}>
                            </ha-switch>
                        </ha-formfield>
                    </div>
                </lcards-form-section>

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
                </lcards-form-section>

                ${this._renderLineHelp()}
            </div>
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
        const strokeColor = line.style?.color || '#FF9900';
        const strokeWidth = line.style?.width || 2;

        return html`
            <ha-card style="padding: 12px; margin-bottom: 8px;">
                <div style="display: flex; align-items: center; gap: 12px;">
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
                            stroke-dasharray="${line.style?.dash_array || ''}">
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
                <div style="display: flex; gap: 8px;">
                    <ha-icon-button
                        @click=${() => this._editLine(line)}
                        .label=${'Edit'}
                        .path=${'M20.71,7.04C21.1,6.65 21.1,6 20.71,5.63L18.37,3.29C18,2.9 17.35,2.9 16.96,3.29L15.12,5.12L18.87,8.87M3,17.25V21H6.75L17.81,9.93L14.06,6.18L3,17.25Z'}>
                    </ha-icon-button>
                    <ha-icon-button
                        @click=${() => this._highlightLineInPreview(line)}
                        .label=${'Highlight'}
                        .path=${'M12,9A3,3 0 0,1 15,12A3,3 0 0,1 12,15A3,3 0 0,1 9,12A3,3 0 0,1 12,9M12,4.5C17,4.5 21.27,7.61 23,12C21.27,16.39 17,19.5 12,19.5C7,19.5 2.73,16.39 1,12C2.73,7.61 7,4.5 12,4.5M3.18,12C4.83,15.36 8.24,17.5 12,17.5C15.76,17.5 19.17,15.36 20.82,12C19.17,8.64 15.76,6.5 12,6.5C8.24,6.5 4.83,8.64 3.18,12Z'}>
                    </ha-icon-button>
                    <ha-icon-button
                        @click=${() => this._deleteLine(line)}
                        .label=${'Delete'}
                        .path=${'M19,4H15.5L14.5,3H9.5L8.5,4H5V6H19M6,19A2,2 0 0,0 8,21H16A2,2 0 0,0 18,19V7H6V19Z'}>
                    </ha-icon-button>
                </div>
            </div>
            </ha-card>
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
    _renderRoutingTab() {
        const routing = this._workingConfig.msd?.routing || {};
        const channels = this._workingConfig.msd?.channels || {};
        const channelCount = Object.keys(channels).length;

        return html`
            <div style="padding: 8px;">
                <!-- Routing Channels -->
                <lcards-form-section
                    header="Routing Channels"
                    description="Define regions that influence line routing behavior"
                    ?expanded=${true}
                    style="margin-bottom: 16px;">

                    <!-- Channel Actions -->
                    <div style="display: flex; gap: 8px; margin-bottom: 16px;">
                        <ha-button @click=${this._openChannelForm}>
                            <ha-icon icon="mdi:plus" slot="icon"></ha-icon>
                            Add Channel
                        </ha-button>
                        <ha-button @click=${() => this._setMode('draw_channel')}
                                   ?disabled=${this._activeMode === MODES.DRAW_CHANNEL}>
                            <ha-icon icon="mdi:vector-rectangle" slot="icon"></ha-icon>
                            Draw on Canvas
                        </ha-button>
                    </div>

                    <!-- Visualization Helper -->
                    <ha-formfield label="Show Routing Channels" style="margin-bottom: 16px;">
                        <ha-switch
                            ?checked=${this._showRoutingChannels}
                            @change=${(e) => {
                                this._showRoutingChannels = e.target.checked;
                                this.requestUpdate();
                            }}>
                        </ha-switch>
                    </ha-formfield>

                    <!-- Channels List -->
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
                </lcards-form-section>

                <!-- Global Routing Defaults (Advanced) -->
                <lcards-form-section
                    header="⚙️ Advanced Routing Configuration"
                    description="Fine-tune global routing behavior for all lines"
                    ?expanded=${false}
                    style="margin-bottom: 16px;">

                    <!-- Help Text -->
                    <lcards-message type="info" style="margin-bottom: 16px;">
                        <strong>Advanced Tuning</strong>
                        <p style="margin: 8px 0 0 0; font-size: 13px; line-height: 1.4;">
                            These settings control the default routing behavior for all lines. Individual lines can override these values.
                            Most users can leave these at their defaults. Only adjust if you need specific routing characteristics.
                        </p>
                    </lcards-message>

                    <!-- Basic Routing -->
                    <div style="margin-bottom: 16px;">
                        <div style="font-weight: 500; margin-bottom: 8px;">Basic Routing</div>
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
                            <ha-textfield
                                label="Clearance (px)"
                                type="number"
                                min="0"
                                step="1"
                                .value=${routing.clearance ?? ''}
                                @input=${(e) => this._updateRoutingConfig('clearance', e.target.value ? parseFloat(e.target.value) : undefined)}
                                helper-text="Min distance from obstacles (default: 0)">
                            </ha-textfield>
                            <ha-textfield
                                label="Grid Resolution (px)"
                                type="number"
                                min="5"
                                step="1"
                                .value=${routing.grid_resolution ?? ''}
                                @input=${(e) => this._updateRoutingConfig('grid_resolution', e.target.value ? parseFloat(e.target.value) : undefined)}
                                helper-text="Grid cell size (default: 64)">
                            </ha-textfield>
                        </div>
                    </div>

                    <!-- Path Smoothing -->
                    <div style="margin-bottom: 16px;">
                        <div style="font-weight: 500; margin-bottom: 8px;">Path Smoothing</div>
                        <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px;">
                            <ha-select
                                label="Smoothing Mode"
                                .value=${routing.smoothing_mode ?? 'none'}
                                @change=${(e) => this._updateRoutingConfig('smoothing_mode', e.target.value)}>
                                <mwc-list-item value="none">None</mwc-list-item>
                                <mwc-list-item value="chaikin">Chaikin</mwc-list-item>
                            </ha-select>
                            <ha-textfield
                                label="Iterations"
                                type="number"
                                min="1"
                                max="5"
                                .value=${routing.smoothing_iterations ?? ''}
                                @input=${(e) => this._updateRoutingConfig('smoothing_iterations', e.target.value ? parseInt(e.target.value) : undefined)}
                                helper-text="1-5 (default: 1)">
                            </ha-textfield>
                            <ha-textfield
                                label="Max Points"
                                type="number"
                                min="1"
                                .value=${routing.smoothing_max_points ?? ''}
                                @input=${(e) => this._updateRoutingConfig('smoothing_max_points', e.target.value ? parseInt(e.target.value) : undefined)}
                                helper-text="Default: 160">
                            </ha-textfield>
                        </div>
                    </div>

                    <!-- Smart Routing -->
                    <div style="margin-bottom: 16px;">
                        <div style="font-weight: 500; margin-bottom: 8px;">Smart Routing</div>
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
                            <ha-textfield
                                label="Proximity Band (px)"
                                type="number"
                                min="0"
                                .value=${routing.smart_proximity ?? ''}
                                @input=${(e) => this._updateRoutingConfig('smart_proximity', e.target.value ? parseFloat(e.target.value) : undefined)}
                                helper-text="Obstacle avoidance distance (default: 0)">
                            </ha-textfield>
                            <ha-textfield
                                label="Detour Span (px)"
                                type="number"
                                min="1"
                                .value=${routing.smart_detour_span ?? ''}
                                @input=${(e) => this._updateRoutingConfig('smart_detour_span', e.target.value ? parseFloat(e.target.value) : undefined)}
                                helper-text="Max elbow shift (default: 48)">
                            </ha-textfield>
                            <ha-textfield
                                label="Max Extra Bends"
                                type="number"
                                min="0"
                                .value=${routing.smart_max_extra_bends ?? ''}
                                @input=${(e) => this._updateRoutingConfig('smart_max_extra_bends', e.target.value ? parseInt(e.target.value) : undefined)}
                                helper-text="Max added bends (default: 3)">
                            </ha-textfield>
                            <ha-textfield
                                label="Min Improvement (px)"
                                type="number"
                                min="0"
                                .value=${routing.smart_min_improvement ?? ''}
                                @input=${(e) => this._updateRoutingConfig('smart_min_improvement', e.target.value ? parseFloat(e.target.value) : undefined)}
                                helper-text="Min cost gain (default: 4)">
                            </ha-textfield>
                            <ha-textfield
                                label="Max Detours Per Elbow"
                                type="number"
                                min="1"
                                .value=${routing.smart_max_detours_per_elbow ?? ''}
                                @input=${(e) => this._updateRoutingConfig('smart_max_detours_per_elbow', e.target.value ? parseInt(e.target.value) : undefined)}
                                helper-text="Default: 4">
                            </ha-textfield>
                        </div>
                    </div>

                    <!-- Channel Configuration -->
                    <div style="margin-bottom: 16px;">
                        <div style="font-weight: 500; margin-bottom: 8px;">Channel Behavior</div>
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
                            <ha-textfield
                                label="Force Penalty"
                                type="number"
                                min="0"
                                .value=${routing.channel_force_penalty ?? ''}
                                @input=${(e) => this._updateRoutingConfig('channel_force_penalty', e.target.value ? parseFloat(e.target.value) : undefined)}
                                helper-text="Penalty for exiting forced channels (default: 800)">
                            </ha-textfield>
                            <ha-textfield
                                label="Avoid Multiplier"
                                type="number"
                                min="0"
                                step="0.1"
                                .value=${routing.channel_avoid_multiplier ?? ''}
                                @input=${(e) => this._updateRoutingConfig('channel_avoid_multiplier', e.target.value ? parseFloat(e.target.value) : undefined)}
                                helper-text="Avoid channel strength (default: 1.0)">
                            </ha-textfield>
                            <ha-textfield
                                label="Target Coverage"
                                type="number"
                                min="0"
                                max="1"
                                step="0.1"
                                .value=${routing.channel_target_coverage ?? ''}
                                @input=${(e) => this._updateRoutingConfig('channel_target_coverage', e.target.value ? parseFloat(e.target.value) : undefined)}
                                helper-text="Prefer mode target 0-1 (default: 0.6)">
                            </ha-textfield>
                            <ha-textfield
                                label="Shaping Max Attempts"
                                type="number"
                                min="1"
                                .value=${routing.channel_shaping_max_attempts ?? ''}
                                @input=${(e) => this._updateRoutingConfig('channel_shaping_max_attempts', e.target.value ? parseInt(e.target.value) : undefined)}
                                helper-text="Max shaping iterations (default: 12)">
                            </ha-textfield>
                            <ha-textfield
                                label="Shaping Span (px)"
                                type="number"
                                min="1"
                                .value=${routing.channel_shaping_span ?? ''}
                                @input=${(e) => this._updateRoutingConfig('channel_shaping_span', e.target.value ? parseFloat(e.target.value) : undefined)}
                                helper-text="Max shaping shift (default: 32)">
                            </ha-textfield>
                            <ha-textfield
                                label="Min Coverage Gain"
                                type="number"
                                min="0"
                                max="1"
                                step="0.01"
                                .value=${routing.channel_min_coverage_gain ?? ''}
                                @input=${(e) => this._updateRoutingConfig('channel_min_coverage_gain', e.target.value ? parseFloat(e.target.value) : undefined)}
                                helper-text="Min gain threshold 0-1 (default: 0.04)">
                            </ha-textfield>
                        </div>
                    </div>

                    <!-- Cost Function Weights -->
                    <div>
                        <div style="font-weight: 500; margin-bottom: 8px;">Cost Function Weights</div>
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
                            <ha-textfield
                                label="Bend Cost"
                                type="number"
                                min="0"
                                .value=${routing.cost_defaults?.bend ?? ''}
                                @input=${(e) => this._updateRoutingCostDefaults('bend', e.target.value ? parseFloat(e.target.value) : undefined)}
                                helper-text="Cost per bend (default: 10)">
                            </ha-textfield>
                            <ha-textfield
                                label="Proximity Cost"
                                type="number"
                                min="0"
                                .value=${routing.cost_defaults?.proximity ?? ''}
                                @input=${(e) => this._updateRoutingCostDefaults('proximity', e.target.value ? parseFloat(e.target.value) : undefined)}
                                helper-text="Cost for obstacle proximity (default: 4)">
                            </ha-textfield>
                        </div>
                    </div>
                </lcards-form-section>

                <!-- Routing Modes Reference -->
                <lcards-form-section
                    header="📖 Routing Modes Reference"
                    description="Quick reference for routing behavior"
                    ?expanded=${false}
                    style="margin-bottom: 16px;">

                    <!-- Mode selector for reference display -->
                    <ha-selector
                        .hass=${this.hass}
                        .selector=${{
                            select: {
                                options: [
                                    { value: 'auto', label: 'Auto (Smart Pathfinding)' },
                                    { value: 'direct', label: 'Direct (Straight Line)' },
                                    { value: 'manhattan', label: 'Manhattan (90° Angles)' },
                                    { value: 'grid', label: 'Grid (A* Pathfinding)' },
                                    { value: 'smart', label: 'Smart (Cost-Optimized)' }
                                ]
                            }
                        }}
                        .value=${this._routingModeReference || 'auto'}
                        .label=${'Show Info For'}
                        @value-changed=${(e) => {
                            this._routingModeReference = e.detail.value;
                            this.requestUpdate();
                        }}
                        style="margin-bottom: 16px;">
                    </ha-selector>

                    <!-- Display routing info panel -->
                    ${this._renderRoutingModeInfoPanel(this._routingModeReference || 'auto')}
                </lcards-form-section>

        `;
    }

    /**
     * Render routing mode information panel (reusable component)
     * @param {string} mode - Routing mode
     * @returns {TemplateResult}
     * @private
     */
    _renderRoutingModeInfoPanel(mode) {
        const info = this._getRoutingModeInfo(mode);
        return html`
            <div class="routing-info-panel">
                <div class="routing-info-header">
                    <ha-icon icon="${info.icon}"></ha-icon>
                    <span>${info.title}</span>
                </div>
                <div class="routing-info-description">
                    ${info.description}
                </div>
                <div class="routing-info-diagram">
                    ${info.diagram}
                </div>
            </div>
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
                <div style="display: flex; gap: 8px;">
                    <ha-icon-button
                        @click=${() => this._editChannel(id, channel)}
                        .label=${'Edit'}
                        .path=${'M20.71,7.04C21.1,6.65 21.1,6 20.71,5.63L18.37,3.29C18,2.9 17.35,2.9 16.96,3.29L15.12,5.12L18.87,8.87M3,17.25V21H6.75L17.81,9.93L14.06,6.18L3,17.25Z'}>
                    </ha-icon-button>
                    <ha-icon-button
                        @click=${() => this._highlightChannelInPreview(id)}
                        .label=${'Highlight'}
                        .path=${'M12,9A3,3 0 0,1 15,12A3,3 0 0,1 12,15A3,3 0 0,1 9,12A3,3 0 0,1 12,9M12,4.5C17,4.5 21.27,7.61 23,12C21.27,16.39 17,19.5 12,19.5C7,19.5 2.73,16.39 1,12C2.73,7.61 7,4.5 12,4.5M3.18,12C4.83,15.36 8.24,17.5 12,17.5C15.76,17.5 19.17,15.36 20.82,12C19.17,8.64 15.76,6.5 12,6.5C8.24,6.5 4.83,8.64 3.18,12Z'}>
                    </ha-icon-button>
                    <ha-icon-button
                        @click=${() => this._deleteChannel(id)}
                        .label=${'Delete'}
                        .path=${'M19,4H15.5L14.5,3H9.5L8.5,4H5V6H19M6,19A2,2 0 0,0 8,21H16A2,2 0 0,0 18,19V7H6V19Z'}>
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
                    <ha-button @click=${this._closeChannelForm} appearance="plain">
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
    async _saveChannel() {
        const id = this._channelFormData.id;
        if (!id || id.trim() === '') {
            await this._showDialog('Missing ID', 'Channel ID is required', 'error');
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
        if (!await this._showConfirmDialog('Delete Channel', `Delete routing channel "${id}"?<br><br>Lines using this channel may be affected.`)) {
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
        // Highlight channel in preview for 2.5 seconds
        this._highlightedChannel = id;
        this.requestUpdate();

        setTimeout(() => {
            this._highlightedChannel = null;
            this.requestUpdate();
        }, 2500);
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
            // Advanced routing parameters (with defaults)
            clearance: undefined, // Will use MSD default
            corner_style: 'miter',
            corner_radius: 12,
            smoothing_mode: 'none',
            smoothing_iterations: 0,
            // Channel routing
            route_channels: [],
            channel_mode: 'prefer',
            // Animation - handled via animations array
            style: {
                color: 'var(--lcars-orange)',
                width: 2,
                dash_array: '',
                marker_end: null
            }
        };
        this._lineFormActiveSubtab = 'basic';
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

        // Parse using correct schema - include all routing parameters
        this._lineFormData = {
            id: line.id,
            anchor: line.anchor || '',
            attach_to: line.attach_to || '',
            anchor_side: line.anchor_side || 'center',
            attach_side: line.attach_side || 'center',
            anchor_gap: line.anchor_gap || 0,
            attach_gap: line.attach_gap || 0,
            route: line.route || 'auto',
            // Advanced routing parameters
            clearance: line.clearance,
            corner_style: line.corner_style || 'miter',
            corner_radius: line.corner_radius || 12,
            smoothing_mode: line.smoothing_mode || 'none',
            smoothing_iterations: line.smoothing_iterations || 0,
            // Channel routing
            route_channels: line.route_channels || [],
            channel_mode: line.channel_mode || 'prefer',
            // Animations
            animations: line.animations || [],
            // Style (load with backward compatibility for old property names)
            style: {
                color: line.style?.color || line.style?.stroke || 'var(--lcars-orange)',
                width: line.style?.width || line.style?.stroke_width || 2,
                opacity: line.style?.opacity ?? 1,
                dash_array: line.style?.dash_array || '',
                marker_end: line.style?.marker_end || null,
                marker_start: line.style?.marker_start || null
            }
        };

        this._lineFormActiveSubtab = 'basic';
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
            route: this._lineFormData.route || 'auto'
        };

        // Attachment sides (always save if present)
        if (this._lineFormData.anchor_side) {
            lineOverlay.anchor_side = this._lineFormData.anchor_side;
        }
        if (this._lineFormData.attach_side) {
            lineOverlay.attach_side = this._lineFormData.attach_side;
        }

        // Gap values
        if (this._lineFormData.anchor_gap != null && this._lineFormData.anchor_gap !== 0) {
            lineOverlay.anchor_gap = this._lineFormData.anchor_gap;
        }
        if (this._lineFormData.attach_gap != null && this._lineFormData.attach_gap !== 0) {
            lineOverlay.attach_gap = this._lineFormData.attach_gap;
        }

        // Advanced routing parameters
        if (this._lineFormData.clearance != null) {
            lineOverlay.clearance = this._lineFormData.clearance;
        }
        if (this._lineFormData.corner_style && this._lineFormData.corner_style !== 'miter') {
            lineOverlay.corner_style = this._lineFormData.corner_style;
        }
        if (this._lineFormData.corner_radius != null && this._lineFormData.corner_radius !== 12) {
            lineOverlay.corner_radius = this._lineFormData.corner_radius;
        }
        if (this._lineFormData.smoothing_mode && this._lineFormData.smoothing_mode !== 'none') {
            lineOverlay.smoothing_mode = this._lineFormData.smoothing_mode;
        }
        if (this._lineFormData.smoothing_iterations != null && this._lineFormData.smoothing_iterations !== 0) {
            lineOverlay.smoothing_iterations = this._lineFormData.smoothing_iterations;
        }

        // Channel routing
        if (this._lineFormData.route_channels && this._lineFormData.route_channels.length > 0) {
            lineOverlay.route_channels = this._lineFormData.route_channels;
        }
        if (this._lineFormData.channel_mode && this._lineFormData.channel_mode !== 'prefer') {
            lineOverlay.channel_mode = this._lineFormData.channel_mode;
        }

        // Add style if present (using canonical property names)
        if (this._lineFormData.style && Object.keys(this._lineFormData.style).length > 0) {
            const style = {};

            // Core stroke properties (always save if present)
            if (this._lineFormData.style.color != null) {
                style.color = this._lineFormData.style.color;
            }
            if (this._lineFormData.style.width != null) {
                style.width = this._lineFormData.style.width;
            }
            if (this._lineFormData.style.opacity != null && this._lineFormData.style.opacity !== 1) {
                style.opacity = this._lineFormData.style.opacity;
            }

            // Optional properties
            if (this._lineFormData.style.dash_array) {
                style.dash_array = this._lineFormData.style.dash_array;
            }
            if (this._lineFormData.style.marker_end) {
                style.marker_end = this._lineFormData.style.marker_end;
            }
            if (this._lineFormData.style.marker_start) {
                style.marker_start = this._lineFormData.style.marker_start;
            }

            if (Object.keys(style).length > 0) {
                lineOverlay.style = style;
            }
        }

        // Animations (save if present)
        if (this._lineFormData.animations && this._lineFormData.animations.length > 0) {
            lineOverlay.animations = this._lineFormData.animations;
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
     * Handle line form tab change
     * @param {CustomEvent} event - Tab change event
     * @private
     */
    _handleLineFormTabChange(event) {
        event.stopPropagation();
        const tabValue = event.target.activeTab?.getAttribute('value');
        if (tabValue) {
            this._lineFormActiveSubtab = tabValue;
            this.requestUpdate();
        }
    }

    /**
     * Delete line overlay
     * @param {Object} line - Line to delete
     * @private
     */
    async _deleteLine(line) {
        if (!await this._showConfirmDialog('Delete Line', `Delete line "${line.id}"?`)) {
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
        lcardsLog.info('[MSDStudio] Highlight line:', line.id);

        // Set highlighted line for overlay rendering
        this._highlightedLine = line.id;

        // Also update debug settings for MSD card's line path rendering
        this._debugSettings = {
            ...this._debugSettings,
            line_paths: true,
            highlighted_line: line.id
        };

        this._schedulePreviewUpdate();
        this.requestUpdate();

        // Remove highlight after 2 seconds
        setTimeout(() => {
            this._highlightedLine = null;
            const { highlighted_line, ...settings } = this._debugSettings;
            this._debugSettings = settings;
            this._schedulePreviewUpdate();
            this.requestUpdate();
        }, 2500);
    }

    /**
     * Open line form with pre-filled connection from connect mode
     * @param {string} anchor - Source anchor/overlay
     * @param {string} attachTo - Target anchor/overlay
     * @param {string} anchorSide - Optional source side
     * @param {string} attachSide - Optional target side
     * @private
     */
    /**
     * Open line form with connection data pre-filled
     * @param {Object} source - Source connection info {type, id, point}
     * @param {Object} target - Target connection info {type, id, point}
     * @private
     */
    _openLineFormWithConnection(source, target) {
        this._openLineForm();

        // Set anchor (source) - just the ID
        this._lineFormData.anchor = source.id;

        // Set attach_to (target) - just the ID
        this._lineFormData.attach_to = target.id;

        // Set anchor_side (source attachment point) - convert point name to side format
        if (source.point) {
            this._lineFormData.anchor_side = this._convertPointToSide(source.point);
        }

        // Set attach_side (target attachment point)
        if (target.point) {
            this._lineFormData.attach_side = this._convertPointToSide(target.point);
        }

        this.requestUpdate();
    }

    /**
     * Convert attachment point name to side format
     * @param {string} point - Point name (e.g., 'top-left', 'middle-center')
     * @returns {string} - Side format (e.g., 'top-left', 'center')
     * @private
     */
    _convertPointToSide(point) {
        // Map attachment point names to side names
        const mapping = {
            'top-left': 'top-left',
            'top-center': 'top',
            'top-right': 'top-right',
            'middle-left': 'left',
            'center': 'center',
            'middle-right': 'right',
            'bottom-left': 'bottom-left',
            'bottom-center': 'bottom',
            'bottom-right': 'bottom-right'
        };
        return mapping[point] || 'center';
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

                <!-- Sticky Line Preview -->
                <div style="position: sticky; top: 0; background: var(--card-background-color); padding: 16px 24px; border-bottom: 1px solid var(--divider-color);">
                    ${this._renderLineStylePreview()}
                </div>

                <!-- Subtabs -->
                <ha-tab-group @wa-tab-show=${this._handleLineFormTabChange} style="padding: 0 24px;">
                    <ha-tab-group-tab value="basic" ?active=${this._lineFormActiveSubtab === 'basic'}>Basic</ha-tab-group-tab>
                    <ha-tab-group-tab value="style" ?active=${this._lineFormActiveSubtab === 'style'}>Style</ha-tab-group-tab>
                    <ha-tab-group-tab value="markers" ?active=${this._lineFormActiveSubtab === 'markers'}>Markers</ha-tab-group-tab>
                    <ha-tab-group-tab value="animation" ?active=${this._lineFormActiveSubtab === 'animation'}>Animation</ha-tab-group-tab>
                    <ha-tab-group-tab value="routing" ?active=${this._lineFormActiveSubtab === 'routing'}>Routing</ha-tab-group-tab>
                </ha-tab-group>

                <!-- Subtab Content -->
                <div style="padding: 16px; max-height: 60vh; overflow-y: auto;">
                    ${this._renderLineFormTabContent()}
                </div>

                <div slot="primaryAction">
                    <ha-button @click=${this._saveLine}>
                        <ha-icon icon="mdi:content-save" slot="icon"></ha-icon>
                        Save
                    </ha-button>
                </div>

                <div slot="secondaryAction">
                    <ha-button @click=${this._closeLineForm} appearance="plain">
                        <ha-icon icon="mdi:close" slot="icon"></ha-icon>
                        Cancel
                    </ha-button>
                </div>
            </ha-dialog>
        `;
    }

    /**
     * Route to appropriate tab content renderer
     * @returns {TemplateResult}
     * @private
     */
    _renderLineFormTabContent() {
        switch (this._lineFormActiveSubtab) {
            case 'basic':
                return this._renderLineFormBasic();
            case 'style':
                return this._renderLineFormStyle();
            case 'markers':
                return this._renderLineFormMarkers();
            case 'routing':
                return this._renderLineFormRouting();
            case 'animation':
                return this._renderLineFormAnimation();
            default:
                return this._renderLineFormBasic();
        }
    }

    /**
     * Render Basic tab (Line ID + Start/End points)
     * @returns {TemplateResult}
     * @private
     */
    _renderLineFormBasic() {
        // Build complete anchor dropdown options - INCLUDING base_svg anchors
        const userAnchors = this._workingConfig.msd?.anchors || {};
        const baseSvgAnchors = this._getBaseSvgAnchors();
        const overlays = this._getControlOverlays();

        const userAnchorOptions = Object.keys(userAnchors).map(name => ({
            value: name,
            label: `Anchor: ${name}`
        }));

        const baseSvgAnchorOptions = Object.keys(baseSvgAnchors).map(name => ({
            value: name,
            label: `Base SVG: ${name}`
        }));

        const overlayOptions = overlays.map(o => ({
            value: o.id,
            label: `Overlay: ${o.id}`
        }));

        const allSourceOptions = [...userAnchorOptions, ...baseSvgAnchorOptions, ...overlayOptions];

        // Determine if anchor/attach_to are overlay IDs
        const anchorIsOverlay = this._isOverlayId(this._lineFormData.anchor);
        const attachToIsOverlay = this._isOverlayId(this._lineFormData.attach_to);

        // Get routing mode info
        const routingInfo = this._getRoutingModeInfo(this._lineFormData.route || 'auto');

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

                <!-- Horizontal Source → Target Layout -->
                <div class="line-connection-flow">
                    <!-- Source Column -->
                    <lcards-form-section
                        header="Source (Anchor)"
                        description="Starting point for the line"
                        class="connection-source"
                        ?expanded=${true}>

                        <ha-selector
                            .hass=${this.hass}
                            .selector=${{
                                select: {
                                    options: allSourceOptions
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

                        <div style="display: grid; grid-template-columns: 1fr 120px; gap: 12px; margin-top: 12px; align-items: start;">
                            <lcards-position-picker
                                .value=${this._lineFormData.anchor_side || 'center'}
                                .label=${'Anchor Side'}
                                .helper=${'Select attachment point on the source'}
                                @value-changed=${(e) => {
                                    this._lineFormData.anchor_side = e.detail.value;
                                    this.requestUpdate();
                                }}>
                            </lcards-position-picker>

                            <ha-textfield
                                type="number"
                                label="Gap (px)"
                                .value=${String(this._lineFormData.anchor_gap || 0)}
                                @input=${(e) => {
                                    this._lineFormData.anchor_gap = Number(e.target.value);
                                    this.requestUpdate();
                                }}
                                helper-text="Distance from point"
                                style="width: 100%;">
                            </ha-textfield>
                        </div>
                    </lcards-form-section>

                    <!-- Flow Arrow -->
                    <div class="connection-arrow">
                        <ha-icon icon="mdi:arrow-right-thick"></ha-icon>
                    </div>

                    <!-- Target Column -->
                    <lcards-form-section
                        header="Target (Attach To)"
                        description="Ending point for the line"
                        class="connection-target"
                        ?expanded=${true}>

                        <ha-selector
                            .hass=${this.hass}
                            .selector=${{
                                select: {
                                    options: allSourceOptions
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

                        <div style="display: grid; grid-template-columns: 1fr 120px; gap: 12px; margin-top: 12px; align-items: start;">
                            <lcards-position-picker
                                .value=${this._lineFormData.attach_side || 'center'}
                                .label=${'Attach Side'}
                                .helper=${'Select attachment point on the target'}
                                @value-changed=${(e) => {
                                    this._lineFormData.attach_side = e.detail.value;
                                    this.requestUpdate();
                                }}>
                            </lcards-position-picker>

                            <ha-textfield
                                type="number"
                                label="Gap (px)"
                                .value=${String(this._lineFormData.attach_gap || 0)}
                                @input=${(e) => {
                                    this._lineFormData.attach_gap = Number(e.target.value);
                                    this.requestUpdate();
                                }}
                                helper-text="Distance from point"
                                style="width: 100%;">
                            </ha-textfield>
                        </div>
                    </lcards-form-section>
                </div>
            </div>
        `;
    }

    /**
     * Render Routing tab
     * @returns {TemplateResult}
     * @private
     */
    _renderLineFormRouting() {
        // Get routing mode info
        const routingInfo = this._getRoutingModeInfo(this._lineFormData.route || 'auto');

        return html`
            <div style="display: flex; flex-direction: column; gap: 16px;">
                <!-- Routing Configuration - 2 Column Layout -->
                <lcards-form-section
                    header="Routing Configuration"
                    description="How the line is drawn between points"
                    ?expanded=${true}>

                    <div class="routing-columns">
                        <!-- Left Column: Mode Selection + Info Panel -->
                        <div class="routing-mode-column">
                            <ha-selector
                                .hass=${this.hass}
                                .selector=${{
                                    select: {
                                        options: [
                                            { value: 'auto', label: 'Auto (Smart Pathfinding)' },
                                            { value: 'direct', label: 'Direct (Straight Line)' },
                                            { value: 'manhattan', label: 'Manhattan (90° Angles)' },
                                            { value: 'grid', label: 'Grid (A* Pathfinding)' },
                                            { value: 'smart', label: 'Smart (Cost-Optimized)' }
                                        ]
                                    }
                                }}
                                .value=${this._lineFormData.route || 'auto'}
                                .label=${'Route'}
                                @value-changed=${(e) => {
                                    this._lineFormData.route = e.detail.value;
                                    this.requestUpdate();
                                }}>
                            </ha-selector>

                            <!-- Routing Mode Information Panel -->
                            <div class="routing-info-panel">
                                <div class="routing-info-header">
                                    <ha-icon icon="${routingInfo.icon}"></ha-icon>
                                    <span>${routingInfo.title}</span>
                                </div>
                                <div class="routing-info-description">
                                    ${routingInfo.description}
                                </div>
                                <div class="routing-info-diagram">
                                    ${routingInfo.diagram}
                                </div>
                            </div>
                        </div>

                        <!-- Right Column: Advanced Options + Channels -->
                        <div class="routing-advanced-column">
                            <div style="font-weight: 600; font-size: 13px; color: var(--primary-text-color); margin-bottom: 8px;">
                                Advanced Options
                            </div>

                            <ha-textfield
                                type="number"
                                label="Clearance (pixels)"
                                .value=${String(this._lineFormData.clearance || '')}
                                @input=${(e) => {
                                    const val = e.target.value;
                                    this._lineFormData.clearance = val ? Number(val) : undefined;
                                    this.requestUpdate();
                                }}
                                helper-text="Minimum pixels from obstacles (default: 8)"
                                style="margin-top: 12px; width: 100%;">
                            </ha-textfield>

                            <!-- Channel Routing -->
                            ${this._renderChannelRoutingOptions()}
                        </div>
                    </div>
                </lcards-form-section>
            </div>
        `;
    }

    /**
     * Render Markers tab
     * @returns {TemplateResult}
     * @private
     */
    _renderLineFormMarkers() {
        return html`
            <div style="display: flex; flex-direction: column; gap: 16px;">
                <lcards-form-section
                    header="Start Marker"
                    description="Marker at the beginning of the line"
                    ?expanded=${true}>

                    <ha-selector
                        .hass=${this.hass}
                        .selector=${{
                            select: {
                                options: [
                                    { value: 'none', label: 'None' },
                                    { value: 'arrow', label: 'Arrow' },
                                    { value: 'dot', label: 'Dot' },
                                    { value: 'diamond', label: 'Diamond' },
                                    { value: 'square', label: 'Square' },
                                    { value: 'triangle', label: 'Triangle' },
                                    { value: 'line', label: 'Line (Orthogonal)' },
                                    { value: 'rect', label: 'Rectangle (Outlined)' }
                                ]
                            }
                        }}
                        .value=${this._lineFormData.style?.marker_start?.type || 'none'}
                        .label=${'Type'}
                        @value-changed=${(e) => {
                            const markerType = e.detail.value;
                            if (markerType === 'none') {
                                const { marker_start, ...styleWithoutMarkerStart } = this._lineFormData.style || {};
                                this._lineFormData.style = styleWithoutMarkerStart;
                            } else {
                                const existingSize = this._lineFormData.style?.marker_start?.size ?? 10;
                                this._lineFormData.style = {
                                    ...this._lineFormData.style,
                                    marker_start: { type: markerType, size: existingSize }
                                };
                            }
                            this.requestUpdate();
                        }}>
                    </ha-selector>

                    ${this._lineFormData.style?.marker_start?.type && this._lineFormData.style.marker_start.type !== 'none' ? html`
                        <ha-textfield
                            type="number"
                            label="Size (pixels)"
                            .value=${String(this._lineFormData.style.marker_start.size ?? 10)}
                            step="1"
                            min="1"
                            style="margin-top: 12px;"
                            @input=${(e) => {
                                this._lineFormData.style = {
                                    ...this._lineFormData.style,
                                    marker_start: {
                                        ...this._lineFormData.style.marker_start,
                                        size: Number(e.target.value) || 10
                                    }
                                };
                                this.requestUpdate();
                            }}>
                        </ha-textfield>

                        <div style="margin-top: 12px;">
                            <div style="font-size: 14px; font-weight: 500; margin-bottom: 8px; color: var(--primary-text-color);">Fill Color</div>
                            <lcards-color-picker
                                .hass=${this.hass}
                                .value=${this._lineFormData.style.marker_start.fill || ''}
                                ?showPreview=${true}
                                @value-changed=${(e) => {
                                    this._lineFormData.style = {
                                        ...this._lineFormData.style,
                                        marker_start: {
                                            ...this._lineFormData.style.marker_start,
                                            fill: e.detail.value
                                        }
                                    };
                                    this.requestUpdate();
                                }}>
                            </lcards-color-picker>
                        </div>

                        <div style="display: grid; grid-template-columns: 1fr 120px; gap: 12px; margin-top: 12px;">
                            <div>
                                <div style="font-size: 14px; font-weight: 500; margin-bottom: 8px; color: var(--primary-text-color);">Stroke Color</div>
                                <lcards-color-picker
                                    .hass=${this.hass}
                                    .value=${this._lineFormData.style.marker_start.stroke || ''}
                                    ?showPreview=${true}
                                    @value-changed=${(e) => {
                                        this._lineFormData.style = {
                                            ...this._lineFormData.style,
                                            marker_start: {
                                                ...this._lineFormData.style.marker_start,
                                                stroke: e.detail.value
                                            }
                                        };
                                        this.requestUpdate();
                                    }}>
                                </lcards-color-picker>
                            </div>

                            <ha-textfield
                                type="number"
                                label="Stroke Width"
                                .value=${String(this._lineFormData.style.marker_start.stroke_width || 0)}
                                @input=${(e) => {
                                    this._lineFormData.style = {
                                        ...this._lineFormData.style,
                                        marker_start: {
                                            ...this._lineFormData.style.marker_start,
                                            stroke_width: Number(e.target.value) || 0
                                        }
                                    };
                                    this.requestUpdate();
                                }}>
                            </ha-textfield>
                        </div>
                    ` : ''}
                </lcards-form-section>

                <lcards-form-section
                    header="End Marker"
                    description="Marker at the end of the line"
                    ?expanded=${true}>

                    <ha-selector
                        .hass=${this.hass}
                        .selector=${{
                            select: {
                                options: [
                                    { value: 'none', label: 'None' },
                                    { value: 'arrow', label: 'Arrow' },
                                    { value: 'dot', label: 'Dot' },
                                    { value: 'diamond', label: 'Diamond' },
                                    { value: 'square', label: 'Square' },
                                    { value: 'triangle', label: 'Triangle' },
                                    { value: 'line', label: 'Line (Orthogonal)' },
                                    { value: 'rect', label: 'Rectangle (Outlined)' }
                                ]
                            }
                        }}
                        .value=${this._lineFormData.style?.marker_end?.type || 'none'}
                        .label=${'Type'}
                        @value-changed=${(e) => {
                            const markerType = e.detail.value;
                            if (markerType === 'none') {
                                this._lineFormData.style = { ...this._lineFormData.style, marker_end: null };
                            } else {
                                const existingSize = this._lineFormData.style?.marker_end?.size ?? 10;
                                this._lineFormData.style = {
                                    ...this._lineFormData.style,
                                    marker_end: { type: markerType, size: existingSize }
                                };
                            }
                            this.requestUpdate();
                        }}>
                    </ha-selector>

                    ${this._lineFormData.style?.marker_end?.type && this._lineFormData.style.marker_end.type !== 'none' ? html`
                        <ha-textfield
                            type="number"
                            label="Size (pixels)"
                            .value=${String(this._lineFormData.style.marker_end.size ?? 10)}
                            step="1"
                            min="1"
                            style="margin-top: 12px;"
                            @input=${(e) => {
                                this._lineFormData.style = {
                                    ...this._lineFormData.style,
                                    marker_end: {
                                        ...this._lineFormData.style.marker_end,
                                        size: Number(e.target.value) || 10
                                    }
                                };
                                this.requestUpdate();
                            }}>
                        </ha-textfield>

                        <div style="margin-top: 12px;">
                            <div style="font-size: 14px; font-weight: 500; margin-bottom: 8px; color: var(--primary-text-color);">Fill Color</div>
                            <lcards-color-picker
                                .hass=${this.hass}
                                .value=${this._lineFormData.style.marker_end.fill || ''}
                                ?showPreview=${true}
                                @value-changed=${(e) => {
                                    this._lineFormData.style = {
                                        ...this._lineFormData.style,
                                        marker_end: {
                                            ...this._lineFormData.style.marker_end,
                                            fill: e.detail.value
                                        }
                                    };
                                    this.requestUpdate();
                                }}>
                            </lcards-color-picker>
                        </div>

                        <div style="display: grid; grid-template-columns: 1fr 120px; gap: 12px; margin-top: 12px;">
                            <div>
                                <div style="font-size: 14px; font-weight: 500; margin-bottom: 8px; color: var(--primary-text-color);">Stroke Color</div>
                                <lcards-color-picker
                                    .hass=${this.hass}
                                    .value=${this._lineFormData.style.marker_end.stroke || ''}
                                    ?showPreview=${true}
                                    @value-changed=${(e) => {
                                        this._lineFormData.style = {
                                            ...this._lineFormData.style,
                                            marker_end: {
                                                ...this._lineFormData.style.marker_end,
                                                stroke: e.detail.value
                                            }
                                        };
                                        this.requestUpdate();
                                    }}>
                                </lcards-color-picker>
                            </div>

                            <ha-textfield
                                type="number"
                                label="Stroke Width"
                                .value=${String(this._lineFormData.style.marker_end.stroke_width || 0)}
                                @input=${(e) => {
                                    this._lineFormData.style = {
                                        ...this._lineFormData.style,
                                        marker_end: {
                                            ...this._lineFormData.style.marker_end,
                                            stroke_width: Number(e.target.value) || 0
                                        }
                                    };
                                    this.requestUpdate();
                                }}>
                            </ha-textfield>
                        </div>
                    ` : ''}
                </lcards-form-section>
            </div>
        `;
    }

    /**
     * Render Animation tab
     * @returns {TemplateResult}
     * @private
     */
    _renderLineFormAnimation() {
        return html`
            <div style="display: flex; flex-direction: column; gap: 16px;">
                <lcards-form-section
                    header="Line Animations"
                    description="Configure animations for this line"
                    ?expanded=${true}>

                    <lcards-animation-editor
                        .hass=${this.hass}
                        .animations=${this._lineFormData.animations || []}
                        @animations-changed=${(e) => {
                            this._lineFormData.animations = e.detail.value;
                            this.requestUpdate();
                        }}
                    ></lcards-animation-editor>
                </lcards-form-section>
            </div>
        `;
    }

    /**
     * Render Style & Animation subtab with 2-column condensed layout
     * @returns {TemplateResult}
     * @private
     */
    _renderLineFormStyle() {
        // Get line style preset from dash_array
        const dashArray = this._lineFormData.style?.dash_array || '';
        let lineStylePreset = 'solid';
        if (dashArray === '5,5') lineStylePreset = 'dashed';
        else if (dashArray === '2,2') lineStylePreset = 'dotted';
        else if (dashArray === '8,4,2,4') lineStylePreset = 'dash-dot';
        else if (dashArray && dashArray !== '') lineStylePreset = 'custom';

        // Get available animations
        const animations = this._workingConfig.msd?.animations || [];
        const animationOptions = [
            { value: '', label: 'None' },
            ...animations.map(anim => ({
                value: anim.id,
                label: anim.id
            }))
        ];

        return html`
            <div style="display: flex; flex-direction: column; gap: 16px;">
                <!-- Two Column Layout for Style Controls -->
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; align-items: start;">

                    <!-- Left Column: Color, Width, Style -->
                    <lcards-form-section
                        header="Line Style"
                        description="Line appearance settings"
                        ?expanded=${true}>

                        <!-- Color Picker -->
                        <div style="margin-bottom: 12px;">
                            <label style="display: block; margin-bottom: 8px; font-weight: 500; font-size: 13px;">Color</label>
                            <lcards-color-picker
                                .value=${this._lineFormData.style?.color || 'var(--lcars-orange)'}
                                @value-changed=${(e) => {
                                    this._lineFormData.style = { ...this._lineFormData.style, color: e.detail.value };
                                    this.requestUpdate();
                                }}>
                            </lcards-color-picker>
                        </div>

                        <!-- Width Slider -->
                        <ha-selector
                            .hass=${this.hass}
                            .selector=${{
                                number: {
                                    min: 1,
                                    max: 30,
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

                        <!-- Opacity Slider -->
                        <ha-selector
                            .hass=${this.hass}
                            .selector=${{
                                number: {
                                    min: 0,
                                    max: 1,
                                    step: 0.01,
                                    mode: 'slider'
                                }
                            }}
                            .value=${this._lineFormData.style?.opacity ?? 1}
                            .label=${'Opacity'}
                            @value-changed=${(e) => {
                                this._lineFormData.style = { ...this._lineFormData.style, opacity: e.detail.value };
                                this.requestUpdate();
                            }}
                            helper-text="Line opacity (0 = transparent, 1 = opaque)"
                            style="margin-top: 12px;">
                        </ha-selector>

                        <!-- Line Style Dropdown -->
                        <ha-selector
                            .hass=${this.hass}
                            .selector=${{
                                select: {
                                    options: [
                                        { value: 'solid', label: 'Solid' },
                                        { value: 'dashed', label: 'Dashed' },
                                        { value: 'dotted', label: 'Dotted' },
                                        { value: 'dash-dot', label: 'Dash-Dot' },
                                        { value: 'custom', label: 'Custom' }
                                    ]
                                }
                            }}
                            .value=${lineStylePreset}
                            .label=${'Style'}
                            @value-changed=${(e) => {
                                const preset = e.detail.value;
                                let dashArray = '';

                                if (preset === 'dashed') dashArray = '5,5';
                                else if (preset === 'dotted') dashArray = '2,2';
                                else if (preset === 'dash-dot') dashArray = '8,4,2,4';
                                else if (preset === 'solid') dashArray = '';

                                if (preset !== 'custom') {
                                    this._lineFormData.style = { ...this._lineFormData.style, dash_array: dashArray };
                                    this.requestUpdate();
                                }
                            }}
                            style="margin-top: 12px;">
                        </ha-selector>

                        <!-- Dash Pattern Customization (conditional - all non-solid presets) -->
                        ${lineStylePreset !== 'solid' ? html`
                            <div style="margin-top: 16px; padding: 12px; background: var(--card-background-color); border: 1px solid var(--divider-color); border-radius: 4px;">
                                <div style="font-weight: 500; font-size: 13px; margin-bottom: 12px;">
                                    ${lineStylePreset === 'custom' ? 'Custom' : 'Customize'} Dash Pattern
                                </div>

                                <!-- Parse existing dash_array -->
                                ${(() => {
                                    const parts = (dashArray || '').split(',').map(p => parseFloat(p.trim()) || 0);
                                    const dash1 = parts[0] || 5;
                                    const gap1 = parts[1] || 5;
                                    const dash2 = parts[2] || 0;
                                    const gap2 = parts[3] || 0;

                                    return html`
                                        <!-- Dash 1 -->
                                        <ha-selector
                                            .hass=${this.hass}
                                            .selector=${{
                                                number: {
                                                    min: 0,
                                                    max: 50,
                                                    step: 1,
                                                    mode: 'slider'
                                                }
                                            }}
                                            .value=${dash1}
                                            .label=${'Dash Length'}
                                            @value-changed=${(e) => {
                                                const newDash1 = e.detail.value;
                                                let pattern;
                                                if (dash2 > 0) {
                                                    pattern = `${newDash1},${gap1},${dash2},${gap2}`;
                                                } else {
                                                    pattern = `${newDash1},${gap1}`;
                                                }
                                                this._lineFormData.style = { ...this._lineFormData.style, dash_array: pattern };
                                                this.requestUpdate();
                                            }}>
                                        </ha-selector>

                                        <!-- Gap 1 -->
                                        <ha-selector
                                            .hass=${this.hass}
                                            .selector=${{
                                                number: {
                                                    min: 0,
                                                    max: 50,
                                                    step: 1,
                                                    mode: 'slider'
                                                }
                                            }}
                                            .value=${gap1}
                                            .label=${'Gap Length'}
                                            @value-changed=${(e) => {
                                                const newGap1 = e.detail.value;
                                                let pattern;
                                                if (dash2 > 0) {
                                                    pattern = `${dash1},${newGap1},${dash2},${gap2}`;
                                                } else {
                                                    pattern = `${dash1},${newGap1}`;
                                                }
                                                this._lineFormData.style = { ...this._lineFormData.style, dash_array: pattern };
                                                this.requestUpdate();
                                            }}
                                            style="margin-top: 12px;">
                                        </ha-selector>

                                        <!-- Toggle for complex pattern (only show for simple patterns) -->
                                        ${(lineStylePreset === 'dotted' || lineStylePreset === 'dashed' || lineStylePreset === 'custom') ? html`
                                            <ha-formfield label="Add secondary dash/gap" style="margin-top: 12px;">
                                                <ha-checkbox
                                                    ?checked=${dash2 > 0}
                                                    @change=${(e) => {
                                                        if (e.target.checked) {
                                                            this._lineFormData.style = { ...this._lineFormData.style, dash_array: `${dash1},${gap1},2,2` };
                                                        } else {
                                                            this._lineFormData.style = { ...this._lineFormData.style, dash_array: `${dash1},${gap1}` };
                                                        }
                                                        this.requestUpdate();
                                                    }}>
                                                </ha-checkbox>
                                            </ha-formfield>
                                        ` : ''}

                                        ${dash2 > 0 ? html`
                                            <!-- Dash 2 -->
                                            <ha-selector
                                                .hass=${this.hass}
                                                .selector=${{
                                                    number: {
                                                        min: 0,
                                                        max: 50,
                                                        step: 1,
                                                        mode: 'slider'
                                                    }
                                                }}
                                                .value=${dash2}
                                                .label=${'Secondary Dash'}
                                                @value-changed=${(e) => {
                                                    const newDash2 = e.detail.value;
                                                    const pattern = `${dash1},${gap1},${newDash2},${gap2}`;
                                                    this._lineFormData.style = { ...this._lineFormData.style, dash_array: pattern };
                                                    this.requestUpdate();
                                                }}
                                                style="margin-top: 12px;">
                                            </ha-selector>

                                            <!-- Gap 2 -->
                                            <ha-selector
                                                .hass=${this.hass}
                                                .selector=${{
                                                    number: {
                                                        min: 0,
                                                        max: 50,
                                                        step: 1,
                                                        mode: 'slider'
                                                    }
                                                }}
                                                .value=${gap2}
                                                .label=${'Secondary Gap'}
                                                @value-changed=${(e) => {
                                                    const newGap2 = e.detail.value;
                                                    const pattern = `${dash1},${gap1},${dash2},${newGap2}`;
                                                    this._lineFormData.style = { ...this._lineFormData.style, dash_array: pattern };
                                                    this.requestUpdate();
                                                }}
                                                style="margin-top: 12px;">
                                            </ha-selector>
                                        ` : ''}

                                        <!-- Current Pattern Display -->
                                        <div style="margin-top: 12px; font-size: 12px; color: var(--secondary-text-color); font-family: monospace;">
                                            Pattern: ${dash2 > 0 ? `${dash1},${gap1},${dash2},${gap2}` : `${dash1},${gap1}`}
                                        </div>
                                    `;
                                })()}
                            </div>
                        ` : ''}
                    </lcards-form-section>

                    <!-- Right Column: Line Shape -->
                    <lcards-form-section
                        header="Line Shape"
                        description="Corner and smoothing settings"
                        ?expanded=${true}>

                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
                        <!-- Left Column: Corner Settings -->
                        <div>
                            <ha-selector
                                .hass=${this.hass}
                                .selector=${{select: {
                                    options: [
                                        { value: 'miter', label: 'Miter (Sharp)' },
                                        { value: 'round', label: 'Round (Arc)' },
                                        { value: 'bevel', label: 'Bevel (Cut)' }
                                    ]
                                }}}
                                .value=${this._lineFormData.corner_style || 'miter'}
                                .label=${'Corner Style'}
                                @value-changed=${(e) => {
                                    this._lineFormData.corner_style = e.detail.value;
                                    this.requestUpdate();
                                }}>
                            </ha-selector>

                            ${(this._lineFormData.corner_style === 'round') ? html`
                                <ha-textfield
                                    type="number"
                                    label="Corner Radius (pixels)"
                                    .value=${String(this._lineFormData.corner_radius || 12)}
                                    @input=${(e) => {
                                        this._lineFormData.corner_radius = Number(e.target.value) || 12;
                                        this.requestUpdate();
                                    }}
                                    helper-text="Arc radius for rounded corners"
                                    style="margin-top: 12px; width: 100%;">
                                </ha-textfield>
                            ` : ''}

                            ${(this._lineFormData.corner_style === 'miter') ? html`
                                <ha-textfield
                                    type="number"
                                    label="Miter Limit"
                                    .value=${String(this._lineFormData.miter_limit || 4)}
                                    @input=${(e) => {
                                        this._lineFormData.miter_limit = Number(e.target.value) || 4;
                                        this.requestUpdate();
                                    }}
                                    helper-text="Max ratio before clipping sharp corners (default: 4)"
                                    style="margin-top: 12px; width: 100%;">
                                </ha-textfield>
                            ` : ''}

                        <!-- Smoothing Settings -->
                        <ha-selector
                                .hass=${this.hass}
                                .selector=${{select: {
                                    options: [
                                        { value: 'none', label: 'None' },
                                        { value: 'chaikin', label: 'Chaikin (Corner-cutting)' }
                                    ]
                                }}}
                                .value=${this._lineFormData.smoothing_mode || 'none'}
                                .label=${'Smoothing Mode'}
                                @value-changed=${(e) => {
                                    this._lineFormData.smoothing_mode = e.detail.value;
                                    this.requestUpdate();
                                }}
                                style="margin-top: 16px;">
                            </ha-selector>

                            ${(this._lineFormData.smoothing_mode === 'chaikin') ? html`
                                <ha-textfield
                                    type="number"
                                    label="Smoothing Iterations"
                                    .value=${String(this._lineFormData.smoothing_iterations || 0)}
                                    @input=${(e) => {
                                        this._lineFormData.smoothing_iterations = Number(e.target.value) || 0;
                                        this.requestUpdate();
                                    }}
                                    helper-text="More iterations = smoother curves"
                                    style="margin-top: 12px; width: 100%;">
                                </ha-textfield>
                            ` : ''}
                    </lcards-form-section>
                </div>

                <!-- Advanced Stroke Properties (Full Width) -->
                <lcards-form-section
                    header="⚙️ Advanced Stroke Properties"
                    description="Fine-tune SVG stroke rendering (for advanced users)"
                    ?expanded=${false}>

                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
                        <!-- Left Column -->
                        <div>
                            <!-- Line Cap -->
                            <ha-selector
                                .hass=${this.hass}
                                .selector=${{
                                    select: {
                                        options: [
                                            { value: 'butt', label: 'Butt (Flat)' },
                                            { value: 'round', label: 'Round' },
                                            { value: 'square', label: 'Square (Extended)' }
                                        ]
                                    }
                                }}
                                .value=${this._lineFormData.style?.line_cap || 'butt'}
                                .label=${'Line Cap'}
                                @value-changed=${(e) => {
                                    this._lineFormData.style = { ...this._lineFormData.style, line_cap: e.detail.value };
                                    this.requestUpdate();
                                }}
                                helper-text="How line endpoints are drawn">
                            </ha-selector>

                            <!-- Line Join -->
                            <ha-selector
                                .hass=${this.hass}
                                .selector=${{
                                    select: {
                                        options: [
                                            { value: 'miter', label: 'Miter (Sharp)' },
                                            { value: 'round', label: 'Round' },
                                            { value: 'bevel', label: 'Bevel (Cut)' }
                                        ]
                                    }
                                }}
                                .value=${this._lineFormData.style?.line_join || this._lineFormData.corner_style || 'miter'}
                                .label=${'Line Join'}
                                @value-changed=${(e) => {
                                    this._lineFormData.style = { ...this._lineFormData.style, line_join: e.detail.value };
                                    this.requestUpdate();
                                }}
                                helper-text="How line segments connect"
                                style="margin-top: 12px;">
                            </ha-selector>
                        </div>

                        <!-- Right Column -->
                        <div>
                            <!-- Stroke Override -->
                            <ha-textfield
                                label="Stroke Override"
                                .value=${this._lineFormData.style?.stroke || ''}
                                @input=${(e) => {
                                    const value = e.target.value.trim();
                                    if (value === '') {
                                        // Remove stroke override
                                        const { stroke, ...styleWithoutStroke } = this._lineFormData.style || {};
                                        this._lineFormData.style = styleWithoutStroke;
                                    } else {
                                        this._lineFormData.style = { ...this._lineFormData.style, stroke: value };
                                    }
                                    this.requestUpdate();
                                }}
                                helper-text="Override color with custom stroke (e.g., url(#gradient))"
                                style="width: 100%;">
                            </ha-textfield>

                            <!-- Dash Offset -->
                            <ha-textfield
                                type="number"
                                label="Dash Offset"
                                .value=${String(this._lineFormData.style?.dash_offset || 0)}
                                @input=${(e) => {
                                    this._lineFormData.style = { ...this._lineFormData.style, dash_offset: Number(e.target.value) || 0 };
                                    this.requestUpdate();
                                }}
                                helper-text="Shifts the dash pattern (pixels)"
                                style="margin-top: 12px; width: 100%;">
                            </ha-textfield>
                        </div>
                    </div>
                </lcards-form-section>
            </div>
        `;
    }

    /**
     * Render visual line style preview with dark background
     * @returns {TemplateResult}
     * @private
     */
    _renderLineStylePreview() {
        const color = this._lineFormData.style?.color || 'var(--lcars-orange)';
        const width = this._lineFormData.style?.width || 2;
        const opacity = this._lineFormData.style?.opacity ?? 1;
        const dashArray = this._lineFormData.style?.dash_array || '';
        const markerStart = this._lineFormData.style?.marker_start;
        const markerEnd = this._lineFormData.style?.marker_end;
        const cornerStyle = this._lineFormData.corner_style || 'miter';
        const cornerRadius = this._lineFormData.corner_radius || 12;
        const linecap = this._lineFormData.style?.line_cap || 'butt';
        const linejoin = this._lineFormData.style?.line_join || cornerStyle;

        // Helper function to create marker definition
        const createMarker = (marker, id) => {
            if (!marker?.type || marker.type === 'none') return '';

            // Use marker size directly in pixels
            const size = marker.size ?? 10;
            const half = size / 2;

            // Determine colors
            const fillColor = marker.fill || color;
            const strokeColor = marker.stroke || 'none';
            const strokeWidth = marker.stroke_width || 0;

            let shape = '';
            switch (marker.type) {
                case 'arrow':
                    shape = `<path d="M 0 0 L ${size} ${half} L 0 ${size} z" fill="${fillColor}" stroke="${strokeColor}" stroke-width="${strokeWidth}" opacity="${opacity}" />`;
                    break;
                case 'dot':
                    shape = `<circle cx="${half}" cy="${half}" r="${half * 0.6}" fill="${fillColor}" stroke="${strokeColor}" stroke-width="${strokeWidth}" opacity="${opacity}" />`;
                    break;
                case 'diamond':
                    shape = `<path d="M ${half} 0 L ${size} ${half} L ${half} ${size} L 0 ${half} z" fill="${fillColor}" stroke="${strokeColor}" stroke-width="${strokeWidth}" opacity="${opacity}" />`;
                    break;
                case 'square':
                    const offset = size * 0.15;
                    const sqSize = size * 0.7;
                    shape = `<rect x="${offset}" y="${offset}" width="${sqSize}" height="${sqSize}" fill="${fillColor}" stroke="${strokeColor}" stroke-width="${strokeWidth}" opacity="${opacity}" />`;
                    break;
                case 'triangle':
                    shape = `<path d="M ${half} 0 L ${size} ${size} L 0 ${size} z" fill="${fillColor}" stroke="${strokeColor}" stroke-width="${strokeWidth}" opacity="${opacity}" />`;
                    break;
                case 'line':
                    // Orthogonal line marker
                    const lineLength = size * 0.8;
                    const lineOffset = (size - lineLength) / 2;
                    shape = `<line x1="${half}" y1="${lineOffset}" x2="${half}" y2="${size - lineOffset}" stroke="${fillColor}" stroke-width="${Math.max(strokeWidth || 2, 2)}" stroke-linecap="round" opacity="${opacity}" />`;
                    break;
                case 'rect':
                    // Rectangle marker with fill and optional stroke
                    const rectSize = size * 0.7;
                    const rectOffset = (size - rectSize) / 2;
                    shape = `<rect x="${rectOffset}" y="${rectOffset}" width="${rectSize}" height="${rectSize}" fill="${fillColor}" stroke="${strokeColor}" stroke-width="${strokeWidth}" opacity="${opacity}" />`;
                    break;
            }

            // Embed shape directly - it's safe static SVG content
            return `
                <marker id="${id}" viewBox="0 0 ${size} ${size}"
                    markerWidth="${size}" markerHeight="${size}"
                    refX="${half}" refY="${half}" orient="auto">
                    ${shape}
                </marker>
            `;
        };

        // Create path with corners (L-shaped route)
        let pathD = 'M 20,35 L 80,35 L 80,15 L 220,15 L 220,35 L 280,35';

        // Apply corner rounding if round style is selected
        if (cornerStyle === 'round' && cornerRadius > 0) {
            const r = Math.min(cornerRadius, 15); // Cap radius for preview
            pathD = `M 20,35 L ${80-r},35 Q 80,35 80,${35-r} L 80,${15+r} Q 80,15 ${80+r},15 L ${220-r},15 Q 220,15 220,${15+r} L 220,${35-r} Q 220,35 ${220+r},35 L 280,35`;
        }

        return html`
            <div style="margin-top: 0; padding: 20px; background: #0a0a0a; border-radius: 8px; border: 1px solid #333;">
                <div style="font-size: 12px; font-weight: 500; margin-bottom: 12px; color: #999;">Preview</div>
                <svg viewBox="0 0 300 50" style="width: 100%; height: 85px; background: #000;">
                    <defs>
                        ${unsafeHTML(createMarker(markerStart, 'start-preview'))}
                        ${unsafeHTML(createMarker(markerEnd, 'end-preview'))}
                    </defs>
                    <path
                        d="${pathD}"
                        stroke="${color}"
                        stroke-width="${width}"
                        stroke-opacity="${opacity}"
                        stroke-dasharray="${dashArray}"
                        stroke-linecap="${linecap}"
                        stroke-linejoin="${linejoin}"
                        fill="none"
                        marker-start="${markerStart?.type && markerStart.type !== 'none' ? 'url(#start-preview)' : ''}"
                        marker-end="${markerEnd?.type && markerEnd.type !== 'none' ? 'url(#end-preview)' : ''}"
                    />
                </svg>
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

        // Note: Tab shortcuts 1-6 removed due to conflict with number inputs in forms
    }

    /**
     * Update routing configuration property
     * @param {string} key - Routing config key
     * @param {*} value - Property value
     * @private
     */
    _updateRoutingConfig(key, value) {
        if (!this._workingConfig.msd) {
            this._workingConfig.msd = {};
        }
        if (!this._workingConfig.msd.routing) {
            this._workingConfig.msd.routing = {};
        }

        if (value === undefined || value === null || value === '') {
            delete this._workingConfig.msd.routing[key];
        } else {
            this._workingConfig.msd.routing[key] = value;
        }

        this._markDirty();
        this.requestUpdate();
    }

    /**
     * Update routing cost_defaults nested property
     * @param {string} key - Cost defaults key (bend or proximity)
     * @param {*} value - Property value
     * @private
     */
    _updateRoutingCostDefaults(key, value) {
        if (!this._workingConfig.msd) {
            this._workingConfig.msd = {};
        }
        if (!this._workingConfig.msd.routing) {
            this._workingConfig.msd.routing = {};
        }
        if (!this._workingConfig.msd.routing.cost_defaults) {
            this._workingConfig.msd.routing.cost_defaults = {};
        }

        if (value === undefined || value === null || value === '') {
            delete this._workingConfig.msd.routing.cost_defaults[key];
            // Clean up empty cost_defaults object
            if (Object.keys(this._workingConfig.msd.routing.cost_defaults).length === 0) {
                delete this._workingConfig.msd.routing.cost_defaults;
            }
        } else {
            this._workingConfig.msd.routing.cost_defaults[key] = value;
        }

        this._markDirty();
        this.requestUpdate();
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
        const userAnchors = msd.anchors || {};
        const baseSvgAnchors = this._getBaseSvgAnchors(); // Get base SVG anchors
        const allAnchors = { ...baseSvgAnchors, ...userAnchors }; // Merge both
        const overlays = msd.overlays || [];
        const lineOverlays = overlays.filter(o => o.type === 'line');

        lineOverlays.forEach(line => {
            // Check if anchor exists (check user anchors, base SVG anchors, and overlays)
            if (line.anchor && typeof line.anchor === 'string') {
                const anchorExists = allAnchors[line.anchor] || overlays.find(o => o.id === line.anchor && o.type !== 'line');
                if (!anchorExists) {
                    errors.push({
                        type: 'line',
                        id: line.id,
                        field: 'anchor',
                        message: `Line "${line.id}": Source anchor "${line.anchor}" does not exist`
                    });
                }
            }

            // Check if attach_to exists (check user anchors, base SVG anchors, and overlays)
            if (line.attach_to && typeof line.attach_to === 'string') {
                const targetExists = allAnchors[line.attach_to] || overlays.find(o => o.id === line.attach_to && o.type !== 'line');
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
                <ha-button @click=${this._showValidationErrors} appearance="plain" style="margin-left: auto;">
                    View Details
                </ha-button>
            </div>
        `;
    }

    /**
     * Show validation errors dialog (Phase 7)
     * @private
     */
    async _showValidationErrors() {
        const errorsList = this._validationErrors.map(err =>
            `• ${err.message}`
        ).join('<br>');

        await this._showDialog(
            'Validation Errors',
            `${errorsList}<br><br><strong>Please fix these issues before saving.</strong>`,
            'warning'
        );
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
    async _confirmAction(message) {
        return await this._showConfirmDialog('Confirm Action', message);
    }

    /**
     * Show HA-style dialog
     * @param {string} title - Dialog title
     * @param {string} message - Dialog message (supports HTML)
     * @param {string} type - Dialog type: 'info', 'warning', 'error'
     * @private
     */
    async _showDialog(title, message, type = 'info') {
        const iconMap = {
            info: 'mdi:information',
            warning: 'mdi:alert',
            error: 'mdi:alert-circle'
        };

        return new Promise((resolve) => {
            const dialog = document.createElement('ha-dialog');
            dialog.heading = title;
            dialog.open = true;

            const content = document.createElement('div');
            content.innerHTML = message;
            content.style.padding = '16px';
            dialog.appendChild(content);

            const closeButton = document.createElement('ha-button');
            closeButton.slot = 'primaryAction';
            closeButton.textContent = 'OK';
            closeButton.addEventListener('click', () => {
                dialog.close();
                resolve();
            });

            dialog.appendChild(closeButton);

            dialog.addEventListener('closed', () => {
                dialog.remove();
            });

            document.body.appendChild(dialog);
        });
    }

    /**
     * Show HA-style confirmation dialog
     * @param {string} title - Dialog title
     * @param {string} message - Dialog message (supports HTML)
     * @returns {Promise<boolean>} True if confirmed
     * @private
     */
    async _showConfirmDialog(title, message) {
        return new Promise((resolve) => {
            const dialog = document.createElement('ha-dialog');
            dialog.heading = title;
            dialog.open = true;

            const content = document.createElement('div');
            content.innerHTML = message;
            content.style.padding = '16px';
            dialog.appendChild(content);

            const cancelButton = document.createElement('ha-button');
            cancelButton.slot = 'secondaryAction';
            cancelButton.textContent = 'Cancel';
            cancelButton.addEventListener('click', () => {
                dialog.close();
                resolve(false);
            });

            const confirmButton = document.createElement('ha-button');
            confirmButton.slot = 'primaryAction';
            confirmButton.textContent = 'Confirm';
            confirmButton.style.cssText = '--mdc-theme-primary: var(--error-color, #f44336)';
            confirmButton.addEventListener('click', () => {
                dialog.close();
                resolve(true);
            });

            dialog.appendChild(cancelButton);
            dialog.appendChild(confirmButton);

            dialog.addEventListener('closed', () => {
                dialog.remove();
            });

            document.body.appendChild(dialog);
        });
    }

    /**
     * Render component
     */
    render() {
        return html`
            <ha-dialog
                open
                @closed=${this._handleClose}
                .scrimClickAction=${''}
                .escapeKeyAction=${''}
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
                        <ha-button @click=${() => window.open('https://github.com/snootched/LCARdS/tree/main/doc', '_blank')}>
                            <ha-icon icon="mdi:book-open-variant" slot="icon"></ha-icon>
                            Documentation
                        </ha-button>
                    </div>

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

                            <!-- Crosshair Guidelines -->
                            ${this._renderCrosshairGuidelines()}

                            <!-- Persistent Debug Overlays -->
                            ${this._renderGridOverlay()}
                            ${this._renderAnchorMarkers()}
                            ${this._renderBoundingBoxes()}
                            ${this._renderRoutingPaths()}
                            ${this._renderLineEndpointMarkers()}
                            ${this._renderDragAttachPoints()}
                            ${this._renderChannelsOverlay()}

                            <!-- Temporary Highlights -->
                            ${this._renderAnchorHighlight()}
                            ${this._renderControlHighlight()}
                            ${this._renderLineHighlight()}
                            ${this._renderChannelHighlight()}

                            <!-- Attachment Points (Connect Line Mode) -->
                            ${this._renderAttachmentPointsOverlay()}

                            <!-- Canvas Toolbar (Floating) -->
                            ${this._renderCanvasToolbar()}

                            <!-- Grid Settings Popup (when opened) -->
                            ${this._renderGridSettingsPopup()}
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

            <!-- Channel Form Dialog (Phase 5) -->
            ${this._editingChannelId !== null ? this._renderChannelFormDialog() : ''}
        `;
    }
}

// Register the custom element
customElements.define('lcards-msd-studio-dialog', LCARdSMSDStudioDialog);
