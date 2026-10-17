/**
 * Turn a chart config's `sources[]` into series descriptors the fetcher and
 * the ApexCharts adapter use. Legacy configs are migrated first, so there is
 * a single code path. Pure.
 *
 * @module charts/chart-sources
 */

import { migrateChartConfig } from './chart-config-migration.js';
import { ARRAY_FUNCS } from './chart-group-by.js';

/** Chart types whose points are arrays rather than single values. */
export const ARRAY_CHART_TYPES = new Set(['rangeArea', 'rangeBar', 'boxPlot', 'candlestick']);

/**
 * @typedef {Object} ChartSeries
 * @property {'history'|'statistics'|'datasource'} kind
 * @property {string} [entity]
 * @property {string} [attribute]
 * @property {{type: string, period: string}} [statistics]
 * @property {string} [datasource]
 * @property {string} [buffer]
 * @property {{func?: string, duration: string, fill?: string}} [group_by]
 * @property {string} [name]
 * @property {string} [unit]
 * @property {number} [float_precision]
 * @property {string} [type]
 * @property {string} [curve]
 * @property {number} [stroke_width]
 * @property {number} [stroke_dash]
 * @property {string} [color]
 * @property {number} [opacity]
 * @property {string} [yaxis_id]
 * @property {boolean} [fetchMinMax] - statistics: fetch [min, max] per period (rangeArea)
 */

/**
 * @param {Object} config - Chart card config (legacy or canonical)
 * @returns {ChartSeries[]}
 */
export function normalizeChartSources(config) {
  const { config: canonical } = migrateChartConfig(config ?? {});
  const sources = Array.isArray(canonical?.sources) ? canonical.sources : [];

  return sources
    .filter(item => item && typeof item === 'object' && (item.entity || item.datasource))
    .map(item => {
      if (item.datasource) {
        return { ...item, kind: 'datasource' };
      }
      if (item.statistics) {
        return {
          ...item,
          kind: 'statistics',
          statistics: { type: item.statistics.type ?? 'mean', period: item.statistics.period ?? 'hour' },
          // A range area from statistics plots each period's min..max band.
          fetchMinMax: canonical.chart_type === 'rangeArea' && !item.group_by
        };
      }
      return { ...item, kind: 'history' };
    });
}

/**
 * Whether a series produces array values (for rangeArea/boxPlot/candlestick).
 * @param {ChartSeries} series
 * @returns {boolean}
 */
export function seriesProducesArrays(series) {
  return ARRAY_FUNCS.has(series.group_by?.func ?? '');
}

/**
 * Explain why a series can't feed an array chart type, or null when it can.
 * @param {ChartSeries} series
 * @param {string} chartType
 * @returns {string|null}
 */
export function arrayChartProblem(series, chartType) {
  if (!ARRAY_CHART_TYPES.has(chartType)) return null;
  if (chartType === 'rangeArea' && series.kind === 'statistics') return null; // min/max fetched
  const need = { rangeArea: 'minmax', boxPlot: 'box', candlestick: 'ohlc' }[chartType];
  if (!need) return `${chartType} needs interval data the chart can't build yet`;
  return series.group_by?.func === need
    ? null
    : `${chartType} needs group_by with func: ${need}`;
}
