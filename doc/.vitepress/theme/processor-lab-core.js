// The processor lab's logic (ProcessorLab.vue), kept free of Vue and the DOM so
// tests/docs/processor-lab.test.js can run every lab on the reference page in node.
// It parses the lab's YAML, generates sample history for its entity and runs the
// real processors through src/core/data-sources/processor-preview.js.
import { runProcessorPreview } from '../../../src/core/data-sources/processor-preview.js'
import { dataSourceBufferSize } from '../../../src/core/data-sources/DataSource.js'
import { samplePoints } from './chart-demo-data.js'
import { processorChartConfig, processorChartYaml } from '../../../src/core/data-sources/processor-chart-config.js'

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

/**
 * An lcards-chart config that plots what the lab charts (processorChartConfig in
 * src/, shared with the editor's data source dialog).
 * @param {Object} config - Parsed lab YAML
 * @param {ReturnType<typeof runLab>} run - The lab's result for that config
 * @returns {{chart: Object, helpers: string[]}|null} null when the lab has an error
 */
export function labChartConfig(config, run) {
  const { entry, name } = labEntry(config)
  if (!entry || !run?.series?.length || run.messages.some(m => m.level === 'error')) return null
  return processorChartConfig({ ...entry, entity: run.entity }, run.series, { name, hours: entry.history?.hours ?? LAB_HOURS })
}

/**
 * labChartConfig() as YAML for the lab's "Use it in a chart" panel.
 * @returns {string} '' when the lab has an error
 */
export function labChartYaml(config, run) {
  const { entry, name } = labEntry(config)
  if (!entry || !run?.series?.length || run.messages.some(m => m.level === 'error')) return ''
  return processorChartYaml({ ...entry, entity: run.entity }, run.series, { name, hours: entry.history?.hours ?? LAB_HOURS })
}
