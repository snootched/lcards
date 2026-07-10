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
    cardWidthSchema,
    cardMinHeightSchema,
    cardMinWidthSchema,
    cardMaxHeightSchema,
    cardMaxWidthSchema,
    cardOverflowSchema,
    cardOverflowXSchema,
    cardOverflowYSchema,
    cardZIndexSchema,
    backgroundAnimationSchema,
    entitySchema,
    stateColorSchema,
    animationSchema,
} from './common-schemas.js';

/**
 * Get complete MSD card schema
 * @returns {Object} Complete MSD schema
 */
export function getMsdSchema() {
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

          filters: {
            type: 'array',
            optional: true,
            description: 'Stackable CSS/SVG filters applied in sequence',
            items: filterSchema,
            'x-ui': {
              control: 'filter-editor',
              label: 'Filters'
            }
          },

          render_visual: {
            type: 'boolean',
            optional: true,
            default: true,
            description: 'Whether the base SVG is painted as the visible background. Set false to use background_animation (e.g. a static image or animated layers) as the visual background instead, while the SVG is still parsed for anchors as normal.'
          },

          animations: {
            type: 'array',
            optional: true,
            description: 'Animations targeting elements inside the base SVG (by id/class, same target syntax as overlay animations)',
            items: animationSchema,
            'x-ui': {
              control: 'animation-editor',
              label: 'Base SVG Animations'
            }
          }
        }
      },

      background_animation: backgroundAnimationSchema,

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
            id: {
              type: 'string',
              description: 'Unique identifier for this overlay'
            },
            type: {
              type: 'string',
              enum: ['line', 'control'],
              errorMessage: 'Only "line" and "control" overlay types supported. Use LCARdS cards for buttons/charts.'
            },
            entity: {
              ...entitySchema,
              optional: true,
              description: 'Line overlays: entity to bind style.color to (state-color object) — see style.color. Not used by control overlays, which already have their own entity via the embedded card.'
            },
            state_attribute: {
              type: 'string',
              optional: true,
              description: 'Line overlays: attribute whose string value is matched against style.color state keys instead of the raw entity state (e.g. "fade", "true") — mirrors the button card\'s state_attribute, scoped per-line'
            },
            ranges_attribute: {
              type: 'string',
              optional: true,
              description: 'Line overlays: attribute value compared against above:/below:/between: keys in style.color — mirrors the button card\'s ranges_attribute, scoped per-line'
            },
            style: {
              type: 'object',
              optional: true,
              description: 'Line overlay styling (color, width, opacity, markers, etc.)',
              properties: {
                color: {
                  ...stateColorSchema,
                  description: 'Line stroke color: a literal/token/CSS value, or a state-color object resolved against `entity` (same state-color pipeline as buttons/sliders — requires `entity` to be set)'
                }
              }
            },
            // Shared positioning (control overlays use position; line overlays use anchor + attach_to)
            position: {
              type: ['string', 'array'],
              optional: true,
              description: 'Control overlay position: named anchor (e.g. "hub") or absolute coordinates [x, y]. The anchor is the center of the card by default.'
            },
            size: {
              type: 'array',
              optional: true,
              description: 'Control overlay size [width, height] in SVG coordinates'
            },
            attachment: {
              type: 'string',
              enum: ['center', 'top-left', 'top-right', 'bottom-left', 'bottom-right', 'top', 'bottom', 'left', 'right'],
              optional: true,
              default: 'center',
              description: 'Which point of the control card aligns with the anchor position. Default: center'
            },
            position_side: {
              type: 'string',
              enum: ['center', 'top-left', 'top-right', 'bottom-left', 'bottom-right', 'top', 'bottom', 'left', 'right'],
              optional: true,
              default: 'center',
              description: 'Control overlays only: when position references another control\'s id, which point of that target control to align to (instead of its center). Ignored for named-anchor or coordinate positions.'
            },
            card: {
              type: 'object',
              optional: true,
              description: 'HA card config embedded in this control overlay'
            },
            triggers_update: {
              oneOf: [
                {
                  type: 'array',
                  items: { type: 'string' },
                  description: 'Extra entity IDs (or MSD data-source refs) this overlay depends on, beyond what static analysis of `card` can detect. HA entity IDs are folded into a control overlay\'s HASS change-detection set; non-entity refs are subscribed as MSD data-source updates (existing behavior, any overlay type).'
                },
                {
                  type: 'string',
                  enum: ['all'],
                  description: 'Control overlays only: this control receives every HASS update unconditionally, bypassing the per-control entity-diff optimization. Use when the embedded card\'s entity dependencies genuinely can\'t be enumerated (e.g. wildcard/device-class auto-discovery alert cards). Prefer the array form when possible.'
                }
              ],
              optional: true,
              'x-ui': {
                control: 'yaml',
                label: 'Triggers Update',
                helper: 'Array of entity IDs, or "all" for control overlays — declares extra HASS dependencies static analysis can\'t detect'
              }
            },
            z_index: {
              type: 'number',
              optional: true,
              description: 'Stacking order for overlapping overlays'
            },
            // Line overlay anchor/endpoint fields
            anchor: {
              type: ['string', 'array'],
              optional: true,
              description: 'Line overlays: start-point anchor name or [x,y]. Control overlays: deprecated alias for position — use position instead.'
            },
            anchor_side: {
              type: 'string',
              optional: true,
              description: 'Line overlays: which side of the anchor overlay the line departs from (top, bottom, left, right, center)'
            },
            anchor_gap: {
              type: 'number',
              optional: true,
              default: 0,
              description: 'Line overlays: gap in SVG units between line endpoint and anchor edge'
            },
            attach_to: {
              type: ['string', 'array'],
              optional: true,
              description: 'Line overlays: destination anchor name, overlay ID, or [x, y]'
            },
            attach_side: {
              type: 'string',
              optional: true,
              description: 'Line overlays: which side of the attach_to overlay the line arrives at (top, bottom, left, right, center)'
            },
            attach_gap: {
              type: 'number',
              optional: true,
              default: 0,
              description: 'Line overlays: gap in SVG units between line endpoint and attach_to edge'
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
              default: 'round',
              description: 'How line corners are rendered'
            },
            corner_radius: {
              type: 'number',
              min: 0,
              optional: true,
              default: 34,
              description: 'Corner cut size in pixels — arc radius for round corners, or diagonal chamfer size for bevel corners'
            },
            corner_angle: {
              type: 'number',
              min: 0,
              max: 90,
              optional: true,
              default: 45,
              description: 'Bevel corners only: angle of the diagonal cut in degrees (0=cut flush with incoming edge, 90=flush with outgoing edge, 45=symmetric diagonal), matching the elbow card\'s diagonal-cap angle'
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
      },

      triggers_update: {
        type: 'string',
        enum: ['all'],
        optional: true,
        description: 'Card-wide escape hatch: every control overlay receives every HASS update unconditionally, bypassing the per-control entity-diff optimization for the whole card. Discouraged — prefer the per-overlay control `triggers_update: all` scoped to just the problem control.',
        'x-ui': {
          control: 'select',
          label: 'Update All Controls (discouraged)',
          helper: 'Bypasses per-control HASS optimization for the entire card. Prefer per-overlay triggers_update: all instead.'
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

      min_height: cardMinHeightSchema,

      min_width: cardMinWidthSchema,

      max_height: cardMaxHeightSchema,

      max_width: cardMaxWidthSchema,

      overflow:   cardOverflowSchema,
      overflow_x: cardOverflowXSchema,
      overflow_y: cardOverflowYSchema,
      z_index:    cardZIndexSchema,

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
