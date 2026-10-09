<template>
  <div ref="host" class="pg-editor">
    <div v-if="!ready" class="pg-editor-loading">Loading editor...</div>
  </div>
</template>

<script setup>
// CodeMirror YAML editor for the docs playgrounds, with the card editor's own
// schema help (yaml-schema-assist.js): completion, hover descriptions and
// squiggles.
import { ref, watch, onMounted, onUnmounted } from 'vue'

const props = defineProps({
  modelValue: { type: String, default: '' },
  /** Card schema for completion, hover and lint */
  schema: { type: Object, default: null },
  /** Entities to suggest: [{ id, name }] */
  entities: { type: Array, default: () => [] }
})
const emit = defineEmits(['update:modelValue', 'cursor'])

const host = ref(null)
const ready = ref(false)
let view = null
let applying = false

function emitCursor() {
  if (!view) return
  emit('cursor', { text: view.state.doc.toString(), offset: view.state.selection.main.head })
}

onMounted(async () => {
  globalThis.__LCARDS_VERSION__ ??= 'docs'
  const [cmView, cmState, cmCommands, cmLang, cmLanguage, cmLint, cmAuto, theme, assist] = await Promise.all([
    import('@codemirror/view'),
    import('@codemirror/state'),
    import('@codemirror/commands'),
    import('@codemirror/lang-yaml'),
    import('@codemirror/language'),
    import('@codemirror/lint'),
    import('@codemirror/autocomplete'),
    import('@fsegurai/codemirror-theme-vscode-dark'),
    import('../../../src/editor/components/yaml/yaml-schema-assist.js')
  ])
  const { EditorView, keymap, lineNumbers, highlightActiveLine } = cmView
  actions = assist
  const getSchema = () => props.schema

  view = new EditorView({
    parent: host.value,
    state: cmState.EditorState.create({
      doc: props.modelValue,
      extensions: [
        lineNumbers(),
        highlightActiveLine(),
        cmCommands.history(),
        cmLanguage.bracketMatching(),
        cmLang.yaml(),
        keymap.of([...cmAuto.completionKeymap, ...cmCommands.defaultKeymap, ...cmCommands.historyKeymap, cmCommands.indentWithTab]),
        theme.vsCodeDark,
        EditorView.theme({
          '&': { fontSize: '13px', borderRadius: '8px' },
          '.cm-scroller': { minHeight: '300px', maxHeight: '520px', overflow: 'auto', fontFamily: 'var(--vp-font-family-mono)' },
          '.cm-tooltip-hover, .cm-tooltip-autocomplete': { zIndex: 50 }
        }),
        assist.yamlSchemaAssist({ getSchema, getEntities: () => props.entities }),
        cmLint.linter(assist.schemaLintSource(getSchema), { delay: 400 }),
        cmLint.lintGutter(),
        EditorView.updateListener.of((update) => {
          if (update.docChanged && !applying) emit('update:modelValue', update.state.doc.toString())
          if (update.docChanged || update.selectionSet) emitCursor()
        })
      ]
    })
  })
  ready.value = true
  emitCursor()
})

watch(() => props.modelValue, (text) => {
  if (!view || text === view.state.doc.toString()) return
  const head = Math.min(view.state.selection.main.head, text.length)
  applying = true
  view.dispatch({ changes: { from: 0, to: view.state.doc.length, insert: text }, selection: { anchor: head } })
  applying = false
  emitCursor()
})

onUnmounted(() => {
  view?.destroy()
  view = null
})

let actions = null

defineExpose({
  insertLines: (lines, indent) => view && actions?.insertLines(view, lines, indent),
  setLineValue: (value) => view && actions?.setLineValue(view, value),
  focus: () => view?.focus()
})
</script>

<style scoped>
.pg-editor {
  position: relative;
  min-height: 300px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
  background: #1e1e1e;
  overflow: hidden;
}
.pg-editor-loading {
  padding: 12px;
  color: #aaa;
  font-size: 13px;
}
</style>
