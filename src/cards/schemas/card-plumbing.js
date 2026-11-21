/**
 * Keys every card accepts that the card schemas don't list: Home Assistant's own
 * layout plumbing (read by the view or hui-card, not the card) and the styling keys
 * of UIX and its predecessor card-mod, which work on any card in a hui-card.
 *
 * One list for every check: the runtime validator (CoreValidationService) skips
 * them at a card's root, the config checker (scripts/lib/config-validator.js) too,
 * and the published card schemas declare them (withCardPlumbing) so editors and
 * IDEs accept them.
 */
export const CARD_PLUMBING_KEYS = Object.freeze(['type', 'grid_options', 'view_layout', 'visibility', 'layout_options', 'card_mod', 'uix']);

/** Schemas for the published files (loose: their shape is Home Assistant's or the mod's). */
const PLUMBING_SCHEMAS = {
    grid_options: { type: 'object', additionalProperties: true, description: 'Placement in a sections view (columns, rows), read by Home Assistant.' },
    view_layout: { type: 'object', additionalProperties: true, description: 'Placement in a custom view layout (e.g. grid-area), read by the view.' },
    visibility: { type: 'array', description: 'Home Assistant visibility conditions: the card shows only while they hold.' },
    layout_options: { type: 'object', additionalProperties: true, description: 'The older name of grid_options, read by Home Assistant.' },
    card_mod: { type: 'object', additionalProperties: true, description: 'card-mod styling, read by card-mod.' },
    uix: { type: 'object', additionalProperties: true, description: 'UIX styling, read by UIX.' },
};

/**
 * A copy of a card schema that declares every plumbing key it doesn't already.
 * @param {any} schema
 * @returns {any}
 */
export function withCardPlumbing(schema) {
    if (!schema?.properties) return schema;
    const missing = Object.entries(PLUMBING_SCHEMAS).filter(([key]) => !(key in schema.properties));
    if (!missing.length) return schema;
    return { ...schema, properties: { ...schema.properties, ...Object.fromEntries(missing) } };
}
