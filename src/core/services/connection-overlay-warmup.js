/**
 * @fileoverview Connection overlay warm-up: load what the overlay will need
 * while Home Assistant is still reachable.
 *
 * The overlay shows when the browser has lost Home Assistant, which is also
 * the server LCARdS is loaded from. Anything it fetches on demand at that point
 * fails: a lazy chunk (the Borg intro), a font file (the browser downloads a
 * face only when text is drawn in it), a sound, or the code and files of a card
 * shown in card mode. Issue #424: on a kiosk that had never played the Borg
 * intro, a real disconnect showed only the Borg colours.
 *
 * {@link collectOverlayNeeds} lists what a resolved overlay config uses (pure,
 * tested in node); {@link OverlayWarmup} loads it and keeps it in memory:
 *
 * - screen effect presets: their `preload()` (the module stays imported)
 * - fonts: `AssetManager.preloadFont()` (the face stays in `document.fonts`)
 * - sounds: `SoundManager.preloadEvent()` (a buffered `Audio` in its cache)
 * - cards: mounted once, invisible, so their code (Home Assistant's lazy card
 *   modules, LCARdS lazy chunks), fonts and files load; then removed
 *
 * @module core/services/connection-overlay-warmup
 */

import { lcardsLog } from '../../utils/lcards-logging.js';
import { createCardElement, applyHassToCard, applyCardConfig } from '../../utils/ha-card-factory.js';
import { mountDialogNearHomeAssistant } from '../../utils/lcards-shared-helpers.js';

/** The Borg intro's canvas preset (BorgAssimilationManager always uses it). */
const BORG_INTRO_PRESET = 'borg-assimilation';
/** The typeface the Borg mode swaps in (borgFontAssimilation.js). */
const BORG_FONT = 'lcards_borg';
/** Sound events a card plays when tapped (a card shown in card mode can be). */
const CARD_SOUND_EVENTS = ['card_tap', 'card_hold', 'card_double_tap'];
/** How long a warm-up card stays mounted for its lazy loads to start and finish. */
const CARD_SETTLE_MS = 3000;

/**
 * @typedef {Object} OverlayNeeds
 * @property {string[]} presets - screen effect preset names
 * @property {string[]} fonts - font keys (or CSS family names)
 * @property {string[]} soundEvents - SoundManager event types
 * @property {Object[]} cards - card configs
 */

/**
 * Add a layer config's preset (`{ preset, ...params }` or null).
 * @param {Set<string>} presets
 * @param {any} layer
 */
function addLayerPreset(presets, layer) {
    if (layer && typeof layer === 'object' && typeof layer.preset === 'string' && layer.preset) {
        presets.add(layer.preset);
    }
}

/**
 * Add a card config, unless it is empty.
 * @param {Object[]} cards
 * @param {any} card
 * @returns {boolean} whether a card was added
 */
function addCard(cards, card) {
    if (!card || typeof card !== 'object' || typeof card.type !== 'string' || !card.type) return false;
    cards.push(card);
    return true;
}

/**
 * What the overlay uses with this config, on a disconnect and on the reconnect
 * after it, for the mode it is set to. Nothing when the overlay is off.
 *
 * @param {Record<string, any>|null|undefined} cfg - resolved ConnectionOverlayService config
 * @returns {OverlayNeeds}
 */
export function collectOverlayNeeds(cfg) {
    /** @type {Set<string>} */ const presets = new Set();
    /** @type {Set<string>} */ const fonts = new Set();
    /** @type {Set<string>} */ const soundEvents = new Set();
    /** @type {Object[]} */ const cards = [];
    const needs = () => ({ presets: [...presets], fonts: [...fonts], soundEvents: [...soundEvents], cards });
    if (!cfg?.enabled) return needs();

    const message = cfg.message ?? {};
    const mode = message.mode ?? 'text';

    if (mode === 'borg') {
        // BorgAssimilationManager: the intro canvas, the layers beside it, the
        // typeface and both sounds. The reconnect deassimilates (no banner).
        const borg = message.borgLayers ?? {};
        presets.add(BORG_INTRO_PRESET);
        addLayerPreset(presets, borg.backdrop);
        addLayerPreset(presets, borg.color);
        if (borg.fontSwap !== false) fonts.add(BORG_FONT);
        soundEvents.add('borg_assimilate');
        soundEvents.add('borg_deassimilate');
        return needs();
    }

    // Text and card mode: the layers show on the disconnect and on the reconnect banner.
    const layers = cfg.layers ?? {};
    for (const slot of ['backdrop', 'color', 'canvas']) addLayerPreset(presets, layers[slot]);

    // A card that fails to mount falls back to the text, so the font is wanted either way.
    if (message.font) fonts.add(message.font);
    let hasCard = mode === 'card' && addCard(cards, cfg.content);

    const recon = cfg.reconnected ?? {};
    if (recon.enabled) {
        if (mode === 'card' && addCard(cards, recon.content)) hasCard = true;
        if (recon.font) fonts.add(recon.font);
    }

    if (hasCard) for (const event of CARD_SOUND_EVENTS) soundEvents.add(event);
    return needs();
}

/**
 * Loads what {@link collectOverlayNeeds} lists, once per thing: a repeated
 * warm-up only loads what is new or failed before.
 */
export class OverlayWarmup {
    constructor() {
        /** Card configs (JSON) mounted already. @type {Set<string>} */
        this._warmedCards = new Set();
        /** @type {Promise<{ loaded: string[], failed: string[] }> | null} */
        this._running = null;
    }

    /**
     * Load everything the config uses. Runs one at a time; a call during a run
     * waits for it and then runs again (the config may have changed).
     *
     * @param {Record<string, any>} cfg - resolved overlay config
     * @param {{ hass?: any }} [opts]
     * @returns {Promise<{ loaded: string[], failed: string[] }>} what loaded and what failed
     */
    async warm(cfg, opts = {}) {
        while (this._running) await this._running.catch(() => {});
        this._running = this._warm(cfg, opts);
        try {
            return await this._running;
        } finally {
            this._running = null;
        }
    }

    /**
     * @param {Record<string, any>} cfg
     * @param {{ hass?: any }} opts
     * @returns {Promise<{ loaded: string[], failed: string[] }>}
     * @private
     */
    async _warm(cfg, { hass } = {}) {
        const core = window.lcards?.core;
        const needs = collectOverlayNeeds(cfg);
        /** @type {string[]} */ const loaded = [];
        /** @type {string[]} */ const failed = [];

        /**
         * @param {string} label
         * @param {() => Promise<unknown>} load - resolves false (or throws) on failure
         */
        const run = async (label, load) => {
            try {
                const ok = await load();
                (ok === false ? failed : loaded).push(label);
            } catch (error) {
                failed.push(label);
                lcardsLog.debug(`[OverlayWarmup] ${label} did not load`, error);
            }
        };

        const sem = core?.screenEffectManager;
        const assets = core?.assetManager;
        const sounds = core?.soundManager;
        await Promise.all([
            ...needs.presets.map((name) => run(`preset:${name}`, async () => {
                if (!sem?.preloadPreset) return false;
                await sem.preloadPreset(name);
                return true;
            })),
            ...needs.fonts.map((key) => run(`font:${key}`, () => assets?.preloadFont ? assets.preloadFont(key) : Promise.resolve(false))),
            ...needs.soundEvents.map((event) => run(`sound:${event}`, () => sounds?.preloadEvent ? sounds.preloadEvent(event) : Promise.resolve(true))),
        ]);

        // Cards one after another: each is mounted for a few seconds.
        for (const card of needs.cards) {
            const key = JSON.stringify(card);
            if (this._warmedCards.has(key)) continue;
            await run(`card:${card.type}`, async () => {
                const ok = await this._warmCard(card, hass);
                if (ok) this._warmedCards.add(key);
                return ok;
            });
        }

        if (failed.length) {
            lcardsLog.debug('[OverlayWarmup] Not everything loaded (tried again later)', { loaded, failed });
        } else if (loaded.length) {
            lcardsLog.debug('[OverlayWarmup] Ready for a disconnect', { loaded });
        }
        return { loaded, failed };
    }

    /**
     * Mount a card where nobody sees it, give it time to load its code and files,
     * then remove it. Lit contexts need it near `<home-assistant>`; it stays in the
     * viewport (invisible) since some cards wait until they are on screen.
     *
     * @param {Object} card - card config
     * @param {any} hass
     * @returns {Promise<boolean>}
     * @private
     */
    async _warmCard(card, hass) {
        if (typeof document === 'undefined') return false;
        const el = /** @type {any} */ (await createCardElement(/** @type {any} */ (card).type, 'overlay-warmup'));
        if (!el) return false;

        const host = document.createElement('div');
        host.setAttribute('data-lcards-overlay-warmup', '');
        host.setAttribute('aria-hidden', 'true');
        host.inert = true;
        Object.assign(host.style, {
            position:      'fixed',
            left:          '0',
            top:           '0',
            width:         'min(100vw, 800px)',
            height:        'min(100vh, 600px)',
            opacity:       '0',
            pointerEvents: 'none',
            zIndex:        '-1',
            overflow:      'hidden',
        });
        mountDialogNearHomeAssistant(host);
        try {
            host.appendChild(el);
            if (hass) applyHassToCard(el, hass, 'overlay-warmup');
            await applyCardConfig(el, card, 'overlay-warmup');
            if (el.updateComplete) await el.updateComplete.catch(() => {});
            await new Promise((resolve) => setTimeout(resolve, CARD_SETTLE_MS));
            await document.fonts?.ready;
            return true;
        } finally {
            host.remove();
        }
    }
}
