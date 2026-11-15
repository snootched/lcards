/**
 * Builds the complete ApexCharts options (including series) for a chart.
 *
 * Shared by the chart card and the documentation's live demos, so both draw
 * charts through exactly the same code. Everything theme- or HA-specific is
 * passed in (token lookup, theme-token resolution, hass).
 *
 * @module charts/chart-options-builder
 */

import { lcardsLog } from '../utils/lcards-logging.js';
import { ApexChartsAdapter } from './ApexChartsAdapter.js';
import { deepMerge } from '../utils/deepMerge.js';
import {
  chartTimeZone,
  toWallClock,
  pointsToWallClock,
  datetimeFormats,
  tooltipTimeFormatter,
  useAmPm
} from './chart-time-labels.js';
import { buildTimelineSeries, buildBandAnnotations, defaultTimelineContext, formatRunDuration } from './chart-timeline.js';

/**
 * Behaviour defaults the chart card registers with CoreConfigManager, which
 * merges them under the user config. No xaxis_type: a merged default would
 * look like the user's choice, and buildChartOptions picks the axis per chart
 * type when it is unset (category for horizontal bars, datetime for time charts).
 */
export const CHART_CARD_DEFAULTS = Object.freeze({
  chart_type: 'line',
  height: 300
});

/** Chart types that show one (latest) value per series instead of a time series. */
export const LATEST_VALUE_CHART_TYPES = new Set(['pie', 'donut', 'radialBar', 'polarArea']);

/** Chart types drawn against a time x-axis (the window is applied as min/max). */
export const TIME_AXIS_CHART_TYPES = new Set(['line', 'area', 'bar', 'column', 'scatter', 'heatmap', 'rangeArea', 'rangeBar', 'candlestick', 'boxPlot']);

/**
 * Style baseline from the theme's components.chart tokens, so minimal configs
 * get LCARS colours and typography. User style is merged on top of this.
 *
 * @param {(path: string) => any} getToken - Token lookup (null/undefined when missing)
 * @returns {Object} Partial style
 */
export function chartStyleDefaults(getToken) {
  const defaults = {};
  const seriesColors = getToken('components.chart.colors');
  const gridColor = getToken('components.chart.gridColor');
  const axisColor = getToken('components.chart.axisColor');
  const strokeWidth = getToken('components.chart.strokeWidth');
  const fontFamily = getToken('components.chart.fontFamily');
  const fontSize = getToken('components.chart.fontSize');

  if (seriesColors != null) defaults.colors = { series: seriesColors };
  if (gridColor != null) defaults.colors = { ...defaults.colors, grid: gridColor };
  if (axisColor != null) defaults.colors = { ...defaults.colors, axis: { x: axisColor, y: axisColor } };
  if (strokeWidth != null) defaults.stroke = { width: strokeWidth };
  if (fontFamily != null) defaults.typography = { font_family: fontFamily };
  if (fontSize != null) defaults.typography = { ...defaults.typography, font_size: fontSize };
  return defaults;
}

/**
 * Fix the datetime x-axis to the chart's time window.
 * @param {Object} config - Chart config
 * @param {{start: number, end: number}|null|undefined} span
 * @returns {{min?: number, max?: number}}
 */
export function windowAxis(config, span) {
  const xaxisType = config.xaxis_type || 'datetime';
  // Horizontal bars put time on the vertical (category) axis; min/max would
  // clamp the value axis instead and hide every bar.
  const chartType = config.chart_type || 'line';
  if (!span || xaxisType !== 'datetime' || !TIME_AXIS_CHART_TYPES.has(chartType) || chartType === 'bar') {
    return {};
  }
  // sync_group: ApexCharts syncs only charts whose window is exactly the same,
  // and each card computes "now" at its own moment. A rolling window ends at
  // the next whole minute instead, so members with the same graph_span match
  // (the card moves the axis on the minute).
  if (config.sync_group && !config.span?.start && !config.span?.end) {
    const end = Math.ceil(span.end / SYNC_WINDOW_STEP_MS) * SYNC_WINDOW_STEP_MS;
    return { min: end - (span.end - span.start), max: end };
  }
  return { min: span.start, max: span.end };
}

/** sync_group: rolling windows end on this step (the next whole minute). */
export const SYNC_WINDOW_STEP_MS = 60_000;

/**
 * Series in ApexCharts format.
 *
 * Time charts get `{ name, data: [{x, y}] }` per series (range charts take
 * array values). One-value charts (pie, donut, radialBar, polarArea) get the
 * latest value of each series; treemap and radar get one entry per series.
 *
 * @param {Object} args
 * @param {Array<Object>} args.series - Normalised series (with `name` resolved)
 * @param {Array<Array<{t: number, v: any}>|undefined>} args.points - Points per series
 * @param {string} args.chartType
 * @param {import('./chart-timeline.js').TimelineContext} [args.timeline] - rangeBar: entity states, colours, state text
 * @returns {Array<any>}
 */
export function buildApexSeries({ series, points, chartType, timeline }) {
  if (chartType === 'rangeBar') return buildTimelineSeries({ series, points, ctx: timeline ?? defaultTimelineContext() });

  const names = series.map(s => s.name);
  const latest = series.map((_, index) => {
    const list = points[index] ?? [];
    for (let i = list.length - 1; i >= 0; i--) {
      if (typeof list[i].v === 'number' && Number.isFinite(list[i].v)) return list[i].v;
    }
    return 0;
  });

  if (LATEST_VALUE_CHART_TYPES.has(chartType)) return latest;
  if (chartType === 'treemap') return [{ data: names.map((name, i) => ({ x: name, y: latest[i] })) }];
  if (chartType === 'radar') return [{ name: 'Current', data: latest }];

  return series.map((s, index) => {
    const entry = { name: names[index], data: (points[index] ?? []).map(p => ({ x: p.t, y: p.v })) };
    if (s.type) entry.type = s.type === 'column' ? 'bar' : s.type;
    return entry;
  });
}

/**
 * Time-axis values in Home Assistant's zone (chart-time-labels.js): on a
 * datetime axis the points and the window move to the zone's wall clock, which
 * ApexCharts reads as UTC (`datetimeUTC`), so its own ticks land on the zone's
 * hours and midnights. Without hass (docs demos) nothing moves. The card's live
 * updates use this too, so they match the full options build.
 *
 * @param {Object} args
 * @param {Object} args.config - Chart card config
 * @param {{start: number, end: number}|null} [args.span] - Time window
 * @param {Array<Array<{t: number, v: any}>|undefined>} args.points - Points per series
 * @param {Object} [args.hass]
 * @returns {{axis: {min?: number, max?: number}, points: Array<Array<{t: number, v: any}>|undefined>,
 *   wallClock: boolean, timeZone: string|null}}
 */
export function timeAxisData({ config, span = null, points, hass }) {
  const chartType = config.chart_type || 'line';
  const xaxisType = config.xaxis_type ?? (chartType === 'bar' ? 'category' : (TIME_AXIS_CHART_TYPES.has(chartType) ? 'datetime' : undefined));
  const axis = windowAxis(config, span);
  const timeZone = chartTimeZone(hass);
  const wallClock = !!timeZone && xaxisType === 'datetime'
    && TIME_AXIS_CHART_TYPES.has(chartType) && chartType !== 'bar';
  if (!wallClock || !timeZone) return { axis, points, wallClock: false, timeZone };
  return {
    axis: axis.min !== undefined && axis.max !== undefined
      ? { min: toWallClock(axis.min, timeZone), max: toWallClock(axis.max, timeZone) }
      : axis,
    points: points.map(list => (list ? pointsToWallClock(list, timeZone) : list)),
    wallClock: true,
    timeZone
  };
}

/**
 * Complete ApexCharts options, including `series`.
 *
 * @param {Object} args
 * @param {Object} args.config - Chart card config
 * @param {Object} args.style - Style to use (theme defaults, rule patches etc. already merged)
 * @param {Array<Object>} args.series - Normalised series with `name`/`unit` resolved
 * @param {Array<Array<{t: number, v: any}>|undefined>} args.points - Points per series
 * @param {{start: number, end: number}|null} [args.span] - Time window
 * @param {[number, number]} [args.size] - Container size
 * @param {Object} [args.hass] - For locale-aware formatting
 * @param {(style: Object) => Object} [args.resolveStyle] - Theme token resolution
 * @param {Element|null} [args.element] - The chart card: CSS variables in colours resolve against it
 * @param {import('./chart-timeline.js').TimelineContext} [args.timeline] - rangeBar and state bands: entity states, colours, state text
 * @param {string} [args.chartId] - Unique ApexCharts id (sync_group needs one per chart)
 * @param {Array<Object>} [args.bands] - From normalizeStateBands()
 * @param {Array<Array<{t: number, v: any}>|undefined>} [args.bandPoints] - Text points per band
 * @returns {Object} ApexCharts options
 */
export function buildChartOptions({ config, style, series, points, span = null, size = [400, 200], hass, resolveStyle, element = null, timeline, chartId, bands = [], bandPoints = [] }) {
  const chartType = config.chart_type || 'line';
  let enhancedStyle = { chart_type: chartType, ...style };

  // The x-axis type and time window go through chart_options (highest
  // precedence) so type defaults can't undo them; user chart_options still win.
  // Time charts default to a datetime axis even when xaxis_type isn't set.
  // Horizontal bars get one time label per bar on a category axis (ApexCharts'
  // datetime axis doesn't work sideways).
  const xaxisType = config.xaxis_type ?? (chartType === 'bar' ? 'category' : (TIME_AXIS_CHART_TYPES.has(chartType) ? 'datetime' : undefined));
  const time = timeAxisData({ config, span, points, hass });
  const { axis, wallClock, timeZone } = time;
  points = time.points;

  if (xaxisType || axis.min !== undefined) {
    const timeLabels = wallClock ? {
      xaxis: { labels: { datetimeUTC: true, datetimeFormatter: datetimeFormats(useAmPm(hass)) } },
      tooltip: { x: { formatter: tooltipTimeFormatter(hass, span) } }
    } : {};
    enhancedStyle = {
      ...enhancedStyle,
      chart_options: deepMerge(
        deepMerge(timeLabels, { xaxis: { ...(xaxisType && { type: xaxisType }), ...axis } }),
        enhancedStyle.chart_options || {}
      )
    };
  }

  // Mixed charts: scatter series need visible markers (line charts default to 0).
  if (series.some(s => s.type === 'scatter') && !enhancedStyle.markers?.size) {
    enhancedStyle = { ...enhancedStyle, markers: { ...enhancedStyle.markers, size: 6 } };
  }

  if (resolveStyle) enhancedStyle = resolveStyle(enhancedStyle);

  const options = ApexChartsAdapter.generateOptions(enhancedStyle, size, {
    hass,
    element,
    series,
    yaxis: config.yaxis,
    span,
    // Zone raw x values are read in by date formatters: wall-clock values are
    // already the zone's time written as UTC.
    timeZone: wallClock ? 'UTC' : (timeZone ?? undefined)
  });

  // One-value-per-series charts are labelled with the series names
  const names = series.map(s => s.name);
  if (LATEST_VALUE_CHART_TYPES.has(chartType)) {
    options.labels = names;
  } else if (chartType === 'radar') {
    options.xaxis = { ...options.xaxis, type: 'category', categories: names };
  }

  if (chartType === 'rangeBar') applyTimelineLabels(options, { style: enhancedStyle, hass, span, wallClock });

  if (config.sync_group) applySyncGroup(options, { group: String(config.sync_group), chartId, chartType });

  // State bands behind the series, on the same wall clock as the points
  if (bands.length) {
    const bandAnnotations = buildBandAnnotations({
      bands,
      points: timeAxisData({ config, span, points: bandPoints, hass }).points,
      ctx: timeline ?? defaultTimelineContext(),
      font: { fontFamily: options.chart?.fontFamily, fontSize: options.dataLabels?.style?.fontSize }
    });
    options.annotations = { ...options.annotations, xaxis: [...(options.annotations?.xaxis ?? []), ...bandAnnotations] };
  }

  return { ...options, series: buildApexSeries({ series, points, chartType, timeline }) };
}

/** @param {any} text */
const escapeHtml = (text) => String(text ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] ?? c);

/**
 * rangeBar: the state's text on each bar (hidden where it doesn't fit), and a
 * tooltip with the row, the state, its start and end and how long it lasted.
 * A tooltip formatter or data label settings of the user's own win.
 * @param {any} options - ApexCharts options (mutated)
 * @param {{style: any, hass: any, span: any, wallClock: boolean}} args
 */
function applyTimelineLabels(options, { style, hass, span, wallClock }) {
  /** @param {any} opts */
  const pointOf = (opts) => opts?.w?.config?.series?.[opts.seriesIndex]?.data?.[opts.dataPointIndex];
  options.dataLabels = {
    ...options.dataLabels,
    formatter: (/** @type {any} */ _value, /** @type {any} */ opts) => pointOf(opts)?.label ?? ''
  };
  options.plotOptions = {
    ...options.plotOptions,
    bar: { ...options.plotOptions?.bar, dataLabels: { hideOverflowingLabels: true, ...options.plotOptions?.bar?.dataLabels } }
  };
  if (style.formatters?.tooltip) return;
  // Wall-clock values read as UTC; without a zone (docs demos) the browser's own
  const time = wallClock ? tooltipTimeFormatter(hass, span) : (/** @type {number} */ v) => new Date(v).toLocaleString(hass?.locale?.language || undefined);
  options.tooltip = {
    ...options.tooltip,
    custom: (/** @type {any} */ opts) => {
      const point = pointOf(opts);
      if (!point) return '';
      const [start, end] = point.y;
      const row = opts.w.config.series[opts.seriesIndex]?.name ?? point.x;
      return `<div class="apexcharts-tooltip-text lcards-chart-tooltip lcards-timeline-tooltip">`
        + `<div class="lcards-timeline-row">${escapeHtml(row)}</div>`
        + `<div class="lcards-timeline-state"><span class="lcards-timeline-swatch" style="display:inline-block;flex:none;width:0.75em;height:0.75em;margin-inline-end:0.5em;border-radius:50%;background:${escapeHtml(point.fillColor)}"></span>${escapeHtml(point.label)}</div>`
        + `<div class="lcards-timeline-time">${escapeHtml(time(start))} – ${escapeHtml(time(end))}</div>`
        + `<div class="lcards-timeline-duration">${escapeHtml(formatRunDuration(end - start))}</div>`
        + `</div>`;
    }
  };
}

/** Y-axis label width sync_group members get, so their plot areas line up. */
export const SYNC_GROUP_LABEL_WIDTH = 60;

/**
 * sync_group: ApexCharts' own group (tooltips, crosshair and zoom between
 * charts with the same window; a timeline never syncs, so it stays out) and a
 * minimum y-axis label width, so the plots of stacked cards line up. A label
 * width or chart id of the user's own (style.chart_options) wins.
 * @param {any} options - ApexCharts options (mutated)
 * @param {{group: string, chartId?: string, chartType: string}} args
 */
function applySyncGroup(options, { group, chartId, chartType }) {
  if (chartType !== 'rangeBar') {
    const events = options.chart?.events ?? {};
    let resetting = false;
    options.chart = {
      ...options.chart,
      group,
      id: options.chart?.id ?? chartId ?? `lcards-chart-${group}-${Math.random().toString(36).slice(2, 10)}`,
      events: {
        ...events,
        // ApexCharts copies a zoom to the group but marks only the chart you
        // zoomed as zoomed: the others get no reset, and its reset skips them.
        // Zoom each sibling through its own zoomX() so all of them are zoomed.
        zoomed: (/** @type {any} */ chart, /** @type {any} */ range) => {
          events.zoomed?.(chart, range);
          if (resetting) { resetting = false; return; }
          // After ApexCharts' own group update, which re-renders the siblings
          // unzoomed (a sibling zoomed before it would lose its reset control)
          const xaxis = range?.xaxis ? { min: range.xaxis.min, max: range.xaxis.max } : undefined;
          setTimeout(() => zoomSiblings(chart, xaxis), 0);
        },
        beforeResetZoom: (/** @type {any} */ chart, /** @type {any} */ w) => {
          resetting = true; // the zoomed event that follows is the reset, not a zoom
          return events.beforeResetZoom?.(chart, w);
        }
      }
    };
  }
  /** @param {any} axis */
  const widen = (axis) => ({ ...axis, labels: { ...axis?.labels, minWidth: axis?.labels?.minWidth ?? SYNC_GROUP_LABEL_WIDTH } });
  options.yaxis = Array.isArray(options.yaxis) ? options.yaxis.map(widen) : widen(options.yaxis);
}

/** True while zoomSiblings() zooms the group, so the siblings' own zoomed events don't echo. */
let zoomingSiblings = false;

/**
 * Mark every chart in the source's ApexCharts group zoomed to the same x
 * range, as a zoom by hand does, so each shows its reset control and the
 * group reset (which skips charts not marked zoomed) resets all of them.
 * ApexCharts' own group update has normally applied the range already (and
 * then an update with the same range draws nothing); a sibling that missed it
 * gets the range here, keeping its own window as the range its reset returns
 * to. Neither fires a zoomed event, so nothing echoes.
 * @param {any} chart - The ApexCharts instance that was zoomed
 * @param {{min?: number, max?: number}|undefined} xaxis
 */
function zoomSiblings(chart, xaxis) {
  if (zoomingSiblings || !Number.isFinite(xaxis?.min) || !Number.isFinite(xaxis?.max)) return;
  zoomingSiblings = true;
  try {
    for (const sibling of chart?.getGroupedCharts?.() ?? []) {
      const w = sibling?.w;
      if (!w?.interact || w.globals?.isDestroyed) continue;
      w.interact.zoomed = true;
      if (w.config?.xaxis?.min !== xaxis?.min || w.config?.xaxis?.max !== xaxis?.max) {
        sibling.updateOptions({ xaxis: { min: xaxis?.min, max: xaxis?.max } }, false, false, false, false)
          ?.catch?.((/** @type {any} */ error) => lcardsLog.warn('[ChartOptions] sync_group zoom update failed:', error));
      }
      // The reset control a mount draws for a zoomed chart without a toolbar
      // (ApexCharts' mount(): createToolbar({ resetOnly: true }))
      const toolbar = sibling.toolbar;
      if (!w.config?.chart?.toolbar?.show && toolbar?.resetControlDue?.() && !toolbar._drawnForZoom) {
        toolbar.createToolbar({ resetOnly: true });
      }
    }
  } finally {
    zoomingSiblings = false;
  }
}

