/**
 * route: angled - a straight stub out of anchor_side (and into attach_side
 * when set), then one straight run at any angle: the Picard leader line
 * that leaves a tag sideways and runs diagonally to its part.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { makeRouter, makeLine } from './helpers/router-harness.js';

const route = (router, line) => router.computePath(router.buildRouteRequest(line, line.a, line.b));

test('angled: a stub out of anchor_side, then one straight diagonal to the end', () => {
  const router = makeRouter();
  router.setOverlays([]);
  const line = makeLine('leader', [600, 100], [300, 400], { route: 'angled', anchor_side: 'left', stub_length: 40, corner_style: 'miter' });
  const result = route(router, line);
  assert.equal(result.meta.strategy, 'angled');
  assert.deepEqual(result.pts, [[600, 100], [560, 100], [300, 400]]);
  assert.equal(result.meta.bends, 1);
});

test('angled with attach_side: stubs at both ends, a straight run between them', () => {
  const router = makeRouter();
  router.setOverlays([]);
  const line = makeLine('leader2', [100, 100], [400, 400], {
    route: 'angled', anchor_side: 'right', attach_side: 'top', stub_length: 30, corner_style: 'miter',
  });
  const result = route(router, line);
  assert.deepEqual(result.pts, [[100, 100], [130, 100], [400, 370], [400, 400]]);
});

test('angled with no side is a straight line, like direct', () => {
  const router = makeRouter();
  router.setOverlays([]);
  const line = makeLine('plain', [100, 100], [400, 300], { route: 'angled', corner_style: 'miter' });
  assert.deepEqual(route(router, line).pts, [[100, 100], [400, 300]]);
});

test('angled ignores obstacles (no pathfinding), like direct', () => {
  const router = makeRouter();
  router.setOverlays([
    { id: 'block', _raw: { obstacle: true, position: [200, 150], size: [100, 100] } },
  ]);
  const line = makeLine('through', [500, 100], [100, 300], { route: 'angled', anchor_side: 'left', stub_length: 20, corner_style: 'miter' });
  assert.deepEqual(route(router, line).pts, [[500, 100], [480, 100], [100, 300]]);
});

test('angled rounds its bend when corner_style is round (the default)', () => {
  const router = makeRouter();
  router.setOverlays([]);
  const line = makeLine('rounded', [600, 100], [300, 400], { route: 'angled', anchor_side: 'left', stub_length: 60, corner_radius: 12 });
  const result = route(router, line);
  assert.match(result.d, /[AQC]/, `expected an arc or curve at the bend: ${result.d}`);
});

test('angled from a corner with route_hint: the stub runs along that edge (a bracket label\'s bar), then straight', () => {
  const router = makeRouter();
  router.setOverlays([]);
  const line = makeLine('bracket', [240, 100], [500, 300], { route: 'angled', anchor_side: 'top-right', route_hint: 'xy', stub_length: 40, corner_style: 'miter' });
  assert.deepEqual(route(router, line).pts, [[240, 100], [280, 100], [500, 300]]);
  const left = makeLine('bracket-left', [240, 100], [20, 300], { route: 'angled', anchor_side: 'top-left', route_hint: 'xy', stub_length: 40, corner_style: 'miter' });
  assert.deepEqual(route(router, left).pts, [[240, 100], [200, 100], [20, 300]]);
});

test('angled from a corner without a route_hint: no stub (a hint from the geometry does not count)', () => {
  const router = makeRouter();
  router.setOverlays([]);
  const line = makeLine('corner-no-hint', [240, 100], [500, 300], { route: 'angled', anchor_side: 'top-right', stub_length: 40, corner_style: 'miter' });
  assert.deepEqual(route(router, line).pts, [[240, 100], [500, 300]]);
});
