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
 * - Cascade animations (row-by-row color cycling with authentic LCARS timing)
 * - Change detection with highlight animations (cell/row/column targeting)
 * - Theme token integration
 * - Responsive auto-sizing
 *
 * ============================================================================
 * ANIMATION CONFIGURATION
 * ============================================================================
 *
 * CASCADE ANIMATION (Continuous background effect)
 * Creates authentic LCARS waterfall color cycling effect with per-row timing.
 *
 * @example Basic Cascade
 * ```yaml
 * type: custom:lcards-data-grid
 * animation:
 *   type: cascade
 *   pattern: default  # 'default' | 'niagara' | 'fast' | 'frozen' | 'custom'
 *   colors:
 *     start: colors.lcars.blue
 *     text: colors.lcars.dark-blue
 *     end: colors.lcars.moonlight
 * ```
 *
 * @example Speed Control
 * ```yaml
 * animation:
 *   type: cascade
 *   pattern: default
 *   speed_multiplier: 2.0    # 2x faster (1500ms, 1000ms cycles)
 *   # OR
 *   duration: 1500           # Override all row durations to 1500ms
 *   colors:
 *     start: colors.lcars.blue
 *     text: colors.lcars.dark-blue
 *     end: colors.lcars.moonlight
 * ```
 *
 * @example Advanced Cascade
 * ```yaml
 * animation:
 *   type: cascade
 *   pattern: custom
 *   timing:
 *     - { duration: 3000, delay: 0.1 }  # Row 0
 *     - { duration: 2000, delay: 0.2 }  # Row 1
 *     - { duration: 4000, delay: 0.3 }  # Row 2 (pattern repeats)
 *   colors:
 *     start: '#99ccff'
 *     text: '#4466aa'
 *     end: '#aaccff'
 *   cell_stagger: 50  # ms between cells in same row
 *   easing: linear
 * ```
 *
 * CHANGE ANIMATION (One-shot highlight on data changes)
 * Highlights changed cells/rows/columns to draw user attention.
 *
 * @example Cell-level Change Highlight
 * ```yaml
 * change_animation:
 *   preset: pulse        # Any animation preset
 *   target_mode: cell    # 'cell' | 'row' | 'column'
 *   duration: 500
 *   params:
 *     max_scale: 1.08
 *     min_opacity: 0.8
 * ```
 *
 * @example Row-level Change Highlight
 * ```yaml
 * change_animation:
 *   preset: glow
 *   target_mode: row     # Entire row glows
 *   duration: 600
 *   params:
 *     color: var(--lcars-orange)
 *     blur_max: 12
 * ```
 *
 * ============================================================================
 * DATA MODES
 * ============================================================================
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
import { resolveThemeTokensRecursive } from '../utils/lcards-theme.js';
import { dataGridSchema } from './schemas/data-grid-schema.js';

// Import editor component for getConfigElement()
import '../editor/cards/lcards-data-grid-editor.js';

export class LCARdSDataGrid extends LCARdSCard {
  /** Card type identifier for CoreConfigManager */
  static CARD_TYPE = 'data-grid';

  static get properties() {
    return {
      ...super.properties,
      _gridData: { type: Array, state: true },
      _containerSize: { type: Object, state: true },
      editorMode: { type: Boolean } // Enable WYSIWYG data attributes (optional, for studio dialog)
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

        /* Loading state */
        .grid-loading {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 100%;
          height: 100%;
          color: var(--primary-text-color, var(--lcards-moonlight, #d3d3d3));
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
    this._dataSubscriptions = [];
    this._templateEntities = [];
    this._previousGridData = null;
    this._error = null;
    this._columnConfig = [];
    this._rowConfig = [];
    this._isInitialized = false;
    this._styleCache = new Map(); // Style cache for performance
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

    // Initialize animation scope (always needed for change detection)
    await this._initializeAnimationScope();

    // Setup cascade animation if configured
    await this._setupCascadeAnimation();

    this._isInitialized = true;
  }

  /**
   * Called when config is set
   * @protected
   */
  async _onConfigSet(config) {
    super._onConfigSet(config);

    // Invalidate style cache when config changes
    this._invalidateStyleCache();

    // Re-initialize if already initialized and config changes
    if (this._isInitialized) {
      await this._initializeDataMode();
      await this._initializeAnimationScope();
      await this._setupCascadeAnimation();
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
   * Format cell value for display, handling null/undefined
   * @private
   * @param {*} value - Cell value
   * @returns {string} Display string (empty for null/undefined)
   */
  _formatCellValue(value) {
    if (value === null || value === undefined) {
      return '';
    }
    return String(value);
  }

  /**
   * Parse CSS Grid dimension from template string
   * Handles complex patterns: repeat(), minmax(), explicit values, or combinations
   *
   * Examples:
   *   "repeat(6, auto)" -> 6
   *   "100px 1fr 2fr" -> 3
   *   "minmax(80px, 1fr) repeat(4, 2fr) minmax(80px, 1fr)" -> 6
   *
   * @private
   * @param {string} template - CSS grid-template value
   * @returns {number} Number of tracks
   */
  _parseGridDimension(template) {
    if (!template) return null;

    let count = 0;
    let remaining = template.trim();

    // Process repeat() functions - may be multiple
    const repeatRegex = /repeat\((\d+),\s*[^)]+\)/g;
    let repeatMatch;
    while ((repeatMatch = repeatRegex.exec(template)) !== null) {
      count += parseInt(repeatMatch[1], 10);
      // Remove matched repeat from remaining string
      remaining = remaining.replace(repeatMatch[0], '');
    }

    // Count remaining explicit values (including minmax(), fit-content(), etc.)
    // These are separated by whitespace, but we need to handle nested parentheses
    remaining = remaining.trim();
    if (remaining) {
      // Remove all matched repeat() expressions
      const parts = [];
      let depth = 0;
      let current = '';

      for (let i = 0; i < remaining.length; i++) {
        const char = remaining[i];

        if (char === '(') {
          depth++;
          current += char;
        } else if (char === ')') {
          depth--;
          current += char;
        } else if (char === ' ' && depth === 0) {
          if (current.trim()) {
            parts.push(current.trim());
            current = '';
          }
        } else {
          current += char;
        }
      }

      if (current.trim()) {
        parts.push(current.trim());
      }

      count += parts.length;
    }

    return count > 0 ? count : null;
  }

  /**
   * Initialize random/decorative mode
   * @private
   */
  _initializeRandomMode() {
    const grid = this.config.grid || {};

    // Try new CSS Grid format first, fall back to old shorthand
    let rows = null;
    let columns = null;

    if (grid['grid-template-rows']) {
      rows = this._parseGridDimension(grid['grid-template-rows']);
    }
    if (grid['grid-template-columns']) {
      columns = this._parseGridDimension(grid['grid-template-columns']);
    }

    // Fall back to old shorthand format
    if (!rows) rows = grid.rows || 8;
    if (!columns) columns = grid.columns || 12;

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

      // Parse grid dimensions - try new CSS Grid format first, fall back to old shorthand
      let rows = null;
      let columns = null;

      if (grid['grid-template-rows']) {
        rows = this._parseGridDimension(grid['grid-template-rows']);
      }
      if (grid['grid-template-columns']) {
        columns = this._parseGridDimension(grid['grid-template-columns']);
      }

      // Fall back to old shorthand format
      if (!rows) rows = grid.rows || 8;
      if (!columns) columns = grid.columns || 12;

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

    // Store row config for hierarchical styling
    // Normalize to ensure _rowConfig always contains row objects
    this._rowConfig = rows.map(row => {
      // New object format: {values: [...], style: {...}, cellStyles: [...]}
      if (row && typeof row === 'object' && !Array.isArray(row)) {
        return row;
      }
      // Old array format: convert to object
      return { values: row };
    });

    // Extract entity dependencies from templates
    this._extractTemplateDependencies(rows);

    // Process templates
    await this._processTemplateGrid();
  }

  /**
   * Process template-based grid data
   * Supports both formats:
   * 1. Old: rows = [['val1', 'val2'], ['val3', 'val4']]
   * 2. New: rows = [{values: ['val1', 'val2'], style: {...}}, ...]
   * @private
   */
  async _processTemplateGrid() {
    const rows = this.config.rows || [];

    const processedRows = await Promise.all(
      rows.map(async (row) => {
        // Handle new object format: {values: [...], style: {...}, cellStyles: [...]}
        if (row && typeof row === 'object' && !Array.isArray(row)) {
          if (!Array.isArray(row.values)) {
            lcardsLog.warn('[LCARdSDataGrid] Row object must have "values" array:', row);
            return [];
          }

          // Process the values array
          const processedValues = await Promise.all(
            row.values.map(async (cell) => {
              // Handle null/undefined - keep as-is for proper rendering
              if (cell === null || cell === undefined) return cell;

              // Process string templates
              if (typeof cell === 'string') {
                return await this.processTemplate(cell);
              }

              // Convert other types to string
              return String(cell);
            })
          );

          return processedValues;
        }

        // Handle old array format: ['val1', 'val2', 'val3']
        if (!Array.isArray(row)) {
          lcardsLog.warn('[LCARdSDataGrid] Template row must be an array or object with values:', row);
          return [];
        }

        return await Promise.all(
          row.map(async (cell) => {
            // Handle null/undefined - keep as-is for proper rendering
            if (cell === null || cell === undefined) return cell;

            // Process string templates
            if (typeof cell === 'string') {
              return await this.processTemplate(cell);
            }

            // Convert other types to string
            return String(cell);
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
   * Supports both old array format and new object format
   * @private
   * @param {Array} rows - Template rows (arrays or objects)
   */
  _extractTemplateDependencies(rows) {
    const entities = new Set();

    // Normalize rows to values arrays
    const allValues = rows.flatMap(row => {
      // New object format: {values: [...], style: {...}}
      if (row && typeof row === 'object' && !Array.isArray(row)) {
        return row.values || [];
      }
      // Old array format: ['val1', 'val2']
      return row;
    });

    allValues.forEach(cell => {
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

  /**
   * Process templates when tracked entities change (override from LCARdSCard)
   * @protected
   * @override
   */
  async _processTemplates() {
    // Call parent to handle icon/label templates
    await super._processTemplates();

    // Re-process template grid if in template mode
    if (this.config.data_mode === 'template') {
      await this._processTemplateGrid();
    }
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
    const configuredRows = this.config.grid?.rows || 8;
    const maxValues = configuredRows * columns;
    let values = [];

    // Handle different data formats
    if (data.buffer && typeof data.buffer.getAll === 'function') {
      // Rolling buffer data
      values = data.buffer.getAll().map(point => point.v);
      // Keep only most recent maxValues
      if (values.length > maxValues) {
        values = values.slice(-maxValues);
      }
    } else if (Array.isArray(data)) {
      values = data;
      // Keep only most recent maxValues
      if (values.length > maxValues) {
        values = values.slice(-maxValues);
      }
    } else if (data.v !== undefined) {
      // Single value - push to existing array or start new
      if (!this._timelineValues) {
        this._timelineValues = [];
      }
      this._timelineValues.push(data.v);

      // Keep only most recent maxValues (creates left-to-right flow)
      // Example: 1 row × 4 cols, values [11, 22, 33, 44, 55]
      // After slice: [22, 33, 44, 55] (oldest value 11 dropped from left)
      if (this._timelineValues.length > maxValues) {
        this._timelineValues = this._timelineValues.slice(-maxValues);
      }
      values = this._timelineValues;
    }

    // Store previous data for change detection
    this._previousGridData = this._gridData;

    // Timeline displays values left-to-right, filling rows sequentially
    // Most recent N values (where N = rows × columns)
    const rows = [];
    for (let r = 0; r < configuredRows; r++) {
      const rowStartIndex = r * columns;
      const rowValues = values.slice(rowStartIndex, rowStartIndex + columns);

      // Pad row with empty strings if not enough values yet
      while (rowValues.length < columns) {
        rowValues.push('');
      }

      const row = rowValues.map(value =>
        value !== '' ? this._formatCellValue(value, valueTemplate) : ''
      );
      rows.push(row);
    }

    this._gridData = rows;

    // NOTE: Change detection disabled for timeline mode
    // Timeline shifts all cell values as data flows, causing false positives.
    // Only the NEWEST value (rightmost cell) is truly "new", but detecting
    // this would require tracking cell positions vs values, which is complex.
    // For visual feedback in timeline mode, rely on cascade animation instead.

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
  // ANIMATION SCOPE INITIALIZATION
  // ============================================================================

  /**
   * Initialize animation scope for the data grid
   * This must be called before any animations (cascade or change detection)
   * Creates the AnimationManager scope that all animations will use
   * @private
   */
  async _initializeAnimationScope() {
    const animationManager = this._singletons?.animationManager;
    if (!animationManager) {
      lcardsLog.debug('[LCARdSDataGrid] AnimationManager not available for scope initialization');
      return;
    }

    // Get container element for AnimationManager scope
    const containerEl = this.renderRoot.querySelector('.data-grid-container');
    if (!containerEl) {
      lcardsLog.debug('[LCARdSDataGrid] Container element not found for animation scope (will retry on next update)');
      return;
    }

    const overlayId = this.config.id || `data-grid-${this._cardGuid}`;

    // Check if scope already exists
    const existingScope = animationManager.scopes.get(overlayId);
    if (existingScope) {
      lcardsLog.debug(`[LCARdSDataGrid] Animation scope already exists: ${overlayId}`);
      return;
    }

    // Create empty scope (animations will be added later if needed)
    try {
      await animationManager.onOverlayRendered(overlayId, containerEl, {
        animations: [] // Empty array - cascade will add animations if configured
      });
      lcardsLog.debug(`[LCARdSDataGrid] Animation scope initialized: ${overlayId}`);
    } catch (error) {
      lcardsLog.error('[LCARdSDataGrid] Failed to initialize animation scope:', error);
    }
  }

  // ============================================================================
  // CASCADE ANIMATION
  // ============================================================================

  /**
   * Setup cascade animation using AnimationManager
   * Creates independent animations per row for authentic LCARS cascade effect
   * @private
   */
  async _setupCascadeAnimation() {
    const animation = this.config.animation;
    if (!animation || animation.type !== 'cascade') {
      return;
    }

    const animationManager = this._singletons?.animationManager;
    if (!animationManager) {
      lcardsLog.warn('[LCARdSDataGrid] AnimationManager not available');
      return;
    }

    // Wait for render to complete
    await this.updateComplete;

    const overlayId = this.config.id || `data-grid-${this._cardGuid}`;
    const numRows = this._gridData.length;

    if (numRows === 0) {
      lcardsLog.debug('[LCARdSDataGrid] No rows to animate');
      return;
    }

    // Get container element for AnimationManager scope
    const containerEl = this.renderRoot.querySelector('.data-grid-container');
    if (!containerEl) {
      lcardsLog.warn('[LCARdSDataGrid] Container element not found for cascade animation');
      return;
    }

    // Helper to normalize colors for anime.js compatibility
    // anime.js v4 cannot interpolate between CSS vars and hex colors - they must be same format
    // Additionally, anime.js has issues with CSS var fallbacks in looping animations
    const normalizeColor = (colorValue) => {
      if (!colorValue) return null;

      // If it's already a CSS variable, check if it has a fallback
      if (typeof colorValue === 'string' && colorValue.startsWith('var(')) {
        // Strip fallback values from CSS variables for anime.js compatibility
        // Convert: var(--name, fallback) -> var(--name)
        const match = colorValue.match(/^var\((--[^,)]+)/);
        if (match) {
          return `var(${match[1]})`;
        }
        return colorValue;
      }

      // If it's a hex color, wrap it in a CSS var format for consistency
      // This allows anime.js to handle all colors uniformly
      if (typeof colorValue === 'string' && colorValue.startsWith('#')) {
        return `var(--dummy, ${colorValue})`;
      }

      // Named colors or other formats - wrap them too
      return `var(--dummy, ${colorValue})`;
    };

    // Get cascade colors from config or theme
    const colors = animation.colors || {};
    const rawColors = [
      this.getThemeToken(colors.start || 'colors.grid.cascadeStart') || '#99ccff',
      this.getThemeToken(colors.text || 'colors.grid.cascadeMid') || '#4466aa',
      this.getThemeToken(colors.end || 'colors.grid.cascadeEnd') || '#aaccff'
    ];

    // Normalize all colors to CSS var format for anime.js compatibility
    const cascadeColors = rawColors.map(normalizeColor);

    // Get timing pattern (default, niagara, fast, custom)
    const pattern = animation.pattern || 'default';
    const timingPattern = this._getAnimationTiming(pattern);

    // User can override duration globally (affects all rows)
    const durationOverride = animation.duration;

    // Or use speed multiplier (2.0 = twice as fast, 0.5 = half speed)
    const speedMultiplier = animation.speed_multiplier !== undefined ? animation.speed_multiplier : 1.0;

    lcardsLog.debug(`[LCARdSDataGrid] Setting up cascade animation for ${numRows} rows with pattern: ${pattern}`, {
      speedMultiplier,
      durationOverride
    });

    // Build animation definitions for all rows
    const rowAnimations = [];
    for (let rowIndex = 0; rowIndex < numRows; rowIndex++) {
      const timing = timingPattern[rowIndex % timingPattern.length];

      // Calculate final duration: override > multiplier > pattern default
      let finalDuration = timing.duration;
      if (durationOverride !== undefined) {
        finalDuration = durationOverride;
      } else if (speedMultiplier !== 1.0) {
        finalDuration = timing.duration / speedMultiplier;
      }

      rowAnimations.push({
        trigger: 'on_load',
        preset: 'cascade-color',
        targets: `.grid-cell[data-row="${rowIndex}"]`,
        params: {
          colors: cascadeColors,
          duration: finalDuration,
          delay: timing.delay * 1000, // Convert to ms - this is when the row starts
          loop: true, // Cascade animations always loop
          alternate: false, // Legacy uses normal direction (no reverse)
          property: 'color',
          easing: animation.easing || 'linear'
        }
      });
    }

    // Register cascade animations with the existing scope
    // Scope was already created by _initializeAnimationScope()
    try {
      const scopeData = animationManager.scopes.get(overlayId);
      if (!scopeData) {
        lcardsLog.error('[LCARdSDataGrid] Animation scope not found for cascade setup');
        return;
      }

      // Register each row animation
      for (const animDef of rowAnimations) {
        await animationManager.registerAnimation(overlayId, animDef);
      }

      lcardsLog.debug(`[LCARdSDataGrid] Cascade animation setup complete for ${numRows} rows`);
    } catch (error) {
      lcardsLog.error('[LCARdSDataGrid] Failed to setup cascade animation:', error);
    }
  }  /**
   * Get animation timing pattern
   * These patterns are authentic LCARS animation timings from legacy CB-LCARS
   * @private
   */
  _getAnimationTiming(patternName) {
    const patterns = {
      // Default LCARS pattern: slow → slower → fast (authentic rhythm)
      default: [
        { duration: 3000, delay: 0.1 },
        { duration: 3000, delay: 0.2 },
        { duration: 4000, delay: 0.3 },
        { duration: 4000, delay: 0.4 },
        { duration: 4000, delay: 0.5 },
        { duration: 2000, delay: 0.6 },
        { duration: 2000, delay: 0.7 },
        { duration: 2000, delay: 0.8 }
      ],

      // Niagara: Smooth uniform cascade
      niagara: Array(8).fill(null).map((_, i) => ({
        duration: 2000,
        delay: (i + 1) * 0.1
      })),

      // Fast: Quick waterfall effect
      fast: Array(8).fill(null).map((_, i) => ({
        duration: 1000,
        delay: i * 0.05
      }))
    };

    // Support custom timing from config
    if (patternName === 'custom' && this.config.animation?.timing) {
      return this.config.animation.timing;
    }

    return patterns[patternName] || patterns.default;
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
    // Default to total grid size for small grids, or user-specified limit
    const totalCells = this._gridData.length * (this._gridData[0]?.length || 0);
    const defaultMax = Math.min(totalCells, 100); // Cap at 100 for very large grids
    const maxAnimations = this.config.animation?.max_highlight_cells !== undefined
      ? this.config.animation.max_highlight_cells
      : defaultMax;

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
   * Animate a cell change with flexible targeting
   * Supports cell-level, row-level, or column-level highlights
   * @private
   * @param {number} rowIndex - Row index of changed cell
   * @param {number} colIndex - Column index of changed cell
   */
  async _animateCellChange(rowIndex, colIndex) {
    const animationManager = this._singletons?.animationManager;

    // Fallback to CSS animation if AnimationManager not available
    if (!animationManager) {
      this._animateCellChangeFallback(rowIndex, colIndex);
      return;
    }

    // Build target selector
    const targetSelector = `.grid-cell[data-row="${rowIndex}"][data-col="${colIndex}"]`;

    // Check if cell exists RIGHT NOW (no waiting, change happens during re-render)
    const cellExists = this.renderRoot.querySelector(targetSelector);
    if (!cellExists) {
      // Cell not rendered yet, skip animation silently
      return;
    }

    const overlayId = this.config.id || `data-grid-${this._cardGuid}`;
    const scopeData = animationManager.scopes.get(overlayId);

    if (!scopeData) {
      lcardsLog.warn('[LCARdSDataGrid] No animation scope found for cell change');
      this._animateCellChangeFallback(rowIndex, colIndex);
      return;
    }

    // Get preset from config (default to 'pulse')
    const changePreset = this.config.animation?.change_preset || 'pulse';

    // Get animation parameters from config
    // For change detection, we want the animation to return to original state after playing once
    // Use loop:1 with alternate:true to play forward then back (total 2 iterations)
    const changeParams = {
      duration: this.config.animation?.change_duration || 500,
      easing: this.config.animation?.change_easing || 'easeOutQuad',
      loop: 1,            // Play twice total (forward + back in alternate mode)
      alternate: true,    // Return to original state after animation
      ...(this.config.animation?.change_params || {})
    };    // Use anime.js directly on the element (bypass waitForElements since we already have it)
    try {
      // Get preset function from window.lcards.anim.presets
      const presetFn = window.lcards.anim?.presets?.[changePreset];
      if (!presetFn) {
        lcardsLog.warn(`[LCARdSDataGrid] Unknown preset: ${changePreset}, falling back to CSS`);
        this._animateCellChangeFallback(rowIndex, colIndex);
        return;
      }

      // Get preset configuration
      const presetResult = presetFn({ params: changeParams });

      // Apply CSS styles
      if (presetResult.styles) {
        Object.assign(cellExists.style, presetResult.styles);
      }

      // Run anime.js animation directly on the element
      // In anime.js v4, the target is passed as first arg, not as 'targets' property
      const animeParams = {
        ...presetResult.anime
      };

      // Create animation instance using the scope
      scopeData.scope.add(() => {
        window.lcards.anim.anime(cellExists, animeParams);
      });

      lcardsLog.debug(
        `[LCARdSDataGrid] Cell change animation: preset=${changePreset}, row=${rowIndex}, col=${colIndex}`
      );
    } catch (error) {
      lcardsLog.error('[LCARdSDataGrid] Failed to animate cell change:', error);
      this._animateCellChangeFallback(rowIndex, colIndex);
    }
  }

  /**
   * Fallback CSS-based cell animation
   * Used when AnimationManager is not available
   * @private
   */
  _animateCellChangeFallback(rowIndex, colIndex) {
    const cell = this.renderRoot?.querySelector(
      `.grid-cell[data-row="${rowIndex}"][data-col="${colIndex}"]`
    );

    if (!cell) return;

    // Use CSS animation with animationend event for cleanup
    cell.classList.add('cell-changed');

    // Use animationend event to clean up class
    const handleAnimationEnd = () => {
      cell.classList.remove('cell-changed');
      cell.removeEventListener('animationend', handleAnimationEnd);
    };
    cell.addEventListener('animationend', handleAnimationEnd);
  }

  // ============================================================================
  // HIERARCHICAL CELL STYLING SYSTEM
  // ============================================================================

  /**
   * Get default grid-wide style with theme token defaults
   * @private
   * @returns {Object} Default style object
   */
  _getDefaultGridStyle() {
    return {
      font_size: 24,  // Match legacy card
      font_family: "'Antonio', 'Helvetica Neue', sans-serif",
      font_weight: 400,
      color: this.getThemeToken('colors.grid.cellText', this.getThemeToken('colors.text.primary', '#99ccff')),
      background: this.getThemeToken('colors.grid.cellBackground', 'transparent'),
      align: 'right',  // Right-justified like legacy card
      padding: '4px'
    };
  }

  /**
   * Get default header style with theme token defaults
   * @private
   * @returns {Object} Default header style object
   */
  _getDefaultHeaderStyle() {
    return {
      background: this.getThemeToken('colors.grid.headerBackground', this.getThemeToken('colors.background.header', '#1a1a1a')),
      color: this.getThemeToken('colors.grid.headerText', this.getThemeToken('colors.text.header', '#def')),
      font_size: 16,
      font_weight: 700,
      text_transform: 'uppercase',
      padding: '12px 8px',
      border_bottom_width: 2,
      border_bottom_color: this.getThemeToken('colors.grid.divider', this.getThemeToken('colors.divider', '#333')),
      border_bottom_style: 'solid'
    };
  }

  /**
   * Resolve cell style through hierarchy: grid → header → column → row → cell
   *
   * Style hierarchy (lower overrides higher):
   * 1. Grid-wide defaults (config.style)
   * 2. Header defaults (config.header_style) - only for header rows
   * 3. Column-level overrides (columns[i].style)
   * 4. Row-level overrides (rows[i].style)
   * 5. Cell-level overrides (rows[i].sources[j].style or rows[i].values[j].style)
   *
   * @param {number} rowIndex - Row index (0-based)
   * @param {number} colIndex - Column index (0-based)
   * @param {boolean} isHeader - Whether this is a header cell
   * @returns {Object} Resolved style object
   * @private
   */
  _resolveCellStyle(rowIndex, colIndex, isHeader = false) {
    // Check cache first
    const cacheKey = `${rowIndex}-${colIndex}-${isHeader}`;
    if (this._styleCache?.has(cacheKey)) {
      return this._styleCache.get(cacheKey);
    }

    // Start with theme-based defaults
    let style = this._getDefaultGridStyle();

    // Merge with user-configured grid-wide style
    if (this.config.style) {
      style = this._mergeStyle(style, this.config.style);
    }

    // Apply header defaults and user header style if this is a header row
    if (isHeader) {
      const headerDefaults = this._getDefaultHeaderStyle();
      style = this._mergeStyle(style, headerDefaults);

      if (this.config.header_style) {
        style = this._mergeStyle(style, this.config.header_style);
      }
    }

    // Apply column-level style (if column config exists)
    if (this._columnConfig && this._columnConfig[colIndex]?.style) {
      style = this._mergeStyle(style, this._columnConfig[colIndex].style);
    }

    // Apply row-level style
    const rowConfig = this._rowConfig?.[rowIndex];
    if (rowConfig?.style) {
      style = this._mergeStyle(style, rowConfig.style);
    }

    // Apply cell-level style (highest priority)
    // For spreadsheet mode: check sources array
    if (rowConfig?.sources) {
      const cellSource = rowConfig.sources.find(s => s.column === colIndex);
      if (cellSource?.style) {
        style = this._mergeStyle(style, cellSource.style);
      }
    }
    // For template mode: check if row has style array
    else if (rowConfig?.cellStyles && rowConfig.cellStyles[colIndex]) {
      style = this._mergeStyle(style, rowConfig.cellStyles[colIndex]);
    }

    // Cache the resolved style
    if (!this._styleCache) {
      this._styleCache = new Map();
    }
    this._styleCache.set(cacheKey, style);

    return style;
  }

  /**
   * Merge source style into target style, resolving theme tokens
   *
   * Uses resolveThemeTokensRecursive() utility for consistency across all cards.
   * Requires explicit 'theme:' prefix for all token references.
   *
   * @param {Object} target - Target style object
   * @param {Object} source - Source style object to merge
   * @returns {Object} Merged style object
   * @private
   */
  _mergeStyle(target, source) {
    // Merge styles first
    const merged = { ...target, ...source };

    // Resolve all theme tokens recursively (requires 'theme:' prefix)
    if (this._singletons?.themeManager) {
      return resolveThemeTokensRecursive(merged, this._singletons.themeManager);
    }

    return merged;
  }

  /**
   * Convert style object to inline CSS string
   *
   * Handles special cases:
   * - align → justify-content mapping
   * - Numeric values → px units (except font_weight, opacity, etc.)
   * - Underscore properties → kebab-case CSS properties
   *
   * @param {Object} style - Style object
   * @param {Object} [options] - Optional conversion options
   * @param {boolean} [options.excludeColor] - If true, skip color property (for animations)
   * @returns {string} CSS string for inline style attribute
   * @private
   */
  _styleToCSS(style, options = {}) {
    if (!style || typeof style !== 'object') {
      return '';
    }

    const cssProps = [];

    // Properties that should not get 'px' suffix when numeric
    const unitlessProps = [
      'opacity', 'font_weight', 'fontWeight', 'z_index', 'zIndex',
      'flex_grow', 'flexGrow', 'flex_shrink', 'flexShrink',
      'line_height', 'lineHeight'
    ];

    // Map of property name conversions
    const propertyMap = {
      'align': 'justify-content',
      'font_size': 'font-size',
      'font_family': 'font-family',
      'font_weight': 'font-weight',
      'text_transform': 'text-transform',
      'background': 'background',
      'border_width': 'border-width',
      'border_color': 'border-color',
      'border_style': 'border-style',
      'border_bottom_width': 'border-bottom-width',
      'border_bottom_color': 'border-bottom-color',
      'border_bottom_style': 'border-bottom-style',
      'border_top_width': 'border-top-width',
      'border_top_color': 'border-top-color',
      'border_top_style': 'border-top-style',
      'border_radius': 'border-radius'
    };

    // Alignment value mapping
    const alignMap = {
      'left': 'flex-start',
      'center': 'center',
      'right': 'flex-end'
    };

    for (const [key, value] of Object.entries(style)) {
      if (value == null) continue;

      // Skip color property if requested (for cascade animations)
      // Inline color styles block anime.js color animations
      if (options.excludeColor && key === 'color') {
        continue;
      }

      // Skip non-style properties
      if (key === 'width' && typeof value === 'number') {
        // Column width is handled separately
        continue;
      }

      let cssProp = propertyMap[key] || key.replace(/_/g, '-');
      let cssValue = value;

      // Special handling for align property
      if (key === 'align' && typeof value === 'string') {
        cssProp = 'justify-content';
        cssValue = alignMap[value] || value;
      }

      // Add px unit to numeric values (except unitless properties)
      if (typeof cssValue === 'number' && !unitlessProps.includes(key)) {
        cssValue = `${cssValue}px`;
      }

      cssProps.push(`${cssProp}: ${cssValue}`);
    }

    return cssProps.join('; ');
  }

  /**
   * Get cached cell style with cache invalidation on config changes
   *
   * @param {number} rowIndex - Row index
   * @param {number} colIndex - Column index
   * @param {boolean} isHeader - Whether this is a header cell
   * @returns {Object} Cached or newly resolved style
   * @private
   */
  _getCachedCellStyle(rowIndex, colIndex, isHeader = false) {
    return this._resolveCellStyle(rowIndex, colIndex, isHeader);
  }

  /**
   * Invalidate the style cache (call when config changes)
   * @private
   */
  _invalidateStyleCache() {
    if (this._styleCache) {
      this._styleCache.clear();
    }
  }

  // ============================================================================
  // CSS GRID CONFIGURATION
  // ============================================================================

  /**
   * Convert grid configuration to CSS Grid properties
   *
   * Supports both:
   * 1. Standard CSS Grid properties (new format):
   *    grid-template-columns, grid-template-rows, gap, etc.
   *
   * 2. Backward-compatible shorthand (old format):
   *    rows: 8, columns: 12, gap: 8, cell_width: 'auto'
   *
   * @param {Object} gridConfig - Grid configuration object
   * @param {number} [cols] - Optional column count override (for dynamic grids)
   * @returns {Object} Object with CSS Grid properties
   * @private
   */
  _parseGridConfig(gridConfig = {}, cols = null) {
    const cssProps = {};

    // Check if using old shorthand format
    const hasShorthand = gridConfig.rows || gridConfig.columns || gridConfig.cell_width;

    if (hasShorthand) {
      // Log deprecation warning with migration guidance
      if (!this._hasLoggedDeprecation) {
        lcardsLog.warn(
          '[LCARdSDataGrid] Shorthand grid config (rows, columns, gap, cell_width) is deprecated. ' +
          'Use standard CSS Grid properties (grid-template-columns, grid-template-rows, gap) instead. ' +
          'See documentation: doc/user/configuration/cards/data-grid.md#grid-configuration'
        );
        this._hasLoggedDeprecation = true;
      }

      // Convert shorthand to CSS Grid properties
      const columns = cols || gridConfig.columns || 12;
      const rows = gridConfig.rows || 8;
      const cellWidth = gridConfig.cell_width || 'auto';
      const gap = gridConfig.gap || 8;

      // Convert cell_width to grid-template-columns
      const cellWidthValue = cellWidth === 'auto'
        ? '1fr'
        : (typeof cellWidth === 'number' ? `${cellWidth}px` : cellWidth);

      cssProps['grid-template-columns'] = `repeat(${columns}, ${cellWidthValue})`;
      cssProps['grid-template-rows'] = `repeat(${rows}, auto)`;
      cssProps['gap'] = typeof gap === 'number' ? `${gap}px` : gap;
    } else {
      // Use standard CSS Grid properties
      // Copy all CSS Grid properties from config
      const validGridProps = [
        'grid-template-columns', 'grid-template-rows', 'grid-template-areas',
        'grid-template', 'grid-auto-columns', 'grid-auto-rows', 'grid-auto-flow',
        'gap', 'row-gap', 'column-gap', 'grid-gap', 'grid-row-gap', 'grid-column-gap',
        'justify-items', 'align-items', 'place-items',
        'justify-content', 'align-content', 'place-content'
      ];

      for (const prop of validGridProps) {
        if (gridConfig[prop]) {
          let value = gridConfig[prop];

          // Add px unit to numeric gap values
          if ((prop === 'gap' || prop.includes('gap')) && typeof value === 'number') {
            value = `${value}px`;
          }

          cssProps[prop] = value;
        }
      }

      // Set defaults if not specified
      if (!cssProps['grid-template-columns']) {
        const columns = cols || 12;
        cssProps['grid-template-columns'] = `repeat(${columns}, 1fr)`;
      }
      // Only add default gap if neither gap, row-gap, nor column-gap are specified
      if (!cssProps['gap'] && !cssProps['row-gap'] && !cssProps['column-gap']) {
        cssProps['gap'] = '8px';
      }
    }

    return cssProps;
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

    // Calculate columns from actual grid data
    const cols = this._gridData[0]?.length || 12;

    // Parse grid configuration (handles both old and new formats)
    const gridCssProps = this._parseGridConfig(grid, cols);

    // Build grid style string from CSS properties
    const gridStyleParts = [];
    for (const [prop, value] of Object.entries(gridCssProps)) {
      gridStyleParts.push(`${prop}: ${value}`);
    }

    // Add typography from grid-wide style or config defaults
    const gridStyle = this.config.style || {};
    const fontSize = gridStyle.font_size || this.config.font_size || 24;  // Match legacy card
    const fontFamily = gridStyle.font_family || this.config.font_family || "'Antonio', 'Helvetica Neue', sans-serif";
    const fontWeight = gridStyle.font_weight || this.config.font_weight || 400;

    gridStyleParts.push(`font-family: ${fontFamily}`);
    gridStyleParts.push(`font-size: ${typeof fontSize === 'number' ? fontSize + 'px' : fontSize}`);
    gridStyleParts.push(`font-weight: ${fontWeight}`);

    const gridStyleStr = gridStyleParts.join('; ');

    return html`
      <div class="lcards-card-container">
        <div class="data-grid-container">
          <div class="data-grid" style="${gridStyleStr}">
            ${this._gridData.map((row, rowIndex) =>
              row.map((cellValue, colIndex) => {
                // Resolve cell style through hierarchy
                const cellStyle = this._getCachedCellStyle(rowIndex, colIndex, false);

                // Exclude color from inline styles if cascade animation is active
                // (inline color styles block anime.js color animations)
                const hasCascadeAnimation = this.config.animation?.type === 'cascade';
                const cellCss = this._styleToCSS(cellStyle, { excludeColor: hasCascadeAnimation });

                // Get alignment (default to right for cascade grid)
                const align = cellStyle.align || this.config.align || 'right';

                return html`
                  <div class="grid-cell align-${align}"
                       data-row="${rowIndex}"
                       data-col="${colIndex}"
                       style="${cellCss}">
                    ${escapeHtml(this._formatCellValue(cellValue))}
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
   * Render spreadsheet-style grid with headers
   * @private
   */
  _renderSpreadsheetGrid() {
    const grid = this.config.grid || {};

    // Build grid-template-columns from column config or parse from grid config
    let gridCssProps;
    if (this._columnConfig && this._columnConfig.length > 0) {
      // Use column widths from column config
      const gridTemplateColumns = this._columnConfig
        .map(col => col.width ? `${col.width}px` : '1fr')
        .join(' ');

      gridCssProps = this._parseGridConfig(grid);
      gridCssProps['grid-template-columns'] = gridTemplateColumns;
    } else {
      gridCssProps = this._parseGridConfig(grid);
    }

    // Build grid style string
    const gridStyleParts = [];
    for (const [prop, value] of Object.entries(gridCssProps)) {
      gridStyleParts.push(`${prop}: ${value}`);
    }

    // Add typography from grid-wide style or config defaults
    const gridStyle = this.config.style || {};
    const fontSize = gridStyle.font_size || this.config.font_size || 16;
    const fontFamily = gridStyle.font_family || this.config.font_family || "'Antonio', 'Helvetica Neue', sans-serif";
    const fontWeight = gridStyle.font_weight || this.config.font_weight || 400;

    gridStyleParts.push(`font-family: ${fontFamily}`);
    gridStyleParts.push(`font-size: ${typeof fontSize === 'number' ? fontSize + 'px' : fontSize}`);
    gridStyleParts.push(`font-weight: ${fontWeight}`);

    const gridStyleStr = gridStyleParts.join('; ');

    return html`
      <div class="lcards-card-container">
        <div class="data-grid-container">
          <div class="data-grid" style="${gridStyleStr}">
            <!-- Column headers -->
            ${this._columnConfig.map((col, colIndex) => {
              // Resolve header cell style through hierarchy
              const headerStyle = this._getCachedCellStyle(0, colIndex, true);
              const headerCss = this._styleToCSS(headerStyle);
              const align = col.align || headerStyle.align || 'left';

              return html`
                <div class="grid-cell grid-header align-${align}"
                     data-col="${colIndex}"
                     style="${headerCss}">
                  ${col.header || ''}
                </div>
              `;
            })}

            <!-- Data rows -->
            ${this._gridData.map((row, rowIndex) =>
              row.map((cellValue, colIndex) => {
                // Resolve cell style through hierarchy
                const cellStyle = this._getCachedCellStyle(rowIndex, colIndex, false);

                // Exclude color from inline styles if cascade animation is active
                const hasCascadeAnimation = this.config.animation?.type === 'cascade';
                const cellCss = this._styleToCSS(cellStyle, { excludeColor: hasCascadeAnimation });

                // Get alignment from resolved style or column config
                const col = this._columnConfig[colIndex] || {};
                const align = cellStyle.align || col.align || 'left';

                return html`
                  <div class="grid-cell align-${align}"
                       data-row="${rowIndex}"
                       data-col="${colIndex}"
                       style="${cellCss}">
                    ${escapeHtml(this._formatCellValue(cellValue))}
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
    const fontSize = this.config.font_size || 24;  // Match legacy card
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
        'grid-template-rows': 'repeat(6,auto)',
        'grid-template-columns': 'repeat(6,minmax(60px,1fr))',
        gap: '0px'
      },
      style: {
        padding: '0px',
        font_size: '22px'
      },
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
    // AnimationManager automatically cleans up scoped animations
    // No need to manually clear intervals

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
        lcardsLog.warn(`[LCARdSDataGrid] Error unsubscribing from data source ${index}:`, error);
      }
    });
    this._dataSubscriptions = [];

    super.disconnectedCallback();
  }

  /**
   * Get configuration element for Home Assistant UI editor
   * @static
   * @returns {string} Element tag name
   */
  static getConfigElement() {
    // Static import - editor bundled with card (webpack config doesn't support splitting)
    return document.createElement('lcards-data-grid-editor');
  }

  /**
   * Register schema with CoreConfigManager
   * Called by lcards.js after core initialization
   * @static
   */
  static registerSchema() {
    const configManager = window.lcards?.core?.configManager;

    if (!configManager) {
      lcardsLog.error('[LCARdSDataGrid] CoreConfigManager not available for schema registration');
      return;
    }

    // Register JSON schema with x-ui-hints for visual editor
    configManager.registerCardSchema('data-grid', dataGridSchema);

    lcardsLog.info('[LCARdSDataGrid] Schema registered with CoreConfigManager');
  }
}
