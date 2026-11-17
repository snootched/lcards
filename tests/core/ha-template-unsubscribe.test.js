/**
 * A Jinja2 render is a one-shot render_template subscription: it must always be
 * unsubscribed. Home Assistant can send the subscribe result and the first event in
 * one websocket frame, so the event callback runs before subscribeMessage() resolves
 * with the unsubscribe function. The evaluator used to skip the unsubscribe then,
 * leaving the subscription in connection.commands (and on the server) for good:
 * 786 of them after a minute on a dashboard with templates (2026-11-17).
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { HATemplateEvaluator } from '../../src/core/templates/HATemplateEvaluator.js';

/**
 * A connection that answers render_template with `result`.
 * @param {'before-resolve' | 'after-resolve'} order when the event arrives
 */
function connection(order) {
    const state = { open: 0, unsubscribed: 0 };
    return {
        state,
        subscribeMessage(/** @type {Function} */ cb) {
            state.open++;
            const unsub = async () => { state.open--; state.unsubscribed++; };
            if (order === 'before-resolve') {
                // coalesced frame: the event is handled before the subscribe promise settles
                cb({ result: 'rendered' });
                return Promise.resolve(unsub);
            }
            setTimeout(() => cb({ result: 'rendered' }), 1);
            return Promise.resolve(unsub);
        },
    };
}

for (const order of /** @type {const} */ (['before-resolve', 'after-resolve'])) {
    test(`a render unsubscribes when the event arrives ${order.replace('-', ' ')} the subscribe`, async () => {
        const conn = connection(order);
        const evaluator = new HATemplateEvaluator({ hass: { connection: conn, states: {} } });
        for (let i = 0; i < 5; i++) {
            assert.equal(await evaluator.evaluate('{{ states("sensor.x") }}'), 'rendered');
        }
        // the unsubscribe may run a microtask later
        await new Promise((r) => setTimeout(r, 5));
        assert.deepEqual(conn.state, { open: 0, unsubscribed: 5 });
    });
}

test('a second event after the result does nothing', async () => {
    let cb;
    let unsubscribed = 0;
    const conn = {
        subscribeMessage(/** @type {Function} */ f) {
            cb = f;
            f({ result: 'first' });
            return Promise.resolve(async () => { unsubscribed++; });
        },
    };
    const evaluator = new HATemplateEvaluator({ hass: { connection: conn, states: {} } });
    assert.equal(await evaluator.evaluate('{{ 1 }}'), 'first');
    cb({ result: 'second' });
    await new Promise((r) => setTimeout(r, 5));
    assert.equal(unsubscribed, 1);
});
