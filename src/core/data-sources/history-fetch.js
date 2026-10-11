/**
 * @fileoverview History for a data source: the points a DataSource preloads at
 * startup, fetched the same way for the editor's processor preview.
 *
 * Order: hourly long-term statistics (entity state only), else state history over
 * the websocket (with attributes when the source tracks one), else the REST API.
 *
 * @module core/data-sources/history-fetch
 */

import { lcardsLog } from '../../utils/lcards-logging.js';
import { historyNeedsAttributes, historyStatesToPoints } from './ha-history-utils.js';

/** Default and allowed preload span, in hours. */
export const HISTORY_DEFAULT_HOURS = 6;
const MIN_HOURS = 1;
const MAX_HOURS = 168;

/**
 * Hours of history a data source preloads (`history.hours`, else `history.days`,
 * default 6, clamped to 1-168), and whether preloading is on (`history.enabled`,
 * or its older spelling `history.preload`; on unless set to false).
 * @param {Object} cfg - Data source config
 * @returns {{enabled: boolean, hours: number}}
 */
export function historySettings(cfg = {}) {
  const history = cfg.history || {};
  const enabled = history.enabled !== false && history.preload !== false;
  const requested = history.hours ?? (history.days ? history.days * 24 : HISTORY_DEFAULT_HOURS);
  const hours = Math.max(MIN_HOURS, Math.min(MAX_HOURS, Number(requested) || HISTORY_DEFAULT_HOURS));
  return { enabled, hours };
}

/**
 * The value a long-term statistics row stands for.
 * @param {Object} stat - Row from recorder/statistics_during_period
 * @returns {number|null}
 */
export function statisticValue(stat) {
  for (const key of ['mean', 'state', 'sum', 'max', 'min']) {
    if (Number.isFinite(stat?.[key])) return stat[key];
  }
  return null;
}

/**
 * Fetch a data source's history.
 *
 * @param {Object} hass - Home Assistant object (needs `connection`)
 * @param {Object} cfg - Data source config (`entity`, `attribute`, `enum_mapping`, `history`)
 * @param {Object} [options]
 * @param {number} [options.hours] - Span to fetch (default: historySettings(cfg).hours)
 * @param {number} [options.now] - End of the span (epoch ms)
 * @returns {Promise<{points: Array<{t: number, v: number}>, method: 'statistics'|'history'|'rest'|'none'}>}
 */
export async function fetchDataSourceHistory(hass, cfg, { hours = historySettings(cfg).hours, now = Date.now() } = {}) {
  if (!hass?.connection || !cfg?.entity) return { points: [], method: 'none' };
  const endTime = new Date(now);
  const startTime = new Date(now - hours * 3_600_000);

  // Long-term statistics only cover the entity state, so attribute series go
  // straight to state history.
  if (!historyNeedsAttributes(cfg)) {
    try {
      const statisticsData = await hass.connection.sendMessagePromise({
        type: 'recorder/statistics_during_period',
        start_time: startTime.toISOString(),
        end_time: endTime.toISOString(),
        statistic_ids: [cfg.entity],
        period: 'hour'
      });
      const rows = statisticsData?.[cfg.entity];
      if (rows) {
        const points = rows
          .map(stat => ({ t: new Date(stat.start).getTime(), v: statisticValue(stat) }))
          .filter(p => p.v !== null && Number.isFinite(p.t));
        return { points, method: 'statistics' };
      }
    } catch (error) {
      lcardsLog.warn('[history-fetch] Statistics failed, trying state history:', error.message);
    }
  }

  // State history over the websocket. Attributes are only sent when the series
  // needs one; minimal responses drop them from most rows.
  const needsAttributes = historyNeedsAttributes(cfg);
  try {
    const historyData = await hass.connection.sendMessagePromise({
      type: 'history/history_during_period',
      start_time: startTime.toISOString(),
      end_time: endTime.toISOString(),
      entity_ids: [cfg.entity],
      minimal_response: !needsAttributes,
      no_attributes: !needsAttributes
    });
    // Reply shape: { [entity_id]: [{ s, a?, lc?, lu }, ...] }
    const states = historyData?.[cfg.entity];
    return { points: Array.isArray(states) ? historyStatesToPoints(states, cfg) : [], method: 'history' };
  } catch (error) {
    lcardsLog.error('[history-fetch] Websocket state history failed:', error);
  }

  // Last resort: the REST API.
  try {
    const lean = needsAttributes ? '' : '&minimal_response&no_attributes';
    const url = `/api/history/period/${startTime.toISOString()}?filter_entity_id=${cfg.entity}${lean}`;
    const response = await fetch(url, {
      headers: { 'Authorization': `Bearer ${hass.auth?.accessToken}`, 'Content-Type': 'application/json' }
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    // REST reply shape: [[{ state, attributes?, last_changed, last_updated }, ...]]
    const historyData = await response.json();
    return { points: Array.isArray(historyData?.[0]) ? historyStatesToPoints(historyData[0], cfg) : [], method: 'rest' };
  } catch (error) {
    lcardsLog.error('[history-fetch] REST history fallback also failed:', error);
    return { points: [], method: 'none' };
  }
}

/**
 * A data source config with history preload switched on or off and/or a span set,
 * written the current way: off is `history: { enabled: false }`, on drops the
 * flags (on is the default), the older `preload` and `days` keys go, and a
 * default-only `history` is removed altogether.
 * @param {Object} cfg - Data source config
 * @param {{enabled?: boolean, hours?: number}} change
 * @returns {Object} New config
 */
export function withHistorySettings(cfg = {}, { enabled, hours } = {}) {
  const current = historySettings(cfg);
  const { preload, days, enabled: _e, hours: _h, ...rest } = cfg.history || {};
  const on = enabled ?? current.enabled;
  const span = hours ?? (cfg.history?.hours ?? (days ? current.hours : undefined));
  const history = { ...rest };
  if (!on) history.enabled = false;
  if (span !== undefined && span !== HISTORY_DEFAULT_HOURS) history.hours = Math.max(MIN_HOURS, Math.min(MAX_HOURS, Number(span) || HISTORY_DEFAULT_HOURS));
  const next = { ...cfg };
  if (Object.keys(history).length) next.history = history;
  else delete next.history;
  return next;
}
