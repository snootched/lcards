/**
 * Astrometrics camera rig (src/core/astrometrics/camera-rig.js): keys to the
 * camera (yaw 0 south of the target looking north, tilt 90 straight down),
 * shortest yaw, limits, views by point id, orthographic framing, pan
 * direction, and a fly-to seeked by the frame loop landing on the keys.
 */
import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { Vector3 } from 'three';
import { installJsdom } from '../helpers/jsdom-env.js';

const env = installJsdom();
after(() => env.restore());
const { cameraPose, shortestYaw, clampKeys, parseLimits, viewToKeys, CameraRig, DEFAULT_KEYS } = await import('../../src/core/astrometrics/camera-rig.js');

const close = (a, b, eps = 1e-6) => assert.ok(Math.abs(a - b) < eps, `${a} vs ${b}`);

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
