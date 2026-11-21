/**
 * Earth satellites: where a satellite is at a date, from mean orbital elements
 * (the shipped snapshot, satellite-data.json, or an orbit worked out from a live
 * entity's fixes). Pure maths, no three.js.
 *
 * Model: Keplerian motion with Earth's J2 secular rates (the node and perigee drift,
 * the mean motion's J2 term), the elements first converted from the Kozai mean motion
 * the data gives to Brouwer's as SGP4 does. It leaves out SGP4's short-period terms
 * (tens of km for a low orbit): a picture, not tracking (checks against known orbits in
 * tests/core/astro-satellites.test.js). High orbits (GPS, Galileo,
 * geostationary) stay good for months; a low one keeps its plane for weeks but not its
 * place along it (drag, reboosts), so a low satellite's dot wants a live entity.
 *
 * Frames: positions are in Earth's inertial equatorial frame of date (x toward the
 * equinox, z toward the north pole), km; `toEarthFixed` turns them with Greenwich
 * sidereal time into latitude, longitude (east positive) and height over a sphere of
 * EARTH_RADIUS, which the card places on its Earth sphere like a latlon point.
 *
 * @module core/astrometrics/satellites
 */
import DATA from './satellite-data.json';
import { objectIds } from './names.js';

const DEG = Math.PI / 180;
const TAU = 2 * Math.PI;
/** Earth's gravitational parameter, km^3/s^2 (WGS-72, as SGP4) */
export const MU = 398600.8;
/** Equatorial radius for J2, km (WGS-72) */
const RE = 6378.135;
const J2 = 0.001082616;
/** Mean radius of the drawn Earth sphere, km: heights are measured from it */
export const EARTH_RADIUS = 6371;

/**
 * @typedef {Object} Elements
 * @property {number} epoch - ms
 * @property {number} n - mean motion, rev/day (Kozai, as the data gives it)
 * @property {number} e - eccentricity
 * @property {number} i - inclination, degrees
 * @property {number} node - right ascension of the ascending node, degrees
 * @property {number} perigee - argument of perigee, degrees
 * @property {number} M - mean anomaly, degrees
 */

/**
 * @typedef {Object} Orbit - elements prepared for propagation (radians, seconds)
 * @property {number} epoch
 * @property {number} a - semi-major axis, km
 * @property {number} e
 * @property {number} i
 * @property {number} node
 * @property {number} perigee
 * @property {number} M
 * @property {number} nodeRate - rad/s
 * @property {number} perigeeRate - rad/s
 * @property {number} meanRate - rad/s
 * @property {number} period - s
 */

/** Built-in satellite names (iss, hubble, goes_east, ...) with their NORAD id and label */
export const SATELLITE_NAMES = /** @type {Record<string, { id: number, label: string }>} */ (DATA.names);
/** Groups (gps, galileo, geostationary, stations): their NORAD ids */
export const SATELLITE_GROUPS = /** @type {Record<string, number[]>} */ (DATA.groups);
/** When the shipped elements were fetched (ISO date) */
export const SATELLITE_DATA_DATE = /** @type {string} */ (DATA.fetched);

/**
 * The shipped elements of a satellite: a built-in name or a NORAD id (number or
 * digits). null when the snapshot does not have it.
 * @param {string | number} ref
 * @returns {{ id: number, name: string, elements: Elements } | null}
 */
export function satelliteData(ref) {
  const key = String(ref ?? '').trim().toLowerCase();
  const id = /^\d+$/.test(key) ? Number(key) : SATELLITE_NAMES[key]?.id;
  const rec = id === undefined ? undefined : /** @type {Record<string, any>} */ (DATA.satellites)[id];
  if (!rec) return null;
  const [, epoch, n, e, i, node, perigee, M] = rec.elements;
  const label = Object.values(SATELLITE_NAMES).find((s) => s.id === id)?.label ?? rec.name;
  return { id: /** @type {number} */ (id), name: label, elements: { epoch, n, e, i, node, perigee, M } };
}

/**
 * Prepare elements for propagation: Kozai to Brouwer mean motion (SGP4's
 * initialisation), the semi-major axis and the J2 secular rates.
 * @param {Elements} el
 * @returns {Orbit}
 */
export function prepareOrbit(el) {
  const n0 = (el.n * TAU) / 86400;
  const e = Math.min(Math.max(el.e, 0), 0.99);
  const i = el.i * DEG;
  const cosi = Math.cos(i);
  const b2 = 1 - e * e;
  const k = 1.5 * J2 * RE * RE * (3 * cosi * cosi - 1) / Math.pow(b2, 1.5);
  const a1 = Math.cbrt(MU / (n0 * n0));
  const d1 = k / (2 * a1 * a1);
  const a0 = a1 * (1 - d1 / 3 - d1 * d1 - (134 / 81) * d1 * d1 * d1);
  const d0 = k / (2 * a0 * a0);
  const n = n0 / (1 + d0);
  const a = a0 / (1 - d0);
  const q = 1.5 * J2 * (RE / (a * b2)) ** 2;
  return {
    epoch: el.epoch,
    a,
    e,
    i,
    node: el.node * DEG,
    perigee: el.perigee * DEG,
    M: el.M * DEG,
    nodeRate: -q * n * cosi,
    perigeeRate: 0.5 * q * n * (5 * cosi * cosi - 1),
    meanRate: n * (1 + 0.5 * q * Math.sqrt(b2) * (3 * cosi * cosi - 1)),
    period: TAU / n,
  };
}

/**
 * Eccentric anomaly from the mean anomaly (Newton's method).
 * @param {number} M
 * @param {number} e
 */
function eccentricAnomaly(M, e) {
  let E = e < 0.8 ? M : Math.PI;
  for (let k = 0; k < 12; k++) {
    const d = (E - e * Math.sin(E) - M) / (1 - e * Math.cos(E));
    E -= d;
    if (Math.abs(d) < 1e-10) break;
  }
  return E;
}

/**
 * Position in the inertial equatorial frame at a date, km.
 * @param {Orbit} o
 * @param {number} ms
 * @param {number} [anomalyShift] - added to the mean anomaly, radians (a live fix's correction)
 * @returns {[number, number, number]}
 */
export function positionAt(o, ms, anomalyShift = 0) {
  const t = (ms - o.epoch) / 1000;
  const node = o.node + o.nodeRate * t;
  const perigee = o.perigee + o.perigeeRate * t;
  const M = (o.M + o.meanRate * t + anomalyShift) % TAU;
  const E = eccentricAnomaly(M, o.e);
  const x = o.a * (Math.cos(E) - o.e);
  const y = o.a * Math.sqrt(1 - o.e * o.e) * Math.sin(E);
  return perifocalToInertial(x, y, perigee, o.i, node);
}

/**
 * @param {number} x - toward perigee
 * @param {number} y - 90 degrees on, in the orbit's direction
 * @param {number} w - argument of perigee
 * @param {number} i
 * @param {number} node
 * @returns {[number, number, number]}
 */
function perifocalToInertial(x, y, w, i, node) {
  const cw = Math.cos(w), sw = Math.sin(w);
  const ci = Math.cos(i), si = Math.sin(i);
  const cn = Math.cos(node), sn = Math.sin(node);
  const xp = x * cw - y * sw; // in the orbit plane, from the ascending node
  const yp = x * sw + y * cw;
  return [xp * cn - yp * ci * sn, xp * sn + yp * ci * cn, yp * si];
}

/**
 * The whole orbit at a date (one revolution, the node and perigee as they are
 * then), inertial frame, km.
 * @param {Orbit} o
 * @param {number} ms
 * @param {number} [steps]
 * @returns {[number, number, number][]}
 */
export function orbitAt(o, ms, steps = 128) {
  const t = (ms - o.epoch) / 1000;
  const node = o.node + o.nodeRate * t;
  const perigee = o.perigee + o.perigeeRate * t;
  const out = [];
  for (let k = 0; k < steps; k++) {
    const E = (k / steps) * TAU;
    const x = o.a * (Math.cos(E) - o.e);
    const y = o.a * Math.sqrt(1 - o.e * o.e) * Math.sin(E);
    out.push(perifocalToInertial(x, y, perigee, o.i, node));
  }
  return out;
}

/**
 * Greenwich mean sidereal time at a date, radians (IAU 1982, as SGP4).
 * @param {number} ms
 */
export function siderealAngle(ms) {
  const tut1 = (ms / 86400000 + 2440587.5 - 2451545) / 36525;
  let s = -6.2e-6 * tut1 ** 3 + 0.093104 * tut1 ** 2 + (876600 * 3600 + 8640184.812866) * tut1 + 67310.54841;
  s = ((s * DEG) / 240) % TAU;
  return s < 0 ? s + TAU : s;
}

/**
 * Inertial position to latitude, longitude (degrees, east positive) and height
 * over the drawn sphere (km), at a date.
 * @param {[number, number, number]} p
 * @param {number} ms
 * @returns {{ lat: number, lon: number, height: number }}
 */
export function toEarthFixed([x, y, z], ms) {
  const g = siderealAngle(ms);
  const r = Math.hypot(x, y, z);
  let lon = (Math.atan2(y, x) - g) / DEG;
  lon = ((((lon + 180) % 360) + 360) % 360) - 180;
  return { lat: Math.asin(z / r) / DEG, lon, height: r - EARTH_RADIUS };
}

/**
 * Latitude, longitude (degrees) and distance from Earth's centre (km) at a date
 * to an inertial position: a live fix.
 * @param {number} lat
 * @param {number} lon
 * @param {number} r
 * @param {number} ms
 * @returns {[number, number, number]}
 */
export function fromEarthFixed(lat, lon, r, ms) {
  const a = lon * DEG + siderealAngle(ms);
  const c = Math.cos(lat * DEG);
  return [r * c * Math.cos(a), r * c * Math.sin(a), r * Math.sin(lat * DEG)];
}

/**
 * A drawn height for a real one, in Earth radii above the surface: `real` as it
 * is; `diagram` lifts low orbits clear of the surface and brings geostationary in
 * (ISS about 0.26, GPS about 2.3, geostationary about 2.7).
 * @param {number} km
 * @param {'real' | 'diagram'} [heights]
 */
export function drawnHeight(km, heights = 'real') {
  if (heights !== 'diagram') return km / EARTH_RADIUS;
  return 0.75 * Math.log1p(Math.max(0, km) / 1000);
}

/**
 * Angle of a position round an orbit plane from its ascending node (the argument
 * of latitude), radians; any inclination, equatorial too.
 * @param {[number, number, number]} v
 * @param {number} i
 * @param {number} node
 */
function inPlaneAngle(v, i, node) {
  const cn = Math.cos(node), sn = Math.sin(node), ci = Math.cos(i), si = Math.sin(i);
  // N: toward the ascending node; Q: 90 degrees on in the orbit's direction (h x N)
  const along = v[0] * cn + v[1] * sn;
  const across = -v[0] * sn * ci + v[1] * cn * ci + v[2] * si;
  return Math.atan2(across, along);
}

/**
 * A circular orbit through two live fixes (inertial positions at two dates): the
 * plane from their cross product, the rate from the angle between them. The
 * fixes must be less than half an orbit apart (a minute or two for anything).
 * @param {[number, number, number]} p1
 * @param {number} t1 - ms
 * @param {[number, number, number]} p2
 * @param {number} t2 - ms
 * @param {{ radiusFromRate?: boolean }} [opts] - radiusFromRate: the fixes' distances are a guess
 *   (latitude and longitude only, no shipped data); the radius follows from the rate (Kepler)
 * @returns {Orbit | null} null when the fixes do not define a plane
 */
export function orbitFromFixes(p1, t1, p2, t2, { radiusFromRate = false } = {}) {
  const dt = (t2 - t1) / 1000;
  if (!(dt > 0)) return null;
  const h = [p1[1] * p2[2] - p1[2] * p2[1], p1[2] * p2[0] - p1[0] * p2[2], p1[0] * p2[1] - p1[1] * p2[0]];
  const hn = Math.hypot(...h);
  const r1 = Math.hypot(...p1), r2 = Math.hypot(...p2);
  if (hn < 1e-6 * r1 * r2) return null;
  const angle = Math.atan2(hn, p1[0] * p2[0] + p1[1] * p2[1] + p1[2] * p2[2]);
  const rate = angle / dt;
  const i = Math.acos(Math.max(-1, Math.min(1, h[2] / hn)));
  const node = Math.atan2(h[0], -h[1]);
  const u = inPlaneAngle(p2, i, node);
  return {
    epoch: t2,
    a: radiusFromRate ? Math.cbrt(MU / (rate * rate)) : (r1 + r2) / 2,
    e: 0,
    i,
    node,
    perigee: 0,
    M: u,
    nodeRate: 0,
    perigeeRate: 0,
    meanRate: rate,
    period: TAU / rate,
  };
}

/**
 * The mean anomaly shift that puts an orbit's dot on a fix: the fix's argument of
 * latitude less the orbit's at that date, wrapped to -pi..pi. Eased in by the card.
 * @param {Orbit} o
 * @param {[number, number, number]} p - the fix, inertial
 * @param {number} ms
 */
export function anomalyShiftTo(o, p, ms) {
  const node = o.node + o.nodeRate * ((ms - o.epoch) / 1000);
  let d = inPlaneAngle(p, o.i, node) - inPlaneAngle(positionAt(o, ms), o.i, node);
  d = ((d + Math.PI) % TAU + TAU) % TAU - Math.PI;
  return d;
}

/**
 * The satellites an object `type: satellites` names: its `group`'s members, then
 * its own `satellites` list (built-in names or NORAD ids), each once, as NORAD ids.
 * Ones the snapshot does not have are left out (warned by the caller).
 * @param {any} cfg
 * @returns {{ ids: number[], unknown: string[] }}
 */
export function groupMembers(cfg) {
  /** @type {number[]} */
  const ids = [];
  /** @type {string[]} */
  const unknown = [];
  const group = typeof cfg?.group === 'string' ? SATELLITE_GROUPS[cfg.group.toLowerCase()] : undefined;
  if (cfg?.group !== undefined && !group) unknown.push(`group ${cfg.group}`);
  const refs = [...(group ?? []), ...(Array.isArray(cfg?.satellites) ? cfg.satellites : [])];
  for (const ref of refs) {
    const d = satelliteData(ref);
    if (!d) unknown.push(String(ref));
    else if (!ids.includes(d.id)) ids.push(d.id);
  }
  return { ids, unknown };
}

/**
 * The config with every `type: satellites` object turned into satellite points
 * (`<object id>.<NORAD id>`, a marker each) and, with `orbits`, a ring per point
 * (`<point id>.orbit`), so they draw, move and take fixes as any satellite point
 * and ring. The group's own entry stays (it draws nothing, like a system); the
 * rings go after every other object, so `ring#n` ids keep counting the config's own.
 * A config without one comes back as it is.
 * @template T
 * @param {T} config - flattened (systems lifted: a group keeps its `_system`)
 * @param {(message: string) => void} [warn]
 * @returns {T}
 */
export function expandSatelliteGroups(config, warn = () => {}) {
  const c = /** @type {any} */ (config);
  const objs = Array.isArray(c?.objects) ? c.objects : [];
  if (!objs.some((/** @type {any} */ o) => o?.type === 'satellites')) return config;
  const points = Array.isArray(c.points) ? [...c.points] : [];
  /** @type {any[]} */
  const rings = [];
  const sceneIds = objectIds(objs);
  objs.forEach((/** @type {any} */ o, /** @type {number} */ k) => {
    if (o?.type !== 'satellites') return;
    const gid = /** @type {string} */ (sceneIds[k]);
    const { ids, unknown } = groupMembers(o);
    if (unknown.length) warn(`satellites '${gid}': no shipped orbit for ${unknown.join(', ')}`);
    const sys = o._system !== undefined ? { _system: o._system } : {};
    const hidden = o.visible === false ? { visible: false } : {};
    /** @param {string[]} keys */
    const pick = (keys) => Object.fromEntries(keys.filter((k) => o[k] !== undefined).map((k) => [k, o[k]]));
    // what shows them, on the points and the rings; the actions on the points
    const shown = pick(['look', 'fade', 'min_distance', 'max_distance', 'hide_in_systems']);
    const onPoints = pick(['opacity', 'tap_action', 'hold_action', 'view']);
    const orbits = o.orbits === true ? {} : o.orbits && typeof o.orbits === 'object' ? o.orbits : null;
    for (const id of ids) {
      const pid = `${gid}.${id}`;
      points.push({
        id: pid, satellite: id, object: o.object, marker: o.marker ?? 'dot',
        ...(o.heights !== undefined ? { heights: o.heights } : {}),
        ...(o.color !== undefined ? { color: o.color } : {}),
        ...shown, ...onPoints,
        ...(o.label === true ? { label: satelliteData(id)?.name, style: 'tiny' } : {}),
        ...hidden, ...sys,
      });
      if (orbits) rings.push({ ...orbits, type: 'ring', id: `${pid}.orbit`, satellite: pid, ...shown, ...(orbits.color === undefined && o.color !== undefined ? { color: o.color } : {}), ...hidden, ...sys });
    }
  });
  return { ...c, points, objects: [...objs, ...rings] };
}
