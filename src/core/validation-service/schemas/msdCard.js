/**
 * @fileoverview MSD Card Schema
 * 
 * Validation schema for MSD (Master Systems Display) cards.
 * Only line and control overlay types are supported.
 * 
 * @module core/validation-service/schemas/msdCard
 */

export const msdCardSchema = {
  type: 'msd-card',
  
  required: ['base_svg'],
  
  properties: {
    base_svg: {
      type: 'object',
      required: ['source'],
      properties: {
        source: {
          type: 'string',
          minLength: 1,
          errorMessage: 'base_svg.source is required (builtin:key, /local/path.svg, or "none")'
        },
        filter_preset: {
          type: 'string',
          enum: ['dimmed', 'subtle', 'backdrop', 'faded', 'red-alert', 'monochrome', 'none'],
          optional: true
        },
        filters: {
          type: 'object',
          optional: true
        }
      }
    },
    
    view_box: {
      type: ['string', 'array'],
      optional: true
    },
    
    anchors: {
      type: 'object',
      optional: true
    },
    
    overlays: {
      type: 'array',
      items: {
        type: 'object',
        required: ['id', 'type'],
        properties: {
          type: {
            type: 'string',
            enum: ['line', 'control'],
            errorMessage: 'Only "line" and "control" overlay types are supported. Use LCARdS cards for buttons/charts.'
          }
        }
      },
      optional: true
    },
    
    routing: {
      type: 'object',
      optional: true
    },
    
    data_sources: {
      type: 'object',
      optional: true
    },
    
    rules: {
      type: 'array',
      optional: true
    },
    
    debug: {
      type: 'object',
      optional: true
    },
    
    theme: {
      type: 'string',
      optional: true
    }
  },
  
  validators: [
    // Warn if use_packs is present
    (config, context) => {
      if (config.use_packs) {
        return {
          valid: true,
          warnings: [{
            field: 'use_packs',
            type: 'deprecated_field',
            message: 'Field "use_packs" is deprecated and ignored. Packs are loaded globally by PackManager.',
            severity: 'warning',
            suggestion: 'Remove "use_packs" from your configuration'
          }]
        };
      }
      return { valid: true };
    },
    
    // Warn if version is present
    (config, context) => {
      if (config.version) {
        return {
          valid: true,
          warnings: [{
            field: 'version',
            type: 'deprecated_field',
            message: 'Field "version" is no longer required and will be ignored.',
            severity: 'warning',
            suggestion: 'Remove "version" from your configuration'
          }]
        };
      }
      return { valid: true };
    },
    
    // Warn if msd.version is present (nested structure)
    (config, context) => {
      if (config.msd?.version) {
        return {
          valid: true,
          warnings: [{
            field: 'msd.version',
            type: 'deprecated_field',
            message: 'Field "msd.version" is no longer required and will be ignored.',
            severity: 'warning',
            suggestion: 'Remove "version" from your msd configuration'
          }]
        };
      }
      return { valid: true };
    }
  ]
};

export default msdCardSchema;
