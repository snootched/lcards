/**
 * Where the Sun, planets, Pluto, Ceres and the major moons are at a date,
 * and how each one is turned (its pole and the meridian facing you). Pure
 * maths, no three.js; positions in km.
 *
 * Sources:
 * - Planets: JPL "Approximate Positions of the Planets" (Standish and
 *   Williams), Table 2a with the Table 2b terms, fit for 3000 BC to 3000 AD.
 *   Earth is the Earth-Moon barycentre less the Moon's share.
 * - Pluto and Ceres: osculating elements from the JPL Small-Body Database
 *   (one epoch, mean motion): a degree or so over decades.
 * - The Moon: the lunar series in sky.js. The other moons: JPL's planetary
 *   satellite mean elements (a precessing ellipse in each moon's Laplace or
 *   equatorial plane): a few degrees, for a picture, not for navigation.
 * - Rotation: IAU WGCCRE 2015 pole and prime meridian models, main terms.
 *
 * Against JPL Horizons (tests/core/astro-ephemeris.test.js) at 1950, 2000,
 * 2026 and 2100. Outside 3000 BC to 3000 AD the elements keep extrapolating
 * (no clamp); `outOfRange()` says when.
 *
 * Frames: everything is computed in the ecliptic and mean equinox of J2000
 * (x toward the March equinox, z toward ecliptic north) and handed out in
 * scene axes by `toScene`: y up (ecliptic north), and ecliptic +y at the
 * bearing convention's north (-z), so orbits run anticlockwise seen from
 * above, as from ecliptic north. Times are ms (Date.now()); the 69 s between
 * UTC and the ephemeris time scale is ignored.
 *
 * @module core/astrometrics/ephemeris
 */
import { moonEcliptic } from './sky.js';

const DEG = Math.PI / 180;
const J2000 = 2451545;
/** km per au (IAU 2012) */
export const AU_KM = 149597870.7;
/** Obliquity of the ecliptic at J2000 */
const OBLIQ = 23.43928 * DEG;
/** Earth-Moon mass ratio (DE430) */
const EMRAT = 81.30057;

/** Days from J2000 for a time in ms */
export const daysJ2000 = (/** @type {number} */ ms) => ms / 86400000 + 2440587.5 - J2000;

/** The first and last date the planet tables were fit for (3000 BC, 3000 AD), in ms */
export const VALID_RANGE = [Date.UTC(-2999, 0, 1), Date.UTC(3000, 0, 1)];

/** @param {number} ms */
export const outOfRange = (ms) => ms < VALID_RANGE[0] || ms > VALID_RANGE[1];

/**
 * Planets, Table 2a: [a au, e, I, L, long. perihelion, long. node] and their
 * rates per century; Table 2b: [b, c, s, f] for Jupiter to Neptune.
 * @type {Record<string, { el: number[], rate: number[], extra?: number[] }>}
 */
const PLANETS = {
  mercury: { el: [0.38709843, 0.20563661, 7.00559432, 252.25166724, 77.45771895, 48.33961819], rate: [0, 0.00002123, -0.00590158, 149472.67486623, 0.15940013, -0.12214182] },
  venus: { el: [0.72332102, 0.00676399, 3.39777545, 181.97970850, 131.76755713, 76.67261496], rate: [-0.00000026, -0.00005107, 0.00043494, 58517.81560260, 0.05679648, -0.27274174] },
  emb: { el: [1.00000018, 0.01673163, -0.00054346, 100.46691572, 102.93005885, -5.11260389], rate: [-0.00000003, -0.00003661, -0.01337178, 35999.37306329, 0.31795260, -0.24123856] },
  mars: { el: [1.52371243, 0.09336511, 1.85181869, -4.56813164, -23.91744784, 49.71320984], rate: [0.00000097, 0.00009149, -0.00724757, 19140.29934243, 0.45223625, -0.26852431] },
  jupiter: { el: [5.20248019, 0.04853590, 1.29861416, 34.33479152, 14.27495244, 100.29282654], rate: [-0.00002864, 0.00018026, -0.00322699, 3034.90371757, 0.18199196, 0.13024619], extra: [-0.00012452, 0.06064060, -0.35635438, 38.35125000] },
  saturn: { el: [9.54149883, 0.05550825, 2.49424102, 50.07571329, 92.86136063, 113.63998702], rate: [-0.00003065, -0.00032044, 0.00451969, 1222.11494724, 0.54179478, -0.25015002], extra: [0.00025899, -0.13434469, 0.87320147, 38.35125000] },
  uranus: { el: [19.18797948, 0.04685740, 0.77298127, 314.20276625, 172.43404441, 73.96250215], rate: [-0.00020455, -0.00001550, -0.00180155, 428.49512595, 0.09266985, 0.05739699], extra: [0.00058331, -0.97731848, 0.17689245, 7.67025000] },
  neptune: { el: [30.06952752, 0.00895439, 1.77005520, 304.22289287, 46.68158724, 131.78635853], rate: [0.00006447, 0.00000818, 0.00022400, 218.46515314, 0.01009938, -0.00606302], extra: [-0.00041348, 0.68346318, -0.10162547, 7.67025000] }
};

/**
 * Pluto and Ceres, JPL Small-Body Database (heliocentric ecliptic J2000):
 * epoch JD, a au, e, i, node, argument of perihelion, mean anomaly, mean motion deg/day.
 * @type {Record<string, number[]>}
 */
const SMALL = {
  pluto: [2457588.5, 39.58862938517124, 0.2518378778576892, 17.14771140999114, 110.2923840543057, 113.7090015158565, 38.68366347318184, 0.003956838955553025],
  ceres: [2461200.5, 2.765552595034094, 0.07969229514816586, 10.58802780183462, 80.24862682043221, 73.29421453021587, 274.4193463761342, 0.21430445064843]
};

/**
 * Moons: JPL planetary satellite mean elements (epoch J2000) for the shape
 * and plane of each orbit: a km, e, argument of periapsis, L0, inclination,
 * node, P, apsis period years, node period years (0: none), and the plane
 * they are in: its pole [right ascension, declination] in ICRF degrees.
 * L0 (degrees at J2000) and P (days) are the moon's angle along its orbit
 * and its mean rate, fit to JPL Horizons over 2000 to 2026 (the table's
 * mean anomalies and periods are not sidereal); refit with
 * tests/core/fixtures/astro-ephemeris-fit-moons.mjs.
 * @type {Record<string, { parent: string, el: number[], plane: [number, number] }>}
 */
export const MOONS = {
  phobos: { parent: 'mars', el: [9375, 0.015, 216.3, 215.16, 1.1, 169.2, 0.31891007, 1.1, 2.3], plane: [317.7, 52.9] },
  deimos: { parent: 'mars', el: [23457, 0, 0, 259.395, 1.8, 54.3, 1.26244075, 0, 56.2], plane: [316.6, 53.5] },
  io: { parent: 'jupiter', el: [421800, 0.004, 49.1, 19.898, 0, 0, 1.76913833, 1.333, 0], plane: [268.1, 64.5] },
  europa: { parent: 'jupiter', el: [671100, 0.009, 45.0, 214.396, 0.5, 184.0, 3.55117426, 1.394, 30.202], plane: [268.1, 64.5] },
  ganymede: { parent: 'jupiter', el: [1070400, 0.001, 198.3, 221.566, 0.2, 58.5, 7.15454972, 68.301, 137.812], plane: [268.2, 64.6] },
  callisto: { parent: 'jupiter', el: [1882700, 0.007, 43.8, 80.424, 0.3, 309.1, 16.68901925, 277.921, 577.264], plane: [268.7, 64.8] },
  titan: { parent: 'saturn', el: [1221900, 0.029, 78.3, 14.599, 0.3, 78.6, 15.94585901, 346.680, 687.370], plane: [36.4, 84.0] },
  // Triton and Charon: in their planet's equator; Triton's node turns with Neptune's pole (688 years)
  triton: { parent: 'neptune', el: [354800, 0, 0, 236.137, 157.3, 177.7, 5.87657946, 675.2, 688], plane: [299.36, 43.46] },
  charon: { parent: 'pluto', el: [19600, 0, 0, 304.131, 0, 0, 6.38722222, 0, 0], plane: [132.993, -6.163] }
};

/**
 * Rotation, IAU WGCCRE 2015 main terms: pole right ascension and declination
 * [at J2000, per century], prime meridian [at J2000, degrees per day].
 * Neptune takes its N term and the Moon its largest libration term (E1).
 * @type {Record<string, { ra: number[], dec: number[], w: number[] }>}
 */
const ROTATION = {
  sun: { ra: [286.13, 0], dec: [63.87, 0], w: [84.176, 14.1844] },
  mercury: { ra: [281.0103, -0.0328], dec: [61.4155, -0.0049], w: [329.5988, 6.1385108] },
  venus: { ra: [272.76, 0], dec: [67.16, 0], w: [160.20, -1.4813688] },
  earth: { ra: [0, -0.641], dec: [90, -0.557], w: [190.147, 360.9856235] },
  moon: { ra: [269.9949, 0.0031], dec: [66.5392, 0.0130], w: [38.3213, 13.17635815] },
  mars: { ra: [317.68143, -0.1061], dec: [52.8865, -0.0609], w: [176.630, 350.89198226] },
  phobos: { ra: [317.68, -0.108], dec: [52.90, -0.061], w: [35.06, 1128.8445850] },
  deimos: { ra: [316.65, -0.108], dec: [53.52, -0.061], w: [79.41, 285.1618970] },
  jupiter: { ra: [268.056595, -0.006499], dec: [64.495303, 0.002413], w: [284.95, 870.5360000] },
  io: { ra: [268.05, -0.009], dec: [64.50, 0.003], w: [200.39, 203.4889538] },
  europa: { ra: [268.08, -0.009], dec: [64.51, 0.003], w: [36.022, 101.3747235] },
  ganymede: { ra: [268.20, -0.009], dec: [64.57, 0.003], w: [44.064, 50.3176081] },
  callisto: { ra: [268.72, -0.009], dec: [64.83, 0.003], w: [259.51, 21.5710715] },
  saturn: { ra: [40.589, -0.036], dec: [83.537, -0.004], w: [38.90, 810.7939024] },
  titan: { ra: [39.4827, 0], dec: [83.4279, 0], w: [186.5855, 22.5769768] },
  uranus: { ra: [257.311, 0], dec: [-15.175, 0], w: [203.81, -501.1600928] },
  neptune: { ra: [299.36, 0], dec: [43.46, 0], w: [249.978, 541.1397757] },
  triton: { ra: [299.36, 0], dec: [41.17, 0], w: [296.53, -61.2572637] },
  pluto: { ra: [132.993, 0], dec: [-6.163, 0], w: [302.695, 56.3625225] },
  charon: { ra: [132.993, 0], dec: [-6.163, 0], w: [122.695, 56.3625225] },
  ceres: { ra: [291.418, 0], dec: [66.764, 0], w: [170.650, 952.1532] }
};

/**
 * Every body: its parent (null for the Sun; the Sun for planets, Pluto and
 * Ceres) and mean radius in km.
 * @type {Record<string, { parent: string | null, radius: number }>}
 */
export const BODIES = {
  sun: { parent: null, radius: 695700 },
  mercury: { parent: 'sun', radius: 2439.7 },
  venus: { parent: 'sun', radius: 6051.8 },
  earth: { parent: 'sun', radius: 6371.0 },
  moon: { parent: 'earth', radius: 1737.4 },
  mars: { parent: 'sun', radius: 3389.5 },
  phobos: { parent: 'mars', radius: 11.08 },
  deimos: { parent: 'mars', radius: 6.27 },
  ceres: { parent: 'sun', radius: 469.7 },
  jupiter: { parent: 'sun', radius: 69911 },
  io: { parent: 'jupiter', radius: 1821.6 },
  europa: { parent: 'jupiter', radius: 1560.8 },
  ganymede: { parent: 'jupiter', radius: 2634.1 },
  callisto: { parent: 'jupiter', radius: 2410.3 },
  saturn: { parent: 'sun', radius: 58232 },
  titan: { parent: 'saturn', radius: 2574.7 },
  uranus: { parent: 'sun', radius: 25362 },
  neptune: { parent: 'sun', radius: 24622 },
  triton: { parent: 'neptune', radius: 1353.4 },
  pluto: { parent: 'sun', radius: 1188.3 },
  charon: { parent: 'pluto', radius: 606 }
};

/** Body names, in order out from the Sun (the schema enum and the registry) */
export const BODY_NAMES = Object.keys(BODIES);

/** @typedef {[number, number, number]} Vec */

/**
 * Solve Kepler's equation (radians) by Newton's method.
 * @param {number} M
 * @param {number} e
 */
function eccentricAnomaly(M, e) {
  let E = M + e * Math.sin(M);
  for (let i = 0; i < 12; i++) {
    const dE = (M - (E - e * Math.sin(E))) / (1 - e * Math.cos(E));
    E += dE;
    if (Math.abs(dE) < 1e-12) break;
  }
  return E;
}

/**
 * A point on an ellipse in its plane, turned into the reference frame.
 * Angles in degrees.
 * @param {number} a
 * @param {number} e
 * @param {number} M - mean anomaly
 * @param {number} w - argument of periapsis
 * @param {number} i - inclination
 * @param {number} node - longitude of the ascending node
 * @returns {Vec}
 */
function orbitPoint(a, e, M, w, i, node) {
  const Mr = ((((M % 360) + 540) % 360) - 180) * DEG;
  const E = eccentricAnomaly(Mr, e);
  const x = a * (Math.cos(E) - e);
  const y = a * Math.sqrt(1 - e * e) * Math.sin(E);
  const cw = Math.cos(w * DEG), sw = Math.sin(w * DEG);
  const cn = Math.cos(node * DEG), sn = Math.sin(node * DEG);
  const ci = Math.cos(i * DEG), si = Math.sin(i * DEG);
  return [
    (cw * cn - sw * sn * ci) * x + (-sw * cn - cw * sn * ci) * y,
    (cw * sn + sw * cn * ci) * x + (-sw * sn + cw * cn * ci) * y,
    sw * si * x + cw * si * y
  ];
}

/**
 * Heliocentric ecliptic position (km) of a planet from Table 2a/2b.
 * @param {string} name - a PLANETS key
 * @param {number} d - days from J2000
 * @returns {Vec}
 */
function planetPosition(name, d) {
  const p = PLANETS[name];
  const T = d / 36525;
  const [a, e, I, L, peri, node] = p.el.map((v, k) => v + p.rate[k] * T);
  let M = L - peri;
  if (p.extra) {
    const [b, c, s, f] = p.extra;
    M += b * T * T + c * Math.cos(f * T * DEG) + s * Math.sin(f * T * DEG);
  }
  const r = orbitPoint(a, e, M, peri - node, I, node);
  return [r[0] * AU_KM, r[1] * AU_KM, r[2] * AU_KM];
}

/**
 * Heliocentric ecliptic position (km) of Pluto or Ceres.
 * @param {string} name
 * @param {number} d
 * @returns {Vec}
 */
function smallBodyPosition(name, d) {
  const [epoch, a, e, i, node, w, M0, n] = SMALL[name];
  const r = orbitPoint(a, e, M0 + n * (d + J2000 - epoch), w, i, node);
  return [r[0] * AU_KM, r[1] * AU_KM, r[2] * AU_KM];
}

/**
 * Equatorial (ICRF) to ecliptic J2000.
 * @param {Vec} v
 * @returns {Vec}
 */
function eqToEcl([x, y, z]) {
  const c = Math.cos(OBLIQ), s = Math.sin(OBLIQ);
  return [x, c * y + s * z, -s * y + c * z];
}

/**
 * A plane with its pole at (ra, dec) (ICRF, degrees): a vector in the
 * plane's own frame (x toward its ascending node on the ICRF equator, z the
 * pole) in ICRF.
 * @param {Vec} v
 * @param {number} ra
 * @param {number} dec
 * @returns {Vec}
 */
function planeToIcrf([x, y, z], ra, dec) {
  // Rz(ra + 90) Rx(90 - dec)
  const ci = Math.sin(dec * DEG), si = Math.cos(dec * DEG);
  const y1 = ci * y - si * z;
  const z1 = si * y + ci * z;
  const cn = Math.cos((ra + 90) * DEG), sn = Math.sin((ra + 90) * DEG);
  return [cn * x - sn * y1, sn * x + cn * y1, z1];
}

/**
 * A moon's position from its planet (ecliptic, km).
 * @param {string} name - a MOONS key or 'moon'
 * @param {number} d
 * @returns {Vec}
 */
function moonOffset(name, d) {
  if (name === 'moon') {
    const m = moonEcliptic(d);
    const cb = Math.cos(m.b);
    return [m.dist * cb * Math.cos(m.l), m.dist * cb * Math.sin(m.l), m.dist * Math.sin(m.b)];
  }
  const { el, plane } = MOONS[name];
  const [a, e, w0, L0, i, node0, P, Papsis, Pnode] = el;
  const years = d / 365.25;
  // Nodes regress on a prograde orbit and advance on a retrograde one (Triton)
  const node = node0 - (Pnode ? Math.sign(Math.cos(i * DEG)) * (360 * years) / Pnode : 0);
  const w = w0 + (Papsis ? (360 * years) / Papsis : 0);
  // the angle along the orbit runs at the fitted rate whatever the apsis and node do
  return eqToEcl(planeToIcrf(orbitPoint(a, e, L0 + (360 * d) / P - node - w, w, i, node), plane[0], plane[1]));
}

/**
 * A body's heliocentric position, ecliptic J2000, km (the Sun at 0).
 * @param {string} name - a BODY_NAMES entry
 * @param {number} ms - time
 * @returns {Vec | null} null for an unknown name
 */
export function heliocentric(name, ms) {
  const d = daysJ2000(ms);
  if (name === 'sun') return [0, 0, 0];
  if (name === 'earth') {
    const b = planetPosition('emb', d);
    const m = moonOffset('moon', d);
    const k = 1 / (1 + EMRAT);
    return [b[0] - m[0] * k, b[1] - m[1] * k, b[2] - m[2] * k];
  }
  if (PLANETS[name]) return planetPosition(name, d);
  if (SMALL[name]) return smallBodyPosition(name, d);
  const parent = BODIES[name]?.parent;
  if (!parent) return null;
  const base = heliocentric(parent, ms);
  if (!base) return null;
  const o = moonOffset(name, d);
  return [base[0] + o[0], base[1] + o[1], base[2] + o[2]];
}

/**
 * A body's position from another body (or the Sun), ecliptic J2000, km.
 * @param {string} name
 * @param {number} ms
 * @param {string} [center] - default the Sun
 * @returns {Vec | null}
 */
export function position(name, ms, center = 'sun') {
  // a moon from its own planet: no heliocentric round trip (precision)
  if (BODIES[name]?.parent === center && center !== 'sun') return moonOffset(name, daysJ2000(ms));
  const p = heliocentric(name, ms);
  const c = heliocentric(center, ms);
  return p && c ? [p[0] - c[0], p[1] - c[1], p[2] - c[2]] : null;
}

/**
 * Ecliptic J2000 axes to scene axes: y up = ecliptic north, ecliptic +y at
 * the scene's north (-z).
 * @param {Vec} v
 * @returns {Vec}
 */
export const toScene = ([x, y, z]) => [x, z, -y];

/**
 * Fractions of a turn to sample an orbit at, from -0.5 to 0.5 with 0 the
 * body now: `n` even steps, plus fine ones within a degree of the body so
 * the line passes through it seen from close by (true scale).
 * @param {number} n
 * @returns {number[]}
 */
function orbitSamples(n) {
  const set = new Set();
  for (let k = 0; k < n; k++) set.add(-0.5 + k / n);
  // within a degree in 0.01 degree steps, within 0.01 degree in 0.0002
  for (let k = -100; k <= 100; k++) set.add(k / 36000);
  for (let k = -50; k <= 50; k++) set.add(k / 1800000);
  return [...set].sort((a, b) => a - b);
}

/**
 * A body's orbit round its parent at a date, ecliptic km from the parent:
 * one turn, starting and ending opposite the body, through the body's spot
 * now (more points close to it). Planets, Pluto and Ceres: their ellipse at
 * the date (Earth's is the Earth-Moon barycentre's, which Earth swings
 * round by up to 4,700 km). Moons: one period of positions centred on the
 * date, so the Moon's line follows its series.
 * @param {string} name
 * @param {number} ms
 * @param {number} [n] - even steps round the whole orbit
 * @returns {Vec[] | null} null for the Sun or an unknown name
 */
export function orbitPath(name, ms, n = 256) {
  const parent = BODIES[name]?.parent;
  if (!parent) return null;
  const d = daysJ2000(ms);
  const u = orbitSamples(n);
  if (PLANETS[name] || name === 'earth') {
    const key = name === 'earth' ? 'emb' : name;
    const p = PLANETS[key];
    const T = d / 36525;
    const [a, e, I, L, peri, node] = p.el.map((v, k) => v + p.rate[k] * T);
    let M = L - peri;
    if (p.extra) {
      const [b, c, s, f] = p.extra;
      M += b * T * T + c * Math.cos(f * T * DEG) + s * Math.sin(f * T * DEG);
    }
    return u.map((f) => /** @type {Vec} */ (orbitPoint(a, e, M + 360 * f, peri - node, I, node).map((v) => v * AU_KM)));
  }
  if (SMALL[name]) {
    const [epoch, a, e, i, node, w, M0, nn] = SMALL[name];
    const M = M0 + nn * (d + J2000 - epoch);
    return u.map((f) => /** @type {Vec} */ (orbitPoint(a, e, M + 360 * f, w, i, node).map((v) => v * AU_KM)));
  }
  const P = periods(name)?.orbit ?? 1;
  return u.map((f) => moonOffset(name, d + P * f));
}

/**
 * How a body is turned at a date: its own axes in ecliptic J2000. x points
 * at the prime meridian (longitude 0) on the equator, y at longitude 90
 * east, z at the north pole (IAU: the pole on the north side of the
 * invariable plane; Venus, Uranus and Pluto spin backward round it).
 * @param {string} name
 * @param {number} ms
 * @returns {{ x: Vec, y: Vec, z: Vec } | null} null for an unknown name
 */
export function orientation(name, ms) {
  const r = ROTATION[name];
  if (!r) return null;
  const d = daysJ2000(ms);
  const T = d / 36525;
  let ra = r.ra[0] + r.ra[1] * T;
  let dec = r.dec[0] + r.dec[1] * T;
  let W = r.w[0] + r.w[1] * d;
  if (name === 'moon') {
    // the largest libration term (E1, the Moon's node): about 4 degrees on the pole
    const E1 = (125.045 - 0.0529921 * d) * DEG;
    ra -= 3.8787 * Math.sin(E1);
    dec += 1.5419 * Math.cos(E1);
    W += 3.5610 * Math.sin(E1);
  }
  if (name === 'neptune') {
    const N = (357.85 + 52.316 * T) * DEG;
    ra += 0.70 * Math.sin(N);
    dec -= 0.51 * Math.cos(N);
    W -= 0.48 * Math.sin(N);
  }
  W = ((W % 360) + 360) % 360;
  const cw = Math.cos(W * DEG), sw = Math.sin(W * DEG);
  return {
    x: eqToEcl(planeToIcrf([cw, sw, 0], ra, dec)),
    y: eqToEcl(planeToIcrf([-sw, cw, 0], ra, dec)),
    z: eqToEcl(planeToIcrf([0, 0, 1], ra, dec))
  };
}

/**
 * A sphere's local axes in scene axes for a body at a date. The sphere puts
 * latitude 90 at local +y and longitude 0 at local +z, east toward +x
 * (placements.js `latlonToLocal`), so local x = the body's y (90 east),
 * local y = its pole, local z = its prime meridian.
 * @param {string} name
 * @param {number} ms
 * @returns {{ x: Vec, y: Vec, z: Vec } | null}
 */
export function sphereAxes(name, ms) {
  const o = orientation(name, ms);
  return o ? { x: toScene(o.y), y: toScene(o.z), z: toScene(o.x) } : null;
}

/**
 * A body's axial tilt: the angle between its pole and its orbit's pole
 * (degrees; above 90 spins backward). For the Sun, to the ecliptic.
 * @param {string} name
 * @param {number} ms
 * @returns {number | null}
 */
export function axialTilt(name, ms) {
  const o = orientation(name, ms);
  if (!o) return null;
  let n = /** @type {Vec} */ ([0, 0, 1]);
  const path = BODIES[name]?.parent ? orbitPath(name, ms, 8) : null;
  if (path) {
    // the orbit's pole: two points a quarter turn apart
    const [a, b] = [path[0], path[2]];
    const c = [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
    const l = Math.hypot(c[0], c[1], c[2]);
    n = [c[0] / l, c[1] / l, c[2] / l];
  }
  const dot = n[0] * o.z[0] + n[1] * o.z[1] + n[2] * o.z[2];
  return Math.acos(Math.max(-1, Math.min(1, dot))) / DEG;
}

/**
 * Sidereal day (hours; negative spins backward) and orbital period (days).
 * @param {string} name
 * @returns {{ day: number, orbit: number | null } | null}
 */
export function periods(name) {
  const r = ROTATION[name];
  if (!r) return null;
  /** @type {number | null} */
  let orbit = null;
  if (PLANETS[name] || name === 'earth') orbit = 36525 * 360 / PLANETS[name === 'earth' ? 'emb' : name].rate[3];
  else if (SMALL[name]) orbit = 360 / SMALL[name][7];
  else if (MOONS[name]) orbit = MOONS[name].el[6];
  else if (name === 'moon') orbit = 27.321661;
  return { day: (24 * 360) / r.w[1], orbit };
}
