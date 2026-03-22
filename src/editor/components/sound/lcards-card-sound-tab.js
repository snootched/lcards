/**
 * @fileoverview LCARdS Card Sound Tab
 *
 * Per-card sound configuration for LCARdS card editors.
 * Provides a master enable/disable toggle and per-event asset override dropdowns
 * that behave identically to the global Config Panel → Sound overrides.
 *
 * Config structure written to card YAML:
 *
 *   sounds:
 *     enabled: false          # mute this card entirely (default: true / omitted)
 *     card_tap: null          # silence a specific event (null = mute)
 *     card_hold: 'my_beep'   # explicit asset override
 *     # omitted events fall through to global scheme
 *
 * @element lcards-card-sound-tab
 * @fires config-changed - via fireEvent on parent editor when sounds config changes
 *
 * @property {Object}   editor  - Parent card editor instance
 * @property {Object}   hass    - Home Assistant instance
 * @property {string[]} events  - Event keys to display in the override table
 *                                (card-type-specific, e.g. slider adds slider_* events)
 */

import { LitElement, html, css } from 'lit';
import { fireEvent } from 'custom-card-helpers';
import { SOUND_EVENT_LABELS } from '../../../core/sound/SoundManager.js';
import { lcardsLog } from '../../../utils/lcards-logging.js';
import { editorStyles } from '../../base/editor-styles.js';
import '../shared/lcards-form-section.js';

export class LCARdSCardSoundTab extends LitElement {

  static get properties() {
    return {
      editor:       { type: Object },
      hass:         { type: Object },
      events:       { type: Array },           // Event keys to show in override table
      _audioAssets: { type: Array, state: true },
    };
  }

  constructor() {
    super();
        /** @type {any} */
        this.hass = undefined;
    // Default event set covers any card that uses ActionHandler (taps/hold/hover)
    this.events = ['card_tap', 'card_hold', 'card_double_tap', 'card_hover'];
    this._audioAssets = [];
  }

  connectedCallback() {
    super.connectedCallback();
    this._loadAssets();
  }

  // ─── Asset list ─────────────────────────────────────────────────────────────

  _loadAssets() {
    const am = window.lcards?.core?.assetManager;
    if (!am) return;
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

  // ─── Config accessors ───────────────────────────────────────────────────────

  /** Current sounds config block (never null) */
  get _sounds() {
    // @ts-ignore - TS2339: auto-suppressed
    return this.editor?.config?.sounds ?? {};
  }

  /** True if card-level sounds are enabled (default: true) */
  _isMasterEnabled() {
    return this._sounds.enabled !== false;
  }

  /**
   * UI value for a given event key:
   * - '__scheme__' → not set (fall through to global)
   * - '__mute__'   → null (explicitly silenced)
   * - string       → specific asset key
   */
  _overrideValueFor(eventType) {
    const sounds = this._sounds;
    if (eventType in sounds) {
      return sounds[eventType] === null ? '__mute__' : sounds[eventType];
    }
    return '__scheme__';
  }

  // ─── Config writers ─────────────────────────────────────────────────────────

  /**
   * Merge a patch into config.sounds and fire config-changed.
   * Automatically removes 'enabled: true' (it's the default) and '__scheme__' entries
   * to keep the YAML minimal.
   */
  _updateSounds(patch) {
    // @ts-ignore - TS2339: auto-suppressed
    if (!this.editor) return;
    const next = { ...this._sounds, ...patch };

    // enabled:true is the default — omit it from YAML
    if (next.enabled === true) delete next.enabled;

    // Remove any __scheme__ sentinel values (they mean "use default")
    for (const [k, v] of Object.entries(next)) {
      if (v === '__scheme__') delete next[k];
    }

    this._commitSounds(next);
  }

  /** Toggle master card-level sounds on/off */
  _setMasterEnabled(enabled) {
    if (enabled) {
      // Restore to default — just remove the enabled key
      const { enabled: _removed, ...rest } = this._sounds;
      this._commitSounds(rest);
    } else {
      this._updateSounds({ enabled: false });
    }
  }

  /** Set a per-event override */
  _setOverride(eventType, value) {
    if (value === '__scheme__') {
      // Remove this event key entirely
      const next = { ...this._sounds };
      delete next[eventType];
      if (next.enabled === true) delete next.enabled;
      this._commitSounds(next);
    } else if (value === '__mute__') {
      this._updateSounds({ [eventType]: null });
    } else {
      this._updateSounds({ [eventType]: value });
    }
  }

  /** Clear all per-event overrides (preserve master enabled state) */
  _clearAllOverrides() {
    const next = {};
    if (this._sounds.enabled === false) next.enabled = false;
    this._commitSounds(next);
  }

  /**
   * Write the sounds object to editor config and dispatch config-changed.
   * Removes config.sounds entirely when it would be empty.
   */
  _commitSounds(soundsObj) {
    // @ts-ignore - TS2339: auto-suppressed
    if (!this.editor) return;
    // @ts-ignore - TS2339: auto-suppressed
    const config = { ...this.editor.config };
    if (Object.keys(soundsObj).length === 0) {
      delete config.sounds;
    } else {
      config.sounds = soundsObj;
    }
    // @ts-ignore - TS2339: auto-suppressed
    this.editor.config = config;
    // @ts-ignore - TS2339: auto-suppressed
    fireEvent(this.editor, 'config-changed', { config });
    this.requestUpdate();
  }

  // ─── Preview ────────────────────────────────────────────────────────────────

  _previewAsset(assetKey) {
    if (!assetKey || assetKey === '__scheme__' || assetKey === '__mute__') return;
    window.lcards?.core?.soundManager?.preview(assetKey);
  }

  /** Preview the effective sound for an event (resolves override → global scheme). */
  _previewEvent(eventType) {
    window.lcards?.core?.soundManager?.previewEvent(eventType);
  }

  // ─── Render ─────────────────────────────────────────────────────────────────

  render() {
    const sounds = this._sounds;
    const masterEnabled = this._isMasterEnabled();

    // Check whether global sounds are turned on (informational banner only)
    // @ts-ignore - TS2339: auto-suppressed
    const globalSoundOn = this.hass?.states?.['input_boolean.lcards_sound_enabled']?.state === 'on';

    // Count event-level overrides (excludes the 'enabled' key)
    const overrideCount = Object.keys(sounds).filter(k => k !== 'enabled').length;

    return html`
      <div class="tab-body">

        <!-- Informational banner when global sounds are disabled -->
        ${!globalSoundOn ? html`
          <div class="banner info">
            <ha-icon icon="mdi:volume-off"></ha-icon>
            Global sounds are currently disabled — enable them in
            <strong>Config Panel → Sound</strong> for card overrides to take effect.
          </div>
        ` : ''}

        <!-- ── Master card sound toggle ── -->
        <lcards-form-section
          header="Card Sound Control"
          icon="mdi:volume-high"
          description="Control whether this card participates in the global sound system"
          ?expanded=${true}
          ?outlined=${true}>

          <div class="control-row">
            <div class="control-label">
              <ha-icon icon="${masterEnabled ? 'mdi:volume-high' : 'mdi:volume-off'}"></ha-icon>
              <span>
                Sounds enabled for this card
                <span class="hint">When off, this card is always silent regardless of global settings</span>
              </span>
            </div>
            <ha-switch
              .checked=${masterEnabled}
              @change=${(e) => this._setMasterEnabled(e.target.checked)}
            ></ha-switch>
          </div>

        </lcards-form-section>

        <!-- ── Per-event overrides ── -->
        <lcards-form-section
          header="Per-Event Overrides"
          icon="mdi:tune-variant"
          description="Override individual sounds for this card. Omitted events use the active global scheme."
          ?expanded=${true}
          ?outlined=${true}
          class="${!masterEnabled ? 'dimmed' : ''}">

          ${this._audioAssets.length === 0 ? html`
            <div class="empty-hint">
              <ha-icon icon="mdi:information-outline"></ha-icon>
              No audio assets registered — load a sound pack to enable per-event overrides.
            </div>
          ` : ''}

          <div class="overrides-table-wrapper">
            <table class="overrides-table">
              <thead>
                <tr>
                  <th>Event</th>
                  <th>Override</th>
                  <th style="width:52px;"></th>
                </tr>
              </thead>
              <tbody>
                ${this.events.map(evtKey => {
                  const label = SOUND_EVENT_LABELS[evtKey] || evtKey;
                  const overrideValue = this._overrideValueFor(evtKey);
                  const isCustom = overrideValue !== '__scheme__';
                  return html`
                    <tr class="${isCustom ? 'has-override' : ''}">
                      <td class="event-label">${label}</td>
                      <td>
                        <ha-selector
                          // @ts-ignore - TS2339: auto-suppressed
                          .hass=${this.hass}
                          .selector=${{
                            select: {
                              options: [
                                { value: '__scheme__', label: '— (use global)' },
                                { value: '__mute__',   label: '🔇 Mute this event' },
                                ...this._audioAssets.map(a => ({
                                  value: a.key,
                                  label: `${a.key} (${a.pack})`
                                }))
                              ],
                              mode: 'dropdown'
                            }
                          }}
                          .value=${overrideValue}
                          ?disabled=${!masterEnabled}
                          @value-changed=${(e) => this._setOverride(evtKey, e.detail.value)}
                        ></ha-selector>
                      </td>
                      <td>
                        ${overrideValue !== '__mute__' ? html`
                          <ha-icon-button
                            .label=${'Preview'}
                            @click=${() => overrideValue === '__scheme__'
                              ? this._previewEvent(evtKey)
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

          ${overrideCount > 0 ? html`
            <ha-button @click=${() => this._clearAllOverrides()} style="margin-top:8px">
              <ha-icon slot="start" icon="mdi:close-circle-outline"></ha-icon>
              Clear all overrides
            </ha-button>
          ` : ''}

        </lcards-form-section>

      </div>
    `;
  }

  // ─── Styles ─────────────────────────────────────────────────────────────────

  static get styles() {
    return [
      editorStyles,
      css`
        :host {
          display: block;
          padding: 8px 0;
        }

        .tab-body {
          display: flex;
          flex-direction: column;
          gap: 16px;
          padding-bottom: 8px;
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
        .banner.info {
          background: color-mix(in srgb, var(--info-color, #03a9f4) 15%, transparent);
          border: 1px solid color-mix(in srgb, var(--info-color, #03a9f4) 40%, transparent);
          color: var(--primary-text-color);
        }

        .control-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          padding: 8px 4px;
        }
        .control-label {
          display: flex;
          align-items: flex-start;
          gap: 8px;
          font-size: 0.95em;
        }
        .control-label span {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .hint {
          font-size: 0.8em;
          color: var(--secondary-text-color);
        }

        /* Override table */
        .overrides-table-wrapper {
          overflow-x: auto;
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
          border-bottom: 1px solid
            color-mix(in srgb, var(--divider-color) 40%, transparent);
        }
        ha-icon-button {
          display: flex;
          align-items: center;
          justify-content: center;
        }
        ha-icon-button ha-icon {
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .overrides-table tr.has-override td {
          background: color-mix(in srgb, var(--primary-color) 8%, transparent);
        }
        .event-label {
          white-space: nowrap;
        }

        .empty-hint {
          display: flex;
          align-items: center;
          gap: 8px;
          color: var(--secondary-text-color);
          font-size: 0.85em;
          padding: 8px 0;
        }

        /* Dim the overrides section when card sounds are disabled */
        .dimmed {
          opacity: 0.5;
          pointer-events: none;
        }
      `
    ];
  }
}

customElements.define('lcards-card-sound-tab', LCARdSCardSoundTab);
