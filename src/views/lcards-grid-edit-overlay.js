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
    removeTrack,
    insertTrack,
    reorderTrack,
    GRID_EDIT_GUTTER,
} from './layout-grid-utils.js';
import { showConfirmDeleteDialog } from './layout-edit-dialogs.js';
// Side-effect import: registers <lcards-color-picker> (used by the area settings panel).
import '../editor/components/shared/lcards-color-picker.js';

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
    { value: 'visible', label: 'Visible — bleeds beyond cell' },
    { value: 'clip',    label: 'Clip — hard clip, no scroll' },
    { value: 'hidden',  label: 'Hidden — clip + block context' },
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

// ─── Dimension constants ───────────────────────────────────────────────────
// Header bar height/width. Matches GRID_EDIT_GUTTER so the headers sit exactly
// in the gutter the view reserves at the top/left of the grid during editing —
// they never cover the first-row / first-column cells (or their "+" buttons).
const HEADER_OVERLAP = GRID_EDIT_GUTTER;
const HANDLE_SIZE    = 10;   // px — resize/reorder handle thickness
const MIN_TRACK_PX   = 20;   // px — minimum track size during resize

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
        _showSettings:   { state: true }, // layout settings panel open
        _reorderPreview: { state: true }, // { axis, from, to } | null
        _toolbarPos:     { state: true }, // { top, left } | null — moved toolbar position
        _areaSettings:   { state: true }, // area name whose settings panel is open | null
        _areaPanelPos:   { state: true }, // { top, left } | null — dragged area panel position
        _overlayOpacity: { state: true }, // area overlay color-mix % (0–100)
    };

    constructor() {
        super();
        this.columns     = ['1fr', '1fr', '1fr'];
        this.rows        = ['1fr', '1fr', '1fr'];
        this.areas       = Array(3).fill(null).map(() => Array(3).fill('.'));
        this.gap         = '5px';
        this.cardConfigs = [];
        this.layout      = {};

        this._selectedArea = null;
        this._renaming     = null;
        this._trackPopover = null;
        this._showSettings   = false;
        this._selStart       = null;
        this._selEnd         = null;
        this._selectionName  = '';
        this._showNameInput  = false;
        this._reorderPreview = null;
        this._areaSettings   = null;
        this._areaPanelPos   = null;
        this._areaPanelAnchor = null;
        this._areaPanelDrag  = null;
        this._overlayOpacity = 50;

        // Measurement cache: _cells[r][c] = DOMRect relative to overlay
        this._cells = [];
        this._overlayRect = null;
        this._measureScheduled = false;

        // Drag state (non-reactive, mutated in pointermove)
        this._resizeDrag  = null;
        this._reorderDrag = null;
        this._selDrag     = false;
        this._selMoved    = false;
        this._toolbarPos  = null;
        this._toolbarDrag = null;

        // Single unified pointer listener pair bound to the overlay element itself
        // (not document). Shadow DOM events are captured here; the dispatcher routes
        // to the active drag (resize / reorder / selection / toolbar).
        this._boundPointerMove = this._onAnyPointerMove.bind(this);
        this._boundPointerUp   = this._onAnyPointerUp.bind(this);
        this._boundKeydown     = this._onDocKeydown.bind(this);
    }

    // ──────────────────────────────────────────────────────────────────────
    // Styles
    // ──────────────────────────────────────────────────────────────────────

    static styles = css`
        :host {
            display: block;
            position: absolute;
            inset: 0;
            pointer-events: none;
            z-index: 100;
        }

        /* ─── Ghost grid (measurement only) ──────────────────────────────── */
        /* Top/left padding reserves a gutter for the column/row headers so the
           ghost cells line up with the real #grid-root cells (which the view
           pads by the same amount during grid editing). */
        #ghost-grid {
            position: absolute;
            inset: 0;
            display: grid;
            opacity: 0;
            pointer-events: none;
            box-sizing: border-box;
            padding: ${HEADER_OVERLAP}px 0 0 ${HEADER_OVERLAP}px;
        }
        .gc { min-width: 0; min-height: 0; }

        /* ─── Toolbar (floating, draggable) ───────────────────────────────── */
        .toolbar {
            position: absolute;
            top: 12px;
            left: 50%;
            transform: translateX(-50%);
            z-index: 200;
            pointer-events: auto;
            display: flex;
            align-items: center;
            gap: 8px;
            padding: 10px 14px;
            background: color-mix(in oklab, var(--card-background-color, rgba(0,0,0,.6)) 88%, transparent);
            backdrop-filter: blur(12px) saturate(1.1);
            -webkit-backdrop-filter: blur(12px) saturate(1.1);
            border: var(--ha-border-width-sm, 1px) solid color-mix(in oklab, var(--divider-color, rgba(255,255,255,.1)) 60%, transparent);
            border-radius: 22px;
            box-shadow: 0 4px 16px rgba(0,0,0,.35), inset 0 1px 0 rgba(255,255,255,.07);
        }
        .toolbar.dragging { transition: none; cursor: grabbing; }
        .drag-grip {
            display: flex;
            align-items: center;
            cursor: grab;
            color: var(--secondary-text-color);
            --mdc-icon-size: 18px;
            padding: 0 2px;
            opacity: 0.6;
        }
        .drag-grip:hover { opacity: 1; }
        .toolbar-label {
            font-size: 13px;
            font-weight: 700;
            letter-spacing: 0.06em;
            text-transform: uppercase;
            color: var(--primary-text-color);
            padding: 0 2px;
        }
        .t-btn {
            display: flex;
            align-items: center;
            justify-content: center;
            height: 36px;
            min-width: 36px;
            padding: 0 12px;
            gap: 5px;
            border: none;
            border-radius: 11px;
            cursor: pointer;
            font-size: 13px;
            font-weight: 600;
            background: rgba(255,255,255,.08);
            color: var(--primary-text-color);
            transition: background var(--ha-animation-duration-fast,.15s), transform .08s ease;
            pointer-events: auto;
        }
        .t-btn:hover { background: rgba(255,255,255,.14); transform: translateY(-1px); }
        .t-btn ha-icon { --mdc-icon-size: 16px; }
        .t-btn.primary {
            background: var(--lcars-ui-primary, var(--primary-color));
            color: var(--text-primary-color, #fff);
        }
        .t-btn.primary:hover { filter: brightness(1.1); }
        .t-sep {
            width: 1px;
            height: 20px;
            background: var(--divider-color, rgba(255,255,255,.12));
            margin: 0 2px;
        }
        /* Opacity slider — sits in the toolbar next to the Areas/Cells toggle */
        .t-opacity {
            display: flex;
            align-items: center;
            gap: 6px;
            padding: 0 4px;
            color: var(--secondary-text-color);
            --mdc-icon-size: 15px;
        }
        .t-opacity ha-icon { opacity: 0.7; flex-shrink: 0; }
        .t-opacity input[type=range] {
            width: 72px;
            height: 4px;
            cursor: pointer;
            appearance: none;
            -webkit-appearance: none;
            background: linear-gradient(
                to right,
                var(--lcars-ui-primary, var(--primary-color)) 0%,
                var(--lcars-ui-primary, var(--primary-color)) var(--pct, 50%),
                rgba(255,255,255,.18) var(--pct, 50%)
            );
            border-radius: 2px;
            outline: none;
        }
        .t-opacity input[type=range]::-webkit-slider-thumb {
            appearance: none;
            -webkit-appearance: none;
            width: 14px;
            height: 14px;
            border-radius: 50%;
            background: var(--lcars-ui-primary, var(--primary-color));
            border: 2px solid var(--card-background-color, #111);
            box-shadow: 0 1px 4px rgba(0,0,0,.4);
        }
        .t-opacity input[type=range]::-moz-range-thumb {
            width: 14px;
            height: 14px;
            border-radius: 50%;
            background: var(--lcars-ui-primary, var(--primary-color));
            border: 2px solid var(--card-background-color, #111);
        }

        /* ─── Column headers ──────────────────────────────────────────────── */
        .col-header {
            position: absolute;
            height: ${HEADER_OVERLAP}px;
            top: 0;
            display: flex;
            align-items: center;
            justify-content: center;
            pointer-events: auto;
            cursor: grab;
            user-select: none;
            background: color-mix(in oklab, var(--card-background-color, rgba(0,0,0,.5)) 75%, transparent);
            backdrop-filter: blur(8px);
            -webkit-backdrop-filter: blur(8px);
            border: var(--ha-border-width-sm, 1px) solid color-mix(in oklab, var(--divider-color) 50%, transparent);
            border-radius: var(--ha-border-radius-sm, 4px) var(--ha-border-radius-sm, 4px) 0 0;
            box-sizing: border-box;
            overflow: hidden;
            transition: background var(--ha-animation-duration-fast,.15s);
            z-index: 30;
        }
        .col-header:hover { background: color-mix(in oklab, var(--lcars-ui-primary, var(--primary-color)) 20%, var(--card-background-color, rgba(0,0,0,.5))); }
        .col-header.dragging { opacity: 0.5; cursor: grabbing; }
        .col-header.drop-target { background: color-mix(in oklab, var(--lcars-ui-primary, var(--primary-color)) 35%, transparent); }

        /* ─── Row headers ─────────────────────────────────────────────────── */
        .row-header {
            position: absolute;
            width: ${HEADER_OVERLAP}px;
            left: 0;
            display: flex;
            align-items: center;
            justify-content: center;
            pointer-events: auto;
            cursor: grab;
            user-select: none;
            writing-mode: vertical-rl;
            background: color-mix(in oklab, var(--card-background-color, rgba(0,0,0,.5)) 75%, transparent);
            backdrop-filter: blur(8px);
            -webkit-backdrop-filter: blur(8px);
            border: var(--ha-border-width-sm, 1px) solid color-mix(in oklab, var(--divider-color) 50%, transparent);
            border-radius: var(--ha-border-radius-sm, 4px) 0 0 var(--ha-border-radius-sm, 4px);
            box-sizing: border-box;
            overflow: hidden;
            transition: background var(--ha-animation-duration-fast,.15s);
            z-index: 30;
        }
        .row-header:hover { background: color-mix(in oklab, var(--lcars-ui-primary, var(--primary-color)) 20%, var(--card-background-color, rgba(0,0,0,.5))); }
        .row-header.dragging { opacity: 0.5; cursor: grabbing; }
        .row-header.drop-target { background: color-mix(in oklab, var(--lcars-ui-primary, var(--primary-color)) 35%, transparent); }

        /* ─── Track size label ────────────────────────────────────────────── */
        .track-label {
            font-size: 11px;
            font-weight: 600;
            color: var(--primary-text-color);
            text-align: center;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            padding: 0 4px;
            max-width: calc(100% - 36px);
        }
        /* Row headers use vertical writing-mode, so the inline axis is the
           HEIGHT. The default max-width (cross axis = 28px header width) would
           collapse to 0 and hide the label — constrain max-height instead so the
           track size is always visible without having to click the header. */
        .row-header .track-label {
            writing-mode: vertical-rl;
            max-width: none;
            max-height: calc(100% - 24px);
            padding: 4px 0;
        }
        .track-edit-input {
            font-size: 11px;
            width: 72px;
            background: rgba(255,255,255,.12);
            border: var(--ha-border-width-sm,1px) solid var(--primary-color);
            border-radius: 4px;
            color: var(--primary-text-color);
            padding: 2px 4px;
            outline: none;
        }

        /* ─── Delete track button ─────────────────────────────────────────── */
        .del-btn {
            position: absolute;
            right: 2px;
            top: 50%;
            transform: translateY(-50%);
            display: none;
            align-items: center;
            justify-content: center;
            width: 18px;
            height: 18px;
            background: linear-gradient(135deg, rgba(236,72,72,.9), rgba(255,85,85,1));
            border-radius: 4px;
            cursor: pointer;
            pointer-events: auto;
            --mdc-icon-size: 12px;
            color: #fff;
            /* Row headers use vertical-rl writing-mode; reset it here so the icon
               glyph is centered in the button (matches the column header). */
            writing-mode: horizontal-tb;
            line-height: 0;
        }
        .col-header:hover .del-btn,
        .row-header:hover .del-btn { display: flex; }
        .row-header .del-btn { right: auto; bottom: 2px; top: auto; transform: none; }

        /* ─── Add track buttons ───────────────────────────────────────────── */
        .add-btn {
            position: absolute;
            display: flex;
            align-items: center;
            justify-content: center;
            pointer-events: auto;
            cursor: pointer;
            background: color-mix(in oklab, var(--lcars-ui-primary, var(--primary-color)) 20%, transparent);
            border: var(--ha-border-width-sm,1px) dashed var(--lcars-ui-primary, var(--primary-color));
            color: var(--lcars-ui-primary, var(--primary-color));
            border-radius: var(--ha-border-radius-sm,4px);
            font-size: 18px;
            font-weight: 300;
            line-height: 1;
            transition: background var(--ha-animation-duration-fast,.15s);
            z-index: 30;
        }
        .add-btn:hover { background: color-mix(in oklab, var(--lcars-ui-primary, var(--primary-color)) 35%, transparent); }
        .add-col-btn { width: ${HEADER_OVERLAP}px; height: ${HEADER_OVERLAP}px; top: 0; }
        .add-row-btn { width: ${HEADER_OVERLAP}px; height: ${HEADER_OVERLAP}px; left: 0; }

        /* ─── Resize handles ──────────────────────────────────────────────── */
        .resize-handle {
            position: absolute;
            pointer-events: auto;
            z-index: 40;
            transition: background var(--ha-animation-duration-fast,.15s), opacity var(--ha-animation-duration-fast,.15s);
        }
        .rh-col {
            cursor: col-resize;
            width: ${HANDLE_SIZE}px;
            top: ${HEADER_OVERLAP}px;
        }
        .rh-row {
            cursor: row-resize;
            height: ${HANDLE_SIZE}px;
            left: ${HEADER_OVERLAP}px;
        }
        .resize-handle::after {
            content: '';
            position: absolute;
            background: var(--lcars-ui-primary, var(--primary-color));
            border-radius: 2px;
            opacity: 0;
            transition: opacity .15s;
        }
        .rh-col::after  { top: 20%; bottom: 20%; left: 50%; width: 3px; transform: translateX(-50%); }
        .rh-row::after  { left: 20%; right: 20%; top: 50%; height: 3px; transform: translateY(-50%); }
        .resize-handle:hover::after { opacity: 1; }
        .resize-handle.active::after { opacity: 1; background: var(--lcars-ui-primary, var(--primary-color)); }
        .resize-handle.disabled { cursor: not-allowed; }
        .resize-handle { display: flex; align-items: center; justify-content: center; }
        .insert-btn {
            opacity: 0;
            width: 22px;
            height: 22px;
            flex-shrink: 0;
            border-radius: var(--ha-border-radius-circle, 50%);
            border: var(--ha-border-width-sm,1px) solid var(--lcars-ui-primary, var(--primary-color));
            background: color-mix(in oklab, var(--card-background-color, rgba(0,0,0,.8)) 80%, transparent);
            color: var(--lcars-ui-primary, var(--primary-color));
            font-size: 15px;
            line-height: 1;
            cursor: pointer;
            pointer-events: auto;
            transition: opacity .12s, background .12s, transform .08s;
            z-index: 45;
        }
        .resize-handle:hover .insert-btn { opacity: 1; }
        .insert-btn:hover { background: var(--lcars-ui-primary, var(--primary-color)); color: var(--text-primary-color, #fff); transform: scale(1.1); }

        /* ─── Area overlays ───────────────────────────────────────────────── */
        .area-overlay {
            position: absolute;
            pointer-events: auto;
            box-sizing: border-box;
            border-radius: var(--ha-border-radius-sm, 4px);
            cursor: pointer;
            transition: filter var(--ha-animation-duration-fast,.15s), outline var(--ha-animation-duration-fast,.15s);
            z-index: 20;
            /* overflow: visible (default) — border-radius still clips the background-color,
               but the action bar (a DOM child positioned above/below) remains interactive.
               overflow:hidden would clip the bar's hit area, breaking hover-to-click. */
        }
        .area-overlay:hover { filter: brightness(1.15); }
        .area-overlay.selected {
            outline: 3px solid var(--lcars-ui-primary, var(--primary-color));
            outline-offset: -2px;
            /* Raise above col/row headers (z-index 30) so rename input and
               toolbar are never clipped under a header when the area abuts an edge. */
            z-index: 35;
        }

        /* Label centered in cell body — never reaches the top-right toolbar corner. */
        .area-label {
            position: absolute;
            top: 50%;
            left: 8px;
            right: 8px;
            transform: translateY(-50%);
            font-size: 14px;
            font-weight: 700;
            letter-spacing: 0.04em;
            text-shadow: 0 1px 3px rgba(0,0,0,.6);
            color: white;
            pointer-events: none;
            text-align: center;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }
        /* ─── Area action bar ────────────────────────────────────────────────
           Floats above each area on hover (below when near the top edge).
           Child of the area overlay so CSS :hover drives visibility;
           overflow:visible on :hover lets it escape the cell boundary. */
        .area-action-bar {
            position: absolute;
            bottom: calc(100% + 5px);  /* above the cell */
            right: 0;
            display: flex;
            align-items: center;
            gap: 2px;
            background: color-mix(in oklab, var(--card-background-color, #1c1c28) 85%, rgba(0,0,0,.3));
            backdrop-filter: blur(10px);
            -webkit-backdrop-filter: blur(10px);
            border: var(--ha-border-width-sm,1px) solid rgba(255,255,255,.14);
            border-radius: var(--ha-border-radius-md, 8px);
            padding: 4px;
            box-shadow: var(--ha-box-shadow-m, 0 4px 16px rgba(0,0,0,.5));
            opacity: 0;
            pointer-events: none;
            transition: opacity var(--ha-animation-duration-fast,.15s) ease;
            white-space: nowrap;
            z-index: 50;
        }
        /* Flip to below the cell when near the top edge (class set imperatively) */
        .area-overlay.bar-below .area-action-bar {
            bottom: auto;
            top: calc(100% + 5px);
        }
        /* Bar shows on click (selected) or while renaming — not on hover */
        .area-overlay.selected .area-action-bar,
        .area-overlay.renaming .area-action-bar {
            opacity: 1;
            pointer-events: auto;
        }
        /* Faint edit hint in top-right corner — signals the cell is clickable */
        .area-overlay:not(.selected):not(.renaming)::after {
            content: '';
            position: absolute;
            top: 5px; right: 5px;
            width: 20px; height: 20px;
            opacity: 0.45;
            background: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='white'%3E%3Cpath d='M20.71,7.04C21.1,6.65 21.1,6 20.71,5.63L18.37,3.29C18,2.9 17.35,2.9 16.96,3.29L15.12,5.12L18.87,8.87M3,17.25V21H6.75L17.81,9.93L14.06,6.18L3,17.25Z'/%3E%3C/svg%3E") no-repeat center/contain;
            pointer-events: none;
        }

        /* Individual action buttons in the bar */
        .aab-btn {
            display: flex;
            align-items: center;
            justify-content: center;
            width: 34px;
            height: 34px;
            border: none;
            background: transparent;
            color: rgba(255,255,255,.82);
            cursor: pointer;
            border-radius: var(--ha-border-radius-sm, 4px);
            padding: 0;
            flex-shrink: 0;
            transition: background var(--ha-animation-duration-fast,.15s), color var(--ha-animation-duration-fast,.15s);
        }
        .aab-btn:hover { background: rgba(255,255,255,.12); color: white; }
        .aab-btn.danger:hover { background: color-mix(in oklab, var(--error-color, #ef4444) 18%, transparent); color: var(--error-color, #ef4444); }
        .aab-btn svg { pointer-events: none; }
        /* Thin separator between button groups */
        .aab-sep {
            width: var(--ha-border-width-sm, 1px);
            height: 20px;
            background: rgba(255,255,255,.15);
            flex-shrink: 0;
            margin: 0 2px;
        }

        /* Rename input inside the bar (replaces buttons in-place) */
        .aab-rename-input {
            flex: 1;
            min-width: 120px;
            max-width: 200px;
            font-size: 13px;
            font-weight: 600;
            padding: 5px var(--ha-space-2, 8px);
            border: var(--ha-border-width-sm,1px) solid var(--primary-color);
            border-radius: var(--ha-border-radius-sm, 4px);
            background: rgba(255,255,255,.1);
            color: white;
            outline: none;
        }
        .aab-rename-input::placeholder { color: rgba(255,255,255,.4); }
        .aab-rename-confirm { color: var(--success-color, #4ade80) !important; }
        .aab-rename-confirm:hover { background: color-mix(in oklab, var(--success-color, #4ade80) 18%, transparent) !important; }

        /* ─── Cell selection targets (unoccupied cells for rubber-band) ───── */
        .cell-target {
            position: absolute;
            pointer-events: auto;
            cursor: crosshair;
            box-sizing: border-box;
            display: flex;
            align-items: center;
            justify-content: center;
            border: var(--ha-border-width-sm,1px) dashed rgba(255,255,255,.1);
            border-radius: var(--ha-border-radius-sm,4px);
            transition: background .1s;
            touch-action: none;
        }
        .cell-target:hover { background: rgba(255,255,255,.06); }
        .cell-target.in-sel { background: color-mix(in oklab, var(--primary-color) 20%, transparent); border-color: rgba(255,255,255,.25); }
        .cell-add-btn {
            opacity: 0;
            width: 28px;
            height: 28px;
            border-radius: var(--ha-border-radius-circle, 50%);
            border: var(--ha-border-width-sm,1px) solid var(--lcars-ui-primary, var(--primary-color));
            background: color-mix(in oklab, var(--lcars-ui-primary, var(--primary-color)) 25%, transparent);
            color: var(--lcars-ui-primary, var(--primary-color));
            font-size: 18px;
            line-height: 1;
            cursor: pointer;
            pointer-events: auto;
            transition: opacity .12s, background .12s;
        }
        .cell-target:hover .cell-add-btn { opacity: 1; }
        .cell-add-btn:hover { background: color-mix(in oklab, var(--lcars-ui-primary, var(--primary-color)) 45%, transparent); }

        /* ─── Rubber-band selection rect ──────────────────────────────────── */
        .sel-rect {
            position: absolute;
            pointer-events: none;
            z-index: 60;
            border: 2px dashed color-mix(in oklab, var(--primary-color) 80%, rgba(147,197,253,.8));
            border-radius: var(--ha-border-radius-sm,4px);
            background: color-mix(in oklab, var(--primary-color) 15%, transparent);
            box-shadow:
                inset 0 0 0 1px rgba(224,242,254,.35),
                inset 0 0 20px color-mix(in oklab, var(--primary-color) 8%, transparent);
        }

        /* ─── Name input popup ────────────────────────────────────────────── */
        .name-popup {
            position: absolute;
            z-index: 70;
            pointer-events: auto;
            background: color-mix(in oklab, var(--card-background-color, rgba(0,0,0,.7)) 90%, transparent);
            backdrop-filter: blur(12px);
            -webkit-backdrop-filter: blur(12px);
            border: var(--ha-border-width-sm,1px) solid var(--divider-color);
            border-radius: var(--ha-border-radius-md, 8px);
            padding: 10px 14px;
            min-width: 200px;
            box-shadow: 0 4px 20px rgba(0,0,0,.4);
            display: flex;
            flex-direction: column;
            gap: 8px;
        }
        .name-popup-title {
            font-size: 11px;
            font-weight: 600;
            letter-spacing: 0.06em;
            text-transform: uppercase;
            color: var(--secondary-text-color);
        }
        .name-popup ha-input { width: 100%; }
        .name-popup-actions { display: flex; gap: 6px; justify-content: flex-end; }

        /* ─── Settings panel ─────────────────────────────────────────────── */
        /* top/left are set imperatively in _positionSettingsPanel() so the panel
           tracks the floating toolbar wherever it is dragged. */
        .settings-panel {
            position: absolute;
            top: 0;
            left: 0;
            z-index: 210;
            pointer-events: auto;
            background: color-mix(in oklab, var(--card-background-color, rgba(0,0,0,.85)) 92%, transparent);
            backdrop-filter: blur(12px);
            -webkit-backdrop-filter: blur(12px);
            border: var(--ha-border-width-sm,1px) solid var(--divider-color);
            border-radius: var(--ha-border-radius-md, 8px);
            padding: 10px 14px;
            min-width: 240px;
            box-shadow: 0 4px 20px rgba(0,0,0,.4);
        }
        .settings-title {
            font-size: 11px;
            font-weight: 600;
            letter-spacing: 0.06em;
            text-transform: uppercase;
            color: var(--secondary-text-color);
            margin-bottom: 8px;
        }
        .settings-panel ha-input {
            display: block;
            width: 100%;
            margin-bottom: 8px;
        }
        .settings-hint {
            font-size: 11px;
            color: var(--secondary-text-color);
            margin-bottom: 8px;
            font-style: italic;
            opacity: 0.85;
        }
        .settings-actions {
            display: flex;
            justify-content: flex-end;
            margin-top: 8px;
            padding-top: 8px;
            border-top: var(--ha-border-width-sm,1px) solid var(--divider-color);
        }

        /* ─── Track size popover ──────────────────────────────────────────── */
        .track-popover {
            position: absolute;
            z-index: 220;
            pointer-events: auto;
            background: color-mix(in oklab, var(--card-background-color, rgba(0,0,0,.9)) 93%, transparent);
            backdrop-filter: blur(12px);
            -webkit-backdrop-filter: blur(12px);
            border: var(--ha-border-width-sm,1px) solid var(--divider-color);
            border-radius: var(--ha-border-radius-md, 8px);
            padding: 10px 12px;
            box-shadow: 0 4px 20px rgba(0,0,0,.5);
            min-width: 200px;
        }
        .tp-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 8px;
        }
        .tp-title {
            font-size: 10px;
            font-weight: 600;
            letter-spacing: 0.07em;
            text-transform: uppercase;
            color: var(--secondary-text-color);
        }
        .tp-close {
            flex-shrink: 0;
            width: 24px;
            height: 24px;
            display: flex;
            align-items: center;
            justify-content: center;
            border: none;
            background: transparent;
            color: var(--secondary-text-color);
            cursor: pointer;
            border-radius: var(--ha-border-radius-sm, 4px);
            padding: 0;
            font-size: 16px;
            line-height: 1;
            margin: -2px -4px -2px 4px;
        }
        .tp-close:hover { background: rgba(255,255,255,.1); color: var(--primary-text-color); }
        .tp-presets {
            display: flex;
            flex-wrap: wrap;
            gap: 4px;
            margin-bottom: 8px;
        }
        .tp-preset {
            padding: 3px 8px;
            border-radius: 6px;
            font-size: 11px;
            font-weight: 500;
            cursor: pointer;
            background: rgba(255,255,255,.08);
            color: var(--primary-text-color);
            border: var(--ha-border-width-sm,1px) solid rgba(255,255,255,.1);
            transition: background .1s;
        }
        .tp-preset:hover { background: rgba(255,255,255,.18); }
        .tp-custom {
            border-top: var(--ha-border-width-sm,1px) solid var(--divider-color);
            padding-top: 8px;
        }
        .tp-custom ha-input { display: block; width: 100%; }

        /* ─── Per-area settings panel ─────────────────────────────────────── */
        .area-panel {
            position: absolute;
            z-index: 230;
            pointer-events: auto;
            width: 360px;
            max-width: calc(100vw - 24px);
            max-height: calc(100% - 24px);
            overflow-y: auto;
            background: color-mix(in oklab, var(--card-background-color, rgba(0,0,0,.9)) 95%, transparent);
            backdrop-filter: blur(12px);
            -webkit-backdrop-filter: blur(12px);
            border: var(--ha-border-width-sm,1px) solid var(--divider-color);
            border-radius: var(--ha-border-radius-md, 8px);
            box-shadow: 0 4px 24px rgba(0,0,0,.5);
        }
        .area-panel.dragging { cursor: grabbing; }
        .ap-header {
            position: sticky;
            top: 0;
            display: flex;
            align-items: center;
            gap: 6px;
            padding: 10px 8px 10px 12px;
            background: var(--card-background-color, #1c1c1c);
            border-bottom: var(--ha-border-width-sm,1px) solid var(--divider-color);
            z-index: 1;
        }
        .ap-header .drag-grip {
            display: flex;
            align-items: center;
            cursor: grab;
            color: var(--secondary-text-color);
            --mdc-icon-size: 18px;
            opacity: 0.6;
            touch-action: none;
        }
        .ap-header .drag-grip:hover { opacity: 1; }
        .ap-title {
            flex: 1;
            font-size: 11px;
            font-weight: 600;
            letter-spacing: 0.06em;
            text-transform: uppercase;
            color: var(--secondary-text-color);
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }
        .ap-close {
            flex-shrink: 0;
            width: 28px;
            height: 28px;
            display: flex;
            align-items: center;
            justify-content: center;
            border: none;
            background: transparent;
            color: var(--secondary-text-color);
            cursor: pointer;
            border-radius: var(--ha-border-radius-sm, 4px);
            padding: 0;
            font-size: 18px;
            line-height: 1;
        }
        .ap-close:hover { background: rgba(255,255,255,.1); color: var(--primary-text-color); }
        .ap-body { padding: 10px 12px 12px; }
        .ap-group {
            display: flex;
            align-items: center;
            gap: 8px;
            font-size: 13px;
            font-weight: 700;
            letter-spacing: 0.08em;
            text-transform: uppercase;
            color: var(--lcars-ui-primary, var(--primary-color));
            margin: 2px 0 10px;
        }
        /* Trailing rule line after each group title — same hue as the title text. */
        .ap-group::after {
            content: '';
            flex: 1;
            height: var(--ha-border-width-md,2px);
            background: var(--lcars-ui-primary, var(--primary-color));
            opacity: 0.7;
        }
        /* Separator above every group except the first. */
        .ap-group:not(:first-child) {
            margin-top: 18px;
            padding-top: 16px;
            border-top: var(--ha-border-width-sm,1px) solid color-mix(in oklab, var(--lcars-ui-primary, var(--primary-color)) 60%, transparent);
        }
        /* Each setting is its own row with a faint accent rule, so complex
           controls (e.g. the color picker's buttons + input) read as one unit. */
        .ap-field {
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 12px 0;
            border-bottom: var(--ha-border-width-sm,1px) solid color-mix(in oklab, var(--lcars-ui-primary, var(--primary-color)) 22%, transparent);
        }
        .ap-field:last-child { border-bottom: none; padding-bottom: 2px; }
        .ap-field:has(+ .ap-group) { border-bottom: none; }
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
            z-index: 250;
            pointer-events: none;
            padding: 4px 9px;
            border-radius: var(--ha-border-radius-pill, 9999px);
            font-size: 12px;
            font-weight: 700;
            letter-spacing: 0.03em;
            background: var(--lcars-ui-primary, var(--primary-color));
            color: var(--text-primary-color, #fff);
            box-shadow: 0 2px 8px rgba(0,0,0,.4);
            white-space: nowrap;
        }

        /* ─── Reorder drop-line indicator ─────────────────────────────────── */
        .drop-line {
            position: absolute;
            background: var(--lcars-ui-primary, var(--primary-color));
            border-radius: 2px;
            pointer-events: none;
            z-index: 50;
            box-shadow: 0 0 6px var(--lcars-ui-primary, var(--primary-color));
        }
    `;

    // ──────────────────────────────────────────────────────────────────────
    // Lifecycle
    // ──────────────────────────────────────────────────────────────────────

    connectedCallback() {
        super.connectedCallback();
        // Use the overlay element as the listener target for drag events.
        // This avoids shadow DOM boundary issues that affect document-level listeners.
        this.addEventListener('pointermove', this._boundPointerMove);
        this.addEventListener('pointerup',   this._boundPointerUp);
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
        this.removeEventListener('pointermove', this._boundPointerMove);
        this.removeEventListener('pointerup',   this._boundPointerUp);
        document.removeEventListener('keydown', this._boundKeydown, true);
        this._resizeObserver?.disconnect();
        this._resizeObserver = null;
    }

    _onDocKeydown(e) {
        if (e.key !== 'Escape') return;
        if (this._renaming) {
            e.stopImmediatePropagation();
            e.preventDefault();
            this._renaming = null;
        } else if (this._trackPopover) {
            e.stopImmediatePropagation();
            e.preventDefault();
            this._trackPopover = null;
        }
    }

    // Unified pointer move/up dispatcher — routes to the active drag handler
    _onAnyPointerMove(e) {
        if (this._resizeDrag)    this._resizeMove(e);
        if (this._reorderDrag)   this._reorderMove(e);
        if (this._selDrag)       this._selMove(e);
        if (this._toolbarDrag)   this._toolbarDragMove(e);
        if (this._areaPanelDrag) this._areaPanelDragMove(e);
    }
    _onAnyPointerUp(e) {
        if (this._resizeDrag)    this._resizeUp(e);
        if (this._reorderDrag)   this._reorderUp(e);
        if (this._selDrag)       this._selUp(e);
        if (this._toolbarDrag)   this._toolbarDragEnd(e);
        if (this._areaPanelDrag) this._areaPanelDragEnd(e);
    }

    _toolbarDragStart(e) {
        e.stopPropagation();
        const toolbar = this.renderRoot?.querySelector('#toolbar');
        const rect = toolbar?.getBoundingClientRect();
        const oRect = this.getBoundingClientRect();
        this._toolbarDrag = {
            offsetX: e.clientX - (rect?.left ?? 0),
            offsetY: e.clientY - (rect?.top ?? 0),
            oLeft: oRect.left,
            oTop: oRect.top,
        };
        toolbar?.classList.add('dragging');
    }
    _toolbarDragMove(e) {
        if (!this._toolbarDrag) return;
        const { offsetX, offsetY, oLeft, oTop } = this._toolbarDrag;
        this._toolbarPos = {
            left: e.clientX - oLeft - offsetX,
            top:  e.clientY - oTop  - offsetY,
        };
    }
    _toolbarDragEnd() {
        this._toolbarDrag = null;
        this.renderRoot?.querySelector('#toolbar')?.classList.remove('dragging');
    }

    /** Hit-test which cell (r,c) the pointer is over, using measured cell rects. */
    _cellAtPoint(clientX, clientY) {
        const oLeft = this._overlayRect?.left ?? 0;
        const oTop  = this._overlayRect?.top  ?? 0;
        const x = clientX - oLeft;
        const y = clientY - oTop;
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
        this._scheduleMeasure();
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

    _measure() {
        const ghost = this.renderRoot?.querySelector('#ghost-grid');
        if (!ghost) return;

        const overlayRect = this.getBoundingClientRect();
        this._overlayRect = overlayRect;

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
                        left:   rect.left   - overlayRect.left,
                        top:    rect.top    - overlayRect.top,
                        right:  rect.right  - overlayRect.left,
                        bottom: rect.bottom - overlayRect.top,
                        width:  rect.width,
                        height: rect.height,
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
        this._positionAddButtons();
        this._positionSettingsPanel();
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
            ${this._trackPopover ? this._renderTrackPopover() : nothing}
            ${this._areaSettings ? this._renderAreaSettingsPanel() : nothing}
            ${this._renderToolbar()}
            <div class="drag-chip" id="drag-chip"></div>
        `;
    }

    _renderGhostGrid() {
        // Prefer resolved pixel track sizes from the real grid when provided, so the
        // (content-less) ghost matches content-sized tracks like `auto`/min-content.
        // Falls back to the declared tracks when no measurement is supplied.
        const measureCols = this.measureColumns?.length ? this.measureColumns : this.columns;
        const measureRows = this.measureRows?.length ? this.measureRows : this.rows;
        const style = [
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
        return html`
            <div class="toolbar" id="toolbar" style=${this._toolbarPos ? `top:${this._toolbarPos.top}px; left:${this._toolbarPos.left}px; transform:none;` : ''}>
                <div class="drag-grip" @pointerdown=${this._toolbarDragStart} title="Drag to move">
                    <ha-icon icon="mdi:drag"></ha-icon>
                </div>
                <span class="toolbar-label">Layout Mode</span>
                <div class="t-sep"></div>
                <button class="t-btn" title="Add column" @click=${() => this._addTrack('col')}>
                    <ha-icon icon="mdi:table-column-plus-after"></ha-icon>
                    <span>+ Col</span>
                </button>
                <button class="t-btn" title="Add row" @click=${() => this._addTrack('row')}>
                    <ha-icon icon="mdi:table-row-plus-after"></ha-icon>
                    <span>+ Row</span>
                </button>
                <div class="t-sep"></div>
                <div class="t-opacity" title="Area overlay opacity">
                    <ha-icon icon="mdi:opacity"></ha-icon>
                    <input type="range" min="0" max="100" step="5"
                        .value=${String(this._overlayOpacity)}
                        style="--pct:${this._overlayOpacity}%"
                        @input=${(e) => {
                            this._overlayOpacity = Number(e.target.value);
                            e.target.style.setProperty('--pct', `${this._overlayOpacity}%`);
                        }}
                    >
                </div>
                ${this.hideSettings ? nothing : html`
                    <div class="t-sep"></div>
                    <button
                        class="t-btn ${this._showSettings ? 'primary' : ''}"
                        title="Layout settings (gap, margins)"
                        @click=${() => { this._showSettings = !this._showSettings; }}
                    >
                        <ha-icon icon="mdi:tune-variant"></ha-icon>
                    </button>
                `}
                ${this.hideCardMode ? nothing : html`
                    <div class="t-sep"></div>
                    <button
                        class="t-btn primary"
                        title="Switch to card editing mode"
                        @click=${() => this.dispatchEvent(new CustomEvent('switch-to-cards-mode', { bubbles: false }))}
                    >
                        <ha-icon icon="mdi:card-multiple-outline"></ha-icon>
                        <span>Switch to Edit Cards</span>
                    </button>
                `}
            </div>
            ${this._showSettings ? this._renderSettingsPanel() : nothing}
        `;
    }

    _renderSettingsPanel() {
        const layout = this.layout ?? {};
        return html`
            <div class="settings-panel">
                <div class="settings-title">Grid Settings</div>
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
                <div class="settings-actions">
                    <ha-button @click=${() => { this._showSettings = false; }}>Done</ha-button>
                </div>
            </div>
        `;
    }

    _renderTrackPopover() {
        const { axis, index } = this._trackPopover;
        const current = axis === 'col' ? this.columns[index] : this.rows[index];
        const label = axis === 'col' ? `Column ${index + 1}` : `Row ${index + 1}`;
        const presets = axis === 'col'
            ? ['1fr', '2fr', '3fr', 'auto', '100px', '200px', '300px', '50%', 'clamp(100px,12vw,200px)']
            : ['1fr', '2fr', 'auto', '60px', '80px', '120px', '50%', 'clamp(40px,8vh,100px)'];

        const closePopover = (e) => { e.stopPropagation(); this._trackPopover = null; };
        return html`
            <div class="track-popover" id="track-popover"
                @click=${(e) => e.stopPropagation()}
                @keydown=${(e) => { if (e.key === 'Escape') { closePopover(e); } else { e.stopPropagation(); } }}>
                <div class="tp-header">
                    <span class="tp-title">${label} size</span>
                    <button class="tp-close" title="Close" @click=${closePopover}>×</button>
                </div>
                <div class="tp-presets">
                    ${presets.map(p => html`
                        <button
                            class="tp-preset"
                            @click=${() => { this._commitTrack(axis, index, p); this._trackPopover = null; }}
                        >${p}</button>
                    `)}
                </div>
                <div class="tp-custom">
                    <ha-input
                        label="Custom size"
                        .value=${current}
                        placeholder="e.g. 1fr, 200px, 25%"
                        @keydown=${(e) => {
                            e.stopPropagation();
                            if (e.key === 'Enter')  { this._commitTrack(axis, index, e.target.value); this._trackPopover = null; }
                            if (e.key === 'Escape') { this._trackPopover = null; }
                        }}
                    ></ha-input>
                </div>
            </div>
        `;
    }

    _openTrackPopover(axis, index, e) {
        this._trackPopover = { axis, index };
        this.updateComplete.then(() => {
            const popover = this.renderRoot?.querySelector('#track-popover');
            if (!popover) return;
            const headerId = axis === 'col' ? `ch-${index}` : `rh-${index}`;
            const header   = this.renderRoot?.querySelector(`#${headerId}`);
            if (!header) return;
            const hRect  = header.getBoundingClientRect();
            const oRect  = this.getBoundingClientRect();
            const popH   = /** @type {HTMLElement} */ (popover).offsetHeight;
            const popW   = 210;
            // Horizontal: align to header left, clamp to overlay width
            const rawLeft    = hRect.left - oRect.left;
            const clampedLeft = Math.max(0, Math.min(rawLeft, oRect.width - popW - 4));
            // Vertical: prefer below the header; flip above if it would overflow the overlay bottom
            const belowTop = hRect.bottom - oRect.top + 4;
            const aboveTop = hRect.top - oRect.top - popH - 4;
            const top = (belowTop + popH > oRect.height && aboveTop >= 0) ? aboveTop : belowTop;
            popover.style.left   = `${clampedLeft}px`;
            popover.style.top    = `${Math.max(0, top)}px`;
            popover.style.bottom = 'auto';
            popover.querySelector('ha-input')?.focus?.();
        });
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
        return this.columns.map((size, i) => {
            const isEditing = this._editingTrack?.axis === 'col' && this._editingTrack?.index === i;
            const isDragging = this._reorderDrag?.axis === 'col' && this._reorderDrag?.fromIndex === i;
            const isTarget   = this._reorderPreview?.axis === 'col' && this._reorderPreview?.to === i;
            return html`
                <div
                    class="col-header ${isDragging ? 'dragging' : ''} ${isTarget ? 'drop-target' : ''}"
                    id="ch-${i}"
                    @pointerdown=${(e) => this._headerPointerDown(e, 'col', i)}
                    @click=${(e) => { e.stopPropagation(); if (this._consumeReorderClick()) return; this._openTrackPopover('col', i, e); }}
                >
                    ${isEditing
                        ? html`<input
                            class="track-edit-input"
                            .value=${size}
                            @keydown=${(e) => this._trackInputKeydown(e, 'col', i)}
                            @blur=${(e) => this._commitTrack('col', i, e.target.value)}
                            @click=${(e) => e.stopPropagation()}
                          />`
                        : html`<span class="track-label">${size}</span>`
                    }
                    <div
                        class="del-btn"
                        @click=${(e) => { e.stopPropagation(); this._deleteTrack('col', i); }}
                        title="Delete column"
                    >
                        <ha-icon icon="mdi:close"></ha-icon>
                    </div>
                </div>
            `;
        });
    }

    _renderRowHeaders() {
        return this.rows.map((size, i) => {
            const isEditing  = this._editingTrack?.axis === 'row' && this._editingTrack?.index === i;
            const isDragging = this._reorderDrag?.axis === 'row' && this._reorderDrag?.fromIndex === i;
            const isTarget   = this._reorderPreview?.axis === 'row' && this._reorderPreview?.to === i;
            return html`
                <div
                    class="row-header ${isDragging ? 'dragging' : ''} ${isTarget ? 'drop-target' : ''}"
                    id="rh-${i}"
                    @pointerdown=${(e) => this._headerPointerDown(e, 'row', i)}
                    @click=${(e) => { e.stopPropagation(); if (this._consumeReorderClick()) return; this._openTrackPopover('row', i, e); }}
                >
                    ${isEditing
                        ? html`<input
                            class="track-edit-input"
                            .value=${size}
                            @keydown=${(e) => this._trackInputKeydown(e, 'row', i)}
                            @blur=${(e) => this._commitTrack('row', i, e.target.value)}
                            @click=${(e) => e.stopPropagation()}
                          />`
                        : html`<span class="track-label">${size}</span>`
                    }
                    <div
                        class="del-btn"
                        @click=${(e) => { e.stopPropagation(); this._deleteTrack('row', i); }}
                        title="Delete row"
                    >
                        <ha-icon icon="mdi:close"></ha-icon>
                    </div>
                </div>
            `;
        });
    }

    _renderResizeHandles() {
        const colHandles = this.columns.slice(0, -1).map((t, i) => {
            const resizable = isResizableTrack(parseTrackValue(this.columns[i])) &&
                              isResizableTrack(parseTrackValue(this.columns[i + 1]));
            return html`
                <div
                    class="resize-handle rh-col ${resizable ? '' : 'disabled'}"
                    id="rhc-${i}"
                    @pointerdown=${resizable ? (e) => this._resizePointerDown(e, 'col', i) : nothing}
                    title="${resizable ? 'Drag to resize' : 'Non-resizable track (clamp/minmax)'}"
                >
                    <button class="insert-btn" title="Insert column here"
                        @pointerdown=${(e) => e.stopPropagation()}
                        @click=${(e) => { e.stopPropagation(); this._insertTrackAt('col', i + 1); }}
                    >+</button>
                </div>
            `;
        });
        const rowHandles = this.rows.slice(0, -1).map((t, i) => {
            const resizable = isResizableTrack(parseTrackValue(this.rows[i])) &&
                              isResizableTrack(parseTrackValue(this.rows[i + 1]));
            return html`
                <div
                    class="resize-handle rh-row ${resizable ? '' : 'disabled'}"
                    id="rhr-${i}"
                    @pointerdown=${resizable ? (e) => this._resizePointerDown(e, 'row', i) : nothing}
                    title="${resizable ? 'Drag to resize' : 'Non-resizable track'}"
                >
                    <button class="insert-btn" title="Insert row here"
                        @pointerdown=${(e) => e.stopPropagation()}
                        @click=${(e) => { e.stopPropagation(); this._insertTrackAt('row', i + 1); }}
                    >+</button>
                </div>
            `;
        });
        return [...colHandles, ...rowHandles];
    }

    _insertTrackAt(axis, index) {
        const { grid2d, columns, rows } = insertTrack(
            this.areas, this.columns, this.rows, axis, index, '1fr',
        );
        this._emitGridState(columns, rows, grid2d);
    }

    _renderAreaOverlays() {
        const areaNames = getAreaNames(this.areas);

        // Inline SVG helper — no WA shadow-DOM sizing; exact pixel control
        const ico = (d, sz = 18) => html`<svg viewBox="0 0 24 24" width="${sz}" height="${sz}" fill="currentColor" aria-hidden="true"><path d="${d}"/></svg>`;
        const ICO_PENCIL = 'M20.71,7.04C21.1,6.65 21.1,6 20.71,5.63L18.37,3.29C18,2.9 17.35,2.9 16.96,3.29L15.12,5.12L18.87,8.87M3,17.25V21H6.75L17.81,9.93L14.06,6.18L3,17.25Z';
        const ICO_PLUS   = 'M19,13H13V19H11V13H5V11H11V5H13V11H19V13Z';
        const ICO_TUNE   = 'M8 13C6.14 13 4.59 14.28 4.14 16H2V18H4.14C4.59 19.72 6.14 21 8 21S11.41 19.72 11.86 18H22V16H11.86C11.41 14.28 9.86 13 8 13M8 19C6.9 19 6 18.1 6 17C6 15.9 6.9 15 8 15S10 15.9 10 17C10 18.1 9.1 19 8 19M19.86 6C19.41 4.28 17.86 3 16 3S12.59 4.28 12.14 6H2V8H12.14C12.59 9.72 14.14 11 16 11S19.41 9.72 19.86 8H22V6H19.86M16 9C14.9 9 14 8.1 14 7C14 5.9 14.9 5 16 5S18 5.9 18 7C18 8.1 17.1 9 16 9Z';
        const ICO_DELETE = 'M6,19A2,2 0 0,0 8,21H16A2,2 0 0,0 18,19V7H6V19M8,9H16V19H8V9M15.5,4L14.5,3H9.5L8.5,4H5V6H19V4H15.5Z';
        const ICO_CHECK  = 'M21,7L9,19L3.5,13.5L4.91,12.09L9,16.17L19.59,5.59L21,7Z';
        const ICO_CLOSE  = 'M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z';

        return areaNames.map(name => {
            const isSelected = this._selectedArea === name;
            const isRenaming = this._renaming === name;
            const { bg } = areaColor(name);

            const barContent = isRenaming
                ? html`
                    <input class="aab-rename-input"
                        .value=${name}
                        placeholder="area-name"
                        @keydown=${(/** @type {KeyboardEvent} */ e) => {
                            e.stopPropagation();
                            if (e.key === 'Enter')  { this._commitRenameFromBar(name, /** @type {HTMLInputElement} */ (e.target).value); }
                            if (e.key === 'Escape') { this._renaming = null; }
                        }}
                        @blur=${(/** @type {FocusEvent} */ e) => {
                            if (this._renaming === name) this._commitRenameFromBar(name, /** @type {HTMLInputElement} */ (e.target).value);
                        }}
                    >
                    <button class="aab-btn aab-rename-confirm" title="Confirm rename"
                        @click=${(/** @type {MouseEvent} */ e) => {
                            e.stopPropagation();
                            const input = /** @type {HTMLInputElement|null} */ (e.currentTarget.previousElementSibling);
                            if (input) this._commitRenameFromBar(name, input.value);
                        }}>${ico(ICO_CHECK, 16)}</button>
                    <button class="aab-btn" title="Cancel rename"
                        @click=${(/** @type {MouseEvent} */ e) => { e.stopPropagation(); this._renaming = null; }}
                    >${ico(ICO_CLOSE, 16)}</button>
                  `
                : html`
                    <button class="aab-btn" title="Rename area"
                        @click=${(/** @type {MouseEvent} */ e) => { e.stopPropagation(); this._startBarRename(name); }}
                    >${ico(ICO_PENCIL)}</button>
                    <button class="aab-btn" title="Add card to area"
                        @click=${(/** @type {MouseEvent} */ e) => { e.stopPropagation(); this._addCardToArea(name); }}
                    >${ico(ICO_PLUS)}</button>
                    <div class="aab-sep"></div>
                    <button class="aab-btn" title="Area background, border &amp; spacing"
                        @click=${(/** @type {MouseEvent} */ e) => { e.stopPropagation(); this._openAreaSettings(name); }}
                    >${ico(ICO_TUNE)}</button>
                    <button class="aab-btn danger" title="Delete area (and its cards)"
                        @click=${(/** @type {MouseEvent} */ e) => { e.stopPropagation(); this._deleteArea(name); }}
                    >${ico(ICO_DELETE)}</button>
                  `;

            return html`
                <div
                    class="area-overlay ${isSelected ? 'selected' : ''} ${isRenaming ? 'renaming' : ''}"
                    id="ao-${name}"
                    style="display:none; background: color-mix(in oklab, ${bg} ${this._overlayOpacity}%, transparent);"
                    @click=${(e) => { e.stopPropagation(); this._selectArea(name); }}
                >
                    <div class="area-label">${name}</div>
                    <div class="area-action-bar" @click=${(e) => e.stopPropagation()}>
                        ${barContent}
                    </div>
                </div>
            `;
        });
    }

    _renderCellTargets() {
        const targets = [];
        for (let r = 0; r < this.rows.length; r++) {
            for (let c = 0; c < this.columns.length; c++) {
                const occupied = this.areas[r]?.[c] !== '.';
                if (occupied) continue;
                const inSel = this._isCellInSel(r, c);
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
                            title="Create area here"
                            @click=${(e) => { e.stopPropagation(); this._createSingleCellArea(r, c); }}
                        >+</button>
                    </div>
                `);
            }
        }
        return targets;
    }

    _renderNamePopup() {
        return html`
            <div class="name-popup" id="name-popup" style="display:none;">
                <div class="name-popup-title">Name this area</div>
                <ha-input
                    .value=${this._selectionName}
                    placeholder="area-name"
                    @input=${(e) => { this._selectionName = e.target.value; }}
                    @keydown=${this._nameInputKeydown}
                    autofocus
                ></ha-input>
                <div class="name-popup-actions">
                    <ha-button @click=${this._cancelSelection}>Cancel</ha-button>
                    <ha-button unelevated @click=${this._confirmSelection}>Create</ha-button>
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
            const el = this.renderRoot?.querySelector(`#ch-${i}`);
            if (!el) continue;
            const cell = cells[0]?.[i];
            if (!cell) continue;
            el.style.left   = `${cell.left}px`;
            el.style.width  = `${cell.width}px`;
            el.style.height = `${HEADER_OVERLAP}px`;
            el.style.top    = `${Math.max(0, cell.top - HEADER_OVERLAP)}px`;
        }

        // Add-col button: after last column
        const lastCell = cells[0]?.[this.columns.length - 1];
        if (lastCell) {
            const addBtn = this.renderRoot?.querySelector('.add-col-btn');
            if (addBtn) {
                addBtn.style.left = `${lastCell.right + 4}px`;
                addBtn.style.top  = `${Math.max(0, lastCell.top - HEADER_OVERLAP)}px`;
            }
        }
    }

    _positionRowHeaders() {
        const cells = this._cells;
        if (!cells.length) return;

        for (let i = 0; i < this.rows.length; i++) {
            const el = this.renderRoot?.querySelector(`#rh-${i}`);
            if (!el) continue;
            const cell = cells[i]?.[0];
            if (!cell) continue;
            el.style.top    = `${cell.top}px`;
            el.style.height = `${cell.height}px`;
            el.style.width  = `${HEADER_OVERLAP}px`;
            el.style.left   = `${Math.max(0, cell.left - HEADER_OVERLAP)}px`;
        }

        // Add-row button: below last row
        const lastCell = cells[this.rows.length - 1]?.[0];
        if (lastCell) {
            const addBtn = this.renderRoot?.querySelector('.add-row-btn');
            if (addBtn) {
                addBtn.style.top  = `${lastCell.bottom + 4}px`;
                addBtn.style.left = `${Math.max(0, lastCell.left - HEADER_OVERLAP)}px`;
            }
        }
    }

    _positionResizeHandles() {
        const cells = this._cells;
        if (!cells.length) return;
        const lastRow = this.rows.length - 1;
        const lastCol = this.columns.length - 1;
        const topCell    = cells[0]?.[0];
        const bottomCell = cells[lastRow]?.[0];
        const leftCell   = cells[0]?.[0];
        const rightCell  = cells[0]?.[lastCol];

        const gridTop    = topCell?.top    ?? 0;
        const gridBottom = bottomCell?.bottom ?? 0;
        const gridLeft   = leftCell?.left  ?? 0;
        const gridRight  = rightCell?.right ?? 0;

        for (let i = 0; i < this.columns.length - 1; i++) {
            const el = this.renderRoot?.querySelector(`#rhc-${i}`);
            if (!el) continue;
            const a = cells[0]?.[i];
            const b = cells[0]?.[i + 1];
            if (!a || !b) continue;
            const x = (a.right + b.left) / 2 - HANDLE_SIZE / 2;
            el.style.display = 'block';
            el.style.left    = `${x}px`;
            el.style.width   = `${HANDLE_SIZE}px`;
            el.style.top     = `${gridTop}px`;
            el.style.bottom  = `${this._overlayRect?.height - gridBottom}px`;
        }

        for (let i = 0; i < this.rows.length - 1; i++) {
            const el = this.renderRoot?.querySelector(`#rhr-${i}`);
            if (!el) continue;
            const a = cells[i]?.[0];
            const b = cells[i + 1]?.[0];
            if (!a || !b) continue;
            const y = (a.bottom + b.top) / 2 - HANDLE_SIZE / 2;
            el.style.display = 'block';
            el.style.top     = `${y}px`;
            el.style.height  = `${HANDLE_SIZE}px`;
            el.style.left    = `${gridLeft}px`;
            el.style.right   = `${this._overlayRect?.width - gridRight}px`;
        }
    }

    _positionAreaOverlays() {
        const cells = this._cells;
        if (!cells.length) return;
        for (const name of getAreaNames(this.areas)) {
            const el = this.renderRoot?.querySelector(`#ao-${name}`);
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
            // Flip action bar below the cell when there isn't enough room above
            el.classList.toggle('bar-below', tl.top < 50);
        }
    }

    _positionCellTargets() {
        const cells = this._cells;
        if (!cells.length) return;
        for (let r = 0; r < this.rows.length; r++) {
            for (let c = 0; c < this.columns.length; c++) {
                if (this.areas[r]?.[c] !== '.') continue;
                const el = this.renderRoot?.querySelector(`#ct-${r}-${c}`);
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
        const el = this.renderRoot?.querySelector('#sel-rect');
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
        const popup = this.renderRoot?.querySelector('#name-popup');
        if (!popup) return;
        popup.style.display = 'flex';
        const cx = tl.left + (br.right  - tl.left) / 2;
        const cy = tl.top  + (br.bottom - tl.top)  / 2;
        const popupW = 220, popupH = 130;
        popup.style.left = `${Math.max(4, Math.min(cx - popupW / 2, (this._overlayRect?.width ?? 800) - popupW - 4))}px`;
        popup.style.top  = `${Math.max(4, Math.min(cy - popupH / 2, (this._overlayRect?.height ?? 600) - popupH - 4))}px`;
        // Focus the input
        requestAnimationFrame(() => popup.querySelector('ha-input')?.focus?.());
    }

    _positionAddButtons() {
        // Handled within _positionColumnHeaders / _positionRowHeaders
    }

    /** Anchor the settings panel just below the (possibly dragged) toolbar. */
    _positionSettingsPanel() {
        if (!this._showSettings) return;
        const panel = this.renderRoot?.querySelector('.settings-panel');
        const toolbar = this.renderRoot?.querySelector('#toolbar');
        if (!panel || !toolbar) return;
        const tRect = toolbar.getBoundingClientRect();
        const oRect = this._overlayRect ?? this.getBoundingClientRect();
        const panelW = panel.offsetWidth || 240;
        let left = tRect.left - oRect.left;
        let top  = tRect.bottom - oRect.top + 8;
        // Keep the panel within the overlay bounds.
        left = Math.max(4, Math.min(left, (oRect.width ?? 800) - panelW - 4));
        top  = Math.max(4, top);
        panel.style.left   = `${left}px`;
        panel.style.top    = `${top}px`;
        panel.style.right  = 'auto';
        panel.style.bottom = 'auto';
    }

    // ──────────────────────────────────────────────────────────────────────
    // Track interactions
    // ──────────────────────────────────────────────────────────────────────

    _editTrack(axis, index) {
        this._editingTrack = { axis, index };
        // Focus the input after render
        this.updateComplete.then(() => {
            const sel = axis === 'col' ? `#ch-${index} input` : `#rh-${index} input`;
            this.renderRoot?.querySelector(sel)?.focus();
        });
    }

    _trackInputKeydown(e, axis, index) {
        if (e.key === 'Enter') { e.target.blur(); }
        if (e.key === 'Escape') { this._editingTrack = null; }
    }

    _commitTrack(axis, index, value) {
        this._editingTrack = null;
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
                + `delete any areas (and the cards inside them) that fit only within it. `
                + `This cannot be undone.`,
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
        if (e.target.tagName === 'INPUT' || e.target.closest('.del-btn')) return;
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
        const chip = this.renderRoot?.querySelector('#drag-chip');
        if (!chip || !this._reorderDrag) return;
        const { axis, fromIndex, currentIndex } = this._reorderDrag;
        const label = axis === 'col' ? 'Col' : 'Row';
        chip.textContent = currentIndex !== fromIndex
            ? `${label} ${fromIndex + 1} → ${currentIndex + 1}`
            : `${label} ${fromIndex + 1}`;
        const oRect = this._overlayRect ?? this.getBoundingClientRect();
        chip.style.left = `${clientX - oRect.left + 14}px`;
        chip.style.top  = `${clientY - oRect.top + 14}px`;
        chip.style.display = 'block';
    }

    _hideDragChip() {
        const chip = this.renderRoot?.querySelector('#drag-chip');
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
        const overlayLeft = this._overlayRect?.left ?? 0;
        const overlayTop  = this._overlayRect?.top  ?? 0;
        const pos = axis === 'col' ? (e.clientX - overlayLeft) : (e.clientY - overlayTop);

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

    _reorderUp() {
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

    _resizePointerDown(e, axis, index) {
        e.stopPropagation();
        e.currentTarget.setPointerCapture(e.pointerId);
        e.currentTarget.classList.add('active');

        const ghost    = this.renderRoot?.querySelector('#ghost-grid');
        const container = axis === 'col' ? (ghost?.clientWidth ?? 800) : (ghost?.clientHeight ?? 600);

        this._resizeDrag = {
            axis, index,
            startPos: axis === 'col' ? e.clientX : e.clientY,
            origTracks: axis === 'col' ? [...this.columns] : [...this.rows],
            containerPx: container,
            el: e.currentTarget,
        };

        // pointermove/up are handled by the unified listener in connectedCallback
    }

    _resizeMove(e) {
        if (!this._resizeDrag) return;
        const { axis, index, startPos, origTracks, containerPx } = this._resizeDrag;
        const delta = (axis === 'col' ? e.clientX : e.clientY) - startPos;
        const newTracks = resizeAdjacentTracks(origTracks, index, delta, containerPx, this.gap);
        this._resizeDrag._pendingTracks = newTracks;

        // Live preview: update ghost-grid so measurements stay accurate on next rAF
        const ghost = this.renderRoot?.querySelector('#ghost-grid');
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

    _resizeUp() {
        if (!this._resizeDrag) return;
        const { axis, _pendingTracks, el } = this._resizeDrag;
        this._resizeDrag = null;
        el?.classList.remove('active');

        if (!_pendingTracks) return;

        // Reset ghost-grid style (it will be set correctly by _emitGridState → re-render)
        const ghost = this.renderRoot?.querySelector('#ghost-grid');
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
        this._editingTrack = null;
    }

    _startBarRename(name) {
        this._renaming = name;
        this.updateComplete.then(() => {
            /** @type {HTMLInputElement|null} */ (this.renderRoot?.querySelector(`#ao-${name} .aab-rename-input`))?.select();
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
        this._selectedArea = name;
        const host = this.getBoundingClientRect();
        const el = this.renderRoot?.querySelector(`#ao-${name}`);
        const r = el?.getBoundingClientRect();
        const panelW = 360;
        const gap = 10;
        if (r) {
            let left = (r.right - host.left) + gap;
            if (left + panelW > host.width - 4) left = (r.left - host.left) - panelW - gap;
            left = Math.max(4, Math.min(left, host.width - panelW - 4));
            const top = Math.max(4, Math.min(r.top - host.top, host.height - 220));
            this._areaPanelAnchor = { top, left };
        } else {
            this._areaPanelAnchor = { top: 60, left: 16 };
        }
        this._areaPanelPos = null;
        this._areaSettings = name;
    }

    /** Emit a single per-area setting change (empty value removes the key). */
    _updateAreaSetting(name, key, value) {
        this.dispatchEvent(new CustomEvent('area-settings-changed', {
            detail: { name, key, value },
            bubbles: false,
        }));
    }

    _areaPanelDragStart(e) {
        e.stopPropagation();
        const panel = this.renderRoot?.querySelector('.area-panel');
        const rect  = panel?.getBoundingClientRect();
        const oRect = this.getBoundingClientRect();
        e.currentTarget.setPointerCapture?.(e.pointerId);
        this._areaPanelDrag = {
            offsetX: e.clientX - (rect?.left ?? 0),
            offsetY: e.clientY - (rect?.top ?? 0),
            oLeft: oRect.left,
            oTop: oRect.top,
        };
        panel?.classList.add('dragging');
    }
    _areaPanelDragMove(e) {
        if (!this._areaPanelDrag) return;
        const { offsetX, offsetY, oLeft, oTop } = this._areaPanelDrag;
        this._areaPanelPos = {
            left: e.clientX - oLeft - offsetX,
            top:  e.clientY - oTop  - offsetY,
        };
    }
    _areaPanelDragEnd() {
        if (!this._areaPanelDrag) return;
        this._areaPanelDrag = null;
        this.renderRoot?.querySelector('.area-panel')?.classList.remove('dragging');
    }

    _renderAreaSettingsPanel() {
        const name = this._areaSettings;
        const s    = this.layout?.areas?.[name] ?? {};
        const pos  = this._areaPanelPos ?? this._areaPanelAnchor ?? { top: 60, left: 16 };
        const set  = (key, value) => this._updateAreaSetting(name, key, value);

        return html`
            <div class="area-panel" style="top:${pos.top}px; left:${pos.left}px;" @click=${(e) => e.stopPropagation()}>
                <div class="ap-header">
                    <div class="drag-grip" @pointerdown=${this._areaPanelDragStart} title="Drag to move">
                        <ha-icon icon="mdi:drag"></ha-icon>
                    </div>
                    <div class="ap-title">Area — ${name}</div>
                    <button class="ap-close" title="Close" @click=${() => { this._areaSettings = null; }}>×</button>
                </div>
                <div class="ap-body">
                    <div class="ap-group">Surface</div>
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

                    <div class="ap-group">Placement</div>
                    <div class="ap-field">
                        <label>Align ↕</label>
                        <ha-selector
                            .hass=${this.hass}
                            .selector=${{ select: { mode: 'dropdown', options: AREA_ALIGN_V_OPTIONS } }}
                            .value=${s['align-self'] ?? s['place-self'] ?? 'stretch'}
                            @value-changed=${(e) => {
                                const v = e.detail.value;
                                const h = s['justify-self'] ?? s['place-self'] ?? 'stretch';
                                set('place-self',   undefined);
                                set('align-self',   v === 'stretch' ? undefined : v);
                                set('justify-self', h === 'stretch' ? undefined : h);
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
                                set('place-self',   undefined);
                                set('align-self',   v === 'stretch' ? undefined : v);
                                set('justify-self', h === 'stretch' ? undefined : h);
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
                                set('overflow',   undefined);
                                set('overflow-x', ox === 'visible' ? undefined : ox);
                                set('overflow-y', oy === 'visible' ? undefined : oy);
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
                                set('overflow',   undefined);
                                set('overflow-x', ox === 'visible' ? undefined : ox);
                                set('overflow-y', oy === 'visible' ? undefined : oy);
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
                </div>
            </div>
        `;
    }

    _renderAreaCardList(areaName) {
        const cards = (this.cardConfigs ?? [])
            .map((c, i) => ({ c, i }))
            .filter(({ c }) => c?.view_layout?.['grid-area'] === areaName);

        if (!cards.length) return nothing;

        return html`
            <div class="card-list" @click=${(e) => e.stopPropagation()}>
                ${cards.map(({ c, i }) => {
                    const label = (c.type ?? '').replace('custom:', '');
                    return html`
                        <div class="card-row">
                            <span class="card-type" title="${c.type}">${label}</span>
                            <ha-icon-button
                                class="danger"
                                .label=${'Remove card'}
                                title="Remove card from area"
                                @click=${(e) => { e.stopPropagation(); this._deleteCardFromArea(i); }}
                            ><ha-icon icon="mdi:close"></ha-icon></ha-icon-button>
                        </div>
                    `;
                })}
            </div>
        `;
    }

    async _deleteCardFromArea(cardIndex) {
        const card = (this.cardConfigs ?? [])[cardIndex];
        const label = (card?.type ?? 'card').replace('custom:', '');
        const confirmed = await showConfirmDeleteDialog({
            title: 'Remove card?',
            message: `Remove the "${label}" card from this area? This cannot be undone.`,
            confirmText: 'Remove',
        });
        if (!confirmed) return;
        const newCards = [...(this.cardConfigs ?? [])];
        newCards.splice(cardIndex, 1);
        this._emitAreaCards(newCards);
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
        if (this._showNameInput) return;
        // Ignore the hover "+" button click — that path creates a single-cell area directly
        if (e.target?.closest?.('.cell-add-btn')) return;
        e.stopPropagation();
        // Do NOT setPointerCapture — that would block hit-testing sibling cells.
        // The unified overlay pointermove handler tracks the drag instead.
        this._selStart  = { r, c };
        this._selEnd    = { r, c };
        this._selDrag   = true;
        this._selMoved  = false; // becomes true once the pointer enters a different cell
        this._selectedArea = null;
    }

    _selMove(e) {
        if (!this._selDrag) return;
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
                    const el = this.renderRoot?.querySelector(`#ct-${row}-${col}`);
                    if (el) el.classList.toggle('in-sel', this._isCellInSel(row, col));
                }
            }
        }
    }

    _selUp() {
        if (!this._selDrag) return;
        this._selDrag = false;
        // Only open the name popup if the user actually dragged across cells.
        // A bare click (no movement) is ignored to prevent accidental popups —
        // single-cell areas are created via the hover "+" button instead.
        if (this._selMoved && this._selStart && this._selEnd) {
            this._showNameInput = true;
            this._selectionName = '';
            this.requestUpdate();
        } else {
            this._selStart = null;
            this._selEnd   = null;
            this.requestUpdate();
        }
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
        if (!name || !/^[a-zA-Z_-][a-zA-Z0-9_-]*$/.test(name)) {
            this._cancelSelection();
            return;
        }
        const { r: r1, c: c1 } = this._selStart;
        const { r: r2, c: c2 } = this._selEnd;
        const bounds = {
            r1: Math.min(r1, r2), c1: Math.min(c1, c2),
            r2: Math.max(r1, r2) + 1, c2: Math.max(c1, c2) + 1,
        };
        const result = cellsToAreaName(this.areas, bounds, name);
        if (!result.ok) {
            lcardsLog.warn(`[GridEditOverlay] Cannot create area: ${result.error}`);
            return;
        }
        this._selStart      = null;
        this._selEnd        = null;
        this._showNameInput = false;
        this._selectedArea  = name;
        this._emitGridState(this.columns, this.rows, result.grid2d);
    }

    _cancelSelection() {
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
