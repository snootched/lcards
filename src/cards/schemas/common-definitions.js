/**
 * Common Schema Definitions
 * 
 * Shared schema definitions used across button card schemas.
 * Includes actions, animations, colors, padding, text fields, and segment styles.
 */

/**
 * Get common definitions for button card schema
 * @param {Object} options - Options for definitions
 * @param {Array<string>} options.fontFamilyEnum - Available font families
 * @param {Array<string>} options.positionEnum - Available positions
 * @param {Array<string>} options.transformEnum - Text transform options
 * @returns {Object} Common definitions object
 */
export function getCommonDefinitions(options = {}) {
    const {
        fontFamilyEnum = [],
        positionEnum = [],
        transformEnum = ['none', 'uppercase', 'lowercase', 'capitalize']
    } = options;

    return {
        // Action definition (tap, hold, double_tap)
        action: {
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
        },

        // Animation definition
        animation: {
            type: 'object',
            properties: {
                trigger: {
                    type: 'string',
                    enum: ['on_load', 'on_tap', 'on_hold', 'on_hover', 'on_leave', 'on_entity_change'],
                    description: 'Animation trigger'
                },
                preset: {
                    type: 'string',
                    description: 'Animation preset name (pulse, glow, fade, blink, shimmer, ripple, etc.)'
                },
                duration: { type: 'number', description: 'Animation duration in milliseconds' },
                easing: { type: 'string', description: 'Easing function' },
                loop: { type: 'boolean', description: 'Loop continuously' },
                alternate: { type: 'boolean', description: 'Alternate direction on each loop' },
                delay: { type: 'number', description: 'Delay before animation starts (ms)' },
                color: { type: 'string', description: 'Color for glow/shimmer presets' },
                scale: { type: 'number', description: 'Scale factor for pulse/ripple presets' },
                max_scale: { type: 'number', description: 'Maximum scale for pulse animations' }
            },
            required: ['trigger', 'preset']
        },

        // State-based color (string or object with states)
        stateColor: {
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
        },

        // Padding (uniform or object)
        padding: {
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
        },

        // Text field definition (used in multi-text system)
        textField: {
            type: 'object',
            properties: {
                content: { type: 'string', description: 'Text content (supports templates)' },
                show: { type: 'boolean', description: 'Show/hide this text field' },
                position: {
                    type: 'string',
                    enum: positionEnum,
                    description: 'Named position'
                },
                x: { type: 'number', description: 'Explicit x coordinate' },
                y: { type: 'number', description: 'Explicit y coordinate' },
                x_percent: { type: 'number', minimum: 0, maximum: 100 },
                y_percent: { type: 'number', minimum: 0, maximum: 100 },
                rotation: { type: 'number', minimum: -360, maximum: 360 },
                padding: { $ref: '#/definitions/padding' },
                font_size: { type: 'number', minimum: 1, maximum: 200 },
                color: { $ref: '#/definitions/stateColor' },
                font_weight: {
                    type: 'string',
                    enum: ['normal', 'bold', '100', '200', '300', '400', '500', '600', '700', '800', '900']
                },
                font_family: {
                    type: 'string',
                    enum: fontFamilyEnum
                },
                text_transform: {
                    type: 'string',
                    enum: transformEnum
                },
                anchor: {
                    type: 'string',
                    enum: ['start', 'middle', 'end']
                },
                baseline: {
                    type: 'string',
                    enum: ['hanging', 'middle', 'central', 'alphabetic']
                },
                template: { type: 'boolean', description: 'Enable template processing' }
            }
        },

        // Segment style definition (for SVG segments and dpad)
        segmentStyle: {
            type: 'object',
            description: 'State-based style for segment',
            properties: {
                fill: { $ref: '#/definitions/stateColor' },
                stroke: { $ref: '#/definitions/stateColor' },
                'stroke-width': {
                    oneOf: [
                        { type: ['number', 'string'], description: 'Uniform stroke width' },
                        {
                            type: 'object',
                            description: 'State-based stroke widths',
                            properties: {
                                default: { type: ['number', 'string'] },
                                active: { type: ['number', 'string'] },
                                inactive: { type: ['number', 'string'] },
                                unavailable: { type: ['number', 'string'] },
                                hover: { type: ['number', 'string'] },
                                pressed: { type: ['number', 'string'] }
                            }
                        }
                    ]
                },
                opacity: {
                    oneOf: [
                        { type: 'number', description: 'Uniform opacity (0-1)' },
                        {
                            type: 'object',
                            description: 'State-based opacity values',
                            properties: {
                                default: { type: 'number' },
                                active: { type: 'number' },
                                inactive: { type: 'number' },
                                unavailable: { type: 'number' },
                                hover: { type: 'number' },
                                pressed: { type: 'number' }
                            }
                        }
                    ]
                }
            }
        },

        // Segment definition (for both custom SVG and dpad segments)
        segment: {
            type: 'object',
            properties: {
                id: { type: 'string', description: 'Segment identifier' },
                selector: { type: 'string', description: 'CSS selector for SVG elements' },
                entity: { type: 'string', format: 'entity', description: 'Override entity for this segment' },
                tap_action: { $ref: '#/definitions/action' },
                hold_action: { $ref: '#/definitions/action' },
                double_tap_action: { $ref: '#/definitions/action' },
                style: { $ref: '#/definitions/segmentStyle' },
                animations: {
                    type: 'array',
                    description: 'Segment animations',
                    items: { $ref: '#/definitions/animation' }
                }
            }
        }
    };
}
