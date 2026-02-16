/**
 * @fileoverview LCARdS Configuration Panel - Central UI for helper management
 *
 * Tabbed interface for managing LCARdS persistent configuration:
 * - Helpers tab: View status, create, and edit helper values
 * - Alert Lab tab: HSL color pickers for alert mode customization
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

export class LCARdSConfigPanel extends LitElement {
  static properties = {
    hass: { type: Object },
    narrow: { type: Boolean },
    panel: { type: Object },
    _selectedTab: { type: Number, state: true },
    _helpers: { type: Array, state: true },
    _missingHelpers: { type: Array, state: true },
    _alertLabParams: { type: Object, state: true },
    _createInProgress: { type: Boolean, state: true },
    _filterText: { type: String, state: true },
    _initialLoadDone: { type: Boolean, state: true }
  };

  constructor() {
    super();
    this._selectedTab = 0;
    this._helpers = [];
    this._missingHelpers = [];
    this._alertLabParams = {
      red_alert: { hue: 0, saturation: 140, lightness: 90 },
      yellow_alert: { hue: 45, saturation: 150, lightness: 105 },
      blue_alert: { hue: 210, saturation: 150, lightness: 100 },
      white_alert: { hue: 0, saturation: 10, lightness: 120 }
    };
    this._createInProgress = false;
    this._filterText = '';
    this._initialLoadDone = false;
  }

  /**
   * Called when properties change
   * Propagate hass to helper manager when it becomes available
   */
  willUpdate(changedProps) {
    super.willUpdate(changedProps);

    if (changedProps.has('hass') && this.hass) {
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
      overflow-y: auto;
      overflow-x: hidden;
      padding: 16px;
      min-height: 0;
      background: var(--card-background-color);
    }

    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }

    .card {
      background: var(--card-background-color);
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
    }

    .helper-table th {
      text-align: left;
      padding: 8px;
      border-bottom: 2px solid var(--divider-color);
      color: var(--secondary-text-color);
      font-weight: 600;
    }

    .helper-table td {
      padding: 12px 8px;
      border-bottom: 1px solid var(--divider-color);
    }

    .helper-table tr:hover {
      background: var(--secondary-background-color);
    }

    .helper-status {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .status-icon {
      width: 20px;
      height: 20px;
      border-radius: 50%;
    }

    .status-exists {
      background: var(--success-color, #4caf50);
    }

    .status-missing {
      background: var(--error-color, #f44336);
    }

    .helper-icon {
      color: var(--primary-color);
      font-size: 24px;
    }

    .helper-name {
      font-weight: 500;
      color: var(--primary-text-color);
      margin-bottom: 4px;
    }

    .helper-description {
      font-size: 0.9em;
      color: var(--secondary-text-color);
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

    .alert-mode-section {
      margin-bottom: 24px;
    }

    .alert-mode-title {
      font-size: 1.1em;
      font-weight: 600;
      margin-bottom: 12px;
      color: var(--primary-text-color);
    }

    .hsl-controls {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 16px;
    }

    .slider-control {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .slider-label {
      display: flex;
      justify-content: space-between;
      color: var(--primary-text-color);
      font-weight: 500;
    }

    .slider-value {
      color: var(--primary-color);
    }

    input[type="range"] {
      width: 100%;
      height: 6px;
      border-radius: 3px;
      background: var(--divider-color);
      outline: none;
      -webkit-appearance: none;
    }

    input[type="range"]::-webkit-slider-thumb {
      -webkit-appearance: none;
      appearance: none;
      width: 20px;
      height: 20px;
      border-radius: 50%;
      background: var(--primary-color);
      cursor: pointer;
    }

    input[type="range"]::-moz-range-thumb {
      width: 20px;
      height: 20px;
      border-radius: 50%;
      background: var(--primary-color);
      cursor: pointer;
      border: none;
    }

    .color-preview {
      width: 100%;
      height: 60px;
      border-radius: 4px;
      margin-top: 12px;
      border: 2px solid var(--divider-color);
    }

    .alert-actions {
      display: flex;
      gap: 12px;
      margin-top: 16px;
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

    /* Embedded Theme Browser styling */
    .embedded-theme-browser {
      display: flex;
      flex-direction: column;
      height: 100%;
      min-height: 0;
      background: var(--primary-background-color);
      border-radius: var(--ha-card-border-radius, 12px);
    }

    .embedded-theme-browser lcards-theme-token-browser-tab {
      flex: 1;
      display: flex;
      flex-direction: column;
      min-height: 0;
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

    /* Filter Section */
    .filter-section {
      display: flex;
      gap: 12px;
      align-items: center;
      padding: 12px 16px;
      background: var(--card-background-color);
      border-bottom: 1px solid var(--divider-color);
      flex-shrink: 0;
    }

    .filter-section ha-textfield {
      flex: 1;
      --mdc-text-field-fill-color: var(--secondary-background-color);
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
    lcardsLog.debug('[ConfigPanel] Panel connected');
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

    // Load Alert Lab parameters from helpers
    this._loadAlertLabFromHelpers();

    lcardsLog.debug('[ConfigPanel] Loaded helper status:', {
      total: this._helpers.length,
      missing: this._missingHelpers.length
    });
  }

  _loadAlertLabFromHelpers() {
    const helperManager = window.lcards.core.helperManager;

    ['red_alert', 'yellow_alert', 'blue_alert', 'white_alert'].forEach(mode => {
      const modeKey = mode.replace('_alert', '');
      this._alertLabParams[mode] = {
        hue: parseFloat(helperManager.getHelperValue(`alert_lab_${modeKey}_hue`) || this._alertLabParams[mode].hue),
        saturation: parseFloat(helperManager.getHelperValue(`alert_lab_${modeKey}_saturation`) || this._alertLabParams[mode].saturation),
        lightness: parseFloat(helperManager.getHelperValue(`alert_lab_${modeKey}_lightness`) || this._alertLabParams[mode].lightness)
      };
    });
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

  async _setHelperValue(key, value) {
    if (!window.lcards?.core?.helperManager) {
      return;
    }

    const helperManager = window.lcards.core.helperManager;

    try {
      await helperManager.setHelperValue(key, value);
      lcardsLog.debug(`[ConfigPanel] Set helper value: ${key} = ${value}`);
    } catch (error) {
      lcardsLog.error(`[ConfigPanel] Failed to set helper value:`, error);
      this._showError(`Failed to set value: ${error.message}`);
    }
  }

  async _saveAlertLabToHelpers(mode) {
    const params = this._alertLabParams[mode];
    const modeKey = mode.replace('_alert', '');

    try {
      await this._setHelperValue(`alert_lab_${modeKey}_hue`, params.hue);
      await this._setHelperValue(`alert_lab_${modeKey}_saturation`, params.saturation);
      await this._setHelperValue(`alert_lab_${modeKey}_lightness`, params.lightness);

      this._showSuccess(`Saved ${mode} parameters to helpers`);
    } catch (error) {
      this._showError(`Failed to save ${mode}: ${error.message}`);
    }
  }

  async _applyAlertMode(mode) {
    if (!window.lcards?.core?.themeManager) {
      this._showError('Theme Manager not available');
      return;
    }

    try {
      await window.lcards.core.themeManager.setAlertMode(mode);
      this._showSuccess(`Applied ${mode} alert mode`);
    } catch (error) {
      this._showError(`Failed to apply alert mode: ${error.message}`);
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

  _getColorFromHSL(h, s, l) {
    // Convert HSL to CSS string
    return `hsl(${h}, ${s}%, ${l}%)`;
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
            <ha-icon icon="mdi:palette"></ha-icon>
            Alert Lab
          </ha-tab-group-tab>
          <ha-tab-group-tab value="2" ?active=${this._selectedTab === 2}>
            <ha-icon icon="mdi:palette-swatch"></ha-icon>
            Theme Browser
          </ha-tab-group-tab>
          <ha-tab-group-tab value="3" ?active=${this._selectedTab === 3}>
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
        return this._renderAlertLabTab();
      case 2:
        return this._renderThemeBrowserTab();
      case 3:
        return this._renderYAMLTab();
      default:
        return html`<div>Unknown tab</div>`;
    }
  }

  _renderHelpersTab() {
    const filteredHelpers = this._helpers.filter(helper => {
      if (!this._filterText) return true;
      const search = this._filterText.toLowerCase();
      return helper.name.toLowerCase().includes(search) ||
             helper.description.toLowerCase().includes(search) ||
             helper.key.toLowerCase().includes(search);
    });

    // Group helpers by category
    const groupedHelpers = filteredHelpers.reduce((acc, helper) => {
      const category = helper.category || 'other';
      if (!acc[category]) acc[category] = [];
      acc[category].push(helper);
      return acc;
    }, {});

    const categoryLabels = {
      alert_system: 'Alert Lab Configuration',
      other: 'Other'
    };

    return html`
      <div class="filter-section">
        <ha-textfield
          .value=${this._filterText}
          @input=${(e) => { this._filterText = e.target.value; this.requestUpdate(); }}
          placeholder="Filter helpers..."
          .label=${'Search'}
        >
          <ha-icon slot="leadingIcon" icon="mdi:magnify"></ha-icon>
        </ha-textfield>
        ${this._filterText ? html`
          <ha-button @click=${() => { this._filterText = ''; this.requestUpdate(); }}>
            <ha-icon icon="mdi:close"></ha-icon>
            Clear
          </ha-button>
        ` : ''}
      </div>

      <div class="tab-content">
        ${this._missingHelpers.length > 0 ? html`
          <div class="card">
            <h2>
              <ha-icon icon="mdi:alert-circle"></ha-icon>
              Missing Helpers2
            </h2>
            <ha-button
              @click=${this._createAllHelpers}
              ?disabled=${this._createInProgress}
              raised
            >
              ${this._createInProgress ? html`<span class="spinner"></span>` : ''}
              <ha-icon icon="mdi:plus-circle"></ha-icon>
              Create All Missing Helpers (${this._missingHelpers.length})
            </ha-button>
          </div>
        ` : ''}

        ${Object.entries(groupedHelpers).map(([category, helpers]) => html`
          <div class="card">
            <h2>
              <ha-icon icon="${category === 'alert_system' ? 'mdi:palette' : 'mdi:cog-outline'}"></ha-icon>
              ${categoryLabels[category] || category}
            </h2>

            <table class="helper-table">
              <thead>
                <tr>
                  <th>Icon</th>
                  <th>Helper</th>
                  <th>Status</th>
                  <th>Value</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                ${helpers.map(helper => this._renderHelperRow(helper))}
              </tbody>
            </table>
          </div>
        `)}

        ${filteredHelpers.length === 0 && this._filterText ? html`
          <div class="card">
            <div class="empty-state">
              <ha-icon icon="mdi:filter-off"></ha-icon>
              <p>No helpers match your filter</p>
            </div>
          </div>
        ` : ''}

        ${this._helpers.length === 0 && !this._filterText ? html`
          <div class="card">
            <div class="empty-state">
              <ha-icon icon="mdi:loading" class="rotating"></ha-icon>
              <p>Loading helpers...</p>
            </div>
          </div>
        ` : ''}
      </div>
    `;
  }

  _renderHelperRow(helper) {
    return html`
      <tr>
        <td>
          <ha-icon class="helper-icon" icon="${helper.icon || 'mdi:cog'}"></ha-icon>
        </td>
        <td>
          <div class="helper-name">${helper.name}</div>
          <div class="helper-description">${helper.description}</div>
        </td>
        <td>
          <ha-assist-chip
            .label=${helper.exists ? 'Exists' : 'Missing'}
            style="
              --ha-assist-chip-filled-container-color: ${helper.exists ? 'var(--success-color)' : 'var(--warning-color)'};
              --md-sys-color-primary: white;
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
          ${!helper.exists ? html`
            <ha-button
              @click=${() => this._createHelper(helper.key)}
            >
              <ha-icon icon="mdi:plus"></ha-icon>
              Create
            </ha-button>
          ` : ''}
        </td>
      </tr>
    `;
  }

  _renderValueControl(helper) {
    if (helper.domain === 'input_select') {
      return html`
        <ha-selector
          .hass=${this.hass}
          .selector=${{ select: {
            options: helper.ws_create_params.options.map(o => ({ value: o, label: o })),
            mode: 'dropdown'
          }}}
          .value=${helper.currentValue}
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
      return html`
        <ha-selector
          .hass=${this.hass}
          .selector=${{ boolean: {} }}
          .value=${helper.currentValue === 'on'}
          @value-changed=${(e) => this._setHelperValue(helper.key, e.detail.value ? 'on' : 'off')}
        ></ha-selector>
      `;
    }

    return helper.currentValue;
  }

  _renderAlertLabTab() {
    return html`
      ${['red_alert', 'yellow_alert', 'blue_alert', 'white_alert'].map(mode => html`
        <div class="card alert-mode-section">
          <h2 class="alert-mode-title">${mode.replace('_', ' ').toUpperCase()}</h2>

          <div class="hsl-controls">
            <div class="slider-control">
              <div class="slider-label">
                <span>Hue</span>
                <span class="slider-value">${this._alertLabParams[mode].hue}°</span>
              </div>
              <ha-selector
                .hass=${this.hass}
                .selector=${{ number: { min: 0, max: 360, step: 1, mode: 'slider' } }}
                .value=${this._alertLabParams[mode].hue}
                @value-changed=${(e) => {
                  this._alertLabParams[mode].hue = e.detail.value;
                  this.requestUpdate();
                }}
              ></ha-selector>
            </div>

            <div class="slider-control">
              <div class="slider-label">
                <span>Saturation</span>
                <span class="slider-value">${this._alertLabParams[mode].saturation}%</span>
              </div>
              <ha-selector
                .hass=${this.hass}
                .selector=${{ number: { min: 0, max: 200, step: 1, mode: 'slider' } }}
                .value=${this._alertLabParams[mode].saturation}
                @value-changed=${(e) => {
                  this._alertLabParams[mode].saturation = e.detail.value;
                  this.requestUpdate();
                }}
              ></ha-selector>
            </div>

            <div class="slider-control">
              <div class="slider-label">
                <span>Lightness</span>
                <span class="slider-value">${this._alertLabParams[mode].lightness}%</span>
              </div>
              <ha-selector
                .hass=${this.hass}
                .selector=${{ number: { min: 0, max: 200, step: 1, mode: 'slider' } }}
                .value=${this._alertLabParams[mode].lightness}
                @value-changed=${(e) => {
                  this._alertLabParams[mode].lightness = e.detail.value;
                  this.requestUpdate();
                }}
              ></ha-selector>
            </div>
          </div>

          <div
            class="color-preview"
            style="background: ${this._getColorFromHSL(
              this._alertLabParams[mode].hue,
              this._alertLabParams[mode].saturation,
              this._alertLabParams[mode].lightness
            )}"
          ></div>

          <div class="alert-actions">
            <ha-button
              raised
              @click=${() => this._saveAlertLabToHelpers(mode)}
            >
              <ha-icon icon="mdi:content-save"></ha-icon>
              Save to Helpers
            </ha-button>
            <ha-button
              @click=${() => this._applyAlertMode(mode)}
            >
              <ha-icon icon="mdi:palette"></ha-icon>
              Apply Theme
            </ha-button>
          </div>
        </div>
      `)}
    `;
  }

  _renderThemeBrowserTab() {
    // Create an instance with dialogOpen forced to true and render inline
    return html`
      <div class="embedded-theme-browser">
        <lcards-theme-token-browser-tab
          .hass=${this.hass}
          ._dialogOpen=${true}
          ._inlineMode=${true}
        ></lcards-theme-token-browser-tab>
      </div>
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
