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
export const OBJECT_TYPES = /** @type {const} */ (['grid', 'volume', 'sphere', 'image', 'glow', 'nebula', 'ring', 'path', 'beam']);

/** Object types built from the effects chunk (`core/astrometrics/effects`) */
export const EFFECT_TYPES = /** @type {const} */ (['nebula']);

/** `fill_effect` types on spheres and grids (the background presets plasma, fluid, contour-field) */
export const FILL_EFFECTS = /** @type {const} */ (['plasma', 'fluid', 'contour']);

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

/**
 * Whether a config needs the effects chunk (its noise shaders): a nebula,
 * or a `fill_effect`.
 * @param {any} config
 */
export function usesEffects(config) {
  const objects = Array.isArray(config?.objects) ? config.objects : [];
  return objects.some((o) => o && (/** @type {readonly string[]} */ (EFFECT_TYPES).includes(o.type) || o.fill_effect));
}
