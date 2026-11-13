/**
 * The placement system: named points in scene space, declared once and
 * referenced by id from labels, markers, path ends, ring centres, object
 * positions and camera targets. Points are resolved once per frame (after
 * `scene.updateMatrixWorld()`), so a point on a moving or spinning object
 * follows it.
 *
 * One direction convention everywhere: **0 degrees is north (-z, away from
 * the default camera), clockwise seen from above**, so east is +x. Forms:
 *
 *   xyz: [x, y, z]                              scene units (object-local with `object`)
 *   polar: [r, bearing], alt                    on the scene plane (object-local with `object`)
 *   latlon: [lat, lon], object: <sphere>, alt   on a sphere or globe; lon 0 faces +z
 *                                               (the default camera), east to the right
 *   altaz: [azimuth, altitude], object: <dome>, alt   on a sky dome
 *   sky: sun | moon, object: <dome>, alt        the body's altaz now (see sky.js)
 *   body: mars, center?: <body>                 where a real Sun, planet or moon is at the
 *                                               scene clock's date (ephemeris.js), the Sun
 *                                               (or center) at the frame's origin, in its units
 *   at: <point>                                 another point
 *   cell: AF3, object: <grid>                   the centre of a lettered grid cell
 *   satellite: iss, object: <earth sphere>      a real Earth satellite at the scene clock's
 *                                               date (satellites.js: shipped elements, or live
 *                                               fixes from the point's entity), its height in
 *                                               the sphere's radii (`heights: real | diagram`)
 *
 * `part: <node name>` with `object: <model>` puts the point on that part of
 * a model (its origin, `xyz` an offset in the part's own space), so it
 * follows the part when it moves (an animation). Points on a model wait
 * (no position) until its file is in.
 *
 * Key names avoid YAML 1.1 booleans (on, off, y, n, yes, no): Home
 * Assistant's code editor reads `on: sky` as `true: sky`.
 *
 * `offset: [x, y, z]` (scene units) is added to any form. A reference that
 * loops back on itself is refused (null, logged once).
 *
 * A point inside a system (`_system`, frames.js) is in the system's own
 * units: its forms and offset are local to the system's group, so they stay
 * exact whichever frame the camera works in.
 *
 * @module core/astrometrics/placements
 */
import { Vector3 } from 'three';
import { lcardsLog } from '../../utils/lcards-logging.js';
import { position, toScene, BODIES, AU_KM } from './ephemeris.js';
import { kmPerUnit } from './names.js';
import {
  satelliteData, prepareOrbit, positionAt, orbitAt, toEarthFixed, fromEarthFixed, drawnHeight,
  orbitFromFixes, anomalyShiftTo, EARTH_RADIUS,
} from './satellites.js';

/** How long a satellite's dot takes to ease onto a new live fix, ms */
const FIX_EASE_MS = 2000;
/** Height assumed for a live satellite with no shipped data until its second fix, km */
const LIVE_GUESS_KM = 400;

const DEG = Math.PI / 180;

/** @param {unknown} v */
const isSet = (v) => v !== undefined && v !== null && v !== '';

/**
 * @typedef {Object} SatelliteState
 * @property {string} key - the point's `satellite` value
 * @property {import('./satellites.js').Orbit | null} base - from the shipped elements
 * @property {import('./satellites.js').Orbit | null} live - from the last two live fixes (no shipped data)
 * @property {{ p: [number, number, number], ms: number }[]} fixes - the last two, inertial
 * @property {{ from: number, to: number, wall: number }} shift - eased shift along the orbit, radians
 * @property {{ lat: number, lon: number } | null} lastFix
 */

/**
 * A bearing and a horizontal distance as x, z (north = -z, clockwise).
 * @param {number} r
 * @param {number} bearing - degrees
 * @returns {[number, number]}
 */
export function bearingXZ(r, bearing) {
  return [r * Math.sin(bearing * DEG), -r * Math.cos(bearing * DEG)];
}

/**
 * Azimuth / altitude on a dome of radius R (local coordinates).
 * @param {number} azimuth - degrees clockwise from north
 * @param {number} altitude - degrees
 * @param {number} R
 * @param {Vector3} [out]
 */
export function altazToLocal(azimuth, altitude, R, out = new Vector3()) {
  const c = Math.cos(altitude * DEG);
  return out.set(R * c * Math.sin(azimuth * DEG), R * Math.sin(altitude * DEG), -R * c * Math.cos(azimuth * DEG));
}

/**
 * Latitude / longitude on a sphere of radius R (local coordinates).
 * @param {number} lat
 * @param {number} lon
 * @param {number} R
 * @param {Vector3} [out]
 */
export function latlonToLocal(lat, lon, R, out = new Vector3()) {
  const c = Math.cos(lat * DEG);
  return out.set(R * c * Math.sin(lon * DEG), R * Math.sin(lat * DEG), R * c * Math.cos(lon * DEG));
}

/**
 * Spreadsheet-style column letters to an index: A = 0, Z = 25, AA = 26.
 * @param {string} letters
 * @returns {number} -1 when not letters
 */
export function lettersToIndex(letters) {
  if (!/^[A-Z]+$/i.test(letters)) return -1;
  let n = 0;
  for (const ch of letters.toUpperCase()) n = n * 26 + (ch.charCodeAt(0) - 64);
  return n - 1;
}

/**
 * @param {number} index - 0 = A
 * @returns {string}
 */
export function indexToLetters(index) {
  let n = index + 1;
  let s = '';
  while (n > 0) {
    const r = (n - 1) % 26;
    s = String.fromCharCode(65 + r) + s;
    n = Math.floor((n - 1) / 26);
  }
  return s;
}

/**
 * A cell code (`AF3`) as letters and a number.
 * @param {string} code
 * @returns {{ col: string, row: number } | null}
 */
export function parseCell(code) {
  const m = /^([A-Z]+)(-?\d+)$/i.exec(String(code ?? '').trim());
  return m ? { col: m[1].toUpperCase(), row: Number(m[2]) } : null;
}

/**
 * What a placement can stand on: the object's three.js node, and what its
 * forms need (a radius for latlon/altaz, cell centres for a lettered grid).
 * @typedef {Object} PlacementHost
 * @property {import('three').Object3D} node
 * @property {number} [radius]
 * @property {(code: string) => Vector3 | null} [cellPoint] - local centre of a cell
 * @property {boolean} [moving] - spins or moves (points on it change every frame)
 * @property {(local: Vector3) => Vector3} [warp] - a deformed grid: moves a local position with the surface (in place)
 * @property {() => boolean} [ready] - false while it loads: points on it have no position yet
 * @property {(name: string) => (import('three').Object3D | null)} [partNode] - a named part (a model's glTF node)
 */

/**
 * @typedef {Object} PointDef
 * @property {string} id
 * @property {number[]} [xyz]
 * @property {number[]} [polar]
 * @property {number[]} [latlon]
 * @property {number[]} [altaz]
 * @property {'sun' | 'moon'} [sky]
 * @property {string} [body] - a real body (ephemeris.js BODY_NAMES)
 * @property {string} [center] - with body: measured from this body, not the Sun
 * @property {string | number} [satellite] - a real Earth satellite (satellites.js): a built-in name or NORAD id
 * @property {'real' | 'diagram'} [heights] - satellite: its height at real scale, or lifted for a diagram
 * @property {string} [entity] - satellite: live fixes from this entity
 * @property {string} [at]
 * @property {string} [cell]
 * @property {string} [object]
 * @property {string} [part]
 * @property {number} [alt]
 * @property {number[]} [offset]
 * @property {boolean} [_bound] - its position comes from an entity (setPosition)
 * @property {string} [_system] - the system it is in (flattenSystems)
 */

/** Placement forms that can take their numbers from an entity (`{ entity, ... }` instead of a tuple) */
export const BINDABLE_FORMS = /** @type {const} */ (['xyz', 'polar', 'latlon', 'altaz']);

/**
 * The entity-bound form of a point, if any: the form key and its binding
 * (`{ entity?, attributes?, latitude?, ... }`).
 * @param {any} d - a point config
 * @returns {{ form: typeof BINDABLE_FORMS[number], binding: Record<string, any> } | null}
 */
export function pointBinding(d) {
  for (const form of BINDABLE_FORMS) {
    const v = d?.[form];
    if (v && typeof v === 'object' && !Array.isArray(v)) return { form, binding: v };
  }
  return null;
}

export class Placements {
  /**
   * @param {Object} opts
   * @param {PointDef[]} [opts.points]
   * @param {Map<string, PlacementHost>} [opts.hosts] - objects by id
   * @param {() => (import('./sky.js').SkyState | null)} [opts.sky]
   * @param {(system: string | undefined) => (import('three').Object3D | null)} [opts.frame] - a frame's group (frames.js);
   *   without it every point is in scene units
   * @param {() => number} [opts.date] - the scene clock's date (ms), for body points
   * @param {(system: string | undefined) => (string | undefined)} [opts.units] - a frame's `units` name (body points)
   */
  constructor({ points = [], hosts = new Map(), sky = () => null, frame = () => null, date = () => Date.now(), units = () => undefined } = {}) {
    /** @type {Map<string, PointDef>} */
    this.defs = new Map();
    for (const p of points) if (p?.id) this.defs.set(String(p.id), p);
    this.hosts = hosts;
    this.sky = sky;
    this.frame = frame;
    this.date = date;
    this.units = units;
    /** @type {Map<string, Vector3 | null>} */
    this._cache = new Map();
    /** @type {Set<string>} ids already warned about */
    this._warned = new Set();
    /** @type {Map<string, PointDef>} the configs as given (bound forms included) */
    this.configs = new Map(this.defs);
    /** @type {Map<string, SatelliteState>} satellite points: their orbit and live fixes */
    this._sats = new Map();
  }

  /**
   * Replace a point's config (a rule patch moved it). Entity positions set
   * before are dropped: the caller sets them again.
   * @param {string} id
   * @param {PointDef} def
   */
  replaceDef(id, def) {
    this.defs.set(id, { ...def, id });
    this.configs.set(id, { ...def, id });
    this._sats.delete(id);
    this._cache.clear();
  }

  /**
   * Set a point's position form from outside (an entity binding's numbers):
   * no rebuild, the next frame reads it. null clears it (the point has no
   * position until the next value).
   * @param {string} id
   * @param {typeof BINDABLE_FORMS[number]} form
   * @param {number[] | null} value
   * @returns {boolean} false for an unknown point
   */
  setPosition(id, form, value) {
    const d = this.defs.get(id);
    if (!d) return false;
    if (/** @type {string} */ (form) === 'fix') {
      if (value) this._fix(d, value);
      return true;
    }
    this.defs.set(id, { ...d, [form]: value ?? undefined, _bound: true });
    this._cache.clear();
    return true;
  }

  /** @param {string} id */
  has(id) {
    return this.defs.has(id);
  }

  /** Forget this frame's positions; call once per frame before reading */
  invalidate() {
    this._cache.clear();
  }

  /**
   * A point id or an `[x, y, z]` literal as a world position.
   * @param {string | number[] | null | undefined} ref
   * @returns {Vector3 | null}
   */
  resolve(ref) {
    if (Array.isArray(ref)) return ref.length >= 3 && ref.every(Number.isFinite) ? new Vector3(ref[0], ref[1], ref[2]) : null;
    if (typeof ref === 'string') return this.get(ref);
    return null;
  }

  /**
   * World position of a point (cached for the frame); null when unknown,
   * unresolvable or part of a cycle.
   * @param {string} id
   * @returns {Vector3 | null}
   */
  get(id) {
    return this._get(id, new Set());
  }

  /**
   * Whether a point changes without a config change: on a moving object, in
   * the sky, or relative to such a point.
   * @param {string | number[] | null | undefined} ref
   * @param {Set<string>} [seen]
   * @returns {boolean}
   */
  isDynamic(ref, seen = new Set()) {
    if (typeof ref !== 'string') return false;
    const d = this.defs.get(ref);
    if (!d || seen.has(ref)) return false;
    seen.add(ref);
    if (d.sky || d.body || isSet(d.satellite) || pointBinding(this.configs.get(ref) ?? d) || d._bound) return true;
    if (d.object && this.hosts.get(d.object)?.moving) return true;
    return d.at ? this.isDynamic(d.at, seen) : false;
  }

  /**
   * @param {string} id
   * @param {Set<string>} seen
   * @returns {Vector3 | null}
   * @private
   */
  _get(id, seen) {
    if (this._cache.has(id)) return /** @type {Vector3 | null} */ (this._cache.get(id));
    const d = this.defs.get(id);
    if (!d) return null;
    if (seen.has(id)) {
      this._warn(id, `point '${id}' refers back to itself (${[...seen, id].join(' > ')})`);
      return null;
    }
    seen.add(id);
    const v = this._place(d, seen);
    if (v && Array.isArray(d.offset) && d.offset.length >= 3) {
      // in the point's own units (a frame is never rotated, only scaled)
      const f = this.frame(d._system);
      const k = f ? f.matrixWorld.getMaxScaleOnAxis() : 1;
      v.add(new Vector3(+d.offset[0] || 0, +d.offset[1] || 0, +d.offset[2] || 0).multiplyScalar(k));
    }
    seen.delete(id);
    this._cache.set(id, v);
    return v;
  }

  /**
   * @param {PointDef} d
   * @param {Set<string>} seen
   * @returns {Vector3 | null}
   * @private
   */
  _place(d, seen) {
    const host = d.object ? this.hosts.get(d.object) : undefined;
    if (d.object && !host) {
      this._warn(d.id, `point '${d.id}': no object '${d.object}'`);
      return null;
    }
    if (host?.ready && !host.ready()) return null;
    if (d.part !== undefined && d.part !== null && d.part !== '') {
      if (!host?.partNode) {
        this._warn(d.id, `point '${d.id}': part '${d.part}' needs a model object`);
        return null;
      }
      const node = host.partNode(String(d.part));
      if (!node) return null;
      const o = Array.isArray(d.xyz) ? d.xyz : [0, 0, 0];
      return new Vector3(+o[0] || 0, +o[1] || 0, +o[2] || 0).applyMatrix4(node.matrixWorld);
    }
    /** Local to the host when there is one, else to the point's frame */
    const frame = host ? null : this.frame(d._system);
    const world = (/** @type {Vector3} */ v) => (host ? (host.warp ? host.warp(v) : v).applyMatrix4(host.node.matrixWorld) : frame ? v.applyMatrix4(frame.matrixWorld) : v);
    const R = (host?.radius ?? 1) + (Number(d.alt) || 0);
    if (Array.isArray(d.xyz)) return world(new Vector3(+d.xyz[0] || 0, +d.xyz[1] || 0, +d.xyz[2] || 0));
    if (Array.isArray(d.polar)) {
      const [x, z] = bearingXZ(+d.polar[0] || 0, +d.polar[1] || 0);
      return world(new Vector3(x, Number(d.alt) || 0, z));
    }
    if (Array.isArray(d.latlon)) return world(latlonToLocal(+d.latlon[0] || 0, +d.latlon[1] || 0, R));
    if (Array.isArray(d.altaz)) return world(altazToLocal(+d.altaz[0] || 0, +d.altaz[1] || 0, R));
    if (d.sky) {
      const body = this.sky()?.[d.sky];
      return body ? world(altazToLocal(body.azimuth, body.altitude, R)) : null;
    }
    if (d.body !== undefined) {
      const local = this._body(d);
      return local ? world(local) : null;
    }
    if (isSet(d.satellite)) {
      if (!host) {
        this._warn(d.id, `point '${d.id}': a satellite needs object (an Earth sphere)`);
        return null;
      }
      const local = this._satelliteLocal(d, host);
      return local ? world(local) : null;
    }
    if (d.cell) {
      const local = host?.cellPoint?.(d.cell) ?? null;
      if (!local) this._warn(d.id, `point '${d.id}': no cell '${d.cell}'${d.object ? ` on '${d.object}'` : ''}`);
      return local ? world(local.clone()) : null;
    }
    if (d.at) {
      const base = this._get(d.at, seen);
      return base ? base.clone() : null;
    }
    // An entity-bound form waits for its first numbers (no warning)
    if (d._bound || pointBinding(d)) return null;
    this._warn(d.id, `point '${d.id}' has no position (xyz, polar, latlon, altaz, sky, body, satellite, at or cell)`);
    return null;
  }

  /**
   * A satellite point's state: its shipped orbit (null when the snapshot does
   * not have it), an orbit from live fixes, and the eased shift along the orbit.
   * @param {PointDef} d
   * @returns {SatelliteState}
   * @private
   */
  _sat(d) {
    const key = String(d.satellite);
    let st = this._sats.get(String(d.id));
    if (!st || st.key !== key) {
      const data = satelliteData(key);
      st = { key, base: data ? prepareOrbit(data.elements) : null, live: null, fixes: [], shift: { from: 0, to: 0, wall: 0 }, lastFix: null };
      this._sats.set(String(d.id), st);
      if (!data && !(typeof d.entity === 'string' && d.entity)) this._warn(d.id, `point '${d.id}': no shipped data for satellite '${key}' (give it an entity for live positions)`);
    }
    return st;
  }

  /**
   * The eased shift along the orbit now, radians.
   * @param {SatelliteState} st
   * @private
   */
  _shiftNow(st) {
    const k = Math.min(1, Math.max(0, (performance.now() - st.shift.wall) / FIX_EASE_MS));
    const e = k * k * (3 - 2 * k);
    return st.shift.from + (st.shift.to - st.shift.from) * e;
  }

  /**
   * A live fix [latitude, longitude, ms] from the point's entity.
   * @param {PointDef} d
   * @param {number[]} fix
   * @private
   */
  _fix(d, fix) {
    const [lat, lon, ms] = fix;
    if (![lat, lon, ms].every(Number.isFinite)) return;
    const st = this._sat(d);
    const prev = st.fixes[st.fixes.length - 1];
    if (prev && prev.ms === ms) return;
    const ref = st.base ?? st.live;
    const r = st.base ? Math.hypot(...positionAt(st.base, ms)) : st.live ? st.live.a : EARTH_RADIUS + LIVE_GUESS_KM;
    const p = fromEarthFixed(lat, lon, r, ms);
    const wall = performance.now();
    const now = this.date();
    const current = this._shiftNow(st);
    if (st.base) {
      // the plane is known: only the place along it moves (the short way round)
      const target = anomalyShiftTo(st.base, p, ms);
      const d2 = ((((target - current) % (2 * Math.PI)) + 3 * Math.PI) % (2 * Math.PI)) - Math.PI;
      st.shift = { from: current, to: current + d2, wall };
    } else if (prev && ms - prev.ms > 0 && ms - prev.ms < 40 * 60000) {
      const live = orbitFromFixes(prev.p, prev.ms, p, ms, { radiusFromRate: true });
      if (live) {
        // start where the dot is drawn now, then ease onto the new orbit's own place
        const from = ref ? anomalyShiftTo(live, positionAt(ref, now, current), now) : 0;
        st.live = live;
        st.shift = { from, to: 0, wall };
      }
    }
    st.fixes = [...(prev ? [prev] : []), { p, ms }];
    st.lastFix = { lat, lon };
    this._cache.clear();
  }

  /**
   * Where a satellite point is on its sphere now, local to the sphere.
   * @param {PointDef} d
   * @param {PlacementHost} host
   * @returns {Vector3 | null}
   * @private
   */
  _satelliteLocal(d, host) {
    const st = this._sat(d);
    const R = host.radius ?? 1;
    const heights = d.heights === 'diagram' ? 'diagram' : 'real';
    const orbit = st.live ?? st.base;
    if (!orbit) {
      // one live fix and no shipped data: the fix itself, at a guessed height
      if (!st.lastFix) return null;
      return latlonToLocal(st.lastFix.lat, st.lastFix.lon, R * (1 + drawnHeight(LIVE_GUESS_KM, heights)));
    }
    const ms = this.date();
    const f = toEarthFixed(positionAt(orbit, ms, this._shiftNow(st)), ms);
    return latlonToLocal(f.lat, f.lon, R * (1 + drawnHeight(f.height, heights)));
  }

  /**
   * A satellite point's whole orbit now, world positions (an orbit ring:
   * `type: ring, satellite: <point>`); null until it has one.
   * @param {string} id - the satellite point
   * @param {number} [steps]
   * @returns {Vector3[] | null}
   */
  satelliteOrbit(id, steps = 128) {
    const d = this.defs.get(id);
    if (!d || !isSet(d.satellite)) return null;
    const host = d.object ? this.hosts.get(d.object) : undefined;
    if (!host || (host.ready && !host.ready())) return null;
    const st = this._sat(d);
    const orbit = st.live ?? st.base;
    if (!orbit) return null;
    const R = host.radius ?? 1;
    const heights = d.heights === 'diagram' ? 'diagram' : 'real';
    const ms = this.date();
    host.node.updateWorldMatrix(true, false);
    return orbitAt(orbit, ms, steps).map((p) => {
      const f = toEarthFixed(p, ms);
      return latlonToLocal(f.lat, f.lon, R * (1 + drawnHeight(f.height, heights))).applyMatrix4(host.node.matrixWorld);
    });
  }

  /**
   * A body point in its frame's units (the Sun, or `center`, at the origin).
   * @param {PointDef} d
   * @returns {Vector3 | null}
   * @private
   */
  _body(d) {
    const name = String(d.body);
    const center = d.center !== undefined && d.center !== null && d.center !== '' ? String(d.center) : 'sun';
    if (!BODIES[name] || !BODIES[center]) {
      this._warn(d.id, `point '${d.id}': no body '${BODIES[name] ? center : name}'`);
      return null;
    }
    const p = position(name, this.date(), center);
    if (!p) return null;
    return new Vector3(...toScene(p)).multiplyScalar(1 / this.kmPerUnit(d._system, d.id));
  }

  /**
   * km per unit of a frame, from its `units` (au without one, with a warning).
   * @param {string | undefined} system
   * @param {string} [id] - the point asking (for the warning)
   */
  kmPerUnit(system, id = '') {
    const k = kmPerUnit(this.units(system));
    if (k === null) {
      this._warn(`units:${system ?? ''}`, `${system ? `system '${system}'` : 'the scene'} has no units (km, au, ...): body point '${id}' reads it as au`);
      return AU_KM;
    }
    return k;
  }

  /**
   * @param {string} id
   * @param {string} message
   * @private
   */
  _warn(id, message) {
    if (this._warned.has(id)) return;
    this._warned.add(id);
    lcardsLog.warn(`[Astrometrics] ${message}`);
  }
}
