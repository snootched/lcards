/**
 * ChartSeriesFetcher: loads and keeps chart series up to date.
 *
 * Per series kind:
 * - history:    HA `history/stream` subscription for the window (initial
 *               history plus live updates, no point cap)
 * - statistics: HA `recorder/statistics_during_period`, refetched periodically
 * - datasource: an LCARdS DataSource buffer (processors, shared sources)
 *
 * Points are trimmed to the window, optionally bucketed (group_by), and
 * delivered to `onUpdate(seriesIndex, points)` at most once per throttle
 * interval. Reconnects resubscribe with a fresh window (same approach as HA's
 * own history stream helper).
 *
 * @module charts/chart-series-fetcher
 */

import { lcardsLog } from '../utils/lcards-logging.js';
import {
  historyStatesToPoints,
  historyNeedsAttributes,
  toNumericValue
} from '../core/data-sources/ha-history-utils.js';
import { computeSpan, parseDuration } from './chart-span.js';
import { groupBy } from './chart-group-by.js';

/** How often aligned/rolling windows are re-evaluated (and stale points dropped). */
const WINDOW_TICK_MS = 60_000;
/** Statistics refetch interval by period. */
const STATISTICS_REFRESH_MS = { '5minute': 300_000, hour: 300_000, day: 3_600_000, week: 3_600_000, month: 3_600_000 };

/**
 * Keep points inside the window, plus the last point before it re-stamped at
 * the window start so lines begin at the left edge.
 * @param {Array<{t: number, v: any}>} points - Sorted
 * @param {number} start
 * @returns {Array<{t: number, v: any}>}
 */
export function trimToWindow(points, start) {
  let firstInside = points.findIndex(p => p.t >= start);
  if (firstInside === -1) firstInside = points.length;
  const kept = points.slice(firstInside);
  const carry = points[firstInside - 1];
  if (carry && (kept.length === 0 || kept[0].t > start)) {
    kept.unshift({ t: start, v: carry.v });
  }
  return kept;
}

/**
 * The points a series shows for a window: grouped into buckets when it has
 * group_by; otherwise trimmed to the window. State-like series (history, data
 * sources) keep a carry-in point at the window start so lines reach the left
 * edge; statistics are per-period values, so a carried-in period would show
 * as an extra bar (and squeeze every column to a hairline).
 * @param {Object} series - Normalised series
 * @param {Array<{t: number, v: any}>} raw - Sorted points
 * @param {{start: number, end: number}} span
 * @param {number} [now=Date.now()]
 * @returns {Array<{t: number, v: any}>}
 */
export function windowPoints(series, raw, span, now = Date.now()) {
  const inWindow = raw.filter(p => p.t <= span.end);
  if (series.group_by?.duration) return groupBy(inWindow, series.group_by, span, now);
  if (series.kind === 'statistics') return inWindow.filter(p => p.t >= span.start);
  return trimToWindow(inWindow, span.start);
}

export class ChartSeriesFetcher {
  /**
   * @param {Object} options
   * @param {() => any} options.getHass - Current hass object
   * @param {() => any} [options.getDataSourceManager]
   * @param {(index: number, points: Array<{t: number, v: any}>) => void} options.onUpdate
   * @param {string} [options.logId] - Card id for logs
   * @param {number} [options.throttleMs=1000]
   */
  constructor({ getHass, getDataSourceManager, onUpdate, logId = 'chart', throttleMs = 1000 }) {
    this._getHass = getHass;
    this._getDataSourceManager = getDataSourceManager ?? (() => null);
    this._onUpdate = onUpdate;
    this._logId = logId;
    this._throttleMs = throttleMs;

    /** @type {Array<{series: any, raw: Array<{t:number,v:any}>, stop: (() => void)|null}>} */
    this._states = [];
    this._spanConfig = {};
    /** @type {{start: number, end: number, duration: number, live: boolean} | null} set by start() */
    this._span = null;
    this._dirty = new Set();
    this._flushTimer = null;
    this._lastFlush = 0;
    this._windowTimer = null;
    this._running = false;
  }

  /**
   * Start loading every series. Calling start again restarts from scratch.
   * @param {Array<Object>} seriesList - From normalizeChartSources()
   * @param {{graph_span?: string, span?: Object}} spanConfig
   */
  start(seriesList, spanConfig) {
    this.stop();
    this._running = true;
    this._spanConfig = spanConfig ?? {};
    this._span = computeSpan(this._spanConfig);
    this._states = seriesList.map(series => ({ series, raw: [], stop: null }));

    this._states.forEach((state, index) => this._startSeries(state, index));

    this._windowTimer = setInterval(() => this._onWindowTick(), WINDOW_TICK_MS);
  }

  /** Stop every subscription and timer. */
  stop() {
    this._running = false;
    for (const state of this._states) {
      try {
        state.stop?.();
      } catch (error) {
        lcardsLog.warn(`[ChartSeriesFetcher] ${this._logId}: error stopping series`, error);
      }
    }
    this._states = [];
    this._dirty.clear();
    clearTimeout(this._flushTimer ?? undefined);
    clearInterval(this._windowTimer ?? undefined);
    this._flushTimer = null;
    this._windowTimer = null;
  }

  /** @returns {{start: number, end: number, duration: number, live: boolean}|null} */
  get span() {
    return this._span;
  }

  // ── Window handling ────────────────────────────────────────────────────

  _onWindowTick() {
    if (!this._running) return;
    const next = computeSpan(this._spanConfig);
    const realigned = this._spanConfig.span?.start || this._spanConfig.span?.end;
    if (realigned && next.start !== this._span?.start) {
      // An aligned window rolled over (e.g. midnight): reload everything.
      const seriesList = this._states.map(s => s.series);
      this.start(seriesList, this._spanConfig);
      return;
    }
    this._span = next;
    this._states.forEach((_, index) => this._dirty.add(index));
    this._scheduleFlush();
  }

  // ── Per-series loading ──────────────────────────────────────────────────

  _startSeries(state, index) {
    const { series } = state;
    try {
      if (series.kind === 'datasource') {
        state.stop = this._startDataSource(state, index);
      } else if (series.kind === 'statistics') {
        state.stop = this._startStatistics(state, index);
      } else {
        state.stop = this._startHistory(state, index);
      }
    } catch (error) {
      lcardsLog.error(`[ChartSeriesFetcher] ${this._logId}: failed to start series ${index}`, error);
    }
  }

  /**
   * history/stream subscription with manual resubscribe on reconnect, so the
   * window start is recomputed rather than replayed stale.
   */
  _startHistory(state, index) {
    const connection = this._getHass()?.connection;
    const { series } = state;
    if (!connection || !series.entity) return null;

    const needsAttributes = historyNeedsAttributes(series);
    let unsub = null;
    let disposed = false;

    const subscribe = async () => {
      const span = this._span;
      if (!span) return; // stopped before the subscription ran
      const message = {
        type: 'history/stream',
        entity_ids: [series.entity],
        start_time: new Date(span.start).toISOString(),
        minimal_response: !needsAttributes,
        significant_changes_only: !needsAttributes,
        no_attributes: !needsAttributes
      };
      if (!span.live) message.end_time = new Date(span.end).toISOString();

      let fresh = true;
      const handle = await connection.subscribeMessage((msg) => {
        const rows = msg?.states?.[series.entity];
        if (!Array.isArray(rows)) {
          fresh = false;
          return;
        }
        const points = historyStatesToPoints(rows, series);
        if (fresh) {
          state.raw = points;
          fresh = false;
        } else if (points.length) {
          state.raw = state.raw.concat(points);
          if (points[0].t < state.raw[state.raw.length - points.length - 1]?.t) {
            state.raw.sort((a, b) => a.t - b.t);
          }
        }
        this._markDirty(index);
      }, message, { resubscribe: false });

      if (disposed) {
        handle().catch(() => undefined);
        return;
      }
      unsub = handle;
    };

    const onReady = () => {
      if (disposed) return;
      unsub = null;
      this._span = computeSpan(this._spanConfig);
      subscribe().catch(error =>
        lcardsLog.warn(`[ChartSeriesFetcher] ${this._logId}: history resubscribe failed`, error));
    };

    subscribe().catch(error =>
      lcardsLog.error(`[ChartSeriesFetcher] ${this._logId}: history subscribe failed for ${series.entity}`, error));
    connection.addEventListener('ready', onReady);

    return () => {
      disposed = true;
      // Removing a listener while the connection is dispatching 'ready' would
      // skip the next listener (see issue #381), so defer it.
      queueMicrotask(() => connection.removeEventListener('ready', onReady));
      unsub?.().catch(() => undefined);
    };
  }

  /** Long-term statistics, refetched on a timer. */
  _startStatistics(state, index) {
    const { series } = state;
    const { type, period } = series.statistics;
    const types = series.fetchMinMax ? ['min', 'max'] : [type];
    let timer = null;
    let stopped = false;

    const fetch = async () => {
      const connection = this._getHass()?.connection;
      if (!connection || stopped) return;
      const span = this._span;
      if (!span) return;
      try {
        const reply = await connection.sendMessagePromise({
          type: 'recorder/statistics_during_period',
          start_time: new Date(span.start).toISOString(),
          end_time: new Date(Math.min(span.end, Date.now())).toISOString(),
          statistic_ids: [series.entity],
          period,
          types
        });
        if (stopped) return;
        const rows = reply?.[series.entity] ?? [];
        state.raw = rows
          .map(row => {
            const t = typeof row.start === 'number' ? row.start : new Date(row.start).getTime();
            const v = series.fetchMinMax
              ? (Number.isFinite(row.min) && Number.isFinite(row.max) ? [row.min, row.max] : null)
              : toNumericValue(row[type]);
            return { t, v };
          })
          .filter(p => Number.isFinite(p.t) && p.v !== null);
        this._markDirty(index);
      } catch (error) {
        lcardsLog.warn(`[ChartSeriesFetcher] ${this._logId}: statistics fetch failed for ${series.entity}`, error);
      }
    };

    fetch();
    timer = setInterval(fetch, STATISTICS_REFRESH_MS[period] ?? 300_000);
    return () => {
      stopped = true;
      clearInterval(timer);
    };
  }

  /** A named LCARdS DataSource (main buffer or a processor buffer). */
  _startDataSource(state, index) {
    const { series } = state;
    let unsubscribe = null;
    let retry = null;

    const attach = () => {
      const source = this._getDataSourceManager()?.getSource(series.datasource);
      if (!source) return false;
      const read = () => {
        const buffer = series.buffer ? source.getProcessorBuffer?.(series.buffer) : source.buffer;
        if (series.buffer && !buffer) {
          lcardsLog.warn(`[ChartSeriesFetcher] ${this._logId}: buffer '${series.buffer}' not found on '${series.datasource}'`);
        }
        state.raw = (buffer ?? source.buffer)?.getAll?.() ?? [];
        this._markDirty(index);
      };
      unsubscribe = source.subscribe(read);
      read();
      return true;
    };

    if (!attach()) {
      // The source may belong to a card that hasn't initialised yet.
      retry = setTimeout(() => {
        if (!attach()) {
          lcardsLog.warn(`[ChartSeriesFetcher] ${this._logId}: DataSource '${series.datasource}' not found`);
        }
      }, 2000);
    }

    return () => {
      clearTimeout(retry ?? undefined);
      if (typeof unsubscribe === 'function') unsubscribe();
      else unsubscribe?.unsubscribe?.();
    };
  }

  // ── Delivery ────────────────────────────────────────────────────────────

  _markDirty(index) {
    this._dirty.add(index);
    this._scheduleFlush();
  }

  _scheduleFlush() {
    if (this._flushTimer || !this._running) return;
    const wait = Math.max(0, this._throttleMs - (Date.now() - this._lastFlush));
    this._flushTimer = setTimeout(() => {
      this._flushTimer = null;
      this._flush();
    }, wait);
  }

  _flush() {
    if (!this._running) return;
    this._lastFlush = Date.now();
    const span = this._span;
    if (!span) return;
    for (const index of this._dirty) {
      const state = this._states[index];
      if (!state) continue;
      const { series } = state;
      // Drop history that has scrolled out of a rolling window.
      if (series.kind === 'history') {
        state.raw = trimToWindow(state.raw, span.start - (parseDuration(series.group_by?.duration) ?? 0));
      }
      this._onUpdate(index, windowPoints(series, state.raw, span));
    }
    this._dirty.clear();
  }
}
