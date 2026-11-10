/**
 * ThemeManager.loadOverrides notifies (and so makes every card re-process its
 * config) only when the effective overrides actually change.
 */
import { test, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { ThemeManager } from '../../src/core/themes/ThemeManager.js';
import { ThemeTokenResolver } from '../../src/core/themes/ThemeTokenResolver.js';

let tm, scopes, notified;

beforeEach(() => {
    scopes = { global: {}, user: {}, device: {} };
    globalThis.lcards = { core: { scopedSettingsService: { readAllScopes: async () => scopes } } };
    tm = new ThemeManager();
    tm.resolver = new ThemeTokenResolver({ colors: { ui: { primary: '#111' } } });
    notified = 0;
    tm._notifyOverridesChanged = () => { notified++; };
});

afterEach(() => { delete globalThis.lcards; });

test('no overrides at startup: nothing applied, no notification', async () => {
    await tm.loadOverrides();
    assert.equal(notified, 0);
    assert.equal(tm.resolver._overrides, null);
});

test('new overrides apply and notify once; reloading the same set does not notify', async () => {
    scopes.global = { 'colors.ui.primary': '#222' };
    await tm.loadOverrides();
    assert.equal(notified, 1);
    assert.equal(tm.resolver.resolve('colors.ui.primary'), '#222');
    await tm.loadOverrides();
    assert.equal(notified, 1);
});

test('scope precedence: device beats user beats global', async () => {
    scopes = { global: { a: 'g', b: 'g', c: 'g' }, user: { b: 'u', c: 'u' }, device: { c: 'd' } };
    await tm.loadOverrides();
    assert.deepEqual(Object.fromEntries(tm.resolver._overrides), { a: 'g', b: 'u', c: 'd' });
});

test('changing or removing overrides notifies', async () => {
    scopes.user = { 'colors.ui.primary': '#222' };
    await tm.loadOverrides();
    scopes.user = { 'colors.ui.primary': '#333' };
    await tm.loadOverrides();
    assert.equal(notified, 2);
    scopes.user = {};
    await tm.loadOverrides();
    assert.equal(notified, 3);
    assert.equal(tm.resolver._overrides, null);
});

test('a failed read clears the overrides, which counts as a change (existing behaviour)', async () => {
    scopes.global = { x: '1' };
    await tm.loadOverrides();
    globalThis.lcards.core.scopedSettingsService.readAllScopes = async () => { throw new Error('ws down'); };
    await tm.loadOverrides();
    // Read failure is treated as "no overrides": they are cleared and that is a change.
    assert.equal(notified, 2);
    assert.equal(tm.resolver._overrides, null);
});

test('getThemeDefault returns the un-overridden value and leaves the live caches overridden', () => {
    tm.resolver = new ThemeTokenResolver({
        colors: { ui: { primary: '#111' } },
        components: { demo: { ref: 'colors.ui.primary', mixed: 'darken(colors.ui.primary, 0.2)' } },
    });
    tm.resolver.setOverrides({ 'colors.ui.primary': '#ff0000' });
    const liveRef = tm.getToken('components.demo.ref');
    const liveMixed = tm.getToken('components.demo.mixed');
    assert.equal(liveRef, '#ff0000');

    tm.resolver.clearCache();
    assert.equal(tm.getThemeDefault('components.demo.ref'), '#111');
    assert.notEqual(tm.getThemeDefault('components.demo.mixed'), liveMixed);

    // The default lookup must not have seeded the shared caches with un-overridden values.
    assert.equal(tm.getToken('components.demo.ref'), '#ff0000');
    assert.equal(tm.getToken('components.demo.mixed'), liveMixed);
    // And the live caches built before a default lookup are kept.
    assert.equal(tm.getThemeDefault('components.demo.ref'), '#111');
    assert.equal(tm.getToken('components.demo.ref'), '#ff0000');
});
