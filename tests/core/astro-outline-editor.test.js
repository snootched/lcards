/**
 * The prism outline editor (UX1 P6d): inserting, removing and moving
 * corners, snapping, the snap step, and the handles over the scene.
 */
import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { installJsdom } from '../helpers/jsdom-env.js';

const env = installJsdom();
after(() => env.restore());
const { snapValue, snapCorner, insertCorner, removeCorner, moveCorner, edgeMiddles, outlineStep, createOutlineEditor, MIN_CORNERS } =
  await import('../../src/core/astrometrics/outline-editor.js');

/** @type {[number, number][]} */
const square = [[-5, -5], [5, -5], [5, 5], [-5, 5]];

test('corners: insert at an edge middle, remove (never under 3), move', () => {
  assert.deepEqual(insertCorner(square, 0), [[-5, -5], [0, -5], [5, -5], [5, 5], [-5, 5]]);
  // the closing edge, last corner to the first
  assert.deepEqual(insertCorner(square, 3), [[-5, -5], [5, -5], [5, 5], [-5, 5], [-5, 0]]);
  assert.deepEqual(removeCorner(square, 1), [[-5, -5], [5, 5], [-5, 5]]);
  const tri = removeCorner(square, 1);
  assert.equal(removeCorner(tri, 0), tri, `never under ${MIN_CORNERS}`);
  assert.deepEqual(moveCorner(square, 2, [7, 8]), [[-5, -5], [5, -5], [7, 8], [-5, 5]]);
  assert.deepEqual(edgeMiddles(square), [[0, -5], [5, 0], [0, 5], [-5, 0]]);
});

test('snapping: to the step on both axes, none at step 0; the step from the span', () => {
  assert.equal(snapValue(3.4, 2), 4);
  assert.equal(snapValue(0.31, 0.1), 0.3);
  assert.equal(snapValue(3.4, 0), 3.4);
  assert.deepEqual(snapCorner([3.4, -1.1], 1), [3, -1]);
  assert.equal(outlineStep(square), 0.5);
  assert.equal(outlineStep([[0, 0], [1000, 0], [0, 300]]), 50);
  assert.equal(outlineStep([]), 1);
});

test('handles: a corner and a + per edge, placed by project; drag snaps, Shift does not; + adds; Delete removes', () => {
  const wrap = document.createElement('div');
  document.body.append(wrap);
  wrap.getBoundingClientRect = () => /** @type {any} */ ({ left: 0, top: 0, width: 200, height: 200 });
  /** @type {{ outline: number[][], done: boolean }[]} */
  const changes = [];
  // screen = 10 px per unit round (100, 100)
  const ed = createOutlineEditor({
    wrap,
    project: (p) => ({ x: 100 + p[0] * 10, y: 100 + p[1] * 10 }),
    ground: (x, y) => [(x - 100) / 10, (y - 100) / 10],
    onChange: (outline, done) => changes.push({ outline: outline.map((p) => [...p]), done })
  });
  ed.set(square, { snap: 1 });
  const corners = () => [...wrap.querySelectorAll('button.corner')];
  const middles = () => [...wrap.querySelectorAll('button.middle')];
  assert.equal(corners().length, 4);
  assert.equal(middles().length, 4);
  assert.equal(/** @type {HTMLElement} */ (corners()[2]).style.left, '150px');
  // drag corner 2 to (7.3, 8.6): snapped to (7, 9) live, then done once
  const c = corners()[2];
  /** @param {string} type @param {number} x @param {number} y @param {boolean} [shift] */
  const ev = (type, x, y, shift = false) => Object.assign(new env.dom.window.MouseEvent(type, { clientX: x, clientY: y, button: 0, shiftKey: shift, bubbles: true }), { pointerId: 1 });
  c.dispatchEvent(ev('pointerdown', 150, 150));
  c.dispatchEvent(ev('pointermove', 173, 186));
  c.dispatchEvent(ev('pointerup', 173, 186));
  assert.deepEqual(changes.at(-2), { outline: [[-5, -5], [5, -5], [7, 9], [-5, 5]], done: false });
  assert.deepEqual(changes.at(-1), { outline: [[-5, -5], [5, -5], [7, 9], [-5, 5]], done: true });
  // Shift: no snapping
  const c2 = corners()[0];
  c2.dispatchEvent(ev('pointerdown', 50, 50));
  c2.dispatchEvent(ev('pointermove', 47, 52, true));
  c2.dispatchEvent(ev('pointerup', 47, 52, true));
  assert.deepEqual(changes.at(-1)?.outline[0], [-5.3, -4.8]);
  // + on the first edge: a corner between 1 and 2
  middles()[0].dispatchEvent(ev('pointerdown', 0, 0));
  assert.equal(changes.at(-1)?.outline.length, 5);
  assert.equal(corners().length, 5);
  assert.equal(ed.state().selected, 1);
  // Delete on the selected corner removes it
  corners()[1].dispatchEvent(new env.dom.window.KeyboardEvent('keydown', { key: 'Delete', bubbles: true }));
  assert.equal(changes.at(-1)?.outline.length, 4);
  ed.dispose();
  assert.equal(wrap.querySelector('.astro-outline'), null);
});

test('draw: taps add corners on the ground, the first corner closes at 3 or more', () => {
  const wrap = document.createElement('div');
  document.body.append(wrap);
  wrap.getBoundingClientRect = () => /** @type {any} */ ({ left: 0, top: 0, width: 200, height: 200 });
  /** @type {{ outline: number[][], done: boolean }[]} */
  const changes = [];
  const ed = createOutlineEditor({
    wrap,
    project: (p) => ({ x: 100 + p[0] * 10, y: 100 + p[1] * 10 }),
    ground: (x, y) => [(x - 100) / 10, (y - 100) / 10],
    onChange: (outline, done) => changes.push({ outline: outline.map((p) => [...p]), done })
  });
  ed.set(square, { snap: 1, draw: true });
  const layer = /** @type {HTMLElement} */ (wrap.querySelector('.astro-outline'));
  /** @param {EventTarget} t @param {number} x @param {number} y */
  const tap = (t, x, y) => t.dispatchEvent(Object.assign(new env.dom.window.MouseEvent('pointerdown', { clientX: x, clientY: y, button: 0, bubbles: true }), { pointerId: 1 }));
  tap(layer, 100, 100);
  tap(layer, 151, 100);
  assert.equal(ed.finish(), false, 'two corners do not close');
  tap(layer, 100, 149);
  assert.equal(changes.length, 0, 'nothing until it closes');
  tap(/** @type {HTMLElement} */ (wrap.querySelector('button.corner')), 100, 100);
  assert.deepEqual(changes.at(-1), { outline: [[0, 0], [5, 0], [0, 5]], done: true });
  assert.equal(ed.state().mode, 'edit');
  ed.dispose();
});
