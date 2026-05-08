/**
 * @fileoverview PortalOverlayManager — Shared portal overlay lifecycle engine.
 *
 * A core singleton service that manages named overlay slots in the
 * ScreenEffectManager's shared `position:fixed` portal div.
 *
 * ## Responsibilities
 *
 * - **Named slot registry**: each caller owns a named slot (e.g.
 *   `'connection-overlay'`, `'alert-overlay'`, `'ha-service'`).  Slots are
 *   independent; a new `show()` call with an existing name replaces that slot
 *   (last-in-wins).
 *
 * - **DOM lifecycle**: creates and destroys the `dismissEl` / `wrapperEl` /
 *   `contentContainer` / `portalStyleEl` elements that previously lived
 *   duplicated inside `ConnectionOverlayService` and `lcards-alert-overlay`.
 *
 * - **SEM integration**: acquires the SEM portal, manages `setOverlayOccupied`,
 *   and applies per-slot layer configs.  Only the most-recently-shown slot
 *   with `layers` owns the SEM slots at any time (`_semOwner` tracks this).
 *
 * - **Card mounting**: mounts arbitrary HA card YAML via `createCardElement`,
 *   `applyCardConfig`, and `applyHassToCard` (the same utilities used by both
 *   previous consumers).
 *
 * - **Text fallback**: renders a styled plain-text div when `text` is provided
 *   and `content` is `null`.
 *
 * - **HASS propagation**: `updateHass()` (called by lcards-core) pushes the
 *   latest HASS object to all mounted content cards across all active slots.
 *
 * - **Duration auto-dismiss**: if `options.duration` is provided, the slot is
 *   automatically hidden after that many milliseconds.
 *
 * ## Stacking policy
 *
 * Three fixed named slots are used by built-in consumers:
 *   - `'alert-overlay'`      — owned by `lcards-alert-overlay` card
 *   - `'connection-overlay'` — owned by `ConnectionOverlayService`
 *   - `'ha-service'`         — owned by the `show_portal_card` HA service
 *
 * Slots are independent for DOM purposes; only SEM effect slots have a single
 * owner at a time.  Calling `show(name, { layers })` evicts the previous SEM
 * owner.
 *
 * @module core/services/PortalOverlayManager
 */

import { lcardsLog } from '../../utils/lcards-logging.js';
import { BaseService } from '../BaseService.js';
import { createCardElement, applyHassToCard, applyCardConfig } from '../../utils/ha-card-factory.js';

// ---------------------------------------------------------------------------
// Position → flex alignment mapping
// ---------------------------------------------------------------------------

const POSITION_MAP = {
    'top-left':      { alignItems: 'flex-start', justifyContent: 'flex-start' },
    'top':           { alignItems: 'flex-start', justifyContent: 'center' },
    'top-center':    { alignItems: 'flex-start', justifyContent: 'center' },
    'top-right':     { alignItems: 'flex-start', justifyContent: 'flex-end' },
    'left':          { alignItems: 'center',     justifyContent: 'flex-start' },
    'left-center':   { alignItems: 'center',     justifyContent: 'flex-start' },
    'center':        { alignItems: 'center',     justifyContent: 'center' },
    'right':         { alignItems: 'center',     justifyContent: 'flex-end' },
    'right-center':  { alignItems: 'center',     justifyContent: 'flex-end' },
    'bottom-left':   { alignItems: 'flex-end',   justifyContent: 'flex-start' },
    'bottom':        { alignItems: 'flex-end',   justifyContent: 'center' },
    'bottom-center': { alignItems: 'flex-end',   justifyContent: 'center' },
    'bottom-right':  { alignItems: 'flex-end',   justifyContent: 'flex-end' },
};

// ---------------------------------------------------------------------------
// PortalOverlayManager
// ---------------------------------------------------------------------------

export class PortalOverlayManager extends BaseService {

    constructor() {
        super();

        /**
         * Active named slots.
         * Map<string, SlotState> where SlotState = {
         *   dismissEl, wrapperEl, contentContainer, contentElement,
         *   portalStyleEl, ownsSemSlots, options, durationTimer
         * }
         */
        this._slots = new Map();

        /**
         * Name of the slot that currently owns the SEM effect slots.
         * Only one slot can own SEM at a time (last-in-wins when layers are
         * supplied).  `null` when no slot owns SEM effects.
         */
        this._semOwner = null;

        /**
         * Most recent HASS object — propagated to all mounted content cards
         * whenever updateHass() is called.
         */
        this._hass = null;

        lcardsLog.debug('[PortalOverlayManager] Created');
    }

    // -------------------------------------------------------------------------
    // BaseService lifecycle
    // -------------------------------------------------------------------------

    updateHass(hass) {
        if (!hass) return;
        this._hass = hass;
        for (const slot of this._slots.values()) {
            if (slot.contentElement) {
                applyHassToCard(slot.contentElement, hass, 'pom-hass');
            }
        }
    }

    // -------------------------------------------------------------------------
    // Public API
    // -------------------------------------------------------------------------

    /**
     * Show a named portal overlay slot.  If the name is already active,
     * the existing slot is torn down and replaced (last-in-wins).
     *
     * The DOM structure is created synchronously; card mounting is async and
     * fire-and-forget (callers do not need to await this method).
     *
     * @param {string} name - Slot identifier (e.g. `'connection-overlay'`).
     * @param {object} [options]
     * @param {string}   [options.position='center']  - POSITION_MAP key.
     * @param {string}   [options.width='auto']       - CSS width for contentContainer.
     * @param {string}   [options.height='auto']      - CSS height for contentContainer.
     * @param {boolean}  [options.dismiss=true]       - Whether backdrop clicks dismiss.
     * @param {Function} [options.onDismiss=null]     - Called before hide() on dismiss.
     * @param {Object}   [options.content=null]       - HA card config object to mount.
     * @param {Object}   [options.text=null]          - Text fallback config:
     *   `{ text, color, font, size, weight, transform }`.
     * @param {Object}   [options.layers=null]        - SEM layer config:
     *   `{ backdrop, color, canvas }` — each slot: `{ preset, ...params }` or `null`.
     * @param {number}   [options.duration=null]      - Auto-hide after N ms.
     */
    show(name, options = {}) {
        const sem = window.lcards?.core?.screenEffectManager;
        if (!sem) {
            lcardsLog.error('[PortalOverlayManager] ScreenEffectManager unavailable — cannot show overlay');
            return;
        }

        // Tear down existing slot with same name (last-in-wins), keeping the
        // portal occupied since we are about to replace it immediately.
        if (this._slots.has(name)) {
            this._destroySlot(name, { releaseSemOccupied: false });
        }

        sem.setOverlayOccupied(true);
        const portal = sem.portal;

        // ── Dismiss click-catcher (z:10) ──────────────────────────────────────
        const dismissEl = document.createElement('div');
        Object.assign(dismissEl.style, {
            position:      'absolute',
            inset:         '0',
            zIndex:        '10',
            pointerEvents: options.dismiss ? 'auto' : 'none',
            cursor:        options.dismiss ? 'pointer' : 'default',
        });

        // ── Content wrapper (z:11) ────────────────────────────────────────────
        const wrapperEl = document.createElement('div');
        Object.assign(wrapperEl.style, {
            position:      'absolute',
            inset:         '0',
            zIndex:        '11',
            display:       'flex',
            pointerEvents: 'none',
        });

        // ── Content container ─────────────────────────────────────────────────
        // Display as flex so the mounted card child stretches to fill the
        // explicit width/height.  Without this, a block-level child with
        // aspect-ratio (set by lcards-button) ignores the container height.
        const contentContainer = document.createElement('div');
        Object.assign(contentContainer.style, {
            pointerEvents: 'auto',
            display:       'flex',
            alignItems:    'stretch',
        });

        // ── Stylesheet: override inline aspect-ratio on mounted cards ─────────
        // lcards-button re-applies aspect-ratio on every render; a <style> tag
        // with !important beats inline styles without JS intervention per frame.
        const attrName = `data-lcards-pom-content-${name}`;
        const portalStyleEl = document.createElement('style');
        portalStyleEl.dataset.lcardsPortalSlot = name;
        portalStyleEl.textContent = [
            `[${attrName}] {`,
            '  aspect-ratio: unset !important;',
            '  width:        100%   !important;',
            '  height:       100%   !important;',
            '  min-height:   0      !important;',
            '}',
        ].join('\n');
        document.head.appendChild(portalStyleEl);

        // ── Layout: position + size ───────────────────────────────────────────
        const pos = POSITION_MAP[options.position ?? 'center'] ?? POSITION_MAP['center'];
        wrapperEl.style.alignItems     = pos.alignItems;
        wrapperEl.style.justifyContent = pos.justifyContent;
        contentContainer.style.width   = options.width  ?? 'auto';
        contentContainer.style.height  = options.height ?? 'auto';

        // ── Dismiss handler ───────────────────────────────────────────────────
        dismissEl.addEventListener('click', () => {
            options.onDismiss?.();
            this.hide(name);
        });

        // ── Assemble DOM ──────────────────────────────────────────────────────
        wrapperEl.appendChild(contentContainer);
        portal.appendChild(dismissEl);
        portal.appendChild(wrapperEl);

        // ── SEM layers ────────────────────────────────────────────────────────
        let ownsSemSlots = false;
        if (options.layers && typeof options.layers === 'object') {
            // Evict the previous SEM owner if it is a different slot.
            if (this._semOwner !== null && this._semOwner !== name) {
                const prevSlot = this._slots.get(this._semOwner);
                if (prevSlot) prevSlot.ownsSemSlots = false;
            }
            // Clear all three SEM slots, then apply the configured ones.
            sem.clearSlot('backdrop');
            sem.clearSlot('color');
            sem.clearSlot('canvas');
            for (const [slot, layerCfg] of Object.entries(options.layers)) {
                if (layerCfg?.preset) {
                    const { preset, ...params } = layerCfg;
                    sem.applySlot(slot, preset, params);
                }
            }
            this._semOwner = name;
            ownsSemSlots = true;
        }

        // ── Build slot state (before async card mount) ────────────────────────
        const slotState = {
            dismissEl,
            wrapperEl,
            contentContainer,
            contentElement:  null,
            portalStyleEl,
            ownsSemSlots,
            options:         { ...options },
            durationTimer:   null,
        };
        this._slots.set(name, slotState);

        // ── Duration auto-dismiss ─────────────────────────────────────────────
        if (options.duration) {
            slotState.durationTimer = setTimeout(() => {
                slotState.durationTimer = null;
                this.hide(name);
            }, options.duration);
        }

        // ── Async card mount (fire-and-forget) ────────────────────────────────
        this._mountContent(name, options, slotState);

        lcardsLog.debug(`[PortalOverlayManager] Slot '${name}' shown`);
    }

    /**
     * Hide (teardown) a named slot.  Idempotent — safe to call on a slot that
     * is not active.
     *
     * @param {string} name - Slot identifier.
     */
    hide(name) {
        if (!this._slots.has(name)) return;
        this._destroySlot(name, { releaseSemOccupied: true });
        lcardsLog.debug(`[PortalOverlayManager] Slot '${name}' hidden`);
    }

    /**
     * Hide all active slots.
     */
    hideAll() {
        for (const name of [...this._slots.keys()]) {
            // Use releaseSemOccupied: false for all but the last to avoid
            // intermediate sem.setOverlayOccupied(false) calls.
            this._destroySlot(name, { releaseSemOccupied: false });
        }
        const sem = window.lcards?.core?.screenEffectManager;
        sem?.setOverlayOccupied(false);
        this._semOwner = null;
        lcardsLog.debug('[PortalOverlayManager] All slots hidden');
    }

    /**
     * Returns true if the named slot is currently active.
     *
     * @param {string} name
     * @returns {boolean}
     */
    has(name) {
        return this._slots.has(name);
    }

    // -------------------------------------------------------------------------
    // Internal — slot teardown
    // -------------------------------------------------------------------------

    /**
     * Synchronously tear down a named slot.
     *
     * @param {string}  name
     * @param {object}  opts
     * @param {boolean} opts.releaseSemOccupied - Call sem.setOverlayOccupied(false) if
     *   this is the last slot.  Pass `false` when immediately replacing the slot.
     * @private
     */
    _destroySlot(name, { releaseSemOccupied = false } = {}) {
        const slot = this._slots.get(name);
        if (!slot) return;

        // Clear duration timer.
        if (slot.durationTimer !== null) {
            clearTimeout(slot.durationTimer);
            slot.durationTimer = null;
        }

        // Unmount content card.
        if (slot.contentElement) {
            slot.contentElement.remove();
            slot.contentElement = null;
        }

        // Release SEM effect slots owned by this slot.
        const sem = window.lcards?.core?.screenEffectManager;
        if (sem && slot.ownsSemSlots) {
            sem.clearSlot('backdrop');
            sem.clearSlot('color');
            sem.clearSlot('canvas');
            slot.ownsSemSlots = false;
        }
        if (this._semOwner === name) {
            this._semOwner = null;
        }

        // Remove DOM elements.
        slot.dismissEl?.remove();
        slot.wrapperEl?.remove();
        slot.portalStyleEl?.remove();

        // Remove from registry.
        this._slots.delete(name);

        // Release SEM occupied flag only when this was the last active slot.
        if (releaseSemOccupied && this._slots.size === 0) {
            sem?.setOverlayOccupied(false);
        }
    }

    // -------------------------------------------------------------------------
    // Internal — async content mounting
    // -------------------------------------------------------------------------

    /**
     * Mount an HA card element or render a text fallback inside the slot's
     * content container.  Fire-and-forget — guards against slot replacement
     * or teardown that may occur during the async card creation.
     *
     * @param {string}    name
     * @param {object}    options
     * @param {SlotState} slotState - The slot state object created by show().
     * @private
     */
    async _mountContent(name, options, slotState) {
        const { content, text } = options;

        if (content) {
            // Mount HA card element.
            const el = await createCardElement(content.type, `pom-${name}`);

            if (!el) {
                lcardsLog.warn(`[PortalOverlayManager] Failed to create card element for slot '${name}' type:`, content.type);
                // Fall back to text if provided.
                const currentSlot = this._slots.get(name);
                if (currentSlot === slotState && text) {
                    this._renderTextFallback(slotState, text);
                }
                return;
            }

            // Guard: the slot may have been replaced or hidden while awaiting
            // card element creation.  Discard the stale element.
            const currentSlot = this._slots.get(name);
            if (currentSlot !== slotState || !slotState.contentContainer) {
                el.remove();
                lcardsLog.debug(`[PortalOverlayManager] Slot '${name}' changed during card creation — element discarded`);
                return;
            }

            // ── Attach to DOM BEFORE applyCardConfig ──────────────────────────
            // LCARdS cards initialize singletons in connectedCallback /
            // firstUpdated.  Attaching first ensures setConfig lands on a
            // fully-initialised card.
            slotState.contentElement = el;
            el.setAttribute(`data-lcards-pom-content-${name}`, '');
            slotState.contentContainer.appendChild(el);

            // Apply HASS first (required before setConfig on some card types).
            if (this._hass) {
                applyHassToCard(el, this._hass, `pom-${name}-mount`);
            }

            await applyCardConfig(el, content, `pom-${name}`);

        } else if (text) {
            // Render text fallback.
            const currentSlot = this._slots.get(name);
            if (currentSlot !== slotState) return;
            this._renderTextFallback(slotState, text);
        }
    }

    // -------------------------------------------------------------------------
    // Internal — helpers
    // -------------------------------------------------------------------------

    /**
     * Render a styled plain-text element into the slot's content container.
     * Uses only inline styles so it works during disconnection when CSS vars
     * may not resolve.
     *
     * @param {SlotState} slotState
     * @param {object}    textCfg - `{ text, color, font, size, weight, transform }`
     * @private
     */
    _renderTextFallback(slotState, textCfg) {
        if (!slotState.contentContainer) return;
        slotState.contentContainer.innerHTML = '';
        const msg = document.createElement('div');
        Object.assign(msg.style, {
            color:         textCfg.color     || '#93e1ff',
            fontFamily:    this._resolveFontCssFamily(textCfg.font),
            fontSize:      textCfg.size ? `${textCfg.size}px` : '26px',
            fontWeight:    textCfg.weight    || '400',
            letterSpacing: '0.12em',
            textTransform: textCfg.transform || 'uppercase',
            padding:       '2rem',
            userSelect:    'none',
        });
        msg.textContent = textCfg.text || '';
        slotState.contentContainer.appendChild(msg);
    }

    /**
     * Resolve a font key to a CSS font-family string via the AssetManager.
     * Falls back gracefully when the registry is unavailable.
     *
     * @param {string} fontKey - Font registry key (e.g. `'Antonio'`).
     * @returns {string} CSS font-family value.
     * @private
     */
    _resolveFontCssFamily(fontKey) {
        if (!fontKey) return 'Antonio, sans-serif';
        try {
            const asset = window.lcards?.core?.assetManager
                              ?.getRegistry('font')?.assets?.get(fontKey);
            return asset?.metadata?.family ?? `${fontKey}, sans-serif`;
        } catch {
            return `${fontKey}, sans-serif`;
        }
    }
}
