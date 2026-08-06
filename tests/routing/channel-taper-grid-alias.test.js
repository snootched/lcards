/**
 * Reported live, immediately after channel-plain-candidate-bias.test.js's
 * own fix shipped: a user added a SECOND line to a shared `mode: force`
 * channel (bundling two lines north together via `route_channels`) and
 * both lines' routes went "haywire" — long, pointless zigzag detours with
 * backtracking, instead of the clean shapes each line took alone.
 *
 * Root cause, confirmed via leg-level isolation (A/B testing
 * `_crossingExemptChanIds` on the exact leg request in question): a
 * grid-quantization alias. `_channelCrossingPoints`'s "grace zone" taper
 * (see entry-taper-grace-zone.test.js) reserves flow-axis room for a
 * line's own approach leg once `laneCount > 1` — but two DIFFERENT lines'
 * own approach rows can land only a handful of real units apart, and at a
 * coarse `grid_resolution`, that's enough for `_buildCrossingCostGrid`'s
 * segment registration (`Math.floor`) and `_computeGrid`'s own query-side
 * quantization (`Math.round`) to disagree right at a cell boundary,
 * aliasing two genuinely-distinct rows into the same grid cell.
 * `_buildCrossingCostGrid`'s real, large "parallel-overlap" anti-stacking
 * penalty then fires against a bundle-mate's own ordinary, correctly
 * un-exempt approach leg (genuinely outside the channel's own bounds —
 * broadening that exemption to a mate's WHOLE route was already tried and
 * reverted earlier for a different real bug, and is NOT reintroduced by
 * this fix), forcing a large, pointless detour to avoid a "crossing" that
 * was never real at full precision.
 *
 * A separate, prerequisite fix landed first in the same function: the
 * taper's own `entryAlreadyInside` was being re-derived from its OWN
 * post-taper `entryFlow`, making a successful taper self-defeating (see
 * that fix's own comment in _channelCrossingPoints). That fix alone is
 * necessary but not sufficient — this file's own scenario still zigzags
 * without the fix below too.
 *
 * Fixed by `_taperAliasesRegisteredSegment`: an all-or-nothing guard
 * checked before the taper commits to its candidate coordinate. If ANY
 * other line's registered same-direction segment (with real cross-axis
 * overlap) would alias with the candidate under the SAME two quantization
 * functions already used elsewhere in this file, skip the taper entirely —
 * this taper is purely cosmetic (real room for a rounder corner), not
 * load-bearing for correctness, so falling back to a tighter corner is
 * strictly safer than searching for an alias-free alternative offset.
 *
 * First shipped scoped to bundle-mates only (same channel's `members`) —
 * confirmed too narrow by an immediate live follow-up report: line_2 still
 * showed a small residual "loop" reaching toward line_1, a completely
 * unrelated line never referencing this channel at all, whose own
 * horizontal segment (y=540) happened to alias with line_2's own taper
 * candidate (y=532) the exact same way. The alias risk this guard exists to
 * catch has nothing to do with mate status — `_buildCrossingCostGrid`'s
 * parallel-overlap penalty already applies to ANY other line's segment,
 * mate or not — so the guard now checks every registered segment.
 *
 * A THIRD live follow-up (a differently-shaped `channel_north`, one whose
 * own bounds don't reach all the way down to line_3's anchor row) surfaced
 * the same class of bug through a completely different code path: the
 * taper's own gate never fires here (the channel boundary genuinely clamps
 * `entryFlow` away from `approachFlow`, so `entryAlreadyInside` is
 * correctly false from the start — not the taper's own self-defeat). But
 * `_pushBundledApproachLegs`'s `corridorOffset` saturates fully against
 * `available` the same way the taper's own displacement does whenever a
 * real corridor boundary sits close enough to the approach point — leaving
 * its own (nudge,mid) leg with a fixed flow coordinate that risks the
 * identical alias. Two bugs, found together: (1) that (nudge,mid) leg's
 * own endpoints ALWAYS share the flow-axis coordinate by construction (`mid`
 * literally copies `nudge`'s own flow value), yet it was still handed a
 * hard `channel_axis` lock whenever `midIsTo` — geometrically incompatible,
 * the same "hard block vs. same-flow-coordinate endpoints" class
 * `entryAlreadyInside` exists to prevent, just never connected to this leg.
 * Fixed by downgrading that specific leg's hint exactly like the
 * `entryAlreadyInside`-true case already does (continuation, or geometry).
 * (2) That downgrade alone wasn't sufficient — a soft hint still lets A*
 * CHOOSE the cheap-looking alias detour when the underlying cost bias is
 * the real cause. Fixed by reusing `_taperAliasesRegisteredSegment` at
 * `_pushBundledApproachLegs`'s own `corridorOffset` computation too: if the
 * resulting `nudge[flow]` risks a grid-quantization alias, treat this leg
 * as having no real bundling room to offer (`corridorOffset = 0`) instead
 * of committing to a coordinate that risks a false-positive "crossing" —
 * exactly the same all-or-nothing philosophy as the taper's own fix, since
 * this nudge is likewise purely cosmetic (the line still reaches the
 * correct, already lane-separated destination either way).
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { makeRouter, makeLine, runDiscoveryLoop, findIllegalReversal, findDiagonalSegment, countRenderedCrossings } from './helpers/router-harness.js';

// The reported config verbatim: channel_north (force, vertical) bundling
// line_2 and line_3 north together; line_2's own natural approach row
// (y=600) and line_3's tapered approach row (y~592) are only 8 real units
// apart — well within one grid cell at grid_resolution 60.
function runScenario() {
  const router = makeRouter({
    grid_resolution: 60,
    trunk_line_spacing: 8,
    turn_penalty: 2,
    channels: { channel_north: { bounds: [536.5625, 204.13746630727763, 20, 456], mode: 'force', direction: 'vertical', line_spacing: 16 } }
  }, {}, [0, 0, 990, 765]);
  router.setOverlays([
    { id: 'control_1', _raw: { obstacle: true, position: [278.81, 115.32], size: [112, 73], attachment: 'left' } },
    { id: 'control_2', _raw: { obstacle: true, position: [120, 540], size: [166, 50], attachment: 'center' } },
    { id: 'control_3', _raw: { obstacle: true, position: [120, 600], size: [166, 50], attachment: 'center' } },
    { id: 'control_4', _raw: { obstacle: true, position: [120, 660], size: [166, 50], attachment: 'center' } },
  ]);
  const lines = [
    makeLine('line_1', [334.81, 115.32], [219, 540], { route: 'smart', anchor_side: 'center', attach_side: 'right' }),
    makeLine('line_2', [203, 600], [546.5625, 204.13746630727763], { route: 'smart', anchor_side: 'right', attach_side: 'center', route_channels: ['channel_north'] }),
    makeLine('line_3', [203, 660], [974.53125, 247.43935309973045], { route: 'smart', anchor_side: 'right', attach_side: 'center', route_channels: ['channel_north'] }),
  ];
  return runDiscoveryLoop(router, lines);
}

test('line_2 and line_3 both route without a zigzag/backtrack once bundled into a shared force channel', () => {
  const { results } = runScenario();
  for (const [id, result] of results) {
    assert.equal(findIllegalReversal(result.pts), null, `${id} reversed: ${JSON.stringify(result.pts)}`);
    assert.equal(findDiagonalSegment(result.pts), null, `${id} has a diagonal segment: ${JSON.stringify(result.pts)}`);
  }
  // The reported symptom's own clearest signature: line_2's bend count
  // exploding to 9 (from a clean 1-2) once line_3 joined the same channel —
  // and, after the mate-only guard's own follow-up fix, a residual small
  // loop toward line_1 (an unrelated, non-mate line) keeping it inflated.
  const line2 = results.get('line_2');
  assert.equal(line2.meta.bends, 2, `expected line_2 back at its clean baseline, got ${line2.meta.bends}: ${JSON.stringify(line2.pts)}`);
});

test('line_2 does not loop toward an unrelated, non-mate line (line_1) either', () => {
  // The exact follow-up bug: line_1 never references channel_north at all,
  // so the FIRST (mate-scoped) version of this guard didn't cover it — its
  // own registered segment (a real y=540 row) aliased with line_2's taper
  // candidate (y=532) via the exact same grid-quantization mechanism,
  // producing a small but real "loop" in the rendered route (an extra jog
  // up to y=532 and back, visible as 4 extra bends over the clean 2-bend
  // shape). A clean route stays on its own y=600 approach row the whole way
  // to the corridor entry — this is the same signature asserted above,
  // isolated here specifically against the non-mate case.
  const { results } = runScenario();
  const line2 = results.get('line_2');
  const line1 = results.get('line_1');
  assert.equal(countRenderedCrossings(line2.pts, line1.pts), 0);
  assert.equal(line2.meta.bends, 2, `expected no residual loop toward line_1, got: ${JSON.stringify(line2.pts)}`);
});

test('line_2 and line_3 never cross each other', () => {
  const { results } = runScenario();
  const crossings = countRenderedCrossings(results.get('line_2').pts, results.get('line_3').pts);
  assert.equal(crossings, 0, `expected no crossings, got ${crossings}`);
});

test('line_3 does not loop when the channel bounds fall short of its own anchor row (corridorOffset-saturation alias)', () => {
  // The third reported config, verbatim: a wider/shorter channel_north
  // whose own y2 (623.75) sits well above line_3's anchor row (660) —
  // forcing a real, non-taper entry-boundary clamp whose corridorOffset
  // still saturates and risks the same alias.
  const router = makeRouter({
    grid_resolution: 60, trunk_line_spacing: 8, turn_penalty: 2,
    channels: { channel_north: { bounds: [536.56, 162.73, 50, 461.02], mode: 'force', direction: 'vertical', line_spacing: 16 } }
  }, {}, [0, 0, 990, 765]);
  router.setOverlays([
    { id: 'control_1', _raw: { obstacle: true, position: [278.81, 115.32], size: [112, 73], attachment: 'left' } },
    { id: 'control_2', _raw: { obstacle: true, position: [120, 540], size: [166, 50], attachment: 'center' } },
    { id: 'control_3', _raw: { obstacle: true, position: [120, 600], size: [166, 50], attachment: 'center' } },
    { id: 'control_4', _raw: { obstacle: true, position: [120, 660], size: [166, 50], attachment: 'center' } },
  ]);
  const lines = [
    makeLine('line_1', [334.81, 115.32], [219, 540], { route: 'smart', anchor_side: 'center', attach_side: 'right' }),
    makeLine('line_2', [203, 600], [546.5625, 204.13746630727763], { route: 'smart', anchor_side: 'right', attach_side: 'center', route_channels: ['channel_north'] }),
    makeLine('line_3', [203, 660], [974.53125, 247.43935309973045], { route: 'smart', anchor_side: 'right', attach_side: 'center', route_channels: ['channel_north'] }),
  ];
  const { results } = runDiscoveryLoop(router, lines);
  const line3 = results.get('line_3');
  assert.equal(findIllegalReversal(line3.pts), null);
  assert.equal(findDiagonalSegment(line3.pts), null);
  assert.equal(line3.meta.bends, 2, `expected a direct route with no loop, got: ${JSON.stringify(line3.pts)}`);
});

test('minimal 2-line isolation of the exact alias mechanism (no discovery loop needed)', () => {
  const router = makeRouter({
    grid_resolution: 60, trunk_line_spacing: 8, turn_penalty: 2,
    channels: { channel_north: { bounds: [536.5625, 204.13746630727763, 20, 456], mode: 'force', direction: 'vertical', line_spacing: 16 } }
  }, {}, [0, 0, 990, 765]);
  const line2 = makeLine('line_2', [203, 600], [546.5625, 204.13746630727763], {
    route: 'smart', anchor_side: 'right', attach_side: 'center', route_channels: ['channel_north']
  });
  const r2 = router.computePath(router.buildRouteRequest(line2, line2.a, line2.b));
  assert.equal(r2.meta.bends, 1, `line_2 alone (laneCount=1, no taper) should stay clean, got: ${JSON.stringify(r2.pts)}`);

  const line3 = makeLine('line_3', [203, 660], [974.53125, 247.43935309973045], {
    route: 'smart', anchor_side: 'right', attach_side: 'center', route_channels: ['channel_north']
  });
  const r3 = router.computePath(router.buildRouteRequest(line3, line3.a, line3.b));
  assert.equal(findIllegalReversal(r3.pts), null);
  assert.equal(findDiagonalSegment(r3.pts), null);
  assert.ok(r3.meta.bends <= 3, `expected line_3's leg to avoid the grid-alias detour once line_2 is registered, got bends=${r3.meta.bends}: ${JSON.stringify(r3.pts)}`);
});
