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
  'picard-gauge-column': 'grid_options:\n  rows: 7\n  columns: 3\n',
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

/** A small astrometrics scene for a gallery tile: a faint plane under the camera */
const astroTile = (label, body, camera = '{ target: [0, 0, 0], yaw: 20, tilt: 35, distance: 120 }') => ({
  label,
  yaml: `type: custom:lcards-astrometrics-card
height: 220
grid_options:
  rows: 4
camera:
  views:
    v: ${camera}
${body}`,
})
const ASTRO_FLOOR = '  - { type: grid, shape: plane, size: 120, line_spacing: 10, opacity: 0.5 }\n'
const astroMarkerTile = (marker) => astroTile(`marker: ${marker}`, `points:
  - { id: p, xyz: [0, 0, 0], marker: ${marker}, label: ${marker.toUpperCase()} }
objects:
${ASTRO_FLOOR}`, '{ target: [0, 0, 0], tilt: 90, distance: 120, projection: orthographic }')
const astroStyleTile = (style) => astroTile(`style: ${style}`, `points:
  - { id: p, xyz: [0, 0, 0], style: ${style}, label: ${style.toUpperCase()} }
objects:
${ASTRO_FLOOR}`, '{ target: [0, 0, 0], tilt: 90, distance: 120, projection: orthographic }')

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
  'astro-markers': {
    hint: 'Drag to turn a tile; a point with a marker can be tapped.',
    minWidth: 200,
    tiles: ['dot', 'triangle', 'diamond', 'square', 'reticle', 'moon_phase'].map(astroMarkerTile),
  },
  'astro-label-styles': {
    minWidth: 240,
    tiles: ['title', 'major', 'minor', 'tiny'].map(astroStyleTile),
  },
  'astro-objects': {
    hint: 'Drag to turn a tile, scroll or pinch to zoom.',
    minWidth: 260,
    tiles: [
      astroTile('type: sphere', `objects:
  - { type: sphere, at: [60, 0, 0], radius: 22, spin: 10, image: builtin:earth_blue_marble, line_width: 0 }
`, '{ target: [60, 0, 0], yaw: -60, tilt: 15, distance: 80 }'),
      astroTile('type: galaxy', `objects:
  - { type: galaxy, radius: 50, stars: { count: 20000 } }
`, '{ target: [0, 0, 0], yaw: 20, tilt: 45, distance: 120 }'),
      astroTile('type: belt', `objects:
  - { type: glow, size: 30, color: var(--lcars-yellow) }
  - { type: belt, radius: [35, 50], count: 1200, size: [0.3, 1.5], period: 40 }
`, '{ target: [0, 0, 0], yaw: 20, tilt: 25, distance: 120 }'),
      astroTile('type: comet', `points:
  - { id: sun, xyz: [-80, 0, 0] }
objects:
  - { type: comet, at: [0, 0, 0], light: sun, tail: { length: 50 }, coma: { size: 10 } }
`, '{ target: [15, 0, 0], yaw: 0, tilt: 60, distance: 70 }'),
      astroTile('type: model', `backdrop:
  stars: { count: 800 }
objects:
  - { type: model, src: builtin:constitution_class_refit, size: 40, spin: 6 }
`, '{ target: [0, 0, 0], yaw: 145, tilt: 20, distance: 70 }'),
      astroTile('type: cube', `objects:
  - { type: glow, size: 60, color: var(--lcards-green-medium), opacity: 0.5 }
  - { type: cube, size: 20, spin: 5 }
`, '{ target: [0, 0, 0], yaw: 35, tilt: 20, distance: 60 }'),
      astroTile('type: crystalline', `objects:
  - { type: crystalline, size: 40, spin: 4 }
`, '{ target: [0, 0, 0], yaw: 0, tilt: 10, distance: 90 }'),
      astroTile('type: grid (well)', `objects:
  - { type: grid, shape: well, radius: 45, depth: 50, line_spacing_deg: 15 }
`, '{ target: [0, -20, 0], yaw: 20, tilt: 25, distance: 150 }'),
    ],
  },
  'astro-effects': {
    hint: 'Drag to turn a tile: the clouds shift against the grid.',
    minWidth: 260,
    tiles: [
      astroTile('type: nebula', `objects:
${ASTRO_FLOOR}  - { type: nebula, size: [110, 30, 110], count: 5, seed: 5, drift: 2, colors: [var(--lcars-violet), var(--lcars-blue)] }
`),
      astroTile('scan (disc)', `objects:
  - { type: grid, shape: disc, radius: 50, pattern: polar, line_spacing: 10, spoke_count: 24, scan: { period: 3 } }
`),
      astroTile('scan (sphere)', `objects:
  - { type: sphere, radius: 22, scan: { period: 3 }, color: var(--lcars-blue) }
`, '{ target: [0, 0, 0], yaw: 0, tilt: 15, distance: 90 }'),
      astroTile('pulse', `points:
  - { id: a, polar: [45, 250], marker: dot }
  - { id: b, polar: [45, 70], marker: dot }
objects:
${ASTRO_FLOOR}  - { type: path, from: a, to: b, arc: 20, width: 2, color: var(--lcars-orange), pulse: true }
`),
      astroTile('fill.effect: plasma', `objects:
  - { type: sphere, radius: 22, opacity: 0.4, fill: { effect: { type: plasma, color_a: var(--lcars-orange), color_b: var(--lcars-yellow), speed: 2 } } }
`, '{ target: [0, 0, 0], yaw: 0, tilt: 15, distance: 90 }'),
      astroTile('fill.effect: contour', `objects:
  - { type: sphere, radius: 22, opacity: 0.3, spin: 6, fill: { effect: { type: contour, colors: [var(--lcars-orange), var(--lcars-yellow), var(--lcars-red)], num_bands: 8 } } }
`, '{ target: [0, 0, 0], yaw: 0, tilt: 15, distance: 90 }'),
    ],
  },
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
  'grid-surfaces': {
    hint: 'Drawn with WebGL in your browser; without it each draws the flat grid.',
    minWidth: 280,
    tiles: [
      webglTile('surface: cylinder', '- preset: grid\n  config:\n    surface: cylinder\n    color: var(--lcards-orange)\n    major_row_interval: 3\n    color_major: var(--lcards-moonlight)\n    line_width_major: 2'),
      webglTile('cylinder, surface_axis: horizontal', '- preset: grid\n  config:\n    surface: cylinder\n    surface_axis: horizontal\n    surface_length: 0.8\n    color: var(--lcards-orange)'),
      webglTile('surface: sphere', '- preset: grid\n  config:\n    surface: sphere\n    surface_size: 0.9\n    camera_tilt: 25\n    color: var(--lcards-blue-light)\n    major_row_interval: 3\n    major_col_interval: 3\n    color_major: var(--lcards-moonlight)'),
      webglTile('dome, surface_axis: horizontal', '- preset: grid\n  config:\n    surface: dome\n    surface_axis: horizontal\n    surface_size: 1.1\n    line_spacing: 25\n    scroll_speed_x: 10\n    scan_period: 5\n    color: var(--lcards-blue-light)'),
      webglTile('grid-hexagonal, surface: cylinder', '- preset: grid-hexagonal\n  config:\n    surface: cylinder\n    surface_size: 1\n    surface_length: 0.8'),
      webglTile('cylinder, surface_side: inside', '- preset: grid\n  config:\n    surface: cylinder\n    surface_axis: horizontal\n    surface_side: inside\n    surface_length: 0\n    scroll_speed_x: 60\n    major_col_interval: 4\n    color: var(--lcards-orange)\n    color_major: var(--lcards-moonlight)'),
    ],
  },
  'grid-polar': {
    hint: 'Flat polar charts draw on both tiers; the floor and the surface need WebGL.',
    minWidth: 280,
    tiles: [
      webglTile('pattern: polar', '- preset: grid\n  config:\n    pattern: polar\n    color: var(--lcards-orange)\n    major_row_interval: 3\n    major_col_interval: 3\n    color_major: var(--lcards-moonlight)\n    line_width_major: 2'),
      webglTile('polar, view: floor', '- preset: grid\n  config:\n    pattern: polar\n    view: floor\n    camera_tilt: 30\n    spoke_count: 24\n    major_row_interval: 4\n    major_col_interval: 6\n    color: var(--lcards-blue-light)\n    color_major: var(--lcards-moonlight)'),
      webglTile('off centre, rings pulsing out', '- preset: grid\n  config:\n    pattern: polar\n    polar_x: 0.2\n    polar_y: 0.8\n    spoke_count: 16\n    scroll_speed_y: 20\n    major_row_interval: 3\n    color: var(--lcards-orange)\n    color_major: var(--lcards-moonlight)'),
      webglTile('polar on a dome facing you', '- preset: grid\n  config:\n    pattern: polar\n    surface: dome\n    surface_axis: horizontal\n    surface_size: 1.1\n    major_row_interval: 3\n    color: var(--lcards-blue-light)\n    color_major: var(--lcards-moonlight)'),
    ],
  },
  'grid-wells': {
    hint: 'Drawn with WebGL in your browser; without it each draws the flat grid.',
    minWidth: 280,
    tiles: [
      webglTile('surface: well (trumpet)', '- preset: grid\n  config:\n    surface: well\n    major_row_interval: 4\n    color: var(--lcards-blue-light)\n    color_major: var(--lcards-moonlight)'),
      webglTile('gravity well: profile, polar, ripple', '- preset: grid\n  config:\n    surface: well\n    well_profile: [1.1, 0.5, 0.2, 0.12, 0.1]\n    well_ripple: 0.12\n    pattern: polar\n    spoke_count: 24\n    line_spacing: 20\n    camera_tilt: 40\n    color: var(--lcards-orange)'),
      webglTile('well_profile: [1, 0.25, 1]', '- preset: grid\n  config:\n    surface: well\n    well_profile: [1, 0.25, 1]\n    camera_tilt: 15\n    color: var(--lcards-orange)\n    color_major: var(--lcards-moonlight)\n    major_row_interval: 3'),
      webglTile('well_shape: bowl', '- preset: grid\n  config:\n    surface: well\n    well_shape: bowl\n    well_throat: 0.05\n    color: var(--lcards-blue-light)'),
      webglTile('tube with a ripple', '- preset: grid\n  config:\n    surface: well\n    well_profile: [1, 1]\n    well_ripple: 0.2\n    well_ripple_waves: 2\n    camera_tilt: 20\n    color: var(--lcards-orange)'),
      webglTile('surface_rotate_z: 30', '- preset: grid\n  config:\n    surface: well\n    surface_rotate_z: 30\n    camera_roll: 10\n    color: var(--lcards-blue-light)\n    color_major: var(--lcards-moonlight)\n    major_row_interval: 4'),
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
`),
      selectTile('grid.columns: 1 (preset: bullet)', `preset: bullet
grid:
  columns: 1
  gap: 4px
`),
      selectTile('preset: outline', `preset: outline
grid:
  columns: 2
  gap: 6px
`),
    ],
  },
}
