/**
 * Reported live (a `builtin:ncc-1701-kelvin` base_svg config, 4 controls, 3
 * lines): two DIFFERENT lines' rendered paths could fully, physically
 * overlap — run coincident along the same track for 40+ units, not just
 * cross — with line_1 detouring south then all the way back north purely
 * to ride a "trunk" that, for nearly its whole length, was really just
 * line_1 riding its OWN solo detour.
 *
 * Root cause: two independent "trunk-mates don't repel each other"
 * exemptions existed — one derived from LIVE trunk membership
 * (`_buildCrossingCostGrid`), one from a corridor candidate's own
 * prospective-join list (`_computeCorridorRouted`'s legBase) — and BOTH
 * were blanket per-line: once two lines were EVER mates on any one trunk,
 * each became fully invisible to the OTHER's entire route, forever, not
 * just the shared portion. Confirmed by reproducing the exact reported
 * config and tracing that line_1's own tail leg (departing the trunk
 * toward its own true destination, nothing to do with the trunk anymore)
 * inherited this same blanket exemption and routed straight on top of
 * line_2's own, entirely unrelated continuation.
 *
 * Fix, in two parts (see _buildCrossingCostGrid's own docblock for the
 * full story, including what was tried and reverted):
 * 1. A NEW parallel-overlap check (perpendicular crossings were already
 *    covered) — but narrowing the EXISTING perpendicular exemption to
 *    match was tried and reverted: it regressed several already-verified
 *    scenarios from earlier rounds this session, so mates remain fully
 *    exempt from each other's PERPENDICULAR crossings everywhere,
 *    unchanged.
 * 2. The new parallel-overlap SEARCH-TIME bias is scoped to only the legs
 *    of an actively-evaluated corridor-join candidate (not applied
 *    unconditionally to every line's every search, which alone
 *    destabilized 5 other tests regardless of the bias's magnitude) —
 *    the pre-existing, unconditional whole-candidate
 *    `_segmentCrossingPenalty` check does the rest, correctly making the
 *    now-overlap-free corridor candidate win the comparison against the
 *    (still overlapping, if computed) plain alternative.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { makeRouter, makeLine, runDiscoveryLoop } from './helpers/router-harness.js';

function runScenario() {
  const router = makeRouter({ grid_resolution: undefined }, {}, [0, 0, 990, 765]);
  router.config.grid_resolution = undefined;
  router.setOverlays([
    { id: 'control_1', _raw: { obstacle: true, position: [762.76, 610.91], size: [112, 73], attachment: 'left' } },
    { id: 'control_2', _raw: { obstacle: true, position: [100, 600], size: [166, 50], attachment: 'center' } },
    { id: 'control_3', _raw: { obstacle: true, position: [100, 650], size: [166, 50], attachment: 'center' } },
    { id: 'control_4', _raw: { obstacle: true, position: [100, 700], size: [166, 50], attachment: 'center' } },
  ]);
  const lines = [
    makeLine('line_1', [818.76, 647.41], [183, 600], { route: 'smart', anchor_side: 'bottom', attach_side: 'right' }),
    makeLine('line_2', [183, 650], [546.5625, 204.13746630727763], { route: 'smart', anchor_side: 'right', attach_side: 'center' }),
    makeLine('line_3', [183, 700], [974.53125, 247.43935309973045], { route: 'smart', anchor_side: 'right', attach_side: 'center' }),
  ];
  return runDiscoveryLoop(router, lines);
}

// Perpendicular-only crossing counter (mirrors the other test files' own)
// deliberately does NOT catch a parallel/coincident overlap — that's the
// whole point of the second, dedicated check below.
function segmentsOverlapParallel(a1, a2, b1, b2) {
  const aVert = a1[0] === a2[0], bVert = b1[0] === b2[0];
  if (!aVert || !bVert) return 0; // only vertical-vs-vertical for this fixture's own overlap axis
  if (a1[0] !== b1[0]) return 0; // different track entirely
  const aLo = Math.min(a1[1], a2[1]), aHi = Math.max(a1[1], a2[1]);
  const bLo = Math.min(b1[1], b2[1]), bHi = Math.max(b1[1], b2[1]);
  return Math.max(0, Math.min(aHi, bHi) - Math.max(aLo, bLo));
}

test('two different lines never fully overlap (run coincident) even when one joins a trunk originating from the other', () => {
  const { results } = runScenario();
  const line1 = results.get('line_1').pts;
  const line2 = results.get('line_2').pts;
  let totalOverlap = 0;
  for (let i = 1; i < line1.length; i++) {
    for (let j = 1; j < line2.length; j++) {
      totalOverlap += segmentsOverlapParallel(line1[i - 1], line1[i], line2[j - 1], line2[j]);
    }
  }
  assert.equal(totalOverlap, 0, `line_1 and line_2 physically overlap for ${totalOverlap} units: line_1=${JSON.stringify(line1)} line_2=${JSON.stringify(line2)}`);
});

test("line_1 does not detour into a spurious solo 'trunk' purely to farm a corridor discount", () => {
  const { results } = runScenario();
  const line1 = results.get('line_1');
  // Before the fix: corridor-routed, chaining through trunk:line_2:0 for
  // ~500px (nearly the whole route) despite line_2 itself never actually
  // riding that stretch — a "trunk" that was really just line_1 alone.
  assert.notEqual(line1.meta.strategy, 'corridor-routed',
    `line_1 should route plainly (no trunk to genuinely share here), got: ${JSON.stringify(line1.meta)}`);
});
