<template>
  <div class="anim-playground">
    <div class="anim-stage-wrap">
      <div class="anim-stage-inner" :key="replayKey" :ref="setContainerEl">
        <!-- box: single pill -->
        <div v-if="stageCfg.kind === 'box'" class="anim-target anim-box">{{ preset }}</div>

        <!-- row: N cells in a line -->
        <div v-else-if="stageCfg.kind === 'row'" class="anim-row">
          <div v-for="i in stageCfg.count" :key="i" class="anim-target anim-cell"><span>&#9679;</span></div>
        </div>

        <!-- grid: cols x rows -->
        <div
          v-else-if="stageCfg.kind === 'grid'"
          class="anim-grid"
          :style="{ gridTemplateColumns: `repeat(${gridDims[0]}, 1fr)` }"
        >
          <div v-for="i in gridDims[0] * gridDims[1]" :key="i" class="anim-target anim-cell"><span>&#9679;</span></div>
        </div>

        <!-- text: literal splittable text, user-editable -->
        <div v-else-if="stageCfg.kind === 'text'" class="anim-target anim-text">{{ sampleText }}</div>

        <!-- svg-path: a drawable/marchable/followable route -->
        <svg v-else-if="stageCfg.kind === 'svg-path'" class="anim-svg" viewBox="0 0 240 90">
          <path
            :id="svgPathId"
            class="anim-target"
            d="M10,60 C55,10 95,85 140,45 S210,15 230,45"
            fill="none"
            stroke="var(--vp-c-brand-2)"
            stroke-width="4"
            stroke-linecap="round"
          />
        </svg>
      </div>

      <button class="anim-replay-btn" type="button" :disabled="!ready" @click="replay">
        &#8635; Replay
      </button>
      <button class="anim-replay-btn" type="button" :disabled="!ready" @click="resetToDefaults">
        Reset to Defaults
      </button>
      <span v-if="reducedMotionNotice" class="anim-note">
        prefers-reduced-motion is on — autoplay skipped, use Replay to preview
      </span>
    </div>

    <div v-if="ready && stageCfg.kind === 'text'" class="anim-text-input-row">
      <label :for="`ap-${uid}-sampletext`">Sample text</label>
      <input :id="`ap-${uid}-sampletext`" type="text" v-model="sampleText" maxlength="24" />
    </div>

    <div v-if="ready" class="anim-controls">
      <div v-for="c in controls" :key="c.key" class="anim-control" :class="`is-${c.kind}`">
        <label :for="`ap-${uid}-${c.key}`">{{ c.label }}</label>

        <input
          v-if="c.kind === 'range'"
          :id="`ap-${uid}-${c.key}`"
          type="range"
          :min="c.min"
          :max="c.max"
          :step="c.step"
          v-model.number="localParams[c.key]"
        />
        <select
          v-else-if="c.kind === 'select'"
          :id="`ap-${uid}-${c.key}`"
          v-model="localParams[c.key]"
        >
          <option v-for="opt in c.options" :key="opt" :value="opt">{{ opt }}</option>
        </select>
        <span v-else-if="c.kind === 'color'" class="anim-color-row">
          <input
            type="color"
            :value="hexOrFallback(localParams[c.key])"
            @input="localParams[c.key] = $event.target.value"
          />
          <input :id="`ap-${uid}-${c.key}`" type="text" v-model="localParams[c.key]" />
        </span>
        <input
          v-else-if="c.kind === 'text'"
          :id="`ap-${uid}-${c.key}`"
          type="text"
          v-model="localParams[c.key]"
        />
        <input
          v-else-if="c.kind === 'checkbox'"
          :id="`ap-${uid}-${c.key}`"
          type="checkbox"
          v-model="localParams[c.key]"
        />
        <textarea
          v-else-if="c.kind === 'json'"
          :id="`ap-${uid}-${c.key}`"
          class="anim-json-input"
          rows="3"
          :value="jsonDrafts[c.key]"
          @input="onJsonInput(c.key, $event.target.value)"
        ></textarea>

        <span v-if="c.kind === 'range'" class="anim-control-value">{{ localParams[c.key] }}</span>
        <span v-if="c.kind === 'json' && jsonErrors[c.key]" class="anim-json-error">{{ jsonErrors[c.key] }}</span>
      </div>
    </div>

    <pre v-if="ready" class="anim-yaml"><code>{{ yamlSnippet }}</code></pre>

    <p v-if="!ready && !error" class="anim-loading">Loading live preview…</p>
    <p v-if="error" class="anim-error">Live preview error: {{ error }}</p>
  </div>
</template>

<script setup>
import { reactive, ref, computed, watch, onMounted, onUnmounted, nextTick, getCurrentInstance } from 'vue'

const props = defineProps({
  preset: { type: String, required: true },
  params: { type: Object, default: () => ({}) },
})

const uid = getCurrentInstance().uid
const ready = ref(false)
const error = ref('')
const replayKey = ref(0)
const reducedMotionNotice = ref(false)
const controls = ref([])
const localParams = reactive({})
const jsonDrafts = reactive({})
const jsonErrors = reactive({})
const sampleText = ref('LCARDS')
const svgPathId = `ap-svg-path-${props.preset}`

let animeLib = null
let getPreset = null
let currentInstance = null
let containerEl = null
let debounceTimer = null

// Presets that need multiple targets or non-trivial demo scaffolding get a
// dedicated stage layout; everything else gets a single animated "box".
const STAGE_CONFIG = {
  'stagger-grid':   { kind: 'grid', cellsFromParam: true, fallbackGrid: [6, 2] },
  'grid-stagger':   { kind: 'grid', cellsFromParam: true, fallbackGrid: [6, 3] },
  'stagger-radial': { kind: 'grid', cellsFromParam: false, fixedGrid: [7, 4] },
  'cascade-color':  { kind: 'grid', cellsFromParam: false, fixedGrid: [6, 3] },
  'stagger-wave':   { kind: 'row', count: 8 },
  'stagger-flash':  { kind: 'row', count: 8 },
  cascade:          { kind: 'row', count: 8 },
  'text-reveal':    { kind: 'text' },
  'text-scramble':  { kind: 'text' },
  'text-glitch':    { kind: 'text' },
  'text-typewriter': { kind: 'text' },
  draw:             { kind: 'svg-path' },
  march:            { kind: 'svg-path' },
  motionpath:       { kind: 'svg-path' },
}
const stageCfg = STAGE_CONFIG[props.preset] || { kind: 'box' }

// Presets whose real visual work happens entirely inside setup() (WAAPI or
// self-managed anime calls) — the normal anime.animate() dispatch below must
// be skipped entirely for these, matching animateElement()'s own behavior.
const SELF_MANAGED_PRESETS = new Set(['stagger-flash'])

// Full v4 named-easing surface (bare names — v4 dropped the v3 'ease' prefix),
// used to populate a real <select> instead of free text. Matches the set the
// in-app animation editor's own dropdown offers (minus the parametric/advanced
// options — cubicBezier/spring/steps/irregular/custom — which need their own
// param objects and are out of scope for a plain string field here).
const EASE_OPTIONS = (() => {
  const bases = ['Quad', 'Cubic', 'Quart', 'Quint', 'Sine', 'Expo', 'Circ', 'Back', 'Elastic', 'Bounce']
  const prefixes = ['in', 'out', 'inOut', 'outIn']
  const out = ['linear']
  for (const b of bases) for (const p of prefixes) out.push(`${p}${b}`)
  return out
})()

// Synthetic "sample data" for presets whose demo can't just be schema
// defaults — required fields with no schema default (a stand-in for the
// entity a real dashboard would supply), fields with no default that still
// need a realistic example so a JSON textarea never starts blank, or
// defaults that are technically correct but a poor fit for an HTML/CSS demo
// stage (e.g. an SVG-only CSS property, or a 1x1 "grid" that can't visibly
// stagger).
const PRESET_DEMO_DEFAULTS = {
  motionpath: () => ({ path: `#${svgPathId}`, shape: { type: 'circle', size: 10, fill: 'var(--vp-c-brand-1)' } }),
  'stagger-flash': () => ({ lead_color: '#ff6753', trail_color: '#1c3c55', property: 'backgroundColor' }),
  'stagger-grid': () => ({ grid: [6, 2] }),
  'grid-stagger': () => ({ grid: [6, 3] }),
  // timeline-cascade's real default (loop:false) plays this once and then
  // just sits there — loop it here so the two-phase sequence is actually
  // visible without needing to mash Replay.
  'timeline-cascade': () => ({
    steps: [
      { params: { opacity: [0, 1], translateX: [-40, 0] }, duration: 500 },
      { params: { scale: [1, 1.15] }, duration: 300, offset: '<' },
    ],
    loop: true,
  }),
  sequence: () => ({
    steps: [
      { opacity: [0, 1], duration: 400 },
      { scale: [1, 1.15], duration: 300, offset: '<' },
    ],
  }),
  'physics-spring': () => ({ from: 1, to: 1.3 }),
  'color-shift': () => ({ color_from: '#37a6d1', color_to: '#ff6753' }),
  shimmer: () => ({ color_from: '#37a6d1', color_to: '#ffffff' }),
  set: () => ({ properties: { opacity: 0.55 } }),
  draw: () => ({ draw: ['0 0', '0 1'] }),
  // Real default `mode` ('css') applies one flat delay to every matched
  // element — a single cascade-color instance across a whole grid is
  // genuinely supposed to change all cells in sync (the "per-row cascade"
  // look requires multiple separate instances, one per row, each with its
  // own delay — see the preset's own JSDoc "Usage Pattern" example, and
  // lcards-data-grid's pattern:/niagara orchestration which does exactly
  // that). Forcing `stagger_from` here switches to 'animejs' mode so this
  // single demo instance still shows real per-cell staggering.
  'cascade-color': () => ({ colors: ['#93e1ff', '#002241', '#dfe1e8'], stagger_from: 'first' }),
  // Real default (loop:false, alternate:false) ends at opacity:0 — the
  // element visibly vanishes after one pass and never comes back without
  // Replay. Loop it for a demo that stays visible.
  ripple: () => ({ loop: true, alternate: true }),
}

const gridDims = computed(() => {
  if (!stageCfg.cellsFromParam) return stageCfg.fixedGrid || [6, 3]
  const g = localParams.grid
  const cols = Array.isArray(g) && typeof g[0] === 'number' ? g[0] : stageCfg.fallbackGrid[0]
  const rows = Array.isArray(g) && typeof g[1] === 'number' ? g[1] : stageCfg.fallbackGrid[1]
  const clampedCols = Math.max(1, Math.min(10, Math.round(cols)))
  const clampedRows = Math.max(1, Math.min(8, Math.round(rows)))
  return [clampedCols, clampedRows]
})

function hexOrFallback(v) {
  return typeof v === 'string' && /^#[0-9a-fA-F]{6}$/.test(v) ? v : '#888888'
}

// Numeric slider bounds: prefer explicit x-ui-hints, else schema min/max,
// else a heuristic range around the field's own default so every numeric
// param is tweakable even if it never got hand-authored editor hints.
function numericBounds(def) {
  const hint = def['x-ui-hints']?.selector?.number
  if (hint) return { min: hint.min ?? def.minimum ?? 0, max: hint.max ?? def.maximum ?? 10, step: hint.step ?? 0.1 }
  const d = typeof def.default === 'number' ? def.default : 0
  const min = def.minimum ?? (d < 0 ? d * 3 : 0)
  let max = def.maximum ?? Math.max(d * 3, min + 10)
  if (max <= min) max = min + 10
  const span = max - min
  const step = span <= 5 ? 0.05 : span <= 20 ? 0.1 : span <= 50 ? 1 : Math.round(span / 100) || 1
  return { min, max, step }
}

function humanize(key) {
  return key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

const CANONICAL_KEYS = new Set(['duration', 'ease', 'loop', 'alternate', 'delay'])

// Renders demo controls straight from the schema — the same shape the real
// in-app animation editor reads (x-ui-hints) — so new presets need no
// hand-written UI here, only an entry above if their demo needs multiple
// targets, text, or SVG geometry.
function buildControls(schema) {
  const out = []
  if (schema.properties?.duration) {
    const d = schema.properties.duration
    out.push({ key: 'duration', label: 'Duration (ms)', kind: 'range', min: d.minimum ?? 0, max: Math.min(d.maximum ?? 3000, 3000), step: 50 })
  }
  if (schema.properties?.ease) {
    out.push({ key: 'ease', label: 'Ease', kind: 'select', options: EASE_OPTIONS })
  }
  if (schema.properties?.delay) {
    const bounds = numericBounds({ ...schema.properties.delay, default: schema.properties.delay.default ?? 0, minimum: schema.properties.delay.minimum ?? 0, maximum: schema.properties.delay.maximum })
    out.push({ key: 'delay', label: 'Delay (ms)', kind: 'range', ...bounds })
  }

  for (const [key, def] of Object.entries(schema.properties || {})) {
    if (CANONICAL_KEYS.has(key)) continue
    if (/legacy alias/i.test(def.description || '')) continue

    const types = Array.isArray(def.type) ? def.type : [def.type]
    const hint = def['x-ui-hints']
    // oneOf fields with a string+enum branch (e.g. stagger-grid/stagger-radial/
    // grid-stagger's `from`) get a real dropdown of the documented values
    // instead of a raw JSON textarea — the array-position branch (custom
    // [x,y]) is a rarer, advanced case not covered by this control; it's
    // still settable by hand in the YAML, just not live-tweakable here.
    const enumBranch = Array.isArray(def.oneOf) ? def.oneOf.find((b) => b.type === 'string' && Array.isArray(b.enum)) : null

    if (hint?.widget === 'lcards-color-picker') {
      out.push({ key, label: hint?.label || humanize(key), kind: 'color' })
    } else if (enumBranch) {
      out.push({ key, label: hint?.label || humanize(key), kind: 'select', options: enumBranch.enum })
    } else if (hint?.widget === 'json' || types.includes('object') || types.includes('array')) {
      out.push({ key, label: hint?.label || humanize(key), kind: 'json' })
    } else if (types.includes('number')) {
      out.push({ key, label: hint?.label || humanize(key), kind: 'range', ...numericBounds(def) })
    } else if (types.includes('boolean')) {
      out.push({ key, label: hint?.label || humanize(key), kind: 'checkbox' })
    } else if (types.includes('string') && Array.isArray(def.enum)) {
      out.push({ key, label: hint?.label || humanize(key), kind: 'select', options: def.enum })
    } else if (types.includes('string')) {
      out.push({ key, label: hint?.label || humanize(key), kind: 'text' })
    }
    // oneOf-shaped / untyped fields (e.g. slide.distance) fall through with
    // no control — they still work via their schema/seed default, just
    // aren't live-tweakable in this first pass.
  }

  if (schema.properties?.loop) out.push({ key: 'loop', label: 'Loop', kind: 'checkbox' })
  if (schema.properties?.alternate) out.push({ key: 'alternate', label: 'Alternate', kind: 'checkbox' })
  return out
}

function onJsonInput(key, raw) {
  jsonDrafts[key] = raw
  if (raw.trim() === '') {
    delete localParams[key]
    jsonErrors[key] = ''
    schedulePlay()
    return
  }
  try {
    localParams[key] = JSON.parse(raw)
    jsonErrors[key] = ''
    schedulePlay()
  } catch (e) {
    jsonErrors[key] = 'invalid JSON — not applied'
  }
}

const yamlSnippet = computed(() => {
  const lines = ['animations:', '  - trigger: on_load', `    preset: ${props.preset}`, '    params:']
  for (const c of controls.value) {
    const v = localParams[c.key]
    if (v === undefined) continue
    lines.push(c.kind === 'json' ? `      ${c.key}: ${JSON.stringify(v)}` : `      ${c.key}: ${v}`)
  }
  return lines.join('\n')
})

function resolveElements() {
  if (!containerEl) return []
  return Array.from(containerEl.querySelectorAll('.anim-target'))
}

// Trimmed, DOM-only re-implementation of animateElement()'s dispatch logic
// (lcards-anim-helpers.js) — same marker vocabulary (_timeline/_stagger/
// _cssAnimation/_animTargets/_drawable/_motionPath), without the
// HASS/trigger-manager machinery a static docs demo doesn't need.
function playResult(elements, result) {
  if (!elements.length || !result) return null

  elements.forEach((el) => result.setup?.(el))

  if (SELF_MANAGED_PRESETS.has(props.preset)) return null
  if (elements[0]._animTargets === null) return null // e.g. text-scramble self-manages

  elements.forEach((el) => Object.assign(el.style, result.styles || {}))

  const animeParams = result.anime || {}

  // `_timeline` is a top-level sibling of `.anime` on some presets (sequence)
  // but nested inside `.anime` on others (timeline-cascade, timeline-attention)
  // — animateElement() explicitly checks both (see lcards-anim-helpers.js
  // ~line 892-902); checking only the nested form silently no-ops `sequence`
  // (its returned `steps` array gets passed through as a bogus tween property).
  const isTimeline = result._timeline === true || animeParams._timeline === true

  if (isTimeline) {
    const { _timeline, steps, ...globals } = animeParams
    const timeline = animeLib.createTimeline({ ...globals })
    ;(steps || []).forEach((step) => {
      const { targets, offset, params: stepParams, ...stepProps } = step
      let stepTargets = elements.length > 1 ? elements : elements[0]
      if (targets && containerEl) {
        const matched = Array.from(containerEl.querySelectorAll(targets))
        if (matched.length) stepTargets = matched.length > 1 ? matched : matched[0]
      }
      timeline.add(stepTargets, stepParams ? { ...stepProps, ...stepParams } : stepProps, offset)
    })
    return timeline
  }

  if (!Object.keys(animeParams).length) return null
  if (animeParams._cssAnimation) return null // setup() already applied the CSS animation

  const processed = { ...animeParams }
  if (processed.delay?._stagger) {
    const cfg = processed.delay
    processed.delay = animeLib.stagger(cfg.value ?? 100, {
      from: cfg.from, grid: cfg.grid, axis: cfg.axis, direction: cfg.direction,
    })
  }

  // Target resolution — mirrors animateElement()'s _drawable → _animTargets
  // precedence (lcards-anim-helpers.js ~line 975-1003), with _motionPath
  // merged in on top regardless of which branch fired (~line 1005-1012).
  // _animTargets can be an array (text presets' split chars) OR a single
  // element (motionpath's self-contained tracer shape) — anime.animate()
  // accepts both natively, so no array check is needed (an earlier version
  // of this dispatcher required an array here, which silently left
  // motionpath's tracer un-animated at its original 0,0 position).
  const el = elements[0]
  let target = elements.length > 1 ? elements : el
  if (el._drawable) {
    target = el._drawable
  } else if (el._animTargets !== undefined) {
    target = el._animTargets
  }
  if (el._motionPath) {
    Object.assign(processed, el._motionPath)
  }

  return animeLib.animate(target, processed)
}

// Plays against the CURRENT DOM state — never remounts by itself. Called
// only right after a fresh mount (initial load or a key-bumped remount via
// fullReplay()), so setup()'s DOM mutations (text-splitting, WAAPI
// animations, injected keyframes) always start from pristine elements.
function play() {
  if (!containerEl || !getPreset || !animeLib) return
  error.value = ''
  try {
    const elements = resolveElements()
    const result = getPreset({ ...localParams })
    currentInstance = playResult(elements, result)
  } catch (e) {
    error.value = e?.message || String(e)
  }
}

// The only path that (re)plays an animation. Always pauses whatever's
// currently running, then remounts the stage from scratch (fresh DOM, via
// the :key bump) before playing again — several presets do non-idempotent
// setup() work (anime.js's splitText wrapping characters in spans, WAAPI
// animations layered via closures in stagger-flash) that corrupts state or
// double-fires if re-run against already-mutated elements instead of a
// clean remount.
function fullReplay() {
  currentInstance?.pause?.()
  currentInstance = null
  replayKey.value++
  nextTick(play)
}

function schedulePlay() {
  clearTimeout(debounceTimer)
  debounceTimer = setTimeout(fullReplay, 150)
}

// Just tracks the ref — must NOT trigger playback itself. It also fires on
// every remount (replayKey change), and fullReplay() already schedules its
// own play() via nextTick; playing here too caused every replay/param edit
// to run two overlapping animation instances on the same elements.
function setContainerEl(el) {
  containerEl = el
}

function replay() {
  fullReplay()
}

let initialParams = {}
const initialSampleText = sampleText.value

function resetToDefaults() {
  for (const c of controls.value) delete localParams[c.key]
  Object.assign(localParams, initialParams)
  sampleText.value = initialSampleText
  for (const c of controls.value) {
    if (c.kind !== 'json') continue
    jsonDrafts[c.key] = localParams[c.key] !== undefined ? JSON.stringify(localParams[c.key], null, 2) : ''
    jsonErrors[c.key] = ''
  }
  fullReplay()
}

onMounted(async () => {
  try {
    const animeMod = await import('animejs')
    animeLib = animeMod.default ?? animeMod

    // Mirrors src/lcards.js's `window.lcards.anim` block — pure anime.js
    // wiring, no HASS dependency — so preset internals that reach for
    // window.lcards.animejs.* (createDrawable, createMotionPath, stagger,
    // splitText, createSpring) get the real thing instead of silently
    // falling back.
    window.lcards = window.lcards || {}
    window.lcards.anim = {
      animejs: animeLib,
      anime: animeLib.animate,
      stagger: animeLib.stagger,
      spring: animeLib.createSpring,
      createScope: animeLib.createScope,
      utils: animeLib.utils,
      splitText: animeLib.splitText,
      presets: window.lcards.anim?.presets || {},
      scopes: window.lcards.anim?.scopes || new Map(),
      eases: animeLib.eases,
    }
    window.lcards.animejs = window.lcards.anim.animejs
    window.lcards.anime = window.lcards.anim.anime

    const [presetsIndexMod, presetsRegMod, schemasMod] = await Promise.all([
      import('../../../src/core/packs/animations/presets/index.js'),
      import('../../../src/core/animation/presets.js'),
      import('../../../src/cards/schemas/animation-preset-params-schemas.js'),
    ])

    if (!presetsRegMod.getAnimationPreset(props.preset)) {
      presetsIndexMod.registerBuiltinAnimationPresets()
    }
    getPreset = presetsRegMod.getAnimationPreset(props.preset)
    if (!getPreset) throw new Error(`unknown preset "${props.preset}"`)

    const schema = schemasMod.ANIMATION_PRESET_PARAMS_SCHEMAS?.[props.preset]
    if (!schema) throw new Error(`no params schema registered for "${props.preset}"`)
    controls.value = buildControls(schema)

    // 1. Seed from schema per-field defaults.
    for (const c of controls.value) {
      const d = schema.properties[c.key]?.default
      if (d !== undefined) localParams[c.key] = d
    }
    // 2. Demo-specific synthetic data (required fields / HTML-friendly overrides
    //    / realistic JSON examples for fields with no schema default).
    Object.assign(localParams, PRESET_DEMO_DEFAULTS[props.preset]?.() || {})
    // 3. Canonical duration/ease/loop/alternate fallback from the preset's own
    //    resolved output, since each preset hardcodes its own fallback rather
    //    than declaring a schema default — keeps the demo honest even where a
    //    preset's real default has drifted from its prose docs.
    try {
      const probe = getPreset({ ...localParams })
      if (probe?.anime) {
        if (localParams.duration === undefined && typeof probe.anime.duration === 'number') localParams.duration = probe.anime.duration
        if (localParams.ease === undefined && typeof probe.anime.ease === 'string') localParams.ease = probe.anime.ease
        if (localParams.loop === undefined && controls.value.some(c => c.key === 'loop')) localParams.loop = !!probe.anime.loop
        if (localParams.alternate === undefined && controls.value.some(c => c.key === 'alternate')) localParams.alternate = !!probe.anime.alternate
      }
    } catch { /* best-effort probe */ }
    // 4. Explicit per-instance overrides from the markdown authoring side win last.
    Object.assign(localParams, props.params)

    initialParams = JSON.parse(JSON.stringify(localParams))

    for (const c of controls.value) {
      if (c.kind === 'json' && localParams[c.key] !== undefined) {
        jsonDrafts[c.key] = JSON.stringify(localParams[c.key], null, 2)
      }
    }

    ready.value = true
    reducedMotionNotice.value = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    await nextTick()
    if (!reducedMotionNotice.value && containerEl) play()
  } catch (e) {
    error.value = e?.message || String(e)
  }
})

watch(localParams, schedulePlay, { deep: true })
watch(sampleText, schedulePlay)

onUnmounted(() => {
  clearTimeout(debounceTimer)
  currentInstance?.pause?.()
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
  min-height: 96px;
  padding: 12px;
  margin-bottom: 14px;
  border-radius: 8px;
  background: var(--vp-c-bg);
}

.anim-stage-inner {
  display: flex;
  align-items: center;
  flex: 1 1 auto;
}

.anim-box {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 120px;
  height: 64px;
  border-radius: 32px;
  background: var(--vp-c-brand-1);
  color: #0d1117;
  font-family: 'Antonio', sans-serif;
  letter-spacing: 0.05em;
  font-weight: 600;
  text-transform: uppercase;
  font-size: 0.85rem;
  user-select: none;
}

.anim-row {
  display: flex;
  gap: 8px;
}

.anim-grid {
  display: grid;
  gap: 6px;
}

.anim-cell {
  width: 26px;
  height: 26px;
  border-radius: 6px;
  background: var(--vp-c-bg-mute);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #888;
  font-size: 12px;
}

.anim-text {
  font-family: 'Antonio', sans-serif;
  font-size: 1.6rem;
  letter-spacing: 0.08em;
  color: var(--vp-c-text-1);
  user-select: none;
  white-space: nowrap;
}

.anim-svg {
  width: 240px;
  height: 90px;
  overflow: visible;
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

.anim-text-input-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
  font-size: 0.85rem;
}
.anim-text-input-row label {
  color: var(--vp-c-text-2);
}
.anim-text-input-row input {
  flex: 1;
  max-width: 240px;
  padding: 4px 8px;
  border-radius: 4px;
  border: 1px solid var(--vp-c-divider);
  background: var(--vp-c-bg);
  color: var(--vp-c-text-1);
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
.anim-control.is-json label {
  margin-bottom: 2px;
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
.anim-json-error {
  grid-column: 1 / -1;
  color: var(--vp-c-danger-2);
  font-size: 0.75rem;
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
