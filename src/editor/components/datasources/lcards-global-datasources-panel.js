/**
 * Global Datasources Panel
 * 
 * Read-only display of all datasources in the DataSourceManager singleton.
 * Shows: which cards use each source, auto-created vs configured, live stats.
 * 
 * Similar to Rules Dashboard pattern. 
 * 
 * @element lcards-global-datasources-panel
 * @property {Object} hass - Home Assistant instance
 */

import { LitElement, html, css } from 'lit';
import '../common/lcards-message.js';

export class LCARdSGlobalDataSourcesPanel extends LitElement {
  static get properties() {
    return {
      hass: { type: Object },
      _stats: { type: Object, state: true }
    };
  }
  
  constructor() {
    super();
    this._stats = null;
    this._refreshInterval = null;
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

      .info-header {
        margin-bottom: 16px;
      }

      .sources-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
        gap: 16px;
      }

      .source-card {
        background: var(--card-background-color, #fff);
        border: 2px solid var(--divider-color, #e0e0e0);
        border-radius: 12px;
        padding: 16px;
        transition: all 0.2s;
      }

      .source-card:hover {
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      }

      .source-card.auto-created {
        border-left: 4px solid var(--warning-color, #ff9800);
        background: rgba(255, 152, 0, 0.05);
      }

      .source-card.configured {
        border-left: 4px solid var(--success-color, #4caf50);
      }

      .source-header {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 12px;
        padding-bottom: 8px;
        border-bottom: 1px solid var(--divider-color, #e0e0e0);
      }

      .source-header ha-icon {
        --mdc-icon-size: 20px;
        color: var(--primary-color, #03a9f4);
      }

      .source-name {
        font-weight: 600;
        font-size: 16px;
        flex: 1;
      }

      .badge {
        padding: 2px 8px;
        border-radius: 4px;
        font-size: 10px;
        font-weight: 600;
        text-transform: uppercase;
      }

      .badge.auto-created {
        background: var(--warning-color, #ff9800);
        color: white;
      }

      .source-details {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }

      .detail-row {
        display: flex;
        justify-content: space-between;
        font-size: 14px;
      }

      .detail-row .label {
        color: var(--secondary-text-color, #727272);
      }

      .detail-row .value {
        color: var(--primary-text-color, #212121);
        font-weight: 500;
      }

      .card-list {
        display: flex;
        flex-wrap: wrap;
        gap: 4px;
        margin-top: 4px;
      }

      .card-chip {
        background: var(--primary-color, #03a9f4);
        color: white;
        padding: 2px 8px;
        border-radius: 12px;
        font-size: 11px;
        font-weight: 500;
      }
    `;
  }
  
  connectedCallback() {
    super.connectedCallback();
    this._refreshStats();
    // Auto-refresh every 5 seconds
    this._refreshInterval = setInterval(() => this._refreshStats(), 5000);
  }
  
  disconnectedCallback() {
    if (this._refreshInterval) {
      clearInterval(this._refreshInterval);
    }
    super.disconnectedCallback();
  }
  
  _refreshStats() {
    const dsManager = window.lcards?.core?.dataSourceManager;
    if (!dsManager) {
      this._stats = null;
      return;
    }
    
    try {
      this._stats = dsManager.getStats();
      this.requestUpdate();
    } catch (error) {
      console.error('[GlobalDataSourcesPanel] Error fetching stats:', error);
    }
  }
  
  render() {
    if (!this._stats) {
      return html`
        <lcards-message
          type="warning"
          message="DataSourceManager not available. Datasources only work with cards that initialize the singleton.">
        </lcards-message>
      `;
    }
    
    const sources = Object.entries(this._stats.sources || {});
    
    if (sources.length === 0) {
      return html`
        <div class="empty-state">
          <ha-icon icon="mdi:database-off"></ha-icon>
          <p>No global datasources registered.</p>
          <p class="helper-text">
            Datasources appear here when cards create them.
          </p>
        </div>
      `;
    }
    
    return html`
      <div class="info-header">
        <lcards-message
          type="info"
          message="These datasources exist across ALL cards in this dashboard. They are managed by the global DataSourceManager singleton.">
        </lcards-message>
      </div>
      
      <div class="sources-grid">
        ${sources.map(([name, stats]) => this._renderGlobalSource(name, stats))}
      </div>
    `;
  }
  
  _renderGlobalSource(name, stats) {
    const isAutoCreated = stats.autoCreated || false;
    const usedByCards = stats.usedByCards || [];
    const cardCount = usedByCards.length;
    
    return html`
      <div class="source-card ${isAutoCreated ? 'auto-created' : 'configured'}">
        <div class="source-header">
          <ha-icon icon="${isAutoCreated ? 'mdi:reload-alert' : 'mdi:cog'}"></ha-icon>
          <span class="source-name">${name}</span>
          ${isAutoCreated ? html`
            <span class="badge auto-created">AUTO-CREATED</span>
          ` : ''}
        </div>
        
        <div class="source-details">
          <div class="detail-row">
            <span class="label">Used by:</span>
            <span class="value">${cardCount} card${cardCount !== 1 ? 's' : ''}</span>
          </div>
          
          ${usedByCards.length > 0 ? html`
            <div class="card-list">
              ${usedByCards.map(cardId => html`
                <span class="card-chip">${cardId}</span>
              `)}
            </div>
          ` : ''}
          
          ${stats.sourceCard ? html`
            <div class="detail-row">
              <span class="label">Source card:</span>
              <span class="value">${stats.sourceCard}</span>
            </div>
          ` : ''}
          
          ${stats.buffer?.size ? html`
            <div class="detail-row">
              <span class="label">Buffer:</span>
              <span class="value">${stats.buffer.size} points</span>
            </div>
          ` : ''}
          
          ${stats.lastUpdate ? html`
            <div class="detail-row">
              <span class="label">Last update:</span>
              <span class="value">${this._formatTimestamp(stats.lastUpdate)}</span>
            </div>
          ` : ''}
        </div>
      </div>
    `;
  }
  
  _formatTimestamp(timestamp) {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h ago`;
  }
}

customElements.define('lcards-global-datasources-panel', LCARdSGlobalDataSourcesPanel);
