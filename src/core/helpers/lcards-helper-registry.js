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
      options: ['default', 'red_alert', 'yellow_alert', 'blue_alert', 'white_alert']
    },
    default_value: 'default',
    yaml_config: `input_select:
  lcards_alert_mode:
    name: LCARdS Alert Mode
    options:
      - default
      - red_alert
      - yellow_alert
      - blue_alert
      - white_alert
    initial: default
    icon: mdi:alarm-light`
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
  
  alert_lab_red_saturation: {
    entity_id: 'input_number.lcards_alert_lab_red_saturation',
    domain: 'input_number',
    name: 'Alert Lab Red Saturation',
    description: 'Saturation multiplier for red alert mode (0-200%)',
    icon: 'mdi:palette',
    category: 'alert_system',
    ws_create_params: {
      min: 0,
      max: 200,
      step: 1,
      mode: 'slider',
      unit_of_measurement: '%'
    },
    default_value: 140,
    yaml_config: `input_number:
  lcards_alert_lab_red_saturation:
    name: Alert Lab Red Saturation
    min: 0
    max: 200
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
  
  alert_lab_yellow_saturation: {
    entity_id: 'input_number.lcards_alert_lab_yellow_saturation',
    domain: 'input_number',
    name: 'Alert Lab Yellow Saturation',
    description: 'Saturation multiplier for yellow alert mode (0-200%)',
    icon: 'mdi:palette',
    category: 'alert_system',
    ws_create_params: {
      min: 0,
      max: 200,
      step: 1,
      mode: 'slider',
      unit_of_measurement: '%'
    },
    default_value: 150,
    yaml_config: `input_number:
  lcards_alert_lab_yellow_saturation:
    name: Alert Lab Yellow Saturation
    min: 0
    max: 200
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
  
  alert_lab_blue_saturation: {
    entity_id: 'input_number.lcards_alert_lab_blue_saturation',
    domain: 'input_number',
    name: 'Alert Lab Blue Saturation',
    description: 'Saturation multiplier for blue alert mode (0-200%)',
    icon: 'mdi:palette',
    category: 'alert_system',
    ws_create_params: {
      min: 0,
      max: 200,
      step: 1,
      mode: 'slider',
      unit_of_measurement: '%'
    },
    default_value: 150,
    yaml_config: `input_number:
  lcards_alert_lab_blue_saturation:
    name: Alert Lab Blue Saturation
    min: 0
    max: 200
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
  
  // ===== WHITE ALERT HSL =====
  
  alert_lab_white_hue: {
    entity_id: 'input_number.lcards_alert_lab_white_hue',
    domain: 'input_number',
    name: 'Alert Lab White Hue',
    description: 'Hue offset for white alert mode (0-360°)',
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
  lcards_alert_lab_white_hue:
    name: Alert Lab White Hue
    min: 0
    max: 360
    step: 1
    mode: slider
    unit_of_measurement: "°"
    icon: mdi:palette`
  },
  
  alert_lab_white_saturation: {
    entity_id: 'input_number.lcards_alert_lab_white_saturation',
    domain: 'input_number',
    name: 'Alert Lab White Saturation',
    description: 'Saturation multiplier for white alert mode (0-200%)',
    icon: 'mdi:palette',
    category: 'alert_system',
    ws_create_params: {
      min: 0,
      max: 200,
      step: 1,
      mode: 'slider',
      unit_of_measurement: '%'
    },
    default_value: 10,
    yaml_config: `input_number:
  lcards_alert_lab_white_saturation:
    name: Alert Lab White Saturation
    min: 0
    max: 200
    step: 1
    mode: slider
    unit_of_measurement: "%"
    icon: mdi:palette`
  },
  
  alert_lab_white_lightness: {
    entity_id: 'input_number.lcards_alert_lab_white_lightness',
    domain: 'input_number',
    name: 'Alert Lab White Lightness',
    description: 'Lightness multiplier for white alert mode (0-200%)',
    icon: 'mdi:palette',
    category: 'alert_system',
    ws_create_params: {
      min: 0,
      max: 200,
      step: 1,
      mode: 'slider',
      unit_of_measurement: '%'
    },
    default_value: 120,
    yaml_config: `input_number:
  lcards_alert_lab_white_lightness:
    name: Alert Lab White Lightness
    min: 0
    max: 200
    step: 1
    mode: slider
    unit_of_measurement: "%"
    icon: mdi:palette`
  }
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
