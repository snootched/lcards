/**
 * @fileoverview An lcards-chart config that plots a processor preview: the raw
 * values and each processor's numeric output, from a data source with that
 * processing. Used by the editor's data source dialog ("Copy as chart YAML") and
 * the docs processor lab ("Use it in a chart").
 *
 * Chart series plot processor buffers, which must hold numbers: statistics fields
 * and duration minutes come from small expression processors added for the chart.
 *
 * @module core/data-sources/processor-chart-config
 */

import yaml from 'js-yaml';

/** A data source name: the given one, else the entity's object id. */
function sourceName(name, entity) {
  return name || /** @type {string} */ (String(entity ?? '').split('.').pop()).replace(/[^a-z0-9_]/gi, '_') || 'source';
}

/**
 * @param {Object} entry - Data source config (`entity`, `processing`, ...)
 * @param {Array<{name: string, axis: number, raw?: boolean}>} series - runProcessorPreview series
 * @param {Object} [options]
 * @param {string} [options.name] - Data source name (default: the entity's object id)
 * @param {number} [options.hours] - Chart span and history to preload (default: the entry's history.hours, else 24)
 * @returns {{chart: Object, helpers: string[]}|null} The chart config and the names of
 *   the processors added for it, or null without an entity or series
 */
export function processorChartConfig(entry, series, { name, hours } = {}) {
  if (!entry?.entity || !series?.length) return null;
  const ds = sourceName(name, entry.entity);
  const span = hours ?? entry.history?.hours ?? 24;
  const processing = { ...(entry.processing ?? {}) };
  const helpers = [];
  const second = series.some(s => s.axis === 1);
  const sources = [];

  for (const s of series) {
    const source = s.raw ? { datasource: ds, name: 'Raw', stroke_dash: 4 } : { datasource: ds };
    if (!s.raw) {
      const field = /^(.+)\.([a-z_]+)$/.exec(s.name);
      const minutes = /^(.+) \(min\)$/.exec(s.name);
      let buffer = s.name;
      if (field && processing[field[1]]?.type === 'statistics') {
        buffer = `${field[1]}_${field[2]}`;
        processing[buffer] = { type: 'expression', sources: [field[1]], expression: `sources[0] ? sources[0].${field[2]} : null` };
        helpers.push(buffer);
      } else if (minutes && processing[minutes[1]]?.type === 'duration') {
        buffer = `${minutes[1]}_minutes`;
        processing[buffer] = { type: 'expression', sources: [minutes[1]], expression: 'sources[0] ? sources[0].duration_ms / 60000 : null' };
        helpers.push(buffer);
      }
      source.buffer = buffer;
      source.name = s.name;
    }
    if (second && s.axis === 1) source.yaxis_id = 'second';
    sources.push(source);
  }

  const chart = {
    type: 'custom:lcards-chart',
    graph_span: `${span}h`,
    data_sources: {
      [ds]: {
        entity: entry.entity,
        // Preload the span the chart shows
        history: entry.history?.enabled === false ? entry.history : { ...(entry.history ?? {}), hours: span },
        ...Object.fromEntries(Object.entries(entry).filter(([k]) => !['entity', 'history', 'processing'].includes(k))),
        processing,
      },
    },
    sources,
  };
  if (second) chart.yaxis = [{ id: 'main' }, { id: 'second', opposite: true }];
  return { chart, helpers };
}

/**
 * processorChartConfig() as YAML, with a comment on any processors added for the chart.
 * @returns {string} '' when there is nothing to chart
 */
export function processorChartYaml(entry, series, options = {}) {
  const result = processorChartConfig(entry, series, options);
  if (!result) return '';
  const note = result.helpers.length
    ? `# Added for the chart (a series plots numbers): ${result.helpers.join(', ')}\n`
    : '';
  return note + yaml.dump(result.chart, { lineWidth: 120, noRefs: true, flowLevel: -1 });
}
