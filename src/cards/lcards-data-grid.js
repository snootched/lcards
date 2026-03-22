/**
 * LCARdS Data Grid Card
 *
 * A flexible grid visualization card for LCARdS that supports two data modes:
 * 1. Decorative - Generates random data for LCARS aesthetic
 * 2. Data - Real entity/sensor data with grid layout (static structure)
 *
 * Features:
 * - CSS Grid layout (native browser optimization)
 * - Cascade animations (row-by-row color cycling with authentic LCARS timing)
 * - Change detection with highlight animations
 * - Hierarchical styling system (grid → row → cell)
 * - Theme token integration
 * - Responsive auto-sizing
 *
 * Cell Type Auto-Detection (Data Mode):
 * - Static text: 'Label' or 'CPU'
 * - Entity reference: sensor.temperature (auto-subscribes)
 * - Template: '{{states.sensor.temp.state}}°C' (Jinja2)
 * - DataSource: '{datasource:temp_sensor:.1f}°C' (historical data)
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
 *   pattern: default  # 'default' | 'niagara' | 'fast' | 'custom'
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
 *   easing: linear
 * ```
 *
 * CHANGE ANIMATION (One-shot highlight on data changes)
 * Highlights changed cells to draw user attention.
 *
 * @example Cell Change Highlight with Pulse
 * ```yaml
 * animation:
 *   highlight_changes: true
 *   change_preset: pulse
 *   change_duration: 500
 *   change_params:
 *     max_scale: 1.08
 *     min_opacity: 0.8
 * ```
 *
 * @example Cell Change Highlight with Glow
 * ```yaml
 * animation:
 *   highlight_changes: true
 *   change_preset: glow
 *   change_duration: 600
 *   change_params:
 *     color: var(--lcars-orange)
 *     blur_max: 12
 * ```
 *
 * ============================================================================
 * DATA MODES
 * ============================================================================
 *
 * @example Decorative Mode (Auto-Generated Data)
 * ```yaml
 * type: custom:lcards-data-grid
 * data_mode: decorative
 * format: mixed  # 'digit' | 'float' | 'alpha' | 'hex' | 'mixed'
 * grid:
 *   grid-template-rows: repeat(8, auto)
 *   grid-template-columns: repeat(12, 1fr)
 *   gap: 8px
 * ```
 *
 * @example Data Mode - Grid Layout (Auto-Detected Cells)
 * ```yaml
 * type: custom:lcards-data-grid
 * data_mode: data
 * rows:
 *   - ['System', 'Value', 'Status']
 *   - ['CPU', sensor.cpu_usage, '{{states.sensor.cpu_usage.state|float > 80 and "HIGH" or "OK"}}']
 *   - ['Memory', sensor.memory_usage, '{datasource:mem_usage:.0f}%']
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
import { generateFilterString } from '../msd/utils/BaseSvgFilters.js';
import { ColorUtils } from '../core/themes/ColorUtils.js';
import { haFormatNumber } from '../utils/ha-entity-display.js';

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
          white-space: nowrap; /* Default - can be overridden by cell styles */
          overflow: hidden;
          text-overflow: ellipsis;
          transition: color 0.3s ease, background-color 0.3s ease;
          min-height: 1.5em; /* Prevent collapse when empty */
          padding: 4px 8px; /* Add padding for better visibility */
        }

        /* When white-space is set to wrap modes, adjust overflow behavior */
        .grid-cell[style*="white-space: normal"],
        .grid-cell[style*="white-space: pre-wrap"],
        .grid-cell[style*="white-space: pre-line"] {
          overflow-wrap: break-word;
          word-wrap: break-word;
          text-overflow: clip; /* No ellipsis when wrapping */
        }

        /* Empty cells show placeholder for better visibility */
        .grid-cell:empty::before {
          content: '—';
          opacity: 0.4;
          color: var(--secondary-text-color, #999);
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
    this._trackedEntities = [];  // Entities to track for updates (used in grid layout)
    this._previousGridData = null;
    this._error = null;
    this._rowConfig = [];
    this._columnConfig = [];
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
    this._registerOverlayForRules(overlayId, 'data-grid', this.config.tags || []);

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

    // Apply filters if configured
    this._applyFilters();

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
      this._applyFilters();
    }
  }

  /**
   * Handle HASS updates
   * @protected
   */
  _handleHassUpdate(newHass, oldHass) {
    // Check if any tracked entities changed (for grid layout)
    if (this._trackedEntities && this._trackedEntities.length > 0) {
      const hasChanges = this._trackedEntities.some(entityId => {
        const oldState = oldHass?.states?.[entityId]?.state;
        const newState = newHass?.states?.[entityId]?.state;
        return oldState !== newState;
      });

      if (hasChanges) {
        this._reprocessGridData();
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
    const dataMode = this.config.data_mode || 'decorative';

    lcardsLog.debug(`[LCARdSDataGrid] Initializing data mode: ${dataMode}`);

    try {
      switch (dataMode) {
        case 'decorative':
        case 'random':  // Legacy support
          this._initializeRandomMode();
          break;
        case 'data':
        case 'template':  // Legacy support
        case 'datasource':  // Legacy support
          await this._initializeDataLayoutMode();
          break;
        default:
          lcardsLog.error(`[LCARdSDataGrid] Unknown data_mode: ${dataMode}`);
          this._error = `Unknown data mode: ${dataMode}`;
      }
    } catch (error) {
      lcardsLog.error('[LCARdSDataGrid] Data mode initialization failed:', error);
      this._error = error.message;
    }

    this.requestUpdate();
  }

  /**
   * Initialize data mode (grid layout only)
   * @private
   */
  async _initializeDataLayoutMode() {
    lcardsLog.debug(`[LCARdSDataGrid] Data mode: initializing grid layout`);
    await this._initializeGridLayout();
  }

  // ============================================================================
  // MODE 1: RANDOM (DECORATIVE)
  // ============================================================================

  /**
   * Format cell value for display, handling null/undefined
   * Simple string conversion without template support
   * @private
   * @param {*} value - Cell value
   * @returns {string} Display string (empty for null/undefined)
   */
  _formatCellValueSimple(value) {
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
    // Match repeat() with proper nested parentheses handling
    const repeatRegex = /repeat\((\d+),\s*/g;
    let pos = 0;
    while (pos < remaining.length) {
      const match = repeatRegex.exec(remaining);
      if (!match) break;

      // Find matching closing parenthesis for this repeat()
      let depth = 1;
      let endPos = match.index + match[0].length;
      while (endPos < remaining.length && depth > 0) {
        if (remaining[endPos] === '(') depth++;
        if (remaining[endPos] === ')') depth--;
        endPos++;
      }

      count += parseInt(match[1], 10);
      // Remove the entire repeat() expression
      remaining = remaining.substring(0, match.index) + remaining.substring(endPos);
      pos = match.index;
      repeatRegex.lastIndex = 0; // Reset regex position
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

    lcardsLog.debug(`[LCARdSDataGrid] Generating random grid: ${rows}x${columns}`);

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

    const grid = Array.from({ length: rows }, () =>
      Array.from({ length: columns }, () => generator())
    );

    lcardsLog.debug(`[LCARdSDataGrid] Generated grid:`, {
      requestedRows: rows,
      requestedColumns: columns,
      actualRows: grid.length,
      actualColumns: grid[0]?.length,
      format
    });

    return grid;
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
  // MODE 2: DATA - GRID LAYOUT
  // ============================================================================

  /**
   * Initialize grid layout (static structure with entity/template cells)
   * Replaces both template mode and datasource spreadsheet mode
   * @private
   */
  async _initializeGridLayout() {
    const rows = this.config.rows;

    if (!Array.isArray(rows) || rows.length === 0) {
      lcardsLog.error('[LCARdSDataGrid] Data mode (grid layout) requires rows array');
      this._error = 'Grid layout requires rows configuration';
      return;
    }

    // Store row config for hierarchical styling
    // Normalize to ensure _rowConfig always contains row objects
    this._rowConfig = rows.map(row => {
      // New object format: {values: [...], style: {...}}
      if (row && typeof row === 'object' && !Array.isArray(row)) {
        return row;
      }
      // Old array format: convert to object
      return { values: row };
    });

    // Store column config for hierarchical styling (if provided)
    if (Array.isArray(this.config.columns) && this.config.columns.length > 0) {
      this._columnConfig = this.config.columns.map(col => {
        if (col && typeof col === 'object') {
          return col;
        }
        return { style: {} };
      });
    } else {
      this._columnConfig = [];
    }

    // Track entities we need to subscribe to
    this._trackedEntities = [];

    // Process each row
    this._gridData = await Promise.all(
      rows.map(async (row) => {
        // Handle both array format and object format with style
        let rowValues;
        if (Array.isArray(row)) {
          rowValues = row;
        } else if (row && typeof row === 'object' && Array.isArray(row.values)) {
          rowValues = row.values;
        } else {
          lcardsLog.warn('[LCARdSDataGrid] Row must be an array or object with values:', row);
          return [];
        }

        return await Promise.all(
          rowValues.map(async (cell) => await this._processCellValue(cell))
        );
      })
    );

    lcardsLog.debug('[LCARdSDataGrid] Grid layout initialized', {
      rows: this._gridData.length,
      trackedEntities: this._trackedEntities
    });
  }

  /**
   * Process a cell value and return display string
   * Auto-detects cell type: static, entity, or template
   * @private
   * @param {*} cell - Cell value from config
   * @returns {Promise<string>} Display value
   */
  async _processCellValue(cell) {
    if (cell === null || cell === undefined) {
      return '';
    }

    // Convert to string
    const cellStr = String(cell);

    // Check if it's a template (contains {{ }} or {% %})
    if (cellStr.includes('{{') || cellStr.includes('{%')) {
      return await this.processTemplate(cellStr);
    }

    // Check if it's an entity ID (e.g., sensor.temperature)
    const isEntityId = /^[a-z_]+\.[a-z0-9_]+$/.test(cellStr);
    if (isEntityId) {
      // Track this entity for updates
      if (!this._trackedEntities.includes(cellStr)) {
        this._trackedEntities.push(cellStr);
      }

      // Return current state
      const state = this.hass?.states?.[cellStr];
      return state ? state.state : '—';
    }

    // Static text
    return cellStr;
  }

  /**
   * Re-process grid data when entity states change
   * @private
   */
  async _reprocessGridData() {
    if (!this.config.rows) return;

    this._previousGridData = this._gridData;

    this._gridData = await Promise.all(
      this.config.rows.map(async (row) => {
        let rowValues;
        if (Array.isArray(row)) {
          rowValues = row;
        } else if (row && typeof row === 'object' && Array.isArray(row.values)) {
          rowValues = row.values;
        } else {
          return [];
        }

        return await Promise.all(
          rowValues.map(async (cell) => await this._processCellValue(cell))
        );
      })
    );

    this._detectAndAnimateChanges();
    this.requestUpdate();
  }

  // ============================================================================
  // MODE 2: DATA - TIMELINE LAYOUT
  // ============================================================================

  // Timeline layout removed - use Data mode with templates and DataSources instead

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
      .replace('{value:.0f}', isNumber ? haFormatNumber(this.hass, Math.round(numValue), { maximumFractionDigits: 0 }) : String(value))
      .replace('{value:.1f}', isNumber ? haFormatNumber(this.hass, numValue, { minimumFractionDigits: 1, maximumFractionDigits: 1 }) : String(value))
      .replace('{value:.2f}', isNumber ? haFormatNumber(this.hass, numValue, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : String(value))
      .replace('{value:+.1f}', isNumber ? (numValue >= 0 ? '+' : '') + haFormatNumber(this.hass, numValue, { minimumFractionDigits: 1, maximumFractionDigits: 1 }) : String(value))
      .replace('{value:+.2f}', isNumber ? (numValue >= 0 ? '+' : '') + haFormatNumber(this.hass, numValue, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : String(value));
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

    // Pass all animations to AnimationManager (supports all presets)
    // AnimationManager will handle registration, triggers, and execution
    // Cascade-color is handled separately for row-by-row animation
    const nonCascadeAnimations = (this.config.animations || []).filter(a => a.preset !== 'cascade-color');

    try {
      await animationManager.onOverlayRendered(overlayId, containerEl, {
        animations: nonCascadeAnimations
      });
      lcardsLog.debug(`[LCARdSDataGrid] Animation scope initialized: ${overlayId}`, {
        totalAnimations: this.config.animations?.length || 0,
        nonCascade: nonCascadeAnimations.length
      });
    } catch (error) {
      lcardsLog.error('[LCARdSDataGrid] Failed to initialize animation scope:', error);
    }
  }

  // ============================================================================
  // FILTER APPLICATION
  // ============================================================================

  /**
   * Apply CSS filters to the data grid
   * Note: Only CSS filters are supported (blur, brightness, etc.)
   * SVG filters require an SVG parent element which data-grid doesn't have
   * @private
   */
  _applyFilters() {
    if (!this.config.filters || this.config.filters.length === 0) {
      return;
    }

    // Find the grid container element
    const gridElement = /** @type {HTMLElement|null} */ (this.renderRoot?.querySelector('.data-grid'));
    if (!gridElement) {
      lcardsLog.debug('[LCARdSDataGrid] Cannot apply filters - grid element not found yet');
      return;
    }

    // Separate CSS and SVG filters
    const cssFilters = this.config.filters.filter(f => f.mode === 'css' || !f.mode);
    const svgFilters = this.config.filters.filter(f => f.mode === 'svg');

    // Warn about SVG filters (not supported on HTML elements)
    if (svgFilters.length > 0) {
      lcardsLog.warn('[LCARdSDataGrid] SVG filters are not supported on data-grid (HTML element). Use CSS filters instead.', {
        svgFilters: svgFilters.map(f => f.type)
      });
    }

    // Apply CSS filters only
    if (cssFilters.length > 0) {
      const filterString = generateFilterString(cssFilters);
      gridElement.style.filter = filterString;
      lcardsLog.debug('[LCARdSDataGrid] Applied CSS filters:', filterString);
    }
  }

  // ============================================================================
  // ============================================================================
  // CASCADE ANIMATION
  // ============================================================================

  /**
   * Setup cascade animation using AnimationManager
   * Reads from animations array (standard pattern across all cards)
   * Creates independent animations per row for authentic LCARS cascade effect
   * @private
   */
  async _setupCascadeAnimation() {
    // Find cascade-color animation in animations array (standard pattern)
    const animations = this.config.animations || [];
    lcardsLog.debug('[LCARdSDataGrid] _setupCascadeAnimation called', {
      animations,
      hasAnimations: animations.length > 0,
      firstAnimation: animations[0]
    });
    // Standard LCARdS animations use 'preset' property, not 'type'
    const cascadeAnim = animations.find(a => a.preset === 'cascade-color');

    if (!cascadeAnim) {
      lcardsLog.debug('[LCARdSDataGrid] No cascade-color animation found in config', {
        animationPresets: animations.map(a => a.preset || a.type)
      });
      return; // No cascade animation configured
    }

    lcardsLog.debug('[LCARdSDataGrid] Found cascade-color animation:', cascadeAnim);

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

    // Resolve colors for anime.js: CSS vars and computed expressions (darken/lighten/alpha/etc.)
    // must be converted to concrete values before being passed to keyframes.
    const _resolver = window.lcards?.core?.themeManager?.resolver;
    const resolveColorForAnime = (colorValue) => {
      if (!colorValue) return null;
      const afterResolver = _resolver ? _resolver.resolve(colorValue, colorValue) : colorValue;
      return ColorUtils.resolveCssVariable(afterResolver, null);
    };

    // Get cascade colors from config or theme
    // Standard format: cascadeAnim.params contains the preset parameters
    const params = cascadeAnim.params || cascadeAnim; // Fallback to cascadeAnim for backwards compat
    const colors = params.colors || {};
    const rawColors = [
      this.getThemeToken(colors.start || colors[0] || 'colors.grid.cascadeStart') || 'var(--lcards-blue-light, #93e1ff)',
      this.getThemeToken(colors.text || colors[1] || 'colors.grid.cascadeMid') || 'var(--lcards-blue-darkest, #002241)',
      this.getThemeToken(colors.end || colors[2] || 'colors.grid.cascadeEnd') || 'var(--lcards-moonlight, #dfe1e8)'
    ];

    // Resolve all colors to concrete values for anime.js
    const cascadeColors = rawColors.map(resolveColorForAnime).filter(Boolean);

    if (cascadeColors.length < 3) {
      lcardsLog.warn('[LCARdSDataGrid] cascade-color requires 3 resolved colours — got', cascadeColors.length, '. Check CSS variable definitions or set explicit colors in card config.');
      return;
    }

    // Get timing pattern (default, niagara, fast, custom)
    const pattern = params.pattern || 'default';
    const timingPattern = this._getAnimationTiming(pattern);

    // User can override duration globally (affects all rows)
    const durationOverride = params.duration;

    // Or use speed multiplier (2.0 = twice as fast, 0.5 = half speed)
    const speedMultiplier = params.speed_multiplier !== undefined ? params.speed_multiplier : 1.0;

    lcardsLog.debug(`[LCARdSDataGrid] Setting up cascade animation for ${numRows} rows with pattern: ${pattern}`, {
      speedMultiplier,
      durationOverride,
      timingPatternLength: timingPattern.length,
      gridDataLength: this._gridData.length,
      firstRowLength: this._gridData[0]?.length
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

      const targetSelector = `.grid-cell[data-row="${rowIndex}"]`;

      rowAnimations.push({
        trigger: 'on_load',
        preset: 'cascade-color',
        // Use `target` (singular) so playAnimation uses querySelectorAll, matching
        // all cells in the row.  The `targets` (plural) branch uses querySelector
        // (singular) which would only capture the first cell.
        target: targetSelector,
        params: {
          colors: cascadeColors,
          duration: finalDuration,
          delay: timing.delay * 1000, // Convert to ms - this is when the row starts
          loop: true, // Cascade animations always loop
          alternate: false, // Legacy uses normal direction (no reverse)
          property: 'color',
          easing: params.easing || 'linear'
        }
      });

      lcardsLog.debug(`[LCARdSDataGrid] Row ${rowIndex} animation:`, {
        targetSelector,
        duration: finalDuration,
        delay: timing.delay * 1000,
        timingIndex: rowIndex % timingPattern.length
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

      // Use batchShouldFire so all row animations share the same fire-decision.
      // Without this, the first registerAnimation call sets onLoadFired=true and
      // every subsequent row is silently skipped.
      const batchShouldFire = !scopeData.onLoadFired;

      // Register each row animation
      for (const animDef of rowAnimations) {
        await animationManager.registerAnimation(overlayId, animDef, { batchShouldFire });
      }

      // Mark on_load as fired after the full batch, mirroring onOverlayRendered behaviour.
      if (batchShouldFire) {
        scopeData.onLoadFired = true;
      }

      lcardsLog.debug(`[LCARdSDataGrid] Cascade animation setup complete`, {
        totalRows: numRows,
        animationsRegistered: rowAnimations.length,
        overlayId
      });
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
    const cellExists = /** @type {HTMLElement|null} */ (this.renderRoot.querySelector(targetSelector));
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
      'letter_spacing': 'letter-spacing',
      'line_height': 'line-height',
      'white_space': 'white-space',
      'align_items': 'align-items',
      'justify_content': 'justify-content',
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

    // All modes use the same grid renderer
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

    // Add additional text styling properties if defined
    if (gridStyle.text_transform) {
      gridStyleParts.push(`text-transform: ${gridStyle.text_transform}`);
    }
    if (gridStyle.letter_spacing) {
      gridStyleParts.push(`letter-spacing: ${gridStyle.letter_spacing}`);
    }
    if (gridStyle.line_height) {
      gridStyleParts.push(`line-height: ${gridStyle.line_height}`);
    }
    if (gridStyle.white_space) {
      gridStyleParts.push(`white-space: ${gridStyle.white_space}`);
    }
    if (gridStyle.align_items) {
      gridStyleParts.push(`align-items: ${gridStyle.align_items}`);
    }
    if (gridStyle.justify_content) {
      gridStyleParts.push(`justify-content: ${gridStyle.justify_content}`);
    }

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
                // Check both current format (animations[].preset) and legacy format (animation.type)
                const hasCascadeAnimation = this.config.animation?.type === 'cascade' ||
                  (this.config.animations || []).some(a => a.preset === 'cascade-color');
                const cellCss = this._styleToCSS(cellStyle, { excludeColor: hasCascadeAnimation });

                // Get alignment (default to right for cascade grid)
                const align = cellStyle.align || this.config.align || 'right';

                return html`
                  <div class="grid-cell align-${align}"
                       data-row="${rowIndex}"
                       data-col="${colIndex}"
                       style="${cellCss}">
                    ${escapeHtml(this._formatCellValueSimple(cellValue))}
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
    // Allow explicit px override; relative units fall through to auto-calculation.
    const px = this._configPx(this.config.height);
    if (px !== null) return Math.ceil(px / 50);
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
  getGridOptions() {
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
      data_mode: 'decorative',
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
      animations: [
        {
          trigger: 'on_load',
          preset: 'cascade-color'
        }
      ]
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
   * @returns {HTMLElement}
   */
  static getConfigElement() {
    // Static import - editor bundled with card (webpack config doesn't support splitting)
    return document.createElement('lcards-data-grid-editor');
  }

  /**
   * Get default animation target for this card
   * Called by AnimationManager when no explicit target is specified
   * Returns the data-grid element so animations affect all grid cells
   * @returns {Element} The .data-grid element containing all cells
   */
  getDefaultAnimationTarget() {
    // Return the grid element which contains all cells
    // AnimationManager will apply the animation to this container
    // For cell-specific animations, user should specify targets: '.grid-cell'
    const gridElement = this.renderRoot?.querySelector('.data-grid');
    lcardsLog.debug('[LCARdSDataGrid] getDefaultAnimationTarget called', {
      found: !!gridElement,
      element: gridElement?.tagName
    });
    return gridElement || this.renderRoot?.querySelector('.data-grid-container');
  }

  /**
   * Resolve custom animation targets for this card
   * Called by AnimationManager for explicit target selectors
   * @param {string} target - Target selector
   * @returns {Element|null} Resolved element
   */
  getAnimationTarget(target) {
    // Support both absolute and container-relative selectors
    return this.renderRoot?.querySelector(target);
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

    lcardsLog.debug('[LCARdSDataGrid] Schema registered with CoreConfigManager');
  }
}
