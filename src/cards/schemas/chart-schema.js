/**
 * Chart Card Schema - Nested Structure
 *
 * ⚠️ BREAKING CHANGE: Complete rewrite with nested property groups.
 * No backward compatibility with flat snake_case properties.
 *
 * Complete schema for LCARdS Chart Card with nested configuration:
 * - 13+ nested property groups (colors, stroke, fill, markers, grid, legend, etc.)
 * - Comprehensive x-ui-hints for GUI editor
 * - Full ApexCharts feature support
 * - Simple template-based formatters
 *
 * @see doc/user/configuration/cards/chart.md
 */

import { simpleColorSchema, cardIdSchema, tagsSchema, dataSourcesSchema, cardHeightSchema, cardWidthSchema, cardMinHeightSchema, cardMinWidthSchema, cardMaxHeightSchema, cardMaxWidthSchema, cardOverflowSchema, cardOverflowXSchema, cardOverflowYSchema, cardZIndexSchema, cardLevelProperties } from './common-schemas.js';

/**
 * Get complete chart card schema with nested structure
 * @param {Object} [options] - Schema options
 * @param {Array<string>} [options.availableAnimationPresets] - Animation preset names
 * @returns {Object} Complete chart schema
 */
export function getChartSchema(options = {}) {
    const {
        availableAnimationPresets = [
            'lcars_standard',
            'lcars_dramatic',
            'lcars_minimal',
            'lcars_realtime',
            'lcars_alert',
            'none'
        ]
    } = options;

    // ============================================================================
    // REUSABLE DEFINITIONS
    // ============================================================================

    // Color array schema
    const colorArraySchema = {
        type: 'array',
        items: simpleColorSchema,
        description: 'Array of colour values for multiple series',
        examples: [['#FF9900', '#99CCFF', '#FFCC00']]
    };

    // Valid chart types
    const VALID_CHART_TYPES = [
        'line',
        'area',
        'bar',
        'column',
        'scatter',
        'pie',
        'donut',
        'heatmap',
        'radialBar',
        'radar',
        'polarArea',
        'treemap',
        'rangeBar',
        'rangeArea',
        'candlestick',
        'boxPlot'
    ];

    const SPAN_UNITS = ['minute', 'hour', 'day', 'week', 'month', 'year'];
    const DURATION_PATTERN = '^\\d+(\\.\\d+)?\\s*(s|sec|m|min|h|hour|d|day|w|week|mo|month|y|year)s?$';

    // Display options shared by entity and DataSource series
    const seriesDisplayProperties = {
        name: { type: 'string', description: 'Legend name (default: entity friendly name or source id)' },
        unit: { type: 'string', description: 'Unit shown in tooltips and axis labels (default: entity unit_of_measurement)' },
        float_precision: { type: 'number', minimum: 0, maximum: 6, description: 'Decimal places in tooltips' },
        type: {
            type: 'string',
            enum: ['line', 'area', 'bar', 'column', 'scatter'],
            description: 'Per-series chart type for mixed charts'
        },
        curve: {
            type: 'string',
            enum: ['smooth', 'straight', 'stepline', 'monotoneCubic'],
            description: 'Line interpolation for this series'
        },
        stroke_width: { type: 'number', minimum: 0, maximum: 20, description: 'Line width for this series' },
        stroke_dash: { type: 'number', minimum: 0, maximum: 20, description: 'Dash length for this series (0 = solid)' },
        color: { ...simpleColorSchema, description: 'Series colour (overrides style.colors.series)' },
        opacity: { type: 'number', minimum: 0, maximum: 1, description: 'Fill opacity for area/bar series' },
        yaxis_id: { type: 'string', description: 'Id of the yaxis[] entry this series uses' },
        group_by: {
            type: 'object',
            description: 'Bucket points into fixed time intervals. minmax, box and ohlc produce the data rangeArea, boxPlot and candlestick charts need.',
            properties: {
                // rules, sounds, variables, zones, debug_zones (LCARdSCard base); card entries below win.
                ...cardLevelProperties,
                func: {
                    type: 'string',
                    enum: ['avg', 'min', 'max', 'first', 'last', 'sum', 'median', 'delta', 'diff', 'minmax', 'box', 'ohlc'],
                    default: 'avg',
                    description: 'How each bucket is reduced'
                },
                duration: {
                    type: 'string',
                    pattern: DURATION_PATTERN,
                    description: 'Bucket length, e.g. 10min, 1h, 1d',
                    examples: ['10min', '1h']
                },
                fill: {
                    type: 'string',
                    enum: ['null', 'last', 'zero'],
                    default: 'last',
                    description: 'Value for empty buckets: leave a gap, repeat the last value, or zero'
                }
            },
            required: ['duration'],
            additionalProperties: false
        }
    };

    // One chart series. anyOf (not oneOf): a canonical DataSource item also fits
    // the legacy branch; the first (current) branch that matches wins.
    const seriesSchema = {
        anyOf: [
            {
                type: 'object',
                title: 'Entity series',
                properties: {
                    entity: {
                        type: 'string',
                        format: 'entity',
                        pattern: '^[a-z_]+\\.[a-z0-9_]+$',
                        description: 'Entity to plot (history is fetched from Home Assistant)'
                    },
                    attribute: { type: 'string', description: 'Plot this attribute instead of the state' },
                    statistics: {
                        type: 'object',
                        description: 'Use long-term statistics instead of state history (sensors with a state_class)',
                        properties: {
                            type: {
                                type: 'string',
                                enum: ['mean', 'min', 'max', 'sum', 'state', 'change'],
                                default: 'mean',
                                description: 'Which statistic to plot'
                            },
                            period: {
                                type: 'string',
                                enum: ['5minute', 'hour', 'day', 'week', 'month'],
                                default: 'hour',
                                description: 'Statistics period'
                            }
                        },
                        additionalProperties: false
                    },
                    ...seriesDisplayProperties
                },
                required: ['entity'],
                additionalProperties: false
            },
            {
                type: 'object',
                title: 'DataSource series',
                properties: {
                    datasource: { type: 'string', description: 'Name of a DataSource (in data_sources or defined by another card)' },
                    buffer: { type: 'string', description: 'Processor key to plot instead of the raw values' },
                    ...seriesDisplayProperties
                },
                required: ['datasource'],
                additionalProperties: false
            },
            {
                type: 'string',
                deprecated: true,
                'x-replacement': '{ entity: ... } or { datasource: ... }',
                description: 'Legacy: entity id or DataSource name'
            },
            {
                type: 'object',
                title: 'Legacy DataSource reference',
                deprecated: true,
                'x-replacement': '{ datasource, buffer, name, type }',
                properties: {
                    datasource: { type: 'string' },
                    id: { type: 'string' },
                    name: { type: 'string' },
                    buffer: { type: 'string' },
                    key: { type: 'string' },
                    type: { type: 'string' },
                    yaxis: { type: 'number' }
                },
                additionalProperties: false
            }
        ]
    };

    // ============================================================================
    // MAIN SCHEMA
    // ============================================================================

    return {
        $schema: 'http://json-schema.org/draft-07/schema#',
        $id: 'https://github.com/snootched/lcards/schemas/chart-schema',
        title: 'LCARdS Chart Card Configuration',
        description: 'Complete configuration schema for lcards-chart custom card (v1.18.0+ nested structure)',
        type: 'object',
        properties: {

            // ====================================================================
            // HOME ASSISTANT REQUIRED PROPERTIES
            // ====================================================================

            type: {
                type: 'string',
                const: 'custom:lcards-chart',
                description: 'Home Assistant card type identifier (required)',
                'x-ui-hints': {
                    hidden: true
                }
            },

            // ====================================================================
            // CORE PROPERTIES
            // ====================================================================

            id: {
                ...cardIdSchema,
                description: 'Custom card ID for rule targeting (optional - auto-generated if omitted)',
                'x-ui-hints': {
                    label: 'Card ID',
                    helper: 'Unique identifier for targeting with rules (auto-generated if not specified)',
                    selector: {
                        text: {
                            placeholder: 'chart-main'
                        }
                    }
                }
            },

            tags: {
                ...tagsSchema,
                'x-ui-hints': {
                    label: 'Tags',
                    helper: 'Tags for grouping and targeting multiple cards with rules',
                    selector: {
                        select: {
                            multiple: true,
                            custom_value: true
                        }
                    },
                    examples: ['dashboard-main', 'temperature-monitors', 'energy']
                }
            },

            // ====================================================================
            // SERIES AND TIME WINDOW
            // ====================================================================

            sources: {
                type: 'array',
                description: 'Chart series. Each item plots an entity (history or long-term statistics) or a named DataSource buffer.',
                items: seriesSchema,
                'x-ui-hints': {
                    label: 'Series',
                    helper: 'Edit series in Chart Studio',
                    examples: [
                        [{ entity: 'sensor.indoor_temp', name: 'Indoor' }, { entity: 'sensor.outdoor_temp', name: 'Outdoor' }],
                        [{ entity: 'sensor.power', statistics: { type: 'max', period: 'day' } }],
                        [{ datasource: 'temp', buffer: 'smoothed', name: 'Smoothed' }]
                    ]
                }
            },

            graph_span: {
                type: 'string',
                pattern: '^\\d+(\\.\\d+)?\\s*(s|sec|m|min|h|hour|d|day|w|week|mo|month|y|year)s?$',
                default: '24h',
                description: 'How much time the chart shows, e.g. 6h, 2d, 1w, 1mo (default 24h)',
                examples: ['24h', '7d', '1mo'],
                'x-ui-hints': {
                    label: 'Time span',
                    selector: { text: { placeholder: '24h' } }
                }
            },

            span: {
                type: 'object',
                description: 'Align the time window to calendar boundaries and/or shift it',
                properties: {
                    start: {
                        type: 'string',
                        enum: SPAN_UNITS,
                        description: 'Start the window at the beginning of the current minute/hour/day/week/month/year (it then lasts graph_span)'
                    },
                    end: {
                        type: 'string',
                        enum: SPAN_UNITS,
                        description: 'End the window at the end of the current minute/hour/day/week/month/year (it then starts graph_span earlier)'
                    },
                    offset: {
                        type: 'string',
                        pattern: '^[+-]\\d+(\\.\\d+)?\\s*(s|sec|m|min|h|hour|d|day|w|week|mo|month|y|year)s?$',
                        description: 'Shift the window, e.g. -1d for the same window yesterday',
                        examples: ['-1d', '+2h']
                    }
                },
                additionalProperties: false
            },

            yaxis: {
                type: 'array',
                description: 'Y axes for multi-axis charts. Series pick one with yaxis_id; series without one use the first axis.',
                items: {
                    type: 'object',
                    properties: {
                        id: { type: 'string', description: 'Axis id referenced by series yaxis_id' },
                        show: { type: 'boolean', default: true, description: 'Show this axis' },
                        opposite: { type: 'boolean', default: false, description: 'Draw the axis on the right' },
                        min: { type: 'number', description: 'Fixed minimum (omit for automatic)' },
                        max: { type: 'number', description: 'Fixed maximum (omit for automatic)' },
                        decimals: { type: 'number', minimum: 0, maximum: 6, description: 'Decimal places for axis labels' }
                    },
                    required: ['id'],
                    additionalProperties: false
                },
                examples: [[{ id: 'temp' }, { id: 'humidity', opposite: true, min: 0, max: 100 }]]
            },

            data_sources: dataSourcesSchema,

            // Legacy series keys: still accepted (the card and editor migrate
            // them to sources[]) but never written by the editor.
            source: {
                type: 'string',
                deprecated: true,
                'x-replacement': 'sources: [{ entity: ... }]',
                description: 'Legacy single entity or DataSource reference'
            },
            data_source: {
                anyOf: [{ type: 'string' }, { type: 'array', items: { type: 'string' } }],
                deprecated: true,
                'x-replacement': 'sources',
                description: 'Legacy alias of source/sources'
            },
            attribute: {
                type: 'string',
                deprecated: true,
                'x-replacement': 'sources[].attribute',
                description: 'Legacy attribute for source'
            },
            series_names: {
                type: 'array',
                items: { type: 'string' },
                deprecated: true,
                'x-replacement': 'sources[].name',
                description: 'Legacy legend names in sources order'
            },
            history_hours: {
                type: 'number',
                deprecated: true,
                'x-replacement': 'graph_span',
                description: 'Legacy history window in hours'
            },

            // ====================================================================
            // CHART CONFIGURATION
            // ====================================================================

            chart_type: {
                type: 'string',
                enum: VALID_CHART_TYPES,
                default: 'line',
                description: 'ApexCharts chart type',
                'x-ui-hints': {
                    label: 'Chart Type',
                    helper: 'Select the type of chart to display',
                    selector: {
                        select: {
                            options: VALID_CHART_TYPES.map(type => ({
                                value: type,
                                label: type.charAt(0).toUpperCase() + type.slice(1).replace(/([A-Z])/g, ' $1')
                            }))
                        }
                    },
                    enumDescriptions: [
                        'Line chart - Best for trends over time',
                        'Area chart - Best for showing volume/magnitude',
                        'Bar chart - Horizontal bars for comparisons',
                        'Column chart - Vertical bars for comparisons',
                        'Scatter plot - Best for correlations',
                        'Pie chart - Full circle for proportions',
                        'Donut chart - Ring shape for proportions',
                        'Heatmap - Heat map grid',
                        'Radial bar - Circular progress/gauge',
                        'Radar chart - Spider/radar chart',
                        'Polar area - Directional data visualization',
                        'Treemap - Hierarchical data',
                        'Range bar - Timeline/schedule visualization',
                        'Range area - Data ranges/confidence intervals',
                        'Candlestick - Financial OHLC data',
                        'Box plot - Statistical distributions'
                    ]
                }
            },

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

            show_legend: {
                type: 'boolean',
                deprecated: true,
                'x-replacement': 'style.legend.show',
                description: 'Legacy legend toggle'
            },

            xaxis_type: {
                type: 'string',
                enum: ['datetime', 'category', 'numeric'],
                default: 'datetime',
                description: 'X-axis type',
                'x-ui-hints': {
                    label: 'X-Axis Type',
                    helper: 'Type of data on the x-axis',
                    selector: {
                        select: {
                            options: [
                                { value: 'datetime', label: 'Date/Time' },
                                { value: 'category', label: 'Category' },
                                { value: 'numeric', label: 'Numeric' }
                            ]
                        }
                    }
                }
            },

            max_points: {
                type: 'number',
                deprecated: true,
                'x-replacement': 'sources[].group_by',
                description: 'Legacy point limit (never had an effect)'
            },

            // ====================================================================
            // NESTED STYLE CONFIGURATION
            // ====================================================================

            style: {
                type: 'object',
                description: 'Nested style configuration for chart appearance',
                properties: {

                    // ================================================================
                    // GROUP 1: COLORS - All color properties
                    // ================================================================

                    colors: {
                        type: 'object',
                        description: 'Complete colour configuration for all chart elements',
                        'x-ui-hints': {
                            label: 'Colours',
                            helper: 'Configure colours for all chart elements',
                            collapsible: true,
                            defaultCollapsed: false
                        },
                        properties: {
                            series: colorArraySchema,
                            stroke: colorArraySchema,
                            fill: colorArraySchema,
                            background: simpleColorSchema,
                            foreground: simpleColorSchema,
                            grid: simpleColorSchema,

                            marker: {
                                type: 'object',
                                description: 'Marker colours',
                                'x-ui-hints': {
                                    label: 'Marker Colours',
                                    helper: 'Configure fill and stroke colours for data point markers',
                                    collapsible: true,
                                    defaultCollapsed: true
                                },
                                properties: {
                                    fill: colorArraySchema,
                                    stroke: colorArraySchema
                                }
                            },

                            axis: {
                                type: 'object',
                                description: 'Axis colours',
                                'x-ui-hints': {
                                    label: 'Axis Colours',
                                    helper: 'Configure colours for x-axis, y-axis, borders, and tick marks',
                                    collapsible: true,
                                    defaultCollapsed: true
                                },
                                properties: {
                                    x: simpleColorSchema,
                                    y: simpleColorSchema,
                                    border: simpleColorSchema,
                                    ticks: simpleColorSchema
                                }
                            },

                            legend: {
                                type: 'object',
                                description: 'Legend colours',
                                'x-ui-hints': {
                                    label: 'Legend Colours',
                                    helper: 'Configure default legend text colour and per-series item colours',
                                    collapsible: true,
                                    defaultCollapsed: true
                                },
                                properties: {
                                    default: simpleColorSchema,
                                    items: colorArraySchema
                                }
                            },

                            data_labels: colorArraySchema
                        }
                    },

                    // ================================================================
                    // GROUP 2: STROKE - Line styling
                    // ================================================================

                    stroke: {
                        type: 'object',
                        description: 'Line stroke configuration',
                        'x-ui-hints': {
                            label: 'Stroke',
                            helper: 'Configure line width, curve, and dash pattern',
                            collapsible: true,
                            defaultCollapsed: true
                        },
                        properties: {
                            width: {
                                type: 'number',
                                minimum: 0,
                                maximum: 10,
                                default: 2,
                                description: 'Stroke width in pixels',
                                'x-ui-hints': {
                                    label: 'Width',
                                    selector: {
                                        number: {
                                            mode: 'slider',
                                            min: 0,
                                            max: 10,
                                            step: 0.5
                                        }
                                    }
                                }
                            },
                            curve: {
                                type: 'string',
                                enum: ['smooth', 'straight', 'stepline', 'monotoneCubic'],
                                default: 'smooth',
                                description: 'Line curve type',
                                'x-ui-hints': {
                                    label: 'Curve',
                                    selector: {
                                        select: {
                                            options: [
                                                { value: 'smooth', label: 'Smooth' },
                                                { value: 'straight', label: 'Straight' },
                                                { value: 'stepline', label: 'Stepline' },
                                                { value: 'monotoneCubic', label: 'Monotone Cubic' }
                                            ]
                                        }
                                    }
                                }
                            },
                            dash_array: {
                                type: 'number',
                                minimum: 0,
                                maximum: 20,
                                default: 0,
                                description: 'Dashed line pattern (0 = solid)',
                                'x-ui-hints': {
                                    label: 'Dash Pattern',
                                    selector: {
                                        number: {
                                            mode: 'slider',
                                            min: 0,
                                            max: 20,
                                            step: 1
                                        }
                                    }
                                }
                            }
                        }
                    },

                    // ================================================================
                    // GROUP 3: FILL - Fill styling
                    // ================================================================

                    fill: {
                        type: 'object',
                        description: 'Fill configuration for area and bar charts',
                        'x-ui-hints': {
                            label: 'Fill',
                            helper: 'Configure fill type, opacity, and gradients',
                            collapsible: true,
                            defaultCollapsed: true
                        },
                        properties: {
                            type: {
                                type: 'string',
                                enum: ['solid', 'gradient', 'pattern', 'image'],
                                default: 'solid',
                                description: 'Fill type',
                                'x-ui-hints': {
                                    label: 'Type',
                                    selector: {
                                        select: {
                                            options: [
                                                { value: 'solid', label: 'Solid' },
                                                { value: 'gradient', label: 'Gradient' },
                                                { value: 'pattern', label: 'Pattern' },
                                                { value: 'image', label: 'Image' }
                                            ]
                                        }
                                    }
                                }
                            },
                            opacity: {
                                type: 'number',
                                minimum: 0,
                                maximum: 1,
                                default: 0.7,
                                description: 'Fill opacity (0-1)',
                                'x-ui-hints': {
                                    label: 'Opacity',
                                    selector: {
                                        number: {
                                            mode: 'slider',
                                            min: 0,
                                            max: 1,
                                            step: 0.1
                                        }
                                    }
                                }
                            },
                            gradient: {
                                type: 'object',
                                description: 'Gradient fill configuration',
                                'x-ui-hints': {
                                    label: 'Gradient',
                                    helper: 'Configure gradient fill direction, intensity, and opacity',
                                    collapsible: true,
                                    defaultCollapsed: true
                                },
                                properties: {
                                    shade: {
                                        type: 'string',
                                        enum: ['light', 'dark'],
                                        description: 'Gradient shade direction',
                                        'x-ui-hints': {
                                            label: 'Shade',
                                            helper: 'Light or dark gradient shading',
                                            selector: {
                                                select: {
                                                    options: [
                                                        { value: 'light', label: 'Light' },
                                                        { value: 'dark', label: 'Dark' }
                                                    ]
                                                }
                                            }
                                        }
                                    },
                                    type: {
                                        type: 'string',
                                        enum: ['horizontal', 'vertical', 'diagonal1', 'diagonal2'],
                                        description: 'Gradient direction',
                                        'x-ui-hints': {
                                            label: 'Type',
                                            helper: 'Direction of gradient flow',
                                            selector: {
                                                select: {
                                                    options: [
                                                        { value: 'horizontal', label: 'Horizontal' },
                                                        { value: 'vertical', label: 'Vertical' },
                                                        { value: 'diagonal1', label: 'Diagonal 1' },
                                                        { value: 'diagonal2', label: 'Diagonal 2' }
                                                    ]
                                                }
                                            }
                                        }
                                    },
                                    shadeIntensity: {
                                        type: 'number',
                                        minimum: 0,
                                        maximum: 1,
                                        description: 'Intensity of shading',
                                        'x-ui-hints': {
                                            label: 'Shade Intensity',
                                            helper: 'How strong the gradient shading effect is (0-1)',
                                            selector: {
                                                number: {
                                                    mode: 'slider',
                                                    min: 0,
                                                    max: 1,
                                                    step: 0.1
                                                }
                                            }
                                        }
                                    },
                                    opacityFrom: {
                                        type: 'number',
                                        minimum: 0,
                                        maximum: 1,
                                        description: 'Starting opacity',
                                        'x-ui-hints': {
                                            label: 'Opacity From',
                                            helper: 'Starting opacity value for gradient (0-1)',
                                            selector: {
                                                number: {
                                                    mode: 'slider',
                                                    min: 0,
                                                    max: 1,
                                                    step: 0.1
                                                }
                                            }
                                        }
                                    },
                                    opacityTo: {
                                        type: 'number',
                                        minimum: 0,
                                        maximum: 1,
                                        description: 'Ending opacity',
                                        'x-ui-hints': {
                                            label: 'Opacity To',
                                            helper: 'Ending opacity value for gradient (0-1)',
                                            selector: {
                                                number: {
                                                    mode: 'slider',
                                                    min: 0,
                                                    max: 1,
                                                    step: 0.1
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    },

                    // ================================================================
                    // GROUP 4: MARKERS - Data point markers
                    // ================================================================

                    markers: {
                        type: 'object',
                        description: 'Data point marker configuration',
                        'x-ui-hints': {
                            label: 'Markers',
                            helper: 'Configure data point markers',
                            collapsible: true,
                            defaultCollapsed: true
                        },
                        properties: {
                            size: {
                                type: 'number',
                                minimum: 0,
                                maximum: 20,
                                default: 4,
                                description: 'Marker size in pixels',
                                'x-ui-hints': {
                                    label: 'Size',
                                    selector: {
                                        number: {
                                            mode: 'slider',
                                            min: 0,
                                            max: 20,
                                            step: 1
                                        }
                                    }
                                }
                            },
                            shape: {
                                type: 'string',
                                enum: ['circle', 'square', 'rect', 'diamond', 'triangle', 'star', 'cross', 'plus', 'line', 'rhombus'],
                                default: 'circle',
                                description: 'Marker shape',
                                'x-ui-hints': {
                                    label: 'Shape',
                                    selector: {
                                        select: {
                                            options: [
                                                { value: 'circle', label: 'Circle' },
                                                { value: 'square', label: 'Square' },
                                                { value: 'rect', label: 'Rectangle' },
                                                { value: 'diamond', label: 'Diamond' },
                                                { value: 'triangle', label: 'Triangle' },
                                                { value: 'star', label: 'Star' },
                                                { value: 'cross', label: 'Cross' },
                                                { value: 'plus', label: 'Plus' }
                                            ]
                                        }
                                    }
                                }
                            },
                            stroke: {
                                type: 'object',
                                description: 'Marker stroke configuration',
                                properties: {
                                    width: {
                                        type: 'number',
                                        minimum: 0,
                                        maximum: 10,
                                        default: 2,
                                        description: 'Marker stroke width',
                                        'x-ui-hints': {
                                            label: 'Stroke Width',
                                            selector: {
                                                number: {
                                                    min: 0,
                                                    max: 10,
                                                    step: 0.5
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    },

                    // ================================================================
                    // GROUP 5: GRID - Grid configuration
                    // ================================================================

                    grid: {
                        type: 'object',
                        description: 'Grid line configuration',
                        'x-ui-hints': {
                            label: 'Grid',
                            helper: 'Configure grid lines and colours',
                            collapsible: true,
                            defaultCollapsed: true
                        },
                        properties: {
                            show: {
                                type: 'boolean',
                                default: true,
                                description: 'Show/hide grid lines',
                                'x-ui-hints': {
                                    label: 'Show Grid',
                                    selector: {
                                        boolean: {}
                                    }
                                }
                            },
                            opacity: {
                                type: 'number',
                                deprecated: true,
                                'x-replacement': 'an rgba/alpha() colour in style.colors.grid',
                                description: 'Not an ApexCharts option; it never had an effect'
                            },
                            stroke_dash_array: {
                                type: 'number',
                                minimum: 0,
                                maximum: 20,
                                default: 4,
                                description: 'Grid line dash pattern',
                                'x-ui-hints': {
                                    label: 'Dash Pattern',
                                    selector: {
                                        number: {
                                            mode: 'slider',
                                            min: 0,
                                            max: 20,
                                            step: 1
                                        }
                                    }
                                }
                            },
                            row_colors: colorArraySchema,
                            column_colors: colorArraySchema
                        }
                    },

                    // ================================================================
                    // GROUP 6: LEGEND - Legend configuration
                    // ================================================================

                    legend: {
                        type: 'object',
                        description: 'Legend configuration',
                        'x-ui-hints': {
                            label: 'Legend',
                            helper: 'Configure chart legend',
                            collapsible: true,
                            defaultCollapsed: true
                        },
                        properties: {
                            show: {
                                type: 'boolean',
                                default: false,
                                description: 'Show/hide legend',
                                'x-ui-hints': {
                                    label: 'Show Legend',
                                    selector: {
                                        boolean: {}
                                    }
                                }
                            },
                            position: {
                                type: 'string',
                                enum: ['top', 'right', 'bottom', 'left'],
                                default: 'bottom',
                                description: 'Legend position',
                                'x-ui-hints': {
                                    label: 'Position',
                                    selector: {
                                        select: {
                                            options: [
                                                { value: 'top', label: 'Top' },
                                                { value: 'right', label: 'Right' },
                                                { value: 'bottom', label: 'Bottom' },
                                                { value: 'left', label: 'Left' }
                                            ]
                                        }
                                    }
                                }
                            },
                            horizontalAlign: {
                                type: 'string',
                                enum: ['left', 'center', 'right'],
                                default: 'center',
                                description: 'Legend horizontal alignment',
                                'x-ui-hints': {
                                    label: 'Horizontal Alignment',
                                    selector: {
                                        select: {
                                            options: [
                                                { value: 'left', label: 'Left' },
                                                { value: 'center', label: 'Center' },
                                                { value: 'right', label: 'Right' }
                                            ]
                                        }
                                    }
                                }
                            },
                            font_size: {
                                type: 'number',
                                minimum: 8,
                                maximum: 24,
                                default: 14,
                                description: 'Legend font size',
                                'x-ui-hints': {
                                    label: 'Font Size',
                                    selector: {
                                        number: {
                                            min: 8,
                                            max: 24,
                                            step: 1
                                        }
                                    }
                                }
                            }
                        }
                    },

                    // ================================================================
                    // GROUP 7: DATA LABELS - Data label configuration
                    // ================================================================

                    data_labels: {
                        type: 'object',
                        description: 'Data label configuration',
                        'x-ui-hints': {
                            label: 'Data Labels',
                            helper: 'Configure data point labels',
                            collapsible: true,
                            defaultCollapsed: true
                        },
                        properties: {
                            show: {
                                type: 'boolean',
                                default: false,
                                description: 'Show/hide data labels',
                                'x-ui-hints': {
                                    label: 'Show Data Labels',
                                    selector: {
                                        boolean: {}
                                    }
                                }
                            },
                            offsetY: {
                                type: 'number',
                                minimum: -50,
                                maximum: 50,
                                default: 0,
                                description: 'Vertical offset for data labels',
                                'x-ui-hints': {
                                    label: 'Vertical Offset',
                                    selector: {
                                        number: {
                                            mode: 'slider',
                                            min: -50,
                                            max: 50,
                                            step: 1
                                        }
                                    }
                                }
                            },
                            font_size: {
                                type: 'number',
                                minimum: 8,
                                maximum: 24,
                                default: 12,
                                description: 'Data label font size',
                                'x-ui-hints': {
                                    label: 'Font Size',
                                    selector: {
                                        number: {
                                            min: 8,
                                            max: 24,
                                            step: 1
                                        }
                                    }
                                }
                            }
                        }
                    },

                    // ================================================================
                    // GROUP 7A: XAXIS - X-axis configuration
                    // ================================================================

                    xaxis: {
                        type: 'object',
                        description: 'X-axis configuration',
                        'x-ui-hints': {
                            label: 'X-Axis',
                            helper: 'Configure horizontal axis',
                            collapsible: true,
                            defaultCollapsed: true
                        },
                        properties: {
                            labels: {
                                type: 'object',
                                description: 'X-axis label configuration',
                                properties: {
                                    show: {
                                        type: 'boolean',
                                        default: true,
                                        description: 'Show/hide x-axis labels',
                                        'x-ui-hints': {
                                            label: 'Show Labels',
                                            selector: {
                                                boolean: {}
                                            }
                                        }
                                    },
                                    rotate: {
                                        type: 'number',
                                        minimum: -90,
                                        maximum: 90,
                                        default: 0,
                                        description: 'Label rotation in degrees',
                                        'x-ui-hints': {
                                            label: 'Rotation',
                                            selector: {
                                                number: {
                                                    mode: 'slider',
                                                    min: -90,
                                                    max: 90,
                                                    step: 15,
                                                    unit_of_measurement: '°'
                                                }
                                            }
                                        }
                                    }
                                }
                            },
                            border: {
                                type: 'object',
                                description: 'X-axis border configuration',
                                properties: {
                                    show: {
                                        type: 'boolean',
                                        default: false,
                                        description: 'Show/hide x-axis border',
                                        'x-ui-hints': {
                                            label: 'Show Border',
                                            selector: {
                                                boolean: {}
                                            }
                                        }
                                    }
                                }
                            },
                            ticks: {
                                type: 'object',
                                description: 'X-axis tick marks configuration',
                                properties: {
                                    show: {
                                        type: 'boolean',
                                        default: false,
                                        description: 'Show/hide x-axis tick marks',
                                        'x-ui-hints': {
                                            label: 'Show Ticks',
                                            selector: {
                                                boolean: {}
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    },

                    // ================================================================
                    // GROUP 7B: YAXIS - Y-axis configuration
                    // ================================================================

                    yaxis: {
                        type: 'object',
                        description: 'Y-axis configuration',
                        'x-ui-hints': {
                            label: 'Y-Axis',
                            helper: 'Configure vertical axis',
                            collapsible: true,
                            defaultCollapsed: true
                        },
                        properties: {
                            labels: {
                                type: 'object',
                                description: 'Y-axis label configuration',
                                properties: {
                                    show: {
                                        type: 'boolean',
                                        default: true,
                                        description: 'Show/hide y-axis labels',
                                        'x-ui-hints': {
                                            label: 'Show Labels',
                                            selector: {
                                                boolean: {}
                                            }
                                        }
                                    }
                                }
                            },
                            border: {
                                type: 'object',
                                description: 'Y-axis border configuration',
                                properties: {
                                    show: {
                                        type: 'boolean',
                                        default: false,
                                        description: 'Show/hide y-axis border',
                                        'x-ui-hints': {
                                            label: 'Show Border',
                                            selector: {
                                                boolean: {}
                                            }
                                        }
                                    }
                                }
                            },
                            ticks: {
                                type: 'object',
                                description: 'Y-axis tick marks configuration',
                                properties: {
                                    show: {
                                        type: 'boolean',
                                        default: false,
                                        description: 'Show/hide y-axis tick marks',
                                        'x-ui-hints': {
                                            label: 'Show Ticks',
                                            selector: {
                                                boolean: {}
                                            }
                                        }
                                    }
                                }
                            },
                            decimals: {
                                type: 'number',
                                minimum: 0,
                                maximum: 10,
                                description: 'Round displayed values to N decimal places (axis labels, tooltips, and data labels)',
                                'x-ui-hints': {
                                    label: 'Decimal Places',
                                    helper: 'Round values to N decimal places. Leave unset for full precision.',
                                    selector: {
                                        number: {
                                            min: 0,
                                            max: 10,
                                            step: 1
                                        }
                                    }
                                }
                            }
                        }
                    },

                    // ================================================================
                    // GROUP 8: TYPOGRAPHY - Font configuration
                    // ================================================================

                    typography: {
                        type: 'object',
                        description: 'Typography configuration',
                        'x-ui-hints': {
                            label: 'Typography',
                            helper: 'Configure fonts for chart text',
                            collapsible: true,
                            defaultCollapsed: true
                        },
                        properties: {
                            font_family: {
                                type: 'string',
                                default: 'Antonio, Helvetica Neue, sans-serif',
                                description: 'Font family',
                                'x-ui-hints': {
                                    label: 'Font Family',
                                    selector: {
                                        text: {}
                                    }
                                }
                            },
                            font_size: {
                                type: 'number',
                                minimum: 8,
                                maximum: 24,
                                default: 12,
                                description: 'Base font size',
                                'x-ui-hints': {
                                    label: 'Font Size',
                                    selector: {
                                        number: {
                                            min: 8,
                                            max: 24,
                                            step: 1
                                        }
                                    }
                                }
                            }
                        }
                    },

                    // ================================================================
                    // GROUP 9: DISPLAY - Display options
                    // ================================================================

                    display: {
                        type: 'object',
                        description: 'Display options',
                        'x-ui-hints': {
                            label: 'Display',
                            helper: 'Configure toolbar and tooltip display',
                            collapsible: true,
                            defaultCollapsed: true
                        },
                        properties: {
                            toolbar: {
                                type: 'boolean',
                                default: false,
                                description: 'Show/hide toolbar',
                                'x-ui-hints': {
                                    label: 'Show Toolbar',
                                    selector: {
                                        boolean: {}
                                    }
                                }
                            },
                            tooltip: {
                                type: 'object',
                                description: 'Tooltip configuration',
                                properties: {
                                    show: {
                                        type: 'boolean',
                                        default: true,
                                        description: 'Show/hide tooltip',
                                        'x-ui-hints': {
                                            label: 'Show Tooltip',
                                            selector: {
                                                boolean: {}
                                            }
                                        }
                                    },
                                    theme: {
                                        type: 'string',
                                        enum: ['light', 'dark'],
                                        default: 'dark',
                                        description: 'Tooltip theme',
                                        'x-ui-hints': {
                                            label: 'Theme',
                                            selector: {
                                                select: {
                                                    options: [
                                                        { value: 'light', label: 'Light' },
                                                        { value: 'dark', label: 'Dark' }
                                                    ]
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    },

                    // ================================================================
                    // GROUP 10: ANIMATION - Animation configuration
                    // ================================================================

                    animation: {
                        type: 'object',
                        description: 'Animation configuration',
                        'x-ui-hints': {
                            label: 'Animation',
                            helper: 'Configure chart animations',
                            collapsible: true,
                            defaultCollapsed: true
                        },
                        properties: {
                            preset: {
                                type: 'string',
                                enum: availableAnimationPresets,
                                description: 'Animation preset name',
                                'x-ui-hints': {
                                    label: 'Preset',
                                    selector: {
                                        select: {
                                            options: availableAnimationPresets.map(preset => ({
                                                value: preset,
                                                label: preset.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
                                            }))
                                        }
                                    }
                                }
                            }
                        }
                    },

                    // ================================================================
                    // GROUP 11: THEME - Theme configuration
                    // ================================================================

                    theme: {
                        type: 'object',
                        description: 'Theme configuration',
                        'x-ui-hints': {
                            label: 'Theme',
                            helper: 'Configure chart theme settings',
                            collapsible: true,
                            defaultCollapsed: true
                        },
                        properties: {
                            mode: {
                                type: 'string',
                                enum: ['light', 'dark'],
                                default: 'dark',
                                description: 'Theme mode',
                                'x-ui-hints': {
                                    label: 'Mode',
                                    selector: {
                                        select: {
                                            options: [
                                                { value: 'light', label: 'Light' },
                                                { value: 'dark', label: 'Dark' }
                                            ]
                                        }
                                    }
                                }
                            },
                            palette: {
                                type: 'string',
                                description: 'Theme palette name',
                                'x-ui-hints': {
                                    label: 'Palette',
                                    selector: {
                                        text: {}
                                    }
                                }
                            },
                            monochrome: {
                                type: 'object',
                                description: 'Monochrome theme configuration',
                                properties: {
                                    enabled: {
                                        type: 'boolean',
                                        default: false,
                                        description: 'Enable monochrome theme',
                                        'x-ui-hints': {
                                            label: 'Enabled',
                                            selector: {
                                                boolean: {}
                                            }
                                        }
                                    },
                                    color: simpleColorSchema,
                                    shade_to: {
                                        type: 'string',
                                        enum: ['light', 'dark'],
                                        default: 'dark',
                                        description: 'Shade direction',
                                        'x-ui-hints': {
                                            label: 'Shade To',
                                            selector: {
                                                select: {
                                                    options: [
                                                        { value: 'light', label: 'Light' },
                                                        { value: 'dark', label: 'Dark' }
                                                    ]
                                                }
                                            }
                                        }
                                    },
                                    shade_intensity: {
                                        type: 'number',
                                        minimum: 0,
                                        maximum: 1,
                                        default: 0.65,
                                        description: 'Shade intensity',
                                        'x-ui-hints': {
                                            label: 'Intensity',
                                            selector: {
                                                number: {
                                                    mode: 'slider',
                                                    min: 0,
                                                    max: 1,
                                                    step: 0.05
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    },

                    // ================================================================
                    // GROUP 12: FORMATTERS - Label and tooltip formatters
                    // ================================================================

                    formatters: {
                        type: 'object',
                        description: 'Label and tooltip formatters',
                        'x-ui-hints': {
                            label: 'Formatters',
                            helper: 'Configure label and tooltip formatting',
                            collapsible: true,
                            defaultCollapsed: true
                        },
                        properties: {
                            xaxis_label: {
                                type: 'string',
                                description: 'X-axis label format template',
                                'x-ui-hints': {
                                    label: 'X-Axis Label',
                                    helper: 'Template for x-axis labels (e.g., "HH:mm")',
                                    selector: {
                                        text: {
                                            placeholder: 'HH:mm'
                                        }
                                    },
                                    examples: ['HH:mm', 'MMM DD', 'YYYY-MM-DD HH:mm']
                                }
                            },
                            yaxis_label: {
                                type: 'string',
                                description: 'Y-axis label format template',
                                'x-ui-hints': {
                                    label: 'Y-Axis Label',
                                    helper: 'Template for y-axis labels (e.g., "{value}°C")',
                                    selector: {
                                        text: {
                                            placeholder: '{value}°C'
                                        }
                                    },
                                    examples: ['{value}°C', '{value}%', '${value}']
                                }
                            },
                            tooltip: {
                                type: 'string',
                                description: 'Tooltip format template',
                                'x-ui-hints': {
                                    label: 'Tooltip',
                                    helper: 'Template for tooltip (e.g., "{x|MMM DD HH:mm}: {y}°C")',
                                    selector: {
                                        text: {
                                            placeholder: '{x|MMM DD HH:mm}: {y}°C'
                                        }
                                    },
                                    examples: [
                                        '{x|MMM DD HH:mm}: {y}°C',
                                        '{x}: {y}',
                                        '{seriesName}: {y}'
                                    ]
                                }
                            }
                        }
                    },

                    // ================================================================
                    // GROUP 12b: REFERENCE LINES and chart-type options
                    // ================================================================

                    zero_line: {
                        type: 'boolean',
                        default: false,
                        description: 'Draw a horizontal reference line at 0'
                    },
                    zero_line_color: {
                        ...simpleColorSchema,
                        description: 'Colour of the zero line'
                    },
                    thresholds: {
                        type: 'array',
                        description: 'Horizontal reference lines at fixed values',
                        items: {
                            type: 'object',
                            properties: {
                                value: { type: 'number', description: 'Y value of the line' },
                                label: { type: 'string', description: 'Text shown on the line' },
                                color: { ...simpleColorSchema, description: 'Line and label colour' },
                                width: { type: 'number', minimum: 0, description: 'Line width (default 2)' },
                                dash: { type: 'boolean', description: 'Dashed line' },
                                opacity: { type: 'number', minimum: 0, maximum: 1, description: 'Line opacity (default 0.7)' }
                            },
                            required: ['value'],
                            additionalProperties: false
                        },
                        examples: [[{ value: 25, label: 'High', color: 'var(--lcars-red)' }]]
                    },
                    value_format: {
                        type: 'string',
                        enum: ['percent'],
                        description: 'radialBar: show values as percentages'
                    },
                    gauge_start_angle: {
                        type: 'number',
                        minimum: -360,
                        maximum: 360,
                        description: 'radialBar: arc start angle in degrees (default -90)'
                    },
                    gauge_total: {
                        type: 'boolean',
                        default: false,
                        description: 'radialBar: show the sum of all gauges in the centre'
                    },
                    gauge_end_angle: {
                        type: 'number',
                        minimum: -360,
                        maximum: 360,
                        description: 'radialBar: arc end angle in degrees (default 90)'
                    },
                    group_rows: {
                        type: 'boolean',
                        default: true,
                        description: 'rangeBar: put bars with the same label on one row'
                    },
                    show_labels: {
                        type: 'boolean',
                        default: true,
                        description: 'rangeBar: show labels on the bars'
                    },

                    // ================================================================
                    // GROUP 13: CHART_OPTIONS - Raw ApexCharts pass-through
                    // ================================================================

                    chart_options: {
                        type: 'object',
                        description: 'Raw ApexCharts options (highest precedence - overrides all other settings)',
                        'x-ui-hints': {
                            label: 'Chart Options',
                            helper: 'Raw ApexCharts options object - overrides all other settings',
                            collapsible: true,
                            defaultCollapsed: true,
                            examples: [{
                                plotOptions: {
                                    bar: {
                                        borderRadius: 4,
                                        horizontal: false
                                    }
                                }
                            }]
                        }
                    }
                }
            }
        },
        required: ['type']
    };
}
