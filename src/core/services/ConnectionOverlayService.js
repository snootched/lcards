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
 *    fires `'disconnected'` / `'reconnected'` events on the `Connection` object
 *    whenever the underlying WebSocket closes or reopens.  These fire immediately
 *    on graceful disconnects and after TCP timeout on hard network cuts — with no
 *    false positives from idle dashboards (no state changes → no hass updates is
 *    normal and must NOT be treated as disconnection).
 *
 * 2. **`hass.connected` flag** — belt-and-suspenders.  HA also sets this flag
 *    and propagates an updated hass object on connect/disconnect transitions.
 *    We watch it to handle any edge-cases where the WS event fires slightly
 *    outside the `updateHass` call cycle.
 *
 * ## Config resolution order (first non-null wins)
 *
 * 1. Device-scoped setting  (e.g. kiosk A shows different message to kiosk B)
 * 2. User-scoped setting
 * 3. Global setting
 * 4. localStorage cache     (offline-safe; populated from scoped settings on last load)
 * 5. Built-in defaults
 *
 * The localStorage cache is read synchronously at construction time so that on
 * a hard browser refresh while HA is offline the overlay still appears
 * immediately using the last-known config.
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
    CONN_OVERLAY_ALL_KEYS,
} from './ScopedSettingsConstants.js';

// ---------------------------------------------------------------------------
// Built-in defaults
// ---------------------------------------------------------------------------

const DEFAULT_CONFIG = {
    enabled: true,
    /** Allow the user to dismiss the overlay (it will reappear on the next disconnect). */
    dismiss: true,
    /** Where to anchor the content card within the overlay. */
    position: 'center',
    /** Explicit CSS width for the content container ('auto' = size to content). */
    width: 'auto',
    /** Explicit CSS height for the content container ('auto' = size to content). */
    height: 'auto',
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
        enabled:              false,
        text:                 'Connection Restored',
        color:                '#4caf50',
        auto_dismiss_seconds: 3,
        font:      'Antonio',
        size:      26,
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

/** localStorage key used to cache the resolved config for offline-first reads. */
const LS_KEY = 'lcards_connection_overlay_config';

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
        /** True when the disconnect overlay is actively shown. */
        this._isActive = false;
        /** True when the "connection restored" confirmation banner is shown. */
        this._isReconnectedActive = false;
        /** True if the user has dismissed the overlay for this disconnection event. */
        this._isDismissed = false;
        /** Timer handle for auto-dismissing the reconnected confirmation banner. */
        this._reconnectedTimer = null;

        // ── HASS ──────────────────────────────────────────────────────────
        this._hass = null;

        // ── Config ────────────────────────────────────────────────────────
        // Start with built-in defaults, overlay with any localStorage cache.
        this._config = { ...DEFAULT_CONFIG };
        this._applyPartialConfig(this._loadLocalStorageConfig());
        /** Config saved before a showWith() preview call; restored on hide(). */
        this._previewConfig = null;

        lcardsLog.debug('[ConnectionOverlayService] Created (config seeded from localStorage or defaults)');
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
        // The WS events are primary; this catches any remaining edge-cases.
        if (!nowConnected && wasConnected) {
            lcardsLog.info('[ConnectionOverlayService] hass.connected → false — triggering overlay');
            this._isConnected = false;
            this._onDisconnected();
        } else if (nowConnected && !wasConnected) {
            lcardsLog.info('[ConnectionOverlayService] hass.connected → true — clearing overlay');
            this._isConnected = true;
            this._onReconnected();
        } else {
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
            lcardsLog.warn('[ConnectionOverlayService] Config load failed — using cached/default config:', err);
        }
    }

    /**
     * Load config from the ScopedSettings waterfall (device → user → global).
     * Saves the result to localStorage and applies it to `_config`.
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
        ]);

        const resolved = {
            enabled:  enabled  ?? D.enabled,
            dismiss:  dismiss  ?? D.dismiss,
            position: position ?? D.position,
            width:    width    ?? D.width,
            height:   height   ?? D.height,
            content:  content  ?? D.content,
            layers:   sem      ?? D.layers,
            message: {
                mode:      msgMode      ?? D.message.mode,
                text:      msgText      ?? D.message.text,
                color:     msgColor     ?? D.message.color,
                font:      msgFont      ?? D.message.font,
                size:      msgSize      ?? D.message.size,
                weight:    msgWeight    ?? D.message.weight,
                transform: msgTransform ?? D.message.transform,
                borgLayers: borgSem ?? null,
            },
            reconnected: {
                enabled:              reconEnabled     ?? D.reconnected.enabled,
                text:                 reconText        ?? D.reconnected.text,
                color:                reconColor       ?? D.reconnected.color,
                auto_dismiss_seconds: reconDismissSecs ?? D.reconnected.auto_dismiss_seconds,
                font:                 reconFont        ?? D.reconnected.font,
                size:                 reconSize        ?? D.reconnected.size,
                weight:               reconWeight      ?? D.reconnected.weight,
                transform:            reconTransform   ?? D.reconnected.transform,
                content:              reconContent     ?? D.reconnected.content,
            },
        };

        this._config = resolved;
        this._saveLocalStorageCache(this._config);
        return this._config;
    }

    /**
     * Save config to the specified scope.
     *
     * @param {Object} config   - Partial or full config object.
     * @param {'device'|'user'|'global'} [scope='global']
     * @returns {Promise<void>}
     */
    async saveConfig(config, scope = 'global') {
        const sss = window.lcards?.core?.scopedSettingsService;
        if (!sss) {
            lcardsLog.warn('[ConnectionOverlayService] ScopedSettingsService unavailable — config not saved');
            return;
        }

        // Map the nested config shape to individual flat keys and write each one.
        // Only keys present in the config object are written — callers may pass a
        // full config or a sparse subset.
        const writes = [];
        if ('enabled'  in config) writes.push(sss.write(CONN_OVERLAY_ENABLED,  config.enabled,  scope));
        if ('dismiss'  in config) writes.push(sss.write(CONN_OVERLAY_DISMISS,  config.dismiss,  scope));
        if ('position' in config) writes.push(sss.write(CONN_OVERLAY_POSITION, config.position, scope));
        if ('width'    in config) writes.push(sss.write(CONN_OVERLAY_WIDTH,    config.width,    scope));
        if ('height'   in config) writes.push(sss.write(CONN_OVERLAY_HEIGHT,   config.height,   scope));
        if ('content'  in config) writes.push(sss.write(CONN_OVERLAY_CONTENT,  config.content,  scope));
        if ('layers'   in config) writes.push(sss.write(CONN_OVERLAY_SEM,      config.layers,   scope));

        const msg = config.message ?? {};
        if ('mode'      in msg) writes.push(sss.write(CONN_OVERLAY_MSG_MODE,      msg.mode,      scope));
        if ('text'      in msg) writes.push(sss.write(CONN_OVERLAY_MSG_TEXT,      msg.text,      scope));
        if ('color'     in msg) writes.push(sss.write(CONN_OVERLAY_MSG_COLOR,     msg.color,     scope));
        if ('font'      in msg) writes.push(sss.write(CONN_OVERLAY_MSG_FONT,      msg.font,      scope));
        if ('size'      in msg) writes.push(sss.write(CONN_OVERLAY_MSG_SIZE,      msg.size,      scope));
        if ('weight'    in msg) writes.push(sss.write(CONN_OVERLAY_MSG_WEIGHT,    msg.weight,    scope));
        if ('transform' in msg) writes.push(sss.write(CONN_OVERLAY_MSG_TRANSFORM, msg.transform, scope));

        if ('borgLayers' in msg) writes.push(sss.write(CONN_OVERLAY_BORG_SEM, msg.borgLayers, scope));

        const rec = config.reconnected ?? {};
        if ('enabled'              in rec) writes.push(sss.write(CONN_OVERLAY_RECON_ENABLED,      rec.enabled,              scope));
        if ('text'                 in rec) writes.push(sss.write(CONN_OVERLAY_RECON_TEXT,          rec.text,                 scope));
        if ('color'                in rec) writes.push(sss.write(CONN_OVERLAY_RECON_COLOR,         rec.color,                scope));
        if ('auto_dismiss_seconds' in rec) writes.push(sss.write(CONN_OVERLAY_RECON_DISMISS_SECS,  rec.auto_dismiss_seconds, scope));
        if ('font'                 in rec) writes.push(sss.write(CONN_OVERLAY_RECON_FONT,          rec.font,                 scope));
        if ('size'                 in rec) writes.push(sss.write(CONN_OVERLAY_RECON_SIZE,          rec.size,                 scope));
        if ('weight'               in rec) writes.push(sss.write(CONN_OVERLAY_RECON_WEIGHT,        rec.weight,               scope));
        if ('transform'            in rec) writes.push(sss.write(CONN_OVERLAY_RECON_TRANSFORM,     rec.transform,            scope));
        if ('content'              in rec) writes.push(sss.write(CONN_OVERLAY_RECON_CONTENT,       rec.content,              scope));

        await Promise.all(writes);

        // Re-read the full waterfall to get the resolved effective config.
        await this.loadConfig();

        // If the disconnect overlay is currently visible, refresh it with the
        // new config immediately so changes take effect without a hide/show cycle.
        if (this._isActive && window.lcards?.core?.portalOverlayManager?.has('connection-overlay')) {
            this._showDisconnectOverlay();
        }

        lcardsLog.info(`[ConnectionOverlayService] Config saved to scope "${scope}"`);
    }

    /**
     * Delete config from the specified scope (falls back to next tier on next read).
     *
     * @param {'device'|'user'|'global'} [scope='global']
     * @returns {Promise<void>}
     */
    async clearConfig(scope = 'global') {
        const sss = window.lcards?.core?.scopedSettingsService;
        if (!sss) return;

        // Clear all 23 flat keys from the given scope in parallel.
        await Promise.all(CONN_OVERLAY_ALL_KEYS.map(k => sss.clear(k, scope)));
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
        this._isReconnectedActive = false;
        this._isDismissed = false;
        this._isActive    = true;
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
        this._isReconnectedActive = false;
        this._isActive    = false;
        this._isDismissed = false;
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
        this._isActive    = false;
        this._isDismissed = false;

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
        this._clearReconnectedTimer();
        this._unsubscribeConnectionEvents();
        window.lcards?.core?.portalOverlayManager?.hide('connection-overlay');
        lcardsLog.debug('[ConnectionOverlayService] Destroyed');
    }

    // -------------------------------------------------------------------------
    // Connection event handlers
    // -------------------------------------------------------------------------

    _onDisconnected() {
        // Cancel any in-progress "reconnected" banner before showing the disconnect overlay.
        this._clearReconnectedTimer();
        this._isReconnectedActive = false;

        if (!this._config.enabled) return;
        if (this._isActive) return;  // already showing

        this._isActive    = true;
        this._isDismissed = false;

        // Borg mode: assimilation replaces the standard overlay.
        if (this._config.message?.mode === 'borg') {
            lcardsLog.info('[ConnectionOverlayService] Connection lost — activating Borg assimilation');
            const borgLayers = this._config.message?.borgLayers ?? null;
            const { paletteHue = null, ...introLayers } = borgLayers ?? {};
            const borgOpts = {
                ...(Object.keys(introLayers).length ? { intro: introLayers } : {}),
                ...(paletteHue != null ? { paletteHue } : {}),
            };
            window.lcards?.core?.borgAssimilationManager?.assimilate(borgOpts);
            return;
        }

        lcardsLog.info('[ConnectionOverlayService] Connection lost — activating overlay');
        this._showDisconnectOverlay();
    }

    _onReconnected() {
        this._clearReconnectedTimer();

        lcardsLog.info('[ConnectionOverlayService] Connection restored — clearing disconnect overlay');
        this._isActive    = false;
        this._isDismissed = false;

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
        if (this._config.reconnected?.enabled) {
            // Show a brief "reconnected" confirmation overlay, then auto-dismiss.
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
     * Subscribe to `disconnected` / `reconnected` events on the
     * `home-assistant-js-websocket` Connection object.
     *
     * These events fire immediately when the underlying WebSocket closes or
     * reopens — independently of whether any state changes are in flight.
     * This is the primary disconnect-detection mechanism, replacing the
     * previous heartbeat timer that produced false positives on idle dashboards.
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
            lcardsLog.info('[ConnectionOverlayService] WS "reconnected" event — clearing overlay');
            this._isConnected = true;
            this._onReconnected();
        };

        conn.addEventListener('disconnected', this._handleConnDisconnected);
        conn.addEventListener('reconnected',  this._handleConnReconnected);
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
                this._subscribedConnection.removeEventListener('reconnected',  this._handleConnReconnected);
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

    // -------------------------------------------------------------------------
    // localStorage cache (offline-first)
    // -------------------------------------------------------------------------

    _loadLocalStorageConfig() {
        try {
            const raw = localStorage.getItem(LS_KEY);
            return raw ? JSON.parse(raw) : null;
        } catch (e) {
            lcardsLog.debug('[ConnectionOverlayService] localStorage read failed:', e);
            return null;
        }
    }

    _saveLocalStorageCache(config) {
        try {
            localStorage.setItem(LS_KEY, JSON.stringify(config));
        } catch (e) {
            lcardsLog.debug('[ConnectionOverlayService] localStorage write failed:', e);
        }
    }
}
