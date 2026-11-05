/**
 * The Astrometrics Studio's preview tools (src/editor/dialogs/astro-studio/preview-tools.js):
 * measure text in the scope's units (and a second named unit), isolating one
 * object in the preview's config, quick view keys and the look cycle.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { measureText, isolateConfig, quickViewKeys, nextLook, QUICK_VIEWS } from '../../src/editor/dialogs/astro-studio/preview-tools.js';

test('measureText: scene units, named units with a second one that reads well', () => {
  assert.equal(measureText([0, 0, 0], [3, 4, 0], undefined), '5 scene units');
  assert.equal(measureText([0, 0, 0], [0, 0, 123.456], ''), '123 scene units');
  // the next smaller named unit
  assert.equal(measureText([0, 0, 0], [4.2, 0, 0], 'ly'), '4.2 ly (266,000 au)');
  assert.equal(measureText([0, 0, 0], [1, 0, 0], 'au'), '1 au (150 million km)');
  // none smaller (m is never the other): the next larger, when it reads well
  assert.equal(measureText([0, 0, 0], [2.5e9, 0, 0], 'km'), '2.5 billion km (16.7 au)');
  assert.equal(measureText([0, 0, 0], [384400, 0, 0], 'km'), '384,000 km');
  assert.equal(measureText([0, 0, 0], [500, 0, 0], 'm'), '500 m (0.5 km)');
  assert.equal(measureText([0, 0, 0], [1, 0, 0], 'pc'), '1 pc (3.26 ly)');
});

test('isolateConfig: every other object hidden, a system holding it kept, points kept', () => {
  const config = {
    points: [{ id: 'p', xyz: [0, 0, 0] }],
    objects: [
      { type: 'grid', shape: 'plane' },
      { type: 'sphere', id: 'planet' },
      { type: 'system', id: 'sol', objects: [{ type: 'sphere', id: 'sun' }, { type: 'ring' }] },
      { type: 'system', objects: [{ type: 'sphere', id: 'far' }] }
    ]
  };
  const one = isolateConfig(config, 'planet');
  assert.deepEqual(one.objects.map((o) => o.visible), [false, undefined, false, false]);
  assert.deepEqual(one.objects[2].objects.map((o) => o.visible), [false, false]);
  assert.deepEqual(one.points, config.points);
  // inside a system: the system stays, its other objects go
  const sun = isolateConfig(config, 'sun');
  assert.deepEqual(sun.objects.map((o) => o.visible), [false, false, undefined, false]);
  assert.deepEqual(sun.objects[2].objects.map((o) => o.visible), [undefined, false]);
  // by the scene's own names (type#n, system#n)
  assert.equal(isolateConfig(config, 'grid#1').objects[0].visible, undefined);
  assert.equal(isolateConfig(config, 'ring#1').objects[2].objects[1].visible, undefined);
  // a whole system: it and what it holds
  const sys = isolateConfig(config, 'sol');
  assert.equal(sys.objects[2].visible, undefined);
  assert.deepEqual(sys.objects[2].objects.map((o) => o.visible), [undefined, undefined]);
  // unknown: as it was; the config itself is not changed
  assert.equal(isolateConfig(config, 'nowhere'), config);
  assert.equal(config.objects[0].visible, undefined);
});

test('quickViewKeys and nextLook', () => {
  const now = { target: [1, 2, 3], distance: 50, fov: 40 };
  assert.deepEqual(QUICK_VIEWS.map((v) => v.name), ['top', 'front', 'side']);
  assert.deepEqual(quickViewKeys(0, now), { target: [1, 2, 3], distance: 50, fov: 40, yaw: 0, tilt: 90, projection: 'orthographic' });
  assert.equal(quickViewKeys(2, now).yaw, 90);
  assert.deepEqual([nextLook(null), nextLook('diagram'), nextLook('realistic'), nextLook('mixed')], ['diagram', 'realistic', 'mixed', null]);
});
