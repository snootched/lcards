/**
 * @fileoverview LCARdS Provenance (Main Engineering > Provenance)
 *
 * Where each of a card's values comes from. The launcher summarises; the
 * inspector (a studio dialog) lists every field the card's provenance knows
 * (config layers, rule patches, templates, runtime layers, theme tokens) and,
 * for the one selected, its value now and the trail that produced it: config
 * layers, what the card applied after the merge, the theme token chain, the
 * template and any rule patch. A Tokens view lists each theme token with its
 * resolution chain and the fields using it.
 *
 * It reads the card rendered from the editor's config (the preview while
 * editing: window.lcards.findCardByConfig) and follows it live through the
 * tracker's change events, with a pause.
 *
 * @element lcards-provenance-tab
 * @property {Object} editor - The card's editor (LCARdSBaseEditor)
 * @property {Object} config - The card config
 * @property {Object} hass
 */

import { LitElement, html, css, nothing } from 'lit';
import { styleMap } from 'lit/directives/style-map.js';
import { lcardsLog } from '../../../utils/lcards-logging.js';
import { copyTextToClipboard } from '../../../utils/clipboard-utils.js';
import { studioDialogStyles } from '../../dialogs/studio-dialog-styles.js';
import { messageStyles } from '../../base/surface-styles.js';
import { renderLauncher, launcherStyles } from '../shared/launcher.js';
import { pathSegments } from '../templates/template-context.js';
import { isCssColor } from '../../../core/themes/color-syntax.js';

/** Config merge layers with display names and icons. */
const CONFIG_LAYERS = {
    card_defaults: { label: 'Card defaults', icon: 'mdi:cog' },
    theme_defaults: { label: 'Theme defaults', icon: 'mdi:palette' },
    user_config: { label: 'Your config', icon: 'mdi:account' },
};

/** Runtime layers (applied by the card after the merge). */
const RUNTIME_LAYERS = {
    'built-in': { label: 'Built-in default', icon: 'mdi:cog-outline' },
    component: { label: 'Component', icon: 'mdi:puzzle' },
    'component-preset': { label: 'Component preset', icon: 'mdi:puzzle-star' },
    range: { label: 'Range', icon: 'mdi:arrow-expand-horizontal' },
    'preset-default': { label: 'Preset default', icon: 'mdi:package-variant' },
    state: { label: 'State branch', icon: 'mdi:toggle-switch' },
};

/** Token chain step names and icons (ThemeTokenResolver.explain). */
const STEPS = {
    override: { label: 'Override', icon: 'mdi:account-edit' },
    lookup: { label: 'Theme token', icon: 'mdi:palette' },
    reference: { label: 'Refers to', icon: 'mdi:arrow-right' },
    computed: { label: 'Computed', icon: 'mdi:function-variant' },
    'css-var': { label: 'CSS variable', icon: 'mdi:variable' },
    value: { label: 'Value on this card', icon: 'mdi:eyedropper' },
    missing: { label: 'Not in the theme', icon: 'mdi:alert' },
    circular: { label: 'Circular reference', icon: 'mdi:alert' },
};

const SHOW_OPTIONS = [
    { value: 'all', label: 'All fields' },
    { value: 'changed', label: 'Changed from defaults' },
    { value: 'rules', label: 'Set by rules now' },
    { value: 'templates', label: 'Templates' },
    { value: 'tokens', label: 'Theme tokens' },
    { value: 'runtime', label: 'Set by the card' },
];

/** A layer's label: presets and components carry their name. */
function layerLabel(layer) {
    if (CONFIG_LAYERS[layer]) return CONFIG_LAYERS[layer].label;
    if (RUNTIME_LAYERS[layer]) return RUNTIME_LAYERS[layer].label;
    if (layer === 'rules') return 'Rule';
    const m = /^(preset|component)_(.+)$/.exec(layer ?? '');
    if (m) return `${m[1] === 'preset' ? 'Preset' : 'Component'}: ${m[2]}`;
    return layer ?? '';
}

function layerIcon(layer) {
    if (CONFIG_LAYERS[layer]) return CONFIG_LAYERS[layer].icon;
    if (RUNTIME_LAYERS[layer]) return RUNTIME_LAYERS[layer].icon;
    if (layer === 'rules') return 'mdi:format-list-checks';
    if (/^preset_/.test(layer ?? '')) return 'mdi:package-variant-closed';
    if (/^component_/.test(layer ?? '')) return 'mdi:puzzle';
    return 'mdi:circle-small';
}

/** Badge class for a source (colours come from the theme). */
function badgeClass(source) {
    if (source === 'user_config') return 'user';
    if (source === 'rules') return 'rule';
    if (/^preset|^component/.test(source ?? '')) return 'preset';
    if (source === 'theme_defaults') return 'theme';
    return 'card';
}

/** Value as short text. */
function show(value) {
    if (value === undefined) return '(not set)';
    if (value === null) return 'null';
    if (typeof value === 'object') {
        try { return JSON.stringify(value); } catch { return String(value); }
    }
    return String(value);
}

const looksLikeColour = isCssColor;

/** A field path (not a label like 'style (chart defaults)'). */
const isFieldPath = (s) => /^[\w[\].-]+$/.test(s);

/** The value at a field path ('style.ranges[0].color') in an object. */
function valueAt(obj, path) {
    let node = obj;
    for (const seg of pathSegments(path)) {
        if (node === null || node === undefined) return undefined;
        node = node[seg];
    }
    return node;
}

export class LCARdSProvenanceTab extends LitElement {
    static get properties() {
        return {
            editor: { type: Object },
            config: { type: Object },
            hass: { type: Object },
            _provenance: { type: Object, state: true },
            _cardConfig: { type: Object, state: true },
            _open: { type: Boolean, state: true },
            _view: { type: String, state: true },
            _search: { type: String, state: true },
            _show: { type: String, state: true },
            _selected: { type: String, state: true },
            _selectedToken: { type: String, state: true },
            _live: { type: Boolean, state: true },
            _stale: { type: Boolean, state: true },
            _collapsed: { type: Object, state: true },
        };
    }

    constructor() {
        super();
        /** @type {any} */
        this.editor = undefined;
        /** @type {any} */
        this.config = undefined;
        /** @type {any} */
        this.hass = undefined;
        this._provenance = null;
        this._provenanceTracker = null;
        /** @type {any} */
        this._card = undefined;
        this._cardConfig = null;
        this._open = false;
        this._view = 'fields';
        this._search = '';
        this._show = 'all';
        this._selected = '';
        this._selectedToken = '';
        this._live = true;
        this._stale = false;
        this._collapsed = new Set();
        this._unsubscribe = null;
    }

    static get styles() {
        return [studioDialogStyles, messageStyles, launcherStyles, css`
            :host {
                display: block;
            }

            .studio-layout {
                grid-template-columns: minmax(280px, 38%) 1fr;
            }

            .left-head {
                display: flex;
                flex-direction: column;
                gap: var(--ha-space-2);
                padding: var(--ha-space-3) var(--ha-space-4) var(--ha-space-2);
                border-bottom: var(--ha-border-width-sm) solid var(--divider-color);
            }

            .left-head ha-input,
            .left-head ha-selector {
                display: block;
                width: 100%;
            }

            .list {
                flex: 1;
                overflow-y: auto;
                padding: var(--ha-space-2);
                min-height: 0;
            }

            .row {
                display: flex;
                align-items: center;
                gap: var(--ha-space-2);
                padding: 5px var(--ha-space-2);
                padding-left: calc(var(--ha-space-2) + var(--depth, 0) * var(--ha-space-4));
                border-radius: var(--ha-border-radius-sm);
                cursor: pointer;
                color: var(--primary-text-color);
                font-size: 14px;
                user-select: none;
            }

            .row:hover {
                background: color-mix(in srgb, var(--primary-text-color) 8%, transparent);
            }

            .row.selected {
                background: color-mix(in srgb, var(--primary-color) 28%, transparent);
            }

            .row .name {
                flex: 1;
                min-width: 0;
                font-family: var(--code-font-family, monospace);
                overflow: hidden;
                text-overflow: ellipsis;
                white-space: nowrap;
            }

            .row .twisty {
                --mdc-icon-size: 16px;
                width: 16px;
                flex: none;
                color: var(--secondary-text-color);
            }

            .row .marks {
                display: flex;
                gap: 2px;
                --mdc-icon-size: 14px;
                color: var(--secondary-text-color);
            }

            .badge {
                flex: none;
                font-size: 12px;
                font-weight: 600;
                padding: 2px var(--ha-space-2);
                border-radius: var(--ha-border-radius-pill);
                white-space: nowrap;
                color: var(--primary-text-color);
                background: color-mix(in srgb, var(--secondary-text-color) 22%, transparent);
            }

            .badge.user { background: color-mix(in srgb, var(--success-color) 30%, transparent); }
            .badge.preset { background: color-mix(in srgb, var(--warning-color) 30%, transparent); }
            .badge.theme { background: color-mix(in srgb, var(--info-color, #03a9f4) 30%, transparent); }
            .badge.rule { background: color-mix(in srgb, var(--error-color) 32%, transparent); }

            .empty {
                padding: var(--ha-space-6) var(--ha-space-4);
                text-align: center;
            }

            /* Detail pane */
            .preview-panel {
                overflow-y: auto;
                padding: var(--ha-space-4);
                display: flex;
                flex-direction: column;
                gap: var(--ha-space-3);
            }

            .head-row {
                display: flex;
                align-items: center;
                gap: var(--ha-space-2);
                flex-wrap: wrap;
            }

            .head-row .live {
                display: flex;
                align-items: center;
                gap: var(--ha-space-1);
                margin-left: auto;
            }

            .chip {
                font-size: 12px;
                padding: 2px var(--ha-space-2);
                border-radius: var(--ha-border-radius-pill);
                background: color-mix(in srgb, var(--primary-text-color) 10%, transparent);
                color: var(--secondary-text-color);
            }

            .chip.alert {
                background: color-mix(in srgb, var(--error-color) 30%, transparent);
                color: var(--primary-text-color);
            }

            .detail-title {
                display: flex;
                align-items: center;
                gap: var(--ha-space-2);
            }

            .detail-title h3 {
                margin: 0;
                font-family: var(--code-font-family, monospace);
                font-size: 16px;
                color: var(--primary-text-color);
                overflow-wrap: anywhere;
            }

            .detail-title ha-icon-button,
            .head-row ha-icon-button {
                --ha-icon-button-size: 32px;
                --mdc-icon-size: 18px;
                color: var(--secondary-text-color);
            }

            .now {
                background: var(--primary-background-color);
                border-radius: var(--ha-border-radius-lg);
                padding: var(--ha-space-3) var(--ha-space-4);
            }

            .now .label {
                font-size: 12px;
                text-transform: uppercase;
                letter-spacing: 0.5px;
                color: var(--secondary-text-color);
            }

            .now .value {
                display: flex;
                align-items: center;
                gap: var(--ha-space-2);
                margin-top: var(--ha-space-1);
                font-family: var(--code-font-family, monospace);
                font-size: 18px;
                color: var(--primary-text-color);
                overflow-wrap: anywhere;
            }

            .now .hint {
                margin: var(--ha-space-1) 0 0;
            }

            .swatch {
                flex: none;
                display: inline-block;
                width: 16px;
                height: 16px;
                border-radius: var(--ha-border-radius-sm);
                border: var(--ha-border-width-sm) solid var(--divider-color);
            }

            .trail-title {
                margin: var(--ha-space-2) 0 0;
                font-size: 14px;
                font-weight: 600;
                color: var(--primary-text-color);
            }

            .trail {
                display: flex;
                flex-direction: column;
                gap: var(--ha-space-2);
                background: var(--primary-background-color);
                border-radius: var(--ha-border-radius-lg);
                padding: var(--ha-space-3);
            }

            .step {
                display: grid;
                grid-template-columns: 24px 1fr;
                gap: var(--ha-space-2);
                align-items: start;
                padding: var(--ha-space-2);
                border-radius: var(--ha-border-radius-md);
                background: color-mix(in srgb, var(--primary-text-color) 5%, transparent);
            }

            .step.wins {
                box-shadow: inset var(--ha-border-width-lg) 0 0 var(--primary-color);
                background: color-mix(in srgb, var(--primary-color) 12%, transparent);
            }

            .step.overridden {
                opacity: 0.6;
            }

            .step > ha-icon {
                --mdc-icon-size: 18px;
                color: var(--secondary-text-color);
                margin-top: 1px;
            }

            .step .what {
                font-size: 13px;
                font-weight: 600;
                color: var(--primary-text-color);
            }

            .step .what .tag {
                font-weight: 400;
                color: var(--secondary-text-color);
                margin-left: var(--ha-space-1);
            }

            .step .val {
                display: flex;
                align-items: center;
                gap: var(--ha-space-2);
                margin-top: 2px;
                font-family: var(--code-font-family, monospace);
                font-size: 13px;
                color: var(--secondary-text-color);
                overflow-wrap: anywhere;
            }

            .step .swatch {
                width: 12px;
                height: 12px;
            }

            .step .sub {
                font-size: 12px;
                color: var(--secondary-text-color);
                margin-top: 2px;
                overflow-wrap: anywhere;
            }

            .chain {
                display: flex;
                flex-direction: column;
                gap: 2px;
                margin-top: var(--ha-space-1);
            }

            .uses {
                display: flex;
                flex-wrap: wrap;
                gap: var(--ha-space-1);
            }

            .uses button,
            .link {
                all: unset;
                cursor: pointer;
                font-family: var(--code-font-family, monospace);
                font-size: 13px;
                padding: 2px var(--ha-space-2);
                border-radius: var(--ha-border-radius-pill);
                background: color-mix(in srgb, var(--primary-color) 18%, transparent);
                color: var(--primary-text-color);
            }

            .uses button:focus-visible,
            .uses button:hover,
            .link:focus-visible,
            .link:hover {
                background: color-mix(in srgb, var(--primary-color) 32%, transparent);
            }

            .placeholder {
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                gap: var(--ha-space-2);
                flex: 1;
                color: var(--secondary-text-color);
                text-align: center;
            }

            .placeholder ha-icon {
                --mdc-icon-size: 40px;
                opacity: 0.6;
            }
        `];
    }

    // ─── Lifecycle and loading ─────────────────────────────────────────────

    disconnectedCallback() {
        super.disconnectedCallback();
        this._unsubscribe?.();
        this._unsubscribe = null;
        this._card = undefined;
    }

    updated(changed) {
        if (changed.has('config') && this.config) this._loadProvenance();
    }

    /**
     * Find the card rendered from this config (the preview while editing) and
     * read its provenance; follow its changes while live.
     */
    async _loadProvenance() {
        try {
            // @ts-ignore - window.lcards
            const card = this.config ? window.lcards?.findCardByConfig?.(this.config) : null;
            this._setCard(card && typeof card.getProvenance === 'function' ? card : null);
        } catch (error) {
            lcardsLog.error('[ProvenanceTab] Failed to load provenance:', error);
            this._setCard(null);
        }
    }

    _setCard(card) {
        if (card !== this._card) {
            this._unsubscribe?.();
            this._unsubscribe = card?.subscribeProvenance?.(() => {
                if (this._live) this._read();
                else this._stale = true;
            }) ?? null;
            this._card = card;
        }
        this._read();
    }

    /** Read the card's provenance and config now. */
    _read() {
        const card = this._card;
        this._provenance = card ? card.getProvenance() : null;
        this._provenanceTracker = card?._provenanceTracker ?? null;
        this._cardConfig = card?.config ?? null;
        this._stale = false;
    }

    // ─── Derived data ──────────────────────────────────────────────────────

    /** Every field the provenance knows, with what touched it. */
    _fields() {
        const p = this._provenance;
        if (!p) return [];
        const map = new Map();
        const get = (path) => {
            if (!map.has(path)) map.set(path, { path, layers: null, final: null, runtime: [], rule: null, template: null, tokens: [] });
            return map.get(path);
        };
        for (const [path, info] of Object.entries(p.config?.field_sources ?? {})) {
            const f = get(path);
            f.layers = typeof info === 'string' ? { [info]: undefined } : info.layers;
            f.final = typeof info === 'string' ? info : info.final;
        }
        for (const [path, entries] of Object.entries(p.runtime ?? {})) get(path).runtime = entries;
        for (const [path, patch] of Object.entries(p.rule_patches ?? {})) get(path).rule = patch;
        for (const [path, tpl] of Object.entries(p.templates ?? {})) {
            if (!path.startsWith('template:')) get(path).template = tpl;
        }
        for (const [token, info] of Object.entries(p.theme_tokens ?? {})) {
            for (const field of info.used_by_fields ?? []) {
                if (isFieldPath(field)) get(field).tokens.push(token);
            }
        }
        for (const f of map.values()) {
            f.source = f.rule ? 'rules' : f.final ?? (f.runtime.length ? f.runtime[f.runtime.length - 1].layer : null);
        }
        return [...map.values()].sort((a, b) => a.path.localeCompare(b.path));
    }

    _filtered() {
        const q = this._search.trim().toLowerCase();
        const keep = {
            all: () => true,
            changed: (f) => f.final === 'user_config' || !!f.rule || !!f.template,
            rules: (f) => !!f.rule,
            templates: (f) => !!f.template,
            tokens: (f) => f.tokens.length > 0,
            runtime: (f) => f.runtime.length > 0,
        }[this._show] ?? (() => true);
        return this._fields().filter(f => keep(f) && (!q || f.path.toLowerCase().includes(q)));
    }

    /** Fields as tree rows (path segments as folders). */
    _rows(fields) {
        const root = { children: new Map() };
        for (const f of fields) {
            const segs = f.path.split('.');
            let node = root;
            segs.forEach((seg, i) => {
                const path = segs.slice(0, i + 1).join('.');
                if (!node.children.has(seg)) node.children.set(seg, { seg, path, children: new Map(), field: null });
                node = node.children.get(seg);
            });
            node.field = f;
        }
        const rows = [];
        const filtering = !!this._search.trim() || this._show !== 'all';
        const walk = (node, depth) => {
            for (const child of [...node.children.values()].sort((a, b) => a.seg.localeCompare(b.seg))) {
                const folder = child.children.size > 0;
                const open = filtering || !this._collapsed.has(child.path);
                rows.push({ ...child, depth, folder, open });
                if (folder && open) walk(child, depth + 1);
            }
        };
        walk(root, 0);
        return rows;
    }

    _tokens() {
        const q = this._search.trim().toLowerCase();
        return Object.entries(this._provenance?.theme_tokens ?? {})
            .map(([path, info]) => ({ path, ...info }))
            .filter(t => !q || t.path.toLowerCase().includes(q) || (t.used_by_fields ?? []).some(f => f.toLowerCase().includes(q)))
            .sort((a, b) => a.path.localeCompare(b.path));
    }

    /** A token's final value as this card sees it (the chain's last value). */
    _concrete(token) {
        const chain = token?.resolution_chain ?? [];
        const last = [...chain].reverse().find(s => s.step === 'value');
        return last?.value ?? token?.resolved_value;
    }

    // ─── Handlers ──────────────────────────────────────────────────────────

    _openInspector() {
        this._loadProvenance();
        this._open = true;
    }

    _close() {
        this._open = false;
    }

    _toggleLive(e) {
        this._live = e.target.checked;
        if (this._live) this._read();
    }

    _toggleFolder(path) {
        const next = new Set(this._collapsed);
        if (next.has(path)) next.delete(path); else next.add(path);
        this._collapsed = next;
    }

    _selectField(path) {
        this._view = 'fields';
        this._selected = path;
    }

    _selectToken(path) {
        this._view = 'tokens';
        this._selectedToken = path;
    }

    // ─── Render: launcher ──────────────────────────────────────────────────

    render() {
        const p = this._provenance;
        const fields = this._fields();
        return html`
            ${renderLauncher({
                icon: 'mdi:layers-search',
                title: 'Provenance',
                description: "Where each of this card's values comes from: its config and preset, the theme, rules, templates and the card itself.",
                stats: p ? [
                    { value: fields.length, label: 'fields' },
                    { value: Object.keys(p.theme_tokens ?? {}).length, label: 'theme tokens' },
                    { value: new Set(Object.values(p.rule_patches ?? {}).map(r => r.rule_id)).size, label: 'rules applying now' },
                    { value: fields.filter(f => f.template).length, label: 'templates' },
                ] : [],
                actions: [{ label: 'Open inspector', icon: 'mdi:file-tree', onClick: () => this._openInspector() }],
            })}
            ${!p && this._card === null ? html`<p class="hint">No rendered card for this config yet: provenance comes from the card editor's preview. Layout cards and the alert overlay don't record provenance.</p>` : nothing}
            ${this._open ? this._renderInspector() : nothing}
        `;
    }

    // ─── Render: inspector ─────────────────────────────────────────────────

    _renderInspector() {
        const p = this._provenance;
        const ctx = p?.context ?? {};
        return html`
            <ha-dialog
                open
                flexcontent
                header-title=${`Provenance: ${ctx.card_id || ctx.card_type || 'card'}`}
                @closed=${(e) => { e.stopPropagation(); if (e.target === e.currentTarget) this._close(); }}>
                <div class="dialog-content">
                    <div class="studio-layout">
                        <div class="config-panel">
                            <ha-tab-group @wa-tab-show=${(e) => {
                                e.stopPropagation();
                                const v = e.target.activeTab?.getAttribute?.('value');
                                if (v) this._view = v;
                            }}>
                                <ha-tab-group-tab value="fields" ?active=${this._view === 'fields'}>
                                    <ha-icon icon="mdi:file-tree"></ha-icon>
                                    Fields
                                </ha-tab-group-tab>
                                <ha-tab-group-tab value="tokens" ?active=${this._view === 'tokens'}>
                                    <ha-icon icon="mdi:palette"></ha-icon>
                                    Tokens
                                </ha-tab-group-tab>
                            </ha-tab-group>
                            ${this._renderLeft()}
                        </div>
                        <div class="preview-panel">
                            ${this._renderHeadRow(ctx)}
                            ${!p ? html`<div class="placeholder"><ha-icon icon="mdi:card-search-outline"></ha-icon><p>No rendered card for this config.</p></div>`
                                : this._view === 'tokens' ? this._renderTokenDetail() : this._renderFieldDetail()}
                        </div>
                    </div>
                </div>
                <div slot="footer">
                    <ha-button appearance="plain" data-dialog="close">Close</ha-button>
                </div>
            </ha-dialog>
        `;
    }

    _renderHeadRow(ctx) {
        return html`
            <div class="head-row">
                ${ctx.theme ? html`<span class="chip">Theme: ${ctx.theme}</span>` : nothing}
                ${ctx.alert_mode && ctx.alert_mode !== 'green_alert' ? html`<span class="chip alert">Alert mode: ${ctx.alert_mode}</span>` : nothing}
                ${ctx.token_overrides ? html`<span class="chip">${ctx.token_overrides} token overrides</span>` : nothing}
                ${ctx.entity ? html`<span class="chip">${ctx.entity}: ${ctx.entity_state ?? '-'}</span>` : nothing}
                <span class="live">
                    ${!this._live ? html`
                        <ha-icon-button class="refresh" .label=${'Refresh'} title="Refresh" @click=${() => this._read()}>
                            <ha-icon icon=${this._stale ? 'mdi:refresh-circle' : 'mdi:refresh'}></ha-icon>
                        </ha-icon-button>
                    ` : nothing}
                    <ha-switch class="live-switch" .checked=${this._live} @change=${this._toggleLive}>${this._live ? 'Live' : this._stale ? 'Paused (changed)' : 'Paused'}</ha-switch>
                </span>
            </div>
        `;
    }

    _renderLeft() {
        return html`
            <div class="left-head">
                <ha-input
                    class="search"
                    .value=${this._search}
                    .label=${this._view === 'tokens' ? 'Search tokens or fields' : 'Search fields'}
                    @input=${(e) => { this._search = e.target.value ?? ''; }}>
                </ha-input>
                ${this._view === 'fields' ? html`
                    <ha-selector
                        .hass=${this.hass}
                        .label=${'Show'}
                        .required=${false}
                        .selector=${{ select: { mode: 'dropdown', options: SHOW_OPTIONS } }}
                        .value=${this._show}
                        @value-changed=${(e) => { e.stopPropagation(); this._show = e.detail.value || 'all'; }}>
                    </ha-selector>
                ` : nothing}
            </div>
            <div class="list">
                ${this._view === 'tokens' ? this._renderTokenList() : this._renderFieldList()}
            </div>
        `;
    }

    _renderFieldList() {
        const fields = this._filtered();
        if (!fields.length) return html`<p class="hint empty">No fields match.</p>`;
        return this._rows(fields).map(row => html`
            <div class="row field-row ${row.field && row.path === this._selected ? 'selected' : ''}"
                data-path=${row.path}
                style=${styleMap({ '--depth': String(row.depth) })}
                @click=${() => (row.folder && !row.field ? this._toggleFolder(row.path) : this._selectField(row.path))}>
                ${row.folder
                    ? html`<ha-icon class="twisty" icon=${row.open ? 'mdi:chevron-down' : 'mdi:chevron-right'}
                        @click=${(e) => { e.stopPropagation(); this._toggleFolder(row.path); }}></ha-icon>`
                    : html`<span class="twisty"></span>`}
                <span class="name">${row.seg}</span>
                ${row.field ? html`
                    <span class="marks">
                        ${row.field.template ? html`<ha-icon icon="mdi:code-braces" title="Template"></ha-icon>` : nothing}
                        ${row.field.tokens.length ? html`<ha-icon icon="mdi:palette" title="Theme token"></ha-icon>` : nothing}
                    </span>
                    <span class="badge ${badgeClass(row.field.source)}">${layerLabel(row.field.source)}</span>
                ` : nothing}
            </div>
        `);
    }

    _renderTokenList() {
        const tokens = this._tokens();
        if (!tokens.length) return html`<p class="hint empty">No theme tokens recorded for this card.</p>`;
        return tokens.map(t => {
            const concrete = this._concrete(t);
            return html`
                <div class="row token-row ${t.path === this._selectedToken ? 'selected' : ''}" data-path=${t.path} @click=${() => this._selectToken(t.path)}>
                    ${looksLikeColour(concrete)
                        ? html`<span class="swatch" style=${styleMap({ background: concrete })}></span>`
                        : html`<ha-icon class="twisty" icon="mdi:palette"></ha-icon>`}
                    <span class="name">${t.path}</span>
                    <span class="badge" title="Fields using it">${(t.used_by_fields ?? []).length}</span>
                </div>
            `;
        });
    }

    // ─── Render: field detail ──────────────────────────────────────────────

    _renderFieldDetail() {
        const field = this._fields().find(f => f.path === this._selected);
        if (!field) {
            return html`<div class="placeholder"><ha-icon icon="mdi:cursor-default-click-outline"></ha-icon>
                <p>Select a field to see its value and how it got there.</p></div>`;
        }
        // A state-keyed value: the branch that applies now, not the whole object
        const branch = field.runtime.find(r => r.layer === 'state');
        const configured = valueAt(this._cardConfig, field.path);
        const now = branch ? branch.value
            : configured !== undefined ? configured : field.rule?.patched_value ?? field.runtime[field.runtime.length - 1]?.value;
        const tokenNow = field.tokens.length ? this._concrete(this._provenance.theme_tokens[field.tokens[0]]) : undefined;
        return html`
            <div class="detail-title">
                <h3>${field.path}</h3>
                <ha-icon-button .label=${'Copy field path'} title="Copy field path" @click=${() => copyTextToClipboard(field.path)}>
                    <ha-icon icon="mdi:content-copy"></ha-icon>
                </ha-icon-button>
            </div>
            <div class="now">
                <div class="label">Value now</div>
                <div class="value">${this._swatch(tokenNow ?? now)}${show(now)}</div>
                ${tokenNow !== undefined && tokenNow !== now ? html`<p class="hint">On this card: ${show(tokenNow)}</p>` : nothing}
            </div>
            <p class="trail-title">How it got here</p>
            <div class="trail">
                ${this._configSteps(field)}
                ${field.runtime.map(r => this._runtimeStep(r))}
                ${field.tokens.map(t => this._tokenStep(t))}
                ${field.template ? this._templateStep(field.template) : nothing}
                ${field.rule ? this._ruleStep(field.rule) : nothing}
            </div>
        `;
    }

    _configSteps(field) {
        if (!field.layers) return nothing;
        const order = this._provenance.config?.merge_order ?? Object.keys(field.layers);
        return order.filter(layer => layer in field.layers).map(layer => {
            const wins = layer === field.final && !field.rule;
            return html`
                <div class="step config-step ${wins ? 'wins' : 'overridden'}">
                    <ha-icon icon=${layerIcon(layer)}></ha-icon>
                    <div>
                        <div class="what">${layerLabel(layer)}<span class="tag">${wins ? 'sets it' : 'replaced below'}</span></div>
                        <div class="val">${this._swatch(field.layers[layer])}${show(field.layers[layer])}</div>
                    </div>
                </div>
            `;
        });
    }

    _runtimeStep(entry) {
        const d = entry.detail ?? {};
        const notes = [
            entry.layer === 'state' && `branch "${d.state ?? 'none'}" for state ${d.entityState ?? '-'}${d.classified ? ` (${d.classified})` : ''}`,
            d.matchLight !== undefined && `light colour ${d.matchLight}`,
            d.component && `component ${d.component}`,
            d.preset && `preset ${d.preset}`,
            d.token && `from theme:${d.token}${d.fallback ? " (not in the theme: the card's fallback)" : ''}`,
            d.from,
        ].filter(Boolean);
        return html`
            <div class="step runtime-step" data-layer=${entry.layer}>
                <ha-icon icon=${layerIcon(entry.layer)}></ha-icon>
                <div>
                    <div class="what">${layerLabel(entry.layer)}<span class="tag">applied by the card</span></div>
                    <div class="val">${this._swatch(entry.value)}${show(entry.value)}</div>
                    ${notes.length ? html`<div class="sub">${notes.join(' · ')}</div>` : nothing}
                </div>
            </div>
        `;
    }

    _tokenStep(tokenPath) {
        const token = this._provenance.theme_tokens[tokenPath];
        if (!token) return nothing;
        return html`
            <div class="step token-step">
                <ha-icon icon="mdi:palette"></ha-icon>
                <div>
                    <div class="what">Theme token<span class="tag">${token.original_ref}</span></div>
                    <div class="chain">${(token.resolution_chain ?? []).map(step => this._chainLine(step))}</div>
                    <div class="sub"><button class="link" @click=${() => this._selectToken(tokenPath)}>Open token</button></div>
                </div>
            </div>
        `;
    }

    _templateStep(tpl) {
        return html`
            <div class="step template-step">
                <ha-icon icon="mdi:code-braces"></ha-icon>
                <div>
                    <div class="what">Template<span class="tag">${tpl.processor}</span></div>
                    <div class="val">${tpl.original}</div>
                    <div class="sub">Result: ${show(tpl.processed)}</div>
                    ${tpl.dependencies?.length ? html`<div class="sub">Uses: ${tpl.dependencies.join(', ')}</div>` : nothing}
                </div>
            </div>
        `;
    }

    _ruleStep(rule) {
        return html`
            <div class="step rule-step wins">
                <ha-icon icon="mdi:format-list-checks"></ha-icon>
                <div>
                    <div class="what">Rule ${rule.rule_id}<span class="tag">applying now</span></div>
                    <div class="val">${this._swatch(rule.patched_value)}${show(rule.patched_value)}</div>
                    <div class="sub">Was ${show(rule.original_value)} · when ${rule.rule_condition}</div>
                </div>
            </div>
        `;
    }

    /** One step of a token chain, as a line. */
    _chainLine(step) {
        const what = STEPS[step.step]?.label ?? step.step;
        const ref = step.path ?? step.variable ?? step.expression;
        return html`
            <div class="val">
                ${this._swatch(step.value)}
                <span>${what}${step.scope ? ` (${step.scope})` : ''}: ${ref ?? ''}${ref && step.value !== undefined ? ' → ' : ''}${step.value !== undefined ? show(step.value) : ''}</span>
            </div>
        `;
    }

    _swatch(value) {
        return looksLikeColour(value) ? html`<span class="swatch" style=${styleMap({ background: value })}></span>` : nothing;
    }

    // ─── Render: token detail ──────────────────────────────────────────────

    _renderTokenDetail() {
        const token = this._provenance.theme_tokens?.[this._selectedToken];
        if (!token) {
            return html`<div class="placeholder"><ha-icon icon="mdi:palette-outline"></ha-icon>
                <p>Select a theme token to see how it resolves and where this card uses it.</p></div>`;
        }
        const concrete = this._concrete(token);
        return html`
            <div class="detail-title">
                <h3>theme:${this._selectedToken}</h3>
                <ha-icon-button .label=${'Copy token'} title="Copy token" @click=${() => copyTextToClipboard(`theme:${this._selectedToken}`)}>
                    <ha-icon icon="mdi:content-copy"></ha-icon>
                </ha-icon-button>
            </div>
            <div class="now">
                <div class="label">Value on this card</div>
                <div class="value">${this._swatch(concrete)}${show(concrete)}</div>
            </div>
            <p class="trail-title">How it resolves</p>
            <div class="trail">
                ${(token.resolution_chain ?? []).map(step => html`
                    <div class="step chain-step ${step.step === 'value' || step.step === 'override' ? 'wins' : ''}" data-step=${step.step}>
                        <ha-icon icon=${STEPS[step.step]?.icon ?? 'mdi:circle-small'}></ha-icon>
                        <div>
                            <div class="what">${STEPS[step.step]?.label ?? step.step}${step.scope ? html`<span class="tag">${step.scope} scope</span>` : nothing}</div>
                            <div class="val">${this._swatch(step.value)}${step.path ?? step.variable ?? step.expression ?? show(step.value)}${(step.path || step.variable || step.expression) && step.value !== undefined ? ` → ${show(step.value)}` : ''}</div>
                        </div>
                    </div>
                `)}
            </div>
            <p class="trail-title">Used by</p>
            <div class="uses">
                ${(token.used_by_fields ?? []).map(f => isFieldPath(f)
                    ? html`<button @click=${() => this._selectField(f)}>${f}</button>`
                    : html`<span class="chip">${f}</span>`)}
            </div>
        `;
    }
}

if (!customElements.get('lcards-provenance-tab')) customElements.define('lcards-provenance-tab', LCARdSProvenanceTab);
