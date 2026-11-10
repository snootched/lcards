/**
 * Chart time labels in Home Assistant's time zone and clock format.
 *
 * ApexCharts 7 reads datetime values in UTC or in the browser's zone, and only
 * picks calendar ticks (whole hours, midnights, month starts) itself while
 * `xaxis.labels.formatter` is unset (Core.js skips its TimeScale otherwise). So
 * instead of a label formatter, time-axis values are moved to the zone's wall
 * clock written as UTC (`toWallClock`) and the axis is set to `datetimeUTC`:
 * ApexCharts then places and names ticks exactly as it would in that zone.
 * Formatters that see those values (tooltip, `style.formatters`) read them in
 * UTC, which is the zone's wall clock.
 *
 * @module charts/chart-time-labels
 */

import { zoneOffset } from './chart-span.js';
import { resolveTimeZone, browserTimeZone, useAmPm } from '../utils/ha-locale.js';

export { useAmPm };

/** Offsets only change on quarter hours (UTC), so cache per quarter hour. */
const QUARTER_HOUR = 900_000;
/** @type {Map<string, Map<number, number>>} */
const offsetCache = new Map();

/**
 * The zone's wall clock at `time`, as a UTC epoch (22:30 in New York becomes
 * 22:30Z).
 * @param {number} time - Epoch ms
 * @param {string} timeZone - IANA zone
 * @returns {number}
 */
export function toWallClock(time, timeZone) {
  let cache = offsetCache.get(timeZone);
  if (!cache) {
    cache = new Map();
    offsetCache.set(timeZone, cache);
  }
  const key = Math.floor(time / QUARTER_HOUR);
  let offset = cache.get(key);
  if (offset === undefined) {
    offset = zoneOffset(key * QUARTER_HOUR, timeZone);
    if (cache.size > 20_000) cache.clear();
    cache.set(key, offset);
  }
  return time + offset;
}

/**
 * The zone chart times show in when hass is known: the profile's zone
 * (server or local), the browser's when it can't be resolved. Null without hass,
 * so ApexCharts keeps its own defaults (docs demos).
 * @param {any} hass
 * @returns {string|null}
 */
export function chartTimeZone(hass) {
  if (!hass) return null;
  return resolveTimeZone(hass) ?? browserTimeZone() ?? null;
}

/**
 * ApexCharts `xaxis.labels.datetimeFormatter` per tick unit: its own defaults
 * on a 24 hour clock, `h:mm TT` times on a 12 hour clock. ApexCharts still
 * adds the day or year when the ticks span them.
 * @param {boolean} amPm
 * @returns {Record<string, string>}
 */
export function datetimeFormats(amPm) {
  return {
    year: 'yyyy',
    month: 'MMM',
    day: 'dd MMM',
    hour: amPm ? 'h:mm TT' : 'HH:mm',
    minute: amPm ? 'h:mm TT' : 'HH:mm',
    second: amPm ? 'h:mm:ss TT' : 'HH:mm:ss'
  };
}

/**
 * Tooltip x formatter for wall-clock values: the date and time in the user's
 * language and clock; the date alone for windows over 90 days, seconds for
 * windows under 10 minutes.
 * @param {any} hass
 * @param {{start: number, end: number}|null|undefined} span
 * @returns {(value: number) => string}
 */
export function tooltipTimeFormatter(hass, span) {
  const length = span ? span.end - span.start : 0;
  const amPm = useAmPm(hass);
  /** @type {Intl.DateTimeFormatOptions} */
  const options = length > 90 * 86_400_000
    ? { year: 'numeric', month: 'short', day: 'numeric' }
    : {
        month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit',
        ...(length > 0 && length < 600_000 ? { second: '2-digit' } : {}),
        hourCycle: amPm ? 'h12' : 'h23'
      };
  let format;
  try {
    format = new Intl.DateTimeFormat(hass?.locale?.language || 'en', { ...options, timeZone: 'UTC' });
  } catch {
    format = new Intl.DateTimeFormat('en', { ...options, timeZone: 'UTC' });
  }
  return (value) => (typeof value === 'number' && Number.isFinite(value) ? format.format(value) : String(value));
}

/**
 * Points moved to the wall clock, never running backwards: in a DST fall-back
 * the repeated hour would map onto the hour before it, so it stays at the
 * changeover instant instead.
 * @param {Array<{t: number, v: any}>} points - Sorted by time
 * @param {string} timeZone
 * @returns {Array<{t: number, v: any}>}
 */
export function pointsToWallClock(points, timeZone) {
  let last = -Infinity;
  return points.map(p => {
    last = Math.max(last, toWallClock(p.t, timeZone));
    return { ...p, t: last };
  });
}
