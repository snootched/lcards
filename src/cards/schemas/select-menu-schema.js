/**
 * Select Menu Card Schema
 *
 * Validation schema for the lcards-select-menu card.
 * Renders an input_select (or other entity) as a grid of styled option buttons.
 *
 * This schema is ONLY for validation, not UI generation.
 * Editor UI is defined in lcards-select-menu-editor.js.
 */

import {
    dataSourcesSchema,
    actionSchema,
    stateColorSchema,
    gridOptionsSchema,
    entitySchema,
    cardIdSchema,
    tagsSchema,
    cardHeightSchema,
    cardWidthSchema,
} from './common-schemas.js';

/**
 * Get complete select menu card schema
 * @param {Object} [options]
 * @param {Array<string>} [options.availablePresets] - Available button preset names
 * @returns {Object} Complete schema
 */
export function getSelectMenuSchema(options = {}) {
    const { availablePresets = [] } = options;

    // ── Per-option override shape ──────────────────────────────────────────
    const optionOverrideSchema = {
        type: 'object',
        description: 'Per-option visual overrides',
        properties: {
            value: {
                type: 'string',
                description: 'Option value (required in array form, must match entity option)'
            },
            label: {
                type: 'string',
                description: 'Display label override (default: option value)'
            },
            icon: {
                type: 'string',
                description: 'MDI icon (e.g. mdi:home) or Simple Icons (si:github)',
                examples: ['mdi:home', 'mdi:shield-star', 'mdi:medical-bag']
            },
            style: {
                type: 'object',
                description: 'Style overrides for this option (same shape as card-level style)',
                properties: {
                    card: {
                        type: 'object',
                        properties: { color: { type: 'object' } }
                    },
                    text: {
                        type: 'object',
                        properties: { default: { type: 'object' } }
                    }
                },
                additionalProperties: true
            },
            tap_action: actionSchema
        },
        additionalProperties: false
    };

    // ── Grid layout (CSS passthrough) ──────────────────────────────────────
    const selectGridSchema = {
        type: 'object',
        description: 'Grid layout config for option buttons. Supports CSS Grid shorthand or full properties.',
        properties: {
            columns: {
                oneOf: [
                    { type: 'number', minimum: 1, maximum: 24 },
                    { type: 'string', description: 'CSS grid-template-columns value, e.g. "repeat(4, 1fr)"' }
                ],
                description: 'Number of columns (shorthand → repeat(N, 1fr)) or full CSS grid-template-columns value'
            },
            rows: {
                type: ['number', 'string'],
                description: 'Number of rows or CSS grid-template-rows value'
            },
            gap: {
                type: 'string',
                description: 'CSS gap shorthand (applies to both row and column gap)',
                examples: ['4px', '8px', '0.5rem']
            },
            'row-gap': {
                type: 'string',
                description: 'Override row gap',
                examples: ['4px', '8px']
            },
            'column-gap': {
                type: 'string',
                description: 'Override column gap',
                examples: ['4px', '8px']
            },
            'grid-auto-flow': {
                type: 'string',
                enum: ['row', 'column', 'dense', 'row dense', 'column dense'],
                description: 'CSS grid-auto-flow direction'
            },
            'grid-template-columns': {
                type: 'string',
                description: 'Full CSS grid-template-columns (overrides columns shorthand)',
                examples: ['repeat(4, 1fr)', '100px 1fr 2fr']
            },
            'grid-auto-rows': {
                type: 'string',
                description: 'CSS grid-auto-rows for implicit row height',
                examples: ['auto', '40px', '1fr']
            },
            'justify-items': {
                type: 'string',
                enum: ['stretch', 'start', 'end', 'center'],
                description: 'CSS justify-items for cell alignment'
            },
            'align-items': {
                type: 'string',
                enum: ['stretch', 'start', 'end', 'center'],
                description: 'CSS align-items for cell alignment'
            }
        },
        additionalProperties: true
    };

    // ── Style block ────────────────────────────────────────────────────────
    const selectStyleSchema = {
        type: 'object',
        description: 'Style applied to all option buttons. Uses the same stateColor schema as lcards-button. active = selected, inactive = unselected.',
        properties: {
            card: {
                type: 'object',
                properties: {
                    color: {
                        type: 'object',
                        properties: {
                            background: {
                                oneOf: [
                                    { type: 'string' },
                                    {
                                        type: 'object',
                                        properties: {
                                            active:      { type: 'string', description: 'Selected option background' },
                                            inactive:    { type: 'string', description: 'Unselected option background' },
                                            hover:       { type: 'string', description: 'Hovered option background' },
                                            pressed:     { type: 'string', description: 'Pressed option background' },
                                            unavailable: { type: 'string', description: 'Background when entity unavailable' },
                                            default:     { type: 'string', description: 'Fallback background color' }
                                        },
                                        additionalProperties: true
                                    }
                                ],
                                description: 'Option button background color (state-based or static)'
                            }
                        },
                        additionalProperties: true
                    }
                },
                additionalProperties: true
            },
            text: {
                type: 'object',
                properties: {
                    default: {
                        type: 'object',
                        properties: {
                            color: stateColorSchema,
                            font_size: { type: ['number', 'string'] },
                            font_weight: { type: ['number', 'string'] },
                            text_transform: { type: 'string', enum: ['uppercase', 'lowercase', 'capitalize', 'none'] },
                            letter_spacing: { type: 'string' }
                        },
                        additionalProperties: true
                    }
                },
                additionalProperties: true
            },
            border: {
                type: 'object',
                properties: {
                    radius: {
                        oneOf: [
                            { type: 'number' },
                            { type: 'string' },
                            {
                                type: 'object',
                                properties: {
                                    top_left:     { type: 'number' },
                                    top_right:    { type: 'number' },
                                    bottom_right: { type: 'number' },
                                    bottom_left:  { type: 'number' }
                                }
                            }
                        ],
                        description: 'Border radius (px or CSS string). Object form for per-corner control.'
                    },
                    width: {
                        oneOf: [{ type: 'number' }, { type: 'string' }],
                        description: 'Border width (px)'
                    },
                    color: {
                        oneOf: [{ type: 'string' }, { type: 'object' }],
                        description: 'Border color (static or state-based)'
                    }
                },
                additionalProperties: true
            },
            opacity: {
                type: 'number',
                minimum: 0,
                maximum: 1,
                description: 'Base opacity for unselected options (0-1). Defaults to 0.9 if not specified.'
            }
        },
        additionalProperties: true
    };

    // ── Main schema ────────────────────────────────────────────────────────
    return {
        $schema: 'http://json-schema.org/draft-07/schema#',
        $id: 'https://github.com/snootched/lcards/schemas/select-menu-schema',
        title: 'LCARdS Select Menu Card Configuration',
        description: 'Renders an input_select entity as a grid of LCARS-styled option buttons. Each button calls input_select.select_option when tapped. The selected option is styled as "active", all others as "inactive".',
        type: 'object',
        required: ['type'],
        examples: [
            {
                type: 'custom:lcards-select-menu',
                entity: 'input_select.view_selector',
                preset: 'lozenge',
                grid: { columns: 1, gap: '4px' }
            }
        ],
        properties: {

            // ── HA required ───────────────────────────────────────────────
            type: {
                type: 'string',
                const: 'custom:lcards-select-menu',
                description: 'Home Assistant card type identifier (required)'
            },

            // ── Shared LCARdS ─────────────────────────────────────────────
            data_sources: dataSourcesSchema,

            // ── Core ──────────────────────────────────────────────────────
            entity: {
                ...entitySchema,
                description: 'input_select (or select) entity whose options become buttons',
                'x-ui-hints': { label: 'Entity (input_select)', domain: 'input_select,select' }
            },

            id: cardIdSchema,
            tags: tagsSchema,

            // ── Sizing ────────────────────────────────────────────────────
            height: cardHeightSchema,
            width:  cardWidthSchema,

            // ── Appearance ────────────────────────────────────────────────
            preset: {
                type: 'string',
                description: 'Button style preset applied to all option buttons (e.g. lozenge, filled, outline)',
                examples: availablePresets,
                'x-ui-hints': {
                    label: 'Button Preset',
                    helper: 'Pick a button style preset. Controls shape, colors, and typography of all option buttons.'
                }
            },

            // ── Grid layout ───────────────────────────────────────────────
            grid: selectGridSchema,

            // ── Option source ─────────────────────────────────────────────
            options: {
                oneOf: [
                    {
                        type: 'object',
                        description: 'Object form: per-option overrides keyed by option value. Entity order is preserved.',
                        additionalProperties: optionOverrideSchema
                    },
                    {
                        type: 'array',
                        description: 'Array form: explicit ordered list (also filters which options are shown). Each item must have a "value" key.',
                        items: {
                            ...optionOverrideSchema,
                            required: ['value']
                        }
                    }
                ],
                description: 'Per-option configuration. Object: override by name (entity order preserved). Array: explicit order + filter.'
            },

            // ── Style ─────────────────────────────────────────────────────
            style: selectStyleSchema,

            // ── Actions ───────────────────────────────────────────────────
            tap_action: {
                ...actionSchema,
                description: 'Override the default select_option tap action for ALL option buttons (per-option tap_action takes priority).'
            },
            hold_action:        actionSchema,
            double_tap_action:  actionSchema,

            // ── Grid options (HA dashboard) ──────────────────────────────
            grid_options: gridOptionsSchema
        },
        additionalProperties: true
    };
}
