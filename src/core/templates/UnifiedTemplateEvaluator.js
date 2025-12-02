import { lcardsLog } from '../../utils/lcards-logging.js';
import { TemplateDetector } from './TemplateDetector.js';
import { LCARdSCardTemplateEvaluator } from './LCARdSCardTemplateEvaluator.js';
import { MSDTemplateEvaluator } from '../../msd/templates/MSDTemplateEvaluator.js';

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

    // Create MSD template evaluator (handles datasources)
    // Note: MSDTemplateEvaluator expects dataSourceManager directly, not as an object property
    this.msdEvaluator = new MSDTemplateEvaluator(this.dataSourceManager);

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
    result = this.msdEvaluator.evaluate(result, this.context);

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
        // Convert {datasource:sensor.temp} to {sensor.temp} format for MSD evaluator
        const legacyFormat = `{${reference}}`;

        // Use MSD evaluator to resolve it
        const resolved = this.msdEvaluator.evaluate(legacyFormat, this.context);

        lcardsLog.debug('[UnifiedTemplateEvaluator] Resolved explicit datasource', {
          original: match,
          reference,
          resolved
        });

        return resolved;
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
    this.msdEvaluator = new MSDTemplateEvaluator(newDataSourceManager);
  }
}

// Expose for debugging
if (typeof window !== 'undefined') {
  window.__unifiedTemplateEvaluator = UnifiedTemplateEvaluator;
}
