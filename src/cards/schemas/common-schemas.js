/**
 * Common Schema Definitions
 *
 * Shared, reusable schema components used across multiple card types.
 * Most schemas are exported as constants for direct use.
 * Factory functions (like getTextSchema) are used when customization is needed.
 */

import { ANIMATION_PRESET_PARAMS_SCHEMAS, ANIMATION_PRESET_PARAMS_SCHEMAS_MAPRANGE_AWARE } from './animation-preset-params-schemas.js';

// ============================================================================
// COLOR VALUE PRIMITIVES
// ============================================================================

/**
 * Regex pattern that matches every string the LCARdS colour resolution pipeline accepts:
 *   - Hex:      #RGB · #RGBA · #RRGGBB · #RRGGBBAA
 *   - CSS:      rgb( · rgba( · hsl( · hsla(
 *   - Variable: var(--name)
 *   - Keywords: transparent · match-light
 *   - Token:    theme:path  (includes theme:expr(…))
 *   - Computed: alpha( · darken( · lighten( · saturate( · desaturate( · base(
 *               (functions accepted by ThemeTokenResolver / ColorUtils)
 */
const COLOR_VALUE_PATTERN =
    '^(#[0-9A-Fa-f]{3,8}|transparent|match-light|theme:|rgb\\(|rgba\\(|hsl\\(|hsla\\(|var\\(--|alpha\\(|darken\\(|lighten\\(|saturate\\(|desaturate\\(|base\\()';

/**
 * Reusable schema for a single colour value string.
 * Referenced throughout stateColorSchema for all per-state properties.
 */
const colorValueSchema = {
    type: 'string',
    pattern: COLOR_VALUE_PATTERN,
    description:
        'Colour value: hex (#RRGGBB / #RRGGBBAA), rgb/rgba/hsl/hsla(), CSS variable (var(--name)), ' +
        'theme token (theme:colors.ui.primary), or computed expression ' +
        '(alpha(…,opacity), darken(…,amount), lighten(…,amount), saturate(…,amount), desaturate(…,amount), base(…))',
    examples: [
        '#FF9900',
        '#FF990080',
        'transparent',
        'match-light',
        'theme:colors.ui.active',
        'var(--lcars-orange)',
        'alpha(var(--lcards-orange), 0.08)',
        'darken(theme:colors.ui.primary, 0.2)',
        'lighten(#FF9900, 0.15)',
        'saturate(var(--lcars-blue), 0.3)',
        'base(colors.ui.primary)',
    ],
};

// ============================================================================
// DATA SOURCES SCHEMA - Historical data queries and processing pipeline
// ============================================================================

export const dataSourcesSchema = {
    type: 'object',
    description: 'Data sources for real-time entity tracking, historical data, and processing pipelines. Each key defines a named data source accessible in templates.',
    $comment: 'Data sources enable entity subscriptions, history preload, and unified processing pipeline',
    examples: [
        {
            temp: {
                entity: 'sensor.temperature',
                history: { hours: 6 },
                processing: {
                    fahrenheit: { type: 'convert_unit', from: 'c', to: 'f' },
                    smoothed: { type: 'smooth', from: 'fahrenheit', method: 'exponential', alpha: 0.3 },
                    rounded: { type: 'round', from: 'smoothed', precision: 1 }
                }
            },
            power: {
                entity: 'sensor.power',
                update_interval: 1000,
                processing: {
                    kilowatts: { type: 'scale', input_range: [0, 1000], output_range: [0, 1] }
                }
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
            update_interval: {
                type: 'number',
                minimum: 0,
                maximum: 10000,
                description: 'Minimum milliseconds between updates (throttling, default: 100)',
                examples: [100, 1000, 5000]
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
            processing: {
                type: 'object',
                description: 'Processing pipeline with named processors. Each processor transforms data and stores results in a buffer accessible via templates.',
                additionalProperties: {
                    type: 'object',
                    properties: {
                        type: {
                            type: 'string',
                            enum: [
                                'convert_unit',
                                'scale',
                                'smooth',
                                'expression',
                                'statistics',
                                'rate',
                                'trend',
                                'duration',
                                'threshold',
                                'clamp',
                                'round',
                                'delta'
                            ],
                            description: 'Processor type',
                            examples: ['convert_unit', 'smooth', 'expression']
                        },
                        from: {
                            type: 'string',
                            description: 'Source processor name to depend on (creates dependency chain). If omitted, uses raw entity value.',
                            examples: ['fahrenheit', 'smoothed', 'scaled']
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
            enum: ['toggle', 'call-service', 'perform-action', 'navigate', 'url', 'more-info', 'assist', 'none'],
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
            type: ['number', 'object'],
            minimum: 0,
            maximum: 10000,
            default: 500,
            description: 'Animation duration in milliseconds (0-10000). Also accepts a map_range descriptor for entity-driven, live-adjusting duration on looping animations.'
        },
        ease: {
            type: ['string', 'object'],
            description: 'Easing function (string name or object with type and params)',
            examples: ['inOutQuad', 'outElastic', 'linear', { type: 'spring', params: { stiffness: 150 } }]
        },
        loop: {
            oneOf: [
                { type: 'boolean', description: 'true = loop infinitely, false = play once' },
                { type: 'integer', minimum: 1, description: 'Number of additional times to loop (1 = play twice total)' },
            ],
            default: false,
            description: 'Loop the animation. true = infinite, false = play once, N = loop N times',
        },
        alternate: {
            type: 'boolean',
            default: false,
            description: 'Whether animation should alternate direction on each loop'
        },
        delay: {
            type: ['number', 'object'],
            minimum: 0,
            maximum: 10000,
            default: 0,
            description: 'Delay before animation starts (milliseconds). Also accepts a map_range descriptor, matching rulesSchema\'s equivalent field.'
        },
        entity: {
            type: 'string',
            description: 'Entity ID to monitor (required for on_entity_change trigger)',
            pattern: '^[a-zA-Z_]+\\.[a-zA-Z0-9_]+$',
            examples: ['light.bedroom', 'sensor.temperature', 'binary_sensor.door', 'climate.Home_HVAC']
        },
        attribute: {
            type: 'string',
            description: 'Attribute to read instead of entity state. Applies uniformly to to_state, from_state, and the while condition. Use "brightness_pct" for a computed 0\u2013100 light brightness percentage (avoids converting raw 0\u2013255 values).',
            examples: ['brightness', 'brightness_pct', 'color_temp', 'hvac_action', 'current_position']
        },
        from_state: {
            type: 'string',
            description: 'Fire-and-forget gate: Only trigger when the entity (or attribute) transitions FROM this value. The animation runs until completion and does not auto-stop a looping animation. For auto-stop on loops, use while.',
            examples: ['on', 'off', 'home', 'unavailable']
        },
        to_state: {
            type: 'string',
            description: 'Fire-and-forget gate: Only trigger when the entity (or attribute) transitions TO this value. The animation runs until completion and does not auto-stop a looping animation. For auto-stop on loops, use while.',
            examples: ['on', 'off', 'home', 'unavailable']
        },
        check_on_load: {
            type: 'boolean',
            default: true,
            description: 'Evaluate the condition when the card first loads (default: true). For while conditions, starts a looping animation immediately if the condition is already met. For to_state/from_state, plays the animation if the entity is already in to_state. Set to false to suppress the initial evaluation and only react to state transitions. (on_entity_change only)'
        },
        while: {
            type: 'object',
            description: 'Lifecycle condition for looping animations (requires the top-level loop: true field). The animation plays while the condition is true and stops automatically when it becomes false. Note: to_state/from_state are fire-and-forget gates \u2014 they control when the animation starts but will not stop it. Use while to auto-stop a looping animation.',
            properties: {
                state:     { type: 'string', description: 'Play while entity value equals this string' },
                not_state: { type: 'string', description: 'Play while entity value does NOT equal this string' },
                above:     { type: 'number', description: 'Play while numeric entity value is strictly above this threshold' },
                below:     { type: 'number', description: 'Play while numeric entity value is strictly below this threshold' }
            },
            examples: [
                { state: 'on' },
                { not_state: 'unavailable' },
                { above: 50 },
                { below: 100 }
            ]
        },
        id: {
            type: 'string',
            pattern: '^[a-zA-Z0-9_-]+$',
            description: 'Optional identifier for this animation entry (referenced by system animations, debugging).'
        },
        enabled: {
            type: 'boolean',
            default: true,
            description: 'Set false to disable this animation entry without deleting it.'
        },
        target: {
            type: 'string',
            description: 'CSS selector for a single animation target element.'
        },
        targets: {
            type: ['string', 'array'],
            items: { type: 'string' },
            description: 'CSS selector(s) for multiple animation target elements.'
        },
        params: {
            type: 'object',
            discriminatedBy: {
                field: 'preset',
                schemas: ANIMATION_PRESET_PARAMS_SCHEMAS,
                default: { type: 'object', additionalProperties: true }
            },
            description: 'Preset-specific parameters. Shape depends on the sibling `preset` field.'
        }
    },
    // 'warn', not false: an unrecognized top-level field here is worth surfacing but
    // must never itself block a card from initializing — same reasoning as the
    // per-preset params schemas (see animation-preset-params-schemas.js).
    additionalProperties: 'warn',
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
    pattern: '^(#[0-9A-Fa-f]{6}|#[0-9A-Fa-f]{8}|transparent|match-light|theme:|rgb\\(|rgba\\(|hsl\\(|var\\(--)',
    description: 'Colour value (hex, rgb, theme token, or CSS variable)',
    examples: ['#FF9900', 'transparent', 'theme:colors.text.onDark', 'rgb(255, 153, 0)', 'var(--lcars-orange)']
};

/**
 * State-dependent color schema - different colors for entity states
 */
export const stateColorSchema = {
    oneOf: [
        {
            ...colorValueSchema,
            title: 'Simple Colour',
            description: 'Single colour value applied to all entity states',
        },
        {
            type: 'object',
            title: 'State-Dependent Colours',
            description: 'Map of entity state names to colour values. Well-known keys: default, active, inactive, unavailable, zero, non_zero, hover, pressed. Any custom state name (e.g. "heating", "above:90") is also accepted.',
            examples: [{
                default: '#888888',
                active: 'alpha(var(--lcards-orange), 0.08)',
                inactive: '#444444',
            }],
            properties: {
                default:     { ...colorValueSchema, description: 'Fallback colour when no other state key matches' },
                active:      { ...colorValueSchema, description: 'Colour when entity is on/active' },
                inactive:    { ...colorValueSchema, description: 'Colour when entity is off/inactive' },
                unavailable: { ...colorValueSchema, description: 'Colour when entity is unavailable' },
                zero:        { ...colorValueSchema, description: 'Colour when entity state is numeric 0' },
                non_zero:    { ...colorValueSchema, description: 'Colour when entity state is a non-zero number' },
                hover:       { ...colorValueSchema, description: 'Colour on hover interaction' },
                pressed:     { ...colorValueSchema, description: 'Colour on press/tap interaction' },
            },
            additionalProperties: {
                ...colorValueSchema,
                description: 'Colour for a custom state key (e.g. "heating", "cooling", "above:90", "below:20")',
            },
        },
    ],
};

/**
 * State-icon schema — icon name (string) or per-state icon map.
 * Follows the same shape as stateColorSchema but accepts icon name strings
 * (e.g., "mdi:lightbulb", "si:github", "entity") rather than colour values.
 * Resolved at render time via resolveStateColor() — same lookup order as colours.
 */
export const stateIconSchema = {
    oneOf: [
        {
            type: 'string',
            title: 'Single Icon',
            description: 'One icon for all states',
            examples: ['mdi:lightbulb', 'mdi:home', 'si:github', 'entity']
        },
        {
            type: 'object',
            title: 'State-Dependent Icons',
            description: 'Different icons for different entity states',
            examples: [{
                active: 'mdi:lightbulb',
                inactive: 'mdi:lightbulb-off'
            }],
            properties: {
                default: {
                    type: 'string',
                    description: 'Default icon (fallback when no other state matches)',
                    examples: ['mdi:lightbulb']
                },
                active: {
                    type: 'string',
                    description: 'Icon when entity is on/active',
                    examples: ['mdi:lightbulb']
                },
                inactive: {
                    type: 'string',
                    description: 'Icon when entity is off/inactive',
                    examples: ['mdi:lightbulb-off']
                },
                unavailable: {
                    type: 'string',
                    description: 'Icon when entity is unavailable or unknown',
                    examples: ['mdi:help-circle-outline']
                },
                zero: {
                    type: 'string',
                    description: 'Icon when entity state is numeric 0',
                    examples: ['mdi:numeric-0-circle']
                },
                non_zero: {
                    type: 'string',
                    description: 'Icon when entity state is a non-zero number',
                    examples: ['mdi:numeric-positive-1']
                }
            },
            additionalProperties: {
                type: 'string',
                description: 'Custom state icon (e.g., "on", "off", "heat", "cool")'
            }
        }
    ],
    'x-ui-hints': {
        label: 'Icon',
        helper: 'Specify an icon per entity state. Falls back to the top-level \"icon\" field when no state matches.',
        selector: {
            icon: {}
        }
    }
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
            oneOf: [
                {
                    type: 'string',
                    enum: ['full'],
                    description: 'Set to "full" to span all available columns'
                },
                {
                    type: 'number',
                    minimum: 1,
                    maximum: 24,
                    description: 'Number of columns this card spans (1-24)'
                }
            ],
            description: 'Number of columns (1-24) or "full" to span all columns'
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
                        description: 'Animations to trigger when rule matches. Supports overlay targeting (ID, tag, type, pattern) and automatic lifecycle management (start on match, stop on unmatch).',
                        items: {
                            type: 'object',
                            properties: {
                                overlay: {
                                    type: 'string',
                                    description: 'Target specific overlay by ID',
                                    examples: ['temp_display_1', 'cpu_gauge']
                                },
                                tag: {
                                    type: 'string',
                                    description: 'Target all overlays with this tag (recommended for cross-card coordination)',
                                    examples: ['temperature', 'critical_alert', 'system_status']
                                },
                                type: {
                                    type: 'string',
                                    description: 'Target all overlays of this type',
                                    examples: ['gauge', 'text', 'icon']
                                },
                                pattern: {
                                    type: 'string',
                                    description: 'Target overlays matching regex pattern',
                                    examples: ['^temp_.*', '.*_gauge$']
                                },
                                preset: {
                                    type: 'string',
                                    description: 'Animation preset name',
                                    examples: ['pulse', 'flash', 'glow', 'alert_pulse']
                                },
                                duration: {
                                    type: ['number', 'object'],
                                    minimum: 0,
                                    description: 'Animation duration in milliseconds. Also accepts a map_range descriptor for entity-driven dynamic duration.'
                                },
                                loop: {
                                    oneOf: [
                                        { type: 'boolean', description: 'true = loop infinitely, false = play once' },
                                        { type: 'integer', minimum: 1, description: 'Number of additional times to loop' },
                                    ],
                                    default: false,
                                    description: 'Loop animation. Automatically stops when the rule unmatches. true = infinite, N = loop N times',
                                },
                                delay: {
                                    type: ['number', 'object'],
                                    minimum: 0,
                                    description: 'Delay before animation starts (milliseconds). Also accepts a map_range descriptor for entity-driven dynamic delay.'
                                },
                                ease: {
                                    type: 'string',
                                    description: 'Animation easing function (anime.js v4 name). Simple strings like \'inOutQuad\', \'outBounce\', \'inElastic\' or parametric types via ease_params.',
                                    examples: ['inOutQuad', 'linear', 'outElastic', 'inOutBounce']
                                },
                                params: {
                                    type: 'object',
                                    discriminatedBy: {
                                        field: 'preset',
                                        schemas: ANIMATION_PRESET_PARAMS_SCHEMAS_MAPRANGE_AWARE,
                                        default: { type: 'object', additionalProperties: true }
                                    },
                                    description: 'Preset-specific parameters. Values may be static or use map_range to proportionally interpolate from an entity value.',
                                    additionalProperties: true,
                                    examples: [
                                        { speed: 2, color: '#00ff88' },
                                        {
                                            speed: { map_range: { entity: 'sensor.grid_power', input: [0, 5000], output: [8, 0.5], clamp: true } },
                                            color: { map_range: { entity: 'sensor.grid_power', input: [0, 5000], output: ['#00ff88', '#ff4400'], clamp: true } }
                                        }
                                    ]
                                }
                            },
                            required: ['preset'],
                            examples: [
                                { tag: 'temp_widgets', preset: 'alert_pulse', loop: true },
                                { overlay: 'cpu_gauge', preset: 'glow', duration: 500 },
                                { type: 'gauge', preset: 'pulse', duration: 800 }
                            ]
                        },
                        examples: [
                            [{ tag: 'alert_targets', preset: 'flash', loop: true }],
                            [{ overlay: 'temp_display', preset: 'glow', duration: 600 }],
                            [
                                { tag: 'temperature', preset: 'pulse', loop: true },
                                { tag: 'status_icon', preset: 'flash', duration: 300 }
                            ]
                        ]
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
 * @param {Object} [options] - Schema options
 * @param {Array<string>} [options.positionEnum] - Available position values
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
                                    mode: 'slider',
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
                        type: ['string', 'number'],
                        default: 'normal',
                        description: 'Font weight — CSS keyword (normal, bold) or numeric value (100–900)',
                        examples: ['normal', 'bold', 100, 300, 400, 700, 900]
                    },
                    font_family: {
                        type: 'string',
                        format: 'font-family',
                        description: 'CSS font-family (single font, comma-separated stack, or CSS variable)',
                        examples: ['Arial', 'lcards_title', 'Antonio, sans-serif', '"Roboto Mono", monospace', 'var(--lcars-font), Antonio, sans-serif']
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
                    display_format: {
                        type: 'string',
                        enum: ['friendly', 'raw', 'parts', 'unit'],
                        default: 'friendly',
                        description: 'Default display format for entity state/attribute tokens. "friendly" uses HA\'s translated display string. "raw" returns the unmodified value. "parts" joins value and unit. "unit" returns only the unit.',
                        'x-ui-hints': {
                            label: 'Display Format (Default)',
                            helper: 'friendly = HA-translated (e.g. "Open"), raw = actual state (e.g. "on"), parts = value+unit joined, unit = unit only'
                        }
                    },
                    background: stateColorSchema,
                    background_padding: {
                        type: 'number',
                        minimum: 0,
                        default: 8,
                        description: 'Horizontal padding between text glyphs and the background rect edges (px).',
                        'x-ui-hints': {
                            label: 'Background Padding',
                            selector: { number: { mode: 'box', min: 0, max: 100, step: 1, unit_of_measurement: 'px' } }
                        }
                    },
                    background_radius: {
                        type: 'number',
                        minimum: 0,
                        default: 4,
                        description: 'Corner radius of the background rect (px).',
                        'x-ui-hints': {
                            label: 'Background Corner Radius',
                            selector: { number: { mode: 'box', min: 0, max: 50, step: 1, unit_of_measurement: 'px' } }
                        }
                    },
                    background_width: {
                        type: ['number', 'null'],
                        minimum: 1,
                        description: 'Fixed explicit width of the background rect (px). Overrides auto-sizing from text metrics. Text will overflow if content is wider than this value.',
                        'x-ui-hints': {
                            label: 'Background Width (Fixed)',
                            helper: 'Pin to an exact px width. Use background_min_width for a safe lower bound with dynamic content.',
                            selector: { number: { mode: 'box', min: 1, max: 2000, step: 1, unit_of_measurement: 'px' } }
                        }
                    },
                    background_min_width: {
                        type: ['number', 'null'],
                        minimum: 1,
                        description: 'Minimum width of the background rect (px). Auto-sizes to text width but never smaller than this value. Safe for dynamic content.',
                        'x-ui-hints': {
                            label: 'Background Min Width',
                            helper: 'Auto-sizes with text but will not shrink below this value — safe for dynamic content.',
                            selector: { number: { mode: 'box', min: 1, max: 2000, step: 1, unit_of_measurement: 'px' } }
                        }
                    },
                    font_size_percent: {
                        type: 'number',
                        minimum: 1,
                        maximum: 100,
                        description: 'Default font size as a percentage of the card height. All fields inherit this unless they set an explicit font_size. Useful for bar-label style presets that should auto-scale with the configured card height.',
                        'x-ui-hints': {
                            label: 'Font Size (% of height)',
                            helper: 'Sets the default font size relative to the card height for all fields. 100 = full-height glyphs.',
                            selector: {
                                number: {
                                    mode: 'slider',
                                    min: 1,
                                    max: 100,
                                    step: 1,
                                    unit_of_measurement: '%'
                                }
                            }
                        }
                    },
                    cap_height_ratio: {
                        type: 'number',
                        minimum: 0.1,
                        maximum: 1.0,
                        description: 'Ratio of the font cap-height to the em-square (font-size). Used to correct font_size_percent so visible glyph height matches the requested percentage of the container. Defaults to the theme token value (0.86 for Antonio). Override when using a different font family.',
                        'x-ui-hints': {
                            label: 'Cap Height Ratio',
                            helper: 'Correction factor for font_size_percent. Antonio = 0.86. 1.0 = no correction. Lower values increase the rendered font-size.',
                            selector: {
                                number: {
                                    mode: 'box',
                                    min: 0.1,
                                    max: 1.0,
                                    step: 0.01
                                }
                            }
                        }
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
                    type: ['string', 'number'],
                    default: 'normal',
                    description: 'Font weight — CSS keyword (normal, bold) or numeric value (100–900)',
                    examples: ['normal', 'bold', 100, 300, 400, 700, 900]
                },
                font_family: {
                    type: 'string',
                    format: 'font-family',
                    description: 'CSS font-family (single font, comma-separated stack, or CSS variable)',
                    examples: ['Arial', 'lcards_title', 'Antonio, sans-serif', '"Roboto Mono", monospace', 'var(--lcars-font), Antonio, sans-serif']
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
                },
                stretch: {
                    oneOf: [
                        {
                            type: 'boolean',
                            description: 'true = stretch text to fill 100% of the available width'
                        },
                        {
                            type: 'number',
                            minimum: 0,
                            maximum: 1,
                            description: 'Fraction of available width to stretch text to (0–1)'
                        }
                    ],
                    description: 'Stretch text to fill a fraction of the available width using SVG textLength / lengthAdjust="spacingAndGlyphs". true = 100%, 0.8 = 80%.',
                    'x-ui-hints': {
                        label: 'Stretch Text',
                        helper: 'Expand or compress glyph spacing to fill the specified width fraction'
                    }
                },
                font_size_percent: {
                    type: 'number',
                    minimum: 1,
                    maximum: 100,
                    description: 'Font size as a percentage of the text area height (component mode). Overrides font_size when set.',
                    'x-ui-hints': {
                        label: 'Font Size (%)',
                        helper: 'Sets font size relative to the text area height. 50 = 50% of the area height.',
                        selector: {
                            number: {
                                mode: 'slider',
                                min: 1,
                                max: 100,
                                step: 1,
                                unit_of_measurement: '%'
                            }
                        }
                    }
                },
                cap_height_ratio: {
                    type: 'number',
                    minimum: 0.1,
                    maximum: 1.0,
                    description: 'Ratio of the font cap-height to the em-square. Used to correct font_size_percent so visible glyph height matches the requested percentage. Defaults to the theme token value (0.86 for Antonio). Override when using a different font.',
                    'x-ui-hints': {
                        label: 'Cap Height Ratio',
                        helper: 'Correction factor for font_size_percent. Antonio = 0.86. 1.0 = no correction. Lower values increase rendered font-size.',
                        selector: {
                            number: {
                                mode: 'box',
                                min: 0.1,
                                max: 1.0,
                                step: 0.01
                            }
                        }
                    }
                },
                zone: {
                    type: 'string',
                    description: 'Named zone key to route this text field to. For component cards this matches a key in the component\'s zones map. For slider/elbow cards this matches a named layout zone (e.g. left, track, vertical_bar). Defaults to the first zone if not set.',
                    'x-ui-hints': {
                        label: 'Zone',
                        helper: 'Which named layout zone this text field is routed to'
                    }
                },
                display_format: {
                    type: 'string',
                    enum: ['friendly', 'raw', 'parts', 'unit'],
                    default: 'friendly',
                    description: 'How to format entity state or attribute values in this text field. "friendly" (default) uses HA\'s translated display string matching native cards. "raw" returns the unmodified state/attribute value. "parts" joins value and unit from HA\'s ToParts API. "unit" returns only the unit portion.',
                    examples: ['friendly', 'raw', 'parts', 'unit'],
                    'x-ui-hints': {
                        label: 'Display Format',
                        helper: 'friendly = HA-translated (e.g. "Open"), raw = actual state (e.g. "on"), parts = value+unit joined, unit = unit only'
                    }
                },
                background: stateColorSchema,
                background_padding: {
                    type: 'number',
                    minimum: 0,
                    default: 8,
                    description: 'Horizontal padding between text glyphs and the background rect edges (px).',
                    'x-ui-hints': {
                        label: 'Background Padding',
                        selector: { number: { mode: 'box', min: 0, max: 100, step: 1, unit_of_measurement: 'px' } }
                    }
                },
                background_radius: {
                    type: 'number',
                    minimum: 0,
                    default: 4,
                    description: 'Corner radius of the background rect (px).',
                    'x-ui-hints': {
                        label: 'Background Corner Radius',
                        selector: { number: { mode: 'box', min: 0, max: 50, step: 1, unit_of_measurement: 'px' } }
                    }
                },
                background_width: {
                    type: ['number', 'null'],
                    minimum: 1,
                    description: 'Fixed explicit width of the background rect (px). Overrides auto-sizing from text metrics. Text will overflow if content is wider than this value.',
                    'x-ui-hints': {
                        label: 'Background Width (Fixed)',
                        helper: 'Pin to an exact px width. Use background_min_width for a safe lower bound with dynamic content.',
                        selector: { number: { mode: 'box', min: 1, max: 2000, step: 1, unit_of_measurement: 'px' } }
                    }
                },
                background_min_width: {
                    type: ['number', 'null'],
                    minimum: 1,
                    description: 'Minimum width of the background rect (px). Auto-sizes to text width but never smaller than this value. Safe for dynamic content.',
                    'x-ui-hints': {
                        label: 'Background Min Width',
                        helper: 'Auto-sizes with text but will not shrink below this value — safe for dynamic content.',
                        selector: { number: { mode: 'box', min: 1, max: 2000, step: 1, unit_of_measurement: 'px' } }
                    }
                }
            }
        }
    };
}
// ============================================================================
// SOUNDS SCHEMA - Per-card sound configuration
// ============================================================================

/**
 * Per-card sound override block.
 *
 * Lets each card independently control whether it participates in the global
 * sound system, and override individual event sounds without touching the global
 * scheme or per-event backend storage overrides.
 *
 * Resolution order inside SoundManager.play():
 *   1. sounds.enabled === false  → card is completely silent
 *   2. sounds[eventType]         → card-level asset override (null = mute event)
 *   3. Backend storage overrides → global per-event override
 *   4. Active scheme             → scheme mapping
 *   5. Silence
 *
 * @example
 *   sounds:
 *     enabled: false        # mute this card entirely
 *
 * @example
 *   sounds:
 *     card_tap: null        # silence tap only
 *     card_hold: 'my_sfx'  # custom hold sound
 */
export const soundsSchema = {
    type: 'object',
    description: 'Per-card sound configuration. Overrides global sound settings for this card.',
    properties: {
        enabled: {
            type: 'boolean',
            description: 'Whether this card fires sounds. Set to false to completely silence this card. Default: true (omit to keep default).',
            'x-ui-hints': {
                label: 'Card Sounds Enabled',
                helper: 'When off, this card makes no sounds regardless of global settings'
            }
        },
        card_tap: {
            type: ['string', 'null'],
            description: 'Asset key for card tap, or null to mute. Omit to use global scheme.',
            'x-ui-hints': { label: 'Card Tap' }
        },
        card_hold: {
            type: ['string', 'null'],
            description: 'Asset key for card hold, or null to mute. Omit to use global scheme.',
            'x-ui-hints': { label: 'Card Hold' }
        },
        card_double_tap: {
            type: ['string', 'null'],
            description: 'Asset key for card double-tap, or null to mute. Omit to use global scheme.',
            'x-ui-hints': { label: 'Card Double-Tap' }
        },
        card_hover: {
            type: ['string', 'null'],
            description: 'Asset key for card hover (desktop), or null to mute. Omit to use global scheme.',
            'x-ui-hints': { label: 'Card Hover (Desktop)' }
        },
        slider_drag_start: {
            type: ['string', 'null'],
            description: 'Asset key for slider grab, or null to mute. Omit to use global scheme.',
            'x-ui-hints': { label: 'Slider Grab' }
        },
        slider_change: {
            type: ['string', 'null'],
            description: 'Asset key for slider value change, or null to mute. Omit to use global scheme.',
            'x-ui-hints': { label: 'Slider Value Change' }
        },
        slider_drag_end: {
            type: ['string', 'null'],
            description: 'Asset key for slider release, or null to mute. Omit to use global scheme.',
            'x-ui-hints': { label: 'Slider Release' }
        },
        toggle_on: {
            type: ['string', 'null'],
            description: 'Asset key for toggle-on, or null to mute. Omit to use global scheme.',
            'x-ui-hints': { label: 'Toggle → On' }
        },
        toggle_off: {
            type: ['string', 'null'],
            description: 'Asset key for toggle-off, or null to mute. Omit to use global scheme.',
            'x-ui-hints': { label: 'Toggle → Off' }
        }
    },
    additionalProperties: false
};

// ============================================================================
// BACKGROUND ANIMATION SCHEMA
// ============================================================================

/**
 * Per-effect schema item for background_animation arrays
 */
const backgroundAnimationEffectSchema = {
    type: 'object',
    required: ['preset'],
    properties: {
        preset: {
            type: 'string',
            description: 'Background animation preset name (e.g. grid, starfield, cascade)'
        },
        config: {
            type: 'object',
            description: 'Preset-specific configuration options. Supports entity-reactive values via map_range descriptor ({ map_range: { attribute, input, output } }) or template strings ([[[...]]]). entity_id defaults to the card-bound entity.'
        },
        enabled: {
            type: 'boolean',
            description: 'Set to false to disable this effect without removing it',
            default: true
        },
        zoom: {
            type: 'object',
            description: 'Optional zoom wrapper — creates layered depth effect',
            properties: {
                layers:          { type: 'number', minimum: 1, default: 4 },
                scale_from:      { type: 'number', default: 0.5 },
                scale_to:        { type: 'number', default: 2.0 },
                duration:        { type: 'number', default: 15 },
                opacity_fade_in: { type: 'number', default: 15 },
                opacity_fade_out:{ type: 'number', default: 75 }
            }
        }
    },
    additionalProperties: false
};

/**
 * Inset schema (numeric sides object)
 */
const backgroundAnimationInsetSchema = {
    oneOf: [
        {
            type: 'string',
            enum: ['auto'],
            description: "Auto-compute inset from card geometry (elbow cards only)"
        },
        {
            type: 'object',
            description: 'Per-side pixel inset for the animation canvas',
            properties: {
                top:    { type: 'number', minimum: 0, default: 0 },
                right:  { type: 'number', minimum: 0, default: 0 },
                bottom: { type: 'number', minimum: 0, default: 0 },
                left:   { type: 'number', minimum: 0, default: 0 }
            },
            additionalProperties: false
        }
    ]
};

/**
 * Background animation schema — accepts bare array form or envelope object with canvas inset.
 *
 * Bare array (backward-compatible):
 *   background_animation:
 *     - preset: grid
 *       config: { line_spacing: 40 }
 *
 * Envelope form (with canvas inset):
 *   background_animation:
 *     inset: { left: 90, bottom: 40 }   # or 'auto' for elbow cards
 *     effects:
 *       - preset: grid
 *         config: { line_spacing: 40 }
 */
export const backgroundAnimationSchema = {
    oneOf: [
        {
            type: 'array',
            description: 'Background animation effects (bare array, no canvas inset)',
            items: backgroundAnimationEffectSchema
        },
        {
            type: 'object',
            description: 'Background animation with canvas-level inset',
            required: ['effects'],
            properties: {
                inset: backgroundAnimationInsetSchema,
                effects: {
                    type: 'array',
                    description: 'Stack of background effects rendered in order (bottom → top)',
                    items: backgroundAnimationEffectSchema
                }
            },
            additionalProperties: false
        }
    ]
};

// ============================================================================
// CARD SIZING SCHEMAS
// Shared height/width properties used by all card types.
// A bare integer is treated as pixels by the base class (_toCssLength).
// CSS unit strings (e.g. 50vh, 10em) are applied as-is to the host element;
// note that getCardSize() falls back to the card default for non-px values.
// ============================================================================

export const cardHeightSchema = {
    oneOf: [
        {
            type: 'number',
            minimum: 1,
            description: 'Card height in pixels (bare integer, e.g. 56 = 56px)'
        },
        {
            type: 'string',
            pattern: '^[\\d.]+(\\s*(px|vh|vw|%|em|rem|vmin|vmax))?$',
            description: 'Card height with CSS unit (e.g. 200px, 50vh, 10em)'
        }
    ],
    description: 'Card height override. Bare integer = px (e.g. 200 = 200px). CSS units accepted: 200px, 50vh, 10em.',
    'x-ui-hints': {
        label: 'Height',
        helper: 'Bare integer = px (e.g. 200 = 200px). CSS units accepted: 200px, 50vh, 10em.',
        selector: { text: {} }
    }
};

export const cardWidthSchema = {
    oneOf: [
        {
            type: 'number',
            minimum: 1,
            description: 'Card width in pixels (bare integer, e.g. 300 = 300px)'
        },
        {
            type: 'string',
            pattern: '^[\\d.]+(\\s*(px|vh|vw|%|em|rem|vmin|vmax))?$',
            description: 'Card width with CSS unit (e.g. 400px, 50vw, 10em)'
        }
    ],
    description: 'Card width override. Bare integer = px (e.g. 400 = 400px). CSS units accepted: 400px, 50vw, 10em.',
    'x-ui-hints': {
        label: 'Width',
        helper: 'Bare integer = px (e.g. 400 = 400px). CSS units accepted: 400px, 50vw, 10em.',
        selector: { text: {} }
    }
};

export const cardMinHeightSchema = {
    oneOf: [
        {
            type: 'number',
            minimum: 0,
            description: 'Minimum card height in pixels (bare integer, e.g. 40 = 40px)'
        },
        {
            type: 'string',
            pattern: '^[\\d.]+(\\s*(px|vh|vw|%|em|rem|vmin|vmax))?$',
            description: 'Minimum card height with CSS unit (e.g. 40px, 10vh)'
        }
    ],
    description: 'Minimum card height floor. Overrides the --lcards-button-min-height CSS token. Bare integer = px.',
    'x-ui-hints': {
        label: 'Min Height',
        helper: 'Floor height (e.g. 40)',
        selector: { text: {} }
    }
};

// ============================================================================
// TRIGGERS_UPDATE SCHEMA - Explicit entity tracking for JS / token templates
// ============================================================================

/**
 * Declare extra entity IDs that should trigger a re-render (and re-evaluation
 * of all templates) when their state changes.
 *
 * LCARdS auto-tracks entities referenced in Jinja2 templates (`{{states(...)}}`
 * etc.) but cannot static-analyse JavaScript templates (`[[[...]]]`) or dynamic
 * token expressions whose entity IDs are assembled at runtime.  Use
 * `triggers_update` as the explicit escape-hatch for those cases.
 *
 * @example
 * triggers_update:
 *   - sensor.outdoor_temperature
 *   - binary_sensor.motion_kitchen
 */
export const triggersUpdateSchema = {
    type: 'array',
    items: {
        type: 'string',
        format: 'entity',
        pattern: '^[a-z_]+\\.[a-z0-9_]+$',
        description: 'Entity ID whose state change should trigger a re-render',
        examples: ['sensor.temperature', 'binary_sensor.motion']
    },
    description:
        'Extra entity IDs to watch for state changes. When any listed entity changes, all templates on this card are re-evaluated. '
        + 'Use this for JavaScript templates ([[[...]]]) that reference entities LCARdS cannot detect automatically via static analysis.',
    examples: [
        ['sensor.outdoor_temperature'],
        ['binary_sensor.motion_kitchen', 'sensor.toronto_temperature']
    ],
    'x-ui-hints': {
        label: 'Extra entity triggers',
        helper:
            'Entity IDs whose state changes should re-evaluate this card\'s templates. '
            + 'Only needed for JS templates — Jinja2 entity references are tracked automatically.',
        selector: { entity: {} }
    }
};

export const cardMinWidthSchema = {
    oneOf: [
        {
            type: 'number',
            minimum: 0,
            description: 'Minimum card width in pixels (bare integer, e.g. 80 = 80px)'
        },
        {
            type: 'string',
            pattern: '^[\\d.]+(\\s*(px|vh|vw|%|em|rem|vmin|vmax))?$',
            description: 'Minimum card width with CSS unit (e.g. 80px, 10vw)'
        }
    ],
    description: 'Minimum card width floor. Bare integer = px.',
    'x-ui-hints': {
        label: 'Min Width',
        helper: 'Floor width (e.g. 80)',
        selector: { text: {} }
    }
};

export const cardMaxHeightSchema = {
    oneOf: [
        {
            type: 'number',
            minimum: 1,
            description: 'Maximum card height in pixels (bare integer, e.g. 400 = 400px)'
        },
        {
            type: 'string',
            pattern: '^[\\d.]+(\\s*(px|vh|vw|%|em|rem|vmin|vmax))?$',
            description: 'Maximum card height with CSS unit (e.g. 400px, 80vh, 20em)'
        }
    ],
    description: 'Maximum card height ceiling. Bare integer = px (e.g. 400 = 400px). CSS units accepted: 400px, 80vh, 10em.',
    'x-ui-hints': {
        label: 'Max Height',
        helper: 'Ceiling height (e.g. 400). Bare integer = px, or CSS units (400px, 80vh, etc).',
        selector: { text: {} }
    }
};

export const cardMaxWidthSchema = {
    oneOf: [
        {
            type: 'number',
            minimum: 1,
            description: 'Maximum card width in pixels (bare integer, e.g. 600 = 600px)'
        },
        {
            type: 'string',
            pattern: '^[\\d.]+(\\s*(px|vh|vw|%|em|rem|vmin|vmax))?$',
            description: 'Maximum card width with CSS unit (e.g. 600px, 80vw, 20em)'
        }
    ],
    description: 'Maximum card width ceiling. Bare integer = px (e.g. 600 = 600px). CSS units accepted: 600px, 80vw, 10em.',
    'x-ui-hints': {
        label: 'Max Width',
        helper: 'Ceiling width (e.g. 600). Bare integer = px, or CSS units (600px, 80vw, etc).',
        selector: { text: {} }
    }
};

const _overflowOptions = [
    { value: 'visible', label: 'Visible — content paints outside the box' },
    { value: 'hidden',  label: 'Hidden — clips without scroll' },
    { value: 'clip',    label: 'Clip — hard clip, no programmatic scroll' },
    { value: 'scroll',  label: 'Scroll — always shows scrollbar' },
    { value: 'auto',    label: 'Auto — scrollbar only when needed' },
];

export const cardOverflowSchema = {
    type: 'string',
    enum: ['visible', 'hidden', 'clip', 'scroll', 'auto'],
    description: 'CSS overflow shorthand on the card host element (sets both axes unless overridden per-axis).',
    'x-ui-hints': {
        label: 'Overflow',
        helper: 'Sets both axes. Use overflow_x / overflow_y to control axes independently.',
        selector: { select: { mode: 'dropdown', options: _overflowOptions } }
    }
};

export const cardOverflowXSchema = {
    type: 'string',
    enum: ['visible', 'hidden', 'clip', 'scroll', 'auto'],
    description: 'CSS overflow-x on the card host element. Overrides the overflow shorthand for the horizontal axis.',
    'x-ui-hints': {
        label: 'Overflow X',
        helper: 'Horizontal axis overflow. Overrides the overflow shorthand.',
        selector: { select: { mode: 'dropdown', options: _overflowOptions } }
    }
};

export const cardOverflowYSchema = {
    type: 'string',
    enum: ['visible', 'hidden', 'clip', 'scroll', 'auto'],
    description: 'CSS overflow-y on the card host element. Overrides the overflow shorthand for the vertical axis.',
    'x-ui-hints': {
        label: 'Overflow Y',
        helper: 'Vertical axis overflow. Overrides the overflow shorthand.',
        selector: { select: { mode: 'dropdown', options: _overflowOptions } }
    }
};

export const cardZIndexSchema = {
    type: 'integer',
    description: 'CSS z-index stacking order on the card host element.',
    'x-ui-hints': {
        label: 'Z-Index',
        helper: 'Stacking order within a shared stacking context. Higher = in front.',
        selector: { number: { min: -999, max: 9999, step: 1, mode: 'box' } }
    }
};

// ============================================================================
// STATE CLASSIFICATION
// ============================================================================

/**
 * Schema for state_classification — lets users override which entity states
 * map to style buckets used by the state-based color/icon/text resolver.
 *
 * Built-in buckets: active, inactive, unavailable, default
 * Custom buckets:   any other key name (e.g. "away", "zone") whose value is a
 *                   string array of raw entity states that map to it.
 *
 * Priority (highest → lowest):
 *   explicit state key in style config  >  state_classification  >  built-in activeStates list  >  else
 *
 * Reserved keys (cannot be used as custom bucket names):
 *   active, inactive, unavailable, default, else, unknown
 */
export const stateClassificationSchema = {
    type: 'object',
    description:
        'Override how raw entity states are mapped to style buckets. ' +
        'Use built-in buckets (active/inactive/default) or define your own named buckets. ' +
        'Explicit state keys in style config always take priority over this.',
    properties: {
        active: {
            type: 'array',
            items: { type: 'string' },
            description: 'Additional states to classify as "active" (augments the built-in active list).',
            examples: [['home', 'work', 'gym']],
            'x-ui-hints': { label: 'Active states', helper: 'Extra states treated as active.' }
        },
        inactive: {
            type: 'array',
            items: { type: 'string' },
            description: 'States to explicitly classify as "inactive".',
            examples: [['not_home', 'away']],
            'x-ui-hints': { label: 'Inactive states', helper: 'States treated as inactive.' }
        },
        else: {
            type: 'string',
            description:
                'Bucket for states not matched by any list (built-in or custom). ' +
                'Accepts built-in bucket names (active/inactive/default) or a custom bucket name. ' +
                'Defaults to "inactive" when omitted.',
            'x-ui-hints': {
                label: 'Unmapped state class',
                helper: 'What bucket unrecognised states fall into. Use "default" to reach your default colour instead of the preset inactive colour.',
                selector: { select: { options: [
                    { value: 'inactive', label: 'Inactive (default)' },
                    { value: 'default',  label: 'Default' },
                    { value: 'active',   label: 'Active' },
                ] } }
            }
        },
    },
    additionalProperties: {
        type: 'array',
        items: { type: 'string' },
        description: 'Custom bucket: an array of raw entity states that map to this bucket name.',
    },
};
