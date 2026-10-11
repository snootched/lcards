/**
 * @fileoverview Rate Processor
 *
 * Calculates rate of change (derivative).
 *
 * @module core/data-sources/processors/RateProcessor
 */

import { Processor } from './BaseProcessor.js';

/**
 * Rate Processor
 *
 * Config:
 * ```yaml
 * processor_name:
 *   type: rate
 *   input_source: source_processor  # Optional
 *   unit: per_second        # per_second, per_minute, per_hour
 *   smoothing: true         # Optional: apply smoothing
 * ```
 */
export class RateProcessor extends Processor {
  constructor(config) {
    super(config);

    this.unit = config.unit || 'per_second';
    this.smoothing = config.smoothing || false;

    // State tracking
    this._previousValue = null;
    this._previousTimestamp = null;
    this._previousRate = null;

    // Time divisors for units
    this._timeDivisors = {
      'per_second': 1000,
      'per_minute': 60000,
      'per_hour': 3600000
    };

    if (!this._timeDivisors[this.unit]) {
      throw new Error(`Unknown rate unit: ${this.unit}`);
    }
  }

  _doProcess(value, timestamp, mainBuffer, processingResults) {
    if (value === null || value === undefined || !Number.isFinite(value)) {
      return this._previousRate;
    }

    // Need at least 2 points to calculate rate
    if (this._previousValue === null) {
      this._previousValue = value;
      this._previousTimestamp = timestamp;
      return 0;
    }

    // Calculate rate of change
    const deltaValue = value - this._previousValue;
    const deltaTime = timestamp - this._previousTimestamp;

    if (deltaTime === 0) {
      return this._previousRate || 0;
    }

    // Convert to requested unit
    const rate = deltaValue / (deltaTime / this._timeDivisors[this.unit]);

    // Apply smoothing if enabled
    const finalRate = this.smoothing && this._previousRate !== null
      ? 0.3 * rate + 0.7 * this._previousRate
      : rate;

    // Update state
    this._previousValue = value;
    this._previousTimestamp = timestamp;
    this._previousRate = finalRate;

    return finalRate;
  }
}
