/**
 * LCARdS Data Grid Card
 *
 * A flexible grid visualization card for LCARdS that supports three data input modes:
 * 1. Random (decorative) - Generates random data for cascade visual effect
 * 2. Template (manual grid) - Static or entity-based grid using templates
 * 3. DataSource (real-time) - Dynamic data from DataSourceManager
 *
 * Features:
 * - CSS Grid layout (native browser optimization)
 * - Cascade animations (row-by-row color cycling)
 * - Change detection with highlight animations
 * - Theme token integration
 * - Responsive auto-sizing
 *
 * @example Random/Decorative Mode
 * ```yaml
 * type: custom:lcards-data-grid
 * data_mode: random
 * format: mixed  # 'digit' | 'float' | 'alpha' | 'mixed'
 * grid:
 *   rows: 8
 *   columns: 12
 *   gap: 8
 * ```
 *
 * @example Template Mode
 * ```yaml
 * type: custom:lcards-data-grid
 * data_mode: template
 * rows:
 *   - ['Living Room', '{{states.sensor.living_temp.state}}°C', '{{states.sensor.living_humidity.state}}%']
 *   - ['Bedroom', '{{states.sensor.bedroom_temp.state}}°C', '{{states.sensor.bedroom_humidity.state}}%']
 * ```
 *
 * @example DataSource Mode (Timeline)
 * ```yaml
 * type: custom:lcards-data-grid
 * data_mode: datasource
 * layout: timeline
 * source: sensor_temp_history
 * grid:
 *   columns: 12
 * ```
 *
 * @see {@link https://github.com/snootched/LCARdS} for full documentation
 */

import { html, css } from 'lit';
import { LCARdSCard } from '../base/LCARdSCard.js';
import { lcardsLog } from '../utils/lcards-logging.js';
import { escapeHtml } from '../utils/StringUtils.js';

export class LCARdSDataGrid extends LCARdSCard {
  /** Card type identifier for CoreConfigManager */
  static CARD_TYPE = 'data-grid';

  static get properties() {
    return {
      ...super.properties,
      _gridData: { type: Array, state: true },
      _containerSize: { type: Object, state: true },
      _cascadeActive: { type: Boolean, state: true }
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
        }

        .lcards-card-container {
          width: 100%;
          height: 100%;
          background: transparent;
        }

        .data-grid-container {
          width: 100%;
          height: 100%;
          overflow: hidden;
        }

        .data-grid {
          display: grid;
          width: 100%;
          height: 100%;
          font-family: var(--lcars-font-family, 'Antonio', 'Helvetica Neue', sans-serif);
        }

        .grid-cell {
          display: flex;
          align-items: center;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          transition: color 0.3s ease, background-color 0.3s ease;
        }

        .grid-cell.align-left {
          justify-content: flex-start;
        }

        .grid-cell.align-center {
          justify-content: center;
        }

        .grid-cell.align-right {
          justify-content: flex-end;
        }

        /* Header row styling */
        .grid-header {
          font-weight: bold;
          text-transform: uppercase;
          border-bottom: 2px solid var(--lcars-divider, #333);
        }

        /* Change detection animation */
        .cell-changed {
          animation: cell-pulse 0.5s ease-out;
        }

        @keyframes cell-pulse {
          0%, 100% {
            transform: scale(1);
            background-color: transparent;
          }
          50% {
            transform: scale(1.05);
            background-color: var(--lcars-highlight, rgba(255, 153, 0, 0.3));
          }
        }

        /* Cascade animation keyframes - applied via JS */
        .cascade-animate {
          transition: color 0.5s ease-in-out;
        }

        /* Loading state */
        .grid-loading {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 100%;
          height: 100%;
          color: var(--primary-text-color);
          font-size: 14px;
        }

        /* Error state */
        .grid-error {
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

  constructor() {
    super();
    this._gridData = [];
    this._containerSize = { width: 200, height: 200 };
    this._cascadeActive = false;
    this._dataSubscriptions = [];
    this._templateEntities = [];
    this._previousGridData = null;
    this._cascadeInterval = null;
    this._cascadeColors = [];
    this._currentCascadeStep = 0;
    this._error = null;
    this._columnConfig = [];
    this._rowConfig = [];
    this._isInitialized = false;
  }

  /**
   * Handle first update - initialize grid
   * @protected
   */
  async _handleFirstUpdate() {
    lcardsLog.debug('[LCARdSDataGrid] First update');

    // Register with RulesEngine
    const overlayId = this.config.id || `data-grid-${this._cardGuid}`;
    this._registerOverlayForRules(overlayId, this.config.tags || []);

    // Setup auto-sizing
    this._setupAutoSizing((width, height) => {
      this._containerSize = { width, height };
      this.requestUpdate();
    });

    // Wait for config processing to complete
    if (this._configProcessingPromise) {
      await this._configProcessingPromise;
    }

    // Initialize based on data mode
    await this._initializeDataMode();

    // Setup cascade animation if configured
    this._setupCascadeAnimation();

    this._isInitialized = true;
  }

  /**
   * Called when config is set
   * @protected
   */
  _onConfigSet(config) {
    super._onConfigSet(config);

    // Re-initialize if already initialized and config changes
    if (this._isInitialized) {
      this._initializeDataMode();
      this._setupCascadeAnimation();
    }
  }

  /**
   * Handle HASS updates
   * @protected
   */
  _handleHassUpdate(newHass, oldHass) {
    // Check if any tracked template entities changed
    if (this._templateEntities.length > 0) {
      const hasChanges = this._templateEntities.some(entityId => {
        const oldState = oldHass?.states?.[entityId]?.state;
        const newState = newHass?.states?.[entityId]?.state;
        return oldState !== newState;
      });

      if (hasChanges) {
        this._processTemplateGrid();
      }
    }
  }

  /**
   * Called when rules produce style patches
   * @protected
   */
  _onRulePatchesChanged() {
    this.requestUpdate();
  }

  // ============================================================================
  // DATA MODE INITIALIZATION
  // ============================================================================

  /**
   * Initialize data based on configured mode
   * @private
   */
  async _initializeDataMode() {
    const dataMode = this.config.data_mode || 'random';

    lcardsLog.debug(`[LCARdSDataGrid] Initializing data mode: ${dataMode}`);

    try {
      switch (dataMode) {
        case 'random':
          this._initializeRandomMode();
          break;
        case 'template':
          await this._initializeTemplateMode();
          break;
        case 'datasource':
          await this._initializeDataSourceMode();
          break;
        default:
          lcardsLog.warn(`[LCARdSDataGrid] Unknown data_mode: ${dataMode}, falling back to random`);
          this._initializeRandomMode();
      }
    } catch (error) {
      lcardsLog.error('[LCARdSDataGrid] Data mode initialization failed:', error);
      this._error = error.message;
    }

    this.requestUpdate();
  }

  // ============================================================================
  // MODE 1: RANDOM (DECORATIVE)
  // ============================================================================

  /**
   * Initialize random/decorative mode
   * @private
   */
  _initializeRandomMode() {
    const grid = this.config.grid || {};
    const rows = grid.rows || 8;
    const columns = grid.columns || 12;
    const refreshInterval = this.config.refresh_interval || 0;

    lcardsLog.debug(`[LCARdSDataGrid] Random mode: ${rows}x${columns}`);

    // Generate initial grid
    this._gridData = this._generateRandomGrid(rows, columns);

    // Setup refresh interval if configured
    if (refreshInterval > 0) {
      this._setupRandomRefresh(refreshInterval);
    }
  }

  /**
   * Generate random grid data
   * @private
   * @param {number} rows - Number of rows
   * @param {number} columns - Number of columns
   * @returns {Array<Array<string>>} 2D array of random values
   */
  _generateRandomGrid(rows, columns) {
    const format = this.config.format || 'mixed';

    const generators = {
      digit: () => Math.floor(Math.random() * 10000).toString().padStart(4, '0'),
      float: () => (Math.random() * 100).toFixed(2),
      alpha: () => {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        return chars.charAt(Math.floor(Math.random() * chars.length)) +
               chars.charAt(Math.floor(Math.random() * chars.length));
      },
      hex: () => Math.floor(Math.random() * 65535).toString(16).toUpperCase().padStart(4, '0'),
      mixed: () => {
        const types = ['digit', 'float', 'alpha', 'hex'];
        const type = types[Math.floor(Math.random() * types.length)];
        return generators[type]();
      }
    };

    const generator = generators[format] || generators.mixed;

    return Array.from({ length: rows }, () =>
      Array.from({ length: columns }, () => generator())
    );
  }

  /**
   * Setup random data refresh interval
   * @private
   * @param {number} intervalMs - Refresh interval in milliseconds
   */
  _setupRandomRefresh(intervalMs) {
    // Clear existing interval
    if (this._randomRefreshInterval) {
      clearInterval(this._randomRefreshInterval);
    }

    this._randomRefreshInterval = setInterval(() => {
      const grid = this.config.grid || {};
      const rows = grid.rows || 8;
      const columns = grid.columns || 12;

      // Store previous data for change detection
      this._previousGridData = this._gridData;

      // Generate new data
      this._gridData = this._generateRandomGrid(rows, columns);

      // Trigger change animations
      this._detectAndAnimateChanges();

      this.requestUpdate();
    }, intervalMs);
  }

  // ============================================================================
  // MODE 2: TEMPLATE (MANUAL GRID)
  // ============================================================================

  /**
   * Initialize template mode
   * @private
   */
  async _initializeTemplateMode() {
    const rows = this.config.rows;

    if (!Array.isArray(rows) || rows.length === 0) {
      lcardsLog.error('[LCARdSDataGrid] Template mode requires rows array');
      this._error = 'Template mode requires rows array in config';
      return;
    }

    // Extract entity dependencies from templates
    this._extractTemplateDependencies(rows);

    // Process templates
    await this._processTemplateGrid();
  }

  /**
   * Process template-based grid data
   * @private
   */
  async _processTemplateGrid() {
    const rows = this.config.rows || [];

    const processedRows = await Promise.all(
      rows.map(async (row) => {
        if (!Array.isArray(row)) {
          lcardsLog.warn('[LCARdSDataGrid] Template row must be an array:', row);
          return [];
        }

        return await Promise.all(
          row.map(async (cell) => {
            if (typeof cell !== 'string') return String(cell);

            // Use base class template processor
            return await this.processTemplate(cell);
          })
        );
      })
    );

    // Store previous data for change detection
    this._previousGridData = this._gridData;

    this._gridData = processedRows;

    // Trigger change animations
    this._detectAndAnimateChanges();

    this.requestUpdate();
  }

  /**
   * Extract entity dependencies from template strings
   * @private
   * @param {Array<Array<string>>} rows - Template rows
   */
  _extractTemplateDependencies(rows) {
    const entities = new Set();

    rows.flat().forEach(cell => {
      if (typeof cell !== 'string') return;

      // Match {{states.sensor.temp.state}} patterns
      const statesMatches = cell.matchAll(/\{\{states\.([^}.\s]+\.[^}.\s]+)/g);
      for (const match of statesMatches) {
        entities.add(match[1]);
      }

      // Match {entity.state} patterns
      const entityMatches = cell.matchAll(/\{entity\.([^}]+)\}/g);
      if (this.config.entity) {
        entities.add(this.config.entity);
      }
    });

    this._templateEntities = Array.from(entities);

    // Also add to base class tracked entities for HASS updates
    if (!this._trackedEntities) {
      this._trackedEntities = [];
    }
    this._templateEntities.forEach(e => {
      if (!this._trackedEntities.includes(e)) {
        this._trackedEntities.push(e);
      }
    });

    lcardsLog.debug('[LCARdSDataGrid] Tracking template entities:', this._templateEntities);
  }

  // ============================================================================
  // MODE 3: DATASOURCE (REAL-TIME)
  // ============================================================================

  /**
   * Initialize datasource mode
   * @private
   */
  async _initializeDataSourceMode() {
    const layout = this.config.layout || 'timeline';

    lcardsLog.debug(`[LCARdSDataGrid] DataSource mode with layout: ${layout}`);

    if (layout === 'timeline') {
      await this._initializeTimelineLayout();
    } else if (layout === 'spreadsheet') {
      await this._initializeSpreadsheetLayout();
    } else {
      lcardsLog.warn(`[LCARdSDataGrid] Unknown layout: ${layout}, using timeline`);
      await this._initializeTimelineLayout();
    }
  }

  /**
   * Initialize timeline layout (single source, flowing data)
   * @private
   */
  async _initializeTimelineLayout() {
    const source = this.config.source;
    const grid = this.config.grid || {};
    const columns = grid.columns || 12;

    if (!source) {
      lcardsLog.error('[LCARdSDataGrid] Timeline mode requires source');
      this._error = 'Timeline mode requires source in config';
      return;
    }

    const dataSourceManager = this._singletons?.dataSourceManager;
    if (!dataSourceManager) {
      lcardsLog.error('[LCARdSDataGrid] DataSourceManager not available');
      this._error = 'DataSourceManager not available';
      return;
    }

    // Get or create data source
    let dataSource = dataSourceManager.getSource(source);

    if (!dataSource) {
      // Auto-create if it looks like an entity
      const isEntityId = /^[a-z_]+\.[a-z0-9_]+$/.test(source);
      if (isEntityId) {
        try {
          dataSource = await dataSourceManager.createDataSource(source, {
            entity: source,
            history: { enabled: true, hours: this.config.history_hours || 1 }
          });
        } catch (error) {
          lcardsLog.error(`[LCARdSDataGrid] Failed to create data source: ${source}`, error);
          this._error = `Failed to create data source: ${source}`;
          return;
        }
      } else {
        lcardsLog.error(`[LCARdSDataGrid] Data source not found: ${source}`);
        this._error = `Data source not found: ${source}`;
        return;
      }
    }

    // Subscribe to updates
    const unsubscribe = dataSource.subscribe((data) => {
      this._handleTimelineDataUpdate(data, columns);
    });

    this._dataSubscriptions.push(unsubscribe);

    // Get initial data
    const currentData = dataSource.getCurrentData();
    if (currentData) {
      this._handleTimelineDataUpdate(currentData, columns);
    }

    lcardsLog.debug(`[LCARdSDataGrid] Timeline grid initialized: ${source}`);
  }

  /**
   * Handle timeline data update
   * @private
   * @param {Object} data - Data from datasource
   * @param {number} columns - Number of columns
   */
  _handleTimelineDataUpdate(data, columns) {
    const valueTemplate = this.config.value_template || '{value}';
    let values = [];

    // Handle different data formats
    if (data.buffer && typeof data.buffer.getAll === 'function') {
      // Rolling buffer data
      values = data.buffer.getAll().map(point => point.v);
    } else if (Array.isArray(data)) {
      values = data;
    } else if (data.v !== undefined) {
      // Single value - push to existing array or start new
      if (!this._timelineValues) {
        this._timelineValues = [];
      }
      this._timelineValues.push(data.v);

      // Limit to configured max values
      const maxValues = (this.config.grid?.rows || 8) * columns;
      if (this._timelineValues.length > maxValues) {
        this._timelineValues = this._timelineValues.slice(-maxValues);
      }
      values = this._timelineValues;
    }

    // Store previous data for change detection
    this._previousGridData = this._gridData;

    // Format values into rows
    const rows = [];
    for (let i = 0; i < values.length; i += columns) {
      const row = values.slice(i, i + columns).map(value =>
        this._formatCellValue(value, valueTemplate)
      );
      rows.push(row);
    }

    this._gridData = rows;

    // Trigger change animations
    this._detectAndAnimateChanges();

    this.requestUpdate();
  }

  /**
   * Initialize spreadsheet layout (multi-source, structured)
   * @private
   */
  async _initializeSpreadsheetLayout() {
    const columns = this.config.columns;
    const rows = this.config.rows;

    if (!columns || !rows) {
      lcardsLog.error('[LCARdSDataGrid] Spreadsheet mode requires columns and rows');
      this._error = 'Spreadsheet mode requires columns and rows in config';
      return;
    }

    this._columnConfig = columns;
    this._rowConfig = rows;

    const dataSourceManager = this._singletons?.dataSourceManager;
    if (!dataSourceManager) {
      lcardsLog.error('[LCARdSDataGrid] DataSourceManager not available');
      this._error = 'DataSourceManager not available';
      return;
    }

    // Initialize grid data as Map for efficient cell updates
    this._gridDataMap = new Map();

    // Process each row
    for (let rowIndex = 0; rowIndex < rows.length; rowIndex++) {
      const rowConfig = rows[rowIndex];
      const rowData = new Map();
      this._gridDataMap.set(rowIndex, rowData);

      // Process each source in the row
      const sources = rowConfig.sources || [];
      for (const sourceConfig of sources) {
        const { type, column, source, format, value, aggregation } = sourceConfig;

        // Handle static values
        if (type === 'static') {
          rowData.set(column, { value, type: 'static' });
          continue;
        }

        // Handle template values
        if (type === 'template') {
          const resolved = await this.processTemplate(value);
          rowData.set(column, { value: resolved, type: 'template' });
          continue;
        }

        // Handle datasource values
        if (type === 'datasource' && source) {
          // Initialize with loading state
          rowData.set(column, { value: '...', type: 'datasource', source });

          // Get or create data source
          let dataSource = dataSourceManager.getSource(source);
          if (!dataSource) {
            const isEntityId = /^[a-z_]+\.[a-z0-9_]+$/.test(source);
            if (isEntityId) {
              try {
                dataSource = await dataSourceManager.createDataSource(source, {
                  entity: source,
                  history: { enabled: aggregation ? true : false, hours: 1 }
                });
              } catch (error) {
                lcardsLog.warn(`[LCARdSDataGrid] Failed to create data source: ${source}`);
                rowData.set(column, { value: 'ERR', type: 'error' });
                continue;
              }
            }
          }

          if (dataSource) {
            // Subscribe to updates
            const unsubscribe = dataSource.subscribe((data) => {
              this._handleCellDataUpdate(rowIndex, column, data, format, aggregation);
            });
            this._dataSubscriptions.push(unsubscribe);

            // Get initial data
            const currentData = dataSource.getCurrentData();
            if (currentData) {
              this._handleCellDataUpdate(rowIndex, column, currentData, format, aggregation);
            }
          }
        }
      }
    }

    // Convert Map to array for rendering
    this._updateGridDataFromMap();

    lcardsLog.debug(`[LCARdSDataGrid] Spreadsheet grid initialized: ${rows.length} rows`);
  }

  /**
   * Handle data update for a specific cell
   * @private
   */
  _handleCellDataUpdate(rowIndex, colIndex, data, format, aggregation) {
    const rowData = this._gridDataMap?.get(rowIndex);
    if (!rowData) return;

    const oldCell = rowData.get(colIndex);
    const oldValue = oldCell?.value;

    // Apply aggregation if specified
    let value = data.v !== undefined ? data.v : data;
    if (Array.isArray(data) && aggregation) {
      switch (aggregation) {
        case 'min':
          value = Math.min(...data);
          break;
        case 'max':
          value = Math.max(...data);
          break;
        case 'avg':
          value = data.reduce((sum, v) => sum + v, 0) / data.length;
          break;
        case 'sum':
          value = data.reduce((sum, v) => sum + v, 0);
          break;
        case 'last':
          value = data[data.length - 1];
          break;
        case 'first':
          value = data[0];
          break;
        default:
          value = data[data.length - 1];
      }
    } else if (data.buffer && typeof data.buffer.getAll === 'function' && aggregation) {
      const values = data.buffer.getAll().map(p => p.v);
      if (values.length > 0) {
        switch (aggregation) {
          case 'min':
            value = Math.min(...values);
            break;
          case 'max':
            value = Math.max(...values);
            break;
          case 'avg':
            value = values.reduce((sum, v) => sum + v, 0) / values.length;
            break;
          default:
            value = values[values.length - 1];
        }
      }
    }

    // Format value
    const formattedValue = this._formatCellValue(value, format);

    // Update cell data
    rowData.set(colIndex, {
      value: formattedValue,
      type: 'datasource',
      changed: oldValue !== formattedValue
    });

    // Update grid data array
    this._updateGridDataFromMap();

    // Animate cell if value changed
    if (oldValue !== formattedValue) {
      this._animateCellChange(rowIndex, colIndex);
    }

    this.requestUpdate();
  }

  /**
   * Convert Map-based grid data to array for rendering
   * @private
   */
  _updateGridDataFromMap() {
    if (!this._gridDataMap) return;

    const rows = [];
    this._gridDataMap.forEach((rowData, rowIndex) => {
      const row = [];
      for (let col = 0; col < (this._columnConfig?.length || 0); col++) {
        const cell = rowData.get(col);
        row.push(cell?.value || '—');
      }
      rows.push(row);
    });

    this._gridData = rows;
  }

  /**
   * Format cell value using template string
   * @private
   * @param {*} value - Raw value
   * @param {string} format - Format template
   * @returns {string} Formatted value
   */
  _formatCellValue(value, format = '{value}') {
    if (value === null || value === undefined) return '—';

    const numValue = Number(value);
    const isNumber = !isNaN(numValue);

    return format
      .replace('{value}', String(value))
      .replace('{value:.0f}', isNumber ? Math.round(numValue).toString() : String(value))
      .replace('{value:.1f}', isNumber ? numValue.toFixed(1) : String(value))
      .replace('{value:.2f}', isNumber ? numValue.toFixed(2) : String(value))
      .replace('{value:+.1f}', isNumber ? (numValue >= 0 ? '+' : '') + numValue.toFixed(1) : String(value))
      .replace('{value:+.2f}', isNumber ? (numValue >= 0 ? '+' : '') + numValue.toFixed(2) : String(value));
  }

  // ============================================================================
  // CASCADE ANIMATION
  // ============================================================================

  /**
   * Setup cascade animation
   * @private
   */
  _setupCascadeAnimation() {
    const animation = this.config.animation;
    if (!animation || animation.type !== 'cascade') {
      this._stopCascadeAnimation();
      return;
    }

    // Get cascade colors from config or theme
    const colors = animation.colors || {};
    this._cascadeColors = [
      this.getThemeToken(colors.start || 'colors.lcars.blue') || '#99ccff',
      this.getThemeToken(colors.text || 'colors.lcars.dark-blue') || '#4466aa',
      this.getThemeToken(colors.end || 'colors.lcars.moonlight') || '#aaccff'
    ];

    // Get timing pattern
    const pattern = animation.pattern || 'default';
    this._cascadeTimingPattern = this._getAnimationTiming(pattern);

    // Start cascade if not frozen
    if (pattern !== 'frozen') {
      this._startCascadeAnimation();
    } else {
      // For frozen, apply initial state
      this._applyCascadeState(0);
    }

    this._cascadeActive = true;
  }

  /**
   * Get animation timing pattern
   * @private
   */
  _getAnimationTiming(patternName) {
    const patterns = {
      default: [
        { duration: 3000, delay: 100 },
        { duration: 3000, delay: 200 },
        { duration: 4000, delay: 300 },
        { duration: 4000, delay: 400 },
        { duration: 4000, delay: 500 },
        { duration: 2000, delay: 600 },
        { duration: 2000, delay: 700 },
        { duration: 2000, delay: 800 }
      ],
      niagara: Array(8).fill(null).map((_, i) => ({
        duration: 2000,
        delay: (i + 1) * 100
      })),
      fast: Array(8).fill(null).map((_, i) => ({
        duration: 1000,
        delay: i * 50
      })),
      frozen: [
        { duration: 0, delay: 0 }
      ]
    };

    // Support custom timing from config
    if (patternName === 'custom' && this.config.animation?.timing) {
      return this.config.animation.timing;
    }

    return patterns[patternName] || patterns.default;
  }

  /**
   * Start cascade animation loop
   * @private
   */
  _startCascadeAnimation() {
    if (this._cascadeInterval) {
      clearInterval(this._cascadeInterval);
    }

    const cycleDuration = this.config.animation?.cycle_duration || 5000;

    this._cascadeInterval = setInterval(() => {
      this._currentCascadeStep = (this._currentCascadeStep + 1) % this._cascadeColors.length;
      this._applyCascadeState(this._currentCascadeStep);
    }, cycleDuration);

    // Apply initial state
    this._applyCascadeState(0);
  }

  /**
   * Stop cascade animation
   * @private
   */
  _stopCascadeAnimation() {
    if (this._cascadeInterval) {
      clearInterval(this._cascadeInterval);
      this._cascadeInterval = null;
    }
    this._cascadeActive = false;
  }

  /**
   * Apply cascade state to rows
   * @private
   */
  _applyCascadeState(step) {
    // Animation is applied via CSS variables that are set per-row
    // The actual color cycling happens in the render method
    this._currentCascadeStep = step;
    this.requestUpdate();
  }

  // ============================================================================
  // CHANGE DETECTION
  // ============================================================================

  /**
   * Detect changes and trigger animations
   * Optimized to limit maximum animations for large grids
   * @private
   */
  _detectAndAnimateChanges() {
    if (!this.config.animation?.highlight_changes) {
      return;
    }

    if (!this._previousGridData || !this._gridData) {
      return;
    }

    // Maximum number of cells to animate (prevents performance issues on large grids)
    const maxAnimations = this.config.animation?.max_highlight_cells || 50;

    // Find changed cells with early termination
    const changedCells = [];
    outer: for (let rowIndex = 0; rowIndex < this._gridData.length; rowIndex++) {
      const row = this._gridData[rowIndex];
      for (let colIndex = 0; colIndex < row.length; colIndex++) {
        const oldValue = this._previousGridData[rowIndex]?.[colIndex];
        if (oldValue !== row[colIndex]) {
          changedCells.push({ row: rowIndex, col: colIndex });
          if (changedCells.length >= maxAnimations) {
            break outer; // Early termination for performance
          }
        }
      }
    }

    if (changedCells.length === 0) return;

    lcardsLog.debug('[LCARdSDataGrid] Detected changes:', changedCells.length);

    // Animate each changed cell
    changedCells.forEach(({ row, col }) => {
      this._animateCellChange(row, col);
    });
  }

  /**
   * Animate a cell change
   * @private
   */
  _animateCellChange(rowIndex, colIndex) {
    const cell = this.renderRoot?.querySelector(
      `[data-row="${rowIndex}"][data-col="${colIndex}"]`
    );

    if (!cell) return;

    // Use CSS animation with animationend event for cleanup
    cell.classList.add('cell-changed');

    // Use animationend event to clean up class (more reliable than setTimeout)
    const handleAnimationEnd = () => {
      cell.classList.remove('cell-changed');
      cell.removeEventListener('animationend', handleAnimationEnd);
    };
    cell.addEventListener('animationend', handleAnimationEnd);
  }

  // ============================================================================
  // RENDERING
  // ============================================================================

  /**
   * Render the card
   * @protected
   */
  _renderCard() {
    if (this._error) {
      return html`
        <div class="lcards-card-container">
          <div class="grid-error">${this._error}</div>
        </div>
      `;
    }

    if (!this._gridData || this._gridData.length === 0) {
      return html`
        <div class="lcards-card-container">
          <div class="grid-loading">Loading...</div>
        </div>
      `;
    }

    const dataMode = this.config.data_mode || 'random';
    const layout = this.config.layout || 'cascade';

    // Spreadsheet layout has headers
    if (dataMode === 'datasource' && layout === 'spreadsheet' && this._columnConfig?.length > 0) {
      return this._renderSpreadsheetGrid();
    }

    // Default cascade/simple grid
    return this._renderCascadeGrid();
  }

  /**
   * Render cascade-style grid
   * @private
   */
  _renderCascadeGrid() {
    const grid = this.config.grid || {};
    const gap = grid.gap || 8;
    const cellWidth = grid.cell_width || 'auto';
    const fontSize = this.config.font_size || 18;
    const fontFamily = this.config.font_family || "'Antonio', 'Helvetica Neue', sans-serif";
    const fontWeight = this.config.font_weight || 400;
    const align = this.config.align || 'right';

    // Calculate columns
    const cols = this._gridData[0]?.length || 12;

    // Calculate cell width value
    const cellWidthValue = cellWidth === 'auto'
      ? '1fr'
      : (typeof cellWidth === 'number' ? `${cellWidth}px` : cellWidth);

    // Get colors
    const defaultColor = this.getThemeToken('colors.text.primary') || '#ffffff';

    // Generate grid styles
    const gridStyle = `
      grid-template-columns: repeat(${cols}, ${cellWidthValue});
      gap: ${gap}px;
      font-family: ${fontFamily};
      font-size: ${fontSize}px;
      font-weight: ${fontWeight};
    `;

    return html`
      <div class="lcards-card-container">
        <div class="data-grid-container">
          <div class="data-grid" style="${gridStyle}">
            ${this._gridData.map((row, rowIndex) =>
              row.map((cellValue, colIndex) => {
                // Calculate cascade color for this row
                const cellColor = this._getCascadeColorForRow(rowIndex, defaultColor);
                const cellPadding = `${gap / 2}px ${gap}px`;

                return html`
                  <div class="grid-cell align-${align} cascade-animate"
                       data-row="${rowIndex}"
                       data-col="${colIndex}"
                       style="color: ${cellColor}; padding: ${cellPadding};">
                    ${escapeHtml(String(cellValue))}
                  </div>
                `;
              })
            )}
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Get cascade color for a specific row
   * @private
   */
  _getCascadeColorForRow(rowIndex, defaultColor) {
    if (!this._cascadeActive || !this._cascadeColors.length) {
      return defaultColor;
    }

    // Get timing for this row
    const timing = this._cascadeTimingPattern[rowIndex % this._cascadeTimingPattern.length];

    // Calculate which color this row should be based on current step and delay
    const colorIndex = (this._currentCascadeStep + Math.floor(timing.delay / 100)) % this._cascadeColors.length;

    return this._cascadeColors[colorIndex] || defaultColor;
  }

  /**
   * Render spreadsheet-style grid with headers
   * @private
   */
  _renderSpreadsheetGrid() {
    const grid = this.config.grid || {};
    const gap = grid.gap || 8;
    const fontSize = this.config.font_size || 16;
    const fontFamily = this.config.font_family || "'Antonio', 'Helvetica Neue', sans-serif";
    const fontWeight = this.config.font_weight || 400;

    // Build grid-template-columns from column config
    const gridTemplateColumns = this._columnConfig
      .map(col => col.width ? `${col.width}px` : '1fr')
      .join(' ');

    const gridStyle = `
      grid-template-columns: ${gridTemplateColumns};
      gap: ${gap}px;
      font-family: ${fontFamily};
      font-size: ${fontSize}px;
      font-weight: ${fontWeight};
    `;

    // Get colors
    const textColor = this.getThemeToken('colors.text.primary') || '#ffffff';
    const headerBgColor = this.getThemeToken('colors.background.header') || '#1a1a1a';
    const headerTextColor = this.getThemeToken('colors.text.header') || '#def';
    const dividerColor = this.getThemeToken('colors.divider') || '#333';

    return html`
      <div class="lcards-card-container">
        <div class="data-grid-container">
          <div class="data-grid" style="${gridStyle}">
            <!-- Column headers -->
            ${this._columnConfig.map(col => html`
              <div class="grid-cell grid-header align-${col.align || 'left'}"
                   style="background: ${headerBgColor}; color: ${headerTextColor}; border-bottom-color: ${dividerColor}; padding: ${gap}px;">
                ${col.header || ''}
              </div>
            `)}

            <!-- Data rows -->
            ${this._gridData.map((row, rowIndex) =>
              row.map((cellValue, colIndex) => {
                const col = this._columnConfig[colIndex] || {};
                return html`
                  <div class="grid-cell align-${col.align || 'left'}"
                       data-row="${rowIndex}"
                       data-col="${colIndex}"
                       style="color: ${textColor}; padding: ${gap / 2}px ${gap}px;">
                    ${escapeHtml(String(cellValue))}
                  </div>
                `;
              })
            )}
          </div>
        </div>
      </div>
    `;
  }

  // ============================================================================
  // CARD SIZE & LAYOUT
  // ============================================================================

  /**
   * Get card size for Home Assistant layout
   * @returns {number} Height in 50px rows
   */
  getCardSize() {
    const grid = this.config.grid || {};
    const fontSize = this.config.font_size || 18;
    const gap = grid.gap || 8;
    const numRows = this._gridData?.length || grid.rows || 8;

    // Calculate total height
    const rowHeight = fontSize * 1.5;
    const totalHeight = (rowHeight * numRows) + (gap * (numRows - 1));

    return Math.ceil(totalHeight / 50);
  }

  /**
   * Get layout options for HA grid system
   * @returns {Object} Layout configuration
   */
  getLayoutOptions() {
    return {
      grid_columns: this.config.grid_columns !== undefined ? this.config.grid_columns : 'full',
      grid_rows: this.config.grid_rows || 'auto'
    };
  }

  /**
   * Get stub config for card picker
   */
  static getStubConfig() {
    return {
      type: 'custom:lcards-data-grid',
      data_mode: 'random',
      format: 'mixed',
      grid: {
        rows: 8,
        columns: 12,
        gap: 8
      },
      font_size: 18,
      animation: {
        type: 'cascade',
        pattern: 'default'
      }
    };
  }

  // ============================================================================
  // CLEANUP
  // ============================================================================

  /**
   * Cleanup on disconnect
   */
  disconnectedCallback() {
    // Track cleanup errors for debugging
    const cleanupErrors = [];

    // Stop cascade animation
    this._stopCascadeAnimation();

    // Stop random refresh
    if (this._randomRefreshInterval) {
      clearInterval(this._randomRefreshInterval);
      this._randomRefreshInterval = null;
    }

    // Unsubscribe from data sources
    this._dataSubscriptions.forEach((unsubscribe, index) => {
      try {
        unsubscribe();
      } catch (error) {
        cleanupErrors.push({ index, error: error.message });
        lcardsLog.warn(`[LCARdSDataGrid] Error unsubscribing from data source ${index}:`, error);
      }
    });
    this._dataSubscriptions = [];

    // Log summary of cleanup errors if any occurred
    if (cleanupErrors.length > 0) {
      lcardsLog.warn(`[LCARdSDataGrid] Cleanup completed with ${cleanupErrors.length} error(s)`, cleanupErrors);
    }

    super.disconnectedCallback();
  }
}
