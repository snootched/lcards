/**
 * Astrometrics label layout (layoutLabels in src/core/astrometrics/label-layer.js):
 * collision by priority then distance, the selected label first, level of
 * detail by min/max distance, distance fade, occlusion by spheres (and a
 * point never hidden by its own sphere), orthographic occlusion, picking.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { PerspectiveCamera, OrthographicCamera, Vector3 } from 'three';
import { layoutLabels, labelItem, pickLabel } from '../../src/core/astrometrics/label-layer.js';

/** Camera at (0, 0, 100) looking at the origin, 800 x 600 */
function camera() {
  const c = new PerspectiveCamera(40, 800 / 600, 0.1, 5000);
  c.position.set(0, 0, 100);
  c.lookAt(0, 0, 0);
  c.updateMatrixWorld();
  c.updateProjectionMatrix();
  return c;
}

const item = (id, world, extra = {}) => Object.assign(labelItem({ id, text: id, ...extra }), { world: new Vector3(...world), w: 60, h: 14 });

test('projects to CSS px: the target lands in the middle', () => {
  const a = item('a', [0, 0, 0]);
  layoutLabels([a], camera(), 800, 600);
  assert.ok(a.visible);
  assert.ok(Math.abs(a.sx - 400) < 1e-6 && Math.abs(a.sy - 300) < 1e-6);
});

test('collision: higher priority wins; equal priority, the nearer wins; the selected one beats both', () => {
  const lo = item('lo', [0, 0, 0], { priority: 1 });
  const hi = item('hi', [0.5, 0, 0], { priority: 9 });
  layoutLabels([lo, hi], camera(), 800, 600);
  assert.equal(hi.visible, true);
  assert.equal(lo.visible, false);
  assert.equal(lo.reason, 'culled');

  const far = item('far', [0, 0, -20], { priority: 5 });
  const nearer = item('near', [0.4, 0, 10], { priority: 5 });
  layoutLabels([far, nearer], camera(), 800, 600);
  assert.equal(nearer.visible, true);
  assert.equal(far.visible, false);

  lo.selected = true;
  layoutLabels([lo, hi], camera(), 800, 600);
  assert.equal(lo.visible, true);
  assert.equal(hi.visible, false);
});

test('apart, both show', () => {
  const a = item('a', [-20, 0, 0]);
  const b = item('b', [20, 0, 0]);
  const r = layoutLabels([a, b], camera(), 800, 600);
  assert.deepEqual([a.visible, b.visible, r.visible], [true, true, 2]);
});

test('level of detail: max_distance hides far labels, min_distance hides near ones (10 % soft edge)', () => {
  const zoomedOut = item('a', [0, 0, 0], { maxDistance: 50 });
  layoutLabels([zoomedOut], camera(), 800, 600);
  assert.equal(zoomedOut.visible, false);
  assert.equal(zoomedOut.reason, 'range');
  const inside = item('b', [0, 0, 0], { maxDistance: 200 });
  layoutLabels([inside], camera(), 800, 600);
  assert.equal(inside.visible, true);
  assert.equal(inside.alpha, 1);
  const edge = item('c', [0, 0, 0], { maxDistance: 95 });
  layoutLabels([edge], camera(), 800, 600);
  assert.ok(edge.visible && edge.alpha > 0.4 && edge.alpha < 0.6, `alpha ${edge.alpha}`);
  const tooClose = item('d', [0, 0, 0], { minDistance: 150 });
  layoutLabels([tooClose], camera(), 800, 600);
  assert.equal(tooClose.visible, false);
});

test('fade: [near, far] distances', () => {
  const a = item('a', [0, 0, 0], { fade: [50, 150] });
  layoutLabels([a], camera(), 800, 600);
  assert.ok(Math.abs(a.alpha - 0.5) < 1e-9);
  const gone = item('b', [0, 0, 0], { fade: [10, 60] });
  layoutLabels([gone], camera(), 800, 600);
  assert.equal(gone.visible, false);
});

test('occlusion: a point behind a sphere hides, in front shows, its own sphere never hides it', () => {
  const planet = { center: new Vector3(0, 0, 0), radius: 10, id: 'planet' };
  const behind = item('behind', [0, 0, -10.5]);
  const front = item('front', [0, 0, 10.5]);
  const own = item('own', [0, 0, -10.5], { occluderSkip: 'planet' });
  const r = layoutLabels([behind, front, own], camera(), 800, 600, [planet]);
  assert.equal(behind.reason, 'occluded');
  assert.equal(front.visible, true);
  assert.notEqual(own.reason, 'occluded');
  assert.equal(r.occluded, 1);
  // Beside the sphere's limb, still visible
  const beside = item('beside', [11, 0, -5]);
  layoutLabels([beside], camera(), 800, 600, [planet]);
  assert.equal(beside.visible, true);
});

test('occlusion with an orthographic camera (parallel rays)', () => {
  const c = new OrthographicCamera(-80, 80, 60, -60, 0.1, 1000);
  c.position.set(0, 0, 500);
  c.lookAt(0, 0, 0);
  c.updateMatrixWorld();
  c.updateProjectionMatrix();
  const behind = item('behind', [0, 0, -10.5]);
  layoutLabels([behind], c, 800, 600, [{ center: new Vector3(), radius: 10, id: 'p' }]);
  assert.equal(behind.reason, 'occluded');
});

test('off screen and behind the camera: not shown; alphaScale 0 hides', () => {
  const back = item('back', [0, 0, 200]);
  const side = item('side', [500, 0, 0]);
  const dim = item('dim', [0, 0, 0]);
  dim.alphaScale = 0;
  layoutLabels([back, side, dim], camera(), 800, 600);
  assert.deepEqual([back.visible, side.visible, dim.visible], [false, false, false]);
});

test('pickLabel: nearest visible pickable within 18 px', () => {
  const a = item('a', [0, 0, 0], { pickable: true });
  const b = item('b', [20, 0, 0], { pickable: true });
  const c = item('c', [-20, 0, 0]);
  layoutLabels([a, b, c], camera(), 800, 600);
  assert.equal(pickLabel([a, b, c], 405, 302)?.id, 'a');
  assert.equal(pickLabel([a, b, c], c.sx, c.sy), null, 'not pickable');
  assert.equal(pickLabel([a, b, c], 10, 10), null);
});

test('labelItem defaults: style priority, anchor right with a marker, centre without', () => {
  const t = labelItem({ id: 't', style: 'title' });
  assert.equal(t.priority, 100);
  assert.equal(t.anchor, 'center');
  const m = labelItem({ id: 'm', marker: 'dot' });
  assert.equal(m.style, 'minor');
  assert.equal(m.anchor, 'right');
  assert.equal(labelItem({ id: 'x', style: /** @type {any} */ ('huge') }).style, 'minor');
});
