/**
 * Matched-sibling corner-arc clearance (see tmp/ROUTING_ARC_CLEARANCE_FOLLOWUP.md).
 *
 * corner-neighbor-trim.test.js fixed the case where a neighbor's OWN
 * corner-rounding arc had already receded from a straight span still
 * registered as sharp (trimLo/trimHi). The remaining gap that doc's own
 * §2 identified: once a neighbor's radius grows large, part of the
 * "trimmed off" region is genuinely occupied by that neighbor's own
 * CURVED arc, not empty space — a scalar trim can't distinguish the two.
 *
 * Two attempts to close this gap generically (any two lines' corners,
 * arc-vs-arc) were tried and reverted (§3 of the followup doc): checking
 * a candidate's CENTER against a neighbor's registered arc (as a bounding
 * box, then as sample points) is a sufficient-but-not-necessary safety
 * proxy that gets measurably wrong once the target is a discrete
 * curve/point rather than an extended straight segment.
 *
 * This file covers the narrower, exactly-solvable case actually reported:
 * bundle-mates (lines sharing a trunk/channel) turning the SAME way at
 * corresponding ends of the shared corridor. Because both corners' full
 * swept shape is knowable (same vIn/vOut cardinal pair, by definition of
 * "matched"), sampling BOTH arcs independently (not just one candidate
 * center) and taking the true pairwise minimum converges to the exact
 * rendered gap — see RouterCore._siblingArcClearance's own docblock for
 * the harness-verified accuracy (tracks tests/routing's flattenSvgPath
 * oracle within ~0.5% at K=12, in the exact reported scenario below).
 *
 * A first implementation excluded a matched sibling's registered segments
 * from the generic proxy check and relied solely on the exact arc
 * sampler — confirmed via THIS FILE's own harness to genuinely OSCILLATE
 * (line_5/line_6 cycling between ~2.7 and ~34 pass over pass, never
 * settling) because two mutually-matched siblings each read the other's
 * previous-pass resolved radius with no monotonic anchor. Fixed by
 * flooring the exact signal against the untouched proxy (Math.max, never
 * a replacement) — see _estimateCornerRadii's own comment on this.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { makeRouter, makeLine, runDiscoveryLoop, flattenSvgPath } from './helpers/router-harness.js';

function minPairwiseDistance(pts1, pts2) {
  let best = Infinity;
  for (const a of pts1) {
    for (const b of pts2) {
      const d = Math.hypot(a[0] - b[0], a[1] - b[1]);
      if (d < best) best = d;
    }
  }
  return best;
}

// Same reported live config as corner-neighbor-trim.test.js's own
// bundledScenario() — reused verbatim (not reduced) for the same reason
// that file documents: a simplified version was found to shift the
// geometry enough to change WHICH line ends up tight.
function bundledScenario() {
  const router = makeRouter({
    grid_resolution: 32,
    trunk_proximity: 50,
    channels: {
      channel_1: { bounds: [350, 125, 100, 125], mode: 'prefer', direction: 'vertical', weight: 0.5, line_spacing: 8, discoverable: true },
      channel_2: { bounds: [500, 275, 50, 400], mode: 'force', direction: 'vertical', weight: 0.5, line_spacing: 8, discoverable: true },
      channel_3: { bounds: [245.24, 477.85, 188.95, 52.15], mode: 'prefer', direction: 'auto', weight: 0.5, line_spacing: 8, discoverable: true }
    }
  }, {}, [0, 0, 990, 765]);
  router.setOverlays([
    { id: 'control_2', _raw: { obstacle: true, position: [125, 150], size: [150, 50], attachment: 'center' } },
    { id: 'control_3', _raw: { obstacle: true, position: [100, 500], size: [150, 50], attachment: 'center' } },
    { id: 'control_4', _raw: { obstacle: true, position: [100, 550], size: [150, 50], attachment: 'center' } },
    { id: 'control_5', _raw: { obstacle: true, position: [100, 600], size: [150, 50], attachment: 'center' } },
    { id: 'control_6', _raw: { obstacle: true, position: [100, 650], size: [150, 50], attachment: 'center' } },
  ]);
  const lines = [
    makeLine('line_2', [200, 150], [402.6763916015625, 390.563232421875], { route: 'smart', anchor_side: 'right', attach_side: 'center', route_channels: ['channel_1'], style: { width: 2 } }),
    makeLine('line_3', [175, 500], [506.2194519042969, 268.32000732421875], { route: 'smart', anchor_side: 'right', attach_side: 'center', route_channels: ['channel_2', 'channel_3'], style: { width: 4 } }),
    makeLine('line_4', [175, 550], [546.5625, 204.13746630727763], { route: 'smart', anchor_side: 'right', attach_side: 'center', route_channels: ['channel_2'], style: { width: 4 } }),
    makeLine('line_5', [175, 600], [688.2197265625, 252.31463623046875], { route: 'smart', anchor_side: 'right', attach_side: 'center', route_channels: ['channel_2'], style: { width: 4 } }),
    makeLine('line_6', [175, 650], [724.52001953125, 260.48956298828125], { route: 'smart', anchor_side: 'right', attach_side: 'center', route_channels: ['channel_2'], style: { width: 4 } }),
  ];
  return { router, ...runDiscoveryLoop(router, lines) };
}

function exitArcRadius(d) {
  const radii = [...d.matchAll(/A([\d.]+),\1/g)].map(m => Number(m[1]));
  return radii.length ? radii[radii.length - 1] : 0;
}

test('_matchedSiblingArcs finds a bundle-mate with the identical turn shape, at the same relative end', () => {
  const router = makeRouter({ trunk_line_spacing: 8, trunk_proximity: 50 }, {}, [0, 0, 400, 400]);
  // Two vertical runs, same flow span (100->300), lanes 8px apart —
  // close enough to auto-merge into one discovered trunk. Both turn the
  // SAME way (vOut=(1,0), turning right) at their shared-flow-span end.
  const pts1 = [[100, 300], [100, 100], [300, 100]];
  const pts2 = [[108, 300], [108, 100], [300, 100]];
  router._registerLineSegments('line_1', pts1, pts1[0], pts1[2], 4, [{ index: 1, radius: 20, lenIn: 200, lenOut: 200 }]);
  router._registerLineSegments('line_2', pts2, pts2[0], pts2[2], 4, [{ index: 1, radius: 15, lenIn: 200, lenOut: 200 }]);

  const match = router._matchedTrunkCorner(pts1[0], pts1[1], 'line_1');
  assert.ok(match, 'line_1\'s corner should resolve to the auto-discovered trunk it just joined');
  const siblings = router._matchedSiblingArcs(match.row, match.atLo, [0, -1], [1, 0], 'line_1');
  assert.equal(siblings.length, 1, 'line_2 shares the trunk and the identical turn shape');
  assert.equal(siblings[0].lineId, 'line_2');
  assert.equal(siblings[0].radius, 15);
});

test('_matchedSiblingArcs excludes a trunk-mate whose turn shape is a mirror image (opposite offsetDir sign)', () => {
  const router = makeRouter({ trunk_line_spacing: 8, trunk_proximity: 50 }, {}, [0, 0, 400, 400]);
  const pts1 = [[100, 300], [100, 100], [300, 100]]; // turns right: vOut=(1,0)
  const pts3 = [[92, 300], [92, 100], [-100, 100]];  // turns LEFT: vOut=(-1,0) — same vIn, opposite vOut
  router._registerLineSegments('line_1', pts1, pts1[0], pts1[2], 4, [{ index: 1, radius: 20, lenIn: 200, lenOut: 200 }]);
  router._registerLineSegments('line_3', pts3, pts3[0], pts3[2], 4, [{ index: 1, radius: 25, lenIn: 200, lenOut: 200 }]);

  const match = router._matchedTrunkCorner(pts1[0], pts1[1], 'line_1');
  assert.ok(match, 'line_1 and line_3 should still share one trunk row (within trunk_proximity)');
  assert.ok(match.row.members.has('line_3'), 'line_3 really did join the same row');
  const siblings = router._matchedSiblingArcs(match.row, match.atLo, [0, -1], [1, 0], 'line_1');
  assert.equal(siblings.length, 0, 'a mirror-image turn must never be treated as "the same turn"');
});

test('the reported scenario: line_5\'s exit radius closes almost all the way to line_6\'s (was >10x apart)', () => {
  const { results } = bundledScenario();
  const r5 = exitArcRadius(results.get('line_5').d);
  const r6 = exitArcRadius(results.get('line_6').d);
  assert.ok(Math.abs(r5 - r6) < 1, `line_5 (${r5.toFixed(3)}) should now sit within 1 unit of line_6 (${r6.toFixed(3)}), not the old ~3x gap`);
});

test('lines whose own short final leg genuinely caps their radius are still unaffected', () => {
  const { results } = bundledScenario();
  const r3 = exitArcRadius(results.get('line_3').d);
  const r4 = exitArcRadius(results.get('line_4').d);
  assert.ok(Math.abs(r3 - 3.3902708146342775) < 0.01, `line_3's exit radius (${r3}) should still equal its own short-final-leg cap`);
  assert.ok(Math.abs(r4 - 12.781237810850143) < 0.01, `line_4's exit radius (${r4}) should still equal its own short-final-leg cap`);
});

test('ground truth: the rendered arcs have zero real crossings between line_5 and line_6, net of stroke width', () => {
  const { results } = bundledScenario();
  const line5 = results.get('line_5');
  const line6 = results.get('line_6');
  const pts5 = flattenSvgPath(line5.d);
  const pts6 = flattenSvgPath(line6.d);
  const trueClearance = minPairwiseDistance(pts5, pts6) - (4 + 4) / 2; // both style.width: 4
  assert.ok(trueClearance >= 0, `true rendered clearance (${trueClearance.toFixed(2)}) must be non-negative (no visible overlap)`);
});

test('convergence: two independent fresh-router runs reach byte-identical geometry', () => {
  const a = bundledScenario();
  const b = bundledScenario();
  for (const id of ['line_3', 'line_4', 'line_5', 'line_6']) {
    assert.equal(a.results.get(id).d, b.results.get(id).d, `${id}: two independent runs of the identical config should converge identically`);
  }
  assert.ok(a.passes <= (a.router._trunkDiscoveryMaxPasses ?? 4), 'should converge within the existing discovery pass cap');
});
