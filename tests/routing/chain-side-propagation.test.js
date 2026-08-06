/**
 * Chain-Aware Corridor Lane Consistency, Phase 1 (self-consistency
 * propagation) — Stage 0: dedicated unit tests for the new PURE helpers
 * (_chainCorridorRef, _chainFlowSign, _chainKFactor, _naturalLeanAt,
 * _chainCanonicalIndex, _chainSideAssignment, corridorFlowFactor), called
 * directly against hand-built fixtures. Nothing in the live routing
 * pipeline calls any of this yet (see RouterCore.js's own docblocks on
 * these methods) — that wiring is Stage 1. These tests exist so Stage 1's
 * wiring can be verified against an already-independently-checked
 * mechanism, rather than debugging the math and the pipeline integration
 * at the same time.
 *
 * The turn-handedness table below was verified TWICE, independently, the
 * same way this session's own design process caught (and corrected) a
 * wrong hand-derivation of turn handedness: not by trusting the closed-
 * form corridorFlowFactor algebra alone, but by literally constructing
 * two lines' own polylines per the formula's prescription and confirming
 * zero crossings, AND confirming the FLIPPED assignment produces a real
 * one — for all 4 flow-direction combinations, not just the one reported
 * case (see the file this test lives beside, kelvin-bundle-crossing.test.js,
 * and this repo's own project memory on the CW/CCW correction).
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { makeRouter, countRenderedCrossings } from './helpers/router-harness.js';

/** Horizontal corridor H (flow=x, centerline y=100) feeding a vertical corridor V (flow=y, centerline x=300). */
function twoCorridorChain() {
  return [
    { id: 'chan_h', direction: 'horizontal', x1: 100, x2: 300, y1: 90, y2: 110, crossCenter: 100 },
    { id: 'chan_v', direction: 'vertical', x1: 290, x2: 310, y1: 300, y2: 500, crossCenter: 300 }
  ];
}

test('turn-handedness table: all 4 flow-direction combinations are crossing-free as prescribed, and cross when flipped', () => {
  const router = makeRouter();
  // rawAx controls flowSign at chan_h (east: far west of it, west: just
  // past its far boundary — see _chainFlowSign, which measures rawA
  // against chan_v's own reference point, not chan_h's own bounds).
  // rawB is kept comfortably far from BOTH chan_h's and chan_v's own
  // boundaries in the axis _naturalLeanAt/_chainCanonicalIndex each read,
  // so canonical robustly resolves to chan_h (index 0) via rawA in every
  // combination, regardless of rawA's own y (which is what's actually
  // varied to produce the NORTH/SOUTH lean below) — landing rawB exactly
  // AT a corridor boundary (distance 0) was tried first and silently
  // made _naturalLeanAt prefer rawB over rawA regardless of which line
  // was being asked about, masking the NORTH-vs-SOUTH distinction
  // entirely (both resolved to the same, rawB-driven side) — caught only
  // by cross-checking against the independently-verified geometric table
  // below, not by inspecting the formula's output in isolation.
  const combos = [
    { flowHLabel: 'east', flowVLabel: 'south', rawAx: 50, rawB: [900, 700], expectNorth: 'east', expectSouth: 'west' },
    { flowHLabel: 'east', flowVLabel: 'north', rawAx: 50, rawB: [900, -300], expectNorth: 'west', expectSouth: 'east' },
    { flowHLabel: 'west', flowVLabel: 'south', rawAx: 310, rawB: [900, 700], expectNorth: 'west', expectSouth: 'east' },
    { flowHLabel: 'west', flowVLabel: 'north', rawAx: 310, rawB: [900, -300], expectNorth: 'east', expectSouth: 'west' }
  ];
  for (const { flowHLabel, flowVLabel, rawAx, rawB, expectNorth, expectSouth } of combos) {
    const chain = twoCorridorChain();
    // rawA.y drives chan_h's own canonicalLean sign directly (chan_h's
    // cross axis is y, centerline 100): 90 -> lean -10 (NORTH), 110 ->
    // lean +10 (SOUTH).
    const rawA_N = [rawAx, 90], rawA_S = [rawAx, 110];
    assert.equal(router._chainCanonicalIndex(chain, rawA_N, rawB), 0, `${flowHLabel}->${flowVLabel}: sanity, canonical must resolve to chan_h`);
    assert.equal(router._chainCanonicalIndex(chain, rawA_S, rawB), 0, `${flowHLabel}->${flowVLabel}: sanity, canonical must resolve to chan_h`);
    const hintN = router._chainSideAssignment(chain, 'line_n', rawA_N, rawB);
    const hintS = router._chainSideAssignment(chain, 'line_s', rawA_S, rawB);
    const sideNAtV = hintN.get('chan_v').side;
    const sideSAtV = hintS.get('chan_v').side;
    const label = (s) => (s < 0 ? 'west' : 'east');
    assert.equal(label(sideNAtV), expectNorth, `${flowHLabel}->${flowVLabel}: NORTH-at-H should propagate to ${expectNorth} at V`);
    assert.equal(label(sideSAtV), expectSouth, `${flowHLabel}->${flowVLabel}: SOUTH-at-H should propagate to ${expectSouth} at V`);

    // Literal geometry check: build each line's own direct 2-bend elbow
    // (own H-offset y -> own V-offset x -> far V endpoint) per the
    // PRESCRIBED assignment, and per the FLIPPED (opposite) one, and
    // confirm only the prescribed one is crossing-free.
    const startX = flowHLabel === 'east' ? 50 : 550;
    const vFarY = flowVLabel === 'south' ? 500 : -100;
    const vx = (side) => (side < 0 ? 290 : 310);
    const buildElbow = (hY, side) => [[startX, hY], [vx(side), hY], [vx(side), vFarY]];

    const prescribed = countRenderedCrossings(buildElbow(90, sideNAtV), buildElbow(110, sideSAtV));
    const flipped = countRenderedCrossings(buildElbow(90, -sideNAtV), buildElbow(110, -sideSAtV));
    assert.equal(prescribed, 0, `${flowHLabel}->${flowVLabel}: prescribed side assignment must be crossing-free`);
    assert.equal(flipped, 1, `${flowHLabel}->${flowVLabel}: the flipped assignment must actually cross (confirms this isn't a vacuous check)`);
  }
});

test('same-axis chain degrades to identity: propagated side matches the canonical corridor\'s own local sign at every other same-axis member, no special-casing', () => {
  const router = makeRouter();
  // Two horizontal corridors in sequence, both flow=x — a straight-through
  // same-direction chain. k should be identical at every member (kA===kB),
  // so the propagated side/lean at the non-canonical corridor exactly
  // equals what a bare Math.sign(naturalLean) would already give locally.
  const chain = [
    { id: 'chan_h1', direction: 'horizontal', x1: 100, x2: 200, y1: 90, y2: 110, crossCenter: 100 },
    { id: 'chan_h2', direction: 'horizontal', x1: 250, x2: 350, y1: 90, y2: 110, crossCenter: 100 }
  ];
  const rawA = [50, 92]; // leans slightly north (lean=-8) at chan_h1, the canonical (closer) end
  const rawB = [400, 92]; // same lean at chan_h2 too — genuinely straight-through
  const assign = router._chainSideAssignment(chain, 'line_x', rawA, rawB);
  assert.equal(assign.get('chan_h1').side, -1);
  assert.equal(assign.get('chan_h2').side, -1, 'same-axis, same-direction chain must not flip side');
  assert.equal(assign.get('chan_h1').k, assign.get('chan_h2').k, 'k must be identical across a same-axis chain (no special-casing needed)');
});

test('transform is its own inverse: propagating A->B then treating the result as B\'s own local lean and propagating B->A recovers the original lean exactly', () => {
  // Tests the underlying algebra directly (k is always -1/0/+1, so k*k===1
  // whenever k is nonzero — corridorFlowFactor's own multiplication is
  // self-inverse by construction) rather than through _chainSideAssignment's
  // automatic canonical-corridor SELECTION, which — being a genuine
  // decision based on real geometry — has no "pick the other end instead"
  // mode to compare against for one fixed rawA/rawB pair.
  const router = makeRouter();
  const chain = twoCorridorChain();
  const rawA = [95, 85], rawB = [150, 800];
  const kH = router._chainKFactor(chain, 0, rawA, rawB);
  const kV = router._chainKFactor(chain, 1, rawA, rawB);
  assert.notEqual(kH, 0);
  assert.notEqual(kV, 0);
  const leanH = router._naturalLeanAt(chain[0], rawA, rawB);
  const offsetRelFromH = leanH * kH;
  const leanVPropagated = offsetRelFromH * kV;
  // Now treat leanVPropagated as if it were chan_v's own freshly-measured
  // local lean, and propagate BACK to chan_h via the identical formula.
  const offsetRelFromV = leanVPropagated * kV;
  const leanHRecovered = offsetRelFromV * kH;
  assert.equal(leanHRecovered, leanH, 'propagating A->B->A must recover the exact original lean');
});

test('_chainSideAssignment returns null for a single-corridor chain (nothing to propagate to)', () => {
  // Deliberately null, not a trivial real entry — see _chainSideAssignment's
  // own docblock for why a "compute it anyway" version was tried and
  // reverted (too broad a blast radius on plain-vs-corridor cost
  // comparisons for every solo-trunk candidate in the routing pipeline).
  const router = makeRouter();
  const chain = [{ id: 'chan_h', direction: 'horizontal', x1: 100, x2: 300, y1: 90, y2: 110, crossCenter: 100 }];
  assert.equal(router._chainSideAssignment(chain, 'line_x', [50, 90], [400, 90]), null);
});

test('_chainSideAssignment returns null when a raw endpoint is missing', () => {
  const router = makeRouter();
  const chain = twoCorridorChain();
  assert.equal(router._chainSideAssignment(chain, 'line_x', null, [300, 500]), null);
  assert.equal(router._chainSideAssignment(chain, 'line_x', [50, 90], null), null);
});

test('3-corridor chain anchors at the FIRST corridor when rawA sits closer to it than rawB sits to the last', () => {
  const router = makeRouter();
  const chain = [
    { id: 'chan_1', direction: 'horizontal', x1: 100, x2: 200, y1: 90, y2: 110, crossCenter: 100 },
    { id: 'chan_2', direction: 'vertical', x1: 290, x2: 310, y1: 200, y2: 300, crossCenter: 300 },
    { id: 'chan_3', direction: 'horizontal', x1: 400, x2: 600, y1: 290, y2: 310, crossCenter: 300 }
  ];
  const rawA = [102, 90]; // 2 units from chan_1's own x-boundary — very close
  const rawB = [900, 300]; // 300 units from chan_3's own x-boundary (600) — far
  assert.equal(router._chainCanonicalIndex(chain, rawA, rawB), 0, 'rawA is far closer to chan_1 than rawB is to chan_3');
  const assign = router._chainSideAssignment(chain, 'line_x', rawA, rawB);
  // canonicalLean at chan_1 (cross axis y, centerline 100): 90-100 = -10 (north)
  assert.equal(assign.get('chan_1').lean, -10);
});

test('3-corridor chain anchors at the LAST corridor when rawB sits closer to it than rawA sits to the first', () => {
  const router = makeRouter();
  const chain = [
    { id: 'chan_1', direction: 'horizontal', x1: 100, x2: 200, y1: 90, y2: 110, crossCenter: 100 },
    { id: 'chan_2', direction: 'vertical', x1: 290, x2: 310, y1: 200, y2: 300, crossCenter: 300 },
    { id: 'chan_3', direction: 'horizontal', x1: 400, x2: 600, y1: 290, y2: 310, crossCenter: 300 }
  ];
  const rawA = [-200, 90]; // 300 units from chan_1's own boundary (100) — far
  const rawB = [602, 320]; // 2 units from chan_3's own boundary (600) — very close
  assert.equal(router._chainCanonicalIndex(chain, rawA, rawB), 2, 'rawB is far closer to chan_3 than rawA is to chan_1');
  const assign = router._chainSideAssignment(chain, 'line_x', rawA, rawB);
  // canonicalLean at chan_3 (cross axis y, centerline 300): 320-300 = 20 (south)
  assert.equal(assign.get('chan_3').lean, 20);
});

test('canonical lean uses the structurally-correct raw endpoint directly, never re-derived via _naturalLeanAt\'s own distance comparison against a DISCOVERED TRUNK\'s oversized (creator-spanning) bounds', () => {
  // Reported live (the "Kelvin" line_2/line_7/channel_4 scenario this
  // whole mechanism was built for): a discovered trunk's own x1/x2/y1/y2
  // are the union of every member's registered span -- for the trunk's
  // OWN creator, that's its full end-to-end run, often far longer than a
  // joiner's own local traversal. _naturalLeanAt's "closer of rawA/rawB"
  // comparison, when applied directly to such an oversized span, can pick
  // a joiner's own textually-close-but-geometrically-irrelevant anchor
  // over its real, locally-relevant destination -- exactly the shape
  // reproduced here: trunk_v's own bounds span y:80-500 (mimicking a
  // creator's full run), rawA sits only 5 units from trunk_v's near edge
  // (80) while rawB sits 10 units from its far edge (500) -- close enough
  // that _naturalLeanAt alone would (wrongly) prefer rawA.
  const router = makeRouter();
  const chain = [
    { id: 'chan_h', direction: 'horizontal', x1: 100, x2: 300, y1: 90, y2: 110, crossCenter: 100 },
    { id: 'trunk_v', direction: 'vertical', x1: 390, x2: 410, y1: 80, y2: 500, crossCenter: 400 }
  ];
  const rawA = [50, 85];
  const rawB = [420, 490];
  // Sanity: _chainCanonicalIndex (a DIFFERENT comparison — each end
  // against its OWN corridor, not both raw endpoints against the SAME
  // canonical corridor) still correctly resolves trunk_v as canonical.
  assert.equal(router._chainCanonicalIndex(chain, rawA, rawB), 1);
  // Sanity: confirm _naturalLeanAt's OWN independent comparison really
  // would pick the wrong endpoint here, if it were still consulted —
  // this is the exact bug shape, not a hypothetical.
  const buggyLean = router._naturalLeanAt(chain[1], rawA, rawB);
  assert.equal(buggyLean, rawA[0] - 400, 'sanity: _naturalLeanAt alone would incorrectly prefer rawA here');

  const assign = router._chainSideAssignment(chain, 'line_x', rawA, rawB);
  const correctLean = rawB[0] - 400; // 420 - 400 = 20
  assert.equal(assign.get('trunk_v').lean, correctLean, 'must use rawB directly (the structurally-correct endpoint for the LAST corridor in the chain), not _naturalLeanAt\'s own re-derived (and here, wrong) choice');
  assert.notEqual(assign.get('trunk_v').lean, buggyLean, 'must NOT reproduce the confirmed live bug');
});

test('a genuinely degenerate canonical corridor (both chain neighbors project to the same flow coordinate) yields null, not a false side', () => {
  const router = makeRouter();
  // chan_v's own neighbors (rawA and chan_h2) both sit at x=300 — chan_v's
  // own flowSign is 0 (no real direction to derive from), so it can never
  // be trusted as canonical; construct rawA/rawB so canonical WOULD
  // resolve to chan_v (closer to its own boundary than the alternative)
  // and confirm the whole assignment safely bails out instead of guessing.
  const chain = [
    { id: 'chan_v', direction: 'vertical', x1: 290, x2: 310, y1: 90, y2: 110, crossCenter: 300 },
    { id: 'chan_h2', direction: 'horizontal', x1: 250, x2: 350, y1: 190, y2: 210, crossCenter: 200 }
  ];
  const rawA = [300, 200]; // chan_h2's own reference point sits at [300,200] too (flowMid=300, crossMid=200) -> chan_v's own flowSign (y-axis) is sign(200-200)=0
  const rawB = [900, 200];
  const canonicalIdx = router._chainCanonicalIndex(chain, rawA, rawB);
  assert.equal(canonicalIdx, 0, 'sanity: canonical resolves to chan_v here');
  // Math.sign(0) * -1 produces -0 in JS, not 0 — assert.equal (Object.is
  // semantics) would wrongly fail on that distinction, so compare with
  // plain === instead (which correctly treats -0 and 0 as equal here).
  assert.ok(router._chainKFactor(chain, 0, rawA, rawB) === 0, 'sanity: chan_v\'s own k is genuinely 0 (degenerate flow direction)');
  assert.equal(router._chainSideAssignment(chain, 'line_x', rawA, rawB), null);
});
