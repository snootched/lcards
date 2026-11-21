/**
 * ComponentManager type groups (D3b A3): re-registering a name under another
 * type moves it to the new group instead of leaving it listed under both.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ComponentManager } from '../../src/core/components/ComponentManager.js';

const comp = (/** @type {string} */ type) => ({ metadata: { type }, render: () => '' });

test('re-registering a name under a new type moves it to the new group', () => {
    const cm = new ComponentManager();
    cm.registerComponent('thing', comp('slider'));
    cm.registerComponent('other', comp('slider'));
    cm.registerComponent('thing', comp('button'));
    assert.deepEqual(cm.getComponentsByType('slider'), ['other']);
    assert.deepEqual(cm.getComponentsByType('button'), ['thing']);
    assert.equal(cm.getComponent('thing').metadata.type, 'button');
});

test('a type group emptied by a move is dropped from getComponentTypes', () => {
    const cm = new ComponentManager();
    cm.registerComponent('thing', comp('slider'));
    cm.registerComponent('thing', comp('button'));
    assert.deepEqual(cm.getComponentTypes(), ['button']);
});

test('re-registering under the same type replaces the entry in place', () => {
    const cm = new ComponentManager();
    const second = comp('slider');
    cm.registerComponent('thing', comp('slider'));
    cm.registerComponent('thing', second);
    assert.deepEqual(cm.getComponentsByType('slider'), ['thing']);
    assert.equal(cm.componentsByType.get('slider')?.get('thing'), second);
});
