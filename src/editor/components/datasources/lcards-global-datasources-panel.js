/**
 * @fileoverview Global Datasources Panel
 *
 * Read-only display of all datasources in the DataSourceManager singleton.
 * Shows: which cards use each source, auto-created vs configured, live stats.
 *
 *
 * @element lcards-global-datasources-panel
 * @property {Object} hass - Home Assistant instance
 */

import { LitElement, html, css } from 'lit';
import { lcardsLog } from '../../../utils/lcards-logging.js';
import '../shared/lcards-message.js';
import '../shared/lcards-form-section.js';
import { messageStyles } from '../../base/surface-styles.js';
import { datasourceItemStyles } from './datasource-item-styles.js';

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
    return [messageStyles, datasourceItemStyles, css`
      :host {
        display: block;
      }

      .intro {
        margin: var(--ha-space-3) 0;
      }
    `];
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
      lcardsLog.error('❌ [GlobalDataSourcesPanel] Error fetching stats:', error);
    }
  }

  render() {
    if (!this._stats) {
      return html`
        <lcards-message type="warning"
          message="The data source manager isn't running yet: it starts with the first LCARdS card on the page.">
        </lcards-message>
      `;
    }

    const sources = Object.entries(this._stats.sources || {});
    if (sources.length === 0) {
      return html`
        <div class="empty-state">
          <ha-icon icon="mdi:database-off-outline"></ha-icon>
          <p>No data sources are running on this page.</p>
          <p class="hint">They appear here when cards create them.</p>
        </div>
      `;
    }

    return html`
      <p class="hint intro">Every data source running on this page, shared by all its cards. Read-only; updates every few seconds.</p>
      <div class="datasources-list">
        ${sources.map(([name, stats]) => this._renderGlobalSource(name, stats))}
      </div>
    `;
  }

  _renderGlobalSource(name, stats) {
    const isAutoCreated = stats.autoCreated || false;
    const usedByCards = stats.usedByCards || [];
    const bufferSize = stats.buffer?.size || 0;
    const processorCount = stats.processors?.size || 0;

    return html`
      <lcards-form-section
        header=${name}
        secondary=${stats.config?.entity || '-'}
        icon=${isAutoCreated ? 'mdi:auto-fix' : 'mdi:database'}
        ?outlined=${true}
        headerLevel="4">
        <div class="datasource-details">
          <div class="info-row">
            <span class="label">Created</span>
            <span class="chips"><span class="chip ${isAutoCreated ? 'auto' : ''}">${isAutoCreated ? 'automatically (from a template or chart)' : 'from a card config'}</span></span>
          </div>
          <div class="info-row">
            <span class="label">Entity</span>
            <span class="value">${stats.config?.entity || '-'}</span>
          </div>
          <div class="info-row">
            <span class="label">Window</span>
            <span class="value">${stats.config?.windowSeconds || 60}s</span>
          </div>
          ${processorCount > 0 ? html`
            <div class="info-row">
              <span class="label">Processors</span>
              <span class="value">${processorCount}</span>
            </div>
          ` : ''}
          <div class="info-row">
            <span class="label">Buffer</span>
            <span class="value">${bufferSize} points</span>
          </div>
          <div class="info-row">
            <span class="label">Used by</span>
            ${usedByCards.length
              ? html`<span class="chips">${usedByCards.map(cardId => html`<span class="chip">${cardId}</span>`)}</span>`
              : html`<span class="value">no cards</span>`}
          </div>
          ${stats.sourceCard ? html`
            <div class="info-row">
              <span class="label">Defined in</span>
              <span class="value">${stats.sourceCard}</span>
            </div>
          ` : ''}
          ${stats.lastUpdate ? html`
            <div class="info-row">
              <span class="label">Last update</span>
              <span class="value">${this._formatTimestamp(stats.lastUpdate)}</span>
            </div>
          ` : ''}
        </div>
      </lcards-form-section>
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

if (!customElements.get('lcards-global-datasources-panel')) customElements.define('lcards-global-datasources-panel', LCARdSGlobalDataSourcesPanel);
