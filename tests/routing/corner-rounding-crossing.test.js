/**
 * Corner rounding (_applyCornerRounding) is applied as a separate, LATER
 * step after a route's shape is fully decided — and, until fixed here, had
 * zero awareness of any other line's geometry. Reported live in HA (real
 * config, reproduced verbatim here, same config used by
 * multi-trunk-choice.test.js for the routing-decision side of this same
 * story). Two layered fixes, in the order they were found:
 *
 * 1. line_3's straight polyline only GRAZED line_1's own corner at a single
 *    boundary point (not a real crossing — confirmed separately via the raw
 *    pts). But line_3's own corner right there had already been clamped
 *    down to a tiny radius (its two turns were packed close together, a
 *    short corridor-approach nudge near where it joined line_1's trunk),
 *    and line_1's own nearby corner was ALSO fairly tight — rounding on
 *    both sides, independently and with no knowledge of each other, bulged
 *    into the same small patch of space, producing a crossing that did not
 *    exist in the underlying route at all. Fixed by clamping each corner's
 *    radius against `_distanceToNearestOtherLineSegment` — the shortest
 *    distance from the corner point to any OTHER line's registered path.
 *    Proven safe for the overwhelmingly common orthogonal-corner case:
 *    every point on a 90° fillet arc stays within Euclidean distance `r` of
 *    the original sharp corner point (the fillet's own tangent points sit
 *    exactly `r` away along each leg, and the arc — the 90° sweep nearest
 *    the corner — only ever gets closer to the corner from there, never
 *    farther), so clamping `r` below that distance guarantees the arc
 *    can't reach the other line's path. This alone dropped the rendered
 *    crossing count from 2 to 1 (one remained: line_1 dipping into its own
 *    control, directly in line_3's path east of it — believed at the time
 *    to be geometrically unavoidable).
 *
 * 2. That belief was wrong. User feedback ("it should just travel east in
 *    the south track of the trunk, south of line_1") led to finding the
 *    REAL cause of the "unavoidable" crossing: `_mergeOrRegisterTrunk`'s
 *    natural-side heuristic averaged a line's raw ANCHOR and raw ATTACH
 *    point against the trunk centerline to decide which lane side to join
 *    on — for line_3, anchor y=700 (south of the trunk) but a destination
 *    far to the north pulled the average north, assigning a north-side
 *    lane despite the line clearly departing from the south. Riding the
 *    north side put line_3 directly through line_1's own dip into its
 *    control. Fixed (see lane-assignment.test.js) to use whichever raw
 *    endpoint is closer, on the flow axis, to the SPECIFIC run being
 *    registered, rather than an average dominated by a possibly-distant
 *    endpoint. Riding the correct (south) side clears line_1's dip
 *    entirely — the crossing was never actually unavoidable, just a
 *    downstream symptom of the same lane-side bug. Crossing count: 2 -> 1
 *    -> 0.
 *
 * Both confirmed via a flattened-arc intersection check (this file's own
 * tooling, `flattenSvgPath` + `countRenderedCrossings` in the shared
 * harness) — never hand-traced.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { makeRouter, makeLine, runDiscoveryLoop, flattenSvgPath, countRenderedCrossings } from './helpers/router-harness.js';

function runScenario() {
  const router = makeRouter({ grid_resolution: undefined, trunk_line_spacing: 8 }, {}, [0, 0, 990, 765]);
  router.config.grid_resolution = undefined;
  router.setOverlays([
    { id: 'control_1', _raw: { obstacle: true, position: [767.94, 588.91], size: [112, 73], attachment: 'left' } },
    { id: 'control_2', _raw: { obstacle: true, position: [100, 600], size: [166, 50], attachment: 'center' } },
    { id: 'control_3', _raw: { obstacle: true, position: [100, 650], size: [166, 50], attachment: 'center' } },
    { id: 'control_4', _raw: { obstacle: true, position: [100, 700], size: [166, 50], attachment: 'center' } },
  ]);
  const cornerCfg = { corner_radius: 34, corner_style: 'round' };
  const lines = [
    makeLine('line_1', [823.94, 625.41], [183, 600], { route: 'smart', anchor_side: 'bottom', attach_side: 'right', ...cornerCfg }),
    makeLine('line_2', [183, 650], [546.5625, 204.13746630727763], { route: 'smart', anchor_side: 'right', attach_side: 'center', ...cornerCfg }),
    makeLine('line_3', [183, 700], [974.53125, 247.43935309973045], { route: 'smart', anchor_side: 'right', attach_side: 'center', ...cornerCfg }),
  ];
  return runDiscoveryLoop(router, lines);
}

test('rendered (rounded) paths have zero crossings between any pair of lines', () => {
  const { results } = runScenario();
  const flat = new Map([...results].map(([id, r]) => [id, flattenSvgPath(r.d)]));
  assert.equal(countRenderedCrossings(flat.get('line_3'), flat.get('line_1')), 0,
    'line_3 riding the correct (south) side of line_1\'s trunk should clear line_1\'s own dip into its control entirely — any crossing here means either the lane-side fix or the corner-rounding clamp regressed');
  assert.equal(countRenderedCrossings(flat.get('line_3'), flat.get('line_2')), 0,
    'line_3 should never cross line_2 at all once rendered');
  assert.equal(countRenderedCrossings(flat.get('line_1'), flat.get('line_2')), 0);
});

test('the corner-rounding clamp still trims a radius that would bulge into another line, but far less conservatively than raw point-distance', () => {
  // With the natural-side fix, line_1 and line_3 end up cleanly separated
  // (8px apart, no crossing) rather than overlapping. line_1's own corner
  // near the shared trunk-join area curves AWAY from line_3 (north, while
  // line_3 sits south) — the direction-aware clamp (fillet center, not raw
  // corner-point distance) correctly recognizes the swept arc's own real
  // position never gets remotely close to line_3, and grants most of the
  // requested 34px radius; only the adjacent-corner-competition logic
  // (this line's own tight S-curve into control_2, unrelated to the
  // other-line clamp) trims it further. The old, cruder point-distance
  // clamp forced this down to ~7 regardless of sweep direction — asserting
  // a substantially larger radius here is what actually distinguishes the
  // two implementations.
  const { results } = runScenario();
  const line1 = results.get('line_1');
  const match = line1.d.match(/A([\d.]+),\1 0 0 1 246\.75,/);
  assert.ok(match, `expected to find the corner arc landing at x=246.75, got: ${line1.d}`);
  const radius = Number(match[1]);
  assert.ok(radius > 15, `expected a radius well above the old ~7 clamp (direction-aware clamp should grant much more room), got ${radius}`);
});

test('corner radius is clamped, never negative, when another line runs close by', () => {
  // Direct unit check on the underlying clamp, independent of the full
  // discovery-loop config above: a corner sitting essentially on top of
  // another line's registered segment must round down toward (but never
  // past) zero, not error or produce a negative/undefined radius.
  const router = makeRouter({ trunk_line_spacing: 8 });
  router._registerLineSegments('line_a', [[0, 100], [200, 100]], [0, 100], [200, 100]);
  const p = [50, 100]; // sits exactly ON line_a's own registered segment
  const clearance = router._distanceToNearestOtherLineSegment(p, 'line_b');
  assert.equal(clearance, 0, 'a point exactly on another line\'s segment has zero clearance');
  const farPoint = [50, 500];
  const farClearance = router._distanceToNearestOtherLineSegment(farPoint, 'line_b');
  assert.equal(farClearance, 400);
  // Self-exclusion: the same line's own segment must never be measured
  // against itself.
  const selfClearance = router._distanceToNearestOtherLineSegment(p, 'line_a');
  assert.equal(selfClearance, Infinity);
});
