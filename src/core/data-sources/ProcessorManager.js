/**
 * @fileoverview Unified Processor Manager - Single processing pipeline for all data operations
 *
 * Replaces the old transformation/aggregation split with a unified approach:
 * - All processors store historical data in RollingBuffer
 * - Clear dependency chain with from: field
 * - Simple access pattern: {datasource.processor_name}
 * - Everything is chartable
 *
 * @module core/data-sources/ProcessorManager
 */

import { lcardsLog } from '../../utils/lcards-logging.js';
import { RollingBuffer } from './RollingBuffer.js';
import { Processor } from './processors/BaseProcessor.js';
import { ConvertUnitProcessor } from './processors/ConvertUnitProcessor.js';
import { ExpressionProcessor } from './processors/ExpressionProcessor.js';
import { ScaleProcessor } from './processors/ScaleProcessor.js';
import { SmoothProcessor } from './processors/SmoothProcessor.js';
import { StatisticsProcessor } from './processors/StatisticsProcessor.js';
import { RateProcessor } from './processors/RateProcessor.js';
import { TrendProcessor } from './processors/TrendProcessor.js';
import { DurationProcessor } from './processors/DurationProcessor.js';
import { ThresholdProcessor } from './processors/ThresholdProcessor.js';
import { ClampProcessor } from './processors/ClampProcessor.js';
import { RoundProcessor } from './processors/RoundProcessor.js';
import { DeltaProcessor } from './processors/DeltaProcessor.js';

/**
 * Manages a unified processing pipeline for a DataSource
 *
 * Features:
 * - Dependency resolution and validation
 * - Circular dependency detection
 * - Automatic execution ordering
 * - Per-processor RollingBuffer for history
 * - Performance tracking
 */
export class ProcessorManager {
  constructor(dataSourceRef, config) {
    this.config = config || {};
    this.dataSource = dataSourceRef; // Reference to parent DataSource

    // Processor storage
    this.processors = new Map();       // key -> Processor instance
    this.processorBuffers = new Map(); // key -> RollingBuffer
    this.processorResults = new Map(); // key -> latest result value

    // Execution order (cached after dependency resolution)
    this._executionOrder = null;
    this._executionOrderValid = false;

    // Performance tracking
    this._stats = {
      totalProcessors: 0,
      executions: 0,
      errors: 0,
      totalTime: 0
    };
  }

  /**
   * Initialize processors from config
   * @param {Object} processingConfig - The processing: {...} section of config
   * @param {RollingBuffer} mainBuffer - Reference to main DataSource buffer for window sizing
   */
  initialize(processingConfig, mainBuffer) {
    if (!processingConfig || typeof processingConfig !== 'object') {
      lcardsLog.trace('[ProcessorManager] No processing config provided');
      return;
    }

    // Validate: must be object format, not array
    if (Array.isArray(processingConfig)) {
      lcardsLog.error(
        '[ProcessorManager] Processing config must be an object with processor names as keys. ' +
        'Array format is no longer supported.'
      );
      throw new Error('Invalid processing config: expected object, got array');
    }

    const capacity = mainBuffer.capacity; // Match main buffer size

    // Create all processors first (so dependencies can reference each other)
    Object.entries(processingConfig).forEach(([key, procConfig]) => {
      try {
        // Create processor instance
        const processor = this._createProcessor(key, procConfig);
        this.processors.set(key, processor);

        // Create buffer for this processor's historical data
        const buffer = new RollingBuffer(capacity);
        this.processorBuffers.set(key, buffer);

        lcardsLog.trace(`[ProcessorManager] ✓ Created processor: ${key} (${procConfig.type})`);
      } catch (error) {
        lcardsLog.error(`[ProcessorManager] ❌ Failed to create processor ${key}:`, error);
        throw error;
      }
    });

    // Validate dependencies and build execution order
    this._resolveDependencies();

    this._stats.totalProcessors = this.processors.size;

    lcardsLog.debug(
      `[ProcessorManager] ✓ Initialized ${this.processors.size} processors, ` +
      `execution order: ${this._executionOrder.join(' → ')}`
    );
  }

  /**
   * Create a processor instance based on type
   * @private
   * @param {string} key - Processor key/name
   * @param {Object} config - Processor configuration
   * @returns {Processor} Processor instance
   */
  _createProcessor(key, config) {
    if (!config.type) {
      throw new Error(`Processor ${key} missing required "type" field`);
    }

    // Import processor class based on type
    const ProcessorClass = this._getProcessorClass(config.type);

    if (!ProcessorClass) {
      throw new Error(`Unknown processor type: ${config.type}`);
    }

    // Create instance with full config
    return new (/** @type {any} */ (ProcessorClass))({
      key,
      ...config,
      hass: this.dataSource.hass, // Pass HASS reference
      dataSource: this.dataSource // Pass DataSource reference
    });
  }

  /**
   * Get processor class by type name
   * @private
   * @param {string} type - Processor type
   * @returns {Function} Processor class
   */
  _getProcessorClass(type) {
    const typeMap = {
      'convert_unit': ConvertUnitProcessor,
      'scale': ScaleProcessor,
      'smooth': SmoothProcessor,
      'expression': ExpressionProcessor,
      'statistics': StatisticsProcessor,
      'rate': RateProcessor,
      'trend': TrendProcessor,
      'duration': DurationProcessor,
      'threshold': ThresholdProcessor,
      'clamp': ClampProcessor,
      'round': RoundProcessor,
      'delta': DeltaProcessor
    };

    return typeMap[type];
  }

  /**
   * Resolve processor dependencies and create execution order
   * @private
   */
  _resolveDependencies() {
    const graph = new Map(); // key -> Set of dependencies
    const inDegree = new Map(); // key -> number of incoming edges

    // Build dependency graph
    this.processors.forEach((processor, key) => {
      graph.set(key, new Set());
      inDegree.set(key, 0);
    });

    this.processors.forEach((processor, key) => {
      const dep = processor.getDependency(); // Returns 'from' field value or null

      if (dep) {
        if (!this.processors.has(dep)) {
          throw new Error(
            `Processor ${key} depends on unknown processor: ${dep}. ` +
            `Available processors: ${Array.from(this.processors.keys()).join(', ')}`
          );
        }

        graph.get(dep).add(key);
        inDegree.set(key, inDegree.get(key) + 1);
      }
    });

    // Topological sort (Kahn's algorithm)
    const order = [];
    const queue = [];

    // Start with processors that have no dependencies
    inDegree.forEach((degree, key) => {
      if (degree === 0) queue.push(key);
    });

    while (queue.length > 0) {
      const current = queue.shift();
      order.push(current);

      graph.get(current).forEach(dependent => {
        inDegree.set(dependent, inDegree.get(dependent) - 1);
        if (inDegree.get(dependent) === 0) {
          queue.push(dependent);
        }
      });
    }

    // Check for circular dependencies
    if (order.length !== this.processors.size) {
      const remaining = Array.from(this.processors.keys()).filter(k => !order.includes(k));
      throw new Error(
        `Circular dependency detected in processors: ${remaining.join(', ')}`
      );
    }

    this._executionOrder = order;
    this._executionOrderValid = true;

    lcardsLog.trace(`[ProcessorManager] Dependency resolution complete: ${order.join(' → ')}`);
  }

  /**
   * Process a value through all processors
   * @param {number} value - Input value
   * @param {number} timestamp - Timestamp
   * @param {RollingBuffer} mainBuffer - Main data buffer
   * @returns {Object} Processing results { processorKey: value, ... }
   */
  process(value, timestamp, mainBuffer) {
    lcardsLog.trace(`[ProcessorManager] process() called with value=${value}, timestamp=${timestamp}`);

    if (!this._executionOrderValid) {
      lcardsLog.warn('[ProcessorManager] Execution order not valid, skipping processing');
      return {};
    }

    const startTime = performance.now();
    const results = {};

    lcardsLog.trace(`[ProcessorManager] Processing through ${this._executionOrder.length} processors: ${this._executionOrder.join(', ')}`);

    try {
      // Execute processors in dependency order
      this._executionOrder.forEach(key => {
        const processor = this.processors.get(key);
        const buffer = this.processorBuffers.get(key);

        try {
          // Get input value (from dependency or main)
          const inputValue = processor.getDependency()
            ? results[processor.getDependency()]
            : value;

          // Process the value
          const result = processor.process(inputValue, timestamp, mainBuffer, results);

          lcardsLog.trace(`[ProcessorManager] Processor ${key} result: ${result}`);

          // Store result
          results[key] = result;
          this.processorResults.set(key, result);

          // Add to processor's buffer
          buffer.push(timestamp, result);

        } catch (error) {
          lcardsLog.error(`[ProcessorManager] Error in processor ${key}:`, error);
          this._stats.errors++;

          // Store null or previous value on error
          results[key] = this.processorResults.get(key) || null;
        }
      });

      this._stats.executions++;
      this._stats.totalTime += performance.now() - startTime;

    } catch (error) {
      lcardsLog.error('[ProcessorManager] Error in processing pipeline:', error);
      this._stats.errors++;
    }

    return results;
  }

  /**
   * Get current processing results
   * @returns {Object} Map of processor keys to latest values
   */
  getResults() {
    const results = {};
    this.processorResults.forEach((value, key) => {
      results[key] = value;
    });
    return results;
  }

  /**
   * Get processor buffer for charting/history
   * @param {string} key - Processor key
   * @returns {RollingBuffer|null} Buffer or null if not found
   */
  getBuffer(key) {
    return this.processorBuffers.get(key) || null;
  }

  /**
   * Get processor by key
   * @param {string} key - Processor key
   * @returns {Processor|null} Processor instance or null
   */
  getProcessor(key) {
    return this.processors.get(key) || null;
  }

  /**
   * Get all processor keys
   * @returns {Array<string>} Array of processor keys
   */
  getProcessorKeys() {
    return Array.from(this.processors.keys());
  }

  /**
   * Get statistics
   * @returns {Object} Performance statistics
   */
  getStats() {
    return {
      ...this._stats,
      avgExecutionTime: this._stats.executions > 0
        ? this._stats.totalTime / this._stats.executions
        : 0,
      processorStats: Array.from(this.processors.entries()).map(([key, proc]) => ({
        key,
        type: proc.config.type,
        stats: proc.getStats ? proc.getStats() : {}
      }))
    };
  }

  /**
   * Invalidate execution order (call when processors change)
   */
  invalidate() {
    this._executionOrderValid = false;
  }

  /**
   * Clean up resources
   */
  destroy() {
    this.processors.clear();
    this.processorBuffers.clear();
    this.processorResults.clear();
    this._executionOrder = null;
    this._executionOrderValid = false;
  }
}

// Re-export Processor for backward compatibility
export { Processor } from './processors/BaseProcessor.js';
