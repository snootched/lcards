/**
 * lcards-animation-editor.js
 * Advanced animation configuration editor component
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
      animations: { type: Array },
      _expandedIndex: { type: Number }
    };
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

      .animation-type-row {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 4px;
      }

      .animation-type {
        font-weight: 600;
        font-size: 18px;
      }

      .animation-details {
        font-size: 12px;
        color: var(--secondary-text-color);
        font-family: monospace;
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
    this.animations = [];
    this._expandedIndex = null;
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

    return html`
      <div class="animation-item">
        <div class="animation-header" @click=${() => this._toggleExpanded(index)}>
          <ha-icon
            class="animation-icon"
            icon=${isCustom ? 'mdi:code-braces' : 'mdi:animation'}>
          </ha-icon>

          <div class="animation-info">
            <div class="animation-type-row">
              <span class="animation-type">${isCustom ? 'Custom' : this._formatPresetName(preset)}</span>
              <ha-button
                size="small"
                appearance="filled"
                variant="success"
                .label=${this._formatTrigger(trigger)}>
                ${this._formatTrigger(trigger)}
              </ha-button>
            </div>
            <div class="animation-details">${this._getAnimationDetails(anim)}</div>
          </div>

          <div class="animation-actions">
            <ha-icon-button
              @click=${(e) => this._duplicateAnimation(e, index)}
              .label=${'Duplicate'}
              .path=${'M19,21H8V7H19M19,5H8A2,2 0 0,0 6,7V21A2,2 0 0,0 8,23H19A2,2 0 0,0 21,21V7A2,2 0 0,0 19,5M16,1H4A2,2 0 0,0 2,3V17H4V3H16V1Z'}>
            </ha-icon-button>
            <ha-icon-button
              @click=${(e) => this._deleteAnimation(e, index)}
              .label=${'Delete'}
              .path=${'M19,4H15.5L14.5,3H9.5L8.5,4H5V6H19M6,19A2,2 0 0,0 8,21H16A2,2 0 0,0 18,19V7H6V19Z'}>
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

    return html`
      <!-- Trigger Section -->
      <lcards-form-section
        header="Trigger"
        icon="mdi:lightning-bolt"
        ?expanded=${true}>
        <ha-selector
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
                { value: 'on_entity_change', label: '\u2728 On Entity Change (PR#235)' }
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

      <!-- Custom Toggle -->
      <ha-selector
        .hass=${this.hass}
        .selector=${{ boolean: {} }}
        .value=${isCustom}
        .label=${'Use Custom anime.js Code'}
        .helper=${'Switch to custom anime.js v4 configuration instead of preset'}
        @value-changed=${(e) => this._toggleCustomMode(index, e.detail.value)}
      ></ha-selector>

      ${isCustom ? this._renderCustomForm(anim, index) : html`
        ${isPlaceholder ? this._renderPlaceholderWarning(preset) : ''}
        ${this._renderPresetForm(anim, index)}
      `}
    `;
  }

  _renderPresetForm(anim, index) {
    const params = anim.params || {};
    const preset = anim.preset || 'pulse';

    return html`
      <!-- Preset Selection Section -->
      <lcards-form-section
        header="Animation Preset"
        icon="mdi:animation"
        ?expanded=${true}>
        <ha-selector
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
    const commonParams = this._renderCommonParams(params, index);

    // Preset-specific parameters
    let specificParams = '';

    switch (preset) {
      case 'pulse':
        specificParams = html`
          <div class="param-grid">
            <ha-selector
              .hass=${this.hass}
              .selector=${{ number: { min: 0.5, max: 3, step: 0.05, mode: 'slider' } }}
              .value=${params.max_scale ?? params.scale ?? 1.15}
              .label=${'Max Scale'}
              @value-changed=${(e) => this._updateParam(index, 'max_scale', e.detail.value)}>
            </ha-selector>
            <ha-selector
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
              .hass=${this.hass}
              .selector=${{ number: { min: 0, max: 1, step: 0.05, mode: 'slider' } }}
              .value=${params.from ?? 1}
              .label=${'From Opacity'}
              @value-changed=${(e) => this._updateParam(index, 'from', e.detail.value)}>
            </ha-selector>
            <ha-selector
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
              .hass=${this.hass}
              .selector=${{ number: { min: 0, max: 50, step: 1, mode: 'slider' } }}
              .value=${params.blur_min ?? 0}
              .label=${'Min Blur (px)'}
              @value-changed=${(e) => this._updateParam(index, 'blur_min', e.detail.value)}>
            </ha-selector>
            <ha-selector
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
              .hass=${this.hass}
              .selector=${{ number: { min: 0, max: 1, step: 0.05, mode: 'slider' } }}
              .value=${params.max_opacity ?? 1}
              .label=${'Max Opacity'}
              @value-changed=${(e) => this._updateParam(index, 'max_opacity', e.detail.value)}>
            </ha-selector>
            <ha-selector
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
              .hass=${this.hass}
              .selector=${{ number: { min: 0, max: 1, step: 0.05, mode: 'slider' } }}
              .value=${params.opacity_from ?? 1}
              .label=${'Opacity From'}
              @value-changed=${(e) => this._updateParam(index, 'opacity_from', e.detail.value)}>
            </ha-selector>
            <ha-selector
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
              .hass=${this.hass}
              .selector=${{ number: { min: 0, max: 1, step: 0.05, mode: 'slider' } }}
              .value=${params.max_opacity ?? 1}
              .label=${'Max Opacity'}
              @value-changed=${(e) => this._updateParam(index, 'max_opacity', e.detail.value)}>
            </ha-selector>
            <ha-selector
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
              .hass=${this.hass}
              .selector=${{ number: { min: 0, max: 1, step: 0.05, mode: 'slider' } }}
              .value=${params.max_opacity ?? 1}
              .label=${'Max Opacity'}
              @value-changed=${(e) => this._updateParam(index, 'max_opacity', e.detail.value)}>
            </ha-selector>
            <ha-selector
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
        const colors = params.colors ?? ['#0783FF', '#0439A3', '#E7F3F7'];
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
              .hass=${this.hass}
              .selector=${{ number: { min: 1, max: 5, step: 0.1, mode: 'slider' } }}
              .value=${params.scale_max ?? 1.5}
              .label=${'Max Scale'}
              @value-changed=${(e) => this._updateParam(index, 'scale_max', e.detail.value)}>
            </ha-selector>
            <ha-selector
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
              .hass=${this.hass}
              .selector=${{ number: { min: 0.1, max: 3, step: 0.05, mode: 'slider' } }}
              .value=${params.from ?? 1}
              .label=${'From Scale'}
              @value-changed=${(e) => this._updateParam(index, 'from', e.detail.value)}>
            </ha-selector>
            <ha-selector
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
              .hass=${this.hass}
              .selector=${{ number: { min: 1, max: 50, step: 1, mode: 'slider' } }}
              .value=${params.intensity ?? 10}
              .label=${'Shake Intensity (px)'}
              @value-changed=${(e) => this._updateParam(index, 'intensity', e.detail.value)}>
            </ha-selector>
            <ha-selector
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
              .hass=${this.hass}
              .selector=${{ number: { min: 0.1, max: 3, step: 0.1, mode: 'slider' } }}
              .value=${params.max_scale ?? 1.3}
              .label=${'Max Scale'}
              @value-changed=${(e) => this._updateParam(index, 'max_scale', e.detail.value)}>
            </ha-selector>
            <ha-selector
              .hass=${this.hass}
              .selector=${{ number: { min: 1, max: 10, step: 1, mode: 'slider' } }}
              .value=${params.bounces ?? 3}
              .label=${'Number of Bounces'}
              @value-changed=${(e) => this._updateParam(index, 'bounces', e.detail.value)}>
            </ha-selector>
            <ha-selector
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
                .value=${params.from_color ?? '#0783FF'}
                @value-changed=${(e) => this._updateParam(index, 'from_color', e.detail.value)}>
              </lcards-color-picker>
            </div>
            <div class="param-full">
              <label class="field-label">To Color</label>
              <lcards-color-picker
                .value=${params.to_color ?? '#FF6600'}
                @value-changed=${(e) => this._updateParam(index, 'to_color', e.detail.value)}>
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
              .hass=${this.hass}
              .selector=${{ number: { min: 0, max: 20, step: 1, mode: 'slider' } }}
              .value=${params.min_width ?? 1}
              .label=${'Min Width (px)'}
              @value-changed=${(e) => this._updateParam(index, 'min_width', e.detail.value)}>
            </ha-selector>
            <ha-selector
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
              .hass=${this.hass}
              .selector=${{ number: { min: -45, max: 45, step: 1, mode: 'box' } }}
              .value=${params.x ?? 0}
              .label=${'Skew X (degrees)'}
              @value-changed=${(e) => this._updateParam(index, 'x', e.detail.value)}>
            </ha-selector>
            <ha-selector
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
              .hass=${this.hass}
              .selector=${{ number: { min: 1, max: 100, step: 1, mode: 'slider' } }}
              .value=${params.width ?? 20}
              .label=${'Line Width (%)'}
              @value-changed=${(e) => this._updateParam(index, 'width', e.detail.value)}>
            </ha-selector>
          </div>
        `;
        break;

      // Text Animation Presets (PR#234)
      case 'text-reveal':
        specificParams = html`
          <div class="param-grid">
            <ha-selector
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
              .value=${params.split_type ?? 'chars'}
              .label=${'Split By'}
              @value-changed=${(e) => this._updateParam(index, 'split_type', e.detail.value)}>
            </ha-selector>
            <ha-selector
              .hass=${this.hass}
              .selector=${{ number: { min: 0, max: 500, step: 10, mode: 'box' } }}
              .value=${params.delay ?? 50}
              .label=${'Stagger Delay (ms)'}
              @value-changed=${(e) => this._updateParam(index, 'delay', e.detail.value)}>
            </ha-selector>
            <ha-selector
              .hass=${this.hass}
              .selector=${{ number: { min: 0, max: 1, step: 0.05, mode: 'slider' } }}
              .value=${params.from_opacity ?? 0}
              .label=${'From Opacity'}
              @value-changed=${(e) => this._updateParam(index, 'from_opacity', e.detail.value)}>
            </ha-selector>
          </div>
        `;
        break;

      case 'text-typewriter':
        specificParams = html`
          <div class="param-grid">
            <ha-selector
              .hass=${this.hass}
              .selector=${{ number: { min: 10, max: 500, step: 10, mode: 'box' } }}
              .value=${params.delay ?? 80}
              .label=${'Character Delay (ms)'}
              @value-changed=${(e) => this._updateParam(index, 'delay', e.detail.value)}>
            </ha-selector>
            <ha-selector
              .hass=${this.hass}
              .selector=${{ boolean: {} }}
              .value=${params.cursor ?? true}
              .label=${'Show Cursor'}
              @value-changed=${(e) => this._updateParam(index, 'cursor', e.detail.value)}>
            </ha-selector>
            <ha-textfield
              label="Cursor Character"
              .value=${params.cursor_char ?? '▊'}
              maxlength="2"
              @input=${(e) => this._updateParam(index, 'cursor_char', e.target.value)}>
            </ha-textfield>
          </div>
        `;
        break;

      case 'text-scramble':
        specificParams = html`
          <div class="param-grid">
            <ha-selector
              .hass=${this.hass}
              .selector=${{ number: { min: 10, max: 500, step: 10, mode: 'box' } }}
              .value=${params.delay ?? 50}
              .label=${'Character Delay (ms)'}
              @value-changed=${(e) => this._updateParam(index, 'delay', e.detail.value)}>
            </ha-selector>
            <ha-selector
              .hass=${this.hass}
              .selector=${{ number: { min: 1, max: 20, step: 1, mode: 'slider' } }}
              .value=${params.scramble_iterations ?? 5}
              .label=${'Scramble Iterations'}
              @value-changed=${(e) => this._updateParam(index, 'scramble_iterations', e.detail.value)}>
            </ha-selector>
            <ha-textfield
              label="Scramble Characters"
              .value=${params.chars ?? 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'}
              @input=${(e) => this._updateParam(index, 'chars', e.target.value)}>
            </ha-textfield>
          </div>
        `;
        break;

      case 'text-wave':
        specificParams = html`
          <div class="param-grid">
            <ha-selector
              .hass=${this.hass}
              .selector=${{ number: { min: 1, max: 50, step: 1, mode: 'slider' } }}
              .value=${params.amplitude ?? 10}
              .label=${'Wave Amplitude (px)'}
              @value-changed=${(e) => this._updateParam(index, 'amplitude', e.detail.value)}>
            </ha-selector>
            <ha-selector
              .hass=${this.hass}
              .selector=${{ number: { min: 1, max: 20, step: 1, mode: 'slider' } }}
              .value=${params.wave_length ?? 4}
              .label=${'Wave Length (characters)'}
              @value-changed=${(e) => this._updateParam(index, 'wave_length', e.detail.value)}>
            </ha-selector>
            <ha-selector
              .hass=${this.hass}
              .selector=${{ number: { min: 10, max: 200, step: 10, mode: 'box' } }}
              .value=${params.delay ?? 50}
              .label=${'Stagger Delay (ms)'}
              @value-changed=${(e) => this._updateParam(index, 'delay', e.detail.value)}>
            </ha-selector>
          </div>
        `;
        break;

      case 'text-glitch':
        specificParams = html`
          <div class="param-grid">
            <ha-selector
              .hass=${this.hass}
              .selector=${{ number: { min: 1, max: 50, step: 1, mode: 'slider' } }}
              .value=${params.intensity ?? 10}
              .label=${'Glitch Intensity (px)'}
              @value-changed=${(e) => this._updateParam(index, 'intensity', e.detail.value)}>
            </ha-selector>
            <ha-selector
              .hass=${this.hass}
              .selector=${{ number: { min: 10, max: 200, step: 10, mode: 'box' } }}
              .value=${params.interval ?? 50}
              .label=${'Glitch Interval (ms)'}
              @value-changed=${(e) => this._updateParam(index, 'interval', e.detail.value)}>
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

      case 'stagger-wave':
      case 'stagger-radial':
        specificParams = html`
          <div class="param-grid">
            <ha-selector
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
              .hass=${this.hass}
              .selector=${{ number: { min: 0.5, max: 3, step: 0.1, mode: 'slider' } }}
              .value=${params.scale_amount ?? 1.3}
              .label=${'Scale Amount'}
              @value-changed=${(e) => this._updateParam(index, 'scale_amount', e.detail.value)}>
            </ha-selector>
            <ha-selector
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
      ${specificParams}
      ${commonParams}
    `;
  }

  _renderCommonParams(params, index) {
    return html`
      <div class="param-grid">
        <ha-textfield
          type="number"
          label="Duration (ms)"
          .value=${params.duration ?? 1000}
          min="0"
          step="100"
          @input=${(e) => this._updateParam(index, 'duration', Number(e.target.value))}>
        </ha-textfield>

        <ha-selector
          .hass=${this.hass}
          .selector=${{
            select: {
              mode: 'dropdown',
              options: [
                { value: 'linear', label: 'Linear' },
                { value: 'easeInOutQuad', label: 'Ease In/Out (Quad)' },
                { value: 'easeOutQuad', label: 'Ease Out (Quad)' },
                { value: 'easeInQuad', label: 'Ease In (Quad)' },
                { value: 'easeInOutCubic', label: 'Ease In/Out (Cubic)' },
                { value: 'easeInOutSine', label: 'Ease In/Out (Sine)' },
                { value: 'easeOutExpo', label: 'Ease Out (Expo)' },
                { value: 'easeInOutElastic', label: 'Elastic' },
                { value: 'spring', label: 'Spring' }
              ]
            }
          }}
          .value=${params.easing ?? 'easeInOutQuad'}
          .label=${'Easing Function'}
          @value-changed=${(e) => this._updateParam(index, 'easing', e.detail.value)}>
        </ha-selector>

        <ha-selector
          .hass=${this.hass}
          .selector=${{ boolean: {} }}
          .value=${typeof params.loop === 'boolean' ? params.loop : (params.loop ? true : false)}
          .label=${'Loop Animation (Infinite)'}
          .helper=${'Toggle for infinite loop, or use Loop Count below for specific iterations'}
          @value-changed=${(e) => this._updateParam(index, 'loop', e.detail.value)}>
        </ha-selector>

        <ha-selector
          .hass=${this.hass}
          .selector=${{ number: { min: 0, max: 100, step: 1, mode: 'box' } }}
          .value=${typeof params.loop === 'number' ? params.loop : ''}
          .label=${'Loop Count (0 = off, leave empty for infinite)'}
          @value-changed=${(e) => this._updateParam(index, 'loop', e.detail.value || false)}>
        </ha-selector>

        <ha-selector
          .hass=${this.hass}
          .selector=${{ boolean: {} }}
          .value=${params.alternate ?? false}
          .label=${'Alternate Direction'}
          .helper=${'Reverse animation direction on each loop'}
          @value-changed=${(e) => this._updateParam(index, 'alternate', e.detail.value)}>
        </ha-selector>

        <ha-textfield
          type="number"
          label="Start Delay (ms)"
          .value=${params.delay ?? 0}
          min="0"
          step="100"
          helper="Delay before animation starts"
          @input=${(e) => this._updateParam(index, 'delay', Number(e.target.value))}>
        </ha-textfield>
      </div>
    `;
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

        <lcards-message type="info" .message=${'Example: Monitor light.bedroom, animate only when changing from "off" to "on"'}></lcards-message>
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
      'cascade-color': 'Cascade Color',
      'ripple': 'Ripple',
      'scale': 'Scale',
      'scale-reset': 'Scale Reset',
      'set': 'Set Properties',
      'motionpath': 'Motion Path',
      'slide': 'Slide',
      'rotate': 'Rotate',
      'shake': 'Shake',
      'bounce': 'Bounce',
      'color-shift': 'Color Shift',
      'border-pulse': 'Border Pulse',
      'skew': 'Skew',
      'scan-line': 'Scan Line',
      'glitch': 'Glitch'
    };
    return names[preset] || preset;
  }

  _getAnimationDetails(anim) {
    const params = anim.params || {};
    const parts = [];

    // Show duration if set
    if (params.duration) parts.push(`${params.duration}ms`);

    // Show easing if set
    if (params.easing && params.easing !== 'easeInOutQuad') parts.push(params.easing);

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
      { value: 'shimmer', label: 'Shimmer - Color + opacity shimmer' },
      { value: 'strobe', label: 'Strobe - Fast flashing' },
      { value: 'flicker', label: 'Flicker - Random flickering' },
      { value: 'cascade', label: 'Cascade - Staggered animation' },
      { value: 'cascade-color', label: 'Cascade Color - Row-by-row color cycling' },
      { value: 'ripple', label: 'Ripple - Expanding wave effect' },
      { value: 'scale', label: 'Scale - Simple scale transform' },
      { value: 'scale-reset', label: 'Scale Reset - Return to original' },

      // Motion Effects (NEW - PR#229)
      { value: 'slide', label: 'Slide - Translate/position animation' },
      { value: 'rotate', label: 'Rotate - Rotation animation' },
      { value: 'shake', label: 'Shake - Vibrate/shake effect' },
      { value: 'bounce', label: 'Bounce - Elastic bounce' },
      { value: 'color-shift', label: 'Color Shift - Pure color transition' },
      { value: 'border-pulse', label: 'Border Pulse - Border animation' },
      { value: 'skew', label: 'Skew - Slant transformation' },
      { value: 'scan-line', label: 'Scan Line - Moving gradient' },

      // Text Animations (NEW - PR#234)
      { value: 'text-reveal', label: '✨ Text Reveal - Character-by-character reveal' },
      { value: 'text-typewriter', label: '✨ Text Typewriter - Typing effect' },
      { value: 'text-scramble', label: '✨ Text Scramble - Matrix-style scramble' },
      { value: 'text-wave', label: '✨ Text Wave - Sinusoidal motion' },
      { value: 'text-glitch', label: '✨ Text Glitch - Rapid jitter' },

      // Stagger Animations (NEW - PR#233)
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
      'scan-line': 'Moving gradient scan line effect (LCARS-style)',
      'text-reveal': 'Character-by-character reveal with stagger - supports chars/words/lines',
      'text-typewriter': 'Classic typewriter effect with optional cursor',
      'text-scramble': 'Matrix-style scramble with random character replacement',
      'text-wave': 'Sinusoidal wave motion across text characters',
      'text-glitch': 'Rapid position and opacity jitter for malfunction effect',
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
  }

  _addAnimation() {
    const newAnimation = {
      trigger: 'on_load',
      preset: 'pulse',
      params: {
        duration: 1000,
        easing: 'easeInOutQuad',
        loop: true,
        alternate: true,
        max_scale: 1.15,
        max_brightness: 1.4
      }
    };

    this.animations = [...this.animations, newAnimation];
    this._expandedIndex = this.animations.length - 1;
    this._fireChange();
  }

  _duplicateAnimation(e, index) {
    e.stopPropagation();
    const source = this.animations[index];
    const duplicate = JSON.parse(JSON.stringify(source)); // Deep clone

    this.animations = [
      ...this.animations.slice(0, index + 1),
      duplicate,
      ...this.animations.slice(index + 1)
    ];
    this._expandedIndex = index + 1;
    this._fireChange();
  }

  _deleteAnimation(e, index) {
    e.stopPropagation();
    this.animations = this.animations.filter((_, i) => i !== index);
    if (this._expandedIndex === index) {
      this._expandedIndex = null;
    } else if (this._expandedIndex > index) {
      this._expandedIndex--;
    }
    this._fireChange();
  }

  _updateAnimation(index, key, value) {
    const updated = [...this.animations];
    updated[index] = { ...updated[index], [key]: value };
    this.animations = updated;
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
    this.animations = updated;
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
    this.animations = updated;
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
      this.animations = updated;
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
}

customElements.define('lcards-animation-editor', LCARdSAnimationEditor);
