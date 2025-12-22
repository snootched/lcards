/**
 * LCARdS Aggregation Dialog
 *
 * Modal dialog for adding/editing aggregations with type-specific forms.
 * Supports common types with declarative forms and YAML fallback for advanced.
 *
 * @element lcards-aggregation-dialog
 * @fires save - When aggregation is saved
 * @fires cancel - When dialog is cancelled
 *
 * @property {Object} hass - Home Assistant instance
 * @property {string} mode - 'add' | 'edit'
 * @property {string} aggKey - Existing key (edit mode)
 * @property {Object} aggConfig - Existing config (edit mode)
 * @property {boolean} open - Dialog open state
 */

import { LitElement, html, css } from 'lit';
import { configToYaml, yamlToConfig } from '../../utils/yaml-utils.js';
import '../shared/lcards-dialog.js';

export class LCARdSAggregationDialog extends LitElement {
  static get properties() {
    return {
      hass: { type: Object },
      mode: { type: String },
      aggKey: { type: String },
      aggConfig: { type: Object },
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
    this._resetForm();
  }

  static get styles() {
    return css`
      :host {
        display: block;
      }

      lcards-dialog {
        --mdc-dialog-min-width: 600px;
        --mdc-dialog-max-width: 800px;
      }

      .form-content {
        display: flex;
        flex-direction: column;
        gap: 16px;
        padding: 8px 0;
      }

      .helper-text {
        font-size: 12px;
        color: var(--secondary-text-color, #727272);
        margin-top: -8px;
        padding: 0 8px;
      }

      ha-textfield,
      ha-select,
      ha-textarea {
        width: 100%;
      }

      ha-alert {
        margin: 8px 0;
      }
    `;
  }

  _resetForm() {
    this._key = this.aggKey || '';
    this._selectedType = this.aggConfig?.type || '';
    this._config = this.aggConfig ? { ...this.aggConfig } : {};
    this._useYaml = false;
    this._yamlValue = '';
    this._errors = {};
  }

  // Common aggregation types with UI forms
  get supportedTypes() {
    return [
      { value: 'avg', label: 'Average' },
      { value: 'min', label: 'Minimum' },
      { value: 'max', label: 'Maximum' },
      { value: 'sum', label: 'Sum' },
      { value: 'rate', label: 'Rate of Change' },
      { value: 'trend', label: 'Trend Detection' },
      { value: '__yaml__', label: '📝 Advanced (YAML Editor)' }
    ];
  }

  willUpdate(changedProperties) {
    if (changedProperties.has('open') && this.open) {
      this._resetForm();
    }
  }

  render() {
    if (!this.open) {
      return html``;
    }

    return html`
      <lcards-dialog
        .open=${this.open}
        .heading=${this.mode === 'add' ? 'Add Aggregation' : `Edit: ${this.aggKey}`}
        scrimClickAction=""
        escapeKeyAction="">

        <div style="padding: 0 24px 8px;">
          ${this._renderForm()}
        </div>

        <ha-button
          slot="secondaryAction"
          appearance="plain"
          @click=${this._handleCancel}>
          Cancel
        </ha-button>

        <ha-button
          slot="primaryAction"
          variant="brand"
          appearance="accent"
          @click=${this._handleSave}
          ?disabled=${!this._isValid()}>
          ${this.mode === 'add' ? 'Create' : 'Save'}
        </ha-button>
      </lcards-dialog>
    `;
  }

  _renderForm() {
    return html`
      <div class="form-content">
        <!-- Key -->
        <ha-textfield
          label="Name *"
          .value=${this._key}
          @input=${(e) => { this._key = e.target.value; }}
          ?disabled=${this.mode === 'edit'}
          placeholder="e.g., avg_temp, max_pressure">
        </ha-textfield>

        <!-- Type Selector -->
        <ha-select
          label="Type *"
          .value=${this._useYaml ? '__yaml__' : this._selectedType}
          @selected=${(e) => {
            e.stopPropagation();
            e.stopImmediatePropagation();
            this._handleTypeChange(e);
          }}
          @click=${(e) => e.stopPropagation()}>
          ${this.supportedTypes.map(type => html`
            <mwc-list-item .value=${type.value}>${type.label}</mwc-list-item>
          `)}
        </ha-select>

        <!-- Type-Specific Form or YAML Editor -->
        ${this._useYaml
          ? this._renderYamlEditor()
          : this._renderTypeForm(this._selectedType)
        }
      </div>
    `;
  }

  _renderTypeForm(type) {
    switch (type) {
      case 'avg':
        return this._renderAvgForm();
      case 'min':
      case 'max':
        return this._renderMinMaxForm(type);
      case 'sum':
        return this._renderSumForm();
      case 'rate':
        return this._renderRateForm();
      case 'trend':
        return this._renderTrendForm();
      default:
        return html`
          <ha-alert alert-type="info">
            Select an aggregation type to configure.
          </ha-alert>
        `;
    }
  }

  _renderAvgForm() {
    return html`
      <ha-alert alert-type="info">
        Calculate moving average over a time window
      </ha-alert>

      <ha-selector
        .hass=${this.hass}
        .selector=${{ number: { min: 1, max: 3600, mode: 'box', unit_of_measurement: 's' } }}
        .value=${this._config.window_seconds ?? 60}
        .label=${'Window (seconds)'}
        @value-changed=${(e) => this._updateConfig('window_seconds', e.detail.value)}>
      </ha-selector>
      <div class="helper-text">Time window over which to calculate the average</div>
    `;
  }

  _renderMinMaxForm(type) {
    const label = type === 'min' ? 'Minimum' : 'Maximum';

    return html`
      <ha-alert alert-type="info">
        Track ${label.toLowerCase()} value over a time window
      </ha-alert>

      <ha-selector
        .hass=${this.hass}
        .selector=${{ number: { min: 1, max: 3600, mode: 'box', unit_of_measurement: 's' } }}
        .value=${this._config.window_seconds ?? 60}
        .label=${'Window (seconds)'}
        @value-changed=${(e) => this._updateConfig('window_seconds', e.detail.value)}>
      </ha-selector>
      <div class="helper-text">Time window over which to find the ${label.toLowerCase()}</div>
    `;
  }

  _renderSumForm() {
    return html`
      <ha-alert alert-type="info">
        Calculate sum/total over a time window
      </ha-alert>

      <ha-selector
        .hass=${this.hass}
        .selector=${{ number: { min: 1, max: 3600, mode: 'box', unit_of_measurement: 's' } }}
        .value=${this._config.window_seconds ?? 60}
        .label=${'Window (seconds)'}
        @value-changed=${(e) => this._updateConfig('window_seconds', e.detail.value)}>
      </ha-selector>
      <div class="helper-text">Time window over which to calculate the sum</div>
    `;
  }

  _renderRateForm() {
    return html`
      <ha-alert alert-type="info">
        Calculate rate of change per time unit
      </ha-alert>

      <ha-selector
        .hass=${this.hass}
        .selector=${{ number: { min: 1, max: 3600, mode: 'box', unit_of_measurement: 's' } }}
        .value=${this._config.window_seconds ?? 60}
        .label=${'Window (seconds)'}
        @value-changed=${(e) => this._updateConfig('window_seconds', e.detail.value)}>
      </ha-selector>

      <ha-select
        label="Time Unit"
        .value=${this._config.per_unit || 'second'}
        @selected=${(e) => {
          e.stopPropagation();
          e.stopImmediatePropagation();
          this._updateConfig('per_unit', e.target.value);
        }}
        @click=${(e) => e.stopPropagation()}>
        <mwc-list-item value="second">Per Second</mwc-list-item>
        <mwc-list-item value="minute">Per Minute</mwc-list-item>
        <mwc-list-item value="hour">Per Hour</mwc-list-item>
      </ha-select>

      <div class="helper-text">Calculate rate of change per selected time unit</div>
    `;
  }

  _renderTrendForm() {
    return html`
      <ha-alert alert-type="info">
        Detect if values are rising, falling, or stable
      </ha-alert>

      <ha-selector
        .hass=${this.hass}
        .selector=${{ number: { min: 1, max: 3600, mode: 'box', unit_of_measurement: 's' } }}
        .value=${this._config.window_seconds ?? 60}
        .label=${'Window (seconds)'}
        @value-changed=${(e) => this._updateConfig('window_seconds', e.detail.value)}>
      </ha-selector>

      <ha-selector
        .hass=${this.hass}
        .selector=${{ number: { min: 0, max: 100, step: 0.1, mode: 'box' } }}
        .value=${this._config.threshold ?? 1}
        .label=${'Stability Threshold'}
        @value-changed=${(e) => this._updateConfig('threshold', e.detail.value)}>
      </ha-selector>

      <div class="helper-text">
        Values within ±threshold are considered stable.
        Returns: 'rising', 'falling', or 'stable'
      </div>
    `;
  }

  _renderYamlEditor() {
    return html`
      <ha-alert alert-type="info">
        Advanced YAML editor for custom aggregation types.
        See documentation for all available aggregation types.
      </ha-alert>

      <ha-textarea
        label="YAML Configuration"
        .value=${this._yamlValue}
        @input=${(e) => this._yamlValue = e.target.value}
        rows="10"
        placeholder="type: custom_aggregation
window_seconds: 300
parameter1: value1">
      </ha-textarea>
    `;
  }

  _handleTypeChange(event) {
    event.stopPropagation(); // Prevent bubbling to dialog
    const value = event.target.value;

    if (value === '__yaml__') {
      this._useYaml = true;
      this._yamlValue = configToYaml(this._config);
    } else {
      this._useYaml = false;
      this._selectedType = value;
      this._config = { type: value, window_seconds: 60 };
    }

    // Don't call requestUpdate() - Lit's reactivity will handle it
  }

  _updateConfig(key, value) {
    this._config = {
      ...this._config,
      [key]: value
    };
    this.requestUpdate();
  }

  _isValid() {
    // Name is required
    if (!this._key || this._key.trim().length === 0) {
      return false;
    }

    // Check for valid identifier
    if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(this._key)) {
      return false;
    }

    // Type is required
    if (this._useYaml) {
      // YAML must be valid
      if (!this._yamlValue || this._yamlValue.trim().length === 0) {
        return false;
      }
      try {
        yamlToConfig(this._yamlValue);
      } catch (e) {
        return false;
      }
    } else {
      if (!this._selectedType) {
        return false;
      }

      // Type must exist in config
      if (!this._config.type) {
        return false;
      }
    }

    return true;
  }

  _handleSave() {
    if (!this._isValid()) return;

    let finalConfig;

    if (this._useYaml) {
      try {
        finalConfig = yamlToConfig(this._yamlValue);
      } catch (e) {
        console.error('[LCARdS] Failed to parse YAML:', e);
        return;
      }
    } else {
      finalConfig = { ...this._config };
    }

    this.dispatchEvent(new CustomEvent('save', {
      detail: {
        key: this._key,
        config: finalConfig
      },
      bubbles: true,
      composed: true
    }));
  }

  _handleCancel() {
    this.dispatchEvent(new CustomEvent('cancel', {
      bubbles: true,
      composed: true
    }));
  }
}

customElements.define('lcards-aggregation-dialog', LCARdSAggregationDialog);
