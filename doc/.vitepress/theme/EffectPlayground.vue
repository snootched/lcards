<template>
  <div class="anim-playground">
    <div class="anim-stage-wrap">
      <div class="effect-stage" :ref="setContainerEl"></div>
      <button class="anim-replay-btn" type="button" :disabled="!ready" @click="resetToDefaults">
        Reset to Defaults
      </button>
      <span v-if="!intersected" class="anim-note">Scroll into view to load…</span>
    </div>

    <div v-if="ready" class="anim-controls">
      <div v-for="c in controls" :key="c.key" class="anim-control" :class="`is-${c.kind}`">
        <label :for="`ep-${uid}-${c.key}`">{{ c.label }}</label>

        <input
          v-if="c.kind === 'range'"
          :id="`ep-${uid}-${c.key}`"
          type="range"
          :min="c.min"
          :max="c.max"
          :step="c.step"
          v-model.number="localValues[c.key]"
        />
        <select
          v-else-if="c.kind === 'select'"
          :id="`ep-${uid}-${c.key}`"
          v-model="localValues[c.key]"
        >
          <option v-for="opt in c.options" :key="opt" :value="opt">{{ opt }}</option>
        </select>
        <input
          v-else-if="c.kind === 'checkbox'"
          :id="`ep-${uid}-${c.key}`"
          type="checkbox"
          v-model="localValues[c.key]"
        />
        <span v-else-if="c.kind === 'color'" class="anim-color-row">
          <input type="color" :value="hexOrFallback(localValues[c.key])" @input="localValues[c.key] = $event.target.value" />
          <input :id="`ep-${uid}-${c.key}`" type="text" v-model="localValues[c.key]" />
        </span>
        <textarea
          v-else-if="c.kind === 'json'"
          :id="`ep-${uid}-${c.key}`"
          class="anim-json-input"
          rows="2"
          :value="jsonDrafts[c.key]"
          @input="onJsonInput(c.key, $event.target.value)"
        ></textarea>
        <input
          v-else
          :id="`ep-${uid}-${c.key}`"
          type="text"
          v-model="localValues[c.key]"
        />

        <span v-if="c.kind === 'range'" class="anim-control-value">{{ localValues[c.key] }}</span>
      </div>
    </div>

    <pre v-if="ready" class="anim-yaml"><code>{{ yamlSnippet }}</code></pre>

    <p v-if="!ready && intersected && !error" class="anim-loading">Loading live preview…</p>
    <p v-if="error" class="anim-error">Live preview error: {{ error }}</p>
  </div>
</template>

<script setup>
import { reactive, ref, computed, watch, onMounted, onUnmounted, nextTick, getCurrentInstance } from 'vue'

const props = defineProps({
  preset: { type: String, required: true },
})

const uid = getCurrentInstance().uid
const ready = ref(false)
const intersected = ref(false)
const error = ref('')
const controls = ref([])
const localValues = reactive({})
const jsonDrafts = reactive({})

let RendererClass = null
let containerEl = null
let rendererInstance = null
let io = null
let debounceTimer = null
let initialValues = {}

function setContainerEl(el) {
  containerEl = el
}

function hexOrFallback(v) {
  return typeof v === 'string' && /^#[0-9a-fA-F]{6}$/.test(v) ? v : '#888888'
}

// Numeric slider bounds: prefer explicit x-ui-hints, else schema min/max,
// else a practical fallback — same precedence AnimationPlayground.vue uses.
function numericBounds(def) {
  const hint = def['x-ui-hints']?.selector?.number
  if (hint) return { min: hint.min ?? def.minimum ?? 0, max: hint.max ?? def.maximum ?? 10, step: hint.step ?? (def.type === 'integer' ? 1 : 0.1) }
  const min = def.minimum ?? 0
  let max = def.maximum ?? min + 10
  if (max <= min) max = min + 10
  return { min, max, step: def.type === 'integer' ? 1 : 0.1 }
}

function humanize(key) {
  return key.split('.').pop().replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

// Walks a dotted path (e.g. "colors.start") down through nested schema
// `properties` to find the leaf field's own schema (for reading .default).
function getFieldSchema(schema, dottedKey) {
  let current = schema
  for (const part of dottedKey.split('.')) {
    current = current?.properties?.[part]
    if (!current) return null
  }
  return current
}

// Builds the flat control list straight from the schema — mirrors
// AnimationPlayground.vue's buildControls(), plus one capability that
// component doesn't need yet: recursing into a nested `type:'object'`
// sub-schema (cascade's `colors: {start, text, end}`) and flattening each
// leaf into its own dotted-path control (colors.start, colors.text, ...).
function buildControls(schema, prefix = '') {
  const out = []
  for (const [key, def] of Object.entries(schema.properties || {})) {
    const fullKey = prefix ? `${prefix}.${key}` : key
    if (def.type === 'object' && def.properties) {
      out.push(...buildControls(def, fullKey))
      continue
    }

    const hint = def['x-ui-hints']
    const label = hint?.label || humanize(key)
    const types = Array.isArray(def.type) ? def.type : [def.type]

    if (hint?.widget === 'lcards-color-picker') {
      out.push({ key: fullKey, label, kind: 'color' })
    } else if (hint?.widget === 'json' || types.includes('array')) {
      out.push({ key: fullKey, label, kind: 'json' })
    } else if (types.includes('number') || types.includes('integer')) {
      out.push({ key: fullKey, label, kind: 'range', ...numericBounds(def) })
    } else if (types.includes('boolean')) {
      out.push({ key: fullKey, label, kind: 'checkbox' })
    } else if (Array.isArray(def.enum)) {
      out.push({ key: fullKey, label, kind: 'select', options: def.enum })
    } else if (Array.isArray(def.oneOf)) {
      const enumBranch = def.oneOf.find((b) => Array.isArray(b.enum))
      if (enumBranch) out.push({ key: fullKey, label, kind: 'select', options: enumBranch.enum })
      // else: no live control for this shape (e.g. a free-form fallback
      // branch) — still settable by hand in real YAML.
    } else if (types.includes('string')) {
      out.push({ key: fullKey, label, kind: 'text' })
    }
  }
  return out
}

function onJsonInput(key, raw) {
  jsonDrafts[key] = raw
  try {
    localValues[key] = JSON.parse(raw)
    schedulePlay()
  } catch { /* leave last-valid value applied until this parses again */ }
}

// Reassembles the nested config object createEffects() expects from flat,
// dotted-path control values — the inverse of buildControls()'s recursion
// (e.g. cascade's colors.start/text/end controls become config.colors =
// {start, text, end}, matching the real runtime config shape).
function buildConfig() {
  const config = {}
  for (const c of controls.value) {
    const val = localValues[c.key]
    if (val === undefined) continue
    if (c.key.includes('.')) {
      const [parent, child] = c.key.split('.')
      config[parent] = config[parent] || {}
      config[parent][child] = val
    } else {
      config[c.key] = val
    }
  }
  return config
}

const yamlSnippet = computed(() => {
  const config = buildConfig()
  const lines = ['background_animation:', `  - preset: ${props.preset}`, '    config:']
  const render = (obj, indent) => {
    for (const [k, v] of Object.entries(obj)) {
      if (v && typeof v === 'object' && !Array.isArray(v)) {
        lines.push(`${indent}${k}:`)
        render(v, indent + '  ')
      } else {
        lines.push(`${indent}${k}: ${JSON.stringify(v)}`)
      }
    }
  }
  render(config, '      ')
  return lines.join('\n')
})

function destroyRenderer() {
  rendererInstance?.destroy?.()
  rendererInstance = null
  if (containerEl) containerEl.innerHTML = ''
}

function play() {
  if (!containerEl || !RendererClass || !intersected.value) return
  error.value = ''
  destroyRenderer()
  try {
    rendererInstance = new RendererClass(containerEl, [{ preset: props.preset, config: buildConfig() }], null)
    rendererInstance.init()
  } catch (e) {
    error.value = e?.message || String(e)
  }
}

function schedulePlay() {
  clearTimeout(debounceTimer)
  debounceTimer = setTimeout(play, 200)
}

function resetToDefaults() {
  Object.assign(localValues, initialValues)
  for (const c of controls.value) {
    if (c.kind === 'json') jsonDrafts[c.key] = JSON.stringify(localValues[c.key], null, 2)
  }
  play()
}

async function loadAndMount() {
  try {
    const [rendererMod, schemasMod] = await Promise.all([
      import('../../../src/core/packs/backgrounds/BackgroundAnimationRenderer.js'),
      import('../../../src/cards/schemas/background-animation-params-schemas.js'),
    ])
    RendererClass = rendererMod.BackgroundAnimationRenderer

    const schema = schemasMod.BACKGROUND_ANIMATION_PARAMS_SCHEMAS?.[props.preset]
    if (!schema) throw new Error(`no params schema registered for background preset "${props.preset}"`)
    controls.value = buildControls(schema)

    for (const c of controls.value) {
      const fieldSchema = getFieldSchema(schema, c.key)
      const d = fieldSchema?.default
      if (d !== undefined) localValues[c.key] = d
      if (c.kind === 'json' && d !== undefined) jsonDrafts[c.key] = JSON.stringify(d, null, 2)
    }
    initialValues = JSON.parse(JSON.stringify(localValues))

    ready.value = true
    await nextTick()
    play()
  } catch (e) {
    error.value = e?.message || String(e)
  }
}

onMounted(() => {
  if (typeof IntersectionObserver === 'undefined') {
    intersected.value = true
    loadAndMount()
    return
  }
  io = new IntersectionObserver(
    (entries) => {
      if (entries[0]?.isIntersecting && !intersected.value) {
        intersected.value = true
        loadAndMount()
      }
    },
    { rootMargin: '200px', threshold: 0 }
  )
  // Observe the outer wrapper via containerEl's parent once mounted.
  nextTick(() => {
    if (containerEl) io.observe(containerEl.closest('.anim-playground'))
  })
})

watch(localValues, schedulePlay, { deep: true })

onUnmounted(() => {
  clearTimeout(debounceTimer)
  io?.disconnect()
  destroyRenderer()
})
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
  padding: 12px;
  margin-bottom: 14px;
  border-radius: 8px;
  background: var(--vp-c-bg);
}

.effect-stage {
  position: relative;
  width: 100%;
  max-width: 420px;
  height: 180px;
  border-radius: 8px;
  overflow: hidden;
  background: #0d1117;
  flex: 1 1 auto;
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

.anim-note {
  font-size: 0.8rem;
  color: var(--vp-c-text-3);
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
.anim-control.is-checkbox,
.anim-control.is-select,
.anim-control.is-text,
.anim-control.is-color {
  grid-template-columns: 100px 1fr;
}
.anim-control.is-json {
  grid-template-columns: 1fr;
  grid-column: 1 / -1;
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
.anim-color-row input[type='text'],
.anim-control input[type='text'] {
  flex: 1;
  min-width: 0;
  padding: 4px 6px;
  border-radius: 4px;
  border: 1px solid var(--vp-c-divider);
  background: var(--vp-c-bg);
  color: var(--vp-c-text-1);
}
.anim-json-input {
  width: 100%;
  font-family: var(--vp-font-family-mono);
  font-size: 0.8rem;
  padding: 6px;
  border-radius: 4px;
  border: 1px solid var(--vp-c-divider);
  background: var(--vp-c-bg);
  color: var(--vp-c-text-1);
  resize: vertical;
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
