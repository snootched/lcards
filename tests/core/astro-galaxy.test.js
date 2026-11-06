/**
 * Astrometrics `type: galaxy` (R4c1, src/core/astrometrics/objects/galaxy.js)
 * and the `prism` volume: the Milky Way model (bar, arms from its ends, the
 * spur at the Sun), stars along their spirals, seeded scatter, the parts'
 * shares, the blobs, and a prism's caps, walls and edges.
 */
import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { installJsdom } from '../helpers/jsdom-env.js';

const env = installJsdom();
after(() => env.restore());
const { galaxyModel, galaxyStars, galaxyBlobs, armBearing, MILKY_WAY_ARMS, SUN_FRACTION } = await import('../../src/core/astrometrics/objects/galaxy.js');
const { prismOutline } = await import('../../src/core/astrometrics/objects/volume.js');
const { buildScene } = await import('../../src/core/astrometrics/scene-builder.js');
const { seededRandom } = await import('../../src/core/packs/backgrounds/webgl/scenes/scene-helpers.js');

const ctx = () => /** @type {any} */ ({ color: () => [1, 0.8, 0.5, 1], places: null, sky: () => null, requestFrame: () => {}, loadTexture: () => null });

test('the Milky Way model: four arms and the spur, a bar 0.32 of the radius, the Sun at 0.52', () => {
  const m = galaxyModel({});
  assert.equal(m.R, 50000);
  assert.equal(m.bar, 16000);
  assert.equal(m.pitch, 12);
  assert.deepEqual(m.arms.map((a) => a.name), MILKY_WAY_ARMS.map((a) => a.name));
  assert.equal(SUN_FRACTION, 0.52);
  // the two major arms start at the bar's ends, half a turn apart
  const [sc, pe] = m.arms;
  assert.equal(((pe.start - sc.start) % 360 + 360) % 360, 180);
  assert.equal(sc.start, m.barAngle);
  // n equal arms instead
  const g = galaxyModel({ arms: { count: 3 }, radius: 100, bar: { length: 0 } });
  assert.equal(g.arms.length, 3);
  assert.equal(g.bar, 0);
  assert.equal(g.R, 100);
});

test('a logarithmic spiral: each e-fold of radius turns the arm by 1 / tan(pitch) radians', () => {
  const turn = armBearing(0, 10, 10 * Math.E, 12) - armBearing(0, 10, 10, 12);
  assert.ok(Math.abs(turn - 1 / Math.tan(12 * Math.PI / 180) * 180 / Math.PI) < 1e-9);
});

test('stars: seeded (the same config, the same galaxy), every part present, the arms the largest, all inside the disc', () => {
  const m = galaxyModel({});
  const a = galaxyStars(m, 5000, seededRandom(3));
  const b = galaxyStars(m, 5000, seededRandom(3));
  assert.deepEqual(a.positions, b.positions);
  const counts = [0, 0, 0, 0];
  for (const p of a.parts) counts[p]++;
  assert.ok(counts.every((c) => c > 0), `parts ${counts}`);
  assert.ok(counts[2] > counts[0] && counts[2] > counts[3], 'the arms hold the most');
  let outside = 0;
  for (let i = 0; i < 5000; i++) if (Math.hypot(a.positions[i * 3], a.positions[i * 3 + 2]) > 1.2 * m.R) outside++;
  assert.ok(outside < 50, `${outside} stars far outside`);
  // thin: most stars within a few thicknesses of the plane
  let thick = 0;
  for (let i = 0; i < 5000; i++) if (Math.abs(a.positions[i * 3 + 1]) > 0.1 * m.R) thick++;
  assert.ok(thick < 500, `${thick} stars off the plane`);
});

test('arm stars follow their spirals; no bar, no bar stars', () => {
  const m = galaxyModel({ arms: { count: 2, pitch: 15 }, bar: { length: 0 }, radius: 1000 });
  const { positions, parts } = galaxyStars(m, 4000, seededRandom(9));
  const r0 = 0.12 * m.R;
  let near = 0, arm = 0;
  for (let i = 0; i < parts.length; i++) {
    assert.notEqual(parts[i], 1, 'no bar stars');
    if (parts[i] !== 2) continue;
    arm++;
    const x = positions[i * 3], z = positions[i * 3 + 2];
    const r = Math.hypot(x, z);
    const b = (Math.atan2(x, -z) * 180) / Math.PI;
    // the nearest arm's bearing at this radius
    const d = Math.min(...m.arms.map((a) => {
      const e = ((armBearing(a.start, r0, r, m.pitch) - b) % 360 + 540) % 360 - 180;
      return Math.abs(e);
    }));
    if (d < 25 || r < 2 * r0) near++;
  }
  assert.ok(near / arm > 0.8, `${near} of ${arm} arm stars near an arm`);
});

test('blobs: glow along the arms and dust beside them, sized by the radius', () => {
  const m = galaxyModel({ radius: 1000 });
  const { glow, dust } = galaxyBlobs(m, 100, seededRandom(1));
  assert.equal(glow.length, 100);
  assert.equal(dust.length, 100);
  assert.ok(glow.every((g) => g[3] >= 50 && g[3] <= 100));
});

test('a galaxy builds: one star field and its blobs, a flat object of its radius', () => {
  const w = buildScene({ objects: [{ type: 'galaxy', id: 'mw', stars: { count: 2000 }, radius: 100 }] }, ctx());
  const b = w.objects.get('mw');
  assert.equal(b.type, 'galaxy');
  assert.equal(b.radius, 100);
  assert.equal(b.flat, true);
  assert.ok(b.field, 'a star field');
  const body = /** @type {any} */ (b.node.getObjectByName('galaxy-body'));
  assert.equal(body.children.length, 4, 'stars, arm glow, core glow, dust');
  const none = buildScene({ objects: [{ type: 'galaxy', id: 'g', stars: { count: 10 }, glow: 0, dust: { amount: 0 } }] }, ctx()).objects.get('g');
  assert.equal(/** @type {any} */ (none.node.getObjectByName('galaxy-body')).children.length, 1, 'no glow, no dust');
});

test('prism: an outline of at least 3 [x, z] points; caps, a wall per side, its edges', () => {
  assert.equal(prismOutline([[0, 0], [1, 1]]), null);
  assert.deepEqual(prismOutline([[0, 0], ['1', 0], [0, 1], 'x']), [[0, 0], [1, 0], [0, 1]]);
  const outline = [[-10, -10], [10, -10], [15, 5], [0, 12], [-12, 4]];
  const w = buildScene({ objects: [{ type: 'volume', id: 't', shape: 'prism', outline, height: [-2, 4] }] }, ctx());
  const b = w.objects.get('t');
  assert.equal(b.gridFaces.length, 2 + outline.length, 'two caps and five walls');
  assert.deepEqual(b.centre.map((v) => Math.round(v * 10) / 10), [0.6, 1, 0.2]);
  // a cap covers the polygon: its triangles add up to the outline's area
  const cap = b.gridFaces[0].children[0].geometry;
  const pos = cap.getAttribute('position').array;
  const idx = cap.getIndex().array;
  let area = 0;
  for (let i = 0; i < idx.length; i += 3) {
    const [a, c, d] = [idx[i], idx[i + 1], idx[i + 2]].map((k) => [pos[k * 3], pos[k * 3 + 2]]);
    area += Math.abs((c[0] - a[0]) * (d[1] - a[1]) - (d[0] - a[0]) * (c[1] - a[1])) / 2;
  }
  let shoelace = 0;
  outline.forEach(([x, z], i) => { const [x2, z2] = outline[(i + 1) % outline.length]; shoelace += x * z2 - x2 * z; });
  assert.ok(Math.abs(area - Math.abs(shoelace) / 2) < 1e-6);
});

test('the Milky Way\'s arms cross the Sun\'s line in their real order: Scutum-Centaurus, Sagittarius (inside the Sun), Perseus (outside), Norma', () => {
  const m = galaxyModel({});
  const sunR = SUN_FRACTION * m.R;
  /** where an arm first crosses bearing 180: the turn from its start, through the spiral */
  const cross = (a) => m.bar * Math.exp(((((180 - a.start) % 360) + 360) % 360) * (Math.PI / 180) * Math.tan(m.pitch * Math.PI / 180));
  const r = Object.fromEntries(m.arms.filter((a) => !a.spur).map((a) => [a.name, cross(a)]));
  assert.ok(r['Scutum-Centaurus'] < r.Sagittarius && r.Sagittarius < sunR && sunR < r.Perseus && r.Perseus < r.Norma, JSON.stringify(r));
  assert.ok(Math.abs(r.Sagittarius - 24700) < 1500 && Math.abs(r.Perseus - 34500) < 1500, JSON.stringify(r));
});

test('U1: galaxy radius: the Milky Way\'s 50000 ly by default, in the frame\'s named units', () => {
  assert.equal(galaxyModel({}).R, 50000);
  assert.equal(galaxyModel({}, 9.4607304725808e12).R, 50000);
  assert.ok(Math.abs(galaxyModel({}, 149597870.7).R / ((50000 * 9.4607304725808e12) / 149597870.7) - 1) < 1e-9);
  assert.equal(galaxyModel({ radius: 100 }, 149597870.7).R, 100, 'a set radius stays');
});
