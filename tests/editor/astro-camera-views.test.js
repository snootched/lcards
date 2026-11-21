/**
 * The Astrometrics Studio's camera views (astro-studio/camera-views.js):
 * capture from the camera keys (target as a point id when the camera looks
 * at a point), order kept on every change, renames that follow fly-to
 * actions on this card only.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  pointAt, captureView, freshViewName, setView, deleteView, moveView, renameView, viewNameProblem, startViewName, viewSummary
} from '../../src/editor/dialogs/astro-studio/camera-views.js';

const keys = { target: [10, 0, -5], yaw: 30, tilt: 45, distance: 120, fov: 40, projection: 'perspective' };

test('capture: target as the point it sits on, else coordinates; fov and projection only when needed', () => {
  assert.deepEqual(captureView(keys, { sol: [10.05, 0, -5], far: [100, 0, 0] }), { target: 'sol', yaw: 30, tilt: 45, distance: 120 });
  assert.deepEqual(captureView(keys, { far: [100, 0, 0] }), { target: [10, 0, -5], yaw: 30, tilt: 45, distance: 120 });
  assert.equal(pointAt([0, 0, 0], { a: [0.09, 0, 0], b: [0.01, 0, 0] }), 'b');
  assert.equal(pointAt([0, 0, 0], { a: [0.2, 0, 0] }), null);
  assert.deepEqual(captureView({ ...keys, fov: 60 }, {}).fov, 60);
  assert.deepEqual(captureView({ ...keys, projection: 'orthographic' }, {}).projection, 'orthographic');
  // over a view: warp stays, an old fov is rewritten, an old orthographic goes when the camera is perspective
  assert.deepEqual(
    captureView(keys, {}, { target: 'x', warp: true, fov: 50, projection: 'orthographic' }),
    { warp: true, target: [10, 0, -5], yaw: 30, tilt: 45, distance: 120, fov: 40 }
  );
});

test('views keep their order through set, move and delete; camera.view follows', () => {
  const camera = { view: 'b', controls: false, views: { a: { yaw: 1 }, b: { yaw: 2 }, c: { yaw: 3 } } };
  assert.deepEqual(Object.keys(setView(camera, 'b', { yaw: 9 })?.views), ['a', 'b', 'c']);
  assert.deepEqual(Object.keys(setView(camera, 'view1', {})?.views), ['a', 'b', 'c', 'view1']);
  assert.deepEqual(Object.keys(moveView(camera, 'c', -1)?.views), ['a', 'c', 'b']);
  assert.deepEqual(Object.keys(moveView(camera, 'a', -1)?.views), ['a', 'b', 'c']);
  const gone = deleteView(camera, 'b');
  assert.deepEqual(gone, { controls: false, views: { a: { yaw: 1 }, c: { yaw: 3 } } });
  assert.equal(deleteView({ views: { a: {} } }, 'a'), undefined);
  assert.equal(startViewName(camera), 'b');
  assert.equal(startViewName({ view: 'gone', views: { a: {} } }), 'a');
  assert.equal(startViewName({}), undefined);
  assert.equal(freshViewName({ view1: {}, view2: {} }), 'view3');
});

test('rename: views key in place, camera.view, fly-to actions on this card (not another card\'s)', () => {
  const config = {
    camera: { view: 'map', views: { home: {}, map: { yaw: 1 }, end: {} } },
    points: [
      { id: 'p', tap_action: { action: 'fly-to', view: 'map' } },
      { id: 'q', tap_action: { action: 'fly-to', view: 'map', card: 'other' } }
    ],
    objects: [{ type: 'ring', hold_action: { action: 'fly-to', view: 'map' } }]
  };
  const next = renameView(config, 'map', 'chart');
  assert.deepEqual(Object.keys(next.camera.views), ['home', 'chart', 'end']);
  assert.equal(next.camera.view, 'chart');
  assert.equal(next.points[0].tap_action.view, 'chart');
  assert.equal(next.points[1].tap_action.view, 'map');
  assert.equal(next.objects[0].hold_action.view, 'chart');
  assert.equal(config.camera.view, 'map', 'the input is not changed');
  assert.equal(viewNameProblem(config.camera.views, 'home', 'map'), 'There is already a view named home.');
  assert.equal(viewNameProblem(config.camera.views, ' ', 'map'), 'A view needs a name.');
  assert.equal(viewNameProblem(config.camera.views, 'map', 'map'), null);
});

test('summary line', () => {
  assert.equal(viewSummary({ target: 'sol', yaw: 30.04, tilt: 45, distance: 120 }), 'at sol · yaw 30 · tilt 45 · distance 120');
  assert.equal(viewSummary({ target: [1.234, 0, 2], projection: 'orthographic' }), 'at 1.2, 0, 2 · flat');
});
