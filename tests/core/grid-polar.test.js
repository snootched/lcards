/**
 * Grid `pattern: polar` (C5): rings round a centre and spokes. The scroll
 * periods keep majors on majors, the geometry (Canvas2D drawer; the WebGL
 * shader follows the same rules per pixel) puts rings and spokes where the
 * keys say, and the preset holds polar still by default.
 */
import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { installJsdom } from '../helpers/jsdom-env.js';

const env = installJsdom();
after(() => env.restore());
const { GridEffect, polarPeriods, polarGeometry } = await import('../../src/core/packs/backgrounds/effects/GridEffect.js');
const { BACKGROUND_PRESETS } = await import('../../src/core/packs/backgrounds/presets/index.js');

const base = { w: 400, h: 200, cell: 40, lineSpacing: 40, spokes: 12, majorRing: 0, majorSpoke: 0, polarX: 0.5, polarY: 0.5, scrollX: 0, scrollY: 0 };

test('rings every cell px from the centre out past the farthest corner, none at the centre', () => {
  const g = polarGeometry(base);
  assert.equal(g.cx, 200);
  assert.equal(g.cy, 100);
  assert.equal(g.rings[0].r, 40);
  assert.deepEqual(g.rings.slice(0, 3).map((r) => r.r), [40, 80, 120]);
  assert.ok(g.rings.at(-1).r >= Math.hypot(200, 100), 'reaches the corners');
});

test('spoke_count spokes evenly round; 0 = rings only', () => {
  const g = polarGeometry(base);
  assert.equal(g.spokes.length, 12);
  assert.ok(Math.abs(g.spokes[1].angle - Math.PI / 6) < 1e-9);
  assert.equal(polarGeometry({ ...base, spokes: 0 }).spokes.length, 0);
});

test('majors: every Nth ring and every Mth spoke', () => {
  const g = polarGeometry({ ...base, majorRing: 3, majorSpoke: 4 });
  // Ring 0 (radius 0) is skipped, so ring index 3 (radius 120) is the first major
  assert.deepEqual(g.rings.slice(0, 4).map((r) => r.major), [false, false, true, false]);
  assert.deepEqual(g.spokes.filter((s) => s.major).length, 3);
});

test('vertical scroll moves the rings outward; horizontal scroll turns the spokes one pitch per line_spacing px', () => {
  const g = polarGeometry({ ...base, scrollY: 10, scrollX: 20 });
  assert.equal(g.rings[0].r, 10);
  assert.ok(Math.abs(g.spokes[0].angle - (0.5 * Math.PI) / 6) < 1e-9);
});

test('scrolling by a period changes nothing, majors included', () => {
  const opts = { ...base, majorRing: 3, majorSpoke: 4, scrollX: 7, scrollY: 13 };
  const per = polarPeriods(opts.cell, opts.lineSpacing, opts.spokes, opts.majorRing, opts.majorSpoke);
  assert.deepEqual(per, { ring: 120, spoke: 160 });
  assert.deepEqual(polarGeometry({ ...opts, scrollX: 7 + per.spoke, scrollY: 13 + per.ring }), polarGeometry(opts));
  // An interval that does not divide the spoke count: only a whole turn repeats
  assert.equal(polarPeriods(40, 40, 10, 0, 4).spoke, 400);
});

test('the grid preset holds polar still unless a scroll speed is set', () => {
  const preset = /** @type {any} */ (BACKGROUND_PRESETS.grid);
  const still = preset.options({ pattern: 'polar' });
  assert.equal(still.scrollSpeedX, 0);
  assert.equal(still.scrollSpeedY, 0);
  assert.equal(preset.options({ pattern: 'polar', scroll_speed_y: 15 }).scrollSpeedY, 15);
  assert.equal(preset.options({}).scrollSpeedX, 20, 'other patterns keep their default');
  const e = new GridEffect(preset.options({ pattern: 'polar', spoke_count: 8, polar_x: 0.25 }));
  assert.equal(e.spokeCount, 8);
  assert.equal(e.polarX, 0.25);
  assert.equal(e.polarY, 0.5);
});
