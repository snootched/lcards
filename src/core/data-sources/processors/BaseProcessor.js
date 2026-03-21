/**
 * @fileoverview Base Processor class for all data processing operations
 *
 * All processors extend this base class which provides:
 * - Dependency tracking via from: field
 * - Performance statistics
 * - Error handling and fallback values
 * - Standard processing interface
 *
 * @module core/data-sources/processors/BaseProcessor
 */

import { lcardsLog } from '../../../utils/lcards-logging.js';

/**
 * Base Processor class - all processors extend this
 */
export class Processor {
  constructor(config) {
    this.config = config;
    this.key = config.key;
    this.type = config.type;
    this.enabled = config.enabled !== false;

    // Dependency tracking - use input_source not 'from' (from is used by convert_unit for unit names)
    this._dependency = config.input_source || null; // Processor this depends on

    // Performance tracking
    this._stats = {
      executions: 0,
      errors: 0,
      totalTime: 0
    };
  }

  /**
   * Get the processor this one depends on
   * @returns {string|null} Dependency key or null
   */
  getDependency() {
    return this._dependency;
  }

  /**
   * Process a value
   * @param {number} value - Input value
   * @param {number} timestamp - Timestamp
   * @param {Object} mainBuffer - Main data buffer
   * @param {Object} processingResults - Results from other processors
   * @returns {number|Object} Processed value
   */
  process(value, timestamp, mainBuffer, processingResults) {
    if (!this.enabled) return value;

    const startTime = performance.now();

    try {
      const result = this._doProcess(value, timestamp, mainBuffer, processingResults);

      this._stats.executions++;
      this._stats.totalTime += performance.now() - startTime;

      return result;
    } catch (error) {
      this._stats.errors++;
      lcardsLog.error(`[${this.type}] Processing error:`, error);
      return this._getFallbackValue(value);
    }
  }

  /**
   * Override this in subclasses
   * @param {number} value - Input value
   * @param {number} timestamp - Timestamp
   * @param {Object} mainBuffer - Main buffer
   * @param {Object} processingResults - Results from other processors
   * @returns {number|Object} Processed result
   */
  _doProcess(value, timestamp, mainBuffer, processingResults) {
    throw new Error('_doProcess must be implemented in subclass');
  }

  /**
   * Get fallback value on error
   * @param {number} value - Original value
   * @returns {number|null} Fallback value
   */
  _getFallbackValue(value) {
    return value; // Default: return original value
  }

  /**
   * Get performance statistics
   * @returns {Object} Statistics
   */
  getStats() {
    return {
      ...this._stats,
      avgTime: this._stats.executions > 0
        ? this._stats.totalTime / this._stats.executions
        : 0
    };
  }

  /**
   * Reset statistics
   */
  resetStats() {
    this._stats.executions = 0;
    this._stats.errors = 0;
    this._stats.totalTime = 0;
  }
}
