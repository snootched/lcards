// Lay out one dashboard view and mount its cards with the shared card runtime, as
// Home Assistant would: a layout view as one CSS grid of named areas, a sections view
// (12 grid columns per section column, 56 px rows, 8 px gaps), a masonry or panel view
// as a column of cards. Used by the demo board (DemoBoard.vue) and the preview page
// (PreviewBoard.vue).
import { sizeMount } from './card-demo-runtime.js'

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
  const place = (cell, config, after) => {
    env.ensureEntities(config)
    mounting.push(env.mount(cell, config).then((card) => {
      // switched to another view meanwhile: this card's cell is gone
      if (stale()) return env.unmount(card)
      onCard(card)
      after?.(card)
    }))
  }
  // a layout view: one CSS grid of named areas, as lcards-layout-view lays it out
  if (view.type === 'custom:lcards-layout-view') {
    const l = view.layout ?? {}
    const grid = document.createElement('div')
    grid.className = 'demo-board-layout'
    Object.assign(grid.style, {
      display: 'grid',
      gap: l['grid-gap'] ?? '8px',
      gridTemplateColumns: l['grid-template-columns'] ?? '1fr',
      gridTemplateRows: l['grid-template-rows'] ?? 'auto',
      gridTemplateAreas: l['grid-template-areas'] ?? 'none',
      // a dashboard's own height (the gallery's calc(100dvh - header) fills the window here too)
      // and padding; the showcase gives a min-height
      height: l.height ?? l['min-height'] ?? '900px',
      padding: l.padding ?? '0',
      boxSizing: 'border-box',
      ...(maxWidth ? { width: '100%', maxWidth: `${maxWidth}px`, margin: '0 auto' } : {}),
    })
    stage.appendChild(grid)
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
