/**
 * Shared value noise (C3): the integer lattice hash both tiers use, its
 * range, and the GLSL port's split-coordinate fBm (mirrored here in JS,
 * step for step) agreeing with the Canvas2D _fbm at any scroll distance.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { _hash, _fbm, NOISE_HASH } from '../../src/core/packs/textures/effects/noise-helpers.js';
import { NOISE_GLSL, MAX_OCTAVES, splitCoord } from '../../src/core/packs/backgrounds/webgl/scenes/noise-glsl.js';

test('the hash is fixed: these values define the field on both tiers', () => {
  assert.deepEqual([_hash(0, 0), _hash(-5, 7), _hash(123456, -9)].map((v) => v.toFixed(6)),
    GOLDEN);
});

test('the hash is uniform on [-2, 2)', () => {
  let min = Infinity, max = -Infinity, sum = 0;
  const n = 200000;
  for (let i = 0; i < n; i++) {
    const v = _hash(i * 7 - 1000, i * -3 + 55);
    min = Math.min(min, v); max = Math.max(max, v); sum += v;
  }
  assert.ok(min >= -2 && max < 2);
  assert.ok(min < -1.99 && max > 1.99, 'spans the range');
  assert.ok(Math.abs(sum / n) < 0.01, 'centred');
});

/** The GLSL lcSmoothNoise: lattice corner i, fraction f */
function cornerNoise(ix, iy, fx, fy) {
  const ux = fx * fx * (3 - 2 * fx), uy = fy * fy * (3 - 2 * fy);
  const a = _hash(ix, iy), b = _hash(ix + 1, iy), c = _hash(ix, iy + 1), d = _hash(ix + 1, iy + 1);
  return a + (b - a) * ux + (c - a) * uy + (a + d - b - c) * ux * uy;
}

/** The GLSL lcFbm, step for step (cell doubles as an int, local as a float) */
function splitFbm(cellX, cellY, localX, localY, octaves) {
  let value = 0, amplitude = 0.5;
  for (let k = 0; k < Math.min(octaves, MAX_OCTAVES); k++) {
    const fx = Math.floor(localX), fy = Math.floor(localY);
    value += amplitude * cornerNoise((cellX + fx) | 0, (cellY + fy) | 0, localX - fx, localY - fy);
    amplitude *= 0.5;
    cellX = (cellX * 2) | 0; cellY = (cellY * 2) | 0;
    localX *= 2; localY *= 2;
  }
  return value;
}

test('split coordinates (the shader path) give the same fBm as _fbm, near and far', () => {
  for (const pan of [0, 37.25, -812.5, 123456.75]) {
    for (let i = 0; i < 50; i++) {
      const x = pan + i * 0.173, y = pan * 0.5 - i * 0.291;
      const [cx, lx] = splitCoord(pan);
      const [cy, ly] = splitCoord(pan * 0.5);
      const viaSplit = splitFbm(cx, cy, lx + i * 0.173, ly - i * 0.291, 5);
      assert.ok(Math.abs(viaSplit - _fbm(x, y, 5)) < 1e-9, `pan ${pan}, sample ${i}`);
    }
  }
});

test('the GLSL source carries the same constants', () => {
  for (const c of Object.values(NOISE_HASH)) assert.ok(NOISE_GLSL.includes(`${c >>> 0}u`));
  assert.match(NOISE_GLSL, /float lcFbm\( ivec2 cell, vec2 local, int octaves \)/);
});

const GOLDEN = ['-1.968939', '-1.114909', '0.991342'];
