/**
 * WebGL noise fields (C3): contour-field, plasma and fluid pick their WebGL
 * version when it is available (same preset, same keys) and their Canvas2D
 * effect otherwise or with `renderer: canvas`; the scenes build headless and
 * place the field where the Canvas2D effects do; noise keys are animatable;
 * an alert recolour is a uniform write.
 */
import { test, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { installJsdom } from '../helpers/jsdom-env.js';

const env = installJsdom();
after(() => env.restore());
const { BackgroundAnimationRenderer } = await import('../../src/core/packs/backgrounds/BackgroundAnimationRenderer.js');
const { _setWebGLAvailableForTests } = await import('../../src/core/packs/backgrounds/webgl/webgl-support.js');
const { ContourFieldGLEffect, PlasmaGLEffect, FluidGLEffect } = await import('../../src/core/packs/backgrounds/webgl/ThreeSceneEffect.js');
const { contourSeedOffset } = await import('../../src/core/packs/backgrounds/effects/ContourFieldEffect.js');
const { fieldAxis } = await import('../../src/core/packs/backgrounds/webgl/scenes/field-scene.js');
const contourScene = await import('../../src/core/packs/backgrounds/webgl/scenes/contour-field.js');
const plasmaScene = await import('../../src/core/packs/backgrounds/webgl/scenes/plasma.js');
const fluidScene = await import('../../src/core/packs/backgrounds/webgl/scenes/fluid.js');

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

const names = (r) => r.effects.map((e) => e.constructor.name);
const ENTRIES = [{ preset: 'contour-field', config: { seed: 7 } }, { preset: 'plasma' }, { preset: 'fluid' }];

test('with WebGL: the same presets build their WebGL effects', () => {
  _setWebGLAvailableForTests(true);
  assert.deepEqual(names(load(ENTRIES).renderer), ['ContourFieldGLEffect', 'PlasmaGLEffect', 'FluidGLEffect']);
});

test('without WebGL, or with renderer: canvas, the Canvas2D effects (same config)', () => {
  _setWebGLAvailableForTests(false);
  const expected = ['ContourFieldEffect', 'PlasmaTextureEffect', 'FluidTextureEffect'];
  assert.deepEqual(names(load(ENTRIES).renderer), expected);
  _setWebGLAvailableForTests(true);
  assert.deepEqual(names(load(ENTRIES.map((e) => ({ ...e, renderer: 'canvas' }))).renderer), expected);
});

test('the handle keeps the preset name and offers the noise keys on WebGL', () => {
  _setWebGLAvailableForTests(true);
  const { bg } = load(ENTRIES);
  const [contour, plasma, fluid] = bg.getHandles();
  assert.equal(contour.presetId, 'contour-field');
  for (const k of ['noise_scale', 'num_bands', 'fill_level', 'scroll_speed_x']) assert.ok(contour.has(k), k);
  for (const k of ['base_frequency', 'color_a', 'color_b']) assert.ok(plasma.has(k), k);
  for (const k of ['base_frequency', 'color']) assert.ok(fluid.has(k), k);
});

test('contour-field starts where the Canvas2D version starts for the same seed', () => {
  _setWebGLAvailableForTests(true);
  const gl = load([{ preset: 'contour-field', config: { seed: 42 } }]).renderer.effects[0];
  _setWebGLAvailableForTests(false);
  const c2d = load([{ preset: 'contour-field', config: { seed: 42 } }]).renderer.effects[0];
  assert.deepEqual({ x: gl._offsetX, y: gl._offsetY }, { x: c2d._scrollOffsetX, y: c2d._scrollOffsetY });
  assert.deepEqual(contourSeedOffset(42), { x: c2d._scrollOffsetX, y: c2d._scrollOffsetY });
});

test('the scroll integrates like the Canvas2D effects (px/s times speed)', () => {
  const e = new PlasmaGLEffect({ params: { scroll_speed_x: 8, scroll_speed_y: -5 } });
  e.speed = 2;
  e.update(500, 100, 100);
  assert.deepEqual([e._offsetX, e._offsetY], [8, -5]);
});

test('pan split: whole cells + local reconstruct the lattice coordinate, blocks stay world-anchored', () => {
  for (const offset of [0, 3.7, -1234.56, 98765.4321]) {
    // per pixel: lattice(px) = (px - offset) * k
    const k = 0.012;
    const a = fieldAxis(offset, 0, k);
    for (const px of [0, 17, 480]) assert.ok(Math.abs(a.cell + a.local + px * k - (px - offset) * k) < 1e-6);
    // blocks of B: lattice = floor((px - offset) / B) * B * k
    for (const B of [1, 4, 7]) {
      const b = fieldAxis(offset, B, k);
      for (const px of [0, 3, 5, 333]) {
        const shader = b.cell + b.local + Math.floor((px + b.phase) / B) * B * k;
        assert.ok(Math.abs(shader - Math.floor((px - offset) / B) * B * k) < 1e-6, `offset ${offset} B ${B} px ${px}`);
      }
    }
  }
});

test('scenes build headless and write their uniforms', () => {
  const contour = contourScene.createScene({
    params: { num_octaves: 3, num_bands: 6, fill_level: 0.3, blend_colors: false },
    colors: { stops: [{ r: 255, g: 0, b: 0, a: 1 }, { r: 0, g: 0, b: 255, a: 0.5 }], fill: [] }
  });
  const u = contour.material.uniforms;
  assert.deepEqual([u.uOctaves.value, u.uBands.value, u.uFill.value, u.uBlend.value, u.uStopCount.value, u.uHasFill.value],
    [3, 6, 0.3, false, 2, false]);
  assert.deepEqual(Array.from(u.uStops.value.slice(4, 8)), [0, 0, 1, 0.5]);
  contour.seek(0, { _offsetX: 10, _offsetY: 0, params: { cell_size: 2, noise_scale: 0.005 } });
  assert.equal(u.uBlock.value, 2);
  assert.equal(u.uK.value, 0.005);
  contour.setParam('num_bands', 12);
  assert.equal(u.uBands.value, 12);
  contour.resize(320, 200);
  assert.deepEqual([u.uSize.value.x, u.uSize.value.y], [320, 200]);
  contour.dispose();

  const plasma = plasmaScene.createScene({ params: {}, colors: { a: [{ r: 255, g: 255, b: 255, a: 0.5 }] } });
  assert.deepEqual(plasma.material.uniforms.uColorA.value, [1, 1, 1, 0.5]);
  plasma.seek(0, { _offsetX: 0, _offsetY: 0, params: {} });
  assert.equal(plasma.material.uniforms.uBlock.value, 0, 'plasma samples every pixel');
  plasma.dispose();

  const fluid = fluidScene.createScene({ params: { num_octaves: 2 }, colors: {} });
  fluid.seek(0, { _offsetX: 0, _offsetY: 0, params: {} });
  assert.equal(fluid.material.uniforms.uBlock.value, 4, 'fluid samples per 4 px block');
  fluid.dispose();
});

test('contour colour lists longer than the shader holds are resampled, ends kept', () => {
  const stops = Array.from({ length: 40 }, (_, i) => ({ r: i, g: 0, b: 0, a: 1 }));
  const s = contourScene.createScene({ params: {}, colors: { stops } });
  const u = s.material.uniforms;
  assert.equal(u.uStopCount.value, contourScene.MAX_STOPS);
  assert.equal(Math.round(u.uStops.value[0] * 255), 0);
  assert.equal(Math.round(u.uStops.value[(contourScene.MAX_STOPS - 1) * 4] * 255), 39);
  s.dispose();
});

test('updateConfig (entity-bound, not animatable) reaches params and colours', () => {
  const e = new ContourFieldGLEffect({ params: { cell_size: 1, num_octaves: 2 }, colors: { stops: ['#000'], fill: [] } });
  const seen = [];
  e._scene = { setParam: (k, v) => seen.push([k, v]), setColors: () => seen.push(['colors']) };
  e.updateConfig({ cell_size: 4, num_octaves: 5, fill_color: '#ff0000', unrelated: 1 });
  assert.equal(e.params.cell_size, 4);
  assert.deepEqual(seen, [['cell_size', 4], ['num_octaves', 5], ['colors']]);
  assert.equal(e.colors.fill.length, 1);
});

test('F1: an alert change recolours a WebGL field in place (no rebuild)', () => {
  _setWebGLAvailableForTests(true);
  document.documentElement.style.setProperty('--lcards-test-a', '#112233');
  const { bg } = load([{ preset: 'plasma', config: { color_a: 'var(--lcards-test-a)' } }]);
  const effect = bg.getHandles()[0].effects[0];
  assert.ok(effect instanceof PlasmaGLEffect);
  document.documentElement.style.setProperty('--lcards-test-a', '#445566');
  bg.refreshColors();
  assert.equal(bg.getHandles()[0].effects[0], effect, 'same effect instance');
  assert.deepEqual(effect._rgbaColors().a[0], { r: 0x44, g: 0x55, b: 0x66, a: 1 }, 'the new palette colour');
});

test('FluidGLEffect declares its colour key for bindings', () => {
  assert.equal(FluidGLEffect.colorKeys.color, 'wash');
});

const { NebulaGLEffect } = await import('../../src/core/packs/backgrounds/webgl/ThreeSceneEffect.js');
const nebulaScene = await import('../../src/core/packs/backgrounds/webgl/scenes/nebula.js');

test('nebula: volumetric: true is WebGL; plain, canvas and no WebGL stay Canvas2D', () => {
  _setWebGLAvailableForTests(true);
  assert.deepEqual(names(load([
    { preset: 'nebula', config: { volumetric: true } },
    { preset: 'nebula' },
    { preset: 'nebula', renderer: 'canvas', config: { volumetric: true } }
  ]).renderer), ['NebulaGLEffect', 'NebulaEffect', 'NebulaEffect']);
  _setWebGLAvailableForTests(false);
  assert.deepEqual(names(load([{ preset: 'nebula', config: { volumetric: true } }]).renderer), ['NebulaEffect']);
});

test('nebula volumetric: the same seeded clouds as the plain nebula; keys and scroll reach the model', () => {
  _setWebGLAvailableForTests(true);
  const gl = load([{ preset: 'nebula', config: { seed: 9, cloud_count: 5, volumetric: true } }]).renderer.effects[0];
  const plain = load([{ preset: 'nebula', config: { seed: 9, cloud_count: 5 } }]).renderer.effects[0];
  assert.deepEqual(gl.model.clouds, plain.clouds);
  NebulaGLEffect.animatableProps.turbulence.set(gl, 0.9);
  assert.equal(gl.model.turbulence, 0.9);
  gl.model.scrollSpeedX = 10;
  gl.speed = 2;
  gl.update(500, 100, 100);
  assert.equal(gl._scrollOffsetX, 10, 'scroll integrates on the model at the effect speed');
});

test('nebula volumetric scene: cloud uniforms from the model each frame', () => {
  _setWebGLAvailableForTests(true);
  const effect = load([{ preset: 'nebula', config: { seed: 3, cloud_count: 3, colors: ['#ff0000'], volumetric: true } }]).renderer.effects[0];
  const s = nebulaScene.createScene({ params: {}, colors: {} });
  s.resize(400, 200);
  s.seek(2000, effect);
  const u = s.material.uniforms;
  assert.equal(u.uCount.value, 3);
  const [first] = effect.model.cloudPlacements(400, 200);
  assert.ok(Math.abs(u.uCenter.value[0] - first.x) < 1e-3);
  assert.deepEqual(Array.from(u.uColor.value.slice(0, 3)), [1, 0, 0]);
  assert.equal(u.uTime.value, 2);
  s.dispose();
});
