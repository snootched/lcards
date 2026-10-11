<template>
  <div class="card-gallery" :style="{ '--tile-min': `${gallery?.minWidth ?? 240}px` }">
    <p v-if="!gallery" class="card-gallery-error">Unknown gallery "{{ set }}".</p>
    <p v-else-if="fatal" class="card-gallery-error">{{ fatal }}</p>
    <div v-else class="card-gallery-grid">
      <figure v-for="(tile, i) in gallery.tiles" :key="tile.label" class="card-gallery-tile">
        <div class="card-gallery-panel">
          <div :ref="el => (mounts[i] = el)" class="card-gallery-mount"></div>
        </div>
        <figcaption>
          <code>{{ tile.label }}</code>
          <details>
            <summary>YAML</summary>
            <pre><code>{{ tile.yaml }}</code></pre>
          </details>
        </figcaption>
      </figure>
    </div>
    <p v-if="gallery" class="card-gallery-caption">
      Real cards with sample entities.<span v-if="gallery.hint"> {{ gallery.hint }}</span>
    </p>
  </div>
</template>

<script setup>
// A grid of real LCARdS cards, one per value of an option (every preset, every
// elbow type, ...). Sets live in card-demo-galleries.js; usage in markdown:
// <CardGallery set="button-presets" />
import { computed, ref, onMounted, onUnmounted } from 'vue'
import { CARD_GALLERIES } from './card-demo-galleries.js'
import { cardRuntime, sizeMount, mountWidth } from './card-demo-runtime.js'

const props = defineProps({
  /** Gallery set name (a key of CARD_GALLERIES) */
  set: { type: String, required: true }
})

const gallery = computed(() => CARD_GALLERIES[props.set])
const mounts = []
const fatal = ref('')
const cards = []
let env = null

onMounted(async () => {
  if (!gallery.value) return
  try {
    const yamlMod = await import('js-yaml')
    const yamlLib = yamlMod.default ?? yamlMod
    env = await cardRuntime()
    await Promise.all(gallery.value.tiles.map(async (tile, i) => {
      const el = mounts[i]
      if (!el) return
      const config = yamlLib.load(tile.yaml)
      env.ensureEntities(config)
      el.style.height = sizeMount(config, null)
      el.style.width = mountWidth(config)
      const card = await env.mount(el, config)
      cards.push(card)
      el.style.height = sizeMount(config, card)
    }))
  } catch (error) {
    fatal.value = `The cards could not load: ${error.message}`
  }
})

onUnmounted(() => {
  for (const card of cards) env?.unmount(card)
})
</script>

<style scoped>
/* grid_options.columns narrows the card (mountWidth); never past the panel */
.card-gallery-mount {
  max-width: 100%;
}
.card-gallery {
  margin: 12px 0 24px;
}
.card-gallery-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(min(var(--tile-min), 100%), 1fr));
  gap: 12px;
}
.card-gallery-tile {
  margin: 0;
  min-width: 0;
}
/* LCARS dashboards are dark; each card sits on a black panel */
.card-gallery-panel {
  padding: 12px;
  border-radius: 8px;
  background: #000;
  overflow: hidden;
}
.card-gallery-tile figcaption {
  margin-top: 4px;
  font-size: 13px;
}
.card-gallery-tile details {
  margin-top: 2px;
  color: var(--vp-c-text-2);
}
.card-gallery-tile summary {
  cursor: pointer;
  font-size: 12px;
}
.card-gallery-tile pre {
  margin: 4px 0 0;
  padding: 8px;
  border-radius: 6px;
  background: var(--vp-code-block-bg);
  font-size: 12px;
  line-height: 1.5;
  overflow-x: auto;
}
.card-gallery-caption {
  margin: 8px 0 0;
  font-size: 13px;
  color: var(--vp-c-text-2);
}
.card-gallery-error {
  color: var(--vp-c-danger-1);
}
</style>
