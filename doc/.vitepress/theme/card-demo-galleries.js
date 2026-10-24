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
    content: MAIN LIGHTS
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
  'ring': 'grid_options:\n  rows: 4\n',
  'picard-ring': 'grid_options:\n  rows: 4\n',
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
/** A button that decodes its label on show and again on tap (text-decode gallery). */
const decodeTile = (label, params) => ({
  label,
  yaml: `type: custom:lcards-button
preset: lozenge
tap_action:
  action: none
text:
  name:
    content: SENSOR ARRAY ONLINE
    show: true
animations:
  - trigger: on_show
    preset: text-decode${params ? `\n    params: ${params}` : ''}
  - trigger: on_tap
    preset: text-decode${params ? `\n    params: ${params}` : ''}
`,
});

/** A card that boots on show and again on tap (boot-sequence gallery). */
const bootTile = (label, card, params) => ({
  label,
  yaml: `${card}tap_action:
  action: none
animations:
  - trigger: on_show
    preset: boot-sequence${params ? `\n    params: ${params}` : ''}
  - trigger: on_tap
    preset: boot-sequence${params ? `\n    params: ${params}` : ''}
`,
});
const BOOT_LOZENGE = `type: custom:lcards-button
preset: lozenge
text:
  name:
    content: WARP CORE
    show: true
`;
const BOOT_BORDERED = `type: custom:lcards-button
preset: lozenge
text:
  name:
    content: SHIELDS
    show: true
style:
  border:
    width: 3
    color: var(--lcars-orange)
`;
const BOOT_ELBOW = `type: custom:lcards-elbow
elbow:
  type: header-left
  segment:
    bar_width: 90
    bar_height: 24
`;

/** A card with a looping sensor sweep (sensor-sweep gallery). */
const sweepTile = (label, card, params) => ({
  label,
  yaml: `${card}animations:
  - trigger: on_load
    preset: sensor-sweep${params ? `\n    params: ${params}` : ''}
`,
});

/** A decorative data grid that ripples from the tap (tap-ripple gallery). */
const rippleTile = (label, params) => ({
  label,
  yaml: `type: custom:lcards-data-grid
data_mode: decorative
format: hex
refresh_interval: 0
grid:
  grid-template-columns: repeat(6, 1fr)
  grid-template-rows: repeat(4, auto)
  gap: 6px
style:
  font_size: 16px
animations:
  - trigger: on_tap
    preset: tap-ripple
    target: .grid-cell${params ? `\n    params: ${params}` : ''}
`,
});

// WebGL backgrounds: a frame elbow (no fill of its own) around each one
const webglTile = (label, effect) => ({
  label,
  yaml: `type: custom:lcards-elbow
elbow:
  type: frame
  segment:
    color: var(--lcards-gray)
  frame:
    bar_width: 4
    bar_height: 4
    outer_curve: 10
background_animation:
  inset: auto
  effects:
${effect.replace(/^/gm, '    ')}
grid_options:
  rows: 4
`,
})

export const CARD_GALLERIES = {
  'background-webgl': {
    hint: 'Drawn with WebGL in your browser; without it each falls back to its Canvas2D version.',
    minWidth: 280,
    tiles: [
      webglTile('grid, view: floor', '- preset: grid\n  config:\n    view: floor\n    color: var(--lcards-orange)\n    line_width: 2'),
      webglTile('grid-hexagonal, view: floor', '- preset: grid-hexagonal\n  config:\n    view: floor\n    line_width_minor: 2'),
      webglTile('grid, majors, tilted', '- preset: grid\n  config:\n    view: floor\n    camera_tilt: 40\n    camera_yaw: 20\n    color: var(--lcards-orange)\n    major_row_interval: 4\n    major_col_interval: 4\n    color_major: var(--lcards-moonlight)\n    line_width_major: 3'),
      webglTile('holo-sphere', '- preset: holo-sphere\n  config:\n    line_width: 1.5'),
      webglTile('warp-starfield', '- preset: warp-starfield\n  config:\n    count: 800\n    speed: 3'),
      webglTile('nebula, volumetric', '- preset: nebula\n  config:\n    cloud_count: 5\n    colors: [var(--lcards-purple), var(--lcards-blue-medium), var(--lcards-orange)]\n    volumetric: true'),
      webglTile('contour-field', '- preset: contour-field\n  config:\n    num_bands: 7\n    colors: [var(--lcards-blue-darkest), var(--lcards-blue-medium), var(--lcards-blue-light)]'),
      webglTile('plasma', '- preset: plasma'),
      webglTile('fluid', '- preset: fluid\n  config:\n    color: var(--lcards-blue-light)'),
    ],
  },
  'text-decode': {
    hint: 'Tap a button to decode it again.',
    minWidth: 280,
    tiles: [
      decodeTile('defaults (A-Z0-9, from left)'),
      decodeTile('chars: numbers, from: right', '{chars: numbers, from: right}'),
      decodeTile('chars: blocks, from: center', '{chars: blocks, from: center, duration: 1400}'),
      decodeTile('cursor, perturbation, slower', '{cursor: true, perturbation: 0.4, duration: 2000}'),
    ],
  },
  'tap-ripple': {
    hint: 'Tap anywhere on a grid: the wave starts where you tap.',
    minWidth: 280,
    tiles: [
      rippleTile('defaults'),
      rippleTile('orange flash, jitter', '{color: var(--lcars-orange), jitter: 40}'),
      rippleTile('inward, slower', '{reversed: true, spread: 800, scale: 1.15}'),
      rippleTile('from the centre on any trigger', '{from: center, opacity_min: 0.1}'),
    ],
  },
  'boot-sequence': {
    hint: 'Tap a card to boot it again.',
    minWidth: 280,
    tiles: [
      bootTile('flicker (default)', BOOT_LOZENGE),
      bootTile('sweep from the left', BOOT_LOZENGE, '{fill: sweep}'),
      bootTile('border draws in, fade', BOOT_BORDERED, '{fill: fade, duration: 1600}'),
      bootTile('elbow, sweep from the top', BOOT_ELBOW, '{fill: sweep, from: top}'),
    ],
  },
  'sensor-sweep': {
    minWidth: 280,
    tiles: [
      sweepTile('radar component', 'type: custom:lcards-button\ncomponent: radar\n', '{color: var(--lcars-orange), radius: 40}'),
      sweepTile('lozenge, narrow wedge', 'type: custom:lcards-button\npreset: lozenge\n', '{color: var(--lcars-orange), angle: 20, duration: 2000}'),
      sweepTile('elbow corner, counter-clockwise', `${BOOT_ELBOW}`, '{center: [45, 12], radius: 70, direction: ccw, color: var(--lcars-blue)}'),
    ],
  },
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
  'slider-ring': {
    hint: 'Drag around a ring to set the sample light\'s brightness.',
    minWidth: 220,
    tiles: [
      { label: 'preset: ring', yaml: 'type: custom:lcards-slider\nentity: light.demo\npreset: ring\ngrid_options:\n  rows: 4\n' },
      { label: 'preset: picard-ring', yaml: 'type: custom:lcards-slider\nentity: light.demo\npreset: picard-ring\ngrid_options:\n  rows: 4\n' },
      { label: 'full ring, flat ends, scale', yaml: 'type: custom:lcards-slider\nentity: light.demo\npreset: ring\ngrid_options:\n  rows: 4\nstyle:\n  ring:\n    start_angle: 0\n    end_angle: 0\n    cap: flat\n    scale:\n      tick_marks:\n        major:\n          interval: 25\n        minor:\n          interval: 5\n      labels:\n        show_unit: false\n' },
      { label: 'half ring, name below', yaml: 'type: custom:lcards-slider\nentity: light.demo\npreset: ring\ngrid_options:\n  rows: 4\nstyle:\n  ring:\n    start_angle: -90\n    end_angle: 90\n    thickness: 20%\ntext:\n  name:\n    zone: sublabel\n    position: top\n' },
    ],
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
