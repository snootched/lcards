/**
 * Option lists shared by the card schema factories, the cards that register
 * those schemas at runtime, and the build scripts (scripts/lib/card-schemas.js),
 * so the published schema offers the same values the app accepts.
 *
 * @module cards/schemas/schema-options
 */

/** Text field `position` values (button, slider, elbow). */
export const TEXT_POSITIONS = Object.freeze([
    'top-left', 'top-center', 'top-right',
    'center-left', 'center', 'center-right',
    'bottom-left', 'bottom-center', 'bottom-right',
    'top', 'bottom', 'left', 'right',
    'left-center', 'right-center',              // accepted aliases (deprecated)
]);
