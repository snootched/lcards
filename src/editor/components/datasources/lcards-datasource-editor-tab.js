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
import './lcards-card-datasources-list.js';
import './lcards-global-datasources-panel.js';
import './lcards-datasource-dialog.js';
import '../common/lcards-message.js';

export class LCARdSDataSourceEditorTab extends LitElement {
  static get properties() {
    return {
      editor: { type: Object },
      config: { type: Object },
      hass: { type: Object },
      _activeSubTab: { type: String, state: true },  // 'card' | 'add' | 'global'
      _dialogOpen: { type: Boolean, state: true },
      _dialogMode: { type: String, state: true },
      _editingSource: { type: Object, state: true }
    };
  }
  
  constructor() {
    super();
    this._activeSubTab = 'card';
    this._dialogOpen = false;
    this._dialogMode = 'add';
    this._editingSource = null;
  }
  
  static get styles() {
    return css`
      :host {
        display: block;
      }
      
      .ribbon {
        display: flex;
        gap: 8px;
        padding: 12px;
        background: var(--secondary-background-color, #f5f5f5);
        border-bottom: 1px solid var(--divider-color, #e0e0e0);
        overflow-x: auto;
      }
      
      .ribbon-button {
        padding: 8px 16px;
        background: var(--card-background-color, #fff);
        border: 1px solid var(--divider-color, #e0e0e0);
        border-radius: 4px;
        cursor: pointer;
        white-space: nowrap;
        transition: all 0.2s;
      }
      
      .ribbon-button[selected] {
        background: var(--primary-color, #03a9f4);
        color: var(--text-primary-color, #fff);
        border-color: var(--primary-color, #03a9f4);
      }
      
      .ribbon-button:hover:not([selected]) {
        background: var(--divider-color, #e0e0e0);
      }
      
      .content-area {
        padding: 16px;
      }

      .stub-message {
        padding: 16px;
      }
    `;
  }
  
  render() {
    return html`
      <div class="ribbon">
        <button 
          class="ribbon-button"
          ?selected=${this._activeSubTab === 'card'}
          @click=${() => this._setActiveTab('card')}>
          Card Sources
        </button>
        <button 
          class="ribbon-button"
          ?selected=${this._activeSubTab === 'add'}
          @click=${() => this._handleAddSource()}>
          + Add Source
        </button>
        <button 
          class="ribbon-button"
          ?selected=${this._activeSubTab === 'global'}
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
          <lcards-card-datasources-list
            .editor=${this.editor}
            .config=${this.config}
            .hass=${this.hass}
            @edit-datasource=${this._handleEditRequest}
            @delete-datasource=${this._handleDeleteRequest}>
          </lcards-card-datasources-list>
        `;
      
      case 'add':
        // This case is now handled by opening the dialog
        return html`
          <div class="stub-message">
            <lcards-message
              type="info"
              message="Click '+ Add Source' button above to create a new datasource.">
            </lcards-message>
          </div>
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
      if (!confirmed) return;
    }
    
    // Remove from config
    const updatedDataSources = { ...this.config.data_sources };
    delete updatedDataSources[name];
    this.editor._setConfigValue('data_sources', updatedDataSources);
    
    // Remove from tracking
    dsManager.removeCardFromSource(name, this.config.id || this.editor._cardGuid);
  }

  _handleDialogSave(event) {
    const { name, config } = event.detail;
    
    // Update config via editor
    const updatedDataSources = { ...this.config.data_sources };
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
          this.config.id || this.editor._cardGuid,
          false  // Not auto-created
        );
      }
    }
    
    this._dialogOpen = false;
    this._activeSubTab = 'card'; // Switch to card view to see the new/edited source
  }

  _showDependencyWarningDialog(sourceName, dependents) {
    return new Promise((resolve) => {
      // Check if ha-dialog is available
      const hasDialog = customElements.get('ha-dialog');
      const hasAlert = customElements.get('ha-alert');
      
      if (!hasDialog) {
        // Fallback to native confirm
        const confirmed = confirm(
          `Warning: Deleting datasource "${sourceName}" will break ${dependents.length} other card(s):\n\n` +
          dependents.map(id => `- ${id}`).join('\n') +
          '\n\nThese cards WILL ERROR until you update their configurations. Continue?'
        );
        resolve(confirmed);
        return;
      }

      const dialog = document.createElement('ha-dialog');
      dialog.heading = 'Destructive Action';
      
      const content = document.createElement('div');
      content.innerHTML = `
        ${hasAlert ? `
          <ha-alert alert-type="error" style="margin-bottom: 16px;">
            <strong>Warning: This will break other cards!</strong>
          </ha-alert>
        ` : `
          <div style="padding: 16px; background: var(--error-color, #f44336); color: white; border-radius: 4px; margin-bottom: 16px;">
            <strong>Warning: This will break other cards!</strong>
          </div>
        `}
        
        <p>Deleting datasource <strong>"${sourceName}"</strong> will:</p>
        <ol>
          <li>Remove it from THIS card's configuration</li>
          <li>Destroy the global DataSource singleton on page reload</li>
        </ol>
        
        <p><strong>The following cards depend on this datasource:</strong></p>
        <ul>
          ${dependents.map(id => `<li><code>${id}</code></li>`).join('')}
        </ul>
        
        <p style="color: var(--error-color); font-weight: 500;">
          These cards WILL ERROR until you update their configurations.
          This action cannot be undone.
        </p>
      `;
      
      dialog.appendChild(content);
      
      // Actions
      const cancelButton = document.createElement('mwc-button');
      cancelButton.slot = 'primaryAction';
      cancelButton.label = 'Cancel';
      cancelButton.addEventListener('click', () => {
        dialog.close();
        resolve(false);
      });
      
      const deleteButton = document.createElement('mwc-button');
      deleteButton.slot = 'secondaryAction';
      deleteButton.label = 'Delete and Break Dependencies';
      deleteButton.style.color = 'var(--error-color)';
      deleteButton.addEventListener('click', () => {
        dialog.close();
        resolve(true);
      });
      
      dialog.appendChild(cancelButton);
      dialog.appendChild(deleteButton);
      
      document.body.appendChild(dialog);
      dialog.open = true;
      
      dialog.addEventListener('closed', () => {
        document.body.removeChild(dialog);
      });
    });
  }
}

customElements.define('lcards-datasource-editor-tab', LCARdSDataSourceEditorTab);
