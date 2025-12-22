/**
 * LCARdS Provenance Inspector Tab
 *
 * Displays comprehensive provenance information for card configuration:
 * - Config Tree: Hierarchical view of all fields grouped by layer
 * - Theme Tokens: Shows all theme token resolutions and usage
 * - Statistics: Summary metrics and distribution analysis
 *
 * Follows the UX patterns from the Theme Token Browser for consistency.
 */

import { LitElement, html, css } from 'lit';
import { lcardsLog } from '../../../utils/lcards-logging.js';
import '../shared/lcards-collapsible-section.js';

/**
 * Provenance Inspector Tab Component
 */
export class LCARdSProvenanceTab extends LitElement {
  static get properties() {
    return {
      editor: { type: Object },
      config: { type: Object },
      hass: { type: Object },

      // Dialog state
      _dialogOpen: { type: Boolean },
      _isLoading: { type: Boolean },

      // Active view: 'tree', 'tokens', 'stats'
      _activeView: { type: String },

      // Search and filter state
      _searchQuery: { type: String },
      _selectedLayer: { type: String },

      // Data state
      _provenance: { type: Object },
      _filteredFields: { type: Array },
      _collapsedSections: { type: Object, attribute: false },

      // Sort state
      _sortColumn: { type: String },
      _sortDirection: { type: String },

      // Auto-refresh state
      _autoRefresh: { type: Boolean },
      _autoRefreshInterval: { type: Number }
    };
  }

  constructor() {
    super();

    this.card = null;
    this._dialogOpen = false;
    this._isLoading = false;
    this._activeView = 'tree';
    this._searchQuery = '';
    this._selectedLayer = 'all';
    this._provenance = null;
    this._filteredFields = [];
    this._collapsedSections = new Set();
    this._sortColumn = 'path';
    this._sortDirection = 'asc';
    this._autoRefresh = false;
    this._autoRefreshInterval = 5000; // 5 seconds default
    this._refreshTimer = null;
  }

  connectedCallback() {
    super.connectedCallback();
    this._loadProvenance();

    // Set up keyboard shortcuts (capture phase to prevent browser default)
    this._boundHandleKeyDown = this._handleKeyDown.bind(this);
    document.addEventListener('keydown', this._boundHandleKeyDown, true);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    document.removeEventListener('keydown', this._boundHandleKeyDown, true);
    this._stopAutoRefresh();
  }

  static get styles() {
    return css`
      :host {
        display: block;
        width: 100%;
      }

      /* Tab Content - Small card with "Open Inspector" button */
      .tab-content {
        padding: 16px;
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

      .open-inspector-button {
        margin-top: 16px;
      }

      /* Loading State */
      .loading-state {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 48px;
        gap: 16px;
      }

      .loading-state p {
        color: var(--secondary-text-color);
        margin: 0;
      }

      /* Dialog Sizing */
      ha-dialog {
        --mdc-dialog-min-width: 90vw;
        --mdc-dialog-max-width: 1400px;
      }

      /* Dialog Content */
      .dialog-content {
        display: flex;
        flex-direction: column;
        gap: 16px;
        max-height: 70vh;
        overflow: hidden;
      }

      /* Dialog Header */
      .dialog-header {
        display: flex;
        flex-direction: column;
        gap: 12px;
        padding-bottom: 12px;
        border-bottom: 1px solid var(--divider-color);
      }

      /* View Tabs */
      .tabs-container {
        display: flex;
        gap: 8px;
        border-bottom: 2px solid var(--divider-color);
      }

      .view-tab {
        padding: 12px 24px;
        background: none;
        border: none;
        border-bottom: 3px solid transparent;
        color: var(--secondary-text-color);
        font-size: 14px;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s;
      }

      .view-tab:hover {
        background: var(--secondary-background-color);
        color: var(--primary-text-color);
      }

      .view-tab.active {
        border-bottom-color: var(--mdc-theme-primary, #03a9f4);
        color: var(--mdc-theme-primary, #03a9f4);
      }

      /* Card Info Badges */
      .card-info {
        display: flex;
        gap: 16px;
        flex-wrap: wrap;
      }

      .info-badge {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 8px 12px;
        background: var(--secondary-background-color);
        border-radius: 16px;
        font-size: 13px;
      }

      .info-badge strong {
        color: var(--primary-text-color);
      }

      .info-badge span {
        color: var(--secondary-text-color);
      }

      /* Search Container */
      .search-container {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }

      .search-wrapper {
        position: relative;
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .dialog-search {
        flex: 1;
      }

      .search-clear {
        position: absolute;
        right: 8px;
      }

      .search-result-count {
        font-size: 13px;
        color: var(--secondary-text-color);
        padding-left: 8px;
      }

      /* Layer Filters */
      .layer-filters {
        display: flex;
        gap: 8px;
        flex-wrap: wrap;
      }

      .layer-chip {
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

      .layer-chip:hover {
        background: var(--primary-color);
        color: white;
        border-color: var(--primary-color);
      }

      .layer-chip.selected {
        background: var(--primary-color);
        color: white;
        border-color: var(--primary-color);
      }

      /* Auto-refresh Controls */
      .refresh-controls {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 8px 12px;
        background: var(--secondary-background-color);
        border-radius: 8px;
        font-size: 13px;
      }

      .refresh-controls label {
        display: flex;
        align-items: center;
        gap: 6px;
        cursor: pointer;
      }

      .refresh-controls input[type="number"] {
        width: 60px;
        padding: 4px 8px;
        border: 1px solid var(--divider-color);
        border-radius: 4px;
        background: var(--primary-background-color);
        color: var(--primary-text-color);
      }

      /* Dialog Body */
      .dialog-body {
        flex: 1;
        overflow-y: auto;
        padding: 8px;
      }

      /* Field Table */
      .field-table {
        width: 100%;
        border-collapse: collapse;
      }

      .field-table thead {
        background: var(--secondary-background-color);
        position: sticky;
        top: 0;
        z-index: 1;
      }

      .field-table th {
        padding: 10px 12px;
        text-align: left;
        font-size: 12px;
        font-weight: 500;
        color: var(--secondary-text-color);
        text-transform: uppercase;
        cursor: pointer;
        user-select: none;
      }

      .field-table th:hover {
        background: var(--primary-background-color);
      }

      .sort-indicator {
        margin-left: 4px;
        font-size: 10px;
      }

      .field-table tbody tr {
        border-bottom: 1px solid var(--divider-color);
        transition: background 0.2s;
      }

      .field-table tbody tr:hover {
        background: var(--secondary-background-color);
      }

      .field-table td {
        padding: 10px 12px;
        font-size: 13px;
      }

      .field-path-cell {
        font-family: 'Roboto Mono', monospace;
        color: var(--primary-text-color);
        font-weight: 500;
      }

      .field-value-cell {
        max-width: 300px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        color: var(--secondary-text-color);
      }

      .field-source-cell {
        font-size: 12px;
        color: var(--secondary-text-color);
      }

      .field-actions-cell {
        width: 100px;
      }

      .field-actions {
        display: flex;
        gap: 4px;
      }

      /* Color Preview */
      .color-preview {
        width: 32px;
        height: 32px;
        border-radius: 4px;
        border: 1px solid var(--divider-color);
        cursor: pointer;
      }

      .color-preview:hover {
        border-color: var(--mdc-theme-primary, #03a9f4);
      }

      /* Token Resolution Display */
      .token-resolution {
        display: flex;
        flex-direction: column;
        gap: 4px;
        font-size: 12px;
      }

      .raw-value {
        color: var(--secondary-text-color);
        font-family: 'Roboto Mono', monospace;
      }

      .resolution-arrow {
        color: var(--disabled-text-color);
        font-size: 11px;
      }

      .resolved-value {
        color: var(--primary-text-color);
        font-weight: 500;
      }

      /* Empty State */
      .empty-state {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 64px 24px;
        gap: 16px;
      }

      .empty-state ha-icon {
        --mdc-icon-size: 64px;
        color: var(--disabled-text-color);
      }

      .empty-state p {
        margin: 0;
        color: var(--secondary-text-color);
        text-align: center;
      }

      .empty-state p:first-of-type {
        font-size: 16px;
        font-weight: 500;
        color: var(--primary-text-color);
      }

      /* Statistics View */
      .stats-container {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
        gap: 16px;
        padding: 16px;
      }

      .stat-card {
        background: var(--secondary-background-color);
        border: 1px solid var(--divider-color);
        border-radius: 8px;
        padding: 20px;
      }

      .stat-title {
        font-size: 13px;
        color: var(--secondary-text-color);
        text-transform: uppercase;
        margin-bottom: 8px;
      }

      .stat-value {
        font-size: 32px;
        font-weight: 500;
        color: var(--primary-text-color);
      }

      .stat-subtitle {
        font-size: 12px;
        color: var(--secondary-text-color);
        margin-top: 4px;
      }

      /* Layer Distribution Chart */
      .layer-distribution {
        display: flex;
        flex-direction: column;
        gap: 12px;
      }

      .distribution-bar {
        display: flex;
        align-items: center;
        gap: 12px;
      }

      .distribution-label {
        width: 100px;
        font-size: 13px;
        color: var(--secondary-text-color);
      }

      .distribution-track {
        flex: 1;
        height: 24px;
        background: var(--divider-color);
        border-radius: 12px;
        overflow: hidden;
        position: relative;
      }

      .distribution-fill {
        height: 100%;
        transition: width 0.3s;
        display: flex;
        align-items: center;
        justify-content: flex-end;
        padding-right: 8px;
      }

      .distribution-fill.defaults {
        background: #9e9e9e;
      }

      .distribution-fill.theme {
        background: #2196f3;
      }

      .distribution-fill.user {
        background: #4caf50;
      }

      .distribution-fill.presets {
        background: #ff9800;
      }

      .distribution-fill.rules {
        background: #f44336;
      }

      .distribution-count {
        font-size: 12px;
        color: white;
        font-weight: 500;
      }

      /* Token Usage Table */
      .token-table {
        width: 100%;
        border-collapse: collapse;
      }

      .token-table th,
      .token-table td {
        padding: 12px;
        text-align: left;
        border-bottom: 1px solid var(--divider-color);
      }

      .token-table th {
        background: var(--secondary-background-color);
        font-size: 12px;
        font-weight: 500;
        color: var(--secondary-text-color);
        text-transform: uppercase;
      }

      .token-path-cell {
        font-family: 'Roboto Mono', monospace;
        font-size: 13px;
      }

      .token-used-by-cell {
        font-size: 12px;
        color: var(--secondary-text-color);
      }

      .token-used-by-cell code {
        background: var(--secondary-background-color);
        padding: 2px 6px;
        border-radius: 3px;
        margin: 2px;
        display: inline-block;
      }
    `;
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
          <p>Loading provenance data...</p>
        </div>
      `;
    }

    const stats = this._getStats();

    return html`
      <div class="tab-content">
        <div class="info-card">
          <h3>🔍 Provenance Inspector</h3>
          <p>
            <strong>${stats.totalFields} fields</strong> tracked across <strong>${stats.layerCount} layers</strong>
            ${stats.tokenCount > 0 ? html`<br /><strong>${stats.tokenCount} theme tokens</strong> resolved` : ''}
          </p>
          <p style="font-size: 13px; color: var(--secondary-text-color);">
            Explore where each configuration value comes from: defaults, theme, user config, presets, or dynamic rules.
          </p>
          <ha-button
            class="open-inspector-button"
            raised
            @click=${this._openDialog}>
            <ha-icon icon="mdi:file-tree" slot="icon"></ha-icon>
            Open Provenance Inspector
          </ha-button>
        </div>
      </div>
    `;
  }

  _renderDialog() {
    if (!this._dialogOpen) return '';

    return html`
      <ha-dialog
        open
        @closed=${this._closeDialog}
        .heading=${'Provenance Inspector'}>
        <div class="dialog-content">
          ${this._renderDialogHeader()}
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
    const stats = this._getStats();

    return html`
      <div class="dialog-header">
        <div class="tabs-container">
          <button
            class="view-tab ${this._activeView === 'tree' ? 'active' : ''}"
            @click=${() => this._switchView('tree')}>
            Config Tree (${stats.totalFields} fields)
          </button>
          <button
            class="view-tab ${this._activeView === 'tokens' ? 'active' : ''}"
            @click=${() => this._switchView('tokens')}>
            Theme Tokens (${stats.tokenCount})
          </button>
          <button
            class="view-tab ${this._activeView === 'stats' ? 'active' : ''}"
            @click=${() => this._switchView('stats')}>
            Statistics
          </button>
        </div>

        <div class="card-info">
          <div class="info-badge">
            <strong>Card:</strong>
            <span>${this._provenance?.config?.card_type || 'unknown'}</span>
          </div>
          <div class="info-badge">
            <strong>Tracked:</strong>
            <span>${stats.totalFields} fields</span>
          </div>
          <div class="info-badge">
            <strong>Layers:</strong>
            <span>${stats.layerCount}</span>
          </div>
        </div>

        ${this._activeView !== 'stats' ? html`
          <div class="search-container">
            <div class="search-wrapper">
              <ha-textfield
                class="dialog-search"
                .value=${this._searchQuery}
                @input=${this._handleSearchInput}
                placeholder="Search fields... (Ctrl+F)"
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
            ${this._searchQuery ? this._renderResultCount() : ''}
          </div>
        ` : ''}

        ${this._activeView === 'tree' ? this._renderLayerFilters() : ''}

        <div class="refresh-controls">
          <ha-icon-button
            @click=${this._manualRefresh}
            .label=${'Refresh now'}
            .path=${"M17.65,6.35C16.2,4.9 14.21,4 12,4A8,8 0 0,0 4,12A8,8 0 0,0 12,20C15.73,20 18.84,17.45 19.73,14H17.65C16.83,16.33 14.61,18 12,18A6,6 0 0,1 6,12A6,6 0 0,1 12,6C13.66,6 15.14,6.69 16.22,7.78L13,11H20V4L17.65,6.35Z"}>
          </ha-icon-button>
          <label>
            <input
              type="checkbox"
              .checked=${this._autoRefresh}
              @change=${this._toggleAutoRefresh} />
            Auto-refresh every
          </label>
          <input
            type="number"
            min="1"
            max="60"
            .value=${String(this._autoRefreshInterval / 1000)}
            @change=${this._updateRefreshInterval}
            ?disabled=${!this._autoRefresh} />
          <span>seconds</span>
        </div>
      </div>
    `;
  }

  _renderResultCount() {
    const totalCount = this._getAllFields().length;
    const filteredCount = this._filteredFields.length;

    return html`
      <div class="search-result-count">
        Showing ${filteredCount} of ${totalCount} fields
      </div>
    `;
  }

  _renderLayerFilters() {
    const layers = this._getLayers();
    const filters = [
      { label: 'All', value: 'all', count: this._getAllFields().length },
      ...layers
    ];

    return html`
      <div class="layer-filters">
        ${filters.map(filter => html`
          <button
            class="layer-chip ${this._selectedLayer === filter.value ? 'selected' : ''}"
            @click=${() => this._selectLayer(filter.value)}>
            ${filter.label} (${filter.count})
          </button>
        `)}
      </div>
    `;
  }

  _renderDialogBody() {
    if (this._activeView === 'tokens') {
      return this._renderTokensView();
    }

    if (this._activeView === 'stats') {
      return this._renderStatsView();
    }

    // Default: tree view
    return this._renderTreeView();
  }

  _renderTreeView() {
    if (!this._provenance || !this._provenance.config || !this._provenance.config.field_sources) {
      return html`
        <div class="empty-state">
          <ha-icon icon="mdi:file-tree"></ha-icon>
          <p>No provenance data available</p>
          <p style="font-size: 13px;">The card may not have been initialized yet.</p>
        </div>
      `;
    }

    this._applyFilters();

    if (this._filteredFields.length === 0) {
      return html`
        <div class="empty-state">
          <ha-icon icon="mdi:${this._searchQuery ? 'magnify-remove-outline' : 'file-tree'}"></ha-icon>
          <p>${this._searchQuery ? `No fields found matching "${this._searchQuery}"` : 'No fields found'}</p>
          <p style="font-size: 13px;">
            ${this._searchQuery
              ? 'Try a different search term, or clear the search to see all fields.'
              : this._selectedLayer !== 'all'
                ? 'Try selecting a different layer or "All" to see more fields.'
                : 'No configuration fields are tracked.'}
          </p>
        </div>
      `;
    }

    // Group fields by layer
    const groupedFields = this._groupFieldsByLayer(this._filteredFields);

    return html`
      <div class="dialog-body">
        ${Object.entries(groupedFields).map(([layer, fields]) => this._renderLayerSection(layer, fields))}
      </div>
    `;
  }

  _renderLayerSection(layer, fields) {
    const isExpanded = !this._collapsedSections.has(layer);
    const sortedFields = this._sortFields(fields);

    return html`
      <lcards-collapsible-section
        .title=${this._formatLayerName(layer)}
        .badge=${layer}
        .badgeType=${layer}
        .count=${fields.length}
        .countLabel=${'fields'}
        ?expanded=${isExpanded}
        @toggle=${() => this._toggleSection(layer)}>
        <table class="field-table">
          <thead>
            <tr>
              <th @click=${() => this._sortBy('path')}>
                Field Path
                ${this._sortColumn === 'path' ? html`<span class="sort-indicator">${this._sortDirection === 'asc' ? '▲' : '▼'}</span>` : ''}
              </th>
              <th @click=${() => this._sortBy('value')}>
                Value
                ${this._sortColumn === 'value' ? html`<span class="sort-indicator">${this._sortDirection === 'asc' ? '▲' : '▼'}</span>` : ''}
              </th>
              <th>Source</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            ${sortedFields.map(field => this._renderFieldRow(field))}
          </tbody>
        </table>
      </lcards-collapsible-section>
    `;
  }

  _renderFieldRow(field) {
    const displayValue = this._formatValue(field.value);

    return html`
      <tr>
        <td class="field-path-cell">${field.path}</td>
        <td class="field-value-cell" title="${displayValue}">
          ${displayValue}
        </td>
        <td class="field-source-cell">${field.source || field.layer}</td>
        <td class="field-actions-cell">
          <div class="field-actions">
            <ha-icon-button
              @click=${(e) => this._copyFieldPath(field.path, e)}
              .label=${'Copy field path'}
              .path=${"M19,21H8V7H19M19,5H8A2,2 0 0,0 6,7V21A2,2 0 0,0 8,23H19A2,2 0 0,0 21,21V7A2,2 0 0,0 19,5M16,1H4A2,2 0 0,0 2,3V17H4V3H16V1Z"}>
            </ha-icon-button>
            <ha-icon-button
              @click=${(e) => this._copyValue(field.value, e)}
              .label=${'Copy value'}
              .path=${"M19,21H8V7H19M19,5H8A2,2 0 0,0 6,7V21A2,2 0 0,0 8,23H19A2,2 0 0,0 21,21V7A2,2 0 0,0 19,5M16,1H4A2,2 0 0,0 2,3V17H4V3H16V1Z"}>
            </ha-icon-button>
          </div>
        </td>
      </tr>
    `;
  }

  _renderTokensView() {
    if (!this._provenance || !this._provenance.theme_tokens) {
      return html`
        <div class="empty-state">
          <ha-icon icon="mdi:palette"></ha-icon>
          <p>No theme tokens tracked</p>
          <p style="font-size: 13px;">This card has not resolved any theme tokens yet.</p>
        </div>
      `;
    }

    const tokens = Object.entries(this._provenance.theme_tokens).map(([path, data]) => ({
      path,
      ...data
    }));

    if (tokens.length === 0) {
      return html`
        <div class="empty-state">
          <ha-icon icon="mdi:palette"></ha-icon>
          <p>No theme tokens tracked</p>
          <p style="font-size: 13px;">This card has not resolved any theme tokens yet.</p>
        </div>
      `;
    }

    return html`
      <div class="dialog-body">
        <table class="token-table">
          <thead>
            <tr>
              <th>Token Path</th>
              <th>Used By</th>
              <th>Resolved Value</th>
              <th>Preview</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            ${tokens.map(token => this._renderTokenRow(token))}
          </tbody>
        </table>
      </div>
    `;
  }

  _renderTokenRow(token) {
    const displayValue = this._formatValue(token.resolved_value);
    const usedByFields = token.used_by_fields || [];

    return html`
      <tr>
        <td class="token-path-cell">theme:${token.path}</td>
        <td class="token-used-by-cell">
          ${usedByFields.length > 0 ? html`
            ${usedByFields.map(field => html`<code>${field}</code>`)}
          ` : html`<span style="color: var(--disabled-text-color);">Not tracked</span>`}
        </td>
        <td class="field-value-cell" title="${displayValue}">
          ${displayValue}
        </td>
        <td>
          ${this._isColorValue(token.resolved_value) ? html`
            <div
              class="color-preview"
              style="background-color: ${token.resolved_value};"
              title="${token.resolved_value}"
              @click=${(e) => this._copyValue(token.resolved_value, e)}>
            </div>
          ` : ''}
        </td>
        <td class="field-actions-cell">
          <div class="field-actions">
            <ha-icon-button
              @click=${(e) => this._copyTokenSyntax(token.path, e)}
              .label=${'Copy token syntax'}
              .path=${"M19,21H8V7H19M19,5H8A2,2 0 0,0 6,7V21A2,2 0 0,0 8,23H19A2,2 0 0,0 21,21V7A2,2 0 0,0 19,5M16,1H4A2,2 0 0,0 2,3V17H4V3H16V1Z"}>
            </ha-icon-button>
            <ha-icon-button
              @click=${(e) => this._copyValue(token.resolved_value, e)}
              .label=${'Copy value'}
              .path=${"M19,21H8V7H19M19,5H8A2,2 0 0,0 6,7V21A2,2 0 0,0 8,23H19A2,2 0 0,0 21,21V7A2,2 0 0,0 19,5M16,1H4A2,2 0 0,0 2,3V17H4V3H16V1Z"}>
            </ha-icon-button>
          </div>
        </td>
      </tr>
    `;
  }

  _renderStatsView() {
    const stats = this._getDetailedStats();

    return html`
      <div class="dialog-body">
        <div class="stats-container">
          <div class="stat-card">
            <div class="stat-title">Total Fields</div>
            <div class="stat-value">${stats.totalFields}</div>
            <div class="stat-subtitle">Configuration fields tracked</div>
          </div>

          <div class="stat-card">
            <div class="stat-title">Active Layers</div>
            <div class="stat-value">${stats.layerCount}</div>
            <div class="stat-subtitle">Configuration layers</div>
          </div>

          <div class="stat-card">
            <div class="stat-title">Theme Tokens</div>
            <div class="stat-value">${stats.tokenCount}</div>
            <div class="stat-subtitle">Resolved tokens</div>
          </div>

          <div class="stat-card">
            <div class="stat-title">User Overrides</div>
            <div class="stat-value">${stats.userOverrides}</div>
            <div class="stat-subtitle">Custom configurations</div>
          </div>
        </div>

        <div class="stat-card" style="margin: 16px;">
          <div class="stat-title">Layer Distribution</div>
          <div class="layer-distribution">
            ${Object.entries(stats.layerDistribution).map(([layer, count]) => html`
              <div class="distribution-bar">
                <div class="distribution-label">${this._formatLayerName(layer)}</div>
                <div class="distribution-track">
                  <div
                    class="distribution-fill ${layer}"
                    style="width: ${(count / stats.totalFields) * 100}%">
                    <span class="distribution-count">${count}</span>
                  </div>
                </div>
              </div>
            `)}
          </div>
        </div>

        ${stats.topTokens.length > 0 ? html`
          <div class="stat-card" style="margin: 16px;">
            <div class="stat-title">Top Theme Tokens</div>
            <table class="token-table">
              <thead>
                <tr>
                  <th>Token Path</th>
                  <th>Usage Count</th>
                  <th>Resolved Value</th>
                </tr>
              </thead>
              <tbody>
                ${stats.topTokens.map(token => html`
                  <tr>
                    <td class="token-path-cell">theme:${token.path}</td>
                    <td>${token.count}</td>
                    <td class="field-value-cell">${this._formatValue(token.value)}</td>
                  </tr>
                `)}
              </tbody>
            </table>
          </div>
        ` : ''}
      </div>
    `;
  }

  // ========================================================================
  // Event Handlers
  // ========================================================================

  _openDialog() {
    this._dialogOpen = true;
    this._loadProvenance();
  }

  _closeDialog() {
    this._dialogOpen = false;
    this._stopAutoRefresh();
  }

  _switchView(view) {
    this._activeView = view;
    this._searchQuery = '';
    this._selectedLayer = 'all';
  }

  _handleSearchInput(e) {
    this._searchQuery = e.target.value;
    this._applyFilters();
  }

  _clearSearch() {
    this._searchQuery = '';
    this._applyFilters();
  }

  _selectLayer(layer) {
    this._selectedLayer = layer;
    this._applyFilters();
  }

  _toggleSection(section) {
    if (this._collapsedSections.has(section)) {
      this._collapsedSections.delete(section);
    } else {
      this._collapsedSections.add(section);
    }
    this.requestUpdate();
  }

  _sortBy(column) {
    if (this._sortColumn === column) {
      this._sortDirection = this._sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this._sortColumn = column;
      this._sortDirection = 'asc';
    }
  }

  _manualRefresh() {
    this._loadProvenance();
    this._showToast('Provenance data refreshed');
  }

  _toggleAutoRefresh(e) {
    this._autoRefresh = e.target.checked;
    if (this._autoRefresh) {
      this._startAutoRefresh();
    } else {
      this._stopAutoRefresh();
    }
  }

  _updateRefreshInterval(e) {
    const seconds = parseInt(e.target.value, 10);
    if (seconds >= 1 && seconds <= 60) {
      this._autoRefreshInterval = seconds * 1000;
      if (this._autoRefresh) {
        this._stopAutoRefresh();
        this._startAutoRefresh();
      }
    }
  }

  _handleKeyDown(e) {
    // Only handle when dialog is open
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

  async _copyFieldPath(path, e) {
    e.stopPropagation();
    await this._copyToClipboard(path);
    this._showToast(`Copied field path: ${path}`);
  }

  async _copyValue(value, e) {
    e.stopPropagation();
    const displayValue = typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value);
    await this._copyToClipboard(displayValue);
    this._showToast('Copied value!');
  }

  async _copyTokenSyntax(tokenPath, e) {
    e.stopPropagation();
    const syntax = `theme:${tokenPath}`;
    await this._copyToClipboard(syntax);
    this._showToast(`Copied: ${syntax}`);
  }

  async _copyToClipboard(text) {
    try {
      await navigator.clipboard.writeText(text);
    } catch (err) {
      lcardsLog.error('[ProvenanceTab] Failed to copy to clipboard:', err);
    }
  }

  _showToast(message) {
    // Use Home Assistant's toast notification system
    const event = new CustomEvent('hass-notification', {
      detail: { message },
      bubbles: true,
      composed: true
    });
    this.dispatchEvent(event);
  }

  // ========================================================================
  // Data Management
  // ========================================================================

  async _loadProvenance() {
    try {
      // Find the actual rendered card in the DOM (it's in the preview panel, not the editor)
      let card = null;

      if (!this.config) {
        lcardsLog.warn('[ProvenanceTab] No config available');
        this._provenance = null;
        return;
      }

      const cardType = this.config.type?.replace('custom:', '') || 'lcards-button';

      // Strategy 1: Search up through parent shadow roots (editor might be nested)
      let searchRoot = this.getRootNode();

      let attempts = 0;
      while (searchRoot && attempts < 10) {
        const selectors = [
          `.element-preview ${cardType}`,
          `hui-card ${cardType}`,
          cardType
        ];

        for (const selector of selectors) {
          card = searchRoot.querySelector?.(selector);
          if (card) break;
        }

        if (card) break;

        // Move to parent shadow root
        if (searchRoot.host) {
          searchRoot = searchRoot.host.getRootNode();
        } else {
          break;
        }
        attempts++;
      }

      // Strategy 2: If not found, the preview might be a sibling in the document
      // Search the entire document including all shadow roots
      if (!card) {
        lcardsLog.debug('[ProvenanceTab] Card not found in parent chain, searching document...');

        // Helper to recursively search shadow roots
        const searchInShadowRoots = (root) => {
          if (!root) return null;

          // Try direct selectors
          for (const selector of [`.element-preview ${cardType}`, `hui-card ${cardType}`, cardType]) {
            const found = root.querySelector?.(selector);
            if (found) return found;
          }

          // Recursively search child shadow roots
          const allElements = root.querySelectorAll?.('*') || [];
          for (const el of allElements) {
            if (el.shadowRoot) {
              const found = searchInShadowRoots(el.shadowRoot);
              if (found) return found;
            }
          }
          return null;
        };

        card = searchInShadowRoots(document);
        if (card) {
          lcardsLog.debug('[ProvenanceTab] Found card via recursive document search');
        }
      }

      // If we couldn't find the card, bail out
      if (!card) {
        lcardsLog.warn('[ProvenanceTab] Could not find rendered card in DOM after searching', attempts, 'shadow roots');
        this._provenance = null;
        return;
      }

      // Check if card supports provenance
      if (typeof card.getProvenance !== 'function') {
        lcardsLog.warn('[ProvenanceTab] Card does not support provenance tracking:', card.tagName);
        this._provenance = null;
        return;
      }

      // Get provenance from the actual rendered card
      this._provenance = card.getProvenance();
      lcardsLog.debug('[ProvenanceTab] Loaded provenance from rendered card:', this._provenance);

      // Debug: Check structure in detail
      if (this._provenance) {
        lcardsLog.debug('[ProvenanceTab] Provenance keys:', Object.keys(this._provenance));
        if (this._provenance.config) {
          lcardsLog.debug('[ProvenanceTab] Config keys:', Object.keys(this._provenance.config));

          // Check card_type
          lcardsLog.debug('[ProvenanceTab] Card type:', this._provenance.config.card_type);

          // Sample a field
          const fieldSources = this._provenance.config.field_sources;
          if (fieldSources) {
            const sampleKey = Object.keys(fieldSources)[0];
            lcardsLog.debug('[ProvenanceTab] Sample field key:', sampleKey);
            lcardsLog.debug('[ProvenanceTab] Sample field data:', fieldSources[sampleKey]);
          }
        }

        // Check theme tokens
        if (this._provenance.theme_tokens) {
          lcardsLog.debug('[ProvenanceTab] Theme tokens keys:', Object.keys(this._provenance.theme_tokens));
          const sampleTokenKey = Object.keys(this._provenance.theme_tokens)[0];
          if (sampleTokenKey) {
            lcardsLog.debug('[ProvenanceTab] Sample token:', sampleTokenKey, '=', this._provenance.theme_tokens[sampleTokenKey]);
          }
        }
      }

      this._applyFilters();

    } catch (error) {
      lcardsLog.error('[ProvenanceTab] Failed to load provenance:', error);
      this._provenance = null;
    }
  }

  _startAutoRefresh() {
    this._refreshTimer = setInterval(() => {
      this._loadProvenance();
    }, this._autoRefreshInterval);
  }

  _stopAutoRefresh() {
    if (this._refreshTimer) {
      clearInterval(this._refreshTimer);
      this._refreshTimer = null;
    }
  }

  _getAllFields() {
    if (!this._provenance || !this._provenance.config || !this._provenance.config.field_sources) {
      return [];
    }

    const fieldSources = this._provenance.config.field_sources;
    const tree = this._provenance.config.tree || {};

    // field_sources maps path -> layer_name (string)
    // We need to get actual values from the tree
    const fields = Object.entries(fieldSources).map(([path, layerName]) => {
      // Try to get the value from the merged tree
      let value = this._getValueFromTree(tree, path);

      return {
        path,
        value: value,
        layer: layerName,
        source: layerName // Use layer name as source
      };
    });

    lcardsLog.debug('[ProvenanceTab] _getAllFields returning:', fields.length, 'fields');
    return fields;
  }

  _getValueFromTree(tree, path) {
    // Navigate through nested object using dot-notation path
    const parts = path.split('.');
    let current = tree;

    for (const part of parts) {
      if (current && typeof current === 'object' && part in current) {
        current = current[part];
      } else {
        return undefined;
      }
    }

    return current;
  }

  _applyFilters() {
    let fields = this._getAllFields();

    // Filter by layer
    if (this._selectedLayer !== 'all') {
      fields = fields.filter(f => f.layer === this._selectedLayer);
    }

    // Filter by search query
    if (this._searchQuery) {
      const query = this._searchQuery.toLowerCase();
      fields = fields.filter(f =>
        f.path.toLowerCase().includes(query) ||
        String(f.value).toLowerCase().includes(query) ||
        (f.source || '').toLowerCase().includes(query)
      );
    }

    this._filteredFields = fields;
  }

  _groupFieldsByLayer(fields) {
    const grouped = {};
    for (const field of fields) {
      const layer = field.layer || 'unknown';
      if (!grouped[layer]) {
        grouped[layer] = [];
      }
      grouped[layer].push(field);
    }
    return grouped;
  }

  _sortFields(fields) {
    const sorted = [...fields];
    sorted.sort((a, b) => {
      let aVal, bVal;

      if (this._sortColumn === 'path') {
        aVal = a.path;
        bVal = b.path;
      } else if (this._sortColumn === 'value') {
        aVal = String(a.value);
        bVal = String(b.value);
      } else {
        return 0;
      }

      if (this._sortDirection === 'asc') {
        return aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
      } else {
        return aVal > bVal ? -1 : aVal < bVal ? 1 : 0;
      }
    });

    return sorted;
  }

  _getLayers() {
    const fields = this._getAllFields();
    const layerCounts = {};

    for (const field of fields) {
      const layer = field.layer || 'unknown';
      layerCounts[layer] = (layerCounts[layer] || 0) + 1;
    }

    return Object.entries(layerCounts).map(([value, count]) => ({
      label: this._formatLayerName(value),
      value,
      count
    }));
  }

  _getStats() {
    const fields = this._getAllFields();
    const layers = new Set(fields.map(f => f.layer));
    const tokenCount = this._provenance?.theme_tokens
      ? Object.keys(this._provenance.theme_tokens).length
      : 0;

    return {
      totalFields: fields.length,
      layerCount: layers.size,
      tokenCount
    };
  }

  _getDetailedStats() {
    const fields = this._getAllFields();
    const layerDistribution = {};
    let userOverrides = 0;

    for (const field of fields) {
      const layer = field.layer || 'unknown';
      layerDistribution[layer] = (layerDistribution[layer] || 0) + 1;
      if (layer === 'user') {
        userOverrides++;
      }
    }

    const tokenCount = this._provenance?.theme_tokens
      ? Object.keys(this._provenance.theme_tokens).length
      : 0;

    // Top tokens by usage
    const tokenUsage = {};
    if (this._provenance?.theme_tokens) {
      for (const [path, data] of Object.entries(this._provenance.theme_tokens)) {
        const usedByCount = data.used_by ? data.used_by.length : 0;
        tokenUsage[path] = {
          count: usedByCount,
          value: data.resolved_value
        };
      }
    }

    const topTokens = Object.entries(tokenUsage)
      .sort(([, a], [, b]) => b.count - a.count)
      .slice(0, 5)
      .map(([path, data]) => ({
        path,
        count: data.count,
        value: data.value
      }));

    return {
      totalFields: fields.length,
      layerCount: Object.keys(layerDistribution).length,
      tokenCount,
      userOverrides,
      layerDistribution,
      topTokens
    };
  }

  // ========================================================================
  // Utility Methods
  // ========================================================================

  _formatLayerName(layer) {
    const names = {
      'defaults': 'Defaults',
      'theme': 'Theme',
      'user': 'User Config',
      'presets': 'Presets',
      'rules': 'Dynamic Rules',
      'templates': 'Templates',
      'unknown': 'Unknown'
    };
    return names[layer] || layer;
  }

  _formatValue(value) {
    if (value === undefined || value === null) {
      return '(no value)';
    }

    if (typeof value === 'object') {
      if (Array.isArray(value)) {
        return `[Array: ${value.length} items]`;
      }
      try {
        const json = JSON.stringify(value, null, 2);
        return json.length < 100 ? json : `{Object: ${Object.keys(value).length} keys}`;
      } catch (e) {
        return '[Complex Object]';
      }
    }

    return String(value);
  }

  _isColorValue(value) {
    if (typeof value !== 'string') return false;

    // Check for common CSS color formats
    return /^#[0-9A-Fa-f]{3,8}$/.test(value) ||
           /^rgb\(/.test(value) ||
           /^rgba\(/.test(value) ||
           /^hsl\(/.test(value) ||
           /^hsla\(/.test(value) ||
           /^var\(--.*color.*\)/.test(value);
  }
}

customElements.define('lcards-provenance-tab', LCARdSProvenanceTab);
