/**
 * Reported live: expanding a `mode: 'prefer'` channel a bit further (still
 * chained into a second channel) produced a genuine DIAGONAL segment —
 * both x and y changing on the same segment, structurally impossible for
 * this Manhattan-only router.
 *
 * Root cause, confirmed via direct leg-level tracing: `_computeGrid`'s
 * post-search reshape has a documented "same-cell collapse" guard — when a
 * leg's own raw `req.a`/`req.b` round to the SAME grid cell (e.g. an
 * interior corridor hop shorter than one `grid_resolution`, here a 22-unit
 * vertical hop into a channel boundary at `grid_resolution: 60`), the A*
 * search trivially "arrives" on its very first pop, and reconstruction
 * produces a single degenerate point that then gets snapped back onto the
 * two REAL, distinct `req.a`/`req.b` coordinates (this exact snap-back is
 * itself the fix for an earlier, related bug — see the "Guard" comment in
 * `_computeGrid`).
 *
 * The reshape steps immediately after that snap-back — which decide
 * whether the resulting 2-point segment needs a corrective elbow inserted
 * — have TWO code paths: a hard-hint-aware one (`channel_axis`/
 * `continuation`) already fixed earlier this session to test the CURRENT,
 * post-snap segment directly, and a GENERIC one (used whenever neither end
 * carries a hard hint, i.e. `geometry`) that was never given the same
 * treatment — it still compared the segment against `origStart`/`origEnd`,
 * the grid's own PRE-snap reconstructed point. For a same-cell collapse,
 * that pre-snap point is just the single collapsed cell's own center —
 * unrelated to either real endpoint, not a genuine "does the grid's
 * natural shape already match" signal. Confirmed as a real bug: this stale
 * comparison could OVERWRITE an already-correct, already-snapped 2-point
 * orthogonal segment so both points matched — collapsing it into a single
 * repeated point, which rendered as a diagonal once concatenated with the
 * preceding splice (the stub, or another leg's own endpoint).
 *
 * Fixed by capturing `wasSameCellCollapse` once, right where the existing
 * "Guard" duplicates the collapsed point, and gating a narrow, separate
 * branch on it for BOTH the first- and last-segment generic reshape steps
 * — testing the CURRENT, already-snapped segment directly instead of the
 * stale pre-snap reference, exactly mirroring the already-fixed hard-hint
 * branches' own approach. The ORIGINAL (non-collapsed) generic-branch
 * logic is completely untouched: an earlier attempt that applied the same
 * "test current values" fix unconditionally (not gated on
 * `wasSameCellCollapse`) broke the NORMAL case instead — for a genuinely
 * non-collapsed leg, the "current" pre-adjustment `pts[lastIdx-1]` is the
 * grid's own UNSNAPPED rough corner, which essentially never exactly
 * matches the already-snapped `req.b` on either axis, so testing it
 * directly makes the "already orthogonal" check fail almost every time —
 * confirmed via the full regression suite (4 real failures across
 * unrelated scenarios) before landing the properly-scoped, collapse-gated
 * version instead.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { makeRouter, makeLine, runDiscoveryLoop, findDiagonalSegment, findIllegalReversal, findSelfCrossing } from './helpers/router-harness.js';

// The reported config verbatim: channel_north (prefer, vertical, bounds
// height 431.27 — its own y2 sits 22 units above line_3's approach row)
// chained into channel_1 (prefer, auto).
function runScenario() {
  const router = makeRouter({
    grid_resolution: 60,
    trunk_line_spacing: 8,
    turn_penalty: 2,
    channels: {
      channel_1: { bounds: [596.5, 600.91, 302.8, 72.48], mode: 'prefer', direction: 'auto', weight: 1, line_spacing: 8, discoverable: false },
      channel_north: { bounds: [482.22, 206.73, 79.76, 431.27], mode: 'prefer', direction: 'vertical', weight: 0.4, line_spacing: 16, discoverable: true }
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

test('no line ever renders a diagonal segment from a same-grid-cell-collapsed leg', () => {
  const { results } = runScenario();
  for (const [id, result] of results) {
    assert.equal(findDiagonalSegment(result.pts), null, `${id} has a diagonal segment: ${JSON.stringify(result.pts)}`);
    assert.equal(findIllegalReversal(result.pts), null, `${id} reversed: ${JSON.stringify(result.pts)}`);
    assert.equal(findSelfCrossing(result.pts), null, `${id} self-crosses: ${JSON.stringify(result.pts)}`);
  }
});

test('the exact same-cell-collapse leg in isolation stays a clean 2-point orthogonal segment', () => {
  const router = makeRouter({
    grid_resolution: 60, trunk_line_spacing: 8, turn_penalty: 2,
    channels: {
      channel_1: { bounds: [596.5, 600.91, 302.8, 72.48], mode: 'prefer', direction: 'auto', weight: 1, line_spacing: 8, discoverable: false },
      channel_north: { bounds: [482.22, 206.73, 79.76, 431.27], mode: 'prefer', direction: 'vertical', weight: 0.4, line_spacing: 16, discoverable: true }
    }
  }, {}, [0, 0, 990, 765]);
  const line = makeLine('line_3', [203, 660], [974.53125, 247.43935309973045], {
    route: 'smart', anchor_side: 'right', attach_side: 'center', route_channels: ['channel_north', 'channel_1']
  });
  const r = router.computePath(router.buildRouteRequest(line, line.a, line.b));
  assert.equal(findDiagonalSegment(r.pts), null, `has a diagonal segment: ${JSON.stringify(r.pts)}`);
});
