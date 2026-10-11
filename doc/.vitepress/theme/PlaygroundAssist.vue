<template>
  <div class="pg-assist">
    <details class="pg-section" open>
      <summary>Quick settings</summary>
      <p v-if="!parsed" class="pg-note">Fix the YAML error to use quick settings.</p>
      <div v-else class="pg-controls">
        <template v-for="control in visibleControls" :key="control.label">
          <label class="pg-control">
            <span class="pg-control-label" :title="control.help">{{ control.label }}</span>

            <select v-if="control.kind === 'select'" :value="selectValue(control)" @change="set(control, fromSelect($event.target.value))">
              <option v-if="control.optional" value="">(not set)</option>
              <option v-for="o in control.choices" :key="String(o)" :value="String(o)">{{ o }}</option>
            </select>

            <select v-else-if="control.kind === 'entity'" :value="control.value ?? ''" @change="set(control, $event.target.value)">
              <option value="">(none)</option>
              <option v-for="e in entityChoices(control.value)" :key="e.id" :value="e.id">{{ e.id }}</option>
            </select>

            <span v-else-if="control.kind === 'color'" class="pg-color">
              <span class="pg-swatch" :style="{ background: control.value || 'transparent' }"></span>
              <input type="text" :list="`pg-colors-${uid}`" placeholder="(default)" :value="control.value ?? ''"
                @change="set(control, $event.target.value.trim())">
            </span>

            <input v-else-if="control.kind === 'checkbox'" type="checkbox" :checked="!!control.value" @change="set(control, $event.target.checked)">

            <span v-else-if="control.kind === 'range'" class="pg-range">
              <input type="range" :min="control.min" :max="control.max" :step="control.step" :value="control.value ?? control.max"
                @change="set(control, Number($event.target.value))">
              <span>{{ control.value ?? control.max }}</span>
            </span>

            <input v-else-if="control.kind === 'number'" type="number" :min="control.min" :max="control.max" :step="control.step ?? 1"
              :value="control.value ?? ''" @change="set(control, $event.target.value === '' ? '' : Number($event.target.value))">

            <input v-else type="text" :value="control.value ?? ''" @change="set(control, $event.target.value)">
          </label>
        </template>
      </div>
    </details>

    <datalist :id="`pg-colors-${uid}`">
      <option v-for="c in COLOR_CHOICES" :key="c.value" :value="c.value">{{ c.label }}</option>
      <option value="#ff9900">hex</option>
      <option value="rgb(255, 153, 0)">rgb</option>
    </datalist>

    <PlaygroundEditor
      ref="editor"
      :model-value="modelValue"
      :schema="schema"
      :entities="SAMPLE_ENTITY_OPTIONS"
      @update:model-value="(t) => emit('update:modelValue', t)"
      @cursor="onCursor"
    />
    <p class="pg-hint">Type to get suggestions (Ctrl+Space shows them anywhere). Hover a key for its description.</p>

    <details class="pg-section" open>
      <summary>Options here <code class="pg-crumb">{{ crumb }}</code></summary>
      <template v-if="panel.kind === 'values'">
        <p class="pg-note">
          <code>{{ panel.key }}</code><span v-if="panel.type"> ({{ panel.type }})</span><span v-if="panel.description">: {{ panel.description }}</span>
          <a v-if="panel.docs" :href="href(panel.docs)" target="_blank" rel="noopener"> Docs</a>
        </p>
        <div v-if="panel.choices.length" class="pg-chips">
          <button v-for="c in panel.choices" :key="c.label" type="button" class="pg-chip" @click="editor.setLineValue(quoteIfNeeded(c.value))">{{ c.label }}</button>
        </div>
      </template>
      <template v-else>
        <input v-if="panel.options.length > 8" v-model="filter" class="pg-filter" type="search" placeholder="Filter options">
        <p v-if="!panel.options.length" class="pg-note">No more options here. Move the cursor into a section (e.g. under <code>style:</code>) to see its options.</p>
        <ul class="pg-options">
          <li v-for="o in filteredOptions" :key="o.key">
            <div class="pg-option-head">
              <code class="pg-option-key">{{ o.key }}</code>
              <span class="pg-option-type">{{ o.type }}</span>
              <span v-if="o.default !== undefined" class="pg-option-default">default {{ JSON.stringify(o.default) }}</span>
              <span class="pg-option-actions">
                <button type="button" class="pg-btn" @click="insert(o)">Insert</button>
                <a v-if="o.docs" class="pg-btn" :href="href(o.docs)" target="_blank" rel="noopener">Docs</a>
              </span>
            </div>
            <div v-if="o.description" class="pg-option-desc">{{ o.description }}</div>
          </li>
        </ul>
      </template>
    </details>
  </div>
</template>

<script setup>
// Playground helpers around the YAML editor: quick settings for common
// options, and an "Options here" panel listing what can go at the cursor,
// both driven by the card schema (see playground-controls.js).
import { ref, computed, getCurrentInstance } from 'vue'
import { parse, parseDocument } from 'yaml'
import PlaygroundEditor from './PlaygroundEditor.vue'
import { PLAYGROUNDS, COLOR_CHOICES, SAMPLE_ENTITY_OPTIONS, applyControl, controlValue } from './playground-controls.js'
import { schemaAt } from '../../../src/editor/utils/yaml-schema-path.js'
import { panelAt, insertLinesFor, quoteIfNeeded } from '../../../src/editor/utils/yaml-options-model.js'

const props = defineProps({
  modelValue: { type: String, default: '' },
  /** Card element name, e.g. 'lcards-chart' */
  card: { type: String, required: true },
  schema: { type: Object, default: null }
})
const emit = defineEmits(['update:modelValue'])

const uid = getCurrentInstance()?.uid ?? Math.random().toString(36).slice(2)
const editor = ref(null)
const cursor = ref({ text: '', offset: 0 })
const filter = ref('')

const spec = computed(() => PLAYGROUNDS[props.card] || { controls: [] })

const parsed = computed(() => {
  const doc = parseDocument(props.modelValue)
  if (doc.errors.length) return null
  const js = doc.toJS()
  return js && typeof js === 'object' ? js : {}
})

const visibleControls = computed(() => {
  const cfg = parsed.value
  if (!cfg) return []
  return spec.value.controls
    .filter(c => !c.show || c.show(cfg))
    .map(c => {
      const node = c.path && props.schema ? schemaAt(props.schema, c.path, cfg) : null
      return {
        ...c,
        value: controlValue(c, cfg),
        // Open string keys (e.g. button `preset`) list their values as examples.
        choices: c.options || node?.enum
          || (Array.isArray(node?.examples) && node.examples.every(x => typeof x === 'string') ? node.examples : []),
        help: node?.description || ''
      }
    })
})

function set(control, value) {
  const original = spec.value.controls.find(c => c.label === control.label)
  emit('update:modelValue', applyControl(props.modelValue, original, value))
}

const selectValue = (c) => (c.value === undefined || c.value === null ? '' : String(c.value))
const fromSelect = (v) => (v === '' ? '' : (/^-?\d+(\.\d+)?$/.test(v) ? Number(v) : v))
const entityChoices = (current) => (current && !SAMPLE_ENTITY_OPTIONS.some(e => e.id === current)
  ? [{ id: current }, ...SAMPLE_ENTITY_OPTIONS] : SAMPLE_ENTITY_OPTIONS)

/** Docs pages are .html files on the built site (cleanUrls is off). */
const href = (link) => link.replace(/^([^#]*[^/#])(#|$)/, '$1.html$2')

function onCursor(c) {
  cursor.value = c
}

/** What the options panel shows for the cursor position (shared with HA's YAML tab). */
const panel = computed(() => panelAt(props.schema, cursor.value.text, cursor.value.offset, parse, props.card))

const filteredOptions = computed(() => {
  const needle = filter.value.trim().toLowerCase()
  const list = panel.value.options || []
  return needle ? list.filter(o => o.key.includes(needle) || (o.description || '').toLowerCase().includes(needle)) : list
})

const crumb = computed(() => panel.value.crumb)

/** Insert an option at the panel's level, with a starter value. */
function insert(option) {
  editor.value?.insertLines(insertLinesFor(option, panel.value, props.schema, parsed.value || undefined), panel.value.indent)
}
</script>

<style scoped>
.pg-assist {
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: 0;
}
.pg-section {
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
  padding: 6px 10px;
  background: var(--vp-c-bg-soft);
}
.pg-section > summary {
  cursor: pointer;
  font-size: 13px;
  font-weight: 600;
}
.pg-crumb {
  font-weight: 400;
  font-size: 12px;
  margin-left: 6px;
}
.pg-controls {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 6px 12px;
  margin: 8px 0 4px;
}
.pg-control {
  display: flex;
  flex-direction: column;
  gap: 2px;
  font-size: 12px;
}
.pg-control-label {
  color: var(--vp-c-text-2);
}
.pg-control select,
.pg-control input[type='text'],
.pg-control input[type='number'],
.pg-color input,
.pg-filter {
  padding: 3px 6px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 6px;
  background: var(--vp-c-bg);
  color: var(--vp-c-text-1);
  font-size: 13px;
  min-width: 0;
}
.pg-control input[type='checkbox'] {
  width: 16px;
  height: 16px;
}
.pg-color {
  display: flex;
  align-items: center;
  gap: 6px;
}
.pg-color input {
  flex: 1;
  min-width: 0;
}
.pg-swatch {
  width: 18px;
  height: 18px;
  flex: none;
  border: 1px solid var(--vp-c-divider);
  border-radius: 4px;
}
.pg-range {
  display: flex;
  align-items: center;
  gap: 6px;
}
.pg-range input {
  flex: 1;
  min-width: 0;
}
.pg-hint,
.pg-note {
  margin: 4px 0;
  font-size: 12px;
  color: var(--vp-c-text-2);
}
.pg-filter {
  width: 100%;
  margin: 6px 0;
}
.pg-options {
  list-style: none;
  margin: 6px 0 0;
  padding: 0;
  max-height: 320px;
  overflow: auto;
}
.pg-options li {
  margin: 0;
  padding: 6px 0;
  border-top: 1px solid var(--vp-c-divider);
}
.pg-option-head {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 6px;
  font-size: 12px;
}
.pg-option-key {
  font-size: 13px;
}
.pg-option-type,
.pg-option-default {
  color: var(--vp-c-text-3);
  font-family: var(--vp-font-family-mono);
}
.pg-option-actions {
  margin-left: auto;
  display: flex;
  gap: 4px;
}
.pg-option-desc {
  margin-top: 2px;
  font-size: 12px;
  color: var(--vp-c-text-2);
}
.pg-btn,
.pg-chip {
  padding: 1px 8px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 6px;
  background: var(--vp-c-bg);
  color: var(--vp-c-text-1);
  font-size: 12px;
  cursor: pointer;
  text-decoration: none;
}
.pg-btn:hover,
.pg-chip:hover {
  border-color: var(--vp-c-brand-1);
}
.pg-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin: 4px 0;
}
</style>
