/**
 * @fileoverview Astrometrics starters: whole scenes and parts the Studio (and
 * the docs) copy into a card's config. The user owns every line afterwards;
 * nothing refers back to the starter.
 *
 * A starter is a builder:
 *   { id, kind: 'scene' | 'part', title, summary, description, icon, params, build(params), picture? }
 * `build` returns a fragment `{ points?, objects?, views?, camera?, backdrop?, units?, clock? }`.
 * A part's ids are prefixed by `applyStarter` (`prefix` param): every id the
 * fragment defines, and every reference to one inside it, gets `<prefix>_`.
 * References to anything else (a `centre` naming a point of the card) stay.
 *
 * Lazy: imported by the Studio (an editor chunk) only.
 */

import galaxy from './scene-galaxy.js';
import sectorMap from './scene-sector-map.js';
import skyDome from './scene-sky-dome.js';
import solarSystem from './scene-solar-system.js';
import federationMap from './scene-federation-map.js';
import starbaseApproach from './scene-starbase-approach.js';
import deepSpaceNine from './scene-deep-space-nine.js';
import bajoranWormhole from './scene-bajoran-wormhole.js';
import utopiaPlanitia from './scene-utopia-planitia.js';
import borgEncounter from './scene-borg-encounter.js';
import trueScaleSolarSystem from './scene-true-scale-solar-system.js';
import trueScaleDive from './scene-true-scale-dive.js';
import starTrekGalaxy from './scene-star-trek-galaxy.js';
import stMinorPowers from './part-st-minor-powers.js';
import stDeltaPowers from './part-st-delta-powers.js';
import stTranswarp from './part-st-transwarp.js';
import { flattenSystems, kmPerUnit } from '../names.js';
import planet from './part-planet.js';
import asteroidBelt from './part-asteroid-belt.js';
import asteroid from './part-asteroid.js';
import comet from './part-comet.js';
import nebulaField from './part-nebula-field.js';
import wormhole from './part-wormhole.js';
import sectorVolumes from './part-sector-volumes.js';
import starbase from './part-starbase.js';
import badlands from './part-badlands.js';
import badlandsVoyager from './part-badlands-voyager.js';
import nexus from './part-nexus.js';

/**
 * @typedef {Object} StarterParam
 * @property {string} key
 * @property {string} label
 * @property {'text' | 'number' | 'point'} type - point: a point id or [x, y, z]
 * @property {any} default
 * @property {string} [helper]
 * @property {{ value: string, label: string }[]} [options] - text: a dropdown of these
 * @property {boolean} [custom] - with options: other values may be typed too
 * @property {number | ((params: Record<string, any>) => number)} [real] - number: its real size in km, the default
 *   when the part goes where the units are named (a km or au system); a function gets the other params (a model's own size)
 */

/**
 * How `scripts/astro-pictures.mjs` frames a starter's picture (parts have no
 * camera or backdrop of their own). Not used by the card or the Studio.
 * @typedef {Object} StarterPicture
 * @property {Record<string, any>} [camera] - camera keys (target, yaw, tilt, distance)
 * @property {Record<string, any>} [backdrop]
 */

/**
 * @typedef {Object} StarterFragment
 * @property {any[]} [points]
 * @property {any[]} [objects]
 * @property {Record<string, any>} [views]
 * @property {Record<string, any>} [camera] - camera keys other than views (scenes)
 * @property {Record<string, any>} [backdrop]
 * @property {string} [units] - the scene's units (true-scale scenes)
 * @property {Record<string, any>} [clock] - the scene clock (real Solar System bodies)
 */

/**
 * @typedef {Object} Starter
 * @property {string} id
 * @property {'scene' | 'part'} kind
 * @property {string} title
 * @property {string} summary - one line under its picture in the Studio's gallery
 * @property {string} description
 * @property {string} icon
 * @property {StarterParam[]} params
 * @property {string} [scene] - a part made for one scene starter (its id): its numbers only make sense there
 * @property {StarterPicture} [picture]
 * @property {(params: Record<string, any>, ctx: { units: string | null }) => StarterFragment} build - `units`: where it goes, when they are named
 */

/** @type {Starter[]} */
export const STARTERS = [galaxy, sectorMap, skyDome, solarSystem, federationMap, starbaseApproach, deepSpaceNine, bajoranWormhole, utopiaPlanitia, borgEncounter, trueScaleSolarSystem, trueScaleDive, starTrekGalaxy, planet, asteroidBelt, asteroid, comet, nebulaField, badlands, badlandsVoyager, nexus, wormhole, sectorVolumes, starbase, stMinorPowers, stDeltaPowers, stTranswarp];

/** Keys whose string values (or list entries) name a point, object or view */
const REF_KEYS = new Set(['id', 'at', 'object', 'target', 'from', 'to', 'points', 'view', 'light', 'face', 'point']);

const isObj = (/** @type {any} */ v) => !!v && typeof v === 'object' && !Array.isArray(v);

/**
 * A starter's params with the defaults filled in. With named `units` (where
 * the part goes), a param's `real` size in km becomes its default in them.
 * @param {Starter} starter
 * @param {Record<string, any>} [params]
 * @param {string | null} [units]
 */
export function starterParams(starter, params = {}, units = null) {
  /** @type {Record<string, any>} */
  const out = {};
  const km = kmPerUnit(units);
  const typed = (/** @type {StarterParam} */ p) => {
    const v = params[p.key];
    return v === undefined || v === '' || v === null ? undefined : v;
  };
  // real sizes may read the other params (a model's own size), so those fill first
  for (const p of starter.params) if (p.real === undefined || km === null) out[p.key] = convert(p, typed(p) ?? p.default);
  for (const p of starter.params) {
    if (p.real === undefined || km === null) continue;
    const real = typeof p.real === 'function' ? p.real(out) : p.real;
    out[p.key] = convert(p, typed(p) ?? sigFigs(real / km));
  }
  return out;
}

/** @param {StarterParam} p @param {any} value */
const convert = (p, value) => (p.type === 'point' ? parsePointParam(value) : p.type === 'number' ? Number(value) : value);

/**
 * A number to 3 significant figures, so converted sizes read cleanly.
 * @param {number} n
 */
export function sigFigs(n) {
  return Number.isFinite(n) && n !== 0 ? Number(n.toPrecision(3)) : n;
}

/**
 * The units a starter put into a card goes into: the card's, or with
 * `system` (an index into the card's objects) that system's; a system with
 * no units of its own and no `scale` is in its parent's. null when not named.
 * @param {Record<string, any>} config
 * @param {number} [system]
 * @returns {string | null}
 */
export function targetUnits(config, system) {
  if (system === undefined || system < 0) return config.units ?? null;
  const sys = Array.isArray(config.objects) ? config.objects[system] : undefined;
  if (sys?.units !== undefined) return sys.units;
  return sys?.scale === undefined ? config.units ?? null : null;
}

/** A starter's fragment, with the target's units for its sizes @param {Starter} starter @param {Record<string, any>} params @param {string | null} units */
const buildStarter = (starter, params, units) => starter.build(starterParams(starter, params, units), { units: kmPerUnit(units) === null ? null : units });

/**
 * A `point` param's text as the config wants it: three numbers become
 * [x, y, z], anything else is a point id.
 * @param {any} value
 * @returns {string | number[]}
 */
export function parsePointParam(value) {
  if (Array.isArray(value)) return value.map(Number);
  const text = String(value ?? '').trim();
  const nums = text.replace(/^\[|\]$/g, '').split(/[\s,]+/).filter(Boolean).map(Number);
  return nums.length === 3 && nums.every(Number.isFinite) ? nums : text;
}

/**
 * Every id a fragment defines: point and object ids, view names.
 * @param {StarterFragment} frag
 */
export function fragmentIds(frag) {
  // ids inside a system are card-wide too
  frag = /** @type {StarterFragment} */ (flattenSystems(frag));
  return {
    points: (frag.points ?? []).map((p) => p?.id).filter((id) => id !== undefined).map(String),
    objects: (frag.objects ?? []).map((o) => o?.id).filter((id) => id !== undefined).map(String),
    views: Object.keys(frag.views ?? {})
  };
}

/**
 * Prefix every id the fragment defines, and every reference to one in it.
 * @param {StarterFragment} frag
 * @param {string} prefix
 * @returns {StarterFragment}
 */
export function prefixFragment(frag, prefix) {
  if (!prefix) return frag;
  const ids = fragmentIds(frag);
  const own = new Set([...ids.points, ...ids.objects, ...ids.views]);
  const name = (/** @type {string} */ id) => `${prefix}_${id}`;
  /** @param {any} v @param {string | null} key @returns {any} */
  const walk = (v, key) => {
    if (typeof v === 'string') return key && REF_KEYS.has(key) && own.has(v) ? name(v) : v;
    if (Array.isArray(v)) return v.map((x) => walk(x, key === 'points' ? key : null));
    if (!isObj(v)) return v;
    return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, walk(x, k)]));
  };
  /** @type {StarterFragment} */
  const out = { ...frag };
  if (frag.points) out.points = walk(frag.points, null);
  if (frag.objects) out.objects = walk(frag.objects, null);
  if (frag.views) out.views = Object.fromEntries(Object.entries(frag.views).map(([k, v]) => [name(k), walk(v, null)]));
  return out;
}

/**
 * The ids a card config already uses.
 * @param {Record<string, any>} config
 */
function configIds(config) {
  config = flattenSystems(config);
  const points = Array.isArray(config.points) ? config.points : [];
  const objects = Array.isArray(config.objects) ? config.objects : [];
  return {
    points: new Set(points.map((p) => p?.id).filter((id) => id !== undefined).map(String)),
    objects: new Set(objects.map((o) => o?.id).filter((id) => id !== undefined).map(String)),
    views: new Set(Object.keys(isObj(config.camera?.views) ? config.camera.views : {}))
  };
}

/** Whether a config has a scene in it (points, objects or views) */
export function hasScene(/** @type {Record<string, any>} */ config) {
  const ids = configIds(config);
  return ids.points.size > 0 || (Array.isArray(config.objects) && config.objects.length > 0) || ids.views.size > 0;
}

/** Card keys a scene starter replaces (everything else, such as type, id, height and title, stays) */
const SCENE_KEYS = ['points', 'objects', 'camera', 'backdrop', 'labels', 'background_animation', 'units', 'clock'];

/**
 * The units a starter is in when they differ from where it goes (the card's
 * scene, or with `system` that system), so it cannot merge (every number in
 * it would mean something else), else null. An empty scene or system takes
 * any units.
 * @param {Record<string, any>} config
 * @param {Starter} starter
 * @param {Record<string, any>} [params]
 * @param {number} [system] - an index into the card's objects
 * @returns {string | null}
 */
export function unitsClash(config, starter, params = {}, system) {
  const units = targetUnits(config, system);
  const frag = buildStarter(starter, params, units);
  return frag.units !== undefined && units !== frag.units && hasScene(targetOf(config, system)) ? frag.units : null;
}

/**
 * The lists a starter goes into: the card, or a system of it.
 * @param {Record<string, any>} config
 * @param {number} [system]
 * @returns {Record<string, any>}
 */
const targetOf = (config, system) => (system === undefined || system < 0 ? config : config.objects?.[system] ?? {});

/**
 * Put a starter into a card config.
 * Scenes replace the scene (`mode: 'replace'`, the default for scenes) or
 * merge into it; parts add (the default) or, with `mode: 'replace'`, start
 * the scene over on their own. With `system` (an index into the card's
 * objects, a part only) the points and objects go into that system, sized
 * in its units; views stay the card's. Any id the starter would add that
 * the config already uses (anywhere in the card) is refused, naming the clash.
 * @param {Record<string, any>} config
 * @param {Starter} starter
 * @param {Record<string, any>} [params]
 * @param {{ mode?: 'replace' | 'merge', system?: number }} [opts]
 * @returns {{ config: Record<string, any>, added: StarterFragment, error?: undefined } | { error: string, config?: undefined, added?: undefined }}
 */
export function applyStarter(config, starter, params = {}, { mode, system } = {}) {
  // a scene replaces unless told to merge; a part adds unless told to replace (it then starts the scene over on its own)
  const replace = (mode ?? (starter.kind === 'scene' ? 'replace' : 'merge')) === 'replace';
  const into = system !== undefined && system >= 0 ? system : undefined;
  if (into !== undefined) {
    if (starter.kind !== 'part' || replace) return { error: 'Only a part can go into a system, added next to what is there.' };
    if (config.objects?.[into]?.type !== 'system') return { error: `Object ${into} is not a system.` };
  }

  /** @type {Record<string, any>} */
  const base = { ...config };
  if (replace) for (const k of SCENE_KEYS) delete base[k];
  const units = targetUnits(base, into);
  const filled = starterParams(starter, params, units);
  let frag = starter.build(filled, { units: kmPerUnit(units) === null ? null : units });
  if (starter.kind === 'part') frag = prefixFragment(frag, String(filled.prefix ?? '').trim());

  // a scene in other units cannot be merged: every number in it would mean something else
  const target = targetOf(base, into);
  if (frag.units !== undefined && !replace && units !== frag.units && hasScene(target)) {
    const where = into === undefined ? 'the card' : 'this system';
    const fix = into === undefined ? 'replace the scene instead' : 'add it to the scene instead';
    return { error: `This ${starter.kind} is in ${frag.units} and ${where} is in ${units ?? 'scene units'}: ${fix}.` };
  }

  const taken = configIds(base);
  const ids = fragmentIds(frag);
  const clashes = [
    ...ids.points.filter((id) => taken.points.has(id)).map((id) => `point ${id}`),
    ...ids.objects.filter((id) => taken.objects.has(id)).map((id) => `object ${id}`),
    ...ids.views.filter((id) => taken.views.has(id)).map((id) => `view ${id}`)
  ];
  if (clashes.length) {
    const hint = starter.kind === 'part' ? ' Choose another prefix.' : ' Replace the scene, or rename them first.';
    return { error: `Already in this card: ${clashes.join(', ')}.${hint}` };
  }

  const next = base;
  if (into !== undefined) {
    const sys = { ...base.objects[into] };
    if (frag.points?.length) sys.points = [...(Array.isArray(sys.points) ? sys.points : []), ...frag.points];
    if (frag.objects?.length) sys.objects = [...(Array.isArray(sys.objects) ? sys.objects : []), ...frag.objects];
    // an empty system takes a part's units (they replace a scale)
    if (frag.units !== undefined && units !== frag.units) {
      sys.units = frag.units;
      delete sys.scale;
    }
    next.objects = base.objects.map((/** @type {any} */ o, /** @type {number} */ i) => (i === into ? sys : o));
  } else {
    if (frag.points?.length) next.points = [...(Array.isArray(base.points) ? base.points : []), ...frag.points];
    if (frag.objects?.length) next.objects = [...(Array.isArray(base.objects) ? base.objects : []), ...frag.objects];
  }
  if (frag.views || frag.camera) {
    const camera = { ...(isObj(base.camera) ? base.camera : {}) };
    // a merged scene's camera keys never override the card's own
    if (frag.camera) for (const [k, v] of Object.entries(frag.camera)) if (replace || camera[k] === undefined) camera[k] = v;
    if (frag.views) camera.views = { ...(isObj(camera.views) ? camera.views : {}), ...frag.views };
    next.camera = camera;
  }
  if (frag.backdrop && (replace || next.backdrop === undefined)) next.backdrop = frag.backdrop;
  if (frag.units !== undefined && into === undefined) next.units = frag.units;
  // a merged scene keeps the card's own clock
  if (frag.clock && (replace || next.clock === undefined)) next.clock = frag.clock;
  return { config: next, added: frag };
}
