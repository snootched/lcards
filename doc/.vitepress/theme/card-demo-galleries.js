// Gallery sets for CardGallery.vue: a grid of real cards, one per value of an option
// (every preset, every elbow type, ...), so readers can compare them side by side.
// Each tile is a full card config; tests/docs/card-demo-starters.test.js validates
// every one against its card schema, and tests/docs-site checks they all render.
import { BUTTON_PRESETS } from '../../../src/core/packs/style-presets/buttons/index.js'
import { SLIDER_PRESETS } from '../../../src/core/packs/style-presets/sliders/index.js'
import { getElbowTypeNames } from '../../../src/core/packs/components/elbows/index.js'

const buttonPresets = Object.keys(BUTTON_PRESETS).filter(p => p !== 'base')
const isBarLabel = (p) => p.startsWith('bar-label')
const isPanel = (p) => p.startsWith('panel-')

const buttonTile = (preset) => ({
  label: `preset: ${preset}`,
  yaml: `type: custom:lcards-button
entity: light.demo
preset: ${preset}
icon: mdi:lightbulb
${preset === 'icon' ? '' : `text:
  label:
    content: ${preset === 'number-block' ? '13-650' : 'MAIN LIGHTS'}
    show: ${preset !== 'toggle-tab'}
`}tap_action:
  action: toggle
`,
})

const barLabelTile = (preset) => ({
  label: `preset: ${preset}`,
  yaml: `type: custom:lcards-button
preset: ${preset}
interactive: false
text:
  label:
    content: ENGINEERING
`,
})

const panelTile = (preset) => ({
  label: `preset: ${preset}`,
  yaml: `type: custom:lcards-button
preset: ${preset}
`,
})

// Cards drawn to their cell height need a grid size in a sections view (as in HA).
// The Picard preset only declares compatibility: component: picard must be set.
const SLIDER_EXTRA = {
  'shaped-vertical': 'grid_options:\n  rows: 5\n',
  'picard-gauge-vertical': 'component: picard\ngrid_options:\n  rows: 7\n  columns: 6\n',
}
const sliderTile = (preset) => ({
  label: `preset: ${preset}`,
  yaml: `type: custom:lcards-slider
entity: light.demo
preset: ${preset}
control:
  attribute: brightness
${SLIDER_EXTRA[preset] ?? ''}`,
})

// A frame takes its side widths from elbow.frame (default 90 px on every side).
const elbowTile = (type) => ({
  label: `type: ${type}`,
  yaml: `type: custom:lcards-elbow
elbow:
  type: ${type}
${type === 'frame' ? `  frame:
    bar_width: 30
    bar_height: 14
` : `  segment:
    bar_width: 90
    bar_height: 20
`}`,
})

const arcTile = (curve) => ({
  label: `outer_curve: ${curve}`,
  yaml: `type: custom:lcards-elbow
elbow:
  type: header-left
  segment:
    bar_width: 90
    bar_height: 24
    outer_curve: ${curve}
    outer_curve_clamp: none
`,
})

const selectTile = (label, extra) => ({
  label,
  yaml: `type: custom:lcards-select-menu
entity: input_select.demo_mode
${extra}`,
})

/** Gallery sets by name: `{ minWidth, hint?, tiles: [{ label, yaml }] }` (hint: caption text). */
export const CARD_GALLERIES = {
  'button-presets': {
    hint: "Tap a button to toggle the sample light.",
    minWidth: 220,
    tiles: buttonPresets.filter(p => !isBarLabel(p) && !isPanel(p)).map(buttonTile),
  },
  // Bar label text scales to the bar height, so these need a full-width tile.
  'button-bar-labels': {
    minWidth: 560,
    tiles: buttonPresets.filter(isBarLabel).map(barLabelTile),
  },
  'button-panels': {
    minWidth: 220,
    tiles: buttonPresets.filter(isPanel).map(panelTile),
  },
  'slider-presets': {
    hint: "Drag a slider to set the sample light's brightness.",
    minWidth: 340,
    tiles: Object.keys(SLIDER_PRESETS).filter(p => p !== 'base').map(sliderTile),
  },
  'elbow-types': {
    minWidth: 260,
    tiles: getElbowTypeNames().map(elbowTile),
  },
  'elbow-styles': {
    minWidth: 300,
    tiles: [
      {
        label: 'style: simple',
        yaml: `type: custom:lcards-elbow
elbow:
  type: header-left
  segment:
    bar_width: 90
    bar_height: 20
`,
      },
      {
        label: 'style: segmented',
        yaml: `type: custom:lcards-elbow
elbow:
  type: header-left
  style: segmented
  segments:
    gap: 4
    outer_segment:
      bar_width: 90
      bar_height: 20
      color: var(--lcars-orange)
    inner_segment:
      bar_width: 30
      bar_height: 10
      color: var(--lcards-moonlight)
`,
      },
    ],
  },
  'elbow-arc-modes': {
    minWidth: 220,
    tiles: ['auto', 'arm_height', 'arm_max', 'arm_min', 'arm_fill', 12].map(arcTile),
  },
  'select-menu-layouts': {
    hint: "Tap an option to select it.",
    minWidth: 320,
    tiles: [
      selectTile('grid.columns: 2 (preset: lozenge)', `preset: lozenge
grid:
  columns: 2
  gap: 6px
`),
      selectTile('grid.columns: 4 (preset: capped)', `preset: capped
grid:
  columns: 4
  gap: 4px
grid_options:
  rows: 1
`),
      selectTile('grid.columns: 1 (preset: bullet)', `preset: bullet
grid:
  columns: 1
  gap: 4px
grid_options:
  rows: 4
`),
      selectTile('preset: outline', `preset: outline
grid:
  columns: 2
  gap: 6px
`),
    ],
  },
}
