/**
 * Warp (warp-drive.js): what engages it, and the streak layer's opacity and
 * speed as the ship goes to warp.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { installJsdom } from '../helpers/jsdom-env.js';

installJsdom();
const { warpOn, warpState, warpSpeed, DEFAULT_FACTOR } = await import('../../src/core/astrometrics/warp-drive.js');

test('warpOn: true, on-like states and numbers above 0 engage', () => {
  for (const v of [true, 'on', 'ON', 'true', 'engaged', 1, '9.5']) assert.equal(warpOn(v), true, String(v));
  for (const v of [false, 'off', 'unavailable', '', 0, '0', undefined, null]) assert.equal(warpOn(v), false, String(v));
});

test("warpState: the layer shows early and speeds up late, to the factor's speed at full warp", () => {
  assert.deepEqual(warpState(0, 6), { opacity: 0, speed: 1 });
  const half = warpState(0.5, 6);
  assert.equal(half.opacity, 1);
  assert.ok(half.speed > 1 && half.speed < 1 + (warpSpeed(6) - 1) * 0.5);
  assert.equal(warpState(1, 6).speed, warpSpeed(6));
  assert.ok(warpSpeed(9.9) > warpSpeed(2));
  assert.equal(warpSpeed(NaN), warpSpeed(DEFAULT_FACTOR));
  assert.equal(warpSpeed(20), warpSpeed(9.9));
});

test('cruiseTails: at warp the stars stream along the view, longer with the factor and as the ship comes up to speed', async () => {
  const { cruiseTails } = await import('../../src/core/astrometrics/star-field.js');
  const o = { scale: 100, shell: 3000, streak: 1 };
  assert.equal(cruiseTails({ x: 0, y: 0, z: -1 }, { ...o, level: 0, factor: 6 }), null);
  const half = cruiseTails({ x: 0, y: 0, z: -1 }, { ...o, level: 0.5, factor: 6 });
  const full = cruiseTails({ x: 0, y: 0, z: -1 }, { ...o, level: 1, factor: 6 });
  const fast = cruiseTails({ x: 0, y: 0, z: -1 }, { ...o, level: 1, factor: 9.9 });
  assert.ok(half && full && fast);
  assert.ok(full.stars.z < 0 && full.stars.x === 0, 'along the view');
  assert.ok(Math.abs(full.stars.length() - 2 * half.stars.length()) < 1e-9);
  assert.ok(fast.stars.length() > full.stars.length() && fast.stars.length() <= 3000 * 0.4 + 1e-9);
});
