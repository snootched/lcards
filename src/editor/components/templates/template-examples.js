/**
 * Template Examples Library
 *
 * Pre-configured template examples for the Template Sandbox.
 * Each example demonstrates a specific template type with realistic use cases.
 *
 * @module template-examples
 */

/**
 * Collection of template examples organized by type
 * @type {Object.<string, {name: string, template: string, description: string, mockEntity: string, mockState?: Object, mockDataSources?: Object}>}
 */
export const EXAMPLE_TEMPLATES = {
  'simple-entity': {
    name: 'Simple Entity State',
    template: '{entity.state}',
    description: 'Display the current state of the entity',
    mockEntity: 'light.kitchen',
    mockState: { state: 'on', attributes: {} }
  },

  'entity-attribute': {
    name: 'Entity Attribute',
    template: 'Brightness: {entity.attributes.brightness}',
    description: 'Access entity attributes like brightness, temperature, etc.',
    mockEntity: 'light.living_room',
    mockState: {
      state: 'on',
      attributes: { brightness: 200, color_temp: 300 }
    }
  },

  'datasource-live': {
    name: 'Live DataSource',
    template: 'Temperature: {datasource:sensor_temp:.1f}°C',
    description: 'Access a live DataSource with formatting',
    mockEntity: 'sensor.temperature',
    mockDataSources: { 'sensor_temp': 23.5 }
  },

  'datasource-short': {
    name: 'DataSource (Short Syntax)',
    template: 'Value: {ds:sensor_value}',
    description: 'Use the short "ds:" prefix for datasources',
    mockEntity: 'sensor.example',
    mockDataSources: { 'sensor_value': 42 }
  },

  'javascript-conditional': {
    name: 'JavaScript Conditional',
    template: '[[[return entity.state === "on" ? "Active" : "Idle"]]]',
    description: 'Conditional logic using JavaScript',
    mockEntity: 'light.kitchen',
    mockState: { state: 'on', attributes: {} }
  },

  'javascript-calculation': {
    name: 'JavaScript Calculation',
    template: '[[[return Math.round(entity.attributes.temperature * 1.8 + 32) + "°F"]]]',
    description: 'Perform calculations with JavaScript',
    mockEntity: 'sensor.temperature',
    mockState: {
      state: '20',
      attributes: { temperature: 20, unit_of_measurement: '°C' }
    }
  },

  'jinja2-basic': {
    name: 'Jinja2 Template',
    template: '{{states("sensor.temperature") | float | round(1)}}°C',
    description: 'Server-side Jinja2 evaluation with filters',
    mockEntity: 'sensor.temperature'
  },

  'jinja2-conditional': {
    name: 'Jinja2 Conditional',
    template: '{% if is_state("light.kitchen", "on") %}Active{% else %}Idle{% endif %}',
    description: 'Conditional logic using Jinja2',
    mockEntity: 'light.kitchen'
  },

  'theme-token': {
    name: 'Theme Token',
    template: 'Color: {theme:colors.accent.primary}',
    description: 'Access theme tokens for styling',
    mockEntity: 'light.kitchen'
  },

  'theme-multiple': {
    name: 'Multiple Theme Tokens',
    template: 'Primary: {theme:colors.primary}, Accent: {theme:colors.accent.primary}',
    description: 'Use multiple theme tokens in one template',
    mockEntity: 'light.kitchen'
  },

  'mixed-js-datasource': {
    name: 'Mixed: JS + DataSource',
    template: '[[[return entity.state === "on"]]] ? {datasource:sensor_temp:.1f}°C : Off',
    description: 'Combine JavaScript and DataSource templates',
    mockEntity: 'light.kitchen',
    mockState: { state: 'on', attributes: {} },
    mockDataSources: { 'sensor_temp': 23.5 }
  },

  'mixed-entity-theme': {
    name: 'Mixed: Entity + Theme',
    template: 'Status: {entity.state} (Color: {theme:colors.primary})',
    description: 'Combine entity tokens and theme tokens',
    mockEntity: 'light.kitchen',
    mockState: { state: 'on', attributes: {} }
  },

  'complex-dashboard': {
    name: 'Complex Dashboard',
    template: '[[[return entity.state === "on" ? "🟢" : "🔴"]]] {entity.attributes.friendly_name}: {datasource:sensor_temp:.1f}°C',
    description: 'Complex template combining multiple types',
    mockEntity: 'climate.living_room',
    mockState: {
      state: 'heat',
      attributes: {
        friendly_name: 'Living Room',
        temperature: 22,
        target_temp_high: 24
      }
    },
    mockDataSources: { 'sensor_temp': 22.3 }
  }
};

/**
 * Get all example template IDs
 * @returns {string[]} Array of template IDs
 */
export function getExampleIds() {
  return Object.keys(EXAMPLE_TEMPLATES);
}

/**
 * Get example by ID
 * @param {string} id - Example template ID
 * @returns {Object|null} Example object or null if not found
 */
export function getExample(id) {
  return EXAMPLE_TEMPLATES[id] || null;
}

/**
 * Get examples by category
 * @param {string} category - Category: 'javascript', 'datasource', 'jinja2', 'theme', 'mixed', 'entity'
 * @returns {Object.<string, Object>} Filtered examples
 */
export function getExamplesByCategory(category) {
  const filtered = {};

  for (const [id, example] of Object.entries(EXAMPLE_TEMPLATES)) {
    const template = example.template.toLowerCase();

    switch (category) {
      case 'javascript':
        if (template.includes('[[[')) filtered[id] = example;
        break;
      case 'datasource':
        if (template.includes('{datasource:') || template.includes('{ds:')) {
          filtered[id] = example;
        }
        break;
      case 'jinja2':
        if (template.includes('{{') || template.includes('{%')) {
          filtered[id] = example;
        }
        break;
      case 'theme':
        if (template.includes('{theme:')) filtered[id] = example;
        break;
      case 'entity':
        if (template.includes('{entity.')) filtered[id] = example;
        break;
      case 'mixed':
        // Has multiple template types
        let count = 0;
        if (template.includes('[[[')) count++;
        if (template.includes('{datasource:') || template.includes('{ds:')) count++;
        if (template.includes('{{')) count++;
        if (template.includes('{theme:')) count++;
        if (template.includes('{entity.')) count++;
        if (count > 1) filtered[id] = example;
        break;
    }
  }

  return filtered;
}
