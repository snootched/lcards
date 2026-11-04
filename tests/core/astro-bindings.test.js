/**
 * Astrometrics settings from entities (R4b, src/core/astrometrics/bindings.js):
 * which keys bind (any depth, positions and text left out), the mapping
 * (range default from min / max, clamp, raw without to, missing values),
 * dates, values set into a config, the tour's stops, and the ease.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  collectBindings, bindingKey, roundedSetting, settingConfig, mapEntity, mapNumber, dateValue, withValues, isTourView, tourStop, easeStep, isBinding, isTemplateValue,
  DEFAULT_SMOOTH_MS
} from '../../src/core/astrometrics/bindings.js';

import { WHOLE_NUMBER_KEYS, LIVE_TYPE_KEYS } from '../../src/core/astrometrics/names.js';
import { astrometricsSchema } from '../../src/cards/schemas/astrometrics-schema.js';

const shields = (state, attrs = { min: 0, max: 100 }) => ({ entity_id: 'input_number.shields', state: String(state), attributes: attrs });

test('collectBindings: object and point keys at any depth; live keys; card time_scale and clock; positions and text left out', () => {
  const config = {
    time_scale: { entity: 'input_number.speed', output: [0, 4] },
    clock: { rate: { entity: 'input_number.rate' }, date: { entity: 'input_datetime.date' } },
    points: [
      { id: 'ship', xyz: { entity: 'device_tracker.ship' }, alt: { entity: 'sensor.alt' }, label: '{entity.state}', text: { label: { content: '[[[ return 1 ]]]' } } },
      { id: 'plain', xyz: [0, 0, 0] }
    ],
    objects: [
      { type: 'sphere', id: 'bubble', opacity: { entity: 'input_number.shields', output: [0, 0.6], smooth: 1000 }, radius: { entity: 'sensor.r' } },
      { type: 'grid', id: 'well', shape: 'well', deform: [{ type: 'wobble', amplitude: "[[[ return states['input_number.power'].state / 100 ]]]" }] },
      { type: 'ring', id: 'r', tap_action: { action: 'more-info', entity: 'light.x' } },
      { type: 'system', id: 'sys', units: 'km' }
    ]
  };
  const list = collectBindings(config);
  const keys = list.map(bindingKey).sort();
  assert.deepEqual(keys, [
    'card::clock.date', 'card::clock.rate', 'card::time_scale',
    'object:bubble:opacity', 'object:bubble:radius', 'object:well:deform.0.amplitude',
    'point:ship:alt'
  ]);
  const by = Object.fromEntries(list.map((b) => [bindingKey(b), b]));
  assert.equal(by['object:bubble:opacity'].live, true);
  assert.equal(by['object:bubble:opacity'].smooth, 1000);
  assert.equal(by['object:bubble:radius'].smooth, DEFAULT_SMOOTH_MS);
  assert.equal(by['object:well:deform.0.amplitude'].live, false, 'a deform step rebuilds');
  assert.deepEqual(by['object:well:deform.0.amplitude'].entities, ['input_number.power'], 'a template\'s entities');
  assert.equal(by['card::time_scale'].live, true);
  assert.equal(by['card::clock.date'].kind, 'date');
  assert.equal(by['point:ship:alt'].live, false);
});

test('isBinding and isTemplateValue', () => {
  assert.equal(isBinding({ entity: 'sensor.x' }), true);
  assert.equal(isBinding({ entity: '' }), false);
  assert.equal(isBinding([1, 2]), false);
  assert.equal(isTemplateValue('{{ 1 }}'), true);
  assert.equal(isTemplateValue('tilted'), false);
});

test('mapping (map_range words): input from min / max, else 0 to 100; clamped unless clamp: false; no output is the raw number; missing values are null', () => {
  const spec = { entity: 'input_number.shields', output: [0, 0.6] };
  assert.equal(mapEntity(spec, shields(50)), 0.3);
  assert.equal(mapEntity(spec, shields(120)), 0.6, 'clamped high');
  assert.equal(mapEntity(spec, shields(-5)), 0, 'clamped low');
  assert.ok(Math.abs(mapEntity(spec, shields(15, { min: 10, max: 35 })) - 0.12) < 1e-12, 'the entity\'s own min and max');
  assert.equal(mapEntity({ ...spec, input: [0, 200] }, shields(100)), 0.3, 'input wins');
  assert.ok(Math.abs(mapEntity({ ...spec, clamp: false }, shields(120)) - 0.72) < 1e-12, 'clamp: false carries on past the end');
  assert.equal(mapEntity({ entity: 'sensor.x' }, shields(42)), 42, 'no output: the number as it is');
  assert.equal(mapEntity({ entity: 'sensor.x', attribute: 'level', output: [0, 1] }, { state: 'on', attributes: { level: 25 } }), 0.25, 'an attribute');
  assert.equal(mapEntity(spec, shields('unavailable')), null);
  assert.equal(mapEntity(spec, undefined), null);
  assert.equal(mapNumber(null, ' 7 '), 7, 'a template result');
  assert.equal(mapNumber(null, true), null);
  assert.equal(mapNumber({ output: [10, 20] }, 50), 15, 'output with the default 0 to 100 input');
  // the old R4b words (never released) are not read: the setting gets the entity's number as it is
  assert.equal(mapNumber({ to: [10, 20], range: [0, 200] }, 50), 50);
});

test('dates: an input_datetime state or attribute, a template result; unknown is none', () => {
  assert.equal(dateValue({ entity: 'input_datetime.d' }, { state: '2026-10-30 12:00:00', attributes: {} }), '2026-10-30 12:00:00');
  assert.equal(dateValue({ entity: 'sensor.d', attribute: 'when' }, { state: 'x', attributes: { when: '2000-01-01' } }), '2000-01-01');
  assert.equal(dateValue({ entity: 'input_datetime.d' }, { state: 'unknown' }), null);
  assert.equal(dateValue(null, '1969-07-20'), '1969-07-20');
  assert.equal(dateValue(null, ''), null);
});

test('withValues: sets numbers at paths (copies along them), null removes the key', () => {
  const obj = { id: 'w', deform: [{ type: 'wobble', amplitude: { entity: 'x' } }], opacity: { entity: 'y' }, keep: { a: 1 } };
  const out = withValues(obj, [[['deform', 0, 'amplitude'], 0.3], [['opacity'], null]]);
  assert.equal(out.deform[0].amplitude, 0.3);
  assert.equal(out.deform[0].type, 'wobble');
  assert.equal('opacity' in out, false);
  assert.equal(out.keep, obj.keep, 'untouched parts are shared');
  assert.deepEqual(obj.deform[0].amplitude, { entity: 'x' }, 'the original is not changed');
});

test('tour: a number picks views[n] (rounded, clamped), text names a view, a stop may set the clock', () => {
  const tour = { entity: 'input_number.stage', views: ['galaxy', { view: 'earth', date: 'now', rate: 0 }, 'sol'] };
  assert.equal(isTourView(tour), true);
  assert.equal(isTourView('galaxy'), false);
  assert.deepEqual(tourStop(tour, { state: '0' }), { view: 'galaxy' });
  assert.deepEqual(tourStop(tour, { state: '1.2' }), { view: 'earth', date: 'now', rate: 0 });
  assert.deepEqual(tourStop(tour, { state: '9' }), { view: 'sol' }, 'clamped');
  assert.deepEqual(tourStop(tour, { state: 'sol' }), { view: 'sol' }, 'a name');
  assert.deepEqual(tourStop({ entity: 'input_select.v' }, { state: 'mars' }), { view: 'mars' }, 'no list: the state names the view');
  assert.equal(tourStop(tour, { state: 'unavailable' }), null);
  assert.equal(tourStop(tour, undefined), null);
});

test('easeStep: smoothstep from to, done at the end, 0 ms steps', () => {
  assert.deepEqual(easeStep(0, 1, 0, 600, 0), { value: 0, done: false });
  assert.equal(easeStep(0, 1, 0, 600, 300).value, 0.5);
  assert.deepEqual(easeStep(0, 1, 0, 600, 600), { value: 1, done: true });
  assert.deepEqual(easeStep(0, 1, 0, 0, 0), { value: 1, done: true });
});

test('whole-number settings: count, arms, lobes ... bind (any depth), their values rounded; seeds and card keys are not whole', () => {
  const list = collectBindings({
    time_scale: { entity: 'input_number.speed' },
    objects: [
      { type: 'belt', id: 'belt', count: { entity: 'input_number.rocks', output: [100, 500] }, seed: 2 },
      { type: 'galaxy', id: 'g', arms: { count: "[[[ return 3 ]]]" }, stars: { count: { entity: 'sensor.s' } } },
      { type: 'grid', id: 'well', deform: [{ type: 'wobble', lobes: { entity: 'input_number.lobes' }, amplitude: { entity: 'input_number.a' } }] }
    ]
  });
  const by = Object.fromEntries(list.map((b) => [bindingKey(b), b]));
  for (const k of ['object:belt:count', 'object:g:arms.count', 'object:g:stars.count', 'object:well:deform.0.lobes']) {
    assert.equal(by[k]?.kind, 'whole', k);
    assert.equal(by[k].live, k === 'object:belt:count', k === 'object:belt:count' ? 'a belt draws fewer in place' : `${k} rebuilds its object`);
  }
  assert.equal(by['object:well:deform.0.amplitude'].kind, 'number');
  assert.equal(by['card::time_scale'].kind, 'number');
  assert.equal(roundedSetting(by['object:belt:count'], mapNumber(by['object:belt:count'].spec, '33.3')), 233);
  assert.equal(roundedSetting(by['object:belt:count'], null), null);
  assert.equal(roundedSetting(by['object:well:deform.0.amplitude'], 0.37), 0.37, 'a decimal key as it is');
});

test('whole-number settings: the schema\'s integer settings (an integer, a binding or a template) are exactly WHOLE_NUMBER_KEYS', () => {
  /** @type {Set<string>} */
  const found = new Set();
  const seen = new Set();
  /** @param {any} node */
  const visit = (node) => {
    if (!node || typeof node !== 'object' || seen.has(node)) return;
    seen.add(node);
    for (const [k, v] of Object.entries(node.properties ?? {})) {
      const alts = /** @type {any} */ (v)?.anyOf;
      if (Array.isArray(alts) && alts[0]?.type === 'integer' && alts.some((/** @type {any} */ a) => a?.properties?.entity)) found.add(k);
    }
    for (const v of Object.values(node)) if (v && typeof v === 'object') visit(v);
  };
  visit(astrometricsSchema);
  assert.deepEqual([...found].sort(), [...WHOLE_NUMBER_KEYS].sort());
});

test('a pair setting: each side can follow its own entity, the values go back into the pair', () => {
  const config = {
    objects: [{ type: 'belt', id: 'belt', radius: [{ entity: 'input_number.a', output: [40, 60] }, { entity: 'input_number.b', output: [100, 120] }] }]
  };
  const list = collectBindings(config);
  assert.deepEqual(list.map(bindingKey).sort(), ['object:belt:radius.0', 'object:belt:radius.1']);
  for (const b of list) assert.equal(b.live, true, 'a belt takes each side in place (LIVE_TYPE_KEYS)');
  // another type's pair side rebuilds
  const image = collectBindings({ objects: [{ type: 'image', id: 'pic', size: [{ entity: 'input_number.w' }, 100] }] });
  assert.equal(image[0].live, false);
  const values = new Map([['object:belt:radius.0', 50], ['object:belt:radius.1', 110]]);
  assert.deepEqual(settingConfig(config, list, values).objects[0].radius, [50, 110]);
  // before a side has a value: undefined there, so the builder's default for that side
  assert.deepEqual(settingConfig(config, list, new Map([['object:belt:radius.1', 110]])).objects[0].radius, [undefined, 110]);
});

test('per-type live keys (LIVE_TYPE_KEYS): a belt\'s thickness and count ease; count builds for the top of output (or the most)', () => {
  const config = {
    objects: [
      { type: 'belt', id: 'belt', thickness: { entity: 'input_number.t' }, count: { entity: 'input_number.n', output: [100, 2400.4] } },
      { type: 'belt', id: 'tpl', count: "[[[ return 10 ]]]" },
      { type: 'galaxy', id: 'g', thickness: { entity: 'input_number.t' } }
    ]
  };
  const list = collectBindings(config);
  const by = Object.fromEntries(list.map((b) => [bindingKey(b), b]));
  assert.equal(by['object:belt:thickness'].live, true);
  assert.equal(by['object:belt:thickness'].most, undefined);
  assert.equal(by['object:belt:count'].live, true);
  assert.equal(by['object:belt:count'].most, 2401, 'the top of output, up');
  assert.equal(by['object:tpl:count'].most, LIVE_TYPE_KEYS.belt.most?.count, 'a template: the most a belt draws');
  assert.equal(by['object:g:thickness'].live, false, 'not a galaxy\'s');
  const built = settingConfig(config, list, new Map([['object:belt:count', 300]])).objects[0];
  assert.equal(built.count, 300);
  assert.deepEqual(built._most, { count: 2401 });
});
