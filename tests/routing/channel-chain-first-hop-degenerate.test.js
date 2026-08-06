/**
 * Reported live: a line chained through TWO `mode: prefer` channels via
 * `route_channels` (`channel_north` then `channel_1`) rendered a same-axis
 * reversal departing the SECOND channel's own approach leg — overshooting
 * back the way it had just come before continuing on.
 *
 * Root cause, confirmed via direct leg-level tracing: `_computeCorridorRouted`'s
 * chain loop tracks `prevChannelDir` — the last known REAL direction of
 * travel — so a leg departing a channel whose OWN entry->exit crossing was
 * degenerate (zero real distance, `entry === exit`) still has a "don't
 * reverse" guarantee instead of zero protection (see the same variable's
 * own docblock, and `channel-entry-direction.test.js` for an earlier,
 * related fix in the same family). That mechanism works by carrying a real
 * direction FORWARD from an earlier channel in the chain — but has no
 * fallback when the very FIRST channel in the chain is itself the
 * degenerate one: there is no earlier channel to carry a direction from,
 * so `prevChannelDir` silently stayed at its initial 0, and the SECOND
 * channel's own approach leg departed with zero reversal protection at all.
 *
 * In the reported config: `channel_north`'s own bounds don't reach the
 * line's own flow-axis range (the line approaches from below the channel's
 * lower boundary), so its entry gets clamped to that boundary with zero
 * real span to the channel's own exit — a genuinely degenerate first hop.
 * The line's own approach leg into that boundary still has a REAL, known
 * arrival direction (it's hard-blocked to arrive via a genuine axis-aligned
 * move by the entry hint) — that fact just wasn't being used as a fallback.
 *
 * Fixed by computing that fallback: when a channel's own continuationDir is
 * 0 AND it's the first channel in the chain (k===0), derive a direction
 * from the approach leg's own real displacement (cursor-before-this-channel
 * to entry) and use it exactly like a carried-forward direction would be.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { makeRouter, makeLine, runDiscoveryLoop, findIllegalReversal, findDiagonalSegment, findSelfCrossing } from './helpers/router-harness.js';

// The reported config verbatim: channel_north's own y1/y2 (206.73/528)
// don't reach line_3's anchor row (660) — approaching from below forces a
// clamped, degenerate first crossing — chained into channel_1 (y 600.91-673.39)
// immediately after.
function runScenario() {
  const router = makeRouter({
    grid_resolution: 60,
    trunk_line_spacing: 8,
    turn_penalty: 2,
    channels: {
      channel_1: { bounds: [596.5, 600.91, 302.8, 72.48], mode: 'prefer', direction: 'auto', weight: 1, line_spacing: 8, discoverable: false },
      channel_north: { bounds: [482.22, 206.73, 79.76, 321.27], mode: 'prefer', direction: 'vertical', weight: 0.4, line_spacing: 16, discoverable: true }
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

test('no line reverses when chaining through a degenerate-first-hop channel pair', () => {
  const { results } = runScenario();
  for (const [id, result] of results) {
    assert.equal(findIllegalReversal(result.pts), null, `${id} reversed: ${JSON.stringify(result.pts)}`);
    assert.equal(findDiagonalSegment(result.pts), null, `${id} has a diagonal segment: ${JSON.stringify(result.pts)}`);
    // Same corridor-chaining family as the reversal bug above, but a
    // DIFFERENT defect (a later leg crossing an earlier one) — see
    // corridor-self-crossing.test.js's own docblock for the full writeup.
    // Not redundant with the reversal/diagonal checks: a self-crossing loop
    // trips neither of those.
    assert.equal(findSelfCrossing(result.pts), null, `${id} self-crosses: ${JSON.stringify(result.pts)}`);
  }
});

test('a line chaining channel_north (degenerate first hop) then channel_1 in isolation never reverses', () => {
  const router = makeRouter({
    grid_resolution: 60, trunk_line_spacing: 8, turn_penalty: 2,
    channels: {
      channel_1: { bounds: [596.5, 600.91, 302.8, 72.48], mode: 'prefer', direction: 'auto', weight: 1, line_spacing: 8, discoverable: false },
      channel_north: { bounds: [482.22, 206.73, 79.76, 321.27], mode: 'prefer', direction: 'vertical', weight: 0.4, line_spacing: 16, discoverable: true }
    }
  }, {}, [0, 0, 990, 765]);
  const line = makeLine('line_3', [203, 660], [974.53125, 247.43935309973045], {
    route: 'smart', anchor_side: 'right', attach_side: 'center', route_channels: ['channel_north', 'channel_1']
  });
  const r = router.computePath(router.buildRouteRequest(line, line.a, line.b));
  assert.equal(findIllegalReversal(r.pts), null, `reversed: ${JSON.stringify(r.pts)}`);
  assert.equal(findDiagonalSegment(r.pts), null);
});
