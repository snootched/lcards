/**
 * @fileoverview Shared file source picker: an asset library dropdown (the
 * files LCARdS ships), a custom path or URL, or the Home Assistant media
 * browser. Used wherever a config value names a file: shape textures and
 * image backgrounds (images and SVGs), the MSD base SVG, astrometrics models
 * and textures.
 *
 * Value contract: `builtin:<key>` (asset library), `media-source://...`
 * (media browser), anything else is a custom path, URL or template. With
 * `noneLabel` a fourth mode stands for the value `none` (the MSD base SVG).
 *
 * The mode is derived from the value, except while the user has switched to
 * the media browser or a custom path and not yet picked or typed one.
 * Switching to the library picks its first file when the value is not one;
 * switching to none sets `none`.
 *
 * @element lcards-asset-source-picker
 * @fires value-changed - detail: { value } (the new config value)
 * @fires mode-changed - detail: { mode, previous } (after any value-changed it causes)
 */

import { LitElement, html, css, nothing } from 'lit';
import './lcards-message.js';

/** @typedef {'asset' | 'custom' | 'media' | 'none'} SourceMode */

/**
 * Asset library options: the pack-provided files of these registry types.
 * Files registered at run time from a custom path or media pick carry no
 * `pack` and are left out (else a picked media-source id would show up as a
 * mangled "builtin:<raw value>" entry for the rest of the page session).
 * @param {string[]} types - AssetManager registry types: 'image', 'svg', 'model'
 * @returns {{ value: string, label: string }[]}
 */
export function assetLibraryOptions(types) {
  const am = /** @type {any} */ (window).lcards?.core?.assetManager;
  if (!am) return [];
  /** @type {Map<string, string>} */
  const found = new Map();
  for (const type of types) {
    let keys = [];
    try {
      keys = am.listAssets?.(type) ?? [];
    } catch (_) {
      keys = [];
    }
    for (const key of keys) {
      const meta = am.getMetadata?.(type, key);
      if (!meta?.pack || found.has(key)) continue;
      found.set(key, meta.label ? `${meta.label} (${key})` : key);
    }
  }
  return [...found].sort((a, b) => a[0].localeCompare(b[0])).map(([key, label]) => ({ value: `builtin:${key}`, label }));
}

/**
 * The mode a value belongs to.
 * @param {string} value
 * @param {{ none?: boolean, bareKeys?: boolean }} [opts] - none: '' and 'none' mean no file; bareKeys: a plain key (no / or :) is a library file
 * @returns {SourceMode}
 */
export function sourceMode(value, opts = {}) {
  const v = typeof value === 'string' ? value : '';
  if (opts.none && (v === '' || v === 'none')) return 'none';
  if (v.startsWith('builtin:')) return 'asset';
  if (v.startsWith('media-source://')) return 'media';
  if (opts.bareKeys && v && !v.includes('/') && !v.includes(':')) return 'asset';
  return 'custom';
}

export class LCARdSAssetSourcePicker extends LitElement {
  static get properties() {
    return {
      hass: { attribute: false },
      /** The config value */
      value: { type: String },
      /** AssetManager registry types for the library dropdown (default image and svg) */
      assetTypes: { attribute: false },
      /** Library options instead of the registry (rarely needed) */
      assetOptions: { attribute: false },
      /** MIME patterns for the media browser, e.g. ['image/*'], ['model/*'] */
      accept: { attribute: false },
      /** Label of the mode dropdown */
      label: { type: String },
      assetLabel: { type: String },
      assetHelper: { type: String },
      customLabel: { type: String },
      customHelper: { type: String },
      mediaHelper: { type: String },
      /** Offer a "no file" mode with this label (value `none`) */
      noneLabel: { type: String },
      /** A plain key (no / or :) is a library file (old MSD configs) */
      bareKeys: { type: Boolean },
      disabled: { type: Boolean },
      _mode: { state: true }
    };
  }

  constructor() {
    super();
    /** @type {any} */
    this.hass = null;
    this.value = '';
    /** @type {string[]} */
    this.assetTypes = ['image', 'svg'];
    /** @type {{ value: string, label: string }[] | null} */
    this.assetOptions = null;
    /** @type {string[]} */
    this.accept = ['image/*'];
    this.label = 'Source';
    this.assetLabel = 'Built-in file';
    this.assetHelper = '';
    this.customLabel = 'Path or URL';
    this.customHelper = 'A file in /config/www as /local/..., or an https:// URL.';
    this.mediaHelper = 'Browse the Home Assistant media library.';
    this.noneLabel = '';
    this.bareKeys = false;
    this.disabled = false;
    /** @type {SourceMode | undefined} */
    this._mode = undefined;
  }

  get _opts() {
    return { none: !!this.noneLabel, bareKeys: this.bareKeys };
  }

  /** @param {Map<string, any>} changed */
  willUpdate(changed) {
    // follow the value, except while a custom path is being typed from empty
    if (this._mode === undefined || (changed.has('value') && !(this._mode === 'custom' && !this.value))) {
      this._mode = sourceMode(this.value, this._opts);
    }
  }

  /** @returns {{ value: string, label: string }[]} */
  get _options() {
    return this.assetOptions ?? assetLibraryOptions(this.assetTypes);
  }

  /** @param {string} value */
  _emitValue(value) {
    this.dispatchEvent(new CustomEvent('value-changed', { detail: { value }, bubbles: true, composed: true }));
  }

  /** @param {SourceMode} mode */
  _setMode(mode) {
    const previous = this._mode;
    if (mode === previous) return;
    this._mode = mode;
    if (mode === 'asset' && sourceMode(this.value, this._opts) !== 'asset') {
      const first = this._options[0]?.value;
      if (first) this._emitValue(first);
    } else if (mode === 'none') {
      this._emitValue('none');
    }
    this.dispatchEvent(new CustomEvent('mode-changed', { detail: { mode, previous }, bubbles: true, composed: true }));
  }

  render() {
    const mode = this._mode ?? 'custom';
    const value = typeof this.value === 'string' ? this.value : '';
    const modes = [
      { value: 'asset', label: 'Asset library' },
      { value: 'custom', label: 'Custom path' },
      { value: 'media', label: 'Browse Home Assistant media' },
      ...(this.noneLabel ? [{ value: 'none', label: this.noneLabel }] : [])
    ];
    const options = this._options;
    const mixed = mode === 'custom' && value.startsWith('http:') && typeof location !== 'undefined' && location.protocol === 'https:';
    return html`
      <ha-selector class="mode" .hass=${this.hass} ?disabled=${this.disabled}
        .selector=${{ select: { mode: 'dropdown', options: modes } }}
        .value=${mode} .label=${this.label}
        @value-changed=${(/** @type {CustomEvent} */ e) => { e.stopPropagation(); this._setMode(e.detail.value); }}
      ></ha-selector>
      ${mode === 'asset' ? html`
        <ha-selector class="asset" .hass=${this.hass} ?disabled=${this.disabled}
          .selector=${{ select: { mode: 'dropdown', custom_value: options.length >= 10, options } }}
          .value=${options.some((o) => o.value === value) || this.bareKeys ? value : (options[0]?.value ?? '')}
          .label=${this.assetLabel} .helper=${this.assetHelper}
          @value-changed=${(/** @type {CustomEvent} */ e) => { e.stopPropagation(); this._emitValue(e.detail.value); }}
        ></ha-selector>` : mode === 'media' ? html`
        <ha-selector class="media" .hass=${this.hass} ?disabled=${this.disabled}
          .selector=${{ media: { accept: this.accept } }}
          .value=${value.startsWith('media-source://') ? { media_content_id: value, media_content_type: '' } : undefined}
          .label=${'Home Assistant media'} .helper=${this.mediaHelper}
          @value-changed=${(/** @type {CustomEvent} */ e) => { e.stopPropagation(); this._emitValue(e.detail.value?.media_content_id ?? ''); }}
        ></ha-selector>` : mode === 'custom' ? html`
        <ha-selector class="custom" .hass=${this.hass} ?disabled=${this.disabled}
          .selector=${{ text: {} }}
          .value=${this.noneLabel && value === 'none' ? '' : value}
          .label=${this.customLabel} .helper=${this.customHelper}
          @value-changed=${(/** @type {CustomEvent} */ e) => { e.stopPropagation(); this._emitValue(e.detail.value ?? ''); }}
        ></ha-selector>` : nothing}
      ${mixed ? html`<lcards-message type="warning"
        .message=${'http:// URLs are blocked as mixed content when Home Assistant is served over HTTPS. Use an https:// URL or a /local/ path instead.'}></lcards-message>` : nothing}
    `;
  }

  static get styles() {
    return css`
      :host { display: flex; flex-direction: column; gap: var(--ha-space-3); }
      ha-selector { display: block; width: 100%; }
    `;
  }
}

if (!customElements.get('lcards-asset-source-picker')) {
  customElements.define('lcards-asset-source-picker', LCARdSAssetSourcePicker);
}
