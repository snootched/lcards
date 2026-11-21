<template>
  <div class="grid-demo" :class="{ 'is-editable': editable }">
    <div v-if="editable" class="grid-demo-toolbar">
      <label :for="`gd-${uid}-preset`">Start from</label>
      <select :id="`gd-${uid}-preset`" v-model="presetKey" @change="applyPreset">
        <option v-for="p in PRESETS" :key="p.key" :value="p.key">{{ p.label }}</option>
      </select>
      <button type="button" class="grid-demo-btn" @click="copyYaml">{{ copied ? 'Copied' : 'Copy YAML' }}</button>
    </div>

    <div class="grid-demo-body">
      <PlaygroundAssist v-if="editable" v-model="yamlText" card="lcards-data-grid" :schema="schemaRef" />

      <div class="grid-demo-panel">
        <div v-if="!ready" class="grid-demo-overlay">Loading grid...</div>
        <div v-else-if="fatal" class="grid-demo-overlay is-error">{{ fatal }}</div>
        <div v-else ref="gridEl" class="grid-demo-grid" :style="view.container">
          <template v-for="(row, r) in view.cells" :key="`r${r}-${view.version}`">
            <div
              v-for="(cell, c) in row"
              :key="`c${r}-${c}`"
              class="grid-demo-cell"
              :class="{ clickable: !!cell.action }"
              :data-row="r"
              :data-col="c"
              :style="cell.style"
              :title="cell.action ? `Tap: ${cell.action}` : undefined"
              @click="cell.action && (lastAction = `Tap on row ${r + 1}, column ${c + 1}: ${cell.action}`)"
            >{{ cell.text }}</div>
          </template>
        </div>
      </div>
    </div>

    <ul v-if="messages.length || lastAction" class="grid-demo-messages">
      <li v-for="(m, i) in messages" :key="i" :class="`is-${m.level}`">{{ m.text }}</li>
      <li v-if="lastAction" class="is-info">{{ lastAction }} (on a dashboard this runs the action)</li>
    </ul>

    <p class="grid-demo-caption">
      Live preview with sample entity values<span v-if="editable">: try the sensors below, or any entity id (it gets a sample value)</span>.
    </p>
    <p v-if="editable" class="grid-demo-entities">
      <code v-for="e in SAMPLE_ENTITIES" :key="e">{{ e }}</code>
    </p>
  </div>
</template>

<script setup>
// Live data grid demo for the docs. Uses the card's own model module (rows,
// cells, style layers, tracks, decorative data, cascade timing), its
// migration and schema, and the real cascade-color / pulse / glow presets,
// with sample values standing in for Home Assistant.
import PlaygroundAssist from './PlaygroundAssist.vue'
import { ref, shallowRef, watch, nextTick, onMounted, onUnmounted, getCurrentInstance } from 'vue'
import { SAMPLE_ENTITIES, samplePoints, describeEntity, tokenLookup, LCARS_DEMO_VARS } from './chart-demo-data.js'

const props = defineProps({
  /** URI-encoded YAML (set by the ```yaml live fence) */
  src: { type: String, default: '' },
  /** Show the YAML editor and starter examples */
  editable: { type: Boolean, default: false }
})

const uid = getCurrentInstance()?.uid ?? Math.random().toString(36).slice(2)

const PRESETS = [
  { key: 'decorative', label: 'Decorative: cascade', yaml: `type: custom:lcards-data-grid
data_mode: decorative
format: mixed
grid:
  grid-template-rows: repeat(6, auto)
  grid-template-columns: repeat(6, minmax(60px, 1fr))
  gap: 0px
style:
  padding: 0px
  font_size: 22px
animations:
  - trigger: on_load
    preset: cascade-color
` },
  { key: 'refresh', label: 'Decorative: partial refresh + highlight', yaml: `type: custom:lcards-data-grid
data_mode: decorative
format: hex
refresh_interval: 1500
refresh_cells: 0.15
grid:
  grid-template-rows: repeat(5, auto)
  grid-template-columns: repeat(8, 1fr)
  gap: 0px
columns:
  - format: digit
  - format: digit
style:
  font_size: 20px
  color: var(--lcars-orange)
highlight_changes:
  preset: pulse
  duration: 400
` },
  { key: 'status', label: 'Data: status table with header', yaml: `type: custom:lcards-data-grid
data_mode: data
rows:
  - values: [System, Value, Status]
    header: true
  - [Inside, sensor.demo_temperature, "{{ 'WARM' if states('sensor.demo_temperature') | float > 22 else 'OK' }}"]
  - [Humidity, sensor.demo_humidity, "{{ 'DRY' if states('sensor.demo_humidity') | float < 40 else 'OK' }}"]
  - [Battery, sensor.demo_battery, "{{ states('sensor.demo_battery') | int }}%"]
grid:
  grid-template-columns: 140px 1fr 90px
  gap: 4px
style:
  font_size: 18px
columns:
  - style:
      align: left
      color: var(--lcars-orange)
` },
  { key: 'colours', label: 'Data: conditional colours and actions', yaml: `type: custom:lcards-data-grid
data_mode: data
cell_tap_action:
  action: more-info
rows:
  - values: [Load, Watts]
    header: true
  - - Kitchen
    - value: sensor.demo_power
      style:
        color:
          default: var(--lcars-green)
          above:400: var(--lcars-yellow)
          above:800: var(--lcars-red)
  - - Battery
    - value: sensor.demo_battery
      style:
        background:
          default: transparent
          below:30: var(--lcars-red)
grid:
  grid-template-columns: 1fr 1fr
style:
  font_size: 20px
` },
  { key: 'legacy', label: 'Older format (converted)', yaml: `type: custom:lcards-data-grid
data_mode: random
format: digit
grid:
  rows: 4
  columns: 8
font_size: 18
animation:
  type: cascade
  pattern: niagara
` }
]

const presetKey = ref(props.editable ? 'decorative' : '')
const yamlText = ref(props.src ? decodeURIComponent(props.src) : PRESETS[0].yaml)
const gridEl = ref(null)
const ready = ref(false)
const fatal = ref('')
const messages = ref([])
const copied = ref(false)
const lastAction = ref('')
const view = shallowRef({ container: '', cells: [], version: 0 })

let mods = null
/** Card schema for the playground helpers (set once modules load) */
const schemaRef = shallowRef(null)
let renderTimer = null
let refreshTimer = null
let animations = []
let version = 0

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

// ── Sample values ──────────────────────────────────────────────────────────

/** Latest sample value of an entity (or `entity.attribute`). */
function sampleState(entityId) {
  const now = Date.now()
  const points = samplePoints(entityId, now - 3_600_000, now)
  const v = points[points.length - 1]?.v ?? 0
  const { kind } = describeEntity(entityId)
  if (kind === 'onoff') return v ? 'on' : 'off'
  return String(kind === 'power' || kind === 'battery' || kind === 'humidity' ? Math.round(v) : Math.round(v * 10) / 10)
}

/** What an entity cell shows (HA formats state with its unit). */
function entityText(entityId, attribute) {
  if (attribute) return sampleState(`${entityId}.${attribute}`)
  const state = sampleState(entityId)
  const { kind, unit } = describeEntity(entityId)
  if (kind === 'onoff') return state === 'on' ? 'On' : 'Off'
  return unit ? `${state} ${unit}` : state
}

/**
 * Docs-only template stand-in: handles the forms the examples use
 * (states(), state_attr(), simple threshold conditionals, now(),
 * {datasource:...}); anything else shows an ellipsis.
 */
function templateText(text, config) {
  const fixed = (v, fmt) => {
    const m = /^\.(\d+)f$/.exec(fmt || '')
    return m ? Number(v).toFixed(Number(m[1])) : v
  }
  let out = text.replace(/\{datasource:([\w-]+)(?::([^}]+))?\}/g, (_, name, fmt) => {
    const entity = config.data_sources?.[name]?.entity ?? name
    return fmt ? fixed(sampleState(entity), fmt) : entityText(entity)
  })
  out = out.replace(/\{\{\s*([\s\S]*?)\s*\}\}/g, (_, expr) => {
    const cond = /^'([^']*)'\s+if\s+states\(['"]([\w.]+)['"]\)\s*\|\s*(?:float|int)(?:\([^)]*\))?\s*([<>]=?)\s*(-?[\d.]+)\s+else\s+'([^']*)'$/.exec(expr)
    if (cond) {
      const v = Number(sampleState(cond[2]))
      const n = Number(cond[4])
      const hit = { '>': v > n, '>=': v >= n, '<': v < n, '<=': v <= n }[cond[3]]
      return hit ? cond[1] : cond[5]
    }
    const st = /^states\(['"]([\w.]+)['"]\)((?:\s*\|\s*\w+(?:\([^)]*\))?)*)$/.exec(expr)
    if (st) {
      let v = sampleState(st[1])
      const round = /round\((\d+)\)/.exec(st[2])
      if (/\|\s*int/.test(st[2])) v = String(Math.round(Number(v)))
      else if (round) v = Number(v).toFixed(Number(round[1]))
      return v
    }
    const attr = /^state_attr\(['"]([\w.]+)['"]\s*,\s*['"](\w+)['"]\)$/.exec(expr)
    if (attr) return sampleState(`${attr[1]}.${attr[2]}`)
    if (/^now\(\)\.strftime\(['"]%H:%M['"]\)$/.test(expr)) {
      return new Date().toTimeString().slice(0, 5)
    }
    return '…'
  })
  return out.replace(/\{%[\s\S]*?%\}/g, '…').replace(/\[\[\[[\s\S]*?\]\]\]/g, '…')
}

// ── Colours ────────────────────────────────────────────────────────────────

/** `theme:` tokens to their values (the card does this via the theme manager). */
function resolveTokens(value) {
  if (typeof value === 'string' && value.startsWith('theme:')) return mods.getToken(value.slice(6)) ?? value
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, resolveTokens(v)]))
  }
  return value
}

/** Concrete colour for anime.js (CSS variables resolved against the page). */
function concreteColor(value) {
  if (!value) return ''
  const probe = document.createElement('span')
  probe.style.color = value
  gridEl.value?.appendChild(probe)
  const color = probe.style.color ? getComputedStyle(probe).color : ''
  probe.remove()
  return color
}

// ── Render ─────────────────────────────────────────────────────────────────

function stopEffects() {
  clearInterval(refreshTimer)
  refreshTimer = null
  for (const a of animations) { try { a.revert?.() } catch { /* already gone */ } }
  animations = []
}

let current = null

function render() {
  if (!mods) return
  const m = mods.model
  const out = []
  fatal.value = ''
  lastAction.value = ''
  stopEffects()

  let config
  try {
    config = mods.yaml.load(yamlText.value)
  } catch (error) {
    fatal.value = `YAML error: ${error.reason ?? error.message}`
    messages.value = out
    return
  }
  if (!config || typeof config !== 'object') {
    fatal.value = 'Enter a data grid config (type: custom:lcards-data-grid ...)'
    messages.value = out
    return
  }

  const result = mods.validator.validate(config, mods.schema)
  for (const e of result.errors) out.push({ level: 'error', text: `${e.field}: ${e.message}` })
  for (const w of result.warnings) out.push({ level: 'warning', text: `${w.field}: ${w.message}` })
  const migration = mods.migrate(config)
  if (migration.changed) {
    out.push({ level: 'info', text: `Older format: the editor would convert it (${migration.notes.join('; ')}).` })
  }
  const cfg = migration.config
  const mode = cfg.data_mode === 'data' || cfg.data_mode === 'decorative'
    ? cfg.data_mode
    : (Array.isArray(cfg.rows) && cfg.rows.length ? 'data' : 'decorative')
  const grid = cfg.grid || {}
  const columns = Array.isArray(cfg.columns) ? cfg.columns : []
  const decoOpts = { format: cfg.format || 'mixed', columnFormats: columns.map(c => c?.format) }

  let rows = []
  let texts
  if (mode === 'decorative') {
    const nRows = m.countTracks(grid['grid-template-rows']) || 8
    const nCols = m.countTracks(grid['grid-template-columns']) || 12
    texts = m.generateDecorativeGrid(nRows, nCols, decoOpts)
  } else {
    rows = m.normalizeRows(cfg.rows)
    if (!rows.length) {
      fatal.value = 'Data mode needs at least one row.'
      messages.value = out
      return
    }
    const nCols = m.dataColumnCount(cfg.rows)
    let usedTemplate = false
    texts = rows.map(row => Array.from({ length: nCols }, (_, c) => {
      const info = m.classifyCell(row.values[c])
      if (info.kind === 'template') { usedTemplate = true; return templateText(info.text, cfg) }
      if (info.kind === 'entity') return entityText(info.entity, info.attribute)
      return info.text
    }))
    if (usedTemplate) out.push({ level: 'info', text: 'Templates show sample values here; Home Assistant renders them on a dashboard.' })
  }

  const cascade = (cfg.animations || []).find(a => a?.preset === 'cascade-color' && a.enabled !== false)
  const gridStyle = resolveTokens(cfg.style || {})
  current = { cfg, mode, rows, columns, gridStyle, cascade, decoOpts }
  view.value = buildView(texts)
  messages.value = out

  nextTick(() => {
    startCascade()
    const interval = Number(cfg.refresh_interval) || 0
    if (mode === 'decorative' && interval > 0) {
      const fraction = cfg.refresh_cells === undefined ? 1 : Number(cfg.refresh_cells)
      refreshTimer = setInterval(() => {
        const prev = view.value.texts
        view.value = buildView(m.refreshDecorativeCells(prev, fraction, current.decoOpts), true)
        nextTick(() => highlight(prev, view.value.texts))
      }, Math.max(500, interval))
    }
  })
}

/** Cell styles and texts for the template. */
function buildView(texts, keepVersion = false) {
  const m = mods.model
  const { cfg, mode, rows, columns, gridStyle, cascade } = current
  const exclude = cascade ? ['color'] : []
  const cells = texts.map((rowTexts, r) => rowTexts.map((text, c) => {
    const row = rows[r]
    const raw = row?.values[c]
    const cellObj = raw && typeof raw === 'object' ? raw : null
    let style = resolveTokens(m.mergeStyleLayers(
      m.defaultCellStyle(mods.getToken),
      gridStyle,
      row?.header ? m.defaultHeaderStyle(mods.getToken) : null,
      row?.header ? cfg.header_style : null,
      columns[c]?.style,
      row?.style,
      cellObj?.style
    ))
    const info = mode === 'data' ? m.classifyCell(raw) : {}
    for (const key of ['color', 'background']) {
      if (style[key] && typeof style[key] === 'object') {
        const state = info.entity ? sampleState(info.entity) : undefined
        style = { ...style, [key]: mods.resolveStateColor({ actualState: state, classifiedState: 'default', colorConfig: style[key] }) }
      }
    }
    const own = cellObj && (cellObj.tap_action || cellObj.hold_action || cellObj.double_tap_action)
    const action = own ? (cellObj.tap_action?.action || 'action')
      : (info.entity && cfg.cell_tap_action ? cfg.cell_tap_action.action : '')
    return { text, style: m.styleToCSS(style, { exclude }), action }
  }))
  if (!keepVersion) version++
  return {
    container: m.gridContainerStyle(cfg.grid, texts[0]?.length || 12, gridStyle),
    cells,
    texts,
    version
  }
}

/** One looping cascade-color animation per row, as the card registers them. */
function startCascade() {
  const { cascade } = current
  if (!cascade || !gridEl.value) return
  const params = cascade.params || {}
  const tokens = ['colors.grid.cascadeStart', 'colors.grid.cascadeMid', 'colors.grid.cascadeEnd']
  const colors = mods.model.cascadeColorList(params.colors)
    .map((c, i) => concreteColor(resolveTokens(c) || mods.getToken(tokens[i])))
  if (colors.some(c => !c)) return
  const timings = mods.model.buildCascadeRowTimings(params, view.value.cells.length)
  timings.forEach((t, r) => {
    const targets = gridEl.value.querySelectorAll(`.grid-demo-cell[data-row="${r}"]`)
    const result = mods.getPreset({
      preset: 'cascade-color',
      params: { colors, duration: t.duration, delay: t.delay, loop: true, alternate: false, property: 'color', ease: params.ease || params.easing || 'linear' }
    })
    if (result?.anime && targets.length) animations.push(mods.anime.animate(targets, result.anime))
  })
}

/** Highlight changed cells with the real pulse/glow preset. */
function highlight(prev, next) {
  const h = current.cfg.highlight_changes
  if (!h || !gridEl.value) return
  const opts = h === true ? {} : h
  const presetFn = mods.getPresetFn(opts.preset || 'pulse')
  if (!presetFn) return
  const params = { duration: opts.duration || 500, ease: opts.ease || 'outQuad', loop: 1, alternate: true, ...(opts.params || {}) }
  if (params.color) params.color = concreteColor(params.color)
  let count = 0
  const max = opts.max_cells ?? 100
  next.forEach((row, r) => row.forEach((text, c) => {
    if (count >= max || prev[r]?.[c] === text) return
    const el = gridEl.value.querySelector(`.grid-demo-cell[data-row="${r}"][data-col="${c}"]`)
    const result = presetFn({ params })
    if (el && result?.anime) {
      count++
      if (result.styles) Object.assign(el.style, result.styles)
      mods.anime.animate(el, result.anime)
    }
  }))
}

watch(yamlText, () => {
  if (!props.editable) return
  clearTimeout(renderTimer)
  renderTimer = setTimeout(render, 400)
})

onMounted(async () => {
  globalThis.__LCARDS_VERSION__ ??= 'docs'
  const [animeMod, yamlMod, migration, model, schemaMod, validation, palette, tokens, colorResolver, presetsIndex, presetsReg] =
    await Promise.all([
      import('animejs'),
      import('js-yaml'),
      import('../../../src/data-grid/data-grid-config-migration.js'),
      import('../../../src/data-grid/data-grid-model.js'),
      import('../../../src/cards/schemas/data-grid-schema.js'),
      import('../../../src/core/validation-service/index.js'),
      import('../../../src/core/themes/paletteInjector.js'),
      import('../../../src/core/packs/themes/tokens/lcardsDefaultTokens.js'),
      import('../../../src/utils/state-color-resolver.js'),
      import('../../../src/core/packs/animations/presets/index.js'),
      import('../../../src/core/animation/presets.js')
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

  const anime = animeMod.default ?? animeMod
  if (!presetsReg.getAnimationPreset('cascade-color')) presetsIndex.registerBuiltinAnimationPresets()
  const tokenGetter = tokenLookup(tokens.lcardsDefaultTokens)

  mods = {
    anime,
    yaml: yamlMod.default ?? yamlMod,
    migrate: migration.migrateDataGridConfig,
    model,
    schema: schemaMod.dataGridSchema,
    validator: new validation.CoreValidationService({ cacheResults: false }),
    getToken: (path) => tokenGetter(path) ?? undefined,
    resolveStateColor: colorResolver.resolveStateColor,
    getPreset: (def) => presetsReg.getAnimationPreset(def.preset)?.(def),
    getPresetFn: (name) => {
      const fn = presetsReg.getAnimationPreset(name)
      return fn ? (def) => fn(def) : null
    }
  }
  schemaRef.value = mods.schema
  ready.value = true
  await nextTick()
  render()
})

onUnmounted(() => {
  clearTimeout(renderTimer)
  stopEffects()
})
</script>

<style scoped>
.grid-demo {
  margin: 12px 0 24px;
}
.grid-demo-toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
  font-size: 14px;
}
.grid-demo-toolbar select {
  padding: 4px 8px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 6px;
  background: var(--vp-c-bg-soft);
  color: var(--vp-c-text-1);
}
.grid-demo-btn {
  padding: 4px 12px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 6px;
  background: var(--vp-c-bg-soft);
  color: var(--vp-c-text-1);
  cursor: pointer;
}
.grid-demo-btn:hover {
  border-color: var(--vp-c-brand-1);
}
.grid-demo-body {
  display: grid;
  gap: 12px;
}
.is-editable .grid-demo-body {
  grid-template-columns: minmax(0, 1.15fr) minmax(0, 1fr);
}
/* Keep the preview in view while scrolling the helpers (two-column layout only) */
@media (min-width: 861px) {
  .is-editable .grid-demo-panel {
    align-self: start;
    position: sticky;
    top: calc(var(--vp-nav-height) + 12px);
  }
}
@media (max-width: 860px) {
  .is-editable .grid-demo-body {
    grid-template-columns: 1fr;
  }
}
/* LCARS dashboards are dark; the grid sits on a black panel */
.grid-demo-panel {
  position: relative;
  min-height: 120px;
  padding: 12px;
  border-radius: 8px;
  background: #000;
  overflow: hidden;
}
.grid-demo-grid {
  display: grid;
  width: 100%;
}
/* Same base rules as .grid-cell in lcards-data-grid.js */
.grid-demo-cell {
  display: flex;
  align-items: center;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  min-height: 1.5em;
  padding: 4px 8px;
  box-sizing: border-box;
}
.grid-demo-cell.clickable {
  cursor: pointer;
}
.grid-demo-overlay {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 96px;
  padding: 16px;
  text-align: center;
  color: #ccc;
}
.grid-demo-overlay.is-error {
  color: #ff8a80;
}
.grid-demo-messages {
  margin: 8px 0 0;
  padding-left: 20px;
  font-size: 13px;
}
.grid-demo-messages .is-error {
  color: var(--vp-c-danger-1);
}
.grid-demo-messages .is-warning {
  color: var(--vp-c-warning-1);
}
.grid-demo-messages .is-info {
  color: var(--vp-c-text-2);
}
.grid-demo-caption {
  margin: 6px 0 0;
  font-size: 12px;
  color: var(--vp-c-text-3);
}
.grid-demo-entities {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin: 6px 0 0;
}
</style>
