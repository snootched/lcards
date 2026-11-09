/**
 * Number helpers get values within their own range (D2 batch 6): the Alert
 * Mode Lab's saturation goes to 3x, but gray/black helpers made before this
 * release stop at 200, and Home Assistant rejects a value past the max.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { LCARdSHelperManager as HelperManager } from '../../src/core/helpers/lcards-helper-manager.js';

test('a number past the helper\'s max is set at the max', async () => {
    const calls = [];
    const hass = {
        states: { 'input_number.lcards_alert_lab_gray_saturation': { state: '100', attributes: { min: 0, max: 200 } } },
        callService: async (d, s, data) => calls.push([d, s, data]),
        callWS: async (msg) => calls.push(['ws', msg]),
        connection: { sendMessagePromise: async (msg) => calls.push(['ws', msg]) },
    };
    const m = new HelperManager();
    m.hass = hass;
    await m.setHelperValue('alert_lab_gray_saturation', 300);
    const sent = JSON.stringify(calls);
    assert.match(sent, /"value":200/, sent);
});
