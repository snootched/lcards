/**
 * MSD Card Schema
 *
 * Complete schema for MSD (Master Systems Display) cards.
 * Includes validation for card-level config (base_svg, view_box, anchors, etc.)
 * Overlay-level validation handled by overlay schemas (line, control).
 *
 * @module cards/schemas/msd-schema
 */

import {
    filterSchema,
    cardIdSchema,
    tagsSchema,
    dataSourcesSchema,
    rulesSchema,
    cardHeightSchema,
    cardWidthSchema
} from './common-schemas.js';

/**
 * Get complete MSD card schema
 * @param {Object} [options] - Schema options
 * @param {Array<string>} [options.availableFilterPresets] - Available filter preset names
 * @returns {Object} Complete MSD schema
 */
export function getMsdSchema(options = {}) {
  const {
    availableFilterPresets = ['dimmed', 'subtle', 'backdrop', 'faded', 'red-alert', 'monochrome', 'none']
  } = options;

  // Define the MSD configuration object schema
  const msdConfigSchema = {
    type: 'object',
    required: ['base_svg'],
    properties: {
      base_svg: {
        type: 'object',
        title: 'Base SVG Configuration',
        required: ['source'],
        'x-ui': {
          control: 'object',
          expanded: true
        },
        properties: {
          source: {
            type: 'string',
            minLength: 1,
            description: 'SVG source: builtin:key, /local/path.svg, or "none"',
            examples: ['builtin:ncc-1701-a-blue', '/local/my-ship.svg', 'none'],
            'x-ui': {
              control: 'text',
              label: 'SVG Source',
              placeholder: 'builtin:ncc-1701-a-blue'
            },
            errorMessage: 'base_svg.source is required'
          },

          filter_preset: {
            type: 'string',
            enum: availableFilterPresets,
            optional: true,
            description: 'CSS filter preset to apply to base SVG',
            'x-ui': {
              control: 'select',
              label: 'Filter Preset'
            }
          },

          filters: {
            type: 'array',
            optional: true,
            description: 'Stackable CSS/SVG filters applied in sequence',
            items: filterSchema,
            'x-ui': {
              control: 'filter-editor',
              label: 'Filters'
            }
          }
        }
      },

      view_box: {
        oneOf: [
          {
            type: 'string',
            enum: ['auto'],
            description: 'Auto-extract from base_svg'
          },
          {
            type: 'array',
            minItems: 4,
            maxItems: 4,
            items: { type: 'number' },
            description: '[minX, minY, width, height]'
          }
        ],
        optional: true,
        default: 'auto',
        'x-ui': {
          control: 'text',
          label: 'View Box',
          helper: 'Auto-extract or [minX, minY, width, height]'
        }
      },

      anchors: {
        type: 'object',
        optional: true,
        description: 'Named anchor points for overlay positioning',
        additionalProperties: {
          type: 'array',
          minItems: 2,
          maxItems: 2,
          items: {
            oneOf: [
              { type: 'number' },
              { type: 'string', pattern: '^\\d+%$' }
            ]
          }
        },
        'x-ui': {
          control: 'yaml',
          label: 'Anchors',
          helper: 'Define anchor points: anchor_id: [x, y]'
        }
      },

      overlays: {
        type: 'array',
        optional: true,
        description: 'Array of overlay configurations (validated by overlay schemas)',
        items: {
          type: 'object',
          required: ['id', 'type'],
          properties: {
            type: {
              type: 'string',
              enum: ['line', 'control'],
              errorMessage: 'Only "line" and "control" overlay types supported. Use LCARdS cards for buttons/charts.'
            },
            // Line overlay routing properties
            route: {
              type: 'string',
              enum: ['auto', 'direct', 'manhattan', 'smart', 'grid', 'manual'],
              optional: true,
              default: 'auto',
              description: 'Routing algorithm: auto (recommended), direct (straight line), manhattan (L-shaped), smart (intelligent pathfinding), grid (A* on grid), manual (explicit waypoints)'
            },
            waypoints: {
              type: 'array',
              optional: true,
              description: 'Array of waypoints for manual routing. Each waypoint can be a coordinate pair [x, y] or an anchor name string. Line will pass through waypoints in order.'
            },
            route_hint: {
              type: 'string',
              enum: ['', 'xy', 'yx'],
              optional: true,
              description: 'Initial segment direction hint: empty/auto (geometry-based), xy = horizontal first, yx = vertical first'
            },
            route_hint_last: {
              type: 'string',
              enum: ['', 'xy', 'yx'],
              optional: true,
              description: 'Final segment direction hint: empty/auto (same as route_hint), xy = vertical last, yx = horizontal last'
            },
            route_channels: {
              type: 'array',
              items: { type: 'string' },
              optional: true,
              description: 'Array of channel IDs this line should route through'
            },
            clearance: {
              type: 'number',
              min: 0,
              optional: true,
              description: 'Minimum clearance around obstacles in pixels (overrides global default)'
            },
            corner_style: {
              type: 'string',
              enum: ['miter', 'round', 'bevel'],
              optional: true,
              default: 'miter',
              description: 'How line corners are rendered'
            },
            corner_radius: {
              type: 'number',
              min: 0,
              optional: true,
              default: 0,
              description: 'Corner rounding radius in pixels (for round corners)'
            },
            smoothing_mode: {
              type: 'string',
              enum: ['none', 'chaikin'],
              optional: true,
              default: 'none',
              description: 'Path smoothing algorithm'
            },
            smoothing_iterations: {
              type: 'number',
              min: 0,
              max: 5,
              optional: true,
              default: 0,
              description: 'Number of smoothing iterations to apply'
            }
          }
        },
        'x-ui': {
          control: 'array',
          label: 'Overlays',
          addLabel: 'Add Overlay'
        }
      },

      routing: {
        type: 'object',
        optional: true,
        description: 'Global line routing configuration (lines can override with per-line properties)',
        properties: {
          // Routing intelligence
          default_mode: {
            type: 'string',
            enum: ['manhattan', 'smart', 'grid', 'auto'],
            optional: true,
            default: 'manhattan',
            description: 'Default routing mode for all lines (manhattan: simple L-shaped, smart: multi-bend intelligent, grid: A* pathfinding, auto: let system decide)',
            'x-ui': {
              control: 'select',
              label: 'Default Routing Mode',
              helper: 'Global routing strategy applied to all lines unless overridden per-line'
            }
          },
          auto_upgrade_simple_lines: {
            type: 'boolean',
            optional: true,
            default: true,
            description: 'Automatically upgrade manhattan to smart routing when channels or obstacles are detected',
            'x-ui': {
              control: 'checkbox',
              label: 'Auto-Upgrade to Smart Routing',
              helper: 'Automatically use smart routing when line complexity requires it'
            }
          },

          // Basic routing
          clearance: {
            type: 'number',
            min: 0,
            optional: true,
            default: 0,
            description: 'Minimum clearance around obstacles (pixels)'
          },
          grid_resolution: {
            type: 'number',
            min: 5,
            optional: true,
            default: 64,
            description: 'Grid cell size for grid-based routing (pixels)'
          },

          // Path smoothing (flat format)
          smoothing_mode: {
            type: 'string',
            enum: ['none', 'chaikin'],
            optional: true,
            default: 'none',
            description: 'Path smoothing algorithm'
          },
          smoothing_iterations: {
            type: 'number',
            min: 1,
            max: 5,
            optional: true,
            default: 1,
            description: 'Number of smoothing iterations'
          },
          smoothing_max_points: {
            type: 'number',
            min: 1,
            optional: true,
            default: 160,
            description: 'Maximum points after smoothing'
          },

          // Path smoothing (nested format - alternate)
          smoothing: {
            type: 'object',
            optional: true,
            description: 'Nested smoothing configuration (alternate format)',
            properties: {
              mode: {
                type: 'string',
                enum: ['none', 'chaikin'],
                optional: true,
                default: 'none',
                description: 'Smoothing algorithm (same as smoothing_mode)'
              },
              iterations: {
                type: 'number',
                min: 1,
                max: 5,
                optional: true,
                default: 1,
                description: 'Number of iterations (same as smoothing_iterations)'
              },
              max_points: {
                type: 'number',
                min: 1,
                optional: true,
                default: 160,
                description: 'Max points (same as smoothing_max_points)'
              }
            }
          },

          // Smart routing
          smart_proximity: {
            type: 'number',
            min: 0,
            optional: true,
            default: 0,
            description: 'Proximity band for smart routing (pixels)'
          },
          smart_detour_span: {
            type: 'number',
            min: 1,
            optional: true,
            default: 48,
            description: 'Maximum detour distance for smart routing (pixels)'
          },
          smart_max_extra_bends: {
            type: 'number',
            min: 0,
            optional: true,
            default: 3,
            description: 'Maximum additional bends allowed by smart routing'
          },
          smart_min_improvement: {
            type: 'number',
            min: 0,
            optional: true,
            default: 4,
            description: 'Minimum cost improvement to accept detour (pixels)'
          },
          smart_max_detours_per_elbow: {
            type: 'number',
            min: 1,
            optional: true,
            default: 4,
            description: 'Maximum detour attempts per elbow'
          },

          // Channel configuration
          channel_force_penalty: {
            type: 'number',
            min: 0,
            optional: true,
            default: 800,
            description: 'Penalty for lines outside forced channels'
          },
          channel_avoid_multiplier: {
            type: 'number',
            min: 0,
            optional: true,
            default: 1.0,
            description: 'Multiplier for avoid channel penalties'
          },
          channel_target_coverage: {
            type: 'number',
            min: 0,
            max: 1,
            optional: true,
            default: 0.6,
            description: 'Target channel coverage for prefer mode (0-1)'
          },
          channel_shaping_max_attempts: {
            type: 'number',
            min: 1,
            optional: true,
            default: 12,
            description: 'Maximum attempts for channel shaping'
          },
          channel_shaping_span: {
            type: 'number',
            min: 1,
            optional: true,
            default: 32,
            description: 'Maximum shift distance during channel shaping (pixels)'
          },
          channel_min_coverage_gain: {
            type: 'number',
            min: 0,
            max: 1,
            optional: true,
            default: 0.04,
            description: 'Minimum coverage improvement to accept shaping (0-1)'
          },

          // Cost function weights
          cost_defaults: {
            type: 'object',
            optional: true,
            description: 'Cost function weights for routing algorithms',
            properties: {
              bend: {
                type: 'number',
                optional: true,
                default: 10,
                description: 'Cost weight for each bend/elbow in path'
              },
              proximity: {
                type: 'number',
                optional: true,
                default: 4,
                description: 'Cost weight for proximity to obstacles'
              }
            }
          }
        }
      },

      channels: {
        type: 'object',
        optional: true,
        description: 'Named routing channels for bundling/separating lines with optional forced routing',
        patternProperties: {
          '^[a-zA-Z0-9_-]+$': {
            type: 'object',
            required: ['bounds'],
            properties: {
              bounds: {
                type: 'array',
                minItems: 4,
                maxItems: 4,
                items: { type: 'number' },
                description: 'Channel rectangle [x, y, width, height]'
              },
              mode: {
                type: 'string',
                enum: ['prefer', 'avoid', 'force'],
                optional: true,
                default: 'prefer',
                description: 'Channel behavior: prefer=encourage bundling, avoid=stay away, force=must route through'
              },
              direction: {
                type: 'string',
                enum: ['horizontal', 'vertical', 'auto'],
                optional: true,
                default: 'auto',
                description: 'Flow direction through channel (auto = infer from shape: wide=horizontal, tall=vertical)'
              },
              weight: {
                type: 'number',
                min: 0,
                max: 1,
                optional: true,
                default: 0.5,
                description: 'Channel influence strength (0-1, higher = stronger pull/push)'
              },
              line_spacing: {
                type: 'number',
                min: 0,
                max: 100,
                optional: true,
                default: 8,
                description: 'Gap between bundled lines in viewBox units (for prefer/force modes)'
              },
              type: {
                type: 'string',
                enum: ['bundling', 'avoiding', 'waypoint'],
                optional: true,
                deprecated: true,
                description: 'DEPRECATED: Use mode instead (bundling→prefer, avoiding→avoid, waypoint→force)'
              }
            }
          }
        },
        'x-ui': {
          control: 'yaml',
          label: 'Routing Channels',
          helper: 'Define channels: channel_id: { bounds: [x,y,w,h], mode: prefer|avoid|force, direction: auto|horizontal|vertical }'
        }
      },

      debug: {
        type: 'object',
        optional: true,
        description: 'Debug configuration',
        properties: {
          enabled: {
            type: 'boolean',
            optional: true,
            description: 'Enable debug mode'
          },
          show_anchors: {
            type: 'boolean',
            optional: true,
            description: 'Show anchor points'
          },
          show_routing: {
            type: 'boolean',
            optional: true,
            description: 'Show routing grid'
          }
        }
      }

      // NOTE: 'theme' field removed - theme is now global via ThemeManager singleton
      // Per-card theme configuration is no longer supported
    },

    validators: [
      // Warn about deprecated fields at msd config level
      (config, context) => {
        if (config.use_packs) {
          return {
            valid: true,
            warnings: [{
              field: 'use_packs',
              type: 'deprecated_field',
              message: 'Field "use_packs" is deprecated (v1.22+). Packs loaded globally by PackManager.',
              severity: 'warning',
              suggestion: 'Remove "use_packs" from config'
            }]
          };
        }
        return { valid: true };
      },

      (config, context) => {
        if (config.version) {
          return {
            valid: true,
            warnings: [{
              field: 'version',
              type: 'deprecated_field',
              message: 'Field "version" is no longer required (v1.22+).',
              severity: 'warning',
              suggestion: 'Remove "version" from config'
            }]
          };
        }
        return { valid: true };
      },

      // Validate view_box requirement when base_svg.source is "none"
      (config, context) => {
        if (config.base_svg?.source === 'none' && (!config.view_box || config.view_box === 'auto')) {
          return {
            valid: false,
            errors: [{
              field: 'view_box',
              type: 'required_field',
              message: 'view_box must be explicitly specified when base_svg.source is "none"',
              severity: 'error',
              suggestion: 'Add view_box: [minX, minY, width, height]'
            }]
          };
        }
        return { valid: true };
      }
    ]
  };

  // Return the top-level card schema with nested msd configuration
  return {
    type: 'object',
    title: 'MSD Card',
    description: 'Master Systems Display card with overlays and routing',

    'x-ui': {
      category: 'advanced',
      icon: 'mdi:monitor-dashboard',
      documentation: 'doc/architecture/schemas/msd-schema-definition.md'
    },

    required: ['type', 'msd'],

    properties: {
      type: {
        type: 'string',
        enum: ['custom:lcards-msd', 'custom:lcards-msd-card', 'custom:cb-lcars-card'],
        description: 'Card type identifier',
        'x-ui': {
          control: 'select',
          label: 'Card Type'
        }
      },

      // ============================================================================
      // CORE METADATA PROPERTIES
      // ============================================================================

      id: {
        ...cardIdSchema,
        description: 'Custom card ID for rule targeting (optional - auto-generated if omitted)',
        'x-ui-hints': {
          label: 'Card ID',
          helper: 'Unique identifier for targeting with rules (auto-generated if not specified)',
          selector: {
            text: {
              placeholder: 'msd-main'
            }
          }
        }
      },

      tags: {
        ...tagsSchema,
        'x-ui-hints': {
          label: 'Tags',
          helper: 'Tags for grouping and targeting multiple cards with rules',
          selector: {
            select: {
              multiple: true,
              custom_value: true
            }
          },
          examples: ['dashboard-main', 'navigation', 'status']
        }
      },

      // ============================================================================
      // SIZING
      // ============================================================================

      height: cardHeightSchema,

      width: cardWidthSchema,

      msd: msdConfigSchema,

      // Root-level properties (shared across cards)
      data_sources: dataSourcesSchema,
      rules: rulesSchema
    },

    validators: [
      // Warn if msd.version is present (nested structure)
      (config, context) => {
        if (config.msd?.version) {
          return {
            valid: true,
            warnings: [{
              field: 'msd.version',
              type: 'deprecated_field',
              message: 'Field "msd.version" is no longer required (v1.22+).',
              severity: 'warning',
              suggestion: 'Remove "version" from msd configuration'
            }]
          };
        }
        return { valid: true };
      }
    ]
  };
}

export default getMsdSchema;
