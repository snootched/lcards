/**
 * ?lcards_device= names the device on every load (D2 batch 6): the stored name
 * used to replace it, so a renamed kiosk kept its old name.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DeviceIdentityManager } from '../../src/core/services/DeviceIdentityManager.js';

async function heartbeat(urlName, stored) {
    const m = new DeviceIdentityManager();
    m._deviceId = 'dev-1';
    m._urlName = urlName;
    m._displayName = urlName ?? 'Chrome-Linux';
    const written = [];
    m._readFromBackend = async () => (stored ? { display_name: stored } : null);
    m._writeToBackend = async (v) => { written.push(v); };
    await m.registerHeartbeat();
    return written[0].display_name;
}

test('the address name wins over the stored one; without it the stored name stays', async () => {
    assert.equal(await heartbeat('kiosk-bridge', 'Old Name'), 'kiosk-bridge');
    assert.equal(await heartbeat(null, 'Old Name'), 'Old Name');
    assert.equal(await heartbeat(null, null), 'Chrome-Linux');
});
