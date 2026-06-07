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
 * @param {boolean}  [opts.withGutter=false]  reserve the top/left editor gutter
 * @param {string}   [opts.defaultHeight]     height when `layout.height` is unset
 * @returns {string}
 */
export function buildGridStyle(layout = {}, columns, rows, areas, gap, opts = {}) {
    const { withGutter = false, defaultHeight = 'calc(100dvh - var(--header-height, 56px))' } = opts;
    const parts = [];

    const height = layout.height ?? defaultHeight;
    if (height) {
        parts.push(`height: ${height}`);
        if (height !== 'auto') parts.push('overflow-y: auto');
    }

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
    cardEl.style.overflow = areaSettings.overflow ?? cardOverflow;
    if (areaSettings['place-self']) {
        gridItem.style.setProperty('place-self', String(areaSettings['place-self']));
    }

    for (const [key, value] of Object.entries(viewLayout ?? {})) {
        if (key === 'show') continue;
        const v = String(value);
        if (key === 'overflow') {
            cardEl.style.setProperty('overflow', v);
        } else if (key.startsWith('grid-') || CARD_ITEM_STYLE_KEYS.has(key)) {
            gridItem.style.setProperty(key, v);
        }
    }
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
