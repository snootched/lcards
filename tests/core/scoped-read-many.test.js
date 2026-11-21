/**
 * Startup settings reads in one call per scope (HA-LCARS feedback, Fire HD 8
 * kiosk, 2026-11-18): the connection overlay read its 25 settings with one call
 * per key and scope (up to 75), and each one failing while Home Assistant was
 * starting logged a warning. readMany() reads the device and user records whole
 * and the global keys with lcards/storage/get_many (or per key on an older
 * integration), then picks each key's first value in scope order.
 */
import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { installJsdom } from '../helpers/jsdom-env.js';
import { createFakeHass } from '../helpers/fake-hass.js';
import { ScopedSettingsService } from '../../src/core/services/ScopedSettingsService.js';
import { IntegrationService } from '../../src/core/services/IntegrationService.js';

const STORE = {
    device: { a: 'from-device' },
    user: { a: 'from-user', b: 'from-user' },
    global: { a: 'from-global', b: 'from-global', c: 'from-global' },
};

/** @param {{ getMany?: boolean, failDevice?: boolean }} opts */
function setup({ getMany = true, failDevice = false } = {}) {
    const hass = createFakeHass({
        user: { id: 'u1', name: 'U', is_admin: false },
        replies: (/** @type {any} */ msg) => {
            if (msg.type === 'lcards/storage/device/get') return failDevice ? new Error('not ready') : { value: STORE.device };
            if (msg.type === 'lcards/storage/user/get') return { value: STORE.user };
            if (msg.type === 'lcards/storage/get_many') return { values: Object.fromEntries(msg.keys.map((/** @type {string} */ k) => [k, STORE.global[k] ?? null])) };
            if (msg.type === 'lcards/storage/get') return { value: STORE.global[msg.key] ?? null };
            return undefined;
        },
    });
    const integration = new IntegrationService();
    integration.available = true;
    integration.capabilities = new Set(['scoped_storage', ...(getMany ? ['storage_get_many'] : [])]);
    /** @type {any} */ (integration)._hass = hass;
    /** @type {any} */ (globalThis.window).lcards = { core: { integrationService: integration, deviceIdentityManager: { getDeviceId: () => 'dev1' } } };
    const sss = new ScopedSettingsService();
    sss.updateHass(hass);
    return { sss, sent: hass.connection.sent };
}

describe('ScopedSettingsService.readMany', () => {
    /** @type {() => void} */
    let restore;
    before(() => { restore = installJsdom().restore; });
    after(() => restore?.());

    it('one call per scope; each key takes its first value in device, user, global order', async () => {
        const { sss, sent } = setup();
        const out = await sss.readMany(['a', 'b', 'c', 'd']);
        assert.deepEqual(out, { a: 'from-device', b: 'from-user', c: 'from-global', d: null });
        assert.deepEqual(sent.map((m) => m.type).sort(), ['lcards/storage/device/get', 'lcards/storage/get_many', 'lcards/storage/user/get']);
    });

    it('an older integration without storage_get_many: global keys one by one', async () => {
        const { sss, sent } = setup({ getMany: false });
        const out = await sss.readMany(['b', 'c']);
        assert.deepEqual(out, { b: 'from-user', c: 'from-global' });
        assert.equal(sent.filter((m) => m.type === 'lcards/storage/get').length, 2);
    });

    it('a scope that fails reads as empty; the others still answer', async () => {
        const { sss } = setup({ failDevice: true });
        const out = await sss.readMany(['a']);
        assert.deepEqual(out, { a: 'from-user' });
    });
});
