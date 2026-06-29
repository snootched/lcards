/**
 * @fileoverview LCARdS Connectivity Tab — Config Panel UI for connection-lost overlay
 *
 * Provides a settings UI for the ConnectionOverlayService using HA-native elements:
 * - Enable / disable the overlay
 * - Simple text message + colour (no custom card required)
 * - Optional full HA card via YAML (with position + size controls)
 * - Per-slot SEM layer configuration (backdrop / canvas / colour)
 * - "Connection Restored" confirmation with auto-dismiss timer
 * - Scope switcher (Device / User / Global)
 * - Test buttons: "Simulate Disconnect" / "Clear Test"
 *
 * Reads from and writes to `window.lcards.connectionOverlay` (which delegates
 * to `ConnectionOverlayService` via `ScopedSettingsService`).
 *
 * @element lcards-connectivity-tab
 */

import { LitElement, html, css, nothing } from 'lit';
import { keyed } from 'lit/directives/keyed.js';
import yaml from 'js-yaml';
import { lcardsLog } from '../../utils/lcards-logging.js';
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
} from '../../core/services/ScopedSettingsConstants.js';
import { originBadge } from './shared/scoped-field-helpers.js';
import '../../editor/components/shared/lcards-form-section.js';
import '../../editor/components/shared/lcards-message.js';
import './shared/lcards-scope-selector.js';
import '../../editor/components/shared/lcards-color-picker.js';
import '../../editor/components/editors/lcards-font-selector.js';
import '../../editor/components/editors/lcards-position-picker.js';

// ---------------------------------------------------------------------------
// Dropdown option lists
// ---------------------------------------------------------------------------

const MODE_OPTIONS = [
    { value: 'text', label: 'Simple text' },
    { value: 'card', label: 'Custom card (YAML)' },
    { value: 'borg', label: '👽 Resistance is Futile' },
];

const TRANSFORM_OPTIONS = [
    { value: 'uppercase',  label: 'UPPERCASE' },
    { value: 'capitalize', label: 'Title Case' },
    { value: 'none',       label: 'None' },
];

// ---------------------------------------------------------------------------
// Key maps for _renderTextStyleControls — maps logical field names to
// their flat storage key constants so per-field badges work correctly.
// ---------------------------------------------------------------------------

const MSG_KEYS = {
    text:      CONN_OVERLAY_MSG_TEXT,
    color:     CONN_OVERLAY_MSG_COLOR,
    font:      CONN_OVERLAY_MSG_FONT,
    size:      CONN_OVERLAY_MSG_SIZE,
    weight:    CONN_OVERLAY_MSG_WEIGHT,
    transform: CONN_OVERLAY_MSG_TRANSFORM,
};

const RECON_KEYS = {
    text:      CONN_OVERLAY_RECON_TEXT,
    color:     CONN_OVERLAY_RECON_COLOR,
    font:      CONN_OVERLAY_RECON_FONT,
    size:      CONN_OVERLAY_RECON_SIZE,
    weight:    CONN_OVERLAY_RECON_WEIGHT,
    transform: CONN_OVERLAY_RECON_TRANSFORM,
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export class LCARdSConnectivityTab extends LitElement {
    static properties = {
        hass:              { type: Object },
        _scope:            { type: String,  state: true },
        _scopeInfo:        { type: Object,  state: true },
        _editConfig:       { type: Object,  state: true },
        /** YAML string bound to the ha-code-editor for the optional content card. */
        _contentYaml:      { type: String,  state: true },
        /** Non-null when the YAML is syntactically invalid at save time. */
        _contentYamlError: { type: String,  state: true },
        _loading:          { type: Boolean, state: true },
        _saving:           { type: Boolean, state: true },
        _error:            { type: String,  state: true },
        _testActive:       { type: Boolean, state: true },
        /** YAML string for the reconnected custom card (card mode). */
        _reconnectedContentYaml:      { type: String,  state: true },
        /** Non-null when the reconnected YAML is syntactically invalid at save time. */
        _reconnectedContentYamlError: { type: String,  state: true },
        /**
         * Per-scope data for all flat keys: { [key]: { device, user, global, resolved } }.
         * Null while loading.  Populated by _loadScopedValues() via readAllScopes().
         */
        _scopedValues:  { type: Object,  state: true },
        _scopedLoading: { type: Boolean, state: true },
        /** True after any _set() call until the next save or reload. */
        _isDirty:       { type: Boolean, state: true },
        /** True when the user has clicked Clear and we're waiting for confirmation. */
        _confirmClear:  { type: Boolean, state: true },
        /** True when a remote device updated settings while this tab has unsaved edits. */
        _remoteUpdatePending: { type: Boolean, state: true },
        /** Brief confirmation state after a reload broadcast — clears after 2 s. */
        _reloadSent:    { type: String,  state: true },
    };

    constructor() {
        super();
        this.hass              = undefined;
        this._scope            = 'global';
        this._scopeInfo        = { scope: 'global', userId: null, deviceId: null, isAdminTarget: false };
        this._editConfig       = null;
        this._contentYaml      = '';
        this._contentYamlError = null;
        this._reconnectedContentYaml      = '';
        this._reconnectedContentYamlError = null;
        this._loading          = false;
        this._saving           = false;
        this._error            = null;
        this._testActive       = false;
        this._scopedValues     = null;
        this._scopedLoading    = false;
        this._loadGeneration   = 0;
        this._isDirty               = false;
        this._confirmClear          = false;
        this._remoteUpdatePending   = false;
        this._reloadSent            = null;
        this._dirtyServiceKeys      = new Set();
        this._awaitingRetry         = false;
        this._boundHandleOverlayDismiss       = () => { this._testActive = false; };
        this._boundHandleRemoteConfigChange   = () => this._handleRemoteConfigChange();
    }

    connectedCallback() {
        super.connectedCallback();
        this._loadConfig();
        document.addEventListener('lcards-connection-overlay-dismissed', this._boundHandleOverlayDismiss);
        document.addEventListener('lcards-connection-config-changed', this._boundHandleRemoteConfigChange);
    }

    disconnectedCallback() {
        super.disconnectedCallback();
        document.removeEventListener('lcards-connection-overlay-dismissed', this._boundHandleOverlayDismiss);
        document.removeEventListener('lcards-connection-config-changed', this._boundHandleRemoteConfigChange);
    }

    willUpdate(changedProps) {
        super.willUpdate(changedProps);
        // Don't trigger a background reload while a save/reset/clear is in progress.
        // Those operations own their own force-reload cycle; an extra _loadConfig call
        // here would race against it and could clobber _editConfig with stale data.
        if (this._saving) return;
        // Retry if _scopedValues is null — happens when the integration service wasn't
        // ready on the first call. Skip while _awaitingRetry is true: the onReady()
        // callback owns the next load attempt to avoid stacking concurrent loads.
        if (changedProps.has('hass') && this.hass &&
            (!this._editConfig || !this._scopedValues) && !this._awaitingRetry) {
            this._loadConfig();
        }
    }

    // -------------------------------------------------------------------------
    // Data operations
    // -------------------------------------------------------------------------

    /**
     * Load per-scope data for all flat keys in one parallel batch.
     * Populates _scopedValues: { [key]: { device, user, global, resolved } }.
     *
     * @param {boolean} [force=false]  When true, bypasses the _scopedLoading guard
     *   and increments _loadGeneration so any concurrently-running stale load will
     *   discard its results and not overwrite ours.
     * @param {Object|null} [explicitOpts]  If provided, use these SSS opts instead of
     *   reading _scopeInfo at call time.  Pass when the caller captured opts before an
     *   await (save/reset/clear paths) to avoid racing with concurrent scope changes.
     */
    async _loadScopedValues(force = false, explicitOpts = null) {
        const sss = window.lcards?.core?.scopedSettingsService;
        if (!sss) return;
        if (!force && this._scopedLoading) return;
        // The integration service must have finished probing before readAllScopes()
        // can return real values (global scope reads go through integrationService).
        // If not ready yet, bail without setting _scopedValues so the caller retries.
        if (!window.lcards?.core?.integrationService?.available) return;
        this._scopedLoading = true;
        const gen  = ++this._loadGeneration;
        const opts = explicitOpts ?? this._scopeInfoOpts();
        lcardsLog.debug('[ConnectivityTab] _loadScopedValues start', { gen, force, opts });
        try {
            const results = await Promise.all(CONN_OVERLAY_ALL_KEYS.map(k => sss.readAllScopes(k, null, opts)));
            // Discard if a newer load (force-started by a scope change or save) has
            // already started — its result is authoritative.
            if (gen !== this._loadGeneration) {
                lcardsLog.debug('[ConnectivityTab] _loadScopedValues discarded (gen mismatch)', { gen, current: this._loadGeneration });
                return;
            }
            this._scopedValues = Object.fromEntries(CONN_OVERLAY_ALL_KEYS.map((k, i) => [k, results[i]]));
            lcardsLog.debug('[ConnectivityTab] _loadScopedValues complete', { gen, enabled: this._scopedValues[CONN_OVERLAY_ENABLED] });
        } catch (err) {
            lcardsLog.warn('[ConnectivityTab] Failed to load scope data:', err);
            if (gen === this._loadGeneration) this._scopedValues = null;
        } finally {
            if (gen === this._loadGeneration) this._scopedLoading = false;
        }
    }

    /** Returns opts for SSS admin reads/writes based on the current scope target. */
    _scopeInfoOpts() {
        return {
            ...(this._scopeInfo.userId   ? { targetUserId:   this._scopeInfo.userId   } : {}),
            ...(this._scopeInfo.deviceId ? { targetDeviceId: this._scopeInfo.deviceId } : {}),
        };
    }

    /**
     * Assemble the nested config shape from the scope-aware values in _scopedValues.
     * Prefers the current scope's stored value, then the resolved waterfall, then defaults.
     * This ensures the "Global" tab shows the global value even when a device override exists.
     * @returns {Object}
     */
    _buildEffectiveConfig() {
        const sv    = this._scopedValues;
        const D     = this._defaultConfig();
        const scope = this._scope;
        // Prefer the scope-specific stored value so each tab shows what it has configured,
        // then fall through to global (not the full resolved waterfall, which would bleed
        // the admin's user-scope overrides into the device tab, or vice versa).
        const r = (key, fallback) => sv?.[key]?.[scope] ?? sv?.[key]?.global ?? fallback;
        return {
            enabled:            r(CONN_OVERLAY_ENABLED,           D.enabled),
            dismiss:            r(CONN_OVERLAY_DISMISS,            D.dismiss),
            position:           r(CONN_OVERLAY_POSITION,           D.position),
            width:              r(CONN_OVERLAY_WIDTH,              D.width),
            height:             r(CONN_OVERLAY_HEIGHT,             D.height),
            content:            r(CONN_OVERLAY_CONTENT,            D.content),
            layers:             r(CONN_OVERLAY_SEM,                D.layers),
            disconnect_delay_ms: r(CONN_OVERLAY_DISCONNECT_DELAY,  D.disconnect_delay_ms),
            message: {
                mode:      r(CONN_OVERLAY_MSG_MODE,      D.message.mode),
                text:      r(CONN_OVERLAY_MSG_TEXT,      D.message.text),
                color:     r(CONN_OVERLAY_MSG_COLOR,     D.message.color),
                font:      r(CONN_OVERLAY_MSG_FONT,      D.message.font),
                size:      r(CONN_OVERLAY_MSG_SIZE,      D.message.size),
                weight:    r(CONN_OVERLAY_MSG_WEIGHT,    D.message.weight),
                transform: r(CONN_OVERLAY_MSG_TRANSFORM, D.message.transform),
                borgLayers: r(CONN_OVERLAY_BORG_SEM, D.message.borgLayers),
            },
            reconnected: {
                enabled:              r(CONN_OVERLAY_RECON_ENABLED,       D.reconnected.enabled),
                text:                 r(CONN_OVERLAY_RECON_TEXT,           D.reconnected.text),
                color:                r(CONN_OVERLAY_RECON_COLOR,          D.reconnected.color),
                auto_dismiss_seconds: r(CONN_OVERLAY_RECON_DISMISS_SECS,  D.reconnected.auto_dismiss_seconds),
                font:                 r(CONN_OVERLAY_RECON_FONT,           D.reconnected.font),
                size:                 r(CONN_OVERLAY_RECON_SIZE,           D.reconnected.size),
                weight:               r(CONN_OVERLAY_RECON_WEIGHT,         D.reconnected.weight),
                transform:            r(CONN_OVERLAY_RECON_TRANSFORM,      D.reconnected.transform),
                content:              r(CONN_OVERLAY_RECON_CONTENT,        D.reconnected.content),
            },
        };
    }

    async _loadConfig() {
        this._loading = true;
        this._error   = null;
        try {
            // Load flat per-scope data for all keys (badges + resolved values).
            await this._loadScopedValues();
            // _scopedValues is null when integration hasn't been probed yet.
            // Register a one-shot retry via onReady() only when integration exists but
            // isn't available yet. If available=true, the bail was from the _scopedLoading
            // guard (concurrent call) — willUpdate handles that on the next hass update.
            // _awaitingRetry prevents stacking multiple onReady() listeners, which would
            // create an infinite microtask loop once the promise resolves.
            if (!this._scopedValues) {
                const intSvc = window.lcards?.core?.integrationService;
                if (intSvc && !intSvc.available && !this._awaitingRetry) {
                    this._awaitingRetry = true;
                    intSvc.onReady().then(() => {
                        this._awaitingRetry = false;
                        if (!this.isConnected || this._editConfig) return;
                        if (intSvc.available) {
                            this._loadConfig();
                        } else {
                            // Integration not installed or failed probe — fall through to defaults.
                            this._editConfig = this._defaultConfig();
                            this.requestUpdate();
                        }
                    }).catch(() => {
                        this._awaitingRetry = false;
                        this.requestUpdate();
                    });
                }
                return;
            }
            // Assemble the effective nested config from resolved flat values.
            this._editConfig = this._buildEffectiveConfig();
            this._isDirty = false;
            const cfg = this._editConfig;
            this._contentYaml = cfg.content ? yaml.dump(cfg.content, { indent: 2 }) : '';
            this._reconnectedContentYaml = cfg.reconnected?.content
                ? yaml.dump(cfg.reconnected.content, { indent: 2 }) : '';
            // Also tell the overlay service to reload so the live overlay stays in sync.
            await window.lcards?.connectionOverlay?.loadConfig();
        } catch (err) {
            lcardsLog.warn('[ConnectivityTab] Config load failed:', err);
            this._error       = 'Could not load settings from server.';
            this._editConfig  = this._defaultConfig();
            this._contentYaml = '';
            this._reconnectedContentYaml = '';
        } finally {
            this._loading = false;
        }
    }

    async _saveConfig() {
        if (!this._editConfig) return;

        // Capture scope/opts NOW — before any await — so concurrent _handleScopeChange
        // calls (triggered by the user clicking a scope tab at nearly the same time)
        // cannot change _scopeInfo between the write and the post-save force-reload.
        const savedScope = this._scope;
        const savedOpts  = this._scopeInfoOpts();

        const mode = this._editConfig.message?.mode ?? 'text';
        let content = null;
        let reconnectedContent = null;

        if (mode === 'card') {
            // Parse disconnect card YAML.
            if (this._contentYaml?.trim()) {
                try {
                    content = yaml.load(this._contentYaml);
                    this._contentYamlError = null;
                } catch (err) {
                    this._contentYamlError = `Invalid YAML: ${err.message}`;
                    return;
                }
            }
            // Parse reconnected card YAML (optional — empty means text fallback).
            if (this._reconnectedContentYaml?.trim()) {
                try {
                    reconnectedContent = yaml.load(this._reconnectedContentYaml);
                    this._reconnectedContentYamlError = null;
                } catch (err) {
                    this._reconnectedContentYamlError = `Invalid YAML: ${err.message}`;
                    return;
                }
            }
        }
        // In text mode: both content fields stay null.

        // Only write the fields the user explicitly changed — not the full config.
        // This prevents "save one field → all 25 get device badges" behaviour.
        const configToSave = this._buildSparseConfig(this._editConfig, content, reconnectedContent);
        this._saving = true;
        this._error  = null;
        lcardsLog.info('[ConnectivityTab] _saveConfig start', { savedScope, savedOpts, dirtyKeys: [...this._dirtyServiceKeys] });
        try {
            // Delegate nested→flat mapping to the service; it writes each key individually.
            // Use captured scope/opts so we always write to the target that was selected
            // when the user clicked Save, not wherever _scopeInfo happens to point now.
            await window.lcards?.connectionOverlay?.saveConfig(configToSave, savedScope, savedOpts);
            lcardsLog.info('[ConnectivityTab] _saveConfig write complete — force-reloading');
            // Force-reload scoped values (bypasses any in-flight load guard) and
            // rebuild the effective config for badges + form.  Pass the same opts used
            // for the write so we read back from the correct scope target.
            this._scopedValues = null;
            await this._loadScopedValues(true, savedOpts);
            lcardsLog.info('[ConnectivityTab] _saveConfig reload complete', {
                enabledSv: this._scopedValues?.[CONN_OVERLAY_ENABLED],
                scope: this._scope,
            });
            this._editConfig = this._buildEffectiveConfig();
            this._isDirty = false;
            this._dirtyServiceKeys = new Set();
            const newCfg = this._editConfig;
            this._contentYaml = newCfg.content ? yaml.dump(newCfg.content, { indent: 2 }) : '';
            this._reconnectedContentYaml = newCfg.reconnected?.content
                ? yaml.dump(newCfg.reconnected.content, { indent: 2 }) : '';
        } catch (err) {
            lcardsLog.warn('[ConnectivityTab] Config save failed:', err);
            this._error = 'Could not save settings.';
        } finally {
            this._saving = false;
        }
    }

    async _resetScope() {
        const savedScope = this._scope;
        const savedOpts  = this._scopeInfoOpts();
        this._saving       = true;
        this._error        = null;
        this._confirmClear = false;
        try {
            await window.lcards?.connectionOverlay?.clearConfig(savedScope, savedOpts);
            this._scopedValues = null;
            await this._loadScopedValues(true, savedOpts);
            this._editConfig = this._buildEffectiveConfig();
            this._isDirty = false;
            this._dirtyServiceKeys = new Set();
            const cfg = this._editConfig;
            this._contentYaml = cfg.content ? yaml.dump(cfg.content, { indent: 2 }) : '';
            this._reconnectedContentYaml = cfg.reconnected?.content
                ? yaml.dump(cfg.reconnected.content, { indent: 2 }) : '';
        } catch (err) {
            lcardsLog.warn('[ConnectivityTab] Config reset failed:', err);
            this._error = 'Could not reset settings.';
        } finally {
            this._saving = false;
        }
    }

    async _reloadAllDevices() {
        const conn = this.hass?.connection;
        if (!conn) return;
        this._saving = true;
        this._error  = null;
        try {
            await conn.sendMessagePromise({ type: 'lcards/fire_event', action: 'reload_connection_config' });
            lcardsLog.info('[ConnectivityTab] Broadcast reload sent to all connected devices');
            this._reloadSent = 'config';
            setTimeout(() => { this._reloadSent = null; }, 2000);
        } catch (err) {
            lcardsLog.warn('[ConnectivityTab] Failed to broadcast reload:', err);
            this._error = 'Could not broadcast reload — requires admin access.';
        } finally {
            this._saving = false;
        }
    }

    async _reloadAllPages() {
        const conn = this.hass?.connection;
        if (!conn) return;
        this._saving = true;
        this._error  = null;
        try {
            await conn.sendMessagePromise({ type: 'lcards/fire_event', action: 'reload' });
            lcardsLog.info('[ConnectivityTab] Broadcast page reload sent to all devices');
            this._reloadSent = 'pages';
            setTimeout(() => { this._reloadSent = null; }, 2000);
        } catch (err) {
            lcardsLog.warn('[ConnectivityTab] Failed to broadcast page reload:', err);
            this._error = 'Could not broadcast page reload — requires admin.';
        } finally {
            this._saving = false;
        }
    }

    _handleRemoteConfigChange() {
        if (!this._isDirty) {
            // No unsaved edits — silently refresh scope badges and form values.
            const opts = this._scopeInfoOpts();
            this._loadScopedValues(false, opts)
                .then(() => { this._editConfig = this._buildEffectiveConfig(); })
                .catch(() => {});
        } else {
            // Unsaved edits exist — warn the user instead of clobbering them.
            this._remoteUpdatePending = true;
        }
    }

    _applyRemoteUpdate() {
        this._isDirty             = false;
        this._dirtyServiceKeys    = new Set();
        this._remoteUpdatePending = false;
        const opts = this._scopeInfoOpts();
        this._loadScopedValues(true, opts)
            .then(() => { this._editConfig = this._buildEffectiveConfig(); })
            .catch(() => {});
    }

    _discardChanges() {
        this._isDirty          = false;
        this._dirtyServiceKeys = new Set();
        this._editConfig       = this._buildEffectiveConfig();
        const cfg = this._editConfig;
        this._contentYaml            = cfg.content           ? yaml.dump(cfg.content,             { indent: 2 }) : '';
        this._reconnectedContentYaml = cfg.reconnected?.content ? yaml.dump(cfg.reconnected.content, { indent: 2 }) : '';
    }

    _requestClearScope() {
        this._confirmClear = true;
    }

    _cancelClearScope() {
        this._confirmClear = false;
    }

    /** Clear a single flat key override at the current scope, then reload. */
    async _clearScopedValue(key) {
        const sss = window.lcards?.core?.scopedSettingsService;
        if (!sss) return;
        const savedScope = this._scope;
        const savedOpts  = this._scopeInfoOpts();
        this._saving = true;
        try {
            await sss.clear(key, savedScope, savedOpts);
            this._scopedValues = null;
            await this._loadScopedValues(true, savedOpts);
            this._editConfig = this._buildEffectiveConfig();
            const cfg = this._editConfig;
            this._contentYaml = cfg.content ? yaml.dump(cfg.content, { indent: 2 }) : '';
            this._reconnectedContentYaml = cfg.reconnected?.content
                ? yaml.dump(cfg.reconnected.content, { indent: 2 }) : '';
            // Keep overlay service in sync.
            await window.lcards?.connectionOverlay?.loadConfig();
        } catch (err) {
            lcardsLog.warn('[ConnectivityTab] Failed to clear field override:', err);
        } finally {
            this._saving = false;
        }
    }

    _defaultConfig() {
        return {
            enabled:             false,
            dismiss:             true,
            position:            'center',
            width:               'auto',
            height:              'auto',
            disconnect_delay_ms: 2500,
            message: {
                text:      'Connection Lost',
                color:     'var(--error-color)',
                mode:      'text',
                font:      'Antonio',
                size:      32,
                weight:    '400',
                transform: 'uppercase',
                // Borg SEM layers — defaults match borg-assimilation canvas + standard backdrop/tint.
                borgLayers: {
                    canvas:   { preset: 'borg-assimilation', siteCount: 8, tendrilsPerSite: 5, tendrilLength: 600, particleCount: 2, color: 'var(--lcars-martian)', glowColor: 'var(--lcards-yellow)' },
                    backdrop: { preset: 'saturate', amount: '200%' },
                    color:    { preset: 'color-tint', color: 'rgba(0,60,0,0.25)' },
                    paletteHue: 110,
                    fontSwap:   true,
                },
            },
            reconnected: {
                enabled:              true,
                text:                 'Connection Established',
                color:                'var(--primary-color)',
                auto_dismiss_seconds: 3,
                font:      'Antonio',
                size:      32,
                weight:    '400',
                transform: 'uppercase',
                content:   null,
            },
            layers: {
                backdrop: null,
                color:    { preset: 'color-tint', color: 'rgba(0,0,0,0.55)' },
                canvas:   { preset: 'static', intensity: 0.45 },
            },
            content: null,
        };
    }

    _parseYamlContent() {
        if (!this._contentYaml?.trim()) return null;
        try {
            return yaml.load(this._contentYaml);
        } catch {
            return null; // Skip content for preview if YAML is invalid
        }
    }

    _parseReconnectedYamlContent() {
        if (!this._reconnectedContentYaml?.trim()) return null;
        try {
            return yaml.load(this._reconnectedContentYaml);
        } catch {
            return null;
        }
    }

    // -------------------------------------------------------------------------
    // Test controls
    // -------------------------------------------------------------------------

    _handleTestShow() {
        const mode = this._editConfig?.message?.mode ?? 'text';
        if (mode === 'borg') {
            const borgLayers = this._editConfig?.message?.borgLayers ?? null;
            const { paletteHue = null, fontSwap = true, ...introLayers } = borgLayers ?? {};
            const borgOpts = {
                ...(Object.keys(introLayers).length ? { intro: introLayers } : {}),
                ...(paletteHue != null ? { paletteHue } : {}),
                fontSwap,
            };
            window.lcards?.core?.borgAssimilationManager?.assimilate(borgOpts);
            this._testActive = true;
            return;
        }
        const content           = mode === 'card' ? this._parseYamlContent() : null;
        const reconnectedContent = mode === 'card' ? this._parseReconnectedYamlContent() : null;
        const previewConfig = {
            ...this._editConfig,
            content,
            reconnected: {
                ...(this._editConfig?.reconnected ?? {}),
                content: reconnectedContent,
            },
        };
        window.lcards?.connectionOverlay?.showWith(previewConfig);
        this._testActive = true;
    }

    _handleTestHide() {
        const mode = this._editConfig?.message?.mode ?? 'text';
        if (mode === 'borg') {
            window.lcards?.core?.borgAssimilationManager?.deassimilate();
            this._testActive = false;
            return;
        }
        window.lcards?.connectionOverlay?.hide();
        this._testActive = false;
    }

    _handleTestReconnect() {
        const mode = this._editConfig?.message?.mode ?? 'text';
        if (mode === 'borg') {
            window.lcards?.core?.borgAssimilationManager?.deassimilate();
            this._testActive = false;
            return;
        }
        const content          = mode === 'card' ? this._parseYamlContent() : null;
        const reconnectedContent = mode === 'card' ? this._parseReconnectedYamlContent() : null;
        const previewConfig = {
            ...this._editConfig,
            content,
            reconnected: {
                ...(this._editConfig?.reconnected ?? {}),
                content: reconnectedContent,
            },
        };
        window.lcards?.connectionOverlay?.simulateReconnect(previewConfig);
        // _testActive resets via the 'lcards-connection-overlay-dismissed' event listener
    }

    // -------------------------------------------------------------------------
    // Config mutation helpers
    // -------------------------------------------------------------------------

    // Maps _set() dot-notation paths → flat CONN_OVERLAY_* storage key names.
    // Used by field-level dirty tracking so only changed keys get written on save.
    static _PATH_TO_KEY = {
        'enabled':                           CONN_OVERLAY_ENABLED,
        'dismiss':                           CONN_OVERLAY_DISMISS,
        'position':                          CONN_OVERLAY_POSITION,
        'width':                             CONN_OVERLAY_WIDTH,
        'height':                            CONN_OVERLAY_HEIGHT,
        'disconnect_delay_ms':               CONN_OVERLAY_DISCONNECT_DELAY,
        'content':                           CONN_OVERLAY_CONTENT,
        'message.mode':                      CONN_OVERLAY_MSG_MODE,
        'message.text':                      CONN_OVERLAY_MSG_TEXT,
        'message.color':                     CONN_OVERLAY_MSG_COLOR,
        'message.font':                      CONN_OVERLAY_MSG_FONT,
        'message.size':                      CONN_OVERLAY_MSG_SIZE,
        'message.weight':                    CONN_OVERLAY_MSG_WEIGHT,
        'message.transform':                 CONN_OVERLAY_MSG_TRANSFORM,
        'message.borgLayers':                CONN_OVERLAY_BORG_SEM,
        'message.borgLayers.paletteHue':     CONN_OVERLAY_BORG_SEM,
        'message.borgLayers.fontSwap':       CONN_OVERLAY_BORG_SEM,
        'reconnected.enabled':               CONN_OVERLAY_RECON_ENABLED,
        'reconnected.text':                  CONN_OVERLAY_RECON_TEXT,
        'reconnected.color':                 CONN_OVERLAY_RECON_COLOR,
        'reconnected.auto_dismiss_seconds':  CONN_OVERLAY_RECON_DISMISS_SECS,
        'reconnected.font':                  CONN_OVERLAY_RECON_FONT,
        'reconnected.size':                  CONN_OVERLAY_RECON_SIZE,
        'reconnected.weight':                CONN_OVERLAY_RECON_WEIGHT,
        'reconnected.transform':             CONN_OVERLAY_RECON_TRANSFORM,
        'reconnected.content':               CONN_OVERLAY_RECON_CONTENT,
    };

    _set(path, value) {
        const keys = path.split('.');
        const cfg  = JSON.parse(JSON.stringify(this._editConfig ?? this._defaultConfig()));
        let node   = cfg;
        for (let i = 0; i < keys.length - 1; i++) {
            if (node[keys[i]] == null || typeof node[keys[i]] !== 'object') {
                node[keys[i]] = {};
            }
            node = node[keys[i]];
        }
        node[keys[keys.length - 1]] = value;
        this._editConfig = cfg;
        this._isDirty = true;
        // Track which flat storage key is dirty so _buildSparseConfig writes only it.
        const sKey = path.startsWith('layers')
            ? CONN_OVERLAY_SEM
            : (LCARdSConnectivityTab._PATH_TO_KEY[path] ?? null);
        if (sKey) this._dirtyServiceKeys.add(sKey);
    }

    /**
     * Build a sparse config containing only the fields the user explicitly changed.
     * `ConnectionOverlayService.saveConfig()` already skips keys absent from the config,
     * so passing a sparse object means only those keys are written to the target scope.
     */
    _buildSparseConfig(fullConfig, content, reconnectedContent) {
        const dk = this._dirtyServiceKeys;
        const C  = fullConfig;
        const r  = {};

        const topLevel = [
            [CONN_OVERLAY_ENABLED,          'enabled'],
            [CONN_OVERLAY_DISMISS,          'dismiss'],
            [CONN_OVERLAY_POSITION,         'position'],
            [CONN_OVERLAY_WIDTH,            'width'],
            [CONN_OVERLAY_HEIGHT,           'height'],
            [CONN_OVERLAY_DISCONNECT_DELAY, 'disconnect_delay_ms'],
            [CONN_OVERLAY_SEM,              'layers'],
        ];
        for (const [key, field] of topLevel) {
            if (dk.has(key)) r[field] = C[field];
        }
        if (dk.has(CONN_OVERLAY_CONTENT)) r.content = content;

        const msgFields = [
            [CONN_OVERLAY_MSG_MODE,      'mode'],
            [CONN_OVERLAY_MSG_TEXT,      'text'],
            [CONN_OVERLAY_MSG_COLOR,     'color'],
            [CONN_OVERLAY_MSG_FONT,      'font'],
            [CONN_OVERLAY_MSG_SIZE,      'size'],
            [CONN_OVERLAY_MSG_WEIGHT,    'weight'],
            [CONN_OVERLAY_MSG_TRANSFORM, 'transform'],
            [CONN_OVERLAY_BORG_SEM,      'borgLayers'],
        ];
        const dirtyMsg = msgFields.filter(([k]) => dk.has(k));
        if (dirtyMsg.length) {
            r.message = {};
            for (const [, f] of dirtyMsg) r.message[f] = C.message?.[f];
        }

        const reconFields = [
            [CONN_OVERLAY_RECON_ENABLED,      'enabled'],
            [CONN_OVERLAY_RECON_TEXT,         'text'],
            [CONN_OVERLAY_RECON_COLOR,        'color'],
            [CONN_OVERLAY_RECON_DISMISS_SECS, 'auto_dismiss_seconds'],
            [CONN_OVERLAY_RECON_FONT,         'font'],
            [CONN_OVERLAY_RECON_SIZE,         'size'],
            [CONN_OVERLAY_RECON_WEIGHT,       'weight'],
            [CONN_OVERLAY_RECON_TRANSFORM,    'transform'],
        ];
        const dirtyRecon = reconFields.filter(([k]) => dk.has(k));
        if (dirtyRecon.length || dk.has(CONN_OVERLAY_RECON_CONTENT)) {
            r.reconnected = {};
            for (const [, f] of dirtyRecon) r.reconnected[f] = C.reconnected?.[f];
            if (dk.has(CONN_OVERLAY_RECON_CONTENT)) r.reconnected.content = reconnectedContent;
        }

        return r;
    }

    /** Resolve a dot-notation path on _editConfig (e.g. 'message.borgLayers'). */
    _resolvePath(path) {
        return path.split('.').reduce((node, k) => (node == null ? undefined : node[k]), this._editConfig);
    }

    _getLayerPreset(slot, layersPath = 'layers') {
        return this._resolvePath(layersPath)?.[slot]?.preset ?? '__none__';
    }

    _getLayerParam(slot, param, layersPath = 'layers') {
        return this._resolvePath(layersPath)?.[slot]?.[param] ?? '';
    }

    _setLayerPreset(slot, preset, layersPath = 'layers') {
        if (preset === '__none__') {
            this._set(`${layersPath}.${slot}`, null);
        } else {
            const existing = this._resolvePath(layersPath)?.[slot] ?? {};
            // Reset to bare { preset } when switching presets; keep params only if same preset.
            this._set(`${layersPath}.${slot}`, existing.preset === preset ? existing : { preset });
        }
    }

    _setLayerParam(slot, param, value, layersPath = 'layers') {
        const existing = this._resolvePath(layersPath)?.[slot] ?? {};
        this._set(`${layersPath}.${slot}`, { ...existing, [param]: value });
    }

    // -------------------------------------------------------------------------
    // Scope change
    // -------------------------------------------------------------------------

    async _handleScopeChange(ev) {
        const info      = ev.detail ?? {};
        const newScope  = info.scope ?? 'user';
        this._scope     = newScope;
        this._scopeInfo = { scope: newScope, userId: info.userId ?? null, deviceId: info.deviceId ?? null, isAdminTarget: info.isAdminTarget ?? false };
        this._isDirty          = false;
        this._dirtyServiceKeys = new Set();
        this._confirmClear     = false;
        this._scopedValues = null;
        // Force-reload so this load always wins over any concurrently-running stale
        // load (e.g. from a previous scope tab click that started before this one).
        await this._loadScopedValues(true);
        if (!this.isConnected || !this._scopedValues) return;
        // Guard: if the user made edits while the load was in flight, don't clobber
        // their changes. willUpdate will rebuild on the next hass update if needed.
        if (this._isDirty) return;
        this._editConfig = this._buildEffectiveConfig();
        const cfg = this._editConfig;
        this._contentYaml = cfg.content ? yaml.dump(cfg.content, { indent: 2 }) : '';
        this._reconnectedContentYaml = cfg.reconnected?.content
            ? yaml.dump(cfg.reconnected.content, { indent: 2 }) : '';
    }

    // -------------------------------------------------------------------------

    render() {
        // Show spinner while actively loading OR when we have no data yet (e.g. waiting
        // for the integration onReady() retry — _loading may have cleared but _editConfig
        // is still null, which would otherwise fall through to _defaultConfig() and show
        // wrong values like enabled=false even though storage has enabled=true).
        if (this._loading || (!this._editConfig && !this._error)) {
            return html`<div class="loading">Loading settings…</div>`;
        }

        const cfg                = this._editConfig ?? this._defaultConfig();
        const messageMode        = cfg.message?.mode ?? 'text';
        const reconnectedEnabled = cfg.reconnected?.enabled ?? false;

        // Inline badge/clear helpers — same pattern as lcards-sound-config-tab.
        const sv             = this._scopedValues;
        const scope          = /** @type {'device'|'user'|'global'} */ (this._scope);
        const isAdminTarget  = this._scopeInfo?.isAdminTarget ?? false;
        // hasOverride: this scope has a stored value for key.
        // hasGlobal: global has a stored value (relevant when on user/device tab).
        const hasOverride    = (key) => (sv?.[key]?.[scope] ?? null) !== null;
        const hasGlobal      = (key) => scope !== 'global' && (sv?.[key]?.global ?? null) !== null;
        // Show a badge only when there is an actual stored value to attribute:
        //   • scope has an override → badge shows the scope name
        //   • no scope override but global has a value → badge shows 'global'
        //   • neither set (built-in default) → no badge
        const fieldBadge     = (key) => {
            if (!sv || this._scopedLoading) return nothing;
            if (hasOverride(key)) return originBadge(scope, isAdminTarget);
            if (hasGlobal(key))  return originBadge('global', isAdminTarget);
            return nothing;
        };
        const fieldClearBtn  = (key) => {
            if (!hasOverride(key)) return nothing;
            return html`<ha-icon-button
              .label=${'Clear override'}
              style="--ha-icon-button-size:32px; --mdc-icon-size:18px;"
              @click=${() => this._clearScopedValue(key)}
            ><ha-icon icon="mdi:close-circle-outline"></ha-icon></ha-icon-button>`;
        };
        // Convenience: badge + clear for common scope-unaware overlays (no SEM badge).
        const hasScopeData   = CONN_OVERLAY_ALL_KEYS.some(k => hasOverride(k));

        return html`
          <div class="studio-layout">

            ${this._error ? html`
              <div class="banner warning">
                <ha-icon icon="mdi:alert-circle-outline"></ha-icon>
                ${this._error}
              </div>
            ` : ''}

            ${this._remoteUpdatePending ? html`
              <div class="banner info">
                <ha-icon icon="mdi:information-outline"></ha-icon>
                Settings were updated from another device.
                <ha-button @click=${this._applyRemoteUpdate}>Discard edits &amp; refresh</ha-button>
              </div>
            ` : ''}

          <div class="scrollable-body">

            <!-- ── Feature overview ──────────────────────────────────── -->
            <lcards-message type="info">
              <strong>Connection Overlay</strong>
              <p style="margin:8px 0 4px 0; font-size:13px; line-height:1.5;">
                Displays a full-screen overlay whenever your browser loses its connection to Home Assistant —
                useful for kiosk displays so you always know when the dashboard is offline.
              </p>
              <p style="margin:0; font-size:13px; line-height:1.5;">
                Adjust the settings below, then use <em>Simulate Disconnect</em> at the bottom to preview
                how the overlay will look before saving your changes.  Settings are scoped per-device, per-user, or globally, so you can customize the experience for each display.
              </p>
            </lcards-message>

            <!-- ── Scope selector ────────────────────────────────────── -->
            <lcards-scope-selector
              .hass=${this.hass}
              showGlobal
              ?disabled=${this._saving || this._loading}
              @scope-changed=${this._handleScopeChange}>
            </lcards-scope-selector>

            ${this._isDirty ? html`
              <lcards-message type="warning">
                <strong>Unsaved changes</strong> — your edits won't take effect until you click <em>Save</em> below.
              </lcards-message>
            ` : ''}

            <!-- ── General ────────────────────────────────────────────── -->
            <lcards-form-section
              header="General"
              icon="mdi:wifi-off"
              ?expanded=${true}
              ?outlined=${true}>
              <div class="control-row">
                <ha-selector
                  .hass=${this.hass}
                  .label=${'Enable connection overlay'}
                  .helper=${'Show full-screen overlay when HA connection is lost'}
                  .selector=${{ boolean: {} }}
                  .value=${cfg.enabled}
                  @value-changed=${(e) => this._set('enabled', e.detail.value)}>
                </ha-selector>
                ${fieldBadge(CONN_OVERLAY_ENABLED)}
                ${fieldClearBtn(CONN_OVERLAY_ENABLED)}
              </div>
              <div class="control-row">
                <ha-selector
                  .hass=${this.hass}
                  .label=${'Allow user to dismiss'}
                  .helper=${'User can click the overlay backdrop to dismiss it'}
                  .selector=${{ boolean: {} }}
                  .value=${cfg.dismiss}
                  @value-changed=${(e) => this._set('dismiss', e.detail.value)}>
                </ha-selector>
                ${fieldBadge(CONN_OVERLAY_DISMISS)}
                ${fieldClearBtn(CONN_OVERLAY_DISMISS)}
              </div>
              <div class="control-row">
                <ha-selector
                  .hass=${this.hass}
                  .label=${'Disconnect tolerance (ms)'}
                  .helper=${'Delay before showing the overlay after a disconnect. Use 2000–5000 on mobile or unstable connections to avoid spurious triggers.'}
                  .selector=${{ number: { min: 0, max: 30000, step: 500, mode: 'box', unit_of_measurement: 'ms' } }}
                  .value=${cfg.disconnect_delay_ms ?? 2500}
                  @value-changed=${(e) => this._set('disconnect_delay_ms', e.detail.value)}>
                </ha-selector>
                ${fieldBadge(CONN_OVERLAY_DISCONNECT_DELAY)}
                ${fieldClearBtn(CONN_OVERLAY_DISCONNECT_DELAY)}
              </div>
            </lcards-form-section>

            <!-- ── Screen Overlay ────────────────────────────────────────────── -->
            <lcards-form-section
              header="Screen Overlay"
              icon="mdi:message-text-outline"
              ?expanded=${false}
              ?outlined=${true}>

              <!-- Mode selector -->
              <div class="control-row">
                <ha-selector
                  .hass=${this.hass}
                  .label=${'Display style'}
                  .helper=${'Simple text with basic styling controls; Custom card renders any HA card YAML'}
                  .selector=${{ select: { mode: 'dropdown', options: MODE_OPTIONS } }}
                  .value=${messageMode}
                  @value-changed=${(e) => this._set('message.mode', e.detail.value)}>
                </ha-selector>
              </div>

              ${messageMode === 'borg' ? html`

                <lcards-message type="info">
                  <strong>Borg Assimilation Mode</strong>
                  <p style="margin:8px 0 0 0; font-size:13px; line-height:1.4;">
                    On disconnect, the full Borg assimilation sequence will run instead of the standard overlay.
                    On reconnect, deassimilation is triggered automatically.
                    Text messages and custom cards are not used in this mode.
                  </p>
                </lcards-message>

                ${this._renderSlotPanel('canvas',   'Canvas Effect',   'mdi:monitor-shimmer', 'message.borgLayers', { lockPreset: true })}
                ${this._renderSlotPanel('backdrop', 'Backdrop Filter', 'mdi:image-filter',    'message.borgLayers')}
                ${this._renderSlotPanel('color',    'Colour Tint',     'mdi:palette',         'message.borgLayers')}

                <lcards-form-section
                  header="Palette Hue"
                  icon="mdi:palette-swatch"
                  description="The UI colour palette is shifted toward this hue when assimilation is active. Default is 110° (Borg yellow-green)."
                  ?expanded=${true}
                  ?outlined=${true}>
                  <ha-selector
                    .hass=${this.hass}
                    .label=${'Palette hue (degrees)'}
                    .helper=${'0° = red · 60° = yellow · 110° = Borg green (default) · 180° = cyan · 240° = blue · 300° = magenta'}
                    .selector=${{ number: { min: 0, max: 359, step: 1, mode: 'slider' } }}
                    .value=${this._editConfig?.message?.borgLayers?.paletteHue ?? 110}
                    @value-changed=${(e) => {
                        this._set('message.borgLayers.paletteHue', e.detail.value);
                    }}>
                  </ha-selector>
                </lcards-form-section>

                <lcards-form-section
                  header="Font Swap"
                  icon="mdi:format-font"
                  description="Replace the dashboard font with the Borg typeface during assimilation."
                  ?expanded=${true}
                  ?outlined=${true}>
                  <ha-selector
                    .hass=${this.hass}
                    .label=${'Enable Borg font replacement'}
                    .helper=${'When disabled, all other assimilation effects still run — only the font stays unchanged'}
                    .selector=${{ boolean: {} }}
                    .value=${this._editConfig?.message?.borgLayers?.fontSwap ?? true}
                    @value-changed=${(e) => {
                        this._set('message.borgLayers.fontSwap', e.detail.value);
                    }}>
                  </ha-selector>
                </lcards-form-section>

              ` : messageMode === 'text' ? html`

                <!-- Text mode: Connection Lost subsection -->
                <lcards-form-section
                  header="Connection Lost"
                  icon="mdi:wifi-off"
                  description="Text and style shown when the connection is lost."
                  ?expanded=${true}
                  ?outlined=${true}>
                  ${this._renderTextStyleControls(MSG_KEYS, cfg.message, '#93e1ff', fieldBadge, fieldClearBtn)}
                </lcards-form-section>

                <!-- Text mode: Connection Restored subsection -->
                <lcards-form-section
                  header="Connection Restored"
                  icon="mdi:wifi-check"
                  description="Optional brief confirmation when the connection returns."
                  ?expanded=${reconnectedEnabled}
                  ?outlined=${true}>
                  <div class="control-row">
                    <ha-selector
                      .hass=${this.hass}
                      .label=${'Show reconnect message'}
                      .selector=${{ boolean: {} }}
                      .value=${reconnectedEnabled}
                      @value-changed=${(e) => this._set('reconnected.enabled', e.detail.value)}>
                    </ha-selector>
                    ${fieldBadge(CONN_OVERLAY_RECON_ENABLED)}
                    ${fieldClearBtn(CONN_OVERLAY_RECON_ENABLED)}
                  </div>
                  <div class="${reconnectedEnabled ? '' : 'dimmed'}">
                    ${this._renderTextStyleControls(RECON_KEYS, cfg.reconnected, '#4caf50', fieldBadge, fieldClearBtn)}
                    <div class="control-row">
                      <ha-selector
                        .hass=${this.hass}
                        .label=${'Auto-dismiss after (seconds)'}
                        .helper=${'Overlay clears automatically after this many seconds'}
                        .selector=${{ number: { min: 1, max: 30, step: 1, mode: 'box' } }}
                        .value=${cfg.reconnected?.auto_dismiss_seconds ?? 3}
                        @value-changed=${(e) => this._set('reconnected.auto_dismiss_seconds', e.detail.value)}>
                      </ha-selector>
                      ${fieldBadge(CONN_OVERLAY_RECON_DISMISS_SECS)}
                      ${fieldClearBtn(CONN_OVERLAY_RECON_DISMISS_SECS)}
                    </div>
                  </div>
                </lcards-form-section>

              ` : html`

                <!-- Card mode: Connection Lost Card subsection -->
                <lcards-form-section
                  header="Connection Lost Card"
                  icon="mdi:wifi-off"
                  description="Any HA card shown when disconnected. Replaces the text message."
                  ?expanded=${true}
                  ?outlined=${true}>
                  ${this._contentYamlError ? html`
                    <div class="banner warning" style="margin-bottom:8px">
                      <ha-icon icon="mdi:alert-circle-outline"></ha-icon>
                      ${this._contentYamlError}
                    </div>
                  ` : ''}
                  <ha-code-editor
                    .hass=${this.hass}
                    .value=${this._contentYaml}
                    mode="yaml"
                    @value-changed=${(e) => { this._contentYaml = e.detail.value; this._contentYamlError = null; this._isDirty = true; this._dirtyServiceKeys.add(CONN_OVERLAY_CONTENT); }}>
                  </ha-code-editor>
                  <div class="control-row" style="margin-top:12px">
                    <lcards-position-picker
                      .value=${cfg.position ?? 'center'}
                      .label=${'Position'}
                      .helper=${'Where to anchor the card within the overlay'}
                      @value-changed=${(e) => this._set('position', e.detail.value)}>
                    </lcards-position-picker>
                  </div>
                  <lcards-message type="info">
                    <strong>Card Sizing</strong>
                    <p style="margin:8px 0 0 0; font-size:13px; line-height:1.4;">
                      You may need to specify sizing for the card(s) rendering area in order for them to properly display.  Especially true for dimensionless cards like grids, stacks, and other layout cards. Use CSS units (e.g. 400px, 30vw, auto) to set the width and height of the area the card can use within the overlay.
                    </p>
                  </lcards-message>
                  <div class="control-row">
                    <ha-selector
                      .hass=${this.hass}
                      .label=${'Width'}
                      .helper=${'CSS width — e.g. 400px, 40vw, auto'}
                      .selector=${{ text: {} }}
                      .value=${cfg.width ?? 'auto'}
                      @value-changed=${(e) => this._set('width', e.detail.value)}>
                    </ha-selector>
                  </div>
                  <div class="control-row">
                    <ha-selector
                      .hass=${this.hass}
                      .label=${'Height'}
                      .helper=${'CSS height — e.g. 300px, 30vh, auto'}
                      .selector=${{ text: {} }}
                      .value=${cfg.height ?? 'auto'}
                      @value-changed=${(e) => this._set('height', e.detail.value)}>
                    </ha-selector>
                  </div>
                </lcards-form-section>

                <!-- Card mode: Connection Restored Card subsection -->
                <lcards-form-section
                  header="Connection Restored Card"
                  icon="mdi:wifi-check"
                  description="Optional card shown briefly when the connection returns. Leave empty to fall back to a text message."
                  ?expanded=${reconnectedEnabled}
                  ?outlined=${true}>
                  <div class="control-row">
                    <ha-selector
                      .hass=${this.hass}
                      .label=${'Show reconnect message'}
                      .selector=${{ boolean: {} }}
                      .value=${reconnectedEnabled}
                      @value-changed=${(e) => this._set('reconnected.enabled', e.detail.value)}>
                    </ha-selector>
                    ${fieldBadge(CONN_OVERLAY_RECON_ENABLED)}
                    ${fieldClearBtn(CONN_OVERLAY_RECON_ENABLED)}
                  </div>
                  <div class="${reconnectedEnabled ? '' : 'dimmed'}">
                    ${this._reconnectedContentYamlError ? html`
                      <div class="banner warning" style="margin-bottom:8px">
                        <ha-icon icon="mdi:alert-circle-outline"></ha-icon>
                        ${this._reconnectedContentYamlError}
                      </div>
                    ` : ''}
                    <ha-code-editor
                      .hass=${this.hass}
                      .value=${this._reconnectedContentYaml}
                      mode="yaml"
                      @value-changed=${(e) => { this._reconnectedContentYaml = e.detail.value; this._reconnectedContentYamlError = null; this._isDirty = true; this._dirtyServiceKeys.add(CONN_OVERLAY_RECON_CONTENT); }}>
                    </ha-code-editor>
                    <div class="control-row" style="margin-top:12px">
                      <ha-selector
                        .hass=${this.hass}
                        .label=${'Auto-dismiss after (seconds)'}
                        .helper=${'Overlay clears automatically after this many seconds'}
                        .selector=${{ number: { min: 1, max: 30, step: 1, mode: 'box' } }}
                        .value=${cfg.reconnected?.auto_dismiss_seconds ?? 3}
                        @value-changed=${(e) => this._set('reconnected.auto_dismiss_seconds', e.detail.value)}>
                      </ha-selector>
                      ${fieldBadge(CONN_OVERLAY_RECON_DISMISS_SECS)}
                      ${fieldClearBtn(CONN_OVERLAY_RECON_DISMISS_SECS)}
                    </div>
                  </div>
                </lcards-form-section>

              `}

            </lcards-form-section>

            <!-- ── Effect Layers ──────────────────────────────────────── -->
            ${messageMode !== 'borg' ? html`
            <lcards-form-section
              header="Effect Layers"
              icon="mdi:layers-triple"
              description="Configure each effect layer independently. Leave a slot set to None to disable it."
              ?expanded=${false}
              ?outlined=${true}>
              <lcards-message type="info">
                <strong>Screen Effect Layers</strong>
                <p style="margin:8px 0 0 0; font-size:13px; line-height:1.4;">
                  Configure the full-screen effect composition applied during disconnection.
                  Presets and parameters are loaded from the registered SEM catalog.
                </p>
              </lcards-message>
              ${this._renderSlotPanel('canvas',   'Canvas Effect',    'mdi:image-multiple')}
              ${this._renderSlotPanel('color',    'Colour Overlay',   'mdi:palette')}
              ${this._renderSlotPanel('backdrop', 'Backdrop Filter',  'mdi:blur')}
            </lcards-form-section>
            ` : ''}

            <!-- ── Test Controls ──────────────────────────────────────── -->
            <lcards-form-section
              header="Test Controls"
              icon="mdi:flask-outline"
              description="Trigger the overlay live to preview your current panel settings. No save required."
              ?expanded=${true}
              ?outlined=${true}>
              <div class="control-row">
                <ha-button
                  ?disabled=${this._testActive}
                  @click=${this._handleTestShow}>
                  <ha-icon slot="icon" icon="mdi:wifi-off"></ha-icon>
                  Simulate Disconnect
                </ha-button>
                <ha-button
                  @click=${this._handleTestReconnect}>
                  <ha-icon slot="icon" icon="mdi:wifi"></ha-icon>
                  Simulate Reconnect
                </ha-button>
                <ha-button
                  @click=${this._handleTestHide}>
                  <ha-icon slot="icon" icon="mdi:close-circle-outline"></ha-icon>
                  Clear Test
                </ha-button>
              </div>
            </lcards-form-section>

            <!-- ── Actions ────────────────────────────────────────────── -->
            ${this._confirmClear ? html`
              <div class="banner warning">
                <ha-icon icon="mdi:alert"></ha-icon>
                <span>This will remove <strong>all ${this._scopeInfo.scope}-scoped overrides</strong> for the connection overlay — fields will fall back to lower scopes. Are you sure?</span>
                <div class="confirm-actions">
                  <ha-button variant="danger" ?disabled=${this._saving} @click=${this._resetScope}>
                    ${this._saving ? 'Resetting…' : 'Yes, reset all'}
                  </ha-button>
                  <ha-button ?disabled=${this._saving} @click=${this._cancelClearScope}>Cancel</ha-button>
                </div>
              </div>
            ` : ''}
            <div class="action-row">
              <ha-button
                variant="danger"
                ?disabled=${this._saving || !hasScopeData || this._confirmClear}
                title="Remove all stored overrides at this scope — fields fall back to lower scopes"
                @click=${this._requestClearScope}>
                <ha-icon slot="icon" icon="mdi:delete-sweep-outline"></ha-icon>
                Reset ${this._scopeInfo.scope}
              </ha-button>
              <ha-button
                ?disabled=${this._saving || !this._isDirty}
                title="Discard unsaved changes and revert to stored values"
                @click=${this._discardChanges}>
                <ha-icon slot="icon" icon="mdi:undo"></ha-icon>
                Discard changes
              </ha-button>
              <ha-button
                raised
                ?disabled=${this._saving || !this._isDirty}
                @click=${this._saveConfig}>
                ${this._saving ? 'Saving…' : `Save (${this._scopeInfo.scope})`}
              </ha-button>
              <ha-button
                ?disabled=${this._saving || this._reloadSent === 'config'}
                title="Push current stored config to all connected browsers"
                @click=${this._reloadAllDevices}>
                <ha-icon slot="icon" icon=${this._reloadSent === 'config' ? 'mdi:check' : 'mdi:refresh-auto'}></ha-icon>
                ${this._reloadSent === 'config' ? 'Sent!' : 'Push Live Config'}
              </ha-button>
              <ha-button
                variant="warning"
                ?disabled=${this._saving || this._reloadSent === 'pages'}
                title="Force a full page reload on all connected browsers (disruptive)"
                @click=${this._reloadAllPages}>
                <ha-icon slot="icon" icon=${this._reloadSent === 'pages' ? 'mdi:check' : 'mdi:reload-alert'}></ha-icon>
                ${this._reloadSent === 'pages' ? 'Sent!' : 'Reload All Clients'}
              </ha-button>
            </div>

          </div></div>
        `;
    }

    _getSlotPresets(slot) {
        return (window.lcards?.screenEffect?.catalog() ?? []).filter(p => p.slot === slot);
    }

    _renderSlotPanel(slot, label, slotIcon, layersPath = 'layers', { lockPreset = false } = {}) {
        const presets      = this._getSlotPresets(slot);
        const activePreset = this._getLayerPreset(slot, layersPath);
        const presetDef    = presets.find(p => p.name === activePreset);

        const options = [
            { value: '__none__', label: 'None (disabled)' },
            ...presets.map(p => ({ value: p.name, label: p.label ?? p.name })),
        ];

        return html`
          <lcards-form-section
            header=${label}
            icon=${slotIcon}
            ?expanded=${!!activePreset && activePreset !== '__none__'}
            ?outlined=${true}>
            ${lockPreset ? html`
              <lcards-message type="info">
                Configure settings for the <strong>${activePreset}</strong> screen effect.  Lower settings may be required for some devices.
              </lcards-message>
            ` : html`
              ${keyed(activePreset, html`
                <ha-selector
                  .hass=${this.hass}
                  .label=${'Effect Preset'}
                  .selector=${{ select: { mode: 'dropdown', options }}}
                  .value=${activePreset}
                  @value-changed=${(e) => this._setLayerPreset(slot, e.detail.value, layersPath)}>
                </ha-selector>
              `)}
            `}

            ${presetDef?.params_schema?.length ? html`
              ${presetDef.params_schema.map(spec => this._renderParamField({
                spec,
                value:    this._getLayerParam(slot, spec.key, layersPath),
                fallback: presetDef.defaults?.[spec.key] ?? spec.placeholder,
                onChange: (val) => this._setLayerParam(slot, spec.key, val, layersPath),
              }))}
            ` : ''}

          </lcards-form-section>
        `;
    }

    _renderParamField({ spec, value, fallback, onChange }) {
        if (spec.type === 'number') {
            const numVal = typeof value    === 'number' ? value
                         : typeof fallback === 'number' ? fallback
                         : (spec.min ?? 0);
            return html`
              <ha-selector
                .hass=${this.hass}
                .label=${spec.label}
                .helper=${spec.helper ?? ''}
                .selector=${{ number: {
                    min: spec.min ?? 0, max: spec.max ?? 1,
                    step: spec.step ?? 0.1, mode: 'slider',
                }}}
                .value=${numVal}
                @value-changed=${(e) => onChange(e.detail.value)}>
              </ha-selector>
            `;
        }
        const strVal = (value != null && value !== undefined) ? String(value)
                     : (fallback != null && fallback !== undefined) ? String(fallback)
                     : '';
        if (spec.type === 'color-text') {
            return html`
              <div class="color-field">
                <div class="field-label">${spec.label}</div>
                <lcards-color-picker
                  .hass=${this.hass}
                  .value=${strVal}
                  .showPreview=${true}
                  @value-changed=${(e) => onChange(e.detail.value || undefined)}>
                </lcards-color-picker>
                ${spec.helper ? html`
                  <div style="font-size:11px;color:var(--secondary-text-color);margin-top:2px;">
                    ${spec.helper}
                  </div>` : ''}
              </div>
            `;
        }
        return html`
          <ha-selector
            .hass=${this.hass}
            .label=${spec.label}
            .helper=${spec.helper ?? (spec.placeholder ? `e.g. ${spec.placeholder}` : '')}
            .selector=${{ text: {} }}
            .value=${strVal}
            @value-changed=${(e) => onChange(e.detail.value || undefined)}>
          </ha-selector>
        `;
    }

    // -------------------------------------------------------------------------
    // Text style controls helper
    // -------------------------------------------------------------------------

    /**
     * Render text + colour + full typography controls for a given config sub-path.
     * @param {Object} keyMap       - Flat storage key constants for each field (MSG_KEYS or RECON_KEYS).
     * @param {Object} textCfg     - The resolved sub-config object.
     * @param {string} defaultColor - Fallback colour swatch.
     * @param {Function} fieldBadge     - Inline badge helper from render().
     * @param {Function} fieldClearBtn  - Inline clear-button helper from render().
     */
    _renderTextStyleControls(keyMap, textCfg, defaultColor = '#93e1ff', fieldBadge, fieldClearBtn) {
        const prefix = keyMap === MSG_KEYS ? 'message' : 'reconnected';
        return html`
          <div class="control-row">
            <ha-selector
              .hass=${this.hass}
              .label=${'Message text'}
              .selector=${{ text: {} }}
              .value=${textCfg?.text ?? ''}
              @value-changed=${(e) => this._set(`${prefix}.text`, e.detail.value)}>
            </ha-selector>
            ${fieldBadge(keyMap.text)}
            ${fieldClearBtn(keyMap.text)}
          </div>
          <div class="color-field">
            <div class="field-label-row">
              <div class="field-label">Text colour</div>
              ${fieldBadge(keyMap.color)}
              ${fieldClearBtn(keyMap.color)}
            </div>
            <lcards-color-picker
              .hass=${this.hass}
              .value=${textCfg?.color ?? defaultColor}
              .showPreview=${true}
              @value-changed=${(e) => this._set(`${prefix}.color`, e.detail.value)}>
            </lcards-color-picker>
          </div>
          <div class="font-field">
            <lcards-font-selector
              .hass=${this.hass}
              label="Font"
              .value=${textCfg?.font ?? 'Antonio'}
              .showPreview=${true}
              @value-changed=${(e) => this._set(`${prefix}.font`, e.detail.value)}>
            </lcards-font-selector>
            <div class="field-badge-row">
              ${fieldBadge(keyMap.font)}
              ${fieldClearBtn(keyMap.font)}
            </div>
          </div>
          <div class="typo-row">
            <div class="typo-cell">
              <ha-selector
                .hass=${this.hass}
                .label=${'Size'}
                .selector=${{ number: { min: 1, max: 200, step: 1, mode: 'box', unit_of_measurement: 'px' } }}
                .value=${textCfg?.size ?? 26}
                @value-changed=${(e) => this._set(`${prefix}.size`, e.detail.value)}>
              </ha-selector>
              <div class="field-badge-row">
                ${fieldBadge(keyMap.size)}
                ${fieldClearBtn(keyMap.size)}
              </div>
            </div>
            <div class="typo-cell">
              <ha-selector
                .hass=${this.hass}
                .label=${'Weight'}
                .helper=${'e.g. 400, 700, bold, lighter'}
                .selector=${{ text: {} }}
                .value=${textCfg?.weight ?? '400'}
                @value-changed=${(e) => this._set(`${prefix}.weight`, e.detail.value)}>
              </ha-selector>
              <div class="field-badge-row">
                ${fieldBadge(keyMap.weight)}
                ${fieldClearBtn(keyMap.weight)}
              </div>
            </div>
            <div class="typo-cell">
              <ha-selector
                .hass=${this.hass}
                .label=${'Transform'}
                .selector=${{ select: { mode: 'dropdown', options: TRANSFORM_OPTIONS } }}
                .value=${textCfg?.transform ?? 'uppercase'}
                @value-changed=${(e) => this._set(`${prefix}.transform`, e.detail.value)}>
              </ha-selector>
              <div class="field-badge-row">
                ${fieldBadge(keyMap.transform)}
                ${fieldClearBtn(keyMap.transform)}
              </div>
            </div>
          </div>
        `;
    }

    // -------------------------------------------------------------------------
    // Styles
    // -------------------------------------------------------------------------

    static get styles() {
        return css`
            :host {
                flex: 1;
                display: flex;
                flex-direction: column;
                min-height: 0;
                overflow: hidden;
            }

            .studio-layout {
                flex: 1;
                display: flex;
                flex-direction: column;
                overflow: hidden;
                background: var(--primary-background-color);
                min-height: 0;
                border-radius: var(--ha-card-border-radius, 12px);
                padding: 16px;
            }

            .scrollable-body {
                flex: 1;
                overflow-y: auto;
                overflow-x: hidden;
                display: flex;
                flex-direction: column;
                gap: 16px;
                padding-bottom: 8px;
                /* Suppress lcards-form-section's own margin-bottom at top level;
                   gap handles spacing between direct children. */
                --lcards-section-spacing: 0;
            }

            /* Re-establish spacing between form sections nested inside a parent section. */
            lcards-form-section lcards-form-section {
                --lcards-section-spacing: 12px;
            }

            .banner {
                display: flex;
                align-items: center;
                gap: 12px;
                padding: 12px 16px;
                border-radius: var(--ha-border-radius-md);
                font-size: 0.9em;
            }
            .banner.warning {
                background: color-mix(in srgb, var(--warning-color, #ff9800) 15%, transparent);
                border: var(--ha-border-width-sm) solid color-mix(in srgb, var(--warning-color, #ff9800) 40%, transparent);
                color: var(--primary-text-color);
            }
            .banner.info {
                background: color-mix(in srgb, var(--info-color, #03a9f4) 12%, transparent);
                border: var(--ha-border-width-sm) solid color-mix(in srgb, var(--info-color, #03a9f4) 35%, transparent);
                color: var(--primary-text-color);
            }

            .dimmed {
                opacity: 0.5;
                pointer-events: none;
            }

            .control-row {
                display: flex;
                align-items: center;
                gap: 12px;
                padding: 8px 0;
                border-bottom: var(--ha-border-width-sm) solid color-mix(in srgb, var(--divider-color) 50%, transparent);
            }
            .control-row:last-child { border-bottom: none; }
            .control-row ha-selector { flex: 1; }

            .action-row {
                display: flex;
                justify-content: space-between;
                align-items: center;
                gap: 12px;
                padding: 8px 0;
            }

            .confirm-actions {
                display: flex;
                gap: 8px;
                margin-left: auto;
                flex-shrink: 0;
            }

            .loading {
                padding: 2rem;
                text-align: center;
                color: var(--secondary-text-color);
            }

            ha-code-editor {
                display: block;
                border-radius: 6px;
                overflow: hidden;
            }

            .color-field {
                padding: 8px 0;
                border-bottom: var(--ha-border-width-sm) solid color-mix(in srgb, var(--divider-color) 50%, transparent);
            }
            .color-field:last-child { border-bottom: none; }

            .font-field {
                padding: 8px 0;
                border-bottom: var(--ha-border-width-sm) solid color-mix(in srgb, var(--divider-color) 50%, transparent);
            }

            .typo-row {
                display: grid;
                grid-template-columns: 1fr 1fr 1fr;
                gap: 8px;
                padding: 8px 0;
                border-bottom: var(--ha-border-width-sm) solid color-mix(in srgb, var(--divider-color) 50%, transparent);
            }
            .typo-row:last-child { border-bottom: none; }

            .field-label {
                font-size: 12px;
                font-weight: 500;
                color: var(--secondary-text-color);
                margin-bottom: 4px;
                padding: 0 2px;
            }

            /* Label row: label text + scope badge + clear button inline */
            .field-label-row {
                display: flex;
                align-items: center;
                gap: 6px;
                flex-wrap: wrap;
                margin-bottom: 4px;
                padding: 0 2px;
            }
            .field-label-row .field-label {
                margin-bottom: 0;
            }

            /* Badge + clear button row beneath a standalone control (font, typo cells) */
            .field-badge-row {
                display: flex;
                align-items: center;
                gap: 4px;
                min-height: 20px;
                margin-top: 2px;
                padding: 0 2px;
            }

            /* Wrapper for each cell in the 2×2 typography grid */
            .typo-cell {
                display: flex;
                flex-direction: column;
            }
        `;
    }
}

if (!customElements.get('lcards-connectivity-tab')) {
    customElements.define('lcards-connectivity-tab', LCARdSConnectivityTab);
}
