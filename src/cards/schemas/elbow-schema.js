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

import { dataSourcesSchema, actionSchema, animationSchema, filterSchema, stateColorSchema, paddingSchema, getTextSchema, gridOptionsSchema, entitySchema, cardIdSchema, tagsSchema } from './common-schemas.js';
import { getElbowTypeNames } from '../../core/packs/components/elbows/index.js';

/**
 * Get complete elbow card schema
 * @param {Object} options - Schema options
 * @param {Array<string>} options.availablePresets - Available preset names (inherits from button)
 * @param {Array<string>} options.positionEnum - Available text positions
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

            id: cardIdSchema,

            tags: tagsSchema,

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
                                        enum: ['theme'],
                                        description: "Use 'theme' to dynamically bind to input_number.lcars_vertical from HA-LCARS theme",
                                        examples: ['theme']
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
                                        enum: ['theme'],
                                        description: "Use 'theme' to dynamically bind to input_number.lcars_horizontal from HA-LCARS theme",
                                        examples: ['theme']
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
                                        const: 'auto',
                                        description: 'Auto-calculate using LCARS formula: bar_width / 2'
                                    }
                                ],
                                default: 'auto',
                                description: 'Outer corner radius (pixels or "auto" for LCARS formula: bar_width / 2)',
                                $comment: 'LCARS Arc Formula: outer_curve = bar_width / 2 creates authentic tangent geometry',
                                'x-ui-hints': {
                                    label: 'Outer Curve',
                                    helper: 'Radius of outer corner (use "auto" for authentic LCARS geometry)',
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
                                type: 'number',
                                minimum: 0,
                                maximum: 500,
                                description: 'Inner corner radius (pixels, defaults to outer_curve / 2 using LCARS formula)',
                                examples: [22.5, 37.5, 50],
                                $comment: 'LCARS formula: inner_curve = outer_curve / 2 for authentic concentric geometry',
                                'x-ui-hints': {
                                    label: 'Inner Curve',
                                    helper: 'Radius of inner corner (defaults to outer_curve / 2 for LCARS geometry)',
                                    selector: {
                                        number: {
                                            mode: 'slider',
                                            step: 0.5,
                                            unit_of_measurement: 'px'
                                        }
                                    }
                                }
                            },
                            color: {
                                ...stateColorSchema,
                                description: 'Segment color (string or state-based object)',
                                examples: [
                                    '#FF9900',
                                    'theme:palette.moonlight',
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
                                        description: 'Entity ID for state-based color (format: domain.object_id)',
                                        examples: ['light.outer_frame', 'switch.outer_power']
                                    },
                                    bar_width: {
                                        type: 'number',
                                        minimum: 1,
                                        maximum: 500,
                                        description: 'Vertical bar thickness (pixels) - REQUIRED',
                                        examples: [90, 120, 150]
                                    },
                                    bar_height: {
                                        type: 'number',
                                        minimum: 1,
                                        maximum: 500,
                                        description: 'Horizontal bar thickness (pixels, defaults to bar_width)',
                                        examples: [20, 90, 150]
                                    },
                                    outer_curve: {
                                        type: 'number',
                                        minimum: 0,
                                        maximum: 500,
                                        description: 'Outer corner radius (pixels, defaults to bar_width / 2)',
                                        examples: [45, 60, 75]
                                    },
                                    inner_curve: {
                                        type: 'number',
                                        minimum: 0,
                                        maximum: 500,
                                        description: 'Inner corner radius (pixels, defaults to outer_curve / 2)',
                                        examples: [22.5, 30, 37.5]
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
                                        description: 'Entity ID for state-based color (format: domain.object_id)',
                                        examples: ['light.inner_zone', 'switch.inner_power']
                                    },
                                    bar_width: {
                                        type: 'number',
                                        minimum: 1,
                                        maximum: 500,
                                        description: 'Vertical bar thickness (pixels) - REQUIRED',
                                        examples: [60, 80, 100]
                                    },
                                    bar_height: {
                                        type: 'number',
                                        minimum: 1,
                                        maximum: 500,
                                        description: 'Horizontal bar thickness (pixels, defaults to bar_width)',
                                        examples: [20, 60, 100]
                                    },
                                    outer_curve: {
                                        type: 'number',
                                        minimum: 0,
                                        maximum: 500,
                                        description: 'Outer corner radius (pixels, auto-calculated for concentricity if not specified)',
                                        examples: [18, 30, 40],
                                        $comment: 'Auto-calculation: outer_segment.inner_curve - gap'
                                    },
                                    inner_curve: {
                                        type: 'number',
                                        minimum: 0,
                                        maximum: 500,
                                        description: 'Inner corner radius (pixels, defaults to outer_curve / 2)',
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
                        description: 'Legacy color override (use segment.color or segments.*.color instead)',
                        deprecated: true,
                        properties: {
                            background: {
                                type: 'string',
                                pattern: '^(#[0-9A-Fa-f]{6}|#[0-9A-Fa-f]{8}|transparent|theme:|rgb\\(|rgba\\(|hsl\\(|var\\(--)',
                                description: 'Background color override (deprecated - use segment.color instead)'
                            }
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

            // ============================================================================
            // ANIMATIONS & FILTERS
            // ============================================================================

            animations: {
                type: 'array',
                description: 'Visual animations triggered by user interactions or entity state changes',
                items: animationSchema
            },

            filters: {
                type: 'array',
                description: 'Visual filters applied to entire elbow (CSS and SVG filter primitives)',
                items: filterSchema
            },

            // ============================================================================
            // LAYOUT (HA Grid System)
            // ============================================================================

            width: {
                type: 'number',
                minimum: 1,
                maximum: 24,
                default: 4,
                description: 'Card width in grid columns (1-24, default: 4)',
                'x-ui-hints': {
                    label: 'Width (Grid Columns)',
                    helper: 'Card width in HA grid columns (1-24)',
                    selector: {
                        number: {
                            mode: 'slider',
                            step: 1,
                            unit_of_measurement: 'cols'
                        }
                    }
                }
            },

            height: {
                type: 'number',
                minimum: 1,
                maximum: 100,
                default: 4,
                description: 'Card height in grid rows (1-100, default: 4)',
                'x-ui-hints': {
                    label: 'Height (Grid Rows)',
                    helper: 'Card height in HA grid rows (1-100)',
                    selector: {
                        number: {
                            mode: 'slider',
                            step: 1,
                            unit_of_measurement: 'rows'
                        }
                    }
                }
            },

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
                                description: 'Background color to inject into embedded card. Null = do not imprint.'
                            },
                            text: {
                                type: 'object',
                                properties: {
                                    color: {
                                        ...stateColorSchema,
                                        description: 'Text color to inject into embedded card. Null = do not imprint.'
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
                                    top_left: { type: 'number', description: 'Top-left border radius (px)' },
                                    top_right: { type: 'number', description: 'Top-right border radius (px)' },
                                    bottom_left: { type: 'number', description: 'Bottom-left border radius (px)' },
                                    bottom_right: { type: 'number', description: 'Bottom-right border radius (px)' }
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
