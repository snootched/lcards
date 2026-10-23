/**
 * three.js background tier (C2), headless: preset selection with and without
 * WebGL, EffectHandle keys reaching the scene, the anime.js three adapter
 * writing three.js objects from a seek, and the F1 recolour hook. The scene
 * modules build without a renderer, so no WebGL is needed here.
 */
import { test, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { installJsdom } from '../helpers/jsdom-env.js';

const env = installJsdom();
after(() => env.restore());
const { BackgroundAnimationRenderer } = await import('../../src/core/packs/backgrounds/BackgroundAnimationRenderer.js');
const { _setWebGLAvailableForTests } = await import('../../src/core/packs/backgrounds/webgl/webgl-support.js');
const { WarpStarfieldEffect, GridFloorEffect } = await import('../../src/core/packs/backgrounds/webgl/ThreeSceneEffect.js');
const warpScene = await import('../../src/core/packs/backgrounds/webgl/scenes/warp-starfield.js');
const floorScene = await import('../../src/core/packs/backgrounds/webgl/scenes/grid-floor.js');

beforeEach(() => _setWebGLAvailableForTests(null));
after(() => _setWebGLAvailableForTests(null));

/** Build a renderer for `config` with a fake Canvas2DRenderer. */
function load(config) {
  const bg = new BackgroundAnimationRenderer(/** @type {any} */ ({ offsetWidth: 400, offsetHeight: 300 }), config);
  bg._resolveConfig(config);
  bg.canvas = /** @type {any} */ ({});
  const fake = /** @type {any} */ ({ effects: [], addEffect(e) { this.effects.push(e); }, requestFrame() { fake.frames = (fake.frames ?? 0) + 1; } });
  bg.renderer = fake;
  assert.equal(bg._loadEffects(), true);
  return { bg, renderer: fake };
}

const deg = (rad) => Math.round((rad * 180) / Math.PI * 1000) / 1000;

test('no WebGL (jsdom): warp-starfield draws the starfield preset with the same config', () => {
  const { renderer, bg } = load([{ preset: 'warp-starfield', config: { count: 321, seed: 4 } }]);
  assert.equal(renderer.effects[0].constructor.name, 'StarfieldEffect');
  assert.equal(renderer.effects[0].count, 321);
  assert.equal(bg.handles[0].presetId, 'warp-starfield', 'the handle keeps the preset name');
});

test('no WebGL: grid-floor draws the grid preset', () => {
  const { renderer } = load([{ preset: 'grid-floor', config: { color: '#00ff00' } }]);
  assert.equal(renderer.effects[0].constructor.name, 'GridEffect');
});

test('with WebGL: the scene effects are built (nothing loads until the first draw)', () => {
  _setWebGLAvailableForTests(true);
  const { renderer } = load([{ preset: 'warp-starfield', config: { seed: 1 } }, { preset: 'grid-floor' }]);
  assert.ok(renderer.effects[0] instanceof WarpStarfieldEffect);
  assert.ok(renderer.effects[1] instanceof GridFloorEffect);
  assert.equal(renderer.effects[0]._loading, false);
  assert.equal(renderer.effects[0]._scene, null);
  assert.equal(typeof renderer.effects[0].host?.fail, 'function');
});

test('warp-starfield default colour is moonlight, so it follows the alert palette', () => {
  _setWebGLAvailableForTests(true);
  document.documentElement.style.setProperty('--lcards-moonlight', '#dfe1e8');
  const { bg, renderer } = load([{ preset: 'warp-starfield', config: {} }]);
  assert.equal(renderer.effects[0].colors.stars[0], '#dfe1e8');
  document.documentElement.style.setProperty('--lcards-moonlight', '#c0a0a8');
  bg.refreshColors();
  assert.equal(renderer.effects[0].colors.stars[0], '#c0a0a8');
  document.documentElement.style.removeProperty('--lcards-moonlight');
});

test('handle keys reach the effect and its scene (speed, streak, colour)', () => {
  _setWebGLAvailableForTests(true);
  const { bg, renderer } = load([{ preset: 'warp-starfield', config: { seed: 1 } }]);
  const effect = renderer.effects[0];
  /** @type {any[]} */
  const calls = [];
  effect._scene = { setParam: (k, v) => calls.push(['param', k, v]), setColors: (c) => calls.push(['colors', c]), dispose() {} };
  const handle = bg.handles[0];
  handle.setProp('speed', 6);
  handle.setProp('streak', 2);
  handle.setProp('color', 'rgba(255, 0, 0, 1)');
  assert.equal(effect.speed, 6);
  assert.equal(effect.params.streak, 2);
  assert.deepEqual(calls[0], ['param', 'streak', 2]);
  assert.equal(calls[1][0], 'colors');
  assert.deepEqual(calls[1][1].stars[0], { r: 255, g: 0, b: 0, a: 1 });
  assert.ok(renderer.frames > 0, 'each set asks for a frame (held reduced-motion frame)');
  effect._scene = null;
});

test('an entity-bound camera_tilt is a declared key (it glides, not snaps via updateConfig)', () => {
  _setWebGLAvailableForTests(true);
  const { bg } = load([{ preset: 'grid-floor' }]);
  assert.ok(bg.handles[0].has('camera_tilt'));
  assert.ok(bg.handles[0].has('camera_height'));
  assert.ok(bg.handles[0].has('scan_color'));
});

test('F1: an alert change recolours a scene effect in place, without loading the fresh copy', () => {
  _setWebGLAvailableForTests(true);
  document.documentElement.style.setProperty('--test-warp', '#ff0000');
  const { bg, renderer } = load([{ preset: 'warp-starfield', config: { color: 'var(--test-warp)' } }]);
  const effect = renderer.effects[0];
  assert.equal(effect.colors.stars[0], '#ff0000');
  document.documentElement.style.setProperty('--test-warp', '#0000ff');
  bg.refreshColors();
  assert.equal(renderer.effects[0], effect);
  assert.equal(effect.colors.stars[0], '#0000ff');
});

test('the adapter writes three.js objects from a seek: grid-floor camera keys and floor scroll', () => {
  const s = floorScene.createScene({ params: { line_spacing: 2, camera_height: 1.6, camera_tilt: 8 }, colors: {} });
  assert.equal(s.camera.position.y, 1.6);
  assert.equal(deg(s.camera.rotation.x), -8);
  s.setParam('camera_tilt', 20);
  s.setParam('camera_height', 3);
  assert.equal(deg(s.camera.rotation.x), -20);
  assert.equal(s.camera.position.y, 3);
  const floor = s.scene.children.find((c) => c.isLineSegments);
  s.seek(800);
  assert.ok(Math.abs(floor.position.z - 1) < 1e-6, 'half of the 1600 ms cell loop = half a cell');
  // The lines toward the horizon end in front of the camera, whatever the scroll
  const pos = floor.geometry.attributes.position;
  assert.ok(Math.abs(pos.getZ(1) + floor.position.z + 0.3) < 1e-6);
  s.dispose();
});

test('warp-starfield, instances variant: each star is an anime.js loop on its instance', () => {
  const s = warpScene.createScene({ params: { count: 50, seed: 2 }, colors: { stars: [{ r: 255, g: 255, b: 255 }] } });
  const mesh = s.scene.children[0];
  const zAt = (t) => {
    s.seek(t, { speed: 1 });
    mesh.onBeforeRender?.();
    return Array.from({ length: 50 }, (_, i) => mesh.instanceMatrix.array[i * 16 + 14]);
  };
  const a = zAt(1000);
  const b = zAt(1500);
  assert.notDeepEqual(a, b, 'stars moved');
  assert.ok(a.every((z) => z <= -0.5 && z >= -60), 'inside the star volume');
  assert.deepEqual(zAt(1000), a, 'seek is deterministic: same time, same layout');
  s.dispose();
});

test('warp-starfield, shader variant: one time uniform, streak from speed', () => {
  const s = warpScene.createScene({ params: { count: 50, seed: 2, variant: 'shader', streak: 1 }, colors: {} });
  const material = s.scene.children[0].material;
  s.seek(1234, { speed: 1 });
  assert.equal(material.uniforms.uTime.value, 1234);
  const dot = material.uniforms.uStretch.value;
  s.seek(1300, { speed: 8 });
  assert.ok(material.uniforms.uStretch.value > dot * 10, 'streaks at warp');
  s.dispose();
});
