/**
 * @fileoverview Duration Processor
 *
 * Tracks time spent in a condition.
 *
 * @module core/data-sources/processors/DurationProcessor
 */

import { Processor } from './BaseProcessor.js';

/**
 * Duration Processor
 *
 * Config:
 * ```yaml
 * processor_name:
 *   type: duration
 *   input_source: source_processor  # Optional
 *   condition: "> 20"       # Condition expression
 *   reset_on: "< 15"        # Optional: reset condition
 * ```
 *
 * Returns: { duration_ms: X, duration_human: "2h 15m", in_condition: true }
 */
export class DurationProcessor extends Processor {
  constructor(config) {
    super(config);

    this.condition = config.condition;
    this.resetCondition = config.reset_on || null;

    if (!this.condition) {
      throw new Error('duration processor requires "condition" field');
    }

    // Compile condition into function
    this._conditionFn = this._compileCondition(this.condition);
    this._resetFn = this.resetCondition ? this._compileCondition(this.resetCondition) : null;

    // State tracking
    this._conditionStartTime = null;
    this._lastDuration = 0;
  }

  _doProcess(value, timestamp, mainBuffer, processingResults) {
    if (value === null || value === undefined || !Number.isFinite(value)) {
      return this._getLastResult();
    }

    const inCondition = this._conditionFn(value);
    const shouldReset = this._resetFn ? this._resetFn(value) : false;

    // Handle reset
    if (shouldReset) {
      this._conditionStartTime = null;
      this._lastDuration = 0;
      return { duration_ms: 0, duration_human: '0s', in_condition: false };
    }

    // Condition just became true
    if (inCondition && this._conditionStartTime === null) {
      this._conditionStartTime = timestamp;
    }

    // Condition just became false
    if (!inCondition && this._conditionStartTime !== null) {
      this._conditionStartTime = null;
      this._lastDuration = 0;
    }

    // Calculate duration
    const durationMs = this._conditionStartTime !== null
      ? timestamp - this._conditionStartTime
      : 0;

    this._lastDuration = durationMs;

    return {
      duration_ms: durationMs,
      duration_human: this._formatDuration(durationMs),
      in_condition: inCondition
    };
  }

  /**
   * Compile condition string into function
   * @private
   */
  _compileCondition(conditionStr) {
    // Simple expression: "> 20", "< 15", "== 10", etc.
    const match = conditionStr.match(/^([><=!]+)\s*(.+)$/);

    if (!match) {
      throw new Error(`Invalid condition format: ${conditionStr}`);
    }

    const operator = match[1];
    const threshold = parseFloat(match[2]);

    switch (operator) {
      case '>': return (v) => v > threshold;
      case '>=': return (v) => v >= threshold;
      case '<': return (v) => v < threshold;
      case '<=': return (v) => v <= threshold;
      case '==': return (v) => v === threshold;
      case '!=': return (v) => v !== threshold;
      default:
        throw new Error(`Unknown operator: ${operator}`);
    }
  }

  /**
   * Format duration to human-readable string
   * @private
   */
  _formatDuration(ms) {
    if (ms < 1000) return `${Math.floor(ms)}ms`;

    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) {
      return `${days}d ${hours % 24}h ${minutes % 60}m`;
    }
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    }
    if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    }
    return `${seconds}s`;
  }

  /**
   * Get last result on error
   * @private
   */
  _getLastResult() {
    return {
      duration_ms: this._lastDuration,
      duration_human: this._formatDuration(this._lastDuration),
      in_condition: this._conditionStartTime !== null
    };
  }
}
