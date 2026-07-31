/**
 * Reported live: two (and more generally N) roughly-parallel lines bundled
 * through a shared force channel, all turning the same direction at similar
 * points, render with wildly inconsistent corner radii — one gets a full,
 * graceful arc while its neighbor(s) get visually tight ~90°-ish corners,
 * even though geometrically they're doing "the same turn."
 *
 * Root cause: `_distanceToNearestOtherLineSegment` (the clamp
 * `_estimateCornerRadii`'s binary search uses to avoid a corner's arc
 * bulging into another line) always measures against the FULL, sharp-
 * cornered, right-angle polyline registered in `_crossings` — never
 * trimmed by how much that other line's OWN corner-rounding arc actually
 * recedes from the sharp point. A line's corner can be clamped tight by a
 * neighbor's segment that, once THAT neighbor's own arc renders, has
 * already curved away from the exact spot being checked — space that was
 * real and available, but invisible to the registry.
 *
 * Fixed by threading each line's own already-computed `_estimateCornerRadii`
 * result (previously discarded after rendering) into `_registerLineSegments`
 * -> `_registerCrossingSegment`, which now stores `trimLo`/`trimHi` on each
 * `_crossings` entry (how much shorter that segment's real occupied span is
 * at each end, because that end sits at a rounded corner).
 * `_distanceToNearestOtherLineSegment` clamps against this trimmed span
 * instead of the raw one. Trim participates in the exact same
 * `_registryVersion`-driven diff discipline `width` already does, so the
 * existing discovery loop (the ONLY multi-pass mechanism in this router)
 * naturally converges on it — no new counter, no new loop. Pass 1 is
 * byte-identical to today (no trim data exists yet); each subsequent pass
 * can only loosen (never tighten) a radius, since a larger neighbor trim
 * can only ever increase-or-hold a line's own achievable radius (monotone,
 * bounded by that line's own fixed local cap — a classic convergent
 * sequence).
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { makeRouter, makeLine, runDiscoveryLoop } from './helpers/router-harness.js';

test('_distanceToNearestOtherLineSegment respects a registered trim, not just the raw span', () => {
  const router = makeRouter({ trunk_line_spacing: 8 }, {}, [0, 0, 400, 200]);
  // An L-shape with a real interior corner at (200,100) — cornerRadii is
  // indexed against pts (cornerRadii[i-1] for the corner at pts[i]), so a
  // straight 2-point "segment" has no corner at all; this needs a genuine
  // bend to exercise the lookup. The first run, (0,100)->(200,100), gets a
  // trim of 30 at its HIGH (x2=200) end, simulating that corner's own arc
  // having already curved away 30px of real, vacated clearance the raw
  // span alone can't express.
  const pts = [[0, 100], [200, 100], [200, 300]];
  router._registerLineSegments('line_a', pts, pts[0], pts[2], 4, [{ index: 1, radius: 30, lenIn: 200, lenOut: 200 }]);
  // Point right at the untrimmed edge (x=200) — with the trim applied, the
  // nearest real occupied point is x=170, not x=200.
  const p = [200, 100];
  const dTrimmed = router._distanceToNearestOtherLineSegment(p, 'line_b', 4);
  // 30 (vacated span) minus (4+4)/2=4 width netting = 26.
  assert.equal(dTrimmed, 26, `expected the trimmed span to report real clearance, got ${dTrimmed}`);
});

test('no trim data (cornerRadii omitted) is byte-identical to pre-fix behavior — the "pass 1 is unchanged" safety claim', () => {
  const pts = [[0, 100], [200, 100], [200, 300]];
  const router = makeRouter({ trunk_line_spacing: 8 }, {}, [0, 0, 400, 200]);
  // No 6th argument at all — mirrors every caller that existed before this
  // fix, and the very first registration of any line before any corner
  // radii have ever been computed.
  router._registerLineSegments('line_a', pts, pts[0], pts[2], 4);
  const entry = router._crossings.find(c => c.id === 'cross:line_a:0');
  assert.equal(entry.trimLo, 0, 'no cornerRadii supplied -> trimLo defaults to 0, today\'s exact behavior');
  assert.equal(entry.trimHi, 0, 'no cornerRadii supplied -> trimHi defaults to 0, today\'s exact behavior');
  const p = [200, 100];
  assert.equal(router._distanceToNearestOtherLineSegment(p, 'line_b', 4), -4, 'raw span, no trim: (200-200) - (4+4)/2 = -4, unchanged from before this fix');
});

// The exact reported live config (5 lines, all 3 channels, all 5 controls) —
// reduced scenarios were tried and found to shift the geometry enough to
// change WHICH lines end up tight, so this uses the full reported shape
// verbatim rather than risk testing a differently-shaped bug.
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

// Pulls the LAST arc's radius out of a rendered `d` string — every line
// here has an entry corner (into channel_2) and an exit corner (out of it
// toward its own destination); the entry corners are consistently fine
// (nothing else is nearby there), it's the EXIT corner the report is about.
function exitArcRadius(d) {
  const radii = [...d.matchAll(/A([\d.]+),\1/g)].map(m => Number(m[1]));
  return radii.length ? radii[radii.length - 1] : 0;
}

const BUNDLED_IDS = ['line_3', 'line_4', 'line_5', 'line_6'];

test('the reported asymmetry: line_5 grows toward line_6\'s radius once it can see line_6\'s own receded arc', () => {
  const { results } = bundledScenario();
  // line_3 and line_4 are deliberately excluded from this comparison: their
  // OWN exit corners sit a SHORT distance from their own true destination
  // (confirmed: their tight radii exactly equal half that short final leg's
  // own length, `min(radiusGlobal, lenIn/2, lenOut/2)` — a genuine,
  // self-imposed cap with nothing to do with neighbors, correct both
  // before and after this fix). line_5 and line_6 both have LONG final
  // legs (self-cap far above radiusGlobal), so any tightness in either is
  // attributable to neighbor clearance — exactly the shape this fix
  // targets. Before the fix: line_5 clamped to ~2.7 while line_6 (nothing
  // swept-toward) got the full ~34 — over 10x apart, because line_5's
  // corner swept toward line_6's own registered-as-still-straight segment
  // in a region line_6's OWN already-rendered arc had actually vacated.
  const r5 = exitArcRadius(results.get('line_5').d);
  const r6 = exitArcRadius(results.get('line_6').d);
  assert.ok(r5 > 15, `line_5's exit radius (${r5.toFixed(2)}) should grow well past its pre-fix ~2.7 once it can see line_6's real (arc-trimmed) shape`);
  assert.ok(r5 >= r6 / 3, `line_5 (${r5.toFixed(2)}) is still far smaller than line_6 (${r6.toFixed(2)}) — the asymmetry this fix targets`);
});

test('lines whose own short final leg genuinely caps their radius are unaffected by this fix', () => {
  const { results } = bundledScenario();
  // line_3/line_4's radii should still exactly equal their own self-imposed
  // cap — proves the fix doesn't over-relax a corner that's tight for a
  // real, unrelated reason (their own destination sits close by).
  const r3 = exitArcRadius(results.get('line_3').d);
  const r4 = exitArcRadius(results.get('line_4').d);
  assert.ok(Math.abs(r3 - 3.3902740478515625) < 0.01, `line_3's exit radius (${r3}) should still equal its own short-final-leg cap`);
  assert.ok(Math.abs(r4 - 12.78125) < 0.01, `line_4's exit radius (${r4}) should still equal its own short-final-leg cap`);
});

test('convergence: a second identical run from a fresh router reaches the same radii with no lingering version churn', () => {
  const a = bundledScenario();
  const b = bundledScenario();
  for (const id of BUNDLED_IDS) {
    assert.equal(a.results.get(id).d, b.results.get(id).d, `${id}: two independent runs of the identical config should converge to the identical rendered path`);
  }
  assert.ok(a.passes <= (a.router._trunkDiscoveryMaxPasses ?? 4), 'should converge within the existing discovery pass cap');
});
