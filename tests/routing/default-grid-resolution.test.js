/**
 * grid_resolution's default (2026-07-24): scales off the viewBox's shorter
 * dimension (targeting ~12 cells across it) instead of a flat 64, clamped
 * to [16, 64]. Explicit config always overrides. See _defaultGridResolution
 * in RouterCore.js.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { RouterCore, makeLine } from './helpers/router-harness.js';

function routerWithoutResolutionOverride(viewBox) {
  const router = new RouterCore({}, {}, viewBox);
  router.setOverlays([]);
  return router;
}

function resolutionFor(router) {
  const line = makeLine('probe', [10, 10], [10, 200]);
  const result = router.computePath(router.buildRouteRequest(line, line.a, line.b));
  return result.meta.grid.resolution;
}

test('small viewBox: default resolution is floored at 16, not the old flat 64', () => {
  const router = routerWithoutResolutionOverride([0, 0, 120, 120]); // shortSide/12 = 10 -> floored to 16
  assert.equal(resolutionFor(router), 16);
});

test('mid-size viewBox: default resolution scales with the shorter side', () => {
  const router = routerWithoutResolutionOverride([0, 0, 600, 300]); // shortSide/12 = 25
  assert.equal(resolutionFor(router), 25);
});

test('large viewBox: default resolution is capped at 64, same as the old flat default', () => {
  const router = routerWithoutResolutionOverride([0, 0, 5000, 2500]); // shortSide/12 = 208.3 -> capped
  assert.equal(resolutionFor(router), 64);
});

test('explicit grid_resolution always overrides the dynamic default', () => {
  const router = new RouterCore({ grid_resolution: 40 }, {}, [0, 0, 120, 120]); // would default to 16
  router.setOverlays([]);
  assert.equal(resolutionFor(router), 40);
});

test('the shorter dimension governs, regardless of which axis it is', () => {
  const wide = routerWithoutResolutionOverride([0, 0, 1200, 120]); // shortSide (height) = 120 -> 16
  const tall = routerWithoutResolutionOverride([0, 0, 120, 1200]); // shortSide (width) = 120 -> 16
  assert.equal(resolutionFor(wide), 16);
  assert.equal(resolutionFor(tall), 16);
});
