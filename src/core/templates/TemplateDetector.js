import { lcardsLog } from '../../utils/lcards-logging.js';

/**
 * TemplateDetector - Unified template detection for all card types
 *
 * Detects various template syntaxes used across the codebase:
 * - MSD templates: {datasource}, {datasource.key:format}
 * - HA Jinja2 templates: {{states('entity')}}
 * - LCARdS Card JavaScript: [[[JavaScript code]]]
 * - LCARdS Card tokens: {token}  [CHANGED from {{token}}]
 *
 * Extracted from MSD TemplateProcessor and LCARdS Card inline logic.
 *
 * @module TemplateDetector
 */
export class TemplateDetector {
  /**
   * Template syntax markers
   */
  static MARKERS = {
    MSD_START: '{',
    MSD_END: '}',
    DATASOURCE_PREFIX: 'datasource:',
    TOKEN_START: '{',
    TOKEN_END: '}',
    HA_START: '{{',
    HA_END: '}}',
    JINJA2_START: '{{',
    JINJA2_END: '}}',
    JS_START: '[[[',
    JS_END: ']]]'
  };

  /**
   * Detect what types of templates are present in content
   *
   * @param {string} content - Content to analyze
   * @returns {{hasMSD: boolean, hasDatasources: boolean, hasHA: boolean, hasJinja2: boolean, hasJavaScript: boolean, hasTokens: boolean}}
   *
   * @example
   * TemplateDetector.detectTemplateTypes('{sensor.temp}')
   * // => { hasMSD: true, hasDatasources: false, hasHA: false, hasJinja2: false, hasJavaScript: false, hasTokens: false }
   *
   * TemplateDetector.detectTemplateTypes('{datasource:sensor.temp}')
   * // => { hasMSD: false, hasDatasources: true, hasHA: false, hasJinja2: false, hasJavaScript: false, hasTokens: false }
   *
   * TemplateDetector.detectTemplateTypes('{{states("sensor.temp")}}')
   * // => { hasMSD: false, hasDatasources: false, hasHA: true, hasJinja2: true, hasJavaScript: false, hasTokens: false }
   *
   * TemplateDetector.detectTemplateTypes('[[[return entity.state]]]')
   * // => { hasMSD: false, hasDatasources: false, hasHA: false, hasJinja2: false, hasJavaScript: true, hasTokens: false }
   *
   * TemplateDetector.detectTemplateTypes('{entity.state}')
   * // => { hasMSD: false, hasDatasources: false, hasHA: false, hasJinja2: false, hasJavaScript: false, hasTokens: true }
   */
  static detectTemplateTypes(content) {
    if (!content || typeof content !== 'string') {
      return {
        hasMSD: false,
        hasDatasources: false,
        hasHA: false,
        hasJinja2: false,
        hasJavaScript: false,
        hasTokens: false
      };
    }

    return {
      hasMSD: this.hasMSDTemplates(content),
      hasDatasources: this.hasMSDDatasources(content),
      hasHA: this.hasJinja2Templates(content),
      hasJinja2: this.hasJinja2Templates(content),
      hasJavaScript: this.hasJavaScript(content),
      hasTokens: this.hasTokens(content)
    };
  }

  /**
   * Check if content contains any template syntax
   *
   * @param {string} content - Content to check
   * @returns {boolean} True if any template syntax found
   */
  static hasTemplates(content) {
    if (!content || typeof content !== 'string') {
      return false;
    }

    return content.includes(this.MARKERS.MSD_START) ||
           content.includes(this.MARKERS.HA_START) ||
           content.includes(this.MARKERS.JS_START);
  }

  /**
   * Check if content has MSD templates specifically
   *
   * MSD templates use single braces: {datasource} or {datasource.key:format}
   * Must distinguish from HA templates which use double braces: {{...}}
   *
   * @param {string} content - Content to check
   * @returns {boolean} True if has MSD templates ({...})
   */
  static hasMSDTemplates(content) {
    if (!content || typeof content !== 'string') {
      return false;
    }

    // Pattern: { followed by non-brace characters, then }
    // But NOT {{ (to avoid false positive on HA templates)
    const hasSingleBrace = content.includes(this.MARKERS.MSD_START);
    const hasDoubleBrace = content.includes(this.MARKERS.HA_START);

    // If we have { but the first occurrence is not part of {{, it's MSD
    if (hasSingleBrace && !hasDoubleBrace) {
      return true;
    }

    if (hasSingleBrace && hasDoubleBrace) {
      // Need to check if there's a single brace that's not part of double brace
      // Look for pattern: non-brace character followed by single {
      return /[^{]\{[^{]/.test(content) || /^\{[^{]/.test(content);
    }

    return false;
  }

  /**
   * Check if content has MSD datasource templates with explicit prefix
   *
   * New unified syntax: {datasource:name.path:format}
   * Examples:
   * - {datasource:sensor.temp}
   * - {datasource:sensor.temp:.2f}
   * - {datasource:sensor.temp.transformations.celsius}
   *
   * @param {string} content - Content to check
   * @returns {boolean} True if has datasource templates ({datasource:...})
   */
  static hasMSDDatasources(content) {
    if (!content || typeof content !== 'string') {
      return false;
    }

    // Pattern: {datasource:...}
    return content.includes('{' + this.MARKERS.DATASOURCE_PREFIX);
  }

  /**
   * Check if content has Home Assistant Jinja2 templates
   *
   * Jinja2 templates use double braces with specific HA functions/filters/control structures.
   * Context variables like {{entity.state}} should use single braces {entity.state} for local resolution.
   *
   * Valid Jinja2 patterns:
   * - HA functions: {{states('entity')}}, {{state_attr()}}, {{now()}}, etc.
   * - Filters: {{value | round}}, {{value | float}}, etc.
   * - Control structures: {% if %}, {% for %}, etc.
   *
   * @param {string} content - Content to check
   * @returns {boolean} True if has Jinja2 templates requiring server-side rendering
   */
  static hasJinja2Templates(content) {
    if (!content || typeof content !== 'string') {
      return false;
    }

    // Check for Jinja2 expressions {{...}} OR control structures {%...%} OR comments {#...#}
    const hasExpressions = content.includes(this.MARKERS.JINJA2_START);
    const hasControlStructures = content.includes('{%');
    const hasComments = content.includes('{#');

    if (!hasExpressions && !hasControlStructures && !hasComments) {
      return false;
    }

    // Jinja2 indicators requiring server-side rendering:
    // - Function calls: states(), state_attr(), now(), etc.
    // - Filters: | round, | float, | int, etc.
    // - Control structures: {% if %}, {% for %}, {% set %}, etc.
    // - Comments: {# comment #}

    const jinja2Patterns = [
      /\{\{\s*states\s*\(/,           // {{states('entity')}}
      /\{\{\s*state_attr\s*\(/,       // {{state_attr('entity', 'attr')}}
      /\{\{\s*now\s*\(/,              // {{now()}}
      /\{\{\s*is_state\s*\(/,         // {{is_state('entity', 'on')}}
      /\{\{\s*has_value\s*\(/,        // {{has_value('entity')}}
      /\{\{[^}]*\|[^}]+\}\}/,         // {{value | filter}}
      /\{%[\s\S]*?%\}/,               // {% if/for/set/etc %}
      /\{#[\s\S]*?#\}/                // {# comment #}
    ];

    return jinja2Patterns.some(pattern => pattern.test(content));
  }

  /**
   * Check if content has Home Assistant templates
   *
   * Alias for hasJinja2Templates() for backward compatibility
   *
   * @param {string} content - Content to check
   * @returns {boolean} True if has HA templates ({{...}})
   */
  static hasHATemplates(content) {
    return this.hasJinja2Templates(content);
  }

  /**
   * Check if content has JavaScript templates
   *
   * JavaScript templates use triple brackets: [[[JavaScript code]]]
   * Used by LCARdS Card for button-card style templates.
   *
   * @param {string} content - Content to check
   * @returns {boolean} True if has JavaScript templates ([[[...]]])
   */
  static hasJavaScript(content) {
    if (!content || typeof content !== 'string') {
      return false;
    }

    return content.includes(this.MARKERS.JS_START) &&
           content.includes(this.MARKERS.JS_END);
  }

  /**
   * Check if content has token templates
   *
   * Token templates use single braces for simple substitution: {entity.state}
   * Must distinguish from:
   * - {{jinja2}} (double braces)
   * - {datasource} (MSD datasource with domain prefix)
   *
   * @param {string} content - Content to check
   * @returns {boolean} True if has token templates ({...})
   */
  static hasTokens(content) {
    if (!content || typeof content !== 'string') {
      return false;
    }

    if (!content.includes('{')) {
      return false;
    }

    // Match {token} but exclude:
    // - {{jinja2}} (double braces)
    // - {sensor.*}, {light.*}, etc. (MSD datasources with domain prefixes)

    // List of common HA domain prefixes used by MSD datasources
    const msdDomains = [
      'sensor', 'light', 'switch', 'climate', 'binary_sensor',
      'cover', 'fan', 'lock', 'media_player', 'vacuum',
      'camera', 'alarm_control_panel', 'device_tracker', 'person',
      'zone', 'input_boolean', 'input_number', 'input_select',
      'input_text', 'input_datetime', 'counter', 'timer'
    ];

    // Build pattern: {(?!{)(?!domain\.)(content)}
    const domainPattern = msdDomains.join('\\.|') + '\\.';
    const tokenPattern = new RegExp(
      `\\{(?!\\{)(?!${domainPattern})([^{}]+)\\}`
    );

    // Quick check: if content has {{, we need to filter those out
    if (content.includes('{{')) {
      // Remove all {{...}} patterns and check if there are still tokens
      const withoutJinja2 = content.replace(/\{\{[^}]*\}\}/g, '');
      return tokenPattern.test(withoutJinja2);
    }

    return tokenPattern.test(content);
  }

  /**
   * Get all template types present as an array
   *
   * @param {string} content - Content to analyze
   * @returns {Array<string>} Array of template type names
   *
   * @example
   * TemplateDetector.getTemplateTypes('{sensor.temp} {{states("sensor.humidity")}}')
   * // => ['MSD', 'HA']
   *
   * TemplateDetector.getTemplateTypes('{datasource:sensor.temp}')
   * // => ['Datasource']
   */
  static getTemplateTypes(content) {
    const types = this.detectTemplateTypes(content);
    const result = [];

    if (types.hasMSD) result.push('MSD');
    if (types.hasDatasources) result.push('Datasource');
    if (types.hasHA) result.push('HA');
    if (types.hasJavaScript) result.push('JavaScript');
    if (types.hasTokens && !types.hasHA) result.push('Token');

    return result;
  }

  /**
   * Log template detection results (for debugging)
   *
   * @param {string} content - Content to analyze
   * @param {string} context - Context string for logging
   */
  static logDetection(content, context = 'Unknown') {
    const types = this.detectTemplateTypes(content);

    lcardsLog.debug(`[TemplateDetector] Detection for ${context}:`, {
      content: content?.substring(0, 100),
      types,
      typesList: this.getTemplateTypes(content)
    });
  }
}

// Expose for debugging
if (typeof window !== 'undefined') {
  window.__templateDetector = TemplateDetector;
}
