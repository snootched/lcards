/**
 * Config Panel sound tab: a staged override edit survives hass updates (any entity
 * changing state used to reload the list from storage and drop the edit about two
 * seconds after it was made); switching the scheme still discards it.
 */
import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { installJsdom } from '../helpers/jsdom-env.js';

let Tab, restore;

before(async () => {
    const env = installJsdom();
    restore = env.restore;
    for (const key of ['Document', 'ShadowRoot', 'Element', 'Node', 'CSSStyleSheet', 'MutationObserver', 'DocumentFragment', 'Event', 'CustomEvent']) {
        if (globalThis[key] === undefined && env.dom.window[key] !== undefined) globalThis[key] = env.dom.window[key];
    }
    ({ LCARdSSoundConfigTab: Tab } = await import('../../src/panels/components/lcards-sound-config-tab.js'));
});
after(() => restore?.());

/** A tab-like `this` with the real methods, fake core services and a scheme helper. */
function fakeTab() {
    let scheme = 'lcards_default';
    window.lcards = {
        core: {
            helperManager: {
                getHelpersByCategory: () => [{ key: 'sound_scheme', entity_id: 'input_select.lcards_sound_scheme', default_value: 'lcards_default' }],
                getHelperValue: () => scheme,
            },
            soundManager: {
                getSchemeNames: () => ['lcards_default', 'other'],
                getEventTypes: () => [{ key: 'borg_assimilate', label: 'Borg assimilation', category: 'alerts' }],
                isCustomScheme: () => false,
                getOverrides: () => ({}),
            },
        },
    };
    const tab = Object.create(Tab.prototype);
    // Own plain properties: Lit's reactive setters need a constructed element
    for (const [k, v] of Object.entries({ hass: undefined, _helpers: [], _overrides: {}, _overridesDirty: false,
        _overridesScheme: undefined, _schemeNames: [], _eventTypes: [], _audioAssets: [], requestUpdate() {} })) {
        Object.defineProperty(tab, k, { value: v, writable: true, configurable: true, enumerable: true });
    }
    const hassUpdate = () => {
        tab.hass = { states: { 'input_select.lcards_sound_scheme': { state: scheme } } };
        tab._refresh();
    };
    return { tab, hassUpdate, setScheme: (s) => { scheme = s; } };
}

describe('sound config tab staging', () => {
    it('a staged edit survives later hass updates', () => {
        const { tab, hassUpdate } = fakeTab();
        hassUpdate();
        tab._setOverride('borg_assimilate', '/local/sounds/borg.mp3');
        hassUpdate();
        hassUpdate();
        assert.deepEqual(tab._overrides, { borg_assimilate: '/local/sounds/borg.mp3' });
        assert.equal(tab._overridesDirty, true);
    });

    it('switching the scheme discards staged edits', () => {
        const { tab, hassUpdate, setScheme } = fakeTab();
        hassUpdate();
        tab._setOverride('borg_assimilate', '/local/sounds/borg.mp3');
        setScheme('other');
        hassUpdate();
        assert.deepEqual(tab._overrides, {});
        assert.equal(tab._overridesDirty, false);
    });
});
