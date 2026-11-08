/**
 * Select menu card config helpers (pure: no DOM, no core), shared with the node tests.
 *
 * @module cards/select-menu-config
 */
import { deepMergeImmutable } from '../utils/deepMerge.js';
import { spreadBorderShorthands } from './button-config.js';

/** Row height the card assumes when `grid-auto-rows` is not a pixel value. */
export const DEFAULT_ROW_PX = 56;

/** An option's card-level keys that go to that option's button. */
export const OPTION_CARD_KEYS = ['rules', 'sounds', 'variables', 'zones', 'debug_zones'];

/**
 * Split a CSS track list into its top-level tracks, expanding `repeat(N, ...)`
 * (`minmax(a, b)` stays one track). `repeat(auto-fill, ...)` counts once.
 * @param {string} tracks
 * @returns {string[]}
 */
export function splitTracks(tracks) {
    /** @type {string[]} */
    const words = [];
    let depth = 0, word = '';
    for (const ch of String(tracks).trim()) {
        if (ch === '(') depth++;
        else if (ch === ')') depth--;
        if (/\s/.test(ch) && depth === 0) {
            if (word) words.push(word);
            word = '';
        } else {
            word += ch;
        }
    }
    if (word) words.push(word);
    return words.flatMap(w => {
        const rep = w.match(/^repeat\(\s*([^,]+?)\s*,\s*(.*)\)$/i);
        if (!rep) return [w];
        const inner = splitTracks(rep[2]);
        const n = parseInt(rep[1], 10);
        return Number.isFinite(n) && n > 0 ? Array.from({ length: n }, () => inner).flat() : inner;
    });
}

/**
 * Columns in the option grid: grid-template-columns, else grid.columns (a number,
 * or a track list), else 1.
 * @param {Record<string, any>} [grid]
 * @returns {number}
 */
export function columnCount(grid = {}) {
    const tracks = grid['grid-template-columns'] ?? grid.columns;
    if (typeof tracks === 'number') return Math.max(1, Math.floor(tracks));
    if (typeof tracks !== 'string' || !tracks.trim()) return 1;
    return Math.max(1, splitTracks(tracks).length);
}

/**
 * Pixel bounds of a row track: `Npx` gives N for both, `minmax(Apx, Bpx)` gives
 * A and B; anything else is null.
 * @param {string} track
 * @returns {{ min: number, max: number } | null}
 */
export function trackPx(track) {
    const s = String(track).trim();
    const mm = s.match(/^minmax\(\s*([\d.]+)px\s*,\s*([\d.]+)px\s*\)$/i);
    if (mm) return { min: parseFloat(mm[1]), max: parseFloat(mm[2]) };
    const px = s.match(/^([\d.]+)px$/);
    if (px) return { min: parseFloat(px[1]), max: parseFloat(px[1]) };
    return null;
}

/** @param {Record<string, any>} grid */
export function autoRowsOf(grid = {}) {
    return String(grid['grid-auto-rows'] || `${DEFAULT_ROW_PX}px`);
}

/**
 * Row and column gaps: `row-gap` / `column-gap` (or their aliases `row_gap` /
 * `column_gap`), else `gap`, else 4px.
 * @param {Record<string, any>} [grid]
 */
export function gridGaps(grid = {}) {
    const gap = grid.gap || '4px';
    return {
        rowGap: grid['row-gap'] || grid.row_gap || gap,
        columnGap: grid['column-gap'] || grid.column_gap || gap,
    };
}

/**
 * Explicit row tracks from grid.rows: a number gives that many rows of the
 * grid-auto-rows height, a string is a CSS grid-template-rows value.
 * @param {Record<string, any>} [grid]
 * @param {string} [autoRows] - the row height a number of rows uses
 * @returns {{ template: string | null, tracks: string[] }}
 */
export function explicitRows(grid = {}, autoRows = autoRowsOf(grid)) {
    const rows = grid.rows;
    if (typeof rows === 'number' && rows >= 1) {
        const n = Math.floor(rows);
        return { template: `repeat(${n}, ${autoRows})`, tracks: Array(n).fill(autoRows) };
    }
    if (typeof rows === 'string' && rows.trim()) {
        if (/^\d+$/.test(rows.trim())) return explicitRows({ ...grid, rows: parseInt(rows, 10) }, autoRows);
        return { template: rows.trim(), tracks: splitTracks(rows) };
    }
    return { template: null, tracks: [] };
}

/**
 * Rows the option grid has for `n` options. Row flow: the explicit rows, or more
 * when the options need them. Column flow: the explicit rows (one without), since
 * the options then add columns instead.
 * @param {Record<string, any>} [grid]
 * @param {number} n - number of options
 * @returns {number}
 */
export function rowCount(grid = {}, n = 0) {
    const explicit = explicitRows(grid).tracks.length;
    if (String(grid['grid-auto-flow'] || 'row').startsWith('column')) return Math.max(1, explicit);
    return Math.max(1, explicit, Math.ceil(n / columnCount(grid)));
}

/**
 * Height of the option grid in px from the config alone: each row's height (an
 * explicit pixel track, else the grid-auto-rows px, the larger value of
 * minmax(Apx, Bpx), else 56px) plus the row gaps.
 * @param {Record<string, any>} [grid]
 * @param {number} n - number of options
 * @returns {number}
 */
export function naturalHeightPx(grid = {}, n = 0) {
    const autoPx = trackPx(autoRowsOf(grid))?.max ?? DEFAULT_ROW_PX;
    const tracks = explicitRows(grid).tracks;
    const rows = rowCount(grid, n);
    let total = 0;
    for (let i = 0; i < rows; i++) total += (i < tracks.length ? trackPx(tracks[i])?.max : null) ?? autoPx;
    const gapPx = parseFloat(gridGaps(grid).rowGap) || 0;
    return total + (rows - 1) * gapPx;
}

/**
 * The option grid's inline CSS, and the host height for grid.height: fit.
 *
 * - fit (with a pixel grid-auto-rows): the host gets the natural height.
 * - 100% (with a pixel grid-auto-rows): the rows share the measured container
 *   height within the grid-auto-rows bounds; below the minimum the grid scrolls,
 *   and before the first measurement it clips.
 *
 * @param {Record<string, any>} [grid]
 * @param {number} n - number of options
 * @param {number} [containerHeight] - measured host height (100% mode), 0 if unknown
 * @returns {{ style: string, hostHeight: number | null }}
 */
export function gridLayout(grid = {}, n = 0, containerHeight = 0) {
    let tplCols = grid['grid-template-columns'];
    if (!tplCols) {
        const cols = grid.columns;
        tplCols = cols ? (typeof cols === 'number' ? `repeat(${cols}, 1fr)` : String(cols)) : 'repeat(1, 1fr)';
    }
    const { rowGap, columnGap } = gridGaps(grid);
    const autoFlow = grid['grid-auto-flow'] || 'row';
    let autoRows = autoRowsOf(grid);
    /** @type {string | null} */
    let overflowY = null;
    /** @type {number | null} */
    let hostHeight = null;
    const bounds = trackPx(autoRows);

    if (grid.height === 'fit' && n > 0 && bounds) hostHeight = naturalHeightPx(grid, n);

    if (grid.height === '100%' && n > 0 && bounds) {
        if (containerHeight > 0) {
            const rows = rowCount(grid, n);
            const gapPx = parseFloat(rowGap) || 0;
            const fit = Math.floor((containerHeight - (rows - 1) * gapPx) / rows);
            if (fit < bounds.min) {
                // even the minimum overflows: keep buttons usable, scroll inside the menu
                autoRows = `${bounds.min}px`;
                overflowY = 'auto';
            } else {
                autoRows = `${Math.min(bounds.max, fit)}px`;
            }
        } else {
            overflowY = 'hidden';
        }
    }

    const parts = [
        'display: grid',
        `grid-template-columns: ${tplCols}`,
    ];
    const rows = explicitRows(grid, autoRows).template;
    if (rows) parts.push(`grid-template-rows: ${rows}`);
    parts.push(
        `row-gap: ${rowGap}`,
        `column-gap: ${columnGap}`,
        `grid-auto-flow: ${autoFlow}`,
        `grid-auto-rows: ${autoRows}`,
    );
    if (grid['justify-items']) parts.push(`justify-items: ${grid['justify-items']}`);
    if (grid['align-items']) parts.push(`align-items: ${grid['align-items']}`);
    parts.push('width: 100%', 'box-sizing: border-box');
    if (grid.height === '100%') parts.push('height: 100%');
    if (overflowY) parts.push(`overflow-y: ${overflowY}`);
    return { style: parts.join('; '), hostHeight };
}

/**
 * Merge style layers key by key, lowest first (button_template.style, the card's
 * style, the option's style, rule patches). A per-side border object keeps the
 * lower layers' single value on the sides it leaves out.
 * @param {Array<Record<string, any> | null | undefined>} layers
 * @returns {Record<string, any> | undefined} undefined when no layer has keys
 */
export function mergeStyleLayers(layers) {
    /** @type {Record<string, any> | undefined} */
    let out;
    for (const layer of layers) {
        if (!layer || typeof layer !== 'object' || Object.keys(layer).length === 0) continue;
        out = out ? deepMergeImmutable(spreadBorderShorthands(out, layer), layer) : deepMergeImmutable({}, layer);
    }
    return out;
}

/**
 * The option opacity from a merged style: `opacity` (0 to 1) on every option but
 * the selected one; 1 when unset.
 * @param {Record<string, any> | undefined} style
 * @param {boolean} dimmed - the option is not the selected one
 * @returns {number}
 */
export function optionOpacity(style, dimmed) {
    const o = Number(style?.opacity);
    if (!dimmed || style?.opacity === undefined || style?.opacity === null || !Number.isFinite(o)) return 1;
    return Math.min(1, Math.max(0, o));
}

/**
 * An option's card-level keys over the button template's: objects (variables,
 * zones, sounds) merge key by key, the option's rules follow the template's,
 * debug_zones is the option's when set.
 * @param {Record<string, any>} template - button_template (without id and tags)
 * @param {Record<string, any>} option - the option's own keys
 * @returns {Record<string, any>}
 */
export function optionCardKeys(template = {}, option = {}) {
    /** @type {Record<string, any>} */
    const out = {};
    for (const key of OPTION_CARD_KEYS) {
        const t = template[key], o = option[key];
        if (o === undefined) continue;
        if (key === 'rules') out.rules = [...(Array.isArray(t) ? t : []), ...(Array.isArray(o) ? o : [])];
        else if (key === 'debug_zones') out.debug_zones = o;
        else out[key] = t && typeof t === 'object' && o && typeof o === 'object' ? deepMergeImmutable(t, o) : o;
    }
    return out;
}
