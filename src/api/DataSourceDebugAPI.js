/**
 * DataSourceDebugAPI - Debug and introspection API for LCARdS DataSources
 *
 * Provides debugging and inspection tools for DataSource processor pipelines.
 * Accessible via window.lcards.debug.datasources namespace.
 *
 * @module api/DataSourceDebugAPI
 */

import { lcardsLog } from '../utils/lcards-logging.js';

/**
 * DataSource Debug API
 * Provides debugging utilities for DataSource processor pipelines
 */
export class DataSourceDebugAPI {
  /**
   * Create Debug API instance
   * @returns {Object} Debug API methods
   */
  static create() {
    return {
      /**
       * List all active DataSources
       * @returns {Array} Array of DataSource names
       *
       * @example
       * const sources = window.lcards.debug.datasources.list();
       * console.log('DataSources:', sources);
       */
      list() {
        const dsManager = window.lcards.core?.dataSourceManager;
        if (!dsManager) {
          lcardsLog.warn('[DataSourceDebugAPI] DataSourceManager not available');
          return [];
        }
        return Array.from(dsManager.sources.keys());
      },

      /**
       * Get DataSource instance by name
       * @param {string} name - DataSource name
       * @returns {Object|null} DataSource instance or null
       *
       * @example
       * const ds = window.lcards.debug.datasources.get('temperature');
       * console.log('DataSource:', ds);
       */
      get(name) {
        const dsManager = window.lcards.core?.dataSourceManager;
        if (!dsManager) {
          lcardsLog.warn('[DataSourceDebugAPI] DataSourceManager not available');
          return null;
        }
        return dsManager.getSource(name) || null;
      },

      /**
       * List all processors for a DataSource
       * @param {string} dsName - DataSource name
       * @returns {Array} Array of processor names
       *
       * @example
       * const processors = window.lcards.debug.datasources.listProcessors('temperature');
       * console.log('Processors:', processors);
       */
      listProcessors(dsName) {
        const ds = DataSourceDebugAPI.create().get(dsName);
        if (!ds?.processorManager) {
          lcardsLog.warn(`[DataSourceDebugAPI] DataSource "${dsName}" not found or has no processors`);
          return [];
        }
        return ds.processorManager.getProcessorKeys();
      },

      /**
       * Show processor dependency graph for a DataSource
       * @param {string} dsName - DataSource name
       * @returns {Object} Graph structure with nodes and edges
       *
       * @example
       * const graph = window.lcards.debug.datasources.showProcessorGraph('temperature');
       * console.log('Graph:', graph);
       */
      showProcessorGraph(dsName) {
        const ds = DataSourceDebugAPI.create().get(dsName);
        if (!ds?.processorManager) {
          lcardsLog.warn(`[DataSourceDebugAPI] DataSource "${dsName}" not found or has no processors`);
          return null;
        }

        const graph = { nodes: [], edges: [] };
        const processors = ds.processorManager.processors;

        processors.forEach((processor, key) => {
          graph.nodes.push({
            name: key,
            type: processor.config.type
          });

          const dep = processor.getDependency();
          if (dep) {
            graph.edges.push({ from: dep, to: key });
          }
        });

        lcardsLog.info(`[DataSourceDebugAPI] Processor graph for "${dsName}":`);
        lcardsLog.info(`  Nodes (${graph.nodes.length}):`, graph.nodes);
        lcardsLog.info(`  Edges (${graph.edges.length}):`, graph.edges);
        lcardsLog.info(`  Execution order:`, ds.processorManager._executionOrder);

        return graph;
      },

      /**
       * Inspect a specific processor
       * @param {string} dsName - DataSource name
       * @param {string} processorName - Processor name
       * @returns {Object} Processor details
       *
       * @example
       * const info = window.lcards.debug.datasources.inspectProcessor('temperature', 'fahrenheit');
       * console.log('Processor info:', info);
       */
      inspectProcessor(dsName, processorName) {
        const ds = DataSourceDebugAPI.create().get(dsName);
        if (!ds?.processorManager) {
          lcardsLog.warn(`[DataSourceDebugAPI] DataSource "${dsName}" not found or has no processors`);
          return null;
        }

        const processor = ds.processorManager.getProcessor(processorName);
        if (!processor) {
          lcardsLog.warn(`[DataSourceDebugAPI] Processor "${processorName}" not found in DataSource "${dsName}"`);
          return null;
        }

        const buffer = ds.processorManager.getBuffer(processorName);
        const value = ds.getProcessorData(processorName);

        const info = {
          name: processorName,
          type: processor.config.type,
          config: processor.config,
          dependency: processor.getDependency(),
          currentValue: value,
          bufferSize: buffer?.size() || 0,
          bufferCapacity: buffer?.capacity || 0,
          stats: processor.getStats ? processor.getStats() : null
        };

        lcardsLog.info(`[DataSourceDebugAPI] Processor "${processorName}" in DataSource "${dsName}":`, info);
        return info;
      },

      /**
       * Validate a DataSource configuration
       * @param {string} dsName - DataSource name
       * @returns {Object} Validation results
       *
       * @example
       * const validation = window.lcards.debug.datasources.validate('temperature');
       * console.log('Validation:', validation);
       */
      validate(dsName) {
        const ds = DataSourceDebugAPI.create().get(dsName);
        if (!ds) {
          return {
            valid: false,
            error: `DataSource "${dsName}" not found`
          };
        }

        const validation = {
          valid: true,
          errors: [],
          warnings: [],
          info: {
            entity: ds.cfg.entity,
            hasProcessors: !!ds.processorManager,
            processorCount: ds.processorManager?.processors.size || 0,
            bufferSize: ds.buffer.size(),
            bufferCapacity: ds.buffer.capacity,
            started: ds._started
          }
        };

        // Check for common issues
        if (!ds._started) {
          validation.warnings.push('DataSource not started');
        }

        if (ds.buffer.size() === 0) {
          validation.warnings.push('No data in buffer');
        }

        if (ds.processorManager) {
          const stats = ds.processorManager.getStats();
          if (stats.errors > 0) {
            validation.errors.push(`Processor errors: ${stats.errors}`);
            validation.valid = false;
          }
        }

        lcardsLog.info(`[DataSourceDebugAPI] Validation for DataSource "${dsName}":`, validation);
        return validation;
      },

      /**
       * Get comprehensive DataSource statistics
       * @param {string} dsName - DataSource name
       * @returns {Object} Statistics object
       *
       * @example
       * const stats = window.lcards.debug.datasources.getStats('temperature');
       * console.log('Stats:', stats);
       */
      getStats(dsName) {
        const ds = DataSourceDebugAPI.create().get(dsName);
        if (!ds) {
          lcardsLog.warn(`[DataSourceDebugAPI] DataSource "${dsName}" not found`);
          return null;
        }

        return {
          entity: ds.cfg.entity,
          started: ds._started,
          buffer: {
            size: ds.buffer.size(),
            capacity: ds.buffer.capacity,
            oldest: ds.buffer.first(),
            newest: ds.buffer.last()
          },
          stats: ds._stats,
          processing: ds.processorManager ? ds.processorManager.getStats() : null
        };
      },

      /**
       * Display help information
       *
       * @example
       * window.lcards.debug.datasources.help();
       */
      help() {
        const methods = {
          'list()': 'List all active DataSources',
          'get(name)': 'Get DataSource instance by name',
          'listProcessors(dsName)': 'List all processors for a DataSource',
          'showProcessorGraph(dsName)': 'Show processor dependency graph',
          'inspectProcessor(dsName, processorName)': 'Inspect a specific processor',
          'validate(dsName)': 'Validate a DataSource configuration',
          'getStats(dsName)': 'Get comprehensive DataSource statistics'
        };

        console.log('=== DataSource Debug API ===');
        console.log('Available methods:');
        Object.entries(methods).forEach(([method, description]) => {
          console.log(`  ${method.padEnd(40)} - ${description}`);
        });
        console.log('\nExample usage:');
        console.log('  window.lcards.debug.datasources.list()');
        console.log('  window.lcards.debug.datasources.showProcessorGraph("temperature")');
        console.log('  window.lcards.debug.datasources.inspectProcessor("temperature", "fahrenheit")');
      }
    };
  }
}
