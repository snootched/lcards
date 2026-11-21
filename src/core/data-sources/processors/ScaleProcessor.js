/**
 * @fileoverview Scale Processor
 *
 * Maps values from one range to another with optional curve types.
 *
 * @module core/data-sources/processors/ScaleProcessor
 */

import { Processor } from './BaseProcessor.js';

/**
 * Scale Processor
 *
 * Config:
 * ```yaml
 * processor_name:
 *   type: scale
 *   input_source: source_processor  # Optional
 *   input_range: [0, 100]
 *   output_range: [0, 1]
 *   curve: linear  # linear, exponential, logarithmic, sigmoid
 * ```
 */
export class ScaleProcessor extends Processor {
  constructor(config) {
    super(config);

    this.inputRange = config.input_range || [0, 100];
    this.outputRange = config.output_range || [0, 1];
    this.curve = config.curve || 'linear';

    if (!Array.isArray(this.inputRange) || this.inputRange.length !== 2) {
      throw new Error('scale processor requires input_range as [min, max]');
    }
    if (!Array.isArray(this.outputRange) || this.outputRange.length !== 2) {
      throw new Error('scale processor requires output_range as [min, max]');
    }

    this._scaleFn = this._getScaleFunction();
  }

  _doProcess(value, timestamp, mainBuffer, processingResults) {
    if (value === null || value === undefined || !Number.isFinite(value)) {
      return null;
    }

    return this._scaleFn(value);
  }

  /**
   * Get scaling function based on curve type
   * @private
   * @returns {Function} Scaling function
   */
  _getScaleFunction() {
    const [inMin, inMax] = this.inputRange;
    const [outMin, outMax] = this.outputRange;

    switch (this.curve) {
      case 'linear':
        return (v) => {
          const normalized = (v - inMin) / (inMax - inMin);
          return outMin + normalized * (outMax - outMin);
        };

      case 'exponential':
        return (v) => {
          const normalized = (v - inMin) / (inMax - inMin);
          const exponential = Math.pow(normalized, 2);
          return outMin + exponential * (outMax - outMin);
        };

      case 'logarithmic':
        return (v) => {
          const normalized = (v - inMin) / (inMax - inMin);
          const logarithmic = Math.log(normalized + 1) / Math.log(2);
          return outMin + logarithmic * (outMax - outMin);
        };

      case 'sigmoid':
        return (v) => {
          const normalized = (v - inMin) / (inMax - inMin);
          const sigmoid = 1 / (1 + Math.exp(-10 * (normalized - 0.5)));
          return outMin + sigmoid * (outMax - outMin);
        };

      default:
        throw new Error(`Unknown curve type: ${this.curve}`);
    }
  }
}
