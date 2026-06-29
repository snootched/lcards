/**
 * @fileoverview ConnectionOverlayService — Disconnection detection and overlay display
 *
 * A core singleton service that monitors the HA WebSocket connection state and
 * displays a full-screen overlay via the ScreenEffectManager portal whenever
 * the frontend loses contact with the HA server.
 *
 * ## Detection strategy
 *
 * Two complementary signals are used:
 *
 * 1. **`hass.connection` WebSocket events** — `home-assistant-js-websocket`
 *    fires `'disconnected'` on close and `'ready'` on (re)connect on the
 *    `Connection` object.  Note: the library has no `'reconnected'` event — the
 *    correct reconnect signal is `'ready'`, which fires after auth completes on
 *    both the initial connection and every subsequent reconnect.  These fire
 *    immediately on graceful disconnects and after TCP timeout on hard network
 *    cuts — with no false positives from idle dashboards (no state changes → no
 *    hass updates is normal and must NOT be treated as disconnection).
 *
 * 2. **`hass.connected` flag** — belt-and-suspenders for the pre-subscription
 *    window only.  Once WS events are subscribed they are authoritative.
 *    Stale `hass` objects can carry `connected: true` after a real disconnect
 *    (the hass object is captured before the WS close event fires), which would
 *    cause a false `_onReconnected()` call if the flag were used unconditionally.
 *
 * ## Config resolution order (first non-null wins)
 *
 * 1. Device-scoped setting  (e.g. kiosk A shows different message to kiosk B)
 * 2. User-scoped setting
 * 3. Global setting
 * 4. Built-in defaults
 *
 * ## Portal injection
 *
 * The overlay is managed via `PortalOverlayManager` under the named slot
 * `'connection-overlay'`.  POM injects content into the ScreenEffectManager's
 * shared `position:fixed` portal div (`z-index:9100`, appended to
 * `document.body`).  This makes it visible on any page the module is loaded —
 * no card placement required.
 *
 * ## Alert overlay co-existence
 *
 * Both overlays use `PortalOverlayManager` with independent named slots.  They
 * stack freely — there is no suppression logic.  The connection overlay renders
 * on top when both are active (last `appendChild` wins at equal z-index).  SEM
 * effect slots are last-in-wins; the connection overlay's `layers` config will
 * evict the alert overlay's SEM effects if both are active simultaneously.
 *
 * @module core/services/ConnectionOverlayService
 */

import { lcardsLog } from '../../utils/lcards-logging.js';
import { BaseService } from '../BaseService.js';
import {
    CONN_OVERLAY_ENABLED,
    CONN_OVERLAY_DISMISS,
    CONN_OVERLAY_POSITION,
    CONN_OVERLAY_WIDTH,
    CONN_OVERLAY_HEIGHT,
    CONN_OVERLAY_CONTENT,
    CONN_OVERLAY_SEM,
    CONN_OVERLAY_MSG_MODE,
    CONN_OVERLAY_MSG_TEXT,
    CONN_OVERLAY_MSG_COLOR,
    CONN_OVERLAY_MSG_FONT,
    CONN_OVERLAY_MSG_SIZE,
    CONN_OVERLAY_MSG_WEIGHT,
    CONN_OVERLAY_MSG_TRANSFORM,
    CONN_OVERLAY_RECON_ENABLED,
    CONN_OVERLAY_RECON_TEXT,
    CONN_OVERLAY_RECON_COLOR,
    CONN_OVERLAY_RECON_DISMISS_SECS,
    CONN_OVERLAY_RECON_FONT,
    CONN_OVERLAY_RECON_SIZE,
    CONN_OVERLAY_RECON_WEIGHT,
    CONN_OVERLAY_RECON_TRANSFORM,
    CONN_OVERLAY_RECON_CONTENT,
    CONN_OVERLAY_BORG_SEM,
    CONN_OVERLAY_DISCONNECT_DELAY,
    CONN_OVERLAY_ALL_KEYS,
} from './ScopedSettingsConstants.js';

// ---------------------------------------------------------------------------
// Built-in defaults
// ---------------------------------------------------------------------------

const DEFAULT_CONFIG = {
    /** Overlay is opt-in — must be explicitly enabled per scope. */
    enabled: false,
    /** Allow the user to dismiss the overlay (it will reappear on the next disconnect). */
    dismiss: true,
    /** Where to anchor the content card within the overlay. */
    position: 'center',
    /** Explicit CSS width for the content container ('auto' = size to content). */
    width: 'auto',
    /** Explicit CSS height for the content container ('auto' = size to content). */
    height: 'auto',
    /**
     * Milliseconds to wait after a disconnect event before showing the overlay.
     * 0 = show immediately (legacy behaviour).
     * Use 2000–5000 on mobile or unstable connections to absorb brief blips.
     */
    disconnect_delay_ms: 2500,
    /**
     * Message config for the disconnect text overlay (used when mode = 'text').
     * `mode` also controls whether a custom card is shown instead.
     */
    message: {
        text:      'Connection Lost',
        color:     '#93e1ff',
        mode:      'text',      // 'text' | 'card'
        font:      'Antonio',   // font key from the lcards font registry
        size:      26,
        weight:    '400',
        transform: 'uppercase',
    },
    /** Optional brief confirmation overlay shown after the connection is re-established. */
    reconnected: {
        enabled:              true,
        text:                 'Connection Established',
        color:                'var(--primary-color)',
        auto_dismiss_seconds: 3,
        font:      'Antonio',
        size:      32,
        weight:    '400',
        transform: 'uppercase',
        /** Optional HA card shown in card mode instead of the text reconnect message. */
        content:   null,
    },
    /** Per-slot SEM layer config — mirrors the alert-overlay `layers` schema. */
    layers: {
        backdrop: null,
        color: { preset: 'color-tint', color: 'rgba(0,0,0,0.55)' },
        canvas: { preset: 'static', intensity: 0.45 },
    },
    /**
     * Optional HA card config to display in the overlay when mode = 'card'.
     * When null the message element is rendered.
     */
    content: null,
};

// ---------------------------------------------------------------------------
// ConnectionOverlayService
// ---------------------------------------------------------------------------

export class ConnectionOverlayService extends BaseService {

    constructor() {
        super();

        // ── Connection state ──────────────────────────────────────────────
        /** Current tracked connection state. */
        this._isConnected = true;  // optimistic
        /** The `hass.connection` object we are currently subscribed to. */
        this._subscribedConnection = null;
        /** Bound handler refs (needed for removeEventListener). */
        this._handleConnDisconnected = null;
        this._handleConnReconnected  = null;

        // ── Overlay state ─────────────────────────────────────────────────
        /**
         * True when a disconnect event has been received and not yet cleared
         * by a reconnect.  Distinct from _isActive: this is set as soon as the
         * disconnect fires; _isActive is only set once the overlay is actually
         * rendered (which may be delayed by disconnect_delay_ms).
         */
        this._isDisconnected = false;
        /** True when the disconnect overlay is actively shown. */
        this._isActive = false;
        /** True when the "connection restored" confirmation banner is shown. */
        this._isReconnectedActive = false;
        /** True if the user has dismissed the overlay for this disconnection event. */
        this._isDismissed = false;
        /** Timer handle for auto-dismissing the reconnected confirmation banner. */
        this._reconnectedTimer = null;
        /**
         * Short stabilization timer: delays clearing the disconnect overlay after a
         * 'ready' event so that rapid disconnect/ready cycles during HA server restart
         * don't cause visible flicker (overlay briefly disappears then reappears).
         */
        this._reconnectDebounceTimer = null;
        /**
         * Tolerance timer: delays showing the overlay after a disconnect event by
         * `disconnect_delay_ms` ms.  Cancelled if the connection is restored within
         * the window, so brief blips (mobile WiFi handoff, app backgrounding, HA
         * restart transients) do not trigger the overlay.
         */
        this._disconnectDelayTimer = null;

        // ── Config load state ─────────────────────────────────────────────
        /**
         * True after initialize() has completed loading config from scoped settings.
         * Disconnect events received before this point are queued in _pendingDisconnect
         * and replayed once the real enabled/disabled preference is known.
         */
        this._configLoaded = false;
        /** Whether a disconnect arrived before _configLoaded was set. */
        this._pendingDisconnect = false;

        // ── HASS ──────────────────────────────────────────────────────────
        this._hass = null;

        // ── Config ────────────────────────────────────────────────────────
        this._config = { ...DEFAULT_CONFIG };
        // Remove the localStorage cache key introduced in earlier builds.
        // It is no longer used and can cause stale-config confusion on cache wipe.
        try { localStorage.removeItem('lcards_connection_overlay_config'); } catch (_) {}
        /** Config saved before a showWith() preview call; restored on hide(). */
        this._previewConfig = null;

        lcardsLog.debug('[ConnectionOverlayService] Created (config seeded from defaults)');
    }

    // -------------------------------------------------------------------------
    // BaseService lifecycle
    // -------------------------------------------------------------------------

    updateHass(hass) {
        if (!hass) return;

        const wasConnected = this._isConnected;
        const nowConnected = !!hass.connected;

        this._hass = hass;

        // Subscribe to WebSocket connection events whenever we see a new
        // connection object.  This is the primary disconnect-detection signal —
        // it fires immediately on WS close regardless of dashboard activity.
        if (hass.connection && hass.connection !== this._subscribedConnection) {
            this._subscribeConnectionEvents(hass.connection);
        }

        // ── Belt-and-suspenders: hass.connected flag ──────────────────────
        // Only used before WS events are subscribed.  Once the WS subscription
        // is active, hass.connected is NOT used to trigger overlay transitions —
        // stale hass objects (captured before a disconnect) carry connected:true
        // after a real disconnect, which would cause a spurious _onReconnected().
        if (!this._subscribedConnection) {
            if (!nowConnected && wasConnected) {
                lcardsLog.info('[ConnectionOverlayService] hass.connected → false (pre-subscription) — triggering overlay');
                this._isConnected = false;
                this._onDisconnected();
            } else if (nowConnected && !wasConnected) {
                lcardsLog.info('[ConnectionOverlayService] hass.connected → true (pre-subscription) — clearing overlay');
                this._isConnected = true;
                this._onReconnected();
            } else {
                this._isConnected = nowConnected;
            }
        } else {
            // WS events are authoritative; just track the flag for state reference.
            this._isConnected = nowConnected;
        }
    }

    // -------------------------------------------------------------------------
    // Public API
    // -------------------------------------------------------------------------

    /**
     * Initialise after the integration service is ready.
     * Loads config from scoped settings and refreshes the localStorage cache.
     * Intentionally fire-and-forget — never throws.
     */
    async initialize() {
        try {
            const loaded = await this.loadConfig();
            lcardsLog.debug('[ConnectionOverlayService] Config loaded from scoped settings:', loaded);
        } catch (err) {
            lcardsLog.warn('[ConnectionOverlayService] Config load failed — using default config:', err);
        } finally {
            this._configLoaded = true;
            // Replay any disconnect that arrived before settings were loaded.
            // Only apply it if the connection is still down (may have recovered
            // in the window between the event and initialize() completing).
            if (this._pendingDisconnect && !this._isConnected) {
                this._pendingDisconnect = false;
                this._onDisconnected();
            } else {
                this._pendingDisconnect = false;
            }
        }
    }

    /**
     * Load config from the ScopedSettings waterfall (device → user → global).
     * Applies the resolved result to `_config`.
     *
     * @returns {Promise<Object>} The resolved config (merged with defaults).
     */
    async loadConfig() {
        const sss = window.lcards?.core?.scopedSettingsService;
        if (!sss) {
            lcardsLog.debug('[ConnectionOverlayService] ScopedSettingsService unavailable — using current config');
            return this._config;
        }

        // Read each flat key through the device → user → global waterfall independently.
        // This means a device-scoped colour does NOT clobber a global-scoped text value.
        const D = DEFAULT_CONFIG;
        const SCOPES = ['device', 'user', 'global'];
        const [
            enabled, dismiss, position, width, height, content, sem,
            msgMode, msgText, msgColor, msgFont, msgSize, msgWeight, msgTransform,
            reconEnabled, reconText, reconColor, reconDismissSecs, reconFont, reconSize,
            reconWeight, reconTransform, reconContent,
            borgSem,
            disconnectDelay,
        ] = await Promise.all([
            sss.read(CONN_OVERLAY_ENABLED,            SCOPES, () => D.enabled),
            sss.read(CONN_OVERLAY_DISMISS,             SCOPES, () => D.dismiss),
            sss.read(CONN_OVERLAY_POSITION,            SCOPES, () => D.position),
            sss.read(CONN_OVERLAY_WIDTH,               SCOPES, () => D.width),
            sss.read(CONN_OVERLAY_HEIGHT,              SCOPES, () => D.height),
            sss.read(CONN_OVERLAY_CONTENT,             SCOPES, () => D.content),
            sss.read(CONN_OVERLAY_SEM,                 SCOPES, () => D.layers),
            sss.read(CONN_OVERLAY_MSG_MODE,            SCOPES, () => D.message.mode),
            sss.read(CONN_OVERLAY_MSG_TEXT,            SCOPES, () => D.message.text),
            sss.read(CONN_OVERLAY_MSG_COLOR,           SCOPES, () => D.message.color),
            sss.read(CONN_OVERLAY_MSG_FONT,            SCOPES, () => D.message.font),
            sss.read(CONN_OVERLAY_MSG_SIZE,            SCOPES, () => D.message.size),
            sss.read(CONN_OVERLAY_MSG_WEIGHT,          SCOPES, () => D.message.weight),
            sss.read(CONN_OVERLAY_MSG_TRANSFORM,       SCOPES, () => D.message.transform),
            sss.read(CONN_OVERLAY_RECON_ENABLED,       SCOPES, () => D.reconnected.enabled),
            sss.read(CONN_OVERLAY_RECON_TEXT,          SCOPES, () => D.reconnected.text),
            sss.read(CONN_OVERLAY_RECON_COLOR,         SCOPES, () => D.reconnected.color),
            sss.read(CONN_OVERLAY_RECON_DISMISS_SECS,  SCOPES, () => D.reconnected.auto_dismiss_seconds),
            sss.read(CONN_OVERLAY_RECON_FONT,          SCOPES, () => D.reconnected.font),
            sss.read(CONN_OVERLAY_RECON_SIZE,          SCOPES, () => D.reconnected.size),
            sss.read(CONN_OVERLAY_RECON_WEIGHT,        SCOPES, () => D.reconnected.weight),
            sss.read(CONN_OVERLAY_RECON_TRANSFORM,     SCOPES, () => D.reconnected.transform),
            sss.read(CONN_OVERLAY_RECON_CONTENT,       SCOPES, () => D.reconnected.content),
            sss.read(CONN_OVERLAY_BORG_SEM,             SCOPES, () => null),
            sss.read(CONN_OVERLAY_DISCONNECT_DELAY,    SCOPES, () => D.disconnect_delay_ms),
        ]);

        // Priority: storage value → existing in-memory value → built-in default.
        // Fall back to the existing in-memory value when a WS read returns null.
        // This means a connection error during reads does NOT clobber a previously
        // loaded setting (e.g. one loaded from the optimistic update in saveConfig).
        const C = this._config;
        const resolved = {
            enabled:            enabled            ?? C.enabled            ?? D.enabled,
            dismiss:            dismiss            ?? C.dismiss            ?? D.dismiss,
            position:           position           ?? C.position           ?? D.position,
            width:              width              ?? C.width              ?? D.width,
            height:             height             ?? C.height             ?? D.height,
            content:            content            ?? C.content            ?? D.content,
            layers:             sem                ?? C.layers             ?? D.layers,
            disconnect_delay_ms: disconnectDelay   ?? C.disconnect_delay_ms ?? D.disconnect_delay_ms,
            message: {
                mode:       msgMode      ?? C.message?.mode      ?? D.message.mode,
                text:       msgText      ?? C.message?.text      ?? D.message.text,
                color:      msgColor     ?? C.message?.color     ?? D.message.color,
                font:       msgFont      ?? C.message?.font      ?? D.message.font,
                size:       msgSize      ?? C.message?.size      ?? D.message.size,
                weight:     msgWeight    ?? C.message?.weight    ?? D.message.weight,
                transform:  msgTransform ?? C.message?.transform ?? D.message.transform,
                borgLayers: borgSem      ?? C.message?.borgLayers ?? null,
            },
            reconnected: {
                enabled:              reconEnabled     ?? C.reconnected?.enabled              ?? D.reconnected.enabled,
                text:                 reconText        ?? C.reconnected?.text                 ?? D.reconnected.text,
                color:                reconColor       ?? C.reconnected?.color                ?? D.reconnected.color,
                auto_dismiss_seconds: reconDismissSecs ?? C.reconnected?.auto_dismiss_seconds ?? D.reconnected.auto_dismiss_seconds,
                font:                 reconFont        ?? C.reconnected?.font                 ?? D.reconnected.font,
                size:                 reconSize        ?? C.reconnected?.size                 ?? D.reconnected.size,
                weight:               reconWeight      ?? C.reconnected?.weight               ?? D.reconnected.weight,
                transform:            reconTransform   ?? C.reconnected?.transform            ?? D.reconnected.transform,
                content:              reconContent     ?? C.reconnected?.content              ?? D.reconnected.content,
            },
        };

        this._config = resolved;

        // Re-render immediately if the overlay is currently visible so remote-broadcast
        // config updates (font, colour, etc.) take effect without a page reload.
        if (this._isActive && window.lcards?.core?.portalOverlayManager?.has('connection-overlay')) {
            this._showDisconnectOverlay();
        }

        return this._config;
    }

    /**
     * Save config to the specified scope.
     *
     * @param {Object} config   - Partial or full config object.
     * @param {'device'|'user'|'global'} [scope='global']
     * @returns {Promise<void>}
     */
    async saveConfig(config, scope = 'global', opts = {}) {
        const sss = window.lcards?.core?.scopedSettingsService;
        if (!sss) {
            lcardsLog.warn('[ConnectionOverlayService] ScopedSettingsService unavailable — config not saved');
            return;
        }

        lcardsLog.info('[ConnectionOverlayService] saveConfig start', { scope, opts, enabled: config.enabled });

        // Map the nested config shape to individual flat keys and write each one.
        // Only keys present in the config object are written — callers may pass a
        // full config or a sparse subset.
        const writes = [];
        if ('enabled'             in config) writes.push(sss.write(CONN_OVERLAY_ENABLED,          config.enabled,             scope, opts));
        if ('dismiss'             in config) writes.push(sss.write(CONN_OVERLAY_DISMISS,          config.dismiss,             scope, opts));
        if ('position'            in config) writes.push(sss.write(CONN_OVERLAY_POSITION,         config.position,            scope, opts));
        if ('width'               in config) writes.push(sss.write(CONN_OVERLAY_WIDTH,            config.width,               scope, opts));
        if ('height'              in config) writes.push(sss.write(CONN_OVERLAY_HEIGHT,           config.height,              scope, opts));
        if ('content'             in config) writes.push(sss.write(CONN_OVERLAY_CONTENT,          config.content,             scope, opts));
        if ('layers'              in config) writes.push(sss.write(CONN_OVERLAY_SEM,              config.layers,              scope, opts));
        if ('disconnect_delay_ms' in config) writes.push(sss.write(CONN_OVERLAY_DISCONNECT_DELAY, config.disconnect_delay_ms, scope, opts));

        const msg = config.message ?? {};
        if ('mode'      in msg) writes.push(sss.write(CONN_OVERLAY_MSG_MODE,      msg.mode,      scope, opts));
        if ('text'      in msg) writes.push(sss.write(CONN_OVERLAY_MSG_TEXT,      msg.text,      scope, opts));
        if ('color'     in msg) writes.push(sss.write(CONN_OVERLAY_MSG_COLOR,     msg.color,     scope, opts));
        if ('font'      in msg) writes.push(sss.write(CONN_OVERLAY_MSG_FONT,      msg.font,      scope, opts));
        if ('size'      in msg) writes.push(sss.write(CONN_OVERLAY_MSG_SIZE,      msg.size,      scope, opts));
        if ('weight'    in msg) writes.push(sss.write(CONN_OVERLAY_MSG_WEIGHT,    msg.weight,    scope, opts));
        if ('transform' in msg) writes.push(sss.write(CONN_OVERLAY_MSG_TRANSFORM, msg.transform, scope, opts));

        if ('borgLayers' in msg) writes.push(sss.write(CONN_OVERLAY_BORG_SEM, msg.borgLayers, scope, opts));

        const rec = config.reconnected ?? {};
        if ('enabled'              in rec) writes.push(sss.write(CONN_OVERLAY_RECON_ENABLED,      rec.enabled,              scope, opts));
        if ('text'                 in rec) writes.push(sss.write(CONN_OVERLAY_RECON_TEXT,          rec.text,                 scope, opts));
        if ('color'                in rec) writes.push(sss.write(CONN_OVERLAY_RECON_COLOR,         rec.color,                scope, opts));
        if ('auto_dismiss_seconds' in rec) writes.push(sss.write(CONN_OVERLAY_RECON_DISMISS_SECS,  rec.auto_dismiss_seconds, scope, opts));
        if ('font'                 in rec) writes.push(sss.write(CONN_OVERLAY_RECON_FONT,          rec.font,                 scope, opts));
        if ('size'                 in rec) writes.push(sss.write(CONN_OVERLAY_RECON_SIZE,          rec.size,                 scope, opts));
        if ('weight'               in rec) writes.push(sss.write(CONN_OVERLAY_RECON_WEIGHT,        rec.weight,               scope, opts));
        if ('transform'            in rec) writes.push(sss.write(CONN_OVERLAY_RECON_TRANSFORM,     rec.transform,            scope, opts));
        if ('content'              in rec) writes.push(sss.write(CONN_OVERLAY_RECON_CONTENT,       rec.content,              scope, opts));

        await Promise.all(writes);

        // Optimistically patch this._config with the just-saved values so that
        // _onDisconnected() sees the correct flags (e.g. enabled=true) even if the
        // subsequent loadConfig() WS reads fail because HA restarted immediately
        // after the save.  loadConfig() overwrites this on success.
        {
            const c = config;
            const cur = this._config;
            const patched = { ...cur };
            if ('enabled'             in c) patched.enabled             = c.enabled;
            if ('dismiss'             in c) patched.dismiss             = c.dismiss;
            if ('position'            in c) patched.position            = c.position;
            if ('width'               in c) patched.width               = c.width;
            if ('height'              in c) patched.height              = c.height;
            if ('disconnect_delay_ms' in c) patched.disconnect_delay_ms = c.disconnect_delay_ms;
            if ('content'             in c) patched.content             = c.content;
            if ('layers'              in c) patched.layers              = c.layers;
            if ('message'             in c) patched.message             = { ...cur.message,    ...c.message };
            if ('reconnected'         in c) patched.reconnected         = { ...cur.reconnected, ...c.reconnected };
            this._config = patched;
        }

        // Notify other browsers to reload their connection overlay config.
        // Own-device saves are excluded — loadConfig() below handles those locally.
        // Own-user saves target the current user so other devices they're logged into also refresh.
        const isRemoteDevice = !!opts.targetDeviceId;
        const isRemoteUser   = !!opts.targetUserId;
        const isGlobal       = scope === 'global';
        const isOwnUser      = scope === 'user' && !opts.targetUserId;
        if ((isRemoteDevice || isRemoteUser || isGlobal || isOwnUser) && this._hass?.connection) {
            const firePayload = { type: 'lcards/fire_event', action: 'reload_connection_config' };
            if (isRemoteDevice) firePayload.target_device_ids = [opts.targetDeviceId];
            if (isRemoteUser)   firePayload.target_user_ids   = [opts.targetUserId];
            if (isOwnUser)      firePayload.target_user_ids   = [this._hass.user?.id].filter(Boolean);
            // isGlobal → no targeting keys → broadcasts to all connected browsers
            this._hass.connection.sendMessagePromise(firePayload).catch((err) => {
                lcardsLog.debug('[ConnectionOverlayService] broadcast reload_connection_config failed (non-fatal):', err);
            });
        }

        // Re-read the full waterfall to get the resolved effective config.
        // loadConfig() also re-renders the overlay if it's currently visible.
        await this.loadConfig();

        // A showWith() preview may have saved a stale _previewConfig before this save.
        // Clear it now so hide() does not restore old values over the newly persisted ones.
        this._previewConfig = null;

        lcardsLog.info(`[ConnectionOverlayService] Config saved to scope "${scope}"`);
    }

    /**
     * Delete config from the specified scope (falls back to next tier on next read).
     *
     * @param {'device'|'user'|'global'} [scope='global']
     * @returns {Promise<void>}
     */
    async clearConfig(scope = 'global', opts = {}) {
        const sss = window.lcards?.core?.scopedSettingsService;
        if (!sss) return;

        // Clear all flat keys from the given scope in parallel.
        await Promise.all(CONN_OVERLAY_ALL_KEYS.map(k => sss.clear(k, scope, opts)));
        await this.loadConfig();
        lcardsLog.info(`[ConnectionOverlayService] Config cleared from scope "${scope}"`);
    }

    /**
     * Read the current effective config (already resolved waterfall).
     * @returns {Object}
     */
    getConfig() {
        return { ...this._config };
    }

    /**
     * Force-show the overlay regardless of connection state.
     * Useful for "Test Disconnect" in the Config Panel.
     */
    show() {
        lcardsLog.debug('[ConnectionOverlayService] show() called (forced)');
        this._clearReconnectedTimer();
        this._clearDisconnectDelayTimer();
        this._isReconnectedActive = false;
        this._isDismissed         = false;
        this._isDisconnected      = true;   // treat as disconnected for state consistency
        this._isActive            = true;
        this._showDisconnectOverlay();
    }

    /**
     * Show the overlay using a temporary preview config (not persisted to storage).
     * The original config is restored when hide() is called.
     * Useful for live-preview of panel edits without requiring a save first.
     * @param {Object} previewConfig
     */
    showWith(previewConfig) {
        lcardsLog.debug('[ConnectionOverlayService] showWith() called (preview)');
        if (!this._previewConfig) {
            // Only save on first showWith() so repeated calls don't lose the original.
            this._previewConfig = this._config;
        }
        this._applyPartialConfig(previewConfig);
        this.show();
    }

    /**
     * Force-hide the overlay.
     * Useful for "Clear Test" in the Config Panel.
     */
    hide() {
        lcardsLog.debug('[ConnectionOverlayService] hide() called (forced)');
        this._clearReconnectedTimer();
        this._clearDisconnectDelayTimer();
        this._isReconnectedActive = false;
        this._isDisconnected      = false;
        this._isActive            = false;
        this._isDismissed         = false;
        window.lcards?.core?.portalOverlayManager?.hide('connection-overlay');
        // Restore config that was active before any showWith() preview.
        if (this._previewConfig) {
            this._config       = this._previewConfig;
            this._previewConfig = null;
            lcardsLog.debug('[ConnectionOverlayService] Preview config cleared; original config restored.');
        }
    }

    /**
     * Simulate the reconnection sequence for live preview.
     * Can be called standalone or after a showWith() test-disconnect.
     * If `previewConfig` is supplied, it is applied as the active preview config
     * before running the sequence (the same way showWith() works for the disconnect test).
     * Fires `lcards-connection-overlay-dismissed` so the UI can reset test-state buttons.
     * @param {Object|null} [previewConfig]
     */
    simulateReconnect(previewConfig = null) {
        lcardsLog.debug('[ConnectionOverlayService] simulateReconnect() called (preview)');
        this._clearReconnectedTimer();
        this._clearDisconnectDelayTimer();
        this._isDisconnected = false;
        this._isActive       = false;
        this._isDismissed    = false;

        // Apply the supplied preview config (if any), preserving the original for cleanup.
        if (previewConfig) {
            if (!this._previewConfig) {
                this._previewConfig = this._config;
            }
            this._applyPartialConfig(previewConfig);
        }

        const pom = window.lcards?.core?.portalOverlayManager;
        const cfg = this._config;

        const cleanup = () => {
            if (this._previewConfig) {
                this._config       = this._previewConfig;
                this._previewConfig = null;
                lcardsLog.debug('[ConnectionOverlayService] Preview config cleared; original config restored.');
            }
            document.dispatchEvent(new CustomEvent('lcards-connection-overlay-dismissed', { bubbles: false }));
        };

        if (cfg.reconnected?.enabled) {
            this._isReconnectedActive = true;
            const recon        = cfg.reconnected;
            const reconContent = (cfg.message?.mode === 'card' && recon?.content) ? recon.content : null;
            const reconText    = reconContent ? null : recon;
            pom?.show('connection-overlay', {
                position:  cfg.position ?? 'center',
                width:     cfg.width    ?? 'auto',
                height:    cfg.height   ?? 'auto',
                dismiss:   false,
                onDismiss: null,
                content:   reconContent,
                text:      reconText,
                layers:    cfg.layers,
            });
            const seconds = recon.auto_dismiss_seconds ?? 3;
            this._reconnectedTimer = setTimeout(() => {
                this._reconnectedTimer    = null;
                this._isReconnectedActive = false;
                pom?.hide('connection-overlay');
                cleanup();
            }, seconds * 1000);
        } else {
            pom?.hide('connection-overlay');
            cleanup();
        }
    }

    /**
     * Destroy the service: unsubscribe connection events, tear down portal.
     */
    destroy() {
        this._clearDisconnectDelayTimer();
        if (this._reconnectDebounceTimer !== null) {
            clearTimeout(this._reconnectDebounceTimer);
            this._reconnectDebounceTimer = null;
        }
        this._clearReconnectedTimer();
        this._unsubscribeConnectionEvents();
        window.lcards?.core?.portalOverlayManager?.hide('connection-overlay');
        lcardsLog.debug('[ConnectionOverlayService] Destroyed');
    }

    // -------------------------------------------------------------------------
    // Connection event handlers
    // -------------------------------------------------------------------------

    _onDisconnected() {
        // Cancel any pending reconnect debounce — a new disconnect voids it.
        if (this._reconnectDebounceTimer !== null) {
            clearTimeout(this._reconnectDebounceTimer);
            this._reconnectDebounceTimer = null;
        }
        // Cancel any in-progress "reconnected" banner before showing the disconnect overlay.
        this._clearReconnectedTimer();
        this._isReconnectedActive = false;

        // Queue the disconnect if scoped settings haven't loaded yet.
        // The real enabled/disabled preference isn't known until initialize() completes.
        if (!this._configLoaded) {
            this._pendingDisconnect = true;
            lcardsLog.debug('[ConnectionOverlayService] Config not yet loaded — queuing disconnect');
            return;
        }

        if (!this._config.enabled) return;

        // Deduplicate: if we're already processing a disconnect, ignore duplicates
        // (both WS events and hass.connected transitions can fire for the same event).
        if (this._isDisconnected) return;

        this._isDisconnected = true;
        this._isDismissed    = false;

        // Borg mode: assimilation replaces the standard overlay — no tolerance delay.
        if (this._config.message?.mode === 'borg') {
            lcardsLog.info('[ConnectionOverlayService] Connection lost — activating Borg assimilation');
            this._isActive = true;
            const borgLayers = this._config.message?.borgLayers ?? null;
            const { paletteHue = null, ...introLayers } = borgLayers ?? {};
            const borgOpts = {
                ...(Object.keys(introLayers).length ? { intro: introLayers } : {}),
                ...(paletteHue != null ? { paletteHue } : {}),
            };
            window.lcards?.core?.borgAssimilationManager?.assimilate(borgOpts);
            return;
        }

        const delayMs = this._config.disconnect_delay_ms ?? 0;
        if (delayMs > 0) {
            lcardsLog.info(`[ConnectionOverlayService] Connection lost — ${delayMs}ms tolerance before overlay`);
            this._disconnectDelayTimer = setTimeout(() => {
                this._disconnectDelayTimer = null;
                // If the connection was restored during the delay, do nothing.
                if (!this._isDisconnected) return;
                lcardsLog.info('[ConnectionOverlayService] Disconnect tolerance expired — activating overlay');
                this._isActive = true;
                this._showDisconnectOverlay();
            }, delayMs);
        } else {
            lcardsLog.info('[ConnectionOverlayService] Connection lost — activating overlay');
            this._isActive = true;
            this._showDisconnectOverlay();
        }
    }

    _onReconnected() {
        // Debounce: wait 1 s before actually clearing the overlay.  During an HA
        // server restart the socket may open briefly ('ready') and then close again
        // ('disconnected') several times before HA is stable.  The debounce keeps
        // the overlay visible through those transient reconnects and only clears it
        // once the connection holds for at least 1 second.
        if (this._reconnectDebounceTimer !== null) {
            clearTimeout(this._reconnectDebounceTimer);
        }
        this._reconnectDebounceTimer = setTimeout(() => {
            this._reconnectDebounceTimer = null;
            this._doReconnected();
        }, 1000);
    }

    _doReconnected() {
        this._clearReconnectedTimer();
        // Cancel any pending disconnect-delay show — if we reconnected before the
        // tolerance window expired, the overlay should never appear.
        this._clearDisconnectDelayTimer();

        lcardsLog.info('[ConnectionOverlayService] Connection restored — clearing disconnect overlay');

        const wasActive      = this._isActive;
        this._isDisconnected = false;
        this._isActive       = false;
        this._isDismissed    = false;

        // Borg mode: deassimilation replaces the standard reconnect overlay.
        if (this._config.message?.mode === 'borg') {
            const borgMgr = window.lcards?.core?.borgAssimilationManager;
            if (borgMgr?.isAssimilated) {
                lcardsLog.info('[ConnectionOverlayService] Connection restored — deassimilating');
                borgMgr.deassimilate();
            }
            return;
        }

        const pom = window.lcards?.core?.portalOverlayManager;
        // Only show the reconnected banner if the disconnect overlay was actually
        // rendered.  If disconnect_delay_ms suppressed the show, the user never saw
        // the overlay, so skip the banner too.
        if (wasActive && this._config.reconnected?.enabled) {
            this._isReconnectedActive = true;

            const cfg   = this._config;
            const recon = cfg.reconnected;
            // Card mode: show card if message mode is 'card' and a reconnected card is configured.
            // Text mode: pass the reconnected config as the text fallback.
            const reconContent = (cfg.message?.mode === 'card' && recon?.content) ? recon.content : null;
            const reconText    = reconContent ? null : recon;

            pom?.show('connection-overlay', {
                position:  cfg.position ?? 'center',
                width:     cfg.width    ?? 'auto',
                height:    cfg.height   ?? 'auto',
                dismiss:   false,
                onDismiss: null,
                content:   reconContent,
                text:      reconText,
                layers:    cfg.layers,
            });

            this._startReconnectedTimer();
        } else {
            this._isReconnectedActive = false;
            pom?.hide('connection-overlay');
        }

        // Refresh config from storage after every reconnect.  This picks up any
        // changes that were saved just before HA restarted (when the post-save
        // loadConfig() call was interrupted by the WS closing).
        this.loadConfig().catch(() => {});
    }

    _startReconnectedTimer() {
        const seconds = this._config.reconnected?.auto_dismiss_seconds ?? 3;
        this._reconnectedTimer = setTimeout(() => {
            this._reconnectedTimer    = null;
            this._isReconnectedActive = false;
            window.lcards?.core?.portalOverlayManager?.hide('connection-overlay');
        }, seconds * 1000);
    }

    _clearReconnectedTimer() {
        if (this._reconnectedTimer !== null) {
            clearTimeout(this._reconnectedTimer);
            this._reconnectedTimer = null;
        }
    }

    _clearDisconnectDelayTimer() {
        if (this._disconnectDelayTimer !== null) {
            clearTimeout(this._disconnectDelayTimer);
            this._disconnectDelayTimer = null;
        }
    }

    _handleDismiss() {
        lcardsLog.debug('[ConnectionOverlayService] Overlay dismissed by user');
        this._isDismissed = true;
        // PortalOverlayManager calls hide('connection-overlay') after this callback returns.
        // Notify UI components (e.g. config-panel tab) so they can reset test-state buttons.
        document.dispatchEvent(new CustomEvent('lcards-connection-overlay-dismissed', { bubbles: false }));
    }

    // -------------------------------------------------------------------------
    // Portal overlay helpers
    // -------------------------------------------------------------------------

    /**
     * Show the disconnect overlay via PortalOverlayManager using the current
     * effective config.  Called from show(), showWith(), and _onDisconnected().
     * @private
     */
    _showDisconnectOverlay() {
        const pom = window.lcards?.core?.portalOverlayManager;
        if (!pom) {
            lcardsLog.warn('[ConnectionOverlayService] PortalOverlayManager unavailable — cannot show overlay');
            return;
        }
        const cfg = this._config;
        pom.show('connection-overlay', {
            position:  cfg.position ?? 'center',
            width:     cfg.width    ?? 'auto',
            height:    cfg.height   ?? 'auto',
            dismiss:   cfg.dismiss  ?? true,
            onDismiss: () => this._handleDismiss(),
            content:   cfg.content,
            text:      cfg.message,
            layers:    cfg.layers,
        });
    }

    // -------------------------------------------------------------------------
    // WS connection event subscription
    // -------------------------------------------------------------------------

    /**
     * Subscribe to `disconnected` / `ready` events on the
     * `home-assistant-js-websocket` Connection object.
     *
     * The library fires `'disconnected'` when the WebSocket closes and `'ready'`
     * when it (re)opens after authentication — there is no `'reconnected'` event.
     * Both fire immediately, independently of whether any state changes are in
     * flight, making them the primary disconnect-detection mechanism.
     *
     * @param {object} conn - `hass.connection`
     */
    _subscribeConnectionEvents(conn) {
        // Clean up any previous subscription first.
        this._unsubscribeConnectionEvents();

        this._handleConnDisconnected = () => {
            lcardsLog.info('[ConnectionOverlayService] WS "disconnected" event — triggering overlay');
            this._isConnected = false;
            this._onDisconnected();
        };

        this._handleConnReconnected = () => {
            lcardsLog.info('[ConnectionOverlayService] WS "ready" event — scheduling overlay clear');
            this._isConnected = true;
            this._onReconnected();
        };

        conn.addEventListener('disconnected', this._handleConnDisconnected);
        conn.addEventListener('ready',        this._handleConnReconnected);
        this._subscribedConnection = conn;

        lcardsLog.debug('[ConnectionOverlayService] Subscribed to hass.connection events');
    }

    /**
     * Remove event listeners from the tracked connection object.
     * Safe to call when no subscription is active.
     */
    _unsubscribeConnectionEvents() {
        if (this._subscribedConnection && this._handleConnDisconnected) {
            try {
                this._subscribedConnection.removeEventListener('disconnected', this._handleConnDisconnected);
                this._subscribedConnection.removeEventListener('ready',        this._handleConnReconnected);
            } catch (_) { /* best-effort — connection may already be gone */ }
        }
        this._subscribedConnection   = null;
        this._handleConnDisconnected = null;
        this._handleConnReconnected  = null;
    }

    // -------------------------------------------------------------------------
    // Config helpers
    // -------------------------------------------------------------------------

    _applyPartialConfig(partial) {
        if (!partial || typeof partial !== 'object') return;
        this._config = this._mergeWithDefaults(partial);
    }

    _mergeWithDefaults(partial) {
        if (!partial || typeof partial !== 'object') return { ...DEFAULT_CONFIG };
        return {
            ...DEFAULT_CONFIG,
            ...partial,
            layers: {
                ...DEFAULT_CONFIG.layers,
                ...(partial.layers ?? {}),
            },
            message: {
                ...DEFAULT_CONFIG.message,
                ...(partial.message ?? {}),
            },
            reconnected: {
                ...DEFAULT_CONFIG.reconnected,
                ...(partial.reconnected ?? {}),
            },
        };
    }

}
