/**
 * Slider Card Schema - Unified
 *
 * Complete schema for slider card validation.
 * Uses shared schema components from common-schemas.js for consistency.
 *
 * This schema is ONLY for validation, not UI generation.
 * Editor UI is defined separately in lcards-slider-editor.js config.
 */

import { dataSourcesSchema, simpleColorSchema, stateColorSchema, paddingSchema, getTextSchema, gridOptionsSchema, entitySchema, cardIdSchema, tagsSchema } from './common-schemas.js';

/**
 * Get complete slider card schema
 * @param {Object} options - Schema options
 * @param {Array<string>} options.availablePresets - Available preset names
 * @param {Array<string>} options.availableComponents - Available component names
 * @param {Array<string>} options.positionEnum - Available position values for text fields
 * @returns {Object} Complete slider schema
 */
export function getSliderSchema(options = {}) {
    const {
        availablePresets = [],
        availableComponents = [],
        positionEnum = []
    } = options;

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

            data_sources: dataSourcesSchema,

            // ============================================================================
            // CORE PROPERTIES
            // ============================================================================

            entity: entitySchema,

            id: cardIdSchema,

            tags: tagsSchema,

            // ============================================================================
            // MODE: PRESET OR COMPONENT
            // ============================================================================

            preset: {
                type: 'string',
                enum: availablePresets,
                description: 'Style preset name (mutually exclusive with advanced component)',
                examples: ['pills-basic', 'gauge-basic', 'lozenge-basic', 'lozenge-horizontal'],
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
                    },
                    invert_value: {
                        type: 'boolean',
                        default: false,
                        description: 'Invert value mapping (flip min↔max). When true, slider at min position sends max value to entity.',
                        examples: [false, true]
                    }
                }
            },

            // ============================================================================
            // TEXT CONFIGURATION
            // ============================================================================

            text: getTextSchema({ positionEnum }),

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
                            enum: ['toggle', 'call-service', 'perform-action', 'navigate', 'url', 'more-info', 'assist', 'none'],
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
                                enum: ['pills', 'gauge', 'lozenge'],
                                description: 'Track visual style (pills = segmented, gauge = ruler, lozenge = solid fill clipped to pill shape)',
                                enumDescriptions: [
                                    'Segmented pill style (interactive sliders)',
                                    'Ruler gauge style (typically for display)',
                                    'Solid fill inside a pill-shaped lozenge (use with component: lozenge)'
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
                                ],
                                'x-ui-hints': {
                                    selector: { number: { min: 10, max: 200, mode: 'box', unit_of_measurement: 'px' } },
                                    label: 'Height',
                                    helper: 'Track height in pixels (use YAML for theme tokens)'
                                }
                            },
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
                            invert_fill: {
                                type: 'boolean',
                                default: false,
                                description: 'Invert visual fill direction. When true, fills from opposite end (right/top instead of left/bottom).',
                                examples: [false, true]
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
                                        'x-ui-hints': {
                                            selector: { number: { min: 0, max: 50, mode: 'box', unit_of_measurement: 'px' } },
                                            label: 'Gap Size',
                                            helper: 'Space between segments in pixels (use YAML for theme tokens)'
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
                                                ],
                                                'x-ui-hints': {
                                                    selector: { number: { min: 0, max: 50, mode: 'box', unit_of_measurement: 'px' } },
                                                    label: 'Border Radius',
                                                    helper: 'Corner roundness in pixels (use YAML for theme tokens)'
                                                }
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
                                            { type: 'number', minimum: 1, maximum: 100 },
                                            { type: 'string' }
                                        ],
                                        'x-ui-hints': {
                                            selector: { number: { min: 1, max: 100, mode: 'box', unit_of_measurement: 'px' } },
                                            label: 'Height',
                                            helper: 'Cross-sectional thickness (width in vertical, height in horizontal)'
                                        }
                                    },
                                    align: {
                                        type: 'string',
                                        enum: ['start', 'middle', 'end'],
                                        default: 'middle',
                                        'x-ui-hints': {
                                            selector: {
                                                select: {
                                                    mode: 'dropdown',
                                                    options: [
                                                        { value: 'start', label: 'Start' },
                                                        { value: 'middle', label: 'Middle' },
                                                        { value: 'end', label: 'End' }
                                                    ]
                                                }
                                            },
                                            label: 'Alignment',
                                            helper: 'Cross-sectional alignment (left/middle/right in vertical, top/middle/bottom in horizontal)'
                                        }
                                    },
                                    padding: {
                                        type: 'object',
                                        description: 'Padding to offset from aligned position',
                                        properties: {
                                            top: { type: 'number', minimum: 0 },
                                            right: { type: 'number', minimum: 0 },
                                            bottom: { type: 'number', minimum: 0 },
                                            left: { type: 'number', minimum: 0 }
                                        }
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
                                            show_unit: {
                                                type: 'boolean',
                                                description: 'Show unit suffix on scale labels. Set false to hide even when entity has unit_of_measurement.',
                                                examples: [true, false]
                                            },
                                            unit: {
                                                type: 'string',
                                                description: 'Unit suffix for labels. Takes priority over entity unit_of_measurement.',
                                                examples: ['°C', '%', 'lux']
                                            },
                                            color: stateColorSchema,
                                            font_size: { type: 'number' },
                                            padding: { type: 'number' }
                                        }
                                    }
                                }
                            },
                            indicator: {
                                type: 'object',
                                description: 'Current value indicator configuration',
                                properties: {
                                    enabled: {
                                        type: 'boolean',
                                        description: 'Show/hide current value indicator'
                                    },
                                    type: {
                                        type: 'string',
                                        enum: ['line', 'round', 'triangle'],
                                        description: 'Indicator shape type'
                                    },
                                    size: {
                                        type: 'object',
                                        description: 'Indicator dimensions',
                                        properties: {
                                            width: {
                                                type: 'number',
                                                minimum: 0,
                                                description: 'Indicator width in pixels (or rx for round type)'
                                            },
                                            height: {
                                                type: 'number',
                                                minimum: 0,
                                                description: 'Indicator height in pixels (or ry for round type)'
                                            }
                                        }
                                    },
                                    rotation: {
                                        type: 'number',
                                        minimum: -180,
                                        maximum: 180,
                                        default: 0,
                                        description: 'Rotation angle in degrees (for triangle type)',
                                        'x-ui-hints': {
                                            label: 'Rotation',
                                            helper: 'Rotate indicator in degrees',
                                            selector: {
                                                number: {
                                                    mode: 'slider',
                                                    min: -180,
                                                    max: 180,
                                                    step: 1,
                                                    unit_of_measurement: '°'
                                                }
                                            }
                                        }
                                    },
                                    offset: {
                                        type: 'object',
                                        description: 'Position offset relative to progress bar end',
                                        properties: {
                                            x: {
                                                type: 'number',
                                                description: 'Horizontal offset in pixels'
                                            },
                                            y: {
                                                type: 'number',
                                                description: 'Vertical offset in pixels'
                                            }
                                        }
                                    },
                                    color: stateColorSchema,
                                    border: {
                                        type: 'object',
                                        description: 'Indicator border configuration',
                                        properties: {
                                            enabled: {
                                                type: 'boolean',
                                                description: 'Enable indicator border'
                                            },
                                            width: {
                                                type: 'number',
                                                minimum: 0,
                                                description: 'Border width in pixels'
                                            },
                                            color: stateColorSchema
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
                    },

                    // ====================================================================
                    // RANGES CONFIGURATION (Phase 2)
                    // ====================================================================

                    ranges: {
                        type: 'array',
                        description: 'Color-coded value ranges for visual context (backgrounds in gauge mode, gradient overrides in pills mode)',
                        items: {
                            type: 'object',
                            properties: {
                                min: {
                                    type: 'number',
                                    description: 'Range start value (in display space, matching style.track.display.min/max)',
                                    examples: [0, 18, 80]
                                },
                                max: {
                                    type: 'number',
                                    description: 'Range end value (in display space, matching style.track.display.min/max)',
                                    examples: [20, 24, 100]
                                },
                                color: {
                                    type: 'string',
                                    pattern: '^(#[0-9A-Fa-f]{6}|#[0-9A-Fa-f]{8}|transparent|theme:|rgb\\(|rgba\\(|hsl\\(|var\\(--)',
                                    description: 'Range background color (hex, rgba, theme token, or CSS variable)',
                                    examples: ['var(--error-color)', '#ff0000', 'rgba(255,0,0,0.3)', 'theme:palette.danger']
                                },
                                label: {
                                    type: 'string',
                                    description: 'Optional descriptive label for this range (used in future Picard inset borders)',
                                    examples: ['Cold', 'Normal', 'Hot', 'Critical', 'Standby']
                                },
                                opacity: {
                                    type: 'number',
                                    minimum: 0,
                                    maximum: 1,
                                    default: 0.3,
                                    description: 'Background opacity (0=transparent, 1=solid, default: 0.3)'
                                }
                            },
                            required: ['min', 'max', 'color']
                        },
                        examples: [
                            [
                                { min: 0, max: 20, color: 'var(--error-color)', label: 'Low', opacity: 0.3 },
                                { min: 20, max: 80, color: 'var(--success-color)', label: 'Normal', opacity: 0.3 },
                                { min: 80, max: 100, color: 'var(--warning-color)', label: 'High', opacity: 0.3 }
                            ]
                        ],
                        'x-ui-hints': {
                            label: 'Value Ranges',
                            helper: 'Define color-coded zones to provide visual context for values (e.g., cold/comfort/hot)'
                        }
                    },

                    lozenge: {
                        type: 'object',
                        description: 'Lozenge component configuration (used with component: lozenge)',
                        properties: {
                            radius: {
                                type: 'number',
                                description: 'Override pill radius in pixels (defaults to auto = min(lozengeW,lozengeH)/2)',
                                examples: [20, 40]
                            },
                            fill: {
                                type: 'object',
                                description: 'Lozenge value fill appearance',
                                properties: {
                                    color: {
                                        type: 'string',
                                        description: 'Fill colour (the "filled" portion of the lozenge)',
                                        default: '#93e1ff',
                                        examples: ['#93e1ff', 'theme:palette.moonlight', 'var(--lcards-blue-light)']
                                    }
                                }
                            },
                            label: {
                                type: 'object',
                                description: 'Label band sizes (pixels reserved outside the lozenge body)',
                                properties: {
                                    top:    { type: 'object', properties: { size: { type: 'number', default: 36 } } },
                                    bottom: { type: 'object', properties: { size: { type: 'number', default: 28 } } },
                                    left:   { type: 'object', properties: { size: { type: 'number', default: 60 } } },
                                    right:  { type: 'object', properties: { size: { type: 'number', default: 60 } } }
                                }
                            },
                            track: {
                                type: 'object',
                                description: 'Lozenge track appearance',
                                properties: {
                                    background: {
                                        type: 'string',
                                        description: 'Lozenge track background colour (the "empty" portion of the pill)',
                                        default: 'theme:components.slider.track.background',
                                        examples: ['#12121c', 'theme:components.slider.track.background', 'var(--lcards-black-medium)']
                                    }
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
                default: 2,
                description: 'Card height in grid rows (1-100, default: 2)',
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
            grid_options: gridOptionsSchema
        }
    };
}
