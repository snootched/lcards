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
    { value: 'borg', label: 'Borg assimilation 👾' },
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
         * Per-scope data for all 23 flat keys: { [key]: { device, user, global, resolved } }.
         * Null while loading.  Populated by _loadScopedValues() via readAllScopes().
         */
        _scopedValues:  { type: Object,  state: true },
        _scopedLoading: { type: Boolean, state: true },
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
        this._boundHandleOverlayDismiss = () => { this._testActive = false; };
    }

    connectedCallback() {
        super.connectedCallback();
        this._loadConfig();
        document.addEventListener('lcards-connection-overlay-dismissed', this._boundHandleOverlayDismiss);
    }


    disconnectedCallback() {
        super.disconnectedCallback();
        document.removeEventListener('lcards-connection-overlay-dismissed', this._boundHandleOverlayDismiss);
    }

    willUpdate(changedProps) {
        super.willUpdate(changedProps);
        if (changedProps.has('hass') && this.hass && !this._editConfig) {
            this._loadConfig();
        }
    }

    // -------------------------------------------------------------------------
    // Data operations
    // -------------------------------------------------------------------------

    /**
     * Load per-scope data for all 23 flat keys in one parallel batch.
     * Populates _scopedValues: { [key]: { device, user, global, resolved } }.
     */
    async _loadScopedValues() {
        const sss = window.lcards?.core?.scopedSettingsService;
        if (!sss || this._scopedLoading) return;
        this._scopedLoading = true;
        try {
            const results = await Promise.all(CONN_OVERLAY_ALL_KEYS.map(k => sss.readAllScopes(k)));
            this._scopedValues = Object.fromEntries(CONN_OVERLAY_ALL_KEYS.map((k, i) => [k, results[i]]));
        } catch (err) {
            lcardsLog.warn('[ConnectivityTab] Failed to load scope data:', err);
            this._scopedValues = null;
        } finally {
            this._scopedLoading = false;
        }
    }

    /**
     * Assemble the nested config shape from the resolved (waterfall) values in _scopedValues.
     * Falls back to built-in defaults when no override is set at any scope.
     * @returns {Object}
     */
    _buildEffectiveConfig() {
        const sv = this._scopedValues;
        const D  = this._defaultConfig();
        const r  = (key, fallback) => sv?.[key]?.resolved ?? fallback;
        return {
            enabled:  r(CONN_OVERLAY_ENABLED,  D.enabled),
            dismiss:  r(CONN_OVERLAY_DISMISS,   D.dismiss),
            position: r(CONN_OVERLAY_POSITION,  D.position),
            width:    r(CONN_OVERLAY_WIDTH,     D.width),
            height:   r(CONN_OVERLAY_HEIGHT,    D.height),
            content:  r(CONN_OVERLAY_CONTENT,   D.content),
            layers:   r(CONN_OVERLAY_SEM,       D.layers),
            message: {
                mode:      r(CONN_OVERLAY_MSG_MODE,      D.message.mode),
                text:      r(CONN_OVERLAY_MSG_TEXT,      D.message.text),
                color:     r(CONN_OVERLAY_MSG_COLOR,     D.message.color),
                font:      r(CONN_OVERLAY_MSG_FONT,      D.message.font),
                size:      r(CONN_OVERLAY_MSG_SIZE,      D.message.size),
                weight:    r(CONN_OVERLAY_MSG_WEIGHT,    D.message.weight),
                transform: r(CONN_OVERLAY_MSG_TRANSFORM, D.message.transform),
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
            // Assemble the effective nested config from resolved flat values.
            this._editConfig = this._buildEffectiveConfig();
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

        const configToSave = {
            ...this._editConfig,
            content,
            reconnected: {
                ...this._editConfig.reconnected,
                content: reconnectedContent,
            },
        };
        this._saving = true;
        this._error  = null;
        try {
            // Delegate nested→flat mapping to the service; it writes each key individually.
            await window.lcards?.connectionOverlay?.saveConfig(configToSave, this._scopeInfo.scope);
            // Reload scoped values and rebuild the effective config for badges + form.
            this._scopedValues = null;
            await this._loadScopedValues();
            this._editConfig = this._buildEffectiveConfig();
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
        this._saving = true;
        this._error  = null;
        try {
            await window.lcards?.connectionOverlay?.clearConfig(this._scopeInfo.scope);
            this._scopedValues = null;
            await this._loadScopedValues();
            this._editConfig = this._buildEffectiveConfig();
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

    /** Clear a single flat key override at the current scope, then reload. */
    async _clearScopedValue(key) {
        const sss = window.lcards?.core?.scopedSettingsService;
        if (!sss) return;
        this._saving = true;
        try {
            await sss.clear(key, this._scope);
            this._scopedValues = null;
            await this._loadScopedValues();
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
            enabled:  true,
            dismiss:  true,
            position: 'center',
            width:    'auto',
            height:   'auto',
            message: {
                text:      'Connection Lost',
                color:     'var(--error-color)',
                mode:      'text',
                font:      'Antonio',
                size:      32,
                weight:    '400',
                transform: 'uppercase',
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
            window.lcards?.core?.borgAssimilationManager?.assimilate();
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
    }

    _getLayerPreset(slot) {
        return this._editConfig?.layers?.[slot]?.preset ?? '__none__';
    }

    _getLayerParam(slot, param) {
        return this._editConfig?.layers?.[slot]?.[param] ?? '';
    }

    _setLayerPreset(slot, preset) {
        if (preset === '__none__') {
            this._set(`layers.${slot}`, null);
        } else {
            const existing = this._editConfig?.layers?.[slot] ?? {};
            // Reset to bare { preset } when switching presets; keep params only if same preset.
            this._set(`layers.${slot}`, existing.preset === preset ? existing : { preset });
        }
    }

    _setLayerParam(slot, param, value) {
        const existing = this._editConfig?.layers?.[slot] ?? {};
        this._set(`layers.${slot}`, { ...existing, [param]: value });
    }

    // -------------------------------------------------------------------------
    // Scope change
    // -------------------------------------------------------------------------

    _handleScopeChange(ev) {
        const info      = ev.detail ?? {};
        const newScope  = info.scope ?? 'user';
        this._scope     = newScope;
        this._scopeInfo = { scope: newScope, userId: info.userId ?? null, deviceId: info.deviceId ?? null, isAdminTarget: info.isAdminTarget ?? false };
        // Reload flat-key scope data on every scope switch so badges reflect the new scope.
        this._scopedValues = null;
        this._loadScopedValues();
    }

    // -------------------------------------------------------------------------

    render() {
        if (this._loading) {
            return html`<div class="loading">Loading settings…</div>`;
        }

        const cfg                = this._editConfig ?? this._defaultConfig();
        const messageMode        = cfg.message?.mode ?? 'text';
        const reconnectedEnabled = cfg.reconnected?.enabled ?? false;

        // Inline badge/clear helpers — same pattern as lcards-sound-config-tab.
        const sv             = this._scopedValues;
        const scope          = /** @type {'device'|'user'|'global'} */ (this._scope);
        const isAdminTarget  = this._scopeInfo?.isAdminTarget ?? false;
        const hasOverride    = (key) => (sv?.[key]?.[scope] ?? null) !== null;
        const fieldBadge     = (key) => (!sv || this._scopedLoading) ? nothing
                                        : originBadge(hasOverride(key) ? scope : 'global', isAdminTarget);
        const fieldClearBtn  = (key) => {
            if (!hasOverride(key)) return nothing;
            return html`<ha-icon-button
              .label=${'Clear override'}
              style="--mdc-icon-button-size:32px; --mdc-icon-size:18px;"
              @click=${() => this._clearScopedValue(key)}
            ><ha-icon icon="mdi:close-circle-outline"></ha-icon></ha-icon-button>`;
        };
        // Convenience: badge + clear for common scope-unaware overlays (no SEM badge).
        const hasScopeData   = CONN_OVERLAY_ALL_KEYS.some(k => hasOverride(k));

        return html`
          <div class="studio-layout"><div class="scrollable-body">

            ${this._error ? html`
              <div class="banner warning">
                <ha-icon icon="mdi:alert-circle-outline"></ha-icon>
                ${this._error}
              </div>
            ` : ''}

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
              @scope-changed=${this._handleScopeChange}>
            </lcards-scope-selector>

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
            </lcards-form-section>

            <!-- ── Messages ────────────────────────────────────────────── -->
            <lcards-form-section
              header="Messages"
              icon="mdi:message-text-outline"
              ?expanded=${false}
              ?outlined=${true}>

              <!-- Mode selector -->
              <div class="control-row">
                <ha-selector
                  .hass=${this.hass}
                  .label=${'Display style'}
                  .helper=${'Simple text uses built-in styling controls; Custom card renders any HA card YAML; Borg mode triggers the assimilation easter egg instead of the standard overlay'}
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
                    Text, card, and effect layer settings are not used in this mode.
                  </p>
                </lcards-message>

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
                    @value-changed=${(e) => { this._contentYaml = e.detail.value; this._contentYamlError = null; }}>
                  </ha-code-editor>
                  <div class="control-row" style="margin-top:12px">
                    <lcards-position-picker
                      .value=${cfg.position ?? 'center'}
                      .label=${'Position'}
                      .helper=${'Where to anchor the card within the overlay'}
                      @value-changed=${(e) => this._set('position', e.detail.value)}>
                    </lcards-position-picker>
                  </div>
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
                      @value-changed=${(e) => { this._reconnectedContentYaml = e.detail.value; this._reconnectedContentYamlError = null; }}>
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
            <div class="action-row">
              <ha-button
                ?disabled=${this._saving || !hasScopeData}
                @click=${this._resetScope}>
                <ha-icon slot="icon" icon="mdi:delete-sweep-outline"></ha-icon>
                Clear ${this._scopeInfo.scope}
              </ha-button>
              <ha-button
                raised
                ?disabled=${this._saving}
                @click=${this._saveConfig}>
                ${this._saving ? 'Saving…' : `Save (${this._scopeInfo.scope})`}
              </ha-button>
            </div>

          </div></div>
        `;
    }

    _getSlotPresets(slot) {
        return (window.lcards?.screenEffect?.catalog() ?? []).filter(p => p.slot === slot);
    }

    _renderSlotPanel(slot, label, slotIcon) {
        const presets      = this._getSlotPresets(slot);
        const activePreset = this._getLayerPreset(slot);
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
            ${keyed(activePreset, html`
              <ha-selector
                .hass=${this.hass}
                .label=${'Effect Preset'}
                .selector=${{ select: { mode: 'dropdown', options }}}
                .value=${activePreset}
                @value-changed=${(e) => this._setLayerPreset(slot, e.detail.value)}>
              </ha-selector>
            `)}

            ${presetDef?.params_schema?.length ? html`
              ${presetDef.params_schema.map(spec => this._renderParamField({
                spec,
                value:    this._getLayerParam(slot, spec.key),
                fallback: presetDef.defaults?.[spec.key] ?? spec.placeholder,
                onChange: (val) => this._setLayerParam(slot, spec.key, val),
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
        const strVal = value    !== undefined ? String(value)
                     : fallback !== undefined ? String(fallback)
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
                border-radius: 8px;
                font-size: 0.9em;
            }
            .banner.warning {
                background: color-mix(in srgb, var(--warning-color, #ff9800) 15%, transparent);
                border: 1px solid color-mix(in srgb, var(--warning-color, #ff9800) 40%, transparent);
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
                border-bottom: 1px solid color-mix(in srgb, var(--divider-color) 50%, transparent);
            }
            .control-row:last-child { border-bottom: none; }
            .control-row ha-selector { flex: 1; }

            .action-row {
                display: flex;
                justify-content: flex-end;
                align-items: center;
                gap: 12px;
                padding: 8px 0;
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
                border-bottom: 1px solid color-mix(in srgb, var(--divider-color) 50%, transparent);
            }
            .color-field:last-child { border-bottom: none; }

            .font-field {
                padding: 8px 0;
                border-bottom: 1px solid color-mix(in srgb, var(--divider-color) 50%, transparent);
            }

            .typo-row {
                display: grid;
                grid-template-columns: 1fr 1fr 1fr;
                gap: 8px;
                padding: 8px 0;
                border-bottom: 1px solid color-mix(in srgb, var(--divider-color) 50%, transparent);
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
