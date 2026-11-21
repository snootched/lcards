/**
 * Synthetic hass snapshots: a card that hands its children a modified copy of
 * hass (lcards-select-menu rewrites its entity's state to on/off per option so
 * the option buttons colour themselves) marks the copy here. Cards never forward
 * a marked copy to the shared core (LCARdSCore.ingestHass, HelperManager), so the
 * rewritten state can't leak to every other card reading that entity.
 *
 * @module utils/synthetic-hass
 */

const SYNTHETIC = new WeakSet();

/** Mark a hass copy as synthetic. @template T @param {T} hass @returns {T} the same object */
export function markSyntheticHass(hass) {
    if (hass && typeof hass === 'object') SYNTHETIC.add(hass);
    return hass;
}

/** @returns {boolean} true for a copy made by markSyntheticHass() */
export function isSyntheticHass(hass) {
    return !!hass && typeof hass === 'object' && SYNTHETIC.has(hass);
}
