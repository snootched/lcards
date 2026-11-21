// Jinja2 templates stay subscribed (2026-11-18, Fire HD 8 kiosk feedback item 6):
// a one-off render_template subscription per template per state change sent about
// 6,800 messages a minute on the Bridge dashboard while helpers changed.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createFakeConnection } from '../helpers/fake-hass.js';
import {
    renderLive, createTemplateOwner, liveTemplateCount, CLOSE_DELAY_MS, OWNER_LIMIT,
} from '../../src/core/templates/live-templates.js';
import { HATemplateEvaluator } from '../../src/core/templates/HATemplateEvaluator.js';

const flush = () => new Promise((resolve) => setImmediate(resolve));
/** A connection that answers each render_template with `answer(template)`. */
function connection(answer = (/** @type {string} */ t) => `R:${t}`) {
    return createFakeConnection({
        onSubscribe: (/** @type {any} */ msg, /** @type {any} */ push) => {
            if (msg.type === 'render_template') push({ result: answer(msg.template), listeners: {} });
        },
    });
}
/** @param {any} conn */
const tplSubs = (conn) => conn.subs.filter((/** @type {any} */ s) => s.message?.type === 'render_template');
/** @param {any} conn */
const openSubs = (conn) => tplSubs(conn).filter((/** @type {any} */ s) => s.active);

test('one subscription per template and variables, shared; a held template answers at once', async () => {
    const conn = connection();
    const a = createTemplateOwner(() => {});
    const b = createTemplateOwner(() => {});
    assert.equal(await renderLive(conn, '{{ 1 }}', { config: { x: 1 } }, a), 'R:{{ 1 }}');
    assert.equal(await renderLive(conn, '{{ 1 }}', { config: { x: 1 } }, b), 'R:{{ 1 }}');
    assert.equal(await renderLive(conn, '{{ 1 }}', { config: { x: 1 } }, a), 'R:{{ 1 }}');
    assert.equal(tplSubs(conn).length, 1, 'opened once');
    await renderLive(conn, '{{ 1 }}', { config: { x: 2 } }, a);
    assert.equal(tplSubs(conn).length, 2, 'other variables: another subscription');
    assert.equal(liveTemplateCount(conn), 2);
});

test('a changed result calls the owners and is what the next evaluation returns; the same result does not', async () => {
    const conn = connection(() => 'off');
    let calls = 0;
    const owner = createTemplateOwner(() => calls++);
    await renderLive(conn, '{{ states("light.a") }}', {}, owner);
    const sub = openSubs(conn)[0];
    sub.cb({ result: 'off' });
    assert.equal(calls, 0, 'unchanged');
    sub.cb({ result: 'on' });
    assert.equal(calls, 1);
    assert.equal(await renderLive(conn, '{{ states("light.a") }}', {}, owner), 'on');
    assert.equal(tplSubs(conn).length, 1, 'no new subscription per change');
});

test('released templates close after a delay; held again within it, they stay open', async (t) => {
    t.mock.timers.enable({ apis: ['setTimeout'] });
    const conn = connection();
    const owner = createTemplateOwner(() => {});
    await renderLive(conn, '{{ a }}', {}, owner);
    await renderLive(conn, '{{ b }}', {}, owner);
    owner.release();
    t.mock.timers.tick(CLOSE_DELAY_MS - 1);
    await renderLive(conn, '{{ a }}', {}, owner); // the next pass after a new config
    t.mock.timers.tick(1);
    await flush();
    assert.deepEqual(openSubs(conn).map((/** @type {any} */ s) => s.message.template), ['{{ a }}']);
    assert.equal(liveTemplateCount(conn), 1);
    owner.release();
    t.mock.timers.tick(CLOSE_DELAY_MS);
    await flush();
    assert.equal(openSubs(conn).length, 0);
    assert.equal(liveTemplateCount(conn), 0);
});

test('another owner keeps a released template open', async (t) => {
    t.mock.timers.enable({ apis: ['setTimeout'] });
    const conn = connection();
    const a = createTemplateOwner(() => {});
    const b = createTemplateOwner(() => {});
    await renderLive(conn, '{{ x }}', {}, a);
    await renderLive(conn, '{{ x }}', {}, b);
    a.release();
    t.mock.timers.tick(CLOSE_DELAY_MS * 2);
    await flush();
    assert.equal(openSubs(conn).length, 1);
});

test('an owner holds at most OWNER_LIMIT templates, the least recently used go first', async (t) => {
    t.mock.timers.enable({ apis: ['setTimeout'] });
    const conn = connection();
    const owner = createTemplateOwner(() => {});
    for (let i = 0; i <= OWNER_LIMIT; i++) await renderLive(conn, `{{ ${i} }}`, {}, owner);
    assert.equal(owner.entries.size, OWNER_LIMIT);
    t.mock.timers.tick(CLOSE_DELAY_MS);
    await flush();
    assert.equal(openSubs(conn).length, OWNER_LIMIT);
    assert.ok(!openSubs(conn).some((/** @type {any} */ s) => s.message.template === '{{ 0 }}'), 'the oldest closed');
});

test('a template Home Assistant refuses rejects, and the next evaluation tries again', async () => {
    let refuse = true;
    const conn = createFakeConnection();
    const subscribe = conn.subscribeMessage.bind(conn);
    conn.subscribeMessage = async (/** @type {any} */ cb, /** @type {any} */ msg) => {
        if (refuse) throw new Error('TemplateError: bad');
        const unsub = await subscribe(cb, msg);
        queueMicrotask(() => cb({ result: 'ok' }));
        return unsub;
    };
    const owner = createTemplateOwner(() => {});
    await assert.rejects(renderLive(conn, '{{ bad', {}, owner), /TemplateError/);
    assert.equal(liveTemplateCount(conn), 0);
    assert.equal(owner.entries.size, 0);
    refuse = false;
    assert.equal(await renderLive(conn, '{{ bad', {}, owner), 'ok');
});

test('no first result in 5 seconds: rejects and closes', async (t) => {
    t.mock.timers.enable({ apis: ['setTimeout'] });
    const conn = createFakeConnection(); // never answers
    const owner = createTemplateOwner(() => {});
    const pending = renderLive(conn, '{{ slow }}', {}, owner);
    await flush();
    t.mock.timers.tick(5000);
    await assert.rejects(pending, /timed out/);
    await flush();
    assert.equal(openSubs(conn).length, 0);
    assert.equal(liveTemplateCount(conn), 0);
});

test('closed before the subscription resolved: it is closed once it does', async (t) => {
    t.mock.timers.enable({ apis: ['setTimeout'] });
    const conn = createFakeConnection();
    /** @type {(v?: any) => void} */
    let go = () => {};
    const subscribe = conn.subscribeMessage.bind(conn);
    conn.subscribeMessage = async (/** @type {any} */ cb, /** @type {any} */ msg) => {
        await new Promise((resolve) => { go = resolve; });
        return subscribe(cb, msg);
    };
    const owner = createTemplateOwner(() => {});
    const pending = renderLive(conn, '{{ x }}', {}, owner);
    t.mock.timers.tick(5000); // times out while subscribing
    await assert.rejects(pending, /timed out/);
    go();
    await flush();
    await flush();
    assert.equal(openSubs(conn).length, 0);
});

test('HATemplateEvaluator: a card context keeps the template open, other callers render once', async () => {
    const conn = connection(() => '42');
    const hass = { connection: conn, states: {} };
    const owner = createTemplateOwner(() => {});
    const live = new HATemplateEvaluator({ hass, config: { a: 1 }, variables: {}, _liveTemplates: owner });
    assert.equal(await live.evaluate('{{ 6 * 7 }}'), '42');
    assert.equal(await live.evaluate('{{ 6 * 7 }}'), '42');
    assert.equal(tplSubs(conn).length, 1);
    assert.equal(openSubs(conn).length, 1, 'still open');
    assert.deepEqual(tplSubs(conn)[0].message.variables, {}, 'no variables the template does not name');
    await live.evaluate('{{ config.a }} {{ variables.b }}');
    assert.deepEqual(Object.keys(tplSubs(conn)[1].message.variables).sort(), ['config', 'variables']);

    const once = new HATemplateEvaluator({ hass, config: {}, variables: {} });
    assert.equal(await once.evaluate('{{ 1 }}'), '42');
    await flush();
    const oneShot = tplSubs(conn).filter((/** @type {any} */ s) => s.message.template === '{{ 1 }}');
    assert.equal(oneShot.length, 1);
    assert.equal(oneShot[0].active, false, 'one-shot closed after its result');
});

test('a template pass lets go of what it no longer used; an overlapped pass lets nothing go', async (t) => {
    t.mock.timers.enable({ apis: ['setTimeout'] });
    const conn = connection();
    const owner = createTemplateOwner(() => {});
    let pass = owner.beginPass();
    await renderLive(conn, '{{ a }}', {}, owner);
    await renderLive(conn, '{{ b }}', { config: 1 }, owner);
    owner.endPass(pass);
    assert.equal(owner.entries.size, 2);

    // the config changed: the pass evaluates {{ b }} with other variables
    pass = owner.beginPass();
    await renderLive(conn, '{{ a }}', {}, owner);
    await renderLive(conn, '{{ b }}', { config: 2 }, owner);
    const older = pass;
    pass = owner.beginPass(); // a newer pass began meanwhile
    owner.endPass(older);
    assert.equal(owner.entries.size, 3, 'the overlapped pass let nothing go');
    await renderLive(conn, '{{ a }}', {}, owner);
    await renderLive(conn, '{{ b }}', { config: 2 }, owner);
    owner.endPass(pass);
    assert.equal(owner.entries.size, 2);
    t.mock.timers.tick(CLOSE_DELAY_MS);
    await flush();
    assert.deepEqual(openSubs(conn).map((/** @type {any} */ s) => s.message.variables), [{}, { config: 2 }]);
});
