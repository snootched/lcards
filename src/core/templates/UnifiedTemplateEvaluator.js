import { lcardsLog } from '../../utils/lcards-logging.js';
import { TemplateDetector } from './TemplateDetector.js';
import { LCARdSCardTemplateEvaluator } from './LCARdSCardTemplateEvaluator.js';
import { TemplateParser } from './TemplateParser.js';

/**
 * UnifiedTemplateEvaluator - Single unified template processor for all card types
 *
 * Phase 3: Unified Template System Architecture
 *
 * This evaluator orchestrates all template types across both LCARdS Card and MSD:
 * - JavaScript templates: [[[code]]]
 * - Token templates: {entity.state}
 * - Datasource templates: {datasource:sensor.temp} (new explicit syntax)
 * - Jinja2 templates: {{states('entity')}}, {% if %}, {# comment #}
 * - Legacy MSD datasources: {sensor.temp} (backward compatibility)
 *
 * Template Evaluation Order:
 * 1. JavaScript templates (synchronous)
 * 2. Token templates (synchronous)
 * 3. Datasource templates (synchronous)
 * 4. Jinja2 templates (async via Home Assistant)
 *
 * This enables:
 * - LCARdS Card to use datasources
 * - MSD to use tokens, JavaScript, and Jinja2
 * - No ambiguity with explicit {datasource:...} prefix
 * - One unified template processing system
 *
 * @module UnifiedTemplateEvaluator
 */
export class UnifiedTemplateEvaluator {
  /**
   * Create unified template evaluator
   *
   * @param {Object} config - Configuration
   * @param {Object} config.hass - Home Assistant connection object
   * @param {Object} config.context - Template evaluation context
   * @param {Object} [config.dataSourceManager] - Optional MSD data source manager
   */
  constructor(config = {}) {
    this.hass = config.hass;
    this.context = config.context || {};
    this.dataSourceManager = config.dataSourceManager || null;

    // Ensure context has hass if provided separately
    if (this.hass && !this.context.hass) {
      this.context.hass = this.hass;
    }

    // Create LCARdS Card template evaluator (handles JS, tokens, Jinja2)
    // Note: LCARdSCardTemplateEvaluator expects hass inside the context object
    this.lcardsCardEvaluator = new LCARdSCardTemplateEvaluator(this.context);

    lcardsLog.debug('[UnifiedTemplateEvaluator] Created', {
      hasHass: !!this.hass,
      hasContext: !!this.context,
      hasDataSourceManager: !!this.dataSourceManager
    });
  }

  /**
   * Evaluate template content with all template types
   *
   * Evaluation order:
   * 1. JavaScript [[[code]]]
   * 2. Tokens {entity.state}
   * 3. Datasources {datasource:sensor.temp} (new) or {sensor.temp} (legacy)
   * 4. Jinja2 {{expression}}, {% control %}
   *
   * @param {string} content - Content to evaluate
   * @returns {Promise<string>} Evaluated content
   *
   * @example
   * // LCARdS Card using datasources
   * await evaluator.evaluateAsync('Temp: {datasource:sensor.temp:.1f}°C')
   *
   * // MSD using Jinja2
   * await evaluator.evaluateAsync('Status: {{states("sensor.status")}}')
   *
   * // Mixed templates
   * await evaluator.evaluateAsync('JS: [[[return "test"]]], Token: {entity.state}, DS: {datasource:sensor.temp}, Jinja: {{now().hour}}')
   */
  async evaluateAsync(content) {
    if (!content || typeof content !== 'string') {
      return content;
    }

    lcardsLog.debug('[UnifiedTemplateEvaluator] Evaluating content', {
      contentPreview: content.substring(0, 100),
      templateTypes: TemplateDetector.getTemplateTypes(content)
    });

    let result = content;

    try {
      // Phase 1: JavaScript templates (sync)
      if (TemplateDetector.detectTemplateTypes(result).hasJavaScript) {
        lcardsLog.debug('[UnifiedTemplateEvaluator] Phase 1: Evaluating JavaScript templates');
        result = this.lcardsCardEvaluator.evaluateJavaScript(result);
      }

      // Phase 2: Token templates (sync)
      if (TemplateDetector.detectTemplateTypes(result).hasTokens) {
        lcardsLog.debug('[UnifiedTemplateEvaluator] Phase 2: Evaluating token templates');
        result = this.lcardsCardEvaluator.evaluateTokens(result);
      }

      // Phase 3: Datasource templates (sync)
      const types = TemplateDetector.detectTemplateTypes(result);
      if (types.hasDatasources || types.hasMSD) {
        lcardsLog.debug('[UnifiedTemplateEvaluator] Phase 3: Evaluating datasource templates', {
          hasExplicitDatasources: types.hasDatasources,
          hasLegacyMSD: types.hasMSD
        });
        result = this.evaluateDatasources(result);
      }

      // Phase 4: Jinja2 templates (async via HA)
      if (TemplateDetector.detectTemplateTypes(result).hasJinja2) {
        lcardsLog.debug('[UnifiedTemplateEvaluator] Phase 4: Evaluating Jinja2 templates');
        result = await this.lcardsCardEvaluator.evaluateJinja2(result);
      }

      lcardsLog.debug('[UnifiedTemplateEvaluator] Evaluation complete', {
        resultPreview: result?.substring(0, 100)
      });

      return result;
    } catch (error) {
      lcardsLog.error('[UnifiedTemplateEvaluator] Evaluation failed', {
        error: error.message,
        content: content.substring(0, 100)
      });
      return content; // Return original on error
    }
  }

  /**
   * Evaluate datasource templates (both explicit and legacy)
   *
   * Handles:
   * - New explicit syntax: {datasource:sensor.temp}
   * - Legacy MSD syntax: {sensor.temp}
   *
   * @param {string} content - Content with datasource templates
   * @returns {string} Content with datasources evaluated
   */
  evaluateDatasources(content) {
    if (!this.dataSourceManager) {
      lcardsLog.warn('[UnifiedTemplateEvaluator] No dataSourceManager available, skipping datasources');
      return content;
    }

    let result = content;

    // Evaluate explicit datasources first: {datasource:...}
    result = this._evaluateExplicitDatasources(result);

    // Then evaluate legacy MSD datasources: {sensor.temp}
    result = this._evaluateLegacyDatasources(result);

    return result;
  }

  /**
   * Evaluate explicit datasource references: {datasource:name.path:format}
   *
   * @param {string} content - Content with datasource templates
   * @returns {string} Content with datasources evaluated
   * @private
   */
  _evaluateExplicitDatasources(content) {
    if (!content || typeof content !== 'string') {
      return content;
    }

    // Pattern: {datasource:name.path:format}
    const datasourceRegex = /\{datasource:([^}]+)\}/g;

    return content.replace(datasourceRegex, (match, reference) => {
      try {
        // Resolve the datasource reference
        const resolved = this._resolveDatasourceReference(reference);

        lcardsLog.debug('[UnifiedTemplateEvaluator] Resolved explicit datasource', {
          original: match,
          reference,
          resolved
        });

        return resolved !== null ? String(resolved) : match;
      } catch (error) {
        lcardsLog.error('[UnifiedTemplateEvaluator] Failed to resolve datasource', {
          match,
          reference,
          error: error.message
        });
        return match; // Return original on error
      }
    });
  }

  /**
   * Evaluate legacy datasource templates: {ref}
   * @private
   */
  _evaluateLegacyDatasources(content) {
    if (!content || typeof content !== 'string') {
      return content;
    }

    const legacyRegex = /\{([^{}]+)\}/g;

    return content.replace(legacyRegex, (match, reference) => {
      try {
        const resolved = this._resolveDatasourceReference(reference);
        return resolved !== null ? String(resolved) : match;
      } catch (error) {
        lcardsLog.error('[UnifiedTemplateEvaluator] Failed to resolve legacy datasource', {
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
      lcardsLog.debug(`[UnifiedTemplateEvaluator] DataSource '${source}' not found`);
      return null;
    }

    // Get current data
    const currentData = dataSource.getCurrentData();
    if (!currentData) {
      lcardsLog.debug(`[UnifiedTemplateEvaluator] No data for DataSource '${source}'`);
      return null;
    }

    // Resolve value based on path
    let value = this._resolveDataSourceValue(currentData, path);

    if (value === null || value === undefined) {
      lcardsLog.debug(`[UnifiedTemplateEvaluator] Value not found for '${reference}'`);
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
          const precision = parseInt(formatSpec.slice(1, -1)) || 0;
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
   * Synchronous evaluation (JavaScript + Tokens + Datasources only)
   *
   * Use this when you need immediate results without Jinja2 support
   *
   * @param {string} content - Content to evaluate
   * @returns {string} Evaluated content (no Jinja2)
   */
  evaluateSync(content) {
    if (!content || typeof content !== 'string') {
      return content;
    }

    let result = content;

    // Phase 1: JavaScript
    if (TemplateDetector.detectTemplateTypes(result).hasJavaScript) {
      result = this.lcardsCardEvaluator.evaluateJavaScript(result);
    }

    // Phase 2: Tokens
    if (TemplateDetector.detectTemplateTypes(result).hasTokens) {
      result = this.lcardsCardEvaluator.evaluateTokens(result);
    }

    // Phase 3: Datasources
    const types = TemplateDetector.detectTemplateTypes(result);
    if (types.hasDatasources || types.hasMSD) {
      result = this.evaluateDatasources(result);
    }

    return result;
  }

  /**
   * Extract entity dependencies from Jinja2 templates for tracking
   *
   * @param {string} content - Content to analyze
   * @returns {Array<string>} Array of entity IDs
   */
  extractDependencies(content) {
    return this.lcardsCardEvaluator.extractDependencies(content);
  }

  /**
   * Update the evaluation context
   *
   * @param {Object} newContext - New context object
   */
  updateContext(newContext) {
    this.context = newContext;
    this.lcardsCardEvaluator.updateContext(newContext);
  }

  /**
   * Update the Home Assistant connection
   *
   * @param {Object} newHass - New hass object
   */
  updateHass(newHass) {
    this.hass = newHass;
    this.lcardsCardEvaluator.updateHass(newHass);
  }

  /**
   * Update the data source manager
   *
   * @param {Object} newDataSourceManager - New data source manager
   */
  updateDataSourceManager(newDataSourceManager) {
    this.dataSourceManager = newDataSourceManager;
  }
}

// Expose for debugging
if (typeof window !== 'undefined') {
  window.__unifiedTemplateEvaluator = UnifiedTemplateEvaluator;
}
