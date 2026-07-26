/**
 * `_corridorDelta`'s 'prefer' discount (distance ridden * trunk_bundle_weight,
 * default 0.5/unit) was architecturally unbounded: since bendsWeight
 * (cost_defaults.bend, a FLAT 10/bend) never scales with ride length, a
 * sufficiently long discovered-trunk ride could in principle "buy" an
 * arbitrary number of extra local bends elsewhere in the same route,
 * regardless of whether those bends had anything to do with the trunk
 * itself. No concrete reported config demonstrated this specific failure
 * mode (see project memory) — fixed as a conservative safety bound rather
 * than a tuned response to a reproduced bad route: DISCOVERED trunks
 * (never a user-authored 'prefer' channel, a deliberate config choice this
 * cap has no business second-guessing) now credit at most
 * `trunk_bundle_discount_cap` (default 2000, well beyond any realistic
 * single-viewBox corridor length) units of ride distance toward the
 * discount, however much further the actual ride extends.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { makeRouter } from './helpers/router-harness.js';

function chan(overrides) {
  return { id: 'trunk:x:0', mode: 'prefer', x1: 0, y1: 90, x2: 5000, y2: 110, weight: 0.5, origin: 'discovered', ...overrides };
}

test("a discovered trunk's own discount stops growing past trunk_bundle_discount_cap", () => {
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
  const pts = [[0, 100], [400, 100]];
  const { delta } = router._corridorDelta(pts, [chan({ x2: 500 })]);
  assert.equal(delta, -(400 * 0.5), 'a ride well under the cap should be credited in full, unchanged from before this fix');
});

test("a user-AUTHORED 'prefer' channel (origin:'channel', not a discovered trunk) is never capped", () => {
  const router = makeRouter();
  const pts = [[0, 100], [5000, 100]];
  const { delta } = router._corridorDelta(pts, [chan({ origin: 'channel' })]);
  assert.equal(delta, -(5000 * 0.5), "an explicit, user-authored channel's own length is a deliberate choice, not second-guessed here");
});
