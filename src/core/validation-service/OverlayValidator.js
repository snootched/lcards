/**
 * @fileoverview Overlay/Config Validator - Schema-based structural validation
 *
 * Validates config structure against registered schemas:
 * - Required fields present
 * - Field types correct
 * - Array/object structures valid
 * - References to other entities valid
 *
 * Migrated from MSD validation to core singleton architecture.
 *
 * @module core/validation-service/OverlayValidator
 */

import { lcardsLog } from '../../utils/lcards-logging.js';
import { ValueValidator } from './ValueValidator.js';

/**
 * Overlay/Config Validator
 *
 * Validates configurations against schemas.
 */
export class OverlayValidator {
  /**
   * Create an OverlayValidator
   *
   * @param {SchemaRegistry} schemaRegistry - Schema registry instance
   */
  constructor(schemaRegistry) {
    this.schemaRegistry = schemaRegistry;
    this.valueValidator = new ValueValidator();
  }

  /**
   * Set ThemeManager for token validation
   * @param {Object} themeManager - ThemeManager instance
   */
  setThemeManager(themeManager) {
    if (this.valueValidator) {
      this.valueValidator.setThemeManager(themeManager);
    }
  }

  /**
   * Validate a config against its schema
   *
   * @param {Object} config - Configuration to validate (overlay, card config, etc.)
   * @param {Object} context - Validation context
   * @returns {Object} Validation result with errors and warnings
   *
   * @example
   * const result = overlayValidator.validate({
   *   id: 'my-text',
   *   type: 'text',
   *   text: 'Hello',
   *   position: [100, 100]
   * });
   */
  validate(config, context = {}) {
    const result = {
      errors: [],
      warnings: []
    };

    // Basic structure validation
    if (!config || typeof config !== 'object') {
      result.errors.push({
        field: 'config',
        type: 'invalid_type',
        message: 'Configuration must be an object',
        severity: 'error'
      });
      return result;
    }

    // Validate required base fields (id, type)
    this._validateBaseFields(config, result);

    // Get schema for config type
    const schema = this.schemaRegistry.getSchema(config.type);

    if (!schema) {
      // No schema registered - issue warning but don't fail
      result.warnings.push({
        field: 'type',
        type: 'unknown_type',
        message: `No validation schema registered for type '${config.type}'`,
        severity: 'warning',
        suggestion: 'This config type may not be validated completely'
      });
      return result;
    }

    // Validate required fields
    if (schema.required) {
      this._validateRequiredFields(config, schema.required, result);
    }

    // Validate properties
    if (schema.properties) {
      this._validateProperties(config, schema.properties, result, context);
    }

    // Run custom validators
    if (schema.validators) {
      this._runCustomValidators(config, schema.validators, result, context);
    }

    // Validate anchor references (if config uses anchors)
    if (context.anchors) {
      this._validateAnchorReferences(config, context.anchors, result);
    }

    // Validate attach_to references (if config attaches to another)
    if (context.overlays) {
      this._validateAttachmentReferences(config, context.overlays, result);
    }

    return result;
  }

  /**
   * Validate base fields (id, type) required for all configs
   *
   * @private
   * @param {Object} config - Configuration
   * @param {Object} result - Validation result to populate
   */
  _validateBaseFields(config, result) {
    // Validate ID
    if (!config.id) {
      result.errors.push({
        field: 'id',
        type: 'required_field',
        message: 'Configuration is missing required field "id"',
        severity: 'error',
        suggestion: 'Add an "id" field with a unique identifier'
      });
    } else if (typeof config.id !== 'string') {
      result.errors.push({
        field: 'id',
        type: 'invalid_type',
        message: 'Configuration "id" must be a string',
        actual: typeof config.id,
        expected: 'string',
        severity: 'error'
      });
    } else if (!/^[a-zA-Z0-9_-]+$/.test(config.id)) {
      result.errors.push({
        field: 'id',
        type: 'invalid_format',
        message: 'Configuration "id" contains invalid characters',
        value: config.id,
        severity: 'error',
        suggestion: 'Use only letters, numbers, hyphens, and underscores'
      });
    }

    // Validate type
    if (!config.type) {
      result.errors.push({
        field: 'type',
        type: 'required_field',
        message: 'Configuration is missing required field "type"',
        severity: 'error',
        suggestion: 'Add a "type" field (e.g., "text", "button", "line")'
      });
    } else if (typeof config.type !== 'string') {
      result.errors.push({
        field: 'type',
        type: 'invalid_type',
        message: 'Configuration "type" must be a string',
        actual: typeof config.type,
        expected: 'string',
        severity: 'error'
      });
    }
  }

  /**
   * Validate required fields from schema
   *
   * @private
   * @param {Object} config - Configuration
   * @param {Array<string>} required - Required field names
   * @param {Object} result - Validation result
   */
  _validateRequiredFields(config, required, result) {
    required.forEach(fieldName => {
      if (!(fieldName in config)) {
        result.errors.push({
          field: fieldName,
          type: 'required_field',
          message: `Required field "${fieldName}" is missing`,
          severity: 'error',
          suggestion: `Add the "${fieldName}" field to your configuration`
        });
      }
    });
  }

  /**
   * Validate properties against schema definitions
   *
   * @private
   * @param {Object} config - Configuration
   * @param {Object} properties - Schema property definitions
   * @param {Object} result - Validation result
   * @param {Object} context - Validation context
   */
  _validateProperties(config, properties, result, context) {
    Object.entries(properties).forEach(([propName, propSchema]) => {
      // Skip if field not present and is optional
      if (!(propName in config)) {
        if (!propSchema.optional && !propSchema.required) {
          // Field is neither required nor explicitly optional - assume optional
          return;
        }
        if (propSchema.optional) {
          return;
        }
      }

      const value = config[propName];

      // Validate using ValueValidator
      const valueResult = this.valueValidator.validate(
        value,
        propSchema,
        { field: propName, overlayType: config.type, context }
      );

      if (!valueResult.valid) {
        result.errors.push(...valueResult.errors);
        result.warnings.push(...valueResult.warnings);
      }
    });
  }

  /**
   * Run custom validator functions
   *
   * @private
   * @param {Object} config - Configuration
   * @param {Array<Function>} validators - Custom validator functions
   * @param {Object} result - Validation result
   * @param {Object} context - Validation context
   */
  _runCustomValidators(config, validators, result, context) {
    validators.forEach(validator => {
      try {
        const validatorResult = validator(config, context);

        if (validatorResult && !validatorResult.valid) {
          if (validatorResult.errors) {
            result.errors.push(...validatorResult.errors);
          }
          if (validatorResult.warnings) {
            result.warnings.push(...validatorResult.warnings);
          }
        }
      } catch (error) {
        lcardsLog.error('[OverlayValidator] Custom validator failed:', error);
        result.warnings.push({
          field: 'validator',
          type: 'validator_error',
          message: `Custom validator failed: ${error.message}`,
          severity: 'warning'
        });
      }
    });
  }

  /**
   * Validate anchor references
   *
   * @private
   * @param {Object} config - Configuration
   * @param {Object} anchors - Available anchors
   * @param {Object} result - Validation result
   */
  _validateAnchorReferences(config, anchors, result) {
    const anchorFields = ['anchor', 'position'];

    anchorFields.forEach(field => {
      const value = config[field];

      // Check if it's an anchor reference (string)
      if (typeof value === 'string' && value.length > 0) {
        // Check if anchor exists
        if (!anchors[value]) {
          result.errors.push({
            field: field,
            type: 'invalid_reference',
            reference: value,
            referenceType: 'anchors',
            message: `Anchor "${value}" not found`,
            severity: 'error',
            suggestion: `Ensure anchor "${value}" is defined in your configuration`,
            helpUrl: 'https://docs.cb-lcars.com/msd/anchors'
          });
        }
      }
    });
  }

  /**
   * Validate attachment references (attach_to, attachTo)
   *
   * @private
   * @param {Object} config - Configuration
   * @param {Array<Object>} overlays - All overlays
   * @param {Object} result - Validation result
   */
  _validateAttachmentReferences(config, overlays, result) {
    const attachFields = ['attach_to', 'attachTo'];

    attachFields.forEach(field => {
      const value = config[field];

      if (typeof value === 'string' && value.length > 0) {
        // Check if target overlay exists
        const targetExists = overlays.some(o => o.id === value);

        if (!targetExists) {
          result.errors.push({
            field: field,
            type: 'invalid_reference',
            reference: value,
            referenceType: 'overlays',
            message: `Target overlay "${value}" not found`,
            severity: 'error',
            suggestion: `Ensure overlay "${value}" is defined in your configuration`,
            helpUrl: 'https://docs.cb-lcars.com/msd/attachments'
          });
        }

        // Warn about self-attachment
        if (value === config.id) {
          result.warnings.push({
            field: field,
            type: 'self_reference',
            message: `Config "${config.id}" is attached to itself`,
            severity: 'warning',
            suggestion: 'Attach to a different overlay or remove the attachment'
          });
        }
      }
    });
  }
}

export default OverlayValidator;
