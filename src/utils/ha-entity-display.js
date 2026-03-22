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
 * Resolve the Intl locale string for number formatting from hass.locale.number_format.
 * Mirrors HA frontend's numberFormatToLocale() exactly.
 * Returns a string, array of strings (Intl fallback chain), or undefined (system locale).
 * @param {Object} hass - Home Assistant instance
 * @returns {string|string[]|undefined}
 * @private
 */
function _numberFormatToLocale(hass) {
    const lang = hass?.locale?.language ?? 'en';
    switch (hass?.locale?.number_format) {
        case 'comma_decimal':  return ['en-US', 'en'];      // 1,234,567.89
        case 'decimal_comma':  return ['de', 'es', 'it'];   // 1.234.567,89
        case 'space_comma':    return ['fr', 'sv', 'cs'];   // 1 234 567,89
        case 'quote_decimal':  return ['de-CH'];             // 1'234'567.89
        case 'system':         return undefined;             // browser default
        default:               return lang;                  // 'language' and 'none' both use lang
    }
}

/**
 * Format a number using HA's locale settings.
 * Respects hass.locale.number_format (comma_decimal, decimal_comma, space_comma,
 * quote_decimal, system, none) in addition to hass.locale.language.
 * Mirrors HA frontend's formatNumber() behaviour exactly.
 * @param {Object} hass - Home Assistant instance
 * @param {number} value - Numeric value to format
 * @param {Object} [opts={}] - Intl.NumberFormat options
 * @returns {string} Formatted number string
 */
export const haFormatNumber = (hass, value, opts = {}) => {
    if (!Number.isFinite(value)) return String(value);
    const locale = _numberFormatToLocale(hass);
    // 'none' → language locale with grouping disabled (mirrors HA behaviour)
    const extra = hass?.locale?.number_format === 'none' ? { useGrouping: false } : {};
    return new Intl.NumberFormat(locale, { ...opts, ...extra }).format(value);
};

/**
 * Resolve the Intl locale string for date formatting.
 * For system/language → let Intl use the natural locale order.
 * For DMY/MDY/YMD → use the language locale but reorder parts via formatToParts.
 * @param {Object} hass - Home Assistant instance
 * @returns {{ locale: string|undefined, dateFormat: string|null }}
 * @private
 */
function _dateLocaleInfo(hass) {
    const lang = hass?.locale?.language ?? 'en';
    const dateFormat = hass?.locale?.date_format ?? 'language';
    const locale = dateFormat === 'system' ? undefined : lang;
    const needsReorder = dateFormat === 'DMY' || dateFormat === 'MDY' || dateFormat === 'YMD';
    return { locale, dateFormat: needsReorder ? dateFormat : null };
}

/**
 * Reorder numeric date parts (DMY/MDY/YMD) using formatToParts().
 * Mirrors HA frontend's formatDateNumeric() formatToParts approach exactly.
 * Only called when opts contain year+month+day components.
 * @private
 */
function _formatDateOrdered(date, locale, opts, dateFormat) {
    const formatter = new Intl.DateTimeFormat(locale, opts);
    const parts = formatter.formatToParts(date);

    const literal  = parts.find(p => p.type === 'literal')?.value ?? '/';
    const day      = parts.find(p => p.type === 'day')?.value;
    const month    = parts.find(p => p.type === 'month')?.value;
    const year     = parts.find(p => p.type === 'year')?.value;

    // trailing literal (some locales append one — Bulgarian YMD needs it stripped)
    const lastPart = parts[parts.length - 1];
    let lastLiteral = lastPart?.type === 'literal' ? lastPart.value : '';
    if (locale === 'bg' && dateFormat === 'YMD') lastLiteral = '';

    if (!day || !month || !year) return formatter.format(date); // can't reorder, fall back

    const ordered = {
        DMY: `${day}${literal}${month}${literal}${year}${lastLiteral}`,
        MDY: `${month}${literal}${day}${literal}${year}${lastLiteral}`,
        YMD: `${year}${literal}${month}${literal}${day}${lastLiteral}`,
    };
    return ordered[dateFormat] ?? formatter.format(date);
}

/**
 * Format a timestamp using HA's locale settings.
 * Respects hass.locale.language, hass.locale.time_format (12/24h),
 * and hass.locale.date_format (DMY/MDY/YMD/language/system).
 * Mirrors HA frontend's date formatting behaviour.
 * @param {Object} hass - Home Assistant instance
 * @param {number|string|Date} ts - Timestamp, ISO string, or Date object
 * @param {Object} [opts={}] - Intl.DateTimeFormat options
 * @returns {string} Formatted date/time string
 */
export const haFormatDate = (hass, ts, opts = {}) => {
    const { locale, dateFormat } = _dateLocaleInfo(hass);
    const hour12 = hass?.locale?.time_format === '12';
    const baseOpts = { hour12, ...opts };
    const date = new Date(ts);

    // Only reorder when we have all three numeric date components
    const hasAllDateParts = baseOpts.year && baseOpts.month && baseOpts.day;
    if (dateFormat && hasAllDateParts) {
        return _formatDateOrdered(date, locale, baseOpts, dateFormat);
    }

    return new Intl.DateTimeFormat(locale, baseOpts).format(date);
};

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
