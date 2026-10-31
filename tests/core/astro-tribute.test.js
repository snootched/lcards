/**
 * The tribute's portrait (tribute.js, tribute-portrait.js): a few thousand
 * stars of four kinds, inside the frame, the four pips among them, the
 * fingertip on the hand; the portrait fits any card; the sequence in order.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { installJsdom } from '../helpers/jsdom-env.js';

installJsdom();
const { FINGERTIP, TIMELINE, DEDICATION, FONT, portraitStars, portraitFit } = await import('../../src/core/astrometrics/tribute.js');

test('the portrait: thousands of stars of four kinds in the frame, the four gold pips, stars at the raised fingertip', () => {
  const stars = portraitStars();
  assert.ok(stars.length > 3000 && stars.length < 6000, `${stars.length} stars`);
  assert.deepEqual([...new Set(stars.map((s) => s.kind))].sort(), [0, 1, 2, 3]);
  assert.ok(stars.every((s) => s.x >= 0 && s.x < 600 && s.y >= 0 && s.y < 480 && s.size >= 1 && s.size <= 3));
  for (const [x, y] of [[270, 267], [277, 273], [284, 279], [290, 284]]) {
    assert.ok(stars.some((s) => s.kind === 3 && s.x === x && s.y === y), `pip ${x},${y}`);
  }
  assert.ok(stars.some((s) => s.kind === 0 && Math.hypot(s.x - FINGERTIP[0], s.y - FINGERTIP[1]) < 6), 'the fingertip');
  // the face, the uniform's red and its black all have a share
  for (const kind of [0, 1, 2]) assert.ok(stars.filter((s) => s.kind === kind).length > 100, `kind ${kind}`);
});

test('the portrait fits inside the card, wide or tall', () => {
  const stars = portraitStars();
  for (const [w, h] of [[1100, 600], [400, 700], [300, 200]]) {
    const { scale, ox, oy } = portraitFit(w, h);
    for (const s of stars) {
      if (s.y < 40) continue;
      const px = ox + s.x * scale;
      const py = oy + s.y * scale;
      assert.ok(px >= 0 && px <= w && py >= 0 && py <= h, `${w}x${h}: ${s.x},${s.y}`);
    }
  }
});

test('the sequence runs in order; the dedication as written, in the TNG lettering', () => {
  const t = TIMELINE;
  assert.ok(t.warpIn < t.dropOut && t.dropOut < t.settled && t.settled < t.engage && t.dedication < t.engage && t.engage < t.warpOut && t.warpOut < t.gone && t.gone < t.end);
  assert.equal(DEDICATION, 'TO BOLDLY GO · SIR PATRICK STEWART · 1940–2026');
  assert.equal(FONT, 'lcards_crillee');
});
