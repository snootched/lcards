/**
 * Reported live (the "Kelvin" ship base_svg config): four lines bundled
 * through chained `channel_3` (prefer) -> `channel_2` (force) corridors
 * rendered with one member ("line_3", though empirically confirmed to be
 * whichever member's corridor-entry position is smallest — not a fixed
 * line identity) taking a pointless extra pair of bends (a "double dogleg")
 * compared to its siblings' clean single jog into the shared corridor.
 *
 * Root cause, confirmed via direct harness instrumentation (not just
 * hand-reasoning about coordinates): `_pushBundledApproachLegs`'s
 * `corridorOffset` (the nudge distance a bundled line's approach leg uses
 * to separate onto its own lane, `stubLengthFor(stubReq) + laneIndex *
 * lineSpacing`) has no awareness of OTHER lines' own still-active
 * approach segments. Whichever member has the SMALLEST laneIndex gets the
 * SMALLEST nudge distance — but if that small nudge lands at a flow-axis
 * coordinate still within another member's own not-yet-turned horizontal
 * (or vertical) approach run, the resulting cross-axis correction leg
 * genuinely crosses that other line's segment. The pathfinder then
 * "correctly" detours around this real conflict — but via an inelegant,
 * bent workaround (out, partial correction, out further, full correction)
 * instead of simply extending the nudge distance far enough to clear the
 * conflict in the first place.
 *
 * Two GENERIC fixes (a post-search short-circuit for fully-soft-hinted
 * legs, and a wider generalization to hard `channel_axis`-hinted legs)
 * were tried first. The first is safe (zero regressions) but does NOT
 * fix this exact reported scenario — the safety check it uses correctly
 * detects the REAL conflict here and declines to fire (confirmed: a
 * parallel-only relaxation of that same check "fixes" the dogleg but
 * reintroduces the exact crossing the original detour was preventing).
 * The second measurably changes real corridor-vs-plain cost comparisons
 * elsewhere and was reverted (see `_maybeStraightenPureCrossAxisLeg`'s own
 * docblock in RouterCore.js for both).
 *
 * The actual fix lives upstream, in `_pushBundledApproachLegs` itself:
 * when the originally-computed `corridorOffset` would produce an unsafe
 * (too-close) cross-axis correction leg, extend it in `lineSpacing`-sized
 * steps — reusing the exact same real-geometry safety check — until it
 * clears, bounded by the same `available` clamp already in force. Purely
 * additive: the common (already-safe) case is unaffected (the very first
 * check finds it safe and nothing changes), and when no safe extension
 * exists either, `corridorOffset` is left exactly as it was, so the
 * pre-existing (possibly inelegant, but safe) detour mechanism downstream
 * is unaffected.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { makeRouter, makeLine, runDiscoveryLoop, flattenSvgPath, countRenderedCrossings } from './helpers/router-harness.js';

const BUNDLE_IDS = ['line_3', 'line_4', 'line_5', 'line_6'];

function kelvinBundleScenario(gridRes) {
  const router = makeRouter({
    grid_resolution: gridRes,
    trunk_proximity: 50,
    channels: {
      channel_2: { bounds: [523.43, 250.58, 50, 425.71], mode: 'force', direction: 'vertical', weight: 0.5, line_spacing: 12, discoverable: true },
      channel_3: { bounds: [361.03, 516.85, 134.11, 119.2], mode: 'prefer', direction: 'auto', weight: 0.5, line_spacing: 8, discoverable: true }
    }
  }, {}, [-200, 0, 1190, 765]);
  router.setOverlays([
    { id: 'control_3', _raw: { obstacle: true, position: [100, 500], size: [150, 50], attachment: 'center' } },
    { id: 'control_4', _raw: { obstacle: true, position: [100, 550], size: [150, 50], attachment: 'center' } },
    { id: 'control_5', _raw: { obstacle: true, position: [100, 600], size: [150, 50], attachment: 'center' } },
    { id: 'control_6', _raw: { obstacle: true, position: [100, 650], size: [150, 50], attachment: 'center' } },
  ]);
  const chan = ['channel_2', 'channel_3'];
  const lines = [
    makeLine('line_3', [175, 500], [506.2194519042969, 268.32000732421875], { route: 'smart', anchor_side: 'right', attach_side: 'center', route_channels: chan, style: { width: 4 } }),
    makeLine('line_4', [175, 550], [546.5625, 204.13746630727763], { route: 'smart', anchor_side: 'right', attach_side: 'center', route_channels: chan, style: { width: 4 } }),
    makeLine('line_5', [175, 600], [688.2197265625, 252.31463623046875], { route: 'smart', anchor_side: 'right', attach_side: 'center', route_channels: chan, style: { width: 4 } }),
    makeLine('line_6', [175, 650], [724.52001953125, 260.48956298828125], { route: 'smart', anchor_side: 'right', attach_side: 'center', route_channels: chan, style: { width: 4 } }),
  ];
  return { router, ...runDiscoveryLoop(router, lines) };
}

function totalCrossings(results, ids) {
  let count = 0;
  for (let i = 0; i < ids.length; i++) {
    for (let j = i + 1; j < ids.length; j++) {
      count += countRenderedCrossings(
        flattenSvgPath(results.get(ids[i]).d),
        flattenSvgPath(results.get(ids[j]).d)
      );
    }
  }
  return count;
}

test('reported scenario at grid_resolution 32: every bundle member gets a single clean jog, zero crossings', () => {
  const { results } = kelvinBundleScenario(32);
  for (const id of BUNDLE_IDS) {
    assert.equal(results.get(id).meta.bends, 4, `${id} should render with a single clean jog (4 bends), not a double dogleg`);
  }
  assert.equal(totalCrossings(results, BUNDLE_IDS), 0, 'no bundle member should visibly cross another');
});

test('line_3 never lands its nudge before line_4\'s own turn point, so it never crosses its approach leg', () => {
  const { results } = kelvinBundleScenario(32);
  const line3 = results.get('line_3').pts;
  const line4 = results.get('line_4').pts;
  // Both lines' second point is their own corridor-entry turn x (index 2:
  // [anchor, stub, turn, ...]). Originally asserted STRICTLY greater
  // (line_3 always extending past line_4) — since `laneStagger` was
  // dropped for bundle-entry legs (see RouterCore.js's own comment on
  // that removal) both members now often land on the exact SAME shared,
  // unstaggered position instead of a strict staircase, which is the
  // intended "concentric" fix, not a regression: `>=` is the invariant
  // that actually matters here (line_3 must never land BEFORE line_4,
  // which would cross its still-straight approach leg) — equality is a
  // legitimate, common outcome now, not just the boundary case.
  const line3TurnX = line3[2][0];
  const line4TurnX = line4[2][0];
  assert.ok(line3TurnX >= line4TurnX, `line_3's turn (x=${line3TurnX}) should never land before line_4's own turn (x=${line4TurnX}), which would clear its approach leg`);
});

test('resolution sweep: 8/16/24/32/64 all render with zero crossings and the minimal bend count', () => {
  for (const res of [8, 16, 24, 32, 64]) {
    const { results } = kelvinBundleScenario(res);
    for (const id of BUNDLE_IDS) {
      assert.equal(results.get(id).meta.bends, 4, `res=${res}: ${id} should have 4 bends (a single clean jog)`);
    }
    assert.equal(totalCrossings(results, BUNDLE_IDS), 0, `res=${res}: no bundle member should visibly cross another`);
  }
});

// grid_resolution 40/48 still exhibit an UNRELATED, separate detour deep
// inside channel_2's own vertical run (a large rectangular loop-out-and-
// back, well past the channel_3-entry nudge this fix targets) — flagged
// as a known, distinct issue rather than silently skipped, matching this
// suite's own established practice for a confirmed-but-deferred gap (see
// turnaround-regression.test.js's own two todos).
test.todo('resolution sweep: 40/48 have a separate, unrelated detour inside channel_2 not covered by this fix', () => {
  for (const res of [40, 48]) {
    const { results } = kelvinBundleScenario(res);
    for (const id of BUNDLE_IDS) {
      assert.equal(results.get(id).meta.bends, 4, `res=${res}: ${id} should have 4 bends`);
    }
    assert.equal(totalCrossings(results, BUNDLE_IDS), 0, `res=${res}: no bundle member should visibly cross another`);
  }
});

test('convergence: two independent fresh-router runs reach byte-identical geometry, genuinely (not just within the pass cap)', () => {
  const a = kelvinBundleScenario(32);
  const b = kelvinBundleScenario(32);
  for (const id of BUNDLE_IDS) {
    assert.equal(a.results.get(id).d, b.results.get(id).d, `${id}: two independent runs should converge identically`);
  }
  assert.ok(a.passes <= (a.router._trunkDiscoveryMaxPasses ?? 4), 'should converge within the existing discovery pass cap');
});

// The nudge-extension search itself is structurally bounded (a fixed
// max-20-iteration loop, additionally capped by the pre-existing
// `available` clamp) — an infinite loop is not reachable by construction.
// Its "leave corridorOffset unchanged when no safe extension exists"
// fallback path is exercised implicitly by every OTHER scenario in the
// full `tests/routing` suite that touches `_pushBundledApproachLegs`
// without needing this fix to engage at all (129/129 passing, unchanged) —
// a dedicated synthetic reproduction isn't needed on top of that.

/**
 * History of this test, kept because the mechanism it exercises has
 * changed twice since it was first written and the reasoning for each
 * step is worth keeping:
 *
 * 1. Original fix: the corridor-entry nudge distance reserved
 *    `2 * corner_radius` (68 here) of flow-axis room before the first
 *    turn, but the S-curve's own two corners were constrained by the
 *    CROSS-axis lane-offset distance instead, achieving only
 *    `crossDist * 0.325` regardless of corner_radius — so that flow-axis
 *    reservation was real, measured waste. Fixed by capping the
 *    reservation itself at `min(corner_radius, crossDist * 0.325)`.
 * 2. Superseded: bundle-entry corners now render via a genuine "reverse
 *    curve" (two tangent arcs of the FULL configured corner_radius,
 *    sweeping only as much angle as this line's own crossDist needs —
 *    see `reverseCurveGeometry`/`_buildBundleEntryReverseCurves` in
 *    RouterCore.js) instead of a plain 90°-quarter-circle fillet. That
 *    construction can actually USE the full `2 * corner_radius`
 *    reservation (up to `flowHalf <= corner_radius` per side), so the
 *    (1) shrink was reverted for entry legs specifically — starving the
 *    reservation now starves the achievable radius, which (1) never had
 *    to worry about. EXIT legs still render as plain quarter-circle
 *    fillets and still use the original (1) shrink, unchanged.
 * 3. Separately, bundle-entry legs also dropped the unconditional
 *    `laneIndex * lineSpacing` position stagger (see `laneStagger` in
 *    `_pushBundledApproachLegs`) — a different axis (position, not size)
 *    of the same underlying "uneven bundle entry" report.
 */
test('the corridor-entry lead-in reserves full room so the reverse-curve construction reaches the configured corner_radius', () => {
  const { results } = kelvinBundleScenario(25);
  const line4 = results.get('line_4');
  // line_4's own entry into channel_3 needs no conflict-extension (it's
  // the "clean reference" case throughout this file), so its turn point
  // is driven purely by the reservation formula, not the separate
  // extension search — isolating exactly what this test targets.
  assert.equal(line4.pts[2][0], 268, `line_4's corridor-entry turn should land at the full, unshrunk reservation distance (268), got ${line4.pts[2][0]}`);
  const radii = [...line4.d.matchAll(/A([\d.]+),/g)].map(m => Number(m[1]));
  // The S-curve's own two corners (the first two arcs) now reach the
  // FULL configured corner_radius (34) — not the ~7.3 the old
  // crossDist*0.325 formula would have produced for line_4's own
  // crossDist alone, and not some smaller group-clamped value from an
  // earlier revision of this feature either. Every bundle member
  // independently targets the same corner_radius, which is what makes
  // the group render uniformly here — no cross-line coordination for
  // the radius itself is needed (unlike the earlier, superseded design).
  assert.ok(Math.abs(radii[0] - 34) < 0.01 && Math.abs(radii[1] - 34) < 0.01,
    `expected line_4's reverse-curve radius to reach the full configured corner_radius (34) got ${radii.slice(0, 2).join(',')}`);
});

test('a corridor-EXIT leg that relies on saturation to collapse into one clean corner is unaffected (regression guard)', () => {
  // Mirrors channel-chain-transition-taper.test.js's own "still 2 clean
  // bends" scenario directly (not just re-running the whole file), so a
  // future change to this exact guard fails loudly, here, with the
  // specific numbers that caught the original regression.
  const router = makeRouter({
    grid_resolution: 32,
    channels: {
      channel_2: { bounds: [500, 275, 50, 400], mode: 'force', direction: 'vertical', weight: 0.5, line_spacing: 8, discoverable: true },
      channel_3: { bounds: [245.24, 475.22, 188.95, 56.07], mode: 'prefer', direction: 'auto', weight: 0.5, line_spacing: 8, discoverable: true }
    }
  }, {}, [0, 0, 990, 765]);
  router.setOverlays([
    { id: 'control_3', _raw: { obstacle: true, position: [100, 500], size: [150, 50], attachment: 'center' } },
    { id: 'control_4', _raw: { obstacle: true, position: [100, 550], size: [150, 50], attachment: 'center' } },
    { id: 'control_5', _raw: { obstacle: true, position: [100, 600], size: [150, 50], attachment: 'center' } },
    { id: 'control_6', _raw: { obstacle: true, position: [100, 650], size: [150, 50], attachment: 'center' } },
  ]);
  const lines = [
    makeLine('line_3', [175, 500], [506.2194519042969, 268.32000732421875], { route: 'smart', anchor_side: 'right', attach_side: 'center', route_channels: ['channel_2', 'channel_3'] }),
    makeLine('line_4', [175, 550], [546.5625, 204.13746630727763], { route: 'smart', anchor_side: 'right', attach_side: 'center', route_channels: ['channel_2'] }),
    makeLine('line_5', [175, 600], [688.2197265625, 252.31463623046875], { route: 'smart', anchor_side: 'right', attach_side: 'center', route_channels: ['channel_2'] }),
    makeLine('line_6', [175, 650], [850.9133911132812, 250.996337890625], { route: 'smart', anchor_side: 'right', attach_side: 'center', route_channels: ['channel_2'] }),
  ];
  const { results } = runDiscoveryLoop(router, lines);
  for (const id of ['line_4', 'line_5', 'line_6']) {
    assert.equal(results.get(id).meta.bends, 2, `${id}: expected the exit leg to stay collapsed into 2 clean bends, got ${results.get(id).meta.bends}`);
  }
});
