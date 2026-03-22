/**
 * HA Card Factory
 *
 * Shared utilities for creating and managing embedded Home Assistant cards.
 * Used by MSD controls (MsdControlsRenderer) and symbiont embedding (LCARdSElbow).
 *
 * Centralises three concerns that were previously duplicated:
 *   1. Card type normalisation  (custom: prefix, hui-* mapping)
 *   2. Element creation         (3-strategy with upgrade wait)
 *   3. HASS / config application (per card-type strategy)
 */

import { lcardsLog } from './lcards-logging.js';

// ─────────────────────────────────────────────────────────────────────────────
// Type normalisation
// ─────────────────────────────────────────────────────────────────────────────

/**
 * All known built-in HA card type → element name mappings.
 *
 * Keep in sync with MsdControlsRenderer._normalizeCardType().
 * This is the single authoritative source going forward.
 */
const BUILTIN_CARD_MAP = {
    // Entity display
    'entities':            'hui-entities-card',
    'entity':              'hui-entity-card',
    'glance':              'hui-glance-card',
    'grid':                'hui-grid-card',
    'tile':                'hui-tile-card',

    // Layout
    'horizontal-stack':    'hui-horizontal-stack-card',
    'vertical-stack':      'hui-vertical-stack-card',

    // Entity control
    'button':              'hui-button-card',
    'light':               'hui-light-card',
    'thermostat':          'hui-thermostat-card',
    'gauge':               'hui-gauge-card',
    'sensor':              'hui-sensor-card',
    'switch':              'hui-switch-card',
    'binary-sensor':       'hui-binary-sensor-card',
    'cover':               'hui-cover-card',
    'fan':                 'hui-fan-card',
    'climate':             'hui-climate-card',
    'humidifier':          'hui-humidifier-card',
    'lock':                'hui-lock-card',
    'vacuum':              'hui-vacuum-card',
    'water-heater':        'hui-water-heater-card',
    'input-number':        'hui-input-number-card',
    'input-select':        'hui-input-select-card',
    'input-text':          'hui-input-text-card',

    // Visualisation
    'history-graph':       'hui-history-graph-card',
    'statistics-graph':    'hui-statistics-graph-card',
    'energy':              'hui-energy-card',
    'picture':             'hui-picture-card',
    'picture-entity':      'hui-picture-entity-card',
    'picture-glance':      'hui-picture-glance-card',
    'picture-elements':    'hui-picture-elements-card',

    // Utility
    'conditional':         'hui-conditional-card',
    'markdown':            'hui-markdown-card',
    'media-control':       'hui-media-control-card',
    'alarm-panel':         'hui-alarm-panel-card',
    'weather-forecast':    'hui-weather-forecast-card',
    'shopping-list':       'hui-shopping-list-card',
    'logbook':             'hui-logbook-card',
    'map':                 'hui-map-card',
    'iframe':              'hui-iframe-card',
    'area':                'hui-area-card',
};

/**
 * Normalise a card type string to its HTML element name.
 * - Strips 'custom:' prefix from custom cards
 * - Maps HA built-in short names (e.g. 'light') to 'hui-*'
 *
 * @param {string} cardType - Raw card type from config
 * @returns {string|null} Element tag name, or null if falsy input
 */
export function normalizeHACardType(cardType) {
    if (!cardType) return null;
    if (cardType.startsWith('custom:')) return cardType.slice(7);
    return BUILTIN_CARD_MAP[cardType] ?? cardType;
}

// ─────────────────────────────────────────────────────────────────────────────
// Element creation
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Wait for a custom element to be upgraded (setConfig becomes available).
 *
 * Polls every 100 ms up to maxWait ms. Also tries customElements.upgrade()
 * and awaits updateComplete if present.
 *
 * @param {any} element
 * @param {number} [maxWait=2000]
 * @returns {Promise<any>} Same element (upgraded or timed-out)
 */
export async function waitForElementUpgrade(element, maxWait = 2000) {
    const start = Date.now();
    while (Date.now() - start < maxWait) {
        if (typeof element.setConfig === 'function') return element;

        if (element.updateComplete) {
            try { await element.updateComplete; } catch (_) { /* ignore */ }
            if (typeof element.setConfig === 'function') return element;
        }

        if (window.customElements?.upgrade) {
            try { window.customElements.upgrade(element); } catch (_) { /* ignore */ }
            if (typeof element.setConfig === 'function') return element;
        }

        await new Promise(r => setTimeout(r, 100));
    }

    lcardsLog.debug(`[HACardFactory] upgrade timeout for <${element.tagName?.toLowerCase()}>` +
                    ` after ${maxWait}ms. setConfig=${typeof element.setConfig}`);
    return element;
}

/**
 * Create a Home Assistant card element using a 3-strategy fallback chain.
 *
 * Strategy 1 — customElements.get() constructor (fastest, zero wait)
 * Strategy 2 — document.createElement + upgrade wait (standard path)
 * Strategy 3 — body-attached createElement (forces upgrade for lazy hui-* cards)
 *
 * The returned element is ready to receive HASS and setConfig.
 * Returns null only if all three strategies fail.
 *
 * @param {string} cardType   - Raw card type (e.g. 'tile', 'custom:my-card')
 * @param {string} [label]    - Debug label shown in log messages
 * @returns {Promise<HTMLElement|null>}
 */
export async function createCardElement(cardType, label = 'card') {
    const normalizedType = normalizeHACardType(cardType);
    if (!normalizedType) {
        lcardsLog.warn(`[HACardFactory] ${label}: null/empty card type`);
        return null;
    }

    const isHuiCard     = normalizedType.startsWith('hui-');
    const isLCARdSCard  = normalizedType.startsWith('lcards-');

    // ── Strategy 1: customElements.get() constructor ────────────────────────
    if (window.customElements && typeof window.customElements.get === 'function') {
        try {
            const CardClass = window.customElements.get(normalizedType);
            if (CardClass) {
                const el = new CardClass();
                lcardsLog.debug(`[HACardFactory] ${label}: ✅ S1 constructor: ${normalizedType}`);
                return el;
            }
        } catch (e) {
            lcardsLog.debug(`[HACardFactory] ${label}: S1 failed: ${e.message}`);
        }
    }

    // ── Strategy 2: document.createElement + upgrade wait ───────────────────
    try {
        const el = /** @type {any} */ (document.createElement(normalizedType));

        // LCARdS cards are already registered — no meaningful upgrade wait needed
        if (isLCARdSCard) {
            if (el.tagName.toLowerCase() === normalizedType) {
                lcardsLog.debug(`[HACardFactory] ${label}: ✅ S2 lcards createElement: ${normalizedType}`);
                return el;
            }
        } else {
            const timeout = isHuiCard ? 500 : 500;
            await waitForElementUpgrade(el, timeout);
            if (typeof el.setConfig === 'function') {
                lcardsLog.debug(`[HACardFactory] ${label}: ✅ S2 createElement: ${normalizedType}`);
                return el;
            }
        }
    } catch (e) {
        lcardsLog.debug(`[HACardFactory] ${label}: S2 failed: ${e.message}`);
    }

    // ── Strategy 3: body attachment (forces upgrade for lazy hui-* elements) ─
    try {
        const el = /** @type {any} */ (document.createElement(normalizedType));
        const tmp = document.createElement('div');
        tmp.style.cssText = 'position:absolute;left:-10000px;visibility:hidden;';
        document.body.appendChild(tmp);
        tmp.appendChild(el);

        await waitForElementUpgrade(el, 500);

        el.remove();
        tmp.remove();

        if (typeof el.setConfig === 'function') {
            lcardsLog.debug(`[HACardFactory] ${label}: ✅ S3 body-attached: ${normalizedType}`);
            return el;
        }
        lcardsLog.debug(`[HACardFactory] ${label}: S3 partial — element created but no setConfig: ${normalizedType}`);
        // Return element anyway; it may become ready after being added to real DOM
        return el;
    } catch (e) {
        lcardsLog.debug(`[HACardFactory] ${label}: S3 failed: ${e.message}`);
    }

    lcardsLog.warn(`[HACardFactory] ${label}: ❌ all strategies failed for: ${normalizedType}`);
    return null;
}

// ─────────────────────────────────────────────────────────────────────────────
// HASS application
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Apply a HASS object to a card element using the most appropriate strategy
 * for the card type.
 *
 * - hui-*   cards:  setHass() preferred, property assignment as fallback
 * - lcards-* cards: property assignment + requestUpdate (Lit reactive)
 * - unknown:        setHass() → property assignment
 *
 * @param {any}      cardElement
 * @param {any}      hass
 * @param {string}      [label]
 */
export function applyHassToCard(cardElement, hass, label = 'card') {
    if (!cardElement || !hass) return;

    const tag      = cardElement.tagName?.toLowerCase() ?? '';
    const isHui    = tag.startsWith('hui-');
    const isLCards = tag.startsWith('lcards-');
    const oldHass  = cardElement.hass;

    try {
        if (isHui) {
            if (typeof cardElement.setHass === 'function') {
                cardElement.setHass(hass);
            } else {
                cardElement.hass = hass;
                cardElement.requestUpdate?.('hass', oldHass);
            }
        } else if (isLCards) {
            cardElement.hass  = hass;
            cardElement._hass = hass;
            cardElement.requestUpdate?.('hass', oldHass);
        } else {
            // Unknown card type — prefer setHass, fall back to property
            if (typeof cardElement.setHass === 'function') {
                cardElement.setHass(hass);
            } else {
                cardElement.hass  = hass;
                cardElement._hass = hass;
                cardElement.requestUpdate?.('hass', oldHass);
            }
        }
    } catch (e) {
        lcardsLog.warn(`[HACardFactory] ${label}: applyHassToCard failed: ${e.message}`);
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// Config application
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Apply a config object to a card element with retry logic.
 *
 * Retries up to maxAttempts times, waiting progressively longer between
 * attempts, to handle elements that are still upgrading.
 *
 * @param {any} cardElement
 * @param {Object}      config
 * @param {string}      [label]
 * @param {number}      [maxAttempts=8]
 * @returns {Promise<boolean>} true if setConfig was called successfully
 */
export async function applyCardConfig(cardElement, config, label = 'card', maxAttempts = 8) {
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
        if (typeof cardElement.setConfig === 'function') {
            try {
                cardElement.setConfig(config);
                lcardsLog.debug(`[HACardFactory] ${label}: config applied on attempt ${attempt + 1}`);
                return true;
            } catch (e) {
                lcardsLog.warn(`[HACardFactory] ${label}: setConfig threw: ${e.message}`);
                return false;
            }
        }
        await new Promise(r => setTimeout(r, 100 * (attempt + 1)));
    }
    lcardsLog.warn(`[HACardFactory] ${label}: setConfig not available after ${maxAttempts} attempts`);
    return false;
}

// ─────────────────────────────────────────────────────────────────────────────
// card-mod detection
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Returns true if card-mod is loaded in the current HA instance.
 *
 * Checks for both the legacy 'card-mod' element and the newer
 * 'card-mod-element' registration used by recent card-mod versions.
 *
 * @returns {boolean}
 */
export function isCardModAvailable() {
    return !!(
        window.customElements?.get('card-mod') ||
        window.customElements?.get('card-mod-element')
    );
}
