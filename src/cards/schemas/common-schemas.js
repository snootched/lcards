/**
 * Common Schema Definitions
 *
 * Shared, reusable schema components used across multiple card types.
 * Most schemas are exported as constants for direct use.
 * Factory functions (like getTextSchema) are used when customization is needed.
 */

// ============================================================================
// DATA SOURCES SCHEMA - Historical data queries and transformations
// ============================================================================

export const dataSourcesSchema = {
    type: 'object',
    description: 'Historical data sources for charts and analytics. Each key defines a named data source that can be referenced in templates and configurations.',
    $comment: 'Data sources enable real-time subscriptions, historical data queries, transformations, and aggregations',
    examples: [
        {
            temp_history: {
                entity: 'sensor.temperature',
                windowSeconds: 3600,
                history: {
                    enabled: true,
                    hours: 6
                },
                transformations: [
                    {
                        type: 'moving_average',
                        window: 10,
                        key: 'smoothed'
                    }
                ]
            },
            power_usage: {
                entity: 'sensor.power',
                attribute: 'current',
                minEmitMs: 1000,
                coalesceMs: 200
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
                description: 'Entity ID to track (format: domain.object_id)',
                examples: ['sensor.temperature', 'light.living_room']
            },
            attribute: {
                type: 'string',
                description: 'Entity attribute to track instead of state',
                examples: ['temperature', 'brightness', 'current']
            },
            windowSeconds: {
                type: 'number',
                minimum: 1,
                maximum: 86400,
                description: 'Rolling window size in seconds (1-86400, default: 60)',
                examples: [60, 3600, 86400]
            },
            minEmitMs: {
                type: 'number',
                minimum: 0,
                maximum: 10000,
                description: 'Minimum time between updates in milliseconds (throttling, default: 100)',
                examples: [100, 1000, 5000]
            },
            coalesceMs: {
                type: 'number',
                minimum: 0,
                maximum: 5000,
                description: 'Coalesce rapid changes within window in milliseconds (default: auto)',
                examples: [50, 100, 200]
            },
            maxDelayMs: {
                type: 'number',
                minimum: 0,
                maximum: 10000,
                description: 'Maximum delay before forced emission in milliseconds (default: auto)',
                examples: [500, 1000, 2000]
            },
            emitOnSameValue: {
                type: 'boolean',
                description: 'Emit updates even if value unchanged (default: true)'
            },
            history: {
                type: 'object',
                description: 'Historical data preload configuration',
                properties: {
                    enabled: {
                        type: 'boolean',
                        description: 'Enable historical data preload (default: true)'
                    },
                    hours: {
                        type: 'number',
                        minimum: 1,
                        maximum: 168,
                        description: 'Hours of history to preload (1-168, default: 6)'
                    },
                    days: {
                        type: 'number',
                        minimum: 1,
                        maximum: 7,
                        description: 'Days of history to preload (1-7)'
                    }
                }
            },
            transformations: {
                type: 'array',
                description: 'Data transformations to apply in sequence',
                items: {
                    type: 'object',
                    properties: {
                        type: {
                            type: 'string',
                            description: 'Transformation type',
                            examples: ['moving_average', 'unit_conversion', 'smooth', 'expression', 'sum', 'min', 'max']
                        },
                        key: {
                            type: 'string',
                            description: 'Key for accessing transformation result in templates',
                            examples: ['smoothed', 'celsius', 'hourly_avg']
                        },
                        window: {
                            type: 'number',
                            minimum: 1,
                            description: 'Window size for transformation (number of data points)'
                        },
                        method: {
                            type: 'string',
                            description: 'Transformation method/algorithm',
                            examples: ['moving_average', 'exponential']
                        },
                        expression: {
                            type: 'string',
                            description: 'JavaScript expression for custom transformations'
                        }
                    },
                    required: ['type']
                }
            },
            aggregations: {
                type: 'array',
                description: 'Statistical aggregations over time windows',
                items: {
                    type: 'object',
                    properties: {
                        type: {
                            type: 'string',
                            description: 'Aggregation type',
                            examples: ['moving_average', 'min', 'max', 'sum', 'count', 'rate']
                        },
                        key: {
                            type: 'string',
                            description: 'Key for accessing aggregation result',
                            examples: ['avg_15m', 'hourly_max', 'daily_sum']
                        },
                        window: {
                            type: ['number', 'string'],
                            description: 'Time window for aggregation (number in seconds or string like "15m", "1h", "24h")',
                            examples: [900, '15m', '1h', '24h']
                        }
                    },
                    required: ['type']
                }
            }
        },
        required: ['entity']
    }
};

// ============================================================================
// ACTION SCHEMA - Home Assistant action configuration
// ============================================================================

export const actionSchema = {
    type: 'object',
    description: 'Action to perform on interaction (tap, hold, or double-tap). Supports toggle, service calls, navigation, more-info dialog, or no action.',
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

// ============================================================================
// ANIMATION SCHEMA - Card animation configuration
// ============================================================================

export const animationSchema = {
    type: 'object',
    description: 'Visual animation triggered by user interactions or entity state changes',
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

// ============================================================================
// FILTER SCHEMA - CSS and SVG filter configuration
// ============================================================================

export const filterSchema = {
    type: 'object',
    description: 'Filter configuration (CSS or SVG filter primitives)',
    examples: [
        {
            mode: 'css',
            type: 'blur',
            value: { blur: 2 }
        },
        {
            mode: 'svg',
            type: 'feGaussianBlur',
            value: { stdDeviation: 3 }
        }
    ],
    properties: {
        mode: {
            type: 'string',
            enum: ['css', 'svg'],
            default: 'css',
            description: 'Filter mode - CSS filters or SVG filter primitives',
            enumDescriptions: [
                'CSS filters (blur, brightness, contrast, etc.) - simpler, good performance',
                'SVG filter primitives (feGaussianBlur, feColorMatrix, etc.) - more powerful, complex effects'
            ]
        },
        type: {
            type: 'string',
            description: 'Filter type - depends on mode (CSS: blur, brightness, etc. / SVG: feGaussianBlur, feColorMatrix, etc.)'
        },
        value: {
            oneOf: [
                { type: 'string', description: 'Simple value for CSS filters (e.g., "5px", "1.5", "180deg")' },
                { type: 'number', description: 'Numeric value for CSS filters (e.g., 1.5, 0.8)' },
                { type: 'object', description: 'Object parameters for SVG filters', additionalProperties: true }
            ],
            description: 'Filter parameters - simple value for CSS filters, object for SVG filters'
        }
    },
    required: ['type']
};

// ============================================================================
// COLOR SCHEMAS
// ============================================================================

/**
 * Simple color schema - single color value
 */
export const simpleColorSchema = {
    type: 'string',
    pattern: '^(#[0-9A-Fa-f]{6}|#[0-9A-Fa-f]{8}|transparent|theme:|rgb\\(|rgba\\(|hsl\\(|var\\(--)',
    description: 'Color value (hex, rgb, theme token, or CSS variable)',
    examples: ['#FF9900', 'transparent', 'theme:palette.moonlight', 'rgb(255, 153, 0)', 'var(--lcars-orange)']
};

/**
 * State-dependent color schema - different colors for entity states
 */
export const stateColorSchema = {
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
            },
            additionalProperties: {
                type: 'string',
                pattern: '^(#[0-9A-Fa-f]{6}|#[0-9A-Fa-f]{8}|transparent|theme:|rgb\\(|rgba\\(|hsl\\(|var\\(--)',
                description: 'Custom state color (e.g., "heating", "cooling")'
            }
        }
    ]
};

/**
 * Padding schema - uniform or per-side padding
 */
export const paddingSchema = {
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

/**
 * Entity schema - HA entity ID
 */
export const entitySchema = {
    type: 'string',
    format: 'entity',
    pattern: '^[a-z_]+\\.[a-z0-9_]+$',
    description: 'Home Assistant entity ID to control or monitor (format: domain.object_id)',
    examples: ['light.living_room', 'switch.fan', 'sensor.temperature'],
    'x-ui-hints': {
        label: 'Entity',
        helper: 'Select the Home Assistant entity this card controls',
        selector: {
            entity: {}
        }
    }
};

/**
 * Card ID schema - custom identifier for rules/animations
 */
export const cardIdSchema = {
    type: 'string',
    pattern: '^[a-zA-Z0-9_-]+$',
    description: 'Unique card identifier for rule targeting, animations, and debugging (alphanumeric, underscore, hyphen)',
    examples: ['main-button', 'nav_home', 'control123']
};

/**
 * Tags schema - array of tags for bulk targeting
 */
export const tagsSchema = {
    type: 'array',
    items: {
        type: 'string',
        pattern: '^[a-zA-Z0-9_-]+$'
    },
    description: 'Tags for bulk rule targeting and grouping. Allows applying rules to multiple cards at once using tag selectors.',
    examples: [['navigation', 'primary'], ['control', 'lights']]
};

/**
 * Grid options schema - HA layout grid configuration
 */
export const gridOptionsSchema = {
    type: 'object',
    description: 'Home Assistant grid layout options. Controls how many rows and columns this card occupies in the dashboard grid.',
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
};

/**
 * Rules Schema - Dynamic styling rules for conditional overlay/card styling
 * Used by MSD and other cards supporting rules-based behavior
 */
export const rulesSchema = {
    type: 'array',
    optional: true,
    description: 'Dynamic styling rules evaluated by RulesEngine singleton. Rules can target overlays across all cards using IDs, tags, types, or patterns.',
    items: {
        type: 'object',
        required: ['id', 'when', 'apply'],
        properties: {
            id: {
                type: 'string',
                description: 'Unique rule identifier used for debugging and tracing',
                examples: ['temp_alert', 'high_cpu_warning', 'offline_status']
            },
            when: {
                type: 'object',
                description: 'Condition(s) that must be met for rule to apply. Supports 20+ condition types including entity state, time, performance, DataSources, and logical composition (all/any/not).',
                additionalProperties: true,
                examples: [
                    { entity: 'sensor.temperature', above: 25 },
                    { all: [{ entity: 'light.bedroom', state: 'on' }, { time: { after: '22:00' } }] },
                    { datasource: 'cpu_usage', above: 80 }
                ]
            },
            apply: {
                type: 'object',
                description: 'Style changes, profile activations, and animations to apply when conditions are met',
                properties: {
                    overlays: {
                        type: 'object',
                        description: 'Overlay style changes using direct IDs or selectors (all, type:, tag:, pattern:, exclude:)',
                        additionalProperties: true,
                        examples: [
                            { temp_display: { style: { color: 'var(--lcars-red)' } } },
                            { 'tag:critical': { style: { color: 'var(--lcars-alert-red)', border_width: '3px' } } },
                            { all: { style: { opacity: 0.5 } }, exclude: ['main_display'] }
                        ]
                    },
                    base_svg: {
                        type: 'object',
                        description: 'Base SVG filter updates (MSD cards only)',
                        properties: {
                            filters: {
                                type: 'object',
                                description: 'SVG filter properties to update'
                            },
                            filter_preset: {
                                type: 'string',
                                description: 'Named filter preset to apply',
                                examples: ['dimmed', 'bright', 'red-alert']
                            },
                            transition: {
                                type: 'number',
                                minimum: 0,
                                description: 'Transition duration in milliseconds',
                                default: 300
                            }
                        }
                    },
                    profiles: {
                        type: 'array',
                        items: { type: 'string' },
                        description: 'Profile IDs to activate when rule matches',
                        examples: [['night_mode'], ['alert_profile', 'dim_displays']]
                    },
                    animations: {
                        type: 'array',
                        items: { type: 'string' },
                        description: 'Animation IDs to trigger when rule matches',
                        examples: [['pulse_alert'], ['fade_in', 'glow']]
                    }
                },
                examples: [
                    { overlays: { temp_display: { style: { color: 'var(--lcars-red)' } } } },
                    { overlays: { 'tag:warning': { style: { opacity: 1 } } }, animations: ['pulse'] },
                    { base_svg: { filter_preset: 'red-alert', transition: 500 }, profiles: ['alert_mode'] }
                ]
            },
            stop: {
                type: 'boolean',
                default: false,
                description: 'Stop evaluation after this rule if it matches (rule priority control)'
            },
            priority: {
                type: 'number',
                description: 'Rule evaluation priority (higher values evaluated first, default: 0)',
                default: 0
            },
            enabled: {
                type: 'boolean',
                default: true,
                description: 'Enable or disable rule evaluation'
            }
        },
        examples: [
            {
                id: 'temp_alert',
                when: { entity: 'sensor.temperature', above: 25 },
                apply: { overlays: { temp_display: { style: { color: 'var(--lcars-red)' } } } }
            },
            {
                id: 'high_priority_alert',
                when: { entity: 'binary_sensor.critical', state: 'on' },
                apply: {
                    overlays: { 'tag:critical': { style: { color: 'var(--lcars-alert-red)' } } },
                    animations: ['pulse_alert']
                },
                priority: 100,
                stop: true
            }
        ]
    },
    'x-ui': {
        control: 'array',
        label: 'Rules',
        helper: 'Conditional styling rules evaluated by RulesEngine singleton'
    }
};

/**
 * Get text schema for multi-text label system
 * @param {Object} options - Schema options
 * @param {Array<string>} options.positionEnum - Available position values
 * @returns {Object} Text schema
 */
export function getTextSchema(options = {}) {
    const { positionEnum = [] } = options;

    return {
        type: 'object',
        description: 'Multi-text label system',
        $comment: 'Text fields use arbitrary keys. "default" provides styling inherited by all other text fields. All other keys create actual rendered text elements.',
        examples: [
            {
                label1: {
                    content: 'Temperature',
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
                        description: 'Text rotation in degrees (-360 to 360)',
                        'x-ui-hints': {
                            label: 'Rotation',
                            helper: 'Rotate text in degrees',
                            selector: {
                                number: {
                                    mode: 'box',
                                    min: -360,
                                    max: 360,
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
                                default: 14,
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
                            helper: 'Font size in pixels (1-200). Use YAML for theme tokens.',
                            selector: {
                                number: {
                                    mode: 'box',
                                    min: 1,
                                    max: 200,
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
                    examples: ['Temperature', '{{entity.state}}', '{entity.attributes.brightness}']
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
                        helper: 'Font size in pixels (1-200). Use YAML for theme tokens.',
                        selector: {
                            number: {
                                mode: 'box',
                                min: 1,
                                max: 200,
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
                    default: 'false',
                    description: 'Enable template string evaluation (e.g., {{entity.state}})'
                }
            }
        }
    };
}
