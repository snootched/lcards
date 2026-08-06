/**
 * _computeGrid's same-grid-cell short-circuit (RouterCore.js): when a
 * leg's start and goal snap to the same grid cell, the main A* loop
 * breaks on the very first pop, before the neighbor-expansion loop where
 * every directional-hint check (anchor_side/anchor_stub reversal-block,
 * channel_axis axis-lock) lives — silently accepting a collapsed straight
 * line regardless of whether it violates a hard hint. Fixed by
 * re-validating the raw, un-snapped displacement against whichever hard
 * hint applies at the moment of collapse; violations now correctly
 * return null (letting the fallback pipeline take over) instead of
 * rendering untouched.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { makeRouter } from './helpers/router-harness.js';

// grid_resolution 64, origin 0: w2c(x) = Math.round(x/64) puts 100, 104 AND
// 108 all in cell 2 (the rounding boundaries nearest 100 are at 96 and 160)
// — verified directly, not assumed; a naive "small delta" pick can
// straddle a rounding boundary and land in adjacent cells instead (a real
// mistake caught while writing this file: 100->92 crosses the boundary at
// 96 and does NOT collapse, silently testing the normal neighbor-loop path
// instead of the same-cell short-circuit this file exists to cover).
function collapsedReq(overrides) {
  return {
    id: 'leg', a: [100, 100], b: [108, 100], // 8px, same cell (verified above)
    modeHint: 'xy', modeHintLast: 'xy',
    smoothingMode: 'none', smoothingIterations: 0,
    ...overrides
  };
}

test('same-cell collapse violating a hard anchor_side hint returns null', () => {
  const router = makeRouter({ grid_resolution: 64 });
  // Moving from x=100 to x=108 is +x; anchor_side 'left' hard-blocks the
  // exact reversal of its own outward direction ([-1,0]) as the first move.
  const req = collapsedReq({ _hintSourceFirst: 'anchor_side', anchorSide: 'left' });
  const result = router._computeGrid(req);
  assert.equal(result, null, 'a same-cell collapse that reverses a hard anchor_side hint must be rejected, not silently accepted');
});

test('same-cell collapse violating a hard anchor_stub hint ALSO returns null (matches anchor_side)', () => {
  // anchor_stub carries the same hard reversal-block as anchor_side in the
  // neighbor loop (a soft cost-penalty version was tried and reverted —
  // see that branch's own comment) — the same-cell path must stay
  // consistent with it, or exactly the leg this whole fix targets
  // (a corridor-approach leg whose start is already a resolved stub)
  // would slip through unvalidated.
  const router = makeRouter({ grid_resolution: 64 });
  const req = collapsedReq({ _hintSourceFirst: 'anchor_stub', anchorSide: 'left' });
  const result = router._computeGrid(req);
  assert.equal(result, null, 'a same-cell collapse that reverses a hard anchor_stub hint must be rejected too');
});

test('same-cell collapse that does NOT violate the hint is still accepted (no new rejection)', () => {
  const router = makeRouter({ grid_resolution: 64 });
  // Moving from x=100 to x=108 is +x; anchor_side 'right' wants exactly
  // that direction — no reversal, should collapse exactly as before this
  // fix.
  const req = collapsedReq({ _hintSourceFirst: 'anchor_side', anchorSide: 'right' });
  const result = router._computeGrid(req);
  assert.notEqual(result, null, 'a same-cell collapse that matches the hint must still be accepted');
  assert.deepEqual(result.pts, [[100, 100], [108, 100]]);
});

test('same-cell collapse with a soft geometry hint is never checked (unconditionally accepted)', () => {
  const router = makeRouter({ grid_resolution: 64 });
  const req = collapsedReq({ _hintSourceFirst: 'geometry' });
  const result = router._computeGrid(req);
  assert.notEqual(result, null, 'a geometry-sourced same-cell collapse must remain unconditionally accepted');
});

test('same-cell collapse violating a hard channel_axis hint returns null', () => {
  const router = makeRouter({ grid_resolution: 64 });
  // Both axes have real raw distance (dx=8,dy=8 — a genuine tie, which
  // isHorizontalDominant's >= resolves to horizontal), but this leg
  // requires crossing vertically (_channelAxisHorizontalFirst: false) —
  // dominant-axis mismatch, and the required (vertical) axis is NOT
  // degenerate (dyRaw=8, not 0), so this must still be rejected — see the
  // next test for the case where the required axis genuinely has zero
  // distance to cover.
  const req = collapsedReq({ b: [108, 108], _hintSourceFirst: 'channel_axis', _channelAxisHorizontalFirst: false });
  const result = router._computeGrid(req);
  assert.equal(result, null, 'a same-cell collapse on the wrong axis for a channel_axis requirement must be rejected');
});

test('same-cell collapse on a DEGENERATE channel_axis requirement (zero real distance on the required axis) is accepted', () => {
  // dx=8, dy=0: this leg's own raw endpoints already share the exact same
  // y-coordinate, yet the hint requires a vertical crossing
  // (_channelAxisHorizontalFirst: false). This hint can legitimately
  // describe a DIFFERENT channel than the one this leg itself crosses
  // (see _pushBundledApproachLegs's unsplit-fallback branch, and the
  // identical exemption in the main neighbor loop) — rejecting a
  // same-cell collapse whose required axis has zero real distance to
  // cover would only ever force a synthetic zigzag with nowhere useful to
  // go; the straight collapse is the correct, non-degenerate answer.
  const router = makeRouter({ grid_resolution: 64 });
  const req = collapsedReq({ _hintSourceFirst: 'channel_axis', _channelAxisHorizontalFirst: false });
  const result = router._computeGrid(req);
  assert.notEqual(result, null, 'a same-cell collapse whose required channel_axis distance is zero must be accepted, not rejected');
  assert.deepEqual(result.pts, [[100, 100], [108, 100]]);
});
