/**
 * LCARdS Collapsible Section Component
 *
 * A reusable collapsible section component with consistent styling across the editor.
 * Features:
 * - Left-justified title with optional badge
 * - Right-justified count chip
 * - Animated triangle indicator
 * - Hover effects
 */

import { LitElement, html, css } from 'lit';

export class LCARdSCollapsibleSection extends LitElement {
  static get properties() {
    return {
      // Section title text
      title: { type: String },

      // Optional badge text (e.g., "theme", "user", "defaults")
      badge: { type: String },

      // Badge type for color styling (matches badge text typically)
      badgeType: { type: String, attribute: 'badge-type' },

      // Count to display in the chip
      count: { type: Number },

      // Whether section is expanded
      expanded: { type: Boolean },

      // Optional custom label for count (default: "items")
      countLabel: { type: String, attribute: 'count-label' }
    };
  }

  constructor() {
    super();
    this.title = '';
    this.badge = '';
    this.badgeType = '';
    this.count = 0;
    this.expanded = false;
    this.countLabel = 'items';
  }

  static get styles() {
    return css`
      :host {
        display: block;
      }

      .section-wrapper {
        margin-bottom: 16px;
        border: 1px solid var(--divider-color);
        border-radius: 8px;
        overflow: hidden;
        background: var(--card-background-color);
      }

      .section-header {
        position: sticky;
        top: 0;
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 12px 24px;
        background: var(--secondary-background-color);
        border-bottom: 2px solid var(--divider-color);
        z-index: 1;
        cursor: pointer;
        user-select: none;
        transition: all 0.2s;
      }

      .section-header:hover {
        background: var(--divider-color);
        border-bottom-color: var(--primary-color);
      }

      .section-header::before {
        content: '▶';
        margin-right: 8px;
        font-size: 10px;
        color: var(--primary-color);
        transition: transform 0.2s;
      }

      :host([expanded]) .section-header::before {
        transform: rotate(90deg);
      }

      .header-left {
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .section-title {
        font-size: 14px;
        font-weight: 600;
        color: var(--primary-text-color);
      }

      .section-badge {
        padding: 4px 10px;
        border-radius: 12px;
        font-size: 11px;
        font-weight: 500;
        text-transform: uppercase;
      }

      /* Badge color variants */
      .section-badge.defaults {
        background: #9e9e9e22;
        color: #9e9e9e;
      }

      .section-badge.theme {
        background: #2196f322;
        color: #2196f3;
      }

      .section-badge.user {
        background: #4caf5022;
        color: #4caf50;
      }

      .section-badge.presets {
        background: #ff980022;
        color: #ff9800;
      }

      .section-badge.rules {
        background: #f4433622;
        color: #f44336;
      }

      .section-badge.templates {
        background: #9c27b022;
        color: #9c27b0;
      }

      .section-badge.unknown {
        background: #60606022;
        color: #606060;
      }

      .section-count {
        font-size: 12px;
        color: var(--primary-text-color);
        background: var(--secondary-background-color);
        border: 1px solid var(--primary-color);
        padding: 2px 8px;
        border-radius: 12px;
        font-weight: 500;
        opacity: 0.9;
      }

      .section-content {
        display: none;
        border-top: 1px solid var(--divider-color);
      }

      :host([expanded]) .section-content {
        display: block;
      }
    `;
  }

  render() {
    return html`
      <div class="section-wrapper">
        <div class="section-header" @click=${this._toggleExpanded}>
          <div class="header-left">
            <span class="section-title">${this.title}</span>
            ${this.badge ? html`
              <span class="section-badge ${this.badgeType || this.badge}">${this.badge}</span>
            ` : ''}
          </div>
          <span class="section-count">${this.count} ${this.countLabel}</span>
        </div>
        <div class="section-content">
          <slot></slot>
        </div>
      </div>
    `;
  }

  _toggleExpanded() {
    this.expanded = !this.expanded;
    this.dispatchEvent(new CustomEvent('toggle', {
      detail: { expanded: this.expanded },
      bubbles: true,
      composed: true
    }));
  }
}

customElements.define('lcards-collapsible-section', LCARdSCollapsibleSection);
