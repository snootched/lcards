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

/**
 * Finds the first "turnaround" in a polyline — two consecutive segments
 * that share an axis (both horizontal or both vertical) but move in
 * OPPOSITE directions, i.e. a same-axis 180-degree reversal rather than a
 * real perpendicular corner. Mirrors _compactPolyline's own sign-check
 * predicate (RouterCore.js) for consistency with what production code
 * already treats as "a real reversal, not tidying."
 *
 * NOT every match here is a bug: a force-channel's mandatory crossing
 * point can legitimately produce this exact shape (see
 * _compactPolyline's own docblock) — callers with such a leg in their
 * scenario should exclude that specific point by index, not treat this
 * helper as a blanket pass/fail oracle.
 * @param {number[][]} pts
 * @returns {{ index: number, a: number[], b: number[], c: number[] } | null}
 */
export function findIllegalReversal(pts) {
  for (let i = 1; i < pts.length - 1; i++) {
    const a = pts[i - 1], b = pts[i], c = pts[i + 1];
    const sameX = a[0] === b[0] && b[0] === c[0];
    const sameY = a[1] === b[1] && b[1] === c[1];
    if (!sameX && !sameY) continue;
    const d1 = sameX ? (b[1] - a[1]) : (b[0] - a[0]);
    const d2 = sameX ? (c[1] - b[1]) : (c[0] - b[0]);
    if (d1 !== 0 && d2 !== 0 && Math.sign(d1) !== Math.sign(d2)) {
      return { index: i, a, b, c };
    }
  }
  return null;
}

/**
 * True if the axis-aligned segment a->b strictly crosses through the
 * interior of any obstacle box (touching an edge doesn't count — only a
 * segment that actually cuts through the obstacle's rendered area).
 * @param {number[]} a
 * @param {number[]} b
 * @param {{x1:number,y1:number,x2:number,y2:number}[]} obstacles
 * @returns {boolean}
 */
export function segmentCrossesObstacle(a, b, obstacles) {
  const vertical = a[0] === b[0];
  if (!vertical && a[1] !== b[1]) return false;
  const x1 = Math.min(a[0], b[0]), x2 = Math.max(a[0], b[0]);
  const y1 = Math.min(a[1], b[1]), y2 = Math.max(a[1], b[1]);
  for (const ob of obstacles) {
    if (vertical) {
      if (a[0] <= ob.x1 || a[0] >= ob.x2) continue;
      if (y2 > ob.y1 && y1 < ob.y2) return true;
    } else {
      if (a[1] <= ob.y1 || a[1] >= ob.y2) continue;
      if (x2 > ob.x1 && x1 < ob.x2) return true;
    }
  }
  return false;
}

/**
 * Flattens an SVG path's `d` string (M/L/A commands only — the exact subset
 * _polylineToPath/_applyCornerRounding/_applyCornerBeveling ever emit) into
 * a dense point list, resolving each circular arc's center via the
 * standard SVG endpoint-parameterization formula (rx===ry here — every arc
 * this router draws is circular, never elliptical).
 * @param {string} d
 * @returns {number[][]}
 */
export function flattenSvgPath(d) {
  const tokens = d.match(/[MLA][^MLA]*/g) || [];
  let cur = null;
  const pts = [];
  const arcCenter = (p1, p2, r, largeArc, sweep) => {
    const [x1, y1] = p1, [x2, y2] = p2;
    const dx = (x1 - x2) / 2, dy = (y1 - y2) / 2;
    const dSq = dx * dx + dy * dy;
    let factor = dSq ? Math.sqrt(Math.max(0, (r * r - dSq)) / dSq) : 0;
    if (!isFinite(factor)) factor = 0;
    const sign = (largeArc !== sweep) ? 1 : -1;
    return [(x1 + x2) / 2 + sign * factor * dy, (y1 + y2) / 2 - sign * factor * dx];
  };
  for (const tok of tokens) {
    const cmd = tok[0];
    const nums = tok.slice(1).trim().split(/[\s,]+/).map(Number);
    if (cmd === 'M') { cur = [nums[0], nums[1]]; pts.push(cur); }
    else if (cmd === 'L') { cur = [nums[0], nums[1]]; pts.push(cur); }
    else if (cmd === 'A') {
      const [rx, , , largeArc, sweep, x, y] = nums;
      const p2 = [x, y];
      const [cx, cy] = arcCenter(cur, p2, rx, largeArc, sweep);
      const a1 = Math.atan2(cur[1] - cy, cur[0] - cx);
      let a2 = Math.atan2(p2[1] - cy, p2[0] - cx);
      if (sweep === 1) { while (a2 < a1) a2 += 2 * Math.PI; }
      else { while (a2 > a1) a2 -= 2 * Math.PI; }
      const steps = 24;
      for (let i = 1; i <= steps; i++) {
        const t = a1 + (a2 - a1) * i / steps;
        pts.push([cx + rx * Math.cos(t), cy + rx * Math.sin(t)]);
      }
      cur = p2;
    }
  }
  return pts;
}

/**
 * Counts real geometric intersections between two FLATTENED (see
 * flattenSvgPath) rendered paths — the crossing count a person would
 * actually see on screen, including any crossing introduced purely by
 * corner-rounding bulging into another line's path near a shared corner
 * (a real bug class: the underlying straight polyline can have zero
 * crossings there, yet still round into one — see
 * RouterCore._distanceToNearestOtherLineSegment's own comment). Shared
 * endpoints (t/u at exactly 0 or 1) are excluded via a small epsilon so two
 * paths that merely touch at a rendered point don't falsely count.
 * @param {number[][]} pts1
 * @param {number[][]} pts2
 * @returns {number}
 */
export function countRenderedCrossings(pts1, pts2) {
  const intersects = (p1, p2, p3, p4) => {
    const d1x = p2[0] - p1[0], d1y = p2[1] - p1[1];
    const d2x = p4[0] - p3[0], d2y = p4[1] - p3[1];
    const denom = d1x * d2y - d1y * d2x;
    if (Math.abs(denom) < 1e-9) return false;
    const t = ((p3[0] - p1[0]) * d2y - (p3[1] - p1[1]) * d2x) / denom;
    const u = ((p3[0] - p1[0]) * d1y - (p3[1] - p1[1]) * d1x) / denom;
    return t > 1e-9 && t < 1 - 1e-9 && u > 1e-9 && u < 1 - 1e-9;
  };
  let count = 0;
  for (let i = 1; i < pts1.length; i++) {
    for (let j = 1; j < pts2.length; j++) {
      if (intersects(pts1[i - 1], pts1[i], pts2[j - 1], pts2[j])) count++;
    }
  }
  return count;
}
