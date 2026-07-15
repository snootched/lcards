import DefaultTheme from 'vitepress/theme'
import { enhanceAppWithTabs } from 'vitepress-plugin-tabs/client'
import { onMounted, onUnmounted, h } from 'vue'
import HomeBadges from './HomeBadges.vue'
import AnimationPlayground from './AnimationPlayground.vue'
import FilterPlayground from './FilterPlayground.vue'
import EffectPlayground from './EffectPlayground.vue'
import './style.css'

// ── Mermaid SVG lightbox ───────────────────────────────────────────────────
// vitepress-plugin-mermaid renders inline SVGs via v-html, so we use a
// native <dialog> lightbox instead of any img-based zoom library.

let lightboxEl: HTMLDialogElement | null = null

function getLightbox(): HTMLDialogElement {
  if (lightboxEl) return lightboxEl
  lightboxEl = document.createElement('dialog')
  lightboxEl.className = 'mz-svg-lightbox'
  lightboxEl.innerHTML = '<div class="mz-svg-inner"></div>'
  document.body.appendChild(lightboxEl)
  // Close on backdrop click
  lightboxEl.addEventListener('click', (e) => {
    if (e.target === lightboxEl) lightboxEl!.close()
  })
  return lightboxEl
}

function openSvgLightbox(svgEl: SVGSVGElement) {
  const lb    = getLightbox()
  const inner = lb.querySelector('.mz-svg-inner')!
  // Clone so the original stays in the page
  const clone = svgEl.cloneNode(true) as SVGSVGElement
  // Ensure it fills the lightbox
  clone.removeAttribute('width')
  clone.removeAttribute('height')
  clone.style.cssText = 'width:100%;height:100%;max-height:80vh;'
  inner.innerHTML = ''
  inner.appendChild(clone)
  lb.showModal()
}

// ── Theme setup ───────────────────────────────────────────────────────────

export default {
  ...DefaultTheme,

  enhanceApp({ app }: { app: any }) {
    enhanceAppWithTabs(app)
    // Live anime.js preset demos (imports real src/core/packs/animations code
    // client-side) — registered globally so any doc page can drop in
    // <AnimationPlayground preset="pulse" />. Runs client-only; SSR just
    // renders the loading-shell fallback in the component's own template.
    app.component('AnimationPlayground', AnimationPlayground)
    // Live filter demos (imports real src/msd/utils/BaseSvgFilters.js client-
    // side) — <FilterPlayground type="blur" />. Same client-only pattern.
    app.component('FilterPlayground', FilterPlayground)
    // Live canvas background-animation demos (imports real
    // src/core/packs/backgrounds/BackgroundAnimationRenderer.js client-side)
    // — <EffectPlayground preset="grid" />. Lazy-mounts on scroll-into-view
    // (own IntersectionObserver) since several presets do real per-frame
    // per-pixel noise generation.
    app.component('EffectPlayground', EffectPlayground)
  },

  Layout() {
    return h(DefaultTheme.Layout, null, {
      'home-hero-actions-after': () => h(HomeBadges),
    })
  },


  setup() {
    // Delegated click for mermaid diagrams — no timing issues
    const handleMermaidClick = (e: MouseEvent) => {
      const mermaidDiv = (e.target as Element).closest?.('.vp-doc .mermaid')
      if (!mermaidDiv) return
      const svg = mermaidDiv.querySelector('svg')
      if (svg) openSvgLightbox(svg as SVGSVGElement)
    }

    onMounted(() => document.addEventListener('click', handleMermaidClick))
    onUnmounted(() => document.removeEventListener('click', handleMermaidClick))
  },
}

