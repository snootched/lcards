/**
 * @fileoverview Shared per-event sound source picker.
 *
 * Renders the source-select dropdown used by every per-event sound override
 * table in LCARdS — card-level (lcards-card-sound-tab), and the global
 * Config Panel's own + admin-scoped tables (lcards-sound-config-tab) — so the
 * "scheme default / mute / bundled asset / browse HA media" UI and its
 * value contract live in exactly one place.
 *
 * Value contract (identical to the pre-existing bundled-asset-only dropdown
 * these tables used before): `'__scheme__'` (fall through), `'__mute__'`
 * (explicit silence), a bundled `audio_assets` key, or a `media-source://…`
 * content ID picked via the HA media library.
 *
 * @element lcards-sound-source-selector
 * @fires value-changed - { value: '__scheme__' | '__mute__' | '<assetKey>' | 'media-source://…' }
 *
 * @property {Object}  hass
 * @property {string}  value        Current override value
 * @property {Array}   audioAssets  [{ key, pack }] bundled asset options
 * @property {boolean} disabled
 * @property {string}  schemeLabel  Label for the '__scheme__' sentinel (varies per call site)
 */

import { LitElement, html, css } from 'lit';

const MEDIA_MODE = '__media__';

export class LCARdSSoundSourceSelector extends LitElement {
  static get properties() {
    return {
      hass:        { type: Object },
      value:       { type: String },
      audioAssets: { type: Array },
      disabled:    { type: Boolean },
      schemeLabel: { type: String },
    };
  }

  constructor() {
    super();
    /** @type {any} */
    this.hass = undefined;
    this.value = '__scheme__';
    this.audioAssets = [];
    this.disabled = false;
    this.schemeLabel = '— Use scheme default —';
    // True while the user has switched the dropdown to "Browse HA Media" but
    // hasn't picked an item yet — value hasn't changed, so this can't be
    // derived from `value` alone.
    this._pendingMediaMode = false;
  }

  get _isMediaSource() {
    return typeof this.value === 'string' && this.value.startsWith('media-source://');
  }

  willUpdate(changedProperties) {
    // `value` can change out from under us externally (e.g. the parent reloads
    // overrides after a scheme switch) — if it's no longer a media-source id,
    // drop any stale "picker is open" state so we don't show an empty picker
    // under a dropdown still reading "Browse HA Media".
    if (changedProperties.has('value') && !this._isMediaSource) {
      this._pendingMediaMode = false;
    }
  }

  _emit(value) {
    this.dispatchEvent(new CustomEvent('value-changed', {
      detail: { value },
      bubbles: true,
      composed: true
    }));
  }

  _handleDropdownChange(newValue) {
    if (newValue === MEDIA_MODE) {
      this._pendingMediaMode = true;
      this.requestUpdate();
      return;
    }
    this._pendingMediaMode = false;
    this._emit(newValue);
  }

  render() {
    const showMediaPicker = this._isMediaSource || this._pendingMediaMode;
    const dropdownValue = showMediaPicker ? MEDIA_MODE : this.value;
    const mediaValue = this._isMediaSource
      ? { media_content_id: this.value, media_content_type: '' }
      : undefined;

    return html`
      <div class="selector-stack">
        <ha-selector
          .hass=${this.hass}
          .selector=${{ select: {
            mode: 'dropdown',
            custom_value: (3 + this.audioAssets.length) >= 10,
            options: [
              { value: '__scheme__', label: this.schemeLabel },
              { value: '__mute__',   label: '🔇 Mute this event' },
              { value: MEDIA_MODE,   label: '🌐 Browse HA Media…' },
              ...this.audioAssets.map(a => ({ value: a.key, label: `${a.key} (${a.pack})` }))
            ]
          }}}
          .value=${dropdownValue}
          ?disabled=${this.disabled}
          @value-changed=${(e) => { e.stopPropagation(); this._handleDropdownChange(e.detail.value); }}
        ></ha-selector>
        ${showMediaPicker ? html`
          <ha-selector
            .hass=${this.hass}
            .selector=${{ media: { accept: ['audio/*'] } }}
            .value=${mediaValue}
            ?disabled=${this.disabled}
            @value-changed=${(e) => { e.stopPropagation(); this._emit(e.detail.value?.media_content_id ?? ''); }}
          ></ha-selector>
        ` : ''}
      </div>
    `;
  }

  static get styles() {
    return css`
      :host { display: block; }
      .selector-stack { display: flex; flex-direction: column; gap: 6px; }
      ha-selector { display: block; width: 100%; }
    `;
  }
}

if (!customElements.get('lcards-sound-source-selector')) {
  customElements.define('lcards-sound-source-selector', LCARdSSoundSourceSelector);
}
