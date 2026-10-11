/**
 * @fileoverview Statistics Processor
 *
 * Calculates statistical measures over time windows.
 * Consolidates old min_max, rolling_statistics, and session_stats aggregations.
 *
 * @module core/data-sources/processors/StatisticsProcessor
 */

import { Processor } from './BaseProcessor.js';
import { lcardsLog } from '../../../utils/lcards-logging.js';

/**
 * Statistics Processor
 *
 * Config:
 * ```yaml
 * processor_name:
 *   type: statistics
 *   input_source: source_processor  # Optional
 *   window: 24h             # Time window or 'session'
 *   stats: [min, max, mean, median, std_dev, q1, q3, range, count]
 *   max_points: 24          # Optional: if set, returns time-series array
 * ```
 *
 * Output (single value mode):
 * { min: X, max: Y, mean: Z, ... }
 *
 * Output (time-series mode with max_points):
 * [{ t: timestamp, min: X, max: Y, mean: Z }, ...]
 */
export class StatisticsProcessor extends Processor {
  constructor(config) {
    super(config);

    this.window = config.window || 'session';
    this.stats = config.stats || ['min', 'max', 'mean'];
    this.maxPoints = config.max_points || null; // Time-series mode if set

    // Parse time window
    this._windowMs = this._parseTimeWindow(this.window);

    // Session-wide tracking
    this._sessionValues = [];
    this._windowInputs = [];
    this._sessionStartTime = Date.now();

    // Time-series tracking (if max_points set)
    this._timeSeriesData = [];

    lcardsLog.trace(
      `[StatisticsProcessor] ${this.key}: ${this.stats.join(', ')} ` +
      `over ${this.window}${this.maxPoints ? ` (${this.maxPoints} points)` : ''}`
    );
  }

  _doProcess(value, timestamp, mainBuffer, processingResults) {
    if (value === null || value === undefined || !Number.isFinite(value)) {
      return this._getLastResult();
    }

    // Add to session tracking
    this._sessionValues.push({ t: timestamp, v: value });

    // Own input history for time windows: the input may be another processor's
    // output (input_source), so the main buffer's raw values are not it. Kept to
    // the main buffer's capacity, the bound time windows always had.
    this._windowInputs.push({ t: timestamp, v: value });
    const cap = mainBuffer?.capacity ?? 1000;
    if (this._windowInputs.length > cap) this._windowInputs.splice(0, this._windowInputs.length - cap);

    // Get values from window
    const windowValues = this._getWindowValues(timestamp, mainBuffer);

    // Calculate statistics
    const result = this._calculateStatistics(windowValues);

    // If time-series mode, add to series and return array
    if (this.maxPoints) {
      this._timeSeriesData.push({ t: timestamp, ...result });

      // Trim to max_points
      if (this._timeSeriesData.length > this.maxPoints) {
        this._timeSeriesData.shift();
      }

      return this._timeSeriesData.slice(); // Return copy
    }

    // Otherwise return single statistics object
    return result;
  }

  /**
   * Parse time window string to milliseconds
   * @private
   */
  _parseTimeWindow(window) {
    if (window === 'session') {
      return Infinity; // No time limit, use all session data
    }

    const match = window.match(/^(\d+)(s|m|h|d)$/);
    if (!match) {
      lcardsLog.warn(`[StatisticsProcessor] Invalid window format: ${window}, using 1h`);
      return 3600000; // 1 hour default
    }

    const value = parseInt(match[1]);
    const unit = match[2];

    const multipliers = {
      s: 1000,
      m: 60000,
      h: 3600000,
      d: 86400000
    };

    return value * multipliers[unit];
  }

  /**
   * Get values within the time window
   * @private
   */
  _getWindowValues(currentTimestamp, mainBuffer) {
    if (this.window === 'session') {
      // Return all session values
      return this._sessionValues;
    }

    // This processor's own inputs within the time window
    const cutoffTime = currentTimestamp - this._windowMs;
    const firstInWindow = this._windowInputs.findIndex(d => d.t >= cutoffTime);
    if (firstInWindow > 0) this._windowInputs.splice(0, firstInWindow);
    return firstInWindow === -1 ? [] : this._windowInputs;
  }

  /**
   * Calculate requested statistics
   * @private
   */
  _calculateStatistics(data) {
    if (data.length === 0) return null;

    const values = data.map(d => d.v).filter(v => Number.isFinite(v));
    if (values.length === 0) return null;

    const result = {};

    this.stats.forEach(stat => {
      switch (stat) {
        case 'min':
          result.min = Math.min(...values);
          break;

        case 'max':
          result.max = Math.max(...values);
          break;

        case 'mean':
        case 'avg':
          result.mean = values.reduce((a, b) => a + b, 0) / values.length;
          break;

        case 'median':
          result.median = this._calculateMedian(values);
          break;

        case 'std_dev':
        case 'stddev':
          result.std_dev = this._calculateStdDev(values);
          break;

        case 'q1':
          result.q1 = this._calculatePercentile(values, 25);
          break;

        case 'q3':
          result.q3 = this._calculatePercentile(values, 75);
          break;

        case 'range':
          result.range = Math.max(...values) - Math.min(...values);
          break;

        case 'count':
          result.count = values.length;
          break;

        case 'sum':
          result.sum = values.reduce((a, b) => a + b, 0);
          break;
      }
    });

    // Add timestamps
    result.oldest = data[0].t;
    result.newest = data[data.length - 1].t;
    result.window = this.window;

    return result;
  }

  /**
   * Calculate median
   * @private
   */
  _calculateMedian(values) {
    const sorted = values.slice().sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);

    if (sorted.length % 2 === 0) {
      return (sorted[mid - 1] + sorted[mid]) / 2;
    }
    return sorted[mid];
  }

  /**
   * Calculate standard deviation
   * @private
   */
  _calculateStdDev(values) {
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const squaredDiffs = values.map(v => Math.pow(v - mean, 2));
    const variance = squaredDiffs.reduce((a, b) => a + b, 0) / values.length;
    return Math.sqrt(variance);
  }

  /**
   * Calculate percentile
   * @private
   */
  _calculatePercentile(values, percentile) {
    const sorted = values.slice().sort((a, b) => a - b);
    const index = (percentile / 100) * (sorted.length - 1);
    const lower = Math.floor(index);
    const upper = Math.ceil(index);
    const weight = index - lower;

    return sorted[lower] * (1 - weight) + sorted[upper] * weight;
  }

  /**
   * Get last result on error
   * @private
   */
  _getLastResult() {
    if (this.maxPoints && this._timeSeriesData.length > 0) {
      return this._timeSeriesData.slice();
    }
    return null;
  }
}
