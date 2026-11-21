/**
 * The scene clock (`clock: { date, rate }`): the date that `body` points,
 * `body` spheres and rings, `orbit` rings and the sky dome follow. Separate
 * from `time_scale`, which runs decorative motion (degree spins, scans,
 * drift). Pure, no three.js; wall time is passed in (performance.now() ms).
 *
 *   date: now | an ISO date ("2026-10-30", "2026-10-30T12:00:00Z")
 *   rate: live (real time) | days per second (0 holds, negative runs back)
 *
 * @module core/astrometrics/clock
 */

/** Days per second for `rate: live` (real time) */
export const LIVE_RATE = 1 / 86400;

/** Rates at most this fast (days per second) redraw on a timer, not every frame: one minute per second */
export const SLOW_RATE = 60 / 86400;

/**
 * The time slider's date stops (days per second), `live` in the middle.
 * @type {ReadonlyArray<{ rate: number, label: string }>}
 */
export const DATE_STOPS = [
  { rate: -365.25, label: '-1 y/s' },
  { rate: -30, label: '-30 d/s' },
  { rate: -1, label: '-1 d/s' },
  { rate: 0, label: 'Paused' },
  { rate: LIVE_RATE, label: 'Live' },
  { rate: 1 / 24, label: '1 h/s' },
  { rate: 1, label: '1 d/s' },
  { rate: 30, label: '30 d/s' },
  { rate: 365.25, label: '1 y/s' }
];

/**
 * The date stop nearest a rate (on a log scale away from 0).
 * @param {number} rate
 */
export function dateStop(rate) {
  let best = 0;
  const key = (/** @type {number} */ r) => (r === 0 ? 0 : Math.sign(r) * (Math.log10(Math.abs(r) * 86400) + 1));
  for (let i = 1; i < DATE_STOPS.length; i++) {
    if (Math.abs(key(DATE_STOPS[i].rate) - key(rate)) < Math.abs(key(DATE_STOPS[best].rate) - key(rate))) best = i;
  }
  return best;
}

/** Days in one of a rate's units (`1 h/s`, `30 d/s`, `1 y/s`) */
export const RATE_UNITS = Object.freeze({ s: 1 / 86400, min: 1 / 1440, h: 1 / 24, d: 1, w: 7, mo: 30, y: 365.25 });

/** A rate written with its unit: a number, the unit, optionally `/s` (`1 h/s`, `-30d`, `1 y/s`) */
export const RATE_PATTERN = '^\\s*-?\\d+(\\.\\d+)?\\s*(s|min|h|d|w|mo|y)\\s*(/\\s*s)?\\s*$';

/**
 * A `rate` value as days per second: `live` (or nothing) is real time; a
 * number is days per second; a string with its unit reads as the time
 * slider shows it (`1 h/s` an hour a second, `30 d/s`, `1 y/s`, `-1 d/s`).
 * @param {any} v
 * @returns {number | null} null when it is not a rate
 */
export function parseRate(v) {
  if (v === undefined || v === null || v === '' || v === 'live') return LIVE_RATE;
  if (typeof v === 'string') {
    const m = v.trim().toLowerCase().match(new RegExp(RATE_PATTERN));
    if (m) return Number(v.trim().match(/^-?\d+(\.\d+)?/)?.[0]) * RATE_UNITS[/** @type {keyof typeof RATE_UNITS} */ (m[2])];
  }
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

/**
 * A `date` value as ms: `now` (or nothing) is null (the wall clock), a
 * date-only ISO string is midnight UTC, a date and time without a zone
 * (Home Assistant's `2026-10-30 12:00:00` too) is local time.
 * @param {any} v
 * @returns {number | null | undefined} null for now, undefined when it is not a date
 */
export function parseDate(v) {
  if (v === undefined || v === null || v === '' || v === 'now') return null;
  if (v instanceof Date) return Number.isFinite(v.valueOf()) ? v.valueOf() : undefined;
  if (typeof v === 'number') return Number.isFinite(v) ? v : undefined;
  // Home Assistant's date and time states use a space ("2026-10-30 12:00:00", local time)
  const text = String(v).trim().replace(/^(\d{4}-\d\d-\d\d) (\d)/, '$1T$2');
  const ms = Date.parse(text);
  return Number.isFinite(ms) ? ms : undefined;
}

export class SceneClock {
  /**
   * @param {() => number} [epochNow] - the real date now, ms (Date.now)
   */
  constructor(epochNow = () => Date.now()) {
    this.epochNow = epochNow;
    /** Scene date (ms) at wall time `wall` */
    this.base = epochNow();
    /** Wall time (ms, performance.now) of the base */
    this.wall = 0;
    /** Days per second */
    this.rate = LIVE_RATE;
  }

  /**
   * The scene date now.
   * @param {number} wall - performance.now()
   * @returns {number} ms
   */
  date(wall) {
    return this.base + (wall - this.wall) * this.rate * 86400;
  }

  /**
   * Set the date, the rate, or both; the other keeps running on.
   * @param {{ date?: any, rate?: any }} opts - as in config (`now`, ISO, `live`, days per second)
   * @param {number} wall
   * @returns {boolean} false when a value was not understood (nothing changes for it)
   */
  set({ date, rate } = {}, wall) {
    let ok = true;
    const now = this.date(wall);
    this.wall = wall;
    this.base = now;
    if (date !== undefined) {
      const ms = parseDate(date);
      if (ms === undefined) ok = false;
      else this.base = ms ?? this.epochNow();
    }
    if (rate !== undefined) {
      const r = parseRate(rate);
      if (r === null) ok = false;
      else this.rate = r;
    }
    return ok;
  }

  /** Whether the date changes faster than a timer can show (redraw every frame) */
  get fast() {
    return Math.abs(this.rate) > SLOW_RATE;
  }

  /** Whether the date moves at all */
  get running() {
    return this.rate !== 0;
  }
}

/**
 * The text the time slider shows for a scene date: `2026-10-30 14:02` in
 * the browser's time zone, or UTC with `utc`.
 * @param {number} ms
 * @param {{ utc?: boolean }} [opts]
 */
export function formatSceneDate(ms, { utc = false } = {}) {
  const d = new Date(ms);
  if (!Number.isFinite(d.valueOf())) return '-';
  const y = utc ? d.getUTCFullYear() : d.getFullYear();
  const pad = (/** @type {number} */ n) => String(n).padStart(2, '0');
  const parts = utc
    ? [d.getUTCMonth() + 1, d.getUTCDate(), d.getUTCHours(), d.getUTCMinutes()]
    : [d.getMonth() + 1, d.getDate(), d.getHours(), d.getMinutes()];
  // astronomical years: 0 is 1 BC, -1 is 2 BC
  const year = y < 0 ? `-${String(-y).padStart(4, '0')}` : String(y).padStart(4, '0');
  return `${year}-${pad(parts[0])}-${pad(parts[1])} ${pad(parts[2])}:${pad(parts[3])}${utc ? ' UTC' : ''}`;
}
