/**
 * Slider Card Schema - Unified
 *
 * Complete schema for slider card validation.
 * Uses shared schema components from common-schemas.js for consistency.
 *
 * This schema is ONLY for validation, not UI generation.
 * Editor UI is defined separately in lcards-slider-editor.js config.
 */

import { dataSourcesSchema, simpleColorSchema, stateColorSchema, paddingSchema, getTextSchema, gridOptionsSchema, entitySchema, cardIdSchema, tagsSchema, actionSchema, animationSchema, backgroundAnimationSchema, soundsSchema, cardHeightSchema, cardWidthSchema, cardMinHeightSchema, cardMinWidthSchema, cardMaxHeightSchema, cardMaxWidthSchema, cardOverflowSchema, cardOverflowXSchema, cardOverflowYSchema, cardZIndexSchema, triggersUpdateSchema, stateClassificationSchema } from './common-schemas.js';

// value_tween.ease options: every anime.js v4 named easing that takes no extra
// params (same set offered in lcards-animation-editor.js), plus 'spring' — the
// one parametrized option, which the card special-cases via anime.createSpring().
// Deliberately excludes cubicBezier/steps/custom-linear-points/irregular/custom,
// which require a params UI we're not building for this bespoke, single-card feature.
const _valueTweenEaseOptions = [
    { value: 'linear', label: 'Linear' },
    { value: 'in', label: 'Power - In' },
    { value: 'out', label: 'Power - Out' },
    { value: 'inOut', label: 'Power - In/Out' },
    { value: 'outIn', label: 'Power - Out/In' },
    { value: 'inQuad', label: 'Quad - In' },
    { value: 'outQuad', label: 'Quad - Out (default)' },
    { value: 'inOutQuad', label: 'Quad - In/Out' },
    { value: 'outInQuad', label: 'Quad - Out/In' },
    { value: 'inCubic', label: 'Cubic - In' },
    { value: 'outCubic', label: 'Cubic - Out' },
    { value: 'inOutCubic', label: 'Cubic - In/Out' },
    { value: 'outInCubic', label: 'Cubic - Out/In' },
    { value: 'inQuart', label: 'Quart - In' },
    { value: 'outQuart', label: 'Quart - Out' },
    { value: 'inOutQuart', label: 'Quart - In/Out' },
    { value: 'outInQuart', label: 'Quart - Out/In' },
    { value: 'inQuint', label: 'Quint - In' },
    { value: 'outQuint', label: 'Quint - Out' },
    { value: 'inOutQuint', label: 'Quint - In/Out' },
    { value: 'outInQuint', label: 'Quint - Out/In' },
    { value: 'inSine', label: 'Sine - In' },
    { value: 'outSine', label: 'Sine - Out' },
    { value: 'inOutSine', label: 'Sine - In/Out' },
    { value: 'outInSine', label: 'Sine - Out/In' },
    { value: 'inExpo', label: 'Expo - In' },
    { value: 'outExpo', label: 'Expo - Out' },
    { value: 'inOutExpo', label: 'Expo - In/Out' },
    { value: 'outInExpo', label: 'Expo - Out/In' },
    { value: 'inCirc', label: 'Circ - In' },
    { value: 'outCirc', label: 'Circ - Out' },
    { value: 'inOutCirc', label: 'Circ - In/Out' },
    { value: 'outInCirc', label: 'Circ - Out/In' },
    { value: 'inBack', label: 'Back - In' },
    { value: 'outBack', label: 'Back - Out' },
    { value: 'inOutBack', label: 'Back - In/Out' },
    { value: 'outInBack', label: 'Back - Out/In' },
    { value: 'inElastic', label: 'Elastic - In' },
    { value: 'outElastic', label: 'Elastic - Out' },
    { value: 'inOutElastic', label: 'Elastic - In/Out' },
    { value: 'outInElastic', label: 'Elastic - Out/In' },
    { value: 'inBounce', label: 'Bounce - In' },
    { value: 'outBounce', label: 'Bounce - Out' },
    { value: 'inOutBounce', label: 'Bounce - In/Out' },
    { value: 'outInBounce', label: 'Bounce - Out/In' },
    { value: 'spring', label: 'Spring - Physics-based' }
];

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

            triggers_update: triggersUpdateSchema,

            // ============================================================================
            // CORE PROPERTIES
            // ============================================================================

            entity: entitySchema,

            ranges_attribute: {
                type: 'string',
                description: 'Entity attribute to use as the numeric value for all range conditions (above:/below:/between: keys) in any state-based style config. Use "brightness_pct" for a computed 0–100 light brightness value. Defaults to evaluating the raw entity state string.',
                examples: ['brightness_pct', 'brightness', 'temperature', 'percentage', 'current_position'],
                'x-ui-hints': {
                    label: 'Range Attribute',
                    helper: 'Attribute to compare against range thresholds (above:/below:/between:). Use "brightness_pct" for lights. Leave blank to use entity state.'
                }
            },

            state_attribute: {
                type: 'string',
                description: 'Entity attribute whose String() value is used as the highest-priority key for ALL exact-match state-color lookups across the card. Booleans become "true"/"false"; null becomes "null"; strings are used as-is. Classified state (active/inactive) is always derived from entity.state and is unaffected. Can be used alongside ranges_attribute.',
                examples: ['effect', 'hvac_action', 'charging', 'preset_mode', 'color_mode'],
                'x-ui-hints': {
                    label: 'State Attribute',
                    helper: 'Attribute whose value is matched against color-config keys. Write YAML keys as strings (e.g. "fade", "true", "null"). Leave blank to match entity state directly.'
                }
            },

            state_classification: stateClassificationSchema,

            id: cardIdSchema,

            tags: tagsSchema,

            // ============================================================================
            // SIZING
            // ============================================================================

            height: cardHeightSchema,

            width: cardWidthSchema,

            min_height: cardMinHeightSchema,

            min_width: cardMinWidthSchema,

            max_height: cardMaxHeightSchema,

            max_width: cardMaxWidthSchema,

            overflow:   cardOverflowSchema,
            overflow_x: cardOverflowXSchema,
            overflow_y: cardOverflowYSchema,
            z_index:    cardZIndexSchema,


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
                                    },
                                    background: {
                                        type: 'object',
                                        description: 'Background track drawn behind the progress bar fill, clamped to control range. Leave unset for no background.',
                                        properties: {
                                            color: {
                                                ...stateColorSchema,
                                                description: 'Background track colour. Supports state-based maps.',
                                                'x-ui-hints': {
                                                    label: 'Background Colour',
                                                    helper: 'Colour for the background track. Supports state-reactive values.'
                                                }
                                            },
                                            height: {
                                                oneOf: [
                                                    { type: 'number', minimum: 1, maximum: 100 },
                                                    { type: 'string' }
                                                ],
                                                'x-ui-hints': {
                                                    selector: { number: { min: 1, max: 100, mode: 'box', unit_of_measurement: 'px' } },
                                                    label: 'Background Thickness',
                                                    helper: 'Cross-section of the background track. Defaults to the same as the progress bar height.'
                                                }
                                            },
                                            radius: {
                                                oneOf: [
                                                    { type: 'number', minimum: 0 },
                                                    {
                                                        type: 'object',
                                                        properties: {
                                                            start: { type: 'number', minimum: 0 },
                                                            end:   { type: 'number', minimum: 0 }
                                                        }
                                                    }
                                                ],
                                                'x-ui-hints': {
                                                    selector: { number: { min: 0, max: 50, mode: 'box', unit_of_measurement: 'px' } },
                                                    label: 'Background Radius',
                                                    helper: 'Corner radius for the background track. Defaults to progress_bar.radius if unset.'
                                                }
                                            },
                                            min: {
                                                type: 'number',
                                                'x-ui-hints': {
                                                    label: 'Background Start',
                                                    helper: 'Value at which the background track starts. Defaults to control.min (clamped to display range).'
                                                }
                                            },
                                            max: {
                                                type: 'number',
                                                'x-ui-hints': {
                                                    label: 'Background End',
                                                    helper: 'Value at which the background track ends. Defaults to control.max (clamped to display range).'
                                                }
                                            }
                                        },
                                        'x-ui-hints': {
                                            label: 'Background Track',
                                            helper: 'Optional track behind the progress bar fill, clamped to control range.'
                                        }
                                    },
                                    radius: {
                                        oneOf: [
                                            { type: 'number', minimum: 0 },
                                            {
                                                type: 'object',
                                                properties: {
                                                    start: { type: 'number', minimum: 0, description: 'Radius on start end (left for horizontal, bottom for vertical)' },
                                                    end:   { type: 'number', minimum: 0, description: 'Radius on end (right for horizontal, top for vertical)' }
                                                },
                                                'x-ui-hints': { label: 'Per-End Radius' }
                                            }
                                        ],
                                        'x-ui-hints': {
                                            selector: { number: { min: 0, max: 50, mode: 'box', unit_of_measurement: 'px' } },
                                            label: 'Corner Radius',
                                            helper: 'Uniform radius (number) or per-end via YAML: { start: 6, end: 0 }. start = left/bottom, end = right/top.'
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
                                        type: ['boolean', 'string'],
                                        description: 'Show/hide current value indicator. Also accepts a Jinja2/JS template string resolving to a boolean (e.g. "{{ not is_state(\'sensor.x\', \'unavailable\') }}") for state-driven visibility.',
                                        'x-ui-hints': {
                                            selector: { boolean: {} }
                                        }
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

                    range: {
                        type: 'object',
                        description: 'Visual styling for range-band frame/border elements (used by components like Picard that render a decorative frame around the ranges track).',
                        properties: {
                            border: {
                                type: 'object',
                                description: 'Range track border styling',
                                properties: {
                                    color: { ...stateColorSchema, description: 'Range border colour (default: theme:components.slider.range.border.color)' }
                                }
                            },
                            frame: {
                                type: 'object',
                                description: 'Range track frame styling (decorative outline, e.g. Picard component)',
                                properties: {
                                    color: { ...stateColorSchema, description: 'Range frame colour. Falls back to the top border colour if unset.' }
                                }
                            }
                        }
                    },

                    solid_bar: {
                        type: 'object',
                        description: 'Solid value-bar styling (used by components with a dedicated solid-bar zone, e.g. Picard).',
                        properties: {
                            color: { ...stateColorSchema, description: 'Solid bar colour. Falls back to the top border colour if unset.' }
                        }
                    },

                    animation: {
                        type: 'object',
                        description: 'Styling for the built-in scanning/activity animation indicator (used by components like Picard/Demo).',
                        properties: {
                            indicator: {
                                type: 'object',
                                properties: {
                                    color: { ...stateColorSchema, description: 'Animation indicator colour (default: theme:components.slider.animation.indicator.color)' }
                                }
                            }
                        }
                    },

                    // ====================================================================
                    // RANGES CONFIGURATION (Phase 2)
                    // ====================================================================

                    ranges: {
                        type: 'array',
                        description: 'Colour-coded value ranges and point markers.\n\nTwo item types:\n• Band range (min+max): coloured background zone — rect in gauge mode, segment overrides in pills mode.\n• Value marker (value): live point indicator — triangle on gauge ticks, highlighted pill in pills mode.\n\nmin/max/value resolve static numbers, {entity.state}/{entity.attributes.x}/{states.domain.object_id.state} tokens, {datasource:name}, {config.x}/{variables.x} tokens, theme token references, and [[[JS]]] — evaluated synchronously (no Jinja2; see range.label.text for full Jinja2/DataSource async support on the label caption).',
                        items: {
                            type: 'object',
                            properties: {
                                min: {
                                    type: ['number', 'string'],
                                    description: 'Range start value (in display space). Supports static numbers or templates: {entity.state}, {entity.attributes.xxx}, {states.domain.object_id.state}, {datasource:name}, {config.x}, {variables.x}, [[[JS return expr]]]. (Synchronous only — no Jinja2.)',
                                    examples: [0, 18, 80, '{entity.attributes.min_temp}', '{states.input_number.low.state}', '{datasource:low_threshold}', '[[[return Number(entity.state) - 5]]]']
                                },
                                max: {
                                    type: ['number', 'string'],
                                    description: 'Range end value (in display space). Supports static numbers or templates: {entity.state}, {entity.attributes.xxx}, {states.domain.object_id.state}, {datasource:name}, {config.x}, {variables.x}, [[[JS return expr]]]. (Synchronous only — no Jinja2.)',
                                    examples: [20, 24, 100, '{entity.attributes.max_temp}', '{states.input_number.high.state}', '{datasource:high_threshold}', '[[[return Number(entity.state) + 5]]]']
                                },
                                color: stateColorSchema,
                                opacity: {
                                    type: 'number',
                                    minimum: 0,
                                    maximum: 1,
                                    default: 0.3,
                                    description: 'Background opacity (0=transparent, 1=solid, default: 0.3)'
                                },
                                value: {
                                    type: ['string', 'number'],
                                    description: 'Numeric value or template resolving to a position on the track. When present (instead of min/max), renders a point marker rather than a coloured band. Supports {entity.state}, {entity.attributes.xxx}, {states.domain.object_id.state}, {datasource:name}, {config.x}, {variables.x}, and [[[JS]]] templates. (Synchronous only — no Jinja2.)',
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
                                        color: { ...stateColorSchema, description: 'Indicator fill color (defaults to range color). Supports state-object syntax ({ active, inactive, above:N, … }) and theme:/var()/computed colour tokens.' },
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
                                                color: stateColorSchema,
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
                                        stroke_width: { type: 'number', default: 2, description: 'Border thickness in pixels' },
                                        stroke_color: { ...stateColorSchema, description: 'Outline border colour. Falls back to the pill fill colour (range.color) if unset.' }
                                    },
                                    'x-ui-hints': {
                                        label: 'Pill Marker Style',
                                        helper: 'Controls how the marker pill appears in pills mode'
                                    }
                                },
                                label: {
                                    type: 'object',
                                    description: 'Optional text caption shown next to the marker (gauge mode) or highlighted pill (pills mode).',
                                    properties: {
                                        text: {
                                            type: 'string',
                                            description: 'Label text. Supports the full template system: {entity.attributes.xxx} / {states.entity_id.state} tokens, {{ Jinja2 }}, [[[ JS ]]], and {datasource:name} references — or a plain static string.',
                                            'x-ui-hints': {
                                                label: 'Label Text',
                                                helper: 'Static text or a template — {entity.attributes.x} / {states.entity_id.state} tokens, {{ Jinja2 }}, [[[ JS ]]], or {datasource:name} are all supported.'
                                            }
                                        },
                                        color: { ...stateColorSchema, description: 'State-based colour of the label text. Falls back to theme:components.slider.indicator.label.color.' },
                                        font_size: { type: 'number', description: 'Label font size in pixels. Defaults to the gauge tick-label size.' },
                                        offset: {
                                            type: 'object',
                                            description: 'Pixel offset from the marker’s default label position (above the marker in horizontal orientation, beside it in vertical).',
                                            properties: {
                                                x: { type: 'number', description: 'Horizontal offset in pixels' },
                                                y: { type: 'number', description: 'Vertical offset in pixels' }
                                            }
                                        }
                                    },
                                    'x-ui-hints': {
                                        label: 'Label',
                                        helper: 'Optional text caption shown next to the marker'
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
                                        ...stateColorSchema,
                                        description: 'Fill colour. Supports state-object syntax ({ active, inactive, above:N, … }) and theme:/var()/computed colour tokens.'
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
                                        properties: { size: { type: 'number', default: 36, 'x-ui-hints': { selector: { number: { min: 0, max: 200, mode: 'box', unit_of_measurement: 'px' } } } } }
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
                                        ...stateColorSchema,
                                        description: 'Shape interior background colour (the “empty” portion). Supports state-object syntax and theme:/var()/computed colour tokens.'
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
                description: 'Visual animations triggered by user interactions or entity state changes',
                items: animationSchema
            },

            // ============================================================================
            // BACKGROUND ANIMATION
            // ============================================================================

            background_animation: backgroundAnimationSchema,

            // ============================================================================
            // VALUE TWEEN
            // ============================================================================

            value_tween: {
                type: 'object',
                description: 'Eases the gauge/pills track and markers between old and new positions on entity-driven state changes (does not affect direct drag interaction). Distinct from the animations array, which is trigger/preset based.',
                examples: [
                    { enabled: true, duration: 500, ease: 'outQuad' },
                    { enabled: true, duration: 700, ease: 'spring', targets: { track: true, markers: false } }
                ],
                properties: {
                    enabled: {
                        type: 'boolean',
                        default: true,
                        description: 'Enable value tweening. Automatically forced off when the OS-level prefers-reduced-motion setting is active, regardless of this value.',
                        'x-ui-hints': {
                            label: 'Enable Value Tween',
                            selector: { boolean: {} }
                        }
                    },
                    duration: {
                        type: 'number',
                        minimum: 0,
                        maximum: 5000,
                        default: 500,
                        description: 'Tween duration in milliseconds (0-5000)',
                        'x-ui-hints': {
                            label: 'Duration',
                            selector: { number: { mode: 'box', min: 0, max: 5000, step: 50, unit_of_measurement: 'ms' } }
                        }
                    },
                    ease: {
                        type: 'string',
                        enum: _valueTweenEaseOptions.map(o => o.value),
                        default: 'outQuad',
                        description: 'anime.js v4 easing function used for the tween',
                        'x-ui-hints': {
                            label: 'Easing',
                            selector: { select: { mode: 'dropdown', options: _valueTweenEaseOptions } }
                        }
                    },
                    targets: {
                        type: 'object',
                        description: 'Which elements the tween applies to. All default to true.',
                        properties: {
                            track: {
                                type: 'boolean',
                                default: true,
                                description: 'Tween the gauge/shaped fill or the pills opacity sweep, whichever the card\'s track type uses.',
                                'x-ui-hints': { label: 'Track', selector: { boolean: {} } }
                            },
                            markers: {
                                type: 'boolean',
                                default: true,
                                description: 'Tween threshold/range marker position (and, in pills mode, which pill is highlighted). Applies to `gauge` and `pills` track types — `shaped` never renders markers at all.',
                                'x-ui-hints': { label: 'Markers', selector: { boolean: {} } }
                            }
                        }
                    }
                }
            },

            // ============================================================================
            // DRAG VALUE BADGE
            // ============================================================================

            drag_badge: {
                type: 'object',
                description: 'Live value badge that follows the drag position while the slider is being actively dragged by the user (never shown for entity-driven/external state changes). Mirrors HA\'s native slider drag badge.',
                examples: [
                    { enabled: true },
                    { enabled: true, format: { decimals: 0, show_unit: true }, release: { behavior: 'instant' } }
                ],
                properties: {
                    enabled: {
                        type: 'boolean',
                        default: false,
                        description: 'Show a live value badge that tracks the drag position while dragging',
                        'x-ui-hints': {
                            label: 'Enable Value Badge',
                            selector: { boolean: {} }
                        }
                    },
                    format: {
                        type: 'object',
                        description: 'Number formatting for the badge text',
                        properties: {
                            decimals: {
                                type: 'number',
                                minimum: 0,
                                maximum: 4,
                                description: 'Fixed number of decimal places. Leave blank to use locale-default formatting.',
                                'x-ui-hints': {
                                    label: 'Decimal Places',
                                    helper: 'Leave blank for locale-default formatting',
                                    selector: { number: { mode: 'box', min: 0, max: 4, step: 1 } }
                                }
                            },
                            show_unit: {
                                type: 'boolean',
                                default: true,
                                description: 'Show the unit suffix on the badge',
                                'x-ui-hints': {
                                    label: 'Show Unit',
                                    selector: { boolean: {} }
                                }
                            },
                            unit: {
                                type: 'string',
                                description: 'Unit suffix override. Leave blank to use the track\'s display unit (style.track.display.unit / entity unit_of_measurement).',
                                examples: ['°C', '%', 'lux'],
                                'x-ui-hints': {
                                    label: 'Unit Override',
                                    helper: 'Leave blank to use the track\'s display unit'
                                }
                            }
                        }
                    },
                    font_size: {
                        type: 'number',
                        minimum: 8,
                        maximum: 48,
                        default: 14,
                        description: 'Badge text size in pixels',
                        'x-ui-hints': {
                            label: 'Font Size',
                            selector: { number: { mode: 'box', min: 8, max: 48, unit_of_measurement: 'px' } }
                        }
                    },
                    offset: {
                        type: 'object',
                        description: 'Pixel offset from the default anchor point (above the track in horizontal orientation, beside it in vertical).',
                        properties: {
                            x: { type: 'number', description: 'Horizontal offset in pixels' },
                            y: { type: 'number', description: 'Vertical offset in pixels' }
                        }
                    },
                    color: { ...stateColorSchema, description: 'Badge text colour. Falls back to theme:components.slider.drag_badge.text.color.' },
                    background: {
                        type: 'object',
                        description: 'Badge background chip',
                        properties: {
                            enabled: {
                                type: 'boolean',
                                default: true,
                                description: 'Show a background chip behind the badge text',
                                'x-ui-hints': { label: 'Show Background', selector: { boolean: {} } }
                            },
                            color: { ...stateColorSchema, description: 'Badge background colour. Falls back to a theme-aware translucent surface colour.' }
                        }
                    },
                    border: {
                        type: 'object',
                        description: 'Badge border',
                        properties: {
                            enabled: {
                                type: 'boolean',
                                default: true,
                                description: 'Show a border around the badge',
                                'x-ui-hints': { label: 'Show Border', selector: { boolean: {} } }
                            },
                            width: {
                                type: 'number',
                                minimum: 0,
                                maximum: 10,
                                default: 1,
                                description: 'Border width in pixels'
                            },
                            color: { ...stateColorSchema, description: 'Badge border colour. Falls back to theme:components.slider.border.color.default.' }
                        }
                    },
                    release: {
                        type: 'object',
                        description: 'What happens to the badge when the drag is released (pointer-up), before the entity commit.',
                        properties: {
                            behavior: {
                                type: 'string',
                                enum: ['fade', 'instant'],
                                default: 'fade',
                                description: 'fade = linger briefly then fade out; instant = hide immediately on release. Automatically forced to instant when prefers-reduced-motion is active.',
                                'x-ui-hints': {
                                    label: 'Release Behaviour',
                                    selector: {
                                        select: {
                                            mode: 'dropdown',
                                            options: [
                                                { value: 'fade', label: 'Fade out (default)' },
                                                { value: 'instant', label: 'Hide instantly' }
                                            ]
                                        }
                                    }
                                }
                            },
                            duration: {
                                type: 'number',
                                minimum: 0,
                                maximum: 2000,
                                default: 500,
                                description: 'Fade-out duration in milliseconds (only used when behavior = fade)',
                                'x-ui-hints': {
                                    label: 'Fade Duration',
                                    selector: { number: { mode: 'box', min: 0, max: 2000, step: 50, unit_of_measurement: 'ms' } }
                                }
                            }
                        }
                    }
                }
            },

            // ============================================================================
            // SOUNDS
            // ============================================================================

            sounds: soundsSchema,

            grid_options: gridOptionsSchema
        }
    };
}
