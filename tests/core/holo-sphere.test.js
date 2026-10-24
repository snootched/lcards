/**
 * holo-sphere (C3): the shared model (wireframe, placement, far-side dimming,
 * scan band), preset selection per tier, the rotation integrated so a
 * rotate_speed change never jumps, and the scene writing three.js objects
 * through the anime.js three adapter.
 */
import { test, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { installJsdom } from '../helpers/jsdom-env.js';

const env = installJsdom();
after(() => env.restore());
const { BackgroundAnimationRenderer } = await import('../../src/core/packs/backgrounds/BackgroundAnimationRenderer.js');
const { _setWebGLAvailableForTests } = await import('../../src/core/packs/backgrounds/webgl/webgl-support.js');
const { HoloSphereGLEffect } = await import('../../src/core/packs/backgrounds/webgl/ThreeSceneEffect.js');
const { HoloSphereEffect } = await import('../../src/core/packs/backgrounds/effects/HoloSphereEffect.js');
const model = await import('../../src/core/packs/backgrounds/effects/holo-sphere-model.js');
const sphereScene = await import('../../src/core/packs/backgrounds/webgl/scenes/holo-sphere.js');

beforeEach(() => _setWebGLAvailableForTests(null));
after(() => _setWebGLAvailableForTests(null));

function load(config) {
  const bg = new BackgroundAnimationRenderer(/** @type {any} */ ({ offsetWidth: 400, offsetHeight: 300 }), config);
  bg._resolveConfig(config);
  bg.canvas = /** @type {any} */ ({});
  const fake = /** @type {any} */ ({ effects: [], addEffect(e) { this.effects.push(e); }, requestFrame() {} });
  bg.renderer = fake;
  assert.equal(bg._loadEffects(), true);
  return { bg, renderer: fake };
}

test('the wireframe: segments on the unit sphere, rings plus meridians', () => {
  const seg = model.sphereSegments(3, 4);
  assert.equal(seg.length / 6, 3 * 64 + 4 * 32);
  for (let i = 0; i < seg.length; i += 3) {
    assert.ok(Math.abs(Math.hypot(seg[i], seg[i + 1], seg[i + 2]) - 1) < 1e-5);
  }
});

test('placement: positive tilt leans the north pole toward the viewer; rotation keeps latitude', () => {
  const t = (20 * Math.PI) / 180;
  const p = model.placePoint(0, 1, 0, 1, 0, Math.cos(t), Math.sin(t), { x: 0, y: 0, z: 0 });
  assert.ok(p.z > 0.3 && p.y < 1);
  const a = 1.1;
  const q = model.placePoint(0.6, 0.8, 0, Math.cos(a), Math.sin(a), 1, 0, { x: 0, y: 0, z: 0 });
  assert.ok(Math.abs(q.y - 0.8) < 1e-9, 'spinning never changes latitude');
});

test('far side dims to back_opacity; the band glows at its latitude only', () => {
  assert.equal(model.depthAlpha(1, 0.2), 1);
  assert.equal(model.depthAlpha(-1, 0.2), 0.2);
  assert.equal(model.bandGlow(0.3, { y: 0.3, strength: 1 }), 1);
  assert.ok(model.bandGlow(0.6, { y: 0.3, strength: 1 }) < 0.001);
  const off = model.createScanBand(0);
  off.seek(1234);
  assert.equal(off.band.strength, 0, 'scan_period 0: no band');
});

test('both tiers: WebGL builds the scene effect, canvas / no WebGL the Canvas2D sphere', () => {
  _setWebGLAvailableForTests(true);
  assert.ok(load([{ preset: 'holo-sphere' }]).renderer.effects[0] instanceof HoloSphereGLEffect);
  assert.ok(load([{ preset: 'holo-sphere', renderer: 'canvas' }]).renderer.effects[0] instanceof HoloSphereEffect);
  _setWebGLAvailableForTests(false);
  assert.ok(load([{ preset: 'holo-sphere', config: { tilt: 33 } }]).renderer.effects[0] instanceof HoloSphereEffect);
});

test('rotation is integrated: a rotate_speed change never jumps the angle (both tiers)', () => {
  for (const effect of [new HoloSphereEffect({ rotate_speed: 1 }), new HoloSphereGLEffect({ params: { rotate_speed: 1 } })]) {
    effect.update(10000, 100, 100);
    assert.ok(Math.abs(effect._angle - 60) < 1e-9, '1 rpm for 10 s = 60 degrees');
    const before = effect._angle;
    /** @type {any} */ (effect.constructor).animatableProps.rotate_speed.set(effect, 10);
    assert.equal(effect._angle, before, 'no jump on the change');
    effect.update(1000, 100, 100);
    assert.ok(Math.abs(effect._angle - (before + 60)) < 1e-9, 'then 10 rpm');
  }
});

test('the scene: frame from size and position; the inverse rotation takes view points back to the sphere', () => {
  const params = { tilt: 30, size: 0.5, position_x: 0.25, position_y: 0.5, scan_period: 4, line_width: 3 };
  const s = sphereScene.createScene({ params, colors: {} });
  s.resize(400, 200);
  s.seek(1500, { _angle: 45 });
  const u = s.material.uniforms;
  assert.equal(u.uRadius.value, 50, 'radius = size x shorter side / 2');
  assert.deepEqual([u.uCentre.value.x, u.uCentre.value.y], [100, 100]);
  assert.equal(u.uWidth.value, 3);
  // Place an object point the Canvas2D way, then undo it with the uniform
  const a = (45 * Math.PI) / 180, t = (30 * Math.PI) / 180;
  const v = model.placePoint(0.6, 0.48, 0.64, Math.cos(a), Math.sin(a), Math.cos(t), Math.sin(t), { x: 0, y: 0, z: 0 });
  const e = u.uToObject.value.elements; // column-major
  const o = [0, 1, 2].map((r) => e[r] * v.x + e[3 + r] * v.y + e[6 + r] * v.z);
  [0.6, 0.48, 0.64].forEach((c, i) => assert.ok(Math.abs(o[i] - c) < 1e-9));
  assert.ok(u.uBandStrength.value > 0.5, 'mid sweep');
  s.dispose();
});
