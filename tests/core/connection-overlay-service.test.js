/**
 * D3b CO1-CO3: ConnectionOverlayService.
 *
 * CO2: the disconnect overlay passed `content` to the portal in every mode, so a
 *      card saved while in card mode still showed after switching to text mode
 *      (the reconnect path already checked `message.mode`).
 * CO3: in Borg mode the reconnect handler returned before refreshing the config
 *      from storage, so settings saved just before a restart stayed stale.
 * CO1: a non-admin's own-user save broadcasts reload_connection_config to their
 *      own user only (the backend lets a non-admin send exactly that; the Layer C
 *      test in tests/ha/ha.spec.js covers the backend side).
 * CO4: in Borg mode the forced paths (show(), and loadConfig() while the overlay is
 *      active) showed the standard overlay instead of the Borg assimilation.
 */
import { describe, it, beforeEach, mock } from 'node:test';
import assert from 'node:assert/strict';
import { createFakeHass } from '../helpers/fake-hass.js';
import { ConnectionOverlayService } from '../../src/core/services/ConnectionOverlayService.js';

const CARD = { type: 'markdown', content: 'down' };

/** @type {{ name: string, options: any }[]} */
let shown;
/** @type {string[]} */
let calls;

beforeEach(() => {
    shown = [];
    calls = [];
    globalThis.window.lcards = {
        core: {
            portalOverlayManager: {
                show: (name, options) => shown.push({ name, options }),
                hide: (name) => calls.push(`hide:${name}`),
                has: () => false,
            },
            borgAssimilationManager: {
                isAssimilated: true,
                assimilate() { calls.push('assimilate'); this.isAssimilated = true; },
                deassimilate() { calls.push('deassimilate'); this.isAssimilated = false; },
            },
        },
    };
});

/** A service with `message.mode` and a saved card (plus any other config keys). */
function service(mode, extra = {}) {
    const svc = new ConnectionOverlayService();
    svc._applyPartialConfig({ enabled: true, content: CARD, message: { mode }, ...extra });
    svc._configLoaded = true;
    return svc;
}

describe('disconnect overlay content follows message.mode (CO2)', () => {
    it('text mode shows the text, never the saved card', () => {
        service('text').show();
        assert.equal(shown.length, 1);
        assert.equal(shown[0].options.content, null);
        assert.equal(shown[0].options.text.mode, 'text');
    });

    it('card mode shows the card', () => {
        service('card').show();
        assert.deepEqual(shown[0].options.content, CARD);
    });
});

describe('reconnect refreshes the config in every mode (CO3)', () => {
    for (const mode of ['borg', 'text']) {
        it(`${mode} mode reloads the config after reconnecting`, () => {
            mock.timers.enable({ apis: ['setTimeout'] });
            try {
                const svc = service(mode);
                let loads = 0;
                svc.loadConfig = async () => { loads++; return svc._config; };
                svc._isActive = true;
                svc._doReconnected();
                assert.equal(loads, 1, 'reloaded at once');
                mock.timers.tick(8000);
                assert.equal(loads, 3, 'and retried twice');
                if (mode === 'borg') assert.deepEqual(calls, ['deassimilate']);
            } finally {
                mock.timers.reset();
            }
        });
    }
});

describe("a user's own save tells only their own sessions (CO1)", () => {
    const USER = { id: 'u1', name: 'User', is_admin: false };

    it('reload_connection_config targets the saving user and names the saving device', async () => {
        const hass = createFakeHass({ user: USER, replies: () => ({ ok: true }) });
        globalThis.window.lcards.core.scopedSettingsService = { async write() { return true; } };
        globalThis.window.lcards.core.deviceIdentityManager = { getDeviceId: () => 'dev1' };
        const svc = new ConnectionOverlayService();
        svc._hass = hass;
        svc.loadConfig = async () => svc._config;
        assert.equal(await svc.saveConfig({ enabled: true }, 'user'), true);
        const fire = hass.connection.sent.filter(m => m.type === 'lcards/fire_event');
        assert.deepEqual(fire, [{
            type: 'lcards/fire_event',
            action: 'reload_connection_config',
            data: { origin_device_id: 'dev1' },
            target_user_ids: ['u1'],
        }]);
    });

    it('a device-scope save of your own device broadcasts nothing', async () => {
        const hass = createFakeHass({ user: USER, replies: () => ({ ok: true }) });
        globalThis.window.lcards.core.scopedSettingsService = { async write() { return true; } };
        const svc = new ConnectionOverlayService();
        svc._hass = hass;
        svc.loadConfig = async () => svc._config;
        await svc.saveConfig({ enabled: true }, 'device');
        assert.deepEqual(hass.connection.sent.filter(m => m.type === 'lcards/fire_event'), []);
    });
});

describe('forced paths honour Borg mode like a real disconnect (CO4)', () => {
    /** @param {boolean} assimilated */
    const borgMgr = (assimilated) => {
        const m = globalThis.window.lcards.core.borgAssimilationManager;
        m.isAssimilated = assimilated;
        return m;
    };

    it('show() in Borg mode assimilates at once (no tolerance), never the standard overlay', () => {
        borgMgr(false);
        const svc = service('borg', { disconnect_delay_ms: 5000 });
        svc.show();
        assert.deepEqual(calls, ['assimilate']);
        assert.equal(shown.length, 0, 'no standard overlay');
        assert.equal(svc._isActive, true);
    });

    it('show() while already assimilated does not assimilate again', () => {
        borgMgr(true);
        service('borg').show();
        assert.deepEqual(calls, []);
        assert.equal(shown.length, 0);
    });

    it('hide() after a forced Borg show deassimilates', () => {
        borgMgr(false);
        const svc = service('borg');
        svc.show();
        svc.hide();
        assert.deepEqual(calls.filter(c => !c.startsWith('hide:')), ['assimilate', 'deassimilate']);
    });

    it('simulateReconnect() after a forced Borg show deassimilates (no reconnect banner)', () => {
        borgMgr(false);
        const events = [];
        const savedDoc = globalThis.document;
        globalThis.document = /** @type {any} */ ({ dispatchEvent: (e) => events.push(e.type) });
        try {
            const svc = service('borg', { reconnected: { enabled: true } });
            svc.show();
            svc.simulateReconnect();
            assert.deepEqual(calls, ['assimilate', 'deassimilate']);
            assert.equal(shown.length, 0, 'no reconnect banner in Borg mode');
            assert.deepEqual(events, ['lcards-connection-overlay-dismissed']);
        } finally {
            globalThis.document = savedDoc;
        }
    });

    it('loadConfig() while active in Borg mode assimilates and removes a standard overlay', async () => {
        borgMgr(false);
        // A standard overlay is up (text mode), then a broadcast switches to Borg mode
        globalThis.window.lcards.core.portalOverlayManager.has = () => true;
        globalThis.window.lcards.core.scopedSettingsService = {
            async read(key) { return key === 'conn_overlay_msg_mode' ? 'borg' : null; },
        };
        const svc = service('text');
        svc._isActive = true;
        await svc.loadConfig();
        assert.equal(svc._config.message.mode, 'borg');
        assert.equal(shown.length, 0, 'the standard overlay is not re-rendered');
        assert.deepEqual(calls, ['hide:connection-overlay', 'assimilate']);
    });

    it('a real disconnect in Borg mode still waits out the tolerance', () => {
        mock.timers.enable({ apis: ['setTimeout'] });
        try {
            borgMgr(false);
            const svc = service('borg', { disconnect_delay_ms: 3000 });
            svc._onDisconnected();
            assert.deepEqual(calls, []);
            mock.timers.tick(3000);
            assert.deepEqual(calls, ['assimilate']);
        } finally {
            mock.timers.reset();
        }
    });
});
