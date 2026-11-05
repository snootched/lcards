/**
 * CE1: the Crystalline Entity (`type: crystalline`): its seeded shape, size
 * in named units, level of detail, live keys, schema and the starter part.
 */
import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { installJsdom } from '../helpers/jsdom-env.js';

const env = installJsdom();
after(() => env.restore());
const { crystallineModel, crystallineShards, shardGeometry, envelope, buildCrystalline, ENTITY_KM, MAX_LEVELS } = await import('../../src/core/astrometrics/objects/crystalline.js');
const { buildScene } = await import('../../src/core/astrometrics/scene-builder.js');
const { OBJECT_TYPES, TYPE_GUIDE, LIVE_TYPE_KEYS, kmPerUnit } = await import('../../src/core/astrometrics/names.js');
const { TYPE_SAMPLES } = await import('../../src/core/astrometrics/object-samples.js');
const { PerspectiveCamera } = await import('three');

function ctx(extra = {}) {
  return { color: () => [0.2, 0.6, 0.8, 1], places: null, sky: () => null, requestFrame: () => {}, loadTexture: () => null, ...extra };
}

test('size: 3 km by default in named units, 3000 in plain scene units, size wins', () => {
  assert.equal(ENTITY_KM, 3);
  assert.equal(crystallineModel({}).H, 3000);
  assert.equal(crystallineModel({}, kmPerUnit('km')).H, 3);
  assert.ok(Math.abs(crystallineModel({}, kmPerUnit('m')).H - 3000) < 1e-9);
  assert.ok(Math.abs(crystallineModel({}, kmPerUnit('au')).H - 3 / 1.495978707e8) < 1e-15);
  assert.equal(crystallineModel({ size: 50 }, kmPerUnit('km')).H, 50);
  assert.equal(crystallineModel({}).W, 2400, '0.8 of the height across');
});

test('branches: 1 to 5 fork levels, default 4, whole numbers', () => {
  assert.equal(crystallineModel({}).levels, 4);
  assert.equal(crystallineModel({ branches: 0 }).levels, 1);
  assert.equal(crystallineModel({ branches: 9 }).levels, MAX_LEVELS);
  assert.equal(crystallineModel({ branches: 2.6 }).levels, 3);
});

test('seeded: the same seed gives the same entity, another seed another', () => {
  const a = crystallineShards(crystallineModel({ seed: 7 }));
  assert.deepEqual(a, crystallineShards(crystallineModel({ seed: 7 })));
  assert.notDeepEqual(a.shards[60], crystallineShards(crystallineModel({ seed: 8 })).shards[60]);
});

test('shards come level by level (a draw range is a level of detail), more at each level', () => {
  const { shards, levelEnds } = crystallineShards(crystallineModel({}));
  assert.equal(levelEnds.length, 5, 'the spine and core, then 4 fork levels');
  assert.equal(levelEnds[levelEnds.length - 1], shards.length);
  const per = levelEnds.map((e, i) => e - (levelEnds[i - 1] ?? 0));
  // each fork level holds more shards than the one before (the spine and core spikes are level 0)
  for (let i = 2; i < per.length; i++) assert.ok(per[i] > per[i - 1], `level ${i}: ${per}`);
  let level = 0;
  shards.forEach((s, i) => {
    while (i >= levelEnds[level]) level++;
    assert.equal(s.level, level, `shard ${i}`);
  });
  // a frame budget: the default entity stays under about 15,000 shards
  assert.ok(shards.length > 5000 && shards.length < 15000, `${shards.length} shards`);
  // fewer levels, fewer shards
  assert.ok(crystallineShards(crystallineModel({ branches: 2 })).shards.length < levelEnds[3]);
});

test('everything stays inside the spindle (with a margin for the blades)', () => {
  const m = crystallineModel({ size: 100 });
  for (const s of crystallineShards(m).shards) {
    for (const p of [s.a, s.b]) {
      assert.ok(Math.abs(p[1]) <= m.H / 2 + 1e-9, 'within the height');
      assert.ok(Math.hypot(p[0], p[2]) <= envelope(m, p[1]) * 1.03 + m.H * 0.16, 'within the width');
    }
  }
  assert.equal(envelope(m, 0), m.W / 2);
  assert.equal(envelope(m, m.H / 2), 0);
});

test('one flat-shaded mesh: 24 corners a shard, normals unit length', () => {
  const { shards } = crystallineShards(crystallineModel({ branches: 2 }));
  const { geometry, vertsPerShard } = shardGeometry(shards);
  assert.equal(vertsPerShard, 24);
  assert.equal(geometry.getAttribute('position').count, shards.length * 24);
  const n = geometry.getAttribute('normal');
  for (let i = 0; i < n.count; i += 97) assert.ok(Math.abs(Math.hypot(n.getX(i), n.getY(i), n.getZ(i)) - 1) < 1e-4);
});

test('in a scene: built, radius half the height, still with period 0, pulsing otherwise', () => {
  const w = buildScene({ objects: [{ type: 'crystalline', id: 'e', size: 40 }] }, /** @type {any} */ (ctx()));
  const e = w.objects.get('e');
  assert.ok(e);
  assert.equal(e.radius, 20);
  assert.equal(e.occludes, false, 'see-through: hides no labels');
  assert.ok(e.tick, 'the core pulses');
  assert.equal(buildCrystalline({ type: 'crystalline', core: { period: 0 } }, /** @type {any} */ (ctx())).tick, null);
});

test('level of detail: a dot far away, fewer fork levels mid-way, all close up', () => {
  const e = buildCrystalline({ type: 'crystalline', size: 100 }, /** @type {any} */ (ctx()));
  const crystal = /** @type {any} */ (e.node.getObjectByName('crystal'));
  const dot = /** @type {any} */ (e.node.getObjectByName('dot'));
  const cam = new PerspectiveCamera(50, 1.6, 0.1, 1e9);
  const at = (d) => {
    cam.position.set(0, 0, d);
    cam.updateMatrixWorld();
    e.node.updateMatrixWorld();
    e.lod?.({ camera: cam, height: 600, dpr: 1 });
    return { dot: dot.visible, crystal: crystal.visible, count: crystal.geometry.drawRange.count };
  };
  const all = crystal.geometry.getAttribute('position').count;
  const far = at(1e6);
  assert.equal(far.dot, true);
  assert.equal(far.crystal, false);
  // about 6 px tall (100 tall, 600 px view, 50 degrees): too small for branches, a dot
  assert.equal(at(11000).dot, true);
  const close = at(150);
  assert.equal(close.dot, false);
  assert.ok(close.count >= all, 'every level close up');
  const mid = at(1500);
  assert.equal(mid.crystal, true);
  assert.ok(mid.count < all && mid.count > 0, 'fewer levels mid-way');
});

test('live keys: glow and opacity change in place, null puts them back', () => {
  assert.deepEqual(LIVE_TYPE_KEYS.crystalline.keys, ['glow', 'opacity', 'color']);
  const e = buildCrystalline({ type: 'crystalline', glow: 0.5 }, /** @type {any} */ (ctx()));
  const mat = /** @type {any} */ (e.node.getObjectByName('crystal')).material;
  assert.equal(e.live?.('glow', 0.9), true);
  assert.equal(mat.uniforms.uGlow.value, 0.9);
  e.live?.('glow', null);
  assert.equal(mat.uniforms.uGlow.value, 0.5);
  // glow drives the core's starburst too (its size and brightness), not only the crystal
  const coreMat = /** @type {any} */ (e.node.getObjectByName('core')).material;
  e.live?.('glow', 0.1);
  assert.equal(coreMat.uniforms.uGlow.value, 0.1);
  assert.match(coreMat.fragmentShader, /uGlow/);
  assert.match(coreMat.vertexShader, /uGlow/);
  e.live?.('opacity', 2);
  assert.equal(mat.uniforms.uOpacity.value, 1, 'clamped');
  assert.equal(e.live?.('seed', 3), false);
});

test('live colour: the first lands at once, the next crossfades (no rebuild), null puts the config\'s back', () => {
  const colors = { 'var(--a)': [1, 0, 0, 1], 'var(--b)': [0, 0, 1, 1] };
  const e = buildCrystalline({ type: 'crystalline' }, /** @type {any} */ (ctx({ color: (/** @type {any} */ v) => colors[v] ?? [0.2, 0.6, 0.8, 1] })));
  const u = /** @type {any} */ (e.node.getObjectByName('crystal')).material.uniforms;
  const node = e.node;
  assert.equal(e.liveColor?.('color', 'var(--a)'), true);
  assert.deepEqual(u.uColor.value.toArray().map((v) => Math.round(v * 100) / 100), [1, 0, 0], 'the first at once');
  const realNow = performance.now;
  let now = 1000;
  performance.now = () => now;
  try {
    e.liveColor?.('color', 'var(--b)');
    e.tick?.(16, 0);
    assert.ok(u.uColor.value.r > 0.99 && u.uColor.value.b < 0.01, 'starts from where it was');
    now += 400;
    e.tick?.(16, 0);
    assert.ok(u.uColor.value.r > 0.1 && u.uColor.value.b > 0.1, 'half-way: a mix');
    now += 500;
    assert.equal(e.tick?.(16, 0), true, 'the core still pulses');
    assert.ok(u.uColor.value.b > 0.99 && u.uColor.value.r < 0.01, 'there after 800 ms');
  } finally {
    performance.now = realNow;
  }
  assert.equal(e.node, node, 'the same object, not rebuilt');
  assert.equal(e.liveColor?.('glow', 'var(--a)'), false, 'only its colour');
});

test('registered: an object type with a guide entry and a Studio sample', () => {
  assert.ok(OBJECT_TYPES.includes('crystalline'));
  assert.ok(TYPE_GUIDE.some((t) => t.type === 'crystalline'));
  assert.ok(TYPE_SAMPLES.crystalline);
});

test('schema: the keys validate, unknown and out-of-range ones do not', async () => {
  const { CoreValidationService } = await import('../../src/core/validation-service/index.js');
  const { astrometricsSchema } = await import('../../src/cards/schemas/astrometrics-schema.js');
  const v = new CoreValidationService({ cacheResults: false });
  const check = (o) => { const r = v.validate({ type: 'custom:lcards-astrometrics-card', objects: [{ type: 'crystalline', ...o }] }, astrometricsSchema); return [...r.errors, ...r.warnings]; };
  assert.deepEqual(check({}), []);
  assert.deepEqual(check({ size: 3, seed: 2, branches: 3, color: 'var(--lcars-african-violet)', glow: 0.4, opacity: 0.8, blend: 'normal', spin: 2, core: { color: 'var(--lcards-moonlight)', period: 0 } }), []);
  assert.deepEqual(check({ glow: { entity: 'input_number.x', input: [0, 100], output: [0, 1] } }), []);
  assert.ok(check({ branches: 9 }).length > 0);
  assert.ok(check({ core: { pulse: 3 } }).length > 0, 'the core takes period, not pulse');
});

test('starter part: the entity, a ship at the same scale and the beam', async () => {
  const { STARTERS } = await import('../../src/core/astrometrics/starters/index.js');
  const part = STARTERS.find((s) => s.id === 'crystalline-entity');
  assert.ok(part);
  assert.equal(part.kind, 'part');
  const f = part.build({ prefix: 'entity', label: 'CE', centre: [0, 0, 0], size: 3000, ship: 'beam' }, { units: null });
  const types = (f.objects ?? []).map((o) => o.type);
  assert.deepEqual(types, ['crystalline', 'model', 'beam']);
  const ship = (f.objects ?? []).find((o) => o.type === 'model');
  assert.ok(Math.abs(ship.size - 289) < 1, 'the Constitution class at 289 against 3000');
  assert.deepEqual(part.build({ centre: [0, 0, 0], size: 3000, ship: 'none', label: 'CE' }, { units: null }).objects?.map((o) => o.type), ['crystalline']);
});
