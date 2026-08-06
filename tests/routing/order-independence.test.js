/**
 * Order independence (ROUTING_ENGINE_BRIEF.md §2 goal 3, §5e).
 *
 * The product guarantee: routing outcomes are a function of the line SET,
 * not YAML declaration order — delivered by the discovery loop's fixed
 * sorted-by-id iteration. (Reversed-ITERATION equality is deliberately not
 * asserted: a genuine near-tie cost landscape can have multiple valid fixed
 * points under different iteration orders, and production never iterates
 * reversed — see runDiscoveryLoop's comment.)
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { makeRouter, makeLine, runDiscoveryLoop } from './helpers/router-harness.js';

const SCENARIO = [
  ['line_a', [50, 100], [500, 100]], // becomes the trunk creator
  ['line_b', [50, 116], [500, 116]],
  ['line_c', [50, 130], [500, 130]]
];

function runWithDeclarationOrder(order) {
  const router = makeRouter({ trunk_line_spacing: 8 });
  const lines = order.map(i => makeLine(...SCENARIO[i]));
  const { results } = runDiscoveryLoop(router, lines);
  return { router, results };
}

test('routing outcome does not depend on declaration order', () => {
  const forward = runWithDeclarationOrder([0, 1, 2]);
  const backward = runWithDeclarationOrder([2, 1, 0]);
  const shuffled = runWithDeclarationOrder([1, 2, 0]);

  for (const id of ['line_a', 'line_b', 'line_c']) {
    assert.deepEqual(backward.results.get(id).pts, forward.results.get(id).pts,
      `${id}: reversed declaration order must produce the identical route`);
    assert.deepEqual(shuffled.results.get(id).pts, forward.results.get(id).pts,
      `${id}: shuffled declaration order must produce the identical route`);
  }

  // Registries must be equivalent too (same trunk rows, same member sets).
  const trunkShape = (router) => router._trunks
    .map(t => ({ id: t.id, x1: t.x1, y1: t.y1, x2: t.x2, y2: t.y2, members: [...t.members.keys()].sort() }))
    .sort((p, q) => (p.id < q.id ? -1 : 1));
  assert.deepEqual(trunkShape(backward.router), trunkShape(forward.router));
  assert.deepEqual(trunkShape(shuffled.router), trunkShape(forward.router));
});

test('a fresh identical router reproduces the identical converged state', () => {
  const first = runWithDeclarationOrder([0, 1, 2]);
  const second = runWithDeclarationOrder([0, 1, 2]);
  for (const id of ['line_a', 'line_b', 'line_c']) {
    assert.deepEqual(second.results.get(id).pts, first.results.get(id).pts);
  }
});

test('routing outcome is independent of prior edit history (setOverlays resets discovered state)', () => {
  // Fresh baseline: full line set, no history.
  const fresh = runWithDeclarationOrder([0, 1, 2]);

  // "Edited" router: a different subset routed first (e.g. mid-edit config
  // where only one line existed), seeding registries with its own fixed
  // point — then the full config arrives via a new overlays array. The
  // converged bundle arrangement is a genuine near-tie in some layouts, so
  // without the setOverlays registry reset the seeded state is
  // self-sustaining and the final outcome depends on edit history.
  const router = makeRouter({ trunk_line_spacing: 8 });
  const lines = [0, 1, 2].map(i => makeLine(...SCENARIO[i]));
  runDiscoveryLoop(router, [lines[2]]); // history: last line routed alone
  router.setOverlays([]); // model rebuild: new overlays array -> reset
  const { results } = runDiscoveryLoop(router, lines);

  for (const id of ['line_a', 'line_b', 'line_c']) {
    assert.deepEqual(results.get(id).pts, fresh.results.get(id).pts,
      `${id}: outcome must match a fresh router despite prior routing history`);
  }
});
