/**
 * @fileoverview Control Overlay Schema
 *
 * Validation schema for control overlays.
 * Enforces single nested card pattern with clear error messages.
 *
 * @module core/validation-service/schemas/controlOverlay
 */

/**
 * Control overlay validation schema
 * 
 * Enforces the nested card pattern:
 * ```yaml
 * - type: control
 *   id: unique_id
 *   card:
 *     type: custom:lcards-button  # or any HA card type
 *     entity: light.example
 *     # ... other card properties
 * ```
 */
export const controlOverlaySchema = {
  type: 'control',
  extends: 'common',

  required: ['card'],

  properties: {
    card: {
      type: 'object',
      required: true,
      description: 'Nested card definition (required)',
      properties: {
        type: {
          type: 'string',
          required: true,
          description: 'Card type (e.g., "custom:lcards-button", "button", "light")',
          errorMessage: 'Card must have a "type" property'
        }
      },
      errorMessage: 'Control overlay must have a "card" property with nested card definition'
    },

    position: {
      type: 'array',
      length: 2,
      optional: false,
      items: {
        type: 'number'
      },
      errorMessage: 'Position must be an array of [x, y] coordinates'
    },

    size: {
      type: 'array',
      length: 2,
      optional: false,
      items: {
        type: 'number',
        min: 0
      },
      errorMessage: 'Size must be an array of [width, height] dimensions'
    },

    z_index: {
      type: 'number',
      optional: true,
      description: 'Layering order (higher values appear on top)'
    },

    visible: {
      type: 'boolean',
      optional: true,
      description: 'Show or hide the control overlay'
    }
  },

  validators: [
    // Validate card object structure
    (overlay, context) => {
      if (!overlay.card) {
        return {
          valid: false,
          errors: [{
            field: 'card',
            type: 'required_field',
            message: 'Control overlay requires a "card" property',
            severity: 'error',
            suggestion: 'Add a "card" property with nested card definition:\n' +
                       '  card:\n' +
                       '    type: custom:lcards-button\n' +
                       '    entity: light.example'
          }]
        };
      }

      if (typeof overlay.card !== 'object') {
        return {
          valid: false,
          errors: [{
            field: 'card',
            type: 'invalid_type',
            message: 'Control overlay "card" must be an object',
            severity: 'error',
            expected: 'object',
            actual: typeof overlay.card
          }]
        };
      }

      if (!overlay.card.type) {
        return {
          valid: false,
          errors: [{
            field: 'card.type',
            type: 'required_field',
            message: 'Card definition is missing required "type" property',
            severity: 'error',
            suggestion: 'Add a "type" property to your card definition:\n' +
                       '  card:\n' +
                       '    type: custom:lcards-button  # or any card type\n' +
                       '    entity: light.example'
          }]
        };
      }

      if (typeof overlay.card.type !== 'string') {
        return {
          valid: false,
          errors: [{
            field: 'card.type',
            type: 'invalid_type',
            message: 'Card "type" must be a string',
            severity: 'error',
            expected: 'string',
            actual: typeof overlay.card.type
          }]
        };
      }

      return { valid: true };
    },

    // Detect and reject flat/direct pattern
    (overlay, context) => {
      // Check if user tried to use flat pattern (type is not 'control')
      // This will be caught at a higher level, but we add extra guidance here
      if (overlay.type && overlay.type !== 'control' && overlay.type !== 'line') {
        return {
          valid: false,
          errors: [{
            field: 'type',
            type: 'invalid_pattern',
            message: `Flat/direct card pattern not supported. Found type "${overlay.type}" where "control" expected.`,
            severity: 'error',
            suggestion: 'Use the nested card pattern:\n' +
                       '  - type: control\n' +
                       '    id: my_control\n' +
                       '    card:\n' +
                       `      type: ${overlay.type}\n` +
                       '      entity: your.entity\n' +
                       '    position: [x, y]\n' +
                       '    size: [width, height]'
          }]
        };
      }

      return { valid: true };
    },

    // Reject legacy card_config / cardConfig patterns
    (overlay, context) => {
      const warnings = [];
      
      if (overlay.card_config) {
        warnings.push({
          field: 'card_config',
          type: 'deprecated_field',
          message: 'Legacy field "card_config" is no longer supported',
          severity: 'error',
          suggestion: 'Replace "card_config" with "card":\n' +
                     '  card:\n' +
                     '    type: custom:lcards-button\n' +
                     '    entity: light.example'
        });
      }

      if (overlay.cardConfig) {
        warnings.push({
          field: 'cardConfig',
          type: 'deprecated_field',
          message: 'Legacy field "cardConfig" is no longer supported',
          severity: 'error',
          suggestion: 'Replace "cardConfig" with "card":\n' +
                     '  card:\n' +
                     '    type: custom:lcards-button\n' +
                     '    entity: light.example'
        });
      }

      if (warnings.length > 0) {
        return {
          valid: false,
          errors: warnings
        };
      }

      return { valid: true };
    },

    // Validate position is provided
    (overlay, context) => {
      if (!overlay.position) {
        return {
          valid: false,
          errors: [{
            field: 'position',
            type: 'required_field',
            message: 'Control overlay requires "position" property',
            severity: 'error',
            suggestion: 'Add position coordinates: position: [x, y]'
          }]
        };
      }

      return { valid: true };
    },

    // Validate size is provided
    (overlay, context) => {
      if (!overlay.size) {
        return {
          valid: false,
          errors: [{
            field: 'size',
            type: 'required_field',
            message: 'Control overlay requires "size" property',
            severity: 'error',
            suggestion: 'Add size dimensions: size: [width, height]'
          }]
        };
      }

      return { valid: true };
    }
  ]
};

export default controlOverlaySchema;
