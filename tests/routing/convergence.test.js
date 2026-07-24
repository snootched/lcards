/**
 * Discovery-loop convergence properties (ROUTING_ENGINE_BRIEF.md §5e/§6).
 *
 * The bounded N-pass discovery loop is only affordable because a converged
 * registry stops mutating: identical geometry re-registration must be a
 * strict no-op (no _registryVersion bump), and the converged answer must be
 * a genuine fixed point — not an artifact of the route cache (a cache-cleared
 * recompute must reproduce the same geometry and the same version).
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { makeRouter, makeLine, routeLine, runDiscoveryLoop } from './helpers/router-harness.js';

test('discovery loop converges; steady state is all cache hits', () => {
  const router = makeRouter({ trunk_line_spacing: 8 });
  const lines = [
    makeLine('line_a', [50, 100], [500, 100]),
    makeLine('line_b', [50, 116], [500, 116]),
    makeLine('line_c', [50, 130], [500, 130])
  ];
  const { registryVersion, passes } = runDiscoveryLoop(router, lines);
  assert.ok(passes < (router._trunkDiscoveryMaxPasses ?? 4), 'converged before the pass cap');

  // One more full sweep: zero mutations, every route served from cache.
  for (const line of lines) {
    const res = routeLine(router, line);
    assert.equal(res.meta.cache_hit, true, `${line.id} steady-state route must be a cache hit`);
  }
  assert.equal(router._registryVersion, registryVersion, 'no registry churn at steady state');
});

test('converged answer is a true fixed point, not a cache artifact', () => {
  const router = makeRouter({ trunk_line_spacing: 8 });
  const a = makeLine('line_a', [50, 100], [500, 100]);
  const b = makeLine('line_b', [50, 120], [500, 120]);
  const { results } = runDiscoveryLoop(router, [a, b]);
  const vStable = router._registryVersion;
  const stablePts = new Map([...results].map(([id, r]) => [id, r.pts]));

  // Force real recomputes (cache misses) with unchanged geometry: the same
  // routes must come back and the registry version must not move.
  router._cache.clear();
  router._cacheOrder.length = 0;
  for (const line of [a, b]) {
    const res = routeLine(router, line);
    assert.equal(res.meta.cache_hit, false, 'recompute really bypassed the cache');
    assert.deepEqual(res.pts, stablePts.get(line.id), `${line.id} reproduces its converged route`);
  }
  assert.equal(router._registryVersion, vStable, 'identical recompute must not bump the registry version');

  // A genuine geometry change must bump it (so other lines re-examine).
  routeLine(router, makeLine('line_b', [50, 160], [500, 160]));
  assert.ok(router._registryVersion > vStable, 'changed geometry must bump the registry version');
});
