/**
 * `corner_room_weight` (RouterCore.js, on by default — DEFAULT_CORNER_ROOM_WEIGHT)
 * extends the existing `_refineSmart` elbow-nudge pass (previously gated
 * solely on `smart_proximity > 0`) with a new scored signal: the sum of
 * `max(0, corner_radius - achievedRadius)` across a candidate's own
 * corners, using a new `_estimateCornerRadii` helper mechanically extracted
 * from `_applyCornerRounding` itself (so refinement scoring and final
 * rendering share one source of truth for "how would this corner round").
 * See `doc/architecture/msd/routing.md`'s "Corner-Radius-Driven Stub
 * Length" section for the full design writeup, including two real,
 * PRE-EXISTING bugs this work surfaced and fixed along the way (both
 * covered here too, not just in the positive-case tests):
 *
 * 1. `_refineSmart`'s elbow-shift candidate generation used to move a
 *    single point — geometrically incapable of preserving orthogonality on
 *    both adjacent legs for a genuine 90° corner, producing an actual
 *    diagonal segment. Reproduces identically with only `smart_proximity`
 *    set and `corner_room_weight: 0` — predates and is independent of this
 *    feature; shipping the new feature on by default is simply the first
 *    thing to exercise the elbow-shift loop broadly enough to make it
 *    visible. Fixed with a proper 2-point geometric repair (shifted corner
 *    + one corrective point) instead of a naive 1-point move.
 * 2. `_computeCorridorRouted`'s leg loop falls back to the never-obstacle-
 *    aware `_computeManhattan` when both `_computeGrid` and its existing
 *    relaxed-hint retry fail — safe historically, but a corridor cursor/
 *    entry point can end up geometrically inside an unrelated obstacle once
 *    corner-room refinement shifts a trunk's own registered position,
 *    which the existing retry (scoped to `anchor_stub`/`attach_stub` hints
 *    only) doesn't cover. Fixed by checking the Manhattan fallback's own
 *    result for obstacle-crossing and rejecting the whole corridor
 *    candidate if so (mirroring the function's own existing entry/exit
 *    `_pointInsideObstacle` check).
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { makeRouter, makeLine, runDiscoveryLoop, findDiagonalSegment, findIllegalReversal, segmentCrossesObstacle } from './helpers/router-harness.js';

function radiiOf(d) {
  return [...d.matchAll(/A([\d.]+),/g)].map(m => Number(m[1]));
}

// A short route:'manhattan' "wall" forces a real, tight S-jog for the
// crossing line — the exact shape corner_room_weight targets (two corners
// close enough together that corner_radius has to shrink to fit). Mirrors
// the scenario used to tune DEFAULT_CORNER_ROOM_WEIGHT itself.
function tightCornerScenario(cornerRoomWeight) {
  const router = makeRouter({ grid_resolution: 20, crossing_avoid_bias: 30, corner_room_weight: cornerRoomWeight }, {}, [0, 0, 400, 220]);
  const wall = makeLine('line_wall', [150, 110], [250, 110], { route: 'manhattan' });
  router.computePath(router.buildRouteRequest(wall, wall.a, wall.b));
  const crosser = makeLine('line_crosser', [200, 190], [200, 30], { route: 'smart', anchor_side: 'bottom', attach_side: 'top', corner_radius: 34 });
  return router.computePath(router.buildRouteRequest(crosser, crosser.a, crosser.b));
}

test('a tight detour renders a squashed corner when corner_room_weight is 0', () => {
  const r = tightCornerScenario(0);
  const radii = radiiOf(r.d);
  assert.ok(Math.min(...radii) < 10, `expected a squashed corner (<10px) with the feature off, got radii=${radii.join(',')}`);
});

test('the same tight detour recovers most of its corner radius at the default weight', () => {
  const r = tightCornerScenario(4); // DEFAULT_CORNER_ROOM_WEIGHT
  const radii = radiiOf(r.d);
  assert.ok(Math.min(...radii) > 10, `expected corner-room refinement to meaningfully improve the squashed corner, got radii=${radii.join(',')}`);
  assert.equal(findDiagonalSegment(r.pts), null);
  assert.equal(findIllegalReversal(r.pts), null);
});

test('corner_radius_mode: forced gets the same interior-corner benefit as auto', () => {
  // Confirmed structurally: _applyCornerRounding (and therefore
  // _estimateCornerRadii) is called unconditionally regardless of
  // cornerRadiusMode — 'forced' only changes the OUTER anchor/attach stub
  // reservation, never anything about an interior corridor corner.
  function scenario(mode, weight) {
    const router = makeRouter({ grid_resolution: 20, crossing_avoid_bias: 30, corner_room_weight: weight }, {}, [0, 0, 400, 220]);
    const wall = makeLine('line_wall', [150, 110], [250, 110], { route: 'manhattan' });
    router.computePath(router.buildRouteRequest(wall, wall.a, wall.b));
    const crosser = makeLine('line_crosser', [200, 190], [200, 30], { route: 'smart', anchor_side: 'bottom', attach_side: 'top', corner_radius: 34, corner_radius_mode: mode });
    return router.computePath(router.buildRouteRequest(crosser, crosser.a, crosser.b));
  }
  const off = radiiOf(scenario('forced', 0).d);
  const on = radiiOf(scenario('forced', 4).d);
  assert.ok(Math.min(...on) > Math.min(...off), `expected forced-mode's own tight interior corner to improve too (off=${off.join(',')}, on=${on.join(',')})`);
});

test('bevel/miter corner_style lines are unaffected by corner_room_weight (gate is load-bearing)', () => {
  function scenario(cornerStyle, weight) {
    const router = makeRouter({ grid_resolution: 20, crossing_avoid_bias: 30, corner_room_weight: weight }, {}, [0, 0, 400, 220]);
    const wall = makeLine('line_wall', [150, 110], [250, 110], { route: 'manhattan' });
    router.computePath(router.buildRouteRequest(wall, wall.a, wall.b));
    const crosser = makeLine('line_crosser', [200, 190], [200, 30], { route: 'smart', anchor_side: 'bottom', attach_side: 'top', corner_radius: 34, corner_style: cornerStyle });
    return router.computePath(router.buildRouteRequest(crosser, crosser.a, crosser.b));
  }
  for (const style of ['bevel', 'miter']) {
    const off = scenario(style, 0);
    const on = scenario(style, 4);
    assert.deepEqual(on.pts, off.pts, `${style}: corner_room_weight must not change routing when the style never renders a round corner (off=${JSON.stringify(off.pts)}, on=${JSON.stringify(on.pts)})`);
  }
});

test('per-line corner_room_weight overrides the card-wide default', () => {
  const router = makeRouter({ grid_resolution: 20, crossing_avoid_bias: 30, corner_room_weight: 0 }, {}, [0, 0, 400, 220]);
  const wall = makeLine('line_wall', [150, 110], [250, 110], { route: 'manhattan' });
  router.computePath(router.buildRouteRequest(wall, wall.a, wall.b));
  // Card-wide is 0 (off), but this line explicitly opts back in.
  const crosser = makeLine('line_crosser', [200, 190], [200, 30], { route: 'smart', anchor_side: 'bottom', attach_side: 'top', corner_radius: 34, corner_room_weight: 4 });
  const r = router.computePath(router.buildRouteRequest(crosser, crosser.a, crosser.b));
  const radii = radiiOf(r.d);
  assert.ok(Math.min(...radii) > 10, `expected the per-line override to win over the card-wide 0, got radii=${radii.join(',')}`);
});

test('corner_room_weight: 0 on a line overrides a nonzero card-wide default (explicit opt-out is respected)', () => {
  const router = makeRouter({ grid_resolution: 20, crossing_avoid_bias: 30, corner_room_weight: 4 }, {}, [0, 0, 400, 220]);
  const wall = makeLine('line_wall', [150, 110], [250, 110], { route: 'manhattan' });
  router.computePath(router.buildRouteRequest(wall, wall.a, wall.b));
  const crosser = makeLine('line_crosser', [200, 190], [200, 30], { route: 'smart', anchor_side: 'bottom', attach_side: 'top', corner_radius: 34, corner_room_weight: 0 });
  const r = router.computePath(router.buildRouteRequest(crosser, crosser.a, crosser.b));
  const radii = radiiOf(r.d);
  assert.ok(Math.min(...radii) < 10, `expected the explicit per-line 0 to disable refinement despite the nonzero card default, got radii=${radii.join(',')}`);
});

test('an unset corner_room_weight falls back to the router\'s own default (on)', () => {
  const router = makeRouter({ grid_resolution: 20, crossing_avoid_bias: 30 }, {}, [0, 0, 400, 220]); // no corner_room_weight in config at all
  const wall = makeLine('line_wall', [150, 110], [250, 110], { route: 'manhattan' });
  router.computePath(router.buildRouteRequest(wall, wall.a, wall.b));
  const crosser = makeLine('line_crosser', [200, 190], [200, 30], { route: 'smart', anchor_side: 'bottom', attach_side: 'top', corner_radius: 34 });
  const r = router.computePath(router.buildRouteRequest(crosser, crosser.a, crosser.b));
  const radii = radiiOf(r.d);
  assert.ok(Math.min(...radii) > 10, `expected the built-in default to be active with no config at all, got radii=${radii.join(',')}`);
});

test('regression: no accepted elbow-shift candidate ever produces a diagonal segment, across a grid_resolution sweep', () => {
  // The exact pre-existing bug this feature surfaced (see file docblock) —
  // reproduces with only smart_proximity set, independent of this
  // feature's own weight, since both share _refineSmart's candidate loop.
  for (const gridRes of [10, 16, 20, 30, 45]) {
    for (const trigger of [{ smart_proximity: 30, corner_room_weight: 0 }, { smart_proximity: 0, corner_room_weight: 4 }]) {
      const router = makeRouter({ grid_resolution: gridRes, ...trigger }, {}, [0, 0, 600, 400]);
      router.setOverlays([{ id: 'obs', _raw: { obstacle: true, position: [250, 150], size: [60, 60], attachment: 'top-left' } }]);
      const line = makeLine('line_1', [50, 180], [500, 220], { route: 'smart', anchor_side: 'right', attach_side: 'left' });
      const r = router.computePath(router.buildRouteRequest(line, line.a, line.b));
      assert.equal(findDiagonalSegment(r.pts), null, `gridRes=${gridRes} trigger=${JSON.stringify(trigger)}: diagonal segment in ${JSON.stringify(r.pts)}`);
    }
  }
});

test('regression: an accepted candidate never crosses a registered obstacle', () => {
  const router = makeRouter({ grid_resolution: 20, corner_room_weight: 8 }, {}, [0, 0, 600, 400]);
  const obstacles = [{ x1: 250, y1: 150, x2: 310, y2: 210 }];
  router.setOverlays([{ id: 'obs', _raw: { obstacle: true, position: [250, 150], size: [60, 60], attachment: 'top-left' } }]);
  const line = makeLine('line_1', [50, 180], [500, 220], { route: 'smart', anchor_side: 'right', attach_side: 'left', corner_radius: 34 });
  const r = router.computePath(router.buildRouteRequest(line, line.a, line.b));
  for (let i = 1; i < r.pts.length; i++) {
    assert.ok(!segmentCrossesObstacle(r.pts[i - 1], r.pts[i], obstacles), `segment ${JSON.stringify(r.pts[i - 1])}->${JSON.stringify(r.pts[i])} crosses the obstacle`);
  }
});
