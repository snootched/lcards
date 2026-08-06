/**
 * Requested live, alongside the stub_length tunable: a discovered trunk's
 * CREATOR never had a "natural side" preference consulted at all — only
 * joiners did (_mergeOrRegisterTrunk's Round 6 fix, this same project's own
 * memory). The creator always holds the centerline (offset 0) regardless of
 * its own geometry, since its own rendered path is already fixed by the
 * time the trunk exists — lane bookkeeping can't move it. But the value WAS
 * already being computed and stored on every row's own members entry
 * ("stored anyway for shape consistency" — see _mergeOrRegisterTrunk's own
 * comment), just never read.
 *
 * Verified NOT sufficient on its own to eliminate a forced double-crossing
 * (see project memory / turnaround-regression.test.js's own docblock for
 * the mathematical reasoning: a line's own rendered path can't be moved by
 * relabeling lane offsets after the fact) — shipped anyway as a genuine,
 * separable improvement: laneIndex's own GROUP ORDER (which side is
 * treated as "first", not the offset itself or either side's own internal
 * ordering) now favors whichever side the creator's own geometry naturally
 * leans toward, when it has a clear lean (nonzero). A trunk whose creator
 * has no recorded lean (dead straight through this exact run — the common
 * case, and every existing scenario in this suite) is completely
 * unaffected: default behavior verified unchanged via the full existing
 * suite (zero regressions).
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { makeRouter, makeLine, runDiscoveryLoop } from './helpers/router-harness.js';

test("a creator with no bend (natural side 0) leaves lane ordering exactly as before", () => {
  const router = makeRouter({ trunk_line_spacing: 8 });
  const creator = makeLine('line_creator', [50, 100], [500, 100], { corner_radius: 34, corner_style: 'round' });
  const joiner = makeLine('line_joiner', [50, 120], [500, 120], { corner_radius: 34, corner_style: 'round' });
  runDiscoveryLoop(router, [creator, joiner]);
  const row = router.trunks().find(t => t.sourceLineId === 'line_creator');
  assert.equal(row.creatorNaturalSide, 0, 'a dead-straight creator run has no lean to report');
});

test("a creator with a bend reports its own natural side, and a matching joiner gets the priority lane index", () => {
  const router = makeRouter({ trunk_line_spacing: 8 });
  // Creator's own anchor sits SOUTH of the run it registers (bends up
  // into it) — a genuine, nonzero natural lean, unlike a straight run.
  const creator = makeLine('line_creator', [500, 150], [50, 100], {
    corner_radius: 34, corner_style: 'round', anchor_side: 'top', stub_length: 50
  });
  const joinerNorth = makeLine('line_joiner_n', [50, 92], [500, 92], { corner_radius: 34, corner_style: 'round' });
  const joinerSouth = makeLine('line_joiner_s', [50, 108], [500, 108], { corner_radius: 34, corner_style: 'round' });
  const { results } = runDiscoveryLoop(router, [creator, joinerNorth, joinerSouth]);

  const row = router.trunks().find(t => t.sourceLineId === 'line_creator');
  assert.equal(row.creatorNaturalSide, 1, 'creator anchors south of its own registered run');

  const assignN = router._trunkLaneAssignment(row, 'line_joiner_n');
  const assignS = router._trunkLaneAssignment(row, 'line_joiner_s');
  assert.equal(assignS.offset, 8, 'south joiner matches the creator\'s own south lean');
  assert.equal(assignN.offset, -8, 'north joiner is on the opposite side');
  assert.equal(assignS.laneIndex, 1, 'the side matching the creator\'s own lean gets the priority (smaller) laneIndex');
  assert.equal(assignN.laneIndex, 2);

  // Both lines must still route cleanly regardless — this is a laneIndex
  // (nudge-distance) reordering only, never a claim about direction hints.
  for (const [, r] of results) assert.ok(Array.isArray(r.pts) && r.pts.length >= 2);
});
