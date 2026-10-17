/**
 * @fileoverview LCARdS card Theme tab (Main Engineering > Theme)
 *
 * The theme tokens this card uses, each with its value on the card and the
 * fields using it (from the card's provenance, live). The whole token tree,
 * alert mode lab, overrides and packs live in the LCARdS config panel's Theme
 * Studio and Pack Explorer; the launcher opens them in a new browser tab so the
 * editor stays open.
 *
 * @element lcards-card-theme-tab
 * @property {Object} config - The card config
 * @property {Object} hass
 */

import { LitElement, html, css, nothing } from 'lit';
import { styleMap } from 'lit/directives/style-map.js';
import { lcardsLog } from '../../../utils/lcards-logging.js';
import { copyTextToClipboard } from '../../../utils/clipboard-utils.js';
import { messageStyles } from '../../base/surface-styles.js';
import { renderLauncher, launcherStyles } from '../shared/launcher.js';
import { isCssColor } from '../../../core/themes/color-syntax.js';

/** The LCARdS config panel (custom_components/lcards/__init__.py frontend_url_path). */
export const CONFIG_PANEL_PATH = '/lcards-config';

const looksLikeColour = isCssColor;

/** A token's final value as the card sees it (the resolution chain's last value). */
export function tokenValue(token) {
    const chain = token?.resolution_chain ?? [];
    const last = [...chain].reverse().find(s => s.step === 'value');
    return last?.value ?? token?.resolved_value;
}

/** The card's theme tokens from its provenance, sorted by path. */
export function cardTokens(provenance) {
    return Object.entries(provenance?.theme_tokens ?? {})
        .map(([path, info]) => ({ path, value: tokenValue(info), fields: info.used_by_fields ?? [], overridden: (info.resolution_chain ?? []).some(s => s.step === 'override') }))
        .sort((a, b) => a.path.localeCompare(b.path));
}

export class LCARdSCardThemeTab extends LitElement {
    static get properties() {
        return {
            config: { type: Object },
            hass: { type: Object },
            _provenance: { type: Object, state: true },
            _cardFound: { type: Boolean, state: true },
        };
    }

    constructor() {
        super();
        /** @type {any} */
        this.config = undefined;
        /** @type {any} */
        this.hass = undefined;
        this._provenance = null;
        this._cardFound = false;
        this._card = null;
        this._unsubscribe = null;
    }

    static get styles() {
        return [messageStyles, launcherStyles, css`
            :host {
                display: block;
            }

            .tokens {
                display: flex;
                flex-direction: column;
                background: var(--primary-background-color);
                border-radius: var(--ha-border-radius-lg);
                padding: var(--ha-space-1) var(--ha-space-4);
            }

            .token {
                display: flex;
                align-items: center;
                gap: var(--ha-space-3);
                padding: var(--ha-space-2) 0;
                border-bottom: var(--ha-border-width-sm) solid var(--divider-color);
            }

            .token:last-child {
                border-bottom: none;
            }

            .swatch {
                flex: none;
                width: 24px;
                height: 24px;
                border-radius: var(--ha-border-radius-sm);
                border: var(--ha-border-width-sm) solid var(--divider-color);
            }

            .swatch.none {
                display: flex;
                align-items: center;
                justify-content: center;
                border: none;
                color: var(--secondary-text-color);
                --mdc-icon-size: 18px;
            }

            .main {
                flex: 1;
                min-width: 0;
                display: flex;
                flex-direction: column;
                gap: 2px;
            }

            .path {
                font-family: var(--code-font-family, monospace);
                font-size: 13px;
                font-weight: 600;
                color: var(--primary-text-color);
                overflow-wrap: anywhere;
            }

            .sub {
                font-size: 12px;
                color: var(--secondary-text-color);
                overflow-wrap: anywhere;
            }

            .sub code {
                font-family: var(--code-font-family, monospace);
            }

            .chip {
                padding: 1px var(--ha-space-2);
                border-radius: var(--ha-border-radius-pill);
                font-size: 12px;
                font-weight: 600;
                background: color-mix(in srgb, var(--warning-color) 22%, transparent);
                color: var(--primary-text-color);
                white-space: nowrap;
            }

            ha-icon-button {
                --ha-icon-button-size: 32px;
                --mdc-icon-size: 18px;
                color: var(--primary-color);
            }

            .empty {
                margin: 0;
            }
        `];
    }

    disconnectedCallback() {
        super.disconnectedCallback();
        this._unsubscribe?.();
        this._unsubscribe = null;
        this._card = null;
    }

    updated(changed) {
        if (changed.has('config')) this._load();
    }

    /** Follow the card rendered from this config (the editor preview). */
    _load() {
        let card = null;
        try {
            card = this.config ? window.lcards?.findCardByConfig?.(this.config) : null;
        } catch (error) {
            lcardsLog.debug('[CardThemeTab] No card for this config', { error: error?.message });
        }
        if (typeof card?.getProvenance !== 'function') card = null;
        if (card !== this._card) {
            this._unsubscribe?.();
            this._unsubscribe = card?.subscribeProvenance?.(() => this._read()) ?? null;
            this._card = card;
        }
        this._read();
    }

    _read() {
        this._cardFound = !!this._card;
        this._provenance = this._card ? this._card.getProvenance() : null;
    }

    /** Open a config panel tab in a new browser tab (navigating here would close the editor). */
    _openPanel(tab) {
        window.open(`${CONFIG_PANEL_PATH}?tab=${tab}`, '_blank', 'noopener');
    }

    render() {
        const tokens = cardTokens(this._provenance);
        const overridden = tokens.filter(t => t.overridden).length;
        const theme = window.lcards?.core?.themeManager?.getActiveTheme?.();
        return html`
            ${renderLauncher({
                icon: 'mdi:palette',
                title: 'Theme',
                description: 'The theme tokens this card uses and their values here. Browse every token, the alert mode lab and theme packs in the LCARdS panel.',
                stats: [
                    ...(theme?.name ? [{ value: theme.name, label: 'theme' }] : []),
                    { value: tokens.length, label: tokens.length === 1 ? 'token on this card' : 'tokens on this card' },
                    ...(overridden ? [{ value: overridden, label: 'overridden' }] : []),
                ],
                actions: [
                    { label: 'Open Theme Studio', icon: 'mdi:palette-swatch', onClick: () => this._openPanel('theme') },
                    { label: 'Pack Explorer', icon: 'mdi:package-variant', onClick: () => this._openPanel('packs') },
                ],
            })}
            ${!this._cardFound
                ? html`<p class="hint empty">No rendered card for this config yet: the tokens come from the card editor's preview.</p>`
                : tokens.length
                    ? html`<div class="tokens">${tokens.map(t => this._renderToken(t))}</div>`
                    : html`<p class="hint empty">This card uses no theme tokens.</p>`}
        `;
    }

    _renderToken(t) {
        const ref = `theme:${t.path}`;
        return html`
            <div class="token" data-path=${t.path}>
                ${looksLikeColour(t.value)
                    ? html`<span class="swatch" style=${styleMap({ background: t.value })}></span>`
                    : html`<span class="swatch none"><ha-icon icon="mdi:palette-outline"></ha-icon></span>`}
                <div class="main">
                    <span class="path">${ref}</span>
                    <span class="sub"><code>${t.value === undefined ? '-' : String(t.value)}</code>${t.fields.length ? html` · ${t.fields.join(', ')}` : nothing}</span>
                </div>
                ${t.overridden ? html`<span class="chip" title="Changed by a theme override">override</span>` : nothing}
                <ha-icon-button .label=${'Copy token'} title="Copy token" @click=${() => copyTextToClipboard(ref)}>
                    <ha-icon icon="mdi:content-copy"></ha-icon>
                </ha-icon-button>
            </div>
        `;
    }
}

if (!customElements.get('lcards-card-theme-tab')) customElements.define('lcards-card-theme-tab', LCARdSCardThemeTab);
