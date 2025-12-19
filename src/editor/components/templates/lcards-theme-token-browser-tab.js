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
import { resolveThemeTokensRecursive } from '../../../utils/lcards-theme.js';
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
      _dialogOpen: { type: Boolean, state: true },
      _sortColumn: { type: String, state: true },
      _sortDirection: { type: String, state: true }
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
    this._dialogOpen = false;
    this._sortColumn = 'path';
    this._sortDirection = 'asc';
  }

  static get styles() {
    return css`
      :host {
        display: block;
        padding: 16px;
      }

      /* Tab content - simplified */
      .tab-content {
        text-align: center;
        padding: 0;
      }

      .info-card {
        background: var(--secondary-background-color);
        border: 1px solid var(--divider-color);
        border-radius: 8px;
        padding: 24px;
        margin-bottom: 24px;
        max-width: 600px;
        margin-left: auto;
        margin-right: auto;
      }

      .info-card h3 {
        margin: 0 0 8px 0;
        color: var(--primary-text-color);
      }

      .info-card p {
        margin: 8px 0;
        color: var(--secondary-text-color);
      }

      .open-browser-button {
        margin-top: 16px;
      }

      /* Dialog styles */
      ha-dialog {
        --mdc-dialog-min-width: 90vw;
        --mdc-dialog-max-width: 1400px;
      }

      .dialog-content {
        display: flex;
        flex-direction: column;
        min-height: 60vh;
        max-height: 80vh;
      }

      .dialog-header {
        padding: 16px 24px;
        border-bottom: 1px solid var(--divider-color);
        display: flex;
        gap: 16px;
        align-items: center;
        flex-wrap: wrap;
      }

      .dialog-search {
        flex: 1;
        min-width: 200px;
      }

      .category-filters {
        display: flex;
        gap: 8px;
        flex-wrap: wrap;
        padding: 16px 24px;
        border-bottom: 1px solid var(--divider-color);
      }

      .category-chip {
        appearance: none;
        border: 1px solid var(--divider-color);
        background: var(--secondary-background-color);
        color: var(--primary-text-color);
        padding: 6px 12px;
        border-radius: 16px;
        font-size: 13px;
        cursor: pointer;
        transition: all 0.2s;
      }

      .category-chip:hover {
        background: var(--primary-color);
        color: white;
        border-color: var(--primary-color);
      }

      .category-chip.selected {
        background: var(--primary-color);
        color: white;
        border-color: var(--primary-color);
      }

      .dialog-body {
        flex: 1;
        overflow: auto;
        padding: 0;
      }

      .token-table {
        width: 100%;
        border-collapse: collapse;
      }

      .token-table thead {
        position: sticky;
        top: 0;
        background: var(--card-background-color);
        z-index: 1;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      }

      .token-table th {
        text-align: left;
        padding: 12px 16px;
        font-weight: 600;
        color: var(--primary-text-color);
        border-bottom: 2px solid var(--divider-color);
        cursor: pointer;
        user-select: none;
      }

      .token-table th:hover {
        background: var(--secondary-background-color);
      }

      .token-table th .sort-indicator {
        margin-left: 4px;
        font-size: 10px;
        color: var(--secondary-text-color);
      }

      .token-table td {
        padding: 12px 16px;
        border-bottom: 1px solid var(--divider-color);
        vertical-align: middle;
      }

      .token-table tbody tr:hover {
        background: var(--secondary-background-color);
      }

      .token-path-cell {
        font-family: 'Courier New', monospace;
        font-size: 12px;
        color: var(--primary-color);
        word-break: break-all;
        max-width: 300px;
      }

      .token-value-cell {
        font-family: 'Courier New', monospace;
        font-size: 12px;
        color: var(--secondary-text-color);
        word-break: break-all;
        max-width: 300px;
      }

      .token-preview-cell {
        width: 60px;
        text-align: center;
      }

      .color-preview {
        width: 32px;
        height: 32px;
        border-radius: 4px;
        border: 1px solid var(--divider-color);
        display: inline-block;
      }

      .token-actions-cell {
        width: 100px;
        text-align: right;
      }

      .token-actions {
        display: flex;
        gap: 4px;
        justify-content: flex-end;
      }

      .token-actions ha-icon-button {
        --mdc-icon-button-size: 36px;
        --mdc-icon-size: 20px;
        color: var(--primary-text-color);
      }

      .token-actions ha-icon-button:hover {
        color: var(--primary-color);
      }

      .text-preview {
        font-family: var(--token-font-family, inherit);
        font-size: var(--token-font-size, 14px);
        font-weight: var(--token-font-weight, normal);
        line-height: 1.5;
        padding: 4px 8px;
        background: var(--secondary-background-color);
        border-radius: 4px;
        display: inline-block;
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

  render() {
    return html`
      ${this._renderTabContent()}
      ${this._renderDialog()}
    `;
  }

  _renderTabContent() {
    if (this._isLoading) {
      return html`
        <div class="loading-state">
          <ha-circular-progress active></ha-circular-progress>
          <p>Loading theme tokens...</p>
        </div>
      `;
    }

    return html`
      <div class="tab-content">
        <div class="info-card">
          <h3>Theme Token Browser</h3>
          <p>
            <strong>${this._activeTheme?.name || 'Active Theme'}</strong>
            <br />
            ${this._tokens.length} tokens available
          </p>
          <p style="font-size: 13px; color: var(--secondary-text-color);">
            Browse and copy theme tokens in the format: <code>{theme:token.path}</code>
          </p>
          <ha-button
            class="open-browser-button"
            raised
            @click=${this._openDialog}>
            <ha-icon icon="mdi:palette" slot="icon"></ha-icon>
            Open Token Browser
          </ha-button>
        </div>
      </div>
    `;
  }

  _renderDialog() {
    if (!this._dialogOpen) return '';

    lcardsLog.debug('[ThemeTokenBrowser] Rendering dialog');

    return html`
      <ha-dialog
        open
        @closed=${this._closeDialog}
        .heading=${'Theme Token Browser'}>
        <div class="dialog-content">
          ${this._renderDialogHeader()}
          ${this._renderCategoryFilters()}
          ${this._renderDialogBody()}
        </div>
        <ha-button
          slot="primaryAction"
          @click=${this._closeDialog}
          dialogAction="close">
          Close
        </ha-button>
      </ha-dialog>
    `;
  }

  _renderDialogHeader() {
    return html`
      <div class="dialog-header">
        <ha-textfield
          class="dialog-search"
          .value=${this._searchQuery}
          @input=${this._handleSearchInput}
          placeholder="Search tokens..."
          .label=${'Search'}>
          <ha-icon slot="leadingIcon" icon="mdi:magnify"></ha-icon>
        </ha-textfield>
      </div>
    `;
  }

  _renderCategoryFilters() {
    const categories = this._getCategories();
    const filters = [
      { label: 'All', value: 'all', count: this._tokens.length },
      ...categories
    ];

    return html`
      <div class="category-filters">
        ${filters.map(filter => html`
          <button
            class="category-chip ${this._selectedCategory === filter.value ? 'selected' : ''}"
            @click=${() => this._selectCategory(filter.value)}>
            ${filter.label} (${filter.count})
          </button>
        `)}
      </div>
    `;
  }

  _renderDialogBody() {
    try {
      lcardsLog.debug('[ThemeTokenBrowser] Rendering dialog body', {
        filteredTokens: this._filteredTokens?.length
      });

      if (!this._filteredTokens || this._filteredTokens.length === 0) {
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
        <div class="dialog-body">
          <table class="token-table">
            <thead>
              <tr>
                <th @click=${() => this._sortBy('path')}>
                  Token Path
                  ${this._sortColumn === 'path' ? html`<span class="sort-indicator">${this._sortDirection === 'asc' ? '▲' : '▼'}</span>` : ''}
                </th>
                <th @click=${() => this._sortBy('value')}>
                  Value
                  ${this._sortColumn === 'value' ? html`<span class="sort-indicator">${this._sortDirection === 'asc' ? '▲' : '▼'}</span>` : ''}
                </th>
                <th>Preview</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              ${this._getSortedTokens().map(token => this._renderTokenRow(token))}
            </tbody>
          </table>
        </div>
      `;
    } catch (error) {
      lcardsLog.error('[ThemeTokenBrowser] Error rendering dialog body:', error);
      return html`
        <div class="empty-state">
          <ha-icon icon="mdi:alert-circle"></ha-icon>
          <p>Error loading tokens</p>
          <p style="font-size: 12px;">Check console for details</p>
        </div>
      `;
    }
  }

  _renderTokenRow(token) {
    const displayValue = token.value !== undefined && token.value !== null
      ? String(token.value)
      : '(no value)';

    return html`
      <tr>
        <td class="token-path-cell">{theme:${token.path}}</td>
        <td class="token-value-cell" title="${displayValue}">${displayValue}</td>
        <td class="token-preview-cell">
          ${this._renderTokenPreview(token)}
        </td>
        <td class="token-actions-cell">
          <div class="token-actions">
            <ha-icon-button
              @click=${(e) => this._copyTokenSyntax(token.path, e)}
              .label=${'Copy token syntax'}
              .path=${"M8 3C9.66 3 11 4.34 11 6S9.66 9 8 9 5 7.66 5 6 6.34 3 8 3M8 11C10.76 11 16 12.36 16 15V17H0V15C0 12.36 5.24 11 8 11M6 8C6 9.11 6.9 10 8 10 9.11 10 10 9.11 10 8V7H12V8C12 10.21 10.21 12 8 12S4 10.21 4 8V7H6V8M13.54 5.29C13.54 6.31 13.08 7.2 12.38 7.83L13.5 8.95L14.91 7.54C16.18 6.27 16.95 4.55 16.95 2.67V1H15.28V2.67C15.28 4.03 14.77 5.3 13.91 6.24L12.5 7.65C12.13 7.28 11.85 6.82 11.68 6.31L10 6.31C10.15 7.19 10.6 7.97 11.26 8.55L9.85 9.96C9.11 9.32 8.54 8.47 8.22 7.5H6.5C6.82 8.93 7.65 10.2 8.85 11.09L10.26 9.68C9.6 9.09 9.08 8.32 8.75 7.45L10.43 7.45C10.77 8.31 11.37 9.05 12.15 9.55L13.56 8.14C14.63 7.07 15.21 5.63 15.21 4.04V2.37H13.54V4.04C13.54 4.47 13.54 4.88 13.54 5.29Z"}>
            </ha-icon-button>
            <ha-icon-button
              @click=${(e) => this._copyValue(token.value, e)}
              .label=${'Copy value'}
              .path=${"M19,21H8V7H19M19,5H8A2,2 0 0,0 6,7V21A2,2 0 0,0 8,23H19A2,2 0 0,0 21,21V7A2,2 0 0,0 19,5M16,1H4A2,2 0 0,0 2,3V17H4V3H16V1Z"}>
            </ha-icon-button>
          </div>
        </td>
      </tr>
    `;
  }

  _renderTokenPreview(token) {
    try {
      const valueStr = String(token.value || '');

      // Color preview - only show for actual CSS colors (not computed functions)
      if (token.category === 'colors' || this._isColorValue(valueStr)) {
        return html`
          <div
            class="color-preview"
            style="background-color: ${valueStr};"
            title="${valueStr}">
          </div>
        `;
      }

      // Text/font preview
      if (token.category === 'fonts' || token.category === 'typography') {
        return this._renderTextPreview(token);
      }

      return html``;
    } catch (error) {
      lcardsLog.warn('[ThemeTokenBrowser] Error rendering preview:', error);
      return html``;
    }
  }

  /**
   * Render text preview for typography tokens
   */
  _renderTextPreview(token) {
    try {
      const path = token.path.toLowerCase();
      const value = token.value;

      // Build inline style based on token type
      let style = '';

      if (path.includes('family') && typeof value === 'string') {
        style = `font-family: ${value};`;
      } else if (path.includes('size') && typeof value === 'string') {
        style = `font-size: ${value};`;
      } else if (path.includes('weight') && (typeof value === 'string' || typeof value === 'number')) {
        style = `font-weight: ${value};`;
      } else if (path.includes('line-height') && typeof value === 'string') {
        style = `line-height: ${value};`;
      } else {
        return html``;
      }

      return html`
        <div class="text-preview" style="${style}">Aa</div>
      `;
    } catch (error) {
      lcardsLog.warn('[ThemeTokenBrowser] Error rendering text preview:', error);
      return html``;
    }
  }

  // Dialog control methods
  _openDialog() {
    lcardsLog.debug('[ThemeTokenBrowser] Opening dialog', {
      tokensCount: this._tokens.length,
      filteredCount: this._filteredTokens.length
    });
    this._dialogOpen = true;
    this._applyFilters(); // Apply initial filters when opening
  }

  _closeDialog() {
    lcardsLog.debug('[ThemeTokenBrowser] Closing dialog');
    this._dialogOpen = false;
  }

  _handleSearchInput(e) {
    this._searchQuery = e.target.value.toLowerCase();
    this._applyFilters();
  }

  _selectCategory(category) {
    this._selectedCategory = category;
    this._applyFilters();
  }

  _sortBy(column) {
    if (this._sortColumn === column) {
      // Toggle direction
      this._sortDirection = this._sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this._sortColumn = column;
      this._sortDirection = 'asc';
    }
    this.requestUpdate();
  }

  _getSortedTokens() {
    try {
      if (!this._filteredTokens || !Array.isArray(this._filteredTokens)) {
        lcardsLog.warn('[ThemeTokenBrowser] Invalid filtered tokens:', this._filteredTokens);
        return [];
      }

      const tokens = [...this._filteredTokens];

      tokens.sort((a, b) => {
        let aVal, bVal;

        if (this._sortColumn === 'path') {
          aVal = a.path || '';
          bVal = b.path || '';
        } else if (this._sortColumn === 'value') {
          aVal = String(a.value || '');
          bVal = String(b.value || '');
        }

        const comparison = aVal.localeCompare(bVal);
        return this._sortDirection === 'asc' ? comparison : -comparison;
      });

      return tokens;
    } catch (error) {
      lcardsLog.error('[ThemeTokenBrowser] Error sorting tokens:', error);
      return this._filteredTokens || [];
    }
  }

  _getCategories() {
    const categoryCounts = {};
    this._tokens.forEach(token => {
      categoryCounts[token.category] = (categoryCounts[token.category] || 0) + 1;
    });

    return Object.entries(categoryCounts).map(([key, count]) => ({
      value: key,
      label: key.charAt(0).toUpperCase() + key.slice(1),
      count
    }));
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

  async _loadTokens() {
    this._isLoading = true;
    this.requestUpdate();

    try {
      const themeManager = window.lcards?.core?.themeManager;

      if (!themeManager) {
        lcardsLog.warn('[ThemeTokenBrowser] ThemeManager not available (unexpected at editor load time)');
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
        // This is a leaf token - resolve it if it's a computed token
        const resolvedValue = this._resolveTokenValue(currentPath, value);

        tokens.push({
          path: currentPath,
          value: resolvedValue,
          rawValue: value, // Keep original for reference
          category: currentCategory
        });
      }
    }
  }

  /**
   * Resolve a token value (handles computed tokens like darken(), alpha(), etc.)
   * Uses the existing resolveThemeTokensRecursive utility for consistency
   */
  _resolveTokenValue(tokenPath, rawValue) {
    try {
      const themeManager = window.lcards?.core?.themeManager;

      // If no theme manager, return raw value
      if (!themeManager) {
        return rawValue;
      }

      // Wrap in object and resolve recursively
      // This handles computed tokens like darken(colors.primary, 20%)
      const wrapped = { value: rawValue };
      const resolved = resolveThemeTokensRecursive(wrapped, themeManager);

      if (resolved.value !== rawValue) {
        lcardsLog.trace('[ThemeTokenBrowser] Resolved token:', tokenPath, rawValue, '->', resolved.value);
      }

      return resolved.value;
    } catch (error) {
      lcardsLog.warn('[ThemeTokenBrowser] Error resolving token:', tokenPath, error);
      return rawValue;
    }
  }

  /**
   * Check if a value looks like a computed token
   * (kept for potential future use, but resolution now handled by resolveThemeTokensRecursive)
   */
  _looksLikeComputedToken(value) {
    if (typeof value !== 'string') return false;

    const computedFunctions = ['darken', 'lighten', 'alpha', 'saturate', 'desaturate', 'mix', 'shade', 'tint'];
    return computedFunctions.some(fn => value.includes(`${fn}(`));
  }  /**
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
    const button = event.target.closest('ha-icon-button');
    if (!button) return;

    const originalIcon = button.icon;

    try {
      await navigator.clipboard.writeText(syntax);
      lcardsLog.info('[ThemeTokenBrowser] Copied token syntax:', syntax);

      // Show success feedback
      button.icon = 'mdi:check';
      button.style.color = 'var(--success-color, #4caf50)';

      setTimeout(() => {
        button.icon = originalIcon;
        button.style.color = '';
      }, 2000);
    } catch (error) {
      lcardsLog.error('[ThemeTokenBrowser] Failed to copy to clipboard:', error);

      // Show error feedback
      button.icon = 'mdi:alert-circle';
      button.style.color = 'var(--error-color, #f44336)';

      setTimeout(() => {
        button.icon = originalIcon;
        button.style.color = '';
      }, 2000);
    }
  }

  /**
   * Copy resolved value to clipboard with visual feedback
   */
  async _copyValue(value, event) {
    const button = event.target.closest('ha-icon-button');
    if (!button) return;

    const originalIcon = button.icon;

    try {
      await navigator.clipboard.writeText(String(value));
      lcardsLog.info('[ThemeTokenBrowser] Copied value:', value);

      // Show success feedback
      button.icon = 'mdi:check';
      button.style.color = 'var(--success-color, #4caf50)';

      setTimeout(() => {
        button.icon = originalIcon;
        button.style.color = '';
      }, 2000);
    } catch (error) {
      lcardsLog.error('[ThemeTokenBrowser] Failed to copy to clipboard:', error);

      // Show error feedback
      button.icon = 'mdi:alert-circle';
      button.style.color = 'var(--error-color, #f44336)';

      setTimeout(() => {
        button.icon = originalIcon;
        button.style.color = '';
      }, 2000);
    }
  }
}

customElements.define('lcards-theme-token-browser-tab', LCARdSThemeTokenBrowserTab);
