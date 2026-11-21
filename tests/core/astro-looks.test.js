/**
 * Looks (looks.js): the card's diagram / realistic / mixed look, which
 * objects and points each shows, and the crossfade between them.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseLook, lookTargets, stepLook, lookAlpha, partWeights, switchesParts, LOOK_FADE_MS } from '../../src/core/astrometrics/looks.js';

test('parseLook: the three looks in any case, else null', () => {
  assert.equal(parseLook('diagram'), 'diagram');
  assert.equal(parseLook(' REALISTIC '), 'realistic');
  assert.equal(parseLook('Mixed'), 'mixed');
  assert.equal(parseLook('both'), null);
  assert.equal(parseLook(undefined), null);
  assert.equal(parseLook({ entity: 'input_select.look' }), null);
});

test('each look shows its own objects, mixed both, and objects without a look always', () => {
  const diagram = { look: 'diagram' };
  const realistic = { look: 'realistic' };
  const any = {};
  for (const [look, d, r] of [['diagram', 1, 0], ['realistic', 0, 1], ['mixed', 1, 1]]) {
    const w = lookTargets(/** @type {any} */ (look));
    assert.deepEqual([lookAlpha(diagram, w), lookAlpha(realistic, w), lookAlpha(any, w)], [d, r, 1], look);
  }
});

test('stepLook crossfades over LOOK_FADE_MS, and at once with no fade', () => {
  const w = lookTargets('diagram');
  const to = lookTargets('realistic');
  assert.equal(stepLook(w, to, LOOK_FADE_MS / 2), true);
  assert.deepEqual(w, { diagram: 0.5, realistic: 0.5 });
  assert.equal(stepLook(w, to, LOOK_FADE_MS), false);
  assert.deepEqual(w, to);
  const v = lookTargets('diagram');
  assert.equal(stepLook(v, to, 16, 0), false);
  assert.deepEqual(v, to);
});

test('part weights: diagram and realistic parts show in their look and in mixed; the stand-ins only in their own look', () => {
  assert.deepEqual(partWeights(lookTargets('diagram')), { diagram: 1, realistic: 0, diagramOnly: 1, realisticOnly: 0 });
  assert.deepEqual(partWeights(lookTargets('realistic')), { diagram: 0, realistic: 1, diagramOnly: 0, realisticOnly: 1 });
  assert.deepEqual(partWeights(lookTargets('mixed')), { diagram: 1, realistic: 1, diagramOnly: 0, realisticOnly: 0 });
  // halfway from diagram to realistic: the plain body fades out as the map fades in
  assert.deepEqual(partWeights({ diagram: 0.5, realistic: 0.5 }), { diagram: 0.5, realistic: 0.5, diagramOnly: 0.25, realisticOnly: 0.25 });
});

test('only objects without a look of their own switch their parts (all keeps the whole object)', () => {
  assert.equal(switchesParts({}), true);
  assert.equal(switchesParts({ look: 'all' }), false);
  assert.equal(switchesParts({ look: 'diagram' }), false);
  assert.equal(lookAlpha({ look: 'all' }, lookTargets('diagram')), 1);
});
