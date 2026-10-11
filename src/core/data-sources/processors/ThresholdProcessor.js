/**
 * @fileoverview Threshold Processor
 *
 * Binary threshold conversion with optional hysteresis.
 *
 * @module core/data-sources/processors/ThresholdProcessor
 */

import { Processor } from './BaseProcessor.js';

/**
 * Threshold Processor
 *
 * Config:
 * ```yaml
 * processor_name:
 *   type: threshold
 *   input_source: source_processor  # Optional
 *   threshold: 20
 *   above: 1                # Value when above threshold
 *   below: 0                # Value when below threshold
 *   hysteresis: 2           # Optional: prevent flapping
 * ```
 */
export class ThresholdProcessor extends Processor {
  constructor(config) {
    super(config);

    this.threshold = config.threshold;
    this.above = config.above !== undefined ? config.above : 1;
    this.below = config.below !== undefined ? config.below : 0;
    this.hysteresis = config.hysteresis || 0;

    if (this.threshold === undefined) {
      throw new Error('threshold processor requires "threshold" field');
    }

    // State for hysteresis
    this._currentState = null; // null, 'above', 'below'
  }

  _doProcess(value, timestamp, mainBuffer, processingResults) {
    if (value === null || value === undefined || !Number.isFinite(value)) {
      return this._currentState === 'above' ? this.above : this.below;
    }

    // With hysteresis, we need different thresholds for up and down transitions
    const upperThreshold = this.threshold + this.hysteresis / 2;
    const lowerThreshold = this.threshold - this.hysteresis / 2;

    // Initialize state if not set
    if (this._currentState === null) {
      this._currentState = value >= this.threshold ? 'above' : 'below';
      return this._currentState === 'above' ? this.above : this.below;
    }

    // Check for state changes with hysteresis
    if (this._currentState === 'below' && value >= upperThreshold) {
      this._currentState = 'above';
    } else if (this._currentState === 'above' && value <= lowerThreshold) {
      this._currentState = 'below';
    }

    return this._currentState === 'above' ? this.above : this.below;
  }
}
