import { lcardsLog } from '../../utils/lcards-logging.js';

/**
 * TemplateEvaluator - Base class for template evaluation
 *
 * Provides common interface for all template evaluators.
 * Subclasses implement specific evaluation logic for different template types:
 * - MSDTemplateEvaluator: MSD {datasource.key:format} templates
 * - LCARdSCardTemplateEvaluator: [[[JavaScript]]] and {{token}} templates
 * - HATemplateEvaluator: {{states('entity')}} templates (delegates to MsdTemplateEngine)
 *
 * @abstract
 * @module TemplateEvaluator
 */
export class TemplateEvaluator {
  /**
   * Create a template evaluator
   *
   * @param {Object} context - Evaluation context (varies by evaluator type)
   */
  constructor(context = {}) {
    if (new.target === TemplateEvaluator) {
      throw new Error('TemplateEvaluator is abstract and cannot be instantiated directly');
    }

    /**
     * Evaluation context - content varies by subclass
     * @type {Object}
     * @protected
     */
    this.context = context;

    /**
     * Performance statistics
     * @type {Object}
     * @protected
     */
    this._stats = {
      evaluations: 0,
      errors: 0,
      lastEvaluation: null
    };
  }

  /**
   * Evaluate template string
   *
   * Subclasses MUST implement this method to perform actual template evaluation.
   *
   * @abstract
   * @param {string} content - Template content to evaluate
   * @returns {string} Evaluated content
   * @throws {Error} If not implemented by subclass
   *
   * @example
   * const evaluator = new MSDTemplateEvaluator(dataSourceManager);
   * const result = evaluator.evaluate('Temperature: {sensor.temp:.1f}°C');
   * // => 'Temperature: 23.5°C'
   */
  evaluate(content) {
    throw new Error(`${this.constructor.name} must implement evaluate() method`);
  }

  /**
   * Get dependencies (entities/datasources) from template content
   *
   * Subclasses SHOULD implement this method to extract dependencies
   * for subscription/update purposes.
   *
   * @abstract
   * @param {string} content - Template content to analyze
   * @returns {Array<string>} Array of dependency identifiers
   *
   * @example
   * const evaluator = new MSDTemplateEvaluator(dataSourceManager);
   * const deps = evaluator.getDependencies('{sensor.temp} and {sensor.humidity}');
   * // => ['sensor', 'sensor']
   */
  getDependencies(content) {
    // Default implementation returns empty array
    // Subclasses should override with actual dependency extraction
    return [];
  }

  /**
   * Update evaluation context
   *
   * Allows updating context without creating new evaluator instance.
   * Useful when entity state changes or other context updates occur.
   *
   * @param {Object} newContext - New context to merge
   */
  updateContext(newContext) {
    if (!newContext || typeof newContext !== 'object') {
      lcardsLog.warn(`[${this.constructor.name}] Invalid context update:`, newContext);
      return;
    }

    this.context = {
      ...this.context,
      ...newContext
    };

    lcardsLog.debug(`[${this.constructor.name}] Context updated:`, {
      keys: Object.keys(this.context)
    });
  }

  /**
   * Get evaluation statistics
   *
   * @returns {Object} Statistics object
   */
  getStats() {
    return {
      ...this._stats,
      errorRate: this._stats.evaluations > 0
        ? (this._stats.errors / this._stats.evaluations) * 100
        : 0
    };
  }

  /**
   * Reset statistics
   */
  resetStats() {
    this._stats = {
      evaluations: 0,
      errors: 0,
      lastEvaluation: null
    };
  }

  /**
   * Record successful evaluation (for stats)
   *
   * @protected
   */
  _recordEvaluation() {
    this._stats.evaluations++;
    this._stats.lastEvaluation = Date.now();
  }

  /**
   * Record evaluation error (for stats)
   *
   * @protected
   */
  _recordError() {
    this._stats.errors++;
  }

  /**
   * Safe evaluation wrapper with error handling
   *
   * Subclasses can use this to wrap their evaluation logic with
   * automatic error handling and statistics tracking.
   *
   * @protected
   * @param {Function} evalFunc - Function that performs evaluation
   * @param {string} content - Content being evaluated
   * @param {*} fallback - Fallback value if evaluation fails
   * @returns {*} Evaluation result or fallback
   */
  _safeEvaluate(evalFunc, content, fallback = content) {
    try {
      const result = evalFunc();
      this._recordEvaluation();
      return result;
    } catch (error) {
      this._recordError();
      lcardsLog.error(
        `[${this.constructor.name}] Evaluation failed:`,
        error,
        { content: content?.substring(0, 100) }
      );
      return fallback;
    }
  }

  /**
   * Validate content before evaluation
   *
   * @protected
   * @param {string} content - Content to validate
   * @returns {boolean} True if valid
   */
  _validateContent(content) {
    if (!content) {
      return false;
    }

    if (typeof content !== 'string') {
      lcardsLog.warn(`[${this.constructor.name}] Content is not a string:`, typeof content);
      return false;
    }

    return true;
  }

  /**
   * Log evaluation details (for debugging)
   *
   * @protected
   * @param {string} content - Original content
   * @param {string} result - Evaluation result
   * @param {Object} metadata - Additional metadata
   */
  _logEvaluation(content, result, metadata = {}) {
    // Only log if debug level is enabled (lcardsLog.debug will check internally)
    lcardsLog.debug(`[${this.constructor.name}] Evaluation:`, {
      original: content?.substring(0, 100),
      result: result?.substring(0, 100),
      changed: content !== result,
      ...metadata
    });
  }
}

/**
 * Create evaluator factory for common use cases
 *
 * @param {string} type - Evaluator type ('msd', 'simplecard', 'ha')
 * @param {Object} context - Evaluation context
 * @returns {TemplateEvaluator|null} Evaluator instance or null
 */
export function createEvaluator(type, context) {
  // This will be expanded as evaluators are implemented
  lcardsLog.warn(`[TemplateEvaluator] Factory not yet implemented for type: ${type}`);
  return null;
}

// Expose for debugging
if (typeof window !== 'undefined') {
  window.__templateEvaluator = TemplateEvaluator;
}
