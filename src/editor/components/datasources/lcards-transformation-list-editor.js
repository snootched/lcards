/**
 * LCARdS Transformation List Editor
 *
 * Manages list of transformations for a datasource.
 * Each transformation can be edited with type-specific forms or YAML.
 *
 * @element lcards-transformation-list-editor
 * @fires transformations-changed - When transformations updated
 *
 * @property {Object} editor - Parent editor instance
 * @property {Object} transformations - Transformations object (keyed by name)
 * @property {Object} hass - Home Assistant instance
 */

import { LitElement, html, css } from 'lit';
import './lcards-transformation-dialog.js';
import '../form/lcards-form-section.js';

export class LCARdSTransformationListEditor extends LitElement {
  static get properties() {
    return {
      editor: { type: Object },
      transformations: { type: Object },
      hass: { type: Object },
      _dialogOpen: { type: Boolean, state: true },
      _dialogMode: { type: String, state: true },  // 'add' | 'edit'
      _editingKey: { type: String, state: true },
      _editingConfig: { type: Object, state: true }
    };
  }

  constructor() {
    super();
    this.transformations = {};
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

      .transform-list {
        display: flex;
        flex-direction: column;
        gap: 8px;
        margin-bottom: 12px;
      }

      .transform-item {
        background: var(--secondary-background-color, #f5f5f5);
        border-radius: 8px;
        padding: 12px;
        border: 1px solid var(--divider-color, #e0e0e0);
      }

      .transform-header {
        display: flex;
        align-items: center;
        gap: 12px;
      }

      .transform-header ha-icon {
        --mdc-icon-size: 20px;
        color: var(--primary-color, #03a9f4);
      }

      .transform-info {
        flex: 1;
      }

      .transform-name {
        font-weight: 500;
        color: var(--primary-text-color, #212121);
      }

      .transform-type {
        font-size: 12px;
        color: var(--secondary-text-color, #727272);
        font-family: monospace;
      }

      .transform-actions {
        display: flex;
        gap: 4px;
      }

      .transform-summary {
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
    const transformKeys = Object.keys(this.transformations || {});

    return html`
      <lcards-form-section
        header="Transformations"
        description="Process and transform datasource values"
        icon="mdi:function-variant"
        ?expanded=${true}
        ?outlined=${true}
        headerLevel="4">

        ${transformKeys.length === 0 ? html`
          <div class="empty-state">
            <ha-icon icon="mdi:function-variant"></ha-icon>
            <p>No transformations configured</p>
            <p class="helper-text">
              Transformations process values before they're used (e.g., unit conversion, smoothing, scaling).
            </p>
          </div>
        ` : html`
          <div class="transform-list">
            ${transformKeys.map(key => this._renderTransform(key, this.transformations[key]))}
          </div>
        `}

        <mwc-button
          outlined
          @click=${this._handleAdd}>
          <ha-icon icon="mdi:plus" slot="icon"></ha-icon>
          Add Transformation
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
    const existingDialog = document.body.querySelector('lcards-transformation-dialog[data-portal]');
    if (existingDialog) {
      existingDialog.remove();
    }

    // Only create if dialog should be open
    if (!this._dialogOpen) return;

    // Create dialog element
    const dialog = document.createElement('lcards-transformation-dialog');
    dialog.setAttribute('data-portal', '');
    dialog.hass = this.hass;
    dialog.mode = this._dialogMode;
    dialog.transformKey = this._editingKey;
    dialog.transformConfig = this._editingConfig;
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
    const existingDialog = document.body.querySelector('lcards-transformation-dialog[data-portal]');
    if (existingDialog) {
      existingDialog.remove();
    }
  }

  _renderTransform(key, config) {
    const type = config.type || 'unknown';

    return html`
      <div class="transform-item">
        <div class="transform-header">
          <ha-icon icon="mdi:function"></ha-icon>
          <div class="transform-info">
            <div class="transform-name">${key}</div>
            <div class="transform-type">${type}</div>
          </div>
          <div class="transform-actions">
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

        ${this._renderTransformSummary(config)}
      </div>
    `;
  }

  _renderTransformSummary(config) {
    // Show key parameters based on type
    switch (config.type) {
      case 'unit_conversion':
        return html`
          <div class="transform-summary">
            ${config.from_unit} → ${config.to_unit}
          </div>
        `;

      case 'scale':
        return html`
          <div class="transform-summary">
            [${config.input_min}, ${config.input_max}] →
            [${config.output_min}, ${config.output_max}]
          </div>
        `;

      case 'exponential_smoothing':
        return html`
          <div class="transform-summary">
            Alpha: ${config.alpha || 0.3}
          </div>
        `;

      case 'moving_average':
        return html`
          <div class="transform-summary">
            Window: ${config.window || 5} points
          </div>
        `;

      default:
        return html`
          <div class="transform-summary">
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
    if (!confirm(`Remove transformation "${key}"?`)) {
      return;
    }

    const updated = { ...this.transformations };
    delete updated[key];

    this.dispatchEvent(new CustomEvent('transformations-changed', {
      detail: { value: updated },
      bubbles: true,
      composed: true
    }));
  }

  _handleDialogSave(event) {
    const { key, config } = event.detail;

    const updated = {
      ...this.transformations,
      [key]: config
    };

    this.dispatchEvent(new CustomEvent('transformations-changed', {
      detail: { value: updated },
      bubbles: true,
      composed: true
    }));

    // Close dialog and clean up portal
    this._dialogOpen = false;
    const existingDialog = document.body.querySelector('lcards-transformation-dialog[data-portal]');
    if (existingDialog) {
      existingDialog.remove();
    }
  }
}

customElements.define('lcards-transformation-list-editor', LCARdSTransformationListEditor);
