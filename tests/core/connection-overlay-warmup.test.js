/**
 * Issue #424: the connection overlay loads what it needs while Home Assistant
 * is reachable. On a real disconnect the server is gone, so the Borg intro's
 * lazy chunk, the Borg font, sounds and a card-mode card could not be fetched
 * (a kiosk that had never played the intro showed only the Borg colours).
 *
 * The browser side (everything loaded, then played with /lcards/ blocked) is
 * tests/browser/connection-overlay-offline.spec.js.
 */
import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { collectOverlayNeeds, OverlayWarmup } from '../../src/core/services/connection-overlay-warmup.js';
import { ConnectionOverlayService } from '../../src/core/services/ConnectionOverlayService.js';
import { SoundManager } from '../../src/core/sound/SoundManager.js';

const CARD = { type: 'markdown', content: 'down' };
const RECON_CARD = { type: 'markdown', content: 'back' };

/** A resolved config: the service's defaults with `partial` merged in. */
function config(partial) {
    const svc = new ConnectionOverlayService();
    svc._applyPartialConfig({ enabled: true, ...partial });
    return svc.getConfig();
}

describe('collectOverlayNeeds: what each mode uses', () => {
    it('nothing while the overlay is off', () => {
        const needs = collectOverlayNeeds(config({ enabled: false, message: { mode: 'borg' } }));
        assert.deepEqual(needs, { presets: [], fonts: [], soundEvents: [], cards: [] });
    });

    it('Borg mode: the intro preset, its layers, the Borg font and both sounds', () => {
        const needs = collectOverlayNeeds(config({ message: { mode: 'borg' } }));
        assert.deepEqual(needs.presets.sort(), ['borg-assimilation', 'color-tint', 'saturate']);
        assert.deepEqual(needs.fonts, ['lcards_borg']);
        assert.deepEqual(needs.soundEvents.sort(), ['borg_assimilate', 'borg_deassimilate']);
        assert.deepEqual(needs.cards, []);
    });

    it('Borg mode without the font swap needs no Borg font', () => {
        const needs = collectOverlayNeeds(config({
            message: { mode: 'borg', borgLayers: { canvas: { preset: 'borg-assimilation' }, fontSwap: false } },
        }));
        assert.deepEqual(needs.fonts, []);
        assert.deepEqual(needs.presets, ['borg-assimilation']);
    });

    it('text mode: the layers and both message fonts, never a saved card', () => {
        const needs = collectOverlayNeeds(config({
            content: CARD,
            message: { mode: 'text', font: 'lcards_jefferies' },
            reconnected: { enabled: true, font: 'lcards_tng_titles', content: RECON_CARD },
            layers: { backdrop: { preset: 'blur' }, color: { preset: 'color-tint' }, canvas: { preset: 'glitch' } },
        }));
        assert.deepEqual(needs.presets.sort(), ['blur', 'color-tint', 'glitch']);
        assert.deepEqual(needs.fonts, ['lcards_jefferies', 'lcards_tng_titles']);
        assert.deepEqual(needs.cards, []);
        assert.deepEqual(needs.soundEvents, []);
    });

    it('no reconnect font when the reconnect banner is off', () => {
        const needs = collectOverlayNeeds(config({
            message: { mode: 'text', font: 'lcards_jefferies' },
            reconnected: { enabled: false, font: 'lcards_tng_titles' },
        }));
        assert.deepEqual(needs.fonts, ['lcards_jefferies']);
    });

    it('card mode: both cards, the text font they fall back to and the tap sounds', () => {
        const needs = collectOverlayNeeds(config({
            content: CARD,
            message: { mode: 'card', font: 'Antonio' },
            reconnected: { enabled: true, content: RECON_CARD },
        }));
        assert.deepEqual(needs.cards, [CARD, RECON_CARD]);
        assert.ok(needs.fonts.includes('Antonio'));
        assert.deepEqual(needs.soundEvents.sort(), ['card_double_tap', 'card_hold', 'card_tap']);
    });

    it('card mode without a card needs no card sounds', () => {
        const needs = collectOverlayNeeds(config({ message: { mode: 'card' } }));
        assert.deepEqual(needs.cards, []);
        assert.deepEqual(needs.soundEvents, []);
    });
});

describe('OverlayWarmup loads what is listed', () => {
    /** @type {string[]} */
    let calls;
    /** @type {Set<string>} */
    let failing;

    beforeEach(() => {
        calls = [];
        failing = new Set();
        globalThis.window.lcards = {
            core: {
                screenEffectManager: {
                    preloadPreset: async (name) => {
                        calls.push(`preset:${name}`);
                        if (failing.has(name)) throw new Error('offline');
                    },
                },
                assetManager: { preloadFont: async (key) => { calls.push(`font:${key}`); return !failing.has(key); } },
                soundManager: { preloadEvent: async (event) => { calls.push(`sound:${event}`); return !failing.has(event); } },
            },
        };
    });

    it('Borg mode loads the intro, the font and the sounds', async () => {
        const warmup = new OverlayWarmup();
        const result = await warmup.warm(config({ message: { mode: 'borg' } }));
        for (const label of ['preset:borg-assimilation', 'font:lcards_borg', 'sound:borg_assimilate', 'sound:borg_deassimilate']) {
            assert.ok(calls.includes(label), label);
            assert.ok(result.loaded.includes(label), label);
        }
        assert.deepEqual(result.failed, []);
    });

    it('reports what failed, so the service tries again', async () => {
        failing.add('borg-assimilation').add('lcards_borg');
        const result = await new OverlayWarmup().warm(config({ message: { mode: 'borg' } }));
        assert.deepEqual(result.failed.sort(), ['font:lcards_borg', 'preset:borg-assimilation']);
    });

    it('mounts each card once; a failed card is tried again', async () => {
        const warmup = new OverlayWarmup();
        /** @type {string[]} */
        const mounted = [];
        let fail = true;
        warmup._warmCard = async (card) => { mounted.push(card.content); return !fail; };
        const cfg = config({ content: CARD, message: { mode: 'card' }, reconnected: { enabled: true, content: RECON_CARD } });

        const first = await warmup.warm(cfg);
        assert.deepEqual(first.failed, ['card:markdown', 'card:markdown']);
        fail = false;
        await warmup.warm(cfg);
        await warmup.warm(cfg);
        assert.deepEqual(mounted, ['down', 'back', 'down', 'back']);
    });

    it('a call during a run waits for it, then runs on the newer config', async () => {
        const warmup = new OverlayWarmup();
        const a = warmup.warm(config({ message: { mode: 'text', font: 'first' } }));
        const b = warmup.warm(config({ message: { mode: 'text', font: 'second' } }));
        await Promise.all([a, b]);
        assert.ok(calls.indexOf('font:first') < calls.indexOf('font:second'));
    });
});

describe('ConnectionOverlayService.warmUp', () => {
    /** @param {Record<string, any>} partial */
    function service(partial) {
        const svc = new ConnectionOverlayService();
        svc._applyPartialConfig({ enabled: true, ...partial });
        svc._configLoaded = true;
        svc._hass = { connected: true };
        /** @type {any[]} */
        const warmed = [];
        svc._warmup = /** @type {any} */ ({ warm: async (cfg) => { warmed.push(cfg); return { loaded: [], failed: [] }; } });
        return { svc, warmed };
    }

    it('warms the config in effect', async () => {
        const { svc, warmed } = service({ message: { mode: 'borg' } });
        await svc.warmUp();
        assert.equal(warmed.length, 1);
        assert.equal(warmed[0].message.mode, 'borg');
    });

    it('does nothing with the overlay off, while disconnected, or before hass', async () => {
        const off = service({ enabled: false });
        await off.svc.warmUp();
        assert.equal(off.warmed.length, 0);

        const down = service({});
        down.svc._isConnected = false;
        await down.svc.warmUp();
        assert.equal(down.warmed.length, 0);

        const early = service({});
        early.svc._hass = null;
        await early.svc.warmUp();
        assert.equal(early.warmed.length, 0);
    });

    it('during a Test preview, warms the saved config', async () => {
        const { svc, warmed } = service({ message: { mode: 'text' } });
        globalThis.window.lcards = { core: { portalOverlayManager: { show() {}, hide() {}, has: () => false } } };
        svc.showWith({ enabled: true, message: { mode: 'borg' } });
        svc._isDisconnected = false; // the preview marks it; a warm-up runs while connected
        await svc.warmUp();
        assert.equal(warmed[0].message.mode, 'text');
    });
});

describe('SoundManager: preloads and offline playback', () => {
    /** @param {Record<string, any>} scheme */
    function manager(scheme) {
        const sm = new SoundManager();
        sm._isEnabled = () => true;
        sm._isCategoryEnabled = () => true;
        sm._getOverrides = () => ({});
        sm._getActiveScheme = () => scheme;
        return sm;
    }

    it('a silent event has nothing to load', async () => {
        const sm = manager({ borg_assimilate: null });
        assert.equal(sm._resolveEventAsset('borg_assimilate'), null);
        assert.equal(await sm.preloadEvent('borg_assimilate'), true);
    });

    it('play() and the preload pick the same sound', () => {
        const sm = manager({ borg_assimilate: 'borg_hail' });
        /** @type {string[]} */
        const played = [];
        sm._playAsset = (key) => played.push(key);
        sm.play('borg_assimilate');
        assert.deepEqual(played, ['borg_hail']);
        assert.equal(sm._resolveEventAsset('borg_assimilate'), 'borg_hail');
        sm._isEnabled = () => false;
        assert.equal(sm._resolveEventAsset('borg_assimilate'), null);
    });

    it('a media-source sound that cannot be resolved plays the preloaded copy', async () => {
        const sm = manager({});
        sm._core = { assetManager: { resolveMediaSourceUrl: async () => null } };
        let played = 0;
        sm._audioCache.set('media-source://media_source/local/borg.mp3', /** @type {any} */ ({
            volume: 1, currentTime: 5, play: async () => { played++; },
        }));
        await sm._playMediaSourceAsset('media-source://media_source/local/borg.mp3');
        assert.equal(played, 1);
    });
});
