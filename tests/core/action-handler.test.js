/**
 * LCARdSActionHandler: action config validation and dispatch.
 */
import { test, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { LCARdSActionHandler, toggleService, actionSoundEvent } from '../../src/base/LCARdSActionHandler.js';
import { createFakeHass } from '../helpers/fake-hass.js';

/** EventTarget standing in for the card element; records dispatched events. */
function fakeElement(dataset = {}) {
    const el = new EventTarget();
    el.dataset = dataset;
    el.events = [];
    const dispatch = el.dispatchEvent.bind(el);
    el.dispatchEvent = (ev) => { el.events.push(ev); return dispatch(ev); };
    return el;
}

let handler, hass, pushed, opened, windowEvents;

beforeEach(() => {
    handler = new LCARdSActionHandler();
    hass = createFakeHass({ states: { 'light.desk': 'on' } });
    pushed = [];
    opened = [];
    windowEvents = [];
    globalThis.history = { pushState: (state, title, url) => pushed.push(url) };
    globalThis.open = (url, target) => opened.push([url, target]);
    // window is globalThis under the test shims; node's globalThis is not an EventTarget.
    globalThis.dispatchEvent = (ev) => { windowEvents.push(ev); return true; };
});

afterEach(() => {
    delete globalThis.dispatchEvent;
    delete globalThis.history;
    delete globalThis.open;
});

test('_validateActionConfig: required fields per action', () => {
    const cases = [
        [null, false], ['toggle', false], [{}, false],
        [{ action: 'call-service' }, false],
        [{ action: 'call-service', service: 'light.turn_on' }, true],
        [{ action: 'perform-action', perform_action: 'light.turn_on' }, true],
        [{ action: 'perform-action' }, false],
        [{ action: 'navigate' }, false],
        [{ action: 'navigate', navigation_path: '/lovelace/1' }, true],
        [{ action: 'url' }, false],
        [{ action: 'url', url_path: 'https://example.com' }, true],
        [{ action: 'toggle' }, true],
        [{ action: 'more-info' }, true],
        [{ action: 'assist' }, true],
        [{ action: 'none' }, true],
        [{ action: 'fire-dom-event' }, true], // unknown types are allowed
    ];
    for (const [cfg, want] of cases) assert.equal(handler._validateActionConfig(cfg), want, JSON.stringify(cfg));
});

test('toggle: on the configured, default or element entity, from its state', () => {
    hass = createFakeHass({ states: { 'switch.a': 'off', 'light.desk': 'on' } });
    handler._executeAction({ action: 'toggle', entity: 'switch.a' }, hass, null);
    handler._executeAction({ action: 'toggle' }, hass, null, 'light.desk');
    handler._executeAction({ action: 'toggle' }, hass, fakeElement({ entity: 'fan.b' })); // no state known: fan.toggle
    handler._executeAction({ action: 'toggle' }, hass, fakeElement()); // no entity: ignored
    assert.deepEqual(hass.serviceCalls.map(c => [c.domain, c.service, c.data.entity_id]), [
        ['switch', 'turn_on', 'switch.a'],
        ['light', 'turn_off', 'light.desk'],
        ['fan', 'toggle', 'fan.b'],
    ]);
});

test('toggle: the service Home Assistant\'s own toggle picks for each domain', () => {
    const cases = [
        ['lock.door', 'locked', 'lock.unlock'], ['lock.door', 'unlocked', 'lock.lock'],
        ['cover.blind', 'closed', 'cover.open_cover'], ['cover.blind', 'open', 'cover.close_cover'],
        ['valve.main', 'closed', 'valve.open_valve'], ['valve.main', 'open', 'valve.close_valve'],
        ['button.ring', 'unknown', 'button.press'], ['input_button.go', '2026-11-02T00:00:00', 'input_button.press'],
        ['scene.night', 'scening', 'scene.turn_on'],
        ['group.lights', 'on', 'homeassistant.turn_off'], ['group.lights', 'off', 'homeassistant.turn_on'],
        ['media_player.tv', 'playing', 'media_player.turn_off'],
        ['input_boolean.x', 'off', 'input_boolean.turn_on'], ['light.desk', 'unavailable', 'light.turn_off'],
    ];
    for (const [id, state, want] of cases) {
        assert.deepEqual(toggleService(id, state), { domain: want.split('.')[0], service: want.split('.')[1] }, `${id} ${state}`);
    }
    hass = createFakeHass({ states: { 'lock.door': 'locked', 'button.ring': 'unknown' } });
    handler._executeAction({ action: 'toggle', entity: 'lock.door' }, hass, null);
    handler._executeAction({ action: 'toggle', entity: 'button.ring' }, hass, null);
    assert.deepEqual(hass.serviceCalls.map(c => `${c.domain}.${c.service}`), ['lock.unlock', 'button.press']);
});

test('call-service / perform-action: service or perform_action, data merged with target', () => {
    handler._executeAction({ action: 'call-service', service: 'light.turn_on', service_data: { brightness: 10 } }, hass, null);
    handler._executeAction({
        action: 'perform-action', perform_action: 'climate.set_temperature',
        data: { temperature: 21 }, target: { entity_id: 'climate.lounge' },
    }, hass, null);
    handler._executeAction({ action: 'perform-action' }, hass, null); // missing service: ignored
    assert.deepEqual(hass.serviceCalls.map(({ domain, service, data }) => ({ domain, service, data })), [
        { domain: 'light', service: 'turn_on', data: { brightness: 10 } },
        { domain: 'climate', service: 'set_temperature', data: { temperature: 21, entity_id: 'climate.lounge' } },
    ]);
});

test('more-info: bubbling, composed hass-more-info event from the element', () => {
    const el = fakeElement();
    handler._executeAction({ action: 'more-info' }, hass, el, 'light.desk');
    const [ev] = el.events;
    assert.equal(ev.type, 'hass-more-info');
    assert.deepEqual(ev.detail, { entityId: 'light.desk' });
    assert.equal(ev.bubbles, true);
    assert.equal(ev.composed, true);
});

test('navigate: pushState then location-changed on window', () => {
    handler._executeAction({ action: 'navigate', navigation_path: '/lovelace/engineering' }, hass, null);
    assert.deepEqual(pushed, ['/lovelace/engineering']);
    assert.deepEqual(windowEvents.map(e => [e.type, e.detail]), [['location-changed', { replace: false }]]);
    handler._executeAction({ action: 'navigate' }, hass, null);
    assert.equal(pushed.length, 1);
});

test('url: opens a new tab', () => {
    handler._executeAction({ action: 'url', url_path: 'https://example.com' }, hass, null);
    handler._executeAction({ action: 'url' }, hass, null);
    assert.deepEqual(opened, [['https://example.com', '_blank']]);
});

test('assist: show-dialog for the voice command dialog with defaults', () => {
    const el = fakeElement();
    handler._executeAction({ action: 'assist' }, hass, el);
    handler._executeAction({ action: 'assist', pipeline_id: 'p1', start_listening: false }, hass, el);
    assert.deepEqual(el.events.map(e => [e.type, e.detail.dialogTag, e.detail.dialogParams]), [
        ['show-dialog', 'ha-voice-command-dialog', { pipeline_id: 'preferred', start_listening: true }],
        ['show-dialog', 'ha-voice-command-dialog', { pipeline_id: 'p1', start_listening: false }],
    ]);
});

test('none, unknown actions, and missing hass do nothing', () => {
    const el = fakeElement();
    handler._executeAction({ action: 'none' }, hass, el, 'light.desk');
    handler._executeAction({ action: 'warp' }, hass, el, 'light.desk');
    handler._executeAction({ action: 'toggle' }, null, el, 'light.desk');
    handler._executeAction(null, hass, el);
    assert.equal(hass.serviceCalls.length, 0);
    assert.equal(el.events.length, 0);
});

test('no tap sound for action: none; a real action still plays card_tap (D2 batch 5)', async () => {
    const { installJsdom } = await import('../helpers/jsdom-env.js');
    const env = installJsdom();
    const played = [];
    const prev = window.lcards;
    window.lcards = { core: { soundManager: { play: (e) => played.push(e) } } };
    try {
        for (const [tap, expected] of [[{ action: 'none' }, []], [{ action: 'more-info' }, ['card_tap']]]) {
            played.length = 0;
            const el = document.createElement('div');
            document.body.appendChild(el);
            const cleanup = handler.setupActions(el, { tap_action: tap }, hass, { entity: 'light.desk' });
            el.dispatchEvent(new window.Event('click'));
            await new Promise((r) => setTimeout(r, 20));
            assert.deepEqual(played, expected, JSON.stringify(tap));
            cleanup?.();
        }
    } finally {
        window.lcards = prev;
        env.restore();
    }
});

test('segment sounds: a toggle sounds by the off states (an open cover closes: toggle_off), none is silent', () => {
    const toggle = { action: 'toggle' };
    assert.equal(actionSoundEvent(toggle, 'open', 'card_tap'), 'toggle_off');
    assert.equal(actionSoundEvent(toggle, 'closed', 'card_tap'), 'toggle_on');
    assert.equal(actionSoundEvent(toggle, 'on', 'card_tap'), 'toggle_off');
    assert.equal(actionSoundEvent(toggle, undefined, 'card_tap'), 'card_tap');
    assert.equal(actionSoundEvent({ action: 'more-info' }, 'on', 'card_hold'), 'card_hold');
    assert.equal(actionSoundEvent({ action: 'none' }, 'on', 'card_tap'), null);
    assert.equal(actionSoundEvent(undefined, 'on', 'card_tap'), null);
});
