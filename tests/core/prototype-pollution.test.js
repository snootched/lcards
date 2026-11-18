/**
 * Config merges never reach a prototype (CodeQL js/prototype-pollution-utility,
 * 2026-11-18). A card config parsed from JSON keeps `__proto__` as an own key;
 * deepMerge took it as a key, found Object.prototype under it (isPlain() accepts
 * it) and merged into it: every object on the page, for every viewer.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { deepMerge, deepMergeImmutable } from '../../src/utils/deepMerge.js';
import { deepMerge as configMerge, setNestedValue } from '../../src/core/config-manager/merge-helpers.js';

const evil = () => JSON.parse('{"__proto__": {"polluted": 1}, "constructor": {"prototype": {"polluted": 2}}, "style": {"color": "red"}}');

test('deepMerge and deepMergeImmutable skip __proto__, constructor and prototype', () => {
    const a = deepMerge({ style: { width: 2 } }, evil());
    const b = deepMergeImmutable({ style: { width: 2 } }, evil());
    assert.equal(/** @type {any} */ ({}).polluted, undefined);
    assert.deepEqual(a, { style: { width: 2, color: 'red' } });
    assert.deepEqual(b, { style: { width: 2, color: 'red' } });
    assert.equal(Object.getPrototypeOf(b), Object.prototype);
});

test('the config manager merge and setNestedValue skip them too', () => {
    const c = configMerge({ style: { width: 2 } }, evil());
    assert.equal(Object.getPrototypeOf(c), Object.prototype);
    assert.equal(/** @type {any} */ (c).polluted, undefined);
    const o = {};
    setNestedValue(o, '__proto__.polluted', 1);
    setNestedValue(o, 'constructor.prototype.polluted', 1);
    assert.equal(/** @type {any} */ ({}).polluted, undefined);
    setNestedValue(o, 'style.color', 'red');
    assert.deepEqual(o, { style: { color: 'red' } });
});
