<template>
  <div class="pv">
    <div class="pv-toolbar">
      <button type="button" class="pv-btn pv-btn-brand" :disabled="!text.trim()" data-testid="preview-copy" @click="copyLink">{{ copied || 'Copy link to this preview' }}</button>
      <button type="button" class="pv-btn" @click="text = SAMPLE">Try an example</button>
      <button type="button" class="pv-btn" :disabled="!text" @click="text = ''">Clear</button>
    </div>

    <details class="pv-source" :open="!fromLink">
      <summary>YAML ({{ fromLink ? 'from the link' : 'paste a card, a view or a whole dashboard' }})</summary>
      <PlaygroundEditor v-model="text" />
    </details>

    <p v-if="problem" class="pv-note pv-bad" data-testid="preview-problem">{{ problem }}</p>
    <p v-else-if="note" class="pv-note">{{ note }}</p>
    <p v-if="checked" class="pv-note" :class="checked.errors ? 'pv-bad' : checked.warnings ? 'pv-warn' : 'pv-good'" data-testid="preview-check">
      {{ checked.text }}
      <a v-if="checked.errors || checked.warnings" :href="withBase('/getting-started/config-checker')">Check Your Config</a>
      <template v-if="checked.errors || checked.warnings"> lists each one.</template>
    </p>

    <div v-if="views.length > 1" class="pv-tabs" role="tablist" aria-label="Views">
      <button
        v-for="(v, i) in views"
        :key="i"
        type="button"
        role="tab"
        :aria-selected="i === current"
        :class="{ active: i === current }"
        @click="current = i"
      >{{ v.title }}</button>
    </div>
    <div ref="stage" class="pv-stage" data-testid="preview-stage">
      <p v-if="!views.length && !problem" class="pv-empty">Paste YAML above, or open a preview link, to see it here.</p>
    </div>
    <p class="pv-caption">
      Real cards from this version's LCARdS bundle. Entities you name get sample states by their domain (a light is on or off, a sensor has a number), so values and colours are examples, not your home.
    </p>
  </div>
</template>

<script setup>
// The "Preview Your YAML" page: render a card, a view or a whole dashboard from the
// URL hash (#yaml=..., preview-link.js; links the LCARdS skill makes) or pasted YAML,
// with the real bundle on sample states (card-demo-runtime.js, view-mount.js), and the
// config checker's counts. tests/docs-site/preview.spec.js drives it.
import { ref, shallowRef, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import { withBase } from 'vitepress'
import jsYaml from 'js-yaml'
import PlaygroundEditor from './PlaygroundEditor.vue'
import { cardRuntime } from './card-demo-runtime.js'
import { mountView } from './view-mount.js'
import { encodePreview, decodePreview, viewsOf, PREVIEW_SAMPLE as SAMPLE } from './preview-link.js'


const text = ref('')
const fromLink = ref(false)
const views = shallowRef([])
const current = ref(0)
const note = ref('')
const problem = ref('')
const copied = ref('')
const checked = ref(null)
const stage = ref(null)

let env = null
let checker = null
let mounted = []
let generation = 0

const plural = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`

function clear() {
  for (const card of mounted) env?.unmount(card)
  mounted = []
  stage.value?.querySelectorAll('.demo-board-layout-frame, .demo-board-section, .demo-board-column').forEach(el => el.remove())
  if (stage.value) delete stage.value.dataset.ready
}

/** Parse the text into views; the stage follows `views` and `current`. */
function parse() {
  problem.value = ''
  note.value = ''
  if (!text.value.trim()) { views.value = []; checked.value = null; return }
  let doc
  try {
    doc = jsYaml.load(text.value)
  } catch (err) {
    problem.value = `This isn't valid YAML${err.mark ? ` (line ${err.mark.line + 1})` : ''}: ${err.reason ?? err.message}.`
    views.value = []
    checked.value = null
    return
  }
  const found = viewsOf(doc)
  note.value = found.note ?? ''
  if (!found.views.length && !found.note) problem.value = 'No cards found: each card needs a type: line, such as type: custom:lcards-button.'
  views.value = found.views
  if (current.value >= found.views.length) current.value = 0
  runChecker()
}

function runChecker() {
  if (!checker || !text.value.trim()) { checked.value = null; return }
  try {
    const r = checker.check(text.value)
    if (r.parseError || !r.cards.length) { checked.value = null; return }
    const parts = [r.errors && plural(r.errors, 'error'), r.warnings && plural(r.warnings, 'warning')].filter(Boolean)
    checked.value = {
      errors: r.errors,
      warnings: r.warnings,
      text: parts.length ? `The checker found ${parts.join(' and ')}; the preview may differ from Home Assistant until they're fixed.` : `The checker found no problems in ${plural(r.cards.length, 'LCARdS card')}.`,
    }
  } catch {
    checked.value = null
  }
}

async function show() {
  const run = ++generation
  clear()
  const view = views.value[current.value]
  if (!view || !stage.value) return
  try {
    env ??= await cardRuntime()
    if (run !== generation) return
    const mounting = mountView(stage.value, view.config, env, {
      stale: () => run !== generation,
      onCard: (card) => mounted.push(card),
    })
    await Promise.race([Promise.allSettled(mounting), new Promise(r => setTimeout(r, 30_000))])
    if (run === generation) stage.value.dataset.ready = String(current.value)
  } catch (err) {
    problem.value = `The cards could not load: ${err.message}`
  }
}

async function copyLink() {
  const hash = await encodePreview(text.value)
  history.replaceState(null, '', `#${hash}`)
  try {
    await navigator.clipboard.writeText(location.href)
    copied.value = 'Link copied'
  } catch {
    copied.value = 'Link is in the address bar'
  }
  if (location.href.length > 60_000) copied.value += ' (long: some chat apps cut links this size)'
  setTimeout(() => { copied.value = '' }, 4000)
}

async function fromHash() {
  try {
    const yaml = await decodePreview(location.hash)
    if (yaml === null) return false
    text.value = yaml
    fromLink.value = true
    return true
  } catch {
    problem.value = 'This preview link could not be read: it was cut off or copied wrong. Ask for the preview file or the link again, or paste the YAML above.'
    fromLink.value = false
    return false
  }
}

let timer = null
watch(text, () => {
  clearTimeout(timer)
  timer = setTimeout(parse, 500)
})
watch([views, current], async () => {
  await nextTick()
  show()
})

const onHash = () => { fromHash() }
onMounted(async () => {
  window.addEventListener('hashchange', onHash)
  await fromHash()
  globalThis.__LCARDS_VERSION__ ??= 'docs'
  try {
    const [core, schemas, registries] = await Promise.all([
      import('./config-checker-core.js'),
      import('../../../scripts/lib/card-schemas.js'),
      fetch(withBase('/schema/registries.json')).then(r => (r.ok ? r.json() : null)).catch(() => null),
    ])
    checker = core.createChecker({ entries: schemas.getSchemaEntries(), registries })
    runChecker()
  } catch {
    // the preview works without the checker
  }
})
onUnmounted(() => {
  window.removeEventListener('hashchange', onHash)
  generation++
  clear()
})
</script>

<style scoped>
.pv { margin: 16px 0 24px; }
.pv-toolbar { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 10px; }
.pv-btn {
  padding: 4px 14px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 999px;
  background: var(--vp-c-bg-soft);
  color: var(--vp-c-text-1);
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
}
.pv-btn:hover:not(:disabled) { border-color: var(--vp-c-brand-1); color: var(--vp-c-brand-1); }
.pv-btn:disabled { opacity: 0.45; cursor: default; }
.pv-btn-brand { background: var(--vp-c-brand-soft); border-color: var(--vp-c-brand-2); }
.pv-source { margin-bottom: 10px; }
.pv-source summary { cursor: pointer; color: var(--vp-c-text-2); font-size: 14px; margin-bottom: 6px; }
.pv-note { margin: 0 0 10px; padding: 8px 14px; border-radius: 8px; background: var(--vp-c-bg-soft); font-size: 14px; }
.pv-good { background: var(--vp-c-green-soft); }
.pv-warn { background: var(--vp-c-yellow-soft); }
.pv-bad { background: var(--vp-c-red-soft); }
.pv-tabs { display: flex; flex-wrap: wrap; gap: 4px; margin-bottom: 6px; }
.pv-tabs button {
  padding: 4px 14px;
  border-radius: 999px;
  background: var(--vp-c-info-2);
  color: #000;
  font-family: Antonio, sans-serif;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  cursor: pointer;
}
.pv-tabs button.active { background: var(--vp-c-brand-1); }
/* LCARS dashboards are dark: the view sits on a black panel, as on the demo board */
.pv-stage {
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-height: 200px;
  padding: 12px;
  border-radius: 8px;
  background: #000;
  overflow: hidden;
}
.pv-stage :deep(.demo-board-section) { display: grid; gap: 8px; align-items: start; }
.pv-stage :deep(.demo-board-cell) { min-width: 0; }
.pv-empty { color: #999; margin: auto; }
.pv-caption { font-size: 13px; color: var(--vp-c-text-2); margin-top: 8px; }
</style>
