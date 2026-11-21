<template>
  <div class="hiw" :class="{ focused: !!active.size, scenario: !!example }">
    <p class="hiw-intro">
      Click any part to see what it works with, or pick a scenario to follow a change from Home Assistant to the screen.
    </p>
    <div class="hiw-examples" role="group" aria-label="Scenarios">
      <button v-for="ex in EXAMPLES" :key="ex.id" type="button" class="hiw-chip"
        :class="{ active: example?.id === ex.id }" @click="play(ex)">
        <span class="hiw-play" aria-hidden="true">&#x25B6;&#xFE0E;</span> {{ ex.label }}
      </button>
    </div>

    <div class="hiw-grid">
      <div class="hiw-main">
        <template v-for="(band, i) in BANDS" :key="band.id">
          <section class="hiw-band" :class="`band-${band.id}`">
            <header class="hiw-band-head">
              <span class="hiw-band-title">{{ band.title }}</span>
              <span class="hiw-band-note">{{ band.note }}</span>
            </header>
            <div class="hiw-boxes">
              <button v-for="box in band.boxes" :key="box.id" type="button" class="hiw-box"
                :class="boxClass(box.id)" :aria-pressed="selected === box.id" @click="select(box.id)">
                {{ box.label }}
              </button>
            </div>
          </section>
          <div v-if="i < BANDS.length - 1" class="hiw-flow" aria-hidden="true">
            <span>{{ i === 0 ? 'states, history and services flow in' : 'every card uses the same core' }}</span>
          </div>
        </template>
      </div>

      <section class="hiw-band hiw-backend band-backend">
        <header class="hiw-band-head">
          <span class="hiw-band-title">{{ BACKEND.title }}</span>
          <span class="hiw-band-note">{{ BACKEND.note }}</span>
        </header>
        <div class="hiw-boxes hiw-boxes-col">
          <button v-for="box in BACKEND.boxes" :key="box.id" type="button" class="hiw-box"
            :class="boxClass(box.id)" :aria-pressed="selected === box.id" @click="select(box.id)">
            {{ box.label }}
          </button>
        </div>
        <p class="hiw-backend-note">Automations, scripts and voice drive LCARdS through these, and every open screen follows.</p>
      </section>
    </div>

    <div class="hiw-detail" aria-live="polite">
      <template v-if="example">
        <div class="hiw-detail-head">
          <span class="hiw-detail-title">{{ example.label }}</span>
          <span class="hiw-step-nav">
            <button type="button" class="hiw-chip" :disabled="step === 0" @click="go(step - 1)">Back</button>
            <button type="button" class="hiw-chip" @click="toggle">{{ playing ? 'Pause' : (step === example.steps.length - 1 ? 'Replay' : 'Play') }}</button>
            <button type="button" class="hiw-chip" :disabled="step === example.steps.length - 1" @click="go(step + 1)">Next</button>
            <button type="button" class="hiw-chip" @click="stop">Close</button>
          </span>
        </div>
        <ol class="hiw-steps">
          <li v-for="(s, i) in example.steps" :key="i" :class="{ current: i === step, done: i < step }" @click="go(i)">
            <span class="hiw-step-text">{{ s.text }}</span>
            <span v-if="i === step && playing" :key="`bar-${step}`" class="hiw-progress" :style="{ animationDuration: `${STEP_MS}ms` }"></span>
          </li>
        </ol>
      </template>
      <template v-else-if="selected">
        <div class="hiw-detail-head">
          <span class="hiw-detail-title">{{ ALL_BOXES[selected].label }}</span>
          <a class="hiw-more" :href="withBase(ALL_BOXES[selected].link)">Learn more</a>
        </div>
        <p class="hiw-detail-text">{{ ALL_BOXES[selected].text }}</p>
        <p v-if="links.length" class="hiw-uses">
          <span class="hiw-dim">Works with:</span>
          <button v-for="id in links" :key="id" type="button" class="hiw-chip hiw-chip-sm" @click="select(id)">{{ ALL_BOXES[id].label }}</button>
        </p>
      </template>
      <p v-else class="hiw-dim">Nothing selected yet: click a box above, or play a scenario.</p>
    </div>
  </div>
</template>

<script setup>
// "How LCARdS works": the layers (Home Assistant, the shared core, the cards) plus
// the backend integration. Clicking a box lights up what it works with; scenarios
// walk a change through the system step by step. Content in how-it-works-model.js.
import { ref, computed, onUnmounted } from 'vue'
import { withBase } from 'vitepress'
import { BANDS, BACKEND, EXAMPLES, ALL_BOXES, connected } from './how-it-works-model.js'

const STEP_MS = 4500

const selected = ref(null)
const example = ref(null)
const step = ref(0)
const playing = ref(false)
let timer = null

const links = computed(() => (selected.value ? connected(selected.value) : []))
// Boxes to light: the scenario step's, or the selected box and its connections.
const active = computed(() => {
  if (example.value) return new Set(example.value.steps[step.value].boxes)
  if (selected.value) return new Set([selected.value, ...links.value])
  return new Set()
})

function boxClass(id) {
  return {
    lit: active.value.has(id),
    selected: !example.value && selected.value === id,
  }
}
function select(id) {
  stop()
  selected.value = selected.value === id ? null : id
}
function schedule() {
  clearTimeout(timer)
  if (!playing.value) return
  if (step.value < example.value.steps.length - 1) timer = setTimeout(() => { step.value++; schedule() }, STEP_MS)
  else playing.value = false
}
function go(n) {
  step.value = Math.max(0, Math.min(n, example.value.steps.length - 1))
  schedule()
}
function play(ex) {
  selected.value = null
  example.value = ex
  playing.value = true
  go(0)
}
function toggle() {
  if (playing.value) { playing.value = false; clearTimeout(timer); return }
  playing.value = true
  go(step.value === example.value.steps.length - 1 ? 0 : step.value)
}
function stop() {
  clearTimeout(timer)
  playing.value = false
  example.value = null
}
onUnmounted(() => clearTimeout(timer))
</script>

<style scoped>
.hiw {
  --hiw-ha: #2f6db8;
  --hiw-core: #b85400;
  --hiw-cards: #8549b0;
  --hiw-backend: #23825d;
  margin: 20px 0;
  font-size: 14px;
}
:global(html.dark) .hiw {
  --hiw-ha: #7ea9ff;
  --hiw-core: #ff9c3a;
  --hiw-cards: #cc99ff;
  --hiw-backend: #66d1a0;
}
.band-ha { --band: var(--hiw-ha); }
.band-core { --band: var(--hiw-core); }
.band-cards { --band: var(--hiw-cards); }
.band-backend { --band: var(--hiw-backend); }

.hiw-intro { margin: 0 0 10px; color: var(--vp-c-text-2); }
.hiw-examples { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 14px; }
.hiw-chip {
  padding: 4px 13px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 999px;
  background: var(--vp-c-bg-soft);
  color: var(--vp-c-text-1);
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
}
.hiw-chip:hover:not(:disabled), .hiw-chip.active { border-color: var(--vp-c-brand-1); color: var(--vp-c-brand-1); }
.hiw-chip.active { background: var(--vp-c-brand-soft); }
.hiw-chip:disabled { opacity: 0.4; cursor: default; }
.hiw-chip-sm { padding: 2px 10px; font-size: 13px; }
.hiw-play { font-size: 10px; vertical-align: 1px; }

.hiw-grid { display: grid; grid-template-columns: minmax(0, 1fr) 190px; gap: 12px; align-items: stretch; }
.hiw-main { display: flex; flex-direction: column; }
.hiw-band {
  border: 1px solid color-mix(in srgb, var(--band) 45%, transparent);
  border-left: 10px solid var(--band);
  border-radius: 18px 8px 8px 18px;
  padding: 10px 12px 12px;
  background: color-mix(in srgb, var(--band) 6%, var(--vp-c-bg));
}
.hiw-band-head { display: flex; flex-wrap: wrap; align-items: baseline; gap: 4px 10px; margin-bottom: 8px; }
.hiw-band-title {
  font-family: Antonio, var(--vp-font-family-base);
  font-size: 17px;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--band);
}
.hiw-band-note { color: var(--vp-c-text-2); font-size: 13px; }
.hiw-boxes { display: flex; flex-wrap: wrap; gap: 6px; }
.hiw-boxes-col { flex-direction: column; }
.hiw-box {
  flex: 1 1 auto;
  min-width: 96px;
  padding: 7px 12px;
  border: 1px solid color-mix(in srgb, var(--band) 55%, transparent);
  border-radius: 999px;
  background: color-mix(in srgb, var(--band) 12%, var(--vp-c-bg));
  color: var(--vp-c-text-1);
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: background var(--hiw-t, 0.3s), box-shadow var(--hiw-t, 0.3s), opacity var(--hiw-t, 0.3s), transform var(--hiw-t, 0.3s);
}
.hiw-box:hover { background: color-mix(in srgb, var(--band) 28%, var(--vp-c-bg)); }
.focused .hiw-box { opacity: 0.35; }
/* A selected box is filled; the boxes it works with are outlined. */
.focused .hiw-box.lit {
  opacity: 1;
  background: color-mix(in srgb, var(--band) 22%, var(--vp-c-bg));
  box-shadow: 0 0 0 2px var(--band);
}
.focused .hiw-box.selected,
.scenario .hiw-box.lit {
  background: var(--band);
  color: var(--vp-c-bg);
}
/* Scenario steps: the boxes the step uses are filled and lift. */
.scenario .hiw-box.lit { transform: scale(1.05); }
.hiw-flow {
  align-self: center;
  margin: 4px 0;
  color: var(--vp-c-text-3);
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.06em;
}
.hiw-flow::before { content: '▼ '; }
.hiw-backend { display: flex; flex-direction: column; }
.hiw-backend-note { margin: auto 0 0; padding-top: 12px; color: var(--vp-c-text-2); font-size: 13px; line-height: 1.5; }

.hiw-detail {
  min-height: 96px;
  margin-top: 14px;
  padding: 14px 18px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 10px;
  background: var(--vp-c-bg-soft);
  font-size: 15px;
}
.hiw-detail-head { display: flex; flex-wrap: wrap; align-items: center; gap: 8px 12px; }
.hiw-detail-title {
  font-family: Antonio, var(--vp-font-family-base);
  font-size: 20px;
  font-weight: 700;
  letter-spacing: 0.03em;
  text-transform: uppercase;
  color: var(--vp-c-brand-1);
}
.hiw-step-nav { display: flex; flex-wrap: wrap; gap: 6px; margin-left: auto; }
.hiw-more { margin-left: auto; font-size: 14px; }
.hiw-detail-text { margin: 8px 0 0; line-height: 1.6; }
.hiw-uses { display: flex; flex-wrap: wrap; align-items: center; gap: 6px; margin: 10px 0 0; }
.hiw-steps { margin: 12px 0 0 !important; padding-left: 22px !important; }
.hiw-steps li {
  position: relative;
  margin: 0 !important;
  padding: 6px 8px 8px;
  border-radius: 6px;
  color: var(--vp-c-text-3);
  line-height: 1.5;
  cursor: pointer;
  transition: color var(--hiw-t, 0.3s), background var(--hiw-t, 0.3s);
}
.hiw-steps li.done { color: var(--vp-c-text-2); }
.hiw-steps li.current {
  color: var(--vp-c-text-1);
  font-weight: 600;
  background: var(--vp-c-brand-soft);
}
.hiw-progress {
  position: absolute;
  left: 8px;
  right: 8px;
  bottom: 2px;
  height: 2px;
  border-radius: 1px;
  background: var(--vp-c-brand-1);
  transform-origin: left;
  animation: hiw-progress linear forwards;
}
@keyframes hiw-progress { from { transform: scaleX(0); } to { transform: scaleX(1); } }
.hiw-dim { color: var(--vp-c-text-3); }

@media (max-width: 640px) {
  .hiw-grid { grid-template-columns: minmax(0, 1fr); }
  .hiw-boxes-col { flex-direction: row; flex-wrap: wrap; }
  .hiw-step-nav { margin-left: 0; }
}
@media (prefers-reduced-motion: reduce) {
  .hiw { --hiw-t: 0s; }
  .focused .hiw-box.lit { transform: none !important; }
  .hiw-progress { display: none; }
}
</style>
