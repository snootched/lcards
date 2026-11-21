/**
 * @fileoverview Clamp Processor
 *
 * Limits value to a range.
 *
 * @module core/data-sources/processors/ClampProcessor
 */

import { Processor } from './BaseProcessor.js';

/**
 * Clamp Processor
 *
 * Config:
 * ```yaml
 * processor_name:
 *   type: clamp
 *   input_source: source_processor  # Optional
 *   min: 0
 *   max: 100
 * ```
 */
export class ClampProcessor extends Processor {
  constructor(config) {
    super(config);

    this.min = config.min !== undefined ? config.min : -Infinity;
    this.max = config.max !== undefined ? config.max : Infinity;

    if (this.min > this.max) {
      throw new Error('clamp processor: min must be <= max');
    }
  }

  _doProcess(value, timestamp, mainBuffer, processingResults) {
    if (value === null || value === undefined || !Number.isFinite(value)) {
      return null;
    }

    return Math.max(this.min, Math.min(this.max, value));
  }
}
