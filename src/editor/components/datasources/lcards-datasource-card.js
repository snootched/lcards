/**
 * @fileoverview LCARdS DataSource Card
 *
 * Reusable component for displaying DataSource information in browse lists.
 * Shows name, entity, current value, history count, and last update time.
 *
 * @element lcards-datasource-card
 * @fires click - When card is clicked (bubbles up for parent to handle selection)
 *
 * @property {Object} dataSource - DataSource info object
 * @property {Boolean} selected - Whether this card is selected
 */

import { LitElement, html, css } from 'lit';
import { lcardsLog } from '../../../utils/lcards-logging.js';

export class LCARdSDataSourceCard extends LitElement {
  static get properties() {
    return {
      dataSource: { type: Object },
      selected: { type: Boolean }
    };
  }

  constructor() {
    super();
    this.dataSource = null;
    this.selected = false;
  }

  static get styles() {
    return css`
      :host {
        display: block;
      }

      .datasource-card {
        border: 2px solid var(--divider-color, #e0e0e0);
        border-radius: 8px;
        padding: 12px;
        cursor: pointer;
        transition: all 0.2s ease;
        background: var(--card-background-color, white);
      }

      .datasource-card:hover {
        border-color: var(--primary-color);
        background: var(--secondary-background-color, #fafafa);
        transform: translateY(-1px);
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      }

      .datasource-card.selected {
        border-color: var(--primary-color);
        background: var(--primary-color);
        color: var(--text-primary-color, white);
      }

      .datasource-card.selected .entity-id,
      .datasource-card.selected .label {
        opacity: 0.9;
      }

      .header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 8px;
        gap: 8px;
      }

      .name {
        font-weight: 700;
        font-size: 16px;
        word-break: break-word;
        flex: 1;
      }

      .entity-id {
        font-size: 12px;
        opacity: 0.7;
        font-family: 'Courier New', monospace;
        word-break: break-all;
      }

      .info {
        display: flex;
        flex-direction: column;
        gap: 4px;
        margin-top: 8px;
      }

      .info-item {
        display: flex;
        justify-content: space-between;
        font-size: 14px;
        gap: 8px;
      }

      .label {
        opacity: 0.7;
        font-weight: 500;
      }

      .value {
        font-weight: 600;
        text-align: right;
        word-break: break-word;
      }

      .icon {
        font-size: 20px;
        margin-right: 4px;
      }
    `;
  }

  render() {
    if (!this.dataSource) {
      return html``;
    }

    const ds = this.dataSource;

    return html`
      <div
        class="datasource-card ${this.selected ? 'selected' : ''}"
        @click=${this._handleClick}>

        <div class="header">
          <span class="icon">📊</span>
          <span class="name">${ds.name || ds.id || 'Unnamed DataSource'}</span>
        </div>

        ${ds.entity ? html`
          <div class="entity-id" title="${ds.entity}">${ds.entity}</div>
        ` : html`
          <div class="entity-id">No entity</div>
        `}

        <div class="info">
          <div class="info-item">
            <span class="label">Current Value:</span>
            <span class="value">${this._formatValue(ds.currentValue)}</span>
          </div>

          <div class="info-item">
            <span class="label">History:</span>
            <span class="value">${ds.historyCount || 0} point${ds.historyCount === 1 ? '' : 's'}</span>
          </div>

          ${ds.lastUpdate ? html`
            <div class="info-item">
              <span class="label">Last Update:</span>
              <span class="value">${this._formatTime(ds.lastUpdate)}</span>
            </div>
          ` : ''}
        </div>
      </div>
    `;
  }

  /**
   * Format value for display
   * @private
   */
  _formatValue(value) {
    if (value === null || value === undefined) {
      return 'N/A';
    }
    if (typeof value === 'object') {
      return JSON.stringify(value);
    }
    return String(value);
  }

  /**
   * Format timestamp for display
   * @private
   */
  _formatTime(timestamp) {
    if (!timestamp) return 'N/A';

    try {
      const date = new Date(timestamp);
      if (isNaN(date.getTime())) {
        return 'Invalid date';
      }

      const now = new Date();
      // @ts-ignore - TS2362: auto-suppressed
      // @ts-ignore - TS2363: auto-suppressed
      const diffMs = now - date;
      const diffSec = Math.floor(diffMs / 1000);
      const diffMin = Math.floor(diffSec / 60);
      const diffHr = Math.floor(diffMin / 60);

      // Show relative time for recent updates
      if (diffSec < 60) {
        return `${diffSec}s ago`;
      } else if (diffMin < 60) {
        return `${diffMin}m ago`;
      } else if (diffHr < 24) {
        return `${diffHr}h ago`;
      } else {
        return date.toLocaleTimeString();
      }
    } catch (error) {
      lcardsLog.warn('[LCARdSDataSourceCard] Error formatting time:', error);
      return 'N/A';
    }
  }

  /**
   * Handle card click - let parent handle selection logic
   * @private
   */
  _handleClick(e) {
    e.stopPropagation();
    this.dispatchEvent(new CustomEvent('datasource-click', {
      detail: { dataSource: this.dataSource },
      bubbles: true,
      composed: true
    }));
  }
}

customElements.define('lcards-datasource-card', LCARdSDataSourceCard);
