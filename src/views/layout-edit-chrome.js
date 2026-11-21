/**
 * @fileoverview Shared edit-mode chrome for the layout view and the grid edit
 * overlay: mdi icon paths, the edit toolbar strip styles and the Layout | Cards
 * mode toggle. Both edit modes render the same strip so switching modes doesn't
 * move the controls.
 *
 * The strip sits in space the grid reserves above itself (EDIT_BAR_HEIGHT, see
 * editReserve in layout-grid-utils.js), so it never floats over cards.
 */

import { html, css, nothing } from 'lit';
import { EDIT_BAR_HEIGHT } from './layout-grid-utils.js';

// mdi icon paths (Pictogrammers, Apache-2.0), for ha-icon-button `.path` / ha-svg-icon.
export const ICON = {
    pencil:       'M20.71,7.04C21.1,6.65 21.1,6 20.71,5.63L18.37,3.29C18,2.9 17.35,2.9 16.96,3.29L15.12,5.12L18.87,8.87M3,17.25V21H6.75L17.81,9.93L14.06,6.18L3,17.25Z',
    plus:         'M19,13H13V19H11V13H5V11H11V5H13V11H19V13Z',
    tune:         'M8 13C6.14 13 4.59 14.28 4.14 16H2V18H4.14C4.59 19.72 6.14 21 8 21S11.41 19.72 11.86 18H22V16H11.86C11.41 14.28 9.86 13 8 13M8 19C6.9 19 6 18.1 6 17C6 15.9 6.9 15 8 15S10 15.9 10 17C10 18.1 9.1 19 8 19M19.86 6C19.41 4.28 17.86 3 16 3S12.59 4.28 12.14 6H2V8H12.14C12.59 9.72 14.14 11 16 11S19.41 9.72 19.86 8H22V6H19.86M16 9C14.9 9 14 8.1 14 7C14 5.9 14.9 5 16 5S18 5.9 18 7C18 8.1 17.1 9 16 9Z',
    delete:       'M19,4H15.5L14.5,3H9.5L8.5,4H5V6H19M6,19A2,2 0 0,0 8,21H16A2,2 0 0,0 18,19V7H6V19Z',
    check:        'M21,7L9,19L3.5,13.5L4.91,12.09L9,16.17L19.59,5.59L21,7Z',
    close:        'M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z',
    dotsVertical: 'M12,16A2,2 0 0,1 14,18A2,2 0 0,1 12,20A2,2 0 0,1 10,18A2,2 0 0,1 12,16M12,10A2,2 0 0,1 14,12A2,2 0 0,1 12,14A2,2 0 0,1 10,12A2,2 0 0,1 12,10M12,4A2,2 0 0,1 14,6A2,2 0 0,1 12,8A2,2 0 0,1 10,6A2,2 0 0,1 12,4Z',
    rename:       'M15 16L11 20H21V16H15M12.06 7.19L3 16.25V20H6.75L15.81 10.94L12.06 7.19M5.92 18H5V17.08L12.06 10L13 10.94L5.92 18M18.71 8.04C19.1 7.65 19.1 7 18.71 6.63L16.37 4.29C16.17 4.09 15.92 4 15.66 4C15.41 4 15.15 4.1 14.96 4.29L13.13 6.12L16.88 9.87L18.71 8.04Z',
    colAfter:     'M11,2A2,2 0 0,1 13,4V20A2,2 0 0,1 11,22H2V2H11M4,10V14H11V10H4M4,16V20H11V16H4M4,4V8H11V4H4M15,11H18V8H20V11H23V13H20V16H18V13H15V11Z',
    colBefore:    'M13,2A2,2 0 0,0 11,4V20A2,2 0 0,0 13,22H22V2H13M20,10V14H13V10H20M20,16V20H13V16H20M20,4V8H13V4H20M9,11H6V8H4V11H1V13H4V16H6V13H9V11Z',
    rowAfter:     'M22,10A2,2 0 0,1 20,12H4A2,2 0 0,1 2,10V3H4V5H8V3H10V5H14V3H16V5H20V3H22V10M4,10H8V7H4V10M10,10H14V7H10V10M20,10V7H16V10H20M11,14H13V17H16V19H13V22H11V19H8V17H11V14Z',
    rowBefore:    'M22,14A2,2 0 0,0 20,12H4A2,2 0 0,0 2,14V21H4V19H8V21H10V19H14V21H16V19H20V21H22V14M4,14H8V17H4V14M10,14H14V17H10V14M20,14V17H16V14H20M11,10H13V7H16V5H13V2H11V5H8V7H11V10Z',
    grid:         'M3 11H11V3H3M5 5H9V9H5M13 21H21V13H13M15 15H19V19H15M3 21H11V13H3M5 15H9V19H5M13 3V11H21V3M19 9H15V5H19Z',
    cards:        'M21 16V6H7V16H21M21 4C21.53 4 22.04 4.21 22.41 4.59C22.79 4.96 23 5.47 23 6V16C23 16.53 22.79 17.04 22.41 17.41C22.04 17.79 21.53 18 21 18H7C5.89 18 5 17.1 5 16V6C5 4.89 5.89 4 7 4H21M3 20H18V22H3C2.47 22 1.96 21.79 1.59 21.41C1.21 21.04 1 20.53 1 20V9H3V20Z',
    info:         'M11,9H13V7H11M12,20C7.59,20 4,16.41 4,12C4,7.59 7.59,4 12,4C16.41,4 20,7.59 20,12C20,16.41 16.41,20 12,20M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M11,17H13V11H11V17Z',
    opacity:      'M17.66,8L12,2.35L6.34,8C4.78,9.56 4,11.64 4,13.64C4,15.64 4.78,17.75 6.34,19.31C7.9,20.87 9.95,21.66 12,21.66C14.05,21.66 16.1,20.87 17.66,19.31C19.22,17.75 20,15.64 20,13.64C20,11.64 19.22,9.56 17.66,8M6,14C6,12 6.62,10.73 7.76,9.6L12,5.27L16.24,9.65C17.38,10.77 18,12 18,14H6Z',
};

/**
 * The Layout | Cards toggle (HA pill toggle group: wa-button-group + ha-button).
 * @param {'grid'|'cards'} mode
 * @param {(mode: 'grid'|'cards') => void} onChange
 */
export function renderModeToggle(mode, onChange) {
    const btn = (/** @type {'grid'|'cards'} */ value, /** @type {string} */ label, /** @type {string} */ icon) => html`
        <ha-button iconTag="ha-svg-icon" variant="brand" size="s"
            .appearance=${mode === value ? 'accent' : 'filled'}
            aria-pressed=${mode === value ? 'true' : 'false'}
            @click=${() => { if (mode !== value) onChange(value); }}>
            <ha-svg-icon slot="start" .path=${icon}></ha-svg-icon>
            ${label}
        </ha-button>`;
    return html`
        <wa-button-group class="mode-toggle" childSelector="ha-button" label="Edit mode">
            ${btn('grid', 'Layout', ICON.grid)}
            ${btn('cards', 'Cards', ICON.cards)}
        </wa-button-group>`;
}

/**
 * Help at the end of the strip: an info button whose tooltip (HA's ha-tooltip,
 * on hover, focus or tap) holds the hint, so it never truncates on a narrow strip.
 * @param {string} text
 * @param {string} [id]  unique within the shadow root
 */
export function renderBarHint(text, id = 'edit-bar-help') {
    if (!text) return nothing;
    return html`
        <ha-icon-button class="edit-bar-help" id=${id} .path=${ICON.info} .label=${text}></ha-icon-button>
        <ha-tooltip for=${id} placement="bottom-end">${text}</ha-tooltip>`;
}

/**
 * Styles for the edit toolbar strip (`.edit-bar`) and its contents. Both the
 * view (card mode) and the overlay (grid mode) include these.
 */
export const editBarStyles = css`
    .edit-bar {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        height: ${EDIT_BAR_HEIGHT}px;
        box-sizing: border-box;
        display: flex;
        align-items: center;
        gap: var(--ha-space-2);
        padding: 0 var(--ha-space-3);
        background: var(--card-background-color, var(--primary-background-color));
        border-bottom: var(--ha-border-width-sm) solid var(--divider-color);
        color: var(--primary-text-color);
        font-family: var(--ha-font-family-body);
        pointer-events: auto;
        overflow-x: auto;
        overflow-y: hidden;
        scrollbar-width: thin;
        white-space: nowrap;
    }
    .edit-bar > * { flex-shrink: 0; }
    .edit-bar-sep {
        width: var(--ha-border-width-sm);
        height: 24px;
        background: var(--divider-color);
    }
    /* Stays visible at the right end even when the strip scrolls on a phone. */
    .edit-bar .edit-bar-help {
        position: sticky;
        right: 0;
        margin-inline-start: auto;
        background: var(--card-background-color, var(--primary-background-color));
        border-radius: var(--ha-border-radius-circle);
    }
    .edit-bar ha-icon-button {
        --ha-icon-button-size: 36px;
        color: var(--secondary-text-color);
    }
    .edit-bar ha-icon-button.active { color: var(--primary-color); }

    /* Pill toggle group (see lcards-color-picker.js): square the inner corners. */
    .mode-toggle ha-button:first-child::part(base) {
        border-start-start-radius: var(--ha-border-radius-pill);
        border-end-start-radius: var(--ha-border-radius-pill);
        border-start-end-radius: 0;
        border-end-end-radius: 0;
        border-inline-end: none;
    }
    .mode-toggle ha-button:last-child::part(base) {
        border-start-start-radius: 0;
        border-end-start-radius: 0;
        border-start-end-radius: var(--ha-border-radius-pill);
        border-end-end-radius: var(--ha-border-radius-pill);
    }
`;

/**
 * Shared look of the floating edit panels (grid settings, track menu, area and
 * placement settings): an HA surface with a header row (title + close).
 */
export const editPanelStyles = css`
    .edit-panel {
        position: absolute;
        pointer-events: auto;
        box-sizing: border-box;
        max-width: calc(100% - var(--ha-space-2));
        max-height: calc(100% - var(--ha-space-2));
        overflow: auto;
        background: var(--card-background-color, var(--primary-background-color));
        color: var(--primary-text-color);
        border: var(--ha-border-width-sm) solid var(--divider-color);
        border-radius: var(--ha-border-radius-lg);
        box-shadow: var(--ha-box-shadow-l);
        font-family: var(--ha-font-family-body);
    }
    .edit-panel-header {
        position: sticky;
        top: 0;
        z-index: 1;
        display: flex;
        align-items: center;
        gap: var(--ha-space-1);
        padding: var(--ha-space-1) var(--ha-space-1) var(--ha-space-1) var(--ha-space-3);
        background: inherit;
        border-bottom: var(--ha-border-width-sm) solid var(--divider-color);
        touch-action: none;
    }
    .edit-panel-header.draggable { cursor: grab; }
    .edit-panel.dragging .edit-panel-header { cursor: grabbing; }
    .edit-panel-title {
        flex: 1;
        min-width: 0;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        font-size: var(--ha-font-size-m, 14px);
        font-weight: var(--ha-font-weight-medium, 500);
    }
    .edit-panel-header ha-icon-button {
        --ha-icon-button-size: 36px;
        color: var(--secondary-text-color);
    }
    .edit-panel-body {
        padding: var(--ha-space-3);
        display: flex;
        flex-direction: column;
        gap: var(--ha-space-2);
    }
    .edit-panel-actions {
        display: flex;
        justify-content: flex-end;
        flex-wrap: wrap;
        gap: var(--ha-space-2);
        padding-top: var(--ha-space-2);
        border-top: var(--ha-border-width-sm) solid var(--divider-color);
    }
`;

/**
 * Width (px) of the docked inspector. While it is open the view (or the layout
 * studio canvas) narrows the grid by this much, so the dock never covers cards.
 * Below DOCK_SHEET_BREAKPOINT it is a bottom sheet over the grid instead.
 */
export const EDIT_DOCK_WIDTH = 340;
export const DOCK_SHEET_BREAKPOINT = 600;

/**
 * The docked inspector (`.edit-dock`): one panel on the right edge whose content
 * follows the selection (grid settings, a track, an area, a card's placement).
 * Uses the edit-panel header / body / actions classes for its content.
 */
export const editDockStyles = css`
    .edit-dock {
        position: absolute;
        top: ${EDIT_BAR_HEIGHT}px;
        right: 0;
        bottom: 0;
        width: ${EDIT_DOCK_WIDTH}px;
        box-sizing: border-box;
        display: flex;
        flex-direction: column;
        pointer-events: auto;
        background: var(--card-background-color, var(--primary-background-color));
        color: var(--primary-text-color);
        border-left: var(--ha-border-width-sm) solid var(--divider-color);
        font-family: var(--ha-font-family-body);
    }
    .edit-dock-body {
        flex: 1;
        min-height: 0;
        overflow: auto;
        padding: var(--ha-space-3);
        display: flex;
        flex-direction: column;
        gap: var(--ha-space-2);
    }
    @media (max-width: ${DOCK_SHEET_BREAKPOINT}px) {
        .edit-dock {
            top: auto;
            left: 0;
            width: auto;
            height: 55%;
            border-left: none;
            border-top: var(--ha-border-width-sm) solid var(--divider-color);
            border-radius: var(--ha-border-radius-lg) var(--ha-border-radius-lg) 0 0;
            box-shadow: var(--ha-box-shadow-l);
        }
    }
`;

/**
 * Header row of an edit panel.
 * @param {string} title
 * @param {() => void} onClose
 * @param {((e: PointerEvent) => void) | null} [onDragStart]  makes the header a drag handle
 */
export function renderPanelHeader(title, onClose, onDragStart = null) {
    return html`
        <div class="edit-panel-header ${onDragStart ? 'draggable' : ''}"
            @pointerdown=${(/** @type {PointerEvent} */ e) => {
                if (!onDragStart || /** @type {HTMLElement} */ (e.target).closest('ha-icon-button')) return;
                onDragStart(e);
            }}>
            <span class="edit-panel-title">${title}</span>
            <ha-icon-button .path=${ICON.close} .label=${'Close'} @click=${onClose}></ha-icon-button>
        </div>`;
}
