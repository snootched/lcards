/**
 * Astrometrics deformed grids (E5): the warps (wobble, bend, twist, noise)
 * in both frames, the well shape (and the wormhole profile shared with the
 * background grid), and a deformed grid in a scene: vertices, rims and
 * points on it move with the scene clock, and a pick maps back to the
 * undeformed surface.
 */
import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { installJsdom } from '../helpers/jsdom-env.js';

const env = installJsdom();
after(() => env.restore());
const { makeDeformer, deformStep, valueNoise3, fbm3 } = await import('../../src/core/astrometrics/deform.js');
const { buildScene } = await import('../../src/core/astrometrics/scene-builder.js');
const { stepObjects } = await import('../../src/core/astrometrics/objects/common.js');
const { wellGeometry } = await import('../../src/core/astrometrics/surface.js');
const { wellProfile, WELL_SHAPES } = await import('../../src/core/packs/backgrounds/effects/grid-surface-model.js');
const { Raycaster, Vector3 } = await import('three');

const AXIAL = { kind: /** @type {const} */ ('axial'), size: 100, y0: -50, y1: 50 };
const FLAT = { kind: /** @type {const} */ ('flat'), size: 100 };

/** @param {any} d @param {any} frame @param {number[]} p @param {number} [t] */
const warp1 = (d, frame, p, t = 0) => /** @type {any} */ (makeDeformer([d], frame)).warp(p[0], p[1], p[2], t, [0, 0, 0]);
const close = (/** @type {number} */ a, /** @type {number} */ b, eps = 1e-6) => Math.abs(a - b) < eps;

function ctx() {
  return { color: () => [1, 0.6, 0.4, 1], places: null, sky: () => null, requestFrame: () => {}, loadTexture: () => null };
}

test('no deformer without a known type or an amplitude', () => {
  assert.equal(makeDeformer(undefined, AXIAL), null);
  assert.equal(makeDeformer([], AXIAL), null);
  assert.equal(makeDeformer([{ type: 'melt' }], AXIAL), null);
  assert.equal(makeDeformer([{ type: 'wobble', amplitude: 0 }], AXIAL), null);
  assert.equal(makeDeformer([{ type: 'twist', angle: 0 }], AXIAL), null);
  assert.equal(deformStep({ type: 'noise', amplitude: 0 }, FLAT), null);
});

test('wobble: radius scales round the axis, lobes round, travels with speed; flat: height from the rim in', () => {
  const d = { type: 'wobble', amplitude: 0.1, lobes: 2, waves: 0, period: 2 };
  // bearing 45 (lobes 2: sin 90 = 1) at t 0: 10 % out
  const p = warp1(d, AXIAL, [Math.SQRT1_2 * 100, 0, -Math.SQRT1_2 * 100]);
  assert.ok(close(Math.hypot(p[0], p[2]), 110, 1e-4));
  assert.equal(p[1], 0);
  // half a cycle later (period 2: 1 s) the lobe has turned to 10 % in
  const q = warp1(d, AXIAL, [Math.SQRT1_2 * 100, 0, -Math.SQRT1_2 * 100], 1000);
  assert.ok(close(Math.hypot(q[0], q[2]), 90, 1e-4));
  assert.equal(makeDeformer([d], AXIAL)?.moving, true);
  assert.equal(makeDeformer([{ ...d, period: 0 }], AXIAL)?.moving, false);
  // flat: the centre stays, the rim lifts by up to amplitude x size
  assert.deepEqual(warp1(d, FLAT, [0, 0, 0]), [0, 0, 0]);
  const r = warp1(d, FLAT, [Math.SQRT1_2 * 100, 0, -Math.SQRT1_2 * 100]);
  assert.ok(close(r[1], 10, 1e-4));
});

test('bend: the anchor stays, the far end moves along the bearing; circle turns the bearing, sway swings it', () => {
  const d = { type: 'bend', amplitude: 0.2, bearing: 90, motion: 'none' };
  const bottom = warp1(d, AXIAL, [0, -50, 0]);
  assert.ok(close(bottom[0], 0) && close(bottom[2], 0));
  const top = warp1(d, AXIAL, [0, 50, 0]);
  // bearing 90 is east (+x), 0.2 x 100 at the top
  assert.ok(close(top[0], 20) && close(top[2], 0) && top[1] === 50);
  const anchoredTop = warp1({ ...d, anchor: 'top' }, AXIAL, [0, 50, 0]);
  assert.ok(close(anchoredTop[0], 0));
  // circle with period 4: after 1 s the bearing has turned 90 degrees (east to south, +z)
  const turned = warp1({ ...d, motion: 'circle', period: 4 }, AXIAL, [0, 50, 0], 1000);
  assert.ok(close(turned[0], 0, 1e-6) && close(turned[2], 20, 1e-6));
  // sway: none at t 0 (sin 0), full a quarter cycle on
  assert.ok(close(warp1({ ...d, motion: 'sway', period: 4 }, AXIAL, [0, 50, 0])[0], 0));
  assert.ok(close(warp1({ ...d, motion: 'sway', period: 4 }, AXIAL, [0, 50, 0], 1000)[0], 20));
  // flat: the sheet curls up along the bearing, not across it
  assert.ok(close(warp1(d, FLAT, [100, 0, 0])[1], 20));
  assert.ok(close(warp1(d, FLAT, [0, 0, 100])[1], 0));
});

test('twist: turns by angle at the far end, clockwise from above; flat: a whirlpool, most at the centre', () => {
  const d = { type: 'twist', angle: 90 };
  // north (-z) at the top turns to east (+x)
  const top = warp1(d, AXIAL, [0, 50, -100]);
  assert.ok(close(top[0], 100) && close(top[2], 0));
  const bottom = warp1(d, AXIAL, [0, -50, -100]);
  assert.ok(close(bottom[0], 0) && close(bottom[2], -100));
  assert.equal(makeDeformer([d], AXIAL)?.reach, 0);
  // flat: the rim stays, half way in turns by half the angle
  const rim = warp1(d, FLAT, [0, 0, -100]);
  assert.ok(close(rim[0], 0) && close(rim[2], -100));
  const mid = warp1(d, FLAT, [0, 0, -50]);
  assert.ok(close(Math.atan2(mid[0], -mid[2]) * 180 / Math.PI, 45, 1e-6));
  assert.ok(close(Math.hypot(mid[0], mid[2]), 50));
});

test('noise: deterministic, bounded, drifts with speed; axial moves along the radius only', () => {
  for (let i = 0; i < 200; i++) {
    const v = valueNoise3(i * 0.37, i * 0.11, i * 0.73, 3);
    assert.ok(v >= -1 && v <= 1);
  }
  assert.equal(valueNoise3(1.3, 2.7, 0.4, 5), valueNoise3(1.3, 2.7, 0.4, 5));
  assert.notEqual(valueNoise3(1.3, 2.7, 0.4, 5), valueNoise3(1.3, 2.7, 0.4, 6));
  assert.ok(Math.abs(fbm3(0.5, 0.5, 0.5, 3, 0)) <= 1);
  const d = { type: 'noise', amplitude: 0.1, drift: 20 };
  const p = warp1(d, AXIAL, [60, 10, -80]);
  // same bearing, same height, radius within 10 of 100
  assert.ok(close(Math.atan2(p[0], -p[2]), Math.atan2(60, 80), 1e-9));
  assert.equal(p[1], 10);
  assert.ok(Math.abs(Math.hypot(p[0], p[2]) - 100) <= 10 + 1e-9);
  assert.notDeepEqual(warp1(d, AXIAL, [60, 10, -80], 3000), p, 'drifts');
  // a point on the axis has no outward direction: it stays
  assert.deepEqual(warp1(d, AXIAL, [0, 10, 0]), [0, 10, 0]);
});

test('the list applies in order (twist then bend is not bend then twist)', () => {
  const twist = { type: 'twist', angle: 90 };
  const bend = { type: 'bend', amplitude: 0.2, bearing: 0, motion: 'none' };
  const a = /** @type {any} */ (makeDeformer([twist, bend], AXIAL)).warp(0, 50, -100, 0, [0, 0, 0]);
  const b = /** @type {any} */ (makeDeformer([bend, twist], AXIAL)).warp(0, 50, -100, 0, [0, 0, 0]);
  assert.ok(Math.hypot(a[0] - b[0], a[2] - b[2]) > 1);
  assert.equal(makeDeformer([twist, bend, { type: 'noise', amplitude: 0.05 }], AXIAL)?.reach, 25);
});

test('wormhole: an hourglass, symmetric, throat halfway down; the well geometry follows the profile', () => {
  const p = wellProfile({ well_shape: 'wormhole', well_throat: 0.2 }, 100);
  const n = p.length - 1;
  assert.ok(close(p[0], 100) && close(p[n], 100));
  assert.ok(close(p[n / 2], 20, 1e-9));
  for (let i = 0; i <= n; i++) assert.ok(close(p[i], p[n - i], 1e-9));
  assert.equal(WELL_SHAPES.wormhole(0.5, 0.3), 0.3);
  const trumpet = wellProfile({}, 100);
  const g = wellGeometry({ profile: trumpet, depth: 80 });
  const pos = g.getAttribute('position');
  const surf = g.getAttribute('surf');
  let yMin = Infinity;
  let yMax = -Infinity;
  for (let i = 0; i < pos.count; i++) {
    yMin = Math.min(yMin, pos.getY(i));
    yMax = Math.max(yMax, pos.getY(i));
  }
  assert.ok(close(yMin, -80, 1e-4) && close(yMax, 0, 1e-4));
  // the first row is the throat, the last the rim; t climbs up the surface, at least the depth
  const row = 97;
  assert.ok(close(Math.hypot(pos.getX(0), pos.getZ(0)), trumpet[0], 1e-3));
  const last = pos.count - row;
  assert.ok(close(Math.hypot(pos.getX(last), pos.getZ(last)), 100, 1e-3));
  for (let i = row; i < pos.count; i += row) assert.ok(surf.getY(i) > surf.getY(i - row));
  assert.ok(surf.getY(last) >= 80);
});

test('a deformed grid in a scene: vertices, rim and points move with the clock; static deforms do not tick', () => {
  const config = {
    objects: [
      { id: 'tube', type: 'grid', shape: 'cylinder', radius: 50, height: 100, deform: [{ type: 'bend', amplitude: 0.4, motion: 'circle', period: 4 }] },
      { id: 'still', type: 'grid', shape: 'well', radius: 50, well_shape: 'wormhole', deform: [{ type: 'twist', angle: 60 }] },
      { id: 'sheet', type: 'grid', size: 100 }
    ],
    points: [
      { id: 'top', object: 'tube', xyz: [0, 50, -50], label: 'TOP' },
      { id: 'plain', object: 'sheet', xyz: [10, 0, 10], label: 'P' }
    ]
  };
  const w = buildScene(config, /** @type {any} */ (ctx()));
  const tube = w.objects.get('tube');
  const still = w.objects.get('still');
  assert.ok(tube && still);
  assert.equal(tube.moving, true);
  assert.equal(still.moving, false);
  assert.ok(typeof tube.tick === 'function');
  assert.equal(still.tick, null, 'a still deform is applied once');
  assert.equal(w.places.isDynamic('top'), true);
  assert.equal(w.places.isDynamic('plain'), false);
  // at t 0 the bend points north (-z): the top point is 20 further north
  const before = w.places.get('top')?.clone();
  assert.ok(before && close(before.z, -70, 1e-4) && close(before.x, 0, 1e-4));
  const mesh = /** @type {any} */ (tube.gridFaces[0].children[0]);
  const pos = mesh.geometry.getAttribute('position');
  const v0 = new Vector3().fromBufferAttribute(pos, pos.count - 1);
  const rim = tube.lines[0];
  const rimBefore = Array.from(/** @type {any} */ (rim.geometry.getAttribute('instanceStart')).data.array);
  stepObjects(w.list, 1000, 1000);
  w.layout();
  const after = w.places.get('top');
  // a quarter turn later the bend points east (+x)
  assert.ok(after && close(after.x, 20, 1e-4) && close(after.z, -50, 1e-4));
  assert.ok(new Vector3().fromBufferAttribute(pos, pos.count - 1).distanceTo(v0) > 1, 'vertices moved');
  const rimAfter = Array.from(/** @type {any} */ (rim.geometry.getAttribute('instanceStart')).data.array);
  assert.notDeepEqual(rimAfter, rimBefore, 'rim moved');
  // the twisted well turned its throat: still deformed after a step
  const wellPos = /** @type {any} */ (still.gridFaces[0].children[0]).geometry.getAttribute('position');
  assert.ok(wellPos.count > 0);
  // a pick on the deformed tube maps back to the undeformed cylinder (radius 50)
  w.scene.updateMatrixWorld(true);
  const ray = new Raycaster(new Vector3(200, 0, 0), new Vector3(-1, 0, 0));
  const hit = ray.intersectObjects(tube.pickMeshes, false)[0];
  assert.ok(hit, 'the ray hits the tube');
  const local = tube.unwarpHit?.(hit);
  assert.ok(local && close(Math.hypot(local.x, local.z), 50, 0.05));
  // and warping it again lands on the hit
  const back = tube.warp?.(local.clone());
  assert.ok(back && back.distanceTo(hit.point) < 0.05);
  w.dispose();
});

test('the batch form matches warp point by point (still steps first, a prepared moving step, steps after it)', () => {
  const lists = [
    [{ type: 'wobble', amplitude: 0.1, lobes: 4, waves: 2, period: 2 }],
    [{ type: 'twist', angle: 80 }, { type: 'bend', amplitude: 0.3, motion: 'circle', period: 3, anchor: 'top' }],
    [{ type: 'twist', angle: 60, period: 5 }, { type: 'wobble', amplitude: 0.05, lobes: 0, period: 3 }, { type: 'noise', amplitude: 0.04, drift: 10 }],
    [{ type: 'noise', amplitude: 0.1 }, { type: 'bend', amplitude: 0.2, motion: 'sway', period: 5, anchor: 'middle' }],
    [{ type: 'twist', angle: 45 }, { type: 'noise', amplitude: 0.05 }]
  ];
  const base = new Float32Array(300);
  for (let i = 0; i < base.length; i++) base[i] = Math.sin(i * 12.9898) * 50;
  for (const frame of [AXIAL, FLAT]) {
    for (const list of lists) {
      const d = /** @type {any} */ (makeDeformer(list, frame));
      const run = d.batch(base);
      for (const t of [0, 1234, 5000]) {
        const out = new Float32Array(base.length);
        run(t, out);
        for (let k = 0; k < base.length; k += 3) {
          const p = d.warp(base[k], base[k + 1], base[k + 2], t, [0, 0, 0]);
          assert.ok(Math.abs(p[0] - out[k]) < 1e-3 && Math.abs(p[1] - out[k + 1]) < 1e-3 && Math.abs(p[2] - out[k + 2]) < 1e-3, `${JSON.stringify(list)} ${frame.kind} t ${t}`);
        }
      }
    }
  }
});

test('straight edges on a deformed grid get points to bend with (densify)', async () => {
  const { densify } = await import('../../src/core/astrometrics/objects/grid.js');
  const run = densify([0, 0, 0, 10, 0, 0, 10, 0, 10], 2.5);
  assert.equal(run.length / 3, 9);
  assert.deepEqual(run.slice(0, 6), [0, 0, 0, 2.5, 0, 0]);
  assert.deepEqual(run.slice(-3), [10, 0, 10]);
  assert.deepEqual(densify([1, 2, 3], 1), [1, 2, 3]);
});

test('deformations are still unless they have a period (or drift); a sphere deforms body and lines; a disc takes [inner, outer]', () => {
  assert.equal(makeDeformer([{ type: 'wobble' }], AXIAL)?.moving, false);
  assert.equal(makeDeformer([{ type: 'bend', motion: 'circle' }], AXIAL)?.moving, false);
  assert.equal(makeDeformer([{ type: 'noise' }], AXIAL)?.moving, false);
  assert.equal(makeDeformer([{ type: 'noise', drift: 5 }], AXIAL)?.moving, true);
  const w = buildScene({
    objects: [
      { id: 'blob', type: 'sphere', radius: 20, fill_color: 'black', deform: [{ type: 'wobble', amplitude: 0.2, lobes: 2, waves: 0, period: 2 }] },
      { id: 'ring', type: 'grid', shape: 'disc', radius: [20, 60] }
    ],
    points: [{ id: 'eq', object: 'blob', latlon: [0, 45], label: 'EQ' }]
  }, /** @type {any} */ (ctx()));
  const blob = w.objects.get('blob');
  assert.ok(blob && typeof blob.tick === 'function' && blob.moving);
  const body = /** @type {any} */ (blob.pickMeshes[0]).geometry.getAttribute('position');
  const radii = () => { let lo = Infinity, hi = 0; for (let i = 0; i < body.count; i++) { const r = Math.hypot(body.getX(i), body.getZ(i)); if (Math.abs(body.getY(i)) < 1) { lo = Math.min(lo, r); hi = Math.max(hi, r); } } return [lo, hi]; };
  const [lo, hi] = radii();
  assert.ok(hi - lo > 5, 'the body bulges round the equator');
  const before = w.places.get('eq')?.clone();
  stepObjects(w.list, 500, 500);
  w.layout();
  const after = w.places.get('eq');
  assert.ok(before && after && before.distanceTo(after) > 0.5, 'a point on it moves with the wobble');
  // the disc's hole: no vertex inside radius 20
  const disc = /** @type {any} */ (w.objects.get('ring')?.gridFaces[0].children[0]).geometry.getAttribute('position');
  let inner = Infinity;
  for (let i = 0; i < disc.count; i++) inner = Math.min(inner, Math.hypot(disc.getX(i), disc.getZ(i)));
  assert.ok(Math.abs(inner - 20) < 1e-3);
  assert.equal(w.objects.get('ring')?.radius, 60);
  w.dispose();
});
