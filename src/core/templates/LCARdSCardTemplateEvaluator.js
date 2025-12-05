import { lcardsLog } from '../../utils/lcards-logging.js';
import { TemplateEvaluator } from './TemplateEvaluator.js';
import { TemplateDetector } from './TemplateDetector.js';
import { TemplateParser } from './TemplateParser.js';
import { HATemplateEvaluator } from './HATemplateEvaluator.js';

/**
 * LCARdSCardTemplateEvaluator - Evaluates button-card style templates
 *
 * Extracted from LCARdSCard.processTemplate()
 *
 * Supports:
 * - JavaScript templates: [[[return entity.state]]]
 * - Token templates: {entity.state}, {variables.color}
 * - Jinja2 templates: {{states('sensor.temp')}} (async via HA)
 *
 * Context requirements:
 * - entity: The Home Assistant entity object
 * - hass: The Home Assistant connection object
 * - config: Card configuration
 * - (optional) variables: Custom variables
 * - (optional) theme: Theme configuration
 *
 * @extends TemplateEvaluator
 * @module LCARdSCardTemplateEvaluator
 */
export class LCARdSCardTemplateEvaluator extends TemplateEvaluator {
  /**
   * Create LCARdS Card template evaluator
   *
   * @param {Object} context - Evaluation context
   * @param {Object} context.entity - Home Assistant entity
   * @param {Object} context.hass - Home Assistant connection
   * @param {Object} context.config - Card configuration
   * @param {Object} [context.variables] - Custom variables
   * @param {Object} [context.theme] - Theme configuration
   */
  constructor(context) {
    super(context);

    // Note: hass is optional - only required for Jinja2 templates
    // For JavaScript/Token/Datasource templates, hass is not needed
    // Warning removed as it creates noise when MSD evaluates datasources synchronously

    // Create HATemplateEvaluator for Jinja2 support
    this._haEvaluator = new HATemplateEvaluator(context);
  }

  /**
   * Evaluate template content (synchronous - JavaScript and tokens only)
   *
   * For Jinja2 templates, use evaluateAsync() instead.
   * This method will return Jinja2 templates unchanged.
   *
   * @param {string} content - Template content to evaluate
   * @returns {string} Evaluated content
   *
   * @example
   * const evaluator = new LCARdSCardTemplateEvaluator({
   *   entity: entityObj,
   *   hass: hassObj,
   *   config: configObj
   * });
   *
   * evaluator.evaluate('[[[return entity.state]]]')
   * // => 'on'
   *
   * evaluator.evaluate('{entity.attributes.friendly_name}')
   * // => 'Living Room Light'
   */
  evaluate(content) {
    if (!this._validateContent(content)) {
      return content;
    }

    return this._safeEvaluate(() => {
      const types = TemplateDetector.detectTemplateTypes(content);

      // Quick exit if no templates
      if (!types.hasJavaScript && !types.hasTokens) {
        return content;
      }

      let result = content;

      // Process JavaScript templates first
      if (types.hasJavaScript) {
        result = this._evaluateJavaScript(result);
      }

      // Then process tokens
      if (types.hasTokens) {
        result = this._evaluateTokens(result);
      }

      this._logEvaluation(content, result, { types });

      return result;
    }, content, content);
  }

  /**
   * Evaluate template content asynchronously (supports all template types)
   *
   * Evaluates templates in order:
   * 1. JavaScript templates [[[code]]] - synchronous
   * 2. Token templates {token} - synchronous
   * 3. Jinja2 templates {{expression}} - async via Home Assistant
   *
   * @param {string} content - Template content to evaluate
   * @returns {Promise<string>} Evaluated content
   *
   * @example
   * const result = await evaluator.evaluateAsync('{{states("sensor.temp")}}°F');
   * // => '72°F'
   */
  async evaluateAsync(content) {
    if (!this._validateContent(content)) {
      return content;
    }

    const types = TemplateDetector.detectTemplateTypes(content);

    // Quick exit if no templates
    if (!types.hasJavaScript && !types.hasTokens && !types.hasJinja2) {
      return content;
    }

    let result = content;

    // Process JavaScript templates first (sync)
    if (types.hasJavaScript) {
      result = this._evaluateJavaScript(result);
    }

    // Then process tokens (sync)
    if (types.hasTokens) {
      result = this._evaluateTokens(result);
    }

    // Finally process Jinja2 templates (async)
    if (types.hasJinja2) {
      result = await this._haEvaluator.evaluate(result);
    }

    this._logEvaluation(content, result, { types, async: true });

    return result;
  }

  /**
   * Evaluate JavaScript templates [[[code]]]
   *
   * @private
   * @param {string} content - Content with JavaScript templates
   * @returns {string} Content with templates evaluated
   */
  _evaluateJavaScript(content) {
    return content.replace(/\[\[\[([\s\S]*?)\]\]\]/g, (match, code) => {
      try {
        return this._safeEvalCode(code.trim());
      } catch (error) {
        lcardsLog.warn('[LCARdSCardTemplateEvaluator] JavaScript evaluation failed:', error);
        return match; // Return original if evaluation fails
      }
    });
  }

  /**
   * Evaluate token templates {token}
   *
   * Tokens now use single braces: {entity.state}
   * Must exclude:
   * - {{jinja2}} (double braces)
   * - {datasource:...} (explicit datasource prefix)
   * - {msd.datasource} (legacy MSD datasources)
   *
   * @private
   * @param {string} content - Content with token templates
   * @returns {string} Content with tokens evaluated
   */
  _evaluateTokens(content) {
    // List of MSD domain prefixes to exclude
    const msdDomains = [
      'sensor', 'light', 'switch', 'climate', 'binary_sensor',
      'cover', 'fan', 'lock', 'media_player', 'vacuum',
      'camera', 'alarm_control_panel', 'device_tracker', 'person',
      'zone', 'input_boolean', 'input_number', 'input_select',
      'input_text', 'input_datetime', 'counter', 'timer'
    ];

    // Match {token} but NOT {{jinja2}}, {% jinja2 %}, {# comment #}, {datasource:...}, or {msd.datasource}
    const domainPattern = msdDomains.join('\\.|') + '\\.';
    const tokenRegex = new RegExp(
      `\\{(?!\\{)(?!%)(?!#)(?!datasource:)(?!${domainPattern})([^{}]+)\\}`,
      'g'
    );

    return content.replace(tokenRegex, (match, token) => {
      try {
        const value = this._resolveToken(token.trim());
        // Handle null/undefined/empty string - return empty string for clean UI
        if (value === null || value === undefined || value === '') {
          return '';
        }
        return String(value);
      } catch (error) {
        lcardsLog.warn('[LCARdSCardTemplateEvaluator] Token resolution failed:', error);
        return ''; // Return empty string on error instead of original template
      }
    });
  }

  /**
   * Safely evaluate JavaScript code with context
   *
   * @private
   * @param {string} code - JavaScript code to evaluate
   * @returns {string} Evaluation result
   */
  _safeEvalCode(code) {
    // Create evaluation context with safe access to required objects
    const evalContext = {
      entity: this.context.entity,
      config: this.context.config,
      hass: this.context.hass,
      states: this.context.hass?.states || {},
      user: this.context.hass?.user || {},
      variables: this.context.variables || {},
      theme: this.context.theme || {},
      // Safe helper functions
      Math,
      String,
      Number,
      Boolean,
      parseFloat,
      parseInt,
      Array,
      Object,
      Date
    };

    // Create function with context variables as parameters
    // Note: Code should include 'return' statement if a value is needed
    const func = new Function(
      ...Object.keys(evalContext),
      code
    );

    // Execute with context values
    const value = func(...Object.values(evalContext));

    return value !== null && value !== undefined ? String(value) : '';
  }

  /**
   * Resolve dot-notation token path
   *
   * @private
   * @param {string} token - Token path (e.g., 'entity.state', 'variables.color')
   * @returns {*} Resolved value
   */
  _resolveToken(token) {
    const parsed = TemplateParser.parseToken(token);
    const { parts } = parsed;

    if (parts.length === 0) {
      return null;
    }

    // Start with the full context
    let current = this.context;

    // Navigate through the path
    for (const part of parts) {
      if (current === null || current === undefined) {
        return null;
      }
      current = current[part];
    }

    // Explicitly handle null values - return empty string instead of null
    // This prevents "null" text from appearing in the UI
    if (current === null || current === undefined) {
      return '';
    }

    return current;
  }

  /**
   * Public method to evaluate JavaScript templates only
   *
   * @param {string} content - Content with JavaScript templates
   * @returns {string} Content with templates evaluated
   */
  evaluateJavaScript(content) {
    if (!this._validateContent(content)) {
      return content;
    }
    return this._evaluateJavaScript(content);
  }

  /**
   * Public method to evaluate token templates only
   *
   * @param {string} content - Content with token templates
   * @returns {string} Content with tokens evaluated
   */
  evaluateTokens(content) {
    if (!this._validateContent(content)) {
      return content;
    }
    return this._evaluateTokens(content);
  }

  /**
   * Public method to evaluate Jinja2 templates only
   *
   * @param {string} content - Content with Jinja2 templates
   * @returns {Promise<string>} Content with Jinja2 evaluated
   */
  async evaluateJinja2(content) {
    if (!this._validateContent(content)) {
      return content;
    }
    return await this._haEvaluator.evaluate(content);
  }

  /**
   * Extract Jinja2 entity dependencies for tracking
   *
   * @param {string} content - Content to analyze
   * @returns {Array<string>} Array of entity IDs
   */
  extractDependencies(content) {
    return this._haEvaluator.extractDependencies(content);
  }

  /**
   * Update the Home Assistant connection
   *
   * @param {Object} newHass - New hass object
   */
  updateHass(newHass) {
    this.context.hass = newHass;
    this._haEvaluator.updateHass(newHass);
  }

  /**
   * Get dependencies from template content
   *
   * @param {string} content - Template content to analyze
   * @returns {Array<string>} Array of dependency identifiers
   *
   * @example
   * evaluator.getDependencies('[[[return entity.state]]]')
   * // => ['entity']
   *
   * evaluator.getDependencies('{{entity.state}} {{variables.color}}')
   * // => ['entity', 'variables']
   */
  getDependencies(content) {
    if (!this._validateContent(content)) {
      return [];
    }

    const dependencies = new Set();

    // Extract from JavaScript templates
    const jsTemplates = TemplateParser.extractJavaScript(content);
    jsTemplates.forEach(template => {
      template.tokens.forEach(token => dependencies.add(token));
    });

    // Extract from token templates
    const tokens = TemplateParser.extractTokens(content);
    tokens.forEach(token => {
      if (token.parts.length > 0) {
        dependencies.add(token.parts[0]);
      }
    });

    return Array.from(dependencies);
  }

  /**
   * Update context (override to add validation)
   *
   * @param {Object} newContext - New context to merge
   */
  updateContext(newContext) {
    super.updateContext(newContext);

    // Warn if critical context is missing
    if (!this.context.hass) {
      lcardsLog.warn('[LCARdSCardTemplateEvaluator] Context missing hass object');
    }
  }
}

// Expose for debugging
if (typeof window !== 'undefined') {
  window.__simpleCardTemplateEvaluator = LCARdSCardTemplateEvaluator;
}
