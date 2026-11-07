/**
 * The options slider components read from the card config (their
 * `configurableOptions`): the editor's Component options tab writes them and the
 * slider schema lists them. Kept apart from the components' drawing code so the
 * schema (in the main bundle) does not pull that code in.
 *
 * @module core/packs/components/sliders/component-options
 */

/** `component: picard` */
export const PICARD_OPTIONS = [
        {
            key: 'show_animation',
            type: 'boolean',
            default: true,
            description: 'Show pulsing animation indicators in top-left',
            'x-ui-hints': {
                label: 'Show Animation',
                helper: 'Show 3 pulsing animation indicators in top-left (default: true)',
                selector: { boolean: {} }
            }
        },
        {
            key: 'animation_speed',
            type: 'number',
            default: 2,
            description: 'Animation pulse speed in seconds',
            'x-ui-hints': {
                label: 'Animation Speed',
                helper: 'Animation pulse speed in seconds (default: 2)',
                selector: {
                    number: {
                        mode: 'box',
                        step: 0.1,
                        min: 0.1,
                        max: 10
                    }
                }
            }
        }
    ];

/** `component: demo` */
export const DEMO_OPTIONS = [
        // ============================================================
        // BOOLEAN OPTIONS
        // ============================================================

        {
            key: 'show_decorations',
            type: 'boolean',
            default: true,
            description: 'Show decorative border elements',
            'x-ui-hints': {
                label: 'Show Decorations',
                helper: 'Display decorative visual elements (default: true)',
                selector: { boolean: {} }
            }
        },

        {
            key: 'show_animation',
            type: 'boolean',
            default: true,
            description: 'Show animated indicators',
            'x-ui-hints': {
                label: 'Show Animation',
                helper: 'Enable pulsing and scrolling animations (default: true)',
                selector: { boolean: {} }
            }
        },

        {
            key: 'show_grid',
            type: 'boolean',
            default: false,
            description: 'Show layout grid lines',
            'x-ui-hints': {
                label: 'Show Grid',
                helper: 'Display grid lines for layout visualization (default: false)',
                selector: { boolean: {} }
            }
        },

        {
            key: 'show_zone_markers',
            type: 'boolean',
            default: false,
            description: 'Show zone boundary markers',
            'x-ui-hints': {
                label: 'Show Zone Markers',
                helper: 'Display coloured outlines for all zones (development only, default: false)',
                selector: { boolean: {} }
            }
        },

        // ============================================================
        // NUMBER OPTIONS
        // ============================================================

        {
            key: 'decoration_size',
            type: 'number',
            default: 10,
            description: 'Size of decorative elements in pixels',
            'x-ui-hints': {
                label: 'Decoration Size',
                helper: 'Size of corner decorations in pixels (default: 10)',
                selector: {
                    number: {
                        mode: 'box',
                        step: 1,
                        min: 5,
                        max: 30
                    }
                }
            }
        },

        {
            key: 'animation_speed',
            type: 'number',
            default: 2,
            description: 'Animation speed in seconds',
            'x-ui-hints': {
                label: 'Animation Speed',
                helper: 'Duration of animation cycle in seconds (default: 2)',
                selector: {
                    number: {
                        mode: 'slider',
                        step: 0.1,
                        min: 0.1,
                        max: 10
                    }
                }
            }
        },

        {
            key: 'border_thickness',
            type: 'number',
            default: 5,
            description: 'Border thickness in pixels',
            'x-ui-hints': {
                label: 'Border Thickness',
                helper: 'Thickness of top/bottom borders in pixels (default: 5)',
                selector: {
                    number: {
                        mode: 'box',
                        step: 1,
                        min: 0,
                        max: 20
                    }
                }
            }
        },

        // ============================================================
        // COLOR OPTIONS
        // ============================================================

        {
            key: 'decoration_color',
            type: 'color',
            default: '#66ccff',
            description: 'Colour of decorative elements',
            'x-ui-hints': {
                label: 'Decoration Colour',
                helper: 'Colour for corner decorations and animations (default: #66ccff)',
                format: 'color-lcards'     // Use LCARdS color picker
            }
        },

        // ============================================================
        // STYLE-NESTED OPTIONS
        // Demonstrates accessing nested style properties
        // ============================================================

        {
            key: 'style.border.radius',
            type: 'number',
            default: 0,
            description: 'Border radius for rounded corners',
            'x-ui-hints': {
                label: 'Border Radius',
                helper: 'Rounded corner radius in pixels (default: 0)',
                selector: {
                    number: {
                        mode: 'box',
                        step: 1,
                        min: 0,
                        max: 50
                    }
                }
            }
        },

        {
            key: 'style.range.show_labels',
            type: 'boolean',
            default: true,
            description: 'Show labels on range indicators',
            'x-ui-hints': {
                label: 'Show Range Labels',
                helper: 'Display labels on coloured range segments (default: true)',
                selector: { boolean: {} }
            }
        }
    ];
