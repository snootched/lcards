/**
 * @fileoverview Shared Node-only harness for RouterCore tests.
 *
 * RouterCore is pure geometry/graph-search with zero DOM dependencies, so it
 * can be exercised directly under `node --test` once the few browser globals
 * its import chain touches (lcards-logging reads `window`, the Vite build
 * injects `__LCARDS_VERSION__`) are shimmed. The shims MUST be installed
 * before the dynamic import below — a static `import` would hoist above them.
 */

globalThis.window = globalThis.window || {};
globalThis.__LCARDS_VERSION__ = globalThis.__LCARDS_VERSION__ || 'test';
globalThis.document = globalThis.document || { addEventListener() {} };

const { RouterCore } = await import('../../../src/msd/routing/RouterCore.js');

export { RouterCore };

/**
 * Construct a RouterCore the same way MsdCardCoordinator does (one instance
 * per card), with an empty overlay set (no obstacles) unless provided.
 * grid_resolution defaults to 8 — fine enough that a small lane offset
 * (±spacing, default 8) isn't masked by grid-snap. NOTE: values <= 4 are
 * silently coerced to 32 by _computeGrid (`baseRes > 4 ? baseRes : 32`), so
 * ROUTING_ENGINE_BRIEF.md §10's `grid_resolution: 4` recipe actually ran at
 * 32; 8 is the real minimum-useful fine resolution.
 * @param {object} [config]
 * @param {object} [anchors]
 * @param {[number,number,number,number]} [viewBox]
 * @returns {RouterCore}
 */
export function makeRouter(config = {}, anchors = {}, viewBox = [0, 0, 600, 300]) {
  const router = new RouterCore({ grid_resolution: 8, ...config }, anchors, viewBox);
  router.setOverlays([]);
  return router;
}

/**
 * Minimal line-overlay stand-in: the shape LineOverlay hands to
 * buildRouteRequest (id + _raw config), plus the endpoints the harness
 * routes between (in real code those come from anchor resolution).
 * @param {string} id
 * @param {number[]} a - start [x, y]
 * @param {number[]} b - end [x, y]
 * @param {object} [rawExtra] - extra raw config (route_channels, anchor_side, ...)
 */
export function makeLine(id, a, b, rawExtra = {}) {
  return { id, _raw: { id, route: 'grid', ...rawExtra }, a, b };
}

/**
 * Route one harness line through the full request lifecycle.
 * @param {RouterCore} router
 * @param {object} line - from makeLine()
 * @returns {object} RouteResult ({ pts, d, meta })
 */
export function routeLine(router, line) {
  return router.computePath(router.buildRouteRequest(line, line.a, line.b));
}

/**
 * Mimics AdvancedRenderer._discoverLineRoutes: repeatedly route every line
 * until a full sweep produces zero registry mutations, capped at
 * trunk_discovery_max_passes. Iteration order is sorted by id — the fixed,
 * declaration-order-independent sequence production uses (load-bearing; see
 * AdvancedRenderer.js:862's comment). Pass { order: 'reversed' } only to
 * stress-test — production never iterates reversed, and a genuine near-tie
 * cost landscape can have multiple valid fixed points under different
 * iteration orders.
 * @param {RouterCore} router
 * @param {object[]} lines - from makeLine()
 * @param {{ order?: 'sorted'|'reversed' }} [opts]
 * @returns {{ passes: number, registryVersion: number, results: Map<string, object> }}
 */
export function runDiscoveryLoop(router, lines, { order = 'sorted' } = {}) {
  const seq = lines.slice().sort((p, q) => (p.id < q.id ? -1 : p.id > q.id ? 1 : 0));
  if (order === 'reversed') seq.reverse();
  const maxPasses = router._trunkDiscoveryMaxPasses ?? 4;
  const results = new Map();
  let lastVersion = -1;
  let passes = 0;
  while (router._registryVersion !== lastVersion && passes < maxPasses) {
    lastVersion = router._registryVersion;
    for (const line of seq) results.set(line.id, routeLine(router, line));
    passes++;
  }
  return { passes, registryVersion: router._registryVersion, results };
}

/**
 * Longest straight horizontal run in a polyline, as { y, length } — the
 * "through leg" of a horizontally-bundled route. Returns null if none.
 * @param {number[][]} pts
 */
export function longestHorizontalRun(pts) {
  let best = null;
  for (let i = 1; i < pts.length; i++) {
    const [ax, ay] = pts[i - 1];
    const [bx, by] = pts[i];
    if (ay !== by) continue;
    const length = Math.abs(bx - ax);
    if (!best || length > best.length) best = { y: ay, length };
  }
  return best;
}
