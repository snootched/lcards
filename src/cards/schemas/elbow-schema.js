/**
 * Elbow Card Schema - Unified
 *
 * Complete schema for elbow card validation.
 * Uses shared schema components from common-schemas.js for consistency.
 *
 * Elbow cards extend button cards with LCARS elbow/corner treatments.
 * They inherit all button functionality (text, actions, etc.) plus elbow-specific geometry.
 *
 * This schema is ONLY for validation, not UI generation.
 * Editor UI is defined separately in lcards-elbow-editor.js config.
 */

import { dataSourcesSchema, actionSchema, animationSchema, filterSchema, stateColorSchema, paddingSchema, getTextSchema, gridOptionsSchema, entitySchema, cardIdSchema, tagsSchema, backgroundAnimationSchema, soundsSchema, cardHeightSchema, cardWidthSchema, cardMinHeightSchema, cardMinWidthSchema, cardMaxHeightSchema, cardMaxWidthSchema, cardOverflowSchema, cardOverflowXSchema, cardOverflowYSchema, cardZIndexSchema, triggersUpdateSchema, stateClassificationSchema } from './common-schemas.js';
import { getElbowTypeNames } from '../../core/packs/components/elbows/index.js';

/**
 * Get complete elbow card schema
 * @param {Object} [options] - Schema options
 * @param {Array<string>} [options.availablePresets] - Available preset names (inherits from button)
 * @param {Array<string>} [options.positionEnum] - Available text positions
 * @returns {Object} Complete elbow schema
 */
export function getElbowSchema(options = {}) {
    const {
        availablePresets = [],
        positionEnum = []
    } = options;

    // Get available elbow types from component registry
    const availableElbowTypes = getElbowTypeNames();

    // Action, animation, and filter schemas imported from common-schemas.js

    // ============================================================================
    // MAIN SCHEMA
    // ============================================================================

    return {
        $schema: 'http://json-schema.org/draft-07/schema#',
        $id: 'https://github.com/snootched/lcards/schemas/elbow-schema',
        title: 'LCARdS Elbow Card Configuration',
        description: 'Complete configuration schema for lcards-elbow custom card with LCARS corner treatments. Supports dynamic theme integration via HA-LCARS input_number helpers (input_number.lcars_horizontal, input_number.lcars_vertical).',
        type: 'object',
        required: ['type'],
        examples: [
            {
                type: 'custom:lcards-elbow',
                elbow: {
                    type: 'header-left',
                    style: 'simple',
                    segment: {
                        bar_width: 'theme',
                        bar_height: 'theme',
                        outer_curve: 'auto',
                        color: { default: '#FF9900' }
                    }
                },
                text: {
                    name: {
                        show: true,
                        value: 'Navigation'
                    }
                }
            },
            {
                type: 'custom:lcards-elbow',
                elbow: {
                    type: 'footer-right',
                    style: 'simple',
                    segment: {
                        bar_width: 120,
                        bar_height: 30,
                        outer_curve: 60,
                        inner_curve: 30
                    }
                }
            }
        ],
        properties: {
            // ============================================================================
            // HOME ASSISTANT REQUIRED PROPERTIES
            // ============================================================================

            type: {
                type: 'string',
                const: 'custom:lcards-elbow',
                description: 'Home Assistant card type identifier (required)'
            },

            // ============================================================================
            // CORE PROPERTIES (inherited from button)
            // ============================================================================

            entity: entitySchema,

            ranges_attribute: {
                type: 'string',
                description: 'Entity attribute to use as the numeric value for all range conditions (above:/below:/between: keys) in any state-based style config. Use "brightness_pct" for a computed 0–100 light brightness value. Defaults to evaluating the raw entity state string.',
                examples: ['brightness_pct', 'brightness', 'temperature', 'percentage', 'current_position'],
                'x-ui-hints': {
                    label: 'Range Attribute',
                    helper: 'Attribute to compare against range thresholds (above:/below:/between:). Use "brightness_pct" for lights. Leave blank to use entity state.'
                }
            },

            state_attribute: {
                type: 'string',
                description: 'Entity attribute whose String() value is used as the highest-priority key for ALL exact-match state-color lookups across the card. Booleans become "true"/"false"; null becomes "null"; strings are used as-is. Classified state (active/inactive) is always derived from entity.state and is unaffected. Can be used alongside ranges_attribute.',
                examples: ['effect', 'hvac_action', 'charging', 'preset_mode', 'color_mode'],
                'x-ui-hints': {
                    label: 'State Attribute',
                    helper: 'Attribute whose value is matched against color-config keys. Write YAML keys as strings (e.g. "fade", "true", "null"). Leave blank to match entity state directly.'
                }
            },

            interactive: {
                type: 'boolean',
                default: true,
                description: 'When false, hover colour changes and hover animations are suppressed. The cursor defaults to the arrow unless overridden via style.cursor. Tap/hold actions still fire if configured.',
                'x-ui-hints': {
                    label: 'Show hover effects',
                    helper: 'Disable to suppress colour change and hover animations on mouse-over. Does not affect tap/hold actions.'
                }
            },

            state_classification: stateClassificationSchema,

            id: cardIdSchema,

            tags: tagsSchema,

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


            preset: {
                type: 'string',
                enum: availablePresets,
                description: 'Style preset name (inherits from button presets)',
                examples: ['lozenge', 'bullet', 'outline', 'pill']
            },

            // ============================================================================
            // ELBOW CONFIGURATION (elbow-specific)
            // ============================================================================

            elbow: {
                type: 'object',
                required: ['type'],
                description: 'Elbow geometry and styling configuration',
                properties: {
                    type: {
                        type: 'string',
                        enum: availableElbowTypes,  // Dynamically generated from component registry
                        description: 'Position of the elbow corner on the card',
                        enumDescriptions: [
                            'Top-left corner: vertical bar on left, horizontal bar on top',
                            'Top-right corner: vertical bar on right, horizontal bar on top',
                            'Bottom-left corner: vertical bar on left, horizontal bar on bottom',
                            'Bottom-right corner: vertical bar on right, horizontal bar on bottom'
                        ],
                        examples: ['header-left', 'footer-right']
                    },

                    style: {
                        type: 'string',
                        enum: ['simple', 'segmented'],
                        default: 'simple',
                        description: 'Elbow rendering style',
                        enumDescriptions: [
                            'Simple: Single elbow with one curved corner',
                            'Segmented: Double concentric elbows with gap (TNG Picard aesthetic)'
                        ],
                        examples: ['simple', 'segmented']
                    },

                    // ===== SIMPLE STYLE CONFIGURATION =====
                    segment: {
                        type: 'object',
                        description: 'Configuration for simple style (single elbow)',
                        default: {
                            bar_width: 120,
                            bar_height: 20,
                            outer_curve: 'auto'
                        },
                        examples: [
                            {
                                bar_width: 90,
                                bar_height: 20,
                                outer_curve: 'auto',
                                color: {
                                    default: '#888888',
                                    active: '#FF9900',
                                    inactive: '#444444'
                                }
                            },
                            {
                                bar_width: 150,
                                bar_height: 150,
                                outer_curve: 75,
                                inner_curve: 37.5
                            }
                        ],
                        properties: {
                            bar_width: {
                                oneOf: [
                                    {
                                        type: 'number',
                                        minimum: 10,
                                        maximum: 500,
                                        default: 90,
                                        description: 'Width of vertical sidebar (pixels)',
                                        examples: [90, 120, 150]
                                    },
                                    {
                                        type: 'string',
                                        description: "Use 'theme' to bind to input_number.lcars_vertical, or a CSS length expression (e.g. 'clamp(60px, 8vw, 120px)')",
                                        examples: ['theme', 'clamp(60px, 8vw, 120px)']
                                    }
                                ],
                                default: 90,
                                description: 'Width of vertical sidebar. Use number for static value or "theme" for dynamic binding to HA-LCARS input_number.lcars_vertical',
                                examples: [90, 120, 150, 'theme'],
                                'x-ui-hints': {
                                    label: 'Bar Width',
                                    helper: 'Vertical bar thickness (pixels or theme binding)',
                                    selector: {
                                        choose: {
                                            choices: {
                                                pixels: {
                                                    selector: {
                                                        number: {
                                                            mode: 'slider',
                                                            min: 10,
                                                            max: 500,
                                                            step: 5,
                                                            slider_ticks: false,
                                                            unit_of_measurement: 'px'
                                                        }
                                                    }
                                                },
                                                theme: {
                                                    selector: {
                                                        select: {
                                                            options: [
                                                                {
                                                                    value: 'theme',
                                                                    label: 'Bind to input_number.lcars_vertical'
                                                                }
                                                            ]
                                                        }
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            },
                            bar_height: {
                                oneOf: [
                                    {
                                        type: 'number',
                                        minimum: 10,
                                        maximum: 500,
                                        default: 20,
                                        description: 'Height of horizontal bar (pixels)',
                                        examples: [20, 30, 90]
                                    },
                                    {
                                        type: 'string',
                                        description: "Use 'theme' to bind to input_number.lcars_horizontal, or a CSS length expression (e.g. 'clamp(20px, 4vh, 60px)')",
                                        examples: ['theme', 'clamp(20px, 4vh, 60px)']
                                    }
                                ],
                                description: 'Height of horizontal bar. Use number for static value or "theme" for dynamic binding to HA-LCARS input_number.lcars_horizontal. Defaults to bar_width if not specified.',
                                examples: [20, 30, 90, 'theme'],
                                'x-ui-hints': {
                                    label: 'Bar Height',
                                    helper: 'Horizontal bar thickness (pixels or theme binding)',
                                    selector: {
                                        choose: {
                                            choices: {
                                                pixels: {
                                                    selector: {
                                                        number: {
                                                            mode: 'slider',
                                                            min: 10,
                                                            max: 500,
                                                            step: 5,
                                                            slider_ticks: false,
                                                            unit_of_measurement: 'px'
                                                        }
                                                    }
                                                },
                                                theme: {
                                                    selector: {
                                                        select: {
                                                            options: [
                                                                {
                                                                    value: 'theme',
                                                                    label: 'Bind to input_number.lcars_horizontal'
                                                                }
                                                            ]
                                                        }
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            },
                            outer_curve: {
                                oneOf: [
                                    {
                                        type: 'number',
                                        minimum: 0,
                                        maximum: 500,
                                        description: 'Outer corner radius in pixels',
                                        examples: [45, 75, 100]
                                    },
                                    {
                                        type: 'string',
                                        description: "Keyword or CSS expression. Keywords: 'auto'/'arm_width' = bar_width/2, 'arm_height' = bar_height/2, 'arm_max' = max(bar_width,bar_height)/2 (recommended), 'arm_min' = min(bar_width,bar_height)/2, 'arm_fill' = max(bar_width,bar_height). CSS: e.g. 'clamp(30px, 4vw, 60px)'",
                                        examples: ['auto', 'arm_width', 'arm_height', 'arm_max', 'arm_min', 'arm_fill', 'clamp(30px, 4vw, 60px)']
                                    }
                                ],
                                default: 'auto',
                                description: "Outer corner radius. Keywords: 'auto'/'arm_width' = bar_width/2 (LCARS classic), 'arm_height' = bar_height/2, 'arm_max' = max(bar_width,bar_height)/2 (recommended for paired elbows — same as auto for typical configs), 'arm_min' = min(bar_width,bar_height)/2, 'arm_fill' = max(bar_width,bar_height) (fills dominant arm). Or set explicit pixels.",
                                $comment: 'Arc tangent points always arrive at 0° to their edges. Render-time clamp: outerRadius ≤ min(card_w, card_h) keeps tangent points within card viewport. Use arm_max for consistent paired elbows — equals auto (bar_width/2) when bar_width >= bar_height.',
                                'x-ui-hints': {
                                    label: 'Outer Curve',
                                    helper: 'Arc radius mode — arm_max recommended for consistent paired elbows',
                                    defaultOneOfBranch: 0,
                                    selector: {
                                        number: {
                                            mode: 'slider',
                                            step: 1,
                                            unit_of_measurement: 'px'
                                        }
                                    }
                                }
                            },
                            inner_curve: {
                                oneOf: [
                                    {
                                        type: 'number',
                                        minimum: 0,
                                        maximum: 500,
                                        description: 'Inner corner radius in pixels',
                                        examples: [22.5, 37.5, 50]
                                    },
                                    {
                                        type: 'string',
                                        description: "Keyword or CSS expression. Keywords: 'auto' = outer_curve/2 (LCARS formula), 'arm_width' = bar_width/2, 'arm_height' = bar_height/2, 'arm_max' = max(w,h)/2, 'arm_min' = min(w,h)/2, 'arm_fill' = max(w,h). CSS: e.g. 'clamp(10px, 2vw, 30px)'",
                                        examples: ['auto', 'arm_max', 'arm_height', 'arm_min', 'clamp(10px, 2vw, 30px)']
                                    }
                                ],
                                $comment: 'LCARS formula default: inner_curve = outer_curve / 2. Keywords use the same bar dimension formulas as outer_curve, independently of the outer value.',
                                'x-ui-hints': {
                                    label: 'Inner Curve',
                                    helper: 'Inner arc radius — auto = outer_curve / 2 (LCARS formula)',
                                    selector: {
                                        number: {
                                            mode: 'slider',
                                            step: 0.5,
                                            unit_of_measurement: 'px'
                                        }
                                    }
                                }
                            },
                            outer_curve_clamp: {
                                oneOf: [
                                    {
                                        type: 'string',
                                        enum: ['card', 'none'],
                                        description: "'card' (default) clamps outer_curve to min(card_w, card_h) — keeps arc within viewport. 'none' disables clamping — arc is exactly the computed value; SVG overflow:hidden clips any overflow. Use 'none' for consistent paired elbows regardless of card height."
                                    },
                                    {
                                        type: 'number',
                                        minimum: 0,
                                        maximum: 500,
                                        description: 'Explicit px ceiling for outer radius — hard cap independent of card or arm dimensions'
                                    }
                                ],
                                default: 'card',
                                $comment: "Issue #361: two same-config elbows in differently-sized cards get different radii because 'card' clamp uses the card height. Set 'none' to decouple radius from card height.",
                                'x-ui-hints': {
                                    label: 'Curve Clamp',
                                    helper: "card = clamp to viewport (default), none = no clamp (use for paired elbows)"
                                }
                            },
                            color: {
                                ...stateColorSchema,
                                description: 'Segment colour (string or state-based object)',
                                examples: [
                                    '#FF9900',
                                    'theme:colors.text.onDark',
                                    {
                                        default: '#888888',
                                        active: '#FF9900',
                                        inactive: '#444444',
                                        unavailable: '#666666'
                                    }
                                ]
                            }
                        }
                    },

                    // ===== SEGMENTED STYLE CONFIGURATION =====
                    segments: {
                        type: 'object',
                        description: 'Configuration for segmented style (double concentric elbows with gap)',
                        default: {
                            gap: 4,
                            outer_segment: {
                                bar_width: 88,
                                bar_height: 10
                            },
                            inner_segment: {
                                bar_width: 28,
                                bar_height: 10
                            }
                        },
                        examples: [
                            {
                                gap: 4,
                                outer_segment: {
                                    bar_width: 90,
                                    bar_height: 90,
                                    outer_curve: 45,
                                    inner_curve: 22.5,
                                    color: '#FF9900'
                                },
                                inner_segment: {
                                    bar_width: 60,
                                    bar_height: 60,
                                    color: '#FFCC99'
                                }
                            }
                        ],
                        properties: {
                            gap: {
                                type: 'number',
                                minimum: 0,
                                maximum: 50,
                                default: 4,
                                description: 'Gap between outer and inner segments (pixels)',
                                examples: [2, 4, 6, 8]
                            },

                            outer_segment: {
                                type: 'object',
                                required: ['bar_width'],
                                description: 'Outer segment (frame) configuration',
                                examples: [
                                    {
                                        bar_width: 90,
                                        bar_height: 90,
                                        outer_curve: 45,
                                        inner_curve: 22.5,
                                        color: '#FF9900',
                                        entity_id: 'light.outer'
                                    }
                                ],
                                properties: {
                                    entity_id: {
                                        type: 'string',
                                        format: 'entity',
                                        pattern: '^[a-z_]+\\.[a-z0-9_]+$',
                                        description: 'Entity ID for state-based colour (format: domain.object_id)',
                                        examples: ['light.outer_frame', 'switch.outer_power']
                                    },
                                    bar_width: {
                                        oneOf: [
                                            { type: 'number', minimum: 1, maximum: 500 },
                                            { type: 'string', description: 'CSS length expression (e.g. \'clamp(60px, 8vw, 120px)\')' }
                                        ],
                                        description: 'Vertical bar thickness (pixels or CSS length) - REQUIRED',
                                        examples: [90, 120, 150, 'clamp(60px, 8vw, 120px)']
                                    },
                                    bar_height: {
                                        oneOf: [
                                            { type: 'number', minimum: 1, maximum: 500 },
                                            { type: 'string', description: 'CSS length expression (e.g. \'clamp(20px, 4vh, 60px)\')' }
                                        ],
                                        description: 'Horizontal bar thickness (pixels or CSS length, defaults to bar_width)',
                                        examples: [20, 90, 150, 'clamp(20px, 4vh, 60px)']
                                    },
                                    outer_curve: {
                                        oneOf: [
                                            { type: 'number', minimum: 0, maximum: 500 },
                                            { type: 'string', description: "Keyword: 'auto'/'arm_width', 'arm_height', 'arm_max' (recommended), 'arm_min', 'arm_fill', or CSS expression" }
                                        ],
                                        description: "Outer corner radius. Keywords: 'auto'/'arm_width'=bar_width/2, 'arm_height'=bar_height/2, 'arm_max'=max(w,h)/2 (recommended), 'arm_min'=min(w,h)/2, 'arm_fill'=max(w,h). Or explicit pixels.",
                                        examples: [45, 60, 75, 'auto', 'arm_max', 'arm_fill', 'clamp(30px, 4vw, 60px)']
                                    },
                                    inner_curve: {
                                        oneOf: [
                                            { type: 'number', minimum: 0, maximum: 500 },
                                            { type: 'string', description: 'CSS length expression (e.g. \'clamp(15px, 2vw, 30px)\')' }
                                        ],
                                        description: 'Inner corner radius (pixels or CSS length, defaults to outer_curve / 2)',
                                        examples: [22.5, 30, 37.5, 'clamp(15px, 2vw, 30px)']
                                    },
                                    color: stateColorSchema,
                                    tap_action: actionSchema,
                                    hold_action: actionSchema,
                                    double_tap_action: actionSchema
                                }
                            },

                            inner_segment: {
                                type: 'object',
                                required: ['bar_width'],
                                description: 'Inner segment (content area) configuration',
                                examples: [
                                    {
                                        bar_width: 60,
                                        bar_height: 60,
                                        outer_curve: 18,
                                        inner_curve: 9,
                                        color: '#FFCC99',
                                        entity_id: 'light.inner'
                                    }
                                ],
                                properties: {
                                    entity_id: {
                                        type: 'string',
                                        format: 'entity',
                                        pattern: '^[a-z_]+\\.[a-z0-9_]+$',
                                        description: 'Entity ID for state-based colour (format: domain.object_id)',
                                        examples: ['light.inner_zone', 'switch.inner_power']
                                    },
                                    bar_width: {
                                        oneOf: [
                                            { type: 'number', minimum: 1, maximum: 500 },
                                            { type: 'string', description: 'CSS length expression (e.g. \'clamp(40px, 6vw, 80px)\')' }
                                        ],
                                        description: 'Vertical bar thickness (pixels or CSS length) - REQUIRED',
                                        examples: [60, 80, 100, 'clamp(40px, 6vw, 80px)']
                                    },
                                    bar_height: {
                                        oneOf: [
                                            { type: 'number', minimum: 1, maximum: 500 },
                                            { type: 'string', description: 'CSS length expression (e.g. \'clamp(20px, 4vh, 60px)\')' }
                                        ],
                                        description: 'Horizontal bar thickness (pixels or CSS length, defaults to bar_width)',
                                        examples: [20, 60, 100, 'clamp(20px, 4vh, 60px)']
                                    },
                                    outer_curve: {
                                        oneOf: [
                                            { type: 'number', minimum: 0, maximum: 500 },
                                            { type: 'string', description: "Keyword: 'auto'/'arm_width', 'arm_height', 'arm_max' (recommended), 'arm_min', 'arm_fill', or CSS expression" }
                                        ],
                                        description: "Outer corner radius. Omit for auto concentric (outer_segment.inner_curve - gap). Keywords: 'auto'/'arm_width'=bar_width/2, 'arm_height'=bar_height/2, 'arm_max'=max(w,h)/2 (recommended), 'arm_min'=min(w,h)/2, 'arm_fill'=max(w,h).",
                                        examples: [18, 30, 40, 'arm_max', 'arm_fill'],
                                        $comment: 'Auto-calculation (when omitted): outer_segment.inner_curve - gap. Keyword modes use bar dimensions of inner_segment.'
                                    },
                                    inner_curve: {
                                        oneOf: [
                                            { type: 'number', minimum: 0, maximum: 500 },
                                            { type: 'string', description: 'CSS length expression for inner corner radius' }
                                        ],
                                        description: 'Inner corner radius (pixels or CSS length, defaults to outer_curve / 2)',
                                        examples: [9, 15, 20]
                                    },
                                    color: stateColorSchema,
                                    tap_action: actionSchema,
                                    hold_action: actionSchema,
                                    double_tap_action: actionSchema
                                }
                            }
                        }
                    },

                    colors: {
                        type: 'object',
                        description: 'Legacy colour override (use segment.color or segments.*.color instead)',
                        deprecated: true,
                        properties: {
                            background: {
                                type: 'string',
                                pattern: '^(#[0-9A-Fa-f]{6}|#[0-9A-Fa-f]{8}|transparent|match-light|theme:|rgb\\(|rgba\\(|hsl\\(|var\\(--)',
                                description: 'Background colour override (deprecated - use segment.color instead)'
                            }
                        }
                    }
                }
            },

            // ============================================================================
            // STYLE CONFIGURATION (inherited from button)
            // ============================================================================

            style: {
                type: 'object',
                properties: {
                    cursor: {
                        type: 'string',
                        description: 'CSS cursor style shown when hovering over the elbow. Overrides the automatic cursor derived from the interactive flag.',
                        examples: ['pointer', 'default', 'none', 'not-allowed', 'crosshair', 'grab', 'zoom-in', 'help', 'wait', 'progress', 'move', 'copy', 'text'],
                        'x-ui-hints': {
                            label: 'Cursor style',
                            helper: 'Any valid CSS cursor value. Leave unset to use the automatic default.'
                        }
                    }
                }
            },

            // ============================================================================
            // TEXT CONFIGURATION (inherited from button)
            // ============================================================================

            text: getTextSchema({ positionEnum }),

            // ============================================================================
            // ACTIONS (inherited from button)
            // ============================================================================

            tap_action: actionSchema,
            hold_action: actionSchema,
            double_tap_action: actionSchema,

            // ============================================================================
            // DATA SOURCES (shared across all lcards)
            // ============================================================================

            data_sources: dataSourcesSchema,

            triggers_update: triggersUpdateSchema,

            // ============================================================================
            // ANIMATIONS & FILTERS
            // ============================================================================

            animations: {
                type: 'array',
                description: 'Visual animations triggered by user interactions or entity state changes',
                items: animationSchema
            },

            // ============================================================================
            // BACKGROUND ANIMATION
            // ============================================================================

            background_animation: backgroundAnimationSchema,

            sounds: soundsSchema,

            // ============================================================================
            // SHAPE TEXTURE
            // ============================================================================

            shape_texture: {
                type: 'object',
                description: 'Canvas texture/animation rendered inside the elbow shape boundary',
                properties: {
                    preset: {
                        type: 'string',
                        description: 'Texture preset name',
                        enum: ['grid', 'diagonal', 'hexagonal', 'dots', 'fluid', 'shimmer', 'plasma', 'flow', 'level', 'pulse', 'scanlines', 'image']
                    },
                    opacity: {
                        description: 'Texture opacity (0-1). Supports state-based object.',
                        oneOf: [
                            { type: 'number', minimum: 0, maximum: 1 },
                            { '$ref': '#/$defs/stateColorSchema' }
                        ]
                    },
                    speed: {
                        description: 'Animation speed multiplier. Supports state-based object.',
                        oneOf: [
                            { type: 'number', minimum: 0 },
                            { type: 'object' }
                        ]
                    },
                    mix_blend_mode: {
                        type: 'string',
                        description: 'CSS mix-blend-mode for texture blending',
                        enum: ['normal', 'multiply', 'screen', 'overlay', 'hard-light', 'soft-light', 'color-burn', 'color-dodge']
                    },
                    config: {
                        type: 'object',
                        description: 'Preset-specific configuration. Supports entity-reactive values: map_range descriptor or template strings.',
                        additionalProperties: true
                    }
                },
                additionalProperties: false
            },

            filters: {
                type: 'array',
                description: 'Visual filters applied to entire elbow (CSS and SVG filter primitives)',
                items: filterSchema
            },

            // ============================================================================
            // LAYOUT (HA Grid System)
            // ============================================================================


            grid_options: gridOptionsSchema,

            // ============================================================================
            // SYMBIONT (embedded card with optional style imprinting)
            // ============================================================================

            symbiont: {
                type: 'object',
                description: 'Embed another HA card inside the elbow content area with optional style imprinting',
                properties: {
                    enabled: {
                        type: 'boolean',
                        default: false,
                        description: 'Enable symbiont card embedding'
                    },
                    overflow: {
                        type: 'string',
                        enum: ['visible', 'hidden', 'clip', 'scroll', 'auto'],
                        description: 'CSS overflow for both axes of the symbiont container. Overridden per-axis by overflow_x / overflow_y. Default: hidden.'
                    },
                    overflow_x: {
                        type: 'string',
                        enum: ['visible', 'hidden', 'clip', 'scroll', 'auto'],
                        description: 'CSS overflow-x for the symbiont container (horizontal axis). Overrides overflow shorthand.'
                    },
                    overflow_y: {
                        type: 'string',
                        enum: ['visible', 'hidden', 'clip', 'scroll', 'auto'],
                        description: 'CSS overflow-y for the symbiont container (vertical axis). Overrides overflow shorthand.'
                    },
                    position: {
                        type: 'object',
                        description: 'Padding within the elbow content area (px)',
                        properties: {
                            top: { type: 'number', default: 10 },
                            left: { type: 'number', default: 10 },
                            right: { type: 'number', default: 10 },
                            bottom: { type: 'number', default: 0 }
                        }
                    },
                    imprint: {
                        type: 'object',
                        description: 'Style imprinting — injects resolved styles into the embedded card shadow root',
                        properties: {
                            enabled: { type: 'boolean', default: true },
                            background: {
                                ...stateColorSchema,
                                description: 'Background colour to inject into embedded card. Null = do not imprint.'
                            },
                            text: {
                                type: 'object',
                                properties: {
                                    color: {
                                        ...stateColorSchema,
                                        description: 'Text colour to inject into embedded card. Null = do not imprint.'
                                    },
                                    font_size: {
                                        type: 'string',
                                        description: 'Font size to inject (e.g. "14px"). Null = do not imprint.'
                                    },
                                    font_family: {
                                        type: 'string',
                                        description: 'Font family string to inject. Null = do not imprint.'
                                    }
                                }
                            },
                            border_radius: {
                                type: 'object',
                                properties: {
                                    match_host: {
                                        type: 'boolean',
                                        default: true,
                                        description: 'Derive border radius from elbow inner arc geometry'
                                    },
                                    top_left: {
                                        oneOf: [
                                            { type: 'number', description: 'Top-left border radius (px)' },
                                            { type: 'string', enum: ['match'], description: "Use 'match' to mirror the elbow's inner arc radius" }
                                        ],
                                        description: "Top-left border radius — number (px) or 'match' to mirror elbow inner arc"
                                    },
                                    top_right: {
                                        oneOf: [
                                            { type: 'number', description: 'Top-right border radius (px)' },
                                            { type: 'string', enum: ['match'], description: "Use 'match' to mirror the elbow's inner arc radius" }
                                        ],
                                        description: "Top-right border radius — number (px) or 'match' to mirror elbow inner arc"
                                    },
                                    bottom_left: {
                                        oneOf: [
                                            { type: 'number', description: 'Bottom-left border radius (px)' },
                                            { type: 'string', enum: ['match'], description: "Use 'match' to mirror the elbow's inner arc radius" }
                                        ],
                                        description: "Bottom-left border radius — number (px) or 'match' to mirror elbow inner arc"
                                    },
                                    bottom_right: {
                                        oneOf: [
                                            { type: 'number', description: 'Bottom-right border radius (px)' },
                                            { type: 'string', enum: ['match'], description: "Use 'match' to mirror the elbow's inner arc radius" }
                                        ],
                                        description: "Bottom-right border radius — number (px) or 'match' to mirror elbow inner arc"
                                    }
                                }
                            }
                        }
                    },
                    custom_style: {
                        type: 'string',
                        description: 'Raw CSS injected into child card shadowRoot after imprint styles. Does not require card-mod.'
                    },
                    card: {
                        type: 'object',
                        description: 'Any valid HA card configuration (type + properties). card_mod blocks are passed through as-is.'
                    }
                }
            }
        }
    };
}
