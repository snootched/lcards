// Keep a linked heading in view while the page above it settles.
//
// VitePress scrolls to #id once, as soon as the page renders. Live examples (CardDemo,
// galleries, playgrounds) mount after that and grow from a small placeholder to their
// real height, so everything below them moves down: a link to a section low on a page
// full of examples (lcars-patterns#fleet-tiles) ended up thousands of px past it.
// While the page's height changes, put the heading back where VitePress put it. Stops
// at the reader's first scroll, key or click, or after 15 s.
import { getScrollOffset } from 'vitepress'

const KEEP_MS = 15000

let stop: (() => void) | null = null

/** Where VitePress scrolls a heading to (its own formula: offset, then the heading's top padding). */
function targetY(el: HTMLElement): number {
  const padding = parseInt(getComputedStyle(el).paddingTop, 10) || 0
  return window.scrollY + el.getBoundingClientRect().top - getScrollOffset() + padding
}

export function keepAnchorInView(): void {
  stop?.()
  if (typeof window === 'undefined' || !window.location.hash) return
  const id = decodeURIComponent(window.location.hash.slice(1))
  const el = document.getElementById(id)
  if (!el) return
  const pin = () => {
    const y = targetY(el)
    if (Math.abs(y - window.scrollY) > 1) window.scrollTo({ top: y, behavior: 'instant' })
  }
  const observer = new ResizeObserver(pin)
  observer.observe(document.body)
  const inputs = ['wheel', 'touchstart', 'keydown', 'mousedown'] as const
  const timer = window.setTimeout(() => stop?.(), KEEP_MS)
  stop = () => {
    observer.disconnect()
    window.clearTimeout(timer)
    for (const type of inputs) window.removeEventListener(type, onInput, true)
    stop = null
  }
  function onInput() { stop?.() }
  for (const type of inputs) window.addEventListener(type, onInput, { capture: true, passive: true })
  pin()
}

export function stopKeepingAnchor(): void {
  stop?.()
}
