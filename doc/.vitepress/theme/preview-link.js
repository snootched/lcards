// The preview page's link format (PreviewBoard.vue, doc/getting-started/preview.md):
// `#yaml=` + base64url(raw deflate(UTF-8 YAML)), no padding. Kept in the hash so the
// YAML never reaches a server. Other writers of the same format: the skill's
// lcards-preview-link.mjs (Node zlib.deflateRawSync) and the Python one-liner in
// SKILL.md (zlib.compressobj(9, zlib.DEFLATED, -15)). tests/docs/preview-link.test.js
// checks they agree. Browser and node: CompressionStream is global in both.

const PREFIX = 'yaml='

function toBase64Url(bytes) {
  let binary = ''
  for (let i = 0; i < bytes.length; i += 0x8000) binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000))
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function fromBase64Url(text) {
  const b64 = text.replace(/-/g, '+').replace(/_/g, '/')
  const binary = atob(b64 + '='.repeat((4 - (b64.length % 4)) % 4))
  return Uint8Array.from(binary, c => c.charCodeAt(0))
}

async function pipe(bytes, stream) {
  const out = new Response(new Blob([bytes]).stream().pipeThrough(stream))
  return new Uint8Array(await out.arrayBuffer())
}

/** YAML text -> the hash for the preview page (without the `#`). */
export async function encodePreview(yaml) {
  const packed = await pipe(new TextEncoder().encode(yaml), new CompressionStream('deflate-raw'))
  return PREFIX + toBase64Url(packed)
}

/**
 * The page's hash (with or without `#`) -> YAML text, or null when the hash holds
 * none. Throws when the hash names YAML but it can't be read (a cut-off link).
 */
export async function decodePreview(hash) {
  const value = String(hash ?? '').replace(/^#/, '')
  if (!value.startsWith(PREFIX)) return null
  const bytes = fromBase64Url(decodeURIComponent(value.slice(PREFIX.length)))
  return new TextDecoder().decode(await pipe(bytes, new DecompressionStream('deflate-raw')))
}

/**
 * What a pasted YAML holds, as the views to show: a dashboard (`views:`), one view
 * (`sections:`, `cards:` or a view `type:`), one card (`type: custom:...`) or a list
 * of cards. Cards are wrapped in a sections view, as a dashboard would place them.
 * @returns {{ views: { title: string, config: object }[], note?: string }}
 */
export function viewsOf(doc) {
  const card = (c) => c && typeof c === 'object' && typeof c.type === 'string'
  const asView = (cards) => ({ type: 'sections', sections: [{ cards }] })
  if (Array.isArray(doc)) {
    const cards = doc.filter(card)
    return cards.length ? { views: [{ title: 'Cards', config: asView(cards) }] } : { views: [] }
  }
  if (!doc || typeof doc !== 'object') return { views: [] }
  if (doc.strategy && !doc.views) {
    return { views: [], note: 'A dashboard strategy (such as the LCARS shell) builds its views inside Home Assistant, so it can\'t be shown here. Paste the views instead.' }
  }
  if (Array.isArray(doc.views)) {
    const views = doc.views.filter(v => v && typeof v === 'object' && !v.strategy)
      .map((v, i) => ({ title: String(v.title ?? v.path ?? `View ${i + 1}`), config: v }))
    const skipped = doc.views.length - views.length
    return { views, ...(skipped ? { note: `${skipped} view${skipped === 1 ? ' uses a strategy' : 's use strategies'} and can't be shown here.` } : {}) }
  }
  const type = String(doc.type ?? '')
  // A card (a layout card has `cards:` too): any custom type but the layout view, or a stock card type
  const isView = type === 'custom:lcards-layout-view' || ['sections', 'masonry', 'panel', 'sidebar'].includes(type)
  if (card(doc) && !isView) return { views: [{ title: 'Card', config: asView([doc]) }] }
  if (isView || doc.sections || doc.cards) return { views: [{ title: String(doc.title ?? 'View'), config: doc }] }
  return { views: [] }
}

/** The page's "Try an example" YAML (a small layout view); tests/docs/preview-link.test.js checks it. */
export const PREVIEW_SAMPLE = `type: custom:lcards-layout-view
layout:
  grid-template-columns: 160px minmax(0, 1fr)
  grid-template-rows: 60px 56px 56px 56px
  grid-template-areas: |
    "corner title"
    "lights main"
    "fan main"
    "door main"
  grid-gap: 8px
  height: 260px
cards:
  - type: custom:lcards-elbow
    elbow:
      type: header-left
    view_layout:
      grid-area: corner
  - type: custom:lcards-button
    preset: bar-label-left
    text:
      label:
        content: ENGINEERING
    view_layout:
      grid-area: title
  - type: custom:lcards-button
    preset: lozenge
    entity: light.engineering
    text:
      name:
        content: LIGHTS
        show: true
    view_layout:
      grid-area: lights
  - type: custom:lcards-button
    preset: lozenge
    entity: fan.warp_core_vent
    text:
      name:
        content: VENT
        show: true
    view_layout:
      grid-area: fan
  - type: custom:lcards-button
    preset: lozenge
    entity: binary_sensor.main_door
    tap_action:
      action: none
    text:
      name:
        content: DOOR
        show: true
    view_layout:
      grid-area: door
  - type: custom:lcards-slider
    preset: gauge-basic
    entity: sensor.warp_core_temperature
    view_layout:
      grid-area: main
`
