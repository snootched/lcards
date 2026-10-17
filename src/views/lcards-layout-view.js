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

import { LitElement, html, css, nothing, render as renderTemplate } from 'lit';
import { lcardsLog } from '../utils/lcards-logging.js';
import { showConfirmDeleteDialog } from './layout-edit-dialogs.js';
import {
    parseLayoutConfig,
    serializeLayoutConfig,
    getAreaNames,
    renameAreaSettings,
    pruneAreaSettings,
    resolveVisibilityRowTracks,
    EDIT_BAR_HEIGHT,
} from './layout-grid-utils.js';
import {
    buildGridStyle,
    measureGridFrame,
    applyCardPlacement,
    applyGridItemHeight,
    renderAreaSurfaces,
} from './layout-render.js';
import {
    ICON,
    editBarStyles,
    editPanelStyles,
    editDockStyles,
    EDIT_DOCK_WIDTH,
    DOCK_SHEET_BREAKPOINT,
    renderModeToggle,
    renderBarHint,
    renderPanelHeader,
} from './layout-edit-chrome.js';

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
    { value: 'visible', label: 'Visible: bleeds beyond cell' },
    { value: 'clip',    label: 'Clip: hard clip, no scroll' },
    { value: 'hidden',  label: 'Hidden: clip + block context' },
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
        _placementEditCard: { state: true }, // { index } | null — open per-card placement panel
        _overlayDockOpen: { state: true },   // the grid overlay's dock is open
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
        /** @type {'grid'|'cards'} */
        this._editSubMode = 'grid'; // reset to grid mode each time edit mode activates
        this._columns  = ['1fr', '1fr', '1fr'];
        this._rows     = ['1fr', '1fr', '1fr'];
        this._baseRows = ['1fr', '1fr', '1fr']; // rows from config, never modified by visibility logic
        this._areas    = Array(3).fill(null).map(() => Array(3).fill('.'));
        this._gap      = '5px';
        this._visibilityRows  = []; // [{rowIndex, cardEl, targetHeight}]
        this._cardElements    = []; // HA-provided pre-built card elements
        this._mediaQueryLists = []; // active MediaQueryList instances
        this._pendingAddArea  = null; // area name waiting for HA's card picker to save
        this._pendingEditCard = null; // { index, viewLayout } — preserves view_layout through card edit
        /** @type {any} */ this._editOverlayEl = null; // imperatively-created grid edit overlay element

        /** @type {Record<string, number>} area name → card index whose controls are in front (card mode) */
        this._stackFocus = {};
        /** @type {{index: number} | null} */
        this._placementEditCard = null; // card whose placement is in the dock
        this._overlayDockOpen   = false;
        // Touch: the first tap on a card shows its edit controls (no hover on touch).
        this._boundDocPointerDown  = this._onDocPointerDown.bind(this);
        // hui-card fires a bubbling, composed `card-visibility-changed` whenever it
        // hides/shows itself (same signal hui-section listens to).
        this._boundCardVisibilityChanged = () => this._scheduleRowHeights();
    }

    connectedCallback() {
        super.connectedCallback();
        document.addEventListener('pointerdown', this._boundDocPointerDown, true);
        this.addEventListener('card-visibility-changed', this._boundCardVisibilityChanged);
        // Recompute fr row allocations whenever the host changes size (window resize,
        // sidebar toggle that changes our bounding box, devtools open/close).
        this._hostResizeObserver = new ResizeObserver(() => this._scheduleRowHeights());
        this._hostResizeObserver.observe(this);
        // disconnectedCallback removed the edit overlay; a re-attached view (moved
        // in the DOM) recreates it in updated() -> _syncEditOverlay().
        if (this.hasUpdated) this.requestUpdate();
    }

    /** rAF-debounced _applyVisibilityRowHeights() (resize + card visibility changes). */
    _scheduleRowHeights() {
        if (this._resizeRaf) cancelAnimationFrame(this._resizeRaf);
        this._resizeRaf = requestAnimationFrame(() => {
            this._resizeRaf = null;
            this._applyVisibilityRowHeights();
        });
    }

    /** Card mode on touch: a tap on a card reveals its controls; a tap elsewhere hides them. */
    _onDocPointerDown(/** @type {PointerEvent} */ e) {
        if (!this._editMode || this._editSubMode !== 'cards') return;
        const wrap = e.composedPath().find(n => n instanceof HTMLElement && n.classList.contains('card-edit-wrap'));
        for (const w of this.renderRoot.querySelectorAll('.card-edit-wrap.touched')) {
            if (w !== wrap) w.classList.remove('touched');
        }
        if (wrap && e.pointerType !== 'mouse') /** @type {HTMLElement} */ (wrap).classList.add('touched');
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
        // hui-view already sets hass on every card element before the view itself.
        this._hass = hass;
        if (this._editOverlayEl) this._editOverlayEl.hass = hass;
        if (this._editMode) this._subscribeSaveEvents();
        // No row recompute here: visibility-driven rows follow hui-card's own
        // `card-visibility-changed` event (see connectedCallback), so entity
        // updates don't force a layout read on every state change.
    }
    get hass() { return this._hass; }

    set lovelace(lovelace) {
        const prevCards = this._lovelace?.config?.views?.[this.index]?.cards;
        // A config change (ours or HA's, e.g. its card editor saving) is followed
        // by a lovelace_updated event; _waitForSaveEvent() holds our next save
        // until it arrives (see _saveViewConfig).
        if (this._lovelace && lovelace?.config !== this._lovelace.config) this._lastConfigChangeAt = performance.now();
        this._lovelace  = lovelace;
        const editMode  = !!(lovelace?.editMode);
        if (editMode) this._subscribeSaveEvents();
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
        document.removeEventListener('pointerdown', this._boundDocPointerDown, true);
        this.removeEventListener('card-visibility-changed', this._boundCardVisibilityChanged);
        this._hostResizeObserver?.disconnect();
        this._hostResizeObserver = null;
        this._saveEventsUnsub?.then((/** @type {any} */ unsub) => unsub?.()).catch(() => {});
        this._saveEventsUnsub = null;
        if (this._resizeRaf) { cancelAnimationFrame(this._resizeRaf); this._resizeRaf = null; }
        this._gridResizeObserver?.disconnect();
        this._gridResizeObserver = null;
        if (this._editOverlayEl) {
            this._editOverlayEl.remove();
            this._editOverlayEl = null;
        }
    }

    updated(changed) {
        if (changed.has('_config') || changed.has('_columns') || changed.has('_rows') || changed.has('_areas') || changed.has('_editSubMode') || changed.has('_editMode')) {
            this._placeCards();
        }
        this._syncEditOverlay();
        // While a dock is open the grid narrows by its width (see :host([dock-open])).
        const cards = this._editMode && this._editSubMode === 'cards';
        this.toggleAttribute('dock-open', this._editMode && (cards ? !!this._placementEditCard : this._overlayDockOpen));
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
                this._overlayDockOpen = false;
            }
            this._gridResizeObserver?.disconnect();
            this._gridResizeObserver = null;
            return;
        }

        // Create once
        if (!this._editOverlayEl) {
            // The overlay (and the editor components it uses) loads on first edit;
            // the element upgrades when its definition arrives, keeping properties
            // set before then.
            import('./lcards-grid-edit-overlay.js').catch(error =>
                lcardsLog.error('[LCARdSLayoutView] Failed to load the grid edit overlay:', error));
            const el = document.createElement('lcards-grid-edit-overlay');
            el.addEventListener('grid-state-changed',     (e) => this._onGridStateChanged(e));
            el.addEventListener('grid-preview-changed',   (e) => this._onGridPreviewChanged(e));
            el.addEventListener('area-cards-changed',     (e) => this._onAreaCardsChanged(e));
            el.addEventListener('add-card-to-area',       (e) => this._onAddCardToArea(e));
            el.addEventListener('layout-settings-changed',(e) => this._onLayoutSettingsChanged(e));
            el.addEventListener('area-settings-changed',  (e) => this._onAreaSettingsChanged(e));
            el.addEventListener('area-renamed',           (e) => this._onAreaRenamed(e));
            el.addEventListener('switch-to-cards-mode',   () => { this._editSubMode = 'cards'; });
            el.addEventListener('dock-changed',           (e) => { this._overlayDockOpen = !!(/** @type {CustomEvent} */ (e)).detail?.open; });
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
        Object.assign(overlay, measureGridFrame(grid, overlay));
        overlay.refresh?.();
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Rendering
    // ─────────────────────────────────────────────────────────────────────────

    static styles = [editBarStyles, editPanelStyles, editDockStyles, css`
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

        /* Card mode toolbar strip (same strip as the grid editor's). */
        .edit-bar { z-index: 110; }

        /* Empty-area "Add card" placeholder (card mode) */
        .card-add-placeholder {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: var(--ha-space-1);
            min-width: 0;
            min-height: 0;
            cursor: pointer;
            font: inherit;
            color: var(--primary-text-color);
            background: color-mix(in srgb, var(--primary-color) 6%, transparent);
            border: var(--ha-border-width-md) dashed var(--primary-color);
            border-radius: var(--ha-border-radius-lg);
            font-size: 13px;
            font-weight: var(--ha-font-weight-medium, 500);
            transition: background var(--ha-animation-duration-fast, 150ms);
        }
        .card-add-placeholder:hover {
            background: color-mix(in srgb, var(--primary-color) 16%, transparent);
        }
        .card-add-placeholder ha-icon { --mdc-icon-size: 28px; }

        /* Card mode: each card gets HA's edit-mode overlay (hui-card-edit-mode):
           on hover / focus / tap, a scrim with a pencil (edit) and a ⋮ menu. The
           card itself is inert, so a tap never runs its action. isolation keeps
           the controls above anything the card stacks internally. */
        .card-edit-wrap {
            position: relative;
            min-width: 0;
            min-height: 0;
            isolation: isolate;
        }
        .card-edit-overlay {
            position: absolute;
            inset: 0;
            z-index: 1;
            opacity: 0;
            pointer-events: none;
            transition: opacity var(--ha-animation-duration-normal, 180ms) ease-in-out;
        }
        .card-edit-wrap:hover > .card-edit-overlay,
        .card-edit-wrap:focus-within > .card-edit-overlay,
        .card-edit-wrap.touched > .card-edit-overlay,
        .card-edit-wrap.menu-open > .card-edit-overlay {
            opacity: 1;
            pointer-events: auto;
        }
        .card-edit-control {
            position: absolute;
            inset: 0;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            outline: none;
            border-radius: var(--ha-card-border-radius, var(--ha-border-radius-lg));
        }
        .card-edit-scrim {
            position: absolute;
            inset: 0;
            opacity: 0.8;
            /* Fallback: some themes (HA-LCARS) define --primary-background-color
               in terms of itself inside the view, which makes it invalid there. */
            background-color: var(--primary-background-color, var(--card-background-color, #000));
            border: var(--ha-border-width-sm) solid var(--divider-color);
            border-radius: var(--ha-card-border-radius, var(--ha-border-radius-lg));
        }
        .card-edit-control:focus-visible .card-edit-scrim { border-color: var(--primary-color); }
        .card-edit-control ha-svg-icon {
            position: relative;
            display: flex;
            padding: var(--ha-space-2);
            border-radius: var(--ha-border-radius-circle);
            background: var(--secondary-background-color);
            color: var(--primary-text-color);
            --mdc-icon-size: 20px;
        }
        /* Which card this is (type · area), as a chip like the grid editor's. */
        .card-edit-label {
            position: absolute;
            left: var(--ha-space-2);
            bottom: var(--ha-space-2);
            max-width: calc(100% - var(--ha-space-4));
            box-sizing: border-box;
            padding: var(--ha-space-1) var(--ha-space-3);
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
            font-size: var(--ha-font-size-m, 14px);
            font-weight: var(--ha-font-weight-medium, 500);
            line-height: 1.3;
            color: var(--primary-text-color);
            background: var(--card-background-color, var(--secondary-background-color));
            border: var(--ha-border-width-sm) solid var(--divider-color);
            border-radius: var(--ha-border-radius-md);
            box-shadow: var(--ha-box-shadow-s);
        }
        /* ha-dropdown is display: contents, so the trigger button is what gets
           positioned (as in hui-card-edit-mode). */
        .card-edit-menu ha-icon-button {
            position: absolute;
            top: var(--ha-space-1);
            right: var(--ha-space-1);
            --ha-icon-button-size: 32px;
            --mdc-icon-size: 20px;
            border-radius: var(--ha-border-radius-circle);
            background: var(--secondary-background-color);
            color: var(--primary-text-color);
        }
        .menu-sep {
            height: var(--ha-border-width-sm);
            margin: var(--ha-space-1) 0;
            background: var(--divider-color);
        }

        /* Stacked cards (several cards in one area): a picker at the area's top
           left; only the chosen card takes the pointer. */
        .card-edit-wrap.stack-inactive { pointer-events: none; }
        .card-edit-wrap.stack-active > .card-edit-overlay .card-edit-scrim { border-color: var(--primary-color); }
        .stack-picker {
            position: relative;
            z-index: 1000;
            align-self: start;
            justify-self: start;
            display: flex;
            align-items: center;
            gap: var(--ha-space-2);
            max-width: calc(100% - 56px);
            margin: var(--ha-space-1);
            padding: var(--ha-space-1) var(--ha-space-2);
            overflow-x: auto;
            scrollbar-width: thin;
            background: var(--card-background-color, var(--secondary-background-color));
            border: var(--ha-border-width-sm) solid var(--divider-color);
            border-radius: var(--ha-border-radius-pill);
            box-shadow: var(--ha-box-shadow-m);
        }
        .stack-picker-label {
            flex-shrink: 0;
            font-size: var(--ha-font-size-m, 14px);
            color: var(--secondary-text-color);
            white-space: nowrap;
        }
        .stack-picker wa-button-group { flex-shrink: 0; }
        .stack-picker ha-button::part(base) { border-radius: 0; }
        .stack-picker ha-button:first-child::part(base) {
            border-start-start-radius: var(--ha-border-radius-pill);
            border-end-start-radius: var(--ha-border-radius-pill);
        }
        .stack-picker ha-button:last-child::part(base) {
            border-start-end-radius: var(--ha-border-radius-pill);
            border-end-end-radius: var(--ha-border-radius-pill);
        }

        /* Per-card placement / spacing panel (card mode) */
        .placement-panel { z-index: 130; }
        :host([dock-open]) { padding-right: ${EDIT_DOCK_WIDTH}px; }
        @media (max-width: ${DOCK_SHEET_BREAKPOINT}px) {
            :host([dock-open]) { padding-right: 0; }
        }
        .placement-field {
            display: flex;
            align-items: center;
            gap: var(--ha-space-2);
        }
        .placement-field label {
            font-size: 13px;
            color: var(--primary-text-color);
            width: 72px;
            flex-shrink: 0;
        }
        .placement-field ha-selector,
        .placement-field ha-input { flex: 1; min-width: 0; }
    `];

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
            // Edit mode reserves room for the toolbar strip (and, in grid mode, the
            // row/column header gutter) so the editor chrome never covers cards.
            editMode: this._editMode ? this._editSubMode : null,
            overflowY: 'clip',
            overrideHeight: '100%',  // #grid-root fills the host; host carries the actual height
        });
        const hasAreas  = getAreaNames(this._areas).length > 0;
        // The hint is for a blank view only: cards placed by grid-row/grid-column or
        // auto-flow need no named areas, and the hint would sit over them.
        const isBlank   = !hasAreas && !(this.cards?.length || this._config?.cards?.length);

        return html`
            <div id="grid-root" style="${gridStyle}"></div>
            ${isBlank && !this._editMode ? html`
                <div class="empty-state">
                    <ha-icon icon="mdi:grid-large"></ha-icon>
                    <p>Enter edit mode to build your layout</p>
                </div>
            ` : nothing}
            ${this._editMode && this._editSubMode === 'cards' ? html`
                <div class="edit-bar" role="toolbar" aria-label="Card editor">
                    ${renderModeToggle('cards', () => { this._placementEditCard = null; this._editSubMode = 'grid'; })}
                    ${renderBarHint('Click a card to edit it · ⋮ for placement and delete · empty areas show "Add card"')}
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

        // Card mode: areas holding several stacked cards (only the top one would
        // get the pointer) get a picker that brings one card's controls to the front.
        /** @type {Map<string, number[]>} */
        const stacks = new Map();
        if (cardMode) {
            (this._cardElements ?? []).forEach((cardEl, i) => {
                const area = cardEl.config?.view_layout?.['grid-area'];
                if (area) stacks.set(area, [...(stacks.get(area) ?? []), i]);
            });
            for (const [area, list] of stacks) if (list.length < 2) stacks.delete(area);
        }

        (this._cardElements ?? []).forEach((cardEl, cardIndex) => {
            const viewLayout = cardEl.config?.view_layout ?? {};
            // Per-card visibility is handled by HA's hui-card wrapper (the card's
            // native Visibility conditions), so we always place the element.

            const areaSettings = layout.areas?.[viewLayout['grid-area']] ?? {};

            // In edit mode the card is inert (HA does the same): a click selects or
            // edits it and never runs its tap action. Restored outside edit mode.
            cardEl.inert = this._editMode;

            if (cardMode) {
                // In card edit mode, wrap with HA's edit-mode overlay. The wrapper
                // becomes the grid item, so placement (grid-area, alignment, margin,
                // z-index) is applied to the wrapper; overflow stays on the card.
                const wrap = document.createElement('div');
                wrap.className = 'card-edit-wrap';
                applyCardPlacement(wrap, cardEl, viewLayout, cardMargin, cardOverflow, areaSettings);
                applyGridItemHeight(wrap, cardEl.config);
                wrap.appendChild(cardEl);
                const controls = document.createElement('div');
                controls.className = 'card-edit-overlay';
                wrap.appendChild(controls);
                renderTemplate(this._renderCardControls(cardIndex, cardEl.config, wrap), controls, { host: this });
                const stack = stacks.get(viewLayout['grid-area']);
                if (stack) {
                    const active = this._stackActive(viewLayout['grid-area'], stack);
                    if (cardIndex === active) {
                        // In front of the stack's own z-indexes (view_layout / area settings).
                        const top = Math.max(0, ...stack.map(i => Number(this._cardElements[i]?.config?.view_layout?.['z-index']) || 0));
                        wrap.style.zIndex = String(top + 1);
                        wrap.classList.add('stack-active');
                    } else {
                        wrap.classList.add('stack-inactive');
                    }
                }
                grid.appendChild(wrap);
            } else {
                // Outside card mode the card element itself is the grid item.
                applyCardPlacement(cardEl, cardEl, viewLayout, cardMargin, cardOverflow, areaSettings);
                applyGridItemHeight(cardEl, cardEl.config);
                grid.appendChild(cardEl);
            }
        });

        for (const [area, list] of stacks) {
            const picker = document.createElement('div');
            picker.className = 'stack-picker';
            picker.style.gridArea = area;
            renderTemplate(this._renderStackPicker(area, list), picker, { host: this });
            grid.appendChild(picker);
        }

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

    /** The stacked card whose controls are in front: the picked one, else the top one. */
    _stackActive(/** @type {string} */ area, /** @type {number[]} */ list) {
        const picked = this._stackFocus[area];
        return picked != null && list.includes(picked) ? picked : list[list.length - 1];
    }

    /**
     * The picker for an area with stacked cards: one pill per card; the chosen
     * card's edit controls come to the front (the others ignore the pointer).
     * @param {string} area
     * @param {number[]} list  card indexes in the area, bottom to top
     */
    _renderStackPicker(area, list) {
        const active = this._stackActive(area, list);
        const pick = (/** @type {number} */ i) => {
            if (i === active) return;
            this._stackFocus = { ...this._stackFocus, [area]: i };
            this._placeCards();
        };
        return html`
            <span class="stack-picker-label">${list.length} stacked</span>
            <wa-button-group childSelector="ha-button" label="Stacked cards in ${area}">
                ${list.map(i => html`
                    <ha-button variant="brand" size="s"
                        .appearance=${i === active ? 'accent' : 'filled'}
                        aria-pressed=${i === active ? 'true' : 'false'}
                        title="Edit this card"
                        @click=${(/** @type {Event} */ e) => { e.stopPropagation(); pick(i); }}>
                        ${String(this._cardElements[i]?.config?.type ?? 'card').replace('custom:', '').replace(/^lcards-/, '')}
                    </ha-button>`)}
            </wa-button-group>
        `;
    }

    /**
     * HA's card edit-mode controls (hui-card-edit-mode): the whole card is the
     * "edit" target (scrim + pencil), with a ⋮ menu for placement and delete.
     * @param {number} cardIndex
     * @param {any} config
     * @param {HTMLElement} wrap
     */
    _renderCardControls(cardIndex, config, wrap) {
        const type = String(config?.type ?? 'card').replace('custom:', '');
        const area = config?.view_layout?.['grid-area'];
        const edit = (/** @type {Event} */ e) => {
            if (e instanceof KeyboardEvent && e.key !== 'Enter' && e.key !== ' ') return;
            e.preventDefault();
            e.stopPropagation();
            this._editCard(cardIndex);
        };
        const onSelect = (/** @type {CustomEvent} */ e) => {
            const action = e.detail?.item?.value;
            if (action === 'edit')      this._editCard(cardIndex);
            if (action === 'placement') this._openPlacementEditor(cardIndex);
            if (action === 'delete')    this._deleteCardByIndex(cardIndex);
        };
        return html`
            <div class="card-edit-control" role="button" tabindex="0"
                aria-label="Edit ${type}" title="Edit ${type}"
                @click=${edit} @keydown=${edit}>
                <div class="card-edit-scrim"></div>
                <ha-svg-icon .path=${ICON.pencil}></ha-svg-icon>
                <span class="card-edit-label">${area ? `${type} · ${area}` : type}</span>
            </div>
            <ha-dropdown class="card-edit-menu" placement="bottom-end"
                @wa-show=${() => wrap.classList.add('menu-open')}
                @wa-after-hide=${() => wrap.classList.remove('menu-open')}
                @wa-select=${onSelect}>
                <ha-icon-button slot="trigger" .path=${ICON.dotsVertical} .label=${'Card options'}></ha-icon-button>
                <ha-dropdown-item value="edit">
                    <ha-svg-icon slot="icon" .path=${ICON.pencil}></ha-svg-icon>
                    Edit
                </ha-dropdown-item>
                <ha-dropdown-item value="placement">
                    <ha-svg-icon slot="icon" .path=${ICON.tune}></ha-svg-icon>
                    Placement & spacing
                </ha-dropdown-item>
                <div class="menu-sep" role="separator"></div>
                <ha-dropdown-item value="delete" variant="danger">
                    <ha-svg-icon slot="icon" .path=${ICON.delete}></ha-svg-icon>
                    Delete
                </ha-dropdown-item>
            </ha-dropdown>
        `;
    }

    /**
     * Scan placed cards for Visibility conditions that govern entire rows.
     * Fills this._visibilityRows with {rowIndex, cardEl, targetHeight}.
     * Called after every card placement so the list stays in sync.
     *
     * Conditions are not parsed here — any non-empty `visibility` (any condition
     * type, lovelace `entity` or core `entity_id` shape) registers the card, and
     * _applyVisibilityRowHeights() reads HA's own verdict from the hui-card's
     * `hidden` state. HA evaluates stateful conditions server-side (2026.10+)
     * and the visibility editor rewrites them into core shape, so re-evaluating
     * them here would drift from HA.
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
            this._visibilityRows.push({ rowIndex, cardEl, targetHeight: h });
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

        // Visibility-controlled rows follow hui-card's own `hidden` verdict
        // (see resolveVisibilityRowTracks for the open/collapse rule).
        const rows = resolveVisibilityRowTracks(
            this._baseRows,
            (this._visibilityRows ?? []).map(({ rowIndex, cardEl, targetHeight }) =>
                ({ rowIndex, hidden: !!cardEl.hidden, targetHeight })),
            this._editMode,
        );

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

        // Available height: the host's (provided by HA's parent container) minus the
        // grid's own padding and border (layout.padding, and the edit-mode reserve
        // for the toolbar strip / header gutter).
        const gcs = getComputedStyle(grid);
        const inset = (parseFloat(gcs.paddingTop) || 0) + (parseFloat(gcs.paddingBottom) || 0)
            + (parseFloat(gcs.borderTopWidth) || 0) + (parseFloat(gcs.borderBottomWidth) || 0)
            + (parseFloat(gcs.marginTop) || 0) + (parseFloat(gcs.marginBottom) || 0);
        const available = this.getBoundingClientRect().height - inset;
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
        const gap = parseFloat(gcs.rowGap) || 0;
        const gapTotal = (rows.length - 1) * gap;

        const frSpace = Math.max(0, available - fixedTotal - gapTotal);

        // Replace each fr track with its allocated px.
        for (const { index, units } of frTracks) {
            rows[index] = Math.round(frSpace * units / totalFR) + 'px';
        }

        grid.style.gridTemplateRows = rows.join(' ');
    }

    /** Show a card's placement in the dock (it replaces whatever card was there). */
    _openPlacementEditor(/** @type {number} */ cardIndex) {
        this._placementEditCard = { index: cardIndex };
    }

    /** Write align-self + justify-self for a card, using place-self shorthand when both axes match. */
    _setAlignment(cardIndex, v, h) {
        this._updateCardViewLayout(cardIndex, v === h
            ? { 'place-self': v === 'stretch' ? undefined : v, 'align-self': undefined, 'justify-self': undefined }
            : { 'place-self': undefined, 'align-self': v === 'stretch' ? undefined : v, 'justify-self': h === 'stretch' ? undefined : h });
    }

    /** Write overflow-x + overflow-y for a card, using the overflow shorthand when both axes match. */
    _setOverflow(cardIndex, x, y) {
        this._updateCardViewLayout(cardIndex, x === y
            ? { overflow: x === 'visible' ? undefined : x, 'overflow-x': undefined, 'overflow-y': undefined }
            : { overflow: undefined, 'overflow-x': x === 'visible' ? undefined : x, 'overflow-y': y === 'visible' ? undefined : y });
    }

    /**
     * Commit view_layout keys for a card in one save (one undo step). An empty /
     * undefined value removes that key.
     * @param {number} cardIndex
     * @param {Record<string, any>} patch
     */
    _updateCardViewLayout(cardIndex, patch) {
        const cards = [...(this._config?.cards ?? [])];
        const card = cards[cardIndex];
        if (!card) return;
        const vl = { ...(card.view_layout ?? {}) };
        for (const [key, value] of Object.entries(patch)) {
            if (value == null || value === '') delete vl[key];
            else vl[key] = value;
        }
        cards[cardIndex] = { ...card, view_layout: vl };
        this._config = { ...this._config, cards };
        this._saveConfig();
    }

    _renderPlacementPanel() {
        const idx  = this._placementEditCard?.index;
        if (idx == null) return nothing;
        const card = this._config?.cards?.[idx];
        if (card == null) return nothing;
        const vl    = card.view_layout ?? {};
        const label = (card.type ?? 'card').replace('custom:', '');
        const defaultMargin = this._config?.layout?.card_margin ?? 'inherit';

        return html`
            <aside class="edit-dock placement-panel" aria-label="Placement: ${label}">
                ${renderPanelHeader(`Placement: ${label}`, () => { this._placementEditCard = null; })}
                <div class="edit-dock-body">
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
                        @change=${(e) => this._updateCardViewLayout(idx, { margin: e.target.value || undefined })}
                    ></ha-input>
                </div>
                <div class="placement-field">
                    <label>Overflow X</label>
                    <ha-selector
                        .hass=${this._hass}
                        .selector=${{ select: { mode: 'dropdown', options: PLACEMENT_OVERFLOW_OPTIONS } }}
                        .value=${vl['overflow-x'] ?? vl.overflow ?? 'visible'}
                        @value-changed=${(e) => this._setOverflow(idx, e.detail.value, vl['overflow-y'] ?? vl.overflow ?? 'visible')}
                    ></ha-selector>
                </div>
                <div class="placement-field">
                    <label>Overflow Y</label>
                    <ha-selector
                        .hass=${this._hass}
                        .selector=${{ select: { mode: 'dropdown', options: PLACEMENT_OVERFLOW_OPTIONS } }}
                        .value=${vl['overflow-y'] ?? vl.overflow ?? 'visible'}
                        @value-changed=${(e) => this._setOverflow(idx, vl['overflow-x'] ?? vl.overflow ?? 'visible', e.detail.value)}
                    ></ha-selector>
                </div>
                </div>
            </aside>
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

    /**
     * Delete a card after a confirmation, through HA (ll-delete-card) so its
     * "Deleted" toast still offers Undo.
     * @param {number} cardIndex
     */
    async _deleteCardByIndex(cardIndex) {
        const card = this._config?.cards?.[cardIndex];
        const type = String(card?.type ?? 'card').replace('custom:', '');
        const area = card?.view_layout?.['grid-area'];
        const confirmed = await showConfirmDeleteDialog({
            title: 'Delete card?',
            message: `Delete the "${type}" card${area ? ` from area "${area}"` : ''}? You can undo this from the dashboard toolbar.`,
            confirmText: 'Delete',
        });
        if (!confirmed) return;
        if (this._placementEditCard?.index === cardIndex) this._placementEditCard = null;
        this.dispatchEvent(new CustomEvent('ll-delete-card', {
            bubbles: true,
            composed: true,
            detail: { path: [this.index, cardIndex], silent: false },
        }));
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

    /** Merge a per-area settings patch (empty value removes the key; empty area removed). */
    _onAreaSettingsChanged(ev) {
        ev.stopPropagation();
        const { name, patch } = ev.detail ?? {};
        if (!name || !patch) return;
        const layout = this._config?.layout ?? {};
        const areas  = { ...(layout.areas ?? {}) };
        const areaSettings = { ...(areas[name] ?? {}) };
        for (const [key, value] of Object.entries(patch)) {
            if (value == null || value === '') delete areaSettings[key];
            else areaSettings[key] = value;
        }
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
                    // Wait for the previous save's lovelace_updated event (this also
                    // merges saves requested in the same tick, e.g. an area rename's
                    // grid + cards, into one). HA ignores only ONE update event after
                    // a save: two saves before the first event arrives make the second
                    // event look external ("Dashboard updated in another session").
                    await this._waitForSaveEvent();
                    const cfg = this._pendingViewConfig;
                    if (!cfg) break;
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

    /** Subscribe (once) to lovelace_updated, the event HA's saves produce. */
    _subscribeSaveEvents() {
        if (this._saveEventsUnsub || !this._hass?.connection) return;
        this._lastSaveEventAt = performance.now();
        this._saveEventsUnsub = this._hass.connection.subscribeEvents(() => {
            this._lastSaveEventAt = performance.now();
            const waiters = this._saveEventWaiters ?? [];
            this._saveEventWaiters = [];
            waiters.forEach(resolve => resolve());
        }, 'lovelace_updated').catch((/** @type {any} */ e) => {
            lcardsLog.debug('[LCARSLayoutView] lovelace_updated subscription failed', { error: e?.message });
            this._saveEventsUnsub = null;
        });
    }

    /**
     * Resolve once the last config change's lovelace_updated event has arrived
     * (or after a timeout, so a missed event can't block saving). Always waits at
     * least one microtask.
     * @returns {Promise<void>}
     */
    async _waitForSaveEvent() {
        await Promise.resolve();
        if (!this._saveEventsUnsub || !((this._lastConfigChangeAt ?? 0) > (this._lastSaveEventAt ?? 0))) return;
        await new Promise((resolve) => {
            (this._saveEventWaiters ??= []).push(resolve);
            setTimeout(resolve, 2000);
        });
        // Let HA's own handler (which clears its ignore flag) run first.
        await new Promise(resolve => setTimeout(resolve, 0));
    }

    getCardSize() { return 1; }
}
