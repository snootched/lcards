/**
 * @fileoverview Alert band (`lcards-alert-band`): the alert overlay's
 * `display: band` presentation.
 *
 * A row of short vertical dashes across the screen in the condition's colour,
 * with the alert emblem (or a custom card) in the middle. Mounted full-screen by
 * the alert overlay through PortalOverlayManager with `passThrough`, so the
 * dashboard under it stays usable: only the emblem takes clicks, and a click on
 * it fires `lcards-alert-band-dismiss`.
 *
 * Internal element, not a dashboard card: the overlay builds its config.
 *
 * @module cards/lcards-alert-band
 */

import { LitElement, html, svg, css, nothing } from 'lit';
import { createCardElement, applyHassToCard, applyCardConfig } from '../utils/ha-card-factory.js';
import { resolveColor } from '../core/themes/resolve-color.js';
import { BAND_DEFAULTS, BAND_CYCLE_MS, EMBLEM_ASPECT, bandCentreY, bandDashes, dashRadius, bandSpeed, sweepDelay, phasedStartTime } from './alert-band-layout.js';

/** Dash colour fallbacks when the theme has no alert token for the condition. */
const CONDITION_FALLBACKS = {
    red: 'var(--lcars-alert-red, #cc0000)',
    yellow: 'var(--lcars-alert-yellow, #ffcc00)',
    blue: 'var(--lcars-alert-blue, #0000ff)',
    gray: 'var(--lcards-gray, #6d748c)',
    black: 'var(--lcards-gray-dark, #2d2d2d)',
};

/** A finite number from config, else the default (0 is a valid value). */
const num = (value, fallback) => (Number.isFinite(Number(value)) && value !== '' && value !== null ? Number(value) : fallback);


export class LCARdSAlertBand extends LitElement {
    static get properties() {
        return {
            _size: { state: true },
        };
    }

    constructor() {
        super();
        /** @type {any} */
        this._config = null;
        this._hass = null;
        /** @type {{width: number, height: number, band: number}} */
        this._size = { width: 0, height: 0, band: 0 };
        /** @type {any} */
        this._emblemEl = null;
        /** @type {ResizeObserver|null} */
        this._resizeObserver = null;
        /** @type {Promise<void>|null} */
        this._mounting = null;
        this._emblemPending = false;
        /** @type {ReturnType<typeof setInterval>|null} */
        this._phaseTimer = null;
    }

    /**
     * @param {{band?: Object, condition?: string, emblem?: Object|null}} config
     *   band: resolved band settings; emblem: card config for the middle (null for none)
     */
    setConfig(config) {
        this._config = config ?? {};
        this._mountEmblem();
        this.requestUpdate();
    }

    set hass(value) {
        this._hass = value;
        if (this._emblemEl && value) applyHassToCard(this._emblemEl, value, 'alert-band');
    }

    get hass() {
        return this._hass;
    }

    connectedCallback() {
        super.connectedCallback();
        this._resizeObserver = new ResizeObserver(() => this._measure());
        this._resizeObserver.observe(this);
    }

    disconnectedCallback() {
        this._resizeObserver?.disconnect();
        this._resizeObserver = null;
        clearInterval(this._phaseTimer ?? undefined);
        this._phaseTimer = null;
        super.disconnectedCallback();
    }

    firstUpdated() {
        this._measure();
        this._mountEmblem();
    }

    /** Screen size and the band's pixel height (its CSS height measured). */
    _measure() {
        const probe = /** @type {HTMLElement|null} */ (this.renderRoot?.querySelector('.probe'));
        const width = this.clientWidth;
        const height = this.clientHeight;
        const band = probe?.offsetHeight ?? 0;
        const prev = this._size;
        if (width !== prev.width || height !== prev.height || band !== prev.band) {
            this._size = { width, height, band };
        }
    }

    get _band() {
        return { ...BAND_DEFAULTS, ...(this._config?.band ?? {}) };
    }

    /** The condition's colour (CSS, so alert-mode palette changes apply live). */
    get _color() {
        const band = this._band;
        if (band.color) return resolveColor(band.color);
        const name = String(this._config?.condition ?? 'red_alert').replace(/_alert$/, '');
        const fallback = CONDITION_FALLBACKS[name] ?? CONDITION_FALLBACKS.red;
        return resolveColor(`theme:base(colors.alert.${name})`, { fallback });
    }

    /** Mount (or update) the emblem card; concurrent calls share one run. */
    _mountEmblem() {
        this._mounting = (this._mounting ?? Promise.resolve()).then(() => this._doMountEmblem());
        return this._mounting;
    }

    async _doMountEmblem() {
        const slot = this.renderRoot?.querySelector('.emblem');
        const emblem = this._band.emblem === false ? null : this._config?.emblem;
        if (!slot) return;
        if (!emblem) {
            this._emblemEl?.remove();
            this._emblemEl = null;
            return;
        }
        const el = this._emblemEl?.localName === String(emblem.type).replace(/^custom:/, '')
            ? this._emblemEl
            : await createCardElement(emblem.type, 'alert-band-emblem');
        if (!el) return;
        if (el !== this._emblemEl) {
            this._emblemEl?.remove();
            this._emblemEl = el;
            slot.appendChild(el);
        }
        if (this._hass) applyHassToCard(el, this._hass, 'alert-band');
        await applyCardConfig(el, emblem, 'alert-band-emblem');
    }

    _dismiss() {
        this.dispatchEvent(new CustomEvent('lcards-alert-band-dismiss', { bubbles: true, composed: true }));
    }

    /** @param {KeyboardEvent} e */
    _onEmblemKey(e) {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            this._dismiss();
        }
    }

    render() {
        const band = this._band;
        const { width, height, band: bandHeight } = this._size;
        const hasEmblem = band.emblem !== false && !!this._config?.emblem;
        const dashWidth = num(band.dash_width, BAND_DEFAULTS.dash_width);
        const dashGap = num(band.dash_gap, BAND_DEFAULTS.dash_gap);
        const emblemHeight = hasEmblem ? bandHeight * num(band.emblem_scale, BAND_DEFAULTS.emblem_scale) : 0;
        const emblemWidth = emblemHeight * EMBLEM_ASPECT;
        const grow = Math.min(4, Math.max(1, num(band.grow, BAND_DEFAULTS.grow)));
        const centreY = bandCentreY(band.position, height, Math.max(emblemHeight, bandHeight * grow) / 2);
        const dashes = width && bandHeight
            ? bandDashes(width, { dashWidth, dashGap, centreGap: hasEmblem ? emblemWidth + 2 * (dashGap + 8) : 0 })
            : [];
        const maxStep = dashes.reduce((m, d) => Math.max(m, d.step), 0) || 1;
        const animation = ['sweep', 'flash', 'none'].includes(band.animation) ? band.animation : 'sweep';
        const radius = dashRadius(band.dash_radius, dashWidth, bandHeight);
        const cycle = Math.round(BAND_CYCLE_MS / bandSpeed(band.speed));
        const direction = band.direction === 'inward' ? 'inward' : 'outward';
        const delay = (/** @type {number} */ step) => (animation === 'sweep' ? sweepDelay(step, maxStep, direction, cycle) : 0);

        return html`
            <div class="probe" style="height: ${band.height}"></div>
            <div class="band" data-animation=${animation}
                style="--band-color: ${this._color}; --band-grow: ${grow}; --band-cycle: ${cycle}ms; top: ${centreY - bandHeight / 2}px; height: ${bandHeight}px">
                <svg class="dashes" width=${width} height=${bandHeight} viewBox="0 0 ${width || 1} ${bandHeight || 1}" aria-hidden="true">
                    ${dashes.map(d => svg`<rect class="dash" x=${d.x} y="0" width=${dashWidth} height=${bandHeight} rx=${radius} ry=${radius}
                        style="animation-delay: ${delay(d.step)}ms"></rect>`)}
                </svg>
            </div>
            ${hasEmblem ? html`
                <div class="emblem" role="button" tabindex="0" aria-label="Dismiss alert"
                    style="top: ${centreY - emblemHeight / 2}px; height: ${emblemHeight}px; width: ${emblemWidth}px; left: ${(width - emblemWidth) / 2}px"
                    @click=${this._dismiss} @keydown=${this._onEmblemKey}></div>
            ` : nothing}
        `;
    }

    updated() {
        // The emblem slot is re-created when the emblem is switched on; mount into it.
        const slot = this.renderRoot?.querySelector('.emblem');
        if (slot && this._emblemEl && this._emblemEl.parentElement !== slot) slot.appendChild(this._emblemEl);
        else if (slot && !this._emblemEl && this._config?.emblem && !this._emblemPending) {
            this._emblemPending = true;
            this._mountEmblem().finally(() => { this._emblemPending = false; });
        }
        // The probe height can change with the viewport (vh units).
        this._measure();
        this._syncPhase();
    }

    /**
     * band.phase: start the dashes' animations a set angle after the symbol's bar
     * sweep (same period). Re-checked every few seconds: the symbol re-creates its
     * bar animations when it re-renders (preset or config changes), and dashes
     * added on a resize start on their own.
     */
    _syncPhase() {
        const band = this._band;
        const wanted = band.phase !== null && band.phase !== undefined && band.animation !== 'none';
        if (!wanted) {
            clearInterval(this._phaseTimer ?? undefined);
            this._phaseTimer = null;
            return;
        }
        if (!this._phaseTimer) this._phaseTimer = setInterval(() => this._syncPhase(), 3000);

        const bar = this._emblemEl?.shadowRoot?.querySelector('#bar-1');
        const reference = bar?.getAnimations?.().find(a => a.startTime !== null);
        if (!reference) {
            // The symbol starts its sweep after it renders: try again shortly.
            setTimeout(() => this.isConnected && this._syncPhase(), 250);
            return;
        }
        const cycle = Math.round(BAND_CYCLE_MS / bandSpeed(band.speed));
        const animation = band.animation === 'flash' ? 'flash' : 'sweep';
        const start = phasedStartTime(Number(reference.startTime), band.phase, cycle, animation);
        for (const dash of this.renderRoot.querySelectorAll('.dash')) {
            for (const anim of dash.getAnimations()) {
                if (Math.abs(Number(anim.startTime) - start) > 1) anim.startTime = start;
            }
        }
    }

    static get styles() {
        return css`
            :host {
                display: block;
                position: relative;
                width: 100%;
                height: 100%;
                pointer-events: none;
            }
            .probe {
                position: absolute;
                visibility: hidden;
                width: 0;
            }
            .band {
                position: absolute;
                left: 0;
                right: 0;
            }
            .dashes {
                display: block;
                /* grow scales dashes past the band's height */
                overflow: visible;
            }
            .dash {
                fill: var(--band-color);
                transform-box: fill-box;
                transform-origin: center;
            }
            .band[data-animation='sweep'] .dash {
                animation: band-sweep var(--band-cycle) linear infinite;
            }
            .band[data-animation='flash'] .dash {
                animation: band-flash var(--band-cycle) ease-in-out infinite;
            }
            /* --band-grow (band.grow) is 1 unless set: the height swells with the flash */
            @keyframes band-sweep {
                0%, 30%, 100% { fill: var(--band-color); transform: scaleY(1); }
                8% { fill: color-mix(in srgb, var(--band-color) 35%, white); transform: scaleY(var(--band-grow)); }
            }
            @keyframes band-flash {
                0%, 100% { opacity: 1; transform: scaleY(var(--band-grow)); }
                50% { opacity: 0.35; transform: scaleY(1); }
            }
            @media (prefers-reduced-motion: reduce) {
                .band .dash {
                    animation: none !important;
                }
            }
            .emblem {
                position: absolute;
                display: flex;
                pointer-events: auto;
                cursor: pointer;
            }
            .emblem > * {
                width: 100%;
                height: 100%;
                aspect-ratio: unset !important;
                min-height: 0 !important;
            }
            .emblem:focus-visible {
                outline: var(--ha-border-width-md) solid var(--band-color);
                outline-offset: var(--ha-space-1);
            }
        `;
    }
}

// Internal element (not a dashboard card), so it registers itself like the editors
// do; lcards-alert-overlay.js imports this module.
if (!customElements.get('lcards-alert-band')) {
    customElements.define('lcards-alert-band', LCARdSAlertBand);
}
