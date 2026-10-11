/**
 * Pure helpers for turning Home Assistant entity values and history replies
 * into numeric time-series points. Shared by DataSource and the chart series
 * fetcher. No imports, so node:test suites can load this module directly.
 *
 * @module core/data-sources/ha-history-utils
 */

const TRUE_STATES = new Set(['on', 'true', 'active', 'open']);
const FALSE_STATES = new Set(['off', 'false', 'inactive', 'closed']);

/**
 * Convert a raw HA value to a number.
 *
 * Order: enum_mapping, numeric parse, boolean-like strings (on/off etc. to 1/0),
 * booleans. Anything else (including unavailable/unknown) is null.
 *
 * @param {*} raw - Raw state or attribute value
 * @param {Object<string, number>} [enumMapping] - Optional state-to-number map
 * @returns {number|null}
 */
export function toNumericValue(raw, enumMapping) {
  if (raw === null || raw === undefined) return null;

  if (typeof raw === 'number') return Number.isFinite(raw) ? raw : null;
  if (typeof raw === 'boolean') return raw ? 1 : 0;
  if (typeof raw !== 'string') return null;

  if (enumMapping && typeof enumMapping === 'object') {
    const mapped = enumMapping[raw];
    if (typeof mapped === 'number' && Number.isFinite(mapped)) return mapped;
  }

  const num = parseFloat(raw);
  if (Number.isFinite(num)) return num;

  const lower = raw.toLowerCase().trim();
  if (TRUE_STATES.has(lower)) return 1;
  if (FALSE_STATES.has(lower)) return 0;
  return null;
}

/**
 * Normalise a configured attribute name. `'state'`, `''` and `'__state__'` (the
 * data source editor's "State" choice, which older editors saved) mean "the
 * entity state", not an attribute by that name.
 *
 * @param {string|null|undefined} attribute
 * @returns {string|null}
 */
export function normalizeAttribute(attribute) {
  if (typeof attribute !== 'string') return null;
  const trimmed = attribute.trim();
  return trimmed === '' || trimmed === 'state' || trimmed === '__state__' ? null : trimmed;
}

/**
 * Read a nested value with dot/bracket notation ("forecast[0].temperature").
 *
 * @param {Object} obj
 * @param {string} path
 * @returns {*} The value, or null when any segment is missing
 */
export function getNestedValue(obj, path) {
  if (!obj || !path) return null;
  const segments = path.replace(/\[(\d+)\]/g, '.$1').split('.');
  let current = obj;
  for (const segment of segments) {
    if (current === null || current === undefined) return null;
    current = current[segment];
  }
  return current === undefined ? null : current;
}

/**
 * Pick the raw value a series tracks out of a state/attributes pair.
 *
 * @param {*} state
 * @param {Object|null|undefined} attributes
 * @param {{attribute?: string|null, attribute_path?: string|null}} opts
 * @returns {*}
 */
export function selectRawValue(state, attributes, { attribute, attribute_path } = {}) {
  if (attribute_path) return getNestedValue(attributes, attribute_path);
  const attr = normalizeAttribute(attribute);
  if (attr) return attributes?.[attr] ?? null;
  return state;
}

/**
 * Whether a history request has to include attributes for this series.
 *
 * @param {{attribute?: string|null, attribute_path?: string|null}} opts
 * @returns {boolean}
 */
export function historyNeedsAttributes({ attribute, attribute_path } = {}) {
  return Boolean(attribute_path || normalizeAttribute(attribute));
}

/**
 * Convert one entity's history states into numeric points.
 *
 * Accepts both shapes HA returns:
 * - WebSocket compressed (`history/history_during_period`, `history/stream`):
 *   `{ s, a?, lc?, lu }` with times in epoch seconds; `lc` omitted when equal to `lu`.
 *
 * State series are timed by last_changed (as HA's own graphs do); attribute
 * series by last_updated.
 * - REST / full: `{ state, attributes?, last_changed?, last_updated? }` with ISO strings.
 *
 * Attributes are carried forward when a state omits them (minimal responses
 * only include them on some rows). Non-numeric values are skipped.
 *
 * @param {Array<Object>} states
 * @param {{attribute?: string|null, attribute_path?: string|null, enum_mapping?: Object}} [opts]
 * @returns {Array<{t: number, v: number}>}
 */
export function historyStatesToPoints(states, opts = {}) {
  if (!Array.isArray(states)) return [];

  const points = [];
  let lastAttributes = null;
  // Attribute-only updates move last_updated but not last_changed, so
  // attribute series are timed by last_updated.
  const byUpdate = historyNeedsAttributes(opts);

  for (const row of states) {
    if (!row || typeof row !== 'object') continue;

    const compressed = 's' in row || 'lu' in row;
    const state = compressed ? row.s : row.state;
    const attributes = (compressed ? row.a : row.attributes) ?? lastAttributes;
    if (attributes) lastAttributes = attributes;

    let t;
    if (compressed) {
      const seconds = byUpdate ? row.lu : (row.lc ?? row.lu);
      t = typeof seconds === 'number' ? Math.round(seconds * 1000) : NaN;
    } else {
      t = new Date(byUpdate ? (row.last_updated || row.last_changed) : (row.last_changed || row.last_updated)).getTime();
    }
    if (!Number.isFinite(t)) continue;

    const v = toNumericValue(selectRawValue(state, attributes, opts), opts.enum_mapping);
    if (v === null) continue;

    points.push({ t, v });
  }

  return points;
}
