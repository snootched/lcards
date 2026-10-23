/**
 * Background effect adapter (C1): anime.js reads and writes effect parameters
 * through EffectHandles; handles survive a palette rebuild; layer order is
 * first = bottom; declared keys are real YAML config keys.
 */
import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { installJsdom } from '../helpers/jsdom-env.js';

const env = installJsdom();
after(() => env.restore());

const anime = await import('animejs');
const { registerEffectAdapter, rgbaFromNumbers } = await import('../../src/core/packs/backgrounds/effect-adapter.js');
const { EffectHandle, isEffectHandle } = await import('../../src/core/packs/backgrounds/effect-handle.js');
const { BackgroundAnimationRenderer } = await import('../../src/core/packs/backgrounds/BackgroundAnimationRenderer.js');
const { Canvas2DRenderer } = await import('../../src/core/packs/backgrounds/renderers/Canvas2DRenderer.js');
const { BACKGROUND_PRESETS } = await import('../../src/core/packs/backgrounds/presets/index.js');
const { BACKGROUND_ANIMATION_PARAMS_SCHEMAS } = await import('../../src/cards/schemas/background-animation-params-schemas.js');
const { numProp } = await import('../../src/core/packs/backgrounds/effects/animatable-props.js');

registerEffectAdapter();

/** A canvas-free effect with one cached value */
class FakeEffect {
  static animatableProps = {
    speed: numProp('speed', { min: 0 }),
    level: numProp('level', { after: (e) => { e.invalidated++; } }),
    tint: { color: true, get: (e) => e.tint, set: (e, v) => { e.tint = v; } }
  };
  constructor() { this.speed = 1; this.level = 0; this.tint = 'rgba(255, 0, 0, 1)'; this.invalidated = 0; }
}

function fakeHandle(n = 1) {
  const owner = { renderer: { frames: 0, requestFrame() { this.frames++; } } };
  const effects = Array.from({ length: n }, () => new FakeEffect());
  const h = new EffectHandle(0, 'fake', owner);
  h.attach(effects, effects);
  return { h, effects, owner };
}

/** @param {any[]} [added] */
const fakeRenderer = (added = []) => /** @type {any} */ ({ effects: added, addEffect(e) { added.push(e); }, requestFrame() {}, destroy() {} });

/** Build a renderer for `config` with a fake Canvas2DRenderer. */
function load(config) {
  const bg = new BackgroundAnimationRenderer(/** @type {any} */ ({ offsetWidth: 400, offsetHeight: 300 }), config);
  bg._resolveConfig(config);
  const added = [];
  bg.renderer = fakeRenderer(added);
  assert.equal(bg._loadEffects(), true);
  return { bg, effects: added };
}

test('a handle is recognised, and is connected until killed', () => {
  const { h } = fakeHandle();
  assert.equal(isEffectHandle(h), true);
  assert.equal(isEffectHandle({}), false);
  assert.equal(h.isConnected, true);
  h.kill();
  assert.equal(h.isConnected, false);
});

test('anime.js tweens a declared number on every effect, and revert restores it', () => {
  const { h, effects } = fakeHandle(3);
  const a = anime.animate(h, { speed: [1, 9], duration: 100, ease: 'linear', autoplay: false });
  a.seek(50);
  for (const e of effects) assert.equal(e.speed, 5);
  a.seek(100);
  for (const e of effects) assert.equal(e.speed, 9);
  a.revert();
  for (const e of effects) assert.equal(e.speed, 1);
});

test('a colour goes through tween._numbers and comes out as rgba()', () => {
  const { h, effects } = fakeHandle();
  const a = anime.animate(h, { tint: 'rgba(0, 0, 255, 1)', duration: 100, ease: 'linear', autoplay: false });
  a.seek(50);
  const [r, g, b, alpha] = effects[0].tint.match(/[\d.]+/g).map(Number);
  assert.ok(r > 0 && r < 255 && b > 0 && b < 255 && g === 0 && alpha === 1, effects[0].tint);
  a.revert();
  assert.equal(effects[0].tint, 'rgba(255, 0, 0, 1)');
  assert.equal(rgbaFromNumbers([300, -1, 10.4, 2]), 'rgba(255, 0, 10, 1)');
});

test('a setter runs its invalidation hook and asks for a frame', () => {
  const { h, effects, owner } = fakeHandle();
  h.setProp('level', 4);
  assert.equal(effects[0].level, 4);
  assert.equal(effects[0].invalidated, 1);
  assert.ok(owner.renderer.frames >= 1);
});

test('transform keys land on the drawn objects', () => {
  const { h, effects } = fakeHandle();
  h.setProp('x', 12);
  h.setProp('rotate', 45);
  assert.deepEqual(/** @type {any} */ (effects[0])._xform, { x: 12, y: 0, rotate: 45, scale: 1 });
  assert.equal(h.has('scale'), true);
  assert.equal(h.has('bogus'), false);
});

test('a rebuild re-attaches new effects and keeps numeric values, not colours', () => {
  const { h } = fakeHandle();
  h.setProp('speed', 6);
  h.setProp('tint', 'rgba(0, 0, 255, 1)');
  h.detach();
  const fresh = [new FakeEffect()];
  h.attach(fresh, fresh);
  assert.equal(fresh[0].speed, 6);
  assert.equal(fresh[0].tint, 'rgba(255, 0, 0, 1)');
});

test('a running animation keeps driving the new effects after a rebuild', () => {
  const { h } = fakeHandle();
  const a = anime.animate(h, { speed: [1, 9], duration: 100, ease: 'linear', autoplay: false });
  a.seek(25);
  h.detach();
  const fresh = [new FakeEffect()];
  h.attach(fresh, fresh);
  a.seek(75);
  assert.equal(fresh[0].speed, 7);
});

test('a zoomed entry: speed also runs the zoom cycle faster', () => {
  const { bg, effects } = load([{ preset: 'starfield', zoom: { layers: 2 }, config: { seed: 1 } }]);
  const [handle] = bg.getHandles();
  handle.setProp('speed', 4);
  for (const z of effects) {
    assert.equal(z.speed, 4);
    assert.equal(z.baseEffect.speed, 4);
  }
});

test('config.speed reaches every preset that moves', () => {
  const { effects } = load([{ preset: 'nebula', config: { seed: 1, speed: 3 } }, { preset: 'grid', config: { speed: 0.5 } }]);
  assert.equal(effects[0].speed, 3);
  assert.equal(effects[1].speed, 0.5);
});

test('getHandles: all entries, one by index, none for a disabled one', () => {
  const { bg } = load([{ preset: 'grid' }, { preset: 'solid', enabled: false }, { preset: 'starfield', config: { seed: 2 } }]);
  assert.deepEqual(bg.getHandles().map((h) => h.presetId), ['grid', 'starfield']);
  assert.deepEqual(bg.getHandles(2).map((h) => h.presetId), ['starfield']);
  assert.deepEqual(bg.getHandles(1), []);
  assert.deepEqual(bg.getHandles(9), []);
});

test('refreshColors keeps the handles (same objects, new effects)', () => {
  const { bg } = load([{ preset: 'grid' }]);
  const [before] = bg.getHandles();
  const oldEffect = before.effects[0];
  before.setProp('speed', 2);
  bg._teardown();
  bg.renderer = fakeRenderer();
  bg._loadEffects();
  const [afterRebuild] = bg.getHandles();
  assert.equal(afterRebuild, before);
  assert.notEqual(afterRebuild.effects[0], oldEffect);
  assert.equal(afterRebuild.effects[0].speed, 2);
  assert.equal(bg._reactiveEffects.length, 1, 'a rebuild must not stack reactive entries');
});

test('destroy kills the handles', () => {
  const { bg } = load([{ preset: 'grid' }]);
  const [h] = bg.getHandles();
  bg.destroy();
  assert.equal(h.isConnected, false);
  assert.deepEqual(bg.getHandles(), []);
});

const hass = (value) => ({ states: { 'sensor.level': { entity_id: 'sensor.level', state: String(value), attributes: {} } } });
const mapRange = { map_range: { entity_id: 'sensor.level', input: [0, 100], output: [0, 200] } };

test('a bound value snaps first, then glides to the next one', async () => {
  const { bg, effects } = load([{ preset: 'grid', transition: 200, config: { scroll_speed_x: mapRange } }]);
  bg.updateHass(hass(10), null, {});
  assert.equal(effects[0].scrollSpeedX, 20, 'first value snaps');
  bg.updateHass(hass(60), null, {});
  assert.equal(effects[0].scrollSpeedX, 20, 'second value starts a glide');
  await new Promise((r) => setTimeout(r, 100));
  const mid = effects[0].scrollSpeedX;
  assert.ok(mid > 20 && mid < 120, `mid-glide value ${mid}`);
  await new Promise((r) => setTimeout(r, 200));
  assert.equal(effects[0].scrollSpeedX, 120);
});

test('transition: 0 snaps every value', () => {
  const { bg, effects } = load([{ preset: 'grid', transition: 0, config: { scroll_speed_x: mapRange } }]);
  bg.updateHass(hass(10), null, {});
  bg.updateHass(hass(60), null, {});
  assert.equal(effects[0].scrollSpeedX, 120);
});

test('a key no path can apply is reported once', () => {
  const { bg } = load([{ preset: 'starfield', config: { seed: 1, count: '[[[ return 40 ]]]' } }]);
  const warned = bg._warnedKeys;
  bg.updateHass(hass(1), null, {});
  bg.updateHass(hass(2), null, {});
  assert.deepEqual([...warned], ['starfield.count']);
});

test('layers draw first to last: the first effect is the bottom', () => {
  const order = [];
  const ctx = { clearRect() {}, save() {}, restore() {}, translate() {}, rotate() {}, scale() {} };
  const canvas = /** @type {any} */ ({ width: 10, height: 10, getContext: () => ctx });
  const r = new Canvas2DRenderer(canvas, { monitorPerformance: false });
  const fx = (name, active = true) => ({ isActive: () => active, update() {}, draw() { order.push(name); }, destroy() {} });
  r.effects = [fx('bottom'), fx('gone', false), fx('top')];
  r._drawEffects(16);
  assert.deepEqual(order, ['bottom', 'top']);
  assert.equal(r.effects.length, 2, 'inactive effects are removed after the pass');
});

test('every declared key is a config key of a preset that builds that effect', () => {
  /** @type {Map<Function, Set<string>>} */
  const schemaKeysByClass = new Map();
  for (const [presetId, preset] of Object.entries(BACKGROUND_PRESETS)) {
    const [effect] = preset.createEffects({ seed: 1 }, null);
    const keys = schemaKeysByClass.get(effect.constructor) ?? new Set();
    Object.keys(BACKGROUND_ANIMATION_PARAMS_SCHEMAS[presetId]?.properties ?? {}).forEach((k) => keys.add(k));
    schemaKeysByClass.set(effect.constructor, keys);
  }
  for (const [cls, keys] of schemaKeysByClass) {
    for (const key of Object.keys(/** @type {any} */ (cls).animatableProps ?? {})) {
      assert.ok(keys.has(key), `${cls.name}.animatableProps.${key} is not a config key of any preset using it`);
    }
  }
});
