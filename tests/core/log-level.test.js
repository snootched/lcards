/**
 * Log level 'off' (D2 batch 6): the integration offers it, but the browser
 * logger did not know it and fell back to info.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { lcardsLog, lcardsSetGlobalLogLevel, lcardsGetGlobalLogLevel } from '../../src/utils/lcards-logging.js';

test('off is a level: nothing is logged, not even errors', () => {
    const seen = [];
    const orig = { error: console.error, warn: console.warn, log: console.log, info: console.info, debug: console.debug };
    for (const k of Object.keys(orig)) console[k] = (...a) => seen.push(a.join(' '));
    try {
        lcardsSetGlobalLogLevel('off');
        assert.equal(lcardsGetGlobalLogLevel(), 'off');
        seen.length = 0; // setting the level confirms it in the console
        lcardsLog.error('[Test] should not show');
        lcardsLog.warn('[Test] should not show');
        assert.deepEqual(seen, []);
        lcardsSetGlobalLogLevel('error');
        seen.length = 0;
        lcardsLog.error('[Test] shows');
        assert.equal(seen.length, 1);
    } finally {
        Object.assign(console, orig);
        lcardsSetGlobalLogLevel('info');
    }
});
