/**
 * LCARdS Datasource Add/Edit Dialog
 *
 * Modal dialog for creating or editing datasource configurations.
 * Uses ha-dialog with form validation and real-time entity checking.
 *
 * @element lcards-datasource-dialog
 * @fires save - When datasource is saved (detail: {name, config})
 * @fires cancel - When dialog is cancelled
 *
 * @property {Object} hass - Home Assistant instance
 * @property {string} mode - 'add' | 'edit'
 * @property {string} sourceName - Existing name (edit mode only)
 * @property {Object} sourceConfig - Existing config (edit mode only)
 * @property {boolean} open - Dialog open state
 */

import { LitElement, html, css } from 'lit';
import { fireEvent } from 'custom-card-helpers';
import '../form/lcards-form-section.js';
import './lcards-transformation-list-editor.js';
import './lcards-aggregation-list-editor.js';

export class LCARdSDataSourceDialog extends LitElement {
  static get properties() {
    return {
      hass: { type: Object },
      mode: { type: String },      // 'add' | 'edit'
      sourceName: { type: String },
      sourceConfig: { type: Object },
      open: { type: Boolean },
      _name: { type: String, state: true },
      _config: { type: Object, state: true },
      _entityValid: { type: Boolean, state: true },
      _entitySuggestions: { type: Array, state: true },
      _showHistory: { type: Boolean, state: true },
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

      ha-dialog {
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
      ha-entity-picker,
      ha-select {
        width: 100%;
      }

      ha-alert {
        margin: 8px 0;
      }

      ha-alert a {
        color: var(--primary-color);
        text-decoration: none;
        margin: 0 4px;
      }

      ha-alert a:hover {
        text-decoration: underline;
      }

      .timing-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 12px;
      }

      @media (max-width: 600px) {
        .timing-grid {
          grid-template-columns: 1fr;
        }
      }
    `;
  }

  _resetForm() {
    this._name = this.sourceName || '';
    this._config = this.sourceConfig ? { ...this.sourceConfig } : {
      entity: '',
      attribute: '__state__',
      window_seconds: 60,
      min_emit_ms: 100,
      emit_on_same_value: true,
      history: {
        preload: false,
        hours: 24,
        days: 0
      }
    };
    this._entityValid = false;
    this._entitySuggestions = [];
    this._showHistory = this._config.history?.preload || false;
    this._errors = {};
  }

  willUpdate(changedProperties) {
    if (changedProperties.has('open') && this.open) {
      this._resetForm();
      if (this._config.entity) {
        this._validateEntity(this._config.entity);
      }
    }
  }

  render() {
    if (!this.open) {
      return html``;
    }

    return html`
      <ha-dialog
        .open=${this.open}
        @closed=${this._handleCancel}
        .heading=${this.mode === 'add' ? 'Add Datasource' : `Edit Datasource: ${this.sourceName}`}
        scrimClickAction=""
        escapeKeyAction="">

        <div style="padding: 0 24px 8px;">
          ${this._renderForm()}
        </div>

        <ha-button
          slot="secondaryAction"
          appearance="plain"
          @click=${this._handleCancel}
          dialogAction="cancel">
          Cancel
        </ha-button>

        <ha-button
          slot="primaryAction"
          variant="brand"
          appearance="accent"
          @click=${this._handleSave}
          ?disabled=${!this._isValid()}
          dialogAction="ok">
          ${this.mode === 'add' ? 'Create' : 'Save'}
        </ha-button>
      </ha-dialog>
    `;
  }

  _renderForm() {
    return html`
      <div class="form-content">
        <!-- Name -->
        <ha-textfield
          label="Name *"
          .value=${this._name}
          @input=${(e) => { this._name = e.target.value; this._validateName(); }}
          .validationMessage=${this._errors.name || ''}
          ?invalid=${!!this._errors.name}
          ?disabled=${this.mode === 'edit'}
          placeholder="e.g., temperature, humidity">
        </ha-textfield>
        ${this.mode === 'edit' ? html`
          <div class="helper-text">Name cannot be changed after creation</div>
        ` : ''}

        <!-- Entity -->
        ${this._renderEntityPicker()}

        ${!this._entityValid && this._config.entity ? html`
          <ha-alert alert-type="warning">
            Entity "${this._config.entity}" not found in Home Assistant.
            ${this._entitySuggestions.length > 0 ? html`
              <div>Did you mean:${this._entitySuggestions.map(id => html`
                <a href="#" @click=${(e) => this._selectSuggestion(e, id)}>${id}</a>
              `)}</div>
            ` : ''}
          </ha-alert>
        ` : ''}

        <!-- Attribute -->
        ${this._entityValid ? html`
          ${this._renderAttributeSelect()}
        ` : ''}

        <!-- Timing Settings -->
        <lcards-form-section
          header="Timing Settings"
          ?expanded=${false}
          ?outlined=${false}>

          <div class="timing-grid">
            ${this._renderNumberInput('Window Seconds', 'window_seconds', 60, 1, 3600, 's', 'Time window for buffered data')}
            ${this._renderNumberInput('Min Emit (ms)', 'min_emit_ms', 100, 10, 5000, 'ms', 'Minimum time between emissions')}
            ${this._renderNumberInput('Coalesce (ms)', 'coalesce_ms', 0, 0, 1000, 'ms', 'Batch rapid updates (0 = disabled)')}
            ${this._renderNumberInput('Max Delay (ms)', 'max_delay_ms', undefined, 0, 10000, 'ms', 'Maximum emission delay (optional)')}
          </div>

          ${this._renderBooleanSwitch('Emit on Same Value', 'emit_on_same_value', true)}
        </lcards-form-section>

        <!-- History Preload -->
        <lcards-form-section
          header="History Preload"
          ?expanded=${this._showHistory}
          ?outlined=${false}
          @expanded-changed=${(e) => this._showHistory = e.detail.expanded}>

          ${this._renderBooleanSwitch('Preload History', 'history.preload', false, 'Load historical data on initialization')}

          ${this._config.history?.preload ? html`
            <div class="timing-grid">
              ${this._renderNumberInput('Hours', 'history.hours', 24, 0, 168, 'h')}
              ${this._renderNumberInput('Days', 'history.days', 0, 0, 30, 'd')}
            </div>
          ` : ''}
        </lcards-form-section>

        <!-- Transformations -->
        <lcards-transformation-list-editor
          .transformations=${this._config.transformations || {}}
          .hass=${this.hass}
          @transformations-changed=${this._handleTransformationsChange}>
        </lcards-transformation-list-editor>

        <!-- Aggregations -->
        <lcards-aggregation-list-editor
          .aggregations=${this._config.aggregations || {}}
          .hass=${this.hass}
          @aggregations-changed=${this._handleAggregationsChange}>
        </lcards-aggregation-list-editor>
      </div>
    `;
  }

  _renderEntityPicker() {
    const hasEntityPicker = customElements.get('ha-entity-picker');

    if (hasEntityPicker) {
      return html`
        <ha-entity-picker
          label="Entity *"
          .hass=${this.hass}
          .value=${this._config.entity}
          @value-changed=${this._handleEntityChange}
          allow-custom-entity>
        </ha-entity-picker>
      `;
    }

    // Fallback to textfield if ha-entity-picker not available
    return html`
      <ha-textfield
        label="Entity *"
        .value=${this._config.entity}
        @input=${(e) => {
          this._config.entity = e.target.value;
          this._validateEntity(e.target.value);
          this.requestUpdate();
        }}
        placeholder="e.g., sensor.temperature">
      </ha-textfield>
    `;
  }

  _renderAttributeSelect() {
    const hasSelect = customElements.get('ha-select');
    const options = this._getAttributeOptions(this._config.entity);

    if (hasSelect) {
      return html`
        <ha-select
          label="Attribute"
          .value=${this._config.attribute || '__state__'}
          @selected=${this._handleAttributeChange}>
          ${options.map(opt => html`
            <mwc-list-item .value=${opt.value}>${opt.label}</mwc-list-item>
          `)}
        </ha-select>
      `;
    }

    // Fallback to native select
    return html`
      <select
        @change=${this._handleAttributeChange}
        .value=${this._config.attribute || '__state__'}>
        ${options.map(opt => html`
          <option .value=${opt.value}>${opt.label}</option>
        `)}
      </select>
    `;
  }

  _renderNumberInput(label, path, defaultValue, min, max, unit, helper) {
    const hasSelector = customElements.get('ha-selector');
    const value = this._getConfigValue(path, defaultValue);

    if (hasSelector) {
      return html`
        <div>
          <ha-selector
            .hass=${this.hass}
            .selector=${{ number: { min, max, mode: 'box', unit_of_measurement: unit } }}
            .value=${value}
            .label=${label}
            @value-changed=${(e) => this._setConfigValue(path, e.detail.value)}>
          </ha-selector>
          ${helper ? html`<div class="helper-text">${helper}</div>` : ''}
        </div>
      `;
    }

    // Fallback to number input
    return html`
      <div>
        <label>${label}</label>
        <input
          type="number"
          .value=${value || ''}
          min=${min}
          max=${max}
          @input=${(e) => this._setConfigValue(path, parseInt(e.target.value) || defaultValue)}
        />
        ${helper ? html`<div class="helper-text">${helper}</div>` : ''}
      </div>
    `;
  }

  _renderBooleanSwitch(label, path, defaultValue, helper) {
    const hasSelector = customElements.get('ha-selector');
    const value = this._getConfigValue(path, defaultValue);

    if (hasSelector) {
      return html`
        <div>
          <ha-selector
            .hass=${this.hass}
            .selector=${{ boolean: {} }}
            .value=${value}
            .label=${label}
            @value-changed=${(e) => this._setConfigValue(path, e.detail.value)}>
          </ha-selector>
          ${helper ? html`<div class="helper-text">${helper}</div>` : ''}
        </div>
      `;
    }

    // Fallback to checkbox
    return html`
      <div>
        <label>
          <input
            type="checkbox"
            .checked=${value}
            @change=${(e) => this._setConfigValue(path, e.target.checked)}
          />
          ${label}
        </label>
        ${helper ? html`<div class="helper-text">${helper}</div>` : ''}
      </div>
    `;
  }

  _getConfigValue(path, defaultValue) {
    const parts = path.split('.');
    let value = this._config;

    for (const part of parts) {
      if (value && typeof value === 'object' && part in value) {
        value = value[part];
      } else {
        return defaultValue;
      }
    }

    return value !== undefined ? value : defaultValue;
  }

  _setConfigValue(path, value) {
    const parts = path.split('.');

    if (parts.length === 1) {
      this._config[parts[0]] = value;
    } else if (parts[0] === 'history') {
      if (!this._config.history) {
        this._config.history = {};
      }
      this._config.history[parts[1]] = value;
    }

    this.requestUpdate();
  }

  _handleEntityChange(event) {
    const entityId = event.detail.value;
    this._config.entity = entityId;
    this._validateEntity(entityId);
    this.requestUpdate();
  }

  _validateEntity(entityId) {
    if (!entityId) {
      this._entityValid = false;
      this._entitySuggestions = [];
      return;
    }

    const validation = this._getEntityValidation(entityId);
    this._entityValid = validation.valid;
    this._entitySuggestions = validation.suggestions || [];
  }

  _getEntityValidation(entityId) {
    if (!this.hass?.states) {
      return { valid: false, message: 'HASS not available' };
    }

    const exists = !!this.hass.states[entityId];

    if (!exists) {
      const similar = this._findSimilarEntities(entityId);
      return {
        valid: false,
        message: `Entity "${entityId}" not found`,
        suggestions: similar
      };
    }

    return { valid: true };
  }

  _findSimilarEntities(entityId) {
    if (!this.hass?.states) {
      return [];
    }

    const allEntities = Object.keys(this.hass.states);
    const domain = entityId.split('.')[0];

    return allEntities
      .filter(id => id.startsWith(domain))
      .filter(id => {
        const name = id.toLowerCase();
        const search = entityId.toLowerCase();
        return name.includes(search) || search.includes(name);
      })
      .slice(0, 5);
  }

  _selectSuggestion(event, entityId) {
    event.preventDefault();
    this._config.entity = entityId;
    this._validateEntity(entityId);
    this.requestUpdate();
  }

  _getAttributeOptions(entityId) {
    if (!this.hass?.states?.[entityId]) {
      return [{ value: '__state__', label: '(State)' }];
    }

    const state = this.hass.states[entityId];
    const attributes = Object.keys(state.attributes || {});

    return [
      { value: '__state__', label: '(State)' },
      ...attributes.map(attr => ({ value: attr, label: attr }))
    ];
  }

  _handleAttributeChange(event) {
    const value = event.target.value || event.detail?.value;
    this._config.attribute = value === '__state__' ? undefined : value;
    this.requestUpdate();
  }

  _validateName() {
    if (!this._name || this._name.trim().length === 0) {
      this._errors.name = 'Name is required';
      return false;
    }

    // Check for valid identifier (alphanumeric + underscore)
    if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(this._name)) {
      this._errors.name = 'Name must be a valid identifier (letters, numbers, underscore)';
      return false;
    }

    delete this._errors.name;
    return true;
  }

  _handleTransformationsChange(event) {
    const transformations = event.detail.value;
    
    // Remove transformations if empty, otherwise set
    if (Object.keys(transformations).length === 0) {
      delete this._config.transformations;
    } else {
      this._config.transformations = transformations;
    }
    
    this.requestUpdate();
  }

  _handleAggregationsChange(event) {
    const aggregations = event.detail.value;
    
    // Remove aggregations if empty, otherwise set
    if (Object.keys(aggregations).length === 0) {
      delete this._config.aggregations;
    } else {
      this._config.aggregations = aggregations;
    }
    
    this.requestUpdate();
  }

  _isValid() {
    return this._validateName() && this._entityValid && this._config.entity;
  }

  _handleSave() {
    if (!this._isValid()) return;

    // Clean up config (remove empty/default values)
    const cleanConfig = { ...this._config };
    if (!cleanConfig.attribute || cleanConfig.attribute === '__state__') {
      delete cleanConfig.attribute;
    }
    if (!cleanConfig.history?.preload) {
      delete cleanConfig.history;
    }
    if (cleanConfig.coalesce_ms === 0 || cleanConfig.coalesce_ms === undefined) {
      delete cleanConfig.coalesce_ms;
    }
    if (cleanConfig.max_delay_ms === undefined) {
      delete cleanConfig.max_delay_ms;
    }
    // Clean up empty transformations and aggregations
    if (cleanConfig.transformations && Object.keys(cleanConfig.transformations).length === 0) {
      delete cleanConfig.transformations;
    }
    if (cleanConfig.aggregations && Object.keys(cleanConfig.aggregations).length === 0) {
      delete cleanConfig.aggregations;
    }

    this.dispatchEvent(new CustomEvent('save', {
      detail: {
        name: this._name,
        config: cleanConfig
      },
      bubbles: true,
      composed: true
    }));

    this.open = false;
  }

  _handleCancel() {
    this.open = false;
    this.dispatchEvent(new CustomEvent('cancel', {
      bubbles: true,
      composed: true
    }));
  }
}

customElements.define('lcards-datasource-dialog', LCARdSDataSourceDialog);
