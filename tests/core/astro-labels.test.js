/**
 * Astrometrics label layout (layoutLabels in src/core/astrometrics/label-layer.js):
 * collision by priority then distance, the selected label first, level of
 * detail by min/max distance, distance fade, occlusion by spheres (and a
 * point never hidden by its own sphere), orthographic occlusion, oriented
 * boxes, the depth image of meshes (models), picking, labels standing off
 * the object at their point (with a leader line).
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { PerspectiveCamera, OrthographicCamera, Vector3, Matrix4, Euler } from 'three';
import { layoutLabels, labelItem, pickLabel, labelBox, rayHitsBox, leaderLine, LEADER_PX } from '../../src/core/astrometrics/label-layer.js';
import { decodeViewDepth, depthNear } from '../../src/core/astrometrics/depth-occlusion.js';

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

test('pickLabel: a tap anywhere on the label\'s box (text and marker) picks it; nearest point wins', () => {
  const a = item('a', [0, 0, 0], { pickable: true });
  const b = item('b', [60, 0, 0], { pickable: true });
  layoutLabels([a, b], camera(), 800, 600);
  // a measured box: 100 x 20 with the point at its left middle (a label to the right of its marker)
  for (const it of [a, b]) Object.assign(it, { w: 100, h: 20, ax: 0, ay: 10, flip: 0 });
  assert.equal(pickLabel([a, b], a.sx + 80, a.sy + 5)?.id, 'a', 'on the text, far from the point');
  assert.equal(pickLabel([a], a.sx + 103, a.sy)?.id, 'a', 'a few px past the box still counts');
  assert.equal(pickLabel([a], a.sx + 110, a.sy), null, 'further is not');
  assert.equal(pickLabel([a, b], a.sx + 80, a.sy + 40), null, 'below the box');
  // mirrored: the box is on the other side of the point
  a.flip = 1;
  assert.equal(pickLabel([a], a.sx - 80, a.sy)?.id, 'a');
  assert.equal(pickLabel([a], a.sx + 80, a.sy), null);
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

test('box occluder: a point behind a turned box hides, beside it shows; a point on the box is never hidden by it', () => {
  // a 20 x 20 x 20 box at the origin, turned 45 degrees round y
  const world = new Matrix4().makeRotationFromEuler(new Euler(0, Math.PI / 4, 0));
  const box = { kind: /** @type {const} */ ('box'), inverse: world.clone().invert(), half: [10, 10, 10], id: 'cube' };
  const behind = item('behind', [0, 0, -30]);
  const beside = item('beside', [40, 0, -30]);
  const on = item('on', [0, 0, -9], { host: 'cube' });
  const r = layoutLabels([behind, beside, on], camera(), 800, 600, [box]);
  assert.equal(behind.reason, 'occluded');
  assert.notEqual(beside.reason, 'occluded');
  assert.notEqual(on.reason, 'occluded');
  assert.equal(r.occluded, 1);
  // the slab test itself: a turned box's corner sticks out past its half size
  assert.equal(rayHitsBox(new Vector3(13, 0, -30), new Vector3(0, 0, 1), 100, box.inverse, box.half), true);
  assert.equal(rayHitsBox(new Vector3(15, 0, -30), new Vector3(0, 0, 1), 100, box.inverse, box.half), false);
  // the segment stops at the camera: a box past it hides nothing
  assert.equal(rayHitsBox(new Vector3(0, 0, -30), new Vector3(0, 0, 1), 10, box.inverse, box.half), false);
});

/**
 * A fake depth image: 80 x 60 texels, a mesh covering the left half at view
 * depth `d` (nothing on the right).
 * @param {number} d
 * @param {number} far
 */
function depthImage(d, far) {
  const w = 80, h = 60;
  const data = new Uint8Array(w * h * 4);
  const x = Math.min(1 - 1 / 16777216, d / far);
  // the shader's packing, in JS
  let r = x, g = (x * 255) % 1, b = (x * 65025) % 1;
  r -= g / 255;
  g -= b / 255;
  for (let y = 0; y < h; y++) for (let i = 0; i < w / 2; i++) {
    const k = (y * w + i) * 4;
    data[k] = Math.round(r * 255);
    data[k + 1] = Math.round(g * 255);
    data[k + 2] = Math.round(b * 255);
    data[k + 3] = 255;
  }
  return { w, h, data, far };
}

test('depth occluder: decode round trip; behind the mesh hides, in front or where there is none shows; points on the model get its bias', () => {
  const snap = depthImage(90, 5000);
  assert.ok(Math.abs(decodeViewDepth(snap.data, 0, snap.far) - 90) < 0.01);
  assert.equal(decodeViewDepth(snap.data, (snap.w - 1) * 4, snap.far), Infinity);
  // the 3x3 window reaches over the edge; the texel alone does not
  assert.ok(Math.abs(depthNear(snap, 40.5 / 80, 0.5) - 90) < 0.01);
  assert.equal(depthNear(snap, 40.5 / 80, 0.5, 0), Infinity);

  const occ = { kind: /** @type {const} */ ('depth'), snapshot: snap, id: '', bias: (/** @type {string | null} */ host) => (host === 'ship' ? 4 : 0.1) };
  // the camera is at z = 100: view depth 90 is z = 10
  const behind = item('behind', [-10, 0, 0]);
  const front = item('front', [-10, 0, 20]);
  const right = item('right', [10, 0, 0]);
  const onShip = item('onShip', [-10, 0, 7], { host: 'ship' });
  const farSide = item('farSide', [-10, 0, 0], { host: 'ship' });
  layoutLabels([behind, front, right, onShip, farSide], camera(), 800, 600, [occ]);
  assert.equal(behind.reason, 'occluded');
  assert.notEqual(front.reason, 'occluded');
  assert.notEqual(right.reason, 'occluded');
  assert.notEqual(onShip.reason, 'occluded', '3 behind the surface, within its bias of 4');
  assert.equal(farSide.reason, 'occluded', '10 behind the surface');
});

test('an object at the point: the label stands off its edge on screen, with a leader from the edge; mirrored to the other side', () => {
  const cam = camera();
  // CSS px per world unit at distance 100 (fov 40, 600 px high)
  const ppu = 300 / (100 * Math.tan((20 * Math.PI) / 180));
  const ship = Object.assign(item('ship', [0, 0, 0], { clear: 5 }), { w: 80, h: 14, fields: [{ name: 'label', position: 'center' }] });
  layoutLabels([ship], cam, 800, 600);
  assert.ok(Math.abs(ship.reach - 5 * ppu) < 1e-6, `${ship.reach}`);
  assert.equal(ship.gap, ship.reach + LEADER_PX);
  // a centred label goes to the right of the object
  const [x0, y0, x1] = labelBox(ship, ship.flip);
  assert.ok(Math.abs(x0 - (400 + ship.gap)) < 1e-6);
  assert.ok(Math.abs(y0 - 293) < 1e-6, 'still centred on the point vertically');
  const line = leaderLine(ship, [x0, y0, x1, y0 + 14]);
  assert.ok(line);
  assert.ok(Math.abs(line[0] - (400 + ship.reach)) < 1e-6, 'starts at the edge');
  assert.ok(Math.abs(line[2] - LEADER_PX) < 1e-6);
  assert.ok(Math.abs(line[3]) < 1e-9, 'horizontal');
  // mirrored: the box to the left
  const [m0, , m1] = labelBox(ship, 1);
  assert.ok(Math.abs(m1 - (400 - ship.gap)) < 1e-6 && m0 < m1);
  // leader: false, or no object: no line, and no gap
  assert.equal(leaderLine({ ...ship, leader: false }, [x0, y0, x1, y0 + 14]), null);
  const bare = Object.assign(item('bare', [0, 0, 0]), { w: 80, h: 14 });
  layoutLabels([bare], cam, 800, 600);
  assert.equal(bare.gap, 0);
  assert.equal(labelBox(bare)[0], 360);
});

test('an object at the point: closer means a bigger gap, capped; a label beside the card edge mirrors to the other side of the object', () => {
  const near = Object.assign(item('near', [0, 0, 60], { clear: 5 }), { w: 80, h: 14, fields: [{ name: 'label', position: 'center' }] });
  const far = Object.assign(item('far', [0, 0, -100], { clear: 5 }), { w: 80, h: 14, fields: [{ name: 'label', position: 'center' }] });
  layoutLabels([near, far], camera(), 800, 600);
  assert.ok(near.reach > far.reach * 4);
  const huge = Object.assign(item('huge', [0, 0, 0], { clear: 500 }), { w: 80, h: 14, fields: [{ name: 'label', position: 'center' }] });
  layoutLabels([huge], camera(), 800, 600);
  assert.equal(huge.reach, 160);
  // near the right edge, a label to the right runs off: it goes left of the object
  const edge = Object.assign(item('edge', [40, 0, 0], { clear: 2 }), { w: 80, h: 14, fields: [{ name: 'label', position: 'center' }] });
  layoutLabels([edge], camera(), 800, 600);
  assert.equal(edge.flip, 1);
  assert.ok(labelBox(edge, edge.flip)[2] < edge.sx);
});

test('picking an object at the point: on the object or the label, pickable without a marker unless it has a tap_action of its own', () => {
  const ship = Object.assign(item('ship', [0, 0, 0], { clear: 5, pickableWithObject: true }), { w: 80, h: 14, fields: [{ name: 'label', position: 'center' }] });
  layoutLabels([ship], camera(), 800, 600);
  assert.ok(ship.reach > 30);
  assert.equal(pickLabel([ship], 400 + ship.reach - 2, 300)?.id, 'ship', 'on the hull, past the 18 px circle');
  assert.equal(pickLabel([ship], 400 + ship.gap + 40, 300)?.id, 'ship', 'on the label');
  assert.equal(pickLabel([ship], 400, 300 + ship.reach + 10), null);
  const own = { ...ship, pickableWithObject: false };
  assert.equal(pickLabel([own], 400, 300), null);
  const gone = { ...ship, clear: 0 };
  assert.equal(pickLabel([gone], 400, 300), null, 'no object at it: as before (no marker, not pickable)');
});

test('depth occluder: a point a model sits at is never hidden by that model (the bias by id)', () => {
  const snap = depthImage(90, 5000);
  const occ = { kind: /** @type {const} */ ('depth'), snapshot: snap, id: '', bias: (/** @type {string | null} */ host, /** @type {number} */ d, /** @type {string} */ id) => (id === 'seat' ? 12 : 0.1) };
  const seat = item('seat', [-10, 0, 0]);
  const other = item('other', [-10, 0, 0]);
  layoutLabels([seat, other], camera(), 800, 600, [occ]);
  assert.notEqual(seat.reason, 'occluded');
  assert.equal(other.reason, 'occluded');
});

test('a label crossing its range in one frame fades over time, and reports itself fading', () => {
  // (the scene builder turns a point's max_distance into the item's maxDistance)
  const it = Object.assign(item('far', [0, 0, 0]), { maxDistance: 50 });
  const cam = (/** @type {number} */ z) => { const c = new PerspectiveCamera(50, 800 / 600, 0.1, 1e6); c.position.set(0, 0, z); c.lookAt(0, 0, 0); c.updateMatrixWorld(); return c; };
  layoutLabels([it], cam(20), 800, 600, [], 16);
  assert.equal(it.visible, true);
  const s = layoutLabels([it], cam(5000), 800, 600, [], 100);
  assert.equal(it.visible, true);
  assert.ok(it.alpha < 1 && it.alpha > 0.5, `${it.alpha}`);
  assert.equal(s.fading, 1);
  for (let i = 0; i < 5; i++) layoutLabels([it], cam(5000), 800, 600, [], 100);
  assert.equal(it.visible, false);
  assert.equal(it.reason, 'range');
});
