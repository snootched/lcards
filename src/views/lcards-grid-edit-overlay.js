/**
 * @fileoverview lcards-grid-edit-overlay — In-view CSS Grid editor overlay.
 *
 * Architecture: a transparent "ghost grid" (same CSS template as the real grid,
 * opacity:0) is the measurement source. After each render, getBoundingClientRect()
 * on the ghost cells gives exact pixel positions for every cell. All editor chrome
 * (column/row headers, area overlays, resize handles, selection cells) is then
 * positioned absolutely from those measurements — nothing is inside the grid flow.
 * This eliminates the offset bug caused by header tracks taking up grid space.
 *
 * Events emitted (non-bubbling, to lcards-layout-view):
 *   grid-state-changed   { columns, rows, areas, gap }   — on commit
 *   grid-preview-changed { columns, rows, gap }          — during drag (no save)
 *   area-cards-changed   { cards }                       — cards[] updated
 *   add-card-to-area     { areaName }                    — opens HA card picker
 */

import { LitElement, html, css, nothing } from 'lit';
import { lcardsLog } from '../utils/lcards-logging.js';
import {
    parseTrackValue,
    isResizableTrack,
    resizeAdjacentTracks,
    computeFrPx,
    getAreaNames,
    getAreaBounds,
    cellsToAreaName,
    removeArea,
    renameArea,
    setAreaBounds,
    removeTrack,
    insertTrack,
    reorderTrack,
    GRID_EDIT_GUTTER,
    EDIT_BAR_HEIGHT,
    editReserve,
} from './layout-grid-utils.js';
import { showConfirmDeleteDialog } from './layout-edit-dialogs.js';
import {
    ICON,
    editBarStyles,
    editPanelStyles,
    editDockStyles,
    renderModeToggle,
    renderBarHint,
    renderPanelHeader,
} from './layout-edit-chrome.js';
// Side-effect imports: registers components used by the area settings panel.
import '../editor/components/shared/lcards-color-picker.js';
import '../editor/components/shared/lcards-form-section.js';

// ─── Per-area settings option lists ─────────────────────────────────────────
const AREA_ALIGN_V_OPTIONS = [
    { value: 'stretch', label: 'Stretch (default)' },
    { value: 'start',   label: 'Top' },
    { value: 'center',  label: 'Center' },
    { value: 'end',     label: 'Bottom' },
];
const AREA_ALIGN_H_OPTIONS = [
    { value: 'stretch', label: 'Stretch (default)' },
    { value: 'start',   label: 'Left' },
    { value: 'center',  label: 'Center' },
    { value: 'end',     label: 'Right' },
];
const AREA_OVERFLOW_OPTIONS = [
    { value: 'visible', label: 'Visible: bleeds beyond cell' },
    { value: 'clip',    label: 'Clip: hard clip, no scroll' },
    { value: 'hidden',  label: 'Hidden: clip + block context' },
    { value: 'auto',    label: 'Scroll when needed (auto)' },
    { value: 'scroll',  label: 'Always scroll' },
];
const AREA_BORDER_STYLE_OPTIONS = [
    { value: 'none',   label: 'None' },
    { value: 'solid',  label: 'Solid' },
    { value: 'dashed', label: 'Dashed' },
    { value: 'dotted', label: 'Dotted' },
];
const AREA_BG_SIZE_OPTIONS = [
    { value: 'cover',     label: 'Cover (fill & crop)' },
    { value: 'contain',   label: 'Contain (fit whole)' },
    { value: '100% 100%', label: 'Stretch' },
    { value: 'auto',      label: 'Auto (natural size)' },
];
const AREA_BG_POSITION_OPTIONS = [
    { value: 'center', label: 'Center' },
    { value: 'top',    label: 'Top' },
    { value: 'bottom', label: 'Bottom' },
    { value: 'left',   label: 'Left' },
    { value: 'right',  label: 'Right' },
];
const AREA_BG_REPEAT_OPTIONS = [
    { value: 'no-repeat', label: 'No repeat' },
    { value: 'repeat',    label: 'Repeat' },
    { value: 'repeat-x',  label: 'Repeat X' },
    { value: 'repeat-y',  label: 'Repeat Y' },
];

// ─── Area color palette (LCARS colors at edit-mode opacity) ────────────────
const AREA_COLORS = [
    { bg: 'var(--lcars-ui-primary)',    text: 'var(--lcars-ui-primary)' },
    { bg: 'var(--lcars-ui-quaternary)', text: 'var(--lcars-ui-quaternary)' },
    { bg: 'var(--lcars-ui-secondary)',  text: 'var(--lcars-ui-secondary)' },
    { bg: 'var(--lcars-blue)',          text: 'var(--lcars-blue)' },
    { bg: 'var(--lcards-green)',        text: 'var(--lcards-green)' },
    { bg: 'var(--lcars-ui-tertiary)',   text: 'var(--lcars-ui-tertiary)' },
];
function areaColor(name) {
    let h = 0;
    for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) | 0;
    return AREA_COLORS[Math.abs(h) % AREA_COLORS.length];
}

// ─── Area tint (toolbar slider) ────────────────────────────────────────────
// Sticky: kept at module level so it survives switching between Layout and Cards
// (the overlay is recreated each time), and in localStorage across reloads.
const AREA_TINT_DEFAULT = 60;
const AREA_TINT_KEY = 'lcards-layout-area-tint';
let areaTint = (() => {
    try {
        const v = Number(localStorage.getItem(AREA_TINT_KEY));
        return localStorage.getItem(AREA_TINT_KEY) != null && Number.isFinite(v) ? Math.max(0, Math.min(100, v)) : AREA_TINT_DEFAULT;
    } catch { return AREA_TINT_DEFAULT; }
})();
function setStickyAreaTint(/** @type {number} */ v) {
    areaTint = v;
    try { localStorage.setItem(AREA_TINT_KEY, String(v)); } catch { /* storage unavailable */ }
}

// ─── Dimension constants ───────────────────────────────────────────────────
// Column/row headers live in the gutter the grid reserves above / left of
// itself in edit mode (editReserve('grid')), inset so neighbours don't touch.
const GUTTER       = GRID_EDIT_GUTTER;
const HEADER_INSET = 3;    // px between a header and the gutter edges
const HANDLE_SIZE  = 10;   // px — resize handle thickness

// Stacking order of the editor chrome (one scale, low to high). Panels and
// the toolbar sit above everything on the grid; dropdown menus use the top layer.
const Z = {
    cell: 10,          // empty-cell targets (create area / rubber-band)
    area: 20,          // area tiles
    handle: 30,        // resize handle segments between cells
    header: 40,        // column/row headers in the gutter
    gutterHandle: 45,  // resize handle segment in the gutter
    areaGrip: 48,      // move / resize grips on the selected area
    selection: 50,     // rubber-band rect
    bar: 60,           // toolbar strip
    panel: 70,         // floating panels
    chip: 80,          // reorder drag chip
};

export class LCARdSGridEditOverlay extends LitElement {

    // ──────────────────────────────────────────────────────────────────────
    // Properties
    // ──────────────────────────────────────────────────────────────────────

    static properties = {
        hass:        { attribute: false },
        columns:     { attribute: false },
        rows:        { attribute: false },
        areas:       { attribute: false },
        gap:         { attribute: false },
        measureColumns: { attribute: false }, // resolved px tracks for the ghost grid (optional)
        measureRows:    { attribute: false }, // resolved px tracks for the ghost grid (optional)
        measureOffset:  { attribute: false }, // {top, left} px of the real grid's first cell (optional)
        cardConfigs: { attribute: false },
        layout:      { attribute: false }, // full layout object for settings panel
        hideCardMode: { attribute: false }, // hide the "Edit Cards" toolbar toggle (card editor uses a list instead)
        hideSettings: { attribute: false }, // hide the toolbar "grid settings" button (studio uses its Layout tab)

        _selectedArea:   { state: true },
        _renaming:     { state: true }, // area name being renamed via in-bar input | null
        _trackPopover: { state: true }, // { axis, index } | null — track size popover
        _selStart:       { state: true },
        _selEnd:         { state: true },
        _selectionName:  { state: true },
        _showNameInput:  { state: true },
        _nameError:      { state: true }, // validation message in the name popup
        _showSettings:   { state: true }, // layout settings panel open
        _reorderPreview: { state: true }, // { axis, from, to } | null
        _areaSettings:   { state: true }, // area name whose settings panel is open | null
        _areaDragPreview: { state: true }, // { bounds, ok } | null — area move/resize target
        _areaTint:       { state: true }, // area tint % (0–100), the toolbar slider
    };

    constructor() {
        super();
        this.hass           = undefined;
        this.columns        = ['1fr', '1fr', '1fr'];
        this.rows           = ['1fr', '1fr', '1fr'];
        this.areas          = Array(3).fill(null).map(() => Array(3).fill('.'));
        this.gap            = '5px';
        this.cardConfigs    = [];
        this.layout         = {};
        this.measureColumns = undefined;
        this.measureRows    = undefined;
        /** @type {{top: number, left: number} | undefined} */
        this.measureOffset  = undefined;
        this.hideCardMode   = false;
        this.hideSettings   = false;

        this._selectedArea = null;
        this._renaming     = null;
        /** @type {{axis: string, index: number} | null} */
        this._trackPopover = null;
        this._showSettings   = false;
        /** @type {{r: number, c: number} | null} */
        this._selStart       = null;
        /** @type {{r: number, c: number} | null} */
        this._selEnd         = null;
        this._selectionName  = '';
        this._showNameInput  = false;
        this._nameError      = '';
        this._reorderPreview = null;
        this._areaSettings   = null;
        this._dockWasOpen    = false;
        this._areaTint       = areaTint;
        /** @type {{name: string, mode: string, orig: {r1:number,c1:number,r2:number,c2:number}, anchor: {r:number,c:number}|null, target: {r1:number,c1:number,r2:number,c2:number}|null, ok: boolean, moved: boolean} | null} */
        this._areaDrag       = null;
        this._areaDragPreview = null;

        // Measurement cache: _cells[r][c] = DOMRect relative to overlay
        this._cells = [];
        /** @type {DOMRect | {left: number, top: number, width: number, height: number} | null} */
        this._overlayRect = null;
        this._measureScheduled = false;

        // Drag state (non-reactive, mutated in pointermove)
        this._resizeDrag  = null;
        this._reorderDrag = null;
        this._selDrag     = false;
        this._selMoved    = false;

        // Single unified pointer listener set bound to the overlay element itself
        // (not document). Every drag captures its pointer, so move/up/cancel arrive
        // here even when the pointer leaves the view; the dispatcher routes to the
        // active drag (resize / reorder / selection / area panel).
        this._boundPointerMove   = this._onAnyPointerMove.bind(this);
        this._boundPointerUp     = this._onAnyPointerUp.bind(this);
        this._boundPointerCancel = this._onAnyPointerCancel.bind(this);
        this._boundKeydown     = this._onDocKeydown.bind(this);
    }

    // ──────────────────────────────────────────────────────────────────────
    // Styles
    // ──────────────────────────────────────────────────────────────────────

    static styles = [editBarStyles, editPanelStyles, editDockStyles, css`
        :host {
            display: block;
            position: absolute;
            inset: 0;
            pointer-events: none;
            z-index: 100;
            font-family: var(--ha-font-family-body);
        }

        /* ─── Ghost grid (measurement only) ──────────────────────────────── */
        /* Padded (inline style) by the real grid's content offset, so ghost
           cells line up with the real #grid-root cells. */
        #ghost-grid {
            position: absolute;
            inset: 0;
            display: grid;
            opacity: 0;
            pointer-events: none;
            box-sizing: border-box;
        }
        .gc { min-width: 0; min-height: 0; }

        .edit-bar { z-index: ${Z.bar}; }

        .t-tint {
            display: flex;
            align-items: center;
            gap: var(--ha-space-1);
            color: var(--secondary-text-color);
            --mdc-icon-size: 18px;
        }
        .t-tint input[type=range] {
            width: 90px;
            accent-color: var(--primary-color);
            cursor: pointer;
        }

        /* ─── Column / row headers (live in the reserved gutter) ──────────── */
        .col-header,
        .row-header {
            position: absolute;
            display: flex;
            align-items: center;
            justify-content: center;
            box-sizing: border-box;
            overflow: hidden;
            pointer-events: auto;
            cursor: grab;
            user-select: none;
            touch-action: none;
            background: var(--secondary-background-color);
            border: var(--ha-border-width-sm) solid var(--divider-color);
            border-radius: var(--ha-border-radius-sm);
            color: var(--secondary-text-color);
            z-index: ${Z.header};
            transition: background var(--ha-animation-duration-fast, 150ms), color var(--ha-animation-duration-fast, 150ms), border-color var(--ha-animation-duration-fast, 150ms);
        }
        .row-header { writing-mode: vertical-rl; }
        .col-header:hover, .row-header:hover,
        .col-header.open, .row-header.open {
            background: color-mix(in srgb, var(--primary-color) 18%, var(--secondary-background-color));
            border-color: var(--primary-color);
            color: var(--primary-text-color);
        }
        .col-header.dragging, .row-header.dragging { opacity: 0.5; cursor: grabbing; }
        .col-header.drop-target, .row-header.drop-target {
            background: color-mix(in srgb, var(--primary-color) 35%, var(--secondary-background-color));
            border-color: var(--primary-color);
        }
        .track-label {
            font-size: 11px;
            font-weight: var(--ha-font-weight-medium, 500);
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            padding: 0 var(--ha-space-1);
            max-width: 100%;
        }

        /* ─── Resize handles ──────────────────────────────────────────────── */
        /* One segment per row (column boundaries) or column (row boundaries),
           plus one in the header gutter. Segments inside an area that spans the
           boundary are hidden, so the middle of a spanning area stays the area. */
        .rh-seg {
            position: absolute;
            display: none;
            align-items: center;
            justify-content: center;
            pointer-events: auto;
            touch-action: none;
            z-index: ${Z.handle};
        }
        .rh-seg.col { cursor: col-resize; }
        .rh-seg.row { cursor: row-resize; }
        .rh-seg.disabled { cursor: not-allowed; }
        .rh-seg::after {
            content: '';
            position: absolute;
            background: var(--primary-color);
            border-radius: var(--ha-border-radius-pill);
            opacity: 0;
            transition: opacity var(--ha-animation-duration-fast, 150ms);
        }
        .rh-seg.col::after { top: 4px; bottom: 4px; left: 50%; width: 3px; transform: translateX(-50%); }
        .rh-seg.row::after { left: 4px; right: 4px; top: 50%; height: 3px; transform: translateY(-50%); }
        .rh-seg:not(.disabled):hover::after,
        .rh-seg.active::after { opacity: 1; }
        .rh-seg.gutter { z-index: ${Z.gutterHandle}; }
        /* ─── Area overlays ───────────────────────────────────────────────── */
        /* Outline areas: a coloured outline and a light tint (--area-color, set
           per area), so the real cards stay readable while laying out. */
        .area-overlay {
            position: absolute;
            pointer-events: auto;
            box-sizing: border-box;
            border: var(--ha-border-width-md) solid color-mix(in srgb, var(--area-color) 75%, transparent);
            border-radius: var(--ha-border-radius-md);
            background: color-mix(in srgb, var(--area-color) var(--area-tint, 60%), transparent);
            cursor: pointer;
            z-index: ${Z.area};
            transition: background var(--ha-animation-duration-fast, 150ms);
        }
        .area-overlay:hover { background: color-mix(in srgb, var(--area-color) min(100%, calc(var(--area-tint, 60%) + 10%)), transparent); }
        .area-overlay.selected {
            border-color: var(--primary-color);
            box-shadow: inset 0 0 0 var(--ha-border-width-sm) var(--primary-color);
            background: color-mix(in srgb, var(--area-color) min(100%, calc(var(--area-tint, 60%) + 10%)), transparent);
        }
        .area-overlay.dragging { opacity: 0.4; }
        .area-label {
            position: absolute;
            top: 50%;
            left: var(--ha-space-2);
            right: var(--ha-space-2);
            transform: translateY(-50%);
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 2px;
            pointer-events: none;
            text-align: center;
        }
        /* Area chips: the name (with the area's colour bar) and its card(s), on
           an HA card surface so they read over any card behind them. */
        .area-name, .area-cards {
            max-width: 100%;
            box-sizing: border-box;
            padding: var(--ha-space-1) var(--ha-space-3);
            border-radius: var(--ha-border-radius-md);
            background: var(--card-background-color, var(--primary-background-color));
            border: var(--ha-border-width-sm) solid var(--divider-color);
            box-shadow: var(--ha-box-shadow-s);
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            line-height: 1.3;
        }
        .area-name {
            pointer-events: auto;
            cursor: move;
            touch-action: none;
            border-left: 4px solid var(--area-color);
            font-size: var(--ha-font-size-l, 16px);
            font-weight: var(--ha-font-weight-bold, 700);
            color: var(--primary-text-color);
        }
        .area-cards {
            font-size: var(--ha-font-size-m, 14px);
            color: var(--secondary-text-color);
        }
        .area-label { gap: var(--ha-space-1); }
        /* The ⋮ area menu (HA's card edit-mode pattern). Always shown at reduced
           opacity so it can be found (and tapped on touch screens). */
        /* ha-dropdown is display: contents, so the trigger button is what gets
           positioned (as in hui-card-edit-mode). */
        .area-menu ha-icon-button {
            position: absolute;
            top: var(--ha-space-1);
            right: var(--ha-space-1);
            z-index: 1;
            --ha-icon-button-size: 32px;
            --mdc-icon-size: 20px;
            border-radius: var(--ha-border-radius-circle);
            background: var(--secondary-background-color);
            color: var(--primary-text-color);
            opacity: 0.75;
            transition: opacity var(--ha-animation-duration-fast, 150ms);
        }
        .area-overlay:hover .area-menu ha-icon-button,
        .area-overlay.selected .area-menu ha-icon-button,
        .area-menu ha-icon-button:focus-visible { opacity: 1; }
        .menu-sep {
            height: var(--ha-border-width-sm);
            margin: var(--ha-space-1) 0;
            background: var(--divider-color);
        }
        .area-rename {
            position: absolute;
            top: var(--ha-space-1);
            right: var(--ha-space-1);
            left: var(--ha-space-1);
            z-index: 1;
            display: flex;
            align-items: center;
            justify-content: flex-end;
            gap: 2px;
        }
        .area-rename input {
            flex: 1;
            min-width: 0;
            max-width: 200px;
            font: inherit;
            font-size: 13px;
            padding: var(--ha-space-1) var(--ha-space-2);
            border: var(--ha-border-width-sm) solid var(--primary-color);
            border-radius: var(--ha-border-radius-sm);
            background: var(--card-background-color, var(--primary-background-color));
            color: var(--primary-text-color);
            outline: none;
        }
        .area-rename ha-icon-button {
            --ha-icon-button-size: 32px;
            border-radius: var(--ha-border-radius-circle);
            background: var(--secondary-background-color);
            color: var(--primary-text-color);
        }

        /* ─── Empty cells (click: create area; drag: rubber-band) ─────────── */
        .cell-target {
            position: absolute;
            pointer-events: auto;
            cursor: crosshair;
            box-sizing: border-box;
            touch-action: none;
            z-index: ${Z.cell};
        }
        .cell-add-btn {
            position: absolute;
            inset: 0;
            opacity: 0;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: var(--ha-space-1);
            border-radius: var(--ha-border-radius-md);
            border: var(--ha-border-width-md) dashed var(--primary-color);
            background: color-mix(in srgb, var(--primary-color) 8%, transparent);
            color: var(--primary-text-color);
            font: inherit;
            font-size: 12px;
            font-weight: var(--ha-font-weight-medium, 500);
            cursor: crosshair;
            pointer-events: none;
            transition: opacity var(--ha-animation-duration-fast, 150ms);
            --mdc-icon-size: 22px;
        }
        .cell-target:hover .cell-add-btn,
        .cell-add-btn:focus-visible { opacity: 1; }
        .cell-target.in-sel .cell-add-btn {
            opacity: 1;
            background: color-mix(in srgb, var(--primary-color) 20%, transparent);
        }

        /* ─── Rubber-band selection rect ──────────────────────────────────── */
        .sel-rect {
            position: absolute;
            pointer-events: none;
            z-index: ${Z.selection};
            border: var(--ha-border-width-md) dashed var(--primary-color);
            border-radius: var(--ha-border-radius-md);
            background: color-mix(in srgb, var(--primary-color) 15%, transparent);
        }

        /* ─── Floating panels ─────────────────────────────────────────────── */
        .edit-panel { z-index: ${Z.panel}; }
        .edit-dock { z-index: ${Z.panel}; }
        .name-popup { width: 240px; }
        .edit-dock ha-input, .name-popup ha-input { display: block; width: 100%; }
        .settings-hint {
            font-size: 12px;
            color: var(--secondary-text-color);
        }
        .tp-presets {
            display: flex;
            flex-wrap: wrap;
            gap: var(--ha-space-1);
        }
        .tp-preset {
            padding: 2px var(--ha-space-2);
            border-radius: var(--ha-border-radius-pill);
            font: inherit;
            font-size: 12px;
            cursor: pointer;
            background: var(--secondary-background-color);
            color: var(--primary-text-color);
            border: var(--ha-border-width-sm) solid var(--divider-color);
        }
        .tp-preset:hover { border-color: var(--primary-color); }
        .tp-preset.current {
            background: color-mix(in srgb, var(--primary-color) 20%, var(--secondary-background-color));
            border-color: var(--primary-color);
        }

        /* Area move / resize: grips on the selected area's edges, and a preview
           of the target cells while dragging (red when it would overlap). */
        .area-grip {
            position: absolute;
            display: none;
            box-sizing: border-box;
            pointer-events: auto;
            touch-action: none;
            z-index: ${Z.areaGrip};
            background: var(--primary-color);
            border: var(--ha-border-width-md) solid var(--card-background-color, var(--primary-background-color));
            border-radius: var(--ha-border-radius-pill);
            box-shadow: var(--ha-box-shadow-s);
        }
        .area-grip.n, .area-grip.s { cursor: ns-resize; }
        .area-grip.e, .area-grip.w { cursor: ew-resize; }
        .area-preview {
            position: absolute;
            pointer-events: none;
            box-sizing: border-box;
            z-index: ${Z.selection};
            border: var(--ha-border-width-md) dashed var(--primary-color);
            border-radius: var(--ha-border-radius-md);
            background: color-mix(in srgb, var(--primary-color) 18%, transparent);
        }
        .area-preview.blocked {
            border-color: var(--error-color);
            background: color-mix(in srgb, var(--error-color) 18%, transparent);
        }

        /* Per-area settings in the dock */
        .area-body { display: flex; flex-direction: column; gap: var(--ha-space-2); }
        /* Each setting is its own row with a faint rule, so complex controls
           (e.g. the color picker's buttons + input) read as one unit. */
        .ap-field {
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 12px 0;
            border-bottom: var(--ha-border-width-sm) solid var(--divider-color);
        }
        .ap-field:last-child { border-bottom: none; padding-bottom: 2px; }
        .ap-field > label {
            font-size: 14px;
            color: var(--primary-text-color);
            width: 92px;
            flex-shrink: 0;
        }
        .ap-field lcards-color-picker,
        .ap-field ha-input,
        .ap-field ha-selector { flex: 1; min-width: 0; }
        .ap-inline { display: flex; gap: 6px; flex: 1; min-width: 0; }
        .ap-inline ha-input,
        .ap-inline ha-selector { flex: 1; min-width: 0; }

        /* ─── Reorder drag chip (follows the cursor) ──────────────────────── */
        .drag-chip {
            position: absolute;
            display: none;
            z-index: ${Z.chip};
            pointer-events: none;
            padding: var(--ha-space-1) var(--ha-space-2);
            border-radius: var(--ha-border-radius-pill);
            font-size: 12px;
            font-weight: var(--ha-font-weight-bold, 700);
            background: var(--primary-color);
            color: var(--text-primary-color);
            box-shadow: var(--ha-box-shadow-m);
            white-space: nowrap;
        }
    `];

    // ──────────────────────────────────────────────────────────────────────
    /** Typed querySelector — returns HTMLElement so callers can access .style/.focus. */
    _qh(/** @type {string} */ sel) {
        if (!this.renderRoot) return null;
        return /** @type {HTMLElement|null} */ (this.renderRoot.querySelector(sel));
    }

    // Lifecycle
    // ──────────────────────────────────────────────────────────────────────

    connectedCallback() {
        super.connectedCallback();
        // Use the overlay element as the listener target for drag events.
        // This avoids shadow DOM boundary issues that affect document-level listeners.
        this.addEventListener('pointermove',   this._boundPointerMove);
        this.addEventListener('pointerup',     this._boundPointerUp);
        this.addEventListener('pointercancel', this._boundPointerCancel);
        document.addEventListener('keydown', this._boundKeydown, true);

        // Re-measure whenever the overlay changes size — e.g. the HA sidebar is
        // expanded/collapsed, the window resizes, or a responsive breakpoint
        // changes the grid. Without this the chrome stays pinned to the old cell
        // rects and drifts out of alignment with the real grid.
        this._resizeObserver = new ResizeObserver(() => this._scheduleMeasure());
        this._resizeObserver.observe(this);
    }

    disconnectedCallback() {
        super.disconnectedCallback();
        this.removeEventListener('pointermove',   this._boundPointerMove);
        this.removeEventListener('pointerup',     this._boundPointerUp);
        this.removeEventListener('pointercancel', this._boundPointerCancel);
        document.removeEventListener('keydown', this._boundKeydown, true);
        this._resizeObserver?.disconnect();
        this._resizeObserver = null;
    }

    /** Escape closes the innermost open editor UI (rename, menu, popup, panel). */
    _onDocKeydown(e) {
        if (e.key !== 'Escape') return;
        let handled = true;
        if (this._renaming)           this._renaming = null;
        else if (this._trackPopover)  this._trackPopover = null;
        else if (this._showNameInput) this._cancelSelection();
        else if (this._areaSettings)  this._areaSettings = null;
        else if (this._showSettings)  this._showSettings = false;
        else handled = false;
        if (handled) {
            e.stopImmediatePropagation();
            e.preventDefault();
        }
    }

    // Unified pointer move/up/cancel dispatcher — routes to the active drag handler
    _onAnyPointerMove(e) {
        if (this._resizeDrag)    this._resizeMove(e);
        if (this._reorderDrag)   this._reorderMove(e);
        if (this._selDrag)       this._selMove(e);
        if (this._areaDrag)      this._areaDragMove(e);
    }
    _onAnyPointerUp(e) {
        if (this._resizeDrag)    this._resizeUp(e);
        if (this._reorderDrag)   this._reorderUp(e);
        if (this._selDrag)       this._selUp(e);
        if (this._areaDrag)      this._areaDragEnd(e, true);
    }
    /** The browser took the pointer (scroll, system gesture): end every drag. */
    _onAnyPointerCancel(e) {
        if (this._resizeDrag)    this._resizeUp(e);   // keep the size reached so far
        if (this._reorderDrag)   this._cancelReorder();
        if (this._selDrag)       { this._selDrag = false; this._cancelSelection(); }
        if (this._areaDrag)      this._areaDragEnd(e, false);
    }

    /** Hit-test which cell (r,c) the pointer is over, using measured cell rects. */
    _cellAtPoint(clientX, clientY) {
        const { x, y } = this._toLocal(clientX, clientY);
        for (let r = 0; r < this._cells.length; r++) {
            for (let c = 0; c < (this._cells[r]?.length ?? 0); c++) {
                const cell = this._cells[r][c];
                if (!cell) continue;
                if (x >= cell.left && x <= cell.right && y >= cell.top && y <= cell.bottom) {
                    return { r, c };
                }
            }
        }
        return null;
    }

    updated() {
        this.style.setProperty('--area-tint', `${this._areaTint}%`);
        this._scheduleMeasure();
        // Tell the host when the dock opens or closes, so it can narrow the grid.
        const open = this._dockOpen;
        if (open !== this._dockWasOpen) {
            this._dockWasOpen = open;
            this.dispatchEvent(new CustomEvent('dock-changed', { detail: { open }, bubbles: false }));
        }
    }

    /**
     * Force a re-measure. Useful when the overlay's container changes size in a way
     * a ResizeObserver may miss the right moment for — e.g. a dialog open animation.
     */
    refresh() {
        this._scheduleMeasure();
    }

    _scheduleMeasure() {
        if (this._measureScheduled) return;
        this._measureScheduled = true;
        requestAnimationFrame(() => {
            this._measureScheduled = false;
            this._measure();
        });
    }

    /**
     * The overlay's on-screen scale (x, y): 1 normally, less while an ancestor is
     * transformed (e.g. the layout studio dialog's open animation). Measurements
     * and pointer positions are divided by it, so the chrome is laid out in the
     * overlay's own CSS pixels and a measurement taken mid-animation stays right.
     */
    _scale() {
        const r = this.getBoundingClientRect();
        return {
            r,
            sx: this.offsetWidth  ? (r.width  / this.offsetWidth)  || 1 : 1,
            sy: this.offsetHeight ? (r.height / this.offsetHeight) || 1 : 1,
        };
    }

    /** A viewport point in overlay-local CSS px. */
    _toLocal(/** @type {number} */ clientX, /** @type {number} */ clientY) {
        const { r, sx, sy } = this._scale();
        return { x: (clientX - r.left) / sx, y: (clientY - r.top) / sy };
    }

    _measure() {
        const ghost = this._qh('#ghost-grid');
        if (!ghost) return;

        const { r: overlayRect, sx, sy } = this._scale();
        this._overlayRect = { left: 0, top: 0, width: this.offsetWidth, height: this.offsetHeight };

        /** @type {any[][]} */
        const newCells = [];
        const numRows = this.rows.length;
        const numCols = this.columns.length;
        for (let r = 0; r < numRows; r++) {
            newCells[r] = [];
            for (let c = 0; c < numCols; c++) {
                const cell = ghost.querySelector(`.gc[data-r="${r}"][data-c="${c}"]`);
                if (cell) {
                    const rect = cell.getBoundingClientRect();
                    newCells[r][c] = {
                        left:   (rect.left   - overlayRect.left) / sx,
                        top:    (rect.top    - overlayRect.top)  / sy,
                        right:  (rect.right  - overlayRect.left) / sx,
                        bottom: (rect.bottom - overlayRect.top)  / sy,
                        width:  rect.width  / sx,
                        height: rect.height / sy,
                    };
                }
            }
        }
        this._cells = newCells;
        this._positionElements();
    }

    _positionElements() {
        if (!this._cells.length) return;
        this._positionColumnHeaders();
        this._positionRowHeaders();
        this._positionResizeHandles();
        this._positionAreaOverlays();
        this._positionCellTargets();
        this._positionSelectionRect();
        this._positionNamePopup();
        this._positionAreaGrips();
        this._positionAreaPreview();
    }

    // ──────────────────────────────────────────────────────────────────────
    // Render
    // ──────────────────────────────────────────────────────────────────────

    render() {
        return html`
            ${this._renderGhostGrid()}
            ${this._renderColumnHeaders()}
            ${this._renderRowHeaders()}
            ${this._renderResizeHandles()}
            ${this._renderAreaOverlays()}
            ${this._renderCellTargets()}
            ${this._selStart && this._selEnd ? html`<div class="sel-rect" id="sel-rect"></div>` : nothing}
            ${this._showNameInput ? this._renderNamePopup() : nothing}
            ${this._renderAreaGrips()}
            ${this._areaDragPreview ? html`<div class="area-preview ${this._areaDragPreview.ok ? 'ok' : 'blocked'}" id="area-preview"></div>` : nothing}
            ${this._renderToolbar()}
            ${this._renderDock()}
            <div class="drag-chip" id="drag-chip"></div>
        `;
    }

    _renderGhostGrid() {
        // Prefer resolved pixel track sizes from the real grid when provided, so the
        // (content-less) ghost matches content-sized tracks like `auto`/min-content.
        // Falls back to the declared tracks when no measurement is supplied.
        const measureCols = this.measureColumns?.length ? this.measureColumns : this.columns;
        const measureRows = this.measureRows?.length ? this.measureRows : this.rows;
        // Start where the real grid's first cell starts (its edit reserve, padding
        // and margin); before the first measurement, assume the grid edit reserve.
        const offset = this.measureOffset ?? editReserve('grid');
        const style = [
            `padding: ${offset.top}px 0 0 ${offset.left}px`,
            `grid-template-columns: ${measureCols.join(' ')}`,
            `grid-template-rows: ${measureRows.join(' ')}`,
            `gap: ${this.gap}`,
        ].join('; ');
        const cells = [];
        for (let r = 0; r < this.rows.length; r++) {
            for (let c = 0; c < this.columns.length; c++) {
                cells.push(html`<div class="gc" data-r="${r}" data-c="${c}"></div>`);
            }
        }
        return html`<div id="ghost-grid" style="${style}">${cells}</div>`;
    }

    _renderToolbar() {
        const hint = this._selectedArea
            ? `Area "${this._selectedArea}": drag its edges to resize, its name to move · ⋮ for more`
            : 'Click or drag across empty cells to create an area · click a column or row header for its size';
        return html`
            <div class="edit-bar" id="toolbar" role="toolbar" aria-label="Layout editor">
                ${this.hideCardMode ? nothing : html`
                    ${renderModeToggle('grid', () => this.dispatchEvent(new CustomEvent('switch-to-cards-mode', { bubbles: false })))}
                    <div class="edit-bar-sep"></div>
                `}
                <ha-button appearance="plain" size="s" @click=${() => this._addTrack('col')}>
                    <ha-svg-icon slot="start" .path=${ICON.colAfter}></ha-svg-icon>
                    Column
                </ha-button>
                <ha-button appearance="plain" size="s" @click=${() => this._addTrack('row')}>
                    <ha-svg-icon slot="start" .path=${ICON.rowAfter}></ha-svg-icon>
                    Row
                </ha-button>
                <div class="edit-bar-sep"></div>
                <label class="t-tint" title="Area tint: raise it when an area's colour is close to its cards">
                    <ha-svg-icon .path=${ICON.opacity}></ha-svg-icon>
                    <input type="range" min="0" max="100" step="5" aria-label="Area tint"
                        .value=${String(this._areaTint)}
                        @input=${(/** @type {Event} */ e) => {
                            this._areaTint = Number(/** @type {HTMLInputElement} */ (e.target).value);
                            setStickyAreaTint(this._areaTint);
                        }}
                    >
                </label>
                ${this.hideSettings ? nothing : html`
                    <div class="edit-bar-sep"></div>
                    <ha-icon-button
                        class=${this._showSettings ? 'active' : ''}
                        .path=${ICON.tune}
                        .label=${'Grid settings (gap, height, margins)'}
                        title="Grid settings (gap, height, margins)"
                        @click=${() => this._openDock(this._showSettings ? null : { settings: true })}
                    ></ha-icon-button>
                `}
                ${renderBarHint(hint)}
            </div>
        `;
    }

    // ──────────────────────────────────────────────────────────────────────
    // Docked inspector: grid settings, a track, or an area's settings
    // ──────────────────────────────────────────────────────────────────────

    /**
     * Show one thing in the dock (or close it with null). The dock holds one
     * subject at a time; opening another replaces it.
     * @param {{settings?: boolean, track?: {axis: string, index: number}, area?: string} | null} what
     */
    _openDock(what) {
        this._showSettings = !!what?.settings && !this.hideSettings;
        this._trackPopover = what?.track ?? null;
        this._areaSettings = what?.area ?? null;
        if (what?.area) this._selectedArea = what.area;
    }

    get _dockOpen() {
        return !!(this._areaSettings || this._trackPopover || (this._showSettings && !this.hideSettings));
    }

    _renderDock() {
        /** @type {string} */ let title;
        let body;
        if (this._areaSettings) {
            title = `Area: ${this._areaSettings}`;
            body = this._renderAreaSettingsBody();
        } else if (this._trackPopover) {
            const { axis, index } = this._trackPopover;
            title = `${axis === 'col' ? 'Column' : 'Row'} ${index + 1}`;
            body = this._renderTrackBody();
        } else if (this._showSettings && !this.hideSettings) {
            title = 'Grid settings';
            body = this._renderSettingsBody();
        } else {
            return nothing;
        }
        return html`
            <aside class="edit-dock" id="dock" aria-label="${title}"
                @click=${(e) => e.stopPropagation()}
                @keydown=${(e) => { if (e.key !== 'Escape') e.stopPropagation(); }}>
                ${renderPanelHeader(title, () => this._openDock(null))}
                <div class="edit-dock-body">${body}</div>
            </aside>
        `;
    }

    _renderSettingsBody() {
        const layout = this.layout ?? {};
        return html`
            <div class="settings-hint">Press Enter or click away to apply each value.</div>
            <ha-input
                label="Gap"
                .value=${this.gap ?? ''}
                title="Space between grid cells (e.g. 5px, 8px)"
                @change=${(e) => this._emitGridState(this.columns, this.rows, this.areas, e.target.value)}
            ></ha-input>
            <ha-input
                label="Height"
                .value=${layout.height ?? 'calc(100dvh - var(--header-height, 56px))'}
                title="View height (e.g. calc(100dvh - 56px), 800px)"
                @change=${(e) => this._emitLayoutProp('height', e.target.value)}
            ></ha-input>
            <ha-input
                label="Card margin"
                .value=${layout.card_margin ?? ''}
                placeholder="4px"
                title="Margin around each card (e.g. 4px, 0)"
                @change=${(e) => this._emitLayoutProp('card_margin', e.target.value || undefined)}
            ></ha-input>
            <ha-input
                label="Padding"
                .value=${layout.padding ?? ''}
                placeholder="none"
                title="Inner padding of the grid container"
                @change=${(e) => this._emitLayoutProp('padding', e.target.value || undefined)}
            ></ha-input>
        `;
    }

    /** A track in the dock: size presets, custom size, insert before/after, delete. */
    _renderTrackBody() {
        if (!this._trackPopover) return nothing;
        const { axis, index } = this._trackPopover;
        const isCol   = axis === 'col';
        const current = isCol ? this.columns[index] : this.rows[index];
        const count   = isCol ? this.columns.length : this.rows.length;
        const presets = isCol
            ? ['1fr', '2fr', '3fr', 'auto', '100px', '200px', '300px', '50%', 'clamp(100px,12vw,200px)']
            : ['1fr', '2fr', 'auto', '60px', '80px', '120px', '50%', 'clamp(40px,8vh,100px)'];
        const resizable = isResizableTrack(parseTrackValue(current ?? ''));

        return html`
            <div class="settings-hint">Size of this ${isCol ? 'column' : 'row'}${resizable ? '' : ' (not resizable by dragging: set it here)'}.</div>
            <div class="tp-presets">
                ${presets.map(p => html`
                    <button class="tp-preset ${p === current ? 'current' : ''}"
                        @click=${() => this._commitTrack(axis, index, p)}
                    >${p}</button>
                `)}
            </div>
            <ha-input
                id="track-size"
                label="Custom size"
                .value=${current}
                placeholder="e.g. 1fr, 200px, 25%"
                @keydown=${(e) => { if (e.key === 'Enter') this._commitTrack(axis, index, e.target.value); }}
                @change=${(e) => this._commitTrack(axis, index, e.target.value)}
            ></ha-input>
            <div class="edit-panel-actions">
                <ha-button appearance="plain" size="s" @click=${() => this._insertTrackAt(axis, index)}>
                    <ha-svg-icon slot="start" .path=${isCol ? ICON.colBefore : ICON.rowBefore}></ha-svg-icon>
                    ${isCol ? 'Insert left' : 'Insert above'}
                </ha-button>
                <ha-button appearance="plain" size="s" @click=${() => this._insertTrackAt(axis, index + 1)}>
                    <ha-svg-icon slot="start" .path=${isCol ? ICON.colAfter : ICON.rowAfter}></ha-svg-icon>
                    ${isCol ? 'Insert right' : 'Insert below'}
                </ha-button>
                <ha-button appearance="plain" variant="danger" size="s" ?disabled=${count <= 1}
                    @click=${() => { this._openDock(null); this._deleteTrack(axis, index); }}>
                    <ha-svg-icon slot="start" .path=${ICON.delete}></ha-svg-icon>
                    Delete
                </ha-button>
            </div>
        `;
    }

    _openTrackPopover(axis, index) {
        this._openDock({ track: { axis, index } });
    }

    _emitLayoutProp(key, value) {
        const newLayout = { ...(this.layout ?? {}) };
        if (value == null || value === '') delete newLayout[key];
        else newLayout[key] = value;
        this.dispatchEvent(new CustomEvent('layout-settings-changed', {
            detail: { layout: newLayout },
            bubbles: false,
        }));
    }

    _renderColumnHeaders() {
        return this.columns.map((size, i) => this._renderTrackHeader('col', i, size));
    }

    _renderRowHeaders() {
        return this.rows.map((size, i) => this._renderTrackHeader('row', i, size));
    }

    /** A column/row header in the gutter: click opens the track menu, drag reorders. */
    _renderTrackHeader(/** @type {'col'|'row'} */ axis, /** @type {number} */ i, /** @type {string} */ size) {
        const isDragging = this._reorderDrag?.axis === axis && this._reorderDrag?.fromIndex === i;
        const isTarget   = this._reorderPreview?.axis === axis && this._reorderPreview?.to === i;
        const isOpen     = this._trackPopover?.axis === axis && this._trackPopover?.index === i;
        const name = `${axis === 'col' ? 'Column' : 'Row'} ${i + 1}`;
        return html`
            <div
                class="${axis}-header ${isDragging ? 'dragging' : ''} ${isTarget ? 'drop-target' : ''} ${isOpen ? 'open' : ''}"
                id="${axis === 'col' ? 'ch' : 'rh'}-${i}"
                role="button"
                tabindex="0"
                aria-label="${name}: ${size}. Click for size options, drag to reorder."
                title="${name}: ${size} · click for options, drag to reorder"
                @pointerdown=${(e) => this._headerPointerDown(e, axis, i)}
                @click=${(e) => { e.stopPropagation(); if (this._consumeReorderClick()) return; this._openTrackPopover(axis, i); }}
                @keydown=${(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); this._openTrackPopover(axis, i); } }}
            >
                <span class="track-label">${size}</span>
            </div>
        `;
    }

    /**
     * Resize handles: for each boundary between two tracks, one segment in the
     * header gutter and one per cell along it. Segments
     * whose two cells belong to the same area are hidden in _positionResizeHandles,
     * so a spanning area keeps its middle.
     */
    _renderResizeHandles() {
        const handles = [];
        for (const axis of /** @type {const} */ (['col', 'row'])) {
            const tracks = axis === 'col' ? this.columns : this.rows;
            const cross  = axis === 'col' ? this.rows.length : this.columns.length;
            for (let i = 0; i < tracks.length - 1; i++) {
                const resizable = isResizableTrack(parseTrackValue(tracks[i])) &&
                                  isResizableTrack(parseTrackValue(tracks[i + 1]));
                const down = resizable ? (e) => this._resizePointerDown(e, axis, i) : nothing;
                const title = resizable ? 'Drag to resize' : 'Not resizable by dragging (clamp/minmax/auto track)';
                const cls = `rh-seg ${axis} ${resizable ? '' : 'disabled'}`;
                // Inserting a track is in the track menu (header click) and on the
                // toolbar; a button here would cover the handle.
                handles.push(html`<div class="${cls} gutter" id="rh-${axis}-${i}-g" data-b="${axis}-${i}" title=${title} @pointerdown=${down}></div>`);
                for (let k = 0; k < cross; k++) {
                    handles.push(html`<div class="${cls}" id="rh-${axis}-${i}-${k}" data-b="${axis}-${i}" title=${title} @pointerdown=${down}></div>`);
                }
            }
        }
        return handles;
    }

    _insertTrackAt(axis, index) {
        const { grid2d, columns, rows } = insertTrack(
            this.areas, this.columns, this.rows, axis, index, '1fr',
        );
        this._emitGridState(columns, rows, grid2d);
    }

    _renderAreaOverlays() {
        return getAreaNames(this.areas).map(name => {
            const isSelected = this._selectedArea === name;
            const isRenaming = this._renaming === name;
            const { bg } = areaColor(name);
            const cardTypes = (this.cardConfigs ?? [])
                .filter(c => c?.view_layout?.['grid-area'] === name)
                .map(c => String(c?.type ?? 'card').replace('custom:', ''));
            const cardsLabel = cardTypes.length > 1
                ? `${cardTypes.length} cards (stacked)`
                : cardTypes[0] ?? 'empty';

            const controls = isRenaming
                ? html`
                    <div class="area-rename" @click=${(e) => e.stopPropagation()}>
                        <input
                            .value=${name}
                            placeholder="area-name"
                            aria-label="Area name"
                            @keydown=${(/** @type {KeyboardEvent} */ e) => {
                                e.stopPropagation();
                                if (e.key === 'Enter')  { this._commitRenameFromBar(name, /** @type {HTMLInputElement} */ (e.target).value); }
                                if (e.key === 'Escape') { this._renaming = null; }
                            }}
                            @blur=${(/** @type {FocusEvent} */ e) => {
                                if (this._renaming === name) this._commitRenameFromBar(name, /** @type {HTMLInputElement} */ (e.target).value);
                            }}
                        >
                        <ha-icon-button .path=${ICON.check} .label=${'Confirm rename'}
                            @pointerdown=${(e) => e.preventDefault() /* keep the input focused */}
                            @click=${(/** @type {MouseEvent} */ e) => {
                                const input = /** @type {HTMLInputElement|null} */ (this._qh(`#ao-${name} .area-rename input`));
                                if (input) this._commitRenameFromBar(name, input.value);
                            }}></ha-icon-button>
                        <ha-icon-button .path=${ICON.close} .label=${'Cancel rename'}
                            @pointerdown=${(e) => e.preventDefault()}
                            @click=${() => { this._renaming = null; }}></ha-icon-button>
                    </div>`
                : html`
                    <ha-dropdown class="area-menu" placement="bottom-end"
                        @click=${(e) => e.stopPropagation()}
                        @wa-select=${(e) => this._onAreaMenuSelect(name, e.detail?.item?.value)}>
                        <ha-icon-button slot="trigger" .path=${ICON.dotsVertical} .label=${`Area ${name} options`}></ha-icon-button>
                        <ha-dropdown-item value="rename">
                            <ha-svg-icon slot="icon" .path=${ICON.rename}></ha-svg-icon>
                            Rename
                        </ha-dropdown-item>
                        <ha-dropdown-item value="add">
                            <ha-svg-icon slot="icon" .path=${ICON.plus}></ha-svg-icon>
                            ${cardTypes.length ? 'Add another card' : 'Add card'}
                        </ha-dropdown-item>
                        <ha-dropdown-item value="settings">
                            <ha-svg-icon slot="icon" .path=${ICON.tune}></ha-svg-icon>
                            Area settings
                        </ha-dropdown-item>
                        <div class="menu-sep" role="separator"></div>
                        <ha-dropdown-item value="delete" variant="danger">
                            <ha-svg-icon slot="icon" .path=${ICON.delete}></ha-svg-icon>
                            Delete area
                        </ha-dropdown-item>
                    </ha-dropdown>`;

            return html`
                <div
                    class="area-overlay ${isSelected ? 'selected' : ''} ${isRenaming ? 'renaming' : ''} ${this._areaDrag?.name === name && this._areaDrag.moved ? 'dragging' : ''}"
                    id="ao-${name}"
                    style="display:none; --area-color: ${bg};"
                    @click=${(e) => { e.stopPropagation(); if (this._consumeReorderClick()) return; this._selectArea(name); }}
                >
                    <div class="area-label">
                        <span class="area-name" title="Drag to move the area"
                            @pointerdown=${(e) => this._areaDragStart(e, name, 'move')}>${name}</span>
                        <span class="area-cards">${cardsLabel}</span>
                    </div>
                    ${controls}
                </div>
            `;
        });
    }

    _onAreaMenuSelect(/** @type {string} */ name, /** @type {string|undefined} */ action) {
        this._selectedArea = name;
        if (action === 'rename')   this._startBarRename(name);
        if (action === 'add')      this._addCardToArea(name);
        if (action === 'settings') this._openAreaSettings(name);
        if (action === 'delete')   this._deleteArea(name);
    }

    _renderCellTargets() {
        const targets = [];
        for (let r = 0; r < this.rows.length; r++) {
            for (let c = 0; c < this.columns.length; c++) {
                const occupied = this.areas[r]?.[c] !== '.';
                if (occupied) continue;
                const inSel = this._isCellInSel(r, c);
                // A click (no drag) on an empty cell creates a one-cell area, a drag
                // across cells creates a bigger one (both handled in _selUp, since the
                // captured pointer sends the click to the cell, not the button). The
                // button is the keyboard path.
                targets.push(html`
                    <div
                        class="cell-target ${inSel ? 'in-sel' : ''}"
                        id="ct-${r}-${c}"
                        data-r="${r}" data-c="${c}"
                        style="display:none;"
                        @pointerdown=${(e) => this._cellPointerDown(e, r, c)}
                    >
                        <button
                            class="cell-add-btn"
                            title="Create area here (or drag across cells)"
                            @click=${(e) => { e.stopPropagation(); if (e.detail === 0) this._createSingleCellArea(r, c); }}
                        >
                            <ha-svg-icon .path=${ICON.plus}></ha-svg-icon>
                            <span>Create area</span>
                        </button>
                    </div>
                `);
            }
        }
        return targets;
    }

    _renderNamePopup() {
        return html`
            <div class="edit-panel name-popup" id="name-popup" style="display:none;">
                ${renderPanelHeader('Name this area', () => this._cancelSelection())}
                <div class="edit-panel-body">
                    <ha-input
                        .value=${this._selectionName}
                        placeholder="area-name"
                        hint="Letters, numbers, - and _"
                        ?invalid=${!!this._nameError}
                        validation-message=${this._nameError || ''}
                        @input=${(e) => { this._selectionName = e.target.value; this._nameError = ''; }}
                        @keydown=${this._nameInputKeydown}
                        autofocus
                    ></ha-input>
                    <div class="edit-panel-actions">
                        <ha-button appearance="plain" @click=${this._cancelSelection}>Cancel</ha-button>
                        <ha-button variant="brand" @click=${this._confirmSelection}>Create</ha-button>
                    </div>
                </div>
            </div>
        `;
    }

    // ──────────────────────────────────────────────────────────────────────
    // Positioning from measurements
    // ──────────────────────────────────────────────────────────────────────

    _positionColumnHeaders() {
        const cells = this._cells;
        if (!cells.length || !cells[0]?.length) return;
        for (let i = 0; i < this.columns.length; i++) {
            const el = this._qh(`#ch-${i}`);
            const cell = cells[0]?.[i];
            if (!el || !cell) continue;
            // In the gutter above the first row.
            el.style.left   = `${cell.left + HEADER_INSET}px`;
            el.style.width  = `${Math.max(0, cell.width - 2 * HEADER_INSET)}px`;
            el.style.top    = `${cell.top - GUTTER + HEADER_INSET}px`;
            el.style.height = `${GUTTER - 2 * HEADER_INSET}px`;
        }
    }

    _positionRowHeaders() {
        const cells = this._cells;
        if (!cells.length) return;
        for (let i = 0; i < this.rows.length; i++) {
            const el = this._qh(`#rh-${i}`);
            const cell = cells[i]?.[0];
            if (!el || !cell) continue;
            // In the gutter left of the first column.
            el.style.top    = `${cell.top + HEADER_INSET}px`;
            el.style.height = `${Math.max(0, cell.height - 2 * HEADER_INSET)}px`;
            el.style.left   = `${cell.left - GUTTER + HEADER_INSET}px`;
            el.style.width  = `${GUTTER - 2 * HEADER_INSET}px`;
        }
    }

    _positionResizeHandles() {
        const cells = this._cells;
        if (!cells.length) return;
        /** @param {HTMLElement|null} el @param {number} left @param {number} top @param {number} width @param {number} height */
        const place = (el, left, top, width, height) => {
            if (!el) return;
            el.style.display = 'flex';
            el.style.left   = `${left}px`;
            el.style.top    = `${top}px`;
            el.style.width  = `${width}px`;
            el.style.height = `${height}px`;
        };
        const sameArea = (/** @type {string|undefined} */ a, /** @type {string|undefined} */ b) => a != null && a !== '.' && a === b;

        for (let i = 0; i < this.columns.length - 1; i++) {
            const a = cells[0]?.[i];
            const b = cells[0]?.[i + 1];
            if (!a || !b) continue;
            const x = (a.right + b.left) / 2 - HANDLE_SIZE / 2;
            place(this._qh(`#rh-col-${i}-g`), x, a.top - GUTTER, HANDLE_SIZE, GUTTER);
            for (let r = 0; r < this.rows.length; r++) {
                const el = this._qh(`#rh-col-${i}-${r}`);
                const cell = cells[r]?.[i];
                if (!el || !cell) continue;
                if (sameArea(this.areas[r]?.[i], this.areas[r]?.[i + 1])) { el.style.display = 'none'; continue; }
                // Extend through the row gap below so the segments join up.
                const next = cells[r + 1]?.[i];
                place(el, x, cell.top, HANDLE_SIZE, (next ? next.top : cell.bottom) - cell.top);
            }
        }

        for (let i = 0; i < this.rows.length - 1; i++) {
            const a = cells[i]?.[0];
            const b = cells[i + 1]?.[0];
            if (!a || !b) continue;
            const y = (a.bottom + b.top) / 2 - HANDLE_SIZE / 2;
            place(this._qh(`#rh-row-${i}-g`), a.left - GUTTER, y, GUTTER, HANDLE_SIZE);
            for (let c = 0; c < this.columns.length; c++) {
                const el = this._qh(`#rh-row-${i}-${c}`);
                const cell = cells[i]?.[c];
                if (!el || !cell) continue;
                if (sameArea(this.areas[i]?.[c], this.areas[i + 1]?.[c])) { el.style.display = 'none'; continue; }
                const next = cells[i]?.[c + 1];
                place(el, cell.left, y, (next ? next.left : cell.right) - cell.left, HANDLE_SIZE);
            }
        }
    }

    _positionAreaOverlays() {
        const cells = this._cells;
        if (!cells.length) return;
        for (const name of getAreaNames(this.areas)) {
            const el = this._qh(`#ao-${name}`);
            if (!el) continue;
            const bounds = getAreaBounds(this.areas, name);
            if (!bounds) continue;
            const { r1, c1, r2, c2 } = bounds;
            const tl = cells[r1]?.[c1];
            const br = cells[r2 - 1]?.[c2 - 1];
            if (!tl || !br) continue;
            el.style.display = 'block';
            el.style.left    = `${tl.left}px`;
            el.style.top     = `${tl.top}px`;
            el.style.width   = `${br.right - tl.left}px`;
            el.style.height  = `${br.bottom - tl.top}px`;
        }
    }

    _positionCellTargets() {
        const cells = this._cells;
        if (!cells.length) return;
        for (let r = 0; r < this.rows.length; r++) {
            for (let c = 0; c < this.columns.length; c++) {
                if (this.areas[r]?.[c] !== '.') continue;
                const el = this._qh(`#ct-${r}-${c}`);
                if (!el) continue;
                const cell = cells[r]?.[c];
                if (!cell) continue;
                el.style.display = 'block';
                el.style.left    = `${cell.left}px`;
                el.style.top     = `${cell.top}px`;
                el.style.width   = `${cell.width}px`;
                el.style.height  = `${cell.height}px`;
            }
        }
    }

    _positionSelectionRect() {
        if (!this._selStart || !this._selEnd) return;
        const cells = this._cells;
        if (!cells.length) return;
        const { r: r1, c: c1 } = this._selStart;
        const { r: r2, c: c2 } = this._selEnd;
        const minR = Math.min(r1, r2), maxR = Math.max(r1, r2);
        const minC = Math.min(c1, c2), maxC = Math.max(c1, c2);
        const tl = cells[minR]?.[minC];
        const br = cells[maxR]?.[maxC];
        if (!tl || !br) return;
        const el = this._qh('#sel-rect');
        if (!el) return;
        el.style.left   = `${tl.left}px`;
        el.style.top    = `${tl.top}px`;
        el.style.width  = `${br.right  - tl.left}px`;
        el.style.height = `${br.bottom - tl.top}px`;
    }

    _positionNamePopup() {
        if (!this._showNameInput || !this._selStart || !this._selEnd) return;
        const cells = this._cells;
        if (!cells.length) return;
        const { r: r1, c: c1 } = this._selStart;
        const { r: r2, c: c2 } = this._selEnd;
        const minR = Math.min(r1, r2), maxR = Math.max(r1, r2);
        const minC = Math.min(c1, c2), maxC = Math.max(c1, c2);
        const tl = cells[minR]?.[minC];
        const br = cells[maxR]?.[maxC];
        if (!tl || !br) return;
        const popup = this._qh('#name-popup');
        if (!popup) return;
        popup.style.display = 'block';
        const cx = tl.left + (br.right  - tl.left) / 2;
        const cy = tl.top  + (br.bottom - tl.top)  / 2;
        const popupW = popup.offsetWidth, popupH = popup.offsetHeight;
        const oW = this._overlayRect?.width ?? 800, oH = this._overlayRect?.height ?? 600;
        popup.style.left = `${Math.max(4, Math.min(cx - popupW / 2, oW - popupW - 4))}px`;
        popup.style.top  = `${Math.max(EDIT_BAR_HEIGHT + 4, Math.min(cy - popupH / 2, oH - popupH - 4))}px`;
        // Focus the input once, when the popup opens (not on every re-measure).
        if (!popup.dataset.focused) {
            popup.dataset.focused = '1';
            requestAnimationFrame(() => (/** @type {HTMLElement|null} */ (popup.querySelector('ha-input')))?.focus());
        }
    }

    // ──────────────────────────────────────────────────────────────────────
    // Track interactions
    // ──────────────────────────────────────────────────────────────────────

    _commitTrack(axis, index, value) {
        const trimmed = value?.trim();
        if (!trimmed) return;
        const newTracks = axis === 'col' ? [...this.columns] : [...this.rows];
        newTracks[index] = trimmed;
        this._emitGridState(
            axis === 'col' ? newTracks : this.columns,
            axis === 'row' ? newTracks : this.rows,
        );
    }

    _addTrack(axis) {
        const { grid2d, columns, rows } = insertTrack(
            this.areas, this.columns, this.rows,
            axis,
            axis === 'col' ? this.columns.length : this.rows.length,
            '1fr',
        );
        this._emitGridState(columns, rows, grid2d);
    }

    async _deleteTrack(axis, index) {
        if (axis === 'col' && this.columns.length <= 1) return;
        if (axis === 'row' && this.rows.length <= 1) return;

        const label = axis === 'col' ? `column ${index + 1}` : `row ${index + 1}`;
        const confirmed = await showConfirmDeleteDialog({
            title: `Delete ${label}?`,
            message: `Removing this ${axis === 'col' ? 'column' : 'row'} will resize the grid and `
                + `delete any areas (and the cards inside them) that fit only within it.`,
        });
        if (!confirmed) return;

        const { grid2d, columns, rows } = removeTrack(
            this.areas, this.columns, this.rows, axis, index,
        );
        this._emitGridState(columns, rows, grid2d);
    }

    // ──────────────────────────────────────────────────────────────────────
    // Track reorder (header drag)
    // ──────────────────────────────────────────────────────────────────────

    _headerPointerDown(e, axis, index) {
        if (e.button !== 0) return;
        e.stopPropagation();
        e.currentTarget.setPointerCapture(e.pointerId);
        // pointermove/up are handled by the unified listener in connectedCallback
        this._reorderDrag = { axis, fromIndex: index, currentIndex: index };
        this._reorderStart = { x: e.clientX, y: e.clientY };
        this._reorderMoved = false;
        this._updateDragChip(e.clientX, e.clientY);
    }

    /** True (once) if the just-finished pointer interaction was a drag, so the
     *  trailing click should be ignored instead of opening the size popover. */
    _consumeReorderClick() {
        if (this._suppressClick) { this._suppressClick = false; return true; }
        return false;
    }

    /** Position/label the floating chip that shows which track is being dragged. */
    _updateDragChip(clientX, clientY) {
        const chip = this._qh('#drag-chip');
        if (!chip || !this._reorderDrag) return;
        const { axis, fromIndex, currentIndex } = this._reorderDrag;
        const label = axis === 'col' ? 'Col' : 'Row';
        chip.textContent = currentIndex !== fromIndex
            ? `${label} ${fromIndex + 1} → ${currentIndex + 1}`
            : `${label} ${fromIndex + 1}`;
        const { x, y } = this._toLocal(clientX, clientY);
        chip.style.left = `${x + 14}px`;
        chip.style.top  = `${y + 14}px`;
        chip.style.display = 'block';
    }

    _hideDragChip() {
        const chip = this._qh('#drag-chip');
        if (chip) chip.style.display = 'none';
    }

    _reorderMove(e) {
        if (!this._reorderDrag) return;
        const { axis, fromIndex } = this._reorderDrag;
        const cells = this._cells;
        if (!cells.length) return;

        // Mark as a real drag once the pointer moves past a small threshold, so the
        // trailing click is suppressed.
        if (!this._reorderMoved && this._reorderStart) {
            const dx = e.clientX - this._reorderStart.x;
            const dy = e.clientY - this._reorderStart.y;
            if ((dx * dx + dy * dy) > 16) this._reorderMoved = true;
        }

        // document.elementFromPoint returns the shadow host in shadow DOM — unusable.
        // Use cell position measurements to determine which track the pointer is over.
        const local = this._toLocal(e.clientX, e.clientY);
        const pos = axis === 'col' ? local.x : local.y;

        const count = axis === 'col' ? this.columns.length : this.rows.length;
        let targetIndex = this._reorderDrag.currentIndex;
        let minDist = Infinity;
        for (let i = 0; i < count; i++) {
            const cell   = axis === 'col' ? cells[0]?.[i] : cells[i]?.[0];
            if (!cell) continue;
            const center = axis === 'col' ? (cell.left + cell.right) / 2 : (cell.top + cell.bottom) / 2;
            const dist   = Math.abs(pos - center);
            if (dist < minDist) { minDist = dist; targetIndex = i; }
        }

        if (targetIndex !== this._reorderDrag.currentIndex) {
            this._reorderDrag    = { ...this._reorderDrag, currentIndex: targetIndex };
            this._reorderPreview = { axis, from: fromIndex, to: targetIndex };
            this.requestUpdate();
        }
        this._updateDragChip(e.clientX, e.clientY);
    }

    /** Drop a reorder drag without applying it (pointercancel). */
    _cancelReorder() {
        this._reorderDrag    = null;
        this._reorderPreview = null;
        this._reorderMoved   = false;
        this._hideDragChip();
        this.requestUpdate();
    }

    _reorderUp(_e) {
        if (!this._reorderDrag) return;
        const { axis, fromIndex, currentIndex } = this._reorderDrag;
        this._reorderDrag    = null;
        this._reorderPreview = null;
        this._hideDragChip();

        // If the user actually dragged, swallow the click that follows pointerup so
        // it doesn't open the track-size popover. Reset on the next macrotask.
        if (this._reorderMoved) {
            this._suppressClick = true;
            setTimeout(() => { this._suppressClick = false; }, 0);
        }
        this._reorderMoved = false;

        if (fromIndex === currentIndex) { this.requestUpdate(); return; }

        const tracks = axis === 'col' ? this.columns : this.rows;
        const result = reorderTrack(this.areas, tracks, axis, fromIndex, currentIndex);
        if (!result.safe) {
            lcardsLog.warn(`[GridEditOverlay] Reorder blocked by: ${result.blockedBy}`);
            this.requestUpdate();
            return;
        }
        this._emitGridState(
            axis === 'col' ? result.tracks : this.columns,
            axis === 'row' ? result.tracks : this.rows,
            result.grid2d,
        );
    }

    // ──────────────────────────────────────────────────────────────────────
    // Track resize (handle drag)
    // ──────────────────────────────────────────────────────────────────────

    /** Highlight every segment of one resize boundary (the drag spans them all). */
    _setBoundaryActive(axis, index, on) {
        this.renderRoot?.querySelectorAll(`[data-b="${axis}-${index}"]`)
            .forEach(el => el.classList.toggle('active', on));
    }

    _resizePointerDown(e, axis, index) {
        if (e.button !== 0) return;
        e.stopPropagation();
        e.currentTarget.setPointerCapture(e.pointerId);
        this._setBoundaryActive(axis, index, true);

        const ghost    = this._qh('#ghost-grid');
        const container = axis === 'col' ? (ghost?.clientWidth ?? 800) : (ghost?.clientHeight ?? 600);

        this._resizeDrag = {
            axis, index,
            startPos: axis === 'col' ? e.clientX : e.clientY,
            scale: axis === 'col' ? this._scale().sx : this._scale().sy,
            origTracks: axis === 'col' ? [...this.columns] : [...this.rows],
            containerPx: container,
        };

        // pointermove/up are handled by the unified listener in connectedCallback
    }

    _resizeMove(e) {
        if (!this._resizeDrag) return;
        const { axis, index, startPos, origTracks, containerPx, scale } = this._resizeDrag;
        const delta = ((axis === 'col' ? e.clientX : e.clientY) - startPos) / (scale || 1);
        const newTracks = resizeAdjacentTracks(origTracks, index, delta, containerPx, this.gap);
        this._resizeDrag._pendingTracks = newTracks;

        // Live preview: update ghost-grid so measurements stay accurate on next rAF
        const ghost = this._qh('#ghost-grid');
        if (ghost) {
            const prop = axis === 'col' ? 'gridTemplateColumns' : 'gridTemplateRows';
            ghost.style[prop] = newTracks.join(' ');
        }

        // Also update the real grid for visual feedback (via preview event)
        this.dispatchEvent(new CustomEvent('grid-preview-changed', {
            detail: {
                columns: axis === 'col' ? newTracks : this.columns,
                rows:    axis === 'row' ? newTracks : this.rows,
                gap:     this.gap,
            },
            bubbles: false,
        }));

        // Remeasure after the browser updates layout
        this._scheduleMeasure();
    }

    _resizeUp(_e) {
        if (!this._resizeDrag) return;
        const { axis, index, _pendingTracks } = this._resizeDrag;
        this._resizeDrag = null;
        this._setBoundaryActive(axis, index, false);

        if (!_pendingTracks) return;

        // Reset ghost-grid style (it will be set correctly by _emitGridState → re-render)
        const ghost = this._qh('#ghost-grid');
        if (ghost) {
            ghost.style.gridTemplateColumns = '';
            ghost.style.gridTemplateRows    = '';
        }

        this._emitGridState(
            axis === 'col' ? _pendingTracks : this.columns,
            axis === 'row' ? _pendingTracks : this.rows,
        );
    }

    // ──────────────────────────────────────────────────────────────────────
    // Area management
    // ──────────────────────────────────────────────────────────────────────

    _selectArea(name) {
        this._selectedArea = name === this._selectedArea ? null : name;
        this._renaming     = null;
        // The dock follows the selection while it shows an area.
        if (this._areaSettings && this._selectedArea) this._areaSettings = this._selectedArea;
    }

    // ──────────────────────────────────────────────────────────────────────
    // Area move / resize (grips on the selected area, drag its name chip)
    // ──────────────────────────────────────────────────────────────────────

    _renderAreaGrips() {
        if (!this._selectedArea || this._renaming === this._selectedArea) return nothing;
        const name = this._selectedArea;
        const label = { n: 'top', s: 'bottom', e: 'right', w: 'left' };
        return ['n', 's', 'e', 'w'].map(edge => html`
            <div class="area-grip ${edge}" id="ag-${edge}" title="Drag to move the ${label[edge]} edge"
                @pointerdown=${(e) => this._areaDragStart(e, name, edge)}></div>
        `);
    }

    _positionAreaGrips() {
        const name = this._selectedArea;
        const el = name ? this._qh(`#ao-${name}`) : null;
        if (!name || !el) return;
        const left = parseFloat(el.style.left), top = parseFloat(el.style.top);
        const w = parseFloat(el.style.width), h = parseFloat(el.style.height);
        if (![left, top, w, h].every(Number.isFinite)) return;
        const L = Math.min(32, Math.max(16, Math.min(w, h) / 3)); // grip length
        const T = 8;                                              // grip thickness
        /** @type {Record<string, number[]>} edge → [left, top, width, height] */
        const place = {
            n: [left + w / 2 - L / 2, top - T / 2, L, T],
            s: [left + w / 2 - L / 2, top + h - T / 2, L, T],
            w: [left - T / 2, top + h / 2 - L / 2, T, L],
            e: [left + w - T / 2, top + h / 2 - L / 2, T, L],
        };
        for (const [edge, [x, y, gw, gh]] of Object.entries(place)) {
            const g = this._qh(`#ag-${edge}`);
            if (!g) continue;
            Object.assign(g.style, { display: 'block', left: `${x}px`, top: `${y}px`, width: `${gw}px`, height: `${gh}px` });
        }
    }

    _positionAreaPreview() {
        const p = this._areaDragPreview;
        const el = this._qh('#area-preview');
        if (!p || !el) return;
        const tl = this._cells[p.bounds.r1]?.[p.bounds.c1];
        const br = this._cells[p.bounds.r2 - 1]?.[p.bounds.c2 - 1];
        if (!tl || !br) return;
        Object.assign(el.style, {
            left: `${tl.left}px`, top: `${tl.top}px`,
            width: `${br.right - tl.left}px`, height: `${br.bottom - tl.top}px`,
        });
    }

    /**
     * Start moving (mode 'move') or resizing one edge ('n'|'s'|'e'|'w') of an area.
     * @param {PointerEvent} e
     * @param {string} name
     * @param {string} mode
     */
    _areaDragStart(e, name, mode) {
        if (e.button !== 0 || this._renaming === name) return;
        const orig = getAreaBounds(this.areas, name);
        if (!orig) return;
        e.stopPropagation();
        /** @type {HTMLElement} */ (e.currentTarget).setPointerCapture?.(e.pointerId);
        this._areaDrag = {
            name, mode, orig,
            anchor: mode === 'move' ? this._cellAtPoint(e.clientX, e.clientY) : null,
            target: null, ok: false, moved: false,
        };
    }

    _areaDragMove(/** @type {PointerEvent} */ e) {
        const d = this._areaDrag;
        if (!d) return;
        const hit = this._cellAtPoint(e.clientX, e.clientY);
        if (!hit) return; // over a gap or outside the grid: keep the last target
        const { r1, c1, r2, c2 } = d.orig;
        let b = { r1, c1, r2, c2 };
        if (d.mode === 'move') {
            if (!d.anchor) { d.anchor = hit; return; }
            const rows = this.rows.length, cols = this.columns.length;
            const dr = Math.max(-r1, Math.min(rows - r2, hit.r - d.anchor.r));
            const dc = Math.max(-c1, Math.min(cols - c2, hit.c - d.anchor.c));
            b = { r1: r1 + dr, c1: c1 + dc, r2: r2 + dr, c2: c2 + dc };
        } else if (d.mode === 'n') b.r1 = Math.min(hit.r, r2 - 1);
        else if (d.mode === 's') b.r2 = Math.max(hit.r + 1, r1 + 1);
        else if (d.mode === 'w') b.c1 = Math.min(hit.c, c2 - 1);
        else if (d.mode === 'e') b.c2 = Math.max(hit.c + 1, c1 + 1);
        const same = b.r1 === r1 && b.c1 === c1 && b.r2 === r2 && b.c2 === c2;
        if (!same) d.moved = true;
        if (!d.moved) return;
        d.target = b;
        d.ok = !same && setAreaBounds(this.areas, d.name, b).ok;
        this._areaDragPreview = { bounds: b, ok: d.ok || same };
        this.updateComplete.then(() => this._positionAreaPreview());
    }

    /** End an area drag; commit when it ended on a free target (not on cancel). */
    _areaDragEnd(/** @type {PointerEvent} */ _e, /** @type {boolean} */ commit) {
        const d = this._areaDrag;
        this._areaDrag = null;
        this._areaDragPreview = null;
        if (!d) return;
        if (d.moved) {
            // Swallow the click that follows the pointerup (it would toggle selection).
            this._suppressClick = true;
            setTimeout(() => { this._suppressClick = false; }, 0);
        }
        if (!commit || !d.moved || !d.ok || !d.target) return;
        const result = setAreaBounds(this.areas, d.name, d.target);
        if (!result.ok) return;
        this._selectedArea = d.name;
        this._emitGridState(this.columns, this.rows, result.grid2d);
    }

    _startBarRename(name) {
        this._renaming = name;
        this.updateComplete.then(() => {
            /** @type {HTMLInputElement|null} */ (this._qh(`#ao-${name} .aab-rename-input`))?.select();
        });
    }

    _commitRenameFromBar(oldName, newName) {
        this._renaming = null;
        const t = newName?.trim();
        if (t && t !== oldName) this._commitRename(oldName, t);
    }

    _commitRename(oldName, newName) {
        const t = newName?.trim();
        if (!t || t === oldName) return;
        if (!/^[a-zA-Z_-][a-zA-Z0-9_-]*$/.test(t)) {
            lcardsLog.warn(`[GridEditOverlay] Invalid area name: ${t}`);
            return;
        }
        const newAreas = renameArea(this.areas, oldName, t);
        const newCards = (this.cardConfigs ?? []).map(c =>
            c?.view_layout?.['grid-area'] === oldName
                ? { ...c, view_layout: { ...c.view_layout, 'grid-area': t } }
                : c
        );
        this._selectedArea = t;
        if (this._areaSettings === oldName) this._areaSettings = t;
        // Migrate per-area settings BEFORE the grid-state save (the view's
        // _onAreaRenamed updates layout.areas so the rename is preserved).
        this.dispatchEvent(new CustomEvent('area-renamed', {
            detail: { from: oldName, to: t },
            bubbles: false,
        }));
        this._emitGridState(this.columns, this.rows, newAreas);
        this._emitAreaCards(newCards);
    }

    async _deleteArea(name) {
        const confirmed = await showConfirmDeleteDialog({
            title: `Delete area "${name}"?`,
            message: 'This will remove the area and all cards placed inside it.',
            confirmText: 'Delete',
        });
        if (!confirmed) return;
        const newAreas = removeArea(this.areas, name);
        const newCards = (this.cardConfigs ?? []).filter(c => c?.view_layout?.['grid-area'] !== name);
        this._selectedArea = null;
        if (this._areaSettings === name) this._areaSettings = null;
        this._emitGridState(this.columns, this.rows, newAreas);
        this._emitAreaCards(newCards);
    }

    // ──────────────────────────────────────────────────────────────────────
    // Per-area settings panel (floating, draggable)
    // ──────────────────────────────────────────────────────────────────────

    _openAreaSettings(name) {
        this._openDock({ area: name });
    }

    /**
     * Emit a per-area settings change as one patch (one save, one undo step).
     * An empty / undefined value removes that key.
     * @param {string} name
     * @param {Record<string, any>} patch
     */
    _updateAreaSettings(name, patch) {
        this.dispatchEvent(new CustomEvent('area-settings-changed', {
            detail: { name, patch },
            bubbles: false,
        }));
    }

    _renderAreaSettingsBody() {
        const name = this._areaSettings;
        if (!name) return nothing;
        const s    = this.layout?.areas?.[name] ?? {};
        const set  = (/** @type {string} */ key, /** @type {any} */ value) => this._updateAreaSettings(name, { [key]: value });
        const setMany = (/** @type {Record<string, any>} */ patch) => this._updateAreaSettings(name, patch);

        return html`
                <div class="area-body">
                    <lcards-form-section header="Surface" icon="mdi:palette-outline" ?expanded=${true} ?outlined=${true}>
                        <div class="ap-field">
                            <label>Background</label>
                            <lcards-color-picker
                                .hass=${this.hass}
                                .value=${s.background ?? ''}
                                ?showPreview=${true}
                                ?showBuilder=${true}
                                @value-changed=${(e) => set('background', e.detail.value || undefined)}
                            ></lcards-color-picker>
                        </div>
                        <div class="ap-field">
                            <label>Image</label>
                            <ha-input
                                .value=${s['background-image'] ?? ''}
                                placeholder="url(...) or linear-gradient(...)"
                                @change=${(e) => set('background-image', e.target.value || undefined)}
                            ></ha-input>
                        </div>
                        ${s['background-image'] ? html`
                            <div class="ap-field">
                                <label>Fit</label>
                                <ha-selector
                                    .hass=${this.hass}
                                    .selector=${{ select: { mode: 'dropdown', options: AREA_BG_SIZE_OPTIONS } }}
                                    .value=${s['background-size'] ?? 'cover'}
                                    @value-changed=${(e) => set('background-size', e.detail.value === 'cover' ? undefined : e.detail.value)}
                                ></ha-selector>
                            </div>
                            <div class="ap-field">
                                <label>Position</label>
                                <ha-selector
                                    .hass=${this.hass}
                                    .selector=${{ select: { mode: 'dropdown', options: AREA_BG_POSITION_OPTIONS } }}
                                    .value=${s['background-position'] ?? 'center'}
                                    @value-changed=${(e) => set('background-position', e.detail.value === 'center' ? undefined : e.detail.value)}
                                ></ha-selector>
                            </div>
                            <div class="ap-field">
                                <label>Repeat</label>
                                <ha-selector
                                    .hass=${this.hass}
                                    .selector=${{ select: { mode: 'dropdown', options: AREA_BG_REPEAT_OPTIONS } }}
                                    .value=${s['background-repeat'] ?? 'no-repeat'}
                                    @value-changed=${(e) => set('background-repeat', e.detail.value === 'no-repeat' ? undefined : e.detail.value)}
                                ></ha-selector>
                            </div>
                        ` : nothing}
                        <div class="ap-field">
                            <label>Border color</label>
                            <lcards-color-picker
                                .hass=${this.hass}
                                .value=${s['border-color'] ?? ''}
                                ?showPreview=${true}
                                ?showBuilder=${true}
                                @value-changed=${(e) => set('border-color', e.detail.value || undefined)}
                            ></lcards-color-picker>
                        </div>
                        <div class="ap-field">
                            <label>Border</label>
                            <div class="ap-inline">
                                <ha-input
                                    .value=${s['border-width'] ?? ''}
                                    placeholder="2px"
                                    title="Border width"
                                    @change=${(e) => set('border-width', e.target.value || undefined)}
                                ></ha-input>
                                <ha-selector
                                    .hass=${this.hass}
                                    .selector=${{ select: { mode: 'dropdown', options: AREA_BORDER_STYLE_OPTIONS } }}
                                    .value=${s['border-style'] ?? 'none'}
                                    @value-changed=${(e) => set('border-style', e.detail.value === 'none' ? undefined : e.detail.value)}
                                ></ha-selector>
                            </div>
                        </div>
                        <div class="ap-field">
                            <label>Radius</label>
                            <ha-input
                                .value=${s['border-radius'] ?? ''}
                                placeholder="0"
                                title="Corner radius (e.g. 12px, var(--ha-border-radius-lg))"
                                @change=${(e) => set('border-radius', e.target.value || undefined)}
                            ></ha-input>
                        </div>
                    </lcards-form-section>

                    <lcards-form-section header="Placement" icon="mdi:move-resize" ?expanded=${false} ?outlined=${true}>
                        <div class="ap-field">
                            <label>Align ↕</label>
                            <ha-selector
                                .hass=${this.hass}
                                .selector=${{ select: { mode: 'dropdown', options: AREA_ALIGN_V_OPTIONS } }}
                                .value=${s['align-self'] ?? s['place-self'] ?? 'stretch'}
                                @value-changed=${(e) => {
                                    const v = e.detail.value;
                                    const h = s['justify-self'] ?? s['place-self'] ?? 'stretch';
                                    setMany({
                                        'place-self': undefined,
                                        'align-self': v === 'stretch' ? undefined : v,
                                        'justify-self': h === 'stretch' ? undefined : h,
                                    });
                                }}
                            ></ha-selector>
                        </div>
                        <div class="ap-field">
                            <label>Align ↔</label>
                            <ha-selector
                                .hass=${this.hass}
                                .selector=${{ select: { mode: 'dropdown', options: AREA_ALIGN_H_OPTIONS } }}
                                .value=${s['justify-self'] ?? s['place-self'] ?? 'stretch'}
                                @value-changed=${(e) => {
                                    const v = s['align-self'] ?? s['place-self'] ?? 'stretch';
                                    const h = e.detail.value;
                                    setMany({
                                        'place-self': undefined,
                                        'align-self': v === 'stretch' ? undefined : v,
                                        'justify-self': h === 'stretch' ? undefined : h,
                                    });
                                }}
                            ></ha-selector>
                        </div>
                        <div class="ap-field">
                            <label>Inset</label>
                            <ha-input
                                .value=${s.margin ?? ''}
                                placeholder=${this.layout?.card_margin ?? 'none'}
                                title="Space around the card within the area (margin)"
                                @change=${(e) => set('margin', e.target.value || undefined)}
                            ></ha-input>
                        </div>
                        <div class="ap-field">
                            <label>Overflow X</label>
                            <ha-selector
                                .hass=${this.hass}
                                .selector=${{ select: { mode: 'dropdown', options: AREA_OVERFLOW_OPTIONS } }}
                                .value=${s['overflow-x'] ?? s.overflow ?? 'visible'}
                                @value-changed=${(e) => {
                                    const ox = e.detail.value;
                                    const oy = s['overflow-y'] ?? s.overflow ?? 'visible';
                                    setMany({
                                        'overflow': undefined,
                                        'overflow-x': ox === 'visible' ? undefined : ox,
                                        'overflow-y': oy === 'visible' ? undefined : oy,
                                    });
                                }}
                            ></ha-selector>
                        </div>
                        <div class="ap-field">
                            <label>Overflow Y</label>
                            <ha-selector
                                .hass=${this.hass}
                                .selector=${{ select: { mode: 'dropdown', options: AREA_OVERFLOW_OPTIONS } }}
                                .value=${s['overflow-y'] ?? s.overflow ?? 'visible'}
                                @value-changed=${(e) => {
                                    const ox = s['overflow-x'] ?? s.overflow ?? 'visible';
                                    const oy = e.detail.value;
                                    setMany({
                                        'overflow': undefined,
                                        'overflow-x': ox === 'visible' ? undefined : ox,
                                        'overflow-y': oy === 'visible' ? undefined : oy,
                                    });
                                }}
                            ></ha-selector>
                        </div>
                        <div class="ap-field">
                            <label>Layer (z)</label>
                            <ha-input
                                type="number"
                                .value=${s['z-index'] ?? ''}
                                placeholder="0"
                                title="Stacking order of this area's backing surface"
                                @change=${(e) => set('z-index', e.target.value === '' ? undefined : Number(e.target.value))}
                            ></ha-input>
                        </div>
                    </lcards-form-section>
                </div>
        `;
    }

    _addCardToArea(areaName) {
        // One card per area — if already occupied, guide toward a stack card
        const existing = (this.cardConfigs ?? []).filter(c => c?.view_layout?.['grid-area'] === areaName);
        if (existing.length > 0) {
            // Show a hint rather than silently adding a second card that would clobber
            lcardsLog.info(`[GridEditOverlay] Area "${areaName}" already has ${existing.length} card(s). Use vertical-stack to group multiple cards.`);
            // Still allow it — the user may intentionally want this (e.g. replacing)
            // but log a warning. A future improvement would show a toast/snackbar.
        }
        this.dispatchEvent(new CustomEvent('add-card-to-area', {
            detail: { areaName },
            bubbles: true,
            composed: true,
        }));
    }

    // ──────────────────────────────────────────────────────────────────────
    // Rubber-band area creation
    // ──────────────────────────────────────────────────────────────────────

    _cellPointerDown(e, r, c) {
        if (this._showNameInput || e.button !== 0) return;
        e.stopPropagation();
        // Capture so a release outside the view still ends the drag. Hit-testing
        // uses the measured cell rects (_cellAtPoint), not the event target.
        e.currentTarget.setPointerCapture?.(e.pointerId);
        this._selStart  = { r, c };
        this._selEnd    = { r, c };
        this._selDrag   = true;
        this._selMoved  = false; // becomes true once the pointer enters a different cell
        this._selectedArea = null;
    }

    _selMove(e) {
        if (!this._selDrag || !this._selStart || !this._selEnd) return;
        const hit = this._cellAtPoint(e.clientX, e.clientY);
        if (!hit) return;
        // Only allow extending the selection across currently-unoccupied cells
        if (this.areas[hit.r]?.[hit.c] !== '.') return;
        if (hit.r !== this._selEnd.r || hit.c !== this._selEnd.c) {
            this._selEnd   = hit;
            this._selMoved = this._selMoved || (hit.r !== this._selStart.r || hit.c !== this._selStart.c);
            this._positionSelectionRect();
            for (let row = 0; row < this.rows.length; row++) {
                for (let col = 0; col < this.columns.length; col++) {
                    const el = this._qh(`#ct-${row}-${col}`);
                    if (el) el.classList.toggle('in-sel', this._isCellInSel(row, col));
                }
            }
        }
    }

    _selUp(/** @type {PointerEvent} */ _e) {
        if (!this._selDrag) return;
        this._selDrag = false;
        // A drag across cells or a plain click on one empty cell ("Create area")
        // both open the name popup for the selected cells. A release outside
        // every cell (pointer left the grid without dragging) does nothing.
        const hit = this._cellAtPoint(_e.clientX, _e.clientY);
        if (this._selStart && this._selEnd && (this._selMoved || hit)) {
            this._showNameInput = true;
            this._selectionName = '';
        } else {
            this._selStart = null;
            this._selEnd   = null;
        }
        this.requestUpdate();
    }

    /** Create a single-cell area immediately (from the hover "+" button). */
    _createSingleCellArea(r, c) {
        this._selStart = { r, c };
        this._selEnd   = { r, c };
        this._showNameInput = true;
        this._selectionName = '';
        this.requestUpdate();
    }

    _isCellInSel(r, c) {
        if (!this._selStart || !this._selEnd) return false;
        const { r: r1, c: c1 } = this._selStart;
        const { r: r2, c: c2 } = this._selEnd;
        return r >= Math.min(r1, r2) && r <= Math.max(r1, r2) &&
               c >= Math.min(c1, c2) && c <= Math.max(c1, c2);
    }

    _nameInputKeydown(e) {
        if (e.key === 'Enter')  this._confirmSelection();
        if (e.key === 'Escape') this._cancelSelection();
    }

    _confirmSelection() {
        const name = this._selectionName?.trim();
        // Keep the popup open on a bad name, so the selection isn't lost.
        if (!name) { this._nameError = 'Enter a name'; return; }
        if (!/^[a-zA-Z_-][a-zA-Z0-9_-]*$/.test(name)) {
            this._nameError = 'Use letters, numbers, - and _ (no spaces; not starting with a number)';
            return;
        }
        if (getAreaNames(this.areas).includes(name)) { this._nameError = `"${name}" is already used`; return; }
        if (!this._selStart || !this._selEnd) return;
        const { r: r1, c: c1 } = this._selStart;
        const { r: r2, c: c2 } = this._selEnd;
        const bounds = {
            r1: Math.min(r1, r2), c1: Math.min(c1, c2),
            r2: Math.max(r1, r2) + 1, c2: Math.max(c1, c2) + 1,
        };
        const result = cellsToAreaName(this.areas, bounds, name);
        if (!result.ok) {
            this._nameError = /** @type {any} */ (result).error ?? 'Cannot create the area here';
            return;
        }
        this._selStart      = null;
        this._selEnd        = null;
        this._showNameInput = false;
        this._nameError     = '';
        this._selectedArea  = name;
        this._emitGridState(this.columns, this.rows, result.grid2d);
    }

    _cancelSelection() {
        this._nameError     = '';
        this._selStart      = null;
        this._selEnd        = null;
        this._showNameInput = false;
        this._selectionName = '';
    }

    // ──────────────────────────────────────────────────────────────────────
    // Event emission
    // ──────────────────────────────────────────────────────────────────────

    _emitGridState(columns, rows, areas, gap) {
        this.dispatchEvent(new CustomEvent('grid-state-changed', {
            detail: {
                columns: columns ?? this.columns,
                rows:    rows    ?? this.rows,
                areas:   areas   ?? this.areas,
                gap:     gap     ?? this.gap,
            },
            bubbles: false,
        }));
    }

    _emitAreaCards(cards) {
        this.dispatchEvent(new CustomEvent('area-cards-changed', {
            detail: { cards },
            bubbles: false,
        }));
    }
}

// Loaded on demand by lcards-layout-view.js when edit mode first opens.
if (!customElements.get('lcards-grid-edit-overlay')) {
    customElements.define('lcards-grid-edit-overlay', LCARdSGridEditOverlay);
}
