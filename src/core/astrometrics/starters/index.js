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
import utopiaPlanitia from './scene-utopia-planitia.js';
import borgEncounter from './scene-borg-encounter.js';
import trueScaleSolarSystem from './scene-true-scale-solar-system.js';
import trueScaleDive from './scene-true-scale-dive.js';
import starTrekGalaxy from './scene-star-trek-galaxy.js';
import stMinorPowers from './part-st-minor-powers.js';
import stDeltaPowers from './part-st-delta-powers.js';
import stTranswarp from './part-st-transwarp.js';
import { flattenSystems } from '../names.js';
import planet from './part-planet.js';
import asteroidBelt from './part-asteroid-belt.js';
import nebulaField from './part-nebula-field.js';
import sectorVolumes from './part-sector-volumes.js';
import starbase from './part-starbase.js';

/**
 * @typedef {Object} StarterParam
 * @property {string} key
 * @property {string} label
 * @property {'text' | 'number' | 'point'} type - point: a point id or [x, y, z]
 * @property {any} default
 * @property {string} [helper]
 * @property {{ value: string, label: string }[]} [options] - text: a dropdown of these
 * @property {boolean} [custom] - with options: other values may be typed too
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
 * @property {(params: Record<string, any>) => StarterFragment} build
 */

/** @type {Starter[]} */
export const STARTERS = [galaxy, sectorMap, skyDome, solarSystem, federationMap, starbaseApproach, deepSpaceNine, utopiaPlanitia, borgEncounter, trueScaleSolarSystem, trueScaleDive, starTrekGalaxy, planet, asteroidBelt, nebulaField, sectorVolumes, starbase, stMinorPowers, stDeltaPowers, stTranswarp];

/** Keys whose string values (or list entries) name a point, object or view */
const REF_KEYS = new Set(['id', 'at', 'object', 'target', 'from', 'to', 'points', 'view']);

const isObj = (/** @type {any} */ v) => !!v && typeof v === 'object' && !Array.isArray(v);

/**
 * A starter's params with the defaults filled in.
 * @param {Starter} starter
 * @param {Record<string, any>} [params]
 */
export function starterParams(starter, params = {}) {
  /** @type {Record<string, any>} */
  const out = {};
  for (const p of starter.params) {
    const v = params[p.key];
    const value = v === undefined || v === '' || v === null ? p.default : v;
    out[p.key] = p.type === 'point' ? parsePointParam(value) : p.type === 'number' ? Number(value) : value;
  }
  return out;
}

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
 * The units a starter is in when they differ from a card's scene, so it
 * cannot merge (every number in it would mean something else), else null.
 * A card with no scene takes any units.
 * @param {Record<string, any>} config
 * @param {Starter} starter
 * @param {Record<string, any>} [params]
 * @returns {string | null}
 */
export function unitsClash(config, starter, params = {}) {
  const frag = starter.build(starterParams(starter, params));
  return frag.units !== undefined && (config.units ?? null) !== frag.units && hasScene(config) ? frag.units : null;
}

/**
 * Put a starter into a card config.
 * Scenes replace the scene (`mode: 'replace'`, the default for scenes) or
 * merge into it; parts add (the default) or, with `mode: 'replace'`, start
 * the scene over on their own. Any id the starter would add that the
 * config already uses is refused, naming the clash.
 * @param {Record<string, any>} config
 * @param {Starter} starter
 * @param {Record<string, any>} [params]
 * @param {{ mode?: 'replace' | 'merge' }} [opts]
 * @returns {{ config: Record<string, any>, added: StarterFragment, error?: undefined } | { error: string, config?: undefined, added?: undefined }}
 */
export function applyStarter(config, starter, params = {}, { mode } = {}) {
  const filled = starterParams(starter, params);
  let frag = starter.build(filled);
  if (starter.kind === 'part') frag = prefixFragment(frag, String(filled.prefix ?? '').trim());
  // a scene replaces unless told to merge; a part adds unless told to replace (it then starts the scene over on its own)
  const replace = (mode ?? (starter.kind === 'scene' ? 'replace' : 'merge')) === 'replace';

  /** @type {Record<string, any>} */
  const base = { ...config };
  if (replace) for (const k of SCENE_KEYS) delete base[k];

  // a scene in other units cannot be merged: every number in it would mean something else
  if (frag.units !== undefined && !replace && (base.units ?? null) !== frag.units && hasScene(base)) {
    return { error: `This ${starter.kind} is in ${frag.units} and the card is in ${base.units ?? 'scene units'}: replace the scene instead.` };
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
  if (frag.points?.length) next.points = [...(Array.isArray(base.points) ? base.points : []), ...frag.points];
  if (frag.objects?.length) next.objects = [...(Array.isArray(base.objects) ? base.objects : []), ...frag.objects];
  if (frag.views || frag.camera) {
    const camera = { ...(isObj(base.camera) ? base.camera : {}) };
    // a merged scene's camera keys never override the card's own
    if (frag.camera) for (const [k, v] of Object.entries(frag.camera)) if (replace || camera[k] === undefined) camera[k] = v;
    if (frag.views) camera.views = { ...(isObj(camera.views) ? camera.views : {}), ...frag.views };
    next.camera = camera;
  }
  if (frag.backdrop && (replace || next.backdrop === undefined)) next.backdrop = frag.backdrop;
  if (frag.units !== undefined) next.units = frag.units;
  // a merged scene keeps the card's own clock
  if (frag.clock && (replace || next.clock === undefined)) next.clock = frag.clock;
  return { config: next, added: frag };
}
