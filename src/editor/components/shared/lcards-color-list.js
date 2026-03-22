/**
 * @fileoverview Multi-color array editor using collapsible sections.
 *
 * Features:
 * - Manages array of colors with collapsible sections (like series/filter editors)
 * - Each color is a collapsible item with header showing preview
 * - Add/remove colors with proper buttons
 * - Reorder with arrow buttons (up/down)
 * - CSS variable dropdown + custom input + preview for each color
 * - Replaces old lcards-color-array (RGB-only) component
 * - Pattern: lcards-chart-series-list-editor.js, lcards-filter-editor.js
 */

import { LitElement, html, css } from 'lit';
import './lcards-color-picker.js';
import { ColorUtils } from '../../../core/themes/ColorUtils.js';

export class LCARdSColorList extends LitElement {
  static get properties() {
    return {
      hass: { type: Object },
      colors: { type: Array }, // Array of color strings
      label: { type: String },
      description: { type: String },
      disabled: { type: Boolean },
      _expandedItems: { type: Object, state: true }
    };
  }

  constructor() {
    super();
        /** @type {any} */
        this.hass = undefined;
    this.colors = [];
    this.label = 'Colours';
    this.description = '';
    this.disabled = false;
    this._expandedItems = {}; // Track which items are expanded
  }

  static get styles() {
    return css`
      :host {
        display: block;
      }

      .add-button {
        width: 100%;
        margin-bottom: 12px;
      }

      .color-list {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }

      .color-item {
        background: var(--secondary-background-color);
        border: 1px solid var(--divider-color);
        border-radius: var(--ha-card-border-radius, 12px);
        overflow: hidden;
        transition: all 0.2s ease;
      }

      .color-item:hover {
        border-color: var(--primary-color);
      }

      .color-header {
        display: flex;
        align-items: center;
        padding: 12px;
        cursor: pointer;
        background: var(--card-background-color);
        gap: 12px;
        user-select: none;
      }

      .color-header:hover {
        background: var(--primary-background-color);
      }

      .color-index {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 32px;
        height: 32px;
        border-radius: 50%;
        background: var(--primary-color);
        color: var(--text-primary-color);
        font-weight: 500;
        font-size: 14px;
        flex-shrink: 0;
      }

      .color-preview {
        width: 40px;
        height: 32px;
        border-radius: 6px;
        border: 2px solid var(--divider-color);
        flex-shrink: 0;
        background-image:
          linear-gradient(45deg, #ccc 25%, transparent 25%),
          linear-gradient(-45deg, #ccc 25%, transparent 25%),
          linear-gradient(45deg, transparent 75%, #ccc 75%),
          linear-gradient(-45deg, transparent 75%, #ccc 75%);
        background-size: 8px 8px;
        background-position: 0 0, 0 4px, 4px -4px, -4px 0px;
        background-color: white;
      }

      .color-preview-fill {
        width: 100%;
        height: 100%;
        border-radius: 4px;
      }

      .color-info {
        flex: 1;
        min-width: 0;
        display: flex;
        flex-direction: column;
        gap: 4px;
      }

      .color-value {
        font-weight: 500;
        font-size: 14px;
        color: var(--primary-text-color);
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .color-description {
        font-size: 12px;
        color: var(--secondary-text-color);
      }

      .color-actions {
        display: flex;
        gap: 4px;
        flex-shrink: 0;
      }

      .expand-icon {
        transition: transform 0.2s ease;
        flex-shrink: 0;
        color: var(--secondary-text-color);
      }

      .expand-icon.expanded {
        transform: rotate(180deg);
      }

      .color-content {
        padding: 16px;
        background: var(--primary-background-color);
        border-top: 1px solid var(--divider-color);
      }

      .empty-state {
        text-align: center;
        padding: 24px;
        color: var(--secondary-text-color);
        font-size: 14px;
        background: var(--card-background-color);
        border: 2px dashed var(--divider-color);
        border-radius: var(--ha-card-border-radius, 12px);
      }

      ha-icon-button {
        --mdc-icon-button-size: 36px;
        --mdc-icon-size: 20px;
      }

      ha-button {
        --mdc-theme-primary: var(--primary-color);
      }
    `;
  }

  render() {
    // Ensure colors is always an array
    const colors = Array.isArray(this.colors) ? this.colors : [];
    const colorCount = colors.length;

    return html`
      <ha-button class="add-button" @click=${this._addColor} ?disabled=${this.disabled}>
        <ha-icon icon="mdi:plus" slot="start"></ha-icon>
        Add Color
      </ha-button>

      ${colorCount === 0 ? html`
        <div class="empty-state">
          No colors configured. Click "Add Color" to begin.
        </div>
      ` : html`
        <div class="color-list">
          ${colors.map((color, index) => this._renderColorItem(color, index))}
        </div>
      `}
    `;
  }

  _renderColorItem(color, index) {
    const colors = Array.isArray(this.colors) ? this.colors : [];
    const totalCount = colors.length;
    const isExpanded = this._expandedItems[index] || false;
    const displayValue = color || 'Not set';
    const truncatedValue = displayValue.length > 35 ? displayValue.substring(0, 35) + '...' : displayValue;

    return html`
      <div class="color-item">
        <!-- Collapsible Header -->
        <div class="color-header" @click=${() => this._toggleExpanded(index)}>
          <!-- Index Badge -->
          <div class="color-index">${index + 1}</div>

          <!-- Color Preview -->
          <div class="color-preview">
            <div class="color-preview-fill" style="background-color: ${this._resolveColorForPreview(color)};"></div>
          </div>

          <!-- Color Info -->
          <div class="color-info">
            <div class="color-value">${truncatedValue}</div>
            <div class="color-description">Click to ${isExpanded ? 'collapse' : 'expand and edit'}</div>
          </div>

          <!-- Actions -->
          <div class="color-actions">
            <ha-icon-button
              @click=${(e) => this._moveColor(index, -1, e)}
              .label=${'Move Up'}
              .disabled=${index === 0 || this.disabled}>
              <ha-icon icon="mdi:arrow-up"></ha-icon>
            </ha-icon-button>
            <ha-icon-button
              @click=${(e) => this._moveColor(index, 1, e)}
              .label=${'Move Down'}
              .disabled=${index === totalCount - 1 || this.disabled}>
              <ha-icon icon="mdi:arrow-down"></ha-icon>
            </ha-icon-button>
            <ha-icon-button
              @click=${(e) => this._removeColor(index, e)}
              .label=${'Delete'}
              .disabled=${this.disabled}>
              <ha-icon icon="mdi:delete"></ha-icon>
            </ha-icon-button>
          </div>

          <!-- Expand Icon -->
          <ha-icon
            class="expand-icon ${isExpanded ? 'expanded' : ''}"
            icon="mdi:chevron-down">
          </ha-icon>
        </div>

        <!-- Expandable Content -->
        ${isExpanded ? html`
          <div class="color-content">
            <lcards-color-picker
              // @ts-ignore - TS2339: auto-suppressed
              .hass=${this.hass}
              .value=${color}
              .disabled=${this.disabled}
              @value-changed=${(e) => this._updateColor(index, e.detail.value)}>
            </lcards-color-picker>
          </div>
        ` : ''}
      </div>
    `;
  }

  _toggleExpanded(index) {
    this._expandedItems = {
      ...this._expandedItems,
      [index]: !this._expandedItems[index]
    };
  }

  /**
   * Resolve color for preview (handles computed tokens)
   * @param {string} color - Color value
   * @returns {string} Resolved color for display
   * @private
   */
  _resolveColorForPreview(color) {
    if (!color) return 'transparent';

    // Check if it's a computed token
    const validFunctions = ['lighten', 'darken', 'alpha', 'saturate', 'desaturate', 'mix'];
    const isComputedToken = validFunctions.some(fn => color.startsWith(`${fn}(`));

    if (isComputedToken) {
      // Try to resolve using a simple parser and ColorUtils
      try {
        const match = color.match(/^(\w+)\((.+)\)$/);
        if (match) {
          const [, funcName, argsStr] = match;
          const args = this._splitArguments(argsStr);

          if (args.length >= 2) {
            const baseColor = this._resolveColorForPreview(args[0].trim());
            const amount = parseFloat(args[1]);

            switch (funcName) {
              case 'lighten': return ColorUtils.lighten(baseColor, amount);
              case 'darken': return ColorUtils.darken(baseColor, amount);
              case 'alpha': return ColorUtils.alpha(baseColor, amount);
              case 'saturate': return ColorUtils.saturate(baseColor, amount);
              case 'desaturate': return ColorUtils.desaturate(baseColor, amount);
              case 'mix':
                if (args.length === 3) {
                  const color2 = this._resolveColorForPreview(args[1].trim());
                  const ratio = parseFloat(args[2]);
                  return ColorUtils.mix(baseColor, color2, ratio);
                }
            }
          }
        }
      } catch (error) {
        console.warn('[ColorList] Failed to resolve computed color:', error);
      }
    }

    // Handle CSS variables via DOM
    if (color.includes('var(')) {
      try {
        const temp = document.createElement('div');
        temp.style.color = color;
        document.body.appendChild(temp);
        const computed = getComputedStyle(temp).color;
        document.body.removeChild(temp);
        return computed;
      } catch (err) {
        return color;
      }
    }

    return color;
  }

  /**
   * Split function arguments handling nested parentheses
   * @param {string} argsStr - Arguments string
   * @returns {Array<string>} Array of arguments
   * @private
   */
  _splitArguments(argsStr) {
    const args = [];
    let current = '';
    let depth = 0;

    for (const char of argsStr) {
      if (char === '(') {
        depth++;
        current += char;
      } else if (char === ')') {
        depth--;
        current += char;
      } else if (char === ',' && depth === 0) {
        args.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }

    if (current) {
      args.push(current.trim());
    }

    return args;
  }

  _addColor() {
    if (this.disabled) return;

    const colors = Array.isArray(this.colors) ? [...this.colors] : [];
    colors.push('var(--lcars-blue)'); // Default color
    this._expandedItems = {
      ...this._expandedItems,
      [colors.length - 1]: true // Auto-expand new color
    };
    this._emitChange(colors);
  }

  _removeColor(index, e) {
    if (this.disabled) return;
    e?.stopPropagation(); // Prevent header click

    const colors = Array.isArray(this.colors) ? [...this.colors] : [];
    colors.splice(index, 1);

    // Remove from expanded tracking
    const newExpanded = { ...this._expandedItems };
    delete newExpanded[index];
    // Adjust indices for items after deleted one
    const adjustedExpanded = {};
    Object.keys(newExpanded).forEach(key => {
      const idx = parseInt(key);
      if (idx < index) {
        adjustedExpanded[idx] = newExpanded[idx];
      } else if (idx > index) {
        adjustedExpanded[idx - 1] = newExpanded[idx];
      }
    });
    this._expandedItems = adjustedExpanded;

    this._emitChange(colors);
  }

  _updateColor(index, value) {
    if (this.disabled) return;

    const colors = Array.isArray(this.colors) ? [...this.colors] : [];
    colors[index] = value;
    this._emitChange(colors);
  }

  _moveColor(index, direction, e) {
    if (this.disabled) return;
    e?.stopPropagation(); // Prevent header click

    const colors = Array.isArray(this.colors) ? [...this.colors] : [];
    const newIndex = index + direction;

    // Validate bounds
    if (newIndex < 0 || newIndex >= colors.length) return;

    // Swap colors
    [colors[index], colors[newIndex]] = [colors[newIndex], colors[index]];

    // Swap expanded states too
    const newExpanded = { ...this._expandedItems };
    const temp = newExpanded[index];
    newExpanded[index] = newExpanded[newIndex];
    newExpanded[newIndex] = temp;
    this._expandedItems = newExpanded;

    this._emitChange(colors);
  }

  _emitChange(colors) {
    console.log('[lcards-color-list] Emitting colors-changed:', colors);
    this.dispatchEvent(
      new CustomEvent('colors-changed', {
        detail: { colors },
        bubbles: true,
        composed: true
      })
    );
  }
}

customElements.define('lcards-color-list', LCARdSColorList);
