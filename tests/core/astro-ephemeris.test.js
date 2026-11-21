/**
 * Astrometrics ephemeris (src/core/astrometrics/ephemeris.js) against JPL
 * Horizons: 20 bodies at 1950, 2000, 2026 and 2100
 * (tests/core/fixtures/astro-ephemeris-horizons.json, made by the .py next
 * to it). Planets heliocentric, moons from their planet. The moons' L0 and
 * P were fit at 2000 and 2026 (astro-ephemeris-fit-moons.mjs), so 1950 and
 * 2100 check them out of sample. Plus rotation: tilts, sidereal days, the
 * prime meridian, and the scene axes.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  position, heliocentric, orientation, sphereAxes, axialTilt, periods, orbitPath, toScene,
  BODIES, BODY_NAMES, outOfRange, daysJ2000, AU_KM
} from '../../src/core/astrometrics/ephemeris.js';

const fx = JSON.parse(readFileSync(new URL('./fixtures/astro-ephemeris-horizons.json', import.meta.url), 'utf8'));
const CENTER = { '500@10': 'sun', '500@399': 'earth', '500@499': 'mars', '500@599': 'jupiter', '500@699': 'saturn', '500@899': 'neptune', '500@999': 'pluto' };
const msOf = (jd) => (jd - 2440587.5) * 86400000;
/** Angle between two vectors, degrees */
const angle = (a, b) => Math.acos(Math.min(1, (a[0] * b[0] + a[1] * b[1] + a[2] * b[2]) / Math.hypot(...a) / Math.hypot(...b))) * 180 / Math.PI;
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];

/**
 * Worst direction error (degrees) and distance error (fraction) per body,
 * at each fixture date: [1950, 2000, 2026, 2100].
 */
const BOUNDS = {
  // planets: Standish Table 2a/2b, arcminutes inside, under half a degree for the giants
  mercury: [0.05, 0.001], venus: [0.05, 0.001], earth: [0.05, 0.001], mars: [0.1, 0.001],
  jupiter: [0.3, 0.002], saturn: [0.5, 0.003], uranus: [0.3, 0.003], neptune: [0.2, 0.002],
  // osculating elements: good near their epoch (Pluto 2016, Ceres 2026), drifting away
  pluto: [0.6, 0.006], ceres: [8, 0.015],
  // the lunar series
  moon: [0.1, 0.002],
  // mean elements: the shape is the table's, the angle fitted
  phobos: [10, 0.03], deimos: [1.5, 0.01], io: [3, 0.01], europa: [6, 0.015], ganymede: [1.5, 0.01],
  callisto: [0.5, 0.01], titan: [18, 0.07], triton: [1, 0.01], charon: [0.5, 0.01]
};

test('fixture: every body at four dates', () => {
  assert.equal(fx.jd_tdb.length, 4);
  for (const name of Object.keys(BOUNDS)) assert.equal(fx.bodies[name]?.xyz.length, 4, name);
});

for (const [name, [maxAngle, maxDist]] of Object.entries(BOUNDS)) {
  test(`${name} matches Horizons within ${maxAngle} degrees and ${+(maxDist * 100).toFixed(1)}% distance`, () => {
    const b = fx.bodies[name];
    fx.jd_tdb.forEach((jd, k) => {
      const p = position(name, msOf(jd), CENTER[b.center]);
      const r = b.xyz[k];
      const a = angle(p, r);
      const dr = Math.abs(Math.hypot(...p) / Math.hypot(...r) - 1);
      assert.ok(a < maxAngle, `${name} at JD ${jd}: ${a.toFixed(3)} degrees`);
      assert.ok(dr < maxDist, `${name} at JD ${jd}: distance off by ${(dr * 100).toFixed(2)}%`);
    });
  });
}

test('within the fit window every moon is within a degree', () => {
  for (const name of ['phobos', 'deimos', 'io', 'europa', 'ganymede', 'callisto', 'titan', 'triton', 'charon']) {
    const b = fx.bodies[name];
    for (const k of [1, 2]) {
      const a = angle(position(name, msOf(fx.jd_tdb[k]), CENTER[b.center]), b.xyz[k]);
      assert.ok(a < 1, `${name} at JD ${fx.jd_tdb[k]}: ${a.toFixed(3)} degrees`);
    }
  }
});

test('a moon is its planet plus its offset; the Sun sits at 0', () => {
  const t = Date.UTC(2026, 9, 30);
  const io = heliocentric('io', t);
  const j = heliocentric('jupiter', t);
  const o = position('io', t, 'jupiter');
  for (let i = 0; i < 3; i++) assert.ok(Math.abs(io[i] - j[i] - o[i]) < 1, 'within a km');
  assert.deepEqual(heliocentric('sun', t), [0, 0, 0]);
  assert.equal(heliocentric('vulcan', t), null);
  assert.equal(position('vulcan', t), null);
});

test('every body has a position, an orientation, a period and a radius', () => {
  const t = Date.UTC(2026, 9, 30);
  assert.equal(BODY_NAMES[0], 'sun');
  for (const name of BODY_NAMES) {
    assert.ok(heliocentric(name, t)?.every(Number.isFinite), `${name} position`);
    assert.ok(orientation(name, t), `${name} orientation`);
    assert.ok(periods(name)?.day, `${name} day`);
    assert.ok(BODIES[name].radius > 0, `${name} radius`);
  }
});

test('axial tilts match the published values', () => {
  const t = Date.UTC(2026, 9, 30);
  // IAU poles are on the north side of the invariable plane: Venus, Uranus
  // and Pluto spin backward round them, so their tilt reads as 180 minus the usual figure
  const TILT = { earth: 23.44, mars: 25.19, jupiter: 3.13, saturn: 26.73, neptune: 28.32, venus: 180 - 177.36, uranus: 180 - 97.77, moon: 6.68 };
  for (const [name, want] of Object.entries(TILT)) {
    const got = axialTilt(name, t);
    assert.ok(Math.abs(got - want) < 0.2, `${name}: ${got.toFixed(2)}, want ${want}`);
  }
});

test('sidereal days and orbits', () => {
  assert.ok(Math.abs(periods('earth').day - 23.9345) < 0.001);
  assert.ok(Math.abs(periods('earth').orbit - 365.256) < 0.01);
  assert.ok(Math.abs(periods('mars').day - 24.6229) < 0.001);
  assert.ok(Math.abs(periods('jupiter').day - 9.925) < 0.001);
  assert.ok(periods('venus').day < 0, 'Venus spins backward');
  assert.ok(Math.abs(periods('moon').day / 24 - periods('moon').orbit) < 0.01, 'the Moon is locked');
});

test('Earth turns its prime meridian to the Sun at noon UTC (equation of time aside)', () => {
  // 2026-04-15: the equation of time is near zero
  const t = Date.UTC(2026, 3, 15, 12);
  const o = orientation('earth', t);
  const toSun = heliocentric('earth', t).map((v) => -v);
  // the prime meridian and the Sun, both on Earth's equator plane
  const flat = (v) => { const k = dot(v, o.z); return [v[0] - k * o.z[0], v[1] - k * o.z[1], v[2] - k * o.z[2]]; };
  assert.ok(angle(flat(o.x), flat(toSun)) < 1.5, `${angle(flat(o.x), flat(toSun)).toFixed(2)} degrees`);
});

test('the Moon keeps its near side (longitude 0) toward Earth', () => {
  for (const day of [0, 7, 14, 21]) {
    const t = Date.UTC(2026, 9, 1 + day);
    const toEarth = position('moon', t, 'earth').map((v) => -v);
    const a = angle(orientation('moon', t).x, toEarth);
    assert.ok(a < 10, `day ${day}: ${a.toFixed(2)} degrees (libration)`);
  }
});

test('orientation axes are orthonormal and right-handed; sphere axes map them to the sphere', () => {
  const t = Date.UTC(2026, 9, 30);
  const o = orientation('saturn', t);
  for (const v of [o.x, o.y, o.z]) assert.ok(Math.abs(Math.hypot(...v) - 1) < 1e-9);
  assert.ok(Math.abs(dot(o.x, o.y)) < 1e-9 && Math.abs(dot(o.y, o.z)) < 1e-9);
  const cross = [o.x[1] * o.y[2] - o.x[2] * o.y[1], o.x[2] * o.y[0] - o.x[0] * o.y[2], o.x[0] * o.y[1] - o.x[1] * o.y[0]];
  assert.ok(angle(cross, o.z) < 1e-6, 'x cross y = z');
  const s = sphereAxes('saturn', t);
  assert.deepEqual(s.y, toScene(o.z), 'local y is the pole');
  assert.deepEqual(s.z, toScene(o.x), 'local z is longitude 0');
  assert.deepEqual(s.x, toScene(o.y), 'local x is 90 east');
});

test('scene axes: y is ecliptic north, ecliptic +y at bearing 0 (-z), handedness kept', () => {
  // + 0 turns -0 into 0
  const scene = (v) => toScene(v).map((n) => n + 0);
  assert.deepEqual(scene([0, 0, 1]), [0, 1, 0]);
  assert.deepEqual(scene([0, 1, 0]), [0, 0, -1]);
  assert.deepEqual(scene([1, 0, 0]), [1, 0, 0]);
  // Earth goes round anticlockwise seen from above: from ecliptic +x toward +y, so from +x toward -z
  const a = toScene(heliocentric('earth', Date.UTC(2026, 8, 22)));
  const b = toScene(heliocentric('earth', Date.UTC(2026, 9, 22)));
  const turn = a[2] * b[0] - a[0] * b[2];
  assert.ok(turn > 0, 'anticlockwise from above');
});

test('orbit paths: closed loops through the body (finely near it), the Moon from its series', () => {
  const t = Date.UTC(2026, 9, 30);
  for (const name of ['mars', 'earth', 'pluto', 'ceres', 'moon', 'io', 'triton', 'phobos']) {
    const path = orbitPath(name, t, 360);
    assert.ok(path.length > 360, `${name}: even steps plus fine ones`);
    const p = position(name, t, BODIES[name].parent);
    const nearest = Math.min(...path.map((q) => Math.hypot(q[0] - p[0], q[1] - p[1], q[2] - p[2])));
    // Earth swings round the barycentre's orbit by up to 4,700 km; the rest lie on their line
    const allowed = name === 'earth' ? 5000 : 1;
    assert.ok(nearest < allowed, `${name}: ${nearest.toFixed(1)} km from its line`);
    // segments next to the body are short: the line passes through it seen from close by
    const i = path.findIndex((q) => Math.hypot(q[0] - p[0], q[1] - p[1], q[2] - p[2]) === nearest);
    const next = path[i + 1];
    const seg = Math.hypot(next[0] - path[i][0], next[1] - path[i][1], next[2] - path[i][2]);
    assert.ok(seg < 2e-6 * 2 * Math.PI * Math.hypot(...p) * 10, `${name}: ${seg.toFixed(1)} km steps near the body`);
  }
  assert.equal(orbitPath('sun', t), null);
  const r = orbitPath('mars', t, 4).map((q) => Math.hypot(...q) / AU_KM);
  assert.ok(Math.min(...r) > 1.37 && Math.max(...r) < 1.67, 'Mars between perihelion and aphelion');
});

test('the valid range: 3000 BC to 3000 AD', () => {
  assert.equal(outOfRange(Date.UTC(2026, 0, 1)), false);
  assert.equal(outOfRange(Date.UTC(3100, 0, 1)), true);
  assert.ok(Math.abs(daysJ2000(Date.UTC(2000, 0, 1, 12))) < 1e-9);
});
