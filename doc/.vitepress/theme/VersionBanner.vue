<script setup lang="ts">
// Banner on /dev/ and archived /v/<version>/ builds (never on the stable root).
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { useData } from 'vitepress'
import { bannerFor, pathInBase } from './docs-versions.js'

const { theme } = useData()
const current = computed(() => theme.value.docsChannel ?? { channel: 'latest', version: '', base: '/' })
const versions = ref<{ latest?: string } | null>(null)
const banner = computed(() => bannerFor(current.value, versions.value))

// VitePress's navbar is fixed to the top: --vp-layout-top-height moves it (and the
// page) down by the banner's height, which changes with the text and the width.
const el = ref<HTMLElement | null>(null)
const setOffset = () => document.documentElement.style.setProperty('--vp-layout-top-height', `${el.value?.offsetHeight ?? 0}px`)
let observer: ResizeObserver | null = null
watch(banner, () => nextTick(setOffset))
onMounted(() => {
  setOffset()
  if (el.value && 'ResizeObserver' in window) {
    observer = new ResizeObserver(setOffset)
    observer.observe(el.value)
  }
})
onUnmounted(() => {
  observer?.disconnect()
  document.documentElement.style.removeProperty('--vp-layout-top-height')
})

onMounted(async () => {
  if (current.value.channel === 'latest') return
  try {
    const res = await fetch('/versions.json', { cache: 'no-cache' })
    if (res.ok) versions.value = await res.json()
  } catch { /* text without the latest version */ }
})

async function toLatest() {
  const target = pathInBase(location.pathname, current.value.base, '/') + location.hash
  try {
    const res = await fetch(target.split('#')[0], { method: 'HEAD' })
    location.href = res.ok ? target : '/'
  } catch {
    location.href = '/'
  }
}
</script>

<template>
  <div v-if="banner" ref="el" class="lcards-version-banner" role="note">
    <span>{{ banner.text }}</span>
    <!-- A button, not a link: VitePress's router would take an <a> click first. -->
    <button type="button" @click="toLatest">Go to the latest docs</button>
  </div>
</template>

<style scoped>
.lcards-version-banner {
  /* Fixed, as VitePress expects of layout-top content when --vp-layout-top-height is set. */
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: var(--vp-z-index-layout-top, 40);
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 4px 12px;
  padding: 8px 16px;
  font-size: 14px;
  line-height: 1.4;
  text-align: center;
  color: var(--vp-c-warning-1);
  /* Opaque: the page scrolls under a fixed banner. */
  background: linear-gradient(var(--vp-c-warning-soft), var(--vp-c-warning-soft)), var(--vp-c-bg);
  border-bottom: 1px solid var(--vp-c-divider);
}
.lcards-version-banner button {
  font: inherit;
  font-weight: 600;
  color: var(--vp-c-brand-1);
  text-decoration: underline;
  background: none;
  border: 0;
  padding: 0;
  cursor: pointer;
}
</style>
