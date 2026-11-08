/**
 * Rule condition editor round trip (D2 batch 5): a map_range_cond's comparison
 * (above, equals, ...) and clamp have no fields in the editor and were dropped
 * on save, so the rule matched differently after opening it in the editor.
 */
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { installJsdom } from '../helpers/jsdom-env.js';

let Editor, restore;
before(async () => {
    const env = installJsdom();
    restore = env.restore;
    for (const key of ['Document', 'ShadowRoot', 'Element', 'Node', 'CSSStyleSheet', 'MutationObserver', 'DocumentFragment', 'Event', 'CustomEvent']) {
        if (globalThis[key] === undefined && env.dom.window[key] !== undefined) globalThis[key] = env.dom.window[key];
    }
    const mod = await import('../../src/editor/components/dashboard/lcards-condition-group-editor.js');
    Editor = Object.values(mod).find((v) => typeof v === 'function' && v.prototype?._serializeCondition);
});
after(() => restore?.());

test('map_range_cond keeps its comparison and clamp through the editor', () => {
    const p = Editor.prototype;
    const original = { map_range_cond: { entity: 'sensor.power', input: [0, 5000], output: [0, 100], above: 80, clamp: false } };
    const back = p._serializeCondition.call(p, p._deserializeCondition.call(p, original));
    assert.deepEqual(back, original);
});
