/**
 * A device record's owner is the user signed in on that browser (D3c). When
 * another user signs in on it, their first device/get is refused; the
 * heartbeat then writes (which makes them the owner), reads the record again
 * and keeps the stored display name instead of the seeded one.
 */
import { test, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { DeviceIdentityManager } from '../../src/core/services/DeviceIdentityManager.js';

const realLcards = globalThis.window.lcards;
afterEach(() => { globalThis.window.lcards = realLcards; });

/** A backend whose device record is owned by `owner`; device/set by the caller takes it over. */
function fakeBackend(owner, record) {
    const sent = [];
    const state = { owner, record: { ...record } };
    const connection = {
        sendMessagePromise: async (/** @type {any} */ m) => {
            sent.push(m.type);
            if (m.type === 'lcards/storage/device/get') {
                if (state.owner !== 'me') throw { code: 'unauthorized', message: 'refused' };
                return { value: state.record };
            }
            state.owner = 'me';
            Object.assign(state.record, m.data);
            return { ok: true };
        },
    };
    return { sent, state, hass: { connection } };
}

async function heartbeat(backend) {
    globalThis.window.lcards = { core: { integrationService: { available: true } } };
    const m = new DeviceIdentityManager();
    m._deviceId = 'dev-1';
    m._urlName = null;
    m._displayName = 'Chrome-Linux';
    m._hass = /** @type {any} */ (backend.hass);
    await m.registerHeartbeat();
    return m;
}

test('a device last used by another user: taken over, stored name kept', async () => {
    const backend = fakeBackend('someone-else', { display_name: 'Bridge Kiosk' });
    const m = await heartbeat(backend);
    assert.deepEqual(backend.sent, ['lcards/storage/device/get', 'lcards/storage/device/set', 'lcards/storage/device/get', 'lcards/storage/device/set']);
    assert.equal(backend.state.record.display_name, 'Bridge Kiosk');
    assert.equal(m.getDisplayName(), 'Bridge Kiosk');
});

test('the owner reads once and writes once', async () => {
    const backend = fakeBackend('me', { display_name: 'Bridge Kiosk' });
    await heartbeat(backend);
    assert.deepEqual(backend.sent, ['lcards/storage/device/get', 'lcards/storage/device/set']);
    assert.equal(backend.state.record.display_name, 'Bridge Kiosk');
});
