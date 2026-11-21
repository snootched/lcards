// Lay out one dashboard view and mount its cards with the shared card runtime, as
// Home Assistant would: a layout view as one CSS grid of named areas, a sections view
// (12 grid columns per section column, 56 px rows, 8 px gaps), a masonry or panel view
// as a column of cards. Used by the demo board (DemoBoard.vue) and the preview page
// (PreviewBoard.vue).
import { sizeMount } from './card-demo-runtime.js'
import { visibilityPasses } from '../../../src/utils/visibility-conditions.js'

export { visibilityPasses }

/** The window a dashboard (layout view) is designed for: the gallery's 1600 x 1000
 *  screenshots less Home Assistant's 56 px header. */
const DESIGN_WIDTH = 1600
const DESIGN_HEIGHT = 944

/** A layout view's height at its design size: its own px height, else the window's. */
function designHeight(layout) {
  const h = String(layout.height ?? layout['min-height'] ?? '')
  const px = /^\s*(\d+(?:\.\d+)?)\s*(px)?\s*$/.exec(h)
  return px ? Number(px[1]) : DESIGN_HEIGHT
}

/** Grid columns a card spans, out of the section's total. */
function span(card, total) {
  const columns = card.grid_options?.columns
  if (columns === 'full' || columns === undefined) return total
  return Math.min(total, Math.max(1, Number(columns) || total))
}

/**
 * Mount `view` into `stage` (emptied by the caller).
 * @param {HTMLElement} stage
 * @param {object} view - the view's config
 * @param {object} env - from cardRuntime()
 * @param {object} [opts]
 * @param {number} [opts.maxWidth] - a phone layout's width (px), centred
 * @param {() => boolean} [opts.stale] - true once the caller has moved on: late cards unmount
 * @param {(card: HTMLElement) => void} [opts.onCard] - each card once mounted
 * @returns {Promise<void>[]} one promise per card
 */
export function mountView(stage, view, env, { maxWidth, stale = () => false, onCard = () => {} } = {}) {
  // Narrow screens: twice the columns per card, as Home Assistant reflows a section
  const narrow = stage.clientWidth < 700
  const mounting = []
  // cards with `visibility:` conditions: their cells hide and show as the states change
  /** @type {Array<[HTMLElement, any[]]>} */
  const conditional = []
  const applyVisibility = () => {
    for (const [cell, conditions] of conditional) cell.style.display = visibilityPasses(conditions, env.hass) ? '' : 'none'
  }
  stage._lcardsVisibility?.()
  stage._lcardsVisibility = env.onState?.(applyVisibility)
  const place = (cell, config, after) => {
    if (Array.isArray(config.visibility) && config.visibility.length) {
      conditional.push([cell, config.visibility])
      applyVisibility()
    }
    env.ensureEntities(config)
    mounting.push(env.mount(cell, config).then((card) => {
      // switched to another view meanwhile: this card's cell is gone
      if (stale()) return env.unmount(card)
      onCard(card)
      after?.(card)
    }))
  }
  // a layout view: one CSS grid of named areas, as lcards-layout-view lays it out. A
  // dashboard is designed for a whole window, so it is built at that size (DESIGN_WIDTH,
  // or the view's max_width for a phone layout; a window-high view at DESIGN_HEIGHT) and
  // the stage scrolls sideways when it is narrower, as Home Assistant does in a narrow
  // window. Not scaled: cards that measure themselves on screen (charts) would draw for
  // the shrunk size and be shrunk again.
  if (view.type === 'custom:lcards-layout-view') {
    const l = view.layout ?? {}
    const width = maxWidth ?? DESIGN_WIDTH
    const height = designHeight(l)
    const frame = document.createElement('div')
    frame.className = 'demo-board-layout-frame'
    Object.assign(frame.style, { overflowX: 'auto', overflowY: 'hidden', maxWidth: '100%' })
    const grid = document.createElement('div')
    grid.className = 'demo-board-layout'
    Object.assign(grid.style, {
      display: 'grid',
      gap: l['grid-gap'] ?? '8px',
      gridTemplateColumns: l['grid-template-columns'] ?? '1fr',
      gridTemplateRows: l['grid-template-rows'] ?? 'auto',
      gridTemplateAreas: l['grid-template-areas'] ?? 'none',
      width: `${width}px`,
      height: `${height}px`,
      padding: l.padding ?? '0',
      boxSizing: 'border-box',
      margin: '0 auto',
    })
    frame.appendChild(grid)
    stage.appendChild(frame)
    for (const config of view.cards ?? []) {
      const cell = document.createElement('div')
      cell.className = 'demo-board-cell'
      const vl = config.view_layout ?? {}
      if (vl['grid-area']) cell.style.gridArea = vl['grid-area']
      if (vl['grid-column']) cell.style.gridColumn = vl['grid-column']
      if (vl['grid-row']) cell.style.gridRow = vl['grid-row']
      cell.style.minHeight = '0'
      grid.appendChild(cell)
      place(cell, config)
    }
    return mounting
  }
  for (const section of view.sections ?? []) {
    const total = 12 * (section.column_span ?? 1)
    const grid = document.createElement('div')
    grid.className = 'demo-board-section'
    grid.style.gridTemplateColumns = `repeat(${total}, minmax(0, 1fr))`
    stage.appendChild(grid)
    for (const config of section.cards ?? []) {
      const cell = document.createElement('div')
      cell.className = 'demo-board-cell'
      cell.style.gridColumn = `span ${narrow ? Math.min(total, span(config, total) * 2) : span(config, total)}`
      cell.style.height = sizeMount(config, null)
      grid.appendChild(cell)
      place(cell, config, (card) => { cell.style.height = sizeMount(config, card) })
    }
  }
  // masonry, sidebar or panel (and a view with no type): its cards in one column
  if (!view.sections && Array.isArray(view.cards)) {
    const column = document.createElement('div')
    column.className = 'demo-board-column'
    Object.assign(column.style, { display: 'flex', flexDirection: 'column', gap: '8px', maxWidth: view.type === 'panel' ? '' : '500px' })
    stage.appendChild(column)
    for (const config of view.type === 'panel' ? view.cards.slice(0, 1) : view.cards) {
      const cell = document.createElement('div')
      cell.className = 'demo-board-cell'
      if (view.type === 'panel') cell.style.height = '700px'
      column.appendChild(cell)
      place(cell, config, (card) => { if (view.type !== 'panel') cell.style.height = sizeMount(config, card) })
    }
  }
  return mounting
}
