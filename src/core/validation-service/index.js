/**
 * @fileoverview CoreValidationService - Shared validation system for LCARdS core infrastructure
 *
 * Simplified version of MSD ValidationService focused on:
 * - Basic schema validation for config objects
 * - Type checking and format validation
 * - Error formatting and user-friendly messages
 * - Shared validation for all card types
 * - Integration with other core systems
 *
 * Note: This is a streamlined version. For full MSD validation features
 * including overlay-specific schemas, the MSD ValidationService continues
 * to provide comprehensive validation capabilities.
 *
 * @module core/validation-service
 */

import { lcardsLog } from '../../utils/lcards-logging.js';

/**
 * Simplified schema registry for core validation needs
 */
class CoreSchemaRegistry {
  constructor() {
    this.schemas = new Map();
    this._initializeCommonSchemas();
  }

  /**
   * Initialize common validation schemas
   * @private
   */
  _initializeCommonSchemas() {
    // Basic card configuration schema
    this.schemas.set('card-config', {
      type: 'object',
      properties: {
        type: { type: 'string', required: true },
        entity: { type: 'string', pattern: /^[a-zA-Z_][a-zA-Z0-9_]*\.[a-zA-Z0-9_]+$/ },
        name: { type: 'string' },
        icon: { type: 'string' },
        show_name: { type: 'boolean' },
        show_icon: { type: 'boolean' },
        tap_action: { type: 'object' },
        hold_action: { type: 'object' }
      }
    });

    // Entity reference validation
    this.schemas.set('entity-reference', {
      type: 'string',
      pattern: /^[a-zA-Z_][a-zA-Z0-9_]*\.[a-zA-Z0-9_]+$/,
      errorMessage: 'Entity ID must follow format: domain.entity_id'
    });

    // Action configuration validation
    this.schemas.set('action-config', {
      type: 'object',
      properties: {
        action: {
          type: 'string',
          enum: ['more-info', 'toggle', 'call-service', 'navigate', 'url', 'assist'],
          required: true
        },
        service: { type: 'string' },
        service_data: { type: 'object' },
        navigation_path: { type: 'string' },
        url_path: { type: 'string' },
        confirmation: { type: 'object' }
      }
    });

    // Position/coordinate validation
    this.schemas.set('position', {
      type: 'array',
      minItems: 2,
      maxItems: 2,
      items: { type: 'number' }
    });

    // Size validation
    this.schemas.set('size', {
      type: 'array',
      minItems: 2,
      maxItems: 2,
      items: { type: 'number', minimum: 0 }
    });
  }

  /**
   * Get schema by name
   * @param {string} schemaName - Schema identifier
   * @returns {Object|null} Schema definition or null if not found
   */
  getSchema(schemaName) {
    return this.schemas.get(schemaName) || null;
  }

  /**
   * Register a custom schema
   * @param {string} name - Schema name
   * @param {Object} schema - Schema definition
   */
  registerSchema(name, schema) {
    this.schemas.set(name, schema);
    lcardsLog.debug(`[CoreSchemaRegistry] Registered schema: ${name}`);
  }

  /**
   * List available schemas
   * @returns {Array<string>} Array of schema names
   */
  listSchemas() {
    return Array.from(this.schemas.keys());
  }
}

/**
 * Core error formatter for user-friendly validation messages
 */
class CoreErrorFormatter {
  constructor() {
    this.templates = {
      required_field: 'Required field "{field}" is missing',
      invalid_type: 'Field "{field}" must be {expected}, got {actual}',
      invalid_format: 'Field "{field}" has invalid format',
      invalid_enum: 'Field "{field}" must be one of: {validValues}',
      out_of_range: 'Field "{field}" value {value} is out of valid range',
      invalid_entity: 'Entity ID "{entity}" is not valid (use format: domain.entity_id)',
      missing_entity: 'Entity "{entity}" not found in Home Assistant',
      invalid_service: 'Service "{service}" not found or not callable'
    };

    this.suggestions = {
      required_field: 'Add the "{field}" field to your configuration',
      invalid_type: 'Change "{field}" to be {expected} type',
      invalid_format: 'Check the format of "{field}"',
      invalid_enum: 'Use one of these values for "{field}": {validValues}',
      out_of_range: 'Use a valid value for "{field}"',
      invalid_entity: 'Check the entity ID format (e.g., "light.living_room")',
      missing_entity: 'Verify the entity exists in Home Assistant',
      invalid_service: 'Check available services in Developer Tools'
    };
  }

  /**
   * Format validation error into user-friendly message
   * @param {Object} error - Error object
   * @returns {Object} Formatted error with message and suggestion
   */
  formatError(error) {
    const template = this.templates[error.type] || 'Validation error: {message}';
    const suggestionTemplate = this.suggestions[error.type] || 'Check your configuration';

    const message = this._interpolateTemplate(template, error.context || {});
    const suggestion = this._interpolateTemplate(suggestionTemplate, error.context || {});

    return {
      ...error,
      formattedMessage: message,
      suggestion,
      severity: error.severity || 'error'
    };
  }

  /**
   * Interpolate template with context values
   * @private
   */
  _interpolateTemplate(template, context) {
    return template.replace(/\{(\w+)\}/g, (match, key) => {
      return context[key] !== undefined ? context[key] : match;
    });
  }
}

/**
 * CoreValidationService - Central validation coordinator for shared core infrastructure
 *
 * Provides essential validation capabilities for all LCARdS card types including
 * configuration validation, entity checking, and error reporting.
 */
export class CoreValidationService {
  constructor(config = {}) {
    // Configuration
    this.config = {
      strict: false,              // Treat warnings as errors
      validateEntities: true,     // Check entity existence in HASS
      cacheResults: true,         // Cache validation results
      debug: false,               // Enable debug logging
      ...config
    };

    // Components
    this.schemaRegistry = new CoreSchemaRegistry();
    this.errorFormatter = new CoreErrorFormatter();

    // State
    this.initialized = false;
    this.hass = null;

    // Caching
    this.validationCache = new Map();
    this.entityCache = new Map();

    // Statistics
    this.stats = {
      validationsPerformed: 0,
      errorsFound: 0,
      warningsFound: 0,
      cacheHits: 0,
      entityChecks: 0
    };

    lcardsLog.debug('[CoreValidationService] 🔍 Core validation service created');
  }

  /**
   * Initialize validation service
   * @param {Object} hass - Home Assistant instance (optional)
   * @returns {Promise<void>}
   */
  async initialize(hass = null) {
    lcardsLog.debug('[CoreValidationService] 🚀 Initializing core validation system');

    try {
      this.hass = hass;
      this.initialized = true;

      lcardsLog.info('[CoreValidationService] ✅ Core validation system initialized:', {
        hasHASS: !!this.hass,
        schemaCount: this.schemaRegistry.listSchemas().length,
        validateEntities: this.config.validateEntities
      });

    } catch (error) {
      lcardsLog.error('[CoreValidationService] ❌ Validation system initialization failed:', error);
      throw error;
    }
  }

  /**
   * Validate an object against a schema
   * @param {Object} data - Data to validate
   * @param {string|Object} schema - Schema name or schema object
   * @param {Object} context - Validation context
   * @returns {Object} Validation result
   */
  validate(data, schema, context = {}) {
    this.stats.validationsPerformed++;

    // Generate cache key
    const cacheKey = this._generateCacheKey(data, schema, context);

    // Check cache
    if (this.config.cacheResults && this.validationCache.has(cacheKey)) {
      this.stats.cacheHits++;
      return this.validationCache.get(cacheKey);
    }

    const result = {
      valid: true,
      errors: [],
      warnings: [],
      data,
      schema: typeof schema === 'string' ? schema : 'inline'
    };

    try {
      // Get schema definition
      const schemaDef = typeof schema === 'string'
        ? this.schemaRegistry.getSchema(schema)
        : schema;

      if (!schemaDef) {
        result.errors.push({
          type: 'schema_not_found',
          message: `Schema "${schema}" not found`,
          field: 'schema',
          context: { schema }
        });
        result.valid = false;
        this.stats.errorsFound++;
        return result;
      }

      // Perform validation
      this._validateAgainstSchema(data, schemaDef, result, '');

      // Entity validation (if enabled and HASS available)
      if (this.config.validateEntities && this.hass) {
        this._validateEntities(data, result, context);
      }

      // Determine final validity
      result.valid = result.errors.length === 0 &&
                     (!this.config.strict || result.warnings.length === 0);

      // Update statistics
      if (!result.valid) this.stats.errorsFound++;
      if (result.warnings.length > 0) this.stats.warningsFound++;

      // Format errors for user-friendly display
      result.errors = result.errors.map(error => this.errorFormatter.formatError(error));
      result.warnings = result.warnings.map(warning => this.errorFormatter.formatError(warning));

      // Cache result
      if (this.config.cacheResults) {
        this.validationCache.set(cacheKey, result);
      }

    } catch (error) {
      lcardsLog.error('[CoreValidationService] Validation error:', error);
      result.errors.push({
        type: 'validation_error',
        message: `Internal validation error: ${error.message}`,
        field: 'system',
        severity: 'error'
      });
      result.valid = false;
    }

    return result;
  }

  /**
   * Validate object against schema definition
   * @private
   */
  _validateAgainstSchema(data, schema, result, path) {
    if (schema.type === 'object') {
      this._validateObject(data, schema, result, path);
    } else if (schema.type === 'array') {
      this._validateArray(data, schema, result, path);
    } else {
      this._validatePrimitive(data, schema, result, path);
    }
  }

  /**
   * Validate object type
   * @private
   */
  _validateObject(data, schema, result, path) {
    if (data === null || typeof data !== 'object' || Array.isArray(data)) {
      result.errors.push({
        type: 'invalid_type',
        field: path || 'root',
        message: 'Expected object',
        context: { expected: 'object', actual: typeof data }
      });
      return;
    }

    // Check required properties
    if (schema.properties) {
      for (const [prop, propSchema] of Object.entries(schema.properties)) {
        const fieldPath = path ? `${path}.${prop}` : prop;

        if (propSchema.required && !(prop in data)) {
          result.errors.push({
            type: 'required_field',
            field: fieldPath,
            message: `Required property "${prop}" is missing`,
            context: { field: prop }
          });
        } else if (prop in data) {
          this._validateAgainstSchema(data[prop], propSchema, result, fieldPath);
        }
      }
    }
  }

  /**
   * Validate array type
   * @private
   */
  _validateArray(data, schema, result, path) {
    if (!Array.isArray(data)) {
      result.errors.push({
        type: 'invalid_type',
        field: path,
        message: 'Expected array',
        context: { expected: 'array', actual: typeof data }
      });
      return;
    }

    // Check length constraints
    if (schema.minItems && data.length < schema.minItems) {
      result.errors.push({
        type: 'out_of_range',
        field: path,
        message: `Array too short (minimum ${schema.minItems} items)`,
        context: { value: data.length, min: schema.minItems }
      });
    }

    if (schema.maxItems && data.length > schema.maxItems) {
      result.errors.push({
        type: 'out_of_range',
        field: path,
        message: `Array too long (maximum ${schema.maxItems} items)`,
        context: { value: data.length, max: schema.maxItems }
      });
    }

    // Validate items
    if (schema.items) {
      data.forEach((item, index) => {
        const itemPath = `${path}[${index}]`;
        this._validateAgainstSchema(item, schema.items, result, itemPath);
      });
    }
  }

  /**
   * Validate primitive types
   * @private
   */
  _validatePrimitive(data, schema, result, path) {
    // Type check
    const expectedType = schema.type;
    const actualType = typeof data;

    if (actualType !== expectedType) {
      result.errors.push({
        type: 'invalid_type',
        field: path,
        message: `Type mismatch`,
        context: { expected: expectedType, actual: actualType }
      });
      return;
    }

    // Enum validation
    if (schema.enum && !schema.enum.includes(data)) {
      result.errors.push({
        type: 'invalid_enum',
        field: path,
        message: 'Invalid enum value',
        context: { field: path, validValues: schema.enum.join(', ') }
      });
    }

    // Pattern validation for strings
    if (schema.pattern && typeof data === 'string' && !schema.pattern.test(data)) {
      result.errors.push({
        type: 'invalid_format',
        field: path,
        message: 'Format validation failed',
        context: { field: path }
      });
    }

    // Range validation for numbers
    if (typeof data === 'number') {
      if (schema.minimum !== undefined && data < schema.minimum) {
        result.errors.push({
          type: 'out_of_range',
          field: path,
          message: 'Value below minimum',
          context: { value: data, min: schema.minimum }
        });
      }
      if (schema.maximum !== undefined && data > schema.maximum) {
        result.errors.push({
          type: 'out_of_range',
          field: path,
          message: 'Value above maximum',
          context: { value: data, max: schema.maximum }
        });
      }
    }

    // Length validation for strings
    if (typeof data === 'string') {
      if (schema.minLength && data.length < schema.minLength) {
        result.errors.push({
          type: 'out_of_range',
          field: path,
          message: 'String too short',
          context: { value: data.length, min: schema.minLength }
        });
      }
      if (schema.maxLength && data.length > schema.maxLength) {
        result.errors.push({
          type: 'out_of_range',
          field: path,
          message: 'String too long',
          context: { value: data.length, max: schema.maxLength }
        });
      }
    }
  }

  /**
   * Validate entity references against HASS
   * @private
   */
  _validateEntities(data, result, context) {
    if (!this.hass || !this.hass.states) return;

    this._findEntityReferences(data, '', result);
  }

  /**
   * Find and validate entity references in data
   * @private
   */
  _findEntityReferences(obj, path, result) {
    if (typeof obj === 'string') {
      // Check if it looks like an entity ID
      if (/^[a-zA-Z_][a-zA-Z0-9_]*\.[a-zA-Z0-9_]+$/.test(obj)) {
        this._validateEntity(obj, path, result);
      }
    } else if (obj && typeof obj === 'object') {
      for (const [key, value] of Object.entries(obj)) {
        const fieldPath = path ? `${path}.${key}` : key;

        // Special handling for known entity fields
        if (key === 'entity' || key === 'entity_id') {
          if (typeof value === 'string') {
            this._validateEntity(value, fieldPath, result);
          }
        } else {
          this._findEntityReferences(value, fieldPath, result);
        }
      }
    }
  }

  /**
   * Validate a single entity exists in HASS
   * @private
   */
  _validateEntity(entityId, path, result) {
    this.stats.entityChecks++;

    // Check cache first
    if (this.entityCache.has(entityId)) {
      const cached = this.entityCache.get(entityId);
      if (!cached.exists) {
        result.warnings.push({
          type: 'missing_entity',
          field: path,
          message: `Entity not found in Home Assistant`,
          context: { entity: entityId },
          severity: 'warning'
        });
      }
      return;
    }

    // Check if entity exists in HASS
    const exists = !!this.hass.states[entityId];
    this.entityCache.set(entityId, { exists, checkedAt: Date.now() });

    if (!exists) {
      result.warnings.push({
        type: 'missing_entity',
        field: path,
        message: `Entity not found in Home Assistant`,
        context: { entity: entityId },
        severity: 'warning'
      });
    }
  }

  /**
   * Generate cache key for validation result
   * @private
   */
  _generateCacheKey(data, schema, context) {
    const dataStr = JSON.stringify(data);
    const schemaStr = typeof schema === 'string' ? schema : JSON.stringify(schema);
    const contextStr = JSON.stringify(context);
    return `${dataStr}:${schemaStr}:${contextStr}`;
  }

  /**
   * Clear validation cache
   */
  clearCache() {
    this.validationCache.clear();
    this.entityCache.clear();
    lcardsLog.debug('[CoreValidationService] Cache cleared');
  }

  /**
   * Get validation statistics
   * @returns {Object} Validation statistics
   */
  getStats() {
    return { ...this.stats };
  }

  /**
   * Get debug information
   * @returns {Object} Debug info
   */
  getDebugInfo() {
    return {
      initialized: this.initialized,
      hasHASS: !!this.hass,
      config: { ...this.config },
      stats: this.getStats(),
      cacheSize: this.validationCache.size,
      entityCacheSize: this.entityCache.size,
      availableSchemas: this.schemaRegistry.listSchemas()
    };
  }

  /**
   * Update HASS instance (for consistency with other core managers)
   * @param {Object} hass - Home Assistant instance
   */
  updateHass(hass) {
    this.hass = hass;

    // Clear entity cache when HASS updates (entities may have changed)
    this.entityCache.clear();

    lcardsLog.debug('[CoreValidationService] 🔄 HASS updated, entity cache cleared');
  }

  /**
   * Destroy validation service and clean up resources
   */
  destroy() {
    this.clearCache();
    this.hass = null;
    this.initialized = false;

    lcardsLog.debug('[CoreValidationService] Destroyed');
  }
}