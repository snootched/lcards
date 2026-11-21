/**
 * Data grid config migration: rewrites legacy lcards-data-grid configs into
 * the canonical shape. Pure and idempotent (canonical input is returned
 * unchanged, same object, with `changed: false`). No imports, so node:test
 * suites and the docs demo can load it directly.
 *
 * Canonical shape (only the keys this module touches):
 *   data_mode: decorative | data
 *   grid: { grid-template-rows, grid-template-columns, gap, ... }   (CSS Grid keys only)
 *   style: { font_size, font_family, font_weight, align, ... }
 *   rows: [ [cell, ...] | { values: [cell, ...], style?, header? } ]
 *     cell: string | number | { value?, entity?, attribute?, style?, tap_action?, ... }
 *   animations: [ { preset: cascade-color, params: { pattern, timing, ... } } ]
 *   highlight_changes: true | { preset, duration, ease, params, max_cells }
 *
 * Used by the card at config time (in memory, never written back) and by the
 * editor/studio when they open a card (persisted when the user saves).
 *
 * @module data-grid/data-grid-config-migration
 */

const LEGACY_MODES = { random: 'decorative', template: 'data', datasource: 'data' };
const LEGACY_ROOT_STYLE = ['font_size', 'font_family', 'font_weight', 'align'];
const LEGACY_GRID = ['rows', 'columns', 'cell_width'];
const CASCADE_KEYS = ['pattern', 'colors', 'speed_multiplier', 'duration', 'ease', 'easing', 'timing'];
const HIGHLIGHT_KEYS = {
  change_preset: 'preset',
  change_duration: 'duration',
  change_easing: 'ease',
  change_params: 'params',
  max_highlight_cells: 'max_cells'
};

const clone = (value) => JSON.parse(JSON.stringify(value));
const isObject = (v) => !!v && typeof v === 'object' && !Array.isArray(v);

/**
 * Whether the config is already canonical (fast path, keeps identity).
 * @param {Object} config
 * @returns {boolean}
 */
function isCanonical(config) {
  if ('animation' in config) return false;
  if (config.data_mode in LEGACY_MODES) return false;
  if (LEGACY_ROOT_STYLE.some(k => k in config)) return false;
  if (isObject(config.grid) && LEGACY_GRID.some(k => k in config.grid)) return false;
  if (Array.isArray(config.rows) && config.rows.some(r => isObject(r) && ('cellStyles' in r || 'sources' in r))) return false;
  return true;
}

/**
 * Migrate a data grid config to the canonical shape.
 *
 * @param {Object} config - Card config (not mutated)
 * @returns {{ config: Object, changed: boolean, notes: string[] }}
 */
export function migrateDataGridConfig(config) {
  if (!config || typeof config !== 'object' || isCanonical(config)) {
    return { config, changed: false, notes: [] };
  }

  const out = clone(config);
  const notes = [];

  // ── data_mode ────────────────────────────────────────────────────────────
  if (out.data_mode in LEGACY_MODES) {
    notes.push(`data_mode: ${out.data_mode} is now ${LEGACY_MODES[out.data_mode]}`);
    out.data_mode = LEGACY_MODES[out.data_mode];
  }

  // ── grid shorthand (rows / columns / cell_width) ─────────────────────────
  // Explicit grid-template-* keys win; the shorthand only fills what is missing.
  if (isObject(out.grid) && LEGACY_GRID.some(k => k in out.grid)) {
    const grid = out.grid;
    const rows = Number(grid.rows);
    const columns = Number(grid.columns);
    const cellWidth = grid.cell_width;
    if (!grid['grid-template-rows'] && rows > 0) {
      grid['grid-template-rows'] = `repeat(${rows}, auto)`;
    }
    if (!grid['grid-template-columns'] && (columns > 0 || cellWidth !== undefined)) {
      const width = cellWidth === undefined || cellWidth === 'auto' ? '1fr'
        : (typeof cellWidth === 'number' ? `${cellWidth}px` : String(cellWidth));
      grid['grid-template-columns'] = `repeat(${columns > 0 ? columns : 12}, ${width})`;
    }
    for (const k of LEGACY_GRID) delete grid[k];
    notes.push('grid rows/columns/cell_width moved to grid-template-rows/grid-template-columns');
  }

  // ── top-level typography / align ─────────────────────────────────────────
  const rootStyle = LEGACY_ROOT_STYLE.filter(k => k in out);
  if (rootStyle.length) {
    const style = isObject(out.style) ? out.style : {};
    for (const k of rootStyle) {
      if (style[k] === undefined) style[k] = out[k];
      delete out[k];
    }
    out.style = style;
    notes.push(`${rootStyle.join(', ')} moved into style`);
  }

  // ── singular animation: block ────────────────────────────────────────────
  if ('animation' in out) {
    const legacy = isObject(out.animation) ? out.animation : {};
    delete out.animation;
    const animations = Array.isArray(out.animations) ? out.animations : [];
    let cascade = animations.find(a => a?.preset === 'cascade-color');

    if (legacy.type === 'cascade' && !cascade) {
      cascade = { trigger: 'on_load', preset: 'cascade-color' };
      const params = {};
      for (const k of CASCADE_KEYS) {
        if (legacy[k] !== undefined) params[k === 'easing' ? 'ease' : k] = legacy[k];
      }
      if (Object.keys(params).length) cascade.params = params;
      animations.push(cascade);
      out.animations = animations;
      notes.push('animation.type: cascade moved to animations (cascade-color)');
    } else if (Array.isArray(legacy.timing)) {
      if (cascade) {
        cascade.params = isObject(cascade.params) ? cascade.params : {};
        if (cascade.params.timing === undefined) cascade.params.timing = legacy.timing;
        notes.push('animation.timing moved to the cascade-color params');
      } else {
        notes.push('animation.timing dropped: there is no cascade-color animation');
      }
    }

    if (legacy.highlight_changes) {
      const highlight = {};
      for (const [from, to] of Object.entries(HIGHLIGHT_KEYS)) {
        if (legacy[from] !== undefined) highlight[to] = legacy[from];
      }
      if (out.highlight_changes === undefined) {
        out.highlight_changes = Object.keys(highlight).length ? highlight : true;
      }
      notes.push('animation.highlight_changes moved to highlight_changes');
    }
  }

  // ── rows: cellStyles -> cell objects; drop dead sources ──────────────────
  if (Array.isArray(out.rows)) {
    let movedStyles = false;
    let droppedSources = false;
    out.rows = out.rows.map(row => {
      if (!isObject(row)) return row;
      if ('sources' in row) {
        delete row.sources;
        droppedSources = true;
      }
      if ('cellStyles' in row) {
        const styles = Array.isArray(row.cellStyles) ? row.cellStyles : [];
        const values = Array.isArray(row.values) ? row.values : [];
        row.values = values.map((cell, i) => {
          const style = styles[i];
          if (!isObject(style) || !Object.keys(style).length) return cell;
          movedStyles = true;
          return isObject(cell) ? { ...cell, style: { ...style, ...(cell.style || {}) } } : { value: cell, style };
        });
        delete row.cellStyles;
      }
      return row;
    });
    if (movedStyles) notes.push('rows cellStyles moved onto each cell ({ value, style })');
    if (droppedSources) notes.push('rows sources dropped (an old format the card no longer reads)');
  }

  return { config: out, changed: true, notes };
}
