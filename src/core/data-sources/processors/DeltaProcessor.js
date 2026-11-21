/**
 * @fileoverview Delta Processor
 *
 * Calculates change from previous value.
 *
 * @module core/data-sources/processors/DeltaProcessor
 */

import { Processor } from './BaseProcessor.js';

/**
 * Delta Processor
 *
 * Config:
 * ```yaml
 * processor_name:
 *   type: delta
 *   input_source: source_processor  # Optional
 *   absolute: false         # true = |change|, false = signed change
 * ```
 */
export class DeltaProcessor extends Processor {
  constructor(config) {
    super(config);

    this.absolute = config.absolute || false;

    // State tracking
    this._previousValue = null;
  }

  _doProcess(value, timestamp, mainBuffer, processingResults) {
    if (value === null || value === undefined || !Number.isFinite(value)) {
      return 0;
    }

    // First value, delta is 0
    if (this._previousValue === null) {
      this._previousValue = value;
      return 0;
    }

    // Calculate delta
    const delta = value - this._previousValue;

    // Update state
    this._previousValue = value;

    // Return absolute or signed delta
    return this.absolute ? Math.abs(delta) : delta;
  }
}
