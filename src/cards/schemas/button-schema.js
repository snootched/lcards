/**
 * Button Card Schema - Unified
 *
 * Complete schema for button card validation.
 * All definitions inlined for simplicity - no $ref resolution needed.
 *
 * This schema is ONLY for validation, not UI generation.
 * Editor UI is defined separately in lcards-button-editor.js config.
 */

/**
 * Get complete button card schema
 * @param {Object} options - Schema options
 * @param {Array<string>} options.availablePresets - Available preset names
 * @param {Array<string>} options.fontFamilyEnum - Available font families
 * @param {Array<string>} options.positionEnum - Available positions
 * @returns {Object} Complete button schema
 */
export function getButtonSchema(options = {}) {
    const {
        availablePresets = [],
        fontFamilyEnum = [],
        positionEnum = []
    } = options;

    // Reusable inline definitions (used multiple times below)
    const stateColorSchema = {
        oneOf: [
            { type: 'string', description: 'Uniform color' },
            {
                type: 'object',
                description: 'State-based colors',
                properties: {
                    default: { type: 'string' },
                    active: { type: 'string' },
                    inactive: { type: 'string' },
                    unavailable: { type: 'string' },
                    hover: { type: 'string' },
                    pressed: { type: 'string' }
                }
            }
        ]
    };

    const paddingSchema = {
        oneOf: [
            { type: 'number', minimum: 0, description: 'Uniform padding in pixels' },
            {
                type: 'object',
                properties: {
                    top: { type: 'number', minimum: 0 },
                    right: { type: 'number', minimum: 0 },
                    bottom: { type: 'number', minimum: 0 },
                    left: { type: 'number', minimum: 0 }
                }
            }
        ]
    };

    const actionSchema = {
        type: 'object',
        properties: {
            action: {
                type: 'string',
                enum: ['toggle', 'call-service', 'navigate', 'more-info', 'none']
            },
            service: { type: 'string' },
            service_data: { type: 'object' },
            data: { type: 'object' },
            navigation_path: { type: 'string' },
            entity: { type: 'string', format: 'entity' },
            target: { type: 'object' }
        }
    };

    const animationSchema = {
        type: 'object',
        properties: {
            trigger: {
                type: 'string',
                enum: ['on_load', 'on_tap', 'on_hold', 'on_hover', 'on_leave', 'on_entity_change']
            },
            preset: { type: 'string' },
            duration: { type: 'number' },
            easing: { type: 'string' },
            loop: { type: 'boolean' },
            alternate: { type: 'boolean' },
            delay: { type: 'number' },
            color: { type: 'string' },
            scale: { type: 'number' },
            max_scale: { type: 'number' }
        },
        required: ['trigger', 'preset']
    };

    return {
        type: 'object',
        properties: {
            // ============================================================================
            // CORE PROPERTIES
            // ============================================================================

            entity: {
                type: 'string',
                format: 'entity',
                description: 'Entity ID to control'
            },

            id: {
                type: 'string',
                description: 'Custom overlay ID for rule targeting'
            },

            tags: {
                type: 'array',
                items: { type: 'string' },
                description: 'Tags for bulk rule targeting'
            },

            // ============================================================================
            // MODE: PRESET OR COMPONENT
            // ============================================================================

            preset: {
                type: 'string',
                enum: availablePresets,
                description: 'Style preset name (e.g., "lozenge", "bullet", "outline")'
            },

            component: {
                type: 'string',
                enum: ['dpad'],
                description: 'Component type (e.g., "dpad" for directional control)'
            },

            // ============================================================================
            // TEXT CONFIGURATION
            // ============================================================================

            text: {
                type: 'object',
                description: 'Multi-text label system',
                properties: {
                    default: {
                        type: 'object',
                        description: 'Default styling for all text fields',
                        properties: {
                            position: { type: 'string', enum: positionEnum },
                            rotation: { type: 'number' },
                            padding: paddingSchema,
                            font_size: { type: 'number' },
                            color: stateColorSchema,
                            font_weight: {
                                type: 'string',
                                enum: ['normal', 'bold', '100', '200', '300', '400', '500', '600', '700', '800', '900']
                            },
                            font_family: { type: 'string', format: 'font-family', enum: fontFamilyEnum },
                            text_transform: {
                                type: 'string',
                                enum: ['none', 'uppercase', 'lowercase', 'capitalize']
                            },
                            anchor: { type: 'string', enum: ['start', 'middle', 'end'] },
                            baseline: { type: 'string', enum: ['hanging', 'middle', 'central', 'alphabetic'] }
                        }
                    }
                },
                // Additional text fields with arbitrary names
                additionalProperties: {
                    type: 'object',
                    properties: {
                        content: { type: 'string' },
                        show: { type: 'boolean' },
                        position: { type: 'string', enum: positionEnum },
                        x: { type: 'number' },
                        y: { type: 'number' },
                        x_percent: { type: 'number', minimum: 0, maximum: 100 },
                        y_percent: { type: 'number', minimum: 0, maximum: 100 },
                        rotation: { type: 'number', minimum: -360, maximum: 360 },
                        padding: paddingSchema,
                        font_size: { type: 'number', minimum: 1, maximum: 200 },
                        color: stateColorSchema,
                        font_weight: {
                            type: 'string',
                            enum: ['normal', 'bold', '100', '200', '300', '400', '500', '600', '700', '800', '900']
                        },
                        font_family: { type: 'string', format: 'font-family', enum: fontFamilyEnum },
                        text_transform: {
                            type: 'string',
                            enum: ['none', 'uppercase', 'lowercase', 'capitalize']
                        },
                        anchor: { type: 'string', enum: ['start', 'middle', 'end'] },
                        baseline: { type: 'string', enum: ['hanging', 'middle', 'central', 'alphabetic'] },
                        template: { type: 'boolean' }
                    }
                }
            },

            // ============================================================================
            // ICON CONFIGURATION
            // ============================================================================

            show_icon: {
                type: 'boolean',
                description: 'Show/hide icon'
            },

            icon_area: {
                type: 'string',
                enum: ['left', 'right', 'top', 'bottom', 'none'],
                description: 'Icon area position'
            },

            icon: {
                type: 'string',
                description: 'Icon name (e.g., "mdi:lightbulb")'
            },

            icon_area_background: {
                description: 'Icon area background color',
                ...stateColorSchema
            },

            icon_area_size: {
                type: 'number',
                description: 'Fixed size for icon area (width for left/right, height for top/bottom)'
            },

            divider: {
                type: 'object',
                description: 'Divider line between icon area and main area',
                properties: {
                    width: { type: 'number', description: 'Divider width in pixels' },
                    color: { type: 'string', description: 'Divider color' }
                }
            },

            icon_style: {
                type: 'object',
                description: 'Advanced icon styling configuration',
                properties: {
                    type: { type: 'string', enum: ['mdi', 'si', 'entity'] },
                    color: stateColorSchema,
                    size: { type: 'number' },
                    rotation: { type: 'number' },
                    position: { type: 'string', enum: positionEnum },
                    x: { type: 'number' },
                    y: { type: 'number' },
                    x_percent: { type: 'number' },
                    y_percent: { type: 'number' },
                    spacing: { type: 'number' },
                    padding: paddingSchema,
                    padding_left: { type: 'number' },
                    padding_right: { type: 'number' },
                    padding_top: { type: 'number' },
                    padding_bottom: { type: 'number' }
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
                                    { type: 'number' },
                                    { type: 'string', description: 'Theme token reference' },
                                    {
                                        type: 'object',
                                        properties: {
                                            top_left: { oneOf: [{ type: 'number' }, { type: 'string' }] },
                                            top_right: { oneOf: [{ type: 'number' }, { type: 'string' }] },
                                            bottom_right: { oneOf: [{ type: 'number' }, { type: 'string' }] },
                                            bottom_left: { oneOf: [{ type: 'number' }, { type: 'string' }] }
                                        }
                                    }
                                ]
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
                                    font_size: { type: 'number' },
                                    font_weight: { type: 'string' },
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
                        type: 'array',
                        items: {
                            type: 'object',
                            properties: {
                                id: { type: 'string' },
                                selector: { type: 'string' },
                                entity: { type: 'string', format: 'entity' },
                                tap_action: actionSchema,
                                hold_action: actionSchema,
                                double_tap_action: actionSchema,
                                style: {
                                    type: 'object',
                                    properties: {
                                        fill: stateColorSchema,
                                        stroke: stateColorSchema,
                                        'stroke-width': {
                                            oneOf: [
                                                { type: ['number', 'string'] },
                                                {
                                                    type: 'object',
                                                    properties: {
                                                        default: { type: ['number', 'string'] },
                                                        active: { type: ['number', 'string'] },
                                                        inactive: { type: ['number', 'string'] }
                                                    }
                                                }
                                            ]
                                        },
                                        opacity: {
                                            oneOf: [
                                                { type: 'number' },
                                                {
                                                    type: 'object',
                                                    properties: {
                                                        default: { type: 'number' },
                                                        active: { type: 'number' },
                                                        inactive: { type: 'number' }
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
                                    description: 'Entity ID for this segment (overrides card entity)'
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
                                            anyOf: [
                                                { type: 'number' },
                                                { type: 'string' },
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

            width: { type: 'number' },
            height: { type: 'number' },
            grid_options: {
                type: 'object',
                properties: {
                    columns: { type: 'number' },
                    rows: { type: 'number' }
                }
            }
        }
    };
}
