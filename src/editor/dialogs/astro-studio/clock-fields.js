/**
 * @fileoverview The Studio's clock fields (pure, no DOM;
 * tests/editor/astro-studio-clock.test.js): the scene clock's rate as a
 * preset (the time slider's stops, in words) or a custom amount and unit,
 * and its date as now or a date and time.
 *
 * @module editor/dialogs/astro-studio/clock-fields
 */

import { DATE_STOPS, LIVE_RATE, RATE_UNITS, RATE_PATTERN, parseRate } from '../../../core/astrometrics/clock.js';

/** The rate units in order, with their names */
export const RATE_UNIT_NAMES = /** @type {const} */ ([
  ['s', 'second'], ['min', 'minute'], ['h', 'hour'], ['d', 'day'], ['w', 'week'], ['mo', 'month'], ['y', 'year']
]);

/** The custom choice of the rate dropdown */
export const CUSTOM_RATE = 'custom';

/**
 * A rate in words: "1 hour a second", "30 days a second, backward".
 * @param {number} amount
 * @param {string} unit
 */
export function rateWords(amount, unit) {
  const name = RATE_UNIT_NAMES.find(([u]) => u === unit)?.[1] ?? unit;
  const n = Math.abs(amount);
  return `${n} ${name}${n === 1 ? '' : 's'} a second${amount < 0 ? ', backward' : ''}`;
}

/** A stop's label ("-30 d/s") as its amount and unit @param {string} label */
const stopParts = (label) => {
  const m = /^(-?\d+(?:\.\d+)?)\s*([a-z]+)\/s$/.exec(label);
  return m ? { amount: Number(m[1]), unit: m[2] } : null;
};

/**
 * The rate dropdown's presets: live, paused and the time slider's stops,
 * slowest backward to fastest forward. `value` is what the config gets.
 * @type {{ value: string, label: string, rate: number }[]}
 */
export const RATE_PRESETS = DATE_STOPS.map((stop) => {
  if (stop.rate === LIVE_RATE) return { value: 'live', label: 'Live (real time)', rate: stop.rate };
  if (stop.rate === 0) return { value: '0', label: 'Paused', rate: 0 };
  const parts = stopParts(stop.label);
  return { value: stop.label, label: parts ? rateWords(parts.amount, parts.unit) : stop.label, rate: stop.rate };
});

/**
 * A rate value as the field shows it: a preset, or a custom amount and unit.
 * A template or an entity is neither (the form shows those itself).
 * @param {any} v
 * @returns {{ preset: string } | { amount: number, unit: string }}
 */
export function rateField(v) {
  const rate = parseRate(v);
  if (rate === null) return { preset: 'live' };
  const preset = RATE_PRESETS.find((p) => Math.abs(p.rate - rate) <= Math.abs(rate) * 1e-9);
  if (preset) return { preset: preset.value };
  if (typeof v === 'string' && new RegExp(RATE_PATTERN).test(v.trim().toLowerCase())) {
    const m = /^(-?\d+(?:\.\d+)?)\s*([a-z]+)/.exec(v.trim().toLowerCase());
    if (m) return { amount: Number(m[1]), unit: m[2] };
  }
  return { amount: rate, unit: 'd' };
}

/**
 * Any rate value as an amount and a unit, for the custom boxes: a preset
 * keeps its own rate (live is 1 second a second, paused 0 days).
 * @param {any} v
 * @returns {{ amount: number, unit: string }}
 */
export function customParts(v) {
  if (v === undefined || v === null || v === '' || v === 'live') return { amount: 1, unit: 's' };
  if (typeof v === 'string') {
    const m = /^\s*(-?\d+(?:\.\d+)?)\s*([a-z]+)/.exec(v.toLowerCase());
    if (m && m[2] in RATE_UNITS) return { amount: Number(m[1]), unit: m[2] };
  }
  const n = parseRate(v);
  return { amount: n ?? 1, unit: 'd' };
}

/**
 * A preset's config value: live and the stops as written, paused as 0.
 * @param {string} preset
 * @returns {string | number | undefined} undefined for live (the default)
 */
export function presetValue(preset) {
  if (preset === 'live') return undefined;
  if (preset === '0') return 0;
  return preset;
}

/**
 * A custom rate's config value: "2 h/s", "-30 d/s".
 * @param {number | undefined} amount
 * @param {string} unit
 */
export function customRateValue(amount, unit) {
  const n = Number.isFinite(amount) ? Number(amount) : 1;
  return `${n} ${unit in RATE_UNITS ? unit : 'd'}/s`;
}

/**
 * Whether a date value is "now" (or not set).
 * @param {any} v
 */
export const isNowDate = (v) => v === undefined || v === null || v === '' || v === 'now';

/**
 * A date value for Home Assistant's datetime selector (`YYYY-MM-DD HH:MM:SS`):
 * an ISO date or date and time as written; a bare date is its midnight.
 * @param {any} v
 * @returns {string | undefined}
 */
export function dateSelectorValue(v) {
  if (isNowDate(v) || typeof v !== 'string') return undefined;
  const m = /^(\d{4}-\d\d-\d\d)(?:[T ](\d\d:\d\d(?::\d\d)?))?/.exec(v.trim());
  if (!m) return undefined;
  const time = m[2] ? (m[2].length === 5 ? `${m[2]}:00` : m[2]) : '00:00:00';
  return `${m[1]} ${time}`;
}

/**
 * Today at midnight, local, as the datetime selector writes it.
 * @param {Date} [now]
 */
export function todayValue(now = new Date()) {
  const p = (/** @type {number} */ n) => String(n).padStart(2, '0');
  return `${now.getFullYear()}-${p(now.getMonth() + 1)}-${p(now.getDate())} 00:00:00`;
}
