/**
 * LCARdS Chart Card
 *
 * Data visualization using the ApexCharts library (v7, loaded lazily on first render).
 *
 * Series (`sources[]`) load through ChartSeriesFetcher:
 * - `{ entity }`: Home Assistant history for the time window, plus live updates
 * - `{ entity, statistics: { type, period } }`: long-term statistics
 * - `{ datasource, buffer }`: an LCARdS DataSource (processors, shared sources)
 * Any series can be bucketed with `group_by` (incl. minmax/box/ohlc for
 * rangeArea/boxPlot/candlestick). Legacy configs (source, series_N
 * data_sources, series_names, ...) are migrated in memory by
 * migrateChartConfig(); the editor persists the migration on save.
 *
 * @example
 * ```yaml
 * type: custom:lcards-chart
 * chart_type: line
 * graph_span: 24h
 * sources:
 *   - entity: sensor.temperature
 *     name: Temperature
 *   - datasource: temp
 *     buffer: smoothed
 * data_sources:
 *   temp:
 *     entity: sensor.temperature
 *     processing:
 *       smoothed:
 *         type: smooth
 *         method: moving_average
 *         window: 5
 * ```
 */

import { html, css, svg } from 'lit';
import { LCARdSCard } from '../base/LCARdSCard.js';
import { lcardsLog } from '../utils/lcards-logging.js';
import {
  buildChartOptions,
  buildApexSeries,
  timeAxisData,
  chartStyleDefaults,
  CHART_CARD_DEFAULTS
} from '../charts/chart-options-builder.js';
import { ChartSeriesFetcher } from '../charts/chart-series-fetcher.js';
import { normalizeChartSources, normalizeStateBands, arrayChartProblem } from '../charts/chart-sources.js';
import { createTimelineColorer } from '../utils/ha-state-color.js';
import { joinSyncGroup, publishSyncTime, apexShowsCursor, timeAtX, xAtTime } from '../charts/chart-sync-group.js';
import { SYNC_WINDOW_STEP_MS } from '../charts/chart-options-builder.js';
import { resolveColor } from '../core/themes/resolve-color.js';
import { resolveThemeTokensRecursive } from '../utils/lcards-theme.js';
import { deepMerge } from '../utils/deepMerge.js';
import { getChartSchema } from './schemas/chart-schema.js';

/** How long the first draw waits for every series' initial data (ms). */
const FIRST_DATA_WAIT_MS = 2500;

/** @type {Promise<any>|null} */
let apexChartsPromise = null;

/**
 * ApexCharts' updateOptions()/updateSeries() return promises, so a try/catch
 * around them misses a failure, which surfaced as "Uncaught (in promise)" with
 * no hint of the caller. Log it with where it came from instead.
 * @param {any} promise
 * @param {string} where - which update (series, window, bands, resize, options, alert)
 */
function settleUpdate(promise, where) {
  promise?.catch?.((/** @type {any} */ error) => lcardsLog.warn(`[LCARdSChart] Chart update failed (${where}):`, error));
}

/**
 * Drop undefined keys from an updateOptions() patch. ApexCharts merges an
 * undefined value over its own: `plotOptions: undefined` (a line chart has no
 * plotOptions of ours) wiped its plotOptions, and every later update threw
 * "reading 'radar'" (a resize, e.g. entering edit mode, set it off).
 * @param {Record<string, any>} patch
 * @returns {Record<string, any>}
 */
export function definedOptions(patch) {
  return Object.fromEntries(Object.entries(patch).filter(([, value]) => value !== undefined));
}

/**
 * Load ApexCharts on first use. It is built into its own chunk, so pages
 * without a chart never download it. A failed load is not cached.
 * @returns {Promise<any>} The ApexCharts constructor
 */
function loadApexCharts() {
  apexChartsPromise ??= import('apexcharts')
    .then(module => module.default)
    .catch(error => {
      apexChartsPromise = null;
      throw error;
    });
  return apexChartsPromise;
}

export class LCARdSChart extends LCARdSCard {
  static CARD_TYPE = 'chart';

  static get properties() {
    return {
      ...super.properties,
      _chartReady: { type: Boolean, state: true },
      _dataArrived: { type: Boolean, state: true }
    };
  }

  static get styles() {
    return [
      super.styles,
      css`
        :host {
          display: block;
          /* width: 100% omitted — see LCARdSCard base comment (overflows with card_margin).
           * height: 100% inherited from LCARdSCard base. */
          min-height: 200px;
        }

        .lcards-card-container {
          width: 100%;
          height: 100%;
          background: transparent;
          position: relative;
        }

        .chart-container {
          width: 100%;
          height: 100%;
          position: relative;
        }

        /* Loading / error states sit over the (always mounted) chart container */
        .chart-overlay {
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          text-align: center;
          padding: var(--ha-space-5);
          font-size: 14px;
        }

        .chart-loading {
          color: var(--primary-text-color, var(--lcards-moonlight, #d3d3d3));
        }

        .chart-error {
          color: var(--error-color, #ff0000);
        }

        .chart-preview {
          --preview-accent-color: var(--preview-accent, var(--lcars-orange, var(--primary-color)));
        }
        .chart-preview .preview-bg {
          fill: color-mix(in srgb, var(--secondary-background-color) 50%, transparent);
        }
        .chart-preview .preview-grid {
          stroke: var(--divider-color);
          stroke-width: 1;
        }
        .chart-preview .preview-line {
          fill: none;
          stroke: var(--preview-accent-color);
          stroke-width: 3;
        }
        .chart-preview .preview-area {
          fill: color-mix(in srgb, var(--preview-accent-color) 30%, transparent);
          stroke: var(--preview-accent-color);
          stroke-width: 2;
        }
        .chart-preview .preview-bar {
          fill: var(--preview-accent-color);
          opacity: 0.8;
        }
        .chart-preview .preview-title {
          fill: var(--preview-accent-color);
          font-size: 16px;
          font-weight: bold;
        }
        .chart-preview .preview-hint {
          fill: var(--secondary-text-color);
          font-size: 12px;
        }

        /* Content of a style.formatters.tooltip template (ApexCharts tooltip.custom) */
        .lcards-chart-tooltip {
          padding: var(--ha-space-1) var(--ha-space-2);
        }

        /* sync_group: another member's hover time, where ApexCharts draws no crosshair */
        .sync-cursor {
          position: absolute;
          top: 0;
          left: 0;
          width: 0;
          border-left: var(--ha-border-width-sm) dashed var(--secondary-text-color);
          pointer-events: none;
          z-index: 2;
        }

        /* rangeBar timeline tooltip: the row, the state, its times and duration */
        .lcards-timeline-tooltip {
          display: grid;
          gap: var(--ha-space-1);
        }
        .lcards-timeline-row {
          font-weight: var(--ha-font-weight-bold);
        }
        .lcards-timeline-state {
          display: flex;
          align-items: center;
        }
        .lcards-timeline-duration {
          opacity: 0.8;
        }

      `
    ];
  }

  constructor() {
    super();
    this._chart = null;
    /** @type {ResizeObserver|null} */
    this._resizeObserverChart = null;
    this._chartReady = false;
    this._chartOptions = null;
    this._error = null;
    this._chartInitialized = false; // Track if we've tried to initialize
    this._chartGeneration = 0; // Bumped on every init/teardown so a stale async init is dropped
    /** @type {import('../charts/chart-sources.js').ChartSeries[]} */
    this._series = [];
    /** @type {(() => void)|null} leaves the sync_group (listeners, membership) */
    this._syncCleanup = null;
    /** @type {Array<any>} state_bands as history series (normalizeStateBands) */
    this._bands = [];
    /** @type {Array<Array<{t: number, v: any}>|undefined>} text points per state band */
    this._bandPoints = [];
    /** @type {((state: string, stateObj?: any) => string)|null} rangeBar: Home Assistant's timeline colours, one per config */
    this._stateColorer = null;
    /** @type {Set<number>} series indexes that have delivered data (reset in _showPlaceholder) */
    this._seriesLoaded = new Set();
    /** @type {Array<Array<{t: number, v: any}>|undefined>} Latest points per series */
    this._seriesPoints = [];
    this._dataArrived = false;
    /** @type {ChartSeriesFetcher|null} */
    this._fetcher = null;
    this._firstUpdateDone = false;
  }

  /**
   * Handle first update: register with rules and start loading series.
   * @protected
   */
  async _handleFirstUpdate() {
    // Note: LCARdSCard doesn't implement _handleFirstUpdate, don't call super
    const overlayId = this.config.id || `chart-${this._cardGuid}`;
    this._registerOverlayForRules(overlayId, 'chart', this.config.tags || []);

    this._firstUpdateDone = true;
    await this._startLoading();
  }

  /**
   * Reconnected after a view switch: resume loading (the fetcher was stopped
   * on disconnect).
   * @protected
   */
  async _onConnected() {
    // The base initialises singletons (DataSourceManager etc.) here.
    await super._onConnected();
    if (this._firstUpdateDone && !this._fetcher && this.isConnected) {
      await this._startLoading();
    }
  }

  /**
   * Whether to show the static placeholder instead of a live chart: in the
   * card picker, or when no series are configured. The HA edit dialog shows
   * the real chart (loading series has no side effects).
   * @private
   */
  _showPlaceholder() {
    return this._series.length === 0 || this._checkForAncestor(['hui-card-picker']);
  }

  /**
   * (Re)start loading every series for the current config.
   * @private
   */
  async _startLoading() {
    this._stopLoading();
    // Only the latest call starts a fetcher: two calls in a row (connect, then
    // config) both waited below and each made one, the first never stopped,
    // so every series was subscribed twice and every update drawn twice.
    const run = (this._loadRun = (this._loadRun ?? 0) + 1);
    this._series = normalizeChartSources(this.config);
    this._bands = normalizeStateBands(this.config);
    this._seriesPoints = [];
    this._bandPoints = [];
    this._seriesLoaded = new Set();
    this._firstDataWaitOver = false;
    this._dataArrived = false;
    this._error = null;

    if (this._showPlaceholder()) {
      this.requestUpdate();
      return;
    }

    // Card-local data_sources must exist before DataSource series attach.
    if (this._configProcessingPromise) {
      await this._configProcessingPromise;
    }
    if (!this.isConnected || run !== this._loadRun) return;

    this._fetcher = new ChartSeriesFetcher({
      getHass: () => this.hass,
      getDataSourceManager: () => this._singletons?.dataSourceManager,
      onUpdate: (index, points) => this._onSeriesUpdate(index, points),
      logId: this.config?.id || this._cardGuid
    });
    // State bands load after the series (their indexes follow the series')
    this._fetcher.start([...this._series, ...this._bands], { graph_span: this.config.graph_span, span: this.config.span });
    // Draw once every series has its first data, or after FIRST_DATA_WAIT_MS with
    // whatever has arrived (a series with no data must not hold the chart back).
    this._firstDataTimer = setTimeout(() => {
      this._firstDataWaitOver = true;
      if (this._seriesLoaded.size) this._markDataArrived();
    }, FIRST_DATA_WAIT_MS);
    this.requestUpdate();
  }

  /** @private */
  _stopLoading() {
    this._fetcher?.stop();
    this._fetcher = null;
    clearTimeout(this._firstDataTimer);
  }

  /**
   * First data is in: render the container; updated() initialises the chart.
   * @private
   */
  _markDataArrived() {
    if (this._dataArrived || !this._fetcher) return;
    clearTimeout(this._firstDataTimer);
    this._dataArrived = true;
    this.requestUpdate();
  }

  /**
   * New points for one series from the fetcher.
   * @private
   * @param {number} index
   * @param {Array<{t: number, v: any}>} points
   */
  _onSeriesUpdate(index, points) {
    if (index >= this._series.length) {
      this._onBandUpdate(index - this._series.length, points);
      return;
    }
    this._seriesPoints[index] = points;
    if (!this._dataArrived) {
      // Drawing with the first series alone and adding the rest as they arrive
      // rescales the axis mid-animation: the chart visibly jumps.
      this._seriesLoaded.add(index);
      if (this._firstDataWaitOver || this._seriesLoaded.size >= this._series.length) this._markDataArrived();
      return;
    }
    if (!this._chart || !this._chartReady) return;
    try {
      if (this._isZoomed()) {
        // A zoomed chart keeps its zoom: updateSeries() would put back the last
        // axis range it was given (the window), so the data goes in together
        // with the zoomed range, which ApexCharts then keeps as that range. The
        // last argument keeps the window as the range a reset returns to.
        const { min, max } = /** @type {any} */ (this._chart).w.config.xaxis;
        settleUpdate(this._chart.updateOptions(definedOptions({ xaxis: { min, max }, series: this._buildApexSeries() }), false, false, false, false), 'series (zoomed)');
      } else {
        settleUpdate(this._chart.updateOptions(definedOptions({ xaxis: this._windowAxis() }), false, false, false), 'window');
        settleUpdate(this._chart.updateSeries(this._buildApexSeries(), false), 'series');
      }
    } catch (error) {
      lcardsLog.error('[LCARdSChart] Error updating chart data:', error);
    }
  }

  /**
   * New text points for one state band: redraw the annotations (bands never
   * hold the first draw back).
   * @private
   * @param {number} index - Band index
   * @param {Array<{t: number, v: any}>} points
   */
  _onBandUpdate(index, points) {
    this._bandPoints[index] = points;
    if (!this._chart || !this._chartReady) return;
    try {
      settleUpdate(this._chart.updateOptions(definedOptions({ annotations: this._buildChartOptions().annotations }), false, false, false), 'bands');
    } catch (error) {
      lcardsLog.error('[LCARdSChart] Error updating state bands:', error);
    }
  }

  /**
   * Pre-evaluate Jinja2/JS templates found in the style config so that
   * synchronous chart colour resolution can call `_resolveTemplateValue()`
   * and get the already-resolved result from `_evaluatedStyleCache`.
   * @protected
   * @override
   */
  async _processCustomTemplates() {
    if (this.config.style) {
      await this._preEvaluateStyleTemplates(this.config.style, 'style');
    }
    await super._processCustomTemplates();
  }

  /**
   * Called after every render - initialize chart when container is ready
   * @public
   */
  updated(changedProperties) {
    super.updated(changedProperties);

    if (this._chartInitialized || !this._dataArrived) {
      return;
    }

    const container = /** @type {HTMLElement|null} */ (this.renderRoot.querySelector('.chart-container'));
    if (!container) {
      return;
    }

    // Only initialize once the container has real dimensions
    if (container.offsetWidth > 0 && container.offsetHeight > 0) {
      this._chartInitialized = true;
      this._initializeChart();
    }
  }

  /**
   * Check for ancestor element, traversing shadow DOM boundaries
   * @protected
   */
  _checkForAncestor(selectors) {
    let current = /** @type {Element | null} */ (this);
    const maxLevels = 20;

    for (let i = 0; i < maxLevels && current; i++) {
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
   * Alert mode changed the palette (LCARdSCard subscribes; called as soon as
   * the CSS variables are written): rebuild the chart options, which resolve
   * colours to concrete values. Cheaper than the default config re-process.
   * @protected
   * @param {string} _mode - Incoming alert mode (unused; colours are re-read from CSS)
   */
  _onAlertModeChanged(_mode) {
    if (this._chart && this._chartReady) {
      this._updateChartOptions();
      // Timeline bars carry their state colours in the series data
      if (this.config.chart_type === 'rangeBar') settleUpdate(this._chart.updateSeries(this._buildApexSeries(), false), 'alert series');
    }
  }

  /**
   * Display details for a series: legend name and unit.
   * @private
   * @param {import('../charts/chart-sources.js').ChartSeries} series
   * @returns {{name: string, unit: string|undefined}}
   */
  _seriesDisplay(series) {
    const entity = series.entity ? this.getEntityState(series.entity) : null;
    const name = series.name
      ?? entity?.attributes?.friendly_name
      ?? series.entity
      ?? (series.buffer ? `${series.datasource} (${series.buffer})` : series.datasource);
    const unit = series.unit ?? (series.attribute ? undefined : entity?.attributes?.unit_of_measurement);
    return { name, unit };
  }

  /**
   * Series with display details resolved (legend name, unit).
   * @private
   * @returns {Array<Object>}
   */
  _displaySeries() {
    return this._series.map(s => ({ ...s, ...this._seriesDisplay(s) }));
  }

  /**
   * Series in ApexCharts format (see buildApexSeries).
   * @private
   * @returns {Array<any>}
   */
  _buildApexSeries() {
    // Same wall-clock values as the full build (Home Assistant's time zone).
    const { points } = timeAxisData({ config: this.config, span: this._fetcher?.span, points: this._seriesPoints, hass: this.hass });
    return buildApexSeries({
      series: this._displaySeries(),
      points,
      chartType: this.config.chart_type || 'line',
      timeline: this._timelineContext()
    });
  }

  /**
   * rangeBar timeline: each source's entity, Home Assistant's state colours
   * read from this card (a view or section theme applies), configured colours
   * made concrete, and Home Assistant's translated state text.
   * @private
   * @returns {import('../charts/chart-timeline.js').TimelineContext}
   */
  _timelineContext() {
    // One colourer per config keeps each free-text state on the same graph colour
    this._stateColorer ??= createTimelineColorer((name) => getComputedStyle(this).getPropertyValue(name));
    return {
      stateObjFor: (entityId) => this.getEntityState(entityId) ?? null,
      colorer: this._stateColorer,
      resolve: (value) => /** @type {string} */ (resolveColor(value, { concrete: true, element: this })),
      formatState: (stateObj, state) => (stateObj?.state !== undefined && this.hass?.formatEntityState?.(stateObj, state)) || state
    };
  }

  /**
   * Fix the datetime x-axis to the chart's time window (on Home Assistant's
   * wall clock, like the full build).
   * @private
   * @returns {Object} xaxis options (empty for non-time charts)
   */
  _windowAxis() {
    return timeAxisData({ config: this.config, span: this._fetcher?.span, points: [], hass: this.hass }).axis;
  }

  /**
   * Initialize ApexCharts instance
   * Called from updated() when container has valid dimensions
   * @private
   */
  async _initializeChart() {
    const generation = ++this._chartGeneration;
    const container = /** @type {HTMLElement|null} */ (this.renderRoot.querySelector('.chart-container'));
    if (!container) {
      this._chartInitialized = false;
      return;
    }

    try {
      this._chartOptions = this._buildChartOptions(container.offsetWidth || 400, container.offsetHeight || 200);

      const ApexCharts = await loadApexCharts();
      // The card may have been disconnected or reconfigured while the chunk loaded.
      if (generation !== this._chartGeneration || !container.isConnected) {
        return;
      }
      const chart = new ApexCharts(container, this._chartOptions);
      this._chart = chart;
      await chart.render();
      // A config change or disconnect during the render destroyed this chart and
      // may have started a new one: marking it ready would let updates reach the
      // new chart mid-render (ApexCharts throws "reading 'radar'").
      if (generation !== this._chartGeneration || this._chart !== chart) {
        return;
      }
      this._observeChartSize(container);
      this._joinSyncGroup(container);

      this._chartReady = true;
      this._error = null;
      lcardsLog.debug(`[LCARdSChart] Chart initialized for ${this.config?.id || this._cardGuid}`);
    } catch (error) {
      // a chart destroyed mid-render can reject: that is not this config's error
      if (generation !== this._chartGeneration) return;
      lcardsLog.error(`[LCARdSChart] Error initializing chart:`, error);
      this._error = `Chart initialization failed: ${error.message}`;
      this.requestUpdate();
    }
  }

  /**
   * sync_group: join the group (ApexCharts' own group is set in the options),
   * publish the time under the pointer, and draw other members' times.
   * @private
   * @param {HTMLElement} container
   */
  _joinSyncGroup(container) {
    this._leaveSyncGroup();
    const group = this.config?.sync_group;
    if (!group || !this._chart) return;
    /** @type {import('../charts/chart-sync-group.js').SyncMember} */
    const member = {
      showTime: (time, source) => this._showSyncCursor(time, source, member),
      window: () => this._xWindow(),
      apexSynced: () => (this.config?.chart_type || 'line') !== 'rangeBar'
    };
    let frame = 0;
    /** @param {PointerEvent} event */
    const onMove = (event) => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        const plot = this._plotRect();
        const window = this._xWindow();
        const time = plot && window ? timeAtX(event.clientX - plot.left, plot.width, window) : null;
        publishSyncTime(group, member, time);
      });
    };
    const onLeave = () => {
      cancelAnimationFrame(frame);
      frame = 0;
      publishSyncTime(group, member, null);
    };
    container.addEventListener('pointermove', onMove);
    container.addEventListener('pointerleave', onLeave);
    const leave = joinSyncGroup(group, member);
    // A rolling window ends on the next whole minute (windowAxis): move the
    // axis on the minute, as every member does, so their windows stay equal.
    /** @type {ReturnType<typeof setTimeout>|undefined} */
    let minuteTimer;
    const onMinute = () => {
      minuteTimer = setTimeout(onMinute, SYNC_WINDOW_STEP_MS - (Date.now() % SYNC_WINDOW_STEP_MS) + 20);
      if (!this._chart || !this._chartReady || this._isZoomed()) return;
      this._fetcher?.refreshSpan();
      try {
        settleUpdate(this._chart.updateOptions(definedOptions({ xaxis: this._windowAxis() }), false, false, false), 'sync_group window');
      } catch (error) {
        lcardsLog.warn('[LCARdSChart] sync_group: axis update failed', error);
      }
    };
    minuteTimer = setTimeout(onMinute, SYNC_WINDOW_STEP_MS - (Date.now() % SYNC_WINDOW_STEP_MS) + 20);
    this._syncCleanup = () => {
      clearTimeout(minuteTimer);
      cancelAnimationFrame(frame);
      container.removeEventListener('pointermove', onMove);
      container.removeEventListener('pointerleave', onLeave);
      publishSyncTime(group, member, null);
      leave();
    };
  }

  /** @private */
  _leaveSyncGroup() {
    this._syncCleanup?.();
    this._syncCleanup = null;
    this._showSyncCursor(null);
  }

  /**
   * Whether the user has zoomed the chart (toolbar, drag): live updates then
   * leave the x range alone until the zoom is reset.
   * @private
   * @returns {boolean}
   */
  _isZoomed() {
    return !!(/** @type {any} */ (this._chart)?.w?.interact?.zoomed);
  }

  /**
   * The x window the chart shows now (wall-clock values on a time axis).
   * @private
   * @returns {{min: number, max: number}|null}
   */
  _xWindow() {
    // ApexCharts' own plotted range (what its sync compares and the plot width
    // spans); a horizontal timeline keeps its time range in minY / maxY.
    const g = /** @type {any} */ (this._chart)?.w?.globals;
    const [min, max] = g ? (g.isBarHorizontal ? [g.minY, g.maxY] : [g.minX, g.maxX]) : [];
    if (Number.isFinite(min) && Number.isFinite(max) && max > min && Math.abs(max) < 1e300) return { min, max };
    const axis = this._windowAxis();
    return axis.min !== undefined && axis.max !== undefined ? { min: axis.min, max: axis.max } : null;
  }

  /**
   * The plot area (inside the axes) in viewport pixels, from ApexCharts' layout.
   * @private
   * @returns {{left: number, top: number, width: number, height: number}|null}
   */
  _plotRect() {
    const g = /** @type {any} */ (this._chart)?.w?.globals;
    const svg = this.renderRoot.querySelector('.apexcharts-svg');
    if (!g || !svg) return null;
    const box = svg.getBoundingClientRect();
    return { left: box.left + g.translateX, top: box.top + g.translateY, width: g.gridWidth, height: g.gridHeight };
  }

  /**
   * Draw another member's hover time as a dashed line over the plot, unless
   * ApexCharts already shows its crosshair here (null hides it).
   * @private
   * @param {number|null} time
   * @param {import('../charts/chart-sync-group.js').SyncMember} [source]
   * @param {import('../charts/chart-sync-group.js').SyncMember} [self]
   */
  _showSyncCursor(time, source, self) {
    const cursor = /** @type {HTMLElement|null} */ (this.renderRoot?.querySelector('.sync-cursor'));
    if (!cursor) return;
    const plot = time === null || !source || !self || apexShowsCursor(self, source) ? null : this._plotRect();
    const window = plot ? this._xWindow() : null;
    const x = plot && window && time !== null ? xAtTime(time, plot.width, window) : null;
    const host = /** @type {HTMLElement|null} */ (this.renderRoot.querySelector('.lcards-card-container'));
    if (x === null || !plot || !host) {
      cursor.hidden = true;
      return;
    }
    const origin = host.getBoundingClientRect();
    cursor.style.transform = `translate(${plot.left - origin.left + x}px, ${plot.top - origin.top}px)`;
    cursor.style.height = `${plot.height}px`;
    cursor.hidden = false;
  }

  /**
   * Follow the container's size. ApexCharts gets a fixed pixel size (and some
   * types get sizes fitted to it, see ApexChartsAdapter._fitRadar), so a card that
   * changes size (sidebar, edit mode, rotation) redraws at the new size.
   * @private
   * @param {HTMLElement} container
   */
  _observeChartSize(container) {
    this._resizeObserverChart?.disconnect();
    // ApexCharts sets min-height on its own container to the chart height, so the
    // container can't shrink and measuring it feeds back; the card container's
    // size comes from the card (grid cell, config height) instead.
    const box = container.parentElement ?? container;
    let last = [box.offsetWidth, box.offsetHeight];
    let timer = null;
    // The timer can outlive this chart: a config change destroys it and starts a new
    // one, and updateOptions() on a chart that is still rendering throws inside
    // ApexCharts. Only the chart this observer was made for, once it is ready.
    const chart = this._chart;
    this._resizeObserverChart = new ResizeObserver(() => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        const size = [box.offsetWidth, box.offsetHeight];
        if (!this._chart || this._chart !== chart || !this._chartReady) return;
        // 2 px hysteresis absorbs sub-pixel jitter (see LCARdSCard._setupAutoSizing)
        if (!size[0] || !size[1] || (Math.abs(size[0] - last[0]) < 2 && Math.abs(size[1] - last[1]) < 2)) return;
        last = size;
        const options = this._buildChartOptions(size[0], size[1]);
        this._chartOptions = options;
        settleUpdate(this._chart.updateOptions(definedOptions({
          chart: { width: size[0], height: size[1] },
          plotOptions: options.plotOptions,
          grid: options.grid
        }), false, false, false), 'resize');
      }, 100);
    });
    this._resizeObserverChart.observe(box);
  }

  /**
   * Build ApexCharts options from config
   * @private
   * @param {number} width - Container width in pixels
   * @param {number} height - Container height in pixels
   * @returns {Object} ApexCharts options
   */
  _buildChartOptions(width = 400, height = 200) {
    const tm = this._singletons?.themeManager;
    // Theme defaults < card style (with rule patches): user config always wins
    const tokensRead = [];
    const defaults = tm ? chartStyleDefaults(path => { tokensRead.push(path); return tm.getToken(path); }) : {};
    const userStyle = this._getMergedStyleWithRules(this.config.style || {});
    const style = deepMerge(defaults, userStyle);
    this._trackChartDefaults(defaults, userStyle, tokensRead);

    return buildChartOptions({
      config: this.config,
      style,
      series: this._displaySeries(),
      points: this._seriesPoints,
      span: this._fetcher?.span,
      size: [width, height],
      hass: this.hass,
      resolveStyle: tm ? (st) => resolveThemeTokensRecursive(st, tm) : undefined,
      // a theme on the chart's view or section sets the CSS variables its colours read
      element: this,
      timeline: this._timelineContext(),
      chartId: `lcards-chart-${this._cardGuid}`,
      bands: this._bands,
      bandPoints: this._bandPoints
    });
  }

  /**
   * Provenance: the chart's theme defaults, for each style field the config
   * doesn't set ('built-in'), and the theme tokens they came from.
   * @private
   */
  _trackChartDefaults(defaults, userStyle, tokensRead) {
    const tracker = this._provenanceTracker;
    if (!tracker) return;
    tracker.clearRuntime('built-in');
    const walk = (node, user, path) => {
      if (node && typeof node === 'object' && !Array.isArray(node)) {
        for (const [k, v] of Object.entries(node)) walk(v, user?.[k], `${path}.${k}`);
      } else if (user === undefined) {
        tracker.trackRuntime(path, 'built-in', node, { from: 'chart theme defaults' });
      }
    };
    walk(defaults, userStyle, 'style');
    for (const token of new Set(tokensRead)) this._trackTokenUse(token, ['style (chart defaults)']);
  }

  /**
   * Config changed (editor, YAML, Studio): tear down the chart and reload
   * series with the new config.
   * @override
   */
  setConfig(config) {
    this._leaveSyncGroup();
    this._resizeObserverChart?.disconnect();
    this._resizeObserverChart = null;
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
    this._chartGeneration++;
    this._stateColorer = null;

    super.setConfig(config);

    if (this._firstUpdateDone && this.isConnected) {
      this._startLoading();
    }
  }

  /**
   * Update chart options (rule patches, alert mode) without a full reinit
   * @private
   */
  _updateChartOptions() {
    // a chart still rendering takes its options from _buildChartOptions() already
    if (!this._chart || !this._chartReady) return;

    try {
      const newOptions = this._buildChartOptions();
      settleUpdate(this._chart.updateOptions(definedOptions({
        colors: newOptions.colors,
        stroke: newOptions.stroke,
        fill: newOptions.fill,
        grid: newOptions.grid,
        legend: newOptions.legend,
        markers: newOptions.markers,
        dataLabels: newOptions.dataLabels,
        tooltip: newOptions.tooltip,
        // a zoomed chart keeps its zoomed range
        xaxis: this._isZoomed() ? { ...newOptions.xaxis, min: this._chart.w.config.xaxis.min, max: this._chart.w.config.xaxis.max } : newOptions.xaxis,
        yaxis: newOptions.yaxis,
        // thresholds and state bands (their colours follow the alert mode)
        annotations: newOptions.annotations
      }), false, false, false, !this._isZoomed()), 'options');
    } catch (error) {
      lcardsLog.error(`[LCARdSChart] Error updating chart options:`, error);
    }
  }

  /**
   * Render the chart card
   * @protected
   */
  _renderCard() {
    if (this._showPlaceholder()) {
      return this._renderPreview();
    }

    // Keep .chart-container mounted while the chart exists: ApexCharts owns its
    // children. Loading and error states are overlays.
    const problems = this._series
      .map(s => arrayChartProblem(s, this.config.chart_type || 'line'))
      .filter(Boolean);
    return html`
      <div class="lcards-card-container">
        <div class="chart-container"></div>
        <div class="sync-cursor" hidden></div>
        ${this._error || problems.length
          ? html`<div class="chart-overlay chart-error">${this._error ?? problems[0]}</div>`
          : !this._dataArrived
            ? html`<div class="chart-overlay chart-loading">Loading chart data...</div>`
            : ''}
      </div>
    `;
  }

  /**
   * Render preview mode placeholder (card picker / edit dialog without data).
   * Colours come from CSS classes because SVG presentation attributes can't
   * resolve var().
   * @private
   */
  _renderPreview() {
    const chartType = this.config.chart_type || 'line';
    const seriesColor = this.config.style?.colors?.series?.[0];
    const accent = typeof seriesColor === 'string' && !seriesColor.startsWith('theme:')
      ? `--preview-accent: ${seriesColor}`
      : '';

    return html`
      <div class="lcards-card-container">
        <svg class="chart-preview" viewBox="0 0 400 200" style="width: 100%; height: 100%; ${accent}">
          <rect class="preview-bg" width="400" height="200" rx="4"/>
          ${[50, 100, 150].map(y => svg`<line class="preview-grid" x1="0" y1=${y} x2="400" y2=${y}/>`)}
          ${[100, 200, 300].map(x => svg`<line class="preview-grid" x1=${x} y1="0" x2=${x} y2="200"/>`)}
          ${this._renderPreviewChart(chartType)}
          <text class="preview-title" x="200" y="30" text-anchor="middle">${chartType.toUpperCase()} CHART</text>
          <text class="preview-hint" x="200" y="190" text-anchor="middle">Configure a source to display data</text>
        </svg>
      </div>
    `;
  }

  /**
   * Render the preview shape for a chart type
   * @private
   * @param {string} chartType
   */
  _renderPreviewChart(chartType) {
    if (chartType === 'area' || chartType === 'rangeArea') {
      return svg`<path class="preview-area" d="M 20,140 L 80,120 L 140,160 L 200,80 L 260,100 L 320,60 L 380,90 L 380,180 L 20,180 Z"/>`;
    }
    if (chartType === 'bar' || chartType === 'column') {
      return [[40, 120, 60], [120, 100, 80], [200, 80, 100], [280, 110, 70]]
        .map(([x, y, h]) => svg`<rect class="preview-bar" x=${x} y=${y} width="40" height=${h}/>`);
    }
    return svg`<path class="preview-line" d="M 20,140 L 80,120 L 140,160 L 200,80 L 260,100 L 320,60 L 380,90"/>`;
  }

  /**
   * Cleanup on disconnect (called by LCARdSCard.disconnectedCallback()).
   * _onConnected() resumes loading if the card comes back.
   * @protected
   */
  _onDisconnected() {
    this._leaveSyncGroup();
    this._stopLoading();
    this._resizeObserverChart?.disconnect();
    this._resizeObserverChart = null;

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
    this._chartGeneration++;
    this._dataArrived = false;


    super._onDisconnected();
  }

  /**
   * Get card size for HA layout
   * @protected
   */
  _getCardSize() {
    return Math.ceil((this._configPx(this.config?.height) || 200) / 50);
  }

  getGridOptions() {
    const go = this.config.grid_options || {};
    return {
      columns: go.columns ?? 6,
      rows: go.rows ?? 4,
      min_columns: 4,
      min_rows: 2,
    };
  }

  /**
   * Get stub config for GUI editor preview
   * @static
   */
  static getStubConfig() {
    return {
      type: 'custom:lcards-chart',
      chart_type: 'line'
      // No sources: the card picker shows the static preview
    };
  }

  /**
   * Get config element (editor) for Home Assistant GUI
   * @static
   */
  static async getConfigElement() {
    // Editors load on demand (HA awaits getConfigElement), keeping them out of
    // the bundle every dashboard loads.
    await import('../editor/cards/lcards-chart-editor.js');
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

    // Register behavioral defaults (chart_type, height; the x-axis type is
    // picked per chart type when unset, so it is not a default here)
    configManager.registerCardDefaults('chart', { ...CHART_CARD_DEFAULTS });

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

// NOTE: Card registration (customElements.define and window.customCards) handled in src/lcards-main.js
