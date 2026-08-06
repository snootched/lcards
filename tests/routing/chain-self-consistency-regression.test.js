/**
 * Chain-Aware Corridor Lane Consistency, Phase 1 — dedicated regression
 * test for the SELF-consistency propagation itself (one line disagreeing
 * with its own multi-corridor chain), as distinct from
 * `pairwise-cross-corridor-order.test.js`'s coverage of the harder,
 * cross-LINE consistency problem (Phase 2).
 *
 * **The reported case, live** (the "Kelvin" ship base_svg config's own
 * `line_2`/`line_7`/`channel_4` pair — the exact scenario this whole
 * mechanism was designed against): `line_7` chains through `channel_4`
 * (prefer) then organically discovers and joins a vertical trunk `line_2`
 * itself creates. Confirmed as a REAL, live regression once this
 * mechanism first shipped (not caught by the synthetic test suite,
 * caught by the user's own HA testing): `_chainSideAssignment`'s
 * canonical-lean computation re-derived "which raw endpoint is closer"
 * via `_naturalLeanAt`'s own distance comparison against the CANONICAL
 * corridor's `x1/x2/y1/y2` — correct for `_mergeOrRegisterTrunk`'s own
 * per-RUN use (that corridor argument is always a specific line's own
 * about-to-be-registered SPAN), but wrong for a chain's canonical anchor,
 * which can be a DISCOVERED trunk whose bounds are the creator's own full
 * registered span. `line_7`'s anchor (never actually near this trunk)
 * read as "closer" to the trunk's oversized bounds than its real,
 * locally-relevant destination did, joining it on the WEST side when its
 * destination sat EAST — forcing it to cross back over `line_2`'s own
 * line. Fixed by using the canonical endpoint DIRECTLY
 * (`_chainCanonicalIndex` already resolved which one is structurally
 * adjacent — index 0 is always `rawA`, the last index always `rawB` —
 * there is no remaining ambiguity for `_naturalLeanAt`'s own comparison to
 * re-derive). Confirmed via the real pipeline: 2 rendered crossings before
 * the fix, 0 after, and `line_7` joins on the correct (destination-side)
 * lane.
 *
 * `kelvin-bundle-crossing.test.js`'s own scenario (four lines chained
 * through two AUTHORED config channels, never a discovered trunk) also
 * exercises Phase 1 end-to-end, but doesn't exercise this specific bug —
 * an authored channel's bounds are stable/user-configured, not skewed by
 * a creator's own span, so the two endpoint-selection methods happened to
 * already agree there.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { makeRouter, makeLine, runDiscoveryLoop, countRenderedCrossings } from './helpers/router-harness.js';

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

function line2Line7Scenario() {
  const router = makeRouter({
    trunk_proximity: 32, min_stub_length_factor: 0.1, grid_resolution: 25,
    channels: {
      channel_4: { bounds: [61.77, 75.55, 285.82, 99.96], mode: 'prefer', direction: 'auto', weight: 0.5, line_spacing: 8, discoverable: true },
    }
  }, {}, [-400, 0, 1490, 765]);
  router.setOverlays([
    { id: 'control_2', _raw: { obstacle: true, position: [-100, 150], size: [150, 50], attachment: 'center' } },
    { id: 'control_7', _raw: { obstacle: true, position: [-100, 100], size: [150, 50], attachment: 'center' } },
  ]);
  const lines = [
    makeLine('line_2', [-25, 150], [402.6763916015625, 390.563232421875], { route: 'smart', anchor_side: 'right', attach_side: 'center', route_hint_last: 'xy', style: { width: 4 } }),
    makeLine('line_7', [-25, 100], [427.5038146972656, 344.2950439453125], { route: 'smart', anchor_side: 'right', attach_side: 'center', route_channels: ['channel_4'], style: { width: 4 } }),
  ];
  return { router, ...runDiscoveryLoop(router, lines) };
}

test('reported case: line_7 joins line_2\'s own discovered trunk on the correct (destination) side, zero crossings', () => {
  const { router, results } = line2Line7Scenario();
  const line2 = results.get('line_2'), line7 = results.get('line_7');
  assert.equal(countRenderedCrossings(line2.pts, line7.pts), 0, 'line_7 must not cross back over line_2\'s own line to reach its destination');

  // line_7's real destination (427.5) sits EAST of line_2's own trunk
  // centerline (402.68) -- confirm it actually joined on that side, not
  // just that nothing visibly crosses (the crossing-free check alone
  // could in principle pass by accident at a different resolution).
  const rowTrunk = router._trunks.find(t => t.origin === 'discovered' && t.sourceLineId === 'line_2');
  assert.ok(rowTrunk, 'line_2 must have created a discovered vertical trunk');
  // pts[length-2] is the trunk-exit corner immediately before the final
  // jog to the true destination -- its x is the x line_7 actually rode
  // through the trunk on.
  const line7X = line7.pts[line7.pts.length - 2][0];
  assert.ok(line7X > rowTrunk.crossCenter, `line_7 must ride the EAST side of line_2's trunk (centerline ${rowTrunk.crossCenter}), got x=${line7X}`);
});

test('same scenario without any explicit route_channels chaining (single-corridor lines) never triggers propagation — chainSides stays null', () => {
  // Contrast case: a line whose OWN route never forms a 2+-corridor chain
  // must be completely unaffected by this mechanism (see
  // _chainSideAssignment's own length<2 early return) — confirmed
  // directly, not just inferred, since this is the overwhelming common
  // case across the whole routing test suite and a silent regression
  // here would be very broad.
  const router = makeRouter({ grid_resolution: 32 }, {}, [-200, 0, 1190, 765]);
  const line = makeLine('solo', [50, 100], [500, 400], { route: 'smart' });
  const result = router.computePath(router.buildRouteRequest(line, line.a, line.b));
  assert.equal(result.meta.chainSides ?? null, null);
});
