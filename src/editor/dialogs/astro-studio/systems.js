/**
 * @fileoverview The Astrometrics Studio's star systems (pure, unit tested).
 *
 * The Points and Objects tabs edit one list at a time: the scene's own, or
 * a system's (`type: system` in the scene's objects, opened from its row).
 * A scope is the system's index in the scene's objects, -1 for the scene.
 * Ids stay card-wide: the scene names an object without an id `type#n`
 * counting every object in the flattened order (a system's contents right
 * after it), and a system without one `system#n`, as the runtime does.
 */

/** The scene's own lists */
export const SCENE_SCOPE = -1;

const isObj = (/** @type {any} */ v) => !!v && typeof v === 'object' && !Array.isArray(v);
const blank = (/** @type {any} */ id) => id === undefined || id === null || id === '';

/**
 * The scene's objects (never null).
 * @param {any} config
 * @returns {any[]}
 */
const rootObjects = (config) => (Array.isArray(config?.objects) ? config.objects : []);

/**
 * The system a scope opens, or null for the scene (or a scope that is not a system any more).
 * @param {any} config
 * @param {number} scope
 */
export function scopeSystem(config, scope) {
  const o = scope >= 0 ? rootObjects(config)[scope] : undefined;
  return isObj(o) && o.type === 'system' ? o : null;
}

/**
 * A scope that still opens a system, else the scene's.
 * @param {any} config
 * @param {number} scope
 */
export function validScope(config, scope) {
  return scopeSystem(config, scope) ? scope : SCENE_SCOPE;
}

/**
 * The `points` or `objects` list a scope edits (never null).
 * @param {any} config
 * @param {number} scope
 * @param {'points' | 'objects'} key
 * @returns {any[]}
 */
export function scopedList(config, scope, key) {
  const owner = scopeSystem(config, scope) ?? config;
  return Array.isArray(owner?.[key]) ? owner[key] : [];
}

/**
 * The config with a scope's list replaced. An empty list is dropped (the
 * scene keeps `points: []`, as the Studio always has).
 * @param {any} config
 * @param {number} scope
 * @param {'points' | 'objects'} key
 * @param {any[] | undefined} list
 */
export function setScopedList(config, scope, key, list) {
  /** @param {any} owner @param {boolean} keepEmpty */
  const put = (owner, keepEmpty) => {
    const next = { ...owner };
    if (!list || (!list.length && !keepEmpty)) delete next[key];
    else next[key] = list;
    return next;
  };
  const sys = scopeSystem(config, scope);
  if (!sys) return put(config, key === 'points');
  return { ...config, objects: rootObjects(config).map((o, i) => (i === scope ? put(sys, false) : o)) };
}

/**
 * Every object's id as the scene names it: the scene's by index, and each
 * system's own by its scope.
 * @param {any} config
 * @returns {{ scene: string[], systems: Map<number, string[]> }}
 */
export function sceneObjectIds(config) {
  /** @type {Record<string, number>} */
  const counts = {};
  let systems = 0;
  /** @param {any} o */
  const name = (o) => {
    if (o?.type === 'system') {
      systems++;
      return blank(o.id) ? `system#${systems}` : String(o.id);
    }
    const type = String(o?.type);
    counts[type] = (counts[type] ?? 0) + 1;
    return blank(o?.id) ? `${type}#${counts[type]}` : String(o.id);
  };
  const scene = [];
  /** @type {Map<number, string[]>} */
  const inside = new Map();
  rootObjects(config).forEach((o, i) => {
    scene.push(name(o));
    if (isObj(o) && o.type === 'system') inside.set(i, (Array.isArray(o.objects) ? o.objects : []).map(name));
  });
  return { scene, systems: inside };
}

/**
 * The ids of a scope's objects as the scene names them.
 * @param {any} config
 * @param {number} scope
 * @returns {string[]}
 */
export function scopedObjectIds(config, scope) {
  const ids = sceneObjectIds(config);
  return scopeSystem(config, scope) ? (ids.systems.get(scope) ?? []) : ids.scene;
}

/**
 * Where a point is: its scope, or null when no list has it.
 * @param {any} config
 * @param {string} id
 * @returns {number | null}
 */
export function pointScope(config, id) {
  const has = (/** @type {any} */ list) => Array.isArray(list) && list.some((p) => p && String(p.id) === id);
  if (has(config?.points)) return SCENE_SCOPE;
  const i = rootObjects(config).findIndex((o) => isObj(o) && o.type === 'system' && has(o.points));
  return i >= 0 ? i : null;
}

/**
 * Where an object the scene names is: its scope and index there, or null.
 * @param {any} config
 * @param {string} id
 * @returns {{ scope: number, index: number } | null}
 */
export function objectScope(config, id) {
  const ids = sceneObjectIds(config);
  const at = ids.scene.indexOf(id);
  if (at >= 0) return { scope: SCENE_SCOPE, index: at };
  for (const [scope, list] of ids.systems) {
    const index = list.indexOf(id);
    if (index >= 0) return { scope, index };
  }
  return null;
}

/**
 * Every point id on the card (the scene's and every system's): `at`
 * choices and new ids are card-wide.
 * @param {any} config
 * @returns {string[]}
 */
export function allPointIds(config) {
  const lists = [config?.points, ...rootObjects(config).filter((o) => isObj(o) && o.type === 'system').map((o) => o.points)];
  return lists.flatMap((l) => (Array.isArray(l) ? l : [])).map((p) => p?.id).filter((id) => !blank(id)).map(String);
}

/**
 * A config for the points editor in a scope: the scope's points, and every
 * object on the card to stand on (ids are card-wide).
 * @param {any} config
 * @param {number} scope
 */
export function pointsEditorConfig(config, scope) {
  if (!scopeSystem(config, scope)) return config;
  const objects = rootObjects(config).flatMap((o) => (isObj(o) && o.type === 'system' ? [o, ...(Array.isArray(o.objects) ? o.objects : [])] : [o]));
  return { ...config, points: scopedList(config, scope, 'points'), objects };
}

/**
 * Every object id on the card as the scene names them (new ids are card-wide).
 * @param {any} config
 * @returns {string[]}
 */
export function allObjectIds(config) {
  const ids = sceneObjectIds(config);
  return [...ids.scene, ...[...ids.systems.values()].flat()];
}
