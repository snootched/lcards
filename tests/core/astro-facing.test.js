/**
 * `face: motion` (src/core/astrometrics/facing.js, M3): an object at a moving
 * point turns its +z along the travel, upright, with its `rotation` on top;
 * tiny steps far out are noise; before the point moves (and under reduced
 * motion, which holds spin) a point on a spinning object faces along the
 * spin; in a scene the outer group turns as the ring carries the point.
 */
import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { installJsdom } from '../helpers/jsdom-env.js';

const env = installJsdom();
after(() => env.restore());
const { Group, MathUtils, Vector3 } = await import('three');
const { Facing, spinTangent, rotationQuaternion } = await import('../../src/core/astrometrics/facing.js');
const { buildScene } = await import('../../src/core/astrometrics/scene-builder.js');

function ctx() {
  return { color: () => [1, 0.6, 0.4, 1], places: null, sky: () => null, requestFrame: () => {}, loadTexture: () => null };
}
/** Where the group's +z (the bow) points */
const bow = (g) => new Vector3(0, 0, 1).applyQuaternion(g.quaternion);
const near = (a, b, eps = 1e-6) => assert.ok(a.distanceTo(b) < eps, `${a.toArray()} vs ${b.toArray()}`);

test('Facing: +z along the travel, upright; rotation on top', () => {
  const f = new Facing();
  const g = new Group();
  f.move(new Vector3(0, 0, 0));
  assert.equal(f.orient(g, {}, f.dir), false, 'not moved yet, no direction: keeps its rotation');
  f.move(new Vector3(5, 0, 0));
  assert.equal(f.orient(g, {}, f.dir), true);
  near(bow(g), new Vector3(1, 0, 0));
  near(new Vector3(0, 1, 0).applyQuaternion(g.quaternion), new Vector3(0, 1, 0));
  assert.equal(f.orient(g, {}, f.dir), false, 'unchanged: no turn');
  // climbing: the bow follows, the top tips back
  f.move(new Vector3(10, 5, 0));
  f.orient(g, {}, f.dir);
  near(bow(g), new Vector3(1, 1, 0).normalize());
  // rotation on top, in the object's own frame: the facing alone, then the rotation
  const h = new Group();
  f.orient(h, { rotation: [0, 90, 0] }, f.dir);
  const expected = g.quaternion.clone().multiply(rotationQuaternion({ rotation: [0, 90, 0] }));
  assert.ok(Math.abs(h.quaternion.dot(expected)) > 1 - 1e-9);
  // a file whose bow is along +x: rotation [0, 90, 0] (a bearing of 90) turns its +x onto the travel
  const x = new Group();
  const k = new Facing();
  k.move(new Vector3(0, 0, 0));
  k.move(new Vector3(0, 0, -3));
  k.orient(x, { rotation: [0, 90, 0] }, k.dir);
  near(new Vector3(1, 0, 0).applyQuaternion(x.quaternion), new Vector3(0, 0, -1));
});

test('Facing: a step below 1e-6 of the distance out is noise (far out at true scale)', () => {
  const f = new Facing();
  f.move(new Vector3(1.5e8, 0, 0));
  assert.equal(f.move(new Vector3(1.5e8, 0, 10)), false);
  assert.equal(f.dir, null);
  // the steps add up from the anchor
  assert.equal(f.move(new Vector3(1.5e8, 0, 200)), true);
  near(f.dir, new Vector3(0, 0, 1));
});

test('spinTangent: anticlockwise from above for a positive spin, round the host', () => {
  const host = new Group();
  host.position.set(10, 0, 0);
  // east of the host, spinning prograde: moving north (-z)
  near(spinTangent(new Vector3(20, 0, 0), host, 15), new Vector3(0, 0, -1));
  near(spinTangent(new Vector3(20, 0, 0), host, -15), new Vector3(0, 0, 1));
  assert.equal(spinTangent(new Vector3(20, 0, 0), host, 0), null);
  assert.equal(spinTangent(new Vector3(10, 4, 0), host, 15), null, 'on the axis');
});

test('in a scene: a ship on a spinning ring faces along the spin, and along its travel as the ring turns', () => {
  const w = buildScene({
    points: [{ id: 'ship', polar: [50, 90], object: 'orbit' }],
    objects: [
      { type: 'ring', id: 'orbit', radius: 50, spin: 10 },
      { type: 'sphere', id: 'hull', at: 'ship', radius: 1, face: 'motion' },
      { type: 'sphere', id: 'still', at: 'ship', radius: 1 }
    ]
  }, /** @type {any} */ (ctx()));
  const g = /** @type {any} */ (w.outer.get(w.objects.get('hull')));
  // polar [50, 90]: east of the centre; a prograde spin carries it north
  near(bow(g), new Vector3(0, 0, -1));
  near(bow(/** @type {any} */ (w.outer.get(w.objects.get('still')))), new Vector3(0, 0, 1), 1e-9);
  // the ring turns a quarter: the ship is north now, travelling west
  const ring = /** @type {any} */ (w.objects.get('orbit'));
  for (let i = 0; i < 90; i++) {
    ring.node.rotation.y += MathUtils.degToRad(1);
    w.layout();
  }
  near(g.position, new Vector3(0, 0, -50), 1e-6);
  near(bow(g), new Vector3(-1, 0, 0), 0.02);
  w.dispose();
});

test('in a scene: a ship circling a planet that is itself on an orbit faces round the planet, all the way round', () => {
  const w = buildScene({
    points: [{ id: 'planet', polar: [85, 90], object: 'outer' }, { id: 'ship', polar: [12, 0], object: 'moon_orbit' }],
    objects: [
      { type: 'ring', id: 'outer', radius: 85, spin: 6 },
      { type: 'ring', id: 'moon_orbit', at: 'planet', radius: 12, spin: 40 },
      { type: 'sphere', id: 'hull', at: 'ship', radius: 1, face: 'motion' }
    ]
  }, /** @type {any} */ (ctx()));
  const g = /** @type {any} */ (w.outer.get(w.objects.get('hull')));
  const outerRing = /** @type {any} */ (w.objects.get('outer'));
  const moonRing = /** @type {any} */ (w.objects.get('moon_orbit'));
  const planet = () => w.places.get('planet').clone();
  // the ship moves slower round the planet than the planet along its orbit: on the far side its
  // ground track goes the planet's way, but it must keep facing round the planet (no u-turn)
  for (let i = 0; i < 400; i++) {
    outerRing.node.rotation.y += MathUtils.degToRad(6 / 60);
    moonRing.node.rotation.y += MathUtils.degToRad(40 / 60);
    w.layout();
    if (i < 2) continue;
    const r = g.position.clone().sub(planet()).normalize();
    // prograde round the planet: up x r
    const along = new Vector3(0, 1, 0).cross(r).normalize();
    assert.ok(bow(g).dot(along) > 0.99, `step ${i}: ${bow(g).toArray()} vs ${along.toArray()}`);
  }
  w.dispose();
});

test('a trail behind a ship circling a moving planet lies on its orbit round the planet (not across it)', () => {
  const w = buildScene({
    points: [{ id: 'planet', polar: [85, 90], object: 'outer' }, { id: 'ship', polar: [12, 0], object: 'moon_orbit' }],
    objects: [
      { type: 'ring', id: 'outer', radius: 85, spin: 6 },
      { type: 'ring', id: 'moon_orbit', at: 'planet', radius: 12, spin: 40, rotation: [15, 0, 0] },
      { type: 'trail', id: 'wake', point: 'ship', length: 4 }
    ]
  }, /** @type {any} */ (ctx()));
  const outerRing = /** @type {any} */ (w.objects.get('outer'));
  const moonRing = /** @type {any} */ (w.objects.get('moon_orbit'));
  const trail = /** @type {any} */ (w.objects.get('wake'));
  const realNow = performance.now;
  let clock = 0;
  performance.now = () => clock;
  try {
    for (let i = 0; i < 200; i++) {
      clock += 1000 / 60;
      outerRing.node.rotation.y += MathUtils.degToRad(6 / 60);
      moonRing.node.rotation.y += MathUtils.degToRad(40 / 60);
      w.layout();
    }
  } finally {
    performance.now = realNow;
  }
  // every vertex, in the world: 12 from the planet now (the whole wake rides along with it)
  const planet = w.places.get('planet');
  const line = trail.lines[0];
  const pos = line.segmentPositions();
  trail.node.updateWorldMatrix(true, false);
  assert.ok(pos.length > 30);
  for (let i = 0; i < pos.length; i += 3) {
    const v = new Vector3(pos[i], pos[i + 1], pos[i + 2]).applyMatrix4(trail.node.matrixWorld);
    assert.ok(Math.abs(v.distanceTo(planet) - 12) < 0.05, `vertex ${i / 3}: ${v.distanceTo(planet)}`);
  }
  w.dispose();
});

test('face: a point id turns a model toward it, and a well down its axis, its throat point on the line between', () => {
  const w = buildScene({
    points: [
      { id: 'here', xyz: [0, 0, 0] },
      { id: 'there', xyz: [100, 0, 0] },
      { id: 'throat', object: 'mouth', xyz: [0, -4, 0] }
    ],
    objects: [
      { type: 'grid', id: 'mouth', shape: 'well', well_shape: 'wormhole', radius: 2, depth: 4, at: 'here', face: 'there' },
      { type: 'sphere', id: 'hull', at: 'here', radius: 1, face: 'there' }
    ]
  }, /** @type {any} */ (ctx()));
  near(bow(/** @type {any} */ (w.outer.get(w.objects.get('hull')))), new Vector3(1, 0, 0));
  // the well's throat (-y) leads toward the far point
  near(w.places.get('throat'), new Vector3(4, 0, 0), 1e-9);
  w.dispose();
});
