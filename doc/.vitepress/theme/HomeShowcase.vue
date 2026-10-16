<script setup>
// The showcase recording (scripts/marketing-video.mjs) in the home hero, in place of
// the logo. WebM first, MP4 for browsers without VP9 (Safari). Muted before it loads
// and started from onMounted too: browsers only autoplay muted video, and a video
// Vue creates in the browser (dev server, arriving by a link) can miss `autoplay`.
import { ref, onMounted } from 'vue'
import { withBase } from 'vitepress'

const video = ref(null)
onMounted(() => {
  const el = video.value
  if (!el) return
  el.muted = true
  el.play()?.catch(() => { /* blocked by the browser: the poster stays */ })
})
</script>

<template>
  <div class="home-showcase">
    <video
      ref="video"
      muted autoplay loop playsinline preload="auto"
      :poster="withBase('/gallery/showcase.webp')"
      title="An empty LCARS view builds itself into a full dashboard, comes alive with a home's sensors and lights, then goes to red alert"
    >
      <source :src="withBase('/gallery/showcase.webm')" type="video/webm" />
      <source :src="withBase('/gallery/showcase.mp4')" type="video/mp4" />
    </video>
  </div>
</template>

<style scoped>
.home-showcase { width: 100%; }
.home-showcase video {
  display: block;
  width: 100%;
  height: auto;
  border-radius: 12px;
  border: 2px solid var(--vp-c-brand-1);
  background: #000;
}
</style>
<style>
/* The hero's image column holds the video instead of the round logo: no fixed square,
   none of the logo's negative margins, and more room beside the title on wide screens. */
.VPHero .image-container { width: 100%; height: auto; transform: none; }
.VPHero.has-image .image { margin: 0 0 32px; }
@media (min-width: 960px) {
  .VPHero.has-image .container { max-width: 1400px; }
  .VPHero.has-image .main { max-width: 520px; }
  .VPHero.has-image .image { flex-grow: 1.4; margin: 0 0 0 32px; }
}
</style>
