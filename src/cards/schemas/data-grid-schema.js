/**
 * Data Grid Card Schema
 *
 * Two modes: decorative (generated values) and data (rows of text, entity
 * states, templates and datasource tokens). Legacy keys stay in the schema
 * with `deprecated: true` + `x-replacement` so old configs validate with a
 * warning; migrateDataGridConfig() rewrites them (src/data-grid/).
 *
 * @see doc/cards/data-grid/
 */

import {
    animationSchema, filterSchema, actionSchema, stateColorSchema, dataSourcesSchema,
    gridOptionsSchema, triggersUpdateSchema, cardIdSchema, tagsSchema,
    cardHeightSchema, cardWidthSchema, cardMinHeightSchema, cardMinWidthSchema,
    cardMaxHeightSchema, cardMaxWidthSchema, cardOverflowSchema, cardOverflowXSchema,
    cardOverflowYSchema, cardZIndexSchema
} from './common-schemas.js';

const lengthSchema = (description, examples) => ({
    type: ['number', 'string'],
    description,
    ...(examples ? { examples } : {})
});

const FORMAT_ENUM = ['digit', 'float', 'alpha', 'hex', 'mixed'];

/**
 * Style object shared by `style`, `header_style`, `columns[].style`, row
 * `style` and cell `style`. Keys are snake_case CSS properties; any other CSS
 * property also works (e.g. `letter_spacing`, `border_top_color`).
 */
export const dataGridCellStyleSchema = {
    type: 'object',
    description: 'Cell style. Keys are CSS properties in snake_case (font_size, border_bottom_color, ...). Numbers become px.',
    properties: {
        color: { ...stateColorSchema, description: 'Text colour, or a state map (default, active, above:80, ...) resolved against the cell entity' },
        background: { ...stateColorSchema, description: 'Background colour, or a state map resolved against the cell entity' },
        font_size: lengthSchema('Font size: number (px) or CSS length', [18, '1.2rem']),
        font_family: { type: 'string', description: 'CSS font-family', examples: ['Antonio, sans-serif'] },
        font_weight: { type: ['number', 'string'], description: 'CSS font-weight', examples: [400, 'bold'] },
        align: { type: 'string', enum: ['left', 'center', 'right'], description: 'Horizontal text alignment (default right)' },
        padding: {
            oneOf: [
                { type: ['number', 'string'], description: 'Number (px) or CSS padding' },
                {
                    type: 'object',
                    description: 'Per-side padding in px',
                    properties: { top: { type: 'number' }, right: { type: 'number' }, bottom: { type: 'number' }, left: { type: 'number' } }
                }
            ]
        },
        text_transform: { type: 'string', enum: ['none', 'uppercase', 'lowercase', 'capitalize'] },
        letter_spacing: lengthSchema('CSS letter-spacing'),
        line_height: { type: ['number', 'string'], description: 'CSS line-height (numbers are unitless)' },
        white_space: { type: 'string', enum: ['nowrap', 'normal', 'pre', 'pre-wrap', 'pre-line'], description: 'nowrap (default) truncates with an ellipsis' },
        border_width: lengthSchema('Border width'),
        border_color: { type: 'string', description: 'Border colour' },
        border_style: { type: 'string', enum: ['solid', 'dashed', 'dotted', 'double', 'groove', 'ridge', 'inset', 'outset', 'none'] },
        border_radius: lengthSchema('Border radius')
    }
};

/** One cell: plain text / entity id / template, or a cell object. */
const cellSchema = {
    anyOf: [
        { type: 'string', description: 'Static text, an entity id (shows its state) or a template ({{ }}, {datasource:...}, [[[ ]]])' },
        { type: 'number' },
        {
            type: 'object',
            title: 'Cell object',
            description: 'A cell with its own style, entity context or actions',
            properties: {
                value: { type: ['string', 'number'], description: 'What the cell shows: text, entity id or template' },
                entity: { type: 'string', format: 'entity', description: 'Entity to show (when value is empty) and to resolve state-map colours and actions against' },
                attribute: { type: 'string', description: 'Show this attribute of the entity instead of its state' },
                style: dataGridCellStyleSchema,
                tap_action: actionSchema,
                hold_action: actionSchema,
                double_tap_action: actionSchema
            }
        }
    ]
};

export const dataGridSchema = {
    type: 'object',
    required: ['type'],
    properties: {
        type: {
            type: 'string',
            const: 'custom:lcards-data-grid',
            'x-ui-hints': { hidden: true }
        },

        // ── Mode ────────────────────────────────────────────────────────────
        data_mode: {
            oneOf: [
                {
                    type: 'string',
                    enum: ['decorative', 'data'],
                    description: 'decorative: generated values; data: your rows. Defaults to data when rows are set, otherwise decorative.'
                },
                {
                    type: 'string',
                    enum: ['random', 'template', 'datasource'],
                    deprecated: true,
                    'x-replacement': 'data_mode: decorative (random) or data (template, datasource)'
                }
            ]
        },

        // ── Decorative mode ─────────────────────────────────────────────────
        format: {
            type: 'string',
            enum: FORMAT_ENUM,
            default: 'mixed',
            description: 'Generated value format: digit (0042), float (42.17), alpha (AB), hex (A3F1) or mixed'
        },
        refresh_interval: {
            type: 'number',
            minimum: 0,
            default: 0,
            description: 'Regenerate values every N ms (0 = never)'
        },
        refresh_cells: {
            type: 'number',
            minimum: 0,
            maximum: 1,
            default: 1,
            description: 'Fraction of cells that change on each refresh (1 = all)'
        },

        // ── Data mode ───────────────────────────────────────────────────────
        rows: {
            type: 'array',
            description: 'Data rows. Each row is a list of cells, or { values, style, header }.',
            items: {
                oneOf: [
                    { type: 'array', title: 'Row', items: cellSchema },
                    {
                        type: 'object',
                        title: 'Styled row',
                        properties: {
                            values: { type: 'array', items: cellSchema },
                            style: dataGridCellStyleSchema,
                            header: { type: 'boolean', description: 'Header row: header defaults plus header_style' },
                            cellStyles: {
                                type: 'array',
                                deprecated: true,
                                'x-replacement': 'cell objects: { value, style }'
                            },
                            sources: { type: 'array', deprecated: true, 'x-replacement': 'values' }
                        },
                        required: ['values']
                    }
                ]
            }
        },
        cell_tap_action: {
            ...actionSchema,
            description: 'Tap action for every entity cell that has no tap_action of its own (e.g. { action: more-info })'
        },
        data_sources: dataSourcesSchema,
        triggers_update: triggersUpdateSchema,

        // ── Layout ──────────────────────────────────────────────────────────
        grid: {
            type: 'object',
            description: 'CSS Grid layout of the cells',
            properties: {
                'grid-template-columns': { type: 'string', description: "Column tracks, e.g. 'repeat(12, 1fr)' or '100px 1fr 2fr'. Decorative mode takes the column count from here." },
                'grid-template-rows': { type: 'string', description: "Row tracks, e.g. 'repeat(8, auto)'. Decorative mode takes the row count from here." },
                gap: lengthSchema('Gap between cells (default 8px)', ['8px', 0]),
                'row-gap': lengthSchema('Gap between rows'),
                'column-gap': lengthSchema('Gap between columns'),
                'grid-auto-flow': { type: 'string', enum: ['row', 'column', 'dense', 'row dense', 'column dense'] },
                'justify-items': { type: 'string', enum: ['stretch', 'start', 'end', 'center'] },
                'align-items': { type: 'string', enum: ['stretch', 'start', 'end', 'center'] },
                'justify-content': { type: 'string', enum: ['start', 'end', 'center', 'stretch', 'space-between', 'space-around', 'space-evenly'] },
                'align-content': { type: 'string', enum: ['start', 'end', 'center', 'stretch', 'space-between', 'space-around', 'space-evenly'] },
                'grid-auto-columns': { type: 'string' },
                'grid-auto-rows': { type: 'string' },
                'grid-template-areas': { type: 'string' },
                rows: { type: 'number', deprecated: true, 'x-replacement': "grid-template-rows: 'repeat(N, auto)'" },
                columns: { type: 'number', deprecated: true, 'x-replacement': "grid-template-columns: 'repeat(N, 1fr)'" },
                cell_width: { type: ['number', 'string'], deprecated: true, 'x-replacement': 'grid-template-columns' }
            }
        },

        // ── Styling ─────────────────────────────────────────────────────────
        style: { ...dataGridCellStyleSchema, description: 'Grid-wide style for every cell' },
        header_style: { ...dataGridCellStyleSchema, description: 'Style for rows marked header: true (on top of the header defaults)' },
        columns: {
            type: 'array',
            description: 'Per-column settings, by position',
            items: {
                type: 'object',
                properties: {
                    style: dataGridCellStyleSchema,
                    format: { type: 'string', enum: FORMAT_ENUM, description: 'Decorative mode: format for this column' }
                }
            }
        },

        // ── Animation ───────────────────────────────────────────────────────
        animations: {
            type: 'array',
            description: 'Card animations. preset: cascade-color runs row by row (params: pattern, speed_multiplier, duration, timing, colors).',
            items: animationSchema
        },
        highlight_changes: {
            oneOf: [
                { type: 'boolean', description: 'Pulse cells when their value changes' },
                {
                    type: 'object',
                    description: 'Animate cells when their value changes',
                    properties: {
                        preset: { type: 'string', default: 'pulse', description: 'Animation preset, e.g. pulse or glow' },
                        duration: { type: 'number', minimum: 0, default: 500 },
                        ease: { type: 'string', default: 'outQuad' },
                        params: { type: 'object', description: 'Preset params, e.g. { max_scale: 1.08 } or { color, blur_max }' },
                        max_cells: { type: 'number', minimum: 0, description: 'Most cells to animate at once (default: all, capped at 100)' }
                    }
                }
            ]
        },
        filters: {
            type: 'array',
            description: 'CSS filters applied to the whole grid',
            items: filterSchema
        },

        // ── Identity & sizing ───────────────────────────────────────────────
        id: cardIdSchema,
        tags: tagsSchema,
        grid_options: gridOptionsSchema,
        height: cardHeightSchema,
        width: cardWidthSchema,
        min_height: cardMinHeightSchema,
        min_width: cardMinWidthSchema,
        max_height: cardMaxHeightSchema,
        max_width: cardMaxWidthSchema,
        overflow: cardOverflowSchema,
        overflow_x: cardOverflowXSchema,
        overflow_y: cardOverflowYSchema,
        z_index: cardZIndexSchema,

        // ── Legacy (migrated on load) ───────────────────────────────────────
        animation: {
            type: 'object',
            deprecated: true,
            'x-replacement': 'highlight_changes, and cascade-color params (pattern, timing) in animations'
        },
        font_size: { type: ['number', 'string'], deprecated: true, 'x-replacement': 'style.font_size' },
        font_family: { type: 'string', deprecated: true, 'x-replacement': 'style.font_family' },
        font_weight: { type: ['number', 'string'], deprecated: true, 'x-replacement': 'style.font_weight' },
        align: { type: 'string', deprecated: true, 'x-replacement': 'style.align' }
    }
};
