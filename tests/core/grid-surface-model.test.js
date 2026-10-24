/**
 * Curved grid surfaces (C4): sizes, the wrap snapping and the camera that
 * the WebGL grid scene uses (grid-surface-model.js).
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { surfaceSize, wrapAround, surfaceFrame, curvedCamera } from '../../src/core/packs/backgrounds/effects/grid-surface-model.js';

/** @param {number[]} m row-major 3x3 @param {number[]} v */
const mul = (m, v) => [0, 1, 2].map((r) => m[r * 3] * v[0] + m[r * 3 + 1] * v[1] + m[r * 3 + 2] * v[2]);

test('surface size: diameter from the shorter side, length along the axis', () => {
  assert.deepEqual(surfaceSize({}, 800, 300), { radius: 120, halfLength: 150, extent: 300 });
  assert.deepEqual(surfaceSize({ surface_axis: 'horizontal', surface_length: 0.5 }, 800, 300), { radius: 120, halfLength: 200, extent: 800 });
  assert.equal(surfaceSize({ surface_length: 0 }, 800, 300).halfLength, 0, '0 = unbounded');
  assert.equal(surfaceSize({ surface_size: 2 }, 400, 400).radius, 400);
});

test('wrap: a whole number of pattern periods goes round, so the angle wrap is no seam', () => {
  for (const [r, period] of [[120, 40], [120, 40 * 3], [97, 33], [10, 400]]) {
    const { count, scale } = wrapAround(r, period);
    const round = 2 * Math.PI * r * scale;
    assert.ok(count >= 1);
    assert.ok(Math.abs(round / period - count) < 1e-9, `${r}/${period}: ${round / period}`);
    // Stretch stays small once a few periods fit
    if (count >= 6) assert.ok(Math.abs(scale - 1) < 0.1, `scale ${scale}`);
  }
  assert.deepEqual(wrapAround(100, 0), { count: 0, scale: 1 });
});

test('surface frames are rotations with the axis on local y and the front on +z', () => {
  const det = (m) => m[0] * (m[4] * m[8] - m[5] * m[7]) - m[1] * (m[3] * m[8] - m[5] * m[6]) + m[2] * (m[3] * m[7] - m[4] * m[6]);
  for (const s of ['cylinder', 'dome', 'sphere']) for (const a of ['vertical', 'horizontal']) assert.equal(det(surfaceFrame(s, a)), 1, `${s} ${a}`);
  // Horizontal cylinder: world x (across the card) is its axis; the front stays the front
  assert.deepEqual(mul(surfaceFrame('cylinder', 'horizontal'), [1, 0, 0]), [0, 1, 0]);
  assert.deepEqual(mul(surfaceFrame('cylinder', 'horizontal'), [0, 0, 1]), [0, 0, 1]);
  // Horizontal dome: faces the camera, pole at the front
  assert.deepEqual(mul(surfaceFrame('dome', 'horizontal'), [0, 0, 1]), [0, 1, 0]);
  // The sphere ignores the axis
  assert.deepEqual(surfaceFrame('sphere', 'horizontal'), surfaceFrame('sphere', 'vertical'));
});

test('outside camera: the front point is `distance` away, so line_spacing is true px there', () => {
  const cam = curvedCamera({ side: 'outside', surface: 'cylinder', axis: 'vertical', tilt: 0, yaw: 0, zoom: 1, radius: 100, distance: 260 });
  assert.deepEqual(cam.position.map((v) => Math.round(v)), [0, 0, 360]);
  assert.equal(cam.depth, 360);
  const up = curvedCamera({ side: 'outside', surface: 'sphere', axis: 'vertical', tilt: 90, yaw: 30, zoom: 1, radius: 100, distance: 260 });
  assert.ok(Math.abs(up.position[1] - 360) < 1e-9, 'tilt 90 looks straight down');
});

test('inside camera: at the centre, yaw 0 looks down a horizontal cylinder, zoom slides it back', () => {
  const tunnel = curvedCamera({ side: 'inside', surface: 'cylinder', axis: 'horizontal', tilt: 0, yaw: 0, zoom: 1, radius: 100, distance: 0 });
  assert.deepEqual(tunnel.position.map((v) => Math.abs(Math.round(v))), [0, 0, 0]);
  assert.equal(tunnel.rotateY, 90, 'heading turned onto the axis (three looks down -z; +90 about y looks down -x)');
  const back = curvedCamera({ side: 'inside', surface: 'cylinder', axis: 'horizontal', tilt: 0, yaw: 0, zoom: 2, radius: 100, distance: 0 });
  assert.ok(Math.abs(back.position[0] - 100) < 1e-9, 'slid back along +x, one radius');
  const dome = curvedCamera({ side: 'inside', surface: 'dome', axis: 'vertical', tilt: 60, yaw: 0, zoom: 1, radius: 100, distance: 0 });
  assert.deepEqual([dome.rotateX, dome.rotateY], [60, 0]);
});
