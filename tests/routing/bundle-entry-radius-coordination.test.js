/**
 * Bundle-entry lane-separation S-curve corners (the "nudge"/"mid" pair
 * `_pushBundledApproachLegs` builds when several lines converge from
 * different rows onto a shared channel's own tightly-packed lanes) used to
 * render as a plain 90°-quarter-circle fillet, hard-capped at roughly
 * `crossDist * 0.325` regardless of the configured `corner_radius` (see
 * doc/architecture/msd/routing.md's "Cross-Axis-Aware Corridor-Entry Nudge
 * Sizing") — so a bundle whose members start on unevenly-spaced rows (e.g.
 * four controls 50px apart converging onto 8px-spaced lanes) rendered with
 * visibly uneven, un-uniform, and undersized entry bends, unlike the SAME
 * bundle's later channel-to-channel transition, which renders uniformly at
 * the FULL `corner_radius` because every member has generous leg room
 * there for an ordinary quarter-circle fillet.
 *
 * `_buildBundleEntryReverseCurves` (RouterCore.js) fixes this by default
 * (no config flag) with a genuine "reverse curve" — two tangent arcs of the
 * FULL configured `corner_radius`, sweeping only as much angle as this
 * line's own crossDist actually needs (see `reverseCurveGeometry`'s own
 * docblock for the geometry). Every bundle member independently targets
 * the SAME `corner_radius`, so uniformity falls out of matching a shared
 * target rather than clamping to a shared floor — unlike an earlier,
 * superseded revision of this feature (a `Math.min`-based sibling
 * registry, converging every member down to its tightest bundle-mate's
 * own achievable radius), no cross-line coordination is needed for the
 * radius itself anymore. `_pushBundledApproachLegs`'s `laneStagger`
 * removal (a separate, still-needed fix — see its own test below) is what
 * makes bundle members start bending from a shared position too, closing
 * the other half of the same "uneven bundle entry" report.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { makeRouter, makeLine, runDiscoveryLoop } from './helpers/router-harness.js';

const BUNDLE_IDS = ['line_3', 'line_4', 'line_5', 'line_6'];

// Identical scenario to kelvin-bundle-crossing.test.js's own
// kelvinBundleScenario — the real, live-reported "Kelvin" ship config this
// whole mechanism was built for. Duplicated locally (rather than importing
// a private helper from another test file) since the two files test
// different concerns and shouldn't share mutable fixture state. Split into
// a builder (router + lines, nothing routed yet) and a runner (drives the
// discovery loop) so tests that need to control the FIRST call themselves
// (e.g. to capture a line's true pre-coordination value) can do so.
function buildKelvinBundle(gridRes = 32) {
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
  return { router, lines };
}

function kelvinBundleScenario(gridRes = 32) {
  const { router, lines } = buildKelvinBundle(gridRes);
  return { router, ...runDiscoveryLoop(router, lines) };
}

function entryArcRadii(d) {
  return [...d.matchAll(/A([\d.]+),/g)].map(m => Number(m[1]));
}

test('all four channel_3 bundle members render their entry S-curve at the full configured corner_radius', () => {
  const { results } = kelvinBundleScenario(32);
  const pairRadii = BUNDLE_IDS.map(id => {
    const radii = entryArcRadii(results.get(id).d);
    // Each member's own two entry-corner arcs (nudge, mid) share one
    // radius by construction (a single reverse curve, not two
    // independent fillets).
    assert.ok(Math.abs(radii[0] - radii[1]) < 1e-6, `${id}: entry pair arcs should be equal, got ${radii[0]},${radii[1]}`);
    return radii[0];
  });
  // Uniform BECAUSE every member independently reaches the same target
  // (34, this fixture's configured corner_radius) — not because they're
  // clamped to match each other.
  for (const [i, id] of BUNDLE_IDS.entries()) {
    assert.ok(Math.abs(pairRadii[i] - 34) < 0.01, `expected ${id}'s entry radius to reach the full configured corner_radius (34), got ${pairRadii[i]}`);
  }
});

test('bundle members start their entry bend at (nearly) the same flow-axis position, not a per-lane staircase', () => {
  // `_pushBundledApproachLegs` used to add an unconditional
  // laneIndex*lineSpacing stagger to every bundle member's nudge
  // distance, regardless of whether anything actually required it — the
  // four channel_3 entries rendered as an uneven staircase (each bend
  // further right than the last) instead of a converging "comb" even
  // after their radii were coordinated to match. Bundle-entry legs now
  // start from a SHARED baseline instead, and only the two members whose
  // own crossDist is large enough to genuinely pass through a sibling's
  // still-straight approach row (line_3 and line_6 here — see
  // _pureCrossAxisLegTooCloseToOtherLine's own conflict-extension search)
  // get pushed further out, by the minimum the existing safety check
  // actually requires — not a blanket per-lane offset.
  const { results } = kelvinBundleScenario(32);
  const nudgeX = BUNDLE_IDS.map(id => results.get(id).pts[2][0]);
  // line_4 and line_5 have no such conflict and should land EXACTLY on
  // the shared, unstaggered baseline.
  const [, x4, x5] = nudgeX;
  assert.equal(x4, x5, `expected line_4 and line_5 (no genuine conflict) to start their entry bend at the identical position, got ${x4} vs ${x5}`);
  // The full group's spread should be dramatically tighter than the old
  // per-lane staircase (which, at this same fixture/resolution, spanned
  // roughly 50+ units end to end) — real geometric necessity for the two
  // outer members still applies, but it's no longer inflated by an
  // unconditional stagger on top.
  const spread = Math.max(...nudgeX) - Math.min(...nudgeX);
  assert.ok(spread < 15, `expected a tight cluster of entry-bend positions (< 15 units apart), got a spread of ${spread} across ${JSON.stringify(Object.fromEntries(BUNDLE_IDS.map((id, i) => [id, nudgeX[i]])))}`);
});

test('a genuinely bundled entry (crossDist small relative to corner_radius) still renders below the full target, correctly', () => {
  // Radius no longer depends on a SIBLING's geometry directly (each
  // member independently targets the same corner_radius — see this
  // file's own header comment) — but it's still bounded by the room-
  // constrained branch of `reverseCurveGeometry` whenever the reverse
  // curve's own flow-axis need (flowHalf = R*sinTheta) exceeds what's
  // actually available before/after the jog. For a tightly-packed pair
  // (line_b only 8px from line_a's own row), that's exactly what
  // happens: the achieved radius is real (a genuine curve, not a sharp
  // corner) but below the full 34 target, verified via
  // `meta.bundleEntryHints` to confirm this specific test is actually
  // exercising the reverse-curve mechanism and not some unrelated
  // corner elsewhere in the route.
  const router = makeRouter({
    grid_resolution: 25,
    channels: {
      chan: { bounds: [400, 150, 40, 400], mode: 'force', direction: 'vertical', weight: 0.5, line_spacing: 8, discoverable: true }
    }
  }, {}, [0, 0, 900, 800]);
  router.setOverlays([
    { id: 'ctrl_a', _raw: { obstacle: true, position: [100, 300], size: [120, 30], attachment: 'center' } },
    { id: 'ctrl_b', _raw: { obstacle: true, position: [100, 308], size: [120, 30], attachment: 'center' } },
  ]);
  const lines = [
    makeLine('line_a', [160, 300], [420, 100], { route: 'smart', anchor_side: 'right', attach_side: 'center', route_channels: ['chan'] }),
    makeLine('line_b', [160, 308], [420, 700], { route: 'smart', anchor_side: 'right', attach_side: 'center', route_channels: ['chan'] }),
  ];
  const { results } = runDiscoveryLoop(router, lines);
  const lineA = results.get('line_a');
  assert.ok(lineA.meta.bundleEntryHints?.length > 0, 'expected line_a to actually engage the reverse-curve mechanism in this tightly-packed scenario');
  const radius = entryArcRadii(lineA.d)[0];
  assert.ok(radius > 1 && radius < 34, `expected a real but below-target radius (room-constrained), got ${radius}`);
});

test('the later channel_3-to-channel_2 transition corner stays at the full configured radius, unaffected by entry coordination', () => {
  // Scoping guard: coordination is deliberately identified via the hint
  // _pushBundledApproachLegs pushes for its OWN nudge/mid pair only — a
  // channel-to-channel transition corner (already at full radius for
  // every member, since it has generous leg room and was never part of
  // any hint) must render exactly as it did before this feature existed.
  const { results } = kelvinBundleScenario(32);
  for (const id of BUNDLE_IDS) {
    const radii = entryArcRadii(results.get(id).d);
    // Arc index 2 (0-based) is the channel_3->channel_2 transition corner
    // for every member in this fixture (index 0/1 are the entry pair).
    const transitionRadius = radii[2];
    assert.ok(transitionRadius !== undefined, `${id} should have a third arc (the channel-to-channel transition)`);
    assert.ok(transitionRadius > 30, `${id}'s channel-to-channel transition should stay near the full configured corner_radius (34), got ${transitionRadius}`);
  }
});

test('convergence: two independent fresh-router runs reach byte-identical bundle-entry radii, within the existing pass cap', () => {
  const a = kelvinBundleScenario(32);
  const b = kelvinBundleScenario(32);
  for (const id of BUNDLE_IDS) {
    assert.equal(a.results.get(id).d, b.results.get(id).d, `${id}: two independent runs should converge identically`);
  }
  assert.ok(a.passes <= (a.router._trunkDiscoveryMaxPasses ?? 4), 'should converge within the existing discovery pass cap');
});

test('a larger synthetic bundle (6 members) still converges within the existing pass cap', () => {
  const router = makeRouter({
    grid_resolution: 25,
    channels: {
      wide: { bounds: [400, 480, 40, 200], mode: 'force', direction: 'vertical', weight: 0.5, line_spacing: 8, discoverable: true }
    }
  }, {}, [0, 0, 900, 800]);
  const rows = [400, 440, 480, 560, 640, 720];
  router.setOverlays(rows.map((y, i) => ({ id: `c${i}`, _raw: { obstacle: true, position: [100, y], size: [120, 30], attachment: 'center' } })));
  const lines = rows.map((y, i) => makeLine(`line_${i}`, [160, y], [420, 300], { route: 'smart', anchor_side: 'right', attach_side: 'center', route_channels: ['wide'] }));
  const { results, passes } = runDiscoveryLoop(router, lines);
  assert.ok(passes <= (router._trunkDiscoveryMaxPasses ?? 4), `expected convergence within the pass cap, took ${passes} passes`);
  for (const line of lines) {
    assert.ok(results.get(line.id), `${line.id} should have a route result`);
  }
});

test('a bundle-entry corner with no siblings (single member) routes successfully with no coordination to apply', () => {
  const router = makeRouter({
    grid_resolution: 25,
    channels: {
      solo: { bounds: [400, 480, 40, 100], mode: 'force', direction: 'vertical', weight: 0.5, line_spacing: 8, discoverable: true }
    }
  }, {}, [0, 0, 900, 800]);
  router.setOverlays([{ id: 'c0', _raw: { obstacle: true, position: [100, 500], size: [120, 30], attachment: 'center' } }]);
  const line = makeLine('line_solo', [160, 500], [420, 300], { route: 'smart', anchor_side: 'right', attach_side: 'center', route_channels: ['solo'] });
  const { results } = runDiscoveryLoop(router, [line]);
  const result = results.get('line_solo');
  assert.ok(result, 'solo line should route successfully');
  // No coordination possible with zero siblings — this is purely a smoke
  // test that the mechanism doesn't error/no-op incorrectly when there's
  // nothing to coordinate against, not a specific value pin.
});
