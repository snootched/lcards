/**
 * lcards-background-animation-editor.js
 * Background animation configuration editor component
 *
 * Features:
 * - Preset-based effect configuration
 * - Effect stacking with reorderable list (drag & drop)
 * - Optional zoom wrapper per effect
 * - Dynamic form generation based on selected preset
 * - Preset discovery from BACKGROUND_PRESETS registry
 *
 * Usage:
 * ```html
 * <lcards-background-animation-editor
 *   .hass=${this.hass}
 *   .effects=${config.background_animation}
 *   @effects-changed=${(e) => this._handleEffectsChanged(e.detail.value)}
 * ></lcards-background-animation-editor>
 * ```
 */

import { LitElement, html, css } from 'lit';
import { lcardsLog } from '../../utils/lcards-logging.js';
import { BACKGROUND_PRESETS } from '../../core/packs/backgrounds/presets/index.js';
import './shared/lcards-color-picker.js';
import './shared/lcards-color-list.js';
import './shared/lcards-form-section.js';
import './shared/lcards-message.js';
import './editors/lcards-color-section.js';

export class LCARdSBackgroundAnimationEditor extends LitElement {
  static get properties() {
    return {
      hass: { type: Object },
      effects: { type: Array },
      _expandedIndex: { type: Number },
      _draggedIndex: { type: Number },
      _expandedEffects: { type: Object }
    };
  }

  static get styles() {
    return css`
      :host {
        display: block;
        width: 100%;
      }

      .effects-container {
        display: flex;
        flex-direction: column;
        gap: 16px;
      }

      .effect-item {
        background: var(--card-background-color);
        border: 1px solid var(--divider-color);
        border-radius: var(--ha-card-border-radius, 12px);
        overflow: hidden;
        transition: transform 0.2s, opacity 0.2s;
      }

      .effect-item.dragging {
        opacity: 0.5;
      }

      .effect-item.drag-over {
        transform: translateY(-4px);
        border-color: var(--primary-color);
      }

      .effect-header {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 12px;
        cursor: pointer;
        user-select: none;
        background: var(--secondary-background-color);
      }

      .effect-header:hover {
        background: var(--primary-background-color);
      }

      .drag-handle {
        cursor: grab;
        color: var(--secondary-text-color);
        --mdc-icon-size: 20px;
      }

      .drag-handle:active {
        cursor: grabbing;
      }

      .effect-icon {
        color: var(--primary-color);
        --mdc-icon-size: 24px;
      }

      .effect-info {
        flex: 1;
        min-width: 0;
      }

      .effect-type-row {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 4px;
      }

      .effect-type {
        font-weight: 600;
        font-size: 18px;
      }

      .effect-details {
        font-size: 12px;
        color: var(--secondary-text-color);
        font-family: monospace;
      }

      .effect-actions {
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

      .effect-content {
        padding: 20px;
        background: var(--card-background-color, #fff);
      }

      .section {
        margin-bottom: 24px;
      }

      .section:last-child {
        margin-bottom: 0;
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

      .info-banner {
        display: flex;
        align-items: flex-start;
        gap: 12px;
        padding: 12px 16px;
        background: var(--info-color, #2196f3);
        color: #fff;
        border-radius: 6px;
        margin-bottom: 16px;
        font-size: 13px;
        line-height: 1.4;
      }

      .info-banner ha-icon {
        flex-shrink: 0;
        margin-top: 2px;
      }

      .zoom-section {
        background: var(--secondary-background-color, #fafafa);
        border-radius: 8px;
        padding: 16px;
        margin-top: 16px;
      }

      .zoom-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 16px;
      }

      .zoom-title {
        font-weight: 600;
        font-size: 15px;
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .param-grid {
        display: grid;
        grid-template-columns: 1fr;
        gap: 16px;
      }

      .param-full {
        /* No longer needed with single column */
      }

      ha-selector {
        max-width: 100%;
        width: 100%;
      }

      ha-icon-button {
        --mdc-icon-button-size: 36px;
        --mdc-icon-size: 20px;
      }

      .layer-badge {
        font-size: 11px;
        padding: 2px 8px;
        background: var(--primary-color);
        color: var(--text-primary-color);
        border-radius: 12px;
        font-weight: 600;
      }

      @media (max-width: 600px) {
        .param-grid {
          grid-template-columns: 1fr;
        }

        .effect-header {
          padding: 12px;
        }

        .effect-content {
          padding: 16px;
        }
      }
    `;
  }

  constructor() {
    super();
    this.effects = [];
    this._expandedIndex = null;
    this._draggedIndex = null;
    this._expandedEffects = {};
    this._currentEffectIndex = null; // Track current effect for color section
  }

  /**
   * Config value setter required by lcards-color-section
   * Uses _currentEffectIndex to update the correct effect
   */
  _setConfigValue(path, value) {
    if (this._currentEffectIndex !== null) {
      this._updateEffectConfig(this._currentEffectIndex, path, value);
    }
  }

  render() {
    return html`
      <div class="effects-container">
        ${this._renderInfoBanner()}

        <ha-button @click=${this._addEffect} class="add-button">
          <ha-icon icon="mdi:plus" slot="start"></ha-icon>
          Add Background Effect
        </ha-button>

        ${this.effects.length === 0 ? this._renderEmptyState() : ''}
        ${this.effects.map((effect, index) => this._renderEffectItem(effect, index))}
      </div>
    `;
  }

  _renderInfoBanner() {
    return html`
      <div class="info-banner">
        <ha-icon icon="mdi:information"></ha-icon>
        <div>
          <strong>Effect Stacking:</strong> Each effect renders as a layer. First effect = bottom layer, last = top layer.
          <strong>Drag to reorder!</strong> Use RGBA colors with alpha < 1.0 for transparency.
        </div>
      </div>
    `;
  }

  _renderEmptyState() {
    return html`
      <div class="empty-state">
        <ha-icon icon="mdi:grid"></ha-icon>
        <div class="empty-state-title">No background effects configured</div>
        <div class="empty-state-subtitle">Add animated canvas backgrounds like grids, hexagons, or diagonals</div>
      </div>
    `;
  }

  _renderEffectItem(effect, index) {
    const isExpanded = this._expandedEffects[index] || false;
    const preset = effect.preset || 'grid';
    const presetInfo = BACKGROUND_PRESETS[preset];
    const presetName = presetInfo?.name || preset;
    const isDragging = this._draggedIndex === index;
    const hasZoom = effect.zoom && Object.keys(effect.zoom).length > 0;

    return html`
      <div
        class="effect-item ${isDragging ? 'dragging' : ''}"
        draggable="true"
        @dragstart=${(e) => this._handleDragStart(e, index)}
        @dragend=${(e) => this._handleDragEnd(e)}
        @dragover=${(e) => this._handleDragOver(e, index)}
        @drop=${(e) => this._handleDrop(e, index)}>

        <div class="effect-header" @click=${() => this._toggleExpanded(index)}>
          <!-- Drag Handle -->
          <ha-icon
            class="drag-handle"
            icon="mdi:drag"
            @click=${(e) => e.stopPropagation()}>
          </ha-icon>

          <ha-icon
            class="effect-icon"
            icon=${this._getPresetIcon(preset)}>
          </ha-icon>

          <div class="effect-info">
            <div class="effect-type-row">
              <span class="effect-type">${presetName}</span>
              ${hasZoom ? html`<span class="layer-badge">ZOOM</span>` : ''}
              <span class="layer-badge">Layer ${index + 1}</span>
            </div>
            <div class="effect-details">${this._getEffectDetails(effect)}</div>
          </div>

          <div class="effect-actions">
            <ha-icon-button
              @click=${(e) => this._duplicateEffect(e, index)}
              .label=${'Duplicate'}
              .path=${'M19,21H8V7H19M19,5H8A2,2 0 0,0 6,7V21A2,2 0 0,0 8,23H19A2,2 0 0,0 21,21V7A2,2 0 0,0 19,5M16,1H4A2,2 0 0,0 2,3V17H4V3H16V1Z'}>
            </ha-icon-button>
            <ha-icon-button
              @click=${(e) => this._deleteEffect(e, index)}
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
          <div class="effect-content">
            ${this._renderEffectForm(effect, index)}
          </div>
        ` : ''}
      </div>
    `;
  }

  _renderEffectForm(effect, index) {
    const preset = effect.preset || 'grid';

    return html`
      <!-- Preset Selection -->
      <lcards-form-section
        header="Effect Preset"
        icon="mdi:palette"
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
          .label=${'Background effect type'}
          .helper=${this._getPresetHelp(preset)}
          @value-changed=${(e) => this._updateEffect(index, 'preset', e.detail.value)}
        ></ha-selector>
      </lcards-form-section>

      <!-- Preset Configuration -->
      ${this._renderPresetConfig(effect, index)}

      <!-- Zoom Wrapper -->
      ${this._renderZoomSection(effect, index)}
    `;
  }

  _renderPresetConfig(effect, index) {
    const preset = effect.preset || 'grid';
    const config = effect.config || {};

    // Starfield uses different sections
    if (preset === 'starfield') {
      return html`
        ${this._renderStarfieldSection(config, index)}
        ${this._renderScrollingSection(config, index)}
      `;
    }

    // Nebula uses different sections
    if (preset === 'nebula') {
      return html`
        ${this._renderNebulaSection(config, index)}
        ${this._renderScrollingSection(config, index)}
      `;
    }

    // Cascade uses its own dedicated section
    if (preset === 'cascade') {
      return html`${this._renderCascadeSection(config, index)}`;
    }

    // Grid presets use pattern/major-minor/scrolling/color sections
    return html`
      ${this._renderPatternSection(preset, config, index)}
      ${this._renderMajorMinorSection(preset, config, index)}
      ${this._renderScrollingSection(config, index)}
      ${this._renderColorSection(preset, config, index)}
    `;
  }

  _renderPatternSection(preset, config, index) {
    const fields = [];

    // Size/spacing fields
    if (preset === 'grid' || preset === 'grid-diagonal' || preset === 'grid-filled') {
      fields.push({ key: 'line_spacing', label: preset === 'grid-filled' ? 'Cell Size (px)' : 'Line Spacing (px)', type: 'number', min: 10, max: 200, step: 5, default: 40 });
    }
    if (preset === 'grid-hexagonal') {
      fields.push({ key: 'hex_radius', label: 'Hex Radius (px)', type: 'number', min: 10, max: 100, step: 5, default: 30 });
    }

    // Line width fields
    if (preset !== 'grid-hexagonal') {
      fields.push({ key: 'line_width', label: preset === 'grid-filled' ? 'Border Width' : 'Line Width', type: 'number', min: 0.5, max: 10, step: 0.5, default: 1 });
    }

    // Pattern selector
    if (preset === 'grid' || preset === 'grid-filled') {
      fields.push({ key: 'pattern', label: 'Pattern', type: 'select', options: ['both', 'horizontal', 'vertical'], default: 'both' });
    }

    // Border lines toggle
    fields.push({ key: 'show_border_lines', label: 'Show Border Lines', type: 'boolean', default: true });

    if (fields.length === 0) return '';

    return html`
      <lcards-form-section
        header="Pattern"
        icon="mdi:grid"
        ?expanded=${true}>
        <div class="param-grid">
          ${fields.map(field => this._renderField(field, config, index))}
        </div>
      </lcards-form-section>
    `;
  }

  _renderMajorMinorSection(preset, config, index) {
    const fields = [];

    if (preset === 'grid') {
      fields.push(
        { key: 'major_row_interval', label: 'Major Row Interval (0=off)', type: 'number', min: 0, max: 20, step: 1, default: 0 },
        { key: 'major_col_interval', label: 'Major Col Interval (0=off)', type: 'number', min: 0, max: 20, step: 1, default: 0 },
        { key: 'line_width_major', label: 'Major Line Width', type: 'number', min: 0.5, max: 10, step: 0.5, default: 2 }
      );
    } else if (preset === 'grid-hexagonal') {
      fields.push(
        { key: 'line_width_minor', label: 'Minor Line Width', type: 'number', min: 0.5, max: 10, step: 0.5, default: 1 },
        { key: 'line_width_major', label: 'Major Line Width', type: 'number', min: 0.5, max: 10, step: 0.5, default: 2 },
        { key: 'major_row_interval', label: 'Major Row Interval (0=off)', type: 'number', min: 0, max: 10, step: 1, default: 0 },
        { key: 'major_col_interval', label: 'Major Col Interval (0=off)', type: 'number', min: 0, max: 10, step: 1, default: 0 }
      );
    }

    if (fields.length === 0) return '';

    return html`
      <lcards-form-section
        header="Major/Minor Lines"
        icon="mdi:format-line-weight"
        description="Configure major line divisions (set intervals to 0 to disable)"
        ?expanded=${true}>
        <div class="param-grid">
          ${fields.map(field => this._renderField(field, config, index))}
        </div>
      </lcards-form-section>
    `;
  }

  _renderScrollingSection(config, index) {
    return html`
      <lcards-form-section
        header="Scrolling"
        icon="mdi:arrow-all"
        ?expanded=${true}>
        <div class="param-grid">
          ${this._renderField({ key: 'scroll_speed_x', label: 'Scroll Speed X (px/s)', type: 'number', min: -200, max: 200, step: 5, default: 20 }, config, index)}
          ${this._renderField({ key: 'scroll_speed_y', label: 'Scroll Speed Y (px/s)', type: 'number', min: -200, max: 200, step: 5, default: 20 }, config, index)}
        </div>
      </lcards-form-section>
    `;
  }

  _renderStarfieldSection(config, index) {
    return html`
      <lcards-form-section
        header="Star Properties"
        icon="mdi:star-circle"
        ?expanded=${true}>
        <div class="param-grid">
          ${this._renderField({ key: 'seed', label: 'Random Seed', type: 'number', min: 1, max: 1000000000, step: 1, default: Math.floor(Math.random() * 1e9), helper: 'Change for different star patterns' }, config, index)}
          ${this._renderField({ key: 'count', label: 'Star Count', type: 'number', min: 50, max: 500, step: 10, default: 150 }, config, index)}
          ${this._renderField({ key: 'min_radius', label: 'Min Star Radius (px)', type: 'number', min: 0.1, max: 5, step: 0.1, default: 0.5 }, config, index)}
          ${this._renderField({ key: 'max_radius', label: 'Max Star Radius (px)', type: 'number', min: 0.5, max: 10, step: 0.5, default: 2 }, config, index)}
          ${this._renderField({ key: 'min_opacity', label: 'Min Star Opacity', type: 'number', min: 0, max: 1, step: 0.1, default: 0.3 }, config, index)}
          ${this._renderField({ key: 'max_opacity', label: 'Max Star Opacity', type: 'number', min: 0, max: 1, step: 0.1, default: 1.0 }, config, index)}
        </div>
      </lcards-form-section>

      <lcards-form-section
        header="Color"
        icon="mdi:palette"
        ?expanded=${true}>
        <lcards-color-list
          .hass=${this.hass}
          .colors=${config.colors || (config.color ? [config.color] : [])}
          .label=${'Star Colors'}
          .description=${'Stars will randomly use one of these colors'}
          @colors-changed=${(e) => this._updateEffectConfig(index, 'colors', e.detail.colors)}
        ></lcards-color-list>
      </lcards-form-section>

      <lcards-form-section
        header="Parallax Depth"
        icon="mdi:layers"
        description="Multiple layers create depth effect - closer layers scroll faster"
        ?expanded=${true}>
        <div class="param-grid">
          ${this._renderField({ key: 'parallax_layers', label: 'Parallax Layers', type: 'number', min: 1, max: 5, step: 1, default: 3, helper: 'More layers = more depth' }, config, index)}
          ${this._renderField({ key: 'depth_factor', label: 'Depth Factor', type: 'number', min: 0, max: 1, step: 0.1, default: 0.5, helper: 'Speed variation between layers' }, config, index)}
        </div>
      </lcards-form-section>
    `;
  }

  _renderNebulaSection(config, index) {
    return html`
      <lcards-form-section
        header="Cloud Properties"
        icon="mdi:cloud"
        ?expanded=${true}>
        <div class="param-grid">
          ${this._renderField({ key: 'seed', label: 'Random Seed', type: 'number', min: 1, max: 1000000000, step: 1, default: Math.floor(Math.random() * 1e9), helper: 'Change for different cloud patterns' }, config, index)}
          ${this._renderField({ key: 'cloud_count', label: 'Cloud Count', type: 'number', min: 1, max: 10, step: 1, default: 4 }, config, index)}
          ${this._renderField({ key: 'min_radius', label: 'Min Cloud Radius', type: 'number', min: 0.05, max: 0.5, step: 0.05, default: 0.15, helper: 'Fraction of canvas size (0-1)' }, config, index)}
          ${this._renderField({ key: 'max_radius', label: 'Max Cloud Radius', type: 'number', min: 0.1, max: 1, step: 0.05, default: 0.4, helper: 'Fraction of canvas size (0-1)' }, config, index)}
          ${this._renderField({ key: 'min_opacity', label: 'Min Cloud Opacity', type: 'number', min: 0, max: 1, step: 0.1, default: 0.3 }, config, index)}
          ${this._renderField({ key: 'max_opacity', label: 'Max Cloud Opacity', type: 'number', min: 0, max: 1, step: 0.1, default: 0.8 }, config, index)}
        </div>
      </lcards-form-section>

      <lcards-form-section
        header="Color"
        icon="mdi:palette"
        ?expanded=${true}>
        <lcards-color-list
          .hass=${this.hass}
          .colors=${config.colors || (config.color ? [config.color] : [])}
          .label=${'Cloud Colors'}
          .description=${'Clouds will randomly use one of these colors'}
          @colors-changed=${(e) => this._updateEffectConfig(index, 'colors', e.detail.colors)}
        ></lcards-color-list>
      </lcards-form-section>

      <lcards-form-section
        header="Turbulence"
        icon="mdi:waves"
        description="Perlin noise creates organic cloud movement"
        ?expanded=${true}>
        <div class="param-grid">
          ${this._renderField({ key: 'turbulence', label: 'Turbulence Intensity', type: 'number', min: 0, max: 1, step: 0.1, default: 0.5, helper: 'How much clouds distort (0=none, 1=max)' }, config, index)}
          ${this._renderField({ key: 'noise_scale', label: 'Noise Scale', type: 'number', min: 0.001, max: 0.01, step: 0.001, default: 0.003, helper: 'Smaller = larger noise features' }, config, index)}
        </div>
      </lcards-form-section>
    `;
  }

  _renderCascadeSection(config, index) {
    return html`
      <!-- Grid Sizing -->
      <lcards-form-section header="Grid" icon="mdi:grid" ?expanded=${true}>
        <div class="param-grid">
          <ha-textfield
            type="number"
            label="Rows (blank = auto)"
            helper="Leave empty to fill card height automatically"
            min="1"
            max="50"
            step="1"
            .value=${config.num_rows ?? ''}
            placeholder="auto"
            @input=${(e) => this._updateEffectConfig(index, 'num_rows', e.target.value ? Number(e.target.value) : null)}
          ></ha-textfield>
          <ha-textfield
            type="number"
            label="Columns (blank = auto)"
            helper="Leave empty to fill card width automatically"
            min="1"
            max="100"
            step="1"
            .value=${config.num_cols ?? ''}
            placeholder="auto"
            @input=${(e) => this._updateEffectConfig(index, 'num_cols', e.target.value ? Number(e.target.value) : null)}
          ></ha-textfield>
          ${this._renderField({ key: 'gap', label: 'Cell Gap (px)', type: 'number', min: 0, max: 20, step: 1, default: 4 }, config, index)}
        </div>
      </lcards-form-section>

      <!-- Data Format -->
      <lcards-form-section header="Data Format" icon="mdi:numeric" ?expanded=${true}>
        <ha-selector
          .hass=${this.hass}
          .selector=${{ select: { mode: 'dropdown', options: [
            { value: 'hex',   label: 'Hex (A3F1, 00FF)' },
            { value: 'digit', label: 'Digit (0042, 1337)' },
            { value: 'float', label: 'Float (42.17, 3.14)' },
            { value: 'alpha', label: 'Alpha (AB, XY)' },
            { value: 'mixed', label: 'Mixed (various)' }
          ]}}}
          .value=${config.format ?? 'hex'}
          .label=${'Cell data format'}
          @value-changed=${(e) => this._updateEffectConfig(index, 'format', e.detail.value)}
        ></ha-selector>
        <ha-selector
          .hass=${this.hass}
          .selector=${{ number: { min: 0, max: 60000, step: 500, mode: 'box' } }}
          .value=${config.refresh_interval ?? 0}
          .label=${'Refresh Interval (ms, 0 = static)'}
          .helper=${'How often to regenerate random cell values. 0 = never refresh.'}
          @value-changed=${(e) => this._updateEffectConfig(index, 'refresh_interval', e.detail.value)}
        ></ha-selector>
      </lcards-form-section>

      <!-- Typography -->
      <lcards-form-section header="Typography" icon="mdi:format-size" ?expanded=${true}>
        <div class="param-grid">
          ${this._renderField({ key: 'font_size', label: 'Font Size (px)', type: 'number', min: 6, max: 48, step: 1, default: 10 }, config, index)}
          <ha-selector
            .hass=${this.hass}
            .selector=${{ text: {} }}
            .value=${config.font_family ?? "'Antonio', monospace"}
            .label=${'Font Family'}
            .helper=${'CSS font-family string'}
            @value-changed=${(e) => this._updateEffectConfig(index, 'font_family', e.detail.value)}
          ></ha-selector>
        </div>
      </lcards-form-section>

      <!-- Cascade Animation Timing -->
      <lcards-form-section header="Cascade Timing" icon="mdi:timer-outline" ?expanded=${true}>
        <ha-selector
          .hass=${this.hass}
          .selector=${{ select: { mode: 'dropdown', options: [
            { value: 'default', label: 'Default (authentic LCARS rhythm)' },
            { value: 'niagara', label: 'Niagara (smooth uniform waterfall)' },
            { value: 'fast',    label: 'Fast (rapid cycling)' },
            { value: 'custom',  label: 'Custom (manual per-row timing)' }
          ]}}}
          .value=${config.pattern ?? 'default'}
          .label=${'Timing Pattern'}
          @value-changed=${(e) => this._updateEffectConfig(index, 'pattern', e.detail.value)}
        ></ha-selector>
        ${(config.pattern ?? 'default') === 'custom' ? html`
          <lcards-message type="info" .message=${'Custom timing requires a YAML-supplied "timing" array of { duration, delay } objects — one per row. Edit this card\'s YAML directly to set the timing property.'}></lcards-message>
        ` : ''}
        <div class="param-grid">
          ${this._renderField({ key: 'speed_multiplier', label: 'Speed Multiplier (1.0 = normal)', type: 'number', min: 0.1, max: 10, step: 0.1, default: 1.0, helper: '2.0 = twice as fast, 0.5 = half speed' }, config, index)}
          ${this._renderField({ key: 'duration', label: 'Duration Override (ms, 0 = use pattern)', type: 'number', min: 0, max: 30000, step: 100, default: 0, helper: 'Overrides all row durations if > 0' }, config, index)}
        </div>
      </lcards-form-section>

      <!-- Cascade Colors -->
      <lcards-form-section header="Cascade Colors" icon="mdi:palette" ?expanded=${true}>
        <lcards-color-list
          .hass=${this.hass}
          .colors=${[
            config.colors?.start ?? '#99ccff',
            config.colors?.text  ?? '#4466aa',
            config.colors?.end   ?? '#aaccff'
          ]}
          .label=${'Cascade Colors [start, text, end]'}
          .description=${'Three colors: animation start, mid/text, animation end'}
          @colors-changed=${(e) => {
            const [start, text, end] = e.detail.colors;
            this._updateEffectConfig(index, 'colors', { start, text, end });
          }}
        ></lcards-color-list>
      </lcards-form-section>
    `;
  }

  _renderColorSection(preset, config, index) {
    // Store current effect index for _setConfigValue callback
    this._currentEffectIndex = index;

    const colorPaths = [{ path: 'color', label: 'Line Color', helper: 'Main line color (RGBA recommended)' }];

    if (preset === 'grid' || preset === 'grid-hexagonal') {
      colorPaths.push({ path: 'color_major', label: 'Major Line Color', helper: 'Leave empty to use same as main color' });
    }

    if (preset === 'grid-filled') {
      colorPaths.push({ path: 'fill_color', label: 'Fill Color', helper: 'Cell background fill color' });
    }

    return html`
      <lcards-color-section
        .editor=${this}
        header="Colors"
        .colorPaths=${colorPaths}
        .getConfigValue=${(path) => config[path] || ''}
        ?expanded=${true}
        ?useColorPicker=${true}>
      </lcards-color-section>
    `;
  }

  _renderField(field, config, index) {
    const value = config[field.key] ?? field.default;

    return html`
      <ha-selector
        .hass=${this.hass}
        .selector=${this._getFieldSelector(field)}
        .value=${value}
        .label=${field.label}
        .helper=${field.helper}
        @value-changed=${(e) => this._updateEffectConfig(index, field.key, e.detail.value)}
      ></ha-selector>
    `;
  }

  _renderZoomSection(effect, index) {
    const zoom = effect.zoom || {};
    const isEnabled = zoom && Object.keys(zoom).length > 0;

    return html`
      <div class="zoom-section">
        <div class="zoom-header">
          <div class="zoom-title">
            <ha-icon icon="mdi:magnify-expand"></ha-icon>
            <span>Zoom Effect (3D Depth)</span>
          </div>
          <ha-switch
            .checked=${isEnabled}
            @change=${(e) => this._toggleZoom(index, e.target.checked)}
          ></ha-switch>
        </div>

        ${isEnabled ? html`
          <div class="param-grid">
            <ha-selector
              .hass=${this.hass}
              .selector=${{ number: { min: 2, max: 10, step: 1, mode: 'slider' } }}
              .value=${zoom.layers ?? 4}
              .label=${'Zoom Layers'}
              .helper=${'Number of scaled instances (more = smoother but slower)'}
              @value-changed=${(e) => this._updateZoomConfig(index, 'layers', e.detail.value)}
            ></ha-selector>

            <ha-selector
              .hass=${this.hass}
              .selector=${{ number: { min: 0.1, max: 1.0, step: 0.1, mode: 'slider' } }}
              .value=${zoom.scale_from ?? 0.5}
              .label=${'Scale From'}
              .helper=${'Starting scale (0.5 = half size)'}
              @value-changed=${(e) => this._updateZoomConfig(index, 'scale_from', e.detail.value)}
            ></ha-selector>

            <ha-selector
              .hass=${this.hass}
              .selector=${{ number: { min: 1.0, max: 5.0, step: 0.1, mode: 'slider' } }}
              .value=${zoom.scale_to ?? 2.0}
              .label=${'Scale To'}
              .helper=${'Ending scale (2.0 = double size)'}
              @value-changed=${(e) => this._updateZoomConfig(index, 'scale_to', e.detail.value)}
            ></ha-selector>

            <ha-selector
              .hass=${this.hass}
              .selector=${{ number: { min: 5, max: 60, step: 1, mode: 'slider' } }}
              .value=${zoom.duration ?? 15}
              .label=${'Duration (seconds)'}
              .helper=${'Full zoom cycle duration'}
              @value-changed=${(e) => this._updateZoomConfig(index, 'duration', e.detail.value)}
            ></ha-selector>

            <ha-selector
              .hass=${this.hass}
              .selector=${{ number: { min: 0, max: 100, step: 5, mode: 'slider' } }}
              .value=${zoom.opacity_fade_in ?? 15}
              .label=${'Fade In (%)'}
              .helper=${'Opacity fade-in threshold'}
              @value-changed=${(e) => this._updateZoomConfig(index, 'opacity_fade_in', e.detail.value)}
            ></ha-selector>

            <ha-selector
              .hass=${this.hass}
              .selector=${{ number: { min: 0, max: 100, step: 5, mode: 'slider' } }}
              .value=${zoom.opacity_fade_out ?? 75}
              .label=${'Fade Out (%)'}
              .helper=${'Opacity fade-out threshold'}
              @value-changed=${(e) => this._updateZoomConfig(index, 'opacity_fade_out', e.detail.value)}
            ></ha-selector>
          </div>
        ` : ''}
      </div>
    `;
  }

  // ====================
  // Preset Discovery
  // ====================

  _getPresetOptions() {
    return Object.entries(BACKGROUND_PRESETS).map(([key, preset]) => ({
      value: key,
      label: `${preset.name} - ${preset.description}`
    }));
  }

  _getPresetHelp(preset) {
    const presetInfo = BACKGROUND_PRESETS[preset];
    return presetInfo?.description || '';
  }

  _getPresetIcon(preset) {
    const icons = {
      'grid': 'mdi:grid',
      'grid-diagonal': 'mdi:grid-large',
      'grid-hexagonal': 'mdi:hexagon-multiple',
      'grid-filled': 'mdi:grid',
      'starfield': 'mdi:star-circle',
      'nebula': 'mdi:cloud',
      'cascade': 'mdi:format-columns'
    };
    return icons[preset] || 'mdi:blur';
  }

  // ====================
  // Preset Field Definitions
  // ====================

  _getPresetFields(preset, config) {
    const commonFields = {
      scrolling: [
        { key: 'scroll_speed_x', label: 'Scroll Speed X (px/s)', type: 'number', min: -200, max: 200, step: 5, default: 20 },
        { key: 'scroll_speed_y', label: 'Scroll Speed Y (px/s)', type: 'number', min: -200, max: 200, step: 5, default: 20 }
      ],
      styling: [
        { key: 'color', label: 'Color', type: 'color', default: 'rgba(255, 153, 102, 0.3)', fullWidth: true },
        { key: 'show_border_lines', label: 'Show Border Lines', type: 'boolean', default: true }
      ]
    };

    switch (preset) {
      case 'grid':
        return [
          { key: 'line_spacing', label: 'Line Spacing (px)', type: 'number', min: 10, max: 200, step: 5, default: 40 },
          { key: 'line_width', label: 'Line Width', type: 'number', min: 0.5, max: 10, step: 0.5, default: 1 },
          { key: 'major_row_interval', label: 'Major Row Interval (0=off)', type: 'number', min: 0, max: 20, step: 1, default: 0 },
          { key: 'major_col_interval', label: 'Major Col Interval (0=off)', type: 'number', min: 0, max: 20, step: 1, default: 0 },
          { key: 'line_width_major', label: 'Major Line Width', type: 'number', min: 0.5, max: 10, step: 0.5, default: 2 },
          { key: 'color_major', label: 'Major Line Color', type: 'color', default: '', fullWidth: true, helper: 'Leave empty to use same as color' },
          { key: 'pattern', label: 'Pattern', type: 'select', options: ['both', 'horizontal', 'vertical'], default: 'both' },
          ...commonFields.scrolling,
          ...commonFields.styling
        ];

      case 'grid-diagonal':
        return [
          { key: 'line_spacing', label: 'Line Spacing (px)', type: 'number', min: 10, max: 200, step: 5, default: 60 },
          { key: 'line_width', label: 'Line Width', type: 'number', min: 0.5, max: 10, step: 0.5, default: 1 },
          ...commonFields.scrolling,
          ...commonFields.styling
        ];

      case 'grid-hexagonal':
        return [
          { key: 'hex_radius', label: 'Hex Radius (px)', type: 'number', min: 10, max: 100, step: 5, default: 30 },
          { key: 'line_width_minor', label: 'Minor Line Width', type: 'number', min: 0.5, max: 10, step: 0.5, default: 1 },
          { key: 'line_width_major', label: 'Major Line Width', type: 'number', min: 0.5, max: 10, step: 0.5, default: 2 },
          { key: 'major_row_interval', label: 'Major Row Interval (0=off)', type: 'number', min: 0, max: 10, step: 1, default: 0 },
          { key: 'major_col_interval', label: 'Major Col Interval (0=off)', type: 'number', min: 0, max: 10, step: 1, default: 0 },
          { key: 'color_major', label: 'Major Hex Color', type: 'color', default: '', fullWidth: true, helper: 'Leave empty to use same as color' },
          ...commonFields.scrolling,
          ...commonFields.styling
        ];

      case 'grid-filled':
        return [
          { key: 'line_spacing', label: 'Cell Size (px)', type: 'number', min: 10, max: 200, step: 5, default: 50 },
          { key: 'line_width', label: 'Border Width', type: 'number', min: 0.5, max: 10, step: 0.5, default: 1 },
          { key: 'fill_color', label: 'Fill Color', type: 'color', default: 'rgba(255, 153, 102, 0.1)', fullWidth: true },
          { key: 'pattern', label: 'Pattern', type: 'select', options: ['both', 'horizontal', 'vertical'], default: 'both' },
          ...commonFields.scrolling,
          ...commonFields.styling
        ];

      case 'starfield':
        return [
          { key: 'seed', label: 'Random Seed', type: 'number', min: 1, max: 1000000000, step: 1, default: Math.floor(Math.random() * 1e9), helper: 'Change for different star patterns' },
          { key: 'count', label: 'Star Count', type: 'number', min: 50, max: 500, step: 10, default: 150 },
          { key: 'min_radius', label: 'Min Star Radius (px)', type: 'number', min: 0.1, max: 5, step: 0.1, default: 0.5 },
          { key: 'max_radius', label: 'Max Star Radius (px)', type: 'number', min: 0.5, max: 10, step: 0.5, default: 2 },
          { key: 'min_opacity', label: 'Min Star Opacity', type: 'number', min: 0, max: 1, step: 0.1, default: 0.3 },
          { key: 'max_opacity', label: 'Max Star Opacity', type: 'number', min: 0, max: 1, step: 0.1, default: 1.0 },
          { key: 'color', label: 'Star Color', type: 'color', default: '#ffffff', fullWidth: true },
          { key: 'parallax_layers', label: 'Parallax Layers', type: 'number', min: 1, max: 5, step: 1, default: 3, helper: 'More layers = more depth' },
          { key: 'depth_factor', label: 'Depth Factor', type: 'number', min: 0, max: 1, step: 0.1, default: 0.5, helper: 'Speed variation between layers' },
          ...commonFields.scrolling
        ];

      case 'nebula':
        return [
          { key: 'seed', label: 'Random Seed', type: 'number', min: 1, max: 1000000000, step: 1, default: Math.floor(Math.random() * 1e9), helper: 'Change for different cloud patterns' },
          { key: 'cloud_count', label: 'Cloud Count', type: 'number', min: 1, max: 10, step: 1, default: 4 },
          { key: 'min_radius', label: 'Min Cloud Radius', type: 'number', min: 0.05, max: 0.5, step: 0.05, default: 0.15, helper: 'Fraction of canvas size (0-1)' },
          { key: 'max_radius', label: 'Max Cloud Radius', type: 'number', min: 0.1, max: 1, step: 0.05, default: 0.4, helper: 'Fraction of canvas size (0-1)' },
          { key: 'min_opacity', label: 'Min Cloud Opacity', type: 'number', min: 0, max: 1, step: 0.1, default: 0.3 },
          { key: 'max_opacity', label: 'Max Cloud Opacity', type: 'number', min: 0, max: 1, step: 0.1, default: 0.8 },
          { key: 'color', label: 'Cloud Color', type: 'color', default: '#FF00FF', fullWidth: true },
          { key: 'turbulence', label: 'Turbulence Intensity', type: 'number', min: 0, max: 1, step: 0.1, default: 0.5, helper: 'How much clouds distort (0=none, 1=max)' },
          { key: 'noise_scale', label: 'Noise Scale', type: 'number', min: 0.001, max: 0.01, step: 0.001, default: 0.003, helper: 'Smaller = larger noise features' },
          ...commonFields.scrolling
        ];

      case 'cascade':
        return [
          { key: 'num_rows', label: 'Rows', type: 'number', min: 1, max: 50, step: 1, default: null },
          { key: 'num_cols', label: 'Columns', type: 'number', min: 1, max: 100, step: 1, default: null },
          { key: 'format', label: 'Format', type: 'select', options: ['hex', 'digit', 'float', 'alpha', 'mixed'], default: 'hex' },
          { key: 'pattern', label: 'Pattern', type: 'select', options: ['default', 'niagara', 'fast', 'custom'], default: 'default' },
          { key: 'speed_multiplier', label: 'Speed Multiplier', type: 'number', min: 0.1, max: 10, step: 0.1, default: 1.0 }
        ];

      default:
        return commonFields.styling;
    }
  }

  _getFieldSelector(field) {
    switch (field.type) {
      case 'number':
        return {
          number: {
            min: field.min,
            max: field.max,
            step: field.step,
            mode: 'slider'
          }
        };
      case 'color':
        return { text: {} }; // Use text for color (user can paste RGBA)
      case 'boolean':
        return { boolean: {} };
      case 'select':
        return {
          select: {
            mode: 'dropdown',
            options: field.options.map(opt => ({ value: opt, label: opt }))
          }
        };
      default:
        return { text: {} };
    }
  }

  // ====================
  // Helpers
  // ====================

  _getEffectDetails(effect) {
    const config = effect.config || {};
    const preset = effect.preset || 'grid';
    const parts = [];

    if (config.line_spacing) parts.push(`spacing: ${config.line_spacing}px`);
    if (config.hex_radius) parts.push(`radius: ${config.hex_radius}px`);
    if (config.color) parts.push(`color: ${config.color}`);
    if (effect.zoom) parts.push(`zoom: ${effect.zoom.layers || 4} layers`);

    if (preset === 'cascade') {
      if (config.format) parts.push(`format: ${config.format}`);
      if (config.pattern) parts.push(`pattern: ${config.pattern}`);
    }

    return parts.join(' • ') || 'No configuration';
  }

  _toggleExpanded(index) {
    this._expandedEffects = {
      ...this._expandedEffects,
      [index]: !this._expandedEffects[index]
    };
  }

  // ====================
  // CRUD Operations
  // ====================

  _addEffect() {
    const newEffect = {
      preset: 'grid',
      config: {}
    };

    const updatedEffects = [...this.effects, newEffect];
    this._expandedEffects = {
      ...this._expandedEffects,
      [updatedEffects.length - 1]: true
    };
    this._emitChange(updatedEffects);
  }

  _duplicateEffect(e, index) {
    e.stopPropagation();
    const duplicated = JSON.parse(JSON.stringify(this.effects[index]));
    const updatedEffects = [...this.effects];
    updatedEffects.splice(index + 1, 0, duplicated);

    this._expandedEffects = {
      ...this._expandedEffects,
      [index + 1]: true
    };
    this._emitChange(updatedEffects);
  }

  _deleteEffect(e, index) {
    e.stopPropagation();
    const updatedEffects = this.effects.filter((_, i) => i !== index);

    // Update expanded state
    const newExpanded = {};
    Object.keys(this._expandedEffects).forEach(key => {
      const idx = parseInt(key);
      if (idx < index) {
        newExpanded[idx] = this._expandedEffects[idx];
      } else if (idx > index) {
        newExpanded[idx - 1] = this._expandedEffects[idx];
      }
    });
    this._expandedEffects = newExpanded;

    this._emitChange(updatedEffects);
  }

  _updateEffect(index, key, value) {
    const updatedEffects = [...this.effects];
    updatedEffects[index] = {
      ...updatedEffects[index],
      [key]: value
    };

    // Reset config when preset changes
    if (key === 'preset') {
      updatedEffects[index].config = this._getDefaultConfig(value);
    }

    this._emitChange(updatedEffects);
  }

  _updateEffectConfig(index, key, value) {
    const updatedEffects = [...this.effects];
    updatedEffects[index] = {
      ...updatedEffects[index],
      config: {
        ...updatedEffects[index].config,
        [key]: value
      }
    };
    this._emitChange(updatedEffects);
  }

  _toggleZoom(index, enabled) {
    const updatedEffects = [...this.effects];
    if (enabled) {
      updatedEffects[index].zoom = {
        layers: 4,
        scale_from: 0.5,
        scale_to: 2.0,
        duration: 15,
        opacity_fade_in: 15,
        opacity_fade_out: 75
      };
    } else {
      delete updatedEffects[index].zoom;
    }
    this._emitChange(updatedEffects);
  }

  _updateZoomConfig(index, key, value) {
    const updatedEffects = [...this.effects];
    updatedEffects[index] = {
      ...updatedEffects[index],
      zoom: {
        ...updatedEffects[index].zoom,
        [key]: value
      }
    };
    this._emitChange(updatedEffects);
  }

  _getDefaultConfig(preset) {
    // Minimal configs - rely on theme tokens for defaults
    // Only set values that MUST be different from theme defaults
    switch (preset) {
      case 'grid':
      case 'grid-diagonal':
      case 'grid-hexagonal':
      case 'grid-filled':
        return {}; // All values come from theme tokens

      case 'starfield':
        return {
          seed: Math.floor(Math.random() * 1e9) // Generate unique seed
        };

      case 'nebula':
        return {
          seed: Math.floor(Math.random() * 1e9) // Generate unique seed
        };

      case 'cascade':
        return {
          format: 'hex',
          pattern: 'default',
          speed_multiplier: 1.0,
          colors: { start: '#99ccff', text: '#4466aa', end: '#aaccff' }
        };

      default:
        return {};
    }
  }

  // ====================
  // Drag & Drop Reordering
  // ====================

  _handleDragStart(e, index) {
    this._draggedIndex = index;
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', e.target.innerHTML);
  }

  _handleDragEnd(e) {
    this._draggedIndex = null;
    // Remove all drag-over classes
    this.shadowRoot.querySelectorAll('.effect-item').forEach(item => {
      item.classList.remove('drag-over');
    });
  }

  _handleDragOver(e, index) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';

    // Add drag-over visual indicator
    const items = this.shadowRoot.querySelectorAll('.effect-item');
    items.forEach(item => item.classList.remove('drag-over'));
    items[index]?.classList.add('drag-over');
  }

  _handleDrop(e, dropIndex) {
    e.preventDefault();
    e.stopPropagation();

    const dragIndex = this._draggedIndex;
    if (dragIndex === null || dragIndex === dropIndex) {
      return;
    }

    // Reorder effects
    const updatedEffects = [...this.effects];
    const [draggedItem] = updatedEffects.splice(dragIndex, 1);
    updatedEffects.splice(dropIndex, 0, draggedItem);

    // Update expanded state to follow moved items
    const newExpandedState = {};
    Object.keys(this._expandedEffects).forEach(oldIndex => {
      const idx = parseInt(oldIndex);
      let newIndex = idx;

      if (idx === dragIndex) {
        newIndex = dropIndex;
      } else if (dragIndex < dropIndex && idx > dragIndex && idx <= dropIndex) {
        newIndex = idx - 1;
      } else if (dragIndex > dropIndex && idx >= dropIndex && idx < dragIndex) {
        newIndex = idx + 1;
      }

      newExpandedState[newIndex] = this._expandedEffects[oldIndex];
    });

    this._expandedEffects = newExpandedState;
    this._draggedIndex = null;

    // Remove drag-over class
    this.shadowRoot.querySelectorAll('.effect-item').forEach(item => {
      item.classList.remove('drag-over');
    });

    this._emitChange(updatedEffects);
  }

  // ====================
  // Event Emission
  // ====================

  _emitChange(effects) {
    lcardsLog.debug('[BackgroundAnimationEditor] Effects changed', effects);
    this.dispatchEvent(new CustomEvent('effects-changed', {
      detail: { value: effects },
      bubbles: true,
      composed: true
    }));
  }
}

customElements.define('lcards-background-animation-editor', LCARdSBackgroundAnimationEditor);
