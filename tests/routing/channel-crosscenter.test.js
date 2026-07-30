/**
 * Regression coverage for a reported bug: a line chained through a single,
 * config-authored `channels:` entry (its only/last hop) rendered a short,
 * pointless "notch" — jog away from its natural lane and immediately back —
 * right at the channel's entry AND exit edges.
 *
 * Root cause: `_channelCrossingPoints`'s `throughCoord` falls back to
 * averaging the line's approach/depart reference points whenever
 * `chan.crossCenter` isn't finite. A CONFIG channel never had `crossCenter`
 * populated at all (only a discovered trunk gets one, at registration) — so
 * every config channel always hit that fallback. For a channel that's the
 * LAST/only hop in a chain, the "depart" reference is the line's TRUE FINAL
 * DESTINATION (per `_computeCorridorRouted`'s own `nextRef` — `stubReq.b`
 * when there's no next channel), which can be arbitrarily far from the
 * channel and unrelated to it. Averaging a near reference (the anchor stub,
 * reasonably close) with a far, unrelated one produced an arbitrary crossing
 * coordinate, then that coordinate got registered as a MANDATORY point ("a
 * channel's own entry/exit... a real, meaningful crossing" —
 * `_computeCorridorRouted`'s `mandatoryPoints`), which blocks both
 * `_collapseSoftLegReversals` and `_compactPolyline` from ever removing it —
 * forcing the line to notch toward the wrong coordinate and back at both
 * boundaries.
 *
 * This exact control/line layout (control_1-4 positions, line_1/2/3
 * anchors) already has five rounds of routing hardening behind it in
 * `turnaround-regression.test.js` — but that file has NO `channels:` config
 * at all, so it never exercised this fallback branch (a config channel is
 * the only case where `crossCenter` is ever unset). This file adds the
 * missing coverage: same scenario, `channel_1` added, matching the reported
 * config. Bounds here are taken from the reported LIVE trunk registry dump
 * (`window.lcards.debug.msd.routing.trunks()`) — `x1:300, y1:585.4, x2:900,
 * y2:685.05` — since that's what RouterCore actually routed against; it
 * doesn't arithmetically match the raw authored `bounds: [394.65, 585.4,
 * 302.8, 99.65]` YAML array from the same report, a discrepancy this file
 * doesn't investigate (fixing THIS bug doesn't depend on it — reproducing
 * the exact reported symptom does).
 *
 * Fix: `_normalizeChannels` (RouterCore.js) now computes and stores
 * `crossCenter` for every config channel at seed time — the same value
 * `trunks()`'s own debug introspection already computed as a display-only
 * fallback that the live router never actually consulted. This routes
 * `_channelCrossingPoints` through the clean, deterministic
 * `crossCenter + offset` branch unconditionally for config channels instead.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { makeRouter, makeLine, runDiscoveryLoop, findIllegalReversal, findUnnecessaryDetour, findDiagonalSegment, segmentCrossesObstacle, longestHorizontalRun } from './helpers/router-harness.js';

const OBSTACLES_RAW = [
  { id: 'control_1', _raw: { obstacle: true, position: [278.81, 115.32], size: [112, 73], attachment: 'left' } },
  { id: 'control_2', _raw: { obstacle: true, position: [120, 540], size: [166, 50], attachment: 'center' } },
  { id: 'control_3', _raw: { obstacle: true, position: [120, 600], size: [166, 50], attachment: 'center' } },
  { id: 'control_4', _raw: { obstacle: true, position: [120, 660], size: [166, 50], attachment: 'center' } },
];

// [x, y, w, h] -> x1:300, y1:585.4, x2:900, y2:685.05 (see file docblock for
// why this doesn't match the raw authored YAML's own bounds array).
const CHANNEL_1 = { bounds: [300, 585.4, 600, 99.65], mode: 'prefer', direction: 'auto', weight: 0.5, line_spacing: 8 };
const TRUE_CROSS_CENTER = 585.4 + 99.65 / 2; // 635.225 — the authored band's own midpoint

function runScenario(gridResolution) {
  const router = makeRouter(
    { grid_resolution: gridResolution, trunk_line_spacing: 8, channels: { channel_1: CHANNEL_1 } },
    {},
    [0, 0, 990, 765]
  );
  router.setOverlays(OBSTACLES_RAW);
  const lines = [
    makeLine('line_1', [334.81, 115.32], [219, 540], { route: 'smart', anchor_side: 'center', attach_side: 'right' }),
    makeLine('line_2', [203, 600], [546.5625, 204.13746630727763], { route: 'smart', anchor_side: 'right', attach_side: 'center' }),
    makeLine('line_3', [203, 660], [974.53125, 247.43935309973045], { route: 'smart', anchor_side: 'right', attach_side: 'center' }),
  ];
  return runDiscoveryLoop(router, lines);
}

const RESOLUTIONS = [16, 24, 32, 48, 60, 64];

test('line_3 crosses channel_1 with no notch or diagonal segment, at any swept grid_resolution', () => {
  for (const res of RESOLUTIONS) {
    const { results } = runScenario(res);
    const line3 = results.get('line_3');
    assert.equal(line3.meta.chainChannels?.[0]?.id, 'channel_1', `res=${res}: line_3 should still chain through channel_1`);
    const detour = findUnnecessaryDetour(line3.pts);
    assert.equal(detour, null, `res=${res}: line_3 notched at ${JSON.stringify(detour)}`);
    // Guards a second, distinct bug this same scenario surfaced: the
    // last-segment reshape's 'continuation' hint source fell through to a
    // generic branch with no orthogonality guard, which could overwrite an
    // interior leg's own true start point on a same-grid-cell-collapsed
    // leg (see RouterCore.js's "Check last segment" — the channel_axis
    // branch now also covers 'continuation'). Diagonal segments render
    // visibly (a straight diagonal line partway along the route), not just
    // as an internal pts artifact.
    const diag = findDiagonalSegment(line3.pts);
    assert.equal(diag, null, `res=${res}: line_3 has a diagonal segment at ${JSON.stringify(diag)}`);
  }
});

test('line_3\'s through-channel run sits on the channel\'s true authored center, not an unrelated averaged point', () => {
  for (const res of RESOLUTIONS) {
    const { results } = runScenario(res);
    const line3 = results.get('line_3');
    // The longest horizontal run is the through-channel leg (600+ units,
    // dwarfing the short entry/exit stubs) and should sit close to the
    // authored band's own midpoint — a grid-quantized search can land on
    // the nearest grid row rather than the exact float, so this allows up
    // to half a grid cell of slack. The router may start this run slightly
    // before the channel's own x1 (nothing obstructs an early cross-axis
    // correction) — that's fine, only the row (y) matters here.
    const best = longestHorizontalRun(line3.pts);
    assert.ok(best, `res=${res}: line_3 should have a horizontal run through channel_1`);
    assert.ok(
      Math.abs(best.y - TRUE_CROSS_CENTER) <= res / 2 + 1,
      `res=${res}: line_3's through-channel run sits at y=${best.y}, expected near ${TRUE_CROSS_CENTER}`
    );
  }
});

test('no line reverses, draws a diagonal segment, or crosses an obstacle once channel_1 is added, at any swept grid_resolution', () => {
  for (const res of RESOLUTIONS) {
    const { results } = runScenario(res);
    for (const [id, result] of results) {
      assert.equal(findIllegalReversal(result.pts), null, `res=${res}: ${id} reversed`);
      assert.equal(findDiagonalSegment(result.pts), null, `res=${res}: ${id} has a diagonal segment`);
      const pts = result.pts;
      for (let i = 1; i < pts.length; i++) {
        assert.ok(
          !segmentCrossesObstacle(pts[i - 1], pts[i], [
            { x1: 37, y1: 515, x2: 203, y2: 565 },
            { x1: 37, y1: 575, x2: 203, y2: 625 },
            { x1: 37, y1: 635, x2: 203, y2: 685 },
          ]),
          `res=${res}: ${id} segment ${JSON.stringify(pts[i - 1])}->${JSON.stringify(pts[i])} crosses an obstacle`
        );
      }
    }
  }
});
