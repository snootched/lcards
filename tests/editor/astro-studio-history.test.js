/**
 * The Astrometrics Studio's undo and redo (astro-studio/history.js): steps
 * go back and forth, a new commit drops the redo steps, commits to the same
 * paths within the window merge (typing in one field is one step), a `step`
 * commit never merges, and the history keeps at most `limit` steps.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHistory, changedPaths, COALESCE_MS } from '../../src/editor/dialogs/astro-studio/history.js';

/** A history on a clock the test moves */
function clocked(opts = {}) {
  let t = 0;
  const history = createHistory({ ...opts, now: () => t });
  return { history, tick: (ms) => { t += ms; } };
}

test('changedPaths names the leaves that differ, and a list that changed length once', () => {
  assert.deepEqual(changedPaths({ a: 1, b: { c: 2 } }, { a: 1, b: { c: 3 } }), ['b.c']);
  assert.deepEqual(changedPaths({ objects: [{ r: 1 }, { r: 2 }] }, { objects: [{ r: 1 }, { r: 5 }] }), ['objects.1.r']);
  assert.deepEqual(changedPaths({ objects: [1] }, { objects: [1, 2] }), ['objects']);
  assert.deepEqual(changedPaths({ a: 1 }, { a: 1, b: 2 }), ['b']);
  assert.deepEqual(changedPaths({ a: [1, 2] }, { a: [1, 2] }), []);
});

test('undo and redo walk the steps; a new commit drops the redo steps', () => {
  const { history, tick } = clocked();
  const c0 = { a: 0 }, c1 = { a: 1 }, c2 = { a: 1, b: 2 };
  history.push(c0, c1); tick(COALESCE_MS * 2);
  history.push(c1, c2);
  assert.ok(history.canUndo);
  assert.ok(!history.canRedo);
  assert.deepEqual(history.undo(c2), c1);
  assert.deepEqual(history.undo(c1), c0);
  assert.equal(history.undo(c0), null);
  assert.deepEqual(history.redo(c0), c1);
  assert.ok(history.canRedo);
  history.push(c1, { a: 9 });
  assert.ok(!history.canRedo);
  assert.equal(history.redo({ a: 9 }), null);
});

test('commits to the same paths inside the window are one step; other paths or a pause are new steps', () => {
  const { history, tick } = clocked();
  history.push({ r: 1 }, { r: 12 }); tick(100);
  history.push({ r: 12 }, { r: 123 }); tick(100);
  history.push({ r: 123 }, { r: 1234 });
  assert.deepEqual(history.undo({ r: 1234 }), { r: 1 });
  assert.ok(!history.canUndo);

  history.clear();
  history.push({ r: 1, s: 1 }, { r: 2, s: 1 }); tick(100);
  history.push({ r: 2, s: 1 }, { r: 2, s: 2 });
  assert.deepEqual(history.undo({ r: 2, s: 2 }), { r: 2, s: 1 });

  history.clear();
  history.push({ r: 1 }, { r: 2 }); tick(COALESCE_MS + 1);
  history.push({ r: 2 }, { r: 3 });
  assert.deepEqual(history.undo({ r: 3 }), { r: 2 });
});

test('a step commit never merges, and after an undo the next commit is its own step', () => {
  const { history, tick } = clocked();
  history.push({ r: 1 }, { r: 2 }, { step: true }); tick(10);
  history.push({ r: 2 }, { r: 3 }, { step: true });
  assert.deepEqual(history.undo({ r: 3 }), { r: 2 });

  history.clear();
  history.push({ r: 1 }, { r: 2 }); tick(10);
  history.undo({ r: 2 });
  history.push({ r: 1 }, { r: 5 });
  history.push({ r: 5 }, { r: 6 });
  assert.deepEqual(history.undo({ r: 6 }), { r: 1 });
});

test('no change is no step, and the history keeps at most limit steps', () => {
  const { history, tick } = clocked({ limit: 3 });
  history.push({ a: 1 }, { a: 1 });
  assert.ok(!history.canUndo);
  for (let i = 0; i < 5; i++) { history.push({ a: i }, { a: i + 1 }, { step: true }); tick(10); }
  let c = { a: 5 }, n = 0;
  for (let prev; (prev = history.undo(c)); n++) c = prev;
  assert.equal(n, 3);
  assert.deepEqual(c, { a: 2 });
});
