/**
 * HAClient (tests/ha/ha-client.mjs, shared by the Layer C tests and the gallery/release
 * shot scripts): a dropped websocket fails waiting calls instead of hanging.
 * Found 2026-11-12: dashboard-shots --video hung after a long encode, because the blocked
 * event loop missed Home Assistant's pings, the server closed the socket, and every later
 * service call waited forever.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { HAClient } from '../ha/ha-client.mjs';

/** A websocket that authenticates and then only records what it is sent. */
class FakeSocket extends EventTarget {
    static OPEN = 1;
    readyState = 0;
    sent = [];
    constructor() {
        super();
        FakeSocket.last = this;
        queueMicrotask(() => {
            this.readyState = 1;
            this.dispatchEvent(Object.assign(new Event('message'), { data: JSON.stringify({ type: 'auth_required' }) }));
        });
    }
    send(text) {
        const msg = JSON.parse(text);
        if (msg.type === 'auth') queueMicrotask(() => this.dispatchEvent(Object.assign(new Event('message'), { data: JSON.stringify({ type: 'auth_ok' }) })));
        else this.sent.push(msg);
    }
    drop() {
        this.readyState = 3;
        this.dispatchEvent(new Event('close'));
    }
}

test('a call waiting when the websocket closes is rejected; later calls fail at once', async (t) => {
    const real = globalThis.WebSocket;
    globalThis.WebSocket = /** @type {any} */ (FakeSocket);
    t.after(() => { globalThis.WebSocket = real; });

    const client = await HAClient.connect('token');
    const waiting = client.callService('lcards', 'clear_alert', {});
    assert.equal(FakeSocket.last.sent.length, 1);
    FakeSocket.last.drop();
    await assert.rejects(waiting, /websocket closed/);
    await assert.rejects(client.callService('lcards', 'clear_alert', {}), /websocket closed/);
    assert.equal(FakeSocket.last.sent.length, 1);   // nothing sent into a closed socket
});
