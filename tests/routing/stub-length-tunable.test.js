/**
 * Requested live, alongside the debug tooling to inspect trunks/stub
 * length: an explicit `stub_length` override, since the router's own
 * auto-floor (scaling with grid_resolution, which can reach 64 on a large
 * viewBox) can force a much longer mandatory stub than a specific line's
 * own geometry needs — confirmed as the direct cause of a line detouring
 * unnecessarily far past a shared trunk it should have stayed clear of
 * (see project memory, the ncc-1701-kelvin config).
 *
 * `cardinalStubLengthFor` (RouterCore.js) now checks `req.stubLength`
 * first, bypassing both the 'auto' floor and 'forced' corner-radius-driven
 * length entirely when set.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { makeRouter, makeLine } from './helpers/router-harness.js';

test('an explicit stub_length overrides the grid_resolution auto-floor', () => {
  const router = makeRouter({ grid_resolution: undefined }, {}, [0, 0, 990, 765]);
  router.config.grid_resolution = undefined;
  router.setOverlays([
    { id: 'control_1', _raw: { obstacle: true, position: [762.76, 610.91], size: [112, 73], attachment: 'left' } },
  ]);
  const line = makeLine('line_short', [818.76, 647.41], [400, 400], { route: 'smart', anchor_side: 'bottom', stub_length: 10 });
  const result = router.computePath(router.buildRouteRequest(line, line.a, line.b));
  assert.equal(result.meta.debug.stubLength, 10);
  // The stub segment (a[1] -> its own landing point before any search)
  // must be exactly 10 units, not the ~63.75 grid_resolution-floored default.
  assert.equal(result.pts[1][1] - result.pts[0][1], 10);
});

test('unset stub_length falls back to the existing auto-floor behavior, unchanged', () => {
  const router = makeRouter({ grid_resolution: undefined }, {}, [0, 0, 990, 765]);
  router.config.grid_resolution = undefined;
  router.setOverlays([]);
  const line = makeLine('line_default', [100, 100], [400, 400], { route: 'smart', anchor_side: 'right' });
  const result = router.computePath(router.buildRouteRequest(line, line.a, line.b));
  assert.equal(result.meta.debug.stubLength, result.meta.debug.gridResolution);
});

test('trunks() debug introspection returns bounds, centerline, and members for every registered row', () => {
  const router = makeRouter({ trunk_line_spacing: 8 });
  const creator = makeLine('line_creator', [50, 100], [500, 100], { corner_radius: 34, corner_style: 'round' });
  const joiner = makeLine('line_joiner', [50, 120], [500, 120], { corner_radius: 34, corner_style: 'round' });
  router.computePath(router.buildRouteRequest(creator, creator.a, creator.b));
  router.computePath(router.buildRouteRequest(joiner, joiner.a, joiner.b));
  const trunks = router.trunks();
  assert.ok(trunks.length > 0, 'expected at least one registered trunk row');
  const row = trunks.find(t => t.sourceLineId === 'line_creator' && t.direction === 'horizontal');
  assert.ok(row, `expected a horizontal trunk row sourced from line_creator: ${JSON.stringify(trunks)}`);
  assert.ok('crossCenter' in row && 'bounds' in row && Array.isArray(row.members));
});
