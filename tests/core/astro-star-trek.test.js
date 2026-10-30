/**
 * The Star Trek galaxy starter (R4c2) against what is recorded (Memory
 * Alpha, citing Star Trek: Star Charts and Stellar Cartography, and the
 * on-screen charts): real stars at their real galactic positions, the
 * quadrants by galactic longitude, and the recorded distances.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import starter, { starOffset, SOL } from '../../src/core/astrometrics/starters/scene-star-trek-galaxy.js';

const frag = starter.build({});
const at = (id) => frag.points.find((p) => p.id === id)?.xyz;
const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
/** galactic longitude and latitude of an offset from Sol (scene axes) */
const lb = ([x, y, z]) => {
  const r = Math.hypot(x, y, z);
  return [((Math.atan2(-x, -z) * 180) / Math.PI + 360) % 360, (Math.asin(y / r) * 180) / Math.PI];
};

test('starOffset: real stars at their published galactic coordinates (within 0.2 degrees)', () => {
  for (const [ra, dec, ly, l, b] of [
    [14.66, -60.834, 4.37, 315.7, -0.7], // Alpha Centauri
    [4.2545, -7.6529, 16.26, 200.8, -38.0], // 40 Eridani
    [7.655, 5.225, 11.46, 213.7, 13.0], // Procyon
    [21.115, 38.7494, 11.4, 82.3, -5.8] // 61 Cygni
  ]) {
    const o = starOffset(ra, dec, ly);
    const [gl, gb] = lb(o);
    assert.ok(Math.abs(gl - l) < 0.2 && Math.abs(gb - b) < 0.2, `${gl.toFixed(2)}, ${gb.toFixed(2)} vs ${l}, ${b}`);
    assert.ok(Math.abs(Math.hypot(...o) - ly) < 0.02);
  }
});

test('quadrants: Alpha is left of the Sol-core line (longitude 0 to 180), Beta right; Vulcan and Andoria in Beta, Tellar in Alpha (Star Charts)', () => {
  const side = (id) => Math.sign(at(id)[0] - SOL[0]);
  assert.equal(side('vulcan'), 1, 'Vulcan in Beta');
  assert.equal(side('andoria'), 1, 'Andoria in Beta');
  assert.equal(side('tellar'), -1, 'Tellar in Alpha');
  assert.equal(side('qonos'), 1, "Qo'noS in Beta");
  assert.equal(side('romulus'), 1, 'Romulus in Beta');
  assert.equal(side('bajor'), -1, 'Bajor in Alpha');
  assert.equal(side('cardassia'), -1, 'Cardassia in Alpha');
  const label = (id) => frag.points.find((p) => p.id === id);
  assert.equal(label('alpha').polar[1], 225);
  assert.equal(label('beta').polar[1], 135);
});

test('the recorded distances', () => {
  const sol = [...SOL];
  assert.ok(Math.abs(dist(at('vulcan'), sol) - 16.26) < 0.05, 'Vulcan 16 ly');
  assert.ok(Math.abs(dist(at('tellar'), sol) - 11.4) < 0.05, 'Tellar 11 ly');
  assert.ok(dist(at('qonos'), sol) > 100, "Qo'noS over 100 ly (Star Charts, the PIC chart)");
  assert.ok(Math.abs(dist(at('bajor'), at('cardassia')) - 5.25) < 0.15, 'Bajor to Cardassia 5.25 ly');
  assert.ok(Math.abs(dist(at('wormhole_gamma'), at('idran')) - 4.72) < 0.05, 'the far end 4.72 ly from Idran');
  assert.ok(Math.abs(dist(at('idran'), at('bajor')) - 70000) < 3000, 'Idran about 70,000 ly from Bajor');
  assert.ok(Math.abs(dist(at('ocampa'), sol) - 70000) < 3000, 'Ocampa about 70,000 ly from Earth');
  const r = (p) => Math.hypot(p[0], p[2]);
  assert.ok(r(at('idran')) >= 40000 && r(at('idran')) <= 51000, 'the Dominion 40,000 to 50,000 ly from the core');
  assert.equal(Math.hypot(...sol), 26000);
  const barrier = frag.objects.find((o) => o.id === 'great_barrier');
  assert.equal(barrier.radius * 2, 15000, 'the Great Barrier 15,000 ly across');
});

test('the Federation region spans about 8,000 ly and straddles the Alpha/Beta line at Sol', () => {
  const fed = frag.objects.find((o) => o.id === 'federation_space');
  const xs = fed.outline.map((p) => p[0]);
  const zs = fed.outline.map((p) => p[1]);
  const span = Math.max(Math.max(...xs) - Math.min(...xs), Math.max(...zs) - Math.min(...zs));
  assert.ok(span >= 7000 && span <= 9000, `${span} ly`);
  assert.ok(Math.min(...xs) < 0 && Math.max(...xs) > 0, 'both sides of the line');
});

test('the optional parts merge into a card made from the starter (same units, no clashing ids); Ferenginar at its recorded distances', async () => {
  const { applyStarter, STARTERS } = await import('../../src/core/astrometrics/starters/index.js');
  const byId = (id) => STARTERS.find((s) => s.id === id);
  let config = /** @type {any} */ (applyStarter({ type: 'custom:lcards-astrometrics-card' }, byId('star_trek_galaxy'))).config;
  for (const id of ['st_minor_powers', 'st_delta_powers', 'st_transwarp']) {
    const r = /** @type {any} */ (applyStarter(config, byId(id)));
    assert.equal(r.error, undefined, `${id}: ${r.error}`);
    config = r.config;
  }
  const point = (id) => config.points.find((p) => p.id === id).xyz;
  assert.ok(Math.abs(dist(point('ferenginar'), point('cardassia')) - 55) < 0.1);
  assert.ok(Math.abs(dist(point('ferenginar'), point('bajor')) - 60) < 0.1);
  assert.ok(dist(point('tw_earth'), [...SOL]) < 1, 'the transwarp aperture under a light year from Earth');
});
