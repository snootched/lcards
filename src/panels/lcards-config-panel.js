/**
 * @fileoverview LCARdS Configuration Panel - Central UI for helper management
 *
 * Tabbed interface for managing LCARdS persistent configuration:
 * - Helpers tab: View status, create, and edit helper values
 * - Theme Browser tab: Theme tokens and alert mode configuration
 *
 * This panel must be registered manually in Home Assistant's configuration.yaml:
 *
 * ```yaml
 * panel_custom:
 *   - name: lcards-config-panel
 *     sidebar_title: LCARdS Config
 *     sidebar_icon: mdi:cog
 *     url_path: lcards-config-panel
 *     module_url: /lcards/lcards.js
 * ```
 *
 * @element lcards-config-panel-impl (wrapped by the lcards-config-panel shell)
 */

import { LitElement, html, css } from 'lit';
import { lcardsLog } from '../utils/lcards-logging.js';
import '../editor/components/theme-browser/lcards-theme-token-browser-tab.js';
import '../editor/components/pack-explorer/lcards-pack-explorer-tab.js';
import '../editor/components/shared/lcards-form-section.js';
import './components/lcards-sound-config-tab.js';
import './components/lcards-storage-explorer-tab.js';
import './components/lcards-about-tab.js';
import './components/lcards-users-devices-tab.js';
import './components/lcards-layouts-tab.js';
import './components/lcards-connectivity-tab.js';
import { surfaceStyles } from '../editor/base/surface-styles.js';
import { renderFilterChips } from '../editor/components/shared/filter-chips.js';
import { docsUrl, PANEL_TAB_DOCS } from '../utils/docs-url.js';

/** Section icons for the Helpers tab's categories. */
const CATEGORY_ICONS = {
  alert_system: 'mdi:alert-octagon-outline',
  ha_lcars_theme: 'mdi:palette-outline',
  sound: 'mdi:volume-high',
};

export class LCARdSConfigPanel extends LitElement {
  /** Tab names for links (?tab=theme); the value is the tab index. */
  static TAB_NAMES = { welcome: 0, helpers: 1, theme: 2, connectivity: 3, sounds: 4, users: 5, packs: 6, storage: 7, layouts: 8 };

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
    this._selectedTab = LCARdSConfigPanel.TAB_NAMES[new URLSearchParams(window.location.search).get('tab') ?? ''] ?? 0;
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
      // Initialize/propagate hass to core (critical for alert mode commands to work).
      // `initialize()` propagates hass synchronously to all services when core is
      // already up, ensuring SSS and integrationService have a real connection
      // before child tabs try to read scoped settings on their first render.
      if (window.lcards?.core) {
        lcardsLog.debug('[ConfigPanel] Propagating hass to Core via initialize()');
        window.lcards.core.initialize(this.hass).catch(err => {
          lcardsLog.warn('[ConfigPanel] Core initialize error:', err);
        });
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

  static styles = [surfaceStyles, css`
    :host {
      display: block;
      height: 100vh;
      background: var(--primary-background-color);
      overflow: hidden;
      /* HA's panel typography (haStyle): without it text inherits the page's
         hardcoded Roboto while HA controls follow the theme font. */
      font-family: var(--ha-font-family-body);
      -webkit-font-smoothing: var(--ha-font-smoothing);
      -moz-osx-font-smoothing: var(--ha-moz-osx-font-smoothing);
      font-size: var(--ha-font-size-m);
      font-weight: var(--ha-font-weight-normal);
      line-height: var(--ha-line-height-normal);
    }

    .panel-container {
      display: flex;
      flex-direction: column;
      height: 100%;
      margin: 0 auto;
      background-color: var(--lcars-ui-primary, var(--card-background-color, #1b4f8a));
    }

    .header {
      display: flex;
      align-items: center;
      gap: 0;
      background: var(--lcars-ui-primary, #1b4f8a);
      overflow: hidden;
      min-height: 68px;
      flex-shrink: 0;
    }

    .banner-logo {
      height: 52px;
      width: auto;
      margin: 0 16px 0 12px;
      flex-shrink: 0;
      object-fit: contain;
    }

    .banner-content {
      flex: 1;
      padding: 14px 20px;
    }

    .banner-title {
      font-size: 2em;
      font-weight: 700;
      letter-spacing: 0.12em;
      color: var(--lcards-moonlight);
      line-height: 1;
      text-transform: uppercase;
      font-family: var(--lcars-font), var(--lcars-fallback-font), 'Antonio', sans-serif;
    }

    .banner-subtitle {
      font-size: 0.82em;
      color: var(--secondary-text-color);
      margin-top: 3px;
      letter-spacing: 0.04em;
    }

    .banner-version {
      padding: 0 20px;
      font-size: 0.95em;
      font-weight: 600;
      color: var(--secondary-text-color);
      letter-spacing: 0.1em;
      white-space: nowrap;
      font-family: var(--lcars-font), var(--lcars-fallback-font), 'Antonio', sans-serif;
    }

    /* HA Native Tab Styling */
    ha-tab-group {
      display: block;
      margin: 0;
      border-bottom: 2px solid var(--divider-color);
      background: var(--card-background-color);
      flex-shrink: 0;
      border-top-left-radius: 17px;
    }

    /* "Docs" link at the top of each tab: opens the page in a new tab */
    .tab-docs {
        display: flex;
        justify-content: flex-end;
        margin: var(--ha-space-3) 0 var(--ha-space-3);
    }
    .tab-docs a {
        display: inline-flex;
        align-items: center;
        gap: var(--ha-space-1);
        padding: var(--ha-space-1) var(--ha-space-3);
        background: color-mix(in srgb, var(--primary-text-color) 10%, transparent);
        border-radius: var(--ha-border-radius-pill);
        color: var(--primary-text-color);
        font-size: var(--ha-font-size-m, 14px);
        font-weight: var(--ha-font-weight-medium, 500);
        line-height: 1.4;
        text-decoration: none;
    }
    .tab-docs a:hover {
        background: color-mix(in srgb, var(--primary-text-color) 20%, transparent);
    }
    .tab-docs ha-icon {
        --mdc-icon-size: 18px;
    }
    ha-tab-group-tab ha-icon {
      --mdc-icon-size: 18px;
      margin-right: 8px;
    }

    .tab-content {
      flex: 1;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      padding: var(--ha-space-2);
      min-height: 0;
      background: var(--secondary-background-color);
    }

    .helper-table {
      width: 100%;
      border-collapse: collapse;
    }

    .helper-table th,
    .helper-table td {
      padding: var(--ha-space-2);
      text-align: left;
      border-bottom: var(--ha-border-width-sm) solid var(--divider-color);
      color: var(--primary-text-color);
    }

    .helper-table th {
      font-weight: var(--ha-font-weight-bold, 600);
    }

    .helper-table tr:hover td {
      background: color-mix(in srgb, var(--secondary-background-color) 50%, transparent);
    }

    .col-icon { width: 40px; }
    .col-status { width: 120px; }
    .col-actions { width: 100px; }

    .helper-icon {
      color: var(--primary-color);
    }

    .helper-name {
      font-weight: var(--ha-font-weight-medium, 500);
    }

    .helper-entity-id {
      font-family: var(--ha-font-family-code);
      font-size: 0.9em;
      color: var(--secondary-text-color);
    }

    .helper-description {
      color: var(--secondary-text-color);
      font-size: 0.9em;
      margin-top: var(--ha-space-1);
    }

    .manual-setup {
      font-size: var(--ha-font-size-s);
      color: var(--secondary-text-color);
      font-style: italic;
    }

    .helper-value {
      display: flex;
      align-items: center;
      gap: var(--ha-space-2);
    }

    /* Helpers tab: missing-helpers banner, search, category chips */
    .studio-layout > .banner {
      margin-bottom: var(--ha-space-3);
    }

    .banner-text {
      flex: 1;
    }

    .search-container {
      display: flex;
      align-items: center;
      gap: var(--ha-space-3);
      margin-bottom: var(--ha-space-3);
    }

    .search-container ha-input-search {
      flex: 1;
    }

    .category-filters {
      margin-bottom: var(--ha-space-3);
    }

    .category-actions {
      display: flex;
      justify-content: flex-end;
      padding-bottom: var(--ha-space-2);
    }

    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: var(--ha-space-2);
      padding: var(--ha-space-12) var(--ha-space-6);
      text-align: center;
      color: var(--secondary-text-color);
    }

    .empty-state ha-icon {
      --mdc-icon-size: 48px;
      opacity: 0.5;
    }

    .empty-state p {
      margin: 0;
    }
  `];

  connectedCallback() {
    super.connectedCallback();

    // Re-render when the browser tab regains focus after being backgrounded.
    // Without this, a WebSocket reconnect that happens while the tab is hidden
    // (browser throttles keep-alives) leaves the panel black because no
    // reactive property changes after the reconnect completes.
    this._visibilityHandler = () => {
      if (document.visibilityState === 'visible') {
        this.requestUpdate();
      }
    };
    document.addEventListener('visibilitychange', this._visibilityHandler);

    // Check if LCARdS core is loaded
    if (!window.lcards?.core?.helperManager) {
      lcardsLog.warn('[ConfigPanel] LCARdS core not yet loaded');
      setTimeout(() => {
        if (!window.lcards?.core?.helperManager) {
          this._showWarning('LCARdS core did not initialize. Hard-refresh the browser (Ctrl+Shift+R). If this persists, check Settings → Integrations → LCARdS.');
        }
      }, 2000); // Give core time to initialize
    }

    this._loadHelperStatus();
    this._subscribeToHelperChanges();

    // Refresh integration options on every panel connect so that settings
    // changed since boot (e.g. toggling Enable Preview Features) are reflected
    // immediately without a full page reload. On a fresh load the initial
    // lcards/info probe is still running and fetches the options itself, so
    // just wait for it instead of re-fetching without a connection.
    const integration = window.lcards?.core?.integrationService;
    if (integration) {
      (integration.isReady ? integration.refreshOptions() : integration.onReady())
        .then(() => this.requestUpdate());
    }

    lcardsLog.debug('[ConfigPanel] Panel connected');
  }

  disconnectedCallback() {
    super.disconnectedCallback();

    // Remove visibility handler
    if (this._visibilityHandler) {
      document.removeEventListener('visibilitychange', this._visibilityHandler);
      this._visibilityHandler = null;
    }

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

  _getVersion() {
    return window.lcards?.version ?? '';
  }

  render() {
    const version = this._getVersion();
    return html`
      <div class="panel-container">
        <div class="header">
          <img
            class="banner-logo"
            src="/lcards/brand/icon@2x.png"
            alt="LCARdS"
            @error=${(e) => { e.target.style.display = 'none'; }}
          />
          <div class="banner-content">
            <div class="banner-title">LCARdS</div>
            <div class="banner-subtitle">LCARS Card System for Home Assistant</div>
          </div>
          <div class="banner-version">${version ? html`v${version}` : ''}</div>
        </div>

        <ha-tab-group @wa-tab-show=${this._handleTabChange}>
          <ha-tab-group-tab value="0" ?active=${this._selectedTab === 0}>
            <ha-icon icon="mdi:information-outline"></ha-icon>
            Welcome
          </ha-tab-group-tab>
          <ha-tab-group-tab value="1" ?active=${this._selectedTab === 1}>
            <ha-icon icon="mdi:cog"></ha-icon>
            Helpers
          </ha-tab-group-tab>
          <ha-tab-group-tab value="2" ?active=${this._selectedTab === 2}>
            <ha-icon icon="mdi:palette-swatch"></ha-icon>
            Theme Studio
          </ha-tab-group-tab>
          <ha-tab-group-tab value="3" ?active=${this._selectedTab === 3}>
            <ha-icon icon="mdi:wifi-off"></ha-icon>
            Connectivity
          </ha-tab-group-tab>
          <ha-tab-group-tab value="4" ?active=${this._selectedTab === 4}>
            <ha-icon icon="mdi:volume-high"></ha-icon>
            Sounds
          </ha-tab-group-tab>
          <ha-tab-group-tab value="5" ?active=${this._selectedTab === 5}>
            <ha-icon icon="mdi:account-multiple-outline"></ha-icon>
            Users & Devices
          </ha-tab-group-tab>
          <ha-tab-group-tab value="6" ?active=${this._selectedTab === 6}>
            <ha-icon icon="mdi:package-variant"></ha-icon>
            Pack Explorer
          </ha-tab-group-tab>
          ${this._isAdmin() ? html`
          <ha-tab-group-tab value="7" ?active=${this._selectedTab === 7}>
            <ha-icon icon="mdi:database-cog"></ha-icon>
            Storage
          </ha-tab-group-tab>
          ` : ''}
          ${this._isDevFeaturesEnabled() ? html`
          <ha-tab-group-tab value="8" ?active=${this._selectedTab === 8}>
            <ha-icon icon="mdi:view-grid-plus-outline"></ha-icon>
            Layouts
          </ha-tab-group-tab>
          ` : ''}
        </ha-tab-group>

        <div class="tab-content">
          ${PANEL_TAB_DOCS[this._selectedTab] ? html`
            <div class="tab-docs">
              <a href=${docsUrl(PANEL_TAB_DOCS[this._selectedTab])} target="_blank" rel="noopener noreferrer">
                Docs<ha-icon icon="mdi:open-in-new"></ha-icon>
              </a>
            </div>
          ` : ''}
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

  /** True if the current HA user is an administrator. */
  _isAdmin() {
    return this.hass?.user?.is_admin === true;
  }

  /** True when the dev-only features URL parameter is present (?lcards_dev_features=true). */
  _isDevFeaturesEnabled() {
    return new URLSearchParams(window.location.search).get('lcards_dev_features') === 'true';
  }

  _renderTabContent() {
    switch (this._selectedTab) {
      case 0:
        return this._renderAboutTab();
      case 1:
        return this._renderHelpersTab();
      case 2:
        return this._renderThemeBrowserTab();
      case 3:
        return this._renderConnectivityTab();
      case 4:
        return this._renderSoundTab();
      case 5:
        return this._renderUsersDevicesTab();
      case 6:
        return this._renderPackExplorerTab();
      case 7:
        return this._isAdmin() ? this._renderStorageTab() : html``;
      case 8:
        return this._isDevFeaturesEnabled() ? this._renderLayoutsTab() : html``;
      default:
        return html`<div>Unknown tab</div>`;
    }
  }

  _renderConnectivityTab() {
    return html`
      <lcards-connectivity-tab
        .hass=${this.hass}
      ></lcards-connectivity-tab>
    `;
  }

  _renderAboutTab() {
    return html`
      <div class="studio-layout">
        <lcards-about-tab
          .hass=${this.hass}
          @lcards-navigate-tab=${(e) => {
            this._selectedTab = e.detail.tab;
            this.requestUpdate();
          }}
        ></lcards-about-tab>
      </div>
    `;
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
        ${this._missingHelpers.length > 0 ? html`
          <div class="banner warning">
            <ha-icon icon="mdi:alert-circle"></ha-icon>
            <span class="banner-text">
              ${this._missingHelpers.length} helper${this._missingHelpers.length > 1 ? 's are' : ' is'} missing in Home Assistant.
              Create them all here, or one at a time from the tables below.
            </span>
            <ha-button
              @click=${this._createAllHelpers}
              ?disabled=${this._createInProgress}>
              ${this._createInProgress
                ? html`<ha-spinner slot="start" size="small"></ha-spinner>`
                : html`<ha-icon slot="start" icon="mdi:plus-circle"></ha-icon>`}
              Create All
            </ha-button>
          </div>
        ` : ''}

        <div class="search-container">
          <ha-input-search
            appearance="outlined"
            placeholder="Search helpers"
            .value=${this._filterText}
            @input=${(e) => { this._filterText = e.target.value ?? ''; }}
            @wa-clear=${() => { this._filterText = ''; }}>
          </ha-input-search>
          ${this._filterText ? html`
            <span class="hint">Showing ${filteredHelpers.length} of ${this._helpers.length}</span>
          ` : ''}
        </div>

        ${this._renderCategoryFilters()}

        <div class="scrollable-body">
        ${Object.entries(groupedHelpers).length > 0 ? Object.entries(groupedHelpers).map(([category, helpers]) => {
          // Counts over the full list, not the filtered one
          const allCategoryHelpers = this._helpers.filter(h => (h.category || 'other') === category);
          const configuredCount = allCategoryHelpers.filter(h => h.exists).length;
          const totalCount = allCategoryHelpers.length;

          return html`
            <lcards-form-section
              header=${categoryLabels[category] || category}
              icon=${CATEGORY_ICONS[category] || 'mdi:cog'}
              secondary=${`${configuredCount} / ${totalCount} created`}
              ?expanded=${this._expandedCategories.has(category)}
              ?outlined=${true}
              @expanded-changed=${(e) => this._setCategoryExpanded(category, e.detail.expanded)}>
              <div class="category-actions">
                <ha-button
                  appearance="plain"
                  @click=${() => this._resetCategoryToDefaults(category)}
                  title="Reset all helpers in this section to their registry default values">
                  <ha-icon slot="start" icon="mdi:restore"></ha-icon>
                  Reset to Defaults
                </ha-button>
              </div>
              <table class="helper-table">
                <thead>
                  <tr>
                    <th class="col-icon"></th>
                    <th>Helper</th>
                    <th>Entity ID</th>
                    <th class="col-status">Status</th>
                    <th>Value</th>
                    <th class="col-actions">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  ${helpers.map(helper => this._renderHelperRow(helper))}
                </tbody>
              </table>
            </lcards-form-section>
          `;
        }) : ''}

        ${filteredHelpers.length === 0 && this._filterText ? html`
          <div class="empty-state">
            <ha-icon icon="mdi:filter-off"></ha-icon>
            <p>No helpers match "${this._filterText}"</p>
            <p class="hint">Try a different search term or category.</p>
          </div>
        ` : ''}

        ${this._helpers.length === 0 && !this._filterText ? html`
          <div class="empty-state">
            <ha-spinner size="small"></ha-spinner>
            <p>Loading helpers</p>
          </div>
        ` : ''}
        </div>
      </div>
    `;
  }

  /**
   * Category filter chips (a radio group: one category, or All).
   */
  _renderCategoryFilters() {
    const categoryCounts = this._helpers.reduce((acc, helper) => {
      const category = helper.category || 'other';
      acc[category] = (acc[category] || 0) + 1;
      return acc;
    }, {});

    const categories = [
      { id: 'all', label: 'All', count: this._helpers.length },
      { id: 'alert_system', label: 'Alert Lab', count: categoryCounts.alert_system || 0 },
      { id: 'ha_lcars_theme', label: 'HA-LCARS Theme', count: categoryCounts.ha_lcars_theme || 0 },
      { id: 'sound', label: 'Sounds', count: categoryCounts.sound || 0 }
    ];

    return renderFilterChips({
      className: 'category-filters',
      options: categories.map(cat => ({ value: cat.id, label: `${cat.label} (${cat.count})` })),
      selected: this._selectedCategory,
      onSelect: (value) => { this._selectedCategory = value; },
    });
  }

  _setCategoryExpanded(category, expanded) {
    const next = new Set(this._expandedCategories);
    if (expanded) next.add(category); else next.delete(category);
    this._expandedCategories = next;
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
            <span class="manual-setup">Manual setup required</span>
          `}
        </td>
      </tr>
    `;
  }

  _renderValueControl(helper) {
    if (helper.domain === 'input_select') {
      // Get fresh value and current options from HASS state.
      // attributes.options reflects the live HA options (updated by set_options calls,
      // e.g. when sound packs register new schemes) — ws_create_params.options is only
      // the initial registry default and must NOT be used as the dropdown source here.
      const entityState  = this.hass?.states?.[helper.entity_id];
      const currentValue = entityState?.state || helper.currentValue;
      const liveOptions  = entityState?.attributes?.options ?? helper.ws_create_params.options ?? [];

      return html`
        <ha-selector
          .hass=${this.hass}
          .selector=${{ select: {
            options: liveOptions.map(o => ({ value: o, label: o })),
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

  _renderUsersDevicesTab() {
    return html`
      <lcards-users-devices-tab
        .hass=${this.hass}
      ></lcards-users-devices-tab>
    `;
  }

  _renderStorageTab() {
    return html`
      <lcards-storage-explorer-tab
        .hass=${this.hass}
      ></lcards-storage-explorer-tab>
    `;
  }

  _renderPackExplorerTab() {
    return html`
      <lcards-pack-explorer-tab
        .hass=${this.hass}
      ></lcards-pack-explorer-tab>
    `;
  }

  _renderLayoutsTab() {
    return html`
      <lcards-layouts-tab
        .hass=${this.hass}
      ></lcards-layouts-tab>
    `;
  }

}

// Loaded on demand by lcards-config-panel-shell.js, which owns the `lcards-config-panel` tag HA creates.
if (!customElements.get('lcards-config-panel-impl')) customElements.define('lcards-config-panel-impl', LCARdSConfigPanel);
