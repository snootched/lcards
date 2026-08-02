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
            description: 'SVG source: builtin:key, /local/path.svg, a media-source://… content ID (picked via the HA media library), or "none"',
            examples: ['builtin:ncc-1701-a-blue', '/local/my-ship.svg', 'media-source://media_source/local/my-ship.svg', 'none'],
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

          harvest_landmarks: {
            type: 'boolean',
            optional: true,
            default: true,
            description: 'Compute geometric landmark anchors (hull_center, extremity_bow/stern/top/bottom, lateral_a/b) from the base SVG silhouette.'
          },

          harvest_svg_elements: {
            type: 'boolean',
            optional: true,
            default: true,
            description: 'Harvest anchors from named <circle>/<ellipse>/<text>/<rect>/<g> elements embedded in the base SVG.'
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
              enum: ['line', 'control', 'shape'],
              errorMessage: 'Only "line", "control", and "shape" overlay types supported. Use LCARdS cards for buttons/charts.'
            },
            kind: {
              type: 'string',
              enum: ['polyline', 'rect', 'circle'],
              optional: true,
              description: 'Shape overlays only: geometry primitive. polyline uses `points` (+ optional `closed`); rect/circle use `position` + `size` like control overlays.'
            },
            points: {
              type: 'array',
              optional: true,
              description: 'Shape overlays (kind: polyline) only: ordered vertex list. Each entry is either [x, y] in viewBox units or a static anchor-name string. Minimum 2 points.',
              items: {
                oneOf: [
                  { type: 'array', minItems: 2, maxItems: 2, items: { type: 'number' } },
                  { type: 'string' }
                ]
              }
            },
            closed: {
              type: 'boolean',
              optional: true,
              default: false,
              description: 'Shape overlays (kind: polyline) only: close the path back to its first point and allow `style.fill`.'
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
              description: 'Line/shape overlay styling (color, width, opacity, dash pattern, markers, gradient/pattern fill, etc.)',
              properties: {
                color: {
                  ...stateColorSchema,
                  description: 'Stroke color: a literal/token/CSS value, or a state-color object resolved against `entity` (same state-color pipeline as buttons/sliders — requires `entity` to be set)'
                },
                width: {
                  type: 'number',
                  optional: true,
                  default: 2,
                  description: 'Stroke width in viewBox units (alias: stroke_width)'
                },
                opacity: {
                  type: 'number',
                  min: 0,
                  max: 1,
                  optional: true,
                  default: 1,
                  description: 'Stroke opacity'
                },
                line_cap: {
                  type: 'string',
                  enum: ['butt', 'round', 'square'],
                  optional: true,
                  default: 'butt',
                  description: 'Stroke line cap style. No effect on closed shapes (rect/circle/closed polyline).'
                },
                line_join: {
                  type: 'string',
                  enum: ['miter', 'round', 'bevel'],
                  optional: true,
                  description: 'Stroke line join style at path vertices. Meaningful for polyline and rect; no effect on circle/ellipse.'
                },
                miter_limit: {
                  type: 'number',
                  optional: true,
                  default: 4,
                  description: 'Miter limit, used when line_join is "miter"'
                },
                dash_array: {
                  type: ['string', 'array'],
                  optional: true,
                  description: 'Dash pattern, e.g. "5,5" or [5, 5]'
                },
                dash_offset: {
                  type: 'number',
                  optional: true,
                  default: 0,
                  description: 'Dash pattern offset'
                },
                fill: {
                  ...stateColorSchema,
                  description: 'Fill color: a literal/token/CSS value, or a state-color object resolved against `entity` (same state-color pipeline as `color`). Only visible on closed shapes (rect, circle, closed polyline).'
                },
                fill_opacity: {
                  type: 'number',
                  min: 0,
                  max: 1,
                  optional: true,
                  default: 1,
                  description: 'Fill opacity'
                },
                gradient: {
                  type: 'object',
                  optional: true,
                  description: 'Gradient fill/stroke configuration (linear or radial)'
                },
                pattern: {
                  type: 'object',
                  optional: true,
                  description: 'Pattern fill configuration (dots, lines, diagonal, grid, or custom SVG content)'
                },
                marker_start: {
                  type: ['string', 'object'],
                  optional: true,
                  description: 'Marker (arrowhead/dot/etc.) at the path start. Polyline shapes only — meaningless for rect/circle.'
                },
                marker_mid: {
                  type: ['string', 'object'],
                  optional: true,
                  description: 'Marker at each interior path vertex. Polyline shapes only — meaningless for rect/circle.'
                },
                marker_end: {
                  type: ['string', 'object'],
                  optional: true,
                  description: 'Marker at the path end. Polyline shapes only — meaningless for rect/circle.'
                },
                animatable: {
                  type: 'boolean',
                  optional: true,
                  default: true,
                  description: 'Whether this overlay is eligible as an anime.js animation target'
                }
              }
            },
            // Shared positioning (control overlays use position; line overlays use anchor + attach_to)
            position: {
              type: ['string', 'array'],
              optional: true,
              description: 'Control overlay, or shape overlay (kind: rect/circle): named anchor (e.g. "hub") or absolute coordinates [x, y]. The anchor is the center of the card/shape by default.'
            },
            size: {
              type: 'array',
              optional: true,
              description: 'Control overlay, or shape overlay (kind: rect/circle) size [width, height] in SVG coordinates. For kind: circle, an ellipse is drawn with rx=width/2, ry=height/2 (use equal width/height for a perfect circle).'
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
            locked: {
              type: 'boolean',
              optional: true,
              default: false,
              description: 'Control/shape overlays only: when true, MSD Studio\'s editor canvas disables drag/resize/vertex-editing for this overlay (Edit/Duplicate/Delete in the list panel remain available). Editor-only — has no effect on runtime rendering or line overlays.'
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
              description: 'Routing algorithm. auto (recommended): always full pathfinding — obstacle avoidance, trunk bundling, crossing avoidance — regardless of whether obstacles/channels are present. direct: straight line, no pathfinding. manual: explicit waypoints. Escape hatches for the cheap/non-participating alternative: manhattan (fixed 2-elbow shape, no pathfinding, no bundling, no crossing avoidance) or grid (pathfinding + bundling/crossing avoidance, without the extra local-search refinement pass smart adds). smart is what auto resolves to.'
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
              description: 'Minimum clearance around obstacles in viewBox units (overrides global default)'
            },
            corner_style: {
              type: 'string',
              enum: ['miter', 'round', 'bevel'],
              optional: true,
              default: 'round',
              description: 'Line overlays, or shape overlays (kind: polyline): how corners are rendered. For shape kind: rect, maps to rx/ry (round only); no effect on circle/ellipse.'
            },
            corner_radius: {
              type: 'number',
              min: 0,
              optional: true,
              default: 34,
              description: 'Line overlays, or shape overlays (kind: polyline): corner cut size in viewBox units — arc radius for round corners, or diagonal chamfer size for bevel corners. For shape kind: rect, sets rx/ry directly.'
            },
            corner_radius_mode: {
              type: 'string',
              enum: ['auto', 'forced'],
              optional: true,
              default: 'auto',
              description: 'Line overlays only (routing behavior, not shape overlay rendering): whether corner_radius is a target or a hard requirement for round/bevel corners. auto (default): corner size may shrink so the router stays free to avoid forcing a detour or an unnecessary line crossing near tight geometry. forced: always reserves room for the full configured radius, matching pre-2026.07 behavior — can force routing detours or crossings.'
            },
            corner_room_weight: {
              type: 'number',
              min: 0,
              optional: true,
              description: 'Line overlays only, round/bevel corner_style: how strongly the smart-routing refinement pass tries to recover this line\'s full corner_radius when a tight detour would otherwise shrink it. On by default (card-wide default in routing.corner_room_weight) — a route that leaves more room for the configured corner is preferred over the plain-cheapest route, when the difference is small. Set to 0 on a line to opt it out.'
            },
            corner_angle: {
              type: 'number',
              min: 0,
              max: 90,
              optional: true,
              default: 45,
              description: 'Bevel corners only (line overlays, or shape overlays of kind: polyline): angle of the diagonal cut in degrees (0=cut flush with incoming edge, 90=flush with outgoing edge, 45=symmetric diagonal), matching the elbow card\'s diagonal-cap angle'
            },
            stub_length: {
              type: 'number',
              min: 0,
              optional: true,
              description: 'Line overlays only: overrides the mandatory cardinal stub length (viewBox units) departing/arriving anchor_side or attach_side, instead of the router\'s own auto-computed floor (which scales with grid_resolution and can force a longer straight lead-out than a specific line\'s own geometry needs). Leave unset for the default. Going below one grid cell risks re-triggering an internal same-cell short-circuit — use window.lcards.debug.msd.routing.inspect(id).meta.debug to see the router\'s own resolved value first.'
            },
            smoothing_mode: {
              type: 'string',
              enum: ['none', 'chaikin'],
              optional: true,
              default: 'none',
              description: 'Line overlays, or shape overlays (kind: polyline) only: path smoothing algorithm'
            },
            smoothing_iterations: {
              type: 'number',
              min: 0,
              max: 5,
              optional: true,
              default: 0,
              description: 'Line overlays, or shape overlays (kind: polyline) only: number of smoothing iterations to apply'
            }
          }
        },
        'x-ui': {
          control: 'array',
          label: 'Overlays',
          addLabel: 'Add Overlay'
        }
      },

      animations: {
        type: 'array',
        optional: true,
        description: 'Animations that bulk-target overlays in the shared overlay group by CSS selector (data-overlay-id, class, etc.) — e.g. animate every overlay whose id starts with "shield_" with one declaration, instead of repeating the animation on each overlay. Same target/targets selector syntax as base_svg.animations and per-overlay animations; matches shape, line, and control overlays uniformly.',
        items: animationSchema,
        'x-ui': {
          control: 'animation-editor',
          label: 'Overlay Group Animations'
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
            default: 'auto',
            description: 'Card-wide override for every line whose own route is unset/auto (per-line route: still wins). auto (default): full pathfinding — obstacle avoidance, trunk bundling, crossing avoidance (this is what an unset line gets). manhattan/grid: force the whole card to the cheap/non-participating or no-refinement alternative instead. smart: same as auto, spelled out explicitly.',
            'x-ui': {
              control: 'select',
              label: 'Default Routing Mode',
              helper: 'Global routing strategy applied to every line that leaves route unset — per-line route: always overrides this'
            }
          },

          // Basic routing
          clearance: {
            type: 'number',
            min: 0,
            optional: true,
            default: 0,
            description: 'Minimum clearance around obstacles (viewBox units)'
          },
          grid_resolution: {
            type: 'number',
            min: 5,
            optional: true,
            default: 64,
            description: 'Grid cell size for grid-based routing (viewBox units; values below 5 are coerced to 32). Unset by default — auto-scales from view_box size instead of a fixed number (~1/12th of the shorter dimension, clamped to [16, 64]; 64 shown here is that ceiling, not a fixed default)'
          },
          min_stub_length_factor: {
            type: 'number',
            min: 0,
            optional: true,
            default: 1,
            description: 'Multiplier on the resolved grid_resolution for the minimum mandatory lead-out/lead-in stub every line reserves before routing runs. 1 (default) reproduces the router\'s own "at least one grid cell" floor; raise it to reserve more room for large corner_radius values, lower it (e.g. on a small view_box, where a flat floor would otherwise be disproportionately long) to let lines turn sooner'
          },
          turn_penalty: {
            type: 'number',
            min: 0,
            optional: true,
            default: 2,
            description: 'A* cost for changing direction — higher values produce straighter paths with fewer turns'
          },
          route_hint_penalty: {
            type: 'number',
            min: 0,
            optional: true,
            default: 6,
            description: 'A* cost for a first/last move that disagrees with route_hint/route_hint_last (soft, so obstacles still win)'
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
            description: 'Proximity band for smart routing (viewBox units)'
          },
          smart_detour_span: {
            type: 'number',
            min: 1,
            optional: true,
            default: 48,
            description: 'Maximum detour distance for smart routing (viewBox units)'
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
            description: 'Minimum cost improvement to accept detour (viewBox units)'
          },
          smart_max_detours_per_elbow: {
            type: 'number',
            min: 1,
            optional: true,
            default: 4,
            description: 'Maximum detour attempts per elbow'
          },
          corner_room_weight: {
            type: 'number',
            min: 0,
            optional: true,
            default: 4,
            description: 'Card-wide default strength for recovering a line\'s full corner_radius near tight detours (see the per-line field of the same name for the full explanation). On by default — the LCARS rounded-corner look is the intended out-of-the-box result. Set to 0 to disable card-wide; individual lines can still opt back in via their own corner_room_weight.'
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
          channel_prefer_bias: {
            type: 'number',
            min: 0,
            optional: true,
            default: 0.9,
            description: 'Per-cell A* discount for traveling along a prefer channel\'s own direction (scaled by channel weight)'
          },
          channel_avoid_bias: {
            type: 'number',
            min: 0,
            optional: true,
            default: 3,
            description: 'Per-cell A* penalty for entering an avoid channel (scaled by channel weight and channel_avoid_multiplier)'
          },

          // Trunk-and-branch (spontaneous line bundling)
          trunk_bundling_enabled: {
            type: 'boolean',
            optional: true,
            default: true,
            description: 'Lines whose paths run close and parallel spontaneously bundle together and branch apart where needed'
          },
          trunk_proximity: {
            type: 'number',
            min: 0,
            optional: true,
            default: 32,
            description: 'Maximum distance to a trunk lane to be considered "nearby" (viewBox units)'
          },
          trunk_min_overlap: {
            type: 'number',
            min: 0,
            optional: true,
            default: 60,
            description: 'Minimum shared travel distance for joining a trunk to be worthwhile (viewBox units)'
          },
          trunk_min_length: {
            type: 'number',
            min: 0,
            optional: true,
            default: 60,
            description: 'Minimum straight-run length to register as a new joinable trunk (viewBox units)'
          },
          trunk_max_join_candidates: {
            type: 'number',
            min: 1,
            optional: true,
            default: 2,
            description: 'Maximum number of discovered trunks a single line will try to chain through'
          },
          trunk_bundle_weight: {
            type: 'number',
            min: 0,
            optional: true,
            default: 0.5,
            description: 'Reward strength for joining a discovered trunk (same role as a channel\'s weight)'
          },
          trunk_line_spacing: {
            type: 'number',
            min: 0,
            optional: true,
            default: 8,
            description: 'Default lane spacing for lines bundled on a discovered trunk (viewBox units)'
          },
          trunk_discovery_max_passes: {
            type: 'number',
            min: 1,
            optional: true,
            default: 4,
            description: 'Cap on discovery passes before rendering, so every line\'s trunk/crossing data is known regardless of YAML order (safety limit against rare oscillation)'
          },

          // Crossing avoidance (lines shouldn't cross each other unless necessary)
          crossing_avoid_enabled: {
            type: 'boolean',
            optional: true,
            default: true,
            description: 'Penalize a line\'s path for cutting orthogonally across another already-routed line\'s segment'
          },
          crossing_avoid_bias: {
            type: 'number',
            min: 0,
            optional: true,
            default: 4,
            description: 'Per-cell penalty for crossing another line\'s segment — a deterrent, not a hard block'
          },
          crossing_min_length: {
            type: 'number',
            min: 0,
            optional: true,
            default: 12,
            description: 'Minimum straight-run length to register as avoidable (viewBox units) — smaller than trunk_min_length so short stub legs are still avoidable'
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
              discoverable: {
                type: 'boolean',
                optional: true,
                default: true,
                description: 'Whether nearby lines that do NOT list this channel in their own route_channels may still spontaneously bundle into it. Default true matches automatic zero-config bundling; set false to scope this channel to only the lines that explicitly reference it via route_channels.'
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
          helper: 'Define channels: channel_id: { bounds: [x,y,w,h], mode: prefer|avoid|force, direction: auto|horizontal|vertical, discoverable: true|false }'
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
