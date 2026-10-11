// The processor lab's logic (ProcessorLab.vue), kept free of Vue and the DOM so
// tests/docs/processor-lab.test.js can run every lab on the reference page in node.
// It parses the lab's YAML, generates sample history for its entity and runs the
// real processors through src/core/data-sources/processor-preview.js.
import { runProcessorPreview } from '../../../src/core/data-sources/processor-preview.js'
import { dataSourceBufferSize } from '../../../src/core/data-sources/DataSource.js'
import { samplePoints } from './chart-demo-data.js'
import yaml from 'js-yaml'

/** Hours of generated history a lab runs over. */
export const LAB_HOURS = 24
const DEFAULT_ENTITY = 'sensor.demo_temperature'

/**
 * The data source entry in a lab's config: the config itself (`entity:` +
 * `processing:`), or the first entry of `data_sources:`.
 * @param {Object} config - Parsed YAML
 * @returns {{entry: Object|null, name: string|null}}
 */
export function labEntry(config) {
  if (!config || typeof config !== 'object' || Array.isArray(config)) return { entry: null, name: null }
  if (config.data_sources && typeof config.data_sources === 'object') {
    const [name, entry] = Object.entries(config.data_sources)[0] ?? []
    return { entry: entry && typeof entry === 'object' ? entry : null, name: name ?? null }
  }
  return { entry: config, name: null }
}

/**
 * Run a lab.
 * @param {Object} config - Parsed YAML
 * @param {Object} [options]
 * @param {number} [options.now] - End of the sample history (epoch ms)
 * @param {Object} [options.validator] - CoreValidationService instance
 * @param {Object} [options.schema] - Schema of one data source entry
 * @returns {{entity: string, name: string|null, hours?: number, capacity: number, order: string[],
 *   series: Array, latest: Array, messages: Array<{level: string, text: string}>}}
 */
export function runLab(config, { now = Date.now(), validator = null, schema = null } = {}) {
  const messages = []
  const { entry, name } = labEntry(config)
  if (!entry) {
    return { entity: '', name, capacity: 0, order: [], series: [], latest: [],
      messages: [{ level: 'error', text: 'Write a data source: an entity: line and a processing: map.' }] }
  }
  const entity = typeof entry.entity === 'string' && entry.entity ? entry.entity : DEFAULT_ENTITY
  if (entity !== entry.entity) messages.push({ level: 'info', text: `No entity: running on ${DEFAULT_ENTITY}.` })

  if (validator && schema) {
    const result = validator.validate(entry, schema)
    for (const e of [...result.errors, ...result.warnings].slice(0, 6)) {
      messages.push({ level: 'warning', text: e.formattedMessage || `${e.field || 'config'}: ${e.message}` })
    }
  }

  const points = samplePoints(entity, now - LAB_HOURS * 3_600_000, now)
  const last = points.at(-1)
  const result = runProcessorPreview({ ...entry, entity }, points, {
    entityState: last ? { entity_id: entity, state: String(last.v), attributes: {} } : null,
  })
  for (const text of result.errors) messages.push({ level: 'error', text })

  return {
    entity,
    name,
    hours: LAB_HOURS,
    capacity: dataSourceBufferSize(entry).capacity,
    order: result.order,
    series: result.series,
    latest: result.latest,
    messages,
  }
}

/** The data source name a lab's chart config uses: its data_sources key, else the entity's object id. */
function sourceName(name, entity) {
  return name || String(entity).split('.').pop().replace(/[^a-z0-9_]/gi, '_') || 'lab'
}

/**
 * An lcards-chart config that plots what the lab charts: the raw values and each
 * processor's numeric output, from a data source with this lab's processing.
 * Chart series plot processor buffers, which must hold numbers: statistics fields
 * and duration minutes come from small expression processors added for the chart.
 * @param {Object} config - Parsed lab YAML
 * @param {ReturnType<typeof runLab>} run - The lab's result for that config
 * @returns {{chart: Object, helpers: string[]}|null} The chart card config and the names
 *   of the processors added for it, or null when the lab has an error
 */
export function labChartConfig(config, run) {
  const { entry, name } = labEntry(config)
  if (!entry || !run?.series?.length || run.messages.some(m => m.level === 'error')) return null
  const ds = sourceName(name, run.entity)
  const processing = { ...(entry.processing ?? {}) }
  const helpers = []
  const second = run.series.some(s => s.axis === 1)
  const sources = []

  for (const s of run.series) {
    const series = s.raw ? { datasource: ds, name: 'Raw', stroke_dash: 4 } : { datasource: ds }
    if (!s.raw) {
      const field = /^(.+)\.([a-z_]+)$/.exec(s.name)
      const minutes = /^(.+) \(min\)$/.exec(s.name)
      let buffer = s.name
      if (field && processing[field[1]]?.type === 'statistics') {
        buffer = `${field[1]}_${field[2]}`
        processing[buffer] = { type: 'expression', sources: [field[1]], expression: `sources[0] ? sources[0].${field[2]} : null` }
        helpers.push(buffer)
      } else if (minutes && processing[minutes[1]]?.type === 'duration') {
        buffer = `${minutes[1]}_minutes`
        processing[buffer] = { type: 'expression', sources: [minutes[1]], expression: 'sources[0] ? sources[0].duration_ms / 60000 : null' }
        helpers.push(buffer)
      }
      series.buffer = buffer
      series.name = s.name
    }
    if (second && s.axis === 1) series.yaxis_id = 'second'
    sources.push(series)
  }

  const chart = {
    type: 'custom:lcards-chart',
    graph_span: `${LAB_HOURS}h`,
    data_sources: {
      [ds]: {
        entity: run.entity,
        // Preload the same span of history the lab shows
        history: entry.history ?? { hours: LAB_HOURS },
        ...Object.fromEntries(Object.entries(entry).filter(([k]) => !['entity', 'history', 'processing'].includes(k))),
        processing,
      },
    },
    sources,
  }
  if (second) chart.yaxis = [{ id: 'main' }, { id: 'second', opposite: true }]
  return { chart, helpers }
}

/**
 * labChartConfig() as YAML for the lab's "Use it in a chart" panel, with a comment
 * on any processors added for the chart.
 * @returns {string} '' when the lab has an error
 */
export function labChartYaml(config, run) {
  const result = labChartConfig(config, run)
  if (!result) return ''
  const note = result.helpers.length
    ? `# Added for the chart (a series plots numbers): ${result.helpers.join(', ')}\n`
    : ''
  return note + yaml.dump(result.chart, { lineWidth: 120, noRefs: true, flowLevel: -1 })
}
