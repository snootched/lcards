/**
 * Astrometrics scene effects (E6), headless: the per-object tick (spin and
 * own motion, one helper), the nebula's seeded layout and near fade, and
 * the effects chunk only for configs that need it.
 */
import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { installJsdom } from '../helpers/jsdom-env.js';

const env = installJsdom();
after(() => env.restore());
const { buildScene } = await import('../../src/core/astrometrics/scene-builder.js');
const { stepObjects, built } = await import('../../src/core/astrometrics/objects/common.js');
const { usesEffects, OBJECT_TYPES, LIVE_TYPE_KEYS } = await import('../../src/core/astrometrics/names.js');
const effects = await import('../../src/core/astrometrics/effects/index.js');
const { nearFade, MAX_CLOUDS } = await import('../../src/core/astrometrics/effects/nebula.js');
const { Group } = await import('three');

/** @param {any} [extra] */
function ctx(extra = {}) {
  return { color: () => [0.6, 0.3, 0.9, 1], places: null, sky: () => null, requestFrame: () => {}, loadTexture: () => null, effects, ...extra };
}

test('stepObjects: spin turns, a tick runs with dt and the clock, and either keeps frames coming', () => {
  const spinner = built({ type: 'sphere', spin: 90 }, new Group());
  const calls = [];
  const ticking = built({ type: 'nebula' }, new Group(), { tick: (dt, t) => { calls.push([dt, t]); return true; } });
  const still = built({ type: 'grid' }, new Group());
  assert.equal(stepObjects([still], 16, 16), false, 'nothing moves: no next frame');
  assert.equal(stepObjects([spinner], 1000, 1000), true);
  assert.ok(Math.abs(spinner.node.rotation.y - Math.PI / 2) < 1e-9, '90 degrees in a second');
  assert.equal(stepObjects([still, ticking], 20, 500), true);
  assert.deepEqual(calls, [[20, 500]]);
  // a tick that has settled lets the scene rest
  const settled = built({ type: 'nebula' }, new Group(), { tick: () => false });
  assert.equal(stepObjects([settled], 16, 32), false);
});

test('usesEffects: only configs with a nebula load the effects chunk', () => {
  assert.ok(OBJECT_TYPES.includes('nebula'));
  assert.equal(usesEffects({ objects: [{ type: 'grid' }, { type: 'glow' }] }), false);
  assert.equal(usesEffects({}), false);
  assert.equal(usesEffects({ objects: [{ type: 'nebula' }] }), true);
});

test('nebula layout: seeded (same config, same clouds), cloud_count capped, puffs inside the region', () => {
  const cfg = { type: 'nebula', seed: 3, count: 6, radius: 50 };
  const a = effects.nebulaLayout(cfg);
  const b = effects.nebulaLayout({ ...cfg });
  assert.deepEqual(a, b, 'deterministic');
  assert.equal(a.clouds.length, 6);
  assert.notDeepEqual(effects.nebulaLayout({ ...cfg, seed: 4 }).clouds, a.clouds, 'another seed, another layout');
  for (const c of a.clouds) assert.ok(Math.hypot(...c.xyz) <= 50 + 1e-9, 'cloud centres inside the ball');
  // 3 to 5 puffs per cloud, each smaller than or as big as its cloud
  assert.ok(a.puffs.length >= 18 && a.puffs.length <= 30);
  for (const p of a.puffs) assert.ok(p.radius <= a.clouds[p.cloud].radius + 1e-9);
  assert.equal(effects.nebulaLayout({ count: 40 }).clouds.length, MAX_CLOUDS);
  // default radii: 0.15 to 0.4 of the region, as the preset's fractions
  for (const c of a.clouds) assert.ok(c.radius >= 7.5 - 1e-9 && c.radius <= 20 + 1e-9);
});

test('nebula layout: a box region, and clouds by hand replace the seed', () => {
  const box = effects.nebulaLayout({ size: [200, 20], count: 10 });
  for (const c of box.clouds) {
    assert.ok(Math.abs(c.xyz[0]) <= 100 && Math.abs(c.xyz[2]) <= 100, 'width and depth 200');
    assert.ok(Math.abs(c.xyz[1]) <= 10, 'height 20');
  }
  const hand = effects.nebulaLayout({ clouds: [{ xyz: [10, 0, -5], radius: 12, opacity: 0.5 }, { xyz: [0, 3, 0], color: 'red' }] });
  assert.equal(hand.clouds.length, 2);
  assert.deepEqual(hand.clouds[0].xyz, [10, 0, -5]);
  assert.equal(hand.clouds[0].radius, 12);
  assert.equal(hand.clouds[0].opacity, 0.5);
  assert.ok(hand.clouds[1].color < 0, 'its own colour');
});

test('nebula near fade: gone up close, full from 1.6 radii', () => {
  assert.equal(nearFade(0, 10), 0);
  assert.equal(nearFade(6, 10), 0);
  assert.equal(nearFade(16, 10), 1);
  assert.equal(nearFade(500, 10), 1);
  const mid = nearFade(11, 10);
  assert.ok(mid > 0.4 && mid < 0.6);
});

test('nebula in a scene: one mesh of camera-facing quads, no pick meshes, still unless drift is set', () => {
  const w = buildScene({ objects: [{ type: 'nebula', id: 'neb', count: 3, seed: 2 }, { type: 'grid' }] }, /** @type {any} */ (ctx()));
  const neb = w.objects.get('neb');
  assert.ok(neb);
  const mesh = /** @type {any} */ (neb.node.children[0]);
  assert.equal(mesh.isMesh, true);
  const puffs = effects.nebulaLayout({ count: 3, seed: 2 }).puffs.length;
  assert.equal(mesh.geometry.getAttribute('position').count, puffs * 4, 'four corners a puff');
  assert.equal(mesh.geometry.index.count, puffs * 6);
  assert.equal(neb.pickMeshes.length, 0, 'never takes a tap');
  assert.equal(neb.tick, null, 'still by default: an idle scene draws nothing');
  assert.equal(mesh.material.depthWrite, false);

  const drifting = buildScene({ objects: [{ type: 'nebula', id: 'n', drift: [2, 1] }] }, /** @type {any} */ (ctx())).objects.get('n');
  assert.equal(typeof drifting?.tick, 'function');
  const u = /** @type {any} */ (drifting?.node.children[0]).material.uniforms;
  assert.equal(drifting?.tick?.(16, 0), true);
  /** @param {string} f the field's coordinate offset (cell + rest) */
  const at = (f) => [u[`u${f}Cell`].value.x + u[`u${f}Local`].value.x, u[`u${f}Cell`].value.y + u[`u${f}Local`].value.y];
  const at0 = at('Warp');
  drifting?.tick?.(16, 60_000);
  const at60 = at('Warp');
  assert.ok(at60[0] > at0[0] && at60[1] > at0[1], 'the noise slides with the clock');
  assert.ok(u.uWarpLocal.value.x >= 0 && u.uWarpLocal.value.x < 1, 'split for float precision');
  assert.ok(at('Wisp')[0] < 0, 'wisps drift the other way');

  // No jump when the rest wraps to the next cell: every field's offset moves by a
  // tiny step over a millisecond, at every point of a long run (the old shader
  // scaled the cell and the rest by different factors and jumped 2.7 cells)
  for (const f of ['Warp', 'Wisp']) {
    let prev = null;
    for (let t = 0; t < 600_000; t += 997) {
      for (const dt of [0, 1]) {
        drifting?.tick?.(1, t + dt);
        const p = at(f);
        if (dt === 1 && prev) assert.ok(Math.hypot(p[0] - prev[0], p[1] - prev[1]) < 1e-3, `${f} continuous at t=${t}`);
        prev = p;
      }
    }
  }
});

test('nebula drift follows an entity in place (live): it eases without a jump, and a still one starts where it stands', () => {
  assert.deepEqual([...LIVE_TYPE_KEYS.nebula.keys], ['drift', 'drift.0', 'drift.1', 'density']);
  const n = buildScene({ objects: [{ type: 'nebula', id: 'n', drift: [2, 1] }] }, /** @type {any} */ (ctx())).objects.get('n');
  const u = /** @type {any} */ (n?.node.children[0]).material.uniforms;
  const at = () => [u.uWarpCell.value.x + u.uWarpLocal.value.x, u.uWarpCell.value.y + u.uWarpLocal.value.y];
  n?.tick?.(16, 10_000);
  const before = at();
  // the drift eases up and down every frame: the clouds never jump
  let prev = before;
  for (let t = 10_016, k = 0; k < 200; t += 16, k++) {
    assert.equal(n?.live?.('drift', 2 + 20 * Math.sin(k / 10)), true);
    n?.tick?.(16, t);
    const p = at();
    assert.ok(Math.hypot(p[0] - prev[0], p[1] - prev[1]) < 0.05, `no jump at frame ${k}`);
    prev = p;
  }
  assert.equal(n?.live?.('drift.1', 0), true);
  assert.equal(n?.live?.('seed', 4), false, 'other keys rebuild');
  n?.live?.('drift', null);

  const still = buildScene({ objects: [{ type: 'nebula', id: 's' }] }, /** @type {any} */ (ctx())).objects.get('s');
  assert.equal(still?.tick, null);
  const su = /** @type {any} */ (still?.node.children[0]).material.uniforms;
  still?.live?.('drift', 5);
  assert.equal(typeof still?.tick, 'function', 'a live drift sets it moving');
  still?.tick?.(16, 50_000);
  assert.equal(su.uWarpCell.value.x + su.uWarpLocal.value.x, 0, 'from where it stood, not the clock');
  assert.equal(still?.tick?.(16, 51_000), true);
  assert.ok(su.uWarpCell.value.x + su.uWarpLocal.value.x > 0);
});

test('a bound setting on an object without an id: bindings name it as the scene builder does (type#n)', async () => {
  const { objectIds, collectBindings, settingConfig, bindingKey } = await import('../../src/core/astrometrics/bindings.js');
  const objects = [
    { type: 'grid' },
    { type: 'nebula', drift: { entity: 'input_number.p', output: [0, 12] } },
    { type: 'ring', radius: 30 },
    { type: 'grid', id: 'floor' },
    { type: 'nebula', seed: 2 },
    { type: 'ring', radius: 40 },
  ];
  const w = buildScene({ objects }, /** @type {any} */ (ctx()));
  assert.deepEqual(objectIds(objects), ['grid#1', 'nebula#1', 'ring#1', 'floor', 'nebula#2', 'ring#2']);
  for (const id of objectIds(objects)) assert.ok(w.objects.has(/** @type {string} */ (id)), `the builder has ${id}`);
  // the nebula's drift binds (it was skipped: no id), and its value reaches the right object on a rebuild
  const [drift] = collectBindings({ objects });
  assert.equal(drift.id, 'nebula#1');
  assert.equal(drift.live, true, 'drift eases in place');
  const out = settingConfig({ objects }, [drift], new Map([[bindingKey(drift), 7]]));
  assert.equal(out.objects[1].drift, 7);
  assert.equal(out.objects[4].drift, undefined);
});

test('nebula without the effects chunk is skipped, not thrown', () => {
  const w = buildScene({ objects: [{ type: 'nebula', id: 'neb' }, { type: 'grid', id: 'g' }] }, /** @type {any} */ (ctx({ effects: null })));
  assert.equal(w.objects.has('neb'), false);
  assert.equal(w.objects.has('g'), true);
});

test('scan: each shape sweeps its own range on the clock; a polar disc rings out; still without scan_period', async () => {
  const { scanRange } = await import('../../src/core/astrometrics/grid-mesh-material.js');
  const { scanAt } = await import('../../src/core/packs/backgrounds/webgl/scenes/scan-band.js');
  const w = buildScene({ objects: [
    { type: 'sphere', id: 's', radius: 10, scan: { period: 4 } },
    { type: 'grid', id: 'disc', shape: 'disc', radius: 50, scan: { period: 4 } },
    { type: 'grid', id: 'cyl', shape: 'cylinder', radius: 5, height: 20, scan: { period: 4 } },
    { type: 'grid', id: 'plane', shape: 'plane', size: [40, 30], scan: { period: 4 } },
    { type: 'volume', id: 'v', shape: 'box', size: [10, 6, 10], scan: { period: 4 } },
    { type: 'grid', id: 'plain' }
  ] }, /** @type {any} */ (ctx()));
  const face = (id) => /** @type {any} */ (w.objects.get(id)).gridFaces[0];
  const near = (a, b) => Math.abs(a - b) < 0.2;
  // sphere: latitude arc, north pole to south pole
  const s = scanRange(face('s'));
  assert.ok(near(s.from, Math.PI * 5) && near(s.to, -Math.PI * 5) && !s.radial, JSON.stringify(s));
  // polar disc: centre to rim
  const d = scanRange(face('disc'));
  assert.ok(d.radial && d.from === 0 && near(d.to, 50), JSON.stringify(d));
  // cylinder: top to bottom
  const c = scanRange(face('cyl'));
  assert.ok(near(c.from, 10) && near(c.to, -10));
  // plane (t from its north-west corner): south (+z) to north
  const p = scanRange(face('plane'));
  assert.ok(near(p.from - p.to, 30) && p.from > p.to, JSON.stringify(p));
  // a polar plane rings out from its middle
  const pp = scanRange(buildScene({ objects: [{ type: 'grid', id: 'pp', shape: 'plane', size: [40, 30], pattern: 'polar', scan: { period: 2 } }] }, /** @type {any} */ (ctx())).objects.get('pp')?.gridFaces[0]);
  assert.ok(pp.radial && near(pp.to, 25), JSON.stringify(pp));
  assert.equal(w.objects.get('plain')?.tick, null, 'no scan_period: no tick');

  // the ticker moves the band with the clock and fades it at the ends, as the background grid's
  const sphere = /** @type {any} */ (w.objects.get('s'));
  const u = face('s').userData.uniforms;
  for (const t of [0, 300, 1500, 2900, 3500]) {
    assert.equal(sphere.tick(16, t), true);
    const ref = scanAt(t, 4);
    assert.ok(Math.abs(u.uScanStrength.value - ref.strength) < 1e-9);
    if (ref.strength > 0) assert.ok(Math.abs(u.uScanZ.value - (s.from + (s.to - s.from) * ref.pos)) < 1e-9);
  }
  // a volume scans its walls only (a box: 4 walls of 6 faces), top to bottom
  const vol = /** @type {any} */ (w.objects.get('v'));
  vol.tick(16, 1500);
  const lit = vol.gridFaces.filter((f) => f.userData.uniforms.uScanStrength.value > 0);
  assert.equal(lit.length, 4);
  for (const f of lit) {
    const r = scanRange(f);
    assert.ok(near(r.from, 3) && near(r.to, -3), 'walls run top to bottom');
  }
});

test('flow: dashes slide along the line at flow_speed px/s, pulses ride over it, still by default', () => {
  const w = buildScene({
    points: [{ id: 'a', xyz: [0, 0, 0] }, { id: 'b', xyz: [50, 0, 0] }],
    objects: [
      { type: 'ring', id: 'r', radius: 30, dash: { pattern: [6, 4], speed: 20 } },
      { type: 'path', id: 'p', from: 'a', to: 'b', pulse: true },
      { type: 'beam', id: 'bm', from: 'a', to: 'b', pulse: { length: 10, gap: 30, speed: -40 } },
      { type: 'path', id: 'still', from: 'a', to: 'b', dash: [6, 4] }
    ]
  }, /** @type {any} */ (ctx()));
  const ring = /** @type {any} */ (w.objects.get('r'));
  const dashed = ring.lines.find((l) => l.dashed);
  ring.tick(16, 0);
  assert.equal(dashed.material.dashOffset, -0);
  ring.tick(16, 250);
  // 20 px/s for 0.25 s: 5 px, inside the 10 px period, so the offset is -5
  assert.ok(Math.abs(dashed.material.dashOffset + 5) < 1e-9);
  ring.tick(16, 1000);
  assert.ok(Math.abs(dashed.material.dashOffset) < 1e-9 || Math.abs(dashed.material.dashOffset + 10) < 1e-9, 'wraps every period');

  // a path with pulse: true gets a bright additive dashed line, moving at 80 px/s
  const path = /** @type {any} */ (w.objects.get('p'));
  const pulse = path.lines.find((l) => l.dashed);
  assert.ok(pulse, 'a pulse line');
  assert.equal(pulse.material.blending, 2, 'additive');
  assert.equal(pulse.material.dashSize, 14);
  assert.equal(pulse.material.gapSize, 90);
  path.tick(16, 500);
  assert.ok(Math.abs(pulse.material.dashOffset + 40) < 1e-9, '80 px/s for half a second');

  // beam pulses with their own speed (negative: backwards)
  const beam = /** @type {any} */ (w.objects.get('bm'));
  assert.equal(beam.lines.length, 4, 'three glow layers and the pulse');
  beam.tick(16, 250);
  assert.ok(Math.abs(beam.lines[3].material.dashOffset + 30) < 1e-9, '-10 px wraps to 30 in a 40 px period');

  assert.equal(w.objects.get('still')?.tick, null, 'dashes without flow_speed hold still');
});

test('fill_effect: names match, the sphere body takes the fill and still hides what is behind it, grids get a fill under their lines', async () => {
  const { FILL_EFFECTS } = await import('../../src/core/astrometrics/names.js');
  const { contourStops, MAX_STOPS } = await import('../../src/core/astrometrics/effects/fills.js');
  assert.deepEqual(Object.keys(effects.FILL_TYPES), [...FILL_EFFECTS]);
  assert.equal(usesEffects({ objects: [{ type: 'sphere', fill: { effect: { type: 'plasma' } } }] }), true);

  const w = buildScene({ objects: [
    { type: 'sphere', id: 'star', radius: 10, fill: { effect: { type: 'plasma', speed: 2 } } },
    { type: 'sphere', id: 'giant', radius: 10, image: '/local/x.jpg', fill: { effect: { type: 'contour', colors: ['red', 'blue', 'green'] } } },
    { type: 'grid', id: 'map', shape: 'plane', size: [100, 60], fill: { effect: { type: 'fluid' } } },
    { type: 'sphere', id: 'plain', radius: 10 }
  ] }, /** @type {any} */ (ctx()));
  const star = /** @type {any} */ (w.objects.get('star'));
  const body = star.pickMeshes[0];
  assert.equal(body.material.isShaderMaterial, true);
  assert.equal(body.material.depthWrite, true, 'a filled planet still occludes');
  assert.equal(body.material.uniforms.uType.value, 0);
  assert.ok(Math.abs(body.material.uniforms.uFreq.value - 0.3) < 1e-9, 'about 3 cells across the radius');
  assert.equal(typeof star.tick, 'function', 'speed moves it');
  star.tick(16, 10_000);
  const u = body.material.uniforms;
  assert.ok(u.uCell.value.x + u.uLocal.value.x > 0, 'the field flows');
  assert.ok(u.uLocal.value.x >= 0 && u.uLocal.value.x < 1);

  // fill_effect wins over image
  const giant = /** @type {any} */ (w.objects.get('giant'));
  assert.equal(giant.pickMeshes[0].material.isShaderMaterial, true);
  assert.equal(giant.pickMeshes[0].material.uniforms.uStopCount.value, 3);
  assert.equal(giant.tick, null, 'still by default');

  // grid: a fill mesh per face, drawn between the far and near lines, not writing depth
  const map = /** @type {any} */ (w.objects.get('map'));
  const fills = map.node.children.filter((c) => c.material?.uniforms?.uType);
  assert.equal(fills.length, map.gridFaces.length);
  assert.equal(fills[0].renderOrder, 1.5);
  assert.equal(fills[0].material.depthWrite, false);
  assert.equal(fills[0].geometry, map.gridFaces[0].children[0].geometry, 'shares the face geometry');

  assert.equal(/** @type {any} */ (w.objects.get('plain')).pickMeshes[0].material.isShaderMaterial, undefined);

  // contour stops: one colour doubled, long lists resampled
  assert.equal(contourStops([[1, 0, 0, 1]]).length, 2);
  assert.equal(contourStops(Array.from({ length: 40 }, () => [0, 0, 0, 1])).length, MAX_STOPS);

  // without the chunk: drawn without the fill
  const bare = buildScene({ objects: [{ type: 'sphere', id: 's', fill: { effect: { type: 'plasma' } } }] }, /** @type {any} */ (ctx({ effects: null })));
  assert.equal(/** @type {any} */ (bare.objects.get('s')).pickMeshes[0].material.isMeshBasicMaterial, true);
});

test('warp: streak tails from the camera motion, dust round the camera, the rig flags a warp fly until it lands', async () => {
  const { warpTails } = await import('../../src/core/astrometrics/star-field.js');
  const { CameraRig } = await import('../../src/core/astrometrics/camera-rig.js');
  // still, or no streak: none
  assert.equal(warpTails({ x: 0, y: 0, z: 0 }, 16, { scale: 100, shell: 3000, streak: 1 }), null);
  assert.equal(warpTails({ x: 5, y: 0, z: 0 }, 16, { scale: 100, shell: 3000, streak: 0 }), null);
  // moving +x at 100 units/s, 100 from what it looks at: stars trail 0.05 rad along +x, dust 0.1 s of motion
  const t = warpTails({ x: 1.6, y: 0, z: 0 }, 16, { scale: 100, shell: 3000, streak: 1 });
  assert.ok(t);
  assert.ok(Math.abs(t.speed - 100) < 1e-9);
  assert.ok(Math.abs(t.stars.x - 150) < 1e-6 && t.stars.y === 0, 'tail toward the direction of flight');
  assert.ok(Math.abs(t.dust.x - 10) < 1e-6);
  // capped: a huge speed never wraps the shell
  const fast = warpTails({ x: 1e5, y: 0, z: 0 }, 16, { scale: 1, shell: 3000, streak: 4 });
  assert.ok(fast && fast.stars.length() <= 3000 * 0.4 + 1e-6);

  // dust is seeded in a cube of side 2R round the origin (R 1.5 x the scene radius); the shader wraps it round the camera
  const w = buildScene({ backdrop: { dust: { count: 50, seed: 3 } }, objects: [{ type: 'grid', shape: 'disc', radius: 100 }] }, /** @type {any} */ (ctx()));
  const mesh = /** @type {any} */ (w.dust?.node.children[0]);
  const pos = mesh.geometry.getAttribute('iPos');
  assert.equal(pos.count, 50);
  const R = w.bounds.radius * 1.5;
  assert.equal(mesh.material.uniforms.uReach.value, R);
  let far = 0;
  for (let i = 0; i < pos.count; i++) far = Math.max(far, Math.abs(pos.getX(i)), Math.abs(pos.getY(i)), Math.abs(pos.getZ(i)));
  assert.ok(far <= R + 1e-3 && far > R * 0.5, `within the cube (${far} of ${R})`);
  // the stars do not wrap
  const sky = buildScene({ backdrop: { stars: { count: 5 } } }, /** @type {any} */ (ctx()));
  assert.equal(/** @type {any} */ (sky.stars?.node.children[0]).material.uniforms.uReach.value, 0);

  const rig = new CameraRig();
  const done = rig.flyTo({ distance: 50 }, { duration: 100, warp: true });
  assert.equal(rig.warp, true);
  rig.step(0);
  rig.step(200);
  await done;
  assert.equal(rig.warp, false, 'round again on landing');
  rig.flyTo({ distance: 80 }, { duration: 100 });
  assert.equal(rig.warp, false, 'a plain fly-to never streaks');
  rig.cancel();
});

test('E8 fill presets: names match, a preset gives its type and colours, the config\'s own keys win; bands draw round the latitude', async () => {
  const { FILL_PRESETS: NAMES } = await import('../../src/core/astrometrics/names.js');
  const { FILL_PRESETS, resolveFill } = await import('../../src/core/astrometrics/effects/fills.js');
  assert.deepEqual(Object.keys(FILL_PRESETS), [...NAMES]);
  for (const [name, p] of Object.entries(FILL_PRESETS)) {
    assert.ok(Object.keys(effects.FILL_TYPES).includes(p.type), `${name}: a known type`);
    // colours from the LCARdS palette only (always injected), never hex
    for (const c of p.colors ?? []) assert.match(c, /^var\(--lcards-[a-z-]+\)$/, `${name}: ${c}`);
  }
  assert.equal(resolveFill({ preset: 'gas_giant' }).type, 'bands');
  assert.deepEqual(resolveFill({ preset: 'gas_giant', num_bands: 4, speed: 1 }).num_bands, 4, 'own keys win');
  assert.equal(resolveFill({ preset: 'nope', type: 'fluid' }).type, 'fluid', 'an unknown preset adds nothing');

  const w = buildScene({ objects: [
    { type: 'sphere', id: 'jove', radius: 8, fill: { effect: { preset: 'gas_giant' } } },
    { type: 'sphere', id: 'calm', radius: 8, fill: { effect: { type: 'bands', colors: ['red', 'blue'], turbulence: 0 } } }
  ] }, /** @type {any} */ (ctx()));
  const u = /** @type {any} */ (w.objects.get('jove')).pickMeshes[0].material.uniforms;
  assert.equal(u.uType.value, effects.FILL_TYPES.bands);
  assert.equal(u.uStopCount.value, FILL_PRESETS.gas_giant.colors.length, 'the belt colours are the stops');
  assert.equal(u.uBands.value, FILL_PRESETS.gas_giant.num_bands);
  assert.equal(u.uRadius.value, 8, 'latitude from the radius');
  const calm = /** @type {any} */ (w.objects.get('calm')).pickMeshes[0].material.uniforms;
  assert.equal(calm.uTurb.value, 0);
  assert.equal(calm.uStopCount.value, 2);
});

test('belt colors: each rock takes one of the list by the seed, the layout as without them; color alone tints every rock', async () => {
  const { beltLayout, rockColorIndex, buildBelt } = await import('../../src/core/astrometrics/objects/belt.js');
  const pick = rockColorIndex(600, 3, 5);
  assert.deepEqual(rockColorIndex(600, 3, 5), pick, 'seeded');
  assert.deepEqual([...new Set(pick)].sort(), [0, 1, 2], 'every colour is used');
  for (const k of [0, 1, 2]) assert.ok(pick.filter((v) => v === k).length > 120, `colour ${k} on about a third of the rocks`);
  assert.deepEqual(rockColorIndex(10, 1, 5), new Array(10).fill(0));
  const cfg = { radius: [40, 60], count: 200, seed: 5 };
  assert.deepEqual(beltLayout({ ...cfg, colors: ['red', 'blue'] }), beltLayout(cfg), 'colours do not move the rocks');
  /** @type {Record<string, number[]>} */
  const rgb = { red: [1, 0, 0, 1], blue: [0, 0, 1, 1], gray: [0.5, 0.5, 0.5, 1] };
  const ctx = { color: (/** @type {string} */ v) => rgb[v] ?? rgb.gray };
  const tints = (/** @type {any} */ c) => {
    const b = buildBelt(c, /** @type {any} */ (ctx));
    const mesh = /** @type {any} */ (b.node.getObjectByName('rocks'));
    const dots = /** @type {any} */ (b.node.getObjectByName('dots'));
    const t = mesh.geometry.getAttribute('aTint').array;
    assert.deepEqual([...dots.geometry.getAttribute('aTint').array], [...t], 'the far-away dots in the same colours');
    return Array.from({ length: t.length / 3 }, (_, i) => (t[i * 3] > 0.5 ? 'red' : t[i * 3 + 2] > 0.5 ? 'blue' : 'gray'));
  };
  const two = tints({ ...cfg, colors: ['red', 'blue'] });
  assert.deepEqual(two, rockColorIndex(200, 2, 5).map((k) => ['red', 'blue'][k]));
  assert.deepEqual([...new Set(tints({ ...cfg, color: 'gray' }))], ['gray']);
  assert.deepEqual([...new Set(tints({ ...cfg, color: 'gray', colors: ['red'] }))], ['red'], 'colors wins over color');
});

test('E8 belt: seeded layout inside the band, Kepler orbits (outer slower), tumble, one instanced draw, still when both are 0', async () => {
  const { beltLayout, rockGeometry, MAX_ROCKS } = await import('../../src/core/astrometrics/objects/belt.js');
  const { seededRandom } = await import('../../src/core/packs/backgrounds/webgl/scenes/scene-helpers.js');
  const a = beltLayout({ radius: [40, 60], count: 300, thickness: 6, size: [0.5, 2], seed: 3 });
  assert.equal(a.rocks.length, 300);
  assert.deepEqual(beltLayout({ radius: [40, 60], count: 300, thickness: 6, size: [0.5, 2], seed: 3 }), a, 'seeded: the same config, the same belt');
  assert.notDeepEqual(beltLayout({ radius: [40, 60], count: 300, seed: 4 }).rocks[0], a.rocks[0]);
  for (const k of a.rocks) {
    assert.ok(k.r >= 40 && k.r <= 60, `r ${k.r}`);
    assert.ok(Math.abs(k.y) <= 3 + 1e-9, `y ${k.y}`);
    assert.ok(Math.max(...k.scale) <= 2 * 1.3 + 1e-9);
  }
  assert.deepEqual([beltLayout({ radius: 100 }).inner, beltLayout({ radius: 100 }).outer], [80, 100], 'one number is the outer radius');
  assert.equal(beltLayout({ count: 99999 }).rocks.length, MAX_ROCKS);
  // a rock: flat faces (not indexed), every corner pushed the same way on each face
  const rock = rockGeometry(seededRandom(1));
  assert.equal(rock.index, null);
  assert.equal(rock.getAttribute('position').count, 80 * 3);

  const w = buildScene({ objects: [
    { type: 'belt', id: 'b', radius: [40, 60], count: 50, period: 10, tumble: 0 },
    { type: 'belt', id: 'still', count: 10, tumble: 0 }
  ] }, /** @type {any} */ (ctx()));
  const b = /** @type {any} */ (w.objects.get('b'));
  const mesh = b.pickMeshes[0];
  assert.equal(mesh.isInstancedMesh, true);
  assert.equal(mesh.count, 50);
  assert.equal(b.radius, 60);
  assert.equal(/** @type {any} */ (w.objects.get('still')).tick, null, 'no period, no tumble: nothing moves');
  // after one inner period an inner rock is back, an outer one is not yet round
  const { Matrix4, Vector3 } = await import('three');
  const at = (i) => { const m = new Matrix4(); mesh.getMatrixAt(i, m); return new Vector3().setFromMatrixPosition(m); };
  const layout = beltLayout({ radius: [40, 60], count: 50 });
  const angleOf = (v) => Math.atan2(v.x, -v.z);
  const start = Array.from({ length: 50 }, (_, i) => angleOf(at(i)));
  b.tick(16, 10_000);
  const turned = Array.from({ length: 50 }, (_, i) => {
    const d = ((angleOf(at(i)) - start[i]) / (2 * Math.PI)) % 1;
    return { r: layout.rocks[i].r, frac: (d + 1) % 1 };
  });
  // expected fraction of a turn: (inner / r)^1.5
  for (const { r, frac } of turned) assert.ok(Math.abs(frac - (Math.pow(40 / r, 1.5) % 1)) < 1e-6, `r ${r}: ${frac}`);
});

test('AC1 belt live settings: each radius side, thickness and count change in place round the same rocks; null puts the built value back', async () => {
  const { buildBelt, beltLayout } = await import('../../src/core/astrometrics/objects/belt.js');
  const { Matrix4, Vector3 } = await import('three');
  const cfg = { id: 'b', radius: [40, 60], thickness: 4, count: 100, tumble: 0, seed: 2, _most: { count: 300 } };
  const b = /** @type {any} */ (buildBelt(cfg, /** @type {any} */ ({ color: () => [0.5, 0.5, 0.5, 1] })));
  const mesh = b.node.getObjectByName('rocks');
  const dots = b.node.getObjectByName('dots');
  assert.equal(mesh.instanceMatrix.count, 300, 'built for the most');
  assert.equal(mesh.count, 100, 'draws the count');
  assert.equal(dots.geometry.drawRange.count, 100);
  const layout = beltLayout(cfg);
  assert.deepEqual(layout.rocks.slice(0, 100), beltLayout({ ...cfg, _most: undefined }).rocks, 'the first n are the same belt');
  const at = (/** @type {number} */ i) => { const m = new Matrix4(); mesh.getMatrixAt(i, m); return new Vector3().setFromMatrixPosition(m); };
  const rho = (/** @type {number} */ i) => Math.hypot(at(i).x, at(i).z);
  const u = layout.rocks.map((k) => k.u);
  const g = layout.rocks.map((k) => k.g);
  assert.equal(b.live('radius.1', 100), true);
  for (let i = 0; i < 100; i++) assert.ok(Math.abs(rho(i) - (40 + 60 * u[i])) < 1e-4, 'the same fraction across a wider band');
  assert.equal(b.radius, 100);
  assert.equal(b.live('radius.0', 120), true, 'a side past the other: it becomes the outer edge');
  for (let i = 0; i < 100; i++) assert.ok(Math.abs(rho(i) - (100 + 20 * u[i])) < 1e-4);
  b.live('thickness', 10);
  for (let i = 0; i < 100; i++) assert.ok(Math.abs(at(i).y - g[i] * 5) < 1e-4);
  b.live('count', 250);
  assert.equal(mesh.count, 250);
  b.live('count', 9999);
  assert.equal(mesh.count, 300, 'never past what it was built for');
  for (const k of ['radius.0', 'radius.1', 'thickness', 'count']) b.live(k, null);
  assert.equal(mesh.count, 100);
  for (let i = 0; i < 100; i++) assert.ok(Math.abs(rho(i) - (40 + 20 * u[i])) < 1e-4 && Math.abs(at(i).y - g[i] * 2) < 1e-4, 'back as built');
  assert.equal(b.live('period', 5), false, 'not a live key: the scene rebuilds it');
  b.live('radius', 50);
  assert.equal(b.radius, 50);
  for (let i = 0; i < 100; i++) assert.ok(Math.abs(rho(i) - (40 + 10 * u[i])) < 1e-4, 'one number: outer, the inner 0.8 of it');
});

test('E8 trail: history keeps length seconds, samples spaced, tail shrinks, still point has no line', async () => {
  const { TrailHistory, TRAIL_SAMPLES } = await import('../../src/core/astrometrics/objects/lines.js');
  const h = new TrailHistory(1000);
  // moving along x at 1 unit per ms for 2 s, a push every 1 ms
  for (let t = 0; t <= 2000; t++) h.push(t, [t, 0, 0]);
  const run = h.run();
  const xs = run.filter((_, i) => i % 3 === 0);
  // tail exactly length behind the head, head on the point
  assert.equal(xs[xs.length - 1], 2000);
  assert.ok(Math.abs(xs[0] - 1000) < 1e-6, `tail ${xs[0]}`);
  assert.ok(h.samples.length <= TRAIL_SAMPLES + 2, `samples ${h.samples.length}`);
  assert.ok(h.moving);
  // the point stops: the tail catches up over length, then there is no line
  h.push(2500, [2000, 0, 0]);
  assert.ok(h.run().length > 0);
  h.push(3100, [2000, 0, 0]);
  assert.deepEqual(h.run(), []);
  assert.equal(h.moving, false);
  // a jump (an entity point) leaves a straight line between reported places
  const j = new TrailHistory(10000);
  j.push(0, [0, 0, 0]);
  j.push(500, [10, 0, 0]);
  assert.deepEqual(j.run(), [0, 0, 0, 10, 0, 0]);
});

test('E8 trail: built from a moving point, fades from black to its colour, normal blending', async () => {
  const w = buildScene({
    points: [{ id: 'p', polar: [10, 0], object: 'r' }],
    objects: [{ type: 'ring', id: 'r', radius: 10, spin: 90 }, { type: 'trail', id: 't', point: 'p', length: 2 }]
  }, /** @type {any} */ (ctx()));
  const t = w.objects.get('t');
  assert.ok(t.dynamic && t.tick);
  const line = t.lines[t.lines.length - 1];
  assert.deepEqual(line.style.color.slice(0, 3), [0, 0, 0]);
  assert.ok(!line.style.additive);
});

test('E8 trail: a growing line draws all its segments (three\'s cached instance count is cleared)', async () => {
  const { FatLine } = await import('../../src/core/astrometrics/lines.js');
  const l = new FatLine([[0, 0, 0, 1, 0, 0]], { color: [1, 1, 1, 1], width: 1 });
  // what the renderer stores the first time it draws the geometry
  /** @type {any} */ (l.geometry)._maxInstanceCount = 1;
  l.setRuns([[0, 0, 0, 1, 0, 0, 2, 0, 0, 3, 0, 0]]);
  assert.equal(/** @type {any} */ (l.geometry)._maxInstanceCount, undefined);
  assert.equal(l.geometry.instanceCount, 3);
});

test('E8 cube: in the effects chunk, sized, seeded spots, borg shader shares the face GLSL, plain box with edges', async () => {
  const { BORG_FACE_GLSL } = await import('../../src/core/screen-effects/effects/borg-face-glsl.js');
  assert.ok(OBJECT_TYPES.includes('cube'));
  assert.equal(usesEffects({ objects: [{ type: 'cube' }] }), true);
  assert.deepEqual(effects.cubeSize(10), [10, 10, 10]);
  assert.deepEqual(effects.cubeSize([4, 6, 8]), [4, 6, 8]);
  assert.deepEqual(effects.cubeSize(undefined), [20, 20, 20]);
  const a = effects.cubeSpots(3);
  assert.equal(a.length, 18);
  assert.deepEqual(a.slice(0, 6).map((s) => s[0]), [0, 1, 2, 3, 4, 5], 'one spot on every face first');
  assert.deepEqual(effects.cubeSpots(3), a, 'seeded');
  assert.notDeepEqual(effects.cubeSpots(4), a);

  const w = buildScene({ objects: [{ type: 'cube', id: 'borg', size: [10, 20, 30] }, { type: 'cube', id: 'box', shape: 'box', size: 8 }] }, /** @type {any} */ (ctx()));
  const borg = w.objects.get('borg');
  const mesh = borg.node.getObjectByName('cube');
  assert.deepEqual(mesh.scale.toArray(), [5, 10, 15]);
  assert.ok(mesh.material.fragmentShader.includes(BORG_FACE_GLSL), 'the shared face GLSL');
  assert.ok(mesh.material.fragmentShader.includes('gl_FragDepth'));
  assert.equal(borg.occluder, 'depth');
  assert.ok(borg.occludes && borg.tick);
  // the spots pulse on the scene clock
  borg.tick(16, 1234);
  assert.equal(mesh.material.uniforms.uTime.value, 1234);
  const box = w.objects.get('box');
  assert.ok(box.node.getObjectByName('edges'));
  assert.equal(box.tick, null);
  // detail: false skips the march
  const flat = buildScene({ objects: [{ type: 'cube', id: 'c', detail: false }] }, /** @type {any} */ (ctx()));
  assert.equal(flat.objects.get('c').node.getObjectByName('cube').material.uniforms.uDetail.value, 0);
});

test('depth dust: wraps round the camera, the same on a revisit, faded at the reach, tail in the frame\'s units', async () => {
  const { wrapDust, createStarField } = await import('../../src/core/astrometrics/star-field.js');
  const { Vector3, PerspectiveCamera, Group } = await import('three');
  const R = 10;
  const p = [3, -4, 9];
  for (const cam of [[0, 0, 0], [37, -12, 250], [-1e4, 3, 7.5]]) {
    const { at, fade } = wrapDust(p, cam, R);
    for (let i = 0; i < 3; i++) {
      assert.ok(Math.abs(at[i] - cam[i]) <= R + 1e-9, 'within the reach on every axis');
      // the same cell tile everywhere: the drawn place is the seeded one plus whole cube sides
      const k = (at[i] - p[i]) / (2 * R);
      assert.ok(Math.abs(k - Math.round(k)) < 1e-9);
    }
    assert.ok(fade >= 0 && fade <= 1);
  }
  // leave and come back: the same picture
  assert.deepEqual(wrapDust(p, [1, 2, 3], R), wrapDust(p, [1, 2, 3], R));
  assert.deepEqual(wrapDust(p, [0, 0, 0], R).at.map((v) => +v.toFixed(9)), [3, -4, 9]);
  // full brightness near the camera, none at the reach (no edge to see)
  assert.equal(wrapDust([1, 0, 0], [0, 0, 0], R).fade, 1);
  assert.ok(wrapDust([9.99, 0, 0], [0, 0, 0], R).fade < 1e-3);

  // per draw: the camera in the field's own frame, the tail divided by its scale (a system open, km in a ly scene)
  const f = createStarField({ positions: new Float32Array(3), sizes: new Float32Array(1), colors: new Float32Array(4), reach: R });
  const root = new Group();
  root.scale.setScalar(1000);
  root.position.set(5000, 0, 0);
  root.add(f.mesh);
  root.updateMatrixWorld(true);
  const camera = new PerspectiveCamera();
  camera.position.set(7000, 0, 0);
  camera.updateMatrixWorld(true);
  f.setTail(new Vector3(500, 0, 0));
  /** @type {any} */ (f.mesh.onBeforeRender)(null, null, camera);
  const u = /** @type {any} */ (f.mesh.material).uniforms;
  assert.ok(Math.abs(u.uCam.value.x - 2) < 1e-9 && u.uCam.value.y === 0);
  assert.ok(Math.abs(u.uTail.value.x - 0.5) < 1e-9);
});

test('W1 swirl fill: its own type, colour stops from the heart out, and two layers that only restart while faded out', async () => {
  const { fillMaterial, FILL_TYPES } = await import('../../src/core/astrometrics/effects/fills.js');
  const { FILL_EFFECTS } = await import('../../src/core/astrometrics/names.js');
  assert.ok(FILL_EFFECTS.includes('swirl'));
  const ctx = /** @type {any} */ ({ color: (/** @type {any} */ c) => (c === 'a' ? [1, 0, 0, 1] : [0, 0, 1, 1]) });
  const { material, tick } = fillMaterial({ type: 'swirl', colors: ['a', 'b'], speed: 3 }, ctx, { radius: 15 });
  const u = /** @type {any} */ (material.uniforms);
  assert.equal(u.uType.value, FILL_TYPES.swirl);
  assert.equal(u.uStopCount.value, 2);
  assert.deepEqual([...u.uStops.value.slice(0, 4)], [1, 0, 0, 1], 'the first stop is the heart');
  assert.ok(Math.abs(u.uAng.value - 3 / 15) < 1e-9, 'speed is the turn at the rim');
  assert.ok(tick, 'a moving swirl ticks');
  let prev = [-1, -1];
  for (let t = 0; t < 60000; t += 50) {
    /** @type {any} */ (tick)(50, t);
    const fade = u.uFade.value;
    assert.ok(Math.abs(fade[0] + fade[1] - 1) < 1e-9, 'the two layers always add up to one');
    for (let k = 0; k < 2; k++) {
      // a layer's clock jumps back only when it has faded out (no visible jump)
      if (u.uTau.value[k] < prev[k]) assert.ok(fade[k] < 0.02, `layer ${k} restarted at fade ${fade[k]}`);
      prev[k] = u.uTau.value[k];
    }
  }
  assert.equal(fillMaterial({ type: 'swirl' }, ctx, { radius: 15 }).tick, null, 'still without a speed');
  // down a well it thins out before the throat (no pale tube below the gas)
  assert.equal(/** @type {any} */ (fillMaterial({ type: 'swirl' }, ctx, { radius: 15, depth: 5 }).material.uniforms).uDepth.value, 5);
  assert.match(material.fragmentShader, /if \( uDepth > 0\.0 \) c\.a \*= 1\.0 - smoothstep/);
});

// ---- nebula render: volume ----

test('noise texture: deterministic, tileable (no seam where it repeats), bytes in a sane spread', async () => {
    const { noiseVolume, NOISE_SIZE } = await import('../../src/core/astrometrics/effects/noise3-texture.js');
    const a = noiseVolume();
    assert.equal(a.length, NOISE_SIZE ** 3);
    assert.deepEqual(noiseVolume(), a, 'the same bytes every time');
    const N = NOISE_SIZE;
    const at = (x, y, z) => a[((x + N) % N) + N * (((y + N) % N) + N * ((z + N) % N))];
    // across the wrap (63 to 0) no bigger a step than between neighbours anywhere else
    let seam = 0;
    let inner = 0;
    for (let z = 0; z < N; z += 3) for (let y = 0; y < N; y += 3) {
        seam = Math.max(seam, Math.abs(at(N - 1, y, z) - at(0, y, z)), Math.abs(at(y, N - 1, z) - at(y, 0, z)), Math.abs(at(y, z, N - 1) - at(y, z, 0)));
        for (let x = 0; x < N - 1; x++) inner = Math.max(inner, Math.abs(at(x + 1, y, z) - at(x, y, z)));
    }
    assert.ok(seam <= inner, `seam ${seam} vs neighbours ${inner}`);
    let sum = 0;
    for (const v of a) sum += v;
    const mean = sum / a.length / 255;
    // the shader standardises around this mean (NOISE_MEAN in nebula-volume.js)
    assert.ok(Math.abs(mean - 0.55) < 0.03, `mean ${mean}`);
});

test('nebula volume: gas fades to nothing at the region\'s faces, full well inside (box and ball)', async () => {
    const { edgeFalloff } = await import('../../src/core/astrometrics/effects/nebula-volume.js');
    for (const ball of [false, true]) {
        assert.equal(edgeFalloff([0, 0, 0], ball), 1);
        assert.equal(edgeFalloff([1, 0, 0], ball), 0);
        assert.equal(edgeFalloff([0, -1, 0], ball), 0);
        assert.ok(edgeFalloff([0.5, 0, 0], ball) > edgeFalloff([0.9, 0, 0], ball));
    }
    // a box's corner is rounded: no gas there
    assert.equal(edgeFalloff([0.95, 0.95, 0.95], false), 0);
});

test('nebula layout: render: volume keeps the seeded clouds (places, colours, opacities), bigger by default', () => {
    const cfg = { type: 'nebula', seed: 9, count: 5, radius: 80, colors: ['red', 'blue', 'green'] };
    const puffs = effects.nebulaLayout(cfg);
    const vol = effects.nebulaLayout({ ...cfg, render: 'volume' });
    assert.deepEqual(vol.clouds.map((c) => [c.xyz, c.color, c.opacity]), puffs.clouds.map((c) => [c.xyz, c.color, c.opacity]));
    for (const c of vol.clouds) assert.ok(c.radius >= 80 * 0.25 - 1e-9 && c.radius <= 80 * 0.55 + 1e-9);
    // radii set by hand: the same clouds in both modes
    const set = { ...cfg, min_radius: 10, max_radius: 20 };
    assert.deepEqual(effects.nebulaLayout({ ...set, render: 'volume' }).clouds, effects.nebulaLayout(set).clouds);
});

test('nebula render: volume: one region mesh, not pickable, a prerender pass; density and drift ease in place', () => {
    const frames = [];
    const b = effects.buildNebula({ type: 'nebula', id: 'v', render: 'volume', size: [200, 40, 200], count: 3, seed: 2 }, ctx({ requestFrame: () => frames.push(1) }));
    const mesh = /** @type {any} */ (b.node.children[0]);
    assert.equal(mesh.name, 'nebula-volume');
    assert.equal(b.pickMeshes.length, 0);
    assert.equal(typeof b.prerender, 'function');
    assert.equal(b.tick, null, 'still unless it drifts');
    assert.equal(mesh.material.depthWrite, false);
    assert.equal(mesh.material.depthTest, false, 'its own back face must not hide the gas in front of a planet');
    assert.ok(mesh.renderOrder > 2, 'after the grid faces (a sphere\'s face paints its body)');
    assert.equal(b.live?.('density', 2.5), true);
    assert.ok(frames.length > 0, 'a density change asks for a frame');
    assert.equal(b.live?.('drift', 4), true);
    assert.equal(typeof b.tick, 'function', 'drift from an entity starts the tick');
    assert.equal(b.tick?.(16, 1000), true);
    assert.equal(b.live?.('turbulence', 1), false, 'not live: a rebuild');
    assert.ok(LIVE_TYPE_KEYS.nebula.keys.includes('density'));
    // a ball when there is no size
    const ball = effects.buildNebula({ type: 'nebula', render: 'volume', radius: 50 }, ctx());
    assert.equal(/** @type {any} */ (ball.node.children[0]).geometry.type, 'IcosahedronGeometry');
});

test('nebula volume drift: body and wisp offsets move smoothly through every wrap (no jump when the body loops)', async () => {
    const { stepDrift } = await import('../../src/core/astrometrics/effects/nebula-volume.js');
    // distance round the 0 to 1 circle the texture repeats on
    const gap = (/** @type {number} */ a, /** @type {number} */ b) => { const d = Math.abs(a - b) % 1; return Math.min(d, 1 - d); };
    let o = { body: /** @type {[number, number]} */ ([0, 0]), wisp: /** @type {[number, number]} */ ([0, 0]) };
    const d = /** @type {[number, number]} */ ([0.013, -0.007]);
    let bodyWraps = 0;
    for (let i = 0; i < 400; i++) {
        const n = stepDrift(o, d);
        if (n.body[0] < o.body[0]) bodyWraps++;
        for (const k of [0, 1]) {
            assert.ok(gap(n.body[k], o.body[k]) <= Math.abs(d[k]) + 1e-9, `body ${k} steps by d`);
            assert.ok(gap(n.wisp[k], o.wisp[k]) <= Math.abs(d[k]) * 1.7 * 2.7 + 1e-9, `wisp ${k} steps by d x its rate, step ${i}`);
            assert.ok(n.body[k] >= 0 && n.body[k] < 1 && n.wisp[k] >= 0 && n.wisp[k] < 1, 'kept within 0 to 1');
        }
        o = n;
    }
    assert.ok(bodyWraps >= 5, 'the run crosses several body wraps');
});

test('solid depth: only meshes that write depth count as solids', async () => {
    const { isSolid } = await import('../../src/core/astrometrics/effects/solid-depth.js');
    const { Mesh, Line, BoxGeometry, MeshBasicMaterial } = await import('three');
    const geo = new BoxGeometry();
    assert.equal(isSolid(new Mesh(geo, new MeshBasicMaterial({ depthWrite: true }))), true);
    assert.equal(isSolid(new Mesh(geo, new MeshBasicMaterial({ depthWrite: false }))), false);
    assert.equal(isSolid(new Line(geo, new MeshBasicMaterial({ depthWrite: true }))), false);
    assert.equal(isSolid(new Mesh(geo, [new MeshBasicMaterial({ depthWrite: false }), new MeshBasicMaterial({ depthWrite: true })])), true);
});

test('schema: nebula render and density', async () => {
    const { CoreValidationService } = await import('../../src/core/validation-service/index.js');
    const { astrometricsSchema } = await import('../../src/cards/schemas/astrometrics-schema.js');
    const v = new CoreValidationService({ cacheResults: false });
    const issues = (o) => { const r = v.validate({ type: 'custom:lcards-astrometrics-card', objects: [{ type: 'nebula', ...o }] }, astrometricsSchema); return [...r.errors, ...r.warnings]; };
    assert.deepEqual(issues({ render: 'volume', density: 2 }), []);
    assert.deepEqual(issues({ render: 'puffs' }), []);
    assert.ok(issues({ render: 'cloud' }).some((e) => e.field === 'objects[0].render'));
    assert.ok(issues({ density: -1 }).some((e) => e.field === 'objects[0].density'));
    assert.deepEqual(issues({ render: 'volume', density: { entity: 'input_number.x', input: [0, 100], output: [0, 3] } }), []);
});

test('NB1 nebula layout: stretch and dust from their own seed streams (no gas cloud moves); hand size and rotation', () => {
  const cfg = { type: 'nebula', render: 'volume', seed: 4, count: 6, radius: 130 };
  const round = effects.nebulaLayout(cfg);
  for (const c of round.clouds) {
    assert.deepEqual(c.axes, [c.radius, c.radius, c.radius], 'round by default');
    assert.deepEqual(c.turn, [0, 0, 0]);
    assert.equal(c.dust, false);
  }
  const stretched = effects.nebulaLayout({ ...cfg, stretch: 0.6 });
  assert.deepEqual(stretched, effects.nebulaLayout({ ...cfg, stretch: 0.6 }), 'deterministic');
  stretched.clouds.forEach((c, i) => {
    assert.deepEqual([c.xyz, c.radius, c.color, c.opacity], [round.clouds[i].xyz, round.clouds[i].radius, round.clouds[i].color, round.clouds[i].opacity], 'same places, sizes, colours');
    assert.ok(c.axes[0] > c.radius && c.axes[1] < c.radius, 'one axis long, one short');
  });
  const dusty = effects.nebulaLayout({ ...cfg, dust: { count: 2 } });
  assert.equal(dusty.clouds.length, 8);
  assert.deepEqual(dusty.clouds.slice(0, 6), round.clouds, 'adding dust moves no gas cloud');
  assert.deepEqual(dusty.puffs, round.puffs, 'dust makes no puffs');
  assert.ok(dusty.clouds.slice(6).every((c) => c.dust));
  assert.equal(effects.nebulaLayout({ ...cfg, dust: { count: 40 } }).clouds.filter((c) => c.dust).length, 4, 'at most 4 dust clouds');
  const hand = effects.nebulaLayout({ clouds: [{ xyz: [0, 0, 0], size: [80, 20, 40], rotation: [0, 90, 0] }, { radius: 5, dust: true }] });
  assert.deepEqual(hand.clouds[0].axes, [40, 10, 20]);
  assert.equal(hand.clouds[0].radius, 40, 'its bound: the longest half axis');
  assert.ok(Math.abs(hand.clouds[0].turn[1] + Math.PI / 2) < 1e-9, 'y the other way, as an object\'s rotation');
  assert.equal(hand.clouds[1].dust, true);
});

test('NB1 cloud matrix: a round cloud is I / r; an ellipsoid maps its own surface to the unit ball', async () => {
  const { cloudMatrix } = await import('../../src/core/astrometrics/effects/nebula-volume.js');
  const { Vector3 } = await import('three');
  const m = cloudMatrix({ axes: [20, 20, 20], turn: [0, 0, 0] }).elements;
  assert.deepEqual(m.map((v) => +v.toFixed(9)), [0.05, 0, 0, 0, 0.05, 0, 0, 0, 0.05]);
  // a long axis of 40 on x turned 90 degrees on y (rotation [0, 90, 0]: turn y = -pi/2)
  const c = { axes: [40, 10, 20], turn: [0, -Math.PI / 2, 0] };
  const along = effects.turnYXZ([40, 0, 0], c.turn);
  const len = new Vector3(...along).applyMatrix3(cloudMatrix(c)).length();
  assert.ok(Math.abs(len - 1) < 1e-9, `the tip of the long axis is on the surface (${len})`);
  assert.ok(Math.abs(Math.abs(along[2]) - 40) < 1e-9, 'turned onto z');
});

test('NB1 schema: nebula shape, stretch, dust, core colour, ellipsoid clouds', async () => {
  const { CoreValidationService } = await import('../../src/core/validation-service/index.js');
  const { astrometricsSchema } = await import('../../src/cards/schemas/astrometrics-schema.js');
  const v = new CoreValidationService({ cacheResults: false });
  const issues = (o) => { const r = v.validate({ type: 'custom:lcards-astrometrics-card', objects: [{ type: 'nebula', ...o }] }, astrometricsSchema); return [...r.errors, ...r.warnings]; };
  assert.deepEqual(issues({ render: 'volume', shape: 'bipolar', stretch: 0.4, core: { color: 'var(--lcards-moonlight)' }, dust: { amount: 0.5, count: 2, color: 'var(--lcars-gray)' }, clouds: [{ size: [10, 2, 4], rotation: [0, 20, 0] }, { dust: true }] }), []);
  for (const s of ['clouds', 'shell', 'bipolar', 'filaments', 'cavity']) assert.deepEqual(issues({ render: 'volume', shape: s }), []);
  assert.ok(issues({ shape: 'layers' }).some((e) => e.field === 'objects[0].shape'), 'layers comes in NB2');
  assert.ok(issues({ stretch: 2 }).some((e) => e.field === 'objects[0].stretch'));
  assert.ok(issues({ dust: { count: 1.5 } }).length > 0);
  assert.ok(issues({ dust: { count: 9 } }).length > 0);
});

test('NB1 nebula layout: the seed places today\'s clouds where they always were (pinned before NB1)', () => {
  const l = effects.nebulaLayout({ seed: 5, count: 3, size: [220, 60, 220], render: 'volume' });
  const got = l.clouds.map((c) => [c.xyz.map((v) => +v.toFixed(4)), +c.radius.toFixed(4), c.color, +c.opacity.toFixed(4)]);
  assert.deepEqual(got, [[[60.0035, -16.8142, 27.0993], 30.3095, 0, 0.5961], [[-9.2171, 24.3373, -59.5256], 53.2355, 0, 0.6703], [[-106.9593, -2.0759, -43.8999], 57.0861, 0, 0.4441]]);
});
