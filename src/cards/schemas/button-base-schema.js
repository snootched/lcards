/**
 * Button Base Schema
 * 
 * Core schema properties for button card including entity, preset, text, icon, style, and actions.
 */

/**
 * Get button base schema
 * @param {Object} options - Schema options
 * @param {Array<string>} options.availablePresets - Available preset names
 * @param {Array<string>} options.fontFamilyEnum - Available font families
 * @param {Array<string>} options.positionEnum - Available positions
 * @param {Array<string>} options.transformEnum - Text transform options
 * @param {Array<string>} options.justifyEnum - Text justification options
 * @param {Array<string>} options.alignEnum - Text alignment options
 * @returns {Object} Button base schema
 */
export function getButtonBaseSchema(options = {}) {
    const {
        availablePresets = [],
        fontFamilyEnum = [],
        positionEnum = [],
        transformEnum = ['none', 'uppercase', 'lowercase', 'capitalize'],
        justifyEnum = ['left', 'center', 'right', 'justify', 'start', 'end'],
        alignEnum = ['top', 'middle', 'bottom', 'baseline', 'start', 'end']
    } = options;

    return {
        type: 'object',
        properties: {
            // Core Properties
            entity: {
                type: 'string',
                format: 'entity',
                description: 'Entity ID to control (optional - if omitted, always uses "active" state)'
            },
            id: {
                type: 'string',
                description: 'Custom overlay ID for rule targeting (optional - auto-generated if omitted)'
            },
            tags: {
                type: 'array',
                items: { type: 'string' },
                description: 'Tags for bulk rule targeting (e.g., ["controlled", "indicator"])'
            },

            // Preset
            preset: {
                type: 'string',
                enum: availablePresets,
                description: 'Style preset name (e.g., "lozenge", "bullet", "capped", "barrel", "outline", "icon")'
            },

            // Multi-Text Label System
            text: {
                type: 'object',
                description: 'Multi-text label system with flexible positioning',
                properties: {
                    // Explicit 'default' property for text defaults
                    default: {
                        type: 'object',
                        description: 'Default styling for all text fields',
                        properties: {
                            position: {
                                type: 'string',
                                enum: positionEnum,
                                description: 'Default position for all text fields'
                            },
                            rotation: { type: 'number', description: 'Default rotation angle in degrees (positive = clockwise)' },
                            padding: { $ref: '#/definitions/padding' },
                            font_size: { type: 'number', description: 'Default font size in pixels' },
                            color: { $ref: '#/definitions/stateColor' },
                            font_weight: {
                                type: 'string',
                                enum: ['normal', 'bold', '100', '200', '300', '400', '500', '600', '700', '800', '900'],
                                description: 'Default font weight'
                            },
                            font_family: {
                                type: 'string',
                                enum: fontFamilyEnum,
                                description: 'Default font family'
                            },
                            text_transform: {
                                type: 'string',
                                enum: transformEnum,
                                description: 'Default text transformation'
                            },
                            anchor: {
                                type: 'string',
                                enum: ['start', 'middle', 'end'],
                                description: 'Default text anchor'
                            },
                            baseline: {
                                type: 'string',
                                enum: ['hanging', 'middle', 'central', 'alphabetic'],
                                description: 'Default baseline alignment'
                            }
                        }
                    }
                },
                patternProperties: {
                    '^[a-zA-Z_][a-zA-Z0-9_]*$': { $ref: '#/definitions/textField' }
                }
            },

            // Icon Area Configuration
            show_icon: {
                type: 'boolean',
                description: 'Show/hide icon (default: false). Required to display icon even if icon is configured.'
            },
            icon_area: {
                type: 'string',
                enum: ['left', 'right', 'top', 'bottom', 'none'],
                description: 'Where icon\'s reserved space is (default: left). "none" = no divider, absolute positioning'
            },
            icon_area_size: {
                type: 'number',
                description: 'Override calculated area size (width for left/right, height for top/bottom)'
            },
            icon_area_background: {
                oneOf: [
                    { type: 'string', description: 'Uniform background color for icon area' },
                    {
                        type: 'object',
                        description: 'State-based background colors for icon area',
                        properties: {
                            default: { type: 'string', description: 'Default state color' },
                            active: { type: 'string', description: 'Active state color' },
                            inactive: { type: 'string', description: 'Inactive state color' },
                            unavailable: { type: 'string', description: 'Unavailable state color' }
                        }
                    }
                ],
                description: 'Background color for the icon area (left/right/top/bottom section)'
            },

            // Icon Configuration
            icon: {
                type: 'string',
                format: 'icon',
                description: 'Icon name: "mdi:lightbulb", "si:github", "entity", or null'
            },
            icon_style: {
                type: 'object',
                description: 'Icon styling and positioning options',
                properties: {
                    position: {
                        type: 'string',
                        enum: positionEnum,
                        description: 'Position within icon area (if icon_area set) or absolute on button (if icon_area: none)'
                    },
                    x: { type: 'number', description: 'Explicit x coordinate (within area or absolute)' },
                    y: { type: 'number', description: 'Explicit y coordinate (within area or absolute)' },
                    x_percent: { type: 'number', minimum: 0, maximum: 100, description: 'Percentage x position (0-100)' },
                    y_percent: { type: 'number', minimum: 0, maximum: 100, description: 'Percentage y position (0-100)' },
                    size: { type: 'number', description: 'Icon size in pixels (default: 24)' },
                    color: { $ref: '#/definitions/stateColor' },
                    padding: { $ref: '#/definitions/padding' },
                    rotation: { type: 'number', description: 'Rotation angle in degrees (positive = clockwise)' }
                }
            },

            // Divider Configuration (line between icon area and text area)
            divider: {
                type: 'object',
                description: 'Divider line between icon area and text area',
                properties: {
                    width: {
                        type: 'number',
                        minimum: 0,
                        description: 'Divider line width in pixels (default: 6)'
                    },
                    color: {
                        type: 'string',
                        description: 'Divider line color (CSS color, hex, or theme variable)'
                    }
                }
            },

            // Style Properties (CB-LCARS nested schema)
            style: {
                type: 'object',
                description: 'Style overrides following CB-LCARS nested schema',
                properties: {
                    card: {
                        type: 'object',
                        properties: {
                            color: {
                                type: 'object',
                                properties: {
                                    background: {
                                        type: 'object',
                                        description: 'Background colors by state',
                                        properties: {
                                            active: { type: 'string' },
                                            inactive: { type: 'string' },
                                            unavailable: { type: 'string' },
                                            default: { type: 'string' }
                                        }
                                    }
                                }
                            }
                        }
                    },
                    border: {
                        type: 'object',
                        properties: {
                            width: {
                                oneOf: [
                                    { type: ['number', 'string'], description: 'Uniform width' },
                                    {
                                        type: 'object',
                                        properties: {
                                            top: { type: ['number', 'string'] },
                                            right: { type: ['number', 'string'] },
                                            bottom: { type: ['number', 'string'] },
                                            left: { type: ['number', 'string'] }
                                        }
                                    }
                                ]
                            },
                            radius: {
                                oneOf: [
                                    { type: ['number', 'string'], description: 'Uniform radius' },
                                    {
                                        type: 'object',
                                        properties: {
                                            top_left: { type: ['number', 'string'] },
                                            top_right: { type: ['number', 'string'] },
                                            bottom_left: { type: ['number', 'string'] },
                                            bottom_right: { type: ['number', 'string'] }
                                        }
                                    }
                                ]
                            },
                            color: { $ref: '#/definitions/stateColor' }
                        }
                    },
                    text: {
                        type: 'object',
                        properties: {
                            default: {
                                type: 'object',
                                description: 'Default text styling for all fields',
                                properties: {
                                    font_size: { type: 'number' },
                                    font_weight: { type: 'string' },
                                    font_family: { type: 'string' },
                                    text_transform: { type: 'string' },
                                    color: { $ref: '#/definitions/stateColor' }
                                }
                            }
                        }
                    },
                    opacity: { type: 'number', minimum: 0, maximum: 1, description: 'Opacity (0-1, applied to entire button)' }
                }
            },

            // Sizing
            width: {
                type: 'number',
                description: 'Fixed width in pixels (optional - auto-sizes to container by default)'
            },
            height: {
                type: 'number',
                description: 'Fixed height in pixels (optional - auto-sizes to container by default)'
            },

            // Action Properties
            tap_action: { $ref: '#/definitions/action' },
            hold_action: { $ref: '#/definitions/action' },
            double_tap_action: { $ref: '#/definitions/action' },

            // Rules Engine
            rules: {
                type: 'array',
                description: 'Card-local rules for dynamic styling based on entity states',
                items: {
                    type: 'object',
                    properties: {
                        id: { type: 'string' },
                        when: {
                            type: 'object',
                            description: 'Condition object (entity, condition, all, any, not)'
                        },
                        apply: {
                            type: 'object',
                            description: 'Style patches to apply when condition is true'
                        }
                    },
                    required: ['when', 'apply']
                }
            },

            // Animations
            animations: {
                type: 'array',
                description: 'Animation configurations',
                items: { $ref: '#/definitions/animation' }
            },

            // CSS Class
            css_class: {
                type: 'string',
                description: 'Custom CSS class for styling'
            }
        }
        // No required fields - allows decorative/static buttons without entities
    };
}
