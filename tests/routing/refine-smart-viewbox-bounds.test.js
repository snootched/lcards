/**
 * Reported live: a `strategy: 'smart'` route with NO channel involvement at
 * all dipped down to y=768 — outside the card's own declared 765-height
 * viewBox — before continuing to its destination.
 *
 * Root cause: `_refineSmart`'s elbow-shift candidate validation (the loop
 * that rejects a shifted-elbow candidate for crossing a registered obstacle
 * or backtracking against the route's own flow — see this file's own
 * extensive history of "confirmed as a real regression" comments right
 * above that loop) never checked whether the candidate's own shifted point
 * stayed within the viewBox at all. A large enough corner-radius shortfall
 * elsewhere in the same path (`cornerShortfallBefore: 29` in the reported
 * case) made an off-canvas candidate look like a genuine cost improvement,
 * since nothing in the cost comparison had any notion of "off-canvas" being
 * worse than "on-canvas".
 *
 * Fixed by adding a viewBox-bounds check to the same rejection loop,
 * alongside the existing obstacle-crossing and same-axis-reversal checks —
 * reject outright (never repair) exactly like those two, since there's no
 * single well-defined "pull it back onto the canvas" fix either.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { makeRouter, makeLine, runDiscoveryLoop } from './helpers/router-harness.js';

const VIEW_BOX = [0, 0, 990, 765];

function runScenario() {
  const router = makeRouter({
    grid_resolution: 60,
    trunk_line_spacing: 8,
    turn_penalty: 2,
    channels: {
      channel_1: { bounds: [596.5, 600.91, 302.8, 72.48], mode: 'prefer', direction: 'auto', weight: 1, line_spacing: 8, discoverable: false },
      channel_north: { bounds: [482.22, 206.73, 79.76, 385.98], mode: 'prefer', direction: 'vertical', weight: 0.4, line_spacing: 16, discoverable: true }
    }
  }, {}, VIEW_BOX);
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

test('no line ever renders a point outside the declared viewBox', () => {
  const { results } = runScenario();
  const [vx, vy, vw, vh] = VIEW_BOX;
  for (const [id, result] of results) {
    for (const [x, y] of result.pts) {
      assert.ok(x >= vx && x <= vx + vw, `${id}: point x=${x} outside viewBox [${vx},${vx + vw}]: ${JSON.stringify(result.pts)}`);
      assert.ok(y >= vy && y <= vy + vh, `${id}: point y=${y} outside viewBox [${vy},${vy + vh}]: ${JSON.stringify(result.pts)}`);
    }
  }
});
