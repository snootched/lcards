// Starter examples for the card playgrounds (CardDemo.vue). Each uses the sample
// entities of the docs demo environment (tests/helpers/card-env.js), and
// tests/docs/card-demo-starters.test.js validates every one against its card schema.

/** Extra demo entities beyond chart-demo-data.js's sensors (see card-env.js). */
export const DEMO_ENTITIES = ['switch.demo_switch', 'input_boolean.demo_toggle', 'input_number.demo_level', 'input_select.demo_mode'];

export const CARD_STARTERS = {
  'lcards-astrometrics-card': [
    { key: 'galaxy', label: 'Galaxy disc', yaml: `type: custom:lcards-astrometrics-card
height: 360
camera:
  view: galaxy
  views:
    galaxy: { target: core, yaw: 20, tilt: 35, distance: 260 }
    map: { target: core, tilt: 90, distance: 300 }
backdrop:
  stars: true
points:
  - { id: core, xyz: [0, 0, 0], label: GALACTIC CORE, style: title }
  - { id: vega, polar: [64, 160], marker: triangle, label: Vega }
  - { id: rigel, polar: [88, 95], marker: diamond, label: Rigel }
objects:
  - { type: grid, shape: disc, radius: 100, pattern: polar, line_spacing: 10, spoke_count: 36, ring_labels: { step: 30 } }
  - { type: ring, radius: 100, width: 2 }
  - { type: glow, at: core, size: 50 }
` },
    { key: 'sector', label: 'Sector map', yaml: `type: custom:lcards-astrometrics-card
height: 340
camera:
  views:
    map: { target: [0, 0, 0], tilt: 90, distance: 700, projection: orthographic }
  limits: { tilt: [90, 90] }
objects:
  - type: grid
    id: sectors
    shape: plane
    size: [640, 360]
    line_spacing: 40
    axis_labels: { column_start: AD }
    cells:
      - { from: AF3, to: AH6, color: var(--lcars-blue), opacity: 0.3, shade: 0.4, edges: true }
points:
  - { id: sb10, cell: AJ2, object: sectors, marker: triangle, label: Starbase 10 }
` },
    { key: 'sky', label: 'Sky dome', yaml: `type: custom:lcards-astrometrics-card
height: 340
camera:
  views:
    horizon: { target: [0, 15, 0], yaw: 180, tilt: 28, distance: 260 }
objects:
  - { type: grid, id: sky, shape: dome, radius: 100, line_spacing_deg: 15 }
  - { type: path, sky: sun, object: sky, dash: [6, 4], color: var(--lcars-yellow) }
points:
  - { id: sun, sky: sun, object: sky, marker: reticle, label: SOL }
  - { id: moon, sky: moon, object: sky, marker: moon_phase, label: LUNA }
  - { id: south, altaz: [180, 0], object: sky, label: S, style: major, overlap: true }
` },
  ],
  'lcards-button': [
    { key: 'lozenge', label: 'Lozenge toggle', yaml: `type: custom:lcards-button
entity: light.demo
preset: lozenge
text:
  label:
    content: MAIN LIGHTS
    show: true
tap_action:
  action: toggle
` },
    { key: 'state-colours', label: 'State colours', yaml: `type: custom:lcards-button
entity: switch.demo_switch
preset: capped
text:
  label:
    content: "{entity.state}"
    show: true
style:
  card:
    color:
      background:
        active: var(--lcars-orange)
        inactive: var(--lcars-gray)
tap_action:
  action: toggle
` },
    { key: 'bar-label', label: 'Bar label header', yaml: `type: custom:lcards-button
preset: bar-label-left
interactive: false
text:
  label:
    content: ENGINEERING
` },
    { key: 'sensor', label: 'Sensor readout', yaml: `type: custom:lcards-button
entity: sensor.demo_temperature
preset: filled
text:
  label:
    content: TEMPERATURE
    show: true
  state:
    content: "{entity.state}"
    show: true
style:
  card:
    color:
      background:
        default: var(--lcars-blue)
        above:22: var(--lcars-orange)
tap_action:
  action: more-info
` },
  ],

  'lcards-slider': [
    { key: 'pills', label: 'Brightness pills', yaml: `type: custom:lcards-slider
entity: light.demo
preset: pills-left-border
control:
  attribute: brightness
` },
    { key: 'gauge', label: 'Temperature gauge', yaml: `type: custom:lcards-slider
entity: sensor.demo_temperature
preset: gauge-basic
style:
  track:
    display:
      min: -10
      max: 40
      unit: "°C"
` },
    { key: 'level', label: 'Number level', yaml: `type: custom:lcards-slider
entity: input_number.demo_level
preset: gauge-left-border-rounded
` },
  ],

  'lcards-elbow': [
    { key: 'header-left', label: 'Header (left)', yaml: `type: custom:lcards-elbow
elbow:
  type: header-left
  segment:
    bar_width: 90
    bar_height: 20
text:
  label:
    content: OPERATIONS
` },
    { key: 'footer-right', label: 'Footer (right)', yaml: `type: custom:lcards-elbow
elbow:
  type: footer-right
  segment:
    bar_width: 120
    bar_height: 24
    color: var(--lcars-blue)
` },
    { key: 'segmented', label: 'Segmented', yaml: `type: custom:lcards-elbow
elbow:
  type: header-left
  style: segmented
  segments:
    gap: 4
    outer_segment:
      bar_width: 90
      color: var(--lcars-orange)
    inner_segment:
      bar_width: 30
      color: var(--lcards-moonlight)
` },
  ],

  'lcards-select-menu': [
    { key: 'entity', label: 'Options from an input_select', yaml: `type: custom:lcards-select-menu
entity: input_select.demo_mode
preset: lozenge
grid:
  columns: 2
  gap: 6px
` },
    { key: 'labels', label: 'Custom labels', yaml: `type: custom:lcards-select-menu
entity: input_select.demo_mode
preset: capped
grid:
  columns: 4
  gap: 4px
options:
  Auto:
    label: AUTO
  Cool:
    label: COOL
  Heat:
    label: HEAT
  "Off":
    label: STANDBY
` },
  ],
};
