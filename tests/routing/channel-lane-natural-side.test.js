/**
 * Config-channel lane ordering used to be pure lineId lexicographic sort
 * (`_trunkLaneAssignment`'s `origin !== 'discovered'` branch), completely
 * ignoring the `naturalSide` data `_mergeOrRegisterTrunk` already records
 * for every member of every trunk row regardless of origin — the exact
 * signal the DISCOVERED-trunk branch already uses (see
 * `lane-assignment.test.js`'s "geometry wins over lexicographic order"
 * test, and `_mergeOrRegisterTrunk`'s own docblock: built specifically to
 * stop two joiners landing on opposite sides purely because of how their
 * ids happened to sort). Mirrors that same test, for a config channel
 * instead of a discovered trunk.
 *
 * Reported live: a user pointed out lexicographic ordering for a shared
 * `route_channels` corridor is "bound to create unnecessary crossovers" in
 * general, even though their own exact config happened to sort correctly
 * by luck. Fixed by sorting config-channel members by their own recorded
 * `naturalSide` first, lineId only as a tie-break on exact equality.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { makeRouter } from './helpers/router-harness.js';

test('config channel: geometry wins over lexicographic order when the two disagree', () => {
  // Horizontal channel, x:200-400, y:80-120 (cross-axis center 100) —
  // same shape as channel-lanes.test.js's own CHANNEL_CONFIG.
  const router = makeRouter({
    channels: { chan_h: { bounds: [200, 80, 200, 40], mode: 'force', direction: 'horizontal', line_spacing: 8 } }
  });
  const row = router._trunks.find(t => t.id === 'chan_h');

  // line_a sorts FIRST lexicographically but leans SOUTH/positive (raw
  // endpoints at y=108); line_z sorts LAST but leans NORTH/negative
  // (y=92). The old lineId-sort scheme would put line_a on the negative
  // lane and line_z on the positive lane — exactly backwards relative to
  // where each line's own real destination sits.
  router._registerLineSegments('line_a', [[200, 100], [280, 100]], [50, 108], [550, 108]);
  router._registerLineSegments('line_z', [[200, 100], [280, 100]], [50, 92], [550, 92]);

  assert.equal(router._trunkLaneAssignment(row, 'line_a').offset, 4, 'line_a leans south -> positive offset, despite sorting first');
  assert.equal(router._trunkLaneAssignment(row, 'line_z').offset, -4, 'line_z leans north -> negative offset, despite sorting last');
});

test('config channel: ties (no lean, or identical lean) still fall back to lexicographic order', () => {
  // Regression guard for channel-lanes.test.js's own 3-tied-at-zero-side
  // case: when naturalSide can't distinguish members, order must stay
  // deterministic and match the pre-fix lexicographic behavior.
  const router = makeRouter({
    channels: { chan_h: { bounds: [200, 80, 200, 40], mode: 'force', direction: 'horizontal', line_spacing: 8 } }
  });
  const row = router._trunks.find(t => t.id === 'chan_h');
  router._registerLineSegments('line_p', [[200, 100], [280, 100]], [50, 100], [550, 100]);
  router._registerLineSegments('line_q', [[200, 100], [280, 100]], [50, 100], [550, 100]);
  router._registerLineSegments('line_r', [[200, 100], [280, 100]], [50, 100], [550, 100]);

  assert.equal(router._trunkLaneAssignment(row, 'line_p').offset, -8);
  assert.equal(router._trunkLaneAssignment(row, 'line_q').offset, 0);
  assert.equal(router._trunkLaneAssignment(row, 'line_r').offset, 8);
});
