<template>
  <div class="demo-board">
    <p v-if="!data.views.length" class="demo-board-note">There is no live demo for LCARdS {{ data.release }}.</p>
    <template v-else>
      <nav class="demo-board-picker" aria-label="Demo views">
        <button
          v-for="view in data.views"
          :key="view.path"
          type="button"
          :class="{ active: view.path === current }"
          :aria-pressed="view.path === current"
          :title="view.summary"
          @click="current = view.path"
        >{{ view.title }}</button>
      </nav>
      <p v-if="fatal" class="demo-board-error">{{ fatal }}</p>
      <div ref="stage" class="demo-board-stage" :data-view="current"></div>
      <details class="demo-board-yaml">
        <summary>YAML of this view</summary>
        <pre><code>{{ active?.yaml }}</code></pre>
      </details>
      <p class="demo-board-caption">
        Real cards from this version's LCARdS bundle, on sample entities. The alert buttons switch the alert mode of this page; sliders and toggles change the sample values.
      </p>
    </template>
  </div>
</template>

<script setup>
// The public demo board (demo/views/) for this docs build's release, one view at a
// time: each view is laid out like a Home Assistant sections view (12 grid columns per
// section column, 56 px rows, 8 px gaps) and mounted with the shared card runtime.
// Data: demo.data.js. Usage in markdown: <DemoBoard />
import { computed, ref, watch, onMounted, onUnmounted, nextTick } from 'vue'
import { data } from './demo.data.js'
import { cardRuntime, sizeMount } from './card-demo-runtime.js'

const current = ref(data.views[0]?.path ?? '')
const active = computed(() => data.views.find(v => v.path === current.value))
const stage = ref(null)
const fatal = ref('')
let env = null
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
  const view = data.views.find(v => v.path === path)
  if (!view || !stage.value) return
  try {
    env ??= await cardRuntime()
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
.demo-board {
  margin: 16px 0 24px;
}
.demo-board-picker {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 12px;
}
/* LCARS pills: the HA-LCARS palette the cards use (applyDemoVars) */
.demo-board-picker button {
  padding: 4px 14px 4px 22px;
  border-radius: 999px;
  background: var(--lcars-african-violet, #cc99ff);
  color: #000;
  font-family: Antonio, sans-serif;
  font-size: 14px;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  cursor: pointer;
}
.demo-board-picker button.active {
  background: var(--lcars-orange, #ff9900);
}
.demo-board-picker button:focus-visible {
  outline: 2px solid var(--vp-c-brand-1);
  outline-offset: 2px;
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
