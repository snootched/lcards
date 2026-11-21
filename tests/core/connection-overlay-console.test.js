/**
 * P5 (D3d): the window.lcards.connectionOverlay console shims saved and
 * cleared at the 'global' scope by default, which the backend refuses for a
 * non-admin. With no scope given they now use defaultSettingsScope(hass):
 * global for an administrator, the user's own scope otherwise. An explicit
 * scope is passed through.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createConnectionOverlayConsoleApi } from '../../src/core/services/connection-overlay-console.js';

function setup(/** @type {any} */ user) {
    /** @type {any[]} */
    const calls = [];
    const service = {
        saveConfig: async (/** @type {any[]} */ ...a) => { calls.push(['save', ...a]); return true; },
        clearConfig: async (/** @type {any[]} */ ...a) => { calls.push(['clear', ...a]); return true; },
    };
    const core = { connectionOverlayService: service, _currentHass: user === undefined ? undefined : { user } };
    return { api: createConnectionOverlayConsoleApi(() => core), calls };
}

test('no scope: an admin saves and clears global', async () => {
    const { api, calls } = setup({ is_admin: true });
    assert.equal(await api.saveConfig({ enabled: true }), true);
    assert.equal(await api.clearConfig(), true);
    assert.deepEqual(calls, [['save', { enabled: true }, 'global', {}], ['clear', 'global', {}]]);
});

test('no scope: a non-admin (or no hass yet) uses the user scope', async () => {
    for (const user of [{ is_admin: false }, undefined]) {
        const { api, calls } = setup(user);
        await api.saveConfig({ enabled: true });
        await api.clearConfig();
        assert.deepEqual(calls, [['save', { enabled: true }, 'user', {}], ['clear', 'user', {}]]);
    }
});

test('an explicit scope is kept; no service resolves false', async () => {
    const { api, calls } = setup({ is_admin: false });
    await api.saveConfig({ a: 1 }, 'device');
    await api.clearConfig('global');
    assert.deepEqual(calls, [['save', { a: 1 }, 'device', {}], ['clear', 'global', {}]]);
    const bare = createConnectionOverlayConsoleApi(() => undefined);
    assert.equal(await bare.saveConfig({}), false);
    assert.equal(await bare.clearConfig(), false);
    assert.equal(await bare.loadConfig(), null);
    assert.equal(bare.getConfig(), null);
});
