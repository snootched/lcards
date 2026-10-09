<template>
  <div class="chart-demo" :class="{ 'is-editable': editable }">
    <div v-if="editable" class="chart-demo-toolbar">
      <label :for="`cd-${uid}-preset`">Start from</label>
      <select :id="`cd-${uid}-preset`" v-model="presetKey" @change="applyPreset">
        <option v-for="p in PRESETS" :key="p.key" :value="p.key">{{ p.label }}</option>
      </select>
      <button type="button" class="chart-demo-btn" @click="copyYaml">{{ copied ? 'Copied' : 'Copy YAML' }}</button>
    </div>

    <div class="chart-demo-body">
      <PlaygroundAssist v-if="editable" v-model="yamlText" card="lcards-chart" :schema="schemaRef" />

      <div class="chart-demo-panel">
        <div ref="chartEl" class="chart-demo-chart" :style="{ height: `${height}px` }"></div>
        <div v-if="!ready" class="chart-demo-overlay">Loading chart...</div>
        <div v-else-if="fatal" class="chart-demo-overlay is-error">{{ fatal }}</div>
      </div>
    </div>

    <ul v-if="messages.length" class="chart-demo-messages">
      <li v-for="(m, i) in messages" :key="i" :class="`is-${m.level}`">{{ m.text }}</li>
    </ul>

    <p class="chart-demo-caption">
      Live preview with generated sample data<span v-if="editable">: try the sensors below, or any entity id (it gets a sample signal)</span>.
    </p>
    <p v-if="editable" class="chart-demo-entities">
      <code v-for="e in SAMPLE_ENTITIES" :key="e">{{ e }}</code>
    </p>
  </div>
</template>

<script setup>
// Live chart demo for the docs. Uses the card's own modules (migration,
// series normalising, time window, group_by, options builder, ApexCharts
// adapter) on generated sample data, so demos match what the card draws.
import PlaygroundAssist from './PlaygroundAssist.vue'
import { ref, shallowRef, computed, watch, onMounted, onUnmounted, getCurrentInstance } from 'vue'
import { SAMPLE_ENTITIES, samplePoints, sampleStatistics, describeEntity, tokenLookup, LCARS_DEMO_VARS } from './chart-demo-data.js'

const props = defineProps({
  /** URI-encoded YAML (set by the ```yaml live fence) */
  src: { type: String, default: '' },
  /** Show the YAML editor and starter examples */
  editable: { type: Boolean, default: false },
  height: { type: Number, default: 260 }
})

const uid = getCurrentInstance()?.uid ?? Math.random().toString(36).slice(2)

const PRESETS = [
  { key: 'line', label: 'Line: one sensor', yaml: `type: custom:lcards-chart
sources:
  - entity: sensor.demo_temperature
` },
  { key: 'area', label: 'Area: two sensors with legend', yaml: `type: custom:lcards-chart
chart_type: area
sources:
  - entity: sensor.demo_temperature
    name: Inside
  - entity: sensor.demo_outdoor_temperature
    name: Outside
style:
  legend:
    show: true
` },
  { key: 'stats', label: 'Columns: daily energy (statistics)', yaml: `type: custom:lcards-chart
chart_type: column
graph_span: 7d
sources:
  - entity: sensor.demo_energy
    name: Energy per day
    statistics:
      type: change
      period: day
` },
  { key: 'group', label: 'Grouping: hourly max of a busy sensor', yaml: `type: custom:lcards-chart
chart_type: column
graph_span: 24h
sources:
  - entity: sensor.demo_power
    group_by:
      func: max
      duration: 1h
` },
  { key: 'axes', label: 'Two Y axes and reference lines', yaml: `type: custom:lcards-chart
yaxis:
  - id: temperature
  - id: humidity
    opposite: true
    min: 0
    max: 100
sources:
  - entity: sensor.demo_temperature
  - entity: sensor.demo_humidity
    yaxis_id: humidity
    stroke_dash: 4
style:
  thresholds:
    - value: 22
      label: Warm
      color: var(--lcars-red)
` },
  { key: 'candle', label: 'Candlestick (group_by ohlc)', yaml: `type: custom:lcards-chart
chart_type: candlestick
graph_span: 2d
sources:
  - entity: sensor.demo_outdoor_temperature
    group_by:
      func: ohlc
      duration: 3h
` },
  { key: 'onoff', label: 'On/off as steps', yaml: `type: custom:lcards-chart
sources:
  - entity: light.demo
    curve: stepline
    type: area
    opacity: 0.4
` },
  { key: 'pie', label: 'Donut: latest values', yaml: `type: custom:lcards-chart
chart_type: donut
sources:
  - entity: sensor.demo_power
    name: Kitchen
  - entity: sensor.demo_load_office
    name: Office
  - entity: sensor.demo_load_garage
    name: Garage
style:
  legend:
    show: true
` },
  { key: 'legacy', label: 'Older format (converted)', yaml: `type: custom:lcards-chart
sources: [series_1]
series_names: [Living room]
data_sources:
  series_1:
    entity: sensor.demo_temperature
    attribute: state
    history:
      preload: true
      hours: 48
` }
]

const presetKey = ref('line')
const yamlText = ref(props.src ? decodeURIComponent(props.src) : PRESETS[0].yaml)
const chartEl = ref(null)
const ready = ref(false)
const fatal = ref('')
const messages = ref([])
const copied = ref(false)

let mods = null
/** Card schema for the playground helpers (set once modules load) */
const schemaRef = shallowRef(null)
let chart = null
let renderTimer = null
let renderCount = 0

function applyPreset() {
  const preset = PRESETS.find(p => p.key === presetKey.value)
  if (preset) yamlText.value = preset.yaml
}

async function copyYaml() {
  try {
    await navigator.clipboard.writeText(yamlText.value)
    copied.value = true
    setTimeout(() => { copied.value = false }, 1500)
  } catch { /* clipboard blocked: nothing to do */ }
}

/** Points for one series from the sample data, mirroring ChartSeriesFetcher. */
function seriesPoints(series, config, span, now) {
  const { windowPoints, parseDuration } = mods
  const end = Math.min(span.end, now)
  const lead = parseDuration(series.group_by?.duration) ?? 0
  let raw
  if (series.kind === 'statistics') {
    raw = sampleStatistics(series.entity, series.statistics, span.start, end, series.fetchMinMax)
  } else {
    const entity = series.kind === 'datasource'
      ? (config.data_sources?.[series.datasource]?.entity ?? series.datasource)
      : series.entity
    raw = samplePoints(series.attribute ? `${entity}.${series.attribute}` : entity, span.start - lead, end)
  }
  return windowPoints(series, raw, span, now)
}

function render() {
  if (!mods || !chartEl.value) return
  const { yaml, migrateChartConfig, normalizeChartSources, arrayChartProblem, computeSpan,
    buildChartOptions, chartStyleDefaults, deepMerge, validator, schema, ApexCharts, getToken } = mods
  const out = []
  fatal.value = ''

  let config
  try {
    config = yaml.load(yamlText.value)
  } catch (error) {
    fatal.value = `YAML error: ${error.reason ?? error.message}`
    messages.value = out
    return
  }
  if (!config || typeof config !== 'object') {
    fatal.value = 'Enter a chart config (type: custom:lcards-chart ...)'
    messages.value = out
    return
  }

  const result = validator.validate(config, schema)
  for (const e of result.errors) out.push({ level: 'error', text: `${e.field}: ${e.message}` })
  for (const w of result.warnings) out.push({ level: 'warning', text: `${w.field}: ${w.message}` })

  const migration = migrateChartConfig(config)
  if (migration.changed) {
    out.push({ level: 'info', text: `Older format: the editor would convert it (${migration.notes.join('; ')}).` })
  }
  const canonical = migration.config
  const series = normalizeChartSources(canonical)
  if (!series.length) {
    fatal.value = 'Add at least one series under sources.'
    messages.value = out
    return
  }
  if (series.some(s => s.kind === 'datasource')) {
    out.push({ level: 'info', text: 'Data source series plot their entity here; processors run only on a real dashboard.' })
  }
  if (JSON.stringify(canonical.style ?? {}).includes('theme:')) {
    out.push({ level: 'info', text: 'theme: tokens resolve on a real dashboard; the preview shows fallbacks.' })
  }
  for (const s of series) {
    const problem = arrayChartProblem(s, canonical.chart_type || 'line')
    if (problem) out.push({ level: 'warning', text: problem })
  }

  const now = Date.now()
  const span = computeSpan(canonical, now)
  const display = series.map(s => {
    const info = describeEntity(s.entity ?? canonical.data_sources?.[s.datasource]?.entity ?? s.datasource)
    return { ...s, name: s.name ?? info.name, unit: s.unit ?? (s.attribute ? undefined : info.unit) }
  })
  const points = series.map(s => seriesPoints(s, canonical, span, now))
  const width = chartEl.value.clientWidth || 600

  try {
    const options = buildChartOptions({
      config: canonical,
      style: deepMerge(chartStyleDefaults(getToken), canonical.style || {}),
      series: display,
      points,
      span,
      size: [width, props.height]
    })
    options.chart = { ...options.chart, width: '100%', height: props.height }
    chart?.destroy()
    chart = new ApexCharts(chartEl.value, options)
    const thisRender = ++renderCount
    chart.render().catch(error => {
      if (thisRender === renderCount) fatal.value = `Chart error: ${error.message}`
    })
  } catch (error) {
    fatal.value = `Chart error: ${error.message}`
  }
  messages.value = out
}

watch(yamlText, () => {
  if (!props.editable) return
  clearTimeout(renderTimer)
  renderTimer = setTimeout(render, 400)
})

onMounted(async () => {
  globalThis.__LCARDS_VERSION__ ??= 'docs'
  const [apex, yamlMod, migration, sources, span, builder, fetcher, merge, palette, tokens, validation, chartSchema] =
    await Promise.all([
      import('apexcharts'),
      import('js-yaml'),
      import('../../../src/charts/chart-config-migration.js'),
      import('../../../src/charts/chart-sources.js'),
      import('../../../src/charts/chart-span.js'),
      import('../../../src/charts/chart-options-builder.js'),
      import('../../../src/charts/chart-series-fetcher.js'),
      import('../../../src/utils/deepMerge.js'),
      import('../../../src/core/themes/paletteInjector.js'),
      import('../../../src/core/packs/themes/tokens/lcardsDefaultTokens.js'),
      import('../../../src/core/validation-service/index.js'),
      import('../../../src/cards/schemas/chart-schema.js')
    ])

  // The default LCARS palette the card gets on a dashboard (once per page).
  if (!globalThis.__lcardsDocsPalette) {
    palette.injectPalette(palette.GREEN_ALERT_PALETTE)
    const root = document.documentElement
    for (const [name, value] of Object.entries(LCARS_DEMO_VARS)) {
      if (!getComputedStyle(root).getPropertyValue(name).trim()) root.style.setProperty(name, value)
    }
    globalThis.__lcardsDocsPalette = true
  }

  mods = {
    ApexCharts: apex.default,
    yaml: yamlMod.default ?? yamlMod,
    migrateChartConfig: migration.migrateChartConfig,
    normalizeChartSources: sources.normalizeChartSources,
    arrayChartProblem: sources.arrayChartProblem,
    computeSpan: span.computeSpan,
    parseDuration: span.parseDuration,
    buildChartOptions: builder.buildChartOptions,
    chartStyleDefaults: builder.chartStyleDefaults,
    windowPoints: fetcher.windowPoints,
    deepMerge: merge.deepMerge,
    getToken: tokenLookup(tokens.lcardsDefaultTokens),
    validator: new validation.CoreValidationService({ cacheResults: false }),
    schema: chartSchema.getChartSchema()
  }
  schemaRef.value = mods.schema
  ready.value = true
  render()
})

onUnmounted(() => {
  clearTimeout(renderTimer)
  chart?.destroy()
  chart = null
})
</script>

<style scoped>
.chart-demo {
  margin: 12px 0 24px;
}
.chart-demo-toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
  font-size: 14px;
}
.chart-demo-toolbar select {
  padding: 4px 8px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 6px;
  background: var(--vp-c-bg-soft);
  color: var(--vp-c-text-1);
}
.chart-demo-btn {
  padding: 4px 12px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 6px;
  background: var(--vp-c-bg-soft);
  color: var(--vp-c-text-1);
  cursor: pointer;
}
.chart-demo-btn:hover {
  border-color: var(--vp-c-brand-1);
}
.chart-demo-body {
  display: grid;
  gap: 12px;
}
.is-editable .chart-demo-body {
  grid-template-columns: minmax(0, 1.15fr) minmax(0, 1fr);
}
/* Keep the preview in view while scrolling the helpers (two-column layout only) */
@media (min-width: 861px) {
  .is-editable .chart-demo-panel {
    align-self: start;
    position: sticky;
    top: calc(var(--vp-nav-height) + 12px);
  }
}
@media (max-width: 860px) {
  .is-editable .chart-demo-body {
    grid-template-columns: 1fr;
  }
}
/* LCARS dashboards are dark; charts use light text on a black panel */
.chart-demo-panel {
  position: relative;
  padding: 8px;
  border-radius: 8px;
  background: #000;
}
.chart-demo-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  text-align: center;
  color: #ccc;
  background: rgba(0, 0, 0, 0.85);
  border-radius: 8px;
}
.chart-demo-overlay.is-error {
  color: #ff8a80;
}
.chart-demo-messages {
  margin: 8px 0 0;
  padding-left: 20px;
  font-size: 13px;
}
.chart-demo-messages .is-error {
  color: var(--vp-c-danger-1);
}
.chart-demo-messages .is-warning {
  color: var(--vp-c-warning-1);
}
.chart-demo-messages .is-info {
  color: var(--vp-c-text-2);
}
.chart-demo-caption {
  margin: 6px 0 0;
  font-size: 12px;
  color: var(--vp-c-text-3);
}
.chart-demo-entities {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin: 6px 0 0;
}
</style>
