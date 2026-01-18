/**
 * Elbow Card Schema - Unified
 *
 * Complete schema for elbow card validation.
 * All definitions inlined for simplicity - no $ref resolution needed.
 *
 * Elbow cards extend button cards with LCARS elbow/corner treatments.
 * They inherit all button functionality (text, actions, etc.) plus elbow-specific geometry.
 *
 * This schema is ONLY for validation, not UI generation.
 * Editor UI is defined separately in lcards-elbow-editor.js config.
 */

/**
 * Get complete elbow card schema
 * @param {Object} options - Schema options
 * @param {Array<string>} options.availablePresets - Available preset names (inherits from button)
 * @param {Array<string>} options.positionEnum - Available text positions
 * @returns {Object} Complete elbow schema
 */
export function getElbowSchema(options = {}) {
    const {
        availablePresets = [],
        positionEnum = []
    } = options;

    // ============================================================================
    // REUSABLE INLINE DEFINITIONS
    // ============================================================================

    const stateColorSchema = {
        oneOf: [
            {
                type: 'string',
                title: 'Simple Color',
                pattern: '^(#[0-9A-Fa-f]{6}|#[0-9A-Fa-f]{8}|transparent|theme:|rgb\\(|rgba\\(|hsl\\(|var\\(--)',
                description: 'Single color value for all states (hex, rgb, theme token, or CSS variable)',
                examples: ['#FF9900', 'transparent', 'theme:palette.moonlight', 'rgb(255, 153, 0)', 'var(--lcars-orange)']
            },
            {
                type: 'object',
                title: 'State-Dependent Colors',
                description: 'Different colors for different entity states',
                examples: [{
                    default: '#888888',
                    active: '#FF9900',
                    inactive: '#444444',
                    unavailable: '#666666'
                }],
                properties: {
                    default: {
                        type: 'string',
                        pattern: '^(#[0-9A-Fa-f]{6}|#[0-9A-Fa-f]{8}|transparent|theme:|rgb\\(|rgba\\(|hsl\\(|var\\(--)',
                        description: 'Default color (fallback)',
                        examples: ['#888888', 'theme:palette.starfleet-gold']
                    },
                    active: {
                        type: 'string',
                        pattern: '^(#[0-9A-Fa-f]{6}|#[0-9A-Fa-f]{8}|transparent|theme:|rgb\\(|rgba\\(|hsl\\(|var\\(--)',
                        description: 'Color when entity is on/active',
                        examples: ['#FF9900', 'theme:palette.moonlight']
                    },
                    inactive: {
                        type: 'string',
                        pattern: '^(#[0-9A-Fa-f]{6}|#[0-9A-Fa-f]{8}|transparent|theme:|rgb\\(|rgba\\(|hsl\\(|var\\(--)',
                        description: 'Color when entity is off/inactive',
                        examples: ['#444444', 'theme:palette.cosmos-blue']
                    },
                    unavailable: {
                        type: 'string',
                        pattern: '^(#[0-9A-Fa-f]{6}|#[0-9A-Fa-f]{8}|transparent|theme:|rgb\\(|rgba\\(|hsl\\(|var\\(--)',
                        description: 'Color when entity is unavailable',
                        examples: ['#666666', 'theme:palette.alert-red']
                    },
                    hover: {
                        type: 'string',
                        pattern: '^(#[0-9A-Fa-f]{6}|#[0-9A-Fa-f]{8}|transparent|theme:|rgb\\(|rgba\\(|hsl\\(|var\\(--)',
                        description: 'Color on mouse hover',
                        examples: ['#FFBB00', 'theme:palette.highlight']
                    },
                    pressed: {
                        type: 'string',
                        pattern: '^(#[0-9A-Fa-f]{6}|#[0-9A-Fa-f]{8}|transparent|theme:|rgb\\(|rgba\\(|hsl\\(|var\\(--)',
                        description: 'Color when pressed/tapped',
                        examples: ['#CC7700', 'theme:palette.active']
                    }
                }
            }
        ]
    };

    const actionSchema = {
        type: 'object',
        description: 'Action to perform on interaction',
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
    // ANIMATION SCHEMA
    // ============================================================================

    const animationSchema = {
        type: 'object',
        description: 'Animation configuration',
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
    // FILTER SCHEMA
    // ============================================================================

    const filterSchema = {
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
    // MAIN SCHEMA
    // ============================================================================

    return {
        $schema: 'http://json-schema.org/draft-07/schema#',
        $id: 'https://github.com/snootched/lcards/schemas/elbow-schema',
        title: 'LCARdS Elbow Card Configuration',
        description: 'Complete configuration schema for lcards-elbow custom card with LCARS corner treatments. Supports dynamic theme integration via HA-LCARS input_number helpers (input_number.lcars_horizontal, input_number.lcars_vertical).',
        type: 'object',
        required: ['type'],
        examples: [
            {
                type: 'custom:lcards-elbow',
                elbow: {
                    type: 'header-left',
                    style: 'simple',
                    segment: {
                        bar_width: 'theme',
                        bar_height: 'theme',
                        outer_curve: 'auto',
                        color: { default: '#FF9900' }
                    }
                },
                text: {
                    name: {
                        show: true,
                        value: 'Navigation'
                    }
                }
            },
            {
                type: 'custom:lcards-elbow',
                elbow: {
                    type: 'footer-right',
                    style: 'simple',
                    segment: {
                        bar_width: 120,
                        bar_height: 30,
                        outer_curve: 60,
                        inner_curve: 30
                    }
                }
            }
        ],
        properties: {
            // ============================================================================
            // HOME ASSISTANT REQUIRED PROPERTIES
            // ============================================================================

            type: {
                type: 'string',
                const: 'custom:lcards-elbow',
                description: 'Home Assistant card type identifier (required)'
            },

            // ============================================================================
            // CORE PROPERTIES (inherited from button)
            // ============================================================================

            entity: {
                type: 'string',
                format: 'entity',
                pattern: '^[a-z_]+\\.[a-z0-9_]+$',
                description: 'Primary entity ID to control (format: domain.object_id)',
                examples: ['light.living_room', 'switch.fan', 'sensor.temperature'],
                'x-ui-hints': {
                    label: 'Entity',
                    helper: 'Select the entity this elbow card controls',
                    selector: {
                        entity: {}
                    }
                }
            },

            id: {
                type: 'string',
                pattern: '^[a-zA-Z0-9_-]+$',
                description: 'Custom card ID for rule targeting and animations (alphanumeric, underscore, hyphen)',
                examples: ['main-elbow', 'nav_corner', 'header-left-001']
            },

            tags: {
                type: 'array',
                items: {
                    type: 'string',
                    pattern: '^[a-zA-Z0-9_-]+$'
                },
                description: 'Tags for bulk rule targeting (alphanumeric, underscore, hyphen)',
                examples: [['navigation', 'primary'], ['header', 'corners']]
            },

            preset: {
                type: 'string',
                enum: availablePresets,
                description: 'Style preset name (inherits from button presets)',
                examples: ['lozenge', 'bullet', 'outline', 'pill']
            },

            // ============================================================================
            // ELBOW CONFIGURATION (elbow-specific)
            // ============================================================================

            elbow: {
                type: 'object',
                required: ['type'],
                description: 'Elbow geometry and styling configuration',
                properties: {
                    type: {
                        type: 'string',
                        enum: ['header-left', 'header-right', 'footer-left', 'footer-right'],
                        description: 'Position of the elbow corner on the card',
                        enumDescriptions: [
                            'Top-left corner: vertical bar on left, horizontal bar on top',
                            'Top-right corner: vertical bar on right, horizontal bar on top',
                            'Bottom-left corner: vertical bar on left, horizontal bar on bottom',
                            'Bottom-right corner: vertical bar on right, horizontal bar on bottom'
                        ],
                        examples: ['header-left', 'footer-right']
                    },

                    style: {
                        type: 'string',
                        enum: ['simple', 'segmented'],
                        default: 'simple',
                        description: 'Elbow rendering style',
                        enumDescriptions: [
                            'Simple: Single elbow with one curved corner',
                            'Segmented: Double concentric elbows with gap (TNG Picard aesthetic)'
                        ],
                        examples: ['simple', 'segmented']
                    },

                    // ===== SIMPLE STYLE CONFIGURATION =====
                    segment: {
                        type: 'object',
                        description: 'Configuration for simple style (single elbow)',
                        default: {
                            bar_width: 120,
                            bar_height: 20,
                            outer_curve: 'auto'
                        },
                        examples: [
                            {
                                bar_width: 90,
                                bar_height: 20,
                                outer_curve: 'auto',
                                color: {
                                    default: '#888888',
                                    active: '#FF9900',
                                    inactive: '#444444'
                                }
                            },
                            {
                                bar_width: 150,
                                bar_height: 150,
                                outer_curve: 75,
                                inner_curve: 37.5
                            }
                        ],
                        properties: {
                            bar_width: {
                                oneOf: [
                                    {
                                        type: 'number',
                                        minimum: 10,
                                        maximum: 500,
                                        default: 90,
                                        description: 'Width of vertical sidebar (pixels)',
                                        examples: [90, 120, 150]
                                    },
                                    {
                                        type: 'string',
                                        enum: ['theme'],
                                        description: "Use 'theme' to dynamically bind to input_number.lcars_vertical from HA-LCARS theme",
                                        examples: ['theme']
                                    }
                                ],
                                default: 90,
                                description: 'Width of vertical sidebar. Use number for static value or "theme" for dynamic binding to HA-LCARS input_number.lcars_vertical',
                                examples: [90, 120, 150, 'theme'],
                                'x-ui-hints': {
                                    label: 'Bar Width',
                                    helper: 'Vertical bar thickness (pixels or theme binding)',
                                    selector: {
                                        choose: {
                                            choices: {
                                                pixels: {
                                                    selector: {
                                                        number: {
                                                            mode: 'slider',
                                                            min: 10,
                                                            max: 500,
                                                            step: 5,
                                                            slider_ticks: false,
                                                            unit_of_measurement: 'px'
                                                        }
                                                    }
                                                },
                                                theme: {
                                                    selector: {
                                                        select: {
                                                            options: [
                                                                {
                                                                    value: 'theme',
                                                                    label: 'Bind to input_number.lcars_vertical'
                                                                }
                                                            ]
                                                        }
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            },
                            bar_height: {
                                oneOf: [
                                    {
                                        type: 'number',
                                        minimum: 10,
                                        maximum: 500,
                                        default: 20,
                                        description: 'Height of horizontal bar (pixels)',
                                        examples: [20, 30, 90]
                                    },
                                    {
                                        type: 'string',
                                        enum: ['theme'],
                                        description: "Use 'theme' to dynamically bind to input_number.lcars_horizontal from HA-LCARS theme",
                                        examples: ['theme']
                                    }
                                ],
                                description: 'Height of horizontal bar. Use number for static value or "theme" for dynamic binding to HA-LCARS input_number.lcars_horizontal. Defaults to bar_width if not specified.',
                                examples: [20, 30, 90, 'theme'],
                                'x-ui-hints': {
                                    label: 'Bar Height',
                                    helper: 'Horizontal bar thickness (pixels or theme binding)',
                                    selector: {
                                        choose: {
                                            choices: {
                                                pixels: {
                                                    selector: {
                                                        number: {
                                                            mode: 'slider',
                                                            min: 10,
                                                            max: 500,
                                                            step: 5,
                                                            slider_ticks: false,
                                                            unit_of_measurement: 'px'
                                                        }
                                                    }
                                                },
                                                theme: {
                                                    selector: {
                                                        select: {
                                                            options: [
                                                                {
                                                                    value: 'theme',
                                                                    label: 'Bind to input_number.lcars_horizontal'
                                                                }
                                                            ]
                                                        }
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            },
                            outer_curve: {
                                oneOf: [
                                    {
                                        type: 'number',
                                        minimum: 0,
                                        maximum: 500,
                                        description: 'Outer corner radius in pixels',
                                        examples: [45, 75, 100]
                                    },
                                    {
                                        type: 'string',
                                        const: 'auto',
                                        description: 'Auto-calculate using LCARS formula: bar_width / 2'
                                    }
                                ],
                                default: 'auto',
                                description: 'Outer corner radius (pixels or "auto" for LCARS formula: bar_width / 2)',
                                $comment: 'LCARS Arc Formula: outer_curve = bar_width / 2 creates authentic tangent geometry',
                                'x-ui-hints': {
                                    label: 'Outer Curve',
                                    helper: 'Radius of outer corner (use "auto" for authentic LCARS geometry)',
                                    defaultOneOfBranch: 0,
                                    selector: {
                                        number: {
                                            mode: 'slider',
                                            step: 1,
                                            unit_of_measurement: 'px'
                                        }
                                    }
                                }
                            },
                            inner_curve: {
                                type: 'number',
                                minimum: 0,
                                maximum: 500,
                                description: 'Inner corner radius (pixels, defaults to outer_curve / 2 using LCARS formula)',
                                examples: [22.5, 37.5, 50],
                                $comment: 'LCARS formula: inner_curve = outer_curve / 2 for authentic concentric geometry',
                                'x-ui-hints': {
                                    label: 'Inner Curve',
                                    helper: 'Radius of inner corner (defaults to outer_curve / 2 for LCARS geometry)',
                                    selector: {
                                        number: {
                                            mode: 'slider',
                                            step: 0.5,
                                            unit_of_measurement: 'px'
                                        }
                                    }
                                }
                            },
                            color: {
                                ...stateColorSchema,
                                description: 'Segment color (string or state-based object)',
                                examples: [
                                    '#FF9900',
                                    'theme:palette.moonlight',
                                    {
                                        default: '#888888',
                                        active: '#FF9900',
                                        inactive: '#444444',
                                        unavailable: '#666666'
                                    }
                                ]
                            }
                        }
                    },

                    // ===== SEGMENTED STYLE CONFIGURATION =====
                    segments: {
                        type: 'object',
                        description: 'Configuration for segmented style (double concentric elbows with gap)',
                        default: {
                            gap: 4,
                            outer_segment: {
                                bar_width: 88,
                                bar_height: 10
                            },
                            inner_segment: {
                                bar_width: 28,
                                bar_height: 10
                            }
                        },
                        examples: [
                            {
                                gap: 4,
                                outer_segment: {
                                    bar_width: 90,
                                    bar_height: 90,
                                    outer_curve: 45,
                                    inner_curve: 22.5,
                                    color: '#FF9900'
                                },
                                inner_segment: {
                                    bar_width: 60,
                                    bar_height: 60,
                                    color: '#FFCC99'
                                }
                            }
                        ],
                        properties: {
                            gap: {
                                type: 'number',
                                minimum: 0,
                                maximum: 50,
                                default: 4,
                                description: 'Gap between outer and inner segments (pixels)',
                                examples: [2, 4, 6, 8]
                            },

                            outer_segment: {
                                type: 'object',
                                required: ['bar_width'],
                                description: 'Outer segment (frame) configuration',
                                examples: [
                                    {
                                        bar_width: 90,
                                        bar_height: 90,
                                        outer_curve: 45,
                                        inner_curve: 22.5,
                                        color: '#FF9900',
                                        entity_id: 'light.outer'
                                    }
                                ],
                                properties: {
                                    entity_id: {
                                        type: 'string',
                                        format: 'entity',
                                        pattern: '^[a-z_]+\\.[a-z0-9_]+$',
                                        description: 'Entity ID for state-based color (format: domain.object_id)',
                                        examples: ['light.outer_frame', 'switch.outer_power']
                                    },
                                    bar_width: {
                                        type: 'number',
                                        minimum: 1,
                                        maximum: 500,
                                        description: 'Vertical bar thickness (pixels) - REQUIRED',
                                        examples: [90, 120, 150]
                                    },
                                    bar_height: {
                                        type: 'number',
                                        minimum: 1,
                                        maximum: 500,
                                        description: 'Horizontal bar thickness (pixels, defaults to bar_width)',
                                        examples: [20, 90, 150]
                                    },
                                    outer_curve: {
                                        type: 'number',
                                        minimum: 0,
                                        maximum: 500,
                                        description: 'Outer corner radius (pixels, defaults to bar_width / 2)',
                                        examples: [45, 60, 75]
                                    },
                                    inner_curve: {
                                        type: 'number',
                                        minimum: 0,
                                        maximum: 500,
                                        description: 'Inner corner radius (pixels, defaults to outer_curve / 2)',
                                        examples: [22.5, 30, 37.5]
                                    },
                                    color: stateColorSchema,
                                    tap_action: actionSchema,
                                    hold_action: actionSchema,
                                    double_tap_action: actionSchema
                                }
                            },

                            inner_segment: {
                                type: 'object',
                                required: ['bar_width'],
                                description: 'Inner segment (content area) configuration',
                                examples: [
                                    {
                                        bar_width: 60,
                                        bar_height: 60,
                                        outer_curve: 18,
                                        inner_curve: 9,
                                        color: '#FFCC99',
                                        entity_id: 'light.inner'
                                    }
                                ],
                                properties: {
                                    entity_id: {
                                        type: 'string',
                                        format: 'entity',
                                        pattern: '^[a-z_]+\\.[a-z0-9_]+$',
                                        description: 'Entity ID for state-based color (format: domain.object_id)',
                                        examples: ['light.inner_zone', 'switch.inner_power']
                                    },
                                    bar_width: {
                                        type: 'number',
                                        minimum: 1,
                                        maximum: 500,
                                        description: 'Vertical bar thickness (pixels) - REQUIRED',
                                        examples: [60, 80, 100]
                                    },
                                    bar_height: {
                                        type: 'number',
                                        minimum: 1,
                                        maximum: 500,
                                        description: 'Horizontal bar thickness (pixels, defaults to bar_width)',
                                        examples: [20, 60, 100]
                                    },
                                    outer_curve: {
                                        type: 'number',
                                        minimum: 0,
                                        maximum: 500,
                                        description: 'Outer corner radius (pixels, auto-calculated for concentricity if not specified)',
                                        examples: [18, 30, 40],
                                        $comment: 'Auto-calculation: outer_segment.inner_curve - gap'
                                    },
                                    inner_curve: {
                                        type: 'number',
                                        minimum: 0,
                                        maximum: 500,
                                        description: 'Inner corner radius (pixels, defaults to outer_curve / 2)',
                                        examples: [9, 15, 20]
                                    },
                                    color: stateColorSchema,
                                    tap_action: actionSchema,
                                    hold_action: actionSchema,
                                    double_tap_action: actionSchema
                                }
                            }
                        }
                    },

                    colors: {
                        type: 'object',
                        description: 'Legacy color override (use segment.color or segments.*.color instead)',
                        deprecated: true,
                        properties: {
                            background: {
                                type: 'string',
                                pattern: '^(#[0-9A-Fa-f]{6}|#[0-9A-Fa-f]{8}|transparent|theme:|rgb\\(|rgba\\(|hsl\\(|var\\(--)',
                                description: 'Background color override (deprecated - use segment.color instead)'
                            }
                        }
                    }
                }
            },

            // ============================================================================
            // TEXT CONFIGURATION (inherited from button)
            // ============================================================================

            text: {
                type: 'object',
                description: 'Multi-text label system (inherits from button card)',
                $comment: 'Text fields use arbitrary keys. "default" provides styling inherited by all other text fields. All other keys create actual rendered text elements.',
                examples: [
                    {
                        label1: {
                            content: 'ENGINEERING',
                            position: 'center',
                            font_size: 18,
                            color: '#FF9900'
                        },
                        status: {
                            content: '{{entity.state}}',
                            position: 'bottom-center',
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
                                description: 'Text rotation in degrees (-360 to 360)'
                            },
                            padding: {
                                oneOf: [
                                    {
                                        type: 'number',
                                        minimum: 0,
                                        maximum: 200,
                                        description: 'Same padding on all sides (in pixels)'
                                    },
                                    {
                                        type: 'object',
                                        description: 'Different padding for each side',
                                        properties: {
                                            top: { type: 'number', minimum: 0, maximum: 200 },
                                            right: { type: 'number', minimum: 0, maximum: 200 },
                                            bottom: { type: 'number', minimum: 0, maximum: 200 },
                                            left: { type: 'number', minimum: 0, maximum: 200 }
                                        }
                                    }
                                ]
                            },
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
                                pattern: '^[a-zA-Z0-9_ -]+(,\\s*[a-zA-Z0-9_ "-]+)*$',
                                description: 'CSS font-family (single font or comma-separated stack)',
                                examples: ['Arial', 'lcards_title', 'Antonio, sans-serif', '"Roboto Mono", monospace']
                            },
                            text_transform: {
                                type: 'string',
                                enum: ['none', 'uppercase', 'lowercase', 'capitalize'],
                                default: 'none',
                                description: 'Text transformation'
                            },
                            anchor: {
                                type: 'string',
                                enum: ['start', 'middle', 'end'],
                                default: 'middle',
                                description: 'Horizontal text alignment'
                            },
                            baseline: {
                                type: 'string',
                                enum: ['hanging', 'middle', 'central', 'alphabetic'],
                                default: 'middle',
                                description: 'Vertical text alignment'
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
                            description: 'Text content (supports templates: Jinja2, JavaScript, Token, DataSource)',
                            examples: [
                                'NAVIGATION',
                                '{entity.state}',
                                '{{states("sensor.temperature")}}°C',
                                '[[[return entity.state.toUpperCase()]]]'
                            ]
                        },
                        show: {
                            type: 'boolean',
                            default: true,
                            description: 'Whether to show this text field'
                        },
                        position: {
                            type: 'string',
                            enum: positionEnum,
                            description: 'Text position (overrides default)',
                            examples: ['top-left', 'center', 'bottom-right']
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
                            description: 'Text rotation in degrees (-360 to 360)'
                        },
                        padding: {
                            oneOf: [
                                {
                                    type: 'number',
                                    minimum: 0,
                                    maximum: 200,
                                    description: 'Same padding on all sides (in pixels)'
                                },
                                {
                                    type: 'object',
                                    description: 'Different padding for each side',
                                    properties: {
                                        top: { type: 'number', minimum: 0, maximum: 200 },
                                        right: { type: 'number', minimum: 0, maximum: 200 },
                                        bottom: { type: 'number', minimum: 0, maximum: 200 },
                                        left: { type: 'number', minimum: 0, maximum: 200 }
                                    }
                                }
                            ]
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
                            pattern: '^[a-zA-Z0-9_ -]+(,\\s*[a-zA-Z0-9_ "-]+)*$',
                            description: 'CSS font-family (single font or comma-separated stack)',
                            examples: ['Arial', 'lcards_title', 'Antonio, sans-serif', '"Roboto Mono", monospace']
                        },
                        text_transform: {
                            type: 'string',
                            enum: ['none', 'uppercase', 'lowercase', 'capitalize'],
                            default: 'none',
                            description: 'Text transformation'
                        },
                        anchor: {
                            type: 'string',
                            enum: ['start', 'middle', 'end'],
                            default: 'middle',
                            description: 'Horizontal text alignment'
                        },
                        baseline: {
                            type: 'string',
                            enum: ['hanging', 'middle', 'central', 'alphabetic'],
                            default: 'middle',
                            description: 'Vertical text alignment'
                        },
                        template: {
                            type: 'boolean',
                            default: false,
                            description: 'Enable template string evaluation (e.g., {{entity.state}})'
                        }
                    }
                }
            },

            // ============================================================================
            // ACTIONS (inherited from button)
            // ============================================================================

            tap_action: {
                ...actionSchema,
                description: 'Action to perform on tap/click'
            },

            hold_action: {
                ...actionSchema,
                description: 'Action to perform on hold (long press)'
            },

            double_tap_action: {
                ...actionSchema,
                description: 'Action to perform on double tap'
            },

            // ============================================================================
            // DATA SOURCES (shared across all lcards)
            // ============================================================================

            data_sources: {
                type: 'object',
                description: 'Named data source definitions (shared across all lcards)',
                $comment: 'Data sources enable historical data queries and transformations',
                examples: [
                    {
                        temp_history: {
                            entity_id: 'sensor.temperature',
                            update_interval: 5,
                            history_size: 100
                        }
                    }
                ],
                additionalProperties: {
                    type: 'object',
                    properties: {
                        entity_id: {
                            type: 'string',
                            format: 'entity',
                            pattern: '^[a-z_]+\\.[a-z0-9_]+$',
                            description: 'Entity ID to fetch data from (format: domain.object_id)',
                            examples: ['sensor.temperature', 'light.living_room']
                        },
                        update_interval: {
                            type: 'number',
                            minimum: 1,
                            maximum: 3600,
                            description: 'Update interval in seconds (1-3600)',
                            examples: [5, 30, 60]
                        },
                        history_size: {
                            type: 'number',
                            minimum: 1,
                            maximum: 10000,
                            description: 'Number of historical data points to retain',
                            examples: [50, 100, 500]
                        },
                        transformations: {
                            type: 'array',
                            description: 'Data transformations to apply',
                            items: {
                                type: 'object',
                                properties: {
                                    type: {
                                        type: 'string',
                                        enum: ['moving_average', 'sum', 'min', 'max'],
                                        description: 'Transformation type'
                                    },
                                    window: {
                                        type: 'number',
                                        minimum: 1,
                                        description: 'Window size for transformation'
                                    }
                                },
                                required: ['type']
                            }
                        }
                    },
                    required: ['entity_id']
                }
            },

            // ============================================================================
            // ANIMATIONS & FILTERS
            // ============================================================================

            animations: {
                type: 'array',
                description: 'Visual animations triggered by user interactions or entity state changes',
                items: animationSchema
            },

            filters: {
                type: 'array',
                description: 'Visual filters applied to entire elbow (CSS and SVG filter primitives)',
                items: filterSchema
            },

            // ============================================================================
            // ADVANCED OPTIONS
            // ============================================================================

            css_class: {
                type: 'string',
                pattern: '^[a-zA-Z0-9_-]+$',
                description: 'Custom CSS class for styling (alphanumeric, underscore, hyphen)',
                examples: ['custom-elbow', 'header-style', 'primary-corner']
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
                default: 4,
                description: 'Card height in grid rows (1-100, default: 4)'
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
