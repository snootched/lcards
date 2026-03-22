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
        /** @type {any} */
        this.hass = undefined;
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
        --ha-dialog-width-md: 900px;
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
    // @ts-ignore - TS2339: auto-suppressed
    this._key = this.processorKey || '';
    // @ts-ignore - TS2339: auto-suppressed
    this._selectedType = this.processorConfig?.type || '';
    // @ts-ignore - TS2339: auto-suppressed
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
    // @ts-ignore - TS2339: auto-suppressed
    if (changedProperties.has('processorConfig') && this.processorConfig) {
      // @ts-ignore - TS2339: auto-suppressed
      this._config = { ...this.processorConfig };
      this.requestUpdate();
    }
  }

  render() {
    return html`
      <lcards-dialog
        .heading="${this.mode === 'add' ? 'Add Processor' : 'Edit Processor'}"
        .open="${this.open}"
        @closed="${(e) => { e.stopPropagation(); this._handleCancel(); }}"
      >
        ${this._renderForm()}
        <div slot="primaryAction">
          <ha-button
            appearance="plain"
            @click="${this._handleCancel}"
          >
            Cancel
          </ha-button>
          <ha-button
            appearance="accent"
            variant="brand"
            @click="${this._handleSave}"
            .disabled="${!this._isValid()}"
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
          // @ts-ignore - TS2339: auto-suppressed
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
          // @ts-ignore - TS2339: auto-suppressed
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

        <!-- Dependency Selection (input_source field) -->
        ${this.existingProcessors.length > 0 && this._selectedType ? html`
          <ha-selector
            // @ts-ignore - TS2339: auto-suppressed
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
            .value="${this._config.input_source || ''}"
            @value-changed="${(e) => this._updateConfig('input_source', e.detail.value)}"
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
          // @ts-ignore - TS2339: auto-suppressed
          .hass="${this.hass}"
          .selector="${{ number: { mode: 'box', step: 0.01 } }}"
          .label="${'Input Min'}"
          .value="${this._config.input_range?.[0] ?? 0}"
          @value-changed="${(e) => this._updateRangeConfig('input_range', 0, e.detail.value)}"
        ></ha-selector>

        <ha-selector
          // @ts-ignore - TS2339: auto-suppressed
          .hass="${this.hass}"
          .selector="${{ number: { mode: 'box', step: 0.01 } }}"
          .label="${'Input Max'}"
          .value="${this._config.input_range?.[1] ?? 100}"
          @value-changed="${(e) => this._updateRangeConfig('input_range', 1, e.detail.value)}"
        ></ha-selector>
      </div>

      <div class="form-row">
        <ha-selector
          // @ts-ignore - TS2339: auto-suppressed
          .hass="${this.hass}"
          .selector="${{ number: { mode: 'box', step: 0.01 } }}"
          .label="${'Output Min'}"
          .value="${this._config.output_range?.[0] ?? 0}"
          @value-changed="${(e) => this._updateRangeConfig('output_range', 0, e.detail.value)}"
        ></ha-selector>

        <ha-selector
          // @ts-ignore - TS2339: auto-suppressed
          .hass="${this.hass}"
          .selector="${{ number: { mode: 'box', step: 0.01 } }}"
          .label="${'Output Max'}"
          .value="${this._config.output_range?.[1] ?? 1}"
          @value-changed="${(e) => this._updateRangeConfig('output_range', 1, e.detail.value)}"
        ></ha-selector>
      </div>

      <ha-selector
        // @ts-ignore - TS2339: auto-suppressed
        .hass="${this.hass}"
        .selector="${{ select: { options: [
          { value: 'linear', label: 'Linear' },
          { value: 'exponential', label: 'Exponential' },
          { value: 'logarithmic', label: 'Logarithmic' },
          { value: 'sigmoid', label: 'Sigmoid' }
        ] } }}"
        .label="${'Curve Type'}"
        .value="${this._config.curve ?? 'linear'}"
        @value-changed="${(e) => this._updateConfig('curve', e.detail.value)}"
      ></ha-selector>

      <div class="helper-text">
        Maps values from input range to output range — e.g. sensor 0–100 → display 0–1
      </div>
    `;
  }

  _renderSmoothForm() {
    const method = this._config.method ?? 'exponential';
    return html`
      <ha-selector
        // @ts-ignore - TS2339: auto-suppressed
        .hass="${this.hass}"
        .selector="${{ select: { options: [
          { value: 'exponential', label: 'Exponential (EMA)' },
          { value: 'moving_average', label: 'Moving Average (SMA)' },
          { value: 'gaussian', label: 'Gaussian' }
        ] } }}"
        .label="${'Smoothing Method'}"
        .value="${method}"
        @value-changed="${(e) => { this._updateConfig('method', e.detail.value); this.requestUpdate(); }}"
      ></ha-selector>

      ${method === 'exponential' ? html`
        <ha-selector
          // @ts-ignore - TS2339: auto-suppressed
          .hass="${this.hass}"
          .selector="${{ number: { mode: 'slider', min: 0.01, max: 1, step: 0.01 } }}"
          .label="${'Alpha (smoothing factor)'}"
          .value="${this._config.alpha ?? 0.3}"
          @value-changed="${(e) => this._updateConfig('alpha', e.detail.value)}"
        ></ha-selector>
        <div class="helper-text">
          Lower α = smoother (more lag); higher α = more responsive (less smooth)
        </div>
      ` : html`
        <ha-selector
          // @ts-ignore - TS2339: auto-suppressed
          .hass="${this.hass}"
          .selector="${{ number: { mode: 'box', min: 2, step: 1 } }}"
          .label="${'Window Size (samples)'}"
          .value="${this._config.window ?? 10}"
          @value-changed="${(e) => this._updateConfig('window', e.detail.value)}"
        ></ha-selector>
        <div class="helper-text">
          Number of samples in the smoothing window
        </div>
      `}
    `;
  }

  _renderClampForm() {
    return html`
      <div class="form-row">
        <ha-selector
          // @ts-ignore - TS2339: auto-suppressed
          .hass="${this.hass}"
          .selector="${{ number: { mode: 'box', step: 0.01 } }}"
          .label="${'Minimum Value'}"
          .value="${this._config.min}"
          @value-changed="${(e) => this._updateConfig('min', e.detail.value)}"
        ></ha-selector>

        <ha-selector
          // @ts-ignore - TS2339: auto-suppressed
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
      <div class="form-row">
        <ha-selector
          // @ts-ignore - TS2339: auto-suppressed
          .hass="${this.hass}"
          .selector="${{ number: { mode: 'box', min: 0, max: 10, step: 1 } }}"
          .label="${'Decimal Places'}"
          .value="${this._config.precision ?? 0}"
          .required="${true}"
          @value-changed="${(e) => this._updateConfig('precision', e.detail.value)}"
        ></ha-selector>

        <ha-selector
          // @ts-ignore - TS2339: auto-suppressed
          .hass="${this.hass}"
          .selector="${{ select: { options: [
            { value: 'round', label: 'Round (nearest)' },
            { value: 'floor', label: 'Floor (always down)' },
            { value: 'ceil', label: 'Ceil (always up)' }
          ] } }}"
          .label="${'Method'}"
          .value="${this._config.method ?? 'round'}"
          @value-changed="${(e) => this._updateConfig('method', e.detail.value)}"
        ></ha-selector>
      </div>

      <div class="helper-text">
        Rounds to specified decimal places (0 = integers)
      </div>
    `;
  }

  _renderDeltaForm() {
    return html`
      <ha-selector
        // @ts-ignore - TS2339: auto-suppressed
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
        // @ts-ignore - TS2339: auto-suppressed
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
        // @ts-ignore - TS2339: auto-suppressed
        .hass="${this.hass}"
        .selector="${{ select: { options: [
          { value: 'session', label: 'Session (since load)' },
          { value: '1h', label: 'Last 1 hour' },
          { value: '6h', label: 'Last 6 hours' },
          { value: '12h', label: 'Last 12 hours' },
          { value: '24h', label: 'Last 24 hours' },
          { value: '48h', label: 'Last 48 hours' },
          { value: '7d', label: 'Last 7 days' }
        ], custom_value: true } }}"
        .label="${'Time Window'}"
        .value="${this._config.window ?? 'session'}"
        .required="${true}"
        @value-changed="${(e) => this._updateConfig('window', e.detail.value)}"
      ></ha-selector>

      <ha-selector
        // @ts-ignore - TS2339: auto-suppressed
        .hass="${this.hass}"
        .selector="${{ select: { multiple: true, options: [
          { value: 'min', label: 'Minimum' },
          { value: 'max', label: 'Maximum' },
          { value: 'mean', label: 'Mean (average)' },
          { value: 'median', label: 'Median' },
          { value: 'std_dev', label: 'Std Deviation' },
          { value: 'q1', label: 'Q1 (25th percentile)' },
          { value: 'q3', label: 'Q3 (75th percentile)' },
          { value: 'range', label: 'Range (max − min)' },
          { value: 'count', label: 'Count' }
        ] } }}"
        .label="${'Statistics to Compute'}"
        .value="${this._config.stats ?? ['min', 'max', 'mean']}"
        @value-changed="${(e) => this._updateConfig('stats', e.detail.value)}"
      ></ha-selector>

      <div class="helper-text">
        Outputs an object — access values with <code>{ds:name.proc_key.min}</code> etc.
      </div>
    `;
  }

  _renderRateForm() {
    return html`
      <div class="form-row">
        <ha-selector
          // @ts-ignore - TS2339: auto-suppressed
          .hass="${this.hass}"
          .selector="${{ select: { options: [
            { value: 'per_second', label: 'Per Second' },
            { value: 'per_minute', label: 'Per Minute' },
            { value: 'per_hour', label: 'Per Hour' }
          ] } }}"
          .label="${'Time Unit'}"
          .value="${this._config.unit ?? 'per_second'}"
          @value-changed="${(e) => this._updateConfig('unit', e.detail.value)}"
        ></ha-selector>

        <ha-selector
          // @ts-ignore - TS2339: auto-suppressed
          .hass="${this.hass}"
          .selector="${{ boolean: {} }}"
          .label="${'Enable Smoothing'}"
          .value="${this._config.smoothing ?? false}"
          @value-changed="${(e) => this._updateConfig('smoothing', e.detail.value)}"
        ></ha-selector>
      </div>

      <div class="helper-text">
        Rate of change = (current − previous) / time difference
      </div>
    `;
  }

  _renderTrendForm() {
    return html`
      <div class="form-row">
        <ha-selector
          // @ts-ignore - TS2339: auto-suppressed
          .hass="${this.hass}"
          .selector="${{ number: { mode: 'box', min: 2, step: 1 } }}"
          .label="${'Samples'}"
          .value="${this._config.samples ?? 5}"
          .required="${true}"
          @value-changed="${(e) => this._updateConfig('samples', e.detail.value)}"
        ></ha-selector>

        <ha-selector
          // @ts-ignore - TS2339: auto-suppressed
          .hass="${this.hass}"
          .selector="${{ number: { mode: 'box', min: 0, step: 0.001 } }}"
          .label="${'Threshold (min slope)'}"
          .value="${this._config.threshold ?? 0.01}"
          @value-changed="${(e) => this._updateConfig('threshold', e.detail.value)}"
        ></ha-selector>
      </div>

      <div class="helper-text">
        Returns: <code>"increasing"</code>, <code>"decreasing"</code>, or <code>"stable"</code>
      </div>
    `;
  }

  _renderDurationForm() {
    return html`
      <ha-selector
        // @ts-ignore - TS2339: auto-suppressed
        .hass="${this.hass}"
        .selector="${{ text: {} }}"
        .label="${'Condition Expression'}"
        .value="${this._config.condition ?? ''}"
        .required="${true}"
        @value-changed="${(e) => this._updateConfig('condition', e.detail.value)}"
      ></ha-selector>
      <div class="helper-text">JavaScript condition on the value — e.g. <code>&gt; 20</code>, <code>!== 0</code></div>

      <ha-selector
        // @ts-ignore - TS2339: auto-suppressed
        .hass="${this.hass}"
        .selector="${{ text: {} }}"
        .label="${'Reset Condition (optional)'}"
        .value="${this._config.reset_on ?? ''}"
        @value-changed="${(e) => this._updateConfig('reset_on', e.detail.value)}"
      ></ha-selector>

      <div class="helper-text">
        Returns: <code>{ duration_ms, duration_human, in_condition }</code>
      </div>
    `;
  }

  _renderThresholdForm() {
    return html`
      <ha-selector
        // @ts-ignore - TS2339: auto-suppressed
        .hass="${this.hass}"
        .selector="${{ number: { mode: 'box', step: 0.01 } }}"
        .label="${'Threshold Value'}"
        .value="${this._config.threshold ?? 0}"
        .required="${true}"
        @value-changed="${(e) => this._updateConfig('threshold', e.detail.value)}"
      ></ha-selector>

      <div class="form-row">
        <ha-selector
          // @ts-ignore - TS2339: auto-suppressed
          .hass="${this.hass}"
          .selector="${{ number: { mode: 'box', step: 0.01 } }}"
          .label="${'Value When Above'}"
          .value="${this._config.above ?? 1}"
          @value-changed="${(e) => this._updateConfig('above', e.detail.value)}"
        ></ha-selector>

        <ha-selector
          // @ts-ignore - TS2339: auto-suppressed
          .hass="${this.hass}"
          .selector="${{ number: { mode: 'box', step: 0.01 } }}"
          .label="${'Value When Below'}"
          .value="${this._config.below ?? 0}"
          @value-changed="${(e) => this._updateConfig('below', e.detail.value)}"
        ></ha-selector>
      </div>

      <ha-selector
        // @ts-ignore - TS2339: auto-suppressed
        .hass="${this.hass}"
        .selector="${{ number: { mode: 'box', min: 0, step: 0.01 } }}"
        .label="${'Hysteresis (prevents flapping)'}"
        .value="${this._config.hysteresis ?? 0}"
        @value-changed="${(e) => this._updateConfig('hysteresis', e.detail.value)}"
      ></ha-selector>

      <div class="helper-text">
        Outputs <code>above</code> value when above threshold, <code>below</code> value when below
      </div>
    `;
  }

  _renderConvertUnitForm() {
    const unitOptions = [
      // Temperature
      { value: 'c', label: 'Celsius (°C)' },
      { value: 'f', label: 'Fahrenheit (°F)' },
      { value: 'k', label: 'Kelvin (K)' },
      // Power
      { value: 'w', label: 'Watts (W)' },
      { value: 'kw', label: 'Kilowatts (kW)' },
      { value: 'mw', label: 'Megawatts (MW)' },
      { value: 'gw', label: 'Gigawatts (GW)' },
      // Energy
      { value: 'wh', label: 'Watt-hours (Wh)' },
      { value: 'kwh', label: 'Kilowatt-hours (kWh)' },
      { value: 'mwh', label: 'Megawatt-hours (MWh)' },
      { value: 'j', label: 'Joules (J)' },
      { value: 'cal', label: 'Calories (cal)' },
      // Distance (metric)
      { value: 'mm', label: 'Millimeters (mm)' },
      { value: 'cm', label: 'Centimeters (cm)' },
      { value: 'm', label: 'Meters (m)' },
      { value: 'km', label: 'Kilometers (km)' },
      // Distance (imperial)
      { value: 'in', label: 'Inches (in)' },
      { value: 'ft', label: 'Feet (ft)' },
      { value: 'mi', label: 'Miles (mi)' },
      { value: 'yd', label: 'Yards (yd)' },
      // Speed
      { value: 'ms', label: 'Meters/second (m/s)' },
      { value: 'kmh', label: 'Km/hour (km/h)' },
      { value: 'mph', label: 'Miles/hour (mph)' },
      { value: 'knot', label: 'Knots (kn)' }
    ];

    return html`
      <div class="form-row">
        <ha-selector
          // @ts-ignore - TS2339: auto-suppressed
          .hass="${this.hass}"
          .selector="${{ select: { options: unitOptions } }}"
          .label="${'From Unit'}"
          .value="${this._config.from ?? ''}"
          .required="${true}"
          @value-changed="${(e) => this._updateConfig('from', e.detail.value)}"
        ></ha-selector>

        <ha-selector
          // @ts-ignore - TS2339: auto-suppressed
          .hass="${this.hass}"
          .selector="${{ select: { options: unitOptions } }}"
          .label="${'To Unit'}"
          .value="${this._config.to ?? ''}"
          .required="${true}"
          @value-changed="${(e) => this._updateConfig('to', e.detail.value)}"
        ></ha-selector>
      </div>
      <div class="helper-text">
        Unit codes must be compatible (e.g. temperature: c/f/k, power: w/kw/mw, distance: m/ft)
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
    // Reset config when type changes, keeping only type and input_source
    this._config = {
      type: this._selectedType,
      ...(this._config.input_source && { input_source: this._config.input_source })
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

  _updateRangeConfig(key, index, value) {
    const current = this._config[key] ? [...this._config[key]] : [0, 100];
    current[index] = value;
    this._updateConfig(key, current);
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
          return true; // all fields have safe defaults
        case 'trend':
          return this._config.samples !== undefined && this._config.samples >= 2;
        case 'round':
          return this._config.precision !== undefined && this._config.precision >= 0;
        case 'expression':
          return this._config.expression && this._config.expression.trim() !== '';
        case 'duration':
          return this._config.condition && this._config.condition.trim() !== '';
        case 'threshold':
          return this._config.threshold !== undefined;
        case 'convert_unit':
          return !!(this._config.from && this._config.to);
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
