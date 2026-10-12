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
import { messageStyles } from '../../base/surface-styles.js';
import { renderLauncher, launcherStyles } from '../shared/launcher.js';
import { showConfirmDeleteDialog } from '../../../views/layout-edit-dialogs.js';

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
      messageStyles,
      launcherStyles,
      css`
        :host {
          display: block;
        }

        ha-tab-group {
          display: block;
          margin-top: var(--ha-space-4);
        }

        ha-tab-group-tab ha-icon {
          --mdc-icon-size: 18px;
          margin-right: var(--ha-space-2);
        }

        .card-sources-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: var(--ha-space-3);
          margin: var(--ha-space-3) 0;
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
      ${renderLauncher({
        icon: 'mdi:database-search',
        title: 'Data sources',
        description: 'Live state of every data source on this page: values, buffers and processors.',
        stats: [
          { value: cardSourceCount, label: cardSourceCount === 1 ? 'card source' : 'card sources' },
          { value: globalSourceCount, label: 'running on this page' },
        ],
        actions: [{ label: 'Browse sources', icon: 'mdi:database-search', onClick: () => this._openBrowser() }],
      })}

      <ha-tab-group @wa-tab-show=${this._handleTabChange}>
        <ha-tab-group-tab value="card" ?active=${this._activeSubTab === 'card'}>
          <ha-icon icon="mdi:card-outline"></ha-icon>
          This card
        </ha-tab-group-tab>
        <ha-tab-group-tab value="global" ?active=${this._activeSubTab === 'global'}>
          <ha-icon icon="mdi:earth"></ha-icon>
          All on this page
        </ha-tab-group-tab>

        <div class="tab-panel">
          ${this._activeSubTab === 'global' ? this._renderGlobalSources() : this._renderCardSources()}
        </div>
      </ha-tab-group>

      <lcards-datasource-studio-dialog
        .hass=${this.hass}
        .mode=${this._dialogMode}
        .sourceName=${this._editingSource?.name}
        .sourceConfig=${this._editingSource?.config}
        .cardConfig=${this.editor?.config}
        .open=${this._dialogOpen}
        @save=${this._handleDialogSave}
        @cancel=${() => this._dialogOpen = false}>
      </lcards-datasource-studio-dialog>

      <lcards-datasource-browser
        ${ref(this._browserRef)}
        .hass=${this.hass}
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
        <span class="hint">Data sources defined in this card's config.</span>
        <ha-button variant="brand" appearance="accent" @click=${this._handleAddSource}>
          <ha-icon slot="start" icon="mdi:plus"></ha-icon>
          Add source
        </ha-button>
      </div>

      <lcards-card-datasources-list
        .editor=${this.editor}
        .config=${this.editor.config}
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
  }

  _handleDialogSave(event) {
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

  /**
   * Confirm deleting a source other cards use (they break until reconfigured).
   * @returns {Promise<boolean>}
   */
  _showDependencyWarningDialog(sourceName, dependents) {
    return showConfirmDeleteDialog({
      title: `Delete ${sourceName}?`,
      message: `Other cards use it: ${dependents.join(', ')}. They show errors until their configs stop referring to it. This can't be undone.`,
      confirmText: 'Delete anyway',
    });
  }
}

if (!customElements.get('lcards-datasource-editor-tab')) customElements.define('lcards-datasource-editor-tab', LCARdSDataSourceEditorTab);
