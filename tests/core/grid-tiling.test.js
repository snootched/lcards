/**
 * Grid tiling (C3): the Canvas2D grid repeats a tile of T = ceil(h / spacing) + 1
 * lines. Majors used to restart per tile, so when T was not a multiple of the
 * interval two major lines met side by side at every seam, and the seam line
 * was drawn twice. Majors now count lines across tiles and each line is drawn
 * once; the WebGL grid's scroll period keeps the same count.
 */
import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { installJsdom } from '../helpers/jsdom-env.js';

const env = installJsdom();
after(() => env.restore());
const { GridEffect, isMajorLine, linePeriod } = await import('../../src/core/packs/backgrounds/effects/GridEffect.js');

/** Draw a frame and return the horizontal segments as [y, lineWidth, x] (one per tile across) */
function horizontalLines(effect, w, h) {
  const lines = [];
  let path = [];
  const ctx = /** @type {any} */ ({
    save() {}, restore() {}, translate(x, y) { this.tx = x; this.ty = y; }, rotate() {}, scale() {},
    fillRect() {}, beginPath() { path = []; },
    moveTo(x, y) { path.push({ x, y, move: true }); }, lineTo(x, y) { path.push({ x, y }); },
    stroke() {
      for (let i = 0; i < path.length; i += 2) {
        const a = path[i], b = path[i + 1];
        if (a && b && a.y === b.y) lines.push([a.y + this.ty, this.lineWidth, a.x]);
      }
    },
    set globalAlpha(v) {}
  });
  effect.draw(ctx, w, h);
  return lines;
}

test('majors stay evenly spaced across tile seams, and no line is drawn twice', () => {
  // h 200, spacing 40: T = ceil(200 / 40) + 1 = 6 rows per tile; interval 4 does not divide 6
  const effect = new GridEffect({ lineSpacing: 40, majorRowInterval: 4, majorColInterval: 0, lineWidthMinor: 1, lineWidthMajor: 3, pattern: 'horizontal', scrollSpeedX: 0, scrollSpeedY: 0 });
  const lines = horizontalLines(effect, 300, 200);
  const segments = lines.map(([y, , x]) => `${x},${y}`);
  assert.equal(new Set(segments).size, segments.length, 'each segment once (seams were drawn twice)');
  const majors = [...new Set(lines.filter(([, w]) => w === 3).map(([y]) => y))].sort((a, b) => a - b);
  assert.ok(majors.length >= 3);
  const gaps = majors.slice(1).map((y, i) => y - majors[i]);
  assert.ok(gaps.every((g) => g === 160), `majors every 4 lines (160 px), got gaps ${gaps}`);
});

test('show_border_lines: false still hides the tile seam lines, once each', () => {
  const effect = new GridEffect({ lineSpacing: 40, majorRowInterval: 0, pattern: 'horizontal', showBorderLines: false, scrollSpeedX: 0, scrollSpeedY: 0 });
  const ys = horizontalLines(effect, 300, 200).map(([y]) => y);
  // Tiles are 6 rows (240 px): lines at multiples of 240 are the seams
  assert.ok(ys.every((y) => ((y % 240) + 240) % 240 !== 0));
  assert.ok(ys.length > 0);
});

test('isMajorLine counts across tiles, negative indices included; the scroll period keeps the count', () => {
  assert.deepEqual([-8, -4, -3, 0, 4, 5].map((i) => isMajorLine(i, 4)), [true, true, false, true, true, false]);
  assert.equal(isMajorLine(0, 0), false, 'interval 0: no majors');
  // T = 6 lines of 40 px, interval 4: lcm(6, 4) = 12 lines
  assert.equal(linePeriod(40, 6, 4), 480);
  assert.equal(linePeriod(40, 6, 0), 240, 'no majors: one tile');
});
