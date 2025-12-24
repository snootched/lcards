/**
 * LCARdS Collapsible Section Component
 *
 * A reusable collapsible section component with consistent styling across the editor.
 * Features:
 * - Left-justified title with optional badge
 * - Right-justified count chip
 * - Animated chevron indicator (always visible)
 * - Smooth expand/collapse transitions
 * - Enhanced hover effects with shadow and border highlighting
 * - Dashed border when collapsed for visual distinction
 * - Keyboard accessibility (Enter/Space to toggle)
 * - Sticky header positioning
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
        transition: border 0.2s ease;
      }

      /* Dashed border when collapsed */
      :host(:not([expanded])) .section-wrapper {
        border: 2px dashed var(--divider-color);
      }

      .section-header {
        position: sticky;
        top: 0;
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 12px 16px;
        background: var(--secondary-background-color);
        border: 1px solid var(--divider-color);
        border-radius: 8px;
        z-index: 1;
        cursor: pointer;
        user-select: none;
        transition: all 0.2s ease;
      }

      .section-header:hover {
        background: var(--divider-color);
        border-color: var(--primary-color);
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      }

      .section-header:focus-visible {
        outline: 2px solid var(--primary-color);
        outline-offset: 2px;
      }

      .header-left {
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .section-chevron {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 18px;
        height: 18px;
        font-size: 18px;
        color: var(--primary-color);
        transition: transform 0.2s ease;
        flex-shrink: 0;
      }

      :host([expanded]) .section-chevron {
        transform: rotate(90deg);
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
        max-height: 0;
        overflow: hidden;
        opacity: 0;
        transition: max-height 0.3s ease, opacity 0.2s ease;
        border-top: 1px solid transparent;
      }

      :host([expanded]) .section-content {
        max-height: 100000px; /* Large enough for any content */
        opacity: 1;
        border-top-color: var(--divider-color);
      }
    `;
  }

  render() {
    return html`
      <div class="section-wrapper">
        <div 
          class="section-header" 
          @click=${this._toggleExpanded}
          @keydown=${this._handleKeyDown}
          tabindex="0"
          role="button"
          aria-expanded=${this.expanded}
          aria-controls="section-content">
          <div class="header-left">
            <span class="section-chevron" aria-hidden="true">▶</span>
            <span class="section-title">${this.title}</span>
            ${this.badge ? html`
              <span class="section-badge ${this.badgeType || this.badge}">${this.badge}</span>
            ` : ''}
          </div>
          <span class="section-count">${this.count} ${this.countLabel}</span>
        </div>
        <div class="section-content" id="section-content" role="region">
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

  _handleKeyDown(e) {
    // Allow keyboard activation with Enter or Space
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      this._toggleExpanded();
    }
  }
}

customElements.define('lcards-collapsible-section', LCARdSCollapsibleSection);
