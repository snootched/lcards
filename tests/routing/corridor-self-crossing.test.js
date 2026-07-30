/**
 * Reported live: chaining a line through two `mode: 'prefer'` channels
 * (`route_channels: [channel_north, channel_1]`) produced a route where a
 * LATER leg's own segment crosses an EARLIER leg's own segment — a literal
 * self-intersecting loop in the rendered SVG path. Confirmed geometrically
 * in the exact reported output: segment `(526.1,660)->(526.1,540)` crosses
 * segment `(432,637.15)->(974.53125,637.15)` at `(526.1,637.15)`.
 *
 * Root cause: `_computeCorridorRouted` builds a route by independently
 * pathfinding each leg of the chain — a leg has zero awareness of an
 * earlier leg's own geometry in the same candidate. The channel discount
 * (`_corridorDelta`'s `deltaCost`, `-590.53` in the reported case — several
 * hundred units) is large enough that this self-crossing candidate still
 * wins `computePath`'s corridor-vs-plain cost comparison, because the
 * existing crossing-cost term in that comparison
 * (`_segmentCrossingPenalty`) only checks a candidate against OTHER lines'
 * registered segments (`this._crossings`) — never against the candidate's
 * OWN earlier legs.
 *
 * Fixed by `_polylineSelfIntersects`: a hard reject (not a bigger cost
 * penalty — a penalty can always in principle be outweighed by a large
 * enough discount elsewhere in the same candidate, exactly the failure
 * mode here) checked at the end of `_computeCorridorRouted`, mirroring
 * this function's own existing `_pointInsideObstacle` hard-reject
 * precedent (same `!hasForceChannel` gate: force channels are mandatory by
 * explicit user config, never silently overridden). `computePath`'s own
 * corridor-vs-plain comparison already treats a null candidate as simply
 * unavailable and falls back correctly — no changes needed there.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { makeRouter, makeLine, runDiscoveryLoop, findSelfCrossing, findIllegalReversal, findDiagonalSegment } from './helpers/router-harness.js';

// The reported config verbatim: channel_north (prefer, vertical) chained
// into channel_1 (prefer, auto) via line_3's own route_channels.
function runScenario() {
  const router = makeRouter({
    grid_resolution: 60,
    trunk_line_spacing: 8,
    turn_penalty: 2,
    channels: {
      channel_1: { bounds: [596.5, 600.91, 302.8, 72.48], mode: 'prefer', direction: 'auto', weight: 1, line_spacing: 8, discoverable: false },
      channel_north: { bounds: [482.22, 206.73, 79.76, 410.57], mode: 'prefer', direction: 'vertical', weight: 0.4, line_spacing: 16, discoverable: true }
    }
  }, {}, [0, 0, 990, 765]);
  router.setOverlays([
    { id: 'control_1', _raw: { obstacle: true, position: [278.81, 115.32], size: [112, 73], attachment: 'left' } },
    { id: 'control_2', _raw: { obstacle: true, position: [120, 540], size: [166, 50], attachment: 'center' } },
    { id: 'control_3', _raw: { obstacle: true, position: [120, 600], size: [166, 50], attachment: 'center' } },
    { id: 'control_4', _raw: { obstacle: true, position: [120, 660], size: [166, 50], attachment: 'center' } },
  ]);
  const lines = [
    makeLine('line_1', [334.81, 115.32], [219, 540], { route: 'smart', anchor_side: 'center', attach_side: 'right' }),
    makeLine('line_2', [203, 600], [546.5625, 204.13746630727763], { route: 'smart', anchor_side: 'right', attach_side: 'center', route_channels: ['channel_north'] }),
    makeLine('line_3', [203, 660], [974.53125, 247.43935309973045], { route: 'smart', anchor_side: 'right', attach_side: 'center', route_channels: ['channel_north', 'channel_1'] }),
  ];
  return runDiscoveryLoop(router, lines);
}

test('no line ever renders a self-crossing loop, chaining through two prefer channels', () => {
  const { results } = runScenario();
  for (const [id, result] of results) {
    assert.equal(findSelfCrossing(result.pts), null, `${id} self-crosses: ${JSON.stringify(result.pts)}`);
    assert.equal(findIllegalReversal(result.pts), null, `${id} reversed: ${JSON.stringify(result.pts)}`);
    assert.equal(findDiagonalSegment(result.pts), null, `${id} has a diagonal segment: ${JSON.stringify(result.pts)}`);
  }
});

test('the corridor-vs-plain comparison never picks a self-crossing candidate, in isolation', () => {
  const router = makeRouter({
    grid_resolution: 60, trunk_line_spacing: 8, turn_penalty: 2,
    channels: {
      channel_1: { bounds: [596.5, 600.91, 302.8, 72.48], mode: 'prefer', direction: 'auto', weight: 1, line_spacing: 8, discoverable: false },
      channel_north: { bounds: [482.22, 206.73, 79.76, 410.57], mode: 'prefer', direction: 'vertical', weight: 0.4, line_spacing: 16, discoverable: true }
    }
  }, {}, [0, 0, 990, 765]);
  const line = makeLine('line_3', [203, 660], [974.53125, 247.43935309973045], {
    route: 'smart', anchor_side: 'right', attach_side: 'center', route_channels: ['channel_north', 'channel_1']
  });
  const r = router.computePath(router.buildRouteRequest(line, line.a, line.b));
  assert.equal(findSelfCrossing(r.pts), null, `self-crosses: ${JSON.stringify(r.pts)}`);
});
