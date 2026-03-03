/**
 * Button Card Schema - Unified
 *
 * Complete schema for button card validation.
 * Uses shared schema components from common-schemas.js for consistency.
 *
 * This schema is ONLY for validation, not UI generation.
 * Editor UI is defined separately in lcards-button-editor.js config.
 */

import { dataSourcesSchema, actionSchema, animationSchema, filterSchema, stateColorSchema, paddingSchema, getTextSchema, gridOptionsSchema, entitySchema, cardIdSchema, tagsSchema, backgroundAnimationSchema } from './common-schemas.js';

/**
 * Get complete button card schema
 * @param {Object} options - Schema options
 * @param {Array<string>} options.availablePresets - Available preset names
 * @param {Array<string>} options.positionEnum - Available positions
 * @returns {Object} Complete button schema
 */
export function getButtonSchema(options = {}) {
    const {
        availablePresets = [],
        positionEnum = []
    } = options;

    // Action, animation, and filter schemas imported from common-schemas.js

    return {
        $schema: 'http://json-schema.org/draft-07/schema#',
        $id: 'https://github.com/snootched/lcards/schemas/button-schema',
        title: 'LCARdS Button Card Configuration',
        description: 'Complete configuration schema for lcards-button custom card',
        type: 'object',
        properties: {
            // ============================================================================
            // HOME ASSISTANT REQUIRED PROPERTIES
            // ============================================================================

            type: {
                type: 'string',
                const: 'custom:lcards-button',
                description: 'Home Assistant card type identifier (required)'
            },

            // ============================================================================
            // SHARED LCARDS PROPERTIES
            // ============================================================================

            data_sources: dataSourcesSchema,

            // ============================================================================
            // CORE PROPERTIES
            // ============================================================================

            entity: entitySchema,

            id: cardIdSchema,

            tags: tagsSchema,

            // ============================================================================
            // CONTROL BEHAVIOR
            // ============================================================================

            control: {
                type: 'object',
                description: 'Control behavior configuration',
                properties: {
                    attribute: {
                        type: 'string',
                        description: 'Entity attribute to control (leave blank to control entity state)',
                        examples: ['brightness', 'temperature', 'position', 'percentage']
                    }
                },
                additionalProperties: true
            },

            // ============================================================================
            // MODE: PRESET OR COMPONENT
            // ============================================================================

            preset: {
                type: 'string',
                description: 'Style preset name (button preset when used alone; component preset name when component is set)',
                examples: availablePresets,
                'x-ui-hints': {
                    label: 'Style Preset',
                    helper: 'Choose a pre-configured button style. Use "component" instead for advanced layouts like D-pad.',
                }
            },

            component: {
                type: 'string',
                enum: ['dpad', 'alert'],
                description: 'Component type (mutually exclusive with preset)',
                enumDescriptions: [
                    'D-pad directional control (up/down/left/right/center)',
                    'Alert symbol with animated bar segments (red/blue/green/yellow/grey/black)'
                ]
            },

            // ============================================================================
            // TEXT CONFIGURATION
            // ============================================================================

            text: getTextSchema({ positionEnum }),

            // ============================================================================
            // ICON CONFIGURATION
            // ============================================================================

            show_icon: {
                type: 'boolean',
                default: true,
                description: 'Whether to show the icon'
            },

            icon_area: {
                type: 'string',
                enum: ['left', 'right', 'top', 'bottom', 'none'],
                default: 'left',
                description: 'Icon area position relative to main area',
                enumDescriptions: [
                    'Vertical bar on left side',
                    'Vertical bar on right side',
                    'Horizontal bar at top',
                    'Horizontal bar at bottom',
                    'No separate icon area (icon in main area)'
                ]
            },

            icon: {
                type: 'string',
                examples: ['mdi:lightbulb', 'mdi:home', 'si:github', 'mdi:thermometer'],
                'x-ui-hints': {
                    label: 'Icon',
                    selector: {
                        icon: {}
                    }
                }
            },

            icon_area_background: {
                title: 'Icon Area Background Color',
                description: 'Background color for the icon area (supports state-based colors)',
                default: 'transparent',
                $comment: 'Icon area background is independent of main card background. Useful for creating visual separation.',
                ...stateColorSchema
            },

            icon_area_size: {
                type: 'number',
                minimum: 20,
                maximum: 500,
                default: 60,
                description: 'Fixed size for icon area in pixels (width for left/right, height for top/bottom, default: 60)',
                'x-ui-hints': {
                    label: 'Icon Area Size',
                    helper: 'Size in pixels',
                    selector: {
                        number: {
                            mode: 'box',
                            min: 20,
                            max: 500,
                            step: 1,
                            unit_of_measurement: 'px'
                        }
                    }
                }
            },

            divider: {
                type: 'object',
                description: 'Divider line between icon area and main area',
                examples: [{
                    width: 2,
                    color: '#FF9900'
                }],
                properties: {
                    width: {
                        type: 'number',
                        minimum: 0,
                        maximum: 200,
                        default: 0,
                        description: 'Divider width in pixels (0 = no divider, default: 0)',
                        'x-ui-hints': {
                            label: 'Width',
                            helper: 'Divider line width',
                            selector: {
                                number: {
                                    mode: 'box',
                                    min: 0,
                                    max: 200,
                                    step: 1,
                                    unit_of_measurement: 'px'
                                }
                            }
                        }
                    },
                    color: {
                        type: 'string',
                        pattern: '^(#[0-9A-Fa-f]{6}|#[0-9A-Fa-f]{8}|rgb\\(|rgba\\(|var\\(--)',
                        description: 'Divider color',
                        examples: ['#FF9900', 'rgba(255, 153, 0, 0.5)']
                    }
                }
            },

            icon_style: {
                type: 'object',
                description: 'Advanced icon styling configuration',
                examples: [{
                    type: 'mdi',
                    color: '#FF9900',
                    size: 32,
                    position: 'center'
                }],
                properties: {
                    type: {
                        type: 'string',
                        enum: ['mdi', 'si', 'entity'],
                        default: 'mdi',
                        description: 'Icon type',
                        enumDescriptions: [
                            'Material Design Icons',
                            'Simple Icons',
                            'Entity state icon'
                        ]
                    },
                    color: stateColorSchema,
                    size: {
                        type: 'number',
                        minimum: 8,
                        maximum: 200,
                        default: 24,
                        description: 'Icon size in pixels (8-200, default: 24)',
                        'x-ui-hints': {
                            label: 'Size',
                            helper: 'Icon size in pixels',
                            selector: {
                                number: {
                                    mode: 'box',
                                    min: 8,
                                    max: 200,
                                    step: 1,
                                    unit_of_measurement: 'px'
                                }
                            }
                        }
                    },
                    rotation: {
                        type: 'number',
                        minimum: -360,
                        maximum: 360,
                        default: 0,
                        description: 'Icon rotation in degrees (-360 to 360)',
                        'x-ui-hints': {
                            label: 'Rotation',
                            helper: 'Rotate icon in degrees',
                            selector: {
                                number: {
                                    mode: 'slider',
                                    min: -360,
                                    max: 360,
                                    step: 1,
                                    unit_of_measurement: '°'
                                }
                            }
                        }
                    },
                    position: {
                        type: 'string',
                        enum: positionEnum,
                        default: 'center',
                        description: 'Icon position within icon area'
                    },
                    x: {
                        type: 'number',
                        description: 'Absolute X coordinate in pixels'
                    },
                    y: {
                        type: 'number',
                        description: 'Absolute Y coordinate in pixels'
                    },
                    x_percent: {
                        type: 'number',
                        minimum: 0,
                        maximum: 100,
                        description: 'X position as percentage (0-100)'
                    },
                    y_percent: {
                        type: 'number',
                        minimum: 0,
                        maximum: 100,
                        description: 'Y position as percentage (0-100)'
                    },
                    spacing: {
                        type: 'number',
                        minimum: 0,
                        maximum: 100,
                        default: 8,
                        description: 'Spacing between icon and text in pixels (default: 8)',
                        'x-ui-hints': {
                            label: 'Spacing',
                            helper: 'Space between icon and text',
                            selector: {
                                number: {
                                    mode: 'box',
                                    min: 0,
                                    max: 100,
                                    step: 1,
                                    unit_of_measurement: 'px'
                                }
                            }
                        }
                    },
                    padding: paddingSchema,
                    padding_left: {
                        type: 'number',
                        minimum: 0,
                        maximum: 200,
                        description: 'Left padding in pixels (overrides padding)'
                    },
                    padding_right: {
                        type: 'number',
                        minimum: 0,
                        maximum: 200,
                        description: 'Right padding in pixels (overrides padding)'
                    },
                    padding_top: {
                        type: 'number',
                        minimum: 0,
                        maximum: 200,
                        description: 'Top padding in pixels (overrides padding)'
                    },
                    padding_bottom: {
                        type: 'number',
                        minimum: 0,
                        maximum: 200,
                        description: 'Bottom padding in pixels (overrides padding)'
                    }
                }
            },

            // ============================================================================
            // STYLE CONFIGURATION
            // ============================================================================

            style: {
                type: 'object',
                properties: {
                    card: {
                        type: 'object',
                        properties: {
                            color: {
                                type: 'object',
                                properties: {
                                    background: stateColorSchema
                                }
                            }
                        }
                    },
                    border: {
                        type: 'object',
                        properties: {
                            width: {
                                oneOf: [
                                    { type: 'number' },
                                    { type: 'string', description: 'Theme token reference' },
                                    {
                                        type: 'object',
                                        properties: {
                                            top: { oneOf: [{ type: 'number' }, { type: 'string' }] },
                                            right: { oneOf: [{ type: 'number' }, { type: 'string' }] },
                                            bottom: { oneOf: [{ type: 'number' }, { type: 'string' }] },
                                            left: { oneOf: [{ type: 'number' }, { type: 'string' }] }
                                        }
                                    }
                                ]
                            },
                            color: stateColorSchema,
                            radius: {
                                oneOf: [
                                    { type: 'number', minimum: 0, maximum: 100, default: 12 },
                                    { type: 'string', pattern: '^(\\{theme:.*\\}|var\\(--.*\\))$', description: 'Theme token reference' },
                                    {
                                        type: 'object',
                                        properties: {
                                            top_left: { oneOf: [{ type: 'number' }, { type: 'string' }] },
                                            top_right: { oneOf: [{ type: 'number' }, { type: 'string' }] },
                                            bottom_right: { oneOf: [{ type: 'number' }, { type: 'string' }] },
                                            bottom_left: { oneOf: [{ type: 'number' }, { type: 'string' }] }
                                        }
                                    }
                                ],
                                'x-ui-hints': {
                                    label: 'Border Radius',
                                    helper: 'Corner roundness (pixels, theme token, or per-corner)',
                                    selector: {
                                        choose: {
                                            choices: {
                                                pixels: {
                                                    selector: {
                                                        number: {
                                                            mode: 'slider',
                                                            min: 0,
                                                            max: 100,
                                                            step: 1,
                                                            slider_ticks: false,
                                                            unit_of_measurement: 'px'
                                                        }
                                                    }
                                                },
                                                theme: {
                                                    selector: {
                                                        text: {
                                                            placeholder: '{theme:borders.radius.md}'
                                                        }
                                                    }
                                                },
                                                per_corner: {
                                                    selector: {
                                                        object: {
                                                            properties: {
                                                                top_left: {
                                                                    title: 'Top Left',
                                                                    number: { min: 0, max: 100, step: 1 }
                                                                },
                                                                top_right: {
                                                                    title: 'Top Right',
                                                                    number: { min: 0, max: 100, step: 1 }
                                                                },
                                                                bottom_right: {
                                                                    title: 'Bottom Right',
                                                                    number: { min: 0, max: 100, step: 1 }
                                                                },
                                                                bottom_left: {
                                                                    title: 'Bottom Left',
                                                                    number: { min: 0, max: 100, step: 1 }
                                                                }
                                                            }
                                                        }
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    },
                    text: {
                        type: 'object',
                        properties: {
                            default: {
                                type: 'object',
                                properties: {
                                    color: stateColorSchema,
                                    font_size: {
                                        oneOf: [
                                            { type: 'number' },
                                            { type: 'string', description: 'CSS value or theme token (e.g., "14px", "var(--lcars-text-size)")' }
                                        ]
                                    },
                                    font_weight: { type: ['string', 'number'] },
                                    font_family: { type: 'string', format: 'font-family' }
                                }
                            }
                        }
                    }
                }
            },

            // ============================================================================
            // ACTIONS
            // ============================================================================

            tap_action: actionSchema,
            hold_action: actionSchema,
            double_tap_action: actionSchema,

            // ============================================================================
            // ANIMATIONS
            // ============================================================================

            animations: {
                type: 'array',
                items: animationSchema
            },

            // ============================================================================
            // BACKGROUND ANIMATION
            // ============================================================================

            background_animation: backgroundAnimationSchema,

            // ============================================================================
            // SHAPE TEXTURE
            // ============================================================================

            shape_texture: {
                type: 'object',
                description: 'SVG-native texture/animation rendered inside the button shape boundary',
                properties: {
                    preset: {
                        type: 'string',
                        description: 'Texture preset name',
                        enum: ['grid', 'diagonal', 'hexagonal', 'dots', 'fluid', 'solid']
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
                        description: 'Preset-specific configuration (color, line_spacing, hex_radius, etc.)',
                        additionalProperties: true
                    }
                },
                additionalProperties: false
            },

            // FILTERS
            // ============================================================================

            filters: {
                type: 'array',
                description: 'Visual filters applied to entire button (CSS and SVG filter primitives)',
                items: filterSchema
            },

            // ============================================================================
            // SVG BACKGROUND
            // ============================================================================

            svg: {
                type: 'object',
                properties: {
                    content: { type: 'string' },
                    src: { type: 'string' },
                    viewBox: { type: 'string' },
                    preserveAspectRatio: { type: 'string' },
                    enable_tokens: { type: 'boolean' },
                    allow_scripts: { type: 'boolean' },
                    segments: {
                        type: 'object',
                        description: 'Segment configurations keyed by ID. Use "default" for shared config.',
                        properties: {
                            default: {
                                type: 'object',
                                description: 'Default configuration inherited by all segments',
                                properties: {
                                    entity: {
                                        type: 'string',
                                        format: 'entity',
                                        pattern: '^[a-z_]+\\.[a-z0-9_]+$',
                                        description: 'Entity ID (format: domain.object_id)',
                                        examples: ['light.living_room', 'switch.fan']
                                    },
                                    tap_action: actionSchema,
                                    hold_action: actionSchema,
                                    double_tap_action: actionSchema,
                                    style: {
                                        type: 'object',
                                        properties: {
                                            fill: stateColorSchema,
                                            stroke: stateColorSchema,
                                            'stroke-width': {
                                                title: 'Stroke Width',
                                                description: 'SVG stroke width (number in pixels or CSS string)',
                                                oneOf: [
                                                    {
                                                        type: 'number',
                                                        minimum: 0,
                                                        maximum: 50,
                                                        description: 'Uniform stroke width in pixels (0-50)'
                                                    },
                                                    {
                                                        type: 'string',
                                                        pattern: '^\\d+(\\.\\d+)?(px|em|rem)?$',
                                                        description: 'CSS stroke width value',
                                                        examples: ['2px', '1.5', '0.5em']
                                                    },
                                                    {
                                                        type: 'object',
                                                        description: 'State-based stroke width',
                                                        properties: {
                                                            default: {
                                                                oneOf: [
                                                                    { type: 'number', minimum: 0, maximum: 50 },
                                                                    { type: 'string' }
                                                                ]
                                                            },
                                                            active: {
                                                                oneOf: [
                                                                    { type: 'number', minimum: 0, maximum: 50 },
                                                                    { type: 'string' }
                                                                ]
                                                            },
                                                            inactive: {
                                                                oneOf: [
                                                                    { type: 'number', minimum: 0, maximum: 50 },
                                                                    { type: 'string' }
                                                                ]
                                                            }
                                                        }
                                                    }
                                                ]
                                            },
                                            opacity: {
                                                oneOf: [
                                                    {
                                                        type: 'number',
                                                        minimum: 0,
                                                        maximum: 1,
                                                        description: 'Opacity value (0.0 = transparent, 1.0 = opaque)'
                                                    },
                                                    {
                                                        type: 'object',
                                                        description: 'State-based opacity',
                                                        properties: {
                                                            default: { type: 'number', minimum: 0, maximum: 1 },
                                                            active: { type: 'number', minimum: 0, maximum: 1 },
                                                            inactive: { type: 'number', minimum: 0, maximum: 1 }
                                                        }
                                                    }
                                                ]
                                            }
                                        }
                                    },
                                    animations: {
                                        type: 'array',
                                        items: animationSchema
                                    }
                                }
                            }
                        },
                        additionalProperties: {
                            type: 'object',
                            description: 'Per-segment configuration (overrides default)',
                            properties: {
                                selector: {
                                    type: 'string',
                                    description: 'CSS selector override (defaults to "#<segment-id>")'
                                },
                                entity: {
                                    type: 'string',
                                    format: 'entity',
                                    pattern: '^[a-z_]+\\.[a-z0-9_]+$',
                                    description: 'Entity ID (format: domain.object_id)',
                                    examples: ['light.living_room', 'switch.fan']
                                },
                                tap_action: actionSchema,
                                hold_action: actionSchema,
                                double_tap_action: actionSchema,
                                style: {
                                    type: 'object',
                                    properties: {
                                        fill: stateColorSchema,
                                        stroke: stateColorSchema,
                                        'stroke-width': {
                                            title: 'Stroke Width',
                                            description: 'SVG stroke width (number in pixels or CSS string)',
                                            oneOf: [
                                                {
                                                    type: 'number',
                                                    minimum: 0,
                                                    maximum: 50,
                                                    description: 'Uniform stroke width in pixels (0-50)'
                                                },
                                                {
                                                    type: 'string',
                                                    pattern: '^\\d+(\\.\\d+)?(px|em|rem)?$',
                                                    description: 'CSS stroke width value',
                                                    examples: ['2px', '1.5', '0.5em']
                                                },
                                                {
                                                    type: 'object',
                                                    description: 'State-based stroke width',
                                                    properties: {
                                                        default: {
                                                            oneOf: [
                                                                { type: 'number', minimum: 0, maximum: 50 },
                                                                { type: 'string' }
                                                            ]
                                                        },
                                                        active: {
                                                            oneOf: [
                                                                { type: 'number', minimum: 0, maximum: 50 },
                                                                { type: 'string' }
                                                            ]
                                                        },
                                                        inactive: {
                                                            oneOf: [
                                                                { type: 'number', minimum: 0, maximum: 50 },
                                                                { type: 'string' }
                                                            ]
                                                        }
                                                    }
                                                }
                                            ]
                                        },
                                        opacity: {
                                            oneOf: [
                                                {
                                                    type: 'number',
                                                    minimum: 0,
                                                    maximum: 1,
                                                    description: 'Opacity value (0.0 = transparent, 1.0 = opaque)'
                                                },
                                                {
                                                    type: 'object',
                                                    description: 'State-based opacity',
                                                    properties: {
                                                        default: { type: 'number', minimum: 0, maximum: 1 },
                                                        active: { type: 'number', minimum: 0, maximum: 1 },
                                                        inactive: { type: 'number', minimum: 0, maximum: 1 }
                                                    }
                                                }
                                            ]
                                        }
                                    }
                                },
                                animations: {
                                    type: 'array',
                                    items: animationSchema
                                }
                            }
                        }
                    }
                }
            },

            // ============================================================================
            // ALERT COMPONENT
            // ============================================================================

            alert: {
                type: 'object',
                description: 'Alert component configuration',
                properties: {
                    // Color shorthand: expands to segment style overrides at runtime.
                    //   alert.color.shape → shape.style.fill
                    //   alert.color.bars  → bars.style.stroke
                    color: {
                        type: 'object',
                        description: 'Color shorthand — overrides the active preset\'s colors',
                        properties: {
                            shape: {
                                type: 'string',
                                description: 'Fill color for the shield shape',
                                examples: ['var(--lcards-orange)', '#ff9800', 'theme:palette.sunset']
                            },
                            bars: {
                                type: 'string',
                                description: 'Stroke color for the bar lines',
                                examples: ['var(--lcards-orange)', '#ff9800', 'theme:palette.sunset']
                            }
                        }
                    },
                    // User-defined presets merged over built-in presets.
                    // Same key as a built-in (e.g. condition_red) overrides it;
                    // a new key creates an additional preset selectable by name.
                    custom_presets: {
                        type: 'object',
                        description: 'Custom or override presets (merged over built-ins)',
                        additionalProperties: {
                            type: 'object',
                            properties: {
                                segments: {
                                    type: 'object',
                                    properties: {
                                        shape: {
                                            type: 'object',
                                            properties: { style: { type: 'object', properties: { fill: { type: 'string' } } } }
                                        },
                                        bars: {
                                            type: 'object',
                                            properties: { style: { type: 'object', properties: { stroke: { type: 'string' } } } }
                                        }
                                    }
                                },
                                text: {
                                    type: 'object',
                                    additionalProperties: {
                                        type: 'object',
                                        properties: {
                                            content: { type: 'string' },
                                            color:   { type: 'string' }
                                        }
                                    }
                                }
                            }
                        }
                    },
                    segments: {
                        type: 'object',
                        description: 'Per-segment fine-grained overrides (managed by Segments tab)',
                        additionalProperties: {
                            type: 'object',
                            properties: {
                                style: {
                                    type: 'object',
                                    properties: {
                                        fill:   { type: 'string' },
                                        stroke: { type: 'string' }
                                    }
                                }
                            }
                        }
                    }
                }
            },

            // ============================================================================
            // DPAD COMPONENT
            // ============================================================================

            dpad: {
                type: 'object',
                properties: {
                    segments: {
                        type: 'object',
                        description: 'Segment configurations. Use "default" key for common properties applied to all segments. Other keys are segment IDs (up, down, left, right, up-left, up-right, down-left, down-right, center).',
                        additionalProperties: {
                            type: 'object',
                            properties: {
                                selector: {
                                    type: 'string',
                                    description: 'CSS selector for SVG element (defaults to #{segment-id} if not specified)'
                                },
                                entity: {
                                    type: 'string',
                                    format: 'entity',
                                    pattern: '^[a-z_]+\\.[a-z0-9_]+$',
                                    description: 'Entity ID for this segment (format: domain.object_id, overrides card entity)',
                                    examples: ['light.living_room', 'media_player.tv']
                                },
                                tap_action: actionSchema,
                                hold_action: actionSchema,
                                double_tap_action: actionSchema,
                                style: {
                                    type: 'object',
                                    description: 'SVG styling for the segment',
                                    properties: {
                                        fill: stateColorSchema,
                                        stroke: stateColorSchema,
                                        'stroke-width': {
                                            title: 'Stroke Width',
                                            description: 'SVG stroke width (number in pixels, CSS string, or state-based)',
                                            oneOf: [
                                                {
                                                    type: 'number',
                                                    minimum: 0,
                                                    maximum: 50,
                                                    description: 'Stroke width in pixels (0-50)'
                                                },
                                                {
                                                    type: 'string',
                                                    pattern: '^\\d+(\\.\\d+)?(px|em|rem)?$',
                                                    description: 'CSS stroke width value',
                                                    examples: ['2px', '1.5', '0.5em']
                                                },
                                                stateColorSchema
                                            ]
                                        }
                                    }
                                },
                                animations: {
                                    type: 'array',
                                    items: animationSchema
                                }
                            }
                        }
                    }
                }
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
            // ============================================================================
            // RANGES: STATE-DRIVEN PRESET SWITCHING
            // ============================================================================

            ranges_attribute: {
                type: 'string',
                description: 'Entity attribute to evaluate for all range entries (e.g. "brightness", "brightness_pct", "temperature"). Use "brightness_pct" for a computed 0-100 light brightness value. Defaults to entity state.',
                examples: ['brightness', 'brightness_pct', 'temperature', 'percentage', 'current_position'],
                'x-ui-hints': {
                    label: 'Range Attribute',
                    helper: 'Attribute to compare against range thresholds. Leave blank to use entity state.'
                }
            },

            ranges: {
                type: 'array',
                description: 'State-driven preset switching: evaluates entity value against thresholds and applies matching preset',
                items: {
                    type: 'object',
                    required: ['preset'],
                    properties: {
                        preset: {
                            type: 'string',
                            description: 'Component preset name to apply when this range matches'
                        },
                        attribute: {
                            type: 'string',
                            description: 'Override ranges_attribute for this entry only'
                        },
                        above: {
                            type: 'number',
                            description: 'Match when value is >= this threshold'
                        },
                        below: {
                            type: 'number',
                            description: 'Match when value is < this threshold'
                        },
                        equals: {
                            description: 'Match when value equals this (string comparison)',
                            type: ['string', 'number', 'boolean']
                        },
                        color: {
                            type: 'object',
                            description: 'Transient segment color overrides applied while this range is active',
                            properties: {
                                shape: { type: 'string', description: 'Override fill for the shape segment' },
                                bars:  { type: 'string', description: 'Override stroke for the bars segment' }
                            }
                        }
                    },
                    additionalProperties: false
                },
                'x-ui-hints': {
                    label: 'State-Driven Presets'
                }
            },

            grid_options: gridOptionsSchema
        }
    };
}
