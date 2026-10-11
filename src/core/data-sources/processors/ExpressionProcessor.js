/**
 * @fileoverview Expression Processor
 *
 * Evaluates JavaScript expressions with full Math library and custom context.
 * Can operate on single source or multiple sources.
 *
 * @module core/data-sources/processors/ExpressionProcessor
 */

import { Processor } from './BaseProcessor.js';
import { lcardsLog } from '../../../utils/lcards-logging.js';

/**
 * Expression Processor
 *
 * Config:
 * ```yaml
 * processor_name:
 *   type: expression
 *   input_source: source_processor  # Optional: single source
 *   sources:                 # Optional: multiple sources
 *     - processor1
 *     - processor2
 *   expression: "value * 2 + 10"  # JavaScript expression
 * ```
 *
 * Context available in expressions:
 * - value, v: Current value (the input_source processor's output, else the raw value)
 * - timestamp, t: Current timestamp
 * - sources: Array of values (if 'sources' configured)
 * - Math: Full Math library
 * - Shortcuts: abs, min, max, round, floor, ceil, pow, sqrt
 */
export class ExpressionProcessor extends Processor {
  constructor(config) {
    super(config);

    this.expression = config.expression;
    this.sources = config.sources || []; // Array of processor keys for multi-source

    if (!this.expression) {
      throw new Error('expression processor requires "expression" field');
    }

    // Compile expression into a function
    try {
      this._compiledFn = this._compileExpression(this.expression);
    } catch (error) {
      lcardsLog.error(`[ExpressionProcessor] Failed to compile expression:`, error);
      throw new Error(`Invalid expression: ${error.message}`);
    }

    lcardsLog.trace(`[ExpressionProcessor] ${this.key}: ${this.expression}`);
  }

  /** input_source and every processor in sources: they must run first. */
  getDependencies() {
    return [...new Set([...super.getDependencies(), ...this.sources])];
  }

  _doProcess(value, timestamp, mainBuffer, processingResults) {
    try {
      // Build context for expression evaluation
      const context = this._buildContext(value, timestamp, mainBuffer, processingResults);

      // Execute compiled function
      return this._compiledFn(context);
    } catch (error) {
      lcardsLog.warn(`[ExpressionProcessor] ${this.key} evaluation error:`, error);
      return null;
    }
  }

  /**
   * Compile expression string into executable function
   * @private
   * @param {string} expr - Expression string
   * @returns {Function} Compiled function
   */
  _compileExpression(expr) {
    // Create function with context as parameter
    // The context will have: value, v, t, timestamp, sources, Math, etc.

    const functionBody = `
      'use strict';
      const { value, v, t, timestamp, sources, entity, buffer, Math, abs, min, max, round, floor, ceil, pow, sqrt } = context;
      return (${expr});
    `;

    try {
      return new Function('context', functionBody);
    } catch (error) {
      throw new Error(`Expression compilation failed: ${error.message}`);
    }
  }

  /**
   * Build execution context for expression
   * @private
   * @param {number} value - Input value
   * @param {number} timestamp - Timestamp
   * @param {Object} mainBuffer - Main buffer
   * @param {Object} processingResults - Other processor results
   * @returns {Object} Context object
   */
  _buildContext(value, timestamp, mainBuffer, processingResults) {
    // Build sources array if configured
    const sourcesArray = this.sources.map(key => {
      const result = processingResults[key];
      return result !== undefined ? result : null;
    });

    // Get entity state if available
    const entity = this.config.dataSource?.hass?.states[this.config.dataSource?.cfg?.entity];

    const context = {
      // Primary value
      value,
      v: value,

      // Timestamp
      timestamp,
      t: timestamp,

      // Multi-source support
      sources: sourcesArray,

      // Main buffer for historical queries
      buffer: mainBuffer,

      // Entity state (if available)
      entity: entity ? {
        state: entity.state,
        attributes: entity.attributes || {},
        entity_id: entity.entity_id,
        last_changed: entity.last_changed,
        last_updated: entity.last_updated
      } : null,

      // Math library
      Math: Math,

      // Math shortcuts
      abs: Math.abs,
      min: Math.min,
      max: Math.max,
      round: Math.round,
      floor: Math.floor,
      ceil: Math.ceil,
      pow: Math.pow,
      sqrt: Math.sqrt
    };

    return context;
  }

  /**
   * The processor whose output is `value` (input_source), else null for the raw
   * value. The sources are ordering dependencies only: see getDependencies().
   * @returns {string|null} Dependency key
   */
  getDependency() {
    return this._dependency || null;
  }
}
