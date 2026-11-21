/**
 * The Astrometrics Studio's star systems (src/editor/dialogs/astro-studio/systems.js):
 * the Points and Objects tabs edit the scene's lists or one system's, ids
 * match what the scene names objects without one, and new ids are card-wide.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  SCENE_SCOPE, scopeSystem, validScope, scopedList, setScopedList, sceneObjectIds, scopedObjectIds,
  pointScope, objectScope, allPointIds, allObjectIds, pointsEditorConfig
} from '../../src/editor/dialogs/astro-studio/systems.js';
import { flattenSystems } from '../../src/core/astrometrics/names.js';

const config = () => ({
  units: 'ly',
  points: [{ id: 'core', xyz: [0, 0, 0] }, { id: 'sol', xyz: [26000, 0, 0] }],
  objects: [
    { type: 'grid', shape: 'disc' },
    {
      type: 'system', at: 'sol', units: 'km',
      points: [{ id: 'sun', xyz: [0, 0, 0] }, { id: 'earth', polar: [149597870, 0] }],
      objects: [{ type: 'sphere', at: 'sun' }, { type: 'grid' }, { type: 'sphere', id: 'luna' }]
    },
    { type: 'sphere' },
    { type: 'system', id: 'alpha', at: 'core', points: [{ id: 'a1', xyz: [1, 0, 0] }] }
  ]
});

test('scopes: the scene, a system, and a scope that is not a system any more', () => {
  const c = config();
  assert.equal(scopeSystem(c, SCENE_SCOPE), null);
  assert.equal(scopeSystem(c, 1)?.at, 'sol');
  assert.equal(scopeSystem(c, 0), null, 'a grid is not a system');
  assert.equal(validScope(c, 1), 1);
  assert.equal(validScope(c, 2), SCENE_SCOPE);
  assert.equal(validScope(c, 9), SCENE_SCOPE);
  assert.deepEqual(scopedList(c, SCENE_SCOPE, 'points').map((p) => p.id), ['core', 'sol']);
  assert.deepEqual(scopedList(c, 1, 'points').map((p) => p.id), ['sun', 'earth']);
  assert.equal(scopedList(c, 3, 'objects').length, 0);
});

test('setScopedList writes into the open system and leaves the rest alone', () => {
  const c = config();
  const next = setScopedList(c, 1, 'points', [{ id: 'sun', xyz: [0, 0, 0] }]);
  assert.deepEqual(next.objects[1].points, [{ id: 'sun', xyz: [0, 0, 0] }]);
  assert.equal(next.objects[1].units, 'km');
  assert.equal(next.objects[0], c.objects[0]);
  assert.equal(next.points, c.points);
  assert.equal(c.objects[1].points.length, 2, 'not mutated');
  // an empty system list goes; the scene keeps points: []
  assert.equal('objects' in setScopedList(c, 1, 'objects', []).objects[1], false);
  assert.deepEqual(setScopedList(c, SCENE_SCOPE, 'points', []).points, []);
  assert.equal('objects' in setScopedList(c, SCENE_SCOPE, 'objects', undefined), false);
});

test('object ids match the scene: type#n counted over the flattened list, system#n for systems', () => {
  const c = config();
  const ids = sceneObjectIds(c);
  assert.deepEqual(ids.scene, ['grid#1', 'system#1', 'sphere#3', 'alpha']);
  assert.deepEqual(ids.systems.get(1), ['sphere#1', 'grid#2', 'luna']);
  assert.deepEqual(scopedObjectIds(c, 1), ['sphere#1', 'grid#2', 'luna']);
  // the scene builder's own naming over the flattened config
  /** @type {Record<string, number>} */
  const counts = {};
  const built = flattenSystems(c).objects.map((/** @type {any} */ o) => {
    counts[o.type] = (counts[o.type] ?? 0) + 1;
    return o.id ?? `${o.type}#${counts[o.type]}`;
  });
  assert.deepEqual([...built].sort(), [...ids.scene, ...ids.systems.get(1), ...ids.systems.get(3)].sort());
  assert.deepEqual(objectScope(c, 'grid#2'), { scope: 1, index: 1 });
  assert.deepEqual(objectScope(c, 'sphere#3'), { scope: SCENE_SCOPE, index: 2 });
  assert.equal(objectScope(c, 'nope'), null);
  assert.equal(allObjectIds(c).length, 7);
});

test('points: where each one is, card-wide ids, and the points editor config in a system', () => {
  const c = config();
  assert.equal(pointScope(c, 'sol'), SCENE_SCOPE);
  assert.equal(pointScope(c, 'earth'), 1);
  assert.equal(pointScope(c, 'a1'), 3);
  assert.equal(pointScope(c, 'nope'), null);
  assert.deepEqual(allPointIds(c), ['core', 'sol', 'sun', 'earth', 'a1']);
  assert.equal(pointsEditorConfig(c, SCENE_SCOPE), c);
  const pe = pointsEditorConfig(c, 1);
  assert.deepEqual(pe.points.map((/** @type {any} */ p) => p.id), ['sun', 'earth']);
  // every object on the card to stand on
  assert.equal(pe.objects.length, 7);
  assert.ok(pe.objects.some((/** @type {any} */ o) => o.id === 'luna'));
});
