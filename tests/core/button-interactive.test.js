/**
 * isInteractive (src/utils/button-interactive.js): a button with no action and no
 * entity its default toggle can switch is decorative by default (no hover colour,
 * arrow cursor); `interactive` wins.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { isInteractive } from '../../src/utils/button-interactive.js';

test('a button that does nothing is decorative by default', () => {
    assert.equal(isInteractive({ type: 'custom:lcards-button', preset: 'text-only', text: { label: { content: 'TITLE' } } }), false);
    assert.equal(isInteractive({}), false);
    assert.equal(isInteractive(undefined), false);
    assert.equal(isInteractive({ tap_action: { action: 'none' } }), false);
    // a status label bound to a light, with its tap switched off
    assert.equal(isInteractive({ entity: 'light.x', tap_action: { action: 'none' } }), false);
    assert.equal(isInteractive({ entity: 'light.x', tap_action: { action: 'none' }, hold_action: { action: 'more-info' } }), true);
});

test('an action, a component, SVG segments or an entity the default toggle switches make it interactive', () => {
    assert.equal(isInteractive({ entity: 'light.x' }), true);
    assert.equal(isInteractive({ entity: 'input_boolean.x' }), true);
    assert.equal(isInteractive({ entity: 'cover.x' }), true);
    assert.equal(isInteractive({ entity: 'lock.x' }), true);
    assert.equal(isInteractive({ tap_action: { action: 'navigate', navigation_path: '/x' } }), true);
    assert.equal(isInteractive({ hold_action: { action: 'more-info' } }), true);
    assert.equal(isInteractive({ double_tap_action: { action: 'toggle' } }), true);
    assert.equal(isInteractive({ component: 'dpad' }), true);
    assert.equal(isInteractive({ svg: { segments: { up: {} } } }), true);
});

test('a readout (an entity the toggle cannot switch, no action) is decorative', () => {
    assert.equal(isInteractive({ entity: 'sensor.x' }), false);
    assert.equal(isInteractive({ entity: 'input_number.x' }), false);
    assert.equal(isInteractive({ entity: 'input_select.x' }), false);
    assert.equal(isInteractive({ entity: 'input_number.x', tap_action: { action: 'more-info' } }), true);
});

test('interactive set on the card wins both ways', () => {
    assert.equal(isInteractive({ interactive: true }), true);
    assert.equal(isInteractive({ entity: 'light.x', interactive: false }), false);
});
