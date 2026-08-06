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

test('config channel: SAME-side tie-break also uses geometry over lexicographic order, when safe', () => {
  // Reported live: a user found two same-side lines' relative lane order
  // determined purely by which line ID happened to sort first — geometry
  // (naturalSide) already resolves OPPOSITE-side disagreements (test
  // above), but a same-side WITHIN-bucket lexicographic gap remained,
  // identical in shape to lane-assignment.test.js's own discovered-trunk
  // fix ("within a shared side, geometry wins over lexicographic order
  // too"). line_a sorts FIRST lexicographically but leans far (|lean|=40);
  // line_z sorts LAST but leans only slightly (|lean|=8) — same side.
  // Neither line shares any OTHER corridor, so the geometric tie-break is
  // unconditionally safe here.
  const router = makeRouter({
    channels: { chan_h: { bounds: [200, 80, 200, 40], mode: 'force', direction: 'horizontal', line_spacing: 8 } }
  });
  const row = router._trunks.find(t => t.id === 'chan_h');
  router._registerLineSegments('line_a', [[200, 100], [280, 100]], [50, 140], [550, 100]);
  router._registerLineSegments('line_z', [[200, 100], [280, 100]], [50, 108], [550, 100]);

  assert.equal(router._trunkLaneAssignment(row, 'line_z').offset, -4, 'line_z leans only slightly -> inner lane, despite sorting last');
  assert.equal(router._trunkLaneAssignment(row, 'line_a').offset, 4, 'line_a leans far -> outer lane, despite sorting first');
});

test('config channel: same-side tie-break falls back to lexicographic when the pair also shares a differently-oriented corridor', () => {
  // The exact confirmed-regression shape (kelvin-bundle-crossing.test.js's
  // res=64 case) reproduced directly: line_a/line_z share BOTH a
  // horizontal channel (chan_h) and a vertical one (chan_v) — a single
  // connected path per line, so both runs register under real, matching
  // trunk-candidate geometry. Same lean setup as the test above (geometry
  // alone would put line_z first) — but because this exact pair ALSO
  // co-occurs in a differently-oriented corridor, chan_h's own local lean
  // can't be trusted to agree with chan_v's, so the tie-break must fall
  // back to the lexicographic order that stays consistent across both.
  const router = makeRouter({
    channels: {
      chan_h: { bounds: [200, 80, 200, 40], mode: 'force', direction: 'horizontal', line_spacing: 8 },
      chan_v: { bounds: [300, 80, 40, 300], mode: 'force', direction: 'vertical', line_spacing: 8 }
    }
  });
  const rowH = router._trunks.find(t => t.id === 'chan_h');
  router._registerLineSegments('line_a', [[200, 100], [320, 100], [320, 300]], [50, 140], [550, 100]);
  router._registerLineSegments('line_z', [[200, 100], [320, 100], [320, 300]], [50, 108], [550, 100]);
  const rowV = router._trunks.find(t => t.id === 'chan_v');
  assert.ok(rowV.members.has('line_a') && rowV.members.has('line_z'), 'both lines must actually be registered members of chan_v for this test to exercise the safety guard');

  assert.equal(router._trunkLaneAssignment(rowH, 'line_a').offset, -4, 'line_a sorts first lexicographically -> inner lane, geometry not trusted here');
  assert.equal(router._trunkLaneAssignment(rowH, 'line_z').offset, 4, 'line_z sorts last -> outer lane, geometry not trusted here');
});
