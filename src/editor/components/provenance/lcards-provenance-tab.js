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
        max-height: 75vh;
        overflow: hidden;
      }

      /* Dialog Header */
      .dialog-header {
        display: flex;
        flex-direction: column;
        gap: 12px;
        padding-bottom: 12px;
        border-bottom: 1px solid var(--divider-color);
        flex-shrink: 0;
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

      /* Split Pane Layout - New Tree View */
      .split-pane-container {
        display: grid;
        grid-template-columns: 35% 65%;
        gap: 16px;
        flex: 1;
        min-height: 0;
        overflow: hidden;
      }

      .tree-pane {
        display: flex;
        flex-direction: column;
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
        overflow-y: auto;
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

      .tree-node-content.selected .node-source-badge {
        background: rgba(255, 255, 255, 0.2);
        color: white;
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

      .node-source-badge {
        font-size: 11px;
        padding: 2px 8px;
        border-radius: 10px;
        background: var(--secondary-background-color);
        color: var(--secondary-text-color);
        font-weight: 500;
      }

      /* Source Layer Color Coding */
      .node-source-badge[data-source="user_config"],
      .node-source-badge[data-source="user"] {
        background: #4caf50;
        color: white;
      }

      .node-source-badge[data-source*="preset"] {
        background: #ff9800;
        color: white;
      }

      .node-source-badge[data-source*="theme"] {
        background: #9c27b0;
        color: white;
      }

      .node-source-badge[data-source*="card_defaults"],
      .node-source-badge[data-source="defaults"] {
        background: #2196f3;
        color: white;
      }

      .node-source-badge[data-source*="rules"] {
        background: #f44336;
        color: white;
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
        margin-bottom: 16px;
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
        color: var(--divider-color);
      }

      .detail-section {
        margin-bottom: 24px;
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

        <!-- Hide search for tree view, show for other views -->
        ${this._activeView !== 'stats' && this._activeView !== 'tree' ? html`
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

        <!-- Hide layer filters for tree view -->
        ${this._activeView === 'tokens' ? this._renderLayerFilters() : ''}

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
    `;
  }

  /**
   * Recursively render tree nodes
   */
  _renderTreeNodes(node, parentPath) {
    if (!node || typeof node !== 'object') return '';

    const entries = Object.entries(node).filter(([key]) => key !== '__source');

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
                <span class="node-source-badge" data-source="${source}">
                  ${this._formatLayerName(source)}
                </span>
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
            ${i > 0 ? html`<span class="breadcrumb-sep">›</span>` : ''}
            <span>${part}</span>
          `)}
        </div>
      </div>

      <!-- Source Layer Section (always visible) -->
      <div class="detail-section">
        <div class="detail-section-title">
          <ha-icon icon="mdi:source-branch"></ha-icon>
          Source Layer
        </div>
        <span class="source-layer-badge" data-source="${source}">
          ${this._formatLayerName(source)}
        </span>
      </div>

      <!-- Value Section (always visible) -->
      <div class="detail-section">
        <div class="detail-section-title">
          <ha-icon icon="mdi:code-braces"></ha-icon>
          Current Value
        </div>
        ${this._renderDetailValue(actualValue)}
      </div>

      <!-- Theme Token Resolution Section (expandable) -->
      ${themeTokenInfo ? html`
        <lcards-collapsible-section
          .title=${'Token Resolution'}
          .icon=${'mdi:palette'}
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
        </lcards-collapsible-section>
      ` : ''}

      <!-- Rule Patch Section (expandable with before/after) -->
      ${rulePatchInfo ? html`
        <lcards-collapsible-section
          .title=${'Rule Override'}
          .icon=${'mdi:gavel'}
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
        </lcards-collapsible-section>
      ` : ''}

      <!-- Template Processing Section (expandable with before/after) -->
      ${templateInfo ? html`
        <lcards-collapsible-section
          .title=${'Template Processing'}
          .icon=${'mdi:code-tags'}
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
        </lcards-collapsible-section>
      ` : ''}

      <!-- Used By Tokens Section (if other tokens reference this field) -->
      ${usedByTokens.length > 0 ? html`
        <lcards-collapsible-section
          .title=${'Referenced By Tokens'}
          .icon=${'mdi:link'}
          .badge=${String(usedByTokens.length)}
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
        </lcards-collapsible-section>
      ` : ''}

      <!-- Related Fields Section (expandable) -->
      ${relatedFields && (relatedFields.parent || relatedFields.children.length > 0) ? html`
        <lcards-collapsible-section
          .title=${'Related Fields'}
          .icon=${'mdi:file-tree'}
          .badge=${String(relatedFields.children.length)}
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
        </lcards-collapsible-section>
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
    if (!this.config) return undefined;

    const parts = path.split('.');
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
        previewContainer = searchRoot.querySelector?.('.element-preview');
        if (previewContainer) {
          lcardsLog.debug('[ProvenanceTab] ✅ Found .element-preview container in shadow root');
          break;
        }

        // Move to parent shadow root
        if (searchRoot.host) {
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

          // NEW: Log all fields that use theme tokens
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
