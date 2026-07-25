/**
 * cardinalStubLengthFor's grid-resolution-aware floor: the mandatory
 * cardinal stub (_applyCardinalStubs) must never be shorter than one grid
 * cell, or its own landing point collapses into the same cell the raw
 * anchor started in — triggering the same-grid-cell short-circuit (see
 * same-cell-collapse.test.js) for virtually every leg immediately after
 * the stub, on any canvas large enough for grid_resolution's scalable
 * default to exceed the old flat MIN_STUB_LENGTH (24).
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { makeRouter, makeLine, runDiscoveryLoop } from './helpers/router-harness.js';

test('_resolvedGridResolution mirrors _computeGrid\'s own resolution exactly', () => {
  const explicit = makeRouter({ grid_resolution: 40 });
  assert.equal(explicit._resolvedGridResolution(), 40, 'explicit config wins');

  const usingDefault = makeRouter({}, {}, [0, 0, 990, 765]); // makeRouter forces 8 unless overridden — bypass via direct config
  usingDefault.config.grid_resolution = undefined;
  assert.equal(usingDefault._resolvedGridResolution(), usingDefault._defaultGridResolution(), 'falls back to the scalable default when unset');

  const tooSmall = makeRouter({ grid_resolution: 2 });
  assert.equal(tooSmall._resolvedGridResolution(), 32, 'values <= 4 coerce to 32, matching _computeGrid\'s own floor');
});

test('the cardinal stub is never shorter than the resolved grid_resolution', () => {
  // A large viewBox pushes the scalable default toward its 64 ceiling,
  // while MIN_STUB_LENGTH stays a flat 24 — before the fix, the stub
  // landed well inside a single grid cell. Anchor placed away from every
  // viewBox edge so _maxStubBeforeEdge's own (correct, unrelated) clamp
  // can't confound the result.
  const router = makeRouter({}, {}, [0, 0, 990, 765]);
  router.config.grid_resolution = undefined; // force the scalable default path
  const resolvedRes = router._resolvedGridResolution();
  assert.ok(resolvedRes > 24, 'sanity: this scenario only proves the fix if the default genuinely exceeds the old flat stub length');

  const line = makeLine('line_1', [400, 400], [200, 300], { route: 'smart', anchor_side: 'bottom', attach_side: 'right' });
  const req = router.buildRouteRequest(line, line.a, line.b);
  const { stubReq } = router._applyCardinalStubs(req);
  const stubLength = Math.abs(stubReq.a[1] - req.a[1]); // anchor_side:'bottom' -> stub moves along y
  assert.equal(stubLength, resolvedRes, `stub length (${stubLength}) should equal the resolved grid_resolution (${resolvedRes}), not the bare 24px MIN_STUB_LENGTH`);
});

test('forced cornerRadiusMode is unaffected by the grid-resolution floor', () => {
  // 'forced' mode already guarantees a corner-radius-driven stub length
  // (stubLengthFor) — the resolution floor is 'auto'-mode-only per
  // cardinalStubLengthFor's own signature; forced mode must render
  // identically to before this fix. cornerRadius=20 (not 10) so its
  // stubLengthFor result (2x20=40) unambiguously exceeds BOTH
  // MIN_STUB_LENGTH (24) and the configured grid_resolution (64 — wait,
  // 40 < 64, so pick a radius whose 2x product also clears 64): 40 gives
  // 2x40=80, clearly distinguishable from a floor of 64 or 24 either way.
  const router = makeRouter({ grid_resolution: 64 }, {}, [0, 0, 990, 765]);
  const line = makeLine('line_1', [400, 400], [600, 600], { anchor_side: 'right', corner_radius_mode: 'forced', corner_style: 'round', corner_radius: 40 });
  const req = router.buildRouteRequest(line, line.a, line.b);
  const { stubReq } = router._applyCardinalStubs(req);
  const stubLength = Math.abs(stubReq.a[0] - req.a[0]);
  assert.equal(stubLength, 80, 'forced mode stays cornerRadius-driven (2x40=80), ignoring the grid_resolution floor entirely');
});
