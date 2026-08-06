/**
 * Reported live: after `_orderCorridorChain` (see
 * force-prefer-chain-backtrack.test.js) correctly reordered a line's
 * explicit `route_channels` chain (`channel_3` (prefer, horizontal-flow)
 * -> `channel_2` (force, vertical-flow)), the line STILL rendered a 3-corner
 * "dogleg" jog between the two channels — up, over, up again — instead of
 * the clean single elbow every OTHER line sharing `channel_2` gets when
 * joining it directly from its own anchor. Reported verbatim: "the exit
 * still does a 3-turn kink instead of the expected straight exit and then
 * turn north into the side of channel_2."
 *
 * Root cause, confirmed via direct instrumentation of
 * `_channelCrossingPoints`/`_corridorRefPoint` (not hand-derivation — this
 * router's own history shows hand-tracing repeatedly reaches the wrong
 * conclusion): `_channelCrossingPoints`'s "grace zone" entry taper (see
 * `entry-taper-grace-zone.test.js`) reserves `stubLengthFor(...)`-worth of
 * flow-axis room whenever `entryAlreadyInside && laneCount > 1` — built to
 * avoid a zero-length kink when a line arrives ALREADY travelling along the
 * channel's own flow axis (so the cross-axis lane correction would
 * otherwise have nowhere to happen). But the taper's own trigger condition
 * never checked WHICH axis the incoming leg actually travelled — only
 * whether flow-axis clamping was a no-op. When the previous channel in a
 * chain flows PERPENDICULAR to this one (here: channel_3 horizontal ->
 * channel_2 vertical), the connecting leg was already travelling along
 * exactly the axis the correction needs, giving real natural room for free
 * — tapering anyway just relocates one clean corner into an unnecessary
 * extra dogleg. Confirmed exactly: with channel_2 shared by 3 other lines
 * (`laneCount: 4`, this line's own `laneOffset: -12`), the taper shifted
 * the entry point 68 units off its own natural flow coordinate for no
 * reason — `line_3` went from 6 bends down to 4 once fixed.
 *
 * Fixed by threading `approachAxisHorizontal` (the PREVIOUS channel's own
 * flow axis — `null` for the true first channel in a chain, left
 * untouched) from `_computeCorridorRoutedAttempt`'s own k-loop (reusing its
 * existing `prevChannelHorizontal` tracking, no new state) into
 * `_channelCrossingPoints`, narrowing the taper's gate to only engage when
 * that axis is unknown OR matches this channel's own flow axis (genuine
 * zero-room risk) — never when it's known and PERPENDICULAR (natural room
 * already exists).
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { makeRouter, makeLine, runDiscoveryLoop, findSelfCrossing, findIllegalReversal } from './helpers/router-harness.js';

// The reported config's own geometry: channel_2 (force, vertical) shared by
// line_3 (chained through channel_3 first) and 3 other lines that join
// channel_2 directly from their own anchors.
function runScenario() {
  const router = makeRouter({
    grid_resolution: 32,
    channels: {
      channel_2: { bounds: [500, 275, 50, 400], mode: 'force', direction: 'vertical', weight: 0.5, line_spacing: 8, discoverable: true },
      channel_3: { bounds: [245.24, 475.22, 188.95, 56.07], mode: 'prefer', direction: 'auto', weight: 0.5, line_spacing: 8, discoverable: true }
    }
  }, {}, [0, 0, 990, 765]);
  router.setOverlays([
    { id: 'control_3', _raw: { obstacle: true, position: [100, 500], size: [150, 50], attachment: 'center' } },
    { id: 'control_4', _raw: { obstacle: true, position: [100, 550], size: [150, 50], attachment: 'center' } },
    { id: 'control_5', _raw: { obstacle: true, position: [100, 600], size: [150, 50], attachment: 'center' } },
    { id: 'control_6', _raw: { obstacle: true, position: [100, 650], size: [150, 50], attachment: 'center' } },
  ]);
  const lines = [
    makeLine('line_3', [175, 500], [506.2194519042969, 268.32000732421875], { route: 'smart', anchor_side: 'right', attach_side: 'center', route_channels: ['channel_2', 'channel_3'] }),
    makeLine('line_4', [175, 550], [546.5625, 204.13746630727763], { route: 'smart', anchor_side: 'right', attach_side: 'center', route_channels: ['channel_2'] }),
    makeLine('line_5', [175, 600], [688.2197265625, 252.31463623046875], { route: 'smart', anchor_side: 'right', attach_side: 'center', route_channels: ['channel_2'] }),
    makeLine('line_6', [175, 650], [850.9133911132812, 250.996337890625], { route: 'smart', anchor_side: 'right', attach_side: 'center', route_channels: ['channel_2'] }),
  ];
  return runDiscoveryLoop(router, lines);
}

test('a line chained horizontal-channel -> vertical-channel, joining the vertical channel\'s shared lane, gets a single clean elbow, not a dogleg', () => {
  const { results } = runScenario();
  const line3 = results.get('line_3');
  assert.equal(line3.meta.strategy, 'corridor-routed');
  // Before the fix: 6 bends (an extra up-over-up dogleg between the two
  // channels). After: 4 — a straight run through channel_3 directly into
  // channel_2's own (lane-offset) entry x, then straight up, then the
  // final stub. Matches lines 4/5/6's own 2-bend shape plus the 2 extra
  // bends genuinely needed for channel_3's own entry/exit.
  assert.equal(line3.meta.bends, 4, `expected 4 bends (clean transition), got ${line3.meta.bends}: ${JSON.stringify(line3.pts)}`);
  assert.equal(findSelfCrossing(line3.pts), null, `self-crosses: ${JSON.stringify(line3.pts)}`);
  assert.equal(findIllegalReversal(line3.pts), null, `reversed: ${JSON.stringify(line3.pts)}`);

  // The transition point itself: exiting channel_3 and entering channel_2
  // should happen at the SAME y (a straight horizontal run all the way to
  // channel_2's own entry x), not two different y-values 68 units apart.
  const ys = line3.pts.map(p => p[1]);
  const distinctYsInMiddle = new Set(ys.slice(2, -2).map(y => Math.round(y * 1000)));
  assert.equal(distinctYsInMiddle.size, 1, `expected one straight run between the two channels, got y-values: ${JSON.stringify([...distinctYsInMiddle])} in ${JSON.stringify(line3.pts)}`);
});

test('every other line joining the shared force channel directly is unaffected (still 2 clean bends)', () => {
  const { results } = runScenario();
  for (const id of ['line_4', 'line_5', 'line_6']) {
    const r = results.get(id);
    assert.equal(r.meta.bends, 2, `${id}: expected 2 bends, got ${r.meta.bends}`);
  }
});
