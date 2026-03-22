/**
 * @fileoverview LCARdS Provenance Inspector Tab
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
import { editorStyles } from '../../base/editor-styles.js';
import '../shared/lcards-form-section.js';

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

    // Version check - Enhanced provenance visualizations
    lcardsLog.info('[ProvenanceTab] Loading enhanced version with badges, resolution chains, and collapsible sections');

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

    // New: Tree view state
    this._expandedNodes = new Set(); // Track expanded tree nodes
    this._selectedNode = null; // Currently selected node for detail view
    this._tree = null; // Cached config tree
    this._collapsedDetailSections = new Set(); // Track collapsed detail panel sections
  }

  connectedCallback() {
    super.connectedCallback();

    // Only load provenance if config is already available
    // Otherwise wait for config to be set (will trigger via property change)
    // @ts-ignore - TS2339: auto-suppressed
    if (this.config && this.config.type) {
      this._loadProvenance();
    } else {
      lcardsLog.debug('[ProvenanceTab] Waiting for config to be set before loading provenance');
    }

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
    return [
      editorStyles,
      css`
        /* Loading State */
        .loading-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 48px;
          gap: 12px;
        }

      .loading-state p {
        color: var(--secondary-text-color);
        margin: 0;
      }

      /* Dialog Sizing */
      ha-dialog {
        --ha-dialog-width-md: 90vw;
      }

      /* Dialog Content */
      .dialog-content {
        display: flex;
        flex-direction: column;
        gap: 12px;
        height: 75vh;
        max-height: 75vh;
        overflow: hidden;
      }

      /* Dialog Header */
      .dialog-header {
        display: flex;
        flex-direction: column;
        gap: 8px;
        padding-bottom: 8px;
        border-bottom: 1px solid var(--divider-color);
        flex-shrink: 0;
      }

      /* View Tabs */
      .tabs-container {
        display: flex;
        gap: 4px;
        border-bottom: 2px solid var(--divider-color);
      }

      /* HA native tab styling (Issue #82) */
      ha-tab-group {
        display: block;
        margin-bottom: 12px;
      }

      ha-tab-group-tab ha-icon {
        --mdc-icon-size: 18px;
        margin-right: 6px;
      }

      ha-tab-group-tab .tab-count {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-width: 20px;
        padding: 2px 6px;
        background: var(--secondary-background-color);
        border-radius: 10px;
        font-size: 11px;
        font-weight: 600;
        margin-left: 6px;
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
        gap: 12px;
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
      .stats-header {
        padding: 20px 20px 0;
      }

      .stats-header h3 {
        margin: 0 0 8px 0;
        font-size: 20px;
        font-weight: 500;
        color: var(--primary-text-color);
      }

      .stats-subtitle {
        display: flex;
        align-items: center;
        gap: 6px;
        color: var(--secondary-text-color);
        font-size: 14px;
      }

      .stats-subtitle ha-icon {
        --mdc-icon-size: 18px;
      }

      /* Modern Stats Grid */
      .stats-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 12px;
        padding: 20px;
      }

      .stat-card.modern {
        display: flex;
        align-items: center;
        gap: 12px;
        background: var(--secondary-background-color);
        border: 1px solid var(--divider-color);
        border-radius: 12px;
        padding: 20px;
        transition: all 0.2s;
      }

      .stat-card.modern:hover {
        border-color: var(--mdc-theme-primary, #03a9f4);
        box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      }

      .stat-icon {
        --mdc-icon-size: 32px;
        color: var(--mdc-theme-primary, #03a9f4);
        opacity: 0.8;
      }

      .stat-content {
        flex: 1;
      }

      .stat-value {
        font-size: 28px;
        font-weight: 600;
        color: var(--primary-text-color);
        line-height: 1;
      }

      .stat-label {
        font-size: 13px;
        color: var(--secondary-text-color);
        margin-top: 4px;
      }

      /* Stat Sections */
      .stat-section {
        margin: 12px 20px;
        background: var(--secondary-background-color);
        border: 1px solid var(--divider-color);
        border-radius: 12px;
        padding: 20px;
      }

      .section-header {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 12px;
      }

      .section-header ha-icon {
        --mdc-icon-size: 20px;
        color: var(--mdc-theme-primary, #03a9f4);
      }

      .section-header h4 {
        margin: 0;
        font-size: 16px;
        font-weight: 500;
        color: var(--primary-text-color);
      }

      /* Distribution Chart */
      .distribution-container {
        display: flex;
        flex-direction: column;
        gap: 12px;
      }

      .distribution-row {
        display: flex;
        flex-direction: column;
        gap: 6px;
      }

      .distribution-label {
        display: flex;
        justify-content: space-between;
        align-items: center;
      }

      .layer-name {
        font-size: 13px;
        color: var(--primary-text-color);
        font-weight: 500;
      }

      .layer-count {
        font-size: 12px;
        color: var(--secondary-text-color);
      }

      .distribution-bar-container {
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .distribution-bar {
        flex: 1;
        height: 8px;
        background: var(--divider-color);
        border-radius: 4px;
        overflow: hidden;
      }

      .distribution-fill {
        height: 100%;
        transition: width 0.3s;
        border-radius: 4px;
      }

      .distribution-fill.card_defaults {
        background: linear-gradient(90deg, #9e9e9e, #757575);
      }

      .distribution-fill.theme_defaults {
        background: linear-gradient(90deg, #2196f3, #1976d2);
      }

      .distribution-fill[class*="component_"] {
        background: linear-gradient(90deg, #9c27b0, #7b1fa2);
      }

      .distribution-fill[class*="preset_"] {
        background: linear-gradient(90deg, #ff9800, #f57c00);
      }

      .distribution-fill.user_config {
        background: linear-gradient(90deg, #4caf50, #388e3c);
      }

      .distribution-fill.rules {
        background: linear-gradient(90deg, #f44336, #d32f2f);
      }

      .distribution-percentage {
        font-size: 12px;
        color: var(--secondary-text-color);
        font-weight: 500;
        min-width: 40px;
        text-align: right;
      }

      /* Token List */
      .tokens-list {
        display: flex;
        flex-direction: column;
        gap: 12px;
      }

      .token-item {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 12px;
        background: var(--primary-background-color);
        border: 1px solid var(--divider-color);
        border-radius: 8px;
        transition: all 0.2s;
      }

      .token-item:hover {
        border-color: var(--mdc-theme-primary, #03a9f4);
        background: var(--secondary-background-color);
      }

      .token-rank {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 32px;
        height: 32px;
        background: var(--mdc-theme-primary, #03a9f4);
        color: white;
        border-radius: 50%;
        font-size: 13px;
        font-weight: 600;
        flex-shrink: 0;
      }

      .token-details {
        flex: 1;
        min-width: 0;
      }

      .token-path {
        font-family: 'Roboto Mono', monospace;
        font-size: 13px;
        color: var(--primary-text-color);
        margin-bottom: 4px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .token-meta {
        display: flex;
        align-items: center;
        gap: 12px;
        font-size: 12px;
      }

      .token-usage {
        display: flex;
        align-items: center;
        gap: 4px;
        color: var(--secondary-text-color);
      }

      .token-usage ha-icon {
        --mdc-icon-size: 14px;
      }

      .token-value-preview {
        color: var(--info-color);
        font-family: 'Roboto Mono', monospace;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      /* Theme Tokens View - Card Layout */
      .tokens-grid {
        display: flex;
        flex-direction: column;
        gap: 12px;
        padding: 20px;
      }

      .token-card {
        background: var(--secondary-background-color);
        border: 1px solid var(--divider-color);
        border-radius: 12px;
        overflow: hidden;
        transition: all 0.2s;
      }

      .token-card:hover {
        border-color: var(--mdc-theme-primary, #03a9f4);
        box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      }

      .token-card-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 16px;
        background: var(--primary-background-color);
        border-bottom: 1px solid var(--divider-color);
      }

      .token-path-display {
        display: flex;
        align-items: center;
        gap: 8px;
        flex: 1;
        min-width: 0;
      }

      .token-path-display ha-icon {
        --mdc-icon-size: 20px;
        color: var(--mdc-theme-primary, #03a9f4);
        flex-shrink: 0;
      }

      .token-path-display .token-path {
        font-family: 'Roboto Mono', monospace;
        font-size: 14px;
        color: var(--primary-text-color);
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        background: transparent;
        padding: 0;
        border-radius: 0;
      }

      .token-actions {
        display: flex;
        align-items: center;
        gap: 4px;
        flex-shrink: 0;
      }

      .token-card-body {
        padding: 16px;
        display: flex;
        flex-direction: column;
        gap: 12px;
      }

      .token-value-section,
      .token-usage-section {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }

      .token-section-label {
        font-size: 12px;
        font-weight: 500;
        color: var(--secondary-text-color);
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }

      .token-value-display {
        display: flex;
        align-items: flex-start;
        gap: 12px;
      }

      .token-value-code {
        flex: 1;
        font-family: 'Roboto Mono', monospace;
        font-size: 13px;
        color: var(--info-color);
        background: var(--primary-background-color);
        padding: 12px;
        border-radius: 8px;
        border: 1px solid var(--divider-color);
        overflow-x: auto;
        word-break: break-word;
      }

      pre.token-value-code {
        white-space: pre;
        line-height: 1.4;
        margin: 0;
      }

      .color-preview-large {
        width: 48px;
        height: 48px;
        border-radius: 8px;
        border: 2px solid var(--divider-color);
        cursor: pointer;
        flex-shrink: 0;
        transition: all 0.2s;
      }

      .color-preview-large:hover {
        transform: scale(1.1);
        border-color: var(--mdc-theme-primary, #03a9f4);
      }

      .token-used-by-list {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
      }

      .field-reference {
        display: inline-block;
        font-family: 'Roboto Mono', monospace;
        font-size: 12px;
        color: var(--primary-text-color);
        background: var(--primary-background-color);
        padding: 4px 8px;
        border-radius: 4px;
        border: 1px solid var(--divider-color);
      }

      /* Split Pane Layout - New Tree View */
      .split-pane-container {
        display: grid;
        grid-template-columns: 35% 65%;
        grid-template-rows: minmax(0, 1fr);
        gap: 12px;
        flex: 1;
        min-height: 0;
        overflow: hidden;
      }

      .tree-pane {
        display: flex;
        flex-direction: column;
        min-height: 0;
        overflow: hidden;
        border-right: 1px solid var(--divider-color);
      }

      .tree-pane-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 12px 16px;
        border-bottom: 1px solid var(--divider-color);
        background: var(--secondary-background-color);
        flex-shrink: 0;
      }

      .tree-pane-header span {
        font-weight: 500;
        font-size: 14px;
        color: var(--primary-text-color);
      }

      .tree-actions {
        display: flex;
        gap: 4px;
      }

      .tree-actions ha-icon-button {
        --mdc-icon-button-size: 32px;
        --mdc-icon-size: 20px;
      }

      .tree-container {
        flex: 1;
        overflow-y: auto;
        padding: 12px;
        background: var(--code-background-color, #1e1e1e);
        border-radius: 8px;
      }

      .detail-pane {
        display: flex;
        flex-direction: column;
        overflow: hidden;
        min-height: 0; /* Critical for grid child to respect overflow */
      }

      .detail-pane-content {
        flex: 1;
        overflow-y: auto;
        overflow-x: hidden;
        padding-left: 8px;
      }

      /* Tree Node Styles */
      .tree-node {
        position: relative;
        margin-left: 8px;
      }

      .tree-node-content {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 6px 8px;
        border-radius: 6px;
        cursor: pointer;
        transition: all 0.15s;
        user-select: none;
      }

      .tree-node-content:hover {
        background: var(--secondary-background-color);
      }

      .tree-node-content:active {
        transform: scale(0.98);
      }

      .tree-node-content.selected {
        background: var(--primary-color);
        color: white;
        font-weight: 500;
      }

      .tree-node-content.selected .node-label {
        color: white;
        font-weight: 500;
      }

      .tree-node-content.selected ha-icon {
        color: white;
      }

      .tree-expander {
        width: 16px;
        height: 16px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 14px;
        color: var(--secondary-text-color);
        transition: transform 0.2s;
      }

      .tree-expander.expanded {
        transform: rotate(90deg);
      }

      .tree-expander.leaf {
        visibility: hidden;
      }

      .node-icon {
        width: 18px;
        height: 18px;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .node-label {
        flex: 1;
        font-family: 'Roboto Mono', monospace;
        font-size: 13px;
        color: var(--primary-text-color);
      }

      .tree-children {
        margin-left: 24px;
        border-left: 1px solid var(--divider-color);
        padding-left: 4px;
      }

      /* Detail Panel Styles */
      .detail-panel-empty {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        height: 100%;
        color: var(--secondary-text-color);
        gap: 12px;
      }

      .detail-panel-empty ha-icon {
        --mdc-icon-size: 48px;
        opacity: 0.5;
      }

      .detail-panel-header {
        padding-bottom: 16px;
        border-bottom: 2px solid var(--divider-color);
        margin-bottom: 12px;
      }

      .detail-path {
        font-family: 'Roboto Mono', monospace;
        font-size: 16px;
        font-weight: 500;
        color: var(--primary-text-color);
        margin-bottom: 8px;
      }

      .detail-breadcrumb {
        font-size: 12px;
        color: var(--secondary-text-color);
        display: flex;
        align-items: center;
        gap: 4px;
        flex-wrap: wrap;
      }

      .breadcrumb-sep {
        color: var(--primary-text-color);
      }

      .detail-section {
        margin-bottom: 12px;
      }

      .detail-section-title {
        font-size: 14px;
        font-weight: 500;
        color: var(--primary-text-color);
        margin-bottom: 12px;
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .detail-section-title ha-icon {
        --mdc-icon-size: 18px;
        color: var(--secondary-text-color);
      }

      .detail-row {
        display: flex;
        gap: 12px;
        margin-bottom: 8px;
        font-size: 13px;
      }

      .detail-label {
        min-width: 120px;
        color: var(--secondary-text-color);
        font-weight: 500;
      }

      .detail-value {
        flex: 1;
        color: var(--primary-text-color);
        font-family: 'Roboto Mono', monospace;
        word-break: break-word;
      }

      .detail-value-large {
        flex: 1;
        color: var(--primary-text-color);
        font-family: 'Roboto Mono', monospace;
        background: var(--secondary-background-color);
        padding: 12px;
        border-radius: 6px;
        white-space: pre-wrap;
        word-break: break-word;
        max-height: 200px;
        overflow-y: auto;
      }

      .source-layer-badge {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 6px 12px;
        border-radius: 16px;
        font-size: 12px;
        font-weight: 500;
      }

      .source-layer-badge[data-source="user_config"],
      .source-layer-badge[data-source="user"] {
        background: #4caf50;
        color: white;
      }

      .source-layer-badge[data-source*="preset"] {
        background: #ff9800;
        color: white;
      }

      .source-layer-badge[data-source*="theme"] {
        background: #9c27b0;
        color: white;
      }

      .source-layer-badge[data-source*="card_defaults"],
      .source-layer-badge[data-source="defaults"] {
        background: #2196f3;
        color: white;
      }

      .source-layer-badge[data-source*="rules"] {
        background: #f44336;
        color: white;
      }

      .resolution-chain {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }

      .resolution-step {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 8px 12px;
        background: var(--secondary-background-color);
        border-radius: 6px;
        font-size: 12px;
      }

      .resolution-arrow {
        color: var(--secondary-text-color);
      }

      .token-ref {
        font-family: 'Roboto Mono', monospace;
        color: var(--primary-color);
      }

      .related-fields-list {
        display: flex;
        flex-direction: column;
        gap: 4px;
      }

      .related-field-item {
        padding: 6px 10px;
        background: var(--secondary-background-color);
        border-radius: 4px;
        font-family: 'Roboto Mono', monospace;
        font-size: 12px;
        cursor: pointer;
        transition: background 0.15s;
      }

      .related-field-item:hover {
        background: var(--primary-color);
        color: white;
      }

      .no-data-hint {
        color: var(--disabled-text-color);
        font-style: italic;
        font-size: 12px;
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 16px;
      }

      .no-data-hint ha-icon {
        color: var(--secondary-text-color);
      }

      /* ====================================================================
         NEW: Enhanced Detail Panel Styles
         ==================================================================== */

      /* Node badges in detail header */
      .node-badges {
        display: inline-flex;
        gap: 6px;
        margin-left: 12px;
      }

      .node-badge {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        padding: 2px 6px;
        background: var(--secondary-background-color);
        border-radius: 10px;
        font-size: 11px;
        cursor: help;
      }

      /* Tree node badges */
      .node-indicators {
        display: inline-flex;
        gap: 4px;
        margin-left: auto;
        margin-right: 8px;
      }

      .tree-badge {
        display: inline-flex;
        align-items: center;
        font-size: 11px;
        cursor: help;
        opacity: 0.8;
      }

      .tree-badge:hover {
        opacity: 1;
      }

      /* Detail section content wrapper (for collapsible sections) */
      .detail-section-content {
        padding: 4px 0;
      }

      .detail-subsection {
        margin-top: 12px;
      }

      /* Resolution chain flow visualization */
      .resolution-chain-flow {
        display: flex;
        flex-direction: column;
        gap: 8px;
        margin-top: 8px;
      }

      .resolution-step-card {
        background: var(--secondary-background-color);
        border-radius: 8px;
        border-left: 4px solid var(--mdc-theme-primary, #03a9f4);
        padding: 12px;
        display: flex;
        align-items: center;
        gap: 14px;
        transition: all 0.2s;
      }

      .resolution-step-card:hover {
        background: var(--card-background-color);
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      }

      .resolution-step-icon {
        width: 40px;
        height: 40px;
        display: flex;
        align-items: center;
        justify-content: center;
        background: var(--primary-background-color);
        border-radius: 50%;
        flex-shrink: 0;
      }

      .resolution-step-icon ha-icon {
        --mdc-icon-size: 24px;
        color: var(--primary-color);
      }

      .resolution-step-body {
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 4px;
      }

      .resolution-step-header {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 8px;
      }

      .resolution-step-label {
        font-size: 11px;
        font-weight: 600;
        text-transform: uppercase;
        color: var(--secondary-text-color);
        letter-spacing: 0.5px;
      }

      .source-layer-badge.small {
        font-size: 10px;
        padding: 3px 8px;
      }

      .resolution-step-content {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }

      .resolution-from,
      .resolution-token,
      .resolution-to {
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .token-label {
        font-size: 12px;
        color: var(--secondary-text-color);
        font-weight: 500;
        min-width: 90px;
      }

      .token-value {
        display: flex;
        align-items: center;
        gap: 8px;
        flex: 1;
      }

      .token-value code {
        flex: 1;
        background: var(--primary-background-color);
        padding: 6px 10px;
        border-radius: 4px;
        font-size: 13px;
      }

      .token-ref {
        font-family: 'Roboto Mono', monospace;
        color: var(--primary-color);
        background: var(--primary-background-color);
        padding: 4px 8px;
        border-radius: 4px;
        font-size: 12px;
      }

      .resolution-arrow-down {
        align-self: center;
        color: var(--secondary-text-color);
        --mdc-icon-size: 20px;
      }

      .chain-separator {
        align-self: center;
        color: var(--primary-color);
        --mdc-icon-size: 28px;
        margin: 2px 0;
        opacity: 0.6;
      }

      /* Border colors for different source types */
      .resolution-step-card[data-source="defaults"],
      .resolution-step-card[data-source="card_defaults"] {
        border-left-color: #2196f3;
      }

      .resolution-step-card[data-source="theme"] {
        border-left-color: #9c27b0;
      }

      .resolution-step-card[data-source="user"],
      .resolution-step-card[data-source="user_config"] {
        border-left-color: #4caf50;
      }

      .resolution-step-card[data-source="presets"] {
        border-left-color: #ff9800;
      }

      .resolution-step-card[data-source="rules"] {
        border-left-color: #f44336;
      }

      .resolution-final {
        margin-top: 16px;
        padding: 16px;
        background: var(--primary-color);
        color: white;
        border-radius: 8px;
        display: flex;
        flex-direction: column;
        gap: 8px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
      }

      .resolution-final-label {
        font-size: 12px;
        font-weight: 600;
        text-transform: uppercase;
        opacity: 0.9;
        letter-spacing: 0.5px;
      }

      .resolution-final-value {
        display: flex;
        align-items: center;
        gap: 12px;
        font-family: 'Roboto Mono', monospace;
        font-size: 15px;
        font-weight: 500;
      }

      .resolution-final-value code {
        color: white;
        background: rgba(255, 255, 255, 0.2);
        padding: 8px 12px;
        border-radius: 6px;
        flex: 1;
      }

      .color-preview-inline {
        width: 28px;
        height: 28px;
        border-radius: 4px;
        border: 2px solid rgba(255, 255, 255, 0.3);
        flex-shrink: 0;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
      }

      /* Before/After comparison */
      .before-after-container {
        display: grid;
        grid-template-columns: 1fr auto 1fr;
        gap: 12px;
        align-items: stretch;
        margin-top: 8px;
      }

      .before-after-panel {
        background: var(--secondary-background-color);
        border: 1px solid var(--divider-color);
        border-radius: 8px;
        padding: 12px;
        display: flex;
        flex-direction: column;
        gap: 8px;
      }

      .before-after-panel.before {
        border-left: 3px solid var(--error-color);
      }

      .before-after-panel.after {
        border-left: 3px solid var(--success-color);
      }

      .before-after-label {
        font-size: 11px;
        font-weight: 600;
        text-transform: uppercase;
        color: var(--secondary-text-color);
        letter-spacing: 0.5px;
      }

      .before-after-value {
        flex: 1;
        display: flex;
        align-items: center;
        gap: 8px;
        flex-wrap: wrap;
      }

      .before-after-value code {
        font-family: 'Roboto Mono', monospace;
        font-size: 12px;
        background: var(--primary-background-color);
        padding: 6px 10px;
        border-radius: 4px;
        word-break: break-word;
      }

      .before-after-value pre {
        margin: 0;
        width: 100%;
      }

      .before-after-value pre code {
        display: block;
        max-height: 150px;
        overflow-y: auto;
        white-space: pre-wrap;
      }

      .before-after-arrow {
        display: flex;
        align-items: center;
        justify-content: center;
        color: var(--primary-color);
        --mdc-icon-size: 28px;
      }

      /* Rule info display */
      .rule-info {
        background: var(--secondary-background-color);
        border-radius: 6px;
        padding: 12px;
        margin-top: 8px;
      }

      .rule-info-row {
        display: flex;
        gap: 12px;
        margin: 6px 0;
        align-items: baseline;
      }

      .rule-info-row .detail-label {
        min-width: 80px;
      }

      .rule-id,
      .rule-condition {
        font-family: 'Roboto Mono', monospace;
        font-size: 12px;
        background: var(--primary-background-color);
        padding: 4px 8px;
        border-radius: 4px;
        flex: 1;
      }

      .rule-condition {
        color: var(--primary-color);
      }

      /* Dependencies list */
      .dependencies-list {
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
        margin-top: 4px;
      }

      .dependency-item {
        font-family: 'Roboto Mono', monospace;
        font-size: 11px;
        background: var(--secondary-background-color);
        padding: 4px 8px;
        border-radius: 12px;
        border: 1px solid var(--divider-color);
      }

      /* Used by lists */
      .used-by-list {
        display: flex;
        flex-direction: column;
        gap: 6px;
        margin-top: 8px;
      }

      .used-by-item {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 8px 12px;
        background: var(--secondary-background-color);
        border-radius: 6px;
        font-family: 'Roboto Mono', monospace;
        font-size: 12px;
        cursor: pointer;
        transition: all 0.15s;
        border: 1px solid transparent;
      }

      .used-by-item:not(.current):hover {
        background: var(--primary-color);
        color: white;
        border-color: var(--primary-color);
      }

      .used-by-item.current {
        background: var(--divider-color);
        cursor: default;
        opacity: 0.7;
      }

      .used-by-item ha-icon {
        --mdc-icon-size: 16px;
        flex-shrink: 0;
      }

      .current-indicator {
        margin-left: auto;
        font-size: 10px;
        font-style: italic;
        color: var(--secondary-text-color);
      }

      .used-by-token-item {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 10px 12px;
        background: var(--secondary-background-color);
        border-radius: 6px;
        border: 1px solid var(--divider-color);
      }

      .used-by-token-item ha-icon {
        --mdc-icon-size: 18px;
        color: var(--primary-color);
        flex-shrink: 0;
      }

      .used-by-token-item code {
        font-family: 'Roboto Mono', monospace;
        font-size: 12px;
        flex: 1;
      }

      .token-resolved-value {
        font-size: 11px;
        color: var(--secondary-text-color);
        padding: 3px 8px;
        background: var(--primary-background-color);
        border-radius: 10px;
      }

      /* Related field items with icons */
      .related-field-item ha-icon {
        --mdc-icon-size: 14px;
        color: var(--secondary-text-color);
        flex-shrink: 0;
      }

      /* ====================================================================
         LAYER CAKE STYLES - Visual layer merge representation
         ==================================================================== */

      .layer-cake-container {
        display: flex;
        flex-direction: column;
        gap: 0;
        padding: 8px;
      }

      .layer-separator {
        display: flex;
        justify-content: center;
        align-items: center;
        height: 24px;
        color: var(--primary-color);
      }

      .layer-separator ha-icon {
        --mdc-icon-size: 28px;
        opacity: 0.6;
      }

      .layer-card {
        background: var(--secondary-background-color);
        border: 2px solid var(--divider-color);
        border-radius: 12px;
        overflow: hidden;
        transition: all 0.3s ease;
      }

      .layer-card-header {
        display: grid;
        grid-template-columns: auto 1fr auto;
        gap: 12px;
        padding: 16px;
        align-items: center;
      }

      .layer-icon-wrapper {
        width: 48px;
        height: 48px;
        display: flex;
        align-items: center;
        justify-content: center;
        background: var(--primary-background-color);
        border-radius: 50%;
        flex-shrink: 0;
      }

      .layer-icon-wrapper ha-icon {
        --mdc-icon-size: 28px;
        color: var(--secondary-text-color);
      }

      .layer-info {
        display: flex;
        flex-direction: column;
        gap: 4px;
      }

      .layer-name {
        font-size: 15px;
        font-weight: 600;
        color: var(--primary-text-color);
      }

      .layer-description {
        font-size: 12px;
        color: var(--secondary-text-color);
        opacity: 0.8;
      }

      .layer-status {
        display: flex;
        align-items: center;
        gap: 6px;
        padding: 6px 12px;
        border-radius: 16px;
        font-size: 12px;
        font-weight: 500;
        white-space: nowrap;
      }

      .layer-status ha-icon {
        --mdc-icon-size: 18px;
      }

      .layer-card-body {
        padding: 12px 16px 16px 16px;
        border-top: 1px solid var(--divider-color);
      }

      .layer-value {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 12px;
        background: var(--primary-background-color);
        border-radius: 8px;
        margin-bottom: 8px;
      }

      .layer-value-label {
        font-size: 12px;
        font-weight: 600;
        color: var(--secondary-text-color);
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }

      .layer-override-hint {
        font-size: 11px;
        font-style: italic;
        color: var(--secondary-text-color);
        margin-left: 8px;
        opacity: 0.8;
      }

      .layer-value-code {
        flex: 1;
        font-family: 'Roboto Mono', monospace;
        font-size: 14px;
        color: var(--primary-text-color);
        background: var(--secondary-background-color);
        padding: 8px 12px;
        border-radius: 6px;
        word-break: break-word;
      }

      /* Pre element for multi-line formatted values */
      pre.layer-value-code,
      pre.token-resolution-value {
        white-space: pre;
        overflow-x: auto;
        margin: 0;
        line-height: 1.4;
      }

      .layer-value-placeholder {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 12px;
        color: var(--secondary-text-color);
        font-size: 13px;
        font-style: italic;
      }

      .layer-value-placeholder ha-icon {
        --mdc-icon-size: 20px;
        opacity: 0.6;
      }

      .layer-rule-info {
        display: flex;
        flex-direction: column;
        gap: 6px;
        padding: 8px 12px;
        background: var(--secondary-background-color);
        border-radius: 6px;
        border-left: 3px solid var(--primary-color);
      }

      .rule-detail-line {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 12px;
      }

      .rule-detail-line ha-icon {
        --mdc-icon-size: 16px;
        color: var(--secondary-text-color);
        flex-shrink: 0;
      }

      .rule-detail-line code {
        font-family: 'Roboto Mono', monospace;
        background: var(--primary-background-color);
        padding: 2px 6px;
        border-radius: 3px;
      }

      /* Token resolution display */
      .layer-token-resolution {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 8px 12px;
        margin-top: 8px;
        background: var(--secondary-background-color);
        border-radius: 6px;
        border-left: 3px solid var(--info-color);
        font-size: 12px;
      }

      .layer-token-resolution ha-icon {
        --mdc-icon-size: 16px;
        color: var(--info-color);
        flex-shrink: 0;
      }

      .token-resolution-label {
        color: var(--secondary-text-color);
        font-weight: 500;
      }

      .token-resolution-value {
        font-family: 'Roboto Mono', monospace;
        background: var(--primary-background-color);
        padding: 4px 8px;
        border-radius: 4px;
        color: var(--info-color);
        flex: 1;
        word-break: break-word;
      }

      .token-resolution-text {
        color: var(--secondary-text-color);
        font-style: italic;
      }

      /* Layer card states */
      .layer-card.layer-not-used {
        opacity: 0.5;
        background: var(--primary-background-color);
      }

      .layer-card.layer-not-used .layer-status {
        background: var(--divider-color);
        color: var(--disabled-text-color);
      }

      .layer-card.layer-not-used .layer-icon-wrapper {
        opacity: 0.4;
      }

      .layer-card.layer-passthrough {
        background: var(--secondary-background-color);
      }

      .layer-card.layer-passthrough .layer-status {
        background: rgba(255, 165, 0, 0.15);
        color: #ff9800;
      }

      .layer-card.layer-passthrough .layer-icon-wrapper {
        background: rgba(255, 165, 0, 0.1);
      }

      .layer-card.layer-passthrough .layer-icon-wrapper ha-icon {
        color: #ff9800;
      }

      .layer-card.layer-original {
        background: var(--secondary-background-color);
        border-color: var(--info-color, #2196f3);
      }

      .layer-card.layer-original .layer-status {
        background: rgba(33, 150, 243, 0.15);
        color: var(--info-color, #2196f3);
      }

      .layer-card.layer-original .layer-icon-wrapper {
        background: rgba(33, 150, 243, 0.1);
      }

      .layer-card.layer-original .layer-icon-wrapper ha-icon {
        color: var(--info-color, #2196f3);
      }

      .layer-card.layer-original .layer-name {
        color: var(--info-color, #2196f3);
      }

      .layer-card.layer-active {
        background: var(--card-background-color);
        border-color: var(--success-color, #4caf50);
        box-shadow: 0 4px 12px rgba(76, 175, 80, 0.3);
      }

      .layer-card.layer-active .layer-status {
        background: var(--success-color, #4caf50);
        color: white;
      }

      .layer-card.layer-active .layer-icon-wrapper {
        background: var(--success-color, #4caf50);
      }

      .layer-card.layer-active .layer-icon-wrapper ha-icon {
        color: white;
      }

      .layer-card.layer-active .layer-name {
        color: var(--success-color, #4caf50);
        font-weight: 700;
      }
      `
    ];
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
          <div class="info-card-content">
            <h3>🔍 Provenance Inspector</h3>
            <p>
              <strong>${stats.totalFields} fields</strong> tracked across <strong>${stats.layerCount} layers</strong>
              ${stats.tokenCount > 0 ? html`<br /><strong>${stats.tokenCount} theme tokens</strong> resolved` : ''}
            </p>
            <p style="font-size: 13px; color: var(--secondary-text-color);">
              Explore where each configuration value comes from: defaults, theme, user config, presets, or dynamic rules.
            </p>
          </div>
          <div class="info-card-actions">
            <ha-button
              class="open-inspector-button"
              raised
              @click=${this._openDialog}>
              <ha-icon icon="mdi:file-tree" slot="start"></ha-icon>
              Open Provenance Inspector
            </ha-button>
          </div>
        </div>
      </div>
    `;
  }

  _renderDialog() {
    if (!this._dialogOpen) return '';

    return html`
      <ha-dialog
        open
        @closed=${(e) => { e.stopPropagation(); this._closeDialog(); }}
        header-title="Provenance Inspector">
        <div class="dialog-content">
          ${this._renderDialogHeader()}
          ${this._renderDialogBody()}
        </div>
        <div slot="footer">
          <ha-button
            variant="brand"
            appearance="accent"
            @click=${this._closeDialog}
            data-dialog="close">
            Close
          </ha-button>
        </div>
      </ha-dialog>
    `;
  }

  _renderDialogHeader() {
    const stats = this._getStats();

    return html`
      <div class="dialog-header">
        <!-- Using HA native tab components (Issue #82) -->
        <ha-tab-group @wa-tab-show=${this._handleTabChange}>
          <ha-tab-group-tab value="tree" ?active=${this._activeView === 'tree'}>
            <ha-icon icon="mdi:file-tree"></ha-icon>
            <span>Config Tree</span>
            <span class="tab-count">${stats.totalFields}</span>
          </ha-tab-group-tab>
          <ha-tab-group-tab value="tokens" ?active=${this._activeView === 'tokens'}>
            <ha-icon icon="mdi:palette"></ha-icon>
            <span>Theme Tokens</span>
            <span class="tab-count">${stats.tokenCount}</span>
          </ha-tab-group-tab>
          <ha-tab-group-tab value="stats" ?active=${this._activeView === 'stats'}>
            <ha-icon icon="mdi:chart-box"></ha-icon>
            <span>Statistics</span>
          </ha-tab-group-tab>
        </ha-tab-group>

        <!-- Show search for tokens view only -->
        ${this._activeView === 'tokens' ? html`
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

        <!-- Show layer filters for tokens view only -->
        ${this._activeView === 'tokens' ? this._renderLayerFilters() : ''}
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
    if (!this._provenance || !this._provenance.config || !this._provenance.config.tree) {
      return html`
        <div class="empty-state">
          <ha-icon icon="mdi:file-tree"></ha-icon>
          <p>No provenance data available</p>
          <p style="font-size: 13px;">The card may not have been initialized yet.</p>
        </div>
      `;
    }

    const tree = this._provenance.config.tree;

    if (!tree || Object.keys(tree).length === 0) {
      return html`
        <div class="empty-state">
          <ha-icon icon="mdi:file-tree"></ha-icon>
          <p>No configuration fields tracked</p>
          <p style="font-size: 13px;">The configuration tree is empty.</p>
        </div>
      `;
    }

    return html`
      <div class="split-pane-container">
        <!-- Left Pane: Interactive Tree -->
        <div class="tree-pane">
          <div class="tree-pane-header">
            <span>Configuration Tree</span>
            <div class="tree-actions">
              <ha-icon-button
                @click=${this._expandInterestingNodes}
                title="Expand nodes with tokens/patches/templates"
                .path=${"M12,18.17L8.83,15L7.42,16.41L12,21L16.59,16.41L15.17,15M12,5.83L15.17,9L16.58,7.59L12,3L7.41,7.59L8.83,9L12,5.83Z"}>
              </ha-icon-button>
              <ha-icon-button
                @click=${this._expandAll}
                title="Expand all"
                .path=${"M7.41,15.41L12,10.83L16.59,15.41L18,14L12,8L6,14L7.41,15.41Z"}>
              </ha-icon-button>
              <ha-icon-button
                @click=${this._collapseAll}
                title="Collapse all"
                .path=${"M7.41,8.58L12,13.17L16.59,8.58L18,10L12,16L6,10L7.41,8.58Z"}>
              </ha-icon-button>
            </div>
          </div>
          <div class="tree-container">
            ${this._renderTreeNodes(tree, '')}
          </div>
        </div>

        <!-- Right Pane: Detail View -->
        <div class="detail-pane">
          <div class="detail-pane-content">
            ${this._selectedNode ? this._renderNodeDetail() : html`
              <div class="detail-panel-empty">
                <ha-icon icon="mdi:cursor-pointer"></ha-icon>
                <p>Select a node from the tree to view details</p>
                <p style="font-size: 13px; color: var(--secondary-text-color); margin-top: 8px;">
                  💡 Tip: Click <ha-icon icon="mdi:arrow-expand-vertical" style="--mdc-icon-size: 14px; vertical-align: middle;"></ha-icon> to expand nodes with provenance data
                </p>
              </div>
            `}
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Recursively render tree nodes
   */
  _renderTreeNodes(node, parentPath) {
    if (!node || typeof node !== 'object') return '';

    // Sort entries alphabetically by key
    const entries = Object.entries(node)
      .filter(([key]) => key !== '__source')
      .sort(([a], [b]) => a.localeCompare(b));

    return html`
      ${entries.map(([key, value]) => {
        const fullPath = parentPath ? `${parentPath}.${key}` : key;
        const source = value.__source || 'unknown';
        const hasChildren = Object.keys(value).filter(k => k !== '__source').length > 0;
        const isExpanded = this._expandedNodes.has(fullPath);
        const isSelected = this._selectedNode?.path === fullPath;

        // Get provenance indicators for this node
        const themeTokenInfo = this._getThemeTokenForField(fullPath);
        const rulePatchInfo = this._getRulePatchForField(fullPath);
        const templateInfo = this._getTemplateForField(fullPath);
        const usedByTokens = this._getTokensUsingField(fullPath);

        // Debug logging for first few nodes
        if (parentPath === '' || !parentPath) {
          lcardsLog.debug(`[ProvenanceTab] Tree node "${key}": token=${!!themeTokenInfo}, patch=${!!rulePatchInfo}, template=${!!templateInfo}, usedBy=${usedByTokens.length}`);
        }

        return html`
          <div class="tree-node">
            <div
              class="tree-node-content ${isSelected ? 'selected' : ''}"
              @click=${() => this._selectNode(fullPath, key, value, source)}>
              <span
                class="tree-expander ${hasChildren ? (isExpanded ? 'expanded' : '') : 'leaf'}"
                @click=${(e) => this._toggleNode(e, fullPath, hasChildren)}>
                ${hasChildren ? '▶' : ''}
              </span>
              <span class="node-icon">
                <ha-icon icon=${hasChildren ? 'mdi:folder' : 'mdi:file-document-outline'}></ha-icon>
              </span>
              <span class="node-label">${key}</span>
              <span class="node-indicators">
                ${themeTokenInfo ? html`<span class="tree-badge" title="Uses theme token">🔗</span>` : ''}
                ${rulePatchInfo ? html`<span class="tree-badge" title="Has rule patch">⚙️</span>` : ''}
                ${templateInfo ? html`<span class="tree-badge" title="Is templated">📝</span>` : ''}
                ${themeTokenInfo?.resolution_chain && themeTokenInfo.resolution_chain.length > 1 ? html`<span class="tree-badge" title="Has resolution chain">🔀</span>` : ''}
                ${usedByTokens.length > 0 ? html`<span class="tree-badge" title="Referenced by ${usedByTokens.length} token(s)">🔖${usedByTokens.length}</span>` : ''}
              </span>
              ${!hasChildren ? html`
                <ha-assist-chip
                  .label=${this._formatLayerName(source)}
                  .filled=${true}
                  style="
                    --ha-assist-chip-filled-container-color: ${this._getSourceBadgeColor(source)};
                    --md-sys-color-primary: white;
                    --md-sys-color-on-surface: white;
                  ">
                </ha-assist-chip>
              ` : ''}
            </div>
            ${hasChildren && isExpanded ? html`
              <div class="tree-children">
                ${this._renderTreeNodes(value, fullPath)}
              </div>
            ` : ''}
          </div>
        `;
      })}
    `;
  }

  /**
   * Render detail panel for selected node
   */
  _renderNodeDetail() {
    if (!this._selectedNode) return '';

    const { path, key, value, source } = this._selectedNode;

    // Get breadcrumb
    const pathParts = path.split('.');

    // Get actual value from config
    const actualValue = this._getActualValue(path);

    // Check if this field uses a theme token
    const themeTokenInfo = this._getThemeTokenForField(path);

    // Check if this field has a rule patch
    const rulePatchInfo = this._getRulePatchForField(path);

    // Check if this field is a template
    const templateInfo = this._getTemplateForField(path);

    // Get related fields (parent and children)
    const relatedFields = this._getRelatedFields(path);

    // Get all tokens that use this field (reverse lookup)
    const usedByTokens = this._getTokensUsingField(path);

    return html`
      <div class="detail-panel-header">
        <div class="detail-path">
          ${key}
          ${this._renderNodeBadges(themeTokenInfo, rulePatchInfo, templateInfo, usedByTokens)}
        </div>
        <div class="detail-breadcrumb">
          ${pathParts.map((part, i) => html`
            ${i > 0 ? html`<span class="breadcrumb-sep">>></span>` : ''}
            <span>${part}</span>
          `)}
        </div>
      </div>

      <!-- LAYER CAKE: Configuration Layers -->
      <lcards-form-section
        header="Configuration Layers"
        description="Shows how this field's value was determined through the layer merge process"
        icon="mdi:layers"
        ?expanded=${true}>
        ${this._renderLayerCake(path, source, actualValue, rulePatchInfo)}
      </lcards-form-section>

      <!-- Theme Token Resolution Section (expandable) -->
      ${themeTokenInfo ? html`
        <lcards-form-section
          header="Token Resolution"
          icon="mdi:palette"
          ?expanded=${!this._collapsedDetailSections.has('token')}>
          <div class="detail-section-content">
            ${this._renderResolutionChain(themeTokenInfo)}
            ${themeTokenInfo.used_by_fields && themeTokenInfo.used_by_fields.length > 0 ? html`
              <div class="detail-subsection">
                <div class="detail-label">Used by ${themeTokenInfo.used_by_fields.length} field(s):</div>
                <div class="used-by-list">
                  ${themeTokenInfo.used_by_fields.map(field => html`
                    <div
                      class="used-by-item ${field === path ? 'current' : ''}"
                      @click=${() => field !== path && this._navigateToPath(field)}>
                      <ha-icon icon="mdi:link-variant"></ha-icon>
                      ${field}
                      ${field === path ? html`<span class="current-indicator">(current)</span>` : ''}
                    </div>
                  `)}
                </div>
              </div>
            ` : ''}
          </div>
        </lcards-form-section>
      ` : ''}

      <!-- Rule Patch Section (expandable with before/after) -->
      ${rulePatchInfo ? html`
        <lcards-form-section
          header="Rule Override"
          icon="mdi:gavel"
          ?expanded=${!this._collapsedDetailSections.has('patch')}>
          <div class="detail-section-content">
            ${this._renderBeforeAfter(
              'Original Value',
              'Patched Value',
              rulePatchInfo.original_value,
              rulePatchInfo.patched_value
            )}
            <div class="detail-subsection">
              <div class="rule-info">
                <div class="rule-info-row">
                  <span class="detail-label">Rule ID:</span>
                  <code class="rule-id">${rulePatchInfo.rule_id}</code>
                </div>
                <div class="rule-info-row">
                  <span class="detail-label">Condition:</span>
                  <code class="rule-condition">${rulePatchInfo.rule_condition}</code>
                </div>
              </div>
            </div>
          </div>
        </lcards-form-section>
      ` : ''}

      <!-- Template Processing Section (expandable with before/after) -->
      ${templateInfo ? html`
        <lcards-form-section
          header="Template Processing"
          icon="mdi:code-tags"
          ?expanded=${!this._collapsedDetailSections.has('template')}>
          <div class="detail-section-content">
            ${this._renderBeforeAfter(
              'Original Template',
              'Processed Result',
              templateInfo.original,
              templateInfo.processed
            )}
            <div class="detail-subsection">
              <div class="detail-row">
                <span class="detail-label">Processor:</span>
                <code>${templateInfo.processor}</code>
              </div>
              ${templateInfo.dependencies && templateInfo.dependencies.length > 0 ? html`
                <div class="detail-row">
                  <span class="detail-label">Dependencies:</span>
                  <div class="dependencies-list">
                    ${templateInfo.dependencies.map(dep => html`
                      <code class="dependency-item">${dep}</code>
                    `)}
                  </div>
                </div>
              ` : ''}
            </div>
          </div>
        </lcards-form-section>
      ` : ''}

      <!-- Used By Tokens Section (if other tokens reference this field) -->
      ${usedByTokens.length > 0 ? html`
        <lcards-form-section
          header="Referenced By Tokens"
          icon="mdi:link"
          secondary="${usedByTokens.length} token${usedByTokens.length !== 1 ? 's' : ''}"
          ?expanded=${!this._collapsedDetailSections.has('usedby')}>
          <div class="detail-section-content">
            <div class="used-by-list">
              ${usedByTokens.map(token => html`
                <div class="used-by-token-item">
                  <ha-icon icon="mdi:palette"></ha-icon>
                  <code>theme:${token.path}</code>
                  <span class="token-resolved-value">${this._formatValue(token.resolved_value)}</span>
                </div>
              `)}
            </div>
          </div>
        </lcards-form-section>
      ` : ''}

      <!-- Related Fields Section (expandable) -->
      ${relatedFields && (relatedFields.parent || relatedFields.children.length > 0) ? html`
        <lcards-form-section
          header="Related Fields"
          icon="mdi:file-tree"
          secondary="${relatedFields.children.length} child${relatedFields.children.length !== 1 ? 'ren' : ''}"
          ?expanded=${!this._collapsedDetailSections.has('related')}>
          <div class="detail-section-content">
            ${relatedFields.parent ? html`
              <div class="detail-subsection">
                <div class="detail-label">Parent:</div>
                <div class="related-fields-list">
                  <div
                    class="related-field-item"
                    @click=${() => this._navigateToPath(relatedFields.parent)}>
                    <ha-icon icon="mdi:chevron-up"></ha-icon>
                    ${relatedFields.parent}
                  </div>
                </div>
              </div>
            ` : ''}
            ${relatedFields.children.length > 0 ? html`
              <div class="detail-subsection">
                <div class="detail-label">Children (${relatedFields.children.length}):</div>
                <div class="related-fields-list">
                  ${relatedFields.children.map(child => html`
                    <div
                      class="related-field-item"
                      @click=${() => this._navigateToPath(child)}>
                      <ha-icon icon="mdi:chevron-down"></ha-icon>
                      ${child.split('.').pop()}
                    </div>
                  `)}
                </div>
              </div>
            ` : ''}
          </div>
        </lcards-form-section>
      ` : ''}

      <!-- Fallback if no additional info -->
      ${!themeTokenInfo && !rulePatchInfo && !templateInfo && usedByTokens.length === 0 && (!relatedFields || (!relatedFields.parent && relatedFields.children.length === 0)) ? html`
        <div class="detail-section">
          <p class="no-data-hint">
            <ha-icon icon="mdi:information-outline"></ha-icon>
            No additional provenance information available for this field.
          </p>
        </div>
      ` : ''}
    `;
  }

  _renderDetailValue(value) {
    const formatted = this._formatValue(value);

    // Check if it's a large object/array
    if (typeof value === 'object' && value !== null) {
      try {
        const jsonStr = JSON.stringify(value, null, 2);
        if (jsonStr.length > 100) {
          return html`<div class="detail-value-large">${jsonStr}</div>`;
        }
      } catch (e) {
        // Fall through to regular display
      }
    }

    return html`
      <div class="detail-row">
        <span class="detail-value">${formatted}</span>
      </div>
    `;
  }

  /**
   * Toggle tree node expansion
   */
  _toggleNode(e, path, hasChildren) {
    e.stopPropagation();
    if (!hasChildren) return;

    if (this._expandedNodes.has(path)) {
      this._expandedNodes.delete(path);
    } else {
      this._expandedNodes.add(path);
    }
    this.requestUpdate();
  }

  /**
   * Select a tree node to show details
   */
  _selectNode(path, key, value, source) {
    this._selectedNode = { path, key, value, source };
    this.requestUpdate();
  }

  /**
   * Navigate to a specific path in the tree
   */
  _navigateToPath(path) {
    // Expand all parent nodes
    const parts = path.split('.');
    for (let i = 1; i <= parts.length; i++) {
      const parentPath = parts.slice(0, i).join('.');
      this._expandedNodes.add(parentPath);
    }

    // Find and select the node
    const tree = this._provenance.config.tree;
    let current = tree;
    let key = '';

    for (const part of parts) {
      if (current[part]) {
        current = current[part];
        key = part;
      }
    }

    const source = current.__source || 'unknown';
    this._selectNode(path, key, current, source);
  }

  /**
   * Get actual value from config for a given path
   */
  _getActualValue(path) {
    // @ts-ignore - TS2339: auto-suppressed
    if (!this.config) return undefined;

    const parts = path.split('.');
    // @ts-ignore - TS2339: auto-suppressed
    let current = this.config;

    for (const part of parts) {
      if (current && typeof current === 'object' && part in current) {
        current = current[part];
      } else {
        return undefined;
      }
    }

    return current;
  }

  /**
   * Get theme token info for a field path
   */
  _getThemeTokenForField(fieldPath) {
    if (!this._provenance?.theme_tokens) return null;

    // Check if any token is used by this field
    for (const [tokenPath, tokenData] of Object.entries(this._provenance.theme_tokens)) {
      if (tokenData.used_by_fields && tokenData.used_by_fields.includes(fieldPath)) {
        return {
          path: tokenPath,
          ...tokenData
        };
      }
    }

    return null;
  }

  /**
   * Get rule patch info for a field path
   */
  _getRulePatchForField(fieldPath) {
    if (!this._provenance?.rule_patches) return null;
    return this._provenance.rule_patches[fieldPath] || null;
  }

  /**
   * Get template info for a field path
   */
  _getTemplateForField(fieldPath) {
    if (!this._provenance?.templates) return null;
    return this._provenance.templates[fieldPath] || null;
  }

  /**
   * Get related fields (parent and children) for a path
   */
  _getRelatedFields(path) {
    const parts = path.split('.');
    const parent = parts.length > 1 ? parts.slice(0, -1).join('.') : null;

    // Find children in field_sources
    const children = [];
    if (this._provenance?.config?.field_sources) {
      const childPrefix = path + '.';
      for (const fieldPath of Object.keys(this._provenance.config.field_sources)) {
        if (fieldPath.startsWith(childPrefix) && !fieldPath.substring(childPrefix.length).includes('.')) {
          children.push(fieldPath);
        }
      }
    }

    return { parent, children };
  }

  /**
   * Get all tokens that use a specific field (reverse lookup)
   */
  _getTokensUsingField(fieldPath) {
    if (!this._provenance?.theme_tokens) return [];

    const tokens = [];
    for (const [tokenPath, tokenData] of Object.entries(this._provenance.theme_tokens)) {
      if (tokenData.used_by_fields && tokenData.used_by_fields.includes(fieldPath)) {
        tokens.push({
          path: tokenPath,
          resolved_value: tokenData.resolved_value
        });
      }
    }

    return tokens;
  }

  /**
   * Render indicator badges for a node (in detail panel header)
   */
  _renderNodeBadges(themeTokenInfo, rulePatchInfo, templateInfo, usedByTokens) {
    const badges = [];

    if (themeTokenInfo) {
      badges.push(html`<span class="node-badge" title="Uses theme token">🔗</span>`);
    }
    if (rulePatchInfo) {
      badges.push(html`<span class="node-badge" title="Has rule patch">⚙️</span>`);
    }
    if (templateInfo) {
      badges.push(html`<span class="node-badge" title="Is templated">📝</span>`);
    }
    if (themeTokenInfo?.resolution_chain && themeTokenInfo.resolution_chain.length > 1) {
      badges.push(html`<span class="node-badge" title="Has resolution chain">🔀</span>`);
    }
    if (usedByTokens.length > 0) {
      badges.push(html`<span class="node-badge" title="Referenced by ${usedByTokens.length} token(s)">🔖 ${usedByTokens.length}</span>`);
    }

    return badges.length > 0 ? html`<div class="node-badges">${badges}</div>` : '';
  }

  /**
   * Render layer cake view showing configuration layers
   * Shows all layers in merge order with visual indicators
   */
  _renderLayerCake(fieldPath, finalSource, currentValue, rulePatchInfo) {
    // Get merge order from provenance
    const mergeOrder = this._provenance?.config?.merge_order || [];

    // Get enhanced field source info (includes layer-by-layer values)
    const fieldSourceInfo = this._provenanceTracker?.getFieldSourceInfo?.(fieldPath);
    const layerValues = fieldSourceInfo?.layers || {};

    // Define all possible layers in canonical order
    const allLayers = [
      { id: 'card_defaults', name: 'Card Defaults', icon: 'mdi:cog', description: 'Built-in defaults for this card type' },
      { id: 'component', name: 'Component', icon: 'mdi:cube-outline', description: 'Component-specific defaults (dpad, svg, gauge, etc.)' },
      { id: 'preset', name: 'Preset', icon: 'mdi:package-variant', description: 'Style preset applied to card' },
      { id: 'user_config', name: 'User Config', icon: 'mdi:account-edit', description: 'Your YAML configuration' },
      { id: 'rules', name: 'Rules (Dynamic)', icon: 'mdi:gavel', description: 'Runtime rule patches' }
    ];

    // If rules are active, they are the true final source
    const hasActiveRule = rulePatchInfo !== null;

    return html`
      <div class="layer-cake-container">
        ${allLayers.map((layer, index) => {
          // Determine layer status
          let status = 'not-used';
          let displayValue = null;
          let isActive = false;

          // Check if this is a preset layer (handle preset_* naming)
          const isPresetLayer = layer.id === 'preset';
          const matchesPreset = mergeOrder.some(l => l.startsWith('preset_'));
          const presetName = mergeOrder.find(l => l.startsWith('preset_'))?.replace('preset_', '');
          const presetLayerName = presetName ? `preset_${presetName}` : null;

          // Check if this is a component layer (handle component_* naming)
          const isComponentLayer = layer.id === 'component';
          const matchesComponent = mergeOrder.some(l => l.startsWith('component_'));
          const componentName = mergeOrder.find(l => l.startsWith('component_'))?.replace('component_', '');
          const componentLayerName = componentName ? `component_${componentName}` : null;

          // Get the actual layer key to use for value lookup
          let layerKey = layer.id;
          if (isPresetLayer) {
            layerKey = presetLayerName;
          } else if (isComponentLayer) {
            layerKey = componentLayerName;
          }

          // Check if layer is in merge order
          let layerInMerge = false;
          if (isPresetLayer) {
            layerInMerge = matchesPreset;
          } else if (isComponentLayer) {
            layerInMerge = matchesComponent;
          } else if (layer.id === 'rules') {
            // Rules is special - check if there are any rule patches
            layerInMerge = hasActiveRule;
          } else {
            layerInMerge = mergeOrder.includes(layer.id);
          }

          // Get value from this layer if available (use undefined check, not falsy!)
          const layerValue = layerKey && layerKey in layerValues ? layerValues[layerKey] : undefined;

          if (!layerInMerge) {
            status = 'not-used';
          } else if (layer.id === 'rules' && hasActiveRule) {
            // Rules layer is the TRUE final source when active
            status = 'active';
            isActive = true;
            displayValue = rulePatchInfo.patched_value;
          } else if (hasActiveRule) {
            // If rules are active, all other layers are just passthrough/setup
            // But we can show which layer set the "original" value that rules patched
            const matchesCurrentFinalSource = (
              layer.id === finalSource ||
              (isPresetLayer && finalSource.startsWith('preset_')) ||
              (isComponentLayer && finalSource.startsWith('component_'))
            );

            if (matchesCurrentFinalSource) {
              status = 'original';
              // Get the actual value from this layer
              displayValue = layerValue !== undefined ? layerValue : (rulePatchInfo.original_value !== undefined ? rulePatchInfo.original_value : currentValue);
            } else {
              status = 'passthrough';
              // Show the value at this layer if we have it
              displayValue = layerValue;
            }
          } else if (isPresetLayer && matchesPreset && finalSource.startsWith('preset_')) {
            // Preset layer is the final source (no rules)
            status = 'active';
            isActive = true;
            displayValue = layerValue !== undefined ? layerValue : currentValue;
          } else if (isComponentLayer && matchesComponent && finalSource.startsWith('component_')) {
            // Component layer is the final source (no rules)
            status = 'active';
            isActive = true;
            displayValue = layerValue !== undefined ? layerValue : currentValue;
          } else if (layer.id === finalSource) {
            // This layer is the final source (no rules)
            status = 'active';
            isActive = true;
            displayValue = layerValue !== undefined ? layerValue : currentValue;
          } else {
            // Layer is in merge but was overridden
            status = 'passthrough';
            // Show the value at this layer if we have it
            displayValue = layerValue;
          }

          // Build display name with component/preset name
          let layerDisplayName = layer.name;
          if (isPresetLayer && presetName) {
            layerDisplayName = `Preset: ${presetName}`;
          } else if (isComponentLayer && componentName) {
            layerDisplayName = `Component: ${componentName}`;
          }

          return html`
            ${index > 0 ? html`<div class="layer-separator"><ha-icon icon="mdi:chevron-down"></ha-icon></div>` : ''}
            ${this._renderLayerCard(layer, layerDisplayName, status, isActive, displayValue, rulePatchInfo)}
          `;
        })}
      </div>
    `;
  }

  /**
   * Render individual layer card in the cake
   */
  _renderLayerCard(layer, displayName, status, isActive, value, rulePatchInfo) {
    const statusConfig = {
      'not-used': {
        label: 'Not in merge',
        icon: 'mdi:close-circle-outline',
        cssClass: 'layer-not-used'
      },
      'passthrough': {
        label: 'Inherited from above',
        icon: 'mdi:arrow-down-thin',
        cssClass: 'layer-passthrough'
      },
      'original': {
        label: 'Set original value',
        icon: 'mdi:file-document-edit-outline',
        cssClass: 'layer-original'
      },
      'active': {
        label: 'Final value',
        icon: 'mdi:check-circle',
        cssClass: 'layer-active'
      }
    };

    const config = statusConfig[status];

    return html`
      <div class="layer-card ${config.cssClass}" data-layer="${layer.id}">
        <div class="layer-card-header">
          <div class="layer-icon-wrapper">
            <ha-icon icon="${layer.icon}"></ha-icon>
          </div>
          <div class="layer-info">
            <div class="layer-name">${displayName}</div>
            <div class="layer-description">${layer.description}</div>
          </div>
          <div class="layer-status">
            <ha-icon icon="${config.icon}"></ha-icon>
            <span>${config.label}</span>
          </div>
        </div>

        ${status !== 'not-used' ? html`
          <div class="layer-card-body">
            ${value !== null && value !== undefined ? html`
              <div class="layer-value">
                <span class="layer-value-label">${
                  status === 'original' ? 'Original:' :
                  status === 'active' ? 'Value:' :
                  'Set to:'
                }</span>
                ${(() => {
                  const formattedValue = this._formatValue(value);
                  const isMultiLine = formattedValue.includes('\n');
                  return isMultiLine
                    ? html`<pre class="layer-value-code">${formattedValue}</pre>`
                    : html`<code class="layer-value-code">${formattedValue}</code>`;
                })()}
                ${this._isColorValue(value) ? html`
                  <div class="color-preview-inline" style="background-color: ${value};"></div>
                ` : ''}
                ${status === 'passthrough' ? html`
                  <span class="layer-override-hint">(overridden by later layer)</span>
                ` : ''}
              </div>
              ${this._renderThemeTokenResolution(value)}
              ${layer.id === 'rules' && rulePatchInfo ? html`
                <div class="layer-rule-info">
                  <div class="rule-detail-line">
                    <ha-icon icon="mdi:tag"></ha-icon>
                    <span>Rule: <code>${rulePatchInfo.rule_id}</code></span>
                  </div>
                  ${rulePatchInfo.original_value !== undefined ? html`
                    <div class="rule-detail-line">
                      <ha-icon icon="mdi:replay"></ha-icon>
                      <span>Before: <code>${this._formatValue(rulePatchInfo.original_value)}</code></span>
                    </div>
                  ` : ''}
                </div>
              ` : ''}
            ` : html`
              <div class="layer-value-placeholder">
                <ha-icon icon="mdi:dots-horizontal"></ha-icon>
                <span>Not defined at this layer</span>
              </div>
            `}
          </div>
        ` : ''}
      </div>
    `;
  }

  /**
   * Render theme token resolution inline in layer cake
   * Shows resolved value if the value is a theme token reference
   */
  _renderThemeTokenResolution(value) {
    // Check if value is a theme token reference
    if (typeof value !== 'string' || !value.startsWith('theme:')) {
      return '';
    }

    // Extract token path
    const tokenPath = value.substring(6); // Remove 'theme:' prefix

    // Look up token in provenance
    const tokenInfo = this._provenance?.theme_tokens?.[tokenPath];
    if (!tokenInfo) {
      return html`
        <div class="layer-token-resolution">
          <ha-icon icon="mdi:help-circle-outline"></ha-icon>
          <span class="token-resolution-text">Token not resolved</span>
        </div>
      `;
    }

    const formattedValue = this._formatValue(tokenInfo.resolved_value);
    const isMultiLine = formattedValue.includes('\n');

    return html`
      <div class="layer-token-resolution">
        <ha-icon icon="mdi:palette"></ha-icon>
        <span class="token-resolution-label">Resolves to:</span>
        ${isMultiLine
          ? html`<pre class="token-resolution-value">${formattedValue}</pre>`
          : html`<code class="token-resolution-value">${formattedValue}</code>`
        }
      </div>
    `;
  }

  /**
   * Render resolution chain as vertical timeline flow
   */
  _renderResolutionChain(themeTokenInfo) {
    if (!themeTokenInfo.resolution_chain || themeTokenInfo.resolution_chain.length === 0) {
      return html`
        <div class="detail-row">
          <span class="detail-label">Token:</span>
          <code class="token-path">theme:${themeTokenInfo.path}</code>
        </div>
        <div class="detail-row">
          <span class="detail-label">Value:</span>
          <span class="detail-value">${this._formatValue(themeTokenInfo.resolved_value)}</span>
        </div>
      `;
    }

    // Map source layers to icons
    const getSourceIcon = (layer) => {
      const iconMap = {
        'defaults': 'mdi:cog',
        'card_defaults': 'mdi:cog',
        'theme': 'mdi:palette',
        'user': 'mdi:account',
        'user_config': 'mdi:account',
        'presets': 'mdi:package-variant',
        'rules': 'mdi:gavel'
      };
      return iconMap[layer] || 'mdi:arrow-right-circle';
    };

    return html`
      <div class="resolution-chain-flow">
        ${themeTokenInfo.resolution_chain.map((step, index) => {
          const isLast = index === themeTokenInfo.resolution_chain.length - 1;
          const sourceIcon = getSourceIcon(step.layer);

          return html`
            <div class="resolution-step-card" data-source="${step.layer || 'unknown'}">
              <div class="resolution-step-icon">
                <ha-icon icon="${sourceIcon}"></ha-icon>
              </div>
              <div class="resolution-step-body">
                <div class="resolution-step-header">
                  <span class="resolution-step-label">Step ${index + 1}</span>
                  ${step.layer ? html`<span class="source-layer-badge small" data-source="${step.layer}">${this._formatLayerName(step.layer)}</span>` : ''}
                </div>
                <div class="resolution-step-content">
                  ${step.from ? html`
                    <div class="resolution-from">
                      <span class="token-label">From:</span>
                      <code class="token-ref">theme:${step.from}</code>
                    </div>
                  ` : html`
                    <div class="resolution-token">
                      <span class="token-label">Token:</span>
                      <code class="token-ref">theme:${step.token || themeTokenInfo.path}</code>
                    </div>
                  `}
                  <div class="resolution-to">
                    <span class="token-label">Resolves to:</span>
                    <div class="token-value">
                      ${this._isColorValue(step.to || step.value) ? html`
                        <div class="color-preview-inline" style="background-color: ${step.to || step.value};"></div>
                      ` : ''}
                      <code>${this._formatValue(step.to || step.value)}</code>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            ${!isLast ? html`
              <ha-icon icon="mdi:chevron-double-down" class="chain-separator"></ha-icon>
            ` : ''}
          `;
        })}
      </div>
      <div class="resolution-final">
        <div class="resolution-final-label">Final Resolved Value:</div>
        <div class="resolution-final-value">
          ${this._isColorValue(themeTokenInfo.resolved_value) ? html`
            <div class="color-preview-inline" style="background-color: ${themeTokenInfo.resolved_value};"></div>
          ` : ''}
          <code>${this._formatValue(themeTokenInfo.resolved_value)}</code>
        </div>
      </div>
    `;
  }

  /**
   * Render before/after comparison for patches and templates
   */
  _renderBeforeAfter(beforeLabel, afterLabel, beforeValue, afterValue) {
    const beforeFormatted = this._formatValue(beforeValue);
    const afterFormatted = this._formatValue(afterValue);

    return html`
      <div class="before-after-container">
        <div class="before-after-panel before">
          <div class="before-after-label">${beforeLabel}</div>
          <div class="before-after-value">
            ${typeof beforeValue === 'string' && beforeValue.length > 50 ? html`
              <pre><code>${beforeValue}</code></pre>
            ` : html`
              <code>${beforeFormatted}</code>
            `}
          </div>
        </div>

        <div class="before-after-arrow">
          <ha-icon icon="mdi:arrow-right-thick"></ha-icon>
        </div>

        <div class="before-after-panel after">
          <div class="before-after-label">${afterLabel}</div>
          <div class="before-after-value">
            ${typeof afterValue === 'string' && afterValue.length > 50 ? html`
              <pre><code>${afterValue}</code></pre>
            ` : html`
              <code>${afterFormatted}</code>
            `}
            ${this._isColorValue(afterValue) ? html`
              <div class="color-preview-inline" style="background-color: ${afterValue};"></div>
            ` : ''}
          </div>
        </div>
      </div>
    `;
  }

  _renderLayerSection(layer, fields) {
    const isExpanded = !this._collapsedSections.has(layer);
    const sortedFields = this._sortFields(fields);

    return html`
      <lcards-form-section
        header="${this._formatLayerName(layer)}"
        secondary="${fields.length} field${fields.length !== 1 ? 's' : ''}"
        icon="mdi:source-branch"
        ?expanded=${isExpanded}>
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
      </lcards-form-section>
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
        <div class="tokens-grid">
          ${tokens.map(token => this._renderTokenCard(token))}
        </div>
      </div>
    `;
  }

  _renderTokenCard(token) {
    const displayValue = this._formatValue(token.resolved_value);
    const usedByFields = token.used_by_fields || [];
    const isMultiLine = displayValue.includes('\n');

    return html`
      <div class="token-card">
        <div class="token-card-header">
          <div class="token-path-display">
            <ha-icon icon="mdi:palette"></ha-icon>
            <code class="token-path">theme:${token.path}</code>
          </div>
          <div class="token-actions">
            <ha-icon-button
              @click=${(e) => this._copyTokenSyntax(token.path, e)}
              .label=${'Copy token syntax'}>
              <ha-icon icon="mdi:content-copy"></ha-icon>
            </ha-icon-button>
            <ha-icon-button
              @click=${(e) => this._copyValue(token.resolved_value, e)}
              .label=${'Copy value'}>
              <ha-icon icon="mdi:code-braces"></ha-icon>
            </ha-icon-button>
          </div>
        </div>

        <div class="token-card-body">
          <div class="token-value-section">
            <span class="token-section-label">Resolved Value:</span>
            <div class="token-value-display">
              ${isMultiLine
                ? html`<pre class="token-value-code">${displayValue}</pre>`
                : html`<code class="token-value-code">${displayValue}</code>`
              }
              ${this._isColorValue(token.resolved_value) ? html`
                <div
                  class="color-preview-large"
                  style="background-color: ${token.resolved_value};"
                  title="${token.resolved_value}">
                </div>
              ` : ''}
            </div>
          </div>

          ${usedByFields.length > 0 ? html`
            <div class="token-usage-section">
              <span class="token-section-label">Used By (${usedByFields.length}):</span>
              <div class="token-used-by-list">
                ${usedByFields.map(field => html`
                  <code class="field-reference">${field}</code>
                `)}
              </div>
            </div>
          ` : ''}
        </div>
      </div>
    `;
  }

  _renderStatsView() {
    const stats = this._getDetailedStats();

    return html`
      <div class="dialog-body">
        <div class="stats-header">
          <h3>Configuration Overview</h3>
          <div class="stats-subtitle">
            <ha-icon icon="mdi:package-variant"></ha-icon>
            <span>${this._provenance?.config?.card_type || 'unknown'} card</span>
          </div>
        </div>

        <!-- Quick Stats Grid -->
        <div class="stats-grid">
          <div class="stat-card modern">
            <ha-icon icon="mdi:file-tree" class="stat-icon"></ha-icon>
            <div class="stat-content">
              <div class="stat-value">${stats.totalFields}</div>
              <div class="stat-label">Total Fields</div>
            </div>
          </div>

          <div class="stat-card modern">
            <ha-icon icon="mdi:layers" class="stat-icon"></ha-icon>
            <div class="stat-content">
              <div class="stat-value">${stats.layerCount}</div>
              <div class="stat-label">Active Layers</div>
            </div>
          </div>

          <div class="stat-card modern">
            <ha-icon icon="mdi:palette" class="stat-icon"></ha-icon>
            <div class="stat-content">
              <div class="stat-value">${stats.tokenCount}</div>
              <div class="stat-label">Theme Tokens</div>
            </div>
          </div>

          <div class="stat-card modern">
            <ha-icon icon="mdi:account-edit" class="stat-icon"></ha-icon>
            <div class="stat-content">
              <div class="stat-value">${stats.userOverrides}</div>
              <div class="stat-label">User Overrides</div>
            </div>
          </div>
        </div>

        <!-- Layer Distribution -->
        <div class="stat-section">
          <div class="section-header">
            <ha-icon icon="mdi:chart-bar"></ha-icon>
            <h4>Layer Distribution</h4>
          </div>
          <div class="distribution-container">
            ${Object.entries(stats.layerDistribution).map(([layer, count]) => {
              const percentage = ((count / stats.totalFields) * 100).toFixed(1);
              return html`
                <div class="distribution-row">
                  <div class="distribution-label">
                    <span class="layer-name">${this._formatLayerName(layer)}</span>
                    <span class="layer-count">${count} fields</span>
                  </div>
                  <div class="distribution-bar-container">
                    <div class="distribution-bar">
                      <div
                        class="distribution-fill ${layer}"
                        style="width: ${percentage}%">
                      </div>
                    </div>
                    <span class="distribution-percentage">${percentage}%</span>
                  </div>
                </div>
              `;
            })}
          </div>
        </div>

        <!-- Top Theme Tokens -->
        ${stats.topTokens.length > 0 ? html`
          <div class="stat-section">
            <div class="section-header">
              <ha-icon icon="mdi:fire"></ha-icon>
              <h4>Most Used Theme Tokens</h4>
            </div>
            <div class="tokens-list">
              ${stats.topTokens.map((token, index) => html`
                <div class="token-item">
                  <div class="token-rank">#${index + 1}</div>
                  <div class="token-details">
                    <div class="token-path">theme:${token.path}</div>
                    <div class="token-meta">
                      <span class="token-usage">
                        <ha-icon icon="mdi:counter"></ha-icon>
                        ${token.count} ${token.count === 1 ? 'use' : 'uses'}
                      </span>
                      <span class="token-value-preview">${this._formatValue(token.value)}</span>
                    </div>
                  </div>
                </div>
              `)}
            </div>
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

  /**
   * Handle tab change from HA native tab group (Issue #82)
   * @param {CustomEvent} event - wa-tab-show event
   */
  _handleTabChange(event) {
    // CRITICAL: Stop propagation to prevent bubbling to parent tab handlers
    event.stopPropagation();

    // @ts-ignore - TS2339: auto-suppressed
    const view = event.target.activeTab?.getAttribute('value');
    if (view) {
      this._switchView(view);
    }
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

  _expandInterestingNodes() {
    // Expand paths that lead to nodes with tokens, patches, or templates
    if (!this._provenance) return;

    const interestingPaths = new Set();

    // Add paths for theme tokens
    if (this._provenance.theme_tokens) {
      for (const [, tokenData] of Object.entries(this._provenance.theme_tokens)) {
        if (tokenData.used_by_fields) {
          tokenData.used_by_fields.forEach(path => {
            // Add this path and all parent paths
            const parts = path.split('.');
            for (let i = 1; i <= parts.length; i++) {
              interestingPaths.add(parts.slice(0, i).join('.'));
            }
          });
        }
      }
    }

    // Add paths for rule patches
    if (this._provenance.rule_patches) {
      for (const path of Object.keys(this._provenance.rule_patches)) {
        const parts = path.split('.');
        for (let i = 1; i <= parts.length; i++) {
          interestingPaths.add(parts.slice(0, i).join('.'));
        }
      }
    }

    // Add paths for templates
    if (this._provenance.templates) {
      for (const path of Object.keys(this._provenance.templates)) {
        const parts = path.split('.');
        for (let i = 1; i <= parts.length; i++) {
          interestingPaths.add(parts.slice(0, i).join('.'));
        }
      }
    }

    lcardsLog.info('[ProvenanceTab] Expanding interesting nodes:', interestingPaths.size, 'paths');
    this._expandedNodes = interestingPaths;
    this.requestUpdate();
  }

  _expandAll() {
    // Recursively expand all nodes
    const expandAllPaths = (node, parentPath = '') => {
      if (!node || typeof node !== 'object') return;

      Object.keys(node).forEach(key => {
        if (key === '__source') return;

        const fullPath = parentPath ? `${parentPath}.${key}` : key;
        this._expandedNodes.add(fullPath);

        if (node[key] && typeof node[key] === 'object') {
          expandAllPaths(node[key], fullPath);
        }
      });
    };

    if (this._provenance?.config?.tree) {
      expandAllPaths(this._provenance.config.tree);
      lcardsLog.info('[ProvenanceTab] Expanded all nodes:', this._expandedNodes.size, 'total');
      this.requestUpdate();
    }
  }

  _collapseAll() {
    this._expandedNodes.clear();
    lcardsLog.info('[ProvenanceTab] Collapsed all nodes');
    this.requestUpdate();
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
        // @ts-ignore - TS2339: auto-suppressed
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

      // @ts-ignore - TS2339: auto-suppressed
      if (!this.config) {
        lcardsLog.warn('[ProvenanceTab] No config available');
        this._provenance = null;
        return;
      }

      // @ts-ignore - TS2339: auto-suppressed
      const cardType = this.config.type?.replace('custom:', '') || 'lcards-button';

      lcardsLog.debug('[ProvenanceTab] Searching for card type:', {
        // @ts-ignore - TS2339: auto-suppressed
        rawType: this.config.type,
        cardType: cardType,
        // @ts-ignore - TS2339: auto-suppressed
        configKeys: Object.keys(this.config)
      });

      // CRITICAL: Find the editor's preview card, not the dashboard card
      // When editing an existing card, there are TWO instances:
      //   1. The preview card in the editor dialog (.element-preview container)
      //   2. The original card on the dashboard
      // We want the preview card (#1) because that's what the editor is configuring
      //
      // DOM structure: .element-preview > hui-section > hui-grid-section > ... > hui-card > lcards-button
      // So we need to: (1) find .element-preview, (2) search inside it for the card

      // Strategy 1: Search up through parent shadow roots to find .element-preview
      let searchRoot = this.getRootNode();
      let previewContainer = null;

      let attempts = 0;
      while (searchRoot && attempts < 10) {
        // @ts-ignore - TS2339: auto-suppressed
        previewContainer = searchRoot.querySelector?.('.element-preview');
        if (previewContainer) {
          lcardsLog.debug('[ProvenanceTab] ✅ Found .element-preview container in shadow root');
          break;
        }

        // Move to parent shadow root
        // @ts-ignore - TS2339: auto-suppressed
        if (searchRoot.host) {
          // @ts-ignore - TS2339: auto-suppressed
          searchRoot = searchRoot.host.getRootNode();
        } else {
          break;
        }
        attempts++;
      }

      // Strategy 2: If not found in parent chain, search entire document
      if (!previewContainer) {
        lcardsLog.debug('[ProvenanceTab] .element-preview not found in parent chain, searching document...');

        // Helper to recursively search shadow roots for .element-preview
        const findPreviewContainer = (root) => {
          if (!root) return null;

          const preview = root.querySelector?.('.element-preview');
          if (preview) return preview;

          // Recursively search child shadow roots
          const allElements = root.querySelectorAll?.('*') || [];
          for (const el of allElements) {
            if (el.shadowRoot) {
              const found = findPreviewContainer(el.shadowRoot);
              if (found) return found;
            }
          }
          return null;
        };

        previewContainer = findPreviewContainer(document);
        if (previewContainer) {
          lcardsLog.debug('[ProvenanceTab] ✅ Found .element-preview via document search');
        }
      }

      // Strategy 3: Now search INSIDE .element-preview for the card
      if (previewContainer) {
        lcardsLog.debug('[ProvenanceTab] Searching inside .element-preview for:', cardType);

        // Search inside the preview container for the card
        // The card is nested deep: hui-section > hui-grid-section > ... > hui-card > lcards-button
        const searchInPreview = (root) => {
          if (!root) return null;

          // Try direct querySelector first
          let found = root.querySelector?.(cardType);
          if (found) return found;

          // Recursively search shadow roots
          const allElements = root.querySelectorAll?.('*') || [];
          for (const el of allElements) {
            if (el.shadowRoot) {
              found = searchInPreview(el.shadowRoot);
              if (found) return found;
            }
          }
          return null;
        };

        card = searchInPreview(previewContainer);
        if (card) {
          lcardsLog.info('[ProvenanceTab] ✅ Found preview card inside .element-preview');
        } else {
          lcardsLog.warn('[ProvenanceTab] ❌ Preview card not found in .element-preview, searched for:', cardType);
        }
      }

      // Strategy 4: Fallback - search for any card (might be dashboard card)
      if (!card) {
        lcardsLog.debug('[ProvenanceTab] Preview card not found, falling back to any card instance...');

        const searchAnywhere = (root) => {
          if (!root) return null;

          let found = root.querySelector?.(cardType);
          if (found) return found;

          const allElements = root.querySelectorAll?.('*') || [];
          for (const el of allElements) {
            if (el.shadowRoot) {
              found = searchAnywhere(el.shadowRoot);
              if (found) return found;
            }
          }
          return null;
        };

        card = searchAnywhere(document);
        if (card) {
          lcardsLog.warn('[ProvenanceTab] ⚠️ Found card outside .element-preview (may be dashboard card, not preview)');
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

      // Log which card we found for debugging
      const cardGuid = card._cardGuid || 'no-guid';
      const cardEntity = card.config?.entity || 'no-entity';
      const cardId = card.config?.id || 'no-id';
      lcardsLog.info(`[ProvenanceTab] ✅ Loading provenance from card: ${card.tagName}`, {
        guid: cardGuid,
        entity: cardEntity,
        id: cardId,
        isPreview: !!card.closest('.element-preview')
      });

      // Get provenance from the actual rendered card
      this._provenance = card.getProvenance();
      this._provenanceTracker = card._provenanceTracker; // Get the tracker instance
      lcardsLog.debug('[ProvenanceTab] Loaded provenance from rendered card:', this._provenance);
      lcardsLog.debug('[ProvenanceTab] Loaded provenance tracker:', this._provenanceTracker);

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

          // Log all fields that use theme tokens
          lcardsLog.info('[ProvenanceTab] 🎨 Fields using theme tokens:');
          for (const [tokenPath, tokenData] of Object.entries(this._provenance.theme_tokens)) {
            if (tokenData.used_by_fields && tokenData.used_by_fields.length > 0) {
              lcardsLog.info(`  Token "${tokenPath}" → used by:`, tokenData.used_by_fields);
            }
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

    // field_sources maps path -> layer info (string or object)
    // We need to get actual values from the tree
    const fields = Object.entries(fieldSources).map(([path, sourceInfo]) => {
      // Handle both string and object formats
      const layerName = typeof sourceInfo === 'string' ? sourceInfo : sourceInfo.final;

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

  _getSourceBadgeColor(source) {
    if (source === 'user_config' || source === 'user') return '#4caf50';
    if (source?.includes('preset')) return '#ff9800';
    if (source?.includes('theme')) return '#9c27b0';
    if (source?.includes('card_defaults') || source === 'defaults') return '#2196f3';
    if (source?.includes('rules')) return '#f44336';
    return 'var(--secondary-background-color)';
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
        // Always expand objects to show their structure
        return this._formatObjectExpanded(value);
      } catch (e) {
        return '[Complex Object]';
      }
    }

    return String(value);
  }

  /**
   * Format an object as an expanded, readable structure
   * @private
   */
  _formatObjectExpanded(obj, indent = 0) {
    const keys = Object.keys(obj);
    if (keys.length === 0) {
      return '{}';
    }

    // For small objects (1-2 keys), inline format
    if (keys.length <= 2 && indent === 0) {
      const pairs = keys.map(k => `${k}: ${this._formatObjectValue(obj[k])}`);
      return `{ ${pairs.join(', ')} }`;
    }

    // For larger objects, multi-line format
    const indentStr = '  '.repeat(indent);
    const innerIndent = '  '.repeat(indent + 1);
    const lines = keys.map(key => {
      const value = obj[key];
      const formattedValue = this._formatObjectValue(value, indent + 1);
      return `${innerIndent}${key}: ${formattedValue}`;
    });

    return `{\n${lines.join(',\n')}\n${indentStr}}`;
  }

  /**
   * Format a single value within an object
   * @private
   */
  _formatObjectValue(value, indent = 0) {
    if (value === undefined || value === null) {
      return 'null';
    }

    if (typeof value === 'string') {
      return `"${value}"`;
    }

    if (typeof value === 'number' || typeof value === 'boolean') {
      return String(value);
    }

    if (typeof value === 'object') {
      if (Array.isArray(value)) {
        return `[${value.length} items]`;
      }
      // Recursively format nested objects
      return this._formatObjectExpanded(value, indent);
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
