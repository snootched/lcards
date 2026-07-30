/**
 * `discoverable` (per-channel config, default true) scopes a channel out of
 * automatic trunk discovery — the mechanism (_discoverTrunkCandidates) that
 * offers ANY nearby auto/smart/grid line a channel as a bundling candidate
 * regardless of whether that line lists it in its own route_channels. That
 * mechanism is what powers zero-config bundling, but it also means a
 * channel authored for one specific, curated purpose could get spontaneously
 * joined by an unrelated line that merely happens to run close and parallel
 * — with no way to prevent it. `discoverable: false` closes that gap: the
 * channel becomes usable only by lines that explicitly reference it via
 * route_channels (the existing, pre-existing per-line opt-in — see
 * msd-schema.js's `route_channels` field). Default true preserves today's
 * behavior for every existing config.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { makeRouter, makeLine, runDiscoveryLoop } from './helpers/router-harness.js';

// Horizontal prefer channel: x 200-400, y 80-120 (cross-axis center 100).
const configWith = (discoverable) => ({
  channels: {
    chan_h: {
      bounds: [200, 80, 200, 40], mode: 'prefer', direction: 'horizontal', weight: 0.5, line_spacing: 8,
      ...(discoverable === undefined ? {} : { discoverable })
    }
  }
});

// A line that never lists chan_h in route_channels, but runs close/parallel
// enough (y=105, within trunk_proximity of the channel's crossCenter=100;
// full x-overlap with the channel's 200-400 span) to legitimately qualify
// for spontaneous discovery under the default, unscoped behavior.
const NEARBY_UNCONFIGURED = ['line_near', [50, 105], [550, 105]];

test('discoverable defaults to true — an unconfigured nearby line is still offered the channel', () => {
  const router = makeRouter(configWith(undefined));
  const candidates = router._discoverTrunkCandidates(...NEARBY_UNCONFIGURED, new Set(), []);
  assert.ok(candidates.some(c => c.id === 'chan_h'), 'default discoverable:true must still offer the channel to a nearby, non-configured line');
});

test('discoverable:false hides the channel from a line that does not reference it', () => {
  const router = makeRouter(configWith(false));
  const candidates = router._discoverTrunkCandidates(...NEARBY_UNCONFIGURED, new Set(), []);
  assert.ok(!candidates.some(c => c.id === 'chan_h'), 'discoverable:false must not offer the channel to an unconfigured line');
});

test('discoverable:false does not affect a line that explicitly lists the channel via route_channels', () => {
  const router = makeRouter(configWith(false));
  const line = makeLine('line_explicit', [50, 100], [550, 100], { route_channels: ['chan_h'] });
  const { results } = runDiscoveryLoop(router, [line]);
  const result = results.get('line_explicit');
  assert.equal(result.meta.chainChannels?.[0]?.id, 'chan_h', 'a line that explicitly opts in must still be able to use a non-discoverable channel');
});

test('discoverable:false does not affect a purely line-discovered trunk (only channel-origin rows carry the flag)', () => {
  const router = makeRouter({});
  router._registerLineSegments('line_creator', [[50, 100], [500, 100]], [50, 100], [500, 100]);
  const candidates = router._discoverTrunkCandidates('line_joiner', [50, 105], [500, 105], new Set(), []);
  assert.ok(candidates.length > 0 && candidates[0].discoverable === undefined, 'a discovered (non-channel) trunk must never carry discoverable:false implicitly');
});
