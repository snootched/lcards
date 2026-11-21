/**
 * group_by: bucket time-series points into fixed intervals. Pure; imports only
 * the duration parser.
 *
 * Scalar functions: avg, min, max, first, last, sum, median, delta (last - first
 * within the bucket), diff (bucket's last minus the previous bucket's last, for
 * cumulative counters).
 * Array functions (for range-style charts):
 *   minmax -> [min, max]                    rangeArea
 *   box    -> [min, q1, median, q3, max]    boxPlot
 *   ohlc   -> [first, max, min, last]       candlestick
 *
 * @module charts/chart-group-by
 */

import { parseDuration } from './chart-span.js';

export const ARRAY_FUNCS = new Set(['minmax', 'box', 'ohlc']);

/**
 * Quantile with linear interpolation on a sorted array.
 * @param {number[]} sorted
 * @param {number} q - 0..1
 * @returns {number}
 */
function quantile(sorted, q) {
  const pos = (sorted.length - 1) * q;
  const lo = Math.floor(pos);
  const hi = Math.ceil(pos);
  return sorted[lo] + (sorted[hi] - sorted[lo]) * (pos - lo);
}

/**
 * Reduce one bucket's values (in time order).
 * @param {string} func
 * @param {number[]} values
 * @param {number|null} previousLast - Last value of the previous bucket (for diff)
 * @returns {number|number[]}
 */
function reduce(func, values, previousLast) {
  const first = values[0];
  const last = values[values.length - 1];
  switch (func) {
    case 'min': return Math.min(...values);
    case 'max': return Math.max(...values);
    case 'first': return first;
    case 'last': return last;
    case 'sum': return values.reduce((a, b) => a + b, 0);
    case 'median': return quantile([...values].sort((a, b) => a - b), 0.5);
    case 'delta': return last - first;
    case 'diff': return previousLast === null ? 0 : last - previousLast;
    case 'minmax': return [Math.min(...values), Math.max(...values)];
    case 'box': {
      const sorted = [...values].sort((a, b) => a - b);
      return [sorted[0], quantile(sorted, 0.25), quantile(sorted, 0.5), quantile(sorted, 0.75), sorted[sorted.length - 1]];
    }
    case 'ohlc': return [first, Math.max(...values), Math.min(...values), last];
    case 'avg':
    default:
      return values.reduce((a, b) => a + b, 0) / values.length;
  }
}

/**
 * Value used for an empty bucket.
 * @param {string} func
 * @param {'null'|'last'|'zero'} fill
 * @param {number|null} lastValue - Last raw value seen so far
 * @returns {number|number[]|null}
 */
function emptyValue(func, fill, lastValue) {
  if (fill === 'zero') {
    if (func === 'minmax') return [0, 0];
    if (func === 'box') return [0, 0, 0, 0, 0];
    if (func === 'ohlc') return [0, 0, 0, 0];
    return 0;
  }
  if (fill === 'last' && lastValue !== null) {
    if (func === 'delta' || func === 'diff' || func === 'sum') return 0;
    if (func === 'minmax') return [lastValue, lastValue];
    if (func === 'box') return [lastValue, lastValue, lastValue, lastValue, lastValue];
    if (func === 'ohlc') return [lastValue, lastValue, lastValue, lastValue];
    return lastValue;
  }
  return null;
}

/**
 * Bucket points into fixed intervals aligned to the window start.
 *
 * Buckets run from `window.start` up to (not past) `window.end` and never into
 * the future (`now`). Each output point is stamped with its bucket start.
 * Points before the window seed the "last value" used by fill: 'last'.
 *
 * @param {Array<{t: number, v: number}>} points - Sorted by t
 * @param {{func?: string, duration: string|number, fill?: 'null'|'last'|'zero'}} groupBy
 * @param {{start: number, end: number}} window
 * @param {number} [now=Date.now()]
 * @returns {Array<{t: number, v: number|number[]|null}>}
 */
export function groupBy(points, groupBy, window, now = Date.now()) {
  const func = groupBy?.func ?? 'avg';
  const fill = groupBy?.fill ?? 'last';
  const size = parseDuration(groupBy?.duration);
  if (!size || size <= 0 || !Array.isArray(points)) return points ?? [];

  const limit = Math.min(window.end, now);
  const out = [];
  let index = 0;
  let lastValue = null;
  let previousLast = null;

  // Values before the window only seed fill/diff.
  while (index < points.length && points[index].t < window.start) {
    lastValue = points[index].v;
    index++;
  }
  previousLast = lastValue;

  for (let bucketStart = window.start; bucketStart < limit; bucketStart += size) {
    const bucketEnd = bucketStart + size;
    const values = [];
    while (index < points.length && points[index].t < bucketEnd) {
      values.push(points[index].v);
      index++;
    }

    if (values.length) {
      out.push({ t: bucketStart, v: reduce(func, values, previousLast) });
      lastValue = values[values.length - 1];
      previousLast = lastValue;
    } else {
      out.push({ t: bucketStart, v: emptyValue(func, fill, lastValue) });
    }
  }

  return out;
}
