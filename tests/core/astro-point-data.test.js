/**
 * Live point data (E3a): entity bindings (placements, point-data.js) and
 * the label fields the card resolves, with their dependencies.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Group } from 'three';
import { Placements, pointBinding } from '../../src/core/astrometrics/placements.js';
import { bindingEntity, bindingAttributes, bindingValue, labelSources, fieldNeedsUpdate } from '../../src/core/astrometrics/point-data.js';

const ent = (state, attributes = {}) => ({ entity_id: 'x.y', state, attributes });

test('pointBinding / bindingEntity: the object form, its entity or the point\'s', () => {
  assert.equal(pointBinding({ xyz: [1, 2, 3] }), null);
  assert.deepEqual(pointBinding({ latlon: { entity: 'person.a' } }), { form: 'latlon', binding: { entity: 'person.a' } });
  assert.equal(bindingEntity({ entity: 'device_tracker.b', latlon: {} }), 'device_tracker.b');
  assert.equal(bindingEntity({ entity: 'device_tracker.b', latlon: { entity: 'person.a' } }), 'person.a');
  assert.equal(bindingEntity({ latlon: {} }), null);
});

test('bindingAttributes: defaults per form, named keys, attribute lists', () => {
  assert.deepEqual(bindingAttributes('latlon', {}), ['latitude', 'longitude']);
  assert.deepEqual(bindingAttributes('altaz', {}), ['azimuth', 'elevation']);
  assert.deepEqual(bindingAttributes('altaz', { altitude: 'alt' }), ['azimuth', 'alt']);
  assert.deepEqual(bindingAttributes('xyz', { attributes: ['a', 'b'] }), ['a', 'b', 'z']);
  assert.deepEqual(bindingAttributes('polar', {}), ['distance', 'bearing']);
});

test('bindingValue: numbers (strings too, state by name), null while one is missing', () => {
  assert.deepEqual(bindingValue({ latlon: {} }, ent('home', { latitude: 51.5, longitude: '-0.1' })), { form: 'latlon', value: [51.5, -0.1] });
  assert.deepEqual(bindingValue({ polar: { attributes: ['state', 'b'] } }, ent('40', { b: 90 })), { form: 'polar', value: [40, 90] });
  assert.deepEqual(bindingValue({ latlon: {} }, ent('home', { latitude: 1 })), { form: 'latlon', value: null });
  assert.deepEqual(bindingValue({ latlon: {} }, ent('home', { latitude: 1, longitude: 'n/a' })), { form: 'latlon', value: null });
  assert.deepEqual(bindingValue({ latlon: {} }, null), { form: 'latlon', value: null });
  assert.equal(bindingValue({ xyz: [0, 0, 0] }, ent('on')), null);
});

test('Placements: a bound point waits (no position, dynamic), then setPosition places it; replaceDef moves it', () => {
  const places = new Placements({ points: [{ id: 's', xyz: { entity: 'sensor.a' } }, { id: 'f', at: 's' }, { id: 'k', xyz: [1, 0, 0] }], hosts: new Map([['g', { node: new Group() }]]) });
  assert.equal(places.get('s'), null);
  assert.equal(places.isDynamic('s'), true);
  assert.equal(places.isDynamic('f'), true, 'a point at a bound point moves too');
  assert.equal(places.isDynamic('k'), false);
  places.setPosition('s', 'xyz', [3, 4, 5]);
  assert.deepEqual(places.get('f')?.toArray(), [3, 4, 5]);
  places.setPosition('s', 'xyz', null);
  assert.equal(places.get('s'), null);
  places.replaceDef('k', { id: 'k', xyz: [9, 0, 0] });
  assert.deepEqual(places.get('k')?.toArray(), [9, 0, 0]);
});

test('labelSources: only labels with templates or state maps; dependencies per field', () => {
  const src = labelSources([
    { id: 'plain', xyz: [0, 0, 0], label: 'PLAIN', color: 'red' },
    { id: 'ent', entity: 'device_tracker.s', label: '{entity.state}', text: { sub: { content: '{{ states("sensor.t") }}' }, js: { content: '[[[ return 1 ]]]' } } },
    { id: 'col', entity: 'switch.l', label: 'L', color: { active: 'red', inactive: 'grey' } },
    { id: 'sky', label: 'LUNA {sky.moon.illumination}%' },
    { id: 'ds', label: '{ds:temp}' },
    { id: 'lit', label: '{entity.state}', text: { label: { template: false } } },
  ], {});
  assert.deepEqual(src.map((s) => s.id), ['ent', 'col', 'sky', 'ds']);
  const [ent, col, sky, ds] = src;
  assert.deepEqual([...ent.fields[0].deps.entities], ['device_tracker.s']);
  assert.deepEqual([...ent.fields[1].deps.entities], ['sensor.t']);
  assert.equal(ent.fields[2].deps.js, true);
  assert.equal(col.fields.length, 1, 'the point colour map reaches its label field');
  assert.deepEqual([...col.fields[0].deps.entities], ['switch.l']);
  assert.equal(sky.fields[0].deps.sky, true);
  assert.equal(ds.fields[0].deps.ds, true);
  // what a change re-evaluates
  const changed = new Set(['sensor.t']);
  assert.deepEqual(ent.fields.map((f) => fieldNeedsUpdate(f.deps, { entities: changed })), [false, true, true]);
  assert.equal(fieldNeedsUpdate(sky.fields[0].deps, { entities: changed }), false);
  assert.equal(fieldNeedsUpdate(sky.fields[0].deps, { sky: true }), true);
  assert.equal(fieldNeedsUpdate(ds.fields[0].deps, { ds: true }), true);
  assert.equal(fieldNeedsUpdate(col.fields[0].deps, { all: true }), true);
});
