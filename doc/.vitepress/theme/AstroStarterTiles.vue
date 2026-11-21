<template>
  <div class="ast">
    <a v-for="t in tiles" :key="t.id" class="ast-tile" :href="t.href">
      <img v-if="t.src" :src="t.src" :alt="`The ${t.title} starter`" loading="lazy" />
      <span class="ast-title">{{ t.title }}</span>
      <span v-if="t.note" class="ast-note">{{ t.note }}</span>
    </a>
  </div>
</template>

<script setup>
// Starter picture tiles for the astrometrics docs: the Studio's own pictures
// (npm run astro:pictures, src/assets/images/astro-studio/starter-<id>.webp),
// each linking to the starter's live card on the Starters page.
// <AstroStarterTiles :items="[['galaxy', 'Galaxy with territories', 'scene units'], ...]" />
import { computed } from 'vue'
import { withBase } from 'vitepress'
import { starterSlug } from './astro-starter-tiles.js'

const props = defineProps({
  /** [id, title, note?] per tile, in order */
  items: { type: Array, required: true }
})

const PICTURES = import.meta.glob('../../../src/assets/images/astro-studio/starter-*.webp', { eager: true, query: '?url', import: 'default' })

const tiles = computed(() => props.items.map(([id, title, note]) => ({
  id,
  title,
  note,
  src: PICTURES[`../../../src/assets/images/astro-studio/starter-${id}.webp`] ?? null,
  href: withBase(`/cards/astrometrics/starters#${starterSlug(title)}`)
})))
</script>

<style scoped>
.ast { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 10px; margin: 16px 0; }
.ast-tile {
  display: flex; flex-direction: column; gap: 2px;
  padding: 6px 6px 8px;
  border: 1px solid var(--vp-c-divider); border-radius: 8px;
  background: var(--vp-c-bg-soft);
  color: var(--vp-c-text-1); text-decoration: none;
}
.ast-tile:hover { border-color: var(--vp-c-brand-1); }
.ast-tile img { width: 100%; aspect-ratio: 16 / 10; object-fit: cover; border-radius: 5px; background: #000; }
.ast-title { font-weight: 600; font-size: 13px; line-height: 1.3; margin-top: 4px; }
.ast-note { font-size: 12px; color: var(--vp-c-text-2); }
</style>
