/**
 * Astrometrics camera rig (src/core/astrometrics/camera-rig.js): keys to the
 * camera (yaw 0 south of the target looking north, tilt 90 straight down),
 * shortest yaw, limits, views by point id, orthographic framing, pan
 * direction (screen and ground), zoom toward a spot, target limits, nudges
 * and held motion, and a fly-to seeked by the frame loop landing on the keys.
 */
import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { Vector3 } from 'three';
import { installJsdom } from '../helpers/jsdom-env.js';

const env = installJsdom();
after(() => env.restore());
const { cameraPose, shortestYaw, clampKeys, parseLimits, viewToKeys, screenBasis, screenRay, rayPlane, CameraRig, DEFAULT_KEYS, TARGET_LIMIT_SCALE } = await import('../../src/core/astrometrics/camera-rig.js');

const close = (a, b, eps = 1e-6, msg = "") => assert.ok(Math.abs(a - b) < eps, `${msg} ${a} vs ${b}`);

test('cameraPose: yaw 0 tilt 0 sits on +z looking north (-z); tilt 90 looks straight down', () => {
  const k = { ...DEFAULT_KEYS, tx: 1, ty: 2, tz: 3, yaw: 0, tilt: 0, distance: 10 };
  const p = cameraPose(k);
  [1, 2, 13].forEach((v, i) => close(p.position[i], v));
  [0, 0, -1].forEach((v, i) => close(p.forward[i], v));
  const down = cameraPose({ ...k, tilt: 90 });
  [1, 12, 3].forEach((v, i) => close(down.position[i], v));
  [0, -1, 0].forEach((v, i) => close(down.forward[i], v));
  // yaw 90: the camera east of the target looking west
  const east = cameraPose({ ...k, yaw: 90 });
  [11, 2, 3].forEach((v, i) => close(east.position[i], v));
});

test('applied camera looks where cameraPose says, at every tilt including 90', () => {
  const rig = new CameraRig();
  for (const tilt of [-60, 0, 35, 89.9, 90]) {
    for (const yaw of [0, 45, 200]) {
      rig.keys = { ...DEFAULT_KEYS, tx: 5, ty: 0, tz: -5, yaw, tilt, distance: 50 };
      rig.apply();
      const dir = rig.camera.getWorldDirection(new Vector3());
      const want = cameraPose(rig.keys).forward;
      [dir.x, dir.y, dir.z].forEach((v, i) => close(v, want[i], 1e-6));
    }
  }
});

test('shortestYaw takes the short way round', () => {
  assert.equal(shortestYaw(10, 350), -10);
  assert.equal(shortestYaw(350, 10), 370);
  assert.equal(Math.abs(shortestYaw(0, 180)), 180, 'a half turn either way');
  assert.equal(shortestYaw(720, 30), 750);
});

test('limits clamp tilt, distance and (when set) yaw', () => {
  const lim = parseLimits({ tilt: [90, 2], distance: [20, 800], yaw: [-30, 30] });
  assert.deepEqual(lim.tilt, [2, 90]);
  const k = clampKeys({ ...DEFAULT_KEYS, tilt: -10, distance: 5000, yaw: 50 }, lim);
  assert.deepEqual([k.tilt, k.distance, k.yaw], [2, 800, 30]);
  assert.equal(parseLimits(null).yaw, null);
  assert.deepEqual(parseLimits({ tilt: 'x' }).tilt, [-90, 90]);
});

test('viewToKeys: a target by point id or [x, y, z]; keys left out stay', () => {
  const resolve = (r) => (r === 'core' ? new Vector3(1, 2, 3) : Array.isArray(r) ? new Vector3(...r) : null);
  assert.deepEqual(viewToKeys({ target: 'core', yaw: 20, tilt: 35, distance: 280 }, resolve), { tx: 1, ty: 2, tz: 3, yaw: 20, tilt: 35, distance: 280 });
  assert.deepEqual(viewToKeys({ target: [4, 5, 6] }, resolve), { tx: 4, ty: 5, tz: 6 });
  assert.deepEqual(viewToKeys({ target: 'nowhere', tilt: 90 }, resolve), { tilt: 90 });
});

test('orthographic: the view height at the target matches the perspective one', () => {
  const rig = new CameraRig();
  rig.aspect = 2;
  rig.set({ distance: 100, fov: 40, tilt: 90 }, 'orthographic');
  rig.apply();
  const cam = /** @type {import('three').OrthographicCamera} */ (rig.camera);
  assert.equal(cam.isOrthographicCamera, true);
  close(cam.top - cam.bottom, 2 * 100 * Math.tan((20 * Math.PI) / 180));
  close((cam.right - cam.left) / (cam.top - cam.bottom), 2);
});

test('pan: content follows the pointer, at yaw 0 and 90', () => {
  const rig = new CameraRig();
  rig.set({ tx: 0, tz: 0, yaw: 0, tilt: 90, distance: 100, fov: 40 });
  rig.pan(10, 0, 500);
  assert.ok(rig.keys.tx < 0, 'drag right: the target moves left (west)');
  close(rig.keys.tz, 0);
  rig.set({ tx: 0, tz: 0, yaw: 0 });
  rig.pan(0, 10, 500);
  assert.ok(rig.keys.tz < 0, 'drag down: the target moves up the screen (north at yaw 0)');
  rig.set({ tx: 0, tz: 0, yaw: 90 });
  rig.pan(0, 10, 500);
  assert.ok(rig.keys.tx < 0 && Math.abs(rig.keys.tz) < 1e-9, 'yaw 90: up the screen is west');
  assert.equal(new CameraRig().panOnly, false);
  const locked = new CameraRig();
  locked.limits = parseLimits({ tilt: [90, 90] });
  assert.equal(locked.panOnly, true);
});

test('flyTo: seeked by step(), lands on the keys the short way round, then resolves', async () => {
  let changes = 0;
  const rig = new CameraRig({ onChange: () => changes++ });
  rig.set({ yaw: 350, tilt: 10, distance: 100 });
  const done = rig.flyTo({ yaw: 10, tilt: 60, distance: 50 }, { duration: 1000 });
  assert.equal(rig.flying, true);
  assert.equal(rig.step(1000), true);
  rig.step(1500);
  const mid = rig.keys.yaw;
  assert.ok(mid > 350 && mid < 370, `mid-flight yaw ${mid} goes up through 360, not down through 180`);
  assert.equal(rig.step(2000), false);
  assert.equal(rig.flying, false);
  close(rig.keys.yaw, 370);
  close(rig.keys.tilt, 60);
  close(rig.keys.distance, 50);
  await done;
  assert.ok(changes >= 2);
});

test('flyTo clamps to the limits; cancel stops where it is and resolves', async () => {
  const rig = new CameraRig();
  rig.limits = parseLimits({ distance: [20, 800] });
  const p = rig.flyTo({ distance: 5 }, { duration: 1000 });
  rig.step(0);
  rig.step(500);
  const at = rig.keys.distance;
  rig.cancel();
  await p;
  assert.equal(rig.flying, false);
  assert.equal(rig.keys.distance, at);
  assert.ok(at >= 20);
  await rig.flyTo({ distance: 5 }, { duration: 0 });
  assert.equal(rig.keys.distance, 20, 'duration 0 jumps, clamped');
});

/** Where a world point lands on screen (NDC x, y) with the rig's camera now */
function ndcOf(rig, p) {
  rig.apply();
  const v = new Vector3(...p).project(rig.camera);
  return [v.x, v.y];
}

test('screenBasis matches the applied camera (right and up), in every view', () => {
  const rig = new CameraRig();
  for (const tilt of [-40, 0, 35, 90]) {
    for (const yaw of [0, 70, 225]) {
      rig.keys = { ...DEFAULT_KEYS, yaw, tilt, distance: 50 };
      rig.apply();
      const e = rig.camera.matrixWorld.elements;
      const { right, up } = screenBasis(rig.keys);
      [e[0], e[1], e[2]].forEach((v, i) => close(v, right[i], 1e-9));
      [e[4], e[5], e[6]].forEach((v, i) => close(v, up[i], 1e-9));
    }
  }
});

test('screen pan: a side view pans up and down, an oblique view follows the pointer', () => {
  const rig = new CameraRig();
  rig.set({ tx: 0, ty: 0, tz: 0, yaw: 0, tilt: 0, distance: 100, fov: 40 });
  rig.pan(0, 10, 500);
  assert.ok(rig.keys.ty > 0 && Math.abs(rig.keys.tz) < 1e-9, 'side view, drag down: the target moves up');
  // Oblique: a spot at the target moves with the pointer, in screen px
  rig.aspect = 1;
  rig.set({ tx: 0, ty: 0, tz: 0, yaw: 30, tilt: 40, distance: 100 });
  const before = ndcOf(rig, [0, 0, 0]);
  rig.pan(25, -40, 500);
  const after = ndcOf(rig, [0, 0, 0]);
  close((after[0] - before[0]) * 250, 25, 1e-6);
  close(-(after[1] - before[1]) * 250, -40, 1e-6);
  // Ground mode keeps the target on its height
  rig.panMode = 'ground';
  rig.set({ tx: 0, ty: 5, tz: 0, yaw: 0, tilt: 0 });
  rig.pan(0, 10, 500);
  assert.equal(rig.keys.ty, 5);
  assert.ok(rig.keys.tz < 0);
});

test('screenRay passes through the target at the centre, and through the spot spotAt finds', () => {
  const k = { ...DEFAULT_KEYS, tx: 3, ty: 1, tz: -2, yaw: 50, tilt: 30, distance: 80, fov: 40 };
  for (const projection of /** @type {const} */ (['perspective', 'orthographic'])) {
    const ray = screenRay(k, projection, 200, 150, 400, 300);
    const f = cameraPose(k).forward;
    const hit = rayPlane(ray, [k.tx, k.ty, k.tz], [-f[0], -f[1], -f[2]]);
    [3, 1, -2].forEach((v, i) => close(hit[i], v, 1e-6));
  }
  assert.equal(rayPlane({ origin: [0, 10, 0], dir: [0, 1, 0] }, [0, 0, 0], [0, 1, 0]), null, 'behind the origin');
  assert.equal(rayPlane({ origin: [0, 10, 0], dir: [1, 0, 0] }, [0, 0, 0], [0, 1, 0]), null, 'parallel');
});

test('zoomAt keeps the spot under the pointer, perspective and orthographic', () => {
  for (const projection of /** @type {const} */ (['perspective', 'orthographic'])) {
    const rig = new CameraRig();
    rig.aspect = 400 / 300;
    rig.set({ tx: 0, ty: 0, tz: 0, yaw: 20, tilt: 35, distance: 200, fov: 40 }, projection);
    for (const mode of /** @type {const} */ (['screen', 'ground'])) {
      rig.panMode = mode;
      const spot = rig.spotAt(320, 80, 400, 300);
      const before = ndcOf(rig, spot);
      close(before[0], 320 / 200 - 1, 1e-6);
      close(before[1], 1 - 80 / 150, 1e-6);
      rig.zoomAt(0.5, spot);
      close(rig.keys.distance, 100);
      const after = ndcOf(rig, spot);
      close(after[0], before[0], 1e-6);
      close(after[1], before[1], 1e-6);
      rig.zoomAt(2, spot);
    }
  }
  // At a distance limit the spot still stays put (the factor is clamped first)
  const rig = new CameraRig();
  rig.aspect = 1;
  rig.limits = parseLimits({ distance: [150, 1000] });
  rig.set({ tx: 0, ty: 0, tz: 0, yaw: 0, tilt: 60, distance: 200 });
  const spot = rig.spotAt(10, 10, 300, 300);
  const before = ndcOf(rig, spot);
  rig.zoomAt(0.1, spot);
  assert.equal(rig.keys.distance, 150);
  const after = ndcOf(rig, spot);
  close(after[0], before[0], 1e-6);
  close(after[1], before[1], 1e-6);
  // Without a spot it zooms about the target
  const t0 = [rig.keys.tx, rig.keys.ty, rig.keys.tz];
  rig.zoomAt(2);
  assert.equal(rig.keys.distance, 300);
  assert.deepEqual([rig.keys.tx, rig.keys.ty, rig.keys.tz], t0);
});

test('target limits: default sphere round the scene, explicit sphere and box, false for none', () => {
  const scene = { center: /** @type {[number, number, number]} */ ([10, 0, 0]), radius: 100 };
  const def = parseLimits(null, scene);
  assert.deepEqual(def.target, { center: [10, 0, 0], radius: 100 * TARGET_LIMIT_SCALE });
  const k = clampKeys({ ...DEFAULT_KEYS, tx: 1000, ty: 0, tz: 0 }, def);
  close(k.tx, 10 + 150);
  assert.equal(parseLimits({ target: false }, scene).target, null);
  assert.equal(parseLimits(null).target, null, 'no scene, no default');
  assert.deepEqual(parseLimits({ target: { radius: 50 } }, scene).target, { center: [10, 0, 0], radius: 50 });
  assert.deepEqual(parseLimits({ target: { radius: 50, center: [1, 2, 3] } }, scene).target, { center: [1, 2, 3], radius: 50 });
  const box = parseLimits({ target: { x: [20, -20], y: [0, 0] } }, scene);
  assert.deepEqual(box.target, { x: [-20, 20], y: [0, 0] });
  const b = clampKeys({ ...DEFAULT_KEYS, tx: 30, ty: 9, tz: 999 }, box);
  assert.deepEqual([b.tx, b.ty, b.tz], [20, 0, 999], 'an axis left out is free');
  // A fly-to lands inside the limit
  const rig = new CameraRig();
  rig.limits = def;
  rig.flyTo({ tx: -500 }, { duration: 0 });
  close(rig.keys.tx, 10 - 150);
});

test('nudge: pan in view heights, zoom in steps, orbit in degrees; held motion runs per second', async () => {
  const rig = new CameraRig();
  rig.set({ tx: 0, ty: 0, tz: 0, yaw: 0, tilt: 90, distance: 100, fov: 40 });
  const h = 2 * 100 * Math.tan((20 * Math.PI) / 180);
  const n = rig.nudged({ pan: [0.5, 0], zoom: 1, orbit: [10, -20] });
  close(n.tx, 0.5 * h);
  close(n.distance, 50);
  assert.deepEqual([n.yaw, n.tilt], [10, 70]);
  assert.equal(rig.keys.tx, 0, 'nudged() does not move the camera');
  await rig.nudge({ pan: [0, 1] }, { duration: 0 });
  close(rig.keys.tz, -h, 1e-6);
  // Held: 2 view heights a second for half a second
  rig.set({ tz: 0 });
  rig.setMotion({ pan: [2, 0] });
  assert.equal(rig.flying, true);
  assert.equal(rig.step(1000), true);
  for (let t = 1100; t <= 1500; t += 100) rig.step(t);
  close(rig.keys.tx, 2 * h * 0.5, 1e-6);
  rig.step(9000);
  close(rig.keys.tx, 2 * h * 0.6, 1e-6, 'a long gap (a hidden tab) moves one capped frame');
  rig.setMotion(null);
  assert.equal(rig.step(1600), false);
  assert.equal(rig.flying, false);
});

test('lensFov: the field of view as set up to 2:1, narrower on wider cards so the view is never wider than at 2:1', async () => {
  const { lensFov, MAX_VIEW_ASPECT } = await import('../../src/core/astrometrics/camera-rig.js');
  const across = (fov, aspect) => (2 * Math.atan(Math.tan((lensFov(fov, aspect) * Math.PI) / 360) * aspect) * 180) / Math.PI;
  assert.equal(lensFov(40, 1), 40);
  assert.equal(lensFov(40, MAX_VIEW_ASPECT), 40);
  const at2 = across(40, MAX_VIEW_ASPECT);
  for (const aspect of [3, 5, 8]) {
    assert.ok(lensFov(40, aspect) < 40, `narrower at ${aspect}:1`);
    assert.ok(Math.abs(across(40, aspect) - at2) < 1e-9, `${aspect}:1 is as wide as 2:1 (${at2.toFixed(1)} degrees)`);
  }
});

test('travel: camera and target move together along the view, in camera distances; held runs per second', async () => {
  const rig = new CameraRig();
  rig.limits = { ...rig.limits, target: null };
  rig.set({ tx: 0, ty: 0, tz: 0, yaw: 30, tilt: 20, distance: 100, fov: 40 });
  const before = cameraPose(rig.keys);
  const n = rig.nudged({ travel: 0.5 });
  const after = cameraPose(n);
  const moved = [0, 1, 2].map((i) => after.position[i] - before.position[i]);
  // half the distance along the view; the distance, yaw and tilt stay
  for (let i = 0; i < 3; i++) close(moved[i], before.forward[i] * 50, 1e-9);
  close(n.tx - rig.keys.tx, moved[0], 1e-9);
  assert.deepEqual([n.distance, n.yaw, n.tilt], [100, 30, 20]);
  // back is the other way; the same step at any scale (km or ly) is the same share of the distance
  const back = rig.nudged({ travel: -0.5 });
  close(back.tx, -n.tx, 1e-9);
  rig.set({ distance: 5e4 });
  close(Math.hypot(...[0, 1, 2].map((i) => cameraPose(rig.nudged({ travel: 0.5 })).position[i] - cameraPose(rig.keys).position[i])), 2.5e4, 1e-6);
  // held: one distance a second for half a second
  rig.set({ tx: 0, ty: 0, tz: 0, distance: 100 });
  rig.setMotion({ travel: 1 });
  rig.step(1000);
  for (let t = 1100; t <= 1500; t += 100) rig.step(t);
  close(Math.hypot(rig.keys.tx, rig.keys.ty, rig.keys.tz), 50, 1e-6);
  rig.setMotion(null);
  // near something solid (travelReach): half the way to its surface, never under the nearest zoom
  rig.travelReach = () => 8;
  rig.set({ tx: 0, ty: 0, tz: 0, distance: 100 });
  const near = rig.nudged({ travel: 0.5 });
  close(Math.hypot(near.tx, near.ty, near.tz), 4, 1e-9);
  rig.travelReach = () => 1e-9;
  const floor = rig.nudged({ travel: 0.5 });
  close(Math.hypot(floor.tx, floor.ty, floor.tz), rig.limits.distance[0] * 0.5, 1e-9);
  rig.travelReach = null;
  // limits.target stops the travel as it stops a pan
  rig.limits = { ...rig.limits, target: { center: [0, 0, 0], radius: 10 } };
  rig.set({ tx: 0, ty: 0, tz: 0 });
  const far = rig.nudged({ travel: 5 });
  assert.ok(Math.hypot(far.tx, far.ty, far.tz) <= 10 + 1e-9);
});
