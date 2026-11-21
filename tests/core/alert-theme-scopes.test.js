/**
 * Alert mode in themed scopes (views, sections, cards with their own theme):
 * each scope is shifted from its own originals and restored only while it
 * still carries the theme it was shifted from.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { scopeOriginals, isAlertVar, applyAlertToScopes, restoreThemeScopes } from '../../src/core/themes/alertThemeScopes.js';

/** A fake themed element: inline style plus Home Assistant's __themes record. */
function scope(cacheKey, vars) {
    const style = new Map(Object.entries(vars));
    return {
        isConnected: true,
        __themes: { cacheKey, keys: Object.fromEntries(Object.keys(vars).map(k => [k, ''])) },
        style: {
            getPropertyValue: (n) => style.get(n) ?? '',
            setProperty: (n, v) => style.set(n, v),
        },
        get: (n) => style.get(n),
        rethemed(key, next) { this.__themes = { cacheKey: key, keys: Object.fromEntries(Object.keys(next).map(k => [k, ''])) }; for (const [k, v] of Object.entries(next)) style.set(k, v); },
    };
}

test('only alert colours with literal values count as originals', () => {
    const vals = { '--lcars-ui-primary': '#ff9966', '--lcars-ui-secondary': 'var(--lcars-orange)', '--ha-card-border-radius': '8px', '--primary-color': '#03a9f4', '--card-mod': '#fff' };
    const keys = Object.fromEntries(Object.keys(vals).map(k => [k, '']));
    assert.deepEqual(scopeOriginals(keys, n => vals[n]), { '--lcars-ui-primary': '#ff9966', '--primary-color': '#03a9f4' });
    assert.equal(isAlertVar('--lcards-orange'), false);
});

test('nested scopes shift from their own originals and restore exactly', () => {
    const view = scope('LCARS Modern', { '--lcars-ui-primary': '#ff9966' });
    const section = scope('LCARS Picard', { '--lcars-ui-primary': '#3366cc', '--lcars-ui-tertiary': 'var(--lcars-ui-primary)' });
    const r = applyAlertToScopes('red_alert', [view, section]);
    assert.deepEqual(r, { count: 2, fresh: 2 });
    assert.notEqual(view.get('--lcars-ui-primary'), '#ff9966');
    assert.notEqual(section.get('--lcars-ui-primary'), '#3366cc');
    assert.equal(section.get('--lcars-ui-tertiary'), 'var(--lcars-ui-primary)');   // reference left to follow
    // Switching modes re-shifts from the originals (no drift), nothing new
    const red = view.get('--lcars-ui-primary');
    assert.deepEqual(applyAlertToScopes('blue_alert', [view, section]), { count: 2, fresh: 0 });
    assert.notEqual(view.get('--lcars-ui-primary'), red);
    restoreThemeScopes();
    assert.equal(view.get('--lcars-ui-primary'), '#ff9966');
    assert.equal(section.get('--lcars-ui-primary'), '#3366cc');
});

test('a scope Home Assistant re-themed during the alert takes its new originals, and restore leaves them', () => {
    const view = scope('LCARS Modern', { '--lcars-ui-primary': '#ff9966' });
    applyAlertToScopes('red_alert', [view]);
    view.rethemed('LCARS Modern__dark', { '--lcars-ui-primary': '#cc6633' });
    assert.deepEqual(applyAlertToScopes('red_alert', [view]), { count: 1, fresh: 1 });
    assert.notEqual(view.get('--lcars-ui-primary'), '#cc6633');
    restoreThemeScopes();
    assert.equal(view.get('--lcars-ui-primary'), '#cc6633');
    // Re-themed again after the last shift: restore must not write stale originals
    applyAlertToScopes('red_alert', [view]);
    view.rethemed('LCARS Classic', { '--lcars-ui-primary': '#ffcc99' });
    restoreThemeScopes();
    assert.equal(view.get('--lcars-ui-primary'), '#ffcc99');
});
