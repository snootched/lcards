/**
 * Alert mode for theme scopes below the page root.
 *
 * Home Assistant writes a theme as inline custom properties on the element that
 * uses it: the page root (the profile theme), a view's hui-view-container, a
 * section (hui-section) or one of its own cards (a card's `theme:`). It records
 * what it wrote on the element itself: `element.__themes = { cacheKey, keys }`,
 * where `keys` lists every variable name it set and `cacheKey` names the theme
 * (plus dark mode). Alert mode shifts the colours on the page root
 * (paletteInjector.js), but a scope's own values win for everything inside it,
 * so a themed view would keep its normal colours.
 *
 * Each scope is handled on its own, from its own values:
 * - **Originals:** the first time a scope is shifted, the colour values Home
 *   Assistant wrote on that element are read from its inline style and kept in
 *   a WeakMap keyed by the element, together with the theme's cacheKey.
 * - **Nested scopes** (a themed section in a themed view) never mix: each
 *   element holds only its own theme's variables, so each is shifted from its
 *   own originals; what it doesn't set it inherits, already shifted, from the
 *   scope above.
 * - **Values that reference other variables** (`var(--lcars-orange)`) are left
 *   alone: they follow the referenced variable once that is shifted.
 * - **Restore** writes the originals back, but only while the element still
 *   carries the same theme (cacheKey). If Home Assistant applied another theme
 *   there meanwhile, its fresh values are already the right ones.
 * - **Home Assistant re-applying a theme during an alert** (navigation, a
 *   theme or dark mode change) is caught by the next refresh: a changed
 *   cacheKey means new originals are read before shifting again.
 */

import { lcardsLog } from '../../utils/lcards-logging.js';
import { transformColorToAlertMode } from './alertModeTransform.js';
import { isCssColor } from './color-syntax.js';

/** Home Assistant state colours that alert mode shifts as well as --lcars-*. */
const STATE_COLOR_VARS = new Set([
    '--success-color', '--warning-color', '--error-color', '--info-color',
    '--primary-color', '--accent-color',
    '--state-active-color', '--state-inactive-color',
    '--state-unavailable-color', '--state-unknown-color',
]);

/**
 * Whether alert mode shifts this variable.
 * @param {string} name
 * @returns {boolean}
 */
export function isAlertVar(name) {
    return name.startsWith('--lcars-') || STATE_COLOR_VARS.has(name);
}

/**
 * The colours of one scope that alert mode may shift: variables Home Assistant
 * set on it (`keys`), read from `getValue`, keeping literal colours only.
 * Pure, for tests.
 *
 * @param {Record<string, any>|null|undefined} keys - element.__themes.keys
 * @param {(name: string) => string} getValue - reads the element's inline value
 * @returns {Record<string, string>}
 */
export function scopeOriginals(keys, getValue) {
    /** @type {Record<string, string>} */
    const out = {};
    for (const name of Object.keys(keys || {})) {
        if (!isAlertVar(name)) continue;
        const value = String(getValue(name) ?? '').trim();
        if (!value || value.includes('var(')) continue;
        if (isCssColor(value)) out[name] = value;
    }
    return out;
}

/**
 * Every element below the page root that carries a Home Assistant theme,
 * found through open shadow roots.
 * @param {Document|ShadowRoot|Element} [root]
 * @returns {HTMLElement[]}
 */
export function findThemeScopes(root = document) {
    /** @type {HTMLElement[]} */
    const found = [];
    const walk = (/** @type {Document|ShadowRoot|Element} */ node) => {
        const all = node.querySelectorAll('*');
        for (const el of all) {
            const themes = /** @type {any} */ (el).__themes;
            if (themes?.keys && Object.keys(themes.keys).length && el !== document.documentElement) {
                found.push(/** @type {HTMLElement} */ (el));
            }
            if (el.shadowRoot) walk(el.shadowRoot);
        }
    };
    walk(root);
    return found;
}

/** @type {WeakMap<HTMLElement, { cacheKey: string|undefined, originals: Record<string, string> }>} */
const scopeState = new WeakMap();
/** Scopes currently shifted, so they can be restored. */
const shifted = new Set();

/**
 * Shift every themed scope to `mode`, from each scope's own originals.
 * @param {string} mode - an alert mode other than green_alert
 * @param {HTMLElement[]} [scopes]
 * @returns {{ count: number, fresh: number }} scopes shifted, and how many of
 *   them were new (or newly re-themed by Home Assistant) since the last call
 */
export function applyAlertToScopes(mode, scopes = findThemeScopes()) {
    let count = 0;
    let fresh = 0;
    for (const el of scopes) {
        const cacheKey = /** @type {any} */ (el).__themes?.cacheKey;
        let state = scopeState.get(el);
        if (!state || state.cacheKey !== cacheKey) {
            // First time, or Home Assistant applied another theme here: the
            // inline values are its own again.
            state = {
                cacheKey,
                originals: scopeOriginals(/** @type {any} */ (el).__themes?.keys, n => el.style.getPropertyValue(n)),
            };
            scopeState.set(el, state);
            if (Object.keys(state.originals).length) fresh++;
        }
        for (const [name, original] of Object.entries(state.originals)) {
            el.style.setProperty(name, transformColorToAlertMode(original, mode));
        }
        if (Object.keys(state.originals).length) {
            shifted.add(el);
            count++;
        }
    }
    for (const el of [...shifted]) {
        if (!el.isConnected) shifted.delete(el);
    }
    if (count) lcardsLog.debug(`[AlertThemeScopes] ${mode}: shifted ${count} themed scope(s), ${fresh} new`);
    return { count, fresh };
}

/**
 * Put every shifted scope back to the colours Home Assistant gave it.
 * @returns {number} scopes restored
 */
export function restoreThemeScopes() {
    let count = 0;
    for (const el of shifted) {
        const state = scopeState.get(el);
        const cacheKey = /** @type {any} */ (el).__themes?.cacheKey;
        if (state && state.cacheKey === cacheKey) {
            for (const [name, original] of Object.entries(state.originals)) {
                el.style.setProperty(name, original);
            }
            count++;
        }
        scopeState.delete(el);
    }
    shifted.clear();
    if (count) lcardsLog.debug(`[AlertThemeScopes] restored ${count} themed scope(s)`);
    return count;
}
