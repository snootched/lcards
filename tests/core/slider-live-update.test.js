/**
 * The slider's live sender (src/cards/slider-live-update.js): the entity follows
 * the handle while it is dragged, one call at a time, at least the interval apart,
 * the latest value winning, the release value always last.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createLiveSender, LIVE_UPDATE_INTERVAL_MS, LIVE_UPDATE_HOLD_MS } from '../../src/cards/slider-live-update.js';

const flush = () => new Promise((resolve) => setImmediate(resolve));

/** A sender over a fake clock, with calls that settle when the test says so. */
function rig(t) {
    t.mock.timers.enable({ apis: ['setTimeout', 'Date'] });
    const sent = [];
    /** @type {Array<() => void>} */
    const settle = [];
    const sender = createLiveSender({
        send: (v) => { sent.push(v); return new Promise((resolve) => settle.push(() => resolve(undefined))); },
    });
    const done = async () => { settle.shift()?.(); await flush(); await flush(); };
    return { sender, sent, done };
}

test('the first value goes out at once; values during a call wait, and only the latest is sent', async (t) => {
    const { sender, sent, done } = rig(t);
    sender.push(10);
    await flush();
    assert.deepEqual(sent, [10]);
    sender.push(20);
    sender.push(30);
    sender.push(40);
    t.mock.timers.tick(LIVE_UPDATE_INTERVAL_MS);
    await flush();
    assert.deepEqual(sent, [10], 'nothing while the first call is in flight');
    await done();
    assert.deepEqual(sent, [10, 40], 'the latest value, the ones between dropped');
});

test('calls start at least the interval apart', async (t) => {
    const { sender, sent, done } = rig(t);
    sender.push(10);
    await flush();
    await done();
    sender.push(20);
    await flush();
    assert.deepEqual(sent, [10], 'too soon after the first');
    t.mock.timers.tick(LIVE_UPDATE_INTERVAL_MS);
    await flush();
    assert.deepEqual(sent, [10, 20]);
});

test('the release value is sent last, after the call in flight, without waiting for the interval', async (t) => {
    const { sender, sent, done } = rig(t);
    sender.push(10);
    await flush();
    sender.push(20);
    const finished = sender.finish(55);
    await done();
    assert.deepEqual(sent, [10, 55], 'the release value replaces the waiting one');
    let settled = false;
    finished.then(() => { settled = true; });
    await done();
    assert.ok(settled, 'finish() settles once the release value is sent');
});

test('a value equal to the last one sent is not sent again', async (t) => {
    const { sender, sent, done } = rig(t);
    sender.push(10);
    await flush();
    await done();
    const finished = sender.finish(10);
    await flush();
    await finished;
    assert.deepEqual(sent, [10]);
});

test('holding: during the drag and a while after the last call settles, so a late echo cannot move the handle', async (t) => {
    const { sender, done } = rig(t);
    assert.equal(sender.holding(), false);
    sender.push(10);
    await flush();
    assert.equal(sender.holding(), true);
    sender.finish(20);
    await done();
    await done();
    assert.equal(sender.holding(), true, 'just settled');
    t.mock.timers.tick(LIVE_UPDATE_HOLD_MS + 1);
    assert.equal(sender.holding(), false);
});

test('a failed call does not stop the queue', async (t) => {
    t.mock.timers.enable({ apis: ['setTimeout', 'Date'] });
    const sent = [];
    const sender = createLiveSender({ send: (v) => { sent.push(v); return Promise.reject(new Error('offline')); } });
    sender.push(10);
    await flush(); await flush();
    sender.push(20);
    t.mock.timers.tick(LIVE_UPDATE_INTERVAL_MS);
    await flush(); await flush();
    assert.deepEqual(sent, [10, 20]);
});

test('stop() drops the waiting value and the hold', async (t) => {
    const { sender, sent } = rig(t);
    sender.push(10);
    await flush();
    sender.push(20);
    sender.stop();
    t.mock.timers.tick(LIVE_UPDATE_INTERVAL_MS * 5);
    await flush();
    assert.deepEqual(sent, [10]);
});
