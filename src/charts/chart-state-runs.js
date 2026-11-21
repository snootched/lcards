/**
 * Runs of one state: an entity's history as text states, turned into
 * `{ state, start, end }` spans for the timeline (rangeBar) and state bands.
 * Pure.
 *
 * @module charts/chart-state-runs
 */

import { parseDuration } from './chart-span.js';
import { stateClass } from '../utils/ha-state-color.js';

/** Class words a `states` filter takes besides exact states. */
export const STATE_CLASS_WORDS = new Set(['active', 'inactive', 'unavailable']);

/**
 * @typedef {{ state: string, start: number, end: number }} StateRun
 */

/**
 * Consecutive points of one state as runs. Each run ends where the next state
 * starts; the last ends at the last point (the fetcher carries the current
 * state to now, or the window's end). Points must be sorted and already
 * trimmed to the window.
 * @param {Array<{t: number, v: any}>} points
 * @returns {StateRun[]}
 */
export function stateRuns(points) {
  /** @type {StateRun[]} */
  const runs = [];
  for (const p of points ?? []) {
    if (p?.v === null || p?.v === undefined || !Number.isFinite(p.t)) continue;
    const state = String(p.v);
    const last = runs[runs.length - 1];
    if (last) last.end = p.t;
    if (last && last.state === state) continue;
    runs.push({ state, start: p.t, end: p.t });
  }
  // A run that starts at the very last point (a change at the right edge) has no length.
  return runs.filter((r) => r.end > r.start);
}

/**
 * Merge runs shorter than `minDuration` into the run before them (the first
 * run into the one after it), then join neighbours that now have the same
 * state. Hides flicker such as a thermostat cycling for seconds.
 * @param {StateRun[]} runs
 * @param {number} minDuration - ms; 0 or less keeps every run
 * @returns {StateRun[]}
 */
export function mergeShortRuns(runs, minDuration) {
  if (!(minDuration > 0) || runs.length < 2) return runs;
  /** @type {StateRun[]} */
  const out = [];
  // Short runs before the first long one wait here, then join it
  let carryStart = NaN;
  let carryEnd = NaN;
  let carryState = '';
  for (const run of runs) {
    const short = run.end - run.start < minDuration;
    if (short && out.length) {
      out[out.length - 1].end = run.end;
      continue;
    }
    if (short) {
      if (Number.isNaN(carryStart)) { carryStart = run.start; carryState = run.state; }
      carryEnd = run.end;
      continue;
    }
    const next = { ...run, start: Number.isNaN(carryStart) ? run.start : carryStart };
    carryStart = NaN;
    const last = out[out.length - 1];
    if (last && last.state === next.state) last.end = next.end;
    else out.push(next);
  }
  if (!Number.isNaN(carryStart)) out.push({ state: carryState, start: carryStart, end: carryEnd }); // every run was short
  return out;
}

/**
 * Whether a state passes a `states` filter: an exact state, or its class
 * (active or inactive as Home Assistant splits states; unavailable, which
 * takes unknown too).
 * @param {string} state
 * @param {string[]|undefined|null} filter - No filter: every state
 * @param {import('../utils/ha-state-color.js').StateObj|null|undefined} stateObj
 * @returns {boolean}
 */
export function stateMatches(state, filter, stateObj) {
  if (!Array.isArray(filter) || !filter.length) return true;
  if (filter.includes(state)) return true;
  return filter.includes(stateClass(stateObj, state));
}

/**
 * The runs to draw: merged by min_duration, then filtered by states.
 * @param {Array<{t: number, v: any}>} points
 * @param {{ states?: string[], min_duration?: string }} options
 * @param {import('../utils/ha-state-color.js').StateObj|null|undefined} stateObj
 * @returns {StateRun[]}
 */
export function visibleRuns(points, { states, min_duration } = {}, stateObj = null) {
  const minMs = parseDuration(min_duration) ?? 0;
  return mergeShortRuns(stateRuns(points), minMs).filter((r) => stateMatches(r.state, states, stateObj));
}
