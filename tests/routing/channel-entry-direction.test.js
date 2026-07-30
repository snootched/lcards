/**
 * Reported live: a line chained through a single `mode: prefer` channel via
 * `route_channels` rendered a same-axis reversal right at the channel's own
 * entry boundary — the approach leg overshot PAST the entry coordinate and
 * into the channel's own bounds, then had to arrive at the entry point
 * moving BACKWARD against the channel's configured flow direction.
 *
 * Only reproduces through the FULL multi-pass discovery loop (`runDiscoveryLoop`,
 * matching the reported 3-line/4-control config) — a single isolated
 * `computePath` call for the channel-using line alone, even with the same
 * obstacles registered, does not trigger it. Not yet root-caused exactly
 * which cross-line interaction tips the grid search into the buggy shape
 * (plausibly some combination of crossing-cost bias from the other two
 * lines' own registered runs), but the fix itself is verified correct and
 * general below regardless of the trigger's exact mechanics.
 *
 * Root cause, confirmed via direct leg-level instrumentation: the A* search
 * loop's hard block for a 'channel_axis'-sourced hint (both first-move
 * departure and last-move arrival) only ever enforced the required AXIS
 * (`isHorizontalMove !== req._channelAxisHorizontalLast` — must be
 * horizontal, say) — never the specific DIRECTION along that axis, even
 * though a `continuationDir` (e.g. "must arrive moving rightward, not
 * leftward") is available on the request whenever the corridor's own flow
 * direction is already known (`req._continuationDirLast`/`First`). An
 * axis-only block lets the search arrive at (or depart from) the goal via
 * EITHER direction along that axis, including the exact reverse of the
 * corridor's real flow.
 *
 * That gap alone wouldn't necessarily bite — nothing makes an
 * overshoot-then-backtrack shape actively CHEAPER on its own. But
 * `_buildChannelCostGrid`'s per-cell 'prefer' discount applies to any leg
 * carrying the channel in `req.channels` (the line's own `route_channels`),
 * not just the leg specifically designated as the official crossing — so
 * the APPROACH leg (still technically "outside" the channel) already gets
 * rewarded for cells inside the channel's own bounds, making it look
 * artificially cheap to wander in early and correct course after, rather
 * than approach the entry boundary directly. (This broader channel-bias
 * scoping is a separate, known architectural characteristic — not narrowed
 * by this fix, which only closes the direction-enforcement gap that let
 * the resulting shape render as an actual reversal instead of just a
 * mildly early turn.)
 *
 * Fixed by adding the same "block only the exact reversal of a known
 * continuation direction" check already used elsewhere in this file for
 * the degenerate-axis case, to the NON-degenerate case too, on both the
 * first-move and last-move sides.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { makeRouter, makeLine, runDiscoveryLoop, findIllegalReversal, findDiagonalSegment } from './helpers/router-harness.js';

// The reported config verbatim: control_1-4 positions, all 3 lines, and the
// 'prefer' channel line_3 chains through via route_channels — the channel's
// entry boundary sits at a different y than line_3's own anchor row,
// forcing the approach leg to travel in both x and y before arriving at
// the entry moving along the channel's own flow direction (left-to-right).
function runScenario() {
  const router = makeRouter({
    grid_resolution: 60,
    trunk_line_spacing: 8,
    channels: { channel_1: { bounds: [606.86, 531.04, 302.8, 99.65], mode: 'prefer', direction: 'auto', weight: 0.5, line_spacing: 8, discoverable: false } }
  }, {}, [0, 0, 990, 765]);
  router.setOverlays([
    { id: 'control_1', _raw: { obstacle: true, position: [278.81, 115.32], size: [112, 73], attachment: 'left' } },
    { id: 'control_2', _raw: { obstacle: true, position: [120, 540], size: [166, 50], attachment: 'center' } },
    { id: 'control_3', _raw: { obstacle: true, position: [120, 600], size: [166, 50], attachment: 'center' } },
    { id: 'control_4', _raw: { obstacle: true, position: [120, 660], size: [166, 50], attachment: 'center' } },
  ]);
  const lines = [
    makeLine('line_1', [334.81, 115.32], [219, 540], { route: 'smart', anchor_side: 'center', attach_side: 'right' }),
    makeLine('line_2', [203, 600], [546.5625, 204.13746630727763], { route: 'smart', anchor_side: 'right', attach_side: 'center' }),
    makeLine('line_3', [203, 660], [974.53125, 247.43935309973045], { route: 'smart', anchor_side: 'right', attach_side: 'center', route_channels: ['channel_1'] }),
  ];
  return runDiscoveryLoop(router, lines);
}

test('line_3 never reverses at the channel entry boundary, in the full reported multi-line scenario', () => {
  const { results } = runScenario();
  for (const [id, result] of results) {
    assert.equal(findIllegalReversal(result.pts), null, `${id} reversed: ${JSON.stringify(result.pts)}`);
    assert.equal(findDiagonalSegment(result.pts), null, `${id} has a diagonal segment: ${JSON.stringify(result.pts)}`);
  }
});

test('a line chaining through a single prefer channel in isolation arrives at the entry moving along the channel\'s own flow direction', () => {
  // A simpler, direct unit-level confirmation of the actual fix (the
  // multi-line scenario above is the faithful regression reproduction, but
  // doesn't by itself prove the corridor-arrival direction is correct when
  // it IS chosen — construct a case where entry/exit require crossing a
  // real flow-axis distance so a wrong-direction arrival would be visible).
  const router = makeRouter({
    grid_resolution: 60, trunk_line_spacing: 8,
    channels: { channel_1: { bounds: [606.86, 531.04, 302.8, 99.65], mode: 'prefer', direction: 'auto', weight: 0.5, line_spacing: 8, discoverable: false } }
  }, {}, [0, 0, 990, 765]);
  const line = makeLine('line_3', [203, 660], [974.53125, 247.43935309973045], {
    route: 'smart', anchor_side: 'right', attach_side: 'center', route_channels: ['channel_1']
  });
  const r = router.computePath(router.buildRouteRequest(line, line.a, line.b));
  assert.equal(r.meta.strategy, 'corridor-routed', `expected the channel to win the cost comparison in isolation, got strategy=${r.meta.strategy}`);
  assert.equal(r.meta.chainChannels?.[0]?.id, 'channel_1');
  assert.equal(findIllegalReversal(r.pts), null);
  // Every point along the through-channel run (the channel's own true
  // center row) must move monotonically in one direction — no backtrack.
  const throughRun = r.pts.filter(p => p[1] === r.pts[r.pts.length - 3][1]);
  const xs = throughRun.map(p => p[0]);
  assert.deepEqual(xs, [...xs].sort((a, b) => a - b), `expected monotonically increasing x along the channel row, got ${JSON.stringify(xs)}`);
});
