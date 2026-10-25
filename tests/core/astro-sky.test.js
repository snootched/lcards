/**
 * Astrometrics sky model (src/core/astrometrics/sky.js) against PyEphem:
 * 50 stored rows (tests/core/fixtures/astro-sky-pyephem.json, made by the
 * .py next to it; no refraction). Thresholds from the E1 design: the sun
 * within 0.3 degrees, the moon within 0.4 (it is 0.5 wide), illumination
 * within 0.01. Plus sun.sun taking over when it has a position.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { sunPosition, moonPosition, sunFromHass, skyState, dayPath } from '../../src/core/astrometrics/sky.js';

const rows = JSON.parse(readFileSync(new URL('./fixtures/astro-sky-pyephem.json', import.meta.url), 'utf8'));

/** Angle between two sky positions, degrees */
function separation(az1, al1, az2, al2) {
  const r = Math.PI / 180;
  const c = Math.sin(al1 * r) * Math.sin(al2 * r) + Math.cos(al1 * r) * Math.cos(al2 * r) * Math.cos((az1 - az2) * r);
  return Math.acos(Math.max(-1, Math.min(1, c))) / r;
}

test('fixture: 50 PyEphem rows', () => {
  assert.equal(rows.length, 50);
});

test('sun matches PyEphem within 0.3 degrees', () => {
  let worst = 0;
  for (const row of rows) {
    const s = sunPosition(row.t, row.lat, row.lon);
    worst = Math.max(worst, separation(s.azimuth, s.altitude, row.sun[0], row.sun[1]));
  }
  assert.ok(worst < 0.3, `worst sun error ${worst.toFixed(3)} degrees`);
});

test('moon matches PyEphem within 0.4 degrees, illumination within 0.01', () => {
  let worst = 0;
  let worstPhase = 0;
  for (const row of rows) {
    const m = moonPosition(row.t, row.lat, row.lon);
    worst = Math.max(worst, separation(m.azimuth, m.altitude, row.moon[0], row.moon[1]));
    worstPhase = Math.max(worstPhase, Math.abs(m.fraction - row.moon[2]));
  }
  assert.ok(worst < 0.4, `worst moon error ${worst.toFixed(3)} degrees`);
  assert.ok(worstPhase < 0.01, `worst illumination error ${worstPhase.toFixed(4)}`);
});

test('azimuth is clockwise from north, 0 to 360', () => {
  for (const row of rows) {
    const s = sunPosition(row.t, row.lat, row.lon);
    assert.ok(s.azimuth >= 0 && s.azimuth < 360);
  }
  // Mid-northern latitude, local morning: the sun is in the east
  const toronto = sunPosition(Date.UTC(2026, 5, 21, 12, 0), 43.65, -79.38);
  assert.ok(toronto.azimuth > 45 && toronto.azimuth < 135, `morning sun azimuth ${toronto.azimuth}`);
  assert.ok(toronto.altitude > 0);
});

test('sun.sun azimuth / elevation win over the computed sun; without them it is computed', () => {
  const hass = { config: { latitude: 43.65, longitude: -79.38 }, states: { 'sun.sun': { state: 'above_horizon', attributes: { azimuth: 123.4, elevation: 21.5 } } } };
  assert.deepEqual(sunFromHass(hass), { azimuth: 123.4, altitude: 21.5 });
  const s = skyState(hass, Date.UTC(2026, 5, 21, 12, 0));
  assert.equal(s.sun.source, 'entity');
  assert.equal(s.sun.azimuth, 123.4);
  const computed = skyState({ config: hass.config, states: {} }, Date.UTC(2026, 5, 21, 12, 0));
  assert.equal(computed.sun.source, 'computed');
  assert.equal(sunFromHass({ states: { 'sun.sun': { attributes: { azimuth: 'x', elevation: 3 } } } }), null);
  assert.ok(computed.moon.illumination >= 0 && computed.moon.illumination <= 100);
  assert.deepEqual(computed.location, { latitude: 43.65, longitude: -79.38 });
});

test('dayPath: one sample every 5 minutes, midnight to midnight', () => {
  const p = dayPath('sun', 43.65, -79.38, Date.UTC(2026, 5, 21, 12, 0));
  assert.equal(p.length, 289);
  assert.ok(p.some((q) => q.altitude > 0) && p.some((q) => q.altitude < 0));
});
