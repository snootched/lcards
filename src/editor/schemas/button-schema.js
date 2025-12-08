/**
 * JSON Schema for LCARdS Button Card
 * 
 * This is a simplified schema for the visual editor.
 * The complete schema is registered in lcards-button.js with the config manager.
 */

export const BUTTON_SCHEMA = {
    $schema: 'http://json-schema.org/draft-07/schema#',
    type: 'object',
    title: 'LCARdS Button Card',
    description: 'Feature-complete button with multi-text labels, icons, and state-based styling',
    properties: {
        // Core Properties
        type: {
            type: 'string',
            const: 'custom:lcards-button',
            description: 'Card type identifier'
        },
        entity: {
            type: 'string',
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
            enum: ['lozenge', 'bullet', 'capped', 'barrel', 'outline', 'icon', 'square', 'rounded',
                   'bar-label-left', 'bar-label-center', 'bar-label-right', 'bar-label-square',
                   'bar-label-lozenge', 'bar-label-bullet-left', 'bar-label-bullet-right'],
            description: 'Style preset name - defines the overall look and feel'
        },
        
        // Grid Layout
        grid_columns: {
            type: 'number',
            minimum: 1,
            maximum: 12,
            description: 'Number of grid columns this card spans'
        },
        grid_rows: {
            type: 'number',
            minimum: 1,
            maximum: 12,
            description: 'Number of grid rows this card spans'
        },
        
        // Text Configuration (simplified)
        text: {
            type: 'object',
            description: 'Multi-text label system with flexible positioning',
            additionalProperties: {
                type: 'object',
                properties: {
                    content: {
                        type: 'string',
                        description: 'Text content (supports templates like {{entity.state}})'
                    },
                    position: {
                        type: 'string',
                        enum: ['top-left', 'top-center', 'top-right', 'left-center', 'center', 
                               'right-center', 'bottom-left', 'bottom-center', 'bottom-right',
                               'top', 'bottom', 'left', 'right'],
                        description: 'Named position within the button'
                    },
                    font_size: {
                        type: 'number',
                        description: 'Font size in pixels'
                    },
                    color: {
                        oneOf: [
                            { type: 'string', description: 'Uniform color' },
                            {
                                type: 'object',
                                properties: {
                                    active: { type: 'string' },
                                    inactive: { type: 'string' },
                                    unavailable: { type: 'string' },
                                    default: { type: 'string' }
                                }
                            }
                        ]
                    },
                    show: {
                        type: 'boolean',
                        description: 'Show/hide field (default: true)'
                    }
                }
            }
        },
        
        // Icon Configuration (simplified)
        icon: {
            oneOf: [
                { 
                    type: 'string', 
                    description: 'Simple icon: "mdi:lightbulb", "entity", or null' 
                },
                {
                    type: 'object',
                    properties: {
                        icon: { 
                            type: 'string', 
                            description: 'Icon name (e.g., "mdi:lightbulb", "entity")' 
                        },
                        position: {
                            type: 'string',
                            enum: ['center', 'left-center', 'right-center'],
                            description: 'Icon position'
                        },
                        size: {
                            type: 'number',
                            description: 'Icon size in pixels (default: 24)'
                        },
                        color: {
                            oneOf: [
                                { type: 'string' },
                                {
                                    type: 'object',
                                    properties: {
                                        active: { type: 'string' },
                                        inactive: { type: 'string' },
                                        default: { type: 'string' }
                                    }
                                }
                            ]
                        },
                        show: {
                            type: 'boolean',
                            description: 'Show/hide icon'
                        }
                    }
                }
            ]
        },
        
        icon_area: {
            type: 'string',
            enum: ['left', 'right', 'top', 'bottom', 'none'],
            description: 'Where icon\'s reserved space is (default: left)'
        },
        
        // Actions
        tap_action: {
            type: 'object',
            description: 'Action to perform on tap',
            properties: {
                action: {
                    type: 'string',
                    enum: ['toggle', 'more-info', 'navigate', 'url', 'call-service', 'none'],
                    description: 'Action type'
                },
                entity: { type: 'string' },
                navigation_path: { type: 'string' },
                url_path: { type: 'string' },
                service: { type: 'string' },
                service_data: { type: 'object' }
            }
        },
        
        double_tap_action: {
            type: 'object',
            description: 'Action to perform on double tap'
        },
        
        hold_action: {
            type: 'object',
            description: 'Action to perform on hold'
        },
        
        // Style overrides (simplified)
        style: {
            type: 'object',
            description: 'Style overrides for advanced customization',
            additionalProperties: true
        }
    },
    required: ['type']
};

/**
 * Get default config for button card
 */
export function getDefaultButtonConfig() {
    return {
        type: 'custom:lcards-button',
        entity: 'light.example',
        preset: 'lozenge',
        tap_action: {
            action: 'toggle'
        },
        text: {
            name: {
                content: 'LCARdS Button'
            }
        }
    };
}
