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
const { usesEffects, OBJECT_TYPES } = await import('../../src/core/astrometrics/names.js');
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
  const cfg = { type: 'nebula', seed: 3, cloud_count: 6, radius: 50 };
  const a = effects.nebulaLayout(cfg);
  const b = effects.nebulaLayout({ ...cfg });
  assert.deepEqual(a, b, 'deterministic');
  assert.equal(a.clouds.length, 6);
  assert.notDeepEqual(effects.nebulaLayout({ ...cfg, seed: 4 }).clouds, a.clouds, 'another seed, another layout');
  for (const c of a.clouds) assert.ok(Math.hypot(...c.xyz) <= 50 + 1e-9, 'cloud centres inside the ball');
  // 3 to 5 puffs per cloud, each smaller than or as big as its cloud
  assert.ok(a.puffs.length >= 18 && a.puffs.length <= 30);
  for (const p of a.puffs) assert.ok(p.radius <= a.clouds[p.cloud].radius + 1e-9);
  assert.equal(effects.nebulaLayout({ cloud_count: 40 }).clouds.length, MAX_CLOUDS);
  // default radii: 0.15 to 0.4 of the region, as the preset's fractions
  for (const c of a.clouds) assert.ok(c.radius >= 7.5 - 1e-9 && c.radius <= 20 + 1e-9);
});

test('nebula layout: a box region, and clouds by hand replace the seed', () => {
  const box = effects.nebulaLayout({ size: [200, 20], cloud_count: 10 });
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
  const w = buildScene({ objects: [{ type: 'nebula', id: 'neb', cloud_count: 3, seed: 2 }, { type: 'grid' }] }, /** @type {any} */ (ctx()));
  const neb = w.objects.get('neb');
  assert.ok(neb);
  const mesh = /** @type {any} */ (neb.node.children[0]);
  assert.equal(mesh.isMesh, true);
  const puffs = effects.nebulaLayout({ cloud_count: 3, seed: 2 }).puffs.length;
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

test('nebula without the effects chunk is skipped, not thrown', () => {
  const w = buildScene({ objects: [{ type: 'nebula', id: 'neb' }, { type: 'grid', id: 'g' }] }, /** @type {any} */ (ctx({ effects: null })));
  assert.equal(w.objects.has('neb'), false);
  assert.equal(w.objects.has('g'), true);
});

test('scan: each shape sweeps its own range on the clock; a polar disc rings out; still without scan_period', async () => {
  const { scanRange } = await import('../../src/core/astrometrics/grid-mesh-material.js');
  const { scanAt } = await import('../../src/core/packs/backgrounds/webgl/scenes/scan-band.js');
  const w = buildScene({ objects: [
    { type: 'sphere', id: 's', radius: 10, scan_period: 4 },
    { type: 'grid', id: 'disc', shape: 'disc', radius: 50, scan_period: 4 },
    { type: 'grid', id: 'cyl', shape: 'cylinder', radius: 5, height: 20, scan_period: 4 },
    { type: 'grid', id: 'plane', shape: 'plane', size: [40, 30], scan_period: 4 },
    { type: 'volume', id: 'v', shape: 'box', size: [10, 6, 10], scan_period: 4 },
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
  const pp = scanRange(buildScene({ objects: [{ type: 'grid', id: 'pp', shape: 'plane', size: [40, 30], pattern: 'polar', scan_period: 2 }] }, /** @type {any} */ (ctx())).objects.get('pp')?.gridFaces[0]);
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
      { type: 'ring', id: 'r', radius: 30, dash: [6, 4], flow_speed: 20 },
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
  assert.equal(usesEffects({ objects: [{ type: 'sphere', fill_effect: { type: 'plasma' } }] }), true);

  const w = buildScene({ objects: [
    { type: 'sphere', id: 'star', radius: 10, fill_effect: { type: 'plasma', speed: 2 } },
    { type: 'sphere', id: 'giant', radius: 10, image: '/local/x.jpg', fill_effect: { type: 'contour', colors: ['red', 'blue', 'green'] } },
    { type: 'grid', id: 'map', shape: 'plane', size: [100, 60], fill_effect: { type: 'fluid' } },
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
  const bare = buildScene({ objects: [{ type: 'sphere', id: 's', fill_effect: { type: 'plasma' } }] }, /** @type {any} */ (ctx({ effects: null })));
  assert.equal(/** @type {any} */ (bare.objects.get('s')).pickMeshes[0].material.isMeshBasicMaterial, true);
});

test('warp: streak tails from the camera motion, dust round the scene, the rig flags a warp fly until it lands', async () => {
  const { warpTails } = await import('../../src/core/astrometrics/star-field.js');
  const { CameraRig } = await import('../../src/core/astrometrics/camera-rig.js');
  // still, or no streak: none
  assert.equal(warpTails({ x: 0, y: 0, z: 0 }, 16, { sceneRadius: 100, shell: 3000, streak: 1 }), null);
  assert.equal(warpTails({ x: 5, y: 0, z: 0 }, 16, { sceneRadius: 100, shell: 3000, streak: 0 }), null);
  // moving +x at 100 units/s in a scene of radius 100: stars trail 0.05 rad along +x, dust 0.1 s of motion
  const t = warpTails({ x: 1.6, y: 0, z: 0 }, 16, { sceneRadius: 100, shell: 3000, streak: 1 });
  assert.ok(t);
  assert.ok(Math.abs(t.speed - 100) < 1e-9);
  assert.ok(Math.abs(t.stars.x - 150) < 1e-6 && t.stars.y === 0, 'tail toward the direction of flight');
  assert.ok(Math.abs(t.dust.x - 10) < 1e-6);
  // capped: a huge speed never wraps the shell
  const fast = warpTails({ x: 1e5, y: 0, z: 0 }, 16, { sceneRadius: 1, shell: 3000, streak: 4 });
  assert.ok(fast && fast.stars.length() <= 3000 * 0.4 + 1e-6);

  // dust sits round the scene's bounds, not the camera
  const w = buildScene({ backdrop: { dust: { count: 50, seed: 3 } }, objects: [{ type: 'grid', shape: 'disc', radius: 100 }] }, /** @type {any} */ (ctx()));
  const pos = /** @type {any} */ (w.dust?.node.children[0]).geometry.getAttribute('iPos');
  assert.equal(pos.count, 50);
  const c = w.bounds.center;
  const R = w.bounds.radius * 1.5;
  let far = 0;
  for (let i = 0; i < pos.count; i++) far = Math.max(far, Math.hypot(pos.getX(i) - c.x, pos.getY(i) - c.y, pos.getZ(i) - c.z));
  assert.ok(far <= R + 1e-3 && far > R * 0.5, `within 1.5 x the scene radius (${far} of ${R})`);

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
    { type: 'sphere', id: 'jove', radius: 8, fill_effect: { preset: 'gas_giant' } },
    { type: 'sphere', id: 'calm', radius: 8, fill_effect: { type: 'bands', colors: ['red', 'blue'], turbulence: 0 } }
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

  const w = buildScene({ objects: [{ type: 'cube', id: 'borg', size: [10, 20, 30] }, { type: 'cube', id: 'box', style: 'plain', size: 8 }] }, /** @type {any} */ (ctx()));
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
