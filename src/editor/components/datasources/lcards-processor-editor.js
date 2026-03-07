/**
 * @fileoverview LCARdS Unified Processor Editor
 *
 * Modal dialog for adding/editing processors in the unified processing pipeline.
 * Replaces separate transformation/aggregation dialogs with single unified interface.
 *
 * Supported processor types:
 * - scale (multiply, offset)
 * - smooth (moving average)
 * - clamp (min/max limits)
 * - round (decimal precision)
 * - delta (change detection)
 * - expression (custom formulas)
 * - statistics (min, max, avg, sum, range)
 * - rate (rate of change)
 * - trend (trend detection)
 * - duration (state duration tracking)
 * - threshold (threshold crossing detection)
 * - convert_unit (unit conversion)
 *
 * @element lcards-processor-editor
 * @fires save - When processor is saved with {key, config}
 * @fires cancel - When dialog is cancelled
 *
 * @property {Object} hass - Home Assistant instance
 * @property {string} mode - 'add' | 'edit'
 * @property {string} processorKey - Existing key (edit mode)
 * @property {Object} processorConfig - Existing config (edit mode)
 * @property {Array<string>} existingProcessors - List of existing processor keys (for dependency selection)
 * @property {boolean} open - Dialog open state
 */

import { LitElement, html, css } from 'lit';
import { configToYaml, yamlToConfig } from '../../utils/yaml-utils.js';
import { lcardsLog } from '../../../utils/lcards-logging.js';
import '../shared/lcards-dialog.js';

export class LCARdSProcessorEditor extends LitElement {
  static get properties() {
    return {
      hass: { type: Object },
      mode: { type: String },
      processorKey: { type: String },
      processorConfig: { type: Object },
      existingProcessors: { type: Array },
      open: { type: Boolean },
      _key: { type: String, state: true },
      _selectedType: { type: String, state: true },
      _config: { type: Object, state: true },
      _useYaml: { type: Boolean, state: true },
      _yamlValue: { type: String, state: true },
      _errors: { type: Object, state: true }
    };
  }

  constructor() {
    super();
    this.mode = 'add';
    this.open = false;
    this.existingProcessors = [];
    this._resetForm();
  }

  static get styles() {
    return css`
      :host {
        display: block;
      }

      lcards-dialog {
        --mdc-dialog-min-width: 700px;
        --mdc-dialog-max-width: 900px;
      }

      .form-content {
        display: flex;
        flex-direction: column;
        gap: 16px;
        padding: 8px 0;
        min-height: 400px;
      }

      .helper-text {
        font-size: 12px;
        color: var(--secondary-text-color, #727272);
        margin-top: -8px;
        padding: 0 8px;
      }

      ha-alert {
        margin: 8px 0;
      }

      .example-code {
        font-family: 'Roboto Mono', monospace;
        font-size: 12px;
        background: var(--secondary-background-color, #f5f5f5);
        padding: 12px;
        border-radius: 4px;
        margin-top: 8px;
        line-height: 1.6;
      }

      .example-code code {
        background: var(--primary-color);
        color: white;
        padding: 2px 6px;
        border-radius: 3px;
        font-weight: 500;
      }

      .processor-category {
        font-size: 11px;
        color: var(--secondary-text-color);
        font-weight: 600;
        text-transform: uppercase;
        padding: 8px 16px;
        background: var(--secondary-background-color);
        letter-spacing: 0.5px;
      }

      ha-selector {
        display: block;
        margin-bottom: 16px;
      }

      .form-row {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 16px;
      }

      @media (max-width: 600px) {
        .form-row {
          grid-template-columns: 1fr;
        }
      }
    `;
  }

  _resetForm() {
    this._key = this.processorKey || '';
    this._selectedType = this.processorConfig?.type || '';
    this._config = this.processorConfig ? { ...this.processorConfig } : {};
    this._useYaml = false;
    this._yamlValue = '';
    this._errors = {};
  }

  // All processor types organized by category
  get processorTypes() {
    return [
      { category: 'Basic Math', processors: [
        { value: 'scale', label: 'Scale (Multiply/Offset)' },
        { value: 'round', label: 'Round' },
        { value: 'clamp', label: 'Clamp (Min/Max)' },
        { value: 'delta', label: 'Delta (Change)' },
        { value: 'expression', label: 'Expression (Custom Formula)' }
      ]},
      { category: 'Smoothing & Filtering', processors: [
        { value: 'smooth', label: 'Smooth (Moving Average)' }
      ]},
      { category: 'Statistics', processors: [
        { value: 'statistics', label: 'Statistics (Min/Max/Avg/Sum)' }
      ]},
      { category: 'Time-Based Analysis', processors: [
        { value: 'rate', label: 'Rate of Change' },
        { value: 'trend', label: 'Trend Detection' },
        { value: 'duration', label: 'Duration Tracking' }
      ]},
      { category: 'Detection & Conversion', processors: [
        { value: 'threshold', label: 'Threshold Detection' },
        { value: 'convert_unit', label: 'Unit Conversion' }
      ]}
    ];
  }

  willUpdate(changedProperties) {
    if (changedProperties.has('open') && this.open) {
      this._resetForm();
    }
    // Force update when config changes to repopulate form fields
    if (changedProperties.has('processorConfig') && this.processorConfig) {
      this._config = { ...this.processorConfig };
      this.requestUpdate();
    }
  }

  render() {
    return html`
      <lcards-dialog
        .heading="${this.mode === 'add' ? 'Add Processor' : 'Edit Processor'}"
        .open="${this.open}"
        @closed="${this._handleCancel}"
      >
        ${this._renderForm()}
        <div slot="primaryAction">
          <ha-button
            appearance="plain"
            @click="${this._handleCancel}"
            dialogAction="close"
          >
            Cancel
          </ha-button>
          <ha-button
            appearance="accent"
            variant="brand"
            @click="${this._handleSave}"
            .disabled="${!this._isValid()}"
            dialogAction="close"
          >
            ${this.mode === 'add' ? 'Add' : 'Save'}
          </ha-button>
        </div>
      </lcards-dialog>
    `;
  }

  _renderForm() {
    return html`
      <div class="form-content">
        ${this._errors.general ? html`
          <ha-alert alert-type="error">${this._errors.general}</ha-alert>
        ` : ''}

        <!-- Processor Name (Key) -->
        <ha-selector
          .hass="${this.hass}"
          .selector="${{ text: {} }}"
          .label="${'Processor Name'}"
          .value="${this._key}"
          .required="${true}"
          .disabled="${this.mode === 'edit'}"
          @value-changed="${(e) => {
            this._key = e.detail.value;
            this._errors.key = '';
          }}"
        ></ha-selector>
        <div class="helper-text">Unique identifier for this processor (e.g., 'celsius', 'smoothed')</div>
        ${this._errors.key ? html`<div class="helper-text" style="color: var(--error-color)">${this._errors.key}</div>` : ''}

        <!-- Processor Type -->
        <ha-selector
          .hass="${this.hass}"
          .selector="${{          select: {
            options: this.processorTypes.flatMap(cat => [
              ...cat.processors.map(p => ({ value: p.value, label: p.label }))
            ])
          }
        }}"
          .label="${'Processor Type'}"
          .value="${this._selectedType}"
          .required="${true}"
          .disabled="${this.mode === 'edit'}"
          @value-changed="${this._handleTypeChange}"
        ></ha-selector>
        ${this.mode === 'edit' ? html`
          <div class="helper-text">Cannot change processor type after creation</div>
        ` : ''}

        <!-- Dependency Selection (FROM field) -->
        ${this.existingProcessors.length > 0 && this._selectedType ? html`
          <ha-selector
            .hass="${this.hass}"
            .selector="${{              select: {
                options: [
                  { value: '', label: 'None (use raw sensor value)' },
                  ...this.existingProcessors
                    .filter(key => key !== this._key)
                    .map(key => ({ value: key, label: key }))
                ]
              }
            }}"
            .label="${'Depends On (Optional)'}"
            .value="${this._config.from || ''}"
            @value-changed="${(e) => this._updateConfig('from', e.detail.value)}"
          ></ha-selector>
          <div class="helper-text">
            Process output from another processor instead of raw sensor value
          </div>
        ` : ''}

        <!-- Type-Specific Forms -->
        ${this._selectedType && !this._useYaml ? this._renderTypeForm(this._selectedType) : ''}

        <!-- YAML Editor Toggle -->
        ${this._selectedType ? html`
          <ha-formfield label="Advanced (YAML)">
            <ha-checkbox
              .checked="${this._useYaml}"
              @change="${(e) => {
                this._useYaml = e.target.checked;
                if (e.target.checked) {
                  this._yamlValue = configToYaml(this._config);
                }
              }}"
            ></ha-checkbox>
          </ha-formfield>
        ` : ''}

        <!-- YAML Editor -->
        ${this._useYaml ? this._renderYamlEditor() : ''}
      </div>
    `;
  }

  _renderTypeForm(type) {
    switch (type) {
      case 'scale':
        return this._renderScaleForm();
      case 'smooth':
        return this._renderSmoothForm();
      case 'clamp':
        return this._renderClampForm();
      case 'round':
        return this._renderRoundForm();
      case 'delta':
        return this._renderDeltaForm();
      case 'expression':
        return this._renderExpressionForm();
      case 'statistics':
        return this._renderStatisticsForm();
      case 'rate':
        return this._renderRateForm();
      case 'trend':
        return this._renderTrendForm();
      case 'duration':
        return this._renderDurationForm();
      case 'threshold':
        return this._renderThresholdForm();
      case 'convert_unit':
        return this._renderConvertUnitForm();
      default:
        return html`
          <ha-alert alert-type="info">
            No form available for this processor type. Use YAML editor.
          </ha-alert>
        `;
    }
  }

  // ========== Type-Specific Forms ==========

  _renderScaleForm() {
    return html`
      <div class="form-row">
        <ha-selector
          .hass="${this.hass}"
          .selector="${{ number: { mode: 'box', step: 0.01 } }}"
          .label="${'Multiply By'}"
          .value="${this._config.multiply ?? 1}"
          @value-changed="${(e) => this._updateConfig('multiply', e.detail.value)}"
        ></ha-selector>

        <ha-selector
          .hass="${this.hass}"
          .selector="${{ number: { mode: 'box', step: 0.01 } }}"
          .label="${'Add Offset'}"
          .value="${this._config.offset ?? 0}"
          @value-changed="${(e) => this._updateConfig('offset', e.detail.value)}"
        ></ha-selector>
      </div>

      <div class="helper-text">
        Formula: <code>(value × multiply) + offset</code> — Example: 1.8 × + 32 for °C to °F
      </div>
    `;
  }

  _renderSmoothForm() {
    return html`
      <ha-selector
        .hass="${this.hass}"
        .selector="${{ number: { mode: 'box', min: 2, step: 1 } }}"
        .label="${'Window Size'}"
        .value="${this._config.window ?? 5}"
        .required="${true}"
        @value-changed="${(e) => this._updateConfig('window', e.detail.value)}"
      ></ha-selector>

      <div class="helper-text">
        Computes moving average over last N values (higher = smoother, slower response)
      </div>
    `;
  }

  _renderClampForm() {
    return html`
      <div class="form-row">
        <ha-selector
          .hass="${this.hass}"
          .selector="${{ number: { mode: 'box', step: 0.01 } }}"
          .label="${'Minimum Value'}"
          .value="${this._config.min}"
          @value-changed="${(e) => this._updateConfig('min', e.detail.value)}"
        ></ha-selector>

        <ha-selector
          .hass="${this.hass}"
          .selector="${{ number: { mode: 'box', step: 0.01 } }}"
          .label="${'Maximum Value'}"
          .value="${this._config.max}"
          @value-changed="${(e) => this._updateConfig('max', e.detail.value)}"
        ></ha-selector>
      </div>

      <div class="helper-text">
        Restricts value to specified range (leave blank for no limit on that side)
      </div>
    `;
  }

  _renderRoundForm() {
    return html`
      <ha-selector
        .hass="${this.hass}"
        .selector="${{ number: { mode: 'box', min: 0, max: 10, step: 1 } }}"
        .label="${'Decimal Places'}"
        .value="${this._config.decimals ?? 0}"
        .required="${true}"
        @value-changed="${(e) => this._updateConfig('decimals', e.detail.value)}"
      ></ha-selector>

      <div class="helper-text">
        Number of decimal places to round to (0 for integers)
      </div>
    `;
  }

  _renderDeltaForm() {
    return html`
      <ha-selector
        .hass="${this.hass}"
        .selector="${{ boolean: {} }}"
        .label="${'Absolute Value'}"
        .value="${this._config.absolute ?? false}"
        @value-changed="${(e) => this._updateConfig('absolute', e.detail.value)}"
      ></ha-selector>

      <div class="helper-text">
        Returns difference from previous value (absolute = always positive, unsigned delta)
      </div>
    `;
  }

  _renderExpressionForm() {
    return html`
      <ha-selector
        .hass="${this.hass}"
        .selector="${{ text: { multiline: true } }}"
        .label="${'Expression'}"
        .value="${this._config.expression ?? ''}"
        .required="${true}"
        @value-changed="${(e) => this._updateConfig('expression', e.detail.value)}"
      ></ha-selector>

      <div class="example-code">
        <strong>Examples:</strong><br>
        • <code>value * 1.8 + 32</code> (Celsius to Fahrenheit)<br>
        • <code>value > 20 ? 1 : 0</code> (Binary threshold)<br>
        • <code>Math.sqrt(value)</code> (Square root)<br>
        <br>
        <strong>Available:</strong> <code>value</code>, <code>Math</code>, <code>buffer</code>, <code>timestamp</code>
      </div>
    `;
  }

  _renderStatisticsForm() {
    return html`
      <ha-selector
        .hass="${this.hass}"
        .selector="${{ number: { mode: 'box', min: 2, step: 1 } }}"
        .label="${'Window Size'}"
        .value="${this._config.window ?? 10}"
        .required="${true}"
        @value-changed="${(e) => this._updateConfig('window', e.detail.value)}"
      ></ha-selector>

      <div class="helper-text">
        Outputs object with: <code>min</code>, <code>max</code>, <code>avg</code>, <code>sum</code>, <code>range</code>
      </div>
    `;
  }

  _renderRateForm() {
    return html`
      <ha-selector
        .hass="${this.hass}"
        .selector="${{          select: {
            options: [
              { value: 'second', label: 'Per Second' },
              { value: 'minute', label: 'Per Minute' },
              { value: 'hour', label: 'Per Hour' }
            ]
          }
        }}"
        .label="${'Time Unit'}"
        .value="${this._config.unit ?? 'second'}"
        @value-changed="${(e) => this._updateConfig('unit', e.detail.value)}"
      ></ha-selector>

      <div class="helper-text">
        Rate of change = (current − previous) / time difference
      </div>
    `;
  }

  _renderTrendForm() {
    return html`
      <ha-selector
        .hass="${this.hass}"
        .selector="${{ number: { mode: 'box', min: 2, step: 1 } }}"
        .label="${'Window Size'}"
        .value="${this._config.window ?? 5}"
        .required="${true}"
        @value-changed="${(e) => this._updateConfig('window', e.detail.value)}"
      ></ha-selector>

      <div class="helper-text">
        Outputs: <code>1</code> (rising), <code>0</code> (stable), <code>−1</code> (falling)
      </div>
    `;
  }

  _renderDurationForm() {
    return html`
      <ha-selector
        .hass="${this.hass}"
        .selector="${{ number: { mode: 'box', step: 0.01 } }}"
        .label="${'Threshold Value'}"
        .value="${this._config.threshold ?? 0}"
        .required="${true}"
        @value-changed="${(e) => this._updateConfig('threshold', e.detail.value)}"
      ></ha-selector>

      <ha-selector
        .hass="${this.hass}"
        .selector="${{          select: {
            options: [
              { value: 'above', label: 'Above' },
              { value: 'below', label: 'Below' },
              { value: 'equal', label: 'Equal' }
            ]
          }
        }}"
        .label="${'Comparison'}"
        .value="${this._config.comparison ?? 'above'}"
        @value-changed="${(e) => this._updateConfig('comparison', e.detail.value)}"
      ></ha-selector>

      <div class="helper-text">
        Tracks how long value stays in specified condition (seconds)
      </div>
    `;
  }

  _renderThresholdForm() {
    return html`
      <ha-selector
        .hass="${this.hass}"
        .selector="${{ number: { mode: 'box', step: 0.01 } }}"
        .label="${'Threshold Value'}"
        .value="${this._config.threshold ?? 0}"
        .required="${true}"
        @value-changed="${(e) => this._updateConfig('threshold', e.detail.value)}"
      ></ha-selector>

      <ha-selector
        .hass="${this.hass}"
        .selector="${{          select: {
            options: [
              { value: 'rising', label: 'Rising (crosses above)' },
              { value: 'falling', label: 'Falling (crosses below)' },
              { value: 'both', label: 'Both directions' }
            ]
          }
        }}"
        .label="${'Direction'}"
        .value="${this._config.direction ?? 'both'}"
        @value-changed="${(e) => this._updateConfig('unit', e.detail.value)}"
      ></ha-selector>

      <div class="helper-text">
        Outputs: <code>1</code> when crossing detected, <code>0</code> otherwise
      </div>
    `;
  }

  _renderConvertUnitForm() {
    const unitOptions = [
      { value: '°C', label: 'Celsius (°C)' },
      { value: '°F', label: 'Fahrenheit (°F)' },
      { value: 'K', label: 'Kelvin (K)' },
      { value: 'm', label: 'Meters (m)' },
      { value: 'ft', label: 'Feet (ft)' },
      { value: 'kg', label: 'Kilograms (kg)' },
      { value: 'lb', label: 'Pounds (lb)' }
    ];

    return html`
      <div class="form-row">
        <ha-selector
          .hass="${this.hass}"
          .selector="${{ select: { options: unitOptions } }}"
          .label="${'From Unit'}"
          .value="${this._config.from_unit ?? ''}"
          .required="${true}"
          @value-changed="${(e) => this._updateConfig('from_unit', e.detail.value)}"
        ></ha-selector>

        <ha-selector
          .hass="${this.hass}"
          .selector="${{ select: { options: unitOptions } }}"
          .label="${'To Unit'}"
          .value="${this._config.to_unit ?? ''}"
          .required="${true}"
          @value-changed="${(e) => this._updateConfig('to_unit', e.detail.value)}"
        ></ha-selector>
      </div>
    `;
  }

  _renderYamlEditor() {
    return html`
      <ha-textarea
        label="Configuration (YAML)"
        .value="${this._yamlValue}"
        @input="${(e) => this._yamlValue = e.target.value}"
        helper-text="Full processor configuration in YAML format"
        rows="10"
      ></ha-textarea>
    `;
  }

  // ========== Event Handlers ==========

  _handleTypeChange(event) {
    this._selectedType = event.detail.value;
    // Reset config when type changes, keeping only type and from
    this._config = {
      type: this._selectedType,
      ...(this._config.from && { from: this._config.from })
    };
  }

  _updateConfig(key, value) {
    this._config = {
      ...this._config,
      type: this._selectedType,
      [key]: value
    };

    // Remove null/undefined/empty string values
    if (value === null || value === undefined || value === '') {
      delete this._config[key];
    }
  }

  _isValid() {
    // Key required and unique
    if (!this._key || this._key.trim() === '') {
      return false;
    }

    // Type required
    if (!this._selectedType) {
      return false;
    }

    // Type-specific validation
    if (!this._useYaml) {
      switch (this._selectedType) {
        case 'smooth':
        case 'statistics':
        case 'trend':
          return this._config.window && this._config.window >= 2;
        case 'round':
          return this._config.decimals !== undefined && this._config.decimals >= 0;
        case 'expression':
          return this._config.expression && this._config.expression.trim() !== '';
        case 'duration':
        case 'threshold':
          return this._config.threshold !== undefined;
        case 'convert_unit':
          return this._config.from_unit && this._config.to_unit;
      }
    }

    return true;
  }

  _handleSave() {
    if (!this._isValid()) {
      return;
    }

    let finalConfig = this._config;

    // If using YAML, parse it
    if (this._useYaml) {
      try {
        finalConfig = yamlToConfig(this._yamlValue);
      } catch (error) {
        this._errors = { general: `Invalid YAML: ${error.message}` };
        return;
      }
    }

    // Ensure type is set
    finalConfig.type = this._selectedType;

    this.dispatchEvent(new CustomEvent('save', {
      detail: {
        key: this._key.trim(),
        config: finalConfig
      }
    }));

    this.open = false;
  }

  _handleCancel() {
    this.dispatchEvent(new CustomEvent('cancel'));
    this.open = false;
  }
}

customElements.define('lcards-processor-editor', LCARdSProcessorEditor);
