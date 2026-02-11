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
import '../components/lcards-filter-editor.js';
import '../components/yaml/lcards-yaml-editor.js';
import '../components/lcards-card-picker-wrapper.js';
import { configToYaml, yamlToConfig } from '../utils/yaml-utils.js';

// d3-zoom imports for pan/zoom functionality
import { zoom, zoomIdentity } from 'd3-zoom';
import { select } from 'd3-selection';

// Phase 1 Modularization: Extracted utilities
import { getPreviewCoordinatesFromMouseEvent, snapToGrid } from './msd-studio/msd-coordinate-utils.js';
import { getBaseSvgAnchors, resolveControlPosition, resolvePositionWithSide } from './msd-studio/msd-anchor-utils.js';
import { msdStudioStyles } from './msd-studio/msd-studio-styles.js';

// Native HA Card Picker & Editor Integration
import { MSDCardPickerManager } from './msd-studio/msd-card-picker-manager.js';
import { MSDCardEditorLauncher } from './msd-studio/msd-card-editor-launcher.js';
import { MSDEventInterceptor } from './msd-studio/msd-event-interceptor.js';

// Mode constants
const MODES = {
    VIEW: 'view',
    PLACE_ANCHOR: 'place_anchor',
    PLACE_CONTROL: 'place_control',
    CONNECT_LINE: 'connect_line',
    DRAW_CHANNEL: 'draw_channel',
    ADD_WAYPOINT: 'add_waypoint'
};

// Tab constants
const TABS = {
    BASE_SVG: 'base_svg',
    ANCHORS: 'anchors',
    CONTROLS: 'controls',
    LINES: 'lines',
    ROUTING: 'routing',
    YAML: 'yaml'
};

export class LCARdSMSDStudioDialog extends LitElement {
    static get properties() {
        return {
            hass: { type: Object },
            lovelace: { type: Object },  // HA automatically sets this
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
            _controlFormObstacle: { type: Boolean, state: true },
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
            // Waypoint drag state (for waypoint reordering)
            _draggedWaypointIndex: { type: Number, state: true },
            // Resize State (for interactive control resizing)
            _resizeState: { type: Object, state: true },
            // Anchor Drag State (for interactive anchor dragging)
            _anchorDragState: { type: Object, state: true },
            // Channel Resize State (for interactive channel resizing)
            _channelResizeState: { type: Object, state: true },
            // Line Endpoint Drag State (TEST - for debugging)
            _lineEndpointDragState: { type: Object, state: true },
            // Waypoint Editing State
            _selectedLineId: { type: String, state: true },  // Which line is selected on canvas
            _waypointEditingLineId: { type: String, state: true },  // Which line is being edited
            _waypointDragState: { type: Object, state: true },  // { lineId, waypointIndex, startPos }
            _showWaypointMarkers: { type: Boolean, state: true },  // Show waypoint markers for all manual lines
            _clickTimeout: { type: Number, state: true },  // Timeout for distinguishing click from double-click
            // Preview Zoom
            _previewZoom: { type: Number, state: true },
            // Pan/Zoom State (d3-zoom integration)
            _currentZoom: { type: Number, state: true },
            _zoomBehavior: { type: Object, state: true },
            _zoomSvg: { type: Object, state: true },
            // HA Components Availability
            _haComponentsAvailable: { type: Boolean, state: true }
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
        this._cardPickerRequestId = 0; // Track card picker requests
        this._pendingCardPickerRequests = new Map(); // Map requestId -> resolve/reject
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
        this._showRoutingChannels = false;  // Hidden by default, use Routing Channels toggle

        // Preview Zoom State
        this._previewZoom = 1.0;

        // Pan/Zoom State (d3-zoom integration)
        this._currentZoom = 1.0;
        this._zoomBehavior = null;
        this._zoomContainer = null;  // The preview-scroll-container element
        this._zoomWrapper = null;     // The zoomable wrapper div

        // Controls Tab State
        this._showControlForm = false;
        this._editingControlId = null;
        this._controlFormId = '';
        this._controlFormPosition = [0, 0];
        this._controlFormSize = [100, 100];
        this._controlFormAttachment = 'center';
        this._controlFormObstacle = false;
        this._controlFormCard = { type: '' };
        this._controlFormActiveSubtab = 'placement';

        // Lines Tab State (Phase 4)
        this._showLineForm = false;
        this._editingLineId = null;
        this._waypointEditingLineId = null;
        this._waypointDragState = null;
        this._showWaypointMarkers = true;  // Show waypoints by default for manual lines
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

        // HA Components Availability
        this._haComponentsAvailable = false;

        // Card Config Editor Mode
        this._cardConfigMode = 'graphical';

        // Native HA Card Picker & Editor Managers
        this._cardPickerManager = null;
        this._editorLauncher = null;
        this._eventInterceptor = null;
        this._activeChildEditors = new Set();

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

        // Initialize Native HA Card Picker & Editor Managers
        this._cardPickerManager = new MSDCardPickerManager(this);
        this._editorLauncher = new MSDCardEditorLauncher(this);
        this._eventInterceptor = new MSDEventInterceptor(this);

        // Setup event interception
        this._eventInterceptor.setupEventInterception();

        // Load card picker asynchronously with delay
        // Delay allows HA to register hui-*-card elements first
        setTimeout(async () => {
            try {
                await this._cardPickerManager.ensureComponentsLoaded();
            } catch (error) {
                lcardsLog.debug('[MSDStudio] Warning: Could not load card picker components');
            }

            if (this._cardPickerManager.isLoaded()) {
                lcardsLog.debug('[MSDStudio] ✅ Card picker loaded successfully');
                this.requestUpdate();
            } else {
                lcardsLog.debug('[MSDStudio] ⚠️ Card picker not available, using manual config');
            }
        }, 50);

        // Add keyboard event listener (Phase 7)
        this._boundKeyDownHandler = this._handleKeyDown.bind(this);
        document.addEventListener('keydown', this._boundKeyDownHandler);

        // Add document mouseup listener for drag end
        this._boundMouseUpHandler = this._handleDragEnd.bind(this);
        document.addEventListener('mouseup', this._boundMouseUpHandler);

        // Add card picker result listener on document (event proxy from editor)
        this._boundCardPickerResultHandler = this._handleCardPickerResult.bind(this);
        document.addEventListener('card-picker-result', this._boundCardPickerResultHandler);
        lcardsLog.debug('[MSDStudio] Listening for card-picker-result events from editor');

        // Detect SVG source mode from config
        this._detectSvgSourceMode();

        // Check HA component availability
        this._haComponentsAvailable = !!customElements.get('hui-card-element-editor');

        lcardsLog.debug('[MSDStudio] Component availability:', {
            editor: !!customElements.get('hui-card-element-editor'),
            picker: !!customElements.get('hui-card-picker')
        });

        lcardsLog.debug('[MSDStudio] Opened with config:', this._workingConfig);

        // Schedule initial preview update
        this.updateComplete.then(() => this._schedulePreviewUpdate());
    }

    disconnectedCallback() {
        super.disconnectedCallback();
        if (this._previewUpdateTimer) {
            clearTimeout(this._previewUpdateTimer);
        }

        // Cleanup Native HA Card Picker & Editor Managers
        this._eventInterceptor?.cleanupEventInterception();
        this._cardPickerManager?.cleanup();
        this._editorLauncher?.cleanup();

        // Remove keyboard event listener (Phase 7)
        if (this._boundKeyDownHandler) {
            document.removeEventListener('keydown', this._boundKeyDownHandler);
        }
        // Remove document mouseup listener
        if (this._boundMouseUpHandler) {
            document.removeEventListener('mouseup', this._boundMouseUpHandler);
        }
        // Remove card picker result listener from document
        if (this._boundCardPickerResultHandler) {
            document.removeEventListener('card-picker-result', this._boundCardPickerResultHandler);
        }
    }

    /**
     * Called after first render - initialize zoom behavior
     * @param {Map} changedProps - Changed properties
     */
    async firstUpdated(changedProps) {
        super.firstUpdated(changedProps);

        // Wait for preview to render, then initialize zoom
        await this.updateComplete;
        requestAnimationFrame(() => {
            this._initializeZoom();
        });
    }

    /**
     * Called after every render - re-attach zoom if SVG changed
     * @param {Map} changedProps - Changed properties
     */
    updated(changedProps) {
        super.updated(changedProps);

        // Re-initialize zoom if the working config changed (triggers card re-render)
        if (changedProps.has('_workingConfig')) {
            // Wait for the preview to re-render with new config
            requestAnimationFrame(() => {
                this._reinitializeZoomIfNeeded();
            });
        }
    }

    /**
     * Re-initialize zoom if the container element has changed
     * @private
     */
    _reinitializeZoomIfNeeded() {
        const currentContainer = this._getCurrentZoomContainer();

        // If we don't have a zoom container yet, or it's different, re-initialize
        if (currentContainer && (!this._zoomContainer || currentContainer !== this._zoomContainer)) {
            lcardsLog.debug('[MSDStudio] Zoom container changed, re-initializing zoom');

            // Store the current zoom transform before re-initializing
            const currentTransform = this._getZoomTransform();

            // Re-initialize with the new container
            this._initializeZoom();

            // Restore the previous zoom level
            if (currentTransform && currentTransform.k !== 1 && this._zoomBehavior && this._zoomContainer) {
                select(this._zoomContainer).call(
                    this._zoomBehavior.transform,
                    zoomIdentity
                        .translate(currentTransform.x, currentTransform.y)
                        .scale(currentTransform.k)
                );
            }
        }
    }

    /**
     * Get the current zoom container element
     * @returns {HTMLElement|null} The container element or null if not found
     * @private
     */
    _getCurrentZoomContainer() {
        const previewPanel = this.shadowRoot.querySelector('.preview-panel');
        if (!previewPanel) return null;

        return previewPanel.querySelector('.preview-scroll-container');
    }

    /**
     * Initialize d3-zoom behavior on the preview container
     * Called after first render when container is available
     * @private
     */
    _initializeZoom() {
        const previewPanel = this.shadowRoot.querySelector('.preview-panel');
        if (!previewPanel) {
            lcardsLog.warn('[MSDStudio] Preview panel not found for zoom initialization');
            return;
        }

        // Find the preview scroll container - this is what we'll attach zoom to
        const container = previewPanel.querySelector('.preview-scroll-container');
        if (!container) {
            lcardsLog.warn('[MSDStudio] Preview scroll container not found for zoom initialization');
            return;
        }

        // Find the zoomable wrapper div (contains lcards-msd-live-preview)
        const zoomableWrapper = container.querySelector('.msd-zoom-wrapper');
        if (!zoomableWrapper) {
            lcardsLog.warn('[MSDStudio] Zoomable wrapper not found for zoom initialization');
            return;
        }

        // Create zoom behavior with constraints
        this._zoomBehavior = zoom()
            .scaleExtent([0.25, 4])  // 25% to 400% zoom range
            .filter((event) => {
                // Block zoom during active drawing/placement modes
                const blockingModes = ['place_anchor', 'place_control', 'draw_channel', 'connect_line'];
                if (blockingModes.includes(this._activeMode)) {
                    return false;
                }

                // Allow zoom on mousewheel
                if (event.type === 'wheel') return true;

                // Allow pinch-to-zoom
                if (event.type === 'touchstart' && event.touches?.length === 2) return true;

                // Allow pan with Shift+Drag or Middle-mouse button
                if (event.type === 'mousedown') {
                    return event.button === 1 || (event.button === 0 && event.shiftKey);
                }

                return false;
            })
            .on('zoom', (event) => {
                // Apply transform to the zoomable wrapper div
                // This affects the entire preview including all MSD layers
                const t = event.transform;
                zoomableWrapper.style.transform = `translate(${t.x}px, ${t.y}px) scale(${t.k})`;
                zoomableWrapper.style.transformOrigin = 'top left';

                // Update zoom level display
                this._currentZoom = event.transform.k;
                this.requestUpdate(); // Updates studio overlays

                lcardsLog.trace('[MSDStudio] Zoom applied:', {
                    scale: event.transform.k,
                    translate: [event.transform.x, event.transform.y]
                });
            })
            .on('end', () => {
                // Request update after pan/zoom ends to refresh overlay positions
                // Fixes issue where anchors/controls stay in old position after shift+drag
                this.requestUpdate();
                lcardsLog.trace('[MSDStudio] Zoom/pan ended, refreshing overlays');
            });

        // Attach zoom behavior to the container
        select(container).call(this._zoomBehavior);
        this._zoomContainer = container;
        this._zoomWrapper = zoomableWrapper;

        lcardsLog.info('[MSDStudio] 🔍 Zoom behavior initialized on preview container');
    }

    /**
     * Zoom in by 30%
     * @private
     */
    _zoomIn() {
        // Ensure zoom is attached to current container
        this._reinitializeZoomIfNeeded();

        if (!this._zoomBehavior || !this._zoomContainer) return;
        select(this._zoomContainer)
            .transition()
            .duration(300)
            .call(this._zoomBehavior.scaleBy, 1.3);

        // Update display after transition
        setTimeout(() => this.requestUpdate(), 350);
    }

    /**
     * Zoom out by ~23% (inverse of 1.3)
     * @private
     */
    _zoomOut() {
        // Ensure zoom is attached to current container
        this._reinitializeZoomIfNeeded();

        if (!this._zoomBehavior || !this._zoomContainer) return;
        select(this._zoomContainer)
            .transition()
            .duration(300)
            .call(this._zoomBehavior.scaleBy, 0.77);

        // Update display after transition
        setTimeout(() => this.requestUpdate(), 350);
    }

    /**
     * Reset zoom to 1:1 and center canvas
     * @private
     */
    _zoomReset() {
        // Ensure zoom is attached to current container
        this._reinitializeZoomIfNeeded();

        if (!this._zoomBehavior || !this._zoomContainer) return;
        select(this._zoomContainer)
            .transition()
            .duration(500)
            .call(this._zoomBehavior.transform, zoomIdentity);

        // Update display after transition
        setTimeout(() => this.requestUpdate(), 550);
    }

    /**
     * Get current d3-zoom transform for coordinate conversion
     * @returns {Object} Transform {x, y, k} where k is scale
     * @private
     */
    _getZoomTransform() {
        if (!this._zoomContainer) return { x: 0, y: 0, k: 1 };

        const transform = select(this._zoomContainer).property('__zoom');
        return transform || { x: 0, y: 0, k: 1 };
    }

    static get styles() {
        return [editorStyles, msdStudioStyles];
    }

    /**
     * Set active mode
     * @param {string} mode - Mode identifier
     * @private
     */
    async _setMode(mode) {
        lcardsLog.debug(`[MSDStudio] _setMode ENTRY: ${this._activeMode} → ${mode}`);

        // Toggle off if clicking active mode
        if (this._activeMode === mode) {
            lcardsLog.debug(`[MSDStudio] _setMode: Toggling off mode ${mode}`);
            this._activeMode = MODES.VIEW;
        } else {
            lcardsLog.debug(`[MSDStudio] _setMode: Activating mode ${mode}`);
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

        // Clear waypoint markers if switching away from ADD_WAYPOINT
        // (but don't call _exitWaypointMode as it resets mode to VIEW)
        if (this._activeMode !== MODES.ADD_WAYPOINT && this._showWaypointMarkers) {
            lcardsLog.debug(`[MSDStudio] _setMode: Clearing waypoint markers`);
            this._showWaypointMarkers = false;
            if (this._selectedLineId && this._workingConfig.msd?.overlays) {
                const lineOverlay = this._workingConfig.msd.overlays.find(o => o.id === this._selectedLineId);
                if (lineOverlay) {
                    delete lineOverlay._editorSelected;
                }
            }
            this._selectedLineId = null;
            // Continue with normal mode activation below
        }

        lcardsLog.debug('[MSDStudio] Mode changed:', this._activeMode, '- requesting update');
        this.requestUpdate();

        lcardsLog.debug('[MSDStudio] _setMode: Awaiting updateComplete...');
        await this.updateComplete;
        lcardsLog.debug(`[MSDStudio] _setMode EXIT: Mode ${this._activeMode} is now active, DOM updated`);
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
     * Mark configuration as modified (dirty)
     * Called when any configuration value changes
     * @private
     */
    _markDirty() {
        // Mark config as dirty for change detection
        // This enables unsaved changes detection in _configHasChanges()
        this._schedulePreviewUpdate();
    }

    /**
     * Zoom preview by factor (used by old zoom buttons at bottom)
     * Now delegates to d3-zoom system for consistency
     * @param {number} factor - Zoom multiplier (e.g., 1.1 for 10% larger, 0.9 for 10% smaller)
     * @private
     */
    _zoom(factor) {
        // Ensure zoom is attached to current container
        this._reinitializeZoomIfNeeded();

        if (!this._zoomBehavior || !this._zoomContainer) {
            // Fallback to old system if d3-zoom not initialized
            this._previewZoom = Math.max(0.25, Math.min(4.0, this._previewZoom * factor));
            this.requestUpdate();
            return;
        }

        // Use d3-zoom scaleBy
        select(this._zoomContainer)
            .transition()
            .duration(200)
            .call(this._zoomBehavior.scaleBy, factor);

        // Update display after transition
        setTimeout(() => this.requestUpdate(), 250);
    }

    /**
     * Reset zoom to 100% (used by old reset button at bottom)
     * Now delegates to d3-zoom system for consistency
     * @private
     */
    _resetZoom() {
        // Delegate to d3-zoom reset
        this._zoomReset();
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
        if (this._configHasChanges()) {
            // Show confirmation - only close if user confirms
            this._confirmAction('Discard unsaved changes?').then(confirmed => {
                if (confirmed) {
                    lcardsLog.debug('[MSDStudio] Cancelled - changes discarded');
                    this._handleClose();
                }
                // If not confirmed, do nothing - stay in studio
            });
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
            { mode: MODES.DRAW_CHANNEL, icon: 'mdi:chart-timeline-variant', tooltip: 'Draw Channel' },
            { mode: MODES.ADD_WAYPOINT, icon: 'mdi:map-marker-path', tooltip: 'Add Waypoint (Select line first)' }
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
                ${!this._canvasToolbarExpanded ? html`
                    <!-- Toggle Button (collapsed state - left side) -->
                    <button
                        class="canvas-toolbar-toggle"
                        @click=${() => { this._canvasToolbarExpanded = !this._canvasToolbarExpanded; this.requestUpdate(); }}
                        title="Expand Toolbar">
                        <ha-icon icon="mdi:tools"></ha-icon>
                    </button>
                ` : html`
                    <div class="canvas-toolbar-buttons">
                        <!-- Mode Controls -->
                        ${modeButtons.map(btn => html`
                            <button
                                class="canvas-toolbar-button ${this._activeMode === btn.mode ? 'active' : ''}"
                                @click=${async (e) => {
                                    e.stopPropagation();
                                    await this._setMode(btn.mode);
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

                    <!-- Toggle Button (expanded state - right side) -->
                    <button
                        class="canvas-toolbar-toggle"
                        @click=${() => { this._canvasToolbarExpanded = !this._canvasToolbarExpanded; this.requestUpdate(); }}
                        title="Collapse Toolbar">
                        <ha-icon icon="mdi:chevron-right"></ha-icon>
                    </button>
                `}
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
            { id: TABS.ROUTING, label: 'Routing', icon: 'mdi:routes' },
            { id: TABS.YAML, label: 'YAML', icon: 'mdi:code-braces' }
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
            case TABS.YAML:
                return this._renderYamlTab();
            default:
                return html`<div>Unknown tab</div>`;
        }
    }

    // ============================
    // Base SVG Tab Helper Methods
    // ============================

    /**
     * Render SVG source helper text
     * @param {string} source - The SVG source value from config
     * @returns {TemplateResult}
     * @private
     */
    _renderSvgSourceHelper(source = '') {
        let metadata = null;
        let svgKey = null;
        let isBuiltin = false;
        let isExternal = false;

        // Extract SVG key and determine source type
        if (source.startsWith('builtin:')) {
            svgKey = source.replace('builtin:', '');
            isBuiltin = true;
        } else if (source.startsWith('/local/') || source.startsWith('/hacsfiles/')) {
            svgKey = source.split('/').pop().replace('.svg', '');
            isExternal = true;
        } else if (source.startsWith('http://') || source.startsWith('https://')) {
            svgKey = source.split('/').pop().replace('.svg', '');
            isExternal = true;
        } else if (source) {
            // Fallback: try using source directly as key (for cases where builtin: prefix might be missing)
            svgKey = source;
            isBuiltin = true;
        }

        // Get metadata from AssetManager if available
        const assetManager = window.lcards?.core?.assetManager;
        if (assetManager && svgKey) {
                metadata = assetManager.getMetadata('svg', svgKey);
            }

        // If we have metadata with rich fields (beyond just pack/url), show placard
        // Don't be strict about specific fields - metadata is freeform
        const hasRichMetadata = metadata && Object.keys(metadata).length > 2;

        if (hasRichMetadata) {
            return html`
                <div style="
                    margin-top: 12px;
                    padding: 16px;
                    background: linear-gradient(135deg, #4A5C7A 0%, #2C3E50 100%);
                    border-radius: 8px;
                    color: white;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.2);
                    font-family: var(--lcars-font-family, 'Antonio', sans-serif);
                ">
                    <!-- Header -->
                    <div style="
                        display: flex;
                        justify-content: space-between;
                        align-items: flex-start;
                        margin-bottom: 12px;
                        border-bottom: 2px solid rgba(255,255,255,0.3);
                        padding-bottom: 10px;
                    ">
                        <div style="flex: 1;">
                            <div style="font-size: 20px; font-weight: 700; letter-spacing: 1px; line-height: 1.2;">
                                ${metadata.ship || svgKey}
                            </div>
                            ${metadata.registry ? html`
                                <div style="font-size: 16px; font-weight: 300; letter-spacing: 2px; opacity: 0.9; margin-top: 2px;">
                                    ${metadata.registry}
                                </div>
                            ` : ''}
                        </div>
                        ${metadata.era ? html`
                            <div style="
                                background: rgba(255,255,255,0.2);
                                padding: 4px 10px;
                                border-radius: 4px;
                                font-size: 11px;
                                font-weight: 600;
                                letter-spacing: 0.5px;
                                text-transform: uppercase;
                                white-space: nowrap;
                            ">
                                ${metadata.era}
                            </div>
                        ` : ''}
                    </div>

                    <!-- Ship Details Grid -->
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px 16px; margin-bottom: 12px; font-size: 13px; line-height: 1.5;">
                        ${metadata.class ? html`
                            <div>
                                <div style="opacity: 0.8; font-size: 10px; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 2px;">Class</div>
                                <div style="font-weight: 500;">${metadata.class}</div>
                            </div>
                        ` : ''}

                        ${metadata.approximate_size ? html`
                            <div>
                                <div style="opacity: 0.8; font-size: 10px; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 2px;">File Size</div>
                                <div style="font-weight: 500;">${metadata.approximate_size}</div>
                            </div>
                        ` : ''}

                        ${metadata.author ? html`
                            <div>
                                <div style="opacity: 0.8; font-size: 10px; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 2px;">Author</div>
                                <div style="font-weight: 500;">${metadata.author}</div>
                            </div>
                        ` : ''}

                        ${metadata.source ? html`
                            <div>
                                <div style="opacity: 0.8; font-size: 10px; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 2px;">Source</div>
                                <div style="font-weight: 500;">${metadata.source}</div>
                            </div>
                        ` : ''}
                    </div>

                    <!-- Description -->
                    ${metadata.description ? html`
                        <div style="
                            font-size: 12px;
                            line-height: 1.6;
                            opacity: 0.95;
                            font-style: italic;
                            background: rgba(0,0,0,0.15);
                            padding: 8px 10px;
                            border-radius: 4px;
                            margin-bottom: 8px;
                        ">
                            ${metadata.description}
                        </div>
                    ` : ''}

                    <!-- Variant Badge -->
                    ${metadata.variant ? html`
                        <div style="
                            display: inline-block;
                            background: rgba(255,255,255,0.25);
                            padding: 4px 10px;
                            border-radius: 12px;
                            font-size: 11px;
                            font-weight: 600;
                            letter-spacing: 0.5px;
                        ">
                            ✨ ${metadata.variant}
                        </div>
                    ` : ''}
                </div>
            `;
        }

        // External SVG without metadata - show file info
        if (isExternal && source) {
            const filename = source.split('/').pop();
            const path = source.substring(0, source.lastIndexOf('/'));

            return html`
                <div style="
                    margin-top: 12px;
                    padding: 14px;
                    background: var(--secondary-background-color);
                    border-left: 4px solid var(--info-color, #2196F3);
                    border-radius: 4px;
                    font-size: 13px;
                    line-height: 1.6;
                ">
                    <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
                        <ha-icon icon="mdi:file-document-outline" style="--mdc-icon-size: 20px; color: var(--info-color, #2196F3);"></ha-icon>
                        <strong style="font-size: 14px;">External SVG File</strong>
                    </div>

                    <div style="display: grid; gap: 6px; font-size: 12px;">
                        <div>
                            <span style="opacity: 0.7;">Filename:</span>
                            <code style="background: var(--code-background-color, rgba(0,0,0,0.1)); padding: 2px 6px; border-radius: 3px; font-size: 11px;">${filename}</code>
                        </div>
                        <div>
                            <span style="opacity: 0.7;">Path:</span>
                            <code style="background: var(--code-background-color, rgba(0,0,0,0.1)); padding: 2px 6px; border-radius: 3px; font-size: 11px;">${path}/</code>
                        </div>
                        <div>
                            <span style="opacity: 0.7;">Full URL:</span>
                            <code style="background: var(--code-background-color, rgba(0,0,0,0.1)); padding: 2px 6px; border-radius: 3px; font-size: 11px;">${source}</code>
                        </div>
                    </div>

                    <div style="margin-top: 10px; padding-top: 10px; border-top: 1px solid var(--divider-color); font-size: 11px; opacity: 0.7;">
                        💡 External SVGs don't have embedded metadata. The file will be loaded from the specified path when the card renders.
                    </div>
                </div>
            `;
        }

        // Show general helper for custom SVG paths
        return html`
            <ha-alert alert-type="info">
                <strong>Custom SVG Paths:</strong><br>
                • /local/my-ship.svg (from www/ folder)<br>
                • /hacsfiles/lcards/ships/custom.svg<br>
                • https://example.com/my-ship.svg<br>
                <br>
                <em>Provide a valid URL or local path to your custom SVG file.</em>
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
     * Handle filters changed from filter editor
     * @param {CustomEvent} e - filters-changed event
     * @private
     */
    _handleFiltersChanged(e) {
        lcardsLog.debug('[MSDStudio] Filters changed:', e.detail.value);
        this._setNestedValue('msd.base_svg.filters', e.detail.value);
    }

    /**
     * Handle viewBox mode change
     * @param {string} mode - 'auto' or 'custom'
     * @private
     */
    async _handleViewBoxModeChange(mode) {
        this._viewBoxMode = mode;
        if (mode === 'auto') {
            // Remove explicit view_box when switching to auto
            if (this._workingConfig.msd?.view_box) {
                delete this._workingConfig.msd.view_box;
                this._schedulePreviewUpdate();
            }
            // Auto-extract viewBox from current SVG
            await this._autoExtractViewBox();
        } else {
            // Initialize view_box array if not present
            if (!this._workingConfig.msd.view_box) {
                // Try to extract from current SVG first
                const extracted = await this._extractViewBoxFromSvg();
                if (extracted) {
                    this._setNestedValue('msd.view_box', extracted);
                } else {
                    this._setNestedValue('msd.view_box', [0, 0, 400, 200]);
                }
            }
        }
        this.requestUpdate();
    }

    /**
     * Handle SVG source change
     * @param {string} value - New SVG source value
     * @private
     */
    async _handleSvgSourceChange(value) {
        this._setNestedValue('msd.base_svg.source', value);

        // If in auto viewBox mode, extract viewBox from new SVG
        if (this._viewBoxMode === 'auto') {
            await this._autoExtractViewBox();
        }
    }

    /**
     * Auto-extract viewBox from current SVG (for auto mode)
     * @private
     */
    async _autoExtractViewBox() {
        const source = this._workingConfig.msd?.base_svg?.source;
        if (!source || source === 'none') return;

        const extracted = await this._extractViewBoxFromSvg();
        if (extracted && this._viewBoxMode === 'auto') {
            // Temporarily set viewBox for preview, but don't persist to config
            // The card will extract it during render
            lcardsLog.trace('[MSDStudio] Auto-extracted viewBox for preview:', extracted);
        }
    }

    /**
     * Extract viewBox from current SVG source
     * @returns {Array|null} ViewBox array [x, y, w, h] or null
     * @private
     */
    async _extractViewBoxFromSvg() {
        const source = this._workingConfig.msd?.base_svg?.source;
        if (!source || source === 'none') return null;

        try {
            const { getSvgContent, getSvgViewBox } = await import('../../utils/lcards-anchor-helpers.js');
            const svgContent = getSvgContent(source);
            if (svgContent) {
                const viewBox = getSvgViewBox(svgContent);
                lcardsLog.trace('[MSDStudio] Extracted viewBox from SVG:', viewBox);
                return viewBox;
            }
        } catch (error) {
            lcardsLog.error('[MSDStudio] Error extracting viewBox:', error);
        }
        return null;
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
     * Render YAML tab
     * @returns {TemplateResult}
     * @private
     */
    _renderYamlTab() {
        // Convert working config to YAML
        const yamlValue = configToYaml(this._workingConfig);

        return html`
            <div style="padding: 8px; display: flex; flex-direction: column; gap: 16px;">
                <lcards-message type="info">
                    <strong>Advanced YAML Editor</strong>
                    <p style="margin: 8px 0 0 0; font-size: 13px;">
                        Edit the complete MSD configuration in YAML format with schema-based autocomplete and validation.
                        Changes made here will be applied when you save the dialog.
                    </p>
                </lcards-message>

                <lcards-yaml-editor
                    .value=${yamlValue}
                    .schema=${this._getMsdSchema()}
                    .hass=${this.hass}
                    @value-changed=${this._handleYamlChange}
                    style="flex: 1;">
                </lcards-yaml-editor>
            </div>
        `;
    }

    /**
     * Handle YAML editor changes
     * @param {CustomEvent} ev - value-changed event from YAML editor
     * @private
     */
    _handleYamlChange(ev) {
        try {
            const newConfig = yamlToConfig(ev.detail.value);
            this._workingConfig = newConfig;
            this.requestUpdate();
            lcardsLog.debug('[MSDStudio] YAML updated, config refreshed');
        } catch (error) {
            lcardsLog.warn('[MSDStudio] Invalid YAML, config not updated:', error.message);
        }
    }

    /**
     * Get MSD schema for YAML validation
     * @returns {Object|null} JSON Schema for MSD configuration or null
     * @private
     */
    _getMsdSchema() {
        try {
            // Access schema through core config manager's schema registry
            const configManager = window.lcards?.core?.configManager;
            if (!configManager) {
                lcardsLog.warn('[MSDStudio] CoreConfigManager not available');
                return null;
            }

            // Get the registered MSD schema
            const schema = configManager.getCardSchema('msd');

            if (!schema) {
                lcardsLog.warn('[MSDStudio] MSD schema not found in registry');
                return null;
            }

            lcardsLog.debug('[MSDStudio] Retrieved MSD schema for YAML editor autocomplete');
            return schema;
        } catch (error) {
            lcardsLog.error('[MSDStudio] Error getting MSD schema:', error);
            return null;
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
                    icon="mdi:image"
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
                                @value-changed=${(e) => this._handleSvgSourceChange(e.detail.value)}>
                            </ha-selector>
                        ` : this._svgSourceMode === 'custom' ? html`
                            <ha-textfield
                                label="Custom SVG Path"
                                .value=${baseSvg.source || ''}
                                @input=${(e) => this._handleSvgSourceChange(e.target.value)}
                                helper-text="Enter custom path (e.g., /local/my-ship.svg)">
                            </ha-textfield>
                        ` : html`
                            <ha-alert alert-type="info">
                                No base SVG will be rendered. Overlays will be drawn on a transparent canvas using the viewBox coordinates below.
                                <strong>ViewBox must be configured manually.</strong>
                            </ha-alert>
                        `}
                        ${this._renderSvgSourceHelper(baseSvg.source)}
                    </div>
                </lcards-form-section>

                <!-- ViewBox Section -->
                <lcards-form-section
                    header="ViewBox"
                    description="Configure the coordinate system for your MSD display"
                    icon="mdi:grid"
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
                    description="Apply stackable visual filters to the base SVG"
                    icon="mdi:auto-fix"
                    ?expanded=${true}>

                    <lcards-filter-editor
                        .hass=${this.hass}
                        .filters=${baseSvg.filters || []}
                        @filters-changed=${this._handleFiltersChanged}>
                    </lcards-filter-editor>

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
                <!-- Anchor Actions & Visualization Helpers -->
                <div style="display: flex; gap: 8px; margin-bottom: 16px; align-items: center;">
                    <ha-button @click=${this._openAnchorForm}>
                        <ha-icon icon="mdi:map-marker-plus" slot="start"></ha-icon>
                        Add Anchor
                    </ha-button>
                    <ha-button @click=${async (e) => { e.stopPropagation(); await this._setMode(MODES.PLACE_ANCHOR); }}
                               ?disabled=${this._activeMode === MODES.PLACE_ANCHOR}>
                        <ha-icon icon="mdi:cursor-default-click" slot="start"></ha-icon>
                        Place on Canvas
                    </ha-button>

                    <!-- Right-aligned visualization helpers -->
                    <div style="flex: 1;"></div>
                    <ha-icon-button
                        class="${this._showAnchorMarkers ? 'active' : ''}"
                        @click=${() => { this._showAnchorMarkers = !this._showAnchorMarkers; this.requestUpdate(); }}
                        .label=${'Anchor Markers'}>
                        <ha-icon icon="mdi:map-marker"></ha-icon>
                    </ha-icon-button>
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
                    icon="mdi:map-marker-multiple"
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
        return getBaseSvgAnchors(this._workingConfig, this.shadowRoot);
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

        // Check if this anchor name would override a base_svg anchor
        const baseSvgAnchors = this._getBaseSvgAnchors();
        const wouldOverride = this._anchorFormName && baseSvgAnchors[this._anchorFormName];

        return html`
            <ha-dialog
                open
                @closed=${this._closeAnchorForm}
                .heading=${title}
                style="--mdc-dialog-max-width: 500px; --mdc-dialog-min-width: 500px; --mdc-dialog-min-height: auto;">
                <div style="padding: 12px 8px;">
                    ${wouldOverride ? html`
                        <lcards-message type="info" style="margin-bottom: 16px;">
                            This name exists in the base_svg. Your custom anchor will override the SVG anchor.
                        </lcards-message>
                    ` : ''}

                    <ha-textfield
                        label="Anchor Name"
                        .value=${this._anchorFormName}
                        @input=${(e) => {
                            this._anchorFormName = e.target.value;
                            this.requestUpdate(); // Force re-render to update override message
                        }}
                        required
                        helper-text="Unique identifier for this anchor"
                        style="width: 100%; margin-bottom: 16px;">
                    </ha-textfield>

                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
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
                    </div>
                </div>

                <div slot="primaryAction">
                    <ha-button @click=${this._saveAnchor}>
                        <ha-icon icon="mdi:content-save" slot="start"></ha-icon>
                        Save
                    </ha-button>
                </div>

                <div slot="secondaryAction">
                    <ha-button @click=${this._closeAnchorForm} appearance="plain">
                        <ha-icon icon="mdi:close" slot="start"></ha-icon>
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
        const roundedPosition = [
            this._roundToPrecision(this._anchorFormPosition[0]),
            this._roundToPrecision(this._anchorFormPosition[1])
        ];
        this._setNestedValue(path, roundedPosition);

        // Close dialog
        this._closeAnchorForm();
        lcardsLog.debug('[MSDStudio] Anchor saved:', this._anchorFormName, roundedPosition);
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
        lcardsLog.trace('[MSDStudio] Highlight anchor in preview:', name);

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
        this._anchorFormPosition[index] = this._roundToPrecision(parseFloat(value) || 0);
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
    /**
     * Handle preview double-click - open edit dialog for line
     * @param {MouseEvent} event - Double-click event
     * @private
     */
    _handlePreviewDoubleClick(event) {
        const composedPath = event.composedPath();
        const clickedElement = composedPath[0];

        // Cancel pending single-click timer
        if (this._lineClickTimer) {
            clearTimeout(this._lineClickTimer);
            this._lineClickTimer = null;
        }

        // Check if double-clicked on a line path element or hit area
        if ((clickedElement.tagName === 'path' && clickedElement.classList.contains('line-path')) ||
            (clickedElement.tagName === 'path' && clickedElement.classList.contains('line-hit-area'))) {

            // Get line ID
            let lineId;
            if (clickedElement.classList.contains('line-hit-area')) {
                const visiblePath = clickedElement.nextElementSibling;
                lineId = visiblePath?.getAttribute('data-line-id');
            } else {
                lineId = clickedElement.getAttribute('data-line-id');
            }

            if (lineId) {
                lcardsLog.debug('[MSDStudioDialog] Double-click on line:', lineId);

                // Exit waypoint mode if active
                if (this._activeMode === MODES.ADD_WAYPOINT) {
                    this._exitWaypointMode();
                }

                // Find the line overlay object
                const overlays = this._workingConfig.msd?.overlays || [];
                const lineOverlay = overlays.find(o => o.id === lineId && o.type === 'line');

                if (lineOverlay) {
                    // Open edit dialog for this line
                    this._editLine(lineOverlay);
                } else {
                    lcardsLog.warn('[MSDStudioDialog] Line not found:', lineId);
                }

                event.stopPropagation();
                event.preventDefault();
                return;
            }
        }
    }

    // Place Anchor Mode Methods
    // ============================

    /**
     * Handle preview click
     * @param {MouseEvent} event - Click event
     * @private
     */
    _handlePreviewClick(event) {
        // Get the actual clicked element through shadow DOM boundaries
        const composedPath = event.composedPath();
        const clickedElement = composedPath[0];

        lcardsLog.debug('[MSDStudioDialog] Preview click:', {
            mode: this._activeMode,
            tagName: clickedElement.tagName,
            classList: clickedElement.classList ? Array.from(clickedElement.classList) : [],
            dataset: clickedElement.dataset || {},
            hasAnchorName: clickedElement.hasAttribute?.('data-anchor-name')
        });

        // Check for line clicks in VIEW mode or ADD_WAYPOINT mode (for selection)
        if (this._activeMode === MODES.VIEW || this._activeMode === MODES.ADD_WAYPOINT) {
            // Check if clicked on a line path element or hit area
            if ((clickedElement.tagName === 'path' && clickedElement.classList.contains('line-path')) ||
                (clickedElement.tagName === 'path' && clickedElement.classList.contains('line-hit-area'))) {
                // For hit area, find the corresponding visible path to get line-id
                let lineId;
                if (clickedElement.classList.contains('line-hit-area')) {
                    // Hit area doesn't have data-line-id, so find the next sibling (visible path)
                    const visiblePath = clickedElement.nextElementSibling;
                    lineId = visiblePath?.getAttribute('data-line-id');
                } else {
                    lineId = clickedElement.getAttribute('data-line-id');
                }
                if (lineId) {
                    // Use a delay to distinguish single-click from double-click
                    if (this._lineClickTimer) {
                        clearTimeout(this._lineClickTimer);
                        this._lineClickTimer = null;
                    }

                    this._lineClickTimer = setTimeout(() => {
                        this._selectLine(lineId);
                        this._lineClickTimer = null;
                    }, 250); // 250ms delay to detect double-click

                    event.stopPropagation();
                    return;
                }
            }
            // If in VIEW mode and clicked background, deselect
            if (this._activeMode === MODES.VIEW) {
                this._selectedLineId = null;
                this.requestUpdate();
                return;
            }
        }

        // Handle waypoint mode
        if (this._activeMode === MODES.ADD_WAYPOINT) {
            // Check if clicked on anchor marker (for named waypoint)
            const isAnchorMarker = clickedElement.classList?.contains('anchor-marker') ||
                                   clickedElement.classList?.contains('interactive-anchor') ||
                                   clickedElement.hasAttribute?.('data-anchor-name');

            if (isAnchorMarker) {
                const anchorName = clickedElement.getAttribute('data-anchor-name');
                if (anchorName && this._selectedLineId) {
                    this._addNamedWaypoint(anchorName);
                    event.stopPropagation();
                    return;
                }
            }

            // Check if clicked on waypoint marker (don't add new waypoint)
            if (clickedElement.classList?.contains('waypoint-marker')) {
                event.stopPropagation();
                return;
            }

            // Check if clicked on empty canvas area (exit waypoint mode)
            const isEmptyArea = clickedElement.tagName === 'DIV' &&
                               (clickedElement.classList.contains('preview-scroll-container') ||
                                clickedElement.classList.contains('preview-container'));

            if (isEmptyArea && !this._waypointDragInProgress) {
                // Exit waypoint mode (but not if we just finished dragging)
                this._exitWaypointMode();
                event.stopPropagation();
                return;
            }

            // Otherwise, place coordinate waypoint if line is selected
            if (this._selectedLineId) {
                this._handleAddWaypointClick(event);
                return;
            }
        }

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
        lcardsLog.debug(`[MSDStudio] _handlePlaceAnchorClick ENTRY - mode: ${this._activeMode}`);

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
        lcardsLog.debug(`[MSDStudio] _handlePlaceControlClick ENTRY - mode: ${this._activeMode}`);

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
        this._controlFormObstacle = false;
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
        // Get complete merged anchors from card's resolved model
        const livePreview = this.shadowRoot.querySelector('lcards-msd-live-preview');
        const livePreviewShadow = livePreview?.shadowRoot;
        const cardContainer = livePreviewShadow?.querySelector('.preview-card-container');
        const msdCard = cardContainer?.querySelector('lcards-msd-card');
        const anchors = msdCard?._msdPipeline?.getResolvedModel()?.anchors || {};

        let currentPosition;
        if (control.position && Array.isArray(control.position)) {
            currentPosition = [...control.position];
        } else if (typeof control.position === 'string') {
            // Position is an anchor reference (string)
            currentPosition = OverlayUtils.resolvePosition(control.position, anchors);
            if (!currentPosition) {
                lcardsLog.warn('[MSDStudio] Could not resolve anchor position for drag:', control.position);
                return;
            }
            currentPosition = [...currentPosition];
        } else if (control.anchor) {
            // Legacy: anchor property
            currentPosition = OverlayUtils.resolvePosition(control.anchor, anchors);
            if (!currentPosition) {
                lcardsLog.warn('[MSDStudio] Could not resolve legacy anchor position for drag');
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
     * Round a number to specified decimal places (default 2 for coordinates/sizes)
     * @param {number} value - Value to round
     * @param {number} decimals - Number of decimal places
     * @returns {number} - Rounded value
     * @private
     */
    _roundToPrecision(value, decimals = 2) {
        const multiplier = Math.pow(10, decimals);
        return Math.round(value * multiplier) / multiplier;
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

        // Update position (convert anchor reference to explicit position if needed)
        if (typeof control.position === 'string') {
            // Convert anchor-based position to coordinate-based
            // (position property holds anchor name as string)
        } else if (control.anchor) {
            // Legacy: Convert old anchor property to position
            delete control.anchor;
        }
        control.position = [this._roundToPrecision(newX), this._roundToPrecision(newY)];

        this.requestUpdate();
    }

    /**
     * Handle drag end
     * @param {MouseEvent} event - Mouse up event
     * @private
     */
    _handleDragEnd(event) {
        // Clear mousedown tracking
        this._mouseDownPos = null;

        if (!this._dragState.active && !this._resizeState.active && !this._anchorDragState.active && !this._channelResizeState.active) return;

        if (this._dragState.active) {
            lcardsLog.debug('[MSDStudio] Drag end:', this._dragState.controlId);

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
            lcardsLog.debug('[MSDStudio] Resize end:', this._resizeState.controlId);

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
            lcardsLog.debug('[MSDStudio] Anchor drag end:', this._anchorDragState.anchorName);

            // Clear anchor drag state
            this._anchorDragState = {
                active: false,
                anchorName: null,
                startPos: null,
                originalPos: null
            };
        }

        if (this._channelResizeState.active) {
            lcardsLog.debug('[MSDStudio] Channel resize end:', this._channelResizeState.channelId);

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
        // Get complete merged anchors from card's resolved model
        const livePreview = this.shadowRoot.querySelector('lcards-msd-live-preview');
        const livePreviewShadow = livePreview?.shadowRoot;
        const cardContainer = livePreviewShadow?.querySelector('.preview-card-container');
        const msdCard = cardContainer?.querySelector('lcards-msd-card');
        const anchors = msdCard?._msdPipeline?.getResolvedModel()?.anchors || {};

        let currentPosition;
        if (control.position && Array.isArray(control.position)) {
            currentPosition = [...control.position];
        } else if (typeof control.position === 'string') {
            // Position is an anchor reference (string)
            currentPosition = OverlayUtils.resolvePosition(control.position, anchors);
            if (!currentPosition) {
                lcardsLog.warn('[MSDStudio] Could not resolve anchor position for resize:', control.position);
                return;
            }
            currentPosition = [...currentPosition];
        } else if (control.anchor) {
            // Legacy: anchor property
            currentPosition = OverlayUtils.resolvePosition(control.anchor, anchors);
            if (!currentPosition) {
                lcardsLog.warn('[MSDStudio] Could not resolve legacy anchor position for resize');
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

        // Convert anchor reference to explicit position if needed
        if (typeof control.position === 'string') {
            // Convert anchor-based position to coordinate-based
            // (position property holds anchor name as string)
        } else if (control.anchor) {
            // Legacy: Convert old anchor property
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
        control.size = [this._roundToPrecision(newWidth), this._roundToPrecision(newHeight)];
        control.position = [this._roundToPrecision(newX), this._roundToPrecision(newY)];

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
            anchors[this._anchorDragState.anchorName] = [this._roundToPrecision(newX), this._roundToPrecision(newY)];
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
        channel.bounds = [
            this._roundToPrecision(newX),
            this._roundToPrecision(newY),
            this._roundToPrecision(newWidth),
            this._roundToPrecision(newHeight)
        ];

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
        return resolveControlPosition(control, this._workingConfig, this.shadowRoot);
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
        return resolvePositionWithSide(targetId, side, this._workingConfig, this.shadowRoot);
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

        lcardsLog.trace('[MSDStudio] Checking snap at:', mouseX, mouseY);

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
                    lcardsLog.trace('[MSDStudio] Snap found on control:', control.id, 'side:', side, 'dist:', dist);
                    return { type: 'control', id: control.id, side: side === 'center' ? null : side };
                }
            }
        }

        // Check anchors (single point - gap is controlled by anchor_gap property)
        const userAnchors = this._workingConfig.msd?.anchors || {};
        const baseSvgAnchors = this._getBaseSvgAnchors();
        const allAnchors = { ...userAnchors, ...baseSvgAnchors };

        // Validate allAnchors is an object
        if (!allAnchors || typeof allAnchors !== 'object' || Array.isArray(allAnchors)) {
            lcardsLog.warn('[MSDStudio] Invalid anchors data:', allAnchors);
            return null;
        }

        for (const [name, pos] of Object.entries(allAnchors)) {
            // Validate position is an array
            if (!Array.isArray(pos) || pos.length < 2) {
                lcardsLog.trace('[MSDStudio] Invalid anchor position for', name, ':', pos);
                continue;
            }

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

        // Disable endpoint dragging when in waypoint mode
        if (this._activeMode === MODES.ADD_WAYPOINT) {
            lcardsLog.debug('[MSDStudio] Endpoint dragging disabled in waypoint mode');
            return;
        }

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

        lcardsLog.trace('[MSDStudio] Line endpoint drag listeners added');
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
            lcardsLog.debug('[MSDStudio] No valid target found - canceling drag');
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

            lcardsLog.debug('[MSDStudio] Updated line start to:', target.id, 'side:', target.side);
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

            lcardsLog.debug('[MSDStudio] Updated line end to:', target.id, 'side:', target.side);
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
        this._editControl(control);
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
        const zoomTransform = this._getZoomTransform();
        return getPreviewCoordinatesFromMouseEvent(event, this.shadowRoot, this._workingConfig, zoomTransform);
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
        let x = event.clientX - rect.left;
        let y = event.clientY - rect.top;

        // Apply inverse zoom transform if zoom is active
        const zoomTransform = this._getZoomTransform();
        if (zoomTransform?.k && zoomTransform.k !== 1) {
            x = (x - zoomTransform.x) / zoomTransform.k;
            y = (y - zoomTransform.y) / zoomTransform.k;
        }

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

        lcardsLog.trace('[MSDStudio] Converted coordinates:', {
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
        let svgX = event.clientX - rect.left;
        let svgY = event.clientY - rect.top;

        // Apply inverse zoom transform if zoom is active
        const zoomTransform = this._getZoomTransform();
        if (zoomTransform?.k && zoomTransform.k !== 1) {
            svgX = (svgX - zoomTransform.x) / zoomTransform.k;
            svgY = (svgY - zoomTransform.y) / zoomTransform.k;
        }

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

        // If snap is enabled (either toggle), snap viewBox coords and convert back to pixels
        const debugSettings = this._getDebugSettings();
        const snapEnabled = this._enableSnapping || this._snapToGrid;
        if (snapEnabled) {
            const gridSpacing = debugSettings.grid_spacing || 50;
            coordX = Math.round(coordX / gridSpacing) * gridSpacing;
            coordY = Math.round(coordY / gridSpacing) * gridSpacing;

            // Convert snapped viewBox coords back to pixel position relative to SVG
            // Account for letterboxing offset
            let snappedSvgX = (coordX - vbX) / scale + offsetX;
            let snappedSvgY = (coordY - vbY) / scale + offsetY;

            // Re-apply zoom transform to get visual position
            if (zoomTransform?.k && zoomTransform.k !== 1) {
                snappedSvgX = snappedSvgX * zoomTransform.k + zoomTransform.x;
                snappedSvgY = snappedSvgY * zoomTransform.k + zoomTransform.y;
            }

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
            lcardsLog.trace('[MSDStudio] Draw channel started at:', coords);
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

            lcardsLog.trace('[MSDStudio] Draw channel finished:', { x, y, width, height });

            // Reset draw state
            this._drawChannelState.startPoint = null;
            this._drawChannelState.drawing = false;

            // Detect lines that may intersect this channel
            const channelBounds = { x, y, width, height };
            const intersectingLines = this._findLinesIntersectingChannel(channelBounds);

            // Open channel form with pre-filled bounds
            this._editingChannelId = '';
            this._channelFormData = {
                id: this._generateChannelId(),
                type: 'bundling',
                bounds: [x, y, width, height],
                priority: 10,
                color: '#00FF00',
                // Add suggested lines if any were found
                suggestedLines: intersectingLines.length > 0 ? intersectingLines.map(line => line.id) : null
            };

            // Exit draw mode
            this._activeMode = MODES.VIEW;
            this.requestUpdate();
        }
    }

    /**
     * Inject line highlighting styles into MSD card shadow DOM
     * @private
     */
    _injectLineHighlightStyles() {
        const livePreview = this.shadowRoot?.querySelector('lcards-msd-live-preview');
        if (!livePreview) return;

        const lpShadow = livePreview.shadowRoot;
        if (!lpShadow) return;

        const cardContainer = lpShadow.querySelector('.preview-card-container');
        if (!cardContainer) return;

        const msdCard = cardContainer.querySelector('lcards-msd-card');
        if (!msdCard) return;

        const msdShadow = msdCard.shadowRoot || msdCard.renderRoot;
        if (!msdShadow) return;

        // Check if styles already injected
        if (msdShadow.querySelector('#msd-studio-highlight-styles')) {
            return;
        }

        // Inject styles
        const styleEl = document.createElement('style');
        styleEl.id = 'msd-studio-highlight-styles';
        styleEl.textContent = `
            .line-path {
                pointer-events: auto !important;
            }
            .line-path.line-selected {
                filter: drop-shadow(0 0 8px #66B0FF) drop-shadow(0 0 4px #66B0FF) !important;
                stroke-width: 4 !important;
            }
            .line-path:hover {
                filter: drop-shadow(0 0 4px #66B0FF) !important;
                stroke-width: 3 !important;
                cursor: pointer;
            }
            .line-path.line-selected:hover {
                filter: drop-shadow(0 0 8px #66B0FF) drop-shadow(0 0 4px #66B0FF) !important;
                stroke-width: 4 !important;
            }
        `;
        msdShadow.appendChild(styleEl);
        lcardsLog.debug('[MSDStudioDialog] Injected line highlight styles');
    }

    /**
     * Inject line highlighting styles into MSD card shadow DOM
     * @private
     */
    _injectLineHighlightStyles() {
        const livePreview = this.shadowRoot?.querySelector('lcards-msd-live-preview');
        if (!livePreview) return;

        const lpShadow = livePreview.shadowRoot;
        if (!lpShadow) return;

        const cardContainer = lpShadow.querySelector('.preview-card-container');
        if (!cardContainer) return;

        const msdCard = cardContainer.querySelector('lcards-msd-card');
        if (!msdCard) return;

        const msdShadow = msdCard.shadowRoot || msdCard.renderRoot;
        if (!msdShadow) return;

        // Inject styles
        const styleEl = document.createElement('style');
        styleEl.id = 'msd-studio-highlight-styles';
        styleEl.textContent = `
            .line-path {
                pointer-events: none !important;
                transition: none !important;
            }
            .line-hit-area {
                pointer-events: stroke !important;
                cursor: pointer !important;
            }
            /* Hover on hit area highlights the next sibling (visible path) */
            .line-hit-area:hover + .line-selection-indicator + .line-path,
            .line-hit-area:hover + .line-path {
                filter: drop-shadow(0 0 12px #66B0FF) drop-shadow(0 0 6px #66B0FF) !important;
                transition: none !important;
            }
        `;
        msdShadow.appendChild(styleEl);
        lcardsLog.debug('[MSDStudioDialog] Injected line highlight styles (hover only)');
        lcardsLog.debug('[MSDStudioDialog] Injected line highlight styles');
    }

    /**
     * Select a line on canvas (for waypoint editing)
     * @param {string} lineId
     * @private
     */
    _selectLine(lineId) {
        lcardsLog.debug(`[MSDStudioDialog] Selecting line: ${lineId}`);

        // Clear previous selection
        if (this._selectedLineId && this._workingConfig.msd?.overlays) {
            const prevLine = this._workingConfig.msd.overlays.find(o => o.id === this._selectedLineId);
            if (prevLine) delete prevLine._editorSelected;
        }

        // Update selected line ID and mark overlay
        this._selectedLineId = lineId;
        this._showWaypointMarkers = true;

        // Mark the overlay as selected (for rendering)
        if (this._workingConfig.msd?.overlays) {
            const lineOverlay = this._workingConfig.msd.overlays.find(o => o.id === lineId);
            if (lineOverlay) {
                lineOverlay._editorSelected = true;
            }
        }

        // Switch to ADD_WAYPOINT mode automatically
        this._activeMode = MODES.ADD_WAYPOINT;

        lcardsLog.info(`[MSDStudio] Selected line: ${lineId} (waypoint markers enabled, static indicator added)`);

        this.requestUpdate();
    }

    /**
     * Add a named anchor as a waypoint
     * @param {string} anchorName - Anchor name to add
     * @private
     */
    _addNamedWaypoint(anchorName) {
        if (!this._selectedLineId) return;

        const overlays = this._workingConfig.msd?.overlays || [];
        const lineIndex = overlays.findIndex(o => o.id === this._selectedLineId && o.type === 'line');

        if (lineIndex === -1) {
            lcardsLog.warn(`[MSDStudio] Cannot find line overlay: ${this._selectedLineId}`);
            return;
        }

        const line = overlays[lineIndex];

        // Auto-convert to manual mode if not already
        if (line.route !== 'manual') {
            lcardsLog.info(`[MSDStudio] Auto-converting line ${line.id} to manual mode`);
            line.route = 'manual';
            line.waypoints = [];
        }

        // Initialize waypoints array if needed
        if (!line.waypoints) {
            line.waypoints = [];
        }

        // Add anchor name as waypoint
        line.waypoints.push(anchorName);

        // Update line form data if this line is being edited
        if (this._lineFormData?.id === line.id) {
            this._lineFormData.route = 'manual';
            this._lineFormData.waypoints = [...line.waypoints];
        }

        lcardsLog.info(`[MSDStudio] Added named waypoint "${anchorName}" to line ${line.id} (total: ${line.waypoints.length})`);

        // Trigger re-render
        this.requestUpdate();
    }

    /**
     * Exit waypoint mode and return to VIEW mode
     * @private
     */
    _exitWaypointMode() {
        lcardsLog.debug('[MSDStudioDialog] Exiting waypoint mode');

        // Clear selection marker from overlay
        if (this._selectedLineId && this._workingConfig.msd?.overlays) {
            const lineOverlay = this._workingConfig.msd.overlays.find(o => o.id === this._selectedLineId);
            if (lineOverlay) {
                delete lineOverlay._editorSelected;
            }
        }

        // Clear selection
        this._selectedLineId = null;
        this._showWaypointMarkers = false;
        this._activeMode = MODES.VIEW;

        this.requestUpdate();
    }

    /**
     * Handle add waypoint click
     * Uses a delay to distinguish single click from double-click
     * @param {MouseEvent} event - Click event
     * @private
     */
    _handleAddWaypointClick(event) {
        if (!this._selectedLineId) {
            lcardsLog.warn('[MSDStudio] No line selected - click a line first');
            return;
        }

        // Ignore click if it was part of a drag operation
        if (this._waypointDragInProgress) {
            lcardsLog.debug('[MSDStudio] Click ignored - waypoint drag in progress');
            return;
        }

        // Clear any pending click timeout
        if (this._clickTimeout) {
            clearTimeout(this._clickTimeout);
            this._clickTimeout = null;
        }

        // Store click coordinates
        const coords = this._getPreviewCoordinates(event);
        if (!coords) {
            lcardsLog.warn('[MSDStudio] Could not get preview coordinates');
            return;
        }

        // Delay waypoint creation to allow double-click to cancel
        this._clickTimeout = setTimeout(() => {
            this._addWaypointAtPosition(coords.x, coords.y);
            this._clickTimeout = null;
        }, 250); // 250ms delay
    }

    /**
     * Actually add the waypoint (called after delay)
     * @param {number} x
     * @param {number} y
     * @private
     */
    _addWaypointAtPosition(x, y) {
        // Find the selected line
        const overlays = this._workingConfig.msd?.overlays || [];
        const lineIndex = overlays.findIndex(o => o.id === this._selectedLineId);

        if (lineIndex === -1) {
            lcardsLog.warn('[MSDStudio] Selected line not found');
            return;
        }

        const line = overlays[lineIndex];

        // Auto-convert to manual mode if not already
        if (line.route !== 'manual') {
            lcardsLog.info(`[MSDStudio] Auto-converting line ${line.id} to manual mode`);
            line.route = 'manual';
            line.waypoints = [];
        }

        // Initialize waypoints array if needed
        if (!line.waypoints) {
            line.waypoints = [];
        }

        // Add waypoint at clicked position (rounded to avoid floating point issues)
        const roundedX = Math.round(x);
        const roundedY = Math.round(y);
        line.waypoints.push([roundedX, roundedY]);

        // Update line form data if this line is being edited
        if (this._lineFormData?.id === line.id) {
            this._lineFormData.route = 'manual';
            this._lineFormData.waypoints = [...line.waypoints];
        }

        lcardsLog.info(`[MSDStudio] Added waypoint to ${line.id} at [${roundedX}, ${roundedY}] (total: ${line.waypoints.length})`);

        // Save and update preview
        this._schedulePreviewUpdate();
        this.requestUpdate();
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
            // Note: pixelX/pixelY from _cursorPosition already have snap applied
            // and zoom transform accounted for, so we use them as-is
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

        // Get MSD card to access resolved model with complete anchors
        const livePreview = this.shadowRoot.querySelector('lcards-msd-live-preview');
        if (!livePreview) return '';

        const livePreviewShadow = livePreview.shadowRoot;
        if (!livePreviewShadow) return '';

        const cardContainer = livePreviewShadow.querySelector('.preview-card-container');
        if (!cardContainer) return '';

        const msdCard = cardContainer.querySelector('lcards-msd-card');
        if (!msdCard) return '';

        // Resolve position - handle anchor-based positioning (string reference)
        let resolvedPosition;
        if (typeof control.position === 'string') {
            // Get complete merged anchors from card's resolved model (includes SVG + user-defined)
            const anchors = msdCard._msdPipeline?.getResolvedModel()?.anchors || {};
            resolvedPosition = anchors[control.position];
            if (!resolvedPosition) {
                lcardsLog.warn(`⚠️ [MSD Studio] Anchor '${control.position}' not found in resolved model`);
                return '';
            }
        } else {
            // Direct coordinate positioning
            resolvedPosition = control.position || [0, 0];
        }

        // Get size - default to 100x100 if not specified
        const size = control.size || [100, 100];
        if (!Array.isArray(size)) return '';

        let [vbX, vbY] = resolvedPosition;
        const [width, height] = size;

        // Apply attachment offset (same logic as MsdControlsRenderer and bounding box)
        const attachment = control.attachment || 'top-left';
        const offsetMap = {
            'top-left': [0, 0],
            'top': [-width / 2, 0],
            'top-center': [-width / 2, 0],
            'top-right': [-width, 0],
            'left': [0, -height / 2],
            'center': [-width / 2, -height / 2],
            'middle-center': [-width / 2, -height / 2],
            'right': [-width, -height / 2],
            'bottom-left': [0, -height],
            'bottom': [-width / 2, -height],
            'bottom-center': [-width / 2, -height],
            'bottom-right': [-width, -height]
        };
        const attachmentOffset = offsetMap[attachment] || offsetMap['top-left'];
        vbX += attachmentOffset[0];
        vbY += attachmentOffset[1];

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

        // Get zoom transform
        const zoomTransform = this._getZoomTransform();
        const zoomK = zoomTransform?.k || 1;
        const zoomX = zoomTransform?.x || 0;
        const zoomY = zoomTransform?.y || 0;

        // Convert viewBox coords to SVG pixel position with zoom
        let svgPixelX = (vbX - viewBoxX) / scale + offsetX;
        let svgPixelY = (vbY - viewBoxY) / scale + offsetY;
        let pixelWidth = width / scale;
        let pixelHeight = height / scale;

        svgPixelX = svgPixelX * zoomK + zoomX;
        svgPixelY = svgPixelY * zoomK + zoomY;
        pixelWidth = pixelWidth * zoomK;
        pixelHeight = pixelHeight * zoomK;

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

        lcardsLog.trace('[MSDStudio] _renderGridOverlay called, _showGrid:', this._showGrid);

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
            lcardsLog.trace('[MSDStudio] Could not find lcards-msd-live-preview');
            return '';
        }

        const livePreviewShadow = livePreview.shadowRoot;
        if (!livePreviewShadow) {
            lcardsLog.trace('[MSDStudio] Could not find livePreview.shadowRoot');
            return '';
        }

        const cardContainer = livePreviewShadow.querySelector('.preview-card-container');
        if (!cardContainer) {
            lcardsLog.trace('[MSDStudio] Could not find .preview-card-container');
            return '';
        }

        const msdCard = cardContainer.querySelector('lcards-msd-card');
        if (!msdCard) {
            lcardsLog.trace('[MSDStudio] Could not find lcards-msd-card');
            return '';
        }

        const shadowRoot = msdCard.shadowRoot || msdCard.renderRoot;
        if (!shadowRoot) {
            lcardsLog.trace('[MSDStudio] Could not find msdCard.shadowRoot');
            return '';
        }

        const svg = shadowRoot.querySelector('svg');
        if (!svg) {
            lcardsLog.trace('[MSDStudio] Could not find svg');
            return '';
        }

        lcardsLog.trace('[MSDStudio] Found SVG, calculating grid...');
        lcardsLog.trace('[MSDStudio] Grid lines:', { verticalLines: verticalLines.length, horizontalLines: horizontalLines.length });
        lcardsLog.trace('[MSDStudio] ViewBox:', { viewBoxX, viewBoxY, viewBoxWidth, viewBoxHeight });

        const rect = svg.getBoundingClientRect();
        const previewPanel = this.shadowRoot.querySelector('.preview-panel');
        if (!previewPanel) return '';
        const panelRect = previewPanel.getBoundingClientRect();

        lcardsLog.trace('[MSDStudio] SVG Rect:', rect);
        lcardsLog.trace('[MSDStudio] Panel rect:', panelRect);

        // Calculate scale
        const scaleX = viewBoxWidth / rect.width;
        const scaleY = viewBoxHeight / rect.height;
        const scale = Math.max(scaleX, scaleY);

        lcardsLog.trace('[MSDStudio] Scale:', { scaleX, scaleY, scale });

        const renderedWidth = viewBoxWidth / scale;
        const renderedHeight = viewBoxHeight / scale;
        const offsetX = (rect.width - renderedWidth) / 2;
        const offsetY = (rect.height - renderedHeight) / 2;

        // Calculate preview panel dimensions for full-height/width lines
        const panelWidth = panelRect.width;
        const panelHeight = panelRect.height;

        lcardsLog.trace('[MSDStudio] Rendering grid with', verticalLines.length, 'vertical and', horizontalLines.length, 'horizontal lines');

        // Get zoom transform to apply to grid
        const zoomTransform = this._getZoomTransform();
        const zoomK = zoomTransform?.k || 1;
        const zoomX = zoomTransform?.x || 0;
        const zoomY = zoomTransform?.y || 0;

        // Calculate base_svg boundary position with zoom applied
        const baseSvgLeft = (rect.left - panelRect.left) + offsetX * zoomK + zoomX;
        const baseSvgTop = (rect.top - panelRect.top) + offsetY * zoomK + zoomY;
        const baseSvgWidth = renderedWidth * zoomK;
        const baseSvgHeight = renderedHeight * zoomK;

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
                    const svgPixelX = ((x - viewBoxX) / scale) * zoomK;
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
                    const svgPixelY = ((y - viewBoxY) / scale) * zoomK;
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

        // Get zoom transform to apply to anchor positions
        const zoomTransform = this._getZoomTransform();
        const zoomK = zoomTransform?.k || 1;
        const zoomX = zoomTransform?.x || 0;
        const zoomY = zoomTransform?.y || 0;

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
                    // Convert viewBox coords to SVG pixels, then apply zoom
                    let svgPixelX = (vbX - viewBoxX) / scale + offsetX;
                    let svgPixelY = (vbY - viewBoxY) / scale + offsetY;
                    svgPixelX = svgPixelX * zoomK + zoomX;
                    svgPixelY = svgPixelY * zoomK + zoomY;
                    const pixelX = (rect.left - panelRect.left) + svgPixelX;
                    const pixelY = (rect.top - panelRect.top) + svgPixelY;

                    const isBaseSvg = !userAnchors[name];
                    const color = isBaseSvg ? '#888888' : '#FFFF00';
                    const isDragging = this._anchorDragState.active && this._anchorDragState.anchorName === name;
                    const isWaypointMode = this._activeMode === MODES.ADD_WAYPOINT;

                    return html`
                        <!-- Anchor marker -->
                        <div
                            class="${!isBaseSvg ? 'interactive-anchor' : ''} ${isDragging ? 'anchor-dragging' : ''} anchor-marker"
                            data-anchor-name="${name}"
                            data-is-base-svg="${isBaseSvg}"
                            style="
                                position: absolute;
                                left: ${pixelX}px;
                                top: ${pixelY}px;
                                transform: translate(-50%, -50%);
                                width: ${isWaypointMode ? '16px' : '12px'};
                                height: ${isWaypointMode ? '16px' : '12px'};
                                background: ${color};
                                border: 2px solid ${isWaypointMode ? '#00FFFF' : 'white'};
                                border-radius: 50%;
                                box-shadow: 0 0 ${isWaypointMode ? '8px' : '4px'} rgba(0, 0, 0, 0.5);
                                pointer-events: ${!isBaseSvg || isWaypointMode ? 'auto' : 'none'};
                                cursor: ${isWaypointMode ? 'pointer' : 'default'};
                                transition: all 0.2s ease;
                                z-index: ${isWaypointMode ? '1001' : '997'};
                            "
                            @mousedown=${!isBaseSvg && this._activeMode !== MODES.ADD_WAYPOINT ? (e) => this._handleAnchorDragStart(e, name) : null}
                            @dblclick=${!isBaseSvg && this._activeMode !== MODES.ADD_WAYPOINT ? (e) => this._handleAnchorDoubleClick(e, name) : null}>
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

        // Get zoom transform
        const zoomTransform = this._getZoomTransform();
        const zoomK = zoomTransform?.k || 1;
        const zoomX = zoomTransform?.x || 0;
        const zoomY = zoomTransform?.y || 0;

        // Get all anchors from the card's resolved model (already merged base SVG + user-defined)
        const resolvedModel = msdCard._msdPipeline?.getResolvedModel?.();
        const anchors = resolvedModel?.anchors || {};

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
                ${controls.map(control => {
                    // Resolve position for both anchored and explicitly positioned controls
                    let resolvedPosition;
                    if (control.position && Array.isArray(control.position)) {
                        // Explicitly positioned with coordinates
                        resolvedPosition = control.position;
                    } else if (typeof control.position === 'string') {
                        // Positioned with anchor reference (string)
                        resolvedPosition = OverlayUtils.resolvePosition(control.position, anchors);
                        if (!resolvedPosition) {
                            lcardsLog.warn('[MSDStudio] Failed to resolve anchor position:', control.position, control.id);
                            return '';
                        }
                    } else if (control.anchor) {
                        // Legacy: Anchored to a named anchor
                        resolvedPosition = OverlayUtils.resolvePosition(control.anchor, anchors);
                        if (!resolvedPosition) {
                            lcardsLog.warn('[MSDStudio] Failed to resolve legacy anchor:', control.anchor, control.id);
                            return '';
                        }
                    } else {
                        lcardsLog.warn('[MSDStudio] Control has no valid position:', control.id);
                        return '';
                    }

                    // Get size - default to 100x100 if not specified
                    const size = control.size || [100, 100];
                    if (!Array.isArray(size)) return '';

                    let [vbX, vbY] = resolvedPosition;
                    const [width, height] = size;

                    // Apply attachment offset (same logic as MsdControlsRenderer)
                    const attachment = control.attachment || 'top-left';
                    const offsetMap = {
                        'top-left': [0, 0],
                        'top': [-width / 2, 0],
                        'top-center': [-width / 2, 0],
                        'top-right': [-width, 0],
                        'left': [0, -height / 2],
                        'center': [-width / 2, -height / 2],
                        'middle-center': [-width / 2, -height / 2],
                        'right': [-width, -height / 2],
                        'bottom-left': [0, -height],
                        'bottom': [-width / 2, -height],
                        'bottom-center': [-width / 2, -height],
                        'bottom-right': [-width, -height]
                    };
                    const offset = offsetMap[attachment] || offsetMap['top-left'];
                    vbX += offset[0];
                    vbY += offset[1];

                    // Convert to SVG pixels then apply zoom
                    let svgPixelX = (vbX - viewBoxX) / scale + offsetX;
                    let svgPixelY = (vbY - viewBoxY) / scale + offsetY;
                    let pixelWidth = width / scale;
                    let pixelHeight = height / scale;

                    svgPixelX = svgPixelX * zoomK + zoomX;
                    svgPixelY = svgPixelY * zoomK + zoomY;
                    pixelWidth = pixelWidth * zoomK;
                    pixelHeight = pixelHeight * zoomK;

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

        lcardsLog.trace('[MSDStudio] _renderRoutingPaths called, _showRoutingPaths:', this._showRoutingPaths);

        const overlays = this._workingConfig.msd?.overlays || [];
        const lines = overlays.filter(o => o.type === 'line');
        if (lines.length === 0) {
            lcardsLog.trace('[MSDStudio] No line overlays found');
            return '';
        }

        lcardsLog.trace('[MSDStudio] Found', lines.length, 'line overlays');

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

        // Get zoom transform
        const zoomTransform = this._getZoomTransform();
        const zoomK = zoomTransform?.k || 1;
        const zoomX = zoomTransform?.x || 0;
        const zoomY = zoomTransform?.y || 0;

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

                    // Apply zoom to coordinates
                    let svgStartX = (startX - viewBoxX) / scale + offsetX;
                    let svgStartY = (startY - viewBoxY) / scale + offsetY;
                    let svgEndX = (endX - viewBoxX) / scale + offsetX;
                    let svgEndY = (endY - viewBoxY) / scale + offsetY;

                    svgStartX = svgStartX * zoomK + zoomX;
                    svgStartY = svgStartY * zoomK + zoomY;
                    svgEndX = svgEndX * zoomK + zoomX;
                    svgEndY = svgEndY * zoomK + zoomY;

                    const pixelStartX = (rect.left - panelRect.left) + svgStartX;
                    const pixelStartY = (rect.top - panelRect.top) + svgStartY;
                    const pixelEndX = (rect.left - panelRect.left) + svgEndX;
                    const pixelEndY = (rect.top - panelRect.top) + svgEndY;

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

        // Get zoom transform
        const zoomTransform = this._getZoomTransform();
        const zoomK = zoomTransform?.k || 1;
        const zoomX = zoomTransform?.x || 0;
        const zoomY = zoomTransform?.y || 0;

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

                    // Convert to screen coordinates with zoom
                    const [startX, startY] = startPos;
                    const [endX, endY] = endPos;

                    let svgStartX = (startX - viewBoxX) / scale + offsetX;
                    let svgStartY = (startY - viewBoxY) / scale + offsetY;
                    let svgEndX = (endX - viewBoxX) / scale + offsetX;
                    let svgEndY = (endY - viewBoxY) / scale + offsetY;

                    svgStartX = svgStartX * zoomK + zoomX;
                    svgStartY = svgStartY * zoomK + zoomY;
                    svgEndX = svgEndX * zoomK + zoomX;
                    svgEndY = svgEndY * zoomK + zoomY;

                    const pixelStartX = (rect.left - panelRect.left) + svgStartX;
                    const pixelStartY = (rect.top - panelRect.top) + svgStartY;
                    const pixelEndX = (rect.left - panelRect.left) + svgEndX;
                    const pixelEndY = (rect.top - panelRect.top) + svgEndY;

                    // Check if this line is being dragged
                    const isDragging = this._lineEndpointDragState.active && this._lineEndpointDragState.lineId === line.id;
                    const dragEndpoint = isDragging ? this._lineEndpointDragState.endpoint : null;

                    // Get offset for overlapping endpoints
                    const startOffset = endpointOffsets.get(`${line.id}:start`) || { dx: 0, dy: 0 };
                    const endOffset = endpointOffsets.get(`${line.id}:end`) || { dx: 0, dy: 0 };

                    // Calculate drag position if applicable with zoom
                    let dragPixelX = 0, dragPixelY = 0;
                    if (isDragging && this._lineEndpointDragState.currentPos) {
                        const [dragX, dragY] = this._lineEndpointDragState.currentPos;
                        let svgDragX = (dragX - viewBoxX) / scale + offsetX;
                        let svgDragY = (dragY - viewBoxY) / scale + offsetY;
                        svgDragX = svgDragX * zoomK + zoomX;
                        svgDragY = svgDragY * zoomK + zoomY;
                        dragPixelX = (rect.left - panelRect.left) + svgDragX;
                        dragPixelY = (rect.top - panelRect.top) + svgDragY;
                    }

                    // Hide endpoint markers when in waypoint mode for the selected line
                    const isInWaypointMode = this._activeMode === MODES.ADD_WAYPOINT && this._selectedLineId === line.id;
                    if (isInWaypointMode) {
                        return ''; // Don't render endpoint markers for line in waypoint mode
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

        lcardsLog.trace('[MSDStudio] _renderChannelsOverlay called, _showRoutingChannels:', this._showRoutingChannels);

        const channels = this._workingConfig.msd?.channels || {};
        if (Object.keys(channels).length === 0) {
            lcardsLog.trace('[MSDStudio] No channels found');
            return '';
        }

        lcardsLog.trace('[MSDStudio] Found', Object.keys(channels).length, 'channels');

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

                    // Determine direction: explicit or auto-detect from shape
                    let direction = (channel.direction || 'auto').toLowerCase();
                    if (direction === 'auto') {
                        direction = width >= height ? 'horizontal' : 'vertical';
                    }

                    // Arrow indicator for flow direction (relative to SVG origin)
                    const arrowSize = Math.min(pixelWidth, pixelHeight) * 0.3;
                    const arrowCenterX = pixelWidth / 2;  // Center of SVG, not absolute
                    const arrowCenterY = pixelHeight / 2;
                    const arrowPath = direction === 'horizontal'
                        ? `M ${arrowCenterX - arrowSize} ${arrowCenterY} L ${arrowCenterX + arrowSize} ${arrowCenterY} M ${arrowCenterX + arrowSize - 6} ${arrowCenterY - 4} L ${arrowCenterX + arrowSize} ${arrowCenterY} L ${arrowCenterX + arrowSize - 6} ${arrowCenterY + 4}`
                        : `M ${arrowCenterX} ${arrowCenterY - arrowSize} L ${arrowCenterX} ${arrowCenterY + arrowSize} M ${arrowCenterX - 4} ${arrowCenterY + arrowSize - 6} L ${arrowCenterX} ${arrowCenterY + arrowSize} L ${arrowCenterX + 4} ${arrowCenterY + arrowSize - 6}`;

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
                        <!-- Direction arrow indicator -->
                        <svg style="
                            position: absolute;
                            left: ${pixelX}px;
                            top: ${pixelY}px;
                            width: ${pixelWidth}px;
                            height: ${pixelHeight}px;
                            pointer-events: none;
                            overflow: visible;
                        ">
                            <path
                                d="${arrowPath}"
                                stroke="${color}"
                                stroke-width="2"
                                fill="none"
                                opacity="0.8"
                            />
                        </svg>
                    `;
                })}
            </div>
        `;
    }

    /**
     * Render waypoint markers for manual lines
     * Shows draggable circles at each waypoint position
     * Only shows markers for the selected line
     * @returns {TemplateResult}
     * @private
     */
    _renderWaypointMarkers() {
        if (!this._showWaypointMarkers || !this._selectedLineId) return '';

        const overlays = this._workingConfig.msd?.overlays || [];
        const selectedLine = overlays.find(o => o.id === this._selectedLineId);

        // Show markers only for selected line if it has waypoints
        if (!selectedLine || !selectedLine.waypoints || selectedLine.waypoints.length === 0) return '';

        // Get coordinate conversion context
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

        // Get zoom transform
        const zoomTransform = this._getZoomTransform();
        const zoomK = zoomTransform?.k || 1;
        const zoomX = zoomTransform?.x || 0;
        const zoomY = zoomTransform?.y || 0;

        // Helper to convert viewBox to pixel coordinates with zoom
        const vbToPixel = (vbX, vbY) => {
            let svgX = (vbX - viewBoxX) / scale + offsetX;
            let svgY = (vbY - viewBoxY) / scale + offsetY;
            svgX = svgX * zoomK + zoomX;
            svgY = svgY * zoomK + zoomY;
            const pixelX = svgX + (rect.left - panelRect.left);
            const pixelY = svgY + (rect.top - panelRect.top);
            return [pixelX, pixelY];
        };

        // Get all anchors to resolve named waypoints
        const userAnchors = this._workingConfig.msd?.anchors || {};
        const baseSvgAnchors = this._getBaseSvgAnchors();
        const allAnchors = { ...baseSvgAnchors, ...userAnchors };

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
                ${selectedLine.waypoints.map((wp, wpIndex) => {
                    // Handle both coordinate arrays [x, y] and named anchors "anchor_name"
                    let wpX, wpY, isNamedAnchor = false, anchorName = '';

                    if (Array.isArray(wp) && wp.length >= 2) {
                        // Coordinate waypoint
                        [wpX, wpY] = wp;
                    } else if (typeof wp === 'string' && allAnchors[wp]) {
                        // Named anchor waypoint - resolve to coordinates
                        isNamedAnchor = true;
                        anchorName = wp;
                        [wpX, wpY] = allAnchors[wp];
                    } else {
                        // Invalid waypoint
                        return '';
                    }

                    const [pixelX, pixelY] = vbToPixel(wpX, wpY);

                    const isDragging = this._waypointDragState?.lineId === selectedLine.id &&
                                     this._waypointDragState?.waypointIndex === wpIndex;

                    // Always show as editable since we're on the selected line
                    return html`
                        <div
                            class="waypoint-marker editing ${isDragging ? 'dragging' : ''} ${isNamedAnchor ? 'named-anchor' : ''}"
                            style="
                                position: absolute;
                                left: ${pixelX}px;
                                top: ${pixelY}px;
                                transform: translate(-50%, -50%);
                                width: 24px;
                                height: 24px;
                                border-radius: 50%;
                                background: ${isDragging ? '#FFAA00' : (isNamedAnchor ? '#FFFF00' : '#00FF88')};
                                border: 2px solid ${isNamedAnchor ? '#FF9900' : '#FFF'};
                                cursor: move;
                                pointer-events: auto;
                                box-shadow: 0 2px 8px rgba(0,0,0,0.3);
                                transition: all 0.2s ease;
                                z-index: ${isDragging ? '1002' : '1001'};
                                display: flex;
                                align-items: center;
                                justify-content: center;
                                font-family: 'Antonio', sans-serif;
                                font-size: 12px;
                                font-weight: 700;
                                color: #000;
                            "
                            @mousedown=${(e) => this._handleWaypointMouseDown(e, selectedLine.id, wpIndex)}
                            @dblclick=${(e) => this._handleWaypointDoubleClick(e, selectedLine.id, wpIndex)}
                            title="${isNamedAnchor ? `Named waypoint: ${anchorName}` : `Waypoint ${wpIndex + 1}`} (Drag to move, Double-click to delete)">
                            ${wpIndex + 1}
                        </div>
                    `;
                })}
            </div>
        `;
    }

    /**
     * Handle mouse down on waypoint marker - start drag
     * @param {MouseEvent} e
     * @param {string} lineId
     * @param {number} waypointIndex
     * @private
     */
    _handleWaypointMouseDown(e, lineId, waypointIndex) {
        e.stopPropagation();
        e.preventDefault();

        // Enable editing for this line if not already
        if (this._waypointEditingLineId !== lineId) {
            this._waypointEditingLineId = lineId;
        }

        // Set flag to prevent click event from firing
        this._waypointDragInProgress = true;

        // Start drag state
        this._waypointDragState = {
            lineId,
            waypointIndex,
            startX: e.clientX,
            startY: e.clientY
        };

        // Add global mouse handlers
        this._boundWaypointMouseMove = this._handleWaypointMouseMove.bind(this);
        this._boundWaypointMouseUp = this._handleWaypointMouseUp.bind(this);
        document.addEventListener('mousemove', this._boundWaypointMouseMove);
        document.addEventListener('mouseup', this._boundWaypointMouseUp);

        this.requestUpdate();
    }

    /**
     * Handle waypoint drag
     * @param {MouseEvent} e
     * @private
     */
    _handleWaypointMouseMove(e) {
        if (!this._waypointDragState) return;

        e.preventDefault();

        const { lineId, waypointIndex } = this._waypointDragState;

        // Get coordinate conversion context - use wrapper method
        const coords = this._getPreviewCoordinatesFromMouseEvent(e);

        if (!coords) return;

        let { x, y } = coords;

        // Apply grid snapping if enabled
        if (this._enableSnapping && this._gridSpacing > 0) {
            const snapped = snapToGrid(x, y, this._gridSpacing, true);
            x = snapped[0];
            y = snapped[1];
        }

        // Check if near an anchor (snap to anchor if within threshold)
        let waypointValue = [this._roundToPrecision(x), this._roundToPrecision(y)];
        const anchorThreshold = 30; // ViewBox units
        const userAnchors = this._workingConfig.msd?.anchors || {};
        const baseSvgAnchors = this._getBaseSvgAnchors();
        const allAnchors = { ...userAnchors, ...baseSvgAnchors };

        if (allAnchors && typeof allAnchors === 'object' && !Array.isArray(allAnchors)) {
            for (const [anchorName, anchorPos] of Object.entries(allAnchors)) {
                if (Array.isArray(anchorPos) && anchorPos.length >= 2) {
                    const [ax, ay] = anchorPos;
                    const dist = Math.sqrt(Math.pow(x - ax, 2) + Math.pow(y - ay, 2));
                    if (dist < anchorThreshold) {
                        // Convert to named anchor waypoint
                        waypointValue = anchorName;
                        lcardsLog.debug(`[MSDStudio] Waypoint ${waypointIndex} snapped to anchor: ${anchorName}`);
                        break;
                    }
                }
            }
        }

        // Update waypoint position in _workingConfig
        const overlays = this._workingConfig.msd?.overlays || [];
        const lineIndex = overlays.findIndex(o => o.id === lineId);

        if (lineIndex !== -1) {
            const line = overlays[lineIndex];
            if (line.waypoints && line.waypoints[waypointIndex] !== undefined) {
                line.waypoints[waypointIndex] = waypointValue;

                // Also update _lineFormData if this is the currently edited line
                if (this._lineFormData?.id === lineId && this._lineFormData.waypoints) {
                    this._lineFormData.waypoints[waypointIndex] = waypointValue;
                }

                // Save changes
                this._saveLine();

                // Trigger preview update
                this._schedulePreviewUpdate();
                this.requestUpdate();
            }
        }
    }

    /**
     * Handle waypoint drag end
     * @param {MouseEvent} e
     * @private
     */
    _handleWaypointMouseUp(e) {
        if (!this._waypointDragState) return;

        e.preventDefault();
        e.stopPropagation();

        // Clean up drag state
        this._waypointDragState = null;

        // Remove global handlers
        if (this._boundWaypointMouseMove) {
            document.removeEventListener('mousemove', this._boundWaypointMouseMove);
            this._boundWaypointMouseMove = null;
        }
        if (this._boundWaypointMouseUp) {
            document.removeEventListener('mouseup', this._boundWaypointMouseUp);
            this._boundWaypointMouseUp = null;
        }

        // Clear drag flag after a longer delay to prevent click event from exiting waypoint mode
        setTimeout(() => {
            this._waypointDragInProgress = false;
        }, 150);

        this.requestUpdate();
    }

    /**
     * Handle double-click on waypoint - delete it
     * @param {MouseEvent} e
     * @param {string} lineId
     * @param {number} waypointIndex
     * @private
     */
    _handleWaypointDoubleClick(e, lineId, waypointIndex) {
        e.stopPropagation();
        e.preventDefault();

        // Cancel any pending single-click waypoint creation
        if (this._clickTimeout) {
            clearTimeout(this._clickTimeout);
            this._clickTimeout = null;
        }

        const overlays = this._workingConfig.msd?.overlays || [];
        const lineIndex = overlays.findIndex(o => o.id === lineId);

        if (lineIndex !== -1) {
            const line = overlays[lineIndex];
            if (line.waypoints && line.waypoints.length > 0) {
                // Remove waypoint
                line.waypoints.splice(waypointIndex, 1);

                // Also update _lineFormData if this is the currently edited line
                if (this._lineFormData?.id === lineId && this._lineFormData.waypoints) {
                    this._lineFormData.waypoints.splice(waypointIndex, 1);
                }

                // If no waypoints left, could optionally switch back to auto mode
                if (line.waypoints.length === 0) {
                    // Keep manual mode but with no waypoints (direct path)
                }

                lcardsLog.debug(`[MSDStudio] Deleted waypoint ${waypointIndex} from line ${lineId}`);

                // Update preview
                this._schedulePreviewUpdate();
                this.requestUpdate();
            }
        }
    }

    /**
     * Convert auto/direct routed line to manual mode with current path as waypoints
     * @param {string} lineId
     * @private
     */
    _convertLineToManual(lineId) {
        // Find the line in the rendered SVG to get its current path
        const livePreview = this.shadowRoot.querySelector('lcards-msd-live-preview');
        if (!livePreview) {
            lcardsLog.warn('[MSDStudio] Cannot convert to manual: preview not found');
            return;
        }

        const livePreviewShadow = livePreview.shadowRoot;
        if (!livePreviewShadow) return;

        const cardContainer = livePreviewShadow.querySelector('.preview-card-container');
        if (!cardContainer) return;

        const msdCard = cardContainer.querySelector('lcards-msd-card');
        if (!msdCard) return;

        const shadowRoot = msdCard.shadowRoot || msdCard.renderRoot;
        if (!shadowRoot) return;

        const svg = shadowRoot.querySelector('svg');
        if (!svg) return;

        // Find the line's path element
        const linePath = svg.querySelector(`path[data-overlay-id="${lineId}"]`);
        if (!linePath) {
            lcardsLog.warn('[MSDStudio] Cannot convert to manual: line path not found in SVG');
            return;
        }

        // Get the path data and parse it into waypoints
        const pathData = linePath.getAttribute('d');
        if (!pathData) return;

        // Parse SVG path commands (simplified - handles M and L commands)
        const waypoints = [];
        const commands = pathData.match(/[ML]\s*[\d.]+,[\d.]+/g) || [];

        commands.forEach((cmd, index) => {
            // Skip first M (start point) and last point (end point) as they're already defined
            if (index === 0 || index === commands.length - 1) return;

            const coords = cmd.replace(/[ML]\s*/, '').split(',').map(Number);
            if (coords.length === 2) {
                waypoints.push([coords[0], coords[1]]);
            }
        });

        // Update the line config
        const overlays = this._workingConfig.msd?.overlays || [];
        const lineIndex = overlays.findIndex(o => o.id === lineId);

        if (lineIndex !== -1) {
            const line = overlays[lineIndex];
            line.route = 'manual';
            line.waypoints = waypoints;

            // Update form data if this is the currently edited line
            if (this._editingLineId === lineId) {
                this._lineFormData.route = 'manual';
                this._lineFormData.waypoints = waypoints;
                this._waypointEditingLineId = lineId;
                this._showWaypointMarkers = true;
            }

            lcardsLog.info(`[MSDStudio] Converted line ${lineId} to manual mode with ${waypoints.length} waypoints`);

            // Update preview
            this._schedulePreviewUpdate();
            this.requestUpdate();
        }
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
        // Don't show attachment points in waypoint mode to avoid conflicts with anchor selection
        if (this._activeMode === MODES.ADD_WAYPOINT) return '';

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

        // Get zoom transform
        const zoomTransform = this._getZoomTransform();
        const zoomK = zoomTransform?.k || 1;
        const zoomX = zoomTransform?.x || 0;
        const zoomY = zoomTransform?.y || 0;

        // Helper function to convert viewBox coords to pixel position with zoom
        const toPixelPos = (vbX, vbY) => {
            let svgPixelX = (vbX - viewBoxX) / scale + offsetX;
            let svgPixelY = (vbY - viewBoxY) / scale + offsetY;
            svgPixelX = svgPixelX * zoomK + zoomX;
            svgPixelY = svgPixelY * zoomK + zoomY;
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

            const [rawX, rawY] = resolvedPosition;
            const [width, height] = control.size;
            const attachment = control.attachment || 'top-left';

            // Apply attachment offset (same logic as MsdControlsRenderer)
            const offsetMap = {
                'top-left': [0, 0],
                'top': [-width / 2, 0],
                'top-center': [-width / 2, 0],
                'top-right': [-width, 0],
                'left': [0, -height / 2],
                'center': [-width / 2, -height / 2],
                'middle-center': [-width / 2, -height / 2],
                'right': [-width, -height / 2],
                'bottom-left': [0, -height],
                'bottom': [-width / 2, -height],
                'bottom-center': [-width / 2, -height],
                'bottom-right': [-width, -height]
            };

            const offset = offsetMap[attachment] || offsetMap['top-left'];
            const vbX = rawX + offset[0];
            const vbY = rawY + offset[1];

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
            lcardsLog.debug('[MSDStudio] Connect line source set:', connectionInfo);
            this.requestUpdate();
        } else {
            // Second click - open line form with connection data
            lcardsLog.debug('[MSDStudio] Connect line target set:', connectionInfo);
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
                <!-- Control Actions & Visualization Helpers -->
                <div style="display: flex; gap: 8px; margin-bottom: 16px; align-items: center;">
                    <ha-button @click=${this._openControlForm}>
                        <ha-icon icon="mdi:plus" slot="start"></ha-icon>
                        Add Control
                    </ha-button>
                    <ha-button @click=${async (e) => { e.stopPropagation(); await this._setMode('place_control'); }}
                               ?disabled=${this._activeMode === MODES.PLACE_CONTROL}>
                        <ha-icon icon="mdi:cursor-default-click" slot="start"></ha-icon>
                        Place on Canvas
                    </ha-button>

                    <!-- Right-aligned visualization helpers -->
                    <div style="flex: 1;"></div>
                    <ha-icon-button
                        class="${this._showBoundingBoxes ? 'active' : ''}"
                        @click=${() => { this._showBoundingBoxes = !this._showBoundingBoxes; this.requestUpdate(); }}
                        .label=${'Bounding Boxes'}>
                        <ha-icon icon="mdi:border-outside"></ha-icon>
                    </ha-icon-button>
                    <ha-icon-button
                        class="${this._showAttachmentPoints ? 'active' : ''}"
                        @click=${() => { this._showAttachmentPoints = !this._showAttachmentPoints; this.requestUpdate(); }}
                        .label=${'Attachment Points'}>
                        <ha-icon icon="mdi:target-variant"></ha-icon>
                    </ha-icon-button>
                </div>

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
                title: 'Auto (Recommended)',
                icon: 'mdi:auto-fix',
                description: 'Automatically chooses the best routing algorithm based on your layout. When obstacles or channels are detected, it upgrades to advanced pathfinding. Otherwise uses simple Manhattan routing. Best for most use cases.',
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
                        <!-- Auto badge -->
                        <text x="100" y="75" text-anchor="middle" font-size="10" fill="var(--secondary-text-color)">Auto-detects obstacles</text>
                    </svg>
                `
            },
            direct: {
                title: 'Direct (Straight Line)',
                icon: 'mdi:minus',
                description: 'Simple straight line from source to target. No routing or obstacle avoidance. Best when you want a direct connection regardless of obstacles.',
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
            manual: {
                title: 'Manual (Custom Waypoints)',
                icon: 'mdi:map-marker-path',
                description: 'Draw your own custom path by placing waypoints. Gives you complete control over the line shape. Best when you need precise, artistic routing that auto mode cannot achieve.',
                diagram: html`
                    <svg viewBox="0 0 200 80" style="width: 100%; height: auto;">
                        <!-- Source -->
                        <rect x="10" y="40" width="30" height="30" fill="var(--lcars-blue)" rx="4"/>
                        <!-- Waypoints -->
                        <circle cx="80" cy="20" r="4" fill="var(--lcars-orange)"/>
                        <circle cx="120" cy="60" r="4" fill="var(--lcars-orange)"/>
                        <!-- Target -->
                        <rect x="160" y="40" width="30" height="30" fill="var(--lcars-green)" rx="4"/>
                        <!-- Manual path through waypoints -->
                        <path d="M 40 55 L 80 20 L 120 60 L 160 55"
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
                <lcards-form-section
                    header="Channel Routing"
                    description="Route through specific channels (none defined)"
                    icon="mdi:vector-polyline"
                    ?expanded=${false}>

                    <div style="padding: 12px; background: var(--card-background-color); border: 1px solid var(--divider-color); border-radius: 4px; font-size: 13px; color: var(--secondary-text-color);">
                        <ha-icon icon="mdi:information" style="vertical-align: middle; --mdc-icon-size: 18px;"></ha-icon>
                        No routing channels defined. Create channels in the Channels tab to enable channel-based routing.
                    </div>
                </lcards-form-section>
            `;
        }

        return html`
            <lcards-form-section
                header="Channel Routing"
                description="Route through specific channels for bundling/organizing lines"
                icon="mdi:vector-polyline"
                ?expanded=${false}>

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
                    helper-text="Lines will route through selected channels based on channel behavior (prefer/avoid/force)"
                    @value-changed=${(e) => {
                        this._lineFormData.route_channels = e.detail.value || [];
                        this.requestUpdate();
                    }}>
                </ha-selector>

                ${(this._lineFormData.route_channels && this._lineFormData.route_channels.length > 0) ? html`
                    <div style="margin-top: 12px; padding: 8px; background: var(--secondary-background-color); border-radius: 4px; font-size: 12px; color: var(--secondary-text-color);">
                        <ha-icon icon="mdi:information-outline" style="vertical-align: middle; --mdc-icon-size: 16px;"></ha-icon>
                        Channel behavior (mode: prefer/avoid/force) and line spacing are configured on the channel, not per-line.
                    </div>
                ` : ''}
            </lcards-form-section>
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
        const hasCard = control.card && control.card.type;

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
                        ${hasCard ? html`
                            <ha-icon-button
                                @click=${() => this._editLayerCard(control.id)}
                                .label=${'Edit Card'}
                                title="Edit card with native HA editor">
                                <ha-icon icon="mdi:card-edit-outline"></ha-icon>
                            </ha-icon-button>
                        ` : ''}
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
     * Render native HA card picker section
     * @returns {TemplateResult}
     * @private
     */
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
        this._controlFormObstacle = false;
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
        this._controlFormObstacle = control.obstacle === true;
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
            obstacle: this._controlFormObstacle || undefined,
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
                style="--mdc-dialog-min-width: 80vw; --mdc-dialog-max-width: 90vw;">

                <!-- Two-Column Layout: Config (Left) + Preview (Right) -->
                <div style="display: grid; grid-template-columns: 1fr 35vw; gap: 24px; padding: 16px;">

                    <!-- LEFT COLUMN: Configuration Panel -->
                    <div class="config-panel">
                        <!-- Subtabs -->
                        <ha-tab-group @wa-tab-show=${this._handleControlFormTabChange} style="margin-bottom: 16px;">
                            <ha-tab-group-tab value="placement" ?active=${this._controlFormActiveSubtab === 'placement'}>Placement</ha-tab-group-tab>
                            <ha-tab-group-tab value="card" ?active=${this._controlFormActiveSubtab === 'card'}>Card</ha-tab-group-tab>
                        </ha-tab-group>

                        <!-- Subtab Content -->
                        <div style="max-height: 70vh; overflow-y: auto;">
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
                        <ha-icon icon="mdi:content-save" slot="start"></ha-icon>
                        Save
                    </ha-button>
                </div>

                <div slot="secondaryAction">
                    <ha-button @click=${this._closeControlForm} appearance="plain">
                        <ha-icon icon="mdi:close" slot="start"></ha-icon>
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
                    @input=${(e) => this._controlFormId = e.target.value}
                    required
                    helper-text="Unique identifier for this control">
                </ha-textfield>

                <lcards-form-section
                    header="Position"
                    description="Set control position using anchor or coordinates"
                    icon="mdi:crosshairs-gps"
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
                                    this._controlFormPosition = [this._roundToPrecision(Number(e.target.value)), this._controlFormPosition[1]];
                                    this.requestUpdate();
                                }}>
                            </ha-textfield>
                            <ha-textfield
                                type="number"
                                label="Y Position"
                                .value=${String(this._controlFormPosition[1] || 0)}
                                @input=${(e) => {
                                    this._controlFormPosition = [this._controlFormPosition[0], this._roundToPrecision(Number(e.target.value))];
                                    this.requestUpdate();
                                }}>
                            </ha-textfield>
                        </div>
                    ` : ''}

                    <!-- Attachment Point - defines where on control the position refers to -->
                    <div style="margin-top: 12px; padding-top: 12px; border-top: 1px solid var(--divider-color);">
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
                            .label=${'Attachment Point'}
                            @value-changed=${(e) => this._controlFormAttachment = e.detail.value}>
                        </ha-selector>
                        <div style="font-size: 12px; color: var(--secondary-text-color); margin-top: 4px;">
                            Which point of the control the position refers to (e.g., 'center' means coordinates specify the control's center)
                        </div>
                    </div>
                </lcards-form-section>

                <lcards-form-section
                    header="Size"
                    description="Control dimensions in pixels"
                    icon="mdi:resize"
                    ?expanded=${true}>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
                        <ha-textfield
                            type="number"
                            label="Width"
                            .value=${String(this._controlFormSize[0] || 100)}
                            @input=${(e) => {
                                this._controlFormSize = [this._roundToPrecision(Number(e.target.value)), this._controlFormSize[1]];
                                this.requestUpdate();
                            }}>
                        </ha-textfield>
                        <ha-textfield
                            type="number"
                            label="Height"
                            .value=${String(this._controlFormSize[1] || 100)}
                            @input=${(e) => {
                                this._controlFormSize = [this._controlFormSize[0], this._roundToPrecision(Number(e.target.value))];
                                this.requestUpdate();
                            }}>
                        </ha-textfield>
                    </div>
                </lcards-form-section>

                <lcards-form-section
                    header="Routing Behavior"
                    description="Control how lines route around this overlay"
                    icon="mdi:vector-polyline-remove"
                    ?expanded=${false}>
                    <ha-formfield .label=${'Treat as obstacle for line routing'}>
                        <ha-switch
                            .checked=${this._controlFormObstacle === true}
                            @change=${(e) => {
                                this._controlFormObstacle = e.target.checked;
                                this.requestUpdate();
                            }}>
                        </ha-switch>
                    </ha-formfield>
                    <div style="font-size: 13px; color: var(--secondary-text-color); margin-top: 8px;">
                        When enabled, lines with route: auto will avoid this control overlay
                    </div>
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
        // Debug HA components state when rendering card form
        this._debugHAComponents();

        // Always use the dropdown + editor approach
        // The _haComponentsAvailable check was causing the dropdown to not appear
        return this._renderControlFormCardLegacy();
    }

    /**
     * Render Card subtab using HA native components
     * @returns {TemplateResult}
     * @private
     */
    _renderControlFormCardNative() {
        const cardType = this._controlFormCard?.type || '';
        const lovelace = this._getLovelace();

        // Ensure lovelace has required config.views structure for hui-card-picker
        if (lovelace && (!lovelace.config || !lovelace.config.views)) {
            lcardsLog.warn('[MSDStudio] Lovelace missing config.views, adding fallback structure');
            if (!lovelace.config) {
                lovelace.config = { views: [] };
            } else if (!lovelace.config.views) {
                lovelace.config.views = [];
            }
        }

        lcardsLog.trace('[MSDStudio] Rendering Card tab with HA native components', {
            cardType,
            hasLovelace: !!lovelace,
            hasConfig: !!lovelace?.config,
            hasViews: !!lovelace?.config?.views,
            viewsCount: lovelace?.config?.views?.length
        });

        return html`
            <div style="display: flex; flex-direction: column; gap: 16px;">
                ${!cardType ? html`
                    <!-- Card Picker Button (opens in editor context) -->
                    <lcards-form-section
                        header="Select Card Type"
                        description="Choose a card to display in this control overlay"
                        ?expanded=${true}>
                        <div class="card-picker-container" style="padding: 16px; text-align: center;">
                            <ha-button
                                raised
                                @click=${async () => {
                                    try {
                                        const cardConfig = await this._requestCardFromPicker('control');
                                        if (cardConfig) {
                                            this._controlFormCard = cardConfig;
                                            this._previousCardConfig = null;
                                            this.requestUpdate();
                                        }
                                    } catch (error) {
                                        lcardsLog.error('[MSDStudio] Card picker failed:', error);
                                    }
                                }}>
                                <ha-icon icon="mdi:card-plus" slot="start"></ha-icon>
                                Open Card Picker
                            </ha-button>
                            <div style="margin-top: 12px; font-size: 12px; color: var(--secondary-text-color);">
                                Opens card picker in a separate dialog
                            </div>
                        </div>
                    </lcards-form-section>
                ` : html`
                    <!-- Selected Card Info + Change Button -->
                    <div class="selected-card-info" style="display: flex; align-items: center; justify-content: space-between; padding: 12px 16px; background: var(--info-color, #03a9f4); color: white; border-radius: 8px; margin-bottom: 16px;">
                        <div style="display: flex; align-items: center; gap: 12px;">
                            <ha-icon icon="${this._getCardIcon(cardType)}" style="--mdc-icon-size: 28px; color: white;"></ha-icon>
                            <div>
                                <div style="font-weight: 600; font-size: 15px;">${this._getCardTypeName(cardType)}</div>
                                <div style="font-size: 12px; opacity: 0.9;">Card type selected</div>
                            </div>
                        </div>
                        <ha-button
                            @click=${this._resetCardPicker}
                            style="--mdc-theme-primary: white; --mdc-theme-on-primary: var(--info-color, #03a9f4);">
                            <ha-icon icon="mdi:swap-horizontal" slot="start"></ha-icon>
                            Change
                        </ha-button>
                    </div>

                    <!-- HA Native Card Configuration Editor -->
                    <lcards-form-section
                        header="Card Configuration"
                        description="Click to open the card editor in a separate modal dialog"
                        ?expanded=${true}>
                        <div class="card-editor-container" style="padding: 16px;">
                            <ha-button
                                raised
                                @click=${this._openCardEditorModal}
                                style="width: 100%;">
                                <ha-icon icon="mdi:pencil" slot="start"></ha-icon>
                                Open Card Editor
                            </ha-button>
                        </div>
                    </lcards-form-section>
                `}
            </div>
        `;
    }

    /**
     * Render Card subtab using Tier 2 implementation (dropdown + HA editor)
     * This is the reliable fallback when hui-card-picker is unavailable
     * @returns {TemplateResult}
     * @private
     */
    _renderControlFormCardLegacy() {
        const cardType = this._controlFormCard?.type || '';
        const lovelace = this._getLovelace();
        const cards = this._getAvailableCardTypes();

        lcardsLog.trace('[MSDStudio] Rendering Tier 2 Card tab (dropdown mode), cardType:', cardType);

        return html`
            <div style="display: flex; flex-direction: column; gap: 16px;">
                ${!cardType ? html`
                    <!-- Card Picker Button (opens in editor context) -->
                    <div style="padding: 16px; background: var(--card-background-color); border-radius: 8px; text-align: center;">
                        <div style="margin-bottom: 12px; font-weight: 500;">Quick Add Card</div>
                        <ha-button
                            raised
                            @click=${async () => {
                                try {
                                    const cardConfig = await this._requestCardFromPicker('control');
                                    if (cardConfig) {
                                        this._controlFormCard = cardConfig;
                                        this._previousCardConfig = null;
                                        lcardsLog.debug('[MSDStudio] Card selected:', cardConfig);
                                        this.requestUpdate();
                                    }
                                } catch (error) {
                                    lcardsLog.error('[MSDStudio] Card picker failed:', error);
                                }
                            }}>
                            <ha-icon icon="mdi:card-plus" slot="start"></ha-icon>
                            Open Card Picker
                        </ha-button>
                        <div style="margin-top: 8px; font-size: 12px; color: var(--secondary-text-color);">
                            Opens card picker in a separate dialog
                        </div>
                    </div>

                    <div style="text-align: center; color: var(--secondary-text-color); font-size: 12px; margin: -8px 0;">
                        — OR —
                    </div>

                    <!-- Enhanced Dropdown Card Selector -->
                    <lcards-form-section
                        header="Select Card Type"
                        description="Choose a card to display in this control overlay"
                        icon="mdi:card-search"
                        ?expanded=${true}>
                        <div style="padding: 16px;">
                            <ha-selector
                                .hass=${this.hass}
                                .selector=${{ select: { options: cards.map(card => ({ value: card.type, label: card.name, icon: card.icon })) }}}
                                .value=${cardType}
                                .label=${"Card Type"}
                                @keydown=${(e) => {
                                    // Prevent ESC from closing the entire dialog when dropdown is open
                                    if (e.key === 'Escape') {
                                        e.stopPropagation();
                                    }
                                }}
                                @value-changed=${(e) => {
                                    const selectedType = e.detail.value;
                                    if (selectedType) {
                                        this._selectCardType(selectedType);
                                    }
                                }}>
                            </ha-selector>

                            <!-- Cancel button if we had a previous card -->
                            ${this._previousCardConfig ? html`
                                <div style="margin-top: 12px;">
                                    <ha-button
                                        @click=${this._cancelCardTypeChange}
                                        style="width: 100%;">
                                        <ha-icon icon="mdi:undo" slot="start"></ha-icon>
                                        Cancel - Keep Current Card
                                    </ha-button>
                                </div>
                            ` : ''}
                        </div>
                    </lcards-form-section>
                ` : html`
                    <!-- Selected Card Info + Change Button -->
                    <div class="selected-card-info" style="display: flex; align-items: center; justify-content: space-between; padding: 12px 16px; background: var(--info-color, #03a9f4); color: white; border-radius: 8px; margin-bottom: 16px;">
                        <div style="display: flex; align-items: center; gap: 12px;">
                            <ha-icon icon="${this._getCardIcon(cardType)}" style="--mdc-icon-size: 28px; color: white;"></ha-icon>
                            <div>
                                <div style="font-weight: 600; font-size: 15px;">${this._getCardTypeName(cardType)}</div>
                                <div style="font-size: 12px; opacity: 0.9;">Card type selected</div>
                            </div>
                        </div>
                        <ha-button
                            @click=${() => {
                                // Save current card config before changing
                                this._previousCardConfig = { ...this._controlFormCard };
                                this._controlFormCard = { type: '' };
                                this.requestUpdate();
                            }}
                            style="--mdc-theme-primary: white; --mdc-theme-on-primary: var(--info-color, #03a9f4);">
                            <ha-icon icon="mdi:swap-horizontal" slot="start"></ha-icon>
                            Change
                        </ha-button>
                    </div>

                    <!-- HA Native Card Configuration Editor (same as Tier 1) -->
                    <lcards-form-section
                        header="Card Configuration"
                        description="Configure the card using graphical editor or view YAML"
                        icon="mdi:cog"
                        ?expanded=${true}>

                        <div class="card-editor-container" style="padding: 16px;">
                            ${this._cardConfigMode === 'yaml' ? html`
                                <!-- YAML Editor with Show Code toggle -->
                                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                                    <div style="font-weight: 500;">YAML Configuration</div>
                                    <ha-button
                                        @click=${() => {
                                            this._cardConfigMode = 'graphical';
                                            this.requestUpdate();
                                        }}>
                                        <ha-icon icon="mdi:form-select" slot="start"></ha-icon>
                                        Switch to Editor
                                    </ha-button>
                                </div>
                                <ha-yaml-editor
                                    .hass=${this.hass}
                                    .defaultValue=${this._controlFormCard}
                                    @value-changed=${(e) => {
                                        if (e.detail.isValid) {
                                            this._controlFormCard = e.detail.value;
                                            this.requestUpdate();
                                        }
                                    }}>
                                </ha-yaml-editor>
                            ` : lovelace && customElements.get('hui-card-element-editor') ? html`
                                <!-- Graphical Editor (Modal) -->
                                <ha-button
                                    raised
                                    @click=${this._openCardEditorModal}
                                    style="width: 100%; margin-bottom: 12px;">
                                    <ha-icon icon="mdi:pencil" slot="start"></ha-icon>
                                    Open Card Editor
                                </ha-button>

                                <!-- Show Code toggle button (like HA dialogs) -->
                                <ha-button
                                    @click=${() => {
                                        this._cardConfigMode = 'yaml';
                                        this.requestUpdate();
                                    }}
                                    style="width: 100%;">
                                    <ha-icon icon="mdi:code-braces" slot="start"></ha-icon>
                                    Show Code
                                </ha-button>
                            ` : html`
                                <!-- Fallback: Basic UI Editor -->
                                <lcards-message type="warning">
                                    Graphical editor unavailable. Using YAML mode.
                                </lcards-message>
                                <ha-yaml-editor
                                    .hass=${this.hass}
                                    .defaultValue=${this._controlFormCard}
                                    @value-changed=${(e) => {
                                        if (e.detail.isValid) {
                                            this._controlFormCard = e.detail.value;
                                            this.requestUpdate();
                                        }
                                    }}>
                                </ha-yaml-editor>
                            `}
                        </div>
                    </lcards-form-section>
                `}
            </div>
        `;
    }

    /**
     * Render Preview subtab
     * @returns {TemplateResult}
     * @private
     */
    _renderControlFormPreview() {
        const card = this._controlFormCard || {};

        if (!card.type) {
            return html`
                <div class="control-preview-panel" style="display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 40px; text-align: center;">
                    <ha-icon icon="mdi:card-outline" style="--mdc-icon-size: 64px; color: var(--disabled-text-color); opacity: 0.3;"></ha-icon>
                    <div style="margin-top: 16px; color: var(--secondary-text-color);">
                        <strong>No Card Selected</strong>
                    </div>
                    <div style="margin-top: 8px; font-size: 14px; color: var(--disabled-text-color);">
                        Select a card type in the "Card" tab to see live preview
                    </div>
                </div>
            `;
        }

        try {
            // Create preview container
            const previewId = `card-preview-${Date.now()}`;

            // Defer card creation until after render
            setTimeout(() => this._createPreviewCardInTab(previewId, card), 0);

            return html`
                <div class="control-preview-panel" style="display: flex; flex-direction: column; gap: 16px; padding: 16px;">
                    <!-- Preview Header -->
                    <div class="preview-header" style="display: flex; align-items: center; justify-content: space-between; padding-bottom: 12px; border-bottom: 1px solid var(--divider-color);">
                        <div style="display: flex; align-items: center; gap: 12px;">
                            <ha-icon icon="${this._getCardIcon(card.type)}" style="--mdc-icon-size: 24px; color: var(--primary-color);"></ha-icon>
                            <div>
                                <div style="font-weight: 600; font-size: 14px;">${this._getCardTypeName(card.type)}</div>
                                <div style="font-size: 12px; color: var(--secondary-text-color);">Live Preview</div>
                            </div>
                        </div>
                        <ha-chip>
                            <ha-icon icon="mdi:eye" slot="start"></ha-icon>
                            Real-time
                        </ha-chip>
                    </div>

                    <!-- Preview Card Wrapper -->
                    <div class="preview-card-wrapper" style="
                        flex: 1;
                        background: var(--card-background-color);
                        border: 2px solid var(--divider-color);
                        border-radius: 12px;
                        padding: 20px;
                        min-height: 200px;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        overflow: auto;
                    ">
                        <div id="${previewId}" style="width: 100%; max-width: 500px;"></div>
                    </div>
                </div>
            `;
        } catch (error) {
            lcardsLog.error('[MSDStudio] Preview render error:', error);
            return html`
                <lcards-message type="error">
                    Failed to render preview: ${error.message}
                </lcards-message>
            `;
        }
    }

    /**
     * Create and mount preview card in Preview tab
     * @param {string} containerId - Container element ID
     * @param {Object} cardConfig - Card configuration
     * @private
     */
    async _createPreviewCardInTab(containerId, cardConfig) {
        const container = this.shadowRoot?.getElementById(containerId);
        if (!container) {
            lcardsLog.trace('[MSDStudio] Preview container not found:', containerId);
            return;
        }

        // Clear existing content
        container.innerHTML = '';

        try {
            const cardType = cardConfig.type;
            const normalizedType = this._normalizeCardType(cardType);

            lcardsLog.trace('[MSDStudio] Creating preview card in tab:', { cardType, normalizedType });

            let cardElement = null;

            // Try to create the card element
            if (customElements.get(normalizedType)) {
                cardElement = document.createElement(normalizedType);
                lcardsLog.trace('[MSDStudio] Preview card created via createElement:', normalizedType);
            } else {
                // Card might not be registered yet
                container.innerHTML = '<div style="padding: 20px; text-align: center; color: var(--secondary-text-color);">Loading card...</div>';

                // Wait for registration
                await new Promise(resolve => setTimeout(resolve, 500));

                if (customElements.get(normalizedType)) {
                    cardElement = document.createElement(normalizedType);
                } else {
                    throw new Error(`Card type "${cardType}" not registered`);
                }
            }

            if (!cardElement) {
                throw new Error(`Failed to create card element for type: ${cardType}`);
            }

            // Set HASS context first
            if (this.hass) {
                cardElement.hass = this.hass;
            }

            // Set card configuration
            if (typeof cardElement.setConfig === 'function') {
                cardElement.setConfig(cardConfig);
                lcardsLog.trace('[MSDStudio] Preview card config set successfully');
            } else {
                lcardsLog.warn('[MSDStudio] Preview card has no setConfig method:', normalizedType);
                container.innerHTML = '<div style="padding: 20px; text-align: center; color: var(--warning-color);">Card does not support configuration</div>';
                return;
            }

            // Apply sizing styles
            cardElement.style.width = '100%';
            cardElement.style.display = 'block';

            // Mount the card
            container.innerHTML = '';
            container.appendChild(cardElement);
            lcardsLog.trace('[MSDStudio] Preview card mounted successfully in tab');

        } catch (error) {
            lcardsLog.error('[MSDStudio] Failed to create preview card in tab:', error);
            container.innerHTML = `<div style="padding: 20px; text-align: center; color: var(--error-color);">
                <ha-icon icon="mdi:alert-circle" style="--mdc-icon-size: 32px; display: block; margin: 0 auto 8px;"></ha-icon>
                <strong>Preview Error</strong><br/>
                <span style="font-size: 12px;">${error.message}</span>
            </div>`;
        }
    }

    /**
     * Get available card types from HA registry
     * @returns {Array} Array of card type objects
     * @private
     */
    _getAvailableCardTypes() {
        const cards = [];

        // Standard HA cards - comprehensive list matching HA's native picker
        const standardCards = [
            // Most Common
            { type: 'entities', name: 'Entities', icon: 'mdi:format-list-bulleted' },
            { type: 'button', name: 'Button', icon: 'mdi:gesture-tap-button' },
            { type: 'entity', name: 'Entity', icon: 'mdi:card-bulleted' },
            { type: 'glance', name: 'Glance', icon: 'mdi:view-dashboard' },
            { type: 'light', name: 'Light', icon: 'mdi:lightbulb' },
            { type: 'thermostat', name: 'Thermostat', icon: 'mdi:thermostat' },
            { type: 'sensor', name: 'Sensor', icon: 'mdi:eye' },
            { type: 'gauge', name: 'Gauge', icon: 'mdi:gauge' },
            { type: 'markdown', name: 'Markdown', icon: 'mdi:language-markdown' },

            // Media & Weather
            { type: 'media-control', name: 'Media Control', icon: 'mdi:play-circle' },
            { type: 'weather-forecast', name: 'Weather', icon: 'mdi:weather-partly-cloudy' },

            // History & Charts
            { type: 'history-graph', name: 'History Graph', icon: 'mdi:chart-line' },
            { type: 'statistics-graph', name: 'Statistics Graph', icon: 'mdi:chart-box' },

            // Pictures
            { type: 'picture', name: 'Picture', icon: 'mdi:image' },
            { type: 'picture-entity', name: 'Picture Entity', icon: 'mdi:image-frame' },
            { type: 'picture-glance', name: 'Picture Glance', icon: 'mdi:view-carousel' },

            // Layout & Organization
            { type: 'grid', name: 'Grid', icon: 'mdi:grid' },
            { type: 'horizontal-stack', name: 'Horizontal Stack', icon: 'mdi:view-column' },
            { type: 'vertical-stack', name: 'Vertical Stack', icon: 'mdi:view-sequential' },

            // Utility
            { type: 'conditional', name: 'Conditional', icon: 'mdi:eye-check' },
            { type: 'iframe', name: 'iFrame', icon: 'mdi:application-brackets' },
            { type: 'map', name: 'Map', icon: 'mdi:map' },
            { type: 'logbook', name: 'Logbook', icon: 'mdi:format-list-text' },
            { type: 'humidifier', name: 'Humidifier', icon: 'mdi:air-humidifier' },
            { type: 'alarm-panel', name: 'Alarm Panel', icon: 'mdi:shield-home' },
            { type: 'area', name: 'Area', icon: 'mdi:texture-box' },
            { type: 'tile', name: 'Tile', icon: 'mdi:view-dashboard-variant' },

            // Manual Card Entry
            { type: 'manual', name: 'Manual (YAML)', icon: 'mdi:code-braces' }
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
     * Initialize card picker with proper DOM structure
     * @private
     */
    /**
     * Handle card type selection
     * @param {string} cardType - Selected card type
     * @private
     */
    _selectCardType(cardType) {
        lcardsLog.debug('[MSDStudio] Card type selected:', cardType);

        // Handle manual card type - start with basic YAML template
        if (cardType === 'manual') {
            this._controlFormCard = {
                type: '',
                // User will fill in the rest
            };
            // Force YAML mode for manual entry
            this._cardConfigMode = 'yaml';
            this.requestUpdate();
            return;
        }

        // Ensure custom cards have the custom: prefix
        const normalizedType = this._normalizeCardTypeForConfig(cardType);

        // Try to get stub config from the card's static method
        const stubConfig = this._getCardStubConfig(normalizedType);
        this._controlFormCard = stubConfig;

        // Clear previous config since we selected a new card
        this._previousCardConfig = null;

        this.requestUpdate();
    }

    /**
     * Cancel card type change and restore previous card config
     * @private
     */
    _cancelCardTypeChange() {
        if (this._previousCardConfig) {
            lcardsLog.debug('[MSDStudio] Restoring previous card config:', this._previousCardConfig);
            this._controlFormCard = { ...this._previousCardConfig };
            this._previousCardConfig = null;
            this.requestUpdate();
        }
    }

    /**
     * Normalize card type for configuration (add custom: prefix if needed)
     * @param {string} cardType - Raw card type
     * @returns {string} Normalized type
     * @private
     */
    _normalizeCardTypeForConfig(cardType) {
        // Special case: manual entry
        if (cardType === 'manual') {
            return cardType;
        }

        // If it's already prefixed, return as-is
        if (cardType.startsWith('custom:')) {
            return cardType;
        }

        // Standard HA cards with hyphens
        const standardCards = [
            'picture-entity', 'picture-glance', 'weather-forecast',
            'media-control', 'history-graph', 'statistics-graph',
            'horizontal-stack', 'vertical-stack', 'alarm-panel'
        ];

        // If it contains a hyphen and isn't a standard HA card, it's likely custom
        if (cardType.includes('-') && !standardCards.includes(cardType)) {
            return `custom:${cardType}`;
        }

        return cardType;
    }

    /**
     * Get stub config from card's getStubConfig method
     * @param {string} cardType - Card type (with custom: prefix if applicable)
     * @returns {Object} Stub configuration
     * @private
     */
    _getCardStubConfig(cardType) {
        try {
            // Get element name (remove custom: prefix for element lookup)
            const elementName = cardType.startsWith('custom:')
                ? cardType.substring(7)
                : `hui-${cardType}-card`;

            // Try to get the custom element
            const CardClass = window.customElements?.get(elementName);

            if (CardClass && typeof CardClass.getStubConfig === 'function') {
                return CardClass.getStubConfig();
            }
        } catch (error) {
            // Suppress - many cards don't have stub configs
        }

        // Fallback: just return type
        return { type: cardType };
    }

    /**
     * Handle card picked from hui-card-picker
     * @param {CustomEvent} e - config-changed event from picker
     * @private
     */
    _handleCardPicked(e) {
        e.stopPropagation();
        lcardsLog.debug('[MSDStudio] Card picked from hui-card-picker:', e.detail);

        if (!e.detail?.config?.type) {
            lcardsLog.warn('[MSDStudio] Invalid card picked:', e.detail);
            return;
        }

        const pickedCard = e.detail.config;

        // Try to get enhanced stub config from the card class
        const stubConfig = this._getEnhancedStubConfig(pickedCard);
        this._controlFormCard = stubConfig;

        // Clear previous config since we selected a new card
        this._previousCardConfig = null;

        lcardsLog.debug('[MSDStudio] Card set to:', this._controlFormCard);
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
     * Handle card picked from hui-card-picker
     * @param {CustomEvent} e - Config changed event from hui-card-picker
     * @private
     */
    _handleCardPicked(e) {
        lcardsLog.debug('[MSDStudio] Card picked:', e.detail);
        const pickedCard = e.detail.config;

        if (!pickedCard || !pickedCard.type) {
            lcardsLog.warn('[MSDStudio] Invalid card picked:', pickedCard);
            return;
        }

        // Try to get enhanced stub config from the card class
        const stubConfig = this._getEnhancedStubConfig(pickedCard);
        this._controlFormCard = stubConfig;

        lcardsLog.debug('[MSDStudio] Card set to:', this._controlFormCard);
        this.requestUpdate();
    }

    /**
     * Request card from picker via editor context (event-based proxy)
     * @param {string} context - Context for the request ('control', 'line', etc.)
     * @returns {Promise<Object>} Resolves with card config when picked
     * @private
     */
    async _requestCardFromPicker(context = 'control') {
        return new Promise((resolve, reject) => {
            const requestId = ++this._cardPickerRequestId;

            // Store resolver for this request
            this._pendingCardPickerRequests.set(requestId, { resolve, reject, context });

            lcardsLog.debug('[MSDStudio] Requesting card picker:', { requestId, context });

            // Dispatch event to editor (composed: true crosses shadow DOM)
            const event = new CustomEvent('open-card-picker', {
                bubbles: true,
                composed: true,
                detail: { requestId, context }
            });

            this.dispatchEvent(event);

            // Timeout after 60 seconds
            setTimeout(() => {
                if (this._pendingCardPickerRequests.has(requestId)) {
                    this._pendingCardPickerRequests.delete(requestId);
                    reject(new Error('Card picker request timed out'));
                }
            }, 60000);
        });
    }

    /**
     * Handle card picker result from editor (event proxy)
     * @param {CustomEvent} e - card-picker-result event from editor
     * @private
     */
    _handleCardPickerResult(e) {
        const { requestId, context, config } = e.detail;

        lcardsLog.debug('[MSDStudio] Card picker result received:', { requestId, context, type: config?.type });

        const pending = this._pendingCardPickerRequests.get(requestId);
        if (pending) {
            this._pendingCardPickerRequests.delete(requestId);

            // Enhance stub config and resolve
            const enhancedConfig = this._getEnhancedStubConfig(config);
            pending.resolve(enhancedConfig);
        } else {
            lcardsLog.warn('[MSDStudio] Received result for unknown requestId:', requestId);
        }
    }

    /**
     * Get enhanced stub config for picked card
     * @param {Object} pickedCard - Card config from hui-card-picker
     * @returns {Object} Enhanced stub configuration
     * @private
     */
    _getEnhancedStubConfig(pickedCard) {
        try {
            const cardType = pickedCard.type;

            // Get element name
            const elementName = cardType.startsWith('custom:')
                ? cardType.substring(7)
                : `hui-${cardType}-card`;

            // Try to get the card class and its stub config
            const CardClass = customElements.get(elementName);

            if (CardClass && typeof CardClass.getStubConfig === 'function') {
                const stub = CardClass.getStubConfig();
                lcardsLog.debug('[MSDStudio] Using card stub config from:', elementName, stub);
                // Merge picked config with stub (picked takes precedence)
                return { ...stub, ...pickedCard };
            }
        } catch (error) {
            lcardsLog.warn('[MSDStudio] Failed to get stub config:', error);
        }

        // Fallback to picked card config
        return pickedCard;
    }

    /**
     * Reset card picker (clears selected card)
     * @private
     */
    _resetCardPicker() {
        this._controlFormCard = { type: '' };
        this.requestUpdate();
    }

    /**
     * Get card type display name
     * @param {string} type - Card type
     * @returns {string} Pretty card name
     * @private
     */
    _getCardTypeName(type) {
        if (!type) return 'Unknown';

        // Remove custom: prefix for display
        const cleanType = type.replace(/^custom:/, '');

        // Convert kebab-case to Title Case
        return cleanType
            .split('-')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    }

    /**
     * Get card type icon
     * @param {string} type - Card type
     * @returns {string} MDI icon name
     * @private
     */
    _getCardIcon(type) {
        if (!type) return 'mdi:card-outline';

        // Icon mapping for common card types
        const iconMap = {
            'button': 'mdi:gesture-tap-button',
            'entities': 'mdi:format-list-bulleted',
            'entity': 'mdi:card-bulleted',
            'glance': 'mdi:view-dashboard',
            'light': 'mdi:lightbulb',
            'thermostat': 'mdi:thermostat',
            'media-control': 'mdi:play-circle',
            'weather-forecast': 'mdi:weather-partly-cloudy',
            'sensor': 'mdi:eye',
            'gauge': 'mdi:gauge',
            'history-graph': 'mdi:chart-line',
            'markdown': 'mdi:language-markdown',
            'picture': 'mdi:image',
            'picture-entity': 'mdi:image-frame',
            'picture-glance': 'mdi:view-carousel',
            'conditional': 'mdi:eye-check',
            'map': 'mdi:map',
            'custom:lcards-button': 'mdi:gesture-tap-button',
            'custom:lcards-gauge': 'mdi:gauge',
            'custom:lcards-slider': 'mdi:tune',
            'custom:lcards-label': 'mdi:label',
            'custom:lcards-chart': 'mdi:chart-line'
        };

        const cleanType = type.replace(/^custom:/, '');
        return iconMap[type] || iconMap[cleanType] || 'mdi:puzzle';
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
     * DEPRECATED: Force-loading attempts
     *
     * This method attempted multiple strategies to force-load hui-card-picker:
     * 1. horizontal-stack.getConfigElement() - didn't trigger picker load
     * 2. Direct import from hardcoded paths - paths don't exist in HA's webpack build
     * 3. show-dialog event with hui-dialog-edit-card - wrong dialog type
     * 4. show-dialog event with hui-dialog-create-card - dialogImport contract unclear
     * 5. Direct createElement('hui-dialog-create-card') - element not pre-registered
     *
     * CONCLUSION: hui-card-picker is ONLY loaded when user clicks "Add Card" in HA's UI.
     * We cannot programmatically trigger HA's lazy-load without the actual webpack chunk path.
     *
     * The Tier 2 experience (dropdown + graphical editor) is the reliable fallback.
     * @returns {Promise<boolean>} Always returns false
     * @private
     */
    async _forceLoadHAComponents() {
        lcardsLog.debug('[MSDStudio] Force-loading disabled - using Tier 2 mode');
        return false;
    }

    /**
     * Alternative: Force-load by creating temporary grid card editor
     * @returns {Promise<boolean>}
     * @private
     */
    async _forceLoadViaGridCard() {
        lcardsLog.debug('[MSDStudio] Strategy 2: Force-load via grid-card editor...');

        try {
            // Check if already loaded
            const HuiCardPicker = customElements.get('hui-card-picker');
            if (HuiCardPicker) {
                lcardsLog.debug('[MSDStudio] hui-card-picker already available');
                return true;
            }

            // Check if hui-dialog-edit-card is available
            const HuiDialogEditCard = customElements.get('hui-dialog-edit-card');
            if (!HuiDialogEditCard) {
                lcardsLog.warn('[MSDStudio] hui-dialog-edit-card not available, cannot force-load');
                return false;
            }

            // Create temporary hidden dialog
            const tempDialog = document.createElement('hui-dialog-edit-card');
            tempDialog.style.display = 'none';
            tempDialog.style.visibility = 'hidden';
            tempDialog.style.position = 'fixed';
            tempDialog.style.top = '-9999px';

            // Append to body (required for HA to initialize it)
            document.body.appendChild(tempDialog);

            // Set minimal config to trigger internal component loading
            tempDialog.hass = this.hass;
            tempDialog.lovelaceConfig = this._getLovelace()?.config || {};

            // Create stub card config to pass to dialog
            const stubCardConfig = { type: 'button' };

            // Call dialog's internal methods to trigger component loading
            // Note: This may trigger errors in console, but that's OK - we just need registration
            try {
                if (tempDialog.showDialog) {
                    tempDialog.showDialog({ cardConfig: stubCardConfig });
                }
            } catch (e) {
                // Expected to fail - we don't have proper params
                // But it should have triggered component loading
                lcardsLog.debug('[MSDStudio] Dialog open failed (expected):', e.message);
            }

            // Wait a tick for component registration to complete
            await new Promise(resolve => setTimeout(resolve, 100));

            // Clean up - remove dialog
            if (tempDialog.closeDialog) {
                try {
                    tempDialog.closeDialog();
                } catch (e) {
                    // Ignore cleanup errors
                }
            }
            document.body.removeChild(tempDialog);

            // Wait for component definition
            try {
                await Promise.race([
                    customElements.whenDefined('hui-card-picker'),
                    new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 2000))
                ]);
            } catch (e) {
                lcardsLog.warn('[MSDStudio] hui-card-picker not defined after force-load attempt');
                return false;
            }

            // Verify components are now available
            const pickerNow = customElements.get('hui-card-picker');
            const editorNow = customElements.get('hui-card-element-editor');

            if (pickerNow && editorNow) {
                lcardsLog.debug('[MSDStudio] ✅ Successfully force-loaded HA components');
                return true;
            } else {
                lcardsLog.warn('[MSDStudio] Force-load partially succeeded:', {
                    picker: !!pickerNow,
                    editor: !!editorNow
                });
                return false;
            }

        } catch (error) {
            lcardsLog.error('[MSDStudio] Force-load failed:', error);
            return false;
        }
    }

    /**
     * Alternative: Force-load by creating temporary grid card editor
     * @returns {Promise<boolean>}
     * @private
     */
    async _forceLoadViaGridCard() {
        // Deprecated - direct import strategy in _ensureHAComponentsLoaded handles this now
        return false;
    }

    /**
     * Get Lovelace instance for hui components with robust fallbacks
     * Tries multiple access paths to find HA's Lovelace instance
     * @returns {Object|null} Lovelace instance
     * @private
     */
    _getLovelace() {
        // Try accessing from hass object first (most reliable)
        if (this.hass?.connection?.lovelace) {
            lcardsLog.debug('[MSDStudio] Got Lovelace from hass.connection');
            return this.hass.connection.lovelace;
        }

        // Try from home-assistant element
        const homeAssistant = document.querySelector('home-assistant');
        if (homeAssistant) {
            // Try ha-panel-lovelace
            const panel = homeAssistant.shadowRoot
                ?.querySelector('home-assistant-main')
                ?.shadowRoot?.querySelector('ha-panel-lovelace');

            if (panel?.lovelace) {
                lcardsLog.debug('[MSDStudio] Got Lovelace from ha-panel-lovelace');
                return panel.lovelace;
            }

            // Try direct lovelace property
            if (homeAssistant.lovelace) {
                lcardsLog.debug('[MSDStudio] Got Lovelace from home-assistant element');
                return homeAssistant.lovelace;
            }
        }

        // Last resort: try window.lovelace (deprecated but may exist)
        if (window.lovelace) {
            lcardsLog.warn('[MSDStudio] Using deprecated window.lovelace');
            return window.lovelace;
        }

        // Fallback to _getRealLovelace() implementation
        const realLovelace = this._getRealLovelace();
        if (realLovelace) {
            lcardsLog.debug('[MSDStudio] Got Lovelace from _getRealLovelace()');
            return realLovelace;
        }

        lcardsLog.error('[MSDStudio] Could not access Lovelace instance');
        return null;
    }

    /**
     * Open card editor in a modal dialog on top of MSD Studio
     * This avoids z-index issues and provides better editing experience
     * @private
     */
    _openCardEditorModal() {
        // Create dialog element
        const dialog = document.createElement('ha-dialog');
        dialog.heading = 'Edit Card Configuration';
        dialog.scrimClickAction = 'close';

        // Style the dialog to be large enough for editors
        dialog.style.setProperty('--mdc-dialog-min-width', '600px');
        dialog.style.setProperty('--mdc-dialog-max-width', '90vw');

        // Create container for editor
        const container = document.createElement('div');
        container.style.padding = '24px';
        container.style.minHeight = '400px';

        // Create the card editor
        const lovelace = this._getLovelace();
        const editor = document.createElement('hui-card-element-editor');
        editor.hass = this.hass;
        editor.lovelace = lovelace;

        // Deep copy initial config
        const initialConfig = JSON.parse(JSON.stringify(this._controlFormCard));

        // hui-card-element-editor uses .value property for config
        editor.value = initialConfig;

        // Track config changes - initialize with current config
        let tempConfig = initialConfig;

        lcardsLog.debug('[MSDStudio] Opening card editor with config:', initialConfig);

        // Listen for config-changed event (HA standard)
        editor.addEventListener('config-changed', (e) => {
            lcardsLog.trace('[MSDStudio] config-changed event:', e.detail);
            if (e.detail && e.detail.config) {
                const newValue = e.detail.config;
                if (typeof newValue === 'object' && !Array.isArray(newValue) && newValue.type) {
                    tempConfig = newValue;
                    lcardsLog.trace('[MSDStudio] Card config updated:', tempConfig);
                } else {
                    lcardsLog.warn('[MSDStudio] Ignoring invalid config from config-changed:', newValue);
                }
            }
        });

        // Also listen for value-changed as fallback
        editor.addEventListener('value-changed', (e) => {
            lcardsLog.trace('[MSDStudio] value-changed event:', e.detail);

            if (e.detail && e.detail.value) {
                const newValue = e.detail.value;

                // Defensive check - ensure we have a proper object with a type property
                if (typeof newValue === 'object' && !Array.isArray(newValue) && newValue.type) {
                    tempConfig = newValue;
                    lcardsLog.trace('[MSDStudio] Card editor config updated from value-changed:', tempConfig);
                } else {
                    lcardsLog.warn('[MSDStudio] Ignoring invalid card config from value-changed:', newValue);
                }
            }
        });

        container.appendChild(editor);
        dialog.appendChild(container);

        // Add action buttons
        const actionsDiv = document.createElement('div');
        actionsDiv.slot = 'primaryAction';

        const saveButton = document.createElement('ha-button');
        saveButton.textContent = 'Save';
        saveButton.addEventListener('click', () => {
            lcardsLog.debug('[MSDStudio] Saving card config from modal:', tempConfig);

            // Ensure we have a valid config with type
            if (!tempConfig || !tempConfig.type) {
                lcardsLog.error('[MSDStudio] Invalid card config - missing type:', tempConfig);
                // Try to preserve the type from original config
                if (this._controlFormCard?.type) {
                    tempConfig = { ...tempConfig, type: this._controlFormCard.type };
                }
            }

            // Deep clone to avoid reference issues
            this._controlFormCard = JSON.parse(JSON.stringify(tempConfig));
            lcardsLog.debug('[MSDStudio] Card config saved:', this._controlFormCard);

            this.requestUpdate();
            dialog.close();
        });

        const cancelButton = document.createElement('ha-button');
        cancelButton.setAttribute('dialogAction', 'cancel');
        cancelButton.textContent = 'Cancel';

        actionsDiv.appendChild(cancelButton);
        actionsDiv.appendChild(saveButton);
        dialog.appendChild(actionsDiv);

        // Cleanup when dialog closes
        dialog.addEventListener('closed', () => {
            dialog.remove();
        });

        // Add to DOM and open
        document.body.appendChild(dialog);

        // Small delay to ensure dialog is ready
        setTimeout(() => {
            dialog.open = true;
        }, 10);

        lcardsLog.debug('[MSDStudio] Opened card editor modal');
    }

    /**
     * Debug HA component state
     * @private
     */
    _debugHAComponents() {
        const HuiCardPicker = customElements.get('hui-card-picker');
        const HuiCardElementEditor = customElements.get('hui-card-element-editor');
        const lovelace = this._getLovelace();

        lcardsLog.debug('[MSDStudio] HA Component State:', {
            haComponentsAvailable: this._haComponentsAvailable,
            HuiCardPicker: !!HuiCardPicker,
            HuiCardElementEditor: !!HuiCardElementEditor,
            lovelace: !!lovelace,
            lovelaceConfig: lovelace?.config ? 'present' : 'missing',
            lovelaceResources: lovelace?.config?.resources?.length || 0,
            hass: !!this.hass,
            hassStates: Object.keys(this.hass?.states || {}).length
        });

        if (!lovelace) {
            lcardsLog.error('[MSDStudio] Lovelace not accessible - tried:');
            lcardsLog.error('  - hass.connection.lovelace');
            lcardsLog.error('  - ha-panel-lovelace.lovelace');
            lcardsLog.error('  - home-assistant.lovelace');
            lcardsLog.error('  - window.lovelace');
            lcardsLog.error('  - _getRealLovelace()');
        }
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

                <!-- Card Preview -->
                ${cardType && cardType !== 'none' ? html`
                    <div style="padding: 20px; background: #0a0a0a; border-radius: 8px; border: 1px solid #333;">
                        <div style="font-size: 12px; font-weight: 500; margin-bottom: 12px; color: #999;">Card Preview</div>
                        <div style="display: flex; justify-content: center; align-items: center; min-height: ${size[1] + 20}px; background: #000; border-radius: 4px; padding: 10px;">
                            <div style="width: ${size[0]}px; height: ${size[1]}px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.4);">
                                ${this._renderControlCardPreview()}
                            </div>
                        </div>
                    </div>
                ` : html`
                    <div style="padding: 20px; text-align: center; color: var(--secondary-text-color);">
                        <ha-icon icon="mdi:card-outline" style="font-size: 48px; opacity: 0.3;"></ha-icon>
                        <div style="margin-top: 8px;">Select a card type to preview</div>
                    </div>
                `}
            </div>
        `;
    }

    /**
     * Render live card preview
     * Creates an actual card element from the control configuration
     * @returns {TemplateResult}
     * @private
     */
    _renderControlCardPreview() {
        const cardConfig = { ...this._controlFormCard };

        if (!cardConfig.type) {
            return html`<div style="display: flex; align-items: center; justify-content: center; height: 100%; color: var(--secondary-text-color); font-size: 12px;">No card type selected</div>`;
        }

        // Use a stable ID
        const previewId = 'control-card-preview-container';

        // Schedule card creation/update after render
        // Use a unique key based on config to force recreation when config changes
        const configKey = JSON.stringify(cardConfig);
        if (this._lastPreviewConfigKey !== configKey) {
            this._lastPreviewConfigKey = configKey;
            requestAnimationFrame(() => {
                this._createPreviewCard(previewId, cardConfig);
            });
        }

        return html`
            <div id="${previewId}" style="width: 100%; height: 100%;"></div>
        `;
    }

    /**
     * Create and mount the preview card element
     * @param {string} containerId - Container element ID
     * @param {Object} cardConfig - Card configuration
     * @private
     */
    async _createPreviewCard(containerId, cardConfig) {
        const container = this.shadowRoot?.getElementById(containerId);
        if (!container) {
            lcardsLog.warn('[MSD Studio] Preview container not found:', containerId);
            return;
        }

        // Clear existing content
        container.innerHTML = '';

        try {
            const cardType = cardConfig.type;
            const normalizedType = this._normalizeCardType(cardType);

            lcardsLog.debug('[MSD Studio] Creating preview card:', { cardType, normalizedType });

            let cardElement = null;

            // Try to create the card element
            if (window.customElements && window.customElements.get(normalizedType)) {
                const CardClass = window.customElements.get(normalizedType);
                cardElement = new CardClass();
                lcardsLog.debug('[MSD Studio] Card created via customElements.get:', normalizedType);
            } else {
                cardElement = document.createElement(normalizedType);
                lcardsLog.debug('[MSD Studio] Card created via createElement:', normalizedType);

                // Wait briefly for custom element to upgrade
                await new Promise(resolve => setTimeout(resolve, 100));
            }

            if (!cardElement) {
                throw new Error(`Failed to create card element for type: ${cardType}`);
            }

            // Set HASS context first
            if (this.hass) {
                cardElement.hass = this.hass;
            }

            // Set card configuration
            if (typeof cardElement.setConfig === 'function') {
                cardElement.setConfig(cardConfig);
                lcardsLog.debug('[MSD Studio] Card config set successfully');
            } else {
                lcardsLog.warn('[MSD Studio] Card element has no setConfig method:', normalizedType);
                container.innerHTML = '<div style="padding: 8px; color: var(--error-color); font-size: 11px;">Card does not support configuration</div>';
                return;
            }

            // Apply sizing styles
            cardElement.style.width = '100%';
            cardElement.style.height = '100%';
            cardElement.style.display = 'block';

            // Mount the card
            container.appendChild(cardElement);
            lcardsLog.debug('[MSD Studio] Card preview mounted successfully');

        } catch (error) {
            lcardsLog.error('[MSD Studio] Failed to create card preview:', error);
            container.innerHTML = `<div style="padding: 8px; color: var(--error-color); font-size: 11px;">Error: ${error.message}</div>`;
        }
    }

    /**
     * Normalize card type to element name
     * @param {string} cardType - Card type from config
     * @returns {string} Element tag name
     * @private
     */
    _normalizeCardType(cardType) {
        if (!cardType) return '';

        // Handle custom:prefix
        if (cardType.startsWith('custom:')) {
            return cardType.substring(7);
        }

        // Handle HA built-in cards
        if (!cardType.includes('-')) {
            return `hui-${cardType}-card`;
        }

        return cardType;
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
                <!-- Line Actions & Visualization Helpers -->
                <div style="display: flex; gap: 8px; margin-bottom: 16px; align-items: center;">
                    <ha-button @click=${this._openLineForm}>
                        <ha-icon icon="mdi:plus" slot="start"></ha-icon>
                        Add Line
                    </ha-button>
                    <ha-button @click=${async (e) => { e.stopPropagation(); await this._setMode('connect_line'); }}
                               ?disabled=${this._activeMode === MODES.CONNECT_LINE}>
                        <ha-icon icon="mdi:vector-line" slot="start"></ha-icon>
                        Enter Connect Mode
                    </ha-button>

                    <!-- Right-aligned visualization helpers -->
                    <div style="flex: 1;"></div>
                    <ha-icon-button
                        class="${this._showRoutingPaths ? 'active' : ''}"
                        @click=${() => { this._showRoutingPaths = !this._showRoutingPaths; this.requestUpdate(); }}
                        .label=${'Routing Paths'}>
                        <ha-icon icon="mdi:vector-line"></ha-icon>
                    </ha-icon-button>
                    <ha-icon-button
                        class="${this._showRoutingChannels ? 'active' : ''}"
                        @click=${() => { this._showRoutingChannels = !this._showRoutingChannels; this.requestUpdate(); }}
                        .label=${'Routing Channels'}>
                        <ha-icon icon="mdi:chart-timeline-variant"></ha-icon>
                    </ha-icon-button>
                </div>

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
        const routingMode = line.route || 'auto';
        const strokeColor = line.style?.color || '#FF9900';
        const strokeWidth = line.style?.width || 2;

        // Determine actual strategy for auto mode
        let displayMode = routingMode;
        if (routingMode === 'auto') {
            const hasObstacles = this._getControlOverlays().some(c => c.obstacle === true);
            const hasChannels = line.route_channels && line.route_channels.length > 0;

            if (hasChannels) {
                displayMode = 'auto → smart';
            } else if (hasObstacles) {
                displayMode = 'auto → smart';
            } else {
                displayMode = 'auto → manhattan';
            }
        }

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
                        ">${displayMode}</span>
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
                <!-- Channel Actions & Visualization Helpers -->
                <div style="display: flex; gap: 8px; margin-bottom: 16px; align-items: center;">
                    <ha-button @click=${this._openChannelForm}>
                        <ha-icon icon="mdi:plus" slot="start"></ha-icon>
                        Add Channel
                    </ha-button>
                    <ha-button @click=${async (e) => { e.stopPropagation(); await this._setMode('draw_channel'); }}
                               ?disabled=${this._activeMode === MODES.DRAW_CHANNEL}>
                        <ha-icon icon="mdi:vector-rectangle" slot="start"></ha-icon>
                        Draw on Canvas
                    </ha-button>

                    <!-- Right-aligned visualization helpers -->
                    <div style="flex: 1;"></div>
                    <ha-icon-button
                        class="${this._showRoutingChannels ? 'active' : ''}"
                        @click=${() => { this._showRoutingChannels = !this._showRoutingChannels; this.requestUpdate(); }}
                        .label=${'Routing Channels'}>
                        <ha-icon icon="mdi:chart-timeline-variant"></ha-icon>
                    </ha-icon-button>
                </div>

                <!-- Routing Channels -->
                <lcards-form-section
                    header="Routing Channels"
                    description="Define regions that influence line routing behavior"
                    icon="mdi:chart-timeline-variant"
                    ?expanded=${true}
                    style="margin-bottom: 16px;">

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

                <!-- Routing Modes Reference -->
                <lcards-form-section
                    header="Routing Modes Reference"
                    description="Quick reference for routing behavior"
                    icon="mdi:book-open-variant"
                    ?expanded=${false}
                    style="margin-bottom: 16px;">

                    <!-- Mode selector for reference display -->
                    <ha-selector
                        .hass=${this.hass}
                        .selector=${{
                            select: {
                                options: [
                                    { value: 'auto', label: 'Auto (Recommended)' },
                                    { value: 'direct', label: 'Direct (Straight Line)' },
                                    { value: 'manual', label: 'Manual (Custom Waypoints)' }
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

                <!-- Global Routing Defaults (Advanced) -->
                <lcards-form-section
                    header="Advanced Routing Configuration"
                    description="Fine-tune global routing behavior for lines using route: auto"
                    icon="mdi:tune"
                    ?expanded=${false}
                    style="margin-bottom: 16px;">

                    <!-- Help Text -->
                    <lcards-message type="info" style="margin-bottom: 16px;">
                        <strong>When These Settings Apply</strong>
                        <p style="margin: 8px 0 0 0; font-size: 13px; line-height: 1.4;">
                            These parameters affect lines with <code>route: auto</code> that are auto-upgraded to grid-based routing when:
                            <br/>• <strong>Obstacles detected</strong>: Control overlays with <code>obstacle: true</code>
                            <br/>• <strong>Channels configured</strong>: Line has <code>route_channels</code> specified
                            <br/><br/>Lines with <code>route: direct</code> or <code>route: manual</code> are not affected by these settings.
                        </p>
                    </lcards-message>

                    <!-- Parameter Explanations -->
                    <lcards-message type="tip" style="margin-bottom: 16px;">
                        <strong>Parameter Guide</strong>
                        <div style="margin: 8px 0 0 0; font-size: 12px; line-height: 1.6;">
                            <div style="margin-bottom: 6px;"><strong>Grid-Based Routing</strong></div>
                            <div style="margin-left: 12px; margin-bottom: 8px;">
                                • <strong>Clearance</strong>: Extra padding around obstacles (prevents lines from touching edges)<br/>
                                • <strong>Grid Resolution</strong>: Cell size for pathfinding (smaller = more precise but slower)<br/>
                                • <strong>Turn Penalty</strong>: Cost for direction changes (higher = straighter paths with fewer turns)
                            </div>

                            <div style="margin-bottom: 6px;"><strong>Path Smoothing</strong></div>
                            <div style="margin-left: 12px; margin-bottom: 8px;">
                                • <strong>Chaikin smoothing</strong>: Rounds sharp corners using subdivision algorithm<br/>
                                • <strong>Iterations</strong>: More iterations = smoother curves but less grid-aligned<br/>
                                • <strong>Max Points</strong>: Limits path complexity to prevent performance issues
                            </div>

                            <div style="margin-bottom: 6px;"><strong>Pathfinding Refinement</strong></div>
                            <div style="margin-left: 12px; margin-bottom: 8px;">
                                • <strong>Proximity Band</strong>: Extra avoidance distance from obstacles<br/>
                                • <strong>Detour Span</strong>: How far the algorithm looks ahead for better paths<br/>
                                • <strong>Max Extra Bends</strong>: Maximum additional turns allowed for optimization<br/>
                                • <strong>Max Detours</strong>: How many alternate routes to consider per segment
                            </div>

                            <div style="margin-bottom: 6px;"><strong>Channel Routing</strong></div>
                            <div style="margin-left: 12px;">
                                • <strong>Force Penalty</strong>: Cost when failing to use a forced channel<br/>
                                • <strong>Avoid Multiplier</strong>: How strongly to avoid "avoid" channels
                            </div>
                        </div>
                    </lcards-message>

                    <!-- Basic Routing -->
                    <div style="margin-bottom: 16px;">
                        <div style="font-weight: 500; margin-bottom: 8px;">Grid-Based Routing</div>
                        <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px;">
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
                            <ha-textfield
                                label="Turn Penalty"
                                type="number"
                                min="0"
                                step="0.5"
                                .value=${routing.turn_penalty ?? ''}
                                @input=${(e) => this._updateRoutingConfig('turn_penalty', e.target.value ? parseFloat(e.target.value) : undefined)}
                                helper-text="Cost for direction changes (default: 2)">
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

                    <!-- Smart Routing (renamed) -->
                    <div style="margin-bottom: 16px;">
                        <div style="font-weight: 500; margin-bottom: 8px;">
                            Pathfinding Refinement
                            <span style="font-weight: 400; font-size: 12px; color: var(--secondary-text-color); margin-left: 8px;">
                                (When auto-upgraded with obstacles/channels)
                            </span>
                        </div>
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
                        <div style="font-weight: 500; margin-bottom: 8px;">
                            Channel Routing
                            <span style="font-weight: 400; font-size: 12px; color: var(--secondary-text-color); margin-left: 8px;">
                                (Only when route_channels defined)
                            </span>
                        </div>
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
        // Format numbers with max 1 decimal place, remove trailing .0
        const fmt = (num) => {
            const rounded = Math.round(num * 10) / 10;
            return rounded % 1 === 0 ? rounded.toFixed(0) : rounded.toFixed(1);
        };
        const boundsStr = `[${fmt(x)}, ${fmt(y)}] ${fmt(width)}×${fmt(height)}`;

        // Mode badge labels
        const modeBadges = {
            prefer: { label: 'Prefer', color: '#4CAF50' },
            avoid: { label: 'Avoid', color: '#F44336' },
            force: { label: 'Force', color: '#FF9800' }
        };

        // Direction badge labels
        const directionBadges = {
            auto: { label: 'Auto', icon: '↔' },
            horizontal: { label: 'Horizontal', icon: '→' },
            vertical: { label: 'Vertical', icon: '↓' }
        };

        const mode = channel.mode || 'prefer';
        const direction = channel.direction || 'auto';
        const modeBadge = modeBadges[mode] || modeBadges.prefer;
        const dirBadge = directionBadges[direction] || directionBadges.auto;

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
                    flex-shrink: 0;
                ">
                    ${typeLabels[channel.type]}
                </div>

                <!-- Channel Info -->
                <div style="flex: 1; min-width: 0;">
                    <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">
                        <div style="font-weight: 600;">${id}</div>
                        <!-- Mode Badge -->
                        <span style="
                            display: inline-flex;
                            align-items: center;
                            padding: 2px 8px;
                            border-radius: 12px;
                            background: ${modeBadge.color};
                            color: white;
                            font-size: 10px;
                            font-weight: 600;
                            white-space: nowrap;
                        ">${modeBadge.label}</span>
                        <!-- Direction Badge -->
                        <span style="
                            display: inline-flex;
                            align-items: center;
                            padding: 2px 8px;
                            border-radius: 12px;
                            background: var(--secondary-text-color);
                            color: var(--primary-background-color);
                            font-size: 10px;
                            font-weight: 600;
                            white-space: nowrap;
                        ">${dirBadge.icon} ${dirBadge.label}</span>
                    </div>
                    <div style="font-size: 12px; color: var(--secondary-text-color); font-family: monospace; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                        ${boundsStr}
                    </div>
                </div>

                <!-- Actions -->
                <div style="display: flex; gap: 8px; flex-shrink: 0;">
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
                .heading=${isNew ? 'Add Routing Channel' : `Edit Channel: ${channelId}`}
                style="--mdc-dialog-max-width: 700px; --mdc-dialog-min-width: 700px;">

                <div style="padding: 8px 16px;">
                    <!-- Two-column layout for compact display -->
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px 20px;">

                        <!-- Left Column -->
                        <div style="display: flex; flex-direction: column; gap: 16px;">
                            <!-- Channel ID -->
                            <div>
                                <label class="form-label">Channel ID</label>
                                <ha-textfield
                                    .value=${data.id}
                                    ?disabled=${!isNew}
                                    @input=${(e) => this._updateChannelFormField('id', e.target.value)}
                                    placeholder="power_corridor"
                                    style="width: 100%;">
                                </ha-textfield>
                                ${isNew ? html`
                                    <div class="form-helper">Unique identifier (e.g., power_corridor)</div>
                                ` : ''}
                            </div>

                            <!-- Channel Mode -->
                            <div>
                                <label class="form-label">Channel Mode</label>
                                <ha-selector
                                    .hass=${this.hass}
                                    .selector=${{
                                        select: {
                                            options: [
                                                { value: 'prefer', label: 'Prefer (bundling)' },
                                                { value: 'avoid', label: 'Avoid (repel)' },
                                                { value: 'force', label: 'Force (mandatory)' }
                                            ]
                                        }
                                    }}
                                    .value=${data.mode}
                                    @value-changed=${(e) => this._updateChannelFormField('mode', e.detail.value)}>
                                </ha-selector>
                                <div class="form-helper">How lines interact with this channel</div>
                            </div>

                            <!-- Channel Direction -->
                            <div>
                                <label class="form-label">Flow Direction</label>
                                <ha-selector
                                    .hass=${this.hass}
                                    .selector=${{
                                        select: {
                                            options: [
                                                { value: 'auto', label: 'Auto-detect' },
                                                { value: 'horizontal', label: 'Horizontal →' },
                                                { value: 'vertical', label: 'Vertical ↓' }
                                            ]
                                        }
                                    }}
                                    .value=${data.direction || 'auto'}
                                    @value-changed=${(e) => this._updateChannelFormField('direction', e.detail.value)}>
                                </ha-selector>
                            </div>
                        </div>

                        <!-- Right Column -->
                        <div style="display: flex; flex-direction: column; gap: 16px;">
                            <!-- Bounds Configuration -->
                            <div>
                                <label class="form-label">Channel Bounds (x, y, w, h)</label>
                                <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px;">
                                    <ha-textfield
                                        type="number"
                                        .value=${String(data.bounds[0])}
                                        @input=${(e) => this._updateChannelBounds(0, Number(e.target.value))}
                                        label="X"
                                        style="width: 100%;">
                                    </ha-textfield>
                                    <ha-textfield
                                        type="number"
                                        .value=${String(data.bounds[1])}
                                        @input=${(e) => this._updateChannelBounds(1, Number(e.target.value))}
                                        label="Y"
                                        style="width: 100%;">
                                    </ha-textfield>
                                    <ha-textfield
                                        type="number"
                                        .value=${String(data.bounds[2])}
                                        @input=${(e) => this._updateChannelBounds(2, Number(e.target.value))}
                                        label="W"
                                        style="width: 100%;">
                                    </ha-textfield>
                                    <ha-textfield
                                        type="number"
                                        .value=${String(data.bounds[3])}
                                        @input=${(e) => this._updateChannelBounds(3, Number(e.target.value))}
                                        label="H"
                                        style="width: 100%;">
                                    </ha-textfield>
                                </div>
                            </div>

                            <!-- Weight -->
                            <div>
                                <label class="form-label">Channel Weight (0-1)</label>
                                <ha-selector
                                    .hass=${this.hass}
                                    .selector=${{ number: { min: 0, max: 1, step: 0.1, mode: 'slider' } }}
                                    .value=${data.weight || 0.5}
                                    @value-changed=${(e) => this._updateChannelFormField('weight', e.detail.value)}>
                                </ha-selector>
                                <div class="form-helper">Influence strength (higher = stronger)</div>
                            </div>

                            <!-- Line Spacing -->
                            <div>
                                <label class="form-label">Line Spacing (vb units)</label>
                                <ha-selector
                                    .hass=${this.hass}
                                    .selector=${{ number: { min: 0, max: 100, step: 1, mode: 'slider' } }}
                                    .value=${data.line_spacing ?? 8}
                                    @value-changed=${(e) => this._updateChannelFormField('line_spacing', e.detail.value)}>
                                </ha-selector>
                                <div class="form-helper">Gap between bundled lines (typical: 5-20)</div>
                            </div>
                        </div>
                    </div>

                    <!-- Smart Routing Suggestions (full width if present) -->
                    ${data.suggestedLines && data.suggestedLines.length > 0 ? html`
                        <div class="channel-suggestion-panel" style="margin-top: 16px;">
                            <div class="channel-suggestion-header">
                                <ha-icon icon="mdi:auto-fix"></ha-icon>
                                <label class="channel-suggestion-title">Smart Routing Detected</label>
                            </div>
                            <div class="channel-suggestion-description">
                                ${data.suggestedLines.length} line(s) pass through this channel area.
                                Auto-configure them to route through this channel?
                            </div>
                            <div class="channel-suggestion-actions">
                                <ha-button
                                    primary
                                    @click=${() => this._applyChannelToLines(data.id, data.suggestedLines, 'prefer')}>
                                    <ha-icon icon="mdi:check-circle" slot="start"></ha-icon>
                                    Route Through (Prefer)
                                </ha-button>
                                <ha-button
                                    @click=${() => this._applyChannelToLines(data.id, data.suggestedLines, 'force')}>
                                    <ha-icon icon="mdi:lock" slot="start"></ha-icon>
                                    Force Through
                                </ha-button>
                                <ha-button
                                    @click=${() => this._dismissChannelSuggestions()}>
                                    Skip
                                </ha-button>
                            </div>
                            <div class="channel-suggestion-affected-lines">
                                Affected lines: ${data.suggestedLines.join(', ')}
                            </div>
                        </div>
                    ` : ''}
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
            mode: 'prefer',
            direction: 'auto',
            bounds: [0, 0, 100, 50],
            weight: 0.5,
            line_spacing: 8
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
        // Support both new mode and legacy type fields for backwards compatibility
        let mode = channel.mode;
        if (!mode && channel.type) {
            const typeToMode = { 'bundling': 'prefer', 'avoiding': 'avoid', 'waypoint': 'force' };
            mode = typeToMode[channel.type] || 'prefer';
        }
        this._channelFormData = {
            id,
            mode: mode || 'prefer',
            direction: channel.direction || 'auto',
            bounds: [...(channel.bounds || [0, 0, 100, 50])],
            weight: channel.weight || 0.5,
            line_spacing: channel.line_spacing ?? 8
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

        // Save channel with new schema
        this._workingConfig.msd.channels[id] = {
            mode: this._channelFormData.mode || 'prefer',
            direction: this._channelFormData.direction || 'auto',
            bounds: this._channelFormData.bounds,
            weight: this._channelFormData.weight || 0.5,
            line_spacing: this._channelFormData.line_spacing ?? 8
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
     * Find lines that pass through or near a channel region
     * Uses bounding box intersection for performance
     * @param {Object} channelBounds - Channel bounds {x, y, width, height}
     * @returns {Array<Object>} List of line overlays that intersect the channel
     * @private
     *
     * NOTE: This implementation uses simplified bounding box intersection.
     * It checks if line endpoint bounding boxes overlap with the channel rectangle.
     * This may produce false positives for lines whose endpoints create a bounding
     * box that overlaps the channel but whose actual routed path doesn't cross it.
     *
     * This is an acceptable trade-off:
     * - Better to suggest a line that doesn't need channel routing than miss one that does
     * - Users can skip suggestions they don't want
     * - Keeps computation fast and simple
     *
     * Future enhancement: Implement precise line-rectangle intersection testing
     * using the actual routed path coordinates instead of endpoint bounding boxes.
     */
    _findLinesIntersectingChannel(channelBounds) {
        const overlays = this._workingConfig.msd?.overlays || [];
        const anchors = this._workingConfig.msd?.anchors || {};
        const { x: cx, y: cy, width: cw, height: ch } = channelBounds;
        const cx2 = cx + cw;
        const cy2 = cy + ch;

        const intersectingLines = [];

        for (const overlay of overlays) {
            if (overlay.type !== 'line') continue;

            // Get line endpoints from anchors
            const anchor1 = overlay.anchor ? anchors[overlay.anchor] : null;
            const anchor2 = overlay.attach_to ? anchors[overlay.attach_to] : null;

            if (!anchor1 || !anchor2) continue;

            const [x1, y1] = anchor1;
            const [x2, y2] = anchor2;

            // Step 1: Check if line segment bounding box overlaps channel rectangle
            const lineMinX = Math.min(x1, x2);
            const lineMaxX = Math.max(x1, x2);
            const lineMinY = Math.min(y1, y2);
            const lineMaxY = Math.max(y1, y2);

            // Check for overlap using separating axis theorem (simplified)
            const overlapsX = lineMaxX >= cx && lineMinX <= cx2;
            const overlapsY = lineMaxY >= cy && lineMinY <= cy2;

            if (overlapsX && overlapsY) {
                // Step 2: More specific check - does line actually cross through channel?
                // Check if either endpoint is inside, or if line fully spans channel
                const point1Inside = x1 >= cx && x1 <= cx2 && y1 >= cy && y1 <= cy2;
                const point2Inside = x2 >= cx && x2 <= cx2 && y2 >= cy && y2 <= cy2;
                const spansChannelHorizontally = lineMinX < cx && lineMaxX > cx2;
                const spansChannelVertically = lineMinY < cy && lineMaxY > cy2;

                const likelyCrosses = point1Inside || point2Inside ||
                                     spansChannelHorizontally || spansChannelVertically;

                if (likelyCrosses) {
                    intersectingLines.push(overlay);
                }
            }
        }

        lcardsLog.debug(
            `[MSDStudio] Found ${intersectingLines.length} line(s) intersecting channel bounds:`,
            intersectingLines.map(l => l.id).join(', ')
        );

        return intersectingLines;
    }

    /**
     * Apply channel to suggested lines with auto-configuration
     * Configures all necessary routing parameters for optimal channel usage
     * @param {string} channelId - Channel ID to apply
     * @param {Array<string>} lineIds - Array of line overlay IDs
     * @param {string} mode - Channel mode ('prefer' or 'force')
     * @private
     */
    _applyChannelToLines(channelId, lineIds, mode = 'prefer') {
        lcardsLog.debug(`[MSDStudio] Applying channel '${channelId}' to ${lineIds.length} line(s) with mode: ${mode}`);

        const overlays = this._workingConfig.msd?.overlays || [];
        let updatedCount = 0;

        // Import shared constants
        import('./../../msd/routing/routing-constants.js').then(module => {
            const { CHANNEL_SHAPING_DEFAULTS } = module;

            for (const overlay of overlays) {
                if (overlay.type === 'line' && lineIds.includes(overlay.id)) {
                    // Add channel to route_channels array
                    if (!overlay.route_channels) {
                        overlay.route_channels = [];
                    }
                    if (!overlay.route_channels.includes(channelId)) {
                        overlay.route_channels.push(channelId);
                    }

                    // Set channel mode
                    overlay.route_channel_mode = mode;

                    // Auto-configure smart routing (will be auto-upgraded by RouterCore)
                    // Use schema-defined 'route' field - let auto-upgrade handle mode selection

                    // Set optimal channel shaping parameters only if not already configured
                    if (!overlay.channel_shaping_max_attempts) {
                        overlay.channel_shaping_max_attempts = CHANNEL_SHAPING_DEFAULTS.MAX_ATTEMPTS;
                    }
                    if (!overlay.channel_shaping_span) {
                        overlay.channel_shaping_span = CHANNEL_SHAPING_DEFAULTS.SPAN;
                    }

                    updatedCount++;
                    lcardsLog.debug(`[MSDStudio] Updated line '${overlay.id}' with channel routing`);
                }
            }

            // Update the config
            this._setNestedValue('msd.overlays', overlays);

            // Clear the suggestions from the form
            if (this._channelFormData) {
                this._channelFormData.suggestedLines = null;
            }

            // Show success message
            this._showDialog(
                'Lines Configured',
                `Successfully configured ${updatedCount} line(s) to route through channel "${channelId}" with ${mode} mode.`,
                'success'
            );

            this._schedulePreviewUpdate();
            this.requestUpdate();
        });
    }

    /**
     * Dismiss channel suggestions without applying
     * @private
     */
    _dismissChannelSuggestions() {
        lcardsLog.debug('[MSDStudio] Dismissing channel suggestions');
        if (this._channelFormData) {
            this._channelFormData.suggestedLines = null;
        }
        this.requestUpdate();
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
            route_hint: line.route_hint,
            route_hint_last: line.route_hint_last,
            waypoints: line.waypoints || [],
            corner_style: line.corner_style || 'miter',
            corner_radius: line.corner_radius || 12,
            smoothing_mode: line.smoothing_mode || 'none',
            smoothing_iterations: line.smoothing_iterations || 0,
            // Channel routing
            route_channels: line.route_channels || [],
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
    _saveLine(keepOpen = false) {
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
        if (this._lineFormData.route_hint) {
            lineOverlay.route_hint = this._lineFormData.route_hint;
        }
        if (this._lineFormData.route_hint_last) {
            lineOverlay.route_hint_last = this._lineFormData.route_hint_last;
        }
        if (this._lineFormData.waypoints && this._lineFormData.waypoints.length > 0) {
            lineOverlay.waypoints = this._lineFormData.waypoints;
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
        if (this._lineFormData.route_channel_mode && this._lineFormData.route_channel_mode !== 'prefer') {
            lineOverlay.route_channel_mode = this._lineFormData.route_channel_mode;
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

        // Preserve _editorSelected flag if it exists
        const existingIndex = this._workingConfig.msd.overlays.findIndex(o => o.id === this._lineFormData.id);
        if (existingIndex >= 0) {
            const existingOverlay = this._workingConfig.msd.overlays[existingIndex];
            if (existingOverlay._editorSelected) {
                lineOverlay._editorSelected = true;
            }
            this._workingConfig.msd.overlays[existingIndex] = lineOverlay;
            lcardsLog.debug('[MSDStudio] Updated line:', this._lineFormData.id);
        } else {
            this._workingConfig.msd.overlays.push(lineOverlay);
            lcardsLog.debug('[MSDStudio] Added line:', this._lineFormData.id);
        }

        if (!keepOpen) {
            this._closeLineForm();
        }
        this._schedulePreviewUpdate();
    }

    /**
     * Close line form dialog
     * @private
     */
    _closeLineForm() {
        lcardsLog.trace('[MSDStudio] _closeLineForm called', new Error().stack);
        this._showLineForm = false;
        this._editingLineId = null;
        this.requestUpdate();
    }

    /**
     * Handle waypoint drag start
     * @param {DragEvent} e - Drag event
     * @param {number} index - Waypoint index
     * @private
     */
    _handleWaypointDragStart(e, index) {
        lcardsLog.trace('[MSDStudio] Waypoint drag start:', index);
        this._draggedWaypointIndex = index;
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', index);
        this.requestUpdate();
    }

    /**
     * Handle waypoint drag end
     * @param {DragEvent} e - Drag event
     * @private
     */
    _handleWaypointDragEnd(e) {
        lcardsLog.trace('[MSDStudio] Waypoint drag end');
        this._draggedWaypointIndex = null;
        this.requestUpdate();
    }

    /**
     * Handle waypoint drag over
     * @param {DragEvent} e - Drag event
     * @param {number} index - Drop target index
     * @private
     */
    _handleWaypointDragOver(e, index) {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';

        if (this._draggedWaypointIndex === null || this._draggedWaypointIndex === index) {
            return;
        }
        lcardsLog.trace('[MSDStudio] Waypoint drag over:', index);
    }

    /**
     * Handle waypoint drop
     * @param {DragEvent} e - Drag event
     * @param {number} dropIndex - Drop target index
     * @private
     */
    _handleWaypointDrop(e, dropIndex) {
        lcardsLog.trace('[MSDStudio] Waypoint drop at:', dropIndex);
        e.preventDefault();
        e.stopPropagation();

        const dragIndex = this._draggedWaypointIndex;
        if (dragIndex === null || dragIndex === dropIndex) {
            lcardsLog.trace('[MSDStudio] Drop ignored - same position');
            return;
        }

        // Reorder waypoints
        const waypoints = [...this._lineFormData.waypoints];
        const [draggedItem] = waypoints.splice(dragIndex, 1);
        waypoints.splice(dropIndex, 0, draggedItem);

        this._lineFormData = {
            ...this._lineFormData,
            waypoints
        };
        this._draggedWaypointIndex = null;

        lcardsLog.trace('[MSDStudio] Waypoints reordered');

        // Just update preview (don't save to config yet)
        this._schedulePreviewUpdate();
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
            lcardsLog.debug('[MSDStudio] Deleted line:', line.id);
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
        lcardsLog.debug('[MSDStudio] Highlight line:', line.id);

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
            lcardsLog.debug('[MSDStudio] Connect line source set:', connectionInfo);
            // TODO: Create temp line that follows cursor
            this.requestUpdate();
        } else {
            // Second click - set target and open form
            lcardsLog.debug('[MSDStudio] Connect line target set:', connectionInfo);
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
                .heading=${title}
                .scrimClickAction=${''}
                style="--mdc-dialog-max-width: 90vw; --mdc-dialog-min-width: 90vw; --mdc-dialog-min-height: 80vh; --mdc-dialog-max-height: 80vh;">

                <!-- Split Layout: Content Left, Preview Right -->
                <div style="display: grid; grid-template-columns: 70% 30%; height: 70vh; overflow: hidden;">

                    <!-- Left Panel: Tabs and Content -->
                    <div style="display: flex; flex-direction: column; overflow: hidden; border-right: 2px solid var(--divider-color);">
                        <!-- Subtabs -->
                        <ha-tab-group @wa-tab-show=${this._handleLineFormTabChange} style="padding: 0 16px; flex-shrink: 0;">
                            <ha-tab-group-tab value="basic" ?active=${this._lineFormActiveSubtab === 'basic'}>Basic</ha-tab-group-tab>
                            <ha-tab-group-tab value="style" ?active=${this._lineFormActiveSubtab === 'style'}>Style</ha-tab-group-tab>
                            <ha-tab-group-tab value="markers" ?active=${this._lineFormActiveSubtab === 'markers'}>Markers</ha-tab-group-tab>
                            <ha-tab-group-tab value="animation" ?active=${this._lineFormActiveSubtab === 'animation'}>Animation</ha-tab-group-tab>
                            <ha-tab-group-tab value="routing" ?active=${this._lineFormActiveSubtab === 'routing'}>Routing</ha-tab-group-tab>
                        </ha-tab-group>

                        <!-- Scrollable Content -->
                        <div style="padding: 16px; overflow-y: auto; flex: 1;">
                            ${this._renderLineFormTabContent()}
                        </div>
                    </div>

                    <!-- Right Panel: Vertical Line Preview -->
                    <div style="display: flex; flex-direction: column; padding: 16px; background: var(--secondary-background-color); overflow: hidden;">
                        <div style="font-size: 14px; font-weight: 600; margin-bottom: 12px; color: var(--primary-text-color);">Live Preview</div>
                        ${this._renderLineStylePreviewVertical()}
                    </div>
                </div>

                <div slot="primaryAction">
                    <ha-button @click=${() => this._saveLine()}>
                        <ha-icon icon="mdi:content-save" slot="start"></ha-icon>
                        Save
                    </ha-button>
                </div>

                <div slot="secondaryAction">
                    <ha-button @click=${this._closeLineForm} appearance="plain">
                        <ha-icon icon="mdi:close" slot="start"></ha-icon>
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
                        icon="mdi:ray-start"
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
                        icon="mdi:ray-end"
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
        const routeMode = this._lineFormData.route || 'auto';
        const routeInfoMap = {
            'direct': { icon: 'mdi:vector-line', title: 'Direct', description: 'Straight line from source to target' },
            'manual': { icon: 'mdi:map-marker-path', title: 'Manual', description: 'Draw custom path through explicit waypoints' },
            'auto': { icon: 'mdi:routes', title: 'Auto', description: 'Intelligent pathfinding with obstacle avoidance' }
        };
        const routeInfo = routeInfoMap[routeMode] || routeInfoMap['auto'];

        // Determine actual routing strategy that will be used
        let actualStrategy = routeMode;
        let strategyReason = '';

        if (routeMode === 'auto') {
            const hasObstacles = this._getControlOverlays().some(c => c.obstacle === true);
            const hasChannels = this._lineFormData.route_channels && this._lineFormData.route_channels.length > 0;

            if (hasChannels) {
                actualStrategy = 'smart (grid + channels)';
                strategyReason = 'Channels configured';
            } else if (hasObstacles) {
                actualStrategy = 'smart (grid + A*)';
                strategyReason = 'Obstacles detected';
            } else {
                actualStrategy = 'manhattan';
                strategyReason = 'No obstacles/channels';
            }
        }

        return html`
            <div style="display: flex; flex-direction: column; gap: 16px;">
                <!-- Routing Mode -->
                <lcards-form-section
                    header="Routing Mode"
                    description="How the line is drawn between points"
                    icon="mdi:routes"
                    ?expanded=${true}>

                    <ha-selector
                        .hass=${this.hass}
                        .selector=${{
                            select: {
                                options: [
                                    { value: 'auto', label: 'Auto (Recommended - Smart routing)' },
                                    { value: 'direct', label: 'Direct (Straight line)' },
                                    { value: 'manual', label: 'Manual (Custom waypoints)' }
                                ]
                            }
                        }}
                        .value=${routeMode}
                        .label=${'Route'}
                        @value-changed=${(e) => {
                            this._lineFormData.route = e.detail.value;
                            this.requestUpdate();
                        }}>
                    </ha-selector>

                    <!-- Info Panel -->
                    <div style="margin-top: 12px; padding: 12px; background: var(--secondary-background-color); border-radius: 8px; display: flex; gap: 12px; align-items: start;">
                        <ha-icon icon="${routeInfo.icon}" style="--mdc-icon-size: 24px; color: var(--primary-color); margin-top: 2px;"></ha-icon>
                        <div style="flex: 1;">
                            <div style="font-weight: 600; margin-bottom: 4px;">${routeInfo.title}</div>
                            <div style="font-size: 13px; color: var(--secondary-text-color);">${routeInfo.description}</div>

                            ${routeMode === 'auto' ? html`
                                <div style="margin-top: 12px; padding: 8px 12px; background: var(--primary-color); color: white; border-radius: 6px; font-size: 12px;">
                                    <div style="font-weight: 600; margin-bottom: 2px;">
                                        <ha-icon icon="mdi:information" style="--mdc-icon-size: 14px; margin-right: 4px;"></ha-icon>
                                        Active Strategy: ${actualStrategy}
                                    </div>
                                    <div style="opacity: 0.9;">${strategyReason}</div>
                                </div>
                            ` : ''}

                            ${routeMode === 'auto' || routeMode === 'direct' ? html`
                                <ha-button
                                    @click=${() => this._convertLineToManual(this._lineFormData.id)}
                                    size="small"
                                    style="margin-top: 12px;">
                                    <ha-icon icon="mdi:content-save-edit" slot="start"></ha-icon>
                                    Freeze to Manual Mode
                                </ha-button>
                                <div style="font-size: 11px; color: var(--secondary-text-color); margin-top: 4px;">
                                    Convert current auto-routed path to manual waypoints
                                </div>
                            ` : ''}
                        </div>
                    </div>
                </lcards-form-section>

                ${routeMode === 'auto' ? html`
                    <!-- Routing Hints (only for Auto mode) -->
                    <lcards-form-section
                        header="Flow Direction Preferences"
                        description="Hint the router to prefer horizontal or vertical segments"
                        icon="mdi:arrow-decision"
                        ?expanded=${false}>

                        <ha-selector
                            .hass=${this.hass}
                            .selector=${{
                                select: {
                                    options: [
                                        { value: '', label: 'Auto (No preference)' },
                                        { value: 'xy', label: 'Horizontal First (xy)' },
                                        { value: 'yx', label: 'Vertical First (yx)' }
                                    ]
                                }
                            }}
                            .value=${this._lineFormData.route_hint || ''}
                            .label=${'Initial Direction'}
                            helper-text="xy = horizontal then vertical, yx = vertical then horizontal"
                            @value-changed=${(e) => {
                                const val = e.detail.value;
                                if (val === '') {
                                    delete this._lineFormData.route_hint;
                                } else {
                                    this._lineFormData.route_hint = val;
                                }
                                this.requestUpdate();
                            }}>
                        </ha-selector>

                        <ha-selector
                            .hass=${this.hass}
                            .selector=${{
                                select: {
                                    options: [
                                        { value: '', label: 'Auto (No preference)' },
                                        { value: 'xy', label: 'Horizontal Last (xy)' },
                                        { value: 'yx', label: 'Vertical Last (yx)' }
                                    ]
                                }
                            }}
                            .value=${this._lineFormData.route_hint_last || ''}
                            .label=${'Final Direction'}
                            helper-text="xy = horizontal then vertical, yx = vertical then horizontal"
                            @value-changed=${(e) => {
                                const val = e.detail.value;
                                if (val === '') {
                                    delete this._lineFormData.route_hint_last;
                                } else {
                                    this._lineFormData.route_hint_last = val;
                                }
                                this.requestUpdate();
                            }}
                            style="margin-top: 12px;">
                        </ha-selector>
                    </lcards-form-section>
                ` : ''}

                <!-- Manual Waypoints -->
                ${this._lineFormData.route === 'manual' ? html`
                        <lcards-form-section
                            header="Waypoints"
                            description="Define explicit path coordinates"
                            icon="mdi:map-marker-path"
                            ?expanded=${true}>

                            <!-- Waypoint List -->
                            <div style="margin-bottom: 12px;">
                                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                                    <span style="font-weight: 500;">Waypoints (${(this._lineFormData.waypoints || []).length})</span>
                                    <ha-button
                                        @click=${() => {
                                            if (!this._lineFormData.waypoints) {
                                                this._lineFormData.waypoints = [];
                                            }
                                            // Add waypoint at approximate center of viewBox
                                            const viewBox = this._workingConfig.msd?.view_box || [0, 0, 1920, 1080];
                                            const centerX = viewBox[0] + viewBox[2] / 2;
                                            const centerY = viewBox[1] + viewBox[3] / 2;
                                            this._lineFormData.waypoints.push([centerX, centerY]);
                                            this._waypointEditingLineId = this._lineFormData.id;
                                            this._showWaypointMarkers = true;
                                            this.requestUpdate();
                                        }}
                                        size="small">
                                        <ha-icon icon="mdi:plus" slot="start"></ha-icon>
                                        Add Waypoint
                                    </ha-button>
                                </div>

                                ${(this._lineFormData.waypoints || []).length > 0 ? html`
                                    <div style="display: flex; flex-direction: column; gap: 8px;">
                                        ${(this._lineFormData.waypoints || []).map((wp, index) => html`
                                            <div style="
                                                display: flex;
                                                align-items: center;
                                                gap: 12px;
                                                padding: 12px;
                                                background: var(--card-background-color);
                                                border-radius: 42px;
                                                border: 1px solid ${this._draggedWaypointIndex === index ? 'var(--primary-color)' : 'var(--divider-color)'};
                                                opacity: ${this._draggedWaypointIndex === index ? '0.5' : '1'};
                                                transition: opacity 0.2s, border-color 0.2s;
                                                cursor: ${this._draggedWaypointIndex === index ? 'grabbing' : 'grab'};
                                            "
                                            draggable="true"
                                            @dragstart=${(e) => this._handleWaypointDragStart(e, index)}
                                            @dragend=${(e) => this._handleWaypointDragEnd(e)}
                                            @dragover=${(e) => this._handleWaypointDragOver(e, index)}
                                            @drop=${(e) => this._handleWaypointDrop(e, index)}>
                                                <!-- Drag Handle -->
                                                <ha-icon
                                                    icon="mdi:drag-vertical"
                                                    style="
                                                        --mdc-icon-size: 20px;
                                                        color: var(--secondary-text-color);
                                                        flex-shrink: 0;
                                                    "
                                                    title="Drag to reorder">
                                                </ha-icon>

                                                <!-- Index Badge -->
                                                <div style="
                                                    min-width: 28px;
                                                    height: 28px;
                                                    display: flex;
                                                    align-items: center;
                                                    justify-content: center;
                                                    font-weight: 600;
                                                    font-size: 13px;
                                                    color: white;
                                                    background: var(--primary-color);
                                                    border-radius: 50%;
                                                    flex-shrink: 0;
                                                ">${index + 1}</div>

                                                <!-- Waypoint Content (Coordinates or Named Anchor) -->
                                                ${typeof wp === 'string' ? html`
                                                    <!-- Named Anchor -->
                                                    <ha-textfield
                                                        label="Anchor"
                                                        .value=${wp}
                                                        @input=${(e) => {
                                                            this._lineFormData.waypoints[index] = e.target.value;
                                                            this._schedulePreviewUpdate();
                                                            this.requestUpdate();
                                                        }}
                                                        style="flex: 1; min-width: 120px;">
                                                    </ha-textfield>
                                                ` : html`
                                                    <!-- Coordinates -->
                                                    <div style="flex: 1; display: flex; gap: 8px; min-width: 0;">
                                                        <ha-textfield
                                                            type="number"
                                                            label="X"
                                                            .value=${String(wp[0] || 0)}
                                                            @input=${(e) => {
                                                                this._lineFormData.waypoints[index][0] = this._roundToPrecision(Number(e.target.value));
                                                                this._schedulePreviewUpdate();
                                                                this.requestUpdate();
                                                            }}
                                                            style="flex: 1; min-width: 80px;">
                                                        </ha-textfield>
                                                        <ha-textfield
                                                            type="number"
                                                            label="Y"
                                                            .value=${String(wp[1] || 0)}
                                                            @input=${(e) => {
                                                                this._lineFormData.waypoints[index][1] = this._roundToPrecision(Number(e.target.value));
                                                                this._schedulePreviewUpdate();
                                                                this.requestUpdate();
                                                            }}
                                                            style="flex: 1; min-width: 80px;">
                                                        </ha-textfield>
                                                    </div>
                                                `}

                                                <!-- Toggle Type Button -->
                                                <ha-icon-button
                                                    @click=${() => {
                                                        // Toggle between coordinate and anchor format
                                                        if (typeof wp === 'string') {
                                                            // Convert anchor to coordinates (center of viewBox)
                                                            const viewBox = this._workingConfig.msd?.view_box || [0, 0, 1920, 1080];
                                                            this._lineFormData.waypoints[index] = [viewBox[0] + viewBox[2] / 2, viewBox[1] + viewBox[3] / 2];
                                                        } else {
                                                            // Convert coordinates to anchor
                                                            this._lineFormData.waypoints[index] = '';
                                                        }
                                                        this._schedulePreviewUpdate();
                                                        this.requestUpdate();
                                                    }}
                                                    .label=${typeof wp === 'string' ? 'Switch to coordinates' : 'Switch to anchor'}
                                                    style="flex-shrink: 0;">
                                                    <ha-icon icon="${typeof wp === 'string' ? 'mdi:map-marker-outline' : 'mdi:crosshairs-gps'}"></ha-icon>
                                                </ha-icon-button>

                                                <!-- Delete Button -->
                                                <ha-icon-button
                                                    @click=${() => {
                                                        this._lineFormData.waypoints.splice(index, 1);
                                                        this._schedulePreviewUpdate();
                                                        this.requestUpdate();
                                                    }}
                                                    .label=${'Delete waypoint'}
                                                    style="flex-shrink: 0;">
                                                    <ha-icon icon="mdi:delete"></ha-icon>
                                                </ha-icon-button>
                                            </div>
                                        `)}
                                    </div>
                                ` : html`
                                    <div style="padding: 16px; text-align: center; color: var(--secondary-text-color); font-size: 0.875rem; border: 1px dashed var(--divider-color); border-radius: 12px;">
                                        No waypoints defined. Click "Add Waypoint" to begin.
                                    </div>
                                `}
                            </div>

                        </lcards-form-section>
                    ` : ''}

                    <!-- Auto Routing: Clearance -->
                    ${routeMode === 'auto' ? html`
                        <lcards-form-section
                            header="Advanced Options"
                            description="Fine-tune pathfinding behavior"
                            icon="mdi:cog"
                            ?expanded=${false}>

                            <ha-textfield
                                type="number"
                                label="Clearance (pixels)"
                                .value=${String(this._lineFormData.clearance || '')}
                                @input=${(e) => {
                                    const val = e.target.value;
                                    if (val === '') {
                                        delete this._lineFormData.clearance;
                                    } else {
                                        this._lineFormData.clearance = Number(val);
                                    }
                                    this.requestUpdate();
                                }}
                                helper-text="Minimum pixels from obstacles (leave empty for default: 8)"
                                style="width: 100%;">
                            </ha-textfield>
                        </lcards-form-section>
                    ` : ''}

                <!-- Channel Routing (only for auto/direct modes) -->
                ${routeMode !== 'manual' ? this._renderChannelRoutingOptions() : ''}
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
                    icon="mdi:map-marker-plus"
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
                    icon="mdi:map-marker-check"
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
                    icon="mdi:animation"
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
                        icon="mdi:palette"
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
                        icon="mdi:vector-curve"
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
                    icon="mdi:cog"
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

    /**
     * Render vertical line style preview for split-view dialog
     * @returns {TemplateResult}
     * @private
     */
    _renderLineStylePreviewVertical() {
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

            const size = marker.size ?? 10;
            const half = size / 2;
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
                    const lineLength = size * 0.8;
                    const lineOffset = (size - lineLength) / 2;
                    shape = `<line x1="${half}" y1="${lineOffset}" x2="${half}" y2="${size - lineOffset}" stroke="${fillColor}" stroke-width="${Math.max(strokeWidth || 2, 2)}" stroke-linecap="round" opacity="${opacity}" />`;
                    break;
                case 'rect':
                    const rectSize = size * 0.7;
                    const rectOffset = (size - rectSize) / 2;
                    shape = `<rect x="${rectOffset}" y="${rectOffset}" width="${rectSize}" height="${rectSize}" fill="${fillColor}" stroke="${strokeColor}" stroke-width="${strokeWidth}" opacity="${opacity}" />`;
                    break;
            }

            return `
                <marker id="${id}" viewBox="0 0 ${size} ${size}"
                    markerWidth="${size}" markerHeight="${size}"
                    refX="${half}" refY="${half}" orient="auto">
                    ${shape}
                </marker>
            `;
        };

        // Create vertical path with corners - larger spacing for better arc visibility
        let pathD = 'M 35,30 L 35,90 L 65,90 L 65,190 L 35,190 L 35,250';

        // Apply corner rounding if round style is selected
        if (cornerStyle === 'round' && cornerRadius > 0) {
            const r = Math.min(cornerRadius, 20); // Allow larger radius in preview
            pathD = `M 35,30 L 35,${90-r} Q 35,90 ${35+r},90 L ${65-r},90 Q 65,90 65,${90+r} L 65,${190-r} Q 65,190 ${65-r},190 L ${35+r},190 Q 35,190 35,${190+r} L 35,250`;
        }

        return html`
            <div style="flex: 1; display: flex; align-items: center; justify-content: center; padding: 20px; background: #0a0a0a; border-radius: 8px; border: 1px solid #333;">
                <svg viewBox="0 0 100 280" preserveAspectRatio="xMidYMid meet" style="width: 100%; height: 100%; max-height: 500px;">
                    <defs>
                        ${unsafeHTML(createMarker(markerStart, 'start-preview-v'))}
                        ${unsafeHTML(createMarker(markerEnd, 'end-preview-v'))}
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
                        marker-start="${markerStart?.type && markerStart.type !== 'none' ? 'url(#start-preview-v)' : ''}"
                        marker-end="${markerEnd?.type && markerEnd.type !== 'none' ? 'url(#end-preview-v)' : ''}"
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
            lcardsLog.debug('[MSDStudio] Delete key pressed - no item selected');
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
            cancelButton.dialogAction = 'cancel';
            cancelButton.setAttribute('appearance', 'plain');
            cancelButton.addEventListener('click', () => {
                dialog.close();
                resolve(false);
            });

            const confirmButton = document.createElement('ha-button');
            confirmButton.slot = 'primaryAction';
            confirmButton.textContent = 'Discard';
            confirmButton.dialogAction = 'discard';
            confirmButton.setAttribute('variant', 'danger');
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
     * Get lovelace configuration for card picker
     * @returns {Object} Lovelace config
     * @private
     */
    _getLovelaceConfig() {
        // Use the same logic as _getLovelace() to find the real lovelace object
        const lovelace = this._getLovelace();

        if (lovelace) {
            lcardsLog.debug('[MSDStudio] _getLovelaceConfig - lovelace found:', {
                hasConfig: !!lovelace.config,
                hasViews: !!lovelace.config?.views,
                viewsIsArray: Array.isArray(lovelace.config?.views),
                viewsCount: lovelace.config?.views?.length,
                configKeys: lovelace.config ? Object.keys(lovelace.config) : [],
                lovelaceKeys: Object.keys(lovelace)
            });

            // Ensure the lovelace object has the required config.views structure
            if (!lovelace.config) {
                lcardsLog.warn('[MSDStudio] Lovelace missing config, adding fallback structure');
                lovelace.config = { views: [] };
            } else if (!lovelace.config.views) {
                lcardsLog.warn('[MSDStudio] Lovelace missing config.views, adding fallback');
                lovelace.config.views = [];
            } else if (!Array.isArray(lovelace.config.views)) {
                lcardsLog.error('[MSDStudio] Lovelace config.views exists but is NOT an array!', {
                    viewsType: typeof lovelace.config.views,
                    viewsValue: lovelace.config.views
                });
                lovelace.config.views = [];
            }

            return lovelace;
        }

        // Ultimate fallback if no lovelace found at all
        lcardsLog.warn('[MSDStudio] No lovelace found, using minimal fallback');
        return { config: { views: [] }, editMode: true };
    }

    /**
     * Handle card selection from native HA card picker
     * @param {Object} cardConfig - Selected card configuration
     * @private
     */
    _handleCardPickerSelection(cardConfig) {
        if (!cardConfig) return;

        lcardsLog.debug('[MSDStudio] 🎯 Card selected from picker:', cardConfig.type);

        // Generate new control ID
        const newControlId = this._generateControlId();

        // Create new control overlay with selected card
        const newControl = {
            id: newControlId,
            position: [100, 100], // Default position
            size: 'auto',
            attachment: 'center',
            obstacle: false,
            card: cardConfig
        };

        // Add to working config
        const controls = this._workingConfig.msd?.controls || [];
        const updatedControls = [...controls, newControl];

        this._workingConfig = {
            ...this._workingConfig,
            msd: {
                ...this._workingConfig.msd,
                controls: updatedControls
            }
        };

        // Update preview
        this._schedulePreviewUpdate();
        this.requestUpdate();

        lcardsLog.debug('[MSDStudio] ✅ Control added:', newControlId);
    }

    /**
     * Generate unique control ID
     * @returns {string} New control ID
     * @private
     */
    _generateControlId() {
        const controls = this._workingConfig.msd?.controls || [];
        let id = 1;
        while (controls.some(c => c.id === `control_${id}`)) {
            id++;
        }
        return `control_${id}`;
    }

    /**
     * Update control card configuration
     * @param {string} controlId - Control ID
     * @param {Object} cardConfig - New card configuration
     * @param {Object} metadata - Event metadata
     * @private
     */
    _updateLayerCard(controlId, cardConfig, metadata = {}) {
        const controls = this._workingConfig.msd?.controls || [];
        const controlIndex = controls.findIndex(c => c.id === controlId);

        if (controlIndex === -1) {
            lcardsLog.warn('[MSDStudio] ⚠️ Control not found:', controlId);
            return;
        }

        // Update control
        const updatedControls = [...controls];
        updatedControls[controlIndex] = {
            ...updatedControls[controlIndex],
            card: cardConfig
        };

        this._workingConfig = {
            ...this._workingConfig,
            msd: {
                ...this._workingConfig.msd,
                controls: updatedControls
            }
        };

        // Update preview if not maintaining editor state
        if (!metadata.maintainEditorState) {
            this._schedulePreviewUpdate();
        }

        this.requestUpdate();

        lcardsLog.debug('[MSDStudio] 🔄 Control card updated:', controlId, metadata);
    }

    /**
     * Open native HA editor for control's card
     * @param {string} controlId - Control ID
     * @private
     */
    _editLayerCard(controlId) {
        const control = this._workingConfig.msd?.controls?.find(c => c.id === controlId);
        if (!control?.card) {
            lcardsLog.warn('[MSDStudio] ⚠️ No card found for control:', controlId);
            return;
        }

        lcardsLog.debug('[MSDStudio] 🎨 Opening editor for control:', controlId);
        this._editorLauncher?.openCardEditor(controlId, control.card);
    }

    /**
     * Render component
     */
    render() {
        // Inject line highlight styles (hover only - selection uses static SVG)
        setTimeout(() => this._injectLineHighlightStyles(), 100);

        return html`
            <ha-dialog
                open
                @closed=${this._handleClose}
                .scrimClickAction=${''}
                .escapeKeyAction=${''}
                .heading=${'MSD Configuration Studio'}>

                <div slot="primaryAction">
                    <ha-button @click=${this._handleSave}>
                        <ha-icon icon="mdi:content-save" slot="start"></ha-icon>
                        Save
                    </ha-button>
                </div>

                <div slot="secondaryAction">
                    <ha-button @click=${() => window.open('https://github.com/snootched/LCARdS', '_blank')} appearance="plain">
                        <ha-icon icon="mdi:book-open-variant" slot="start"></ha-icon>
                        Documentation
                    </ha-button>
                    <ha-button @click=${this._handleReset} appearance="plain" variant="warning">
                        <ha-icon icon="mdi:restore" slot="start"></ha-icon>
                        Reset
                    </ha-button>
                    <ha-button @click=${this._handleCancel} appearance="plain">
                        <ha-icon icon="mdi:close" slot="start"></ha-icon>
                        Cancel
                    </ha-button>
                </div>

                <div class="dialog-content">
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
                        <div class="preview-panel mode-${this._activeMode}">

                            <!-- Scrollable content container -->
                            <div class="preview-scroll-container preview-container"
                                 data-mode="${this._activeMode}"
                                 @click=${this._handlePreviewClick}
                                 @dblclick=${this._handlePreviewDoubleClick}
                                 @mousemove=${this._handlePreviewMouseMove}
                                 @mouseleave=${this._handlePreviewMouseLeave}>

                                <!-- Zoomable preview container (d3-zoom applies transform dynamically) -->
                                <div class="msd-zoom-wrapper" style="transform-origin: top left;">
                                    <lcards-msd-live-preview
                                        .hass=${this.hass}
                                        .config=${this._workingConfig}
                                        .debugSettings=${this._getDebugSettings()}
                                        .showRefreshButton=${true}
                                        .zoomTransform=${this._getZoomTransform()}>
                                    </lcards-msd-live-preview>
                                </div>

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
                            ${this._renderWaypointMarkers()}
                            ${this._renderDragAttachPoints()}
                            ${this._renderChannelsOverlay()}

                            <!-- Temporary Highlights -->
                            ${this._renderAnchorHighlight()}
                            ${this._renderControlHighlight()}
                            ${this._renderLineHighlight()}
                            ${this._renderChannelHighlight()}

                            <!-- Attachment Points (Connect Line Mode) -->
                            ${this._renderAttachmentPointsOverlay()}
                            </div>
                            <!-- End scrollable container -->

                            <!-- Canvas Toolbar (Floating - outside scroll) -->
                            ${this._renderCanvasToolbar()}

                            <!-- Zoom Controls (outside scroll) -->
                            <div class="zoom-controls">
                                <ha-icon-button
                                    @click=${(e) => { e.stopPropagation(); this._zoom(0.9); }}
                                    title="Zoom Out">
                                    <ha-icon icon="mdi:magnify-minus"></ha-icon>
                                </ha-icon-button>
                                <span class="zoom-level">${Math.round(this._currentZoom * 100)}%</span>
                                <ha-icon-button
                                    @click=${(e) => { e.stopPropagation(); this._zoom(1.1); }}
                                    title="Zoom In">
                                    <ha-icon icon="mdi:magnify-plus"></ha-icon>
                                </ha-icon-button>
                                <ha-icon-button
                                    @click=${(e) => { e.stopPropagation(); this._resetZoom(); }}
                                    title="Reset Zoom (100%)">
                                    <ha-icon icon="mdi:fit-to-page"></ha-icon>
                                </ha-icon-button>
                            </div>

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
