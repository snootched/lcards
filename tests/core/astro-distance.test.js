/**
 * E9 distance visibility (src/core/astrometrics/distance-fade.js): the range
 * maths points and objects share (fade, min_distance, max_distance with 10 %
 * edges), an object's distance to the nearest edge of its bounding sphere,
 * and `ObjectFader` over a built scene: out of range hides the object, part
 * way scales its materials for one render and puts them back (an opaque one
 * blends only meanwhile). Also: a path ending on a model part draws once the
 * model is in.
 */
import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { installJsdom } from '../helpers/jsdom-env.js';

const env = installJsdom();
after(() => env.restore());
const { Vector3, Group, Mesh, BoxGeometry, MeshStandardMaterial } = await import('three');
const { distanceRange, distanceAlpha, sphereDistance, localBounds, ObjectFader } = await import('../../src/core/astrometrics/distance-fade.js');
const { buildScene } = await import('../../src/core/astrometrics/scene-builder.js');
const models = await import('../../src/core/astrometrics/model/index.js');
const { objectSchema } = await import('../../src/cards/schemas/astrometrics-schema.js');
const { objectBranch, COMMON_GROUPS } = await import('../../src/editor/dialogs/astro-studio/schema-fields.js');
const { OBJECT_TYPES } = await import('../../src/core/astrometrics/names.js');

function ctx(extra = {}) {
  return { color: () => [1, 0.6, 0.4, 1], places: null, sky: () => null, requestFrame: () => {}, loadTexture: () => null, ...extra };
}
const settle = () => new Promise((r) => setTimeout(r, 0));

test('distanceRange: null without keys; parses fade, min and max', () => {
  assert.equal(distanceRange({}), null);
  assert.equal(distanceRange({ min_distance: 0 }), null);
  assert.deepEqual(distanceRange({ fade: [10, 20], min_distance: 5, max_distance: 100 }), { fade: [10, 20], minDistance: 5, maxDistance: 100 });
  assert.deepEqual(distanceRange({ max_distance: 50 }), { fade: null, minDistance: 0, maxDistance: 50 });
});

test('distanceAlpha: max fades out over 10 % past it, min fades in over 10 % before it, fade is linear', () => {
  const max = /** @type {any} */ (distanceRange({ max_distance: 100 }));
  assert.equal(distanceAlpha(max, 50), 1);
  assert.equal(distanceAlpha(max, 100), 1);
  assert.ok(Math.abs(distanceAlpha(max, 105) - 0.5) < 1e-9);
  assert.ok(distanceAlpha(max, 110) < 1e-9);
  const min = /** @type {any} */ (distanceRange({ min_distance: 100 }));
  assert.equal(distanceAlpha(min, 80), 0);
  assert.ok(Math.abs(distanceAlpha(min, 95) - 0.5) < 1e-9);
  assert.equal(distanceAlpha(min, 100), 1);
  // touching ranges cross-fade: one in, one out, both partly shown at the seam
  assert.ok(distanceAlpha(max, 105) > 0 && distanceAlpha(min, 95) > 0);
  const fade = /** @type {any} */ (distanceRange({ fade: [10, 30] }));
  assert.equal(distanceAlpha(fade, 5), 1);
  assert.ok(Math.abs(distanceAlpha(fade, 20) - 0.5) < 1e-9);
  assert.equal(distanceAlpha(fade, 40), 0);
});

test('sphereDistance: to the nearest edge, 0 inside; localBounds follow the node', () => {
  assert.equal(sphereDistance(new Vector3(0, 0, 100), new Vector3(), 30), 70);
  assert.equal(sphereDistance(new Vector3(0, 0, 10), new Vector3(), 30), 0);
  const node = new Group();
  node.add(new Mesh(new BoxGeometry(2, 2, 2)));
  node.position.set(50, 0, 0);
  node.updateMatrixWorld(true);
  const s = localBounds(node);
  assert.ok(s.center.length() < 1e-9, 'local to the node');
  assert.ok(Math.abs(s.radius - Math.sqrt(3)) < 1e-9);
});

test('ObjectFader: a sphere with max_distance hides far away, scales its materials part way, puts them back', () => {
  const w = buildScene({ objects: [{ type: 'sphere', id: 'p', radius: 10, max_distance: 100 }, { type: 'sphere', id: 'q', radius: 10, at: [500, 0, 0] }] }, /** @type {any} */ (ctx()));
  const p = /** @type {any} */ (w.objects.get('p'));
  const g = /** @type {any} */ (w.outer.get(p));
  const fader = new ObjectFader();
  /** @type {any[]} */
  const mats = [];
  p.node.traverse((/** @type {any} */ o) => { if (o.material) mats.push(o.material); });
  const base = mats.map((m) => (m.uniforms?.uOpacity ? m.uniforms.uOpacity.value : m.opacity));

  // near: shown, untouched
  fader.begin(w.list, w.outer, new Vector3(0, 0, 50));
  assert.equal(g.visible, true);
  assert.equal(fader.alphas.get('p'), 1);
  assert.equal(fader.alphas.has('q'), false, 'no range, not tracked');
  fader.end();

  // 105 from the edge (115 from the centre): half
  fader.begin(w.list, w.outer, new Vector3(0, 0, 115));
  assert.ok(Math.abs(/** @type {number} */ (fader.alphas.get('p')) - 0.5) < 1e-6);
  assert.equal(g.visible, true);
  mats.forEach((m, i) => {
    const now = m.uniforms?.uOpacity ? m.uniforms.uOpacity.value : m.opacity;
    assert.ok(Math.abs(now - base[i] * 0.5) < 1e-6, 'scaled for the render');
    assert.equal(m.transparent, true);
  });
  fader.end();
  mats.forEach((m, i) => assert.equal(m.uniforms?.uOpacity ? m.uniforms.uOpacity.value : m.opacity, base[i], 'back after it'));

  // far: hidden; visible: false stays hidden when it comes back in range
  fader.begin(w.list, w.outer, new Vector3(0, 0, 500));
  assert.equal(g.visible, false);
  fader.end();
  p.config = { ...p.config, visible: false };
  fader.begin(w.list, w.outer, new Vector3(0, 0, 50));
  assert.equal(g.visible, false);
  fader.end();
  w.dispose();
});

test('ObjectFader: a grid (front and back faces share one uOpacity) comes back in full after many partial fades', () => {
  const w = buildScene({ objects: [{ type: 'grid', id: 'disc', shape: 'disc', radius: 90, line_spacing: 30, min_distance: 160 }] }, /** @type {any} */ (ctx()));
  const b = /** @type {any} */ (w.objects.get('disc'));
  /** @type {any[]} */
  const mats = [];
  b.node.traverse((/** @type {any} */ o) => { if (o.material?.uniforms?.uOpacity) mats.push(o.material); });
  assert.ok(mats.length >= 2 && mats[0].uniforms.uOpacity === mats[1].uniforms.uOpacity, 'shared uniform');
  const base = mats[0].uniforms.uOpacity.value;
  const fader = new ObjectFader();
  // the camera inside the fade-in band (144 to 160 from the edge), frame after frame
  for (let i = 0; i < 20; i++) {
    fader.begin(w.list, w.outer, new Vector3(0, 0, 90 + 150));
    const a = /** @type {number} */ (fader.alphas.get('disc'));
    assert.ok(a > 0 && a < 1);
    assert.ok(Math.abs(mats[0].uniforms.uOpacity.value - base * a) < 1e-9, 'scaled once, not twice');
    fader.end();
  }
  assert.equal(mats[0].uniforms.uOpacity.value, base, 'back in full');
  fader.begin(w.list, w.outer, new Vector3(0, 0, 400));
  assert.equal(fader.alphas.get('disc'), 1);
  assert.equal(mats[0].uniforms.uOpacity.value, base);
  fader.end();
  w.dispose();
});

test('ObjectFader: an opaque material blends only while it fades (a new program for three\'s own materials)', () => {
  const node = new Group();
  const mat = new MeshStandardMaterial();
  node.add(new Mesh(new BoxGeometry(2, 2, 2), mat));
  const g = new Group();
  g.add(node);
  g.updateMatrixWorld(true);
  const b = /** @type {any} */ ({ id: 'm', config: { max_distance: 10 }, node, dynamic: false });
  const fader = new ObjectFader();
  const v0 = mat.version;
  fader.begin([b], new Map([[b, g]]), new Vector3(0, 0, 10.5 + Math.sqrt(3)));
  assert.equal(mat.transparent, true);
  assert.equal(mat.depthWrite, false, 'see-through while it fades');
  assert.ok(Math.abs(mat.opacity - 0.5) < 1e-6);
  assert.ok(mat.version > v0, 'recompiled without the opaque define');
  fader.end();
  assert.equal(mat.transparent, false);
  assert.equal(mat.depthWrite, true);
  assert.equal(mat.opacity, 1);
});

test('every object type takes the distance keys, and the Studio shows them in Distance', () => {
  // a system draws nothing itself: its points and objects take their own
  for (const type of OBJECT_TYPES.filter((t) => t !== 'system')) {
    const parts = /** @type {any} */ (objectBranch(objectSchema, type));
    for (const key of COMMON_GROUPS.distance) assert.ok(parts.common[key], `${type}.${key}`);
    assert.equal(parts.own.fade, undefined, `${type} has its own fade (trail uses fade_tail)`);
  }
  // every common key is in a Studio group
  const grouped = Object.values(COMMON_GROUPS).flat();
  const parts = /** @type {any} */ (objectBranch(objectSchema, 'grid'));
  for (const key of Object.keys(parts.common)) if (key !== 'id') assert.ok(grouped.includes(key), `${key} in a Studio group`);
});

test('a path ending on a model part draws once the model is in', async () => {
  const b = readFileSync(new URL('../../src/assets/models/constitution.glb', import.meta.url));
  const ship = b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength);
  const w = buildScene({
    objects: [{ type: 'model', id: 'ship', src: 'x', size: 289 }, { type: 'path', id: 'route', from: 'home', to: 'bridge' }],
    points: [{ id: 'home', xyz: [0, 0, 400] }, { id: 'bridge', object: 'ship', part: 'bridge' }]
  }, /** @type {any} */ (ctx({ models, loadModel: () => models.parseModel(ship) })));
  const route = /** @type {any} */ (w.objects.get('route'));
  assert.equal(route.dynamic, false);
  assert.equal(route.lines[0]._segs.count, 0, 'nothing while the model loads');
  await settle();
  await settle();
  w.layout();
  assert.ok(route.lines[0]._segs.count > 0, 'drawn to the part');
  w.dispose();
});

// ── Part 2: level of detail ───────────────────────────────────────────────

const { PerspectiveCamera, OrthographicCamera } = await import('three');
const { pixelSize, bandDistance, useDots, DOT_PX } = await import('../../src/core/astrometrics/objects/belt.js');
const { markerSvg, MARKER_SIZE } = await import('../../src/core/astrometrics/markers.js');

test('belt dots: size on screen, distance to the band, and slack round the switch', () => {
  const cam = new PerspectiveCamera(90, 1, 0.1, 1000);
  // fov 90: the view is 2 * d tall, so 1 unit at distance 50 on a 400 px view is 4 px
  assert.ok(Math.abs(pixelSize(cam, 1, 50, 400) - 4) < 1e-9);
  const ortho = new OrthographicCamera(-50, 50, 50, -50, 0.1, 1000);
  assert.ok(Math.abs(pixelSize(ortho, 1, 999, 400) - 4) < 1e-9, 'orthographic: no distance');
  assert.equal(bandDistance(new Vector3(100, 0, 0), 80, 120, 10), 0, 'inside the band');
  assert.equal(bandDistance(new Vector3(0, 0, 0), 80, 120, 10), 80, 'at the centre: to the inner edge');
  assert.equal(bandDistance(new Vector3(100, 35, 0), 80, 120, 10), 30, 'above it');
  assert.equal(useDots(false, DOT_PX * 0.95), false, 'not yet');
  assert.equal(useDots(false, DOT_PX * 0.85), true);
  assert.equal(useDots(true, DOT_PX * 1.05), true, 'stays dots');
  assert.equal(useDots(true, DOT_PX * 1.15), false);
});

test('belt: far away the rocks become dots (only the dots move), close up rocks again', () => {
  const w = buildScene({ objects: [{ type: 'belt', id: 'b', radius: [90, 120], count: 500, size: [0.3, 1.2], period: 60 }] }, /** @type {any} */ (ctx()));
  const b = /** @type {any} */ (w.objects.get('b'));
  const rocks = b.node.getObjectByName('rocks');
  const dots = b.node.getObjectByName('dots');
  const cam = new PerspectiveCamera(40, 2, 0.1, 100000);
  /** @param {number} z */
  const view = (z) => {
    cam.position.set(0, 0, z);
    cam.updateMatrixWorld();
    b.lod({ camera: cam, height: 400, dpr: 1 });
  };
  view(300);
  assert.equal(rocks.visible, true);
  assert.equal(dots.visible, false);
  view(5000);
  assert.equal(rocks.visible, false);
  assert.equal(dots.visible, true);
  const pos = dots.geometry.attributes.position;
  const before = [pos.getX(0), pos.getZ(0)];
  assert.ok(Math.hypot(before[0], before[1]) >= 90, 'dots where the rocks are');
  const m0 = rocks.instanceMatrix.array.slice();
  b.tick(1000, 5000);
  assert.notDeepEqual([pos.getX(0), pos.getZ(0)], before, 'dots move');
  assert.deepEqual(rocks.instanceMatrix.array, m0, 'rock matrices left alone');
  view(300);
  assert.equal(rocks.visible, true);
  assert.notDeepEqual(rocks.instanceMatrix.array, m0, 'rocks caught up');
  w.dispose();
});

test('ship and starbase markers draw', () => {
  for (const name of ['ship', 'starbase']) {
    assert.match(markerSvg(name), /^<svg width="(\d+)"/);
    assert.equal(Number(/width="(\d+)"/.exec(markerSvg(name))?.[1]), /** @type {any} */ (MARKER_SIZE)[name]);
  }
});
