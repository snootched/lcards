/**
 * Data grid model: the pure parts of lcards-data-grid (grid tracks, rows and
 * cells, decorative data, style layering, cascade timing). No DOM, no hass and
 * no imports, so the card, the studio, node:test suites and the docs demo all
 * run the same code.
 *
 * @module data-grid/data-grid-model
 */

/** Bare entity id, e.g. `sensor.cpu_temp`. */
export const ENTITY_ID = /^[a-z_]+\.[a-z0-9_]+$/;

/** Default typography (matches the CB-LCARS grid). */
export const GRID_FONT_DEFAULTS = {
  font_size: 24,
  font_family: "'Antonio', 'Helvetica Neue', sans-serif",
  font_weight: 400
};

/**
 * Same test as TemplateDetector.hasTemplates(): any `{` (tokens, datasources,
 * Jinja2) or `[[[` (JavaScript). Mirrored here to keep this module import-free.
 * @param {string} text
 * @returns {boolean}
 */
export function hasTemplateSyntax(text) {
  return typeof text === 'string' && (text.includes('{') || text.includes('[[['));
}

const isObject = (v) => !!v && typeof v === 'object' && !Array.isArray(v);

// ============================================================================
// GRID TRACKS
// ============================================================================

/**
 * Split a CSS track list on top-level whitespace, keeping functions whole.
 * `minmax(60px, 1fr) repeat(4, 2fr)` -> ['minmax(60px, 1fr)', 'repeat(4, 2fr)']
 * @param {string} template
 * @returns {string[]}
 */
export function splitTrackList(template) {
  const parts = [];
  let depth = 0;
  let current = '';
  for (const ch of String(template ?? '').trim()) {
    if (ch === '(') depth++;
    if (ch === ')') depth--;
    if (/\s/.test(ch) && depth === 0) {
      if (current) parts.push(current);
      current = '';
    } else {
      current += ch;
    }
  }
  if (current) parts.push(current);
  return parts;
}

/**
 * Expand a track list into one entry per track (`repeat()` unrolled).
 * Returns null when the count is not fixed (`repeat(auto-fill, ...)`).
 * @param {string} template
 * @returns {string[]|null}
 */
export function expandTracks(template) {
  const tracks = [];
  for (const part of splitTrackList(template)) {
    const m = /^repeat\(\s*([^,]+),(.*)\)$/s.exec(part);
    if (!m) {
      tracks.push(part);
      continue;
    }
    const n = Number(m[1].trim());
    if (!Number.isInteger(n) || n < 1) return null;
    const inner = splitTrackList(m[2]);
    for (let i = 0; i < n; i++) tracks.push(...inner);
  }
  return tracks;
}

/**
 * Number of tracks in a template, or null when unknown/empty.
 * @param {string} template
 * @returns {number|null}
 */
export function countTracks(template) {
  if (!template) return null;
  const tracks = expandTracks(template);
  return tracks && tracks.length ? tracks.length : null;
}

/**
 * Join tracks back into a template; identical tracks collapse to `repeat()`.
 * @param {string[]} tracks
 * @returns {string}
 */
export function joinTracks(tracks) {
  if (tracks.length > 1 && tracks.every(t => t === tracks[0])) {
    return `repeat(${tracks.length}, ${tracks[0]})`;
  }
  return tracks.join(' ');
}

// ============================================================================
// ROWS AND CELLS
// ============================================================================

/**
 * Normalise rows to `{ values, style, header }` (compact array rows included).
 * Rows that are neither form become empty rows.
 * @param {Array} rows
 * @returns {Array<{values: Array, style: Object|undefined, header: boolean}>}
 */
export function normalizeRows(rows) {
  if (!Array.isArray(rows)) return [];
  return rows.map(row => {
    if (Array.isArray(row)) return { values: row, style: undefined, header: false };
    if (isObject(row) && Array.isArray(row.values)) {
      return { values: row.values, style: isObject(row.style) ? row.style : undefined, header: row.header === true };
    }
    return { values: [], style: undefined, header: false };
  });
}

/**
 * Work out what a cell shows and which entity gives it context.
 *
 * - `{ entity, attribute? }` without `value`: that entity's state (or attribute)
 * - a bare entity id: that entity's state
 * - text containing template syntax: a template (`entity`, if set, is only context)
 * - anything else: static text
 *
 * @param {*} cell - string | number | cell object
 * @returns {{ kind: 'static'|'entity'|'template', text: string, entity?: string, attribute?: string }}
 */
export function classifyCell(cell) {
  const obj = isObject(cell) ? cell : null;
  const raw = obj ? obj.value : cell;
  const entity = obj && typeof obj.entity === 'string' && obj.entity ? obj.entity : undefined;
  const attribute = obj && typeof obj.attribute === 'string' && obj.attribute ? obj.attribute : undefined;

  if (raw === undefined || raw === null || raw === '') {
    if (entity) return { kind: 'entity', text: '', entity, attribute };
    return { kind: 'static', text: '' };
  }
  const text = String(raw);
  if (hasTemplateSyntax(text)) return { kind: 'template', text, entity, attribute };
  if (ENTITY_ID.test(text)) return { kind: 'entity', text, entity: text, attribute };
  return { kind: 'static', text, entity };
}

/**
 * Number of columns the data rows need (the longest row).
 * @param {Array} rows
 * @returns {number}
 */
export function dataColumnCount(rows) {
  return normalizeRows(rows).reduce((max, r) => Math.max(max, r.values.length), 0);
}

// ============================================================================
// DECORATIVE DATA
// ============================================================================

const ALPHA = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

/** @type {Record<string, (rng: () => number) => string>} */
const GENERATORS = {
  digit: (rng) => Math.floor(rng() * 10000).toString().padStart(4, '0'),
  float: (rng) => (rng() * 100).toFixed(2),
  alpha: (rng) => ALPHA.charAt(Math.floor(rng() * 26)) + ALPHA.charAt(Math.floor(rng() * 26)),
  hex: (rng) => Math.floor(rng() * 65535).toString(16).toUpperCase().padStart(4, '0')
};
const MIXED = ['digit', 'float', 'alpha', 'hex'];

/** Formats the decorative generator understands. */
export const DECORATIVE_FORMATS = [...MIXED, 'mixed'];

/**
 * One decorative value.
 * @param {string} format - digit | float | alpha | hex | mixed
 * @param {() => number} [rng=Math.random]
 * @returns {string}
 */
export function decorativeValue(format, rng = Math.random) {
  const gen = GENERATORS[format] || GENERATORS[MIXED[Math.floor(rng() * MIXED.length)]];
  return gen(rng);
}

/**
 * A rows x cols grid of decorative values.
 * @param {number} rows
 * @param {number} cols
 * @param {{ format?: string, columnFormats?: Array<string|undefined>, rng?: () => number }} [opts]
 * @returns {string[][]}
 */
export function generateDecorativeGrid(rows, cols, { format = 'mixed', columnFormats = [], rng = Math.random } = {}) {
  return Array.from({ length: rows }, () =>
    Array.from({ length: cols }, (_, c) => decorativeValue(columnFormats[c] || format, rng))
  );
}

/**
 * Regenerate a fraction of the cells (all of them when fraction >= 1).
 * Returns a new grid; the input is not mutated.
 * @param {string[][]} grid
 * @param {number} fraction - 0..1
 * @param {{ format?: string, columnFormats?: Array<string|undefined>, rng?: () => number }} [opts]
 * @returns {string[][]}
 */
export function refreshDecorativeCells(grid, fraction, { format = 'mixed', columnFormats = [], rng = Math.random } = {}) {
  const rows = grid.length;
  const cols = grid[0]?.length || 0;
  if (!(fraction < 1)) return generateDecorativeGrid(rows, cols, { format, columnFormats, rng });

  const next = grid.map(row => row.slice());
  const total = rows * cols;
  const count = Math.max(1, Math.round(total * Math.max(0, fraction)));
  // Partial Fisher-Yates over cell indices: `count` distinct cells.
  const indices = Array.from({ length: total }, (_, i) => i);
  for (let i = 0; i < count; i++) {
    const j = i + Math.floor(rng() * (total - i));
    [indices[i], indices[j]] = [indices[j], indices[i]];
    const r = Math.floor(indices[i] / cols);
    const c = indices[i] % cols;
    next[r][c] = decorativeValue(columnFormats[c] || format, rng);
  }
  return next;
}

// ============================================================================
// STYLES
// ============================================================================

/**
 * Shallow-merge style layers in order (later wins); null/undefined layers skipped.
 * @param {...(Object|undefined|null)} layers
 * @returns {Object}
 */
export function mergeStyleLayers(...layers) {
  return Object.assign({}, ...layers.filter(isObject));
}

/**
 * Theme defaults for every cell (typography lives on the grid container).
 * @param {(path: string) => *} [getToken] - theme token lookup (undefined when missing)
 * @returns {Object}
 */
export function defaultCellStyle(getToken = () => undefined) {
  const t = (path, fallback) => getToken(path) ?? fallback;
  return {
    color: t('colors.grid.cellText', t('colors.text.primary', '#99ccff')),
    background: t('colors.grid.cellBackground', 'transparent'),
    align: 'right',
    padding: '4px'
  };
}

/**
 * Theme defaults for header rows (applied before `header_style`).
 * @param {(path: string) => *} [getToken]
 * @returns {Object}
 */
export function defaultHeaderStyle(getToken = () => undefined) {
  const t = (path, fallback) => getToken(path) ?? fallback;
  return {
    background: t('colors.grid.headerBackground', t('colors.background.header', '#1a1a1a')),
    color: t('colors.grid.headerText', t('colors.text.header', '#def')),
    font_size: 16,
    font_weight: 700,
    text_transform: 'uppercase',
    padding: '12px 8px',
    border_bottom_width: 2,
    border_bottom_color: t('colors.grid.divider', t('colors.divider', '#333')),
    border_bottom_style: 'solid'
  };
}

const UNITLESS = new Set([
  'opacity', 'font_weight', 'fontWeight', 'z_index', 'zIndex',
  'flex_grow', 'flexGrow', 'flex_shrink', 'flexShrink', 'line_height', 'lineHeight'
]);
const ALIGN = { left: 'flex-start', center: 'center', right: 'flex-end' };
const px = (v) => (typeof v === 'number' ? `${v}px` : v);

/**
 * Convert a style object (snake_case keys) to an inline CSS string.
 *
 * - `align` maps to justify-content (left/center/right)
 * - numbers get `px` except unitless properties
 * - `padding` may be `{ top, right, bottom, left }` (the studio's padding editor)
 * - object values (unresolved state maps) and numeric `width` are skipped
 *
 * @param {Object} style
 * @param {{ exclude?: string[] }} [options] - keys to leave out (e.g. color during a cascade)
 * @returns {string}
 */
export function styleToCSS(style, { exclude = [] } = {}) {
  if (!isObject(style)) return '';
  const out = [];
  for (const [key, value] of Object.entries(style)) {
    if (value === null || value === undefined || value === '' || exclude.includes(key)) continue;
    if (key === 'width' && typeof value === 'number') continue;

    if (key === 'padding' && isObject(value)) {
      const { top = 0, right = 0, bottom = 0, left = 0 } = value;
      out.push(`padding: ${px(top)} ${px(right)} ${px(bottom)} ${px(left)}`);
      continue;
    }
    if (isObject(value) || Array.isArray(value)) continue;

    if (key === 'align') {
      out.push(`justify-content: ${ALIGN[value] || value}`);
      continue;
    }
    const prop = key.replace(/_/g, '-');
    out.push(`${prop}: ${typeof value === 'number' && !UNITLESS.has(key) ? `${value}px` : value}`);
  }
  return out.join('; ');
}

const GRID_KEYS = [
  'grid-template-columns', 'grid-template-rows', 'grid-template-areas',
  'grid-template', 'grid-auto-columns', 'grid-auto-rows', 'grid-auto-flow',
  'gap', 'row-gap', 'column-gap', 'grid-gap', 'grid-row-gap', 'grid-column-gap',
  'justify-items', 'align-items', 'place-items',
  'justify-content', 'align-content', 'place-content'
];
const GRID_TEXT_KEYS = ['text_transform', 'letter_spacing', 'line_height', 'white_space', 'align_items', 'justify_content'];

/**
 * Inline CSS for the grid container: CSS Grid keys plus grid-wide typography.
 * @param {Object} grid - config.grid
 * @param {number} cols - column count used when no grid-template-columns is set
 * @param {Object} style - config.style (grid-wide)
 * @returns {string}
 */
export function gridContainerStyle(grid = {}, cols = 12, style = {}) {
  const parts = [];
  for (const key of GRID_KEYS) {
    const value = grid?.[key];
    if (value === undefined || value === null || value === '') continue;
    parts.push(`${key}: ${key.includes('gap') ? px(value) : value}`);
  }
  if (!grid?.['grid-template-columns']) parts.push(`grid-template-columns: repeat(${Math.max(1, cols)}, 1fr)`);
  if (!['gap', 'row-gap', 'column-gap', 'grid-gap'].some(k => grid?.[k] !== undefined && grid?.[k] !== '')) {
    parts.push('gap: 8px');
  }

  const s = style || {};
  parts.push(`font-family: ${s.font_family || GRID_FONT_DEFAULTS.font_family}`);
  parts.push(`font-size: ${px(s.font_size || GRID_FONT_DEFAULTS.font_size)}`);
  parts.push(`font-weight: ${s.font_weight || GRID_FONT_DEFAULTS.font_weight}`);
  for (const key of GRID_TEXT_KEYS) {
    if (s[key] === undefined || s[key] === '') continue;
    parts.push(`${key.replace(/_/g, '-')}: ${UNITLESS.has(key) ? s[key] : px(s[key])}`);
  }
  return parts.join('; ');
}

/**
 * First pixel value in a CSS length (`'8px'` -> 8, `12` -> 12); null otherwise.
 * @param {*} value
 * @returns {number|null}
 */
export function toPx(value) {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  const m = /^\s*(-?\d+(?:\.\d+)?)(px)?\s*(?:\s|$)/.exec(String(value ?? ''));
  return m ? Number(m[1]) : null;
}

// ============================================================================
// CASCADE TIMING
// ============================================================================

/** CB-LCARS cascade timings: one entry per row, repeating. Delays in seconds. */
export const CASCADE_PATTERNS = {
  default: [
    { duration: 3000, delay: 0.1 },
    { duration: 3000, delay: 0.2 },
    { duration: 4000, delay: 0.3 },
    { duration: 4000, delay: 0.4 },
    { duration: 4000, delay: 0.5 },
    { duration: 2000, delay: 0.6 },
    { duration: 2000, delay: 0.7 },
    { duration: 2000, delay: 0.8 }
  ],
  niagara: Array.from({ length: 8 }, (_, i) => ({ duration: 2000, delay: (i + 1) * 0.1 })),
  fast: Array.from({ length: 8 }, (_, i) => ({ duration: 1000, delay: i * 0.05 }))
};

/**
 * Per-row cascade timing from cascade-color params.
 * Precedence for duration: `duration` override > `speed_multiplier` > pattern.
 * `pattern: custom` reads `params.timing` (falls back to default when empty).
 *
 * @param {Object} params - cascade-color params
 * @param {number} numRows
 * @returns {Array<{ duration: number, delay: number }>} delay in ms
 */
export function buildCascadeRowTimings(params = {}, numRows = 0) {
  const custom = Array.isArray(params.timing) && params.timing.length ? params.timing : null;
  const pattern = params.pattern === 'custom'
    ? (custom || CASCADE_PATTERNS.default)
    : (CASCADE_PATTERNS[params.pattern] || CASCADE_PATTERNS.default);
  const speed = Number(params.speed_multiplier) > 0 ? Number(params.speed_multiplier) : 1;

  return Array.from({ length: numRows }, (_, row) => {
    const t = pattern[row % pattern.length] || {};
    const base = Number(t.duration) || 3000;
    const duration = params.duration !== undefined ? Number(params.duration) : base / speed;
    return { duration, delay: (Number(t.delay) || 0) * 1000 };
  });
}

/**
 * Cascade colours as [start, text, end] from the array or `{ start, text, end }` form.
 * Missing entries stay undefined (the card fills theme defaults).
 * @param {Array|Object|undefined} colors
 * @returns {Array<string|undefined>}
 */
export function cascadeColorList(colors) {
  if (Array.isArray(colors)) return [colors[0], colors[1], colors[2]];
  if (isObject(colors)) return [colors.start, colors.text, colors.end];
  return [undefined, undefined, undefined];
}
