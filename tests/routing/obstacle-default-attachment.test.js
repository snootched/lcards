/**
 * An obstacle sits where it is drawn. A control with no `attachment` is drawn
 * centred on its position (MsdControlsRenderer defaults to 'center'), but the
 * router took it as the box's top-left corner, so it registered the obstacle half
 * a box down and right and lines cut through the real control (D1c, 2026-11-06).
 * A shape's position is always its top-left corner.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { makeRouter } from './helpers/router-harness.js';

test('a control obstacle with no attachment is centred on its position', () => {
  const router = makeRouter({}, {}, [0, 0, 600, 300]);
  router.setOverlays([{ id: 'box', _raw: { type: 'control', obstacle: true, position: [300, 150], size: [140, 70] } }]);
  assert.deepEqual(router._obstacles, [{ id: 'box', x1: 230, y1: 115, x2: 370, y2: 185 }]);
});

test('an explicit attachment still wins, and a shape obstacle is placed by its top-left corner', () => {
  const router = makeRouter({}, {}, [0, 0, 600, 300]);
  router.setOverlays([
    { id: 'tl', _raw: { type: 'control', obstacle: true, position: [100, 100], size: [40, 20], attachment: 'top-left' } },
    { id: 'zone', _raw: { type: 'shape', kind: 'rect', obstacle: true, position: [400, 50], size: [60, 30] } },
  ]);
  assert.deepEqual(router._obstacles, [
    { id: 'tl', x1: 100, y1: 100, x2: 140, y2: 120 },
    { id: 'zone', x1: 400, y1: 50, x2: 460, y2: 80 },
  ]);
});
