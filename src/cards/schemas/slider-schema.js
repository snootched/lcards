/**
 * Slider Card Schema - Unified
 *
 * Complete schema for slider card validation.
 * All definitions inlined for simplicity - no $ref resolution needed.
 *
 * This schema is ONLY for validation, not UI generation.
 * Editor UI is defined separately in lcards-slider-editor.js config.
 */

/**
 * Get complete slider card schema
 * @param {Object} options - Schema options
 * @param {Array<string>} options.availablePresets - Available preset names
 * @param {Array<string>} options.availableComponents - Available component names
 * @returns {Object} Complete slider schema
 */
export function getSliderSchema(options = {}) {
    const {
        availablePresets = [],
        availableComponents = []
    } = options;

    // Reusable inline definitions
    const simpleColorSchema = {
        type: 'string',
        pattern: '^(#[0-9A-Fa-f]{6}|#[0-9A-Fa-f]{8}|transparent|theme:|rgb\\(|rgba\\(|hsl\\(|var\\(--)',
        description: 'Color value (hex, rgb, theme token, or CSS variable)',
        examples: ['#FF9900', 'transparent', 'theme:palette.moonlight', 'rgb(255, 153, 0)', 'var(--lcars-orange)']
    };

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
                    }
                }
            }
        ]
    };

    return {
        $schema: 'http://json-schema.org/draft-07/schema#',
        $id: 'https://github.com/snootched/lcards/schemas/slider-schema',
        title: 'LCARdS Slider Card Configuration',
        description: 'Complete configuration schema for lcards-slider custom card',
        type: 'object',
        properties: {
            // ============================================================================
            // HOME ASSISTANT REQUIRED PROPERTIES
            // ============================================================================

            type: {
                type: 'string',
                const: 'custom:lcards-slider',
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
                examples: ['light.bedroom', 'cover.garage', 'sensor.temperature'],
                'x-ui-hints': {
                    label: 'Entity',
                    helper: 'Select the entity this slider controls or displays',
                    selector: {
                        entity: {
                            // Domain filtering can be added if needed
                        }
                    }
                }
            },

            id: {
                type: 'string',
                pattern: '^[a-zA-Z0-9_-]+$',
                description: 'Custom overlay ID for rule targeting (alphanumeric, underscore, hyphen)',
                examples: ['main-slider', 'brightness_control', 'temp-gauge']
            },

            tags: {
                type: 'array',
                items: {
                    type: 'string',
                    pattern: '^[a-zA-Z0-9_-]+$'
                },
                description: 'Tags for bulk rule targeting (alphanumeric, underscore, hyphen)',
                examples: [['control', 'light'], ['display', 'sensor']]
            },

            // ============================================================================
            // MODE: PRESET OR COMPONENT
            // ============================================================================

            preset: {
                type: 'string',
                enum: availablePresets,
                description: 'Style preset name (mutually exclusive with advanced component)',
                examples: ['pills-basic', 'gauge-basic'],
                'x-ui-hints': {
                    label: 'Style Preset',
                    helper: 'Choose a pre-configured slider style'
                    // No selector - let auto-generation build it from enum
                }
            },

            component: {
                type: 'string',
                enum: availableComponents,
                description: 'Advanced SVG component name (provides the SVG shell)',
                examples: ['horizontal', 'vertical', 'picard-vertical']
            },

            // ============================================================================
            // CONTROL CONFIGURATION
            // ============================================================================

            control: {
                type: 'object',
                description: 'Control behavior configuration',
                properties: {
                    min: {
                        type: 'number',
                        description: 'Minimum value',
                        examples: [0, -100, 16],
                        'x-ui-hints': {
                            label: 'Minimum Value',
                            helper: 'Lowest value the slider can reach',
                            selector: {
                                number: {
                                    mode: 'box',
                                    step: 1
                                }
                            }
                        }
                    },
                    max: {
                        type: 'number',
                        description: 'Maximum value',
                        examples: [100, 255, 30],
                        'x-ui-hints': {
                            label: 'Maximum Value',
                            helper: 'Highest value the slider can reach',
                            selector: {
                                number: {
                                    mode: 'box',
                                    step: 1
                                }
                            }
                        }
                    },
                    step: {
                        type: 'number',
                        minimum: 0.01,
                        description: 'Step increment',
                        examples: [1, 0.5, 5],
                        'x-ui-hints': {
                            label: 'Step',
                            helper: 'Value increment/decrement step',
                            selector: {
                                number: {
                                    mode: 'box',
                                    step: 0.01
                                }
                            }
                        }
                    },
                    attribute: {
                        type: 'string',
                        description: 'Entity attribute to control (default varies by domain)',
                        examples: ['brightness', 'temperature', 'position', 'percentage']
                    },
                    locked: {
                        type: 'boolean',
                        description: 'Whether slider is read-only (auto-determined by domain)',
                        examples: [true, false]
                    }
                }
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
                        value: {
                            content: '{{entity.state}}',
                            position: 'center',
                            font_size: 18,
                            color: '#FFFFFF'
                        },
                        label: {
                            content: 'Temperature',
                            position: 'top',
                            font_size: 14,
                            color: '#FF9900'
                        }
                    }
                ],
                additionalProperties: {
                    type: 'object',
                    description: 'Named text field configuration (arbitrary key names)',
                    properties: {
                        content: {
                            type: 'string',
                            description: 'Text content (can be template)',
                            examples: ['Temperature', '{{entity.state}}', '{entity.attributes.brightness}']
                        },
                        template: {
                            type: 'boolean',
                            default: false,
                            description: 'Whether content is a template expression'
                        },
                        position: {
                            type: 'string',
                            description: 'Text position within slider bounds',
                            examples: ['center', 'top-left', 'bottom-right', 'top', 'bottom']
                        },
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
                            ]
                        },
                        color: stateColorSchema,
                        font_weight: {
                            type: 'string',
                            enum: ['normal', 'bold', '100', '200', '300', '400', '500', '600', '700', '800', '900'],
                            default: 'normal',
                            description: 'Font weight (normal=400, bold=700)'
                        },
                        font_family: {
                            type: 'string',
                            format: 'font-family',
                            description: 'Font family (LCARS uses Swiss 911 Ultra Compressed by default)',
                            examples: ['Swiss 911 Ultra Compressed', 'Antonio', 'Roboto', 'monospace']
                        }
                    }
                }
            },

            // ============================================================================
            // ACTIONS CONFIGURATION
            // ============================================================================

            actions: {
                type: 'object',
                description: 'Multi-action tap/hold/double-tap handlers',
                $comment: 'Actions use arbitrary keys (e.g., "tap", "hold", "custom1"). Each key defines an action configuration.',
                examples: [
                    {
                        tap: {
                            action: 'toggle',
                            target: 'entity'
                        },
                        hold: {
                            action: 'more-info',
                            target: 'entity'
                        }
                    }
                ],
                additionalProperties: {
                    type: 'object',
                    description: 'Named action configuration',
                    properties: {
                        action: {
                            type: 'string',
                            enum: ['toggle', 'call-service', 'navigate', 'url', 'more-info', 'none'],
                            description: 'Action type to perform',
                            enumDescriptions: [
                                'Toggle entity on/off',
                                'Call a Home Assistant service',
                                'Navigate to another dashboard/view',
                                'Open a URL',
                                'Show entity more-info dialog',
                                'Do nothing'
                            ]
                        },
                        target: {
                            type: 'string',
                            enum: ['entity', 'service', 'navigation', 'url'],
                            description: 'Target of the action (controls which additional properties are used)'
                        },
                        service: {
                            type: 'string',
                            pattern: '^[a-z_]+\\.[a-z0-9_]+$',
                            description: 'Service to call (format: domain.service_name)',
                            examples: ['light.turn_on', 'climate.set_temperature', 'script.my_script']
                        },
                        service_data: {
                            type: 'object',
                            description: 'Data to pass to the service call',
                            examples: [{ entity_id: 'light.bedroom', brightness: 255 }]
                        },
                        navigation_path: {
                            type: 'string',
                            description: 'Dashboard path to navigate to',
                            examples: ['/lovelace/lights', '/lovelace-dashboard/0']
                        },
                        url_path: {
                            type: 'string',
                            format: 'uri',
                            description: 'URL to open',
                            examples: ['https://example.com', '/local/custom.html']
                        },
                        confirmation: {
                            type: 'boolean',
                            default: false,
                            description: 'Show confirmation dialog before action'
                        }
                    }
                }
            },

            // ============================================================================
            // STYLE CONFIGURATION
            // ============================================================================

            style: {
                type: 'object',
                description: 'Visual style configuration',
                properties: {
                    track: {
                        type: 'object',
                        description: 'Track appearance configuration',
                        properties: {
                            display: {
                                type: 'object',
                                description: 'Visual display range configuration (what pills/gauge render). Defaults to control range if not specified.',
                                properties: {
                                    min: {
                                        type: 'number',
                                        description: 'Minimum value shown on visual scale (default: control.min)',
                                        examples: [0, -20, 10]
                                    },
                                    max: {
                                        type: 'number',
                                        description: 'Maximum value shown on visual scale (default: control.max)',
                                        examples: [100, 60, 35]
                                    },
                                    unit: {
                                        type: 'string',
                                        description: 'Display unit for labels (overrides entity unit_of_measurement)',
                                        examples: ['°C', '%', 'rpm', 'lux']
                                    }
                                }
                            },
                            type: {
                                type: 'string',
                                enum: ['pills', 'gauge'],
                                description: 'Track visual style (pills = segmented, gauge = ruler)',
                                enumDescriptions: [
                                    'Segmented pill style (interactive sliders)',
                                    'Ruler gauge style (typically for display)'
                                ]
                            },
                            height: {
                                oneOf: [
                                    {
                                        type: 'number',
                                        minimum: 10,
                                        maximum: 200,
                                        description: 'Track height in pixels'
                                    },
                                    {
                                        type: 'string',
                                        pattern: '^(\\d+px|\\d+\\.?\\d*rem|theme:)',
                                        description: 'CSS value or theme token',
                                        examples: ['40px', '2rem', 'theme:components.slider.track.height']
                                    }
                                ]
                            },
                            background: stateColorSchema,
                            margin: {
                                oneOf: [
                                    {
                                        type: 'number',
                                        minimum: 0,
                                        maximum: 100,
                                        description: 'Track margin in pixels (applies to all sides)',
                                        examples: [10, 0]
                                    },
                                    {
                                        type: 'object',
                                        description: 'Per-side margin configuration',
                                        properties: {
                                            top: {
                                                type: 'number',
                                                minimum: 0,
                                                maximum: 100,
                                                description: 'Top margin in pixels'
                                            },
                                            right: {
                                                type: 'number',
                                                minimum: 0,
                                                maximum: 100,
                                                description: 'Right margin in pixels'
                                            },
                                            bottom: {
                                                type: 'number',
                                                minimum: 0,
                                                maximum: 100,
                                                description: 'Bottom margin in pixels'
                                            },
                                            left: {
                                                type: 'number',
                                                minimum: 0,
                                                maximum: 100,
                                                description: 'Left margin in pixels'
                                            }
                                        },
                                        examples: [
                                            { top: 10, right: 5, bottom: 10, left: 5 },
                                            { top: 0, right: 0, bottom: 0, left: 0 }
                                        ]
                                    }
                                ]
                            },
                            orientation: {
                                type: 'string',
                                enum: ['horizontal', 'vertical'],
                                default: 'horizontal',
                                description: 'Slider orientation - affects track rendering direction',
                                enumDescriptions: [
                                    'Horizontal slider (left to right)',
                                    'Vertical slider (bottom to top)'
                                ]
                            },
                            segments: {
                                type: 'object',
                                description: 'Pills/segments configuration (for type: pills)',
                                properties: {
                                    enabled: {
                                        type: 'boolean',
                                        default: true,
                                        description: 'Enable segmented pills'
                                    },
                                    count: {
                                        type: 'number',
                                        minimum: 2,
                                        maximum: 200,
                                        default: 15,
                                        description: 'Number of pill segments (or "auto" to calculate based on size)'
                                    },
                                    gap: {
                                        oneOf: [
                                            {
                                                type: 'number',
                                                minimum: 0,
                                                maximum: 50,
                                                default: 4,
                                                description: 'Gap between pills in pixels'
                                            },
                                            {
                                                type: 'string',
                                                pattern: '^(\\d+px|theme:|\\{theme:)',
                                                description: 'CSS value or theme token'
                                            }
                                        ],
                                        "x-ui-hints": {
                                            "label": "Segment Gap",
                                            "helper": "Space between pill segments (pixels or theme token)",
                                            "selector": {
                                                "choose": {
                                                    "choices": {
                                                        "pixels": {
                                                            "selector": {
                                                                "number": {
                                                                    "mode": "slider",
                                                                    "min": 0,
                                                                    "max": 50,
                                                                    "step": 1,
                                                                    "slider_ticks": false,
                                                                    "unit_of_measurement": "px"
                                                                }
                                                            }
                                                        },
                                                        "theme": {
                                                            "selector": {
                                                                "text": {
                                                                    "placeholder": "{theme:spacing.sm}"
                                                                }
                                                            }
                                                        }
                                                    }
                                                }
                                            }
                                        }
                                    },
                                    shape: {
                                        type: 'object',
                                        properties: {
                                            radius: {
                                                oneOf: [
                                                    {
                                                        type: 'number',
                                                        minimum: 0,
                                                        maximum: 50,
                                                        default: 4,
                                                        description: 'Border radius in pixels'
                                                    },
                                                    {
                                                        type: 'string',
                                                        pattern: '^(\\d+px|theme:)',
                                                        description: 'CSS value or theme token'
                                                    }
                                                ]
                                            }
                                        }
                                    },
                                    size: {
                                        type: 'object',
                                        description: 'Pill dimensions (width for horizontal, height for vertical)',
                                        properties: {
                                            width: {
                                                type: 'number',
                                                minimum: 1,
                                                maximum: 200,
                                                default: 12,
                                                description: 'Fixed width of each pill in horizontal mode (pixels)'
                                            },
                                            height: {
                                                type: 'number',
                                                minimum: 1,
                                                maximum: 200,
                                                default: 12,
                                                description: 'Fixed height of each pill in vertical mode (pixels)'
                                            }
                                        }
                                    },
                                    gradient: {
                                        type: 'object',
                                        description: 'Color gradient configuration',
                                        properties: {
                                            interpolated: {
                                                type: 'boolean',
                                                default: true,
                                                description: 'Interpolate colors between start and end'
                                            },
                                            start: simpleColorSchema,
                                            end: simpleColorSchema
                                        }
                                    },
                                    appearance: {
                                        type: 'object',
                                        properties: {
                                            unfilled: {
                                                type: 'object',
                                                properties: {
                                                    opacity: {
                                                        type: 'number',
                                                        minimum: 0,
                                                        maximum: 1
                                                    }
                                                }
                                            },
                                            filled: {
                                                type: 'object',
                                                properties: {
                                                    opacity: {
                                                        type: 'number',
                                                        minimum: 0,
                                                        maximum: 1
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    },
                    gauge: {
                        type: 'object',
                        description: 'Gauge-specific configuration (for type: gauge)',
                        properties: {
                            progress_bar: {
                                type: 'object',
                                description: 'Progress indicator bar',
                                properties: {
                                    color: stateColorSchema,
                                    height: {
                                        oneOf: [
                                            { type: 'number' },
                                            { type: 'string' }
                                        ]
                                    },
                                    radius: {
                                        type: 'number',
                                        minimum: 0
                                    }
                                }
                            },
                            scale: {
                                type: 'object',
                                description: 'Gauge scale configuration',
                                properties: {
                                    tick_marks: {
                                        type: 'object',
                                        properties: {
                                            major: {
                                                type: 'object',
                                                properties: {
                                                    enabled: { type: 'boolean' },
                                                    interval: {
                                                        type: 'number',
                                                        minimum: 1,
                                                        description: 'Interval for major tick marks'
                                                    },
                                                    color: stateColorSchema,
                                                    height: { type: 'number' },
                                                    width: { type: 'number' }
                                                }
                                            },
                                            minor: {
                                                type: 'object',
                                                properties: {
                                                    enabled: { type: 'boolean' },
                                                    interval: {
                                                        type: 'number',
                                                        minimum: 1,
                                                        description: 'Interval for minor tick marks'
                                                    },
                                                    color: stateColorSchema,
                                                    height: { type: 'number' },
                                                    width: { type: 'number' }
                                                }
                                            }
                                        }
                                    },
                                    labels: {
                                        type: 'object',
                                        properties: {
                                            enabled: { type: 'boolean' },
                                            unit: {
                                                type: 'string',
                                                description: 'Unit suffix for labels',
                                                examples: ['°C', '%', 'lux']
                                            },
                                            color: stateColorSchema,
                                            font_size: { type: 'number' },
                                            padding: { type: 'number' }
                                        }
                                    }
                                }
                            }
                        }
                    },
                    text: {
                        type: 'object',
                        description: 'Text label configuration',
                        properties: {
                            default: {
                                type: 'object',
                                properties: {
                                    font_family: {
                                        type: 'string',
                                        format: 'font-family'
                                    },
                                    font_size: {
                                        oneOf: [
                                            { type: 'number' },
                                            { type: 'string' }
                                        ]
                                    },
                                    color: stateColorSchema
                                }
                            }
                        },
                        additionalProperties: {
                            type: 'object',
                            description: 'Named text field configuration'
                        }
                    },
                    border: {
                        type: 'object',
                        description: 'Per-side border configuration (left/top/right/bottom caps)',
                        properties: {
                            left: {
                                type: 'object',
                                description: 'Left border cap configuration',
                                properties: {
                                    enabled: {
                                        type: 'boolean',
                                        description: 'Enable left border'
                                    },
                                    size: {
                                        type: 'number',
                                        minimum: 0,
                                        description: 'Border width in pixels'
                                    },
                                    color: stateColorSchema
                                }
                            },
                            top: {
                                type: 'object',
                                description: 'Top border cap configuration',
                                properties: {
                                    enabled: {
                                        type: 'boolean',
                                        description: 'Enable top border'
                                    },
                                    size: {
                                        type: 'number',
                                        minimum: 0,
                                        description: 'Border height in pixels'
                                    },
                                    color: stateColorSchema
                                }
                            },
                            right: {
                                type: 'object',
                                description: 'Right border cap configuration',
                                properties: {
                                    enabled: {
                                        type: 'boolean',
                                        description: 'Enable right border'
                                    },
                                    size: {
                                        type: 'number',
                                        minimum: 0,
                                        description: 'Border width in pixels'
                                    },
                                    color: stateColorSchema
                                }
                            },
                            bottom: {
                                type: 'object',
                                description: 'Bottom border cap configuration',
                                properties: {
                                    enabled: {
                                        type: 'boolean',
                                        description: 'Enable bottom border'
                                    },
                                    size: {
                                        type: 'number',
                                        minimum: 0,
                                        description: 'Border height in pixels'
                                    },
                                    color: stateColorSchema
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
                description: 'Card width in grid columns (1-24, default: 4)'
            },
            height: {
                type: 'number',
                minimum: 1,
                maximum: 100,
                default: 2,
                description: 'Card height in grid rows (1-100, default: 2)'
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
