/**
 * `_corridorDelta`'s 'prefer' discount (distance ridden * trunk_bundle_weight,
 * default 0.5/unit) was architecturally unbounded: since bendsWeight
 * (cost_defaults.bend, a FLAT 10/bend) never scales with ride length, a
 * sufficiently long auto-joined ride could in principle "buy" an arbitrary
 * number of extra local bends elsewhere in the same route, regardless of
 * whether those bends had anything to do with the corridor itself.
 * Originally shipped at a conservative 2000 (no concrete reported config
 * demonstrated the failure mode yet — see project memory). One now does: a
 * line with no need to bundle at all detoured 3 extra bends (+30 flat cost)
 * into an unrelated discovered trunk purely to farm a ~587px ride's discount
 * (-293.5 at weight 0.5) — an 8.75x return that made its own honest,
 * simpler plain route look costlier. Default lowered to 150, confirmed via
 * direct cost-comparison instrumentation (not just resulting shape) to
 * restore the plain route as cheapest for that case.
 *
 * Second instance of the SAME farming pattern reported shortly after,
 * through a different door: a `discoverable: true` config channel that a
 * line never listed in its own `route_channels` is exactly as automatic a
 * join, from that line's own perspective, as a genuinely-discovered trunk —
 * but the cap used to key off `chan.origin === 'discovered'`, so a
 * discoverable CHANNEL a line auto-joined skipped the cap entirely (its
 * origin is 'channel', not 'discovered'), reproducing the identical
 * unnecessary-detour/squashed-corner symptom through an unrelated code
 * path. Re-keyed onto `_autoJoined` (set by `_mergeCorridors` on every
 * entry a line did NOT itself request — see that method's own comment) so
 * it correctly tracks "was this specific line's join deliberate," not "is
 * the underlying row's origin user-authored." A line's own explicitly
 * listed route_channels are never tagged `_autoJoined` regardless of the
 * channel's own origin, so a deliberate, user-authored chain's length is
 * still never second-guessed.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { makeRouter } from './helpers/router-harness.js';

function chan(overrides) {
  return { id: 'trunk:x:0', mode: 'prefer', x1: 0, y1: 90, x2: 5000, y2: 110, weight: 0.5, origin: 'discovered', _autoJoined: true, ...overrides };
}

test("an auto-joined discovered trunk's own discount stops growing past trunk_bundle_discount_cap", () => {
  const router = makeRouter();
  // A single straight ride of 5000 units — the whole route is "inside".
  const pts = [[0, 100], [5000, 100]];
  const { delta: cappedDelta } = router._corridorDelta(pts, [chan()]);
  assert.equal(cappedDelta, -(router._trunkBundleDiscountCap * 0.5),
    `expected the discount to stop at the cap, got ${cappedDelta}`);

  // Doubling the ride length must NOT double the discount past the cap.
  const pts2 = [[0, 100], [9998, 100]];
  const { delta: cappedDelta2 } = router._corridorDelta(pts2, [chan({ x2: 10000 })]);
  assert.equal(cappedDelta2, cappedDelta, 'a much longer ride past the cap must not increase the discount further');
});

test('a genuine, realistic ride length (well under the cap) is unaffected — still linear', () => {
  const router = makeRouter();
  const pts = [[0, 100], [50, 100]];
  const { delta } = router._corridorDelta(pts, [chan({ x2: 150 })]);
  assert.equal(delta, -(50 * 0.5), 'a ride well under the cap should be credited in full, unchanged from before this fix');
});

test("an explicitly-referenced channel (this line's own route_channels) is never capped, regardless of origin", () => {
  const router = makeRouter();
  const pts = [[0, 100], [5000, 100]];
  const { delta } = router._corridorDelta(pts, [chan({ origin: 'channel', _autoJoined: false })]);
  assert.equal(delta, -(5000 * 0.5), "a line's own deliberately-listed channel is never second-guessed here");
});

test('a discoverable config channel auto-joined by a line that never referenced it IS capped, same as a discovered trunk', () => {
  // Reported live: channel_4 (discoverable: true, never listed in either
  // line_2's or line_7's own route_channels) got ridden in full regardless
  // of length purely because its row's origin is 'channel' — this is the
  // exact scenario that reproduced, via a config channel instead of a
  // discovered trunk.
  const router = makeRouter();
  const pts = [[0, 100], [5000, 100]];
  const { delta } = router._corridorDelta(pts, [chan({ origin: 'channel', _autoJoined: true })]);
  assert.equal(delta, -(router._trunkBundleDiscountCap * 0.5),
    "a config channel this line never requested must be capped exactly like a discovered trunk");
});
