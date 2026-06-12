/**
 * @fileoverview lcards-layout-view — LCARS CSS Grid View Type with in-view WYSIWYG editing.
 *
 * Drop-in compatible with custom:grid-layout (lovelace-layout-card) schema.
 * A user can copy an existing custom:grid-layout view config and paste it
 * with type: custom:lcards-layout-view — everything works identically.
 *
 * Schema (identical to custom:grid-layout):
 *
 *   type: custom:lcards-layout-view
 *
 *   layout:
 *     grid-template-columns: "160px 1fr"
 *     grid-template-rows: "80px 1fr 60px"
 *     grid-template-areas: |
 *       "header header"
 *       "sidebar content"
 *       "footer footer"
 *     grid-gap: "5px"
 *     height: "calc(100dvh - var(--header-height, 56px))"
 *     margin: "0"
 *     padding: "0"
 *     card_margin: "4px"
 *     card_overflow: "visible"
 *     mediaquery:
 *       "(max-width: 768px)":
 *         grid-template-columns: "1fr"
 *
 *   cards:
 *     - type: custom:lcards-elbow
 *       view_layout:
 *         grid-area: header
 *     - type: weather-forecast
 *       view_layout:
 *         grid-area: content
 *         place-self: center      # alignment within the cell
 *
 * Per-card visibility is handled by HA's native card Visibility (hui-card),
 * not a view_layout.show key.
 *
 * HA provides pre-built card elements via set cards(). This view applies
 * view_layout CSS properties to each element and appends them to the grid.
 *
 * In edit mode (lovelace.editMode === true): renders lcards-grid-edit-overlay
 * as an absolutely-positioned child.
 */

import { LitElement, html, css, nothing } from 'lit';
import { lcardsLog } from '../utils/lcards-logging.js';
import {
    parseLayoutConfig,
    serializeLayoutConfig,
    getAreaNames,
    renameAreaSettings,
    pruneAreaSettings,
} from './layout-grid-utils.js';
import {
    buildGridStyle,
    applyCardPlacement,
    applyGridItemHeight,
    renderAreaSurfaces,
} from './layout-render.js';
import { showConfirmDeleteDialog } from './layout-edit-dialogs.js';

// Alignment option lists for the per-card Placement editor.
// align-self = vertical (block axis); justify-self = horizontal (inline axis).
const ALIGN_V_OPTIONS = [
    { value: 'stretch', label: 'Stretch (default)' },
    { value: 'start',   label: 'Top' },
    { value: 'center',  label: 'Center' },
    { value: 'end',     label: 'Bottom' },
];
const ALIGN_H_OPTIONS = [
    { value: 'stretch', label: 'Stretch (default)' },
    { value: 'start',   label: 'Left' },
    { value: 'center',  label: 'Center' },
    { value: 'end',     label: 'Right' },
];
const PLACEMENT_OVERFLOW_OPTIONS = [
    { value: 'visible', label: 'Visible — bleeds beyond cell' },
    { value: 'clip',    label: 'Clip — hard clip, no scroll' },
    { value: 'hidden',  label: 'Hidden — clip + block context' },
    { value: 'auto',    label: 'Scroll when needed (auto)' },
    { value: 'scroll',  label: 'Always scroll' },
];

export class LCARdSLayoutView extends LitElement {

    // ─────────────────────────────────────────────────────────────────────────
    // Properties
    // ─────────────────────────────────────────────────────────────────────────

    static properties = {
        hass:     { attribute: false },
        lovelace: { attribute: false },
        index:    { type: Number },
        cards:    { attribute: false },
        badges:   { attribute: false },

        _config:      { state: true },
        _editMode:    { state: true },
        _editSubMode: { state: true }, // 'grid' | 'cards'
        _cardBarPos:  { state: true }, // { top, left } | null — dragged card-mode bar position
        _placementEditCard: { state: true }, // { index } | null — open per-card placement panel
        _placementPos: { state: true },      // { top, left } | null — dragged placement panel position
        // Parsed layout state (used by the edit overlay)
        _columns:  { state: true },
        _rows:     { state: true },
        _areas:    { state: true },
        _gap:      { state: true },
    };

    constructor() {
        super();
        this.index        = undefined;
        this._config      = {};
        this._editMode    = false;
        this._editSubMode = 'grid'; // reset to grid mode each time edit mode activates
        this._columns  = ['1fr', '1fr', '1fr'];
        this._rows     = ['1fr', '1fr', '1fr'];
        this._baseRows = ['1fr', '1fr', '1fr']; // rows from config, never modified by visibility logic
        this._areas    = Array(3).fill(null).map(() => Array(3).fill('.'));
        this._gap      = '5px';
        this._visibilityRows  = []; // [{rowIndex, entity, expectedState, targetHeight}]
        this._cardElements    = []; // HA-provided pre-built card elements
        this._mediaQueryLists = []; // active MediaQueryList instances
        this._pendingAddArea  = null; // area name waiting for HA's card picker to save
        this._pendingEditCard = null; // { index, viewLayout } — preserves view_layout through card edit
        /** @type {any} */ this._editOverlayEl = null; // imperatively-created grid edit overlay element

        this._cardBarPos  = null;     // dragged card-mode bar position
        this._cardBarDrag = null;     // active drag state for the card-mode bar
        this._placementEditCard = null; // open per-card placement panel { index } | null
        this._placementAnchor   = null; // { top, left } overlay-relative anchor for the panel
        this._placementPos      = null; // { top, left } | null — dragged panel position
        this._placementDrag     = null; // active drag state for the placement panel
        // Unified pointer listeners (bound to the host) drive the floating drags
        // (card-mode bar + placement panel). Bound to the host rather than document
        // to avoid shadow-DOM issues.
        this._boundHostPointerMove = this._onHostPointerMove.bind(this);
        this._boundHostPointerUp   = this._onHostPointerUp.bind(this);
    }

    connectedCallback() {
        super.connectedCallback();
        this.addEventListener('pointermove', this._boundHostPointerMove);
        this.addEventListener('pointerup',   this._boundHostPointerUp);
        // Recompute fr row allocations whenever the host changes size (window resize,
        // sidebar toggle that changes our bounding box, devtools open/close).
        this._hostResizeObserver = new ResizeObserver(() => {
            if (this._resizeRaf) cancelAnimationFrame(this._resizeRaf);
            this._resizeRaf = requestAnimationFrame(() => {
                this._resizeRaf = null;
                this._applyVisibilityRowHeights();
            });
        });
        this._hostResizeObserver.observe(this);
    }

    _onHostPointerMove(e) {
        if (this._cardBarDrag)   this._cardBarDragMove(e);
        if (this._placementDrag) this._placementDragMove(e);
    }
    _onHostPointerUp(e) {
        if (this._cardBarDrag)   this._cardBarDragEnd(e);
        if (this._placementDrag) this._placementDragEnd(e);
    }

    /** Typed querySelector — returns HTMLElement so callers can access .style. */
    _qh(/** @type {string} */ sel) {
        if (!this.renderRoot) return null;
        return /** @type {HTMLElement|null} */ (this.renderRoot.querySelector(sel));
    }

    // ─────────────────────────────────────────────────────────────────────────
    // LovelaceViewElement interface
    // ─────────────────────────────────────────────────────────────────────────

    setConfig(config) {
        this._config = JSON.parse(JSON.stringify(config ?? {}));
        const { columns, rows, areas, gap } = parseLayoutConfig(this._config.layout);
        this._columns  = columns;
        this._baseRows = rows;
        this._rows     = rows;
        this._areas    = areas;
        this._gap      = gap;
        this._setupMediaQueries();
    }

    set hass(hass) {
        this._hass = hass;
        this._propagateHass();
        if (this._editOverlayEl) this._editOverlayEl.hass = hass;
        this._applyVisibilityRowHeights();
    }
    get hass() { return this._hass; }

    set lovelace(lovelace) {
        const prevCards = this._lovelace?.config?.views?.[this.index]?.cards;
        this._lovelace  = lovelace;
        const editMode  = !!(lovelace?.editMode);
        if (editMode !== this._editMode) {
            this._editMode    = editMode;
            this._editSubMode = 'grid'; // reset to grid editing on each edit session start
            if (editMode) this._primeCardPicker();
        }

        // HA saves card changes directly via lovelace.saveConfig — detect changes here.
        if (prevCards != null && lovelace?.config) {
            const newCards = lovelace.config.views?.[this.index]?.cards ?? [];

            // New card added via ll-create-card: inject grid-area into it
            if (this._pendingAddArea && newCards.length > prevCards.length) {
                const areaName = this._pendingAddArea;
                this._pendingAddArea = null;
                const updated = newCards.map((card, i) => {
                    if (i >= prevCards.length && !card?.view_layout?.['grid-area']) {
                        return { ...card, view_layout: { ...(card.view_layout ?? {}), 'grid-area': areaName } };
                    }
                    return card;
                });
                // Save via the serialized saver, which always rebases on the freshest
                // lovelace.config — this avoids the "Dashboard updated in another
                // session" error that a stale snapshot would trigger.
                const freshView = lovelace.config.views?.[this.index] ?? this._config;
                this._config = { ...freshView, cards: updated };
                this._saveConfig();
            }

            // Card edited: restore view_layout if HA stripped it during edit
            if (this._pendingEditCard && newCards.length === prevCards.length) {
                const { index: ci, viewLayout } = this._pendingEditCard;
                const editedCard = newCards[ci];
                if (editedCard && !editedCard?.view_layout?.['grid-area'] && viewLayout?.['grid-area']) {
                    this._pendingEditCard = null;
                    const updated = [...newCards];
                    updated[ci] = { ...editedCard, view_layout: { ...(editedCard.view_layout ?? {}), ...viewLayout } };
                    const freshView = lovelace.config.views?.[this.index] ?? this._config;
                    this._config = { ...freshView, cards: updated };
                    this._saveConfig();
                } else {
                    this._pendingEditCard = null;
                }
            }
        }
    }
    get lovelace() { return this._lovelace; }

    /**
     * HA calls this with pre-built card elements whenever the cards array changes.
     * We apply view_layout placement CSS and insert them into the grid.
     */
    set cards(cards) {
        this._cardElements = cards ?? [];
        this._placeCards();
    }
    get cards() { return this._cardElements; }

    // ─────────────────────────────────────────────────────────────────────────
    // Lifecycle
    // ─────────────────────────────────────────────────────────────────────────

    disconnectedCallback() {
        super.disconnectedCallback();
        this._teardownMediaQueries();
        this.removeEventListener('pointermove', this._boundHostPointerMove);
        this.removeEventListener('pointerup',   this._boundHostPointerUp);
        this._hostResizeObserver?.disconnect();
        this._hostResizeObserver = null;
        if (this._resizeRaf) { cancelAnimationFrame(this._resizeRaf); this._resizeRaf = null; }
        this._gridResizeObserver?.disconnect();
        this._gridResizeObserver = null;
        if (this._editOverlayEl) {
            this._editOverlayEl.remove();
            this._editOverlayEl = null;
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Card-mode bar drag (keeps the bar floating, like the grid toolbar)
    // ─────────────────────────────────────────────────────────────────────────

    _cardBarDragStart(e) {
        e.stopPropagation();
        const bar  = this._qh('.card-mode-bar');
        const rect = bar?.getBoundingClientRect();
        const oRect = this.getBoundingClientRect();
        e.currentTarget.setPointerCapture?.(e.pointerId);
        this._cardBarDrag = {
            offsetX: e.clientX - (rect?.left ?? 0),
            offsetY: e.clientY - (rect?.top ?? 0),
            oLeft: oRect.left,
            oTop: oRect.top,
        };
        bar?.classList.add('dragging');
    }
    _cardBarDragMove(e) {
        if (!this._cardBarDrag) return;
        const { offsetX, offsetY, oLeft, oTop } = this._cardBarDrag;
        this._cardBarPos = {
            left: e.clientX - oLeft - offsetX,
            top:  e.clientY - oTop  - offsetY,
        };
    }
    _cardBarDragEnd(_e) {
        if (!this._cardBarDrag) return;
        this._cardBarDrag = null;
        this._qh('.card-mode-bar')?.classList.remove('dragging');
    }

    _placementDragStart(e) {
        e.stopPropagation();
        const panel = this._qh('.placement-panel');
        const rect  = panel?.getBoundingClientRect();
        const host  = this.getBoundingClientRect();
        e.currentTarget.setPointerCapture?.(e.pointerId);
        this._placementDrag = {
            offsetX: e.clientX - (rect?.left ?? 0),
            offsetY: e.clientY - (rect?.top ?? 0),
            oLeft: host.left,
            oTop: host.top,
        };
        panel?.classList.add('dragging');
    }
    _placementDragMove(e) {
        if (!this._placementDrag) return;
        const { offsetX, offsetY, oLeft, oTop } = this._placementDrag;
        this._placementPos = {
            left: e.clientX - oLeft - offsetX,
            top:  e.clientY - oTop  - offsetY,
        };
    }
    _placementDragEnd(_e) {
        if (!this._placementDrag) return;
        this._placementDrag = null;
        this._qh('.placement-panel')?.classList.remove('dragging');
    }

    updated(changed) {
        if (changed.has('_config') || changed.has('_columns') || changed.has('_rows') || changed.has('_areas') || changed.has('_editSubMode') || changed.has('_editMode')) {
            this._placeCards();
        }
        this._syncEditOverlay();
        this._applyVisibilityRowHeights();
    }

    /**
     * Create / update / remove the grid edit overlay imperatively.
     *
     * The overlay is a globally-registered custom element. Rendering it via a Lit
     * template tag inside this view fails under HA's scoped-custom-element-registry
     * ("This instance is already constructed"). Using document.createElement uses the
     * GLOBAL registry directly, sidestepping the scoped construction path.
     */
    _syncEditOverlay() {
        const wantOverlay = this._editMode && this._editSubMode === 'grid';

        if (!wantOverlay) {
            if (this._editOverlayEl) {
                this._editOverlayEl.remove();
                this._editOverlayEl = null;
            }
            this._gridResizeObserver?.disconnect();
            this._gridResizeObserver = null;
            return;
        }

        // Create once
        if (!this._editOverlayEl) {
            const el = document.createElement('lcards-grid-edit-overlay');
            el.addEventListener('grid-state-changed',     (e) => this._onGridStateChanged(e));
            el.addEventListener('grid-preview-changed',   (e) => this._onGridPreviewChanged(e));
            el.addEventListener('area-cards-changed',     (e) => this._onAreaCardsChanged(e));
            el.addEventListener('add-card-to-area',       (e) => this._onAddCardToArea(e));
            el.addEventListener('layout-settings-changed',(e) => this._onLayoutSettingsChanged(e));
            el.addEventListener('area-settings-changed',  (e) => this._onAreaSettingsChanged(e));
            el.addEventListener('area-renamed',           (e) => this._onAreaRenamed(e));
            el.addEventListener('switch-to-cards-mode',   () => { this._editSubMode = 'cards'; });
            this.renderRoot.appendChild(el);
            this._editOverlayEl = el;

            // Mirror the real grid's resolved track sizes onto the overlay's ghost
            // grid so content-sized tracks (auto / min-content) stay aligned — the
            // empty ghost otherwise collapses those and the overlay drifts.
            const grid = this._qh('#grid-root');
            if (grid && !this._gridResizeObserver) {
                this._gridResizeObserver = new ResizeObserver(() => this._syncMeasureTracks());
                this._gridResizeObserver.observe(grid);
            }
        }

        // Push current state as properties
        const el = this._editOverlayEl;
        el.hass        = this._hass;
        el.columns     = this._columns;
        el.rows        = this._rows;
        el.areas       = this._areas;
        el.gap         = this._gap;
        el.cardConfigs = this._config?.cards ?? [];
        el.layout      = this._config?.layout ?? {};
        this._syncMeasureTracks();
    }

    /** Feed the overlay the real grid's resolved px track sizes so its ghost grid
     *  matches content-sized tracks (auto / min-content). */
    _syncMeasureTracks() {
        const overlay = this._editOverlayEl;
        const grid = this._qh('#grid-root');
        if (!overlay || !grid) return;
        const cs = getComputedStyle(grid);
        const cols = cs.gridTemplateColumns;
        const rows = cs.gridTemplateRows;
        if (cols && cols !== 'none') overlay.measureColumns = cols.trim().split(/\s+/);
        if (rows && rows !== 'none') overlay.measureRows = rows.trim().split(/\s+/);
        overlay.refresh?.();
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Rendering
    // ─────────────────────────────────────────────────────────────────────────

    static styles = css`
        :host {
            display: block;
            position: relative;
            width: 100%;
            overflow: hidden;
            box-sizing: border-box;
        }

        #grid-root {
            display: grid;
            box-sizing: border-box;
            /* grid-template-* and gap are set via inline style */
        }

        .empty-state {
            position: absolute;
            inset: 0;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: var(--ha-space-4, 16px);
            color: var(--secondary-text-color);
            pointer-events: none;
        }
        /* Per-area backing surface (background/border etc.) — sits beneath cards. */
        .area-surface {
            box-sizing: border-box;
            min-width: 0;
            min-height: 0;
            pointer-events: none;
            z-index: 0;
        }

        .empty-state ha-icon {
            --mdc-icon-size: 48px;
            opacity: 0.4;
        }
        .empty-state p {
            margin: 0;
            font-size: 14px;
            opacity: 0.7;
            text-align: center;
        }

        lcards-grid-edit-overlay {
            position: absolute;
            inset: 0;
            z-index: 100;
        }

        /* Card mode toolbar — floating + draggable (mirrors the grid toolbar). */
        .card-mode-bar {
            position: absolute;
            top: 12px;
            left: 50%;
            transform: translateX(-50%);
            z-index: 110;
            pointer-events: auto;
            display: flex;
            align-items: center;
            gap: 6px;
            padding: 8px 12px;
            background: color-mix(in oklab, var(--card-background-color, rgba(0,0,0,.6)) 88%, transparent);
            backdrop-filter: blur(12px) saturate(1.1);
            -webkit-backdrop-filter: blur(12px) saturate(1.1);
            border: var(--ha-border-width-sm, 1px) solid color-mix(in oklab, var(--divider-color, rgba(255,255,255,.1)) 60%, transparent);
            border-radius: var(--ha-border-radius-pill, 9999px);
            box-shadow: 0 4px 16px rgba(0,0,0,.35), inset 0 1px 0 rgba(255,255,255,.07);
            font-size: 12px;
            color: var(--secondary-text-color);
            white-space: nowrap;
        }
        .card-mode-bar.dragging { cursor: grabbing; }
        .card-mode-bar .drag-grip {
            display: flex;
            align-items: center;
            cursor: grab;
            color: var(--secondary-text-color);
            --mdc-icon-size: 18px;
            padding: 0 2px;
            opacity: 0.6;
            touch-action: none;
        }
        .card-mode-bar .drag-grip:hover { opacity: 1; }
        .card-mode-bar .bar-label {
            font-size: 13px;
            font-weight: 700;
            letter-spacing: 0.06em;
            text-transform: uppercase;
            color: var(--primary-text-color);
            padding: 0 2px;
        }
        .card-mode-bar .bar-hint {
            font-size: 13px;
            color: var(--secondary-text-color);
            padding: 0 2px;
        }
        .card-mode-bar .bar-sep {
            width: 1px;
            height: 20px;
            background: var(--divider-color, rgba(255,255,255,.12));
            margin: 0 2px;
        }
        .card-mode-bar .bar-btn {
            display: flex;
            align-items: center;
            justify-content: center;
            height: 36px;
            min-width: 36px;
            padding: 0 12px;
            gap: 5px;
            border: none;
            border-radius: var(--ha-border-radius-pill, 9999px);
            cursor: pointer;
            font-size: 13px;
            font-weight: 600;
            background: rgba(255,255,255,.08);
            color: var(--primary-text-color);
            transition: background var(--ha-animation-duration-fast,.15s), transform .08s ease;
        }
        .card-mode-bar .bar-btn:hover { background: rgba(255,255,255,.14); transform: translateY(-1px); }
        .card-mode-bar .bar-btn ha-icon { --mdc-icon-size: 16px; }
        .card-mode-bar .bar-btn.primary {
            background: var(--lcars-ui-primary, var(--primary-color));
            color: var(--text-primary-color, #fff);
        }
        .card-mode-bar .bar-btn.primary:hover { filter: brightness(1.1); }

        /* Empty-area "Add card" placeholder (card mode) */
        .card-add-placeholder {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: 6px;
            min-width: 0;
            min-height: 0;
            cursor: pointer;
            color: var(--lcars-ui-primary, var(--primary-color));
            background: color-mix(in oklab, var(--lcars-ui-primary, var(--primary-color)) 8%, transparent);
            border: var(--ha-border-width-md, 2px) dashed color-mix(in oklab, var(--lcars-ui-primary, var(--primary-color)) 55%, transparent);
            border-radius: var(--ha-border-radius-md, 8px);
            font-size: 13px;
            font-weight: 600;
            letter-spacing: 0.03em;
            transition: background var(--ha-animation-duration-fast,.15s), border-color var(--ha-animation-duration-fast,.15s);
        }
        .card-add-placeholder:hover {
            background: color-mix(in oklab, var(--lcars-ui-primary, var(--primary-color)) 18%, transparent);
            border-color: var(--lcars-ui-primary, var(--primary-color));
        }
        .card-add-placeholder ha-icon { --mdc-icon-size: 28px; }

        /* Card edit mode: each card slot gets an edit handle on hover */
        .card-edit-wrap {
            position: relative;
            min-width: 0;
            min-height: 0;
        }
        .card-edit-handle {
            position: absolute;
            top: 6px;
            right: 6px;
            z-index: 10;
            display: flex;
            align-items: center;
            gap: var(--ha-space-1, 4px);
            opacity: 0;
            visibility: hidden;
            transition: opacity var(--ha-animation-duration-fast,.15s) ease,
                        visibility 0s linear .15s;
            pointer-events: auto;
            /* Glassy pill wrapping the buttons */
            background: color-mix(in oklab, var(--card-background-color, rgba(0,0,0,.7)) 72%, transparent);
            backdrop-filter: blur(8px);
            -webkit-backdrop-filter: blur(8px);
            border: var(--ha-border-width-sm,1px) solid color-mix(in oklab, var(--divider-color) 60%, transparent);
            border-radius: var(--ha-border-radius-pill, 9999px);
            padding: var(--ha-space-1, 4px);
            box-shadow: var(--ha-box-shadow-s, 0 2px 8px rgba(0,0,0,.35));
        }
        .card-edit-wrap:hover .card-edit-handle {
            opacity: 1;
            visibility: visible;
            transition-delay: 0s;
        }
        .card-edit-wrap:hover {
            outline: 2px dashed color-mix(in oklab, var(--primary-color) 70%, transparent);
            outline-offset: 2px;
            border-radius: var(--ha-border-radius-md, 8px);
        }

        /* Per-card placement / spacing panel (card mode) */
        .placement-panel {
            position: absolute;
            z-index: 130;
            pointer-events: auto;
            background: color-mix(in oklab, var(--card-background-color, rgba(0,0,0,.85)) 94%, transparent);
            backdrop-filter: blur(12px);
            -webkit-backdrop-filter: blur(12px);
            border: var(--ha-border-width-sm, 1px) solid var(--divider-color);
            border-radius: var(--ha-border-radius-md, 8px);
            padding: 12px 14px;
            min-width: 240px;
            box-shadow: 0 4px 20px rgba(0,0,0,.4);
        }
        .placement-panel.dragging { cursor: grabbing; }
        .placement-header {
            display: flex;
            align-items: center;
            gap: 6px;
            margin-bottom: 10px;
        }
        .placement-header .drag-grip {
            display: flex;
            align-items: center;
            cursor: grab;
            color: var(--secondary-text-color);
            --mdc-icon-size: 18px;
            opacity: 0.6;
            touch-action: none;
        }
        .placement-header .drag-grip:hover { opacity: 1; }
        .placement-title {
            font-size: 11px;
            font-weight: 600;
            letter-spacing: 0.06em;
            text-transform: uppercase;
            color: var(--secondary-text-color);
        }
        .placement-field {
            display: flex;
            align-items: center;
            gap: 10px;
            margin-bottom: 8px;
        }
        .placement-field label {
            font-size: 12px;
            color: var(--primary-text-color);
            width: 64px;
            flex-shrink: 0;
        }
        .placement-field ha-selector,
        .placement-field ha-input { flex: 1; }
        .placement-actions {
            display: flex;
            justify-content: flex-end;
            margin-top: 6px;
            padding-top: 8px;
            border-top: var(--ha-border-width-sm, 1px) solid var(--divider-color);
        }
    `;

    render() {
        const layout = this._config?.layout ?? {};

        // Apply the layout height to the HOST element (not #grid-root). CSS Grid's track
        // sizing algorithm uses the parent-provided available block-size, not the element's
        // own height property. A self-imposed height (e.g. calc(100dvh - ...)) is treated
        // as infinite available block-size by the track sizing algorithm, collapsing
        // minmax(0,auto) rows to 0. Moving the height to :host makes it parent-provided
        // for #grid-root, so track sizing gets a definite 920px and minmax(0,auto) works.
        const hostHeight = layout.height ?? 'calc(100dvh - var(--header-height, 56px))';
        this.style.height = hostHeight;

        const gridStyle = buildGridStyle(layout, this._columns, this._rows, this._areas, this._gap, {
            withGutter: false, // Option B: headers float over first 28px of grid, no gutter reserved
            overflowY: 'clip',
            overrideHeight: '100%',  // #grid-root fills the host; host carries the actual height
        });
        const hasAreas  = getAreaNames(this._areas).length > 0;

        return html`
            <div id="grid-root" style="${gridStyle}"></div>
            ${!hasAreas && !this._editMode ? html`
                <div class="empty-state">
                    <ha-icon icon="mdi:grid-large"></ha-icon>
                    <p>Enter edit mode to build your layout</p>
                </div>
            ` : nothing}
            ${this._editMode && this._editSubMode === 'cards' ? html`
                <div
                    class="card-mode-bar"
                    style=${this._cardBarPos ? `top:${this._cardBarPos.top}px; left:${this._cardBarPos.left}px; right:auto; bottom:auto; transform:none;` : ''}
                >
                    <div class="drag-grip" @pointerdown=${this._cardBarDragStart} title="Drag to move">
                        <ha-icon icon="mdi:drag"></ha-icon>
                    </div>
                    <span class="bar-label">Card Mode</span>
                    <div class="bar-sep"></div>
                    <span class="bar-hint">Hover over a card to edit · empty areas show “Add card”</span>
                    <div class="bar-sep"></div>
                    <button
                        class="bar-btn primary"
                        title="Switch to layout editing"
                        @click=${() => { this._placementEditCard = null; this._editSubMode = 'grid'; }}
                    >
                        <ha-icon icon="mdi:grid"></ha-icon>
                        <span>Switch to Edit Layout</span>
                    </button>
                </div>
            ` : nothing}
            ${this._editMode && this._editSubMode === 'cards' && this._placementEditCard
                ? this._renderPlacementPanel()
                : nothing}
            <!-- grid edit overlay is created imperatively in _syncEditOverlay() to avoid
                 the scoped-custom-element-registry "already constructed" error that occurs
                 when a globally-registered element is nested via a Lit template tag inside
                 a view HA builds through its scoped registry. -->
        `;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Card placement
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Place HA-provided card elements into the grid.
     * Applies view_layout CSS properties directly to each card element.
     * Called whenever cards or layout changes.
     */
    _placeCards() {
        const grid = this._qh('#grid-root');
        if (!grid) return;

        grid.innerHTML = '';

        const layout       = this._config?.layout ?? {};
        const cardMargin   = layout.card_margin ?? null;
        const cardOverflow = layout.card_overflow ?? 'visible';
        const cardMode     = this._editMode && this._editSubMode === 'cards';

        // Per-area backing surfaces (background/border etc.) — rendered first so
        // cards paint above their own area surface by DOM order.
        renderAreaSurfaces(grid, layout, this._areas);

        (this._cardElements ?? []).forEach((cardEl, cardIndex) => {
            const viewLayout = cardEl.config?.view_layout ?? {};
            // Per-card visibility is handled by HA's hui-card wrapper (the card's
            // native Visibility conditions), so we always place the element.

            const areaSettings = layout.areas?.[viewLayout['grid-area']] ?? {};

            if (cardMode) {
                // In card edit mode, wrap with an edit handle overlay. The wrapper
                // becomes the grid item, so placement (grid-area, alignment, margin,
                // z-index) is applied to the wrapper; overflow stays on the card.
                const wrap = document.createElement('div');
                wrap.className = 'card-edit-wrap';
                applyCardPlacement(wrap, cardEl, viewLayout, cardMargin, cardOverflow, areaSettings);
                applyGridItemHeight(wrap, cardEl.config);

                const handle = document.createElement('div');
                handle.className = 'card-edit-handle';

                function makeHaButton(icon, label, variant) {
                    const btn = document.createElement('ha-button');
                    if (variant) btn.setAttribute('variant', variant);
                    btn.innerHTML = `<ha-icon icon="${icon}" slot="start"></ha-icon>${label}`;
                    return btn;
                }
                const editBtn   = makeHaButton('mdi:pencil',          'Edit',   null);
                const placeBtn  = makeHaButton('mdi:tune-variant',     'Place',  null);
                const deleteBtn = makeHaButton('mdi:delete-outline',   'Delete', 'danger');
                editBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    this._editCard(cardIndex);
                });
                placeBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    this._openPlacementEditor(cardIndex, wrap);
                });
                deleteBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    this._deleteCardByIndex(cardIndex);
                });
                handle.appendChild(editBtn);
                handle.appendChild(placeBtn);
                handle.appendChild(deleteBtn);

                // Edge avoidance: reposition handle so it doesn't get clipped by the
                // host's overflow:hidden when the card is near a layout boundary.
                // Must use 'auto' (not '') when cancelling the opposite CSS property —
                // clearing to '' reverts to the CSS value, leaving both sides set and
                // collapsing the element width to containing-block-width minus both offsets.
                wrap.addEventListener('pointerenter', () => {
                    const host = this.getBoundingClientRect();
                    const hr   = handle.getBoundingClientRect();
                    // Flip left-anchored if handle extends past host's left edge
                    if (hr.left < host.left + 4) {
                        handle.style.right = 'auto';
                        handle.style.left  = '6px';
                    }
                    // Flip bottom-anchored if handle extends past host's bottom edge
                    if (hr.bottom > host.bottom - 4) {
                        handle.style.top    = 'auto';
                        handle.style.bottom = '6px';
                    }
                });
                wrap.addEventListener('pointerleave', () => {
                    handle.style.left = handle.style.right = handle.style.top = handle.style.bottom = '';
                });

                wrap.appendChild(cardEl);
                wrap.appendChild(handle);
                grid.appendChild(wrap);
            } else {
                // Outside card mode the card element itself is the grid item.
                applyCardPlacement(cardEl, cardEl, viewLayout, cardMargin, cardOverflow, areaSettings);
                applyGridItemHeight(cardEl, cardEl.config);
                grid.appendChild(cardEl);
            }
        });

        // In card mode, give every named area that has no card an "Add card"
        // placeholder so cards can be added without switching back to grid mode.
        if (cardMode) {
            const occupied = new Set(
                (this._config?.cards ?? [])
                    .map(c => c?.view_layout?.['grid-area'])
                    .filter(Boolean)
            );
            for (const name of getAreaNames(this._areas)) {
                if (occupied.has(name)) continue;
                const placeholder = document.createElement('button');
                placeholder.className = 'card-add-placeholder';
                placeholder.style.gridArea = name;
                placeholder.title = `Add card to "${name}"`;
                placeholder.innerHTML = `<ha-icon icon="mdi:plus"></ha-icon><span>Add card</span>`;
                placeholder.addEventListener('click', (e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    this._addCardToArea(name);
                });
                grid.appendChild(placeholder);
            }
        }

        this._collectVisibilityRows();
        this._applyVisibilityRowHeights();
    }

    /**
     * Scan placed cards for state-visibility conditions that govern entire rows.
     * Fills this._visibilityRows with {rowIndex, entity, expectedState, targetHeight}.
     * Called after every card placement so the list stays in sync.
     */
    _collectVisibilityRows() {
        this._visibilityRows = [];
        if (!this._areas?.length) return;
        for (const cardEl of (this._cardElements ?? [])) {
            const config = cardEl.config;
            if (!config) continue;
            const area       = config.view_layout?.['grid-area'];
            const visibility = config.visibility;
            if (!area || !visibility?.length) continue;
            const rowIndex = this._areas.findIndex(row => row.includes(area));
            if (rowIndex === -1) continue;
            // Only forward a definite viewport/pixel height (same rule as applyGridItemHeight).
            const h = config.layout?.height;
            if (!h || h === 'auto' || h === '100%') continue;
            for (const cond of visibility) {
                if (cond.condition === 'state' && cond.entity && cond.state != null) {
                    this._visibilityRows.push({
                        rowIndex,
                        entity: cond.entity,
                        expectedState: String(cond.state),
                        targetHeight: h,
                    });
                    break;
                }
            }
        }
    }

    /**
     * Evaluate current entity states and update grid-template-rows directly on
     * the DOM node — bypassing Lit's render cycle to avoid feedback loops.
     *
     * CSS Grid's track sizing algorithm treats a self-imposed height (height: calc(100dvh - ...))
     * as infinite available block-size, so `1fr` expands to max-content instead of filling the
     * remaining space. We resolve this in JS: temporarily write `0px` for fr tracks (so the
     * browser correctly sizes all clamp/vh/px tracks), read those back, compute the leftover
     * space, then write explicit px values for every fr track.
     */
    _applyVisibilityRowHeights() {
        const grid = this._qh('#grid-root');
        if (!grid) return;

        const rows = [...this._baseRows];

        // In edit mode HA shows all cards regardless of visibility conditions,
        // so expand every visibility-controlled row to its target height.
        for (const { rowIndex, entity, expectedState, targetHeight } of (this._visibilityRows ?? [])) {
            const state = this._hass?.states?.[entity]?.state;
            rows[rowIndex] = (this._editMode || state === expectedState) ? targetHeight : '0px';
        }

        // Identify fr tracks in the resolved rows.
        const frTracks = [];
        let totalFR = 0;
        rows.forEach((r, i) => {
            const m = String(r).match(/^([0-9.]+)fr$/);
            if (m) { frTracks.push({ index: i, units: parseFloat(m[1]) }); totalFR += parseFloat(m[1]); }
        });

        if (frTracks.length === 0) {
            grid.style.gridTemplateRows = rows.join(' ');
            return;
        }

        // Available height of the host element (provided by HA's parent container).
        const available = this.getBoundingClientRect().height;
        if (available <= 0) {
            // Host not yet laid out — write rows as-is and retry after render.
            grid.style.gridTemplateRows = rows.join(' ');
            return;
        }

        // Write fr tracks as 0px so clamp/vh/px rows compute their natural sizes.
        const tempRows = rows.map(r => /^[0-9.]+fr$/.test(String(r)) ? '0px' : r);
        grid.style.gridTemplateRows = tempRows.join(' ');

        // Force reflow and read back computed px values for every row.
        const computedPx = getComputedStyle(grid).gridTemplateRows
            .split(/\s+/).map(v => parseFloat(v) || 0);

        // Sum the non-fr row heights and the inter-row gaps.
        let fixedTotal = 0;
        rows.forEach((r, i) => {
            if (!/^[0-9.]+fr$/.test(String(r))) fixedTotal += computedPx[i] ?? 0;
        });
        const gap = parseFloat(getComputedStyle(grid).rowGap) || 0;
        const gapTotal = (rows.length - 1) * gap;

        const frSpace = Math.max(0, available - fixedTotal - gapTotal);

        // Replace each fr track with its allocated px.
        for (const { index, units } of frTracks) {
            rows[index] = Math.round(frSpace * units / totalFR) + 'px';
        }

        grid.style.gridTemplateRows = rows.join(' ');
    }

    /**
     * Open the per-card placement panel. Defaults to one side of the card (right,
     * flipping to the left if there's no room) so it doesn't cover the card being
     * edited; from there it's freely draggable via its grip.
     */
    _openPlacementEditor(cardIndex, anchorEl) {
        const host = this.getBoundingClientRect();
        const r = anchorEl?.getBoundingClientRect();
        const panelW = 260;
        const gap = 8;
        if (r) {
            // Prefer the right side of the card; flip left if it would overflow.
            let left = (r.right - host.left) + gap;
            if (left + panelW > host.width - 4) {
                left = (r.left - host.left) - panelW - gap;
            }
            left = Math.max(4, Math.min(left, host.width - panelW - 4));
            const top = Math.max(4, Math.min(r.top - host.top, host.height - 180));
            this._placementAnchor = { top, left };
        } else {
            this._placementAnchor = { top: 60, left: 16 };
        }
        this._placementPos = null; // start from the anchor; user can drag from there
        this._placementEditCard = { index: cardIndex };
    }

    /** Write align-self + justify-self for a card, using place-self shorthand when both axes match. */
    _setAlignment(cardIndex, v, h) {
        if (v === h) {
            this._updateCardViewLayout(cardIndex, 'place-self',   v === 'stretch' ? undefined : v);
            this._updateCardViewLayout(cardIndex, 'align-self',   undefined);
            this._updateCardViewLayout(cardIndex, 'justify-self', undefined);
        } else {
            this._updateCardViewLayout(cardIndex, 'place-self',   undefined);
            this._updateCardViewLayout(cardIndex, 'align-self',   v === 'stretch' ? undefined : v);
            this._updateCardViewLayout(cardIndex, 'justify-self', h === 'stretch' ? undefined : h);
        }
    }

    /** Commit a single view_layout key for a card (empty/undefined removes it). */
    _updateCardViewLayout(cardIndex, key, value) {
        const cards = [...(this._config?.cards ?? [])];
        const card = cards[cardIndex];
        if (!card) return;
        const vl = { ...(card.view_layout ?? {}) };
        if (value == null || value === '') delete vl[key];
        else vl[key] = value;
        cards[cardIndex] = { ...card, view_layout: vl };
        this._config = { ...this._config, cards };
        this._saveConfig();
    }

    _renderPlacementPanel() {
        const idx  = this._placementEditCard?.index;
        const card = this._config?.cards?.[idx];
        if (card == null) return nothing;
        const vl    = card.view_layout ?? {};
        const label = (card.type ?? 'card').replace('custom:', '');
        const pos   = this._placementPos ?? this._placementAnchor ?? { top: 60, left: 16 };
        const defaultMargin = this._config?.layout?.card_margin ?? 'inherit';

        return html`
            <div class="placement-panel" style="top:${pos.top}px; left:${pos.left}px;">
                <div class="placement-header">
                    <div class="drag-grip" @pointerdown=${this._placementDragStart} title="Drag to move">
                        <ha-icon icon="mdi:drag"></ha-icon>
                    </div>
                    <div class="placement-title">Placement — ${label}</div>
                </div>
                <div class="placement-field">
                    <label>Align ↕</label>
                    <ha-selector
                        .hass=${this._hass}
                        .selector=${{ select: { mode: 'dropdown', options: ALIGN_V_OPTIONS } }}
                        .value=${vl['align-self'] ?? vl['place-self'] ?? 'stretch'}
                        @value-changed=${(e) => {
                            const v = e.detail.value;
                            const h = vl['justify-self'] ?? vl['place-self'] ?? 'stretch';
                            this._setAlignment(idx, v, h);
                        }}
                    ></ha-selector>
                </div>
                <div class="placement-field">
                    <label>Align ↔</label>
                    <ha-selector
                        .hass=${this._hass}
                        .selector=${{ select: { mode: 'dropdown', options: ALIGN_H_OPTIONS } }}
                        .value=${vl['justify-self'] ?? vl['place-self'] ?? 'stretch'}
                        @value-changed=${(e) => {
                            const v = vl['align-self'] ?? vl['place-self'] ?? 'stretch';
                            const h = e.detail.value;
                            this._setAlignment(idx, v, h);
                        }}
                    ></ha-selector>
                </div>
                <div class="placement-field">
                    <label>Margin</label>
                    <ha-input
                        .value=${vl.margin ?? ''}
                        placeholder=${defaultMargin}
                        title="Space around the card within its area (e.g. 4px, 0)"
                        @change=${(e) => this._updateCardViewLayout(idx, 'margin', e.target.value || undefined)}
                    ></ha-input>
                </div>
                <div class="placement-field">
                    <label>Overflow X</label>
                    <ha-selector
                        .hass=${this._hass}
                        .selector=${{ select: { mode: 'dropdown', options: PLACEMENT_OVERFLOW_OPTIONS } }}
                        .value=${vl['overflow-x'] ?? vl.overflow ?? 'visible'}
                        @value-changed=${(e) => {
                            const v = e.detail.value;
                            const y = this._placementEditCard?.config?.view_layout?.['overflow-y']
                                   ?? this._placementEditCard?.config?.view_layout?.overflow
                                   ?? 'visible';
                            if (v === y) {
                                this._updateCardViewLayout(idx, 'overflow',   v === 'visible' ? undefined : v);
                                this._updateCardViewLayout(idx, 'overflow-x', undefined);
                                this._updateCardViewLayout(idx, 'overflow-y', undefined);
                            } else {
                                this._updateCardViewLayout(idx, 'overflow',   undefined);
                                this._updateCardViewLayout(idx, 'overflow-x', v === 'visible' ? undefined : v);
                            }
                        }}
                    ></ha-selector>
                </div>
                <div class="placement-field">
                    <label>Overflow Y</label>
                    <ha-selector
                        .hass=${this._hass}
                        .selector=${{ select: { mode: 'dropdown', options: PLACEMENT_OVERFLOW_OPTIONS } }}
                        .value=${vl['overflow-y'] ?? vl.overflow ?? 'visible'}
                        @value-changed=${(e) => {
                            const v = e.detail.value;
                            const x = this._placementEditCard?.config?.view_layout?.['overflow-x']
                                   ?? this._placementEditCard?.config?.view_layout?.overflow
                                   ?? 'visible';
                            if (v === x) {
                                this._updateCardViewLayout(idx, 'overflow',   v === 'visible' ? undefined : v);
                                this._updateCardViewLayout(idx, 'overflow-x', undefined);
                                this._updateCardViewLayout(idx, 'overflow-y', undefined);
                            } else {
                                this._updateCardViewLayout(idx, 'overflow',   undefined);
                                this._updateCardViewLayout(idx, 'overflow-y', v === 'visible' ? undefined : v);
                            }
                        }}
                    ></ha-selector>
                </div>
                <div class="placement-actions">
                    <ha-button @click=${() => { this._placementEditCard = null; }}>Done</ha-button>
                </div>
            </div>
        `;
    }

    _editCard(cardIndex) {
        // Fire HA's edit-card event. HA's hui-root handler expects a full
        // LovelaceCardPath of [viewIndex, cardIndex] for a standard view.
        const card = this._config?.cards?.[cardIndex];
        if (!card) return;
        // Store view_layout so we can restore it if HA's editor strips it on save.
        this._pendingEditCard = { index: cardIndex, viewLayout: card.view_layout };
        this.dispatchEvent(new CustomEvent('ll-edit-card', {
            bubbles: true,
            composed: true,
            detail: { path: [this.index, cardIndex] },
        }));
    }

    async _deleteCardByIndex(cardIndex) {
        const card  = this._config?.cards?.[cardIndex];
        const label = (card?.type ?? 'card').replace('custom:', '');
        const confirmed = await showConfirmDeleteDialog({
            title: 'Remove card?',
            message: `Remove the "${label}" card from this layout? This cannot be undone.`,
            confirmText: 'Remove',
        });
        if (!confirmed) return;
        const cards = [...(this._config?.cards ?? [])];
        cards.splice(cardIndex, 1);
        this._config = { ...this._config, cards };
        this._saveConfig();
    }

    /**
     * Begin adding a card to the named area. Sets the pending area (so the
     * lovelace setter can inject view_layout.grid-area once HA saves the new
     * card) and opens HA's native card picker. Shared by the grid overlay's
     * "add card" action and the card-mode empty-area placeholders.
     * @param {string} areaName
     */
    _addCardToArea(areaName) {
        this._pendingAddArea = areaName;
        this.dispatchEvent(new CustomEvent('ll-create-card', {
            bubbles: true,
            composed: true,
            detail: { suggested: [] },
        }));
    }

    _propagateHass() {
        if (!this._hass || !this._cardElements) return;
        for (const cardEl of this._cardElements) {
            try {
                if (typeof cardEl.setHass === 'function') cardEl.setHass(this._hass);
                else cardEl.hass = this._hass;
            } catch { /* ignore */ }
        }
    }

    /**
     * Prime HA's lazily-loaded `hui-card-picker` so the layout-card studio's card
     * picker works for cards placed inside this view.
     *
     * HA only registers `hui-card-picker` after its create-card dialog has opened
     * once. The dialog is opened by `showCreateCardDialog`, which HA wires to the
     * `ll-create-card` event — but the listener lives on the view's *layout
     * element*, which (for a custom view) IS this element. So firing the event on
     * ourselves reaches HA's handler and loads the picker; we then close the dialog
     * HA opened. Runs once per session (skips if already registered). A nested
     * layout-card placed in a non-lcards view won't be primed and falls back to the
     * studio's "card picker not ready" message.
     */
    _primeCardPicker() {
        if (customElements.get('hui-card-picker')) return; // already available

        // Defer one frame so HA's hui-view has attached its ll-create-card listener
        // to this layout element before we fire. Not flagged as "done" — if this
        // attempt is too early it simply retries the next time edit mode is entered.
        requestAnimationFrame(() => {
            if (customElements.get('hui-card-picker') || !this._editMode) return;

            this.dispatchEvent(new CustomEvent('ll-create-card', {
                bubbles: true, composed: true, detail: { suggested: [] },
            }));

            // Close the create-card dialog HA opens while priming, as soon as it appears.
            let tries = 0;
            const tryClose = () => {
                const dlg = document.querySelector('home-assistant')?.shadowRoot
                    ?.querySelector('hui-dialog-create-card');
                if (dlg) {
                    try { (/** @type {any} */ (dlg)).closeDialog?.(); } catch { /* ignore */ }
                    try { dlg.remove(); } catch { /* ignore */ }
                    lcardsLog.debug('[LCARSLayoutView] card picker primed');
                    return;
                }
                if (tries++ < 25) setTimeout(tryClose, 60);
            };
            tryClose();
        });
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Media query handling for responsive layouts
    // ─────────────────────────────────────────────────────────────────────────

    _setupMediaQueries() {
        this._teardownMediaQueries();
        const mediaquery = this._config?.layout?.mediaquery;
        if (!mediaquery || typeof mediaquery !== 'object') return;

        for (const [query, overrideLayout] of Object.entries(mediaquery)) {
            try {
                const mql = window.matchMedia(query);
                const handler = () => this._applyMediaQueryOverrides();
                mql.addEventListener('change', handler);
                this._mediaQueryLists.push({ mql, handler });
            } catch { /* ignore invalid queries */ }
        }
    }

    _teardownMediaQueries() {
        for (const { mql, handler } of this._mediaQueryLists) {
            mql.removeEventListener('change', handler);
        }
        this._mediaQueryLists = [];
    }

    _applyMediaQueryOverrides() {
        const grid = this._qh('#grid-root');
        if (!grid) return;

        const baseLayout   = this._config?.layout ?? {};
        const mediaquery   = baseLayout.mediaquery ?? {};

        // Start fresh from the editor-state values
        let cols  = this._columns.join(' ');
        let rows  = this._rows.join(' ');
        let areas = this._areas.map(r => `"${r.join(' ')}"`).join(' ');
        let gap   = this._gap;

        // Apply any matching media query overrides
        for (const [query, override] of Object.entries(mediaquery)) {
            try {
                if (window.matchMedia(query).matches) {
                    if (override['grid-template-columns']) cols  = override['grid-template-columns'];
                    if (override['grid-template-rows'])    rows  = override['grid-template-rows'];
                    if (override['grid-template-areas'])   areas = override['grid-template-areas'];
                    if (override['grid-gap'] || override.gap) gap = override['grid-gap'] ?? override.gap;
                }
            } catch { /* ignore */ }
        }

        grid.style.gridTemplateColumns = cols;
        grid.style.gridTemplateRows    = rows;
        grid.style.gridTemplateAreas   = areas;
        grid.style.gap                 = gap;
        // Cards keep their grid-area and reflow automatically; no re-placement
        // needed. Per-card visibility is HA's hui-card responsibility.
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Edit overlay event handlers
    // ─────────────────────────────────────────────────────────────────────────

    /** Live drag feedback — update grid style immediately without saving to config. */
    _onGridPreviewChanged(ev) {
        ev.stopPropagation();
        const { columns, rows, gap } = ev.detail;
        const grid = this._qh('#grid-root');
        if (!grid) return;
        if (columns) grid.style.gridTemplateColumns = columns.join(' ');
        if (rows)    grid.style.gridTemplateRows    = rows.join(' ');
        if (gap)     grid.style.gap                 = gap;
    }

    _onGridStateChanged(ev) {
        ev.stopPropagation();
        const { columns, rows, areas, gap } = ev.detail;
        this._columns  = columns;
        this._baseRows = rows;
        this._rows     = rows;
        this._areas    = areas;
        this._gap      = gap ?? this._gap;

        let newLayout = serializeLayoutConfig(
            columns, rows, areas, gap ?? this._gap,
            this._config?.layout ?? {}
        );
        // Drop per-area settings for areas that no longer exist (deleted area, or an
        // area removed by a track deletion). Renames are migrated by _onAreaRenamed
        // before this fires, so the new name is already present and preserved.
        if (newLayout.areas) {
            newLayout = { ...newLayout, areas: pruneAreaSettings(newLayout.areas, getAreaNames(areas)) };
        }
        this._config = { ...this._config, layout: newLayout };
        this._saveConfig();
    }

    /**
     * Migrate per-area settings when an area is renamed. Fired by the overlay
     * BEFORE the accompanying grid-state-changed, so the subsequent serialize +
     * prune keeps the settings under the new name. Updates config without saving;
     * the grid-state-changed handler performs the save.
     */
    _onAreaRenamed(ev) {
        ev.stopPropagation();
        const { from, to } = ev.detail ?? {};
        const layout = this._config?.layout;
        if (!layout?.areas || layout.areas[from] === undefined) return;
        this._config = {
            ...this._config,
            layout: { ...layout, areas: renameAreaSettings(layout.areas, from, to) },
        };
    }

    /** Merge one per-area setting (empty value removes the key; empty area removed). */
    _onAreaSettingsChanged(ev) {
        ev.stopPropagation();
        const { name, key, value } = ev.detail ?? {};
        if (!name || !key) return;
        const layout = this._config?.layout ?? {};
        const areas  = { ...(layout.areas ?? {}) };
        const areaSettings = { ...(areas[name] ?? {}) };
        if (value == null || value === '') delete areaSettings[key];
        else areaSettings[key] = value;
        if (Object.keys(areaSettings).length > 0) areas[name] = areaSettings;
        else delete areas[name];
        this._config = { ...this._config, layout: { ...layout, areas } };
        this._saveConfig();
    }

    _onAreaCardsChanged(ev) {
        ev.stopPropagation();
        // Overlay emits the full updated cards array with corrected view_layout
        const { cards } = ev.detail;
        this._config = { ...this._config, cards };
        this._saveConfig();
        // HA will re-provide built card elements after config is saved
    }

    _onLayoutSettingsChanged(ev) {
        ev.stopPropagation();
        this._config = { ...this._config, layout: ev.detail.layout };
        this._saveConfig();
    }

    _onAddCardToArea(ev) {
        ev.stopPropagation();
        // Fire HA's native add-card event — opens hui-dialog-create-card.
        // HA saves the result directly to lovelace config (bypassing events).
        // The lovelace setter above detects the newly added card and injects
        // view_layout['grid-area'] = areaName, then saves again.
        this._addCardToArea(ev.detail.areaName);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Persistence
    // ─────────────────────────────────────────────────────────────────────────

    _saveConfig() {
        return this._saveViewConfig({ ...this._config });
    }

    /**
     * Serialized lovelace save. Concurrent/rapid edits (resize drag commit,
     * area create, then a card add) were racing each other and saving against a
     * stale lovelace version → HA's "Dashboard updated in another session"
     * warning. This funnels every save through a single in-flight chain and
     * always rebases on the LATEST this._lovelace.config at the moment the save
     * actually runs, so each write carries the current version.
     *
     * @param {object} viewConfig  the full view config to write at this.index
     * @returns {Promise<void>}
     */
    _saveViewConfig(viewConfig) {
        if (!this._lovelace?.saveConfig) {
            lcardsLog.warn('[LCARSLayoutView] lovelace.saveConfig not available');
            return Promise.resolve();
        }
        // Latest desired view config; a running chain picks this up.
        this._pendingViewConfig = viewConfig;
        if (this._saveChain) return this._saveChain;

        this._saveChain = (async () => {
            try {
                while (this._pendingViewConfig) {
                    const cfg = this._pendingViewConfig;
                    this._pendingViewConfig = null;
                    const base = this._lovelace?.config;
                    if (!base || !this._lovelace?.saveConfig) break;
                    const views = [...(base.views ?? [])];
                    if (this.index != null && this.index < views.length) {
                        views[this.index] = cfg;
                    }
                    await this._lovelace.saveConfig({ ...base, views });
                }
            } catch (e) {
                lcardsLog.warn('[LCARSLayoutView] saveConfig failed', { error: e?.message });
            } finally {
                this._saveChain = null;
            }
        })();
        return this._saveChain;
    }

    getCardSize() { return 1; }
}
