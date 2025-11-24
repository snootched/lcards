/**
 * @fileoverview DataSource Validator - Validates data source references
 *
 * Validates that data source references:
 * - Exist in DataSourceManager
 * - Have valid paths (for dot notation)
 * - Reference valid transformations/aggregations
 * - Are used with compatible overlay/card types
 *
 * Integrates with:
 * - DataSourceManager for source lookup
 *
 * Migrated from MSD validation to core singleton architecture.
 *
 * @module core/validation-service/DataSourceValidator
 */

import { lcardsLog } from '../../utils/lcards-logging.js';

/**
 * DataSource Validator
 *
 * Validates data source references in configurations.
 */
export class DataSourceValidator {
  /**
   * Create a DataSourceValidator
   *
   * @param {Object} dataSourceManager - DataSourceManager instance
   */
  constructor(dataSourceManager = null) {
    this.dataSourceManager = dataSourceManager;

    // Card/overlay types that can use data sources
    // Note: apexchart is deprecated, use simple-chart instead
    this.dataSourceTypes = [
      'sparkline',
      'gauge',
      'metric',
      'simple-chart',
      'chart'
    ];

    lcardsLog.debug('[DataSourceValidator] Initialized');
  }

  /**
   * Set DataSourceManager after construction
   *
   * @param {Object} dataSourceManager - DataSourceManager instance
   */
  setDataSourceManager(dataSourceManager) {
    this.dataSourceManager = dataSourceManager;
    lcardsLog.debug('[DataSourceValidator] DataSourceManager connected');
  }

  /**
   * Validate data source references in a config
   *
   * @param {Object} config - Configuration to validate (overlay, card config, etc.)
   * @param {Object} context - Validation context
   * @returns {Object} Validation result with errors and warnings
   *
   * @example
   * const result = dataSourceValidator.validate({
   *   id: 'my-chart',
   *   type: 'apexchart',
   *   source: 'temperature',
   *   data_source: 'sensor.living_room.transformations.celsius'
   * });
   */
  validate(config, context = {}) {
    const result = {
      errors: [],
      warnings: []
    };

    if (!this.dataSourceManager) {
      // DataSourceManager not available - skip validation
      return result;
    }

    // Check if config type supports data sources
    if (!this._supportsDataSources(config.type)) {
      // Check if data source fields are present anyway
      if (config.source || config.data_source || config.sources) {
        result.warnings.push({
          field: 'source',
          type: 'unsupported_feature',
          message: `Config type "${config.type}" does not typically use data sources`,
          severity: 'warning',
          suggestion: 'Data source field may be ignored'
        });
      }
      return result;
    }

    // Validate source/data_source fields
    this._validateSourceFields(config, result);

    return result;
  }

  /**
   * Check if config type supports data sources
   *
   * @private
   * @param {string} configType - Config type
   * @returns {boolean} True if type supports data sources
   */
  _supportsDataSources(configType) {
    return this.dataSourceTypes.includes(configType);
  }

  /**
   * Validate source fields (source, data_source, sources)
   *
   * @private
   * @param {Object} config - Configuration
   * @param {Object} result - Validation result
   */
  _validateSourceFields(config, result) {
    // Collect all source references
    const sourceRefs = [];

    if (config.source) {
      sourceRefs.push({ field: 'source', value: config.source });
    }

    if (config.data_source) {
      sourceRefs.push({ field: 'data_source', value: config.data_source });
    }

    if (config.sources) {
      if (Array.isArray(config.sources)) {
        config.sources.forEach((src, index) => {
          sourceRefs.push({ field: `sources[${index}]`, value: src });
        });
      } else {
        result.errors.push({
          field: 'sources',
          type: 'invalid_type',
          message: 'Field "sources" must be an array',
          actual: typeof config.sources,
          expected: 'array',
          severity: 'error'
        });
      }
    }

    // Validate each source reference
    sourceRefs.forEach(ref => {
      this._validateDataSourceReference(ref.field, ref.value, result);
    });

    // Check for conflicting source fields
    if (sourceRefs.length > 1) {
      const fields = sourceRefs.map(r => r.field.split('[')[0]).filter((v, i, a) => a.indexOf(v) === i);
      if (fields.length > 1) {
        result.warnings.push({
          field: 'source',
          type: 'conflicting_fields',
          message: `Multiple source fields defined: ${fields.join(', ')}`,
          severity: 'warning',
          suggestion: 'Use only one source field (source, data_source, or sources)'
        });
      }
    }

    // Check if source is required but missing
    if (sourceRefs.length === 0 && this._supportsDataSources(config.type)) {
      result.errors.push({
        field: 'source',
        type: 'required_field',
        message: `Config type "${config.type}" requires a data source`,
        severity: 'error',
        suggestion: 'Add a "source" or "data_source" field'
      });
    }
  }

  /**
   * Validate a single data source reference
   *
   * @private
   * @param {string} field - Field name
   * @param {*} value - Data source reference (should be string)
   * @param {Object} result - Validation result
   */
  _validateDataSourceReference(field, value, result) {
    // Better type checking that handles edge cases
    if (value === null || value === undefined) {
      result.errors.push({
        field: field,
        type: 'invalid_type',
        message: `Data source reference cannot be null or undefined`,
        actual: value === null ? 'null' : 'undefined',
        expected: 'string',
        severity: 'error'
      });
      return;
    }

    // Convert to string if needed (handles wrapped values)
    const stringValue = typeof value === 'string' ? value : String(value);

    // Validate it's actually a valid string (not "[object Object]")
    if (!stringValue || stringValue === '[object Object]' || stringValue === 'undefined' || stringValue === 'null') {
      result.errors.push({
        field: field,
        type: 'invalid_type',
        message: `Data source reference must be a string`,
        actual: typeof value,
        expected: 'string',
        value: value,
        severity: 'error'
      });
      return;
    }

    // Parse data source reference (supports dot notation)
    const { sourceId, path } = this._parseDataSourcePath(stringValue);

    // Check if data source exists
    const dataSource = this.dataSourceManager.getSource(sourceId);

    if (!dataSource) {
      // Data source not found
      result.errors.push({
        field: field,
        type: 'data_source_not_found',
        message: `Data source "${sourceId}" not found`,
        value: stringValue,
        severity: 'error',
        suggestion: this._suggestSimilarSource(sourceId) ||
                    'Ensure the data source is defined in your configuration'
      });
      return;
    }

    // Validate path if specified
    if (path) {
      this._validateDataSourcePath(field, stringValue, dataSource, path, result);
    }

    // Validate data source has data
    try {
      const currentData = dataSource.getCurrentData();
      if (!currentData) {
        result.warnings.push({
          field: field,
          type: 'data_source_no_data',
          message: `Data source "${sourceId}" has no data`,
          value: stringValue,
          severity: 'warning',
          suggestion: 'Data source may not be initialized yet'
        });
      }
    } catch (error) {
      lcardsLog.debug('[DataSourceValidator] Error getting data source data:', error);
    }
  }

  /**
   * Parse data source path (e.g., "temp.transformations.celsius")
   *
   * @private
   * @param {string} fullPath - Full data source path
   * @returns {Object} Parsed path with sourceId and path
   */
  _parseDataSourcePath(fullPath) {
    const parts = fullPath.split('.');

    if (parts.length === 1) {
      return { sourceId: parts[0], path: null };
    }

    return {
      sourceId: parts[0],
      path: parts.slice(1).join('.')
    };
  }

  /**
   * Validate data source path (transformations, aggregations, etc.)
   *
   * @private
   * @param {string} field - Field name
   * @param {string} fullPath - Full data source path
   * @param {Object} dataSource - DataSource instance
   * @param {string} path - Path within data source
   * @param {Object} result - Validation result
   */
  _validateDataSourcePath(field, fullPath, dataSource, path, result) {
    const pathParts = path.split('.');
    const firstPart = pathParts[0];

    // Validate transformations path
    if (firstPart === 'transformations') {
      if (pathParts.length < 2) {
        result.errors.push({
          field: field,
          type: 'invalid_data_source_path',
          message: 'Transformation path must include transformation name',
          value: fullPath,
          severity: 'error',
          suggestion: 'Use format: source.transformations.transformationName'
        });
        return;
      }

      const transformName = pathParts[1];

      // Check if transformation exists
      try {
        const currentData = dataSource.getCurrentData();
        if (currentData && currentData.transformations && !(transformName in currentData.transformations)) {
          result.warnings.push({
            field: field,
            type: 'transformation_not_found',
            message: `Transformation "${transformName}" not found in data source`,
            value: fullPath,
            severity: 'warning',
            suggestion: 'Check your transformation configuration'
          });
        }
      } catch (error) {
        lcardsLog.debug('[DataSourceValidator] Error validating transformation:', error);
      }
    }

    // Validate aggregations path
    else if (firstPart === 'aggregations') {
      if (pathParts.length < 2) {
        result.errors.push({
          field: field,
          type: 'invalid_data_source_path',
          message: 'Aggregation path must include aggregation name',
          value: fullPath,
          severity: 'error',
          suggestion: 'Use format: source.aggregations.aggregationName'
        });
        return;
      }

      const aggName = pathParts.slice(1).join('.');

      // Check if aggregation exists
      try {
        const currentData = dataSource.getCurrentData();
        if (currentData && currentData.aggregations) {
          // Navigate aggregation path
          let current = currentData.aggregations;
          for (const part of pathParts.slice(1)) {
            if (current && typeof current === 'object' && part in current) {
              current = current[part];
            } else {
              result.warnings.push({
                field: field,
                type: 'aggregation_not_found',
                message: `Aggregation "${aggName}" not found in data source`,
                value: fullPath,
                severity: 'warning'
              });
              break;
            }
          }
        }
      } catch (error) {
        lcardsLog.debug('[DataSourceValidator] Error validating aggregation:', error);
      }
    }

    // Unknown path type - warn
    else {
      result.warnings.push({
        field: field,
        type: 'unknown_data_source_path',
        message: `Unknown data source path type: "${firstPart}"`,
        value: fullPath,
        severity: 'warning',
        suggestion: 'Supported paths: transformations, aggregations'
      });
    }
  }

  /**
   * Suggest similar data source
   *
   * @private
   * @param {string} sourceId - Invalid source ID
   * @returns {string|null} Suggested source ID or null
   */
  _suggestSimilarSource(sourceId) {
    try {
      const availableSources = this.dataSourceManager.getAllSourceIds();

      if (!availableSources || availableSources.length === 0) {
        return null;
      }

      const sourceLower = sourceId.toLowerCase();

      // Exact case-insensitive match
      const exactMatch = availableSources.find(id => id.toLowerCase() === sourceLower);
      if (exactMatch) return exactMatch;

      // Partial match
      const partialMatch = availableSources.find(id =>
        id.toLowerCase().includes(sourceLower) ||
        sourceLower.includes(id.toLowerCase())
      );

      return partialMatch || null;

    } catch (error) {
      lcardsLog.debug('[DataSourceValidator] Error suggesting similar source:', error);
      return null;
    }
  }

  /**
   * Get validation statistics
   *
   * @returns {Object} Statistics
   */
  getStats() {
    return {
      hasDataSourceManager: !!this.dataSourceManager,
      supportedTypes: this.dataSourceTypes.length
    };
  }
}

export default DataSourceValidator;
