// The Solar system starter's orbits lie in the planets' real orbital planes, and each planet
// stays on its tilted ring as the ring spins (the tilt is on the ring's outer group, the spin on the ring).
import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { installJsdom } from '../helpers/jsdom-env.js';

const env = installJsdom();
after(() => env.restore());
const { buildScene } = await import('../../src/core/astrometrics/scene-builder.js');
const { stepObjects } = await import('../../src/core/astrometrics/objects/common.js');
const { STARTERS, applyStarter } = await import('../../src/core/astrometrics/starters/index.js');
const { Vector3 } = await import('three');

/** [id, orbit radius, inclination] */
const ORBITS = [['mercury', 20, 7.0], ['earth', 42, 0], ['neptune', 160, 1.77], ['pluto', 184, 17.16]];

test('solar system starter: Pluto, and every planet on its real tilted orbit as it goes round', () => {
  const cfg = /** @type {any} */ (applyStarter({ type: 'custom:lcards-astrometrics-card' }, STARTERS.find((s) => s.id === 'solar_system'))).config;
  assert.ok(cfg.points.some((/** @type {any} */ p) => p.id === 'pluto'), 'Pluto is there');
  const ctx = { color: () => [1, 1, 1, 1], places: null, sky: () => null, requestFrame: () => {}, loadTexture: () => null };
  const w = buildScene(cfg, /** @type {any} */ (ctx));
  const seen = new Map();
  for (const ms of [0, 7000]) {
    if (ms) stepObjects(w.list, ms, ms);
    w.scene.updateMatrixWorld(true);
    // moving points are worked out again each frame, as the runtime does
    w.places.invalidate();
    for (const [id, radius, inclination] of ORBITS) {
      const ring = /** @type {any} */ (w.objects.get(`${id}_orbit`));
      const at = /** @type {any} */ (w.places.get(String(id))).clone();
      const local = ring.node.worldToLocal(at.clone());
      assert.ok(Math.abs(local.y) < 1e-6, `${id} on its ring's plane (${local.y})`);
      assert.ok(Math.abs(Math.hypot(local.x, local.z) - Number(radius)) < 1e-6, `${id} on its ring`);
      const normal = new Vector3(0, 1, 0).transformDirection(ring.node.matrixWorld);
      assert.ok(Math.abs((Math.acos(normal.y) * 180) / Math.PI - Number(inclination)) < 1e-6, `${id} orbit tilted ${inclination} degrees`);
      if (ms) assert.ok(at.distanceTo(seen.get(id)) > 0.5, `${id} moved round`);
      seen.set(id, at);
    }
  }
});
