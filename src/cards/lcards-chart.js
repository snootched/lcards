/**
 * LCARdS Chart Card
 *
 * Data visualization using ApexCharts library (already bundled).
 * Ported from ApexChartsOverlay to standalone LCARdSCard.
 *
 * Features:
 * - Real-time data updates via DataSourceManager
 * - Multiple chart types (line, area, bar, pie, etc.)
 * - Theme token integration
 * - Rules-based dynamic styling
 * - Time-series support
 * - Chart templates support
 *
 * @example Basic Usage
 * ```yaml
 * type: custom:lcards-chart
 * source: sensor.temperature
 * chart_type: line
 * ```
 *
 * @example With Theme Tokens
 * ```yaml
 * type: custom:lcards-chart
 * source: sensor.temperature
 * chart_type: area
 * style:
 *   colors: [colors.accent.primary, colors.accent.secondary]
 *   curve: smooth
 * ```
 *
 * @example Multi-Series
 * ```yaml
 * type: custom:lcards-chart
 * sources:
 *   - sensor.temperature
 *   - sensor.humidity
 * chart_type: line
 * series_names: [Temperature, Humidity]
 * ```
 */

import { html, css } from 'lit';
import { LCARdSCard } from '../base/LCARdSCard.js';
import { lcardsLog } from '../utils/lcards-logging.js';
import ApexCharts from 'apexcharts';
import { ApexChartsAdapter } from '../charts/ApexChartsAdapter.js';
import { resolveThemeTokensRecursive } from '../utils/lcards-theme.js';

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
    // Default to 4 rows (200px) for charts
    // User can override with config.height
    const configHeight = this.config.height || 200;
    return Math.ceil(configHeight / 50);
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
    const isPreview = isInCardPicker || isInEditDialog || this._isPreviewMode;

    lcardsLog.debug('[LCARdSChart] Preview detection in _handleFirstUpdate:', {
      isInCardPicker,
      isInEditDialog,
      isPreviewFromNativeCard: this._isPreviewMode,
      finalDecision: isPreview,
      hasParent: !!this.parentElement,
      parentTag: this.parentElement?.tagName,
      parentClass: this.parentElement?.className,
      hasSource: !!(this.config.source || this.config.data_source || this.config.sources)
    });

    // Register with RulesEngine
    const overlayId = this.config.id || `chart-${this._cardGuid}`;
    this._registerOverlayForRules(overlayId, this.config.tags || []);

    // Skip data source subscription and chart init in preview mode
    if (isPreview) {
      lcardsLog.debug('[LCARdSChart] Preview mode detected - skipping data source subscription and chart initialization');
      this._chartReady = true; // Mark as "ready" to show preview
      this._isPreviewMode = true; // Update flag for render
      return;
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
   * @protected
   */
  updated(changedProperties) {
    super.updated(changedProperties);

    // Only initialize once, after data is ready, when not in preview mode
    if (this._chartInitialized || this._isPreviewMode || !this._chartData.length) {
      return;
    }

    // For multi-series: wait for ALL series to have data before initializing
    const sourceRef = this.config.source || this.config.data_source || this.config.sources;
    const sources = Array.isArray(sourceRef) ? sourceRef : [sourceRef];
    const expectedSeriesCount = sources.length;

    // Count how many series have data
    const seriesWithData = this._chartData.filter(data => data && data.length > 0).length;

    if (seriesWithData < expectedSeriesCount) {
      lcardsLog.trace(`[LCARdSChart] Waiting for all series data: ${seriesWithData}/${expectedSeriesCount} ready`);
      return; // Wait for all series to have data
    }

    // Get the container and check if it has dimensions
    const container = this.renderRoot.querySelector('.chart-container');
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
    let current = this;
    const maxLevels = 20;

    for (let i = 0; i < maxLevels && current; i++) {
      // Check if current element matches
      for (const selector of selectors) {
        if (current.tagName && current.tagName.toLowerCase() === selector.toLowerCase()) {
          return true;
        }
      }

      // Move up: try parentElement first, then host (shadow DOM)
      current = current.parentElement || current.parentNode?.host || current.getRootNode()?.host;
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
   * Cleanup when card is removed from DOM
   * @protected
   */
  disconnectedCallback() {
    // Cleanup datasource tracking
    if (this._singletons?.dataSourceManager && this._registeredDataSources) {
      this._registeredDataSources.forEach(sourceName => {
        this._singletons.dataSourceManager.removeCardFromSource(
          sourceName,
          this._cardGuid
        );
      });
      this._registeredDataSources.clear();
    }

    // Unsubscribe from data sources
    if (this._dataSubscriptions) {
      this._dataSubscriptions.forEach(unsubscribe => {
        try {
          unsubscribe();
        } catch (error) {
          lcardsLog.warn('[LCARdSChart] Error unsubscribing:', error);
        }
      });
      this._dataSubscriptions = [];
    }

    // Destroy chart
    if (this._chart) {
      try {
        this._chart.destroy();
      } catch (error) {
        lcardsLog.warn('[LCARdSChart] Error destroying chart:', error);
      }
      this._chart = null;
    }

    // Call parent cleanup
    super.disconnectedCallback();
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
      const sourceId = sources[index];

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
                enabled: true,
                hours: this.config.history_hours || 24  // Allow config override
              },
              windowSeconds: 3600,   // 1 hour window
              minEmitMs: 1000,       // 1 second minimum between updates
              coalesceMs: 200        // 200ms coalescing for chart updates
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
    // DataSource emits { buffer: RollingBuffer, ... }, so we need to call buffer.getAll()
    let dataArray;
    if (data?.buffer && typeof data.buffer.getAll === 'function') {
      dataArray = data.buffer.getAll();  // RollingBuffer -> Array of {t, v}
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
      const sourceName = typeof source === 'string' ? source : (source.name || source.id);
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
    const container = this.renderRoot.querySelector('.chart-container');
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
      xaxis_type: this.config.xaxis_type || 'datetime',
      show_legend: this.config.show_legend,
      series_names: this.config.series_names || this.config.seriesNames,
      time_window: this.config.time_window,
      max_points: this.config.max_points,
      ...style
    };

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
    // This gives us all 50+ style properties (v1.18.0+ nested structure):
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
        card: this
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
   * Get series data from DataSourceManager
   * @private
   * @returns {Array} Series array for ApexCharts
   */
  _getSeriesData() {
    // Get source(s) for naming
    const sourceRef = this.config.source || this.config.data_source || this.config.sources;
    if (!sourceRef) {
      return [];
    }

    const sources = Array.isArray(sourceRef) ? sourceRef : [sourceRef];
    const seriesNames = this.config.series_names || this.config.series_name;
    const names = Array.isArray(seriesNames) ? seriesNames : (seriesNames ? [seriesNames] : []);

    // Build series array from stored _chartData
    const series = [];

    sources.forEach((sourceId, index) => {
      // Get data from our stored _chartData array (populated by _handleDataUpdate)
      const data = this._chartData?.[index] || [];

      // Transform data
      const seriesData = this._transformDataForSeries(data);

      // Add to series
      series.push({
        name: names[index] || sourceId,
        data: seriesData
      });
    });

    return series;
  }

  /**
   * Update chart options (for rule-based style changes)
   * @private
   */
  _updateChartOptions() {
    if (!this._chart) return;

    try {
      const newOptions = this._buildChartOptions();

      // Update only the style-related options to avoid data re-fetch
      this._chart.updateOptions({
        colors: newOptions.colors,
        stroke: newOptions.stroke,
        fill: newOptions.fill,
        grid: newOptions.grid
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
      return html`
        <path
          d="M 20,140 L 80,120 L 140,160 L 200,80 L 260,100 L 320,60 L 380,90"
          fill="none"
          stroke="${color}"
          stroke-width="3"
        />
      `;
    }

    if (chartType === 'area') {
      return html`
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
      return html`
        <rect x="40" y="120" width="40" height="60" fill="${color}" opacity="0.8"/>
        <rect x="120" y="100" width="40" height="80" fill="${color}" opacity="0.8"/>
        <rect x="200" y="80" width="40" height="100" fill="${color}" opacity="0.8"/>
        <rect x="280" y="110" width="40" height="70" fill="${color}" opacity="0.8"/>
      `;
    }

    // Default to line
    return html`
      <path
        d="M 20,140 L 80,120 L 140,160 L 200,80 L 260,100 L 320,60 L 380,90"
        fill="none"
        stroke="${color}"
        stroke-width="3"
      />
    `;
  }

  /**
   * Cleanup on disconnect
   * @protected
   */
  _onDisconnected() {
    // Unsubscribe from data sources
    this._dataSubscriptions.forEach(subscription => {
      if (typeof subscription === 'function') {
        subscription(); // Call unsubscribe function
      } else if (subscription && typeof subscription.unsubscribe === 'function') {
        subscription.unsubscribe();
      }
    });
    this._dataSubscriptions = [];

    // Destroy chart
    if (this._chart) {
      try {
        this._chart.destroy();
      } catch (error) {
        lcardsLog.warn('[LCARdSChart] Error destroying chart:', error);
      }
      this._chart = null;
    }

    this._chartReady = false;

    super._onDisconnected();
  }

  /**
   * Get card size for HA layout
   * @protected
   */
  _getCardSize() {
    return 4; // Chart cards typically need more space
  }

  /**
   * Get stub config for GUI editor preview
   * @static
   */
  static getStubConfig() {
    return {
      type: 'custom:lcards-chart',
      chart_type: 'line',
      style: {
        colors: ['#FF9900']
      },
      // Note: No source - chart will show "No data configured" message
      // This avoids creating data source subscriptions in preview
    };
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
        show_legend: false,           // Legend off by default
        xaxis_type: 'datetime',       // Default x-axis type
        max_points: 0                 // No point limit by default (0 = unlimited)
    });

    // Import and register complete schema (v1.18.0+)
    import('./schemas/chart-schema.js').then(module => {
        const schema = module.getChartSchema({
            availableAnimationPresets: [
                'lcars_standard',
                'lcars_dramatic',
                'lcars_minimal',
                'lcars_realtime',
                'lcars_alert',
                'none'
            ]
        });

        configManager.registerCardSchema('chart', schema, { version: '1.18.0' });
        lcardsLog.debug('[LCARdSChart] Registered nested schema with CoreConfigManager (v1.18.0)');
    }).catch(error => {
        lcardsLog.error('[LCARdSChart] Failed to load chart schema:', error);
    });
  }
}

// NOTE: Card registration (customElements.define and window.customCards) handled in src/lcards.js
