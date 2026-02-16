/**
 * LCARdS Collapsible Section Component
 *
 * A reusable collapsible section component with consistent styling across the editor.
 * Features:
 * - Left-justified title
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

      // Count to display in the chip
      count: { type: Number },

      // Total count (optional - if provided, shows count/total format)
      totalCount: { type: Number, attribute: 'total-count' },

      // Whether section is expanded
      expanded: { type: Boolean },

      // Optional custom label for count (default: "items")
      countLabel: { type: String, attribute: 'count-label' }
    };
  }

  constructor() {
    super();
    this.title = '';
    this.count = 0;
    this.totalCount = null; // null means don't show total
    this.expanded = false;
    this.countLabel = 'items';
  }

  static get styles() {
    return css`
      :host {
        display: block;
      }

      .section-wrapper {
        margin-bottom: 12px;
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

      .header-right {
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .actions-slot {
        display: flex;
        align-items: center;
        gap: 4px;
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
          </div>
          <div class="header-right">
            <div class="actions-slot" @click=${(e) => e.stopPropagation()}>
              <slot name="actions"></slot>
            </div>
            <ha-assist-chip
              .label=${this.totalCount !== null ? `${this.count} / ${this.totalCount}` : `${this.count} ${this.countLabel}`}
              .filled=${true}
              style="
                --ha-assist-chip-filled-container-color: ${this.totalCount !== null ? (this.count === this.totalCount ? 'var(--success-color)' : 'var(--warning-color)') : 'var(--primary-color)'};
                --md-assist-chip-label-text-color: white;
                --md-sys-color-on-surface: white;
              "
            >
            </ha-assist-chip>
          </div>
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
