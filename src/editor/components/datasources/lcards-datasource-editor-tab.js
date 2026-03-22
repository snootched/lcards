/**
 * @fileoverview LCARdS Datasource Editor Tab
 *
 * Main container for datasource editing with ribbon navigation.
 * Manages sub-tab state and coordinates between card-local and global views.
 *
 * @element lcards-datasource-editor-tab
 * @fires config-changed - When card datasources are modified
 *
 * @property {Object} editor - Parent card editor instance
 * @property {Object} config - Full card configuration
 * @property {Object} hass - Home Assistant instance
 */

import { LitElement, html, css } from 'lit';
import { createRef, ref } from 'lit/directives/ref.js';
import { fireEvent } from 'custom-card-helpers';
import { lcardsLog } from '../../../utils/lcards-logging.js';
import { editorStyles } from '../../base/editor-styles.js';
import './lcards-card-datasources-list.js';
import './lcards-global-datasources-panel.js';
import '../../dialogs/lcards-datasource-studio-dialog.js';
import './lcards-datasource-browser.js';
import '../shared/lcards-message.js';

export class LCARdSDataSourceEditorTab extends LitElement {
  static get properties() {
    return {
      editor: { type: Object },
      hass: { type: Object },
      _activeSubTab: { type: String, state: true },  // 'card' | 'global'
      _dialogOpen: { type: Boolean, state: true },
      _dialogMode: { type: String, state: true },
      _editingSource: { type: Object, state: true },
      _browserOpen: { type: Boolean, state: true }
    };
  }

  constructor() {
    super();
        /** @type {any} */
        this.editor = undefined;
        /** @type {any} */
        this.hass = undefined;
    this._activeSubTab = 'card';  // Only 'card' or 'global'
    this._dialogOpen = false;
    this._dialogMode = 'add';
    this._editingSource = null;
    this._browserOpen = false;
    this._browserRef = createRef();
  }

  static get styles() {
    return [
      editorStyles,
      css`
        :host {
          display: block;
          padding: 8px 0;
        }

      .tabs-container {
        display: flex;
        gap: 0;
        padding: 0;
        background: transparent;
        border-bottom: 2px solid var(--divider-color, #e0e0e0);
        overflow-x: auto;
        scrollbar-width: thin;
      }

      .tabs-container::-webkit-scrollbar {
        height: 4px;
      }

      .tabs-container::-webkit-scrollbar-thumb {
        background: var(--primary-color, #03a9f4);
        border-radius: 2px;
      }

      /* HA native tab styling (Issue #82) */
      ha-tab-group {
        display: block;
        margin-bottom: 12px;
      }

      ha-tab-panel {
        padding: 16px;
      }

      .card-sources-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 12px;
      }

      .header-actions {
        display: flex;
        gap: 12px;
        align-items: center;
      }

      .add-source-button {
        display: flex;
        align-items: center;
        gap: 4px;
        cursor: pointer;
      }

      mwc-button {
        cursor: pointer;
      }
      `
    ];
  }

  render() {
    // @ts-ignore - TS2339: auto-suppressed
    const cardSources = this.editor?.config?.data_sources || {};
    const cardSourceCount = Object.keys(cardSources).length;

    // Get global datasource count
    const dsManager = window.lcards?.core?.dataSourceManager;
    const globalSourceCount = dsManager?.sources?.size || 0;

    return html`
      <!-- Launcher Card (above tabs) -->
      <div class="info-card">
        <div class="info-card-content">
          <h3>📊 Data Sources Browser</h3>
          <p>
            <strong>${cardSourceCount} card sources</strong> configured
            <br />
            <strong>${globalSourceCount} global sources</strong> active
          </p>
          <p style="font-size: 13px; color: var(--secondary-text-color);">
            Browse and manage data sources. View entity subscriptions, transformations, and real-time data.
          </p>
        </div>
        <div class="info-card-actions">
          <ha-button
            raised
            @click=${this._openBrowser}>
            <ha-icon icon="mdi:database-search" slot="start"></ha-icon>
            Browse Sources
          </ha-button>
        </div>
      </div>

      <!-- Tabbed Section -->
      <div style="margin-top: 16px;">
        <ha-tab-group @wa-tab-show=${this._handleTabChange}>
          <ha-tab-group-tab value="card" ?active=${this._activeSubTab === 'card'}>
            Card Sources
          </ha-tab-group-tab>
          <ha-tab-group-tab value="global" ?active=${this._activeSubTab === 'global'}>
            Global Sources
          </ha-tab-group-tab>

          <ha-tab-panel value="card" ?hidden=${this._activeSubTab !== 'card'}>
            ${this._activeSubTab === 'card' ? this._renderCardSources() : ''}
          </ha-tab-panel>
          <ha-tab-panel value="global" ?hidden=${this._activeSubTab !== 'global'}>
            ${this._activeSubTab === 'global' ? this._renderGlobalSources() : ''}
          </ha-tab-panel>
        </ha-tab-group>
      </div>

      <lcards-datasource-studio-dialog
        // @ts-ignore - TS2339: auto-suppressed
        .hass=${this.hass}
        .mode=${this._dialogMode}
        .sourceName=${this._editingSource?.name}
        .sourceConfig=${this._editingSource?.config}
        // @ts-ignore - TS2339: auto-suppressed
        .cardConfig=${this.editor?.config}
        .open=${this._dialogOpen}
        @save=${this._handleDialogSave}
        @cancel=${() => this._dialogOpen = false}>
      </lcards-datasource-studio-dialog>

      <lcards-datasource-browser
        ${ref(this._browserRef)}
        // @ts-ignore - TS2339: auto-suppressed
        .hass=${this.hass}
        // @ts-ignore - TS2339: auto-suppressed
        .cardConfig=${this.editor?.config}
        .open=${this._browserOpen}
        @close=${() => this._browserOpen = false}
        @edit-source=${this._handleBrowserEditSource}>
      </lcards-datasource-browser>
    `;
  }

  _renderCardSources() {
    return html`
      <div class="card-sources-header">
        <div></div>
        <div class="header-actions">
          <ha-button
            class="add-source-button"
            variant="brand"
            appearance="accent"
            @click=${this._handleAddSource}>
            <ha-icon slot="start" icon="mdi:plus"></ha-icon>
            Add Source
          </ha-button>
        </div>
      </div>

      <lcards-card-datasources-list
        // @ts-ignore - TS2339: auto-suppressed
        .editor=${this.editor}
        // @ts-ignore - TS2339: auto-suppressed
        .config=${this.editor.config}
        // @ts-ignore - TS2339: auto-suppressed
        .hass=${this.hass}
        @edit-datasource=${this._handleEditRequest}
        @delete-datasource=${this._handleDeleteRequest}
        @inspect-source=${this._handleInspectSource}>
      </lcards-card-datasources-list>
    `;
  }

  _renderGlobalSources() {
    return html`
      <lcards-global-datasources-panel
        // @ts-ignore - TS2339: auto-suppressed
        .hass=${this.hass}>
      </lcards-global-datasources-panel>
    `;
  }

  /**
   * Handle tab change from HA native tab group (Issue #82)
   * @param {CustomEvent} event - wa-tab-show event
   */
  _handleTabChange(event) {
    // CRITICAL: Stop propagation to prevent bubbling to parent tab handlers
    event.stopPropagation();

    // @ts-ignore - TS2339: auto-suppressed
    const tab = event.target.activeTab?.getAttribute('value');
    if (tab) {
      this._setActiveTab(tab);
    }
  }

  _setActiveTab(tab) {
    this._activeSubTab = tab;
  }

  _openBrowser() {
    this._browserOpen = true;
  }

  _handleInspectSource(event) {
    const { sourceName } = event.detail;

    // Open the browser
    this._browserOpen = true;

    // Wait for browser to render, then select the datasource
    requestAnimationFrame(() => {
      if (this._browserRef.value) {
        // @ts-ignore - TS2339: auto-suppressed
        this._browserRef.value.selectDataSource(sourceName);
      }
    });
  }

  _handleBrowserEditSource(event) {
    const { sourceName } = event.detail;

    // Close the browser
    this._browserOpen = false;

    // Switch to card tab
    this._activeSubTab = 'card';

    // Get the source config from card config
    // @ts-ignore - TS2339: auto-suppressed
    const cardSources = this.editor?.config?.data_sources || {};
    const sourceConfig = cardSources[sourceName];

    if (!sourceConfig) {
      lcardsLog.warn(`⚠️ [DataSourceEditorTab] Source "${sourceName}" not found in card config`);
      return;
    }

    // Open edit dialog
    this._dialogMode = 'edit';
    this._editingSource = {
      name: sourceName,
      config: sourceConfig
    };
    this._dialogOpen = true;
  }

  _handleAddSource() {
    this._dialogMode = 'add';
    this._editingSource = null;
    this._dialogOpen = true;
  }

  _handleEditRequest(event) {
    this._dialogMode = 'edit';
    this._editingSource = event.detail;
    this._dialogOpen = true;
  }

  async _handleDeleteRequest(event) {
    const { name } = event.detail;

    const dsManager = window.lcards?.core?.dataSourceManager;

    if (!dsManager) {
      lcardsLog.warn('⚠️ [LCARdS] DataSourceManager not available');
      return;
    }

    // Get dependents
    const dependents = dsManager.getSourceDependents(name);

    if (dependents.length > 0) {
      const confirmed = await this._showDependencyWarningDialog(name, dependents);
      if (!confirmed) {
        return;
      }
    }

    // CRITICAL: deepMerge will NOT remove properties that don't exist in source.
    // We must directly assign to the config object, then trigger the update.

    // Create a new data_sources object without the deleted source
    // @ts-ignore - TS2339: auto-suppressed
    const updatedDataSources = { ...(this.editor.config.data_sources || {}) };

    delete updatedDataSources[name];

    // Directly assign to config (bypassing _updateConfig's deep merge)
    // @ts-ignore - TS2339: auto-suppressed
    this.editor.config.data_sources = updatedDataSources;

    // Now fire the config-changed event manually
    // @ts-ignore - TS2339: auto-suppressed
    fireEvent(this.editor, 'config-changed', { config: this.editor.config });

    // Update YAML representation
    // @ts-ignore - TS2339: auto-suppressed
    if (this.editor._yamlValue !== undefined) {
      // @ts-ignore - TS2339: auto-suppressed
      this.editor._isUpdatingYaml = true;
      const { configToYaml } = await import('../../utils/yaml-utils.js');
      // @ts-ignore - TS2339: auto-suppressed
      this.editor._yamlValue = configToYaml(this.editor.config);
      requestAnimationFrame(() => {
        // @ts-ignore - TS2339: auto-suppressed
        this.editor._isUpdatingYaml = false;
      });
    }

    // Remove from tracking AFTER config update
    // @ts-ignore - TS2339: auto-suppressed
    dsManager.removeCardFromSource(name, this.editor.config.id || this.editor._cardGuid);

    // Trigger re-render
    // @ts-ignore - TS2339: auto-suppressed
    this.editor.requestUpdate();
    this.requestUpdate();
  }  _handleDialogSave(event) {
    const { name, config } = event.detail;

    // Update config via editor - read from editor.config to get the latest state
    // @ts-ignore - TS2339: auto-suppressed
    const updatedDataSources = { ...(this.editor.config.data_sources || {}) };
    updatedDataSources[name] = config;

    // CRITICAL: Cannot use _setConfigValue because deepMerge doesn't delete nested properties
    // Must directly assign to config and fire change event
    // @ts-ignore - TS2339: auto-suppressed
    this.editor.config = {
      // @ts-ignore - TS2339: auto-suppressed
      ...this.editor.config,
      data_sources: updatedDataSources
    };

    // Fire config change event for HA
    // @ts-ignore - TS2339: auto-suppressed
    fireEvent(this.editor, 'config-changed', { config: this.editor.config });

    // If new datasource, register with manager
    if (this._dialogMode === 'add') {
      const dsManager = window.lcards?.core?.dataSourceManager;
      if (dsManager) {
        // Note: Datasource will be created when card re-initializes
        dsManager.createDataSource(
          name,
          config,
          // @ts-ignore - TS2339: auto-suppressed
          this.editor.config.id || this.editor._cardGuid,
          false  // Not auto-created
        );
      }
    }

    this._dialogOpen = false;
    this._activeSubTab = 'card'; // Switch to card view to see the new/edited source

    // Force this component to re-render, which will pass updated config to children
    this.requestUpdate();
  }

  _showDependencyWarningDialog(sourceName, dependents) {
    return new Promise((resolve) => {
      const dialog = document.createElement('ha-dialog');
      // @ts-ignore - TS2339: auto-suppressed
      dialog.headerTitle = 'Destructive Action';
      dialog.setAttribute('prevent-scrim-close', '');

      // Create content div (light DOM, no slot)
      const content = document.createElement('div');
      content.style.padding = '0 24px 8px';
      content.innerHTML = `
        <ha-alert alert-type="error" style="margin-bottom: 12px;">
          <strong>⚠️ Warning: This will break other cards!</strong>
        </ha-alert>

        <p>Deleting datasource <strong>"${sourceName}"</strong> will:</p>
        <ol style="margin: 8px 0;">
          <li>Remove it from THIS card's configuration</li>
          <li>Destroy the global DataSource singleton on page reload</li>
        </ol>

        <p><strong>The following cards depend on this datasource:</strong></p>
        <ul style="margin: 8px 0;">
          ${dependents.map(id => `<li><code>${id}</code></li>`).join('')}
        </ul>

        <p style="color: var(--error-color); font-weight: 500; margin-top: 16px;">
          ⚠️ These cards WILL ERROR until you update their configurations.
          This action cannot be undone.
        </p>
      `;

      dialog.appendChild(content);

      // Cancel button (secondary action - plain appearance)
      const cancelButton = document.createElement('ha-button');
      cancelButton.setAttribute('slot', 'footer');
      cancelButton.setAttribute('appearance', 'plain');
      cancelButton.textContent = 'Cancel';
      cancelButton.addEventListener('click', () => {
        lcardsLog.trace('[LCARdS] Delete dialog: Cancel clicked');
        // @ts-ignore - TS2551: auto-suppressed
        dialog.close();
        resolve(false);
      });

      // Delete button (primary action - warning/destructive style)
      const deleteButton = document.createElement('ha-button');
      deleteButton.setAttribute('slot', 'footer');
      deleteButton.setAttribute('variant', 'warning');
      deleteButton.setAttribute('appearance', 'accent');
      deleteButton.textContent = 'Delete and Break Dependencies';
      deleteButton.addEventListener('click', () => {
        lcardsLog.trace('[LCARdS] Delete dialog: Delete clicked');
        // @ts-ignore - TS2551: auto-suppressed
        dialog.close();
        resolve(true);
      });

      dialog.appendChild(cancelButton);
      dialog.appendChild(deleteButton);

      document.body.appendChild(dialog);

      // Small delay to ensure dialog is in DOM before opening
      setTimeout(() => {
        // @ts-ignore - TS2339: auto-suppressed
        dialog.open = true;
      }, 0);

      dialog.addEventListener('closed', () => {
        document.body.removeChild(dialog);
      }, { once: true });
    });
  }
}

customElements.define('lcards-datasource-editor-tab', LCARdSDataSourceEditorTab);
