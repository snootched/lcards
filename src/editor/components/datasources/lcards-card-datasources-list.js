/**
 * Card Datasources List
 * 
 * Displays datasources configured on this card in expandable list format.
 * Read-only in Phase 1, CRUD operations added in Phase 2.
 * 
 * @element lcards-card-datasources-list
 * @property {Object} editor - Parent editor instance
 * @property {Object} config - Card configuration
 * @property {Object} hass - Home Assistant instance
 */

import { LitElement, html, css } from 'lit';
import '../form/lcards-form-section.js';

export class LCARdSCardDataSourcesList extends LitElement {
  static get properties() {
    return {
      editor: { type: Object },
      config: { type: Object },
      hass: { type: Object },
      _expandedSources: { type: Set, state: true }
    };
  }
  
  constructor() {
    super();
    this._expandedSources = new Set();
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
        padding: 48px 24px;
        text-align: center;
        color: var(--secondary-text-color, #727272);
      }

      .empty-state ha-icon {
        --mdc-icon-size: 64px;
        color: var(--disabled-text-color, #9e9e9e);
        margin-bottom: 16px;
      }

      .empty-state p {
        margin: 8px 0;
      }

      .empty-state .helper-text {
        font-size: 14px;
        max-width: 400px;
      }

      .datasources-list {
        display: flex;
        flex-direction: column;
        gap: 12px;
      }

      .datasource-details {
        padding: 8px;
      }

      .info-row {
        display: flex;
        justify-content: space-between;
        padding: 6px 0;
        border-bottom: 1px solid var(--divider-color, #e0e0e0);
      }

      .info-row:last-of-type {
        border-bottom: none;
      }

      .info-row .label {
        font-weight: 500;
        color: var(--secondary-text-color, #727272);
      }

      .info-row .value {
        color: var(--primary-text-color, #212121);
        font-family: monospace;
      }

      .action-buttons {
        display: flex;
        gap: 8px;
        margin-top: 12px;
      }
    `;
  }
  
  render() {
    const datasources = this.config?.data_sources || {};
    const sourceKeys = Object.keys(datasources);
    
    if (sourceKeys.length === 0) {
      return html`
        <div class="empty-state">
          <ha-icon icon="mdi:database-off-outline"></ha-icon>
          <p>No datasources configured for this card.</p>
          <p class="helper-text">
            Click "+ Add Source" to create a new datasource, 
            or edit the YAML tab to configure datasources manually.
          </p>
        </div>
      `;
    }
    
    return html`
      <div class="datasources-list">
        ${sourceKeys.map(key => this._renderDataSource(key, datasources[key]))}
      </div>
    `;
  }
  
  _renderDataSource(name, config) {
    const isExpanded = this._expandedSources.has(name);
    
    return html`
      <lcards-form-section
        header="${name}"
        secondary="${config.entity || 'No entity'}"
        icon="mdi:database"
        ?expanded=${isExpanded}
        ?outlined=${true}
        headerLevel="4"
        @expanded-changed=${(e) => this._toggleExpanded(name, e)}>
        
        ${isExpanded ? html`
          <div class="datasource-details">
            <!-- Basic Info -->
            <div class="info-row">
              <span class="label">Entity:</span>
              <span class="value">${config.entity || 'N/A'}</span>
            </div>
            
            ${config.attribute ? html`
              <div class="info-row">
                <span class="label">Attribute:</span>
                <span class="value">${config.attribute}</span>
              </div>
            ` : ''}
            
            <div class="info-row">
              <span class="label">Window:</span>
              <span class="value">${config.window_seconds || 60}s</span>
            </div>
            
            <!-- Transformations -->
            ${config.transformations ? html`
              <div class="info-row">
                <span class="label">Transformations:</span>
                <span class="value">${Object.keys(config.transformations).length}</span>
              </div>
            ` : ''}
            
            <!-- Aggregations -->
            ${config.aggregations ? html`
              <div class="info-row">
                <span class="label">Aggregations:</span>
                <span class="value">${Object.keys(config.aggregations).length}</span>
              </div>
            ` : ''}
            
            <!-- History -->
            ${config.history?.preload ? html`
              <div class="info-row">
                <span class="label">History:</span>
                <span class="value">
                  ${config.history.hours || 0}h, ${config.history.days || 0}d
                </span>
              </div>
            ` : ''}
            
            <!-- Phase 2: Edit and Remove Actions -->
            <div class="action-buttons">
              <mwc-button
                outlined
                @click=${() => this._handleEdit(name, config)}>
                Edit
              </mwc-button>
              <mwc-button
                outlined
                style="color: var(--error-color)"
                @click=${() => this._handleDelete(name)}>
                Remove
              </mwc-button>
            </div>
          </div>
        ` : ''}
      </lcards-form-section>
    `;
  }
  
  _toggleExpanded(name, event) {
    if (event.detail.expanded) {
      this._expandedSources.add(name);
    } else {
      this._expandedSources.delete(name);
    }
    this.requestUpdate();
  }

  _handleEdit(name, config) {
    this.dispatchEvent(new CustomEvent('edit-datasource', {
      detail: { name, config },
      bubbles: true,
      composed: true
    }));
  }

  _handleDelete(name) {
    this.dispatchEvent(new CustomEvent('delete-datasource', {
      detail: { name },
      bubbles: true,
      composed: true
    }));
  }
}

customElements.define('lcards-card-datasources-list', LCARdSCardDataSourcesList);
