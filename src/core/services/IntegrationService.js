/**
 * @fileoverview IntegrationService — Backend integration probe
 *
 * Probes the LCARdS HA integration at boot to determine whether the
 * Python backend is installed and active. All other services that want
 * to use backend APIs check `window.lcards.core.integrationService.available`
 * before making WS calls.
 *
 * Degraded mode (integration not installed):
 *   - this.available === false
 *   - Services operate in no-op / limited mode until the integration responds
 *
 * @module core/services/IntegrationService
 */

import { lcardsLog } from '../../utils/lcards-logging.js';
import { BaseService } from '../BaseService.js';

export class IntegrationService extends BaseService {

    constructor() {
        super();

        /** @type {boolean} True if the LCARdS HA integration responded to lcards/info */
        this.available = false;

        /** @type {string|null} Version reported by the integration, or null */
        this.version = null;

        /**
         * Number of keys currently in backend storage, or null if unavailable.
         * Populated after the first successful lcards/info probe.
         * @type {number|null}
         */
        this.storageKeyCount = null;

        /**
         * Snapshot of configured options from the integration's config entry, or null.
         * Keys: show_panel, sidebar_title, sidebar_icon, log_level
         * @type {Object|null}
         */
        this.options = null;

        /**
         * Set of capability strings advertised by the backend in the lcards/info
         * response.  Check before using features that require a minimum backend
         * version.
         *
         * Known capabilities:
         *   - ``scoped_storage`` — per-user / per-device namespaced WS commands
         *
         * @type {Set<string>}
         */
        this.capabilities = new Set();

        /** @private — cached HASS reference updated on every updateHass() call */
        this._hass = null;

        /** @private — ensures we only probe once */
        this._probed = false;

        /**
         * @private
         * Promise that resolves once the lcards/info probe has completed
         * (regardless of whether the backend is available).  Consumers that
         * need to wait before making API calls should use ``onReady()``
         * rather than polling ``_probed`` directly.
         */
        this._readyPromise = new Promise((resolve) => {
            this._readyResolve = resolve;
        });

        /** @private — unsubscribe fn for the lcards_event HA event listener */
        this._eventUnsubscribe = null;
    }

    /**
     * True once the initial lcards/info probe has completed.
     * The probe outcome (available vs. unavailable) does not affect this flag.
     * @type {boolean}
     */
    get isReady() {
        return this._probed;
    }

    /**
     * Returns a Promise that resolves once the lcards/info probe completes.
     *
     * Resolves immediately if the probe has already finished.  Other services
     * should ``await integration.onReady()`` rather than polling ``_probed``
     * directly, or checking ``available`` before it has been set.
     *
     * @returns {Promise<void>}
     */
    onReady() {
        return this._readyPromise;
    }

    /**
     * Called by _updateHass on every HASS update.
     * Probes lcards/info once — on the first update where hass.connection exists.
     *
     * @param {Object} hass - Home Assistant instance
     */
    updateHass(hass) {
        this._hass = hass;
        if (this._probed || !hass?.connection) return;
        this._probed = true;
        // Fire-and-forget — errors are caught inside initialize()
        this.initialize(hass);
    }

    /**
     * Probe the backend integration.
     *
     * Sends lcards/info via the HA WebSocket connection. On success sets
     * this.available = true and this.version. On any error (integration not
     * installed, WS not ready, timeout) sets this.available = false silently.
     *
     * Safe to call multiple times — subsequent calls re-probe and update state.
     *
     * @param {Object} hass - Home Assistant instance
     * @returns {Promise<void>}
     */
    async initialize(hass) {
        if (!hass?.connection) {
            lcardsLog.warn('[IntegrationService] No HASS connection available — skipping probe');
            return;
        }

        try {
            const result = await hass.connection.sendMessagePromise({
                type: 'lcards/info',
            });

            this.available = result?.available === true;
            this.version = result?.version ?? null;
            this.storageKeyCount = result?.storage_key_count ?? null;
            this.options = result?.options ?? null;
            this.capabilities = new Set(Array.isArray(result?.capabilities) ? result.capabilities : []);

            lcardsLog.info(
                `[IntegrationService] Backend available v${this.version} (${this.storageKeyCount ?? '?'} storage keys, capabilities: [${[...this.capabilities].join(', ')}])`
            );

            // Subscribe to the lcards_event push channel now that we know
            // the backend is live and the WS connection is ready.
            this._startEventListener();
        } catch {
            this.available = false;
            this.version = null;
            this.storageKeyCount = null;
            this.options = null;
            this.capabilities = new Set();
            lcardsLog.info(
                '[IntegrationService] Backend not found — degraded mode (integration not installed)'
            );
        } finally {
            // Resolve the readiness promise regardless of probe outcome so that
            // consumers awaiting onReady() are not left hanging.
            this._readyResolve?.();
        }
    }

    // -----------------------------------------------------------------------
    // Backend Storage Convenience API
    // -----------------------------------------------------------------------

    /**
     * Read a value from the LCARdS backend persistent storage.
     *
     * Returns the stored value (any JSON type), or `undefined` if the key does
     * not exist, the integration is unavailable, or the call fails.
     *
     * @param {string} key - Storage key to read
     * @returns {Promise<any>} Stored value, or undefined on miss / error
     */
    async readStorage(key) {
        if (!this.available || !this._hass?.connection) return undefined;
        try {
            const result = await this._hass.connection.sendMessagePromise({
                type: 'lcards/storage/get',
                key,
            });
            return result?.value;
        } catch (err) {
            lcardsLog.warn(`[IntegrationService] readStorage("${key}") failed:`, err);
            return undefined;
        }
    }

    /**
     * Write one or more key/value pairs to the LCARdS backend persistent storage.
     *
     * Performs a shallow merge — existing keys not present in `updates` are
     * preserved.  Pass `{ myKey: null }` to effectively clear a key (the key
     * will remain in storage with a null value; use deleteStorage() to fully
     * remove it).
     *
     * @param {Object} updates - Plain object of key → value pairs to merge
     * @returns {Promise<boolean>} `true` on success, `false` on error / unavailable
     */
    async writeStorage(updates) {
        if (!this.available || !this._hass?.connection) return false;
        try {
            await this._hass.connection.sendMessagePromise({
                type: 'lcards/storage/set',
                data: updates,
            });
            return true;
        } catch (err) {
            lcardsLog.warn('[IntegrationService] writeStorage() failed:', err);
            return false;
        }
    }

    /**
     * Delete a single key from the LCARdS backend persistent storage.
     *
     * @param {string} key - Storage key to remove
     * @returns {Promise<boolean>} `true` on success, `false` on error / unavailable
     */
    async deleteStorage(key) {
        if (!this.available || !this._hass?.connection) return false;
        try {
            await this._hass.connection.sendMessagePromise({
                type: 'lcards/storage/delete',
                key,
            });
            return true;
        } catch (err) {
            lcardsLog.warn(`[IntegrationService] deleteStorage("${key}") failed:`, err);
            return false;
        }
    }

    /**
     * Wipe the entire LCARdS backend persistent storage.
     *
     * This is irreversible. All stored keys are removed and the store is saved
     * to disk in the empty state. Services should invalidate their in-memory
     * caches after calling this.
     *
     * @returns {Promise<boolean>} `true` on success, `false` on error / unavailable
     */
    async resetStorage() {
        if (!this.available || !this._hass?.connection) return false;
        try {
            await this._hass.connection.sendMessagePromise({
                type: 'lcards/storage/reset',
            });
            return true;
        } catch (err) {
            lcardsLog.warn('[IntegrationService] resetStorage() failed:', err);
            return false;
        }
    }

    // -----------------------------------------------------------------------
    // Python → JS push channel
    // -----------------------------------------------------------------------

    /**
     * Re-fetch the lcards/info response and update options, capabilities, and
     * storage key count in place — without repeating the full init flow.
     *
     * Call this after the user saves integration options (e.g. toggling
     * Enable Preview Features) so all UI that reads `this.options` picks up
     * the latest values without a full page reload.
     *
     * Also exposed as `window.lcards.refreshOptions()` for console use.
     *
     * @returns {Promise<void>}
     */
    async refreshOptions() {
        if (!this._hass?.connection) {
            lcardsLog.warn('[IntegrationService] refreshOptions: no connection available');
            return;
        }
        try {
            const result = await this._hass.connection.sendMessagePromise({ type: 'lcards/info' });
            this.options          = result?.options ?? null;
            this.capabilities     = new Set(Array.isArray(result?.capabilities) ? result.capabilities : []);
            this.storageKeyCount  = result?.storage_key_count ?? null;
            lcardsLog.debug('[IntegrationService] Options refreshed →', this.options);
        } catch (err) {
            lcardsLog.warn('[IntegrationService] refreshOptions() failed:', err);
        }
    }

    /**
     * Subscribe to `lcards_event` HA events fired by the Python backend.
     *
     * Called automatically after a successful `initialize()` probe.
     * Safe to call multiple times — subsequent calls are no-ops if already
     * subscribed.
     *
     * Handled actions:
     *   reload           — perform a full page reload
     *   set_log_level    — update JS log verbosity via window.lcards.setGlobalLogLevel
     *   set_alert_mode   — apply alert mode locally (used for targeted alerts only)
     *   trigger_effect   — fire a named screen effect via window.lcards.screenEffect.play()
     *
     * All actions support optional targeting via ``target_device_ids`` /
     * ``target_user_ids`` payload fields.  Events whose target lists do not
     * include this device or user are silently ignored.
     *
     * @private
     */
    _startEventListener() {
        if (!this._hass?.connection) return;
        if (this._eventUnsubscribe) return; // already subscribed

        // Use the custom lcards/subscribe WS command instead of the HA-native
        // subscribeEvents API. subscribeEvents for custom bus event types is
        // admin-only in HA; lcards/subscribe is registered by the Python
        // integration without that restriction, so all users (including
        // non-admin) receive push events such as reload and set_log_level.
        this._hass.connection
            .subscribeMessage(
                (msg) => this._handleLcardsEvent(msg),
                { type: 'lcards/subscribe' },
            )
            .then((unsub) => {
                this._eventUnsubscribe = unsub;
                lcardsLog.info('[IntegrationService] Subscribed to lcards_event push channel');
            })
            .catch((err) => {
                lcardsLog.warn('[IntegrationService] Failed to subscribe to lcards_event:', err);
            });
    }

    /**
     * Handle an incoming lcards_event from the HA backend.
     *
     * Payload is delivered directly by subscribeMessage (not wrapped in an
     * event envelope as it was with the legacy subscribeEvents path).
     *
     * @param {Object} data - Event data dict fired by the Python backend
     * @private
     */
    _handleLcardsEvent(data) {
        // With subscribeMessage the payload is delivered directly (not wrapped
        // in event.data as it was with subscribeEvents).
        const payload = data ?? {};
        lcardsLog.debug('[IntegrationService] Received lcards_event:', payload);

        // Silently drop events that carry a target list which does not include
        // this device or user (broadcast events carry no target list at all).
        if (!this._isEventTargetedAtMe(payload)) {
            lcardsLog.debug('[IntegrationService] Event not targeted at this device/user — ignoring');
            return;
        }

        switch (payload.action) {
            case 'reload':
                lcardsLog.info('[IntegrationService] Reload requested by backend — reloading page');
                window.location.reload();
                break;

            case 'set_log_level': {
                const level = payload.level;
                if (level && typeof window.lcards?.setGlobalLogLevel === 'function') {
                    lcardsLog.info(`[IntegrationService] Log level set by backend → ${level}`);
                    window.lcards.setGlobalLogLevel(level);
                }
                break;
            }

            case 'set_alert_mode':
                // Used for targeted (local-only) alert mode changes.
                // skipHelperSync: true prevents setAlertMode() from writing back
                // to input_select.lcards_alert_mode — that write-back would fire
                // the HelperManager subscription on ALL tabs, defeating targeting.
                // Sound is played directly by setAlertMode() when skipHelperSync
                // is set (falls through to the soundManager.playAlertSound path).
                if (payload.mode && typeof window.lcards?.setAlertMode === 'function') {
                    lcardsLog.info(`[IntegrationService] Alert mode targeted event → ${payload.mode}`);
                    window.lcards.setAlertMode(payload.mode, { skipHelperSync: true });
                }
                break;

            case 'clear_effect': {
                // Clear screen effects on this device.
                // payload.slot (optional) — clears only that slot, or all if omitted.
                const api = window.lcards?.screenEffect;
                if (api) {
                    if (payload.slot) {
                        lcardsLog.info(`[IntegrationService] Clearing screen effect slot '${payload.slot}' (backend request)`);
                        api.clearSlot(payload.slot);
                    } else {
                        lcardsLog.info('[IntegrationService] Clearing all screen effects (backend request)');
                        api.clear();
                    }
                } else {
                    lcardsLog.warn('[IntegrationService] clear_effect: screenEffect API unavailable');
                }
                break;
            }

            case 'trigger_effect': {
                // Fire screen effects on this device.
                //
                // New API (Option A): payload.layers — explicit per-slot config:
                //   { backdrop: { preset, ...params }, color: { preset, ...params }, canvas: { preset, ...params } }
                //   Absent slot = not touched. null value = clear that slot.
                //
                // Legacy API removed — only layers is accepted.
                //   payload.params.duration — auto-clear after N ms.
                //
                // Backward compat: both APIs can coexist; layers takes precedence when present.
                const sem = window.lcards?.core?.screenEffectManager;

                if (sem && payload.layers) {
                    lcardsLog.info('[IntegrationService] Screen effect (layers) triggered by backend');
                    sem.clearSlot('backdrop');
                    sem.clearSlot('color');
                    sem.clearSlot('canvas');
                    for (const [slot, layerCfg] of Object.entries(payload.layers)) {
                        if (layerCfg?.preset) {
                            const { preset, ...params } = layerCfg;
                            sem.applySlot(slot, preset, params);
                        }
                    }
                    if (payload.duration) {
                        setTimeout(() => { sem.clear(); }, payload.duration);
                    }
                } else {
                    lcardsLog.warn('[IntegrationService] trigger_effect: missing layers or screenEffectManager unavailable');
                }
                break;
            }

            case 'show_portal_card': {
                const pom = window.lcards?.core?.portalOverlayManager;
                if (pom && payload.content) {
                    lcardsLog.info('[IntegrationService] show_portal_card received — showing portal card');
                    pom.show('ha-service', {
                        content:  payload.content,
                        layers:   payload.layers   ?? null,
                        position: payload.position ?? 'center',
                        width:    payload.width    ?? 'auto',
                        height:   payload.height   ?? 'auto',
                        duration: payload.duration ?? null,
                        dismiss:  payload.dismiss  ?? true,
                    });
                } else {
                    lcardsLog.warn('[IntegrationService] show_portal_card: content required or portalOverlayManager unavailable');
                }
                break;
            }

            case 'clear_portal_card': {
                const pom = window.lcards?.core?.portalOverlayManager;
                pom?.hide('ha-service');
                lcardsLog.info('[IntegrationService] clear_portal_card received — hiding portal card');
                break;
            }

            case 'borg_assimilate': {
                const bam = window.lcards?.core?.borgAssimilationManager;
                if (bam) {
                    lcardsLog.info('[IntegrationService] borg_assimilate event — initiating assimilation');
                    const opts = {};
                    if (payload.intro_duration    != null) opts.duration         = payload.intro_duration;
                    if (payload.transition_style  != null) opts.transitionStyle  = payload.transition_style;
                    if (payload.intro_layers      != null) opts.intro            = payload.intro_layers;
                    if (payload.persistent_layers != null) opts.persistentLayers = payload.persistent_layers;
                    bam.assimilate(opts);
                } else {
                    lcardsLog.warn('[IntegrationService] borg_assimilate: BorgAssimilationManager unavailable');
                }
                break;
            }

            case 'borg_deassimilate': {
                const bam = window.lcards?.core?.borgAssimilationManager;
                if (bam) {
                    lcardsLog.info('[IntegrationService] borg_deassimilate event — reverting assimilation');
                    const opts = {};
                    if (payload.with_outro              != null) opts.withOutro             = payload.with_outro;
                    if (payload.outro_layers            != null) opts.outroLayers           = payload.outro_layers;
                    if (payload.revert_transition_style != null) opts.revertTransitionStyle = payload.revert_transition_style;
                    bam.deassimilate(opts);
                } else {
                    lcardsLog.warn('[IntegrationService] borg_deassimilate: BorgAssimilationManager unavailable');
                }
                break;
            }

            default:
                lcardsLog.debug('[IntegrationService] Unknown lcards_event action:', payload.action);
        }
    }

    /**
     * Determine whether this browser session is a target of the given event.
     *
     * Returns ``true`` (accept the event) when:
     *   - Neither ``target_device_ids`` nor ``target_user_ids`` is present
     *     in the payload (broadcast — no filtering applied).
     *   - ``target_device_ids`` is present and contains this device's UUID.
     *   - ``target_user_ids`` is present and contains the current HA user ID.
     *
     * Union semantics: the event is accepted if this session matches EITHER
     * target list when both are present.
     *
     * @param {Object} payload - The lcards_event data dict
     * @returns {boolean}
     * @private
     */
    _isEventTargetedAtMe(payload) {
        const deviceIds = payload.target_device_ids;
        const userIds   = payload.target_user_ids;

        // No targeting fields present → broadcast, always accept
        const hasDeviceTarget = Array.isArray(deviceIds) && deviceIds.length > 0;
        const hasUserTarget   = Array.isArray(userIds)   && userIds.length   > 0;
        if (!hasDeviceTarget && !hasUserTarget) return true;

        // Check device match
        if (hasDeviceTarget) {
            const myDeviceId = window.lcards?.core?.deviceIdentityManager?.getDeviceId();
            if (myDeviceId && deviceIds.includes(myDeviceId)) return true;
        }

        // Check user match — try the service's own _hass first, then the
        // core's shared reference as a fallback (both should be identical but
        // the fallback handles edge-cases where updateHass() hasn't fired yet).
        if (hasUserTarget) {
            const myUserId = this._hass?.user?.id
                          || window.lcards?.core?._currentHass?.user?.id;
            if (myUserId && userIds.includes(myUserId)) return true;
        }

        return false;
    }}
