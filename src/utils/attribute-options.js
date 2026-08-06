/**
 * @fileoverview Shared entity-attribute dropdown option builder.
 *
 * Centralizes "list this entity's attributes, with a virtual brightness_pct
 * option injected right after brightness" — used anywhere an editor lets the
 * user pick an attribute by entity ID (not necessarily the card's own entity).
 *
 * @module utils/attribute-options
 */

/**
 * @param {Object} hass - Home Assistant instance
 * @param {string} entityId
 * @returns {Array<{value: string, label: string}>}
 */
export function getAttributeOptions(hass, entityId) {
    if (!entityId || !hass?.states?.[entityId]) return [];
    const attrs = Object.keys(hass.states[entityId].attributes || {}).sort();
    const options = [];
    for (const attr of attrs) {
        options.push({ value: attr, label: attr });
        if (attr === 'brightness') {
            options.push({ value: 'brightness_pct', label: 'brightness_pct  (auto 0–100%)' });
        }
    }
    return options;
}
