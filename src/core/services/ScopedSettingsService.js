/**
 * @fileoverview ScopedSettingsService — three-tier settings waterfall
 *
 * Provides a unified read/write API for per-user and per-device scoped
 * settings, with automatic fallback to the global tier.
 *
 * ## Resolution order (first non-null hit wins)
 *
 * ```
 * Card YAML config  (handled by the card itself, not this service)
 *        ↓
 * Device scope      ← backend key  _device_<device_uuid>.<key>
 *        ↓
 * User scope        ← backend key  _user_<user_uuid>.<key>
 *        ↓
 * Global scope      ← backend flat key  <key>  (legacy / HA helpers)
 *        ↓
 * globalFallback()  ← caller-supplied function (read HA helper entity, etc.)
 * ```
 *
 * ## Graceful degradation
 *
 * If the LCARdS HA integration is unavailable (not installed, or on an older
 * version without ``scoped_storage`` capability), all scoped reads fall
 * through to ``globalFallback`` only — no WS calls are attempted.
 *
 * ## Usage
 *
 * ```js
 * const sss = window.lcards.core.scopedSettingsService;
 *
 * // Read with full waterfall
 * const vol = await sss.read(
 *   STORAGE_KEY_SOUND_VOLUME,
 *   ['device', 'user', 'global'],
 *   () => helperManager.getHelperValue('sound_volume')
 * );
 *
 * // Write to user scope
 * await sss.write(STORAGE_KEY_SOUND_VOLUME, 0.7, 'user');
 *
 * // Clear user override (falls back to next tier on next read)
 * await sss.clear(STORAGE_KEY_SOUND_VOLUME, 'user');
 *
 * // Read all scopes at once (for origin badges in the config panel)
 * const allScopes = await sss.readAllScopes(STORAGE_KEY_SOUND_VOLUME);
 * // → { device: null, user: 0.7, global: 0.5, fallback: 0.5 }
 * ```
 *
 * @module core/services/ScopedSettingsService
 */

import { lcardsLog } from '../../utils/lcards-logging.js';
import { BaseService } from '../BaseService.js';

export class ScopedSettingsService extends BaseService {

    constructor() {
        super();
        /** @private */
        this._hass = null;
    }

    // -----------------------------------------------------------------------
    // BaseService lifecycle
    // -----------------------------------------------------------------------

    updateHass(hass) {
        this._hass = hass;
    }

    // -----------------------------------------------------------------------
    // Public API
    // -----------------------------------------------------------------------

    /**
     * Read a setting value using the configured scope waterfall.
     *
     * Walks ``scopes`` in order and returns the first non-null / non-undefined
     * value found.  If all scopes miss, calls ``globalFallback()`` if provided.
     *
     * When the backend is unavailable (no integration, or capability absent),
     * the device and user scopes are skipped and only ``globalFallback`` is
     * consulted.
     *
     * @param {string}   key            - Setting key (see ScopedSettingsConstants.js)
     * @param {string[]} [scopes]       - Ordered list of scopes to check.
     *                                   Valid values: ``'device'``, ``'user'``, ``'global'``
     * @param {Function} [globalFallback] - Optional sync/async function called when
     *                                   all scopes return null.
     * @returns {Promise<any>} Resolved value, or null if nothing found.
     */
    async read(key, scopes = ['device', 'user', 'global'], globalFallback = null) {
        const integration = this._getIntegration();
        const scopedAvailable = this._isScopedAvailable(integration);

        for (const scope of scopes) {
            if (!scopedAvailable && scope !== 'global') continue;

            const value = await this._readScope(key, scope, integration);
            if (value !== null && value !== undefined) {
                lcardsLog.trace(
                    `[ScopedSettingsService] read("${key}") → hit at scope "${scope}": ${JSON.stringify(value)}`
                );
                return value;
            }
        }

        // All scopes missed — try caller-supplied fallback
        if (typeof globalFallback === 'function') {
            const fbValue = await globalFallback();
            lcardsLog.trace(
                `[ScopedSettingsService] read("${key}") → fallback: ${JSON.stringify(fbValue ?? null)}`
            );
            return fbValue ?? null;
        }

        return null;
    }

    /**
     * Write a setting value to a specific scope tier.
     *
     * @param {string} key   - Setting key.
     * @param {any}    value - Value to store (must be JSON-serialisable).
     * @param {string} scope - Target scope: ``'device'``, ``'user'``, or ``'global'``.
     * @returns {Promise<boolean>} True on success, false on error.
     */
    async write(key, value, scope, opts = {}) {
        const integration = this._getIntegration();
        if (!integration?.available || !this._hass?.connection) {
            lcardsLog.warn(`[ScopedSettingsService] write("${key}", scope="${scope}") — integration unavailable`);
            return false;
        }
        if (!this._isScopedAvailable(integration) && scope !== 'global') {
            lcardsLog.warn(
                `[ScopedSettingsService] write("${key}", scope="${scope}") — scoped_storage capability absent, downgrading to global`
            );
            scope = 'global';
        }

        return this._writeScope(key, value, scope, integration, opts);
    }

    /**
     * Clear (remove) a setting from a specific scope tier.
     *
     * After clearing, the next ``read()`` call will fall through to the tier
     * below (e.g. user → global, device → user → global).
     *
     * @param {string} key   - Setting key to remove.
     * @param {string} scope - Scope tier to clear from.
     * @returns {Promise<boolean>} True on success, false on error.
     */
    async clear(key, scope, opts = {}) {
        const integration = this._getIntegration();
        if (!integration?.available || !this._hass?.connection) {
            lcardsLog.warn(`[ScopedSettingsService] clear("${key}", scope="${scope}") — integration unavailable`);
            return false;
        }
        return this._clearScope(key, scope, integration, opts);
    }

    /**
     * Read a setting from all scope tiers simultaneously.
     *
     * Returns an object with the raw value at each tier (null if not set or
     * unavailable), plus a ``resolved`` key reflecting the final waterfall
     * result (highest-priority non-null value).
     *
     * This is used by the config panel to render origin badges
     * ("From: Global", "User override", etc.).
     *
     * @param {string}   key            - Setting key.
     * @param {Function} [globalFallback] - Fallback for global miss.
     * @returns {Promise<{device: any, user: any, global: any, resolved: any}>}
     */
    async readAllScopes(key, globalFallback = null, opts = {}) {
        const integration = this._getIntegration();
        const scopedAvailable = this._isScopedAvailable(integration);

        const result = { device: null, user: null, global: null, resolved: null };

        if (scopedAvailable) {
            result.device = await this._readScope(key, 'device', integration, opts);
            result.user   = await this._readScope(key, 'user',   integration, opts);
        }
        result.global = await this._readScope(key, 'global', integration, opts);

        // Fallback
        if (result.global === null && typeof globalFallback === 'function') {
            result.global = (await globalFallback()) ?? null;
        }

        // Resolved = first non-null in Device → User → Global order
        result.resolved = result.device ?? result.user ?? result.global;

        return result;
    }

    // -----------------------------------------------------------------------
    // Private: scope-specific read / write / clear
    // -----------------------------------------------------------------------

    /** @private */
    async _readScope(key, scope, integration, opts = {}) {
        try {
            switch (scope) {
                case 'device': {
                    const deviceId = opts.targetDeviceId
                        ?? window.lcards?.core?.deviceIdentityManager?.getDeviceId();
                    if (!deviceId) return null;
                    const result = await this._hass.connection.sendMessagePromise({
                        type: 'lcards/storage/device/get',
                        device_id: deviceId,
                        key,
                    });
                    return result?.value ?? null;
                }

                case 'user': {
                    if (opts.targetUserId) {
                        // Admin read: users/get returns the full dict; extract the key.
                        const result = await this._hass.connection.sendMessagePromise({
                            type: 'lcards/storage/users/get',
                            user_id: opts.targetUserId,
                        });
                        const value = result?.value?.[key];
                        return value !== undefined ? value : null;
                    }
                    const result = await this._hass.connection.sendMessagePromise({
                        type: 'lcards/storage/user/get',
                        key,
                    });
                    return result?.value ?? null;
                }

                case 'global': {
                    return await integration.readStorage(key) ?? null;
                }

                default:
                    lcardsLog.warn(`[ScopedSettingsService] Unknown scope "${scope}"`);
                    return null;
            }
        } catch (err) {
            lcardsLog.warn(`[ScopedSettingsService] _readScope("${key}", "${scope}") failed:`, err);
            return null;
        }
    }

    /** @private */
    async _writeScope(key, value, scope, integration, opts = {}) {
        try {
            switch (scope) {
                case 'device': {
                    const deviceId = opts.targetDeviceId
                        ?? window.lcards?.core?.deviceIdentityManager?.getDeviceId();
                    if (!deviceId) return false;
                    lcardsLog.debug(`[ScopedSettingsService] write device "${key}" → device_id="${deviceId}" (targetDeviceId=${opts.targetDeviceId ?? 'own'})`);
                    await this._hass.connection.sendMessagePromise({
                        type: 'lcards/storage/device/set',
                        device_id: deviceId,
                        data: { [key]: value },
                    });
                    lcardsLog.debug(`[ScopedSettingsService] write device "${key}" = ${JSON.stringify(value)}`);
                    return true;
                }

                case 'user': {
                    if (opts.targetUserId) {
                        // Admin write to a specific user's storage.
                        await this._hass.connection.sendMessagePromise({
                            type: 'lcards/storage/users/set',
                            user_id: opts.targetUserId,
                            data: { [key]: value },
                        });
                        lcardsLog.debug(`[ScopedSettingsService] write user[${opts.targetUserId}] "${key}" = ${JSON.stringify(value)}`);
                    } else {
                        await this._hass.connection.sendMessagePromise({
                            type: 'lcards/storage/user/set',
                            data: { [key]: value },
                        });
                        lcardsLog.debug(`[ScopedSettingsService] write user "${key}" = ${JSON.stringify(value)}`);
                    }
                    return true;
                }

                case 'global': {
                    const ok = await integration.writeStorage({ [key]: value });
                    lcardsLog.debug(`[ScopedSettingsService] write global "${key}" = ${JSON.stringify(value)}`);
                    return ok;
                }

                default:
                    return false;
            }
        } catch (err) {
            lcardsLog.warn(`[ScopedSettingsService] _writeScope("${key}", "${scope}") failed:`, err);
            return false;
        }
    }

    /** @private */
    async _clearScope(key, scope, integration, opts = {}) {
        try {
            switch (scope) {
                case 'device': {
                    const deviceId = opts.targetDeviceId
                        ?? window.lcards?.core?.deviceIdentityManager?.getDeviceId();
                    if (!deviceId) return false;
                    // Use device/set with null to clear; device storage uses deep-merge
                    // so setting to null is the cleanest signal available via device/set.
                    // For a true delete we'd need a dedicated endpoint — for now null
                    // behaves as "unset" in the waterfall (null is treated as a miss).
                    await this._hass.connection.sendMessagePromise({
                        type: 'lcards/storage/device/set',
                        device_id: deviceId,
                        data: { [key]: null },
                    });
                    lcardsLog.debug(`[ScopedSettingsService] clear device "${key}"`);
                    return true;
                }

                case 'user': {
                    if (opts.targetUserId) {
                        // Admin clear: users/set with null (no dedicated users/delete endpoint).
                        await this._hass.connection.sendMessagePromise({
                            type: 'lcards/storage/users/set',
                            user_id: opts.targetUserId,
                            data: { [key]: null },
                        });
                        lcardsLog.debug(`[ScopedSettingsService] clear user[${opts.targetUserId}] "${key}"`);
                    } else {
                        await this._hass.connection.sendMessagePromise({
                            type: 'lcards/storage/user/delete',
                            key,
                        });
                        lcardsLog.debug(`[ScopedSettingsService] clear user "${key}"`);
                    }
                    return true;
                }

                case 'global': {
                    return await integration.deleteStorage(key);
                }

                default:
                    return false;
            }
        } catch (err) {
            lcardsLog.warn(`[ScopedSettingsService] _clearScope("${key}", "${scope}") failed:`, err);
            return false;
        }
    }

    // -----------------------------------------------------------------------
    // Private: helpers
    // -----------------------------------------------------------------------

    /** @private */
    _getIntegration() {
        return window.lcards?.core?.integrationService ?? null;
    }

    /**
     * Returns true if the backend is available AND the ``scoped_storage``
     * capability is present.  Falls back gracefully when running against an
     * older backend that doesn't advertise capabilities.
     * @private
     */
    _isScopedAvailable(integration) {
        if (!integration?.available || !this._hass?.connection) return false;
        return integration.capabilities.has('scoped_storage');
    }
}
