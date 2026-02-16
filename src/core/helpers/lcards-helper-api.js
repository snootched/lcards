/**
 * @fileoverview LCARdS Helper API - WebSocket wrapper for HA input helper management
 *
 * Provides functions to create, delete, and ensure Home Assistant input helpers
 * via the undocumented WebSocket API. All helpers are prefixed with 'lcards_'.
 *
 * Supported domains:
 * - input_number (sliders, number inputs)
 * - input_select (dropdown selections)
 * - input_boolean (toggles, switches)
 *
 * @module core/helpers/lcards-helper-api
 */

import { lcardsLog } from '../../utils/lcards-logging.js';

/**
 * Create a new input helper via WebSocket API
 *
 * @param {Object} hass - Home Assistant instance
 * @param {string} domain - Helper domain ('input_number', 'input_select', 'input_boolean')
 * @param {string} name - Display name for the helper
 * @param {Object} attributes - Domain-specific attributes (min, max, options, etc.)
 * @returns {Promise<Object>} Created helper object with entity_id
 * @throws {Error} If creation fails
 *
 * @example
 * // Create a number input
 * const helper = await createHelper(hass, 'input_number', 'LCARdS Alert Red Hue', {
 *   min: 0,
 *   max: 360,
 *   step: 1,
 *   mode: 'slider',
 *   unit_of_measurement: '°',
 *   icon: 'mdi:palette'
 * });
 */
export async function createHelper(hass, domain, name, attributes = {}) {
  if (!hass || !hass.callWS) {
    throw new Error('[HelperAPI] HASS instance or callWS not available');
  }

  if (!['input_number', 'input_select', 'input_boolean'].includes(domain)) {
    throw new Error(`[HelperAPI] Unsupported domain: ${domain}`);
  }

  lcardsLog.debug(`[HelperAPI] Creating ${domain} helper: ${name}`);

  try {
    // Call WebSocket API to create helper
    const result = await hass.callWS({
      type: `${domain}/create`,
      name: name,
      ...attributes
    });

    lcardsLog.info(`[HelperAPI] ✅ Created helper: ${result.id} (${name})`);
    return result;
  } catch (error) {
    lcardsLog.error(`[HelperAPI] ❌ Failed to create ${domain} helper "${name}":`, error);
    throw new Error(`Failed to create helper: ${error.message || 'Unknown error'}`);
  }
}

/**
 * Delete an existing input helper via WebSocket API
 *
 * @param {Object} hass - Home Assistant instance
 * @param {string} domain - Helper domain
 * @param {string} helperId - Helper ID (not entity_id, just the ID part)
 * @returns {Promise<void>}
 * @throws {Error} If deletion fails
 *
 * @example
 * await deleteHelper(hass, 'input_number', 'alert_red_hue');
 */
export async function deleteHelper(hass, domain, helperId) {
  if (!hass || !hass.callWS) {
    throw new Error('[HelperAPI] HASS instance or callWS not available');
  }

  lcardsLog.debug(`[HelperAPI] Deleting ${domain} helper: ${helperId}`);

  try {
    await hass.callWS({
      type: `${domain}/delete`,
      [`${domain}_id`]: helperId
    });

    lcardsLog.info(`[HelperAPI] ✅ Deleted helper: ${helperId}`);
  } catch (error) {
    lcardsLog.error(`[HelperAPI] ❌ Failed to delete ${domain} helper "${helperId}":`, error);
    throw new Error(`Failed to delete helper: ${error.message || 'Unknown error'}`);
  }
}

/**
 * Update helper entity_id via entity registry
 *
 * @param {Object} hass - Home Assistant instance
 * @param {string} currentEntityId - Current entity_id
 * @param {string} newEntityId - Desired entity_id
 * @returns {Promise<Object>} Updated entity registry entry
 * @throws {Error} If update fails
 *
 * @example
 * await updateHelperEntityId(hass, 'input_number.temp_123', 'input_number.lcards_alert_red_hue');
 */
export async function updateHelperEntityId(hass, currentEntityId, newEntityId) {
  if (!hass || !hass.callWS) {
    throw new Error('[HelperAPI] HASS instance or callWS not available');
  }

  lcardsLog.debug(`[HelperAPI] Renaming helper: ${currentEntityId} -> ${newEntityId}`);

  try {
    const result = await hass.callWS({
      type: 'config/entity_registry/update',
      entity_id: currentEntityId,
      new_entity_id: newEntityId
    });

    lcardsLog.info(`[HelperAPI] ✅ Renamed helper to: ${newEntityId}`);
    return result;
  } catch (error) {
    lcardsLog.error(`[HelperAPI] ❌ Failed to rename helper:`, error);
    throw new Error(`Failed to rename helper: ${error.message || 'Unknown error'}`);
  }
}

/**
 * Ensure a helper exists - idempotent creation
 * Checks if helper exists in hass.states, creates if missing
 *
 * @param {Object} hass - Home Assistant instance
 * @param {Object} definition - Helper definition from registry
 * @returns {Promise<{exists: boolean, created: boolean, entity_id: string}>}
 *
 * @example
 * const result = await ensureHelper(hass, {
 *   entity_id: 'input_select.lcards_alert_mode',
 *   domain: 'input_select',
 *   name: 'LCARdS Alert Mode',
 *   ws_create_params: { options: ['default', 'red', 'yellow', 'blue', 'white'] }
 * });
 */
export async function ensureHelper(hass, definition) {
  if (!hass || !hass.states) {
    throw new Error('[HelperAPI] HASS instance or states not available');
  }

  const { entity_id, domain, name, ws_create_params = {}, icon } = definition;

  // Check if helper already exists
  if (hass.states[entity_id]) {
    lcardsLog.debug(`[HelperAPI] Helper already exists: ${entity_id}`);
    return {
      exists: true,
      created: false,
      entity_id: entity_id
    };
  }

  // Helper doesn't exist, create it
  lcardsLog.info(`[HelperAPI] Helper missing, creating: ${entity_id}`);

  try {
    // Merge icon into params if provided
    const params = { ...ws_create_params };
    if (icon) {
      params.icon = icon;
    }

    const result = await createHelper(hass, domain, name, params);

    // If the created entity_id doesn't match our desired one, rename it
    const createdEntityId = result.id ? `${domain}.${result.id}` : null;
    
    if (createdEntityId && createdEntityId !== entity_id) {
      lcardsLog.debug(`[HelperAPI] Entity ID mismatch, renaming: ${createdEntityId} -> ${entity_id}`);
      await updateHelperEntityId(hass, createdEntityId, entity_id);
    }

    return {
      exists: false,
      created: true,
      entity_id: entity_id
    };
  } catch (error) {
    lcardsLog.error(`[HelperAPI] ❌ Failed to ensure helper ${entity_id}:`, error);
    throw error;
  }
}

/**
 * Check if a helper exists in Home Assistant
 *
 * @param {Object} hass - Home Assistant instance
 * @param {string} entityId - Entity ID to check
 * @returns {boolean} True if helper exists
 */
export function helperExists(hass, entityId) {
  if (!hass || !hass.states) {
    return false;
  }
  return !!hass.states[entityId];
}

/**
 * Get current value of a helper
 *
 * @param {Object} hass - Home Assistant instance
 * @param {string} entityId - Entity ID of helper
 * @param {*} defaultValue - Default value if helper doesn't exist
 * @returns {*} Current helper value or default
 */
export function getHelperValue(hass, entityId, defaultValue = null) {
  if (!hass || !hass.states || !hass.states[entityId]) {
    return defaultValue;
  }

  const state = hass.states[entityId];
  return state.state;
}

/**
 * Set helper value via service call (public API)
 *
 * @param {Object} hass - Home Assistant instance
 * @param {string} entityId - Entity ID of helper
 * @param {*} value - New value to set
 * @returns {Promise<void>}
 *
 * @example
 * // Set input_select value
 * await setHelperValue(hass, 'input_select.lcards_alert_mode', 'red_alert');
 *
 * // Set input_number value
 * await setHelperValue(hass, 'input_number.lcards_alert_red_hue', 15);
 */
export async function setHelperValue(hass, entityId, value) {
  if (!hass || !hass.callService) {
    throw new Error('[HelperAPI] HASS instance or callService not available');
  }

  // Extract domain from entity_id
  const [domain] = entityId.split('.');
  
  if (!['input_number', 'input_select', 'input_boolean'].includes(domain)) {
    throw new Error(`[HelperAPI] Unsupported domain: ${domain}`);
  }

  lcardsLog.debug(`[HelperAPI] Setting ${entityId} = ${value}`);

  try {
    await hass.callService(domain, 'set_value', {
      entity_id: entityId,
      value: value
    });

    lcardsLog.debug(`[HelperAPI] ✅ Set helper value: ${entityId} = ${value}`);
  } catch (error) {
    lcardsLog.error(`[HelperAPI] ❌ Failed to set helper value:`, error);
    throw new Error(`Failed to set helper value: ${error.message || 'Unknown error'}`);
  }
}
