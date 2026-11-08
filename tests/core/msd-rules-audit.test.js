/**
 * MSD rule bugs from the D2 batch 5 (core) docs audit:
 *  - a control overlay's tags never reached the hosted card, so tag:<name>
 *    rules missed it
 *  - several rules patching one line or shape: the lowest-priority patch
 *    replaced the rest (other cards merge, highest priority winning)
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { installJsdom } from '../helpers/jsdom-env.js';

installJsdom();
const { MsdControlsRenderer } = await import('../../src/msd/controls/MsdControlsRenderer.js');
const { mergeOverlayPatches } = await import('../../src/core/rules/merge-patches.js');

test('a control overlay\'s tags reach the hosted LCARdS card (merged with its own)', () => {
  const build = (card, tags) => MsdControlsRenderer.prototype._buildCardConfig.call(Object.create(MsdControlsRenderer.prototype), card, 'ov1', tags);
  const cfg = build({ type: 'custom:lcards-button', tags: ['own', 'power'] }, ['power', 'deck']);
  assert.deepEqual(cfg.tags, ['own', 'power', 'deck']);
  assert.equal(cfg.id, 'ov1');
  assert.equal(build({ type: 'entities', entities: [] }, ['power']).tags, undefined, 'only LCARdS cards take tags');
});

test('MSD overlay patches: highest priority wins, patches to different keys combine', () => {
  // RulesEngine hands them highest priority first
  const merged = mergeOverlayPatches([
    { id: 'line_a', style: { color: 'red' } },
    { id: 'line_a', style: { color: 'blue', width: 6 } },
    { id: 'shape_b', style: { fill: 'x' } },
  ]);
  assert.deepEqual(merged.line_a.style, { color: 'red', width: 6 });
  assert.deepEqual(merged.shape_b.style, { fill: 'x' });
});
