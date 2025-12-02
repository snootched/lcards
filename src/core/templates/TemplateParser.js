import { lcardsLog } from '../../utils/lcards-logging.js';

/**
 * TemplateParser - Parse template references and extract structured information
 *
 * Extracts structured data from various template syntaxes:
 * - MSD references: {datasource.key:format} => { source, path, format }
 * - HA Jinja2 templates: {{states('entity.id')}} => { expression, entities }
 * - JavaScript: [[[code]]] => { code, tokens }
 * - Tokens: {entity.state} => { path, parts }  [CHANGED from {{entity.state}}]
 *
 * Extracted from MSD TemplateProcessor and LCARdS Card inline logic.
 *
 * @module TemplateParser
 */
export class TemplateParser {
  /**
   * Regular expression patterns for parsing
   */
  static PATTERNS = {
    // MSD DataSource templates: {data_source}, {data_source.key}, {data_source:format}
    MSD: /\{([^}]+)\}/g,

    // Home Assistant Jinja2 templates: {{states('entity.id')}}
    HA: /\{\{([^}]+)\}\}/g,
    JINJA2: /\{\{([^}]+)\}\}/g,

    // JavaScript templates: [[[code]]]
    JAVASCRIPT: /\[\[\[(.*?)\]\]\]/gs,

    // Token templates: {path.to.value} (single braces, not MSD datasource)
    TOKEN: null,  // Dynamically constructed to exclude MSD domains

    // Format specification: {data_source:.2f} or {data_source:int}
    FORMAT_SPEC: /^(.+?):(.+)$/,

    // Dot notation path
    DOT_PATH: /\./
  };

  /**
   * Parse MSD template reference
   *
   * @param {string} reference - Reference string (without braces)
   * @returns {{source: string, path: Array<string>, format: string|null}}
   *
   * @example
   * TemplateParser.parseMSDReference('datasource')
   * // => { source: 'datasource', path: [], format: null }
   *
   * TemplateParser.parseMSDReference('datasource.key')
   * // => { source: 'datasource', path: ['key'], format: null }
   *
   * TemplateParser.parseMSDReference('datasource.key:format')
   * // => { source: 'datasource', path: ['key'], format: 'format' }
   *
   * TemplateParser.parseMSDReference('temp.transformations.celsius:.1f')
   * // => { source: 'temp', path: ['transformations', 'celsius'], format: '.1f' }
   */
  static parseMSDReference(reference) {
    if (!reference || typeof reference !== 'string') {
      return { source: '', path: [], format: null };
    }

    // Check for format specification (colon separator)
    let dataSourceRef = reference;
    let formatSpec = null;

    const formatMatch = reference.match(this.PATTERNS.FORMAT_SPEC);
    if (formatMatch) {
      dataSourceRef = formatMatch[1].trim();
      formatSpec = formatMatch[2].trim();
    }

    // Split by dots for path navigation
    const parts = dataSourceRef.split('.');
    const source = parts[0];
    const path = parts.slice(1);

    return {
      source,
      path,
      format: formatSpec
    };
  }

  /**
   * Extract all MSD references from content
   *
   * @param {string} content - Content containing MSD templates
   * @returns {Array<{match: string, source: string, path: Array<string>, format: string|null}>}
   *
   * @example
   * TemplateParser.extractMSDReferences('Temp: {sensor.temp:.1f}, Status: {system.status}')
   * // => [
   * //   { match: '{sensor.temp:.1f}', source: 'sensor', path: ['temp'], format: '.1f' },
   * //   { match: '{system.status}', source: 'system', path: ['status'], format: null }
   * // ]
   */
  static extractMSDReferences(content) {
    if (!content || typeof content !== 'string') {
      return [];
    }

    const references = [];
    const regex = new RegExp(this.PATTERNS.MSD);
    let match;

    while ((match = regex.exec(content)) !== null) {
      const fullMatch = match[0];
      const reference = match[1];

      // Skip if this looks like an HA template (starts with another {)
      if (reference.startsWith('{')) {
        continue;
      }

      const parsed = this.parseMSDReference(reference);
      references.push({
        match: fullMatch,
        ...parsed
      });
    }

    return references;
  }

  /**
   * Parse datasource reference with explicit prefix
   *
   * New unified syntax: {datasource:name.path:format}
   *
   * @param {string} reference - Reference string (without braces)
   * @returns {{source: string, path: Array<string>, format: string|null}}
   *
   * @example
   * TemplateParser.parseDatasourceReference('datasource:sensor.temp')
   * // => { source: 'sensor', path: ['temp'], format: null }
   *
   * TemplateParser.parseDatasourceReference('datasource:sensor.temp:.2f')
   * // => { source: 'sensor', path: ['temp'], format: '.2f' }
   *
   * TemplateParser.parseDatasourceReference('datasource:temp.transformations.celsius:.1f')
   * // => { source: 'temp', path: ['transformations', 'celsius'], format: '.1f' }
   */
  static parseDatasourceReference(reference) {
    if (!reference || typeof reference !== 'string') {
      return { source: '', path: [], format: null };
    }

    // Remove 'datasource:' prefix if present
    let cleanRef = reference;
    if (reference.startsWith('datasource:')) {
      cleanRef = reference.substring('datasource:'.length);
    }

    // Use same parsing logic as MSD references
    return this.parseMSDReference(cleanRef);
  }

  /**
   * Extract all datasource references with explicit prefix from content
   *
   * @param {string} content - Content containing datasource templates
   * @returns {Array<{match: string, source: string, path: Array<string>, format: string|null}>}
   *
   * @example
   * TemplateParser.extractDatasourceReferences('Temp: {datasource:sensor.temp:.1f}, Status: {datasource:system.status}')
   * // => [
   * //   { match: '{datasource:sensor.temp:.1f}', source: 'sensor', path: ['temp'], format: '.1f' },
   * //   { match: '{datasource:system.status}', source: 'system', path: ['status'], format: null }
   * // ]
   */
  static extractDatasourceReferences(content) {
    if (!content || typeof content !== 'string') {
      return [];
    }

    const references = [];
    // Match {datasource:...}
    const datasourceRegex = /\{datasource:([^}]+)\}/g;
    let match;

    while ((match = datasourceRegex.exec(content)) !== null) {
      const fullMatch = match[0];
      const reference = match[1];

      const parsed = this.parseDatasourceReference(reference);
      references.push({
        match: fullMatch,
        ...parsed
      });
    }

    return references;
  }

  /**
   * Parse JavaScript template
   *
   * @param {string} template - Full template including [[[...]]]
   * @returns {{code: string, tokens: Array<string>}}
   *
   * @example
   * TemplateParser.parseJavaScript('[[[return entity.state]]]')
   * // => { code: 'return entity.state', tokens: ['entity'] }
   */
  static parseJavaScript(template) {
    if (!template || typeof template !== 'string') {
      return { code: '', tokens: [] };
    }

    // Extract code (remove [[[ and ]]])
    const code = template.replace(/^\[\[\[/, '').replace(/\]\]\]$/, '').trim();

    // Extract potential tokens (simple heuristic: look for common token patterns)
    const tokens = this._extractTokenReferences(code);

    return { code, tokens };
  }

  /**
   * Extract all JavaScript templates from content
   *
   * @param {string} content - Content containing JavaScript templates
   * @returns {Array<{match: string, code: string, tokens: Array<string>}>}
   */
  static extractJavaScript(content) {
    if (!content || typeof content !== 'string') {
      return [];
    }

    const templates = [];
    const regex = new RegExp(this.PATTERNS.JAVASCRIPT);
    let match;

    while ((match = regex.exec(content)) !== null) {
      const fullMatch = match[0];
      const parsed = this.parseJavaScript(fullMatch);
      templates.push({
        match: fullMatch,
        ...parsed
      });
    }

    return templates;
  }

  /**
   * Parse token reference
   *
   * @param {string} token - Token string (without braces)
   * @returns {{path: string, parts: Array<string>}}
   *
   * @example
   * TemplateParser.parseToken('entity.state')
   * // => { path: 'entity.state', parts: ['entity', 'state'] }
   */
  static parseToken(token) {
    if (!token || typeof token !== 'string') {
      return { path: '', parts: [] };
    }

    const trimmed = token.trim();
    const parts = trimmed.split('.');

    return {
      path: trimmed,
      parts
    };
  }

  /**
   * Extract all token references from content
   *
   * Tokens use single braces: {entity.state}
   * Must exclude:
   * - MSD datasources: {sensor.temp}, {light.desk}, etc. (legacy)
   * - Explicit datasources: {datasource:name}
   *
   * @param {string} content - Content containing token templates
   * @returns {Array<{match: string, token: string, path: string, parts: Array<string>, start: number, end: number}>}
   *
   * @example
   * TemplateParser.extractTokens('State: {entity.state}, Name: {entity.attributes.friendly_name}')
   * // => [
   * //   { match: '{entity.state}', token: 'entity.state', path: 'entity.state', parts: ['entity', 'state'], start: 7, end: 21 },
   * //   { match: '{entity.attributes.friendly_name}', token: 'entity.attributes.friendly_name', path: '...', parts: [...], start: 29, end: 63 }
   * // ]
   */
  static extractTokens(content) {
    if (!content || typeof content !== 'string') {
      return [];
    }

    const tokens = [];

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

    let match;
    while ((match = tokenRegex.exec(content)) !== null) {
      const fullMatch = match[0];
      const token = match[1].trim();

      const parsed = this.parseToken(token);
      tokens.push({
        match: fullMatch,
        token: token,
        ...parsed,
        start: match.index,
        end: match.index + fullMatch.length
      });
    }

    return tokens;
  }

  /**
   * Extract Jinja2 template expressions from content
   *
   * @param {string} content - Content to parse
   * @returns {Array<Object>} Array of Jinja2 template info
   *
   * @example
   * extractJinja2('Temp: {{states("sensor.temp") | round(1)}}°C')
   * // => [{
   * //   match: '{{states("sensor.temp") | round(1)}}',
   * //   expression: 'states("sensor.temp") | round(1)',
   * //   start: 6,
   * //   end: 44,
   * //   type: 'jinja2'
   * // }]
   */
  static extractJinja2(content) {
    if (!content || typeof content !== 'string') {
      return [];
    }

    const templates = [];
    const jinja2Regex = /\{\{([^}]+)\}\}/g;

    let match;
    while ((match = jinja2Regex.exec(content)) !== null) {
      const expression = match[1].trim();

      // Only include if it has Jinja2 indicators
      const hasFunction = /\w+\s*\(/.test(expression);
      const hasFilter = /\|/.test(expression);

      if (hasFunction || hasFilter) {
        templates.push({
          match: match[0],
          expression: expression,
          start: match.index,
          end: match.index + match[0].length,
          type: 'jinja2'
        });
      }
    }

    return templates;
  }

  /**
   * Extract entity IDs referenced in Jinja2 templates
   *
   * @param {string} content - Content to parse (can be full content or just expression)
   * @returns {Array<string>} Array of entity IDs
   *
   * @example
   * extractJinja2Entities('{{states("sensor.temp")}} and {{states("sensor.humidity")}}')
   * // => ['sensor.temp', 'sensor.humidity']
   *
   * extractJinja2Entities('{{state_attr("light.desk", "brightness")}}')
   * // => ['light.desk']
   */
  static extractJinja2Entities(content) {
    if (!content || typeof content !== 'string') {
      return [];
    }

    const entities = new Set();

    // Match entity IDs in various Jinja2 functions:
    // - states('entity.id')
    // - state_attr('entity.id', 'attribute')
    // - is_state('entity.id', 'state')
    // - has_value('entity.id')

    const patterns = [
      /states\s*\(\s*['"]([^'"]+)['"]\s*\)/g,
      /state_attr\s*\(\s*['"]([^'"]+)['"]\s*,/g,
      /is_state\s*\(\s*['"]([^'"]+)['"]\s*,/g,
      /has_value\s*\(\s*['"]([^'"]+)['"]\s*\)/g
    ];

    patterns.forEach(pattern => {
      let match;
      const regex = new RegExp(pattern);
      while ((match = regex.exec(content)) !== null) {
        entities.add(match[1]);
      }
    });

    return Array.from(entities);
  }

  /**
   * Extract entity dependencies from various template types
   *
   * @param {string} content - Content to analyze
   * @returns {Array<string>} Array of entity IDs or datasource names
   *
   * @example
   * TemplateParser.extractDependencies('{sensor.temp} {{states("sensor.humidity")}}')
   * // => ['sensor', 'sensor.humidity']
   */
  static extractDependencies(content) {
    if (!content || typeof content !== 'string') {
      return [];
    }

    const dependencies = new Set();

    // Extract MSD datasource references
    const msdRefs = this.extractMSDReferences(content);
    msdRefs.forEach(ref => {
      dependencies.add(ref.source);
    });

    // Extract token references (first part is usually entity or datasource)
    const tokenRefs = this.extractTokens(content);
    tokenRefs.forEach(token => {
      if (token.parts.length > 0) {
        dependencies.add(token.parts[0]);
      }
    });

    // Extract Jinja2 entity references
    const jinja2Entities = this.extractJinja2Entities(content);
    jinja2Entities.forEach(entity => {
      dependencies.add(entity);
    });

    return Array.from(dependencies);
  }

  /**
   * Extract token references from JavaScript code (helper)
   *
   * @private
   * @param {string} code - JavaScript code
   * @returns {Array<string>} Token names found
   */
  static _extractTokenReferences(code) {
    const tokens = new Set();

    // Look for common patterns: entity.*, hass.*, variables.*, config.*, theme.*
    const patterns = [
      /\bentity\b/g,
      /\bhass\b/g,
      /\bvariables\b/g,
      /\bconfig\b/g,
      /\btheme\b/g
    ];

    patterns.forEach(pattern => {
      if (pattern.test(code)) {
        const match = code.match(pattern);
        if (match) {
          tokens.add(match[0]);
        }
      }
    });

    return Array.from(tokens);
  }

  /**
   * Parse format specification
   *
   * @param {string} formatSpec - Format specification string
   * @returns {{type: string, precision: number|null, options: Object}}
   *
   * @example
   * TemplateParser.parseFormatSpec('.2f')
   * // => { type: 'float', precision: 2, options: {} }
   *
   * TemplateParser.parseFormatSpec('int')
   * // => { type: 'integer', precision: null, options: {} }
   */
  static parseFormatSpec(formatSpec) {
    if (!formatSpec || typeof formatSpec !== 'string') {
      return { type: 'none', precision: null, options: {} };
    }

    const spec = formatSpec.trim();

    // Float with precision: .2f, .1f
    if (/^\.\d+f$/.test(spec)) {
      return {
        type: 'float',
        precision: parseInt(spec.match(/\d+/)[0]),
        options: {}
      };
    }

    // Integer: int
    if (spec === 'int' || spec === 'integer') {
      return {
        type: 'integer',
        precision: null,
        options: {}
      };
    }

    // String: str, string
    if (spec === 'str' || spec === 'string') {
      return {
        type: 'string',
        precision: null,
        options: {}
      };
    }

    // Boolean: bool, boolean
    if (spec === 'bool' || spec === 'boolean') {
      return {
        type: 'boolean',
        precision: null,
        options: {}
      };
    }

    // Unknown format - return as-is
    return {
      type: 'custom',
      precision: null,
      options: { spec }
    };
  }

  /**
   * Log parsing results (for debugging)
   *
   * @param {string} content - Content to parse
   * @param {string} context - Context string for logging
   */
  static logParsing(content, context = 'Unknown') {
    const msdRefs = this.extractMSDReferences(content);
    const jsTemplates = this.extractJavaScript(content);
    const tokens = this.extractTokens(content);
    const dependencies = this.extractDependencies(content);

    lcardsLog.debug(`[TemplateParser] Parsing for ${context}:`, {
      content: content?.substring(0, 100),
      msdReferences: msdRefs.length,
      jsTemplates: jsTemplates.length,
      tokens: tokens.length,
      dependencies
    });
  }
}

// Expose for debugging
if (typeof window !== 'undefined') {
  window.__templateParser = TemplateParser;
}
