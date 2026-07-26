/**
 * `RouterCore.prototype.inspect(overlayId)` (what `window.lcards.debug.msd.
 * routing.inspect()` calls in HA) scans `this._cache` for a key starting
 * with `${overlayId}@` and used to `return` on the FIRST match. `_cache` is
 * a plain Map, populated purely in insertion order (`_cache.set` +
 * `_cacheOrder.push`, no LRU touch-on-read anywhere) — and the cache key
 * includes a trailing `RV:${_registryVersion}` component, which changes on
 * every trunk/crossing registry mutation. Across a multi-pass discovery
 * loop (trunk bundling only reaches its converged shape after several
 * passes), the SAME overlay ID accumulates several distinct cache entries,
 * one per pass, all still present (not evicted below the 256-entry cap).
 * Map iteration order is insertion order, so the first match is the OLDEST
 * entry still cached for that ID — an early, not-yet-converged pass — not
 * the current, final route actually rendered.
 *
 * Reported live: `lcards.debug.msd.routing.inspect('line_3')` returned a
 * route with an extra spurious kink (a tiny dogleg mid-corridor) that
 * doesn't exist in the actual rendered DOM. Confirmed via this exact
 * scenario (reduced from the live report) that the OLD first-match logic
 * reproduces the reported JSON byte-for-byte, while the real, converged
 * route (matching the DOM) is clean. Fixed by scanning every match and
 * keeping the LAST one seen (later Map-iteration position = later
 * insertion = most recently computed).
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
  return { router, ...runDiscoveryLoop(router, lines) };
}

test('inspect() returns the final converged route, not an early discovery-pass snapshot', () => {
  const { router, results } = runScenario();
  // The cache must have accumulated MORE than one entry per overlay across
  // the multi-pass convergence — otherwise this scenario doesn't actually
  // exercise the bug at all (a sanity check on the test's own premise).
  for (const id of ['line_1', 'line_2', 'line_3']) {
    const matches = [...router._cache.keys()].filter(k => k.startsWith(`${id}@`));
    assert.ok(matches.length > 1, `${id}: expected multiple cache entries across passes, got ${matches.length}`);
  }
  for (const id of ['line_1', 'line_2', 'line_3']) {
    const final = results.get(id);
    const inspected = router.inspect(id);
    assert.deepEqual(inspected.pts, final.pts, `${id}: inspect() must match the actual final route`);
  }
});

test('inspect() no longer reproduces the reported stale-snapshot artifact', () => {
  const { router } = runScenario();
  const line3 = router.inspect('line_3');
  // The old (buggy) first-match behavior returned an extra spurious dogleg
  // around x=894-956 that never appears in the converged route.
  assert.ok(!line3.pts.some(([x]) => x > 800 && x < 960),
    `line_3's inspected route should not contain the stale mid-corridor dogleg: ${JSON.stringify(line3.pts)}`);
});
