/**
 * Manual-routed lines: an optional 3rd waypoint slot ([x, y, radius])
 * overrides that corner's own rounding radius (round) or chamfer size
 * (bevel), instead of the line-wide corner_radius applying uniformly to
 * every corner. Covers: the override is used at that corner and the line
 * default elsewhere, the override is still clamped by available room (a
 * ceiling, not a replacement of the existing room-adaptive behavior),
 * radius survives dedup of a coordinate-duplicate waypoint, bevel corners
 * get the same per-corner control, a named-anchor waypoint (which can't
 * carry a radius) still uses the line default, and a radius-only edit
 * (endpoints unchanged) doesn't serve a stale cached path.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { makeRouter, makeLine, routeLine } from './helpers/router-harness.js';

// The neighbor-clearance binary search (_estimateCornerRadii) always runs
// for an orthogonal corner once routeId is set, converging to within ~1e-5
// of the room-clamped target after 20 iterations rather than landing on it
// exactly — same tolerance precedent as matched-corner-arc-clearance.test.js.
function assertRadiusCloseTo(actual, expected, message) {
  assert.ok(Math.abs(actual - expected) < 0.01, `${message} (expected ~${expected}, got ${actual})`);
}

test('per-corner radius override is used at that corner, line default elsewhere', () => {
  const router = makeRouter();
  const result = routeLine(router, makeLine('line_override', [0, 0], [200, 100], {
    route: 'manual', corner_style: 'round', corner_radius: 34,
    waypoints: [[100, 0, 5], [100, 100]]
  }));
  assert.equal(result.cornerRadii.length, 2);
  assertRadiusCloseTo(result.cornerRadii[0].radius, 5, 'overridden corner should use its own radius, not the line default');
  assertRadiusCloseTo(result.cornerRadii[1].radius, 34, 'corner with no override should fall back to the line default');
});

test('per-corner override larger than available room is still clamped (ceiling, not a replacement)', () => {
  const router = makeRouter();
  const result = routeLine(router, makeLine('line_clamped', [0, 0], [20, 20], {
    route: 'manual', corner_style: 'round', corner_radius: 34,
    waypoints: [[20, 0, 100]] // both adjacent legs are only 20 long
  }));
  assert.equal(result.cornerRadii.length, 1);
  assertRadiusCloseTo(result.cornerRadii[0].radius, 10, 'a requested radius bigger than half the shortest adjacent leg must still clamp to that room, exactly like the global corner_radius does today');
});

test('a radius carried by a deduped waypoint survives onto the surviving point', () => {
  const router = makeRouter();
  const result = routeLine(router, makeLine('line_dedup', [0, 50], [200, 150], {
    route: 'manual', corner_style: 'round', corner_radius: 34,
    // [100,50] appears twice at the identical coordinate; only the second
    // carries a radius override — it must not be silently dropped just
    // because its point collapsed into the first's during dedup.
    waypoints: [[100, 50], [100, 50, 15], [100, 150]]
  }));
  assert.equal(result.pts.length, 4, 'the coordinate-duplicate waypoint should have collapsed into one point');
  assert.equal(result.cornerRadii.length, 2);
  assertRadiusCloseTo(result.cornerRadii[0].radius, 15, 'the radius carried by the dropped duplicate should survive onto the kept point');
  assertRadiusCloseTo(result.cornerRadii[1].radius, 34, 'the untouched corner should keep the line default');
});

test('corner_style: bevel also honors a per-corner size override', () => {
  const router = makeRouter();
  const baseline = routeLine(router, makeLine('line_bevel_base', [0, 0], [50, 100], {
    route: 'manual', corner_style: 'bevel', corner_radius: 20,
    waypoints: [[50, 0]]
  }));
  const overridden = routeLine(router, makeLine('line_bevel_override', [0, 0], [50, 100], {
    route: 'manual', corner_style: 'bevel', corner_radius: 20,
    waypoints: [[50, 0, 5]]
  }));
  assert.ok(baseline.meta.bevel, 'baseline should have produced a bevel cut');
  assert.ok(overridden.meta.bevel, 'overridden line should have produced a bevel cut');
  assert.ok(overridden.meta.bevel.trimPx < baseline.meta.bevel.trimPx,
    `overridden (smaller) per-corner size should trim less than the line-wide default, got override=${overridden.meta.bevel.trimPx} baseline=${baseline.meta.bevel.trimPx}`);
});

test('a named-anchor waypoint (no radius slot available) still uses the line default', () => {
  const router = makeRouter({}, { mid: [100, 100] });
  const result = routeLine(router, makeLine('line_anchor_mix', [0, 0], [200, 100], {
    route: 'manual', corner_style: 'round', corner_radius: 34,
    waypoints: [[100, 0, 5], 'mid']
  }));
  assert.equal(result.cornerRadii.length, 2);
  assertRadiusCloseTo(result.cornerRadii[0].radius, 5, 'the coordinate waypoint keeps its own override');
  assertRadiusCloseTo(result.cornerRadii[1].radius, 34, 'the named-anchor waypoint has no radius slot and should fall back to the line default');
});

test('changing a waypoint radius without moving it does not serve a stale cached path', () => {
  const router = makeRouter();
  const line = makeLine('line_stale', [0, 0], [200, 100], {
    route: 'manual', corner_style: 'round', corner_radius: 34,
    waypoints: [[100, 0, 5], [100, 100]]
  });
  const first = routeLine(router, line);
  assertRadiusCloseTo(first.cornerRadii[0].radius, 5, 'first route should reflect the initial radius');

  line._raw.waypoints[0][2] = 25;
  const second = routeLine(router, line);
  assertRadiusCloseTo(second.cornerRadii[0].radius, 25,
    'the second route (endpoints unchanged, only the waypoint radius changed) must not reuse the first call\'s cached path');
});
