/**
 * D3a: only a Home Assistant admin may write global LCARdS storage (the backend
 * refuses lcards/storage/set, delete, reset and dump for everyone else). Non-admins
 * keep their own user and device scopes, are never offered the Global scope, and a
 * refused write reports false instead of failing silently.
 */
import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { installJsdom } from '../helpers/jsdom-env.js';
import { createFakeHass } from '../helpers/fake-hass.js';
import { canWriteGlobalStorage, defaultSettingsScope } from '../../src/core/services/storage-permissions.js';
import { ScopedSettingsService } from '../../src/core/services/ScopedSettingsService.js';
import { SoundManager } from '../../src/core/sound/SoundManager.js';

const ADMIN = { id: 'admin', name: 'Admin', is_admin: true };
const USER = { id: 'u1', name: 'User', is_admin: false };

/** A ScopedSettingsService on a fake hass; every websocket reply succeeds. */
function scoped(user) {
    const hass = createFakeHass({ user, replies: () => ({ ok: true }) });
    const integration = {
        available: true,
        capabilities: new Set(['scoped_storage']),
        async writeStorage(updates) {
            await hass.connection.sendMessagePromise({ type: 'lcards/storage/set', data: updates });
            return true;
        },
        async deleteStorage(key) {
            await hass.connection.sendMessagePromise({ type: 'lcards/storage/delete', key });
            return true;
        },
    };
    globalThis.window.lcards = { core: { integrationService: integration, deviceIdentityManager: { getDeviceId: () => 'dev1' } } };
    const sss = new ScopedSettingsService();
    sss.updateHass(hass);
    return { sss, sent: hass.connection.sent };
}

describe('who may write global storage', () => {
    it('admins only; an unknown user counts as no', () => {
        assert.equal(canWriteGlobalStorage({ user: ADMIN }), true);
        assert.equal(canWriteGlobalStorage({ user: USER }), false);
        assert.equal(canWriteGlobalStorage(undefined), false);
        assert.equal(canWriteGlobalStorage({}), false);
    });

    it('settings tabs start on Global for admins, on the user scope otherwise', () => {
        assert.equal(defaultSettingsScope({ user: ADMIN }), 'global');
        assert.equal(defaultSettingsScope({ user: USER }), 'user');
        assert.equal(defaultSettingsScope(undefined), 'user');
    });
});

describe('ScopedSettingsService', () => {
    before(() => { globalThis.window ??= /** @type {any} */ ({}); });

    it('refuses a non-admin global write and clear without sending anything', async () => {
        const { sss, sent } = scoped(USER);
        assert.equal(await sss.write('k', 1, 'global'), false);
        assert.equal(await sss.clear('k', 'global'), false);
        assert.deepEqual(sent, []);
    });

    it('a non-admin still writes and clears their own user and device scopes', async () => {
        const { sss, sent } = scoped(USER);
        assert.equal(await sss.write('k', 1, 'user'), true);
        assert.equal(await sss.write('k', 2, 'device'), true);
        assert.equal(await sss.clear('k', 'user'), true);
        assert.deepEqual(sent.map(m => m.type), ['lcards/storage/user/set', 'lcards/storage/device/set', 'lcards/storage/user/delete']);
    });

    it('an admin writes and clears global', async () => {
        const { sss, sent } = scoped(ADMIN);
        assert.equal(await sss.write('k', 1, 'global'), true);
        assert.equal(await sss.clear('k', 'global'), true);
        assert.deepEqual(sent.map(m => m.type), ['lcards/storage/set', 'lcards/storage/delete']);
    });
});

describe('SoundManager override scopes (it treated every non-global scope as user)', () => {
    /** @param {(scope: string) => boolean} accept */
    function soundManager(accept) {
        const writes = [];
        const sm = new SoundManager();
        sm._core = {
            integrationService: { available: true },
            scopedSettingsService: { async write(key, value, scope) { writes.push({ key, value, scope }); return accept(scope); } },
        };
        return { sm, writes };
    }

    for (const scope of /** @type {const} */ (['global', 'user', 'device'])) {
        it(`setOverride writes the ${scope} cache and ${scope} storage`, async () => {
            const { sm, writes } = soundManager(() => true);
            assert.equal(await sm.setOverride('card_tap', 'beep', scope), true);
            assert.deepEqual(sm.getOverrides(scope), { card_tap: 'beep' });
            for (const other of ['global', 'user', 'device'].filter(s => s !== scope)) {
                assert.deepEqual(sm.getOverrides(other), {}, `${other} untouched`);
            }
            assert.equal(writes.length, 1);
            assert.equal(writes[0].scope, scope);
        });
    }

    it('a refused global save reports false', async () => {
        const { sm } = soundManager(scope => scope !== 'global');
        assert.equal(await sm.saveGlobalOverrides({ card_tap: 'beep' }), false);
        assert.equal(await sm.clearAllOverrides('global'), false);
        assert.equal(await sm.clearAllOverrides('user'), true);
    });
});

describe('scope selector', () => {
    let Selector, restore;
    before(async () => {
        const env = installJsdom();
        restore = env.restore;
        for (const key of ['Document', 'ShadowRoot', 'Element', 'Node', 'CSSStyleSheet', 'MutationObserver', 'DocumentFragment', 'Event', 'CustomEvent']) {
            if (globalThis[key] === undefined && env.dom.window[key] !== undefined) globalThis[key] = env.dom.window[key];
        }
        ({ LCARdSScopeSelector: Selector } = await import('../../src/panels/components/shared/lcards-scope-selector.js'));
    });
    after(() => restore?.());

    /** A selector-like `this` with the real methods (Lit setters need a constructed element). */
    function selector(user, showGlobal) {
        const el = Object.create(Selector.prototype);
        const events = [];
        for (const [k, v] of Object.entries({ hass: { user }, showGlobal, _scopeTab: 'user', _adminScopeUserId: null,
            _adminScopeDeviceId: null, _globalWasShown: false, _announcePending: false,
            dispatchEvent: (e) => events.push(e.detail) })) {
            Object.defineProperty(el, k, { value: v, writable: true, configurable: true, enumerable: true });
        }
        const update = () => { el.willUpdate(new Map([['hass', undefined], ['showGlobal', undefined]])); el.updated(); };
        return { el, events, update };
    }

    it('an admin gets Global first and the parent hears it (the theme browser kept saving to user)', () => {
        const { el, events, update } = selector(ADMIN, true);
        update();
        assert.equal(el._globalShown(), true);
        assert.equal(el.getCurrentScope().scope, 'global');
        assert.equal(events.at(-1)?.scope, 'global');
    });

    it('a non-admin never sees Global, even when the tab asks for it', () => {
        const { el, events, update } = selector(USER, true);
        update();
        assert.equal(el._globalShown(), false);
        assert.equal(el.getCurrentScope().scope, 'user');
        el.setScope('global');
        assert.equal(el.getCurrentScope().scope, 'user', 'setScope cannot force Global');
        assert.deepEqual(events, []);
    });

    it('losing admin while on Global falls back to user and tells the parent', () => {
        const { el, events, update } = selector(ADMIN, true);
        update();
        el.hass = { user: USER };
        update();
        assert.equal(el.getCurrentScope().scope, 'user');
        assert.equal(events.at(-1)?.scope, 'user');
    });
});

describe('sound config tab', () => {
    it('non-admins cannot edit the shared defaults and get the admin message on a refused save', async () => {
        installJsdom();
        const { LCARdSSoundConfigTab: Tab } = await import('../../src/panels/components/lcards-sound-config-tab.js');
        const { GLOBAL_WRITE_REFUSED_MSG } = await import('../../src/core/services/storage-permissions.js');
        const tab = (user) => {
            const t = Object.create(Tab.prototype);
            Object.defineProperty(t, 'hass', { value: { user }, writable: true, configurable: true });
            return t;
        };
        assert.equal(tab(ADMIN)._canEditGlobal(), true);
        assert.equal(tab(USER)._canEditGlobal(), false);
        assert.equal(tab(USER)._globalWriteError('Could not save.'), GLOBAL_WRITE_REFUSED_MSG);
        assert.equal(tab(ADMIN)._globalWriteError('Could not save.'), 'Could not save.');
    });
});
