/**
 * Chart Card Schema - Nested Structure (v1.18.0+)
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

/**
 * Get complete chart card schema with nested structure
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
                description: 'Show/hide chart legend (deprecated - use style.legend.show)',
                'x-ui-hints': {
                    label: 'Show Legend (deprecated)',
                    helper: 'Use style.legend.show instead',
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
                    }
                }
            },

            max_points: {
                type: 'number',
                minimum: 0,
                maximum: 10000,
                default: 0,
                description: 'Maximum data points to display (0 = unlimited)',
                'x-ui-hints': {
                    label: 'Max Points',
                    helper: 'Limit number of data points (0 = unlimited, auto-decimates if exceeded)',
                    selector: {
                        number: {
                            min: 0,
                            max: 10000,
                            step: 10
                        }
                    }
                }
            },

            // ====================================================================
            // NESTED STYLE CONFIGURATION (v1.18.0+)
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
                        description: 'Complete color configuration for all chart elements',
                        'x-ui-hints': {
                            label: 'Colors',
                            helper: 'Configure colors for all chart elements',
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
                                description: 'Marker colors',
                                'x-ui-hints': {
                                    label: 'Marker Colors',
                                    helper: 'Configure fill and stroke colors for data point markers',
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
                                description: 'Axis colors',
                                'x-ui-hints': {
                                    label: 'Axis Colors',
                                    helper: 'Configure colors for x-axis, y-axis, borders, and tick marks',
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
                                description: 'Legend colors',
                                'x-ui-hints': {
                                    label: 'Legend Colors',
                                    helper: 'Configure default legend text color and per-series item colors',
                                    collapsible: true,
                                    defaultCollapsed: true
                                },
                                properties: {
                                    default: simpleColorSchema,
                                    items: colorArraySchema
                                }
                            },
                            
                            data_labels: simpleColorSchema
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
                                enum: ['circle', 'square', 'rect', 'rhombus'],
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
                                                { value: 'rhombus', label: 'Rhombus' }
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
                            helper: 'Configure grid lines and colors',
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
                                minimum: 0,
                                maximum: 1,
                                default: 0.3,
                                description: 'Grid line opacity',
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
