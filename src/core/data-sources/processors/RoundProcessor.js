/**
 * @fileoverview Round Processor
 *
 * Rounds values to specified precision.
 *
 * @module core/data-sources/processors/RoundProcessor
 */

import { Processor } from './BaseProcessor.js';

/**
 * Round Processor
 *
 * Config:
 * ```yaml
 * processor_name:
 *   type: round
 *   input_source: source_processor  # Optional
 *   precision: 1            # Decimal places
 *   method: round           # round, floor, ceil
 * ```
 */
export class RoundProcessor extends Processor {
  constructor(config) {
    super(config);

    this.precision = config.precision !== undefined ? config.precision : 0;
    this.method = config.method || 'round';

    const validMethods = ['round', 'floor', 'ceil'];
    if (!validMethods.includes(this.method)) {
      throw new Error(`round processor: method must be one of ${validMethods.join(', ')}`);
    }

    // Precompute multiplier for precision
    this._multiplier = Math.pow(10, this.precision);
  }

  _doProcess(value, timestamp, mainBuffer, processingResults) {
    if (value === null || value === undefined || !Number.isFinite(value)) {
      return null;
    }

    const scaled = value * this._multiplier;

    let result;
    switch (this.method) {
      case 'round':
        result = Math.round(scaled);
        break;
      case 'floor':
        result = Math.floor(scaled);
        break;
      default: // 'ceil' (the constructor rejects any other method)
        result = Math.ceil(scaled);
        break;
    }

    return result / this._multiplier;
  }
}
