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
 * @param {Array<string>} options.positionEnum - Available positions
 * @returns {Object} Complete button schema
 */
export function getButtonSchema(options = {}) {
    const {
        availablePresets = [],
        positionEnum = []
    } = options;

    // Reusable inline definitions (used multiple times below)
    const stateColorSchema = {
        oneOf: [
            {
                type: 'string',
                title: 'Simple Color',
                pattern: '^(#[0-9A-Fa-f]{6}|#[0-9A-Fa-f]{8}|transparent|theme:|rgb\\(|rgba\\(|hsl\\(|var\\(--)',
                description: 'Single color value for all states (hex, rgb, theme token, or CSS variable)',
                examples: ['#FF9900', 'transparent', 'theme:color.ui.active', 'rgb(255, 153, 0)', 'var(--lcars-orange)']
            },
            {
                type: 'object',
                title: 'State-Dependent Colors',
                description: 'Different colors for different entity states',
                examples: [{
                    default: '#888888',
                    active: '#FF9900',
                    inactive: '#444444'
                }],
                properties: {
                    default: {
                        type: 'string',
                        pattern: '^(#[0-9A-Fa-f]{6}|#[0-9A-Fa-f]{8}|transparent|theme:|rgb\\(|rgba\\(|hsl\\(|var\\(--)',
                        description: 'Default color (fallback)',
                        examples: ['#888888', 'theme:color.ui.default']
                    },
                    active: {
                        type: 'string',
                        pattern: '^(#[0-9A-Fa-f]{6}|#[0-9A-Fa-f]{8}|transparent|theme:|rgb\\(|rgba\\(|hsl\\(|var\\(--)',
                        description: 'Color when entity is on/active',
                        examples: ['#FF9900', 'theme:color.ui.active']
                    },
                    inactive: {
                        type: 'string',
                        pattern: '^(#[0-9A-Fa-f]{6}|#[0-9A-Fa-f]{8}|transparent|theme:|rgb\\(|rgba\\(|hsl\\(|var\\(--)',
                        description: 'Color when entity is off/inactive',
                        examples: ['#444444', 'theme:color.ui.inactive']
                    },
                    unavailable: {
                        type: 'string',
                        pattern: '^(#[0-9A-Fa-f]{6}|#[0-9A-Fa-f]{8}|transparent|theme:|rgb\\(|rgba\\(|hsl\\(|var\\(--)',
                        description: 'Color when entity is unavailable',
                        examples: ['#666666', 'theme:color.ui.unavailable']
                    },
                    hover: {
                        type: 'string',
                        pattern: '^(#[0-9A-Fa-f]{6}|#[0-9A-Fa-f]{8}|transparent|theme:|rgb\\(|rgba\\(|hsl\\(|var\\(--)',
                        description: 'Color on mouse hover',
                        examples: ['#FFBB00', 'theme:color.ui.hover']
                    },
                    pressed: {
                        type: 'string',
                        pattern: '^(#[0-9A-Fa-f]{6}|#[0-9A-Fa-f]{8}|transparent|theme:|rgb\\(|rgba\\(|hsl\\(|var\\(--)',
                        description: 'Color when pressed/tapped',
                        examples: ['#CC7700', 'theme:color.ui.pressed']
                    }
                }
            }
        ]
    };

    const paddingSchema = {
        oneOf: [
            {
                type: 'number',
                title: 'Uniform Padding',
                minimum: 0,
                maximum: 200,
                description: 'Same padding on all sides (in pixels)',
                examples: [8, 16, 24]
            },
            {
                type: 'object',
                title: 'Per-Side Padding',
                description: 'Different padding for each side',
                examples: [{
                    top: 8,
                    right: 16,
                    bottom: 8,
                    left: 16
                }],
                properties: {
                    top: { type: 'number', minimum: 0, maximum: 200, description: 'Top padding in pixels' },
                    right: { type: 'number', minimum: 0, maximum: 200, description: 'Right padding in pixels' },
                    bottom: { type: 'number', minimum: 0, maximum: 200, description: 'Bottom padding in pixels' },
                    left: { type: 'number', minimum: 0, maximum: 200, description: 'Left padding in pixels' }
                }
            }
        ],
        'x-ui-hints': {
            label: 'Padding',
            helper: 'Use number for uniform padding, or object for per-side control',
            defaultOneOfBranch: 0,
            selector: {
                number: {
                    mode: 'slider',
                    step: 1,
                    unit_of_measurement: 'px'
                }
            }
        }
    };

    const actionSchema = {
        type: 'object',
        description: 'Action to perform on interaction',
        examples: [
            {
                action: 'toggle',
                entity: 'light.living_room'
            },
            {
                action: 'call-service',
                service: 'light.turn_on',
                service_data: {
                    brightness: 255,
                    color_name: 'red'
                }
            },
            {
                action: 'navigate',
                navigation_path: '/lovelace/dashboard'
            },
            {
                action: 'more-info',
                entity: 'sensor.temperature'
            }
        ],
        properties: {
            action: {
                type: 'string',
                enum: ['toggle', 'call-service', 'navigate', 'more-info', 'none'],
                default: 'toggle',
                description: 'Type of action to perform',
                enumDescriptions: [
                    'Toggle entity on/off',
                    'Call a Home Assistant service',
                    'Navigate to another view/dashboard',
                    'Show entity more-info dialog',
                    'No action (disabled)'
                ]
            },
            service: {
                type: 'string',
                pattern: '^[a-z_]+\\.[a-z0-9_]+$',
                description: 'Service to call (format: domain.service)',
                examples: ['light.turn_on', 'switch.toggle', 'notify.mobile_app']
            },
            service_data: {
                type: 'object',
                description: 'Data to pass to the service',
                examples: [{ brightness: 255, color_name: 'red' }]
            },
            data: {
                type: 'object',
                description: 'Alias for service_data',
                examples: [{ brightness: 255 }]
            },
            navigation_path: {
                type: 'string',
                pattern: '^/',
                description: 'Path to navigate to (must start with /)',
                examples: ['/lovelace/dashboard', '/lovelace/0']
            },
            entity: {
                type: 'string',
                format: 'entity',
                pattern: '^[a-z_]+\\.[a-z0-9_]+$',
                description: 'Entity ID (format: domain.object_id)',
                examples: ['light.living_room', 'sensor.temperature', 'switch.fan']
            },
            target: {
                type: 'object',
                description: 'Service target selector',
                examples: [{ entity_id: 'light.living_room' }]
            }
        }
    };

    const animationSchema = {
        type: 'object',
        description: 'Animation configuration',
        examples: [
            {
                trigger: 'on_tap',
                preset: 'pulse',
                duration: 500,
                color: '#FF9900'
            },
            {
                trigger: 'on_entity_change',
                preset: 'flash',
                loop: true
            }
        ],
        properties: {
            trigger: {
                type: 'string',
                enum: ['on_load', 'on_tap', 'on_hold', 'on_hover', 'on_leave', 'on_entity_change'],
                description: 'When to trigger the animation',
                enumDescriptions: [
                    'When card is loaded/rendered',
                    'When card is tapped/clicked',
                    'When card is held (long press)',
                    'When mouse enters card',
                    'When mouse leaves card',
                    'When associated entity state changes'
                ]
            },
            preset: {
                type: 'string',
                description: 'Animation preset name',
                examples: ['pulse', 'flash', 'bounce', 'shake', 'glow']
            },
            duration: {
                type: 'number',
                minimum: 0,
                maximum: 10000,
                default: 500,
                description: 'Animation duration in milliseconds (0-10000)'
            },
            easing: {
                type: 'string',
                description: 'CSS easing function',
                examples: ['ease', 'ease-in', 'ease-out', 'ease-in-out', 'linear', 'cubic-bezier(0.4, 0, 0.2, 1)']
            },
            loop: {
                type: 'boolean',
                default: false,
                description: 'Whether animation should loop continuously'
            },
            alternate: {
                type: 'boolean',
                default: false,
                description: 'Whether animation should alternate direction on each loop'
            },
            delay: {
                type: 'number',
                minimum: 0,
                maximum: 10000,
                default: 0,
                description: 'Delay before animation starts (milliseconds)'
            },
            color: {
                type: 'string',
                pattern: '^(#[0-9A-Fa-f]{6}|#[0-9A-Fa-f]{8}|theme:|rgb\\(|rgba\\(|var\\(--)',
                description: 'Animation color (for glow/flash effects)',
                examples: ['#FF9900', 'theme:color.ui.active', 'rgba(255, 153, 0, 0.5)']
            },
            scale: {
                type: 'number',
                minimum: 0.1,
                maximum: 10,
                default: 1,
                description: 'Scale factor for animation (0.1-10, default: 1)'
            },
            max_scale: {
                type: 'number',
                minimum: 0.1,
                maximum: 10,
                description: 'Maximum scale during animation (0.1-10)'
            }
        },
        required: ['trigger', 'preset']
    };

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

            data_sources: {
                type: 'object',
                description: 'Named data source definitions (shared across all lcards)',
                $comment: 'Data sources enable historical data queries and transformations',
                examples: [
                    {
                        temp_history: {
                            entity: 'sensor.temperature',
                            windowSeconds: 3600
                        },
                        power_usage: {
                            entity: 'sensor.power',
                            windowSeconds: 86400
                        }
                    }
                ],
                additionalProperties: {
                    type: 'object',
                    properties: {
                        entity: {
                            type: 'string',
                            format: 'entity',
                            pattern: '^[a-z_]+\\.[a-z0-9_]+$',
                            description: 'Entity ID to fetch data from (format: domain.object_id)',
                            examples: ['sensor.temperature', 'light.living_room']
                        },
                        windowSeconds: {
                            type: 'number',
                            minimum: 1,
                            maximum: 31536000,
                            description: 'Time window in seconds for historical data (1 second to 1 year)',
                            examples: [3600, 86400, 604800]
                        }
                    },
                    required: ['entity']
                }
            },

            // ============================================================================
            // CORE PROPERTIES
            // ============================================================================

            entity: {
                type: 'string',
                format: 'entity',
                pattern: '^[a-z_]+\\.[a-z0-9_]+$',
                description: 'Primary entity ID to control (format: domain.object_id)',
                examples: ['light.living_room', 'switch.fan', 'sensor.temperature'],
                'x-ui-hints': {
                    label: 'Entity',
                    helper: 'Select the Home Assistant entity this button controls',
                    selector: {
                        entity: {
                            // Can specify domains if needed: domain: ['light', 'switch']
                        }
                    }
                }
            },

            id: {
                type: 'string',
                pattern: '^[a-zA-Z0-9_-]+$',
                description: 'Custom overlay ID for rule targeting (alphanumeric, underscore, hyphen)',
                examples: ['main-button', 'nav_home', 'control123']
            },

            tags: {
                type: 'array',
                items: {
                    type: 'string',
                    pattern: '^[a-zA-Z0-9_-]+$'
                },
                description: 'Tags for bulk rule targeting (alphanumeric, underscore, hyphen)',
                examples: [['navigation', 'primary'], ['control', 'lights']]
            },

            // ============================================================================
            // MODE: PRESET OR COMPONENT
            // ============================================================================

            preset: {
                type: 'string',
                enum: availablePresets,
                description: 'Style preset name (mutually exclusive with component)',
                examples: ['lozenge', 'bullet', 'outline', 'pill'],
                'x-ui-hints': {
                    label: 'Style Preset',
                    helper: 'Choose a pre-configured button style. Use "component" instead for advanced layouts like D-pad.',
                    selector: {
                        select: {
                            mode: 'dropdown'
                        }
                    }
                }
            },

            component: {
                type: 'string',
                enum: ['dpad'],
                description: 'Component type (mutually exclusive with preset)',
                enumDescriptions: [
                    'D-pad directional control (up/down/left/right/center)'
                ]
            },

            // ============================================================================
            // TEXT CONFIGURATION
            // ============================================================================

            text: {
                type: 'object',
                description: 'Multi-text label system',
                $comment: 'Text fields use arbitrary keys. "default" provides styling inherited by all other text fields. All other keys create actual rendered text elements.',
                examples: [
                    {
                        label1: {
                            content: 'BRIDGE',
                            position: 'top-left',
                            font_size: 18,
                            color: '#FF9900'
                        },
                        status: {
                            content: '{{entity.state}}',
                            position: 'center',
                            template: true
                        }
                    }
                ],
                properties: {
                    default: {
                        type: 'object',
                        description: 'Default styling inherited by all text fields (does not render)',
                        $comment: 'This is NOT rendered as a text element - it only provides default styles',
                        properties: {
                            position: {
                                type: 'string',
                                enum: positionEnum,
                                description: 'Default text position (e.g., "top-left", "center")'
                            },
                            rotation: {
                                type: 'number',
                                minimum: -360,
                                maximum: 360,
                                default: 0,
                                description: 'Text rotation in degrees (-360 to 360)'
                            },
                            padding: paddingSchema,
                            font_size: {
                                oneOf: [
                                    {
                                        type: 'number',
                                        minimum: 1,
                                        maximum: 200,
                                        default: 14,
                                        description: 'Font size in pixels (1-200)'
                                    },
                                    {
                                        type: 'string',
                                        pattern: '^(\\d+px|\\d+\\.?\\d*rem|\\d+\\.?\\d*em|var\\(--[a-z-]+\\))$',
                                        description: 'CSS value or theme token',
                                        examples: ['14px', '1.2rem', 'var(--lcars-text-size)']
                                    }
                                ]
                            },
                            color: stateColorSchema,
                            font_weight: {
                                type: 'string',
                                enum: ['normal', 'bold', '100', '200', '300', '400', '500', '600', '700', '800', '900'],
                                default: 'normal',
                                description: 'Font weight (normal=400, bold=700)',
                                enumDescriptions: [
                                    'Normal weight (400)',
                                    'Bold weight (700)',
                                    'Thin (100)',
                                    'Extra Light (200)',
                                    'Light (300)',
                                    'Normal (400)',
                                    'Medium (500)',
                                    'Semi Bold (600)',
                                    'Bold (700)',
                                    'Extra Bold (800)',
                                    'Black (900)'
                                ]
                            },
                            font_family: {
                                type: 'string',
                                format: 'font-family',
                                pattern: '^[a-zA-Z0-9_ -]+(,\\s*[a-zA-Z0-9_ "-]+)*$',
                                description: 'CSS font-family (single font or comma-separated stack)',
                                examples: ['Arial', 'lcards_title', 'Antonio, sans-serif', '"Roboto Mono", monospace']
                            },
                            text_transform: {
                                type: 'string',
                                enum: ['none', 'uppercase', 'lowercase', 'capitalize'],
                                default: 'none',
                                description: 'Text transformation',
                                enumDescriptions: [
                                    'No transformation (original case)',
                                    'ALL UPPERCASE',
                                    'all lowercase',
                                    'Capitalize First Letter'
                                ]
                            },
                            anchor: {
                                type: 'string',
                                enum: ['start', 'middle', 'end'],
                                default: 'middle',
                                description: 'Horizontal text alignment',
                                enumDescriptions: [
                                    'Left-aligned',
                                    'Center-aligned',
                                    'Right-aligned'
                                ]
                            },
                            baseline: {
                                type: 'string',
                                enum: ['hanging', 'middle', 'central', 'alphabetic'],
                                default: 'middle',
                                description: 'Vertical text alignment',
                                enumDescriptions: [
                                    'Top of text box',
                                    'Center of text box',
                                    'Mathematical center',
                                    'Bottom of text (baseline)'
                                ]
                            }
                        }
                    }
                },
                // Additional text fields with arbitrary names
                additionalProperties: {
                    type: 'object',
                    description: 'Text field configuration (key becomes field name)',
                    $comment: 'Each key creates a separate SVG text element. Use descriptive names like "label1", "status", "title"',
                    properties: {
                        content: {
                            type: 'string',
                            description: 'Text content (supports templates if template:true)',
                            examples: ['BRIDGE', 'Living Room', '{{entity.state}}']
                        },
                        show: {
                            type: 'boolean',
                            default: true,
                            description: 'Whether to show this text field'
                        },
                        position: {
                            type: 'string',
                            enum: positionEnum,
                            description: 'Text position (overrides default)'
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
                            description: 'X position as percentage of card width (0-100)'
                        },
                        y_percent: {
                            type: 'number',
                            minimum: 0,
                            maximum: 100,
                            description: 'Y position as percentage of card height (0-100)'
                        },
                        rotation: {
                            type: 'number',
                            minimum: -360,
                            maximum: 360,
                            default: 0,
                            description: 'Text rotation in degrees (-360 to 360)',
                            'x-ui-hints': {
                                label: 'Rotation',
                                helper: 'Rotate text in degrees (negative = counter-clockwise)',
                                selector: {
                                    number: {
                                        mode: 'slider',
                                        step: 1,
                                        unit_of_measurement: '°'
                                    }
                                }
                            }
                        },
                        padding: paddingSchema,
                        font_size: {
                            oneOf: [
                                {
                                    type: 'number',
                                    minimum: 1,
                                    maximum: 200,
                                    description: 'Font size in pixels (1-200)'
                                },
                                {
                                    type: 'string',
                                    pattern: '^(\\d+px|\\d+\\.?\\d*rem|\\d+\\.?\\d*em|var\\(--[a-z-]+\\))$',
                                    description: 'CSS value or theme token',
                                    examples: ['14px', '1.2rem', 'var(--lcars-text-size)']
                                }
                            ],
                            'x-ui-hints': {
                                label: 'Font Size',
                                helper: 'Size in pixels (recommended) or CSS units',
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
                        color: stateColorSchema,
                        font_weight: {
                            type: 'string',
                            enum: ['normal', 'bold', '100', '200', '300', '400', '500', '600', '700', '800', '900'],
                            default: 'normal',
                            description: 'Font weight (normal=400, bold=700)',
                            enumDescriptions: [
                                'Normal weight (400)',
                                'Bold weight (700)',
                                'Thin (100)',
                                'Extra Light (200)',
                                'Light (300)',
                                'Normal (400)',
                                'Medium (500)',
                                'Semi Bold (600)',
                                'Bold (700)',
                                'Extra Bold (800)',
                                'Black (900)'
                            ]
                        },
                        font_family: {
                            type: 'string',
                            format: 'font-family',
                            pattern: '^[a-zA-Z0-9_ -]+(,\\s*[a-zA-Z0-9_ "-]+)*$',
                            description: 'CSS font-family (single font or comma-separated stack)',
                            examples: ['Arial', 'lcards_title', 'Antonio, sans-serif', '"Roboto Mono", monospace']
                        },
                        text_transform: {
                            type: 'string',
                            enum: ['none', 'uppercase', 'lowercase', 'capitalize'],
                            default: 'none',
                            description: 'Text transformation',
                            enumDescriptions: [
                                'No transformation (original case)',
                                'ALL UPPERCASE',
                                'all lowercase',
                                'Capitalize First Letter'
                            ]
                        },
                        anchor: {
                            type: 'string',
                            enum: ['start', 'middle', 'end'],
                            default: 'middle',
                            description: 'Horizontal text alignment',
                            enumDescriptions: [
                                'Left-aligned',
                                'Center-aligned',
                                'Right-aligned'
                            ]
                        },
                        baseline: {
                            type: 'string',
                            enum: ['hanging', 'middle', 'central', 'alphabetic'],
                            default: 'middle',
                            description: 'Vertical text alignment',
                            enumDescriptions: [
                                'Top of text box',
                                'Center of text box',
                                'Mathematical center',
                                'Bottom of text (baseline)'
                            ]
                        },
                        template: {
                            type: 'boolean',
                            default: false,
                            description: 'Enable template string evaluation (e.g., {{entity.state}})'
                        }
                    }
                }
            },

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
                pattern: '^(mdi|si):[a-z0-9-]+$',
                description: 'Icon identifier (format: mdi:icon-name or si:icon-name)',
                examples: ['mdi:lightbulb', 'mdi:home', 'si:github', 'mdi:thermometer']
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
                description: 'Fixed size for icon area in pixels (width for left/right, height for top/bottom, default: 60)'
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
                        maximum: 20,
                        default: 0,
                        description: 'Divider width in pixels (0 = no divider, default: 0)'
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
                        description: 'Icon size in pixels (8-200, default: 24)'
                    },
                    rotation: {
                        type: 'number',
                        minimum: -360,
                        maximum: 360,
                        default: 0,
                        description: 'Icon rotation in degrees (-360 to 360)'
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
                        description: 'Spacing between icon and text in pixels (default: 8)'
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
                                    { type: 'number', minimum: 0, maximum: 100 },
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
                                ],
                                'x-ui-hints': {
                                    label: 'Border Radius',
                                    helper: 'Use number for uniform corners, or object for per-corner control',
                                    defaultOneOfBranch: 0,
                                    selector: {
                                        number: {
                                            mode: 'slider',
                                            step: 1,
                                            unit_of_measurement: 'px'
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
            grid_options: {
                type: 'object',
                description: 'Advanced grid layout options',
                properties: {
                    columns: {
                        type: 'number',
                        minimum: 1,
                        maximum: 24,
                        description: 'Number of columns this card spans (1-24)'
                    },
                    rows: {
                        type: 'number',
                        minimum: 1,
                        maximum: 100,
                        description: 'Number of rows this card spans (1-100)'
                    }
                }
            }
        }
    };
}
