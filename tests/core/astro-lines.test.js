/**
 * Astrometrics lines: px dash distances (screen-space, continuing along a
 * run, restarting at the next, nothing for an end behind the camera), the
 * LineMaterial patch, ring / arc / sky track geometry on the placement
 * convention.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Matrix4, PerspectiveCamera, Vector3 } from 'three';
import { runsToSegments, screenDistances, PxDashLineMaterial, FatLine } from '../../src/core/astrometrics/lines.js';
import { ellipseRun, arcRun, skyRuns } from '../../src/core/astrometrics/objects/lines.js';

const close = (a, b, eps = 1e-6) => assert.ok(Math.abs(a - b) < eps, `${a} vs ${b}`);

test('runsToSegments: pairs, and which segment starts a run', () => {
  const s = runsToSegments([[0, 0, 0, 1, 0, 0, 2, 0, 0], [5, 5, 5, 6, 5, 5]]);
  assert.equal(s.count, 3);
  assert.deepEqual([...s.starts], [1, 0, 1]);
  assert.deepEqual([...s.positions.slice(6, 12)], [1, 0, 0, 2, 0, 0]);
});

test('screenDistances: px along each run (NDC to CSS px), restarting at a new run', () => {
  // identity "projection": NDC = xyz, w = 1; 200 x 100 px
  const s = runsToSegments([[0, 0, 0, 0.5, 0, 0, 0.5, 0.5, 0], [0, 0, 0, 0, -1, 0]]);
  const out = screenDistances(s.positions, s.starts, new Matrix4(), 200, 100, new Float32Array(6));
  // 0.5 NDC across = 50 px; 0.5 NDC up = 25 px; second run restarts
  assert.deepEqual([...out], [0, 50, 50, 75, 0, 50]);
});

test('screenDistances: the same world dash is longer in px close to the camera', () => {
  const cam = new PerspectiveCamera(60, 1, 0.1, 1000);
  cam.position.set(0, 0, 10);
  cam.updateMatrixWorld();
  const mvp = new Matrix4().multiplyMatrices(cam.projectionMatrix, cam.matrixWorldInverse);
  const s = runsToSegments([[0, 0, 0, 1, 0, 0], [0, 0, 5, 1, 0, 5]]);
  const out = screenDistances(s.positions, s.starts, mvp, 400, 400, new Float32Array(4));
  assert.ok(out[3] > out[1] * 1.9, `near ${out[3]} vs far ${out[1]}`);
});

test('screenDistances: an end behind the camera adds nothing', () => {
  const cam = new PerspectiveCamera(60, 1, 0.1, 1000);
  cam.position.set(0, 0, 10);
  cam.updateMatrixWorld();
  const mvp = new Matrix4().multiplyMatrices(cam.projectionMatrix, cam.matrixWorldInverse);
  const s = runsToSegments([[0, 0, 0, 0, 0, 20]]);
  const out = screenDistances(s.positions, s.starts, mvp, 400, 400, new Float32Array(2));
  assert.deepEqual([...out], [0, 0]);
});

test('the dash material tests screen-linear distances (d * w / w)', () => {
  const m = new PxDashLineMaterial({ dashed: true, dashSize: 6, gapSize: 4, worldUnits: false });
  assert.match(m.vertexShader, /vPxD = vLineDistance \* clip\.w;/);
  assert.match(m.fragmentShader, /mod\( vPxD \/ vPxW \+ dashOffset/);
  assert.doesNotMatch(m.fragmentShader, /mod\( vLineDistance \+ dashOffset/);
  m.dispose();
});

test('FatLine: dashed lines get their own distance attributes; empty runs hide it', () => {
  const l = new FatLine([[0, 0, 0, 10, 0, 0, 10, 0, 10]], { color: [1, 0.5, 0, 1], width: 2, dash: [6, 4] });
  assert.ok(l.geometry.getAttribute('instanceDistanceStart'));
  const cam = new PerspectiveCamera(60, 1, 0.1, 1000);
  cam.position.set(0, 50, 0);
  cam.lookAt(0, 0, 0);
  cam.updateMatrixWorld();
  l.object.updateMatrixWorld();
  l.updateDashes(cam, 400, 400);
  const d = /** @type {any} */ (l.geometry.getAttribute('instanceDistanceEnd'));
  assert.ok(d.getX(1) > d.getX(0) && d.getX(0) > 0);
  l.setRuns([]);
  assert.equal(l.object.visible, false);
  l.dispose();
});

test('ellipseRun: starts north, goes clockwise (east next); inclination tilts it about the east-west line of nodes', () => {
  // at least 8 steps: index 2 is 90 degrees
  const r = ellipseRun({ a: 10, n: 4 });
  close(r[0], 0); close(r[2], -10);
  close(r[6], 10); close(r[8], 0, 1e-9);
  const tilted = ellipseRun({ a: 10, inclination: 90, n: 4 });
  // the line of nodes (east-west) stays flat, north goes up or down
  close(tilted[7], 0, 1e-9);
  close(Math.abs(tilted[1]), 10, 1e-9);
  // node 90: the line of nodes turns to north-south
  const turned = ellipseRun({ a: 10, b: 5, node: 90, n: 4 });
  close(turned[6], 0, 1e-9); close(turned[8], 10, 1e-9);
});

test('arcRun: a bump of `arc` height half way', () => {
  const r = arcRun(new Vector3(0, 0, 0), new Vector3(10, 0, 0), 4, 2);
  assert.deepEqual(r.map((v) => Math.round(v * 1e9) / 1e9), [0, 0, 0, 5, 4, 0, 10, 0, 0]);
  assert.equal(arcRun(new Vector3(), new Vector3(1, 1, 1), 0).length, 6);
});

test('skyRuns: split below the horizon, each run closed on it', () => {
  const track = [
    { azimuth: 80, altitude: -5 }, { azimuth: 90, altitude: 5 }, { azimuth: 180, altitude: 40 },
    { azimuth: 270, altitude: 5 }, { azimuth: 280, altitude: -5 }, { azimuth: 300, altitude: -10 }
  ];
  const runs = skyRuns(track, 100);
  assert.equal(runs.length, 1);
  const run = runs[0];
  // first and last points on the horizon (y = 0), between the samples
  close(run[1], 0, 1e-9);
  close(run[run.length - 2], 0, 1e-9);
  assert.equal(run.length / 3, 5);
  assert.equal(skyRuns([{ azimuth: 0, altitude: -1 }, { azimuth: 10, altitude: -2 }], 100).length, 0);
});
