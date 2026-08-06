/**
 * Reported live: three MSD line overlays with NO explicit `route_channels`/
 * `channels:` config, anchored close together and heading the same
 * direction (`route: auto`, the default — same as this harness's own
 * default `route: 'grid'`), criss-crossed with a squashed corner once two
 * of them auto-bundled onto a shared discovered trunk and both happened to
 * lean toward the same side of it.
 *
 * Root cause (see lane-assignment.test.js's own "within a shared side..."
 * test for the unit-level version of this same fix): _trunkLaneAssignment's
 * discovered-trunk branch fell all the way back to a plain lineId sort for
 * two joiners sharing a side, ignoring which one's real destination
 * actually sits closer to the centerline. Here, line_2_near's real target
 * is CLOSER to the shared trunk than line_3_far's, but 'line_2_near' also
 * sorts FIRST lexicographically — before this fix, that lexicographic
 * accident put line_2_near on the INNER lane and line_3_far on the OUTER
 * one regardless, forcing the two to swap relative order (and visibly
 * cross) once they turned off toward their own separate destinations.
 * Confirmed via direct comparison against pre-fix RouterCore: this exact
 * scenario renders with exactly one crossing on the old code, zero after.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { makeRouter, makeLine, runDiscoveryLoop, flattenSvgPath, countRenderedCrossings } from './helpers/router-harness.js';

test('two same-side discovered-trunk joiners with disagreeing id/distance order do not cross', () => {
  const router = makeRouter({ trunk_proximity: 50, trunk_line_spacing: 8 }, {}, [0, 0, 600, 500]);
  const lines = [
    // Dead straight -> becomes the discovered trunk's creator (centerline,
    // no lean). Sorts first (id '0') so it also processes first in the
    // discovery loop and is guaranteed to be the one that CREATES the row,
    // rather than accidentally joining one of the other two's.
    makeLine('line_0_creator', [50, 100], [500, 100], { anchor_side: 'right', attach_side: 'left' }),
    // Both south of the creator (same side) — line_2_near's real target
    // (y=140) sits closer to the centerline than line_3_far's (y=200), but
    // 'line_2_near' sorts BEFORE 'line_3_far' lexicographically, the exact
    // disagreement this fix targets.
    makeLine('line_2_near', [50, 116], [500, 140], { anchor_side: 'right', attach_side: 'left' }),
    makeLine('line_3_far', [50, 130], [500, 200], { anchor_side: 'right', attach_side: 'left' }),
  ];
  const { results } = runDiscoveryLoop(router, lines);

  const ids = ['line_0_creator', 'line_2_near', 'line_3_far'];
  let crossings = 0;
  for (let i = 0; i < ids.length; i++) {
    for (let j = i + 1; j < ids.length; j++) {
      crossings += countRenderedCrossings(
        flattenSvgPath(results.get(ids[i]).d),
        flattenSvgPath(results.get(ids[j]).d)
      );
    }
  }
  assert.equal(crossings, 0, 'no two lines should visibly cross once they branch off toward their own separate destinations');
});
