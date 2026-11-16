/**
 * LCARS section strategies (src/strategies/lcards-section-strategies.js): the
 * config of a sections-view section's `strategy:` block. All three take the same
 * keys: Home Assistant's own for its Entities section (`title`, `target`) and the
 * LCARdS ones (`look`, `frame`, `codes`, `columns`, `max_items`, `item_height`, `gap`, `padding`, `header_gap`; readings also `mode`).
 */

const idList = (/** @type {string} */ what) => ({
    anyOf: [{ type: 'string' }, { type: 'array', items: { type: 'string' } }],
    description: `${what}: one id or a list`,
});

/** The section kinds, their strategy type and what each shows (for the schema description). */
export const LCARS_SECTION_KINDS = /** @type {const} */ ([
    ['lcars-readings', 'a readings list of the target\'s sensors (a number column or a table, classic or Picard)'],
    ['lcars-gauges', 'gauges for the target\'s percentages, temperatures and number helpers (classic pill bars or Picard column gauges)'],
    ['lcars-controls', 'toggles for the target\'s lights, switches, fans and toggle helpers (classic pills or Picard filled buttons)'],
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
            look: {
                type: 'string', enum: ['classic', 'picard'], default: 'classic',
                description: 'The LCARS era the section is drawn in: classic (TNG-era pills, number columns and a bracket frame) or picard (column gauges, filled buttons, a readings table and a display sweep).',
                enumDescriptions: { classic: 'TNG-era pills and bars', picard: 'Picard-era gauges, filled buttons and table' },
            },
            frame: {
                type: 'boolean', default: false,
                description: 'Draw a frame round the items in the look\'s style: classic, a bracket open on the right in pieces (a top sweep running on as the title bar, a bar down the left and a closing sweep, with small breaks between them); picard, a sweep along the top, left and bottom, open on the right.',
            },
            codes: {
                type: 'boolean', default: false,
                description: 'Classic frame only: a random code number (as on the TNG panels) at the bottom right of each block of the bracket\'s side. The side breaks into blocks about 90 px tall as the section grows.',
            },
            columns: {
                type: 'integer', minimum: 1, maximum: 6,
                description: 'Items side by side. Default: what suits the section and look (readings 1, gauges 4 in picard and 1 in classic, controls 2). The Picard readings table is always one.',
            },
            max_items: {
                type: 'integer', minimum: 1,
                description: 'At most this many items. Default: 12 readings, 8 gauges, 24 controls.',
            },
            item_height: {
                type: 'number', minimum: 16, maximum: 400,
                description: 'Height of each row of items in px (in a readings table, of each line); every row is then exactly this tall, so sections side by side can line up. Default: what suits the section and look (readings 34, table lines 24, gauges 44 classic and 260 Picard, controls 48 classic and 28 Picard). Kept at least 20 for readings and Picard controls, 16 for table lines, 24 for classic gauges and controls, 120 for Picard column gauges.',
            },
            gap: {
                type: 'number', minimum: 0, maximum: 64, default: 6,
                description: 'Space between the items in px.',
            },
            padding: {
                type: 'number', minimum: 0, maximum: 64,
                description: 'Space in px between the items and the frame (or the section\'s edges, or the Picard controls\' side bar). Default: 18 in a classic bracket, 16 in a Picard sweep, the gap beside the side bar, else 0.',
            },
            header_gap: {
                type: 'number', minimum: 0, maximum: 64,
                description: 'Space in px between the title (or the classic bracket\'s top bar) and the first row of items. Default: 18 in a classic bracket, else 8.',
            },
            ...(key === 'lcars-readings' ? {
                mode: {
                    type: 'string', enum: ['numbers', 'table'],
                    description: 'How the readings are drawn: numbers (each value as a big number beside a block and its name, as on the TNG ops panels) or table (names and values in rows). Default: numbers in the classic look, table in the Picard look.',
                    enumDescriptions: { numbers: 'Big values beside their names', table: 'Names and values in rows' },
                },
            } : {}),
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
