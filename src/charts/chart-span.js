/**
 * Chart time window helpers: duration parsing and the [start, end] window a
 * chart shows (graph_span, optionally aligned with span.start/end and shifted
 * with span.offset), aligned in the browser's zone or a given IANA zone.
 * Pure; no imports.
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

/** @type {Map<string, Intl.DateTimeFormat>} */
const formatters = new Map();

const WEEKDAY_INDEX = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };

/**
 * Wall-clock fields of `time` in an IANA zone.
 * @param {number} time - Epoch ms
 * @param {string} timeZone
 * @returns {{year: number, month: number, day: number, hour: number, minute: number, second: number, weekday: number}}
 *   `month` is 1-12, `weekday` 0 (Sunday) to 6.
 */
export function zonedParts(time, timeZone) {
  let format = formatters.get(timeZone);
  if (!format) {
    format = new Intl.DateTimeFormat('en-US', {
      timeZone, hourCycle: 'h23', weekday: 'short',
      year: 'numeric', month: 'numeric', day: 'numeric',
      hour: 'numeric', minute: 'numeric', second: 'numeric'
    });
    formatters.set(timeZone, format);
  }
  /** @type {Record<string, string>} */
  const parts = {};
  for (const part of format.formatToParts(time)) parts[part.type] = part.value;
  return {
    year: Number(parts.year), month: Number(parts.month), day: Number(parts.day),
    hour: Number(parts.hour) % 24, minute: Number(parts.minute), second: Number(parts.second),
    weekday: WEEKDAY_INDEX[/** @type {keyof typeof WEEKDAY_INDEX} */ (parts.weekday)] ?? 0
  };
}

/**
 * The zone's offset from UTC at `time`, in ms (positive east of Greenwich).
 * @param {number} time
 * @param {string} timeZone
 * @returns {number}
 */
export function zoneOffset(time, timeZone) {
  const p = zonedParts(time, timeZone);
  const wall = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second);
  return wall - (time - (((time % 1000) + 1000) % 1000));
}

/**
 * Epoch ms of a wall-clock midnight in a zone. Out-of-range days and months
 * roll over (day 0 is the last day of the previous month), as Date.UTC does.
 * @param {number} year
 * @param {number} month - 1-12 (may overflow)
 * @param {number} day
 * @param {string} timeZone
 * @returns {number}
 */
function zonedMidnight(year, month, day, timeZone) {
  const wall = Date.UTC(year, month - 1, day);
  const guess = wall - zoneOffset(wall, timeZone);
  // Second pass picks the offset in force at the result (DST changes).
  return wall - zoneOffset(guess, timeZone);
}

/**
 * Start of the calendar unit containing `time`: in `timeZone` when given (an
 * IANA name, e.g. Home Assistant's own zone), otherwise in the browser's zone.
 * @param {number} time - Epoch ms
 * @param {string} unit - minute | hour | day | week | month | year
 * @param {number} [weekStart=1] - First day of the week (0 = Sunday, 1 = Monday)
 * @param {string} [timeZone] - IANA zone; omitted = browser local time
 * @returns {number}
 */
export function startOfUnit(time, unit, weekStart = 1, timeZone) {
  if (timeZone) return zonedStartOfUnit(time, unit, weekStart, timeZone);
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
 * startOfUnit() in an IANA zone.
 * @param {number} time
 * @param {string} unit
 * @param {number} weekStart
 * @param {string} timeZone
 * @returns {number}
 */
function zonedStartOfUnit(time, unit, weekStart, timeZone) {
  const p = zonedParts(time, timeZone);
  const ms = ((time % 1000) + 1000) % 1000;
  switch (unit) {
    case 'year': return zonedMidnight(p.year, 1, 1, timeZone);
    case 'month': return zonedMidnight(p.year, p.month, 1, timeZone);
    case 'week': return zonedMidnight(p.year, p.month, p.day - ((p.weekday - weekStart + 7) % 7), timeZone);
    case 'day': return zonedMidnight(p.year, p.month, p.day, timeZone);
    // Counted back from `time`, so a repeated DST hour stays unambiguous.
    case 'hour': return time - (p.minute * 60 + p.second) * 1000 - ms;
    case 'minute': return time - p.second * 1000 - ms;
    default: return time;
  }
}

/**
 * Start of the unit after the one containing `time`.
 * @param {number} time
 * @param {string} unit - minute | hour | day | week | month | year
 * @param {number} [weekStart=1]
 * @param {string} [timeZone] - IANA zone; omitted = browser local time
 * @returns {number}
 */
export function endOfUnit(time, unit, weekStart = 1, timeZone) {
  const start = startOfUnit(time, unit, weekStart, timeZone);
  if (timeZone) {
    const p = zonedParts(start, timeZone);
    switch (unit) {
      case 'year': return zonedMidnight(p.year + 1, 1, 1, timeZone);
      case 'month': return zonedMidnight(p.year, p.month + 1, 1, timeZone);
      case 'week': return zonedMidnight(p.year, p.month, p.day + 7, timeZone);
      case 'day': return zonedMidnight(p.year, p.month, p.day + 1, timeZone);
      case 'hour': return start + 3_600_000;
      case 'minute': return start + 60_000;
      default: return time;
    }
  }
  const d = new Date(start);
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
 * Units align to `calendar`: the chart card passes Home Assistant's time zone
 * and first weekday (`localeCalendar(hass)` in utils/ha-locale.js); without it
 * (docs demos) windows use the browser's zone and start weeks on Monday.
 *
 * @param {{graph_span?: string, span?: {start?: string, end?: string, offset?: string}}} config
 * @param {number} [now=Date.now()]
 * @param {{weekStart?: number, timeZone?: string}} [calendar]
 * @returns {{start: number, end: number, duration: number, live: boolean}}
 *   `live` is true when the window reaches the present (new points arrive).
 */
export function computeSpan(config = {}, now = Date.now(), calendar = {}) {
  const { weekStart = 1, timeZone } = calendar;
  const duration = Math.abs(parseDuration(config.graph_span ?? DEFAULT_GRAPH_SPAN)
    ?? /** @type {number} */ (parseDuration(DEFAULT_GRAPH_SPAN)));
  const span = config.span ?? {};

  let start;
  let end;
  if (span.start) {
    start = startOfUnit(now, span.start, weekStart, timeZone);
    end = start + duration;
  } else if (span.end) {
    end = endOfUnit(now, span.end, weekStart, timeZone);
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
