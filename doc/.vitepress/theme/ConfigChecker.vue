<template>
  <div class="cc">
    <div class="cc-toolbar">
      <button type="button" class="cc-btn cc-btn-brand" @click="load(BROKEN)">Try a broken example</button>
      <button type="button" class="cc-btn" :disabled="!showingBroken" @click="load(FIXED)">Fix it</button>
      <button type="button" class="cc-btn" :disabled="!text" @click="load('')">Clear</button>
    </div>

    <PlaygroundEditor v-model="text" :schema="editorSchema" />

    <details v-if="text === BROKEN || text === FIXED" class="cc-pair" :open="text === FIXED">
      <summary>What was wrong with the example</summary>
      <table>
        <thead><tr><th>Before</th><th>After</th><th>Why</th></tr></thead>
        <tbody>
          <tr v-for="row in pairRows" :key="row.before">
            <td><code>{{ row.before }}</code></td>
            <td><code>{{ row.after }}</code></td>
            <td>{{ row.why }}</td>
          </tr>
        </tbody>
      </table>
    </details>

    <div class="cc-results" aria-live="polite" data-testid="checker-results">
      <p v-if="loadError" class="cc-summary cc-bad">The checker could not load: {{ loadError }}</p>
      <p v-else-if="!checker" class="cc-summary">Loading the checker...</p>
      <p v-else-if="!text.trim()" class="cc-summary">Paste a card, a view or a whole dashboard above. It is checked as you type.</p>
      <template v-else-if="result">
        <p v-if="result.parseError" class="cc-summary cc-bad">
          <span class="cc-badge cc-error">YAML</span>
          This isn't valid YAML<template v-if="result.parseError.line"> (line {{ result.parseError.line }})</template>: {{ result.parseError.message }}.
          Check the indentation (spaces, not tabs) and that every <code>key:</code> has a space after the colon.
        </p>
        <p v-else-if="!result.cards.length" class="cc-summary cc-bad">
          No LCARdS cards found. Each card needs a <code>type: custom:lcards-...</code> line.
        </p>
        <template v-else>
          <p class="cc-summary" :class="result.errors ? 'cc-bad' : result.warnings ? 'cc-warn' : 'cc-good'" data-testid="checker-summary">
            <template v-if="!result.errors && !result.warnings">All clear: no problems found in {{ plural(result.cards.length, 'LCARdS card') }}.</template>
            <template v-else>{{ summary }}</template>
          </p>
          <div v-for="card in result.cards.filter(c => c.issues.length)" :key="card.path" class="cc-card">
            <div class="cc-card-head">
              <code>{{ card.tag }}</code>
              <span v-if="card.path !== '(root)'" class="cc-dim">at {{ card.path }}</span>
              <span v-if="card.line" class="cc-dim">line {{ card.line }}</span>
              <a v-if="card.docs" :href="withBase(card.docs)" class="cc-docs">card docs</a>
            </div>
            <ul class="cc-issues">
              <li v-for="(issue, i) in card.issues" :key="i" class="cc-issue">
                <span class="cc-badge" :class="issue.severity === 'error' ? 'cc-error' : 'cc-warning'">{{ issue.severity }}</span>
                <span class="cc-where"><code>{{ issue.path }}</code><span v-if="issue.line" class="cc-dim"> line {{ issue.line }}</span></span>
                <span class="cc-msg">{{ issue.message }}</span>
                <a v-if="issue.docs" :href="withBase(issue.docs)" class="cc-docs">docs</a>
              </li>
            </ul>
          </div>
          <p v-if="result.warnings" class="cc-note">
            Warnings are names LCARdS doesn't know, almost always a typo: use the suggested name.
          </p>
        </template>
      </template>
    </div>
  </div>
</template>

<script setup>
// The "Check Your Config" page: the same checker as lcards-validate.mjs, in the
// browser. Logic in config-checker-core.js (tests/docs/config-checker.test.js).
import { ref, computed, watch, onMounted } from 'vue'
import { withBase } from 'vitepress'
import PlaygroundEditor from './PlaygroundEditor.vue'
import { BROKEN_SAMPLE as BROKEN, FIXED_SAMPLE as FIXED, SAMPLE_FIXES } from './config-checker-samples.js'

const text = ref('')
const checker = ref(null)
const entries = ref([])
const loadError = ref('')
const result = ref(null)

const showingBroken = computed(() => text.value === BROKEN)

// Schema completion in the editor when the YAML is one card.
const editorSchema = computed(() => {
  const tag = /^type:\s*["']?custom:([\w-]+)/m.exec(text.value)?.[1]
  const matches = text.value.match(/^\s*-?\s*type:\s*["']?custom:/gm) ?? []
  return matches.length === 1 ? entries.value.find(e => e.tag === tag)?.schema ?? null : null
})

// The lines the fix changed, beside why (SAMPLE_FIXES is in line order).
const pairRows = (() => {
  const before = BROKEN.split('\n')
  const after = FIXED.split('\n')
  const changed = before.map((line, i) => ({ before: line.trim(), after: after[i]?.trim() })).filter(r => r.before !== r.after)
  return changed.map((row, i) => ({ ...row, why: SAMPLE_FIXES[i]?.fix ?? '' }))
})()

const plural = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`
const summary = computed(() => {
  const r = result.value
  const parts = [r.errors && plural(r.errors, 'error'), r.warnings && plural(r.warnings, 'warning')].filter(Boolean)
  const cards = r.cards.filter(c => c.issues.length).length
  return `${parts.join(' and ')} in ${plural(cards, 'card')}${r.cards.length > cards ? ` (${r.cards.length - cards} more look fine)` : ''}.`
})

function load(sample) {
  text.value = sample
}

let timer = null
function run() {
  if (!checker.value) return
  result.value = text.value.trim() ? checker.value.check(text.value) : null
}
watch(text, () => {
  clearTimeout(timer)
  timer = setTimeout(run, 300)
})

onMounted(async () => {
  globalThis.__LCARDS_VERSION__ ??= 'docs'
  try {
    const [core, schemas, registries] = await Promise.all([
      import('./config-checker-core.js'),
      import('../../../scripts/lib/card-schemas.js'),
      fetch(withBase('/schema/registries.json')).then(r => (r.ok ? r.json() : null)).catch(() => null),
    ])
    entries.value = schemas.getSchemaEntries()
    checker.value = core.createChecker({ entries: entries.value, registries })
    run()
  } catch (err) {
    loadError.value = err?.message ?? String(err)
  }
})
</script>

<style scoped>
.cc { margin: 16px 0; }
.cc-toolbar { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 10px; }
.cc-btn {
  padding: 4px 14px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 999px;
  background: var(--vp-c-bg-soft);
  color: var(--vp-c-text-1);
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
}
.cc-btn:hover:not(:disabled) { border-color: var(--vp-c-brand-1); color: var(--vp-c-brand-1); }
.cc-btn:disabled { opacity: 0.45; cursor: default; }
.cc-btn-brand { background: var(--vp-c-brand-soft); border-color: var(--vp-c-brand-2); }
.cc-results { margin-top: 12px; }
.cc-summary { margin: 0 0 10px; padding: 10px 14px; border-radius: 8px; background: var(--vp-c-bg-soft); }
.cc-good { background: var(--vp-c-green-soft); }
.cc-warn { background: var(--vp-c-yellow-soft); }
.cc-bad { background: var(--vp-c-red-soft); }
.cc-card { border: 1px solid var(--vp-c-divider); border-radius: 8px; margin-bottom: 10px; overflow: hidden; }
.cc-card-head { display: flex; flex-wrap: wrap; gap: 10px; align-items: baseline; padding: 8px 12px; background: var(--vp-c-bg-soft); font-size: 14px; }
.cc-issues { list-style: none; margin: 0 !important; padding: 0 !important; }
.cc-issue {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  grid-template-areas: "badge where docs" "badge msg docs";
  column-gap: 10px;
  padding: 8px 12px;
  margin: 0 !important;
  border-top: 1px solid var(--vp-c-divider);
  font-size: 14px;
}
.cc-issue .cc-badge { grid-area: badge; align-self: start; }
.cc-where { grid-area: where; overflow-wrap: anywhere; }
.cc-msg { grid-area: msg; color: var(--vp-c-text-2); }
.cc-issue .cc-docs { grid-area: docs; align-self: start; }
.cc-badge {
  display: inline-block;
  min-width: 84px;
  padding: 1px 8px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 600;
  text-align: center;
  text-transform: uppercase;
}
.cc-error { background: var(--vp-c-red-soft); color: var(--vp-c-red-1); }
.cc-warning { background: var(--vp-c-yellow-soft); color: var(--vp-c-yellow-1); }
.cc-dim { color: var(--vp-c-text-3); font-size: 13px; }
.cc-docs { margin-left: auto; font-size: 13px; }
.cc-note { font-size: 14px; color: var(--vp-c-text-2); }
.cc-pair { margin: 10px 0 0; font-size: 14px; }
.cc-pair summary { cursor: pointer; color: var(--vp-c-text-2); }
.cc-pair table { margin: 8px 0 0; }
</style>
