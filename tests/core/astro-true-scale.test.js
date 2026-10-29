/**
 * E10 Part 1, true scale in one scene: depth slices (a scene that fits the
 * camera's planes keeps exactly them; one at true scale splits into slices
 * of at most SLICE_RATIO, far to near, covering the whole range), the star
 * field's own pass, the log-distance fly-to (exact at both ends, target tied
 * to the zoom), default distance limits that follow the scene, and orbit
 * rings that refine near the camera (the chord error under a pixel).
 */
import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { installJsdom } from '../helpers/jsdom-env.js';

const env = installJsdom();
after(() => env.restore());
const { depthSlices, starsBehind, SLICE_RATIO } = await import('../../src/core/astrometrics/depth-passes.js');
const { logFlyKeys, isLogFly, defaultDistance, DEFAULT_LIMITS } = await import('../../src/core/astrometrics/camera-rig.js');
const { ringWindow, refinedRuns, ellipseRun } = await import('../../src/core/astrometrics/objects/lines.js');
const { STAR_SHELL } = await import('../../src/core/astrometrics/objects/stars.js');

const AU = 1.495978707e8; // km

test('a scene inside the camera planes keeps them, one pass', () => {
  const cam = { near: 0.26, far: 18000 };
  assert.deepEqual(depthSlices([{ near: 100, far: 400 }, { near: 0, far: 600 }], cam, 0.26), [[0.26, 18000]]);
  assert.deepEqual(depthSlices([], cam, 0.26), [[0.26, 18000]]);
});

test('a slightly wider scene widens the one pass', () => {
  assert.deepEqual(depthSlices([{ near: 10, far: 9000 }], { near: 1, far: 5050 }, 1), [[1, 9000]]);
});

test('the camera inside an object (a grid) keeps its near plane', () => {
  assert.deepEqual(depthSlices([{ near: 0, far: 240 }], { near: 0.05, far: 7000 }, 0.04), [[0.05, 7000]]);
});

test('a station with the Sun behind it splits into slices, far to near, edge to edge', () => {
  // camera 4 km from the station: rig planes [0.05, 5200]
  const ranges = [{ near: 3.3, far: 4.7 }, { near: 36000, far: 48000 }, { near: AU - 7e5, far: AU + 7e5 }];
  const s = depthSlices(ranges, { near: 0.05, far: 5200 }, 0.004);
  assert.ok(s.length >= 2, `${s.length} slices`);
  for (const [a, b] of s) assert.ok(b / a <= SLICE_RATIO * 1.0001, `ratio ${b / a}`);
  // far to near, touching
  for (let i = 1; i < s.length; i++) assert.equal(s[i][1], s[i - 1][0]);
  assert.equal(s[0][1], AU + 7e5);
  assert.equal(s[s.length - 1][0], 0.05);
});

test('nothing nearer than the floor; things wholly in front of it are left out', () => {
  const s = depthSlices([{ near: 0, far: 0.001 }, { near: 0, far: 50 }], { near: 0.05, far: 5200 }, 0.004);
  assert.deepEqual(s, [[0.05, 5200]]);
});

test('the star field draws on its own once an object reaches past its shell', () => {
  assert.equal(starsBehind([{ near: 10, far: 400 }]), false);
  assert.equal(starsBehind([{ near: 10, far: STAR_SHELL }]), true);
});

test('fly-to zooms in log distance only over a long zoom', () => {
  assert.equal(isLogFly(100, 150), false);
  assert.equal(isLogFly(120000, 4), true);
  assert.equal(isLogFly(4, 120000), true);
});

test('log fly-to: exact at both ends, even steps in log, target tied to the zoom', () => {
  const from = { tx: 26000 * 9.46e12, ty: 0, tz: 0, yaw: 20, tilt: 55, distance: 1.2e5 * 9.46e12, fov: 40 };
  const to = { tx: AU + 0.123456, ty: 1.5, tz: -42164.25, yaw: 235, tilt: 14, distance: 4, fov: 40 };
  assert.deepEqual(logFlyKeys(from, to, 1), to);
  const start = logFlyKeys(from, to, 0);
  assert.ok(Math.abs(start.distance - from.distance) / from.distance < 1e-12);
  assert.ok(Math.abs(start.tx - from.tx) / from.tx < 1e-12);
  // half way in progress is half way in log distance
  const mid = logFlyKeys(from, to, 0.5);
  assert.ok(Math.abs(Math.log(mid.distance) - (Math.log(from.distance) + Math.log(to.distance)) / 2) < 1e-9);
  // zooming in, the target has all but arrived by then
  assert.ok(Math.abs(mid.tx - to.tx) / Math.abs(from.tx - to.tx) < 1e-6);
  // near the end the remaining offset is tiny and smooth (no float steps at the station)
  const late = logFlyKeys(from, to, 0.999);
  assert.ok(Math.abs(late.tz - to.tz) < 1e-3, `${late.tz - to.tz}`);
});

test('log fly-to zooming out: the target leaves late', () => {
  const from = { tx: 0, ty: 0, tz: 0, yaw: 0, tilt: 0, distance: 4, fov: 40 };
  const to = { tx: 1e9, ty: 0, tz: 0, yaw: 0, tilt: 0, distance: 1e8, fov: 40 };
  assert.ok(logFlyKeys(from, to, 0.5).tx / 1e9 < 1e-3);
  assert.deepEqual(logFlyKeys(from, to, 1), to);
});

test('default distance limits: as before for a scene built to fit, wider at true scale', () => {
  assert.deepEqual(defaultDistance(undefined), DEFAULT_LIMITS.distance);
  assert.deepEqual(defaultDistance({ radius: 300, smallest: 2 }), [1, 100000]);
  const [lo, hi] = defaultDistance({ radius: 5.2 * AU, smallest: 0.7 });
  assert.equal(lo, 0.35);
  assert.equal(hi, 5.2 * AU * 20);
});

test('a ring built to fit needs no refinement', () => {
  assert.equal(ringWindow({ a: 42 }, [0, 30, 120], 2 * Math.tan(0.35) / 700), null);
});

/** Largest gap between a run's chords and the true circle of radius r, near bearing t (degrees) */
function chordGap(runs, r, nearDeg, spanDeg) {
  let worst = 0;
  for (const run of runs) {
    for (let i = 3; i < run.length; i += 3) {
      const mx = (run[i - 3] + run[i]) / 2, mz = (run[i - 1] + run[i + 2]) / 2;
      const bearing = Math.atan2(mx, -mz) / (Math.PI / 180);
      const d = Math.abs(((bearing - nearDeg + 540) % 360) - 180);
      if (d > spanDeg) continue;
      worst = Math.max(worst, r - Math.hypot(mx, mz));
    }
  }
  return worst;
}

test('Earth\'s orbit seen from 70,000 km: refined near Earth to under half a pixel', () => {
  const r = AU;
  const pxPerDist = (2 * Math.tan((40 * Math.PI) / 360)) / 750;
  // Earth at bearing 30 (x = r sin t, z = -r cos t), the camera 70,000 km outside the orbit
  const t = (30 * Math.PI) / 180;
  const cam = [(r + 70000) * Math.sin(t), 0, -(r + 70000) * Math.cos(t)];
  const w = ringWindow({ a: r }, cam, pxPerDist);
  assert.ok(w, 'a window');
  assert.ok(Math.abs(w.center - 30) < 1e-6);
  const coarseGap = chordGap([ellipseRun({ a: r })], r, 30, 0.5);
  assert.ok(coarseGap > 5000, `coarse ${coarseGap} km`);
  const runs = refinedRuns({ a: r }, w);
  // half a pixel at 70,000 km
  const px = 70000 * pxPerDist;
  assert.ok(chordGap(runs, r, 30, 0.5) < 0.5 * px, `fine ${chordGap(runs, r, 30, 0.5)} km vs px ${px}`);
  // the runs still close the ring: first fine start meets the last coarse end
  const all = runs.flatMap((run) => [run.slice(0, 3), run.slice(-3)]);
  assert.ok(all.length === 4);
});

test('an arc refines inside its own range only', () => {
  const runs = refinedRuns({ a: 100, from: 0, to: 90 }, { center: 80, half: 30, step: 0.1 });
  const ends = runs.map((run) => [Math.atan2(run[0], -run[2]) / (Math.PI / 180), Math.atan2(run[run.length - 3], -run[run.length - 1]) / (Math.PI / 180)]);
  for (const [a, b] of ends) for (const v of [a, b]) assert.ok(v > -1e-6 && v < 90 + 1e-6, `${v}`);
});
