/**
 * Astrometrics `model` objects, headless: the built-in ship parses (plain and
 * meshopt-compressed, the same geometry), the builder stands in a box until
 * the file is in and then fits the file to `size`, swaps in the hologram,
 * draws edges and plays clips on the scene clock; points on the model use the
 * file's coordinates and `part:` follows an animated part; the loader takes
 * a file of any size and reports a failed fetch.
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
const { usesModels, OBJECT_TYPES, realScale, modelSizeSet, modelLengthSet } = await import('../../src/core/astrometrics/names.js');

/** @param {string} rel */
const bytes = (rel) => {
  const b = readFileSync(new URL(rel, import.meta.url));
  return b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength);
};
const SHIP = bytes('../../src/assets/models/constitution-class-refit.glb');
const SHIP_MESHOPT = bytes('../fixtures/constitution-class-refit-meshopt.glb');
const PARTS = ['saucer', 'bridge', 'sensor_dome', 'impulse', 'neck', 'torpedo_launcher', 'secondary_hull', 'deflector', 'shuttle_bay', 'pylon_port', 'pylon_starboard', 'nacelle_port', 'nacelle_starboard', 'bussard_port', 'bussard_starboard', 'grille_port', 'grille_starboard', 'windows'];

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
  assert.equal(usesModels({ objects: [{ type: 'model', src: 'builtin:constitution_class_refit' }] }), true);
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
  // 305 m long (the refit), the bow toward +z
  const box = new Box3().setFromObject(plain.scene);
  assert.ok(Math.abs(box.max.z - box.min.z - 305) < 2, `length ${box.max.z - box.min.z}`);
  assert.ok(plain.scene.getObjectByName('saucer').position.z > 50);
});

test('a placeholder box stands in, then the file is fitted to size with the hologram and edges', async () => {
  const c = ctx();
  const w = buildScene({ objects: [{ type: 'model', id: 'ship', src: 'builtin:constitution_class_refit', size: 60 }] }, /** @type {any} */ (c));
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

/** The largest extent of a built model's hologram meshes, world units */
const drawnExtent = (/** @type {any} */ w, /** @type {string} */ id) => {
  w.scene.updateMatrixWorld(true);
  const box = new Box3();
  w.objects.get(id).node.traverse((/** @type {any} */ o) => { if (o.isMesh && o.material?.name === 'lcards-hologram') box.expandByObject(o, true); });
  const size = box.getSize(new Vector3());
  return Math.max(size.x, size.y, size.z);
};

test('real size: file_units and km per scene unit give scene units per file unit; size set or no units has none', () => {
  assert.equal(realScale(undefined, 1), 0.001);
  assert.equal(realScale('m', 1e-3), 1);
  assert.equal(realScale('km', 1), 1);
  assert.ok(Math.abs(realScale('ft', 1e-3) - 0.3048) < 1e-12);
  assert.ok(Math.abs(realScale('in', 1e-3) - 0.0254) < 1e-12);
  assert.ok(Math.abs(realScale('cm', 1e-3) - 0.01) < 1e-12);
  assert.ok(Math.abs(realScale('mm', 1e-3) - 0.001) < 1e-12);
  assert.equal(realScale('m', null), null);
  assert.equal(realScale('nonsense', 1), 0.001, 'unknown units read as metres');
  assert.deepEqual(models.modelSizing({ size: 60 }, 1), { size: 60, real: null, isReal: false, holder: 60 });
  assert.deepEqual(models.modelSizing({}, null), { size: 50, real: null, isReal: false, holder: 50 });
  // length: metres long in the scene's units; size wins, no units draws at 50
  assert.deepEqual(models.modelSizing({ length: 1061, file_units: 'cm' }, 1), { size: 1.061, real: null, isReal: true, holder: 1.061 });
  assert.deepEqual(models.modelSizing({ length: 1061, size: 2 }, 1), { size: 2, real: null, isReal: false, holder: 2 });
  assert.equal(models.modelSizing({ length: 1061 }, null).size, 50);
  assert.equal(modelLengthSet({ length: -3 }), null);
  const km = models.modelSizing({}, 1);
  assert.equal(km.size, null);
  assert.equal(km.real, 0.001);
  assert.equal(km.isReal, true);
  assert.ok(Math.abs(km.holder - 0.3) < 1e-9, 'the stand-in is about a starship');
  assert.equal(modelSizeSet({ size: 0 }), null);
  assert.equal(modelSizeSet({ size: '' }), null);
  assert.equal(modelSizeSet({ size: 12 }), 12);
});

test('without size the built-in ship is drawn at its real size in the scene\'s or its system\'s units; with size, at size', async () => {
  const w = buildScene({
    units: 'km',
    objects: [
      { type: 'model', id: 'real', src: 'builtin:constitution_class_refit' },
      { type: 'model', id: 'feet', src: 'builtin:constitution_class_refit', file_units: 'ft' },
      { type: 'model', id: 'sized', src: 'builtin:constitution_class_refit', size: 60 },
      { type: 'model', id: 'long', src: 'builtin:constitution_class_refit', length: 1061 },
      { type: 'system', id: 'local', at: [100, 0, 0], units: 'm', objects: [{ type: 'model', id: 'inner', src: 'builtin:constitution_class_refit' }] }
    ]
  }, /** @type {any} */ (ctx()));
  const real = w.objects.get('real');
  assert.ok(real && Math.abs(/** @type {number} */ (real.radius) - 0.15) < 1e-9, 'the stand-in until the file is in');
  await settle();
  await settle();
  assert.ok(Math.abs(drawnExtent(w, 'real') - 0.305) < 0.002, `real ${drawnExtent(w, 'real')}`);
  assert.ok(Math.abs(/** @type {number} */ (real.radius) - 0.305 / 2) < 0.002, 'radius from the file');
  assert.ok(Math.abs(drawnExtent(w, 'feet') - 0.305 * 0.3048) < 0.002, `feet ${drawnExtent(w, 'feet')}`);
  assert.ok(Math.abs(drawnExtent(w, 'sized') - 60) < 0.5);
  const info = real.modelInfo?.();
  assert.ok(info && info.real && Math.abs(info.extent[2] - 305) < 2 && Math.abs(info.size - 0.305) < 0.002);
  assert.equal(info?.src, 'builtin:constitution_class_refit', 'which file the measurements are for (the Studio drops a build of the file before)');
  assert.equal(w.objects.get('sized')?.modelInfo?.()?.real, false);
  // length: drawn that long whatever the file measures, and still real
  assert.ok(Math.abs(drawnExtent(w, 'long') - 1.061) < 0.005, `long ${drawnExtent(w, 'long')}`);
  assert.equal(w.objects.get('long')?.modelInfo?.()?.real, true);
  // in a system in metres: 305 of its units
  const inner = w.objects.get('inner')?.modelInfo?.();
  assert.ok(inner && Math.abs(inner.size - 305) < 2, `inner ${inner?.size}`);
  w.dispose();
});

test('model_scale visible: a real-size model can be drawn k times larger about its centre; a sized one cannot', async () => {
  const w = buildScene({
    units: 'km',
    objects: [
      { type: 'model', id: 'real', src: 'builtin:constitution_class_refit', at: [5, 0, 0] },
      { type: 'model', id: 'sized', src: 'builtin:constitution_class_refit', size: 1 }
    ]
  }, /** @type {any} */ (ctx()));
  const real = w.objects.get('real');
  assert.equal(typeof real?.magnify, 'function');
  assert.equal(w.objects.get('sized')?.magnify, undefined, 'its own size: untouched');
  // before the file: the stand-in grows
  real?.magnify?.(4);
  assert.ok(Math.abs(/** @type {number} */ (real?.radius) - 0.6) < 1e-9);
  await settle();
  await settle();
  assert.ok(Math.abs(/** @type {number} */ (real?.realExtent) - 0.305) < 0.002);
  assert.ok(Math.abs(drawnExtent(w, 'real') - 0.305 * 4) < 0.01, 'the file came in magnified');
  real?.magnify?.(10);
  assert.ok(Math.abs(drawnExtent(w, 'real') - 3.05) < 0.02);
  assert.ok(Math.abs(/** @type {number} */ (real?.radius) - 1.525) < 0.01);
  // about its centre: still at its place
  w.scene.updateMatrixWorld(true);
  const box = new Box3();
  real?.node.traverse((/** @type {any} */ o) => { if (o.isMesh && o.material?.name === 'lcards-hologram') box.expandByObject(o, true); });
  assert.ok(box.getCenter(new Vector3()).distanceTo(new Vector3(5, 0, 0)) < 0.05);
  real?.magnify?.(1);
  assert.ok(Math.abs(drawnExtent(w, 'real') - 0.305) < 0.002);
  assert.ok(Math.abs(/** @type {number} */ (real?.modelInfo?.()?.size) - 0.305) < 0.002, 'modelInfo stays the real size');
  w.dispose();
});

test('without units a model with no size is drawn at 50', async () => {
  const w = buildScene({ objects: [{ type: 'model', id: 'ship', src: 'x' }] }, /** @type {any} */ (ctx()));
  await settle();
  await settle();
  assert.ok(Math.abs(drawnExtent(w, 'ship') - 50) < 0.5);
  assert.equal(w.objects.get('ship')?.modelInfo?.()?.real, false);
  w.dispose();
});

test('material: original keeps the file\'s materials and adds lights; solid: false has no depth twins', async () => {
  const w = buildScene({ objects: [
    { type: 'model', id: 'a', src: 'x', material: 'original' },
    { type: 'model', id: 'b', src: 'x', solid: false, edges: false }
  ] }, /** @type {any} */ (ctx()));
  await settle();
  await settle();
  /** in the object, leaving out an original model's hologram twin (the diagram look's, checked below) */
  const kinds = (/** @type {string} */ id) => {
    const out = { standard: 0, lights: 0, twins: 0, edges: 0 };
    const twin = w.objects.get(id)?.lookParts?.diagramOnly?.[0];
    w.objects.get(id)?.node.traverse((/** @type {any} */ o) => {
      let up = o;
      while (up && up !== twin) up = up.parent;
      if (up) return;
      if (o.isMesh && o.material?.isMeshStandardMaterial) out.standard++;
      if (o.isLight) out.lights++;
      if (o.material?.name === 'lcards-hologram-depth') out.twins++;
      if (o.isLineSegments) out.edges++;
    });
    return out;
  };
  const a = kinds('a');
  assert.ok(a.standard >= PARTS.length && a.lights === 2 && a.twins === 0 && a.edges === 0);
  // its hologram twin for the diagram look: hidden, hologram material, depth twins and edges
  const twin = /** @type {any} */ (w.objects.get('a')).lookParts.diagramOnly[0];
  let holo = 0, depth = 0, edges = 0;
  twin.traverse((/** @type {any} */ o) => {
    if (o.material?.name === 'lcards-hologram') holo++;
    if (o.material?.name === 'lcards-hologram-depth') depth++;
    if (o.isLineSegments) edges++;
  });
  assert.ok(twin.visible === false && holo >= PARTS.length && depth > 0 && edges > 0);
  assert.equal(/** @type {any} */ (w.objects.get('b')).lookParts, undefined);
  const b = kinds('b');
  assert.ok(b.standard === 0 && b.twins === 0 && b.edges === 0);
  w.dispose();
});

test('points on the model use file coordinates (size does not move them), part follows the animated (pulsing) bussard', async () => {
  const config = (/** @type {number} */ size) => ({
    objects: [{ type: 'model', id: 'ship', src: 'x', size, animation: 'bussards' }],
    points: [
      { id: 'bow', object: 'ship', xyz: [0, 24, 144.5], label: 'Bow' },
      { id: 'bridge', object: 'ship', part: 'bridge', label: 'Bridge' },
      { id: 'collector', object: 'ship', part: 'bussard_port', xyz: [0, 5, 0], label: 'Collector' }
    ]
  });
  const w = buildScene(config(305), /** @type {any} */ (ctx()));
  // nothing until the file is in
  assert.equal(w.places.get('bridge'), null);
  await settle();
  await settle();
  w.layout();
  const bow = w.places.get('bow');
  assert.ok(bow);
  // size 305 is the file's own length: scale 1, recentred on the bounds (the bow stays near +144.5 z)
  const ship = w.objects.get('ship');
  assert.ok(ship?.placeNode);
  const local = ship.placeNode.worldToLocal(bow.clone());
  assert.ok(local.distanceTo(new Vector3(0, 24, 144.5)) < 1e-3);
  const bridge = w.places.get('bridge');
  assert.ok(bridge && bridge.y > 0);
  // the collector's offset swells with the bussard (the clip scales it)
  const before = w.places.get('collector')?.clone();
  assert.ok(before);
  assert.equal(ship.tick?.(500, 500), true);
  w.layout();
  const later = w.places.get('collector');
  assert.ok(later && later.distanceTo(before) > 0.05, 'moved with the part');
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

test('the loader takes a file of any size (no cap), and a failed fetch says why', async () => {
  // a large file goes to the parser (these bytes are not a model, so the parser is what refuses them)
  const big = new ArrayBuffer(150 * 1024 * 1024);
  const fetchBig = /** @type {any} */ (async () => ({ ok: true, status: 200, headers: new Headers({ 'content-length': String(big.byteLength) }), arrayBuffer: async () => big }));
  await assert.rejects(models.loadModelFile('/m.glb', { fetchImpl: fetchBig }), (/** @type {any} */ e) => !/max_file_size|MB/.test(String(e?.message)));
  await assert.rejects(models.loadModelFile('/m.glb', { fetchImpl: /** @type {any} */ (async () => ({ ok: false, status: 404, headers: new Headers() })) }), /HTTP 404/);
});

test('feature edges: on by default up to the triangle budget, off on a denser model unless edges: true', async () => {
  const { Group, Mesh, BufferGeometry, BufferAttribute, MeshBasicMaterial } = await import('three');
  assert.ok(Math.abs(models.triangleCount((await models.parseModel(SHIP.slice(0))).scene) - 10300) < 500);
  // a dense file: one triangle over the budget (degenerate, so it costs nothing to build)
  const g = new BufferGeometry();
  g.setAttribute('position', new BufferAttribute(new Float32Array([0, 0, 0, 1, 0, 0, 0, 1, 1]), 3));
  g.setIndex(new BufferAttribute(new Uint32Array((models.EDGE_TRIANGLE_BUDGET + 1) * 3).map((_, i) => i % 3), 1));
  const root = new Group();
  root.add(new Mesh(g, new MeshBasicMaterial()));
  const dense = Promise.resolve(/** @type {any} */ ({ scene: root, animations: [] }));
  assert.equal(models.triangleCount(root), models.EDGE_TRIANGLE_BUDGET + 1);
  const w = buildScene({ objects: [{ type: 'model', id: 'dense', src: 'x', size: 10 }] }, /** @type {any} */ (ctx(dense)));
  await settle();
  await settle();
  let lines = 0;
  w.objects.get('dense')?.node.traverse((/** @type {any} */ o) => { if (o.isLineSegments) lines++; });
  assert.equal(lines, 0, 'no edges on a dense model by default');
  w.dispose();
});

test('the loader reports download progress, then parsing', async () => {
  const body = new Uint8Array(SHIP.slice(0));
  const half = Math.floor(body.byteLength / 2);
  const stream = new ReadableStream({ start(c) { c.enqueue(body.slice(0, half)); c.enqueue(body.slice(half)); c.close(); } });
  /** @type {number[][]} */
  const seen = [];
  const gltf = await models.loadModelFile('/m.glb', {
    fetchImpl: /** @type {any} */ (async () => ({ ok: true, status: 200, headers: new Headers({ 'content-length': String(body.byteLength) }), body: stream })),
    onProgress: (loaded, total) => seen.push([loaded, total])
  });
  assert.ok(gltf.scene);
  assert.deepEqual(seen, [[half, body.byteLength], [body.byteLength, body.byteLength], [-1, body.byteLength]]);
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
  // (DS9 1452 across, pylons 969 tip to tip; Spacedock 3800 x about 5480), the drydock about 760 long and 330 tall,
  // the refit Constitution 305.1 x 71.3 m and the Galaxy class 642.5 x 137.5 m (length x height; the plates draw it 142)
  const SIZES = { constitution_class_refit: [null, 71.3, 305.1], galaxy_class: [null, 137.5, 642.5], deep_space_nine: [1452, 969], earth_spacedock: [3800, 5480], utopia_planitia_drydock: [null, 330, 760] };
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
