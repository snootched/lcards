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
      _activeTheme: { type: Object, state: true },
      _expandedCategories: { type: Set, state: true },
      _expandedPaths: { type: Set, state: true }
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
    this._expandedCategories = new Set(['colors']); // Default expand colors
    this._expandedPaths = new Set();
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

      ha-chip-set {
        margin-bottom: 16px;
      }

      .tokens-grid {
        display: block;
      }

      .tokens-tree {
        display: block;
      }

      .tree-category {
        margin-bottom: 16px;
      }

      .tree-node {
        padding-left: 20px;
      }

      .tree-leaf {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 8px 12px;
        background: var(--card-background-color);
        border: 1px solid var(--divider-color);
        border-radius: 8px;
        margin: 4px 0;
        transition: all 0.2s;
      }

      .tree-leaf:hover {
        background: var(--secondary-background-color);
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      }

      .tree-leaf .token-path {
        flex: 1;
        font-family: 'Courier New', monospace;
        font-size: 13px;
        color: var(--primary-color);
        min-width: 200px;
      }

      .tree-leaf .token-value {
        flex: 1;
        font-family: 'Courier New', monospace;
        font-size: 12px;
        color: var(--secondary-text-color);
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        max-width: 200px;
      }

      .tree-leaf .token-preview {
        flex-shrink: 0;
      }

      .tree-leaf .token-actions {
        display: flex;
        gap: 4px;
        flex-shrink: 0;
      }

      details {
        margin-left: 12px;
      }

      summary {
        cursor: pointer;
        padding: 8px;
        font-weight: 500;
        color: var(--primary-text-color);
        user-select: none;
        list-style: none;
        display: flex;
        align-items: center;
        gap: 8px;
      }

      summary::-webkit-details-marker {
        display: none;
      }

      summary::before {
        content: '▶';
        display: inline-block;
        width: 12px;
        transition: transform 0.2s;
        color: var(--secondary-text-color);
      }

      details[open] > summary::before {
        transform: rotate(90deg);
      }

      summary:hover {
        background: var(--secondary-background-color);
        border-radius: 4px;
      }

      .color-preview {
        width: 40px;
        height: 40px;
        border-radius: 4px;
        border: 2px solid var(--divider-color);
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

      <ha-chip-set>
        ${filters.map(filter => html`
          <ha-filter-chip
            .label="${filter.label} (${filter.count})"
            ?selected=${this._selectedCategory === filter.value}
            @click=${() => this._selectedCategory = filter.value}>
          </ha-filter-chip>
        `)}
      </ha-chip-set>
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

    // Build tree structure from flat tokens
    return this._renderTokensTree();
  }

  /**
   * Render tokens as a tree structure grouped by category
   */
  _renderTokensTree() {
    const tokensByCategory = this._groupTokensByCategory();

    return html`
      <div class="tokens-tree">
        ${Object.entries(tokensByCategory).map(([category, tokens]) => html`
          <lcards-form-section
            class="tree-category"
            header="${this._formatCategoryName(category)} (${tokens.length})"
            icon="mdi:palette"
            ?expanded=${this._expandedCategories.has(category)}
            @toggle=${() => this._toggleCategory(category)}>
            ${this._renderTokenTree(tokens, category)}
          </lcards-form-section>
        `)}
      </div>
    `;
  }

  /**
   * Group tokens by their top-level category
   */
  _groupTokensByCategory() {
    const grouped = {};
    
    this._filteredTokens.forEach(token => {
      const category = token.category || 'other';
      if (!grouped[category]) {
        grouped[category] = [];
      }
      grouped[category].push(token);
    });

    return grouped;
  }

  /**
   * Format category name for display
   */
  _formatCategoryName(category) {
    return category.charAt(0).toUpperCase() + category.slice(1);
  }

  /**
   * Toggle category expansion
   */
  _toggleCategory(category) {
    if (this._expandedCategories.has(category)) {
      this._expandedCategories.delete(category);
    } else {
      this._expandedCategories.add(category);
    }
    this.requestUpdate();
  }

  /**
   * Render token tree for a category
   */
  _renderTokenTree(tokens, category) {
    // Build nested structure from flat token paths
    const tree = this._buildTokenTree(tokens);
    return this._renderTreeNodes(tree, '');
  }

  /**
   * Build hierarchical tree structure from flat token list
   */
  _buildTokenTree(tokens) {
    const tree = {};

    tokens.forEach(token => {
      const parts = token.path.split('.');
      let current = tree;

      parts.forEach((part, index) => {
        if (index === parts.length - 1) {
          // Leaf node
          current[part] = {
            _leaf: true,
            token: token
          };
        } else {
          // Branch node
          if (!current[part]) {
            current[part] = {};
          }
          current = current[part];
        }
      });
    });

    return tree;
  }

  /**
   * Recursively render tree nodes
   */
  _renderTreeNodes(node, path) {
    const entries = Object.entries(node);
    
    return html`
      ${entries.map(([key, value]) => {
        if (value._leaf) {
          // Render leaf node (actual token)
          return this._renderTreeLeaf(value.token, path);
        } else {
          // Render branch node (nested tokens)
          const newPath = path ? `${path}.${key}` : key;
          const hasChildren = Object.keys(value).length > 0;
          
          if (!hasChildren) return '';
          
          return html`
            <details ?open=${this._expandedPaths.has(newPath)}>
              <summary @click=${() => this._togglePath(newPath)}>${key}</summary>
              <div class="tree-node">
                ${this._renderTreeNodes(value, newPath)}
              </div>
            </details>
          `;
        }
      })}
    `;
  }

  /**
   * Render a leaf token in the tree
   */
  _renderTreeLeaf(token) {
    return html`
      <div class="tree-leaf">
        <div class="token-path">{theme:${token.path}}</div>
        <div class="token-value">${token.value}</div>
        ${this._renderTokenPreviewCompact(token)}
        <div class="token-actions">
          <ha-icon-button
            icon="mdi:code-braces"
            @click=${(e) => this._copyTokenSyntax(token.path, e)}
            title="Copy token syntax">
          </ha-icon-button>
          <ha-icon-button
            icon="mdi:content-copy"
            @click=${(e) => this._copyValue(token.value, e)}
            title="Copy value">
          </ha-icon-button>
        </div>
      </div>
    `;
  }

  /**
   * Render compact token preview for tree view
   */
  _renderTokenPreviewCompact(token) {
    const valueStr = String(token.value);

    // Color preview
    if (token.category === 'colors' || this._isColorValue(valueStr)) {
      return html`
        <div class="token-preview">
          <div class="color-preview" style="background-color: ${valueStr}; width: 24px; height: 24px; border-radius: 4px; border: 1px solid var(--divider-color);"></div>
        </div>
      `;
    }

    return html``;
  }

  /**
   * Toggle path expansion in tree
   */
  _togglePath(path) {
    if (this._expandedPaths.has(path)) {
      this._expandedPaths.delete(path);
    } else {
      this._expandedPaths.add(path);
    }
    this.requestUpdate();
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
