/**
 * Chain-Aware Corridor Lane Consistency, Phase 2 (cross-line consistency):
 * two DIFFERENT lines, each individually self-consistent thanks to Phase 1
 * (see `chain-side-propagation.test.js`), can still land in a relative
 * order that doesn't compose when they anchor on different corridors —
 * Phase 1 propagates SIGN only, never the MAGNITUDE the same-side
 * tie-break actually compares (`_trunkLaneAssignment`'s `withinGroupCmp`/
 * `users.sort`). This file covers the mechanism that closes that gap:
 * `_bothGroundedAt` / `_locallyGrounded` / `_coOccurringOtherCorridors` /
 * `_pairwiseCrossCorridorOrder` (RouterCore.js).
 *
 * The adversarial scenario below was constructed and verified the same
 * way this session's own turn-handedness table was: NOT by trusting the
 * `pairOrderHandedness` algebra alone, but by running it through the real
 * routing pipeline and confirming a REAL crossing (present with today's
 * lexicographic-only fallback) is resolved to zero once the mechanism is
 * live — and, separately, that reverting the mechanism reproduces the
 * crossing. A first, unconditional version of this mechanism was ALSO
 * caught introducing a real regression (6 crossings in
 * `kelvin-bundle-crossing.test.js`'s own 4-line bundle) before landing —
 * see the `groupSize` restriction below and `_sameSideOrder`'s own
 * docblock for why.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { makeRouter, makeLine, runDiscoveryLoop, countRenderedCrossings } from './helpers/router-harness.js';

/** Two force channels sharing no config beyond direction/position — used by every direct-fixture test below. */
function twoForceChannels() {
  return makeRouter({
    grid_resolution: 8, trunk_proximity: 50,
    channels: {
      chan_x: { bounds: [100, 90, 200, 20], mode: 'force', direction: 'horizontal', line_spacing: 10 },
      chan_y: { bounds: [290, 300, 20, 200], mode: 'force', direction: 'vertical', line_spacing: 10 },
    }
  }, {}, [0, 0, 900, 900]);
}

/**
 * Registers two lines with GENUINE (not coincidental) 2-corridor chains
 * [chan_x, chan_y], both canonically anchored at chan_y (grounded there,
 * ungrounded at chan_x) but with real, DIFFERENT canonical leans at
 * chan_y — engineered so their own LOCAL lean at chan_x (untrusted, since
 * ungrounded) disagrees in relative order with their real, grounded lean
 * at chan_y. This is the literal shape of the confirmed gap: two lines
 * chained through the same two corridors, same-side at one of them,
 * order-inconsistent between the two.
 * @returns {{router: object, rowX: object, rowY: object}}
 */
function adversarialFixture() {
  const router = twoForceChannels();
  const X = router._trunks.find(t => t.id === 'chan_x');
  const Y = router._trunks.find(t => t.id === 'chan_y');
  const rawA_a = [-500, 90], rawB_a = [305, 540]; // canonical (chan_y) lean = 5, local (chan_x) lean = 440
  const rawA_b = [-500, 92], rawB_b = [350, 505]; // canonical (chan_y) lean = 50, local (chan_x) lean = 405
  const chainSidesA = router._chainSideAssignment([X, Y], 'line_a', rawA_a, rawB_a);
  const chainSidesB = router._chainSideAssignment([X, Y], 'line_b', rawA_b, rawB_b);
  router._mergeOrRegisterTrunk('line_a', 0, [100, 95], [300, 95], true, null, null, rawA_a, rawB_a, null, chainSidesA);
  router._mergeOrRegisterTrunk('line_a', 1, [295, 300], [295, 500], false, null, null, rawA_a, rawB_a, null, chainSidesA);
  router._mergeOrRegisterTrunk('line_b', 0, [100, 105], [300, 105], true, null, null, rawA_b, rawB_b, null, chainSidesB);
  router._mergeOrRegisterTrunk('line_b', 1, [305, 300], [305, 500], false, null, null, rawA_b, rawB_b, null, chainSidesB);
  return { router, rowX: router._trunks.find(t => t.id === 'chan_x'), rowY: router._trunks.find(t => t.id === 'chan_y') };
}

test('adversarial fixture: both lines are ungrounded at chan_x, grounded at chan_y — the confirmed gap shape', () => {
  const { router, rowX, rowY } = adversarialFixture();
  assert.equal(router._bothGroundedAt(rowX, 'line_a', 'line_b'), false, 'chan_x is not either line\'s own canonical anchor');
  assert.equal(router._locallyGrounded(rowY, 'line_a'), true);
  assert.equal(router._locallyGrounded(rowY, 'line_b'), true);
  assert.deepEqual(router._coOccurringOtherCorridors(rowX, 'line_a', 'line_b').map(t => t.id), ['chan_y']);
});

test('_pairwiseCrossCorridorOrder resolves order at chan_x from chan_y\'s own real (grounded) magnitudes, disagreeing with chan_x\'s own untrusted local order', () => {
  const { router, rowX } = adversarialFixture();
  // Local (untrusted) magnitude at chan_x: |440| > |405| -> naive order would put line_b first (inner).
  // Real (grounded) magnitude at chan_y: |5| < |50| -> line_a is genuinely closer to center.
  // The resolved order must follow chan_y's real magnitude, not chan_x's local one.
  const order = router._pairwiseCrossCorridorOrder(rowX, 'line_a', 'line_b');
  assert.ok(order < 0, `line_a must sort before line_b (real order from chan_y), got ${order}`);
  const reversed = router._pairwiseCrossCorridorOrder(rowX, 'line_b', 'line_a');
  assert.equal(reversed, -order, 'the comparator must be antisymmetric');
});

test('the resolved lane assignment at chan_x follows the pairwise order, not lexicographic', () => {
  // Config-channel offsets are CENTERED ((i-(n-1)/2)*spacing) — for
  // exactly 2 same-side members this always gives equal-magnitude,
  // opposite-sign offsets regardless of which one sorts first, so the
  // meaningful check here is ORDER (which one lands at the negative,
  // lower-index slot), not magnitude (see the discovered-trunk analogue
  // test below for a case where magnitude itself is the meaningful
  // signal, via that branch's own non-centered offset formula).
  const { router, rowX } = adversarialFixture();
  const a = router._trunkLaneAssignment(rowX, 'line_a');
  const b = router._trunkLaneAssignment(rowX, 'line_b');
  assert.ok(a.offset < b.offset, 'line_a (real chan_y lean 5) must sort before line_b (real chan_y lean 50), not by lineId');
});

test('reported-shape regression, real pipeline: two ordinary config-channel joiners chained through the same two corridors render with zero crossings', () => {
  // Same numeric fixture as adversarialFixture() above, but run through the
  // FULL pipeline (buildRouteRequest/computePath/discovery loop) rather
  // than direct registry construction — confirms the mechanism resolves a
  // REAL rendered crossing, not just an internal comparator value.
  const router = makeRouter({
    grid_resolution: 8, trunk_proximity: 50,
    channels: {
      chan_x: { bounds: [100, 90, 200, 20], mode: 'prefer', direction: 'horizontal', line_spacing: 10, discoverable: true },
      chan_y: { bounds: [290, 300, 20, 200], mode: 'force', direction: 'vertical', line_spacing: 10, discoverable: true },
    }
  }, {}, [-600, -100, 1500, 1000]);
  const chan = ['chan_x', 'chan_y'];
  const lines = [
    makeLine('line_a', [-500, 90], [305, 540], { anchor_side: 'right', attach_side: 'bottom', route_channels: chan }),
    makeLine('line_b', [-500, 92], [350, 505], { anchor_side: 'right', attach_side: 'bottom', route_channels: chan }),
  ];
  const { results } = runDiscoveryLoop(router, lines);
  const crossings = countRenderedCrossings(results.get('line_a').pts, results.get('line_b').pts);
  assert.equal(crossings, 0, `expected zero crossings once chain-consistent order is used, got ${crossings}`);
});

test('discovered-trunk analogue: the identical adversarial shape, via two discovered trunks instead of config channels (Finding 1 coverage)', () => {
  const router = makeRouter({ grid_resolution: 8, trunk_proximity: 50 }, {}, [0, 0, 900, 900]);
  router._mergeOrRegisterTrunk('creator_h', 0, [0, 100], [900, 100], true);
  const rowX = router._trunks.find(t => t.id === 'trunk:creator_h:0');
  const Y_ID = 'trunk:line_a:1'; // line_a's own 2nd run creates this trunk — its id is deterministic
  const rawA_a = [-500, 90], rawB_a = [305, 540];
  const rawA_b = [-500, 92], rawB_b = [350, 505];
  const yPlaceholder = { id: Y_ID, direction: 'vertical', x1: 290, x2: 310, y1: 300, y2: 500, crossCenter: 300 };
  const chainSidesA = router._chainSideAssignment([rowX, yPlaceholder], 'line_a', rawA_a, rawB_a);
  const chainSidesB = router._chainSideAssignment([rowX, yPlaceholder], 'line_b', rawA_b, rawB_b);

  router._mergeOrRegisterTrunk('line_a', 0, [100, 95], [300, 95], true, null, null, rawA_a, rawB_a, null, chainSidesA);
  router._mergeOrRegisterTrunk('line_a', 1, [295, 300], [295, 500], false, null, null, rawA_a, rawB_a, null, chainSidesA);
  const rowY = router._trunks.find(t => t.id === Y_ID);
  router._mergeOrRegisterTrunk('line_b', 0, [100, 105], [300, 105], true, null, null, rawA_b, rawB_b, null, chainSidesB);
  router._mergeOrRegisterTrunk('line_b', 1, [rowY.crossCenter, 300], [rowY.crossCenter, 500], false, null, null, rawA_b, rawB_b, null, chainSidesB);

  const rowXlive = router._trunks.find(t => t.id === 'trunk:creator_h:0');
  assert.equal(router._bothGroundedAt(rowXlive, 'line_a', 'line_b'), false);
  const order = router._pairwiseCrossCorridorOrder(rowXlive, 'line_a', 'line_b');
  assert.ok(order < 0, `line_a must resolve before line_b at the discovered trunk too, got ${order}`);
  const a = router._trunkLaneAssignment(rowXlive, 'line_a');
  const b = router._trunkLaneAssignment(rowXlive, 'line_b');
  assert.ok(Math.abs(a.offset) < Math.abs(b.offset), 'line_a must land closer to the creator\'s centerline than line_b');
});

test('groupSize restriction: a pairwise resolution is only ever attempted for an exactly-2-member same-side bucket', () => {
  const { router, rowX } = adversarialFixture();
  // Directly probe _sameSideOrder with an inflated groupSize (as if a
  // 3rd same-side line were present) — must fall through to lexicographic
  // instead of attempting _pairwiseCrossCorridorOrder, matching the
  // confirmed real regression this restriction exists to prevent (see
  // this file's own docblock and _sameSideOrder's own groupSize comment).
  const leanOf = (id) => rowX.members?.get(id)?.[4] ?? Infinity;
  const twoMember = router._sameSideOrder(rowX, 'line_a', 'line_b', leanOf, 2);
  const threeMember = router._sameSideOrder(rowX, 'line_a', 'line_b', leanOf, 3);
  assert.notEqual(twoMember, 0, 'sanity: the 2-member case must actually resolve something (matches _pairwiseCrossCorridorOrder\'s own real value)');
  assert.equal(threeMember, -1, 'a 3-member group must fall through to plain lexicographic order (line_a < line_b) instead of attempting pairwise resolution');
});

test('kelvin-bundle-crossing 4-line bundle stays crossing-free with the pairwise mechanism live (regression guard)', () => {
  // The exact scenario that caught the groupSize regression during this
  // mechanism's own development: before the groupSize===2 restriction
  // (_sameSideOrder), enabling pairwise resolution unconditionally
  // produced 6 real crossings here — different pairs within the same
  // 4-line same-side bucket resolved via different, mutually-inconsistent
  // seeds. kelvin-bundle-crossing.test.js itself already covers this
  // scenario in detail; this is a standing tripwire specifically for the
  // Phase 2 mechanism, kept beside its own dedicated tests rather than
  // relying on a reader to know that file is also, implicitly, this
  // mechanism's highest-risk regression surface.
  const router = makeRouter({
    grid_resolution: 32, trunk_proximity: 50,
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
  const { results } = runDiscoveryLoop(router, lines);
  const ids = ['line_3', 'line_4', 'line_5', 'line_6'];
  let crossings = 0;
  for (let i = 0; i < ids.length; i++) {
    for (let j = i + 1; j < ids.length; j++) {
      crossings += countRenderedCrossings(results.get(ids[i]).pts, results.get(ids[j]).pts);
    }
  }
  assert.equal(crossings, 0, 'the 4-line same-side bundle must stay crossing-free with the pairwise mechanism engaged');
});

test('convergence: two independent fresh-router runs of the adversarial pipeline scenario reach byte-identical geometry', () => {
  function run() {
    const router = makeRouter({
      grid_resolution: 8, trunk_proximity: 50,
      channels: {
        chan_x: { bounds: [100, 90, 200, 20], mode: 'prefer', direction: 'horizontal', line_spacing: 10, discoverable: true },
        chan_y: { bounds: [290, 300, 20, 200], mode: 'force', direction: 'vertical', line_spacing: 10, discoverable: true },
      }
    }, {}, [-600, -100, 1500, 1000]);
    const chan = ['chan_x', 'chan_y'];
    const lines = [
      makeLine('line_a', [-500, 90], [305, 540], { anchor_side: 'right', attach_side: 'bottom', route_channels: chan }),
      makeLine('line_b', [-500, 92], [350, 505], { anchor_side: 'right', attach_side: 'bottom', route_channels: chan }),
    ];
    return runDiscoveryLoop(router, lines);
  }
  const a = run();
  const b = run();
  assert.equal(a.results.get('line_a').d, b.results.get('line_a').d);
  assert.equal(a.results.get('line_b').d, b.results.get('line_b').d);
  assert.ok(a.passes <= 4, 'must converge within the discovery pass cap');
});
