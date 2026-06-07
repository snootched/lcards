/**
 * @fileoverview Pure CSS Grid parsing and 2D area manipulation utilities.
 *
 * No DOM, no Lit, no imports. All functions are pure — given the same input
 * they return the same output and produce no side effects. Safe to call from
 * any context including Web Workers or unit test environments.
 *
 * The internal representation for a grid is:
 *   columns: string[]   — one CSS track value per column, e.g. ["45px","1fr","auto"]
 *   rows:    string[]   — one CSS track value per row
 *   areas:   string[][] — 2D matrix [rowIndex][colIndex] = areaName | "."
 *   gap:     string     — e.g. "5px" (applied to both axes; split gap not modelled)
 */

/**
 * Gutter (in px) reserved at the top and left of the grid while the grid editor
 * is active, so the column/row headers have somewhere to live without covering
 * the first row / first column cells. Shared by the view (#grid-root padding)
 * and the overlay (#ghost-grid padding + HEADER_OVERLAP) so the editor chrome
 * stays aligned with the real cards. Keep these two in sync.
 */
export const GRID_EDIT_GUTTER = 28;

// ─────────────────────────────────────────────────────────────────────────────
// Track list parsing
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Split a CSS track list string into individual track values.
 * Bracket-depth-aware so clamp(...), minmax(...), calc(...) are kept intact.
 *
 * @param {string} str  e.g. "45px clamp(100px, 12vw, 180px) 1fr"
 * @returns {string[]}  e.g. ["45px", "clamp(100px, 12vw, 180px)", "1fr"]
 */
export function parseTrackList(str) {
    if (!str || typeof str !== 'string') return [];
    const tokens = [];
    let depth = 0;
    let current = '';
    for (let i = 0; i < str.length; i++) {
        const ch = str[i];
        if (ch === '(' ) { depth++; current += ch; }
        else if (ch === ')') { depth--; current += ch; }
        else if ((ch === ' ' || ch === '\t' || ch === '\n') && depth === 0) {
            const trimmed = current.trim();
            if (trimmed) tokens.push(trimmed);
            current = '';
        } else {
            current += ch;
        }
    }
    const last = current.trim();
    if (last) tokens.push(last);
    return tokens;
}

/**
 * Serialize a track array back to a CSS string.
 * @param {string[]} tracks
 * @returns {string}
 */
export function trackListToString(tracks) {
    return tracks.join(' ');
}

// ─────────────────────────────────────────────────────────────────────────────
// Track value parsing
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Parse a single CSS track value into a structured object.
 *
 * Returned types:
 *   { type: 'px',      value: number }
 *   { type: 'fr',      value: number }
 *   { type: 'percent', value: number }
 *   { type: 'vw',      value: number }
 *   { type: 'vh',      value: number }
 *   { type: 'em',      value: number }
 *   { type: 'rem',     value: number }
 *   { type: 'auto' }
 *   { type: 'minmax',  min: string, max: string }
 *   { type: 'clamp',   min: string, val: string, max: string }
 *   { type: 'calc',    expr: string }
 *   { type: 'other',   raw: string }
 *
 * @param {string} str
 * @returns {object}
 */
export function parseTrackValue(str) {
    if (!str) return { type: 'other', raw: '' };
    const s = str.trim();

    if (s === 'auto' || s === 'max-content' || s === 'min-content' || s === 'fit-content') {
        return { type: 'auto' };
    }

    // numeric + unit
    const numUnit = /^(-?[\d.]+)(px|fr|%|vw|vh|em|rem|ch|vmin|vmax)$/i.exec(s);
    if (numUnit) {
        const value = parseFloat(numUnit[1]);
        const unit  = numUnit[2].toLowerCase();
        const type  = unit === '%' ? 'percent' : unit;
        return { type, value };
    }

    // minmax(a, b)
    if (s.toLowerCase().startsWith('minmax(')) {
        const inner = s.slice(7, -1); // strip "minmax(" and ")"
        const args = splitCssArgs(inner);
        if (args.length === 2) return { type: 'minmax', min: args[0].trim(), max: args[1].trim() };
    }

    // clamp(min, val, max)
    if (s.toLowerCase().startsWith('clamp(')) {
        const inner = s.slice(6, -1);
        const args = splitCssArgs(inner);
        if (args.length === 3) return { type: 'clamp', min: args[0].trim(), val: args[1].trim(), max: args[2].trim() };
    }

    // calc(...)
    if (s.toLowerCase().startsWith('calc(')) {
        return { type: 'calc', expr: s.slice(5, -1).trim() };
    }

    return { type: 'other', raw: s };
}

/**
 * Serialize a parsed track value back to a CSS string.
 * @param {object} parsed
 * @returns {string}
 */
export function serializeTrackValue(parsed) {
    if (!parsed) return 'auto';
    switch (parsed.type) {
        case 'auto':    return 'auto';
        case 'fr':      return `${parsed.value}fr`;
        case 'px':      return `${parsed.value}px`;
        case 'percent': return `${parsed.value}%`;
        case 'vw':      return `${parsed.value}vw`;
        case 'vh':      return `${parsed.value}vh`;
        case 'em':      return `${parsed.value}em`;
        case 'rem':     return `${parsed.value}rem`;
        case 'minmax':  return `minmax(${parsed.min}, ${parsed.max})`;
        case 'clamp':   return `clamp(${parsed.min}, ${parsed.val}, ${parsed.max})`;
        case 'calc':    return `calc(${parsed.expr})`;
        case 'other':   return parsed.raw;
        default:        return String(parsed.raw ?? 'auto');
    }
}

/**
 * True if the track type supports proportional resize (drag handle is active).
 * clamp/minmax/calc/other tracks show a disabled handle.
 * @param {object} parsed
 * @returns {boolean}
 */
export function isResizableTrack(parsed) {
    return parsed.type === 'px' || parsed.type === 'fr';
}

// ─────────────────────────────────────────────────────────────────────────────
// fr unit resolution
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Compute the pixel size of 1fr given container dimensions and all tracks.
 * Fixed tracks (px, vw, % resolved against containerPx) consume space first;
 * the remainder is divided among fr units.
 *
 * @param {number}   containerPx  — available pixel width or height
 * @param {string[]} tracks       — full track array
 * @param {string}   gap          — gap value (e.g. "5px")
 * @returns {number}              — pixels per 1fr (0 if no fr tracks)
 */
export function computeFrPx(containerPx, tracks, gap) {
    const gapPx = parsePxValue(gap) ?? 0;
    const totalGap = gapPx * Math.max(0, tracks.length - 1);
    let available = containerPx - totalGap;
    let totalFr = 0;

    for (const t of tracks) {
        const parsed = parseTrackValue(t);
        switch (parsed.type) {
            case 'px':      available -= parsed.value; break;
            case 'fr':      totalFr   += parsed.value; break;
            case 'percent': available -= containerPx * parsed.value / 100; break;
            case 'vw':      available -= (typeof window !== 'undefined' ? window.innerWidth  : 1920) * parsed.value / 100; break;
            case 'vh':      available -= (typeof window !== 'undefined' ? window.innerHeight : 1080) * parsed.value / 100; break;
            // clamp/minmax/auto: treat as 0 consumed for fr resolution purposes
            default: break;
        }
    }

    if (totalFr === 0) return 0;
    return Math.max(0, available) / totalFr;
}

/**
 * Resize two adjacent tracks (index i and i+1) by a pixel delta.
 * Respects minimum track size of 20px.
 * Only works for px and fr track types; returns the original strings unchanged
 * for other types.
 *
 * @param {string[]} tracks
 * @param {number}   index        — the "left/top" track index (0-based)
 * @param {number}   deltaPx      — positive = grow left/top, shrink right/bottom
 * @param {number}   containerPx  — needed for fr conversion
 * @param {string}   gap
 * @returns {string[]}            — new tracks array (original is not mutated)
 */
export function resizeAdjacentTracks(tracks, index, deltaPx, containerPx, gap) {
    if (index < 0 || index >= tracks.length - 1) return tracks;
    const result = [...tracks];
    const aStr = result[index];
    const bStr = result[index + 1];
    const a = parseTrackValue(aStr);
    const b = parseTrackValue(bStr);

    if (!isResizableTrack(a) || !isResizableTrack(b)) return tracks;

    const frPx = computeFrPx(containerPx, tracks, gap);
    const MIN_PX = 20;

    // Convert both to px for the arithmetic
    const aPx = a.type === 'fr' ? a.value * frPx : a.value;
    const bPx = b.type === 'fr' ? b.value * frPx : b.value;

    const newAPx = Math.max(MIN_PX, aPx + deltaPx);
    const newBPx = Math.max(MIN_PX, bPx - deltaPx);

    // Convert back to original unit
    const toParsedPx = (px, parsed) => {
        if (parsed.type === 'fr') {
            return { ...parsed, value: frPx > 0 ? Math.round((px / frPx) * 100) / 100 : parsed.value };
        }
        return { ...parsed, value: Math.round(px) };
    };

    result[index]     = serializeTrackValue(toParsedPx(newAPx, a));
    result[index + 1] = serializeTrackValue(toParsedPx(newBPx, b));
    return result;
}

// ─────────────────────────────────────────────────────────────────────────────
// Areas string parsing
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Parse a CSS grid-template-areas string to a 2D array.
 * Handles both single-line ("a b" "c d") and multi-line template literal formats.
 * Rows with fewer tokens than max are padded with "." on the right.
 *
 * @param {string} str
 * @returns {string[][]}
 */
export function parseAreasString(str) {
    if (!str || typeof str !== 'string') return [];
    const rows = [];
    const re = /["']([^"']+)["']/g;
    let match;
    while ((match = re.exec(str)) !== null) {
        const tokens = match[1].trim().split(/\s+/).filter(Boolean);
        if (tokens.length > 0) rows.push(tokens);
    }
    if (rows.length === 0) return [];

    // Normalise all rows to the same width
    const maxCols = Math.max(...rows.map(r => r.length));
    return rows.map(r => {
        while (r.length < maxCols) r.push('.');
        return r;
    });
}

/**
 * Serialize a 2D areas array back to a CSS grid-template-areas string.
 * Each row is a quoted, space-joined string; rows are joined with '\n'.
 *
 * @param {string[][]} grid2d
 * @returns {string}
 */
export function areasToString(grid2d) {
    if (!grid2d || grid2d.length === 0) return '';
    return grid2d.map(row => `"${row.join(' ')}"`).join('\n');
}

/**
 * Return all unique non-"." area names in the grid.
 * @param {string[][]} grid2d
 * @returns {string[]}
 */
export function getAreaNames(grid2d) {
    const names = new Set();
    for (const row of grid2d) {
        for (const cell of row) {
            if (cell !== '.') names.add(cell);
        }
    }
    return [...names];
}

/**
 * Find the bounding box (min row, min col, max row+1, max col+1) of a named area.
 * Returns null if the area is not found.
 *
 * @param {string[][]} grid2d
 * @param {string}     name
 * @returns {{ r1: number, c1: number, r2: number, c2: number } | null}
 */
export function getAreaBounds(grid2d, name) {
    let r1 = Infinity, c1 = Infinity, r2 = -Infinity, c2 = -Infinity;
    for (let r = 0; r < grid2d.length; r++) {
        for (let c = 0; c < grid2d[r].length; c++) {
            if (grid2d[r][c] === name) {
                if (r < r1) r1 = r;
                if (c < c1) c1 = c;
                if (r + 1 > r2) r2 = r + 1;
                if (c + 1 > c2) c2 = c + 1;
            }
        }
    }
    if (r1 === Infinity) return null;
    return { r1, c1, r2, c2 };
}

/**
 * Write a name into every cell within the rectangular bounds (r1..r2-1, c1..c2-1).
 * Returns an error string if the rect overlaps an existing different-named area,
 * or the updated grid2d (new array, original not mutated) on success.
 *
 * @param {string[][]} grid2d
 * @param {{ r1: number, c1: number, r2: number, c2: number }} bounds
 * @param {string} name
 * @returns {{ ok: true, grid2d: string[][] } | { ok: false, error: string }}
 */
export function cellsToAreaName(grid2d, bounds, name) {
    const { r1, c1, r2, c2 } = bounds;
    // Check for overlap with a different area
    for (let r = r1; r < r2; r++) {
        for (let c = c1; c < c2; c++) {
            const existing = grid2d[r]?.[c];
            if (existing && existing !== '.' && existing !== name) {
                return { ok: false, error: `Overlaps existing area "${existing}"` };
            }
        }
    }
    const result = grid2d.map(row => [...row]);
    for (let r = r1; r < r2; r++) {
        for (let c = c1; c < c2; c++) {
            result[r][c] = name;
        }
    }
    return { ok: true, grid2d: result };
}

/**
 * Remove a named area by replacing all its cells with ".".
 * @param {string[][]} grid2d
 * @param {string}     name
 * @returns {string[][]}
 */
export function removeArea(grid2d, name) {
    return grid2d.map(row => row.map(cell => cell === name ? '.' : cell));
}

/**
 * Rename an area.
 * @param {string[][]} grid2d
 * @param {string}     oldName
 * @param {string}     newName
 * @returns {string[][]}
 */
export function renameArea(grid2d, oldName, newName) {
    return grid2d.map(row => row.map(cell => cell === oldName ? newName : cell));
}

// ─────────────────────────────────────────────────────────────────────────────
// Per-area settings map (layout.areas) — pure helpers
//
// `areasMap` is an object keyed by area name: { header: {...}, main: {...} }.
// These keep the map in sync as areas are renamed, deleted, or removed by track
// edits. All return a new object; the input is never mutated.
// ─────────────────────────────────────────────────────────────────────────────

/** Move settings from oldName → newName (no-op if oldName absent). */
export function renameAreaSettings(areasMap, oldName, newName) {
    if (!areasMap || !(oldName in areasMap) || oldName === newName) return { ...(areasMap ?? {}) };
    const { [oldName]: moved, ...rest } = areasMap;
    return { ...rest, [newName]: moved };
}

/** Remove settings for a single area. */
export function removeAreaSettings(areasMap, name) {
    if (!areasMap || !(name in areasMap)) return { ...(areasMap ?? {}) };
    const { [name]: _removed, ...rest } = areasMap;
    return rest;
}

/** Drop any settings whose area name is no longer present in validNames. */
export function pruneAreaSettings(areasMap, validNames) {
    if (!areasMap) return {};
    const valid = new Set(validNames);
    const out = {};
    for (const [name, settings] of Object.entries(areasMap)) {
        if (valid.has(name)) out[name] = settings;
    }
    return out;
}

// ─────────────────────────────────────────────────────────────────────────────
// Track removal (with area cascade)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Remove a column or row track and cascade area adjustments.
 *
 * For each named area that spanned the removed track:
 *   - If the area's span in that axis was exactly 1 → area is removed (cells → ".")
 *   - If span > 1 → the cells in the removed track are replaced with "." and the
 *     area continues to exist on the remaining cells
 *
 * @param {string[][]} grid2d
 * @param {string[]}   columns
 * @param {string[]}   rows
 * @param {'col'|'row'} axis
 * @param {number}     index   — 0-based index of the track to remove
 * @returns {{ grid2d: string[][], columns: string[], rows: string[], removedAreas: string[] }}
 */
export function removeTrack(grid2d, columns, rows, axis, index) {
    let result = grid2d.map(row => [...row]);
    const removedAreas = [];

    if (axis === 'col') {
        if (index < 0 || index >= columns.length) return { grid2d, columns, rows, removedAreas };
        // Find areas that span this column
        const affectedAreas = new Set();
        for (let r = 0; r < result.length; r++) {
            const cell = result[r][index];
            if (cell !== '.') affectedAreas.add(cell);
        }
        for (const name of affectedAreas) {
            const bounds = getAreaBounds(result, name);
            if (!bounds) continue;
            const spanCols = bounds.c2 - bounds.c1;
            if (spanCols === 1) {
                // Collapse — remove the area
                result = removeArea(result, name);
                removedAreas.push(name);
            }
            // else span > 1: removing this column just shrinks the area naturally
            // (the cell at [r][index] will be removed when we splice the column below)
        }
        // Splice the column out of every row
        result = result.map(row => { const r = [...row]; r.splice(index, 1); return r; });
        const newCols = [...columns];
        newCols.splice(index, 1);
        return { grid2d: result, columns: newCols, rows, removedAreas };
    } else {
        if (index < 0 || index >= rows.length) return { grid2d, columns, rows, removedAreas };
        const affectedAreas = new Set();
        for (let c = 0; c < (result[index]?.length ?? 0); c++) {
            const cell = result[index][c];
            if (cell !== '.') affectedAreas.add(cell);
        }
        for (const name of affectedAreas) {
            const bounds = getAreaBounds(result, name);
            if (!bounds) continue;
            const spanRows = bounds.r2 - bounds.r1;
            if (spanRows === 1) {
                result = removeArea(result, name);
                removedAreas.push(name);
            }
        }
        result.splice(index, 1);
        const newRows = [...rows];
        newRows.splice(index, 1);
        return { grid2d: result, columns, rows: newRows, removedAreas };
    }
}

/**
 * Insert a new track at the given index, shifting existing tracks right/down.
 * New cells in the inserted track are ".".
 *
 * @param {string[][]} grid2d
 * @param {string[]}   columns
 * @param {string[]}   rows
 * @param {'col'|'row'} axis
 * @param {number}     index   — insert BEFORE this index (use columns.length to append)
 * @param {string}     size    — CSS track size for the new track, e.g. "1fr"
 * @returns {{ grid2d: string[][], columns: string[], rows: string[] }}
 */
export function insertTrack(grid2d, columns, rows, axis, index, size = '1fr') {
    if (axis === 'col') {
        const newGrid = grid2d.map(row => {
            const r = [...row];
            r.splice(index, 0, '.');
            return r;
        });
        const newCols = [...columns];
        newCols.splice(index, 0, size);
        return { grid2d: newGrid, columns: newCols, rows };
    } else {
        const numCols = columns.length;
        const newRow = Array(numCols).fill('.');
        const newGrid = [...grid2d];
        newGrid.splice(index, 0, newRow);
        const newRows = [...rows];
        newRows.splice(index, 0, size);
        return { grid2d: newGrid, columns, rows: newRows };
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// Track reordering
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Reorder a track from fromIndex to toIndex.
 * Safe only when no named area spans across the range [min(from,to), max(from,to)]
 * in a non-contiguous way (i.e. bridges the moved track from outside).
 *
 * The 2D area matrix is updated by swapping the corresponding column/row in every
 * row of the matrix — no span math needed since we use a cell matrix representation.
 *
 * @param {string[][]} grid2d
 * @param {string[]}   tracks       — columns or rows
 * @param {'col'|'row'} axis
 * @param {number}     fromIndex
 * @param {number}     toIndex
 * @returns {{ safe: boolean, blockedBy?: string, grid2d: string[][], tracks: string[] }}
 */
export function reorderTrack(grid2d, tracks, axis, fromIndex, toIndex) {
    if (fromIndex === toIndex) return { safe: true, grid2d, tracks };

    // Simulate the reorder on the area matrix first
    let newGrid;
    if (axis === 'col') {
        newGrid = grid2d.map(row => {
            const r = [...row];
            const [cell] = r.splice(fromIndex, 1);
            r.splice(toIndex, 0, cell);
            return r;
        });
    } else {
        newGrid = [...grid2d.map(r => [...r])];
        const [row] = newGrid.splice(fromIndex, 1);
        newGrid.splice(toIndex, 0, row);
    }

    // Validate: every named area in the result must still be rectangular.
    // A non-rectangular area would produce invalid CSS grid-template-areas.
    for (const name of getAreaNames(newGrid)) {
        const bounds = getAreaBounds(newGrid, name);
        if (!bounds) continue;
        for (let r = bounds.r1; r < bounds.r2; r++) {
            for (let c = bounds.c1; c < bounds.c2; c++) {
                if (newGrid[r]?.[c] !== name) {
                    return { safe: false, blockedBy: name, grid2d, tracks: [...tracks] };
                }
            }
        }
    }

    const newTracks = [...tracks];
    const [moved] = newTracks.splice(fromIndex, 1);
    newTracks.splice(toIndex, 0, moved);

    return { safe: true, grid2d: newGrid, tracks: newTracks };
}

// ─────────────────────────────────────────────────────────────────────────────
// Config serialization helpers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Parse a config layout object into the internal working representation.
 * Reads standard CSS Grid property names as used by custom:grid-layout
 * (lovelace-layout-card), providing full schema compatibility.
 *
 * Accepted layout property names:
 *   grid-template-columns, grid-template-rows, grid-template-areas
 *   grid-gap or gap (either accepted)
 *
 * Defaults when properties are absent:
 *   columns: ["1fr", "1fr", "1fr"]  — 3 equal columns
 *   rows:    ["1fr", "1fr", "1fr"]  — 3 equal rows
 *   areas:   all "."                — empty canvas, no named areas
 *   gap:     "5px"
 *
 * @param {object} layout  — from config.layout (may be undefined/null)
 * @returns {{ columns: string[], rows: string[], areas: string[][], gap: string }}
 */
export function parseLayoutConfig(layout) {
    // Accept both grid-gap and gap (custom-layout uses grid-gap; CSS standard is gap)
    const gap = layout?.['grid-gap'] ?? layout?.gap ?? '5px';

    const columns = layout?.['grid-template-columns']
        ? parseTrackList(layout['grid-template-columns'])
        : ['1fr', '1fr', '1fr'];

    const rows = layout?.['grid-template-rows']
        ? parseTrackList(layout['grid-template-rows'])
        : ['1fr', '1fr', '1fr'];

    // If areas not provided, default to all-empty grid (no named areas)
    const rawAreas = layout?.['grid-template-areas']
        ? parseAreasString(layout['grid-template-areas'])
        : [];

    const numCols = columns.length;
    const numRows = rows.length;

    const areas = Array(numRows).fill(null).map((_, r) => {
        const row = rawAreas[r] ?? [];
        const padded = [...row];
        while (padded.length < numCols) padded.push('.');
        return padded.slice(0, numCols);
    });

    return { columns, rows, areas, gap };
}

/**
 * Serialize the internal working representation back to a config layout object.
 * Uses standard CSS Grid property names for custom-layout-card compatibility.
 * Preserves all other layout properties (margin, padding, card_margin, mediaquery, etc.)
 *
 * @param {string[]} columns
 * @param {string[]} rows
 * @param {string[][]} areas
 * @param {string} gap
 * @param {object} [existingLayout={}] — preserved as-is (margin, padding, card_margin, etc.)
 * @returns {object}
 */
export function serializeLayoutConfig(columns, rows, areas, gap, existingLayout = {}) {
    // Strip old schema keys (columns/rows/areas/gap) that may be present from previous
    // versions of this component, keeping only the standard CSS property names.
    const {
        columns: _c, rows: _r, areas: _a, gap: _g,
        ...rest
    } = existingLayout;
    return {
        ...rest,
        'grid-template-columns': trackListToString(columns),
        'grid-template-rows':    trackListToString(rows),
        'grid-template-areas':   areasToString(areas),
        'grid-gap':              gap,
    };
}

// ─────────────────────────────────────────────────────────────────────────────
// Internal helpers
// ─────────────────────────────────────────────────────────────────────────────

/** Split comma-separated CSS function arguments, respecting bracket depth. */
function splitCssArgs(str) {
    const args = [];
    let depth = 0;
    let current = '';
    for (const ch of str) {
        if (ch === '(') { depth++; current += ch; }
        else if (ch === ')') { depth--; current += ch; }
        else if (ch === ',' && depth === 0) { args.push(current); current = ''; }
        else { current += ch; }
    }
    if (current.trim()) args.push(current);
    return args;
}

/** Parse a CSS value that is expected to be px (e.g. "5px" → 5, "0" → 0). */
function parsePxValue(str) {
    if (!str) return 0;
    const n = parseFloat(str);
    return isNaN(n) ? 0 : n;
}
