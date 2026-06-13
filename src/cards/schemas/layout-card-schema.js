/**
 * Layout Card Schema
 *
 * JSON Schema for `custom:lcards-layout-card` — a CSS Grid container card.
 * Validation is intentionally lenient: the grid `layout` block accepts any CSS
 * grid property, and `cards[]` holds arbitrary HA card configs (only `type` is
 * required per card). Editing is handled by the Layout Studio, not schema-driven
 * forms, so there are no x-ui-hints here.
 *
 * @see src/cards/lcards-layout-card.js
 * @see src/views/lcards-layout-view.js (same layout/view_layout schema)
 */

const trackString = { type: 'string' };

const areaSettingsSchema = {
    type: 'object',
    additionalProperties: true,
    properties: {
        'background':          { type: 'string' },
        'background-image':    { type: 'string' },
        'background-size':     { type: 'string' },
        'background-position': { type: 'string' },
        'background-repeat':   { type: 'string' },
        'border-width':        { type: 'string' },
        'border-style':        { type: 'string' },
        'border-color':        { type: 'string' },
        'border-radius':       { type: 'string' },
        'place-self':          { type: 'string' },
        'margin':              { type: 'string' },
        'overflow':            { type: 'string' },
        'z-index':             { type: ['string', 'number'] },
    },
};

const viewLayoutSchema = {
    type: 'object',
    additionalProperties: true,
    properties: {
        'grid-area':    { type: 'string' },
        'grid-column':  { type: 'string' },
        'grid-row':     { type: 'string' },
        'place-self':   { type: 'string' },
        'align-self':   { type: 'string' },
        'justify-self': { type: 'string' },
        'margin':       { type: 'string' },
        'overflow':     { type: 'string' },
        'z-index':      { type: ['string', 'number'] },
    },
};

const layoutSchema = {
    type: 'object',
    additionalProperties: true,
    properties: {
        'grid-template-columns': trackString,
        'grid-template-rows':    trackString,
        'grid-template-areas':   trackString,
        'grid-gap':              trackString,
        'gap':                   trackString,
        'height':                trackString,
        'margin':                trackString,
        'padding':               trackString,
        'card_margin':           trackString,
        'card_overflow':         trackString,
        'place-items':           trackString,
        'place-content':         trackString,
        'grid-auto-flow':        trackString,
        'grid-auto-rows':        trackString,
        'grid-auto-columns':     trackString,
        'mediaquery':            { type: 'object', additionalProperties: true },
        'areas': {
            type: 'object',
            additionalProperties: areaSettingsSchema,
        },
    },
};

export const layoutCardSchema = {
    type: 'object',
    required: ['type'],
    additionalProperties: true,
    properties: {
        type: {
            type: 'string',
            const: 'custom:lcards-layout-card',
            'x-ui-hints': { hidden: true },
        },
        layout: layoutSchema,
        // The card itself may carry view_layout when placed inside a layout view.
        view_layout: viewLayoutSchema,
        cards: {
            type: 'array',
            items: {
                type: 'object',
                required: ['type'],
                additionalProperties: true,
                properties: {
                    type: { type: 'string' },
                    view_layout: viewLayoutSchema,
                },
            },
        },
    },
};
