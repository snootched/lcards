<script setup>
// The showcase recording (scripts/marketing-video.mjs), full width under the home hero.
import { withBase } from 'vitepress'
</script>

<template>
  <div class="home-showcase">
    <video
      :src="withBase('/gallery/showcase.webm')"
      :poster="withBase('/gallery/showcase.webp')"
      title="An empty LCARS view builds itself into a full dashboard, comes alive with a home's sensors and lights, then goes to red alert"
      autoplay loop muted playsinline
    ></video>
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
