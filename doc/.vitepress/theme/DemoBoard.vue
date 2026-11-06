<template>
  <div class="demo-board">
    <p v-if="!data.views.length" class="demo-board-note">There is no live demo for LCARdS {{ data.release }}.</p>
    <div v-else class="demo-board-frame">
      <!-- an LCARS side menu: the filter, then the topics; an open topic lists its views by group -->
      <nav class="demo-board-menu" aria-label="Demo views by topic">
        <div v-if="badges" class="demo-board-filter" role="group" aria-label="Show">
          <span class="demo-board-filter-label">Show</span>
          <button type="button" :aria-pressed="!newOnly" :class="{ active: !newOnly }" @click="setFilter(false)">All</button>
          <button type="button" :aria-pressed="newOnly" :class="{ active: newOnly }" @click="setFilter(true)">New in {{ data.release }}</button>
        </div>
        <template v-for="t in topics" :key="t.id">
          <button
            type="button"
            class="demo-board-topic"
            :data-topic="t.id"
            :class="{ open: isOpen(t.id), current: active?.topic === t.id }"
            :aria-expanded="isOpen(t.id)"
            @click="toggle(t.id)"
          ><span>{{ t.title }}</span><span class="count">{{ t.count }}</span></button>
          <div v-if="isOpen(t.id)" class="demo-board-topic-views">
            <template v-for="g in t.groups" :key="g.title">
              <div v-if="g.title" class="demo-board-group">{{ g.title }}</div>
              <button
                v-for="view in g.views"
                :key="view.path"
                type="button"
                :data-view="view.path"
                :class="{ active: view.path === current }"
                :aria-pressed="view.path === current"
                :title="view.summary"
                @click="current = view.path"
              >{{ shortTitle(view, t, g) }}<span v-if="badges && view.isNew" class="demo-board-badge">New</span></button>
            </template>
          </div>
        </template>
      </nav>
      <div class="demo-board-main">
        <div v-if="active" class="demo-board-heading">
          <span class="demo-board-title">{{ active.title }}</span>
          <span v-if="badges && active.isNew" class="demo-board-badge">New in {{ data.release }}</span>
          <p class="demo-board-summary">{{ active.summary }}</p>
        </div>
        <p v-if="fatal" class="demo-board-error">{{ fatal }}</p>
        <div v-if="poster" class="demo-board-poster">
          <p>This view runs a lot of 3D graphics at once, which can be heavy on a slower computer or phone.</p>
          <button type="button" class="demo-board-load" @click="load">Load this view</button>
        </div>
        <div ref="stage" class="demo-board-stage" :class="{ hidden: poster }" :data-view="current"></div>
        <details class="demo-board-yaml">
          <summary>YAML of this view</summary>
          <pre><code>{{ active?.yaml }}</code></pre>
        </details>
        <p class="demo-board-caption">
          Real cards from this version's LCARdS bundle, on sample entities. The alert buttons switch the alert mode of this page; sliders and toggles change the sample values.
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
// The public demo board (demo/views/), one view at a time: every release's views in the
// topic tree of demo/order.yaml (topic > group > view), with a filter for this release's.
// A heavy view (order.yaml `heavy`) shows a poster until its Load button is pressed.
// Each view is laid out like a Home Assistant sections view (12 grid columns per section
// column, 56 px rows, 8 px gaps) and mounted with the shared card runtime.
// Data: demo.data.js. Usage in markdown: <DemoBoard />
import { computed, ref, watch, onMounted, onUnmounted, nextTick } from 'vue'
import { data } from './demo.data.js'
import { cardRuntime, sizeMount } from './card-demo-runtime.js'

const byPath = new Map(data.views.map(v => [v.path, v]))
const newOnly = ref(false)
/** NEW badges and the filter only mean something once the board has older releases' views too. */
const badges = data.views.some(v => !v.isNew) && data.views.some(v => v.isNew)
/** The topic tree with the filter applied: topics > groups > views, with counts. */
const topics = computed(() => data.topics
  .map((t) => {
    const groups = t.groups
      .map(g => ({ title: g.title, views: g.views.map(p => byPath.get(p)).filter(v => v && (!newOnly.value || v.isNew)) }))
      .filter(g => g.views.length)
    return { id: t.id, title: t.title, groups, count: groups.reduce((n, g) => n + g.views.length, 0) }
  })
  .filter(t => t.count))
const current = ref(data.views[0]?.path ?? '')
const active = computed(() => byPath.get(current.value))
/** Topics open in the menu (any number): the first view's to begin with. */
const open = ref([data.views[0]?.topic].filter(Boolean))
const isOpen = (id) => open.value.includes(id)
function toggle(id) {
  open.value = isOpen(id) ? open.value.filter(x => x !== id) : [...open.value, id]
}
/** Heavy views the reader has chosen to load. */
const loaded = ref([])
const poster = computed(() => !!active.value?.heavy && !loaded.value.includes(current.value))
function load() {
  loaded.value = [...loaded.value, current.value]
  show(current.value)
}

/** A view's title without its topic's or group's name in front ("Astrometrics comet" -> "Comet"). */
function shortTitle(view, t, g) {
  for (const prefix of [t.title, g.title].filter(Boolean)) {
    const rest = view.title.replace(new RegExp(`^${prefix}\\s+`, 'i'), '')
    if (rest !== view.title) return rest.charAt(0).toUpperCase() + rest.slice(1)
  }
  return view.title
}

/** The filter: a view it hides gives way to the first one left, its topic opened. */
function setFilter(value) {
  newOnly.value = value
  const left = topics.value.flatMap(t => t.groups.flatMap(g => g.views))
  if (!left.some(v => v.path === current.value) && left[0]) {
    current.value = left[0].path
    if (!isOpen(left[0].topic)) toggle(left[0].topic)
  }
}

const stage = ref(null)
const fatal = ref('')
let env = null
let seeded = false
let mounted = []
let generation = 0

/** Grid columns a card spans, out of the section's total. */
function span(card, total) {
  const columns = card.grid_options?.columns
  if (columns === 'full' || columns === undefined) return total
  return Math.min(total, Math.max(1, Number(columns) || total))
}

function clear() {
  for (const card of mounted) env?.unmount(card)
  mounted = []
  if (stage.value) {
    stage.value.replaceChildren()
    delete stage.value.dataset.ready
  }
}

async function show(path) {
  const run = ++generation
  clear()
  const view = byPath.get(path)
  if (!view || !stage.value || (view.heavy && !loaded.value.includes(path))) return
  try {
    env ??= await cardRuntime()
    // the demo helpers as a fresh Home Assistant install has them (demo.data.js helperSeed)
    if (!seeded) {
      seeded = true
      for (const [id, state] of Object.entries(data.helperStates)) env.setState(id, state)
    }
    if (run !== generation) return
    // Narrow screens: twice the columns per card, as Home Assistant reflows a section
    const narrow = stage.value.clientWidth < 700
    // Every card mounts at once: one slow card (a WebGL scene, a texture) never holds back the rest
    const mounting = []
    // a layout view (the astrometrics showcase): one CSS grid of named areas, as lcards-layout-view lays it out
    if (view.config.type === 'custom:lcards-layout-view') {
      const l = view.config.layout ?? {}
      const grid = document.createElement('div')
      grid.className = 'demo-board-layout'
      Object.assign(grid.style, {
        display: 'grid',
        gap: l['grid-gap'] ?? '8px',
        gridTemplateColumns: l['grid-template-columns'] ?? '1fr',
        gridTemplateRows: l['grid-template-rows'] ?? 'auto',
        gridTemplateAreas: l['grid-template-areas'] ?? 'none',
        height: l['min-height'] ?? '900px'
      })
      stage.value.appendChild(grid)
      for (const config of view.config.cards ?? []) {
        const cell = document.createElement('div')
        cell.className = 'demo-board-cell'
        const vl = config.view_layout ?? {}
        if (vl['grid-area']) cell.style.gridArea = vl['grid-area']
        if (vl['grid-column']) cell.style.gridColumn = vl['grid-column']
        cell.style.minHeight = '0'
        grid.appendChild(cell)
        env.ensureEntities(config)
        mounting.push(env.mount(cell, config).then((card) => {
          if (run !== generation) return env.unmount(card)
          mounted.push(card)
        }))
      }
    }
    for (const section of view.config.sections ?? []) {
      const total = 12 * (section.column_span ?? 1)
      const grid = document.createElement('div')
      grid.className = 'demo-board-section'
      grid.style.gridTemplateColumns = `repeat(${total}, minmax(0, 1fr))`
      stage.value.appendChild(grid)
      for (const config of section.cards ?? []) {
        const cell = document.createElement('div')
        cell.className = 'demo-board-cell'
        cell.style.gridColumn = `span ${narrow ? Math.min(total, span(config, total) * 2) : span(config, total)}`
        cell.style.height = sizeMount(config, null)
        grid.appendChild(cell)
        env.ensureEntities(config)
        mounting.push(env.mount(cell, config).then((card) => {
          // switched to another view meanwhile: this card's cell is gone
          if (run !== generation) return env.unmount(card)
          mounted.push(card)
          cell.style.height = sizeMount(config, card)
        }))
      }
    }
    // Ready when every card has mounted, or after 30 s at most (a card still settling
    // keeps going); tests/docs-site/demo-board.spec.js waits for it
    await Promise.race([Promise.allSettled(mounting), new Promise(r => setTimeout(r, 30_000))])
    if (run === generation) stage.value.dataset.ready = path
  } catch (error) {
    fatal.value = `The cards could not load: ${error.message}`
  }
}

watch(current, async (path) => {
  await nextTick()
  // Leave the page in normal (green) alert when switching views. Not awaited: the
  // theme change waits for a frame, and a busy page must not hold the view switch on it.
  if (window.lcards?.getAlertMode?.() !== 'green_alert') {
    window.lcards?.setAlertMode?.('green_alert', { skipHelperSync: true })
  }
  show(path)
})
onMounted(() => show(current.value))
onUnmounted(() => {
  generation++
  clear()
})
</script>

<style scoped>
/* the site's colours: Picard blue for the menu, the brand red for what is selected */
.demo-board {
  --demo-menu: var(--vp-c-info-2);
  --demo-pick: var(--vp-c-brand-1);
  --demo-on-bar: #000;
  margin: 16px 0 24px;
}
.demo-board-frame {
  display: flex;
  gap: 16px;
  align-items: flex-start;
}
.demo-board-main {
  flex: 1;
  min-width: 0;
}
/* the menu: LCARS bars, square on the left like a frame's side bar */
.demo-board-menu {
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex: 0 0 250px;
  position: sticky;
  top: calc(var(--vp-nav-height) + 16px);
  max-height: calc(100vh - var(--vp-nav-height) - 32px);
  overflow-y: auto;
  scrollbar-width: thin;
}
.demo-board-menu button {
  font-family: Antonio, sans-serif;
  text-align: left;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  cursor: pointer;
}
.demo-board-menu button:focus-visible {
  outline: 2px solid var(--demo-pick);
  outline-offset: -2px;
}
/* the filter: a labelled two-way switch above the topics */
.demo-board-filter {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 4px;
  margin-bottom: 8px;
  padding: 4px;
  border-radius: 20px 999px 999px 0;
  background: var(--vp-c-bg-mute);
}
.demo-board-filter-label {
  flex-basis: 100%;
  padding: 2px 8px 0;
  font-family: Antonio, sans-serif;
  font-size: 13px;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--vp-c-text-2);
}
.demo-board-filter button {
  flex: 1;
  white-space: nowrap;
  padding: 3px 10px;
  border-radius: 999px;
  color: var(--vp-c-text-1);
  font-size: 13px;
  text-align: center;
}
.demo-board-filter button.active {
  background: var(--demo-menu);
  color: var(--demo-on-bar);
}
.demo-board-topic {
  display: flex;
  flex: none;
  justify-content: space-between;
  align-items: flex-end;
  min-height: 40px;
  padding: 4px 12px 4px 8px;
  border-radius: 0 999px 999px 0;
  background: var(--demo-menu);
  color: var(--demo-on-bar);
  font-size: 15px;
}
.demo-board-topic::after {
  content: '+';
  order: 3;
  margin-left: 8px;
  width: 0.8em;
  text-align: center;
}
.demo-board-topic.open::after {
  content: '\2212';
}
.demo-board-topic .count {
  margin-left: auto;
  opacity: 0.7;
}
/* the topic holding the current view */
.demo-board-topic.current {
  background: var(--demo-pick);
}
/* an open topic's views: text rows beside a bar in the menu colour, by group */
.demo-board-topic-views {
  display: flex;
  flex-direction: column;
  margin: 0 0 4px;
  padding-bottom: 4px;
  border-left: 8px solid var(--demo-menu);
}
.demo-board-group {
  margin: 8px 0 2px;
  padding: 0 10px;
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--vp-c-text-3);
}
.demo-board-group:first-child {
  margin-top: 4px;
}
.demo-board-topic-views button {
  padding: 2px 10px 2px 16px;
  color: var(--vp-c-text-2);
  font-size: 14px;
  line-height: 1.35;
}
.demo-board-topic-views button:hover {
  color: var(--demo-pick);
}
.demo-board-topic-views button.active {
  background: var(--demo-pick);
  color: var(--demo-on-bar);
}
.demo-board-badge {
  margin-left: 8px;
  padding: 0 6px;
  border-radius: 999px;
  background: var(--demo-menu);
  color: var(--demo-on-bar);
  font-family: Antonio, sans-serif;
  font-size: 11px;
  text-transform: uppercase;
  vertical-align: 1px;
}
.demo-board-heading {
  margin-bottom: 12px;
}
.demo-board-title {
  font-family: Antonio, sans-serif;
  font-size: 22px;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--demo-pick);
}
.demo-board-summary {
  margin: 2px 0 0;
  font-size: 14px;
  color: var(--vp-c-text-2);
}
/* a heavy view waits for a click */
.demo-board-poster {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 12px;
  padding: 24px;
  border-radius: 8px;
  background: #000;
  color: var(--vp-c-text-2);
}
.demo-board-poster p {
  margin: 0;
  color: #dfe1e8;
}
.demo-board-load {
  padding: 8px 24px;
  border-radius: 999px;
  background: var(--demo-menu);
  color: var(--demo-on-bar);
  font-family: Antonio, sans-serif;
  font-size: 16px;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  cursor: pointer;
}
.demo-board-load:focus-visible {
  outline: 2px solid var(--demo-pick);
  outline-offset: 2px;
}
.demo-board-stage.hidden {
  display: none;
}
/* phone width: the menu sits above the panel, an open topic's views scroll inside it */
@media (max-width: 760px) {
  .demo-board-frame {
    flex-direction: column;
    align-items: stretch;
  }
  .demo-board-menu {
    position: static;
    flex: none;
    max-height: none;
  }
  .demo-board-topic-views {
    max-height: 40vh;
    overflow-y: auto;
  }
}
/* LCARS dashboards are dark: the view sits on a black panel */
.demo-board-stage {
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-height: 300px;
  padding: 12px;
  border-radius: 8px;
  background: #000;
  overflow: hidden;
}
.demo-board-stage :deep(.demo-board-section) {
  display: grid;
  gap: 8px;
  align-items: start;
}
.demo-board-stage :deep(.demo-board-cell) {
  min-width: 0;
}
.demo-board-yaml {
  margin-top: 8px;
  color: var(--vp-c-text-2);
}
.demo-board-yaml summary {
  cursor: pointer;
  font-size: 13px;
}
.demo-board-yaml pre {
  max-height: 480px;
  margin: 4px 0 0;
  padding: 8px;
  border-radius: 6px;
  background: var(--vp-code-block-bg);
  font-size: 12px;
  line-height: 1.5;
  overflow: auto;
}
.demo-board-caption,
.demo-board-note {
  margin: 8px 0 0;
  font-size: 13px;
  color: var(--vp-c-text-2);
}
.demo-board-error {
  color: var(--vp-c-danger-1);
}
</style>
