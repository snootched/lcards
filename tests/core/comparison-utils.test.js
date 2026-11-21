/**
 * comparison-utils: the four threshold operators, between, and AND-ed bounds.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { compareThreshold, compareBetween, compareNumericBounds } from '../../src/utils/comparison-utils.js';

test('compareThreshold: every op below, at and above the threshold', () => {
    // op: [below 10, at 10, above 10]
    const cases = {
        above:    [false, false, true],
        at_least: [false, true,  true],
        below:    [true,  false, false],
        at_most:  [true,  true,  false],
    };
    for (const [op, expected] of Object.entries(cases)) {
        assert.deepEqual([9, 10, 11].map(v => compareThreshold(v, op, 10)), expected, op);
    }
});

test('compareThreshold: negatives, fractions, unknown op', () => {
    assert.equal(compareThreshold(-5, 'below', -4.5), true);
    assert.equal(compareThreshold(-4.5, 'at_most', -4.5), true);
    assert.equal(compareThreshold(0.1 + 0.2, 'above', 0.3), true); // float: 0.30000000000000004
    assert.equal(compareThreshold(10, 'equals', 10), false);
    assert.equal(compareThreshold(10, undefined, 10), false);
});

test('compareBetween: inclusive by default, exclusive on request', () => {
    const cases = [
        // value, inclusive, exclusive
        [9,  false, false],
        [10, true,  false],
        [15, true,  true],
        [20, true,  false],
        [21, false, false],
    ];
    for (const [v, inc, exc] of cases) {
        assert.equal(compareBetween(v, 10, 20), inc, `inclusive ${v}`);
        assert.equal(compareBetween(v, 10, 20, true), exc, `exclusive ${v}`);
    }
    // Inverted bounds never match.
    assert.equal(compareBetween(15, 20, 10), false);
});

test('compareNumericBounds: every present bound must hold', () => {
    const range = { at_least: 20, at_most: 80 };
    assert.equal(compareNumericBounds(19, range), false);
    assert.equal(compareNumericBounds(20, range), true);
    assert.equal(compareNumericBounds(80, range), true);
    assert.equal(compareNumericBounds(81, range), false);
    assert.equal(compareNumericBounds(50, { above: 49, below: 51 }), true);
    assert.equal(compareNumericBounds(51, { above: 49, below: 51 }), false);
});

test('compareNumericBounds: numeric strings coerce; non-numeric and empty values fail', () => {
    assert.equal(compareNumericBounds('42', { above: '40' }), true);
    assert.equal(compareNumericBounds('unavailable', { above: 0 }), false);
    assert.equal(compareNumericBounds(NaN, {}), false);
    assert.equal(compareNumericBounds(Infinity, { above: 0 }), false);
    // Number(null) and Number('') are 0, so they pass as zero (current behaviour).
    assert.equal(compareNumericBounds(null, { at_least: 0 }), true);
    assert.equal(compareNumericBounds('', { at_most: 0 }), true);
    // No bounds: any finite number passes.
    assert.equal(compareNumericBounds(7, {}), true);
});
