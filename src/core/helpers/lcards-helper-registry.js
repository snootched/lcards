/**
 * @fileoverview LCARdS Helper Registry - Authoritative schema for all LCARdS helpers
 *
 * This registry defines all input helpers used by LCARdS for persistent configuration.
 * Each helper entry includes:
 * - entity_id: The desired entity ID in Home Assistant
 * - domain: Helper type (input_select, input_number, input_boolean)
 * - name: Display name
 * - description: Purpose and usage
 * - icon: MDI icon
 * - category: Grouping for UI organization
 * - ws_create_params: Parameters for WebSocket creation
 * - default_value: Default value if helper doesn't exist
 * - yaml_config: Valid YAML for manual creation
 *
 * @module core/helpers/lcards-helper-registry
 */

/**
 * Complete registry of LCARdS helpers
 * Key is a short identifier, value is the helper definition
 */
export const HELPER_REGISTRY = {
  // ===== ALERT SYSTEM =====

  alert_mode: {
    entity_id: 'input_select.lcards_alert_mode',
    domain: 'input_select',
    name: 'LCARdS Alert Mode',
    description: 'Active alert state for theme and card behavior',
    icon: 'mdi:alarm-light',
    category: 'alert_system',
    ws_create_params: {
      options: ['green_alert', 'red_alert', 'yellow_alert', 'blue_alert', 'gray_alert', 'black_alert']
    },
    default_value: 'green_alert',
    yaml_config: `input_select:
  lcards_alert_mode:
    name: LCARdS Alert Mode
    options:
      - green_alert
      - red_alert
      - yellow_alert
      - blue_alert
      - gray_alert
      - black_alert
    initial: green_alert
    icon: mdi:alarm-light`
  },

  alert_mode_auto_switch: {
    entity_id: 'input_boolean.lcards_alert_mode_auto_switch',
    domain: 'input_boolean',
    name: 'LCARdS Auto Alert Switch',
    description: 'Automatically activate alert mode when input_select changes',
    icon: 'mdi:auto-mode',
    category: 'alert_system',
    ws_create_params: {},
    default_value: false,
    yaml_config: `input_boolean:
  lcards_alert_mode_auto_switch:
    name: LCARdS Auto Alert Switch
    initial: false
    icon: mdi:auto-mode`
  },

  alert_message: {
    entity_id: 'input_text.lcards_alert_message',
    domain: 'input_text',
    name: 'LCARdS Alert Message',
    description: 'Optional custom message to display in the alert overlay content card',
    icon: 'mdi:message-alert',
    category: 'alert_system',
    ws_create_params: {
      max: 255,
    },
    default_value: '',
    yaml_config: `input_text:
  lcards_alert_message:
    name: LCARdS Alert Message
    max: 255
    icon: mdi:message-alert`
  },

  // ===== RED ALERT HSL =====

  alert_lab_red_hue: {
    entity_id: 'input_number.lcards_alert_lab_red_hue',
    domain: 'input_number',
    name: 'Alert Lab Red Hue',
    description: 'Hue offset for red alert mode (0-360°)',
    icon: 'mdi:palette',
    category: 'alert_system',
    ws_create_params: {
      min: 0,
      max: 360,
      step: 1,
      mode: 'slider',
      unit_of_measurement: '°'
    },
    default_value: 0,
    yaml_config: `input_number:
  lcards_alert_lab_red_hue:
    name: Alert Lab Red Hue
    min: 0
    max: 360
    step: 1
    mode: slider
    unit_of_measurement: "°"
    icon: mdi:palette`
  },

  alert_lab_red_hue_strength: {
    entity_id: 'input_number.lcards_alert_lab_red_hue_strength',
    domain: 'input_number',
    name: 'Alert Lab Red Hue Strength',
    description: 'Hue rotation strength for red alert mode (0-1)',
    icon: 'mdi:palette',
    category: 'alert_system',
    ws_create_params: {
      min: 0,
      max: 1,
      step: 0.05,
      mode: 'slider'
    },
    default_value: 0.8,
    yaml_config: `input_number:
  lcards_alert_lab_red_hue_strength:
    name: Alert Lab Red Hue Strength
    min: 0
    max: 1
    step: 0.05
    mode: slider
    icon: mdi:palette`
  },

  alert_lab_red_saturation: {
    entity_id: 'input_number.lcards_alert_lab_red_saturation',
    domain: 'input_number',
    name: 'Alert Lab Red Saturation',
    description: 'Saturation multiplier for red alert mode (0-300%)',
    icon: 'mdi:palette',
    category: 'alert_system',
    ws_create_params: {
      min: 0,
      max: 300,
      step: 1,
      mode: 'slider',
      unit_of_measurement: '%'
    },
    default_value: 140,
    yaml_config: `input_number:
  lcards_alert_lab_red_saturation:
    name: Alert Lab Red Saturation
    min: 0
    max: 300
    step: 1
    mode: slider
    unit_of_measurement: "%"
    icon: mdi:palette`
  },

  alert_lab_red_lightness: {
    entity_id: 'input_number.lcards_alert_lab_red_lightness',
    domain: 'input_number',
    name: 'Alert Lab Red Lightness',
    description: 'Lightness multiplier for red alert mode (0-200%)',
    icon: 'mdi:palette',
    category: 'alert_system',
    ws_create_params: {
      min: 0,
      max: 200,
      step: 1,
      mode: 'slider',
      unit_of_measurement: '%'
    },
    default_value: 90,
    yaml_config: `input_number:
  lcards_alert_lab_red_lightness:
    name: Alert Lab Red Lightness
    min: 0
    max: 200
    step: 1
    mode: slider
    unit_of_measurement: "%"
    icon: mdi:palette`
  },

  // ===== RED ALERT HUE ANCHOR =====

  alert_lab_red_center_hue: {
    entity_id: 'input_number.lcards_alert_lab_red_center_hue',
    domain: 'input_number',
    name: 'Alert Lab Red Center Hue',
    description: 'Center hue for red alert hue anchoring (0-360°)',
    icon: 'mdi:anchor',
    category: 'alert_system',
    ws_create_params: {
      min: 0,
      max: 360,
      step: 1,
      mode: 'slider',
      unit_of_measurement: '°'
    },
    default_value: 0,
    yaml_config: `input_number:
  lcards_alert_lab_red_center_hue:
    name: Alert Lab Red Center Hue
    min: 0
    max: 360
    step: 1
    mode: slider
    unit_of_measurement: "°"
    icon: mdi:anchor`
  },

  alert_lab_red_range: {
    entity_id: 'input_number.lcards_alert_lab_red_range',
    domain: 'input_number',
    name: 'Alert Lab Red Range',
    description: 'Hue range for red alert anchoring (±degrees)',
    icon: 'mdi:anchor',
    category: 'alert_system',
    ws_create_params: {
      min: 0,
      max: 180,
      step: 5,
      mode: 'slider',
      unit_of_measurement: '°'
    },
    default_value: 60,
    yaml_config: `input_number:
  lcards_alert_lab_red_range:
    name: Alert Lab Red Range
    min: 0
    max: 180
    step: 5
    mode: slider
    unit_of_measurement: "°"
    icon: mdi:anchor`
  },

  alert_lab_red_strength: {
    entity_id: 'input_number.lcards_alert_lab_red_strength',
    domain: 'input_number',
    name: 'Alert Lab Red Strength',
    description: 'Pull strength for red alert hue anchoring (0-1)',
    icon: 'mdi:anchor',
    category: 'alert_system',
    ws_create_params: {
      min: 0,
      max: 1,
      step: 0.05,
      mode: 'slider'
    },
    default_value: 0.9,
    yaml_config: `input_number:
  lcards_alert_lab_red_strength:
    name: Alert Lab Red Strength
    min: 0
    max: 1
    step: 0.05
    mode: slider
    icon: mdi:anchor`
  },

  // ===== YELLOW ALERT HSL =====

  alert_lab_yellow_hue: {
    entity_id: 'input_number.lcards_alert_lab_yellow_hue',
    domain: 'input_number',
    name: 'Alert Lab Yellow Hue',
    description: 'Hue offset for yellow alert mode (0-360°)',
    icon: 'mdi:palette',
    category: 'alert_system',
    ws_create_params: {
      min: 0,
      max: 360,
      step: 1,
      mode: 'slider',
      unit_of_measurement: '°'
    },
    default_value: 45,
    yaml_config: `input_number:
  lcards_alert_lab_yellow_hue:
    name: Alert Lab Yellow Hue
    min: 0
    max: 360
    step: 1
    mode: slider
    unit_of_measurement: "°"
    icon: mdi:palette`
  },

  alert_lab_yellow_hue_strength: {
    entity_id: 'input_number.lcards_alert_lab_yellow_hue_strength',
    domain: 'input_number',
    name: 'Alert Lab Yellow Hue Strength',
    description: 'Hue rotation strength for yellow alert mode (0-1)',
    icon: 'mdi:palette',
    category: 'alert_system',
    ws_create_params: {
      min: 0,
      max: 1,
      step: 0.05,
      mode: 'slider'
    },
    default_value: 0.9,
    yaml_config: `input_number:
  lcards_alert_lab_yellow_hue_strength:
    name: Alert Lab Yellow Hue Strength
    min: 0
    max: 1
    step: 0.05
    mode: slider
    icon: mdi:palette`
  },

  alert_lab_yellow_saturation: {
    entity_id: 'input_number.lcards_alert_lab_yellow_saturation',
    domain: 'input_number',
    name: 'Alert Lab Yellow Saturation',
    description: 'Saturation multiplier for yellow alert mode (0-300%)',
    icon: 'mdi:palette',
    category: 'alert_system',
    ws_create_params: {
      min: 0,
      max: 300,
      step: 1,
      mode: 'slider',
      unit_of_measurement: '%'
    },
    default_value: 150,
    yaml_config: `input_number:
  lcards_alert_lab_yellow_saturation:
    name: Alert Lab Yellow Saturation
    min: 0
    max: 300
    step: 1
    mode: slider
    unit_of_measurement: "%"
    icon: mdi:palette`
  },

  alert_lab_yellow_lightness: {
    entity_id: 'input_number.lcards_alert_lab_yellow_lightness',
    domain: 'input_number',
    name: 'Alert Lab Yellow Lightness',
    description: 'Lightness multiplier for yellow alert mode (0-200%)',
    icon: 'mdi:palette',
    category: 'alert_system',
    ws_create_params: {
      min: 0,
      max: 200,
      step: 1,
      mode: 'slider',
      unit_of_measurement: '%'
    },
    default_value: 105,
    yaml_config: `input_number:
  lcards_alert_lab_yellow_lightness:
    name: Alert Lab Yellow Lightness
    min: 0
    max: 200
    step: 1
    mode: slider
    unit_of_measurement: "%"
    icon: mdi:palette`
  },

  // ===== YELLOW ALERT HUE ANCHOR =====

  alert_lab_yellow_center_hue: {
    entity_id: 'input_number.lcards_alert_lab_yellow_center_hue',
    domain: 'input_number',
    name: 'Alert Lab Yellow Center Hue',
    description: 'Center hue for yellow alert hue anchoring (0-360°)',
    icon: 'mdi:anchor',
    category: 'alert_system',
    ws_create_params: {
      min: 0,
      max: 360,
      step: 1,
      mode: 'slider',
      unit_of_measurement: '°'
    },
    default_value: 45,
    yaml_config: `input_number:
  lcards_alert_lab_yellow_center_hue:
    name: Alert Lab Yellow Center Hue
    min: 0
    max: 360
    step: 1
    mode: slider
    unit_of_measurement: "°"
    icon: mdi:anchor`
  },

  alert_lab_yellow_range: {
    entity_id: 'input_number.lcards_alert_lab_yellow_range',
    domain: 'input_number',
    name: 'Alert Lab Yellow Range',
    description: 'Hue range for yellow alert anchoring (±degrees)',
    icon: 'mdi:anchor',
    category: 'alert_system',
    ws_create_params: {
      min: 0,
      max: 180,
      step: 5,
      mode: 'slider',
      unit_of_measurement: '°'
    },
    default_value: 50,
    yaml_config: `input_number:
  lcards_alert_lab_yellow_range:
    name: Alert Lab Yellow Range
    min: 0
    max: 180
    step: 5
    mode: slider
    unit_of_measurement: "°"
    icon: mdi:anchor`
  },

  alert_lab_yellow_strength: {
    entity_id: 'input_number.lcards_alert_lab_yellow_strength',
    domain: 'input_number',
    name: 'Alert Lab Yellow Strength',
    description: 'Pull strength for yellow alert hue anchoring (0-1)',
    icon: 'mdi:anchor',
    category: 'alert_system',
    ws_create_params: {
      min: 0,
      max: 1,
      step: 0.05,
      mode: 'slider'
    },
    default_value: 0.9,
    yaml_config: `input_number:
  lcards_alert_lab_yellow_strength:
    name: Alert Lab Yellow Strength
    min: 0
    max: 1
    step: 0.05
    mode: slider
    icon: mdi:anchor`
  },

  // ===== BLUE ALERT HSL =====

  alert_lab_blue_hue: {
    entity_id: 'input_number.lcards_alert_lab_blue_hue',
    domain: 'input_number',
    name: 'Alert Lab Blue Hue',
    description: 'Hue offset for blue alert mode (0-360°)',
    icon: 'mdi:palette',
    category: 'alert_system',
    ws_create_params: {
      min: 0,
      max: 360,
      step: 1,
      mode: 'slider',
      unit_of_measurement: '°'
    },
    default_value: 210,
    yaml_config: `input_number:
  lcards_alert_lab_blue_hue:
    name: Alert Lab Blue Hue
    min: 0
    max: 360
    step: 1
    mode: slider
    unit_of_measurement: "°"
    icon: mdi:palette`
  },

  alert_lab_blue_hue_strength: {
    entity_id: 'input_number.lcards_alert_lab_blue_hue_strength',
    domain: 'input_number',
    name: 'Alert Lab Blue Hue Strength',
    description: 'Hue rotation strength for blue alert mode (0-1)',
    icon: 'mdi:palette',
    category: 'alert_system',
    ws_create_params: {
      min: 0,
      max: 1,
      step: 0.05,
      mode: 'slider'
    },
    default_value: 0.85,
    yaml_config: `input_number:
  lcards_alert_lab_blue_hue_strength:
    name: Alert Lab Blue Hue Strength
    min: 0
    max: 1
    step: 0.05
    mode: slider
    icon: mdi:palette`
  },

  alert_lab_blue_saturation: {
    entity_id: 'input_number.lcards_alert_lab_blue_saturation',
    domain: 'input_number',
    name: 'Alert Lab Blue Saturation',
    description: 'Saturation multiplier for blue alert mode (0-300%)',
    icon: 'mdi:palette',
    category: 'alert_system',
    ws_create_params: {
      min: 0,
      max: 300,
      step: 1,
      mode: 'slider',
      unit_of_measurement: '%'
    },
    default_value: 150,
    yaml_config: `input_number:
  lcards_alert_lab_blue_saturation:
    name: Alert Lab Blue Saturation
    min: 0
    max: 300
    step: 1
    mode: slider
    unit_of_measurement: "%"
    icon: mdi:palette`
  },

  alert_lab_blue_lightness: {
    entity_id: 'input_number.lcards_alert_lab_blue_lightness',
    domain: 'input_number',
    name: 'Alert Lab Blue Lightness',
    description: 'Lightness multiplier for blue alert mode (0-200%)',
    icon: 'mdi:palette',
    category: 'alert_system',
    ws_create_params: {
      min: 0,
      max: 200,
      step: 1,
      mode: 'slider',
      unit_of_measurement: '%'
    },
    default_value: 100,
    yaml_config: `input_number:
  lcards_alert_lab_blue_lightness:
    name: Alert Lab Blue Lightness
    min: 0
    max: 200
    step: 1
    mode: slider
    unit_of_measurement: "%"
    icon: mdi:palette`
  },

  // ===== BLUE ALERT HUE ANCHOR =====

  alert_lab_blue_center_hue: {
    entity_id: 'input_number.lcards_alert_lab_blue_center_hue',
    domain: 'input_number',
    name: 'Alert Lab Blue Center Hue',
    description: 'Center hue for blue alert hue anchoring (0-360°)',
    icon: 'mdi:anchor',
    category: 'alert_system',
    ws_create_params: {
      min: 0,
      max: 360,
      step: 1,
      mode: 'slider',
      unit_of_measurement: '°'
    },
    default_value: 210,
    yaml_config: `input_number:
  lcards_alert_lab_blue_center_hue:
    name: Alert Lab Blue Center Hue
    min: 0
    max: 360
    step: 1
    mode: slider
    unit_of_measurement: "°"
    icon: mdi:anchor`
  },

  alert_lab_blue_range: {
    entity_id: 'input_number.lcards_alert_lab_blue_range',
    domain: 'input_number',
    name: 'Alert Lab Blue Range',
    description: 'Hue range for blue alert anchoring (±degrees)',
    icon: 'mdi:anchor',
    category: 'alert_system',
    ws_create_params: {
      min: 0,
      max: 180,
      step: 5,
      mode: 'slider',
      unit_of_measurement: '°'
    },
    default_value: 70,
    yaml_config: `input_number:
  lcards_alert_lab_blue_range:
    name: Alert Lab Blue Range
    min: 0
    max: 180
    step: 5
    mode: slider
    unit_of_measurement: "°"
    icon: mdi:anchor`
  },

  alert_lab_blue_strength: {
    entity_id: 'input_number.lcards_alert_lab_blue_strength',
    domain: 'input_number',
    name: 'Alert Lab Blue Strength',
    description: 'Pull strength for blue alert hue anchoring (0-1)',
    icon: 'mdi:anchor',
    category: 'alert_system',
    ws_create_params: {
      min: 0,
      max: 1,
      step: 0.05,
      mode: 'slider'
    },
    default_value: 0.85,
    yaml_config: `input_number:
  lcards_alert_lab_blue_strength:
    name: Alert Lab Blue Strength
    min: 0
    max: 1
    step: 0.05
    mode: slider
    icon: mdi:anchor`
  },

  // ===== GRAY ALERT =====

  alert_lab_gray_hue: {
    entity_id: 'input_number.lcards_alert_lab_gray_hue',
    domain: 'input_number',
    name: 'Alert Lab Gray Hue',
    description: 'Hue offset for gray alert mode (0-360°)',
    icon: 'mdi:palette',
    category: 'alert_system',
    ws_create_params: {
      min: 0,
      max: 360,
      step: 1,
      mode: 'slider',
      unit_of_measurement: '°'
    },
    default_value: 0,
    yaml_config: `input_number:
  lcards_alert_lab_gray_hue:
    name: Alert Lab Gray Hue
    min: 0
    max: 360
    step: 1
    mode: slider
    unit_of_measurement: "°"
    icon: mdi:palette`
  },

  alert_lab_gray_hue_strength: {
    entity_id: 'input_number.lcards_alert_lab_gray_hue_strength',
    domain: 'input_number',
    name: 'Alert Lab Gray Hue Strength',
    description: 'Hue rotation strength for gray alert mode (0-1)',
    icon: 'mdi:palette',
    category: 'alert_system',
    ws_create_params: {
      min: 0,
      max: 1,
      step: 0.01,
      mode: 'slider'
    },
    default_value: 0,
    yaml_config: `input_number:
  lcards_alert_lab_gray_hue_strength:
    name: Alert Lab Gray Hue Strength
    min: 0
    max: 1
    step: 0.01
    mode: slider
    icon: mdi:palette`
  },

  alert_lab_gray_saturation: {
    entity_id: 'input_number.lcards_alert_lab_gray_saturation',
    domain: 'input_number',
    name: 'Alert Lab Gray Saturation',
    description: 'Saturation multiplier for gray alert mode (0-200%)',
    icon: 'mdi:palette',
    category: 'alert_system',
    ws_create_params: {
      min: 0,
      max: 200,
      step: 1,
      mode: 'slider',
      unit_of_measurement: '%'
    },
    default_value: 0,
    yaml_config: `input_number:
  lcards_alert_lab_gray_saturation:
    name: Alert Lab Gray Saturation
    min: 0
    max: 200
    step: 1
    mode: slider
    unit_of_measurement: "%"
    icon: mdi:palette`
  },

  alert_lab_gray_lightness: {
    entity_id: 'input_number.lcards_alert_lab_gray_lightness',
    domain: 'input_number',
    name: 'Alert Lab Gray Lightness',
    description: 'Lightness multiplier for gray alert mode (0-200%)',
    icon: 'mdi:palette',
    category: 'alert_system',
    ws_create_params: {
      min: 0,
      max: 200,
      step: 1,
      mode: 'slider',
      unit_of_measurement: '%'
    },
    default_value: 100,
    yaml_config: `input_number:
  lcards_alert_lab_gray_lightness:
    name: Alert Lab Gray Lightness
    min: 0
    max: 200
    step: 1
    mode: slider
    unit_of_measurement: "%"
    icon: mdi:palette`
  },

  // ===== BLACK ALERT =====

  alert_lab_black_hue: {
    entity_id: 'input_number.lcards_alert_lab_black_hue',
    domain: 'input_number',
    name: 'Alert Lab Black Hue',
    description: 'Hue offset for black alert mode (0-360°)',
    icon: 'mdi:palette',
    category: 'alert_system',
    ws_create_params: {
      min: 0,
      max: 360,
      step: 1,
      mode: 'slider',
      unit_of_measurement: '°'
    },
    default_value: 0,
    yaml_config: `input_number:
  lcards_alert_lab_black_hue:
    name: Alert Lab Black Hue
    min: 0
    max: 360
    step: 1
    mode: slider
    unit_of_measurement: "°"
    icon: mdi:palette`
  },

  alert_lab_black_hue_strength: {
    entity_id: 'input_number.lcards_alert_lab_black_hue_strength',
    domain: 'input_number',
    name: 'Alert Lab Black Hue Strength',
    description: 'Hue rotation strength for black alert mode (0-1)',
    icon: 'mdi:palette',
    category: 'alert_system',
    ws_create_params: {
      min: 0,
      max: 1,
      step: 0.01,
      mode: 'slider'
    },
    default_value: 0,
    yaml_config: `input_number:
  lcards_alert_lab_black_hue_strength:
    name: Alert Lab Black Hue Strength
    min: 0
    max: 1
    step: 0.01
    mode: slider
    icon: mdi:palette`
  },

  alert_lab_black_saturation: {
    entity_id: 'input_number.lcards_alert_lab_black_saturation',
    domain: 'input_number',
    name: 'Alert Lab Black Saturation',
    description: 'Saturation multiplier for black alert mode (0-200%)',
    icon: 'mdi:palette',
    category: 'alert_system',
    ws_create_params: {
      min: 0,
      max: 200,
      step: 1,
      mode: 'slider',
      unit_of_measurement: '%'
    },
    default_value: 0,
    yaml_config: `input_number:
  lcards_alert_lab_black_saturation:
    name: Alert Lab Black Saturation
    min: 0
    max: 200
    step: 1
    mode: slider
    unit_of_measurement: "%"
    icon: mdi:palette`
  },

  alert_lab_black_lightness: {
    entity_id: 'input_number.lcards_alert_lab_black_lightness',
    domain: 'input_number',
    name: 'Alert Lab Black Lightness',
    description: 'Lightness multiplier for black alert mode (0-200%)',
    icon: 'mdi:palette',
    category: 'alert_system',
    ws_create_params: {
      min: 0,
      max: 200,
      step: 1,
      mode: 'slider',
      unit_of_measurement: '%'
    },
    default_value: 30,
    yaml_config: `input_number:
  lcards_alert_lab_black_lightness:
    name: Alert Lab Black Lightness
    min: 0
    max: 200
    step: 1
    mode: slider
    unit_of_measurement: "%"
    icon: mdi:palette`
  },

  // ===== BLACK ALERT CONTRAST ENHANCEMENT =====

  alert_lab_black_threshold: {
    entity_id: 'input_number.lcards_alert_lab_black_threshold',
    domain: 'input_number',
    name: 'Alert Lab Black Threshold',
    description: 'Contrast threshold for black alert (0-100)',
    icon: 'mdi:contrast-box',
    category: 'alert_system',
    ws_create_params: {
      min: 0,
      max: 100,
      step: 1,
      mode: 'slider'
    },
    default_value: 50,
    yaml_config: `input_number:
  lcards_alert_lab_black_threshold:
    name: Alert Lab Black Threshold
    min: 0
    max: 100
    step: 1
    mode: slider
    icon: mdi:contrast-box`
  },

  alert_lab_black_dark_multiplier: {
    entity_id: 'input_number.lcards_alert_lab_black_dark_multiplier',
    domain: 'input_number',
    name: 'Alert Lab Black Dark Multiplier',
    description: 'Dark color multiplier for black alert contrast (0-2)',
    icon: 'mdi:contrast-box',
    category: 'alert_system',
    ws_create_params: {
      min: 0,
      max: 2,
      step: 0.01,
      mode: 'slider'
    },
    default_value: 0.6,
    yaml_config: `input_number:
  lcards_alert_lab_black_dark_multiplier:
    name: Alert Lab Black Dark Multiplier
    min: 0
    max: 2
    step: 0.01
    mode: slider
    icon: mdi:contrast-box`
  },

  alert_lab_black_light_multiplier: {
    entity_id: 'input_number.lcards_alert_lab_black_light_multiplier',
    domain: 'input_number',
    name: 'Alert Lab Black Light Multiplier',
    description: 'Light color multiplier for black alert contrast (0-2)',
    icon: 'mdi:contrast-box',
    category: 'alert_system',
    ws_create_params: {
      min: 0,
      max: 2,
      step: 0.01,
      mode: 'slider'
    },
    default_value: 1.4,
    yaml_config: `input_number:
  lcards_alert_lab_black_light_multiplier:
    name: Alert Lab Black Light Multiplier
    min: 0
    max: 2
    step: 0.01
    mode: slider
    icon: mdi:contrast-box`
  },

  // ===== HA-LCARS THEME SETTINGS =====
  // These helpers control the HA-LCARS theme (not part of LCARdS, but we help users create them)

  lcars_sound: {
    entity_id: 'input_boolean.lcars_sound',
    domain: 'input_boolean',
    name: 'LCARS Sound',
    description: 'Toggles button and tap sounds in HA-LCARS theme',
    icon: 'mdi:volume-high',
    category: 'ha_lcars_theme',
    ws_create_params: {},
    default_value: false,
    yaml_config: `input_boolean:
  lcars_sound:
    name: LCARS Sound
    icon: mdi:volume-high`
  },

  lcars_texture: {
    entity_id: 'input_boolean.lcars_texture',
    domain: 'input_boolean',
    name: 'LCARS Texture',
    description: 'Toggles grain pattern and backlight effect in HA-LCARS theme',
    icon: 'mdi:texture',
    category: 'ha_lcars_theme',
    ws_create_params: {},
    default_value: false,
    yaml_config: `input_boolean:
  lcars_texture:
    name: LCARS Texture
    icon: mdi:texture`
  },

  lcars_vertical: {
    entity_id: 'input_number.lcars_vertical',
    domain: 'input_number',
    name: 'LCARS Vertical',
    description: 'Sets the width of vertical borders in HA-LCARS theme',
    icon: 'mdi:arrow-expand-vertical',
    category: 'ha_lcars_theme',
    ws_create_params: {
      min: 26,
      max: 60,
      step: 1,
      mode: 'slider'
    },
    default_value: 40,
    yaml_config: `input_number:
  lcars_vertical:
    name: LCARS Vertical
    min: 26
    max: 60
    step: 1
    mode: slider
    icon: mdi:arrow-expand-vertical`
  },

  lcars_horizontal: {
    entity_id: 'input_number.lcars_horizontal',
    domain: 'input_number',
    name: 'LCARS Horizontal',
    description: 'Sets the width of horizontal borders in HA-LCARS theme',
    icon: 'mdi:arrow-expand-horizontal',
    category: 'ha_lcars_theme',
    ws_create_params: {
      min: 6,
      max: 60,
      step: 1,
      mode: 'slider'
    },
    default_value: 30,
    yaml_config: `input_number:
  lcars_horizontal:
    name: LCARS Horizontal
    min: 6
    max: 60
    step: 1
    mode: slider
    icon: mdi:arrow-expand-horizontal`
  },

  lcars_menu_font: {
    entity_id: 'input_number.lcars_menu_font',
    domain: 'input_number',
    name: 'LCARS Menu Font',
    description: 'Sets the font size (in px) of the sidebar menu in HA-LCARS theme',
    icon: 'mdi:format-font-size-increase',
    category: 'ha_lcars_theme',
    ws_create_params: {
      min: 8,
      max: 24,
      step: 1,
      mode: 'slider',
      unit_of_measurement: 'px'
    },
    default_value: 14,
    yaml_config: `input_number:
  lcars_menu_font:
    name: LCARS Menu Font
    min: 8
    max: 24
    step: 1
    mode: slider
    unit_of_measurement: "px"
    icon: mdi:format-font-size-increase`
  },

  lcars_header: {
    entity_id: 'sensor.lcars_header',
    domain: 'sensor',
    name: 'LCARS Header',
    description: 'Add text to the clock area of the header in HA-LCARS theme. Example: {{ "LCARS " + states("sensor.time") }}',
    icon: 'mdi:text-box',
    category: 'ha_lcars_theme',
    ws_create_params: null, // Sensors can't be created via WebSocket, must be template sensor
    default_value: '',
    yaml_config: `template:
  - sensor:
      - name: LCARS Header
        state: >-
          {{ "LCARS " + states("sensor.time") }}
        icon: mdi:text-box`
  },

  // ===== SOUND SYSTEM =====

  sound_enabled: {
    entity_id: 'input_boolean.lcards_sound_enabled',
    domain: 'input_boolean',
    name: 'LCARdS Sound Effects Enabled',
    description: 'Master enable/disable for all LCARdS UI sound effects (opt-in: off by default)',
    icon: 'mdi:volume-high',
    category: 'sound',
    ws_create_params: {},
    default_value: false,
    yaml_config: `input_boolean:\n  lcards_sound_enabled:\n    name: LCARdS Sound Effects Enabled\n    icon: mdi:volume-high`
  },

  sound_cards_enabled: {
    entity_id: 'input_boolean.lcards_sound_cards',
    domain: 'input_boolean',
    name: 'LCARdS Card Interaction Sounds',
    description: 'Enable sounds for card taps, holds, sliders, and toggle interactions',
    icon: 'mdi:gesture-tap',
    category: 'sound',
    ws_create_params: {},
    default_value: true,
    yaml_config: `input_boolean:\n  lcards_sound_cards:\n    name: LCARdS Card Interaction Sounds\n    icon: mdi:gesture-tap`
  },

  sound_ui_enabled: {
    entity_id: 'input_boolean.lcards_sound_ui',
    domain: 'input_boolean',
    name: 'LCARdS UI Navigation Sounds',
    description: 'Enable sounds for HA sidebar navigation and page transitions',
    icon: 'mdi:navigation',
    category: 'sound',
    ws_create_params: {},
    default_value: true,
    yaml_config: `input_boolean:\n  lcards_sound_ui:\n    name: LCARdS UI Navigation Sounds\n    icon: mdi:navigation`
  },

  sound_alerts_enabled: {
    entity_id: 'input_boolean.lcards_sound_alerts',
    domain: 'input_boolean',
    name: 'LCARdS Alert & System Sounds',
    description: 'Enable sounds for alert mode changes and system events',
    icon: 'mdi:alert-circle',
    category: 'sound',
    ws_create_params: {},
    default_value: true,
    yaml_config: `input_boolean:\n  lcards_sound_alerts:\n    name: LCARdS Alert & System Sounds\n    icon: mdi:alert-circle`
  },

  sound_volume: {
    entity_id: 'input_number.lcards_sound_volume',
    domain: 'input_number',
    name: 'LCARdS Sound Volume',
    description: 'Master volume for all LCARdS sound effects (0 = silent, 1 = full)',
    icon: 'mdi:volume-medium',
    category: 'sound',
    ws_create_params: { min: 0, max: 1, step: 0.05, mode: 'slider' },
    default_value: 0.5,
    yaml_config: `input_number:\n  lcards_sound_volume:\n    name: LCARdS Sound Volume\n    min: 0\n    max: 1\n    step: 0.05\n    mode: slider\n    icon: mdi:volume-medium`
  },

  sound_scheme: {
    entity_id: 'input_select.lcards_sound_scheme',
    domain: 'input_select',
    name: 'LCARdS Sound Scheme',
    description: 'Active sound scheme. Options expand as audio packs are loaded.',
    icon: 'mdi:music-box-multiple',
    category: 'sound',
    ws_create_params: { options: ['none'] },
    default_value: 'none',
    yaml_config: `input_select:\n  lcards_sound_scheme:\n    name: LCARdS Sound Scheme\n    options:\n      - none\n    icon: mdi:music-box-multiple`
  },

};

/**
 * Get helpers filtered by category
 *
 * @param {string} category - Category to filter by (e.g., 'alert_system')
 * @returns {Array<Object>} Array of helper definitions with their keys
 *
 * @example
 * const alertHelpers = getHelpersByCategory('alert_system');
 */
export function getHelpersByCategory(category) {
  return Object.entries(HELPER_REGISTRY)
    .filter(([_, def]) => def.category === category)
    .map(([key, def]) => ({ key, ...def }));
}

/**
 * Get all unique categories in the registry
 *
 * @returns {Array<string>} Array of category names
 */
export function getCategories() {
  const categories = new Set();
  Object.values(HELPER_REGISTRY).forEach(def => {
    if (def.category) {
      categories.add(def.category);
    }
  });
  return Array.from(categories);
}

/**
 * Get helper definition by registry key
 *
 * @param {string} key - Registry key (e.g., 'alert_mode')
 * @returns {Object|null} Helper definition or null if not found
 */
export function getHelperDefinition(key) {
  return HELPER_REGISTRY[key] || null;
}

/**
 * Get all helper definitions as an array
 *
 * @returns {Array<Object>} Array of helper definitions with their keys
 */
export function getAllHelpers() {
  return Object.entries(HELPER_REGISTRY).map(([key, def]) => ({
    key,
    ...def
  }));
}

/**
 * Generate YAML configuration for helpers
 *
 * @param {string} [category=null] - Optional category filter
 * @returns {string} YAML configuration string
 *
 * @example
 * const yaml = generateHelpersYAML();
 * // or
 * const alertYaml = generateHelpersYAML('alert_system');
 */
export function generateHelpersYAML(category = null) {
  let helpers = getAllHelpers();

  if (category) {
    helpers = helpers.filter(h => h.category === category);
  }

  // Group by domain
  const byDomain = {};
  helpers.forEach(helper => {
    if (!byDomain[helper.domain]) {
      byDomain[helper.domain] = [];
    }
    byDomain[helper.domain].push(helper);
  });

  // Generate YAML sections
  const sections = [];

  for (const [domain, domainHelpers] of Object.entries(byDomain)) {
    const lines = [`${domain}:`];

    domainHelpers.forEach(helper => {
      if (helper.yaml_config) {
        // Extract just the helper part (without the domain line)
        const yamlLines = helper.yaml_config.split('\n').slice(1);
        lines.push(...yamlLines);
      }
    });

    sections.push(lines.join('\n'));
  }

  return sections.join('\n\n');
}

/**
 * Find helper by entity_id
 *
 * @param {string} entityId - Entity ID to search for
 * @returns {Object|null} Helper definition with key, or null if not found
 */
export function findHelperByEntityId(entityId) {
  const entry = Object.entries(HELPER_REGISTRY).find(
    ([_, def]) => def.entity_id === entityId
  );

  if (entry) {
    const [key, def] = entry;
    return { key, ...def };
  }

  return null;
}
