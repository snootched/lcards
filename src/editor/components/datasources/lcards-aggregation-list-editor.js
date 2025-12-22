/**
 * LCARdS Aggregation List Editor
 *
 * Manages list of aggregations for a datasource.
 * Each aggregation can be edited with type-specific forms or YAML.
 *
 * @element lcards-aggregation-list-editor
 * @fires aggregations-changed - When aggregations updated
 *
 * @property {Object} editor - Parent editor instance
 * @property {Object} aggregations - Aggregations object (keyed by name)
 * @property {Object} hass - Home Assistant instance
 */

import { LitElement, html, css } from 'lit';
import './lcards-aggregation-dialog.js';
import '../shared/lcards-form-section.js';

export class LCARdSAggregationListEditor extends LitElement {
  static get properties() {
    return {
      editor: { type: Object },
      aggregations: { type: Object },
      hass: { type: Object },
      _dialogOpen: { type: Boolean, state: true },
      _dialogMode: { type: String, state: true },  // 'add' | 'edit'
      _editingKey: { type: String, state: true },
      _editingConfig: { type: Object, state: true }
    };
  }

  constructor() {
    super();
    this.aggregations = {};
    this._dialogOpen = false;
    this._dialogMode = 'add';
  }

  static get styles() {
    return css`
      :host {
        display: block;
      }

      .empty-state {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 32px 24px;
        text-align: center;
        color: var(--secondary-text-color, #727272);
      }

      .empty-state ha-icon {
        --mdc-icon-size: 48px;
        color: var(--disabled-text-color, #9e9e9e);
        margin-bottom: 12px;
      }

      .empty-state p {
        margin: 8px 0;
      }

      .empty-state .helper-text {
        font-size: 14px;
        max-width: 400px;
      }

      .agg-list {
        display: flex;
        flex-direction: column;
        gap: 8px;
        margin-bottom: 12px;
      }

      .agg-item {
        background: var(--secondary-background-color, #f5f5f5);
        border-radius: 8px;
        padding: 12px;
        border: 1px solid var(--divider-color, #e0e0e0);
      }

      .agg-header {
        display: flex;
        align-items: center;
        gap: 12px;
      }

      .agg-header ha-icon {
        --mdc-icon-size: 20px;
        color: var(--success-color, #4caf50);
      }

      .agg-info {
        flex: 1;
      }

      .agg-name {
        font-weight: 500;
        color: var(--primary-text-color, #212121);
      }

      .agg-type {
        font-size: 12px;
        color: var(--secondary-text-color, #727272);
        font-family: monospace;
      }

      .agg-actions {
        display: flex;
        gap: 4px;
      }

      .agg-summary {
        margin-top: 8px;
        padding-top: 8px;
        border-top: 1px solid var(--divider-color, #e0e0e0);
        font-size: 12px;
        color: var(--secondary-text-color, #727272);
        font-family: monospace;
      }

      mwc-button {
        cursor: pointer;
      }
    `;
  }

  render() {
    const aggKeys = Object.keys(this.aggregations || {});

    return html`
      <lcards-form-section
        header="Aggregations"
        description="Aggregate data over time windows"
        icon="mdi:chart-line"
        ?expanded=${true}
        ?outlined=${true}
        headerLevel="4">

        ${aggKeys.length === 0 ? html`
          <div class="empty-state">
            <ha-icon icon="mdi:chart-line"></ha-icon>
            <p>No aggregations configured</p>
            <p class="helper-text">
              Aggregations calculate statistics over time windows (e.g., average, min, max, rate of change).
            </p>
          </div>
        ` : html`
          <div class="agg-list">
            ${aggKeys.map(key => this._renderAggregation(key, this.aggregations[key]))}
          </div>
        `}

        <mwc-button
          outlined
          @click=${this._handleAdd}>
          <ha-icon icon="mdi:plus" slot="icon"></ha-icon>
          Add Aggregation
        </mwc-button>
      </lcards-form-section>
    `;
  }

  // Render dialog to document.body to avoid nesting issues with ha-dialog
  updated(changedProps) {
    super.updated(changedProps);

    if (changedProps.has('_dialogOpen')) {
      this._renderDialogToBody();
    }
  }

  _renderDialogToBody() {
    // Remove existing dialog if present
    const existingDialog = document.body.querySelector('lcards-aggregation-dialog[data-portal]');
    if (existingDialog) {
      existingDialog.remove();
    }

    // Only create if dialog should be open
    if (!this._dialogOpen) return;

    // Create dialog element
    const dialog = document.createElement('lcards-aggregation-dialog');
    dialog.setAttribute('data-portal', '');
    dialog.hass = this.hass;
    dialog.mode = this._dialogMode;
    dialog.aggKey = this._editingKey;
    dialog.aggConfig = this._editingConfig;
    dialog.open = true;

    // Handle events
    dialog.addEventListener('save', (e) => this._handleDialogSave(e));
    dialog.addEventListener('cancel', () => {
      this._dialogOpen = false;
      dialog.remove();
    });

    // Append to body (outside the parent dialog)
    document.body.appendChild(dialog);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    // Clean up portal dialog when component is removed
    const existingDialog = document.body.querySelector('lcards-aggregation-dialog[data-portal]');
    if (existingDialog) {
      existingDialog.remove();
    }
  }

  _renderAggregation(key, config) {
    const type = config.type || 'unknown';

    return html`
      <div class="agg-item">
        <div class="agg-header">
          <ha-icon icon="mdi:chart-bell-curve-cumulative"></ha-icon>
          <div class="agg-info">
            <div class="agg-name">${key}</div>
            <div class="agg-type">${type}</div>
          </div>
          <div class="agg-actions">
            <mwc-icon-button
              @click=${() => this._handleEdit(key, config)}>
              <ha-icon icon="mdi:pencil"></ha-icon>
            </mwc-icon-button>
            <mwc-icon-button
              @click=${() => this._handleDelete(key)}>
              <ha-icon icon="mdi:delete"></ha-icon>
            </mwc-icon-button>
          </div>
        </div>

        ${this._renderAggregationSummary(config)}
      </div>
    `;
  }

  _renderAggregationSummary(config) {
    // Show key parameters based on type
    const window = config.window_seconds || 60;

    switch (config.type) {
      case 'avg':
        return html`
          <div class="agg-summary">
            Average over ${window}s window
          </div>
        `;

      case 'min':
        return html`
          <div class="agg-summary">
            Minimum over ${window}s window
          </div>
        `;

      case 'max':
        return html`
          <div class="agg-summary">
            Maximum over ${window}s window
          </div>
        `;

      case 'sum':
        return html`
          <div class="agg-summary">
            Sum over ${window}s window
          </div>
        `;

      case 'rate':
        return html`
          <div class="agg-summary">
            Rate of change per ${config.per_unit || 'second'} (${window}s window)
          </div>
        `;

      case 'trend':
        return html`
          <div class="agg-summary">
            Trend detection (threshold: ${config.threshold || 1}, ${window}s window)
          </div>
        `;

      default:
        return html`
          <div class="agg-summary">
            ${Object.keys(config).filter(k => k !== 'type').length} parameters
          </div>
        `;
    }
  }

  _handleAdd() {
    this._dialogMode = 'add';
    this._editingKey = '';
    this._editingConfig = null;
    this._dialogOpen = true;
  }

  _handleEdit(key, config) {
    this._dialogMode = 'edit';
    this._editingKey = key;
    this._editingConfig = { ...config };
    this._dialogOpen = true;
  }

  _handleDelete(key) {
    if (!confirm(`Remove aggregation "${key}"?`)) {
      return;
    }

    const updated = { ...this.aggregations };
    delete updated[key];

    this.dispatchEvent(new CustomEvent('aggregations-changed', {
      detail: { value: updated },
      bubbles: true,
      composed: true
    }));
  }

  _handleDialogSave(event) {
    const { key, config } = event.detail;

    const updated = {
      ...this.aggregations,
      [key]: config
    };

    this.dispatchEvent(new CustomEvent('aggregations-changed', {
      detail: { value: updated },
      bubbles: true,
      composed: true
    }));

    // Close dialog and clean up portal
    this._dialogOpen = false;
    const existingDialog = document.body.querySelector('lcards-aggregation-dialog[data-portal]');
    if (existingDialog) {
      existingDialog.remove();
    }
  }
}

customElements.define('lcards-aggregation-list-editor', LCARdSAggregationListEditor);
