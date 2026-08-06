/**
 * Trunk-and-branch lane assignment (ROUTING_ENGINE_BRIEF.md §7).
 *
 * A discovered trunk's creator owns the centerline; a line that discovers
 * and joins that trunk must ride a distinct lane BESIDE it — never
 * coincident with the creator's own path.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { makeRouter, makeLine, runDiscoveryLoop, longestHorizontalRun } from './helpers/router-harness.js';

test('joiner rides beside — not on — a discovered trunk creator', () => {
  const router = makeRouter({ trunk_line_spacing: 8 });
  const creator = makeLine('line_creator', [50, 100], [500, 100]);
  const joiner = makeLine('line_joiner', [50, 120], [500, 120]);
  const { results } = runDiscoveryLoop(router, [creator, joiner]);

  const creatorRun = longestHorizontalRun(results.get('line_creator').pts);
  const joinerRun = longestHorizontalRun(results.get('line_joiner').pts);
  assert.equal(creatorRun.y, 100, 'creator stays on its own centerline');
  // The joiner must actually have bundled (long through leg pulled off its
  // own natural row)...
  assert.ok(joinerRun.length >= 300, 'joiner has a long through leg');
  assert.notEqual(joinerRun.y, 120, 'joiner actually bundled (left its natural row)');
  // ...and ride a distinct lane, at least one line_spacing off the creator.
  assert.ok(
    Math.abs(joinerRun.y - creatorRun.y) >= 8,
    `joiner through leg (y=${joinerRun.y}) must be >= line_spacing from the creator (y=${creatorRun.y})`
  );
});

test('two joiners get distinct lanes on opposite sides of the creator', () => {
  const router = makeRouter({ trunk_line_spacing: 8 });
  const lines = [
    makeLine('line_a', [50, 100], [500, 100]), // creator
    makeLine('line_b', [50, 116], [500, 116]),
    makeLine('line_c', [50, 130], [500, 130])
  ];
  const { results } = runDiscoveryLoop(router, lines);

  const runA = longestHorizontalRun(results.get('line_a').pts);
  const runB = longestHorizontalRun(results.get('line_b').pts);
  const runC = longestHorizontalRun(results.get('line_c').pts);
  assert.equal(runA.y, 100, 'creator stays on its own centerline');
  // Both joiners must actually have bundled — a converged state where they
  // simply stayed on their own natural rows (116/130) is the join-ratchet
  // failure mode, not success.
  assert.notEqual(runB.y, 116, 'line_b actually bundled (left its natural row)');
  assert.notEqual(runC.y, 130, 'line_c actually bundled (left its natural row)');
  const lanes = [runA.y, runB.y, runC.y];
  assert.equal(new Set(lanes).size, 3, `all three lines on distinct lanes (got ${lanes.join(', ')})`);
  for (const [id, run] of [['line_b', runB], ['line_c', runC]]) {
    assert.ok(
      Math.abs(run.y - runA.y) >= 8,
      `${id} through leg (y=${run.y}) must be >= line_spacing from the creator`
    );
  }
});
