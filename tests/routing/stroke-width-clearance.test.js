/**
 * Corner-rounding's cross-line clearance clamp (_distanceToNearestOtherLineSegment,
 * see corner-rounding-crossing.test.js for its own history) compared raw
 * CENTERLINE distance only — completely blind to either line's own rendered
 * stroke width. A centerline gap that looked "clear" by a couple of units
 * could still leave two visibly thick lines' actual rendered edges
 * overlapping, since neither line is infinitely thin.
 *
 * Requested live, alongside a related visual observation: increasing stroke
 * width made a tightly-clamped corner's OUTER edge still look curved but its
 * INNER edge look squared off. That's not a separate bug in the arc math —
 * it's an unavoidable SVG stroking fact once the corner's own radius drops
 * below roughly half the stroke width (the inner edge literally has no room
 * to curve). The actual fix is here: net BOTH lines' stroke widths out of
 * the clearance check so the clamp reflects the real risk of the RENDERED
 * edges touching, not just the two centerlines.
 *
 * `width` flows from LineOverlay's own `style.width` (alias `style.stroke_width`,
 * default 2 — see buildRouteRequest) through computePath -> _registerLineSegments
 * -> _registerCrossingSegment -> stored on each _crossings entry, and is read
 * back out via _distanceToNearestOtherLineSegment's own `askingWidth` param
 * (netted against whichever OTHER line's segment is nearest).
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { makeRouter, makeLine, runDiscoveryLoop } from './helpers/router-harness.js';

test('_distanceToNearestOtherLineSegment nets out both lines\' own stroke width', () => {
  const router = makeRouter({ trunk_line_spacing: 8 });
  router._registerLineSegments('line_a', [[0, 100], [200, 100]], [0, 100], [200, 100], 6);
  const p = [50, 108]; // 8 viewBox units from line_a's own centerline
  assert.equal(router._distanceToNearestOtherLineSegment(p, 'line_b', 0), 5, '8 - (0+6)/2 = 5');
  assert.equal(router._distanceToNearestOtherLineSegment(p, 'line_b', 4), 3, '8 - (4+6)/2 = 3');
  assert.equal(router._distanceToNearestOtherLineSegment(p, 'line_b'), 5, 'default askingWidth=0 matches the explicit-0 case');
  // Self-exclusion is untouched by this change.
  assert.equal(router._distanceToNearestOtherLineSegment(p, 'line_a', 4), Infinity);
});

test('a thicker pair of lines gets a smaller (more conservative) corner radius than a thin pair at the same geometry', () => {
  // Two lines close enough that stroke width, not just centerline
  // proximity, should visibly matter: line_2 makes an orthogonal turn
  // right next to line_1's own straight run.
  function cornerRadius(width) {
    const router = makeRouter({ trunk_line_spacing: 8 }, {}, [0, 0, 400, 200]);
    const line1 = makeLine('line_1', [50, 100], [350, 100], { corner_radius: 20, corner_style: 'round', style: { width } });
    const line2 = makeLine('line_2', [50, 108], [200, 108], { corner_radius: 20, corner_style: 'round', style: { width } });
    router.computePath(router.buildRouteRequest(line1, line1.a, line1.b));
    router.computePath(router.buildRouteRequest(line2, line2.a, line2.b));
    // Directly probe the underlying clamp (independent of whether either
    // line's own route happens to introduce a real corner at this exact
    // point) — mirrors corner-rounding-crossing.test.js's own direct-unit
    // style for this same function.
    return router._distanceToNearestOtherLineSegment([100, 108], 'line_2', width);
  }
  const thin = cornerRadius(1);
  const thick = cornerRadius(10);
  assert.ok(thick < thin, `a thicker stroke should net out to LESS available clearance (thin=${thin}, thick=${thick})`);
});

test('width defaults to the LineOverlay convention (2) end to end when unset', () => {
  const router = makeRouter({ trunk_line_spacing: 8 });
  const line = makeLine('line_default', [0, 0], [100, 0], {});
  const req = router.buildRouteRequest(line, line.a, line.b);
  assert.equal(req.width, 2, 'matches LineOverlay.js\'s own literal default');
});
