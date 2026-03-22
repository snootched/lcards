/**
 * LCARdS Chart Card
 *
 * Data visualization using ApexCharts library (already bundled).
 * Supports real-time and historical data via the unified DataSource + ProcessorManager pipeline.
 *
 * Features:
 * - Real-time data updates via DataSourceManager
 * - Multiple chart types (line, area, bar, column, pie, donut, scatter, radar, etc.)
 * - Theme token integration via resolveThemeTokensRecursive
 * - Rules-engine dynamic styling
 * - Per-series processor buffer selection (main buffer or any processor output)
 * - Full ApexCharts style control via nested style config
 *
 * @example Basic Usage
 * ```yaml
 * type: custom:lcards-chart
 * chart_type: line
 * sources:
 *   - my_temp_sensor
 * data_sources:
 *   my_temp_sensor:
 *     entity: sensor.temperature
 *     history:
 *       preload: true
 *       hours: 24
 * ```
 *
 * @example Multi-Series with Processor Buffer
 * ```yaml
 * type: custom:lcards-chart
 * chart_type: line
 * sources:
 *   - temp_ds
 *   - datasource: temp_ds
 *     buffer: smoothed
 * data_sources:
 *   temp_ds:
 *     entity: sensor.temperature
 *     history:
 *       preload: true
 *       hours: 24
 *     processing:
 *       smoothed:
 *         type: smooth
 *         method: moving_average
 *         window: 5
 * ```
 *
 * Buffer selector format (in sources array objects):
 * - Omit or 'main': Main RollingBuffer (raw historical data)
 * - 'processorKey': Output buffer from a processor defined in processing.*
 */

import { html, css, svg } from 'lit';
import { LCARdSCard } from '../base/LCARdSCard.js';
import { lcardsLog } from '../utils/lcards-logging.js';
import ApexCharts from 'apexcharts';
import { ApexChartsAdapter } from '../charts/ApexChartsAdapter.js';
import { resolveThemeTokensRecursive } from '../utils/lcards-theme.js';
import { getChartSchema } from './schemas/chart-schema.js';
// Import chart editor for GUI editing
import '../editor/cards/lcards-chart-editor.js';

export class LCARdSChart extends LCARdSCard {
  static CARD_TYPE = 'chart';

  static get properties() {
    return {
      ...super.properties,
      _chartReady: { type: Boolean, state: true },
      _chartData: { type: Array, state: true }
    };
  }

  static get styles() {
    return [
      super.styles,
      css`
        :host {
          display: block;
          width: 100%;
          height: 100%;
          min-height: 200px;
        }

        .lcards-card-container {
          width: 100%;
          height: 100%;
          background: transparent;
        }

        .chart-container {
          width: 100%;
          height: 100%;
          position: relative;
        }

        .chart-loading {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 100%;
          height: 100%;
          color: var(--primary-text-color, var(--lcards-moonlight, #d3d3d3));
          font-size: 14px;
        }

        .chart-error {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 100%;
          height: 100%;
          color: var(--error-color, #ff0000);
          font-size: 14px;
          text-align: center;
          padding: 20px;
        }
      `
    ];
  }

  /**
   * Tell Home Assistant how much grid space this card needs
   * @returns {number} Number of grid rows (50px per row)
   */
  getCardSize() {
    // _configPx returns null for relative/viewport units so they don't produce
    // a wrong row count — those cases fall through to the 200px default.
    return Math.ceil((this._configPx(this.config.height) || 200) / 50);
  }

  constructor() {
    super();
    this._chart = null;
    this._chartReady = false;
    this._chartData = [];
    this._dataSubscriptions = [];
    this._chartOptions = null;
    this._error = null;
    this._chartInitialized = false; // Track if we've tried to initialize
    this._registeredDataSources = new Set(); // Track datasources for cleanup
    /** @type {string[]|undefined} */
    this._seriesNames = undefined;
  }

  /**
   * Handle first update - initialize chart
   * @protected
   */
  async _handleFirstUpdate() {
    // Note: LCARdSCard doesn't implement _handleFirstUpdate, don't call super

    // Re-detect preview mode now that we're in the DOM
    // Need to check shadow DOM boundaries too
    const isInCardPicker = this._checkForAncestor(['hui-card-picker', 'hui-card-preview']);
    const isInEditDialog = this._checkForAncestor(['hui-dialog-edit-card', 'hui-dialog-create-card']);
    const isInStudioDialog = this._checkForAncestor(['lcards-chart-studio-dialog', 'lcards-data-grid-studio-dialog-v4']);
    const isPreview = isInCardPicker || isInEditDialog || isInStudioDialog || this._isPreviewMode;

    lcardsLog.debug('[LCARdSChart] Preview detection in _handleFirstUpdate:', {
      isInCardPicker,
      isInEditDialog,
      isInStudioDialog,
      isPreviewFromNativeCard: this._isPreviewMode,
      finalDecision: isPreview,
      hasParent: !!this.parentElement,
      parentTag: this.parentElement?.tagName,
      parentClass: this.parentElement?.className,
      hasSource: !!(this.config.source || this.config.data_source || this.config.sources)
    });

    // Register with RulesEngine
    const overlayId = this.config.id || `chart-${this._cardGuid}`;
    this._registerOverlayForRules(overlayId, 'chart', this.config.tags || []);

    // Skip data source subscription and chart init in preview mode UNLESS in studio dialog (live preview)
    if (isPreview && !isInStudioDialog) {
      lcardsLog.debug('[LCARdSChart] Preview mode detected - skipping data source subscription and chart initialization');
      this._chartReady = true; // Mark as "ready" to show preview
      this._isPreviewMode = true; // Update flag for render
      return;
    }

    // Studio dialog: allow full chart initialization for live preview
    if (isInStudioDialog) {
      lcardsLog.debug('[LCARdSChart] Studio dialog detected - allowing full chart initialization for live preview');
      this._isPreviewMode = false; // CRITICAL: Override any preview detection from parent
    }

    // Wait for config processing to complete (includes data_sources creation)
    if (this._configProcessingPromise) {
      lcardsLog.trace('[LCARdSChart] Waiting for config processing to complete...');
      await this._configProcessingPromise;
      lcardsLog.trace('[LCARdSChart] Config processing complete, continuing with subscription');
    }

    // Subscribe to data sources (may auto-create them)
    await this._subscribeToDataSources();

    // Note: Chart initialization now happens in updated() after container is rendered
  }

  /**
   * Called after every render - initialize chart when container is ready
   * @public
   */
  updated(changedProperties) {
    super.updated(changedProperties);

    // Only initialize once, after data is ready, when not in preview mode
    if (this._chartInitialized || this._isPreviewMode) {
      return;
    }

    // Wait until at least one series has data before initializing
    const hasAnyData = Array.isArray(this._chartData) &&
      this._chartData.some(d => Array.isArray(d) && d.length > 0);
    if (!hasAnyData) {
      return;
    }

    // Get the container and check if it has dimensions
    const container = /** @type {HTMLElement|null} */ (this.renderRoot.querySelector('.chart-container'));
    if (!container) {
      return;
    }

    const width = container.offsetWidth || container.clientWidth;
    const height = container.offsetHeight || container.clientHeight;

    // Only initialize if container has actual dimensions
    if (width > 0 && height > 0) {
      this._chartInitialized = true;
      this._initializeChart();
    }
  }

  /**
   * Check for ancestor element, traversing shadow DOM boundaries
   * @private
   */
  _checkForAncestor(selectors) {
    let current = /** @type {Element | null} */ (this);
    const maxLevels = 20;

    for (let i = 0; i < maxLevels && current; i++) {
      // Check if current element matches
      for (const selector of selectors) {
        if (current.tagName && current.tagName.toLowerCase() === selector.toLowerCase()) {
          return true;
        }
      }

      // Move up: try parentElement first, then host (shadow DOM)
      current = current.parentElement || /** @type {ShadowRoot} */ (current.parentNode)?.host || /** @type {ShadowRoot} */ (current.getRootNode())?.host;
    }

    return false;
  }

  /**
   * Called when rules produce style patches
   * @protected
   */
  _onRulePatchesChanged() {
    if (this._chart && this._chartReady) {
      this._updateChartOptions();
    }
  }

  /**
   * Extract data from the selected buffer.
   * Supports main RollingBuffer or any processor output buffer by key.
   *
   * @private
   * @param {Object} data - DataSource emission object with {buffer: RollingBuffer, ...}
   * @param {Object} dataSourceRef - Reference to the actual DataSource instance
   * @param {string|null} bufferSelector - 'main' (or falsy) for raw history, or a processor key
   * @returns {Array} Array of {t, v} data points
   */
  _getBufferData(data, dataSourceRef, bufferSelector) {
    // Main (raw historical) buffer
    if (!bufferSelector || bufferSelector === 'main') {
      return data.buffer.getAll();
    }

    // Processor buffer: use the last segment so 'type.key' notation still resolves the key
    const key = bufferSelector.split('.').pop();

    if (dataSourceRef?.processorManager?.processorBuffers?.has(key)) {
      const processorBuffer = dataSourceRef.processorManager.processorBuffers.get(key);
      const bufferData = processorBuffer.getAll();
      lcardsLog.debug(`[LCARdSChart] Using processor buffer: ${key} (${bufferData.length} points)`);
      return bufferData;
    }

    lcardsLog.warn(`[LCARdSChart] Buffer not found: '${bufferSelector}', falling back to main buffer`);
    return data.buffer.getAll();
  }

  /**
   * Subscribe to data sources for live updates
   * Auto-creates data sources if they don't exist (for standalone usage)
   * @private
   */
  async _subscribeToDataSources() {
    if (!this._singletons?.dataSourceManager) {
      lcardsLog.warn('[LCARdSChart] DataSourceManager not available');
      return;
    }

    // Get source(s)
    const sourceRef = this.config.source || this.config.data_source || this.config.sources;
    if (!sourceRef) {
      lcardsLog.warn('[LCARdSChart] No data source configured');
      return;
    }

    const sources = Array.isArray(sourceRef) ? sourceRef : [sourceRef];

    // Subscribe to each source (auto-create if needed)
    for (let index = 0; index < sources.length; index++) {
      const sourceConfig = sources[index];

      // Extract datasource ID from config (can be string or object)
      const sourceId = typeof sourceConfig === 'string' ? sourceConfig : (sourceConfig.datasource || sourceConfig.id || sourceConfig.name);

      if (!sourceId) {
        lcardsLog.warn(`[LCARdSChart] Invalid source config at index ${index}:`, sourceConfig);
        continue;
      }

      // Try to get existing data source
      let dataSource = this._singletons.dataSourceManager.getSource(sourceId);

      // Auto-create if doesn't exist
      if (!dataSource) {
        lcardsLog.debug(`[LCARdSChart] Auto-creating data source: ${sourceId}`);

        try {
          // Check if sourceId looks like an entity ID (domain.entity_name)
          const isEntityId = /^[a-z_]+\.[a-z0-9_]+$/.test(sourceId);

          if (!isEntityId) {
            lcardsLog.warn(`[LCARdSChart] Invalid source reference: ${sourceId} (must be entity ID or configured data source)`);
            continue;
          }

          // Create data source with history enabled for charts
          dataSource = await this._singletons.dataSourceManager.createDataSource(
            sourceId,
            {
              entity: sourceId,
              history: {
                preload: true,
                hours: this.config.history_hours || 24  // Allow config override
              }
            },
            this._cardGuid,          // Pass card identifier
            true                     // Mark as auto-created (CHART ONLY)
          );

          // Track this datasource for cleanup
          this._registeredDataSources.add(sourceId);

          lcardsLog.info(`[LCARdSChart] ✅ Auto-created data source for entity: ${sourceId}`);

        } catch (error) {
          lcardsLog.error(`[LCARdSChart] Failed to auto-create data source for ${sourceId}:`, error);
          continue;
        }
      }

      // Subscribe to updates
      const subscription = dataSource.subscribe((data) => {
        lcardsLog.trace(`[LCARdSChart] Data update for ${sourceId}:`, data);
        this._handleDataUpdate(index, data);
      });

      this._dataSubscriptions.push(subscription);

      lcardsLog.debug(`[LCARdSChart] Subscribed to data source: ${sourceId}`);
    }
  }

  /**
   * Handle data update from data source
   * @private
   * @param {number} seriesIndex - Index of the series
   * @param {Object|Array} data - New data points (can be DataSource update object or array)
   */
  _handleDataUpdate(seriesIndex, data) {
    // Extract buffer array from DataSource update object if needed
    // DataSource emits { buffer: RollingBuffer, transformations: {}, aggregations: {}, ... }
    let dataArray;
    if (data?.buffer && typeof data.buffer.getAll === 'function') {
      // Get buffer selector from series config (default to 'main')
      const sourceRef = this.config.source || this.config.data_source || this.config.sources;
      const sources = Array.isArray(sourceRef) ? sourceRef : [sourceRef];
      const sourceConfig = sources[seriesIndex];

      // Get the DataSource reference to access processor buffers
      let dataSourceRef = null;
      if (sourceConfig && this._singletons?.dataSourceManager) {
        const sourceId = typeof sourceConfig === 'string' ? sourceConfig : (sourceConfig.datasource || sourceConfig.id || sourceConfig.name);
        dataSourceRef = this._singletons.dataSourceManager.getSource(sourceId);
      }

      // Construct buffer selector
      let bufferSelector = null;
      if (typeof sourceConfig === 'object') {
        if (sourceConfig.buffer) {
          // Buffer field can be:
          // - "main"
          // - "transformation.smoothed" (dot notation - editor format)
          // - "transformation" (type only)
          if (sourceConfig.key && !sourceConfig.buffer.includes('.')) {
            // Separate buffer and key: combine them
            bufferSelector = `${sourceConfig.buffer}.${sourceConfig.key}`;
          } else {
            // Already has dot notation or is 'main'
            bufferSelector = sourceConfig.buffer;
          }
        } else if (sourceConfig.key) {
          // Just key (legacy format)
          bufferSelector = sourceConfig.key;
        }
      }

      dataArray = this._getBufferData(data, dataSourceRef, bufferSelector);
    } else if (Array.isArray(data)) {
      dataArray = data;
    } else {
      dataArray = [];
    }

    // Store data for chart initialization (ensure _chartData is an array)
    if (!Array.isArray(this._chartData)) {
      this._chartData = [];
    }
    this._chartData[seriesIndex] = dataArray;

    // If chart isn't ready yet, trigger a render to initialize it via updated()
    if (!this._chart || !this._chartReady) {
      this.requestUpdate();
      return;
    }

    // For multi-series: rebuild ALL series data
    const sourceRef = this.config.source || this.config.data_source || this.config.sources;
    const sources = Array.isArray(sourceRef) ? sourceRef : [sourceRef];

    const allSeriesData = sources.map((source, idx) => {
      const data = this._chartData[idx] || [];
      const transformed = this._transformDataForSeries(data);
      const sourceName = typeof source === 'string' ? source : (source.datasource || source.name || source.id);
      const displayName = this._seriesNames?.[idx] || sourceName;

      return {
        name: displayName,
        data: transformed
      };
    });

    // Update ALL series at once
    try {
      this._chart.updateSeries(allSeriesData, false);
    } catch (error) {
      lcardsLog.error(`[LCARdSChart] Error updating chart data:`, error);
    }
  }

  /**
   * Transform data source data to ApexCharts series format
   * @private
   * @param {Array} data - Raw data from data source
   * @returns {Array} Transformed data
   */
  _transformDataForSeries(data) {
    if (!Array.isArray(data)) {
      return [];
    }

    return data.map(point => {
      // Support different data formats
      // RollingBuffer format: {t: timestamp, v: value}
      if (typeof point === 'object' && point.t !== undefined && point.v !== undefined) {
        return {
          x: point.t,
          y: point.v
        };
      }
      // Legacy format: {timestamp, value}
      else if (typeof point === 'object' && point.timestamp && point.value !== undefined) {
        return {
          x: point.timestamp,
          y: point.value
        };
      }
      // ApexCharts native format: {x, y}
      else if (typeof point === 'object' && point.x !== undefined && point.y !== undefined) {
        return point;
      }
      // Fallback
      else {
        return point;
      }
    });
  }

  /**
   * Initialize ApexCharts instance
   * Called from updated() when container has valid dimensions
   * @private
   */
  async _initializeChart() {
    const container = /** @type {HTMLElement|null} */ (this.renderRoot.querySelector('.chart-container'));
    if (!container) {
      lcardsLog.error('[LCARdSChart] Chart container not found');
      this._error = 'Chart container not found';
      this.requestUpdate();
      return;
    }

    // Check if ApexCharts is available
    if (!window.ApexCharts && !ApexCharts) {
      lcardsLog.error('[LCARdSChart] ApexCharts not available');
      this._error = 'ApexCharts library not available';
      this.requestUpdate();
      return;
    }

    // Get container dimensions (should be valid now)
    const containerWidth = container.offsetWidth || container.clientWidth || 400;
    const containerHeight = container.offsetHeight || container.clientHeight || 200;

    lcardsLog.debug(`[LCARdSChart] Container dimensions:`, {
      offsetWidth: container.offsetWidth,
      clientWidth: container.clientWidth,
      offsetHeight: container.offsetHeight,
      clientHeight: container.clientHeight,
      finalWidth: containerWidth,
      finalHeight: containerHeight
    });

    try {
      // Build chart options with explicit dimensions
      this._chartOptions = this._buildChartOptions(containerWidth, containerHeight);

      // Create chart instance
      const ApexChartsClass = window.ApexCharts || ApexCharts;
      this._chart = new ApexChartsClass(container, this._chartOptions);
      await this._chart.render();

      this._chartReady = true;
      this._error = null;

      lcardsLog.debug(`[LCARdSChart] Chart initialized for ${this._cardGuid}`);
    } catch (error) {
      lcardsLog.error(`[LCARdSChart] Error initializing chart:`, error);
      this._error = `Chart initialization failed: ${error.message}`;
      this.requestUpdate();
    }
  }

  /**
   * Build ApexCharts options from config
   * Ported from ApexChartsOverlayRenderer with LCARdSCard enhancements
   * @private
   * @param {number} width - Container width in pixels
   * @param {number} height - Container height in pixels
   * @returns {Object} ApexCharts options
   */
  _buildChartOptions(width = 400, height = 200) {
    // Get style with rule patches applied
    const style = this._getMergedStyleWithRules(this.config.style || {});

    // Merge chart_type from config root into style for adapter
    let enhancedStyle = {
      chart_type: this.config.chart_type || 'line',
      ...style
    };

    // Map xaxis_type into chart_options so it passes through the adapter's
    // highest-precedence override path (deepMerge with style.chart_options).
    if (this.config.xaxis_type) {
      enhancedStyle = {
        ...enhancedStyle,
        chart_options: {
          xaxis: { type: this.config.xaxis_type },
          ...(enhancedStyle.chart_options || {})
        }
      };
    }

    // If any series uses type 'scatter', ensure markers are visible.
    // In a mixed chart (e.g. line+scatter), ApexCharts defaults markers.size to 0
    // for line-type charts, making scatter dots invisible.
    const hasScatterSeries = Object.values(this.config.data_sources || {}).some(ds => ds.type === 'scatter');
    if (hasScatterSeries && !enhancedStyle.markers?.size) {
      enhancedStyle = { ...enhancedStyle, markers: { ...enhancedStyle.markers, size: 6 } };
    }

    // CRITICAL: Resolve all theme tokens recursively BEFORE passing to adapter
    // This handles tokens like 'theme:colors.chart.grid' and color manipulation
    // functions like 'alpha(colors.chart.grid, 0.05)'
    if (this._singletons?.themeManager) {
      enhancedStyle = resolveThemeTokensRecursive(enhancedStyle, this._singletons.themeManager);
      lcardsLog.trace(`[LCARdSChart] Resolved theme tokens in style:`, enhancedStyle);
    }

    // Check if we have actual data
    const hasData = this._chartData && this._chartData.length > 0 &&
                    this._chartData.some(s => s.data && Array.isArray(s.data) && s.data.length > 0);

    // Use ApexChartsAdapter.generateOptions() for full feature parity with MSD
    // This gives us all 50+ style properties (nested structure):
    // - colors.series, colors.stroke, colors.fill, colors.marker.*
    // - colors.grid, grid.show, grid.opacity, grid.row_colors, grid.column_colors
    // - colors.axis.x, colors.axis.y, colors.axis.border, colors.axis.ticks
    // - colors.legend.default, colors.legend.items, legend.show
    // - theme.mode, theme.palette, theme.monochrome.*
    // - typography.font_family, typography.font_size
    // - display.toolbar, display.tooltip.*
    // - animation.preset
    // - and all chart-type-specific defaults
    const options = ApexChartsAdapter.generateOptions(
      enhancedStyle,
      [width, height],
      {
        hasData,
        // Pass context for theme token resolution
        config: this.config,
        card: this,
        hass: this.hass
      }
    );

    // Get series data and merge into options
    const series = this._getSeriesData();
    const finalOptions = {
      ...options,
      series
    };

    lcardsLog.trace(`[LCARdSChart] Built chart options using ApexChartsAdapter:`, finalOptions);

    return finalOptions;
  }

  /**
   * Get series data formatted for ApexCharts.
   * Name resolution order: config.series_names[i] → data_sources[id].name → source ID.
   * Per-series type override is read from data_sources[id].type if set.
   * @private
   * @returns {Array} Series array for ApexCharts
   */
  _getSeriesData() {
    const sourceRef = this.config.source || this.config.data_source || this.config.sources;
    if (!sourceRef) {
      return [];
    }

    const sources = Array.isArray(sourceRef) ? sourceRef : [sourceRef];

    // Explicit series_names array still respected for backward compat
    const explicitNames = this.config.series_names;
    const nameOverrides = Array.isArray(explicitNames) ? explicitNames
      : (explicitNames ? [explicitNames] : []);

    return sources.map((sourceConfig, index) => {
      const data = this._chartData?.[index] || [];
      const seriesData = this._transformDataForSeries(data);

      const sourceId = typeof sourceConfig === 'string'
        ? sourceConfig
        : (sourceConfig.datasource || sourceConfig.name || sourceConfig.id);

      // Resolve display name: explicit override > DS config name > source ID
      const dsConfig = this.config.data_sources?.[sourceId];
      const displayName = nameOverrides[index] || dsConfig?.name || sourceId;

      const seriesEntry = { name: displayName, data: seriesData };

      // Optional per-series chart type override (e.g., mixed line+bar)
      if (dsConfig?.type) {
        seriesEntry.type = dsConfig.type;
      }

      return seriesEntry;
    });
  }

  /**
   * Override setConfig to destroy and reinitialize chart when config changes.
   * Without this, changes to legend, axes, markers, etc. in the editor/YAML
   * have no effect until the page is reloaded, because _chartInitialized stays true.
   * @override
   */
  setConfig(config) {
    // Destroy existing chart so updated() will reinitialize it with new options
    if (this._chart) {
      try {
        this._chart.destroy();
      } catch (e) {
        lcardsLog.warn('[LCARdSChart] Error destroying chart on config change:', e);
      }
      this._chart = null;
    }
    this._chartReady = false;
    this._chartInitialized = false;

    super.setConfig(config);
  }

  /**
   * Update chart options (for rule-based style changes)
   * @private
   */
  _updateChartOptions() {
    if (!this._chart) return;

    try {
      const newOptions = this._buildChartOptions();

      // Pass all style-related options so changes to legend, axes,
      // markers, tooltip, etc. are reflected without a full reinit
      this._chart.updateOptions({
        colors: newOptions.colors,
        stroke: newOptions.stroke,
        fill: newOptions.fill,
        grid: newOptions.grid,
        legend: newOptions.legend,
        markers: newOptions.markers,
        dataLabels: newOptions.dataLabels,
        tooltip: newOptions.tooltip,
        xaxis: newOptions.xaxis,
        yaxis: newOptions.yaxis
      }, false, false);

      lcardsLog.trace(`[LCARdSChart] Updated chart options for ${this._cardGuid}`);
    } catch (error) {
      lcardsLog.error(`[LCARdSChart] Error updating chart options:`, error);
    }
  }

  /**
   * Render the chart card
   * @protected
   */
  _renderCard() {
    // Preview mode - show placeholder SVG
    if (this._isPreviewMode) {
      return this._renderPreview();
    }

    // Check if no data source configured (non-preview stub config case)
    const sourceRef = this.config.source || this.config.data_source || this.config.sources;
    if (!sourceRef) {
      return html`
        <div class="lcards-card-container">
          <div class="chart-loading">
            <p>📊 LCARdS Chart</p>
            <p style="font-size: 0.9em; opacity: 0.7;">Configure a data source to display chart</p>
          </div>
        </div>
      `;
    }

    if (this._error) {
      return html`
        <div class="lcards-card-container">
          <div class="chart-error">
            ${this._error}
          </div>
        </div>
      `;
    }

    // Show container immediately when we have data
    // Chart will initialize in updated() lifecycle when container has dimensions
    if (!this._chartData || this._chartData.length === 0) {
      return html`
        <div class="lcards-card-container">
          <div class="chart-loading">
            Loading chart data...
          </div>
        </div>
      `;
    }

    // The host element height is set by the base class from config.height (if
    // present) or by the HA grid/stack slot. The container fills 100% of that.
    return html`
      <div class="lcards-card-container">
        <div class="chart-container"></div>
      </div>
    `;
  }

  /**
   * Render preview mode placeholder
   * @private
   */
  _renderPreview() {
    const chartType = this.config.chart_type || 'line';
    const color = this.config.style?.colors?.[0] || '#FF9900';

    return html`
      <div class="lcards-card-container">
        <svg viewBox="0 0 400 200" style="width: 100%; height: 100%;">
          <rect width="400" height="200" fill="rgba(0,0,0,0.3)" rx="4"/>
          <line x1="0" y1="50" x2="400" y2="50" stroke="rgba(255,255,255,0.1)" stroke-width="1"/>
          <line x1="0" y1="100" x2="400" y2="100" stroke="rgba(255,255,255,0.1)" stroke-width="1"/>
          <line x1="0" y1="150" x2="400" y2="150" stroke="rgba(255,255,255,0.1)" stroke-width="1"/>
          <line x1="100" y1="0" x2="100" y2="200" stroke="rgba(255,255,255,0.1)" stroke-width="1"/>
          <line x1="200" y1="0" x2="200" y2="200" stroke="rgba(255,255,255,0.1)" stroke-width="1"/>
          <line x1="300" y1="0" x2="300" y2="200" stroke="rgba(255,255,255,0.1)" stroke-width="1"/>

          ${this._renderPreviewChart(chartType, color)}

          <text x="200" y="30" text-anchor="middle" fill="${color}" font-size="16" font-weight="bold">
            📊 ${chartType.toUpperCase()} Chart
          </text>
          <text x="200" y="190" text-anchor="middle" fill="rgba(255,255,255,0.5)" font-size="12">
            Configure source to display data
          </text>
        </svg>
      </div>
    `;
  }

  /**
   * Render preview chart based on type
   * @private
   */
  _renderPreviewChart(chartType, color) {
    if (chartType === 'line') {
      return svg`
        <path
          d="M 20,140 L 80,120 L 140,160 L 200,80 L 260,100 L 320,60 L 380,90"
          fill="none"
          stroke="${color}"
          stroke-width="3"
        />
      `;
    }

    if (chartType === 'area') {
      return svg`
        <path
          d="M 20,140 L 80,120 L 140,160 L 200,80 L 260,100 L 320,60 L 380,90 L 380,180 L 20,180 Z"
          fill="${color}"
          fill-opacity="0.3"
          stroke="${color}"
          stroke-width="2"
        />
      `;
    }

    if (chartType === 'bar') {
      return svg`
        <rect x="40" y="120" width="40" height="60" fill="${color}" opacity="0.8"/>
        <rect x="120" y="100" width="40" height="80" fill="${color}" opacity="0.8"/>
        <rect x="200" y="80" width="40" height="100" fill="${color}" opacity="0.8"/>
        <rect x="280" y="110" width="40" height="70" fill="${color}" opacity="0.8"/>
      `;
    }

    // Default to line
    return svg`
      <path
        d="M 20,140 L 80,120 L 140,160 L 200,80 L 260,100 L 320,60 L 380,90"
        fill="none"
        stroke="${color}"
        stroke-width="3"
      />
    `;
  }

  /**
   * Cleanup on disconnect — called by LCARdSCard.disconnectedCallback()
   * @protected
   */
  _onDisconnected() {
    // Unsubscribe from chart-specific data source subscriptions
    if (this._dataSubscriptions) {
      this._dataSubscriptions.forEach(subscription => {
        try {
          if (typeof subscription === 'function') {
            subscription();
          } else if (typeof subscription?.unsubscribe === 'function') {
            subscription.unsubscribe();
          }
        } catch (error) {
          lcardsLog.warn('[LCARdSChart] Error unsubscribing:', error);
        }
      });
      this._dataSubscriptions = [];
    }

    // Destroy ApexCharts instance
    if (this._chart) {
      try {
        this._chart.destroy();
      } catch (error) {
        lcardsLog.warn('[LCARdSChart] Error destroying chart:', error);
      }
      this._chart = null;
    }

    this._chartReady = false;
    this._chartInitialized = false;

    super._onDisconnected();
  }

  /**
   * Get card size for HA layout
   * @protected
   */
  _getCardSize() {
    return Math.ceil((this._configPx(this.config?.height) || 200) / 50);
  }

  /**
   * Get stub config for GUI editor preview
   * @static
   */
  static getStubConfig() {
    return {
      type: 'custom:lcards-chart',
      chart_type: 'line',
      // Note: No source - chart will show "No data configured" message
      // This avoids creating data source subscriptions in preview
    };
  }

  /**
   * Get config element (editor) for Home Assistant GUI
   * @static
   */
  static getConfigElement() {
    return document.createElement('lcards-chart-editor');
  }

  /**
   * Register schema with CoreConfigManager
   * Called by lcards.js after core initialization
   * @static
   */
  static registerSchema() {
    const configManager = window.lcards?.core?.configManager;

    if (!configManager) {
      lcardsLog.error('[LCARdSChart] CoreConfigManager not available for schema registration');
      return;
    }

    // Register behavioral defaults
    configManager.registerCardDefaults('chart', {
        chart_type: 'line',           // Default chart type
        height: 300,                  // Default height in pixels
        xaxis_type: 'datetime',       // Default x-axis type
        max_points: 0                 // No point limit by default (0 = unlimited)
    });

    // Use static import (no .then() needed)
    const schema = getChartSchema({
        availableAnimationPresets: [
            'lcars_standard',
            'lcars_dramatic',
            'lcars_minimal',
            'lcars_realtime',
            'lcars_alert',
            'none'
        ]
    });

    configManager.registerCardSchema('chart', schema, { version: __LCARDS_VERSION__ });
    lcardsLog.debug('[LCARdSChart] Registered nested schema with CoreConfigManager');
  }
}

// NOTE: Card registration (customElements.define and window.customCards) handled in src/lcards.js
