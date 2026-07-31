/**
 * Reported live: a line chained through an explicit
 * `route_channels: [channel_2, channel_3]`, where channel_2 is
 * `mode: 'force'` (vertical, x-band 500-550) and channel_3 is
 * `mode: 'prefer'` (auto, x-band 245.24-434.19), produced a path that
 * zigzags: it enters channel_2's own x-band, backs out west into
 * channel_3's band, travels south, then RE-ENTERS channel_2's x-band a
 * second time before reaching the destination — visiting the same
 * channel's spatial territory twice.
 *
 * Two, layered root causes/fixes:
 *
 * 1. `hasForceChannel` in `_computeCorridorRoutedAttempt` was computed
 *    chain-wide — true whenever ANY channel in the chain is `force` — and
 *    disabled BOTH the obstacle-landing check and the whole-route
 *    self-intersection check (`_polylineSelfIntersects`) for the ENTIRE
 *    chain, not just the force channel's own leg. So a `prefer` leg (or
 *    the tail leg toward `attach_to`) backtracking through an
 *    already-visited channel's band was silently tolerated purely because
 *    SOME OTHER channel in the chain happens to be force. Fixed by
 *    narrowing both checks to a three-way branch, using
 *    `_segmentInsideChannelBounds`-derived containment: a pure force-only
 *    chain still never hard-rejects (see the direct-corridor-order test
 *    below); a pure prefer/trunk chain is unchanged; a MIXED chain now
 *    retries force-only (`RETRY_FORCE_ONLY`) instead of silently accepting
 *    the zigzag.
 *
 * 2. DEEPER root cause, found on follow-up user report: `_mergeCorridors`
 *    used to preserve an explicit `route_channels` array in its literal
 *    DECLARED order, on the theory that "the user's declared sequence is
 *    the only signal expressing intent" — but the Studio UI's own channel
 *    picker is a plain checkbox list with no ordering control at all, so
 *    that theory doesn't hold in practice: whatever order channels happen
 *    to serialize in is arbitrary from the user's own point of view, and a
 *    declared order that doesn't match the physical anchor->destination
 *    path is exactly what produces the zigzag in (1) above — no amount of
 *    per-leg backstop can make a backwards chain order look clean. Fixed
 *    by `_orderCorridorChain`: explicit corridors are now reordered by
 *    exact permutation-search total-distance minimization BEFORE the chain
 *    is ever built, so the SAME declared array order from the original
 *    report now produces a clean route automatically, using BOTH channels,
 *    with no YAML edit required.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { makeRouter, makeLine, routeLine, findSelfCrossing, findIllegalReversal, findDiagonalSegment, findUnnecessaryDetour } from './helpers/router-harness.js';

// The reported config's own geometry (channel bounds + the line's real
// stub-resolved endpoints), simplified to just the one line involved.
function makeMixedChainRouter() {
  return makeRouter({
    grid_resolution: 32,
    channels: {
      channel_2: { bounds: [500, 275, 50, 400], mode: 'force', direction: 'vertical', weight: 0.5, line_spacing: 8, discoverable: true },
      channel_3: { bounds: [245.24, 475.22, 188.95, 56.07], mode: 'prefer', direction: 'auto', weight: 0.5, line_spacing: 8, discoverable: true }
    }
  }, {}, [0, 0, 990, 765]);
}

test('the ORIGINAL declared route_channels order (never reordered by the user) now produces a clean route using BOTH channels', () => {
  const router = makeMixedChainRouter();
  // route_channels declared exactly as originally reported: [channel_2, channel_3] —
  // geometrically backwards (channel_2 is east of the anchor, channel_3 is
  // west and closer) but this is exactly what the Studio's checkbox-only
  // channel picker can produce, since it has no ordering control at all.
  const line = makeLine('line_3', [175, 500], [506.2194519042969, 268.32000732421875], {
    route: 'smart', anchor_side: 'right', attach_side: 'center',
    route_channels: ['channel_2', 'channel_3']
  });
  const r = routeLine(router, line);
  assert.notEqual(r, null, 'corridor candidate was rejected entirely');
  assert.equal(r.meta.strategy, 'corridor-routed', `expected corridor-routed, got ${r.meta.strategy}`);

  // _orderCorridorChain should have reordered to [channel_3, channel_2] —
  // BOTH channels honored, nothing dropped, unlike the old RETRY_FORCE_ONLY
  // fallback which only ever kicks in when ordering alone can't help.
  const chainIds = (r.meta.chainChannels || []).map(c => c.id);
  assert.deepEqual(chainIds, ['channel_3', 'channel_2'], `expected auto-reordered [channel_3, channel_2], got ${JSON.stringify(chainIds)}`);

  assert.equal(findSelfCrossing(r.pts), null, `self-crosses: ${JSON.stringify(r.pts)}`);
  assert.equal(findIllegalReversal(r.pts), null, `reversed: ${JSON.stringify(r.pts)}`);
  assert.equal(findDiagonalSegment(r.pts), null, `diagonal segment: ${JSON.stringify(r.pts)}`);
  assert.equal(findUnnecessaryDetour(r.pts), null, `unnecessary detour: ${JSON.stringify(r.pts)}`);

  // Defense-in-depth, independent of the exact segment-pair geometry the
  // oracles above look for: the path's x-coordinate should enter
  // channel_2's own band [500,550] in at most ONE contiguous run, never
  // leave and come back.
  const CHAN2_X1 = 500, CHAN2_X2 = 550;
  let runs = 0, inside = false;
  for (const [x] of r.pts) {
    const nowInside = x >= CHAN2_X1 && x <= CHAN2_X2;
    if (nowInside && !inside) runs++;
    inside = nowInside;
  }
  assert.ok(runs <= 1, `path re-entered channel_2's x-band ${runs} time(s): ${JSON.stringify(r.pts)}`);
});

test('_orderCorridorChain picks the geometrically closer channel first, regardless of declared array order', () => {
  const router = makeMixedChainRouter();
  const stubReq = { a: [175, 500], b: [506.2194519042969, 268.32000732421875] };
  const chan2 = router._channels.find(c => c.id === 'channel_2');
  const chan3 = router._channels.find(c => c.id === 'channel_3');
  const orderedForward = router._orderCorridorChain([chan2, chan3], stubReq).map(c => c.id);
  const orderedReversed = router._orderCorridorChain([chan3, chan2], stubReq).map(c => c.id);
  assert.deepEqual(orderedForward, ['channel_3', 'channel_2'], `expected channel_3 first regardless of declared order, got ${JSON.stringify(orderedForward)}`);
  assert.deepEqual(orderedReversed, ['channel_3', 'channel_2'], `order should be independent of input array order, got ${JSON.stringify(orderedReversed)}`);
});

// Counter-invariant, exercised by calling _computeCorridorRouted DIRECTLY
// with a deliberately backward corridor order (bypassing _mergeCorridors'
// own auto-ordering, which would otherwise fix this exact geometry before
// the self-intersect check is ever reached — see the two tests above). This
// isolates the underlying exemption mechanism itself: a pure force-only
// chain must NEVER hard-reject, even when a genuine self-crossing shape is
// unavoidable given the corridor order it was actually asked to route
// through. Protects against a future change accidentally widening the
// scoped check to reject pure-force chains.
test('a pure force-only chain is never rejected for its own necessary self-crossing shape (direct corridor order, bypassing auto-ordering)', () => {
  const router = makeRouter({
    grid_resolution: 32,
    channels: {
      channel_2: { bounds: [500, 275, 50, 400], mode: 'force', direction: 'vertical', weight: 0.5, line_spacing: 8, discoverable: true },
      channel_3: { bounds: [245.24, 475.22, 188.95, 56.07], mode: 'force', direction: 'auto', weight: 0.5, line_spacing: 8, discoverable: true }
    }
  }, {}, [0, 0, 990, 765]);
  const line = makeLine('line_3', [175, 500], [506.2194519042969, 268.32000732421875], {
    route: 'smart', anchor_side: 'right', attach_side: 'center',
    route_channels: ['channel_2', 'channel_3']
  });
  const req = router.buildRouteRequest(line, line.a, line.b);
  const { stubReq } = router._applyCardinalStubs(req);
  const chan2 = router._channels.find(c => c.id === 'channel_2');
  const chan3 = router._channels.find(c => c.id === 'channel_3');
  // Deliberately backward order — both are force, so both are mandatory
  // regardless of order; this is exactly the shape that must survive.
  const r = router._computeCorridorRouted(stubReq, true, [chan2, chan3]);
  assert.notEqual(r, null, 'a pure force chain must never hard-fail on its own necessary shape');
  assert.equal(r.meta.strategy, 'corridor-routed', `expected corridor-routed, got ${r.meta?.strategy}`);
  // This IS the shape the exemption exists to tolerate — confirm it's
  // actually present, not accidentally testing a non-crossing candidate.
  assert.notEqual(findSelfCrossing(r.pts), null, 'test setup no longer produces the adversarial self-crossing shape it depends on');
});
