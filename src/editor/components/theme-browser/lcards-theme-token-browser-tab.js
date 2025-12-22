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
import '../shared/lcards-collapsible-section.js';
import '../shared/lcards-message.js';

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
      _sortDirection: { type: String, state: true },
      _activeView: { type: String, state: true }, // 'tokens', 'css-vars', or 'all-vars'
      _cssVariables: { type: Array, state: true },
      _filteredCssVars: { type: Array, state: true },
      _haThemeName: { type: String, state: true },
      _allCssVariables: { type: Array, state: true },
      _filteredAllVars: { type: Array, state: true },
      _selectedAllVarsCategory: { type: String, state: true }
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
    this._activeView = 'tokens'; // Default to tokens view
    this._cssVariables = [];
    this._filteredCssVars = [];
    this._haThemeName = 'Unknown';
    this._allCssVariables = [];
    this._filteredAllVars = [];
    this._selectedAllVarsCategory = 'all';
    this._expandedCategories = new Set();
    this._expandedTokenCategories = new Set();
    this._handleKeydown = this._handleKeydown.bind(this);
  }

  connectedCallback() {
    super.connectedCallback();
    // Use capture phase to intercept before browser's find
    document.addEventListener('keydown', this._handleKeydown, true);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    document.removeEventListener('keydown', this._handleKeydown, true);
  }

  _handleKeydown(e) {
    // Only handle keyboard shortcuts when dialog is open
    if (!this._dialogOpen) return;

    // Ctrl/Cmd+F to focus search - must prevent BEFORE browser sees it
    if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
      e.preventDefault();
      e.stopPropagation();
      const searchInput = this.shadowRoot?.querySelector('.dialog-search');
      if (searchInput) {
        searchInput.focus();
      }
      return;
    }

    // ESC to close dialog
    if (e.key === 'Escape') {
      e.preventDefault();
      e.stopPropagation();
      this._closeDialog();
      return;
    }
  }

  static get styles() {
    return css`
      :host {
        display: block;
        padding: 16px;
      }

      /* Tab content - simplified */
      .tab-content {
        padding: 0;
      }

      .info-card {
        background: var(--primary-background-color);
        border: 1px solid var(--divider-color);
        border-radius: 16px;
        padding: 24px;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      }

      .info-card h3 {
        margin: 0 0 12px 0;
        color: var(--primary-text-color);
        font-size: 18px;
        font-weight: 500;
      }

      .info-card p {
        margin: 8px 0;
        color: var(--secondary-text-color);
        line-height: 1.5;
      }

      .info-card code {
        background: var(--secondary-background-color);
        padding: 2px 6px;
        border-radius: 3px;
        font-family: 'Roboto Mono', monospace;
        font-size: 13px;
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
        padding: 0;
        border-bottom: none;
        display: flex;
        flex-direction: column;
        gap: 0;
      }

      .tabs-container {
        display: flex;
        overflow-x: auto;
        overflow-y: hidden;
        flex-wrap: nowrap;
        scroll-behavior: smooth;
        scrollbar-width: thin;
        border-bottom: 2px solid var(--divider-color);
        margin-bottom: 0;
      }

      .tabs-container::-webkit-scrollbar {
        height: 4px;
      }

      .tabs-container::-webkit-scrollbar-thumb {
        background: var(--primary-color);
        border-radius: 2px;
      }

      .view-tab {
        flex: 0 0 auto;
        white-space: nowrap;
        padding: 12px 24px;
        cursor: pointer;
        border-bottom: 3px solid transparent;
        font-weight: 500;
        color: var(--secondary-text-color);
        transition: all 0.2s ease;
        user-select: none;
        background: none;
        border: none;
        border-bottom: 3px solid transparent;
      }

      .view-tab:hover {
        color: var(--primary-text-color);
        background: var(--secondary-background-color);
      }

      .view-tab.active {
        color: var(--primary-color);
        border-bottom-color: var(--primary-color);
        border-bottom-width: 4px;
      }

      .theme-info {
        display: flex;
        gap: 16px;
        padding: 12px 24px;
        border-bottom: 1px solid var(--divider-color);
        background: var(--secondary-background-color);
      }

      .theme-info-badge {
        padding: 8px 16px;
        background: var(--card-background-color);
        border: 1px solid var(--divider-color);
        border-radius: 4px;
        font-size: 13px;
        font-weight: 500;
        color: var(--primary-text-color);
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .theme-info-badge strong {
        color: var(--secondary-text-color);
        font-weight: normal;
      }

      .theme-info-badge .theme-name {
        color: var(--primary-color);
        font-weight: 600;
      }

      .search-container {
        padding: 12px 24px;
        border-bottom: 1px solid var(--divider-color);
        display: flex;
        gap: 12px;
        align-items: center;
      }

      .search-wrapper {
        flex: 1;
        position: relative;
        min-width: 400px;
      }

      .dialog-search {
        width: 100%;
      }

      .search-clear {
        position: absolute;
        right: 8px;
        top: 50%;
        transform: translateY(-50%);
        --mdc-icon-button-size: 32px;
      }

      .search-result-count {
        color: var(--secondary-text-color);
        font-size: 13px;
        white-space: nowrap;
        padding: 0 8px;
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

      .css-vars-columns {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 0;
        height: 100%;
      }

      .css-vars-column {
        overflow: auto;
        border-right: 1px solid var(--divider-color);
      }

      .css-vars-column:last-child {
        border-right: none;
      }

      .css-vars-column h4 {
        position: sticky;
        top: 0;
        background: var(--card-background-color);
        padding: 16px 24px 8px;
        margin: 0;
        color: var(--primary-text-color);
        border-bottom: 2px solid var(--divider-color);
        z-index: 1;
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

      .token-resolution {
        display: flex;
        flex-direction: column;
        gap: 4px;
      }

      .raw-value {
        color: var(--secondary-text-color);
        font-size: 11px;
        opacity: 0.8;
      }

      .resolution-arrow {
        color: var(--primary-color);
        font-size: 10px;
        font-weight: bold;
        padding: 2px 0;
      }

      .resolved-value {
        color: var(--primary-text-color);
        font-weight: 500;
        font-size: 12px;
      }

      .token-preview-cell {
        width: 60px;
        text-align: center;
      }

      .color-preview {
        width: 32px;
        height: 32px;
        border-radius: 4px;
        border: 2px solid var(--divider-color);
        display: inline-block;
        box-shadow: inset 0 0 0 1px rgba(0, 0, 0, 0.1);
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
          <p>Loading theme browser...</p>
        </div>
      `;
    }

    return html`
      <div class="tab-content">
        <div class="info-card">
          <h3>Theme Browser</h3>
          <p>
            <strong>${this._activeTheme?.name || 'Active Theme'}</strong>
            <br />
            ${this._tokens.length} tokens available
          </p>
          <p style="font-size: 13px; color: var(--secondary-text-color);">
            Browse and copy theme tokens for <strong>style configuration</strong>: <code>theme:token.path</code>
          </p>
          <ha-button
            class="open-browser-button"
            raised
            @click=${this._openDialog}>
            <ha-icon icon="mdi:palette" slot="icon"></ha-icon>
            Open Theme Browser
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
        .heading=${'Theme Browser'}>
        <div class="dialog-content">
          ${this._renderDialogHeader()}
          ${this._activeView === 'tokens' ? this._renderCategoryFilters() : ''}
          ${this._activeView === 'all-vars' ? this._renderAllVarsCategoryFilters() : ''}
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
        <div class="tabs-container">
          <button
            class="view-tab ${this._activeView === 'tokens' ? 'active' : ''}"
            @click=${() => this._switchView('tokens')}>
            LCARdS Theme Tokens (${this._tokens.length})
          </button>
          <button
            class="view-tab ${this._activeView === 'css-vars' ? 'active' : ''}"
            @click=${() => this._switchView('css-vars')}>
            LCARS CSS Variables (${this._cssVariables.length})
          </button>
          <button
            class="view-tab ${this._activeView === 'all-vars' ? 'active' : ''}"
            @click=${() => this._switchView('all-vars')}>
            All CSS Variables (${this._allCssVariables.length})
          </button>
        </div>
        <div class="theme-info">
          <div class="theme-info-badge">
            <strong>HA Theme:</strong>
            <span class="theme-name">${this._haThemeName}</span>
          </div>
          <div class="theme-info-badge">
            <strong>LCARdS Theme:</strong>
            <span class="theme-name">${this._activeTheme?.name || 'Unknown'}</span>
          </div>
        </div>
        <div class="search-container">
          <div class="search-wrapper">
            <ha-textfield
              class="dialog-search"
              .value=${this._searchQuery}
              @input=${this._handleSearchInput}
              placeholder="${
                this._activeView === 'tokens' ? 'Search tokens... (Ctrl+F)' :
                this._activeView === 'all-vars' ? 'Search all variables... (Ctrl+F)' :
                'Search CSS variables... (Ctrl+F)'
              }"
              .label=${'Search'}>
              <ha-icon slot="leadingIcon" icon="mdi:magnify"></ha-icon>
            </ha-textfield>
            ${this._searchQuery ? html`
              <ha-icon-button
                class="search-clear"
                @click=${this._clearSearch}
                .label=${'Clear search'}
                .path=${"M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z"}>
              </ha-icon-button>
            ` : ''}
          </div>
          ${this._renderResultCount()}
        </div>
      </div>
    `;
  }

  _renderResultCount() {
    if (!this._searchQuery) return '';

    let totalCount, filteredCount;
    if (this._activeView === 'tokens') {
      totalCount = this._tokens.length;
      filteredCount = this._filteredTokens.length;
    } else if (this._activeView === 'css-vars') {
      totalCount = this._cssVariables.length;
      filteredCount = this._filteredCssVars.length;
    } else {
      totalCount = this._allCssVariables.length;
      filteredCount = this._filteredAllVars.length;
    }

    return html`
      <div class="search-result-count">
        Showing ${filteredCount} of ${totalCount}
      </div>
    `;
  }

  _clearSearch() {
    this._searchQuery = '';
    if (this._activeView === 'tokens') {
      this._applyFilters();
    } else if (this._activeView === 'css-vars') {
      this._applyCssVarFilters();
    } else if (this._activeView === 'all-vars') {
      this._applyAllVarsFilters();
    }
    // Focus back on search input
    const searchInput = this.shadowRoot?.querySelector('.dialog-search');
    if (searchInput) {
      searchInput.focus();
    }
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

  _renderAllVarsCategoryFilters() {
    const allVars = this._allCssVariables || [];

    // Count variables by category
    const categoryCounts = {
      'ha-core': { label: 'HA Core', count: 0 },
      'material': { label: 'Material', count: 0 },
      'ha-specific': { label: 'HA-Specific', count: 0 },
      'states': { label: 'States', count: 0 },
      'card-mod': { label: 'Card-Mod', count: 0 },
      'lcars': { label: 'LCARS', count: 0 },
      'lcards': { label: 'LCARdS', count: 0 },
      'app': { label: 'App', count: 0 },
      'other': { label: 'Other', count: 0 }
    };

    allVars.forEach(v => {
      if (categoryCounts[v.category]) {
        categoryCounts[v.category].count++;
      }
    });

    const filters = [
      { label: 'All', value: 'all', count: allVars.length },
      ...Object.entries(categoryCounts)
        .filter(([_, data]) => data.count > 0)
        .map(([key, data]) => ({ label: data.label, value: key, count: data.count }))
    ];

    return html`
      <div class="category-filters">
        ${filters.map(filter => html`
          <button
            class="category-chip ${this._selectedAllVarsCategory === filter.value ? 'selected' : ''}"
            @click=${() => this._selectAllVarsCategory(filter.value)}>
            ${filter.label} (${filter.count})
          </button>
        `)}
      </div>
    `;
  }

  _renderDialogBody() {
    // Switch between views
    if (this._activeView === 'css-vars') {
      return this._renderCssVarsView();
    }

    if (this._activeView === 'all-vars') {
      return this._renderAllVarsView();
    }

    // Default: tokens view
    try {
      lcardsLog.debug('[ThemeTokenBrowser] Rendering dialog body', {
        filteredTokens: this._filteredTokens?.length
      });

      if (!this._filteredTokens || this._filteredTokens.length === 0) {
        return html`
          <div class="empty-state">
            <ha-icon icon="mdi:${this._searchQuery ? 'magnify-remove-outline' : 'palette'}"></ha-icon>
            <p>${this._searchQuery ? `No tokens found matching "${this._searchQuery}"` : 'No tokens found'}</p>
            <p style="font-size: 13px; color: var(--secondary-text-color); max-width: 400px;">
              ${this._searchQuery
                ? 'Try a different search term, or clear the search to see all tokens.'
                : this._selectedCategory !== 'all'
                  ? 'Try selecting a different category or "All" to see more tokens.'
                  : 'No theme tokens are available in the current theme.'}
            </p>
          </div>
        `;
      }

      // Group tokens by top-level category
      const groupedTokens = this._groupTokensByCategory(this._getSortedTokens());

      return html`
        <div class="dialog-body">
          ${Object.entries(groupedTokens).map(([category, tokens]) => {
            const isExpanded = this._expandedTokenCategories.has(`token-${category}`);
            return html`
              <lcards-collapsible-section
                .title=${this._formatCategoryName(category)}
                .count=${tokens.length}
                .countLabel=${'tokens'}
                ?expanded=${isExpanded}
                @toggle=${() => this._toggleTokenCategory(category)}>
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
                    ${tokens.map(token => this._renderTokenRow(token))}
                  </tbody>
                </table>
              </lcards-collapsible-section>
            `;
          })}
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

  /**
   * Format a token value for display
   * Handles objects, arrays, and primitives appropriately
   */
  _formatTokenValue(value) {
    if (value === undefined || value === null) {
      return '(no value)';
    }

    // Handle objects - show JSON or type info
    if (typeof value === 'object') {
      if (Array.isArray(value)) {
        return `[Array: ${value.length} items]`;
      }
      try {
        const json = JSON.stringify(value, null, 2);
        // If JSON is short, show it inline, otherwise show type
        return json.length < 100 ? json : `{Object: ${Object.keys(value).length} keys}`;
      } catch (e) {
        return '[Complex Object]';
      }
    }

    return String(value);
  }

  _renderTokenRow(token) {
    const displayValue = this._formatTokenValue(token.value);

    // If token was resolved from another token or computed, show resolution info
    const hasResolution = token.resolvedFrom && token.resolvedFrom !== token.value;
    const rawDisplay = this._formatTokenValue(token.rawValue !== undefined ? token.rawValue : token.value);

    return html`
      <tr>
        <td class="token-path-cell">theme:${token.path}</td>
        <td class="token-value-cell">
          ${hasResolution ? html`
            <div class="token-resolution">
              <div class="raw-value" title="Raw value in theme">
                ${rawDisplay}
              </div>
              <div class="resolution-arrow">↓ resolves to</div>
              <div class="resolved-value" title="Fully resolved value">
                ${displayValue}
              </div>
            </div>
          ` : html`
            <div title="${displayValue}">${displayValue}</div>
          `}
        </td>
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
      // Use the fully resolved value for preview (handles token references)
      const valueStr = String(token.finalValue || token.value || '');

      // Color preview - only show for actual CSS colors (not computed functions)
      if (token.category === 'colors' || this._isColorValue(valueStr)) {
        return html`
          <div
            class="color-preview"
            style="background-color: ${valueStr}; cursor: pointer;"
            title="${valueStr} (click to copy hex value)"
            @click=${(e) => this._copyResolvedColor(valueStr, e)}>
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

  /**
   * Render CSS Variables view
   */
  _renderCssVarsView() {
    const vars = this._filteredCssVars || this._cssVariables || [];

    if (vars.length === 0) {
      return html`
        <div class="empty-state">
          <ha-icon icon="mdi:palette-swatch-outline"></ha-icon>
          <p>No CSS variables found</p>
        </div>
      `;
    }

    // Group by category
    const lcarsVars = vars.filter(v => v.category === 'lcars');
    const lcardsVars = vars.filter(v => v.category === 'lcards');

    return html`
      <div class="dialog-body">
        <div class="css-vars-columns">
          <div class="css-vars-column">
            ${lcarsVars.length > 0 ? html`
              <h4>HA-LCARS Theme (${lcarsVars.length})</h4>
              <table class="token-table">
                <thead>
                  <tr>
                    <th>Variable Name</th>
                    <th>Value</th>
                    <th>Preview</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  ${lcarsVars.map(v => this._renderCssVarRow(v))}
                </tbody>
              </table>
            ` : html`
              <h4>HA-LCARS Theme (0)</h4>
              <div style="padding: 24px; text-align: center; color: var(--secondary-text-color);">
                No HA-LCARS variables found
              </div>
            `}
          </div>

          <div class="css-vars-column">
            ${lcardsVars.length > 0 ? html`
              <h4>LCARdS Injected (${lcardsVars.length})</h4>
              <table class="token-table">
                <thead>
                  <tr>
                    <th>Variable Name</th>
                    <th>Value</th>
                    <th>Preview</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  ${lcardsVars.map(v => this._renderCssVarRow(v))}
                </tbody>
              </table>
            ` : html`
              <h4>LCARdS Injected (0)</h4>
              <div style="padding: 24px; text-align: center; color: var(--secondary-text-color);">
                No LCARdS variables found
              </div>
            `}
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Render All CSS Variables view (comprehensive HA variables)
   */
  _renderAllVarsView() {
    const vars = this._filteredAllVars || this._allCssVariables || [];

    if (vars.length === 0) {
      return html`
        <div class="empty-state">
          <ha-icon icon="mdi:palette-swatch-outline"></ha-icon>
          <p>No CSS variables found</p>
        </div>
      `;
    }

    // Group by category
    const categories = {
      'ha-core': { title: 'Home Assistant Core Theme', vars: [] },
      'material': { title: 'Material Design Components (MDC)', vars: [] },
      'ha-specific': { title: 'HA-Specific Variables', vars: [] },
      'states': { title: 'Entity State Colors', vars: [] },
      'card-mod': { title: 'Card-Mod Variables', vars: [] },
      'lcars': { title: 'HA-LCARS Theme', vars: [] },
      'lcards': { title: 'LCARdS Injected', vars: [] },
      'app': { title: 'App-Specific', vars: [] },
      'other': { title: 'Other Variables', vars: [] }
    };

    vars.forEach(v => {
      if (categories[v.category]) {
        categories[v.category].vars.push(v);
      }
    });

    // Filter categories based on selection
    const filteredCategories = this._selectedAllVarsCategory === 'all'
      ? categories
      : { [this._selectedAllVarsCategory]: categories[this._selectedAllVarsCategory] };

    return html`
      <div class="dialog-body">
        ${Object.entries(filteredCategories).map(([key, cat]) => {
          if (!cat || cat.vars.length === 0) return '';
          const isExpanded = this._expandedCategories.has(key);
          return html`
            <lcards-collapsible-section
              .title=${cat.title}
              .count=${cat.vars.length}
              .countLabel=${'variables'}
              ?expanded=${isExpanded}
              @toggle=${() => this._toggleCategory(key)}>
              <table class="token-table">
                <thead>
                  <tr>
                    <th>Variable Name</th>
                    <th>Value</th>
                    <th>Preview</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  ${cat.vars.map(v => this._renderCssVarRow(v))}
                </tbody>
              </table>
            </lcards-collapsible-section>
          `;
        })}
      </div>
    `;
  }

  /**
   * Toggle category expansion in all-vars view
   */
  _toggleCategory(categoryKey) {
    if (this._expandedCategories.has(categoryKey)) {
      this._expandedCategories.delete(categoryKey);
    } else {
      this._expandedCategories.add(categoryKey);
    }
    this.requestUpdate();
  }

  _toggleTokenCategory(categoryKey) {
    const key = `token-${categoryKey}`;
    if (this._expandedTokenCategories.has(key)) {
      this._expandedTokenCategories.delete(key);
    } else {
      this._expandedTokenCategories.add(key);
    }
    this.requestUpdate();
  }

  /**
   * Render a single CSS variable row
   */
  _renderCssVarRow(cssVar) {
    return html`
      <tr>
        <td class="token-path-cell">
          <code>${cssVar.name}</code>
        </td>
        <td class="token-value-cell">
          <div title="${cssVar.value}">${cssVar.value}</div>
        </td>
        <td class="token-preview-cell">
          ${cssVar.isColor ? html`
            <div
              class="color-preview"
              style="background-color: var(${cssVar.name});"
              title="Live preview of ${cssVar.name}">
            </div>
          ` : ''}
        </td>
        <td class="token-actions-cell">
          <div class="token-actions">
            <ha-icon-button
              @click=${(e) => this._copyCssVar(cssVar.name, e)}
              .label=${'Copy CSS variable syntax'}
              title="Copy var(${cssVar.name})"
              .path=${"M12,2A2,2 0 0,1 14,4V8H20A2,2 0 0,1 22,10V20A2,2 0 0,1 20,22H4A2,2 0 0,1 2,20V10A2,2 0 0,1 4,10H10V4A2,2 0 0,1 12,2M12,4V8H14V4H12M4,10V20H20V10H4M7,12H9V18H7V12M11,12H13V18H11V12M15,12H17V18H15V12Z"}>
            </ha-icon-button>
            <ha-icon-button
              @click=${(e) => this._copyValue(cssVar.value, e)}
              .label=${'Copy value'}
              .path=${"M19,21H8V7H19M19,5H8A2,2 0 0,0 6,7V21A2,2 0 0,0 8,23H19A2,2 0 0,0 21,21V7A2,2 0 0,0 19,5M16,1H4A2,2 0 0,0 2,3V17H4V3H16V1Z"}>
            </ha-icon-button>
          </div>
        </td>
      </tr>
    `;
  }

  // Dialog control methods
  _openDialog() {
    lcardsLog.debug('[ThemeTokenBrowser] Opening dialog', {
      tokensCount: this._tokens.length,
      filteredCount: this._filteredTokens.length
    });
    this._dialogOpen = true;
    this._scanCssVariables(); // Scan CSS variables when opening
    this._scanAllCssVariables(); // Scan all CSS variables
    this._detectHaTheme(); // Detect active HA theme
    this._applyFilters(); // Apply initial filters when opening
  }

  _closeDialog() {
    lcardsLog.debug('[ThemeTokenBrowser] Closing dialog');
    this._dialogOpen = false;
  }

  _switchView(view) {
    this._activeView = view;
    this._searchQuery = ''; // Reset search when switching views
    if (view === 'all-vars') {
      this._selectedAllVarsCategory = 'all'; // Reset category filter
    }
    if (view === 'tokens') {
      this._applyFilters();
    } else if (view === 'css-vars') {
      this._applyCssVarFilters();
    } else if (view === 'all-vars') {
      this._applyAllVarsFilters();
    }
    this.requestUpdate();
  }

  _handleSearchInput(e) {
    this._searchQuery = e.target.value.toLowerCase();
    if (this._activeView === 'tokens') {
      this._applyFilters();
    } else if (this._activeView === 'css-vars') {
      this._applyCssVarFilters();
    } else if (this._activeView === 'all-vars') {
      this._applyAllVarsFilters();
    }
  }

  _selectCategory(category) {
    this._selectedCategory = category;
    this._applyFilters();
  }

  _selectAllVarsCategory(category) {
    this._selectedAllVarsCategory = category;
    this.requestUpdate();
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

  _groupTokensByCategory(tokens) {
    const grouped = {};

    tokens.forEach(token => {
      // Extract top-level category from path (e.g., "colors" from "colors.card.background")
      const topCategory = token.path.split('.')[0] || 'other';

      if (!grouped[topCategory]) {
        grouped[topCategory] = [];
      }
      grouped[topCategory].push(token);
    });

    // Sort categories alphabetically
    const sortedGrouped = {};
    Object.keys(grouped).sort().forEach(key => {
      sortedGrouped[key] = grouped[key];
    });

    return sortedGrouped;
  }

  _formatCategoryName(category) {
    // Convert category names to title case with proper spacing
    return category
      .split(/[_-]/)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
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

  /**
   * Scan document for all CSS variables (--lcars-* and --lcards-*)
   */
  _scanCssVariables() {
    try {
      const cssVars = [];
      const styles = getComputedStyle(document.documentElement);

      // Get all CSS properties
      for (let i = 0; i < styles.length; i++) {
        const prop = styles[i];

        // Filter for lcars and lcards variables
        if (prop.startsWith('--lcars-') || prop.startsWith('--lcards-')) {
          const value = styles.getPropertyValue(prop).trim();

          // Categorize by prefix
          const source = prop.startsWith('--lcars-') ? 'HA-LCARS Theme' : 'LCARdS Injected';
          const category = prop.startsWith('--lcars-') ? 'lcars' : 'lcards';

          cssVars.push({
            name: prop,
            value: value,
            source: source,
            category: category,
            isColor: this._isColorValue(value)
          });
        }
      }

      // Sort by name
      cssVars.sort((a, b) => a.name.localeCompare(b.name));

      this._cssVariables = cssVars;
      this._filteredCssVars = cssVars;

      lcardsLog.debug('[ThemeTokenBrowser] Scanned CSS variables', {
        total: cssVars.length,
        lcars: cssVars.filter(v => v.category === 'lcars').length,
        lcards: cssVars.filter(v => v.category === 'lcards').length
      });
    } catch (error) {
      lcardsLog.error('[ThemeTokenBrowser] Error scanning CSS variables:', error);
      this._cssVariables = [];
      this._filteredCssVars = [];
    }
  }

  /**
   * Detect the active Home Assistant theme name
   */
  _detectHaTheme() {
    try {
      // Try multiple methods to detect HA theme

      // Method 1: Check hass.themes
      if (this.hass?.themes?.theme) {
        this._haThemeName = this.hass.themes.theme;
        return;
      }

      // Method 2: Check hass.selectedTheme
      if (this.hass?.selectedTheme) {
        this._haThemeName = this.hass.selectedTheme;
        return;
      }

      // Method 3: Check document data attribute
      const themeAttr = document.documentElement.getAttribute('data-theme');
      if (themeAttr) {
        this._haThemeName = themeAttr;
        return;
      }

      // Method 4: Check for theme in localStorage
      const savedTheme = localStorage.getItem('selectedTheme');
      if (savedTheme) {
        try {
          const parsed = JSON.parse(savedTheme);
          this._haThemeName = parsed.theme || parsed;
          return;
        } catch (e) {
          this._haThemeName = savedTheme;
          return;
        }
      }

      // Fallback
      this._haThemeName = 'Default';

      lcardsLog.debug('[ThemeTokenBrowser] Detected HA theme:', this._haThemeName);
    } catch (error) {
      lcardsLog.warn('[ThemeTokenBrowser] Error detecting HA theme:', error);
      this._haThemeName = 'Unknown';
    }
  }

  /**
   * Apply filters to CSS variables based on search query
   */
  _applyCssVarFilters() {
    let filtered = this._cssVariables;

    // Apply search filter
    if (this._searchQuery) {
      filtered = filtered.filter(v =>
        v.name.toLowerCase().includes(this._searchQuery) ||
        v.value.toLowerCase().includes(this._searchQuery) ||
        v.source.toLowerCase().includes(this._searchQuery)
      );
    }

    this._filteredCssVars = filtered;
    this.requestUpdate();
  }

  /**
   * Scan document for ALL CSS variables
   */
  _scanAllCssVariables() {
    try {
      const allVars = [];
      const styles = getComputedStyle(document.documentElement);

      // Get all CSS properties
      for (let i = 0; i < styles.length; i++) {
        const prop = styles[i];

        // Only include CSS variables (start with --)
        if (prop.startsWith('--')) {
          const value = styles.getPropertyValue(prop).trim();

          // Categorize by prefix (check more specific prefixes first!)
          let category = 'other';
          if (prop.startsWith('--card-mod-')) {
            category = 'card-mod';
          } else if (prop.startsWith('--lcars-')) {
            category = 'lcars';
          } else if (prop.startsWith('--lcards-')) {
            category = 'lcards';
          } else if (prop.startsWith('--mdc-')) {
            category = 'material';
          } else if (prop.startsWith('--ha-')) {
            category = 'ha-specific';
          } else if (prop.startsWith('--state-')) {
            category = 'states';
          } else if (prop.startsWith('--primary-') || prop.startsWith('--secondary-') ||
              prop.startsWith('--accent-') || prop.startsWith('--card-') ||
              prop.startsWith('--divider-') || prop.startsWith('--text-') ||
              prop.startsWith('--disabled-') || prop.startsWith('--sidebar-')) {
            category = 'ha-core';
          } else if (prop.startsWith('--app-')) {
            category = 'app';
          }

          allVars.push({
            name: prop,
            value: value,
            category: category,
            isColor: this._isColorValue(value)
          });
        }
      }

      // Sort by category then name
      allVars.sort((a, b) => {
        if (a.category !== b.category) {
          const order = ['ha-core', 'material', 'ha-specific', 'states', 'card-mod', 'lcars', 'lcards', 'app', 'other'];
          return order.indexOf(a.category) - order.indexOf(b.category);
        }
        return a.name.localeCompare(b.name);
      });

      this._allCssVariables = allVars;
      this._filteredAllVars = allVars;

      lcardsLog.debug('[ThemeTokenBrowser] Scanned all CSS variables', {
        total: allVars.length,
        byCategory: {
          'ha-core': allVars.filter(v => v.category === 'ha-core').length,
          'material': allVars.filter(v => v.category === 'material').length,
          'ha-specific': allVars.filter(v => v.category === 'ha-specific').length,
          'states': allVars.filter(v => v.category === 'states').length,
          'card-mod': allVars.filter(v => v.category === 'card-mod').length,
          'lcars': allVars.filter(v => v.category === 'lcars').length,
          'lcards': allVars.filter(v => v.category === 'lcards').length,
          'app': allVars.filter(v => v.category === 'app').length,
          'other': allVars.filter(v => v.category === 'other').length
        }
      });
    } catch (error) {
      lcardsLog.error('[ThemeTokenBrowser] Error scanning all CSS variables:', error);
      this._allCssVariables = [];
      this._filteredAllVars = [];
    }
  }

  /**
   * Apply filters to all CSS variables based on search query
   */
  _applyAllVarsFilters() {
    let filtered = this._allCssVariables;

    // Apply search filter
    if (this._searchQuery) {
      filtered = filtered.filter(v =>
        v.name.toLowerCase().includes(this._searchQuery) ||
        v.value.toLowerCase().includes(this._searchQuery) ||
        v.category.toLowerCase().includes(this._searchQuery)
      );
    }

    this._filteredAllVars = filtered;
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
        // This is a leaf token - fully resolve it (handles both token references and computed tokens)
        const resolutionInfo = this._fullyResolveTokenValue(currentPath, value);

        tokens.push({
          path: currentPath,
          value: resolutionInfo.finalValue,
          rawValue: value, // Keep original for reference
          resolvedFrom: resolutionInfo.resolvedFrom, // Show what it resolved from (if token reference)
          resolutionChain: resolutionInfo.chain, // Full resolution chain for debugging
          category: currentCategory
        });
      }
    }
  }

  /**
   * Fully resolve a token value through all references
   * Handles:
   * - Direct values: "red", "#ff0000", 14
   * - Token references: "colors.card.button"
   * - Computed tokens: "darken(colors.card.button, 0.35)"
   *
   * Returns resolution info with full chain for debugging
   */
  _fullyResolveTokenValue(tokenPath, rawValue, visited = new Set(), chain = []) {
    const maxDepth = 10; // Prevent infinite recursion

    // Circular reference check
    if (visited.has(tokenPath) || chain.length >= maxDepth) {
      lcardsLog.warn('[ThemeTokenBrowser] Circular reference or max depth:', tokenPath, chain);
      return {
        finalValue: rawValue,
        resolvedFrom: null,
        chain: [...chain, `⚠️ circular/max-depth`],
        error: 'Circular reference or max recursion depth'
      };
    }

    visited.add(tokenPath);
    chain.push(tokenPath);

    try {
      const themeManager = window.lcards?.core?.themeManager;

      // No theme manager - return raw
      if (!themeManager) {
        return {
          finalValue: rawValue,
          resolvedFrom: null,
          chain: [...chain]
        };
      }

      // If it's not a string, it's a literal value (number, boolean, etc.)
      if (typeof rawValue !== 'string') {
        return {
          finalValue: rawValue,
          resolvedFrom: null,
          chain: [...chain]
        };
      }

      // Check if it's a token reference (e.g., "colors.card.button")
      if (this._isUnprefixedTokenReference(rawValue)) {
        // Resolve the referenced token
        const referencedValue = this._getTokenByPath(rawValue);

        if (referencedValue !== undefined && referencedValue !== null) {
          // Recursively resolve the referenced token
          const resolved = this._fullyResolveTokenValue(
            rawValue,
            referencedValue,
            visited,
            [...chain, `→ ${rawValue}`]
          );

          return {
            finalValue: resolved.finalValue,
            resolvedFrom: rawValue, // This token was resolved from another token
            chain: resolved.chain
          };
        } else {
          // Token reference not found - return as-is
          return {
            finalValue: rawValue,
            resolvedFrom: rawValue,
            chain: [...chain, `❌ not found`],
            error: `Token reference not found: ${rawValue}`
          };
        }
      }

      // Check if it's a computed token (darken, lighten, alpha, etc.)
      if (this._looksLikeComputedToken(rawValue)) {
        // Use resolveThemeTokensRecursive to compute it
        // Need to add "theme:" prefix for it to work
        const wrapped = { value: `theme:${rawValue}` };
        const resolved = resolveThemeTokensRecursive(wrapped, themeManager);

        return {
          finalValue: resolved.value,
          resolvedFrom: rawValue, // Original computed expression
          chain: [...chain, `computed → ${resolved.value}`]
        };
      }

      // It's a literal value (CSS value, var(), etc.)
      return {
        finalValue: rawValue,
        resolvedFrom: null,
        chain: [...chain]
      };
    } catch (error) {
      lcardsLog.warn('[ThemeTokenBrowser] Error resolving token:', tokenPath, error);
      return {
        finalValue: rawValue,
        resolvedFrom: null,
        chain: [...chain, `⚠️ error`],
        error: error.message
      };
    }
  }

  /**
   * Check if a string looks like an unprefixed token reference
   * (e.g., "colors.card.button", "typography.fontSize.base", "components.button.text")
   */
  _isUnprefixedTokenReference(value) {
    if (typeof value !== 'string') return false;

    // Token references start with one of these categories
    const tokenCategories = ['colors', 'typography', 'spacing', 'borders', 'effects', 'animations', 'components'];
    return tokenCategories.some(cat => value.startsWith(`${cat}.`));
  }

  /**
   * Get a token value by its path from the active theme
   * (e.g., "colors.card.button" → resolved value)
   */
  _getTokenByPath(path) {
    try {
      const themeManager = window.lcards?.core?.themeManager;
      if (!themeManager) return undefined;

      const theme = themeManager.getActiveTheme();
      if (!theme || !theme.tokens) return undefined;

      // Navigate the token path
      const parts = path.split('.');
      let current = theme.tokens;

      for (const part of parts) {
        if (current && typeof current === 'object' && part in current) {
          current = current[part];
        } else {
          return undefined; // Path not found
        }
      }

      return current;
    } catch (error) {
      lcardsLog.warn('[ThemeTokenBrowser] Error getting token by path:', path, error);
      return undefined;
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
    const tokenSyntax = `theme:${tokenPath}`;

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

    // Check for CSS variables (var() function)
    if (/^var\(/.test(value)) return true;

    // Check for hex colors (#RGB, #RGBA, #RRGGBB, #RRGGBBAA)
    if (/^#[0-9A-Fa-f]{3,8}$/.test(value)) return true;

    // Check for rgb/rgba
    if (/^rgba?\(/.test(value)) return true;

    // Check for hsl/hsla
    if (/^hsla?\(/.test(value)) return true;

    // Check for CSS color functions (color(), lab(), lch(), oklab(), oklch(), color-mix())
    if (/^(color-mix|color|lab|lch|oklab|oklch)\(/.test(value)) return true;

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
   * Copy token syntax to clipboard with visual feedback (style config format - no braces)
   */
  async _copyTokenSyntax(tokenPath, event) {
    const syntax = `theme:${tokenPath}`;
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
   * Copy CSS variable syntax to clipboard with visual feedback
   */
  async _copyCssVar(varName, event) {
    const syntax = `var(${varName})`;
    const button = event.target.closest('ha-icon-button');
    if (!button) return;

    const originalIcon = button.icon;

    try {
      await navigator.clipboard.writeText(syntax);
      lcardsLog.info('[ThemeTokenBrowser] Copied CSS var syntax:', syntax);

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

  async _copyResolvedColor(colorValue, event) {
    const preview = event.target;
    if (!preview) return;

    try {
      // Convert the color to hex if possible
      const hexColor = this._getHexColor(colorValue);
      await navigator.clipboard.writeText(hexColor);
      lcardsLog.info('[ThemeTokenBrowser] Copied hex color:', hexColor);

      // Show success feedback on the preview
      const originalBorder = preview.style.border;
      preview.style.border = '3px solid var(--success-color, #4caf50)';
      preview.style.boxShadow = '0 0 8px var(--success-color, #4caf50)';

      setTimeout(() => {
        preview.style.border = originalBorder;
        preview.style.boxShadow = '';
      }, 1000);
    } catch (error) {
      lcardsLog.error('[ThemeTokenBrowser] Failed to copy color:', error);

      // Show error feedback
      const originalBorder = preview.style.border;
      preview.style.border = '3px solid var(--error-color, #f44336)';

      setTimeout(() => {
        preview.style.border = originalBorder;
      }, 1000);
    }
  }

  _getHexColor(colorValue) {
    // If it's already a hex color, return it
    if (/^#[0-9A-Fa-f]{6}([0-9A-Fa-f]{2})?$/.test(colorValue)) {
      return colorValue;
    }

    // Create a temporary element to let the browser compute the color
    const temp = document.createElement('div');
    temp.style.color = colorValue;
    document.body.appendChild(temp);

    const computed = window.getComputedStyle(temp).color;
    document.body.removeChild(temp);

    // Convert rgb/rgba to hex
    const match = computed.match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*[\d.]+)?\)$/);
    if (match) {
      const r = parseInt(match[1]).toString(16).padStart(2, '0');
      const g = parseInt(match[2]).toString(16).padStart(2, '0');
      const b = parseInt(match[3]).toString(16).padStart(2, '0');
      return `#${r}${g}${b}`;
    }

    // Fallback to original value if conversion fails
    return colorValue;
  }
}

customElements.define('lcards-theme-token-browser-tab', LCARdSThemeTokenBrowserTab);
