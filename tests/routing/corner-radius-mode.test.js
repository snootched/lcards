/**
 * corner_radius_mode: 'auto' (target size, default) vs 'forced' (hard
 * requirement, pre-2026.07 behavior). Confirms the reported mechanism: a
 * large corner_radius drove a fixed, unsearched anchor_side/attach_side
 * lead-out stub (_applyCardinalStubs / _computeManhattan's fallback) that
 * could cross another line's already-registered segment with zero
 * crossing-avoidance participation, regardless of crossing_avoid_bias.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { makeRouter, makeLine, routeLine } from './helpers/router-harness.js';

test('forced mode: cardinal stub overshoots a fixed point before any search runs', () => {
  const router = makeRouter();
  // Purely vertical (dx=0): the stub point becomes pts[1] directly, with no
  // A* tie-breaking involved — a fully deterministic geometry check.
  const forced = routeLine(router, makeLine('line_forced', [200, 40], [200, 300], {
    anchor_side: 'bottom', corner_radius: 34, corner_style: 'round', corner_radius_mode: 'forced'
  }));
  const auto = routeLine(router, makeLine('line_auto', [200, 40], [200, 300], {
    anchor_side: 'bottom', corner_radius: 34, corner_style: 'round' // default: auto
  }));
  // forced: stub = max(24, 34*2) = 68 -> lands at y=108, past y=100.
  assert.ok(forced.pts[1][1] >= 100, `forced stub should already be past y=100, got ${forced.pts[1][1]}`);
  // auto: stub = MIN_STUB_LENGTH floor = 24 -> lands at y=64, short of y=100.
  assert.ok(auto.pts[1][1] < 100, `auto stub should stay short of y=100, got ${auto.pts[1][1]}`);
});

test('forced mode: miter style gets no radius-driven inflation (bug fix bundled with this change)', () => {
  const router = makeRouter();
  const res = routeLine(router, makeLine('line_miter', [200, 40], [200, 300], {
    anchor_side: 'bottom', corner_radius: 34, corner_style: 'miter', corner_radius_mode: 'forced'
  }));
  // miter never renders an arc, so even 'forced' should fall back to the bare floor (24).
  assert.equal(res.pts[1][1], 64, `miter should use the bare MIN_STUB_LENGTH floor regardless of mode, got ${res.pts[1][1]}`);
});

test('forced mode always crosses a registered wall the blind stub runs through; auto detours around it', () => {
  // Two FULLY SEPARATE routers (not one router with two nearby lines): a
  // shared router would let forced's own long straight run register as a
  // discovered trunk/crossing occupant that auto (if placed anywhere near
  // it) could then bundle with or be deflected by -- contaminating the
  // comparison with the bundling system's own (correct, separate) behavior
  // instead of isolating corner_radius_mode's effect. Confirmed live in HA
  // and reproduced here: two probes 10px apart in one router bundle
  // together (auto joins forced's trunk and inherits its wall-crossing via
  // the bundle-mate crossing exemption), masking auto's independent
  // decision entirely. Each probe here only ever sees the wall.
  const routerForced = makeRouter({ crossing_avoid_bias: 20 }); // ROUTING_ENGINE_BRIEF §5d: HA-confirmed decisive threshold
  routeLine(routerForced, makeLine('line_wall', [180, 100], [220, 100], { route: 'direct' }));
  const forced = routeLine(routerForced, makeLine('probe_forced', [200, 40], [200, 220], {
    anchor_side: 'bottom', corner_radius: 34, corner_style: 'round', corner_radius_mode: 'forced'
  }));

  const routerAuto = makeRouter({ crossing_avoid_bias: 20 });
  routeLine(routerAuto, makeLine('line_wall', [180, 100], [220, 100], { route: 'direct' }));
  const auto = routeLine(routerAuto, makeLine('probe_auto', [200, 40], [200, 220], {
    anchor_side: 'bottom', corner_radius: 34, corner_style: 'round' // default: auto
  }));

  // forced: blind stub [200,40] -> [200,108] already crosses y=100 at
  // x=200 -- dead center of the wall's [180,220] span -- before
  // pathfinding/crossing-cost ever runs. Structurally guaranteed,
  // independent of crossing_avoid_bias.
  assert.deepEqual(forced.pts, [[200, 40], [200, 108], [200, 220]],
    `forced should punch straight through the wall's span, got ${JSON.stringify(forced.pts)}`);

  // auto: short stub leaves the y=100 crossing to the crossing-aware
  // search, which (at this bias) detours sideways to cross OUTSIDE the
  // wall's registered x-span [180,220] instead of straight through it --
  // the crossing-avoidance mechanism actually influencing the route shape,
  // not just a shorter stub with the same underlying path.
  const wallSpanCrossed = auto.pts.some(([x, y], i) => {
    if (i === 0) return false;
    const [px, py] = auto.pts[i - 1];
    const isVertical = px === x && py !== y;
    const spansWallRow = Math.min(py, y) <= 100 && Math.max(py, y) >= 100;
    return isVertical && spansWallRow && x > 180 && x < 220;
  });
  assert.ok(!wallSpanCrossed, `auto should not cross the wall's span, got ${JSON.stringify(auto.pts)}`);
  assert.notDeepEqual(auto.pts, forced.pts);
});
