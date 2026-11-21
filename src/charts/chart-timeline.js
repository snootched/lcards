/**
 * rangeBar timeline: each source is a row, each run of one state a bar in that
 * state's colour, labelled with the state. Colours: the source's `color` (one
 * colour, or a state colour map: exact state, active / inactive /
 * unavailable / unknown, default), else Home Assistant's timeline colours
 * (theme state colours, then graph colours; utils/ha-state-color.js). Pure:
 * entity states, CSS variables, colour resolution and state text come in
 * through the context.
 *
 * @module charts/chart-timeline
 */

import { visibleRuns } from './chart-state-runs.js';
import { createTimelineColorer, stateClass } from '../utils/ha-state-color.js';
import { stateKeyFor } from '../utils/state-color-resolver.js';

/**
 * @typedef {Object} TimelineContext
 * @property {(entityId: string) => (import('../utils/ha-state-color.js').StateObj|null)} stateObjFor - An entity's state object now
 * @property {(state: string, stateObj?: import('../utils/ha-state-color.js').StateObj|null) => string} colorer - Home Assistant's timeline colours
 * @property {(value: string) => string} resolve - A configured colour made concrete (SVG fill)
 * @property {(stateObj: any, state: string) => string} formatState - State text for labels and the tooltip
 */

/**
 * A context for docs demos and tests: CSS variables from the document root,
 * colours as written, raw state text.
 * @param {Partial<TimelineContext> & { readVar?: (name: string) => string }} [overrides]
 * @returns {TimelineContext}
 */
export function defaultTimelineContext(overrides = {}) {
  const readVar = overrides.readVar ?? ((name) => (typeof document !== 'undefined' && typeof getComputedStyle === 'function'
    ? getComputedStyle(document.documentElement).getPropertyValue(name)
    : ''));
  return {
    stateObjFor: () => null,
    colorer: createTimelineColorer(readVar),
    resolve: (value) => value,
    formatState: (_stateObj, state) => state,
    ...overrides
  };
}

/**
 * An entity's state object from the context, or a bare one (its domain still
 * picks Home Assistant's colours) when the entity is not loaded.
 * @param {string|undefined} entityId
 * @param {TimelineContext} ctx
 * @returns {import('../utils/ha-state-color.js').StateObj|null}
 */
function entityStateObj(entityId, ctx) {
  if (!entityId) return null;
  return ctx.stateObjFor(entityId) ?? { entity_id: entityId, attributes: {} };
}

/**
 * The bar colour for one state of a source.
 * @param {Object} series - Normalised series (its `color`: a colour or a state map)
 * @param {string} state
 * @param {import('../utils/ha-state-color.js').StateObj|null} stateObj
 * @param {TimelineContext} ctx
 * @returns {string}
 */
export function timelineColor(series, state, stateObj, ctx) {
  const configured = series.color;
  if (typeof configured === 'string' && configured) return ctx.resolve(configured);
  if (configured && typeof configured === 'object') {
    const key = stateKeyFor({ actualState: state, classifiedState: stateClass(stateObj, state), colorConfig: configured });
    if (key !== null) return ctx.resolve(configured[key]);
  }
  return ctx.colorer(state, stateObj);
}

/**
 * ApexCharts rangeBar series: one per source, its bars on one row named after
 * the source. Each data point carries the state and its text for the label and
 * tooltip.
 * @param {Object} args
 * @param {Array<Object>} args.series - Normalised series, `name` resolved
 * @param {Array<Array<{t: number, v: any}>|undefined>} args.points - Points per series (text states)
 * @param {TimelineContext} args.ctx
 * @returns {Array<{name: string, data: Array<{x: string, y: [number, number], fillColor: string, strokeColor: string, state: string, label: string}>}>}
 */
export function buildTimelineSeries({ series, points, ctx }) {
  return series.map((s, index) => {
    const stateObj = entityStateObj(s.entity, ctx);
    const runs = visibleRuns(points[index] ?? [], s, stateObj);
    return {
      name: s.name,
      data: runs.map((run) => {
        const color = timelineColor(s, run.state, stateObj, ctx);
        return {
          x: s.name,
          y: /** @type {[number, number]} */ ([run.start, run.end]),
          // the outline in the bar's own colour, not the series colour
          fillColor: color,
          strokeColor: color,
          state: run.state,
          label: ctx.formatState(stateObj, run.state) || run.state
        };
      })
    };
  });
}

/**
 * A duration as Home Assistant's timeline tooltip writes it, largest units
 * first: "2 h 5 min", "45 s".
 * @param {number} ms
 * @returns {string}
 */
export function formatRunDuration(ms) {
  const total = Math.max(0, Math.round(ms / 1000));
  const d = Math.floor(total / 86400);
  const h = Math.floor((total % 86400) / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const parts = [];
  if (d) parts.push(`${d} d`);
  if (h) parts.push(`${h} h`);
  if (m && !d) parts.push(`${m} min`);
  if (s && !d && !h) parts.push(`${s} s`);
  return parts.join(' ') || '0 s';
}

/** Band opacity when a band sets none. */
export const STATE_BAND_OPACITY = 0.2;

/**
 * State bands: each band's runs (active ones by default) as x-axis range
 * annotations behind every series, coloured as timeline bars are, optionally
 * labelled with the state at the top (dark text on the band colour, like
 * threshold labels). Fully transparent states draw nothing.
 * @param {Object} args
 * @param {Array<Object>} args.bands - From normalizeStateBands()
 * @param {Array<Array<{t: number, v: any}>|undefined>} args.points - Text points per band (wall clock already applied)
 * @param {TimelineContext} args.ctx
 * @param {{fontFamily?: string, fontSize?: string}} [args.font]
 * @returns {Array<Object>} ApexCharts xaxis annotations
 */
export function buildBandAnnotations({ bands, points, ctx, font = {} }) {
  // SVG text fills can't read var(): the theme's dark text colour made concrete
  const dark = ctx.resolve('var(--lcars-text-dark, #000000)');
  const labelText = dark && !dark.includes('var(') ? dark : '#000000';
  return bands.flatMap((band, index) => {
    const stateObj = entityStateObj(band.entity, ctx);
    return visibleRuns(points[index] ?? [], band, stateObj).flatMap((run) => {
      const color = timelineColor(band, run.state, stateObj, ctx);
      if (!color || color === 'transparent') return [];
      return [{
        x: run.start,
        x2: run.end,
        fillColor: color,
        opacity: band.opacity ?? STATE_BAND_OPACITY,
        borderColor: 'transparent',
        strokeDashArray: 0,
        label: band.label ? {
          text: ctx.formatState(stateObj, run.state) || run.state,
          borderColor: 'transparent',
          orientation: 'horizontal',
          position: 'top',
          textAnchor: 'start',
          offsetY: -4,
          style: { background: color, color: labelText, ...font }
        } : { text: '' }
      }];
    });
  });
}
