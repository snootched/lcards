/**
 * The sound_scheme helper options sync settles quietly when there is nothing to
 * do (HA-LCARS feedback, Fire HD 8 kiosk, 2026-11-18): with no sound_scheme
 * helper, or as a non-admin, it retried 5 times with warnings and then logged
 * an error, on a dashboard that uses no sounds. Non-admins can't write the
 * helper's options anyway.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { SoundManager } from '../../src/core/sound/SoundManager.js';
import { lcardsLog } from '../../src/utils/lcards-logging.js';

/** A SoundManager on a fake helper manager; counts option writes and log lines. */
function setup({ helper, admin }) {
    const sm = new SoundManager();
    let writes = 0;
    const hass = {
        user: { is_admin: admin },
        states: {
            'light.x': { state: 'on', attributes: {} },
            ...(helper ? { 'input_select.lcards_sound_scheme': { state: 'none', attributes: { options: ['none'] } } } : {}),
        },
    };
    /** @type {any} */ (sm)._core = {
        helperManager: {
            hass,
            helperExists: () => helper,
            getHelperValue: () => (helper ? 'none' : null),
            updateSelectOptions: async () => { writes++; return { optionsUpdated: true, restored: true }; },
        },
    };
    return { sm, writes: () => writes };
}

/** Run fn, collecting warn and error log calls. */
async function quiet(fn) {
    const seen = [];
    const { warn, error } = lcardsLog;
    lcardsLog.warn = (...a) => { seen.push(['warn', ...a]); };
    lcardsLog.error = (...a) => { seen.push(['error', ...a]); };
    try { await fn(); } finally { lcardsLog.warn = warn; lcardsLog.error = error; }
    return seen;
}

test('no sound_scheme helper: settles at once, no write, no retry, no warnings', async () => {
    const { sm, writes } = setup({ helper: false, admin: true });
    const logs = await quiet(() => /** @type {any} */ (sm)._syncSchemeHelperOptions());
    assert.equal(writes(), 0);
    assert.equal(/** @type {any} */ (sm)._syncRetryScheduled, false);
    assert.deepEqual(logs, []);
    await /** @type {any} */ (sm).waitForSchemeSync();
});

test('a non-admin user does not write the helper options', async () => {
    const { sm, writes } = setup({ helper: true, admin: false });
    const logs = await quiet(() => /** @type {any} */ (sm)._syncSchemeHelperOptions());
    assert.equal(writes(), 0);
    assert.deepEqual(logs, []);
});

test('an admin with the helper still syncs it', async () => {
    const { sm, writes } = setup({ helper: true, admin: true });
    await /** @type {any} */ (sm)._syncSchemeHelperOptions();
    assert.equal(writes(), 1);
});
