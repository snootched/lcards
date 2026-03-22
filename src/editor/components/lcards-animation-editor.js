/**
 * @fileoverview Advanced animation configuration editor component.
 *
 * Features:
 * - Comprehensive preset parameter editing (all documented options)
 * - Dynamic form generation based on selected preset
 * - Custom anime.js configuration support
 * - Trigger management (on_load, on_hover, on_tap, on_datasource_change)
 * - Modern UI with collapsible sections
 * - Full parameter coverage from preset documentation
 *
 * Usage:
 * ```html
 * <lcards-animation-editor
 *   .hass=${this.hass}
 *   .animations=${config.animations}
 *   @animations-changed=${(e) => this._handleAnimationsChanged(e.detail.value)}
 * ></lcards-animation-editor>
 * ```
 */

import { LitElement, html, css } from 'lit';
import { lcardsLog } from '../../utils/lcards-logging.js';
import './shared/lcards-color-picker.js';
import './shared/lcards-form-section.js';

export class LCARdSAnimationEditor extends LitElement {
  static get properties() {
    return {
      hass: { type: Object },
      animations: { type: Array, noAccessor: true }, // Custom getter/setter below — seeds _workingAnimations
      cardElement: { type: Object },  // Card element for target discovery
      systemAnimationIds: { type: Array }, // IDs from componentDef.animations — no delete, toggle only
      _workingAnimations: { state: true }, // Internal editing state — never overwritten by parent re-renders
      _expandedIndex: { type: Number },
      _pendingDeleteIndex: { type: Number }
    };
  }

  // ---------------------------------------------------------------------------
  // Custom getter/setter for the `animations` prop.
  // The setter is ONLY called from outside (parent Lit binding) and only seeds
  // _workingAnimations when the set of animation IDs changes — it ignores echoes
  // of our own _fireChange emissions so parent re-renders can't clobber in-progress edits.
  // ---------------------------------------------------------------------------
  get animations() {
    return this._workingAnimations || [];
  }

  set animations(val) {
    const incoming = val || [];
    const current = this._workingAnimations || [];
    // Compare animation IDs (system anims always have IDs; user anims may not)
    const incomingIds = incoming.map(a => a.id).filter(Boolean).sort().join(',');
    const currentIds  = current.map(a => a.id).filter(Boolean).sort().join(',');
    // Accept update only when there is no working state yet OR the component
    // animations changed (different IDs = card switched preset/component)
    if (!current.length || incomingIds !== currentIds) {
      this._workingAnimations = JSON.parse(JSON.stringify(incoming));
    }
  }

  static get styles() {
    return css`
      :host {
        display: block;
        width: 100%;
      }

      .animations-container {
        display: flex;
        flex-direction: column;
        gap: 16px;
      }

      .animation-item {
        background: var(--card-background-color);
        border: 1px solid var(--divider-color);
        border-radius: var(--ha-card-border-radius, 12px);
        overflow: hidden;
      }

      .animation-header {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 12px;
        cursor: pointer;
        user-select: none;
        background: var(--secondary-background-color);
      }

      .animation-header:hover {
        background: var(--primary-background-color);
      }

      .animation-icon {
        color: var(--primary-color);
        --mdc-icon-size: 24px;
      }

      .animation-info {
        flex: 1;
        min-width: 0;
      }

      .animation-id-row {
        display: flex;
        align-items: center;
        gap: 6px;
        margin-bottom: 4px;
      }

      .animation-id {
        font-weight: 600;
        font-size: 18px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .animation-unnamed {
        font-weight: 500;
        font-size: 13px;
        color: var(--warning-color, #ff9800);
        font-style: italic;
      }

      .animation-chips {
        display: flex;
        align-items: center;
        gap: 4px;
        flex-wrap: wrap;
      }

      .animation-actions {
        display: flex;
        gap: 4px;
      }

      .expand-icon {
        transition: transform 0.2s;
      }

      .expand-icon.expanded {
        transform: rotate(180deg);
      }

      .add-button {
        margin-bottom: 16px;
        align-self: flex-start;
      }

      .animation-content {
        padding: 20px;
        background: var(--card-background-color, #fff);
      }

      .section {
        margin-bottom: 24px;
      }

      .section:last-child {
        margin-bottom: 0;
      }

      .section-header {
        font-size: 15px;
        font-weight: 600;
        color: var(--primary-text-color);
        margin-bottom: 16px;
        padding-bottom: 8px;
        border-bottom: 2px solid var(--primary-color);
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .form-row {
        margin-bottom: 16px;
      }

      .form-row:last-child {
        margin-bottom: 0;
      }

      .param-grid {
        display: grid;
        grid-template-columns: 1fr;
        gap: 16px;
        margin-top: 12px;
      }

      /* Constrain slider widths */
      ha-selector {
        max-width: 100%;
        width: 100%;
      }

      .param-full {
        grid-column: 1 / -1;
      }

      .add-button {
        width: 100%;
        margin-top: 8px;
        --mdc-theme-primary: var(--primary-color);
      }

      .empty-state {
        text-align: center;
        padding: 32px 16px;
        color: var(--secondary-text-color);
      }

      .empty-state ha-icon {
        font-size: 64px;
        opacity: 0.3;
        margin-bottom: 16px;
      }

      .empty-state-title {
        font-size: 16px;
        font-weight: 600;
        margin-bottom: 8px;
      }

      .empty-state-subtitle {
        font-size: 14px;
        opacity: 0.7;
      }

      .help-text {
        font-size: 12px;
        color: var(--secondary-text-color);
        margin-top: 6px;
        line-height: 1.4;
      }

      .help-icon {
        font-size: 16px;
        color: var(--secondary-text-color);
        cursor: help;
      }

      ha-icon-button {
        --mdc-icon-button-size: 36px;
        --mdc-icon-size: 20px;
      }

      .toggle-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 12px;
        background: var(--secondary-background-color, #fafafa);
        border-radius: 6px;
        margin-bottom: 16px;
      }

      .toggle-label {
        font-weight: 500;
        font-size: 14px;
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .field-label {
        display: block;
        margin-bottom: 8px;
        font-weight: 500;
        font-size: 14px;
        color: var(--primary-text-color);
      }

      .warning-banner {
        display: flex;
        align-items: flex-start;
        gap: 12px;
        padding: 12px 16px;
        background: var(--warning-color, #ff9800);
        color: #fff;
        border-radius: 6px;
        margin-bottom: 16px;
        font-size: 13px;
        line-height: 1.4;
      }

      .warning-banner ha-icon {
        flex-shrink: 0;
        margin-top: 2px;
      }

      /* Target Selection Styles */
      .mode-selector {
        display: flex;
        gap: 16px;
        margin-bottom: 16px;
        padding: 8px 0;
      }

      .mode-selector ha-formfield {
        display: flex;
        align-items: center;
      }

      .target-list {
        display: flex;
        flex-direction: column;
        gap: 12px;
      }

      .target-item {
        display: flex;
        align-items: flex-start;
        gap: 8px;
      }

      .target-item ha-selector {
        flex: 1;
      }

      .target-item ha-icon-button {
        margin-top: 8px;
        --mdc-icon-button-size: 36px;
        --mdc-icon-size: 20px;
      }

      .validation-message {
        font-size: 14px;
        margin-top: 4px;
        padding: 8px 12px;
        border-radius: var(--ha-card-border-radius, 12px);
      }

      .validation-message.valid {
        color: var(--success-color, #4caf50);
        background: rgba(76, 175, 80, 0.1);
      }

      .validation-message.error {
        color: var(--error-color, #f44336);
        background: rgba(244, 67, 54, 0.1);
      }

      .validation-summary {
        font-size: 13px;
        padding: 8px 12px;
        border-radius: var(--ha-card-border-radius, 12px);
        text-align: center;
        margin-top: 8px;
      }

      .validation-summary.valid {
        color: var(--success-color);
        background: rgba(76, 175, 80, 0.1);
      }

      .validation-summary.error {
        color: var(--warning-color);
        background: rgba(255, 152, 0, 0.1);
      }

      .animation-item.is-disabled .animation-icon {
        opacity: 0.35;
      }

      .animation-item.is-disabled .animation-type {
        opacity: 0.5;
      }

      .danger-zone {
        display: flex;
        align-items: center;
        justify-content: flex-end;
        padding-top: 20px;
        border-top: 1px solid var(--divider-color);
        margin-top: 8px;
      }

      .confirm-delete-row {
        display: flex;
        align-items: center;
        gap: 8px;
        justify-content: flex-end;
        padding-top: 20px;
        border-top: 1px solid var(--error-color, #f44336);
        margin-top: 8px;
      }

      .confirm-delete-label {
        flex: 1;
        font-size: 13px;
        color: var(--error-color, #f44336);
        font-weight: 500;
      }

      @media (max-width: 600px) {
        .animation-header {
          padding: 12px;
        }

        .animation-content {
          padding: 16px;
        }
      }
    `;
  }

  constructor() {
    super();
        /** @type {any} */
        this.hass = undefined;
    this._workingAnimations = [];
    this.systemAnimationIds = [];
    this._expandedIndex = null;
    this._pendingDeleteIndex = null;
  }

  render() {
    return html`
      <div class="animations-container">
        <ha-button @click=${this._addAnimation} class="add-button">
          <ha-icon icon="mdi:plus" slot="start"></ha-icon>
          Add Animation
        </ha-button>
        ${this.animations.length === 0 ? this._renderEmptyState() : ''}
        ${this.animations.map((anim, index) => this._renderAnimationItem(anim, index))}
      </div>
    `;
  }

  _renderEmptyState() {
    return html`
      <div class="empty-state">
        <ha-icon icon="mdi:animation-outline"></ha-icon>
        <div class="empty-state-title">No animations configured</div>
        <div class="empty-state-subtitle">Add an animation to bring your card to life</div>
      </div>
    `;
  }

  _renderAnimationItem(anim, index) {
    const isExpanded = this._expandedIndex === index;
    const trigger = anim.trigger || 'on_load';
    const isCustom = anim.type === 'custom';
    const preset = anim.preset || 'pulse';
    const isEnabled = anim.enabled !== false;
    const isSystem = !!(anim.id && this.systemAnimationIds?.includes(anim.id));
    const hasId = !!(anim.id);

    return html`
      <div class="animation-item ${isEnabled ? '' : 'is-disabled'} ${isSystem ? 'is-system' : ''}">
        <div class="animation-header" @click=${() => this._toggleExpanded(index)}>
          <ha-icon
            class="animation-icon"
            icon=${isCustom ? 'mdi:code-braces' : 'mdi:animation'}>
          </ha-icon>

          <div class="animation-info">
            <div class="animation-id-row">
              ${hasId
                ? html`<span class="animation-id">${anim.id}</span>`
                : html`<span class="animation-unnamed">⚠ Unnamed animation</span>`
              }
            </div>
            <div class="animation-chips">
              <ha-assist-chip
                .filled=${true}
                style="--ha-assist-chip-filled-container-color: color-mix(in srgb, var(--primary-color) 80%, transparent); --md-sys-color-primary: var(--primary-text-color); --md-sys-color-on-surface: var(--primary-text-color);"
                .label=${isCustom ? 'custom' : this._formatPresetName(preset)}>
              </ha-assist-chip>
              <ha-assist-chip
                .filled=${true}
                style="--ha-assist-chip-filled-container-color: color-mix(in srgb, var(--primary-color) 80%, transparent); --md-sys-color-primary: var(--primary-text-color); --md-sys-color-on-surface: var(--primary-text-color);"
                .label=${this._formatTrigger(trigger)}>
              </ha-assist-chip>
              ${isSystem ? html`<ha-assist-chip
                .filled=${true}
                style="--ha-assist-chip-filled-container-color: color-mix(in srgb, var(--info-color, #039be5) 80%, transparent); --md-sys-color-primary: var(--primary-text-color); --md-sys-color-on-surface: var(--primary-text-color);"
                label="component">
                <ha-icon slot="icon" icon="mdi:puzzle-outline"></ha-icon>
              </ha-assist-chip>` : ''}
              ${!isEnabled ? html`<ha-assist-chip
                .filled=${true}
                style="--ha-assist-chip-filled-container-color: color-mix(in srgb, var(--primary-background-color, #000000) 80%, transparent); --md-sys-color-primary: var(--primary-text-color); --md-sys-color-on-surface: var(--primary-text-color);"
                label="disabled"></ha-assist-chip>` : ''}
            </div>
          </div>

          <div class="animation-actions">
            ${!isSystem ? html`
              <ha-icon-button
                @click=${(e) => this._duplicateAnimation(e, index)}
                .label=${'Duplicate'}
                .path=${'M19,21H8V7H19M19,5H8A2,2 0 0,0 6,7V21A2,2 0 0,0 8,23H19A2,2 0 0,0 21,21V7A2,2 0 0,0 19,5M16,1H4A2,2 0 0,0 2,3V17H4V3H16V1Z'}>
              </ha-icon-button>
            ` : ''}
            <ha-icon-button
              @click=${(e) => this._toggleEnabled(e, index)}
              .label=${isEnabled ? 'Disable animation' : 'Enable animation'}
              .path=${isEnabled
                ? 'M12,9A3,3 0 0,1 15,12A3,3 0 0,1 12,15A3,3 0 0,1 9,12A3,3 0 0,1 12,9M12,4.5C17,4.5 21.27,7.61 23,12C21.27,16.39 17,19.5 12,19.5C7,19.5 2.73,16.39 1,12C2.73,7.61 7,4.5 12,4.5M3.18,12C4.83,15.36 8.24,17.5 12,17.5C15.76,17.5 19.17,15.36 20.82,12C19.17,8.64 15.76,6.5 12,6.5C8.24,6.5 4.83,8.64 3.18,12Z'
                : 'M11.83,9L15,12.16C15,12.11 15,12.05 15,12A3,3 0 0,0 12,9C11.94,9 11.89,9 11.83,9M7.53,9.8L9.08,11.35C9.03,11.56 9,11.77 9,12A3,3 0 0,0 12,15C12.22,15 12.44,14.97 12.65,14.92L14.2,16.47C13.53,16.8 12.79,17 12,17A5,5 0 0,1 7,12C7,11.21 7.2,10.47 7.53,9.8M2,4.27L4.28,6.55L4.73,7C3.08,8.3 1.78,10.02 1,12C2.73,16.39 7,19.5 12,19.5C13.55,19.5 15.03,19.2 16.38,18.66L16.81,19.08L19.73,22L21,20.73L3.27,3M12,4.5C17,4.5 21.27,7.61 23,12C22.32,13.76 21.3,15.32 20.05,16.62L18.63,15.19C19.57,14.26 20.35,13.18 20.88,12C19.23,8.64 15.82,6.5 12,6.5C10.92,6.5 9.87,6.7 8.9,7.05L7.42,5.58C8.83,4.88 10.37,4.5 12,4.5Z'}>
            </ha-icon-button>
          </div>

          <ha-icon
            class="expand-icon ${isExpanded ? 'expanded' : ''}"
            icon="mdi:chevron-down">
          </ha-icon>
        </div>

        ${isExpanded ? html`
          <div class="animation-content">
            ${this._renderAnimationForm(anim, index)}
          </div>
        ` : ''}
      </div>
    `;
  }

  _renderAnimationForm(anim, index) {
    const isCustom = anim.type === 'custom';
    const preset = anim.preset || 'pulse';
    const isPlaceholder = this._isPlaceholderPreset(preset);
    const isEnabled = anim.enabled !== false;
    const isSystem = !!(anim.id && this.systemAnimationIds?.includes(anim.id));

    return html`
      <!-- ID field for user-defined animations -->
      ${!isSystem ? html`
        ${(() => {
          const idError = anim.id ? this._validateAnimationId(anim.id, index) : null;
          return html`
            <ha-selector
              // @ts-ignore - TS2339: auto-suppressed
              .hass=${this.hass}
              .selector=${{ text: {} }}
              .value=${anim.id || ''}
              .label=${'Animation ID'}
              .helper=${'Letters, numbers, hyphens and underscores only — e.g. my-pulse'}
              @value-changed=${(e) => this._handleIdChange(index, e.detail.value)}>
            </ha-selector>
            ${idError ? html`
              <lcards-message type="error">
                <p style="margin:0;font-size:13px;line-height:1.4;">${idError}</p>
              </lcards-message>
            ` : !anim.id ? html`
              <lcards-message type="warning">
                <p style="margin:0;font-size:13px;line-height:1.4;">
                  Give this animation an <strong>ID</strong> so you can identify it in the list and reference it in YAML rules.
                </p>
              </lcards-message>
            ` : ''}
          `;
        })()}
      ` : ''}

      <!-- Enabled Toggle -->
      <div class="toggle-row">
        <span class="toggle-label">
          <ha-icon icon=${isEnabled ? 'mdi:play-circle-outline' : 'mdi:pause-circle-outline'}></ha-icon>
          Animation Enabled
        </span>
        <ha-selector
          // @ts-ignore - TS2339: auto-suppressed
          .hass=${this.hass}
          .selector=${{ boolean: {} }}
          .value=${isEnabled}
          @value-changed=${(e) => this._setEnabled(index, e.detail.value)}>
        </ha-selector>
      </div>

      <!-- Trigger Section -->
      <lcards-form-section
        header="Trigger"
        icon="mdi:lightning-bolt"
        ?expanded=${true}>
        <ha-selector
          // @ts-ignore - TS2339: auto-suppressed
          .hass=${this.hass}
          .selector=${{
            select: {
              mode: 'dropdown',
              options: [
                { value: 'on_load', label: 'On Load' },
                { value: 'on_hover', label: 'On Hover' },
                { value: 'on_leave', label: 'On Leave (Exit Hover)' },
                { value: 'on_tap', label: 'On Tap' },
                { value: 'on_datasource_change', label: 'On Data Change' },
                { value: 'on_entity_change', label: 'On Entity Change' }
              ]
            }
          }}
          .value=${anim.trigger || 'on_load'}
          .label=${'When to trigger animation'}
          .helper=${this._getTriggerHelp(anim.trigger || 'on_load')}
          @value-changed=${(e) => this._updateAnimation(index, 'trigger', e.detail.value)}
        ></ha-selector>

        ${anim.trigger === 'on_entity_change' ? this._renderEntityChangeTriggerConfig(anim, index) : ''}
      </lcards-form-section>

      <!-- Target Selection Section -->
      ${isSystem ? '' : this._renderTargetSelector(anim, index)}

      <!-- Custom Toggle -->
      <ha-selector
        // @ts-ignore - TS2339: auto-suppressed
        .hass=${this.hass}
        .selector=${{ boolean: {} }}
        .value=${isCustom}
        .label=${'Use Custom anime.js Code'}
        .helper=${'Switch to custom anime.js v4 configuration instead of preset'}
        @value-changed=${(e) => this._toggleCustomMode(index, e.detail.value)}
      ></ha-selector>

      ${isCustom ? this._renderCustomForm(anim, index) : html`
        ${isPlaceholder ? this._renderPlaceholderWarning(preset) : ''}
        ${this._renderPresetForm(anim, index, isSystem)}
      `}

      ${!isSystem ? this._renderDeleteSection(index) : ''}
    `;
  }

  _renderDeleteSection(index) {
    if (this._pendingDeleteIndex === index) {
      return html`
        <div class="confirm-delete-row">
          <span class="confirm-delete-label">Delete this animation permanently?</span>
          <ha-button @click=${() => { this._pendingDeleteIndex = null; this.requestUpdate(); }}>
            Cancel
          </ha-button>
          <ha-button
            variant="danger"
            @click=${() => this._confirmDelete(index)}>
            <ha-icon icon="mdi:trash-can" slot="start"></ha-icon>
            Delete
          </ha-button>
        </div>
      `;
    }
    return html`
      <div class="danger-zone">
        <ha-button
          variant="danger"
          @click=${() => { this._pendingDeleteIndex = index; this.requestUpdate(); }}>
          <ha-icon icon="mdi:trash-can-outline" slot="start"></ha-icon>
          Delete Animation
        </ha-button>
      </div>
    `;
  }

  _renderPresetForm(anim, index, isSystem = false) {
    const params = anim.params || {};
    const preset = anim.preset || 'pulse';

    return html`
      <!-- Preset Selection Section -->
      <lcards-form-section
        header="Animation Preset"
        icon="mdi:animation"
        ?expanded=${!isSystem}>
        ${isSystem ? html`
          <lcards-message type="info" .message=${'Preset type is fixed for component animations. Edit parameters below.'}></lcards-message>
        ` : html`
          <ha-selector
            // @ts-ignore - TS2339: auto-suppressed
            .hass=${this.hass}
            .selector=${{
              select: {
                mode: 'dropdown',
                options: this._getPresetOptions()
              }
            }}
            .value=${preset}
            .label=${'Select animation type'}
            @value-changed=${(e) => this._updateAnimation(index, 'preset', e.detail.value)}
          ></ha-selector>
          ${this._getPresetHelp(preset) ? html`
            <lcards-message type="info" .message=${this._getPresetHelp(preset)}></lcards-message>
          ` : ''}
        `}
      </lcards-form-section>

      <lcards-form-section
        header="Animation Parameters"
        icon="mdi:tune"
        ?expanded=${true}>
        ${this._renderPresetParams(preset, params, index)}
      </lcards-form-section>
    `;
  }

  _renderPresetParams(preset, params, index) {
    // Common timing parameters shown for all presets
    // Pass preset-specific hide options so irrelevant fields are suppressed.
    const commonParamOpts = preset === 'stagger-flash'
      ? { hideStartDelay: true, hideAlternate: true, hideEasing: true }
      : {};
    const commonParams = this._renderCommonParams(params, index, commonParamOpts);

    // Preset-specific parameters
    let specificParams = /** @type {any} */ ('');

    switch (preset) {
      case 'pulse':
        specificParams = html`
          <div class="param-grid">
            <ha-selector
              // @ts-ignore - TS2339: auto-suppressed
              .hass=${this.hass}
              .selector=${{ number: { min: 0.5, max: 3, step: 0.05, mode: 'slider' } }}
              .value=${params.max_scale ?? params.scale ?? 1.15}
              .label=${'Max Scale'}
              @value-changed=${(e) => this._updateParam(index, 'max_scale', e.detail.value)}>
            </ha-selector>
            <ha-selector
              // @ts-ignore - TS2339: auto-suppressed
              .hass=${this.hass}
              .selector=${{ number: { min: 1, max: 3, step: 0.1, mode: 'slider' } }}
              .value=${params.max_brightness ?? 1.4}
              .label=${'Max Brightness'}
              @value-changed=${(e) => this._updateParam(index, 'max_brightness', e.detail.value)}>
            </ha-selector>
          </div>
        `;
        break;

      case 'fade':
        specificParams = html`
          <div class="param-grid">
            <ha-selector
              // @ts-ignore - TS2339: auto-suppressed
              .hass=${this.hass}
              .selector=${{ number: { min: 0, max: 1, step: 0.05, mode: 'slider' } }}
              .value=${params.from ?? 1}
              .label=${'From Opacity'}
              @value-changed=${(e) => this._updateParam(index, 'from', e.detail.value)}>
            </ha-selector>
            <ha-selector
              // @ts-ignore - TS2339: auto-suppressed
              .hass=${this.hass}
              .selector=${{ number: { min: 0, max: 1, step: 0.05, mode: 'slider' } }}
              .value=${params.to ?? 0.3}
              .label=${'To Opacity'}
              @value-changed=${(e) => this._updateParam(index, 'to', e.detail.value)}>
            </ha-selector>
          </div>
        `;
        break;

      case 'glow':
        specificParams = html`
          <div class="param-full">
            <label class="field-label">Glow Color</label>
            <lcards-color-picker
              .value=${params.color ?? params.glow_color ?? '#66ccff'}
              @value-changed=${(e) => this._updateParam(index, 'color', e.detail.value)}>
            </lcards-color-picker>
          </div>
          <div class="param-grid">
            <ha-selector
              // @ts-ignore - TS2339: auto-suppressed
              .hass=${this.hass}
              .selector=${{ number: { min: 0, max: 50, step: 1, mode: 'slider' } }}
              .value=${params.blur_min ?? 0}
              .label=${'Min Blur (px)'}
              @value-changed=${(e) => this._updateParam(index, 'blur_min', e.detail.value)}>
            </ha-selector>
            <ha-selector
              // @ts-ignore - TS2339: auto-suppressed
              .hass=${this.hass}
              .selector=${{ number: { min: 0, max: 50, step: 1, mode: 'slider' } }}
              .value=${params.blur_max ?? 10}
              .label=${'Max Blur (px)'}
              @value-changed=${(e) => this._updateParam(index, 'blur_max', e.detail.value)}>
            </ha-selector>
          </div>
        `;
        break;

      case 'draw':
        specificParams = html`
          <div class="param-grid">
            <ha-selector
              // @ts-ignore - TS2339: auto-suppressed
              .hass=${this.hass}
              .selector=${{ boolean: {} }}
              .value=${params.reverse ?? false}
              .label=${'Reverse Direction'}
              .helper=${'Draw from end to start instead of start to end'}
              @value-changed=${(e) => this._updateParam(index, 'reverse', e.detail.value)}>
            </ha-selector>
          </div>
        `;
        break;

      case 'march':
        specificParams = html`
          <div class="param-grid">
            <ha-textfield
              type="number"
              label="Dash Length (px)"
              .value=${params.dash_length ?? ''}
              placeholder="Auto-detect"
              @input=${(e) => this._updateParam(index, 'dash_length', e.target.value ? Number(e.target.value) : undefined)}>
            </ha-textfield>
            <ha-textfield
              type="number"
              label="Gap Length (px)"
              .value=${params.gap_length ?? ''}
              placeholder="Auto-detect"
              @input=${(e) => this._updateParam(index, 'gap_length', e.target.value ? Number(e.target.value) : undefined)}>
            </ha-textfield>
            <ha-selector
              // @ts-ignore - TS2339: auto-suppressed
              .hass=${this.hass}
              .selector=${{
                select: {
                  mode: 'dropdown',
                  options: [
                    { value: 'forward', label: 'Forward' },
                    { value: 'reverse', label: 'Reverse' }
                  ]
                }
              }}
              .value=${params.direction ?? 'forward'}
              .label=${'Direction'}
              @value-changed=${(e) => this._updateParam(index, 'direction', e.detail.value)}>
            </ha-selector>
            <ha-textfield
              type="number"
              label="Speed (seconds)"
              .value=${params.speed ?? 2}
              step="0.1"
              @input=${(e) => this._updateParam(index, 'speed', Number(e.target.value))}>
            </ha-textfield>
          </div>
          <lcards-message type="info" .message=${'Leave dash/gap empty to auto-detect from element'}></lcards-message>
        `;
        break;

      case 'blink':
        specificParams = html`
          <div class="param-grid">
            <ha-selector
              // @ts-ignore - TS2339: auto-suppressed
              .hass=${this.hass}
              .selector=${{ number: { min: 0, max: 1, step: 0.05, mode: 'slider' } }}
              .value=${params.max_opacity ?? 1}
              .label=${'Max Opacity'}
              @value-changed=${(e) => this._updateParam(index, 'max_opacity', e.detail.value)}>
            </ha-selector>
            <ha-selector
              // @ts-ignore - TS2339: auto-suppressed
              .hass=${this.hass}
              .selector=${{ number: { min: 0, max: 1, step: 0.05, mode: 'slider' } }}
              .value=${params.min_opacity ?? 0.3}
              .label=${'Min Opacity'}
              @value-changed=${(e) => this._updateParam(index, 'min_opacity', e.detail.value)}>
            </ha-selector>
          </div>
        `;
        break;

      case 'shimmer':
        specificParams = html`
          <div class="param-grid">
            <div class="param-full">
              <label class="field-label">Color From</label>
              <lcards-color-picker
                .value=${params.color_from ?? ''}
                .allowEmpty=${true}
                placeholder="Optional"
                @value-changed=${(e) => this._updateParam(index, 'color_from', e.detail.value)}>
              </lcards-color-picker>
            </div>
            <lcards-message type="info" .message=${'Leave empty for opacity-only shimmer'}></lcards-message>
            <div class="param-full">
              <label class="field-label">Color To</label>
              <lcards-color-picker
                .value=${params.color_to ?? params.shimmer_color ?? ''}
                .allowEmpty=${true}
                placeholder="Optional"
                @value-changed=${(e) => this._updateParam(index, 'color_to', e.detail.value)}>
              </lcards-color-picker>
            </div>
            <ha-selector
              // @ts-ignore - TS2339: auto-suppressed
              .hass=${this.hass}
              .selector=${{ number: { min: 0, max: 1, step: 0.05, mode: 'slider' } }}
              .value=${params.opacity_from ?? 1}
              .label=${'Opacity From'}
              @value-changed=${(e) => this._updateParam(index, 'opacity_from', e.detail.value)}>
            </ha-selector>
            <ha-selector
              // @ts-ignore - TS2339: auto-suppressed
              .hass=${this.hass}
              .selector=${{ number: { min: 0, max: 1, step: 0.05, mode: 'slider' } }}
              .value=${params.opacity_to ?? 0.5}
              .label=${'Opacity To'}
              @value-changed=${(e) => this._updateParam(index, 'opacity_to', e.detail.value)}>
            </ha-selector>
          </div>
        `;
        break;

      case 'strobe':
        specificParams = html`
          <div class="param-grid">
            <ha-selector
              // @ts-ignore - TS2339: auto-suppressed
              .hass=${this.hass}
              .selector=${{ number: { min: 0, max: 1, step: 0.05, mode: 'slider' } }}
              .value=${params.max_opacity ?? 1}
              .label=${'Max Opacity'}
              @value-changed=${(e) => this._updateParam(index, 'max_opacity', e.detail.value)}>
            </ha-selector>
            <ha-selector
              // @ts-ignore - TS2339: auto-suppressed
              .hass=${this.hass}
              .selector=${{ number: { min: 0, max: 1, step: 0.05, mode: 'slider' } }}
              .value=${params.min_opacity ?? 0}
              .label=${'Min Opacity'}
              @value-changed=${(e) => this._updateParam(index, 'min_opacity', e.detail.value)}>
            </ha-selector>
          </div>
        `;
        break;

      case 'flicker':
        specificParams = html`
          <div class="param-grid">
            <ha-selector
              // @ts-ignore - TS2339: auto-suppressed
              .hass=${this.hass}
              .selector=${{ number: { min: 0, max: 1, step: 0.05, mode: 'slider' } }}
              .value=${params.max_opacity ?? 1}
              .label=${'Max Opacity'}
              @value-changed=${(e) => this._updateParam(index, 'max_opacity', e.detail.value)}>
            </ha-selector>
            <ha-selector
              // @ts-ignore - TS2339: auto-suppressed
              .hass=${this.hass}
              .selector=${{ number: { min: 0, max: 1, step: 0.05, mode: 'slider' } }}
              .value=${params.min_opacity ?? 0.3}
              .label=${'Min Opacity'}
              @value-changed=${(e) => this._updateParam(index, 'min_opacity', e.detail.value)}>
            </ha-selector>
          </div>
        `;
        break;

      case 'cascade':
        specificParams = html`
          <div class="param-grid">
            <ha-textfield
              type="number"
              label="Stagger Delay (ms)"
              .value=${params.stagger ?? 100}
              @input=${(e) => this._updateParam(index, 'stagger', Number(e.target.value))}>
            </ha-textfield>
            <ha-textfield
              label="CSS Property"
              .value=${params.property ?? 'opacity'}
              @input=${(e) => this._updateParam(index, 'property', e.target.value)}>
            </ha-textfield>
            <ha-textfield
              type="number"
              label="From Value"
              .value=${params.from ?? 0}
              step="0.1"
              @input=${(e) => this._updateParam(index, 'from', Number(e.target.value))}>
            </ha-textfield>
            <ha-textfield
              type="number"
              label="To Value"
              .value=${params.to ?? 1}
              step="0.1"
              @input=${(e) => this._updateParam(index, 'to', Number(e.target.value))}>
            </ha-textfield>
          </div>
        `;
        break;

      case 'cascade-color':
        const colors = params.colors ?? [
          'var(--lcards-blue-light, #93e1ff)',
          'var(--lcards-blue-darkest, #002241)',
          'var(--lcards-moonlight, #dfe1e8)'
        ];
        specificParams = html`
          <div class="param-grid">
            <div class="param-full">
              <label class="field-label">Start Color</label>
              <lcards-color-picker
                .value=${colors[0]}
                @value-changed=${(e) => {
                  const newColors = [...colors];
                  newColors[0] = e.detail.value;
                  this._updateParam(index, 'colors', newColors);
                }}>
              </lcards-color-picker>
            </div>
            <div class="param-full">
              <label class="field-label">Text Color (Flash)</label>
              <lcards-color-picker
                .value=${colors[1]}
                @value-changed=${(e) => {
                  const newColors = [...colors];
                  newColors[1] = e.detail.value;
                  this._updateParam(index, 'colors', newColors);
                }}>
              </lcards-color-picker>
            </div>
            <div class="param-full">
              <label class="field-label">End Color</label>
              <lcards-color-picker
                .value=${colors[2]}
                @value-changed=${(e) => {
                  const newColors = [...colors];
                  newColors[2] = e.detail.value;
                  this._updateParam(index, 'colors', newColors);
                }}>
              </lcards-color-picker>
            </div>
            <lcards-message type="info" .message=${'Three colors for cascade effect: start → text (flash) → end'}></lcards-message>
            <ha-selector
              // @ts-ignore - TS2339: auto-suppressed
              .hass=${this.hass}
              .selector=${{select: {mode: 'dropdown', options: [
                { value: 'default', label: 'Default - Authentic LCARS timing' },
                { value: 'niagara', label: 'Niagara - Smoother cascade' },
                { value: 'fast', label: 'Fast - Quick cascade' },
                { value: 'frozen', label: 'Frozen - Static display' }
              ]}}}
              .label=${'Timing Pattern'}
              .value=${params.pattern ?? 'default'}
              @value-changed=${(e) => this._updateParam(index, 'pattern', e.detail.value)}>
            </ha-selector>
            <ha-textfield
              type="number"
              label="Speed Multiplier"
              .value=${params.speed_multiplier ?? 1.0}
              .helper=${'2.0 = twice as fast, 0.5 = half speed'}
              step="0.1"
              min="0.1"
              max="10"
              @input=${(e) => this._updateParam(index, 'speed_multiplier', Number(e.target.value))}>
            </ha-textfield>
            <ha-textfield
              label="CSS Property"
              .value=${params.property ?? 'color'}
              .helper=${'Property to animate (color, fill, stroke, etc.)'}
              @input=${(e) => this._updateParam(index, 'property', e.target.value)}>
            </ha-textfield>
          </div>
        `;
        break;

      case 'ripple':
        specificParams = html`
          <div class="param-grid">
            <ha-selector
              // @ts-ignore - TS2339: auto-suppressed
              .hass=${this.hass}
              .selector=${{ number: { min: 1, max: 5, step: 0.1, mode: 'slider' } }}
              .value=${params.scale_max ?? 1.5}
              .label=${'Max Scale'}
              @value-changed=${(e) => this._updateParam(index, 'scale_max', e.detail.value)}>
            </ha-selector>
            <ha-selector
              // @ts-ignore - TS2339: auto-suppressed
              .hass=${this.hass}
              .selector=${{ number: { min: 0, max: 1, step: 0.05, mode: 'slider' } }}
              .value=${params.opacity_min ?? 0}
              .label=${'Min Opacity'}
              @value-changed=${(e) => this._updateParam(index, 'opacity_min', e.detail.value)}>
            </ha-selector>
          </div>
        `;
        break;

      case 'scale':
        specificParams = html`
          <div class="param-grid">
            <ha-selector
              // @ts-ignore - TS2339: auto-suppressed
              .hass=${this.hass}
              .selector=${{ number: { min: 0.1, max: 3, step: 0.05, mode: 'slider' } }}
              .value=${params.from ?? 1}
              .label=${'From Scale'}
              @value-changed=${(e) => this._updateParam(index, 'from', e.detail.value)}>
            </ha-selector>
            <ha-selector
              // @ts-ignore - TS2339: auto-suppressed
              .hass=${this.hass}
              .selector=${{ number: { min: 0.1, max: 3, step: 0.05, mode: 'slider' } }}
              .value=${params.scale ?? 1.1}
              .label=${'To Scale'}
              @value-changed=${(e) => this._updateParam(index, 'scale', e.detail.value)}>
            </ha-selector>
          </div>
        `;
        break;

      case 'scale-reset':
        // No specific params for scale-reset
        break;

      case 'set':
        specificParams = html`
          <div class="param-full">
            <ha-textfield
              label="Properties (JSON)"
              .value=${JSON.stringify(params.properties ?? {})}
              @input=${(e) => {
                try {
                  this._updateParam(index, 'properties', JSON.parse(e.target.value));
                } catch (err) {
                  // Invalid JSON, don't update
                }
              }}
              helper="CSS properties to set immediately">
            </ha-textfield>
          </div>
        `;
        break;

      // Placeholder presets (not yet implemented)
      case 'slide':
        specificParams = html`
          <div class="param-grid">
            <ha-selector
              // @ts-ignore - TS2339: auto-suppressed
              .hass=${this.hass}
              .selector=${{
                select: {
                  mode: 'dropdown',
                  options: [
                    { value: 'right', label: 'From Right' },
                    { value: 'left', label: 'From Left' },
                    { value: 'top', label: 'From Top' },
                    { value: 'bottom', label: 'From Bottom' }
                  ]
                }
              }}
              .value=${params.from ?? 'right'}
              .label=${'Slide Direction'}
              @value-changed=${(e) => this._updateParam(index, 'from', e.detail.value)}>
            </ha-selector>
            <ha-selector
              // @ts-ignore - TS2339: auto-suppressed
              .hass=${this.hass}
              .selector=${{ number: { min: -500, max: 500, step: 10, mode: 'box' } }}
              .value=${params.distance ?? 100}
              .label=${'Distance (px or %)'}
              .helper=${'Positive number or use % for percentage'}
              @value-changed=${(e) => this._updateParam(index, 'distance', e.detail.value)}>
            </ha-selector>
          </div>
        `;
        break;

      case 'rotate':
        specificParams = html`
          <div class="param-grid">
            <ha-selector
              // @ts-ignore - TS2339: auto-suppressed
              .hass=${this.hass}
              .selector=${{ number: { min: -720, max: 720, step: 15, mode: 'box' } }}
              .value=${params.angle ?? 360}
              .label=${'Rotation Angle (degrees)'}
              .helper=${'Positive = clockwise, negative = counter-clockwise'}
              @value-changed=${(e) => this._updateParam(index, 'angle', e.detail.value)}>
            </ha-selector>
            <ha-textfield
              label="Transform Origin"
              .value=${params.origin ?? 'center'}
              .helper=${'e.g., "center", "top left", "50% 50%"'}
              @input=${(e) => this._updateParam(index, 'origin', e.target.value)}>
            </ha-textfield>
          </div>
        `;
        break;

      case 'shake':
        specificParams = html`
          <div class="param-grid">
            <ha-selector
              // @ts-ignore - TS2339: auto-suppressed
              .hass=${this.hass}
              .selector=${{ number: { min: 1, max: 50, step: 1, mode: 'slider' } }}
              .value=${params.intensity ?? 10}
              .label=${'Shake Intensity (px)'}
              @value-changed=${(e) => this._updateParam(index, 'intensity', e.detail.value)}>
            </ha-selector>
            <ha-selector
              // @ts-ignore - TS2339: auto-suppressed
              .hass=${this.hass}
              .selector=${{
                select: {
                  mode: 'dropdown',
                  options: [
                    { value: 'horizontal', label: 'Horizontal' },
                    { value: 'vertical', label: 'Vertical' },
                    { value: 'both', label: 'Both Directions' }
                  ]
                }
              }}
              .value=${params.direction ?? 'horizontal'}
              .label=${'Shake Direction'}
              @value-changed=${(e) => this._updateParam(index, 'direction', e.detail.value)}>
            </ha-selector>
          </div>
        `;
        break;

      case 'bounce':
        specificParams = html`
          <div class="param-grid">
            <ha-selector
              // @ts-ignore - TS2339: auto-suppressed
              .hass=${this.hass}
              .selector=${{ number: { min: 0.1, max: 3, step: 0.1, mode: 'slider' } }}
              .value=${params.max_scale ?? 1.3}
              .label=${'Max Scale'}
              @value-changed=${(e) => this._updateParam(index, 'max_scale', e.detail.value)}>
            </ha-selector>
            <ha-selector
              // @ts-ignore - TS2339: auto-suppressed
              .hass=${this.hass}
              .selector=${{ number: { min: 1, max: 10, step: 1, mode: 'slider' } }}
              .value=${params.bounces ?? 3}
              .label=${'Number of Bounces'}
              @value-changed=${(e) => this._updateParam(index, 'bounces', e.detail.value)}>
            </ha-selector>
            <ha-selector
              // @ts-ignore - TS2339: auto-suppressed
              .hass=${this.hass}
              .selector=${{ number: { min: 0.1, max: 2, step: 0.05, mode: 'slider' } }}
              .value=${params.elasticity ?? 0.6}
              .label=${'Elasticity'}
              @value-changed=${(e) => this._updateParam(index, 'elasticity', e.detail.value)}>
            </ha-selector>
          </div>
        `;
        break;

      case 'color-shift':
        specificParams = html`
          <div class="param-grid">
            <div class="param-full">
              <label class="field-label">From Color</label>
              <lcards-color-picker
                .value=${params.color_from ?? '#0783FF'}
                @value-changed=${(e) => this._updateParam(index, 'color_from', e.detail.value)}>
              </lcards-color-picker>
            </div>
            <div class="param-full">
              <label class="field-label">To Color</label>
              <lcards-color-picker
                .value=${params.color_to ?? '#FF6600'}
                @value-changed=${(e) => this._updateParam(index, 'color_to', e.detail.value)}>
              </lcards-color-picker>
            </div>
            <ha-textfield
              label="CSS Property"
              .value=${params.property ?? 'color'}
              .helper=${'Property to animate: color, fill, stroke, background, etc.'}
              @input=${(e) => this._updateParam(index, 'property', e.target.value)}>
            </ha-textfield>
          </div>
        `;
        break;

      case 'border-pulse':
        specificParams = html`
          <div class="param-grid">
            <div class="param-full">
              <label class="field-label">Border Color</label>
              <lcards-color-picker
                .value=${params.color ?? '#0783FF'}
                @value-changed=${(e) => this._updateParam(index, 'color', e.detail.value)}>
              </lcards-color-picker>
            </div>
            <ha-selector
              // @ts-ignore - TS2339: auto-suppressed
              .hass=${this.hass}
              .selector=${{ number: { min: 0, max: 20, step: 1, mode: 'slider' } }}
              .value=${params.min_width ?? 1}
              .label=${'Min Width (px)'}
              @value-changed=${(e) => this._updateParam(index, 'min_width', e.detail.value)}>
            </ha-selector>
            <ha-selector
              // @ts-ignore - TS2339: auto-suppressed
              .hass=${this.hass}
              .selector=${{ number: { min: 0, max: 20, step: 1, mode: 'slider' } }}
              .value=${params.max_width ?? 5}
              .label=${'Max Width (px)'}
              @value-changed=${(e) => this._updateParam(index, 'max_width', e.detail.value)}>
            </ha-selector>
          </div>
        `;
        break;

      case 'skew':
        specificParams = html`
          <div class="param-grid">
            <ha-selector
              // @ts-ignore - TS2339: auto-suppressed
              .hass=${this.hass}
              .selector=${{ number: { min: -45, max: 45, step: 1, mode: 'box' } }}
              .value=${params.x ?? 0}
              .label=${'Skew X (degrees)'}
              @value-changed=${(e) => this._updateParam(index, 'x', e.detail.value)}>
            </ha-selector>
            <ha-selector
              // @ts-ignore - TS2339: auto-suppressed
              .hass=${this.hass}
              .selector=${{ number: { min: -45, max: 45, step: 1, mode: 'box' } }}
              .value=${params.y ?? 10}
              .label=${'Skew Y (degrees)'}
              @value-changed=${(e) => this._updateParam(index, 'y', e.detail.value)}>
            </ha-selector>
          </div>
        `;
        break;

      case 'scan-line':
        specificParams = html`
          <div class="param-grid">
            <ha-selector
              // @ts-ignore - TS2339: auto-suppressed
              .hass=${this.hass}
              .selector=${{
                select: {
                  mode: 'dropdown',
                  options: [
                    { value: 'vertical', label: 'Vertical (Top to Bottom)' },
                    { value: 'horizontal', label: 'Horizontal (Left to Right)' }
                  ]
                }
              }}
              .value=${params.direction ?? 'vertical'}
              .label=${'Scan Direction'}
              @value-changed=${(e) => this._updateParam(index, 'direction', e.detail.value)}>
            </ha-selector>
            <div class="param-full">
              <label class="field-label">Scan Color</label>
              <lcards-color-picker
                .value=${params.color ?? '#0783FF'}
                @value-changed=${(e) => this._updateParam(index, 'color', e.detail.value)}>
              </lcards-color-picker>
            </div>
            <ha-selector
              // @ts-ignore - TS2339: auto-suppressed
              .hass=${this.hass}
              .selector=${{ number: { min: 1, max: 100, step: 1, mode: 'slider' } }}
              .value=${params.width ?? 20}
              .label=${'Line Width (%)'}
              @value-changed=${(e) => this._updateParam(index, 'width', e.detail.value)}>
            </ha-selector>
          </div>
        `;
        break;

      // Text Animation Presets
      case 'text-reveal':
        specificParams = html`
          <div class="param-grid">
            <ha-selector
              // @ts-ignore - TS2339: auto-suppressed
              .hass=${this.hass}
              .selector=${{
                select: {
                  mode: 'dropdown',
                  options: [
                    { value: 'chars', label: 'Characters' },
                    { value: 'words', label: 'Words' },
                    { value: 'lines', label: 'Lines' }
                  ]
                }
              }}
              .value=${params.split ?? 'chars'}
              .label=${'Split By'}
              @value-changed=${(e) => this._updateParam(index, 'split', e.detail.value)}>
            </ha-selector>
            <ha-selector
              // @ts-ignore - TS2339: auto-suppressed
              .hass=${this.hass}
              .selector=${{ number: { min: 100, max: 3000, step: 50, mode: 'box' } }}
              .value=${params.duration ?? 800}
              .label=${'Duration (ms)'}
              @value-changed=${(e) => this._updateParam(index, 'duration', e.detail.value)}>
            </ha-selector>
            <ha-selector
              // @ts-ignore - TS2339: auto-suppressed
              .hass=${this.hass}
              .selector=${{ number: { min: 0, max: 500, step: 10, mode: 'box' } }}
              .value=${params.stagger ?? 50}
              .label=${'Stagger Delay (ms)'}
              @value-changed=${(e) => this._updateParam(index, 'stagger', e.detail.value)}>
            </ha-selector>
            <ha-selector
              // @ts-ignore - TS2339: auto-suppressed
              .hass=${this.hass}
              .selector=${{ number: { min: 0, max: 1, step: 0.05, mode: 'slider' } }}
              .value=${params.from_opacity ?? 0}
              .label=${'From Opacity'}
              @value-changed=${(e) => this._updateParam(index, 'from_opacity', e.detail.value)}>
            </ha-selector>
            <ha-selector
              // @ts-ignore - TS2339: auto-suppressed
              .hass=${this.hass}
              .selector=${{ number: { min: -50, max: 50, step: 2, mode: 'box' } }}
              .value=${params.from_y ?? 20}
              .label=${'From Y Offset (px)'}
              @value-changed=${(e) => this._updateParam(index, 'from_y', e.detail.value)}>
            </ha-selector>
            <ha-selector
              // @ts-ignore - TS2339: auto-suppressed
              .hass=${this.hass}
              .selector=${{ boolean: {} }}
              .value=${params.loop ?? false}
              .label=${'Loop'}
              @value-changed=${(e) => this._updateParam(index, 'loop', e.detail.value)}>
            </ha-selector>
          </div>
        `;
        break;

      case 'text-typewriter':
        specificParams = html`
          <div class="param-grid">
            <ha-selector
              // @ts-ignore - TS2339: auto-suppressed
              .hass=${this.hass}
              .selector=${{ number: { min: 10, max: 500, step: 10, mode: 'box' } }}
              .value=${params.speed ?? 80}
              .label=${'Speed – ms per character'}
              @value-changed=${(e) => this._updateParam(index, 'speed', e.detail.value)}>
            </ha-selector>
            <ha-selector
              // @ts-ignore - TS2339: auto-suppressed
              .hass=${this.hass}
              .selector=${{ boolean: {} }}
              .value=${params.loop ?? false}
              .label=${'Loop'}
              @value-changed=${(e) => this._updateParam(index, 'loop', e.detail.value)}>
            </ha-selector>
          </div>
        `;
        break;

      case 'text-scramble':
        specificParams = html`
          <div class="param-grid">
            <ha-selector
              // @ts-ignore - TS2339: auto-suppressed
              .hass=${this.hass}
              .selector=${{ number: { min: 200, max: 5000, step: 100, mode: 'box' } }}
              .value=${params.duration ?? 800}
              .label=${'Duration – ms each char scrambles'}
              @value-changed=${(e) => this._updateParam(index, 'duration', e.detail.value)}>
            </ha-selector>
            <ha-selector
              // @ts-ignore - TS2339: auto-suppressed
              .hass=${this.hass}
              .selector=${{ number: { min: 0, max: 300, step: 10, mode: 'box' } }}
              .value=${params.stagger ?? 40}
              .label=${'Stagger – ms between chars'}
              @value-changed=${(e) => this._updateParam(index, 'stagger', e.detail.value)}>
            </ha-selector>
            <ha-selector
              // @ts-ignore - TS2339: auto-suppressed
              .hass=${this.hass}
              .selector=${{ number: { min: 0, max: 3000, step: 50, mode: 'box' } }}
              .value=${params.delay ?? 0}
              .label=${'Initial Delay (ms)'}
              @value-changed=${(e) => this._updateParam(index, 'delay', e.detail.value)}>
            </ha-selector>
            <ha-selector
              // @ts-ignore - TS2339: auto-suppressed
              .hass=${this.hass}
              .selector=${{ number: { min: 0.1, max: 1, step: 0.05, mode: 'slider' } }}
              .value=${params.settle_at ?? 0.85}
              .label=${'Settle At – fraction scrambling (0–1)'}
              @value-changed=${(e) => this._updateParam(index, 'settle_at', e.detail.value)}>
            </ha-selector>
            <ha-selector
              // @ts-ignore - TS2339: auto-suppressed
              .hass=${this.hass}
              .selector=${{ boolean: {} }}
              .value=${params.loop ?? false}
              .label=${'Loop'}
              @value-changed=${(e) => this._updateParam(index, 'loop', e.detail.value)}>
            </ha-selector>
            <ha-textfield
              label="Character Pool"
              .value=${params.characters ?? 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*'}
              @input=${(e) => this._updateParam(index, 'characters', e.target.value)}>
            </ha-textfield>
          </div>
        `;
        break;

      case 'text-glitch':
        specificParams = html`
          <div class="param-grid">
            <ha-selector
              // @ts-ignore - TS2339: auto-suppressed
              .hass=${this.hass}
              .selector=${{ number: { min: 1, max: 50, step: 1, mode: 'slider' } }}
              .value=${params.intensity ?? 5}
              .label=${'Intensity (px / SVG units)'}
              @value-changed=${(e) => this._updateParam(index, 'intensity', e.detail.value)}>
            </ha-selector>
            <ha-selector
              // @ts-ignore - TS2339: auto-suppressed
              .hass=${this.hass}
              .selector=${{ number: { min: 50, max: 2000, step: 50, mode: 'box' } }}
              .value=${params.duration ?? 300}
              .label=${'Duration (ms per glitch)'}
              @value-changed=${(e) => this._updateParam(index, 'duration', e.detail.value)}>
            </ha-selector>
            <ha-selector
              // @ts-ignore - TS2339: auto-suppressed
              .hass=${this.hass}
              .selector=${{ number: { min: 0, max: 200, step: 10, mode: 'box' } }}
              .value=${params.stagger ?? 50}
              .label=${'Stagger Delay (ms)'}
              @value-changed=${(e) => this._updateParam(index, 'stagger', e.detail.value)}>
            </ha-selector>
            <ha-selector
              // @ts-ignore - TS2339: auto-suppressed
              .hass=${this.hass}
              .selector=${{ boolean: {} }}
              .value=${params.loop ?? false}
              .label=${'Loop'}
              @value-changed=${(e) => this._updateParam(index, 'loop', e.detail.value)}>
            </ha-selector>
            <ha-selector
              // @ts-ignore - TS2339: auto-suppressed
              .hass=${this.hass}
              .selector=${{ boolean: {} }}
              .value=${params.color_shift ?? false}
              .label=${'Colour Shift (HTML targets only)'}
              @value-changed=${(e) => this._updateParam(index, 'color_shift', e.detail.value)}>
            </ha-selector>
          </div>
        `;
        break;

      // Stagger Animation Presets (PR#233)
      case 'stagger-grid':
        specificParams = html`
          <div class="param-grid">
            <ha-textfield
              label="Grid Dimensions"
              .value=${JSON.stringify(params.grid ?? [3, 3])}
              .helper=${'Format: [columns, rows] e.g., [6, 1] for alert bars'}
              @input=${(e) => {
                try {
                  this._updateParam(index, 'grid', JSON.parse(e.target.value));
                } catch (err) {}
              }}>
            </ha-textfield>
            <ha-selector
              // @ts-ignore - TS2339: auto-suppressed
              .hass=${this.hass}
              .selector=${{
                select: {
                  mode: 'dropdown',
                  options: [
                    { value: 'start', label: 'From Start (Top-Left)' },
                    { value: 'end', label: 'From End (Bottom-Right)' },
                    { value: 'center', label: 'From Center Outward' },
                    { value: 'edges', label: 'From Edges Inward' }
                  ]
                }
              }}
              .value=${params.from ?? 'start'}
              .label=${'Wave Direction'}
              @value-changed=${(e) => this._updateParam(index, 'from', e.detail.value)}>
            </ha-selector>
            <ha-selector
              // @ts-ignore - TS2339: auto-suppressed
              .hass=${this.hass}
              .selector=${{ number: { min: 0, max: 500, step: 10, mode: 'box' } }}
              .value=${params.delay ?? 100}
              .label=${'Stagger Delay (ms)'}
              @value-changed=${(e) => this._updateParam(index, 'delay', e.detail.value)}>
            </ha-selector>
            <ha-textfield
              label="Property"
              .value=${params.property ?? 'scale'}
              .helper=${'Property to animate (scale, opacity, translateY, etc.)'}
              @input=${(e) => this._updateParam(index, 'property', e.target.value)}>
            </ha-textfield>
          </div>
        `;
        break;

      case 'stagger-flash':
        specificParams = html`
          <div class="param-grid">
            <div class="param-full">
              <label class="field-label">Lead Color (Flash)</label>
              <lcards-color-picker
                .value=${params.lead_color ?? 'var(--primary-color)'}
                @value-changed=${(e) => this._updateParam(index, 'lead_color', e.detail.value)}>
              </lcards-color-picker>
            </div>
            <div class="param-full">
              <label class="field-label">Trail Color (Dim)</label>
              <lcards-color-picker
                .value=${params.trail_color ?? '#444444'}
                @value-changed=${(e) => this._updateParam(index, 'trail_color', e.detail.value)}>
              </lcards-color-picker>
            </div>
            <ha-selector
              // @ts-ignore - TS2339: auto-suppressed
              .hass=${this.hass}
              .selector=${{ number: { min: 5, max: 50, step: 1, mode: 'slider' } }}
              .value=${params.lead_pct ?? 20}
              .label=${'Flash Phase (% of cycle)'}
              .helper=${'How much of each cycle the bar spends snapping to the trail color (legacy: 20%)'}
              @value-changed=${(e) => this._updateParam(index, 'lead_pct', e.detail.value)}>
            </ha-selector>
            <ha-textfield
              type="number"
              label="Stagger Delay (ms)"
              .value=${params.delay ?? ''}
              .helper=${'Delay between consecutive elements. Leave blank to auto-compute (duration÷12). Legacy 2 s default = 167 ms.'}
              @input=${(e) => {
                const v = e.target.value.trim();
                if (!v) { this._updateParam(index, 'delay', undefined); return; }
                this._updateParam(index, 'delay', Number(v));
              }}>
            </ha-textfield>
            <ha-textfield
              label="Grid Layout"
              .value=${params.grid ? JSON.stringify(params.grid) : ''}
              .helper=${'Optional: [cols, rows] e.g. [6,1] for 6 horizontal bars. Leave empty for linear.'}
              @input=${(e) => {
                const v = e.target.value.trim();
                if (!v) { this._updateParam(index, 'grid', undefined); return; }
                try { this._updateParam(index, 'grid', JSON.parse(v)); } catch (_) {}
              }}>
            </ha-textfield>
            <ha-selector
              // @ts-ignore - TS2339: auto-suppressed
              .hass=${this.hass}
              .selector=${{ select: { mode: 'dropdown', options: [
                { value: 'first',  label: 'First → Last (forward chase)' },
                { value: 'last',   label: 'Last → First (reverse chase)' },
                { value: 'center', label: 'Center outward' }
              ]}}}
              .value=${params.from ?? 'first'}
              .label=${'Chase Direction'}
              @value-changed=${(e) => this._updateParam(index, 'from', e.detail.value)}>
            </ha-selector>
            <ha-textfield
              label="SVG/CSS Property"
              .value=${params.property ?? 'stroke'}
              .helper=${'stroke (SVG lines), fill (SVG shapes), color (text/HTML)'}
              @input=${(e) => this._updateParam(index, 'property', e.target.value)}>
            </ha-textfield>
            <ha-selector
              // @ts-ignore - TS2339: auto-suppressed
              .hass=${this.hass}
              .selector=${{ boolean: {} }}
              .value=${params.with_opacity !== undefined ? params.with_opacity : true}
              .label=${'Fade Opacity in Trail'}
              .helper=${'Also fade opacity during trail phase (legacy fades to 0.25)'}
              @value-changed=${(e) => this._updateParam(index, 'with_opacity', e.detail.value)}>
            </ha-selector>
            ${(params.with_opacity !== undefined ? params.with_opacity : true) ? html`
              <ha-selector
                // @ts-ignore - TS2339: auto-suppressed
                .hass=${this.hass}
                .selector=${{ number: { min: 0, max: 1, step: 0.05, mode: 'slider' } }}
                .value=${params.trail_opacity ?? 0.25}
                .label=${'Trail End Opacity'}
                @value-changed=${(e) => this._updateParam(index, 'trail_opacity', e.detail.value)}>
              </ha-selector>
            ` : ''}
          </div>
        `;
        break;

      case 'stagger-wave':
      case 'stagger-radial':
        specificParams = html`
          <div class="param-grid">
            <ha-selector
              // @ts-ignore - TS2339: auto-suppressed
              .hass=${this.hass}
              .selector=${{ number: { min: 0, max: 500, step: 10, mode: 'box' } }}
              .value=${params.delay ?? 100}
              .label=${'Stagger Delay (ms)'}
              @value-changed=${(e) => this._updateParam(index, 'delay', e.detail.value)}>
            </ha-selector>
            <ha-textfield
              label="Property"
              .value=${params.property ?? 'scale'}
              @input=${(e) => this._updateParam(index, 'property', e.target.value)}>
            </ha-textfield>
            <ha-textfield
              label="Center Point (for radial)"
              .value=${params.center ? JSON.stringify(params.center) : '[50, 50]'}
              .helper=${'Format: [x, y] in percentage. e.g., [50, 50]'}
              @input=${(e) => {
                try {
                  this._updateParam(index, 'center', JSON.parse(e.target.value));
                } catch (err) {}
              }}>
            </ha-textfield>
          </div>
        `;
        break;

      // Timeline Animation Presets (PR#233)
      case 'timeline-cascade':
        specificParams = html`
          <div class="param-grid">
            <ha-textfield
              label="Steps (JSON)"
              .value=${JSON.stringify(params.steps ?? [])}
              .helper=${'Array of step objects with targets, params, duration, offset'}
              @input=${(e) => {
                try {
                  this._updateParam(index, 'steps', JSON.parse(e.target.value));
                } catch (err) {}
              }}>
            </ha-textfield>
            <lcards-message type="info" .message=${'Define multiple sequential animation steps. Example: [{ targets: ".step-1", params: { opacity: [0, 1] }, duration: 300, offset: 0 }]'}></lcards-message>
          </div>
        `;
        break;

      case 'timeline-attention':
        specificParams = html`
          <div class="param-grid">
            <ha-selector
              // @ts-ignore - TS2339: auto-suppressed
              .hass=${this.hass}
              .selector=${{ number: { min: 0.5, max: 3, step: 0.1, mode: 'slider' } }}
              .value=${params.scale_amount ?? 1.3}
              .label=${'Scale Amount'}
              @value-changed=${(e) => this._updateParam(index, 'scale_amount', e.detail.value)}>
            </ha-selector>
            <ha-selector
              // @ts-ignore - TS2339: auto-suppressed
              .hass=${this.hass}
              .selector=${{ number: { min: 1, max: 50, step: 1, mode: 'slider' } }}
              .value=${params.shake_intensity ?? 10}
              .label=${'Shake Intensity'}
              @value-changed=${(e) => this._updateParam(index, 'shake_intensity', e.detail.value)}>
            </ha-selector>
          </div>
        `;
        break;
    }

    return html`
      ${specificParams ? html`
        <lcards-form-section
          header="Preset Parameters"
          icon="mdi:tune-variant"
          ?expanded=${true}>
          ${specificParams}
        </lcards-form-section>
      ` : ''}
      ${commonParams}
    `;
  }

  _renderCommonParams(params, index, options = {}) {
    return html`
      <lcards-form-section
        header="Timing & Duration"
        icon="mdi:timer-outline"
        ?expanded=${true}>
        <div class="param-grid">
          <ha-textfield
            type="number"
            label="Duration (ms)"
            .value=${params.duration ?? 1000}
            min="0"
            step="100"
            @input=${(e) => this._updateParam(index, 'duration', Number(e.target.value))}>
          </ha-textfield>

          ${!options.hideStartDelay ? html`<ha-textfield
            type="number"
            label="Start Delay (ms)"
            .value=${params.delay ?? 0}
            min="0"
            step="100"
            helper="Delay before animation starts"
            @input=${(e) => this._updateParam(index, 'delay', Number(e.target.value))}>
          </ha-textfield>` : ''}

          <ha-selector
            // @ts-ignore - TS2339: auto-suppressed
            .hass=${this.hass}
            .selector=${{ boolean: {} }}
            .value=${typeof params.loop === 'boolean' ? params.loop : (params.loop ? true : false)}
            .label=${'Loop Animation (Infinite)'}
            .helper=${'Toggle for infinite loop, or use Loop Count below for specific iterations'}
            @value-changed=${(e) => this._updateParam(index, 'loop', e.detail.value)}>
          </ha-selector>

          <ha-selector
            // @ts-ignore - TS2339: auto-suppressed
            .hass=${this.hass}
            .selector=${{ number: { min: 0, max: 100, step: 1, mode: 'box' } }}
            .value=${typeof params.loop === 'number' ? params.loop : ''}
            .label=${'Loop Count (0 = off, leave empty for infinite)'}
            @value-changed=${(e) => this._updateParam(index, 'loop', e.detail.value || false)}>
          </ha-selector>

          ${!options.hideAlternate ? html`<ha-selector
            // @ts-ignore - TS2339: auto-suppressed
            .hass=${this.hass}
            .selector=${{ boolean: {} }}
            .value=${params.alternate ?? false}
            .label=${'Alternate Direction'}
            .helper=${'Reverse animation direction on each loop'}
            @value-changed=${(e) => this._updateParam(index, 'alternate', e.detail.value)}>
          </ha-selector>` : ''}
        </div>
      </lcards-form-section>

      ${!options.hideEasing ? html`<lcards-form-section
        header="Easing Function"
        icon="mdi:chart-bell-curve"
        ?expanded=${true}>
        <div class="param-grid">
          <ha-selector
          // @ts-ignore - TS2339: auto-suppressed
          .hass=${this.hass}
          .selector=${{
            select: {
              mode: 'dropdown',
              options: [
                // Linear
                { value: 'linear', label: 'Linear' },

                // Power (parametric: power = 1.675 by default)
                { value: 'in', label: 'Power - In' },
                { value: 'out', label: 'Power - Out' },
                { value: 'inOut', label: 'Power - In/Out' },
                { value: 'outIn', label: 'Power - Out/In' },

                // Quad (Quadratic)
                { value: 'inQuad', label: 'Quad - In' },
                { value: 'outQuad', label: 'Quad - Out' },
                { value: 'inOutQuad', label: 'Quad - In/Out' },
                { value: 'outInQuad', label: 'Quad - Out/In' },

                // Cubic
                { value: 'inCubic', label: 'Cubic - In' },
                { value: 'outCubic', label: 'Cubic - Out' },
                { value: 'inOutCubic', label: 'Cubic - In/Out' },
                { value: 'outInCubic', label: 'Cubic - Out/In' },

                // Quart (Quartic)
                { value: 'inQuart', label: 'Quart - In' },
                { value: 'outQuart', label: 'Quart - Out' },
                { value: 'inOutQuart', label: 'Quart - In/Out' },
                { value: 'outInQuart', label: 'Quart - Out/In' },

                // Quint (Quintic)
                { value: 'inQuint', label: 'Quint - In' },
                { value: 'outQuint', label: 'Quint - Out' },
                { value: 'inOutQuint', label: 'Quint - In/Out' },
                { value: 'outInQuint', label: 'Quint - Out/In' },

                // Sine
                { value: 'inSine', label: 'Sine - In' },
                { value: 'outSine', label: 'Sine - Out' },
                { value: 'inOutSine', label: 'Sine - In/Out' },
                { value: 'outInSine', label: 'Sine - Out/In' },

                // Exponential
                { value: 'inExpo', label: 'Expo - In' },
                { value: 'outExpo', label: 'Expo - Out' },
                { value: 'inOutExpo', label: 'Expo - In/Out' },
                { value: 'outInExpo', label: 'Expo - Out/In' },

                // Circular
                { value: 'inCirc', label: 'Circ - In' },
                { value: 'outCirc', label: 'Circ - Out' },
                { value: 'inOutCirc', label: 'Circ - In/Out' },
                { value: 'outInCirc', label: 'Circ - Out/In' },

                // Back (parametric: overshoot = 1.70158 by default)
                { value: 'inBack', label: 'Back - In ↩️' },
                { value: 'outBack', label: 'Back - Out ↩️' },
                { value: 'inOutBack', label: 'Back - In/Out ↩️' },
                { value: 'outInBack', label: 'Back - Out/In ↩️' },

                // Elastic (parametric: amplitude = 1, period = 0.3 by default)
                { value: 'inElastic', label: 'Elastic - In 🎯' },
                { value: 'outElastic', label: 'Elastic - Out 🎯' },
                { value: 'inOutElastic', label: 'Elastic - In/Out 🎯' },
                { value: 'outInElastic', label: 'Elastic - Out/In 🎯' },

                // Bounce
                { value: 'inBounce', label: 'Bounce - In' },
                { value: 'outBounce', label: 'Bounce - Out' },
                { value: 'inOutBounce', label: 'Bounce - In/Out' },
                { value: 'outInBounce', label: 'Bounce - Out/In' },

                // Advanced Easings (require custom parameters)
                { value: 'cubicBezier', label: '🔧 Cubic Bézier - Custom curve' },
                { value: 'spring', label: '🔧 Spring - Physics-based' },
                { value: 'steps', label: '🔧 Steps - Frame-by-frame' },
                { value: 'linear', label: '🔧 Linear - Custom linear points' },
                { value: 'irregular', label: '🔧 Irregular - Randomized' },
                { value: 'custom', label: '🔧 Custom - anime.js string' }
              ]
            }
          }}
          .value=${params.ease ?? 'inOutQuad'}
          .label=${'Easing Function'}
          @value-changed=${(e) => this._updateParam(index, 'ease', e.detail.value)}>
        </ha-selector>
        </div>

        ${this._renderParametricEasingFields(params, index)}
      </lcards-form-section>` : ''}
    `;
  }

  _renderParametricEasingFields(params, index) {
    const ease = params.ease || 'inOutQuad';

    // Power easings (in, out, inOut, outIn)
    if (['in', 'out', 'inOut', 'outIn'].includes(ease)) {
      return html`
        <ha-textfield
          type="number"
          label="Power (exponent)"
          .value=${params.ease_params?.power ?? 1.675}
          min="0.1"
          max="10"
          step="0.1"
          helper="Default: 1.675. Higher = steeper curve"
          @input=${(e) => this._updateEaseParam(index, 'power', Number(e.target.value))}>
        </ha-textfield>
      `;
    }

    // Back easings (overshoot parameter)
    if (ease.includes('Back')) {
      return html`
        <ha-textfield
          type="number"
          label="Overshoot"
          .value=${params.ease_params?.overshoot ?? 1.70158}
          min="0"
          max="5"
          step="0.1"
          helper="Default: 1.70158. Higher = more overshoot"
          @input=${(e) => this._updateEaseParam(index, 'overshoot', Number(e.target.value))}>
        </ha-textfield>
      `;
    }

    // Elastic easings (amplitude and period)
    if (ease.includes('Elastic')) {
      return html`
        <div class="param-grid" style="grid-template-columns: 1fr 1fr;">
          <ha-textfield
            type="number"
            label="Amplitude"
            .value=${params.ease_params?.amplitude ?? 1}
            min="0.1"
            max="5"
            step="0.1"
            helper="Default: 1"
            @input=${(e) => this._updateEaseParam(index, 'amplitude', Number(e.target.value))}>
          </ha-textfield>

          <ha-textfield
            type="number"
            label="Period"
            .value=${params.ease_params?.period ?? 0.3}
            min="0.1"
            max="2"
            step="0.05"
            helper="Default: 0.3"
            @input=${(e) => this._updateEaseParam(index, 'period', Number(e.target.value))}>
          </ha-textfield>
        </div>
      `;
    }

    // Cubic Bézier (4 control points: x1, y1, x2, y2)
    if (ease === 'cubicBezier') {
      return html`
        <div class="param-grid" style="grid-template-columns: 1fr 1fr;">
          <ha-selector
            // @ts-ignore - TS2339: auto-suppressed
            .hass=${this.hass}
            .selector=${{ number: { min: 0, max: 1, step: 0.01, mode: 'box' } }}
            .value=${params.ease_params?.x1 ?? 0.25}
            .label=${'X1'}
            @value-changed=${(e) => this._updateEaseParam(index, 'x1', e.detail.value)}>
          </ha-selector>
          <ha-selector
            // @ts-ignore - TS2339: auto-suppressed
            .hass=${this.hass}
            .selector=${{ number: { min: -2, max: 2, step: 0.01, mode: 'box' } }}
            .value=${params.ease_params?.y1 ?? 0.1}
            .label=${'Y1'}
            @value-changed=${(e) => this._updateEaseParam(index, 'y1', e.detail.value)}>
          </ha-selector>
          <ha-selector
            // @ts-ignore - TS2339: auto-suppressed
            .hass=${this.hass}
            .selector=${{ number: { min: 0, max: 1, step: 0.01, mode: 'box' } }}
            .value=${params.ease_params?.x2 ?? 0.25}
            .label=${'X2'}
            @value-changed=${(e) => this._updateEaseParam(index, 'x2', e.detail.value)}>
          </ha-selector>
          <ha-selector
            // @ts-ignore - TS2339: auto-suppressed
            .hass=${this.hass}
            .selector=${{ number: { min: -2, max: 2, step: 0.01, mode: 'box' } }}
            .value=${params.ease_params?.y2 ?? 1}
            .label=${'Y2'}
            @value-changed=${(e) => this._updateEaseParam(index, 'y2', e.detail.value)}>
          </ha-selector>
        </div>
        <lcards-message type="info" .message=${'Define custom curve: (x1,y1) and (x2,y2) control points'}></lcards-message>
      `;
    }

    // Spring (physics-based easing)
    if (ease === 'spring') {
      return html`
        <div class="param-grid" style="grid-template-columns: 1fr 1fr;">
          <ha-selector
            // @ts-ignore - TS2339: auto-suppressed
            .hass=${this.hass}
            .selector=${{ number: { min: 0.1, max: 10, step: 0.1, mode: 'box' } }}
            .value=${params.ease_params?.mass ?? 1}
            .label=${'Mass'}
            @value-changed=${(e) => this._updateEaseParam(index, 'mass', e.detail.value)}>
          </ha-selector>
          <ha-selector
            // @ts-ignore - TS2339: auto-suppressed
            .hass=${this.hass}
            .selector=${{ number: { min: 1, max: 1000, step: 10, mode: 'box' } }}
            .value=${params.ease_params?.stiffness ?? 100}
            .label=${'Stiffness'}
            @value-changed=${(e) => this._updateEaseParam(index, 'stiffness', e.detail.value)}>
          </ha-selector>
          <ha-selector
            // @ts-ignore - TS2339: auto-suppressed
            .hass=${this.hass}
            .selector=${{ number: { min: 0, max: 100, step: 1, mode: 'box' } }}
            .value=${params.ease_params?.damping ?? 10}
            .label=${'Damping'}
            @value-changed=${(e) => this._updateEaseParam(index, 'damping', e.detail.value)}>
          </ha-selector>
          <ha-selector
            // @ts-ignore - TS2339: auto-suppressed
            .hass=${this.hass}
            .selector=${{ number: { min: -100, max: 100, step: 1, mode: 'box' } }}
            .value=${params.ease_params?.velocity ?? 0}
            .label=${'Velocity'}
            @value-changed=${(e) => this._updateEaseParam(index, 'velocity', e.detail.value)}>
          </ha-selector>
        </div>
        <lcards-message type="info" .message=${'Physics simulation. Try: mass=1, stiffness=170, damping=26'}></lcards-message>
      `;
    }

    // Steps (frame-by-frame animation)
    if (ease === 'steps') {
      return html`
        <div class="param-grid" style="grid-template-columns: 2fr 1fr;">
          <ha-selector
            // @ts-ignore - TS2339: auto-suppressed
            .hass=${this.hass}
            .selector=${{ number: { min: 1, max: 100, step: 1, mode: 'box' } }}
            .value=${params.ease_params?.steps ?? 10}
            .label=${'Number of Steps'}
            @value-changed=${(e) => this._updateEaseParam(index, 'steps', e.detail.value)}>
          </ha-selector>
          <ha-selector
            // @ts-ignore - TS2339: auto-suppressed
            .hass=${this.hass}
            .selector=${{ boolean: {} }}
            .value=${params.ease_params?.fromStart ?? false}
            .label=${'From Start'}
            @value-changed=${(e) => this._updateEaseParam(index, 'fromStart', e.detail.value)}>
          </ha-selector>
        </div>
        <lcards-message type="info" .message=${'Choppy frame-by-frame. fromStart: change at step start vs end'}></lcards-message>
      `;
    }

    // Linear (custom linear curve with points)
    if (ease === 'linear') {
      const pointsStr = JSON.stringify(params.ease_params?.points ?? [0, 0.25, 0.75, 1]);
      return html`
        <ha-selector
          // @ts-ignore - TS2339: auto-suppressed
          .hass=${this.hass}
          .selector=${{ text: { multiline: false } }}
          .value=${pointsStr}
          .label=${'Value Points (JSON)'}
          @value-changed=${(e) => {
            try {
              const parsed = JSON.parse(e.detail.value);
              if (Array.isArray(parsed)) {
                this._updateEaseParam(index, 'points', parsed);
              }
            } catch (err) {}
          }}>
        </ha-selector>
        <lcards-message type="info" .message=${'Linear between points: [0, 0.5, 1] or with timing: [0, "0.5 50%", 1]'}></lcards-message>
      `;
    }

    // Irregular (randomized easing)
    if (ease === 'irregular') {
      return html`
        <div class="param-grid" style="grid-template-columns: 1fr 1fr;">
          <ha-selector
            // @ts-ignore - TS2339: auto-suppressed
            .hass=${this.hass}
            .selector=${{ number: { min: 2, max: 100, step: 1, mode: 'box' } }}
            .value=${params.ease_params?.steps ?? 10}
            .label=${'Steps'}
            @value-changed=${(e) => this._updateEaseParam(index, 'steps', e.detail.value)}>
          </ha-selector>
          <ha-selector
            // @ts-ignore - TS2339: auto-suppressed
            .hass=${this.hass}
            .selector=${{ number: { min: 0.1, max: 5, step: 0.1, mode: 'box' } }}
            .value=${params.ease_params?.randomness ?? 1}
            .label=${'Randomness'}
            @value-changed=${(e) => this._updateEaseParam(index, 'randomness', e.detail.value)}>
          </ha-selector>
        </div>
        <lcards-message type="info" .message=${'Erratic motion. Higher randomness = wilder jumps'}></lcards-message>
      `;
    }

    // Custom (anime.js easing string)
    if (ease === 'custom') {
      return html`
        <ha-textarea
          label="anime.js Easing String"
          .value=${params.ease_params?.customString ?? ''}
          @input=${(e) => this._updateEaseParam(index, 'customString', e.target.value)}
          rows="3"
          style="width: 100%; font-family: 'Roboto Mono', monospace; --mdc-theme-primary: var(--primary-color);">
        </ha-textarea>
        <lcards-message type="info">
          Paste from <a href="https://animejs.com/easing-editor/spring/default" target="_blank">anime.js Easing Editor</a>.
          Example: <code>spring({ bounce: 0.4, duration: 500 })</code>
        </lcards-message>
      `;
    }

    return ''; // No parametric fields for other easings
  }

  _updateEaseParam(index, paramKey, value) {
    const updated = [...this.animations];
    const current = updated[index];
    updated[index] = {
      ...current,
      params: {
        ...current.params,
        ease_params: {
          ...current.params?.ease_params,
          [paramKey]: value
        }
      }
    };
    this._workingAnimations = updated;
    this._fireChange();
  }

  _renderCustomForm(anim, index) {
    const animeConfig = anim.animejs || {};
    const configString = JSON.stringify(animeConfig, null, 2);

    return html`
      <lcards-form-section
        header="Custom anime.js Configuration"
        icon="mdi:code-braces"
        ?expanded=${true}>
        <ha-yaml-editor
          .value=${configString}
          @value-changed=${(e) => this._updateCustomConfig(index, e.detail.value)}>
        </ha-yaml-editor>
        <lcards-message type="info">
          Enter a valid JSON object for anime.js v4 configuration.
          <a href="https://animejs.com/documentation/" target="_blank" rel="noopener noreferrer">
            View Documentation →
          </a>
        </lcards-message>
      </lcards-form-section>
    `;
  }

  _renderPlaceholderWarning(preset) {
    return html`
      <div class="warning-banner">
        <ha-icon icon="mdi:alert-circle"></ha-icon>
        <div>
          <strong>Placeholder Preset:</strong> "${this._formatPresetName(preset)}" is not yet implemented.
          You can still configure it, but it won't animate until the preset is completed.
        </div>
      </div>
    `;
  }

  _formatTrigger(trigger) {
    const map = {
      'on_load': 'Load',
      'on_hover': 'Hover',
      'on_leave': 'Leave',
      'on_tap': 'Tap',
      'on_datasource_change': 'Data Change',
      'on_entity_change': 'Entity Change'
    };
    return map[trigger] || trigger;
  }

  _getTriggerIcon(trigger) {
    const icons = {
      'on_load': 'mdi:loading',
      'on_hover': 'mdi:cursor-default-click',
      'on_leave': 'mdi:cursor-default-outline',
      'on_tap': 'mdi:gesture-tap',
      'on_datasource_change': 'mdi:database-sync',
      'on_entity_change': 'mdi:state-machine'
    };
    return icons[trigger] || 'mdi:lightning-bolt';
  }

  _getTriggerHelp(trigger) {
    const help = {
      'on_load': 'Executes when the card loads or updates',
      'on_hover': 'Executes when mouse enters the element',
      'on_leave': 'Executes when mouse leaves the element (use for exit animations)',
      'on_tap': 'Executes when the element is clicked/tapped',
      'on_datasource_change': 'Executes when associated data source value changes',
      'on_entity_change': 'Executes when monitored entity state changes (NEW in PR#235) - supports state filtering'
    };
    return help[trigger] || '';
  }

  _renderEntityChangeTriggerConfig(anim, index) {
    return html`
      <div style="margin-top: 16px; padding: 12px; background: var(--secondary-background-color); border-radius: 6px;">
        <label class="field-label">Entity Change Configuration</label>

        <ha-selector
          // @ts-ignore - TS2339: auto-suppressed
          .hass=${this.hass}
          .selector=${{ entity: {} }}
          .value=${anim.entity || ''}
          .label=${'Entity to Monitor'}
          .helper=${'Entity whose state changes will trigger this animation'}
          @value-changed=${(e) => this._updateAnimation(index, 'entity', e.detail.value)}
          style="margin-bottom: 12px;">
        </ha-selector>

        <ha-textfield
          label="From State (optional)"
          .value=${anim.from_state || ''}
          .helper=${'Only trigger when changing FROM this state (leave empty for any)'}
          @input=${(e) => this._updateAnimation(index, 'from_state', e.target.value)}
          style="width: 100%; margin-bottom: 12px;">
        </ha-textfield>

        <ha-textfield
          label="To State (optional)"
          .value=${anim.to_state || ''}
          .helper=${'Only trigger when changing TO this state (leave empty for any)'}
          @input=${(e) => this._updateAnimation(index, 'to_state', e.target.value)}
          style="width: 100%; margin-bottom: 12px;">
        </ha-textfield>

        <ha-selector
          // @ts-ignore - TS2339: auto-suppressed
          .hass=${this.hass}
          .selector=${{ boolean: {} }}
          .value=${anim.check_on_load || false}
          .label=${'Check on Load'}
          .helper=${'Also trigger if entity is already in target state when card loads'}
          @value-changed=${(e) => this._updateAnimation(index, 'check_on_load', e.detail.value)}
          style="margin-bottom: 12px;">
        </ha-selector>

        <lcards-message type="info" .message=${'Example: Monitor light.bedroom, animate when changing from "off" to "on", and also check on load if already "on"'}></lcards-message>
      </div>
    `;
  }

  _formatPresetName(preset) {
    const names = {
      'pulse': 'Pulse',
      'fade': 'Fade',
      'glow': 'Glow',
      'draw': 'Draw',
      'march': 'Marching Ants',
      'blink': 'Blink',
      'shimmer': 'Shimmer',
      'strobe': 'Strobe',
      'flicker': 'Flicker',
      'cascade': 'Cascade',
      'cascade-color': 'Cascade Colour',
      'ripple': 'Ripple',
      'scale': 'Scale',
      'scale-reset': 'Scale Reset',
      'set': 'Set Properties',
      'motionpath': 'Motion Path',
      'slide': 'Slide',
      'rotate': 'Rotate',
      'shake': 'Shake',
      'bounce': 'Bounce',
      'color-shift': 'Colour Shift',
      'border-pulse': 'Border Pulse',
      'skew': 'Skew',
      'scan-line': 'Scan Line',
      'glitch': 'Glitch',
      'stagger-flash': 'Stagger Flash',
      'stagger-grid': 'Stagger Grid',
      'stagger-wave': 'Stagger Wave',
      'stagger-radial': 'Stagger Radial'
    };
    return names[preset] || preset;
  }

  _getAnimationDetails(anim) {
    const params = anim.params || {};
    const parts = [];

    // Show duration if set
    if (params.duration) parts.push(`${params.duration}ms`);

    // Show ease if set
    if (params.ease && params.ease !== 'inOutQuad') parts.push(params.ease);

    // Show loop info
    if (params.loop === true) parts.push('loop: ∞');
    else if (typeof params.loop === 'number' && params.loop > 0) parts.push(`loop: ${params.loop}×`);

    // Show delay if set
    if (params.delay) parts.push(`delay: ${params.delay}ms`);

    // Show alternate if set
    if (params.alternate) parts.push('alternate');

    // Show key preset-specific params
    const preset = anim.preset || 'pulse';
    if (preset === 'pulse' && params.max_scale) parts.push(`scale: ${params.max_scale}`);
    if (preset === 'fade' && params.to !== undefined) parts.push(`opacity: ${params.to}`);
    if (preset === 'scale' && params.scale) parts.push(`scale: ${params.scale}`);

    return parts.length > 0 ? parts.join(' • ') : 'Default settings';
  }

  _getPresetOptions() {
    return [
      // Core Animations
      { value: 'pulse', label: 'Pulse - Breathing scale + brightness' },
      { value: 'fade', label: 'Fade - Opacity transition' },
      { value: 'glow', label: 'Glow - Drop shadow pulsing' },
      { value: 'draw', label: 'Draw - SVG stroke drawing' },
      { value: 'march', label: 'Marching Ants - Dashed line animation' },

      // Visual Effects
      { value: 'blink', label: 'Blink - Rapid opacity toggle' },
      { value: 'shimmer', label: 'Shimmer - Colour + opacity shimmer' },
      { value: 'strobe', label: 'Strobe - Fast flashing' },
      { value: 'flicker', label: 'Flicker - Random flickering' },
      { value: 'cascade', label: 'Cascade - Staggered animation' },
      { value: 'cascade-color', label: 'Cascade Colour - Row-by-row colour cycling' },
      { value: 'ripple', label: 'Ripple - Expanding wave effect' },
      { value: 'scale', label: 'Scale - Simple scale transform' },
      { value: 'scale-reset', label: 'Scale Reset - Return to original' },

      // Motion Effects (NEW - PR#229)
      { value: 'slide', label: 'Slide - Translate/position animation' },
      { value: 'rotate', label: 'Rotate - Rotation animation' },
      { value: 'shake', label: 'Shake - Vibrate/shake effect' },
      { value: 'bounce', label: 'Bounce - Elastic bounce' },
      { value: 'color-shift', label: 'Colour Shift - Pure colour transition' },
      { value: 'border-pulse', label: 'Border Pulse - Border animation' },
      { value: 'skew', label: 'Skew - Slant transformation' },
      { value: 'motionpath', label: 'Motion Path - Follow SVG path' },
      { value: 'glitch', label: 'Glitch - Digital distortion' },
      { value: 'physics-spring', label: 'Physics Spring - Spring physics simulation' },

      // Text Animations (NEW - PR#234)
      { value: 'text-reveal', label: '✨ Text Reveal - Character-by-character reveal' },
      { value: 'text-typewriter', label: '✨ Text Typewriter - Typing effect' },
      { value: 'text-scramble', label: '✨ Text Scramble - Matrix-style scramble' },
      { value: 'text-glitch', label: '✨ Text Glitch - Rapid jitter' },

      // Stagger Animations (NEW - PR#233)
      { value: 'stagger-flash', label: '⚡ Stagger Flash - LCARS chasing bar effect' },
      { value: 'stagger-grid', label: '⚡ Stagger Grid - Grid-based stagger' },
      { value: 'stagger-wave', label: '⚡ Stagger Wave - Wave pattern' },
      { value: 'stagger-radial', label: '⚡ Stagger Radial - Radial burst' },

      // Timeline Animations (NEW - PR#233)
      { value: 'timeline-cascade', label: '🎬 Timeline Cascade - Sequential steps' },
      { value: 'timeline-attention', label: '🎬 Timeline Attention - Attention-getter' },

      // Utility
      { value: 'set', label: 'Set - Immediate property change' }
    ];
  }

  _getPresetHelp(preset) {
    const help = {
      'pulse': 'Scales element up and down with brightness change - ideal for attention-getting',
      'fade': 'Smoothly fades element in or out by animating opacity',
      'glow': 'Creates pulsing glow effect using drop-shadow filter',
      'draw': 'Animates SVG path stroke drawing from start to end (for lines and shapes)',
      'march': 'Creates marching ants effect with animated dashed line pattern',
      'blink': 'Rapid blinking between two opacity values',
      'shimmer': 'Subtle shimmer effect with color and opacity changes',
      'strobe': 'Very fast flashing effect for alerts',
      'flicker': 'Random flickering like a faulty light',
      'cascade': 'Staggers animation across multiple elements with delay',
      'cascade-color': 'Row-by-row color cycling for data grids (authentic LCARS timing)',
      'ripple': 'Expands and fades like a ripple in water',
      'scale': 'Simple scale transform - great for hover feedback',
      'scale-reset': 'Returns element to original scale - use with on_leave',
      'set': 'Immediately sets CSS properties without animation',
      'slide': 'Slide element in from a direction (top/bottom/left/right)',
      'rotate': 'Rotate element continuously or to a specific angle',
      'shake': 'Horizontal shake effect - great for error states',
      'bounce': 'Elastic bouncing scale effect with spring physics',
      'color-shift': 'Smoothly transition between two colors',
      'border-pulse': 'Animate border color and width',
      'skew': 'Skew/slant transformation for 3D perspective effects',
      'motionpath': 'Follow an SVG path - element moves along curve with auto-rotation',
      'glitch': 'Digital glitch/distortion effect with rapid transforms',
      'physics-spring': 'Spring physics animation with realistic elasticity',
      'text-reveal': 'Character-by-character reveal with stagger - supports chars/words/lines',
      'text-typewriter': 'Classic typewriter effect – character-by-character reveal',
      'text-scramble': 'Matrix-style scramble with random character replacement',
      'text-glitch': 'Rapid position and opacity jitter for malfunction effect',
      'stagger-flash': 'Replicates legacy LCARS alert bar chase: bright lead color chases across elements, fading to gray trail. Set property to "stroke" for SVG bars.',
      'stagger-grid': 'Grid-based stagger - animate elements in grid pattern with directional wave',
      'stagger-wave': 'Wave pattern stagger - creates ripple effect across elements',
      'stagger-radial': 'Radial burst stagger - animates outward from center point',
      'timeline-cascade': 'Sequential coordinated animations across multiple targets',
      'timeline-attention': 'Attention-getting sequence (scale up → shake → return)'
    };
    return help[preset] || 'Animation preset';
  }

  _isPlaceholderPreset(preset) {
    // All core presets are now implemented
    return false;
  }

  _toggleExpanded(index) {
    this._expandedIndex = this._expandedIndex === index ? null : index;
    this._pendingDeleteIndex = null;
  }

  _addAnimation() {
    console.log('[AnimationEditor] 🎬 Add Animation button clicked!', {
      currentAnimations: this.animations.length,
      expandedIndex: this._expandedIndex
    });

    const newAnimation = {
      trigger: 'on_load',
      preset: 'pulse',
      params: {
        duration: 1000,
        ease: 'inOutQuad',
        loop: true,
        alternate: true,
        max_scale: 1.15,
        max_brightness: 1.4
      }
    };

    this._workingAnimations = [...this.animations, newAnimation];
    this._expandedIndex = this.animations.length - 1;

    lcardsLog.debug('[AnimationEditor] Animation added', {
      newCount: this.animations.length,
      newExpandedIndex: this._expandedIndex,
      newAnimation
    });

    this._fireChange();
    this.requestUpdate(); // Force re-render
  }

  _duplicateAnimation(e, index) {
    e.stopPropagation();
    const source = this.animations[index];
    const duplicate = JSON.parse(JSON.stringify(source)); // Deep clone

    this._workingAnimations = [
      ...this.animations.slice(0, index + 1),
      duplicate,
      ...this.animations.slice(index + 1)
    ];
    this._expandedIndex = index + 1;
    this._fireChange();
  }

  _deleteAnimation(e, index) {
    e.stopPropagation();
    this._workingAnimations = this.animations.filter((_, i) => i !== index);
    if (this._expandedIndex === index) {
      this._expandedIndex = null;
    } else if (this._expandedIndex > index) {
      this._expandedIndex--;
    }
    this._pendingDeleteIndex = null;
    this._fireChange();
  }

  _confirmDelete(index) {
    const e = { stopPropagation: () => {} };
    this._deleteAnimation(e, index);
  }

  _toggleEnabled(e, index) {
    e.stopPropagation();
    this._setEnabled(index, this.animations[index].enabled !== false ? false : undefined);
  }

  _setEnabled(index, value) {
    const updated = [...this.animations];
    const anim = { ...updated[index] };
    if (value === false) {
      anim.enabled = false;
    } else {
      // Remove enabled key entirely so YAML stays clean
      delete anim.enabled;
    }
    updated[index] = anim;
    this._workingAnimations = updated;
    this._fireChange();
  }

  _validateAnimationId(id, currentIndex) {
    if (!id) return null;
    // Only letters, numbers, hyphens, underscores
    if (!/^[a-zA-Z0-9_-]+$/.test(id)) {
      return 'ID can only contain letters, numbers, hyphens (-) and underscores (_). No spaces or special characters.';
    }
    // Check for duplicate IDs among all animations at other indices
    const allAnimations = this._workingAnimations || [];
    const duplicate = allAnimations.some((anim, i) => i !== currentIndex && anim.id === id);
    if (duplicate) {
      return `ID "${id}" is already used by another animation.`;
    }
    return null;
  }

  _handleIdChange(index, rawValue) {
    const value = rawValue?.trim() || undefined;
    // Always update working state so the field reflects user input
    const updated = [...this.animations];
    updated[index] = { ...updated[index], id: value };
    this._workingAnimations = updated;
    this.requestUpdate();
    // Only persist to config if ID is valid (or cleared)
    if (!value || !this._validateAnimationId(value, index)) {
      this._fireChange();
    }
  }

  _updateAnimation(index, key, value) {
    const updated = [...this.animations];
    updated[index] = { ...updated[index], [key]: value };
    this._workingAnimations = updated;
    this._fireChange();
  }

  _updateParam(index, paramKey, value) {
    const updated = [...this.animations];
    updated[index] = {
      ...updated[index],
      params: {
        ...updated[index].params,
        [paramKey]: value
      }
    };
    this._workingAnimations = updated;
    this._fireChange();
  }

  _toggleCustomMode(index, isCustom) {
    const updated = [...this.animations];
    if (isCustom) {
      // Convert preset to custom
      updated[index] = {
        trigger: updated[index].trigger || 'on_load',
        type: 'custom',
        animejs: {
          targets: '#your-overlay-id',
          scale: [1, 1.1, 1],
          duration: 1000,
          loop: true
        }
      };
    } else {
      // Convert custom to preset
      const { type, animejs, ...rest } = updated[index];
      updated[index] = {
        ...rest,
        preset: 'pulse',
        params: {
          duration: 1000,
          loop: true,
          max_scale: 1.1
        }
      };
    }
    this._workingAnimations = updated;
    this._fireChange();
  }

  _updateCustomConfig(index, jsonString) {
    try {
      const config = JSON.parse(jsonString);
      const updated = [...this.animations];
      updated[index] = {
        ...updated[index],
        animejs: config
      };
      this._workingAnimations = updated;
      this._fireChange();
    } catch (error) {
      lcardsLog.warn('[AnimationEditor] Invalid JSON:', error);
      // Don't update on invalid JSON
    }
  }

  _fireChange() {
    this.dispatchEvent(new CustomEvent('animations-changed', {
      detail: { value: this.animations },
      bubbles: true,
      composed: true
    }));
  }

  // ============================================================================
  // TARGET SELECTION METHODS
  // ============================================================================

  /**
   * Render target selection section
   * @param {Object} animation - Animation config object
   * @param {number} index - Animation index in array
   * @returns {TemplateResult}
   */
  _renderTargetSelector(animation, index) {
    const targetMode = animation.targets ? 'multiple' : 'single';

    return html`
      <lcards-form-section
        header="Target"
        icon="mdi:crosshairs-gps"
        description="Select which element(s) to animate"
        ?expanded=${true}>

        <div class="mode-selector">
          <ha-formfield .label=${'Single Element'}>
            <ha-radio
              .checked=${targetMode === 'single'}
              .value=${'single'}
              .name=${'target-mode-' + index}
              @change=${() => this._setTargetMode(index, 'single')}
            ></ha-radio>
          </ha-formfield>

          <ha-formfield .label=${'Multiple Elements'}>
            <ha-radio
              .checked=${targetMode === 'multiple'}
              .value=${'multiple'}
              .name=${'target-mode-' + index}
              @change=${() => this._setTargetMode(index, 'multiple')}
            ></ha-radio>
          </ha-formfield>
        </div>

        ${targetMode === 'single'
          ? this._renderSingleTarget(animation, index)
          : this._renderMultipleTargets(animation, index)
        }
      </lcards-form-section>
    `;
  }

  /**
   * Render single target mode UI
   * @param {Object} animation
   * @param {number} index
   * @returns {TemplateResult}
   */
  _renderSingleTarget(animation, index) {
    const options = this._getTargetOptions();
    const currentValue = animation.target || null;

    return html`
      <ha-selector
        // @ts-ignore - TS2339: auto-suppressed
        .hass=${this.hass}
        .selector=${{
          select: {
            mode: 'dropdown',
            custom_value: true,
            options: [
              { value: '_default', label: 'Card (Default)' },
              ...options
            ]
          }
        }}
        .value=${currentValue === null ? '_default' : currentValue}
        .label=${'Target Element'}
        @value-changed=${(e) => this._updateTarget(index, e.detail.value)}
      ></ha-selector>

      <div class="help-text">
        ${currentValue && currentValue !== '_default'
          ? this._renderValidation(currentValue)
          : html`<span>Leave empty to use card's default animation target</span>`
        }
      </div>
    `;
  }

  /**
   * Render multiple targets mode UI
   * @param {Object} animation
   * @param {number} index
   * @returns {TemplateResult}
   */
  _renderMultipleTargets(animation, index) {
    const options = this._getTargetOptions();
    const targets = animation.targets || [];

    return html`
      <div class="target-list">
        ${targets.map((target, targetIndex) => html`
          <div class="target-item">
            <ha-selector
              // @ts-ignore - TS2339: auto-suppressed
              .hass=${this.hass}
              .selector=${{
                select: {
                  mode: 'dropdown',
                  custom_value: true,
                  options: options
                }
              }}
              .value=${target}
              .label=${`Target ${targetIndex + 1}`}
              @value-changed=${(e) => this._updateTargetItem(index, targetIndex, e.detail.value)}
            ></ha-selector>

            <ha-icon-button
              .label=${'Remove target'}
              @click=${() => this._removeTarget(index, targetIndex)}
            >
              <ha-icon icon="mdi:close"></ha-icon>
            </ha-icon-button>
          </div>
        `)}

        <ha-button
          outlined
          @click=${() => this._addTarget(index)}
        >
          <ha-icon icon="mdi:plus" slot="icon"></ha-icon>
          Add Target
        </ha-button>

        ${targets.length > 0 ? this._renderMultiTargetValidation(targets) : ''}
      </div>
    `;
  }

  /**
   * Get list of available target options from card's shadow DOM
   * @returns {Array<{value: string, label: string}>}
   */
  _getTargetOptions() {
    const options = [];

    // Check if we have card element access
    // @ts-ignore - TS2339: auto-suppressed
    if (!this.cardElement) {
      lcardsLog.warn('[AnimationEditor] No card element provided for target discovery');
      return options;
    }

    // @ts-ignore - TS2339: auto-suppressed
    const root = this.cardElement.shadowRoot || this.cardElement.renderRoot;

    if (!root) {
      lcardsLog.warn('[AnimationEditor] Card element has no shadow/render root:', {
        // @ts-ignore - TS2339: auto-suppressed
        element: this.cardElement.tagName,
        // @ts-ignore - TS2339: auto-suppressed
        hasShadowRoot: !!this.cardElement.shadowRoot,
        // @ts-ignore - TS2339: auto-suppressed
        hasRenderRoot: !!this.cardElement.renderRoot
      });
      return options;
    }

    try {
      // Discover all elements with ID attributes OR data-* id attributes
      const elementsWithId = root.querySelectorAll('[id], [data-button-id], [data-overlay-id], [data-segment-id], [data-lcards-segment]');

      elementsWithId.forEach(el => {
        // Priority: id > data-button-id > data-overlay-id > data-segment-id > data-lcards-segment
        const id = el.id || el.getAttribute('data-button-id') || el.getAttribute('data-overlay-id') || el.getAttribute('data-segment-id') || el.getAttribute('data-lcards-segment');
        const tagName = el.tagName.toLowerCase();

        // Safely get class names (handle SVG elements where className is SVGAnimatedString)
        let classes = '';
        if (el.classList && el.classList.length > 0) {
          classes = '.' + Array.from(el.classList).join('.');
        }

        // Skip internal framework IDs (if any)
        if (id && (id.startsWith('_') || id.startsWith('ha-'))) {
          return;
        }

        if (id) {
          options.push({
            value: `#${id}`,
            label: `#${id} <${tagName}>${classes || ''}`
          });
        }
      });

      // Discover text field elements (SVG <text> and background <rect> with data-field-id)
      const textFieldElements = root.querySelectorAll('[data-field-id]');
      const seenFieldIds = new Set();
      textFieldElements.forEach(el => {
        const fieldId = el.getAttribute('data-field-id');
        if (!fieldId || seenFieldIds.has(fieldId)) return;
        seenFieldIds.add(fieldId);
        const tagName = el.tagName.toLowerCase();
        const isBackground = fieldId.endsWith('-bg');
        const prefix = isBackground ? 'text-bg' : 'text';
        options.push({
          value: `[data-field-id="${fieldId}"]`,
          label: `[${prefix}] ${fieldId} <${tagName}>`
        });
      });

      // Also scan for elements with CSS classes for more flexibility
      const elementsWithClass = root.querySelectorAll('[class]');
      const seenClasses = new Set();

      elementsWithClass.forEach(el => {
        const classList = Array.from(el.classList);
        classList.forEach(cls => {
          // Skip generic/common classes
          if (cls && !seenClasses.has(cls) && !cls.startsWith('_') && !cls.match(/^(ha-|mdc-|button-svg)/)) {
            seenClasses.add(cls);
            const tagName = el.tagName.toLowerCase();
            options.push({
              value: `.${cls}`,
              label: `.${cls} <${tagName}>`
            });
          }
        });
      });

      lcardsLog.debug('[AnimationEditor] Discovered targets:', {
        count: options.length
      });

    } catch (error) {
      lcardsLog.error('[AnimationEditor] Error discovering targets:', error);
    }

    // Sort alphabetically
    options.sort((a, b) => a.label.localeCompare(b.label));

    return options;
  }

  /**
   * Set target mode (single vs multiple)
   * @param {number} index - Animation index
   * @param {string} mode - 'single' or 'multiple'
   */
  _setTargetMode(index, mode) {
    const animations = [...this.animations];
    const animation = { ...animations[index] };  // shallow copy to avoid mutating frozen objects
    animations[index] = animation;

    if (mode === 'single') {
      // Convert to single mode
      const firstTarget = animation.targets?.[0] || '';
      animation.target = firstTarget;
      delete animation.targets;
    } else {
      // Convert to multiple mode
      const currentTarget = animation.target || '';
      animation.targets = currentTarget ? [currentTarget] : [];
      delete animation.target;
    }

    this._workingAnimations = animations;
    this._fireChange();
  }

  /**
   * Update single target value
   * @param {number} index
   * @param {string} value
   */
  _updateTarget(index, value) {
    const animations = [...this.animations];
    const animation = { ...animations[index] };  // shallow copy to avoid mutating frozen objects
    animations[index] = animation;

    if (value === '' || value === null || value === '_default') {
      // Remove target field to use default
      delete animation.target;
    } else {
      animation.target = value;
    }

    // Remove targets array if switching from multiple mode
    delete animation.targets;

    this._workingAnimations = animations;
    this._fireChange();
  }

  /**
   * Add new target to multiple targets array
   * @param {number} index
   */
  _addTarget(index) {
    const animations = [...this.animations];
    const animation = { ...animations[index] };  // shallow copy to avoid mutating frozen objects
    animation.targets = animation.targets ? [...animation.targets] : [];
    animations[index] = animation;

    animation.targets.push('');  // Empty string for user to fill

    this._workingAnimations = animations;
    this._fireChange();
  }

  /**
   * Update specific target in multiple targets array
   * @param {number} animIndex
   * @param {number} targetIndex
   * @param {string} value
   */
  _updateTargetItem(animIndex, targetIndex, value) {
    const animations = [...this.animations];
    const animation = { ...animations[animIndex] };  // shallow copy to avoid mutating frozen objects
    animation.targets = animation.targets ? [...animation.targets] : [];
    animations[animIndex] = animation;

    animation.targets[targetIndex] = value;

    this._workingAnimations = animations;
    this._fireChange();
  }

  /**
   * Remove target from multiple targets array
   * @param {number} animIndex
   * @param {number} targetIndex
   */
  _removeTarget(animIndex, targetIndex) {
    const animations = [...this.animations];
    const animation = { ...animations[animIndex] };  // shallow copy to avoid mutating frozen objects
    animations[animIndex] = animation;

    if (animation.targets) {
      animation.targets = [...animation.targets];
      animation.targets.splice(targetIndex, 1);

      // Clean up empty array
      if (animation.targets.length === 0) {
        delete animation.targets;
      }
    }

    this._workingAnimations = animations;
    this._fireChange();
  }

  /**
   * Validate CSS selector against card's shadow DOM
   * @param {string} selector
   * @returns {Object} {valid: boolean, count: number, message: string}
   * @private
   */
  _validateSelector(selector) {
    if (!selector) {
      return { valid: true, count: 0, message: '' };
    }

    // @ts-ignore - TS2339: auto-suppressed
    if (!this.cardElement?.shadowRoot && !this.cardElement?.renderRoot) {
      return {
        valid: false,
        count: 0,
        message: '⚠️ Cannot validate - card preview not available'
      };
    }

    // @ts-ignore - TS2339: auto-suppressed
    const root = this.cardElement.shadowRoot || this.cardElement.renderRoot;

    try {
      const matches = root.querySelectorAll(selector);
      const count = matches.length;

      if (count === 0) {
        return {
          valid: true,  // Valid syntax, just no matches
          count: 0,
          message: '⚠️ No elements match this selector'
        };
      }

      return {
        valid: true,
        count: count,
        message: `✅ ${count} element${count === 1 ? '' : 's'} matched`
      };

    } catch (error) {
      return {
        valid: false,
        count: 0,
        message: `❌ Invalid selector: ${error.message}`
      };
    }
  }

  /**
   * Render validation message for single selector
   */
  _renderValidation(selector) {
    const validation = this._validateSelector(selector);

    return html`
      <div class="validation-message ${validation.valid ? 'valid' : 'error'}">
        ${validation.message}
      </div>
    `;
  }

  /**
   * Render validation for multiple targets
   */
  _renderMultiTargetValidation(targets) {
    let totalCount = 0;
    let hasErrors = false;

    targets.forEach(selector => {
      const result = this._validateSelector(selector);
      if (!result.valid) {
        hasErrors = true;
      }
      totalCount += result.count;
    });

    return html`
      <div class="validation-summary ${hasErrors ? 'error' : 'valid'}">
        ${hasErrors
          ? html`⚠️ Some selectors are invalid`
          : html`✅ ${totalCount} total element${totalCount === 1 ? '' : 's'} matched`
        }
      </div>
    `;
  }
}

customElements.define('lcards-animation-editor', LCARdSAnimationEditor);
