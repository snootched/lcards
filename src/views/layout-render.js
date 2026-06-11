/**
 * @fileoverview Shared CSS-Grid render helpers for the layout view and the
 * layout card. Both render the same grid model (`layout` + per-card `view_layout`
 * + per-area `layout.areas`); this module is the single source of truth for the
 * grid container style, per-card placement, and area backing surfaces.
 *
 * Pure-ish: these functions either build a string or mutate a passed-in element.
 * Theme-token resolution reaches the global singleton, matching project rules.
 */

import { getAreaNames, GRID_EDIT_GUTTER } from './layout-grid-utils.js';

// Per-card view_layout keys applied to the GRID ITEM (the card, or its wrapper).
// 'overflow' is handled separately (applied to the card element). Grid placement
// (grid-*) is matched by prefix.
export const CARD_ITEM_STYLE_KEYS = new Set([
    'place-self', 'align-self', 'justify-self', 'margin', 'z-index',
]);

/**
 * Build the inline style string for the grid container (#grid-root).
 *
 * @param {object}   layout    the `layout` config block
 * @param {string[]} columns   resolved column tracks
 * @param {string[]} rows      resolved row tracks
 * @param {string[][]} areas   2D area matrix
 * @param {string}   gap       grid gap
 * @param {object}   [opts]
 * @param {boolean}  [opts.withGutter=false]    reserve the top/left editor gutter
 * @param {string}   [opts.defaultHeight]       height when `layout.height` is unset
 * @param {string}   [opts.overrideHeight]      unconditional height override (ignores layout.height)
 * @param {string}   [opts.overflowY]           overflow-y value (default 'auto')
 * @returns {string}
 */
export function buildGridStyle(layout = {}, columns, rows, areas, gap, opts = {}) {
    const {
        withGutter = false,
        defaultHeight = 'calc(100dvh - var(--header-height, 56px))',
        // Unconditional height override. The view passes '100%' here so that #grid-root fills
        // the host element, which carries the actual height value. This way the CSS Grid engine
        // receives the height as a parent-provided size rather than a self-imposed one.
        // Note: in practice HA's layout context still treats available block-size as indefinite,
        // so fr tracks are resolved in JS by _applyVisibilityRowHeights() rather than by CSS.
        overrideHeight = undefined,
        overflowY = 'auto',
    } = opts;
    const parts = [];

    const height = overrideHeight !== undefined ? overrideHeight : (layout.height ?? defaultHeight);
    if (height) parts.push(`height: ${height}`);
    if (layout.height != null && layout.height !== 'auto') parts.push(`overflow-y: ${overflowY}`);

    if (layout.margin != null)  parts.push(`margin: ${layout.margin}`);
    if (layout.padding != null) parts.push(`padding: ${layout.padding}`);

    // Editor gutter so the overlay's row/column headers don't cover the first
    // row/column. Longhand after `padding` so it overrides only top/left.
    if (withGutter) {
        parts.push(`padding-top: ${GRID_EDIT_GUTTER}px`);
        parts.push(`padding-left: ${GRID_EDIT_GUTTER}px`);
    }

    parts.push(`grid-template-columns: ${columns.join(' ')}`);
    parts.push(`grid-template-rows: ${rows.join(' ')}`);
    if (getAreaNames(areas).length > 0) {
        parts.push(`grid-template-areas: ${areas.map(r => `"${r.join(' ')}"`).join(' ')}`);
    }
    parts.push(`gap: ${gap}`);

    // Pass through grid auto-* and place-* container properties.
    for (const [key, value] of Object.entries(layout)) {
        if (key === 'place-items' || key === 'place-content'
            || key === 'grid-auto-flow' || key === 'grid-auto-columns' || key === 'grid-auto-rows') {
            parts.push(`${key}: ${value}`);
        }
    }

    return parts.join('; ');
}

/**
 * Apply placement / spacing styles for a single card.
 *
 * Precedence (low → high): global defaults (cardMargin / cardOverflow) <
 * per-area defaults (areaSettings) < per-card view_layout. Grid placement and
 * alignment land on the grid item (the card, or its edit-mode wrapper); overflow
 * lands on the card so its content clips regardless of any wrapper.
 *
 * @param {HTMLElement} gridItem
 * @param {HTMLElement} cardEl
 * @param {object} viewLayout
 * @param {string|null} cardMargin
 * @param {string} cardOverflow
 * @param {object} [areaSettings]
 */
export function applyCardPlacement(gridItem, cardEl, viewLayout, cardMargin, cardOverflow, areaSettings = {}) {
    // Clear previously-applied item styles so removed keys don't persist on a
    // reused element.
    for (const k of ['grid-area', 'grid-column', 'grid-row',
                     'place-self', 'align-self', 'justify-self', 'z-index']) {
        gridItem.style.removeProperty(k);
    }
    const baseMargin = areaSettings.margin ?? cardMargin;
    gridItem.style.margin = baseMargin != null ? baseMargin : '';

    // Overflow: clear both axes first, then apply area-settings fallback, then
    // per-card view_layout (handled below in the loop).
    cardEl.style.removeProperty('overflow');
    cardEl.style.removeProperty('overflow-x');
    cardEl.style.removeProperty('overflow-y');
    const areaOverflow = areaSettings.overflow ?? cardOverflow;
    if (areaSettings['overflow-x'] || areaSettings['overflow-y']) {
        cardEl.style.setProperty('overflow-x', areaSettings['overflow-x'] ?? areaOverflow);
        cardEl.style.setProperty('overflow-y', areaSettings['overflow-y'] ?? areaOverflow);
    } else {
        cardEl.style.overflow = areaOverflow;
    }

    // Alignment: support both the shorthand (place-self) and per-axis overrides.
    if (areaSettings['align-self'] || areaSettings['justify-self']) {
        if (areaSettings['align-self'])   gridItem.style.setProperty('align-self',   String(areaSettings['align-self']));
        if (areaSettings['justify-self']) gridItem.style.setProperty('justify-self', String(areaSettings['justify-self']));
    } else if (areaSettings['place-self']) {
        gridItem.style.setProperty('place-self', String(areaSettings['place-self']));
    }

    for (const [key, value] of Object.entries(viewLayout ?? {})) {
        if (key === 'show') continue;
        const v = String(value);
        if (key === 'overflow' || key === 'overflow-x' || key === 'overflow-y') {
            cardEl.style.setProperty(key, v);
        } else if (key.startsWith('grid-') || CARD_ITEM_STYLE_KEYS.has(key)) {
            gridItem.style.setProperty(key, v);
        }
    }
}

/**
 * Carry a nested `lcards-layout-card`'s height onto its grid-item wrapper.
 *
 * A layout-card sets its own host height, but the wrapper that actually IS the
 * grid item (HA's `hui-card`, or the edit-mode `.card-edit-wrap`) stays auto-height
 * and does NOT propagate the card's height up to a content-sized
 * (`minmax(0,auto)` / `auto`) grid row — so that row collapses to 0 and the card
 * overflows the next row. Setting the height on the grid item itself makes the row
 * size to it (and it still collapses to 0 when the item is `display:none`).
 *
 * @param {HTMLElement} gridItem    the element participating in the grid
 * @param {object} cardConfig       the child card config
 */
export function applyGridItemHeight(gridItem, cardConfig) {
    if (cardConfig?.type !== 'custom:lcards-layout-card') return;
    const h = cardConfig.layout?.height;
    // Only forward a DEFINITE, non-percentage height (e.g. '8vh', '120px').
    // '100%' → leave to grid stretch. 'auto' → do NOT set: hui-card's shadow DOM
    // has a slot wrapper with height:100%, which resolves to 0 in an unsized
    // parent, so hui-card at height:auto still reports 0px computed height and
    // contributes nothing to the row's max-content.  Clearing to '' is correct.
    gridItem.style.height = (h && h !== '100%' && h !== 'auto') ? h : '';
}

/** Resolve a `theme:` token to its value; pass CSS colors/vars through unchanged. */
export function resolveColorValue(v) {
    if (typeof v === 'string' && v.startsWith('theme:')) {
        const resolver = window.lcards?.core?.themeManager?.resolver;
        return resolver?.resolve?.(v, 'transparent') ?? v;
    }
    return v;
}

/** Apply the surface (decoration) keys of an area settings object to an element. */
export function applyAreaSurfaceStyle(el, s) {
    if (s.background) el.style.background = resolveColorValue(s.background);
    if (s['background-image']) {
        el.style.backgroundImage    = s['background-image'];
        el.style.backgroundSize     = s['background-size']     ?? 'cover';
        el.style.backgroundPosition = s['background-position'] ?? 'center';
        el.style.backgroundRepeat   = s['background-repeat']   ?? 'no-repeat';
    }
    if (s['border-width']) el.style.borderWidth = s['border-width'];
    if (s['border-style']) el.style.borderStyle = s['border-style'];
    if (s['border-color']) el.style.borderColor = resolveColorValue(s['border-color']);
    if (s['border-radius']) el.style.borderRadius = s['border-radius'];
    if (s['z-index'] != null && s['z-index'] !== '') el.style.zIndex = String(s['z-index']);
}

/**
 * Append a non-interactive backing surface for each named area that has settings
 * in `layout.areas`. Surfaces share the area's grid cell with the card (as
 * siblings) and sit beneath it, so they show through margins and remain visible
 * when the area is empty.
 *
 * @param {HTMLElement} grid    the grid container
 * @param {object} layout       the `layout` block (reads `layout.areas`)
 * @param {string[][]} areas    2D area matrix (used to validate names)
 */
export function renderAreaSurfaces(grid, layout, areas) {
    const areaSettings = layout?.areas;
    if (!areaSettings || typeof areaSettings !== 'object') return;
    const valid = new Set(getAreaNames(areas));
    for (const [name, settings] of Object.entries(areaSettings)) {
        if (!valid.has(name) || !settings || typeof settings !== 'object') continue;
        const surface = document.createElement('div');
        surface.className = 'area-surface';
        surface.style.gridArea = name;
        applyAreaSurfaceStyle(surface, settings);
        grid.appendChild(surface);
    }
}
