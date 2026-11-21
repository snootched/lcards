/**
 * What a slider can set: for each domain, the attributes a Home Assistant
 * action can change, the action that changes them, and the slider range they
 * use by default. Pure, so it is tested without a card.
 *
 * The slider works in its own value space (a light's brightness is 0-100 %, a
 * media player's volume 0-100 %); `toEntity` converts a slider value to what
 * the action takes, `fromEntity` an attribute value to the slider's space.
 * An attribute missing here can be shown but not set: the slider is read-only.
 *
 * @module cards/slider-control
 */

/**
 * @typedef {Object} ControlSetter
 * @property {string} service - action in the entity's domain
 * @property {string} field - the action's data key for the value
 * @property {(v: number) => number} [toEntity] - slider value to the action's value
 * @property {(v: number) => number} [fromEntity] - attribute value to slider value
 * @property {string} [pair] - an attribute the action needs alongside (climate target_temp_low/high)
 * @property {string} [pairField] - the action's data key for `pair`
 * @property {(attrs: Record<string, any>) => { min: number, max: number, step: number, unit?: string }} [range]
 */

const round = (/** @type {number} */ v) => Math.round(v);
const percent = () => ({ min: 0, max: 100, step: 1, unit: '%' });
/** @param {Record<string, any>} a @param {number} max */
const temperatures = (a, max) => ({ min: a.min_temp ?? 15, max: a.max_temp ?? max, step: a.target_temp_step ?? 0.5 });

/** @type {Record<string, Record<string, ControlSetter>>} */
const SETTERS = {
  light: {
    brightness: { service: 'turn_on', field: 'brightness', toEntity: (v) => Math.round((v / 100) * 255), fromEntity: (v) => (v / 255) * 100, range: percent },
    color_temp_kelvin: { service: 'turn_on', field: 'color_temp_kelvin', toEntity: round, range: (a) => ({ min: a.min_color_temp_kelvin ?? 2000, max: a.max_color_temp_kelvin ?? 6500, step: 50, unit: 'K' }) }
  },
  cover: {
    current_position: { service: 'set_cover_position', field: 'position', toEntity: round, range: percent },
    current_tilt_position: { service: 'set_cover_tilt_position', field: 'tilt_position', toEntity: round, range: percent }
  },
  fan: {
    percentage: { service: 'set_percentage', field: 'percentage', toEntity: round, range: (a) => ({ min: 0, max: 100, step: a.percentage_step ?? 1, unit: '%' }) }
  },
  climate: {
    temperature: { service: 'set_temperature', field: 'temperature', range: (a) => temperatures(a, 30) },
    target_temp_low: { service: 'set_temperature', field: 'target_temp_low', pair: 'target_temp_high', pairField: 'target_temp_high', range: (a) => temperatures(a, 30) },
    target_temp_high: { service: 'set_temperature', field: 'target_temp_high', pair: 'target_temp_low', pairField: 'target_temp_low', range: (a) => temperatures(a, 30) },
    humidity: { service: 'set_humidity', field: 'humidity', toEntity: round, range: (a) => ({ min: a.min_humidity ?? 0, max: a.max_humidity ?? 100, step: 1, unit: '%' }) }
  },
  media_player: {
    volume_level: { service: 'volume_set', field: 'volume_level', toEntity: (v) => v / 100, fromEntity: (v) => v * 100, range: percent }
  },
  humidifier: {
    humidity: { service: 'set_humidity', field: 'humidity', toEntity: round, range: (a) => ({ min: a.min_humidity ?? 0, max: a.max_humidity ?? 100, step: 1, unit: '%' }) }
  },
  water_heater: {
    temperature: { service: 'set_temperature', field: 'temperature', range: (a) => temperatures(a, 60) }
  },
  valve: {
    current_valve_position: { service: 'set_valve_position', field: 'position', toEntity: round, range: percent }
  }
};

/** Domains whose numeric state the slider sets (no attribute) */
const STATE_SETTERS = /** @type {Record<string, ControlSetter>} */ ({
  input_number: { service: 'set_value', field: 'value' },
  number: { service: 'set_value', field: 'value' }
});

/** The attribute a domain's slider reads and sets by default */
export const DEFAULT_CONTROL_ATTRIBUTE = /** @type {Record<string, string>} */ ({
  light: 'brightness',
  cover: 'current_position',
  fan: 'percentage',
  climate: 'temperature',
  media_player: 'volume_level',
  humidifier: 'humidity',
  water_heater: 'temperature',
  valve: 'current_valve_position'
});

/**
 * How the slider sets this domain and attribute, or null when it can't (read-only).
 * @param {string} domain
 * @param {string | null | undefined} attribute - null: the entity's state
 * @returns {ControlSetter | null}
 */
export function controlSetter(domain, attribute) {
  if (!attribute) return STATE_SETTERS[domain] ?? null;
  return SETTERS[domain]?.[attribute] ?? null;
}

/**
 * The attributes the slider can set for a domain (for the editor).
 * @param {string} domain
 * @returns {string[]}
 */
export function settableAttributes(domain) {
  return Object.keys(SETTERS[domain] ?? {});
}

/**
 * The action call that sets `value` (in slider space), or null when the
 * attribute can't be set.
 * @param {string} entityId
 * @param {string | null | undefined} attribute - null/'' for the state
 * @param {number} value
 * @param {Record<string, any>} [attributes] - the entity's attributes (for a paired value)
 * @returns {{ domain: string, service: string, data: Record<string, any> } | null}
 */
export function controlServiceCall(entityId, attribute, value, attributes = {}) {
  const domain = entityId.split('.')[0];
  const setter = controlSetter(domain, attribute);
  if (!setter) return null;
  /** @type {Record<string, any>} */
  const data = { entity_id: entityId, [setter.field]: setter.toEntity ? setter.toEntity(value) : value };
  if (setter.pair && setter.pairField) {
    const other = attributes[setter.pair];
    if (other === undefined || other === null) return null;
    data[setter.pairField] = other;
  }
  return { domain, service: setter.service, data };
}

/**
 * An attribute value in the slider's space (brightness 0-255 to 0-100 %).
 * @param {string} domain
 * @param {string | null | undefined} attribute
 * @param {number} value
 */
export function controlValueFromEntity(domain, attribute, value) {
  const setter = attribute ? SETTERS[domain]?.[attribute] : null;
  return setter?.fromEntity ? setter.fromEntity(value) : value;
}

/**
 * The default slider range for a domain and attribute, or null to use the
 * entity's own `min`/`max`/`step` (input_number, number, sensors).
 * @param {string} domain
 * @param {string | null | undefined} attribute
 * @param {Record<string, any>} [attrs]
 * @returns {{ min: number, max: number, step: number, unit?: string } | null}
 */
export function controlRange(domain, attribute, attrs = {}) {
  const setter = attribute ? SETTERS[domain]?.[attribute] : null;
  return setter?.range ? setter.range(attrs) : null;
}
