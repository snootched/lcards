/**
 * route: 'auto' resolution (2026-07-24 change): auto always resolves to
 * 'smart' — full pathfinding, trunk bundling, crossing avoidance — whether
 * or not obstacles/channels are present anywhere on the card. Replaces the
 * old conditional upgrade (auto -> manhattan unless a global obstacle or a
 * per-line channel triggered smart), which meant a pure-lines diagram with
 * no obstacles/channels got none of the cable-raceway behavior, silently,
 * no matter how many lines ran close together.
 *
 * manhattan/grid remain as explicit, always-honored opt-outs — an explicit
 * choice is never silently re-upgraded, unlike the old behavior (where even
 * an explicit route: manhattan could get pulled into smart mode).
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { RouterCore, makeLine, runDiscoveryLoop, longestHorizontalRun } from './helpers/router-harness.js';

function bareRouter(config = {}, viewBox = [0, 0, 600, 300]) {
  const router = new RouterCore({ grid_resolution: 8, ...config }, {}, viewBox);
  router.setOverlays([]);
  return router;
}

test('auto bundles two parallel lines with zero obstacles and zero channels', () => {
  const router = bareRouter({ trunk_line_spacing: 8 });
  const creator = makeLine('line_creator', [50, 100], [500, 100], { route: 'auto' });
  const joiner = makeLine('line_joiner', [50, 120], [500, 120], { route: 'auto' });
  const { results } = runDiscoveryLoop(router, [creator, joiner]);

  const creatorRun = longestHorizontalRun(results.get('line_creator').pts);
  const joinerRun = longestHorizontalRun(results.get('line_joiner').pts);
  assert.equal(creatorRun.y, 100, 'creator stays on its own centerline');
  assert.notEqual(joinerRun.y, 120, 'joiner actually bundled (left its natural row) under plain auto, no obstacles/channels involved');
  assert.ok(Math.abs(joinerRun.y - creatorRun.y) >= 8, 'joiner rides a distinct lane beside the creator');
});

test('auto avoids a registered crossing with zero obstacles and zero channels', () => {
  const router = bareRouter({ crossing_avoid_bias: 20 });
  router.computePath(router.buildRouteRequest(
    makeLine('line_wall', [180, 100], [220, 100], { route: 'direct' }),
    [180, 100], [220, 100]
  ));
  const probe = makeLine('probe_auto', [200, 40], [200, 220], {
    anchor_side: 'bottom', corner_radius: 34, corner_style: 'round', route: 'auto'
  });
  const result = router.computePath(router.buildRouteRequest(probe, probe.a, probe.b));

  const crossesWallSpan = result.pts.some(([x, y], i) => {
    if (i === 0) return false;
    const [px, py] = result.pts[i - 1];
    const isVertical = px === x && py !== y;
    const spansWallRow = Math.min(py, y) <= 100 && Math.max(py, y) >= 100;
    return isVertical && spansWallRow && x > 180 && x < 220;
  });
  assert.ok(!crossesWallSpan, `plain auto should detour around the wall, got ${JSON.stringify(result.pts)}`);
});

test('explicit manhattan is never re-upgraded, even with a nearby bundlable trunk', () => {
  const router = bareRouter({ trunk_line_spacing: 8 });
  const creator = makeLine('line_creator', [50, 100], [500, 100], { route: 'auto' });
  const manhattanLine = makeLine('line_manhattan', [50, 120], [500, 120], { route: 'manhattan' });
  const { results } = runDiscoveryLoop(router, [creator, manhattanLine]);

  assert.equal(results.get('line_manhattan').meta.strategy, 'manhattan-basic', 'explicit manhattan keeps its own strategy');
  const manhattanRun = longestHorizontalRun(results.get('line_manhattan').pts);
  assert.equal(manhattanRun.y, 120, 'explicit manhattan line never bundles onto the trunk, unlike auto');
});

test('explicit manhattan is never re-upgraded even when the line itself references a channel', () => {
  const router = new RouterCore(
    { grid_resolution: 8, channels: { chan: { bounds: [250, 96, 50, 8], mode: 'force', direction: 'horizontal', weight: 1, line_spacing: 8 } } },
    {}, [0, 0, 600, 300]
  );
  router.setOverlays([]);
  const line = makeLine('line_a', [50, 100], [550, 100], { route: 'manhattan', route_channels: ['chan'] });
  const result = router.computePath(router.buildRouteRequest(line, line.a, line.b));
  assert.equal(result.meta.strategy, 'manhattan-basic', 'route: manhattan is honored even with an explicit channel reference');
});

test('default_mode overrides an unset per-line route; an explicit per-line route always wins', () => {
  const router = bareRouter({ default_mode: 'manhattan' });
  const unset = makeLine('line_unset', [50, 100], [500, 100], { route: '' });
  const explicitGrid = makeLine('line_explicit', [50, 120], [500, 120], { route: 'grid' });

  const unsetResult = router.computePath(router.buildRouteRequest(unset, unset.a, unset.b));
  const explicitResult = router.computePath(router.buildRouteRequest(explicitGrid, explicitGrid.a, explicitGrid.b));

  assert.equal(unsetResult.meta.strategy, 'manhattan-basic', 'default_mode: manhattan applies when route is unset');
  assert.notEqual(explicitResult.meta.strategy, 'manhattan-basic', 'an explicit per-line route: grid overrides default_mode');
});
