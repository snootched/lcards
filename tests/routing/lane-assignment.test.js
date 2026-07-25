/**
 * _trunkLaneAssignment purity (ROUTING_ENGINE_BRIEF.md §8 Q1/Q2):
 * lane index/offset must be a pure function of the corridor's CURRENT
 * member set, and a discovered trunk's creator must always hold the
 * centerline.
 *
 * Since the geometry-aware natural-side fix, offset SIGN is additionally a
 * pure function of each member's own recorded natural side (which side of
 * the trunk's centerline that member's own true, un-bundled endpoints
 * lean toward — see _mergeOrRegisterTrunk) rather than blind lineId
 * alternation — so a joiner's offset sign no longer flips just because a
 * DIFFERENT, unrelated member joins or leaves (see the last test below,
 * updated from the old alternating scheme's behavior). Raw endpoints are
 * passed to _registerLineSegments below purely to give each test line a
 * real natural side to record — production code always provides these
 * (computePath passes req.a/req.b); most test lines below are already
 * straight with matching raw endpoint cross-coordinates (no bundling
 * offset applied at this direct-registration level), so which raw
 * endpoint the side calculation picks doesn't matter for them — EXCEPT the
 * last test in this file, which specifically exercises a case where it
 * does (see its own comment).
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { makeRouter } from './helpers/router-harness.js';

/** Builds a router with one discovered trunk (creator's 450px run at y=100). */
function routerWithTrunk() {
  const router = makeRouter({ trunk_line_spacing: 8 });
  router._registerLineSegments('line_creator', [[50, 100], [500, 100]], [50, 100], [500, 100]);
  return { router, trunk: router._trunks[0] };
}

test('discovered trunk: creator holds the centerline, joiners grouped by natural side', () => {
  const { router, trunk } = routerWithTrunk();
  // y=108 is south (positive) of the y=100 centerline; y=92 is north
  // (negative) — each line's own raw endpoints, unchanged by bundling.
  router._registerLineSegments('line_b', [[50, 108], [500, 108]], [50, 108], [500, 108]);
  router._registerLineSegments('line_c', [[50, 92], [500, 92]], [50, 92], [500, 92]);

  assert.deepEqual(router._trunkLaneAssignment(trunk, 'line_creator'),
    { laneIndex: 0, laneCount: 3, offset: 0 });
  // laneIndex ordering is negative-side group first, then positive-side —
  // an implementation detail (any distinct positive integer per line
  // satisfies _pushBundledApproachLegs's contract); offset sign/magnitude
  // is the behavioral guarantee under test.
  assert.deepEqual(router._trunkLaneAssignment(trunk, 'line_b'),
    { laneIndex: 2, laneCount: 3, offset: 8 });
  assert.deepEqual(router._trunkLaneAssignment(trunk, 'line_c'),
    { laneIndex: 1, laneCount: 3, offset: -8 });
});

test('assignments depend on the member set, not the join order', () => {
  const a = routerWithTrunk();
  a.router._registerLineSegments('line_b', [[50, 108], [500, 108]], [50, 108], [500, 108]);
  a.router._registerLineSegments('line_c', [[50, 92], [500, 92]], [50, 92], [500, 92]);

  const b = routerWithTrunk();
  b.router._registerLineSegments('line_c', [[50, 92], [500, 92]], [50, 92], [500, 92]);
  b.router._registerLineSegments('line_b', [[50, 108], [500, 108]], [50, 108], [500, 108]);

  for (const id of ['line_creator', 'line_b', 'line_c']) {
    assert.deepEqual(
      b.router._trunkLaneAssignment(b.trunk, id),
      a.router._trunkLaneAssignment(a.trunk, id),
      `${id}: assignment must not depend on join order`
    );
  }
});

test('a prospective joiner (not yet a member) gets the lane it will hold after joining', () => {
  const { router, trunk } = routerWithTrunk();
  const before = router._trunkLaneAssignment(trunk, 'line_b');
  router._registerLineSegments('line_b', [[50, 108], [500, 108]], [50, 108], [500, 108]);
  const after = router._trunkLaneAssignment(trunk, 'line_b');
  assert.deepEqual(after, before, 'joining must not change the already-computed lane');
});

test('geometry wins over lexicographic order when the two disagree', () => {
  // line_a sorts FIRST lexicographically but leans NEGATIVE (y=92, north of
  // the y=100 centerline); line_z sorts LAST but leans POSITIVE (y=108,
  // south). The old lineId-alternation scheme would have put line_a
  // (index 0) on the positive side and line_z (index 1) on the negative
  // side — exactly backwards relative to where each line's own real
  // destination sits. This is precisely the shape of the reported bug:
  // two lines landed on opposite sides of a shared trunk purely because
  // of their ids, producing an avoidable crossing.
  const { router, trunk } = routerWithTrunk();
  router._registerLineSegments('line_a', [[50, 92], [500, 92]], [50, 92], [500, 92]);
  router._registerLineSegments('line_z', [[50, 108], [500, 108]], [50, 108], [500, 108]);

  assert.equal(router._trunkLaneAssignment(trunk, 'line_a').offset, -8, 'line_a leans north -> negative offset, despite sorting first');
  assert.equal(router._trunkLaneAssignment(trunk, 'line_z').offset, 8, 'line_z leans south -> positive offset, despite sorting last');
});

test('a member leaving frees its lane, but a REMAINING member\'s own offset never flips sign', () => {
  const { router, trunk } = routerWithTrunk();
  router._registerLineSegments('line_b', [[50, 108], [500, 108]], [50, 108], [500, 108]);
  router._registerLineSegments('line_c', [[50, 92], [500, 92]], [50, 92], [500, 92]);
  assert.equal(router._trunkLaneAssignment(trunk, 'line_c').offset, -8);

  // line_b's shape moves away from the trunk entirely -> its membership is
  // dropped by the registration diff, and line_c inherits the first lane
  // in its OWN (negative) side group. Under the old lineId-alternation
  // scheme this flipped line_c's offset sign (+8) purely because its
  // index in a shrunk lexicographic list changed — an arbitrary
  // consequence of a DIFFERENT line leaving, not of line_c's own geometry.
  // The natural-side fix makes offset sign a pure function of line_c's own
  // unchanged endpoints: it must stay -8.
  const vBefore = router._registryVersion;
  router._registerLineSegments('line_b', [[50, 250], [500, 250]], [50, 250], [500, 250]);
  assert.ok(router._registryVersion > vBefore, 'membership change must bump the registry version');
  assert.deepEqual(router._trunkLaneAssignment(trunk, 'line_c'),
    { laneIndex: 1, laneCount: 2, offset: -8 });
});

test('natural side uses whichever raw endpoint is flow-closer to the run, not the average of both', () => {
  // Reported live in HA: a line whose ANCHOR sat clearly south of a trunk
  // it joined right after departing got assigned a NORTH-side lane instead
  // — _mergeOrRegisterTrunk used to average rawA/rawB's cross-axis
  // coordinates against the trunk centerline, and this line's own
  // DESTINATION lay far enough north to drag the average across the
  // centerline, even though the run being registered has nothing to do
  // with the destination yet (it's the line's very first run, right next
  // to its anchor). Riding the wrong side put the line directly through
  // another line's own geometry that the correct (anchor-side) lane would
  // have cleared entirely.
  //
  // horizontal trunk at y=100 (creator's own run, x:50-500 as usual).
  // line_d's registered run sits at x:50-58 (right next to its own raw
  // anchor at x=50) — clearly the run near the ANCHOR end, not the attach
  // end (raw attach sits all the way out at x=900). Anchor y=108 (south of
  // the trunk); attach y=50 (north of the trunk) — a real disagreement
  // between the two raw endpoints, unlike every fixture above.
  const { router, trunk } = routerWithTrunk();
  router._registerLineSegments('line_d', [[50, 108], [58, 108]], [50, 108], [900, 50]);
  assert.equal(router._trunkLaneAssignment(trunk, 'line_d').offset, 8,
    'a run right next to the south-leaning anchor must use the anchor\'s own side, not an average dragged north by a distant destination');
});
