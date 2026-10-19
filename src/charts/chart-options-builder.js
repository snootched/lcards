/**
 * Builds the complete ApexCharts options (including series) for a chart.
 *
 * Shared by the chart card and the documentation's live demos, so both draw
 * charts through exactly the same code. Everything theme- or HA-specific is
 * passed in (token lookup, theme-token resolution, hass).
 *
 * @module charts/chart-options-builder
 */

import { ApexChartsAdapter } from './ApexChartsAdapter.js';
import { deepMerge } from '../utils/deepMerge.js';

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
  return { min: span.start, max: span.end };
}

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
 * @returns {Array<any>}
 */
export function buildApexSeries({ series, points, chartType }) {
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
 * @returns {Object} ApexCharts options
 */
export function buildChartOptions({ config, style, series, points, span = null, size = [400, 200], hass, resolveStyle }) {
  const chartType = config.chart_type || 'line';
  let enhancedStyle = { chart_type: chartType, ...style };

  // The x-axis type and time window go through chart_options (highest
  // precedence) so type defaults can't undo them; user chart_options still win.
  // Time charts default to a datetime axis even when xaxis_type isn't set.
  const axis = windowAxis(config, span);
  // Horizontal bars get one time label per bar on a category axis (ApexCharts'
  // datetime axis doesn't work sideways).
  const xaxisType = config.xaxis_type ?? (chartType === 'bar' ? 'category' : (TIME_AXIS_CHART_TYPES.has(chartType) ? 'datetime' : undefined));
  if (xaxisType || axis.min !== undefined) {
    enhancedStyle = {
      ...enhancedStyle,
      chart_options: deepMerge(
        { xaxis: { ...(xaxisType && { type: xaxisType }), ...axis } },
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
    series,
    yaxis: config.yaxis,
    span
  });

  // One-value-per-series charts are labelled with the series names
  const names = series.map(s => s.name);
  if (LATEST_VALUE_CHART_TYPES.has(chartType)) {
    options.labels = names;
  } else if (chartType === 'radar') {
    options.xaxis = { ...options.xaxis, type: 'category', categories: names };
  }

  return { ...options, series: buildApexSeries({ series, points, chartType }) };
}
