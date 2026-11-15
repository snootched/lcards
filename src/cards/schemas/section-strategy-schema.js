/**
 * LCARS section strategies (src/strategies/lcards-section-strategies.js): the
 * config of a sections-view section's `strategy:` block. All four take the same
 * keys, Home Assistant's own for its Entities section: `title` and `target`.
 */

const idList = (/** @type {string} */ what) => ({
    anyOf: [{ type: 'string' }, { type: 'array', items: { type: 'string' } }],
    description: `${what}: one id or a list`,
});

/** The section kinds, their strategy type and what each shows (for the schema description). */
export const LCARS_SECTION_KINDS = /** @type {const} */ ([
    ['lcars-readings', 'a title bar over a readings table of the target\'s sensors'],
    ['lcars-gauges', 'upright Picard gauges for the target\'s percentages, temperatures and number helpers'],
    ['lcars-controls', 'rounded pills that toggle the target\'s lights, switches, fans and toggle helpers'],
    ['lcars-blocks', 'a Picard code-block panel, a block per light, switch or toggle helper of the target, lit while it is on'],
]);

/**
 * @param {string} key - e.g. 'lcars-readings'
 * @param {string} shows
 */
export function lcarsSectionSchema(key, shows) {
    return {
        type: 'object',
        title: `LCARS section strategy: ${key}`,
        description: `Section strategy for a sections view (a section's \`strategy:\` block): ${shows}. Home Assistant generates it again when areas, devices or entities change.`,
        required: ['type'],
        additionalProperties: false,
        properties: {
            type: { type: 'string', const: `custom:${key}`, description: 'Strategy identifier.' },
            title: { type: 'string', description: 'The title bar\'s text. Default: the target\'s area name when it is one area, else a name for the kind of section.' },
            target: {
                type: 'object',
                description: 'What the section shows, as in Home Assistant\'s Entities section: the matching entities of the areas, devices, floors, labels and entities named here (hidden and configuration entities left out unless named). Without a target the section shows a hint.',
                additionalProperties: false,
                properties: {
                    entity_id: idList('Entities'),
                    device_id: idList('Devices'),
                    area_id: idList('Areas'),
                    floor_id: idList('Floors'),
                    label_id: idList('Labels (on entities, devices or areas)'),
                },
            },
        },
    };
}
