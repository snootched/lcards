/**
 * Router bugs found by the D2 docs audit (2026-11-08): a channel's own
 * line_spacing (object form) was dropped (always 8); a control placed by
 * anchor name, or without a size, was never an obstacle; corner_radius 0
 * became 34; a smoothing mode with no iterations did nothing.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { makeRouter, makeLine, runDiscoveryLoop, longestHorizontalRun, routeLine } from './helpers/router-harness.js';

test('a channel\'s line_spacing sets the gap between its lanes', () => {
  const router = makeRouter({
    channels: { chan_h: { bounds: [200, 60, 200, 80], mode: 'force', direction: 'horizontal', line_spacing: 20 } }
  });
  const lines = ['line_p', 'line_q', 'line_r'].map((id) => makeLine(id, [50, 100], [550, 100], { route_channels: ['chan_h'] }));
  const { results } = runDiscoveryLoop(router, lines);
  const lanes = lines.map((l) => longestHorizontalRun(results.get(l.id).pts).y);
  assert.deepEqual(lanes, [80, 100, 120]);
});

test('a control placed by anchor name is an obstacle; without a size it is 100 x 100', () => {
  const router = makeRouter({}, { bridge: [300, 150] });
  router.setOverlays([{ id: 'ctl', _raw: { id: 'ctl', type: 'control', position: 'bridge', obstacle: true } }]);
  const obs = router._obstacles.find((o) => o.id === 'ctl');
  assert.ok(obs, 'registered as an obstacle');
  assert.deepEqual([obs.x1, obs.y1, obs.x2, obs.y2], [250, 100, 350, 200]);
});

test('corner_radius 0 gives square corners (it became 34)', () => {
  const router = makeRouter();
  const req = router.buildRouteRequest(makeLine('l0', [50, 50], [300, 200], { route: 'manhattan', corner_radius: 0 }), [50, 50], [300, 200]);
  assert.equal(req.cornerRadius, 0);
  const d = routeLine(router, makeLine('l0', [50, 50], [300, 200], { route: 'manhattan', corner_radius: 0 })).d;
  assert.doesNotMatch(d, /[AQC]/i, `no arcs or curves in ${d}`);
});

test('a smoothing mode with no iterations smooths once; no mode, none', () => {
  const router = makeRouter();
  const withMode = router.buildRouteRequest(makeLine('s1', [50, 50], [300, 200], { smoothing_mode: 'chaikin' }), [50, 50], [300, 200]);
  assert.equal(withMode.smoothingMode, 'chaikin');
  assert.equal(withMode.smoothingIterations, 1);
  const plain = router.buildRouteRequest(makeLine('s2', [50, 50], [300, 200]), [50, 50], [300, 200]);
  assert.equal(plain.smoothingIterations, 0);
});

// The "Bundling" docs example: three lines through the gap between two
// obstacles at grid_resolution 25. The lane at y=174 sits in a grid cell that
// touches the lower obstacle's clearance band, so the search detoured off the
// lane onto a_x's own track, and c_z was drawn on top of a_x (two lines, one
// lane). The ride along a lane is now straight when the lane itself is clear.
test('three lines bundled through a gap each get their own lane', () => {
  const router = makeRouter({ grid_resolution: 25, trunk_line_spacing: 12, clearance: 8 });
  router.setOverlays([
    { id: 'top', _raw: { id: 'top', type: 'control', position: [300, 55], size: [100, 110], obstacle: true } },
    { id: 'bot', _raw: { id: 'bot', type: 'control', position: [300, 245], size: [100, 110], obstacle: true } }
  ]);
  const side = { anchor_side: 'right', attach_side: 'left', route: 'smart' };
  const lines = [
    makeLine('a_x', [120, 40], [480, 40], side),
    makeLine('b_y', [120, 150], [480, 150], side),
    makeLine('c_z', [120, 260], [480, 260], side)
  ];
  const { results } = runDiscoveryLoop(router, lines);
  const lanes = lines.map((l) => longestHorizontalRun(results.get(l.id).pts).y);
  assert.equal(new Set(lanes).size, 3, `three different lanes, got ${lanes}`);
  // and every lane is inside the gap (118 to 182 with clearance)
  for (const y of lanes) assert.ok(y > 118 && y < 182, `lane ${y} is in the gap`);
});
