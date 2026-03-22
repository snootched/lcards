/**
 * @fileoverview LCARdS Sound Config Tab - UI for managing sound system settings
 *
 * Provides a full configuration UI for the LCARdS sound system:
 * - Helper status (create missing helpers inline)
 * - Master enable / volume controls
 * - Per-category toggles (cards, UI navigation, alerts)
 * - Sound scheme selector with preview
 * - Per-event override table with asset picker and preview per row
 *
 * Reads from window.lcards.core.soundManager and window.lcards.core.helperManager.
 *
 * @element lcards-sound-config-tab
 */

import { LitElement, html, css } from 'lit';
import { lcardsLog } from '../../utils/lcards-logging.js';
import '../../editor/components/shared/lcards-form-section.js';
import '../../editor/components/shared/lcards-message.js';

const CATEGORY_LABELS = {
  cards:  'Card Interactions',
  ui:     'UI Navigation',
  alerts: 'Alerts & System',
};

// Fill colours for the per-event category chips (matching the former .category-badge palette)
const CATEGORY_CHIP_BG = {
  cards:  'color-mix(in srgb, var(--info-color, #03a9f4) 20%, transparent)',
  ui:     'color-mix(in srgb, var(--success-color, #4caf50) 20%, transparent)',
  alerts: 'color-mix(in srgb, var(--warning-color, #ff9800) 20%, transparent)',
};
const CATEGORY_CHIP_FG = {
  cards:  'var(--info-color, #03a9f4)',
  ui:     'var(--success-color, #4caf50)',
  alerts: 'var(--warning-color, #ff9800)',
};

export class LCARdSSoundConfigTab extends LitElement {
  static properties = {
    hass:               { type: Object },
    _helpers:           { type: Array,    state: true },
    _audioAssets:       { type: Array,    state: true },
    _overrides:         { type: Object,   state: true },
    _schemeNames:       { type: Array,    state: true },
    _eventTypes:        { type: Array,    state: true },
    _creatingHelpers:   { type: Boolean,  state: true },
  };

  constructor() {
    super();
    /** @type {any} */
    this.hass = undefined;
    this._helpers             = [];
    this._audioAssets         = [];
    this._overrides           = {};
    this._schemeNames         = ['none'];
    this._eventTypes          = [];
    this._creatingHelpers     = false;
    /** @type {Function[]} Unsubscribe functions for helper state subscriptions */
    this._helperSubscriptions = [];
  }

  connectedCallback() {
    super.connectedCallback();
    this._refresh();
    this._subscribeToHelpers();
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this._helperSubscriptions.forEach(unsub => unsub());
    this._helperSubscriptions = [];
  }

  /**
   * Propagate hass and refresh when it becomes available
   */
  willUpdate(changedProps) {
    super.willUpdate(changedProps);
    if (changedProps.has('hass') && this.hass) {
      this._refresh();
    }
  }

  // ============================================================================
  // DATA LOADING
  // ============================================================================

  _refresh() {
    const sm  = window.lcards?.core?.soundManager;
    const hm  = window.lcards?.core?.helperManager;
    const am  = window.lcards?.core?.assetManager;

    if (!hm) return;

    // Read current values directly from this.hass.states so we always get the
    // live HA state regardless of whether hm._valueCache has been populated yet.
    this._helpers = (hm.getHelpersByCategory('sound') || []).map(h => {
      const entityState = this.hass?.states?.[h.entity_id];
      return {
        ...h,
        exists:       !!entityState,
        currentValue: entityState ? entityState.state : (hm.getHelperValue(h.key) ?? h.default_value),
      };
    });

    // Audio assets from AssetManager
    if (am) {
      try {
        const registry = am.getRegistry('audio');
        this._audioAssets = Array.from(registry.assets.entries()).map(([key, entry]) => ({
          key,
          description: entry.metadata?.description || key,
          pack: entry.metadata?.pack || 'unknown',
        }));
      } catch {
        this._audioAssets = [];
      }
    }

    // Scheme names and event types from SoundManager
    if (sm) {
      this._schemeNames = sm.getSchemeNames();
      this._eventTypes  = sm.getEventTypes();
      this._overrides   = sm.getOverrides();
    }

    this.requestUpdate();
  }

  /**
   * Subscribe to all sound helpers via HelperManager so the UI stays in sync
   * when values change externally (e.g. from another browser tab or HA UI).
   * Called once on connectedCallback; re-subscribes safely if already clean.
   */
  _subscribeToHelpers() {
    const hm = window.lcards?.core?.helperManager;
    if (!hm) return;

    const soundHelperKeys = (hm.getHelpersByCategory('sound') || []).map(h => h.key);

    soundHelperKeys.forEach(key => {
      const unsub = hm.subscribeToHelper(key, (newValue) => {
        this._helpers = this._helpers.map(h =>
          h.key === key ? { ...h, currentValue: newValue } : h
        );
        this.requestUpdate();
        lcardsLog.trace(`[SoundConfigTab] Helper updated: ${key} = ${newValue}`);
      });
      this._helperSubscriptions.push(unsub);
    });

    lcardsLog.debug(`[SoundConfigTab] Subscribed to ${soundHelperKeys.length} sound helpers`);
  }

  // ============================================================================
  // HELPER ACTIONS
  // ============================================================================

  async _createAllMissingHelpers() {
    const hm = window.lcards?.core?.helperManager;
    if (!hm) return;

    this._creatingHelpers = true;
    this.requestUpdate();

    try {
      for (const h of this._helpers.filter(h => !h.exists)) {
        await hm.ensureHelper(h.key);
        lcardsLog.info(`[SoundConfigTab] Created helper: ${h.key}`);
      }
    } catch (e) {
      lcardsLog.error('[SoundConfigTab] Failed to create helpers:', e);
    }

    this._creatingHelpers = false;
    this._refresh();
  }

  async _createHelper(key) {
    const hm = window.lcards?.core?.helperManager;
    if (!hm) return;
    try {
      await hm.ensureHelper(key);
      this._refresh();
    } catch (e) {
      lcardsLog.error(`[SoundConfigTab] Failed to create helper ${key}:`, e);
    }
  }

  // ============================================================================
  // HELPER VALUE CONTROLS
  // ============================================================================

  async _setHelperValue(key, value) {
    const hm = window.lcards?.core?.helperManager;
    if (!hm) return;
    try {
      await hm.setHelperValue(key, value);
      // Update local cache immediately
      this._helpers = this._helpers.map(h => h.key === key ? { ...h, currentValue: value } : h);
      this.requestUpdate();
    } catch (e) {
      lcardsLog.error(`[SoundConfigTab] Failed to set ${key}:`, e);
    }
  }

  // ============================================================================
  // SOUND CONTROL HELPERS
  // ============================================================================

  _getHelperValue(key) {
    return this._helpers.find(h => h.key === key)?.currentValue;
  }

  _helperExists(key) {
    return this._helpers.find(h => h.key === key)?.exists ?? false;
  }

  _masterEnabled() {
    const v = this._getHelperValue('sound_enabled');
    return v === true || v === 'on';
  }

  async _previewScheme(schemeName) {
    window.lcards?.core?.soundManager?.previewScheme(schemeName);
  }

  async _previewAsset(assetKey) {
    if (!assetKey || assetKey === '__scheme__' || assetKey === '__mute__') return;
    window.lcards?.core?.soundManager?.preview(assetKey);
  }

  /** Preview the effective sound for an event (resolves override → scheme). */
  _previewEvent(eventType) {
    window.lcards?.core?.soundManager?.previewEvent(eventType);
  }

  async _setOverride(eventType, value) {
    const sm = window.lcards?.core?.soundManager;
    if (!sm) return;
    // '__mute__' means null (silence); '__scheme__' means clear override (use scheme)
    if (value === '__mute__') {
      await sm.setOverride(eventType, null);
    } else if (value === '__scheme__') {
      await sm.setOverride(eventType, null);
    } else {
      await sm.setOverride(eventType, value);
    }
    this._overrides = sm.getOverrides();
    this.requestUpdate();
  }

  _resetOverrides() {
    const sm = window.lcards?.core?.soundManager;
    if (!sm) return;
    sm.clearAllOverrides();
    this._overrides = sm.getOverrides();
    this.requestUpdate();
  }

  _overrideValueFor(eventType) {
    if (eventType in this._overrides) {
      const v = this._overrides[eventType];
      return v === null ? '__mute__' : v;
    }
    return '__scheme__';
  }

  // ============================================================================
  // RENDER
  // ============================================================================

  render() {
    const missing = this._helpers.filter(h => !h.exists);
    const masterEnabled = this._masterEnabled();
    const schemeValue = this._getHelperValue('sound_scheme') || 'none';
    const volumeValue = parseFloat(this._getHelperValue('sound_volume') ?? 0.5);

    return html`
      <div class="studio-layout"><div class="scrollable-body">

        <!-- ── MISSING HELPERS BANNER ── -->
        ${missing.length > 0 ? html`
          <div class="banner warning">
            <ha-icon icon="mdi:alert-circle"></ha-icon>
            <span>${missing.length} sound helper${missing.length > 1 ? 's are' : ' is'} missing in Home Assistant.</span>
            <ha-button
              @click=${this._createAllMissingHelpers}
              ?disabled=${this._creatingHelpers}
            >
              ${this._creatingHelpers ? 'Creating…' : 'Create All'}
            </ha-button>
          </div>
        ` : ''}

        <!-- ── MASTER CONTROLS ── -->
        <lcards-form-section
          header="Master Controls"
          icon="mdi:volume-high"
          ?expanded=${true}
          ?outlined=${true}>

          <div class="control-row prominent">
            <div class="control-label">
              <strong>Sound Effects Enabled</strong>
              <span class="hint">Master on/off for all LCARdS sounds</span>
            </div>
            <ha-selector
              .hass=${this.hass}
              .selector=${{ boolean: {} }}
              .value=${masterEnabled}
              ?disabled=${!this._helperExists('sound_enabled')}
              @value-changed=${(e) => { e.stopPropagation(); this._setHelperValue('sound_enabled', e.detail.value); }}
            ></ha-selector>
          </div>

          <div class="control-row ${!masterEnabled ? 'dimmed' : ''}">
            <div class="control-label">
              Volume
              <span class="hint">Master volume for all sound effects</span>
            </div>
            <ha-selector
              .hass=${this.hass}
              .selector=${{ number: { min: 0, max: 1, step: 0.05, mode: 'slider' } }}
              .value=${volumeValue}
              ?disabled=${!this._helperExists('sound_volume') || !masterEnabled}
              @value-changed=${(e) => this._setHelperValue('sound_volume', e.detail.value)}
            ></ha-selector>
          </div>
        </lcards-form-section>

        <!-- ── CATEGORY TOGGLES ── -->
        <lcards-form-section
          header="Sound Categories"
          icon="mdi:tune"
          ?expanded=${true}
          ?outlined=${true}
          class="${!masterEnabled ? 'dimmed' : ''}">

          ${[
            { key: 'sound_cards_enabled',  icon: 'mdi:gesture-tap',  label: 'Card Interaction Sounds',   hint: 'Button taps, holds, sliders, toggles' },
            { key: 'sound_ui_enabled',     icon: 'mdi:navigation',   label: 'UI Navigation Sounds',      hint: 'Sidebar, page transitions, menus' },
            { key: 'sound_alerts_enabled', icon: 'mdi:alert-circle', label: 'Alert & System Sounds',     hint: 'Alert mode changes, system events' },
          ].map(cat => html`
            <div class="control-row">
              <div class="control-label">
                <ha-icon icon="${cat.icon}"></ha-icon>
                ${cat.label}
                <span class="hint">${cat.hint}</span>
              </div>
              <ha-selector
                .hass=${this.hass}
                .selector=${{ boolean: {} }}
                .value=${this._getHelperValue(cat.key) !== 'off' && this._getHelperValue(cat.key) !== false}
                ?disabled=${!this._helperExists(cat.key) || !masterEnabled}
                @value-changed=${(e) => { e.stopPropagation(); this._setHelperValue(cat.key, e.detail.value); }}
              ></ha-selector>
            </div>
          `)}
        </lcards-form-section>

        <!-- ── SOUND SCHEME ── -->
        <lcards-form-section
          header="Sound Scheme"
          icon="mdi:music-box-multiple"
          ?expanded=${true}
          ?outlined=${true}
          class="${!masterEnabled ? 'dimmed' : ''}">

          ${this._schemeNames.length <= 1 ? html`
            <div class="empty-hint">
              <ha-icon icon="mdi:information-outline"></ha-icon>
              No audio packs loaded. Add an audio pack to get sound schemes.
            </div>
          ` : ''}

          <div class="control-row">
            <div class="control-label">
              Active Scheme
              <span class="hint">Select a sound scheme provided by audio packs</span>
            </div>
            <div class="scheme-row">
              <ha-selector
                .hass=${this.hass}
                .selector=${{ select: {
                  options: this._schemeNames.map(s => ({ value: s, label: s === 'none' ? 'None (silent)' : s })),
                  mode: 'dropdown'
                }}}
                .value=${schemeValue}
                ?disabled=${!this._helperExists('sound_scheme') || !masterEnabled}
                @value-changed=${(e) => this._setHelperValue('sound_scheme', e.detail.value)}
              ></ha-selector>
              ${schemeValue !== 'none' ? html`
                <ha-button
                  @click=${() => this._previewScheme(schemeValue)}
                  ?disabled=${!masterEnabled}
                >
                  <ha-icon slot="start" icon="mdi:play-circle"></ha-icon>
                  Preview
                </ha-button>
              ` : ''}
            </div>
          </div>
        </lcards-form-section>

        <!-- ── PER-EVENT OVERRIDES ── -->
        <lcards-form-section
          header="Per-Event Overrides"
          icon="mdi:tune-variant"
          description="Override individual events regardless of the active scheme"
          ?expanded=${true}
          ?outlined=${true}
          class="${!masterEnabled ? 'dimmed' : ''}">

          ${this._audioAssets.length === 0 ? html`
            <div class="empty-hint">
              <ha-icon icon="mdi:information-outline"></ha-icon>
              No audio assets registered. Load an audio pack to enable overrides.
            </div>
          ` : ''}

          ${this._eventTypes.length > 0 ? html`
            <div class="overrides-header-row">
              <lcards-message
                type="info"
                message="Overrides are stored in this browser only — configure each device separately."
              ></lcards-message>
              ${Object.keys(this._overrides).length > 0 ? html`
                <ha-button @click=${this._resetOverrides} class="reset-overrides-btn">
                  <ha-icon slot="start" icon="mdi:restore"></ha-icon>
                  Reset all to scheme defaults
                </ha-button>
              ` : ''}
            </div>
            <div class="overrides-table-wrapper">
              <table class="overrides-table">
                <thead>
                  <tr>
                    <th>Event</th>
                    <th>Category</th>
                    <th>Override</th>
                    <th style="width:60px;"></th>
                  </tr>
                </thead>
                <tbody>
                  ${this._eventTypes.map(evt => {
                    const overrideValue = this._overrideValueFor(evt.key);
                    const isCustom = overrideValue !== '__scheme__';
                    return html`
                      <tr class="${isCustom ? 'has-override' : ''}">
                        <td class="event-label">${evt.label}</td>
                        <td>
                          <ha-assist-chip
                            .filled=${true}
                            .label=${CATEGORY_LABELS[evt.category] || evt.category}
                            style="
                              --ha-assist-chip-filled-container-color: ${CATEGORY_CHIP_BG[evt.category] || 'var(--secondary-background-color)'};
                              --md-assist-chip-label-text-color: ${CATEGORY_CHIP_FG[evt.category] || 'var(--primary-text-color)'};
                              --md-sys-color-on-surface: ${CATEGORY_CHIP_FG[evt.category] || 'var(--primary-text-color)'};
                            "
                          ></ha-assist-chip>
                        </td>
                        <td>
                          <ha-selector
                            .hass=${this.hass}
                            .selector=${{ select: {
                              options: [
                                { value: '__scheme__', label: '— Use scheme default —' },
                                { value: '__mute__',   label: '🔇 Mute this event' },
                                ...this._audioAssets.map(a => ({ value: a.key, label: `${a.key} (${a.pack})` }))
                              ],
                              mode: 'dropdown'
                            }}}
                            .value=${overrideValue}
                            ?disabled=${!masterEnabled}
                            @value-changed=${(e) => this._setOverride(evt.key, e.detail.value)}
                          ></ha-selector>
                        </td>
                        <td>
                          ${overrideValue !== '__mute__' ? html`
                            <ha-icon-button
                              .label=${'Preview'}
                              @click=${() => overrideValue === '__scheme__'
                                ? this._previewEvent(evt.key)
                                : this._previewAsset(overrideValue)}
                              ?disabled=${!masterEnabled}
                            >
                              <ha-icon icon="mdi:play"></ha-icon>
                            </ha-icon-button>
                          ` : ''}
                        </td>
                      </tr>
                    `;
                  })}
                </tbody>
              </table>
            </div>
          ` : ''}
        </lcards-form-section>

        <!-- ── HELPER STATUS ── -->
        <lcards-form-section
          header="Sound Helpers Status"
          icon="mdi:cog"
          ?expanded=${false}
          ?outlined=${true}>
          <table class="helper-status-table">
            <thead>
              <tr>
                <th>Helper</th>
                <th>Entity ID</th>
                <th style="width:100px">Status</th>
                <th style="width:80px"></th>
              </tr>
            </thead>
            <tbody>
              ${this._helpers.map(h => html`
                <tr>
                  <td>
                    <ha-icon icon="${h.icon || 'mdi:cog'}" style="color: var(--primary-color);"></ha-icon>
                    <span class="helper-name">${h.name}</span>
                  </td>
                  <td><span class="entity-id">${h.entity_id}</span></td>
                  <td>
                    <ha-assist-chip
                      .label=${h.exists ? 'Exists' : 'Missing'}
                      style="
                        --ha-assist-chip-filled-container-color: ${h.exists ? 'var(--success-color)' : 'var(--error-color)'};
                        --md-assist-chip-label-text-color: white;
                        --md-sys-color-on-surface: white;
                      "
                    >
                      <ha-icon icon="${h.exists ? 'mdi:check-circle' : 'mdi:alert-circle'}" slot="icon"></ha-icon>
                    </ha-assist-chip>
                  </td>
                  <td>
                    ${!h.exists ? html`
                      <ha-button @click=${() => this._createHelper(h.key)}>
                        <ha-icon slot="start" icon="mdi:plus"></ha-icon>
                        Create
                      </ha-button>
                    ` : ''}
                  </td>
                </tr>
              `)}
            </tbody>
          </table>
        </lcards-form-section>

      </div></div>
    `;
  }

  static styles = css`
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
      /* Suppress lcards-form-section's own margin-bottom; gap handles spacing */
      --lcards-section-spacing: 0;
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
    .banner ha-button {
      margin-left: auto;
    }

    /* Dim sections or individual rows when sound is globally disabled */
    .dimmed {
      opacity: 0.5;
      pointer-events: none;
    }

    .control-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      padding: 8px 0;
      border-bottom: 1px solid color-mix(in srgb, var(--divider-color) 50%, transparent);
    }
    .control-row:last-child { border-bottom: none; }
    .control-row.prominent { font-size: 1.05em; }

    .control-label {
      display: flex;
      flex-direction: column;
      flex: 1;
      min-width: 0;
      gap: 2px;
      font-size: 0.9em;
    }
    .control-label ha-icon {
      margin-right: 6px;
      color: var(--primary-color);
    }
    .hint {
      font-size: 0.8em;
      color: var(--secondary-text-color);
    }

    .scheme-row {
      display: flex;
      align-items: center;
      gap: 8px;
      min-width: 280px;
    }
    .scheme-row ha-selector {
      flex: 1;
    }

    .empty-hint {
      display: flex;
      align-items: center;
      gap: 8px;
      color: var(--secondary-text-color);
      font-size: 0.85em;
      padding: 8px 0;
    }

    /* Overrides table */
    .overrides-table-wrapper {
      overflow-x: auto;
      max-height: 400px;
      overflow-y: auto;
    }
    .overrides-table {
      width: 100%;
      border-collapse: collapse;
    }
    .overrides-table th {
      text-align: left;
      padding: 6px 8px;
      color: var(--secondary-text-color);
      border-bottom: 1px solid var(--divider-color);
      position: sticky;
      top: 0;
      background: var(--card-background-color, #1c1c1c);
    }
    .overrides-table td {
      padding: 4px 8px;
      vertical-align: middle;
      border-bottom: 1px solid color-mix(in srgb, var(--divider-color) 40%, transparent);
    }
    .overrides-table tr.has-override td {
      background: color-mix(in srgb, var(--primary-color) 8%, transparent);
    }
    .event-label {
      white-space: nowrap;
    }
    .overrides-header-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
      padding: 0 4px 8px;
    }
    .reset-overrides-btn {
      --mdc-theme-primary: var(--warning-color, #ff9800);
      flex-shrink: 0;
    }

    /* Helper status table */
    .helper-status-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.85em;
    }
    .helper-status-table th {
      text-align: left;
      padding: 6px 8px;
      color: var(--secondary-text-color);
      border-bottom: 1px solid var(--divider-color);
    }
    .helper-status-table td {
      padding: 6px 8px;
      vertical-align: middle;
      border-bottom: 1px solid color-mix(in srgb, var(--divider-color) 40%, transparent);
    }
    .helper-status-table tr:last-child td { border-bottom: none; }
    .helper-name {
      margin-left: 6px;
      vertical-align: middle;
    }
    .entity-id {
      font-family: monospace;
      font-size: 0.85em;
      color: var(--secondary-text-color);
    }
  `;
}

customElements.define('lcards-sound-config-tab', LCARdSSoundConfigTab);
