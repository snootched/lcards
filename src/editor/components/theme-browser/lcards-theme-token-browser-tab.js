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
import { ALERT_MODE_PALETTES, captureOriginalColors } from '../../../core/themes/paletteInjector.js';
import { editorStyles } from '../../base/editor-styles.js';
import {
  transformColorToAlertMode,
  getAlertModeTransform,
  setAlertModeTransformParameter,
  resetAlertModeTransform
} from '../../../core/themes/alertModeTransform.js';
import '../shared/lcards-collapsible-section.js';
import '../shared/lcards-form-section.js';
import '../shared/lcards-message.js';
import './alert-mode-color-wheel.js';
import '../../dialogs/pack-explorer/lcards-pack-explorer-dialog.js';

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
      _selectedAllVarsCategory: { type: String, state: true },
      _alertModePreview: { type: Boolean, state: true }, // Toggle for alert mode previews
      // Alert Mode Lab properties
      _selectedAlertMode: { type: String, state: true },
      _alertLabParams: { type: Object, state: true },
      _livePreviewEnabled: { type: Boolean, state: true },
      _originalLcarsColors: { type: Object, state: true }, // Store baseline colors
      _showFullPreview: { type: Boolean, state: true }, // Toggle for full color grid
      _activeVizTab: { type: String, state: true }, // Active visualization tab (preview/wheel/comparison)
      _packExplorerOpen: { type: Boolean, state: true } // Pack Explorer dialog state
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
    this._alertModePreview = false; // Default to off
    // Alert Mode Lab defaults
    this._selectedAlertMode = 'red_alert';
    this._alertLabParams = {};
    this._livePreviewEnabled = false; // User controls when to apply changes
    this._originalLcarsColors = null; // Will be captured when dialog opens
    this._showFullPreview = false; // Full color grid collapsed by default
    this._activeVizTab = 'preview'; // Default to live preview tab
    this._packExplorerOpen = false; // Pack Explorer closed by default
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
    return [
      editorStyles,
      css`
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

      /* HA native tab styling (Issue #82) */
      ha-tab-group {
        display: block;
        margin-bottom: 12px;
      }

      .theme-info {
        display: flex;
        gap: 12px;
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

      /* Alert mode preview swatches */
      .alert-mode-swatches {
        display: flex;
        gap: 3px;
        flex-wrap: nowrap;
        align-items: center;
        justify-content: flex-start;
      }

      .alert-swatch {
        width: 22px;
        height: 22px;
        border-radius: 3px;
        border: 1px solid var(--divider-color);
        cursor: pointer;
        transition: transform 0.1s ease;
        box-shadow: inset 0 0 0 1px rgba(0, 0, 0, 0.1);
        position: relative;
        flex-shrink: 0;
      }

      .alert-swatch:hover {
        transform: scale(1.3);
        z-index: 10;
      }

      .alert-swatch.active-mode {
        border: 2px solid var(--primary-color);
        box-shadow: 0 0 0 2px rgba(var(--rgb-primary-color), 0.3);
      }

      /* Alert mode toggle button in header */
      .alert-mode-toggle {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 8px 16px;
        background: var(--secondary-background-color);
        border-radius: 8px;
        cursor: pointer;
        user-select: none;
        transition: background 0.2s ease;
      }

      .alert-mode-toggle:hover {
        background: var(--divider-color);
      }

      .alert-mode-toggle.active {
        background: var(--primary-color);
        color: var(--text-primary-color);
      }

      .alert-mode-toggle ha-icon {
        --mdc-icon-size: 20px;
      }

      .alert-mode-toggle-label {
        font-size: 13px;
        font-weight: 500;
      }

      .alert-mode-info {
        display: flex;
        align-items: center;
        gap: 12px;
        flex-wrap: wrap;
      }

      .hsl-formula-info {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 6px 12px;
        background: var(--secondary-background-color);
        border-radius: 6px;
      }

      /* HSL Formula Table */
      .hsl-formula-table {
        margin-top: 12px;
        background: var(--card-background-color);
        border-radius: 8px;
        overflow: hidden;
        border: 1px solid var(--divider-color);
      }

      .hsl-formula-table table {
        width: 100%;
        border-collapse: collapse;
      }

      .hsl-formula-table th,
      .hsl-formula-table td {
        padding: 8px 12px;
        text-align: left;
        border-bottom: 1px solid var(--divider-color);
        font-size: 13px;
      }

      .hsl-formula-table th {
        background: var(--secondary-background-color);
        font-weight: 600;
        color: var(--primary-text-color);
      }

      .hsl-formula-table td {
        font-family: 'Courier New', monospace;
        color: var(--secondary-text-color);
      }

      .hsl-formula-table tr:last-child td {
        border-bottom: none;
      }

      .hsl-formula-table .mode-name {
        font-weight: 500;
        color: var(--primary-text-color);
        font-family: inherit;
      }

      .hsl-formula-table .mode-icon {
        margin-right: 6px;
      }

      /* Alert mode swatch legend */
      .alert-mode-legend {
        display: flex;
        gap: 3px;
        flex-wrap: nowrap;
        align-items: center;
        justify-content: flex-start;
        margin-top: 2px;
      }

      .alert-legend-label {
        width: 22px;
        height: 12px;
        font-size: 9px;
        text-align: center;
        color: var(--secondary-text-color);
        flex-shrink: 0;
        line-height: 12px;
        font-weight: 600;
        font-size: 12px;
        color: var(--secondary-text-color);
        border: 1px solid var(--divider-color);
      }

      .hsl-formula-info code {
        background: var(--card-background-color);
        padding: 2px 6px;
        border-radius: 3px;
        font-family: 'Roboto Mono', monospace;
        font-size: 11px;
        color: var(--primary-text-color);
      }

      .hsl-formula-info strong {
        color: var(--primary-text-color);
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

      /* Alert Mode Lab Styles */
      .alert-lab-container {
        padding: 20px;
        display: grid;
        grid-template-columns: 450px 1fr;
        gap: 32px;
        align-items: start;
      }

      @media (max-width: 1200px) {
        .alert-lab-container {
          grid-template-columns: 1fr;
        }
      }

      .alert-lab-left-column {
        position: sticky;
        top: 20px;
        display: flex;
        flex-direction: column;
        gap: 12px;
      }

      .alert-lab-right-column {
        display: flex;
        flex-direction: column;
      }

      /* Alert Lab: HA native tab styling for visualization tabs (Issue #82) */
      .alert-lab-right-column ha-tab-group {
        display: block;
        margin-bottom: 12px;
      }

      .alert-lab-header {
        display: flex;
        flex-direction: column;
        gap: 12px;
        padding-bottom: 16px;
        border-bottom: 2px solid var(--divider-color);
      }

      .mode-selection-controls {
        display: flex;
        flex-direction: column;
        gap: 12px;
      }

      .mode-selector-row {
        display: flex;
        align-items: center;
        gap: 12px;
        width: 100%;
      }

      .mode-selector-row label {
        font-weight: 500;
        color: var(--primary-text-color);
      }

      .alert-mode-select {
        padding: 8px 12px;
        border: 1px solid var(--divider-color);
        border-radius: 4px;
        background: var(--card-background-color);
        color: var(--primary-text-color);
        font-size: 14px;
        flex: 1;
        cursor: pointer;
      }

      .alert-mode-select:focus {
        outline: 2px solid var(--primary-color);
        outline-offset: 2px;
      }

      .live-preview-toggle {
        display: flex;
        align-items: center;
      }

      .live-preview-toggle label {
        display: flex;
        align-items: center;
        gap: 8px;
        cursor: pointer;
        color: var(--secondary-text-color);
        font-size: 13px;
      }

      .live-preview-toggle input[type="checkbox"] {
        cursor: pointer;
      }

      .parameter-controls {
        display: flex;
        flex-direction: column;
        gap: 12px;
        margin-bottom: 12px;
      }

      .slider-control {
        display: flex;
        flex-direction: column;
        gap: 8px;
        padding: 12px 0;
      }

      .slider-label-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
      }

      .slider-label-row label {
        font-size: 14px;
        color: var(--primary-text-color);
        font-weight: 500;
      }

      .slider-value {
        font-size: 13px;
        color: var(--primary-color);
        font-weight: 600;
        font-family: 'Roboto Mono', monospace;
        min-width: 60px;
        text-align: right;
      }

      .parameter-slider {
        width: 100%;
        height: 6px;
        border-radius: 3px;
        background: var(--divider-color);
        outline: none;
        -webkit-appearance: none;
        appearance: none;
      }

      .parameter-slider::-webkit-slider-thumb {
        -webkit-appearance: none;
        appearance: none;
        width: 18px;
        height: 18px;
        border-radius: 50%;
        background: var(--primary-color);
        cursor: pointer;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
      }

      .parameter-slider::-moz-range-thumb {
        width: 18px;
        height: 18px;
        border-radius: 50%;
        background: var(--primary-color);
        cursor: pointer;
        border: none;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
      }

      .parameter-slider:focus::-webkit-slider-thumb {
        box-shadow: 0 0 0 3px rgba(var(--rgb-primary-color), 0.2);
      }

      .parameter-slider:focus::-moz-range-thumb {
        box-shadow: 0 0 0 3px rgba(var(--rgb-primary-color), 0.2);
      }

      .alert-lab-actions {
        display: flex;
        gap: 12px;
        margin-bottom: 12px;
        flex-wrap: wrap;
      }

      .alert-lab-actions ha-button {
        flex: 1;
        min-width: 140px;
      }

      .preview-section {
        background: var(--card-background-color);
        border: 1px solid var(--divider-color);
        border-radius: 8px;
        padding: 20px;
      }

      .preview-section h4 {
        margin: 0 0 8px 0;
        color: var(--primary-text-color);
        font-size: 16px;
        font-weight: 500;
      }

      .preview-hint {
        margin: 0 0 16px 0;
        color: var(--secondary-text-color);
        font-size: 13px;
      }

      .preview-swatches-container {
        display: flex;
        flex-direction: column;
        gap: 12px;
      }

      .preview-swatch-group {
        display: flex;
        flex-direction: column;
        gap: 12px;
      }

      .swatch-group-title {
        margin: 0;
        font-size: 14px;
        font-weight: 600;
        color: var(--primary-text-color);
        padding-bottom: 8px;
        border-bottom: 1px solid var(--divider-color);
      }

      .preview-swatches-grid {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 12px;
      }

      .preview-swatch-item {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 8px;
      }

      .preview-swatch {
        width: 60px;
        height: 60px;
        border-radius: 8px;
        border: 2px solid var(--divider-color);
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        transition: transform 0.2s;
      }

      .preview-swatch:hover {
        transform: scale(1.1);
      }

      .swatch-label {
        font-size: 12px;
        color: var(--secondary-text-color);
        text-align: center;
      }

      /* Color Comparison Grid Styles */
      .comparison-grid-container {
        display: flex;
        flex-direction: column;
        max-height: 600px;
        overflow-y: auto;
        border: 1px solid var(--divider-color);
        border-radius: 4px;
        background: var(--card-background-color);
      }

      .comparison-grid-header {
        display: grid;
        grid-template-columns: 200px 1fr 1fr;
        gap: 12px;
        padding: 12px 16px;
        background: var(--secondary-background-color);
        border-bottom: 2px solid var(--divider-color);
        position: sticky;
        top: 0;
        z-index: 1;
        font-weight: 600;
        font-size: 13px;
      }

      .comparison-column-label {
        color: var(--primary-text-color);
      }

      .comparison-grid-body {
        display: flex;
        flex-direction: column;
      }

      .comparison-row {
        display: grid;
        grid-template-columns: 200px 1fr 1fr;
        gap: 12px;
        padding: 12px 16px;
        border-bottom: 1px solid var(--divider-color);
        transition: background-color 0.2s;
      }

      .comparison-row:hover {
        background-color: var(--secondary-background-color);
      }

      .comparison-var-name {
        display: flex;
        align-items: center;
      }

      .comparison-var-name code {
        font-size: 11px;
        color: var(--primary-text-color);
        word-break: break-all;
      }

      .comparison-color-cell {
        display: flex;
        align-items: center;
        gap: 12px;
      }

      .comparison-swatch {
        width: 40px;
        height: 40px;
        border-radius: 4px;
        border: 1px solid var(--divider-color);
        flex-shrink: 0;
      }

      .comparison-hex {
        font-size: 12px;
        color: var(--secondary-text-color);
        font-family: monospace;
      }

      .comparison-grid-empty {
        padding: 24px;
        text-align: center;
        color: var(--secondary-text-color);
      }

      /* Color Wheel Visualization Styles */
      .visualization-section {
        margin-top: 24px;
        padding: 20px;
        border-radius: 8px;
        background: var(--card-background-color);
        border: 1px solid var(--divider-color);
      }

      .visualization-section h4 {
        margin: 0 0 8px 0;
        font-size: 16px;
        font-weight: 600;
      }

      .visualization-section .preview-hint {
        margin: 0 0 16px 0;
        font-size: 13px;
        color: var(--secondary-text-color);
      }

      .color-wheel-layout {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 32px;
        align-items: start;
      }

      .color-wheel-visual {
        display: flex;
        justify-content: center;
        align-items: center;
      }

      .color-wheel-explanation {
        display: flex;
        flex-direction: column;
        gap: 12px;
      }

      .color-wheel-explanation h5 {
        margin: 0;
        font-size: 16px;
        font-weight: 600;
        color: var(--primary-text-color);
      }

      .color-wheel-explanation h6 {
        margin: 0 0 8px 0;
        font-size: 14px;
        font-weight: 600;
        color: var(--primary-text-color);
      }

      .explanation-section {
        padding: 12px 16px;
        background: var(--secondary-background-color);
        border-radius: 4px;
        border-left: 3px solid var(--primary-color);
      }

      .explanation-section p {
        margin: 0;
        font-size: 13px;
        line-height: 1.5;
        color: var(--secondary-text-color);
      }

      .explanation-section ul {
        margin: 8px 0 0 0;
        padding-left: 20px;
        font-size: 13px;
        line-height: 1.6;
      }

      .explanation-section li {
        margin-bottom: 6px;
        color: var(--secondary-text-color);
      }

      .explanation-tip {
        padding: 12px 16px;
        background: rgba(33, 150, 243, 0.1);
        border-radius: 4px;
        border-left: 3px solid var(--info-color, #2196f3);
        font-size: 13px;
        line-height: 1.5;
        color: var(--secondary-text-color);
      }

      /* Responsive: stack on smaller screens */
      @media (max-width: 900px) {
        .color-wheel-layout {
          grid-template-columns: 1fr;
        }
      }
      `
    ];
  }

  firstUpdated() {
    this._loadTokens();
  }

  render() {
    return html`
      ${this._renderTabContent()}
      ${this._renderDialog()}
      ${this._renderPackExplorer()}
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
          <div class="info-card-content">
            <h3>Theme Browser</h3>
            <p>
              <strong>${this._activeTheme?.name || 'Active Theme'}</strong>
              <br />
              ${this._tokens.length} tokens available
            </p>
            <p style="font-size: 13px; color: var(--secondary-text-color);">
              Browse and copy theme tokens for <strong>style configuration</strong>: <code>theme:token.path</code>
            </p>
          </div>
          <div class="info-card-actions">
            <ha-button
              class="open-browser-button"
              raised
              @click=${this._openDialog}>
              <ha-icon icon="mdi:palette" slot="start"></ha-icon>
              Open Theme Browser
            </ha-button>
            <ha-button
              class="open-pack-explorer-button"
              @click=${this._openPackExplorer}>
              <ha-icon icon="mdi:package-variant" slot="start"></ha-icon>
              Browse All Packs
            </ha-button>
          </div>
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
        .heading=${this._renderDialogTitle()}>
        <div class="dialog-content">
          ${this._renderDialogHeader()}
          ${this._activeView === 'tokens' ? this._renderCategoryFilters() : ''}
          ${this._activeView === 'all-vars' ? this._renderAllVarsCategoryFilters() : ''}
          ${this._renderDialogBody()}
        </div>
        <ha-button
          slot="primaryAction"
          variant="brand"
          appearance="accent"
          @click=${this._closeDialog}
          dialogAction="close">
          Close
        </ha-button>
      </ha-dialog>
    `;
  }

  _renderDialogTitle() {
    return `Theme Browser  •  HA: ${this._haThemeName}  •  LCARdS: ${this._activeTheme?.name || 'Unknown'}`;
  }

  _renderDialogHeader() {
    return html`
      <div class="dialog-header">
        <!-- Using HA native tab components (Issue #82) -->
        <ha-tab-group @wa-tab-show=${this._handleTabChange}>
          <ha-tab-group-tab value="tokens" ?active=${this._activeView === 'tokens'}>
            LCARdS Theme Tokens (${this._tokens.length})
          </ha-tab-group-tab>
          <ha-tab-group-tab value="css-vars" ?active=${this._activeView === 'css-vars'}>
            LCARS CSS Variables (${this._cssVariables.length})
          </ha-tab-group-tab>
          <ha-tab-group-tab value="all-vars" ?active=${this._activeView === 'all-vars'}>
            All CSS Variables (${this._allCssVariables.length})
          </ha-tab-group-tab>
          <ha-tab-group-tab value="alert-lab" ?active=${this._activeView === 'alert-lab'}>
            Alert Mode Lab
          </ha-tab-group-tab>
        </ha-tab-group>
        ${this._activeView === 'css-vars' ? html`
          <div class="alert-mode-info">
            <div
              class="alert-mode-toggle ${this._alertModePreview ? 'active' : ''}"
              @click=${this._toggleAlertModePreview}
              title="Toggle alert mode color previews">
              <ha-icon icon="mdi:${this._alertModePreview ? 'eye' : 'eye-off'}"></ha-icon>
              <span class="alert-mode-toggle-label">Alert Mode Preview</span>
            </div>
            ${this._alertModePreview ? html`
              <div class="hsl-formula-info">
                <strong>--lcars-*:</strong>
                <span>HSL transform</span>
              </div>
              <div class="hsl-formula-info">
                <strong>--lcards-*:</strong>
                <span>Pre-defined palettes</span>
              </div>
            ` : ''}
          </div>
          ${this._alertModePreview ? html`
            <div class="hsl-formula-table">
              <table>
                <thead>
                  <tr>
                    <th>Mode</th>
                    <th>Hue Shift</th>
                    <th>Hue Strength</th>
                    <th>Saturation ×</th>
                    <th>Lightness ×</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><span class="mode-icon">🟢</span><span class="mode-name">Green (Normal)</span></td>
                    <td>0°</td>
                    <td>0</td>
                    <td>1.0</td>
                    <td>1.0</td>
                  </tr>
                  <tr>
                    <td><span class="mode-icon">🔴</span><span class="mode-name">Red Alert</span></td>
                    <td>0°</td>
                    <td>0.8</td>
                    <td>1.2</td>
                    <td>0.9</td>
                  </tr>
                  <tr>
                    <td><span class="mode-icon">🔵</span><span class="mode-name">Blue Alert</span></td>
                    <td>240°</td>
                    <td>0.8</td>
                    <td>1.0</td>
                    <td>1.0</td>
                  </tr>
                  <tr>
                    <td><span class="mode-icon">🟡</span><span class="mode-name">Yellow Alert</span></td>
                    <td>45°</td>
                    <td>0.7</td>
                    <td>1.1</td>
                    <td>1.05</td>
                  </tr>
                  <tr>
                    <td><span class="mode-icon">⚫</span><span class="mode-name">Gray Alert</span></td>
                    <td>0°</td>
                    <td>0</td>
                    <td>0</td>
                    <td>1.0</td>
                  </tr>
                  <tr>
                    <td><span class="mode-icon">⚪</span><span class="mode-name">Black Alert</span></td>
                    <td>0°</td>
                    <td>0</td>
                    <td>0</td>
                    <td>0.3</td>
                  </tr>
                </tbody>
              </table>
            </div>
          ` : ''}
        ` : ''}
        ${this._activeView !== 'alert-lab' ? html`
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
        ` : ''}
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

    if (this._activeView === 'alert-lab') {
      return this._renderAlertLab();
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
        // If alert mode preview is enabled, show swatches for all modes
        if (this._alertModePreview) {
          return this._renderAlertModeSwatches(valueStr, token.path);
        }

        // Default: single color preview
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
   * Render alert mode color swatches
   * @param {string} baseColor - Base color value
   * @param {string} pathOrVarName - Token path or CSS variable name
   * @param {boolean} isCssVar - Whether this is a CSS variable (true) or token (false)
   */
  _renderAlertModeSwatches(baseColor, pathOrVarName, isCssVar = false) {
    const alertModes = [
      { name: 'green_alert', label: 'Green', icon: '🟢', shortLabel: 'GRN' },
      { name: 'red_alert', label: 'Red', icon: '🔴', shortLabel: 'RED' },
      { name: 'blue_alert', label: 'Blue', icon: '🔵', shortLabel: 'BLU' },
      { name: 'yellow_alert', label: 'Yellow', icon: '🟡', shortLabel: 'YEL' },
      { name: 'gray_alert', label: 'Gray', icon: '⚫', shortLabel: 'GRY' },
      { name: 'black_alert', label: 'Black', icon: '⚪', shortLabel: 'BLK' }
    ];

    const currentMode = this._getCurrentAlertMode();

    // Determine variable name
    const varName = isCssVar
      ? pathOrVarName
      : `--lcards-${pathOrVarName.split('.').pop()}`;

    // Use captured original color if available (prevents drift)
    const originalColor = this._originalLcarsColors?.[varName] || baseColor;

    return html`
      <div>
        <div class="alert-mode-swatches">
          ${alertModes.map(mode => {
            const color = mode.name === 'green_alert'
              ? originalColor
              : this._getAlertModeColor(originalColor, varName, mode.name);

            const isActive = mode.name === currentMode;

            return html`
              <div
                class="alert-swatch ${isActive ? 'active-mode' : ''}"
                style="background-color: ${color};"
                title="${mode.label}: ${color}"
                @click=${(e) => this._copyResolvedColor(color, e)}>
              </div>
            `;
          })}
        </div>
        <div class="alert-mode-legend">
          ${alertModes.map(mode => html`
            <div class="alert-legend-label">${mode.shortLabel}</div>
          `)}
        </div>
      </div>
    `;
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
          ${cssVar.isColor ? (
            this._alertModePreview
              ? this._renderAlertModeSwatches(cssVar.value, cssVar.name, true)
              : html`
                <div
                  class="color-preview"
                  style="background-color: var(${cssVar.name});"
                  title="Live preview of ${cssVar.name}">
                </div>
              `
          ) : ''}
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

  /**
   * Render Alert Mode Lab view
   */
  _renderAlertLab() {
    const transform = getAlertModeTransform(this._selectedAlertMode);

    return html`
      <div class="alert-lab-container">
        <!-- LEFT COLUMN: Controls -->
        <div class="alert-lab-left-column">
          <!-- Mode Selection Section -->
          <lcards-form-section
            .header=${'Alert Mode Selection'}
            .description=${'Choose mode and control settings'}
            ?expanded=${true}
            .collapsible=${false}
          >
            <div class="mode-selection-controls">
              <div class="mode-selector-row">
                <label>Alert Mode:</label>
                <select
                  .value="${this._selectedAlertMode}"
                  @change="${this._handleModeChange}"
                  class="alert-mode-select"
                >
                  <option value="green_alert">🟢 Green Alert (Normal)</option>
                  <option value="red_alert">🔴 Red Alert</option>
                  <option value="blue_alert">🔵 Blue Alert</option>
                  <option value="yellow_alert">🟡 Yellow Alert</option>
                  <option value="gray_alert">⚪ Gray Alert</option>
                  <option value="black_alert">⚫ Black Alert</option>
                </select>
              </div>

              <ha-selector
                .hass="${this.hass}"
                .label="${'Auto-apply changes'}"
                .value="${this._livePreviewEnabled}"
                .selector=${{
                  boolean: {}
                }}
                @value-changed="${(e) => this._livePreviewEnabled = e.detail.value}"
              ></ha-selector>
            </div>
          </lcards-form-section>

          <!-- Parameter Controls -->
          ${this._selectedAlertMode !== 'green_alert' ? html`
            <div class="parameter-controls">
              <lcards-form-section
                .header=${'Core Transform Parameters'}
                .description=${'Fundamental HSL transformation settings'}
                ?expanded=${true}
              >
                ${this._renderParameterSlider('hueShift', 'Hue Target', 0, 360, 1, '°', transform.hueShift)}
                ${this._renderParameterSlider('hueStrength', 'Hue Strength', 0, 1, 0.05, '', transform.hueStrength)}
                ${this._renderParameterSlider('saturationMultiplier', 'Saturation', 0, 3, 0.05, '×', transform.saturationMultiplier)}
                ${this._renderParameterSlider('lightnessMultiplier', 'Lightness', 0, 2, 0.05, '×', transform.lightnessMultiplier)}
              </lcards-form-section>

              ${transform.hueAnchor ? html`
                <lcards-form-section
                  .header=${'Hue Anchoring'}
                  .description=${'Pull colors toward a target hue range'}
                  ?expanded=${false}
                >
                  ${this._renderParameterSlider('hueAnchor.centerHue', 'Center Hue', 0, 360, 1, '°', transform.hueAnchor.centerHue)}
                  ${this._renderParameterSlider('hueAnchor.range', 'Range', 0, 180, 5, '°', transform.hueAnchor.range)}
                  ${this._renderParameterSlider('hueAnchor.strength', 'Pull Strength', 0, 1, 0.05, '', transform.hueAnchor.strength)}
                </lcards-form-section>
              ` : ''}

              ${transform.contrastEnhancement?.enabled ? html`
                <lcards-form-section
                  .header=${'Contrast Enhancement'}
                  .description=${'Improve readability in dark modes'}
                  ?expanded=${false}
                >
                  ${this._renderParameterSlider('contrastEnhancement.threshold', 'Threshold', 0, 100, 1, '%', transform.contrastEnhancement.threshold)}
                  ${this._renderParameterSlider('contrastEnhancement.darkMultiplier', 'Dark Multiplier', 0, 1, 0.05, '', transform.contrastEnhancement.darkMultiplier)}
                  ${this._renderParameterSlider('contrastEnhancement.lightMultiplier', 'Light Multiplier', 1, 2, 0.05, '', transform.contrastEnhancement.lightMultiplier)}
                </lcards-form-section>
              ` : ''}
            </div>
          ` : html`
            <div class="parameter-controls">
              <p style="padding: 20px; text-align: center; color: var(--secondary-text-color);">
                Green Alert is the baseline state. Parameters cannot be edited.
              </p>
            </div>
          `}

          <!-- Action Buttons -->
          <div class="alert-lab-actions">
            <ha-button @click="${this._applyAlertMode}">
              <ha-icon icon="mdi:play" slot="start"></ha-icon>
              Apply Live
            </ha-button>
            <ha-button @click="${this._resetToDefaults}">
              <ha-icon icon="mdi:restore" slot="start"></ha-icon>
              Reset to Defaults
            </ha-button>
            <ha-button @click="${this._saveToHelpers}">
              <ha-icon icon="mdi:content-save" slot="start"></ha-icon>
              Save to Helpers
            </ha-button>
            <ha-button @click="${this._exportAlertConfig}">
              <ha-icon icon="mdi:export" slot="start"></ha-icon>
              Export Config
            </ha-button>
          </div>
        </div>

        <!-- RIGHT COLUMN: Visualizations -->
        <div class="alert-lab-right-column">
          <!-- Visualization Tabs using HA native components (Issue #82) -->
          <ha-tab-group @wa-tab-show=${this._handleVizTabChange}>
            <ha-tab-group-tab value="preview" ?active=${this._activeVizTab === 'preview'}>
              Live Preview
            </ha-tab-group-tab>
            <ha-tab-group-tab value="wheel" ?active=${this._activeVizTab === 'wheel'}>
              HSL Wheel
            </ha-tab-group-tab>
            <ha-tab-group-tab value="comparison" ?active=${this._activeVizTab === 'comparison'}>
              Full Comparison
            </ha-tab-group-tab>
          </ha-tab-group>

          <!-- Tab Content -->
          ${this._activeVizTab === 'preview' ? html`
            <div class="preview-section">
              <h4>Live Preview</h4>
              <p class="preview-hint">Key LCARS colors in selected alert mode:</p>
              ${this._renderAlertModePreviewSwatches()}
            </div>
          ` : ''}

          ${this._activeVizTab === 'wheel' ? html`
            <div class="visualization-section">
              <h4>🎨 HSL Color Wheel Transformation</h4>
              <p class="preview-hint">Visual representation of how colors shift in HSL space.</p>
              <p class="preview-hint" style="font-size: 12px; margin-top: -8px; color: var(--secondary-text-color);">
                <em>Showing the same 12 variables as above. Click legend items to toggle visibility.</em>
              </p>
              ${this._renderColorWheel()}
            </div>
          ` : ''}

          ${this._activeVizTab === 'comparison' ? html`
            <lcards-form-section
              .header=${'Full Color Comparison'}
              .description=${'Side-by-side comparison of all LCARS color variables'}
              ?expanded=${true}
            >
              ${this._renderColorComparisonGrid()}
            </lcards-form-section>
          ` : ''}
        </div>
      </div>
    `;
  }

  /**
   * Render a parameter slider control using ha-selector
   */
  _renderParameterSlider(paramPath, label, min, max, step, unit, value) {
    return html`
      <ha-selector
        .hass="${this.hass}"
        .label="${label}"
        .value="${value || min}"
        .selector=${{
          number: {
            min: min,
            max: max,
            step: step,
            mode: 'slider',
            unit_of_measurement: unit
          }
        }}
        @value-changed="${(e) => this._handleParamChange(paramPath, e.detail.value)}"
      ></ha-selector>
    `;
  }  /**
   * Render alert mode preview swatches
   */
  _renderAlertModePreviewSwatches() {
    // Key LCARS colors to show in preview - organized in 3 groups (4x3 grid)
    const colorGroups = [
      {
        title: 'UI Colors',
        colors: [
          { name: 'Primary', cssVar: '--lcars-ui-primary' },
          { name: 'Secondary', cssVar: '--lcars-ui-secondary' },
          { name: 'Tertiary', cssVar: '--lcars-ui-tertiary' },
          { name: 'Quaternary', cssVar: '--lcars-ui-quaternary' },
        ]
      },
      {
        title: 'Card Colors',
        colors: [
          { name: 'Top', cssVar: '--lcars-card-top-color' },
          { name: 'Mid-Left', cssVar: '--lcars-card-mid-left-color' },
          { name: 'Button', cssVar: '--lcars-card-button' },
          { name: 'Bottom', cssVar: '--lcars-card-bottom-color' },
        ]
      },
      {
        title: 'State & Alert Colors',
        colors: [
          { name: 'Success', cssVar: '--success-color' },
          { name: 'Warning', cssVar: '--warning-color' },
          { name: 'Error', cssVar: '--error-color' },
          { name: 'Alert', cssVar: '--lcars-alert-color' },
        ]
      }
    ];

    return html`
      <div class="preview-swatches-container">
        ${colorGroups.map(group => html`
          <div class="preview-swatch-group">
            <h5 class="swatch-group-title">${group.title}</h5>
            <div class="preview-swatches-grid">
              ${group.colors.map(c => {
                // Use captured original colors if available, fallback to current computed style
                const originalColor = this._originalLcarsColors?.[c.cssVar] ||
                                     getComputedStyle(document.documentElement).getPropertyValue(c.cssVar).trim();
                const transformedColor = transformColorToAlertMode(originalColor, this._selectedAlertMode);

                return html`
                  <div class="preview-swatch-item">
                    <div
                      class="preview-swatch"
                      style="background-color: ${transformedColor}"
                      title="${c.name}: ${transformedColor}"
                    ></div>
                    <span class="swatch-label">${c.name}</span>
                  </div>
                `;
              })}
            </div>
          </div>
        `)}
      </div>
    `;
  }

  /**
   * Render full color comparison grid (original vs transformed)
   */
  _renderColorComparisonGrid() {
    if (!this._originalLcarsColors || Object.keys(this._originalLcarsColors).length === 0) {
      return html`
        <div class="comparison-grid-empty">
          <p>⚠️ Original colors not captured. Close and reopen dialog to enable comparison view.</p>
        </div>
      `;
    }

    // Sort variables alphabetically
    const sortedVars = Object.keys(this._originalLcarsColors).sort();

    return html`
      <div class="comparison-grid-container">
        <div class="comparison-grid-header">
          <div class="comparison-column-label">Variable Name</div>
          <div class="comparison-column-label">Original (Green Alert)</div>
          <div class="comparison-column-label">Transformed (${this._selectedAlertMode.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())})</div>
        </div>
        <div class="comparison-grid-body">
          ${sortedVars.map(varName => {
            const originalColor = this._originalLcarsColors[varName];
            const transformedColor = transformColorToAlertMode(originalColor, this._selectedAlertMode);

            return html`
              <div class="comparison-row">
                <div class="comparison-var-name">
                  <code>${varName}</code>
                </div>
                <div class="comparison-color-cell">
                  <div class="comparison-swatch" style="background-color: ${originalColor}"></div>
                  <code class="comparison-hex">${originalColor}</code>
                </div>
                <div class="comparison-color-cell">
                  <div class="comparison-swatch" style="background-color: ${transformedColor}"></div>
                  <code class="comparison-hex">${transformedColor}</code>
                </div>
              </div>
            `;
          })}
        </div>
      </div>
    `;
  }

  /**
   * Render color wheel visualization
   */
  _renderColorWheel() {
    if (!this._originalLcarsColors || Object.keys(this._originalLcarsColors).length === 0) {
      return html`
        <div class="comparison-grid-empty">
          <p>⚠️ Original colors not captured. Close and reopen dialog to enable color wheel.</p>
        </div>
      `;
    }

    // Get the same 12 key colors that are shown in the preview swatches above
    const keyVars = [
      // UI Colors (4)
      '--lcars-ui-primary',
      '--lcars-ui-secondary',
      '--lcars-ui-tertiary',
      '--lcars-ui-quaternary',
      // Card Colors (4)
      '--lcars-card-top-color',
      '--lcars-card-mid-left-color',
      '--lcars-card-button',
      '--lcars-card-bottom-color',
      // HA State Colors (3)
      '--success-color',
      '--warning-color',
      '--error-color',
      // Alert Color (1)
      '--lcars-alert-color'
    ];

    const originalColors = keyVars
      .filter(varName => this._originalLcarsColors[varName])
      .map(varName => ({
        color: this._originalLcarsColors[varName],
        varName: varName,
        name: varName.replace('--lcars-', '').replace(/-/g, ' ')
      }));

    const transformedColors = originalColors.map(orig => ({
      color: transformColorToAlertMode(orig.color, this._selectedAlertMode),
      name: orig.name
    }));

    // Get current transform config for visualization
    const transform = getAlertModeTransform(this._selectedAlertMode);

    return html`
      <div class="color-wheel-layout">
        <div class="color-wheel-visual">
          <alert-mode-color-wheel
            .originalColors=${originalColors}
            .transformedColors=${transformedColors}
            .anchorConfig=${transform.hueAnchor || null}
            .hueShift=${transform.hueShift}
            .showArrows=${true}
          ></alert-mode-color-wheel>
        </div>

        <div class="color-wheel-explanation">
          <h5>📖 Understanding the Visualization</h5>

          <div class="explanation-section">
            <h6>What You're Seeing:</h6>
            <ul>
              <li><strong>⭕ Circles (black border):</strong> Original colors from Green Alert baseline</li>
              <li><strong>◼️ Squares (white border):</strong> Transformed colors in ${this._getModeName(this._selectedAlertMode)}</li>
              <li><strong>🎨 Filled with actual colors:</strong> See the real color values at each position</li>
              <li><strong>🔍 Hover to zoom:</strong> Mouse over any shape to enlarge it for better visibility</li>
              <li><strong>➡️ Gray arrows:</strong> Show how each color shifts from source to target</li>
              <li><strong>📏 Radial position:</strong> Saturation level (center = gray, edge = vibrant)</li>
              <li><strong>🔄 Angular position:</strong> Hue angle (0° = red, 120° = green, 240° = blue)</li>
            </ul>
          </div>

          ${transform.hueAnchor ? html`
            <div class="explanation-section">
              <h6>🎯 Hue Anchor:</h6>
              <p>The <strong>shaded arc</strong> shows the target hue range (${transform.hueAnchor.centerHue - transform.hueAnchor.range}° - ${transform.hueAnchor.centerHue + transform.hueAnchor.range}°). Colors are "pulled" toward this range with ${Math.round(transform.hueAnchor.strength * 100)}% strength.</p>
            </div>
          ` : ''}

          ${transform.hueShift !== undefined ? html`
            <div class="explanation-section">
              <h6>🎨 Hue Shift:</h6>
              <p>Primary target: <strong>${transform.hueShift}°</strong> (${this._getHueName(transform.hueShift)})</p>
              <p>Colors shift toward this hue with ${Math.round(transform.hueStrength * 100)}% strength.</p>
            </div>
          ` : ''}

          <div class="explanation-section">
            <h6>💡 Transform Parameters:</h6>
            <ul>
              <li><strong>Saturation:</strong> ${transform.saturationMultiplier}× (${transform.saturationMultiplier > 1 ? 'more vivid' : 'more muted'})</li>
              <li><strong>Lightness:</strong> ${transform.lightnessMultiplier}× (${transform.lightnessMultiplier > 1 ? 'brighter' : 'darker'})</li>
            </ul>
          </div>

          <div class="explanation-tip">
            <strong>💡 Tip:</strong> Adjust the sliders above and watch the blue dots move in real-time to see how parameters affect the transformation!
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Get friendly mode name
   */
  _getModeName(mode) {
    const names = {
      'green_alert': 'Green Alert',
      'red_alert': 'Red Alert',
      'blue_alert': 'Blue Alert',
      'yellow_alert': 'Yellow Alert',
      'gray_alert': 'Gray Alert',
      'black_alert': 'Black Alert'
    };
    return names[mode] || mode;
  }

  /**
   * Get friendly hue name from degree
   */
  _getHueName(degree) {
    if (degree < 30 || degree >= 330) return 'Red';
    if (degree < 60) return 'Orange';
    if (degree < 90) return 'Yellow';
    if (degree < 150) return 'Green';
    if (degree < 210) return 'Cyan';
    if (degree < 270) return 'Blue';
    if (degree < 330) return 'Magenta';
    return 'Red';
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

    // Capture original LCARS colors for side-by-side comparison
    this._originalLcarsColors = captureOriginalColors(document.documentElement);
    lcardsLog.debug('[AlertLab] Captured original colors:', Object.keys(this._originalLcarsColors || {}).length);

    // Initialize Alert Lab with current running alert mode
    if (window.lcards?.getAlertMode) {
      this._selectedAlertMode = window.lcards.getAlertMode();
      lcardsLog.debug('[AlertLab] Initialized with current mode:', this._selectedAlertMode);
    }
    
    // Load helper values if available
    this._loadAlertLabFromHelpers();
  }
  
  /**
   * Load Alert Lab parameters from helpers (if they exist)
   * @private
   */
  _loadAlertLabFromHelpers() {
    if (!window.lcards?.core?.helperManager) {
      lcardsLog.debug('[AlertLab] HelperManager not available, skipping helper load');
      return;
    }
    
    const helperManager = window.lcards.core.helperManager;
    
    // Load parameters for each alert mode
    ['red', 'yellow', 'blue', 'white'].forEach(mode => {
      const hueKey = `alert_lab_${mode}_hue`;
      const satKey = `alert_lab_${mode}_saturation`;
      const lightKey = `alert_lab_${mode}_lightness`;
      
      // Check if helpers exist
      if (helperManager.helperExists(hueKey)) {
        const hue = parseFloat(helperManager.getHelperValue(hueKey));
        const saturation = parseFloat(helperManager.getHelperValue(satKey)) / 100; // Convert % to multiplier
        const lightness = parseFloat(helperManager.getHelperValue(lightKey)) / 100; // Convert % to multiplier
        
        // Apply to alert mode transform
        const modeKey = `${mode}_alert`;
        setAlertModeTransformParameter(modeKey, 'hueShift', hue);
        setAlertModeTransformParameter(modeKey, 'saturationMultiplier', saturation);
        setAlertModeTransformParameter(modeKey, 'lightnessMultiplier', lightness);
        
        lcardsLog.debug(`[AlertLab] Loaded ${modeKey} from helpers:`, { hue, saturation, lightness });
      }
    });
    
    this.requestUpdate();
  }

  _closeDialog() {
    lcardsLog.debug('[ThemeTokenBrowser] Closing dialog');
    this._dialogOpen = false;
  }

  /**
   * Open Pack Explorer dialog
   * @private
   */
  _openPackExplorer() {
    lcardsLog.debug('[ThemeTokenBrowser] Opening Pack Explorer');
    this._packExplorerOpen = true;
  }

  /**
   * Close Pack Explorer dialog
   * @private
   */
  _closePackExplorer() {
    lcardsLog.debug('[ThemeTokenBrowser] Closing Pack Explorer');
    this._packExplorerOpen = false;
  }

  /**
   * Handle tab change from HA native tab group (Issue #82)
   * @param {CustomEvent} event - wa-tab-show event
   */
  _handleTabChange(event) {
    // CRITICAL: Stop propagation to prevent bubbling to parent tab handlers
    event.stopPropagation();

    const view = event.target.activeTab?.getAttribute('value');
    if (view) {
      this._switchView(view);
    }
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

  /**
   * Handle visualization tab change in Alert Mode Lab (Issue #82)
   * @param {CustomEvent} event - wa-tab-show event
   */
  _handleVizTabChange(event) {
    // CRITICAL: Stop propagation to prevent bubbling to parent tab handlers
    event.stopPropagation();

    const tab = event.target.activeTab?.getAttribute('value');
    if (tab) {
      this._activeVizTab = tab;
      this.requestUpdate();
    }
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
   * Toggle alert mode preview
   */
  _toggleAlertModePreview() {
    this._alertModePreview = !this._alertModePreview;
    lcardsLog.debug('[ThemeTokenBrowser] Alert mode preview:', this._alertModePreview);
  }

  /**
   * Get color for a specific alert mode
   * @param {string} baseColor - Base color value
   * @param {string} varName - CSS variable name (to determine if it's --lcars-* or --lcards-*)
   * @param {string} alertMode - Alert mode name
   * @returns {string} Transformed color
   */
  _getAlertModeColor(baseColor, varName, alertMode) {
    // For --lcards-* variables, use pre-defined palettes
    if (varName.startsWith('--lcards-')) {
      const key = varName.replace('--lcards-', '');
      const palette = ALERT_MODE_PALETTES[alertMode];
      return palette?.[key] || baseColor;
    }

    // For --lcars-* variables, use HSL transformation
    try {
      return transformColorToAlertMode(baseColor, alertMode);
    } catch (error) {
      lcardsLog.warn('[ThemeTokenBrowser] Error transforming color:', error);
      return baseColor;
    }
  }

  /**
   * Get current active alert mode
   * @returns {string}
   */
  _getCurrentAlertMode() {
    return window.lcards?.core?.themeManager?.getAlertMode?.() || 'green_alert';
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

  /**
   * Alert Mode Lab Event Handlers
   */

  async _handleModeChange(e) {
    this._selectedAlertMode = e.target.value;
    lcardsLog.debug('[AlertLab] Mode changed to:', this._selectedAlertMode);

    // If auto-apply is enabled, switch to the new alert mode immediately
    if (this._livePreviewEnabled) {
      await this._applyAlertMode();
    }

    // Force re-render to show new parameters
    this.requestUpdate();
  }

  _handleParamChange(paramPath, value) {
    lcardsLog.debug('[AlertLab] Parameter changed:', paramPath, value);

    // Handle nested parameters (e.g., hueAnchor.centerHue)
    if (paramPath.includes('.')) {
      const [parent, child] = paramPath.split('.');
      const currentTransform = getAlertModeTransform(this._selectedAlertMode);
      const parentObj = { ...currentTransform[parent], [child]: value };
      setAlertModeTransformParameter(this._selectedAlertMode, parent, parentObj);
    } else {
      setAlertModeTransformParameter(this._selectedAlertMode, paramPath, value);
    }

    // Force re-render to update slider value display
    this.requestUpdate();

    // Auto-apply if enabled
    if (this._livePreviewEnabled) {
      // Debounce the apply
      clearTimeout(this._applyDebounceTimeout);
      this._applyDebounceTimeout = setTimeout(() => {
        this._applyAlertMode();
      }, 150);
    }
  }

  async _applyAlertMode() {
    lcardsLog.info('[AlertLab] Applying alert mode:', this._selectedAlertMode);

    if (!this.hass) {
      lcardsLog.warn('[AlertLab] No hass instance available');
      return;
    }

    try {
      // Use the window.lcards API to apply
      if (window.lcards?.setAlertMode) {
        await window.lcards.setAlertMode(this._selectedAlertMode);
        lcardsLog.info('[AlertLab] Alert mode applied successfully');
        // Force preview update
        this.requestUpdate();
      }
    } catch (error) {
      lcardsLog.error('[AlertLab] Error applying alert mode:', error);
    }
  }

  async _resetToDefaults() {
    lcardsLog.info('[AlertLab] Resetting to defaults:', this._selectedAlertMode);

    resetAlertModeTransform(this._selectedAlertMode);

    // Force re-render
    this.requestUpdate();

    // Auto-apply if enabled
    if (this._livePreviewEnabled) {
      await this._applyAlertMode();
    }
  }
  
  /**
   * Save current Alert Lab parameters to helpers
   * @private
   */
  async _saveToHelpers() {
    if (!window.lcards?.core?.helperManager) {
      lcardsLog.error('[AlertLab] HelperManager not available');
      if (this.hass?.callService) {
        await this.hass.callService('persistent_notification', 'create', {
          title: 'Helper Manager Unavailable',
          message: 'Helper Manager is not initialized. Cannot save parameters.',
          notification_id: 'lcards_alert_lab_error'
        });
      }
      return;
    }
    
    const helperManager = window.lcards.core.helperManager;
    const transform = getAlertModeTransform(this._selectedAlertMode);
    
    // Extract mode key (red, yellow, blue, white)
    const modeKey = this._selectedAlertMode.replace('_alert', '');
    
    // Cannot save green_alert (it's baseline)
    if (modeKey === 'green') {
      lcardsLog.warn('[AlertLab] Cannot save green_alert parameters');
      return;
    }
    
    try {
      // Save hue, saturation, lightness to helpers
      await helperManager.setHelperValue(`alert_lab_${modeKey}_hue`, transform.hueShift);
      await helperManager.setHelperValue(`alert_lab_${modeKey}_saturation`, transform.saturationMultiplier * 100);
      await helperManager.setHelperValue(`alert_lab_${modeKey}_lightness`, transform.lightnessMultiplier * 100);
      
      lcardsLog.info('[AlertLab] Saved parameters to helpers:', {
        mode: this._selectedAlertMode,
        hue: transform.hueShift,
        saturation: transform.saturationMultiplier,
        lightness: transform.lightnessMultiplier
      });
      
      // Show success notification
      if (this.hass?.callService) {
        await this.hass.callService('persistent_notification', 'create', {
          title: 'Alert Lab Saved',
          message: `Parameters for ${this._selectedAlertMode} saved to helpers successfully.`,
          notification_id: 'lcards_alert_lab_saved'
        });
      }
    } catch (error) {
      lcardsLog.error('[AlertLab] Failed to save to helpers:', error);
      if (this.hass?.callService) {
        await this.hass.callService('persistent_notification', 'create', {
          title: 'Save Failed',
          message: `Failed to save parameters: ${error.message}`,
          notification_id: 'lcards_alert_lab_error'
        });
      }
    }
  }

  async _exportAlertConfig() {
    try {
      const config = await window.lcards.alertConfig.export();
      const json = JSON.stringify(config, null, 2);

      // Copy to clipboard
      await navigator.clipboard.writeText(json);

      lcardsLog.info('[AlertLab] Configuration copied to clipboard');

      // Show notification (if available)
      if (this.hass?.callService) {
        this.hass.callService('persistent_notification', 'create', {
          message: `Alert mode configuration copied to clipboard!\n\n\`\`\`json\n${json}\n\`\`\``,
          title: 'LCARdS Alert Config Exported'
        });
      }
    } catch (error) {
      lcardsLog.error('[AlertLab] Error exporting config:', error);
    }
  }

  /**
   * Render Pack Explorer dialog
   * @private
   */
  _renderPackExplorer() {
    if (!this._packExplorerOpen) return '';

    return html`
      <lcards-pack-explorer-dialog
        .hass=${this.hass}
        .open=${this._packExplorerOpen}
        @closed=${this._closePackExplorer}>
      </lcards-pack-explorer-dialog>
    `;
  }
}

customElements.define('lcards-theme-token-browser-tab', LCARdSThemeTokenBrowserTab);
