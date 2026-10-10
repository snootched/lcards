/**
 * LCARdSActionHandler: action config validation and dispatch.
 */
import { test, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { LCARdSActionHandler } from '../../src/base/LCARdSActionHandler.js';
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

test('toggle: <domain>.toggle on the configured, default or element entity', () => {
    handler._executeAction({ action: 'toggle', entity: 'switch.a' }, hass, null);
    handler._executeAction({ action: 'toggle' }, hass, null, 'light.desk');
    handler._executeAction({ action: 'toggle' }, hass, fakeElement({ entity: 'fan.b' }));
    handler._executeAction({ action: 'toggle' }, hass, fakeElement()); // no entity: ignored
    assert.deepEqual(hass.serviceCalls.map(c => [c.domain, c.service, c.data.entity_id]), [
        ['switch', 'toggle', 'switch.a'],
        ['light', 'toggle', 'light.desk'],
        ['fan', 'toggle', 'fan.b'],
    ]);
});

test('toggle: every domain gets <domain>.toggle, unlike HA (current behaviour)', () => {
    // HA's own toggle maps lock -> lock/unlock, button -> press, scene -> turn_on,
    // cover -> open_cover/close_cover. These services do not exist in HA.
    for (const id of ['lock.door', 'button.ring', 'scene.night']) {
        handler._executeAction({ action: 'toggle', entity: id }, hass, null);
    }
    assert.deepEqual(hass.serviceCalls.map(c => `${c.domain}.${c.service}`), ['lock.toggle', 'button.toggle', 'scene.toggle']);
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
