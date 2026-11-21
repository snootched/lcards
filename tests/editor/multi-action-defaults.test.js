/**
 * Action editor: an unset action shows the card's own default, choosing that
 * default leaves the key out, and anything else is written. Before 2026-11-20
 * choosing None deleted the key, so a button on a toggleable entity fell back
 * to its default toggle and could not be set to do nothing.
 */
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { installJsdom } from '../helpers/jsdom-env.js';

let Editor, restore;

before(async () => {
    const env = installJsdom();
    restore = env.restore;
    for (const key of ['Document', 'ShadowRoot', 'Element', 'Node', 'CSSStyleSheet', 'MutationObserver', 'DocumentFragment', 'Event', 'CustomEvent']) {
        if (globalThis[key] === undefined && env.dom.window[key] !== undefined) globalThis[key] = env.dom.window[key];
    }
    ({ LCARdSMultiActionEditor: Editor } = await import('../../src/editor/components/editors/lcards-multi-action-editor.js'));
});
after(() => restore?.());

function pick(defaults, actions, type, value) {
    const el = Object.create(Editor.prototype);
    let sent;
    for (const [k, v] of Object.entries({ defaults, actions, dispatchEvent: (e) => { sent = e.detail.value; return true; } })) {
        Object.defineProperty(el, k, { value: v, writable: true });
    }
    el._handleActionChange(type, { stopPropagation() {}, detail: { value } });
    return sent;
}

const button = { tap_action: { action: 'toggle' } };

test('None on a button tap is written, so it no longer toggles', () => {
    assert.deepEqual(pick(button, {}, 'tap_action', { action: 'none' }), { tap_action: { action: 'none' } });
});

test("choosing the card's own default leaves the key out", () => {
    assert.deepEqual(pick(button, { tap_action: { action: 'none' } }, 'tap_action', { action: 'toggle' }), {});
    assert.deepEqual(pick({}, { hold_action: { action: 'toggle' } }, 'hold_action', { action: 'none' }), {});
});

test('other actions are written as chosen', () => {
    assert.deepEqual(pick(button, {}, 'hold_action', { action: 'more-info' }), { hold_action: { action: 'more-info' } });
});

test('the descriptions name the real default', () => {
    const el = Object.create(Editor.prototype);
    Object.defineProperty(el, 'defaults', { value: button });
    assert.equal(el._describe('tap_action'), 'Action to perform when tapped (default: toggle)');
    assert.equal(el._describe('double_tap_action'), 'Action to perform when double-tapped (default: none)');
});
