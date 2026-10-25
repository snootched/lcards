/**
 * The names an astrometrics config can use (object types, shapes, markers,
 * label styles, placement forms). Free of three.js, so the card schema
 * (main chunk), the config validator and the registries (node) can read them
 * without pulling the runtime in; the runtime modules take their lists from
 * here too.
 *
 * @module core/astrometrics/names
 */

/** Object types; line objects (`ring`, `path`, `beam`) read points, so they build second */
export const OBJECT_TYPES = /** @type {const} */ (['grid', 'volume', 'sphere', 'image', 'glow', 'ring', 'path', 'beam']);

/** `grid` shapes */
export const GRID_SHAPES = /** @type {const} */ (['plane', 'disc', 'dome', 'sphere', 'cylinder']);

/** `grid` line patterns (the background grid effect's names) */
export const GRID_PATTERNS = /** @type {const} */ (['both', 'horizontal', 'vertical', 'diagonal', 'hexagonal', 'dots', 'polar']);

/** `volume` shapes */
export const VOLUME_SHAPES = /** @type {const} */ (['sector', 'box']);

/** `image` shapes */
export const IMAGE_SHAPES = /** @type {const} */ (['plane', 'disc']);

/** Point markers (`none` draws nothing) */
export const MARKERS = /** @type {const} */ (['dot', 'triangle', 'diamond', 'square', 'reticle', 'moon_phase', 'none']);

/** Label styles, largest first */
export const LABEL_STYLE_NAMES = /** @type {const} */ (['title', 'major', 'minor', 'tiny']);

/** Sky bodies a point or path can follow */
export const SKY_BODIES = /** @type {const} */ (['sun', 'moon']);

/** The keys that place a point; a point takes exactly one */
export const PLACEMENT_FORMS = /** @type {const} */ (['xyz', 'polar', 'latlon', 'altaz', 'sky', 'at', 'cell']);
