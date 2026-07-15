<template>
  <div class="anim-playground">
    <div class="anim-stage-wrap">
      <svg class="filter-stage" viewBox="0 0 200 100">
        <rect :ref="setStageEl" class="filter-target" x="40" y="20" width="120" height="60" rx="16" />
      </svg>
      <button class="anim-replay-btn" type="button" :disabled="!ready" @click="resetToDefaults">
        Reset to Defaults
      </button>
    </div>

    <div v-if="ready" class="anim-controls">
      <div v-for="c in controls" :key="c.key" class="anim-control" :class="`is-${c.kind}`">
        <label :for="`fp-${uid}-${c.key}`">{{ c.label }}</label>

        <input
          v-if="c.kind === 'range'"
          :id="`fp-${uid}-${c.key}`"
          type="range"
          :min="c.min"
          :max="c.max"
          :step="c.step"
          v-model.number="localValues[c.key]"
        />
        <select
          v-else-if="c.kind === 'select'"
          :id="`fp-${uid}-${c.key}`"
          v-model="localValues[c.key]"
        >
          <option v-for="opt in c.options" :key="opt" :value="opt">{{ opt }}</option>
        </select>
        <span v-else-if="c.kind === 'color'" class="anim-color-row">
          <input type="color" :value="hexOrFallback(localValues[c.key])" @input="localValues[c.key] = $event.target.value" />
          <input :id="`fp-${uid}-${c.key}`" type="text" v-model="localValues[c.key]" />
        </span>
        <input
          v-else
          :id="`fp-${uid}-${c.key}`"
          type="text"
          v-model="localValues[c.key]"
        />

        <span v-if="c.kind === 'range'" class="anim-control-value">{{ localValues[c.key] }}{{ c.unit || '' }}</span>
      </div>
    </div>

    <pre v-if="ready" class="anim-yaml"><code>{{ yamlSnippet }}</code></pre>

    <p v-if="!ready && !error" class="anim-loading">Loading live preview…</p>
    <p v-if="error" class="anim-error">Live preview error: {{ error }}</p>
  </div>
</template>

<script setup>
import { reactive, ref, computed, watch, onMounted, getCurrentInstance } from 'vue'

const props = defineProps({
  type: { type: String, required: true },
})

const uid = getCurrentInstance().uid
const ready = ref(false)
const error = ref('')
const controls = ref([])
const localValues = reactive({})

let applyFn = null
let stageEl = null
let initialValues = {}

// SVG filter primitives (incl. the 'tint' compound type) go through the SVG
// filter pipeline (mode: 'svg'); everything else maps to a plain CSS filter
// function (mode: 'css' or omitted).
const SVG_FILTER_TYPES = new Set([
  'feGaussianBlur', 'feColorMatrix', 'feOffset', 'feBlend', 'feComposite',
  'feMorphology', 'feTurbulence', 'feDisplacementMap', 'tint',
])

function setStageEl(el) {
  stageEl = el
}

function hexOrFallback(v) {
  return typeof v === 'string' && /^#[0-9a-fA-F]{6}$/.test(v) ? v : '#888888'
}

// Numeric slider bounds: prefer explicit x-ui-hints, else schema min/max,
// else a practical fallback — same precedence EffectPlayground.vue uses.
function numericBounds(def) {
  const hint = def['x-ui-hints']?.selector?.number
  if (hint) return { min: hint.min ?? def.minimum ?? 0, max: hint.max ?? def.maximum ?? 10, step: hint.step ?? (def.type === 'integer' ? 1 : 0.1) }
  const min = def.minimum ?? 0
  let max = def.maximum ?? min + 10
  if (max <= min) max = min + 10
  return { min, max, step: def.type === 'integer' ? 1 : 0.1 }
}

function humanize(key) {
  return key.replace(/([A-Z])/g, ' $1').replace(/_/g, ' ').replace(/^\w/, (c) => c.toUpperCase())
}

// Builds one control from a leaf field schema. CSS-length-shaped string
// fields (blur's '3px', hue-rotate's '0deg') carry an explicit `unit` in
// their x-ui-hints — rendered as a unit-aware slider (raw number in
// localValues, unit suffix re-appended in buildFilterValue()) rather than a
// free-text box.
function buildFieldControl(key, def) {
  const hint = def['x-ui-hints']
  const label = hint?.label || humanize(key)
  const types = Array.isArray(def.type) ? def.type : [def.type]

  if (hint?.widget === 'lcards-color-picker') {
    return { key, label, kind: 'color' }
  }
  if (hint?.unit) {
    return { key, label, kind: 'range', unit: hint.unit, ...numericBounds(def) }
  }
  if (types.includes('number') || types.includes('integer')) {
    return { key, label, kind: 'range', ...numericBounds(def) }
  }
  if (Array.isArray(def.enum)) {
    return { key, label, kind: 'select', options: def.enum }
  }
  return { key, label, kind: 'text' }
}

// A filter's `value` schema is either a bare scalar (most CSS filters —
// blur/brightness/opacity/etc., a single field keyed 'value') or an object
// with `properties` (drop-shadow, and every SVG filter primitive).
function buildControls(schema) {
  if (schema.type === 'object' && schema.properties) {
    return Object.entries(schema.properties).map(([key, def]) => buildFieldControl(key, def))
  }
  return [buildFieldControl('value', schema)]
}

// Reassembles the {mode, type, value} filter object BaseSvgFilters.js
// expects from the individual per-param control values — a single control
// literally keyed 'value' means this type's `value` is a bare scalar (e.g.
// blur's '3px'); anything else means `value` is an object built from every
// control's key (e.g. drop-shadow's {x, y, blur, color}).
function buildFilterValue() {
  if (controls.value.length === 1 && controls.value[0].key === 'value') {
    let v = localValues.value
    const c = controls.value[0]
    if (c.unit) v = `${v}${c.unit}`
    return v
  }
  const obj = {}
  for (const c of controls.value) {
    let v = localValues[c.key]
    if (c.unit) v = `${v}${c.unit}`
    obj[c.key] = v
  }
  return obj
}

const yamlSnippet = computed(() => {
  const value = buildFilterValue()
  const mode = SVG_FILTER_TYPES.has(props.type) ? 'svg' : 'css'
  const valueStr = typeof value === 'object' && value !== null
    ? '\n' + Object.entries(value).map(([k, v]) => `      ${k}: ${JSON.stringify(v)}`).join('\n')
    : ` ${JSON.stringify(value)}`
  return [
    'filters:',
    `  - mode: ${mode}`,
    `    type: ${props.type}`,
    `    value:${valueStr}`,
  ].join('\n')
})

function play() {
  if (!stageEl || !applyFn) return
  error.value = ''
  try {
    const mode = SVG_FILTER_TYPES.has(props.type) ? 'svg' : 'css'
    applyFn(stageEl, [{ mode, type: props.type, value: buildFilterValue() }])
  } catch (e) {
    error.value = e?.message || String(e)
  }
}

function resetToDefaults() {
  Object.assign(localValues, initialValues)
  play()
}

onMounted(async () => {
  try {
    const [filtersMod, schemasMod] = await Promise.all([
      import('../../../src/msd/utils/BaseSvgFilters.js'),
      import('../../../src/cards/schemas/filter-params-schemas.js'),
    ])
    applyFn = filtersMod.applyBaseSvgFilters

    const schema = schemasMod.FILTER_PARAMS_SCHEMAS?.[props.type]
    if (!schema) throw new Error(`no params schema registered for filter type "${props.type}"`)

    controls.value = buildControls(schema)
    for (const c of controls.value) {
      const fieldSchema = c.key === 'value' ? schema : schema.properties?.[c.key]
      let v = fieldSchema?.default
      if (c.unit && typeof v === 'string') {
        const m = v.match(/^(-?[\d.]+)/)
        v = m ? parseFloat(m[1]) : 0
      }
      if (v !== undefined) localValues[c.key] = v
    }
    initialValues = JSON.parse(JSON.stringify(localValues))

    ready.value = true
    play()
  } catch (e) {
    error.value = e?.message || String(e)
  }
})

watch(localValues, play, { deep: true })
</script>

<style scoped>
.anim-playground {
  margin: 20px 0;
  padding: 16px;
  border: 1px solid var(--vp-c-divider);
  border-radius: var(--ha-border-radius-lg, 12px);
  background: var(--vp-c-bg-soft);
}

.anim-stage-wrap {
  display: flex;
  align-items: center;
  gap: 14px;
  flex-wrap: wrap;
  min-height: 96px;
  padding: 12px;
  margin-bottom: 14px;
  border-radius: 8px;
  background: var(--vp-c-bg);
}

.filter-stage {
  width: 200px;
  height: 100px;
  overflow: visible;
}

.filter-target {
  fill: var(--vp-c-brand-1);
}

.anim-replay-btn {
  padding: 6px 14px;
  border: 1px solid var(--vp-c-brand-1);
  border-radius: 999px;
  background: transparent;
  color: var(--vp-c-brand-2);
  cursor: pointer;
  font-size: 0.85rem;
  white-space: nowrap;
}
.anim-replay-btn:hover:not(:disabled) {
  background: var(--vp-c-brand-soft);
}
.anim-replay-btn:disabled {
  opacity: 0.5;
  cursor: default;
}

.anim-controls {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 10px 20px;
  margin-bottom: 12px;
  align-items: start;
}

.anim-control {
  display: grid;
  grid-template-columns: 100px 1fr auto;
  align-items: center;
  gap: 8px;
  font-size: 0.85rem;
}
.anim-control.is-select,
.anim-control.is-text,
.anim-control.is-color {
  grid-template-columns: 100px 1fr;
}
.anim-control label {
  color: var(--vp-c-text-2);
}
.anim-control input[type='range'] {
  width: 100%;
}
.anim-control-value {
  min-width: 3.5em;
  text-align: right;
  color: var(--vp-c-text-3);
  font-variant-numeric: tabular-nums;
}
.anim-color-row {
  display: flex;
  align-items: center;
  gap: 6px;
}
.anim-color-row input[type='color'] {
  width: 30px;
  height: 26px;
  padding: 0;
  border: 1px solid var(--vp-c-divider);
  border-radius: 4px;
  background: none;
  cursor: pointer;
  flex: 0 0 auto;
}
.anim-color-row input[type='text'] {
  flex: 1;
  min-width: 0;
  padding: 4px 6px;
  border-radius: 4px;
  border: 1px solid var(--vp-c-divider);
  background: var(--vp-c-bg);
  color: var(--vp-c-text-1);
}
.anim-control input[type='text'] {
  padding: 4px 6px;
  border-radius: 4px;
  border: 1px solid var(--vp-c-divider);
  background: var(--vp-c-bg);
  color: var(--vp-c-text-1);
}

.anim-yaml {
  margin: 0;
  padding: 12px;
  border-radius: 6px;
  background: var(--vp-code-bg, #000);
  color: var(--vp-code-color, #d2d5df);
  font-size: 0.8rem;
  overflow-x: auto;
}

.anim-loading,
.anim-error {
  color: var(--vp-c-text-3);
  font-size: 0.85rem;
}
.anim-error {
  color: var(--vp-c-danger-2);
}
</style>
