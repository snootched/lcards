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
const { WarpStarfieldEffect, GridGLEffect } = await import('../../src/core/packs/backgrounds/webgl/ThreeSceneEffect.js');
const warpScene = await import('../../src/core/packs/backgrounds/webgl/scenes/warp-starfield.js');
const gridScene = await import('../../src/core/packs/backgrounds/webgl/scenes/grid.js');

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

test('no WebGL: grid in floor view draws the flat Canvas2D grid with the same config', () => {
  const { renderer } = load([{ preset: 'grid', config: { view: 'floor', color: '#00ff00', line_spacing: 33 } }]);
  assert.equal(renderer.effects[0].constructor.name, 'GridEffect');
  assert.equal(renderer.effects[0].lineSpacing, 33);
});

test('with WebGL: the scene effects are built (nothing loads until the first draw)', () => {
  _setWebGLAvailableForTests(true);
  const { renderer } = load([{ preset: 'warp-starfield', config: { seed: 1 } }, { preset: 'grid', config: { view: 'floor' } }]);
  assert.ok(renderer.effects[0] instanceof WarpStarfieldEffect);
  assert.ok(renderer.effects[1] instanceof GridGLEffect);
  assert.equal(renderer.effects[0]._loading, false);
  assert.equal(renderer.effects[0]._scene, null);
  assert.equal(typeof renderer.effects[0].host?.fail, 'function');
});

test('renderer: canvas draws the Canvas2D version even with WebGL; webgl and auto draw the scene', () => {
  _setWebGLAvailableForTests(true);
  const { renderer } = load([
    { preset: 'warp-starfield', renderer: 'canvas', config: { count: 77 } },
    { preset: 'grid', renderer: 'canvas' },
    { preset: 'warp-starfield', renderer: 'webgl' },
    { preset: 'grid', renderer: 'auto' }
  ]);
  assert.deepEqual(renderer.effects.map((e) => e.constructor.name),
    ['StarfieldEffect', 'GridEffect', 'WarpStarfieldEffect', 'GridGLEffect']);
  assert.equal(renderer.effects[0].count, 77);
});

test('renderer: webgl without WebGL still draws the Canvas2D version (never blank)', () => {
  _setWebGLAvailableForTests(false);
  const { renderer } = load([{ preset: 'warp-starfield', renderer: 'webgl' }]);
  assert.equal(renderer.effects[0].constructor.name, 'StarfieldEffect');
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
  const { bg } = load([{ preset: 'grid', config: { view: 'floor' } }]);
  for (const key of ['camera_tilt', 'camera_yaw', 'camera_distance', 'fov', 'scan_color', 'line_width', 'color']) {
    assert.ok(bg.handles[0].has(key), key);
  }
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

test('grid scene: flat view looks straight down at 1 px per unit; floor tilts the camera through the adapter', () => {
  _setWebGLAvailableForTests(true);
  const { renderer } = load([{ preset: 'grid', config: { line_spacing: 25, scroll_speed_x: 0, scroll_speed_y: 0 } }]);
  const effect = renderer.effects[0];
  const s = gridScene.createScene({ params: effect.params, colors: {} });
  s.resize(400, 200);
  s.seek(0, effect);
  // Flat: ground point (x, z) shows at pixel (x, z): project two of them
  const at = (x, z) => {
    const v = new (s.view.position.constructor)(x, 0, z).project(s.view);
    return [Math.round(((v.x + 1) / 2) * 400 * 100) / 100, Math.round(((1 - v.y) / 2) * 200 * 100) / 100];
  };
  assert.deepEqual(at(200, 100), [200, 100], 'screen centre');
  assert.deepEqual(at(10, 30), [10, 30], 'a corner region, 1 unit = 1 px');
  assert.equal(s.material.uniforms.uCell.value.x, 25);
  // Floor: tilted through the adapter (rotateX), yaw too
  effect.params.view = 'floor';
  effect.params.camera_yaw = 30;
  s.seek(0, effect);
  assert.equal(deg(s.view.rotation.x), -10);
  assert.equal(deg(s.view.rotation.y), 30);
  effect.params.camera_tilt = 45;
  s.seek(0, effect);
  assert.equal(deg(s.view.rotation.x), -45);
  s.dispose();
});

test('grid scene: scroll is reduced to one period of the pattern (float precision)', () => {
  _setWebGLAvailableForTests(true);
  const { renderer } = load([{ preset: 'grid', config: { line_spacing: 40, scroll_speed_x: 0, scroll_speed_y: 0 } }]);
  const effect = renderer.effects[0];
  const s = gridScene.createScene({ params: effect.params, colors: {} });
  s.resize(400, 200);
  effect.model.scrollX = 123456.5;
  s.seek(0, effect);
  const tile = effect.model._colWidth * effect.model._totalCols;
  const sx = s.material.uniforms.uScroll.value.x;
  assert.ok(sx >= 0 && sx < tile);
  assert.ok(Math.abs(((123456.5 - sx) / tile) - Math.round((123456.5 - sx) / tile)) < 1e-9, 'a whole number of tiles removed');
  s.dispose();
});

test('grid scan line: a pure function of the clock, off at 0, far to near', () => {
  assert.equal(gridScene.scanAt(1234, 0).strength, 0);
  const early = gridScene.scanAt(500, 7);
  const late = gridScene.scanAt(4500, 7);
  assert.ok(late.pos > early.pos);
  assert.equal(gridScene.scanAt(6500, 7).strength, 0, 'rest at the end of the period');
});

test('warp-starfield camera keys: a turned view moves where the stars stream from; fov keeps star sizes in px', () => {
  const params = { count: 20, seed: 2, camera_yaw: 0, camera_tilt: 0, fov: 70 };
  const s = warpScene.createScene({ params, colors: {} });
  const u = s.scene.children[0].material.uniforms;
  s.resize(400, 200);
  assert.ok(u.uDir.value.x === 0 && Math.abs(u.uDir.value.y) === 0, 'straight ahead');
  params.camera_yaw = 20;
  params.camera_tilt = 10;
  s.setParam('camera_yaw', 20);
  assert.ok(Math.abs(u.uDir.value.x - Math.tan((20 * Math.PI) / 180)) < 1e-9, 'yaw right: far stars sit left (x offset = tan(yaw) x depth, depth negative)');
  assert.ok(Math.abs(u.uDir.value.y + Math.tan((10 * Math.PI) / 180)) < 1e-9, 'tilt down: far stars sit higher');
  params.camera_yaw = 90;
  s.setParam('camera_yaw', 90);
  assert.ok(Math.abs(u.uDir.value.x - Math.tan((40 * Math.PI) / 180)) < 1e-9, 'clamped to 40 degrees: the star volume stays in view');
  const before = u.uScaleXY.value;
  params.fov = 100;
  s.setParam('fov', 100);
  assert.equal(s.camera.fov, 100);
  assert.ok(u.uScaleXY.value > before, 'wider view: more world units per px, so stars keep their px size');
  s.dispose();
});

test('warp-starfield: one time uniform, streak from speed', () => {
  const s = warpScene.createScene({ params: { count: 50, seed: 2, streak: 1 }, colors: {} });
  const material = s.scene.children[0].material;
  s.seek(1234, { speed: 1 });
  assert.equal(material.uniforms.uTime.value, 1234);
  const dot = material.uniforms.uStretch.value;
  s.seek(1300, { speed: 8 });
  assert.ok(material.uniforms.uStretch.value > dot * 10, 'streaks at warp');
  s.dispose();
});

test('warp-starfield camera_roll banks the camera round its line of sight (and is animatable)', () => {
  const params = { count: 20, seed: 1, camera_roll: 30 };
  const s = warpScene.createScene({ params, colors: {} });
  assert.ok(Math.abs(s.camera.rotation.z - Math.PI / 6) < 1e-9);
  params.camera_roll = -90;
  s.setParam('camera_roll', -90);
  assert.ok(Math.abs(s.camera.rotation.z + Math.PI / 2) < 1e-9);
  s.dispose();
});
