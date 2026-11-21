<template>
  <div class="card-demo" :class="{ 'is-editable': editable }">
    <div v-if="editable" class="card-demo-toolbar">
      <label :for="`cd-${uid}-start`">Start from</label>
      <select :id="`cd-${uid}-start`" v-model="starterKey" @change="applyStarter">
        <option v-for="s in starters" :key="s.key" :value="s.key">{{ s.label }}</option>
      </select>
      <button type="button" class="card-demo-btn" @click="copyYaml">{{ copied ? 'Copied' : 'Copy YAML' }}</button>
    </div>

    <div class="card-demo-body">
      <PlaygroundAssist v-if="editable && schema" v-model="yamlText" :card="cardTag" :schema="schema" />

      <div class="card-demo-panel" @click.capture="rememberUrl">
        <div v-if="!ready && !fatal" class="card-demo-overlay">Loading card...</div>
        <div v-if="fatal" class="card-demo-overlay is-error">{{ fatal }}</div>
        <div ref="mountEl" class="card-demo-mount" :data-card="cardTag"></div>
      </div>
      <div v-if="isAlert" class="card-demo-conditions" role="group" aria-label="Alert condition">
        <button v-for="c in ALERT_CONDITIONS" :key="c" type="button" class="card-demo-btn"
          :class="{ 'is-on': c === alertCondition }" :aria-pressed="c === alertCondition"
          @click="showCondition(c)">{{ c.replace('_alert', '') }}</button>
      </div>
    </div>

    <div v-if="controls && entityControls.length" class="card-demo-controls" role="group" aria-label="Sample entities: change them to see the card follow">
      <div v-for="c in entityControls" :key="c.id" class="card-demo-control">
        <code>{{ c.id }}</code>
        <button v-if="c.kind === 'toggle'" type="button" class="card-demo-btn" :class="{ 'is-on': c.state === 'on' }"
          :aria-pressed="c.state === 'on'" @click="setEntity(c.id, c.state === 'on' ? 'off' : 'on')">{{ c.state }}</button>
        <template v-else-if="c.kind === 'number'">
          <input type="range" :min="c.min" :max="c.max" :step="c.step" :value="c.state" :aria-label="c.id"
            @input="setEntity(c.id, $event.target.value)" />
          <span class="card-demo-value">{{ c.state }}{{ c.unit }}</span>
        </template>
        <select v-else-if="c.kind === 'select'" :value="c.state" :aria-label="c.id" @change="setEntity(c.id, $event.target.value)">
          <option v-for="o in c.options" :key="o" :value="o">{{ o }}</option>
        </select>
        <template v-else-if="c.kind === 'light'">
          <button type="button" class="card-demo-btn" :class="{ 'is-on': c.state === 'on' }"
            :aria-pressed="c.state === 'on'" @click="setEntity(c.id, c.state === 'on' ? 'off' : 'on')">{{ c.state }}</button>
          <label v-if="c.brightness" class="card-demo-sub">brightness
            <input type="range" min="0" max="100" step="1" :value="c.pct" :aria-label="`${c.id} brightness`"
              @input="setLight(c.id, { pct: Number($event.target.value) })" />
            <span class="card-demo-value">{{ c.pct }}%</span>
          </label>
          <label v-if="c.colour" class="card-demo-sub">colour
            <input type="range" min="0" max="359" step="1" :value="c.hue" :aria-label="`${c.id} colour`"
              @input="setLight(c.id, { hue: Number($event.target.value) })" />
          </label>
        </template>
      </div>
    </div>

    <ul v-if="messages.length || lastAction" class="card-demo-messages">
      <li v-for="(m, i) in messages" :key="i" :class="`is-${m.level}`">{{ m.text }}</li>
      <li v-if="lastAction" class="is-info">{{ lastAction }}</li>
    </ul>

    <p v-if="isAlert" class="card-demo-caption">
      The alert overlay as the Alert Studio previews it, on a 1280 × 720 screen with a stand-in dashboard behind it.
      Pick a condition to see what it shows; a tap on the backdrop dismisses it.
    </p>
    <p v-else-if="isLayoutView" class="card-demo-caption">
      The view's grid as the Layout Card draws it (the same layout code), in a {{ LAYOUT_VIEW_HEIGHT }} px tall box.
    </p>
    <p v-else class="card-demo-caption">
      The real {{ cardName }} card<template v-if="usesEntities"> with sample entities</template><span v-if="editable">: try the entities below, or any entity id (it gets a sample value)</span>.
      {{ hint }}
    </p>
    <p v-if="editable" class="card-demo-entities">
      <code v-for="e in entityList" :key="e">{{ e }}</code>
    </p>
  </div>
</template>

<script setup>
// Live demo of a real LCARdS card. Loads the production bundle the docs site
// publishes at /lcards/ (scripts/copy-docs-bundle.js), exactly as Home Assistant
// serves it, and mounts the card against a sample hass from tests/helpers/card-env.js
// (shared with the browser tests). Used by ```yaml live fences and playground pages.
import PlaygroundAssist from './PlaygroundAssist.vue'
import { ref, shallowRef, computed, watch, onMounted, onUnmounted, getCurrentInstance } from 'vue'
import { SAMPLE_ENTITIES } from './chart-demo-data.js'
import { cardRuntime, sizeMount, mountWidth, mountRoom, demoHint, lightReads } from './card-demo-runtime.js'
import { CARD_STARTERS, DEMO_ENTITIES } from './card-demo-starters.js'

const props = defineProps({
  /** URI-encoded YAML (set by the ```yaml live fence) */
  src: { type: String, default: '' },
  /** Show the YAML editor, quick settings and starter examples */
  editable: { type: Boolean, default: false },
  /** Card element for playground pages without `src`, e.g. "lcards-button" */
  type: { type: String, default: '' },
  /** Controls under the card for the entities its YAML names (```yaml live controls) */
  controls: { type: Boolean, default: false }
})

const uid = getCurrentInstance()?.uid ?? Math.random().toString(36).slice(2)

const initialYaml = props.src ? decodeURIComponent(props.src) : ''
const cardTag = computed(() => {
  const fromYaml = /^type:\s*["']?custom:([\w-]+)/m.exec(yamlText.value || initialYaml)?.[1]
  return fromYaml || props.type || 'lcards-button'
})
// An alert overlay draws over the whole screen: the demo shows the Alert Studio's
// mock screen (lcards-alert-preview, the same layout code) for one condition instead.
const ALERT_TAG = 'lcards-alert-overlay'
const ALERT_CONDITIONS = ['red_alert', 'yellow_alert', 'blue_alert', 'black_alert', 'gray_alert']
const ALERT_SCREEN = { width: 1280, height: 720 }
const isAlert = computed(() => cardTag.value === ALERT_TAG)
// A layout view is a whole view: the demo draws its grid with the Layout Card, which
// shares the view's layout code (views/layout-grid-utils.js), in a box of a fixed height.
const LAYOUT_VIEW_TAG = 'lcards-layout-view'
const LAYOUT_VIEW_HEIGHT = 320
const isLayoutView = computed(() => cardTag.value === LAYOUT_VIEW_TAG)
const alertCondition = ref('')
const cardName = computed(() => cardTag.value.replace(/^lcards-/, '').replace(/-card$/, '').replace(/-/g, ' ').replace(/^msd$/, 'MSD'))
const starters = computed(() => CARD_STARTERS[cardTag.value] ?? [])
const entityList = computed(() => [...SAMPLE_ENTITIES, ...DEMO_ENTITIES])
// Mention sample entities only when the YAML names one (an entity id, a template or a data source).
const usesEntities = computed(() => props.editable || /\b(entity|entity_id|entities|source|sources|data_sources)\s*:|\{\{|\[\[\[/.test(yamlText.value || initialYaml))

const starterKey = ref('')
const yamlText = ref(initialYaml || (CARD_STARTERS[props.type]?.[0]?.yaml ?? ''))
if (!initialYaml && CARD_STARTERS[props.type]?.[0]) starterKey.value = CARD_STARTERS[props.type][0].key

const mountEl = ref(null)
const ready = ref(false)
const fatal = ref('')
const messages = ref([])
const lastAction = ref('')
const copied = ref(false)
const hint = ref('')
const schema = shallowRef(null)

let env = null
let card = null
let yamlLib = null
let validator = null
let renderTimer = null
let savedUrl = ''

// Card schemas, built with the real preset lists as the cards do (an empty list
// would make `preset` an empty enum and every preset a warning).
// The text position list too, as the cards pass it (an empty list makes every position a warning).
const positionEnum = () => import('../../../src/cards/schemas/schema-options.js').then(m => [...m.TEXT_POSITIONS])
const buttonPresets = () => Promise.all([import('../../../src/core/packs/style-presets/buttons/index.js'), positionEnum()])
  .then(([m, positions]) => ({ availablePresets: Object.keys(m.BUTTON_PRESETS), positionEnum: positions }))
const SCHEMAS = {
  'lcards-button': async () => (await import('../../../src/cards/schemas/button-schema.js')).getButtonSchema(await buttonPresets()),
  'lcards-slider': async () => {
    const presets = await import('../../../src/core/packs/style-presets/sliders/index.js')
    return (await import('../../../src/cards/schemas/slider-schema.js')).getSliderSchema({ availablePresets: Object.keys(presets.SLIDER_PRESETS), positionEnum: await positionEnum() })
  },
  'lcards-elbow': async () => (await import('../../../src/cards/schemas/elbow-schema.js')).getElbowSchema(await buttonPresets()),
  'lcards-select-menu': async () => (await import('../../../src/cards/schemas/select-menu-schema.js')).getSelectMenuSchema(await buttonPresets()),
  [ALERT_TAG]: async () => (await import('../../../src/cards/schemas/lcards-alert-overlay-schema.js')).getAlertOverlaySchema(),
}

/**
 * A layout view config as a Layout Card in the demo box: the view's own keys (title,
 * path, icon) dropped, and a height that isn't a pixel value (the view's default
 * fills the screen) replaced by the box's.
 */
function layoutViewAsCard(view) {
  const { title, path, icon, type, ...rest } = view
  const px = /^\d+(px)?$/.test(String(rest.layout?.height ?? '').trim())
  return { ...rest, type: 'custom:lcards-layout-card', layout: { ...(rest.layout ?? {}), ...(px ? {} : { height: `${LAYOUT_VIEW_HEIGHT}px` }) } }
}

/**
 * The condition an alert example is about: for a band, the first one still shown as
 * a band (examples often keep red alert as an overlay); else the first one it
 * configures, else red alert.
 */
function firstCondition(config) {
  if (config.display === 'band') {
    return ALERT_CONDITIONS.find(c => (config.conditions?.[c]?.display ?? 'band') === 'band') ?? 'red_alert'
  }
  return Object.keys(config.conditions ?? {}).find(k => ALERT_CONDITIONS.includes(k)) ?? 'red_alert'
}

function showCondition(condition) {
  alertCondition.value = condition
  if (card && isAlert.value) card.condition = condition
}

function applyStarter() {
  const starter = starters.value.find(s => s.key === starterKey.value)
  if (starter) yamlText.value = starter.yaml
}

async function copyYaml() {
  try {
    await navigator.clipboard.writeText(yamlText.value)
    copied.value = true
    setTimeout(() => { copied.value = false }, 1500)
  } catch { /* clipboard blocked: nothing to do */ }
}

// A navigate action pushes a path onto the browser history; on the docs site put
// the docs page URL back and say what would have happened instead.
function rememberUrl() { savedUrl = location.href }
function describeEvent(e) {
  if (e.type === 'hass-more-info') lastAction.value = `Tap: opens more info for ${e.detail?.entityId} (on a dashboard).`
  if (e.type === 'location-changed') {
    if (savedUrl && location.href !== savedUrl) {
      lastAction.value = `Tap: navigates to ${location.pathname} (on a dashboard).`
      history.replaceState(history.state, '', savedUrl)
    }
  }
  if (e.type === 'show-dialog') lastAction.value = 'Tap: opens a dialog (on a dashboard).'
}

async function render() {
  if (!env || !mountEl.value) return
  messages.value = []
  let config
  try {
    config = yamlLib.load(yamlText.value)
  } catch (error) {
    messages.value = [{ level: 'error', text: `YAML: ${String(error.message).split('\n')[0]}` }]
    return
  }
  if (!config || typeof config !== 'object' || typeof config.type !== 'string') {
    messages.value = [{ level: 'error', text: 'The YAML needs a `type:` line, e.g. type: custom:lcards-button' }]
    return
  }
  if (config.type === `custom:${LAYOUT_VIEW_TAG}`) config = layoutViewAsCard(config)
  const tag = config.type.replace(/^custom:/, '')
  if (!customElements.get(tag)) {
    messages.value = [{ level: 'error', text: `Unknown card type ${config.type}` }]
    return
  }

  if (validator && schema.value && tag === cardTag.value) {
    const result = validator.validate(config, schema.value)
    messages.value = [...result.errors, ...result.warnings].slice(0, 6)
      .map(e => ({ level: 'warn', text: e.formattedMessage || `${e.field || 'config'}: ${e.message}` }))
  }

  hint.value = demoHint(config)
  env.ensureEntities(config)
  if (tag === ALERT_TAG) {
    await window.lcards.loadAlertPreview()
    if (!alertCondition.value || !props.editable) alertCondition.value = firstCondition(config)
    Object.assign(mountEl.value.style, { height: '', width: '', aspectRatio: `${ALERT_SCREEN.width} / ${ALERT_SCREEN.height}` })
    if (card) env.unmount(card)
    card = await env.mount(mountEl.value, { ...config, type: 'custom:lcards-alert-preview' })
    Object.assign(card.style, { width: '100%', height: '100%' })
    card.screenSize = ALERT_SCREEN
    card.condition = alertCondition.value
    ready.value = true
    return
  }
  mountEl.value.style.aspectRatio = ''
  mountEl.value.style.height = sizeMount(config, null)
  mountEl.value.style.width = mountWidth(config)
  Object.assign(mountEl.value.style, { marginBottom: '', marginLeft: '', marginRight: '' }, mountRoom(config))
  if (card) env.unmount(card)
  card = await env.mount(mountEl.value, config)
  mountEl.value.style.height = sizeMount(config, card)
  if (card.__setConfigError) messages.value.unshift({ level: 'error', text: card.__setConfigError })
  ready.value = true
}

// Entity controls (```yaml live controls): a toggle, a slider or a list for each
// entity the YAML names, so a reader can change it and see the card follow.
const CONTROL_DOMAINS = 'input_number|input_boolean|input_select|switch|light|fan|sensor|number|select|binary_sensor'
const ENTITY_RE = new RegExp(`\\b(?:${CONTROL_DOMAINS})\\.[a-z0-9_]+\\b`, 'g')
const entityControls = ref([])
let controlTimer = null

/** Hue (0-359) of an [r, g, b] colour. */
function hueOf(rgb) {
  const [r, g, b] = rgb.map(v => v / 255)
  const max = Math.max(r, g, b), d = max - Math.min(r, g, b)
  if (!d) return 0
  const h = max === r ? ((g - b) / d) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4
  return Math.round((h * 60 + 360) % 360)
}

/** [r, g, b] of a fully saturated hue, at the light's own saturation. */
function rgbOf(hue, sat = 100) {
  const s = sat / 100, c = s, x = c * (1 - Math.abs(((hue / 60) % 2) - 1)), m = 1 - c
  const [r, g, b] = hue < 60 ? [c, x, 0] : hue < 120 ? [x, c, 0] : hue < 180 ? [0, c, x] : hue < 240 ? [0, x, c] : hue < 300 ? [x, 0, c] : [c, 0, x]
  return [r, g, b].map(v => Math.round((v + m) * 255))
}

function controlFor(id, st, reads = { brightness: true, colour: true }) {
  if (!st) return null
  const a = st.attributes ?? {}
  // A light: on/off, plus brightness and colour when the example follows them
  if (id.startsWith('light.') && (reads.brightness || reads.colour)) {
    const pct = st.state === 'on' ? Math.round(((a.brightness ?? 255) / 255) * 100) : 0
    const hue = Array.isArray(a.hs_color) ? Math.round(a.hs_color[0]) : Array.isArray(a.rgb_color) ? hueOf(a.rgb_color) : 30
    return { id, kind: 'light', state: st.state, pct, hue, brightness: reads.brightness, colour: reads.colour }
  }
  if (st.state === 'on' || st.state === 'off') return { id, kind: 'toggle', state: st.state }
  if (Array.isArray(a.options)) return { id, kind: 'select', state: st.state, options: a.options }
  const v = Number(st.state)
  if (st.state === '' || !Number.isFinite(v)) return null
  const step = a.step ?? (Number.isInteger(v) ? 1 : 0.1)
  return { id, kind: 'number', state: st.state, min: a.min ?? Math.min(0, v), max: a.max ?? Math.max(100, Math.ceil(v * 2)), step, unit: a.unit_of_measurement ? ` ${a.unit_of_measurement}` : '' }
}

function refreshControls() {
  if (!props.controls || !env) return
  // entities only: a service name after action: or service: is not one
  const lines = (yamlText.value || initialYaml).split('\n').filter(l => !/^\s*(-\s*)?(action|service|perform_action):/.test(l))
  const text = lines.join('\n')
  const ids = [...new Set(text.match(ENTITY_RE) ?? [])]
  const reads = lightReads(text)
  entityControls.value = ids.map(id => controlFor(id, env.hass.states[id], reads)).filter(Boolean)
}

function setEntity(id, value) {
  env?.setState(id, String(value))
  refreshControls()
}

/** Set a light's brightness (percent; 0 turns it off) or its colour (hue). */
function setLight(id, { pct, hue }) {
  const a = env?.hass.states[id]?.attributes ?? {}
  if (pct !== undefined) {
    env?.setState(id, pct > 0
      ? { state: 'on', attributes: { brightness: Math.round((pct / 100) * 255) } }
      : { state: 'off' })
  } else if (hue !== undefined) {
    const sat = Array.isArray(a.hs_color) ? a.hs_color[1] : 100
    env?.setState(id, { state: 'on', attributes: { hs_color: [hue, sat], rgb_color: rgbOf(hue, sat), color_mode: 'hs' } })
  }
  refreshControls()
}

watch(yamlText, () => {
  if (!props.editable) return
  clearTimeout(renderTimer)
  renderTimer = setTimeout(render, 400)
})

onMounted(async () => {
  try {
    const [yamlMod, validation, envReady] = await Promise.all([
      import('js-yaml'),
      import('../../../src/core/validation-service/index.js'),
      cardRuntime(),
    ])
    yamlLib = yamlMod.default ?? yamlMod
    validator = new validation.CoreValidationService({ cacheResults: false })
    env = envReady
    schema.value = await SCHEMAS[cardTag.value]?.() ?? null
    for (const type of ['hass-more-info', 'location-changed', 'show-dialog']) {
      mountEl.value?.addEventListener(type, describeEvent)
      window.addEventListener(type, describeEvent)
    }
    await render()
    if (props.controls) {
      refreshControls()
      // a tap on the card can change an entity too (a toggle action)
      controlTimer = setInterval(refreshControls, 500)
    }
  } catch (error) {
    fatal.value = `The card could not load: ${error.message}`
  }
})

onUnmounted(() => {
  clearTimeout(renderTimer)
  clearInterval(controlTimer)
  for (const type of ['hass-more-info', 'location-changed', 'show-dialog']) window.removeEventListener(type, describeEvent)
  if (card && env) env.unmount(card)
})
</script>

<style scoped>
.card-demo-sub {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 0.85em;
}
.card-demo-controls {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 20px;
  margin-top: 8px;
  font-size: 13px;
}
.card-demo-control {
  display: flex;
  align-items: center;
  gap: 8px;
}
.card-demo-control input[type='range'] { width: 140px; accent-color: var(--vp-c-brand-1); }
.card-demo-control select {
  padding: 2px 6px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 6px;
  background: var(--vp-c-bg-soft);
  color: var(--vp-c-text-1);
}
.card-demo-control .is-on { border-color: var(--vp-c-brand-1); color: var(--vp-c-brand-1); }
.card-demo-value { min-width: 4em; color: var(--vp-c-text-2); font-variant-numeric: tabular-nums; }
/* grid_options.columns narrows the card (mountWidth); never past the panel */
.card-demo-mount {
  max-width: 100%;
}
.card-demo {
  margin: 12px 0 24px;
}
.card-demo-toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
  font-size: 14px;
}
.card-demo-toolbar select {
  padding: 4px 8px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 6px;
  background: var(--vp-c-bg-soft);
  color: var(--vp-c-text-1);
}
.card-demo-btn {
  padding: 4px 12px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 6px;
  background: var(--vp-c-bg-soft);
  color: var(--vp-c-text-1);
  cursor: pointer;
}
.card-demo-btn:hover {
  border-color: var(--vp-c-brand-1);
}
.card-demo-body {
  display: grid;
  gap: 12px;
}
.is-editable .card-demo-body {
  grid-template-columns: minmax(0, 1.15fr) minmax(0, 1fr);
}
@media (min-width: 861px) {
  .is-editable .card-demo-panel {
    align-self: start;
    position: sticky;
    top: calc(var(--vp-nav-height) + 12px);
  }
}
@media (max-width: 860px) {
  .is-editable .card-demo-body {
    grid-template-columns: 1fr;
  }
}
/* LCARS dashboards are dark; the card sits on a black panel */
.card-demo-panel {
  position: relative;
  min-height: 80px;
  padding: 16px;
  border-radius: 8px;
  background: #000;
  overflow: hidden;
}
.card-demo-conditions {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: -4px;
}
.card-demo-conditions .card-demo-btn {
  font-size: 13px;
  text-transform: capitalize;
}
.card-demo-conditions .is-on {
  border-color: var(--vp-c-brand-1);
  color: var(--vp-c-brand-1);
}
.card-demo-overlay {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 60px;
  color: #aaa;
  font-size: 14px;
}
.card-demo-overlay.is-error {
  color: #ff6b6b;
}
.card-demo-messages {
  margin: 8px 0 0;
  padding-left: 18px;
  font-size: 13px;
}
.card-demo-messages .is-error { color: var(--vp-c-danger-1); }
.card-demo-messages .is-warn { color: var(--vp-c-warning-1); }
.card-demo-messages .is-info { color: var(--vp-c-text-2); }
.card-demo-caption {
  margin: 6px 0 0;
  font-size: 13px;
  color: var(--vp-c-text-2);
}
.card-demo-entities {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin: 6px 0 0;
  font-size: 12px;
}
</style>
