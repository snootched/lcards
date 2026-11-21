/**
 * The slider editor drops range labels that aren't objects (older editors wrote
 * `label: ''` on new band ranges, which failed validation).
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { dropStrayRangeLabels } from '../../src/editor/utils/slider-config-cleanup.js';

test('empty-string and null labels are removed, object labels kept', () => {
    const config = Object.freeze({
        type: 'custom:lcards-slider',
        style: Object.freeze({
            ranges: Object.freeze([
                Object.freeze({ min: 0, max: 50, color: 'red', label: '' }),
                Object.freeze({ value: 40, label: Object.freeze({ text: 'SET' }) }),
                Object.freeze({ min: 50, max: 100, label: null }),
            ]),
        }),
    });
    const { config: out, changed } = dropStrayRangeLabels(config);
    assert.equal(changed, true);
    assert.deepEqual(out.style.ranges, [
        { min: 0, max: 50, color: 'red' },
        { value: 40, label: { text: 'SET' } },
        { min: 50, max: 100 },
    ]);
});

test('configs without stray labels come back unchanged (same object)', () => {
    const config = { style: { ranges: [{ min: 0, max: 10 }] } };
    assert.equal(dropStrayRangeLabels(config).config, config);
    assert.equal(dropStrayRangeLabels({}).changed, false);
});
