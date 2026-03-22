/**
 * @fileoverview HA Entity Display Utilities
 *
 * Single source of truth for all HA i18n/locale-aware formatting in LCARdS.
 * Delegates entirely to hass.format* (stable public API since HA 2024.4+,
 * guaranteed on our 2026.3.0 minimum). All exports include safe fallbacks.
 *
 * Usage:
 *   import { haFormatState, haFormatNumber } from '../utils/ha-entity-display.js';
 *
 * IMPORTANT: All cards, editors, charts, and datasource utilities must import
 * from here — never call hass.format* directly elsewhere.
 */

/**
 * Get the HA-translated display state for an entity.
 * Respects device_class: e.g. binary_sensor door → "Open"/"Closed" instead of "on"/"off".
 * @param {Object} hass - Home Assistant instance
 * @param {Object} stateObj - Entity state object
 * @returns {string} Translated display string
 */
export const haFormatState = (hass, stateObj) =>
    safeCall(() => hass.formatEntityState(stateObj), stateObj?.state ?? '');

/**
 * Get the HA-formatted friendly name for an entity.
 * @param {Object} hass - Home Assistant instance
 * @param {Object} stateObj - Entity state object
 * @returns {string} Entity display name
 */
export const haFormatEntityName = (hass, stateObj) =>
    safeCall(() => hass.formatEntityName(stateObj), stateObj?.attributes?.friendly_name ?? stateObj?.entity_id ?? '');

/**
 * Get the HA-formatted display value for an entity attribute.
 * e.g. battery_level 80 → "80 %", duration 3600 → "1 hour"
 * @param {Object} hass - Home Assistant instance
 * @param {Object} stateObj - Entity state object
 * @param {string} key - Attribute key
 * @returns {string} Formatted attribute value
 */
export const haFormatAttrValue = (hass, stateObj, key) =>
    safeCall(() => hass.formatEntityAttributeValue(stateObj, key), String(stateObj?.attributes?.[key] ?? ''));

/**
 * Get the HA-formatted display name for an attribute key.
 * e.g. "battery_level" → "Battery Level"
 * @param {Object} hass - Home Assistant instance
 * @param {Object} stateObj - Entity state object
 * @param {string} key - Attribute key
 * @returns {string} Formatted attribute name
 */
export const haFormatAttrName = (hass, stateObj, key) =>
    safeCall(() => hass.formatEntityAttributeName(stateObj, key), key);

/**
 * Get state as an array of parts (value + unit) for the entity state.
 * Returns [{value: '23.5'}, {value: '°C'}] for a temperature sensor.
 * @param {Object} hass - Home Assistant instance
 * @param {Object} stateObj - Entity state object
 * @returns {Array<{value: string}>} Parts array
 */
export const haFormatStateParts = (hass, stateObj) =>
    safeCall(() => hass.formatEntityStateToParts(stateObj), [{ value: stateObj?.state ?? '' }]);

/**
 * Get attribute value as an array of parts (value + unit).
 * @param {Object} hass - Home Assistant instance
 * @param {Object} stateObj - Entity state object
 * @param {string} key - Attribute key
 * @returns {Array<{value: string}>} Parts array
 */
export const haFormatAttrParts = (hass, stateObj, key) =>
    safeCall(() => hass.formatEntityAttributeValueToParts(stateObj, key), [{ value: String(stateObj?.attributes?.[key] ?? '') }]);

/**
 * Format a number using HA's locale settings.
 * Falls back to Intl.NumberFormat with the user's language if hass is unavailable.
 * @param {Object} hass - Home Assistant instance (used for locale.language)
 * @param {number} value - Numeric value to format
 * @param {Object} [opts={}] - Intl.NumberFormat options
 * @returns {string} Formatted number string
 */
export const haFormatNumber = (hass, value, opts = {}) =>
    Number.isFinite(value)
        ? new Intl.NumberFormat(hass?.locale?.language ?? 'en', opts).format(value)
        : String(value);

/**
 * Format a timestamp using HA's locale settings.
 * Falls back to Intl.DateTimeFormat with the user's language if hass is unavailable.
 * @param {Object} hass - Home Assistant instance (used for locale settings)
 * @param {number|string|Date} ts - Timestamp, ISO string, or Date object
 * @param {Object} [opts={}] - Intl.DateTimeFormat options
 * @returns {string} Formatted date/time string
 */
export const haFormatDate = (hass, ts, opts = {}) =>
    new Intl.DateTimeFormat(
        hass?.locale?.language ?? 'en',
        { hour12: hass?.locale?.time_format === '12', ...opts }
    ).format(new Date(ts));

/**
 * Join a ToParts result into a single display string.
 * Parts are: [{ value: '23.5' }, { value: '°C' }] → '23.5 °C'
 * Handles both value-only and value+unit forms.
 * @param {Array<{value: string}>} parts - Parts array from haFormatStateParts/haFormatAttrParts
 * @returns {string} Joined display string
 */
export function joinParts(parts) {
    if (!Array.isArray(parts) || parts.length === 0) return '';
    return parts.map(p => p.value ?? '').join(' ').trim();
}

/**
 * Extract just the unit from a ToParts result.
 * Returns empty string if no unit part present.
 * HA returns [{value: numericStr}, {value: unitStr}] for sensor values.
 * @param {Array<{value: string}>} parts - Parts array from haFormatStateParts/haFormatAttrParts
 * @returns {string} Unit string, or empty string if not available
 */
export function extractUnit(parts) {
    if (!Array.isArray(parts) || parts.length < 2) return '';
    return parts[parts.length - 1]?.value ?? '';
}

/**
 * Safely call a function, returning a fallback value if it throws.
 * @param {Function} fn - Function to call
 * @param {*} fallback - Fallback value if fn throws
 * @returns {*} Result of fn or fallback
 * @private
 */
function safeCall(fn, fallback) {
    try { return fn(); } catch { return fallback; }
}
