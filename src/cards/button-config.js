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
    alert:        { columns: 6, rows: 4 },
};

/** Pointer states a state map keeps from the layer below when it doesn't set them. */
const POINTER_STATES = ['hover', 'pressed'];

/**
 * Before `over` is merged onto `base` (one segment config each): where `over` gives a
 * style property as a state map without `hover` / `pressed` and `base` had them (as a
 * map, or a `theme:` token that resolves to one), copy them into `over`. A map
 * replaces the value under it whole, so a user's `fill: { default, active }` dropped
 * the theme's pointer colours and the segments stopped reacting to hover and press
 * (2026-11-17). Only the pointer states: the theme's `inactive` or `unavailable`
 * would beat the user's own `default`.
 * @param {Record<string, any>} base
 * @param {Record<string, any>|undefined} over
 * @param {(token: string) => any} [resolveToken]
 * @returns {Record<string, any>|undefined} over, or a copy with the pointer states
 */
function keepPointerStates(base, over, resolveToken) {
    const baseStyle = base?.style;
    const overStyle = over?.style;
    if (!baseStyle || typeof baseStyle !== 'object' || !overStyle || typeof overStyle !== 'object') return over;
    /** @type {Record<string, any>|null} */
    let style = null;
    for (const [prop, value] of Object.entries(overStyle)) {
        if (!value || typeof value !== 'object' || Array.isArray(value)) continue;
        if (POINTER_STATES.every((k) => value[k] !== undefined)) continue;
        let under = baseStyle[prop];
        if (typeof under === 'string' && under.startsWith('theme:') && resolveToken) under = resolveToken(under);
        if (!under || typeof under !== 'object') continue;
        /** @type {Record<string, any>} */
        const add = {};
        for (const k of POINTER_STATES) if (value[k] === undefined && under[k] !== undefined) add[k] = under[k];
        if (!Object.keys(add).length) continue;
        const next = style ?? { ...overStyle };
        next[prop] = { ...value, ...add };
        style = next;
    }
    return style ? { ...over, style } : over;
}

/**
 * Merge a component's segment layers (lowest first: component, preset, user, range).
 * Within each layer the `default` entry is a template merged under that layer's own
 * segments and applied to every segment id seen in any layer, so a layer's
 * `segments.default` beats the layers below it but never that layer's own named
 * segment. `default` never becomes a segment itself (there is no SVG element with
 * id="default"). A state map keeps the `hover` and `pressed` of the value it
 * replaces (keepPointerStates).
 * @param {Array<Record<string, any>|null|undefined>} layers
 * @param {(token: string) => any} [resolveToken] turns a `theme:` token into its value
 * @returns {Record<string, any>} segment id -> merged config
 */
export function mergeSegmentLayers(layers, resolveToken) {
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
            if (def) merged[id] = deepMergeImmutable(merged[id], keepPointerStates(merged[id], def, resolveToken));
            if (own) merged[id] = deepMergeImmutable(merged[id], keepPointerStates(merged[id], own, resolveToken));
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
