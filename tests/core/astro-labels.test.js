/**
 * Astrometrics label layout (layoutLabels in src/core/astrometrics/label-layer.js):
 * collision by priority then distance, the selected label first, level of
 * detail by min/max distance, distance fade, occlusion by spheres (and a
 * point never hidden by its own sphere), orthographic occlusion, picking.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { PerspectiveCamera, OrthographicCamera, Vector3 } from 'three';
import { layoutLabels, labelItem, pickLabel, labelBox } from '../../src/core/astrometrics/label-layer.js';

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

test('labelItem defaults: style priority, unknown style falls back to minor priority', () => {
  assert.equal(labelItem({ id: 't', style: 'title' }).priority, 100);
  assert.equal(labelItem({ id: 'm', marker: 'dot' }).style, 'minor');
  assert.equal(labelItem({ id: 'x', style: 'mine' }).priority, 40);
});

test('layoutLabels: the measured anchor (ax, ay) is the point inside the box', () => {
  const a = item('a', [0, 0, 0]);
  Object.assign(a, { w: 100, h: 20, ax: 10, ay: 10 });
  const b = item('b', [0, 0, 0]);
  Object.assign(b, { w: 100, h: 20, ax: 10, ay: 10, priority: 1 });
  layoutLabels([a, b], camera(), 800, 600);
  // both boxes start 10 px left of the point: they overlap, the lower priority is culled
  assert.equal(a.visible, true);
  assert.equal(b.reason, 'culled');
});

test('layoutLabels: an empty label (no marker, no text yet) is not laid out', () => {
  const a = item('a', [0, 0, 0], { empty: true });
  layoutLabels([a], camera(), 800, 600);
  assert.equal(a.visible, false);
  assert.equal(a.reason, 'off');
});

test('a label that would be culled is mirrored first: to the left of its point', () => {
  const right = (id, world, extra = {}) => Object.assign(item(id, world, extra), { w: 100, h: 20, ax: 5, ay: 10, fields: [{ name: 'label', position: 'center-right' }] });
  // px per scene unit along x for this camera
  const probe = right('p', [1, 0, 0]);
  const origin = right('o', [0, 0, 0]);
  layoutLabels([probe, origin], camera(), 800, 600);
  const pxPerUnit = probe.sx - origin.sx;
  const a = right('a', [0, 0, 0], { priority: 50 });
  // b's point 50 px left of a's: its text to the right runs into a, to the left it is free
  const b = right('b', [-50 / pxPerUnit, 0, 0], { priority: 10 });
  layoutLabels([a, b], camera(), 800, 600);
  assert.equal(a.flip, 0);
  assert.equal(b.visible, true, 'not culled');
  assert.equal(b.flip, 1, 'mirrored to the left of the point');
  assert.deepEqual(labelBox(b, 1).map(Math.round), [Math.round(b.sx - 95), Math.round(b.sy - 10), Math.round(b.sx + 5), Math.round(b.sy + 10)]);
  // a centred label cannot mirror: at a's point it is culled
  const c = Object.assign(item('c', [0, 0, 0], { priority: 1 }), { w: 40, h: 20, fields: [{ name: 'label', position: 'center' }] });
  layoutLabels([a, b, c], camera(), 800, 600);
  assert.equal(c.reason, 'culled');
});

test('a mirrored label goes back as configured once there is room to spare', () => {
  const lone = Object.assign(item('x', [0, 0, 0]), { w: 100, h: 20, ax: 5, ay: 10, flip: 1, fields: [{ name: 'label', position: 'center-right' }] });
  layoutLabels([lone], camera(), 800, 600);
  assert.equal(lone.flip, 0);
});

test('a label cut off by the card edge mirrors to stay on the card', () => {
  const at = (id, world) => Object.assign(item(id, world), { w: 100, h: 20, ax: 5, ay: 10, fields: [{ name: 'label', position: 'center-right' }] });
  const probe = at('p', [1, 0, 0]);
  const origin = at('o', [0, 0, 0]);
  layoutLabels([probe, origin], camera(), 800, 600);
  // the point 60 px from the right edge: its label (95 px right of it) would be cut off
  const near = at('n', [(800 - 60 - origin.sx) / (probe.sx - origin.sx), 0, 0]);
  layoutLabels([near], camera(), 800, 600);
  assert.equal(near.visible, true);
  assert.equal(near.flip, 1);
  assert.ok(labelBox(near, 1)[2] <= 800);
});

test('overlap: a label with nowhere to go is shown anyway instead of hidden', () => {
  const at = (id, extra) => Object.assign(item(id, [0, 0, 0], extra), { w: 40, h: 20, fields: [{ name: 'label', position: 'center' }] });
  const a = at('a', { priority: 50 });
  const b = at('b', { priority: 10, overlap: true });
  const c = at('c', { priority: 5 });
  layoutLabels([a, b, c], camera(), 800, 600);
  assert.equal(b.visible, true);
  assert.equal(b.reason, 'ok');
  assert.equal(c.reason, 'culled', 'labels without overlap still hide');
});
