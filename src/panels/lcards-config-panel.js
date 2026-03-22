/**
 * @fileoverview LCARdS Configuration Panel - Central UI for helper management
 *
 * Tabbed interface for managing LCARdS persistent configuration:
 * - Helpers tab: View status, create, and edit helper values
 * - Theme Browser tab: Theme tokens and alert mode configuration
 * - YAML Export tab: Copyable YAML for manual setup
 *
 * This panel must be registered manually in Home Assistant's configuration.yaml:
 *
 * ```yaml
 * panel_custom:
 *   - name: lcards-config-panel
 *     sidebar_title: LCARdS Config
 *     sidebar_icon: mdi:cog
 *     url_path: lcards-config-panel
 *     module_url: /hacsfiles/lcards/lcards.js
 * ```
 *
 * @element lcards-config-panel
 */

import { LitElement, html, css } from 'lit';
import { lcardsLog } from '../utils/lcards-logging.js';
import '../editor/components/theme-browser/lcards-theme-token-browser-tab.js';
import '../editor/components/pack-explorer/lcards-pack-explorer-tab.js';
import '../editor/components/shared/lcards-collapsible-section.js';
import './components/lcards-sound-config-tab.js';

export class LCARdSConfigPanel extends LitElement {
  static properties = {
    hass: { type: Object },
    narrow: { type: Boolean },
    panel: { type: Object },
    _selectedTab: { type: Number, state: true },
    _helpers: { type: Array, state: true },
    _missingHelpers: { type: Array, state: true },
    _createInProgress: { type: Boolean, state: true },
    _filterText: { type: String, state: true },
    _initialLoadDone: { type: Boolean, state: true },
    _selectedCategory: { type: String, state: true },
    _expandedCategories: { type: Set, state: true }
  };

  constructor() {
    super();
    /** @type {any} */
    this.hass = undefined;
    this._selectedTab = 0;
    this._helpers = [];
    this._missingHelpers = [];
    this._createInProgress = false;
    this._filterText = '';
    this._initialLoadDone = false;
    this._selectedCategory = 'all';
    this._expandedCategories = new Set();
    this._helperSubscriptions = []; // Track subscriptions for cleanup
  }

  /**
   * Called when properties change
   * Propagate hass to helper manager when it becomes available
   */
  willUpdate(changedProps) {
    super.willUpdate(changedProps);

    if (changedProps.has('hass') && this.hass) {
      // Propagate hass to core (critical for alert mode commands to work)
      if (window.lcards?.core) {
        lcardsLog.debug('[ConfigPanel] Propagating hass to Core');
        window.lcards.core.ingestHass(this.hass);
      }

      // Propagate hass to helper manager
      if (window.lcards?.core?.helperManager) {
        lcardsLog.debug('[ConfigPanel] Propagating hass to HelperManager');
        window.lcards.core.helperManager.updateHass(this.hass);

        // Trigger initial load once hass is available
        if (!this._initialLoadDone) {
          this._initialLoadDone = true;
          // Small delay to ensure helper manager state is populated
          setTimeout(() => this._loadHelperStatus(), 100);
        }
      }
    }
  }

  static styles = css`
    :host {
      display: block;
      height: 100vh;
      background: var(--primary-background-color);
      overflow: hidden;
    }

    .panel-container {
      display: flex;
      flex-direction: column;
      height: 100%;
      margin: 0 auto;
    }

    /* Helpers tab container */
    .studio-layout {
      flex: 1;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      background: var(--primary-background-color);
      min-height: 0;
      border-radius: var(--ha-card-border-radius, 12px);
      padding: 16px;
    }

    /* Helpers tab layout (used only in Helpers tab) */
    .dialog-content {
      display: flex;
      flex-direction: column;
      flex: 1;
      min-height: 0;
      overflow: hidden;
    }

    .dialog-header {
      flex-shrink: 0;
    }

    .dialog-body {
      flex: 1;
      overflow: auto;
      padding: 0;
    }

    .header {
      padding: 24px 24px 16px;
      border-bottom: 1px solid var(--divider-color);
      background: var(--card-background-color);
      flex-shrink: 0;
    }

    .header h1 {
      font-size: 1.8em;
      margin: 0 0 4px 0;
      color: var(--primary-text-color);
      font-weight: 500;
    }

    .header p {
      margin: 0;
      color: var(--secondary-text-color);
      font-size: 0.95em;
    }

    /* HA Native Tab Styling */
    ha-tab-group {
      display: block;
      margin: 0;
      border-bottom: 2px solid var(--divider-color);
      background: var(--card-background-color);
      flex-shrink: 0;
    }

    ha-tab-group-tab ha-icon {
      --mdc-icon-size: 18px;
      margin-right: 8px;
    }

    .tab {
      background: transparent;
      border: none;
      border-bottom: 3px solid transparent;
      color: var(--secondary-text-color);
      font-size: 1em;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;
    }

    .tab:hover {
      color: var(--primary-text-color);
      background: var(--secondary-background-color);
    }

    .tab.active {
      color: var(--primary-color);
      border-bottom-color: var(--primary-color);
    }

    .tab-content {
      flex: 1;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      padding: 8px;
      min-height: 0;
      background: var(--secondary-background-color);
    }

    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }

    .card {
      background: rgba(60,60,60,0.7);
      border-radius: var(--ha-card-border-radius, 12px);
      padding: 20px;
      margin-bottom: 16px;
      box-shadow: var(--ha-card-box-shadow, 0 2px 8px rgba(0,0,0,0.1));
      border: 1px solid var(--divider-color);
    }

    .card h2 {
      margin: 0 0 16px 0;
      font-size: 1.2em;
      color: var(--primary-text-color);
      font-weight: 500;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .card h2 ha-icon {
      --mdc-icon-size: 20px;
      color: var(--primary-color);
    }

    .helper-table {
      width: 100%;
      border-collapse: collapse;
      background: var(--primary-background-color);
    }

    .helper-table th,
    .helper-table td {
      padding: 8px;
      text-align: left;
      border-bottom: 1px solid var(--divider-color);
    }

    .helper-table th {
      font-weight: 600;
      color: var(--primary-text-color);
      background: var(--primary-background-color);
      position: sticky;
      top: 0;
      z-index: 1;
    }

    .helper-table td {
      color: var(--primary-text-color);
    }

    .helper-table tr:hover {
      background: var(--secondary-background-color);
    }

    .helper-name {
      font-weight: 500;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .helper-entity-id {
      font-family: 'Courier New', monospace;
      font-size: 0.9em;
      color: var(--secondary-text-color);
    }

    .helper-description {
      color: var(--secondary-text-color);
      font-size: 0.9em;
      margin-top: 4px;
    }

    /* Rotating animation for loading icon */
    @keyframes rotate {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }

    .rotating {
      animation: rotate 2s linear infinite;
    }

    .helper-value {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .action-button {
      padding: 8px 16px;
      background: var(--primary-color);
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 0.9em;
      font-weight: 500;
      transition: all 0.2s;
    }

    .action-button:hover {
      opacity: 0.9;
      transform: translateY(-1px);
    }

    .action-button:disabled {
      opacity: 0.5;
      cursor: not-allowed;
      transform: none;
    }

    .action-button.secondary {
      background: var(--secondary-color, #666);
    }

    .create-all-button {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 12px 24px;
      font-size: 1em;
      margin-bottom: 16px;
    }

    .yaml-output {
      background: var(--code-editor-background-color, #1e1e1e);
      color: var(--code-editor-text-color, #d4d4d4);
      padding: 16px;
      border-radius: 8px;
      font-family: 'Courier New', monospace;
      font-size: 0.9em;
      white-space: pre;
      overflow-x: auto;
      max-height: 600px;
      overflow-y: auto;
      margin-top: 12px;
      border: 1px solid var(--divider-color);
    }

    /* Empty State */
    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 48px 24px;
      text-align: center;
      color: var(--secondary-text-color);
    }

    .empty-state ha-icon {
      --mdc-icon-size: 64px;
      margin-bottom: 16px;
      opacity: 0.5;
    }

    .empty-state p {
      margin: 0;
      font-size: 1.1em;
    }

    /* Success Message */
    .success-message {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 12px 16px;
      background: rgba(76, 175, 80, 0.1);
      border: 1px solid var(--success-color, #4caf50);
      border-radius: 8px;
      color: var(--success-color, #4caf50);
      margin-bottom: 16px;
      font-weight: 500;
    }

    .success-message ha-icon {
      --mdc-icon-size: 24px;
    }

    /* Search container */
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

    /* Category filter chips (matching theme browser style) */
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

    .copy-button {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 12px;
    }

    .success-message {
      padding: 12px;
      background: var(--success-color, #4caf50);
      color: white;
      border-radius: 4px;
      margin-bottom: 16px;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .error-message {
      padding: 12px;
      background: var(--error-color, #f44336);
      color: white;
      border-radius: 4px;
      margin-bottom: 16px;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .spinner {
      border: 3px solid rgba(255,255,255,0.3);
      border-top-color: white;
      border-radius: 50%;
      width: 16px;
      height: 16px;
      animation: spin 0.8s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  `;

  connectedCallback() {
    super.connectedCallback();

    // Check if LCARdS core is loaded
    if (!window.lcards?.core?.helperManager) {
      lcardsLog.warn('[ConfigPanel] LCARdS core not yet loaded');
      setTimeout(() => {
        if (!window.lcards?.core?.helperManager) {
          this._showWarning('LCARdS core not detected. Please ensure at least one LCARdS card is added to a dashboard.');
        }
      }, 2000); // Give core time to initialize
    }

    this._loadHelperStatus();
    this._subscribeToHelperChanges();
    lcardsLog.debug('[ConfigPanel] Panel connected');
  }

  disconnectedCallback() {
    super.disconnectedCallback();

    // Cleanup all helper subscriptions
    this._helperSubscriptions.forEach(unsubscribe => unsubscribe());
    this._helperSubscriptions = [];
    lcardsLog.debug('[ConfigPanel] Panel disconnected, cleaned up subscriptions');
  }

  /**
   * Subscribe to all helper state changes to update UI
   */
  _subscribeToHelperChanges() {
    if (!window.lcards?.core?.helperManager) {
      return;
    }

    const helperManager = window.lcards.core.helperManager;

    // Subscribe to each helper's state changes
    this._helpers.forEach(helper => {
      const unsubscribe = helperManager.subscribeToHelper(helper.key, (newValue) => {
        // Update the helper's current value in our list
        const helperIndex = this._helpers.findIndex(h => h.key === helper.key);
        if (helperIndex >= 0) {
          this._helpers[helperIndex] = {
            ...this._helpers[helperIndex],
            currentValue: newValue
          };
          // Trigger re-render to update UI controls
          this.requestUpdate();
        }
      });

      this._helperSubscriptions.push(unsubscribe);
    });

    lcardsLog.debug(`[ConfigPanel] Subscribed to ${this._helperSubscriptions.length} helper state changes`);
  }

  async _loadHelperStatus() {
    if (!this.hass || !window.lcards?.core?.helperManager) {
      lcardsLog.warn('[ConfigPanel] HASS or HelperManager not available');
      return;
    }

    const helperManager = window.lcards.core.helperManager;

    // Get all helpers and their status
    this._helpers = helperManager.getAllHelpers().map(helper => ({
      ...helper,
      exists: helperManager.helperExists(helper.key),
      currentValue: helperManager.getHelperValue(helper.key)
    }));

    this._missingHelpers = helperManager.getMissingHelpers();

    lcardsLog.debug('[ConfigPanel] Loaded helper status:', {
      total: this._helpers.length,
      missing: this._missingHelpers.length
    });

    // Resubscribe to helper changes (in case helpers were created/changed)
    this._helperSubscriptions.forEach(unsubscribe => unsubscribe());
    this._helperSubscriptions = [];
    this._subscribeToHelperChanges();
  }

  async _createAllHelpers() {
    if (!window.lcards?.core?.helperManager) {
      this._showError('Helper Manager not available');
      return;
    }

    this._createInProgress = true;
    const helperManager = window.lcards.core.helperManager;

    try {
      const results = await helperManager.ensureAllHelpers();

      if (results.created > 0) {
        this._showSuccess(`Created ${results.created} helper(s)`);
      }

      if (results.failed > 0) {
        this._showError(`Failed to create ${results.failed} helper(s)`);
      }

      // Reload status
      await this._loadHelperStatus();
    } catch (error) {
      lcardsLog.error('[ConfigPanel] Failed to create helpers:', error);
      this._showError(`Error: ${error.message}`);
    } finally {
      this._createInProgress = false;
    }
  }

  async _createHelper(key) {
    if (!window.lcards?.core?.helperManager) {
      return;
    }

    const helperManager = window.lcards.core.helperManager;

    try {
      await helperManager.ensureHelper(key);
      this._showSuccess(`Created helper: ${key}`);

      // Wait a moment for HA to register the entity, then reload
      await new Promise(resolve => setTimeout(resolve, 500));
      await this._loadHelperStatus();
      this.requestUpdate();
    } catch (error) {
      lcardsLog.error(`[ConfigPanel] Failed to create helper ${key}:`, error);
      this._showError(`Failed to create ${key}: ${error.message}`);
    }
  }

  async _resetCategoryToDefaults(category) {
    if (!window.lcards?.core?.helperManager) {
      this._showError('Helper Manager not available');
      return;
    }

    const helperManager = window.lcards.core.helperManager;

    try {
      const results = await helperManager.resetCategoryToDefaults(category);

      if (results.success > 0) {
        this._showSuccess(`Reset ${results.success} helper(s) to defaults`);
      } else if (results.skipped > 0 && results.failed === 0) {
        this._showSuccess('All helpers already at defaults (or none exist yet)');
      }

      if (results.failed > 0) {
        this._showError(`Failed to reset ${results.failed} helper(s)`);
      }

      // Reload helper status to reflect new values
      await this._loadHelperStatus();
      this.requestUpdate();
    } catch (error) {
      lcardsLog.error('[ConfigPanel] Failed to reset category to defaults:', error);
      this._showError(`Error: ${error.message}`);
    }
  }

  async _setHelperValue(key, value) {
    if (!window.lcards?.core?.helperManager) {
      return;
    }

    const helperManager = window.lcards.core.helperManager;
    const helper = this._helpers.find(h => h.key === key);

    try {
      // Special handling for input_boolean - use turn_on/turn_off services
      if (helper?.domain === 'input_boolean') {
        // Value comes as boolean from selector, convert to service name
        const service = value ? 'turn_on' : 'turn_off';
        lcardsLog.debug(`[ConfigPanel] Calling input_boolean.${service} for ${helper.entity_id} (value: ${value})`);

        await this.hass.callService('input_boolean', service, {
          entity_id: helper.entity_id
        });

        // Reload helper status to reflect the change
        setTimeout(() => this._loadHelperStatus(), 300);
      } else {
        // Use helper manager for other types (input_number, input_select)
        await helperManager.setHelperValue(key, value);
        lcardsLog.debug(`[ConfigPanel] Set helper value: ${key} = ${value}`);
      }
    } catch (error) {
      lcardsLog.error(`[ConfigPanel] Failed to set helper value:`, error);
      this._showError(`Failed to set value: ${error.message}`);
    }
  }

  _copyYAMLToClipboard() {
    const yaml = this._generateYAML();

    if (navigator.clipboard) {
      navigator.clipboard.writeText(yaml).then(() => {
        this._showSuccess('YAML copied to clipboard');
      }).catch(err => {
        this._showError('Failed to copy YAML');
      });
    } else {
      // Fallback for older browsers
      const textarea = document.createElement('textarea');
      textarea.value = yaml;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      this._showSuccess('YAML copied to clipboard');
    }
  }

  _generateYAML() {
    if (!window.lcards?.core?.helperManager) {
      return '# Helper Manager not available';
    }

    return window.lcards.core.helperManager.generateYAML();
  }

  _showSuccess(message) {
    lcardsLog.info(`[ConfigPanel] Success: ${message}`);

    // Use HA's built-in notification system
    this.dispatchEvent(new CustomEvent('hass-notification', {
      detail: { message },
      bubbles: true,
      composed: true
    }));
  }

  _showError(message) {
    lcardsLog.error(`[ConfigPanel] Error: ${message}`);

    // Use HA's built-in notification system
    this.dispatchEvent(new CustomEvent('hass-notification', {
      detail: { message: `Error: ${message}` },
      bubbles: true,
      composed: true
    }));
  }

  _showWarning(message) {
    lcardsLog.warn(`[ConfigPanel] Warning: ${message}`);

    // Use HA's built-in notification system
    this.dispatchEvent(new CustomEvent('hass-notification', {
      detail: { message: `Warning: ${message}` },
      bubbles: true,
      composed: true
    }));
  }

  _showMoreInfo(entityId) {
    // Fire the Home Assistant more-info event to open entity details dialog
    this.dispatchEvent(new CustomEvent('hass-more-info', {
      detail: { entityId },
      bubbles: true,
      composed: true
    }));
  }

  render() {
    return html`
      <div class="panel-container">
        <div class="header">
          <h1>🖖 LCARdS Configuration</h1>
          <p>Manage persistent configuration via Home Assistant input helpers</p>
        </div>

        <ha-tab-group @wa-tab-show=${this._handleTabChange}>
          <ha-tab-group-tab value="0" ?active=${this._selectedTab === 0}>
            <ha-icon icon="mdi:cog"></ha-icon>
            Helpers
          </ha-tab-group-tab>
          <ha-tab-group-tab value="1" ?active=${this._selectedTab === 1}>
            <ha-icon icon="mdi:palette-swatch"></ha-icon>
            Alert Lab & Theme Browser
          </ha-tab-group-tab>
          <ha-tab-group-tab value="2" ?active=${this._selectedTab === 2}>
            <ha-icon icon="mdi:volume-high"></ha-icon>
            Sounds
          </ha-tab-group-tab>
          <ha-tab-group-tab value="3" ?active=${this._selectedTab === 3}>
            <ha-icon icon="mdi:package-variant"></ha-icon>
            Pack Explorer
          </ha-tab-group-tab>
          <ha-tab-group-tab value="4" ?active=${this._selectedTab === 4}>
            <ha-icon icon="mdi:code-braces"></ha-icon>
            YAML Export
          </ha-tab-group-tab>
        </ha-tab-group>

        <div class="tab-content">
          ${this._renderTabContent()}
        </div>
      </div>
    `;
  }

  _handleTabChange(event) {
    // CRITICAL: Use getAttribute('value') not .value property or event.detail (matches base editor pattern)
    const value = event.target.activeTab?.getAttribute('value');
    if (value !== null && value !== undefined) {
      this._selectedTab = parseInt(value, 10);
      this.requestUpdate();
    }
  }

  _renderTabContent() {
    switch (this._selectedTab) {
      case 0:
        return this._renderHelpersTab();
      case 1:
        return this._renderThemeBrowserTab();
      case 2:
        return this._renderSoundTab();
      case 3:
        return this._renderPackExplorerTab();
      case 4:
        return this._renderYAMLTab();
      default:
        return html`<div>Unknown tab</div>`;
    }
  }

  _renderHelpersTab() {
    // Apply filters
    let filteredHelpers = this._helpers;

    // Filter by search text
    if (this._filterText) {
      const search = this._filterText.toLowerCase();
      filteredHelpers = filteredHelpers.filter(helper =>
        helper.name.toLowerCase().includes(search) ||
        helper.description.toLowerCase().includes(search) ||
        helper.key.toLowerCase().includes(search) ||
        helper.entity_id.toLowerCase().includes(search)
      );
    }

    // Filter by category
    if (this._selectedCategory !== 'all') {
      filteredHelpers = filteredHelpers.filter(helper =>
        (helper.category || 'other') === this._selectedCategory
      );
    }

    // Group helpers by category
    const groupedHelpers = filteredHelpers.reduce((acc, helper) => {
      const category = helper.category || 'other';
      if (!acc[category]) acc[category] = [];
      acc[category].push(helper);
      return acc;
    }, {});

    const categoryLabels = {
      alert_system: 'Alert Lab Configuration',
      ha_lcars_theme: 'HA-LCARS Theme Settings',
      sound: 'Sound System',
      other: 'Other'
    };

    return html`
      <div class="studio-layout">
        <div class="dialog-content">
          <div class="dialog-header">
            ${this._missingHelpers.length > 0 ? html`
              <div class="card" style="margin: 12px;">
                <h2>
                  <ha-icon icon="mdi:alert-circle"></ha-icon>
                  Missing Helpers (${this._missingHelpers.length})
                </h2>
                <p style="color: var(--secondary-text-color); margin-bottom: 12px;">
                  Not all helpers currently exist in Home Assistant. Click below to create them all - or create individually using the buttons in the table.
                </p>
                <ha-button
                  @click=${this._createAllHelpers}
                  ?disabled=${this._createInProgress}
                  raised>
                  ${this._createInProgress ? html`<span class="spinner"></span>` : ''}
                  <ha-icon slot="start" icon="mdi:plus-circle"></ha-icon>
                  Create All Missing Helpers
                </ha-button>
              </div>
            ` : ''}
          </div>

          <div class="dialog-body">
            <div class="search-container">
              <div class="search-wrapper">
                <ha-textfield
                  style="width: 100%;"
                  .value=${this._filterText}
                  @input=${(e) => { this._filterText = e.target.value; this.requestUpdate(); }}
                  placeholder="Search helpers... (Ctrl+F)"
                  .label=${'Search'}>
                  <ha-icon slot="leadingIcon" icon="mdi:magnify"></ha-icon>
                </ha-textfield>
                ${this._filterText ? html`
                  <ha-icon-button
                    class="search-clear"
                    @click=${this._clearSearch}
                    .label=${'Clear search'}
                    .path=${"M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z"}>
                  </ha-icon-button>
                ` : ''}
              </div>
              ${this._filterText ? html`
                <div class="search-result-count">
                  Showing ${filteredHelpers.length} of ${this._helpers.length}
                </div>
              ` : ''}
            </div>

            ${this._renderCategoryFilters()}

        ${Object.entries(groupedHelpers).length > 0 ? Object.entries(groupedHelpers).map(([category, helpers]) => {
          const isExpanded = this._expandedCategories.has(category);
          // Calculate total helpers in this category (from full list, not filtered)
          const allCategoryHelpers = this._helpers.filter(h => (h.category || 'other') === category);
          const configuredCount = allCategoryHelpers.filter(h => h.exists).length;
          const totalCount = allCategoryHelpers.length;

          return html`
            <lcards-collapsible-section
              .title=${categoryLabels[category] || category}
              .count=${configuredCount}
              .totalCount=${totalCount}
              ?expanded=${isExpanded}
              @toggle=${() => this._toggleCategory(category)}>
              <div class="category-actions" style="display: flex; justify-content: flex-end; padding: 4px 0 8px;">
                <ha-button
                  @click=${(e) => { e.stopPropagation(); this._resetCategoryToDefaults(category); }}
                  title="Reset all helpers in this section to their registry default values">
                  <ha-icon slot="start" icon="mdi:restore"></ha-icon>
                  Reset to Defaults
                </ha-button>
              </div>
              <table class="helper-table">
                <thead>
                  <tr>
                    <th style="width: 40px;">Icon</th>
                    <th>Helper Name</th>
                    <th>Entity ID</th>
                    <th style="width: 120px;">Status</th>
                    <th>Value</th>
                    <th style="width: 100px;">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  ${helpers.map(helper => this._renderHelperRow(helper))}
                </tbody>
              </table>
            </lcards-collapsible-section>
          `;
        }) : ''}

        ${filteredHelpers.length === 0 && this._filterText ? html`
          <div class="card" style="margin: 16px;">
            <div class="empty-state">
              <ha-icon icon="mdi:filter-off"></ha-icon>
              <p>No helpers match your filter "${this._filterText}"</p>
              <p style="font-size: 13px; color: var(--secondary-text-color);">
                Try a different search term or category filter.
              </p>
            </div>
          </div>
        ` : ''}

        ${this._helpers.length === 0 && !this._filterText ? html`
          <div class="card" style="margin: 16px;">
            <div class="empty-state">
              <ha-icon icon="mdi:loading" class="rotating"></ha-icon>
              <p>Loading helpers...</p>
            </div>
          </div>
        ` : ''}
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Render category filter chips
   */
  _renderCategoryFilters() {
    // Count helpers by category
    const categoryCounts = this._helpers.reduce((acc, helper) => {
      const category = helper.category || 'other';
      acc[category] = (acc[category] || 0) + 1;
      return acc;
    }, {});

    const totalCount = this._helpers.length;

    const categories = [
      { id: 'all', label: 'All', count: totalCount },
      { id: 'alert_system', label: 'Alert Lab', count: categoryCounts.alert_system || 0 },
      { id: 'ha_lcars_theme', label: 'HA-LCARS Theme', count: categoryCounts.ha_lcars_theme || 0 },
      { id: 'sound', label: 'Sounds', count: categoryCounts.sound || 0 }
    ];

    return html`
      <div class="category-filters">
        ${categories.map(cat => html`
          <button
            class="category-chip ${this._selectedCategory === cat.id ? 'selected' : ''}"
            @click=${() => this._selectCategory(cat.id)}
          >
            ${cat.label} (${cat.count})
          </button>
        `)}
      </div>
    `;
  }

  /**
   * Select a category filter
   */
  _selectCategory(category) {
    this._selectedCategory = category;
    this.requestUpdate();
  }

  /**
   * Toggle category section expanded state
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
   * Clear search filter
   */
  _clearSearch() {
    this._filterText = '';
    this.requestUpdate();
  }

  _renderHelperRow(helper) {
    return html`
      <tr>
        <td>
          <ha-icon icon="${helper.icon || 'mdi:cog'}" style="color: var(--primary-color);"></ha-icon>
        </td>
        <td>
          <div class="helper-name">${helper.name}</div>
          <div class="helper-description">${helper.description}</div>
        </td>
        <td>
          <span class="helper-entity-id">${helper.entity_id}</span>
        </td>
        <td>
          <ha-assist-chip
            .label=${helper.exists ? 'Exists' : 'Missing'}
            .type=${helper.exists ? 'filled' : 'outlined'}
            .filled=${true}
            style="
              --ha-assist-chip-filled-container-color: ${helper.exists ? 'var(--success-color)' : 'var(--error-color)'};
              --md-assist-chip-label-text-color: white;
              --md-sys-color-on-surface: white;
            "
          >
            <ha-icon icon="${helper.exists ? 'mdi:check-circle' : 'mdi:alert-circle'}" slot="icon"></ha-icon>
          </ha-assist-chip>
        </td>
        <td>
          ${helper.exists ? this._renderValueControl(helper) : '-'}
        </td>
        <td>
          ${helper.exists ? html`
            <ha-button
              @click=${() => this._showMoreInfo(helper.entity_id)}
            >
              <ha-icon slot="start" icon="mdi:magnify"></ha-icon>
              Inspect
            </ha-button>
          ` : helper.ws_create_params !== null ? html`
            <ha-button
              @click=${() => this._createHelper(helper.key)}
            >
              <ha-icon slot="start" icon="mdi:plus"></ha-icon>
              Create
            </ha-button>
          ` : html`
            <span style="font-size: 12px; color: var(--secondary-text-color); font-style: italic;">Manual setup required</span>
          `}
        </td>
      </tr>
    `;
  }

  _renderValueControl(helper) {
    if (helper.domain === 'input_select') {
      // Get fresh value from HASS state to ensure dropdown shows current selection
      const currentValue = this.hass?.states?.[helper.entity_id]?.state || helper.currentValue;

      return html`
        <ha-selector
          .hass=${this.hass}
          .selector=${{ select: {
            options: helper.ws_create_params.options.map(o => ({ value: o, label: o })),
            mode: 'dropdown'
          }}}
          .value=${currentValue}
          @value-changed=${(e) => this._setHelperValue(helper.key, e.detail.value)}
        ></ha-selector>
      `;
    } else if (helper.domain === 'input_number') {
      return html`
        <ha-selector
          .hass=${this.hass}
          .selector=${{ number: {
            min: helper.ws_create_params.min,
            max: helper.ws_create_params.max,
            step: helper.ws_create_params.step,
            mode: 'box',
            unit_of_measurement: helper.ws_create_params.unit_of_measurement
          }}}
          .value=${helper.currentValue}
          @value-changed=${(e) => this._setHelperValue(helper.key, e.detail.value)}
        ></ha-selector>
      `;
    } else if (helper.domain === 'input_boolean') {
      // Read fresh value from HASS state (same pattern as input_select above) to avoid
      // showing stale cache values; fall back to helper.currentValue if state not yet loaded.
      const boolState = this.hass?.states?.[helper.entity_id]?.state ?? helper.currentValue;
      return html`
        <ha-selector
          .hass=${this.hass}
          .selector=${{ boolean: {} }}
          .value=${boolState === 'on'}
          @value-changed=${(e) => {
            e.stopPropagation();
            const newValue = e.detail.value;
            lcardsLog.debug(`[ConfigPanel] Boolean selector changed:`, { key: helper.key, newValue, detail: e.detail });
            this._setHelperValue(helper.key, newValue);
          }}
        ></ha-selector>
      `;
    }

    return helper.currentValue;
  }

  _renderSoundTab() {
    return html`
      <lcards-sound-config-tab
        .hass=${this.hass}
      ></lcards-sound-config-tab>
    `;
  }

  _renderThemeBrowserTab() {
    // Create an instance with dialogOpen forced to true and render inline
    return html`
      <lcards-theme-token-browser-tab
        .hass=${this.hass}
        ._dialogOpen=${true}
        ._inlineMode=${true}
      ></lcards-theme-token-browser-tab>
    `;
  }

  _renderPackExplorerTab() {
    // Embed Pack Explorer with inline mode
    return html`
      <lcards-pack-explorer-tab
        .hass=${this.hass}
        ._inlineMode=${true}
      ></lcards-pack-explorer-tab>
    `;
  }

  _renderYAMLTab() {
    const yaml = this._generateYAML();

    return html`
      <div class="card">
          <h2>
            <ha-icon icon="mdi:code-braces"></ha-icon>
            YAML Configuration
          </h2>
          <p>Copy this YAML to your Home Assistant <code>configuration.yaml</code> to manually create helpers:</p>

          <ha-button raised @click=${this._copyYAMLToClipboard}>
            <ha-icon icon="mdi:content-copy"></ha-icon>
            Copy to Clipboard
          </ha-button>

          <div class="yaml-output">${yaml}</div>
        </div>
    `;
  }
}

customElements.define('lcards-config-panel', LCARdSConfigPanel);
