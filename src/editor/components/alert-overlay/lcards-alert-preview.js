/**
 * @fileoverview The Alert Studio's mock screen: what the alert overlay shows for
 * one condition, without raising an alert (input_select.lcards_alert_mode is
 * never touched, nothing reaches the real screen).
 *
 * The inside is laid out at the real window's size and scaled down to the
 * frame, so %, px, vw and vh sizes come out as on the real screen. Behind the
 * alert: a stand-in dashboard (theme-coloured blocks), so blur and tint have
 * something to work on. In front: the screen effect layers (the real presets,
 * entered on elements inside the frame) and the content, built by the same
 * functions as the card (cards/alert-overlay-config.js): the alert symbol or a
 * custom card at the configured position and size, or the alert band.
 *
 * @element lcards-alert-preview
 */

import { LitElement, html, css } from 'lit';
import { lcardsLog } from '../../../utils/lcards-logging.js';
import { createCardElement, applyHassToCard, applyCardConfig } from '../../../utils/ha-card-factory.js';
import { POSITION_MAP } from '../../../core/services/PortalOverlayManager.js';
import { resolveBandConfig } from '../../../cards/alert-band-layout.js';
import {
    displayFor, overlayContentSize, overlayPosition, buildContentConfig, resolveLayers, bandLayers, resolveJinjaText,
} from '../../../cards/alert-overlay-config.js';
import '../../../cards/lcards-alert-band.js';

const LAYER_SLOTS = /** @type {const} */ (['backdrop', 'color', 'canvas']);

export class LCARdSAlertPreview extends LitElement {
    static get properties() {
        return {
            hass: { attribute: false },
            config: { attribute: false },
            /** The condition shown, e.g. 'red_alert' */
            condition: { type: String },
            /** A fixed screen to lay out on ({ width, height } px); unset, the real window (the studio) */
            screenSize: { attribute: false },
            /** Hidden by a dismiss in the preview (a click on the backdrop or the band's symbol) */
            _dismissed: { state: true },
            _scale: { state: true },
            _screen: { state: true },
        };
    }

    constructor() {
        super();
        /** @type {any} */
        this.hass = null;
        /** @type {any} */
        this.config = null;
        this.condition = 'red_alert';
        /** @type {{ width: number, height: number }|null} */
        this.screenSize = null;
        this._dismissed = false;
        this._scale = 0.5;
        this._screen = { width: window.innerWidth || 1600, height: window.innerHeight || 900 };
        /** @type {Array<() => void>} */
        this._cleanups = [];
        /** @type {HTMLElement|null} */
        this._contentEl = null;
        this._syncToken = 0;
        /** @type {ReturnType<typeof setTimeout>|null} */
        this._syncTimer = null;
        /** @type {ResizeObserver|null} */
        this._resizeObserver = null;
        this._onWindowResize = () => {
            if (!this.screenSize) this._screen = { width: window.innerWidth, height: window.innerHeight };
            this._measure();
        };
    }

    connectedCallback() {
        super.connectedCallback();
        window.addEventListener('resize', this._onWindowResize);
        this._resizeObserver = new ResizeObserver(() => this._measure());
        this.updateComplete.then(() => {
            const frame = this.renderRoot.querySelector('.frame');
            if (frame) this._resizeObserver?.observe(frame);
        });
    }

    disconnectedCallback() {
        window.removeEventListener('resize', this._onWindowResize);
        this._resizeObserver?.disconnect();
        this._resizeObserver = null;
        if (this._syncTimer) clearTimeout(this._syncTimer);
        this._clear();
        super.disconnectedCallback();
    }

    /**
     * The card API, so the preview mounts like a card (the docs site's live examples).
     * @param {any} config - An alert overlay config
     */
    setConfig(config) {
        this.config = config;
    }

    /** Show the alert again (after a dismiss, or to restart its animations). */
    replay() {
        this._dismissed = false;
        this._scheduleSync(0);
    }

    _measure() {
        const frame = /** @type {HTMLElement|null} */ (this.renderRoot.querySelector('.frame'));
        if (!frame?.clientWidth) return;
        this._scale = frame.clientWidth / this._screen.width;
    }

    willUpdate(changed) {
        if (changed.has('condition')) this._dismissed = false;
        if (changed.has('screenSize') && this.screenSize) this._screen = { ...this.screenSize };
    }

    updated(changed) {
        if (changed.has('_screen')) this._measure();
        if (changed.has('config') || changed.has('condition') || changed.has('_dismissed')) {
            this._scheduleSync(changed.has('condition') ? 0 : 150);
        } else if (changed.has('hass') && this._contentEl && this.hass) {
            applyHassToCard(this._contentEl, this.hass, 'alert-preview');
        }
    }

    /** @param {number} delay - Debounce for typing in the editor */
    _scheduleSync(delay) {
        if (this._syncTimer) clearTimeout(this._syncTimer);
        this._syncTimer = setTimeout(() => { this._syncTimer = null; this._sync(); }, delay);
    }

    /** Take down the content and the layers. */
    _clear() {
        for (const cleanup of this._cleanups) {
            try { cleanup(); } catch { /* a layer that failed to clean up leaves only styles on our own elements */ }
        }
        this._cleanups = [];
        this._contentEl?.remove();
        this._contentEl = null;
        for (const slot of LAYER_SLOTS) {
            const el = /** @type {HTMLElement|null} */ (this.renderRoot.querySelector(`.layer-${slot}`));
            if (!el) continue;
            el.replaceChildren();
            el.removeAttribute('style');
            // a canvas effect leaves its last frame in the buffer: resetting the size clears it
            if (el instanceof HTMLCanvasElement) { el.width = 1; el.height = 1; }
        }
    }

    /** Build the condition's alert inside the frame. */
    async _sync() {
        const token = ++this._syncToken;
        this._clear();
        const config = this.config ?? {};
        const condition = this.condition;
        if (this._dismissed) return;

        const content = buildContentConfig(config, condition);
        if (!content) return;
        const resolved = await resolveJinjaText(content, this.hass);
        if (token !== this._syncToken) return;

        const band = displayFor(config, condition) === 'band';
        const layers = band ? bandLayers(config, condition) : resolveLayers(config, condition);
        this._enterLayers(layers);

        const box = /** @type {HTMLElement|null} */ (this.renderRoot.querySelector('.content'));
        const wrap = /** @type {HTMLElement|null} */ (this.renderRoot.querySelector('.wrap'));
        if (!box || !wrap) return;
        const cardConfig = band
            ? { type: 'custom:lcards-alert-band', condition, band: resolveBandConfig(config, condition), emblem: resolved }
            : resolved;
        const pos = POSITION_MAP[band ? 'top-left' : overlayPosition(config, condition)] ?? POSITION_MAP.center;
        const size = band ? { width: '100%', height: '100%' } : overlayContentSize(config, condition);
        wrap.style.alignItems = pos.alignItems;
        wrap.style.justifyContent = pos.justifyContent;
        box.style.width = size.width;
        box.style.height = size.height;
        box.classList.toggle('auto-height', size.height === 'auto');
        box.classList.toggle('pass-through', band);

        const el = await createCardElement(cardConfig.type, 'alert-preview');
        if (token !== this._syncToken || !el) { el?.remove(); return; }
        this._contentEl = el;
        box.appendChild(el);
        if (this.hass) applyHassToCard(el, this.hass, 'alert-preview');
        await applyCardConfig(el, cardConfig, 'alert-preview');
    }

    /** @param {{ backdrop: any, color: any, canvas: any }|null} layers */
    _enterLayers(layers) {
        const sem = window.lcards?.core?.screenEffectManager;
        if (!layers || !sem) return;
        for (const slot of LAYER_SLOTS) {
            const cfg = layers[slot];
            if (!cfg?.preset) continue;
            const el = /** @type {HTMLElement|null} */ (this.renderRoot.querySelector(`.layer-${slot}`));
            if (!el) continue;
            const { preset, ...params } = cfg;
            const cleanup = sem.enterPreset(el, preset, params);
            if (cleanup) this._cleanups.push(cleanup);
            else lcardsLog.debug(`[AlertPreview] Layer '${preset}' not shown in the preview`);
        }
    }

    /** A click on the backdrop (overlay) dismisses; so does the band's symbol. Both only here. */
    _onBackdropClick() {
        if (displayFor(this.config, this.condition) === 'overlay') this._dismissed = true;
    }

    /** @param {Event} e */
    _onBandDismiss(e) {
        // The band fires this composed for the real overlay, which listens on window:
        // stop it here so a click in the preview never dismisses a live alert.
        e.stopPropagation();
        this._dismissed = true;
    }

    render() {
        const { width, height } = this._screen;
        return html`
            <div class="frame" style="aspect-ratio: ${width} / ${height}; width: min(100cqw, calc(100cqh * ${width / height}))">
                <div class="screen" style="width: ${width}px; height: ${height}px; transform: scale(${this._scale})"
                    @lcards-alert-band-dismiss=${this._onBandDismiss}>
                    ${this._renderDashboard()}
                    <div class="dismiss-target" @click=${this._onBackdropClick}></div>
                    <div class="layer layer-backdrop"></div>
                    <div class="layer layer-color"></div>
                    <!-- the canvas presets draw into a <canvas>, as in the real overlay's canvas slot -->
                    <canvas class="layer layer-canvas" width="1" height="1"></canvas>
                    <div class="wrap"><div class="content"></div></div>
                </div>
                ${this._dismissed ? html`
                    <div class="dismissed">
                        <span>Dismissed</span>
                        <ha-button size="s" @click=${() => this.replay()}>
                            <ha-icon icon="mdi:replay" slot="start"></ha-icon>
                            Show again
                        </ha-button>
                    </div>` : ''}
            </div>
        `;
    }

    /** A stand-in dashboard: an LCARS frame and some panels, in theme colours. */
    _renderDashboard() {
        return html`
            <div class="dash" aria-hidden="true">
                <div class="dash-top"><div class="elbow"></div><div class="bar b1"></div><div class="bar b2"></div><div class="bar b3"></div></div>
                <div class="dash-side">
                    ${[1, 2, 3, 4, 5, 6].map((i) => html`<div class="pill p${i % 3}"></div>`)}
                </div>
                <div class="dash-main">
                    ${[1, 2, 3, 4, 5, 6].map((i) => html`<div class="panel"><div class="panel-head h${i % 3}"></div><div class="panel-body"></div></div>`)}
                </div>
            </div>
        `;
    }

    static get styles() {
        return css`
            /* Fills its box (the studio's preview stage); the frame fits inside it at the screen's aspect ratio */
            :host {
                display: flex;
                align-items: center;
                justify-content: center;
                container-type: size;
            }
            .frame {
                position: relative;
                flex: none;
                overflow: hidden;
                border-radius: var(--ha-border-radius-md);
                border: var(--ha-border-width-sm) solid var(--divider-color);
                background: var(--primary-background-color);
            }
            .screen {
                position: absolute;
                top: 0;
                left: 0;
                transform-origin: 0 0;
                overflow: hidden;
                background: var(--primary-background-color);
            }
            .dash {
                position: absolute;
                inset: 0;
                display: grid;
                grid-template-columns: 220px 1fr;
                grid-template-rows: 120px 1fr;
                gap: 16px;
                padding: 24px;
            }
            .dash-top {
                grid-column: 1 / -1;
                display: flex;
                gap: 8px;
                align-items: flex-start;
            }
            .elbow {
                width: 220px;
                height: 100px;
                border-top-left-radius: 70px;
                background: var(--lcards-orange);
            }
            .bar {
                height: 32px;
                border-radius: 0 var(--ha-border-radius-pill) var(--ha-border-radius-pill) 0;
            }
            .b1 { flex: 2; background: var(--lcards-blue); }
            .b2 { flex: 1; background: var(--lcards-orange); }
            .b3 { flex: 3; background: var(--lcards-gray); }
            .dash-side {
                display: flex;
                flex-direction: column;
                gap: 8px;
            }
            .pill {
                height: 56px;
                border-radius: var(--ha-border-radius-pill);
            }
            .p0 { background: var(--lcards-orange); }
            .p1 { background: var(--lcards-blue); }
            .p2 { background: var(--lcards-gray); }
            .dash-main {
                display: grid;
                grid-template-columns: repeat(3, 1fr);
                gap: 16px;
                align-content: start;
            }
            .panel {
                height: 220px;
                border-radius: var(--ha-border-radius-lg);
                border: var(--ha-border-width-md) solid var(--lcards-gray);
                overflow: hidden;
            }
            .panel-head { height: 36px; }
            .h0 { background: var(--lcards-orange); }
            .h1 { background: var(--lcards-blue); }
            .h2 { background: var(--lcards-gray); }
            .dismiss-target, .layer, .wrap {
                position: absolute;
                inset: 0;
            }
            .layer { pointer-events: none; }
            /* As the real slot: the buffer size changes, the box stays the whole screen */
            canvas.layer {
                width: 100%;
                height: 100%;
            }
            .wrap {
                display: flex;
                pointer-events: none;
            }
            .content {
                display: flex;
                align-items: stretch;
                pointer-events: auto;
            }
            .content.pass-through { pointer-events: none; }
            /* As the portal: fill a definite box; with height auto keep the card's aspect ratio */
            .content > * {
                width: 100% !important;
                min-height: 0 !important;
            }
            .content:not(.auto-height) > * {
                height: 100% !important;
                aspect-ratio: unset !important;
            }
            .content.auto-height > * {
                height: auto !important;
            }
            .dismissed {
                position: absolute;
                inset: 0;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                gap: var(--ha-space-2);
                color: var(--secondary-text-color);
            }
        `;
    }
}

if (!customElements.get('lcards-alert-preview')) customElements.define('lcards-alert-preview', LCARdSAlertPreview);
