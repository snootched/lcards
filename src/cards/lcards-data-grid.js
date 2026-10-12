/**
 * LCARdS Data Grid Card
 *
 * A CSS Grid of cells in one of two modes:
 * - decorative: generated values (digits, hex, ...) for the LCARS look,
 *   optionally refreshed on a timer
 * - data: rows of static text, entity states, templates and datasource tokens
 *
 * Styling layers (later wins): theme defaults, `style`, header defaults +
 * `header_style` (header rows), `columns[i].style`, row `style`, cell `style`.
 * A cell's `color`/`background` may be a state map resolved against that
 * cell's entity.
 *
 * Animations: the `cascade-color` preset in `animations` runs row by row with
 * CB-LCARS timing; `highlight_changes` pulses cells whose value changed.
 *
 * Legacy configs are migrated in memory by migrateDataGridConfig(); the pure
 * logic shared with the studio and the docs lives in src/data-grid/.
 *
 * @see doc/cards/data-grid/
 */

import { html, css } from 'lit';
import { LCARdSCard } from '../base/LCARdSCard.js';
import { lcardsLog } from '../utils/lcards-logging.js';
import { resolveThemeTokensRecursive } from '../utils/lcards-theme.js';
import { dataGridSchema } from './schemas/data-grid-schema.js';
import { generateFilterString } from '../msd/utils/BaseSvgFilters.js';
import { haFormatAttrValue, haFormatState } from '../utils/ha-entity-display.js';
import { resolveStateColor } from '../utils/state-color-resolver.js';
import { migrateDataGridConfig } from '../data-grid/data-grid-config-migration.js';
import {
  normalizeRows, classifyCell, dataColumnCount, countTracks,
  generateDecorativeGrid, refreshDecorativeCells,
  mergeStyleLayers, styleToCSS, gridContainerStyle, toPx, defaultCellStyle, defaultHeaderStyle,
  buildCascadeRowTimings, cascadeColorList
} from '../data-grid/data-grid-model.js';


const ACTION_KEYS = ['tap_action', 'hold_action', 'double_tap_action'];

export class LCARdSDataGrid extends LCARdSCard {
  /** Card type identifier for CoreConfigManager */
  static CARD_TYPE = 'data-grid';

  static get properties() {
    return {
      ...super.properties,
      _gridData: { type: Array, state: true }
    };
  }

  static get styles() {
    return [
      super.styles,
      css`
        :host {
          display: block;
          /* width: 100% omitted: see LCARdSCard base comment (overflows with card_margin).
           * height: 100% inherited from LCARdSCard base. */
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
        }

        .grid-cell {
          display: flex;
          align-items: center;
          white-space: nowrap; /* Default: can be overridden by cell styles */
          overflow: hidden;
          text-overflow: ellipsis;
          transition: color var(--ha-animation-duration-slow, 0.3s) ease,
            background-color var(--ha-animation-duration-slow, 0.3s) ease;
          min-height: 1.5em; /* Prevent collapse when empty */
          padding: var(--ha-space-1) var(--ha-space-2);
        }

        .grid-cell.clickable {
          cursor: pointer;
        }

        /* Wrapping white-space modes: wrap long words, no ellipsis */
        .grid-cell[style*="white-space: normal"],
        .grid-cell[style*="white-space: pre-wrap"],
        .grid-cell[style*="white-space: pre-line"] {
          overflow-wrap: break-word;
          text-overflow: clip;
        }

        /* Change highlight fallback (AnimationManager unavailable) */
        .cell-changed {
          animation: cell-pulse 0.5s ease-out;
        }

        @keyframes cell-pulse {
          0%, 100% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.05);
          }
        }

        .grid-message {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 100%;
          height: 100%;
          color: var(--primary-text-color);
          font-size: 14px;
          text-align: center;
          padding: var(--ha-space-5);
          box-sizing: border-box;
        }

        .grid-message.error {
          color: var(--error-color);
        }
      `
    ];
  }

  constructor() {
    super();
    /** @type {string[][]} display strings, one per cell */
    this._gridData = [];
    /** @type {Array<{values: Array, style?: Object, header: boolean}>} normalised rows (data mode) */
    this._rows = [];
    /** @type {Array<Array<*>>} raw cell config (data mode), same shape as _gridData */
    this._cellConfigs = [];
    this._previousGridData = null;
    this._error = null;
    this._styleCache = new Map();
    this._refreshTimer = null;
    this._effectsRun = 0;
    this._cascadeRows = 0;
    /** @type {Array<() => void>} */
    this._cellActionCleanups = [];
    this._cellActionKey = '';
  }

  // ============================================================================
  // CONFIG
  // ============================================================================

  /**
   * Migrate legacy configs before the base class processes them (in memory only).
   * @param {Object} config
   */
  setConfig(config) {
    super.setConfig(migrateDataGridConfig(config).config);
  }

  /** @returns {'decorative'|'data'} */
  get _dataMode() {
    const mode = this.config?.data_mode;
    if (mode === 'data' || mode === 'decorative') return mode;
    return Array.isArray(this.config?.rows) && this.config.rows.length ? 'data' : 'decorative';
  }

  /** @protected */
  _onConfigSet(config) {
    super._onConfigSet(config);
    this._applyConfig();
  }

  /** Called after CoreConfigManager has merged the config. @protected */
  _onConfigUpdated() {
    this._applyConfig();
    if (this._dataMode === 'data') this._scheduleTemplateUpdate();
  }

  /**
   * Reset derived state for the current config and restart effects once rendered.
   * @private
   */
  _applyConfig() {
    this._styleCache.clear();
    this._error = null;
    this._previousGridData = null;
    this._stopRefresh();

    this._rows = this._dataMode === 'data' ? normalizeRows(this.config.rows) : [];
    if (this._dataMode === 'decorative') {
      const { rows, cols } = this._decorativeSize();
      this._cellConfigs = [];
      this._gridData = generateDecorativeGrid(rows, cols, this._decorativeOptions());
    } else {
      const rows = this._rows;
      if (!rows.length) {
        this._error = 'Data mode needs at least one row. Add rows, or switch to decorative mode.';
        this._cellConfigs = [];
        this._gridData = [];
      } else {
        this._cellConfigs = rows.map(r => r.values);
        // Data cells are filled by _processCustomTemplates()
        if (this._gridData.length !== rows.length) this._gridData = [];
      }
    }

    if (this.hasUpdated) this._restartEffects();
  }

  /** @private */
  _decorativeSize() {
    const grid = this.config.grid || {};
    return {
      rows: countTracks(grid['grid-template-rows']) || 8,
      cols: countTracks(grid['grid-template-columns']) || 12
    };
  }

  /** @private */
  _decorativeOptions() {
    const columns = Array.isArray(this.config.columns) ? this.config.columns : [];
    return {
      format: this.config.format || 'mixed',
      columnFormats: columns.map(c => c?.format)
    };
  }

  // ============================================================================
  // DATA CELLS
  // ============================================================================

  /**
   * Entity cells join the base set (primary entity, rules, Jinja2 scan,
   * triggers_update) so their changes trigger _processCustomTemplates().
   * @protected
   */
  _updateTrackedEntities() {
    super._updateTrackedEntities();
    if (this._dataMode !== 'data') return;
    const tracked = new Set(this._trackedEntities);
    for (const row of normalizeRows(this.config.rows)) {
      for (const cell of row.values) {
        const { entity } = classifyCell(cell);
        if (entity) tracked.add(entity);
      }
    }
    this._trackedEntities = [...tracked];
  }

  /**
   * Recompute data cells. The base class calls this on config changes, on
   * tracked entity changes and on datasource updates.
   * @protected
   */
  async _processCustomTemplates() {
    if (this._dataMode !== 'data' || !Array.isArray(this.config?.rows)) return;
    const rows = normalizeRows(this.config.rows);
    const cols = dataColumnCount(this.config.rows);

    const next = await Promise.all(rows.map((row, r) =>
      Promise.all(Array.from({ length: cols }, (_, c) => this._cellText(row.values[c], `rows[${r}][${c}]`)))
    ));

    if (this._gridData.length) this._previousGridData = this._gridData;
    this._rows = rows;
    this._cellConfigs = rows.map(r => r.values);
    this._gridData = next;
    this._detectAndAnimateChanges();

    // Data arrives after the first render: (re)start the cascade once rows exist.
    if (this.hasUpdated && this._cascadeRows !== next.length && this._findCascade()) {
      this._restartEffects();
    }
  }

  /**
   * Display text for one data cell.
   * @param {*} cell
   * @param {string} [field] - Its place in the config, for template provenance
   * @returns {Promise<string>}
   * @private
   */
  async _cellText(cell, field = undefined) {
    const info = classifyCell(cell);
    if (info.kind === 'template') {
      const out = await this.processTemplate(info.text, { field });
      return out === null || out === undefined ? '' : String(out);
    }
    if (info.kind === 'entity') {
      const stateObj = this.getEntityState(info.entity);
      if (!stateObj) return '-';
      return info.attribute
        ? haFormatAttrValue(this.hass, stateObj, info.attribute)
        : haFormatState(this.hass, stateObj);
    }
    return info.text;
  }

  // ============================================================================
  // DECORATIVE REFRESH
  // ============================================================================

  /** @private */
  _startRefresh() {
    this._stopRefresh();
    const interval = Number(this.config.refresh_interval) || 0;
    if (this._dataMode !== 'decorative' || interval <= 0 || this._inCardPicker()) return;

    const fraction = this.config.refresh_cells === undefined ? 1 : Number(this.config.refresh_cells);
    this._refreshTimer = setInterval(() => {
      this._previousGridData = this._gridData;
      this._gridData = refreshDecorativeCells(this._gridData, fraction, this._decorativeOptions());
      this._detectAndAnimateChanges();
    }, interval);
  }

  /** @private */
  _stopRefresh() {
    if (this._refreshTimer) {
      clearInterval(this._refreshTimer);
      this._refreshTimer = null;
    }
  }

  /**
   * The card-type picker gallery renders every card; keep it static there.
   * (The edit-dialog preview still animates so users see their changes.)
   * @private
   */
  _inCardPicker() {
    return this._checkForAncestor(['hui-card-picker']);
  }

  // ============================================================================
  // LIFECYCLE
  // ============================================================================

  /** @protected */
  async _handleFirstUpdate() {
    this._registerOverlayForRules(this.config.id || `data-grid-${this._cardGuid}`, 'data-grid', this.config.tags || []);
    this._setupAutoSizing();
    if (this._configProcessingPromise) await this._configProcessingPromise;
    this._restartEffects();
  }

  /** @protected */
  async _onConnected() {
    await super._onConnected();
    // Reconnect (view navigation, edit mode): the base disconnect destroyed the
    // animation scope and we stopped the timer, so start both again.
    if (this.hasUpdated) this._restartEffects();
  }

  /** @protected */
  _onDisconnected() {
    this._effectsRun++;
    this._stopRefresh();
    this._clearCellActions();
    super._onDisconnected(); // destroys the scope from _getAnimationSetup()
  }

  /**
   * Animation scope id. Always guid-based so a Studio preview (same config.id)
   * never binds to the dashboard card's scope.
   * @protected
   */
  _getAnimationSetup() {
    return { overlayId: `data-grid-${this._cardGuid}`, elementSelector: '.data-grid-container' };
  }

  /** @protected */
  _onRulePatchesChanged() {
    this._styleCache.clear();
    this.requestUpdate();
  }

  /**
   * Rebuild the animation scope, cascade, filters, refresh timer and cell
   * actions after the next render. Overlapping calls collapse to the latest.
   * @private
   */
  async _restartEffects() {
    const run = ++this._effectsRun;
    await this.updateComplete;
    if (run !== this._effectsRun || !this.isConnected) return;

    const animationManager = this._singletons?.animationManager;
    const { overlayId } = this._getAnimationSetup();
    animationManager?.destroyOverlayScope(overlayId);
    this._cascadeRows = 0;

    await this._initializeAnimationScope();
    if (run !== this._effectsRun) return;
    await this._setupCascadeAnimation();
    this._applyFilters();
    this._startRefresh();
    this._cellActionKey = '';
    this._bindCellActions();
  }

  // ============================================================================
  // ANIMATIONS
  // ============================================================================

  /** @private */
  _findCascade() {
    return (this.config.animations || []).find(a => a?.preset === 'cascade-color' && a.enabled !== false);
  }

  /**
   * Create the AnimationManager scope with every animation except the cascade
   * (which the card runs row by row).
   * @private
   */
  async _initializeAnimationScope() {
    const animationManager = this._singletons?.animationManager;
    const containerEl = this.renderRoot.querySelector('.data-grid-container');
    if (!animationManager || !containerEl) return;

    const { overlayId } = this._getAnimationSetup();
    const animations = (this.config.animations || []).filter(a => a?.preset !== 'cascade-color');
    try {
      await animationManager.onOverlayRendered(overlayId, containerEl, { animations });
    } catch (error) {
      lcardsLog.error('[LCARdSDataGrid] Failed to initialize animation scope:', error);
    }
  }

  /**
   * Register one looping cascade-color animation per row.
   * @private
   */
  async _setupCascadeAnimation() {
    const cascade = this._findCascade();
    const animationManager = this._singletons?.animationManager;
    const numRows = this._gridData.length;
    if (!cascade || !animationManager || numRows === 0 || this._inCardPicker()) return;

    const { overlayId } = this._getAnimationSetup();
    const scopeData = animationManager.scopes.get(overlayId);
    if (!scopeData) return;

    const params = cascade.params || {};
    const tokens = ['colors.grid.cascadeStart', 'colors.grid.cascadeMid', 'colors.grid.cascadeEnd'];
    const fallbacks = ['var(--lcards-blue-light, #93e1ff)', 'var(--lcards-blue-darkest, #002241)', 'var(--lcards-moonlight, #dfe1e8)'];
    // anime.js needs concrete colours: resolve tokens and CSS variables first.
    const colors = cascadeColorList(params.colors)
      .map((c, i) => this._resolveColorValue(c || this.getThemeToken(tokens[i]) || fallbacks[i], ''))
      .filter(Boolean);
    if (colors.length < 3) {
      lcardsLog.warn('[LCARdSDataGrid] cascade-color needs 3 resolvable colours; got', colors.length);
      return;
    }

    const ease = params.ease || params.easing || 'linear';
    const timings = buildCascadeRowTimings(params, numRows);
    // All rows share one fire decision; otherwise only the first row would run.
    const batchShouldFire = !scopeData.onLoadFired;
    try {
      for (let row = 0; row < numRows; row++) {
        await animationManager.registerAnimation(overlayId, {
          trigger: 'on_load',
          preset: 'cascade-color',
          // `target` (singular) selects every cell in the row.
          target: `.grid-cell[data-row="${row}"]`,
          params: {
            colors,
            duration: timings[row].duration,
            delay: timings[row].delay,
            loop: true,
            alternate: false,
            property: 'color',
            ease
          }
        }, { batchShouldFire });
      }
      if (batchShouldFire) scopeData.onLoadFired = true;
      this._cascadeRows = numRows;
    } catch (error) {
      lcardsLog.error('[LCARdSDataGrid] Failed to set up cascade animation:', error);
    }
  }

  /** @returns {Object|null} normalised highlight_changes config @private */
  _highlightConfig() {
    const h = this.config.highlight_changes;
    if (!h) return null;
    return h === true ? {} : h;
  }

  /**
   * Highlight cells whose value changed since the previous data.
   * @private
   */
  _detectAndAnimateChanges() {
    const highlight = this._highlightConfig();
    const prev = this._previousGridData;
    if (!highlight || !prev || !this.hasUpdated) return;

    const cells = this._gridData.length * (this._gridData[0]?.length || 0);
    const max = highlight.max_cells ?? Math.min(cells, 100);
    const changed = [];
    outer: for (let r = 0; r < this._gridData.length; r++) {
      for (let c = 0; c < this._gridData[r].length; c++) {
        if (prev[r]?.[c] !== this._gridData[r][c]) {
          changed.push([r, c]);
          if (changed.length >= max) break outer;
        }
      }
    }
    if (!changed.length) return;
    // Animate after the new values are rendered.
    this.updateComplete.then(() => changed.forEach(([r, c]) => this._animateCellChange(r, c, highlight)));
  }

  /**
   * @param {number} row
   * @param {number} col
   * @param {Object} highlight - highlight_changes config
   * @private
   */
  _animateCellChange(row, col, highlight) {
    const cell = /** @type {HTMLElement|null} */ (this.renderRoot.querySelector(`.grid-cell[data-row="${row}"][data-col="${col}"]`));
    if (!cell) return;

    const scopeData = this._singletons?.animationManager?.scopes.get(this._getAnimationSetup().overlayId);
    const presetFn = window.lcards?.anim?.presets?.[highlight.preset || 'pulse'];
    if (!scopeData || !presetFn) {
      this._animateCellChangeFallback(cell);
      return;
    }

    const params = {
      duration: highlight.duration || 500,
      ease: highlight.ease || 'outQuad',
      loop: 1, // forward then back with alternate
      alternate: true,
      ...(highlight.params || {})
    };
    if (params.color) params.color = this._resolveColorValue(params.color, params.color);

    try {
      const result = presetFn({ params });
      if (result.styles) Object.assign(cell.style, result.styles);
      scopeData.scope.add(() => {
        window.lcards.anim.anime(cell, { ...result.anime });
      });
    } catch (error) {
      lcardsLog.error('[LCARdSDataGrid] Failed to animate cell change:', error);
      this._animateCellChangeFallback(cell);
    }
  }

  /** @param {HTMLElement} cell @private */
  _animateCellChangeFallback(cell) {
    cell.classList.add('cell-changed');
    cell.addEventListener('animationend', () => cell.classList.remove('cell-changed'), { once: true });
  }

  /**
   * CSS filters on the grid (SVG filters need an SVG parent, so they are skipped).
   * @private
   */
  _applyFilters() {
    const gridEl = /** @type {HTMLElement|null} */ (this.renderRoot?.querySelector('.data-grid'));
    if (!gridEl) return;
    const filters = this.config.filters || [];
    const cssFilters = filters.filter(f => f.mode === 'css' || !f.mode);
    if (filters.length > cssFilters.length) {
      lcardsLog.warn('[LCARdSDataGrid] SVG filters are not supported on data-grid; use CSS filters.');
    }
    gridEl.style.filter = cssFilters.length ? generateFilterString(cssFilters) : '';
  }

  // ============================================================================
  // CELL ACTIONS
  // ============================================================================

  /**
   * Actions for a cell: its own tap/hold/double-tap, else `cell_tap_action`
   * for entity cells.
   * @param {*} cell
   * @returns {{ actions: Object, entity?: string }|null}
   * @private
   */
  _cellActions(cell) {
    const info = classifyCell(cell);
    const own = {};
    if (cell && typeof cell === 'object') {
      for (const key of ACTION_KEYS) if (cell[key]) own[key] = cell[key];
    }
    if (Object.keys(own).length) return { actions: own, entity: info.entity };
    if (info.entity && this.config.cell_tap_action) {
      return { actions: { tap_action: this.config.cell_tap_action }, entity: info.entity };
    }
    return null;
  }

  /**
   * Attach action handlers when the grid shape or config changed.
   * @private
   */
  _bindCellActions() {
    const key = `${this._gridData.length}x${this._gridData[0]?.length || 0}`;
    if (key === this._cellActionKey) return;
    this._clearCellActions();
    this._cellActionKey = key;
    if (this._dataMode !== 'data') return;

    this._cellConfigs.forEach((row, r) => row.forEach((cell, c) => {
      const spec = this._cellActions(cell);
      const el = spec && /** @type {HTMLElement|null} */ (this.renderRoot.querySelector(`.grid-cell[data-row="${r}"][data-col="${c}"]`));
      if (el) this._cellActionCleanups.push(/** @type {() => void} */ (this.setupActions(el, spec.actions, { entity: spec.entity })));
    }));
  }

  /** @private */
  _clearCellActions() {
    this._cellActionCleanups.forEach(fn => { try { fn(); } catch { /* already gone */ } });
    this._cellActionCleanups = [];
    this._cellActionKey = '';
  }

  /** @param {Map<string, unknown>} changedProperties */
  updated(changedProperties) {
    super.updated(changedProperties);
    // Data cells render after the first effects pass; bind once their shape is known.
    if (this._cellActionKey) this._bindCellActions();
  }

  // ============================================================================
  // STYLES
  // ============================================================================

  /** Grid-wide style with rule patches applied. @private */
  _gridStyle() {
    return this._getMergedStyleWithRules(this.config.style || {});
  }

  /**
   * Resolved style for one cell (state maps not yet resolved). Cached per cell.
   * @private
   */
  _cellStyle(row, col) {
    const key = `${row}-${col}`;
    const cached = this._styleCache.get(key);
    if (cached) return cached;

    const rowCfg = this._rows[row];
    const isHeader = rowCfg?.header === true;
    const cell = this._cellConfigs[row]?.[col];
    const columns = Array.isArray(this.config.columns) ? this.config.columns : [];

    const getToken = (path) => this.getThemeToken(path) ?? undefined;
    let style = mergeStyleLayers(
      defaultCellStyle(getToken),
      this._gridStyle(),
      isHeader ? defaultHeaderStyle(getToken) : null,
      isHeader ? this.config.header_style : null,
      columns[col]?.style,
      rowCfg?.style,
      cell && typeof cell === 'object' ? cell.style : null
    );
    if (this._singletons?.themeManager) {
      style = resolveThemeTokensRecursive(style, this._singletons.themeManager);
    }
    this._styleCache.set(key, style);
    return style;
  }

  /**
   * Resolve state-map colours against the cell's entity (static cells use `default`).
   * @param {Object} style
   * @param {*} cell
   * @returns {Object}
   * @private
   */
  _resolveCellColors(style, cell) {
    if (!['color', 'background'].some(k => style[k] && typeof style[k] === 'object')) return style;
    const { entity } = classifyCell(cell);
    const stateObj = entity ? this.getEntityState(entity) : null;
    const out = { ...style };
    for (const key of ['color', 'background']) {
      if (!out[key] || typeof out[key] !== 'object') continue;
      out[key] = resolveStateColor({
        actualState: stateObj?.state,
        classifiedState: this._classifyEntityState(stateObj),
        colorConfig: out[key],
        fallback: undefined
      });
    }
    return out;
  }

  // ============================================================================
  // RENDERING
  // ============================================================================

  /** @protected */
  _renderCard() {
    if (this._error) {
      return html`<div class="lcards-card-container"><div class="grid-message error">${this._error}</div></div>`;
    }
    if (!this._gridData.length) {
      return html`<div class="lcards-card-container"><div class="grid-message">Loading...</div></div>`;
    }

    const cols = this._gridData[0]?.length || 12;
    const gridCss = gridContainerStyle(this.config.grid, cols, this._gridStyle());
    // Inline colours would block the cascade's anime.js colour tween.
    const exclude = this._findCascade() ? ['color'] : [];

    return html`
      <div class="lcards-card-container">
        <div class="data-grid-container">
          <div class="data-grid" style="${gridCss}">
            ${this._gridData.map((row, r) => row.map((text, c) => {
              const cell = this._cellConfigs[r]?.[c];
              const style = this._resolveCellColors(this._cellStyle(r, c), cell);
              const header = this._rows[r]?.header;
              const clickable = this._dataMode === 'data' && !!this._cellActions(cell);
              return html`<div class="grid-cell${header ? ' grid-header' : ''}${clickable ? ' clickable' : ''}"
                data-row="${r}" data-col="${c}"
                style="${styleToCSS(style, { exclude })}">${text}</div>`;
            }))}
          </div>
        </div>
      </div>
    `;
  }

  // ============================================================================
  // CARD SIZE & LAYOUT
  // ============================================================================

  /**
   * Height in 50px rows: explicit px height, else rows x (1.5 x font size) plus gaps.
   * @protected
   */
  _getCardSize() {
    const explicit = this._configPx(this.config?.height);
    if (explicit !== null) return Math.ceil(explicit / 50);
    const grid = this.config?.grid || {};
    const fontSize = toPx(this.config?.style?.font_size) ?? 24;
    const gap = toPx(grid['row-gap'] ?? grid.gap) ?? 8;
    const rows = this._gridData?.length || countTracks(grid['grid-template-rows']) || 8;
    return Math.max(1, Math.ceil((fontSize * 1.5 * rows + gap * (rows - 1)) / 50));
  }

  /** @returns {Object} Layout configuration for the HA sections grid */
  getGridOptions() {
    const go = this.config.grid_options || {};
    return {
      columns: go.columns ?? 'full',
      rows: go.rows ?? 4,
      min_columns: 4,
      min_rows: 2,
    };
  }

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

  static async getConfigElement() {
    // Editors load on demand (HA awaits getConfigElement), keeping them out of
    // the bundle every dashboard loads.
    await import('../editor/cards/lcards-data-grid-editor.js');
    return document.createElement('lcards-data-grid-editor');
  }

  /**
   * Default animation target: the grid element (all cells).
   * For one cell or row use a selector such as `.grid-cell[data-row="0"]`.
   * @returns {Element}
   */
  getDefaultAnimationTarget() {
    return this.renderRoot?.querySelector('.data-grid') || this.renderRoot?.querySelector('.data-grid-container');
  }

  /**
   * @param {string} target - CSS selector inside the card
   * @returns {Element|null}
   */
  getAnimationTarget(target) {
    return this.renderRoot?.querySelector(target);
  }

  /** Register the schema with CoreConfigManager (called by lcards.js). */
  static registerSchema() {
    const configManager = window.lcards?.core?.configManager;
    if (!configManager) {
      lcardsLog.error('[LCARdSDataGrid] CoreConfigManager not available for schema registration');
      return;
    }
    configManager.registerCardSchema('data-grid', dataGridSchema);
  }
}
