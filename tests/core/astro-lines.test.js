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

test('E8 ring image: a flat band from inner_radius to radius, u across it; the line only with a width', async () => {
  const { installJsdom } = await import('../helpers/jsdom-env.js');
  const env = installJsdom();
  try {
    const { buildRing } = await import('../../src/core/astrometrics/objects/lines.js');
    const ctx = /** @type {any} */ ({ color: () => [1, 1, 1, 1], loadTexture: () => null, requestFrame: () => {} });
    const band = buildRing({ type: 'ring', radius: 10, inner_radius: 4, image: '/local/r.png' }, ctx);
    assert.equal(band.lines.length, 0, 'no line without a width');
    const mesh = /** @type {any} */ (band.pickMeshes[0]);
    const pos = mesh.geometry.getAttribute('position');
    const uv = mesh.geometry.getAttribute('uv');
    close(Math.hypot(pos.getX(0), pos.getZ(0)), 4);
    close(Math.hypot(pos.getX(1), pos.getZ(1)), 10);
    assert.deepEqual([uv.getX(0), uv.getX(1)], [0, 1], 'inner rim u 0, outer u 1');
    assert.equal(mesh.material.depthWrite, false);
    // default inner: half the radius; a width draws the line too
    const lined = buildRing({ type: 'ring', radius: [10, 6], image: '/local/r.png', width: 1 }, ctx);
    assert.equal(lined.lines.length, 1);
    const p2 = /** @type {any} */ (lined.pickMeshes[0]).geometry.getAttribute('position');
    close(Math.hypot(p2.getX(0), p2.getZ(0)), 3, 1e-4);
    // a plain ring has no band
    assert.equal(buildRing({ type: 'ring', radius: 10 }, ctx).pickMeshes.length, 0);
  } finally {
    env.restore();
  }
});

test('screenDistances: a segment through the camera plane is trimmed as the line shader trims it, so the dashes it interpolates match the screen at the cut', () => {
  const cam = new PerspectiveCamera(50, 1, 0.1, 1e6);
  cam.position.set(0, 0, 0);
  cam.lookAt(0, 0, -1);
  cam.updateMatrixWorld();
  cam.updateProjectionMatrix();
  const mvp = new Matrix4().multiplyMatrices(cam.projectionMatrix, cam.matrixWorldInverse);
  const W = 800, H = 800;
  const screen = (v) => { const p = v.clone().applyMatrix4(mvp); return [p.x * 0.5 * W, p.y * 0.5 * H]; };
  // the shader's trim (LineMaterial): the near estimate in view z, alpha along the segment
  const a = cam.projectionMatrix.elements[10], b = cam.projectionMatrix.elements[14];
  const zn = -0.5 * b / a;
  for (const [p0, p1] of [[new Vector3(5, 2, -50), new Vector3(-3, 1, 40)], [new Vector3(-3, 1, 40), new Vector3(5, 2, -50)]]) {
    const s = runsToSegments([[...p0.toArray(), ...p1.toArray()]]);
    const out = screenDistances(s.positions, s.starts, mvp, W, H, new Float32Array(2), cam.projectionMatrix);
    const v0 = p0.clone().applyMatrix4(cam.matrixWorldInverse), v1 = p1.clone().applyMatrix4(cam.matrixWorldInverse);
    const inFront = v0.z < 0 ? [p0, v0, 0] : [p1, v1, 1];
    const behind = v0.z < 0 ? [p1, v1] : [p0, v0];
    const alpha = (zn - inFront[1].z) / (behind[1].z - inFront[1].z);
    const cut = inFront[0].clone().lerp(behind[0], alpha);
    const [sx, sy] = screen(cut);
    const [fx, fy] = screen(inFront[0]);
    const trueLen = Math.hypot(sx - fx, sy - fy);
    const dFront = out[inFront[2]];
    const dBehind = out[1 - inFront[2]];
    const shaderAtCut = dFront + alpha * (dBehind - dFront);
    assert.ok(Math.abs(Math.abs(shaderAtCut - dFront) - trueLen) < 1e-3, `${shaderAtCut - dFront} vs ${trueLen}`);
    assert.ok(trueLen > 0 && Number.isFinite(dBehind));
  }
});

test('anchored vertices: a line far from its frame\'s origin draws exactly near the camera (no 32-bit jitter)', async () => {
  const { Group, PerspectiveCamera } = await import('three');
  const parent = new Group();
  // a route from the galactic core to Sol, in light years: Sol's end is not representable in 32 bits
  const sol = [26000.00123, 0.0000071, -0.0000042];
  const line = new FatLine([[0, 0, 0, ...sol]], { color: [1, 1, 1, 1], dash: [6, 4] });
  parent.add(line.object);
  parent.updateMatrixWorld(true);
  const drawn = () => {
    // what the GPU gets: the 32-bit relative position, placed by the (64-bit) matrix
    const f32 = line.geometry.getAttribute('instanceEnd');
    return new Vector3(f32.getX(0), f32.getY(0), f32.getZ(0)).applyMatrix4(line.object.matrixWorld);
  };
  const err = () => drawn().distanceTo(new Vector3(...sol));
  assert.ok(err() > 1e-4, `unanchored, 32-bit is off by ${err()}`);
  // the camera a millionth of a light year from Sol: the vertex nearest it becomes the anchor
  const cam = new PerspectiveCamera();
  cam.position.set(sol[0] + 1e-6, sol[1], sol[2]);
  cam.updateMatrixWorld();
  assert.equal(line.anchorTo(cam), true);
  assert.ok(err() < 1e-9, `anchored, off by ${err()}`);
  // the far end is still where it was (to 32-bit precision of its distance from the anchor)
  const start = line.geometry.getAttribute('instanceStart');
  const far = new Vector3(start.getX(0), start.getY(0), start.getZ(0)).applyMatrix4(line.object.matrixWorld);
  assert.ok(far.length() < 0.01);
  // a camera far from both ends leaves the anchor alone
  cam.position.set(13000, 5000, 0);
  cam.updateMatrixWorld();
  assert.equal(line.anchorTo(cam), false);
  // new runs keep the anchor: still exact
  line.setRuns([[0, 0, 0, ...sol]]);
  parent.updateMatrixWorld(true);
  assert.ok(err() < 1e-9);
});
