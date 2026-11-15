/**
 * @fileoverview Names and descriptions of the LCARS section strategies, shared by
 * the main-chunk registration (strategy-registration.js) and the lazy generators
 * (lcards-section-strategies.js), so the chooser and the code can't drift.
 */

/** @type {Record<string, { name: string, description: string }>} */
export const LCARS_SECTION_CATALOG = {
    'lcars-readings': {
        name: 'LCARS readings',
        description: 'A title bar over a readings table: the sensors of an area or other target, with their values.',
    },
    'lcars-gauges': {
        name: 'LCARS gauges',
        description: 'Upright Picard gauges with a value cap and a name cap: percentages, temperatures and number helpers of a target.',
    },
    'lcars-controls': {
        name: 'LCARS controls',
        description: 'Rounded LCARS pills that toggle the lights, switches, fans and toggle helpers of a target.',
    },
    'lcars-blocks': {
        name: 'LCARS blocks',
        description: 'A Picard code-block panel: a small block per light, switch or toggle helper of a target, lit in the accent while it is on.',
    },
};
