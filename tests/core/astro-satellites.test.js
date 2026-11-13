/**
 * Earth satellites (src/core/astrometrics/satellites.js, F1 2026-11-12): the shipped
 * snapshot and the orbit maths against well-known facts (sidereal time, stations of
 * geostationary satellites, periods, the ISS's node drift), and orbits worked out
 * from two live fixes (an entity's latitude and longitude, as satellite tracker integrations give).
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  satelliteData, prepareOrbit, positionAt, orbitAt, toEarthFixed, fromEarthFixed, siderealAngle,
  drawnHeight, orbitFromFixes, anomalyShiftTo, SATELLITE_NAMES, SATELLITE_GROUPS, EARTH_RADIUS, expandSatelliteGroups, groupMembers,
} from '../../src/core/astrometrics/satellites.js';
import * as names from '../../src/core/astrometrics/names.js';
import { Object3D } from 'three';
import { Placements } from '../../src/core/astrometrics/placements.js';
import { satelliteFix } from '../../src/core/astrometrics/point-data.js';

const DEG = 180 / Math.PI;
const near = (/** @type {number} */ a, /** @type {number} */ b, /** @type {number} */ tol, /** @type {string} */ what) =>
  assert.ok(Math.abs(a - b) <= tol, `${what}: ${a} not within ${tol} of ${b}`);
const orbit = (/** @type {string | number} */ ref) => {
  const d = satelliteData(ref);
  assert.ok(d, `no data for ${ref}`);
  return { o: prepareOrbit(d.elements), t: d.elements.epoch };
};

test('every built-in name and group member has shipped elements', () => {
  for (const name of Object.keys(SATELLITE_NAMES)) assert.ok(satelliteData(name), name);
  for (const [g, ids] of Object.entries(SATELLITE_GROUPS)) {
    assert.ok(ids.length > 0, g);
    for (const id of ids) assert.ok(satelliteData(id), `${g}: ${id}`);
  }
  assert.ok(SATELLITE_GROUPS.gps.length >= 24 && SATELLITE_GROUPS.galileo.length >= 20);
  assert.equal(satelliteData('ISS')?.id, 25544);       // any case
  assert.equal(satelliteData('25544')?.name, 'ISS');    // NORAD id as digits
  assert.equal(satelliteData('no_such'), null);
});

test('Greenwich sidereal time at J2000 noon is 280.4606 degrees', () => {
  near(siderealAngle(Date.UTC(2000, 0, 1, 12)) * DEG, 280.46062, 1e-4, 'GMST');
});

test('ISS: about 93 minutes round at about 420 km, its plane drifting about 5 degrees a day', () => {
  const { o, t } = orbit('iss');
  near(o.period / 60, 92.9, 1, 'period (min)');
  near(o.nodeRate * DEG * 86400, -5.0, 0.2, 'node drift (deg/day)');
  let maxLat = 0;
  for (const p of orbitAt(o, t)) {
    const f = toEarthFixed(p, t);
    near(f.height, 420, 40, 'height (km)');
    maxLat = Math.max(maxLat, Math.abs(f.lat));
  }
  near(maxLat, 51.64, 0.3, 'highest latitude = inclination');
});

test('geostationary satellites sit at their stations and stay there for months', () => {
  const stations = { goes_east: -75.2, goes_west: -137.0, meteosat: 0, himawari: 140.7 };
  for (const [name, lon] of Object.entries(stations)) {
    const { o, t } = orbit(name);
    for (const days of [0, 30, 120]) {
      const ms = t + days * 86400000;
      const f = toEarthFixed(positionAt(o, ms), ms);
      near(f.lon, lon, 1.5, `${name} longitude after ${days} days`);
      near(f.lat, 0, 1.5, `${name} latitude`);
      near(f.height, 35786, 60, `${name} height`);
    }
  }
});

test('GPS satellites go round in half a sidereal day', () => {
  for (const id of SATELLITE_GROUPS.gps) near(orbit(id).o.period / 60, 718, 2, `GPS ${id} period (min)`);
});

test('Earth-fixed and inertial positions convert both ways', () => {
  const ms = Date.UTC(2026, 10, 12, 18, 30);
  const p = fromEarthFixed(40, -75, EARTH_RADIUS + 420, ms);
  const f = toEarthFixed(p, ms);
  near(f.lat, 40, 1e-9, 'lat');
  near(f.lon, -75, 1e-9, 'lon');
  near(f.height, 420, 1e-6, 'height');
});

test('two live fixes a minute apart give the orbit: plane, period, and where it goes next', () => {
  const { o, t } = orbit('iss');
  const fix = (/** @type {number} */ ms) => {
    const f = toEarthFixed(positionAt(o, ms), ms);
    // what a tracker's entity reports: latitude and longitude only, height from the snapshot
    return fromEarthFixed(f.lat, f.lon, EARTH_RADIUS + 420, ms);
  };
  const t1 = t + 3600000, t2 = t1 + 60000;
  const live = orbitFromFixes(fix(t1), t1, fix(t2), t2);
  assert.ok(live);
  near(live.i * DEG, 51.64, 0.5, 'inclination');
  near(live.period / 60, 92.9, 2, 'period (min)');
  // five minutes on, the circular orbit is still within a few tens of km of the real one
  const later = t2 + 300000;
  const a = positionAt(live, later), b = positionAt(o, later);
  assert.ok(Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]) < 60, 'five minutes on');
  // fixes that do not span a plane
  assert.equal(orbitFromFixes(fix(t1), t1, fix(t1), t1), null);
});

test('a live fix pulls a shipped orbit\'s dot onto it', () => {
  const { o, t } = orbit('iss');
  const ms = t + 20 * 86400000;
  // the real ISS is somewhere else along the same plane (drag, reboosts): 40 degrees on
  const real = positionAt(o, ms, 40 / DEG);
  const shift = anomalyShiftTo(o, real, ms);
  near(shift * DEG, 40, 0.5, 'shift (deg)');
  const moved = positionAt(o, ms, shift);
  assert.ok(Math.hypot(moved[0] - real[0], moved[1] - real[1], moved[2] - real[2]) < 20);
  // equatorial orbits too (no division by sin i)
  const geo = orbit('goes_east');
  const g = positionAt(geo.o, geo.t, -0.3);
  near(anomalyShiftTo(geo.o, g, geo.t), -0.3, 1e-3, 'geostationary shift');
});

test('diagram heights lift low orbits and bring geostationary in, in order', () => {
  const real = [420, 20200, 35786].map((km) => drawnHeight(km, 'real'));
  const diagram = [420, 20200, 35786].map((km) => drawnHeight(km, 'diagram'));
  near(real[2], 35786 / EARTH_RADIUS, 1e-9, 'real is km over the radius');
  assert.ok(diagram[0] > real[0] * 3, 'ISS lifted');
  assert.ok(diagram[2] < real[2] / 2, 'geostationary brought in');
  assert.ok(diagram[0] < diagram[1] && diagram[1] < diagram[2], 'order kept');
});

// ── Live fixes through the placements (what the card feeds from an entity) ──

/** An Earth sphere of radius 100 at the origin, not turned (its local frame is Earth-fixed) */
const earthHost = () => {
  const node = new Object3D();
  node.updateMatrixWorld(true);
  return { node, radius: 100 };
};
/** Latitude and longitude of the shipped ISS at a date (what a tracker's entity would report) */
const issFix = (/** @type {number} */ ms, shift = 0) => {
  const { o } = orbit('iss');
  const f = toEarthFixed(positionAt(o, ms, shift), ms);
  return [f.lat, f.lon, ms];
};
/** Latitude and longitude of a placed point on the unturned host */
const latlonOf = (/** @type {any} */ v) => {
  const r = v.length();
  return { r, lat: Math.asin(v.y / r) * DEG, lon: Math.atan2(v.x, v.z) * DEG };
};

test('the entity\'s position reads latitude / longitude, else lat / long', () => {
  assert.deepEqual(satelliteFix({ attributes: { latitude: 10, longitude: 20 }, last_updated: '2026-11-13T00:00:00Z' }), [10, 20, Date.parse('2026-11-13T00:00:00Z')]);
  assert.deepEqual(satelliteFix({ attributes: { lat: '-5.5', long: '170' }, last_updated: '2026-11-13T00:00:00Z' })?.slice(0, 2), [-5.5, 170]);
  assert.equal(satelliteFix({ attributes: {} }), null);
  assert.equal(satelliteFix({ attributes: { latitude: null, longitude: 3 } }), null);
});

test('a satellite LCARdS does not ship gets its orbit from two live fixes and moves on along it', (t) => {
  const { t: epoch } = orbit('iss');
  const t1 = epoch + 3600000, t2 = t1 + 60000, at = t2 + 120000;
  t.mock.method(performance, 'now', () => 1e9);   // the ease long done
  const places = new Placements({
    points: [{ id: 'sat', satellite: 99999, object: 'earth', entity: 'device_tracker.sat' }],
    hosts: new Map([['earth', earthHost()]]),
    date: () => at,
  });
  assert.equal(places.get('sat'), null);              // no data, no fix yet
  places.setPosition('sat', /** @type {any} */ ('fix'), issFix(t1));
  assert.ok(places.get('sat'));                        // one fix: drawn there, height guessed
  places.setPosition('sat', /** @type {any} */ ('fix'), issFix(t2));
  const p = latlonOf(places.get('sat'));
  const truth = issFix(at);
  near(p.lat, truth[0], 1, 'latitude two minutes after the fix');
  near(((p.lon - truth[1] + 540) % 360) - 180, 0, 1.5, 'longitude two minutes after the fix');
  near((p.r / 100 - 1) * EARTH_RADIUS, 420, 40, 'height from the rate (km)');
  assert.equal(places.satelliteOrbit('sat')?.length, 128);
});

test('a live fix eases a shipped satellite onto the real place along its orbit', (t) => {
  const { t: epoch } = orbit('iss');
  const at = epoch + 20 * 86400000;
  let now = 0;
  t.mock.method(performance, 'now', () => now);
  const places = new Placements({
    points: [{ id: 'iss', satellite: 'iss', object: 'earth', entity: 'sensor.iss_status' }],
    hosts: new Map([['earth', earthHost()]]),
    date: () => at,
  });
  const before = latlonOf(places.get('iss'));
  // the real ISS is 40 degrees further on than the shipped elements say
  const real = issFix(at, 40 / DEG);
  places.setPosition('iss', /** @type {any} */ ('fix'), real);
  places.invalidate();
  const start = latlonOf(places.get('iss'));
  near(start.lat, before.lat, 1e-6, 'no jump at the fix');
  now = 1000;
  places.invalidate();
  const half = latlonOf(places.get('iss'));
  assert.ok(Math.abs(half.lat - before.lat) > 0.5, 'moving toward it');
  now = 5000;
  places.invalidate();
  const end = latlonOf(places.get('iss'));
  near(end.lat, real[0], 0.3, 'eased onto the fix (latitude)');
  near(((end.lon - real[1] + 540) % 360) - 180, 0, 0.5, 'eased onto the fix (longitude)');
});

test('the names the schema and editor list are the shipped ones', () => {
  assert.deepEqual([...names.SATELLITE_NAMES], Object.keys(SATELLITE_NAMES));
  assert.deepEqual([...names.SATELLITE_GROUPS], Object.keys(SATELLITE_GROUPS));
});

test('a satellites object becomes a point per member and, with orbits, a ring each', () => {
  const warnings = /** @type {string[]} */ ([]);
  const cfg = expandSatelliteGroups({
    points: [{ id: 'home', latlon: [0, 0], object: 'earth' }],
    objects: [
      { type: 'sphere', id: 'earth', radius: 100 },
      { type: 'ring', radius: 5 },
      { type: 'satellites', group: 'stations', satellites: ['iss', 'hubble', 99999], object: 'earth', heights: 'diagram', color: 'var(--lcars-blue)', label: true, orbits: { width: 1 } },
      { type: 'ring', radius: 6 },
    ],
  }, (m) => warnings.push(m));
  const pts = cfg.points.slice(1);
  assert.deepEqual(pts.map((/** @type {any} */ p) => p.id), ['satellites#1.25544', 'satellites#1.48274', 'satellites#1.20580']);
  assert.deepEqual(pts[0], { id: 'satellites#1.25544', satellite: 25544, object: 'earth', marker: 'dot', heights: 'diagram', color: 'var(--lcars-blue)', label: 'ISS', style: 'tiny' });
  const rings = cfg.objects.slice(4);
  assert.equal(rings.length, 3);
  assert.deepEqual(rings[0], { width: 1, type: 'ring', id: 'satellites#1.25544.orbit', satellite: 'satellites#1.25544', color: 'var(--lcars-blue)' });
  // the config's own rings keep their ring#n (the generated ones come after them)
  assert.deepEqual(names.objectIds(cfg.objects).slice(0, 4), ['earth', 'ring#1', 'satellites#1', 'ring#2']);
  assert.match(warnings.join(), /99999/);
  // no group, nothing changes
  const plain = { objects: [{ type: 'sphere' }] };
  assert.equal(expandSatelliteGroups(plain), plain);
  assert.equal(groupMembers({ group: 'gps' }).ids.length, SATELLITE_GROUPS.gps.length);
  assert.deepEqual(groupMembers({ group: 'nope' }).unknown, ['group nope']);
});
