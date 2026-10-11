/**
 * @fileoverview Trend Processor
 *
 * Detects trend direction from recent samples.
 *
 * @module core/data-sources/processors/TrendProcessor
 */

import { Processor } from './BaseProcessor.js';

/**
 * Trend Processor
 *
 * Config:
 * ```yaml
 * processor_name:
 *   type: trend
 *   input_source: source_processor  # Optional
 *   samples: 5              # Number of recent samples
 *   threshold: 0.01         # Minimum slope for trend
 * ```
 *
 * Returns: "increasing" | "decreasing" | "stable"
 */
export class TrendProcessor extends Processor {
  constructor(config) {
    super(config);

    this.samples = config.samples || 5;
    this.threshold = config.threshold || 0.01;

    // Recent values tracking
    this._recentValues = [];
  }

  _doProcess(value, timestamp, mainBuffer, processingResults) {
    if (value === null || value === undefined || !Number.isFinite(value)) {
      return this._getLastTrend();
    }

    // Add to recent values
    this._recentValues.push({ t: timestamp, v: value });

    // Keep only requested number of samples
    if (this._recentValues.length > this.samples) {
      this._recentValues.shift();
    }

    // Need at least 2 points to detect trend
    if (this._recentValues.length < 2) {
      return 'stable';
    }

    // Calculate slope using linear regression
    const slope = this._calculateSlope(this._recentValues);

    // Determine trend direction
    if (Math.abs(slope) < this.threshold) {
      return 'stable';
    } else if (slope > 0) {
      return 'increasing';
    } else {
      return 'decreasing';
    }
  }

  /**
   * Calculate slope using simple linear regression
   * @private
   */
  _calculateSlope(data) {
    const n = data.length;

    // Normalize x values to 0, 1, 2, ... for simplicity
    const x = Array.from({ length: n }, (_, i) => i);
    const y = data.map(d => d.v);

    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
    const sumX2 = x.reduce((sum, xi) => sum + xi * xi, 0);

    // Slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX)
    const numerator = n * sumXY - sumX * sumY;
    const denominator = n * sumX2 - sumX * sumX;

    if (denominator === 0) return 0;

    return numerator / denominator;
  }

  /**
   * Get last trend on error
   * @private
   */
  _getLastTrend() {
    if (this._recentValues.length < 2) return 'stable';

    const slope = this._calculateSlope(this._recentValues);

    if (Math.abs(slope) < this.threshold) return 'stable';
    return slope > 0 ? 'increasing' : 'decreasing';
  }
}
