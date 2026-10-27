/**
 * Cards on astrometrics points (src/core/astrometrics/card-layer.js): the
 * point's `card` settings, where the card box goes round its point (kept in
 * the scene), anchor-only label items (a card point with no text is laid out
 * but takes no room from other labels), and the builder's label item for a
 * card point (tap cards make the point pickable).
 */
import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { PerspectiveCamera, Vector3 } from 'three';
import { installJsdom } from '../helpers/jsdom-env.js';

const env = installJsdom();
after(() => env.restore());
const { pointCard, cardBox } = await import('../../src/core/astrometrics/card-layer.js');
const { layoutLabels, labelItem } = await import('../../src/core/astrometrics/label-layer.js');
const { makeLabelItem } = await import('../../src/core/astrometrics/scene-builder.js');

function camera() {
  const c = new PerspectiveCamera(40, 800 / 600, 0.1, 5000);
  c.position.set(0, 0, 100);
  c.lookAt(0, 0, 0);
  c.updateMatrixWorld();
  c.updateProjectionMatrix();
  return c;
}

test('pointCard: defaults, aliases, and no card without a card config with a type', () => {
  const pc = pointCard({ id: 'a', card: { card: { type: 'tile', entity: 'light.x' } } });
  assert.deepEqual({ ...pc, card: undefined, key: undefined }, { id: 'a', show: 'tap', position: 'center-right', offset: [0, 0], width: 280, card: undefined, key: undefined });
  assert.equal(pointCard({ id: 'a', card: { show: 'always', position: 'top', width: 10, card: { type: 'x' } } })?.position, 'top-center');
  assert.equal(pointCard({ id: 'a', card: { show: 'always', width: 10, card: { type: 'x' } } })?.width, 80);
  assert.equal(pointCard({ id: 'a', card: { position: 'nowhere', card: { type: 'x' } } })?.position, 'center-right');
  assert.equal(pointCard({ id: 'a' }), null);
  assert.equal(pointCard({ id: 'a', card: { show: 'tap' } }), null);
  assert.equal(pointCard({ id: 'a', card: { card: { entity: 'light.x' } } }), null);
});

test('cardBox: beside the point on its side, offset, kept inside the scene', () => {
  const at = (/** @type {string} */ position, offset = /** @type {[number, number]} */ ([0, 0])) => cardBox({ position, offset }, 400, 300, 200, 100, 800, 600);
  assert.deepEqual(at('center-right'), [412, 250]);
  assert.deepEqual(at('center-left'), [188, 250]);
  assert.deepEqual(at('top-center'), [300, 188]);
  assert.deepEqual(at('bottom-right'), [412, 312]);
  assert.deepEqual(at('center-right', [10, -5]), [422, 245]);
  // near the right edge: pushed back in
  assert.deepEqual(cardBox({ position: 'center-right', offset: [0, 0] }, 780, 20, 200, 100, 800, 600), [596, 4]);
  // bigger than the scene: pinned to the top left edge
  assert.deepEqual(cardBox({ position: 'center', offset: [0, 0] }, 50, 50, 900, 700, 800, 600), [4, 4]);
});

test('anchor-only items are laid out (ok) and take no room: a label over the point still shows', () => {
  const card = Object.assign(labelItem({ id: 'card', anchor: true, empty: true }), { world: new Vector3(0, 0, 0) });
  const label = Object.assign(labelItem({ id: 'l', priority: 1 }), { world: new Vector3(0, 0, 0), w: 60, h: 14 });
  const hidden = Object.assign(labelItem({ id: 'h', empty: true }), { world: new Vector3(0, 0, 0) });
  layoutLabels([card, label, hidden], camera(), 800, 600);
  assert.equal(card.reason, 'ok');
  assert.ok(Math.abs(card.sx - 400) < 1e-6);
  assert.equal(label.visible, true);
  assert.equal(hidden.reason, 'off');
});

test('anchor-only items are still occluded and range-checked', () => {
  const behind = Object.assign(labelItem({ id: 'b', anchor: true, empty: true }), { world: new Vector3(0, 0, -50) });
  const far = Object.assign(labelItem({ id: 'f', anchor: true, empty: true, maxDistance: 10 }), { world: new Vector3(30, 0, 0) });
  layoutLabels([behind, far], camera(), 800, 600, [{ center: new Vector3(0, 0, 0), radius: 20, id: 's' }]);
  assert.equal(behind.reason, 'occluded');
  assert.equal(far.reason, 'range');
});

test('makeLabelItem: a card point with no text or marker gets an anchor item; a tap card makes it pickable', () => {
  const css = (/** @type {any} */ v, /** @type {string} */ f) => String(v ?? f);
  const tapCard = makeLabelItem({ id: 'p', card: { card: { type: 'tile' } } }, undefined, css);
  assert.ok(tapCard);
  assert.equal(tapCard.anchor, true);
  assert.equal(tapCard.pickable, true);
  const always = makeLabelItem({ id: 'p', card: { show: 'always', card: { type: 'tile' } }, tap_action: { action: 'none' } }, undefined, css);
  assert.equal(always?.pickable, false);
  assert.equal(makeLabelItem({ id: 'p' }, undefined, css), null);
  const plain = makeLabelItem({ id: 'p', label: 'P' }, undefined, css);
  assert.equal(plain?.anchor, false);
});
