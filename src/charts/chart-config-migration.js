/**
 * Chart config migration: rewrites legacy lcards-chart configs into the
 * canonical `sources[]` series format. Pure and idempotent (canonical input is
 * returned unchanged with `changed: false`). No imports, so node:test suites
 * can load it directly.
 *
 * Canonical series (each `sources[]` item):
 *   { entity, attribute?, statistics?, group_by?, ...display }
 *   { datasource, buffer?, group_by?, ...display }
 * where display = name, unit, float_precision, type, curve, stroke_width,
 * stroke_dash, color, opacity, yaxis_id.
 *
 * Used by the card at render time (in memory, never written back) and by the
 * editor when it opens a card (persisted when the user saves).
 *
 * @module charts/chart-config-migration
 */

const ENTITY_ID = /^[a-z_]+\.[a-z0-9_]+$/;
/** Names the old series editor generated; they belong to the card alone. */
const EDITOR_SERIES = /^series_\d+$/;
const EDITOR_PLACEHOLDER = /^series_\d+_placeholder$/;
/** DataSource keys a `series_N` may carry and still be inlined into the series. */
const INLINE_KEYS = new Set(['entity', 'attribute', 'history', 'name', 'type', 'yaxis']);

const clone = (value) => JSON.parse(JSON.stringify(value));

/**
 * @param {string|null|undefined} attribute
 * @returns {string|undefined}
 */
function cleanAttribute(attribute) {
  if (typeof attribute !== 'string') return undefined;
  const trimmed = attribute.trim();
  return trimmed === '' || trimmed === 'state' ? undefined : trimmed;
}

/** Drop undefined keys so migrated YAML stays tidy. */
function compact(obj) {
  return Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined && v !== ''));
}

/**
 * Normalise the old buffer selectors (`buffer`, `key`, `buffer.key`,
 * `transformation.smoothed`) to a processor key, or undefined for the main buffer.
 * @param {Object} item
 * @returns {string|undefined}
 */
function legacyBuffer(item) {
  const raw = item.buffer && item.key && !String(item.buffer).includes('.')
    ? `${item.buffer}.${item.key}`
    : (item.buffer ?? item.key);
  if (!raw) return undefined;
  const key = String(raw).split('.').pop();
  return key === 'main' ? undefined : key;
}

/**
 * Whether a sources[] item is already in canonical form.
 * @param {*} item
 * @returns {boolean}
 */
function isCanonicalItem(item) {
  if (!item || typeof item !== 'object' || Array.isArray(item)) return false;
  if ('key' in item || 'id' in item || 'yaxis' in item) return false;
  if (typeof item.entity === 'string') return cleanAttribute(item.attribute) === item.attribute;
  if (typeof item.datasource === 'string') {
    return !EDITOR_SERIES.test(item.datasource) && !EDITOR_PLACEHOLDER.test(item.datasource)
      && (item.buffer === undefined || (!String(item.buffer).includes('.') && item.buffer !== 'main'));
  }
  return false;
}

/**
 * Whether the whole config is already canonical (fast path, keeps identity).
 * @param {Object} config
 * @returns {boolean}
 */
function isCanonical(config) {
  const legacyRootKeys = ['source', 'data_source', 'series_names', 'history_hours', 'show_legend', 'max_points', 'attribute'];
  if (legacyRootKeys.some(k => k in config)) return false;
  if (config.sources !== undefined && !Array.isArray(config.sources)) return false;
  if (!(config.sources ?? []).every(isCanonicalItem)) return false;
  const dataSources = config.data_sources ?? {};
  return Object.entries(dataSources).every(([name, ds]) =>
    !EDITOR_SERIES.test(name) && !EDITOR_PLACEHOLDER.test(name)
    && !(ds && typeof ds === 'object' && ('name' in ds || 'type' in ds || ds.attribute === 'state' || ds.attribute === '')));
}

/**
 * Migrate a chart config to the canonical sources[] format.
 *
 * @param {Object} config - Card config (not mutated)
 * @returns {{ config: Object, changed: boolean, notes: string[] }}
 */
export function migrateChartConfig(config) {
  if (!config || typeof config !== 'object' || isCanonical(config)) {
    return { config, changed: false, notes: [] };
  }

  const out = clone(config);
  const notes = [];
  const dataSources = out.data_sources && typeof out.data_sources === 'object' ? out.data_sources : {};

  // ── Collect the raw series list from every legacy spelling ──────────────
  // Same precedence the old card used: source, then data_source, then sources.
  let rawSources = out.source ?? out.data_source ?? out.sources;
  if (rawSources !== undefined && !Array.isArray(rawSources)) rawSources = [rawSources];
  rawSources = rawSources ?? [];

  const rootAttribute = cleanAttribute(out.attribute);
  const usedSingleSource = out.source !== undefined || out.data_source !== undefined;
  if (usedSingleSource && Array.isArray(out.sources) && out.sources.length) {
    notes.push('sources ignored: source/data_source took precedence (as before)');
  }
  if (out.source !== undefined || out.data_source !== undefined) {
    notes.push('source/data_source moved to sources[]');
  }

  const seriesNames = Array.isArray(out.series_names) ? out.series_names
    : (out.series_names ? [out.series_names] : []);

  // How many series point at each DataSource name (a shared series_N is not inlined).
  const refOf = (item) => (typeof item === 'string' ? item : (item?.datasource ?? item?.id ?? (item?.entity ? undefined : item?.name)));
  const refCounts = new Map();
  for (const item of rawSources) {
    const ref = refOf(item);
    if (ref) refCounts.set(ref, (refCounts.get(ref) ?? 0) + 1);
  }

  let inlinedHours = 0;
  const inlined = new Set();
  const sources = [];

  rawSources.forEach((item, index) => {
    if (isCanonicalItem(item)) {
      const series = { ...item };
      if (seriesNames[index] && series.name === undefined) series.name = seriesNames[index];
      sources.push(series);
      return;
    }

    const isObject = item && typeof item === 'object';
    const ref = refOf(item);
    if (!ref && !(isObject && typeof item.entity === 'string')) {
      notes.push(`sources[${index}] had no source reference and was dropped`);
      return;
    }

    // Display fields: series item > series_names > DataSource entry
    const ds = ref ? dataSources[ref] : undefined;
    const display = compact({
      name: (isObject && (item.datasource || item.id) ? item.name : undefined) ?? seriesNames[index] ?? ds?.name,
      type: (isObject ? item.type : undefined) ?? ds?.type
    });
    if (isObject && 'yaxis' in item) notes.push(`sources[${index}].yaxis removed (it never had an effect; use yaxis_id)`);

    // Entity form written with legacy extras (e.g. attribute: 'state')
    if (isObject && typeof item.entity === 'string') {
      sources.push(compact({ ...item, attribute: cleanAttribute(item.attribute), yaxis: undefined, ...display }));
      return;
    }

    // Never-rendered placeholder from the old editor
    if (EDITOR_PLACEHOLDER.test(ref)) {
      notes.push(`placeholder series ${ref} removed`);
      inlined.add(ref);
      return;
    }

    const buffer = isObject ? legacyBuffer(item) : undefined;

    // Editor-generated series_N that only wraps an entity: inline it.
    const inlineable = ds && EDITOR_SERIES.test(ref) && !buffer && !ds.processing
      && refCounts.get(ref) === 1 && Object.keys(ds).every(k => INLINE_KEYS.has(k));
    if (inlineable) {
      sources.push(compact({ entity: ds.entity, attribute: cleanAttribute(ds.attribute), ...display }));
      if (ds.history?.hours) inlinedHours = Math.max(inlinedHours, ds.history.hours);
      inlined.add(ref);
      notes.push(`${ref} inlined into sources[${sources.length - 1}]`);
      return;
    }

    // Named DataSource (card-local or global)
    if (ds || !ENTITY_ID.test(ref)) {
      sources.push(compact({ datasource: ref, buffer, ...display }));
      return;
    }

    // Bare entity id
    const attribute = usedSingleSource ? rootAttribute : undefined;
    sources.push(compact({ entity: ref, attribute, ...display }));
  });

  // ── DataSource entries: drop inlined ones, strip series-only keys ────────
  if (out.data_sources) {
    for (const name of inlined) delete dataSources[name];
    // Orphans left behind by the old editor's renumbering
    const stillUsed = new Set(sources.map(s => s.datasource).filter(Boolean));
    for (const name of Object.keys(dataSources)) {
      if ((EDITOR_SERIES.test(name) || EDITOR_PLACEHOLDER.test(name)) && !stillUsed.has(name)) {
        delete dataSources[name];
        notes.push(`unused ${name} removed`);
      }
    }
    for (const ds of Object.values(dataSources)) {
      if (!ds || typeof ds !== 'object') continue;
      delete ds.name;
      delete ds.type;
      delete ds.yaxis;
      if (cleanAttribute(ds.attribute) === undefined) delete ds.attribute;
    }
    if (Object.keys(dataSources).length === 0) delete out.data_sources;
  }

  // ── Root keys ────────────────────────────────────────────────────────────
  if (out.graph_span === undefined) {
    const hours = out.history_hours ?? (inlinedHours || undefined);
    if (hours) {
      out.graph_span = `${hours}h`;
      notes.push(`history hours mapped to graph_span: ${out.graph_span}`);
    }
  }
  if ('show_legend' in out) {
    if (out.style?.legend?.show === undefined) {
      out.style = { ...out.style, legend: { ...out.style?.legend, show: out.show_legend } };
    }
    notes.push('show_legend moved to style.legend.show');
  }
  if ('max_points' in out) notes.push('max_points removed (it never had an effect; use group_by)');
  if ('attribute' in out && !usedSingleSource) notes.push('root attribute removed (it only applied to source)');

  for (const key of ['source', 'data_source', 'series_names', 'history_hours', 'show_legend', 'max_points', 'attribute']) {
    delete out[key];
  }
  if (rawSources.length || sources.length) out.sources = sources;

  const changed = JSON.stringify(out) !== JSON.stringify(config);
  return { config: changed ? out : config, changed, notes };
}
