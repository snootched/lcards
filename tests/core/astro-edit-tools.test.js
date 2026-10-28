/**
 * Astrometrics edit-mode maths (src/core/astrometrics/edit-tools.js), used by
 * the Studio: which form a point drags in, drags on the point's own
 * horizontal plane (height kept, offsets and the object's space honoured),
 * screen distance for line objects, the selection box in an object's space.
 */
import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { BoxGeometry, Group, Mesh, PerspectiveCamera, Vector3 } from 'three';
import { installJsdom } from '../helpers/jsdom-env.js';

// edit-tools reads the camera rig, which loads anime.js (needs a document)
const env = installJsdom();
after(() => env.restore());
const { dragForm, planeDragValue, segmentDistance, toScreen, localBox, boxRuns } = await import('../../src/core/astrometrics/edit-tools.js');
const { Placements } = await import('../../src/core/astrometrics/placements.js');

/** A ray straight down onto (x, z) */
const down = (x, z) => ({ origin: [x, 500, z], dir: [0, -1, 0] });

test('dragForm: the form a point is placed by; sky, at, part, entity and hostless surface forms do not drag', () => {
  assert.equal(dragForm({ id: 'a', xyz: [1, 2, 3] }), 'xyz');
  assert.equal(dragForm({ id: 'a', polar: [10, 90], alt: 2 }), 'polar');
  assert.equal(dragForm({ id: 'a', latlon: [10, 20], object: 'earth' }), 'latlon');
  assert.equal(dragForm({ id: 'a', altaz: [10, 20], object: 'dome' }), 'altaz');
  assert.equal(dragForm({ id: 'a', cell: 'B4', object: 'floor' }), 'cell');
  assert.equal(dragForm({ id: 'a', latlon: [10, 20] }), null);
  assert.equal(dragForm({ id: 'a', sky: 'sun', object: 'dome' }), null);
  assert.equal(dragForm({ id: 'a', at: 'b' }), null);
  assert.equal(dragForm({ id: 'a', object: 'ship', part: 'bridge', xyz: [0, 1, 0] }), null);
  assert.equal(dragForm({ id: 'a', latlon: { entity: 'device_tracker.x' }, object: 'earth' }), null);
  assert.equal(dragForm(null), null);
});

test('planeDragValue: xyz slides at its own height, y kept as written', () => {
  const def = { id: 'a', xyz: [0, 12, 0] };
  assert.deepEqual(planeDragValue(down(30.04, -7.96), def, 'xyz'), [30, 12, -8]);
  // the dragged value lands back under the ray
  const p = new Placements({ points: [{ ...def, xyz: planeDragValue(down(30, -8), def, 'xyz') }] });
  assert.deepEqual(p.get('a').toArray(), [30, 12, -8]);
});

test('planeDragValue: polar keeps alt, bearing on the one convention (0 north = -z, 90 east = +x)', () => {
  assert.deepEqual(planeDragValue(down(0, -20), { id: 'a', polar: [5, 0], alt: 3 }, 'polar'), [20, 0]);
  assert.deepEqual(planeDragValue(down(20, 0), { id: 'a', polar: [5, 0] }, 'polar'), [20, 90]);
  assert.deepEqual(planeDragValue(down(-20, 0), { id: 'a', polar: [5, 0] }, 'polar'), [20, 270]);
});

test('planeDragValue: local to the object (moved and scaled) and without the offset', () => {
  const host = new Group();
  host.position.set(100, 0, 0);
  host.scale.setScalar(2);
  host.updateMatrixWorld(true);
  const def = { id: 'a', object: 'h', xyz: [0, 5, 0], offset: [0, 0, 4] };
  // world (120, 10, 4) = host (100) + 2 * local (10, 5, 0) + offset (0, 0, 4)
  assert.deepEqual(planeDragValue(down(120, 4), def, 'xyz', host), [10, 5, 0]);
  // a ray along the plane misses
  assert.equal(planeDragValue({ origin: [0, 10, 0], dir: [1, 0, 0] }, def, 'xyz', host), null);
});

test('segmentDistance and toScreen', () => {
  assert.equal(segmentDistance(5, 3, 0, 0, 10, 0), 3);
  assert.equal(segmentDistance(-4, 3, 0, 0, 10, 0), 5);
  assert.equal(segmentDistance(1, 1, 0, 0, 0, 0), Math.SQRT2);
  const camera = new PerspectiveCamera(40, 2, 0.1, 1000);
  camera.position.set(0, 0, 10);
  camera.updateMatrixWorld(true);
  const mid = toScreen(new Vector3(0, 0, 0), camera, 200, 100);
  assert.deepEqual(mid?.map((v) => Math.round(v)), [100, 50]);
  assert.equal(toScreen(new Vector3(0, 0, 20), camera, 200, 100), null, 'behind the camera');
});

test('localBox: in the node\'s own space (a turned node does not grow its box); boxRuns draws 12 edges', () => {
  const node = new Group();
  node.rotation.y = Math.PI / 4;
  node.position.set(50, 0, 0);
  const mesh = new Mesh(new BoxGeometry(2, 4, 6));
  mesh.position.set(0, 2, 0);
  node.add(mesh);
  const box = localBox(node);
  assert.deepEqual(box.min.toArray().map((v) => Math.round(v * 1e6) / 1e6), [-1, 0, -3]);
  assert.deepEqual(box.max.toArray().map((v) => Math.round(v * 1e6) / 1e6), [1, 4, 3]);
  assert.ok(localBox(node, (o) => o === mesh).isEmpty());
  const runs = boxRuns(box);
  const segments = runs.reduce((n, r) => n + r.length / 3 - 1, 0);
  assert.equal(segments, 12);
});
