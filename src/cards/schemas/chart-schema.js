/**
 * Chart Card Schema - Complete Implementation
 *
 * Comprehensive schema for LCARdS Chart Card with 50+ style properties,
 * data source configuration (3 levels), formatters, and x-ui-hints.
 *
 * This schema enables:
 * - Full validation of chart configurations
 * - Auto-generated GUI editor from x-ui-hints
 * - Support for all ApexCharts features
 * - Simple template-based formatters
 *
 * @see doc/user/configuration/cards/chart.md
 * @see doc/architecture/schemas/chart-schema-definition.md
 */

/**
 * Get complete chart card schema
 * @param {Object} options - Schema options
 * @param {Array<string>} options.availableAnimationPresets - Animation preset names
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

    // Color pattern for validation
    const colorPattern = '^(#[0-9A-Fa-f]{6}|#[0-9A-Fa-f]{8}|transparent|theme:|rgb\\(|rgba\\(|hsl\\(|var\\(--)';

    // Simple color schema (single color value)
    const simpleColorSchema = {
        type: 'string',
        pattern: colorPattern,
        description: 'Color value (hex, rgb, rgba, theme token, or CSS variable)',
        examples: ['#FF9900', 'rgba(255, 153, 0, 0.7)', 'theme:colors.primary.orange', 'var(--lcars-orange)']
    };

    // Color array schema
    const colorArraySchema = {
        type: 'array',
        items: simpleColorSchema,
        description: 'Array of color values for multiple series',
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

    // ============================================================================
    // MAIN SCHEMA
    // ============================================================================

    return {
        $schema: 'http://json-schema.org/draft-07/schema#',
        $id: 'https://github.com/snootched/lcards/schemas/chart-schema',
        title: 'LCARdS Chart Card Configuration',
        description: 'Complete configuration schema for lcards-chart custom card',
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
                type: 'string',
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
                type: 'array',
                items: { type: 'string' },
                description: 'Tags for bulk rule targeting',
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

            name: {
                type: 'string',
                description: 'Display name for the card (optional)',
                'x-ui-hints': {
                    label: 'Name',
                    helper: 'Optional display name for the chart',
                    selector: {
                        text: {}
                    }
                }
            },

            // ====================================================================
            // DATA SOURCE CONFIGURATION (3 LEVELS)
            // ====================================================================

            // Level 1: Simple entity reference
            source: {
                type: 'string',
                description: 'Single entity ID (auto-creates DataSource with defaults)',
                'x-ui-hints': {
                    label: 'Data Source',
                    helper: 'Simple entity reference - automatically creates a DataSource',
                    selector: {
                        entity: {}
                    }
                }
            },

            attribute: {
                type: 'string',
                description: 'Entity attribute to track (optional - works with source)',
                'x-ui-hints': {
                    label: 'Attribute',
                    helper: 'Track specific entity attribute instead of state',
                    selector: {
                        text: {
                            placeholder: 'temperature'
                        }
                    },
                    examples: ['temperature', 'humidity', 'brightness']
                }
            },

            // Level 2: Multiple sources
            sources: {
                oneOf: [
                    {
                        type: 'array',
                        items: { type: 'string' },
                        title: 'Entity Array',
                        description: 'Array of entity IDs (auto-creates DataSource for each)'
                    },
                    {
                        type: 'array',
                        items: { type: 'string' },
                        title: 'DataSource Names',
                        description: 'Array of DataSource names (references data_sources config)'
                    }
                ],
                'x-ui-hints': {
                    label: 'Multiple Sources',
                    helper: 'Multiple entities or DataSource references for multi-series charts',
                    defaultOneOfBranch: 0,
                    examples: [
                        ['sensor.indoor_temp', 'sensor.outdoor_temp'],
                        ['temp_source_1', 'temp_source_2']
                    ]
                }
            },

            series_names: {
                type: 'array',
                items: { type: 'string' },
                description: 'Custom legend names for series (matches sources order)',
                'x-ui-hints': {
                    label: 'Series Names',
                    helper: 'Custom names for chart legend (must match sources order)',
                    examples: [['Indoor', 'Outdoor'], ['CPU', 'GPU', 'Disk']]
                }
            },

            // Level 3: Advanced DataSource configuration
            data_sources: {
                type: 'object',
                description: 'Advanced DataSource configurations with inline settings',
                additionalProperties: {
                    type: 'object',
                    properties: {
                        entity: {
                            type: 'string',
                            description: 'Entity ID to track',
                            'x-ui-hints': {
                                label: 'Entity',
                                selector: {
                                    entity: {}
                                }
                            }
                        },
                        attribute: {
                            type: 'string',
                            description: 'Entity attribute to track',
                            'x-ui-hints': {
                                label: 'Attribute',
                                selector: {
                                    text: {}
                                }
                            }
                        },
                        window_seconds: {
                            type: 'number',
                            minimum: 60,
                            maximum: 86400,
                            default: 3600,
                            description: 'Rolling window size in seconds',
                            'x-ui-hints': {
                                label: 'Window (seconds)',
                                helper: 'How much historical data to keep in memory',
                                selector: {
                                    number: {
                                        mode: 'slider',
                                        min: 60,
                                        max: 86400,
                                        step: 60,
                                        unit_of_measurement: 's'
                                    }
                                }
                            }
                        },
                        minEmitMs: {
                            type: 'number',
                            minimum: 0,
                            maximum: 10000,
                            default: 0,
                            description: 'Minimum time between updates in milliseconds (throttling)',
                            'x-ui-hints': {
                                label: 'Min Emit (ms)',
                                helper: 'Throttle: minimum time between data updates',
                                selector: {
                                    number: {
                                        min: 0,
                                        max: 10000,
                                        step: 50,
                                        unit_of_measurement: 'ms'
                                    }
                                }
                            }
                        },
                        coalesceMs: {
                            type: 'number',
                            minimum: 0,
                            maximum: 5000,
                            default: 0,
                            description: 'Coalesce rapid changes within window (milliseconds)',
                            'x-ui-hints': {
                                label: 'Coalesce (ms)',
                                helper: 'Group rapid changes within this time window',
                                selector: {
                                    number: {
                                        min: 0,
                                        max: 5000,
                                        step: 50,
                                        unit_of_measurement: 'ms'
                                    }
                                }
                            }
                        },
                        maxDelayMs: {
                            type: 'number',
                            minimum: 0,
                            maximum: 10000,
                            default: 0,
                            description: 'Maximum delay before forced emission (milliseconds)',
                            'x-ui-hints': {
                                label: 'Max Delay (ms)',
                                helper: 'Force emission after this delay even if coalescing',
                                selector: {
                                    number: {
                                        min: 0,
                                        max: 10000,
                                        step: 100,
                                        unit_of_measurement: 'ms'
                                    }
                                }
                            }
                        },
                        history: {
                            type: 'object',
                            description: 'History preload configuration',
                            properties: {
                                preload: {
                                    type: 'boolean',
                                    default: false,
                                    description: 'Preload historical data on initialization',
                                    'x-ui-hints': {
                                        label: 'Preload History',
                                        helper: 'Load historical data when chart initializes',
                                        selector: {
                                            boolean: {}
                                        }
                                    }
                                },
                                hours: {
                                    type: 'number',
                                    minimum: 0,
                                    maximum: 168,
                                    default: 0,
                                    description: 'Hours of history to preload',
                                    'x-ui-hints': {
                                        label: 'Hours',
                                        helper: 'Number of hours of historical data to load',
                                        selector: {
                                            number: {
                                                min: 0,
                                                max: 168,
                                                step: 1,
                                                unit_of_measurement: 'h'
                                            }
                                        }
                                    }
                                },
                                days: {
                                    type: 'number',
                                    minimum: 0,
                                    maximum: 30,
                                    default: 0,
                                    description: 'Days of history to preload',
                                    'x-ui-hints': {
                                        label: 'Days',
                                        helper: 'Number of days of historical data to load',
                                        selector: {
                                            number: {
                                                min: 0,
                                                max: 30,
                                                step: 1,
                                                unit_of_measurement: 'd'
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    },
                    required: ['entity']
                },
                'x-ui-hints': {
                    label: 'Advanced Data Sources',
                    helper: 'Define advanced DataSource configurations with fine-grained control',
                    examples: [{
                        temperature: {
                            entity: 'sensor.temperature',
                            window_seconds: 7200,
                            minEmitMs: 500,
                            history: { preload: true, hours: 2 }
                        }
                    }]
                }
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

            height: {
                type: 'number',
                minimum: 100,
                maximum: 1000,
                default: 300,
                description: 'Chart height in pixels',
                'x-ui-hints': {
                    label: 'Height',
                    helper: 'Chart height in pixels',
                    selector: {
                        number: {
                            mode: 'slider',
                            min: 100,
                            max: 1000,
                            step: 50,
                            unit_of_measurement: 'px'
                        }
                    }
                }
            },

            width: {
                type: 'number',
                minimum: 100,
                maximum: 2000,
                description: 'Chart width in pixels (optional - defaults to container width)',
                'x-ui-hints': {
                    label: 'Width',
                    helper: 'Chart width in pixels (leave empty to use container width)',
                    selector: {
                        number: {
                            mode: 'slider',
                            min: 100,
                            max: 2000,
                            step: 50,
                            unit_of_measurement: 'px'
                        }
                    }
                }
            },

            show_legend: {
                type: 'boolean',
                default: false,
                description: 'Show/hide chart legend',
                'x-ui-hints': {
                    label: 'Show Legend',
                    helper: 'Display legend for multi-series charts',
                    selector: {
                        boolean: {}
                    }
                }
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
                    },
                    enumDescriptions: [
                        'Datetime - Time series data',
                        'Category - Categorical labels',
                        'Numeric - Numeric values'
                    ]
                }
            },

            time_window: {
                type: 'number',
                minimum: 60,
                maximum: 86400,
                description: 'Time window in seconds (for datetime x-axis)',
                'x-ui-hints': {
                    label: 'Time Window',
                    helper: 'Time range to display on x-axis (seconds)',
                    selector: {
                        number: {
                            mode: 'slider',
                            min: 60,
                            max: 86400,
                            step: 60,
                            unit_of_measurement: 's'
                        }
                    }
                }
            },

            max_points: {
                type: 'number',
                minimum: 0,
                maximum: 1000,
                default: 0,
                description: 'Maximum data points to display (0 = unlimited, enables decimation)',
                'x-ui-hints': {
                    label: 'Max Points',
                    helper: 'Limit number of data points (0 = unlimited)',
                    selector: {
                        number: {
                            mode: 'box',
                            min: 0,
                            max: 1000,
                            step: 10
                        }
                    }
                }
            },

            // ====================================================================
            // STYLE PROPERTIES (50+ properties)
            // ====================================================================

            style: {
                type: 'object',
                description: 'Chart styling configuration',
                properties: {

                    // ================================================================
                    // COLORS
                    // ================================================================

                    colors: {
                        ...colorArraySchema,
                        description: 'Series colors (main data visualization colors)',
                        'x-ui-hints': {
                            label: 'Series Colors',
                            helper: 'Colors for chart series (supports hex, rgba, theme tokens, CSS variables)',
                            examples: [
                                ['#FF9900', '#99CCFF'],
                                ['theme:colors.primary.orange', 'theme:colors.accent.blue'],
                                ['var(--lcars-orange)', 'var(--lcars-blue)']
                            ]
                        }
                    },

                    color: simpleColorSchema,  // Alias for single series

                    stroke_colors: {
                        ...colorArraySchema,
                        description: 'Line/border colors (separate from fill)',
                        'x-ui-hints': {
                            label: 'Stroke Colors',
                            helper: 'Colors for lines and borders',
                            examples: [['#FF9900', '#FFCC00']]
                        }
                    },

                    stroke_color: simpleColorSchema,  // Alias for single series

                    fill_colors: {
                        ...colorArraySchema,
                        description: 'Fill colors for area/bar charts',
                        'x-ui-hints': {
                            label: 'Fill Colors',
                            helper: 'Colors for filled areas (area charts, bar charts)',
                            examples: [['#FF9900', '#99CCFF']]
                        }
                    },

                    marker_colors: {
                        ...colorArraySchema,
                        description: 'Data point marker colors',
                        'x-ui-hints': {
                            label: 'Marker Colors',
                            helper: 'Colors for data point markers',
                            examples: [['#FF9900', '#99CCFF']]
                        }
                    },

                    marker_stroke_colors: {
                        ...colorArraySchema,
                        description: 'Data point marker border colors',
                        'x-ui-hints': {
                            label: 'Marker Stroke Colors',
                            helper: 'Border colors for data point markers',
                            examples: [['#FFFFFF']]
                        }
                    },

                    grid_color: {
                        ...simpleColorSchema,
                        description: 'Grid line color',
                        'x-ui-hints': {
                            label: 'Grid Color',
                            helper: 'Color for grid lines',
                            examples: ['rgba(255, 255, 255, 0.1)', 'var(--lcars-gray)']
                        }
                    },

                    grid_row_colors: {
                        ...colorArraySchema,
                        description: 'Alternating row background colors',
                        'x-ui-hints': {
                            label: 'Grid Row Colors',
                            helper: 'Alternating colors for row backgrounds',
                            examples: [['transparent', 'rgba(255, 255, 255, 0.05)']]
                        }
                    },

                    grid_column_colors: {
                        ...colorArraySchema,
                        description: 'Alternating column background colors',
                        'x-ui-hints': {
                            label: 'Grid Column Colors',
                            helper: 'Alternating colors for column backgrounds',
                            examples: [['transparent', 'rgba(255, 255, 255, 0.03)']]
                        }
                    },

                    axis_color: {
                        ...simpleColorSchema,
                        description: 'Unified axis label color (fallback for both axes)',
                        'x-ui-hints': {
                            label: 'Axis Color',
                            helper: 'Default color for all axis labels',
                            examples: ['#FFFFFF', 'var(--primary-text-color)']
                        }
                    },

                    xaxis_color: {
                        ...simpleColorSchema,
                        description: 'X-axis label color',
                        'x-ui-hints': {
                            label: 'X-Axis Color',
                            helper: 'Color for x-axis labels',
                            examples: ['#FFCC00']
                        }
                    },

                    yaxis_color: {
                        ...simpleColorSchema,
                        description: 'Y-axis label color',
                        'x-ui-hints': {
                            label: 'Y-Axis Color',
                            helper: 'Color for y-axis labels',
                            examples: ['#FF9900']
                        }
                    },

                    xaxis_colors: colorArraySchema,
                    yaxis_colors: colorArraySchema,

                    axis_border_color: {
                        ...simpleColorSchema,
                        description: 'Axis line/border color',
                        'x-ui-hints': {
                            label: 'Axis Border Color',
                            helper: 'Color for axis lines',
                            examples: ['#666666']
                        }
                    },

                    axis_ticks_color: {
                        ...simpleColorSchema,
                        description: 'Axis tick mark color',
                        'x-ui-hints': {
                            label: 'Axis Ticks Color',
                            helper: 'Color for axis tick marks',
                            examples: ['#444444']
                        }
                    },

                    legend_color: {
                        ...simpleColorSchema,
                        description: 'Legend text color',
                        'x-ui-hints': {
                            label: 'Legend Color',
                            helper: 'Color for legend text',
                            examples: ['#FFFFFF']
                        }
                    },

                    legend_colors: {
                        ...colorArraySchema,
                        description: 'Per-series legend colors',
                        'x-ui-hints': {
                            label: 'Legend Colors',
                            helper: 'Individual colors for each legend item',
                            examples: [['#FF9900', '#FFCC00']]
                        }
                    },

                    data_label_colors: {
                        ...colorArraySchema,
                        description: 'Data label text colors',
                        'x-ui-hints': {
                            label: 'Data Label Colors',
                            helper: 'Colors for data labels on chart',
                            examples: [['#FFFFFF']]
                        }
                    },

                    background_color: {
                        ...simpleColorSchema,
                        description: 'Chart background color',
                        'x-ui-hints': {
                            label: 'Background Color',
                            helper: 'Background color for entire chart',
                            examples: ['rgba(0, 0, 0, 0.3)', 'transparent']
                        }
                    },

                    foreground_color: {
                        ...simpleColorSchema,
                        description: 'Foreground/text color',
                        'x-ui-hints': {
                            label: 'Foreground Color',
                            helper: 'Default color for text and foreground elements',
                            examples: ['#FFFFFF', 'var(--primary-text-color)']
                        }
                    },

                    // ================================================================
                    // STROKE/LINE STYLING
                    // ================================================================

                    stroke_width: {
                        type: 'number',
                        minimum: 0,
                        maximum: 20,
                        default: 2,
                        description: 'Line/stroke width in pixels',
                        'x-ui-hints': {
                            label: 'Stroke Width',
                            helper: 'Width of lines and borders',
                            selector: {
                                number: {
                                    mode: 'slider',
                                    min: 0,
                                    max: 20,
                                    step: 1,
                                    unit_of_measurement: 'px'
                                }
                            }
                        }
                    },

                    curve: {
                        type: 'string',
                        enum: ['smooth', 'straight', 'stepline', 'monotoneCubic'],
                        default: 'smooth',
                        description: 'Line curve style',
                        'x-ui-hints': {
                            label: 'Curve Style',
                            helper: 'How lines are drawn between data points',
                            selector: {
                                select: {
                                    options: [
                                        { value: 'smooth', label: 'Smooth' },
                                        { value: 'straight', label: 'Straight' },
                                        { value: 'stepline', label: 'Step Line' },
                                        { value: 'monotoneCubic', label: 'Monotone Cubic' }
                                    ]
                                }
                            },
                            enumDescriptions: [
                                'Smooth - Curved lines with spline interpolation',
                                'Straight - Direct lines between points',
                                'Stepline - Step-wise transitions',
                                'Monotone Cubic - Smooth curves preserving monotonicity'
                            ]
                        }
                    },

                    stroke_dash_array: {
                        type: 'number',
                        minimum: 0,
                        maximum: 20,
                        default: 0,
                        description: 'Dashed line pattern (0 = solid)',
                        'x-ui-hints': {
                            label: 'Stroke Dash',
                            helper: 'Dash pattern for lines (0 = solid line)',
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

                    // ================================================================
                    // FILL STYLING (Area/Bar Charts)
                    // ================================================================

                    fill_type: {
                        type: 'string',
                        enum: ['solid', 'gradient', 'pattern', 'image'],
                        default: 'solid',
                        description: 'Fill type for area/bar charts',
                        'x-ui-hints': {
                            label: 'Fill Type',
                            helper: 'Type of fill for area and bar charts',
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

                    fill_opacity: {
                        type: 'number',
                        minimum: 0,
                        maximum: 1,
                        default: 0.7,
                        description: 'Fill opacity (0-1)',
                        'x-ui-hints': {
                            label: 'Fill Opacity',
                            helper: 'Transparency of filled areas (0 = transparent, 1 = opaque)',
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

                    fill_gradient: {
                        type: 'object',
                        description: 'Gradient fill configuration',
                        properties: {
                            shade: {
                                type: 'string',
                                enum: ['light', 'dark'],
                                description: 'Gradient shade direction'
                            },
                            type: {
                                type: 'string',
                                enum: ['horizontal', 'vertical', 'diagonal1', 'diagonal2'],
                                description: 'Gradient direction'
                            },
                            shadeIntensity: {
                                type: 'number',
                                minimum: 0,
                                maximum: 1,
                                description: 'Intensity of shading'
                            },
                            opacityFrom: {
                                type: 'number',
                                minimum: 0,
                                maximum: 1,
                                description: 'Starting opacity'
                            },
                            opacityTo: {
                                type: 'number',
                                minimum: 0,
                                maximum: 1,
                                description: 'Ending opacity'
                            }
                        },
                        'x-ui-hints': {
                            label: 'Fill Gradient',
                            helper: 'Configure gradient fill properties',
                            examples: [{
                                shade: 'dark',
                                type: 'vertical',
                                shadeIntensity: 0.5,
                                opacityFrom: 0.9,
                                opacityTo: 0.3
                            }]
                        }
                    },

                    // ================================================================
                    // GRID STYLING
                    // ================================================================

                    show_grid: {
                        type: 'boolean',
                        default: true,
                        description: 'Show/hide grid lines',
                        'x-ui-hints': {
                            label: 'Show Grid',
                            helper: 'Display grid lines on chart',
                            selector: {
                                boolean: {}
                            }
                        }
                    },

                    grid_opacity: {
                        type: 'number',
                        minimum: 0,
                        maximum: 1,
                        default: 0.3,
                        description: 'Grid line opacity (0-1)',
                        'x-ui-hints': {
                            label: 'Grid Opacity',
                            helper: 'Transparency of grid lines',
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

                    grid_stroke_dash_array: {
                        type: 'number',
                        minimum: 0,
                        maximum: 20,
                        default: 4,
                        description: 'Grid line dash pattern',
                        'x-ui-hints': {
                            label: 'Grid Dash',
                            helper: 'Dash pattern for grid lines',
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

                    // ================================================================
                    // MARKER STYLING (Data Points)
                    // ================================================================

                    marker_size: {
                        type: 'number',
                        minimum: 0,
                        maximum: 20,
                        default: 4,
                        description: 'Data point marker size in pixels',
                        'x-ui-hints': {
                            label: 'Marker Size',
                            helper: 'Size of data point markers',
                            selector: {
                                number: {
                                    mode: 'slider',
                                    min: 0,
                                    max: 20,
                                    step: 1,
                                    unit_of_measurement: 'px'
                                }
                            }
                        }
                    },

                    marker_shape: {
                        type: 'string',
                        enum: ['circle', 'square', 'rect'],
                        default: 'circle',
                        description: 'Marker shape',
                        'x-ui-hints': {
                            label: 'Marker Shape',
                            helper: 'Shape of data point markers',
                            selector: {
                                select: {
                                    options: [
                                        { value: 'circle', label: 'Circle' },
                                        { value: 'square', label: 'Square' },
                                        { value: 'rect', label: 'Rectangle' }
                                    ]
                                }
                            }
                        }
                    },

                    marker_stroke_width: {
                        type: 'number',
                        minimum: 0,
                        maximum: 10,
                        default: 2,
                        description: 'Marker border width',
                        'x-ui-hints': {
                            label: 'Marker Stroke Width',
                            helper: 'Width of marker borders',
                            selector: {
                                number: {
                                    mode: 'slider',
                                    min: 0,
                                    max: 10,
                                    step: 1,
                                    unit_of_measurement: 'px'
                                }
                            }
                        }
                    },

                    // ================================================================
                    // LEGEND STYLING
                    // ================================================================

                    legend_position: {
                        type: 'string',
                        enum: ['top', 'bottom', 'left', 'right'],
                        default: 'bottom',
                        description: 'Legend position',
                        'x-ui-hints': {
                            label: 'Legend Position',
                            helper: 'Where to display the legend',
                            selector: {
                                select: {
                                    options: [
                                        { value: 'top', label: 'Top' },
                                        { value: 'bottom', label: 'Bottom' },
                                        { value: 'left', label: 'Left' },
                                        { value: 'right', label: 'Right' }
                                    ]
                                }
                            }
                        }
                    },

                    legend_font_size: {
                        type: 'number',
                        minimum: 8,
                        maximum: 24,
                        default: 14,
                        description: 'Legend font size in pixels',
                        'x-ui-hints': {
                            label: 'Legend Font Size',
                            helper: 'Font size for legend text',
                            selector: {
                                number: {
                                    mode: 'slider',
                                    min: 8,
                                    max: 24,
                                    step: 1,
                                    unit_of_measurement: 'px'
                                }
                            }
                        }
                    },

                    // ================================================================
                    // DATA LABELS
                    // ================================================================

                    show_data_labels: {
                        type: 'boolean',
                        default: false,
                        description: 'Show data value labels on chart',
                        'x-ui-hints': {
                            label: 'Show Data Labels',
                            helper: 'Display value labels on data points',
                            selector: {
                                boolean: {}
                            }
                        }
                    },

                    data_label_font_size: {
                        type: 'number',
                        minimum: 8,
                        maximum: 24,
                        default: 12,
                        description: 'Data label font size',
                        'x-ui-hints': {
                            label: 'Data Label Font Size',
                            helper: 'Font size for data labels',
                            selector: {
                                number: {
                                    mode: 'slider',
                                    min: 8,
                                    max: 24,
                                    step: 1,
                                    unit_of_measurement: 'px'
                                }
                            }
                        }
                    },

                    // ================================================================
                    // TYPOGRAPHY
                    // ================================================================

                    font_family: {
                        type: 'string',
                        default: 'Antonio, Helvetica Neue, sans-serif',
                        description: 'Font family for all chart text',
                        'x-ui-hints': {
                            label: 'Font Family',
                            helper: 'Font family for chart text',
                            selector: {
                                text: {
                                    placeholder: 'Antonio, sans-serif'
                                }
                            },
                            examples: [
                                'Antonio, Helvetica Neue, sans-serif',
                                'Roboto, sans-serif',
                                'Arial, sans-serif'
                            ]
                        }
                    },

                    font_size: {
                        type: 'number',
                        minimum: 8,
                        maximum: 24,
                        default: 12,
                        description: 'Base font size in pixels',
                        'x-ui-hints': {
                            label: 'Font Size',
                            helper: 'Base font size for chart text',
                            selector: {
                                number: {
                                    mode: 'slider',
                                    min: 8,
                                    max: 24,
                                    step: 1,
                                    unit_of_measurement: 'px'
                                }
                            }
                        }
                    },

                    // ================================================================
                    // DISPLAY OPTIONS
                    // ================================================================

                    show_toolbar: {
                        type: 'boolean',
                        default: false,
                        description: 'Show ApexCharts toolbar',
                        'x-ui-hints': {
                            label: 'Show Toolbar',
                            helper: 'Display ApexCharts toolbar with zoom/download options',
                            selector: {
                                boolean: {}
                            }
                        }
                    },

                    show_tooltip: {
                        type: 'boolean',
                        default: true,
                        description: 'Show tooltips on hover',
                        'x-ui-hints': {
                            label: 'Show Tooltip',
                            helper: 'Display tooltips when hovering over data points',
                            selector: {
                                boolean: {}
                            }
                        }
                    },

                    tooltip_theme: {
                        type: 'string',
                        enum: ['light', 'dark'],
                        default: 'dark',
                        description: 'Tooltip color theme',
                        'x-ui-hints': {
                            label: 'Tooltip Theme',
                            helper: 'Color theme for tooltips',
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

                    // ================================================================
                    // ANIMATION
                    // ================================================================

                    animation_preset: {
                        type: 'string',
                        enum: availableAnimationPresets,
                        description: 'LCARS animation preset',
                        'x-ui-hints': {
                            label: 'Animation Preset',
                            helper: 'Select an animation style for chart entrance and updates',
                            selector: {
                                select: {
                                    options: availableAnimationPresets.map(preset => ({
                                        value: preset,
                                        label: preset.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
                                    }))
                                }
                            },
                            examples: ['lcars_standard', 'lcars_realtime', 'none']
                        }
                    },

                    // ================================================================
                    // THEME
                    // ================================================================

                    theme_mode: {
                        type: 'string',
                        enum: ['light', 'dark'],
                        default: 'dark',
                        description: 'ApexCharts theme mode',
                        'x-ui-hints': {
                            label: 'Theme Mode',
                            helper: 'Light or dark theme for chart',
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

                    theme_palette: {
                        type: 'string',
                        description: 'ApexCharts palette name (optional)',
                        'x-ui-hints': {
                            label: 'Theme Palette',
                            helper: 'Named ApexCharts color palette (optional)',
                            selector: {
                                text: {
                                    placeholder: 'palette1'
                                }
                            }
                        }
                    },

                    monochrome: {
                        type: 'object',
                        description: 'Monochrome color mode configuration',
                        properties: {
                            enabled: {
                                type: 'boolean',
                                default: false,
                                description: 'Enable monochrome mode'
                            },
                            color: {
                                ...simpleColorSchema,
                                description: 'Base color for monochrome palette'
                            },
                            shade_to: {
                                type: 'string',
                                enum: ['light', 'dark'],
                                default: 'dark',
                                description: 'Shade direction'
                            },
                            shade_intensity: {
                                type: 'number',
                                minimum: 0,
                                maximum: 1,
                                default: 0.65,
                                description: 'Intensity of shading'
                            }
                        },
                        'x-ui-hints': {
                            label: 'Monochrome Mode',
                            helper: 'Generate color variations from single base color',
                            examples: [{
                                enabled: true,
                                color: '#FF9900',
                                shade_to: 'dark',
                                shade_intensity: 0.65
                            }]
                        }
                    },

                    // ================================================================
                    // NEW: FORMATTERS (Template-Based)
                    // ================================================================

                    xaxis_label_format: {
                        type: 'string',
                        description: 'X-axis label format string (date format or template with {value})',
                        'x-ui-hints': {
                            label: 'X-Axis Label Format',
                            helper: 'Format string for x-axis labels. Use standard date format (MMM DD, HH:mm) or template with {value}',
                            selector: {
                                text: {
                                    placeholder: 'HH:mm'
                                }
                            },
                            examples: [
                                'MMM DD',
                                'HH:mm',
                                'YYYY-MM-DD HH:mm',
                                'ddd HH:mm',
                                '{value}'
                            ]
                        }
                    },

                    yaxis_label_format: {
                        type: 'string',
                        description: 'Y-axis label format template with {value} token',
                        'x-ui-hints': {
                            label: 'Y-Axis Label Format',
                            helper: 'Format template for y-axis labels. Use {value} token with prefix/suffix',
                            selector: {
                                text: {
                                    placeholder: '{value}°C'
                                }
                            },
                            examples: [
                                '{value}°C',
                                '{value}%',
                                '${value}',
                                '{value} kWh'
                            ]
                        }
                    },

                    tooltip_format: {
                        type: 'string',
                        description: 'Tooltip format template with {x} and {y} tokens',
                        'x-ui-hints': {
                            label: 'Tooltip Format',
                            helper: 'Format template for tooltips. Use {x|format} for date formatting and {y} for value',
                            selector: {
                                text: {
                                    placeholder: '{x|MMM DD HH:mm}: {y}°C'
                                }
                            },
                            examples: [
                                '{x|MMM DD HH:mm}: {y}°C',
                                '{x|HH:mm}: {y}%',
                                '{y} at {x|ddd HH:mm}'
                            ]
                        }
                    },

                    legend_format: {
                        type: 'string',
                        description: 'Legend format template with {seriesName} and {value} tokens',
                        'x-ui-hints': {
                            label: 'Legend Format',
                            helper: 'Format template for legend items',
                            selector: {
                                text: {
                                    placeholder: '{seriesName}: {value}'
                                }
                            },
                            examples: [
                                '{seriesName}: {value}',
                                '{seriesName} ({value}%)'
                            ]
                        }
                    },

                    // ================================================================
                    // RAW PASS-THROUGH (Highest Precedence)
                    // ================================================================

                    chart_options: {
                        type: 'object',
                        description: 'Raw ApexCharts options (highest precedence, bypasses validation)',
                        'x-ui-hints': {
                            label: 'Raw Chart Options',
                            helper: 'Direct ApexCharts configuration - use for advanced customization. See ApexCharts docs.',
                            examples: [{
                                plotOptions: {
                                    bar: {
                                        horizontal: true,
                                        distributed: true
                                    }
                                }
                            }]
                        }
                    }
                }
            },

            // ====================================================================
            // ACTIONS
            // ====================================================================

            tap_action: {
                type: 'object',
                description: 'Action to perform when tapped',
                'x-ui-hints': {
                    label: 'Tap Action',
                    helper: 'Action to perform when chart is tapped',
                    selector: {
                        ui_action: {}
                    }
                }
            },

            hold_action: {
                type: 'object',
                description: 'Action to perform on long press',
                'x-ui-hints': {
                    label: 'Hold Action',
                    helper: 'Action to perform when chart is held/long-pressed',
                    selector: {
                        ui_action: {}
                    }
                }
            },

            double_tap_action: {
                type: 'object',
                description: 'Action to perform on double tap',
                'x-ui-hints': {
                    label: 'Double Tap Action',
                    helper: 'Action to perform when chart is double-tapped',
                    selector: {
                        ui_action: {}
                    }
                }
            }
        }
    };
}
