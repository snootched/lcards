/**
 * "Grace zone" fix: a corridor-approach leg whose stub already lands at
 * the trunk's own flow-axis position (entryAlreadyInside) used to leave
 * the cross-axis lane correction a literal zero-flow-distance kink — no
 * adjacent segment length for corner-rounding to work with on either
 * side, regardless of how much room was actually available nearby.
 * Reported live in HA: "why would we allow line_3 to kink just as it
 * enters the trunk? it makes more sense to penalize that kink and keep it
 * straight... are we not allowing a grace zone for lines to converge on
 * enter and diverge on exit?"
 *
 * Two changes, together:
 * 1. `_channelCrossingPoints` (ENTRY side only — see its own comment for
 *    why the exit side was tried and reverted, a chain-boundary conflict
 *    with `_corridorRefPoint`'s own look-ahead) reserves
 *    stubLengthFor(stubReq)-worth of flow-axis room, capped at half the
 *    total room available, instead of snapping the boundary to exactly
 *    the approach point's own coordinate.
 * 2. `_applyCornerRounding`'s adjacent-corner-conflict logic used to
 *    always reserve a 35% gap between two corners sharing a short
 *    segment — reasonable for two genuinely separate corners, but for a
 *    corridor nudge's own tiny correction leg (two ends of ONE
 *    transition, not competing corners) it forced both radii below
 *    arcMin whenever the segment was only a few px, rendering sharp
 *    regardless of (1). Segments at or below 4*arcMin now target 95%
 *    instead of 65%, letting a small but genuinely rounded curve render.
 *
 * A prerequisite fix landed first (see trunk-match-longest-run.test.js):
 * an EARLIER version of (1) alone was shipped, then reverted, after it
 * exposed a pre-existing bug where a lengthened lead-in nudge leg could
 * steal an existing trunk's match from the real trunk-riding run behind
 * it. That bug is fixed independently now, which is what makes (1) safe.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { makeRouter, makeLine, runDiscoveryLoop, findIllegalReversal } from './helpers/router-harness.js';

function runScenario() {
  const router = makeRouter({ grid_resolution: undefined, trunk_line_spacing: 8 }, {}, [0, 0, 990, 765]);
  router.config.grid_resolution = undefined;
  router.setOverlays([
    { id: 'control_1', _raw: { obstacle: true, position: [767.94, 588.91], size: [112, 73], attachment: 'left' } },
    { id: 'control_2', _raw: { obstacle: true, position: [100, 600], size: [166, 50], attachment: 'center' } },
    { id: 'control_3', _raw: { obstacle: true, position: [100, 650], size: [166, 50], attachment: 'center' } },
    { id: 'control_4', _raw: { obstacle: true, position: [100, 700], size: [166, 50], attachment: 'center' } },
  ]);
  const cornerCfg = { corner_radius: 34, corner_style: 'round' };
  const lines = [
    makeLine('line_1', [823.94, 625.41], [183, 600], { route: 'smart', anchor_side: 'bottom', attach_side: 'right', ...cornerCfg }),
    makeLine('line_2', [183, 650], [546.5625, 204.13746630727763], { route: 'smart', anchor_side: 'right', attach_side: 'center', ...cornerCfg }),
    makeLine('line_3', [183, 700], [974.53125, 247.43935309973045], { route: 'smart', anchor_side: 'right', attach_side: 'center', ...cornerCfg }),
  ];
  return runDiscoveryLoop(router, lines);
}

test('the entry taper gives the trunk-join correction real flow-axis room instead of a zero-length kink', () => {
  const { results } = runScenario();
  const line3 = results.get('line_3').pts;
  // Old (pre-fix) shape: [183,700],[246.75,700],[246.75,697.16],... — the
  // cross-axis correction happens at the SAME x as the stub's own landing
  // point (zero flow-axis room). The taper inserts a genuine intermediate
  // point further along the flow axis before the correction happens.
  assert.ok(line3.length >= 5, `expected an extra tapered point, got: ${JSON.stringify(line3)}`);
  const correctionX = line3[2][0];
  assert.notEqual(correctionX, 246.75, 'the correction should no longer happen at the stub\'s own exact landing x');
  assert.ok(correctionX > 246.75, `the taper should extend further into the corridor, got x=${correctionX}`);
});

test('the corner-rounding relaxation renders the tapered correction as a real (if small) curve, not a sharp double-kink', () => {
  const { results } = runScenario();
  const line3 = results.get('line_3');
  // Two short arcs (radius > 1, i.e. above the old effective floor once
  // the 65% reservation would have crushed them) around the correction.
  const arcs = [...line3.d.matchAll(/A([\d.]+),\1/g)].map(m => Number(m[1]));
  const smallArcs = arcs.filter(r => r > 1 && r < 5);
  assert.ok(smallArcs.length >= 2, `expected at least 2 small-but-real arcs from the tapered correction, got radii: ${arcs.join(', ')} in ${line3.d}`);
});

test('no reversal and no crossings are introduced by either change', () => {
  const { results } = runScenario();
  const line1 = results.get('line_1').pts;
  const line2 = results.get('line_2').pts;
  const line3 = results.get('line_3');
  assert.equal(findIllegalReversal(line3.pts), null);
  // Perpendicular-only crossing counter, mirrors the other test files' own.
  const crosses = (a1, a2, b1, b2) => {
    const aVert = a1[0] === a2[0], bVert = b1[0] === b2[0];
    if (aVert === bVert) return false;
    const vert = aVert ? { p1: a1, p2: a2 } : { p1: b1, p2: b2 };
    const horiz = aVert ? { p1: b1, p2: b2 } : { p1: a1, p2: a2 };
    const x = vert.p1[0], y = horiz.p1[1];
    const vy1 = Math.min(vert.p1[1], vert.p2[1]), vy2 = Math.max(vert.p1[1], vert.p2[1]);
    const hx1 = Math.min(horiz.p1[0], horiz.p2[0]), hx2 = Math.max(horiz.p1[0], horiz.p2[0]);
    return x > hx1 && x < hx2 && y > vy1 && y < vy2;
  };
  const countCrossings = (pts, otherPts) => {
    let count = 0;
    for (let i = 1; i < pts.length; i++) for (let j = 1; j < otherPts.length; j++) {
      if (crosses(pts[i - 1], pts[i], otherPts[j - 1], otherPts[j])) count++;
    }
    return count;
  };
  assert.equal(countCrossings(line3.pts, line1), 0);
  assert.equal(countCrossings(line3.pts, line2), 0);
});
