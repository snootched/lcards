/**
 * Astrometrics settings from entities (R4b, src/core/astrometrics/bindings.js):
 * which keys bind (any depth, positions and text left out), the mapping
 * (range default from min / max, clamp, raw without to, missing values),
 * dates, values set into a config, the tour's stops, and the ease.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  collectBindings, bindingKey, mapEntity, mapNumber, dateValue, withValues, isTourView, tourStop, easeStep, isBinding, isTemplateValue,
  DEFAULT_SMOOTH_MS
} from '../../src/core/astrometrics/bindings.js';

const shields = (state, attrs = { min: 0, max: 100 }) => ({ entity_id: 'input_number.shields', state: String(state), attributes: attrs });

test('collectBindings: object and point keys at any depth; live keys; card time_scale and clock; positions and text left out', () => {
  const config = {
    time_scale: { entity: 'input_number.speed', to: [0, 4] },
    clock: { rate: { entity: 'input_number.rate' }, date: { entity: 'input_datetime.date' } },
    points: [
      { id: 'ship', xyz: { entity: 'device_tracker.ship' }, alt: { entity: 'sensor.alt' }, label: '{entity.state}', text: { label: { content: '[[[ return 1 ]]]' } } },
      { id: 'plain', xyz: [0, 0, 0] }
    ],
    objects: [
      { type: 'sphere', id: 'bubble', opacity: { entity: 'input_number.shields', to: [0, 0.6], smooth: 1000 }, radius: { entity: 'sensor.r' } },
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

test('mapping: range from min / max, else 0 to 100; clamped; no to is the raw number; missing values are null', () => {
  const spec = { entity: 'input_number.shields', to: [0, 0.6] };
  assert.equal(mapEntity(spec, shields(50)), 0.3);
  assert.equal(mapEntity(spec, shields(120)), 0.6, 'clamped high');
  assert.equal(mapEntity(spec, shields(-5)), 0, 'clamped low');
  assert.ok(Math.abs(mapEntity(spec, shields(15, { min: 10, max: 35 })) - 0.12) < 1e-12, 'the entity\'s own min and max');
  assert.equal(mapEntity({ ...spec, range: [0, 200] }, shields(100)), 0.3, 'range wins');
  assert.equal(mapEntity({ entity: 'sensor.x' }, shields(42)), 42, 'no to: the number as it is');
  assert.equal(mapEntity({ entity: 'sensor.x', attribute: 'level', to: [0, 1] }, { state: 'on', attributes: { level: 25 } }), 0.25, 'an attribute');
  assert.equal(mapEntity(spec, shields('unavailable')), null);
  assert.equal(mapEntity(spec, undefined), null);
  assert.equal(mapNumber(null, ' 7 '), 7, 'a template result');
  assert.equal(mapNumber(null, true), null);
  assert.equal(mapNumber({ to: [10, 20] }, 50), 15, 'to with the default 0 to 100 range');
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
