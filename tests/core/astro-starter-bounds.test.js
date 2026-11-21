/**
 * A scene with no camera view opens framing its bounds. The bounds used to be
 * taken before the first placement pass, with rings, paths and points left out,
 * so a part starter on its own card (the docs' starters page) opened on empty
 * space: an asteroid on a point away from the origin, a planet on its orbit,
 * the Star Trek minor powers at their real stars (backlog 2026-11-08).
 */
import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { installJsdom } from '../helpers/jsdom-env.js';

const env = installJsdom();
after(() => env.restore());
const { buildScene } = await import('../../src/core/astrometrics/scene-builder.js');
const { STARTERS, applyStarter } = await import('../../src/core/astrometrics/starters/index.js');

/** A build context without a theme or textures */
function ctx() {
  return { color: () => [1, 0.6, 0.4, 1], places: null, requestFrame: () => {}, loadTexture: () => null };
}

const parts = STARTERS.filter((s) => s.kind === 'part');

test('every part starter opens on what it holds: its visible points are inside the framed bounds', () => {
  assert.ok(parts.length >= 10);
  for (const s of parts) {
    const config = applyStarter({ type: 'custom:lcards-astrometrics-card', height: 400 }, s).config;
    assert.ok(config, `${s.id}: applies`);
    if (config.camera?.views) continue; // frames itself with its own view
    const w = buildScene(config, /** @type {any} */ (ctx()));
    const { center, radius } = w.bounds;
    const shown = w.pointDefs.filter((p) => p.label !== undefined || p.marker !== undefined);
    assert.ok(shown.length > 0, `${s.id}: has a visible point`);
    for (const p of shown) {
      const v = w.places.get(String(p.id));
      if (!v) continue;
      assert.ok(v.distanceTo(center) <= radius * 1.001 + 1e-6,
        `${s.id}: point ${p.id} is ${v.distanceTo(center).toFixed(1)} from the framed centre, outside the bounds radius ${radius.toFixed(1)}`);
    }
    w.dispose();
  }
});

test('an object standing on a point counts where it stands, not at the origin', () => {
  const w = buildScene({
    type: 'custom:lcards-astrometrics-card',
    points: [{ id: 'far', xyz: [500, 0, 0] }],
    objects: [{ type: 'sphere', id: 'ball', at: 'far', radius: 5 }],
  }, /** @type {any} */ (ctx()));
  assert.ok(Math.abs(w.bounds.center.x - 500) < 1, `centre ${w.bounds.center.x}`);
  assert.ok(w.bounds.radius < 20, `radius ${w.bounds.radius}`);
  w.dispose();
});
