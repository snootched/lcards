/**
 * lcards-animation-editor.js
 * Reusable animation configuration editor component
 *
 * Features:
 * - Add/remove/edit animations
 * - Preset selection with parameter editing
 * - Custom anime.js configuration
 * - Trigger management (on_load, on_hover, on_tap, etc.)
 * - Validation and help text
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
        gap: 12px;
      }

      .animation-item {
        border: 1px solid var(--divider-color);
        border-radius: 4px;
        padding: 0;
        background: var(--card-background-color);
        overflow: hidden;
      }

      .animation-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        cursor: pointer;
        user-select: none;
        padding: 12px;
        background: var(--secondary-background-color);
        transition: background 0.2s;
      }

      .animation-header:hover {
        background: var(--divider-color);
      }

      .animation-header-left {
        display: flex;
        align-items: center;
        gap: 12px;
        flex: 1;
      }

      .animation-header-right {
        display: flex;
        align-items: center;
        gap: 4px;
      }

      .trigger-badge {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        padding: 6px 12px;
        border-radius: 16px;
        background: var(--primary-color);
        color: var(--text-primary-color);
        font-size: 13px;
        font-weight: 500;
      }

      .preset-badge {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        padding: 6px 12px;
        border-radius: 16px;
        background: var(--accent-color, var(--primary-color));
        color: var(--text-primary-color);
        font-size: 13px;
        font-weight: 500;
      }

      .animation-content {
        padding: 16px;
        background: var(--card-background-color);
      }

      .form-row {
        margin-bottom: 16px;
      }

      .form-row:last-child {
        margin-bottom: 0;
      }

      .add-button {
        width: 100%;
        margin-top: 12px;
      }

      .empty-state {
        text-align: center;
        padding: 24px;
        color: var(--secondary-text-color);
        font-size: 14px;
      }

      .help-text {
        font-size: 12px;
        color: var(--secondary-text-color);
        margin-top: 4px;
        font-style: italic;
      }

      ha-icon-button {
        --mdc-icon-button-size: 32px;
        --mdc-icon-size: 20px;
      }

      .custom-code {
        font-family: monospace;
        font-size: 13px;
        width: 100%;
        min-height: 120px;
        padding: 8px;
        border: 1px solid var(--divider-color);
        border-radius: 4px;
        background: var(--code-editor-background-color, #1e1e1e);
        color: var(--code-editor-text-color, #d4d4d4);
        resize: vertical;
      }

      .toggle-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 12px;
      }

      .preset-params {
        display: flex;
        flex-direction: column;
        gap: 16px;
        margin-top: 16px;
      }

      .param-row {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 12px;
      }

      .param-full {
        grid-column: 1 / -1;
      }

      .color-field {
        margin-bottom: 0;
      }

      .color-field label {
        display: block;
        margin-bottom: 8px;
        font-weight: 500;
        font-size: 14px;
        color: var(--primary-text-color);
      }

      @media (max-width: 600px) {
        .param-row {
          grid-template-columns: 1fr;
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
        ${this.animations.length === 0 ? this._renderEmptyState() : ''}
        ${this.animations.map((anim, index) => this._renderAnimationItem(anim, index))}
        <ha-button @click=${this._addAnimation} class="add-button">
          <ha-icon icon="mdi:plus" slot="icon"></ha-icon>
          Add Animation
        </ha-button>
      </div>
    `;
  }

  _renderEmptyState() {
    return html`
      <div class="empty-state">
        <ha-icon icon="mdi:animation" style="font-size: 48px; opacity: 0.3;"></ha-icon>
        <div style="margin-top: 8px;">No animations configured</div>
        <div style="font-size: 12px; margin-top: 4px;">Click "Add Animation" to get started</div>
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
          <div class="animation-header-left">
            <ha-icon icon=${isExpanded ? 'mdi:chevron-down' : 'mdi:chevron-right'}></ha-icon>
            <span class="trigger-badge">${this._formatTrigger(trigger)}</span>
            ${isCustom
              ? html`<span class="preset-badge">Custom</span>`
              : html`<span class="preset-badge">${preset}</span>`
            }
          </div>
          <div class="animation-header-right">
            <ha-icon-button
              @click=${(e) => this._deleteAnimation(e, index)}
              label="Delete"
            >
              <ha-icon icon="mdi:delete"></ha-icon>
            </ha-icon-button>
          </div>
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

    return html`
      <!-- Trigger Selector -->
      <div class="form-row">
        <ha-selector
          .hass=${this.hass}
          .selector=${{
            select: {
              options: [
                { value: 'on_load', label: 'On Load' },
                { value: 'on_hover', label: 'On Hover' },
                { value: 'on_tap', label: 'On Tap' },
                { value: 'on_datasource_change', label: 'On Data Change' }
              ]
            }
          }}
          .value=${anim.trigger || 'on_load'}
          .label=${'Trigger'}
          @value-changed=${(e) => this._updateAnimation(index, 'trigger', e.detail.value)}
        ></ha-selector>
        <div class="help-text">When should this animation execute?</div>
      </div>

      <!-- Custom Toggle -->
      <div class="toggle-row">
        <span>Custom anime.js</span>
        <ha-switch
          ?checked=${isCustom}
          @change=${(e) => this._toggleCustomMode(index, e.target.checked)}
          style="--mdc-theme-secondary: var(--primary-color);">
        </ha-switch>
      </div>

      ${isCustom ? this._renderCustomForm(anim, index) : this._renderPresetForm(anim, index)}
    `;
  }

  _renderPresetForm(anim, index) {
    const presetOptions = [
      { value: 'pulse', label: 'Pulse (Scale)' },
      { value: 'fade', label: 'Fade In/Out' },
      { value: 'glow', label: 'Glow (Shadow)' },
      { value: 'draw', label: 'Draw (Stroke)' },
      { value: 'march', label: 'Marching Ants' },
      { value: 'blink', label: 'Blink' },
      { value: 'shimmer', label: 'Shimmer' },
      { value: 'strobe', label: 'Strobe' },
      { value: 'flicker', label: 'Flicker' },
      { value: 'cascade', label: 'Cascade' },
      { value: 'cascade-color', label: 'Cascade Color' },
      { value: 'ripple', label: 'Ripple' },
      { value: 'scale', label: 'Scale' },
      { value: 'scale-reset', label: 'Scale Reset' }
    ];

    const params = anim.params || {};
    const preset = anim.preset || 'pulse';

    return html`
      <!-- Preset Selector -->
      <div class="form-row">
        <ha-selector
          .hass=${this.hass}
          .selector=${{
            select: {
              options: presetOptions
            }
          }}
          .value=${preset}
          .label=${'Animation Preset'}
          @value-changed=${(e) => this._updateAnimation(index, 'preset', e.detail.value)}
        ></ha-selector>
        <div class="help-text">${this._getPresetHelp(preset)}</div>
      </div>

      <!-- Preset Parameters -->
      <div class="preset-params">
        ${this._renderPresetParams(preset, params, index)}
      </div>
    `;
  }

  _renderPresetParams(preset, params, index) {
    // Common parameters - always shown
    const commonParams = html`
      <div class="param-row">
        <ha-textfield
          type="number"
          label="Duration (ms)"
          .value=${params.duration || 1000}
          @input=${(e) => this._updateParam(index, 'duration', Number(e.target.value))}
          helper-text="Animation length">
        </ha-textfield>

        <ha-selector
          .hass=${this.hass}
          .selector=${{
            select: {
              options: [
                { value: 'linear', label: 'Linear' },
                { value: 'easeInOutQuad', label: 'Ease In/Out' },
                { value: 'easeInOutCubic', label: 'Cubic' },
                { value: 'easeInOutSine', label: 'Sine' },
                { value: 'spring', label: 'Spring' }
              ]
            }
          }}
          .value=${params.easing || 'easeInOutQuad'}
          .label=${'Easing'}
          @value-changed=${(e) => this._updateParam(index, 'easing', e.detail.value)}>
        </ha-selector>
      </div>
    `;

    // Preset-specific parameters
    let specificParams = '';

    switch (preset) {
      case 'pulse':
      case 'scale':
        specificParams = html`
          <div class="param-row">
            <ha-selector
              .hass=${this.hass}
              .selector=${{
                number: {
                  min: 0.5,
                  max: 2,
                  step: 0.05,
                  mode: 'slider'
                }
              }}
              .value=${params.max_scale || 1.1}
              .label=${'Max Scale'}
              @value-changed=${(e) => this._updateParam(index, 'max_scale', e.detail.value)}>
            </ha-selector>
          </div>
        `;
        break;

      case 'glow':
        specificParams = html`
          <div class="param-full color-field">
            <label>Glow Color</label>
            <lcards-color-picker
              .value=${params.color || '#93e1ff'}
              @value-changed=${(e) => this._updateParam(index, 'color', e.detail.value)}>
            </lcards-color-picker>
          </div>
          <div class="param-row">
            <ha-selector
              .hass=${this.hass}
              .selector=${{
                number: {
                  min: 0,
                  max: 1,
                  step: 0.05,
                  mode: 'slider'
                }
              }}
              .value=${params.intensity || 0.8}
              .label=${'Intensity'}
              @value-changed=${(e) => this._updateParam(index, 'intensity', e.detail.value)}>
            </ha-selector>
          </div>
        `;
        break;

      case 'fade':
        specificParams = html`
          <div class="param-row">
            <ha-selector
              .hass=${this.hass}
              .selector=${{
                number: {
                  min: 0,
                  max: 1,
                  step: 0.05,
                  mode: 'slider'
                }
              }}
              .value=${params.from_opacity ?? 0}
              .label=${'From Opacity'}
              @value-changed=${(e) => this._updateParam(index, 'from_opacity', e.detail.value)}>
            </ha-selector>
            <ha-selector
              .hass=${this.hass}
              .selector=${{
                number: {
                  min: 0,
                  max: 1,
                  step: 0.05,
                  mode: 'slider'
                }
              }}
              .value=${params.to_opacity ?? 1}
              .label=${'To Opacity'}
              @value-changed=${(e) => this._updateParam(index, 'to_opacity', e.detail.value)}>
            </ha-selector>
          </div>
        `;
        break;
    }

    // Loop toggle
    const loopToggle = html`
      <div class="param-full">
        <div class="toggle-row" style="margin-bottom: 0;">
          <span style="font-weight: 500;">Loop Animation</span>
          <ha-switch
            ?checked=${params.loop ?? false}
            @change=${(e) => this._updateParam(index, 'loop', e.target.checked)}
            style="--mdc-theme-secondary: var(--primary-color);">
          </ha-switch>
        </div>
      </div>
    `;

    return html`
      ${commonParams}
      ${specificParams}
      ${loopToggle}
    `;
  }

  _renderCustomForm(anim, index) {
    const animeConfig = anim.animejs || {};
    const configString = JSON.stringify(animeConfig, null, 2);

    return html`
      <div class="form-row">
        <label>anime.js Configuration</label>
        <textarea
          class="custom-code"
          .value=${configString}
          @input=${(e) => this._updateCustomConfig(index, e.target.value)}
          placeholder="{
  &quot;targets&quot;: &quot;#overlay-id&quot;,
  &quot;scale&quot;: [1, 1.2, 1],
  &quot;duration&quot;: 1000,
  &quot;loop&quot;: true
}"
        ></textarea>
        <div class="help-text">
          Valid anime.js v4 configuration object.
          <a href="https://animejs.com/documentation/" target="_blank">Documentation</a>
        </div>
      </div>
    `;
  }

  _formatTrigger(trigger) {
    const map = {
      'on_load': 'On Load',
      'on_hover': 'On Hover',
      'on_tap': 'On Tap',
      'on_datasource_change': 'On Data Change'
    };
    return map[trigger] || trigger;
  }

  _getPresetHelp(preset) {
    const help = {
      'pulse': 'Scales element up and down smoothly',
      'fade': 'Fades element in or out',
      'glow': 'Adds pulsing glow effect via drop-shadow',
      'draw': 'Animates stroke-dashoffset (for lines)',
      'march': 'Marching ants dash pattern',
      'blink': 'Rapid on/off blinking',
      'shimmer': 'Subtle shimmer effect',
      'strobe': 'Rapid flashing',
      'flicker': 'Random flickering',
      'cascade': 'Sequential animation',
      'cascade-color': 'Color cascade effect',
      'ripple': 'Ripple wave effect',
      'scale': 'Scale to target size',
      'scale-reset': 'Scale and reset'
    };
    return help[preset] || 'Animation preset';
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
        loop: true,
        max_scale: 1.1
      }
    };

    this.animations = [...this.animations, newAnimation];
    this._expandedIndex = this.animations.length - 1;
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
