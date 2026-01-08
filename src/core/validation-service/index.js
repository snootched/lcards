/**
 * @fileoverview CoreValidationService - Unified validation system for LCARdS core infrastructure
 *
 * Comprehensive validation service that consolidates:
 * - Schema-based structural validation
 * - Token reference validation
 * - Data source validation
 * - Value type/range validation
 * - User-friendly error messages with suggestions
 *
 * This is the singleton validation service used by all LCARdS cards.
 * Migrated from MSD-specific validation to core singleton architecture.
 *
 * @module core/validation-service
 */

import { lcardsLog } from '../../utils/lcards-logging.js';
import { SchemaRegistry } from './SchemaRegistry.js';
import { OverlayValidator } from './OverlayValidator.js';
import { TokenValidator } from './TokenValidator.js';
import { DataSourceValidator } from './DataSourceValidator.js';
import { ErrorFormatter } from './ErrorFormatter.js';
import { ValueValidator } from './ValueValidator.js';
import { registerAllSchemas } from './schemas/index.js';

/**
 * Legacy CoreSchemaRegistry for backward compatibility
 * Wraps the new SchemaRegistry with additional card-specific schemas
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
    // Handle oneOf - try each option and succeed if any match
    if (schema.oneOf) {
      return this._validateOneOf(data, schema, result, path);
    }

    if (schema.type === 'object') {
      this._validateObject(data, schema, result, path);
    } else if (schema.type === 'array') {
      this._validateArray(data, schema, result, path);
    } else {
      this._validatePrimitive(data, schema, result, path);
    }
  }

  /**
   * Validate oneOf (data must match exactly one schema)
   * @private
   */
  _validateOneOf(data, schema, result, path) {
    const matchedSchemas = [];

    for (let i = 0; i < schema.oneOf.length; i++) {
      const option = schema.oneOf[i];
      const tempResult = { valid: true, errors: [], warnings: [] };

      this._validateAgainstSchema(data, option, tempResult, path);

      if (tempResult.errors.length === 0) {
        matchedSchemas.push(i);
      }
    }

    // oneOf requires exactly one match
    if (matchedSchemas.length === 0) {
      // Get expected types from oneOf options
      const expectedTypes = schema.oneOf
        .map(opt => opt.type || 'object')
        .filter((v, i, a) => a.indexOf(v) === i); // unique

      const actualType = typeof data;

      // Don't report as type error if the actual type is one of the expected types
      // (the real issue is likely a property/format validation failure)
      if (!expectedTypes.includes(actualType)) {
        result.errors.push({
          type: 'invalid_type',
          field: path,
          message: 'Type mismatch',
          context: {
            field: path,
            expected: expectedTypes.join(' or '),
            actual: actualType
          }
        });
      }
      // If type matches but validation failed, the specific errors were already added
      // by the temp validation runs above, so don't add a generic type error
    } else if (matchedSchemas.length > 1) {
      // Multiple matches - this is technically a schema error but we'll allow it
      // and just use the first match (common in practice)
      if (this.config.debug) {
        lcardsLog.debug(`[CoreValidationService] Multiple oneOf matches at ${path}:`, matchedSchemas);
      }
    }
    // If exactly 1 match, validation passes (no error added)
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
        context: {
          field: path || 'root',
          expected: 'object',
          actual: typeof data
        }
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
            context: {
              field: fieldPath,
              prop
            }
          });
        } else if (prop in data) {
          this._validateAgainstSchema(data[prop], propSchema, result, fieldPath);
        }
      }
    }

    // Check for additional properties if additionalProperties is false
    if (schema.additionalProperties === false && schema.properties) {
      const allowedProps = Object.keys(schema.properties);
      for (const prop of Object.keys(data)) {
        if (!allowedProps.includes(prop)) {
          result.errors.push({
            type: 'invalid_property',
            field: path ? `${path}.${prop}` : prop,
            message: `Unexpected property "${prop}"`,
            context: {
              field: path ? `${path}.${prop}` : prop,
              prop,
              allowedProperties: allowedProps
            }
          });
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
        context: {
          field: path,
          expected: 'array',
          actual: typeof data
        }
      });
      return;
    }

    // Check length constraints
    if (schema.minItems && data.length < schema.minItems) {
      result.errors.push({
        type: 'out_of_range',
        field: path,
        message: `Array too short (minimum ${schema.minItems} items)`,
        context: {
          field: path,
          value: data.length,
          min: schema.minItems
        }
      });
    }

    if (schema.maxItems && data.length > schema.maxItems) {
      result.errors.push({
        type: 'out_of_range',
        field: path,
        message: `Array too long (maximum ${schema.maxItems} items)`,
        context: {
          field: path,
          value: data.length,
          max: schema.maxItems
        }
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
    // Type check - handle both string and array of types
    const expectedTypes = Array.isArray(schema.type) ? schema.type : [schema.type];
    const actualType = typeof data;

    if (!expectedTypes.includes(actualType)) {
      result.errors.push({
        type: 'invalid_type',
        field: path,
        message: `Type mismatch`,
        context: {
          field: path,
          expected: expectedTypes.join(' or '),
          actual: actualType
        }
      });
      return;
    }

    // Enum validation
    if (schema.enum && !schema.enum.includes(data)) {
      result.errors.push({
        type: 'invalid_enum',
        field: path,
        message: 'Invalid enum value',
        context: {
          field: path,
          validValues: schema.enum.join(', ')
        }
      });
    }

    // Pattern validation for strings
    if (schema.pattern && typeof data === 'string') {
      try {
        const pattern = typeof schema.pattern === 'string' ? new RegExp(schema.pattern) : schema.pattern;
        if (!pattern.test(data)) {
          result.errors.push({
            type: 'invalid_format',
            field: path,
            message: 'Format validation failed',
            context: { field: path, pattern: schema.pattern }
          });
        }
      } catch (error) {
        lcardsLog.warn(`[CoreValidationService] Invalid regex pattern at ${path}:`, schema.pattern, error);
      }
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
    // ✅ FIX: Skip validation for control overlay card properties
    // Nested cards (button, lcards-button, etc.) validate their own entities
    // This prevents false warnings for entities in msd.overlays[].card.*
    if (path.includes('.card.') || path.includes('.card_config.') || path.includes('.cardConfig.')) {
      lcardsLog.trace(`[CoreValidationService] Skipping entity validation for nested card property: ${path}`);
      return;
    }

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

  // ============================================================================
  // MSD VALIDATION FEATURES (Consolidated from MSD ValidationService)
  // ============================================================================

  /**
   * Set ThemeManager for token validation
   *
   * @param {Object} themeManager - ThemeManager instance
   */
  setThemeManager(themeManager) {
    this.themeManager = themeManager;
    this.tokenValidator = new TokenValidator(themeManager);

    // Pass ThemeManager to ValueValidator if OverlayValidator exists
    if (this.overlayValidator && this.overlayValidator.valueValidator) {
      this.overlayValidator.valueValidator.setThemeManager(themeManager);
    }

    lcardsLog.debug('[CoreValidationService] ThemeManager connected for token validation');
  }

  /**
   * Set DataSourceManager for data source validation
   *
   * @param {Object} dataSourceManager - DataSourceManager instance
   */
  setDataSourceManager(dataSourceManager) {
    this.dataSourceValidator = new DataSourceValidator(dataSourceManager);
    lcardsLog.debug('[CoreValidationService] DataSourceManager connected for data source validation');
  }

  /**
   * Initialize the enhanced overlay validation subsystem
   * This sets up schema registry and overlay validator for MSD overlays
   */
  initializeOverlayValidation() {
    if (this.overlaySchemaRegistry) {
      // Already initialized
      return;
    }

    // Create enhanced schema registry for overlays
    this.overlaySchemaRegistry = new SchemaRegistry();
    this.overlayValidator = new OverlayValidator(this.overlaySchemaRegistry);
    this.enhancedErrorFormatter = new ErrorFormatter();

    // Register all MSD overlay schemas
    registerAllSchemas(this.overlaySchemaRegistry);

    lcardsLog.debug('[CoreValidationService] Overlay validation initialized', {
      schemaCount: this.overlaySchemaRegistry.getSchemaCount(),
      types: this.overlaySchemaRegistry.getRegisteredTypes()
    });
  }

  /**
   * Validate a single overlay (MSD-style)
   *
   * @param {Object} overlay - Overlay configuration
   * @param {Object} context - Validation context
   * @param {Array} [context.viewBox] - SVG viewBox [x, y, width, height]
   * @param {Object} [context.anchors] - Available anchors
   * @param {Object} [context.overlays] - All overlays (for reference validation)
   * @returns {Object} Validation result
   *
   * @example
   * const result = validationService.validateOverlay({
   *   id: 'my-text',
   *   type: 'text',
   *   text: 'Hello',
   *   position: [100, 100]
   * }, { viewBox: [0, 0, 800, 600] });
   *
   * if (!result.valid) {
   *   console.error(result.errors);
   * }
   */
  validateOverlay(overlay, context = {}) {
    // Initialize overlay validation if not done yet
    if (!this.overlaySchemaRegistry) {
      this.initializeOverlayValidation();
    }

    this.stats.validationsPerformed++;

    // Check cache
    const cacheKey = this._generateOverlayCacheKey(overlay, context);
    if (this.config.cacheResults && this.validationCache.has(cacheKey)) {
      this.stats.cacheHits++;
      const cached = this.validationCache.get(cacheKey);
      lcardsLog.debug('[CoreValidationService] Cache hit:', overlay.id);
      return cached;
    }

    const result = {
      valid: true,
      errors: [],
      warnings: [],
      overlayId: overlay.id,
      overlayType: overlay.type
    };

    // Validation guard
    if (!overlay || typeof overlay !== 'object') {
      result.errors.push({
        field: 'overlay',
        type: 'invalid_type',
        message: 'Overlay must be an object',
        severity: 'error'
      });
      result.valid = false;
      this.stats.errorsFound++;
      return result;
    }

    // Enhanced context with DataSourceManager
    const enhancedContext = {
      ...context,
      dataSourceManager: context.dataSourceManager ||
                        (typeof window !== 'undefined' ? window.lcards?.debug?.msd?.pipelineInstance?.systemsManager?.dataSourceManager : null)
    };

    // 1. Structural validation (schema-based)
    try {
      const structuralValidation = this.overlayValidator.validate(overlay, enhancedContext);
      result.errors.push(...structuralValidation.errors);
      result.warnings.push(...structuralValidation.warnings);
    } catch (error) {
      lcardsLog.error('[CoreValidationService] Structural validation failed:', error);
      result.errors.push({
        field: 'overlay',
        type: 'validation_error',
        message: `Validation error: ${error.message}`,
        severity: 'error'
      });
    }

    // 2. Token validation (if enabled and available)
    if (this.config.validateTokens !== false && this.tokenValidator) {
      try {
        const tokenValidation = this.tokenValidator.validate(overlay, context);
        result.errors.push(...tokenValidation.errors);
        result.warnings.push(...tokenValidation.warnings);
        this.stats.tokenValidations = (this.stats.tokenValidations || 0) + 1;
      } catch (error) {
        if (this.config.debug) {
          lcardsLog.debug('[CoreValidationService] Token validation failed:', error);
        }
      }
    }

    // 3. Data source validation (if enabled and available)
    if (this.config.validateDataSources !== false && this.dataSourceValidator) {
      try {
        const dsValidation = this.dataSourceValidator.validate(overlay, context);
        result.errors.push(...dsValidation.errors);
        result.warnings.push(...dsValidation.warnings);
        this.stats.dataSourceValidations = (this.stats.dataSourceValidations || 0) + 1;
      } catch (error) {
        if (this.config.debug) {
          lcardsLog.debug('[CoreValidationService] DataSource validation failed:', error);
        }
      }
    }

    // Determine validity
    result.valid = result.errors.length === 0 &&
                   (!this.config.strict || result.warnings.length === 0);

    // Update stats
    if (!result.valid) this.stats.errorsFound++;
    if (result.warnings.length > 0) this.stats.warningsFound++;

    // Cache result
    if (this.config.cacheResults) {
      this.validationCache.set(cacheKey, result);
    }

    return result;
  }

  /**
   * Validate all overlays
   *
   * @param {Array} overlays - Array of overlay configurations
   * @param {Object} context - Validation context
   * @returns {Object} Validation summary
   *
   * @example
   * const validation = validationService.validateAll(overlays, {
   *   viewBox: [0, 0, 800, 600],
   *   anchors: { center: [400, 300] }
   * });
   *
   * if (!validation.valid) {
   *   console.log(validationService.formatErrors(validation));
   * }
   */
  validateAll(overlays, context = {}) {
    const results = [];
    let hasErrors = false;

    // Enhance context with overlay list (for reference validation)
    const enhancedContext = {
      ...context,
      overlays: overlays
    };

    for (const overlay of overlays) {
      const result = this.validateOverlay(overlay, enhancedContext);
      results.push(result);

      if (!result.valid) {
        hasErrors = true;
        if (this.config.stopOnError) {
          lcardsLog.debug('[CoreValidationService] Stopping on first error');
          break;
        }
      }
    }

    return {
      valid: !hasErrors,
      results,
      summary: {
        total: overlays.length,
        valid: results.filter(r => r.valid).length,
        invalid: results.filter(r => !r.valid).length,
        errors: results.reduce((sum, r) => sum + r.errors.length, 0),
        warnings: results.reduce((sum, r) => sum + r.warnings.length, 0)
      }
    };
  }

  /**
   * Format validation errors for display
   *
   * @param {Object} validationResult - Result from validateOverlay/validateAll
   * @returns {string} Formatted error message
   *
   * @example
   * const result = validationService.validateOverlay(overlay);
   * if (!result.valid) {
   *   console.error(validationService.formatErrors(result));
   * }
   */
  formatErrors(validationResult) {
    if (!this.enhancedErrorFormatter) {
      this.enhancedErrorFormatter = new ErrorFormatter();
    }
    return this.enhancedErrorFormatter.format(validationResult);
  }

  /**
   * Validate tokens in a config
   *
   * @param {Object} config - Configuration to validate
   * @param {Object} context - Validation context
   * @returns {Object} Validation result with errors and warnings
   */
  validateTokens(config, context = {}) {
    if (!this.tokenValidator) {
      return { errors: [], warnings: [] };
    }
    return this.tokenValidator.validate(config, context);
  }

  /**
   * Validate data sources in a config
   *
   * @param {Object} config - Configuration to validate
   * @param {Object} context - Validation context
   * @returns {Object} Validation result with errors and warnings
   */
  validateDataSources(config, context = {}) {
    if (!this.dataSourceValidator) {
      return { errors: [], warnings: [] };
    }
    return this.dataSourceValidator.validate(config, context);
  }

  /**
   * Generate cache key for overlay validation
   *
   * @private
   * @param {Object} overlay - Overlay configuration
   * @param {Object} context - Validation context
   * @returns {string} Cache key
   */
  _generateOverlayCacheKey(overlay, context) {
    // Simple cache key based on overlay ID and type
    return `overlay:${overlay.id || 'unknown'}:${overlay.type || 'unknown'}`;
  }

  /**
   * Get the overlay schema registry (for external schema registration)
   *
   * @returns {SchemaRegistry} Schema registry
   */
  getOverlaySchemaRegistry() {
    if (!this.overlaySchemaRegistry) {
      this.initializeOverlayValidation();
    }
    return this.overlaySchemaRegistry;
  }

  /**
   * Enable or disable validation caching
   *
   * @param {boolean} enabled - Enable caching
   */
  setCaching(enabled) {
    this.config.cacheResults = enabled;
    if (!enabled) {
      this.clearCache();
    }
    lcardsLog.debug('[CoreValidationService] Caching:', enabled);
  }
}

// Re-export components for external use
export { SchemaRegistry } from './SchemaRegistry.js';
export { OverlayValidator } from './OverlayValidator.js';
export { TokenValidator } from './TokenValidator.js';
export { DataSourceValidator } from './DataSourceValidator.js';
export { ErrorFormatter } from './ErrorFormatter.js';
export { ValueValidator } from './ValueValidator.js';
export { registerAllSchemas } from './schemas/index.js';