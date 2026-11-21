/**
 * D3b S1 + S2: sound overrides in the user and device scopes.
 *
 * S1: the backend's user/device set commands deep-merged the written value into
 * what was stored, so a smaller override map (one override removed, or all
 * cleared) kept the old keys and they came back on the next read. A scoped write
 * now replaces the key's value (`replace: true`, advertised by the backend as the
 * `scoped_storage_replace` capability).
 *
 * S2: a refused save still changed playback: the in-memory cache was written
 * before the save and never rolled back.
 */
import { describe, it, before } from 'node:test';
import assert from 'node:assert/strict';
import { createFakeHass } from '../helpers/fake-hass.js';
import { ScopedSettingsService } from '../../src/core/services/ScopedSettingsService.js';
import { SoundManager } from '../../src/core/sound/SoundManager.js';
import { STORAGE_KEY_SOUND_OVERRIDES } from '../../src/core/services/ScopedSettingsConstants.js';

const USER = { id: 'u1', name: 'User', is_admin: false };

/** storage.py `_deep_merge`: mappings merge recursively, everything else replaces. */
function deepMerge(base, override) {
    const out = { ...base };
    for (const [k, v] of Object.entries(override)) {
        const isMap = (x) => x !== null && typeof x === 'object' && !Array.isArray(x);
        out[k] = isMap(v) && isMap(out[k]) ? deepMerge(out[k], v) : v;
    }
    return out;
}

/**
 * A fake LCARdS backend for the scoped storage commands, with the semantics of
 * storage.py's async_deep_set (deep merge, or a top-level replace with `replace`).
 * @param {string[]} capabilities
 */
function backend(capabilities) {
    /** @type {Record<string, any>} */
    const store = {};
    const entity = (k) => (store[k] ??= {});
    const set = (k, data, replace) => {
        store[k] = replace ? { ...entity(k), ...data } : deepMerge(entity(k), data);
        return { ok: true };
    };
    const replies = (msg) => {
        switch (msg.type) {
            case 'lcards/storage/user/get': return { value: entity(`_user_${USER.id}`)[msg.key] ?? null };
            case 'lcards/storage/user/set': return set(`_user_${USER.id}`, msg.data, msg.replace);
            case 'lcards/storage/user/delete': delete entity(`_user_${USER.id}`)[msg.key]; return { ok: true };
            case 'lcards/storage/users/get': return { value: entity(`_user_${msg.user_id}`) };
            case 'lcards/storage/users/set': return set(`_user_${msg.user_id}`, msg.data, msg.replace);
            case 'lcards/storage/device/get': return { value: entity(`_device_${msg.device_id}`)[msg.key] ?? null };
            case 'lcards/storage/device/set': return set(`_device_${msg.device_id}`, msg.data, msg.replace);
            case 'lcards/storage/devices/set': return set(`_device_${msg.device_id}`, msg.data, msg.replace);
            default: return undefined;
        }
    };
    const hass = createFakeHass({ user: USER, replies });
    const integration = { available: true, capabilities: new Set(capabilities), async readStorage() { return null; } };
    const sss = new ScopedSettingsService();
    sss.updateHass(hass);
    globalThis.window.lcards = {
        core: { integrationService: integration, scopedSettingsService: sss, deviceIdentityManager: { getDeviceId: () => 'dev1' } },
    };
    const sm = new SoundManager();
    sm._core = { integrationService: integration, scopedSettingsService: sss };
    return { sm, sss, store, sent: hass.connection.sent };
}

const CAPS = ['scoped_storage', 'scoped_storage_replace'];

describe('removing user and device sound overrides (S1)', () => {
    before(() => { globalThis.window ??= /** @type {any} */ ({}); });

    for (const scope of /** @type {const} */ (['user', 'device'])) {
        const key = scope === 'user' ? `_user_${USER.id}` : '_device_dev1';

        it(`setOverride(event, null, '${scope}') removes that override in storage`, async () => {
            const { sm, store } = backend(CAPS);
            await sm.setOverride('card_tap', 'beep', scope);
            await sm.setOverride('card_hold', 'chirp', scope);
            assert.equal(await sm.setOverride('card_tap', null, scope), true);
            assert.deepEqual(store[key][STORAGE_KEY_SOUND_OVERRIDES], { card_hold: 'chirp' });
            await sm.refreshScopedCache();
            assert.deepEqual(sm.getOverrides(scope), { card_hold: 'chirp' }, 'it stays removed after a re-read');
        });

        it(`clearAllOverrides('${scope}') leaves no override in storage`, async () => {
            const { sm, store } = backend(CAPS);
            await sm.setOverride('card_tap', 'beep', scope);
            assert.equal(await sm.clearAllOverrides(scope), true);
            assert.deepEqual(store[key][STORAGE_KEY_SOUND_OVERRIDES], {});
            await sm.refreshScopedCache();
            assert.deepEqual(sm.getOverrides(scope), {});
        });
    }

    it('a scoped write replaces the value and keeps the other keys of the scope', async () => {
        const { sss, store, sent } = backend(CAPS);
        await sss.write('sound_volume', 0.5, 'user');
        await sss.write(STORAGE_KEY_SOUND_OVERRIDES, { a: 1, b: 2 }, 'user');
        await sss.write(STORAGE_KEY_SOUND_OVERRIDES, { b: 2 }, 'user');
        assert.deepEqual(store[`_user_${USER.id}`], { sound_volume: 0.5, sound_overrides: { b: 2 } });
        assert.ok(sent.filter(m => m.type === 'lcards/storage/user/set').every(m => m.replace === true));
    });

    it('admin writes to another user or device replace too', async () => {
        const { sss, store } = backend(CAPS);
        await sss.write('k', { a: 1, b: 2 }, 'user', { targetUserId: 'other' });
        await sss.write('k', { b: 2 }, 'user', { targetUserId: 'other' });
        await sss.write('k', { a: 1, b: 2 }, 'device', { targetDeviceId: 'dev2' });
        await sss.write('k', { b: 2 }, 'device', { targetDeviceId: 'dev2' });
        assert.deepEqual(store._user_other.k, { b: 2 });
        assert.deepEqual(store._device_dev2.k, { b: 2 });
    });

    it('an older backend without the capability gets no replace flag (it would refuse the unknown key)', async () => {
        const { sss, sent } = backend(['scoped_storage']);
        await sss.write('k', { a: 1 }, 'user');
        await sss.write('k', { a: 1 }, 'device');
        assert.ok(sent.every(m => !('replace' in m)));
    });
});

describe('a refused sound save leaves playback as it was (S2)', () => {
    /** @param {boolean} accept */
    function soundManager(accept) {
        const sm = new SoundManager();
        sm._core = {
            integrationService: { available: true },
            scopedSettingsService: { async write() { return accept; } },
        };
        return sm;
    }

    for (const scope of /** @type {const} */ (['global', 'user', 'device'])) {
        it(`a refused ${scope} save rolls the ${scope} cache back`, async () => {
            const sm = soundManager(true);
            await sm.setOverride('card_tap', 'beep', scope);
            sm._core.scopedSettingsService.write = async () => false;
            assert.equal(await sm.setOverride('card_tap', 'chirp', scope), false);
            assert.deepEqual(sm.getOverrides(scope), { card_tap: 'beep' });
            assert.equal(await sm.clearAllOverrides(scope), false);
            assert.deepEqual(sm.getOverrides(scope), { card_tap: 'beep' });
        });
    }

    it('the cache changes at once (synchronous readers see it) and stays on success', async () => {
        const sm = soundManager(true);
        const pending = sm.setOverride('card_tap', 'beep', 'user');
        assert.deepEqual(sm.getOverrides('user'), { card_tap: 'beep' });
        assert.equal(await pending, true);
        assert.deepEqual(sm.getOverrides('user'), { card_tap: 'beep' });
    });

    it('a failed save does not undo a later save that already landed', async () => {
        const sm = new SoundManager();
        /** @type {((ok: boolean) => void)[]} */
        const answers = [];
        sm._core = {
            integrationService: { available: true },
            scopedSettingsService: { write: () => new Promise(r => answers.push(r)) },
        };
        const first = sm.setOverride('card_tap', 'beep', 'user');
        const second = sm.setOverride('card_hold', 'chirp', 'user');
        answers[1](true);
        await second;
        answers[0](false);
        await first;
        assert.deepEqual(sm.getOverrides('user'), { card_tap: 'beep', card_hold: 'chirp' });
    });

    it('with no integration nothing is saved and the cache is unchanged', async () => {
        const sm = new SoundManager();
        sm._core = { integrationService: { available: false } };
        assert.equal(await sm.setOverride('card_tap', 'beep', 'user'), false);
        assert.deepEqual(sm.getOverrides('user'), {});
    });
});

describe('Sound tab per-event overrides go through the same replacing write (S1)', () => {
    let Tab;
    before(async () => {
        const { installJsdom } = await import('../helpers/jsdom-env.js');
        const env = installJsdom();
        for (const key of ['Document', 'ShadowRoot', 'Element', 'Node', 'CSSStyleSheet', 'MutationObserver', 'DocumentFragment', 'Event', 'CustomEvent']) {
            if (globalThis[key] === undefined && env.dom.window[key] !== undefined) globalThis[key] = env.dom.window[key];
        }
        ({ LCARdSSoundConfigTab: Tab } = await import('../../src/panels/components/lcards-sound-config-tab.js'));
    });

    /** A tab-like `this` with the real methods, editing `target` (null: your own). */
    function tab(scope, target) {
        const t = Object.create(Tab.prototype);
        const fields = {
            hass: { user: USER },
            _adminScopeUserId: scope === 'user' ? target : null,
            _adminScopeDeviceId: scope === 'device' ? target : null,
            _scopedOverrides: {},
            async _loadScopedOverrides() {},
            requestUpdate() {},
        };
        for (const [k, v] of Object.entries(fields)) {
            Object.defineProperty(t, k, { value: v, writable: true, configurable: true });
        }
        return t;
    }

    for (const [scope, target, key] of [
        ['user', null, `_user_${USER.id}`], ['user', 'other', '_user_other'],
        ['device', null, '_device_dev1'], ['device', 'dev2', '_device_dev2'],
    ]) {
        it(`${scope} ${target ? `(admin, ${target})` : '(own)'}: removing one override and then all of them`, async () => {
            const { store, sent } = backend(CAPS);
            window.lcards.core.soundManager = { async refreshScopedCache() {} };
            const t = tab(scope, target);
            await t._setScopedOverride('card_tap', 'beep', scope);
            t._scopedOverrides = { card_tap: 'beep' };
            await t._setScopedOverride('card_hold', '__mute__', scope);
            t._scopedOverrides = { card_tap: 'beep', card_hold: null };
            await t._setScopedOverride('card_tap', '__scheme__', scope);
            assert.deepEqual(store[key][STORAGE_KEY_SOUND_OVERRIDES], { card_hold: null });
            await t._clearAllScopedOverrides(scope);
            assert.equal(store[key][STORAGE_KEY_SOUND_OVERRIDES] ?? null, null);
            assert.equal(sent.filter(m => /set$/.test(m.type) && m.data?.[STORAGE_KEY_SOUND_OVERRIDES] === null).length, scope === 'device' || target ? 1 : 0,
                'one clear per scope: null for device and admin targets, a delete for your own user');
        });
    }
});
