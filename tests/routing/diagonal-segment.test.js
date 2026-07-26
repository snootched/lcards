/**
 * Reported live: raising `trunk_min_length` past the point where a specific
 * trunk stopped qualifying ("it went a little haywire") produced a route
 * with an ACTUAL DIAGONAL SEGMENT — both x and y changing on the same
 * segment, structurally impossible for this Manhattan-only router.
 *
 * Root cause, confirmed via direct leg-level tracing (not hand-traced):
 * `_computeGrid`'s post-reconstruction reshape has a degenerate-axis relief
 * on both the first-move and last-move sides (this session's own earlier
 * fixes, see turnaround-regression.test.js's docblock) — "when the
 * REQUIRED axis has zero real distance to cover, don't force the
 * reconstructed segment onto it." Both reliefs had the same latent gap:
 * `requiredAxisDegenerate` alone short-circuited the check to "already
 * correct", WITHOUT first confirming the segment was even orthogonal at
 * all. For the specific failing leg (`a=[228,600]`, `b=[342.81,600]`,
 * hintLast='channel_axis' wanting the vertical axis — degenerate here,
 * since a and b share the same y), the grid's own raw reconstructed last
 * segment was genuinely diagonal (`[360,630]->[342.81,600]`), and the
 * degenerate-axis relief waved it through untouched instead of routing it
 * to the EXISTING "genuinely diagonal" correction logic one branch below
 * (which was already there and already worked — it just never got
 * reached).
 *
 * Fixed by requiring the segment to be orthogonal FIRST
 * (`actuallyHorizontal || actuallyVertical`) before the degenerate-axis
 * relief can accept it as "already correct" — a diagonal segment now
 * always falls through to the existing corrective-elbow logic, degenerate
 * required axis or not. Mirrored on the first-move side (same latent gap,
 * not yet observed in the wild but structurally identical).
 *
 * Fixing this ALSO resolved a separate-looking but same-root-cause
 * complaint from the same live session: a marginal, visually-awkward
 * "briefly ride a second, barely-qualifying trunk" detour disappeared
 * entirely once this reshape stopped producing subtly-wrong intermediate
 * leg geometry during route search — the corrected route now cleanly
 * rides a single trunk with a simple, direct shape. See project memory
 * for the full before/after.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { makeRouter, makeLine, runDiscoveryLoop, findDiagonalSegment, findIllegalReversal } from './helpers/router-harness.js';

function runScenario(trunkMinLength) {
  const router = makeRouter({ grid_resolution: 45, trunk_line_spacing: 8, trunk_min_length: trunkMinLength }, {}, [0, 0, 990, 765]);
  router.setOverlays([
    { id: 'control_1', _raw: { obstacle: true, position: [278.81, 115.32], size: [112, 73], attachment: 'left' } },
    { id: 'control_2', _raw: { obstacle: true, position: [100, 600], size: [166, 50], attachment: 'center' } },
    { id: 'control_3', _raw: { obstacle: true, position: [100, 650], size: [166, 50], attachment: 'center' } },
    { id: 'control_4', _raw: { obstacle: true, position: [100, 700], size: [166, 50], attachment: 'center' } },
  ]);
  const lines = [
    makeLine('line_1', [334.81, 115.32], [199, 600], { route: 'smart', anchor_side: 'center', attach_side: 'right' }),
    makeLine('line_2', [183, 650], [546.5625, 204.13746630727763], { route: 'smart', anchor_side: 'right', attach_side: 'center' }),
    makeLine('line_3', [183, 700], [974.53125, 247.43935309973045], { route: 'smart', anchor_side: 'right', attach_side: 'center' }),
  ];
  return runDiscoveryLoop(router, lines);
}

test('no line ever produces a diagonal segment, across the exact reported trunk_min_length range', () => {
  for (const trunkMinLength of [60, 100, 130, 135, 136, 140, 150, 200]) {
    const { results } = runScenario(trunkMinLength);
    for (const [id, result] of results) {
      const diagonal = findDiagonalSegment(result.pts);
      assert.equal(diagonal, null, `trunk_min_length=${trunkMinLength}: ${id} has a diagonal segment: ${JSON.stringify(diagonal)}, full pts=${JSON.stringify(result.pts)}`);
    }
  }
});

test('no reversal either, across the same range', () => {
  for (const trunkMinLength of [60, 100, 130, 135, 136, 140, 150, 200]) {
    const { results } = runScenario(trunkMinLength);
    for (const [id, result] of results) {
      assert.equal(findIllegalReversal(result.pts), null, `trunk_min_length=${trunkMinLength}: ${id} reversed`);
    }
  }
});

test('line_2 rides a single clean trunk instead of a marginal two-trunk detour, once the reshape bug is fixed', () => {
  const { results } = runScenario(60);
  const line2 = results.get('line_2');
  assert.equal(line2.meta.chainChannels.length, 1, `expected a single-trunk chain, got: ${JSON.stringify(line2.meta.chainChannels)}`);
  assert.equal(line2.meta.bends, 4, `expected a clean 4-bend route, got: ${JSON.stringify(line2.pts)}`);
});
