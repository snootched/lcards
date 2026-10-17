// Starter examples for the card playgrounds (CardDemo.vue). Each uses the sample
// entities of the docs demo environment (tests/helpers/card-env.js), and
// tests/docs/card-demo-starters.test.js validates every one against its card schema.

/** Extra demo entities beyond chart-demo-data.js's sensors (see card-env.js). */
export const DEMO_ENTITIES = ['switch.demo_switch', 'input_boolean.demo_toggle', 'input_number.demo_level', 'input_select.demo_mode'];

export const CARD_STARTERS = {
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
