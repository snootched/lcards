/**
 * Astrometrics `model` objects, headless: the built-in ship parses (plain and
 * meshopt-compressed, the same geometry), the builder stands in a box until
 * the file is in and then fits the file to `size`, swaps in the hologram,
 * draws edges and plays clips on the scene clock; points on the model use the
 * file's coordinates and `part:` follows an animated part; the loader refuses
 * files over max_file_size.
 */
import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { installJsdom } from '../helpers/jsdom-env.js';

const env = installJsdom();
after(() => env.restore());
const { Vector3, Box3 } = await import('three');
const { buildScene } = await import('../../src/core/astrometrics/scene-builder.js');
const models = await import('../../src/core/astrometrics/model/index.js');
const { usesModels, OBJECT_TYPES } = await import('../../src/core/astrometrics/names.js');

/** @param {string} rel */
const bytes = (rel) => {
  const b = readFileSync(new URL(rel, import.meta.url));
  return b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength);
};
const SHIP = bytes('../../src/assets/models/constitution.glb');
const SHIP_MESHOPT = bytes('../fixtures/constitution-meshopt.glb');
const PARTS = ['saucer', 'bridge', 'sensor_dome', 'impulse', 'neck', 'secondary_hull', 'deflector', 'shuttle_bay', 'pylon_port', 'pylon_starboard', 'nacelle_port', 'nacelle_starboard', 'bussard_port', 'bussard_starboard'];

/** A build context whose loadModel hands back `gltf` (a promise the test resolves) */
function ctx(load = models.parseModel(SHIP.slice(0))) {
  let frames = 0;
  return {
    color: () => [0.4, 0.6, 1, 1],
    places: null,
    sky: () => null,
    requestFrame: () => { frames++; },
    loadTexture: () => null,
    models,
    loadModel: () => load,
    get frames() { return frames; }
  };
}

const settle = () => new Promise((r) => setTimeout(r, 0));

test('the model type is known, and a config with one needs the model chunk', () => {
  assert.ok(OBJECT_TYPES.includes('model'));
  assert.equal(usesModels({ objects: [{ type: 'model', src: 'builtin:constitution' }] }), true);
  assert.equal(usesModels({ objects: [{ type: 'grid' }] }), false);
});

test('the built-in ship parses with every named part and the bussards clip; meshopt gives the same geometry', async () => {
  /** @param {any} g */
  const summary = (g) => {
    let sum = 0;
    let tris = 0;
    g.scene.traverse((/** @type {any} */ o) => {
      if (!o.isMesh) return;
      for (const v of o.geometry.attributes.position.array) sum += v;
      tris += (o.geometry.index?.count ?? o.geometry.attributes.position.count) / 3;
    });
    return { sum: sum.toFixed(2), tris };
  };
  const plain = await models.parseModel(SHIP.slice(0));
  const packed = await models.parseModel(SHIP_MESHOPT.slice(0));
  for (const name of PARTS) assert.ok(plain.scene.getObjectByName(name), `part ${name}`);
  assert.deepEqual(plain.animations.map((a) => a.name), ['bussards']);
  assert.deepEqual(summary(packed), summary(plain));
  // about 289 m long, the bow toward +z
  const box = new Box3().setFromObject(plain.scene);
  assert.ok(Math.abs(box.max.z - box.min.z - 289) < 2, `length ${box.max.z - box.min.z}`);
  assert.ok(plain.scene.getObjectByName('saucer').position.z > 50);
});

test('a placeholder box stands in, then the file is fitted to size with the hologram and edges', async () => {
  const c = ctx();
  const w = buildScene({ objects: [{ type: 'model', id: 'ship', src: 'builtin:constitution', size: 60 }] }, /** @type {any} */ (c));
  const b = w.objects.get('ship');
  assert.ok(b);
  assert.equal(b.loadState?.(), 'loading');
  assert.ok(b.node.getObjectByName('placeholder'));
  // bounds come from the placeholder, so the first frame frames the model
  assert.ok(Math.abs(w.bounds.radius - Math.hypot(30, 10.5, 30)) < 1);
  await settle();
  await settle();
  assert.equal(b.loadState?.(), 'ready');
  assert.equal(b.node.getObjectByName('placeholder'), undefined);
  w.scene.updateMatrixWorld(true);
  const box = new Box3();
  b.node.traverse((/** @type {any} */ o) => { if (o.isMesh && o.material?.name === 'lcards-hologram') box.expandByObject(o, true); });
  const size = box.getSize(new Vector3());
  assert.ok(Math.abs(Math.max(size.x, size.y, size.z) - 60) < 0.5, `largest extent ${Math.max(size.x, size.y, size.z)}`);
  assert.ok(box.getCenter(new Vector3()).length() < 0.5);
  let edges = 0;
  let twins = 0;
  b.node.traverse((/** @type {any} */ o) => {
    if (o.isLineSegments) edges++;
    if (o.material?.name === 'lcards-hologram-depth') twins++;
  });
  assert.ok(edges >= PARTS.length, `edges ${edges}`);
  assert.ok(twins >= PARTS.length, `depth twins ${twins}`);
  assert.ok(b.pickMeshes.length >= PARTS.length);
  assert.ok(c.frames > 0, 'asks for a frame when the file is in');
  w.dispose();
});

test('material: original keeps the file\'s materials and adds lights; solid: false has no depth twins', async () => {
  const w = buildScene({ objects: [
    { type: 'model', id: 'a', src: 'x', material: 'original' },
    { type: 'model', id: 'b', src: 'x', solid: false, edges: false }
  ] }, /** @type {any} */ (ctx()));
  await settle();
  await settle();
  const kinds = (/** @type {string} */ id) => {
    const out = { standard: 0, lights: 0, twins: 0, edges: 0 };
    w.objects.get(id)?.node.traverse((/** @type {any} */ o) => {
      if (o.isMesh && o.material?.isMeshStandardMaterial) out.standard++;
      if (o.isLight) out.lights++;
      if (o.material?.name === 'lcards-hologram-depth') out.twins++;
      if (o.isLineSegments) out.edges++;
    });
    return out;
  };
  const a = kinds('a');
  assert.ok(a.standard >= PARTS.length && a.lights === 2 && a.twins === 0 && a.edges === 0);
  const b = kinds('b');
  assert.ok(b.standard === 0 && b.twins === 0 && b.edges === 0);
  w.dispose();
});

test('points on the model use file coordinates (size does not move them), part follows the animated bussard', async () => {
  const config = (/** @type {number} */ size) => ({
    objects: [{ type: 'model', id: 'ship', src: 'x', size, animation: 'bussards' }],
    points: [
      { id: 'bow', object: 'ship', xyz: [0, 24, 144.5], label: 'Bow' },
      { id: 'bridge', object: 'ship', part: 'bridge', label: 'Bridge' },
      { id: 'collector', object: 'ship', part: 'bussard_port', xyz: [0, 5, 0], label: 'Collector' }
    ]
  });
  const w = buildScene(config(289), /** @type {any} */ (ctx()));
  // nothing until the file is in
  assert.equal(w.places.get('bridge'), null);
  await settle();
  await settle();
  w.layout();
  const bow = w.places.get('bow');
  assert.ok(bow);
  // size 289 is the file's own length: scale 1, recentred on the bounds (the bow stays near +144.5 z)
  const ship = w.objects.get('ship');
  assert.ok(ship?.placeNode);
  const local = ship.placeNode.worldToLocal(bow.clone());
  assert.ok(local.distanceTo(new Vector3(0, 24, 144.5)) < 1e-3);
  const bridge = w.places.get('bridge');
  assert.ok(bridge && bridge.y > 0);
  // the collector's offset turns with the bussard (the clip turns it round z)
  const before = w.places.get('collector')?.clone();
  assert.ok(before);
  assert.equal(ship.tick?.(500, 500), true);
  w.layout();
  const later = w.places.get('collector');
  assert.ok(later && later.distanceTo(before) > 1, 'moved with the part');
  assert.equal(w.places.isDynamic('collector'), true);

  // the same points with a smaller model: same file-space position
  const w2 = buildScene(config(50), /** @type {any} */ (ctx()));
  await settle();
  await settle();
  w2.layout();
  const ship2 = w2.objects.get('ship');
  const bow2 = w2.places.get('bow');
  assert.ok(ship2?.placeNode && bow2);
  assert.ok(ship2.placeNode.worldToLocal(bow2.clone()).distanceTo(new Vector3(0, 24, 144.5)) < 1e-3);
  assert.ok(bow2.length() < 30, 'and inside the 50-unit model in the world');
  w.dispose();
  w2.dispose();
});

test('a failed load leaves a dim stand-in; an unknown part warns and has no position', async () => {
  const w = buildScene({
    objects: [{ type: 'model', id: 'gone', src: '/local/missing.glb' }, { type: 'model', id: 'ship', src: 'x' }],
    points: [{ id: 'p', object: 'ship', part: 'warp_core', label: 'P' }]
  }, /** @type {any} */ ({ ...ctx(), loadModel: (/** @type {string} */ src) => (src === 'x' ? models.parseModel(SHIP.slice(0)) : Promise.reject(new Error('HTTP 404'))) }));
  await settle();
  await settle();
  assert.equal(w.objects.get('gone')?.loadState?.(), 'failed');
  w.layout();
  assert.equal(w.places.get('p'), null);
  w.dispose();
});

test('the loader refuses a file over max_file_size, by Content-Length and by bytes', async () => {
  const big = new ArrayBuffer(2 * 1024 * 1024);
  /** @param {Record<string, string>} headers */
  const fetchImpl = (headers) => /** @type {any} */ (async () => ({ ok: true, status: 200, headers: new Headers(headers), arrayBuffer: async () => big }));
  await assert.rejects(models.loadModelFile('/m.glb', { maxBytes: 1024 * 1024, fetchImpl: fetchImpl({ 'content-length': String(big.byteLength) }) }), /over max_file_size/);
  await assert.rejects(models.loadModelFile('/m.glb', { maxBytes: 1024 * 1024, fetchImpl: fetchImpl({}) }), /over max_file_size/);
  await assert.rejects(models.loadModelFile('/m.glb', { fetchImpl: /** @type {any} */ (async () => ({ ok: false, status: 404, headers: new Headers() })) }), /HTTP 404/);
});

test('clip names: all, one, a list, unknown names dropped', () => {
  assert.deepEqual(models.clipNames('all', ['a', 'b']), ['a', 'b']);
  assert.deepEqual(models.clipNames('b', ['a', 'b']), ['b']);
  assert.deepEqual(models.clipNames(['b', 'c'], ['a', 'b']), ['b']);
  assert.deepEqual(models.clipNames(undefined, ['a']), []);
});

test('E8 starbases: every built-in model parses with the parts its pack entry lists, at canon size', async () => {
  const { LCARDS_IMAGES_PACK } = await import('../../src/core/packs/lcards-images-pack.js');
  // [across (round the y axis), tall, long (z)] in metres: the on-screen designs
  // (DS9 about 1450 x 1070, Spacedock 3810 x 5795), the drydock about 760 long
  const SIZES = { deep_space_nine: [1450, 1070], earth_spacedock: [3810, 5795], utopia_planitia_drydock: [null, 260, 760] };
  for (const [key, m] of Object.entries(LCARDS_IMAGES_PACK.model_assets)) {
    const g = await models.parseModel(bytes(m.url.replace('/lcards/models/', '../../src/assets/models/')));
    for (const name of m.parts) assert.ok(g.scene.getObjectByName(name), `${key}: part ${name}`);
    if (!SIZES[key]) continue;
    g.scene.updateMatrixWorld(true);
    let r = 0;
    const v = new Vector3();
    g.scene.traverse((/** @type {any} */ o) => {
      if (!o.isMesh) return;
      const p = o.geometry.attributes.position;
      for (let i = 0; i < p.count; i++) { v.fromBufferAttribute(p, i).applyMatrix4(o.matrixWorld); r = Math.max(r, Math.hypot(v.x, v.z)); }
    });
    const size = new Box3().setFromObject(g.scene).getSize(new Vector3());
    const [across, tall, long] = SIZES[key];
    const near = (/** @type {number} */ got, /** @type {number} */ want, /** @type {string} */ what) => assert.ok(Math.abs(got - want) / want < 0.05, `${key} ${what} ${got}`);
    if (across) near(2 * r, across, 'across');
    near(size.y, tall, 'tall');
    if (long) near(size.z, long, 'long');
  }
});
