/**
 * @fileoverview DeviceIdentityManager — stable per-browser identity
 *
 * Generates and persists a stable UUID for the current browser profile using
 * ``localStorage``.  The UUID is the authoritative routing key for all
 * device-scoped backend storage — it never changes, even when the user
 * renames the device.
 *
 * On first load the device is also assigned a human-readable **display name**
 * derived from the browser's User-Agent string (e.g. ``Chrome-Android``,
 * ``Safari-iPhone``, ``Firefox-Windows``).  Users can rename their device
 * from the LCARdS config panel, or admins can name kiosk devices by appending
 * ``?lcards_device=kitchen-tablet`` to the HA URL.
 *
 * ## Storage layout
 *
 * - ``localStorage['lcards_device_id']`` — the stable UUID (never mutated
 *   after creation; survives page reloads, HA restarts).
 * - Backend key ``_device_<uuid>`` — device metadata object:
 *   ``{ display_name, last_seen, user_agent }``
 *
 * ## URL parameter
 *
 * Appending ``?lcards_device=<name>`` to any HA URL overrides the current
 * device's display name on load and writes it to the backend.  Ideal for
 * kiosk bookmarks where the admin wants to pre-name the device without
 * opening the config panel.
 *
 * Example: ``http://homeassistant.local:8123/?lcards_device=kitchen-tablet``
 *
 * @module core/services/DeviceIdentityManager
 */

import { lcardsLog } from '../../utils/lcards-logging.js';
import { BaseService } from '../BaseService.js';
import {
    LOCALSTORAGE_DEVICE_ID,
    DEVICE_KEY_DISPLAY_NAME,
    DEVICE_KEY_LAST_SEEN,
    DEVICE_KEY_USER_AGENT,
    URL_PARAM_DEVICE_NAME,
} from './ScopedSettingsConstants.js';

export class DeviceIdentityManager extends BaseService {

    constructor() {
        super();

        /** @private — stable UUID for this browser profile */
        this._deviceId = null;

        /** @private — human-readable display name (mutable) */
        this._displayName = null;

        /** @private — ISO timestamp of last successful heartbeat */
        this._lastSeen = null;

        /** @private — most recent hass reference */
        this._hass = null;

        /** @private — guard: only initialise once */
        this._initialised = false;
    }

    // -----------------------------------------------------------------------
    // Property getters (convenience — avoids method-call ceremony at call sites)
    // -----------------------------------------------------------------------

    /** Stable device UUID. @type {string} */
    get deviceId() { return this.getDeviceId(); }

    /** Human-readable display name. @type {string} */
    get displayName() { return this.getDisplayName(); }

    /** ISO string of last heartbeat, or null. @type {string|null} */
    get lastSeen() { return this._lastSeen; }

    /** Browser user-agent string. @type {string} */
    get userAgent() { return navigator.userAgent; }

    // -----------------------------------------------------------------------
    // BaseService lifecycle
    // -----------------------------------------------------------------------

    /**
     * Called on every HASS update by the core.
     * Initialises on the first non-null call.
     * @param {Object} hass
     */
    updateHass(hass) {
        this._hass = hass;
        if (!this._initialised) {
            this._initialised = true;
            this._init();
        }
    }

    // -----------------------------------------------------------------------
    // Public API
    // -----------------------------------------------------------------------

    /**
     * Return the stable device UUID for this browser profile.
     * Creates a new UUID and persists it to localStorage on first call.
     * @returns {string}
     */
    getDeviceId() {
        if (!this._deviceId) {
            this._deviceId = this._loadOrCreateId();
        }
        return this._deviceId;
    }

    /**
     * Return the human-readable display name for this device.
     * Falls back to the auto-seeded User-Agent label if not yet loaded.
     * @returns {string}
     */
    getDisplayName() {
        return this._displayName ?? _seedDisplayName();
    }

    /**
     * Set the display name for this device and persist it to the backend.
     * @param {string} name
     * @returns {Promise<void>}
     */
    async setDisplayName(name) {
        this._displayName = name;
        await this._writeToBackend({ [DEVICE_KEY_DISPLAY_NAME]: name });
        lcardsLog.info(`[DeviceIdentityManager] Display name updated → "${name}"`);
    }

    /**
     * Fire a heartbeat to the backend, registering this device if new.
     *
     * Reads the existing ``display_name`` first so a user-set name is never
     * overwritten by the auto-seeded UA label on subsequent page loads.
     * Then writes ``display_name``, ``last_seen``, and ``user_agent``.
     *
     * @returns {Promise<void>}
     */
    async registerHeartbeat() {
        const now = new Date().toISOString();
        this._lastSeen = now;

        // Read whatever is already stored so we don't clobber a user-set name.
        // On the very first load of a new device there will be nothing stored,
        // so we fall through to the seeded display name.
        const existing = await this._readFromBackend();
        const storedName = existing?.[DEVICE_KEY_DISPLAY_NAME];
        if (storedName) {
            // Honour the stored name; keep local state in sync.
            this._displayName = storedName;
        }

        await this._writeToBackend({
            [DEVICE_KEY_DISPLAY_NAME]: this.getDisplayName(),
            [DEVICE_KEY_LAST_SEEN]:    now,
            [DEVICE_KEY_USER_AGENT]:   navigator.userAgent,
        });
        lcardsLog.debug(
            `[DeviceIdentityManager] Heartbeat sent (device=${this._deviceId}, name="${this.getDisplayName()}")`
        );
    }

    // -----------------------------------------------------------------------
    // Private helpers
    // -----------------------------------------------------------------------

    /**
     * One-time initialisation: load/generate UUID, apply URL param name,
     * then register heartbeat after the integration probe resolves.
     * @private
     */
    _init() {
        // Ensure UUID exists
        this._deviceId = this._loadOrCreateId();

        // Apply URL parameter override, if present
        const urlName = _readUrlParam();
        if (urlName) {
            this._displayName = urlName;
            lcardsLog.info(
                `[DeviceIdentityManager] Display name overridden via URL param "${URL_PARAM_DEVICE_NAME}" → "${urlName}"`
            );
        }

        // Seed a friendly name if not already set
        if (!this._displayName) {
            this._displayName = _seedDisplayName();
        }

        // Register heartbeat after integration is ready
        const integration = window.lcards?.core?.integrationService;
        if (integration) {
            integration.onReady().then(() => {
                if (integration.available) {
                    this.registerHeartbeat();
                }
            });
        }
    }

    /**
     * Load the device UUID from localStorage, or create and persist a new one.
     * @returns {string}
     * @private
     */
    _loadOrCreateId() {
        try {
            let id = localStorage.getItem(LOCALSTORAGE_DEVICE_ID);
            if (!id) {
                id = crypto.randomUUID();
                localStorage.setItem(LOCALSTORAGE_DEVICE_ID, id);
                lcardsLog.info(`[DeviceIdentityManager] New device UUID generated → ${id}`);
            } else {
                lcardsLog.debug(`[DeviceIdentityManager] Device UUID loaded from localStorage → ${id}`);
            }
            return id;
        } catch (err) {
            // localStorage may be unavailable in certain browser environments
            lcardsLog.warn('[DeviceIdentityManager] localStorage unavailable — using ephemeral UUID:', err);
            return crypto.randomUUID();
        }
    }

    /**
     * Write a partial update to this device's scoped backend storage.
     * No-op if the integration is unavailable.
     * @param {Object} data
     * @returns {Promise<void>}
     * @private
     */
    async _writeToBackend(data) {
        const integration = window.lcards?.core?.integrationService;
        if (!integration?.available || !this._hass?.connection) return;

        try {
            await this._hass.connection.sendMessagePromise({
                type: 'lcards/storage/device/set',
                device_id: this.getDeviceId(),
                data,
            });
        } catch (err) {
            lcardsLog.warn('[DeviceIdentityManager] Backend write failed:', err);
        }
    }

    /**
     * Read this device's full backend storage object.
     * Returns null if the integration is unavailable or the read fails.
     * @returns {Promise<Object|null>}
     * @private
     */
    async _readFromBackend() {
        const integration = window.lcards?.core?.integrationService;
        if (!integration?.available || !this._hass?.connection) return null;

        try {
            const result = await this._hass.connection.sendMessagePromise({
                type: 'lcards/storage/device/get',
                device_id: this.getDeviceId(),
            });
            return result?.value ?? null;
        } catch (err) {
            lcardsLog.warn('[DeviceIdentityManager] Backend read failed:', err);
            return null;
        }
    }
}

// ---------------------------------------------------------------------------
// Module-level helpers (pure, no state)
// ---------------------------------------------------------------------------

/**
 * Read the ``lcards_device`` URL parameter from the current page URL.
 * @returns {string|null}
 */
function _readUrlParam() {
    try {
        const params = new URLSearchParams(window.location.search);
        const val = params.get(URL_PARAM_DEVICE_NAME);
        return val ? val.trim() : null;
    } catch {
        return null;
    }
}

/**
 * Derive a human-readable seed name from the browser User-Agent.
 *
 * Returns strings like ``Chrome-Android``, ``Safari-iPhone``,
 * ``Firefox-Windows``, ``Edge-Windows``, keeping it short enough to be
 * recognisable without being a full UA dump.
 *
 * @returns {string}
 */
function _seedDisplayName() {
    try {
        const ua = navigator.userAgent;

        // OS / platform detection (order matters — mobile before desktop)
        let platform = 'Unknown';
        if (/Android/i.test(ua))         platform = 'Android';
        else if (/iPhone|iPad|iPod/i.test(ua)) platform = 'iPhone';
        else if (/Windows/i.test(ua))    platform = 'Windows';
        else if (/Mac OS X/i.test(ua))   platform = 'Mac';
        else if (/Linux/i.test(ua))      platform = 'Linux';
        else if (/CrOS/i.test(ua))       platform = 'ChromeOS';

        // Browser detection (order: specific variants before generic)
        let browser = 'Browser';
        if (/Edg\//i.test(ua))           browser = 'Edge';
        else if (/OPR\//i.test(ua))      browser = 'Opera';
        else if (/Chrome/i.test(ua))     browser = 'Chrome';
        else if (/Safari/i.test(ua))     browser = 'Safari';
        else if (/Firefox/i.test(ua))    browser = 'Firefox';

        return `${browser}-${platform}`;
    } catch {
        return 'Unknown-Device';
    }
}
