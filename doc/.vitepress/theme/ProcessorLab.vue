<template>
  <div ref="rootEl" class="processor-lab">
    <div class="processor-lab-toolbar">
      <span class="processor-lab-badge">Lab</span>
      <span class="processor-lab-entity">{{ run?.entity }}</span>
      <span class="processor-lab-spacer"></span>
      <button type="button" class="processor-lab-btn" @click="editing = !editing">{{ editing ? 'Done' : 'Edit' }}</button>
      <button v-if="changed" type="button" class="processor-lab-btn" @click="reset">Reset</button>
    </div>

    <!-- The example as written (rendered at build time); the editor replaces it while editing. -->
    <div v-show="!editing" class="processor-lab-source"><slot /></div>
    <PlaygroundAssist v-if="editing" v-model="yamlText" card="lcards-processor-lab" :schema="schema" />

    <div class="processor-lab-panel">
      <div ref="chartEl" class="processor-lab-chart"></div>
      <div v-if="!run" class="processor-lab-overlay">Loading lab...</div>
    </div>

    <ul v-if="run?.messages.length" class="processor-lab-messages">
      <li v-for="(m, i) in run.messages" :key="i" :class="`is-${m.level}`">{{ m.text }}</li>
    </ul>

    <p v-if="run?.order.length" class="processor-lab-order">Order: {{ run.order.join(' → ') }}</p>
    <table v-if="run?.latest.length" class="processor-lab-table">
      <thead><tr><th>Processor</th><th>Type</th><th>Input</th><th>Latest value</th></tr></thead>
      <tbody>
        <tr v-for="row in run.latest" :key="row.key">
          <td><code>{{ row.key }}</code></td>
          <td>{{ row.type }}</td>
          <td>{{ row.input }}</td>
          <td>{{ row.value }}</td>
        </tr>
      </tbody>
    </table>

    <details v-if="chartYaml" class="processor-lab-chart-yaml">
      <summary>Use it in a chart</summary>
      <p>An <code>lcards-chart</code> card that plots the same series from a data source with this processing:</p>
      <div class="processor-lab-chart-yaml-code">
        <button type="button" class="processor-lab-btn" @click="copyChart">{{ copied ? 'Copied' : 'Copy' }}</button>
        <pre><code>{{ chartYaml }}</code></pre>
      </div>
    </details>

    <p v-if="run?.entity" class="processor-lab-caption">
      The real LCARdS processors, run over {{ run.hours }} hours of generated history (a point every 5 minutes)
      for {{ run.entity }}. A live data source keeps its last {{ run.capacity }} points for window-based
      processors. Edit the YAML: any <code>sensor.*</code> id gets a sample signal.
    </p>
  </div>
</template>

<script setup>
// Processor lab for the processor reference page: a ```yaml lab block renders its
// YAML (slot), a chart of the raw sample series against every processor's output,
// and each processor's latest value. Logic in processor-lab-core.js, loaded on demand
// (the component itself renders at build time, so its YAML is in the page HTML).
import { ref, shallowRef, computed, watch, onMounted, onUnmounted, defineAsyncComponent } from 'vue'

const PlaygroundAssist = defineAsyncComponent(() => import('./PlaygroundAssist.vue'))

const props = defineProps({
  /** URI-encoded YAML (set by the ```yaml lab fence) */
  src: { type: String, default: '' }
})

const original = decodeURIComponent(props.src)
const yamlText = ref(original)
const editing = ref(false)
const changed = computed(() => yamlText.value !== original)
const run = shallowRef(null)
const chartYaml = ref('')
const copied = ref(false)
const schema = shallowRef(null)
const rootEl = ref(null)
const chartEl = ref(null)

let mods = null
let chart = null
let observer = null
let timer = null

const COLORS = ['#ff9966', '#99ccff', '#ffcc66', '#cc99ff', '#66cc99', '#ff6666', '#9999ff', '#ffaacc']
const fmt = (v) => (Math.abs(v) >= 100 ? v.toFixed(0) : Math.abs(v) >= 1 ? v.toFixed(1) : v.toPrecision(2))

function chartOptions(series) {
  const named = series.map((s, i) => ({ ...s, color: s.raw ? '#8a8a99' : COLORS[(i - 1) % COLORS.length] }))
  const second = named.find(s => s.axis === 1)?.name
  return {
    chart: { type: 'line', height: 260, background: 'transparent', foreColor: '#cfcfd8', animations: { enabled: false },
      toolbar: { show: false }, zoom: { enabled: false } },
    theme: { mode: 'dark' },
    series: named.map(s => ({ name: s.name, data: s.points.map(p => [p.t, p.v]) })),
    colors: named.map(s => s.color),
    stroke: { width: named.map(s => (s.raw ? 1.5 : 2.5)), curve: 'straight', dashArray: named.map(s => (s.raw ? 3 : 0)) },
    xaxis: { type: 'datetime', labels: { datetimeUTC: false } },
    yaxis: named.map((s, i) => ({
      seriesName: s.axis === 1 ? second : 'raw',
      opposite: s.axis === 1,
      show: i === 0 || s.name === second,
      labels: { formatter: (v) => (Number.isFinite(v) ? fmt(v) : '') },
    })),
    legend: { show: true, position: 'top', horizontalAlign: 'left' },
    grid: { borderColor: '#333' },
    tooltip: { theme: 'dark', x: { format: 'HH:mm' } },
  }
}

async function render() {
  if (!mods) return
  let config
  try {
    config = mods.yaml.load(yamlText.value)
  } catch (error) {
    run.value = { ...(run.value ?? { order: [], latest: [], series: [] }), messages: [{ level: 'error', text: `YAML: ${String(error.message).split('\n')[0]}` }] }
    chartYaml.value = ''
    return
  }
  const result = mods.runLab(config, { validator: mods.validator, schema: schema.value })
  run.value = result
  chartYaml.value = mods.labChartYaml(config, result)
  const options = chartOptions(result.series.length ? result.series : [{ name: 'raw', points: [], axis: 0, raw: true }])
  if (chart) {
    // Series and axes can change shape between edits: rebuild rather than update.
    chart.destroy()
    chart = null
  }
  chart = new mods.ApexCharts(chartEl.value, options)
  await chart.render()
}

async function copyChart() {
  try {
    await navigator.clipboard.writeText(chartYaml.value)
    copied.value = true
    setTimeout(() => { copied.value = false }, 1500)
  } catch { /* clipboard blocked: nothing to do */ }
}

function reset() {
  yamlText.value = original
}

watch(yamlText, () => {
  clearTimeout(timer)
  timer = setTimeout(render, 400)
})

async function start() {
  const [apex, yamlMod, core, validation, common] = await Promise.all([
    import('apexcharts'),
    import('js-yaml'),
    import('./processor-lab-core.js'),
    import('../../../src/core/validation-service/index.js'),
    import('../../../src/cards/schemas/common-schemas.js'),
  ])
  mods = {
    ApexCharts: apex.default,
    yaml: yamlMod.default ?? yamlMod,
    runLab: core.runLab,
    labChartYaml: core.labChartYaml,
    validator: new validation.CoreValidationService({ cacheResults: false }),
  }
  schema.value = common.dataSourcesSchema.additionalProperties
  await render()
}

onMounted(() => {
  globalThis.__LCARDS_VERSION__ ??= 'docs'
  // A page has a lab per processor: start each one as it comes into view.
  observer = new IntersectionObserver((entries) => {
    if (entries.some(e => e.isIntersecting)) {
      observer.disconnect()
      observer = null
      start()
    }
  }, { rootMargin: '300px' })
  observer.observe(rootEl.value)
})

onUnmounted(() => {
  clearTimeout(timer)
  observer?.disconnect()
  chart?.destroy()
  chart = null
})
</script>

<style scoped>
.processor-lab {
  margin: 12px 0 28px;
  padding: 12px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
}
.processor-lab-toolbar {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
}
.processor-lab-badge {
  padding: 1px 8px;
  border-radius: 9999px;
  background: var(--vp-c-brand-soft);
  color: var(--vp-c-brand-1);
  font-weight: 600;
}
.processor-lab-entity {
  font-family: var(--vp-font-family-mono);
  color: var(--vp-c-text-2);
}
.processor-lab-spacer {
  flex: 1;
}
.processor-lab-btn {
  padding: 3px 12px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 6px;
  background: var(--vp-c-bg-soft);
  color: var(--vp-c-text-1);
  cursor: pointer;
}
.processor-lab-btn:hover {
  border-color: var(--vp-c-brand-1);
}
.processor-lab-source :deep(div[class*='language-']) {
  margin: 8px 0;
}
/* LCARS dashboards are dark; the chart sits on a black panel */
.processor-lab-panel {
  position: relative;
  min-height: 276px;
  margin-top: 8px;
  padding: 8px;
  border-radius: 8px;
  background: #000;
}
.processor-lab-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #aaa;
  font-size: 14px;
}
.processor-lab-messages {
  margin: 8px 0 0;
  padding-left: 20px;
  font-size: 13px;
}
.processor-lab-messages .is-error { color: var(--vp-c-danger-1); }
.processor-lab-messages .is-warning { color: var(--vp-c-warning-1); }
.processor-lab-messages .is-info { color: var(--vp-c-text-2); }
.processor-lab-order {
  margin: 8px 0 4px;
  font-size: 13px;
  color: var(--vp-c-text-2);
}
.processor-lab-table {
  display: table;
  width: 100%;
  margin: 4px 0 0;
  font-size: 13px;
}
.processor-lab-chart-yaml {
  margin: 10px 0 0;
  font-size: 13px;
}
.processor-lab-chart-yaml summary {
  cursor: pointer;
  font-weight: 600;
}
.processor-lab-chart-yaml p {
  margin: 6px 0;
}
.processor-lab-chart-yaml-code {
  position: relative;
}
.processor-lab-chart-yaml-code .processor-lab-btn {
  position: absolute;
  top: 6px;
  right: 6px;
}
.processor-lab-chart-yaml pre {
  margin: 0;
  padding: 10px 12px;
  border-radius: 6px;
  background: var(--vp-code-block-bg);
  font-size: 12px;
  line-height: 1.5;
  overflow-x: auto;
}
.processor-lab-caption {
  margin: 8px 0 0;
  font-size: 12px;
  color: var(--vp-c-text-3);
}
</style>
