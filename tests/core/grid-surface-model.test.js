/**
 * Curved grid surfaces (C4): sizes, the wrap snapping and the camera that
 * the WebGL grid scene uses (grid-surface-model.js). C5: the well.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { surfaceSize, wrapAround, surfaceFrame, curvedCamera, curvedTilt, CURVED_TILT, WELL_MIN_DEPTH, WELL_SEGMENTS, wellProfile, wellArc, rippleProfile, surfaceRotation, toSurface } from '../../src/core/packs/backgrounds/effects/grid-surface-model.js';

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

test('well: named shapes run from the throat at the bottom to the rim', () => {
  const R = 100;
  for (const shape of ['trumpet', 'cone', 'bowl']) {
    const r = wellProfile({ well_shape: shape, well_throat: 0.2 }, R);
    assert.equal(r.length, WELL_SEGMENTS + 1, shape);
    assert.ok(Math.abs(r[0] - 20) < 1e-9, `${shape} throat`);
    assert.ok(Math.abs(r[WELL_SEGMENTS] - R) < 1e-9, `${shape} rim`);
    assert.ok(r.every((v, i) => i === 0 || v >= r[i - 1]), `${shape} widens upward`);
  }
  // Halfway up: the trumpet is still narrow (it flares at the rim), the bowl already wide
  const mid = (shape) => wellProfile({ well_shape: shape, well_throat: 0.2 }, R)[WELL_SEGMENTS / 2];
  assert.ok(mid('trumpet') < mid('cone') && mid('cone') < mid('bowl'));
  assert.equal(wellProfile({}, R)[0], 15, 'default: trumpet, throat 0.15');
});

test('well_profile: a smooth curve through every control diameter, rim first', () => {
  const R = 100;
  const r = wellProfile({ well_profile: [1, 0.2, 1], well_shape: 'cone' }, R, 64);
  assert.ok(Math.abs(r[64] - 100) < 1e-9, 'rim (first value) at the top');
  assert.ok(Math.abs(r[32] - 20) < 1e-9, 'middle control point');
  assert.ok(Math.abs(r[0] - 100) < 1e-9, 'bottom (last value)');
  assert.ok(r[16] > 20 && r[16] < 100, 'between points');
  // Never below zero, even where the curve overshoots
  assert.ok(wellProfile({ well_profile: [1, 0, 0, 1] }, R).every((v) => v >= 0));
  // Fewer than 2 numbers: the named shape
  assert.deepEqual(wellProfile({ well_profile: [0.5] }, R), wellProfile({}, R));
});

test('well: along is the arc length up the surface (rings evenly spaced however steep)', () => {
  // A cylinder: arc = height
  assert.deepEqual(wellArc([10, 10, 10], 100), [0, 50, 100]);
  // A 45 degree cone: each step sqrt(2) x the height
  const arc = wellArc([0, 50, 100], 100);
  assert.ok(Math.abs(arc[2] - 100 * Math.SQRT2) < 1e-9);
});

test('well: a minimum depth; other surfaces unchanged', () => {
  assert.equal(surfaceSize({ surface: 'well', surface_length: 0 }, 500, 300).halfLength, (WELL_MIN_DEPTH * 300) / 2);
  assert.equal(surfaceSize({ surface: 'cylinder', surface_length: 0 }, 500, 300).halfLength, 0);
});

test('well: looked into from higher up by default; the same frame as the dome', () => {
  assert.equal(curvedTilt('well', 'outside'), 35);
  assert.equal(curvedTilt('cylinder', 'outside'), CURVED_TILT.outside);
  assert.equal(curvedTilt('dome', 'inside'), CURVED_TILT.inside);
  assert.deepEqual(surfaceFrame('well', 'horizontal'), surfaceFrame('dome', 'horizontal'));
});

test('well_morph blends toward well_profile_to', () => {
  const R = 100;
  const p = { well_profile: [1, 0.2], well_profile_to: [1, 1] };
  assert.deepEqual(wellProfile({ ...p, well_morph: 0 }, R, 4), wellProfile({ well_profile: [1, 0.2] }, R, 4));
  const half = wellProfile({ ...p, well_morph: 0.5 }, R, 4);
  assert.ok(Math.abs(half[0] - 60) < 1e-9, 'halfway between throat 20 and 100');
  assert.ok(wellProfile({ ...p, well_morph: 1 }, R, 4).every((v) => Math.abs(v - 100) < 1e-9));
  assert.deepEqual(wellProfile({ well_profile: [1, 0.2], well_morph: 1 }, R, 4), wellProfile({ well_profile: [1, 0.2] }, R, 4), 'no target: no morph');
});

test('ripple: scales each radius by 1 + a sin(...), a rising phase moves the waves down', () => {
  const flat = new Array(65).fill(100);
  assert.deepEqual(rippleProfile(flat, 0, 3, 0.2), flat);
  const r = rippleProfile(flat, 0.1, 1, 0);
  assert.ok(Math.abs(Math.max(...r) - 110) < 0.1 && Math.abs(Math.min(...r) - 90) < 0.1);
  // The crest (sin = 1 at waves x h + phase = 0.25) sits lower when the phase grows
  const crest = (phase) => rippleProfile(flat, 0.1, 1, phase).indexOf(Math.max(...rippleProfile(flat, 0.1, 1, phase)));
  assert.ok(crest(0.1) < crest(0));
  assert.ok(rippleProfile([10, 10], 2, 1, 0.75).every((v) => v >= 0), 'never below zero');
});

test('surface rotation: identity at 0; matches three.js Euler XYZ; toSurface undoes it', async () => {
  const { Matrix4, Euler } = await import('three');
  const id = [1, 0, 0, 0, 1, 0, 0, 0, 1];
  assert.deepEqual(surfaceRotation(0, 0, 0).map((v) => v + 0), id);
  const [rx, ry, rz] = [30, -50, 70];
  const m = new Matrix4().makeRotationFromEuler(new Euler((rx * Math.PI) / 180, (ry * Math.PI) / 180, (rz * Math.PI) / 180, 'XYZ')).elements;
  // three is column-major 4 x 4
  const three = [m[0], m[4], m[8], m[1], m[5], m[9], m[2], m[6], m[10]];
  surfaceRotation(rx, ry, rz).forEach((v, i) => assert.ok(Math.abs(v - three[i]) < 1e-9, `element ${i}`));
  // frame x R^T x R = frame
  const rot = surfaceRotation(rx, ry, rz);
  const frame = surfaceFrame('cylinder', 'horizontal');
  const back = toSurface(toSurface(frame, rot), rot.map((_, i) => rot[(i % 3) * 3 + Math.floor(i / 3)]));
  back.forEach((v, i) => assert.ok(Math.abs(v - frame[i]) < 1e-9));
});
