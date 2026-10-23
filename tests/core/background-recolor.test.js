/**
 * F1: an alert-mode palette change (BackgroundAnimationRenderer.refreshColors)
 * must not reset background motion. Effects that can recolour in place keep
 * their instances (star layout, scroll offsets, zoom clocks); the others are
 * rebuilt for their entry only, at the same place in the stack, with their
 * seed, clocks and animated values carried over.
 *
 * Headless: a fake renderer with Canvas2DRenderer's real replaceEffects().
 */
import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { installJsdom } from '../helpers/jsdom-env.js';

const env = installJsdom();
after(() => env.restore());
const { BackgroundAnimationRenderer } = await import('../../src/core/packs/backgrounds/BackgroundAnimationRenderer.js');
const { Canvas2DRenderer } = await import('../../src/core/packs/backgrounds/renderers/Canvas2DRenderer.js');

const root = document.documentElement;
/** @param {string} color */
const setPalette = (color) => root.style.setProperty('--test-bg', color);

/** Build a renderer for `config` with a fake Canvas2DRenderer. */
function load(config) {
  const bg = new BackgroundAnimationRenderer(/** @type {any} */ ({ offsetWidth: 400, offsetHeight: 300 }), config);
  bg._resolveConfig(config);
  bg.canvas = /** @type {any} */ ({});
  const fake = /** @type {any} */ ({
    effects: [],
    addEffect(e) { this.effects.push(e); },
    requestFrame() {},
    replaceEffects: Canvas2DRenderer.prototype.replaceEffects
  });
  bg.renderer = fake;
  assert.equal(bg._loadEffects(), true);
  return { bg, renderer: fake };
}

/** Run `ms` of motion on every drawn effect. */
const tick = (renderer, ms) => renderer.effects.forEach((e) => e.update(ms, 400, 300));
const base = (e) => e.baseEffect ?? e;
const positions = (effect) => base(effect).stars.map((s) => `${s.x.toFixed(6)},${s.y.toFixed(6)}`);

test('starfield without a seed: alert keeps the instance, the layout and the motion, takes the new colour', () => {
  setPalette('#ff0000');
  const { bg, renderer } = load([{ preset: 'starfield', config: { color: 'var(--test-bg)' } }]);
  tick(renderer, 500);
  const before = renderer.effects[0];
  const layout = positions(before);
  assert.equal(base(before).stars[0].color, '#ff0000');

  setPalette('#00ff00');
  assert.equal(bg.refreshColors(), true);
  assert.equal(renderer.effects[0], before, 'same effect object');
  assert.deepEqual(positions(renderer.effects[0]), layout, 'stars did not move');
  assert.equal(base(before).stars[0].color, '#00ff00');
  assert.ok(base(before)._drawBuckets.every((b) => b.fillStyle === '#00ff00'));
});

test('zoomed starfield: alert keeps every zoom layer and its cycle clock', () => {
  setPalette('#ff0000');
  const { bg, renderer } = load([{ preset: 'starfield', zoom: { layers: 3 }, config: { color: 'var(--test-bg)' } }]);
  tick(renderer, 2000);
  const before = [...renderer.effects];
  const clocks = before.map((z) => z._elapsedTime);
  setPalette('#0000ff');
  bg.refreshColors();
  assert.deepEqual(renderer.effects, before);
  assert.deepEqual(renderer.effects.map((z) => z._elapsedTime), clocks);
  assert.equal(base(renderer.effects[2]).stars[0].color, '#0000ff');
});

test('multi-colour starfield: each star keeps its colour slot', () => {
  setPalette('#ff0000');
  const { bg, renderer } = load([{ preset: 'starfield', config: { seed: 7, colors: ['var(--test-bg)', '#ffffff'] } }]);
  const slots = base(renderer.effects[0]).stars.map((s) => (s.color === '#ffffff' ? 'w' : 'v'));
  setPalette('#123456');
  bg.refreshColors();
  const after = base(renderer.effects[0]).stars.map((s) => (s.color === '#ffffff' ? 'w' : s.color === '#123456' ? 'v' : '?'));
  assert.deepEqual(after, slots);
});

test('grid and nebula recolour in place, keeping scroll offsets', () => {
  setPalette('#ff0000');
  const { bg, renderer } = load([
    { preset: 'grid', config: { color: 'var(--test-bg)' } },
    { preset: 'nebula', config: { colors: ['var(--test-bg)'] } }
  ]);
  tick(renderer, 1000);
  const [grid, nebula] = renderer.effects;
  const scroll = [grid.scrollX, nebula._scrollOffsetX];
  setPalette('#00ff00');
  bg.refreshColors();
  assert.equal(renderer.effects[0], grid);
  assert.equal(renderer.effects[1], nebula);
  assert.deepEqual([grid.scrollX, nebula._scrollOffsetX], scroll);
  assert.equal(grid.color, '#00ff00');
  assert.equal(nebula.clouds[0].color, '#00ff00');
});

test('an effect that cannot recolour is rebuilt in its own slot, clocks and animated values carried', () => {
  setPalette('#ff0000');
  const { bg, renderer } = load([
    { preset: 'grid', config: { color: '#ffffff' } },
    { preset: 'plasma', config: { color_a: 'var(--test-bg)' } },
    { preset: 'starfield', config: { seed: 3 } }
  ]);
  const [grid, plasma, stars] = renderer.effects;
  bg.handles[1].setProp('speed', 3);
  tick(renderer, 1000);
  const offset = plasma._offsetX;
  setPalette('#00ff00');
  bg.refreshColors();

  assert.equal(renderer.effects.length, 3);
  assert.equal(renderer.effects[0], grid, 'other entries untouched');
  assert.equal(renderer.effects[2], stars);
  const rebuilt = renderer.effects[1];
  assert.notEqual(rebuilt, plasma, 'plasma rebuilt');
  assert.equal(rebuilt.constructor, plasma.constructor);
  assert.equal(rebuilt._offsetX, offset, 'pan carried over');
  assert.equal(rebuilt.speed, 3, 'animated value re-applied');
  assert.equal(bg.handles[1].effects[0], rebuilt, 'handle re-attached');
  assert.equal(plasma.isActive(), false, 'old instance destroyed');
});

test('a rebuilt entry keeps its random seed (same layout)', () => {
  const { bg } = load([{ preset: 'starfield', config: {} }]);
  const handle = bg.handles[0];
  const a = bg._buildEntry({ preset: 'starfield', config: {} }, handle);
  const b = bg._buildEntry({ preset: 'starfield', config: {} }, handle);
  assert.ok(handle.seed !== undefined);
  assert.deepEqual(positions(a.baseEffects[0]), positions(b.baseEffects[0]));
});

test('a bound colour is re-resolved after the alert change', () => {
  setPalette('#ff0000');
  const { bg, renderer } = load([{ preset: 'grid', transition: 0, config: { color: '[[[ return "var(--test-bg)" ]]]' } }]);
  const hass = { states: {} };
  bg.updateHass(hass, null, {});
  assert.equal(renderer.effects[0].color, '#ff0000');
  setPalette('#00ff00');
  bg.refreshColors(hass, null, {});
  assert.equal(renderer.effects[0].color, '#00ff00');
});
