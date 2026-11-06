/**
 * isPositionEnum (src/utils/schema-helpers.js) picks the 9-point position picker in
 * FormField. It took any enum with a hyphenated value, so the alert overlay's
 * dismiss_mode (auto-dismiss), tap actions (call-service), blend modes (hard-light),
 * presets and elbow types got the picker (found 2026-11-06 in the Alert Studio).
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { isPositionEnum } from '../../src/utils/schema-helpers.js';
import { getSchemaEntries } from '../../scripts/lib/card-schemas.js';

test('position enums get the picker; other hyphenated enums do not', () => {
    assert.equal(isPositionEnum({ enum: ['top-left', 'center', 'bottom-right'] }), true);
    assert.equal(isPositionEnum({ enum: ['top-left', 'middle-left', 'center'] }), true);
    assert.equal(isPositionEnum({ enum: ['top', 'bottom', 'left', 'right'] }), false, 'cardinal only: a plain select');
    assert.equal(isPositionEnum({ enum: ['dismiss', 'reset', 'auto-dismiss', 'auto-reset'] }), false);
    assert.equal(isPositionEnum({ enum: ['toggle', 'call-service', 'none'] }), false);
    assert.equal(isPositionEnum({ enum: ['normal', 'hard-light'] }), false);
});

test('in the card schemas, only position keys get the picker', () => {
    /** @type {string[]} */
    const found = [];
    const walk = (/** @type {any} */ n, /** @type {string} */ p) => {
        if (!n || typeof n !== 'object') return;
        if (Array.isArray(n)) return n.forEach((x) => walk(x, p));
        if (Array.isArray(n.enum) && isPositionEnum(n)) found.push(p.split('.').filter((k) => k !== 'properties').pop() ?? p);
        for (const [k, v] of Object.entries(n)) walk(v, `${p}.${k}`);
    };
    for (const e of getSchemaEntries()) walk(e.schema, e.tag);
    assert.deepEqual([...new Set(found)].sort(), ['anchor', 'attachment', 'position', 'position_side']);
});
