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
export const OBJECT_TYPES = /** @type {const} */ (['grid', 'volume', 'sphere', 'image', 'glow', 'nebula', 'model', 'ring', 'path', 'beam']);

/**
 * Which type for what: the objects docs page's table (doc/cards/astrometrics/objects.md,
 * kept in step by tests/core/astrometrics-names.test.js) and the Studio's type picker.
 * @type {readonly { type: typeof OBJECT_TYPES[number], use: string, icon: string }[]}
 */
export const TYPE_GUIDE = [
  { type: 'sphere', use: 'A planet, moon or globe (solid, hides what is behind it, can wear a map)', icon: 'mdi:earth' },
  { type: 'grid', use: 'A wireframe: a sector map, a galaxy disc, a sky dome, a see-through ball, a tube, a gravity well', icon: 'mdi:grid' },
  { type: 'volume', use: 'A territory or region of space (a see-through box of cells)', icon: 'mdi:cube-outline' },
  { type: 'ring', use: 'An orbit, a range ring, a rim', icon: 'mdi:orbit' },
  { type: 'path', use: 'A route through points, an arched route, the sun\'s track', icon: 'mdi:vector-polyline' },
  { type: 'beam', use: 'A weapon, transporter or sensor beam (a glowing straight line)', icon: 'mdi:flash' },
  { type: 'glow', use: 'A star, a galactic core, a beacon (a soft light)', icon: 'mdi:white-balance-sunny' },
  { type: 'nebula', use: 'Clouds of gas', icon: 'mdi:weather-cloudy' },
  { type: 'image', use: 'Your own picture on the plane', icon: 'mdi:image' },
  { type: 'model', use: 'A ship, a station, any 3D model', icon: 'mdi:rocket' }
];

/** Object types built from the effects chunk (`core/astrometrics/effects`) */
export const EFFECT_TYPES = /** @type {const} */ (['nebula']);

/** Object types built from the model chunk (`core/astrometrics/model`) */
export const MODEL_TYPES = /** @type {const} */ (['model']);

/** `model` looks: the hologram shader, or the file's own materials */
export const MODEL_MATERIALS = /** @type {const} */ (['hologram', 'original']);

/** `fill_effect` types on spheres and grids (the background presets plasma, fluid, contour-field; bands: latitude belts) */
export const FILL_EFFECTS = /** @type {const} */ (['plasma', 'fluid', 'contour', 'bands']);

/** `fill_effect` presets: named starting points for planet types (`effects/fills.js` FILL_PRESETS) */
export const FILL_PRESETS = /** @type {const} */ (['gas_giant', 'ringed_giant', 'ice_giant', 'storm_giant', 'clouds', 'lava', 'ice', 'rocky', 'terran']);

/** `grid` shapes */
export const GRID_SHAPES = /** @type {const} */ (['plane', 'disc', 'dome', 'sphere', 'cylinder', 'well']);

/** Grid shapes deformed round their y axis (the others are flat) */
export const AXIAL_GRID_SHAPES = /** @type {const} */ (['dome', 'sphere', 'cylinder', 'well']);

/** `well_shape` names (the background grid's well shapes, `grid-surface-model.js` WELL_SHAPES) */
export const WELL_SHAPE_NAMES = /** @type {const} */ (['trumpet', 'cone', 'bowl', 'wormhole']);

/** `deform:` types on a grid */
export const DEFORM_TYPES = /** @type {const} */ (['wobble', 'bend', 'twist', 'noise']);

/** `deform` bend motions */
export const BEND_MOTIONS = /** @type {const} */ (['sway', 'circle', 'none']);

/** Where a bend or twist starts (stays put) */
export const DEFORM_ANCHORS = /** @type {const} */ (['bottom', 'top', 'middle']);

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

/**
 * Whether a config needs the model chunk (the glTF loader): a `model` object.
 * @param {any} config
 */
export function usesModels(config) {
  const objects = Array.isArray(config?.objects) ? config.objects : [];
  return objects.some((o) => o && /** @type {readonly string[]} */ (MODEL_TYPES).includes(o.type));
}
