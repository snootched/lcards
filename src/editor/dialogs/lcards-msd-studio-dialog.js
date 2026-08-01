/**
 * @fileoverview LCARdS MSD Configuration Studio
 *
 * Full-screen immersive editor for configuring MSD (Master Systems Display) cards.
 * Provides a 6-tab structure with live preview and an interactive mode system.
 *
 * Tab Structure:
 * 1. Base SVG - SVG source, viewBox, filters
 * 2. Anchors - Named anchor management
 * 3. Controls - Control overlay list with card editor
 * 4. Lines - Line overlay list with routing config
 * 5. Channels - Routing channel management
 * 6. Debug - Debug visualization settings
 *
 * Mode System:
 * - View: Default mode for navigation
 * - Place Anchor: Click to place named anchors
 * - Place Control: Click to place control overlays
 * - Connect Line: Click source → target workflow
 * - Draw Channel: Draw routing channel rectangles
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
import { unsafeSVG } from 'lit/directives/unsafe-svg.js';
import { lcardsLog } from '../../utils/lcards-logging.js';
import { editorStyles } from '../base/editor-styles.js';
import { OverlayUtils } from '../../msd/renderer/OverlayUtils.js';
import { RouterCore } from '../../msd/routing/RouterCore.js';
import { LineOverlay } from '../../msd/overlays/LineOverlay.js';
import { SvgStructureAnalyzer } from '../../msd/pipeline/SvgStructureAnalyzer.js';
import '../components/shared/lcards-form-section.js';
import '../components/shared/lcards-message.js';
import '../components/shared/lcards-shield-bubble-diagram.js';
import { infoGuideStyles } from '../components/shared/info-guide-styles.js';
import { ROUTING_CONCEPTS_DOCS_URL } from '../components/shared/docs-links.js';
import '../components/editors/lcards-color-section.js';
import '../components/editors/lcards-position-picker.js';
import '../components/lcards-msd-live-preview.js';
import '../components/lcards-animation-editor.js';
import '../components/lcards-filter-editor.js';
import '../components/lcards-background-animation-editor.js';
import '../components/editors/lcards-color-section-v2.js';
import '../components/yaml/lcards-yaml-editor.js';
import '../components/lcards-card-picker-wrapper.js';
import { configToYaml, yamlToConfig } from '../utils/yaml-utils.js';

// d3-zoom imports for pan/zoom functionality
import { zoom, zoomIdentity } from 'd3-zoom';
import { select } from 'd3-selection';

// Extracted utilities
import { getPreviewCoordinatesFromMouseEvent, snapToGrid } from './msd-studio/msd-coordinate-utils.js';
import { getBaseSvgAnchors, resolveControlPosition, resolvePositionWithSide, splitBaseSvgAnchorsBySource } from './msd-studio/msd-anchor-utils.js';
import { msdStudioStyles } from './msd-studio/msd-studio-styles.js';
import { studioDialogStyles } from './studio-dialog-styles.js';
import { studioSubformDialogStyles } from './studio-subform-dialog-styles.js';
import { searchableSelectStyles } from '../components/shared/searchable-select-styles.js';

// Native HA Card Picker & Editor Integration
import { MSDCardPickerManager } from './msd-studio/msd-card-picker-manager.js';
import { MSDEventInterceptor } from './msd-studio/msd-event-interceptor.js';

// Mode constants
const MODES = {
    VIEW: 'view',
    PLACE_ANCHOR: 'place_anchor',
    PLACE_CONTROL: 'place_control',
    CONNECT_LINE: 'connect_line',
    DRAW_CHANNEL: 'draw_channel',
    ADD_WAYPOINT: 'add_waypoint',
    DRAW_SHAPE: 'draw_shape'
};

// Above this many points, a polyline shape's per-vertex X/Y form (one
// un-virtualized row per point, two ha-selector number inputs each) is
// slow/heavy enough to freeze the browser tab on open - found via a
// bulk-generated Suggest Shield Bubble shape with 800+ YAML lines' worth of
// points. Gated in _renderShapeFormGeometry() rather than virtualized/paged:
// hand-editing hundreds of individual coordinates via number spinners isn't
// a realistic workflow anyway - canvas drag-to-edit or the YAML tab are the
// actually-usable paths for a shape this large.
const MAX_INLINE_EDITABLE_SHAPE_POINTS = 60;

// Tab constants
const TABS = {
    BASE_SVG: 'base_svg',
    ANCHORS: 'anchors',
    CONTROLS: 'controls',
    LINES: 'lines',
    SHAPES: 'shapes',
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
            _svgSourceMode: { type: String, state: true }, // 'asset', 'custom', 'media', or 'none'
            _extractedViewBox: { type: Array, state: true }, // viewBox auto-extracted from SVG (not in user config)
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
            _showRoutingGrid: { type: Boolean, state: true },  // Show the router's OWN search-grid resolution (distinct from the drag-snap _showGrid/_gridSpacing)
            _showTrunks: { type: Boolean, state: true },  // Show spontaneously-discovered trunk-and-branch bundling rows (RouterCore.trunks())
            _baseSvgPreviewDimmed: { type: Boolean, state: true },  // Editor-only: dim base SVG in live preview (never saved)
            // Edit Mode (discussion #389) — see _toggleEditMode
            _liveInteractionEnabled: { type: Boolean, state: true },
            _altKeyHeld: { type: Boolean, state: true },
            _editModeAutoShown: { type: Object, state: true },
            // Controls Tab Properties
            _showControlForm: { type: Boolean, state: true },
            _editingControlId: { type: String, state: true },
            _controlFormId: { type: String, state: true },
            _controlFormPosition: { type: Array, state: true },
            _controlFormSize: { type: Array, state: true },
            _controlFormAttachment: { type: String, state: true },
            _controlFormPositionSide: { type: String, state: true },
            _controlFormObstacle: { type: Boolean, state: true },
            _controlFormZIndex: { type: Number, state: true },
            _controlFormCard: { type: Object, state: true },
            _controlFormAnimations: { type: Array, state: true },
            _controlFormActiveSubtab: { type: String, state: true }, // 'placement', 'card', or 'animation'
            // Card Editor Sub-form (nested inside the Control form's Card tab)
            _showCardEditorForm: { type: Boolean, state: true },
            _cardEditorTempConfig: { type: Object, state: true },
            // Lines Tab Properties
            _showLineForm: { type: Boolean, state: true },
            _editingLineId: { type: String, state: true },
            _lineFormData: { type: Object, state: true }, // Complete line form data with correct schema
            _lineFormActiveSubtab: { type: String, state: true }, // 'connection' or 'style'
            _connectLineState: { type: Object, state: true }, // { source: null, tempLineElement: null }
            // Shapes Tab Properties
            _showShapeForm: { type: Boolean, state: true },
            _editingShapeId: { type: String, state: true },
            _shapeFormData: { type: Object, state: true },
            _shapeFormActiveSubtab: { type: String, state: true }, // 'geometry' or 'style'
            _drawShapeState: { type: Object, state: true }, // { kind, points: [[x,y],...], drawing, currentPoint }
            // Shape edit-mode: drag-to-move/resize (rect/circle, mirrors control drag/resize)
            // and drag-to-move-vertex (polyline, mirrors line waypoint drag)
            _selectedShapeId: { type: String, state: true },
            _shapeDragState: { type: Object, state: true },
            _shapeResizeState: { type: Object, state: true },
            _shapeVertexDragState: { type: Object, state: true },
            // Shield-Bubble Suggest - editor-only ephemeral state, never persisted to
            // config (matches the _showBoundingBoxes/_baseSvgPreviewDimmed precedent,
            // not a config flag - see .github/instructions/msd.instructions.md)
            _shieldBubbleState: { type: Object, state: true },
            // Channels Tab Properties
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
        lcardsLog.debug('[MSDStudio] Constructor called');
        this.hass = null;
        this._initialConfig = null;
        this._workingConfig = {};
        this._activeTab = TABS.BASE_SVG;
        this._activeMode = MODES.VIEW;
        this._validationErrors = [];
        this._cardPickerRequestId = 0; // Track card picker requests
        this._pendingCardPickerRequests = new Map(); // Map requestId -> resolve/reject
        // Base SVG tab's "Performance (Advanced)" section expanded state — own
        // state, not derived from msd.triggers_update on every render (same
        // reasoning as _controlFormTriggersUpdateExpanded). null = not yet
        // lazily initialized from the loaded config (see _renderBaseSvgTab).
        this._baseSvgPerformanceExpanded = null;
        this._debugSettings = {
            // Debug toggles
            anchors: true,
            bounding_boxes: true,
            attachment_points: false,
            routing_channels: false,
            line_paths: true,
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
        // rAF handle for polling until the rebuilt preview's SVG has mounted
        this._previewReadyRafHandle = null;

        // Base SVG Tab State
        this._viewBoxMode = 'auto';
        this._extractedViewBox = null;
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
        this._anchorFilterQuery = '';  // Editor-only list filter, never saved to config
        this._showBoundingBoxes = false;
        this._showRoutingPaths = false;
        this._showRoutingChannels = false;  // Hidden by default, use Routing Channels toggle
        this._showRoutingGrid = false;  // Hidden by default — debug aid, not a drag/positioning tool
        this._showTrunks = false;  // Hidden by default — debug aid, not a drag/positioning tool
        this._baseSvgPreviewDimmed = false;  // Editor-only preview convenience, never saved to config

        // Edit Mode (discussion #389) — default true = current behavior, live
        // cards inside the preview stay fully interactive (their own tap
        // actions work) same as always. Engaging Edit Mode pauses that so
        // clicks land on the drag/resize handles instead — see
        // _toggleEditMode/_applyLiveInteractionToActivePreview. Alt-held is a
        // one-off bypass with the same effect, usable without leaving Live
        // Preview mode (see the keydown/keyup handlers in connectedCallback).
        this._liveInteractionEnabled = true;
        this._altKeyHeld = false;
        // Which of _showBoundingBoxes/_showAnchorMarkers/_showRoutingChannels
        // Edit Mode itself force-enabled on entry, so leaving Edit Mode only
        // hides what it auto-showed — never a toggle the user had already
        // turned on themselves. null when Edit Mode isn't active.
        this._editModeAutoShown = null;

        // Preview Zoom State
        this._previewZoom = 1.0;

        // Pan/Zoom State (d3-zoom integration)
        this._currentZoom = { x: 0, y: 0, k: 1 };
        this._zoomBehavior = null;
        this._zoomContainer = null;  // The preview-scroll-container element
        this._zoomWrapper = null;     // The zoomable wrapper div
        this._zoomBaseWidth = 0;      // Natural (unscaled) wrapper width, set from viewBox
        this._zoomBaseHeight = 0;     // Natural (unscaled) wrapper height, set from viewBox
        this._fitPending = false;     // Guard: fit-to-viewport scheduled but not yet applied
        this._panJustEnded = false;   // True for one tick after a pan drag, suppresses click deselect
        this._zoomGestureStartTransform = null; // Transform captured on zoom 'start', to detect a real pan vs. a stationary click

        // Controls Tab State
        this._showControlForm = false;
        this._editingControlId = null;
        // Draw-on-canvas state for Place Control (2-click bbox, or
        // click-drag, mirroring _drawChannelState/_channelDrawDragCandidate)
        this._placeControlDrawState = {
            startPoint: null,
            currentPoint: null,
            drawing: false
        };
        this._controlDrawDragCandidate = null;
        this._controlFormId = '';
        this._controlFormPosition = [0, 0];
        this._controlFormSize = [100, 100];
        this._controlFormAttachment = 'center';
        this._controlFormPositionSide = 'center';
        // Default new controls to obstacle:true so routed lines get real
        // avoidance against them out of the box (see RouterCore.js's
        // _computeManhattan/goal-cell fixes for why this is now safe).
        this._controlFormObstacle = true;
        this._controlFormZIndex = null;
        // 'specific' (use _controlFormTriggersUpdateEntities) or 'all' (see #387)
        this._controlFormTriggersUpdateMode = 'specific';
        this._controlFormTriggersUpdateEntities = [];
        // Own state, NOT derived from the two fields above on every render — see
        // the section's ?expanded binding for why (a purely-derived value fights
        // the user mid-interaction, e.g. collapsing the instant they switch mode
        // before picking an entity).
        this._controlFormTriggersUpdateExpanded = false;
        this._controlFormCard = { type: '' };
        this._controlFormActiveSubtab = 'placement';

        // Card Editor Sub-form State (nested inside Control form's Card tab)
        this._showCardEditorForm = false;
        this._cardEditorTempConfig = null;

        // Lines Tab State
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

        // Shapes Tab State
        this._showShapeForm = false;
        this._editingShapeId = null;
        this._shapeFormData = {
            id: '',
            kind: 'rect',
            position: [0, 0],
            size: [100, 60],
            points: [],
            closed: false,
            entity: '',
            state_attribute: '',
            ranges_attribute: '',
            z_index: null,
            corner_style: 'round',
            corner_radius: 8,
            corner_angle: 45,
            smoothing_mode: 'none',
            smoothing_iterations: 0,
            animations: [],
            style: {
                color: { default: 'var(--lcars-orange)' },
                width: 2,
                opacity: 1,
                dash_array: '',
                fill: { default: 'none' },
                fill_opacity: 1,
                line_cap: 'butt',
                line_join: '',
                miter_limit: 4
            }
        };
        this._shapeFormActiveSubtab = 'geometry';
        this._drawShapeState = {
            kind: null,
            points: [],
            drawing: false,
            currentPoint: null
        };
        // Pending mousedown-drag candidate for rect/circle draw shapes — kept
        // separate from _drawShapeState so a plain click-then-click still
        // behaves exactly as before if no drag ever happens (see
        // _handlePreviewMouseDown/_handlePreviewMouseMove/_handleDragEnd).
        this._shapeDrawDragCandidate = null;
        this._shieldBubbleState = this._defaultShieldBubbleState();
        this._routingCheatSheetExpanded = false;

        // Shape edit-mode state
        this._selectedShapeId = null;
        this._shapeDragState = {
            active: false,
            shapeId: null,
            startPos: null,
            originalPos: null,
            offsetX: 0,
            offsetY: 0
        };
        this._shapeResizeState = {
            active: false,
            shapeId: null,
            handle: null,
            startPos: null,
            startSize: null,
            startPosition: null
        };
        this._shapeVertexDragState = null; // { shapeId, vertexIndex, startX, startY } while dragging

        // Channels Tab State
        this._editingChannelId = null;
        // Matches the schema _openChannelForm/_editChannel/_saveChannel and
        // _renderChannelFormDialog actually read (mode/direction/weight/
        // line_spacing) — the old type/priority/color fields aren't part of
        // the current channel config shape at all.
        this._channelFormData = {
            id: '',
            mode: 'prefer',
            direction: 'auto',
            bounds: [0, 0, 100, 50],
            weight: 0.5,
            line_spacing: 8,
            discoverable: true
        };
        this._drawChannelState = {
            startPoint: null,
            currentPoint: null,
            drawing: false,
            tempRectElement: null
        };
        // Pending mousedown-drag candidate for draw-channel, mirroring
        // _shapeDrawDragCandidate (see _handlePreviewMouseDown/MouseMove/_handleDragEnd).
        this._channelDrawDragCandidate = null;

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

        // Channel Drag (move) State — mirrors _dragState (controls)
        this._channelDragState = {
            active: false,
            channelId: null,
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

        // Add keyboard event listener. Capture phase on window, registered
        // here in connectedCallback (before the nested <ha-dialog>/<wa-dialog>
        // child even connects), so this runs during the top-down capture
        // sweep — before the event ever reaches wa-dialog's own bubble-phase
        // @keydown handler (ha-dialog.ts), which unconditionally
        // stopPropagation()s Escape to close the dialog. Without this, Escape
        // never reached this handler at all.
        this._boundKeyDownHandler = this._handleKeyDown.bind(this);
        window.addEventListener('keydown', this._boundKeyDownHandler, true);

        // Add document mouseup listener for drag end
        this._boundMouseUpHandler = this._handleDragEnd.bind(this);
        document.addEventListener('mouseup', this._boundMouseUpHandler);

        // Add card picker result listener on document (event proxy from editor)
        this._boundCardPickerResultHandler = this._handleCardPickerResult.bind(this);
        document.addEventListener('card-picker-result', this._boundCardPickerResultHandler);
        lcardsLog.debug('[MSDStudio] Listening for card-picker-result events from editor');

        // Detect SVG source mode and viewBox mode from config
        this._detectSvgSourceMode();
        this._detectViewBoxMode();
        // Eagerly attempt viewBox extraction (populates _extractedViewBox for
        // _previewNaturalSize and friends) — a no-op via its own internal
        // guards if the SVG isn't registered yet or mode is 'custom'; the
        // live-DOM-read fallback in _previewNaturalSize covers the rest.
        this._autoExtractViewBox();

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
        if (this._previewReadyRafHandle) {
            cancelAnimationFrame(this._previewReadyRafHandle);
            this._previewReadyRafHandle = null;
        }

        // Cleanup Native HA Card Picker & Editor Managers
        this._eventInterceptor?.cleanupEventInterception();
        this._cardPickerManager?.cleanup();

        // Remove keyboard event listener (capture flag must match addEventListener)
        if (this._boundKeyDownHandler) {
            window.removeEventListener('keydown', this._boundKeyDownHandler, true);
        }
        // Remove document mouseup listener
        if (this._boundMouseUpHandler) {
            document.removeEventListener('mouseup', this._boundMouseUpHandler);
        }
        // Remove card picker result listener from document
        if (this._boundCardPickerResultHandler) {
            document.removeEventListener('card-picker-result', this._boundCardPickerResultHandler);
        }

        // Remove any self-contained drag/resize document listeners left behind
        // by a drag in progress when the dialog closes (each of these 9 pairs
        // is added at its own *Start handler and normally torn down by its own
        // *MouseUp handler — this is just the "dialog closed mid-drag" safety net).
        const dragListenerPairs = [
            ['_boundDragMouseMove', 'mousemove'], ['_boundDragMouseUp', 'mouseup'],
            ['_boundResizeMouseMove', 'mousemove'], ['_boundResizeMouseUp', 'mouseup'],
            ['_boundAnchorDragMouseMove', 'mousemove'], ['_boundAnchorDragMouseUp', 'mouseup'],
            ['_boundChannelDragMouseMove', 'mousemove'], ['_boundChannelDragMouseUp', 'mouseup'],
            ['_boundChannelResizeMouseMove', 'mousemove'], ['_boundChannelResizeMouseUp', 'mouseup'],
            ['_boundShapeDragMouseMove', 'mousemove'], ['_boundShapeDragMouseUp', 'mouseup'],
            ['_boundShapeResizeMouseMove', 'mousemove'], ['_boundShapeResizeMouseUp', 'mouseup'],
            ['_boundShapeVertexMouseMove', 'mousemove'], ['_boundShapeVertexMouseUp', 'mouseup'],
            ['_boundWaypointMouseMove', 'mousemove'], ['_boundWaypointMouseUp', 'mouseup']
        ];
        for (const [field, eventType] of dragListenerPairs) {
            if (this[field]) {
                document.removeEventListener(eventType, this[field]);
                this[field] = null;
            }
        }

        this._baseSvgDimObserver?.disconnect();
        this._baseSvgDimObserver = null;
    }

    /**
     * Called after first render - initialize zoom behavior
     * @param {Map} changedProps - Changed properties
     */
    async firstUpdated(changedProps) {
        super.firstUpdated(changedProps);
        lcardsLog.debug('[MSDStudio] firstUpdated called');

        // Wait for preview to render, then initialize zoom
        await this.updateComplete;
        lcardsLog.debug('[MSDStudio] updateComplete, scheduling zoom init');
        requestAnimationFrame(() => {
            lcardsLog.debug('[MSDStudio] requestAnimationFrame fired, calling _initializeZoom');
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
                this._applyBaseSvgPreviewDimming();
            });
        }
    }

    /**
     * Editor-only convenience: dim the base SVG in the live preview so lines/controls
     * are easier to see while editing. Never written to config — applied directly to
     * the embedded preview card's DOM, same element PipelineCore locates for filters.
     *
     * lcards-msd-live-preview._updatePreviewCard() fully destroys and recreates the
     * <lcards-msd-card> element on every config AND every hass update (not just
     * base_svg changes), which would silently wipe out a one-time style change — so
     * this both retries (the card's SVG mounts asynchronously after creation) and
     * sets up a MutationObserver to reapply whenever the card element is replaced.
     * @param {number} [retriesLeft] - Remaining attempts while waiting for the SVG to mount
     * @private
     */
    _applyBaseSvgPreviewDimming(retriesLeft = 10) {
        const livePreview = this.shadowRoot?.querySelector('lcards-msd-live-preview');
        const container = livePreview?.shadowRoot?.querySelector('.preview-card-container');
        const msdCard = container?.querySelector('lcards-msd-card');
        const baseContent = (msdCard?.shadowRoot || msdCard?.renderRoot)?.querySelector('#__msd-base-content');

        if (baseContent) {
            baseContent.style.opacity = this._baseSvgPreviewDimmed ? '0.15' : '';
        } else if (retriesLeft > 0) {
            setTimeout(() => this._applyBaseSvgPreviewDimming(retriesLeft - 1), 200);
        }

        if (container && !this._baseSvgDimObserver) {
            this._baseSvgDimObserver = new MutationObserver(() => {
                requestAnimationFrame(() => this._applyBaseSvgPreviewDimming());
            });
            this._baseSvgDimObserver.observe(container, { childList: true });
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
        lcardsLog.debug('[MSDStudio][ZOOM] _initializeZoom called');

        const previewPanel = this.shadowRoot.querySelector('.preview-panel');
        if (!previewPanel) {
            lcardsLog.warn('[MSDStudio] Preview panel not found for zoom initialization');
            return;
        }
        lcardsLog.debug('[MSDStudio][ZOOM] Found preview panel');

        // Find the preview scroll container - this is what we'll attach zoom to
        const container = previewPanel.querySelector('.preview-scroll-container');
        if (!container) {
            lcardsLog.warn('[MSDStudio] Preview scroll container not found for zoom initialization');
            return;
        }
        lcardsLog.debug('[MSDStudio][ZOOM] Found scroll container');

        // Find the zoomable wrapper div (contains lcards-msd-live-preview)
        const zoomableWrapper = container.querySelector('.msd-zoom-wrapper');
        if (!zoomableWrapper) {
            lcardsLog.warn('[MSDStudio] Zoomable wrapper not found for zoom initialization');
            return;
        }
        lcardsLog.debug('[MSDStudio][ZOOM] Found zoomable wrapper');

        // Seed natural dimensions from the viewBox (not from DOM offsetWidth/Height
        // which races with the 300ms live-preview debounce and reads 0).
        const { width: natW, height: natH } = this._previewNaturalSize;
        this._zoomBaseWidth = natW;
        this._zoomBaseHeight = natH;

        // Create zoom behavior with constraints
        this._zoomBehavior = zoom()
            .scaleExtent([0.25, 10])  // 25% to 1000% zoom range
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

                // Allow pan:
                //   - Middle mouse button (always)
                //   - Shift + left drag (always, legacy shortcut kept)
                //   - Bare left drag in view mode on canvas background
                if (event.type === 'mousedown') {
                    if (event.button === 1) return true;
                    if (event.button === 0 && event.shiftKey) return true;
                    // In view mode allow a bare left-drag to pan.
                    // The target check is best-effort: interactive overlays (anchor markers,
                    // control handles, line endpoints) are rendered outside the scroll
                    // container so they won't reach this filter in the first place.
                    if (event.button === 0 && this._activeMode === MODES.VIEW) return true;
                    return false;
                }

                return false;
            })
            .on('zoom', (event) => {
                // Apply transform to the zoomable wrapper div
                // This affects the entire preview including all MSD layers
                const t = event.transform;
                // @ts-ignore - TS2339: auto-suppressed
                zoomableWrapper.style.transform = `translate(${t.x}px, ${t.y}px) scale(${t.k})`;
                // @ts-ignore - TS2339: auto-suppressed
                zoomableWrapper.style.transformOrigin = 'top left';

                // Store full transform object (not just scale)
                this._currentZoom = { x: t.x, y: t.y, k: t.k };
                this.requestUpdate(); // Updates studio overlays

                lcardsLog.trace('[MSDStudio][ZOOM] Transform applied:', { x: t.x, y: t.y, k: t.k });
            })
            .on('start', (event) => {
                // Add panning class to the container for grab cursor feedback.
                // d3-zoom fires start for both scroll-zoom and drag-pan; the CSS
                // rule only shows grabbing when the cursor would be grab (view mode).
                if (this._zoomContainer) {
                    this._zoomContainer.classList.add('panning');
                }
                // Capture the transform at gesture start so 'end' can tell a real
                // pan/zoom apart from a stationary click. The filter above allows
                // any bare left mousedown in VIEW mode to start a d3-zoom gesture
                // (needed to support click-and-drag panning), but d3-zoom fires
                // 'start'/'end' for that gesture even with zero movement — i.e. for
                // every plain click, not just actual drags.
                this._zoomGestureStartTransform = event.transform;
            })
            .on('end', (event) => {
                if (this._zoomContainer) {
                    this._zoomContainer.classList.remove('panning');
                }
                // Only signal a pan/zoom to _handlePreviewClick (suppressing its
                // click-to-deselect logic) if the transform actually changed —
                // otherwise this fires on every stationary click in VIEW mode
                // (see 'start' above), permanently blocking deselection whenever
                // a line/shape is selected, since selecting one no longer switches
                // out of VIEW mode.
                const start = this._zoomGestureStartTransform;
                const end = event.transform;
                const actuallyPanned = !start || start.x !== end.x || start.y !== end.y || start.k !== end.k;
                this._zoomGestureStartTransform = null;
                if (actuallyPanned) {
                    this._panJustEnded = true;
                    setTimeout(() => { this._panJustEnded = false; }, 0);
                }
                // Request update after pan/zoom ends to refresh overlay positions
                // Fixes issue where anchors/controls stay in old position after shift+drag
                this.requestUpdate();
                lcardsLog.trace('[MSDStudio] Zoom/pan ended, refreshing overlays');
            });

        // Attach zoom behavior to the container
        select(container).call(this._zoomBehavior);
        this._zoomContainer = container;
        this._zoomWrapper = zoomableWrapper;

        lcardsLog.debug('[MSDStudio][ZOOM] Zoom initialization complete with scroll sync');
        lcardsLog.info('[MSDStudio] 🔍 Zoom behavior initialized on preview container');

        // Schedule fit-to-viewport after the live-preview 300ms debounce has fired
        // and the card has had a chance to render and establish real dimensions.
        if (!this._fitPending) {
            this._fitPending = true;
            setTimeout(() => {
                this._fitPending = false;
                this._fitToViewport();
            }, 400);
        }
    }

    /**
     * Returns the natural (unscaled) pixel size for the wrapper, derived from the
     * config viewBox.  This gives the wrapper a concrete height so that the
     * height:100% chain inside lcards-msd-live-preview resolves correctly.
     *
     * Explicit config and `_extractedViewBox` (populated asynchronously by
     * `_autoExtractViewBox()`) are both checked first, but neither is
     * guaranteed to be ready yet on an early render pass — falls back to
     * reading the viewBox actually applied to the live preview's rendered
     * `<svg>` (via `_getPreviewSvgAndViewBox()`) before the hardcoded
     * last-resort default, so the wrapper self-corrects to the right size
     * the moment the preview mounts, regardless of extraction timing.
     * @returns {{ width: number, height: number }}
     * @private
     */
    get _previewNaturalSize() {
        const vb = this._workingConfig?.msd?.view_box || this._extractedViewBox;
        if (Array.isArray(vb) && vb.length >= 4 && vb[2] > 0 && vb[3] > 0) {
            return { width: vb[2], height: vb[3] };
        }
        const preview = this._getPreviewSvgAndViewBox();
        if (preview) {
            return { width: preview.viewBoxWidth, height: preview.viewBoxHeight };
        }
        return { width: 1920, height: 1080 };
    }

    /**
     * Compute and apply a d3-zoom transform that fits the wrapper inside the
     * visible scroll container area.  Called after init and after SVG changes.
     * @private
     */
    _fitToViewport() {
        if (!this._zoomBehavior || !this._zoomContainer) return;
        const containerRect = this._zoomContainer.getBoundingClientRect();
        // .preview-scroll-container reserves top padding (see
        // msd-studio-styles.js) so content doesn't render directly under the
        // floating canvas toolbar — getBoundingClientRect() includes that
        // padding in its height, but it isn't usable drawing space. Reading
        // it from computed style (rather than duplicating the CSS value here)
        // keeps this correct if that padding ever changes. Without
        // subtracting it, the fit is computed against more vertical room
        // than actually exists below the reserved strip, pushing the bottom
        // of the diagram past the visible/clipped area.
        const topInset = parseFloat(getComputedStyle(this._zoomContainer).paddingTop) || 0;
        const availW = containerRect.width;
        const availH = containerRect.height - topInset;
        if (!availW || !availH) return;

        // Always re-read from viewBox so a SVG change is picked up immediately
        const { width: natW, height: natH } = this._previewNaturalSize;
        this._zoomBaseWidth = natW;
        this._zoomBaseHeight = natH;

        // Scale to fit with 32px padding on each axis; never zoom beyond 1:1
        const k = Math.min(1, (availW - 32) / natW, (availH - 32) / natH);
        const tx = (availW - natW * k) / 2;
        // No +topInset here: the zoom transform translates .msd-zoom-wrapper,
        // a normal in-flow child of the padded container, so it already sits
        // topInset below the container's border-box top before any transform
        // is applied — adding topInset again would double-count it and push
        // the content further down than the fit actually intends.
        const ty = Math.max(16, (availH - natH * k) / 2);

        select(this._zoomContainer).call(
            this._zoomBehavior.transform,
            zoomIdentity.translate(tx, ty).scale(k)
        );
        this.requestUpdate();
        lcardsLog.debug('[MSDStudio][ZOOM] Fit to viewport applied:', { k, tx, ty, natW, natH, availW, availH });
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
        // Order matters: msdStudioStyles must come after studioDialogStyles so
        // its intentional overrides (33.3/66.6 split, .preview-panel overflow,
        // tab-group spacing, zoom-controls tint) win the cascade.
        return [editorStyles, studioDialogStyles, msdStudioStyles, studioSubformDialogStyles, searchableSelectStyles, infoGuideStyles];
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
            this._channelDrawDragCandidate = null;
        }
        if (this._activeMode !== MODES.CONNECT_LINE) {
            this._connectLineState = { source: null, tempLineElement: null };
        }
        // Leaving PLACE_CONTROL abandons any in-progress draw (mirrors
        // DRAW_CHANNEL) — the control is only created once the form is saved.
        if (this._activeMode !== MODES.PLACE_CONTROL) {
            this._placeControlDrawState = { startPoint: null, currentPoint: null, drawing: false };
            this._controlDrawDragCandidate = null;
        }
        // Leaving DRAW_SHAPE abandons any in-progress points (same cancel-on-exit
        // convention as DRAW_CHANNEL) — a shape is only committed once its form is
        // saved, so nothing is lost by discarding an unfinished draw.
        if (this._activeMode !== MODES.DRAW_SHAPE) {
            this._drawShapeState = {
                kind: null,
                points: [],
                drawing: false,
                currentPoint: null
            };
            this._shapeDrawDragCandidate = null;
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
        // @ts-ignore - TS2339: auto-suppressed
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

            // Explicitly force the live-preview child to rebuild rather than
            // relying on its own .config property binding to detect the
            // change. _workingConfig is mutated in place everywhere in this
            // file (_setNestedValue, _saveShape, etc.), never reassigned to
            // a new object — so lit-html's default reference-equality dirty
            // check on .config=${this._workingConfig} sees the *same*
            // reference on every render and skips re-invoking the setter,
            // meaning the child's own updated(changedProps) never sees
            // 'config' as changed and never rebuilds the preview card. This
            // was masked almost all the time by .hass also being watched
            // there (its updated() ORs on 'config'/'hass') — HA hands a
            // fresh hass object on every tick, so a tick arriving shortly
            // after any edit "accidentally" refreshed the preview anyway.
            // Confirmed via a real repro where no hass tick landed soon
            // enough — the preview stayed stuck on the previous base_svg
            // indefinitely despite the config genuinely having updated.
            this.shadowRoot?.querySelector('lcards-msd-live-preview')?._forceRefresh();
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
            this._previewZoom = Math.max(0.25, Math.min(10.0, this._previewZoom * factor));
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
        } else if (source.startsWith('media-source://')) {
            this._svgSourceMode = 'media';
        } else {
            this._svgSourceMode = 'custom';
        }
    }

    /**
     * Detect viewBox mode from config. Without this, `_viewBoxMode` stays at
     * its constructor default ('auto') even when opening the dialog on a
     * card that already has an explicit `view_box` set — the Auto/Custom
     * toggle would silently disagree with the loaded config until the user
     * manually touched it.
     * @private
     */
    _detectViewBoxMode() {
        const viewBox = this._workingConfig.msd?.view_box;
        this._viewBoxMode = (Array.isArray(viewBox) && viewBox.length === 4) ? 'custom' : 'auto';
    }

    /**
     * Handle save button click.
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

        // Strip transient editor-only state (e.g. the "selected" highlight flag)
        // before it leaves the dialog — this is UI state, not config, and must
        // never be persisted into the saved card/YAML. Without this, a line
        // left selected when Save is clicked bakes a permanent glow into every
        // future render, including outside the editor after a hard refresh.
        for (const overlay of this._workingConfig.msd?.overlays || []) {
            delete overlay._editorSelected;
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
     * Handle cancel button click.
     * @private
     */
    _handleCancel() {
        if (this._configHasChanges()) {
            // Show confirmation - only close if user confirms
            // @ts-ignore - TS2339: auto-suppressed
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
     * Handle reset button click.
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
     * Render canvas toolbar (floating on preview)
     * @returns {TemplateResult}
     * @private
     */
    /**
     * Toggle Edit Mode (discussion #389) — pauses live-card click interception
     * so overlays can be dragged/resized directly instead of triggering the
     * live card's own action (e.g. toggling a light). Also auto-shows the
     * bounding-box/anchor/channel overlays that are the actual drag/resize
     * affordance, since with none of them visible there's nothing to grab —
     * only remembering (and later restoring) the ones IT turned on, never
     * touching a toggle the user already had set themselves.
     * @private
     */
    _toggleEditMode() {
        this._liveInteractionEnabled = !this._liveInteractionEnabled;

        if (!this._liveInteractionEnabled) {
            // Entering Edit Mode: force-show, remembering only what was OFF before.
            this._editModeAutoShown = {
                boundingBoxes: !this._showBoundingBoxes,
                anchorMarkers: !this._showAnchorMarkers,
                routingChannels: !this._showRoutingChannels
            };
            this._showBoundingBoxes = true;
            this._showAnchorMarkers = true;
            this._showRoutingChannels = true;
        } else {
            // Leaving Edit Mode: hide only what Edit Mode itself auto-showed.
            if (this._editModeAutoShown?.boundingBoxes) this._showBoundingBoxes = false;
            if (this._editModeAutoShown?.anchorMarkers) this._showAnchorMarkers = false;
            if (this._editModeAutoShown?.routingChannels) this._showRoutingChannels = false;
            this._editModeAutoShown = null;
        }

        this.requestUpdate();
    }

    _renderCanvasToolbar() {
        const modeButtons = [
            { mode: MODES.VIEW, icon: 'mdi:cursor-default', tooltip: 'View Mode' },
            { mode: MODES.PLACE_ANCHOR, icon: 'mdi:map-marker-plus', tooltip: 'Place Anchor' },
            { mode: MODES.PLACE_CONTROL, icon: 'mdi:widgets', tooltip: 'Place Control' },
            { mode: MODES.CONNECT_LINE, icon: 'mdi:vector-line', tooltip: 'Connect Line' },
            { mode: MODES.DRAW_CHANNEL, icon: 'mdi:chart-timeline-variant', tooltip: 'Draw Channel' },
            { mode: MODES.ADD_WAYPOINT, icon: 'mdi:map-marker-path', tooltip: 'Add Waypoint (Select line first)' }
        ];

        // Overlay-visibility toggles only (what's drawn on the canvas) — Grid
        // Snapping moved into the View-aids group below since it changes drag
        // behavior, not what's visible.
        const overlayToggles = [
            { key: 'show_anchor_markers', prop: '_showAnchorMarkers', icon: 'mdi:map-marker', tooltip: 'Anchors' },
            { key: 'show_bounding_boxes', prop: '_showBoundingBoxes', icon: 'mdi:border-outside', tooltip: 'Bounding Boxes' },
            { key: 'show_routing_paths', prop: '_showRoutingPaths', icon: 'mdi:vector-line', tooltip: 'Routing Paths' },
            { key: 'show_channels', prop: '_showRoutingChannels', icon: 'mdi:chart-timeline-variant', tooltip: 'Routing Channels' },
            { key: 'show_attachment_points', prop: '_showAttachmentPoints', icon: 'mdi:target-variant', tooltip: 'Attachment Points' },
            { key: 'show_routing_grid', prop: '_showRoutingGrid', icon: 'mdi:grid-large', tooltip: 'Routing Grid (router\'s own search resolution)' },
            { key: 'show_trunks', prop: '_showTrunks', icon: 'mdi:source-branch', tooltip: 'Discovered Trunks (trunk-and-branch bundling)' }
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
                        <!-- Tools group: canvas mode selection — changes what clicking on
                             the canvas does (place/draw/connect vs. plain view/select). -->
                        <div class="canvas-toolbar-group">
                            <span class="canvas-toolbar-group-label">Tools</span>
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

                            <!-- Draw Shape buttons: one per kind, since DRAW_SHAPE is a single
                                 mode whose behavior branches on _drawShapeState.kind. All three
                                 share the same mode identifier, so _setMode's own toggle-by-
                                 identity check can't distinguish "switch kind while staying in
                                 draw mode" from "toggle the whole mode off" — handled explicitly
                                 here instead. -->
                            ${[
                                { kind: 'polyline', icon: 'mdi:vector-polyline', tooltip: 'Draw Polyline/Path' },
                                { kind: 'rect', icon: 'mdi:rectangle-outline', tooltip: 'Draw Rectangle' },
                                { kind: 'circle', icon: 'mdi:circle-outline', tooltip: 'Draw Circle' }
                            ].map(btn => html`
                                <button
                                    class="canvas-toolbar-button ${this._activeMode === MODES.DRAW_SHAPE && this._drawShapeState.kind === btn.kind ? 'active' : ''}"
                                    @click=${async (e) => {
                                        e.stopPropagation();
                                        if (this._activeMode === MODES.DRAW_SHAPE) {
                                            if (this._drawShapeState.kind === btn.kind) {
                                                // Same kind clicked again: toggle off (mirrors _setMode's own toggle-off + reset)
                                                this._activeMode = MODES.VIEW;
                                                this._drawShapeState = { kind: null, points: [], drawing: false, currentPoint: null };
                                            } else {
                                                // Different kind: switch within DRAW_SHAPE, discard in-progress points
                                                this._drawShapeState = { kind: btn.kind, points: [], drawing: false, currentPoint: null };
                                            }
                                            this._shapeDrawDragCandidate = null;
                                            this.requestUpdate();
                                        } else {
                                            // Entering DRAW_SHAPE from elsewhere: let _setMode clean up whatever mode we're leaving
                                            await this._setMode(MODES.DRAW_SHAPE);
                                            this._drawShapeState = { kind: btn.kind, points: [], drawing: false, currentPoint: null };
                                            this._shapeDrawDragCandidate = null;
                                            this.requestUpdate();
                                        }
                                    }}
                                    title="${btn.tooltip}">
                                    <ha-icon icon="${btn.icon}"></ha-icon>
                                </button>
                            `)}
                        </div>

                        <!-- Interaction group: Edit Mode (discussion #389) — pauses live-card
                             click interception so overlays can be dragged/resized directly. -->
                        <div class="canvas-toolbar-group">
                            <span class="canvas-toolbar-group-label">Interaction</span>
                            <button
                                class="canvas-toolbar-button ${!this._liveInteractionEnabled ? 'active' : ''}"
                                @click=${(e) => { e.stopPropagation(); this._toggleEditMode(); }}
                                title="${this._liveInteractionEnabled ? 'Live Preview (click or press E for Edit Mode)' : 'Edit Mode (click or press E to return to Live Preview)'}">
                                <ha-icon icon="${this._liveInteractionEnabled ? 'mdi:eye' : 'mdi:cursor-move'}"></ha-icon>
                            </button>
                        </div>

                        <!-- View-aids group: canvas guides/behavior that don't change what's
                             in the config, only how you see and interact with the canvas. -->
                        <div class="canvas-toolbar-group">
                            <span class="canvas-toolbar-group-label">View</span>
                            <button
                                class="canvas-toolbar-button ${this._showCrosshairs ? 'active' : ''}"
                                @click=${(e) => { e.stopPropagation(); this._showCrosshairs = !this._showCrosshairs; this.requestUpdate(); }}
                                title="Crosshairs">
                                <ha-icon icon="mdi:crosshairs"></ha-icon>
                            </button>

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

                            <button
                                class="canvas-toolbar-button ${this._enableSnapping ? 'active' : ''}"
                                @click=${(e) => { e.stopPropagation(); this._enableSnapping = !this._enableSnapping; this.requestUpdate(); }}
                                title="Grid Snapping">
                                <ha-icon icon="mdi:magnet"></ha-icon>
                            </button>
                        </div>

                        <!-- Overlays group: show/hide overlay-type visualizations on the canvas. -->
                        <div class="canvas-toolbar-group">
                            <span class="canvas-toolbar-group-label">Overlays</span>
                            ${overlayToggles.map(toggle => html`
                                <button
                                    class="canvas-toolbar-button ${this[toggle.prop] ? 'active' : ''}"
                                    @click=${(e) => { e.stopPropagation(); this[toggle.prop] = !this[toggle.prop]; this.requestUpdate(); }}
                                    title="${toggle.tooltip}">
                                    <ha-icon icon="${toggle.icon}"></ha-icon>
                                </button>
                            `)}
                        </div>
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
        // @ts-ignore - TS2322: auto-suppressed
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
                    <ha-selector
                        .hass=${this.hass}
                        .label=${'Show Grid'}
                        .selector=${{ boolean: {} }}
                        .value=${this._showGrid}
                        @value-changed=${(e) => {
                            this._showGrid = e.detail.value;
                            this._updateDebugSetting('grid', e.detail.value);
                        }}>
                    </ha-selector>

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
                                .label=${'Grid Size (vb units)'}
                                @value-changed=${(e) => {
                                    this._gridSpacing = e.detail.value;
                                    this._updateDebugSetting('gridSpacing', e.detail.value);
                                }}>
                            </ha-selector>
                        </div>

                        <!-- Snap to Grid -->
                        <ha-selector
                            style="margin-top: 12px; display: block;"
                            .hass=${this.hass}
                            .label=${'Snap to Grid'}
                            .selector=${{ boolean: {} }}
                            .value=${this._enableSnapping}
                            @value-changed=${(e) => { this._enableSnapping = e.detail.value; }}>
                        </ha-selector>

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
            { id: TABS.SHAPES, label: 'Shapes', icon: 'mdi:shape' },
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
            case TABS.SHAPES:
                return this._renderShapesTab();
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
        } else if (source.startsWith('/local/') || source.startsWith('/hacsfiles/') || source.startsWith('/lcards/')) {
            svgKey = source.split('/').pop().replace('.svg', '');
            isExternal = true;
        } else if (source.startsWith('http://') || source.startsWith('https://')) {
            svgKey = source.split('/').pop().replace('.svg', '');
            isExternal = true;
        } else if (source.startsWith('media-source://')) {
            // Registered/cached under the content ID itself, not a derived
            // filename key — see AssetManager.loadSvgFromMediaSource().
            svgKey = source;
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
                    font-family: var(--lcars-font, var(--lcars-fallback-font, 'Antonio', sans-serif));
                ">
                    <!-- Header -->
                    <div style="
                        display: flex;
                        flex-wrap: wrap;
                        justify-content: space-between;
                        align-items: flex-start;
                        gap: 8px;
                        margin-bottom: 12px;
                        border-bottom: 2px solid rgba(255,255,255,0.3);
                        padding-bottom: 10px;
                    ">
                        <div style="flex: 1; min-width: 0;">
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
                                max-width: 100%;
                                text-align: right;
                                word-break: break-word;
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

                        ${metadata.license ? html`
                            <div>
                                <div style="opacity: 0.8; font-size: 10px; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 2px;">License</div>
                                <div style="font-weight: 500;">${metadata.license}</div>
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
                • /lcards/ships/custom.svg<br>
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
            // Store for _previewNaturalSize so the wrapper gets correct pixel dimensions
            this._extractedViewBox = extracted;
            // Refit the viewport now that we know the real SVG dimensions
            setTimeout(() => this._fitToViewport(), 50);
            // Temporarily set viewBox for preview, but don't persist to config
            // The card will extract it during render
            lcardsLog.trace('[MSDStudio] Auto-extracted viewBox for preview:', extracted);
        }
    }

    /**
     * Extract viewBox from current SVG source
     * @returns {Promise<Array|null>} ViewBox array [x, y, w, h] or null
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
     * @param {string} mode - 'asset', 'custom', 'media', or 'none'
     * @private
     */
    _handleSvgSourceModeChange(mode) {
        const previousMode = this._svgSourceMode;
        this._svgSourceMode = mode;

        if (mode === 'none') {
            this._setNestedValue('msd.base_svg.source', 'none');
            // Switch viewBox to custom mode when using none
            if (this._viewBoxMode === 'auto') {
                this._handleViewBoxModeChange('custom');
            }
        } else if (previousMode === 'none' && this._viewBoxMode === 'custom') {
            // Coming from 'none' (which forces a custom view_box since there's
            // no SVG to auto-extract from) back to a real SVG source — revert
            // to auto now that a viewBox can actually be extracted.
            this._handleViewBoxModeChange('auto');
        }

        if (mode === 'asset') {
            // Reset to the first available SVG whenever the current source
            // isn't already a builtin: value — covers switching from 'none',
            // 'custom' (a /local/ or https:// path), or 'media' (a
            // media-source:// id). Without this, a leftover non-builtin value
            // stays in config and — since this selector allows custom_value
            // once there are 10+ builtin options — shows up in the Asset
            // Library dropdown as a stray unmatched entry instead of a normal
            // builtin selection.
            const currentSource = this._workingConfig.msd?.base_svg?.source;
            if (!currentSource || !currentSource.startsWith('builtin:')) {
                const svgs = this._getAvailableSvgs();
                if (svgs.length > 0 && svgs[0].value) {
                    this._setNestedValue('msd.base_svg.source', svgs[0].value);
                }
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
            // Only genuinely curated, pack-provided SVGs belong in this
            // dropdown — listAssets() returns every registered key,
            // including ones dynamically registered from a user's Custom
            // Path or HA Media pick (see _fetchRawSvgContent's
            // auto-register branch and AssetManager.loadSvgFromMediaSource),
            // which persist in the registry for the rest of the page session
            // once picked. Pack-provided entries always carry a `pack`
            // metadata field (see AssetManager.preloadFromPack); dynamic ones
            // never do. Without this filter, a previously-picked
            // media-source:// id or /local/ path leaks into this list
            // permanently as a mangled, unresolvable "builtin:<raw value>"
            // entry — and since _handleSvgSourceModeChange resets to
            // svgs[0] when switching into this mode, it could even become
            // the newly-selected value if it happened to sort first.
            const options = svgKeys
                .filter(key => !!assetManager.getMetadata('svg', key)?.pack)
                .map(key => ({
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
     * Render Base SVG tab.
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
        const availableSvgs = this._getAvailableSvgs();

        // Lazy one-time init from the loaded config — see the constructor's
        // _baseSvgPerformanceExpanded comment for why this isn't recomputed
        // reactively on every render.
        if (this._baseSvgPerformanceExpanded === null) {
            this._baseSvgPerformanceExpanded = this._workingConfig.msd?.triggers_update === 'all';
        }

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
                                        { value: 'media', label: 'Browse HA Media' },
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
                                        custom_value: availableSvgs.length >= 10,
                                        options: availableSvgs
                                    }
                                }}
                                .value=${baseSvg.source || ''}
                                .label=${'SVG Asset'}
                                @value-changed=${(e) => this._handleSvgSourceChange(e.detail.value)}>
                            </ha-selector>
                        ` : this._svgSourceMode === 'custom' ? html`
                            <ha-input
                                label="Custom SVG Path"
                                .value=${baseSvg.source || ''}
                                @input=${(e) => this._handleSvgSourceChange(e.target.value)}
                                hint="Enter custom path (e.g., /local/my-ship.svg)">
                            </ha-input>
                        ` : this._svgSourceMode === 'media' ? html`
                            <!-- HA media library picker — filtered to SVG's real MIME type
                                 (image/svg+xml), not the broader image/* used for raster
                                 backgrounds elsewhere, since base_svg needs actual SVG markup. -->
                            <ha-selector
                                .hass=${this.hass}
                                .selector=${{ media: { accept: ['image/svg+xml'] } }}
                                .value=${baseSvg.source?.startsWith('media-source://')
                                    ? { media_content_id: baseSvg.source, media_content_type: '' }
                                    : undefined}
                                .label=${'HA Media'}
                                .helper=${'Browse or upload an SVG via the Home Assistant media library'}
                                @value-changed=${(e) => this._handleSvgSourceChange(e.detail.value?.media_content_id ?? '')}>
                            </ha-selector>
                        ` : html`
                            <ha-alert alert-type="info">
                                No base SVG will be rendered. Overlays will be drawn on a transparent canvas using the viewBox coordinates below.
                                <strong>ViewBox must be configured manually.</strong>
                            </ha-alert>
                        `}
                        ${this._renderSvgSourceHelper(baseSvg.source)}
                    </div>
                </lcards-form-section>

                <!-- Visibility Section -->
                <lcards-form-section
                    header="Visibility"
                    description="Control whether the base SVG is shown as the visual background"
                    icon="mdi:eye-outline"
                    ?expanded=${false}>
                    <ha-selector
                        .hass=${this.hass}
                        .label=${'Render base SVG as visible background'}
                        .helper=${'Turn off to use a Background Layer (below) as the visual background instead — the SVG is still parsed for anchors either way.'}
                        .selector=${{ boolean: {} }}
                        .value=${baseSvg.render_visual !== false}
                        @value-changed=${(e) => {
                            this._setNestedValue('msd.base_svg.render_visual', e.detail.value);
                        }}>
                    </ha-selector>

                    <ha-selector
                        style="margin-top: 12px; display: block;"
                        .hass=${this.hass}
                        .label=${'Dim base SVG in this preview (not saved)'}
                        .helper=${'Editor convenience only — makes lines/controls easier to see while working here. Never affects the saved config or the live card.'}
                        .selector=${{ boolean: {} }}
                        .value=${this._baseSvgPreviewDimmed === true}
                        @value-changed=${(e) => {
                            this._baseSvgPreviewDimmed = e.detail.value;
                            this._applyBaseSvgPreviewDimming();
                        }}>
                    </ha-selector>
                </lcards-form-section>

                <!-- ViewBox Section -->
                <lcards-form-section
                    header="ViewBox"
                    description="Configure the coordinate system for your MSD display"
                    icon="mdi:grid"
                    ?expanded=${false}>
                    <div style="display: flex; flex-direction: column; gap: 12px;">
                        <ha-radio-group
                            .value=${this._viewBoxMode}
                            @change=${e => this._handleViewBoxModeChange(e.target.value)}>
                            <ha-radio-option value="auto">Auto-detect from SVG</ha-radio-option>
                            <ha-radio-option value="custom">Custom viewBox</ha-radio-option>
                        </ha-radio-group>

                        <div style="display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; margin-top: 8px;">
                            <ha-input
                                style="width: 100%; box-sizing: border-box; min-width: 0;"
                                type="number"
                                label="Min X"
                                .value=${String(viewBox[0] || 0)}
                                ?disabled=${this._viewBoxMode === 'auto'}
                                @input=${(e) => this._updateViewBoxValue(0, e.target.value)}>
                            </ha-input>
                            <ha-input
                                style="width: 100%; box-sizing: border-box; min-width: 0;"
                                type="number"
                                label="Min Y"
                                .value=${String(viewBox[1] || 0)}
                                ?disabled=${this._viewBoxMode === 'auto'}
                                @input=${(e) => this._updateViewBoxValue(1, e.target.value)}>
                            </ha-input>
                            <ha-input
                                style="width: 100%; box-sizing: border-box; min-width: 0;"
                                type="number"
                                label="Width"
                                .value=${String(viewBox[2] || 400)}
                                ?disabled=${this._viewBoxMode === 'auto'}
                                @input=${(e) => this._updateViewBoxValue(2, e.target.value)}>
                            </ha-input>
                            <ha-input
                                style="width: 100%; box-sizing: border-box; min-width: 0;"
                                type="number"
                                label="Height"
                                .value=${String(viewBox[3] || 200)}
                                ?disabled=${this._viewBoxMode === 'auto'}
                                @input=${(e) => this._updateViewBoxValue(3, e.target.value)}>
                            </ha-input>
                        </div>
                        ${this._renderViewBoxHelper()}
                    </div>
                </lcards-form-section>

                <!-- Filters Section -->
                <lcards-form-section
                    header="Filters (base_svg)"
                    description="Apply stackable visual filters to the base SVG"
                    icon="mdi:auto-fix"
                    ?expanded=${false}>

                    <lcards-filter-editor
                        .hass=${this.hass}
                        .filters=${baseSvg.filters || []}
                        @filters-changed=${this._handleFiltersChanged}>
                    </lcards-filter-editor>

                </lcards-form-section>

                <!-- Animations Section -->
                <lcards-form-section
                    header="Animations (base_svg)"
                    description="Animate elements inside the base SVG by id/class — separate from the whole-group filter crossfades above"
                    icon="mdi:play-box-outline"
                    ?expanded=${false}>

                    <lcards-animation-editor
                        .hass=${this.hass}
                        .animations=${baseSvg.animations || []}
                        .cardElement=${this._getLivePreviewCardElement()}
                        .searchRootSelector=${'#__msd-base-content'}
                        @animations-changed=${(e) => {
                            this._setNestedValue('msd.base_svg.animations', e.detail.value);
                        }}
                        @refresh-targets=${() => this.requestUpdate()}>
                    </lcards-animation-editor>

                </lcards-form-section>

                <!-- Overlay Group Animations Section -->
                <lcards-form-section
                    header="Animations (Overlay Groups)"
                    description="Bulk-target overlays by CSS selector — e.g. animate every overlay whose id starts with 'shield_' with one declaration"
                    icon="mdi:play-box-multiple-outline"
                    ?expanded=${false}>

                    <lcards-animation-editor
                        .hass=${this.hass}
                        .animations=${this._workingConfig.msd?.animations || []}
                        .cardElement=${this._getLivePreviewCardElement()}
                        .searchRootSelector=${'#msd-overlay-container'}
                        @animations-changed=${(e) => {
                            this._setNestedValue('msd.animations', e.detail.value);
                        }}
                        @refresh-targets=${() => this.requestUpdate()}>
                    </lcards-animation-editor>

                </lcards-form-section>

                <!-- Background Layers Section -->
                <lcards-form-section
                    header="Background Effects (MSD Background)"
                    description="Animated or static-image backgrounds (grids, starfields, images, etc.) — same layer system used by buttons/elbows"
                    icon="mdi:layers-triple-outline"
                    ?expanded=${false}>

                    <lcards-background-animation-editor
                        .hass=${this.hass}
                        .config=${this._workingConfig.msd?.background_animation ?? []}
                        @effects-changed=${(e) => {
                            this._setNestedValue('msd.background_animation', e.detail.value);
                        }}>
                    </lcards-background-animation-editor>

                </lcards-form-section>

                <!-- Performance (Advanced) Section -->
                <lcards-form-section
                    header="Performance (Advanced)"
                    description="Card-wide override for how controls receive updates"
                    icon="mdi:speedometer-slow"
                    secondary=${this._workingConfig.msd?.triggers_update === 'all' ? 'Always update all controls' : 'Default (per-control optimization)'}
                    ?expanded=${this._baseSvgPerformanceExpanded}
                    @expanded-changed=${(e) => {
                        this._baseSvgPerformanceExpanded = e.detail.expanded;
                    }}>

                    <lcards-message type="warning">
                        Discouraged — bypasses the per-control update optimization for every
                        control on this card, refreshing all of them on every Home Assistant
                        state change. This also means any animations configured on those controls
                        (e.g. on_entity_change triggers) get re-evaluated far more often than
                        intended — for state that isn't actually relevant to them — which can
                        show up as animations flickering, restarting, or resetting to their
                        starting state unexpectedly. Prefer the "Update Behavior" option on the
                        individual control that needs it (Controls tab); use this only as a last
                        resort or a quick diagnostic.
                    </lcards-message>

                    <ha-selector
                        style="margin-top: 12px; display: block;"
                        .hass=${this.hass}
                        .label=${'Update all controls on every HASS change'}
                        .selector=${{ boolean: {} }}
                        .value=${this._workingConfig.msd?.triggers_update === 'all'}
                        @value-changed=${(e) => {
                            if (e.detail.value) {
                                this._setNestedValue('msd.triggers_update', 'all');
                                this._baseSvgPerformanceExpanded = true;
                            } else {
                                if (this._workingConfig.msd) {
                                    delete this._workingConfig.msd.triggers_update;
                                }
                                this._schedulePreviewUpdate();
                                this.requestUpdate();
                            }
                        }}>
                    </ha-selector>
                </lcards-form-section>
            </div>
        `;
    }

    /**
     * Render Anchors tab.
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

        // Get base_svg extracted anchors (if any), split into computed
        // (SvgStructureAnalyzer landmarks) vs harvested (named SVG elements) -
        // both are "base_svg" anchors, but conflating them under one label
        // was misleading: harvested anchors can carry noisy, tool-generated
        // ids (e.g. "g293"), while computed anchors are always a fixed,
        // meaningful set (hull_center, extremity_*, lateral_*).
        const baseSvgAnchors = this._getBaseSvgAnchors();
        const { computed: computedAnchors, harvested: harvestedAnchors } = splitBaseSvgAnchorsBySource(baseSvgAnchors);
        const harvestedEntries = Object.entries(harvestedAnchors);
        const computedEntries = Object.entries(computedAnchors);

        const filterQuery = (this._anchorFilterQuery || '').trim().toLowerCase();
        const applyFilter = (entries) => entries.filter(([name]) => !filterQuery || name.toLowerCase().includes(filterQuery));
        const filteredHarvestedEntries = applyFilter(harvestedEntries);
        const filteredComputedEntries = applyFilter(computedEntries);
        const filteredAnchorEntries = applyFilter(anchorEntries);

        const baseSvg = this._workingConfig.msd.base_svg || {};

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

                <!-- Base SVG Harvesting Controls -->
                <lcards-form-section
                    header="Anchor Harvesting"
                    description="Control which automatic anchor sources run against the base SVG"
                    icon="mdi:image-search-outline"
                    ?expanded=${false}
                    style="margin-bottom: 16px;">
                    <ha-selector
                        .hass=${this.hass}
                        .label=${'Harvest SVG elements'}
                        .helper=${'Named <circle>/<ellipse>/<text>/<rect>/<g> elements embedded in the base SVG.'}
                        .selector=${{ boolean: {} }}
                        .value=${baseSvg.harvest_svg_elements !== false}
                        @value-changed=${(e) => {
                            this._setNestedValue('msd.base_svg.harvest_svg_elements', e.detail.value);
                        }}>
                    </ha-selector>

                    <ha-selector
                        style="margin-top: 12px; display: block;"
                        .hass=${this.hass}
                        .label=${'Compute landmark anchors'}
                        .helper=${'hull_center, extremity_bow/stern/top/bottom, lateral_a/b - derived from the SVG silhouette.'}
                        .selector=${{ boolean: {} }}
                        .value=${baseSvg.harvest_landmarks !== false}
                        @value-changed=${(e) => {
                            this._setNestedValue('msd.base_svg.harvest_landmarks', e.detail.value);
                        }}>
                    </ha-selector>
                </lcards-form-section>

                <div style="position: relative; margin-bottom: 16px;">
                    <ha-input
                        label="Filter anchors"
                        placeholder="Filter by name..."
                        .value=${this._anchorFilterQuery}
                        @input=${(e) => { this._anchorFilterQuery = e.target.value; this.requestUpdate(); }}
                        style="width: 100%;">
                        <ha-icon slot="leadingIcon" icon="mdi:magnify"></ha-icon>
                    </ha-input>
                    ${this._anchorFilterQuery ? html`
                        <ha-icon-button
                            style="position: absolute; right: 4px; top: 4px;"
                            @click=${() => { this._anchorFilterQuery = ''; this.requestUpdate(); }}
                            .label=${'Clear filter'}
                            .path=${'M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z'}>
                        </ha-icon-button>
                    ` : ''}
                </div>

                <!-- Base SVG: Harvested (named <circle>/<ellipse>/<text>/<rect>/<g> elements, read-only) -->
                ${harvestedEntries.length > 0 ? html`
                    <lcards-form-section
                        header="Base SVG: Harvested"
                        description="Named elements harvested from the base SVG (read-only)"
                        icon="mdi:image-marker"
                        ?expanded=${false}
                        style="margin-bottom: 16px;">
                        <lcards-message type="info" style="margin-bottom: 12px;">
                            These anchors come from named <code>&lt;circle&gt;</code>/<code>&lt;ellipse&gt;</code>/<code>&lt;text&gt;</code>/<code>&lt;rect&gt;</code>/<code>&lt;g&gt;</code>
                            elements in your base SVG file - ids may be tool-generated and not very meaningful (e.g. "g293").
                            <strong>Define a custom anchor with the same name to override, or use Promote to copy one (and rename it) into User Anchors.</strong>
                        </lcards-message>
                        <div style="display: flex; margin-bottom: 12px;">
                            <ha-button @click=${() => this._promoteAllAnchors(filteredHarvestedEntries)}>
                                <ha-icon icon="mdi:content-duplicate" slot="start"></ha-icon>
                                Promote All${filterQuery ? ` (${filteredHarvestedEntries.length})` : ''}
                            </ha-button>
                        </div>
                        ${filteredHarvestedEntries.length === 0 ? html`
                            <div style="text-align: center; padding: 16px; color: var(--secondary-text-color);">
                                No harvested anchors match "${this._anchorFilterQuery}".
                            </div>
                        ` : html`
                            <div style="display: flex; flex-direction: column; gap: 12px;">
                                ${filteredHarvestedEntries.map(([name, position]) => this._renderBaseSvgAnchorItem(name, position))}
                            </div>
                        `}
                    </lcards-form-section>
                ` : ''}

                <!-- Base SVG: Computed (SvgStructureAnalyzer landmarks, read-only) -->
                ${computedEntries.length > 0 ? html`
                    <lcards-form-section
                        header="Base SVG: Computed"
                        description="Geometric landmark anchors computed from the SVG silhouette (read-only)"
                        icon="mdi:target"
                        ?expanded=${false}
                        style="margin-bottom: 16px;">
                        <lcards-message type="info" style="margin-bottom: 12px;">
                            These anchors are algorithmically derived from your base SVG's silhouette.
                            <strong>Define a custom anchor with the same name to override, or use Promote to copy one into User Anchors.</strong>
                        </lcards-message>
                        <div style="display: flex; margin-bottom: 12px;">
                            <ha-button @click=${() => this._promoteAllAnchors(filteredComputedEntries)}>
                                <ha-icon icon="mdi:content-duplicate" slot="start"></ha-icon>
                                Promote All${filterQuery ? ` (${filteredComputedEntries.length})` : ''}
                            </ha-button>
                        </div>
                        ${filteredComputedEntries.length === 0 ? html`
                            <div style="text-align: center; padding: 16px; color: var(--secondary-text-color);">
                                No computed anchors match "${this._anchorFilterQuery}".
                            </div>
                        ` : html`
                            <div style="display: flex; flex-direction: column; gap: 12px;">
                                ${filteredComputedEntries.map(([name, position]) => this._renderBaseSvgAnchorItem(name, position))}
                            </div>
                        `}
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
                    ` : filteredAnchorEntries.length === 0 ? html`
                        <div style="text-align: center; padding: 16px; color: var(--secondary-text-color);">
                            No user anchors match "${this._anchorFilterQuery}".
                        </div>
                    ` : html`
                        <div style="display: flex; flex-direction: column; gap: 12px;">
                            ${filteredAnchorEntries.map(([name, position]) => this._renderAnchorItem(name, position))}
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
     * Get the live-rendered <lcards-msd-card> instance inside the Studio's own
     * preview pane, if currently mounted. Shared getter for anything needing
     * live DOM access to the preview (e.g. the animation editor's target
     * picker, Phase 11) — same traversal `getBaseSvgAnchors()` already does
     * for anchor harvesting, extracted here since it's duplicated ad hoc
     * throughout this file.
     * @returns {Element|null}
     * @private
     */
    _getLivePreviewCardElement() {
        const livePreview = this.shadowRoot?.querySelector('lcards-msd-live-preview');
        const cardContainer = livePreview?.shadowRoot?.querySelector('.preview-card-container');
        return cardContainer?.querySelector('lcards-msd-card') || null;
    }

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
            <div class="list-item-card" style="opacity: 0.85;">
                <div style="display: flex; align-items: center; gap: 12px; flex-wrap: wrap;">
                    <ha-icon icon="mdi:image-marker" style="--mdc-icon-size: 32px; color: var(--info-color, #2196F3); flex-shrink: 0;"></ha-icon>
                    <div style="flex: 1; min-width: 140px;">
                        <div style="font-weight: 600; margin-bottom: 4px; display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
                            ${name}
                            <span style="font-size: 11px; background: var(--info-color, #2196F3); color: white; padding: 2px 6px; border-radius: 4px;">BASE SVG</span>
                        </div>
                        <div style="font-size: 12px; color: var(--secondary-text-color);">
                            Position: [${x}, ${y}]
                        </div>
                    </div>
                    <div style="display: flex; gap: 8px; flex-shrink: 0; margin-left: auto;">
                        <ha-icon-button
                            @click=${() => this._promoteAnchorToUser(name, position)}
                            .label=${'Promote to User Anchor'}
                            .path=${'M19,13H13V19H11V13H5V11H11V5H13V11H19V13Z'}>
                        </ha-icon-button>
                        <ha-icon-button
                            @click=${() => this._highlightAnchorInPreview(name)}
                            .label=${'Highlight'}
                            .path=${'M12,2A7,7 0 0,1 19,9C19,11.38 17.19,13.47 14.39,17.31C13.57,18.45 12.61,19.74 12,20.65C11.39,19.74 10.43,18.45 9.61,17.31C6.81,13.47 5,11.38 5,9A7,7 0 0,1 12,2M12,6A3,3 0 0,0 9,9A3,3 0 0,0 12,12A3,3 0 0,0 15,9A3,3 0 0,0 12,6Z'}>
                        </ha-icon-button>
                    </div>
                </div>
            </div>
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
            <div class="list-item-card">
                <div style="display: flex; align-items: center; gap: 12px; flex-wrap: wrap;">
                    <ha-icon icon="mdi:map-marker" style="--mdc-icon-size: 32px; color: var(--primary-color); flex-shrink: 0;"></ha-icon>
                    <div style="flex: 1; min-width: 140px;">
                        <div style="font-weight: 600; margin-bottom: 4px;">${name}</div>
                        <div style="font-size: 12px; color: var(--secondary-text-color);">
                            Position: [${x}, ${y}]
                        </div>
                    </div>
                    <div style="display: flex; gap: 8px; flex-shrink: 0; margin-left: auto;">
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
            </div>
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
                @closed=${(e) => { e.stopPropagation(); this._closeAnchorForm(); }}
                .headerTitle=${title}
                style="--ha-dialog-width-md: 500px;">
                <div style="padding: 12px 8px;">
                    ${wouldOverride ? html`
                        <lcards-message type="info" style="margin-bottom: 16px;">
                            This name exists in the base_svg. Your custom anchor will override the SVG anchor.
                        </lcards-message>
                    ` : ''}

                    <ha-input
                        label="Anchor Name"
                        .value=${this._anchorFormName}
                        @input=${(e) => {
                            this._anchorFormName = e.target.value;
                            this.requestUpdate(); // Force re-render to update override message
                        }}
                        required
                        hint="Unique identifier for this anchor"
                        style="width: 100%; margin-bottom: 16px;">
                    </ha-input>

                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
                        <ha-input
                            type="number"
                            label="X Position"
                            .value=${String(this._anchorFormPosition[0] || 0)}
                            @input=${(e) => this._updateAnchorFormPosition(0, e.target.value)}>
                        </ha-input>
                        <ha-input
                            type="number"
                            label="Y Position"
                            .value=${String(this._anchorFormPosition[1] || 0)}
                            @input=${(e) => this._updateAnchorFormPosition(1, e.target.value)}>
                        </ha-input>
                    </div>
                </div>

                <div slot="footer">
                    <ha-button @click=${this._closeAnchorForm} appearance="plain">
                        <ha-icon icon="mdi:close" slot="start"></ha-icon>
                        Cancel
                    </ha-button>
                    <ha-button @click=${this._saveAnchor}>
                        <ha-icon icon="mdi:content-save" slot="start"></ha-icon>
                        Save
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
     * Open the anchor form pre-filled from a harvested base-SVG anchor, so the
     * user can rename it (e.g. "g293" -> "shuttlebay") before it's saved as a
     * new msd.anchors entry. Unlike _editAnchor(), _editingAnchorName is left
     * null - this always creates a new user anchor, never renames one, since
     * the source name isn't a msd.anchors key to begin with.
     * @param {string} name - Harvested anchor name
     * @param {Array} position - Anchor position [x, y]
     * @private
     */
    _promoteAnchorToUser(name, position) {
        this._showAnchorForm = true;
        this._editingAnchorName = null;
        this._anchorFormName = name;
        this._anchorFormPosition = Array.isArray(position) ? [...position] : [0, 0];
        this._anchorFormUnit = 'vb';
        this.requestUpdate();
    }

    /**
     * Bulk-copy a set of harvested base-SVG anchors into msd.anchors under
     * their existing (harvested) names, skipping any that would collide with
     * an already-defined user anchor. No renaming - use per-row Promote (or
     * the normal Edit flow afterward) for that.
     * @param {Array<[string, Array]>} entries - [name, [x, y]] pairs to promote
     * @private
     */
    async _promoteAllAnchors(entries) {
        const existingAnchors = this._workingConfig.msd?.anchors || {};
        const toPromote = entries.filter(([name]) => !existingAnchors[name]);

        if (toPromote.length === 0) {
            await this._showDialog('Nothing to Promote', 'All listed anchors already exist as user anchors.', 'info');
            return;
        }

        const confirmed = await this._showConfirmDialog(
            'Promote All',
            `Copy ${toPromote.length} base SVG anchor${toPromote.length === 1 ? '' : 's'} into User Anchors?`,
            { confirmLabel: 'Promote', variant: 'primary' }
        );
        if (!confirmed) return;

        for (const [name, position] of toPromote) {
            const roundedPosition = [
                this._roundToPrecision(position[0]),
                this._roundToPrecision(position[1])
            ];
            this._setNestedValue(`msd.anchors.${name}`, roundedPosition);
        }

        lcardsLog.info(`[MSDStudio] Promoted ${toPromote.length} base SVG anchors to user anchors`);
        this._schedulePreviewUpdate();
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
     * @param {Object} [options]
     * @param {string} [options.confirmLabel='Delete'] - Confirm button text
     * @param {string} [options.variant='danger'] - Confirm button variant
     * @returns {Promise<boolean>} True if confirmed, false if cancelled
     */
    // @ts-ignore - TS2393: auto-suppressed
    async _showConfirmDialog(title, message, options = {}) {
        const { confirmLabel = 'Delete', variant = 'danger' } = options;
        return new Promise((resolve) => {
            const dialog = document.createElement('ha-dialog');
            // @ts-ignore - TS2339: auto-suppressed
            dialog.headerTitle = title;
            // @ts-ignore - TS2339: auto-suppressed
            dialog.open = true;

            const content = document.createElement('div');
            content.innerHTML = message;
            content.style.padding = '16px';
            content.style.lineHeight = '1.5';
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

            // Confirm button
            const confirmButton = document.createElement('ha-button');
            confirmButton.slot = 'footer';
            confirmButton.textContent = confirmLabel;
            confirmButton.setAttribute('variant', variant);
            confirmButton.addEventListener('click', () => {
                // @ts-ignore - TS2339: auto-suppressed
                dialog.open = false;
                resolve(true);
            });

            const footerDiv = document.createElement('div');
            footerDiv.slot = 'footer';
            footerDiv.appendChild(cancelButton);
            footerDiv.appendChild(confirmButton);
            dialog.appendChild(footerDiv);

            dialog.addEventListener('closed', () => {
                dialog.remove();
            });

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

        // Finish an in-progress polyline shape (open-ended click-to-append, same
        // as ADD_WAYPOINT's precedent — double-click is the "I'm done" signal)
        if (this._activeMode === MODES.DRAW_SHAPE && this._drawShapeState.kind === 'polyline') {
            event.stopPropagation();
            event.preventDefault();
            this._finishDrawShapePolyline();
            return;
        }

        // Check if double-clicked on a line path element or hit area
        // @ts-ignore - TS2339: auto-suppressed
        if ((clickedElement.tagName === 'path' && clickedElement.classList.contains('line-path')) ||
            // @ts-ignore - TS2339: auto-suppressed
            (clickedElement.tagName === 'path' && clickedElement.classList.contains('line-hit-area'))) {

            // Get line ID
            let lineId;
            // @ts-ignore - TS2339: auto-suppressed
            if (clickedElement.classList.contains('line-hit-area')) {
                // @ts-ignore - TS2339: auto-suppressed
                const visiblePath = clickedElement.nextElementSibling;
                lineId = visiblePath?.getAttribute('data-line-id');
            } else {
                // @ts-ignore - TS2339: auto-suppressed
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

        // Cancel pending single-click timer for shapes
        if (this._shapeClickTimer) {
            clearTimeout(this._shapeClickTimer);
            this._shapeClickTimer = null;
        }

        // Check if double-clicked on a shape's path/rect/ellipse or hit area.
        // shape-path renders as <path> for polyline, <rect> for rect, <ellipse>
        // for circle — rect/circle have no separate hit-area (pointer-events:
        // all is set directly on the main element instead).
        // @ts-ignore - TS2339: auto-suppressed
        if (clickedElement.classList?.contains('shape-path') ||
            // @ts-ignore - TS2339: auto-suppressed
            (clickedElement.tagName === 'path' && clickedElement.classList.contains('shape-hit-area'))) {
            let shapeId;
            // @ts-ignore - TS2339: auto-suppressed
            if (clickedElement.classList.contains('shape-hit-area')) {
                // @ts-ignore - TS2339: auto-suppressed
                const visiblePath = clickedElement.nextElementSibling;
                shapeId = visiblePath?.getAttribute('data-shape-id');
            } else {
                // @ts-ignore - TS2339: auto-suppressed
                shapeId = clickedElement.getAttribute('data-shape-id');
            }

            if (shapeId) {
                const overlays = this._workingConfig.msd?.overlays || [];
                const shapeOverlay = overlays.find(o => o.id === shapeId && o.type === 'shape');
                if (shapeOverlay) {
                    this._editShape(shapeOverlay);
                } else {
                    lcardsLog.warn('[MSDStudioDialog] Shape not found:', shapeId);
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
            // @ts-ignore - TS2339: auto-suppressed
            tagName: clickedElement.tagName,
            // @ts-ignore - TS2339: auto-suppressed
            classList: clickedElement.classList ? Array.from(clickedElement.classList) : [],
            // @ts-ignore - TS2339: auto-suppressed
            dataset: clickedElement.dataset || {},
            // @ts-ignore - TS2339: auto-suppressed
            hasAnchorName: clickedElement.hasAttribute?.('data-anchor-name')
        });

        // Check for line clicks in VIEW mode or ADD_WAYPOINT mode (for selection)
        if (this._activeMode === MODES.VIEW || this._activeMode === MODES.ADD_WAYPOINT) {
            // Check if clicked on a line path element or hit area
            // @ts-ignore - TS2339: auto-suppressed
            if ((clickedElement.tagName === 'path' && clickedElement.classList.contains('line-path')) ||
                // @ts-ignore - TS2339: auto-suppressed
                (clickedElement.tagName === 'path' && clickedElement.classList.contains('line-hit-area'))) {
                // For hit area, find the corresponding visible path to get line-id
                let lineId;
                // @ts-ignore - TS2339: auto-suppressed
                if (clickedElement.classList.contains('line-hit-area')) {
                    // Hit area doesn't have data-line-id, so find the next sibling (visible path)
                    // @ts-ignore - TS2339: auto-suppressed
                    const visiblePath = clickedElement.nextElementSibling;
                    lineId = visiblePath?.getAttribute('data-line-id');
                } else {
                    // @ts-ignore - TS2339: auto-suppressed
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

            // Check for polyline shape clicks (rect/circle are selected directly via
            // their always-visible bbox handles when "Bounding Boxes" is on — see
            // _renderShapeHandles — so only polyline needs click-to-select here,
            // since its vertex markers only render for the selected shape).
            // @ts-ignore - TS2339: auto-suppressed
            if ((clickedElement.tagName === 'path' && clickedElement.classList.contains('shape-path')) ||
                // @ts-ignore - TS2339: auto-suppressed
                (clickedElement.tagName === 'path' && clickedElement.classList.contains('shape-hit-area'))) {
                let shapeId;
                // @ts-ignore - TS2339: auto-suppressed
                if (clickedElement.classList.contains('shape-hit-area')) {
                    // @ts-ignore - TS2339: auto-suppressed
                    const visiblePath = clickedElement.nextElementSibling;
                    shapeId = visiblePath?.getAttribute('data-shape-id');
                } else {
                    // @ts-ignore - TS2339: auto-suppressed
                    shapeId = clickedElement.getAttribute('data-shape-id');
                }
                if (shapeId) {
                    if (this._shapeClickTimer) {
                        clearTimeout(this._shapeClickTimer);
                        this._shapeClickTimer = null;
                    }
                    this._shapeClickTimer = setTimeout(() => {
                        this._selectedShapeId = shapeId;
                        this.requestUpdate();
                        this._shapeClickTimer = null;
                    }, 250);
                    event.stopPropagation();
                    return;
                }
            }

            // If in VIEW mode and clicked background, deselect
            if (this._activeMode === MODES.VIEW) {
                // Don't deselect if the click was the tail of a pan drag
                if (this._panJustEnded) return;
                this._selectedLineId = null;
                this._selectedShapeId = null;
                this.requestUpdate();
                return;
            }
        }

        // Handle waypoint mode
        if (this._activeMode === MODES.ADD_WAYPOINT) {
            // Check if clicked on anchor marker (for named waypoint)
            // @ts-ignore - TS2339: auto-suppressed
            const isAnchorMarker = clickedElement.classList?.contains('anchor-marker') ||
                                   // @ts-ignore - TS2339: auto-suppressed
                                   clickedElement.classList?.contains('interactive-anchor') ||
                                   // @ts-ignore - TS2339: auto-suppressed
                                   clickedElement.hasAttribute?.('data-anchor-name');

            if (isAnchorMarker) {
                // @ts-ignore - TS2339: auto-suppressed
                const anchorName = clickedElement.getAttribute('data-anchor-name');
                if (anchorName && this._selectedLineId) {
                    this._addNamedWaypoint(anchorName);
                    event.stopPropagation();
                    return;
                }
            }

            // Check if clicked on waypoint marker (don't add new waypoint)
            // @ts-ignore - TS2339: auto-suppressed
            if (clickedElement.classList?.contains('waypoint-marker')) {
                event.stopPropagation();
                return;
            }

            // Check if clicked on empty canvas area (exit waypoint mode)
            // @ts-ignore - TS2339: auto-suppressed
            const isEmptyArea = clickedElement.tagName === 'DIV' &&
                               // @ts-ignore - TS2339: auto-suppressed
                               (clickedElement.classList.contains('preview-scroll-container') ||
                                // @ts-ignore - TS2339: auto-suppressed
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
        } else if (this._activeMode === MODES.DRAW_SHAPE) {
            this._handleDrawShapeClick(event);
        }
    }

    /**
     * Arm a pending drag candidate for rect/circle draw shapes, so a
     * mousedown+drag+mouseup can commit the shape in one motion (promoted to
     * an active draw in _handlePreviewMouseMove once the pointer moves past a
     * small threshold, committed on release in _handleDragEnd). Deliberately
     * separate from _drawShapeState: if no drag ever happens, this is simply
     * left unconverted and the existing click-then-click flow in
     * _handleDrawShapeClick proceeds completely unaffected.
     * @param {MouseEvent} event - Mouse down event
     * @private
     */
    _handlePreviewMouseDown(event) {
        if (
            this._activeMode === MODES.DRAW_SHAPE &&
            (this._drawShapeState.kind === 'rect' || this._drawShapeState.kind === 'circle') &&
            this._drawShapeState.points.length === 0
        ) {
            const coords = this._getPreviewCoordinates(event);
            if (!coords) return;

            this._shapeDrawDragCandidate = {
                startClientX: event.clientX,
                startClientY: event.clientY,
                startCoords: [coords.x, coords.y],
                converted: false
            };
            return;
        }

        // Same drag-candidate treatment for routing channels, mirroring the
        // shape flow above exactly (see _finishDrawChannel/_handleDragEnd).
        if (this._activeMode === MODES.DRAW_CHANNEL && !this._drawChannelState.startPoint) {
            const coords = this._getPreviewCoordinates(event);
            if (!coords) return;

            this._channelDrawDragCandidate = {
                startClientX: event.clientX,
                startClientY: event.clientY,
                startCoords: [coords.x, coords.y],
                converted: false
            };
            return;
        }

        // Same drag-candidate treatment for Place Control (see
        // _finishPlaceControl/_handleDragEnd).
        if (this._activeMode === MODES.PLACE_CONTROL && !this._placeControlDrawState.startPoint) {
            const coords = this._getPreviewCoordinates(event);
            if (!coords) return;

            this._controlDrawDragCandidate = {
                startClientX: event.clientX,
                startClientY: event.clientY,
                startCoords: [coords.x, coords.y],
                converted: false
            };
        }
    }

    /**
     * Handle preview mousemove for crosshair and draw modes
     * @param {MouseEvent} event - Mouse event
     * @private
     */
    _handlePreviewMouseMove(event) {
        // Promote a pending draw-shape drag candidate into an active draw
        // once the pointer has moved past a small click-vs-drag threshold.
        // Once promoted, the existing DRAW_SHAPE tracking below (which now
        // sees points.length > 0) takes over the rubber-band preview as-is.
        if (this._shapeDrawDragCandidate && !this._shapeDrawDragCandidate.converted) {
            const dx = event.clientX - this._shapeDrawDragCandidate.startClientX;
            const dy = event.clientY - this._shapeDrawDragCandidate.startClientY;
            if (Math.hypot(dx, dy) > 4) {
                this._shapeDrawDragCandidate.converted = true;
                this._drawShapeState = {
                    kind: this._drawShapeState.kind,
                    points: [this._shapeDrawDragCandidate.startCoords],
                    drawing: true,
                    currentPoint: null
                };
            }
        }

        // Same promotion for a pending draw-channel drag candidate — once
        // converted, the existing DRAW_CHANNEL tracking below (which now sees
        // drawing:true) takes over the rubber-band preview as-is.
        if (this._channelDrawDragCandidate && !this._channelDrawDragCandidate.converted) {
            const dx = event.clientX - this._channelDrawDragCandidate.startClientX;
            const dy = event.clientY - this._channelDrawDragCandidate.startClientY;
            if (Math.hypot(dx, dy) > 4) {
                this._channelDrawDragCandidate.converted = true;
                this._drawChannelState = {
                    startPoint: this._channelDrawDragCandidate.startCoords,
                    currentPoint: null,
                    drawing: true,
                    tempRectElement: null
                };
            }
        }

        // Same promotion for a pending Place Control drag candidate — once
        // converted, the tracking block below takes over the rubber-band preview.
        if (this._controlDrawDragCandidate && !this._controlDrawDragCandidate.converted) {
            const dx = event.clientX - this._controlDrawDragCandidate.startClientX;
            const dy = event.clientY - this._controlDrawDragCandidate.startClientY;
            if (Math.hypot(dx, dy) > 4) {
                this._controlDrawDragCandidate.converted = true;
                this._placeControlDrawState = {
                    startPoint: this._controlDrawDragCandidate.startCoords,
                    currentPoint: null,
                    drawing: true
                };
            }
        }

        // Note: existing-overlay drag/resize (control/shape/anchor/channel move
        // and resize) no longer dispatch from here — each owns a self-contained
        // document-level mousemove listener attached at drag-start (see
        // _handleDragStart and its 6 siblings), so this container-scoped
        // handler is free to always run the crosshair/rubber-band tracking
        // below without a drag-in-progress early return.

        // Track cursor for crosshair guidelines (when enabled OR in placement modes).
        // This is independent of — not mutually exclusive with — the draw-channel/
        // draw-shape tracking below: crosshairs default ON, so an if/else-if chain
        // here previously meant the rubber-band preview for both DRAW_CHANNEL and
        // DRAW_SHAPE never ran while crosshairs were enabled (the default state).
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
        if (this._activeMode === MODES.DRAW_CHANNEL && this._drawChannelState.drawing) {
            const coords = this._getPreviewCoordinates(event);
            if (coords) {
                this._drawChannelState.currentPoint = [coords.x, coords.y];
                this.requestUpdate();
            }
        }
        // Track mouse for Place Control rubber-band preview
        if (this._activeMode === MODES.PLACE_CONTROL && this._placeControlDrawState.drawing) {
            const coords = this._getPreviewCoordinates(event);
            if (coords) {
                this._placeControlDrawState.currentPoint = [coords.x, coords.y];
                this.requestUpdate();
            }
        }
        // Track mouse for draw shape rubber-band preview (rect/circle bbox drag,
        // or the "next segment" line while building a polyline)
        if (this._activeMode === MODES.DRAW_SHAPE && this._drawShapeState.points.length > 0) {
            const coords = this._getPreviewCoordinates(event);
            if (coords) {
                this._drawShapeState.currentPoint = [coords.x, coords.y];
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
        // Clear Place Control current point
        if (this._placeControlDrawState.drawing) {
            this._placeControlDrawState.currentPoint = null;
        }

        // Clear an unconverted draw-shape drag candidate — if the drag was
        // already promoted (converted), leave it: the eventual mouseup will
        // still be caught by the document-level _handleDragEnd and finish it
        // correctly from that event's own coordinates, even outside the canvas.
        if (this._shapeDrawDragCandidate && !this._shapeDrawDragCandidate.converted) {
            this._shapeDrawDragCandidate = null;
        }
        if (this._channelDrawDragCandidate && !this._channelDrawDragCandidate.converted) {
            this._channelDrawDragCandidate = null;
        }
        if (this._controlDrawDragCandidate && !this._controlDrawDragCandidate.converted) {
            this._controlDrawDragCandidate = null;
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
     * Handle place control click — 2-click bbox draw (mirrors
     * _handleDrawChannelClick exactly; click-drag is handled the same way
     * too, via _controlDrawDragCandidate/_handleDragEnd).
     * @param {MouseEvent} event - Click event
     * @private
     */
    _handlePlaceControlClick(event) {
        lcardsLog.debug(`[MSDStudio] _handlePlaceControlClick ENTRY - mode: ${this._activeMode}`);

        const coords = this._getPreviewCoordinates(event);
        if (!coords) {
            lcardsLog.warn('[MSDStudio] Could not get preview coordinates');
            return;
        }

        if (!this._placeControlDrawState.startPoint) {
            // First click: start drawing. Invalidate any drag candidate this
            // click's own mousedown may have armed (see _handleDrawChannelClick
            // for why — avoids a stale candidate confusing the second click).
            this._placeControlDrawState.startPoint = [coords.x, coords.y];
            this._placeControlDrawState.drawing = true;
            this._controlDrawDragCandidate = null;
            lcardsLog.trace('[MSDStudio] Place control draw started at:', coords);
            this.requestUpdate();
            return;
        }

        this._finishPlaceControl(this._placeControlDrawState.startPoint, [coords.x, coords.y]);
    }

    /**
     * Finish a Place Control draw given its two opposite corners
     * (viewBox-space) and open the control form pre-filled with the drawn
     * position/size — shared by the click-click flow
     * (_handlePlaceControlClick) and the click-drag flow
     * (_handleDragEnd/_handlePreviewMouseDown).
     *
     * A near-zero drag (a plain click, or two clicks in nearly the same
     * spot) falls back to the old fixed 100x100-centered-on-click behavior,
     * so simply clicking still works exactly as before for anyone who
     * doesn't want to bother drawing a size.
     * @param {[number, number]} startPoint - First corner
     * @param {[number, number]} endPoint - Opposite corner
     * @private
     */
    _finishPlaceControl(startPoint, endPoint) {
        const [startX, startY] = startPoint;
        const [endX, endY] = endPoint;
        const rawWidth = Math.abs(endX - startX);
        const rawHeight = Math.abs(endY - startY);

        let centerX, centerY, width, height;
        if (rawWidth < 10 && rawHeight < 10) {
            centerX = startX;
            centerY = startY;
            width = 100;
            height = 100;
        } else {
            const x = Math.min(startX, endX);
            const y = Math.min(startY, endY);
            width = rawWidth;
            height = rawHeight;
            centerX = x + width / 2;
            centerY = y + height / 2;
        }

        this._placeControlDrawState = { startPoint: null, currentPoint: null, drawing: false };
        this._controlDrawDragCandidate = null;

        // Generate control ID
        const overlays = this._workingConfig.msd?.overlays || [];
        let controlNum = overlays.filter(o => o.type === 'control').length + 1;
        let controlId = `control_${controlNum}`;
        while (overlays.find(o => o.id === controlId)) {
            controlNum++;
            controlId = `control_${controlNum}`;
        }

        // Open control form with the drawn box. position is the box's
        // center to match the attachment: 'center' default (see
        // _editControl/the form's own defaults) — not the top-left corner.
        this._editingControlId = controlId;
        this._controlFormId = controlId;
        this._controlFormPosition = [Math.round(centerX), Math.round(centerY)];
        this._controlFormSize = [Math.round(width), Math.round(height)];
        this._controlFormAttachment = 'center';
        this._controlFormPositionSide = 'center';
        // Default new controls to obstacle:true so routed lines get real
        // avoidance against them out of the box (see RouterCore.js's
        // _computeManhattan/goal-cell fixes for why this is now safe).
        this._controlFormObstacle = true;
        this._controlFormZIndex = null;
        this._controlFormTriggersUpdateMode = 'specific';
        this._controlFormTriggersUpdateEntities = [];
        this._controlFormTriggersUpdateExpanded = false;
        this._controlFormCard = { type: '' };
        this._controlFormAnimations = [];
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
        // @ts-ignore - TS2339: auto-suppressed
        const anchors = msdCard?._msdPipeline?.getResolvedModel()?.anchors || {};

        let currentPosition;
        if (control.position && Array.isArray(control.position)) {
            currentPosition = [...control.position];
        } else if (control.position || control.anchor) {
            // Position/anchor is a string reference — named anchor or another control's id.
            currentPosition = this._resolveEditorControlPosition(control, anchors);
            if (!currentPosition) {
                lcardsLog.warn('[MSDStudio] Could not resolve position for drag:', control.position || control.anchor);
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

        // Self-contained document-level listeners (mirrors the Shape Vertex /
        // Waypoint drag pattern) instead of relying on the single mousemove
        // listener scoped to .preview-scroll-container — the bbox/handle
        // overlays this drag starts from are rendered as DOM siblings of that
        // container, not descendants, so a container-scoped listener misses
        // mousemove whenever the cursor stays over those overlay elements
        // (this is what made resize-to-shrink appear frozen, and what made
        // repositioning glitchy near the panel edges).
        if (this._boundDragMouseMove) document.removeEventListener('mousemove', this._boundDragMouseMove);
        if (this._boundDragMouseUp) document.removeEventListener('mouseup', this._boundDragMouseUp);
        this._boundDragMouseMove = this._handleDrag.bind(this);
        this._boundDragMouseUp = this._handleDragMouseUp.bind(this);
        document.addEventListener('mousemove', this._boundDragMouseMove);
        document.addEventListener('mouseup', this._boundDragMouseUp);

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
     * Handle drag end (mouseup) — self-contained document-level counterpart
     * to _handleDragStart's listener, mirrors _handleShapeVertexMouseUp.
     * @param {MouseEvent} event - Mouse up event
     * @private
     */
    _handleDragMouseUp(event) {
        if (!this._dragState.active) return;

        lcardsLog.debug('[MSDStudio] Drag end:', this._dragState.controlId);

        const previewPanel = this.shadowRoot.querySelector('.preview-panel');
        if (previewPanel) {
            previewPanel.classList.remove('dragging');
        }

        this._dragState = {
            active: false,
            controlId: null,
            startPos: null,
            originalPos: null,
            offsetX: 0,
            offsetY: 0
        };

        if (this._boundDragMouseMove) {
            document.removeEventListener('mousemove', this._boundDragMouseMove);
            this._boundDragMouseMove = null;
        }
        if (this._boundDragMouseUp) {
            document.removeEventListener('mouseup', this._boundDragMouseUp);
            this._boundDragMouseUp = null;
        }

        this._schedulePreviewUpdate();
        this.requestUpdate();
    }

    /**
     * Global document-level mouseup handler (bound once for the dialog's
     * lifetime in connectedCallback). Now scoped to just the click-drag
     * new-overlay-placement candidates (draw shape/channel/place control) —
     * the 7 existing-overlay drag/resize types each own their own
     * self-contained start/move/up listener triplet instead (see
     * _handleDragStart/_handleDragMouseUp and its siblings).
     * @param {MouseEvent} event - Mouse up event
     * @private
     */
    _handleDragEnd(event) {
        // Clear mousedown tracking
        this._mouseDownPos = null;

        // Commit a rect/circle draw-shape drag on release. Document-level (not
        // container-scoped) so this still fires and computes the correct end
        // point even if the mouse was released outside the preview canvas.
        if (this._shapeDrawDragCandidate?.converted) {
            const coords = this._getPreviewCoordinates(event);
            if (coords && this._drawShapeState.points.length) {
                this._finishDrawShapeRect(this._drawShapeState.kind, this._drawShapeState.points[0], [coords.x, coords.y]);
                this.requestUpdate();
            } else {
                this._shapeDrawDragCandidate = null;
            }
        }

        // Same treatment for a routing-channel drag (see _handlePreviewMouseDown/MouseMove).
        if (this._channelDrawDragCandidate?.converted) {
            const coords = this._getPreviewCoordinates(event);
            if (coords && this._drawChannelState.startPoint) {
                this._finishDrawChannel(this._drawChannelState.startPoint, [coords.x, coords.y]);
                this.requestUpdate();
            } else {
                this._channelDrawDragCandidate = null;
            }
        }

        // Same treatment for a Place Control drag (see _handlePreviewMouseDown/MouseMove).
        if (this._controlDrawDragCandidate?.converted) {
            const coords = this._getPreviewCoordinates(event);
            if (coords && this._placeControlDrawState.startPoint) {
                this._finishPlaceControl(this._placeControlDrawState.startPoint, [coords.x, coords.y]);
                this.requestUpdate();
            } else {
                this._controlDrawDragCandidate = null;
            }
        }

    }

    /**
     * Offset from a control's configured anchor point (control.position,
     * interpreted per its `attachment`) to the box's actual top-left corner.
     * Single source of truth for logic previously duplicated verbatim in
     * _renderBoundingBoxes, the control highlight renderer, and the
     * attachment-points overlay — also used by resize (see _handleResizeStart/
     * _handleResize) to convert between the anchor-point control.position
     * stores and the top-left-corner coordinate space the resize math uses.
     * @param {string} attachment
     * @param {number} width
     * @param {number} height
     * @returns {[number, number]}
     * @private
     */
    _getAttachmentOffset(attachment, width, height) {
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
        return offsetMap[attachment] || offsetMap['top-left'];
    }

    /**
     * Live dimension/coordinate readout shown only while a control/shape/
     * channel is actively being dragged or resized — resize shows the
     * current W × H, drag shows the current position (for controls, this is
     * the configured attach/anchor point — control.position — not
     * necessarily the visual top-left corner; see _getAttachmentOffset).
     * Rendered as a child of the caller's already-positioned bbox/channel
     * div, so it needs no pixel-coordinate math of its own.
     * @param {boolean} isDragging
     * @param {boolean} isResizing
     * @param {[number, number]|null} dragPoint - live [x, y] while dragging
     * @param {[number, number]|null} resizeSize - live [width, height] while resizing
     * @returns {TemplateResult|string}
     * @private
     */
    _renderLiveCoordBadge(isDragging, isResizing, dragPoint, resizeSize) {
        if (isResizing && Array.isArray(resizeSize)) {
            const [w, h] = resizeSize;
            return html`
                <div class="live-coord-badge" style="top: 50%; left: 50%; transform: translate(-50%, -50%);">
                    ${Math.round(w)} × ${Math.round(h)}
                </div>
            `;
        }
        if (isDragging && Array.isArray(dragPoint)) {
            const [x, y] = dragPoint;
            return html`
                <div class="live-coord-badge" style="bottom: -28px; left: 50%; transform: translateX(-50%);">
                    ${Math.round(x)}, ${Math.round(y)}
                </div>
            `;
        }
        return '';
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
        // @ts-ignore - TS2339: auto-suppressed
        const anchors = msdCard?._msdPipeline?.getResolvedModel()?.anchors || {};

        let currentPosition;
        if (control.position && Array.isArray(control.position)) {
            currentPosition = [...control.position];
        } else if (control.position || control.anchor) {
            // Position/anchor is a string reference — named anchor or another control's id.
            currentPosition = this._resolveEditorControlPosition(control, anchors);
            if (!currentPosition) {
                lcardsLog.warn('[MSDStudio] Could not resolve position for resize:', control.position || control.anchor);
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

        // control.position is the control's configured anchor point (e.g. its
        // CENTER for the default attachment: 'center', not its top-left corner)
        // — see _getAttachmentOffset. The resize math below operates in
        // top-left-corner space (each handle's delta is applied directly to a
        // corner), so convert once here and convert back on write in
        // _handleResize. Without this, any handle that also repositions the
        // box (tl/t/tr/l/bl) drifted at up to 1.5x the cursor's actual
        // movement, worst for 'tl' where both axes compound at once.
        const attachment = control.attachment || 'center';
        const startOffset = this._getAttachmentOffset(attachment, currentSize[0], currentSize[1]);
        const topLeftPosition = [currentPosition[0] + startOffset[0], currentPosition[1] + startOffset[1]];

        // Set resize state
        this._resizeState = {
            active: true,
            controlId,
            handle,
            startPos: [coords.x, coords.y],
            startSize: currentSize,
            startPosition: topLeftPosition
        };

        // Self-contained document-level listeners — see _handleDragStart for why.
        if (this._boundResizeMouseMove) document.removeEventListener('mousemove', this._boundResizeMouseMove);
        if (this._boundResizeMouseUp) document.removeEventListener('mouseup', this._boundResizeMouseUp);
        this._boundResizeMouseMove = this._handleResize.bind(this);
        this._boundResizeMouseUp = this._handleResizeMouseUp.bind(this);
        document.addEventListener('mousemove', this._boundResizeMouseMove);
        document.addEventListener('mouseup', this._boundResizeMouseUp);

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

        // newX/newY above are the box's top-left corner (the coordinate space
        // this switch operates in) — convert back to the anchor-point space
        // control.position actually stores (see _getAttachmentOffset and the
        // matching forward conversion in _handleResizeStart), using the
        // (possibly clamped/snapped) final width/height.
        const attachment = control.attachment || 'center';
        const endOffset = this._getAttachmentOffset(attachment, newWidth, newHeight);
        const anchorX = newX - endOffset[0];
        const anchorY = newY - endOffset[1];

        // Update control
        control.size = [this._roundToPrecision(newWidth), this._roundToPrecision(newHeight)];
        control.position = [this._roundToPrecision(anchorX), this._roundToPrecision(anchorY)];

        this.requestUpdate();
    }

    /**
     * Handle resize end (mouseup) — self-contained counterpart to
     * _handleResizeStart's listener, mirrors _handleShapeVertexMouseUp.
     * @param {MouseEvent} event - Mouse up event
     * @private
     */
    _handleResizeMouseUp(event) {
        if (!this._resizeState.active) return;

        lcardsLog.debug('[MSDStudio] Resize end:', this._resizeState.controlId);

        this._resizeState = {
            active: false,
            controlId: null,
            handle: null,
            startPos: null,
            startSize: null,
            startPosition: null
        };

        if (this._boundResizeMouseMove) {
            document.removeEventListener('mousemove', this._boundResizeMouseMove);
            this._boundResizeMouseMove = null;
        }
        if (this._boundResizeMouseUp) {
            document.removeEventListener('mouseup', this._boundResizeMouseUp);
            this._boundResizeMouseUp = null;
        }

        this._schedulePreviewUpdate();
        this.requestUpdate();
    }

    // ============================
    // Shape Drag/Resize Methods (rect/circle) — mirrors Control Drag/Resize
    // Methods above exactly, operating on a shape overlay's position/size
    // instead of a control's. Kept as separate state/handlers (not reusing
    // _dragState/_resizeState) so this can't regress working control dragging.
    // ============================

    /**
     * Handle shape drag start (whole-shape move)
     * @param {MouseEvent} event
     * @param {string} shapeId
     * @private
     */
    _handleShapeDragStart(event, shapeId) {
        event.stopPropagation();
        event.preventDefault();

        const shape = this._findControl(shapeId);
        if (!shape || !Array.isArray(shape.position)) {
            lcardsLog.warn('[MSDStudio] Shape not found or has no literal position for drag:', shapeId);
            return;
        }

        const coords = this._getPreviewCoordinatesFromMouseEvent(event);
        if (!coords) return;

        const currentPosition = [...shape.position];
        this._shapeDragState = {
            active: true,
            shapeId,
            startPos: [coords.x, coords.y],
            originalPos: currentPosition,
            offsetX: coords.x - currentPosition[0],
            offsetY: coords.y - currentPosition[1]
        };

        const previewPanel = this.shadowRoot.querySelector('.preview-panel');
        if (previewPanel) previewPanel.classList.add('dragging');

        // Self-contained document-level listeners — see _handleDragStart for why.
        if (this._boundShapeDragMouseMove) document.removeEventListener('mousemove', this._boundShapeDragMouseMove);
        if (this._boundShapeDragMouseUp) document.removeEventListener('mouseup', this._boundShapeDragMouseUp);
        this._boundShapeDragMouseMove = this._handleShapeDrag.bind(this);
        this._boundShapeDragMouseUp = this._handleShapeDragMouseUp.bind(this);
        document.addEventListener('mousemove', this._boundShapeDragMouseMove);
        document.addEventListener('mouseup', this._boundShapeDragMouseUp);

        this.requestUpdate();
    }

    /**
     * Handle shape drag move
     * @param {MouseEvent} event
     * @private
     */
    _handleShapeDrag(event) {
        if (!this._shapeDragState.active) return;

        const coords = this._getPreviewCoordinatesFromMouseEvent(event);
        if (!coords) return;

        let newX = coords.x - this._shapeDragState.offsetX;
        let newY = coords.y - this._shapeDragState.offsetY;

        if (this._enableSnapping && this._gridSpacing) {
            newX = Math.round(newX / this._gridSpacing) * this._gridSpacing;
            newY = Math.round(newY / this._gridSpacing) * this._gridSpacing;
        }

        const shape = this._findControl(this._shapeDragState.shapeId);
        if (!shape) return;

        shape.position = [this._roundToPrecision(newX), this._roundToPrecision(newY)];
        this.requestUpdate();
    }

    /**
     * Handle shape drag end (mouseup) — self-contained counterpart to
     * _handleShapeDragStart's listener, mirrors _handleShapeVertexMouseUp.
     * @param {MouseEvent} event
     * @private
     */
    _handleShapeDragMouseUp(event) {
        if (!this._shapeDragState.active) return;

        lcardsLog.debug('[MSDStudio] Shape drag end:', this._shapeDragState.shapeId);

        const previewPanel = this.shadowRoot.querySelector('.preview-panel');
        if (previewPanel) previewPanel.classList.remove('dragging');

        this._shapeDragState = {
            active: false, shapeId: null, startPos: null, originalPos: null, offsetX: 0, offsetY: 0
        };

        if (this._boundShapeDragMouseMove) {
            document.removeEventListener('mousemove', this._boundShapeDragMouseMove);
            this._boundShapeDragMouseMove = null;
        }
        if (this._boundShapeDragMouseUp) {
            document.removeEventListener('mouseup', this._boundShapeDragMouseUp);
            this._boundShapeDragMouseUp = null;
        }

        this._schedulePreviewUpdate();
        this.requestUpdate();
    }

    /**
     * Render resize handles for a shape (identical 8-handle layout to controls)
     * @param {string} shapeId
     * @param {number} pixelWidth
     * @param {number} pixelHeight
     * @param {boolean} isResizing
     * @returns {TemplateResult}
     * @private
     */
    _renderShapeResizeHandles(shapeId, pixelWidth, pixelHeight, isResizing) {
        const handles = ['tl', 't', 'tr', 'r', 'br', 'b', 'bl', 'l'];
        return html`
            ${handles.map(handle => {
                const isActive = isResizing && this._shapeResizeState.handle === handle;
                return html`
                    <div
                        class="resize-handle ${handle} ${isActive ? 'active' : ''}"
                        data-handle="${handle}"
                        @mousedown=${(e) => this._handleShapeResizeStart(e, shapeId, handle)}>
                    </div>
                `;
            })}
        `;
    }

    /**
     * Handle shape resize start
     * @param {MouseEvent} event
     * @param {string} shapeId
     * @param {string} handle
     * @private
     */
    _handleShapeResizeStart(event, shapeId, handle) {
        event.stopPropagation();
        event.preventDefault();

        const shape = this._findControl(shapeId);
        if (!shape || !Array.isArray(shape.position)) {
            lcardsLog.warn('[MSDStudio] Shape not found or has no literal position for resize:', shapeId);
            return;
        }

        const coords = this._getPreviewCoordinatesFromMouseEvent(event);
        if (!coords) return;

        this._shapeResizeState = {
            active: true,
            shapeId,
            handle,
            startPos: [coords.x, coords.y],
            startSize: shape.size ? [...shape.size] : [100, 60],
            startPosition: [...shape.position]
        };

        // Self-contained document-level listeners — see _handleDragStart for why.
        if (this._boundShapeResizeMouseMove) document.removeEventListener('mousemove', this._boundShapeResizeMouseMove);
        if (this._boundShapeResizeMouseUp) document.removeEventListener('mouseup', this._boundShapeResizeMouseUp);
        this._boundShapeResizeMouseMove = this._handleShapeResize.bind(this);
        this._boundShapeResizeMouseUp = this._handleShapeResizeMouseUp.bind(this);
        document.addEventListener('mousemove', this._boundShapeResizeMouseMove);
        document.addEventListener('mouseup', this._boundShapeResizeMouseUp);

        this.requestUpdate();
    }

    /**
     * Handle shape resize move — identical corner/edge math to control resize
     * @param {MouseEvent} event
     * @private
     */
    _handleShapeResize(event) {
        if (!this._shapeResizeState.active) return;

        const coords = this._getPreviewCoordinatesFromMouseEvent(event);
        if (!coords) return;

        const deltaX = coords.x - this._shapeResizeState.startPos[0];
        const deltaY = coords.y - this._shapeResizeState.startPos[1];

        const shape = this._findControl(this._shapeResizeState.shapeId);
        if (!shape) return;

        const [startWidth, startHeight] = this._shapeResizeState.startSize;
        const [startX, startY] = this._shapeResizeState.startPosition;
        const handle = this._shapeResizeState.handle;

        let newWidth = startWidth;
        let newHeight = startHeight;
        let newX = startX;
        let newY = startY;

        switch (handle) {
            case 'tl':
                newWidth = startWidth - deltaX; newHeight = startHeight - deltaY;
                newX = startX + deltaX; newY = startY + deltaY;
                break;
            case 't':
                newHeight = startHeight - deltaY; newY = startY + deltaY;
                break;
            case 'tr':
                newWidth = startWidth + deltaX; newHeight = startHeight - deltaY; newY = startY + deltaY;
                break;
            case 'r':
                newWidth = startWidth + deltaX;
                break;
            case 'br':
                newWidth = startWidth + deltaX; newHeight = startHeight + deltaY;
                break;
            case 'b':
                newHeight = startHeight + deltaY;
                break;
            case 'bl':
                newWidth = startWidth - deltaX; newHeight = startHeight + deltaY; newX = startX + deltaX;
                break;
            case 'l':
                newWidth = startWidth - deltaX; newX = startX + deltaX;
                break;
        }

        const minSize = 10;
        if (newWidth < minSize) {
            newWidth = minSize;
            if (handle.includes('l')) newX = startX + startWidth - minSize;
        }
        if (newHeight < minSize) {
            newHeight = minSize;
            if (handle.includes('t')) newY = startY + startHeight - minSize;
        }

        if (this._enableSnapping && this._gridSpacing) {
            newWidth = Math.round(newWidth / this._gridSpacing) * this._gridSpacing;
            newHeight = Math.round(newHeight / this._gridSpacing) * this._gridSpacing;
            newX = Math.round(newX / this._gridSpacing) * this._gridSpacing;
            newY = Math.round(newY / this._gridSpacing) * this._gridSpacing;
        }

        shape.size = [this._roundToPrecision(newWidth), this._roundToPrecision(newHeight)];
        shape.position = [this._roundToPrecision(newX), this._roundToPrecision(newY)];

        this.requestUpdate();
    }

    /**
     * Handle shape resize end (mouseup) — self-contained counterpart to
     * _handleShapeResizeStart's listener, mirrors _handleShapeVertexMouseUp.
     * @param {MouseEvent} event
     * @private
     */
    _handleShapeResizeMouseUp(event) {
        if (!this._shapeResizeState.active) return;

        lcardsLog.debug('[MSDStudio] Shape resize end:', this._shapeResizeState.shapeId);

        this._shapeResizeState = {
            active: false, shapeId: null, handle: null, startPos: null, startSize: null, startPosition: null
        };

        if (this._boundShapeResizeMouseMove) {
            document.removeEventListener('mousemove', this._boundShapeResizeMouseMove);
            this._boundShapeResizeMouseMove = null;
        }
        if (this._boundShapeResizeMouseUp) {
            document.removeEventListener('mouseup', this._boundShapeResizeMouseUp);
            this._boundShapeResizeMouseUp = null;
        }

        this._schedulePreviewUpdate();
        this.requestUpdate();
    }

    // ============================
    // Shape Vertex Drag Methods (polyline) — mirrors Waypoint drag handling
    // (_handleWaypointMouseDown/_handleWaypointMouseMove/_handleWaypointMouseUp)
    // exactly: self-contained global mousemove/mouseup listeners added/removed
    // per-drag, rather than routing through the shared _handlePreviewMouseMove/
    // _handleDragEnd used by control drag/resize.
    // ============================

    /**
     * Handle mouse down on a polyline shape's vertex marker — start drag
     * @param {MouseEvent} e
     * @param {string} shapeId
     * @param {number} vertexIndex
     * @private
     */
    _handleShapeVertexMouseDown(e, shapeId, vertexIndex) {
        e.stopPropagation();
        e.preventDefault();

        this._shapeVertexDragInProgress = true;
        this._shapeVertexDragState = { shapeId, vertexIndex, startX: e.clientX, startY: e.clientY };

        this._boundShapeVertexMouseMove = this._handleShapeVertexMouseMove.bind(this);
        this._boundShapeVertexMouseUp = this._handleShapeVertexMouseUp.bind(this);
        document.addEventListener('mousemove', this._boundShapeVertexMouseMove);
        document.addEventListener('mouseup', this._boundShapeVertexMouseUp);

        this.requestUpdate();
    }

    /**
     * Handle polyline vertex drag move
     * @param {MouseEvent} e
     * @private
     */
    _handleShapeVertexMouseMove(e) {
        if (!this._shapeVertexDragState) return;
        e.preventDefault();

        const { shapeId, vertexIndex } = this._shapeVertexDragState;
        const coords = this._getPreviewCoordinatesFromMouseEvent(e);
        if (!coords) return;

        let { x, y } = coords;
        if (this._enableSnapping && this._gridSpacing > 0) {
            const snapped = snapToGrid(x, y, this._gridSpacing, true);
            x = snapped[0];
            y = snapped[1];
        }

        const overlays = this._workingConfig.msd?.overlays || [];
        const shape = overlays.find(o => o.id === shapeId && o.type === 'shape');
        if (shape && Array.isArray(shape.points) && shape.points[vertexIndex] !== undefined) {
            shape.points[vertexIndex] = [this._roundToPrecision(x), this._roundToPrecision(y)];

            if (this._shapeFormData?.id === shapeId && this._shapeFormData.points) {
                this._shapeFormData.points[vertexIndex] = shape.points[vertexIndex];
            }

            this._schedulePreviewUpdate();
            this.requestUpdate();
        }
    }

    /**
     * Handle polyline vertex drag end
     * @param {MouseEvent} e
     * @private
     */
    _handleShapeVertexMouseUp(e) {
        if (!this._shapeVertexDragState) return;
        e.preventDefault();
        e.stopPropagation();

        this._shapeVertexDragState = null;

        if (this._boundShapeVertexMouseMove) {
            document.removeEventListener('mousemove', this._boundShapeVertexMouseMove);
            this._boundShapeVertexMouseMove = null;
        }
        if (this._boundShapeVertexMouseUp) {
            document.removeEventListener('mouseup', this._boundShapeVertexMouseUp);
            this._boundShapeVertexMouseUp = null;
        }

        setTimeout(() => { this._shapeVertexDragInProgress = false; }, 150);
        this.requestUpdate();
    }

    /**
     * Delete a single vertex from the selected polyline (double-click a vertex
     * marker) — mirrors _handleWaypointDoubleClick's delete-on-double-click.
     * @param {MouseEvent} e
     * @param {string} shapeId
     * @param {number} vertexIndex
     * @private
     */
    _handleShapeVertexDoubleClick(e, shapeId, vertexIndex) {
        e.stopPropagation();
        e.preventDefault();

        const overlays = this._workingConfig.msd?.overlays || [];
        const shape = overlays.find(o => o.id === shapeId && o.type === 'shape');
        if (!shape || !Array.isArray(shape.points) || shape.points.length <= 2) {
            lcardsLog.warn('[MSDStudio] Cannot delete vertex — polyline needs at least 2 points');
            return;
        }

        shape.points.splice(vertexIndex, 1);
        if (this._shapeFormData?.id === shapeId) {
            this._shapeFormData.points = [...shape.points];
        }

        this._schedulePreviewUpdate();
        this.requestUpdate();
    }

    /**
     * Insert a new vertex at a segment's midpoint (click on a segment-insert
     * marker rendered between two adjacent polyline vertices, or between the
     * last and first vertex for a closed shape).
     * @param {MouseEvent} e
     * @param {string} shapeId
     * @param {number} insertIndex - array index the new point is spliced into
     * @param {number} midX - viewBox X of the segment midpoint
     * @param {number} midY - viewBox Y of the segment midpoint
     * @private
     */
    _handleShapeSegmentInsertClick(e, shapeId, insertIndex, midX, midY) {
        e.stopPropagation();
        e.preventDefault();

        const overlays = this._workingConfig.msd?.overlays || [];
        const shape = overlays.find(o => o.id === shapeId && o.type === 'shape');
        if (!shape || !Array.isArray(shape.points)) return;

        shape.points.splice(insertIndex, 0, [this._roundToPrecision(midX), this._roundToPrecision(midY)]);

        if (this._shapeFormData?.id === shapeId) {
            this._shapeFormData.points = [...shape.points];
        }

        this._schedulePreviewUpdate();
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

        // Self-contained document-level listeners — see _handleDragStart for why.
        if (this._boundAnchorDragMouseMove) document.removeEventListener('mousemove', this._boundAnchorDragMouseMove);
        if (this._boundAnchorDragMouseUp) document.removeEventListener('mouseup', this._boundAnchorDragMouseUp);
        this._boundAnchorDragMouseMove = this._handleAnchorDrag.bind(this);
        this._boundAnchorDragMouseUp = this._handleAnchorDragMouseUp.bind(this);
        document.addEventListener('mousemove', this._boundAnchorDragMouseMove);
        document.addEventListener('mouseup', this._boundAnchorDragMouseUp);

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
     * Handle anchor drag end (mouseup) — self-contained counterpart to
     * _handleAnchorDragStart's listener, mirrors _handleShapeVertexMouseUp.
     * @param {MouseEvent} event - Mouse up event
     * @private
     */
    _handleAnchorDragMouseUp(event) {
        if (!this._anchorDragState.active) return;

        lcardsLog.debug('[MSDStudio] Anchor drag end:', this._anchorDragState.anchorName);

        this._anchorDragState = {
            active: false,
            anchorName: null,
            startPos: null,
            originalPos: null
        };

        if (this._boundAnchorDragMouseMove) {
            document.removeEventListener('mousemove', this._boundAnchorDragMouseMove);
            this._boundAnchorDragMouseMove = null;
        }
        if (this._boundAnchorDragMouseUp) {
            document.removeEventListener('mouseup', this._boundAnchorDragMouseUp);
            this._boundAnchorDragMouseUp = null;
        }

        this._schedulePreviewUpdate();
        this.requestUpdate();
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
     * Handle channel drag (move) start — mirrors _handleDragStart (controls),
     * simplified since channel.bounds is always a plain [x,y,w,h] array
     * (never an anchor-reference string like a control's position can be).
     * @param {MouseEvent} event - Mouse down event
     * @param {string} channelId - Channel ID
     * @private
     */
    _handleChannelDragStart(event, channelId) {
        event.stopPropagation();
        event.preventDefault();

        const channels = this._workingConfig.msd?.channels || {};
        const channel = channels[channelId];
        if (!channel || !channel.bounds) {
            lcardsLog.warn('[MSDStudio] Channel not found or has no bounds for drag:', channelId);
            return;
        }

        const coords = this._getPreviewCoordinatesFromMouseEvent(event);
        if (!coords) {
            lcardsLog.warn('[MSDStudio] Could not get coordinates for channel drag start');
            return;
        }

        this._channelDragState = {
            active: true,
            channelId,
            startPos: [coords.x, coords.y],
            startBounds: [...channel.bounds]
        };

        // Self-contained document-level listeners — see _handleDragStart for why.
        if (this._boundChannelDragMouseMove) document.removeEventListener('mousemove', this._boundChannelDragMouseMove);
        if (this._boundChannelDragMouseUp) document.removeEventListener('mouseup', this._boundChannelDragMouseUp);
        this._boundChannelDragMouseMove = this._handleChannelDrag.bind(this);
        this._boundChannelDragMouseUp = this._handleChannelDragMouseUp.bind(this);
        document.addEventListener('mousemove', this._boundChannelDragMouseMove);
        document.addEventListener('mouseup', this._boundChannelDragMouseUp);

        this.requestUpdate();
    }

    /**
     * Handle channel drag (move) move
     * @param {MouseEvent} event - Mouse move event
     * @private
     */
    _handleChannelDrag(event) {
        if (!this._channelDragState.active) return;

        const coords = this._getPreviewCoordinatesFromMouseEvent(event);
        if (!coords) return;

        const deltaX = coords.x - this._channelDragState.startPos[0];
        const deltaY = coords.y - this._channelDragState.startPos[1];

        const channels = this._workingConfig.msd?.channels || {};
        const channel = channels[this._channelDragState.channelId];
        if (!channel) return;

        const [startX, startY, width, height] = this._channelDragState.startBounds;
        let newX = startX + deltaX;
        let newY = startY + deltaY;

        // Apply grid snapping if enabled (same convention as channel resize)
        if (this._enableSnapping && this._gridSpacing) {
            newX = Math.round(newX / this._gridSpacing) * this._gridSpacing;
            newY = Math.round(newY / this._gridSpacing) * this._gridSpacing;
        }

        channel.bounds = [
            this._roundToPrecision(newX),
            this._roundToPrecision(newY),
            width,
            height
        ];

        this.requestUpdate();
    }

    /**
     * Handle channel drag (move) end (mouseup) — self-contained counterpart
     * to _handleChannelDragStart's listener, mirrors _handleShapeVertexMouseUp.
     * @param {MouseEvent} event - Mouse up event
     * @private
     */
    _handleChannelDragMouseUp(event) {
        if (!this._channelDragState.active) return;

        lcardsLog.debug('[MSDStudio] Channel drag end:', this._channelDragState.channelId);

        this._channelDragState = {
            active: false,
            channelId: null,
            startPos: null,
            startBounds: null
        };

        if (this._boundChannelDragMouseMove) {
            document.removeEventListener('mousemove', this._boundChannelDragMouseMove);
            this._boundChannelDragMouseMove = null;
        }
        if (this._boundChannelDragMouseUp) {
            document.removeEventListener('mouseup', this._boundChannelDragMouseUp);
            this._boundChannelDragMouseUp = null;
        }

        this._schedulePreviewUpdate();
        this.requestUpdate();
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

        // Self-contained document-level listeners — see _handleDragStart for why.
        if (this._boundChannelResizeMouseMove) document.removeEventListener('mousemove', this._boundChannelResizeMouseMove);
        if (this._boundChannelResizeMouseUp) document.removeEventListener('mouseup', this._boundChannelResizeMouseUp);
        this._boundChannelResizeMouseMove = this._handleChannelResize.bind(this);
        this._boundChannelResizeMouseUp = this._handleChannelResizeMouseUp.bind(this);
        document.addEventListener('mousemove', this._boundChannelResizeMouseMove);
        document.addEventListener('mouseup', this._boundChannelResizeMouseUp);

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
     * Handle channel resize end (mouseup) — self-contained counterpart to
     * _handleChannelResizeStart's listener, mirrors _handleShapeVertexMouseUp.
     * @param {MouseEvent} event - Mouse up event
     * @private
     */
    _handleChannelResizeMouseUp(event) {
        if (!this._channelResizeState.active) return;

        lcardsLog.debug('[MSDStudio] Channel resize end:', this._channelResizeState.channelId);

        this._channelResizeState = {
            active: false,
            channelId: null,
            handle: null,
            startPos: null,
            startBounds: null
        };

        if (this._boundChannelResizeMouseMove) {
            document.removeEventListener('mousemove', this._boundChannelResizeMouseMove);
            this._boundChannelResizeMouseMove = null;
        }
        if (this._boundChannelResizeMouseUp) {
            document.removeEventListener('mouseup', this._boundChannelResizeMouseUp);
            this._boundChannelResizeMouseUp = null;
        }

        this._schedulePreviewUpdate();
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

        // Open channel form in edit mode — delegate to _editChannel rather
        // than duplicating its field population (this used to hand-roll a
        // stale id/type/bounds/priority/color object that doesn't match the
        // mode/direction/weight/line_spacing schema _renderChannelFormDialog
        // actually reads, leaving Channel Mode etc. blank).
        this._editChannel(channelId, channel);
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

        // Check shapes: 9-point bbox grid for rect/circle (same convention as
        // controls above — shapes position from top-left directly, no
        // attachment-offset map needed), one point per vertex for polyline.
        // A polyline vertex snap always returns a side ('vertexN') since there's
        // no bare-id fallback anchor registered for polylines at runtime — only
        // per-vertex ones (see AdvancedRenderer.js's shape attachment registration).
        const shapes = this._getShapeOverlays();
        for (const shape of shapes) {
            if (shape.kind === 'polyline') {
                if (!Array.isArray(shape.points)) continue;
                for (let i = 0; i < shape.points.length; i++) {
                    const pt = shape.points[i];
                    if (!Array.isArray(pt) || pt.length < 2) continue;
                    const [px, py] = pt;
                    const dist = Math.sqrt(Math.pow(mouseX - px, 2) + Math.pow(mouseY - py, 2));
                    if (dist < threshold) {
                        lcardsLog.trace('[MSDStudio] Snap found on shape vertex:', shape.id, 'vertex:', i, 'dist:', dist);
                        return { type: 'shape', id: shape.id, side: `vertex${i}` };
                    }
                }
                continue;
            }

            if (!Array.isArray(shape.position) || !Array.isArray(shape.size)) continue;
            const [x, y] = shape.position;
            const [w, h] = shape.size;

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
                    lcardsLog.trace('[MSDStudio] Snap found on shape:', shape.id, 'side:', side, 'dist:', dist);
                    return { type: 'shape', id: shape.id, side: side === 'center' ? null : side };
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

            // Set anchor_side only if attaching to a control or shape (not an anchor point)
            if ((target.type === 'control' || target.type === 'shape') && target.side) {
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

            // Set attach_side only if attaching to a control or shape (not an anchor point)
            if ((target.type === 'control' || target.type === 'shape') && target.side) {
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
        const preview = this._getPreviewSvgAndViewBox();
        if (!preview) {
            lcardsLog.warn('[MSDStudio] No preview SVG found for coordinate conversion');
            return null;
        }
        const { svg, viewBoxX: vbX, viewBoxY: vbY, viewBoxWidth: vbWidth, viewBoxHeight: vbHeight } = preview;

        // Get bounding rect of SVG element
        // NOTE: rect is already in transformed screen space due to CSS transform
        const rect = svg.getBoundingClientRect();

        // Calculate click position relative to SVG
        // No inverse zoom needed - rect already accounts for transform
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;

        // Calculate scale from screen pixels to viewBox units. SVG uses
        // preserveAspectRatio="xMidYMid meet" (the default), so both axes share a
        // single scale factor - the LARGER of the two per-axis ratios - with the
        // shorter axis letterboxed/pillarboxed (centered) rather than stretched.
        // Same formula as the (correct) siblings: _getPreviewCoordinatesWithPixels(),
        // _getViewBoxToPixelConverter(), getPreviewCoordinatesFromMouseEvent().
        const scaleX = vbWidth / rect.width;
        const scaleY = vbHeight / rect.height;
        const scale = Math.max(scaleX, scaleY);

        // Actual rendered size of the viewBox content, and the letterbox/pillarbox
        // centering offset preserveAspectRatio introduces when the panel's aspect
        // ratio doesn't match the viewBox's.
        const renderedWidth = vbWidth / scale;
        const renderedHeight = vbHeight / scale;
        const offsetX = (rect.width - renderedWidth) / 2;
        const offsetY = (rect.height - renderedHeight) / 2;

        // Convert to viewBox coordinates (letterbox-adjusted)
        let coordX = vbX + ((x - offsetX) * scale);
        let coordY = vbY + ((y - offsetY) * scale);

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
            scale,
            rect: { width: rect.width, height: rect.height }
        });

        // Only round to whole viewBox units when snap is off — with snap on,
        // coordX/coordY are already whole grid-spacing multiples from above.
        // Otherwise return the raw float so click-to-place isn't coarser than
        // a drag-reposition of the same overlay (which never rounds unless
        // snap is on — see _handleDrag et al.).
        return snapEnabled
            ? { x: coordX, y: coordY }
            : { x: this._roundToPrecision(coordX), y: this._roundToPrecision(coordY) };
    }

    /**
     * Get preview coordinates with both pixel and viewBox positions
     * @param {MouseEvent} event - Mouse event
     * @returns {Object|null} - Object with {x, y, pixelX, pixelY} or null
     * @private
     */
    _getPreviewCoordinatesWithPixels(event) {
        const previewPanel = event.currentTarget;
        const preview = this._getPreviewSvgAndViewBox();
        if (!preview) return null;
        const { svg, viewBoxX: vbX, viewBoxY: vbY, viewBoxWidth: vbWidth, viewBoxHeight: vbHeight } = preview;

        // Get bounding rect of SVG element relative to viewport
        // NOTE: rect is already in transformed screen space due to CSS transform on parent
        const rect = svg.getBoundingClientRect();

        // Get preview panel rect
        // @ts-ignore - TS2339: auto-suppressed
        const panelRect = previewPanel.getBoundingClientRect();

        // Calculate mouse position relative to SVG
        // No need to apply inverse zoom - rect is already transformed
        const svgX = event.clientX - rect.left;
        const svgY = event.clientY - rect.top;

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

            // Convert snapped viewBox coords back to pixel position
            // rect is already in transformed screen space, so no zoom multiplication needed
            const snappedSvgX = (coordX - vbX) / scale + offsetX;
            const snappedSvgY = (coordY - vbY) / scale + offsetY;

            // Convert to preview panel coordinates (rect already includes transform)
            pixelX = (rect.left - panelRect.left) + snappedSvgX;
            pixelY = (rect.top - panelRect.top) + snappedSvgY;
        }

        return {
            x: Math.round(coordX),
            y: Math.round(coordY),
            pixelX,
            pixelY,
            panelWidth: panelRect.width,
            panelHeight: panelRect.height
        };
    }

    /**
     * Handle draw channel click.
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
            // First click: start drawing. This click's own mousedown may have
            // armed a drag candidate (_handlePreviewMouseDown) — since we got
            // here via a plain click (no drag promoted it in
            // _handlePreviewMouseMove), invalidate it so a mousemove during
            // the *second* click doesn't mistake this stale candidate for a
            // new drag-to-draw gesture (mirrors _handleDrawShapeClick).
            this._drawChannelState.startPoint = [coords.x, coords.y];
            this._drawChannelState.drawing = true;
            this._channelDrawDragCandidate = null;
            lcardsLog.trace('[MSDStudio] Draw channel started at:', coords);
        } else {
            this._finishDrawChannel(this._drawChannelState.startPoint, [coords.x, coords.y]);
        }
    }

    /**
     * Finish a routing-channel draw given its two opposite corners
     * (viewBox-space) — shared by the click-click flow
     * (_handleDrawChannelClick) and the click-drag flow
     * (_handleDragEnd/_handlePreviewMouseDown).
     * @param {[number, number]} startPoint - First corner
     * @param {[number, number]} endPoint - Opposite corner
     * @private
     */
    _finishDrawChannel(startPoint, endPoint) {
        const [startX, startY] = startPoint;
        const [endX, endY] = endPoint;

        // Calculate bounds [x, y, width, height]
        const x = Math.min(startX, endX);
        const y = Math.min(startY, endY);
        const width = Math.abs(endX - startX);
        const height = Math.abs(endY - startY);

        lcardsLog.trace('[MSDStudio] Draw channel finished:', { x, y, width, height });

        // Reset draw state
        this._drawChannelState.startPoint = null;
        this._drawChannelState.drawing = false;
        this._channelDrawDragCandidate = null;

        // Detect lines that may intersect this channel
        const channelBounds = { x, y, width, height };
        const intersectingLines = this._findLinesIntersectingChannel(channelBounds);

        // Open channel form with pre-filled bounds. Matches the schema
        // _openChannelForm/_editChannel/_saveChannel actually use (mode,
        // direction, weight, line_spacing) — not the legacy type/priority/
        // color fields, which _renderChannelFormDialog doesn't read at all,
        // leaving Channel Mode blank instead of defaulting to "Prefer".
        this._editingChannelId = '';
        this._channelFormData = {
            id: this._generateChannelId(),
            mode: 'prefer',
            direction: 'auto',
            bounds: [x, y, width, height],
            weight: 0.5,
            line_spacing: 8,
            discoverable: true,
            // Add suggested lines if any were found
            suggestedLines: intersectingLines.length > 0 ? intersectingLines.map(line => line.id) : null
        };

        // Exit draw mode
        this._activeMode = MODES.VIEW;
        this.requestUpdate();
    }

    /**
     * Handle draw shape click. Dispatches by kind:
     * - polyline: open-ended click-to-append (mirrors _handleAddWaypointClick's
     *   pattern) — finished via double-click (_finishDrawShapePolyline)
     * - rect/circle: 2-click bbox (mirrors _handleDrawChannelClick exactly) —
     *   first click is one corner, second click the opposite corner
     * @param {MouseEvent} event - Click event
     * @private
     */
    _handleDrawShapeClick(event) {
        const coords = this._getPreviewCoordinates(event);
        if (!coords) {
            lcardsLog.warn('[MSDStudio] Could not get preview coordinates');
            return;
        }

        const kind = this._drawShapeState.kind;

        if (kind === 'polyline') {
            this._drawShapeState.points = [...this._drawShapeState.points, [coords.x, coords.y]];
            this._drawShapeState.drawing = true;
            lcardsLog.trace('[MSDStudio] Added polyline point:', coords, 'total:', this._drawShapeState.points.length);
            this.requestUpdate();
            return;
        }

        // rect/circle: 2-click bbox
        if (!this._drawShapeState.points.length) {
            this._drawShapeState.points = [[coords.x, coords.y]];
            this._drawShapeState.drawing = true;
            // This click's own mousedown may have armed a drag candidate
            // (_handlePreviewMouseDown) — since we got here via a plain click
            // (no drag promoted it in _handlePreviewMouseMove), invalidate it
            // so a later mousemove during the *second* click doesn't mistake
            // this stale candidate for a new drag-to-draw gesture.
            this._shapeDrawDragCandidate = null;
            lcardsLog.trace('[MSDStudio] Draw shape started at:', coords);
            this.requestUpdate();
            return;
        }

        this._finishDrawShapeRect(kind, this._drawShapeState.points[0], [coords.x, coords.y]);
    }

    /**
     * Finish a rect/circle draw shape given its two opposite corners
     * (viewBox-space) — shared by the click-click flow (_handleDrawShapeClick)
     * and the click-drag flow (_handleDragEnd/_handlePreviewMouseDown).
     * @param {string} kind - 'rect' or 'circle'
     * @param {[number, number]} startPoint - First corner
     * @param {[number, number]} endPoint - Opposite corner
     * @private
     */
    _finishDrawShapeRect(kind, startPoint, endPoint) {
        const [startX, startY] = startPoint;
        const [endX, endY] = endPoint;
        const x = Math.min(startX, endX);
        const y = Math.min(startY, endY);
        const width = Math.abs(endX - startX);
        const height = Math.abs(endY - startY);

        this._drawShapeState = { kind: null, points: [], drawing: false, currentPoint: null };
        this._shapeDrawDragCandidate = null;
        this._activeMode = MODES.VIEW;

        if (width < 1 || height < 1) {
            lcardsLog.warn('[MSDStudio] Shape too small, ignoring');
            this.requestUpdate();
            return;
        }

        this._openShapeForm(kind, { position: [x, y], size: [width, height] });
    }

    /**
     * Finish an in-progress polyline shape draw (triggered by double-click or
     * Enter) and open the shape form pre-filled with the collected points.
     * @private
     */
    _finishDrawShapePolyline() {
        let points = this._drawShapeState.points;

        // A double-click always fires two `click` events immediately before
        // `dblclick` (browser event order: click, click, dblclick), and both
        // land at ~the same spot — each already appended a point via
        // _handleDrawShapeClick, so the last entry here duplicates the one
        // before it. Drop it so the double-click's endpoint isn't counted twice.
        if (points.length >= 2) {
            const [x1, y1] = points[points.length - 2];
            const [x2, y2] = points[points.length - 1];
            if (Math.abs(x1 - x2) <= 2 && Math.abs(y1 - y2) <= 2) {
                points = points.slice(0, -1);
            }
        }

        if (points.length < 2) {
            lcardsLog.warn('[MSDStudio] Polyline needs at least 2 points to finish');
            return;
        }

        this._drawShapeState = { kind: null, points: [], drawing: false, currentPoint: null };
        this._activeMode = MODES.VIEW;
        this._openShapeForm('polyline', { points });
    }

    /**
     * Inject line highlighting styles into MSD card shadow DOM
     * @private
     */
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

        // @ts-ignore - TS2339: auto-suppressed
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

        // Deliberately leave _activeMode untouched (stays VIEW, same as shape
        // selection) rather than auto-switching into ADD_WAYPOINT mode. That
        // used to force every click that wasn't an anchor/waypoint marker or
        // one of two hardcoded "empty area" container classes through
        // _addWaypointAtPosition, silently appending a waypoint wherever the
        // click landed — including clicks meant to deselect the line, which
        // zigzagged the route and multiplied segment-insert markers pointlessly.
        // Waypoint markers, dragging, deleting, and segment-insert markers all
        // key off _showWaypointMarkers + _selectedLineId, not _activeMode, so
        // they keep working unchanged. ADD_WAYPOINT mode itself is unchanged
        // and still reachable via its toolbar button for the deliberate
        // click-anywhere-to-append workflow.
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

        let { x, y, pixelX, pixelY, panelWidth, panelHeight } = this._cursorPosition;

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

        // Flip the floating tooltip's quadrant near the right/top edges so it's
        // never clipped by the overlay's overflow:hidden container. Anchor via
        // `right` (not a `left` offset by an estimated width) when flipped, so
        // the tooltip hugs the crosshair the same way it does on the right side
        // regardless of its actual rendered width.
        const TOOLTIP_GAP = 15;
        const TOOLTIP_WIDTH_ESTIMATE = 130; // only used to decide when to flip
        const TOOLTIP_HEIGHT_ESTIMATE = 30;

        const flipLeft = (snappedPixelX + TOOLTIP_GAP + TOOLTIP_WIDTH_ESTIMATE) > panelWidth;
        let tooltipLeft = null;
        let tooltipRight = null;
        if (flipLeft) {
            tooltipRight = Math.max(4, panelWidth - snappedPixelX + TOOLTIP_GAP);
        } else {
            tooltipLeft = Math.max(4, Math.min(snappedPixelX + TOOLTIP_GAP, panelWidth - 4));
        }

        let tooltipTop = snappedPixelY - 30;
        if (tooltipTop < 0) {
            tooltipTop = snappedPixelY + 20;
        }
        tooltipTop = Math.max(4, Math.min(tooltipTop, panelHeight - TOOLTIP_HEIGHT_ESTIMATE - 4));

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
                    ${tooltipLeft !== null ? `left: ${tooltipLeft}px;` : `right: ${tooltipRight}px;`}
                    top: ${tooltipTop}px;
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
     * Locate the live preview's rendered <svg> element and derive the viewBox
     * actually in effect for it: explicit config `view_box` wins when set,
     * otherwise read the value the SVG itself is actually rendering with
     * (rather than a hardcoded guess) — keeps every coordinate-conversion
     * helper below consistent with what's really on screen, including when
     * Auto mode resolves the viewBox from a base SVG whose native dimensions
     * aren't the historical 1920x1200/1920x1080 assumption.
     * @returns {?{msdCard: Element, svg: SVGSVGElement, viewBoxX: number, viewBoxY: number, viewBoxWidth: number, viewBoxHeight: number}}
     * @private
     */
    _getPreviewSvgAndViewBox() {
        const livePreview = this.shadowRoot?.querySelector('lcards-msd-live-preview');
        if (!livePreview) return null;
        const livePreviewShadow = livePreview.shadowRoot;
        if (!livePreviewShadow) return null;
        const cardContainer = livePreviewShadow.querySelector('.preview-card-container');
        if (!cardContainer) return null;
        const msdCard = cardContainer.querySelector('lcards-msd-card');
        if (!msdCard) return null;
        // @ts-ignore - TS2339: auto-suppressed
        const shadowRoot = msdCard.shadowRoot || msdCard.renderRoot;
        if (!shadowRoot) return null;
        const svg = shadowRoot.querySelector('svg');
        if (!svg) return null;

        const viewBox = this._workingConfig.msd?.view_box;
        let viewBoxX = 0, viewBoxY = 0, viewBoxWidth = 1920, viewBoxHeight = 1200;
        if (Array.isArray(viewBox) && viewBox.length === 4) {
            [viewBoxX, viewBoxY, viewBoxWidth, viewBoxHeight] = viewBox;
        } else {
            const vb = svg.viewBox.baseVal;
            if (vb && vb.width > 0 && vb.height > 0) {
                ({ x: viewBoxX, y: viewBoxY, width: viewBoxWidth, height: viewBoxHeight } = vb);
            }
        }

        return { msdCard, svg, viewBoxX, viewBoxY, viewBoxWidth, viewBoxHeight };
    }

    /**
     * Poll (bounded, via rAF) after a preview-ready event until the rebuilt
     * preview's <svg> is actually resolvable, re-rendering as soon as it is.
     * `preview-ready` fires once the new card's data pipeline resolves, which
     * does not guarantee its shadow DOM has painted an <svg> yet — without
     * this, grid/crosshair/anchor overlays blank out until an unrelated
     * requestUpdate() (e.g. mousemove) happens to run later.
     * @param {number} retriesLeft
     * @private
     */
    _handlePreviewReady(retriesLeft = 30) {
        this.requestUpdate();
        if (this._getPreviewSvgAndViewBox()) {
            this._previewReadyRafHandle = null;
            return;
        }
        if (retriesLeft <= 0) {
            this._previewReadyRafHandle = null;
            return;
        }
        this._previewReadyRafHandle = requestAnimationFrame(() => this._handlePreviewReady(retriesLeft - 1));
    }

    /**
     * Render anchor highlight overlay
     * Shows pulsing highlight around selected anchor
     * @returns {TemplateResult}
     * @private
     */
    _renderAnchorHighlight() {
        // @ts-ignore - TS2322: auto-suppressed
        if (!this._highlightedAnchor) return '';

        // Find the anchor in user-defined anchors first
        const userAnchors = this._workingConfig.msd?.anchors || {};
        let anchorPosition = userAnchors[this._highlightedAnchor];

        // If not found in user anchors, check base_svg anchors
        if (!anchorPosition) {
            const baseSvgAnchors = this._getBaseSvgAnchors();
            anchorPosition = baseSvgAnchors[this._highlightedAnchor];
        }

        // @ts-ignore - TS2322: auto-suppressed
        if (!anchorPosition || !Array.isArray(anchorPosition)) return '';

        const [vbX, vbY] = anchorPosition;

        // We need to convert viewBox coordinates to pixel position
        // This requires finding the SVG element in the live preview
        // For simplicity, we'll use a setTimeout approach to calculate after render

        const preview = this._getPreviewSvgAndViewBox();
        // @ts-ignore - TS2322: auto-suppressed
        if (!preview) return '';
        const { svg, viewBoxX, viewBoxY, viewBoxWidth, viewBoxHeight } = preview;

        // Get SVG rect and calculate position
        const rect = svg.getBoundingClientRect();
        const previewPanel = this.shadowRoot.querySelector('.preview-panel');
        // @ts-ignore - TS2322: auto-suppressed
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
        // @ts-ignore - TS2322: auto-suppressed
        if (!this._highlightedControl) return '';

        // Find the control
        const controls = this._workingConfig.msd?.overlays || [];
        const control = controls.find(c => c.id === this._highlightedControl);
        // @ts-ignore - TS2322: auto-suppressed
        if (!control) return '';

        // Get MSD card to access resolved model with complete anchors
        const preview = this._getPreviewSvgAndViewBox();
        // @ts-ignore - TS2322: auto-suppressed
        if (!preview) return '';
        const { msdCard, svg, viewBoxX, viewBoxY, viewBoxWidth, viewBoxHeight } = preview;

        // Resolve position - handle anchor-based positioning (string reference),
        // including control-to-control positioning (position_side).
        // @ts-ignore - TS2339: auto-suppressed
        const highlightAnchors = msdCard._msdPipeline?.getResolvedModel()?.anchors || {};
        const resolvedPosition = this._resolveEditorControlPosition(control, highlightAnchors);
        if (!resolvedPosition) {
            lcardsLog.warn(`⚠️ [MSD Studio] Could not resolve position for control '${control.id}'`);
            // @ts-ignore - TS2322: auto-suppressed
            return '';
        }

        // Get size - default to 100x100 if not specified
        const size = control.size || [100, 100];
        // @ts-ignore - TS2322: auto-suppressed
        if (!Array.isArray(size)) return '';

        let [vbX, vbY] = resolvedPosition;
        const [width, height] = size;

        // Apply attachment offset (same logic as MsdControlsRenderer and bounding box)
        const attachment = control.attachment || 'center';
        const attachmentOffset = this._getAttachmentOffset(attachment, width, height);
        vbX += attachmentOffset[0];
        vbY += attachmentOffset[1];

        // Get SVG rect and calculate position
        const rect = svg.getBoundingClientRect();
        const previewPanel = this.shadowRoot.querySelector('.preview-panel');
        // @ts-ignore - TS2322: auto-suppressed
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

        // Convert viewBox coords to SVG pixel position (CSS transform handles zoom)
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
        // @ts-ignore - TS2322: auto-suppressed
        if (!this._highlightedLine) return '';

        // Find the line in overlays array
        const overlays = this._workingConfig.msd?.overlays || [];
        const lines = overlays.filter(o => o.type === 'line');
        const line = lines.find(l => l.id === this._highlightedLine);
        // @ts-ignore - TS2322: auto-suppressed
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
                startPos = this._resolveEditorControlPosition(overlay, allAnchors);
            }
        }

        let endPos = allAnchors[line.attach_to];
        if (!endPos) {
            // Try to find in overlays
            const overlays = this._workingConfig.msd?.overlays || [];
            const overlay = overlays.find(o => o.id === line.attach_to);
            if (overlay) {
                endPos = this._resolveEditorControlPosition(overlay, allAnchors);
            }
        }

        // @ts-ignore - TS2322: auto-suppressed
        if (!startPos || !endPos) return '';

        const [startX, startY] = startPos;
        const [endX, endY] = endPos;

        // Get SVG element and calculate pixel positions
        const preview = this._getPreviewSvgAndViewBox();
        // @ts-ignore - TS2322: auto-suppressed
        if (!preview) return '';
        const { svg, viewBoxX, viewBoxY, viewBoxWidth, viewBoxHeight } = preview;

        // Get SVG rect and calculate position
        const rect = svg.getBoundingClientRect();
        const previewPanel = this.shadowRoot.querySelector('.preview-panel');
        // @ts-ignore - TS2322: auto-suppressed
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
        // @ts-ignore - TS2322: auto-suppressed
        if (!this._showGrid) return '';

        lcardsLog.trace('[MSDStudio] _renderGridOverlay called, _showGrid:', this._showGrid);

        // Get SVG for coordinate conversion (also the source of truth for viewBox)
        const preview = this._getPreviewSvgAndViewBox();
        if (!preview) {
            lcardsLog.trace('[MSDStudio] Could not find preview SVG for grid overlay');
            // @ts-ignore - TS2322: auto-suppressed
            return '';
        }
        const { svg, viewBoxX, viewBoxY, viewBoxWidth, viewBoxHeight } = preview;

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

        lcardsLog.trace('[MSDStudio] Found SVG, calculating grid...');
        lcardsLog.trace('[MSDStudio] Grid lines:', { verticalLines: verticalLines.length, horizontalLines: horizontalLines.length });
        lcardsLog.trace('[MSDStudio] ViewBox:', { viewBoxX, viewBoxY, viewBoxWidth, viewBoxHeight });

        const rect = svg.getBoundingClientRect();
        const previewPanel = this.shadowRoot.querySelector('.preview-panel');
        // @ts-ignore - TS2322: auto-suppressed
        if (!previewPanel) return '';
        const panelRect = previewPanel.getBoundingClientRect();

        // Calculate scale factor from viewBox to screen pixels
        const scaleX = viewBoxWidth / rect.width;
        const scaleY = viewBoxHeight / rect.height;
        const scale = Math.max(scaleX, scaleY);

        const renderedWidth = viewBoxWidth / scale;
        const renderedHeight = viewBoxHeight / scale;
        const offsetX = (rect.width - renderedWidth) / 2;
        const offsetY = (rect.height - renderedHeight) / 2;

        // Calculate base_svg boundary position
        // Use SVG rect directly - it's already in transformed screen space
        // Overlays are positioned relative to panel, outside scroll container
        const baseSvgLeft = (rect.left - panelRect.left) + offsetX;
        const baseSvgTop = (rect.top - panelRect.top) + offsetY;
        const baseSvgWidth = renderedWidth;
        const baseSvgHeight = renderedHeight;

        // Get grid opacity from settings
        const gridOpacity = this._debugSettings.grid_opacity ?? 0.3;
        const boundaryOpacity = Math.min(gridOpacity + 0.2, 1.0);
        const labelStyle = `
            background: rgba(0, 0, 0, 0.7);
            color: ${gridColor};
            padding: 2px 6px;
            border-radius: 3px;
            font-family: 'Courier New', monospace;
            font-size: 10px;
            white-space: nowrap;
            opacity: ${boundaryOpacity};
            pointer-events: none;
        `;

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
                    opacity: ${boundaryOpacity};
                "></div>

                <!-- View box dimension labels -->
                <div style="position: absolute; left: 4px; top: 4px; ${labelStyle}">
                    (${Math.round(viewBoxX)}, ${Math.round(viewBoxY)})
                </div>
                <div style="position: absolute; right: 4px; bottom: 4px; ${labelStyle}">
                    (${Math.round(viewBoxX + viewBoxWidth)}, ${Math.round(viewBoxY + viewBoxHeight)})
                </div>
                <div style="position: absolute; left: 50%; top: -18px; transform: translateX(-50%); ${labelStyle}">
                    ${Math.round(viewBoxWidth)} × ${Math.round(viewBoxHeight)}
                </div>

                <!-- Grid Lines -->
                ${verticalLines.map((x) => {
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
     * Render the ROUTER's OWN search-grid resolution as an overlay —
     * distinct from _renderGridOverlay's _showGrid/_gridSpacing, which is a
     * pure drag/positioning aid with no relationship to how lines actually
     * route (see that state's own declaration comment). Requested live: a
     * way to visually see the router's own grid_resolution and how changing
     * it (or the viewBox size, which drives the scalable default) affects
     * where lines are actually free to bend. Read-only — this cannot be
     * dragged or snapped to; RouterCore.resolvedGridResolution() reports
     * the same value _computeGrid's own A* search actually uses.
     * @returns {TemplateResult}
     * @private
     */
    _renderRoutingGridOverlay() {
        // @ts-ignore - TS2322: auto-suppressed
        if (!this._showRoutingGrid) return '';

        const preview = this._getPreviewSvgAndViewBox();
        // @ts-ignore - TS2322: auto-suppressed
        if (!preview) return '';
        const { svg, viewBoxX, viewBoxY, viewBoxWidth, viewBoxHeight, msdCard } = preview;

        // @ts-ignore - TS2339: auto-suppressed
        const router = msdCard._msdPipeline?.coordinator?.router;
        // @ts-ignore - TS2322: auto-suppressed
        if (!router || typeof router.resolvedGridResolution !== 'function') return '';
        const res = router.resolvedGridResolution();
        // @ts-ignore - TS2322: auto-suppressed
        if (!(res > 0)) return '';

        const gridColor = '#ffaa00';

        const verticalLines = [];
        const maxX = viewBoxX + viewBoxWidth;
        for (let x = Math.ceil(viewBoxX / res) * res; x <= maxX; x += res) {
            verticalLines.push(x);
        }
        const horizontalLines = [];
        const maxY = viewBoxY + viewBoxHeight;
        for (let y = Math.ceil(viewBoxY / res) * res; y <= maxY; y += res) {
            horizontalLines.push(y);
        }

        const rect = svg.getBoundingClientRect();
        const previewPanel = this.shadowRoot.querySelector('.preview-panel');
        // @ts-ignore - TS2322: auto-suppressed
        if (!previewPanel) return '';
        const panelRect = previewPanel.getBoundingClientRect();

        const scaleX = viewBoxWidth / rect.width;
        const scaleY = viewBoxHeight / rect.height;
        const scale = Math.max(scaleX, scaleY);
        const renderedWidth = viewBoxWidth / scale;
        const renderedHeight = viewBoxHeight / scale;
        const offsetX = (rect.width - renderedWidth) / 2;
        const offsetY = (rect.height - renderedHeight) / 2;
        const baseSvgLeft = (rect.left - panelRect.left) + offsetX;
        const baseSvgTop = (rect.top - panelRect.top) + offsetY;

        return html`
            <div style="
                position: absolute;
                left: ${baseSvgLeft}px;
                top: ${baseSvgTop}px;
                width: ${renderedWidth}px;
                height: ${renderedHeight}px;
                pointer-events: none;
                z-index: 995;
            ">
                <div style="
                    position: absolute;
                    left: 4px;
                    top: 4px;
                    background: rgba(0, 0, 0, 0.7);
                    color: ${gridColor};
                    padding: 2px 6px;
                    border-radius: 3px;
                    font-family: 'Courier New', monospace;
                    font-size: 10px;
                    white-space: nowrap;
                    opacity: 0.9;
                ">routing grid: ${res % 1 === 0 ? res : res.toFixed(2)}vb</div>
                ${verticalLines.map((x) => html`
                    <div style="
                        position: absolute;
                        left: ${(x - viewBoxX) / scale}px;
                        top: 0;
                        width: 1px;
                        height: 100%;
                        background: ${gridColor};
                        opacity: 0.25;
                    "></div>
                `)}
                ${horizontalLines.map((y) => html`
                    <div style="
                        position: absolute;
                        left: 0;
                        top: ${(y - viewBoxY) / scale}px;
                        width: 100%;
                        height: 1px;
                        background: ${gridColor};
                        opacity: 0.25;
                    "></div>
                `)}
            </div>
        `;
    }

    /**
     * Render every spontaneously-DISCOVERED trunk-and-branch bundling row
     * (RouterCore.trunks(), origin:'discovered' only — config-authored
     * `msd.channels` already have their own dedicated, interactive overlay,
     * _renderChannelsOverlay, drawing from static config bounds rather than
     * the router's own live-grown ones). Read-only, debug-only: requested
     * live as a way to understand trunk bundling visually instead of
     * reading window.lcards.debug.msd.routing.trunks() payloads directly.
     * @returns {TemplateResult}
     * @private
     */
    _renderTrunksOverlay() {
        // @ts-ignore - TS2322: auto-suppressed
        if (!this._showTrunks) return '';

        const preview = this._getPreviewSvgAndViewBox();
        // @ts-ignore - TS2322: auto-suppressed
        if (!preview) return '';
        const { svg, viewBoxX, viewBoxY, viewBoxWidth, viewBoxHeight, msdCard } = preview;

        // @ts-ignore - TS2339: auto-suppressed
        const router = msdCard._msdPipeline?.coordinator?.router;
        // @ts-ignore - TS2322: auto-suppressed
        if (!router || typeof router.trunks !== 'function') return '';
        const trunks = router.trunks().filter(t => t.origin === 'discovered' && t.members.length > 0);
        // @ts-ignore - TS2322: auto-suppressed
        if (!trunks.length) return '';

        const rect = svg.getBoundingClientRect();
        const previewPanel = this.shadowRoot.querySelector('.preview-panel');
        // @ts-ignore - TS2322: auto-suppressed
        if (!previewPanel) return '';
        const panelRect = previewPanel.getBoundingClientRect();

        const scaleX = viewBoxWidth / rect.width;
        const scaleY = viewBoxHeight / rect.height;
        const scale = Math.max(scaleX, scaleY);
        const renderedWidth = viewBoxWidth / scale;
        const renderedHeight = viewBoxHeight / scale;
        const offsetX = (rect.width - renderedWidth) / 2;
        const offsetY = (rect.height - renderedHeight) / 2;
        const baseSvgLeft = (rect.left - panelRect.left) + offsetX;
        const baseSvgTop = (rect.top - panelRect.top) + offsetY;

        const trunkColor = '#00e5ff';

        return html`
            <div style="
                position: absolute;
                left: ${baseSvgLeft}px;
                top: ${baseSvgTop}px;
                width: ${renderedWidth}px;
                height: ${renderedHeight}px;
                pointer-events: none;
                z-index: 997;
            ">
                ${trunks.map(t => {
                    const bandLeft = (t.bounds.x1 - viewBoxX) / scale;
                    const bandTop = (t.bounds.y1 - viewBoxY) / scale;
                    const bandWidth = (t.bounds.x2 - t.bounds.x1) / scale;
                    const bandHeight = (t.bounds.y2 - t.bounds.y1) / scale;
                    const horizontal = t.direction === 'horizontal';
                    const centerlinePx = horizontal
                        ? (t.crossCenter - viewBoxY) / scale - bandTop
                        : (t.crossCenter - viewBoxX) / scale - bandLeft;
                    return html`
                        <div style="
                            position: absolute;
                            left: ${bandLeft}px;
                            top: ${bandTop}px;
                            width: ${bandWidth}px;
                            height: ${bandHeight}px;
                            background: ${trunkColor};
                            opacity: 0.12;
                            border: 1px dashed ${trunkColor};
                            box-sizing: border-box;
                        "></div>
                        <div style="
                            position: absolute;
                            left: ${horizontal ? bandLeft : bandLeft + centerlinePx}px;
                            top: ${horizontal ? bandTop + centerlinePx : bandTop}px;
                            width: ${horizontal ? bandWidth : 1}px;
                            height: ${horizontal ? 1 : bandHeight}px;
                            background: ${trunkColor};
                            opacity: 0.6;
                        "></div>
                        <div style="
                            position: absolute;
                            left: ${bandLeft + 3}px;
                            top: ${bandTop + 2}px;
                            background: rgba(0, 0, 0, 0.7);
                            color: ${trunkColor};
                            padding: 1px 5px;
                            border-radius: 3px;
                            font-family: 'Courier New', monospace;
                            font-size: 9px;
                            white-space: nowrap;
                        ">${t.id} · ${t.members.length} line${t.members.length === 1 ? '' : 's'}</div>
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
        // @ts-ignore - TS2322: auto-suppressed
        if (!this._showAnchorMarkers) return '';

        // Get all anchors (user + base_svg)
        const userAnchors = this._workingConfig.msd?.anchors || {};
        const baseSvgAnchors = this._getBaseSvgAnchors();
        const allAnchors = { ...userAnchors, ...baseSvgAnchors };

        // @ts-ignore - TS2322: auto-suppressed
        if (Object.keys(allAnchors).length === 0) return '';

        // Get SVG for coordinate conversion
        const preview = this._getPreviewSvgAndViewBox();
        // @ts-ignore - TS2322: auto-suppressed
        if (!preview) return '';
        const { svg, viewBoxX, viewBoxY, viewBoxWidth, viewBoxHeight } = preview;

        const rect = svg.getBoundingClientRect();
        const previewPanel = this.shadowRoot.querySelector('.preview-panel');
        // @ts-ignore - TS2322: auto-suppressed
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
                ${Object.entries(allAnchors).map(([name, position], idx) => {
                    if (!Array.isArray(position)) return '';

                    const [vbX, vbY] = position;
                    // Convert viewBox coords to SVG pixels (CSS transform handles zoom)
                    const svgPixelX = (vbX - viewBoxX) / scale + offsetX;
                    const svgPixelY = (vbY - viewBoxY) / scale + offsetY;
                    const pixelX = (rect.left - panelRect.left) + svgPixelX;
                    const pixelY = (rect.top - panelRect.top) + svgPixelY;

                    if (idx === 0) {
                        lcardsLog.debug('[MSDStudio][ANCHOR] First anchor position:', {
                            name,
                            viewBox: { x: vbX, y: vbY },
                            svgPixel: { x: svgPixelX, y: svgPixelY },
                            finalPixel: { x: pixelX, y: pixelY },
                            calculation: `(${vbX} - ${viewBoxX}) / ${scale} + ${offsetX} = ${svgPixelX}`
                        });
                    }

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
        // @ts-ignore - TS2322: auto-suppressed
        if (!this._showBoundingBoxes) return '';

        // Only show bounding boxes for control overlays (not lines)
        const controls = (this._workingConfig.msd?.overlays || [])
            .filter(o => o.type === 'control');
        // @ts-ignore - TS2322: auto-suppressed
        if (controls.length === 0) return '';

        // Get SVG for coordinate conversion
        const preview = this._getPreviewSvgAndViewBox();
        // @ts-ignore - TS2322: auto-suppressed
        if (!preview) return '';
        const { msdCard, svg, viewBoxX, viewBoxY, viewBoxWidth, viewBoxHeight } = preview;

        const rect = svg.getBoundingClientRect();
        const previewPanel = this.shadowRoot.querySelector('.preview-panel');
        // @ts-ignore - TS2322: auto-suppressed
        if (!previewPanel) return '';
        const panelRect = previewPanel.getBoundingClientRect();

        const scaleX = viewBoxWidth / rect.width;
        const scaleY = viewBoxHeight / rect.height;
        const scale = Math.max(scaleX, scaleY);

        const renderedWidth = viewBoxWidth / scale;
        const renderedHeight = viewBoxHeight / scale;
        const offsetX = (rect.width - renderedWidth) / 2;
        const offsetY = (rect.height - renderedHeight) / 2;

        // Get all anchors from the card's resolved model (already merged base SVG + user-defined)
        // @ts-ignore - TS2339: auto-suppressed
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
                    // Resolve position for both anchored and explicitly positioned controls,
                    // including control-to-control positioning (position_side).
                    if (!control.position && !control.anchor) {
                        lcardsLog.warn('[MSDStudio] Control has no valid position:', control.id);
                        return '';
                    }
                    const resolvedPosition = this._resolveEditorControlPosition(control, anchors);
                    if (!resolvedPosition) {
                        lcardsLog.warn('[MSDStudio] Failed to resolve position:', control.position || control.anchor, control.id);
                        return '';
                    }

                    // Get size - default to 100x100 if not specified
                    const size = control.size || [100, 100];
                    if (!Array.isArray(size)) return '';

                    let [vbX, vbY] = resolvedPosition;
                    const [width, height] = size;

                    // Apply attachment offset (same logic as MsdControlsRenderer)
                    const attachment = control.attachment || 'center';
                    const offset = this._getAttachmentOffset(attachment, width, height);
                    vbX += offset[0];
                    vbY += offset[1];

                    // Convert to SVG pixels (CSS transform handles zoom)
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

                            <!-- Live W×H / attach-point readout while actively dragging or resizing -->
                            ${this._renderLiveCoordBadge(isDragging, isResizing, control.position, control.size)}
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
     * Render interactive drag/resize handles for rect/circle shape overlays —
     * mirrors _renderBoundingBoxes exactly (same toggle, same bbox+8-handle
     * layout), simplified since a shape's position is always its literal
     * top-left corner (no attachment-offset concept like controls have).
     * @returns {TemplateResult}
     * @private
     */
    _renderShapeHandles() {
        // @ts-ignore - TS2322: auto-suppressed
        if (!this._showBoundingBoxes) return '';

        const shapes = (this._workingConfig.msd?.overlays || [])
            .filter(o => o.type === 'shape' && (o.kind === 'rect' || o.kind === 'circle') && Array.isArray(o.position));
        // @ts-ignore - TS2322: auto-suppressed
        if (shapes.length === 0) return '';

        const preview = this._getPreviewSvgAndViewBox();
        // @ts-ignore - TS2322: auto-suppressed
        if (!preview) return '';
        const { svg, viewBoxX, viewBoxY, viewBoxWidth, viewBoxHeight } = preview;

        const rect = svg.getBoundingClientRect();
        const previewPanel = this.shadowRoot.querySelector('.preview-panel');
        // @ts-ignore - TS2322: auto-suppressed
        if (!previewPanel) return '';
        const panelRect = previewPanel.getBoundingClientRect();

        const scale = Math.max(viewBoxWidth / rect.width, viewBoxHeight / rect.height);
        const renderedWidth = viewBoxWidth / scale;
        const renderedHeight = viewBoxHeight / scale;
        const offsetX = (rect.width - renderedWidth) / 2;
        const offsetY = (rect.height - renderedHeight) / 2;

        return html`
            <div style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; pointer-events: none; z-index: 998;">
                ${shapes.map(shape => {
                    const [vbX, vbY] = shape.position;
                    const [width, height] = shape.size || [100, 60];

                    const svgPixelX = (vbX - viewBoxX) / scale + offsetX;
                    const svgPixelY = (vbY - viewBoxY) / scale + offsetY;
                    const pixelWidth = width / scale;
                    const pixelHeight = height / scale;
                    const pixelX = (rect.left - panelRect.left) + svgPixelX;
                    const pixelY = (rect.top - panelRect.top) + svgPixelY;

                    const isDragging = this._shapeDragState.active && this._shapeDragState.shapeId === shape.id;
                    const isResizing = this._shapeResizeState.active && this._shapeResizeState.shapeId === shape.id;
                    const borderRadius = shape.kind === 'circle' ? '50%' : '0';

                    return html`
                        <div
                            class="interactive-bbox ${isDragging ? 'bbox-dragging' : ''} ${isResizing ? 'bbox-resizing' : ''}"
                            data-shape-id="${shape.id}"
                            style="
                                position: absolute;
                                left: ${pixelX}px;
                                top: ${pixelY}px;
                                width: ${pixelWidth}px;
                                height: ${pixelHeight}px;
                                border: 2px solid #00CC88;
                                border-radius: ${borderRadius};
                                opacity: 0.6;
                                pointer-events: auto;
                            "
                            @mousedown=${(e) => this._handleShapeDragStart(e, shape.id)}
                            @dblclick=${(e) => { e.stopPropagation(); this._editShape(shape); }}>
                            ${this._renderShapeResizeHandles(shape.id, pixelWidth, pixelHeight, isResizing)}
                            ${this._renderLiveCoordBadge(isDragging, isResizing, shape.position, shape.size)}
                        </div>
                        <div style="
                            position: absolute;
                            left: ${pixelX + 4}px;
                            top: ${pixelY + 4}px;
                            background: rgba(0, 204, 136, 0.8);
                            color: white;
                            padding: 2px 6px;
                            border-radius: 3px;
                            font-family: 'Courier New', monospace;
                            font-size: 10px;
                            white-space: nowrap;
                            pointer-events: none;
                        ">
                            ${shape.id}
                        </div>
                    `;
                })}
            </div>
        `;
    }

    /**
     * Render small "insert point" markers at the midpoint of each segment of
     * the currently-selected polyline shape (one between each adjacent pair of
     * vertices, plus one on the closing segment — last vertex back to the
     * first — when the shape is `closed`). Clicking one splices a new vertex
     * into `shape.points` at the correct array index. Deliberately styled and
     * classed differently from the real vertex markers rendered by
     * _renderShapeVertexMarkers (smaller, diamond, its own CSS class) so it
     * can't be confused with — or accidentally matched by logic that checks
     * for — a real vertex marker.
     * @returns {TemplateResult}
     * @private
     */
    _renderShapeSegmentInsertMarkers() {
        // @ts-ignore - TS2322: auto-suppressed
        if (!this._selectedShapeId) return '';

        const overlays = this._workingConfig.msd?.overlays || [];
        const selectedShape = overlays.find(o => o.id === this._selectedShapeId && o.type === 'shape' && o.kind === 'polyline');
        // @ts-ignore - TS2322: auto-suppressed
        if (!selectedShape || !Array.isArray(selectedShape.points) || selectedShape.points.length < 2) return '';
        // Same cap as _renderShapeVertexMarkers, same rationale (one interactive
        // marker per segment on top of one per vertex would double the DOM cost
        // for a bulk-generated shape with hundreds of points).
        if (selectedShape.points.length > MAX_INLINE_EDITABLE_SHAPE_POINTS) return '';

        const vbToPixel = this._getViewBoxToPixelConverter();
        // @ts-ignore - TS2322: auto-suppressed
        if (!vbToPixel) return '';

        const points = selectedShape.points;
        const segments = [];
        for (let i = 0; i < points.length - 1; i++) {
            segments.push({ a: points[i], b: points[i + 1], insertIndex: i + 1 });
        }
        if (selectedShape.closed) {
            segments.push({ a: points[points.length - 1], b: points[0], insertIndex: points.length });
        }

        return html`
            <div style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none; z-index: 1000;">
                ${segments.map(({ a, b, insertIndex }) => {
                    if (!Array.isArray(a) || a.length < 2 || !Array.isArray(b) || b.length < 2) return '';
                    const midX = (a[0] + b[0]) / 2;
                    const midY = (a[1] + b[1]) / 2;
                    const [pixelX, pixelY] = vbToPixel(midX, midY);

                    return html`
                        <div
                            class="shape-segment-insert-marker"
                            style="
                                position: absolute;
                                left: ${pixelX}px;
                                top: ${pixelY}px;
                                transform: translate(-50%, -50%) rotate(45deg);
                                width: 12px;
                                height: 12px;
                                background: rgba(0, 204, 136, 0.55);
                                border: 1px dashed #FFF;
                                cursor: pointer;
                                pointer-events: auto;
                                box-shadow: 0 1px 4px rgba(0,0,0,0.3);
                                z-index: 1000;
                            "
                            @click=${(e) => this._handleShapeSegmentInsertClick(e, selectedShape.id, insertIndex, midX, midY)}
                            title="Click to insert a point here">
                        </div>
                    `;
                })}
            </div>
        `;
    }

    /**
     * Render draggable vertex markers for the currently-selected polyline shape
     * — mirrors _renderWaypointMarkers exactly (same marker style/drag/double-
     * click-to-delete convention), operating on a shape's `points` instead of a
     * line's `waypoints`.
     * @returns {TemplateResult}
     * @private
     */
    _renderShapeVertexMarkers() {
        // @ts-ignore - TS2322: auto-suppressed
        if (!this._selectedShapeId) return '';

        const overlays = this._workingConfig.msd?.overlays || [];
        const selectedShape = overlays.find(o => o.id === this._selectedShapeId && o.type === 'shape' && o.kind === 'polyline');
        // @ts-ignore - TS2322: auto-suppressed
        if (!selectedShape || !Array.isArray(selectedShape.points) || selectedShape.points.length === 0) return '';
        // Same cap as _renderShapeFormGeometry's points-form gate, and for
        // the same reason: one interactive draggable marker <div> per point,
        // re-rendered far more often than the form (canvas mousemove, not
        // just form-open) - the dominant real cost for a bulk-generated
        // shape with hundreds of points. Drag-to-edit isn't a realistic way
        // to adjust that many points anyway; the YAML tab is.
        if (selectedShape.points.length > MAX_INLINE_EDITABLE_SHAPE_POINTS) return '';

        const livePreview = this.shadowRoot.querySelector('lcards-msd-live-preview');
        // @ts-ignore - TS2322: auto-suppressed
        if (!livePreview) return '';
        const livePreviewShadow = livePreview.shadowRoot;
        // @ts-ignore - TS2322: auto-suppressed
        if (!livePreviewShadow) return '';
        const cardContainer = livePreviewShadow.querySelector('.preview-card-container');
        // @ts-ignore - TS2322: auto-suppressed
        if (!cardContainer) return '';
        const msdCard = cardContainer.querySelector('lcards-msd-card');
        // @ts-ignore - TS2322: auto-suppressed
        if (!msdCard) return '';
        // @ts-ignore - TS2339: auto-suppressed
        const shadowRoot = msdCard.shadowRoot || msdCard.renderRoot;
        // @ts-ignore - TS2322: auto-suppressed
        if (!shadowRoot) return '';
        const svg = shadowRoot.querySelector('svg');
        // @ts-ignore - TS2322: auto-suppressed
        if (!svg) return '';

        const viewBox = svg.getAttribute('viewBox')?.split(' ').map(Number);
        // @ts-ignore - TS2322: auto-suppressed
        if (!viewBox || viewBox.length !== 4) return '';
        const [viewBoxX, viewBoxY, viewBoxWidth, viewBoxHeight] = viewBox;
        const rect = svg.getBoundingClientRect();
        const panelRect = this.shadowRoot.querySelector('.preview-panel')?.getBoundingClientRect();
        // @ts-ignore - TS2322: auto-suppressed
        if (!panelRect) return '';

        const scale = Math.max(viewBoxWidth / rect.width, viewBoxHeight / rect.height);
        const renderedWidth = viewBoxWidth / scale;
        const renderedHeight = viewBoxHeight / scale;
        const offsetX = (rect.width - renderedWidth) / 2;
        const offsetY = (rect.height - renderedHeight) / 2;

        const vbToPixel = (vbX, vbY) => {
            const svgX = (vbX - viewBoxX) / scale + offsetX;
            const svgY = (vbY - viewBoxY) / scale + offsetY;
            return [svgX + (rect.left - panelRect.left), svgY + (rect.top - panelRect.top)];
        };

        return html`
            <div style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none; z-index: 1000;">
                ${selectedShape.points.map((pt, i) => {
                    if (!Array.isArray(pt) || pt.length < 2) return '';
                    const [pixelX, pixelY] = vbToPixel(pt[0], pt[1]);
                    const isDragging = this._shapeVertexDragState?.shapeId === selectedShape.id &&
                                        this._shapeVertexDragState?.vertexIndex === i;

                    return html`
                        <div
                            class="waypoint-marker editing ${isDragging ? 'dragging' : ''}"
                            style="
                                position: absolute;
                                left: ${pixelX}px;
                                top: ${pixelY}px;
                                transform: translate(-50%, -50%);
                                width: 24px;
                                height: 24px;
                                border-radius: 50%;
                                background: ${isDragging ? '#FFAA00' : '#00CC88'};
                                border: 2px solid #FFF;
                                cursor: move;
                                pointer-events: auto;
                                box-shadow: 0 2px 8px rgba(0,0,0,0.3);
                                z-index: ${isDragging ? '1002' : '1001'};
                                display: flex;
                                align-items: center;
                                justify-content: center;
                                font-family: 'Antonio', sans-serif;
                                font-size: 12px;
                                font-weight: 700;
                                color: #000;
                            "
                            @mousedown=${(e) => this._handleShapeVertexMouseDown(e, selectedShape.id, i)}
                            @dblclick=${(e) => this._handleShapeVertexDoubleClick(e, selectedShape.id, i)}
                            title="Point ${i + 1} (Drag to move, Double-click to delete)">
                            ${i + 1}
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
        // @ts-ignore - TS2322: auto-suppressed
        if (!this._showRoutingPaths) return '';

        lcardsLog.trace('[MSDStudio] _renderRoutingPaths called, _showRoutingPaths:', this._showRoutingPaths);

        const overlays = this._workingConfig.msd?.overlays || [];
        const lines = overlays.filter(o => o.type === 'line');
        if (lines.length === 0) {
            lcardsLog.trace('[MSDStudio] No line overlays found');
            // @ts-ignore - TS2322: auto-suppressed
            return '';
        }

        lcardsLog.trace('[MSDStudio] Found', lines.length, 'line overlays');

        // Get all anchors (user + base_svg)
        const userAnchors = this._workingConfig.msd?.anchors || {};
        const baseSvgAnchors = this._getBaseSvgAnchors();
        const allAnchors = { ...userAnchors, ...baseSvgAnchors };

        // Get SVG for coordinate conversion
        const preview = this._getPreviewSvgAndViewBox();
        // @ts-ignore - TS2322: auto-suppressed
        if (!preview) return '';
        const { svg, viewBoxX, viewBoxY, viewBoxWidth, viewBoxHeight } = preview;

        const rect = svg.getBoundingClientRect();
        const previewPanel = this.shadowRoot.querySelector('.preview-panel');
        // @ts-ignore - TS2322: auto-suppressed
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

                    // Convert to SVG pixels (CSS transform handles zoom)
                    const svgStartX = (startX - viewBoxX) / scale + offsetX;
                    const svgStartY = (startY - viewBoxY) / scale + offsetY;
                    const svgEndX = (endX - viewBoxX) / scale + offsetX;
                    const svgEndY = (endY - viewBoxY) / scale + offsetY;

                    const pixelStartX = (rect.left - panelRect.left) + svgStartX;
                    const pixelStartY = (rect.top - panelRect.top) + svgStartY;
                    const pixelEndX = (rect.left - panelRect.left) + svgEndX;
                    const pixelEndY = (rect.top - panelRect.top) + svgEndY;

                    const rawLineColor = line.style?.color;
                    const color = (typeof rawLineColor === 'object' && rawLineColor !== null)
                        ? (rawLineColor.default || rawLineColor.active || Object.values(rawLineColor)[0] || '#00FFAA')
                        : (rawLineColor || '#00FFAA');
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
        // @ts-ignore - TS2322: auto-suppressed
        if (!this._showRoutingPaths) return '';

        const overlays = this._workingConfig.msd?.overlays || [];
        const lines = overlays.filter(o => o.type === 'line');
        // @ts-ignore - TS2322: auto-suppressed
        if (lines.length === 0) return '';

        // Get anchors
        const userAnchors = this._workingConfig.msd?.anchors || {};
        const baseSvgAnchors = this._getBaseSvgAnchors();
        const allAnchors = { ...userAnchors, ...baseSvgAnchors };

        // Get coordinate conversion context (same as _renderRoutingPaths)
        const livePreview = this.shadowRoot.querySelector('lcards-msd-live-preview');
        // @ts-ignore - TS2322: auto-suppressed
        if (!livePreview) return '';

        const livePreviewShadow = livePreview.shadowRoot;
        // @ts-ignore - TS2322: auto-suppressed
        if (!livePreviewShadow) return '';

        const cardContainer = livePreviewShadow.querySelector('.preview-card-container');
        // @ts-ignore - TS2322: auto-suppressed
        if (!cardContainer) return '';

        const msdCard = cardContainer.querySelector('lcards-msd-card');
        // @ts-ignore - TS2322: auto-suppressed
        if (!msdCard) return '';

        // @ts-ignore - TS2339: auto-suppressed
        const shadowRoot = msdCard.shadowRoot || msdCard.renderRoot;
        // @ts-ignore - TS2322: auto-suppressed
        if (!shadowRoot) return '';

        const svg = shadowRoot.querySelector('svg');
        // @ts-ignore - TS2322: auto-suppressed
        if (!svg) return '';

        const viewBox = svg.getAttribute('viewBox')?.split(' ').map(Number);
        // @ts-ignore - TS2322: auto-suppressed
        if (!viewBox || viewBox.length !== 4) return '';

        const [viewBoxX, viewBoxY, viewBoxWidth, viewBoxHeight] = viewBox;
        const rect = svg.getBoundingClientRect();
        const panelRect = this.shadowRoot.querySelector('.preview-panel')?.getBoundingClientRect();
        // @ts-ignore - TS2322: auto-suppressed
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

                    // Convert to screen coordinates (CSS transform handles zoom)
                    const [startX, startY] = startPos;
                    const [endX, endY] = endPos;

                    const svgStartX = (startX - viewBoxX) / scale + offsetX;
                    const svgStartY = (startY - viewBoxY) / scale + offsetY;
                    const svgEndX = (endX - viewBoxX) / scale + offsetX;
                    const svgEndY = (endY - viewBoxY) / scale + offsetY;

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
                        // @ts-ignore - TS2552: auto-suppressed
                        svgDragX = svgDragX * zoomK + zoomX;
                        // @ts-ignore - TS2552: auto-suppressed
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
        // @ts-ignore - TS2322: auto-suppressed
        return '';
    }

    /**
     * Render persistent routing channels overlay
     * Shows all routing channel areas when toggled on in Lines tab
     * @returns {TemplateResult}
     * @private
     */
    _renderChannelsOverlay() {
        // @ts-ignore - TS2322: auto-suppressed
        if (!this._showRoutingChannels) return '';

        lcardsLog.trace('[MSDStudio] _renderChannelsOverlay called, _showRoutingChannels:', this._showRoutingChannels);

        const channels = this._workingConfig.msd?.channels || {};
        if (Object.keys(channels).length === 0) {
            lcardsLog.trace('[MSDStudio] No channels found');
            // @ts-ignore - TS2322: auto-suppressed
            return '';
        }

        lcardsLog.trace('[MSDStudio] Found', Object.keys(channels).length, 'channels');

        // Get SVG for coordinate conversion
        const preview = this._getPreviewSvgAndViewBox();
        // @ts-ignore - TS2322: auto-suppressed
        if (!preview) return '';
        const { svg, viewBoxX, viewBoxY, viewBoxWidth, viewBoxHeight } = preview;

        const rect = svg.getBoundingClientRect();
        const previewPanel = this.shadowRoot.querySelector('.preview-panel');
        // @ts-ignore - TS2322: auto-suppressed
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
                    const isDragging = this._channelDragState.active && this._channelDragState.channelId === channelId;

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
                            class="interactive-channel ${isResizing ? 'channel-resizing' : ''} ${isDragging ? 'channel-dragging' : ''}"
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
                            @mousedown=${(e) => this._handleChannelDragStart(e, channelId)}
                            @dblclick=${(e) => this._handleChannelDoubleClick(e, channelId)}>

                            <!-- Resize Handles (only render when not dragging) -->
                            ${this._renderChannelResizeHandles(channelId, pixelWidth, pixelHeight, isResizing)}
                            ${this._renderLiveCoordBadge(isDragging, isResizing, [x, y], [width, height])}
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
     * Render small "insert point" markers at the midpoint of each segment of
     * the selected line's resolved path — the resolved sequence being
     * [start-anchor, ...waypoints, end-anchor]. Unlike _renderWaypointMarkers,
     * this renders even when the line has zero waypoints (a single segment
     * from start to end), so a waypoint can be placed precisely without going
     * through ADD_WAYPOINT mode's append-only click behavior. Clicking a
     * marker splices a new waypoint into `line.waypoints` at the index that
     * segment corresponds to. Deliberately styled/classed differently from the
     * real waypoint markers (smaller, diamond, its own CSS class) so it can't
     * be confused with — or accidentally matched by logic that checks for — a
     * real waypoint marker (see the `.waypoint-marker` class check in
     * _handlePreviewClick's ADD_WAYPOINT branch).
     * @returns {TemplateResult}
     * @private
     */
    _renderWaypointInsertMarkers() {
        // @ts-ignore - TS2322: auto-suppressed
        if (!this._showWaypointMarkers || !this._selectedLineId) return '';

        const overlays = this._workingConfig.msd?.overlays || [];
        const selectedLine = overlays.find(o => o.id === this._selectedLineId && o.type === 'line');
        // @ts-ignore - TS2322: auto-suppressed
        if (!selectedLine) return '';

        const start = this._resolvePositionWithSide(selectedLine.anchor, selectedLine.anchor_side);
        // @ts-ignore - TS2322: auto-suppressed
        if (!start) return '';
        let endTarget = selectedLine.attach_to;
        if (Array.isArray(endTarget)) {
            endTarget = endTarget[endTarget.length - 1];
        }
        const end = this._resolvePositionWithSide(endTarget, selectedLine.attach_side);
        // @ts-ignore - TS2322: auto-suppressed
        if (!end) return '';

        const vbToPixel = this._getViewBoxToPixelConverter();
        // @ts-ignore - TS2322: auto-suppressed
        if (!vbToPixel) return '';

        const userAnchors = this._workingConfig.msd?.anchors || {};
        const baseSvgAnchors = this._getBaseSvgAnchors();
        const allAnchors = { ...baseSvgAnchors, ...userAnchors };

        const waypoints = Array.isArray(selectedLine.waypoints) ? selectedLine.waypoints : [];
        const resolveEntry = (entry) => {
            if (Array.isArray(entry) && entry.length >= 2) return [entry[0], entry[1]];
            if (typeof entry === 'string' && allAnchors[entry]) return allAnchors[entry];
            return null;
        };

        const segments = [];
        for (let i = 0; i <= waypoints.length; i++) {
            const segStart = i === 0 ? start : resolveEntry(waypoints[i - 1]);
            const segEnd = i === waypoints.length ? end : resolveEntry(waypoints[i]);
            if (!segStart || !segEnd) continue;
            segments.push({ segStart, segEnd, insertIndex: i });
        }

        return html`
            <div style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none; z-index: 1000;">
                ${segments.map(({ segStart, segEnd, insertIndex }) => {
                    const midX = (segStart[0] + segEnd[0]) / 2;
                    const midY = (segStart[1] + segEnd[1]) / 2;
                    const [pixelX, pixelY] = vbToPixel(midX, midY);

                    return html`
                        <div
                            class="waypoint-insert-marker"
                            style="
                                position: absolute;
                                left: ${pixelX}px;
                                top: ${pixelY}px;
                                transform: translate(-50%, -50%) rotate(45deg);
                                width: 12px;
                                height: 12px;
                                background: rgba(0, 255, 136, 0.5);
                                border: 1px dashed #FFF;
                                cursor: pointer;
                                pointer-events: auto;
                                box-shadow: 0 1px 4px rgba(0,0,0,0.3);
                                z-index: 1000;
                            "
                            @click=${(e) => this._handleWaypointInsertClick(e, selectedLine.id, insertIndex, midX, midY)}
                            title="Click to insert a waypoint here">
                        </div>
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
        // @ts-ignore - TS2322: auto-suppressed
        if (!this._showWaypointMarkers || !this._selectedLineId) return '';

        const overlays = this._workingConfig.msd?.overlays || [];
        const selectedLine = overlays.find(o => o.id === this._selectedLineId);

        // Show markers only for selected line if it has waypoints
        // @ts-ignore - TS2322: auto-suppressed
        if (!selectedLine || !selectedLine.waypoints || selectedLine.waypoints.length === 0) return '';

        // Get coordinate conversion context
        const livePreview = this.shadowRoot.querySelector('lcards-msd-live-preview');
        // @ts-ignore - TS2322: auto-suppressed
        if (!livePreview) return '';

        const livePreviewShadow = livePreview.shadowRoot;
        // @ts-ignore - TS2322: auto-suppressed
        if (!livePreviewShadow) return '';

        const cardContainer = livePreviewShadow.querySelector('.preview-card-container');
        // @ts-ignore - TS2322: auto-suppressed
        if (!cardContainer) return '';

        const msdCard = cardContainer.querySelector('lcards-msd-card');
        // @ts-ignore - TS2322: auto-suppressed
        if (!msdCard) return '';

        // @ts-ignore - TS2339: auto-suppressed
        const shadowRoot = msdCard.shadowRoot || msdCard.renderRoot;
        // @ts-ignore - TS2322: auto-suppressed
        if (!shadowRoot) return '';

        const svg = shadowRoot.querySelector('svg');
        // @ts-ignore - TS2322: auto-suppressed
        if (!svg) return '';

        const viewBox = svg.getAttribute('viewBox')?.split(' ').map(Number);
        // @ts-ignore - TS2322: auto-suppressed
        if (!viewBox || viewBox.length !== 4) return '';

        const [viewBoxX, viewBoxY, viewBoxWidth, viewBoxHeight] = viewBox;
        const rect = svg.getBoundingClientRect();
        const panelRect = this.shadowRoot.querySelector('.preview-panel')?.getBoundingClientRect();
        // @ts-ignore - TS2322: auto-suppressed
        if (!panelRect) return '';

        const scale = Math.max(viewBoxWidth / rect.width, viewBoxHeight / rect.height);
        const renderedWidth = viewBoxWidth / scale;
        const renderedHeight = viewBoxHeight / scale;
        const offsetX = (rect.width - renderedWidth) / 2;
        const offsetY = (rect.height - renderedHeight) / 2;

        // Helper to convert viewBox to pixel coordinates (CSS transform handles zoom)
        const vbToPixel = (vbX, vbY) => {
            const svgX = (vbX - viewBoxX) / scale + offsetX;
            const svgY = (vbY - viewBoxY) / scale + offsetY;
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
                        // @ts-ignore - TS2322: auto-suppressed
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
     * Insert a new waypoint at a segment's midpoint (click on a segment-insert
     * marker rendered between two adjacent resolved points of the line's path
     * — the resolved sequence being [start-anchor, ...waypoints, end-anchor]).
     * `insertIndex` is the position within `line.waypoints` the new point is
     * spliced into (0 for the start-anchor→first-waypoint segment, up to
     * `waypoints.length` for the last-waypoint→end-anchor segment).
     * @param {MouseEvent} e
     * @param {string} lineId
     * @param {number} insertIndex
     * @param {number} midX - viewBox X of the segment midpoint
     * @param {number} midY - viewBox Y of the segment midpoint
     * @private
     */
    _handleWaypointInsertClick(e, lineId, insertIndex, midX, midY) {
        e.stopPropagation();
        e.preventDefault();

        const overlays = this._workingConfig.msd?.overlays || [];
        const line = overlays.find(o => o.id === lineId && o.type === 'line');
        if (!line) return;

        if (line.route !== 'manual') {
            line.route = 'manual';
        }
        if (!Array.isArray(line.waypoints)) {
            line.waypoints = [];
        }

        line.waypoints.splice(insertIndex, 0, [this._roundToPrecision(midX), this._roundToPrecision(midY)]);

        if (this._lineFormData?.id === lineId) {
            this._lineFormData.route = 'manual';
            this._lineFormData.waypoints = [...line.waypoints];
        }

        lcardsLog.debug(`[MSDStudio] Inserted waypoint at index ${insertIndex} on line ${lineId}`);

        this._schedulePreviewUpdate();
        this.requestUpdate();
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

        // @ts-ignore - TS2339: auto-suppressed
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
        // @ts-ignore - TS2322: auto-suppressed
        if (!this._highlightedChannel) return '';

        // Find the channel
        const channels = this._workingConfig.msd?.channels || {};
        const channel = channels[this._highlightedChannel];
        // @ts-ignore - TS2322: auto-suppressed
        if (!channel || !channel.bounds) return '';

        const [x, y, width, height] = channel.bounds;

        // Get SVG element and calculate pixel positions
        const preview = this._getPreviewSvgAndViewBox();
        // @ts-ignore - TS2322: auto-suppressed
        if (!preview) return '';
        const { svg, viewBoxX, viewBoxY, viewBoxWidth, viewBoxHeight } = preview;

        // Get SVG rect and calculate position
        const rect = svg.getBoundingClientRect();
        const previewPanel = this.shadowRoot.querySelector('.preview-panel');
        // @ts-ignore - TS2322: auto-suppressed
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
        // @ts-ignore - TS2322: auto-suppressed
        if (this._activeMode === MODES.ADD_WAYPOINT) return '';

        // Show attachment points when in connect line mode OR when toggle is on
        // @ts-ignore - TS2322: auto-suppressed
        if (this._activeMode !== MODES.CONNECT_LINE && !this._showAttachmentPoints) return '';

        // Get all anchors (user-defined + base SVG) and controls
        const userAnchors = this._workingConfig.msd?.anchors || {};
        const baseSvgAnchors = this._getBaseSvgAnchors();
        const anchors = { ...baseSvgAnchors, ...userAnchors };  // Merge, user anchors override
        const controls = this._getControlOverlays();

        // Try to find the SVG to calculate pixel positions
        const preview = this._getPreviewSvgAndViewBox();
        // @ts-ignore - TS2322: auto-suppressed
        if (!preview) return '';
        const { svg, viewBoxX, viewBoxY, viewBoxWidth, viewBoxHeight } = preview;

        // Get SVG rect and calculate position helpers
        const rect = svg.getBoundingClientRect();
        const previewPanel = this.shadowRoot.querySelector('.preview-panel');
        // @ts-ignore - TS2322: auto-suppressed
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

        // Helper function to convert viewBox coords to pixel position (CSS transform handles zoom)
        const toPixelPos = (vbX, vbY) => {
            const svgPixelX = (vbX - viewBoxX) / scale + offsetX;
            const svgPixelY = (vbY - viewBoxY) / scale + offsetY;
            return {
                x: (rect.left - panelRect.left) + svgPixelX,
                y: (rect.top - panelRect.top) + svgPixelY
            };
        };

        // 9-point attachment positions for controls (relative offsets) — also
        // reused below for rect/circle shapes, which position from top-left
        // directly (no attachment-offset map needed, unlike controls).
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

        // While a control's edit form is open, highlight its own configured attachment
        // point (live form value, so it updates as the user picks a new one), and — if
        // its position references another control (position_side) — highlight that
        // point on the target control too, so both ends of the attachment are visible.
        const editingPositionTargetId = (this._showControlForm && typeof this._controlFormPosition === 'string')
            ? this._controlFormPosition
            : null;
        const editingPositionTargetSide = this._controlFormPositionSide || 'center';

        // Render attachment points for controls (rectangles with corners and edges)
        const controlElements = controls.map((control, index) => {
            // Resolve position: [x,y] array, named anchor string, or another control's
            // id (optionally with position_side) — see _resolveEditorControlPosition.
            if (!control.position && !control.anchor) {
                lcardsLog.warn('[MSDStudio] Control has neither position nor anchor:', control.id);
                return '';
            }
            const resolvedPosition = this._resolveEditorControlPosition(control, anchors);
            if (!resolvedPosition) {
                lcardsLog.warn('[MSDStudio] Failed to resolve position for control:', control.id, control.position || control.anchor);
                return '';
            }

            if (!control.size) {
                lcardsLog.warn('[MSDStudio] Control missing size:', control.id);
                return '';
            }

            const [rawX, rawY] = resolvedPosition;
            const [width, height] = control.size;
            const attachment = control.attachment || 'center';

            // Apply attachment offset (same logic as MsdControlsRenderer)
            const offset = this._getAttachmentOffset(attachment, width, height);
            const vbX = rawX + offset[0];
            const vbY = rawY + offset[1];

            // Calculate control corners
            const topLeft = toPixelPos(vbX, vbY);
            const bottomRight = toPixelPos(vbX + width, vbY + height);
            const centerX = (topLeft.x + bottomRight.x) / 2;
            const centerY = (topLeft.y + bottomRight.y) / 2;
            const pixelWidth = bottomRight.x - topLeft.x;
            const pixelHeight = bottomRight.y - topLeft.y;

            // Configured attachment point for this control: live form value while its
            // own edit form is open, otherwise its saved config value.
            const configuredAttachment = (this._showControlForm && this._editingControlId === control.id)
                ? (this._controlFormAttachment || 'center')
                : (control.attachment || 'center');

            // Use 9-point grid for controls
            return controlAttachmentPoints.map(point => {
                const px = centerX + (point.dx * pixelWidth / 2);
                const py = centerY + (point.dy * pixelHeight / 2);

                const isSource = this._connectLineState.source?.type === 'control' &&
                                this._connectLineState.source?.id === control.id &&
                                this._connectLineState.source?.point === point.name;
                const isPositionTarget = editingPositionTargetId === control.id && point.name === editingPositionTargetSide;
                const isOwnConfigured = point.name === configuredAttachment;

                let background = '#FF9900', border = '#F57C00', outline = 'none';
                let boxShadow = '0 0 8px rgba(255, 153, 0, 0.6)';
                if (isSource) {
                    background = '#2196F3'; border = '#1976D2';
                    boxShadow = '0 0 8px rgba(33, 150, 243, 0.8)';
                } else if (isPositionTarget) {
                    background = '#E040FB'; border = '#AA00FF';
                    boxShadow = '0 0 8px rgba(224, 64, 251, 0.8)';
                } else if (isOwnConfigured) {
                    outline = '2px solid #FFFFFF';
                    boxShadow = '0 0 8px rgba(255, 153, 0, 0.6), 0 0 0 4px rgba(255, 255, 255, 0.35)';
                }

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
                            background: ${background};
                            border: 2px solid ${border};
                            outline: ${outline};
                            outline-offset: 2px;
                            border-radius: 50%;
                            cursor: pointer;
                            box-shadow: ${boxShadow};
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

        // Render attachment points for shapes: 9-point bbox grid (rect/circle,
        // same relative math as controls above, matching the kebab-case corner
        // aliases AdvancedRenderer now registers) or one dot per vertex
        // (polyline — anchor-referenced points are skipped rather than
        // resolved, same simplification _renderShapeVertexMarkers already
        // makes since those aren't literal coordinates to project to
        // pixel-space). Distinct color from anchors (cyan) and controls
        // (orange) — matches the existing shape bounding-box/vertex-marker
        // green used elsewhere in this file.
        const shapes = this._getShapeOverlays();
        const shapeElements = shapes.map(shape => {
            const isSourceAt = (pointName) =>
                this._connectLineState.source?.type === 'shape' &&
                this._connectLineState.source?.id === shape.id &&
                this._connectLineState.source?.point === pointName;

            const renderDot = (pointName, px, py) => {
                const isSource = isSourceAt(pointName);
                return html`
                    <div
                        class="attachment-point"
                        data-connection-type="shape"
                        data-connection-id="${shape.id}"
                        data-connection-point="${pointName}"
                        @click=${this._handleAttachmentPointClick}
                        style="
                            position: absolute;
                            left: ${px}px;
                            top: ${py}px;
                            transform: translate(-50%, -50%);
                            width: 12px;
                            height: 12px;
                            background: ${isSource ? '#2196F3' : '#00CC88'};
                            border: 2px solid ${isSource ? '#1976D2' : '#009966'};
                            border-radius: 50%;
                            cursor: pointer;
                            box-shadow: 0 0 8px ${isSource ? 'rgba(33, 150, 243, 0.8)' : 'rgba(0, 204, 136, 0.6)'};
                            transition: all 0.2s;
                            pointer-events: auto;
                            z-index: 1000;
                        "
                        @mouseenter=${(e) => e.target.style.transform = 'translate(-50%, -50%) scale(1.5)'}
                        @mouseleave=${(e) => e.target.style.transform = 'translate(-50%, -50%) scale(1)'}
                    ></div>
                `;
            };

            if (shape.kind === 'polyline') {
                if (!Array.isArray(shape.points)) return '';
                // Same cap as _renderShapeFormGeometry/_renderShapeVertexMarkers,
                // and more consequential here: this runs for EVERY polyline
                // shape at once (not just a selected one) whenever the
                // Attachment Points toggle or Connect Mode is active.
                if (shape.points.length > MAX_INLINE_EDITABLE_SHAPE_POINTS) return '';
                return shape.points.map((pt, i) => {
                    if (!Array.isArray(pt) || pt.length < 2) return '';
                    const pixelPos = toPixelPos(pt[0], pt[1]);
                    return renderDot(`vertex${i}`, pixelPos.x, pixelPos.y);
                });
            }

            // rect/circle: shapes position from top-left directly, no
            // attachment-offset map needed (unlike controls' `attachment` field).
            if (!Array.isArray(shape.position) || !Array.isArray(shape.size)) return '';
            const [vbX, vbY] = shape.position;
            const [width, height] = shape.size;
            const topLeft = toPixelPos(vbX, vbY);
            const bottomRight = toPixelPos(vbX + width, vbY + height);
            const centerX = (topLeft.x + bottomRight.x) / 2;
            const centerY = (topLeft.y + bottomRight.y) / 2;
            const pixelWidth = bottomRight.x - topLeft.x;
            const pixelHeight = bottomRight.y - topLeft.y;

            return controlAttachmentPoints.map(point => renderDot(
                point.name,
                centerX + (point.dx * pixelWidth / 2),
                centerY + (point.dy * pixelHeight / 2)
            ));
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
                ${shapeElements}
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
            // @ts-ignore - TS2339: auto-suppressed
            type: target.dataset.connectionType,
            // @ts-ignore - TS2339: auto-suppressed
            id: target.dataset.connectionId,
            // @ts-ignore - TS2339: auto-suppressed
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
     * Render draw channel overlay.
     * Shows temporary rectangle while drawing
     * @returns {TemplateResult}
     * @private
     */
    /**
     * Build a viewBox-space → panel-relative-pixel-space coordinate converter,
     * using the exact same scale/offset math as _getPreviewCoordinatesWithPixels
     * (crosshairs) and the shape drag-handle renderers — the canonical, correct
     * way to position an absolutely-positioned overlay element (or a no-viewBox
     * <svg>'s content, where 1 unit = 1 CSS pixel) so it visually lines up with
     * the live MSD preview underneath it. Using raw viewBox-unit coordinates
     * directly as pixel positions (as the draw-channel/draw-shape rubber-band
     * overlays used to) is off by the viewBox→panel scale factor — the "follows
     * the cursor but positioning/speed is wrong, sometimes off-panel entirely"
     * symptom.
     * @returns {((vbX: number, vbY: number) => [number, number]) | null}
     * @private
     */
    _getViewBoxToPixelConverter() {
        const preview = this._getPreviewSvgAndViewBox();
        if (!preview) return null;
        const { svg, viewBoxX, viewBoxY, viewBoxWidth, viewBoxHeight } = preview;

        const rect = svg.getBoundingClientRect();
        const previewPanel = this.shadowRoot.querySelector('.preview-panel');
        if (!previewPanel) return null;
        const panelRect = previewPanel.getBoundingClientRect();

        const scale = Math.max(viewBoxWidth / rect.width, viewBoxHeight / rect.height);
        const renderedWidth = viewBoxWidth / scale;
        const renderedHeight = viewBoxHeight / scale;
        const offsetX = (rect.width - renderedWidth) / 2;
        const offsetY = (rect.height - renderedHeight) / 2;

        return (vbX, vbY) => {
            const svgX = (vbX - viewBoxX) / scale + offsetX;
            const svgY = (vbY - viewBoxY) / scale + offsetY;
            return [svgX + (rect.left - panelRect.left), svgY + (rect.top - panelRect.top)];
        };
    }

    _renderDrawChannelOverlay() {
        if (this._activeMode !== MODES.DRAW_CHANNEL || !this._drawChannelState.drawing) {
            // @ts-ignore - TS2322: auto-suppressed
            return '';
        }

        const hint = this._renderModeHintLabel('Drag, or click twice, to draw · Esc to cancel');

        if (!this._drawChannelState.currentPoint) {
            return html`
                <div style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; pointer-events: none; z-index: 1000;">
                    ${hint}
                </div>
            `;
        }

        // startPoint/currentPoint are viewBox-space coordinates (from
        // _getPreviewCoordinates, used for saving to config) — this overlay's
        // <svg> has no viewBox of its own (1 unit = 1 CSS pixel, matching the
        // panel's own rendered size), so viewBox units must first be converted
        // through the same scale/offset math the (working) crosshairs and drag
        // handles use, not used directly as pixel positions. Using them
        // directly is off by the viewBox→panel scale factor — exactly "follows
        // the cursor but positioning/speed are wrong," and can place the
        // rendered point outside the visible panel entirely once the viewBox is
        // larger than the panel's rendered pixel size (the common case).
        const vbToPixel = this._getViewBoxToPixelConverter();
        // @ts-ignore - TS2322: auto-suppressed
        if (!vbToPixel) return '';

        const [startPx, startPy] = vbToPixel(...this._drawChannelState.startPoint);
        const [currentPx, currentPy] = vbToPixel(...this._drawChannelState.currentPoint);

        const x = Math.min(startPx, currentPx);
        const y = Math.min(startPy, currentPy);
        const width = Math.abs(currentPx - startPx);
        const height = Math.abs(currentPy - startPy);

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
                        fill="rgba(0, 255, 255, 0.2)"
                        stroke="#00FFFF"
                        stroke-width="2"
                        stroke-dasharray="5,5" />
                </svg>
                ${hint}
            </div>
        `;
    }

    /**
     * Render the live in-progress preview for PLACE_CONTROL mode — a
     * rubber-band bbox rectangle, mirroring _renderDrawChannelOverlay exactly.
     * @returns {TemplateResult|string}
     * @private
     */
    _renderPlaceControlOverlay() {
        if (this._activeMode !== MODES.PLACE_CONTROL || !this._placeControlDrawState.drawing) {
            // @ts-ignore - TS2322: auto-suppressed
            return '';
        }

        const hint = this._renderModeHintLabel('Drag, or click twice, to size the control · Esc to cancel');

        if (!this._placeControlDrawState.currentPoint) {
            return html`
                <div style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; pointer-events: none; z-index: 1000;">
                    ${hint}
                </div>
            `;
        }

        const vbToPixel = this._getViewBoxToPixelConverter();
        // @ts-ignore - TS2322: auto-suppressed
        if (!vbToPixel) return '';

        const [startPx, startPy] = vbToPixel(...this._placeControlDrawState.startPoint);
        const [currentPx, currentPy] = vbToPixel(...this._placeControlDrawState.currentPoint);

        const x = Math.min(startPx, currentPx);
        const y = Math.min(startPy, currentPy);
        const width = Math.abs(currentPx - startPx);
        const height = Math.abs(currentPy - startPy);

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
                        fill="rgba(0, 255, 255, 0.2)"
                        stroke="#00FFFF"
                        stroke-width="2"
                        stroke-dasharray="5,5" />
                </svg>
                ${hint}
            </div>
        `;
    }

    /**
     * Floating bottom-left hint shown while an interactive canvas mode is
     * active (draw shape/channel/control, connect line) — see
     * _handleKeyDown's Escape/Enter branches for the shortcuts this
     * documents. Same corner as .zoom-controls (bottom-center), capped to a
     * narrow width so longer text wraps to ~2 lines instead of extending far
     * enough right to reach the centered zoom bar.
     * @param {string} text
     * @returns {TemplateResult}
     * @private
     */
    _renderModeHintLabel(text) {
        return html`
            <div style="
                position: absolute;
                bottom: 12px;
                left: 12px;
                max-width: 260px;
                background: rgba(0, 0, 0, 0.85);
                color: #00FFFF;
                padding: 5px 10px;
                border-radius: 4px;
                font-family: 'Courier New', monospace;
                font-size: 13px;
                font-weight: 600;
                line-height: 1.4;
                white-space: normal;
                box-shadow: 0 2px 6px rgba(0,0,0,0.5);
            ">${text}</div>
        `;
    }

    /**
     * Hint shown while CONNECT_LINE mode is active — this mode has no
     * rubber-band overlay of its own (source/target are picked by clicking
     * existing anchor/control attachment points, not a drag), so it needs
     * its own small render hook rather than piggybacking on a draw-* overlay.
     * @returns {TemplateResult|string}
     * @private
     */
    _renderConnectLineHint() {
        if (this._activeMode !== MODES.CONNECT_LINE) return '';

        const hintText = this._connectLineState.source
            ? 'Click a target anchor/control point to connect · Esc to cancel'
            : 'Click a source anchor/control point to start · Esc to cancel';

        return html`
            <div style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; pointer-events: none; z-index: 1000;">
                ${this._renderModeHintLabel(hintText)}
            </div>
        `;
    }

    _renderDrawShapeOverlay() {
        if (this._activeMode !== MODES.DRAW_SHAPE || !this._drawShapeState.drawing) {
            // @ts-ignore - TS2322: auto-suppressed
            return '';
        }

        const { kind, points, currentPoint } = this._drawShapeState;

        const hintText = kind === 'polyline'
            ? 'Click to add point · Enter/dbl-click to finish · Esc to cancel'
            : 'Drag, or click twice, to draw · Esc to cancel';
        const hint = this._renderModeHintLabel(hintText);

        // points/currentPoint are viewBox-space (see _getViewBoxToPixelConverter's
        // docblock for why these can't be used directly as pixel positions).
        const vbToPixel = this._getViewBoxToPixelConverter();
        // @ts-ignore - TS2322: auto-suppressed
        if (!vbToPixel) return '';

        if (kind === 'polyline') {
            if (points.length === 0) return '';
            const pixelPoints = points.map(p => vbToPixel(p[0], p[1]));
            const committedPath = pixelPoints.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p[0]} ${p[1]}`).join(' ');
            const lastPixelPoint = pixelPoints[pixelPoints.length - 1];
            const previewSegment = currentPoint
                ? (() => {
                    const [cpx, cpy] = vbToPixel(currentPoint[0], currentPoint[1]);
                    return `M ${lastPixelPoint[0]} ${lastPixelPoint[1]} L ${cpx} ${cpy}`;
                })()
                : '';

            // Built as an SVG markup STRING + unsafeSVG(), not nested html``
            // TemplateResults — each html`` call parses independently via its
            // own <template>.innerHTML (HTML namespace), so a TemplateResult
            // interpolated as a *child* of an <svg> from a different template
            // (as this used to do, one per point plus the two paths) produces
            // wrong-namespace elements browsers silently refuse to paint. See
            // the identical fix/explanation on _renderShapeStylePreviewVertical.
            const circles = pixelPoints.map(p => `<circle cx="${p[0]}" cy="${p[1]}" r="4" fill="#00FFFF" />`).join('');
            const previewSegmentMarkup = previewSegment
                ? `<path d="${previewSegment}" fill="none" stroke="#00FFFF" stroke-width="2" stroke-dasharray="5,5" />`
                : '';
            const svgContent = `<path d="${committedPath}" fill="none" stroke="#00FFFF" stroke-width="2" />${circles}${previewSegmentMarkup}`;

            return html`
                <div style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; pointer-events: none; z-index: 1000;">
                    <svg style="width: 100%; height: 100%; position: absolute;">
                        ${unsafeSVG(svgContent)}
                    </svg>
                    ${hint}
                </div>
            `;
        }

        // rect/circle rubber-band bbox — the first corner is already placed
        // once we get here, but currentPoint (and so the bbox preview) only
        // exists after the first mousemove; still show the hint immediately.
        if (!currentPoint) {
            return html`
                <div style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; pointer-events: none; z-index: 1000;">
                    ${hint}
                </div>
            `;
        }
        const [startPx, startPy] = vbToPixel(points[0][0], points[0][1]);
        const [currentPx, currentPy] = vbToPixel(currentPoint[0], currentPoint[1]);
        const x = Math.min(startPx, currentPx);
        const y = Math.min(startPy, currentPy);
        const width = Math.abs(currentPx - startPx);
        const height = Math.abs(currentPy - startPy);

        const bboxContent = kind === 'circle'
            ? `<ellipse
                    cx="${x + width / 2}px" cy="${y + height / 2}px"
                    rx="${width / 2}px" ry="${height / 2}px"
                    fill="rgba(0, 255, 255, 0.2)" stroke="#00FFFF" stroke-width="2" stroke-dasharray="5,5" />`
            : `<rect
                    x="${x}px" y="${y}px" width="${width}px" height="${height}px"
                    fill="rgba(0, 255, 255, 0.2)" stroke="#00FFFF" stroke-width="2" stroke-dasharray="5,5" />`;

        return html`
            <div style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; pointer-events: none; z-index: 1000;">
                <svg style="width: 100%; height: 100%; position: absolute;">
                    ${unsafeSVG(bboxContent)}
                </svg>
                ${hint}
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

        // Force bounding boxes when Controls tab is active.
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
     * Render Controls tab.
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
     * Resolve a control's anchor point for editor-preview purposes (attachment-point
     * overlay, highlight box), including control-to-control positioning (position
     * referencing another control's id, optionally with position_side) — the
     * flat `anchors` lookup alone only covers named/base-SVG anchors and coordinates.
     * One level of control-to-control recursion is supported, matching the runtime
     * resolver in MsdControlsRenderer; a `visited` guard prevents infinite recursion
     * on a cyclic config.
     * @param {Object} control - Control overlay to resolve
     * @param {Object} anchors - Merged named/base-SVG anchors { name: [x,y] }
     * @param {Set} [visited] - Control ids already visited (cycle guard)
     * @returns {Array|null} [x, y] or null if unresolvable
     * @private
     */
    _resolveEditorControlPosition(control, anchors, visited = new Set()) {
        const position = control.position ?? control.anchor;
        if (Array.isArray(position)) return position;
        if (typeof position !== 'string') return null;
        if (anchors && anchors[position]) return anchors[position];

        if (visited.has(control.id)) return null;
        visited.add(control.id);

        const target = this._getControlOverlays().find(o => o.id === position);
        if (!target) return null;

        const targetPos = this._resolveEditorControlPosition(target, anchors, visited);
        if (!targetPos) return null;

        const [tw, th] = target.size || [100, 100];
        const attachOffsetMap = {
            'top-left': [0, 0], 'top': [-tw / 2, 0], 'top-right': [-tw, 0],
            'left': [0, -th / 2], 'center': [-tw / 2, -th / 2], 'right': [-tw, -th / 2],
            'bottom-left': [0, -th], 'bottom': [-tw / 2, -th], 'bottom-right': [-tw, -th]
        };
        const attachOffset = attachOffsetMap[target.attachment || 'center'] || attachOffsetMap['top-left'];
        const boxX = targetPos[0] + attachOffset[0];
        const boxY = targetPos[1] + attachOffset[1];

        const sidePoints = {
            center: [boxX + tw / 2, boxY + th / 2],
            top: [boxX + tw / 2, boxY],
            bottom: [boxX + tw / 2, boxY + th],
            left: [boxX, boxY + th / 2],
            right: [boxX + tw, boxY + th / 2],
            'top-left': [boxX, boxY],
            'top-right': [boxX + tw, boxY],
            'bottom-left': [boxX, boxY + th],
            'bottom-right': [boxX + tw, boxY + th]
        };
        return sidePoints[control.position_side || 'center'] || sidePoints.center;
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
                description: 'Always uses full pathfinding: automatically avoids obstacles, bundles with nearby parallel lines into shared trunks, and avoids crossing other lines — whether or not obstacles or channels are present. Best for most use cases. See Bundling and Crossing Avoidance below for how those two behaviors work.',
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
                        <text x="100" y="75" text-anchor="middle" font-size="10" fill="var(--secondary-text-color)">Avoids obstacles automatically</text>
                    </svg>
                `
            },
            bundling: {
                title: 'Bundling (Trunk-and-Branch)',
                icon: 'mdi:transit-connection-variant',
                description: 'Lines that run close and parallel automatically bundle into a shared trunk — the first line keeps its path as the centerline, and later lines ride evenly-spaced lanes beside it, branching apart where their destinations diverge. This happens spontaneously between any two auto-routed lines running near each other; no configuration or shared channel needed. Tunables: Trace Bundling & Crossings section.',
                diagram: html`
                    <svg viewBox="0 0 200 80" style="width: 100%; height: auto;">
                        <!-- Source A -->
                        <rect x="10" y="8" width="28" height="20" fill="var(--lcars-blue)" rx="4"/>
                        <!-- Source B -->
                        <rect x="10" y="52" width="28" height="20" fill="var(--lcars-blue)" rx="4"/>
                        <!-- Target A -->
                        <rect x="162" y="8" width="28" height="20" fill="var(--lcars-green)" rx="4"/>
                        <!-- Target B -->
                        <rect x="162" y="52" width="28" height="20" fill="var(--lcars-green)" rx="4"/>
                        <!-- Line A: converges into shared trunk, then diverges -->
                        <path d="M 38 18 L 70 18 L 70 37 L 130 37 L 130 18 L 162 18"
                              stroke="var(--lcars-orange)" stroke-width="3" fill="none"/>
                        <!-- Line B: converges into shared trunk (adjacent lane), then diverges -->
                        <path d="M 38 62 L 70 62 L 70 43 L 130 43 L 130 62 L 162 62"
                              stroke="var(--lcars-blue)" stroke-width="3" fill="none"/>
                        <text x="100" y="75" text-anchor="middle" font-size="10" fill="var(--secondary-text-color)">Parallel lines bundle, then branch apart</text>
                    </svg>
                `
            },
            crossing: {
                title: 'Crossing Avoidance',
                icon: 'mdi:vector-intersection',
                description: 'A line\'s path is discouraged from cutting across another line\'s already-drawn segment — a soft deterrent, not a hard block. If the only alternative is a long detour, the line crosses cleanly rather than pay for an expensive detour. Tunables: Trace Bundling & Crossings section (Crossing Penalty).',
                diagram: html`
                    <svg viewBox="0 0 200 80" style="width: 100%; height: auto;">
                        <!-- Source -->
                        <rect x="10" y="8" width="28" height="20" fill="var(--lcars-blue)" rx="4"/>
                        <!-- Target -->
                        <rect x="162" y="52" width="28" height="20" fill="var(--lcars-green)" rx="4"/>
                        <!-- Another line's already-drawn segment -->
                        <path d="M 60 40 L 140 40" stroke="var(--lcars-red)" stroke-width="3" fill="none"/>
                        <text x="100" y="32" text-anchor="middle" font-size="9" fill="var(--lcars-red)">another line</text>
                        <!-- This line detours sideways rather than cross it -->
                        <path d="M 38 18 L 45 18 L 45 62 L 162 62"
                              stroke="var(--lcars-orange)" stroke-width="3" fill="none"/>
                        <text x="100" y="75" text-anchor="middle" font-size="10" fill="var(--secondary-text-color)">Detours around rather than crossing</text>
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
                    helper="Lines will route through selected channels based on channel behavior (prefer/avoid/force)"
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
            <div class="list-item-card">
                <div style="display: flex; align-items: center; gap: 12px; flex-wrap: wrap;">
                    <ha-icon icon="mdi:card-outline" style="--mdc-icon-size: 32px; color: var(--primary-color); flex-shrink: 0;"></ha-icon>
                    <div style="flex: 1; min-width: 140px;">
                        <div style="font-weight: 600; margin-bottom: 4px;">${id}</div>
                        <div style="font-size: 12px; color: var(--secondary-text-color); font-family: monospace; word-break: break-word;">
                            ${cardType} @ ${positionStr}
                        </div>
                    </div>
                    <div style="display: flex; gap: 8px; flex-shrink: 0; margin-left: auto;">
                        <ha-icon-button
                            @click=${() => this._editControl(control)}
                            .label=${'Edit'}
                            .path=${'M20.71,7.04C21.1,6.65 21.1,6 20.71,5.63L18.37,3.29C18,2.9 17.35,2.9 16.96,3.29L15.12,5.12L18.87,8.87M3,17.25V21H6.75L17.81,9.93L14.06,6.18L3,17.25Z'}>
                        </ha-icon-button>
                        <ha-icon-button
                            @click=${() => this._duplicateControl(control)}
                            .label=${'Duplicate'}
                            .path=${'M19,21H8V7H19M19,5H8A2,2 0 0,0 6,7V21A2,2 0 0,0 8,23H19A2,2 0 0,0 21,21V7A2,2 0 0,0 19,5M16,1H4A2,2 0 0,0 2,3V17H4V3H16V1Z'}>
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
            </div>
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
        this._controlFormPositionSide = 'center';
        // Default new controls to obstacle:true (see the constructor default
        // for why this is now safe to do).
        this._controlFormObstacle = true;
        this._controlFormZIndex = null;
        this._controlFormTriggersUpdateMode = 'specific';
        this._controlFormTriggersUpdateEntities = [];
        this._controlFormTriggersUpdateExpanded = false;
        this._controlFormCard = { type: '' };
        this._controlFormAnimations = [];
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
        this._controlFormPositionSide = control.position_side || 'center';
        this._controlFormObstacle = control.obstacle === true;
        this._controlFormZIndex = control.z_index ?? null;
        this._controlFormTriggersUpdateMode = control.triggers_update === 'all' ? 'all' : 'specific';
        this._controlFormTriggersUpdateEntities = Array.isArray(control.triggers_update) ? control.triggers_update : [];
        this._controlFormTriggersUpdateExpanded = this._controlFormTriggersUpdateMode === 'all' ||
            this._controlFormTriggersUpdateEntities.length > 0;
        this._controlFormCard = control.card || { type: '' };
        this._controlFormAnimations = control.animations || [];
        this._controlFormActiveSubtab = 'placement';
        this._showControlForm = true;

        this.requestUpdate();
    }

    /**
     * Duplicate control: clone it with a fresh unique ID and open it for editing.
     * @param {Object} control - Control to duplicate
     * @private
     */
    _duplicateControl(control) {
        const overlays = this._workingConfig.msd?.overlays || [];
        let controlNum = overlays.filter(o => o.type === 'control').length + 1;
        let newId = `control_${controlNum}`;
        while (overlays.find(o => o.id === newId)) {
            controlNum++;
            newId = `control_${controlNum}`;
        }

        const cloned = { ...JSON.parse(JSON.stringify(control)), id: newId };
        this._setNestedValue('msd.overlays', [...overlays, cloned]);
        this._editControl(cloned);
    }

    /**
     * Highlight control in preview.
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
     * Delete control.
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

        // Look up the entry by the stable editing id (immune to in-progress ID renames),
        // not the mutable form field — otherwise renaming while editing creates a duplicate
        // instead of updating the original (see _saveAnchor for the equivalent correct pattern).
        const existingIndex = this._editingControlId
            ? overlays.findIndex(o => o.id === this._editingControlId)
            : -1;
        const existingOverlay = existingIndex >= 0 ? overlays[existingIndex] : null;

        const triggersUpdate = this._controlFormTriggersUpdateMode === 'all'
            ? 'all'
            : (this._controlFormTriggersUpdateEntities?.length ? [...this._controlFormTriggersUpdateEntities] : undefined);

        const controlOverlay = {
            // Preserve any fields this form doesn't manage (e.g. a hand-typed
            // field only reachable via YAML mode), so it isn't silently
            // deleted the next time this control is saved via the GUI.
            // Explicitly-managed fields below always win.
            ...(existingOverlay || {}),
            type: 'control',
            id: this._controlFormId,
            position: this._controlFormPosition,
            size: this._controlFormSize,
            attachment: this._controlFormAttachment,
            obstacle: this._controlFormObstacle || undefined,
            z_index: this._controlFormZIndex ?? undefined,
            triggers_update: triggersUpdate,
            card: this._controlFormCard,
            animations: this._controlFormAnimations?.length ? this._controlFormAnimations : undefined
        };

        // position_side only applies when position references another control's id
        // (not a named anchor/coordinates), and only needs saving when non-default.
        // Now that the base object may carry a stale position_side from `existingOverlay`
        // (see spread above), the non-applicable branch must explicitly delete it —
        // previously safe by omission when the object was always built fresh.
        const positionTargetIsControl = typeof this._controlFormPosition === 'string' &&
            overlays.some(o => o.type === 'control' && o.id === this._controlFormPosition);
        if (positionTargetIsControl && this._controlFormPositionSide && this._controlFormPositionSide !== 'center') {
            controlOverlay.position_side = this._controlFormPositionSide;
        } else {
            delete controlOverlay.position_side;
        }

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
        // @ts-ignore - TS2339: auto-suppressed
        const tabValue = event.target.activeTab?.getAttribute('value');
        if (tabValue) {
            this._controlFormActiveSubtab = tabValue;
            this.requestUpdate();
        }
    }

    /**
     * Render control form dialog.
     * @returns {TemplateResult}
     * @private
     */
    _renderControlFormDialog() {
        const isEditing = !!this._editingControlId &&
                         (this._workingConfig.msd?.overlays || []).some(o => o.id === this._editingControlId);
        const title = isEditing ? `Edit Control: ${this._controlFormId}` : 'Add Control';

        return html`
            <ha-dialog
                class="subform-dialog"
                open
                @closed=${(e) => { e.stopPropagation(); this._closeControlForm(); }}
                .headerTitle=${title}
                prevent-scrim-close>

                <!-- Split Layout: Config (Left) + Preview (Right), unified with the line-edit form's shell -->
                <div class="subform-layout">

                    <!-- LEFT COLUMN: Configuration Panel -->
                    <div class="subform-config">
                        <!-- Subtabs -->
                        <ha-tab-group @wa-tab-show=${this._handleControlFormTabChange} class="subform-tabs">
                            <ha-tab-group-tab value="placement" ?active=${this._controlFormActiveSubtab === 'placement'}>Placement</ha-tab-group-tab>
                            <ha-tab-group-tab value="card" ?active=${this._controlFormActiveSubtab === 'card'}>Card</ha-tab-group-tab>
                            <ha-tab-group-tab value="animation" ?active=${this._controlFormActiveSubtab === 'animation'}>Animation</ha-tab-group-tab>
                        </ha-tab-group>

                        <!-- Subtab Content -->
                        <div class="subform-tab-content">
                            ${this._controlFormActiveSubtab === 'placement'
                                ? this._renderControlFormPlacement()
                                : this._controlFormActiveSubtab === 'card'
                                    ? this._renderControlFormCard()
                                    : this._renderControlFormAnimation()
                            }
                        </div>
                    </div>

                    <!-- RIGHT COLUMN: Preview Panel (Sticky) -->
                    <div class="subform-preview sticky">
                        ${this._renderControlPreview()}
                    </div>

                </div>

                <div slot="footer">
                    <ha-button @click=${this._closeControlForm} appearance="plain">
                        <ha-icon icon="mdi:close" slot="start"></ha-icon>
                        Cancel
                    </ha-button>
                    <ha-button @click=${this._saveControl}>
                        <ha-icon icon="mdi:content-save" slot="start"></ha-icon>
                        Save
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

        // Get control IDs (for attaching to other controls) — exclude the control
        // currently being edited so it can't be offered as an anchor for itself.
        const controlIds = (this._workingConfig.msd?.overlays || [])
            .filter(o => o.type === 'control' && o.id !== this._editingControlId)
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
        const positionTargetIsControl = useAnchor &&
            (this._workingConfig.msd?.overlays || []).some(o => o.type === 'control' && o.id === selectedAnchor);

        return html`
            <div class="subform-field-stack">
                <ha-input
                    label="Control ID"
                    .value=${this._controlFormId}
                    @input=${(e) => this._controlFormId = e.target.value}
                    required
                    hint="Unique identifier for this control">
                </ha-input>

                <lcards-form-section
                    header="Position"
                    description="Set control position using anchor or coordinates"
                    icon="mdi:crosshairs-gps"
                    ?expanded=${true}>

                    <ha-selector
                        .hass=${this.hass}
                        .selector=${{
                            select: {
                                mode: 'dropdown',
                                custom_value: anchorOptions.length >= 10,
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
                            <ha-input
                                type="number"
                                label="X Position"
                                .value=${String(this._controlFormPosition[0] || 0)}
                                @input=${(e) => {
                                    this._controlFormPosition = [this._roundToPrecision(Number(e.target.value)), this._controlFormPosition[1]];
                                    this.requestUpdate();
                                }}>
                            </ha-input>
                            <ha-input
                                type="number"
                                label="Y Position"
                                .value=${String(this._controlFormPosition[1] || 0)}
                                @input=${(e) => {
                                    this._controlFormPosition = [this._controlFormPosition[0], this._roundToPrecision(Number(e.target.value))];
                                    this.requestUpdate();
                                }}>
                            </ha-input>
                        </div>
                    ` : ''}

                    <!-- Attachment Point - defines where on control the position refers to -->
                    <div style="margin-top: 12px; padding-top: 12px; border-top: 1px solid var(--divider-color);">
                        <lcards-position-picker
                            .value=${this._controlFormAttachment || 'center'}
                            .label=${'Attachment Point'}
                            .helper=${"Which point of the control the position refers to (e.g., 'center' means coordinates specify the control's center)"}
                            @value-changed=${(e) => {
                                // lcards-position-picker emits long-form edge names
                                // (top-center, center-left, ...); the schema stores
                                // short-form (top, left, ...) — normalize on the way out.
                                const edgeAliases = { 'top-center': 'top', 'bottom-center': 'bottom', 'center-left': 'left', 'center-right': 'right' };
                                this._controlFormAttachment = edgeAliases[e.detail.value] || e.detail.value;
                                this.requestUpdate();
                            }}>
                        </lcards-position-picker>
                    </div>

                    ${positionTargetIsControl ? html`
                        <div style="margin-top: 12px; padding-top: 12px; border-top: 1px solid var(--divider-color);">
                            <lcards-position-picker
                                .value=${this._controlFormPositionSide || 'center'}
                                .label=${'Target Attachment Point'}
                                .helper=${`Which point of "${selectedAnchor}" to attach to (instead of its center)`}
                                @value-changed=${(e) => {
                                    // lcards-position-picker emits long-form edge names
                                    // (top-center, center-left, ...); attachment points are
                                    // keyed short-form (top, left, ...) — normalize on the way out.
                                    const edgeAliases = { 'top-center': 'top', 'bottom-center': 'bottom', 'center-left': 'left', 'center-right': 'right' };
                                    this._controlFormPositionSide = edgeAliases[e.detail.value] || e.detail.value;
                                    this.requestUpdate();
                                }}>
                            </lcards-position-picker>
                        </div>
                    ` : ''}
                </lcards-form-section>

                <lcards-form-section
                    header="Size"
                    description="Control dimensions in pixels"
                    icon="mdi:resize"
                    ?expanded=${true}>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
                        <ha-input
                            type="number"
                            label="Width"
                            .value=${String(this._controlFormSize[0] || 100)}
                            @input=${(e) => {
                                this._controlFormSize = [this._roundToPrecision(Number(e.target.value)), this._controlFormSize[1]];
                                this.requestUpdate();
                            }}>
                        </ha-input>
                        <ha-input
                            type="number"
                            label="Height"
                            .value=${String(this._controlFormSize[1] || 100)}
                            @input=${(e) => {
                                this._controlFormSize = [this._controlFormSize[0], this._roundToPrecision(Number(e.target.value))];
                                this.requestUpdate();
                            }}>
                        </ha-input>
                    </div>
                </lcards-form-section>

                <lcards-form-section
                    header="Routing Behavior"
                    description="Control how lines route around this overlay"
                    icon="mdi:vector-polyline-remove"
                    ?expanded=${false}>
                    <ha-selector
                        .hass=${this.hass}
                        .label=${'Treat as obstacle for line routing'}
                        .helper=${'When enabled, lines with route: auto will avoid this control overlay'}
                        .selector=${{ boolean: {} }}
                        .value=${this._controlFormObstacle === true}
                        @value-changed=${(e) => {
                            this._controlFormObstacle = e.detail.value;
                            this.requestUpdate();
                        }}>
                    </ha-selector>
                </lcards-form-section>

                <lcards-form-section
                    header="Stacking Order"
                    description="Control paint order relative to other controls and lines"
                    icon="mdi:layers-outline"
                    secondary=${this._controlFormZIndex != null ? `Z-Index: ${this._controlFormZIndex} (custom)` : 'Z-Index: 200 (default)'}
                    ?expanded=${this._controlFormZIndex != null}>
                    <ha-input
                        type="number"
                        label="Z-Index"
                        .value=${this._controlFormZIndex != null ? String(this._controlFormZIndex) : ''}
                        @input=${(e) => {
                            const raw = e.target.value;
                            this._controlFormZIndex = raw === '' ? null : Number(raw);
                            this.requestUpdate();
                        }}
                        hint="Higher values paint on top. Leave blank to use the default (200 — controls paint over lines).">
                    </ha-input>
                </lcards-form-section>

                <lcards-form-section
                    header="Update Behavior (Advanced)"
                    description="Fine-tune which entity changes cause this control to refresh"
                    icon="mdi:refresh-circle"
                    secondary=${this._controlFormTriggersUpdateMode === 'all'
                        ? 'Always update'
                        : (this._controlFormTriggersUpdateEntities?.length
                            ? `${this._controlFormTriggersUpdateEntities.length} extra ${this._controlFormTriggersUpdateEntities.length === 1 ? 'entity' : 'entities'}`
                            : 'Default (auto-detected)')}
                    ?expanded=${this._controlFormTriggersUpdateExpanded}
                    @expanded-changed=${(e) => {
                        this._controlFormTriggersUpdateExpanded = e.detail.expanded;
                    }}>

                    <lcards-message type="info">
                        LCARdS already auto-detects most entities this card's config depends on.
                        Only needed when the embedded card references an entity in a way that
                        can't be statically detected (e.g. a dynamically-computed key, or a card
                        that matches entities by wildcard/device class at runtime) — otherwise the
                        card would stop updating after its first render.
                    </lcards-message>

                    <ha-radio-group
                        style="margin-top: 12px; display: block;"
                        .value=${this._controlFormTriggersUpdateMode}
                        @change=${(e) => {
                            this._controlFormTriggersUpdateMode = e.target.value;
                            this._controlFormTriggersUpdateExpanded = true;
                            this.requestUpdate();
                        }}>
                        <ha-radio-option value="specific">Specific entities</ha-radio-option>
                        <ha-radio-option value="all">Always update (any entity change)</ha-radio-option>
                    </ha-radio-group>

                    ${this._controlFormTriggersUpdateMode === 'specific' ? html`
                        <ha-selector
                            style="margin-top: 12px; display: block;"
                            .hass=${this.hass}
                            .selector=${{ entity: { multiple: true } }}
                            .value=${this._controlFormTriggersUpdateEntities}
                            .label=${'Extra Entities'}
                            .helper=${"Entities this control depends on beyond what's auto-detected"}
                            @value-changed=${(e) => {
                                this._controlFormTriggersUpdateEntities = e.detail.value || [];
                                this._controlFormTriggersUpdateExpanded = true;
                                this.requestUpdate();
                            }}>
                        </ha-selector>
                    ` : html`
                        <lcards-message type="warning" style="margin-top: 12px;">
                            This control refreshes on every Home Assistant state change,
                            bypassing the per-control optimization. Only use this if the embedded
                            card's dependencies genuinely can't be enumerated — prefer "Specific
                            entities" whenever possible.
                        </lcards-message>
                    `}
                </lcards-form-section>
            </div>
        `;
    }

    /**
     * Render Animation subtab — mirrors _renderShapeFormAnimation/
     * _renderLineFormAnimation exactly, against _controlFormAnimations.
     * @returns {TemplateResult}
     * @private
     */
    _renderControlFormAnimation() {
        // Scope target discovery to this control's own rendered
        // [data-overlay-id="..."] foreignObject — see _renderShapeFormAnimation
        // for why an attribute selector (not #id) is used. Falls back to
        // whole-card discovery if the id isn't in the live preview yet (e.g. a
        // brand-new control that hasn't been saved once). Note this scopes to
        // the foreignObject itself, not into whatever card is embedded inside
        // it — an embedded card's own shadow DOM is out of reach regardless.
        const controlId = this._editingControlId || this._controlFormId;
        return html`
            <div class="subform-field-stack">
                <lcards-form-section
                    header="Control Animations"
                    description="Configure animations for this control's positioned wrapper (opacity/transform/glow-style effects) — not the embedded card's own internals"
                    icon="mdi:animation"
                    ?expanded=${true}>

                    <lcards-animation-editor
                        .hass=${this.hass}
                        .animations=${this._controlFormAnimations || []}
                        .cardElement=${this._getLivePreviewCardElement()}
                        .searchRootSelector=${controlId ? `[data-overlay-id="${controlId}"]` : ''}
                        @animations-changed=${(e) => {
                            this._controlFormAnimations = e.detail.value;
                            this.requestUpdate();
                        }}
                        @refresh-targets=${() => this.requestUpdate()}
                    ></lcards-animation-editor>
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
     * Render Card subtab - REMOVED (unused)
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
            <div class="subform-field-stack">
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
                                .selector=${{ select: { mode: 'dropdown', custom_value: cards.length >= 10, options: cards.map(card => ({ value: card.type, label: card.name, icon: card.icon })) }}}
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
                    <div class="selected-card-info" style="display: flex; align-items: center; justify-content: space-between; padding: 12px 16px; background: var(--primary-background-color, #03a9f4); color: white; border-radius: var(--ha-card-border-radius, 12px); margin-bottom: 16px;">
                        <div style="display: flex; align-items: center; gap: 12px;">
                            <ha-icon icon="${this._getCardIcon(cardType)}" style="--mdc-icon-size: 28px; color: white;"></ha-icon>
                            <div>
                                <div style="font-weight: 600; font-size: 15px;">${this._getCardTypeName(cardType)}</div>
                                <div style="font-size: 12px; opacity: 0.9;">Selected card type</div>
                            </div>
                        </div>
                        <ha-button
                            @click=${() => {
                                // Save current card config before changing
                                this._previousCardConfig = { ...this._controlFormCard };
                                this._controlFormCard = { type: '' };
                                this.requestUpdate();
                            }}>
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
     * Render Preview subtab - REMOVED (unused)
     */

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
                // @ts-ignore - TS2339: auto-suppressed
                cardElement.hass = this.hass;
            }

            // Set card configuration
            // @ts-ignore - TS2339: auto-suppressed
            if (typeof cardElement.setConfig === 'function') {
                // @ts-ignore - TS2339: auto-suppressed
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

            // @ts-ignore - TS2339: auto-suppressed
            if (CardClass && typeof CardClass.getStubConfig === 'function') {
                // @ts-ignore - TS2339: auto-suppressed
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

            // @ts-ignore - TS2339: auto-suppressed
            if (CardClass && typeof CardClass.getStubConfig === 'function') {
                // @ts-ignore - TS2339: auto-suppressed
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
        return cleanType;
            //.split('-')
            //.map(word => word.charAt(0).toUpperCase() + word.slice(1))
            //.join(' ');
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
            // @ts-ignore - TS2740: auto-suppressed
            root = root && root.shadowRoot;
            root = root && root.querySelector('home-assistant-main');
            // @ts-ignore - TS2740: auto-suppressed
            root = root && root.shadowRoot;
            root = root && root.querySelector('app-drawer-layout partial-panel-resolver, ha-drawer partial-panel-resolver');
            // @ts-ignore - TS2322: auto-suppressed
            root = (root && root.shadowRoot) || root;
            root = root && root.querySelector('ha-panel-lovelace');
            // @ts-ignore - TS2740: auto-suppressed
            root = root && root.shadowRoot;
            root = root && root.querySelector('hui-root');
            // @ts-ignore - TS2339: auto-suppressed
            if (root && root.lovelace) {
                // @ts-ignore - TS2339: auto-suppressed
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

            // @ts-ignore - TS2339: auto-suppressed
            if (panel?.lovelace) {
                lcardsLog.debug('[MSDStudio] Got Lovelace from ha-panel-lovelace');
                // @ts-ignore - TS2339: auto-suppressed
                return panel.lovelace;
            }

            // Try direct lovelace property
            // @ts-ignore - TS2339: auto-suppressed
            if (homeAssistant.lovelace) {
                lcardsLog.debug('[MSDStudio] Got Lovelace from home-assistant element');
                // @ts-ignore - TS2339: auto-suppressed
                return homeAssistant.lovelace;
            }
        }

        // Last resort: try window.lovelace (deprecated but may exist)
        // @ts-ignore - TS2339: auto-suppressed
        if (window.lovelace) {
            lcardsLog.warn('[MSDStudio] Using deprecated window.lovelace');
            // @ts-ignore - TS2339: auto-suppressed
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
        // Deep copy so edits don't mutate the control form's config until Save
        this._cardEditorTempConfig = JSON.parse(JSON.stringify(this._controlFormCard));
        this._showCardEditorForm = true;
        lcardsLog.debug('[MSDStudio] Opening card editor form with config:', this._cardEditorTempConfig);
        this.requestUpdate();
    }

    /**
     * Close the card editor sub-form without saving.
     * @private
     */
    _closeCardEditorForm() {
        this._showCardEditorForm = false;
        this._cardEditorTempConfig = null;
        this.requestUpdate();
    }

    /**
     * Commit the card editor sub-form's temp config back into the control
     * form's card, then close.
     * @private
     */
    _saveCardEditorForm() {
        let config = this._cardEditorTempConfig;

        // Ensure we have a valid config with type
        if (!config || !config.type) {
            lcardsLog.error('[MSDStudio] Invalid card config from card editor form - missing type:', config);
            if (this._controlFormCard?.type) {
                config = { ...config, type: this._controlFormCard.type };
            }
        }

        // Deep clone to avoid reference issues
        this._controlFormCard = JSON.parse(JSON.stringify(config));
        lcardsLog.debug('[MSDStudio] Card config saved:', this._controlFormCard);

        this._closeCardEditorForm();
    }

    /**
     * Handle config-changed/value-changed events from hui-card-element-editor
     * inside the card editor sub-form. Updates the reactive temp config that
     * drives both the editor and the live hui-card preview.
     * @param {CustomEvent} e
     * @private
     */
    _handleCardEditorConfigChanged(e) {
        const newValue = e.detail?.config ?? e.detail?.value;
        if (newValue && typeof newValue === 'object' && !Array.isArray(newValue) && newValue.type) {
            this._cardEditorTempConfig = newValue;
            lcardsLog.trace('[MSDStudio] Card editor form config updated:', newValue);
            this.requestUpdate();
        } else {
            lcardsLog.warn('[MSDStudio] Ignoring invalid card config from editor:', newValue);
        }
    }

    /**
     * Render the card editor sub-form dialog — same .subform-* shell as the
     * line/control forms (Phase 6), with a live hui-card preview pane instead
     * of the bare editor-only modal this replaced. hui-card is HA's own
     * per-card wrapper (used for every card on every dashboard, so it's not
     * lazy-loaded the way hui-card-picker/hui-dialog-edit-card are) — setting
     * .hass/.config/.preview on it directly mirrors exactly what HA's own
     * hui-dialog-edit-card does for its preview pane.
     * @returns {TemplateResult}
     * @private
     */
    _renderCardEditorFormDialog() {
        const lovelace = this._getLovelace();

        return html`
            <ha-dialog
                class="subform-dialog"
                open
                @closed=${(e) => { e.stopPropagation(); this._closeCardEditorForm(); }}
                .headerTitle=${'Edit Card Configuration'}
                prevent-scrim-close>

                <div class="subform-layout">
                    <div class="subform-config">
                        <div class="subform-tab-content">
                            <hui-card-element-editor
                                .hass=${this.hass}
                                .lovelace=${lovelace}
                                .value=${this._cardEditorTempConfig}
                                @config-changed=${this._handleCardEditorConfigChanged}
                                @value-changed=${this._handleCardEditorConfigChanged}>
                            </hui-card-element-editor>
                        </div>
                    </div>

                    <div class="subform-preview sticky">
                        <div class="subform-preview-label">Live Preview</div>
                        ${this._renderCardEditorPreview()}
                    </div>
                </div>

                <div slot="footer">
                    <ha-button @click=${this._closeCardEditorForm} appearance="plain">
                        <ha-icon icon="mdi:close" slot="start"></ha-icon>
                        Cancel
                    </ha-button>
                    <ha-button @click=${this._saveCardEditorForm}>
                        <ha-icon icon="mdi:content-save" slot="start"></ha-icon>
                        Save
                    </ha-button>
                </div>
            </ha-dialog>
        `;
    }

    /**
     * Render the live preview pane for the card editor sub-form.
     * @returns {TemplateResult}
     * @private
     */
    _renderCardEditorPreview() {
        if (!this._cardEditorTempConfig?.type) {
            return html`<lcards-message type="info">Select a card type to see a preview.</lcards-message>`;
        }
        if (!customElements.get('hui-card')) {
            return html`<lcards-message type="warning">Live preview unavailable in this context.</lcards-message>`;
        }
        return html`
            <div class="card-editor-preview-surface">
                <hui-card
                    .hass=${this.hass}
                    .config=${this._cardEditorTempConfig}
                    .preview=${true}>
                </hui-card>
            </div>
        `;
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
                    <div style="padding: var(--ha-space-4); background: var(--card-background-color); border-radius: var(--ha-border-radius-md); border: var(--ha-border-width-sm) solid var(--divider-color);">
                        <div style="font-size: 12px; font-weight: 500; margin-bottom: var(--ha-space-3); color: var(--secondary-text-color);">Card Preview</div>
                        <div class="card-editor-preview-surface" style="display: flex; justify-content: center; align-items: center; min-height: ${size[1] + 20}px;">
                            <div style="width: ${size[0]}px; height: ${size[1]}px; overflow: hidden; box-shadow: var(--ha-box-shadow-s);">
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
                // @ts-ignore - TS2339: auto-suppressed
                cardElement.hass = this.hass;
            }

            // Set card configuration
            // @ts-ignore - TS2339: auto-suppressed
            if (typeof cardElement.setConfig === 'function') {
                // @ts-ignore - TS2339: auto-suppressed
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
     * Render Lines tab.
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
     * Render Shapes tab
     * @returns {TemplateResult}
     * @private
     */
    _renderShapesTab() {
        const shapes = this._getShapeOverlays();
        const shapeCount = shapes.length;

        return html`
            <div style="padding: 8px;">
                <div style="display: flex; gap: 8px; margin-bottom: 16px; align-items: center;">
                    <ha-button @click=${() => this._openShapeForm()}>
                        <ha-icon icon="mdi:plus" slot="start"></ha-icon>
                        Add Shape
                    </ha-button>
                    <ha-button @click=${() => this._openShieldBubblePanel()} ?disabled=${!this._hasBaseSvgContent()}>
                        <ha-icon icon="mdi:shield-outline" slot="start"></ha-icon>
                        Suggest Shield Bubble
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

                ${this._shieldBubbleState?.active ? this._renderShieldBubblePanel() : ''}

                <lcards-form-section
                    header="Shape Overlays"
                    description="Freeform decorative/structural geometry — polylines, rectangles, circles. Draw directly on the canvas with the toolbar buttons, or add one here."
                    icon="mdi:shape"
                    ?expanded=${true}>

                    ${shapeCount === 0 ? html`
                        <lcards-message type="info">
                            <strong>No shape overlays defined yet.</strong>
                            <p style="margin: 8px 0; font-size: 13px;">
                                Use the Draw Polyline/Rectangle/Circle buttons on the canvas
                                toolbar, or click "Add Shape" to create one manually.
                            </p>
                        </lcards-message>
                    ` : html`
                        <div class="line-list">
                            ${shapes.map(shape => this._renderShapeItem(shape))}
                        </div>
                    `}
                </lcards-form-section>

                ${this._renderShapeHelp()}
            </div>
        `;
    }

    /**
     * Render "About Shape Overlays" info box — mirrors _renderControlHelp/
     * _renderLineHelp exactly.
     * @returns {TemplateResult}
     * @private
     */
    _renderShapeHelp() {
        return html`
            <lcards-message type="info" style="margin-top: 16px;">
                <strong>About Shape Overlays:</strong>
                <ul style="margin: 8px 0; padding-left: 20px; font-size: 13px;">
                    <li>Shapes draw freeform geometry on your MSD: polylines (walls, connectors), rectangles and circles (rooms, zones)</li>
                    <li>Use the Draw Polyline/Rectangle/Circle buttons on the canvas toolbar for click-to-place drawing with live preview</li>
                    <li>Select a shape to drag its points (polyline) or resize handles (rectangle/circle) directly on the canvas</li>
                    <li>Full style parity with lines: dashed/gradient strokes, state-based fill, animations, and rules reactivity</li>
                    <li>Lines can attach to a shape's corners (rectangle/circle) or vertices (polyline) just like they attach to controls</li>
                </ul>
            </lcards-message>
        `;
    }

    /**
     * Whether the card currently has a usable base_svg to analyze (source set
     * and not 'none'). Gates the Suggest Shield Bubble trigger button so it's
     * disabled rather than failing after a click - the live preview is
     * already rendering this exact base_svg by the time a user is on the
     * Shapes tab, so the asset registry entry is populated in the
     * overwhelming common case.
     * @returns {boolean}
     * @private
     */
    _hasBaseSvgContent() {
        const source = this._workingConfig.msd?.base_svg?.source;
        return !!source && source !== 'none';
    }

    /**
     * Shared initial/reset shape for _shieldBubbleState, used by both the
     * constructor and the post-Accept reset so the two can't drift apart.
     * @returns {Object}
     * @private
     */
    _defaultShieldBubbleState() {
        return {
            active: false,
            loading: false,
            dilateRadius: 18,
            simplifyTolerance: 4,
            roundness: 0,
            mode: 'single',
            sectionCount: 4,
            startAngleDeg: 0,
            rawPoints: null,
            rawW: 0,
            rawH: 0,
            rawViewBox: null,
            points: null,
            error: null,
            guideExpanded: false
        };
    }

    /**
     * Open the Suggest Shield Bubble panel and kick off the first generation
     * against current default params.
     * @private
     */
    async _openShieldBubblePanel() {
        this._shieldBubbleState = { ...this._shieldBubbleState, active: true, error: null };
        await this._regenerateShieldBubblePreview();
    }

    /**
     * Cheap, synchronous re-derivation of state.points from state.rawPoints:
     * simplify (RDP) -> blend toward ellipse -> map to SVG space. Called on
     * every tolerance/roundness change (live, no debounce needed - this is
     * O(n) over an already-decimated-by-RDP point count) and once right
     * after a fresh async raw trace completes. No-op if rawPoints is empty -
     * callers that touch tolerance/roundness before the first successful
     * Preview leave state.points as whatever it already was, same as today.
     * @private
     */
    _recomputeShieldBubblePoints() {
        const state = this._shieldBubbleState;
        if (!state.rawPoints?.length) return;
        const simplified = SvgStructureAnalyzer.simplifyClosedPolyline(state.rawPoints, state.simplifyTolerance);
        const blended = SvgStructureAnalyzer.blendTowardEllipse(simplified, state.roundness);
        const points = SvgStructureAnalyzer.mapRasterPointsToViewBox(blended, state.rawViewBox, state.rawW, state.rawH);
        this._shieldBubbleState = { ...this._shieldBubbleState, points };
    }

    /**
     * Re-run SvgStructureAnalyzer.analyzeShieldBubbleRaw() against the
     * current dilate radius and store the raw closed-loop trace for
     * _recomputeShieldBubblePoints() to consume. Triggered explicitly by the
     * panel's Preview button - unlike simplifyTolerance/roundness (live,
     * synchronous, see _recomputeShieldBubblePoints), dilateRadius still
     * requires an explicit click since it drives the actual expensive
     * dilate+trace pipeline (see _renderShieldBubblePanel's docblock).
     * analyzeShieldBubbleRaw() has its own cache (content hash + dilate
     * radius only), so re-previewing a previously-used radius is cheap.
     * @private
     */
    async _regenerateShieldBubblePreview() {
        const source = this._workingConfig.msd?.base_svg?.source;
        if (!source || source === 'none') return;
        if (this._shieldBubbleState.loading) {
            // Already computing - remember to run again with whatever the
            // latest params are once this one finishes, instead of silently
            // dropping the newer request. The Preview button disables while
            // loading, so this is mainly a defensive backstop against a
            // double-click landing before that disabled state commits.
            this._shieldBubblePendingRegenerate = true;
            return;
        }

        this._shieldBubbleState = { ...this._shieldBubbleState, loading: true, error: null };
        this.requestUpdate();
        // Force a real paint before the (mostly-synchronous, once the mask
        // is cached) analyzeShieldBubble() call below blocks the main
        // thread - without this, the loading:true DOM update above never
        // gets a chance to actually render before dilate()/traceBoundary()'s
        // tight CPU loops start.
        await new Promise((resolve) => setTimeout(resolve, 0));

        try {
            const { getSvgContent, getSvgViewBox } = await import('../../utils/lcards-anchor-helpers.js');
            const svgContent = getSvgContent(source);
            if (!svgContent) throw new Error('Base SVG not yet loaded');
            // Deliberately the SVG's own NATIVE viewBox, not the card's
            // effective/custom view_box (resolveEffectiveViewBox) - mirrors
            // ConfigProcessor.js's analyzeAnchors() call and its own comment:
            // SvgStructureAnalyzer rasterizes the raw, unwrapped svgContent
            // string, which only ever renders at its own native viewBox
            // regardless of any card-level pan/crop override. Passing the
            // custom viewBox instead (this function's original bug) sizes
            // the raster canvas for the WRONG box, so drawImage force-
            // stretches the actual (native-sized) artwork to fill it -
            // producing a translated (native origin != custom origin) and/or
            // severely rescaled (native size != custom size) silhouette.
            // Content coordinates don't change with a pan/crop view_box
            // (same reasoning as computed anchors), so native-space output
            // points are already correct to use as overlay points directly.
            const viewBox = getSvgViewBox(svgContent);

            const { points: rawPoints, W: rawW, H: rawH, viewBox: rawViewBox } = await SvgStructureAnalyzer.analyzeShieldBubbleRaw(svgContent, viewBox, {
                dilateRadius: this._shieldBubbleState.dilateRadius
            });

            this._shieldBubbleState = { ...this._shieldBubbleState, rawPoints, rawW, rawH, rawViewBox, loading: false };
            this._recomputeShieldBubblePoints();
        } catch (e) {
            lcardsLog.error('[MSDStudio] Shield-bubble generation failed:', e);
            this._shieldBubbleState = { ...this._shieldBubbleState, loading: false, error: e.message, points: null, rawPoints: null };
        }
        this.requestUpdate();

        if (this._shieldBubblePendingRegenerate) {
            this._shieldBubblePendingRegenerate = false;
            await this._regenerateShieldBubblePreview();
        }
    }

    /**
     * Close the panel without committing anything - no config mutation.
     * @private
     */
    _cancelShieldBubble() {
        this._shieldBubbleState = {
            ...this._shieldBubbleState,
            active: false, points: null, error: null,
            rawPoints: null, rawW: 0, rawH: 0, rawViewBox: null
        };
    }

    /**
     * Section id name list for a given section count, ordered to match
     * SvgStructureAnalyzer.splitBoundaryIntoSections()'s traversal order
     * (slice 0 at startAngleDeg=0 = the bow/+X side per that method's own
     * JSDoc, proceeding around the loop). All names share the `shield_`
     * prefix so `pattern:^shield_` bulk-targets every section (and the
     * single-shape `shield_bubble` id) uniformly in RulesEngine rules.
     * @param {number} count
     * @returns {string[]}
     * @private
     */
    _shieldSectionNames(count) {
        if (count === 4) return ['shield_fore', 'shield_starboard', 'shield_aft', 'shield_port'];
        return Array.from({ length: count }, (_, i) => `shield_section_${i + 1}`);
    }

    /**
     * Generate a unique overlay id from a desired base name: use it as-is if
     * free, otherwise suffix _2, _3, ... Distinct from _generateShapeId()
     * (always produces shape_N off the shape count) since shield-bubble ids
     * need semantic, pattern:-matchable names instead.
     * @param {string} base
     * @returns {string}
     * @private
     */
    _generateUniqueOverlayId(base) {
        const overlays = this._workingConfig.msd?.overlays || [];
        if (!overlays.find(o => o.id === base)) return base;
        let n = 2;
        while (overlays.find(o => o.id === `${base}_${n}`)) n++;
        return `${base}_${n}`;
    }

    /**
     * Commit the current shield-bubble preview as one or more real
     * shape/polyline overlays. Follows _duplicateShape's established
     * "already-have-a-complete-overlay, just append" idiom (_setNestedValue)
     * rather than _saveShape() - that method reads from the single-shape
     * edit-form's own instance state, not a passed-in overlay object, so
     * it's the wrong shape of function for a batch generate-and-add action.
     * @private
     */
    _acceptShieldBubble() {
        const state = this._shieldBubbleState;
        if (!state?.points?.length) return;

        const overlays = this._workingConfig.msd?.overlays || [];
        const newOverlays = [];

        // Stroke-only default: a shield-bubble's typical use is a
        // highlight/animation outline (glow/march/draw presets tracing the
        // hull), and a filled shape would occlude the artwork underneath -
        // fully editable afterward via the normal Edit flow.
        const baseStyle = {
            color: { default: 'var(--lcars-orange)' },
            width: 2,
            opacity: 0.9,
            fill: { default: 'none' },
            fill_opacity: 1
        };

        // Each overlay needs its own color/fill objects — {...baseStyle} only
        // copies the top-level style object, so every section would otherwise
        // share the exact same color/fill object identity, and editing one
        // section's color would corrupt all the others.
        const cloneStyle = () => ({ ...baseStyle, color: { ...baseStyle.color }, fill: { ...baseStyle.fill } });

        if (state.mode === 'single') {
            newOverlays.push({
                type: 'shape',
                kind: 'polyline',
                id: this._generateUniqueOverlayId('shield_bubble'),
                points: state.points,
                closed: true,
                style: cloneStyle()
            });
        } else {
            const sections = SvgStructureAnalyzer.splitBoundaryIntoSections(state.points, state.sectionCount, { startAngleDeg: state.startAngleDeg });
            const names = this._shieldSectionNames(state.sectionCount);
            sections.forEach((pts, i) => {
                newOverlays.push({
                    type: 'shape',
                    kind: 'polyline',
                    id: this._generateUniqueOverlayId(names[i]),
                    points: pts,
                    closed: false,
                    style: cloneStyle()
                });
            });
        }

        this._setNestedValue('msd.overlays', [...overlays, ...newOverlays]);
        this._shieldBubbleState = this._defaultShieldBubbleState();
    }

    /**
     * Render the Suggest Shield Bubble control panel: mode toggle, section
     * count (sections mode only), dilate-radius/simplify-tolerance controls,
     * an explicit Preview button (spinner rendered inline inside the button
     * itself while loading - deliberately not a standalone spinner element:
     * a free-floating <ha-spinner> here proved impossible to visually
     * confirm across several rounds of fixes/debugging, whereas this exact
     * "spinner replaces button content while busy" pattern is already
     * proven working elsewhere in this codebase, e.g.
     * lcards-storage-explorer-tab.js's Save button), error state,
     * Accept/Cancel. dilateRadius still requires clicking Preview (drives
     * the expensive dilate+trace pipeline), but simplifyTolerance/roundness
     * are live - see _recomputeShieldBubblePoints - since they're cheap
     * synchronous post-processing over an already-traced raw boundary.
     * @returns {TemplateResult}
     * @private
     */
    _renderShieldBubblePanel() {
        const state = this._shieldBubbleState;
        const sections = state.mode === 'sections' && state.points?.length
            ? SvgStructureAnalyzer.splitBoundaryIntoSections(state.points, state.sectionCount, { startAngleDeg: state.startAngleDeg })
            : null;
        return html`
            <lcards-form-section
                header="Suggest Shield Bubble"
                description="Generate a shield-bubble outline (or angular sections) from the base SVG's own silhouette. Adjust settings, then click Preview. Nothing is saved to config until you Accept."
                icon="mdi:shield-outline"
                ?expanded=${true}
                style="margin-bottom: 16px;">

                <div class="subform-field-stack">
                    <ha-selector
                        .hass=${this.hass}
                        .selector=${{ select: { options: [
                            { value: 'single', label: 'Single shape' },
                            { value: 'sections', label: 'N sections' }
                        ] } }}
                        .value=${state.mode}
                        .label=${'Mode'}
                        @value-changed=${(e) => {
                            this._shieldBubbleState = { ...this._shieldBubbleState, mode: e.detail.value };
                            this.requestUpdate();
                        }}>
                    </ha-selector>

                    ${state.mode === 'sections' ? html`
                        <ha-selector
                            .hass=${this.hass}
                            .selector=${{ number: { mode: 'box', min: 2, max: 16, step: 1 } }}
                            .value=${state.sectionCount}
                            .label=${'Section count'}
                            @value-changed=${(e) => {
                                this._shieldBubbleState = { ...this._shieldBubbleState, sectionCount: Number(e.detail.value) };
                                this.requestUpdate();
                            }}>
                        </ha-selector>

                        <ha-selector
                            .hass=${this.hass}
                            .selector=${{ number: { mode: 'box', min: -180, max: 180, step: 1 } }}
                            .value=${state.startAngleDeg}
                            .label=${'Section start angle (° from bow, clockwise)'}
                            @value-changed=${(e) => {
                                this._shieldBubbleState = { ...this._shieldBubbleState, startAngleDeg: Number(e.detail.value) };
                                this.requestUpdate();
                            }}>
                        </ha-selector>
                    ` : ''}

                    <ha-selector
                        .hass=${this.hass}
                        .selector=${{ number: { mode: 'box', min: 0, max: 100, step: 1 } }}
                        .value=${state.dilateRadius}
                        .label=${'Dilate radius (px offset from hull)'}
                        @value-changed=${(e) => {
                            this._shieldBubbleState = { ...this._shieldBubbleState, dilateRadius: Number(e.detail.value) };
                            this.requestUpdate();
                        }}>
                    </ha-selector>

                    <div class="subform-field-stack" style="gap: var(--ha-space-1);">
                        <label style="font-size: 14px; color: var(--primary-text-color);">
                            Simplify tolerance: ${state.simplifyTolerance} (higher = fewer points)
                        </label>
                        <input
                            type="range"
                            min="0" max="20" step="0.5"
                            .value=${String(state.simplifyTolerance)}
                            style="width: 100%;"
                            @input=${(e) => {
                                this._shieldBubbleState = { ...this._shieldBubbleState, simplifyTolerance: parseFloat(e.target.value) };
                                this._recomputeShieldBubblePoints();
                                this.requestUpdate();
                            }}>
                    </div>

                    <div class="subform-field-stack" style="gap: var(--ha-space-1);">
                        <label style="font-size: 14px; color: var(--primary-text-color);">
                            Roundness: ${Math.round(state.roundness * 100)}% (blend toward best-fit ellipse)
                        </label>
                        <input
                            type="range"
                            min="0" max="1" step="0.01"
                            .value=${String(state.roundness)}
                            style="width: 100%;"
                            @input=${(e) => {
                                this._shieldBubbleState = { ...this._shieldBubbleState, roundness: parseFloat(e.target.value) };
                                this._recomputeShieldBubblePoints();
                                this.requestUpdate();
                            }}>
                    </div>

                    <div style="font-size: 12px; color: var(--secondary-text-color); font-family: monospace;">
                        ${state.points?.length || 0} points
                        ${sections ? html`
                            <br>${this._shieldSectionNames(state.sectionCount).map((name, i) => `${name}: ${sections[i]?.length || 0} pts`).join(' · ')}
                        ` : ''}
                    </div>

                    ${this._renderShieldBubbleGuide()}

                    ${state.error ? html`<lcards-message type="error">${state.error}</lcards-message>` : ''}

                    <div style="display: flex; gap: 8px; margin-top: 8px;">
                        <ha-button @click=${() => this._regenerateShieldBubblePreview()} ?disabled=${state.loading}>
                            ${state.loading ? html`
                                <ha-spinner size="small" slot="start"></ha-spinner>
                                Generating…
                            ` : html`
                                <ha-icon icon="mdi:refresh" slot="start"></ha-icon>
                                Preview
                            `}
                        </ha-button>
                        <ha-button @click=${() => this._acceptShieldBubble()} ?disabled=${!state.points?.length || state.loading}>
                            <ha-icon icon="mdi:check" slot="start"></ha-icon>
                            Accept
                        </ha-button>
                        <ha-button @click=${() => this._cancelShieldBubble()}>
                            Cancel
                        </ha-button>
                    </div>
                </div>
            </lcards-form-section>
        `;
    }

    /**
     * Toggle the routing "Quick Tips" cheat sheet open/closed. Same
     * plain-boolean pattern as _toggleShieldBubbleGuide — exactly one
     * non-repeating panel, no per-item expand state needed.
     * @private
     */
    _toggleRoutingCheatSheet() {
        this._routingCheatSheetExpanded = !this._routingCheatSheetExpanded;
        this.requestUpdate();
    }

    /**
     * Collapsible "Quick Tips: common routing goals" cheat sheet — plain
     * goal-to-setting tips (not a diagram; the Routing Modes Reference
     * accordion above already has inline SVGs, and routing-concepts.md has
     * the Mermaid decision-flow, so this deliberately doesn't add a third
     * visual representation). Reuses the same preset-info-guide markup as
     * _renderShieldBubbleGuide/the animation/filter editors' own guides.
     * @returns {TemplateResult}
     * @private
     */
    _renderRoutingCheatSheet() {
        const expanded = this._routingCheatSheetExpanded;
        return html`
            <div class="preset-info-guide">
                <div class="preset-info-guide-header" @click=${() => this._toggleRoutingCheatSheet()}>
                    <ha-icon icon="mdi:lightbulb-outline"></ha-icon>
                    <span>Quick Tips: common routing goals</span>
                    <ha-icon icon="mdi:chevron-down" class="guide-chevron ${expanded ? 'expanded' : ''}"></ha-icon>
                </div>
                ${expanded ? html`
                    <div class="preset-info-guide-body">
                        <ul>
                            <li><strong>Bundle two or more lines to run together:</strong> point them at the same channel and leave "Discoverable by nearby lines" on — no need to list it in every line's <code>route_channels</code>.</li>
                            <li><strong>A channel must always be used, no matter the cost:</strong> set its mode to <code>force</code>.</li>
                            <li><strong>A channel is just a suggestion, only worth it if it's actually shorter/cleaner:</strong> set its mode to <code>prefer</code> — it's compared against the plain route and only wins on real cost.</li>
                            <li><strong>Keep lines away from a region entirely:</strong> set its mode to <code>avoid</code>.</li>
                            <li><strong>Chaining two or more channels on one line</strong> (<code>route_channels: [a, b, ...]</code>): pick any order — the router figures out which one to visit first based on geometry, not the order you checked them in.</li>
                            <li><strong>Force a straight run north/south instead of east/west (or vice versa):</strong> set the channel's Flow Direction explicitly to <code>vertical</code>/<code>horizontal</code> instead of <code>auto</code>.</li>
                            <li><strong>A bundled corridor's lead-in run is longer than it looks like it needs to be:</strong> lower that line's <code>corner_radius</code> — it drives both the lane-separation reservation before a bundled line's first turn and (in <code>forced</code> mode) the mandatory cardinal stub. <code>min_stub_length_factor</code> (Common Routing Options) only affects the small safety floor underneath that, not the <code>corner_radius</code>-driven part.</li>
                            <li><strong>Lines splitting onto their own lanes get a tight/squashed corner right where they separate:</strong> increase Lane Spacing (per-channel, or <code>trunk_line_spacing</code> card-wide) instead of raising <code>corner_radius</code> — those specific corners are capped by lane spacing, not by <code>corner_radius</code>.</li>
                            <li><strong>A corner elsewhere in the route (a tight detour, not a lane split) looks squashed:</strong> check Corner Room Weight (Common Routing Options, on by default) — it's the general-purpose mechanism for recovering a tight detour's corner toward its full configured radius.</li>
                            <li><strong>A specific line's corner must render at its exact configured size everywhere, no matter what else is nearby:</strong> set that line's <code>corner_radius_mode</code> to <code>forced</code> — accepts the tradeoff of removing its lead-in from crossing-avoidance consideration entirely, which can force otherwise-avoidable detours or line crossings near tight geometry.</li>
                        </ul>
                        <p>
                            For the full mental model (a decision-flow diagram of how routing modes interact), see the
                            <a href="${ROUTING_CONCEPTS_DOCS_URL}" target="_blank" rel="noopener">Routing Concepts</a> guide.
                        </p>
                    </div>
                ` : ''}
            </div>
        `;
    }

    /**
     * Toggle the "How shield bubble generation works" info guide open/closed.
     * A plain boolean (not a Set-indexed pattern like the animation/filter
     * editors' per-index guides) since there's exactly one non-repeating
     * shield-bubble panel, not a list of items each needing independent
     * expand state.
     * @private
     */
    _toggleShieldBubbleGuide() {
        this._shieldBubbleState = { ...this._shieldBubbleState, guideExpanded: !this._shieldBubbleState.guideExpanded };
        this.requestUpdate();
    }

    /**
     * Collapsible "How shield bubble generation works" guide, explaining
     * dilate radius / simplify tolerance / roundness with an illustrative
     * diagram. Reuses the same preset-info-guide markup/classes as
     * lcards-animation-editor.js's _renderPresetInfoGuide and
     * lcards-filter-editor.js's equivalent.
     * @returns {TemplateResult}
     * @private
     */
    _renderShieldBubbleGuide() {
        const expanded = this._shieldBubbleState.guideExpanded;
        return html`
            <div class="preset-info-guide">
                <div class="preset-info-guide-header" @click=${() => this._toggleShieldBubbleGuide()}>
                    <ha-icon icon="mdi:information-outline"></ha-icon>
                    <span>How shield bubble generation works</span>
                    <ha-icon icon="mdi:chevron-down" class="guide-chevron ${expanded ? 'expanded' : ''}"></ha-icon>
                </div>
                ${expanded ? html`
                    <div class="preset-info-guide-body">
                        <p><strong>Dilate radius</strong> offsets the traced boundary outward from the ship's own silhouette by this many pixels before tracing. This is the expensive step - it only re-runs when you click Preview.</p>
                        <p><strong>Simplify tolerance</strong> reduces the point count by dropping points that don't meaningfully change the outline's shape (corner-preserving simplification) - higher values mean fewer points but a coarser silhouette. Updates live as you drag.</p>
                        <p><strong>Roundness</strong> blends the traced outline toward a smooth best-fit oval, from 0% (exact traced shape) to 100% (pure ellipse) - useful for a cleaner, more stylized shield-bubble look instead of a literal hull outline. Updates live as you drag.</p>
                        <lcards-shield-bubble-diagram></lcards-shield-bubble-diagram>
                    </div>
                ` : ''}
            </div>
        `;
    }

    /**
     * Ephemeral (never-saved) preview of the current shield-bubble
     * generation, shown on the live canvas while the Suggest panel is open.
     * Single mode: one dashed closed outline. Sections mode:
     * SvgStructureAnalyzer.splitBoundaryIntoSections() applied to the same
     * points, each section in a distinct color so boundaries are visually
     * obvious before commit.
     * @returns {TemplateResult|string}
     * @private
     */
    _renderShieldBubblePreview() {
        const state = this._shieldBubbleState;
        if (!state?.active || !state.points?.length) return '';

        const vbToPixel = this._getViewBoxToPixelConverter();
        if (!vbToPixel) return '';

        const toPath = (pts, closed) => {
            const pixelPts = pts.map(p => vbToPixel(p[0], p[1]));
            return pixelPts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p[0]} ${p[1]}`).join(' ') + (closed ? ' Z' : '');
        };

        let svgContent;
        if (state.mode === 'single') {
            svgContent = `<path d="${toPath(state.points, true)}" fill="rgba(255,159,10,0.15)" stroke="#FF9F0A" stroke-width="2" stroke-dasharray="6,4" />`;
        } else {
            const sections = SvgStructureAnalyzer.splitBoundaryIntoSections(state.points, state.sectionCount, { startAngleDeg: state.startAngleDeg });
            const palette = ['#FF9F0A', '#0AFFEF', '#FF0A8C', '#8CFF0A', '#0A8CFF', '#FF0A0A', '#FFF00A', '#B00AFF'];
            svgContent = sections.map((pts, i) =>
                `<path d="${toPath(pts, false)}" fill="none" stroke="${palette[i % palette.length]}" stroke-width="3" stroke-dasharray="6,4" />`
            ).join('');
        }

        return html`
            <div style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; pointer-events: none; z-index: 1000;">
                <svg style="width: 100%; height: 100%; position: absolute;">
                    ${unsafeSVG(svgContent)}
                </svg>
            </div>
        `;
    }

    /**
     * Get shape overlays from config
     * @returns {Array}
     * @private
     */
    _getShapeOverlays() {
        const overlays = this._workingConfig.msd?.overlays || [];
        return overlays.filter(o => o.type === 'shape');
    }

    /**
     * Render single shape item
     * @param {Object} shape - Shape overlay config
     * @returns {TemplateResult}
     * @private
     */
    _renderShapeItem(shape) {
        const id = shape.id || 'unnamed';
        const kind = shape.kind || 'polyline';
        const rawColor = shape.style?.color;
        const strokeColor = (typeof rawColor === 'object' && rawColor !== null)
            ? (rawColor.default || Object.values(rawColor)[0] || 'var(--lcars-orange)')
            : (rawColor || 'var(--lcars-orange)');
        const kindIcon = kind === 'rect' ? 'mdi:rectangle-outline' : kind === 'circle' ? 'mdi:circle-outline' : 'mdi:vector-polyline';
        const geometryStr = kind === 'polyline'
            ? `${(shape.points || []).length} points${shape.closed ? ' (closed)' : ''}`
            : `${(shape.size || [0, 0]).join('×')}`;

        return html`
            <div class="list-item-card">
                <div style="display: flex; align-items: center; gap: 12px; flex-wrap: wrap;">
                    <!-- Shape Preview -->
                    <div style="
                        width: 40px;
                        height: 40px;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        border: 1px solid var(--divider-color);
                        border-radius: 4px;
                        background: var(--card-background-color);
                        flex-shrink: 0;
                    ">
                        <ha-icon icon="${kindIcon}" style="color: ${strokeColor};"></ha-icon>
                    </div>

                    <!-- Shape Info -->
                    <div style="flex: 1; min-width: 140px;">
                        <div style="font-weight: 600; display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
                            ${id}
                            <span style="
                                font-size: 10px;
                                padding: 2px 6px;
                                background: var(--primary-color);
                                color: var(--text-primary-color);
                                border-radius: 3px;
                                font-weight: 500;
                            ">${kind}</span>
                        </div>
                        <div style="font-size: 12px; color: var(--secondary-text-color); font-family: monospace;">
                            ${geometryStr}
                        </div>
                    </div>

                    <!-- Action Buttons -->
                    <div style="display: flex; gap: 8px; flex-shrink: 0; margin-left: auto;">
                        <ha-icon-button
                            @click=${() => this._editShape(shape)}
                            .label=${'Edit'}
                            .path=${'M20.71,7.04C21.1,6.65 21.1,6 20.71,5.63L18.37,3.29C18,2.9 17.35,2.9 16.96,3.29L15.12,5.12L18.87,8.87M3,17.25V21H6.75L17.81,9.93L14.06,6.18L3,17.25Z'}>
                        </ha-icon-button>
                        <ha-icon-button
                            @click=${() => this._duplicateShape(shape)}
                            .label=${'Duplicate'}
                            .path=${'M19,21H8V7H19M19,5H8A2,2 0 0,0 6,7V21A2,2 0 0,0 8,23H19A2,2 0 0,0 21,21V7A2,2 0 0,0 19,5M16,1H4A2,2 0 0,0 2,3V17H4V3H16V1Z'}>
                        </ha-icon-button>
                        <ha-icon-button
                            @click=${() => this._deleteShape(shape)}
                            .label=${'Delete'}
                            .path=${'M19,4H15.5L14.5,3H9.5L8.5,4H5V6H19M6,19A2,2 0 0,0 8,21H16A2,2 0 0,0 18,19V7H6V19Z'}>
                        </ha-icon-button>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Generate a unique shape overlay id
     * @returns {string}
     * @private
     */
    _generateShapeId() {
        const overlays = this._workingConfig.msd?.overlays || [];
        let num = overlays.filter(o => o.type === 'shape').length + 1;
        let id = `shape_${num}`;
        while (overlays.find(o => o.id === id)) {
            num++;
            id = `shape_${num}`;
        }
        return id;
    }

    /**
     * Open the shape form for a new shape. Optionally pre-filled with a kind and
     * geometry (position/size for rect/circle, points for polyline) — used by the
     * canvas draw handlers (_handleDrawShapeClick/_finishDrawShapePolyline) as
     * well as the plain "Add Shape" button (no overrides, defaults to a rect).
     * @param {string} [kind] - 'polyline'|'rect'|'circle', defaults to 'rect'
     * @param {Object} [geometry] - { position, size } or { points }
     * @private
     */
    _openShapeForm(kind = 'rect', geometry = {}) {
        this._editingShapeId = null;
        this._shapeFormData = {
            id: this._generateShapeId(),
            kind,
            position: geometry.position || [100, 100],
            size: geometry.size || [100, 60],
            points: geometry.points || (kind === 'polyline' ? [[100, 100], [200, 100]] : []),
            closed: false,
            entity: '',
            state_attribute: '',
            ranges_attribute: '',
            z_index: null,
            corner_style: 'round',
            corner_radius: kind === 'rect' ? 8 : 34,
            corner_angle: 45,
            smoothing_mode: 'none',
            smoothing_iterations: 0,
            animations: [],
            style: {
                color: { default: 'var(--lcars-orange)' },
                width: 2,
                opacity: 1,
                dash_array: '',
                fill: { default: 'none' },
                fill_opacity: 1,
                line_cap: 'butt',
                line_join: '',
                miter_limit: 4,
                marker_end: null,
                marker_start: null
            }
        };
        this._shapeFormActiveSubtab = 'geometry';
        this._showShapeForm = true;
        this.requestUpdate();
    }

    /**
     * Edit an existing shape
     * @param {Object} shape - Shape overlay config
     * @private
     */
    _editShape(shape) {
        this._editingShapeId = shape.id;

        // style.color/style.fill may be a legacy plain string (pre-dating state-color
        // support) — normalize both to the state-color object shape lcards-color-
        // section-v2 expects, mirroring _editLine's identical normalization.
        const rawColor = shape.style?.color;
        const normalizedColor = (typeof rawColor === 'object' && rawColor !== null)
            ? rawColor
            : { default: rawColor || 'var(--lcars-orange)' };
        const rawFill = shape.style?.fill;
        const normalizedFill = (typeof rawFill === 'object' && rawFill !== null)
            ? rawFill
            : { default: rawFill || 'none' };

        this._shapeFormData = {
            id: shape.id,
            kind: shape.kind || 'polyline',
            position: shape.position || [100, 100],
            size: shape.size || [100, 60],
            points: shape.points || [],
            closed: shape.closed === true,
            entity: shape.entity || '',
            state_attribute: shape.state_attribute || '',
            ranges_attribute: shape.ranges_attribute || '',
            z_index: shape.z_index ?? null,
            corner_style: shape.corner_style || 'round',
            corner_radius: shape.corner_radius ?? (shape.kind === 'rect' ? 8 : 34),
            corner_angle: shape.corner_angle ?? 45,
            smoothing_mode: shape.smoothing_mode || 'none',
            smoothing_iterations: shape.smoothing_iterations || 0,
            animations: shape.animations || [],
            style: {
                color: normalizedColor,
                width: shape.style?.width || 2,
                opacity: shape.style?.opacity ?? 1,
                dash_array: shape.style?.dash_array || '',
                fill: normalizedFill,
                fill_opacity: shape.style?.fill_opacity ?? 1,
                line_cap: shape.style?.line_cap || 'butt',
                line_join: shape.style?.line_join || '',
                miter_limit: shape.style?.miter_limit ?? 4,
                marker_end: shape.style?.marker_end || null,
                marker_start: shape.style?.marker_start || null
            }
        };
        this._shapeFormActiveSubtab = 'geometry';
        this._showShapeForm = true;
        this.requestUpdate();
    }

    /**
     * Duplicate shape: clone it with a fresh unique ID and open it for editing.
     * @param {Object} shape - Shape overlay config
     * @private
     */
    _duplicateShape(shape) {
        const overlays = this._workingConfig.msd?.overlays || [];
        const newId = this._generateShapeId();
        const cloned = { ...JSON.parse(JSON.stringify(shape)), id: newId };
        this._setNestedValue('msd.overlays', [...overlays, cloned]);
        this._editShape(cloned);
    }

    /**
     * Delete a shape overlay (with confirmation)
     * @param {Object} shape - Shape overlay config
     * @private
     */
    async _deleteShape(shape) {
        if (!await this._showConfirmDialog('Delete Shape', `Delete shape "${shape.id}"?`)) {
            return;
        }

        const overlays = this._workingConfig.msd?.overlays || [];
        const index = overlays.findIndex(o => o.id === shape.id);
        if (index >= 0) {
            overlays.splice(index, 1);
            lcardsLog.debug('[MSDStudio] Deleted shape:', shape.id);
            this.requestUpdate();
            this._schedulePreviewUpdate();
        }
    }

    /**
     * Save shape form. Mirrors _saveLine's direct-mutation pattern exactly (no
     * _updateConfig — see class-level precedent) — build a plain overlay object
     * with only non-default fields, find-or-push into msd.overlays by the stable
     * editing id.
     * @param {boolean} [keepOpen=false]
     * @private
     */
    _saveShape(keepOpen = false) {
        if (!this._shapeFormData.id) {
            lcardsLog.warn('[MSDStudio] Cannot save shape without ID');
            return;
        }

        const kind = this._shapeFormData.kind;
        const shapeOverlay = {
            type: 'shape',
            id: this._shapeFormData.id,
            kind
        };

        if (kind === 'polyline') {
            shapeOverlay.points = this._shapeFormData.points || [];
            if (this._shapeFormData.closed) {
                shapeOverlay.closed = true;
            }
        } else {
            shapeOverlay.position = this._shapeFormData.position || [0, 0];
            shapeOverlay.size = this._shapeFormData.size || [100, 60];
        }

        if (this._shapeFormData.z_index != null) {
            shapeOverlay.z_index = this._shapeFormData.z_index;
        }
        if (this._shapeFormData.entity) {
            shapeOverlay.entity = this._shapeFormData.entity;
        }
        if (this._shapeFormData.state_attribute) {
            shapeOverlay.state_attribute = this._shapeFormData.state_attribute;
        }
        if (this._shapeFormData.ranges_attribute) {
            shapeOverlay.ranges_attribute = this._shapeFormData.ranges_attribute;
        }

        if (this._shapeFormData.corner_style && this._shapeFormData.corner_style !== 'round') {
            shapeOverlay.corner_style = this._shapeFormData.corner_style;
        } else if (this._shapeFormData.corner_style === 'round' && this._shapeFormData.corner_radius > 0) {
            // 'round' is the schema default, but must still be persisted explicitly —
            // ShapeOverlay only applies rx/ry (rect) or corner rounding (polyline)
            // when corner_style is exactly 'round', not merely absent/undefined.
            shapeOverlay.corner_style = 'round';
        }
        if (this._shapeFormData.corner_radius != null && this._shapeFormData.corner_radius !== 0) {
            shapeOverlay.corner_radius = this._shapeFormData.corner_radius;
        }
        if (kind === 'polyline') {
            if (this._shapeFormData.corner_style === 'bevel' && this._shapeFormData.corner_angle != null && this._shapeFormData.corner_angle !== 45) {
                shapeOverlay.corner_angle = this._shapeFormData.corner_angle;
            }
            if (this._shapeFormData.smoothing_mode && this._shapeFormData.smoothing_mode !== 'none') {
                shapeOverlay.smoothing_mode = this._shapeFormData.smoothing_mode;
            }
            if (this._shapeFormData.smoothing_iterations != null && this._shapeFormData.smoothing_iterations !== 0) {
                shapeOverlay.smoothing_iterations = this._shapeFormData.smoothing_iterations;
            }
        }

        if (this._shapeFormData.animations && this._shapeFormData.animations.length > 0) {
            shapeOverlay.animations = this._shapeFormData.animations;
        }

        /** @type {Object<string, any>} */
        const style = {};
        const formStyle = this._shapeFormData.style || {};
        if (formStyle.color != null) {
            const c = formStyle.color;
            // Simplify {default: X} with nothing else configured back to a plain
            // string — keeps saved YAML clean for the common non-state-color case.
            const keys = (typeof c === 'object' && c !== null) ? Object.keys(c) : null;
            style.color = (keys && keys.length === 1 && keys[0] === 'default') ? c.default : c;
        }
        if (formStyle.width != null) style.width = formStyle.width;
        if (formStyle.opacity != null && formStyle.opacity !== 1) style.opacity = formStyle.opacity;
        if (formStyle.dash_array) style.dash_array = formStyle.dash_array;
        if (formStyle.fill != null) {
            const f = formStyle.fill;
            const keys = (typeof f === 'object' && f !== null) ? Object.keys(f) : null;
            const simplified = (keys && keys.length === 1 && keys[0] === 'default') ? f.default : f;
            // Only persist if it's not the inert 'none' default (a plain string here,
            // never an object — state-bound fill always has more than one key).
            if (simplified !== 'none') style.fill = simplified;
        }
        if (formStyle.fill_opacity != null && formStyle.fill_opacity !== 1) style.fill_opacity = formStyle.fill_opacity;
        if (kind === 'polyline') {
            if (formStyle.line_cap && formStyle.line_cap !== 'butt') style.line_cap = formStyle.line_cap;
            if (formStyle.line_join) style.line_join = formStyle.line_join;
            if (formStyle.miter_limit != null && formStyle.miter_limit !== 4) style.miter_limit = formStyle.miter_limit;
            if (formStyle.marker_end) style.marker_end = formStyle.marker_end;
            if (formStyle.marker_start) style.marker_start = formStyle.marker_start;
        }
        if (Object.keys(style).length > 0) {
            shapeOverlay.style = style;
        }

        if (!this._workingConfig.msd) {
            this._workingConfig.msd = {};
        }
        if (!this._workingConfig.msd.overlays) {
            this._workingConfig.msd.overlays = [];
        }

        const existingIndex = this._editingShapeId
            ? this._workingConfig.msd.overlays.findIndex(o => o.id === this._editingShapeId)
            : -1;
        if (existingIndex >= 0) {
            const existingOverlay = this._workingConfig.msd.overlays[existingIndex];
            if (existingOverlay._editorSelected) {
                shapeOverlay._editorSelected = true;
            }
            this._workingConfig.msd.overlays[existingIndex] = shapeOverlay;
            lcardsLog.debug('[MSDStudio] Updated shape:', this._shapeFormData.id);
        } else {
            this._workingConfig.msd.overlays.push(shapeOverlay);
            lcardsLog.debug('[MSDStudio] Added shape:', this._shapeFormData.id);
        }

        if (!keepOpen) {
            this._closeShapeForm();
        }
        this._schedulePreviewUpdate();
    }

    /**
     * Close shape form dialog
     * @private
     */
    _closeShapeForm() {
        this._showShapeForm = false;
        this._editingShapeId = null;
        this.requestUpdate();
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
        // style.color may be a state-color object (see _renderLineColorSection) —
        // show a representative swatch rather than "[object Object]".
        const rawStrokeColor = line.style?.color;
        const strokeColor = (typeof rawStrokeColor === 'object' && rawStrokeColor !== null)
            ? (rawStrokeColor.default || rawStrokeColor.active || Object.values(rawStrokeColor)[0] || '#FF9900')
            : (rawStrokeColor || '#FF9900');
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
            <div class="list-item-card">
                <div style="display: flex; align-items: center; gap: 12px; flex-wrap: wrap;">
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
                        flex-shrink: 0;
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
                <div style="flex: 1; min-width: 140px;">
                    <div style="font-weight: 600; display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
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
                    <div style="font-size: 12px; color: var(--secondary-text-color); font-family: monospace; word-break: break-word;">
                        ${sourceStr} → ${targetStr}
                    </div>
                </div>

                <!-- Action Buttons -->
                <div style="display: flex; gap: 8px; flex-shrink: 0; margin-left: auto;">
                    <ha-icon-button
                        @click=${() => this._editLine(line)}
                        .label=${'Edit'}
                        .path=${'M20.71,7.04C21.1,6.65 21.1,6 20.71,5.63L18.37,3.29C18,2.9 17.35,2.9 16.96,3.29L15.12,5.12L18.87,8.87M3,17.25V21H6.75L17.81,9.93L14.06,6.18L3,17.25Z'}>
                    </ha-icon-button>
                    <ha-icon-button
                        @click=${() => this._duplicateLine(line)}
                        .label=${'Duplicate'}
                        .path=${'M19,21H8V7H19M19,5H8A2,2 0 0,0 6,7V21A2,2 0 0,0 8,23H19A2,2 0 0,0 21,21V7A2,2 0 0,0 19,5M16,1H4A2,2 0 0,0 2,3V17H4V3H16V1Z'}>
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
     * Render Channels tab.
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

                <!-- Routing Modes Reference -->
                <lcards-form-section
                    header="Routing Modes Reference"
                    description="Quick reference for routing behavior"
                    icon="mdi:book-open-variant"
                    ?expanded=${false}
                    style="margin-bottom: 16px;">

                    <!-- Topic selector for reference display -->
                    <ha-selector
                        .hass=${this.hass}
                        .selector=${{
                            select: {
                                options: [
                                    { value: 'auto', label: 'Auto (Recommended)' },
                                    { value: 'bundling', label: 'Bundling (Trunk-and-Branch)' },
                                    { value: 'crossing', label: 'Crossing Avoidance' },
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

                ${this._renderRoutingCheatSheet()}

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
                                Channels are rectangular corridors that guide line routing:
                                <br/>• <strong>Prefer</strong>: Lines are rewarded for traveling through, and bundle into evenly-spaced lanes
                                <br/>• <strong>Avoid</strong>: Lines are penalized for entering
                                <br/>• <strong>Force</strong>: Lines referencing the channel must route through it
                                <br/><br/>Lines opt in with <code>route_channels: [channel_id]</code> — and, separately,
                                any line routing nearby can also discover and bundle with a channel automatically,
                                whether or not it lists it in <code>route_channels</code>. Turn off "Discoverable by
                                nearby lines" on a channel to scope it to only the lines that explicitly reference it.
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

                <!-- Common Routing Options (general grid/A* tunables users adjust most) -->
                <lcards-form-section
                    header="Common Routing Options"
                    description="The big levers — how tightly lines can bend and detour, and how much they favor straight paths"
                    icon="mdi:routes"
                    ?expanded=${false}
                    style="margin-bottom: 16px;">

                    <lcards-message type="info" style="margin-bottom: 16px;">
                        <strong>Applies to <code>auto</code> (default), <code>smart</code>, and <code>grid</code> lines</strong>
                        <p style="margin: 8px 0 0 0; font-size: 13px; line-height: 1.4;">
                            <code>route: auto</code> always does full pathfinding, so these apply to it too — not
                            just an explicit <code>smart</code>/<code>grid</code>. Only <code>manhattan</code> and
                            <code>direct</code>/<code>manual</code> opt out. Separate from the canvas's own
                            drawing/snap grid, which only affects the Studio's visual editing surface, not the
                            routing engine.
                        </p>
                    </lcards-message>

                    <div style="display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16px;">
                        <ha-selector
                            .hass=${this.hass}
                            .selector=${{ number: { min: 5, mode: 'box', unit_of_measurement: 'vb' } }}
                            .value=${routing.grid_resolution}
                            .label=${'Grid Resolution'}
                            @value-changed=${(e) => this._updateRoutingConfig('grid_resolution', e.detail.value)}
                            helper="Pathfinding cell size. Left blank: auto-scales from your view_box size (~1/12th of the shorter dimension, clamped 16-64). Smaller = tighter turns/detours, more precise, slower; values ≤ 4 are coerced to 32.">
                        </ha-selector>
                        <ha-selector
                            .hass=${this.hass}
                            .selector=${{ number: { min: 0, step: 0.1, mode: 'box' } }}
                            .value=${routing.min_stub_length_factor}
                            .label=${'Min Stub Length Factor'}
                            @value-changed=${(e) => this._updateRoutingConfig('min_stub_length_factor', e.detail.value)}
                            helper="Multiplier on Grid Resolution for the minimum mandatory lead-out/lead-in every line reserves before routing runs (default: 1, i.e. one grid cell). Lower it on a small view_box, where a flat minimum would otherwise force lines to travel disproportionately far before their first turn.">
                        </ha-selector>
                        <ha-selector
                            .hass=${this.hass}
                            .selector=${{ number: { min: 0, step: 0.5, mode: 'box' } }}
                            .value=${routing.turn_penalty}
                            .label=${'Turn Penalty'}
                            @value-changed=${(e) => this._updateRoutingConfig('turn_penalty', e.detail.value)}
                            helper="Cost for direction changes (default: 2). Higher = straighter paths with fewer bends.">
                        </ha-selector>
                        <ha-selector
                            .hass=${this.hass}
                            .selector=${{ number: { min: 0, mode: 'box', unit_of_measurement: 'vb' } }}
                            .value=${routing.clearance}
                            .label=${'Clearance'}
                            @value-changed=${(e) => this._updateRoutingConfig('clearance', e.detail.value)}
                            helper="Min distance from obstacles (default: 0).">
                        </ha-selector>
                        <ha-selector
                            .hass=${this.hass}
                            .selector=${{ number: { min: 0, mode: 'box' } }}
                            .value=${routing.corner_room_weight}
                            .label=${'Corner Room Weight'}
                            @value-changed=${(e) => this._updateRoutingConfig('corner_room_weight', e.detail.value)}
                            helper="How strongly a tight detour's corner tries to recover its full corner_radius (default: 4 — on; set 0 to disable). Also settable per-line. See Pathfinding Refinement under Advanced Routing Configuration for the related Proximity Band option.">
                        </ha-selector>
                    </div>
                </lcards-form-section>

                <!-- Trace Bundling & Crossing Avoidance (common tunables) -->
                <lcards-form-section
                    header="Trace Bundling & Crossings"
                    description="Cable-raceway behavior: lines travel together and avoid cutting across each other"
                    icon="mdi:transit-connection-variant"
                    ?expanded=${false}
                    style="margin-bottom: 16px;">

                    <lcards-message type="info" style="margin-bottom: 16px;">
                        <p style="margin: 0; font-size: 13px; line-height: 1.4;">
                            Tunables for the automatic bundling and crossing-avoidance behavior every
                            <code>route: auto</code> line gets by default. See the <strong>Bundling</strong> and
                            <strong>Crossing Avoidance</strong> topics in Routing Modes Reference above for how it
                            works. Only <code>route: manhattan</code> and <code>route: direct</code>/<code>manual</code>
                            opt out — declaration order in YAML never changes the outcome.
                        </p>
                    </lcards-message>

                    <ha-selector
                        style="display: block; margin-bottom: 12px;"
                        .hass=${this.hass}
                        .selector=${{ boolean: {} }}
                        .value=${routing.trunk_bundling_enabled !== false}
                        .label=${'Bundle parallel lines (trunk-and-branch)'}
                        @value-changed=${(e) => this._updateRoutingConfig('trunk_bundling_enabled', e.detail.value ? undefined : false)}>
                    </ha-selector>
                    <ha-selector
                        style="display: block; margin-bottom: 16px;"
                        .hass=${this.hass}
                        .selector=${{ boolean: {} }}
                        .value=${routing.crossing_avoid_enabled !== false}
                        .label=${'Avoid line crossings'}
                        @value-changed=${(e) => this._updateRoutingConfig('crossing_avoid_enabled', e.detail.value ? undefined : false)}>
                    </ha-selector>

                    <div style="display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16px;">
                        <ha-selector
                            .hass=${this.hass}
                            .selector=${{ number: { min: 0, mode: 'box', unit_of_measurement: 'vb' } }}
                            .value=${routing.trunk_line_spacing}
                            .label=${'Lane Spacing'}
                            @value-changed=${(e) => this._updateRoutingConfig('trunk_line_spacing', e.detail.value)}
                            helper="Gap between bundled lines (default: 8). Also sets how rounded their lane-separation corners can get, independent of corner_radius — wider spacing allows a bigger achieved radius right where lines split onto their own lanes.">
                        </ha-selector>
                        <ha-selector
                            .hass=${this.hass}
                            .selector=${{ number: { min: 0, mode: 'box', unit_of_measurement: 'vb' } }}
                            .value=${routing.trunk_proximity}
                            .label=${'Bundling Proximity'}
                            @value-changed=${(e) => this._updateRoutingConfig('trunk_proximity', e.detail.value)}
                            helper="How close lines must run to bundle (default: 32)">
                        </ha-selector>
                        <ha-selector
                            .hass=${this.hass}
                            .selector=${{ number: { min: 0, step: 0.1, mode: 'box' } }}
                            .value=${routing.trunk_bundle_weight}
                            .label=${'Bundling Pull'}
                            @value-changed=${(e) => this._updateRoutingConfig('trunk_bundle_weight', e.detail.value)}
                            helper="How strongly joining a bundle is rewarded (default: 0.5)">
                        </ha-selector>
                        <ha-selector
                            .hass=${this.hass}
                            .selector=${{ number: { min: 0, mode: 'box' } }}
                            .value=${routing.crossing_avoid_bias}
                            .label=${'Crossing Penalty'}
                            @value-changed=${(e) => this._updateRoutingConfig('crossing_avoid_bias', e.detail.value)}
                            helper="Deterrent per crossing, not a hard block (default: 4; higher = longer detours accepted)">
                        </ha-selector>
                    </div>
                </lcards-form-section>

                <!-- Global Routing Defaults (Advanced) -->
                <lcards-form-section
                    header="Advanced Routing Configuration"
                    description="Deep router internals — rarely needed"
                    icon="mdi:tune"
                    ?expanded=${false}
                    style="margin-bottom: 16px;">

                    <!-- Help Text -->
                    <lcards-message type="info" style="margin-bottom: 16px;">
                        <strong>When These Settings Apply</strong>
                        <p style="margin: 8px 0 0 0; font-size: 13px; line-height: 1.4;">
                            These parameters affect any line that does full pathfinding — <code>route: auto</code>
                            (the default), <code>smart</code>, or <code>grid</code> — regardless of whether
                            obstacles or channels are present.
                            <br/><br/>Lines with <code>route: manhattan</code>, <code>direct</code>, or
                            <code>manual</code> are not affected by these settings — they never pathfind.
                        </p>
                        <div style="margin-top: 8px;">
                            <a href="https://lcards.unimatrix01.ca/cards/msd/routing.html"
                               target="_blank" rel="noopener noreferrer" style="font-size: 12px;">
                                Routing Documentation ↗
                            </a>
                        </div>
                    </lcards-message>

                    <!-- Parameter Explanations -->
                    <lcards-message type="tip" style="margin-bottom: 16px;">
                        <strong>Parameter Guide</strong>
                        <div style="margin: 8px 0 0 0; font-size: 12px; line-height: 1.6;">
                            <div style="margin-bottom: 6px;">
                                <strong>Grid Resolution, Min Stub Length Factor, Corner Room Weight, Turn Penalty, and Clearance</strong> are common tunables — see
                                the Common Routing Options section above. Corner Room Weight is one of the two primary levers for corner appearance (the other, <code>corner_radius</code>, is per-line) — it's grouped with the general tunables here rather than under Pathfinding Refinement below because of how often it actually matters in practice.
                            </div>

                            <div style="margin-bottom: 6px;"><strong>Path Smoothing</strong></div>
                            <div style="margin-left: 12px; margin-bottom: 8px;">
                                • <strong>Chaikin smoothing</strong>: Rounds sharp corners using subdivision algorithm<br/>
                                • <strong>Iterations</strong>: More iterations = smoother curves but less grid-aligned<br/>
                                • <strong>Max Points</strong>: Limits path complexity to prevent performance issues
                            </div>

                            <div style="margin-bottom: 6px;"><strong>Pathfinding Refinement</strong></div>
                            <div style="margin-left: 12px; margin-bottom: 8px;">
                                • <strong>Proximity Band</strong>: Extra avoidance distance from obstacles (0 disables this trigger)<br/>
                                • <strong>Detour Span</strong>: How far the algorithm looks ahead for better paths<br/>
                                • <strong>Max Extra Bends</strong>: Maximum additional turns allowed for optimization<br/>
                                • <strong>Max Detours</strong>: How many alternate routes to consider per segment<br/>
                                <em>Refinement runs whenever EITHER Proximity Band here OR Corner Room Weight (Common Routing Options above) is above 0.</em>
                            </div>

                            <div style="margin-bottom: 6px;"><strong>Channel Routing</strong></div>
                            <div style="margin-left: 12px; margin-bottom: 8px;">
                                • <strong>Force Penalty</strong>: Cost when failing to use a forced channel<br/>
                                • <strong>Avoid Multiplier</strong>: How strongly to avoid "avoid" channels<br/>
                                • <strong>Prefer / Avoid Bias</strong>: Per-cell A* discount/penalty inside prefer/avoid channels
                            </div>

                            <div style="margin-bottom: 6px;"><strong>Bundling &amp; Crossing Internals</strong></div>
                            <div style="margin-left: 12px; margin-bottom: 8px;">
                                • <strong>Min Trunk Length / Overlap</strong>: How long a straight run must be to bundle with, and how much shared travel makes joining worthwhile<br/>
                                • <strong>Max Join Candidates</strong>: How many nearby trunks one line will consider chaining through<br/>
                                • <strong>Discovery Passes</strong>: Safety cap on pre-render routing passes (order independence)<br/>
                                • <strong>Min Crossing Length</strong>: Shortest line segment other lines will still avoid crossing
                            </div>

                            <div style="margin-bottom: 6px;"><strong>Cost Function Weights</strong></div>
                            <div style="margin-left: 12px;">
                                • <strong>Bend / Proximity Cost</strong>: Per-bend and per-obstacle-proximity cost terms in the pathfinding cost formula<br/>
                                • <strong>Hint Penalty</strong>: Cost for a first/last move disagreeing with route_hint (soft — obstacles still win)
                            </div>
                        </div>
                    </lcards-message>

                    <!-- Path Smoothing -->
                    <div style="margin-bottom: 16px;">
                        <div style="font-weight: 500; margin-bottom: 8px;">Path Smoothing</div>
                        <div style="display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16px;">
                            <ha-selector
                                .hass=${this.hass}
                                .selector=${{ select: { options: [
                                    { value: 'none', label: 'None' },
                                    { value: 'chaikin', label: 'Chaikin' }
                                ] } }}
                                .value=${routing.smoothing_mode ?? 'none'}
                                .label=${'Smoothing Mode'}
                                @value-changed=${(e) => this._updateRoutingConfig('smoothing_mode', e.detail.value)}>
                            </ha-selector>
                            <ha-selector
                                .hass=${this.hass}
                                .selector=${{ number: { min: 1, max: 5, mode: 'box' } }}
                                .value=${routing.smoothing_iterations}
                                .label=${'Iterations'}
                                @value-changed=${(e) => this._updateRoutingConfig('smoothing_iterations', e.detail.value)}
                                helper="1-5 (default: 1)">
                            </ha-selector>
                            <ha-selector
                                .hass=${this.hass}
                                .selector=${{ number: { min: 1, mode: 'box' } }}
                                .value=${routing.smoothing_max_points}
                                .label=${'Max Points'}
                                @value-changed=${(e) => this._updateRoutingConfig('smoothing_max_points', e.detail.value)}
                                helper="Default: 160">
                            </ha-selector>
                        </div>
                    </div>

                    <!-- Smart Routing (renamed) -->
                    <div style="margin-bottom: 16px;">
                        <div style="font-weight: 500; margin-bottom: 8px;">
                            Pathfinding Refinement
                            <span style="font-weight: 400; font-size: 12px; color: var(--secondary-text-color); margin-left: 8px;">
                                (Runs whenever Proximity Band below is above 0, or Corner Room Weight — moved to Common Routing Options above, on by default — is above 0)
                            </span>
                        </div>
                        <div style="display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16px;">
                            <ha-selector
                                .hass=${this.hass}
                                .selector=${{ number: { min: 0, mode: 'box', unit_of_measurement: 'vb' } }}
                                .value=${routing.smart_proximity}
                                .label=${'Proximity Band'}
                                @value-changed=${(e) => this._updateRoutingConfig('smart_proximity', e.detail.value)}
                                helper="Extra obstacle avoidance distance (default: 0 — off unless > 0)">
                            </ha-selector>
                            <ha-selector
                                .hass=${this.hass}
                                .selector=${{ number: { min: 1, mode: 'box', unit_of_measurement: 'vb' } }}
                                .value=${routing.smart_detour_span}
                                .label=${'Detour Span'}
                                @value-changed=${(e) => this._updateRoutingConfig('smart_detour_span', e.detail.value)}
                                helper="Max elbow shift (default: 48)">
                            </ha-selector>
                            <ha-selector
                                .hass=${this.hass}
                                .selector=${{ number: { min: 0, mode: 'box' } }}
                                .value=${routing.smart_max_extra_bends}
                                .label=${'Max Extra Bends'}
                                @value-changed=${(e) => this._updateRoutingConfig('smart_max_extra_bends', e.detail.value)}
                                helper="Max added bends (default: 3)">
                            </ha-selector>
                            <ha-selector
                                .hass=${this.hass}
                                .selector=${{ number: { min: 0, mode: 'box', unit_of_measurement: 'vb' } }}
                                .value=${routing.smart_min_improvement}
                                .label=${'Min Improvement'}
                                @value-changed=${(e) => this._updateRoutingConfig('smart_min_improvement', e.detail.value)}
                                helper="Min cost gain (default: 4)">
                            </ha-selector>
                            <ha-selector
                                .hass=${this.hass}
                                .selector=${{ number: { min: 1, mode: 'box' } }}
                                .value=${routing.smart_max_detours_per_elbow}
                                .label=${'Max Detours Per Elbow'}
                                @value-changed=${(e) => this._updateRoutingConfig('smart_max_detours_per_elbow', e.detail.value)}
                                helper="Default: 4">
                            </ha-selector>
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
                        <div style="display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16px;">
                            <ha-selector
                                .hass=${this.hass}
                                .selector=${{ number: { min: 0, mode: 'box' } }}
                                .value=${routing.channel_force_penalty}
                                .label=${'Force Penalty'}
                                @value-changed=${(e) => this._updateRoutingConfig('channel_force_penalty', e.detail.value)}
                                helper="Penalty for exiting forced channels (default: 800)">
                            </ha-selector>
                            <ha-selector
                                .hass=${this.hass}
                                .selector=${{ number: { min: 0, step: 0.1, mode: 'box' } }}
                                .value=${routing.channel_avoid_multiplier}
                                .label=${'Avoid Multiplier'}
                                @value-changed=${(e) => this._updateRoutingConfig('channel_avoid_multiplier', e.detail.value)}
                                helper="Avoid channel strength (default: 1.0)">
                            </ha-selector>
                            <ha-selector
                                .hass=${this.hass}
                                .selector=${{ number: { min: 0, step: 0.1, mode: 'box' } }}
                                .value=${routing.channel_prefer_bias}
                                .label=${'Prefer Bias'}
                                @value-changed=${(e) => this._updateRoutingConfig('channel_prefer_bias', e.detail.value)}
                                helper="Per-cell discount in prefer channels (default: 0.9)">
                            </ha-selector>
                            <ha-selector
                                .hass=${this.hass}
                                .selector=${{ number: { min: 0, step: 0.5, mode: 'box' } }}
                                .value=${routing.channel_avoid_bias}
                                .label=${'Avoid Bias'}
                                @value-changed=${(e) => this._updateRoutingConfig('channel_avoid_bias', e.detail.value)}
                                helper="Per-cell penalty in avoid channels (default: 3)">
                            </ha-selector>
                        </div>
                    </div>

                    <!-- Bundling & Crossing Internals -->
                    <div style="margin-bottom: 16px;">
                        <div style="font-weight: 500; margin-bottom: 8px;">
                            Bundling &amp; Crossing Internals
                            <span style="font-weight: 400; font-size: 12px; color: var(--secondary-text-color); margin-left: 8px;">
                                (Common tunables are in the Trace Bundling &amp; Crossings section above)
                            </span>
                        </div>
                        <div style="display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16px;">
                            <ha-selector
                                .hass=${this.hass}
                                .selector=${{ number: { min: 0, mode: 'box', unit_of_measurement: 'vb' } }}
                                .value=${routing.trunk_min_length}
                                .label=${'Min Trunk Length'}
                                @value-changed=${(e) => this._updateRoutingConfig('trunk_min_length', e.detail.value)}
                                helper="Straight run needed to become a joinable trunk (default: 60)">
                            </ha-selector>
                            <ha-selector
                                .hass=${this.hass}
                                .selector=${{ number: { min: 0, mode: 'box', unit_of_measurement: 'vb' } }}
                                .value=${routing.trunk_min_overlap}
                                .label=${'Min Overlap'}
                                @value-changed=${(e) => this._updateRoutingConfig('trunk_min_overlap', e.detail.value)}
                                helper="Shared travel needed for joining to be worthwhile (default: 60)">
                            </ha-selector>
                            <ha-selector
                                .hass=${this.hass}
                                .selector=${{ number: { min: 1, mode: 'box' } }}
                                .value=${routing.trunk_max_join_candidates}
                                .label=${'Max Join Candidates'}
                                @value-changed=${(e) => this._updateRoutingConfig('trunk_max_join_candidates', e.detail.value)}
                                helper="Trunks one line will consider chaining through (default: 2)">
                            </ha-selector>
                            <ha-selector
                                .hass=${this.hass}
                                .selector=${{ number: { min: 1, mode: 'box' } }}
                                .value=${routing.trunk_discovery_max_passes}
                                .label=${'Discovery Passes'}
                                @value-changed=${(e) => this._updateRoutingConfig('trunk_discovery_max_passes', e.detail.value)}
                                helper="Pre-render routing pass cap (default: 4)">
                            </ha-selector>
                            <ha-selector
                                .hass=${this.hass}
                                .selector=${{ number: { min: 0, mode: 'box', unit_of_measurement: 'vb' } }}
                                .value=${routing.crossing_min_length}
                                .label=${'Min Crossing Length'}
                                @value-changed=${(e) => this._updateRoutingConfig('crossing_min_length', e.detail.value)}
                                helper="Shortest segment others still avoid crossing (default: 12)">
                            </ha-selector>
                        </div>
                    </div>

                    <!-- Cost Function Weights -->
                    <div>
                        <div style="font-weight: 500; margin-bottom: 8px;">Cost Function Weights</div>
                        <div style="display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16px;">
                            <ha-selector
                                .hass=${this.hass}
                                .selector=${{ number: { min: 0, mode: 'box' } }}
                                .value=${routing.cost_defaults?.bend}
                                .label=${'Bend Cost'}
                                @value-changed=${(e) => this._updateRoutingCostDefaults('bend', e.detail.value)}
                                helper="Cost per bend (default: 10)">
                            </ha-selector>
                            <ha-selector
                                .hass=${this.hass}
                                .selector=${{ number: { min: 0, mode: 'box' } }}
                                .value=${routing.cost_defaults?.proximity}
                                .label=${'Proximity Cost'}
                                @value-changed=${(e) => this._updateRoutingCostDefaults('proximity', e.detail.value)}
                                helper="Cost for obstacle proximity (default: 4)">
                            </ha-selector>
                            <ha-selector
                                .hass=${this.hass}
                                .selector=${{ number: { min: 0, step: 0.5, mode: 'box' } }}
                                .value=${routing.route_hint_penalty}
                                .label=${'Hint Penalty'}
                                @value-changed=${(e) => this._updateRoutingConfig('route_hint_penalty', e.detail.value)}
                                helper="Cost for ignoring route_hint (default: 6)">
                            </ha-selector>
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
                flex-wrap: wrap;
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
                <div style="flex: 1; min-width: 140px;">
                    <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px; flex-wrap: wrap;">
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
                        <!-- Discoverable Badge — only shown when explicitly scoped off,
                             matching the boolean field's own "off = exception" framing
                             (default true stays quiet, same as the other badges only
                             ever showing the channel's actual configured value). -->
                        ${channel.discoverable === false ? html`
                            <span
                                title="Only lines that explicitly list this channel in route_channels can use it"
                                style="
                                    display: inline-flex;
                                    align-items: center;
                                    padding: 2px 8px;
                                    border-radius: 12px;
                                    background: var(--secondary-text-color);
                                    color: var(--primary-background-color);
                                    font-size: 10px;
                                    font-weight: 600;
                                    white-space: nowrap;
                                ">Scoped</span>
                        ` : ''}
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
                @closed=${(e) => { e.stopPropagation(); this._closeChannelForm(); }}
                .headerTitle=${isNew ? 'Add Routing Channel' : `Edit Channel: ${channelId}`}
                style="--ha-dialog-width-md: 640px;">

                <div style="padding: 8px 16px;">
                    <ha-input
                        label="Channel ID"
                        .value=${data.id}
                        ?disabled=${!isNew}
                        @input=${(e) => this._updateChannelFormField('id', e.target.value)}
                        placeholder="power_corridor"
                        hint=${isNew ? 'Unique identifier (e.g., power_corridor)' : ''}
                        style="width: 100%; margin-bottom: 16px;">
                    </ha-input>

                    <!-- Full width: the 4-input bounds row needs more room than a
                         two-column layout can spare without forcing it to scroll. -->
                    <lcards-form-section
                        header="Channel Bounds"
                        description="Rectangle this channel covers, in viewBox units (x, y, w, h)"
                        icon="mdi:vector-rectangle"
                        ?expanded=${true}
                        style="margin-bottom: 16px;">
                        <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px 16px;">
                            <ha-input
                                type="number"
                                .value=${String(data.bounds[0])}
                                @input=${(e) => this._updateChannelBounds(0, Number(e.target.value))}
                                label="X">
                            </ha-input>
                            <ha-input
                                type="number"
                                .value=${String(data.bounds[1])}
                                @input=${(e) => this._updateChannelBounds(1, Number(e.target.value))}
                                label="Y">
                            </ha-input>
                            <ha-input
                                type="number"
                                .value=${String(data.bounds[2])}
                                @input=${(e) => this._updateChannelBounds(2, Number(e.target.value))}
                                label="W">
                            </ha-input>
                            <ha-input
                                type="number"
                                .value=${String(data.bounds[3])}
                                @input=${(e) => this._updateChannelBounds(3, Number(e.target.value))}
                                label="H">
                            </ha-input>
                        </div>
                    </lcards-form-section>

                    <!-- Two-column layout for the remaining, single-field settings -->
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px 20px;">

                        <!-- Left Column -->
                        <div style="display: flex; flex-direction: column; gap: 16px;">
                            <ha-selector
                                .hass=${this.hass}
                                .label=${'Channel Mode'}
                                .helper=${'How lines interact with this channel'}
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

                            <ha-selector
                                .hass=${this.hass}
                                .label=${'Flow Direction'}
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

                        <!-- Right Column -->
                        <div style="display: flex; flex-direction: column; gap: 16px;">
                            <ha-selector
                                .hass=${this.hass}
                                .label=${'Channel Weight (0-1)'}
                                .helper=${'Influence strength (higher = stronger)'}
                                .selector=${{ number: { min: 0, max: 1, step: 0.1, mode: 'slider' } }}
                                .value=${data.weight || 0.5}
                                @value-changed=${(e) => this._updateChannelFormField('weight', e.detail.value)}>
                            </ha-selector>

                            <ha-selector
                                .hass=${this.hass}
                                .label=${'Line Spacing (vb units)'}
                                .helper=${'Gap between bundled lines (typical: 5-20). Also sets how rounded their lane-separation corners can get, independent of corner_radius.'}
                                .selector=${{ number: { min: 0, max: 100, step: 1, mode: 'slider' } }}
                                .value=${data.line_spacing ?? 8}
                                @value-changed=${(e) => this._updateChannelFormField('line_spacing', e.detail.value)}>
                            </ha-selector>
                        </div>
                    </div>

                    <ha-selector
                        style="margin-top: 16px; display: block;"
                        .hass=${this.hass}
                        .label=${'Discoverable by nearby lines'}
                        .helper=${'When off, only lines that explicitly list this channel in route_channels can ever use it — a nearby line that does NOT reference it will never spontaneously bundle into it, even if it routes close and parallel.'}
                        .selector=${{ boolean: {} }}
                        .value=${data.discoverable !== false}
                        @value-changed=${(e) => this._updateChannelFormField('discoverable', e.detail.value)}>
                    </ha-selector>

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
                <div slot="footer">
                    <ha-button @click=${this._closeChannelForm} appearance="plain">
                        <ha-icon icon="mdi:close" slot="start"></ha-icon>
                        Cancel
                    </ha-button>
                    <ha-button @click=${this._saveChannel}>
                        <ha-icon icon="mdi:content-save" slot="start"></ha-icon>
                        ${isNew ? 'Add' : 'Save'}
                    </ha-button>
                </div>
            </ha-dialog>
        `;
    }

    // ============================
    // Channels Tab Methods
    // ============================

    /**
     * Open channel form for creating new channel
     * @private
     */
    _openChannelForm() {
        this._editingChannelId = '';
        // @ts-ignore - TS2739: auto-suppressed
        this._channelFormData = {
            id: '',
            mode: 'prefer',
            direction: 'auto',
            bounds: [0, 0, 100, 50],
            weight: 0.5,
            line_spacing: 8,
            discoverable: true
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
        // @ts-ignore - TS2739: auto-suppressed
        this._channelFormData = {
            id,
            mode: mode || 'prefer',
            direction: channel.direction || 'auto',
            bounds: [...(channel.bounds || [0, 0, 100, 50])],
            weight: channel.weight || 0.5,
            line_spacing: channel.line_spacing ?? 8,
            // Matches RouterCore._normalizeChannels's own `c.discoverable !== false`
            // — only an explicit false opts a channel out of spontaneous discovery.
            discoverable: channel.discoverable !== false
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
            line_spacing: this._channelFormData.line_spacing ?? 8,
            discoverable: this._channelFormData.discoverable !== false
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

        for (const overlay of overlays) {
            if (overlay.type === 'line' && lineIds.includes(overlay.id)) {
                // Add channel to route_channels array. That's ALL a line needs:
                // the channel's own config defines its mode/behavior (the old
                // per-line route_channel_mode and channel_shaping_* keys were
                // dead config — nothing in RouterCore has read them since the
                // A* cost-bias rewrite), and route: auto already does full
                // pathfinding unconditionally, so route_channels just needs
                // to be present for the line to consider the channel.
                if (!overlay.route_channels) {
                    overlay.route_channels = [];
                }
                if (!overlay.route_channels.includes(channelId)) {
                    overlay.route_channels.push(channelId);
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
            `Successfully configured ${updatedCount} line(s) to route through channel "${channelId}" (${mode} mode is set on the channel itself).`,
            'success'
        );

        this._schedulePreviewUpdate();
        this.requestUpdate();
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
     * Render Debug tab.
     * @returns {TemplateResult}
     * @private
     */
    // ============================
    // Lines Tab Methods
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
            entity: '',
            state_attribute: '',
            ranges_attribute: '',
            anchor: '',
            attach_to: '',
            anchor_side: 'center',
            attach_side: 'center',
            anchor_gap: 0,
            attach_gap: 0,
            route: 'auto',
            z_index: null,
            // Advanced routing parameters (with defaults)
            clearance: undefined, // Will use MSD default
            stub_length: undefined, // Will use the router's own auto/forced resolution
            corner_style: 'round',
            corner_radius: 34,
            corner_radius_mode: 'auto',
            corner_room_weight: undefined, // Will use the card-wide routing.corner_room_weight default
            corner_angle: 45,
            smoothing_mode: 'none',
            smoothing_iterations: 0,
            // Channel routing
            route_channels: [],
            channel_mode: 'prefer',
            // Animation - handled via animations array
            style: {
                // Always a state-color object (lcards-color-section-v2's shape) even with
                // no entity bound — resolveStateColor() just falls through to 'default'
                // when there's nothing to match against, so this needs no separate toggle.
                color: { default: 'var(--lcars-orange)' },
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
        // style.color may be a legacy plain string (pre-dating state-color support) —
        // normalize to the state-color object shape lcards-color-section-v2 expects.
        const rawColor = line.style?.color ?? line.style?.stroke;
        const normalizedColor = (typeof rawColor === 'object' && rawColor !== null)
            ? rawColor
            : { default: rawColor || 'var(--lcars-orange)' };

        this._lineFormData = {
            id: line.id,
            entity: line.entity || '',
            state_attribute: line.state_attribute || '',
            ranges_attribute: line.ranges_attribute || '',
            anchor: line.anchor || '',
            attach_to: line.attach_to || '',
            anchor_side: line.anchor_side || 'center',
            attach_side: line.attach_side || 'center',
            anchor_gap: line.anchor_gap || 0,
            attach_gap: line.attach_gap || 0,
            route: line.route || 'auto',
            z_index: line.z_index ?? null,
            // Advanced routing parameters
            clearance: line.clearance,
            stub_length: line.stub_length,
            route_hint: line.route_hint,
            route_hint_last: line.route_hint_last,
            waypoints: line.waypoints || [],
            corner_style: line.corner_style || 'round',
            corner_radius: line.corner_radius ?? 34,
            corner_radius_mode: line.corner_radius_mode || 'auto',
            corner_room_weight: line.corner_room_weight,
            corner_angle: line.corner_angle ?? 45,
            smoothing_mode: line.smoothing_mode || 'none',
            smoothing_iterations: line.smoothing_iterations || 0,
            // Channel routing
            route_channels: line.route_channels || [],
            // Animations
            animations: line.animations || [],
            // Style (load with backward compatibility for old property names)
            style: {
                color: normalizedColor,
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
     * Duplicate line: clone it with a fresh unique ID and open it for editing.
     * @param {Object} line - Line to duplicate
     * @private
     */
    _duplicateLine(line) {
        const overlays = this._workingConfig.msd?.overlays || [];
        let lineNum = overlays.filter(o => o.type === 'line').length + 1;
        let newId = `line_${lineNum}`;
        while (overlays.find(o => o.id === newId)) {
            lineNum++;
            newId = `line_${lineNum}`;
        }

        const cloned = { ...JSON.parse(JSON.stringify(line)), id: newId };
        this._setNestedValue('msd.overlays', [...overlays, cloned]);
        this._editLine(cloned);
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

        if (this._lineFormData.z_index != null) {
            lineOverlay.z_index = this._lineFormData.z_index;
        }

        if (this._lineFormData.entity) {
            lineOverlay.entity = this._lineFormData.entity;
        }
        if (this._lineFormData.state_attribute) {
            lineOverlay.state_attribute = this._lineFormData.state_attribute;
        }
        if (this._lineFormData.ranges_attribute) {
            lineOverlay.ranges_attribute = this._lineFormData.ranges_attribute;
        }

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
        if (this._lineFormData.stub_length != null) {
            lineOverlay.stub_length = this._lineFormData.stub_length;
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
        if (this._lineFormData.corner_style && this._lineFormData.corner_style !== 'round') {
            lineOverlay.corner_style = this._lineFormData.corner_style;
        }
        if (this._lineFormData.corner_radius != null && this._lineFormData.corner_radius !== 34) {
            lineOverlay.corner_radius = this._lineFormData.corner_radius;
        }
        if (this._lineFormData.corner_radius_mode === 'forced') {
            lineOverlay.corner_radius_mode = this._lineFormData.corner_radius_mode;
        }
        if (this._lineFormData.corner_room_weight != null) {
            lineOverlay.corner_room_weight = this._lineFormData.corner_room_weight;
        }
        if (this._lineFormData.corner_style === 'bevel' && this._lineFormData.corner_angle != null && this._lineFormData.corner_angle !== 45) {
            lineOverlay.corner_angle = this._lineFormData.corner_angle;
        }
        if (this._lineFormData.smoothing_mode && this._lineFormData.smoothing_mode !== 'none') {
            lineOverlay.smoothing_mode = this._lineFormData.smoothing_mode;
        }
        if (this._lineFormData.smoothing_iterations != null && this._lineFormData.smoothing_iterations !== 0) {
            lineOverlay.smoothing_iterations = this._lineFormData.smoothing_iterations;
        }

        // Channel routing — route_channels is the only per-line channel key;
        // behavior (prefer/avoid/force) is defined on the channel itself
        // (the old per-line route_channel_mode was removed from RouterCore).
        if (this._lineFormData.route_channels && this._lineFormData.route_channels.length > 0) {
            lineOverlay.route_channels = this._lineFormData.route_channels;
        }

        // Add style if present (using canonical property names)
        if (this._lineFormData.style && Object.keys(this._lineFormData.style).length > 0) {
            const style = {};

            // Core stroke properties (always save if present)
            if (this._lineFormData.style.color != null) {
                const c = this._lineFormData.style.color;
                // Simplify {default: X} with nothing else configured back to a plain
                // string — keeps saved YAML clean for the common non-state-color case.
                const keys = (typeof c === 'object' && c !== null) ? Object.keys(c) : null;
                style.color = (keys && keys.length === 1 && keys[0] === 'default') ? c.default : c;
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

        // Look up the entry by the stable editing id (immune to in-progress ID renames),
        // not the mutable form field — otherwise renaming while editing creates a duplicate
        // instead of updating the original (see _saveAnchor for the equivalent correct pattern).
        // Preserve _editorSelected flag if it exists
        const existingIndex = this._editingLineId
            ? this._workingConfig.msd.overlays.findIndex(o => o.id === this._editingLineId)
            : -1;
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
     * Handle shape form subtab change
     * @param {CustomEvent} event
     * @private
     */
    _handleShapeFormTabChange(event) {
        event.stopPropagation();
        // @ts-ignore - TS2339: auto-suppressed
        const tabId = event.target.activeTab?.getAttribute('value');
        if (tabId) {
            this._shapeFormActiveSubtab = tabId;
            this.requestUpdate();
        }
    }

    /**
     * Route to appropriate shape form subtab content
     * @returns {TemplateResult}
     * @private
     */
    _renderShapeFormTabContent() {
        switch (this._shapeFormActiveSubtab) {
            case 'geometry':
                return this._renderShapeFormGeometry();
            case 'style':
                return this._renderShapeFormStyle();
            case 'animation':
                return this._renderShapeFormAnimation();
            default:
                return this._renderShapeFormGeometry();
        }
    }

    /**
     * Render shape form animation subtab — mirrors _renderLineFormAnimation
     * exactly, against _shapeFormData.animations.
     * @returns {TemplateResult}
     * @private
     */
    _renderShapeFormAnimation() {
        // Scope target discovery to this shape's own rendered
        // [data-overlay-id="..."] group — otherwise the picker harvests every
        // id/class in the whole card (base_svg, every other overlay, etc.),
        // most of which will never actually resolve for an animation
        // registered against this overlay. Attribute selector (not #id) since
        // overlay ids are user-editable text and needn't be valid CSS
        // identifiers (e.g. could start with a digit) — this is also the
        // exact selector the render pipeline itself uses to find overlay
        // roots (PipelineCore/AdvancedRenderer). Falls back to whole-card
        // discovery if the id isn't in the live preview yet (e.g. a
        // brand-new shape that hasn't been saved once).
        const shapeId = this._editingShapeId || this._shapeFormData.id;
        return html`
            <div class="subform-field-stack">
                <lcards-form-section
                    header="Shape Animations"
                    description="Configure animations for this shape"
                    icon="mdi:animation"
                    ?expanded=${true}>

                    <lcards-animation-editor
                        .hass=${this.hass}
                        .animations=${this._shapeFormData.animations || []}
                        .cardElement=${this._getLivePreviewCardElement()}
                        .searchRootSelector=${shapeId ? `[data-overlay-id="${shapeId}"]` : ''}
                        @animations-changed=${(e) => {
                            this._shapeFormData.animations = e.detail.value;
                            this.requestUpdate();
                        }}
                        @refresh-targets=${() => this.requestUpdate()}
                    ></lcards-animation-editor>
                </lcards-form-section>
            </div>
        `;
    }

    /**
     * Render shape form geometry subtab: kind selector plus kind-conditional
     * fields (ordered points list + closed toggle for polyline; position+size,
     * same convention as controls, for rect/circle).
     * @returns {TemplateResult}
     * @private
     */
    _renderShapeFormGeometry() {
        const kind = this._shapeFormData.kind;

        return html`
            <div class="subform-field-stack">
                <lcards-form-section header="Shape Kind" icon="mdi:shape" ?expanded=${true}>
                    <ha-selector
                        .hass=${this.hass}
                        .selector=${{ select: { options: [
                            { value: 'polyline', label: 'Polyline / Path' },
                            { value: 'rect', label: 'Rectangle' },
                            { value: 'circle', label: 'Circle / Ellipse' }
                        ] } }}
                        .value=${kind}
                        .label=${'Kind'}
                        @value-changed=${(e) => {
                            const newKind = e.detail.value;
                            this._shapeFormData = { ...this._shapeFormData, kind: newKind };
                            if (newKind === 'polyline' && (!this._shapeFormData.points || this._shapeFormData.points.length < 2)) {
                                this._shapeFormData.points = [[100, 100], [200, 100]];
                            }
                            this.requestUpdate();
                        }}>
                    </ha-selector>
                </lcards-form-section>

                ${kind === 'polyline' ? html`
                    <lcards-form-section header="Points" description="Ordered vertex list, in viewBox units" icon="mdi:vector-point" ?expanded=${true}>
                        ${(this._shapeFormData.points || []).length > MAX_INLINE_EDITABLE_SHAPE_POINTS ? html`
                            <lcards-message type="info">
                                <strong>${(this._shapeFormData.points || []).length} points — too many to edit individually here.</strong>
                                <p style="margin: 8px 0; font-size: 13px;">
                                    Rendering one row per point (X/Y fields) for a shape this large freezes the
                                    browser. Drag points directly on the canvas, or edit the raw
                                    coordinates in the YAML tab instead.
                                </p>
                                <ha-button
                                    @click=${() => {
                                        this._closeShapeForm();
                                        this._activeTab = TABS.YAML;
                                        this.requestUpdate();
                                    }}>
                                    <ha-icon icon="mdi:code-braces" slot="start"></ha-icon>
                                    Edit in YAML
                                </ha-button>
                            </lcards-message>
                        ` : (this._shapeFormData.points || []).map((pt, i) => html`
                            <div style="display: flex; gap: 8px; align-items: center; margin-top: 8px;">
                                <span style="width: 20px; font-size: 12px; color: var(--secondary-text-color);">${i + 1}</span>
                                <ha-selector
                                    .hass=${this.hass}
                                    .selector=${{ number: { mode: 'box' } }}
                                    .value=${Array.isArray(pt) ? pt[0] : 0}
                                    .label=${'X'}
                                    @value-changed=${(e) => {
                                        const points = [...this._shapeFormData.points];
                                        points[i] = [Number(e.detail.value), Array.isArray(pt) ? pt[1] : 0];
                                        this._shapeFormData = { ...this._shapeFormData, points };
                                        this.requestUpdate();
                                    }}
                                    style="flex: 1;">
                                </ha-selector>
                                <ha-selector
                                    .hass=${this.hass}
                                    .selector=${{ number: { mode: 'box' } }}
                                    .value=${Array.isArray(pt) ? pt[1] : 0}
                                    .label=${'Y'}
                                    @value-changed=${(e) => {
                                        const points = [...this._shapeFormData.points];
                                        points[i] = [Array.isArray(pt) ? pt[0] : 0, Number(e.detail.value)];
                                        this._shapeFormData = { ...this._shapeFormData, points };
                                        this.requestUpdate();
                                    }}
                                    style="flex: 1;">
                                </ha-selector>
                                <ha-icon-button
                                    @click=${() => {
                                        const points = this._shapeFormData.points.filter((_, idx) => idx !== i);
                                        this._shapeFormData = { ...this._shapeFormData, points };
                                        this.requestUpdate();
                                    }}
                                    ?disabled=${(this._shapeFormData.points || []).length <= 2}
                                    .label=${'Remove point'}
                                    .path=${'M19,13H5V11H19V13Z'}>
                                </ha-icon-button>
                            </div>
                        `)}
                        ${(this._shapeFormData.points || []).length > MAX_INLINE_EDITABLE_SHAPE_POINTS ? '' : html`
                        <ha-button
                            @click=${() => {
                                const points = [...(this._shapeFormData.points || [])];
                                const last = points[points.length - 1] || [100, 100];
                                points.push([Array.isArray(last) ? last[0] + 50 : 150, Array.isArray(last) ? last[1] : 100]);
                                this._shapeFormData = { ...this._shapeFormData, points };
                                this.requestUpdate();
                            }}
                            style="margin-top: 12px;">
                            <ha-icon icon="mdi:plus" slot="start"></ha-icon>
                            Add Point
                        </ha-button>
                        `}

                        <ha-selector
                            style="margin-top: 16px; display: block;"
                            .hass=${this.hass}
                            .label=${'Closed (connect back to first point, allows fill)'}
                            .selector=${{ boolean: {} }}
                            .value=${!!this._shapeFormData.closed}
                            @value-changed=${(e) => {
                                this._shapeFormData = { ...this._shapeFormData, closed: e.detail.value };
                                this.requestUpdate();
                            }}>
                        </ha-selector>
                    </lcards-form-section>
                ` : html`
                    <lcards-form-section header="Position &amp; Size" icon="mdi:arrow-expand-all" ?expanded=${true}>
                        <div class="subform-columns-2">
                            <ha-selector
                                .hass=${this.hass}
                                .selector=${{ number: { mode: 'box' } }}
                                .value=${(this._shapeFormData.position || [0, 0])[0]}
                                .label=${'X'}
                                @value-changed=${(e) => {
                                    const position = [...(this._shapeFormData.position || [0, 0])];
                                    position[0] = Number(e.detail.value);
                                    this._shapeFormData = { ...this._shapeFormData, position };
                                    this.requestUpdate();
                                }}>
                            </ha-selector>
                            <ha-selector
                                .hass=${this.hass}
                                .selector=${{ number: { mode: 'box' } }}
                                .value=${(this._shapeFormData.position || [0, 0])[1]}
                                .label=${'Y'}
                                @value-changed=${(e) => {
                                    const position = [...(this._shapeFormData.position || [0, 0])];
                                    position[1] = Number(e.detail.value);
                                    this._shapeFormData = { ...this._shapeFormData, position };
                                    this.requestUpdate();
                                }}>
                            </ha-selector>
                            <ha-selector
                                .hass=${this.hass}
                                .selector=${{ number: { mode: 'box', min: 1 } }}
                                .value=${(this._shapeFormData.size || [100, 60])[0]}
                                .label=${'Width'}
                                @value-changed=${(e) => {
                                    const size = [...(this._shapeFormData.size || [100, 60])];
                                    size[0] = Number(e.detail.value);
                                    this._shapeFormData = { ...this._shapeFormData, size };
                                    this.requestUpdate();
                                }}>
                            </ha-selector>
                            <ha-selector
                                .hass=${this.hass}
                                .selector=${{ number: { mode: 'box', min: 1 } }}
                                .value=${(this._shapeFormData.size || [100, 60])[1]}
                                .label=${'Height'}
                                @value-changed=${(e) => {
                                    const size = [...(this._shapeFormData.size || [100, 60])];
                                    size[1] = Number(e.detail.value);
                                    this._shapeFormData = { ...this._shapeFormData, size };
                                    this.requestUpdate();
                                }}>
                            </ha-selector>
                        </div>
                        <div style="margin-top: 8px; font-size: 12px; color: var(--secondary-text-color);">
                            Corner rounding, smoothing, and stroke details are on the Style tab.
                        </div>
                    </lcards-form-section>
                `}

                <lcards-form-section
                    header="Stacking Order"
                    description="Control paint order relative to other lines and controls"
                    icon="mdi:layers-outline"
                    secondary=${this._shapeFormData.z_index != null ? `Z-Index: ${this._shapeFormData.z_index} (custom)` : 'Z-Index: 50 (default)'}
                    ?expanded=${this._shapeFormData.z_index != null}>
                    <ha-input
                        type="number"
                        label="Z-Index"
                        .value=${this._shapeFormData.z_index != null ? String(this._shapeFormData.z_index) : ''}
                        @input=${(e) => {
                            const raw = e.target.value;
                            this._shapeFormData.z_index = raw === '' ? null : Number(raw);
                            this.requestUpdate();
                        }}
                        hint="Higher values paint on top. Leave blank to use the default (50 — shapes paint under lines and controls).">
                    </ha-input>
                </lcards-form-section>
            </div>
        `;
    }

    /**
     * Adapter exposing _shapeFormData through the generic editor interface
     * lcards-color-section-v2 expects — mirrors _getLineColorEditorAdapter exactly.
     * @returns {Object}
     * @private
     */
    _getShapeColorEditorAdapter() {
        const dialog = this;
        return {
            hass: this.hass,
            config: this._shapeFormData,
            _getConfigValue(path) {
                return path.split('.').reduce((obj, key) => obj?.[key], dialog._shapeFormData);
            },
            _setConfigValue(path, value) {
                const keys = path.split('.');
                const lastKey = keys.pop();
                let target = dialog._shapeFormData;
                for (const key of keys) {
                    if (!target[key] || typeof target[key] !== 'object') target[key] = {};
                    target = target[key];
                }
                target[lastKey] = value;
                dialog.requestUpdate();
            }
        };
    }

    /**
     * Render the shape's color config: entity + state_attribute + ranges_attribute
     * plus the state-color editor — mirrors _renderLineColorSection exactly,
     * against _shapeFormData instead of _lineFormData.
     * @returns {TemplateResult}
     * @private
     */
    /**
     * Render the entity/state_attribute/ranges_attribute pickers — shared by
     * BOTH the Color and Fill sections below, since an overlay has exactly one
     * entity binding (ShapeOverlay._resolveShapeColor reads overlay.entity for
     * both style.color and style.fill resolution). Previously this lived
     * *inside* the Color section only, with Fill just carrying a description
     * note pointing back at it — easy to miss, and state-bound fill silently
     * resolved to nothing if a user reasonably assumed Fill had (or needed)
     * its own entity picker and never set one. Pulling it out into its own
     * section, positioned between them, makes the shared binding unmissable.
     * @returns {TemplateResult}
     * @private
     */
    _renderShapeEntityBindingSection() {
        const entityId = this._shapeFormData.entity || '';
        const attrOptions = entityId && this.hass?.states?.[entityId]
            ? Object.keys(this.hass.states[entityId].attributes || {}).sort().map(attr => ({ value: attr, label: attr }))
            : [];
        const rangesAttrOptions = [...attrOptions];
        const brightnessIdx = rangesAttrOptions.findIndex(o => o.value === 'brightness');
        if (brightnessIdx >= 0) {
            rangesAttrOptions.splice(brightnessIdx + 1, 0, { value: 'brightness_pct', label: 'brightness_pct  (auto 0–100%)' });
        }

        return html`
            <ha-selector
                .hass=${this.hass}
                .selector=${{ entity: {} }}
                .value=${entityId}
                .label=${'Entity'}
                .helper=${"Bind this shape's color and/or fill to an entity's state (optional) — leave blank for fixed colors"}
                @value-changed=${(e) => {
                    this._shapeFormData.entity = e.detail.value || '';
                    this.requestUpdate();
                }}
                style="display: block; margin-bottom: 12px;">
            </ha-selector>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
                <ha-selector
                    .hass=${this.hass}
                    .label=${'State Attribute'}
                    .helper=${'Match this attribute\'s value instead of raw entity state'}
                    .disabled=${!entityId}
                    .selector=${{ select: { mode: 'dropdown', options: [{ value: '__none__', label: '— Use entity state' }, ...attrOptions], custom_value: true } }}
                    .value=${this._shapeFormData.state_attribute || '__none__'}
                    @value-changed=${(e) => {
                        const v = (e.detail.value ?? '').trim();
                        this._shapeFormData.state_attribute = (v === '__none__' || !v) ? '' : v;
                        this.requestUpdate();
                    }}>
                </ha-selector>
                <ha-selector
                    .hass=${this.hass}
                    .label=${'Range Attribute'}
                    .helper=${'Attribute compared against above:/below:/between: keys'}
                    .disabled=${!entityId}
                    .selector=${{ select: { mode: 'dropdown', options: [{ value: '__none__', label: '— Use entity state' }, ...rangesAttrOptions], custom_value: true } }}
                    .value=${this._shapeFormData.ranges_attribute || '__none__'}
                    @value-changed=${(e) => {
                        let v = (e.detail.value ?? '').trim();
                        if (v === 'brightness') v = 'brightness_pct';
                        this._shapeFormData.ranges_attribute = (v === '__none__' || !v) ? '' : v;
                        this.requestUpdate();
                    }}>
                </ha-selector>
            </div>
        `;
    }

    /**
     * Render shape form style subtab: mirrors _renderLineFormStyle's widget
     * vocabulary (color picker, width/opacity sliders, dash-pattern preset
     * dropdown) plus a Fill section (meaningful for closed shapes). Marker/
     * line_cap fields are hidden for rect/circle (meaningless — no path vertices).
     * @returns {TemplateResult}
     * @private
     */
    _renderShapeFormStyle() {
        const kind = this._shapeFormData.kind;
        /** @type {Object<string, any>} */
        const style = this._shapeFormData.style || {};
        const dashArray = style.dash_array || '';
        let dashPreset = 'solid';
        if (dashArray === '5,5') dashPreset = 'dashed';
        else if (dashArray === '2,2') dashPreset = 'dotted';
        else if (dashArray === '8,4,2,4') dashPreset = 'dash-dot';
        else if (dashArray) dashPreset = 'custom';

        return html`
            <div class="subform-field-stack">
                <!-- Line Style | Shape, side by side -->
                <div class="subform-columns-2">
                    <lcards-form-section header="Line Style" description="Width, opacity and dash pattern" icon="mdi:ruler" ?expanded=${true}>
                        <ha-selector
                            .hass=${this.hass}
                            .selector=${{ number: { min: 0, max: 30, step: 0.5, mode: 'slider' } }}
                            .value=${style.width ?? 2}
                            .label=${'Width'}
                            @value-changed=${(e) => {
                                this._shapeFormData.style = { ...this._shapeFormData.style, width: e.detail.value };
                                this.requestUpdate();
                            }}
                            style="margin-top: 12px;">
                        </ha-selector>

                        <ha-selector
                            .hass=${this.hass}
                            .selector=${{ number: { min: 0, max: 1, step: 0.01, mode: 'slider' } }}
                            .value=${style.opacity ?? 1}
                            .label=${'Opacity'}
                            @value-changed=${(e) => {
                                this._shapeFormData.style = { ...this._shapeFormData.style, opacity: e.detail.value };
                                this.requestUpdate();
                            }}
                            style="margin-top: 12px;">
                        </ha-selector>

                        <ha-selector
                            .hass=${this.hass}
                            .selector=${{ select: { options: [
                                { value: 'solid', label: 'Solid' },
                                { value: 'dashed', label: 'Dashed' },
                                { value: 'dotted', label: 'Dotted' },
                                { value: 'dash-dot', label: 'Dash-Dot' },
                                { value: 'custom', label: 'Custom' }
                            ] } }}
                            .value=${dashPreset}
                            .label=${'Pattern'}
                            @value-changed=${(e) => {
                                const preset = e.detail.value;
                                let newDashArray = dashArray;
                                if (preset === 'dashed') newDashArray = '5,5';
                                else if (preset === 'dotted') newDashArray = '2,2';
                                else if (preset === 'dash-dot') newDashArray = '8,4,2,4';
                                else if (preset === 'solid') newDashArray = '';
                                if (preset !== 'custom') {
                                    this._shapeFormData.style = { ...this._shapeFormData.style, dash_array: newDashArray };
                                    this.requestUpdate();
                                }
                            }}
                            style="margin-top: 12px;">
                        </ha-selector>

                        <!-- Dash Pattern Customization (conditional - all non-solid presets) -->
                        ${dashPreset !== 'solid' ? html`
                            <lcards-form-section
                                header="${dashPreset === 'custom' ? 'Custom' : 'Customize'} Dash Pattern"
                                icon="mdi:dots-horizontal"
                                ?nested=${true}
                                ?expanded=${true}>

                                ${(() => {
                                    const parts = (dashArray || '').split(',').map(p => parseFloat(p.trim()) || 0);
                                    const dash1 = parts[0] || 5;
                                    const gap1 = parts[1] || 5;
                                    const dash2 = parts[2] || 0;
                                    const gap2 = parts[3] || 0;

                                    return html`
                                        <ha-selector
                                            .hass=${this.hass}
                                            .selector=${{ number: { min: 0, max: 50, step: 1, mode: 'slider' } }}
                                            .value=${dash1}
                                            .label=${'Dash Length'}
                                            @value-changed=${(e) => {
                                                const newDash1 = e.detail.value;
                                                const pattern = dash2 > 0 ? `${newDash1},${gap1},${dash2},${gap2}` : `${newDash1},${gap1}`;
                                                this._shapeFormData.style = { ...this._shapeFormData.style, dash_array: pattern };
                                                this.requestUpdate();
                                            }}>
                                        </ha-selector>

                                        <ha-selector
                                            .hass=${this.hass}
                                            .selector=${{ number: { min: 0, max: 50, step: 1, mode: 'slider' } }}
                                            .value=${gap1}
                                            .label=${'Gap Length'}
                                            @value-changed=${(e) => {
                                                const newGap1 = e.detail.value;
                                                const pattern = dash2 > 0 ? `${dash1},${newGap1},${dash2},${gap2}` : `${dash1},${newGap1}`;
                                                this._shapeFormData.style = { ...this._shapeFormData.style, dash_array: pattern };
                                                this.requestUpdate();
                                            }}
                                            style="margin-top: 12px;">
                                        </ha-selector>

                                        <ha-selector
                                            style="margin-top: 12px; display: block;"
                                            .hass=${this.hass}
                                            .label=${'Add secondary dash/gap'}
                                            .selector=${{ boolean: {} }}
                                            .value=${dash2 > 0}
                                            @value-changed=${(e) => {
                                                const pattern = e.detail.value ? `${dash1},${gap1},2,2` : `${dash1},${gap1}`;
                                                this._shapeFormData.style = { ...this._shapeFormData.style, dash_array: pattern };
                                                this.requestUpdate();
                                            }}>
                                        </ha-selector>

                                        ${dash2 > 0 ? html`
                                            <ha-selector
                                                .hass=${this.hass}
                                                .selector=${{ number: { min: 0, max: 50, step: 1, mode: 'slider' } }}
                                                .value=${dash2}
                                                .label=${'Secondary Dash'}
                                                @value-changed=${(e) => {
                                                    const pattern = `${dash1},${gap1},${e.detail.value},${gap2}`;
                                                    this._shapeFormData.style = { ...this._shapeFormData.style, dash_array: pattern };
                                                    this.requestUpdate();
                                                }}
                                                style="margin-top: 12px;">
                                            </ha-selector>

                                            <ha-selector
                                                .hass=${this.hass}
                                                .selector=${{ number: { min: 0, max: 50, step: 1, mode: 'slider' } }}
                                                .value=${gap2}
                                                .label=${'Secondary Gap'}
                                                @value-changed=${(e) => {
                                                    const pattern = `${dash1},${gap1},${dash2},${e.detail.value}`;
                                                    this._shapeFormData.style = { ...this._shapeFormData.style, dash_array: pattern };
                                                    this.requestUpdate();
                                                }}
                                                style="margin-top: 12px;">
                                            </ha-selector>
                                        ` : ''}

                                        <div style="margin-top: 12px; font-size: 12px; color: var(--secondary-text-color); font-family: monospace;">
                                            Pattern: ${dash2 > 0 ? `${dash1},${gap1},${dash2},${gap2}` : `${dash1},${gap1}`}
                                        </div>
                                    `;
                                })()}
                            </lcards-form-section>
                        ` : ''}
                    </lcards-form-section>

                    <lcards-form-section header="Shape" description="Corner and smoothing settings" icon="mdi:vector-curve" ?expanded=${true}>
                        ${kind === 'polyline' ? html`
                            <ha-selector
                                .hass=${this.hass}
                                .selector=${{ select: { options: [
                                    { value: 'miter', label: 'Miter (Sharp)' },
                                    { value: 'round', label: 'Round (Arc)' },
                                    { value: 'bevel', label: 'Bevel (Cut)' }
                                ] } }}
                                .value=${this._shapeFormData.corner_style || 'round'}
                                .label=${'Corner Style'}
                                @value-changed=${(e) => {
                                    this._shapeFormData = { ...this._shapeFormData, corner_style: e.detail.value };
                                    this.requestUpdate();
                                }}>
                            </ha-selector>
                        ` : html`
                            <div style="font-size: 13px; color: var(--secondary-text-color); margin-bottom: 8px;">
                                ${kind === 'rect' ? 'Rectangle corners: sharp or rounded.' : 'Corner settings not applicable to circle/ellipse.'}
                            </div>
                            ${kind === 'rect' ? html`
                                <ha-selector
                                    style="display: block; margin-bottom: 12px;"
                                    .hass=${this.hass}
                                    .label=${'Rounded Corners'}
                                    .selector=${{ boolean: {} }}
                                    .value=${this._shapeFormData.corner_style === 'round'}
                                    @value-changed=${(e) => {
                                        this._shapeFormData = { ...this._shapeFormData, corner_style: e.detail.value ? 'round' : 'miter' };
                                        this.requestUpdate();
                                    }}>
                                </ha-selector>
                            ` : ''}
                        `}

                        ${(this._shapeFormData.corner_style === 'round' && kind !== 'circle') ? html`
                            <ha-selector
                                .hass=${this.hass}
                                .selector=${{ number: { min: 0, max: 100, step: 1, mode: 'slider', unit_of_measurement: 'vb' } }}
                                .value=${this._shapeFormData.corner_radius ?? (kind === 'rect' ? 8 : 34)}
                                .label=${'Corner Radius'}
                                @value-changed=${(e) => {
                                    this._shapeFormData = { ...this._shapeFormData, corner_radius: e.detail.value };
                                    this.requestUpdate();
                                }}
                                style="margin-top: 12px;">
                            </ha-selector>
                        ` : ''}

                        ${(kind === 'polyline' && this._shapeFormData.corner_style === 'bevel') ? html`
                            <ha-selector
                                .hass=${this.hass}
                                .selector=${{ number: { min: 0, max: 100, step: 1, mode: 'slider', unit_of_measurement: 'vb' } }}
                                .value=${this._shapeFormData.corner_radius ?? 34}
                                .label=${'Cut Size'}
                                @value-changed=${(e) => {
                                    this._shapeFormData = { ...this._shapeFormData, corner_radius: e.detail.value };
                                    this.requestUpdate();
                                }}
                                style="margin-top: 12px;">
                            </ha-selector>
                            <ha-selector
                                .hass=${this.hass}
                                .selector=${{ number: { min: 0, max: 90, step: 1, mode: 'slider', unit_of_measurement: '°' } }}
                                .value=${this._shapeFormData.corner_angle ?? 45}
                                .label=${'Cut Angle'}
                                @value-changed=${(e) => {
                                    this._shapeFormData = { ...this._shapeFormData, corner_angle: e.detail.value };
                                    this.requestUpdate();
                                }}
                                style="margin-top: 12px;">
                            </ha-selector>
                        ` : ''}

                        ${kind === 'polyline' ? html`
                            <ha-selector
                                .hass=${this.hass}
                                .selector=${{ select: { options: [
                                    { value: 'none', label: 'None' },
                                    { value: 'chaikin', label: 'Chaikin (Corner-cutting)' }
                                ] } }}
                                .value=${this._shapeFormData.smoothing_mode || 'none'}
                                .label=${'Smoothing Mode'}
                                @value-changed=${(e) => {
                                    this._shapeFormData = { ...this._shapeFormData, smoothing_mode: e.detail.value };
                                    this.requestUpdate();
                                }}
                                style="margin-top: 12px;">
                            </ha-selector>

                            ${(this._shapeFormData.smoothing_mode === 'chaikin') ? html`
                                <ha-selector
                                    .hass=${this.hass}
                                    .selector=${{ number: { min: 0, max: 5, step: 1, mode: 'slider' } }}
                                    .value=${this._shapeFormData.smoothing_iterations || 0}
                                    .label=${'Smoothing Iterations'}
                                    @value-changed=${(e) => {
                                        this._shapeFormData = { ...this._shapeFormData, smoothing_iterations: e.detail.value };
                                        this.requestUpdate();
                                    }}
                                    style="margin-top: 12px;">
                                </ha-selector>
                            ` : ''}

                            <ha-selector
                                .hass=${this.hass}
                                .selector=${{ select: { options: [
                                    { value: 'butt', label: 'Butt (Flat)' },
                                    { value: 'round', label: 'Round' },
                                    { value: 'square', label: 'Square (Extended)' }
                                ] } }}
                                .value=${style.line_cap || 'butt'}
                                .label=${'Line Cap'}
                                @value-changed=${(e) => {
                                    this._shapeFormData.style = { ...this._shapeFormData.style, line_cap: e.detail.value };
                                    this.requestUpdate();
                                }}
                                style="margin-top: 12px;">
                            </ha-selector>

                            <ha-selector
                                .hass=${this.hass}
                                .selector=${{ select: { options: [
                                    { value: 'miter', label: 'Miter (Sharp)' },
                                    { value: 'round', label: 'Round' },
                                    { value: 'bevel', label: 'Bevel (Cut)' }
                                ] } }}
                                .value=${style.line_join || this._shapeFormData.corner_style || 'miter'}
                                .label=${'Line Join'}
                                @value-changed=${(e) => {
                                    this._shapeFormData.style = { ...this._shapeFormData.style, line_join: e.detail.value };
                                    this.requestUpdate();
                                }}
                                style="margin-top: 12px;">
                            </ha-selector>

                            ${(style.line_join === 'miter' || (!style.line_join && this._shapeFormData.corner_style === 'miter')) ? html`
                                <ha-selector
                                    .hass=${this.hass}
                                    .selector=${{ number: { min: 1, max: 20, step: 0.5, mode: 'slider' } }}
                                    .value=${style.miter_limit || 4}
                                    .label=${'Miter Limit'}
                                    @value-changed=${(e) => {
                                        this._shapeFormData.style = { ...this._shapeFormData.style, miter_limit: e.detail.value };
                                        this.requestUpdate();
                                    }}
                                    style="margin-top: 12px;">
                                </ha-selector>
                            ` : ''}
                        ` : ''}
                    </lcards-form-section>
                </div>

                <!-- Shared entity binding for both Color and Fill below -->
                <lcards-form-section header="Entity Binding" description="Optional — powers state-based color and/or fill below" icon="mdi:target" ?expanded=${true}>
                    ${this._renderShapeEntityBindingSection()}
                </lcards-form-section>

                <lcards-form-section header="Color" description="Stroke color — fixed, or state/range keys bound to the entity above" icon="mdi:palette" ?expanded=${true}>
                    <lcards-color-section-v2
                        .editor=${this._getShapeColorEditorAdapter()}
                        .config=${this._shapeFormData}
                        .entityId=${this._shapeFormData.entity || ''}
                        basePath="style.color"
                        header="Shape Color"
                        description="Fixed color, or add state/range keys to bind it to the entity above"
                        ?expanded=${true}>
                    </lcards-color-section-v2>
                </lcards-form-section>

                <lcards-form-section header="Fill" description="Only visible on closed shapes — fixed, or state/range keys bound to the same entity above" icon="mdi:format-color-fill" ?expanded=${true}>
                    <lcards-color-section-v2
                        .editor=${this._getShapeColorEditorAdapter()}
                        .config=${this._shapeFormData}
                        .entityId=${this._shapeFormData.entity || ''}
                        basePath="style.fill"
                        header="Fill Color"
                        description="Fixed color, or add state/range keys to bind it to the entity above"
                        ?expanded=${true}>
                    </lcards-color-section-v2>

                    <ha-selector
                        .hass=${this.hass}
                        .selector=${{ number: { min: 0, max: 1, step: 0.01, mode: 'slider' } }}
                        .value=${style.fill_opacity ?? 1}
                        .label=${'Fill Opacity'}
                        @value-changed=${(e) => {
                            this._shapeFormData.style = { ...this._shapeFormData.style, fill_opacity: e.detail.value };
                            this.requestUpdate();
                        }}
                        style="margin-top: 12px;">
                    </ha-selector>
                </lcards-form-section>
            </div>
        `;
    }

    /**
     * Render shape form dialog. Simpler than the Line form (2 subtabs, no live
     * preview panel) — appropriate for "simple designs and enhancements", not a
     * full-featured editor.
     * @returns {TemplateResult}
     * @private
     */
    _renderShapeFormDialog() {
        const isEditing = !!this._editingShapeId;
        const title = isEditing ? `Edit Shape: ${this._shapeFormData.id}` : 'Add Shape';

        return html`
            <ha-dialog
                class="subform-dialog"
                open
                @closed=${(e) => { e.stopPropagation(); this._closeShapeForm(); }}
                .headerTitle=${title}
                prevent-scrim-close>

                <div class="subform-layout">
                    <div class="subform-config">
                        <ha-tab-group @wa-tab-show=${this._handleShapeFormTabChange} class="subform-tabs">
                            <ha-tab-group-tab value="geometry" ?active=${this._shapeFormActiveSubtab === 'geometry'}>Geometry</ha-tab-group-tab>
                            <ha-tab-group-tab value="style" ?active=${this._shapeFormActiveSubtab === 'style'}>Style</ha-tab-group-tab>
                            <ha-tab-group-tab value="animation" ?active=${this._shapeFormActiveSubtab === 'animation'}>Animation</ha-tab-group-tab>
                        </ha-tab-group>

                        <div class="subform-tab-content">
                            ${this._renderShapeFormTabContent()}
                        </div>
                    </div>

                    <div class="subform-preview padded">
                        <div class="subform-preview-label">Live Preview</div>
                        ${this._renderShapeStylePreviewVertical()}
                    </div>
                </div>

                <div slot="footer">
                    <ha-button @click=${this._closeShapeForm} appearance="plain">
                        <ha-icon icon="mdi:close" slot="start"></ha-icon>
                        Cancel
                    </ha-button>
                    <ha-button @click=${() => this._saveShape()}>
                        <ha-icon icon="mdi:content-save" slot="start"></ha-icon>
                        Save
                    </ha-button>
                </div>
            </ha-dialog>
        `;
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
        // @ts-ignore - TS2345: auto-suppressed
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
        // @ts-ignore - TS2339: auto-suppressed
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
     * Normalize/validate an attachment point name into the side format the
     * runtime resolver expects.
     *
     * The point names this actually receives come from controlAttachmentPoints
     * / the shape corner grid in _renderAttachmentPointsOverlay ('top-left',
     * 'top', 'top-right', 'left', 'center', 'right', 'bottom-left', 'bottom',
     * 'bottom-right') or a shape's 'vertexN' — already exactly what
     * LineOverlay._resolveAttachTo needs. This used to map from a *different*,
     * longer-form convention ('top-center', 'middle-left', 'middle-right',
     * 'bottom-center') that no caller here has ever actually produced, so
     * every cardinal-side (non-corner) dot click silently saved 'center'
     * instead of the side actually clicked.
     * @param {string} point - Point name
     * @returns {string} - Side format (e.g., 'top-left', 'top', 'center', 'vertex2')
     * @private
     */
    _convertPointToSide(point) {
        const validSides = new Set([
            'top-left', 'top', 'top-right',
            'left', 'center', 'right',
            'bottom-left', 'bottom', 'bottom-right'
        ]);
        if (validSides.has(point) || /^vertex\d+$/.test(point || '')) {
            return point;
        }
        return 'center';
    }

    /**
     * Handle preview click in connect_line mode
     * @param {Event} e - Click event
     * @private
     */
    _handleConnectLineClick(e) {
        // Get clicked element info from event
        // @ts-ignore - TS2339: auto-suppressed
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
     * Clear connect line state and exit CONNECT_LINE mode. Both callers
     * (_handleAttachmentPointClick, _handleConnectLineClick) invoke this
     * right after opening the line form on a completed connection — unlike
     * every other draw-finish path (_finishDrawChannel, _finishPlaceControl,
     * etc.), this one never used to exit the mode, leaving _activeMode stuck
     * on CONNECT_LINE (and so _renderConnectLineHint's hint visible) even
     * after the form was saved/closed.
     * @private
     */
    _clearConnectLineState() {
        this._connectLineState = { source: null, tempLineElement: null };
        this._activeMode = MODES.VIEW;
        this.requestUpdate();
    }

    /**
     * Render line form dialog.
     * @returns {TemplateResult}
     * @private
     */
    _renderLineFormDialog() {
        const isEditing = !!this._editingLineId;
        const title = isEditing ? `Edit Line: ${this._lineFormData.id}` : 'Add Line';

        return html`
            <ha-dialog
                class="subform-dialog"
                open
                @closed=${(e) => { e.stopPropagation(); this._closeLineForm(); }}
                .headerTitle=${title}
                prevent-scrim-close>

                <!-- Split Layout: Content Left, Preview Right -->
                <div class="subform-layout">

                    <!-- Left Panel: Tabs and Content -->
                    <div class="subform-config">
                        <!-- Subtabs -->
                        <ha-tab-group @wa-tab-show=${this._handleLineFormTabChange} class="subform-tabs">
                            <ha-tab-group-tab value="basic" ?active=${this._lineFormActiveSubtab === 'basic'}>Basic</ha-tab-group-tab>
                            <ha-tab-group-tab value="style" ?active=${this._lineFormActiveSubtab === 'style'}>Style</ha-tab-group-tab>
                            <ha-tab-group-tab value="markers" ?active=${this._lineFormActiveSubtab === 'markers'}>Markers</ha-tab-group-tab>
                            <ha-tab-group-tab value="animation" ?active=${this._lineFormActiveSubtab === 'animation'}>Animation</ha-tab-group-tab>
                            <ha-tab-group-tab value="routing" ?active=${this._lineFormActiveSubtab === 'routing'}>Routing</ha-tab-group-tab>
                        </ha-tab-group>

                        <!-- Scrollable Content -->
                        <div class="subform-tab-content">
                            ${this._renderLineFormTabContent()}
                        </div>
                    </div>

                    <!-- Right Panel: Vertical Line Preview -->
                    <div class="subform-preview padded">
                        <div class="subform-preview-label">Live Preview</div>
                        ${this._renderLineStylePreviewVertical()}
                    </div>
                </div>

                <div slot="footer">
                    <ha-button @click=${this._closeLineForm} appearance="plain">
                        <ha-icon icon="mdi:close" slot="start"></ha-icon>
                        Cancel
                    </ha-button>
                    <ha-button @click=${() => this._saveLine()}>
                        <ha-icon icon="mdi:content-save" slot="start"></ha-icon>
                        Save
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
        const overlays = [...this._getControlOverlays(), ...this._getShapeOverlays()];

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
            label: `Overlay: ${o.id} (${o.type})`
        }));

        const allSourceOptions = [...userAnchorOptions, ...baseSvgAnchorOptions, ...overlayOptions];

        // Determine if anchor/attach_to are overlay IDs
        const anchorIsOverlay = this._isOverlayId(this._lineFormData.anchor);
        const attachToIsOverlay = this._isOverlayId(this._lineFormData.attach_to);

        // Get routing mode info
        const routingInfo = this._getRoutingModeInfo(this._lineFormData.route || 'auto');

        return html`
            <div class="subform-field-stack">
                <!-- Line ID -->
                <ha-input
                    label="Line ID"
                    .value=${this._lineFormData.id}
                    @input=${(e) => {
                        this._lineFormData.id = e.target.value;
                        this.requestUpdate();
                    }}
                    required
                    hint="Unique identifier for this line">
                </ha-input>

                <!-- Horizontal Source → Target Layout -->
                <div class="line-connection-flow">
                    <!-- Source Column -->
                    <lcards-form-section
                        header="Source (Anchor)"
                        description="Starting point for the line"
                        icon="mdi:ray-start"
                        class="connection-source"
                        ?expanded=${true}>

                        <div class="subform-field-stack">
                            <ha-selector
                                .hass=${this.hass}
                                .selector=${{
                                    select: {
                                        mode: 'dropdown',
                                        custom_value: allSourceOptions.length >= 10,
                                        options: allSourceOptions
                                    }
                                }}
                                .value=${this._lineFormData.anchor}
                                .label=${'Select Anchor or Overlay'}
                                @value-changed=${(e) => {
                                    this._lineFormData.anchor = e.detail.value;
                                    this.requestUpdate();
                                }}>
                            </ha-selector>

                            <div class="subform-row-aside">
                                <lcards-position-picker
                                    .value=${this._lineFormData.anchor_side || 'center'}
                                    .label=${'Anchor Side'}
                                    .helper=${'Select attachment point on the source'}
                                    @value-changed=${(e) => {
                                        // lcards-position-picker emits long-form edge names
                                        // (top-center, center-left, ...); attachment points are
                                        // keyed short-form (top, left, ...) — normalize on the way out.
                                        // See the Control form's Attachment Point field for the
                                        // same established pattern.
                                        const edgeAliases = { 'top-center': 'top', 'bottom-center': 'bottom', 'center-left': 'left', 'center-right': 'right' };
                                        this._lineFormData.anchor_side = edgeAliases[e.detail.value] || e.detail.value;
                                        this.requestUpdate();
                                    }}>
                                </lcards-position-picker>

                                <ha-input
                                    style="width: 100%; box-sizing: border-box;"
                                    type="number"
                                    label="Gap (vb units)"
                                    .value=${String(this._lineFormData.anchor_gap || 0)}
                                    @input=${(e) => {
                                        this._lineFormData.anchor_gap = Number(e.target.value);
                                        this.requestUpdate();
                                    }}
                                    hint="Distance from point">
                                </ha-input>
                            </div>
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

                        <div class="subform-field-stack">
                            <ha-selector
                                .hass=${this.hass}
                                .selector=${{
                                    select: {
                                        mode: 'dropdown',
                                        custom_value: allSourceOptions.length >= 10,
                                        options: allSourceOptions
                                    }
                                }}
                                .value=${this._lineFormData.attach_to}
                                .label=${'Select Anchor or Overlay'}
                                @value-changed=${(e) => {
                                    this._lineFormData.attach_to = e.detail.value;
                                    this.requestUpdate();
                                }}>
                            </ha-selector>

                            <div class="subform-row-aside">
                                <lcards-position-picker
                                    .value=${this._lineFormData.attach_side || 'center'}
                                    .label=${'Attach Side'}
                                    .helper=${'Select attachment point on the target'}
                                    @value-changed=${(e) => {
                                        // lcards-position-picker emits long-form edge names
                                        // (top-center, center-left, ...); attachment points are
                                        // keyed short-form (top, left, ...) — normalize on the way out.
                                        // See the Control form's Attachment Point field for the
                                        // same established pattern.
                                        const edgeAliases = { 'top-center': 'top', 'bottom-center': 'bottom', 'center-left': 'left', 'center-right': 'right' };
                                        this._lineFormData.attach_side = edgeAliases[e.detail.value] || e.detail.value;
                                        this.requestUpdate();
                                    }}>
                                </lcards-position-picker>

                                <ha-input
                                    style="width: 100%; box-sizing: border-box;"
                                    type="number"
                                    label="Gap (vb units)"
                                    .value=${String(this._lineFormData.attach_gap || 0)}
                                    @input=${(e) => {
                                        this._lineFormData.attach_gap = Number(e.target.value);
                                        this.requestUpdate();
                                    }}
                                    hint="Distance from point">
                                </ha-input>
                            </div>
                        </div>
                    </lcards-form-section>
                </div>

                <lcards-form-section
                    header="Stacking Order"
                    description="Control paint order relative to other lines and controls"
                    icon="mdi:layers-outline"
                    secondary=${this._lineFormData.z_index != null ? `Z-Index: ${this._lineFormData.z_index} (custom)` : 'Z-Index: 100 (default)'}
                    ?expanded=${this._lineFormData.z_index != null}>
                    <ha-input
                        type="number"
                        label="Z-Index"
                        .value=${this._lineFormData.z_index != null ? String(this._lineFormData.z_index) : ''}
                        @input=${(e) => {
                            const raw = e.target.value;
                            this._lineFormData.z_index = raw === '' ? null : Number(raw);
                            this.requestUpdate();
                        }}
                        hint="Higher values paint on top. Leave blank to use the default (100 — lines paint under controls).">
                    </ha-input>
                </lcards-form-section>
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
            'auto': { icon: 'mdi:routes', title: 'Auto', description: 'Full pathfinding: obstacle avoidance, trunk bundling with nearby lines, and crossing avoidance — always, whether or not obstacles/channels are present' },
            'manhattan': { icon: 'mdi:vector-polyline', title: 'Manhattan (Advanced)', description: 'A fixed single-bend elbow shape — no pathfinding, no obstacle avoidance, no bundling, no crossing avoidance. The cheap, fully predictable opt-out from Auto.' },
            'grid': { icon: 'mdi:grid', title: 'Grid (Advanced)', description: 'Same full pathfinding as Auto — obstacle avoidance, bundling, crossing avoidance — but skips the extra local-search refinement pass Auto/Smart adds on top.' }
        };
        const routeInfo = routeInfoMap[routeMode] || routeInfoMap['auto'];

        // Auto always runs full pathfinding now — there's no mode to
        // "detect" anymore. This just surfaces what's actually nearby that
        // it'll route around/through, since that's still useful context.
        let autoContext = '';
        if (routeMode === 'auto') {
            const hasObstacles = this._getControlOverlays().some(c => c.obstacle === true);
            const hasChannels = this._lineFormData.route_channels && this._lineFormData.route_channels.length > 0;

            if (hasChannels) {
                autoContext = 'This line routes through its configured channel(s).';
            } else if (hasObstacles) {
                autoContext = 'Obstacles are present on this card — this line will avoid them.';
            } else {
                autoContext = 'No obstacles or channels on this card — a direct path with no avoidance needed. Still bundles with nearby parallel lines and avoids crossing them.';
            }
        }

        return html`
            <div class="subform-field-stack">
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
                                mode: 'dropdown',
                                options: [
                                    { value: 'auto', label: 'Auto (Recommended)' },
                                    { value: 'direct', label: 'Direct (Straight line)' },
                                    { value: 'manual', label: 'Manual (Custom waypoints)' },
                                    { value: 'manhattan', label: 'Manhattan (Advanced — opt out of bundling)' },
                                    { value: 'grid', label: 'Grid (Advanced — skip refinement pass)' }
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
                    <lcards-message
                        type="info"
                        .title=${routeInfo.title}
                        .message=${routeInfo.description}
                        style="margin-top: 12px;">
                    </lcards-message>

                    ${routeMode === 'auto' ? html`
                        <lcards-message
                            type="tip"
                            .title=${'What this line will do'}
                            .message=${autoContext}>
                        </lcards-message>
                    ` : ''}

                    ${routeMode === 'manhattan' ? html`
                        <lcards-message
                            type="warning"
                            .title=${'Opting out of bundling and crossing avoidance'}
                            .message=${'This line won\'t bundle with nearby parallel lines, won\'t avoid obstacles, and won\'t avoid crossing other lines. Its geometry still registers, so other Auto/Smart/Grid lines can bundle alongside it or avoid crossing it.'}>
                        </lcards-message>
                    ` : ''}

                    ${routeMode === 'grid' ? html`
                        <lcards-message
                            type="tip"
                            .title=${'What this line will do'}
                            .message=${'Same bundling, crossing avoidance, and obstacle avoidance as Auto — just without the extra refinement pass. Rarely needed; use Auto unless you have a specific reason to skip refinement.'}>
                        </lcards-message>
                    ` : ''}

                    ${routeMode === 'auto' || routeMode === 'direct' ? html`
                        <ha-button
                            @click=${() => this._convertLineToManual(this._lineFormData.id)}
                            size="s">
                            <ha-icon icon="mdi:content-save-edit" slot="start"></ha-icon>
                            Freeze to Manual Mode
                        </ha-button>
                        <div class="helper-text">
                            Convert current auto-routed path to manual waypoints
                        </div>
                    ` : ''}
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
                            helper="xy = horizontal then vertical, yx = vertical then horizontal"
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
                            helper="xy = horizontal then vertical, yx = vertical then horizontal"
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
                                            const viewBox = this._workingConfig.msd?.view_box || this._extractedViewBox || [0, 0, 1920, 1080];
                                            const centerX = viewBox[0] + viewBox[2] / 2;
                                            const centerY = viewBox[1] + viewBox[3] / 2;
                                            this._lineFormData.waypoints.push([centerX, centerY]);
                                            this._waypointEditingLineId = this._lineFormData.id;
                                            this._showWaypointMarkers = true;
                                            this.requestUpdate();
                                        }}
                                        size="s">
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
                                                    <ha-input
                                                        label="Anchor"
                                                        .value=${wp}
                                                        @input=${(e) => {
                                                            this._lineFormData.waypoints[index] = e.target.value;
                                                            this._schedulePreviewUpdate();
                                                            this.requestUpdate();
                                                        }}
                                                        style="flex: 1; min-width: 120px;">
                                                    </ha-input>
                                                ` : html`
                                                    <!-- Coordinates -->
                                                    <div style="flex: 1; display: flex; gap: 8px; min-width: 0;">
                                                        <ha-input
                                                            type="number"
                                                            label="X"
                                                            .value=${String(wp[0] || 0)}
                                                            @input=${(e) => {
                                                                this._lineFormData.waypoints[index][0] = this._roundToPrecision(Number(e.target.value));
                                                                this._schedulePreviewUpdate();
                                                                this.requestUpdate();
                                                            }}
                                                            style="flex: 1; min-width: 80px;">
                                                        </ha-input>
                                                        <ha-input
                                                            type="number"
                                                            label="Y"
                                                            .value=${String(wp[1] || 0)}
                                                            @input=${(e) => {
                                                                this._lineFormData.waypoints[index][1] = this._roundToPrecision(Number(e.target.value));
                                                                this._schedulePreviewUpdate();
                                                                this.requestUpdate();
                                                            }}
                                                            style="flex: 1; min-width: 80px;">
                                                        </ha-input>
                                                    </div>
                                                `}

                                                <!-- Toggle Type Button -->
                                                <ha-icon-button
                                                    @click=${() => {
                                                        // Toggle between coordinate and anchor format
                                                        if (typeof wp === 'string') {
                                                            // Convert anchor to coordinates (center of viewBox)
                                                            const viewBox = this._workingConfig.msd?.view_box || this._extractedViewBox || [0, 0, 1920, 1080];
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

                    <!-- Channel Routing (only for auto/direct modes) -->
                    ${routeMode !== 'manual' ? this._renderChannelRoutingOptions() : ''}

                    <!-- Auto Routing: Clearance -->
                    ${routeMode === 'auto' ? html`
                        <lcards-form-section
                            header="Advanced Options"
                            description="Fine-tune pathfinding behavior"
                            icon="mdi:cog"
                            ?expanded=${false}>

                            <ha-input
                                type="number"
                                label="Clearance (vb units)"
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
                                hint="Minimum distance from obstacles, vb units (leave empty for default: 8)"
                                style="width: 100%;">
                            </ha-input>

                            <ha-input
                                type="number"
                                label="Stub Length (vb units)"
                                .value=${String(this._lineFormData.stub_length ?? '')}
                                @input=${(e) => {
                                    const val = e.target.value;
                                    if (val === '') {
                                        delete this._lineFormData.stub_length;
                                    } else {
                                        this._lineFormData.stub_length = Number(val);
                                    }
                                    this.requestUpdate();
                                }}
                                hint="Overrides the mandatory departure/arrival stub length (leave empty to use the router's own auto/forced resolution — see Corner Size Mode on the Style tab). Going below one grid cell risks re-triggering an internal same-cell short-circuit; check window.lcards.debug.msd.routing.inspect(id).meta.debug for the router's resolved value first."
                                style="width: 100%; margin-top: 12px;">
                            </ha-input>

                            <ha-selector
                                .hass=${this.hass}
                                .selector=${{ number: { min: 0, max: 20, step: 1, mode: 'slider' } }}
                                .value=${this._lineFormData.corner_room_weight ?? 4}
                                .label=${'Corner Room Weight'}
                                @value-changed=${(e) => {
                                    this._lineFormData.corner_room_weight = e.detail.value;
                                    this.requestUpdate();
                                }}
                                helper="How hard this line fights to keep its full Corner Radius when a tight detour would otherwise squash it: 0 = never bend the route for it (this line opts out), higher = more willing to accept a longer or more-bent route to keep corners full. Card-wide default is 4; a line with a small custom Corner Radius may need a higher value for a similar effect."
                                style="margin-top: 12px;">
                            </ha-selector>
                        </lcards-form-section>
                    ` : ''}
            </div>
        `;
    }

    /**
     * Adapter satisfying lcards-color-section-v2's `.editor` contract
     * (`_getConfigValue`/`_setConfigValue` dot-path get/set over `.config`),
     * backed by `this._lineFormData` instead of a real editor's `.config` —
     * the MSD Studio dialog is a plain LitElement, not an LCARdSBaseEditor
     * subclass, so the real base-editor methods aren't available here.
     * @private
     */
    _getLineColorEditorAdapter() {
        const dialog = this;
        return {
            hass: this.hass,
            config: this._lineFormData,
            _getConfigValue(path) {
                return path.split('.').reduce((obj, key) => obj?.[key], dialog._lineFormData);
            },
            _setConfigValue(path, value) {
                const keys = path.split('.');
                const lastKey = keys.pop();
                let target = dialog._lineFormData;
                for (const key of keys) {
                    if (!target[key] || typeof target[key] !== 'object') target[key] = {};
                    target = target[key];
                }
                target[lastKey] = value;
                dialog.requestUpdate();
            }
        };
    }

    /**
     * Render the line's color config: entity + state_attribute + ranges_attribute
     * (mirrors the button card's pattern exactly, scoped per-line since MSD has no
     * single bound entity), plus the same list-based state-color editor used
     * elsewhere (lcards-color-section-v2 — supports custom states AND above:/below:/
     * between: range conditions). No separate "enable state-color" toggle: the
     * color is always the state-color object shape; with no entity bound,
     * resolveStateColor() just falls through to 'default', so a plain single-color
     * line is simply one bound to no entity with only a 'default' key set.
     * Uses a real entity: {} selector — the dialog is now mounted inside
     * <home-assistant>'s shadow root (see mountDialogNearHomeAssistant in
     * lcards-msd-editor.js), so Lit @consume context resolves correctly.
     * @returns {TemplateResult}
     * @private
     */
    _renderLineColorSection() {
        const entityId = this._lineFormData.entity || '';
        const attrOptions = entityId && this.hass?.states?.[entityId]
            ? Object.keys(this.hass.states[entityId].attributes || {}).sort().map(attr => ({ value: attr, label: attr }))
            : [];
        const rangesAttrOptions = [...attrOptions];
        const brightnessIdx = rangesAttrOptions.findIndex(o => o.value === 'brightness');
        if (brightnessIdx >= 0) {
            rangesAttrOptions.splice(brightnessIdx + 1, 0, { value: 'brightness_pct', label: 'brightness_pct  (auto 0–100%)' });
        }

        return html`
            <div style="margin-bottom: 12px;">
                <ha-selector
                    .hass=${this.hass}
                    .selector=${{ entity: {} }}
                    .value=${entityId}
                    .label=${'Entity'}
                    .helper=${"Bind this line's color to an entity's state (optional) — leave blank for a fixed color"}
                    @value-changed=${(e) => {
                        this._lineFormData.entity = e.detail.value || '';
                        this.requestUpdate();
                    }}
                    style="display: block; margin-bottom: 12px;">
                </ha-selector>

                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 12px;">
                    <ha-selector
                        .hass=${this.hass}
                        .label=${'State Attribute'}
                        .helper=${'Match this attribute\'s value instead of raw entity state'}
                        .disabled=${!entityId}
                        .selector=${{ select: { mode: 'dropdown', options: [{ value: '__none__', label: '— Use entity state' }, ...attrOptions], custom_value: true } }}
                        .value=${this._lineFormData.state_attribute || '__none__'}
                        @value-changed=${(e) => {
                            const v = (e.detail.value ?? '').trim();
                            this._lineFormData.state_attribute = (v === '__none__' || !v) ? '' : v;
                            this.requestUpdate();
                        }}>
                    </ha-selector>
                    <ha-selector
                        .hass=${this.hass}
                        .label=${'Range Attribute'}
                        .helper=${'Attribute compared against above:/below:/between: keys'}
                        .disabled=${!entityId}
                        .selector=${{ select: { mode: 'dropdown', options: [{ value: '__none__', label: '— Use entity state' }, ...rangesAttrOptions], custom_value: true } }}
                        .value=${this._lineFormData.ranges_attribute || '__none__'}
                        @value-changed=${(e) => {
                            let v = (e.detail.value ?? '').trim();
                            if (v === 'brightness') v = 'brightness_pct';
                            this._lineFormData.ranges_attribute = (v === '__none__' || !v) ? '' : v;
                            this.requestUpdate();
                        }}>
                    </ha-selector>
                </div>

                <lcards-color-section-v2
                    .editor=${this._getLineColorEditorAdapter()}
                    .config=${this._lineFormData}
                    .entityId=${entityId}
                    basePath="style.color"
                    header="Line Color"
                    description="Fixed color, or add state/range keys to bind it to the entity above"
                    ?expanded=${true}>
                </lcards-color-section-v2>
            </div>
        `;
    }

    /**
     * Render Markers tab
     * @returns {TemplateResult}
     * @private
     */
    /**
     * Render a marker's fill/stroke color field with a "Match Line Color"
     * toggle (Phase 9) alongside the normal color picker — checking it sets
     * the field to the 'match_line' sentinel (LineOverlay._buildDefinitions()/
     * AdvancedRenderer.updateLineEntityColors() resolve it to the line's own
     * current color, live) instead of a literal color value.
     * @param {'marker_start'|'marker_end'} markerKey
     * @param {'fill'|'stroke'} colorProp
     * @param {string} label
     * @returns {TemplateResult}
     * @private
     */
    _renderMarkerColorField(markerKey, colorProp, label) {
        const marker = this._lineFormData.style?.[markerKey] || {};
        const matchesLine = marker[colorProp] === 'match_line';
        return html`
            <div>
                <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px;">
                    <div style="font-size: 14px; font-weight: 500; color: var(--primary-text-color);">${label}</div>
                    <ha-formfield alignEnd spaceBetween .label=${'Match Line Color'}>
                        <ha-switch
                            .checked=${matchesLine}
                            @change=${(e) => {
                                this._lineFormData.style = {
                                    ...this._lineFormData.style,
                                    [markerKey]: {
                                        ...this._lineFormData.style[markerKey],
                                        [colorProp]: e.target.checked ? 'match_line' : ''
                                    }
                                };
                                this.requestUpdate();
                            }}>
                        </ha-switch>
                    </ha-formfield>
                </div>
                ${!matchesLine ? html`
                    <lcards-color-picker
                        .hass=${this.hass}
                        .value=${marker[colorProp] || ''}
                        ?showPreview=${true}
                        @value-changed=${(e) => {
                            this._lineFormData.style = {
                                ...this._lineFormData.style,
                                [markerKey]: {
                                    ...this._lineFormData.style[markerKey],
                                    [colorProp]: e.detail.value
                                }
                            };
                            this.requestUpdate();
                        }}>
                    </lcards-color-picker>
                ` : ''}
            </div>
        `;
    }

    /**
     * Render a marker's "Attach Point" selector — only for marker types with
     * a directional tip/leading edge (arrow, diamond, rect/square); dot and
     * the orthogonal 'line' tick are symmetric along the line's axis, so
     * center-attach is already the only sensible placement for them and this
     * renders nothing. Backs `LineOverlay._createMarkerDefinition()`'s opt-in
     * `align: 'edge'` handling.
     * @param {'marker_start'|'marker_end'} markerKey
     * @returns {TemplateResult}
     * @private
     */
    _renderMarkerAlignField(markerKey) {
        const marker = this._lineFormData.style?.[markerKey] || {};
        if (!['arrow', 'triangle', 'diamond', 'rect', 'square'].includes(marker.type)) return '';
        return html`
            <ha-selector
                style="display: block; margin-top: 12px;"
                .hass=${this.hass}
                .selector=${{
                    select: {
                        mode: 'dropdown',
                        options: [
                            { value: 'center', label: 'Center (default)' },
                            { value: 'edge', label: 'Edge (projects past line end — hides thick-line overshoot)' }
                        ]
                    }
                }}
                .value=${marker.align === 'edge' ? 'edge' : 'center'}
                .label=${'Attach Point'}
                .helper=${'Edge hides thick-line overshoot but extends past the anchor point; use Center if the marker must land exactly on it'}
                @value-changed=${(e) => {
                    this._lineFormData.style = {
                        ...this._lineFormData.style,
                        [markerKey]: { ...this._lineFormData.style[markerKey], align: e.detail.value }
                    };
                    this.requestUpdate();
                }}>
            </ha-selector>
        `;
    }

    _renderLineFormMarkers() {
        return html`
            <div class="subform-field-stack">
                <!-- Start/End Marker side-by-side (independent/parallel settings, see Phase 6.5) -->
                <div class="subform-columns-2">
                <lcards-form-section
                    header="Start Marker"
                    description="Marker at the beginning of the line"
                    icon="mdi:map-marker-plus"
                    ?expanded=${true}>

                    <ha-selector
                        .hass=${this.hass}
                        .selector=${{
                            select: {
                                mode: 'dropdown',
                                options: [
                                    { value: 'none', label: 'None' },
                                    { value: 'arrow', label: 'Arrow' },
                                    { value: 'dot', label: 'Dot' },
                                    { value: 'diamond', label: 'Diamond' },
                                    { value: 'line', label: 'Line (Orthogonal)' },
                                    { value: 'rect', label: 'Rectangle' }
                                ]
                            }
                        }}
                        .value=${this._lineFormData.style?.marker_start?.type || 'none'}
                        .label=${'Type'}
                        @value-changed=${(e) => {
                            const markerType = e.detail.value;
                            if (markerType === 'none') {
                                // @ts-ignore - TS2339: auto-suppressed
                                const { marker_start, ...styleWithoutMarkerStart } = this._lineFormData.style || {};
                                // @ts-ignore - TS2322: auto-suppressed
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
                        <ha-input
                            type="number"
                            label="Size (vb units)"
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
                        </ha-input>

                        ${this._lineFormData.style.marker_start.type === 'rect' ? html`
                            <ha-selector
                                style="display: block; margin-top: 12px;"
                                .hass=${this.hass}
                                .label=${'Filled'}
                                .selector=${{ boolean: {} }}
                                .value=${this._lineFormData.style.marker_start.filled === true}
                                @value-changed=${(e) => {
                                    this._lineFormData.style = {
                                        ...this._lineFormData.style,
                                        marker_start: { ...this._lineFormData.style.marker_start, filled: e.detail.value }
                                    };
                                    this.requestUpdate();
                                }}>
                            </ha-selector>
                            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-top: 12px;">
                                <ha-input
                                    type="number"
                                    label="Width (vb units)"
                                    .value=${String(this._lineFormData.style.marker_start.width ?? this._lineFormData.style.marker_start.size ?? 10)}
                                    step="1"
                                    min="1"
                                    @input=${(e) => {
                                        this._lineFormData.style = {
                                            ...this._lineFormData.style,
                                            marker_start: { ...this._lineFormData.style.marker_start, width: Number(e.target.value) || 10 }
                                        };
                                        this.requestUpdate();
                                    }}>
                                </ha-input>
                                <ha-input
                                    type="number"
                                    label="Height (vb units)"
                                    .value=${String(this._lineFormData.style.marker_start.height ?? this._lineFormData.style.marker_start.size ?? 10)}
                                    step="1"
                                    min="1"
                                    @input=${(e) => {
                                        this._lineFormData.style = {
                                            ...this._lineFormData.style,
                                            marker_start: { ...this._lineFormData.style.marker_start, height: Number(e.target.value) || 10 }
                                        };
                                        this.requestUpdate();
                                    }}>
                                </ha-input>
                            </div>
                        ` : ''}

                        ${this._renderMarkerAlignField('marker_start')}

                        <div style="margin-top: 12px;">
                            ${this._renderMarkerColorField('marker_start', 'fill', 'Fill Color')}
                        </div>

                        <div style="display: grid; grid-template-columns: 1fr 120px; gap: 12px; margin-top: 12px;">
                            ${this._renderMarkerColorField('marker_start', 'stroke', 'Stroke Color')}

                            <ha-input
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
                            </ha-input>
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
                                mode: 'dropdown',
                                options: [
                                    { value: 'none', label: 'None' },
                                    { value: 'arrow', label: 'Arrow' },
                                    { value: 'dot', label: 'Dot' },
                                    { value: 'diamond', label: 'Diamond' },
                                    { value: 'line', label: 'Line (Orthogonal)' },
                                    { value: 'rect', label: 'Rectangle' }
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
                        <ha-input
                            type="number"
                            label="Size (vb units)"
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
                        </ha-input>

                        ${this._lineFormData.style.marker_end.type === 'rect' ? html`
                            <ha-selector
                                style="display: block; margin-top: 12px;"
                                .hass=${this.hass}
                                .label=${'Filled'}
                                .selector=${{ boolean: {} }}
                                .value=${this._lineFormData.style.marker_end.filled === true}
                                @value-changed=${(e) => {
                                    this._lineFormData.style = {
                                        ...this._lineFormData.style,
                                        marker_end: { ...this._lineFormData.style.marker_end, filled: e.detail.value }
                                    };
                                    this.requestUpdate();
                                }}>
                            </ha-selector>
                            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-top: 12px;">
                                <ha-input
                                    type="number"
                                    label="Width (vb units)"
                                    .value=${String(this._lineFormData.style.marker_end.width ?? this._lineFormData.style.marker_end.size ?? 10)}
                                    step="1"
                                    min="1"
                                    @input=${(e) => {
                                        this._lineFormData.style = {
                                            ...this._lineFormData.style,
                                            marker_end: { ...this._lineFormData.style.marker_end, width: Number(e.target.value) || 10 }
                                        };
                                        this.requestUpdate();
                                    }}>
                                </ha-input>
                                <ha-input
                                    type="number"
                                    label="Height (vb units)"
                                    .value=${String(this._lineFormData.style.marker_end.height ?? this._lineFormData.style.marker_end.size ?? 10)}
                                    step="1"
                                    min="1"
                                    @input=${(e) => {
                                        this._lineFormData.style = {
                                            ...this._lineFormData.style,
                                            marker_end: { ...this._lineFormData.style.marker_end, height: Number(e.target.value) || 10 }
                                        };
                                        this.requestUpdate();
                                    }}>
                                </ha-input>
                            </div>
                        ` : ''}

                        ${this._renderMarkerAlignField('marker_end')}

                        <div style="margin-top: 12px;">
                            ${this._renderMarkerColorField('marker_end', 'fill', 'Fill Color')}
                        </div>

                        <div style="display: grid; grid-template-columns: 1fr 120px; gap: 12px; margin-top: 12px;">
                            ${this._renderMarkerColorField('marker_end', 'stroke', 'Stroke Color')}

                            <ha-input
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
                            </ha-input>
                        </div>
                    ` : ''}
                </lcards-form-section>
                </div>
            </div>
        `;
    }

    /**
     * Render Animation tab
     * @returns {TemplateResult}
     * @private
     */
    _renderLineFormAnimation() {
        // See _renderShapeFormAnimation for why this is scoped via
        // searchRootSelector (same pre-existing gap, this line form just
        // predates that fix) and why an attribute selector, not #id.
        const lineId = this._editingLineId || this._lineFormData.id;
        return html`
            <div class="subform-field-stack">
                <lcards-form-section
                    header="Line Animations"
                    description="Configure animations for this line"
                    icon="mdi:animation"
                    ?expanded=${true}>

                    <lcards-animation-editor
                        .hass=${this.hass}
                        .animations=${this._lineFormData.animations || []}
                        .cardElement=${this._getLivePreviewCardElement()}
                        .searchRootSelector=${lineId ? `[data-overlay-id="${lineId}"]` : ''}
                        @animations-changed=${(e) => {
                            this._lineFormData.animations = e.detail.value;
                            this.requestUpdate();
                        }}
                        @refresh-targets=${() => this.requestUpdate()}
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
            <div class="subform-field-stack">
                <!-- Color & Entity Binding (full width - pulled out of Line Style so the two
                     columns below stay balanced in height; see Phase 6.5) -->
                <lcards-form-section
                    header="Color"
                    description="Entity/state binding and color"
                    icon="mdi:palette"
                    ?expanded=${true}>
                    ${this._renderLineColorSection()}
                </lcards-form-section>

                <!-- Line Style / Line Shape stacked one-per-row (not the shared
                     .subform-columns-2's default 1fr-1fr) — side by side caused
                     horizontal scroll here, especially with the advanced stroke
                     properties section expanded. -->
                <div class="subform-columns-2" style="grid-template-columns: 1fr;">

                    <!-- Left Column: Width, Style -->
                    <lcards-form-section
                        header="Line Style"
                        description="Width, opacity and dash pattern"
                        icon="mdi:ruler"
                        ?expanded=${true}>

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
                            helper="Line opacity (0 = transparent, 1 = opaque)"
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
                            <lcards-form-section
                                header="${lineStylePreset === 'custom' ? 'Custom' : 'Customize'} Dash Pattern"
                                icon="mdi:dots-horizontal"
                                ?nested=${true}
                                ?expanded=${true}>

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
                                            <ha-selector
                                                style="margin-top: 12px; display: block;"
                                                .hass=${this.hass}
                                                .label=${'Add secondary dash/gap'}
                                                .selector=${{ boolean: {} }}
                                                .value=${dash2 > 0}
                                                @value-changed=${(e) => {
                                                    if (e.detail.value) {
                                                        this._lineFormData.style = { ...this._lineFormData.style, dash_array: `${dash1},${gap1},2,2` };
                                                    } else {
                                                        this._lineFormData.style = { ...this._lineFormData.style, dash_array: `${dash1},${gap1}` };
                                                    }
                                                    this.requestUpdate();
                                                }}>
                                            </ha-selector>
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
                            </lcards-form-section>
                        ` : ''}
                    </lcards-form-section>

                    <!-- Right Column: Line Shape -->
                    <lcards-form-section
                        header="Line Shape"
                        description="Corner and smoothing settings"
                        icon="mdi:vector-curve"
                        ?expanded=${true}>

                    <div class="subform-columns-2">
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
                                .value=${this._lineFormData.corner_style || 'round'}
                                .label=${'Corner Style'}
                                @value-changed=${(e) => {
                                    this._lineFormData.corner_style = e.detail.value;
                                    this.requestUpdate();
                                }}>
                            </ha-selector>

                            ${(this._lineFormData.corner_style === 'round') ? html`
                                <ha-selector
                                    .hass=${this.hass}
                                    .selector=${{ number: { min: 0, max: 100, step: 1, mode: 'slider', unit_of_measurement: 'vb' } }}
                                    .value=${this._lineFormData.corner_radius ?? 34}
                                    .label=${'Corner Radius'}
                                    @value-changed=${(e) => {
                                        this._lineFormData.corner_radius = e.detail.value;
                                        this.requestUpdate();
                                    }}
                                    helper="Arc radius for rounded corners (default: 34)"
                                    style="margin-top: 12px;">
                                </ha-selector>
                            ` : ''}

                            ${(this._lineFormData.corner_style === 'bevel') ? html`
                                <ha-selector
                                    .hass=${this.hass}
                                    .selector=${{ number: { min: 0, max: 100, step: 1, mode: 'slider', unit_of_measurement: 'vb' } }}
                                    .value=${this._lineFormData.corner_radius ?? 34}
                                    .label=${'Cut Size'}
                                    @value-changed=${(e) => {
                                        this._lineFormData.corner_radius = e.detail.value;
                                        this.requestUpdate();
                                    }}
                                    helper="Diagonal chamfer cut size, same concept as the elbow card's corner size (default: 34)"
                                    style="margin-top: 12px;">
                                </ha-selector>
                                <ha-selector
                                    .hass=${this.hass}
                                    .selector=${{ number: { min: 0, max: 90, step: 1, mode: 'slider', unit_of_measurement: '°' } }}
                                    .value=${this._lineFormData.corner_angle ?? 45}
                                    .label=${'Cut Angle'}
                                    @value-changed=${(e) => {
                                        this._lineFormData.corner_angle = e.detail.value;
                                        this.requestUpdate();
                                    }}
                                    helper="45° = symmetric diagonal, 0°/90° = flush with one edge (no visible cut) (default: 45)"
                                    style="margin-top: 12px;">
                                </ha-selector>
                            ` : ''}

                            ${(this._lineFormData.corner_style === 'round' || this._lineFormData.corner_style === 'bevel') ? html`
                                <ha-selector
                                    .hass=${this.hass}
                                    .selector=${{select: {
                                        options: [
                                            { value: 'auto', label: 'Auto (target size)' },
                                            { value: 'forced', label: 'Forced (always full size)' }
                                        ]
                                    }}}
                                    .value=${this._lineFormData.corner_radius_mode || 'auto'}
                                    .label=${'Corner Size Mode'}
                                    @value-changed=${(e) => {
                                        this._lineFormData.corner_radius_mode = e.detail.value;
                                        this.requestUpdate();
                                    }}
                                    helper=${this._lineFormData.corner_radius_mode === 'forced'
                                        ? 'Forced always reserves the full corner size, which can cause routing detours or line crossings near tight geometry.'
                                        : 'Auto (recommended): corner size may shrink so the router stays free to avoid forcing a detour or an unnecessary line crossing.'}
                                    style="margin-top: 12px;">
                                </ha-selector>
                            ` : ''}

                            ${(this._lineFormData.corner_style === 'miter') ? html`
                                <ha-selector
                                    .hass=${this.hass}
                                    .selector=${{ number: { min: 1, max: 20, step: 0.5, mode: 'slider' } }}
                                    .value=${this._lineFormData.miter_limit || 4}
                                    .label=${'Miter Limit'}
                                    @value-changed=${(e) => {
                                        this._lineFormData.miter_limit = e.detail.value;
                                        this.requestUpdate();
                                    }}
                                    helper="Max ratio before clipping sharp corners (default: 4)"
                                    style="margin-top: 12px;">
                                </ha-selector>
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
                                <ha-selector
                                    .hass=${this.hass}
                                    .selector=${{ number: { min: 0, max: 5, step: 1, mode: 'slider' } }}
                                    .value=${this._lineFormData.smoothing_iterations || 0}
                                    .label=${'Smoothing Iterations'}
                                    @value-changed=${(e) => {
                                        this._lineFormData.smoothing_iterations = e.detail.value;
                                        this.requestUpdate();
                                    }}
                                    helper="More iterations = smoother curves (default: 0)"
                                    style="margin-top: 12px;">
                                </ha-selector>
                            ` : ''}
                    </lcards-form-section>
                </div>

                <!-- Advanced Stroke Properties (Full Width) -->
                <lcards-form-section
                    header="⚙️ Advanced Stroke Properties"
                    description="Fine-tune SVG stroke rendering (for advanced users)"
                    icon="mdi:cog"
                    ?expanded=${false}>

                    <div class="subform-columns-2">
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
                                helper="How line endpoints are drawn">
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
                                helper="How line segments connect"
                                style="margin-top: 12px;">
                            </ha-selector>
                        </div>

                        <!-- Right Column -->
                        <div>
                            <!-- Stroke Override -->
                            <ha-input
                                label="Stroke Override"
                                .value=${this._lineFormData.style?.stroke || ''}
                                @input=${(e) => {
                                    const value = e.target.value.trim();
                                    if (value === '') {
                                        // Remove stroke override
                                        // @ts-ignore - TS2339: auto-suppressed
                                        const { stroke, ...styleWithoutStroke } = this._lineFormData.style || {};
                                        // @ts-ignore - TS2322: auto-suppressed
                                        this._lineFormData.style = styleWithoutStroke;
                                    } else {
                                        this._lineFormData.style = { ...this._lineFormData.style, stroke: value };
                                    }
                                    this.requestUpdate();
                                }}
                                hint="Override color with custom stroke (e.g., url(#gradient))"
                                style="width: 100%;">
                            </ha-input>

                            <!-- Dash Offset -->
                            <ha-input
                                type="number"
                                label="Dash Offset"
                                .value=${String(this._lineFormData.style?.dash_offset || 0)}
                                @input=${(e) => {
                                    this._lineFormData.style = { ...this._lineFormData.style, dash_offset: Number(e.target.value) || 0 };
                                    this.requestUpdate();
                                }}
                                hint="Shifts the dash pattern (vb units)"
                                style="margin-top: 12px; width: 100%;">
                            </ha-input>
                        </div>
                    </div>
                </lcards-form-section>
            </div>
        `;
    }



    /**
     * Render vertical line style preview for split-view dialog
     * @returns {TemplateResult}
     * @private
     */
    _renderLineStylePreviewVertical() {
        // style.color may be a state-color object — _editLine() always normalizes a
        // plain string into { default: rawColor } (see _editLine(), ~line 10245), so
        // resolve the representative candidate value (default/active/first-state)
        // the same way regardless of shape, THEN check whether *that* candidate is a
        // literal Jinja2/JS template string (Phase 8) — this dialog has no hass/card
        // instance in scope to evaluate it against, so fall back to the default line
        // color and flag it via isTemplateColor for a small notice below.
        const rawColor = this._lineFormData.style?.color;
        const candidateColor = (typeof rawColor === 'object' && rawColor !== null)
            ? (rawColor.default || rawColor.active || Object.values(rawColor)[0])
            : rawColor;
        const isTemplateColor = typeof candidateColor === 'string' &&
            (candidateColor.includes('{{') || candidateColor.includes('{%') || candidateColor.includes('[[['));
        const color = isTemplateColor ? 'var(--lcars-orange)' : (candidateColor || 'var(--lcars-orange)');
        const width = this._lineFormData.style?.width || 2;
        const opacity = this._lineFormData.style?.opacity ?? 1;
        const dashArray = this._lineFormData.style?.dash_array || '';
        const markerStart = this._lineFormData.style?.marker_start;
        const markerEnd = this._lineFormData.style?.marker_end;
        const cornerStyle = this._lineFormData.corner_style || 'round';
        const linecap = this._lineFormData.style?.line_cap || 'butt';
        const linejoin = this._lineFormData.style?.line_join || cornerStyle;

        // Route two fixed mock endpoints through the REAL routing/corner-rounding/
        // smoothing engine (RouterCore), so the preview reflects actual production
        // geometry instead of a hand-drawn approximation. 'manual' mode is mapped to
        // 'manhattan' for the preview only, since real waypoint coordinates wouldn't
        // relate meaningfully to these mock endpoints.
        let pathD = 'M 20,40 L 20,240 L 180,240'; // safe fallback if routing throws
        try {
            const router = new RouterCore({}, {}, [0, 0, 200, 280]);
            const routeMode = this._lineFormData.route === 'manual' ? 'manhattan' : (this._lineFormData.route || 'auto');
            const previewOverlay = {
                id: 'style-preview',
                _raw: { ...this._lineFormData, route: routeMode }
            };
            const req = router.buildRouteRequest(previewOverlay, [20, 40], [180, 240]);
            const routeResult = router.computePath(req);
            if (routeResult?.d) pathD = routeResult.d;
        } catch (e) {
            lcardsLog.warn('[MSDStudio] Line style preview routing failed, using fallback path', e);
        }

        // Reuse the production marker-definition builder (LineOverlay._createMarkerDefinition
        // is a pure function of its arguments) for pixel-accurate marker rendering.
        // "match_line" (Phase 9) is normally resolved in LineOverlay._buildDefinitions()
        // against the line's real resolved color — _createMarkerDefinition() itself has
        // no idea what that sentinel means, so without resolving it here first it gets
        // used as a literal (invalid) CSS color value, rendering black.
        const createMarker = (marker, id, position) => {
            if (!marker?.type || marker.type === 'none') return '';
            const resolvedMarker = {
                ...marker,
                fill: marker.fill === 'match_line' ? color : marker.fill,
                stroke: marker.stroke === 'match_line' ? color : marker.stroke
            };
            return LineOverlay.prototype._createMarkerDefinition(resolvedMarker, id, position, opacity);
        };

        return html`
            <div style="flex: 1; display: flex; flex-direction: column; align-items: center; padding: 20px; background: #0a0a0a; border-radius: 8px; border: 1px solid #333; overflow: hidden;">
                ${isTemplateColor ? html`
                    <lcards-message type="info" message="Templates aren't evaluated in this preview — showing the default color." style="width: 100%;">
                    </lcards-message>
                ` : ''}
                <!-- color: sets currentColor fallback for unfilled markers (card host normally provides this) -->
                <svg viewBox="0 0 200 280" preserveAspectRatio="xMidYMid meet" style="flex: 1; width: 100%; min-height: 0; max-height: 500px; color: ${color};">
                    <defs>
                        ${unsafeSVG(createMarker(markerStart, 'start-preview-v', 'start'))}
                        ${unsafeSVG(createMarker(markerEnd, 'end-preview-v', 'end'))}
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

    /**
     * Render the shape form's live vertical style preview — mirrors
     * _renderLineStylePreviewVertical's approach exactly (reuse RouterCore for
     * real routing/corner/smoothing on the polyline kind; hand-roll the SVG
     * output directly from form style values, same as the line preview does
     * rather than constructing a full ShapeOverlay instance).
     * @returns {TemplateResult}
     * @private
     */
    _renderShapeStylePreviewVertical() {
        const kind = this._shapeFormData.kind;
        const style = this._shapeFormData.style || {};

        // style.color/style.fill may be state-color objects — resolve a
        // representative candidate value the same way _editShape() normalizes
        // them, then flag (but don't attempt to evaluate) template strings.
        const resolveCandidate = (raw, fallback) => {
            const candidate = (typeof raw === 'object' && raw !== null)
                ? (raw.default || raw.active || Object.values(raw)[0])
                : raw;
            const isTemplate = typeof candidate === 'string' &&
                (candidate.includes('{{') || candidate.includes('{%') || candidate.includes('[[['));
            return { value: isTemplate ? fallback : (candidate || fallback), isTemplate };
        };
        const colorResult = resolveCandidate(style.color, 'var(--lcars-orange)');
        const fillResult = resolveCandidate(style.fill, 'none');
        const color = colorResult.value;
        const fill = fillResult.value;
        const isTemplateColor = colorResult.isTemplate || fillResult.isTemplate;

        const width = style.width ?? 2;
        const opacity = style.opacity ?? 1;
        const dashArray = style.dash_array || '';
        const fillOpacity = style.fill_opacity ?? 1;

        // Built as an SVG markup STRING, not a nested html`` TemplateResult — a
        // TemplateResult created by its own separate html`` call is parsed via
        // its own <template>.innerHTML (HTML namespace) unless that literal
        // itself starts with <svg>, so interpolating one as a *child* of an
        // <svg> from a different template produces wrong-namespace elements
        // that browsers silently refuse to paint (exactly what "black box"
        // looks like). unsafeSVG() parses a string through an actual <svg>
        // context instead, matching the same fix already used just above for
        // the line preview's marker defs.
        let bodyMarkup;
        if (kind === 'polyline') {
            const linecap = style.line_cap || 'butt';
            const linejoin = style.line_join || this._shapeFormData.corner_style || 'miter';

            // Route two fixed mock endpoints through the REAL routing/corner-
            // rounding/smoothing engine, same as the line preview, so this
            // reflects actual production geometry.
            let pathD = 'M 20,40 L 20,240 L 180,240';
            try {
                const router = new RouterCore({}, {}, [0, 0, 200, 280]);
                const previewOverlay = {
                    id: 'shape-style-preview',
                    _raw: {
                        route: 'manual',
                        corner_style: this._shapeFormData.corner_style,
                        corner_radius: this._shapeFormData.corner_radius,
                        corner_angle: this._shapeFormData.corner_angle,
                        smoothing_mode: this._shapeFormData.smoothing_mode,
                        smoothing_iterations: this._shapeFormData.smoothing_iterations
                    }
                };
                const req = router.buildRouteRequest(previewOverlay, [20, 40], [180, 240]);
                const routeResult = router.computePath(req);
                if (routeResult?.d) pathD = this._shapeFormData.closed ? `${routeResult.d} Z` : routeResult.d;
            } catch (e) {
                lcardsLog.warn('[MSDStudio] Shape style preview routing failed, using fallback path', e);
            }

            bodyMarkup = `<path
                    d="${pathD}"
                    stroke="${color}"
                    stroke-width="${width}"
                    stroke-opacity="${opacity}"
                    stroke-dasharray="${dashArray}"
                    stroke-linecap="${linecap}"
                    stroke-linejoin="${linejoin}"
                    fill="${this._shapeFormData.closed ? fill : 'none'}"
                    fill-opacity="${fillOpacity}"
                />`;
        } else if (kind === 'rect') {
            const radius = this._shapeFormData.corner_style === 'round' ? (this._shapeFormData.corner_radius ?? 8) : 0;
            bodyMarkup = `<rect x="20" y="40" width="160" height="200" rx="${radius}" ry="${radius}"
                      stroke="${color}" stroke-width="${width}" stroke-opacity="${opacity}"
                      stroke-dasharray="${dashArray}" fill="${fill}" fill-opacity="${fillOpacity}" />`;
        } else {
            bodyMarkup = `<ellipse cx="100" cy="140" rx="80" ry="100"
                         stroke="${color}" stroke-width="${width}" stroke-opacity="${opacity}"
                         stroke-dasharray="${dashArray}" fill="${fill}" fill-opacity="${fillOpacity}" />`;
        }

        return html`
            <div style="flex: 1; display: flex; flex-direction: column; align-items: center; padding: 20px; background: #0a0a0a; border-radius: 8px; border: 1px solid #333; overflow: hidden;">
                ${isTemplateColor ? html`
                    <lcards-message type="info" message="Templates aren't evaluated in this preview — showing the default color." style="width: 100%;">
                    </lcards-message>
                ` : ''}
                <svg viewBox="0 0 200 280" preserveAspectRatio="xMidYMid meet" style="flex: 1; width: 100%; min-height: 0; max-height: 500px; color: ${color};">
                    ${unsafeSVG(bodyMarkup)}
                </svg>
            </div>
        `;
    }

    // ============================
    // Keyboard Shortcuts & Validation
    // ============================

    /**
     * Handle keyboard shortcuts.
     * @param {KeyboardEvent} e - Keyboard event
     * @private
     */
    _handleKeyDown(e) {
        // Don't interfere with input fields.
        // Use composedPath()[0] to pierce shadow DOM boundaries and find the actual
        // element that received the keystroke (e.target is retargeted at shadow boundaries).
        const composedTarget = e.composedPath?.()?.[0];
        const composedTag = composedTarget?.tagName?.toLowerCase() ?? '';
        if (
            composedTag === 'input' ||
            composedTag === 'textarea' ||
            composedTag === 'select' ||
            composedTag.includes('input') ||
            composedTag.includes('textfield') ||
            composedTag.includes('textarea') ||
            composedTarget?.isContentEditable
        ) {
            return;
        }
        // Fallback: also check the retargeted e.target for non-shadow cases
        // @ts-ignore - TS2339: auto-suppressed
        const targetTag = e.target?.tagName ?? '';
        if (targetTag === 'INPUT' || targetTag === 'TEXTAREA' || targetTag === 'SELECT' || targetTag === 'HA-TEXTFIELD') {
            return;
        }

        // Esc - Exit mode or close dialogs. stopPropagation so wa-dialog's own
        // Escape handling (ha-dialog.ts) never runs once we've handled it —
        // otherwise it still calls open=false, which is only silently
        // no-op'd by prevent-scrim-close's veto instead of doing nothing.
        if (e.key === 'Escape') {
            e.preventDefault();
            e.stopPropagation();
            if (this._showCardEditorForm) {
                this._closeCardEditorForm();
            } else if (this._showLineForm) {
                this._closeLineForm();
            } else if (this._showShapeForm) {
                this._closeShapeForm();
            } else if (this._showControlForm) {
                this._closeControlForm();
            } else if (this._showAnchorForm) {
                this._closeAnchorForm();
            } else if (this._editingChannelId !== null) {
                this._closeChannelForm();
            } else if (this._activeMode !== MODES.VIEW) {
                this._setMode(MODES.VIEW);
            } else if (this._selectedShapeId) {
                this._selectedShapeId = null;
                this.requestUpdate();
            }
            return;
        }

        // Enter - Finish an in-progress polyline (second way to finish,
        // alongside double-click; _finishDrawShapePolyline already no-ops
        // with a warning if fewer than 2 points, so no extra guard needed).
        if (e.key === 'Enter' && this._activeMode === MODES.DRAW_SHAPE && this._drawShapeState.kind === 'polyline') {
            e.preventDefault();
            e.stopPropagation();
            this._finishDrawShapePolyline();
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

        // G - Toggle grid. _debugSettings.grid was a dead flag (write-only,
        // never read by _renderGridOverlay) — the toolbar button and the grid
        // settings popup checkbox both actually drive _showGrid.
        if (e.key === 'g' || e.key === 'G') {
            e.preventDefault();
            this._showGrid = !this._showGrid;
            this.requestUpdate();
            return;
        }

        // E - Toggle Edit Mode (discussion #389) — keyboard equivalent of the
        // toolbar button, so a mouse-in-hand user can flip modes without
        // reaching for it.
        if (e.key === 'e' || e.key === 'E') {
            e.preventDefault();
            this._toggleEditMode();
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
     * Validate current configuration.
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

            // Controls reference their anchor via `position` (string form), not
            // anchor/attach_to like lines — validate the same way lines are validated above.
            if (control.position && typeof control.position === 'string') {
                if (control.position === control.id) {
                    errors.push({
                        type: 'control',
                        id: control.id,
                        field: 'position',
                        message: `Control "${control.id}": cannot use itself as its own position anchor`
                    });
                } else {
                    const anchorExists = allAnchors[control.position] || overlays.find(o => o.id === control.position && o.type !== 'line');
                    if (!anchorExists) {
                        errors.push({
                            type: 'control',
                            id: control.id,
                            field: 'position',
                            message: `Control "${control.id}": position anchor "${control.position}" does not exist`
                        });
                    }
                }
            }
        });

        return errors;
    }

    /**
     * Get validation error count.
     * @returns {number}
     * @private
     */
    _getValidationErrorCount() {
        return this._validationErrors.length;
    }



    /**
     * Show validation errors dialog.
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
     * Show success toast.
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
     * Confirm destructive action.
     * @param {string} message - Confirmation message
     * @returns {Promise<boolean>}
     * @private
     */
    async _confirmAction(message) {
        return await this._showConfirmDialog('Confirm Action', message, { confirmLabel: 'Discard', variant: 'danger' });
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
            // @ts-ignore - TS2339: auto-suppressed
            dialog.headerTitle = title;
            // @ts-ignore - TS2339: auto-suppressed
            dialog.open = true;

            const content = document.createElement('div');
            content.innerHTML = message;
            content.style.padding = '16px';
            dialog.appendChild(content);

            const closeButton = document.createElement('ha-button');
            closeButton.slot = 'footer';
            closeButton.textContent = 'OK';
            closeButton.addEventListener('click', () => {
                // @ts-ignore - TS2339: auto-suppressed
                dialog.open = false;
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
     * Render component
     */
    render() {
        // Inject line highlight styles (hover only - selection uses static SVG)
        setTimeout(() => this._injectLineHighlightStyles(), 100);

        return html`
            <ha-dialog
                open
                @closed=${(e) => { e.stopPropagation(); this._handleClose(); }}
                prevent-scrim-close
                flexcontent
                header-title="MSD Configuration Studio">

                <div slot="footer">
                    <ha-button @click=${() => window.open('https://lcards.unimatrix01.ca/cards/msd/', '_blank')} appearance="plain">
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
                    <ha-button @click=${this._handleSave}>
                        <ha-icon icon="mdi:content-save" slot="start"></ha-icon>
                        Save
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
                                 @mousedown=${this._handlePreviewMouseDown}
                                 @mousemove=${this._handlePreviewMouseMove}
                                 @mouseleave=${this._handlePreviewMouseLeave}>

                                <!-- Zoomable preview container (d3-zoom applies transform dynamically) -->
                                <!-- Explicit px dimensions from viewBox are required: lcards-msd-live-preview
                                     uses height:100% throughout, so without a concrete parent height the
                                     entire chain collapses to 0 and the SVG renders as a tiny dot. -->
                                <div class="msd-zoom-wrapper" style="transform-origin: top left; width: ${this._previewNaturalSize.width}px; height: ${this._previewNaturalSize.height}px;">
                                    <lcards-msd-live-preview
                                        .hass=${this.hass}
                                        .config=${this._workingConfig}
                                        .showRefreshButton=${true}
                                        @preview-ready=${() => this._handlePreviewReady()}>
                                    </lcards-msd-live-preview>
                                </div>

                            </div>
                            <!-- End scrollable container -->

                            <!-- Overlays rendered OUTSIDE scroll container to prevent scroll affecting them -->
                            ${this._renderDrawChannelOverlay()}
                            ${this._renderDrawShapeOverlay()}
                            ${this._renderPlaceControlOverlay()}
                            ${this._renderConnectLineHint()}
                            ${this._renderShieldBubblePreview()}
                            ${this._renderCrosshairGuidelines()}
                            ${this._renderGridOverlay()}
                            ${this._renderRoutingGridOverlay()}
                            ${this._renderAnchorMarkers()}
                            ${this._renderBoundingBoxes()}
                            ${this._renderShapeHandles()}
                            ${this._renderRoutingPaths()}
                            ${this._renderLineEndpointMarkers()}
                            ${this._renderWaypointInsertMarkers()}
                            ${this._renderWaypointMarkers()}
                            ${this._renderShapeSegmentInsertMarkers()}
                            ${this._renderShapeVertexMarkers()}
                            ${this._renderDragAttachPoints()}
                            ${this._renderChannelsOverlay()}
                            ${this._renderTrunksOverlay()}
                            ${this._renderAnchorHighlight()}
                            ${this._renderControlHighlight()}
                            ${this._renderLineHighlight()}
                            ${this._renderChannelHighlight()}
                            ${this._renderAttachmentPointsOverlay()}

                            <!-- Canvas Toolbar (Floating - outside scroll) -->
                            ${this._renderCanvasToolbar()}

                            <!-- Zoom Controls (outside scroll) -->
                            <div class="zoom-controls">
                                <button class="zoom-control-btn"
                                    @click=${(e) => { e.stopPropagation(); this._zoom(0.9); }}
                                    title="Zoom Out">
                                    <ha-icon icon="mdi:magnify-minus"></ha-icon>
                                </button>
                                <span class="zoom-level">${Math.round((this._currentZoom?.k || 1) * 100)}%</span>
                                <button class="zoom-control-btn"
                                    @click=${(e) => { e.stopPropagation(); this._zoom(1.1); }}
                                    title="Zoom In">
                                    <ha-icon icon="mdi:magnify-plus"></ha-icon>
                                </button>
                                <div class="zoom-control-divider"></div>
                                <button class="zoom-control-btn"
                                    @click=${(e) => { e.stopPropagation(); this._fitToViewport(); }}
                                    title="Fit to viewport">
                                    <ha-icon icon="mdi:fit-to-page-outline"></ha-icon>
                                </button>
                                <button class="zoom-control-btn"
                                    @click=${(e) => { e.stopPropagation(); this._resetZoom(); }}
                                    title="Reset to 100%">
                                    <ha-icon icon="mdi:restore"></ha-icon>
                                </button>
                            </div>

                            <!-- Grid Settings Popup (when opened) -->
                            ${this._renderGridSettingsPopup()}
                        </div>
                    </div>
                </div>
            </ha-dialog>

            <!-- Anchor Form Dialog (outside main dialog, always available) -->
            ${this._showAnchorForm ? this._renderAnchorFormDialog() : ''}

            <!-- Control Form Dialog -->
            ${this._showControlForm ? this._renderControlFormDialog() : ''}

            <!-- Card Editor Sub-form Dialog (nested inside Control form's Card tab) -->
            ${this._showCardEditorForm ? this._renderCardEditorFormDialog() : ''}

            <!-- Line Form Dialog -->
            ${this._showLineForm ? this._renderLineFormDialog() : ''}

            <!-- Shape Form Dialog -->
            ${this._showShapeForm ? this._renderShapeFormDialog() : ''}

            <!-- Channel Form Dialog -->
            ${this._editingChannelId !== null ? this._renderChannelFormDialog() : ''}
        `;
    }
}

// Register the custom element
if (!customElements.get('lcards-msd-studio-dialog')) customElements.define('lcards-msd-studio-dialog', LCARdSMSDStudioDialog);
