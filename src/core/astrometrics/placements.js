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
 *   xyz: [x, y, z]                       scene units (object-local with `on`)
 *   polar: [r, bearing], y               on the scene plane (object-local with `on`)
 *   latlon: [lat, lon], on: <sphere>, alt  on a sphere or globe; lon 0 faces +z
 *                                        (the default camera), east to the right
 *   altaz: [azimuth, altitude], on: <dome>, alt  on a sky dome
 *   sky: sun | moon, on: <dome>, alt     the body's altaz now (see sky.js)
 *   at: <point>                          another point
 *   cell: AF3, on: <grid>                the centre of a lettered grid cell
 *
 * `offset: [x, y, z]` (scene units) is added to any form. A reference that
 * loops back on itself is refused (null, logged once).
 *
 * @module core/astrometrics/placements
 */
import { Vector3 } from 'three';
import { lcardsLog } from '../../utils/lcards-logging.js';

const DEG = Math.PI / 180;

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
 */

/**
 * @typedef {Object} PointDef
 * @property {string} id
 * @property {number[]} [xyz]
 * @property {number[]} [polar]
 * @property {number} [y]
 * @property {number[]} [latlon]
 * @property {number[]} [altaz]
 * @property {'sun' | 'moon'} [sky]
 * @property {string} [at]
 * @property {string} [cell]
 * @property {string} [on]
 * @property {number} [alt]
 * @property {number[]} [offset]
 */

export class Placements {
  /**
   * @param {Object} opts
   * @param {PointDef[]} [opts.points]
   * @param {Map<string, PlacementHost>} [opts.hosts] - objects by id
   * @param {() => (import('./sky.js').SkyState | null)} [opts.sky]
   */
  constructor({ points = [], hosts = new Map(), sky = () => null } = {}) {
    /** @type {Map<string, PointDef>} */
    this.defs = new Map();
    for (const p of points) if (p?.id) this.defs.set(String(p.id), p);
    this.hosts = hosts;
    this.sky = sky;
    /** @type {Map<string, Vector3 | null>} */
    this._cache = new Map();
    /** @type {Set<string>} ids already warned about */
    this._warned = new Set();
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
    if (d.sky) return true;
    if (d.on && this.hosts.get(d.on)?.moving) return true;
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
    if (v && Array.isArray(d.offset) && d.offset.length >= 3) v.add(new Vector3(+d.offset[0] || 0, +d.offset[1] || 0, +d.offset[2] || 0));
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
    const host = d.on ? this.hosts.get(d.on) : undefined;
    if (d.on && !host) {
      this._warn(d.id, `point '${d.id}': no object '${d.on}'`);
      return null;
    }
    /** Local to the host when there is one */
    const world = (/** @type {Vector3} */ v) => (host ? v.applyMatrix4(host.node.matrixWorld) : v);
    const R = (host?.radius ?? 1) + (Number(d.alt) || 0);
    if (Array.isArray(d.xyz)) return world(new Vector3(+d.xyz[0] || 0, +d.xyz[1] || 0, +d.xyz[2] || 0));
    if (Array.isArray(d.polar)) {
      const [x, z] = bearingXZ(+d.polar[0] || 0, +d.polar[1] || 0);
      return world(new Vector3(x, Number(d.y) || 0, z));
    }
    if (Array.isArray(d.latlon)) return world(latlonToLocal(+d.latlon[0] || 0, +d.latlon[1] || 0, R));
    if (Array.isArray(d.altaz)) return world(altazToLocal(+d.altaz[0] || 0, +d.altaz[1] || 0, R));
    if (d.sky) {
      const body = this.sky()?.[d.sky];
      return body ? world(altazToLocal(body.azimuth, body.altitude, R)) : null;
    }
    if (d.cell) {
      const local = host?.cellPoint?.(d.cell) ?? null;
      if (!local) this._warn(d.id, `point '${d.id}': no cell '${d.cell}'${d.on ? ` on '${d.on}'` : ''}`);
      return local ? world(local.clone()) : null;
    }
    if (d.at) {
      const base = this._get(d.at, seen);
      return base ? base.clone() : null;
    }
    this._warn(d.id, `point '${d.id}' has no position (xyz, polar, latlon, altaz, sky, at or cell)`);
    return null;
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
