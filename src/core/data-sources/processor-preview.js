/**
 * @fileoverview Processor preview: run a data source's `processing:` pipeline over a
 * set of history points with the real ProcessorManager, and return chartable series.
 *
 * Feeds points exactly as a live DataSource does (DataSource._processValue): push
 * to a main buffer sized like the data source's, then process. Pure: no DOM, no
 * fetching. Used by the docs processor lab with sample history; meant for the
 * editor's processor preview with real history too. Import it lazily so it stays
 * out of the main chunk.
 *
 * @module core/data-sources/processor-preview
 */

import { RollingBuffer } from './RollingBuffer.js';
import { ProcessorManager } from './ProcessorManager.js';
import { dataSourceBufferSize } from './DataSource.js';

/** Object result fields that are bookkeeping, not values to chart. */
const SKIP_FIELDS = new Set(['oldest', 'newest', 'window', 't', 'duration_human', 'in_condition']);

/**
 * @typedef {Object} PreviewSeries
 * @property {string} name
 * @property {Array<{t: number, v: number}>} points
 * @property {number} axis - 0, or 1 for the second y axis
 * @property {boolean} [raw] - The input values
 */

/** A series on a scale this many times bigger or smaller than raw gets the second axis. */
const AXIS_RATIO = 5;

/**
 * Chartable numbers in one processor result.
 * @param {string} key - Processor key
 * @param {*} result - Processor output
 * @returns {Array<[string, number]>} [series name, value] pairs
 */
function numericFields(key, result) {
  if (typeof result === 'number') return Number.isFinite(result) ? [[key, result]] : [];
  // statistics with max_points returns its time series: its newest entry is the value
  const value = Array.isArray(result) ? result[result.length - 1] : result;
  if (!value || typeof value !== 'object') return [];
  if ('duration_ms' in value) return [[`${key} (min)`, value.duration_ms / 60000]];
  return Object.entries(value)
    .filter(([field, v]) => !SKIP_FIELDS.has(field) && typeof v === 'number' && Number.isFinite(v))
    .map(([field, v]) => [`${key}.${field}`, v]);
}

/**
 * A result for display: numbers rounded, objects as `field: value` pairs.
 * @param {*} result
 * @returns {string}
 */
export function formatResult(result) {
  const num = (v) => (Number.isInteger(v) ? String(v) : Number(v.toPrecision(6)).toString());
  if (result === null || result === undefined) return '-';
  if (typeof result === 'number') return Number.isFinite(result) ? num(result) : String(result);
  const value = Array.isArray(result) ? result[result.length - 1] : result;
  if (value && typeof value === 'object') {
    return Object.entries(value)
      .filter(([field]) => !['oldest', 'newest', 't'].includes(field))
      .map(([field, v]) => `${field}: ${typeof v === 'number' ? num(v) : v}`)
      .join(' · ');
  }
  return String(value);
}

/** Largest absolute value in a series (0 when empty). */
const magnitude = (points) => points.reduce((m, p) => Math.max(m, Math.abs(p.v)), 0);

/**
 * Run a data source's processing pipeline over history points.
 *
 * @param {Object} entry - Data source config: `{ entity?, processing, window_seconds? }`
 * @param {Array<{t: number, v: number}>} points - History, oldest first
 * @param {Object} [options]
 * @param {Object} [options.entityState] - State object for `expression`'s `entity`
 * @returns {{
 *   order: string[],
 *   series: PreviewSeries[],
 *   latest: Array<{key: string, type: string, input: string, value: string}>,  // input: 'raw' or 'a', plus ' + b' for an expression's sources
 *   errors: string[]
 * }}
 */
export function runProcessorPreview(entry, points, { entityState = null } = {}) {
  /** @type {string[]} */
  const errors = [];
  const processing = entry?.processing;
  const raw = (points ?? []).filter(p => Number.isFinite(p?.v) && Number.isFinite(p?.t));
  /** @type {PreviewSeries[]} */
  const rawOnly = [{ name: 'raw', points: raw, axis: 0, raw: true }];
  const empty = { order: [], series: rawOnly, latest: [], errors };

  if (processing !== undefined && (processing === null || typeof processing !== 'object' || Array.isArray(processing))) {
    errors.push('processing must be a map of processor names to processors.');
    return empty;
  }
  for (const [key, proc] of Object.entries(processing ?? {})) {
    if (!proc || typeof proc !== 'object') errors.push(`${key}: a processor needs a type, e.g. type: smooth.`);
    // `from` chains nothing: it is convert_unit's source unit. input_source chains.
    else if (proc.from !== undefined && proc.type !== 'convert_unit') {
      errors.push(`${key}: "from" is not a chaining key (it is convert_unit's unit). Use input_source: <processor>.`);
    }
  }
  if (errors.length) return empty;

  const { capacity } = dataSourceBufferSize(entry);
  const buffer = new RollingBuffer(capacity);
  const dataSource = {
    cfg: { entity: entry?.entity },
    hass: { states: entry?.entity && entityState ? { [entry.entity]: entityState } : {} },
  };
  const manager = new ProcessorManager(dataSource, processing ?? {});
  try {
    manager.initialize(processing ?? {}, buffer);
  } catch (error) {
    errors.push(error.message);
    return empty;
  }

  /** @type {string[]} */
  const order = manager._executionOrder ?? [];
  const produced = new Set();
  /** @type {Map<string, PreviewSeries>} */
  const byName = new Map();
  /** @type {PreviewSeries[]} */
  const series = [{ name: 'raw', points: raw, axis: 0, raw: true }];
  for (const point of raw) {
    buffer.push(point.t, point.v);
    const results = manager.process(point.v, point.t, buffer);
    for (const key of order) {
      if (results[key] !== null && results[key] !== undefined) produced.add(key);
      for (const [name, v] of numericFields(key, results[key])) {
        let s = byName.get(name);
        if (!s) {
          /** @type {PreviewSeries} */
          const created = { name, points: [], axis: 0 };
          s = created;
          byName.set(name, s);
          series.push(s);
        }
        s.points.push({ t: point.t, v });
      }
    }
  }

  // Series on a very different scale from raw (W vs kW, 0-255 vs %) get the second axis.
  const rawMag = magnitude(raw);
  for (const s of series.slice(1)) {
    const mag = magnitude(s.points);
    if (rawMag > 0 && mag > 0 && (mag / rawMag > AXIS_RATIO || rawMag / mag > AXIS_RATIO)) s.axis = 1;
  }

  const stats = manager.getStats().processorStats;
  for (const { key, stats: s } of stats) {
    if (s?.errors) errors.push(`${key}: ${s.errors} of ${s.executions + s.errors} samples failed (see the browser console).`);
  }

  // Some processors (expression) catch their own errors and return null.
  if (raw.length) {
    for (const key of order) if (!produced.has(key)) errors.push(`${key}: produced no values (check its settings).`);
  }

  const latest = order.map(key => {
    const proc = manager.getProcessor(key);
    const main = proc?.getDependency() ?? null;
    // An expression also reads its sources
    const extra = (proc?.getDependencies?.() ?? []).filter(dep => dep !== main);
    return {
      key,
      type: proc?.type ?? '',
      input: [main ?? 'raw', ...extra].join(' + '),
      value: formatResult(manager.processorResults.get(key)),
    };
  });

  return { order, series, latest, errors };
}
