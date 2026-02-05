/**
 * lcards-chart-series-list-editor.js
 * Chart series management component - SIMPLIFIED (no mode toggle)
 *
 * Features:
 * - Unified DataSource approach (all series are DataSources with series_N names)
 * - Entity picker + history slider for easy configuration
 * - Series-specific chart options (type, color, yaxis)
 * - Collapsible card UI
 */

import { LitElement, html, css, nothing } from 'lit';
import { lcardsLog } from '../../utils/lcards-logging.js';
import './shared/lcards-form-section.js';
import './shared/lcards-message.js';
import './shared/lcards-color-picker.js';

export class LCARdSChartSeriesListEditor extends LitElement {
  static get properties() {
    return {
      hass: { type: Object },
      config: { type: Object },
      _expandedIndex: { type: Number, state: true },
      _showDataSourceDialog: { type: Boolean, state: true },
      _currentSeriesIndex: { type: Number, state: true },
      _currentEditingDataSource: { type: String, state: true }
    };
  }

  static get styles() {
    return css`
      :host {
        display: block;
        width: 100%;
      }

      .series-container {
        display: flex;
        flex-direction: column;
        gap: 16px;
      }

      .add-series-container {
        display: flex;
        gap: 12px;
        margin-bottom: 8px;
      }

      .series-item {
        background: var(--card-background-color);
        border: 1px solid var(--divider-color);
        border-radius: var(--ha-card-border-radius, 12px);
        overflow: hidden;
      }

      .series-header {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 12px;
        cursor: pointer;
        user-select: none;
        background: var(--secondary-background-color);
      }

      .series-header:hover {
        background: var(--primary-background-color);
      }

      .series-icon {
        color: var(--primary-color);
        --mdc-icon-size: 24px;
      }

      .series-info {
        flex: 1;
        min-width: 0;
      }

      .series-title {
        font-weight: 500;
        font-size: 14px;
      }

      .series-details {
        font-size: 12px;
        color: var(--secondary-text-color);
        margin-top: 4px;
      }

      .series-actions {
        display: flex;
        gap: 4px;
      }

      .expand-icon {
        transition: transform 0.2s;
        --mdc-icon-size: 20px;
      }

      .expand-icon.expanded {
        transform: rotate(180deg);
      }

      .series-content {
        padding: 16px;
        border-top: 1px solid var(--divider-color);
        background: var(--card-background-color);
      }

      .form-row {
        margin-bottom: 16px;
      }

      .form-row:last-child {
        margin-bottom: 0;
      }

      .form-row-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 12px;
        margin-bottom: 16px;
      }

      .form-label {
        display: block;
        margin-bottom: 8px;
        font-weight: 500;
        font-size: 14px;
      }
    `;
  }

  constructor() {
    super();
    this.config = {};
    this._expandedIndex = null;
    this._showDataSourceDialog = false;
    this._currentSeriesIndex = null;
    this._currentEditingDataSource = null;
  }

  render() {
    const series = this._getSeriesList();
    lcardsLog.debug('[ChartSeriesListEditor] Rendering, series count:', series.length, 'expanded:', this._expandedIndex);

    return html`
      <div class="series-container">
        <!-- Add Series Button -->
        <div class="add-series-container">
          <ha-button @click=${() => this._addSeries()}>
            <ha-icon icon="mdi:plus" slot="icon"></ha-icon>
            Add Series
          </ha-button>
        </div>

        ${series.length === 0 ? html`
          <lcards-message type="info">
            No series configured. Click "Add Series" to get started.
          </lcards-message>
        ` : nothing}

        ${series.map((item, index) => this._renderSeriesItem(item, index, series.length))}
      </div>

      <!-- DataSource Creation/Edit Dialog (always rendered, controlled by .open) -->
      <lcards-datasource-studio-dialog
        .hass=${this.hass}
        .mode=${this._currentEditingDataSource ? 'edit' : 'add'}
        .sourceName=${this._currentEditingDataSource || ''}
        .sourceConfig=${this._currentEditingDataSource ? this.config?.data_sources?.[this._currentEditingDataSource] : null}
        .cardConfig=${this.config}
        .open=${this._showDataSourceDialog}
        @save=${this._handleDataSourceSaved}
        @cancel=${this._handleDataSourceDialogClosed}>
      </lcards-datasource-studio-dialog>
    `;
  }

  _renderSeriesItem(item, index, totalCount) {
    const isExpanded = this._expandedIndex === index;
    const title = item.name || `Series ${index + 1}`;
    const hours = (item.window_seconds || 3600) / 3600;

    // Show DataSource name or entity info
    let details;
    if (item.useExistingDataSource && item.existingDataSource) {
      details = `DataSource: ${item.existingDataSource} • ${hours}h history`;
    } else if (item.entity) {
      details = `${item.entity} • ${hours}h history`;
    } else {
      details = 'No entity selected';
    }

    return html`
      <div class="series-item">
        <div class="series-header" @click=${() => this._toggleExpanded(index)}>
          <ha-icon class="series-icon" icon="mdi:chart-line"></ha-icon>

          <div class="series-info">
            <div class="series-title">${title}</div>
            <div class="series-details">${details}</div>
          </div>

          <div class="series-actions">
            <ha-icon-button
              @click=${(e) => this._moveSeries(e, index, -1)}
              .label=${'Move Up'}
              .disabled=${index === 0}>
              <ha-icon icon="mdi:arrow-up"></ha-icon>
            </ha-icon-button>
            <ha-icon-button
              @click=${(e) => this._moveSeries(e, index, 1)}
              .label=${'Move Down'}
              .disabled=${index === totalCount - 1}>
              <ha-icon icon="mdi:arrow-down"></ha-icon>
            </ha-icon-button>
            <ha-icon-button
              @click=${(e) => this._deleteSeries(e, index)}
              .label=${'Delete'}>
              <ha-icon icon="mdi:delete"></ha-icon>
            </ha-icon-button>
          </div>

          <ha-icon
            class="expand-icon ${isExpanded ? 'expanded' : ''}"
            icon="mdi:chevron-down">
          </ha-icon>
        </div>

        ${isExpanded ? html`
          <div class="series-content">
            ${this._renderSeriesForm(item, index)}
          </div>
        ` : nothing}
      </div>
    `;
  }

  _renderSeriesForm(item, index) {
    const entity = item.entity || '';
    const attribute = item.attribute || 'state';
    const windowHours = (item.window_seconds || 3600) / 3600;
    const useExistingDataSource = item.useExistingDataSource || false;
    const existingDataSource = item.existingDataSource || '';

    // Get attribute options for selected entity
    const attributeOptions = entity && this.hass?.states[entity]
      ? Object.keys(this.hass.states[entity].attributes).map(attr => ({ value: attr, label: attr }))
      : [];
    attributeOptions.unshift({ value: 'state', label: 'State (default)' });

    // Check if DataSource is card-local (can edit) or global (read-only)
    const isCardLocalDs = existingDataSource && this.config?.data_sources?.[existingDataSource];
    const isGlobalDs = existingDataSource && !isCardLocalDs && window.lcards?.core?.dataSourceManager?.sources?.get(existingDataSource);

    return html`
      <!-- Data Source Selection -->
      <lcards-form-section header="Data Source" icon="mdi:database" ?expanded=${true}>
        <!-- Mode Toggle (at top for visibility) -->
        <div class="form-row">
          <ha-selector
            .hass=${this.hass}
            .selector=${{
              select: {
                options: [
                  { value: 'entity', label: '📊 New from Entity' },
                  { value: 'existing', label: '🔗 Use Existing DataSource' }
                ],
                mode: 'dropdown'
              }
            }}
            .value=${useExistingDataSource ? 'existing' : 'entity'}
            .label=${'Source Type'}
            @value-changed=${(e) => this._toggleDataSourceMode(index, e.detail.value === 'existing')}>
          </ha-selector>
          <div style="font-size: 12px; color: var(--secondary-text-color); margin-top: 6px;">
            ${useExistingDataSource
              ? 'Reference an existing DataSource with transformations/aggregations'
              : 'Create a simple series from an entity (auto-creates DataSource)'}
          </div>
        </div>

        ${!useExistingDataSource ? html`
          <!-- Entity Mode (Default) -->
          <div class="form-row">
            <ha-selector
              .hass=${this.hass}
              .selector=${{ entity: {} }}
              .value=${entity}
              .label=${'Entity'}
              .required=${true}
              @value-changed=${(e) => this._updateSeriesField(index, 'entity', e.detail.value)}>
            </ha-selector>
            ${!entity ? html`
              <div style="font-size: 12px; color: var(--error-color); margin-top: 6px;">
                ⚠️ Entity is required
              </div>
            ` : nothing}
          </div>

          ${entity ? html`
            <div class="form-row">
              <ha-selector
                .hass=${this.hass}
                .selector=${{ select: { options: attributeOptions } }}
                .value=${attribute}
                .label=${'Attribute'}
                @value-changed=${(e) => this._updateSeriesField(index, 'attribute', e.detail.value)}>
              </ha-selector>
              <div style="font-size: 12px; color: var(--secondary-text-color); margin-top: 6px;">
                Chart this entity attribute (default: state)
              </div>
            </div>
          ` : nothing}

          <div class="form-row">
            <label class="form-label">History Window: ${windowHours}h</label>
            <ha-selector
              .hass=${this.hass}
              .selector=${{ number: { min: 1, max: 168, step: 1, mode: 'slider', unit_of_measurement: 'hours' } }}
              .value=${windowHours}
              @value-changed=${(e) => this._updateSeriesField(index, 'window_seconds', e.detail.value * 3600, true)}>
            </ha-selector>
            <div style="font-size: 12px; color: var(--secondary-text-color); margin-top: 6px;">
              How far back to display data (1 hour to 7 days)
            </div>
          </div>
        ` : html`
          <!-- DataSource Mode -->
          <div class="form-row">
            <ha-selector
              .hass=${this.hass}
              .selector=${{ select: { options: this._getDataSourceOptions(), mode: 'dropdown' } }}
              .value=${existingDataSource}
              .label=${'DataSource'}
              .required=${true}
              @value-changed=${(e) => this._updateSeriesField(index, 'existingDataSource', e.detail.value, true)}>
            </ha-selector>
            ${!existingDataSource ? html`
              <div style="font-size: 12px; color: var(--error-color); margin-top: 6px;">
                ⚠️ DataSource is required - select one or create new
              </div>
            ` : nothing}
          </div>

          <div class="form-row" style="display: flex; gap: 8px; align-items: center;">
            <ha-button @click=${() => this._openDataSourceDialog(index)}>
              <ha-icon icon="mdi:plus" slot="icon"></ha-icon>
              Create New
            </ha-button>
            <ha-button
              .disabled=${!isCardLocalDs}
              @click=${() => this._editDataSource(existingDataSource)}>
              <ha-icon icon="mdi:pencil" slot="icon"></ha-icon>
              Edit DataSource
            </ha-button>
            ${isGlobalDs ? html`
              <div style="font-size: 12px; color: var(--secondary-text-color);">
                🌐 Global (read-only)
              </div>
            ` : nothing}
          </div>
        `}
      </lcards-form-section>

      <!-- Series Options -->
      <lcards-form-section header="Series Options" icon="mdi:palette" ?expanded=${true}>
        <div class="form-row">
          <ha-selector
            .hass=${this.hass}
            .selector=${{ text: {} }}
            .value=${item.name || ''}
            .label=${'Series Name (optional)'}
            @value-changed=${(e) => this._updateSeriesField(index, 'name', e.detail.value)}>
          </ha-selector>
        </div>

        ${useExistingDataSource && existingDataSource ? html`
          <!-- Buffer Selection (main buffer or processor buffers) -->
          <div class="form-row">
            <ha-selector
              .hass=${this.hass}
              .selector=${{ select: { options: this._getBufferOptions(existingDataSource), mode: 'dropdown' } }}
              .value=${item.buffer || 'main'}
              .label=${'Buffer / Data Type'}
              @value-changed=${(e) => this._updateSeriesField(index, 'buffer', e.detail.value)}>
            </ha-selector>
            <div style="font-size: 12px; color: var(--secondary-text-color); margin-top: 6px;">
              ${this._getBufferHelpText(item.buffer || 'main', existingDataSource)}
            </div>
          </div>
        ` : nothing}

        <div class="form-row-grid">
          <div class="form-row">
            <ha-selector
              .hass=${this.hass}
              .selector=${{
                select: {
                  options: [
                    { value: 'line', label: 'Line' },
                    { value: 'area', label: 'Area' },
                    { value: 'bar', label: 'Bar' },
                    { value: 'scatter', label: 'Scatter' }
                  ]
                }
              }}
              .value=${item.type || 'line'}
              .label=${'Type'}
              @value-changed=${(e) => this._updateSeriesField(index, 'type', e.detail.value)}>
            </ha-selector>
          </div>
        </div>

        <!-- Color removed: ApexCharts uses global style.colors.series array which cycles through series -->

        <div class="form-row">
          <ha-selector
            .hass=${this.hass}
            .selector=${{ number: { min: 0, max: 5, mode: 'box' } }}
            .value=${item.yaxis || 0}
            .label=${'Y-Axis Index'}
            @value-changed=${(e) => this._updateSeriesField(index, 'yaxis', e.detail.value)}>
          </ha-selector>
          <div style="font-size: 12px; color: var(--secondary-text-color); margin-top: 6px;">
            Use different y-axes for multiple scales (0 = default)
          </div>
        </div>
      </lcards-form-section>
    `;
  }

  // ============================================================================
  // HELPER METHODS
  // ============================================================================

  _getSeriesList() {
    const sources = this.config?.sources || [];
    const dataSources = this.config?.data_sources || {};

    lcardsLog.debug('[ChartSeriesListEditor] _getSeriesList called', {
      sourcesCount: sources.length,
      sources: sources,
      dataSourcesKeys: Object.keys(dataSources)
    });

    return sources.map((sourceConfig, index) => {
      // Handle both string and object source formats
      const sourceName = typeof sourceConfig === 'string' ? sourceConfig : sourceConfig.datasource;
      const buffer = typeof sourceConfig === 'object' ? sourceConfig.buffer : 'main';

      lcardsLog.debug(`[ChartSeriesListEditor] Processing source ${index}`, { sourceName, buffer, sourceConfig });

      // Check card-local datasources first
      let dsConfig = dataSources[sourceName];

      // If not found locally, check global datasources
      let isGlobal = false;
      if (!dsConfig) {
        const globalSource = window.lcards?.core?.dataSourceManager?.sources?.get(sourceName);
        lcardsLog.debug(`[ChartSeriesListEditor] Looking up global datasource '${sourceName}'`, {
          found: !!globalSource,
          hasCfg: !!globalSource?.cfg,
          cfgKeys: globalSource?.cfg ? Object.keys(globalSource.cfg) : [],
          sourceKeys: globalSource ? Object.keys(globalSource) : []
        });
        if (globalSource) {
          dsConfig = globalSource.cfg;
          isGlobal = true;
        }
      }

      if (!dsConfig) {
        lcardsLog.warn(`[ChartSeriesListEditor] No config found for datasource '${sourceName}'`, {
          checkedLocal: !!dataSources[sourceName],
          checkedGlobal: isGlobal,
          globalSourceExists: !!window.lcards?.core?.dataSourceManager?.sources?.get(sourceName)
        });
        return {
          useExistingDataSource: false,
          existingDataSource: '',
          entity: '',
          attribute: 'state',
          window_seconds: 3600,
          name: '',
          type: 'line',
          yaxis: 0,
          buffer: 'main'
        };
      }

      // Detect mode: is this an existing DataSource reference or a series_N?
      const isSeriesN = /^series_\d+$/.test(sourceName);
      const useExistingDataSource = !isSeriesN || isGlobal;

      lcardsLog.debug(`[ChartSeriesListEditor] Mode detection for '${sourceName}'`, {
        isSeriesN,
        isGlobal,
        useExistingDataSource,
        dsConfigEntity: dsConfig?.entity
      });

      const hours = dsConfig.history?.hours || ((dsConfig.window_seconds || 3600) / 3600);
      return {
        useExistingDataSource,
        existingDataSource: useExistingDataSource ? sourceName : '',
        // Only populate entity/attribute fields for entity mode (series_N DataSources)
        entity: isSeriesN && !isGlobal ? (dsConfig.entity || '') : '',
        attribute: isSeriesN && !isGlobal ? (dsConfig.attribute || 'state') : 'state',
        window_seconds: hours * 3600,
        name: dsConfig.name || '',
        type: dsConfig.type || 'line',
        yaxis: dsConfig.yaxis || 0,
        buffer: buffer || 'main'
      };
    });
  }

  _toggleExpanded(index) {
    this._expandedIndex = this._expandedIndex === index ? null : index;
  }

  _addSeries() {
    lcardsLog.debug('[ChartSeriesListEditor] _addSeries called');
    const series = this._getSeriesList();
    lcardsLog.debug('[ChartSeriesListEditor] Current series count:', series.length);

    series.push({
      useExistingDataSource: false,
      existingDataSource: '',
      entity: '',
      attribute: 'state',
      window_seconds: 3600,
      name: '',
      type: 'line',
      yaxis: 0
    });

    lcardsLog.debug('[ChartSeriesListEditor] After push, series count:', series.length);
    this._updateConfig(series);
    this._expandedIndex = series.length - 1;
    lcardsLog.info('[ChartSeriesListEditor] Added series, expanded index:', this._expandedIndex);
  }

  _deleteSeries(event, index) {
    event.stopPropagation();
    const series = this._getSeriesList();
    series.splice(index, 1);

    if (this._expandedIndex === index) {
      this._expandedIndex = null;
    } else if (this._expandedIndex > index) {
      this._expandedIndex--;
    }

    this._updateConfig(series);
    lcardsLog.info('[ChartSeriesListEditor] Deleted series:', { index });
  }

  _moveSeries(event, index, direction) {
    event.stopPropagation();
    const series = this._getSeriesList();
    const newIndex = index + direction;

    if (newIndex < 0 || newIndex >= series.length) return;

    const [item] = series.splice(index, 1);
    series.splice(newIndex, 0, item);

    if (this._expandedIndex === index) {
      this._expandedIndex = newIndex;
    } else if (this._expandedIndex === newIndex) {
      this._expandedIndex = index;
    }

    this._updateConfig(series);
    lcardsLog.info('[ChartSeriesListEditor] Moved series:', { from: index, to: newIndex });
  }

  _updateSeriesField(index, field, value, immediate = false) {
    lcardsLog.debug(`[ChartSeriesListEditor] _updateSeriesField called`, {
      index,
      field,
      value,
      immediate
    });

    const series = this._getSeriesList();
    series[index][field] = value;

    if (immediate) {
      this._updateConfig(series);
    } else {
      clearTimeout(this._updateTimeout);
      this._updateTimeout = setTimeout(() => {
        this._updateConfig(series);
      }, 300);
    }
  }

  _updateConfig(series) {
    lcardsLog.info('[ChartSeriesListEditor] _updateConfig called', {
      seriesCount: series.length,
      series: series.map(s => ({
        useExistingDataSource: s.useExistingDataSource,
        existingDataSource: s.existingDataSource,
        entity: s.entity,
        buffer: s.buffer
      }))
    });

    const newConfig = { ...this.config };
    newConfig.data_sources = newConfig.data_sources || {};

    // FIRST: Clean up ALL placeholders before doing anything else
    Object.keys(newConfig.data_sources).forEach(dsName => {
      if (dsName.includes('_placeholder')) {
        lcardsLog.debug('[ChartSeriesListEditor] Removing placeholder DataSource:', dsName);
        delete newConfig.data_sources[dsName];
      }
    });

    // Clean up any transient series_N datasources that shouldn't be in config
    if (this._seriesItems && Array.isArray(this._seriesItems)) {
      Object.keys(newConfig.data_sources).forEach(dsName => {
        if (dsName.match(/^series_\d+$/) && !this._seriesItems.some(item => {
          const sourceName = item.useExistingDataSource ? item.existingDataSource : `series_${this._seriesItems.indexOf(item) + 1}`;
          return sourceName === dsName;
        })) {
          lcardsLog.debug('[ChartSeriesListEditor] Removing orphaned series DataSource:', dsName);
          delete newConfig.data_sources[dsName];
        }
      });
    }

    // Get global DataSource names to avoid conflicts
    const globalDataSourcesMap = window.lcards?.core?.dataSourceManager?.sources;
    const globalNames = new Set();

    // Iterate Map to build Set of global datasource names
    if (globalDataSourcesMap && globalDataSourcesMap instanceof Map) {
      globalDataSourcesMap.forEach((source, name) => {
        globalNames.add(name);
      });
    }

    // Find next available series_N number (check both card-local and global)
    let nextNumber = 1;
    const existingNumbers = Object.keys(newConfig.data_sources)
      .filter(name => name.match(/^series_\d+$/))
      .map(name => parseInt(name.match(/^series_(\d+)$/)[1]));

    // Also check global for series_N names
    globalNames.forEach(name => {
      const match = name.match(/^series_(\d+)$/);
      if (match) {
        existingNumbers.push(parseInt(match[1]));
      }
    });

    // Clean up unused series_N DataSources
    Object.keys(newConfig.data_sources).forEach(dsName => {
      // Clean up series_N DataSources that are no longer referenced
      if (dsName.match(/^series_\d+$/)) {
        const stillUsed = series.some(s => s._sourceName === dsName);
        if (!stillUsed) {
          lcardsLog.debug('[ChartSeriesListEditor] Removing unused series_N DataSource:', dsName);
          delete newConfig.data_sources[dsName];
        }
      }
    });

    // Create/update DataSources for each series
    newConfig.sources = [];
    series.forEach((item, index) => {
      let sourceName;

      // Ensure boolean for condition (undefined should be false)
      const useExistingDataSource = item.useExistingDataSource === true;

      if (useExistingDataSource) {
        // Mode 1: Using existing DataSource
        if (!item.existingDataSource) {
          // User toggled to DataSource mode but hasn't selected one yet
          // Create a placeholder so the series stays visible in UI
          lcardsLog.debug('[ChartSeriesListEditor] Series in DataSource mode but no DataSource selected - creating placeholder');
          sourceName = `series_${index + 1}_placeholder`;
          newConfig.data_sources[sourceName] = {
            entity: '',
            attribute: 'state',
            history: { preload: true, hours: 1 },
            name: `Series ${index + 1}`,
            type: 'line',
            yaxis: 0
          };
          newConfig.sources.push(sourceName);
          return;
        }

        sourceName = item.existingDataSource;

        // Validate: DataSource must exist (check both card-local and global)
        const existsInCardLocal = !!newConfig.data_sources[sourceName];
        const existsInGlobal = globalNames.has(sourceName);

        if (!existsInCardLocal && !existsInGlobal) {
          lcardsLog.warn('[ChartSeriesListEditor] DataSource not found:', sourceName, {
            checkedCardLocal: existsInCardLocal,
            checkedGlobal: existsInGlobal,
            globalNamesCount: globalNames.size
          });
        }

        // Don't modify global DataSources - only card-local
        if (newConfig.data_sources[sourceName]) {
          // Update card-local DataSource with chart-specific options
          newConfig.data_sources[sourceName] = {
            ...newConfig.data_sources[sourceName],
            name: item.name || newConfig.data_sources[sourceName].name || `Series ${index + 1}`,
            type: item.type || newConfig.data_sources[sourceName].type || 'line',
            yaxis: item.yaxis || 0
          };
        }
        // If it's a global DataSource, just reference it (don't create card-local copy)
      } else {
        // Mode 2: Entity picker mode - create series_N DataSource

        // Log warning but still create the series (user needs to configure it)
        if (!item.entity || item.entity.trim() === '') {
          lcardsLog.debug('[ChartSeriesListEditor] Creating series with empty entity - user needs to configure');
        }

        // Find next available series_N number
        while (existingNumbers.includes(nextNumber) || globalNames.has(`series_${nextNumber}`)) {
          nextNumber++;
        }
        sourceName = `series_${nextNumber}`;
        existingNumbers.push(nextNumber);
        nextNumber++;

        // Create/update the series_N DataSource
        newConfig.data_sources[sourceName] = {
          entity: item.entity,
          attribute: item.attribute || 'state',
          history: {
            preload: true,
            hours: Math.round((item.window_seconds || 3600) / 3600)
          },
          name: item.name || `Series ${index + 1}`,
          type: item.type || 'line',
          yaxis: item.yaxis || 0
        };
      }

      // Build sources entry (string or object depending on buffer selection)
      if (useExistingDataSource && item.buffer && item.buffer !== 'main') {
        // Object format with buffer selector
        newConfig.sources.push({
          datasource: sourceName,
          buffer: item.buffer
        });
      } else {
        // Simple string format (backward compatible)
        newConfig.sources.push(sourceName);
      }
    });

    lcardsLog.info('[ChartSeriesListEditor] Emitting config', {
      sourcesCount: newConfig.sources.length,
      sources: newConfig.sources,
      dataSourcesKeys: Object.keys(newConfig.data_sources)
    });

    // Clean up empty data_sources object before emitting
    if (Object.keys(newConfig.data_sources).length === 0) {
      delete newConfig.data_sources;
      lcardsLog.debug('[ChartSeriesListEditor] Removed empty data_sources object');
    }

    this.dispatchEvent(new CustomEvent('config-changed', {
      detail: { config: newConfig },
      bubbles: true,
      composed: true
    }));

    this.requestUpdate();
  }

  _getDataSourceOptions() {
    const options = [];

    // Safety check
    if (!this.config) {
      return [{ value: '', label: 'No configuration available' }];
    }

    // Card-local DataSources (exclude series_N and placeholders - those are auto-generated)
    const cardSources = this.config?.data_sources || {};
    Object.keys(cardSources).forEach(name => {
      // Skip auto-generated series_N DataSources
      if (name.match(/^series_\d+$/)) return;
      // Skip placeholder DataSources
      if (name.includes('_placeholder')) return;

      options.push({
        value: name,
        label: `📍 ${name} (card-local)`
      });
    });

    // Global DataSources - with safety check
    try {
      const globalSources = window.lcards?.core?.dataSourceManager?.sources;
      if (globalSources && globalSources instanceof Map) {
        globalSources.forEach((source, name) => {
          // Skip auto-generated series_N DataSources
          if (name.match(/^series_\d+$/)) return;
          // Skip placeholder DataSources
          if (name.includes('_placeholder')) return;
          // Skip if it's actually a card-local datasource (already listed above)
          if (cardSources[name]) return;

          options.push({
            value: name,
            label: `🌐 ${name} (global)`
          });
        });
      }
    } catch (error) {
      lcardsLog.warn('[ChartSeriesListEditor] Failed to get global datasources:', error);
    }

    return options.length > 0 ? options : [{ value: '', label: 'No DataSources available' }];
  }

  _toggleDataSourceMode(index, useExisting) {
    const series = this._getSeriesList();

    lcardsLog.info(`[ChartSeriesListEditor] Toggling datasource mode`, {
      index,
      useExisting,
      currentMode: series[index]?.useExistingDataSource
    });

    series[index].useExistingDataSource = useExisting;

    if (useExisting) {
      // Switching to DataSource mode - clear entity fields
      series[index].entity = '';
      series[index].attribute = 'state';
    } else {
      // Switching to entity mode - clear DataSource reference
      series[index].existingDataSource = '';
      series[index].buffer = 'main'; // Reset buffer to main
    }

    this._updateConfig(series);
    this.requestUpdate(); // Force UI update
  }

  _editDataSource(dsName) {
    // Open DataSource Studio dialog for editing existing card-local DataSource
    lcardsLog.debug('[ChartSeriesListEditor] Opening DataSource editor for:', dsName);
    this._currentEditingDataSource = dsName;
    this._currentSeriesIndex = null; // Clear series index (we're editing, not creating)
    this._showDataSourceDialog = true;
    this.requestUpdate();
  }

  _openDataSourceDialog(index) {
    lcardsLog.debug('[ChartSeriesListEditor] Opening DataSource creator for series:', index);
    this._currentSeriesIndex = index;
    this._currentEditingDataSource = null; // Clear editing (we're creating, not editing)
    this._showDataSourceDialog = true;
    this.requestUpdate();
  }

  _handleDataSourceDialogClosed() {
    lcardsLog.debug('[ChartSeriesListEditor] DataSource dialog closed');

    // Clean up any incomplete series (empty entity and no DataSource selected)
    const series = this._getSeriesList();
    const cleanedSeries = series.filter((item, index) => {
      // Keep series that have either an entity OR a selected DataSource
      const hasEntity = item.entity && item.entity.trim() !== '';
      const hasDataSource = item.useExistingDataSource === true && item.existingDataSource && item.existingDataSource.trim() !== '' && !item.existingDataSource.endsWith('_placeholder');

      if (!hasEntity && !hasDataSource) {
        lcardsLog.debug('[ChartSeriesListEditor] Removing incomplete series at index:', index);
        return false; // Filter out
      }
      return true; // Keep
    });

    // If we removed any incomplete series, update config
    if (cleanedSeries.length !== series.length) {
      this._updateConfig(cleanedSeries);
      // Adjust expanded index if needed
      if (this._expandedIndex >= cleanedSeries.length) {
        this._expandedIndex = cleanedSeries.length > 0 ? cleanedSeries.length - 1 : null;
      }
    }

    this._showDataSourceDialog = false;
    this._currentSeriesIndex = null;
    this._currentEditingDataSource = null;
    this.requestUpdate(); // Force re-render so dialog can be opened again
  }

  _handleDataSourceSaved(event) {
    const { name, config } = event.detail;
    lcardsLog.debug('[ChartSeriesListEditor] DataSource saved:', { name, config });

    // Add/update DataSource in config
    const updatedDataSources = {
      ...(this.config.data_sources || {}),
      [name]: config
    };

    // If creating for a specific series, update sources array directly
    if (this._currentSeriesIndex !== null) {
      const sources = [...(this.config.sources || [])];
      sources[this._currentSeriesIndex] = name; // Just set the DataSource name

      // Clean up unused series_N and placeholder DataSources
      Object.keys(updatedDataSources).forEach(dsName => {
        if (dsName.match(/^series_\d+$/) || dsName.endsWith('_placeholder')) {
          const stillUsed = sources.includes(dsName);
          if (!stillUsed) {
            lcardsLog.debug('[ChartSeriesListEditor] Removing unused DataSource:', dsName);
            delete updatedDataSources[dsName];
          }
        }
      });

      // Fire single config update
      this.dispatchEvent(new CustomEvent('config-changed', {
        detail: {
          config: {
            ...this.config,
            data_sources: updatedDataSources,
            sources
          }
        },
        bubbles: true,
        composed: true
      }));
    } else {
      // Just fire config-changed for the DataSource update (edit mode)
      this.dispatchEvent(new CustomEvent('config-changed', {
        detail: {
          config: {
            ...this.config,
            data_sources: updatedDataSources
          }
        },
        bubbles: true,
        composed: true
      }));
    }

    // Close dialog and clear state
    this._showDataSourceDialog = false;
    this._currentSeriesIndex = null;
    this._currentEditingDataSource = null;
  }

  /**
   * Get buffer options for a DataSource
   * @private
   * @param {string} dataSourceName - Name of the DataSource
   * @returns {Array} Array of {value, label} options
   */
  _getBufferOptions(dataSourceName) {
    const options = [
      { value: 'main', label: '📊 Main Buffer (Raw Data)' }
    ];

    // Safety checks
    if (!dataSourceName || !this.config) {
      return options;
    }

    // Get DataSource config - check card-local first, then global
    let dsConfig = this.config?.data_sources?.[dataSourceName];

    // If not found locally, check if it's a global datasource
    if (!dsConfig) {
      const globalSource = window.lcards?.core?.dataSourceManager?.sources?.get(dataSourceName);
      if (globalSource) {
        dsConfig = globalSource.cfg;
      }
    }

    if (!dsConfig) {
      return options;
    }

    // Add processor options from unified processing pipeline
    if (dsConfig.processing && typeof dsConfig.processing === 'object') {
      try {
        Object.entries(dsConfig.processing).forEach(([key, config]) => {
          const type = config?.type || 'unknown';

          // Determine icon based on processor type
          let icon = '🔧'; // Default processor icon
          if (['smooth', 'convert_unit', 'scale', 'expression', 'round', 'clamp', 'delta', 'threshold'].includes(type)) {
            icon = '🔄'; // Transform-like processors
          } else if (['statistics', 'rate', 'trend', 'duration'].includes(type)) {
            icon = '📈'; // Analysis processors
          }

          options.push({
            value: key,
            label: `${icon} ${key} (${type})`
          });
        });
      } catch (error) {
        lcardsLog.warn('[ChartSeriesListEditor] Error processing buffer options:', error);
      }
    }

    return options;
  }

  /**
   * Get help text for buffer selection
   * @private
   * @param {string} bufferValue - Selected buffer value
   * @param {string} dataSourceName - DataSource name
   * @returns {string} Help text
   */
  _getBufferHelpText(bufferValue, dataSourceName) {
    // Ensure we always return a string
    if (!bufferValue) {
      return 'Select a buffer';
    }

    if (bufferValue === 'main') {
      return 'Historical raw sensor data from main buffer';
    }

    const dsConfig = this.config?.data_sources?.[dataSourceName];
    if (!dsConfig) {
      return 'DataSource not found';
    }

    const processor = dsConfig?.processing?.[bufferValue];
    if (!processor) {
      return `Processor '${bufferValue}' not found`;
    }

    const type = processor.type || 'unknown';
    const from = processor.from ? ` (from: ${processor.from})` : '';

    // Provide type-specific help text
    const typeHelp = {
      'convert_unit': `Unit conversion: ${processor.from || '?'} → ${processor.to || '?'}`,
      'smooth': `Smoothed data using ${processor.method || 'default'} method`,
      'scale': `Scaled values to range ${JSON.stringify(processor.output_range || [0, 1])}`,
      'statistics': `Statistics: ${processor.stats?.join(', ') || 'various'} over ${processor.window || 'window'}`,
      'expression': 'Custom expression calculation',
      'rate': `Rate of change (${processor.unit || 'per second'})`,
      'trend': 'Trend detection (increasing/decreasing/stable)',
      'duration': 'Duration tracking for condition',
      'threshold': `Threshold comparison at ${processor.threshold}`,
      'clamp': `Clamped to ${processor.min || '-∞'} - ${processor.max || '∞'}`,
      'round': `Rounded to ${processor.precision || 0} decimal places`,
      'delta': 'Change from previous value'
    };

    return typeHelp[type] || `Processor type: ${type}${from}`;
  }
}

customElements.define('lcards-chart-series-list-editor', LCARdSChartSeriesListEditor);
