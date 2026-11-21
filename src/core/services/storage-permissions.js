/**
 * @fileoverview Who may write the global LCARdS store.
 *
 * The backend refuses lcards/storage/set, delete, reset and dump for
 * non-admins (websocket_api.py `_require_admin`). Everyone keeps their own
 * user and device scopes (lcards/storage/user/* and device/*). Panels use
 * this one check to decide whether the Global scope is offered at all.
 */

/**
 * True when the signed-in Home Assistant user may write global LCARdS storage.
 * Unknown user (hass not loaded yet) counts as no.
 * @param {any} hass
 * @returns {boolean}
 */
export function canWriteGlobalStorage(hass) {
    return hass?.user?.is_admin === true;
}

/**
 * The scope a settings tab starts on: global for admins, the user's own scope otherwise.
 * @param {any} hass
 * @returns {'global'|'user'}
 */
export function defaultSettingsScope(hass) {
    return canWriteGlobalStorage(hass) ? 'global' : 'user';
}

/** Error text shown when a global write is refused. */
export const GLOBAL_WRITE_REFUSED_MSG = 'Only a Home Assistant administrator can change global LCARdS settings.';
