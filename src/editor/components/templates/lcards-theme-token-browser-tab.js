/**
 * LCARdS Theme Token Browser Tab
 *
 * Browse and search the full active theme's token tree, cross-reference usage,
 * and enable quick copy/insertion with proper LCARdS token syntax.
 *
 * @element lcards-theme-token-browser-tab
 * @property {Object} editor - Parent card editor instance
 * @property {Object} config - Full card configuration
 * @property {Object} hass - Home Assistant instance
 */

import { LitElement, html, css } from 'lit';
import { lcardsLog } from '../../../utils/lcards-logging.js';
import '../common/lcards-message.js';

export class LCARdSThemeTokenBrowserTab extends LitElement {
  static get properties() {
    return {
      editor: { type: Object },
      config: { type: Object },
      hass: { type: Object },
      _tokens: { type: Array, state: true },
      _filteredTokens: { type: Array, state: true },
      _searchQuery: { type: String, state: true },
      _selectedCategory: { type: String, state: true },
      _isLoading: { type: Boolean, state: true },
      _activeTheme: { type: Object, state: true }
    };
  }

  constructor() {
    super();
    this._tokens = [];
    this._filteredTokens = [];
    this._searchQuery = '';
    this._selectedCategory = 'all';
    this._isLoading = false;
    this._activeTheme = null;
  }

  static get styles() {
    return css`
      :host {
        display: block;
        padding: 16px;
      }

      .theme-info {
        background: var(--secondary-background-color, #f5f5f5);
        border: 1px solid var(--divider-color, #e0e0e0);
        border-radius: 8px;
        padding: 16px;
        margin-bottom: 16px;
        display: flex;
        justify-content: space-between;
        align-items: center;
      }

      .theme-name {
        font-size: 18px;
        font-weight: 500;
        color: var(--primary-text-color);
      }

      .theme-description {
        font-size: 14px;
        color: var(--secondary-text-color);
        margin-top: 4px;
      }

      .syntax-reminder {
        background: var(--info-color, #2196f3);
        color: white;
        padding: 8px 12px;
        border-radius: 4px;
        font-size: 13px;
        font-family: 'Courier New', monospace;
      }

      .controls {
        display: flex;
        gap: 12px;
        margin-bottom: 16px;
        flex-wrap: wrap;
      }

      .search-box {
        flex: 1;
        min-width: 200px;
      }

      .category-filter {
        display: flex;
        gap: 8px;
        flex-wrap: wrap;
        margin-bottom: 16px;
      }

      .filter-chip {
        padding: 6px 16px;
        border-radius: 16px;
        border: 1px solid var(--divider-color);
        background: var(--card-background-color);
        color: var(--primary-text-color);
        cursor: pointer;
        font-size: 14px;
        font-family: var(--mdc-typography-body1-font-family, var(--mdc-typography-font-family, Roboto, sans-serif));
        transition: all 0.2s;
      }

      .filter-chip:hover {
        background: var(--secondary-background-color);
      }

      .filter-chip.selected {
        background: rgba(var(--rgb-primary-color), 0.15);
        border-color: var(--primary-color);
        color: var(--primary-color);
      }

      .tokens-grid {
        display: grid;
        gap: 16px;
        grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      }

      .token-card {
        background: var(--card-background-color);
        border: 2px solid var(--divider-color);
        border-radius: 12px;
        padding: 16px;
        transition: all 0.2s;
      }

      .token-card:hover {
        box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      }

      /* Color-coded left borders by token category */
      .token-card.category-colors {
        border-left: 4px solid #e91e63;
      }

      .token-card.category-typography {
        border-left: 4px solid #9c27b0;
      }

      .token-card.category-spacing {
        border-left: 4px solid #2196f3;
      }

      .token-card.category-borders {
        border-left: 4px solid #ff9800;
      }

      .token-card.category-effects {
        border-left: 4px solid #00bcd4;
      }

      .token-card.category-animations {
        border-left: 4px solid #4caf50;
      }

      .token-card.category-components {
        border-left: 4px solid #ff5722;
      }

      .token-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: 12px;
      }

      .token-path {
        font-family: 'Courier New', monospace;
        font-size: 12px;
        color: var(--primary-color);
        word-break: break-all;
      }

      .token-category {
        font-size: 10px;
        padding: 3px 6px;
        border-radius: 4px;
        background: var(--secondary-background-color);
        color: var(--secondary-text-color);
        text-transform: uppercase;
        font-weight: 500;
      }

      .token-value {
        margin: 12px 0;
        padding: 12px;
        background: var(--secondary-background-color);
        border-radius: 4px;
        font-family: 'Courier New', monospace;
        font-size: 13px;
        word-break: break-word;
        position: relative;
      }

      .token-preview {
        margin-top: 8px;
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .color-preview {
        width: 40px;
        height: 40px;
        border-radius: 4px;
        border: 2px solid var(--divider-color);
      }

      .font-preview {
        padding: 8px;
        border: 1px solid var(--divider-color);
        border-radius: 4px;
        background: var(--card-background-color);
      }

      .spacing-preview {
        height: 20px;
        background: var(--primary-color);
        border-radius: 2px;
      }

      .token-actions {
        display: flex;
        gap: 8px;
        margin-top: 12px;
      }

      .usage-list {
        margin-top: 8px;
        padding: 8px;
        background: var(--secondary-background-color);
        border-radius: 4px;
        font-size: 12px;
      }

      .usage-item {
        padding: 4px 0;
        color: var(--secondary-text-color);
        font-family: 'Courier New', monospace;
      }

      .empty-state {
        text-align: center;
        padding: 48px 24px;
        color: var(--secondary-text-color);
      }

      .loading-state {
        text-align: center;
        padding: 48px 24px;
      }
    `;
  }

  firstUpdated() {
    this._loadTokens();
  }

  updated(changedProperties) {
    if (changedProperties.has('_selectedCategory')) {
      this._applyFilters();
    }
  }

  render() {
    return html`
      ${this._renderThemeInfo()}
      ${this._renderControls()}
      ${this._renderTokensGrid()}
    `;
  }

  _renderThemeInfo() {
    if (!this._activeTheme) {
      return html`
        <lcards-message
          type="info"
          message="Loading theme information...">
        </lcards-message>
      `;
    }

    return html`
      <div class="theme-info">
        <div>
          <div class="theme-name">${this._activeTheme.name || 'Unknown Theme'}</div>
          <div class="theme-description">
            ${this._tokens.length} tokens available
          </div>
        </div>
        <div class="syntax-reminder">
          Copy format: {theme:token.path}
        </div>
      </div>
    `;
  }

  _renderControls() {
    const categories = this._getCategories();

    const filters = [
      { label: 'All', value: 'all', count: this._tokens.length },
      ...categories.map(cat => ({
        label: cat.label,
        value: cat.key,
        count: cat.count
      }))
    ];

    return html`
      <div class="controls">
        <ha-textfield
          class="search-box"
          .value=${this._searchQuery}
          @input=${this._handleSearchInput}
          placeholder="Search tokens..."
          .label=${'Search'}>
          <ha-icon slot="leadingIcon" icon="mdi:magnify"></ha-icon>
        </ha-textfield>
      </div>

      <div class="category-filter">
        ${filters.map(filter => html`
          <button
            class="filter-chip ${this._selectedCategory === filter.value ? 'selected' : ''}"
            @click=${() => this._selectedCategory = filter.value}>
            ${filter.label} (${filter.count})
          </button>
        `)}
      </div>
    `;
  }

  _renderTokensGrid() {
    if (this._isLoading) {
      return html`
        <div class="loading-state">
          <ha-circular-progress active></ha-circular-progress>
          <p>Loading theme tokens...</p>
        </div>
      `;
    }

    if (this._filteredTokens.length === 0) {
      return html`
        <div class="empty-state">
          <ha-icon icon="mdi:palette"></ha-icon>
          <p>No tokens found</p>
          <p style="font-size: 12px;">
            ${this._searchQuery || this._selectedCategory !== 'all'
              ? 'Try adjusting your filters'
              : 'No theme tokens are available'}
          </p>
        </div>
      `;
    }

    return html`
      <div class="tokens-grid">
        ${this._filteredTokens.map(token => this._renderTokenCard(token))}
      </div>
    `;
  }

  _renderTokenCard(token) {
    const categoryClass = `category-${token.category}`;

    return html`
      <div class="token-card ${categoryClass}">
        <div class="token-header">
          <div class="token-path">{theme:${token.path}}</div>
          <div class="token-category">${token.category}</div>
        </div>

        <div class="token-value">
          ${token.value}
        </div>

        ${this._renderTokenPreview(token)}

        <div class="token-actions">
          <ha-button
            raised
            @click=${(e) => this._copyTokenSyntax(token.path, e)}
            title="Copy token syntax to clipboard">
            <ha-icon icon="mdi:code-braces" slot="icon"></ha-icon>
            Copy Token
          </ha-button>
          <ha-button
            @click=${(e) => this._copyValue(token.value, e)}
            title="Copy resolved value to clipboard">
            <ha-icon icon="mdi:content-copy" slot="icon"></ha-icon>
            Copy Value
          </ha-button>
        </div>

        ${token.usage && token.usage.length > 0 ? html`
          <div class="usage-list">
            <strong>Used in:</strong>
            ${token.usage.map(path => html`
              <div class="usage-item">${path}</div>
            `)}
          </div>
        ` : ''}
      </div>
    `;
  }

  _renderTokenPreview(token) {
    const valueStr = String(token.value);

    // Color preview
    if (token.category === 'colors' || this._isColorValue(valueStr)) {
      return html`
        <div class="token-preview">
          <div class="color-preview" style="background-color: ${valueStr}"></div>
          <span>Color</span>
        </div>
      `;
    }

    // Font preview
    if (token.category === 'typography' && token.path.includes('fontFamily')) {
      return html`
        <div class="token-preview">
          <div class="font-preview" style="font-family: ${valueStr}">
            The quick brown fox
          </div>
        </div>
      `;
    }

    // Spacing preview
    if (token.category === 'spacing' && typeof token.value === 'number') {
      return html`
        <div class="token-preview">
          <div class="spacing-preview" style="width: ${token.value}px"></div>
          <span>${token.value}px</span>
        </div>
      `;
    }

    return null;
  }

  _handleSearchInput(e) {
    this._searchQuery = e.target.value.toLowerCase();
    this._applyFilters();
  }

  _selectCategory(category) {
    this._selectedCategory = category;
    this._applyFilters();
  }

  _applyFilters() {
    let filtered = this._tokens;

    // Apply category filter
    if (this._selectedCategory !== 'all') {
      filtered = filtered.filter(t => t.category === this._selectedCategory);
    }

    // Apply search filter
    if (this._searchQuery) {
      filtered = filtered.filter(t =>
        t.path.toLowerCase().includes(this._searchQuery) ||
        String(t.value).toLowerCase().includes(this._searchQuery)
      );
    }

    this._filteredTokens = filtered;
    this.requestUpdate();
  }

  _getCategories() {
    const categoryCounts = {};
    this._tokens.forEach(token => {
      categoryCounts[token.category] = (categoryCounts[token.category] || 0) + 1;
    });

    return Object.entries(categoryCounts).map(([key, count]) => ({
      key,
      label: key.charAt(0).toUpperCase() + key.slice(1),
      count
    }));
  }

  async _loadTokens() {
    this._isLoading = true;
    this.requestUpdate();

    try {
      const themeManager = window.lcards?.core?.themeManager;

      if (!themeManager) {
        lcardsLog.error('[ThemeTokenBrowser] ThemeManager not available - this should not happen at editor load time');
        this._tokens = [];
        this._filteredTokens = [];
        this._isLoading = false;
        this.requestUpdate();
        return;
      }

      // Get active theme - using correct API
      const activeTheme = themeManager.getActiveTheme();

      if (!activeTheme || !activeTheme.tokens) {
        lcardsLog.warn('[ThemeTokenBrowser] No active theme or tokens available');
        this._tokens = [];
        this._filteredTokens = [];
        this._isLoading = false;
        this.requestUpdate();
        return;
      }

      // Set theme info for display
      this._activeTheme = {
        name: activeTheme.name || 'Unknown Theme',
        description: activeTheme.description || ''
      };

      // Extract tokens - use the correct API: activeTheme.tokens
      const tokens = this._extractTokensFromObject(activeTheme.tokens);

      // Find usage in current config
      tokens.forEach(token => {
        token.usage = this._findTokenUsage(token.path);
      });

      this._tokens = tokens;
      this._filteredTokens = tokens;

      lcardsLog.debug('[ThemeTokenBrowser] Loaded tokens', {
        count: tokens.length,
        categories: Object.keys(activeTheme.tokens)
      });
    } catch (error) {
      lcardsLog.error('[ThemeTokenBrowser] Error loading tokens:', error);
      this._tokens = [];
      this._filteredTokens = [];
    } finally {
      this._isLoading = false;
      this.requestUpdate();
    }
  }

  /**
   * Extract all tokens from theme object (renamed from _extractTokensFromTheme)
   */
  _extractTokensFromObject(tokenSource) {
    const tokens = [];

    if (!tokenSource || typeof tokenSource !== 'object') {
      return tokens;
    }

    this._extractTokensRecursive(tokenSource, '', tokens);
    return tokens;
  }

  /**
   * Recursively extract tokens from theme object
   */
  _extractTokensRecursive(obj, path, tokens, category = '') {
    if (!obj || typeof obj !== 'object') {
      return;
    }

    for (const [key, value] of Object.entries(obj)) {
      const currentPath = path ? `${path}.${key}` : key;
      const currentCategory = category || key;

      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        // Recurse into nested objects
        this._extractTokensRecursive(value, currentPath, tokens, currentCategory);
      } else {
        // This is a leaf token
        tokens.push({
          path: currentPath,
          value: value,
          category: currentCategory
        });
      }
    }
  }

  /**
   * Find where a token is used in the current config
   */
  _findTokenUsage(tokenPath) {
    const usage = [];
    const tokenSyntax = `{theme:${tokenPath}}`;

    this._findTokenUsageRecursive(this.config, '', tokenSyntax, usage);

    return usage;
  }

  /**
   * Recursively search config for token usage
   */
  _findTokenUsageRecursive(obj, path, tokenSyntax, usage) {
    if (!obj || typeof obj !== 'object') {
      return;
    }

    for (const [key, value] of Object.entries(obj)) {
      const currentPath = path ? `${path}.${key}` : key;

      if (typeof value === 'string' && value.includes(tokenSyntax)) {
        usage.push(currentPath);
      } else if (typeof value === 'object' && value !== null) {
        this._findTokenUsageRecursive(value, currentPath, tokenSyntax, usage);
      }
    }
  }

  /**
   * Check if a value looks like a color
   */
  _isColorValue(value) {
    if (typeof value !== 'string') return false;

    // Check for hex colors (#RGB, #RGBA, #RRGGBB, #RRGGBBAA)
    if (/^#[0-9A-Fa-f]{3,8}$/.test(value)) return true;

    // Check for rgb/rgba
    if (/^rgba?\(/.test(value)) return true;

    // Check for hsl/hsla
    if (/^hsla?\(/.test(value)) return true;

    // Check for CSS color functions (color(), lab(), lch(), oklab(), oklch())
    if (/^(color|lab|lch|oklab|oklch)\(/.test(value)) return true;

    // Check for CSS color names (comprehensive list of common colors)
    const cssColors = [
      'aliceblue', 'antiquewhite', 'aqua', 'aquamarine', 'azure', 'beige', 'bisque', 'black',
      'blanchedalmond', 'blue', 'blueviolet', 'brown', 'burlywood', 'cadetblue', 'chartreuse',
      'chocolate', 'coral', 'cornflowerblue', 'cornsilk', 'crimson', 'cyan', 'darkblue',
      'darkcyan', 'darkgoldenrod', 'darkgray', 'darkgrey', 'darkgreen', 'darkkhaki',
      'darkmagenta', 'darkolivegreen', 'darkorange', 'darkorchid', 'darkred', 'darksalmon',
      'darkseagreen', 'darkslateblue', 'darkslategray', 'darkslategrey', 'darkturquoise',
      'darkviolet', 'deeppink', 'deepskyblue', 'dimgray', 'dimgrey', 'dodgerblue',
      'firebrick', 'floralwhite', 'forestgreen', 'fuchsia', 'gainsboro', 'ghostwhite',
      'gold', 'goldenrod', 'gray', 'grey', 'green', 'greenyellow', 'honeydew', 'hotpink',
      'indianred', 'indigo', 'ivory', 'khaki', 'lavender', 'lavenderblush', 'lawngreen',
      'lemonchiffon', 'lightblue', 'lightcoral', 'lightcyan', 'lightgoldenrodyellow',
      'lightgray', 'lightgrey', 'lightgreen', 'lightpink', 'lightsalmon', 'lightseagreen',
      'lightskyblue', 'lightslategray', 'lightslategrey', 'lightsteelblue', 'lightyellow',
      'lime', 'limegreen', 'linen', 'magenta', 'maroon', 'mediumaquamarine', 'mediumblue',
      'mediumorchid', 'mediumpurple', 'mediumseagreen', 'mediumslateblue', 'mediumspringgreen',
      'mediumturquoise', 'mediumvioletred', 'midnightblue', 'mintcream', 'mistyrose',
      'moccasin', 'navajowhite', 'navy', 'oldlace', 'olive', 'olivedrab', 'orange',
      'orangered', 'orchid', 'palegoldenrod', 'palegreen', 'paleturquoise', 'palevioletred',
      'papayawhip', 'peachpuff', 'peru', 'pink', 'plum', 'powderblue', 'purple', 'red',
      'rosybrown', 'royalblue', 'saddlebrown', 'salmon', 'sandybrown', 'seagreen', 'seashell',
      'sienna', 'silver', 'skyblue', 'slateblue', 'slategray', 'slategrey', 'snow',
      'springgreen', 'steelblue', 'tan', 'teal', 'thistle', 'tomato', 'turquoise', 'violet',
      'wheat', 'white', 'whitesmoke', 'yellow', 'yellowgreen', 'transparent', 'currentcolor'
    ];
    return cssColors.includes(value.toLowerCase());
  }

  /**
   * Copy token syntax to clipboard with visual feedback
   */
  async _copyTokenSyntax(tokenPath, event) {
    const syntax = `{theme:${tokenPath}}`;
    try {
      await navigator.clipboard.writeText(syntax);
      lcardsLog.info('[ThemeTokenBrowser] Copied token syntax:', syntax);
      
      // Show success feedback
      const button = event.target.closest('ha-button');
      if (button) {
        const iconElement = button.querySelector('ha-icon');
        if (iconElement) {
          const originalIcon = iconElement.icon;
          iconElement.icon = 'mdi:check';
          iconElement.style.color = 'var(--success-color, #4caf50)';
          
          setTimeout(() => {
            iconElement.icon = originalIcon;
            iconElement.style.color = '';
          }, 2000);
        }
      }
    } catch (error) {
      lcardsLog.error('[ThemeTokenBrowser] Failed to copy to clipboard:', error);
      
      // Show error feedback
      const button = event.target.closest('ha-button');
      if (button) {
        const iconElement = button.querySelector('ha-icon');
        if (iconElement) {
          iconElement.icon = 'mdi:alert-circle';
          iconElement.style.color = 'var(--error-color, #f44336)';
          
          setTimeout(() => {
            iconElement.style.color = '';
          }, 2000);
        }
      }
    }
  }

  /**
   * Copy resolved value to clipboard with visual feedback
   */
  async _copyValue(value, event) {
    try {
      await navigator.clipboard.writeText(String(value));
      lcardsLog.info('[ThemeTokenBrowser] Copied value:', value);
      
      // Show success feedback
      const button = event.target.closest('ha-button');
      if (button) {
        const iconElement = button.querySelector('ha-icon');
        if (iconElement) {
          const originalIcon = iconElement.icon;
          iconElement.icon = 'mdi:check';
          iconElement.style.color = 'var(--success-color, #4caf50)';
          
          setTimeout(() => {
            iconElement.icon = originalIcon;
            iconElement.style.color = '';
          }, 2000);
        }
      }
    } catch (error) {
      lcardsLog.error('[ThemeTokenBrowser] Failed to copy to clipboard:', error);
      
      // Show error feedback
      const button = event.target.closest('ha-button');
      if (button) {
        const iconElement = button.querySelector('ha-icon');
        if (iconElement) {
          iconElement.icon = 'mdi:alert-circle';
          iconElement.style.color = 'var(--error-color, #f44336)';
          
          setTimeout(() => {
            iconElement.style.color = '';
          }, 2000);
        }
      }
    }
  }
}

customElements.define('lcards-theme-token-browser-tab', LCARdSThemeTokenBrowserTab);
