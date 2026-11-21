<script setup lang="ts">
// A gallery dashboard's YAML, linked instead of inlined (getting-started/dashboard-gallery.md):
// the whole screens run to 1000-3000 lines each, and 17 of them highlighted inline made a
// 7.6 MB page whose every dev-server recompile held hundreds of MB. The files are served
// from this docs channel itself (config.mts: the dev server reads doc/gallery/dashboards/,
// docs:build copies them to gallery/yaml/), so each docs version links its own YAML.
import { ref } from 'vue'
import { withBase } from 'vitepress'

const props = defineProps<{ name: string }>()
const href = withBase(`/gallery/yaml/${props.name}.yaml`)
const copied = ref('')

async function copy() {
  try {
    const text = await (await fetch(href)).text()
    await navigator.clipboard.writeText(text)
    copied.value = 'Copied'
  } catch {
    copied.value = 'Copy failed: open the file instead'
  }
  setTimeout(() => { copied.value = '' }, 2500)
}
</script>

<template>
  <p class="gallery-yaml">
    <span class="gallery-yaml-label">YAML:</span>
    <a :href="href" target="_blank" rel="noopener">open {{ name }}.yaml</a>
    <a :href="href" :download="`${name}.yaml`">download</a>
    <button type="button" @click="copy">copy</button>
    <span v-if="copied" class="gallery-yaml-note">{{ copied }}</span>
  </p>
</template>

<style scoped>
.gallery-yaml {
  display: flex;
  flex-wrap: wrap;
  gap: 4px 16px;
  align-items: baseline;
}
.gallery-yaml-label {
  font-weight: 600;
}
.gallery-yaml button {
  color: var(--vp-c-brand-1);
  font-weight: 500;
  cursor: pointer;
}
.gallery-yaml button:hover {
  text-decoration: underline;
}
.gallery-yaml-note {
  color: var(--vp-c-text-2);
  font-size: 0.9em;
}
</style>
