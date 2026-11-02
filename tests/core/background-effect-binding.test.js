/**
 * Entity binding on background effects (R4): a map_range / template value in
 * `background_animation[].config` must reach the running effect.
 *
 * The renderer is driven headless: a fake Canvas2DRenderer collects the
 * effects, so no canvas is needed.
 */
import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { installJsdom } from '../helpers/jsdom-env.js';

const env = installJsdom();
after(() => env.restore());
const { BackgroundAnimationRenderer } = await import('../../src/core/packs/backgrounds/BackgroundAnimationRenderer.js');

/** Build a renderer for `config` with a fake Canvas2DRenderer. */
function load(config) {
  const bg = new BackgroundAnimationRenderer(/** @type {any} */ ({ offsetWidth: 400, offsetHeight: 300 }), config);
  bg._resolveConfig(config);
  const added = [];
  bg.renderer = /** @type {any} */ ({
    effects: added,
    addEffect(e) { added.push(e); },
    requestFrame() {},
  });
  assert.equal(bg._loadEffects(), true);
  return { bg, effects: added };
}

const hass = (value) => ({ states: { 'sensor.level': { entity_id: 'sensor.level', state: String(value), attributes: {} } } });
const mapRange = { map_range: { entity_id: 'sensor.level', input: [0, 100], output: [0, 200] } };

/** The base effect of a renderer entry (unwraps a ZoomEffect). */
const base = (e) => e.baseEffect ?? e;

test('map_range on starfield.scroll_speed_x reaches the effect', () => {
  const { bg, effects } = load([{ preset: 'starfield', transition: 0, config: { seed: 1, scroll_speed_x: mapRange } }]);
  bg.updateHass(hass(50), null, {});
  assert.equal(base(effects[0]).scrollSpeedX, 100);
});

test('map_range on a zoomed starfield reaches every layer', () => {
  const { bg, effects } = load([{ preset: 'starfield', transition: 0, zoom: { layers: 3 }, config: { seed: 1, scroll_speed_x: mapRange } }]);
  assert.equal(effects.length, 3);
  bg.updateHass(hass(25), null, {});
  for (const e of effects) assert.equal(base(e).scrollSpeedX, 50);
});

test('map_range on grid.scroll_speed_x reaches the effect', () => {
  const { bg, effects } = load([{ preset: 'grid', transition: 0, config: { scroll_speed_x: mapRange } }]);
  bg.updateHass(hass(30), null, {});
  assert.equal(base(effects[0]).scrollSpeedX, 60);
});

test('map_range on contour-field.fill_level reaches the effect', () => {
  const fill = { map_range: { entity_id: 'sensor.level', input: [0, 100], output: [0, 0.9] } };
  const { bg, effects } = load([{ preset: 'contour-field', transition: 0, config: { seed: 1, fill_level: fill } }]);
  bg.updateHass(hass(20), null, {});
  assert.ok(Math.abs(base(effects[0]).fillLevel - 0.18) < 1e-9);
});

test('a template on nebula.scroll_speed_y reaches the effect', () => {
  const { bg, effects } = load([{ preset: 'nebula', transition: 0, config: { seed: 1, scroll_speed_y: '[[[ return 7 ]]]' } }]);
  bg.updateHass(hass(0), null, {});
  assert.equal(base(effects[0]).scrollSpeedY, 7);
});

test('map_range takes entity, as animations and astrometrics do (entity_id, the older name, still works)', () => {
  for (const key of ['entity', 'entity_id']) {
    const { bg, effects } = load([{ preset: 'starfield', transition: 0, config: { seed: 1, scroll_speed_x: { map_range: { [key]: 'sensor.level', input: [0, 100], output: [0, 200] } } } }]);
    bg.updateHass(hass(50), null, {});
    assert.equal(base(effects[0]).scrollSpeedX, 100, key);
  }
});
