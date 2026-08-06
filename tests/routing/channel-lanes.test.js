/**
 * Config-channel lane assignment: explicit channel users get centered,
 * distinct lanes derived from live membership — a lone line rides the
 * channel's own reference coordinate (offset 0), and lanes stay inside the
 * authored band.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { makeRouter, makeLine, runDiscoveryLoop, longestHorizontalRun } from './helpers/router-harness.js';

// Horizontal force channel: x 200-400, y 80-120 (cross-axis center 100).
const CHANNEL_CONFIG = {
  channels: {
    chan_h: { bounds: [200, 80, 200, 40], mode: 'force', direction: 'horizontal', line_spacing: 8 }
  }
};

const mkUser = (id) => makeLine(id, [50, 100], [550, 100], { route_channels: ['chan_h'] });

test('a lone channel user rides the channel reference line (offset 0)', () => {
  const router = makeRouter(CHANNEL_CONFIG);
  const { results } = runDiscoveryLoop(router, [mkUser('line_solo')]);
  const run = longestHorizontalRun(results.get('line_solo').pts);
  assert.equal(run.y, 100, 'single user gets the centered lane, not a half-spacing offset');
});

test('three channel users get distinct, centered lanes inside the authored band', () => {
  const router = makeRouter(CHANNEL_CONFIG);
  const lines = ['line_p', 'line_q', 'line_r'].map(mkUser);
  const { results } = runDiscoveryLoop(router, lines);

  const lanes = lines.map(l => longestHorizontalRun(results.get(l.id).pts).y);
  assert.equal(new Set(lanes).size, 3, `distinct lanes required (got ${lanes.join(', ')})`);
  // Centered scheme, sorted user ids p/q/r -> offsets -8/0/+8 around y=100.
  assert.deepEqual(lanes, [92, 100, 108]);
  for (const y of lanes) {
    assert.ok(y >= 80 && y <= 120, `lane y=${y} must stay inside the authored channel band`);
  }
});
