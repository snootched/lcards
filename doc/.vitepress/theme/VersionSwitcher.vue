<script setup lang="ts">
// Version switcher next to the site title: Latest / Dev / archived releases from /versions.json
// (site root; written by scripts/docs-deploy.mjs). Switching keeps the page path,
// or opens the target's home page when that page doesn't exist there.
import { ref, computed, onMounted } from 'vue'
import { useData } from 'vitepress'
import { switcherEntries, pathInBase } from './docs-versions.js'

const { theme } = useData()
const current = computed(() => theme.value.docsChannel ?? { channel: 'latest', version: '', base: '/' })
const versions = ref<{ latest?: string; dev?: string; versions?: string[] } | null>(null)
const entries = computed(() => switcherEntries(versions.value, current.value))

onMounted(async () => {
  try {
    const res = await fetch('/versions.json', { cache: 'no-cache' })
    if (res.ok) versions.value = await res.json()
  } catch { /* local build or preview: no channels list */ }
})

async function go(base: string) {
  if (base === current.value.base) return
  const target = pathInBase(location.pathname, current.value.base, base) + location.hash
  try {
    const res = await fetch(target.split('#')[0], { method: 'HEAD' })
    location.href = res.ok ? target : base
  } catch {
    location.href = base
  }
}
</script>

<template>
  <div v-if="entries.length > 1" class="lcards-version-switcher">
    <select id="lcards-version-select" aria-label="Docs version" :value="current.base" @change="go(($event.target as HTMLSelectElement).value)">
      <option v-for="e in entries" :key="e.base" :value="e.base">{{ e.label }}</option>
    </select>
  </div>
</template>

<style scoped>
.lcards-version-switcher {
  display: flex;
  align-items: center;
  margin-left: 12px;
}
select {
  font: inherit;
  font-size: 13px;
  color: var(--vp-c-text-1);
  background: var(--vp-c-bg-soft);
  border: 1px solid var(--vp-c-divider);
  border-radius: 6px;
  padding: 2px 6px;
  max-width: 190px;
  cursor: pointer;
}
</style>
