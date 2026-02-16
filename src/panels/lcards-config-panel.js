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
 *   - name: lcards-config
 *     sidebar_title: LCARdS Config
 *     sidebar_icon: mdi:cog
 *     url_path: lcards-config
 *     module_url: /hacsfiles/lcards/lcards-config-panel.js
 * ```
 *
 * @element lcards-config-panel
 */

import { LitElement, html, css } from 'lit';
import { lcardsLog } from '../utils/lcards-logging.js';

export class LCARdSConfigPanel extends LitElement {
  static properties = {
    hass: { type: Object },
    narrow: { type: Boolean },
    panel: { type: Object },
    _selectedTab: { type: String, state: true },
    _helpers: { type: Array, state: true },
    _missingHelpers: { type: Array, state: true },
    _alertLabParams: { type: Object, state: true },
    _createInProgress: { type: Boolean, state: true }
  };

  constructor() {
    super();
    this._selectedTab = 'helpers';
    this._helpers = [];
    this._missingHelpers = [];
    this._alertLabParams = {
      red_alert: { hue: 0, saturation: 140, lightness: 90 },
      yellow_alert: { hue: 45, saturation: 150, lightness: 105 },
      blue_alert: { hue: 210, saturation: 150, lightness: 100 },
      white_alert: { hue: 0, saturation: 10, lightness: 120 }
    };
    this._createInProgress = false;
  }

  static styles = css`
    :host {
      display: block;
      padding: 16px;
      background: var(--primary-background-color);
      min-height: 100vh;
    }

    .header {
      margin-bottom: 24px;
    }

    .header h1 {
      font-size: 2em;
      margin: 0 0 8px 0;
      color: var(--primary-text-color);
    }

    .header p {
      margin: 0;
      color: var(--secondary-text-color);
      font-size: 1.1em;
    }

    .tabs {
      display: flex;
      gap: 8px;
      border-bottom: 2px solid var(--divider-color);
      margin-bottom: 24px;
    }

    .tab {
      padding: 12px 24px;
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
      animation: fadeIn 0.3s;
    }

    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }

    .card {
      background: var(--card-background-color);
      border-radius: 8px;
      padding: 16px;
      margin-bottom: 16px;
      box-shadow: var(--ha-card-box-shadow, 0 2px 4px rgba(0,0,0,0.1));
    }

    .card h2 {
      margin: 0 0 16px 0;
      font-size: 1.3em;
      color: var(--primary-text-color);
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
      border-radius: 4px;
      font-family: 'Courier New', monospace;
      font-size: 0.9em;
      white-space: pre;
      overflow-x: auto;
      max-height: 600px;
      overflow-y: auto;
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
      await this._loadHelperStatus();
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
    // TODO: Implement toast notification
    lcardsLog.info(`[ConfigPanel] Success: ${message}`);
    // For now, use alert (will be replaced with proper toast)
    alert(message);
  }

  _showError(message) {
    // TODO: Implement toast notification
    lcardsLog.error(`[ConfigPanel] Error: ${message}`);
    alert(`Error: ${message}`);
  }

  _getColorFromHSL(h, s, l) {
    // Convert HSL to CSS string
    return `hsl(${h}, ${s}%, ${l}%)`;
  }

  render() {
    return html`
      <div class="header">
        <h1>🖖 LCARdS Configuration</h1>
        <p>Manage persistent configuration via Home Assistant input helpers</p>
      </div>

      <div class="tabs">
        <button
          class="tab ${this._selectedTab === 'helpers' ? 'active' : ''}"
          @click=${() => this._selectedTab = 'helpers'}
        >
          Helpers
        </button>
        <button
          class="tab ${this._selectedTab === 'alert-lab' ? 'active' : ''}"
          @click=${() => this._selectedTab = 'alert-lab'}
        >
          Alert Lab
        </button>
        <button
          class="tab ${this._selectedTab === 'yaml' ? 'active' : ''}"
          @click=${() => this._selectedTab = 'yaml'}
        >
          YAML Export
        </button>
      </div>

      <div class="tab-content">
        ${this._selectedTab === 'helpers' ? this._renderHelpersTab() : ''}
        ${this._selectedTab === 'alert-lab' ? this._renderAlertLabTab() : ''}
        ${this._selectedTab === 'yaml' ? this._renderYAMLTab() : ''}
      </div>
    `;
  }

  _renderHelpersTab() {
    return html`
      <div class="card">
        <h2>Helper Status</h2>
        
        ${this._missingHelpers.length > 0 ? html`
          <button
            class="action-button create-all-button"
            @click=${this._createAllHelpers}
            ?disabled=${this._createInProgress}
          >
            ${this._createInProgress ? html`<span class="spinner"></span>` : ''}
            Create All Missing Helpers (${this._missingHelpers.length})
          </button>
        ` : html`
          <div class="success-message">
            ✓ All helpers exist
          </div>
        `}

        <table class="helper-table">
          <thead>
            <tr>
              <th>Icon</th>
              <th>Helper</th>
              <th>Status</th>
              <th>Current Value</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            ${this._helpers.map(helper => this._renderHelperRow(helper))}
          </tbody>
        </table>
      </div>
    `;
  }

  _renderHelperRow(helper) {
    return html`
      <tr>
        <td>
          <span class="helper-icon">${helper.icon || '📝'}</span>
        </td>
        <td>
          <div class="helper-name">${helper.name}</div>
          <div class="helper-description">${helper.description}</div>
        </td>
        <td>
          <div class="helper-status">
            <span class="status-icon ${helper.exists ? 'status-exists' : 'status-missing'}"></span>
            ${helper.exists ? 'Exists' : 'Missing'}
          </div>
        </td>
        <td>
          ${helper.exists ? this._renderValueControl(helper) : '-'}
        </td>
        <td>
          ${!helper.exists ? html`
            <button
              class="action-button"
              @click=${() => this._createHelper(helper.key)}
            >
              Create
            </button>
          ` : ''}
        </td>
      </tr>
    `;
  }

  _renderValueControl(helper) {
    if (helper.domain === 'input_select') {
      return html`
        <select
          @change=${(e) => this._setHelperValue(helper.key, e.target.value)}
        >
          ${helper.ws_create_params.options.map(option => html`
            <option value="${option}" ?selected=${helper.currentValue === option}>
              ${option}
            </option>
          `)}
        </select>
      `;
    } else if (helper.domain === 'input_number') {
      return html`
        <div class="helper-value">
          <input
            type="number"
            .value=${helper.currentValue}
            min="${helper.ws_create_params.min}"
            max="${helper.ws_create_params.max}"
            step="${helper.ws_create_params.step}"
            @change=${(e) => this._setHelperValue(helper.key, parseFloat(e.target.value))}
          />
          ${helper.ws_create_params.unit_of_measurement || ''}
        </div>
      `;
    } else if (helper.domain === 'input_boolean') {
      return html`
        <input
          type="checkbox"
          ?checked=${helper.currentValue === 'on'}
          @change=${(e) => this._setHelperValue(helper.key, e.target.checked ? 'on' : 'off')}
        />
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
              <input
                type="range"
                min="0"
                max="360"
                step="1"
                .value=${this._alertLabParams[mode].hue}
                @input=${(e) => {
                  this._alertLabParams[mode].hue = parseFloat(e.target.value);
                  this.requestUpdate();
                }}
              />
            </div>

            <div class="slider-control">
              <div class="slider-label">
                <span>Saturation</span>
                <span class="slider-value">${this._alertLabParams[mode].saturation}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="200"
                step="1"
                .value=${this._alertLabParams[mode].saturation}
                @input=${(e) => {
                  this._alertLabParams[mode].saturation = parseFloat(e.target.value);
                  this.requestUpdate();
                }}
              />
            </div>

            <div class="slider-control">
              <div class="slider-label">
                <span>Lightness</span>
                <span class="slider-value">${this._alertLabParams[mode].lightness}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="200"
                step="1"
                .value=${this._alertLabParams[mode].lightness}
                @input=${(e) => {
                  this._alertLabParams[mode].lightness = parseFloat(e.target.value);
                  this.requestUpdate();
                }}
              />
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
            <button
              class="action-button"
              @click=${() => this._saveAlertLabToHelpers(mode)}
            >
              Save to Helpers
            </button>
            <button
              class="action-button secondary"
              @click=${() => this._applyAlertMode(mode)}
            >
              Apply Theme
            </button>
          </div>
        </div>
      `)}
    `;
  }

  _renderYAMLTab() {
    const yaml = this._generateYAML();

    return html`
      <div class="card">
        <h2>YAML Configuration</h2>
        <p>Copy this YAML to your Home Assistant <code>configuration.yaml</code> to manually create helpers:</p>
        
        <button class="action-button copy-button" @click=${this._copyYAMLToClipboard}>
          📋 Copy to Clipboard
        </button>

        <div class="yaml-output">${yaml}</div>
      </div>
    `;
  }
}

customElements.define('lcards-config-panel', LCARdSConfigPanel);
