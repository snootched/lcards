/**
 * Reported live, immediately after channel-entry-direction.test.js's own fix
 * shipped: raising `weight` on the same `route_channels`-bound 'prefer'
 * channel had no effect (expected — see that file's docblock), but lowering
 * `turn_penalty` to 0.5 (an unrelated tuning experiment) resurfaced what
 * looked like the SAME bug class: line_2 and line_3 now crossed each other
 * TWICE, with sharp, unroundable 90° corners at the crossings. User's own
 * words: "technically the line order going north should have line_2 to the
 * left of line_3" — the two lines' target columns never legitimately need
 * to cross at all.
 *
 * Root cause, confirmed via direct code reading (computePath's own
 * `computePlain` closure) and reproduced in isolation: the "plain" candidate
 * that `computePath` compares against every corridor option, for a
 * `mode: 'prefer'` channel referenced via `route_channels`, was built from
 * `stubReq` — which still carries the line's OWN `req.channels` through
 * unmodified. `_computeGrid` unconditionally builds a per-cell channel cost
 * bias (`_buildChannelCostGrid`) from whatever `req.channels` names,
 * regardless of whether that particular `_computeGrid` call is the leg
 * actually designated as the corridor crossing — the exact same broader
 * architectural characteristic documented in
 * channel-entry-direction.test.js's own docblock, but biting a totally
 * different call site this time: not a corridor LEG, but the "plain,
 * non-corridor" comparison baseline itself.
 *
 * That meant "plain" was never actually channel-blind: it got rewarded
 * (`_buildChannelCostGrid`'s 'prefer' discount) for wandering into the
 * channel's bounds even though the corridor was never actually entered
 * (`channel.coveragePct` stayed 0 — confirmed directly). Nothing makes a
 * detour-for-an-unrealized-discount shape actively cheaper on its own
 * either — until `turn_penalty` (the flat per-move A* search cost for a
 * direction change) is lowered enough that the extra bends needed to chase
 * the discount become nearly free. At that point the detour can beat the
 * honest direct shape on the compared cost even though the detour crosses
 * a completely different line's own route twice.
 *
 * Fixed in `computePath`: the request used for `computePlain()` strips any
 * channel id that made it into `explicitCorridors` (i.e. any 'force'/
 * 'prefer' channel this line could actually chain through) before being
 * passed to `_computeGrid`/`_refineSmart` — an honest "if this line never
 * used the channel at all" baseline, matching what the surrounding
 * plain-vs-corridor cost comparison already assumes it's comparing.
 * 'avoid'-mode channel ids are deliberately left in place: they're never
 * chained into `explicitCorridors`, so their repulsion bias is exactly what
 * an honest plain route should still respect.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { makeRouter, makeLine, runDiscoveryLoop, findIllegalReversal, countRenderedCrossings } from './helpers/router-harness.js';

// The reported config verbatim: same 3-line/4-control layout as
// channel-entry-direction.test.js, but with turn_penalty lowered to 0.5 and
// channel_1's weight raised to 1 — the exact change that resurfaced the bug.
function runScenario() {
  const router = makeRouter({
    grid_resolution: 60,
    trunk_line_spacing: 8,
    turn_penalty: 0.5,
    channels: { channel_1: { bounds: [606.86, 531.04, 302.8, 99.65], mode: 'prefer', direction: 'auto', weight: 1, line_spacing: 8, discoverable: false } }
  }, {}, [0, 0, 990, 765]);
  router.setOverlays([
    { id: 'control_1', _raw: { obstacle: true, position: [278.81, 115.32], size: [112, 73], attachment: 'left' } },
    { id: 'control_2', _raw: { obstacle: true, position: [120, 540], size: [166, 50], attachment: 'center' } },
    { id: 'control_3', _raw: { obstacle: true, position: [120, 600], size: [166, 50], attachment: 'center' } },
    { id: 'control_4', _raw: { obstacle: true, position: [120, 660], size: [166, 50], attachment: 'center' } },
  ]);
  const lines = [
    makeLine('line_1', [334.81, 115.32], [219, 540], { route: 'smart', anchor_side: 'center', attach_side: 'right' }),
    makeLine('line_2', [203, 600], [546.5625, 204.13746630727763], { route: 'smart', anchor_side: 'right', attach_side: 'center' }),
    makeLine('line_3', [203, 660], [974.53125, 247.43935309973045], { route: 'smart', anchor_side: 'right', attach_side: 'center', route_channels: ['channel_1'] }),
  ];
  return runDiscoveryLoop(router, lines);
}

test('line_2 and line_3 never cross, in the full reported multi-line scenario with a low turn_penalty', () => {
  const { results } = runScenario();
  const line2 = results.get('line_2');
  const line3 = results.get('line_3');
  assert.equal(countRenderedCrossings(line2.pts, line3.pts), 0,
    `expected no crossings (line_2 stays left of line_3), got line_2=${JSON.stringify(line2.pts)} line_3=${JSON.stringify(line3.pts)}`);
  assert.equal(findIllegalReversal(line3.pts), null);
});

test('a prefer-channel line takes the honest plain route once a competing line makes the corridor a net loss, minimal 2-line case', () => {
  // Confirms the actual fix in the smallest possible reproduction (no
  // obstacles needed): in true isolation, line_3 alone legitimately WINS by
  // taking the corridor (confirmed separately: strategy 'corridor-routed',
  // real non-zero coveragePct — a fair, deliberate use of the channel it
  // opted into, not a bug). It's only once line_2 is also registered that a
  // crossing risk exists — and the plain candidate must be genuinely
  // channel-blind for the crossing-avoidance cost to correctly tip the
  // comparison back to it, rather than the plain candidate ALSO chasing an
  // unearned channel discount and still coming out looking cheap enough to
  // detour through anyway.
  const router = makeRouter({
    grid_resolution: 60, trunk_line_spacing: 8, turn_penalty: 0.5,
    channels: { channel_1: { bounds: [606.86, 531.04, 302.8, 99.65], mode: 'prefer', direction: 'auto', weight: 1, line_spacing: 8, discoverable: false } }
  }, {}, [0, 0, 990, 765]);
  const lines = [
    makeLine('line_2', [203, 600], [546.5625, 204.13746630727763], { route: 'smart', anchor_side: 'right', attach_side: 'center' }),
    makeLine('line_3', [203, 660], [974.53125, 247.43935309973045], { route: 'smart', anchor_side: 'right', attach_side: 'center', route_channels: ['channel_1'] }),
  ];
  const { results } = runDiscoveryLoop(router, lines);
  const line3 = results.get('line_3');
  assert.equal(line3.meta.bends, 1, `expected the honest, undetoured L-shape once a crossing risk exists, got: ${JSON.stringify(line3.pts)}`);
  assert.equal(countRenderedCrossings(results.get('line_2').pts, line3.pts), 0);
  assert.equal(findIllegalReversal(line3.pts), null);
});
