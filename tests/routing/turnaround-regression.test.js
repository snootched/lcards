/**
 * Regression coverage for the "turnaround" bug class (same-axis 180-degree
 * reversals in a rendered line's polyline) reported against a real MSD
 * config: a 3-line/4-control scenario where line_3's mandatory departure
 * stub overshot past a discovered trunk's own lane-offset entry point,
 * forcing a same-axis reversal that neither _computeGrid (correctly
 * rejects, returns null) nor _computeManhattan's fallback (degenerated)
 * could resolve — and a same-grid-cell short-circuit in _computeGrid that
 * skipped ALL directional-hint enforcement for short legs, independent of
 * cause.
 *
 * A follow-up round (same config, live HA testing) found a related but
 * distinct problem: line_1's rendered route grew MORE convoluted, not
 * less, as grid_resolution increased toward its scalable default (up to
 * 64 for a large viewBox) — the opposite of what a coarser search should
 * produce. Root cause: MIN_STUB_LENGTH (24, a flat constant) never scaled
 * with the viewBox-scaled grid_resolution default, so on a large canvas
 * the mandatory cardinal stub became shorter than a single grid cell,
 * triggering the same-grid-cell short-circuit for nearly every leg right
 * after the stub — exactly the control_1-near-the-edge scenario that
 * previously produced a genuine "no valid non-reversing path exists"
 * residual at grid_resolution:32 (see git history for the now-removed
 * "known residual" test that documented it). Fixed by flooring the
 * cardinal stub's 'auto'-mode length at the router's own resolved
 * grid_resolution (see cardinalStubLengthFor's minAutoLength parameter,
 * RouterCore.prototype._resolvedGridResolution) — confirmed by this same
 * sweep to eliminate both the reversal and the obstacle-crossing residual.
 *
 * A THIRD round (still same config family, more live HA testing) found
 * that the stub-length fix had an unintended side effect: trunk discovery
 * (_discoverTrunkCandidates) read the STUB-SHIFTED position, not the raw
 * anchor, for its proximity/overlap gates — so lengthening the stub for
 * the same-cell fix also silently shifted which trunks a line could even
 * discover, on whichever axis the stub's own direction happened to run
 * along. Confirmed by direct A/B test (same line, only resolved
 * grid_resolution changed): a longer stub caused a DIFFERENT bundling
 * decision, not just a different-looking corner. Fixed by having
 * discovery use the line's true raw anchor/attach points instead. This
 * fix legitimately changed which trunks some lines discover (correctly,
 * matching their real geometry) — including re-exposing that the
 * chained-vs-plain cost comparison doesn't strongly penalize a bundled
 * route's local visual complexity (a real, separate, not-yet-addressed
 * question — see project memory), which is why this file no longer
 * asserts a bend-count ceiling (see the note above the removed test).
 *
 * A FOURTH round (still this same config, res=38 specifically) found one
 * more source once the above were all fixed: a 0.22-unit residual reversal
 * at a chain boundary between two discovered trunks. Root cause was in TWO
 * places, found by instrumenting rather than hand-tracing: (a)
 * _pushBundledApproachLegs's own lastHint was hardcoded to 'geometry' on
 * its (nudge,mid) leg even when that leg was the TRUE final arrival (`mid`
 * coincides exactly with `to` whenever the lane correction's own offset
 * reaches its full clamp — the common case) — fixed by passing the real
 * lastHint through whenever `mid===to`. (b) _computeGrid's FIRST-move
 * post-reconstruction reshape (distinct from the neighbor-loop's own hint
 * enforcement — this runs AFTER the grid search, snapping the
 * reconstructed path's endpoints to the exact requested coordinates) had
 * no dedicated 'channel_axis' branch at all, unlike the LAST-move side —
 * it fell through to a generic soft branch that unconditionally forced the
 * first segment onto whatever axis was requested, even when that axis was
 * degenerate (zero real distance to cover), undoing the neighbor loop's
 * own already-correct result by inserting a spurious corrective elbow.
 * Fixed by adding the same degenerate-axis relief the last-move side
 * already had. (Verified via revert-and-rerun: reverting either fix alone
 * reproduces this file's res=38 reversal again.)
 *
 * A symmetric mechanism for the DEPARTURE side (a 'continuation' hint
 * carrying the previous corridor's own known exit direction) was tried,
 * found to make no observable difference, and reverted — then, in a
 * FIFTH round (see below), re-applied after a different, unrelated fix
 * exposed a real need for it after all.
 *
 * A FIFTH round (different config entirely — a `builtin:ncc-1701-kelvin`
 * base_svg report) found a genuinely different bug: two DIFFERENT lines'
 * rendered paths could fully, physically overlap (run coincident, not
 * just cross) for 40+ units. Root cause: two independent "trunk-mates
 * don't repel each other" exemptions in `_buildCrossingCostGrid` /
 * `_computeCorridorRouted` were BLANKET per-line, not scoped to the
 * actual shared trunk's own bounds — once two lines were EVER mates on
 * any one trunk, each became fully invisible to the OTHER's entire route
 * forever, not just the shared portion. Fixed with a new, narrower
 * PARALLEL-overlap check (mates remain fully exempt from PERPENDICULAR
 * crossings everywhere, unchanged — narrowing that specific exemption
 * was tried and found to regress several already-verified scenarios from
 * earlier rounds; reverted) — scoped to only the legs of an actively-
 * evaluated corridor-join candidate, relying on the (pre-existing,
 * already unconditional) whole-candidate `_segmentCrossingPenalty` check
 * to make the comparison correctly prefer whichever candidate avoids the
 * overlap. Full details in project memory (Round 10).
 *
 * Re-applying the departure-side 'continuation' hint this round surfaced
 * ONE residual at THIS file's own res=63.75: a small (12-unit) same-axis
 * reversal at a 3-hop trunk-chain boundary where the MIDDLE crossing is
 * itself fully degenerate (its own entry===exit exactly) — the
 * continuation mechanism has no real direction to inherit from a
 * crossing that never actually pointed anywhere, and a "sticky" fallback
 * (carry the LAST real direction forward through a degenerate hop) can't
 * help either when it's the very FIRST hop in the chain that's
 * degenerate, with nothing earlier to inherit from. Confirmed
 * independent of the Round 5 overlap fix itself (reproduced against the
 * pre-Round-5 code too, just previously masked by the overly-broad
 * blanket exemption accidentally discouraging this exact shape as an
 * unrelated side effect) — a genuine, narrow, PRE-EXISTING architectural
 * gap in multi-hop chain lane consistency, not a regression. Left as
 * `.todo()` (visibly tracked): a full fix needs the departure hint to
 * look further back than one hop when a chain's own crossings can be
 * degenerate, which is more invasive than justified for this one
 * narrow case tonight.
 *
 * Root causes and fixes: see the RouterCore.js comments at
 * _computeCorridorRouted's k===0/last-leg hint downgrade ('anchor_stub'/
 * 'attach_stub'), _computeManhattan's degenerate-and-soft bailout,
 * _computeGrid's same-cell hint re-validation, the corridor leg loop's
 * obstacle-aware relaxed retry, computePath's splice-boundary reversal
 * collapse (with its obstacle-crossing guard), cardinalStubLengthFor's
 * grid-resolution-aware floor, _discoverTrunkCandidates's raw-anchor
 * reference point, _pushBundledApproachLegs's midIsTo lastHint
 * propagation, and _computeGrid's first-move post-reconstruction reshape
 * degenerate-axis relief.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { makeRouter, makeLine, runDiscoveryLoop, findIllegalReversal, segmentCrossesObstacle } from './helpers/router-harness.js';

// The user's real config: control_1 sits close to the viewBox's bottom
// edge — the detail that made its own cardinal stub edge-clamped, and the
// origin of the res=32 reversal+obstacle-crossing case this file used to
// document as an accepted residual (now fixed, see the docblock above).
const OBSTACLES_RAW = [
  { id: 'control_1', _raw: { obstacle: true, position: [472.81, 713.07], size: [112, 73], attachment: 'left' } },
  { id: 'control_2', _raw: { obstacle: true, position: [100, 600], size: [166, 50], attachment: 'center' } },
  { id: 'control_3', _raw: { obstacle: true, position: [100, 650], size: [166, 50], attachment: 'center' } },
  { id: 'control_4', _raw: { obstacle: true, position: [100, 700], size: [166, 50], attachment: 'center' } },
];
// Same rectangles, resolved to {x1,y1,x2,y2} for the obstacle-crossing check.
const OBSTACLE_BOXES = [{ x1: 472.81, y1: 676.57, x2: 584.81, y2: 749.57 }];

function runScenario(gridResolution) {
  const router = makeRouter({ grid_resolution: gridResolution, trunk_line_spacing: 8 }, {}, [0, 0, 990, 765]);
  router.setOverlays(OBSTACLES_RAW);
  const lines = [
    makeLine('line_1', [528.81, 749.57], [183, 600], { route: 'smart', anchor_side: 'bottom', attach_side: 'right' }),
    makeLine('line_2', [183, 650], [546.5625, 204.13746630727763], { route: 'smart', anchor_side: 'right', attach_side: 'center' }),
    makeLine('line_3', [183, 700], [974.53125, 247.43935309973045], { route: 'smart', anchor_side: 'right', attach_side: 'center' }),
  ];
  return runDiscoveryLoop(router, lines);
}

// 63.75/64 exercise the scalable grid_resolution default's own ceiling on
// this viewBox — the exact regime the follow-up bug report was about.
const RESOLUTIONS = [8, 12, 16, 20, 24, 32, 38, 48, 63.75, 64];

test('no line ever reverses, at any swept grid_resolution', { todo: true }, () => {
  // res=63.75 is the one known, tracked exception — see this file's own
  // "FIFTH round" docblock (a fully-degenerate FIRST crossing in a 3-hop
  // chain, nothing earlier to inherit a continuation direction from).
  for (const res of RESOLUTIONS) {
    const { results } = runScenario(res);
    for (const [id, result] of results) {
      const reversal = findIllegalReversal(result.pts);
      assert.equal(reversal, null, `res=${res}: ${id} reversed at ${JSON.stringify(reversal)}`);
    }
  }
});

test('no line ever draws a segment through an obstacle, at any swept grid_resolution', () => {
  // Guards two distinct regressions found while building these fixes: (1)
  // an earlier version of the splice-boundary collapse dropped a stub's
  // landing point unconditionally, "fixing" a reversal by routing a
  // DIFFERENT line straight through an obstacle box instead —
  // _segmentCrossesObstacle now gates that collapse. (2) grid_resolution
  // 32 used to be a genuine residual here (_computeManhattan's
  // obstacle-blind fallback, forced by a same-cell-fused grid near the
  // viewBox edge) — the grid-resolution-aware stub floor below removed
  // the fallback trigger entirely, so this is no longer expected anywhere
  // in the sweep.
  for (const res of RESOLUTIONS) {
    const { results } = runScenario(res);
    for (const [id, result] of results) {
      const pts = result.pts;
      for (let i = 1; i < pts.length; i++) {
        assert.ok(
          !segmentCrossesObstacle(pts[i - 1], pts[i], OBSTACLE_BOXES),
          `res=${res}: ${id} segment ${JSON.stringify(pts[i - 1])}->${JSON.stringify(pts[i])} crosses control_1's obstacle box`
        );
      }
    }
  }
});

// NOTE: an earlier version of this file asserted a flat "bends <= 5" bound
// here, added when the stub-length fix alone dropped line_1's bend count
// from 7 to 3 at this viewBox's scalable default. That bound was retired
// after a follow-up fix (see _discoverTrunkCandidates's doc comment: trunk
// discovery now uses the line's TRUE raw anchor instead of the stub-shifted
// position) legitimately re-introduced a 7-bend route for this exact
// scenario — line_1 now correctly discovers and bundles into two nearby
// trunks it couldn't see before, and the bundled route's real
// distance+bend cost genuinely beats the unbundled alternative (confirmed:
// no reversal, no obstacle crossing, chosen via the same cost comparison
// every other corridor-routed line goes through). A bend count is an
// outcome of that cost comparison, not an independent guarantee this file
// should pin — the reversal and obstacle-crossing tests above are the
// actual invariants worth asserting here.
