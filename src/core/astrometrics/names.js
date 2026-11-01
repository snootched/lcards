/**
 * The names an astrometrics config can use (object types, shapes, markers,
 * label styles, placement forms). Free of three.js, so the card schema
 * (main chunk), the config validator and the registries (node) can read them
 * without pulling the runtime in; the runtime modules take their lists from
 * here too.
 *
 * @module core/astrometrics/names
 */

/**
 * Object types; line objects (`ring`, `path`, `beam`, `trail`) read points, so
 * they build second. `system` draws nothing itself: it holds points and
 * objects in units of their own (a star system in km inside a galaxy in ly).
 */
export const OBJECT_TYPES = /** @type {const} */ (['grid', 'volume', 'sphere', 'image', 'glow', 'nebula', 'model', 'ring', 'path', 'beam', 'belt', 'galaxy', 'trail', 'cube', 'system']);

/**
 * Which type for what: the objects docs page's table (doc/cards/astrometrics/objects.md,
 * kept in step by tests/core/astrometrics-names.test.js) and the Studio's add-object
 * gallery (grouped by the Studio's TYPE_GROUPS, astro-studio/starter-gallery.js).
 * @type {readonly { type: typeof OBJECT_TYPES[number], use: string, icon: string }[]}
 */
export const TYPE_GUIDE = [
  { type: 'sphere', use: 'A planet, moon or globe (solid, hides what is behind it, can wear a map)', icon: 'mdi:earth' },
  { type: 'grid', use: 'A wireframe: a sector map, a galaxy disc, a sky dome, a see-through ball, a tube, a gravity well', icon: 'mdi:grid' },
  { type: 'volume', use: 'A territory or region of space (see-through cells: a box, a pie slice or any outline)', icon: 'mdi:cube-outline' },
  { type: 'ring', use: 'An orbit, a range ring, a rim', icon: 'mdi:orbit' },
  { type: 'path', use: 'A route through points, an arched route, the sun\'s track', icon: 'mdi:vector-polyline' },
  { type: 'beam', use: 'A weapon, transporter or sensor beam (a glowing straight line)', icon: 'mdi:flash' },
  { type: 'trail', use: 'Where a moving point has been (a fading line behind a ship or planet)', icon: 'mdi:chart-timeline-variant' },
  { type: 'glow', use: 'A star, a galactic core, a beacon (a soft light)', icon: 'mdi:white-balance-sunny' },
  { type: 'nebula', use: 'Clouds of gas', icon: 'mdi:weather-cloudy' },
  { type: 'belt', use: 'An asteroid belt (a band of rocks round a centre)', icon: 'mdi:dots-circle' },
  { type: 'galaxy', use: 'A spiral galaxy (stars, arms, a bar and dust; the Milky Way by default)', icon: 'mdi:weather-hurricane' },
  { type: 'image', use: 'Your own picture on the plane', icon: 'mdi:image' },
  { type: 'model', use: 'A ship, a station, any 3D model', icon: 'mdi:rocket' },
  { type: 'cube', use: 'A Borg cube (or a plain shaded box)', icon: 'mdi:cube' },
  { type: 'system', use: 'A star system at true scale inside a larger scene (its own points and objects, in units of its own)', icon: 'mdi:white-balance-sunny' }
];

/**
 * Named units, in metres: the scene's `units` and a system's. Real data drops
 * in as published (positions in pc or ly, orbits in AU, sizes in km).
 */
export const UNITS = /** @type {const} */ ({ m: 1, km: 1e3, au: 1.495978707e11, ly: 9.4607304725808e15, pc: 3.0856775814913673e16 });

/** @typedef {keyof typeof UNITS} UnitName */

/**
 * km per unit for a units name; null for none or an unknown one.
 * @param {any} name
 * @returns {number | null}
 */
export const kmPerUnit = (name) => {
  const m = UNITS[/** @type {UnitName} */ (name)];
  return m === undefined ? null : m / 1000;
};
export const UNIT_NAMES = /** @type {UnitName[]} */ (Object.keys(UNITS));

/**
 * A system's scale: how many of its parent's units one of its own is (its
 * `scale`, else its named `units` over the parent's). null when it can not
 * be worked out (named units with a parent that names none).
 * @param {any} system - the system object's config
 * @param {string | undefined} parentUnits
 * @returns {number | null}
 */
export function systemScale(system, parentUnits) {
  const s = Number(system?.scale);
  if (system?.scale !== undefined && Number.isFinite(s) && s > 0) return s;
  const own = UNITS[/** @type {UnitName} */ (system?.units)];
  const parent = UNITS[/** @type {UnitName} */ (parentUnits)];
  if (own === undefined) return system?.units === undefined && system?.scale === undefined ? 1 : null;
  return parent === undefined ? null : own / parent;
}

/**
 * The config with every system's points and objects lifted into the card's
 * own lists, each marked with its system (`_system`), the system's own entry
 * kept without them. Ids are card-wide, so everything that reads points and
 * objects (labels, templates, entity positions, rules, the runtime) reads one
 * flat list. A config without systems comes back as it is.
 * @template T
 * @param {T} config
 * @returns {T}
 */
export function flattenSystems(config) {
  const c = /** @type {any} */ (config);
  const objs = Array.isArray(c?.objects) ? c.objects : [];
  if (!objs.some((/** @type {any} */ o) => o?.type === 'system')) return config;
  const points = Array.isArray(c.points) ? [...c.points] : [];
  /** @type {any[]} */
  const objects = [];
  let n = 0;
  /** @param {any[]} list @param {string | undefined} parent */
  const lift = (list, parent) => {
    for (const o of list) {
      if (!o || typeof o !== 'object' || o.type !== 'system') {
        objects.push(o && typeof o === 'object' && parent !== undefined ? { ...o, _system: parent } : o);
        continue;
      }
      n++;
      const { points: ps, objects: os, ...own } = o;
      const id = own.id === undefined || own.id === null || own.id === '' ? `system#${n}` : String(own.id);
      objects.push({ ...own, id, ...(parent !== undefined ? { _system: parent } : {}) });
      for (const p of Array.isArray(ps) ? ps : []) if (p && typeof p === 'object') points.push({ ...p, _system: id });
      lift(Array.isArray(os) ? os : [], id);
    }
  };
  lift(objs, undefined);
  return { ...c, points, objects };
}

/** Object types built from the effects chunk (`core/astrometrics/effects`) */
export const EFFECT_TYPES = /** @type {const} */ (['nebula', 'cube']);

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
export const VOLUME_SHAPES = /** @type {const} */ (['sector', 'box', 'prism']);

/** `image` shapes */
export const IMAGE_SHAPES = /** @type {const} */ (['plane', 'disc']);

/** Point markers (`none` draws nothing) */
export const MARKERS = /** @type {const} */ (['dot', 'triangle', 'diamond', 'square', 'reticle', 'ship', 'starbase', 'moon_phase', 'none']);

/** Label styles, largest first */
export const LABEL_STYLE_NAMES = /** @type {const} */ (['title', 'major', 'minor', 'tiny']);

/** Sky bodies a point or path can follow */
export const SKY_BODIES = /** @type {const} */ (['sun', 'moon']);

/**
 * Real bodies for `body` (points, spheres, rings) and `orbit` (rings), out
 * from the Sun with each planet's moons after it. ephemeris.js has their
 * data (a test keeps the lists equal).
 */
export const BODY_NAMES = /** @type {const} */ ([
  'sun', 'mercury', 'venus', 'earth', 'moon', 'mars', 'phobos', 'deimos', 'ceres', 'jupiter', 'io', 'europa', 'ganymede', 'callisto',
  'saturn', 'titan', 'uranus', 'neptune', 'triton', 'pluto', 'charon'
]);

/** The keys that place a point; a point takes exactly one */
export const PLACEMENT_FORMS = /** @type {const} */ (['xyz', 'polar', 'latlon', 'altaz', 'sky', 'body', 'at', 'cell']);

/**
 * Whether a config needs the effects chunk (its noise shaders): a nebula,
 * or a `fill_effect`.
 * @param {any} config
 */
export function usesEffects(config) {
  const objects = Array.isArray(config?.objects) ? flattenSystems(config).objects : [];
  return objects.some((o) => o && (/** @type {readonly string[]} */ (EFFECT_TYPES).includes(o.type) || o.fill_effect));
}

/**
 * Whether a config needs the model chunk (the glTF loader): a `model` object.
 * @param {any} config
 */
export function usesModels(config) {
  const objects = Array.isArray(config?.objects) ? flattenSystems(config).objects : [];
  return objects.some((o) => o && /** @type {readonly string[]} */ (MODEL_TYPES).includes(o.type));
}
