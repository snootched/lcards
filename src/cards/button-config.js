/**
 * Button card config helpers (pure: no DOM, no core), shared with the node tests.
 *
 * @module cards/button-config
 */
import { deepMergeImmutable } from '../utils/deepMerge.js';

/**
 * Default sections-view cell for each built-in component (they draw to their cell
 * height, keeping their proportions). The user's `grid_options` wins.
 * @type {Record<string, { columns: number, rows: number }>}
 */
export const COMPONENT_GRID = {
    dpad:         { columns: 6, rows: 5 },
    dpad_voyager: { columns: 6, rows: 6 },
    brackets:     { columns: 6, rows: 5 },
    radar:        { columns: 6, rows: 5 },
    alert:        { columns: 6, rows: 4 },
};

/**
 * Merge a component's segment layers (lowest first: component, preset, user, range).
 * Within each layer the `default` entry is a template merged under that layer's own
 * segments and applied to every segment id seen in any layer, so a layer's
 * `segments.default` beats the layers below it but never that layer's own named
 * segment. `default` never becomes a segment itself (there is no SVG element with
 * id="default").
 * @param {Array<Record<string, any>|null|undefined>} layers
 * @returns {Record<string, any>} segment id -> merged config
 */
export function mergeSegmentLayers(layers) {
    const ids = new Set();
    for (const layer of layers) {
        for (const id of Object.keys(layer || {})) if (id !== 'default') ids.add(id);
    }
    /** @type {Record<string, any>} */
    const merged = {};
    for (const id of ids) merged[id] = {};
    for (const layer of layers) {
        if (!layer || Object.keys(layer).length === 0) continue;
        const def = layer.default;
        for (const id of ids) {
            const own = layer[id];
            if (def) merged[id] = deepMergeImmutable(merged[id], def);
            if (own) merged[id] = deepMergeImmutable(merged[id], own);
        }
    }
    return merged;
}

const BORDER_SIDES = {
    width: ['top', 'right', 'bottom', 'left'],
    radius: ['top_left', 'top_right', 'bottom_right', 'bottom_left'],
};

/**
 * Before deep-merging `overlay` over `base` (preset style under the user's style):
 * where the overlay gives `border.width` or `border.radius` as a per-side object and
 * the base gives a single value, spread the base value onto every side, so the sides
 * the overlay leaves out keep it (an object replaces a scalar in a deep merge).
 * @param {Record<string, any>} base
 * @param {Record<string, any>} overlay
 * @returns {Record<string, any>} base, or a copy with the shorthands spread
 */
export function spreadBorderShorthands(base, overlay) {
    const baseBorder = base?.border;
    const overBorder = overlay?.border;
    if (!baseBorder || typeof baseBorder !== 'object' || !overBorder || typeof overBorder !== 'object') return base;
    let border = baseBorder;
    for (const [key, sides] of Object.entries(BORDER_SIDES)) {
        const value = baseBorder[key];
        const over = overBorder[key];
        if (value === undefined || value === null || typeof value === 'object') continue;
        if (!over || typeof over !== 'object') continue;
        if (border === baseBorder) border = { ...baseBorder };
        border[key] = Object.fromEntries(sides.map(side => [side, value]));
    }
    return border === baseBorder ? base : { ...base, border };
}

/**
 * The button's sections-view grid options. A component draws to its cell height
 * (keeping its proportions), so it needs real rows: with 1 row it collapses to a
 * strip. The user's `grid_options` wins.
 * @param {any} config - card config
 * @returns {{ columns: number, rows: number, min_columns: number, min_rows: number }}
 */
export function buttonGridOptions(config) {
    const go = config?.grid_options || {};
    const component = COMPONENT_GRID[config?.component];
    return {
        columns:     go.columns     ?? component?.columns ?? 4,
        rows:        go.rows        ?? component?.rows    ?? 1,
        min_columns: go.min_columns ?? (component ? 2 : 1),
        min_rows:    go.min_rows    ?? (component ? 2 : 1),
    };
}
