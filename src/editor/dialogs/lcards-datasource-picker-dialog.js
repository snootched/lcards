/**
 * @fileoverview LCARdS DataSource Picker Dialog
 *
 * Modal dialog for selecting existing DataSources or creating new ones from entities.
 * Supports two modes: Browse (list existing) and Create (entity picker).
 *
 * @element lcards-datasource-picker-dialog
 * @fires source-selected - When a DataSource is selected/created (detail: { source: sourceId })
 * @fires closed - When dialog is closed
 *
 * @property {Object} hass - Home Assistant instance
 * @property {String} currentSource - Currently selected source (for highlighting)
 * @property {Boolean} open - Dialog open state
 */

import { LitElement, html, css } from 'lit';
import { lcardsLog } from '../../utils/lcards-logging.js';
import { haFormatState, haFormatEntityName } from '../../utils/ha-entity-display.js';
import '../components/shared/lcards-dialog.js';
import '../components/shared/lcards-message.js';
import '../components/datasources/lcards-datasource-card.js';

export class LCARdSDataSourcePickerDialog extends LitElement {
  static get properties() {
    return {
      hass: { type: Object },
      currentSource: { type: String },
      open: { type: Boolean },
      _dataSources: { type: Array, state: true },
      _mode: { type: String, state: true }, // 'browse' | 'create'
      _selectedSource: { type: String, state: true },
      _selectedEntity: { type: String, state: true },
      _dataSourceName: { type: String, state: true },
      _searchFilter: { type: String, state: true },
      _isCreating: { type: Boolean, state: true }
    };
  }

  constructor() {
    super();
    this.hass = null;
    this.currentSource = '';
    this.open = false;
    this._dataSources = [];
    this._mode = 'browse';
    this._selectedSource = '';
    this._selectedEntity = '';
    this._dataSourceName = '';
    this._searchFilter = '';
    this._isCreating = false;

    lcardsLog.debug('[LCARdSDataSourcePickerDialog] Constructor called');
  }

  static get styles() {
    return css`
      :host {
        display: block;
      }

      lcards-dialog {
        --ha-dialog-width-md: 800px;
      }

      .dialog-content {
        display: flex;
        flex-direction: column;
        gap: 16px;
        padding: 8px 0;
        max-height: 60vh;
      }

      .mode-selector {
        display: flex;
        gap: 8px;
        padding: 0 8px;
        border-bottom: 2px solid var(--divider-color, #e0e0e0);
        margin-bottom: 8px;
      }

      .mode-button {
        flex: 1;
        padding: 12px;
        border: none;
        background: transparent;
        cursor: pointer;
        font-size: 14px;
        font-weight: 500;
        color: var(--secondary-text-color);
        border-bottom: 3px solid transparent;
        transition: all 0.2s;
      }

      .mode-button:hover {
        background: var(--secondary-background-color, #fafafa);
        color: var(--primary-text-color);
      }

      .mode-button.active {
        color: var(--primary-color);
        border-bottom-color: var(--primary-color);
        border-bottom-width: 4px;
      }

      .search-container {
        padding: 0 8px;
      }

      .search-input {
        width: 100%;
        padding: 10px 12px;
        border: 2px solid var(--divider-color, #e0e0e0);
        border-radius: 4px;
        font-size: 14px;
        box-sizing: border-box;
      }

      .search-input:focus {
        outline: none;
        border-color: var(--primary-color);
      }

      .datasource-list {
        display: flex;
        flex-direction: column;
        gap: 12px;
        overflow-y: auto;
        max-height: 400px;
        padding: 0 8px;
      }

      .empty-state {
        text-align: center;
        padding: 40px 20px;
        color: var(--secondary-text-color);
      }

      .empty-state-icon {
        font-size: 48px;
        margin-bottom: 16px;
        opacity: 0.5;
      }

      .empty-state-text {
        font-size: 16px;
        margin-bottom: 8px;
      }

      .empty-state-hint {
        font-size: 14px;
        opacity: 0.7;
      }

      .create-form {
        display: flex;
        flex-direction: column;
        gap: 16px;
        padding: 0 8px;
      }

      .form-field {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }

      .form-label {
        font-size: 14px;
        font-weight: 500;
        color: var(--primary-text-color);
      }

      .form-helper {
        font-size: 12px;
        color: var(--secondary-text-color);
        margin-top: -4px;
      }

      ha-entity-picker {
        width: 100%;
      }

      ha-textfield {
        width: 100%;
      }

      .entity-preview {
        border: 2px solid var(--divider-color, #e0e0e0);
        border-radius: 8px;
        padding: 16px;
        background: var(--card-background-color, white);
      }

      .entity-preview-header {
        font-weight: 700;
        font-size: 14px;
        margin-bottom: 12px;
        color: var(--primary-text-color);
      }

      .entity-preview-content {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }

      .entity-preview-item {
        display: flex;
        justify-content: space-between;
        font-size: 14px;
      }

      .entity-preview-label {
        opacity: 0.7;
        font-weight: 500;
      }

      .entity-preview-value {
        font-weight: 600;
        word-break: break-word;
        text-align: right;
        max-width: 60%;
      }

      @media (max-width: 600px) {
        lcards-dialog {
          --ha-dialog-width-md: 90vw;
        }

        .mode-selector {
          flex-direction: column;
        }

        .mode-button {
          border-bottom: none;
          border-left: 3px solid transparent;
        }

        .mode-button.active {
          border-left-color: var(--primary-color);
          border-left-width: 4px;
        }
      }
    `;
  }

  updated(changedProps) {
    super.updated(changedProps);

    // Load DataSources when dialog opens
    if (changedProps.has('open') && this.open) {
      this._loadDataSources();
      this._selectedSource = this.currentSource || '';
      this._selectedEntity = '';
      this._dataSourceName = '';
      this._searchFilter = '';
    }

    // Auto-generate name when entity is selected
    if (changedProps.has('_selectedEntity') && this._selectedEntity) {
      if (!this._dataSourceName || this._isAutoGeneratedName(this._dataSourceName)) {
        this._dataSourceName = this._generateDataSourceName(this._selectedEntity);
      }
    }
  }

  render() {
    if (!this.open) {
      return html``;
    }

    return html`
      <lcards-dialog
        .open=${this.open}
        prevent-scrim-close
        @closed=${(e) => { e.stopPropagation(); this._handleClose(); }}>

        <span slot="heading">Select Data Source</span>

        <div style="padding: 0 24px 8px;">
          <div class="dialog-content">
            ${this._renderModeSelector()}
            ${this._mode === 'browse' ? this._renderBrowseMode() : this._renderCreateMode()}
          </div>
        </div>

        <ha-button
          slot="secondaryAction"
          appearance="plain"
          @click=${this._handleCancel}>
          Cancel
        </ha-button>

        <ha-button
          slot="primaryAction"
          variant="brand"
          appearance="accent"
          @click=${this._handleSelect}
          ?disabled=${!this._canSelect()}>
          ${this._mode === 'browse' ? 'Select' : 'Create & Select'}
        </ha-button>
      </lcards-dialog>
    `;
  }

  /**
   * Render mode selector tabs
   * @private
   */
  _renderModeSelector() {
    return html`
      <div class="mode-selector">
        <button
          class="mode-button ${this._mode === 'browse' ? 'active' : ''}"
          @click=${() => this._switchMode('browse')}
          aria-label="Browse existing datasources">
          📋 Browse Existing
        </button>
        <button
          class="mode-button ${this._mode === 'create' ? 'active' : ''}"
          @click=${() => this._switchMode('create')}
          aria-label="Create from entity">
          ➕ Create from Entity
        </button>
      </div>
    `;
  }

  /**
   * Render browse mode (list of existing DataSources)
   * @private
   */
  _renderBrowseMode() {
    const filteredSources = this._getFilteredDataSources();

    return html`
      ${this._dataSources.length > 0 ? html`
        <div class="search-container">
          <input
            type="text"
            class="search-input"
            placeholder="Search by name or entity..."
            .value=${this._searchFilter}
            @input=${this._handleSearchInput}
            aria-label="Search datasources" />
        </div>
      ` : ''}

      ${filteredSources.length > 0 ? html`
        <div class="datasource-list">
          ${filteredSources.map(ds => html`
            <lcards-datasource-card
              .dataSource=${ds}
              .selected=${this._selectedSource === ds.id}
              @datasource-click=${(e) => this._handleDataSourceClick(e.detail.dataSource)}>
            </lcards-datasource-card>
          `)}
        </div>
      ` : html`
        <div class="empty-state">
          <div class="empty-state-icon">📊</div>
          <div class="empty-state-text">
            ${this._dataSources.length === 0
              ? 'No DataSources available'
              : 'No DataSources match your search'}
          </div>
          <div class="empty-state-hint">
            ${this._dataSources.length === 0
              ? 'Create a new DataSource from the "Create from Entity" tab'
              : 'Try a different search term or create a new DataSource'}
          </div>
        </div>
      `}
    `;
  }

  /**
   * Render create mode (entity picker and config)
   * @private
   */
  _renderCreateMode() {
    return html`
      <div class="create-form">
        <div class="form-field">
          <label class="form-label">Entity</label>
          <ha-entity-picker
            .hass=${this.hass}
            .value=${this._selectedEntity}
            @value-changed=${this._handleEntitySelect}
            allow-custom-entity
            aria-label="Select entity for datasource">
          </ha-entity-picker>
          <div class="form-helper">
            Select a Home Assistant entity to track with this DataSource
          </div>
        </div>

        ${this._selectedEntity ? html`
          <div class="form-field">
            <label class="form-label">DataSource Name</label>
            <ha-textfield
              .value=${this._dataSourceName}
              @input=${this._handleNameInput}
              placeholder="Enter a unique name"
              aria-label="Datasource name">
            </ha-textfield>
            <div class="form-helper">
              A unique identifier for this DataSource (auto-generated from entity)
            </div>
          </div>

          ${this._renderEntityPreview()}
        ` : html`
          <lcards-message
            type="info"
            message="Select an entity to continue">
          </lcards-message>
        `}
      </div>
    `;
  }

  /**
   * Render entity preview (shows current state and attributes)
   * @private
   */
  _renderEntityPreview() {
    if (!this._selectedEntity || !this.hass || !this.hass.states) {
      return html``;
    }

    const entityState = this.hass.states[this._selectedEntity];
    if (!entityState) {
      return html`
        <lcards-message
          type="warning"
          message="Entity not found in Home Assistant. It may not exist or may be unavailable.">
        </lcards-message>
      `;
    }

    return html`
      <div class="entity-preview">
        <div class="entity-preview-header">📋 Entity Preview</div>
        <div class="entity-preview-content">
          <div class="entity-preview-item">
            <span class="entity-preview-label">Entity ID:</span>
            <span class="entity-preview-value">${this._selectedEntity}</span>
          </div>
          <div class="entity-preview-item">
            <span class="entity-preview-label">State:</span>
            <span class="entity-preview-value">${haFormatState(this.hass, entityState)}</span>
          </div>
          ${entityState.attributes?.unit_of_measurement ? html`
            <div class="entity-preview-item">
              <span class="entity-preview-label">Unit:</span>
              <span class="entity-preview-value">${entityState.attributes.unit_of_measurement}</span>
            </div>
          ` : ''}
          <div class="entity-preview-item">
            <span class="entity-preview-label">Friendly Name:</span>
            <span class="entity-preview-value">${haFormatEntityName(this.hass, entityState)}</span>
          </div>
          <div class="entity-preview-item">
            <span class="entity-preview-label">Last Changed:</span>
            <span class="entity-preview-value">${this._formatDateTime(entityState.last_changed)}</span>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Load DataSources from manager
   * @private
   */
  _loadDataSources() {
    const dsManager = window.lcards?.core?.dataSourceManager;
    if (!dsManager) {
      lcardsLog.warn('[LCARdSDataSourcePickerDialog] DataSourceManager not available');
      this._dataSources = [];
      return;
    }

    // Get all registered DataSources
    const sources = dsManager.sources || new Map();
    this._dataSources = Array.from(sources.entries()).map(([id, ds]) => {
      // Get latest value
      let currentValue = 'N/A';
      let lastUpdate = null;
      let historyCount = 0;

      try {
        const latestData = ds.buffer?.getLatest?.();
        if (latestData) {
          currentValue = latestData.v;
          lastUpdate = latestData.t;
        }
        historyCount = ds.buffer?.size || 0;
      } catch (error) {
        lcardsLog.debug('[LCARdSDataSourcePickerDialog] Error getting DataSource data:', error);
      }

      return {
        id: id,
        name: ds.cfg?.name || id,
        entity: ds.cfg?.entity || null,
        currentValue: currentValue,
        lastUpdate: lastUpdate,
        historyCount: historyCount
      };
    });

    lcardsLog.debug('[LCARdSDataSourcePickerDialog] Loaded DataSources:', this._dataSources.length);
  }

  /**
   * Get filtered DataSources based on search
   * @private
   */
  _getFilteredDataSources() {
    if (!this._searchFilter) {
      return this._dataSources;
    }

    const filter = this._searchFilter.toLowerCase();
    return this._dataSources.filter(ds => {
      const nameMatch = ds.name?.toLowerCase().includes(filter);
      const entityMatch = ds.entity?.toLowerCase().includes(filter);
      const idMatch = ds.id?.toLowerCase().includes(filter);
      return nameMatch || entityMatch || idMatch;
    });
  }

  /**
   * Generate unique DataSource name from entity ID
   * @private
   */
  _generateDataSourceName(entityId) {
    if (!entityId) return '';

    // Extract object_id from entity_id (e.g., sensor.temperature -> temperature)
    const parts = entityId.split('.');
    const baseName = parts[1] || parts[0] || 'datasource';

    // Add timestamp suffix for uniqueness
    const timestamp = Date.now();
    return `${baseName}_ds_${timestamp}`;
  }

  /**
   * Check if a name looks auto-generated
   * @private
   */
  _isAutoGeneratedName(name) {
    return /_ds_\d+$/.test(name);
  }

  /**
   * Format date/time for display
   * @private
   */
  _formatDateTime(dateStr) {
    if (!dateStr) return 'N/A';

    try {
      const date = new Date(dateStr);
      return date.toLocaleString();
    } catch (error) {
      return 'Invalid date';
    }
  }

  /**
   * Switch between browse and create modes
   * @private
   */
  _switchMode(mode) {
    this._mode = mode;
    // Reset selections when switching modes
    if (mode === 'browse') {
      this._selectedSource = this.currentSource || '';
    } else {
      this._selectedEntity = '';
      this._dataSourceName = '';
    }
  }

  /**
   * Handle search input
   * @private
   */
  _handleSearchInput(e) {
    this._searchFilter = e.target.value;
  }

  /**
   * Handle DataSource card click
   * @private
   */
  _handleDataSourceClick(dataSource) {
    this._selectedSource = dataSource.id;
    lcardsLog.debug('[LCARdSDataSourcePickerDialog] Selected DataSource:', dataSource.id);
  }

  /**
   * Handle entity selection
   * @private
   */
  _handleEntitySelect(e) {
    this._selectedEntity = e.detail.value;
    lcardsLog.debug('[LCARdSDataSourcePickerDialog] Selected entity:', this._selectedEntity);
  }

  /**
   * Handle name input
   * @private
   */
  _handleNameInput(e) {
    this._dataSourceName = e.target.value;
  }

  /**
   * Check if selection is valid
   * @private
   */
  _canSelect() {
    if (this._isCreating) {
      return false;
    }

    if (this._mode === 'browse') {
      return !!this._selectedSource;
    } else {
      return !!this._selectedEntity && !!this._dataSourceName;
    }
  }

  /**
   * Handle select button click
   * @private
   */
  async _handleSelect() {
    if (!this._canSelect()) {
      return;
    }

    let sourceId = null;

    if (this._mode === 'browse') {
      // Browse mode - use selected source
      sourceId = this._selectedSource;
      lcardsLog.info('[LCARdSDataSourcePickerDialog] Selected existing DataSource:', sourceId);
    } else {
      // Create mode - create new DataSource
      this._isCreating = true;
      sourceId = await this._createDataSource();
      this._isCreating = false;

      if (!sourceId) {
        lcardsLog.error('[LCARdSDataSourcePickerDialog] Failed to create DataSource');
        return;
      }

      lcardsLog.info('[LCARdSDataSourcePickerDialog] Created new DataSource:', sourceId);
    }

    // Fire source-selected event
    this.dispatchEvent(new CustomEvent('source-selected', {
      detail: { source: sourceId },
      bubbles: true,
      composed: true
    }));

    // Close dialog
    this.open = false;
    this._handleClose();
  }

  /**
   * Create new DataSource from selected entity
   * @private
   */
  async _createDataSource() {
    const dsManager = window.lcards?.core?.dataSourceManager;
    if (!dsManager) {
      lcardsLog.error('[LCARdSDataSourcePickerDialog] DataSourceManager not available');
      return null;
    }

    const config = {
      name: this._dataSourceName,
      entity: this._selectedEntity,
      attribute: '__state__',
      windowSeconds: 60,
      minEmitMs: 100,
      emitOnSameValue: true,
      history: {
        preload: false,
        hours: 1
      }
    };

    try {
      const ds = await dsManager.createDataSource(this._dataSourceName, config);
      lcardsLog.info('[LCARdSDataSourcePickerDialog] DataSource created successfully');
      return this._dataSourceName;
    } catch (error) {
      lcardsLog.error('[LCARdSDataSourcePickerDialog] Failed to create DataSource:', error);
      return null;
    }
  }

  /**
   * Handle cancel button
   * @private
   */
  _handleCancel() {
    this.open = false;
    this._handleClose();
  }

  /**
   * Handle dialog close
   * @private
   */
  _handleClose() {
    this.dispatchEvent(new CustomEvent('closed', {
      bubbles: true,
      composed: true
    }));
  }
}

customElements.define('lcards-datasource-picker-dialog', LCARdSDataSourcePickerDialog);
