/**
 * Two compounding gaps, both found via the same real, live-HA-reported
 * config (reproduced verbatim below as `runScenario`), fixed together:
 *
 * 1. computePath's corridor-candidate comparison tried exactly one thing
 *    when 2+ trunks were discovered for a line: the full union of every
 *    discovered trunk, chained together in proximity order
 *    (_mergeCorridors). There was no comparison against joining just the
 *    single best trunk alone — so when two trunks each independently
 *    passed discovery's proximity/overlap gates without actually being on
 *    the same natural path, the line was forced through BOTH.
 *
 *    Fix: computePath now also tries each discovered trunk as its own solo
 *    candidate (when 2+ are discovered), alongside the existing full-union
 *    candidate, and compares real cost. Tried regardless of a trunk's
 *    `_isMember` status — membership only records that a line's rendered
 *    path happened to land near a trunk's centerline AFTER the fact
 *    (_mergeOrRegisterTrunk's proximity match), not that the router
 *    deliberately, cost-vetted joined it; confirmed in the field to arrive
 *    before a second trunk is even discovered, so an _isMember-based
 *    exclusion never actually triggers for this exact config. A genuinely
 *    necessary multi-leg chain is unaffected: trying one of its trunks
 *    alone just produces a costlier, incomplete route that the comparison
 *    naturally rejects in favor of the full chain.
 *
 * 2. Even with (1) fixed, the FIRST round of this fix still picked the
 *    wrong solo trunk: a candidate's reported `meta.cost` (distance+bends+
 *    corridor discount) never included how many OTHER lines' own paths it
 *    crosses — `_buildCrossingCostGrid`'s per-cell bias only ever steers an
 *    individual leg's shape DURING the A* search when there's room to
 *    maneuver; a corridor "ride this trunk" leg's endpoints are fixed by
 *    the trunk itself, so a genuine crossing is often unavoidable for that
 *    candidate's shape, and — separately — that search-time cost was never
 *    carried into the final `meta.cost` used to compare WHOLE CANDIDATE
 *    ROUTES against each other anyway. Confirmed: a solo-trunk candidate
 *    with 2 real crossings beat a same-length alternative with only 1,
 *    purely because crossings weren't part of either compared cost.
 *
 *    Fix: new `_segmentCrossingPenalty(pts, lineId)` counts real geometric
 *    crossings against every other line's registered path, weighted by its
 *    own `cost_defaults.crossing` (default 50 — deliberately NOT reusing
 *    `crossing_avoid_bias`, which is tuned for steering an in-progress
 *    search, not for separating two finished candidates). computePath's
 *    corridor/plain comparison now ranks candidates by `meta.cost +
 *    _segmentCrossingPenalty(...)`, not `meta.cost` alone. meta.cost itself
 *    is left unmodified on the returned result — the penalty is a
 *    comparison-time tiebreaker only.
 *
 * Correct final answer for the reported config, verified below: line_3
 * rides trunk:line_1:1 alone, end-to-end, turning north once at the very
 * end — matching the user's own expectation ("remain southmost the whole
 * horizontal run and trunk with line_1 for the east-west length").
 *
 * That last phrase — "southmost" — pointed at a THIRD bug, fixed
 * separately (see lane-assignment.test.js and corner-rounding-crossing.test.js's
 * own updated docblock for the full story): line_3 initially rode the
 * NORTH side of line_1's trunk, not the south, because
 * _mergeOrRegisterTrunk's natural-side heuristic averaged the line's raw
 * anchor AND attach point against the trunk centerline — line_3's anchor
 * (y=700) is south of the trunk, but its destination lies far enough north
 * that the average crossed to the north side anyway. Riding the north side
 * put line_3 directly through line_1's own dip into its control (believed
 * at the time, incorrectly, to be a geometrically unavoidable crossing).
 * Fixed to use whichever raw endpoint is closer, on the flow axis, to the
 * specific run being registered, instead of an average a distant endpoint
 * can dominate. Riding the correct (south) side clears line_1's dip
 * entirely: zero crossings, not one.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { makeRouter, makeLine, runDiscoveryLoop, findIllegalReversal } from './helpers/router-harness.js';

function runScenario() {
  const router = makeRouter({ grid_resolution: undefined, trunk_line_spacing: 8 }, {}, [0, 0, 990, 765]);
  router.config.grid_resolution = undefined; // exercise the real scalable default, matching the field report
  router.setOverlays([
    { id: 'control_1', _raw: { obstacle: true, position: [767.94, 588.91], size: [112, 73], attachment: 'left' } },
    { id: 'control_2', _raw: { obstacle: true, position: [100, 600], size: [166, 50], attachment: 'center' } },
    { id: 'control_3', _raw: { obstacle: true, position: [100, 650], size: [166, 50], attachment: 'center' } },
    { id: 'control_4', _raw: { obstacle: true, position: [100, 700], size: [166, 50], attachment: 'center' } },
  ]);
  const lines = [
    makeLine('line_1', [823.94, 625.41], [183, 600], { route: 'smart', anchor_side: 'bottom', attach_side: 'right' }),
    makeLine('line_2', [183, 650], [546.5625, 204.13746630727763], { route: 'smart', anchor_side: 'right', attach_side: 'center' }),
    makeLine('line_3', [183, 700], [974.53125, 247.43935309973045], { route: 'smart', anchor_side: 'right', attach_side: 'center' }),
  ];
  return runDiscoveryLoop(router, lines);
}

// Perpendicular-only crossing counter (parallel/collinear runs are never a
// "crossing" — mirrors _segmentCrossingPenalty's own predicate) for
// asserting against the FINAL rendered polylines directly, independent of
// RouterCore's internal `_crossings` registry shape.
function countCrossings(pts, otherPts) {
  const crosses = (a1, a2, b1, b2) => {
    const aVert = a1[0] === a2[0];
    const bVert = b1[0] === b2[0];
    if (aVert === bVert) return false;
    const vert = aVert ? { p1: a1, p2: a2 } : { p1: b1, p2: b2 };
    const horiz = aVert ? { p1: b1, p2: b2 } : { p1: a1, p2: a2 };
    const x = vert.p1[0], y = horiz.p1[1];
    const vy1 = Math.min(vert.p1[1], vert.p2[1]), vy2 = Math.max(vert.p1[1], vert.p2[1]);
    const hx1 = Math.min(horiz.p1[0], horiz.p2[0]), hx2 = Math.max(horiz.p1[0], horiz.p2[0]);
    return x > hx1 && x < hx2 && y > vy1 && y < vy2;
  };
  let count = 0;
  for (let i = 1; i < pts.length; i++) {
    for (let j = 1; j < otherPts.length; j++) {
      if (crosses(pts[i - 1], pts[i], otherPts[j - 1], otherPts[j])) count++;
    }
  }
  return count;
}

test('a line never chains through 2+ discovered trunks when a single one alone is cheaper', () => {
  const { results } = runScenario();
  const line3 = results.get('line_3');
  assert.equal(line3.meta.chainChannels?.length, 1,
    `line_3 should ride exactly one trunk end-to-end, not chain through ${line3.meta.chainChannels?.length}: ${JSON.stringify(line3.meta.chainChannels)}`);
});

test('the crossing count, not just distance/bends/corridor-discount, decides which trunk to join', () => {
  const { results } = runScenario();
  const line3 = results.get('line_3');
  assert.equal(line3.meta.chainChannels[0].id, 'trunk:line_1:1',
    `line_3 should join line_1's trunk (runs its full east-west span) over line_2's (a shorter, worse-aligned trunk that would need a second trunk switch and 2 crossings): got ${JSON.stringify(line3.meta.chainChannels)}`);
});

test('the chosen route has no reversal and zero crossings with either other line', () => {
  const { results } = runScenario();
  const line1 = results.get('line_1').pts;
  const line2 = results.get('line_2').pts;
  const line3 = results.get('line_3');
  assert.equal(findIllegalReversal(line3.pts), null);
  assert.equal(countCrossings(line3.pts, line1), 0,
    `expected zero crossings with line_1 (riding the correct south side of its trunk clears line_1's own dip into its control entirely): ${JSON.stringify(line3.pts)}`);
  assert.equal(countCrossings(line3.pts, line2), 0,
    `expected zero crossings with line_2: ${JSON.stringify(line3.pts)}`);
});

test('the 0-or-1-discovered-trunk case is completely unaffected (single corridor option, same as before this fix)', () => {
  // A minimal 2-line sanity check: with only one trunk ever in play, the
  // new solo-candidate loop must degenerate to exactly the old behavior —
  // no extra candidate, no change in outcome.
  const router = makeRouter({ trunk_line_spacing: 8 });
  const creator = makeLine('line_creator', [50, 100], [500, 100], { route: 'smart' });
  const joiner = makeLine('line_joiner', [50, 108], [500, 108], { route: 'smart' });
  const { results } = runDiscoveryLoop(router, [creator, joiner]);
  const joinerResult = results.get('line_joiner');
  assert.ok(joinerResult.meta.chainChannels?.length <= 1);
});
