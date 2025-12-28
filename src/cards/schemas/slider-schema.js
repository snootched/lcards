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
                examples: ['light.bedroom', 'cover.garage', 'sensor.temperature']
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
                examples: ['pills-basic', 'gauge-basic']
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
                        examples: [0, -100, 16]
                    },
                    max: {
                        type: 'number',
                        description: 'Maximum value',
                        examples: [100, 255, 30]
                    },
                    step: {
                        type: 'number',
                        minimum: 0.01,
                        description: 'Step increment',
                        examples: [1, 0.5, 5]
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
                                        maximum: 100,
                                        default: 15,
                                        description: 'Number of pill segments'
                                    },
                                    gap: {
                                        oneOf: [
                                            {
                                                type: 'number',
                                                minimum: 0,
                                                maximum: 50,
                                                description: 'Gap between pills in pixels'
                                            },
                                            {
                                                type: 'string',
                                                pattern: '^(\\d+px|theme:)',
                                                description: 'CSS value or theme token'
                                            }
                                        ]
                                    },
                                    shape: {
                                        type: 'object',
                                        properties: {
                                            radius: {
                                                oneOf: [
                                                    { type: 'number', minimum: 0 },
                                                    { type: 'string', pattern: '^(\\d+px|theme:)' }
                                                ]
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
                                            start: stateColorSchema,
                                            end: stateColorSchema
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
