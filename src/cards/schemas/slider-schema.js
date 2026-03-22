/**
 * Slider Card Schema - Unified
 *
 * Complete schema for slider card validation.
 * Uses shared schema components from common-schemas.js for consistency.
 *
 * This schema is ONLY for validation, not UI generation.
 * Editor UI is defined separately in lcards-slider-editor.js config.
 */

import { dataSourcesSchema, simpleColorSchema, stateColorSchema, paddingSchema, getTextSchema, gridOptionsSchema, entitySchema, cardIdSchema, tagsSchema, actionSchema, cardHeightSchema, cardWidthSchema } from './common-schemas.js';

/**
 * Get complete slider card schema
 * @param {Object} [options] - Schema options
 * @param {Array<string>} [options.availablePresets] - Available preset names
 * @param {Array<string>} [options.availableComponents] - Available component names
 * @param {Array<string>} [options.positionEnum] - Available position values for text fields
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
            // SIZING
            // ============================================================================

            height: cardHeightSchema,

            width: cardWidthSchema,


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
                // Only enforce enum when components are actually registered;
                // if availableComponents is empty the enum would reject all values
                ...(availableComponents.length > 0 ? { enum: availableComponents } : {}),
                description: 'Advanced SVG component name (provides the SVG shell)',
                examples: ['default', 'horizontal', 'vertical', 'picard-vertical']
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
                                enum: ['pills', 'gauge', 'shaped'],
                                description: 'Track visual style (pills = segmented, gauge = ruler, shaped = solid fill inside a clip-path shape)',
                                enumDescriptions: [
                                    'Segmented pill style (interactive sliders)',
                                    'Ruler gauge style (typically for display)',
                                    'Solid fill clipped to a shape boundary (use with component: shaped)'
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
                                        description: 'Colour gradient configuration',
                                        properties: {
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
                                    layer: {
                                        type: 'string',
                                        enum: ['background', 'foreground'],
                                        default: 'background',
                                        'x-ui-hints': {
                                            selector: {
                                                select: {
                                                    mode: 'dropdown',
                                                    options: [
                                                        { value: 'background', label: 'Background (behind ticks)' },
                                                        { value: 'foreground', label: 'Foreground (in front of ticks)' }
                                                    ]
                                                }
                                            },
                                            label: 'Layer',
                                            helper: 'Whether the progress bar renders behind or in front of gauge tick marks'
                                        }
                                    },
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
                            },
                            marker_indicator: {
                                type: 'object',
                                description: 'Default shape for value-marker indicators (ranges with a "value" key). Overrides global defaults for this preset/component. Can still be overridden per-range via the range\'s own "indicator" block. Defaults: type=triangle, size=20×20, rotation=180.',
                                properties: {
                                    type: {
                                        type: 'string',
                                        enum: ['line', 'round', 'triangle'],
                                        description: 'Marker indicator shape type (default: triangle)'
                                    },
                                    align: {
                                        type: 'string',
                                        enum: ['start', 'center', 'end'],
                                        default: 'center',
                                        description: 'Cross-axis alignment within the track zone. start=left edge (vertical)/top (horizontal), center=middle, end=right/bottom. Use start on Picard to pin the marker to the tick column regardless of card width.',
                                        'x-ui-hints': {
                                            label: 'Cross-axis Align',
                                            helper: 'Where to pin the marker along the non-value axis (start = tick-edge on Picard)',
                                            selector: { select: { mode: 'dropdown', options: [
                                                { value: 'start', label: 'Start (left / top)' },
                                                { value: 'center', label: 'Center (default)' },
                                                { value: 'end', label: 'End (right / bottom)' }
                                            ]}}
                                        }
                                    },
                                    size: {
                                        type: 'object',
                                        properties: {
                                            width: { type: 'number', minimum: 0, description: 'Width in pixels' },
                                            height: { type: 'number', minimum: 0, description: 'Height in pixels' }
                                        }
                                    },
                                    rotation: {
                                        type: 'number',
                                        minimum: -180,
                                        maximum: 180,
                                        default: 180,
                                        description: 'Rotation in degrees (default: 180 — triangle points toward ticks)',
                                        'x-ui-hints': {
                                            selector: { number: { mode: 'slider', min: -180, max: 180, step: 1, unit_of_measurement: '°' } }
                                        }
                                    },
                                    offset: {
                                        type: 'object',
                                        description: 'Fine-tune position within the track zone after align is applied. offset.x=minorHeight+trimWidth (default 20) places the triangle tip at the outer edge of minor ticks when align=start.',
                                        properties: {
                                            x: { type: 'number', description: 'Horizontal offset in pixels' },
                                            y: { type: 'number', description: 'Vertical offset in pixels' }
                                        }
                                    },
                                    color: stateColorSchema,
                                    border: {
                                        type: 'object',
                                        properties: {
                                            enabled: { type: 'boolean' },
                                            width: { type: 'number', minimum: 0 },
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
                        description: 'Per-side border configuration with optional corner radius',
                        properties: {
                            radius: {
                                oneOf: [
                                    {
                                        type: 'number',
                                        minimum: 0,
                                        description: 'Uniform corner radius in pixels applied to all four card corners',
                                        examples: [12, 8, 0]
                                    },
                                    {
                                        type: 'string',
                                        description: 'CSS variable or px/rem value for uniform corner radius — resolved at render time',
                                        examples: [
                                            'var(--ha-card-border-radius)',
                                            'var(--ha-card-border-radius, 12px)',
                                            '12px',
                                            '0.75rem'
                                        ]
                                    },
                                    {
                                        type: 'object',
                                        description: 'Per-corner radius — use to round only specific corners (e.g. only the free end on a bordered LCARS slider). Each corner also accepts a CSS variable string.',
                                        properties: {
                                            top_left:     { oneOf: [ { type: 'number', minimum: 0 }, { type: 'string' } ] },
                                            top_right:    { oneOf: [ { type: 'number', minimum: 0 }, { type: 'string' } ] },
                                            bottom_right: { oneOf: [ { type: 'number', minimum: 0 }, { type: 'string' } ] },
                                            bottom_left:  { oneOf: [ { type: 'number', minimum: 0 }, { type: 'string' } ] }
                                        }
                                    }
                                ],
                                description: 'Corner radius — number or CSS variable string for uniform rounding, or per-corner object. Supports var(--ha-card-border-radius), px values, and rem values.',
                                examples: [
                                    12,
                                    'var(--ha-card-border-radius)',
                                    'var(--ha-card-border-radius, 12px)',
                                    { top_left: 0, bottom_left: 0, top_right: 'var(--ha-card-border-radius)', bottom_right: 'var(--ha-card-border-radius)' }
                                ],
                                'x-ui-hints': {
                                    label: 'Corner Radius',
                                    helper: 'Round the card corners. Accepts a pixel number, a CSS variable (e.g. var(--ha-card-border-radius)), or YAML per-corner object for individual corner control.',
                                    selector: { number: { min: 0, max: 200, mode: 'box', unit_of_measurement: 'px' } }
                                }
                            },
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
                        description: 'Colour-coded value ranges and point markers.\n\nTwo item types:\n• Band range (min+max): coloured background zone — rect in gauge mode, segment overrides in pills mode.\n• Value marker (value): live point indicator — triangle on gauge ticks, highlighted pill in pills mode. Resolves {entity.attributes.x}, {states.id.state}, and [[[JS]]] templates.',
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
                                    description: 'Range background colour (hex, rgba, named colour, theme token, or CSS variable)',
                                    examples: ['var(--error-color)', '#ff0000', 'rgba(255,0,0,0.3)', 'theme:palette.danger', 'orange', 'transparent']
                                },
                                opacity: {
                                    type: 'number',
                                    minimum: 0,
                                    maximum: 1,
                                    default: 0.3,
                                    description: 'Background opacity (0=transparent, 1=solid, default: 0.3)'
                                },
                                value: {
                                    type: ['string', 'number'],
                                    description: 'Numeric value or template resolving to a position on the track. When present (instead of min/max), renders a point marker rather than a coloured band. Supports {entity.attributes.xxx}, {states.entity_id.state}, and [[[JS]]] templates.',
                                    'x-ui-hints': {
                                        label: 'Marker Value',
                                        helper: 'Template or number — places a visual marker at this value rather than drawing a coloured band'
                                    }
                                },
                                indicator: {
                                    type: 'object',
                                    description: 'Gauge mode: per-marker indicator shape override. Fallback chain: this block → style.gauge.marker_indicator (preset default) → hardcoded defaults (triangle 20×20, rotation 180, no border). Values not specified here inherit from the next level in the chain.',
                                    properties: {
                                        type: { type: 'string', enum: ['line', 'round', 'triangle'], description: 'Indicator shape type (default: triangle)' },
                                        align: {
                                            type: 'string',
                                            enum: ['start', 'center', 'end'],
                                            default: 'center',
                                            description: 'Cross-axis alignment: start=left/top edge, center=middle, end=right/bottom. Overrides the preset marker_indicator.align for this range only.'
                                        },
                                        color: { type: 'string', description: 'Indicator fill color (defaults to range color)' },
                                        size: {
                                            type: 'object',
                                            properties: {
                                                width: { type: 'number', description: 'Width in pixels' },
                                                height: { type: 'number', description: 'Height in pixels' }
                                            }
                                        },
                                        offset: {
                                            type: 'object',
                                            properties: {
                                                x: { type: 'number', description: 'Horizontal offset in pixels' },
                                                y: { type: 'number', description: 'Vertical offset in pixels' }
                                            }
                                        },
                                        rotation: { type: 'number', description: 'Rotation angle in degrees' },
                                        border: {
                                            type: 'object',
                                            properties: {
                                                enabled: { type: 'boolean', default: true },
                                                color: { type: 'string' },
                                                width: { type: 'number' }
                                            }
                                        }
                                    }
                                },
                                pill_style: {
                                    type: 'object',
                                    description: 'Pills mode: visual appearance of the marker pill.',
                                    properties: {
                                        stroke: { type: 'boolean', default: true, description: 'Show an outline border on the marker pill to distinguish it from neighbours' },
                                        stroke_width: { type: 'number', default: 2, description: 'Border thickness in pixels' }
                                    },
                                    'x-ui-hints': {
                                        label: 'Pill Marker Style',
                                        helper: 'Controls how the marker pill appears in pills mode'
                                    }
                                }
                            }
                        },
                        examples: [
                            [
                                { min: 0, max: 20, color: 'var(--error-color)', opacity: 0.3 },
                                { min: 20, max: 80, color: 'var(--success-color)', opacity: 0.3 },
                                { min: 80, max: 100, color: 'var(--warning-color)', opacity: 0.3 }
                            ]
                        ],
                        'x-ui-hints': {
                            label: 'Value Ranges',
                            helper: 'Define colour-coded zones to provide visual context for values (e.g., cold/comfort/hot)'
                        }
                    },

                    // ====================================================================
                    // SHAPED COMPONENT CONFIGURATION
                    // ====================================================================

                    shaped: {
                        type: 'object',
                        description: 'Shaped component configuration (used with component: shaped)',
                        properties: {
                            type: {
                                type: 'string',
                                enum: ['lozenge', 'rect', 'rounded', 'diamond', 'hexagon', 'polygon', 'path'],
                                default: 'lozenge',
                                description: 'Shape boundary for the clip path',
                                'x-ui-hints': {
                                    label: 'Shape Type',
                                    helper: 'Geometry used to clip the slider fill'
                                }
                            },
                            radius: {
                                type: 'number',
                                description: 'Corner radius in pixels — lozenge auto = min(w,h)/2, rounded default = 8',
                                examples: [8, 20, 40],
                                'x-ui-hints': {
                                    label: 'Corner Radius',
                                    helper: 'Override automatic corner radius (lozenge / rounded shapes)',
                                    selector: { number: { min: 0, max: 200, mode: 'box', unit_of_measurement: 'px' } }
                                }
                            },
                            fill: {
                                type: 'object',
                                description: 'Value fill appearance (the “filled” portion of the shape)',
                                properties: {
                                    color: {
                                        type: 'string',
                                        description: 'Fill colour',
                                        default: '#93e1ff',
                                        examples: ['#93e1ff', 'theme:palette.moonlight', 'var(--lcards-blue-light)']
                                    }
                                }
                            },
                            text_bands: {
                                type: 'object',
                                description: 'Band sizes (pixels reserved outside the shape body for text fields)',
                                properties: {
                                    top: {
                                        type: 'object',
                                        description: 'Top band (vertical mode only)',
                                        properties: { size: { type: 'number', default: 36, 'x-ui-hints': { selector: { number: { min: 0, max: 200, mode: 'box', unit_of_measurement: 'px' } } } } }
                                    },
                                    bottom: {
                                        type: 'object',
                                        description: 'Bottom band (vertical mode only)',
                                        properties: { size: { type: 'number', default: 28, 'x-ui-hints': { selector: { number: { min: 0, max: 200, mode: 'box', unit_of_measurement: 'px' } } } } }
                                    },
                                    left: {
                                        type: 'object',
                                        description: 'Left band (horizontal mode only)',
                                        properties: { size: { type: 'number', default: 60, 'x-ui-hints': { selector: { number: { min: 0, max: 200, mode: 'box', unit_of_measurement: 'px' } } } } }
                                    },
                                    right: {
                                        type: 'object',
                                        description: 'Right band (horizontal mode only)',
                                        properties: { size: { type: 'number', default: 60, 'x-ui-hints': { selector: { number: { min: 0, max: 200, mode: 'box', unit_of_measurement: 'px' } } } } }
                                    }
                                }
                            },
                            track: {
                                type: 'object',
                                description: 'Shape track appearance',
                                properties: {
                                    background: {
                                        type: 'string',
                                        description: 'Shape interior background colour (the “empty” portion)',
                                        default: 'theme:components.slider.track.background',
                                        examples: ['#12121c', 'theme:components.slider.track.background', 'var(--lcards-black-medium)']
                                    }
                                }
                            },
                            polygon: {
                                type: 'object',
                                description: 'Polygon shape options (shape type: polygon)',
                                properties: {
                                    points: {
                                        type: 'array',
                                        description: 'Array of [xPct, yPct] pairs (0–1) defining polygon vertices relative to shape bounds',
                                        items: {
                                            type: 'array',
                                            items: { type: 'number', minimum: 0, maximum: 1 },
                                            minItems: 2,
                                            maxItems: 2
                                        }
                                    }
                                }
                            },
                            path: {
                                type: 'object',
                                description: 'Raw SVG path options (shape type: path)',
                                properties: {
                                    d: {
                                        type: 'string',
                                        description: 'SVG path d-attribute (absolute coordinates)'
                                    },
                                    translate: {
                                        type: 'boolean',
                                        default: false,
                                        description: 'Wrap path in translate(bodyX, bodyY) so coordinates are relative to the shape body origin'
                                    }
                                }
                            }
                        }
                    }
                }
            },

            grid_options: gridOptionsSchema
        }
    };
}
