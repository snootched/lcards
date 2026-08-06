/**
 * Baseline routing sanity — plain grid/manhattan/direct behavior that the
 * trunk/lane refactor must not disturb.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { makeRouter, makeLine, routeLine } from './helpers/router-harness.js';

test('grid: an unobstructed straight line routes straight', () => {
  const router = makeRouter();
  const res = routeLine(router, makeLine('line_straight', [50, 100], [500, 100]));
  assert.equal(res.meta.strategy, 'grid');
  assert.deepEqual(res.pts[0], [50, 100]);
  assert.deepEqual(res.pts[res.pts.length - 1], [500, 100]);
  for (const [, y] of res.pts) assert.equal(y, 100, 'no detour off the straight row');
});

test('manhattan: offset endpoints produce a single L-shaped elbow', () => {
  const router = makeRouter();
  const res = routeLine(router, makeLine('line_l', [50, 50], [300, 200], { route: 'manhattan' }));
  assert.equal(res.meta.strategy, 'manhattan-basic');
  // dx > dy -> horizontal first, final segment vertical.
  assert.deepEqual(res.pts, [[50, 50], [300, 50], [300, 200]]);
});

test('direct: a literal two-point line, untouched', () => {
  const router = makeRouter();
  const res = routeLine(router, makeLine('line_d', [50, 50], [300, 200], { route: 'direct' }));
  assert.equal(res.meta.strategy, 'direct');
  assert.deepEqual(res.pts, [[50, 50], [300, 200]]);
});
