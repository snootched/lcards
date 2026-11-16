/**
 * @fileoverview Names and descriptions of the LCARS section strategies, shared by
 * the main-chunk registration (strategy-registration.js) and the lazy generators
 * (lcards-section-strategies.js), so the chooser and the code can't drift.
 */

/** @type {Record<string, { name: string, description: string }>} */
export const LCARS_SECTION_CATALOG = {
    'lcars-readings': {
        name: 'LCARS readings',
        description: 'The sensors of an area or other target with their values: a number column or a table, classic or Picard, framed if you like.',
    },
    'lcars-gauges': {
        name: 'LCARS gauges',
        description: 'Levels of a target (percentages, temperatures, number helpers): classic pill bars or Picard column gauges, framed if you like.',
    },
    'lcars-controls': {
        name: 'LCARS controls',
        description: 'Toggles for the lights, switches, fans and toggle helpers of a target: classic pills or Picard filled buttons, framed if you like.',
    },
};
