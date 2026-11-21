/**
 * lcards.trigger_effect on the page (D2 batch 5 audit).
 *
 * The handler cleared all three slots before applying the new layers, so a
 * slot left out of the call was dropped (services.yaml promises it is kept),
 * and its duration timer called clear() on every slot without ever being
 * cancelled, wiping a later persistent effect. Each slot now keeps its own
 * timer on the real ScreenEffectManager.
 */
import { test, mock, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { installJsdom } from '../helpers/jsdom-env.js';
import { IntegrationService } from '../../src/core/services/IntegrationService.js';
import { ScreenEffectManager } from '../../src/core/screen-effects/ScreenEffectManager.js';

let sem;
let svc;
let env;

beforeEach(() => {
    env = installJsdom();
    sem = new ScreenEffectManager();
    window.lcards = { ...(window.lcards || {}), core: { screenEffectManager: sem } };
    svc = new IntegrationService();
});
afterEach(() => { mock.timers.reset(); env?.restore(); });

const active = () => ['backdrop', 'color', 'canvas'].filter(s => sem._slots.get(s)?.active);
const fire = (extra) => svc._handleLcardsEvent({ action: 'trigger_effect', ...extra });

test('a slot left out of trigger_effect keeps its effect; null clears one slot', () => {
    fire({ layers: { backdrop: { preset: 'blur' } } });
    fire({ layers: { color: { preset: 'color-tint', color: 'red' } } });
    assert.deepEqual(active(), ['backdrop', 'color']);
    fire({ layers: { backdrop: null } });
    assert.deepEqual(active(), ['color']);
});

test('a duration clears only the slots that call set, and a later call on the slot cancels it', () => {
    mock.timers.enable({ apis: ['setTimeout'] });
    fire({ layers: { backdrop: { preset: 'blur' } }, duration: 5000 });
    mock.timers.tick(2000);
    fire({ layers: { color: { preset: 'color-tint', color: 'red' } } });   // persistent, other slot
    mock.timers.tick(3000);
    assert.deepEqual(active(), ['color'], 'the blur timed out, the persistent tint stays');

    fire({ layers: { backdrop: { preset: 'blur' } }, duration: 1000 });
    fire({ layers: { backdrop: { preset: 'blur' } } });                    // re-applied, persistent
    mock.timers.tick(2000);
    assert.deepEqual(active(), ['backdrop', 'color'], 'the re-applied blur is not cut short');
});
