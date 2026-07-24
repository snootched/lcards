/**
 * _trunkLaneAssignment purity (ROUTING_ENGINE_BRIEF.md §8 Q1/Q2):
 * lane index/offset must be a pure function of the corridor's CURRENT
 * member set — identical membership must yield identical assignments no
 * matter the order lines joined in, and a discovered trunk's creator must
 * always hold the centerline.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { makeRouter } from './helpers/router-harness.js';

/** Builds a router with one discovered trunk (creator's 450px run at y=100). */
function routerWithTrunk() {
  const router = makeRouter({ trunk_line_spacing: 8 });
  router._registerLineSegments('line_creator', [[50, 100], [500, 100]]);
  return { router, trunk: router._trunks[0] };
}

test('discovered trunk: creator holds the centerline, joiners alternate sides', () => {
  const { router, trunk } = routerWithTrunk();
  router._registerLineSegments('line_b', [[50, 108], [500, 108]]);
  router._registerLineSegments('line_c', [[50, 92], [500, 92]]);

  assert.deepEqual(router._trunkLaneAssignment(trunk, 'line_creator'),
    { laneIndex: 0, laneCount: 3, offset: 0 });
  assert.deepEqual(router._trunkLaneAssignment(trunk, 'line_b'),
    { laneIndex: 1, laneCount: 3, offset: 8 });
  assert.deepEqual(router._trunkLaneAssignment(trunk, 'line_c'),
    { laneIndex: 2, laneCount: 3, offset: -8 });
});

test('assignments depend on the member set, not the join order', () => {
  const a = routerWithTrunk();
  a.router._registerLineSegments('line_b', [[50, 108], [500, 108]]);
  a.router._registerLineSegments('line_c', [[50, 92], [500, 92]]);

  const b = routerWithTrunk();
  b.router._registerLineSegments('line_c', [[50, 92], [500, 92]]);
  b.router._registerLineSegments('line_b', [[50, 108], [500, 108]]);

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
  router._registerLineSegments('line_b', [[50, 108], [500, 108]]);
  const after = router._trunkLaneAssignment(trunk, 'line_b');
  assert.deepEqual(after, before, 'joining must not change the already-computed lane');
});

test('a member leaving frees its lane for recomputation', () => {
  const { router, trunk } = routerWithTrunk();
  router._registerLineSegments('line_b', [[50, 108], [500, 108]]);
  router._registerLineSegments('line_c', [[50, 92], [500, 92]]);
  assert.equal(router._trunkLaneAssignment(trunk, 'line_c').offset, -8);

  // line_b's shape moves away from the trunk entirely -> its membership is
  // dropped by the registration diff, and line_c inherits the first lane.
  const vBefore = router._registryVersion;
  router._registerLineSegments('line_b', [[50, 250], [500, 250]]);
  assert.ok(router._registryVersion > vBefore, 'membership change must bump the registry version');
  assert.deepEqual(router._trunkLaneAssignment(trunk, 'line_c'),
    { laneIndex: 1, laneCount: 2, offset: 8 });
});
