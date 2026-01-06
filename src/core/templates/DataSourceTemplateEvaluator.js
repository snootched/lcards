import { lcardsLog } from '../../utils/lcards-logging.js';
import { TemplateEvaluator } from './TemplateEvaluator.js';
import { TemplateParser } from './TemplateParser.js';

/**
 * DataSourceTemplateEvaluator - Evaluates LCARdS datasource templates
 * 
 * Supports syntax: {datasource.path:format}
 * 
 * Examples:
 * - {cpu_temp} - Simple datasource value
 * - {cpu_temp.v} - Explicit value path
 * - {cpu_temp:.1f} - With format specification
 * - {cpu_temp.transformations.celsius} - Transformation
 * - {metrics.aggregations.avg} - Aggregation
 * 
 * @extends TemplateEvaluator
 */
export class DataSourceTemplateEvaluator extends TemplateEvaluator {
  constructor(dataSourceManager) {
    super({ dataSourceManager });
    this.dataSourceManager = dataSourceManager;
  }

  /**
   * Evaluate datasource templates in content
   * 
   * Supports two syntaxes:
   * 1. Explicit: {datasource:name.path:format}
   * 2. Legacy: {name.path:format}
   * 
   * @param {string} content - Content with datasource templates
   * @returns {string} Evaluated content
   */
  evaluate(content) {
    if (!this._validateContent(content)) {
      return content;
    }

    if (!this.dataSourceManager) {
      lcardsLog.warn('[DataSourceTemplateEvaluator] No dataSourceManager available');
      return content;
    }

    return this._safeEvaluate(() => {
      let result = content;

      // Evaluate explicit datasource syntax: {datasource:name.path}
      result = this._evaluateExplicitDatasources(result);

      // Evaluate legacy syntax: {name.path}
      result = this._evaluateLegacyDatasources(result);

      return result;
    }, content, content);
  }

  /**
   * Evaluate explicit datasource templates: {datasource:ref}
   * @private
   */
  _evaluateExplicitDatasources(content) {
    const datasourceRegex = /\{datasource:([^}]+)\}/g;

    return content.replace(datasourceRegex, (match, reference) => {
      try {
        const resolved = this._resolveDatasourceReference(reference);
        return resolved !== null ? String(resolved) : match;
      } catch (error) {
        lcardsLog.error('[DataSourceTemplateEvaluator] Failed to resolve datasource', {
          match,
          reference,
          error: error.message
        });
        return match;
      }
    });
  }

  /**
   * Evaluate legacy datasource templates: {ref}
   * @private
   */
  _evaluateLegacyDatasources(content) {
    const legacyRegex = /\{([^{}]+)\}/g;

    return content.replace(legacyRegex, (match, reference) => {
      try {
        const resolved = this._resolveDatasourceReference(reference);
        return resolved !== null ? String(resolved) : match;
      } catch (error) {
        lcardsLog.error('[DataSourceTemplateEvaluator] Failed to resolve legacy datasource', {
          match,
          reference,
          error: error.message
        });
        return match;
      }
    });
  }

  /**
   * Resolve datasource reference to value
   * 
   * Supports:
   * - name
   * - name.path
   * - name.path:format
   * - name:format
   * 
   * @private
   * @param {string} reference - Reference string
   * @returns {*} Resolved value or null
   */
  _resolveDatasourceReference(reference) {
    if (!this.dataSourceManager) {
      return null;
    }

    // Parse reference: name[.path][:format]
    const parsed = TemplateParser.parseMSDReference(reference);
    const { source, path, format } = parsed;

    // Get datasource
    const dataSource = this.dataSourceManager.getSource(source);
    if (!dataSource) {
      lcardsLog.debug(`[DataSourceTemplateEvaluator] DataSource '${source}' not found`);
      return null;
    }

    // Get current data
    const currentData = dataSource.getCurrentData();
    if (!currentData) {
      lcardsLog.debug(`[DataSourceTemplateEvaluator] No data for DataSource '${source}'`);
      return null;
    }

    // Resolve value based on path
    let value = this._resolveDataSourceValue(currentData, path);

    if (value === null || value === undefined) {
      lcardsLog.debug(`[DataSourceTemplateEvaluator] Value not found for '${reference}'`);
      return null;
    }

    // Apply format if specified
    if (format) {
      value = this._applyFormat(value, format, currentData.metadata);
    }

    return value;
  }

  /**
   * Resolve value from datasource data using path
   * 
   * @private
   * @param {Object} currentData - DataSource current data
   * @param {Array<string>} path - Path array
   * @returns {*} Resolved value
   */
  _resolveDataSourceValue(currentData, path) {
    // No path - return base value
    if (!path || path.length === 0) {
      return currentData.v || currentData.value;
    }

    // Handle transformations
    if (path[0] === 'transformations' && currentData.transformations) {
      const transformKey = path.slice(1).join('.');
      return this._getNestedValue(currentData.transformations, transformKey);
    }

    // Handle aggregations
    if (path[0] === 'aggregations' && currentData.aggregations) {
      const aggKey = path[1];
      const aggData = currentData.aggregations[aggKey];

      if (aggData === null || aggData === undefined) {
        return null;
      }

      // Handle nested aggregation paths
      if (path.length > 2) {
        const nestedPath = path.slice(2).join('.');
        return this._getNestedValue(aggData, nestedPath);
      }

      // Return aggregation value
      if (typeof aggData === 'object' && aggData !== null) {
        // Try common aggregation properties
        if (aggData.avg !== undefined) return aggData.avg;
        if (aggData.value !== undefined) return aggData.value;
        if (aggData.last !== undefined) return aggData.last;
        if (aggData.current !== undefined) return aggData.current;
        if (aggData.direction !== undefined) return aggData.direction;
      }

      return aggData;
    }

    // Generic nested path
    return this._getNestedValue(currentData, path.join('.'));
  }

  /**
   * Get nested value from object using dot-separated path
   * @private
   */
  _getNestedValue(obj, path) {
    if (!path) return obj;

    return path.split('.').reduce((current, key) => {
      return current && current[key] !== undefined ? current[key] : null;
    }, obj);
  }

  /**
   * Apply format specification to value
   * 
   * Supports:
   * - .1f, .2f - Float with decimals
   * - int - Integer
   * - % - Percentage
   * 
   * @private
   * @param {*} value - Value to format
   * @param {string} formatSpec - Format specification
   * @param {Object} metadata - DataSource metadata (for units)
   * @returns {string} Formatted value
   */
  _applyFormat(value, formatSpec, metadata = null) {
    if (typeof value !== 'number') {
      return String(value);
    }

    const parsedFormat = TemplateParser.parseFormatSpec(formatSpec);

    switch (parsedFormat.type) {
      case 'float':
        const formatted = value.toFixed(parsedFormat.precision);
        return this._appendUnit(formatted, metadata);

      case 'integer':
        const intValue = Math.round(value).toString();
        return this._appendUnit(intValue, metadata);

      case 'string':
        return String(value);

      case 'boolean':
        return value ? 'true' : 'false';

      case 'custom':
        // Handle percentage format
        if (formatSpec.endsWith('%')) {
          // Extract precision from formats like .2f%, .1f%, etc.
          const precisionMatch = formatSpec.match(/^\.(\d+)f?%$/);
          const precision = precisionMatch ? parseInt(precisionMatch[1]) : 0;
          const isAlreadyPercent = metadata?.unit_of_measurement === '%';
          const percentValue = isAlreadyPercent ? value : value * 100;
          return `${percentValue.toFixed(precision)}%`;
        }
        return String(value);

      default:
        return String(value);
    }
  }

  /**
   * Append unit from metadata if available
   * @private
   */
  _appendUnit(formattedValue, metadata) {
    if (metadata?.unit_of_measurement) {
      return `${formattedValue}${metadata.unit_of_measurement}`;
    }
    return formattedValue;
  }

  /**
   * Get dependencies from template content
   * 
   * @param {string} content - Content to analyze
   * @returns {Array<string>} DataSource names
   */
  getDependencies(content) {
    if (!this._validateContent(content)) {
      return [];
    }

    const references = TemplateParser.extractMSDReferences(content);
    return references.map(ref => ref.source);
  }

  /**
   * Update DataSourceManager reference
   * 
   * @param {Object} dataSourceManager - New DataSourceManager instance
   */
  updateDataSourceManager(dataSourceManager) {
    if (!dataSourceManager) {
      lcardsLog.warn('[DataSourceTemplateEvaluator] Attempted to set null dataSourceManager');
      // Intentionally do not update - protect against null values
      return;
    }

    this.dataSourceManager = dataSourceManager;
    this.updateContext({ dataSourceManager });
  }
}
