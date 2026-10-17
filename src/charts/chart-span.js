/**
 * Chart time window helpers: duration parsing and the [start, end] window a
 * chart shows (graph_span, optionally aligned with span.start/end and shifted
 * with span.offset). Pure; no imports.
 *
 * @module charts/chart-span
 */

const UNIT_MS = {
  s: 1000, sec: 1000, second: 1000,
  m: 60_000, min: 60_000, minute: 60_000,
  h: 3_600_000, hour: 3_600_000,
  d: 86_400_000, day: 86_400_000,
  w: 604_800_000, week: 604_800_000,
  mo: 2_592_000_000, month: 2_592_000_000, // 30 days, only for fixed-length durations
  y: 31_536_000_000, year: 31_536_000_000  // 365 days
};

const DURATION = /^([+-])?\s*(\d+(?:\.\d+)?)\s*(s|sec|second|m|min|minute|h|hour|d|day|w|week|mo|month|y|year)s?$/i;

export const DEFAULT_GRAPH_SPAN = '24h';

/**
 * Parse "10min", "1h", "-1d", "2w" into milliseconds (signed).
 * @param {string|number|null|undefined} value
 * @returns {number|null} Milliseconds, or null when not a duration
 */
export function parseDuration(value) {
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  if (typeof value !== 'string') return null;
  const match = value.trim().match(DURATION);
  if (!match) return null;
  const [, sign, amount, unit] = match;
  const ms = parseFloat(amount) * UNIT_MS[unit.toLowerCase()];
  return sign === '-' ? -ms : ms;
}

/**
 * Start of the calendar unit containing `time` (local time).
 * @param {number} time - Epoch ms
 * @param {string} unit - minute | hour | day | week | month | year
 * @param {number} [weekStart=1] - First day of the week (0 = Sunday, 1 = Monday)
 * @returns {number}
 */
export function startOfUnit(time, unit, weekStart = 1) {
  const d = new Date(time);
  switch (unit) {
    case 'year': d.setMonth(0, 1); d.setHours(0, 0, 0, 0); break;
    case 'month': d.setDate(1); d.setHours(0, 0, 0, 0); break;
    case 'week': {
      const back = (d.getDay() - weekStart + 7) % 7;
      d.setDate(d.getDate() - back);
      d.setHours(0, 0, 0, 0);
      break;
    }
    case 'day': d.setHours(0, 0, 0, 0); break;
    case 'hour': d.setMinutes(0, 0, 0); break;
    case 'minute': d.setSeconds(0, 0); break;
    default: return time;
  }
  return d.getTime();
}

/**
 * Start of the unit after the one containing `time`.
 * @param {number} time
 * @param {string} unit - minute | hour | day | week | month | year
 * @param {number} [weekStart=1]
 * @returns {number}
 */
export function endOfUnit(time, unit, weekStart = 1) {
  const d = new Date(startOfUnit(time, unit, weekStart));
  switch (unit) {
    case 'year': d.setFullYear(d.getFullYear() + 1); break;
    case 'month': d.setMonth(d.getMonth() + 1); break;
    case 'week': d.setDate(d.getDate() + 7); break;
    case 'day': d.setDate(d.getDate() + 1); break;
    case 'hour': d.setHours(d.getHours() + 1); break;
    case 'minute': d.setMinutes(d.getMinutes() + 1); break;
    default: return time;
  }
  return d.getTime();
}

/**
 * The window a chart shows.
 *
 * - default: the last graph_span up to now
 * - span.start: from the start of the current unit, lasting graph_span
 * - span.end: ending at the end of the current unit, graph_span long
 * - span.offset: shift the result (e.g. -1d for the same window yesterday)
 *
 * @param {{graph_span?: string, span?: {start?: string, end?: string, offset?: string}}} config
 * @param {number} [now=Date.now()]
 * @param {number} [weekStart=1]
 * @returns {{start: number, end: number, duration: number, live: boolean}}
 *   `live` is true when the window reaches the present (new points arrive).
 */
export function computeSpan(config = {}, now = Date.now(), weekStart = 1) {
  const duration = Math.abs(parseDuration(config.graph_span ?? DEFAULT_GRAPH_SPAN)
    ?? /** @type {number} */ (parseDuration(DEFAULT_GRAPH_SPAN)));
  const span = config.span ?? {};

  let start;
  let end;
  if (span.start) {
    start = startOfUnit(now, span.start, weekStart);
    end = start + duration;
  } else if (span.end) {
    end = endOfUnit(now, span.end, weekStart);
    start = end - duration;
  } else {
    end = now;
    start = now - duration;
  }

  const offset = parseDuration(span.offset) ?? 0;
  start += offset;
  end += offset;

  return { start, end, duration, live: end >= now && start <= now };
}
