/**
 * D3b decision: a portal overlay slot (alert overlay, connection overlay,
 * show_portal_card) clears only the screen-effect slots it applied when it hides
 * or loses ownership. It used to clear all three, wiping a running
 * lcards.trigger_effect on a slot the overlay never touched, or one applied
 * after the overlay on the same slot.
 */
import { test, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { installJsdom } from '../helpers/jsdom-env.js';
import { ScreenEffectManager } from '../../src/core/screen-effects/ScreenEffectManager.js';
import { PortalOverlayManager } from '../../src/core/services/PortalOverlayManager.js';

let sem;
let pom;
let env;

beforeEach(() => {
    env = installJsdom();
    sem = new ScreenEffectManager();
    pom = new PortalOverlayManager();
    window.lcards = { core: { screenEffectManager: sem, portalOverlayManager: pom } };
});
afterEach(() => env?.restore());

/** Active SEM slot -> preset-less marker of what is running there. */
const active = () => ['backdrop', 'color', 'canvas'].filter(s => sem._slots.get(s)?.active);
const overlay = (name, layers) => pom.show(name, { text: { text: name }, layers });

test('hiding an overlay keeps a trigger_effect on a slot it never used', () => {
    sem.applySlot('backdrop', 'blur', { amount: '4px' });          // trigger_effect
    overlay('connection-overlay', { color: { preset: 'color-tint', color: 'black' } });
    assert.deepEqual(active(), ['backdrop', 'color'], 'showing does not clear the other slot');
    pom.hide('connection-overlay');
    assert.deepEqual(active(), ['backdrop']);
});

test('an effect applied after the overlay on the same slot survives the hide', () => {
    overlay('alert-overlay', { color: { preset: 'color-tint', color: 'red' } });
    sem.applySlot('color', 'color-tint', { color: 'blue' });       // trigger_effect replaces it
    pom.hide('alert-overlay');
    assert.deepEqual(active(), ['color']);
});

test("the overlay's own slots clear on hide", () => {
    overlay('alert-overlay', { color: { preset: 'color-tint', color: 'red' }, canvas: { preset: 'static' } });
    assert.deepEqual(active(), ['color', 'canvas']);
    pom.hide('alert-overlay');
    assert.deepEqual(active(), []);
});

test('a newer overlay with layers takes over: the older one\'s slots clear, a trigger_effect stays', () => {
    sem.applySlot('backdrop', 'blur', { amount: '4px' });
    overlay('alert-overlay', { color: { preset: 'color-tint', color: 'red' }, canvas: { preset: 'static' } });
    overlay('connection-overlay', { color: { preset: 'color-tint', color: 'black' } });
    assert.deepEqual(active(), ['backdrop', 'color'], "the alert overlay's canvas went with it");
    pom.hide('alert-overlay');
    assert.deepEqual(active(), ['backdrop', 'color'], 'the evicted overlay no longer owns anything');
    pom.hide('connection-overlay');
    assert.deepEqual(active(), ['backdrop']);
});

test('re-showing the same overlay replaces its own layers only', () => {
    sem.applySlot('backdrop', 'blur', { amount: '4px' });
    overlay('alert-overlay', { color: { preset: 'color-tint', color: 'red' }, canvas: { preset: 'static' } });
    overlay('alert-overlay', { color: { preset: 'color-tint', color: 'yellow' } });
    assert.deepEqual(active(), ['backdrop', 'color']);
});

test('hideAll clears every overlay slot and keeps a trigger_effect', () => {
    sem.applySlot('backdrop', 'blur', { amount: '4px' });
    overlay('alert-overlay', { color: { preset: 'color-tint', color: 'red' } });
    pom.hideAll();
    assert.deepEqual(active(), ['backdrop']);
});
