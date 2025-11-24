/**
 * @fileoverview Error Formatter for Validation Messages
 *
 * Formats validation errors into user-friendly messages with:
 * - Clear explanations
 * - Suggestions for fixes
 * - Example corrections
 * - Help URLs
 *
 * Migrated from MSD validation to core singleton architecture.
 *
 * @module core/validation-service/ErrorFormatter
 */

/**
 * Error Formatter
 *
 * Converts validation errors into user-friendly messages.
 */
export class ErrorFormatter {
  constructor() {
    // Error message templates
    this.templates = new Map([
      ['required_field', 'Required field "{field}" is missing'],
      ['invalid_type', 'Field "{field}" has invalid type. Expected {expected}, got {actual}'],
      ['invalid_format', 'Field "{field}" has invalid format'],
      ['out_of_range', 'Field "{field}" value {value} is out of range ({min} to {max})'],
      ['invalid_reference', 'Reference "{reference}" not found in {referenceType}'],
      ['duplicate_id', 'Duplicate ID "{id}" found'],
      ['invalid_enum', 'Field "{field}" must be one of: {validValues}'],
      ['invalid_entity', 'Entity ID "{entity}" is not valid (use format: domain.entity_id)'],
      ['missing_entity', 'Entity "{entity}" not found in Home Assistant'],
      ['invalid_service', 'Service "{service}" not found or not callable'],
      ['token_not_found', 'Token "{value}" not found in theme'],
      ['data_source_not_found', 'Data source "{value}" not found'],
      ['schema_not_found', 'Validation schema "{schema}" not found']
    ]);

    // Suggestion templates
    this.suggestions = new Map([
      ['required_field', 'Add the required "{field}" field to your configuration'],
      ['invalid_type', 'Change "{field}" from {actual} to {expected}'],
      ['invalid_format', 'Check the format of "{field}"'],
      ['out_of_range', 'Use a value between {min} and {max} for "{field}"'],
      ['invalid_reference', 'Ensure "{reference}" exists in {referenceType}'],
      ['duplicate_id', 'Change the ID to a unique value'],
      ['invalid_enum', 'Use one of these values: {validValues}'],
      ['invalid_entity', 'Check the entity ID format (e.g., "light.living_room")'],
      ['missing_entity', 'Verify the entity exists in Home Assistant'],
      ['invalid_service', 'Check available services in Developer Tools'],
      ['token_not_found', 'Check your theme configuration for available tokens'],
      ['data_source_not_found', 'Ensure the data source is defined in your configuration'],
      ['schema_not_found', 'Use a registered schema name']
    ]);
  }

  /**
   * Format validation result into user-friendly message
   *
   * @param {Object} validationResult - Validation result object
   * @returns {string} Formatted error message
   *
   * @example
   * const formatted = formatter.format(validationResult);
   * console.error(formatted);
   */
  format(validationResult) {
    const parts = [];

    // Format for single overlay/config
    if (validationResult.overlayId || validationResult.configId) {
      parts.push(this._formatSingleResult(validationResult));
    }

    // Format for multiple overlays/configs
    else if (validationResult.results) {
      parts.push(this._formatMultipleResults(validationResult));
    }

    // Format simple error/warning arrays
    else if (validationResult.errors || validationResult.warnings) {
      parts.push(this._formatSimpleResult(validationResult));
    }

    return parts.join('\n\n');
  }

  /**
   * Format errors for single overlay/config
   *
   * @private
   * @param {Object} result - Validation result
   * @returns {string} Formatted message
   */
  _formatSingleResult(result) {
    const id = result.overlayId || result.configId || 'config';

    if (result.valid && result.warnings.length === 0) {
      return `✅ ${id} is valid`;
    }

    const parts = [];
    const type = result.overlayType || result.configType || 'unknown';

    // Header
    parts.push(`${result.valid ? '⚠️' : '❌'} Validation ${result.valid ? 'Warnings' : 'Errors'} in '${id}' (${type}):`);
    parts.push('');

    // Errors
    if (result.errors.length > 0) {
      parts.push('Errors:');
      result.errors.forEach((error, index) => {
        parts.push(`  ${index + 1}. ${this._formatError(error)}`);
      });
      parts.push('');
    }

    // Warnings
    if (result.warnings.length > 0) {
      parts.push('Warnings:');
      result.warnings.forEach((warning, index) => {
        parts.push(`  ${index + 1}. ${this._formatError(warning)}`);
      });
      parts.push('');
    }

    return parts.join('\n');
  }

  /**
   * Format simple validation result (just errors/warnings arrays)
   *
   * @private
   * @param {Object} result - Validation result
   * @returns {string} Formatted message
   */
  _formatSimpleResult(result) {
    if (result.valid && (!result.warnings || result.warnings.length === 0)) {
      return `✅ Configuration is valid`;
    }

    const parts = [];

    // Header
    parts.push(`${result.valid ? '⚠️' : '❌'} Validation ${result.valid ? 'Warnings' : 'Errors'}:`);
    parts.push('');

    // Errors
    if (result.errors && result.errors.length > 0) {
      parts.push('Errors:');
      result.errors.forEach((error, index) => {
        parts.push(`  ${index + 1}. ${this._formatError(error)}`);
      });
      parts.push('');
    }

    // Warnings
    if (result.warnings && result.warnings.length > 0) {
      parts.push('Warnings:');
      result.warnings.forEach((warning, index) => {
        parts.push(`  ${index + 1}. ${this._formatError(warning)}`);
      });
      parts.push('');
    }

    return parts.join('\n');
  }

  /**
   * Format errors for multiple overlays/configs
   *
   * @private
   * @param {Object} validation - Validation summary
   * @returns {string} Formatted message
   */
  _formatMultipleResults(validation) {
    const parts = [];

    // Summary
    parts.push(`📊 Validation Summary:`);
    parts.push(`   Total: ${validation.summary.total} items`);
    parts.push(`   ✅ Valid: ${validation.summary.valid}`);
    parts.push(`   ❌ Invalid: ${validation.summary.invalid}`);
    parts.push(`   Errors: ${validation.summary.errors}`);
    parts.push(`   Warnings: ${validation.summary.warnings}`);
    parts.push('');

    // Individual overlay/config errors
    const invalidResults = validation.results.filter(r => !r.valid || r.warnings.length > 0);

    if (invalidResults.length > 0) {
      parts.push('Details:');
      parts.push('');

      invalidResults.forEach(result => {
        parts.push(this._formatSingleResult(result));
      });
    }

    return parts.join('\n');
  }

  /**
   * Format a single error
   *
   * @private
   * @param {Object} error - Error object
   * @returns {string} Formatted error
   */
  _formatError(error) {
    const parts = [];

    // Error message
    const message = error.formattedMessage || error.message || this._getTemplateMessage(error);
    parts.push(`${message}`);

    // Field context
    if (error.field) {
      parts.push(`   Field: ${error.field}`);
    }

    // Value context
    if (error.value !== undefined) {
      parts.push(`   Value: ${JSON.stringify(error.value)}`);
    }

    // Expected value
    if (error.expected) {
      parts.push(`   Expected: ${error.expected}`);
    }

    // Suggestion
    const suggestion = error.suggestion || this._getSuggestion(error);
    if (suggestion) {
      parts.push(`   💡 Fix: ${suggestion}`);
    }

    // Help URL
    if (error.helpUrl) {
      parts.push(`   📖 Learn more: ${error.helpUrl}`);
    }

    return parts.join('\n');
  }

  /**
   * Format single error for display (without context)
   *
   * @param {Object} error - Error object
   * @returns {Object} Formatted error with message and suggestion
   */
  formatError(error) {
    const template = this.templates.get(error.type) || 'Validation error: {message}';
    const suggestionTemplate = this.suggestions.get(error.type) || 'Check your configuration';

    const message = this._interpolateTemplate(template, error.context || error);
    const suggestion = this._interpolateTemplate(suggestionTemplate, error.context || error);

    return {
      ...error,
      formattedMessage: message,
      suggestion,
      severity: error.severity || 'error'
    };
  }

  /**
   * Get error message from template
   *
   * @private
   * @param {Object} error - Error object
   * @returns {string} Error message
   */
  _getTemplateMessage(error) {
    const template = this.templates.get(error.type);
    if (!template) {
      return error.type || 'Unknown error';
    }

    // Replace placeholders
    return this._interpolateTemplate(template, error);
  }

  /**
   * Get suggestion from template
   *
   * @private
   * @param {Object} error - Error object
   * @returns {string} Suggestion
   */
  _getSuggestion(error) {
    const template = this.suggestions.get(error.type);
    if (!template) {
      return null;
    }

    return this._interpolateTemplate(template, error);
  }

  /**
   * Interpolate template with context values
   *
   * @private
   * @param {string} template - Template string
   * @param {Object} data - Data for replacement
   * @returns {string} Formatted string
   */
  _interpolateTemplate(template, data) {
    return template.replace(/\{(\w+)\}/g, (match, key) => {
      return data[key] !== undefined ? data[key] : match;
    });
  }

  /**
   * Add custom error template
   *
   * @param {string} type - Error type
   * @param {string} message - Message template
   * @param {string} [suggestion] - Suggestion template
   */
  addTemplate(type, message, suggestion = null) {
    this.templates.set(type, message);
    if (suggestion) {
      this.suggestions.set(type, suggestion);
    }
  }
}

export default ErrorFormatter;
