/**
 * LCARdS Datasource Editor Tab
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
import { fireEvent } from 'custom-card-helpers';
import './lcards-card-datasources-list.js';
import './lcards-global-datasources-panel.js';
import './lcards-datasource-dialog.js';
import '../shared/lcards-message.js';

export class LCARdSDataSourceEditorTab extends LitElement {
  static get properties() {
    return {
      editor: { type: Object },
      hass: { type: Object },
      _activeSubTab: { type: String, state: true },  // 'card' | 'global'
      _dialogOpen: { type: Boolean, state: true },
      _dialogMode: { type: String, state: true },
      _editingSource: { type: Object, state: true }
    };
  }

  constructor() {
    super();
    this._activeSubTab = 'card';  // Only 'card' or 'global'
    this._dialogOpen = false;
    this._dialogMode = 'add';
    this._editingSource = null;
  }

  static get styles() {
    return css`
      :host {
        display: block;
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

      .tab {
        flex: 0 0 auto;
        white-space: nowrap;
        padding: 12px 24px;
        cursor: pointer;
        border-bottom: 3px solid transparent;
        font-family: inherit;
        font-size: inherit;
        font-weight: 500;
        color: var(--secondary-text-color, #727272);
        transition: all 0.2s ease;
        user-select: none;
        background: transparent;
        border-left: none;
        border-right: none;
        border-top: none;
      }

      .tab:hover {
        color: var(--primary-text-color, #212121);
        background: var(--secondary-background-color, #f5f5f5);
      }

      .tab.active {
        color: var(--primary-color, #03a9f4);
        border-bottom-color: var(--primary-color, #03a9f4);
        border-bottom-width: 4px;
      }

      .content-area {
        padding: 16px;
      }

      .card-sources-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 16px;
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
    `;
  }

  render() {
    return html`
      <div class="tabs-container">
        <button
          class="tab ${this._activeSubTab === 'card' ? 'active' : ''}"
          @click=${() => this._setActiveTab('card')}>
          Card Sources
        </button>
        <button
          class="tab ${this._activeSubTab === 'global' ? 'active' : ''}"
          @click=${() => this._setActiveTab('global')}>
          Global Sources
        </button>
      </div>

      <div class="content-area">
        ${this._renderActiveTab()}
      </div>

      <lcards-datasource-dialog
        .hass=${this.hass}
        .mode=${this._dialogMode}
        .sourceName=${this._editingSource?.name}
        .sourceConfig=${this._editingSource?.config}
        .open=${this._dialogOpen}
        @save=${this._handleDialogSave}
        @cancel=${() => this._dialogOpen = false}>
      </lcards-datasource-dialog>
    `;
  }

  _renderActiveTab() {
    switch (this._activeSubTab) {
      case 'card':
        return html`
          <div class="card-sources-header">
            <div></div>
            <mwc-button
              class="add-source-button"
              raised
              @click=${this._handleAddSource}>
              <ha-icon icon="mdi:plus"></ha-icon>
              Add Source
            </mwc-button>
          </div>

          <lcards-card-datasources-list
            .editor=${this.editor}
            .config=${this.editor.config}
            .hass=${this.hass}
            @edit-datasource=${this._handleEditRequest}
            @delete-datasource=${this._handleDeleteRequest}>
          </lcards-card-datasources-list>
        `;

      case 'global':
        return html`
          <lcards-global-datasources-panel
            .hass=${this.hass}>
          </lcards-global-datasources-panel>
        `;

      default:
        return html``;
    }
  }

  _setActiveTab(tab) {
    this._activeSubTab = tab;
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
      console.warn('[LCARdS] DataSourceManager not available');
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
    const updatedDataSources = { ...(this.editor.config.data_sources || {}) };

    delete updatedDataSources[name];

    // Directly assign to config (bypassing _updateConfig's deep merge)
    this.editor.config.data_sources = updatedDataSources;

    // Now fire the config-changed event manually
    fireEvent(this.editor, 'config-changed', { config: this.editor.config });

    // Update YAML representation
    if (this.editor._yamlValue !== undefined) {
      this.editor._isUpdatingYaml = true;
      const { configToYaml } = await import('../../utils/yaml-utils.js');
      this.editor._yamlValue = configToYaml(this.editor.config);
      requestAnimationFrame(() => {
        this.editor._isUpdatingYaml = false;
      });
    }

    // Remove from tracking AFTER config update
    dsManager.removeCardFromSource(name, this.editor.config.id || this.editor._cardGuid);

    // Trigger re-render
    this.editor.requestUpdate();
    this.requestUpdate();
  }  _handleDialogSave(event) {
    const { name, config } = event.detail;

    // Update config via editor - read from editor.config to get the latest state
    const updatedDataSources = { ...(this.editor.config.data_sources || {}) };
    updatedDataSources[name] = config;
    this.editor._setConfigValue('data_sources', updatedDataSources);

    // If new datasource, register with manager
    if (this._dialogMode === 'add') {
      const dsManager = window.lcards?.core?.dataSourceManager;
      if (dsManager) {
        // Note: Datasource will be created when card re-initializes
        dsManager.createDataSource(
          name,
          config,
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
      dialog.heading = 'Destructive Action';
      dialog.scrimClickAction = '';
      dialog.escapeKeyAction = '';

      // Create content div (light DOM, no slot)
      const content = document.createElement('div');
      content.style.padding = '0 24px 8px';
      content.innerHTML = `
        <ha-alert alert-type="error" style="margin-bottom: 16px;">
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
      cancelButton.setAttribute('slot', 'secondaryAction');
      cancelButton.setAttribute('appearance', 'plain');
      cancelButton.textContent = 'Cancel';
      cancelButton.setAttribute('dialogAction', 'cancel');
      cancelButton.addEventListener('click', () => {
        console.log('[LCARdS] Delete dialog: Cancel clicked');
        dialog.close();
        resolve(false);
      });

      // Delete button (primary action - warning/destructive style)
      const deleteButton = document.createElement('ha-button');
      deleteButton.setAttribute('slot', 'primaryAction');
      deleteButton.setAttribute('variant', 'warning');
      deleteButton.setAttribute('appearance', 'accent');
      deleteButton.textContent = 'Delete and Break Dependencies';
      deleteButton.setAttribute('dialogAction', 'ok');
      deleteButton.addEventListener('click', () => {
        console.log('[LCARdS] Delete dialog: Delete clicked');
        dialog.close();
        resolve(true);
      });

      dialog.appendChild(cancelButton);
      dialog.appendChild(deleteButton);

      document.body.appendChild(dialog);

      // Small delay to ensure dialog is in DOM before opening
      setTimeout(() => {
        dialog.open = true;
      }, 0);

      dialog.addEventListener('closed', () => {
        document.body.removeChild(dialog);
      }, { once: true });
    });
  }
}

customElements.define('lcards-datasource-editor-tab', LCARdSDataSourceEditorTab);
