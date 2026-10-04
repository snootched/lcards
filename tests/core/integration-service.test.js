/**
 * IntegrationService lcards/info probe — readiness and retry behaviour.
 *
 * Fresh page loads used to report the integration as unavailable until the
 * next entity state change (core dropped the first real hass during init),
 * and a single transient probe failure left LCARdS degraded until reload.
 * These tests pin the probe chain: retry with backoff, resolve onReady() only
 * on success or after the final failure.
 */
import { test, mock, beforeEach } from 'node:test';
import assert from 'node:assert/strict';

// Browser/build globals the logger and lcards-vars expect at import time.
globalThis.window ??= globalThis;
globalThis.__LCARDS_VERSION__ ??= 'test';
const { IntegrationService } = await import('../../src/core/services/IntegrationService.js');

const INFO = { available: true, version: '2026.10.0', storage_key_count: 3, options: {}, capabilities: ['scoped_storage'] };

/** Fake hass whose lcards/info replies follow `script` (Error → reject). */
function fakeHass(script) {
    const calls = [];
    let i = 0;
    return {
        calls,
        connection: {
            sendMessagePromise: async (msg) => {
                calls.push(msg.type);
                const step = script[Math.min(i++, script.length - 1)];
                if (step instanceof Error) throw step;
                return step;
            },
            subscribeMessage: async () => () => {},
        },
    };
}

/** Let pending promise continuations run. */
const flush = () => new Promise(resolve => setImmediate(resolve));

beforeEach(() => mock.timers.reset());

test('first probe succeeds → available and onReady resolves', async () => {
    const svc = new IntegrationService();
    svc.updateHass(fakeHass([INFO]));
    await svc.onReady();
    assert.equal(svc.isReady, true);
    assert.equal(svc.available, true);
    assert.equal(svc.version, '2026.10.0');
});

test('no connection → no probe; a later hass with a connection probes', async () => {
    const svc = new IntegrationService();
    svc.updateHass({ states: {} });                 // core's connection-less boot stub
    assert.equal(svc.isReady, false);
    const hass = fakeHass([INFO]);
    svc.updateHass(hass);
    await svc.onReady();
    assert.deepEqual(hass.calls, ['lcards/info']);
    assert.equal(svc.available, true);
});

test('transient failures are retried; onReady waits for the eventual success', async () => {
    mock.timers.enable({ apis: ['setTimeout'] });
    const svc = new IntegrationService();
    const hass = fakeHass([new Error('not ready'), new Error('not ready'), INFO]);
    let ready = false;
    svc.onReady().then(() => { ready = true; });

    svc.updateHass(hass);
    await flush();
    assert.equal(ready, false, 'must not resolve on the first failure');
    assert.equal(svc.isReady, false);

    mock.timers.tick(IntegrationService.PROBE_RETRY_DELAYS_MS[0]);
    await flush();
    assert.equal(ready, false);

    mock.timers.tick(IntegrationService.PROBE_RETRY_DELAYS_MS[1]);
    await flush();
    assert.equal(ready, true);
    assert.equal(svc.available, true);
    assert.equal(hass.calls.length, 3);
});

test('all attempts fail → degraded, onReady still resolves', async () => {
    mock.timers.enable({ apis: ['setTimeout'] });
    const svc = new IntegrationService();
    const err = Object.assign(new Error('Unknown command.'), { code: 'unknown_command' });
    const hass = fakeHass([err]);
    let ready = false;
    svc.onReady().then(() => { ready = true; });

    svc.updateHass(hass);
    await flush();
    for (const delay of IntegrationService.PROBE_RETRY_DELAYS_MS) {
        assert.equal(ready, false);
        mock.timers.tick(delay);
        await flush();
    }
    assert.equal(ready, true);
    assert.equal(svc.isReady, true);
    assert.equal(svc.available, false);
    assert.equal(hass.calls.length, IntegrationService.PROBE_RETRY_DELAYS_MS.length + 1);
});

test('later hass updates do not start a second probe chain', async () => {
    const svc = new IntegrationService();
    const hass = fakeHass([INFO]);
    svc.updateHass(hass);
    svc.updateHass(hass);
    svc.updateHass(hass);
    await svc.onReady();
    assert.equal(hass.calls.filter(t => t === 'lcards/info').length, 1);
});
