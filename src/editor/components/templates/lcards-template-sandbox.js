/**
 * @fileoverview LCARdS Template Sandbox
 *
 * A studio for one template: the editor (with completion) and its context on the
 * left; the result, what it used and a syntax reference on the right. It
 * evaluates with the same context a card uses (template-context.js), live as
 * you type and as the entities and data sources it uses change. Test values
 * (entity, other entities, data sources, variables) stand in for live ones.
 *
 * Opened from a field on the Templates tab it can save the template back to
 * that field.
 *
 * @element lcards-template-sandbox
 * @fires sandbox-closed - When the sandbox closes
 * @fires template-save - detail: { path, value }, from "Save to <path>"
 *
 * @property {Object} hass
 * @property {Object} config - The card config (its entity, variables, data sources)
 * @property {Boolean} open
 * @property {Object} initialData - { template?, path?, entity? }
 */

import { LitElement, html, css, nothing } from 'lit';
import { styleMap } from 'lit/directives/style-map.js';
import { UnifiedTemplateEvaluator } from '../../../core/templates/UnifiedTemplateEvaluator.js';
import { lcardsLog } from '../../../utils/lcards-logging.js';
import { haFormatState } from '../../../utils/ha-entity-display.js';
import { copyTextToClipboard } from '../../../utils/clipboard-utils.js';
import { studioDialogStyles } from '../../dialogs/studio-dialog-styles.js';
import { messageStyles } from '../../base/surface-styles.js';
import { docsUrl, DOCS } from '../../../utils/docs-url.js';
import { EXAMPLE_TEMPLATES, getExampleIds } from './template-examples.js';
import {
    templateContext, templateRefs, templateKinds, parseTestValues, withTestValues, unresolvedParts,
} from './template-context.js';
import { configToYaml } from '../../utils/yaml-utils.js';
import '../shared/lcards-form-section.js';
import './lcards-template-editor.js';
import { isCssColor } from '../../../core/themes/color-syntax.js';

const TEMPLATES_DOCS_URL = docsUrl(DOCS.templates);

/** Starters for the Insert chips: text, then completion opens. */
const INSERTS = [
    { label: 'Entity', text: '{entity.' },
    { label: 'Other entity', text: '{states.' },
    { label: 'Data source', text: '{ds:' },
    { label: 'Theme', text: '{theme:' },
    { label: 'Variable', text: '{variables.' },
    { label: 'JavaScript', text: '[[[ return  ]]]', caret: -4 },
    { label: 'Jinja2', text: '{{  }}', caret: -3 },
];

/** The syntax reference on the preview side. */
const SYNTAX = [
    ['{entity.state}', "The card's entity (also entity.attributes.NAME)"],
    ['{states.light.desk.state}', 'Any entity by its ID'],
    ['{ds:name:.1f}', 'A data source value, with an optional number format'],
    ['{theme:colors.text.onDark}', 'A theme token'],
    ['{variables.NAME}', "One of the card's variables"],
    ['[[[ return ... ]]]', 'JavaScript: entity, states, variables, config, hass, theme, user'],
    ["{{ states('sun.sun') }}", "Jinja2, run by Home Assistant (test values don't apply)"],
];

const STATUS = {
    ok: { icon: 'mdi:check-circle', text: 'Resolved' },
    partial: { icon: 'mdi:alert', text: 'Resolved with gaps' },
    failed: { icon: 'mdi:close-circle', text: "Didn't resolve" },
    empty: { icon: 'mdi:circle-outline', text: 'Empty result' },
};

export class LCARdSTemplateSandbox extends LitElement {
    static get properties() {
        return {
            hass: { type: Object },
            config: { type: Object },
            open: { type: Boolean },
            initialData: { type: Object },
            _template: { type: String, state: true },
            _path: { type: String, state: true },
            _entityId: { type: String, state: true },
            _testText: { type: String, state: true },
            _result: { type: Object, state: true },
            _evaluating: { type: Boolean, state: true },
        };
    }

    constructor() {
        super();
        /** @type {any} */
        this.hass = undefined;
        /** @type {any} */
        this.config = undefined;
        this.open = false;
        this.initialData = null;
        this._template = '';
        this._path = '';
        this._entityId = '';
        this._testText = '';
        this._result = null;
        this._evaluating = false;
        this._run = 0;
        this._subscriptions = new Map();
        this._seenStates = new Map();
    }

    static get styles() {
        return [studioDialogStyles, messageStyles, css`
            .studio-layout {
                grid-template-columns: minmax(320px, 1fr) minmax(300px, 1fr);
                grid-template-rows: minmax(0, 1fr); /* one row at every width (see studio-dialog-styles.js) */
            }

            .tab-content {
                display: flex;
                flex-direction: column;
                gap: var(--ha-space-3);
                --lcards-section-spacing: 0;
            }

            .preview-panel {
                overflow-y: auto;
                padding: var(--ha-space-4);
                display: flex;
                flex-direction: column;
                gap: var(--ha-space-3);
                --lcards-section-spacing: 0;
            }

            .editor-head {
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: var(--ha-space-2);
                flex-wrap: wrap;
            }

            .editor-head h3 {
                margin: 0;
                font-size: 15px;
                font-weight: 600;
                color: var(--primary-text-color);
            }

            .kinds {
                display: flex;
                gap: var(--ha-space-1);
                flex-wrap: wrap;
            }

            .kind {
                padding: 2px var(--ha-space-2);
                border-radius: var(--ha-border-radius-pill);
                font-size: 12px;
                font-weight: 600;
                background: color-mix(in srgb, var(--primary-color) 18%, transparent);
                color: var(--primary-text-color);
            }

            .inserts {
                display: flex;
                flex-wrap: wrap;
                gap: var(--ha-space-1);
                align-items: center;
            }

            .inserts .hint {
                margin-right: var(--ha-space-1);
            }

            .inserts ha-button {
                --ha-button-height: 28px;
            }

            .examples ha-selector {
                display: block;
            }

            .entity-live {
                margin: var(--ha-space-1) 0 0;
            }

            /* Result: the black inset */
            .result {
                background: var(--primary-background-color);
                border-radius: var(--ha-border-radius-lg);
                padding: var(--ha-space-4);
                display: flex;
                flex-direction: column;
                gap: var(--ha-space-3);
            }

            .status {
                display: flex;
                align-items: center;
                gap: var(--ha-space-2);
                font-weight: 600;
                font-size: 13px;
            }

            .status ha-icon {
                --mdc-icon-size: 18px;
            }

            .status.ok { color: var(--success-color); }
            .status.partial, .status.empty { color: var(--warning-color); }
            .status.failed { color: var(--error-color); }

            .status .time {
                margin-left: auto;
                font-weight: 400;
                color: var(--secondary-text-color);
            }

            .value {
                font-family: var(--code-font-family, monospace);
                font-size: 20px;
                line-height: 1.4;
                color: var(--primary-text-color);
                white-space: pre-wrap;
                overflow-wrap: anywhere;
                min-height: 1.4em;
            }

            .value.placeholder {
                font-size: 14px;
                color: var(--secondary-text-color);
                font-family: inherit;
            }

            .gaps {
                margin: 0;
                padding-left: var(--ha-space-5);
                font-size: 12px;
                color: var(--secondary-text-color);
            }

            .gaps code {
                font-family: var(--code-font-family, monospace);
                color: var(--warning-color);
            }

            /* What it used */
            .used {
                width: 100%;
                border-collapse: collapse;
                font-size: 13px;
            }

            .used td {
                padding: 6px var(--ha-space-2);
                border-bottom: var(--ha-border-width-sm) solid var(--divider-color);
                vertical-align: middle;
            }

            .used tr:last-child td {
                border-bottom: none;
            }

            .used .name {
                font-family: var(--code-font-family, monospace);
                color: var(--primary-text-color);
                overflow-wrap: anywhere;
            }

            .used .val {
                font-family: var(--code-font-family, monospace);
                color: var(--secondary-text-color);
                overflow-wrap: anywhere;
            }

            .used ha-icon {
                --mdc-icon-size: 16px;
                color: var(--secondary-text-color);
            }

            .swatch {
                display: inline-block;
                width: 12px;
                height: 12px;
                border-radius: var(--ha-border-radius-sm);
                border: var(--ha-border-width-sm) solid var(--divider-color);
                vertical-align: middle;
                margin-right: var(--ha-space-1);
            }

            .src {
                font-size: 12px;
                padding: 1px var(--ha-space-2);
                border-radius: var(--ha-border-radius-pill);
                white-space: nowrap;
            }

            .src.live { background: color-mix(in srgb, var(--success-color) 20%, transparent); }
            .src.test { background: color-mix(in srgb, var(--info-color, #03a9f4) 22%, transparent); }
            .src.missing { background: color-mix(in srgb, var(--error-color) 22%, transparent); }

            /* Syntax reference */
            .syntax {
                display: flex;
                flex-direction: column;
                gap: var(--ha-space-1);
            }

            .syntax button {
                all: unset;
                cursor: pointer;
                display: grid;
                grid-template-columns: minmax(160px, auto) 1fr;
                gap: var(--ha-space-3);
                padding: var(--ha-space-1) var(--ha-space-2);
                border-radius: var(--ha-border-radius-sm);
                font-size: 12px;
            }

            .syntax button:hover,
            .syntax button:focus-visible {
                background: color-mix(in srgb, var(--primary-color) 14%, transparent);
            }

            .syntax code {
                font-family: var(--code-font-family, monospace);
                color: var(--primary-color);
            }

            .syntax span {
                color: var(--secondary-text-color);
            }

            .docs {
                margin: var(--ha-space-2) 0 0;
                font-size: 12px;
            }

            .docs a {
                color: var(--primary-color);
            }

            .test-error {
                margin-top: var(--ha-space-1);
            }
        `];
    }

    // ─── Lifecycle ──────────────────────────────────────────────────────────

    disconnectedCallback() {
        super.disconnectedCallback();
        this._unsubscribeAll();
    }

    willUpdate(changed) {
        if (changed.has('open') && this.open) this._reset();
    }

    updated(changed) {
        if (changed.has('open') && !this.open) this._unsubscribeAll();
        // Re-run when an entity the template uses changes
        if (changed.has('hass') && this.open && this._result && this._usedStatesChanged()) this._evaluate();
    }

    _reset() {
        const data = this.initialData || {};
        this._template = data.template ?? '';
        this._path = data.path ?? '';
        this._entityId = data.entity ?? this.config?.entity ?? '';
        this._testText = '';
        this._result = null;
        this._evaluate();
    }

    // ─── Evaluation ─────────────────────────────────────────────────────────

    get _test() {
        return parseTestValues(this._testText);
    }

    /** The data sources the evaluator sees: test values first, then the live ones. */
    _dataSourceManager(testDs) {
        const real = window.lcards?.core?.dataSourceManager;
        return {
            sources: real?.sources ?? new Map(),
            getSource: (name) => {
                if (testDs[name] !== undefined) {
                    const v = testDs[name];
                    return { id: name, _isTest: true, getCurrentData: () => ({ v, value: v, t: Date.now(), metadata: {} }), subscribe: () => () => {}, unsubscribe() {} };
                }
                return real?.getSource?.(name) ?? null;
            },
        };
    }

    async _evaluate() {
        const template = this._template;
        const run = ++this._run;
        if (!template.trim()) {
            this._result = null;
            this._syncSubscriptions([]);
            return;
        }
        const { value: test } = this._test;
        const applied = withTestValues({ hass: this.hass, entityId: this._entityId, test });
        const refs = templateRefs(template, { entityId: this._entityId });
        this._syncSubscriptions(refs.datasources);
        this._evaluating = true;
        const started = performance.now();
        let result = '';
        let error = '';
        try {
            const evaluator = new UnifiedTemplateEvaluator({
                hass: applied.hass,
                context: templateContext({
                    hass: applied.hass,
                    config: this.config ?? {},
                    entity: applied.entity,
                    variables: applied.variables,
                    theme: window.lcards?.core?.themeManager?.getActiveTheme?.(),
                }),
                dataSourceManager: this._dataSourceManager(applied.ds),
            });
            result = String(await evaluator.evaluateAsync(template) ?? '');
        } catch (err) {
            error = err?.message ?? String(err);
            lcardsLog.debug('[TemplateSandbox] Evaluation failed', { error });
        }
        if (run !== this._run) return; // a newer run started
        const used = this._used(refs, applied);
        const gaps = unresolvedParts(result);
        const missing = used.filter(u => u.source === 'missing');
        const status = error || (gaps.length && result.trim() === template.trim()) ? 'failed'
            : gaps.length || missing.length ? 'partial'
            : !result.trim() ? 'empty'
            : 'ok';
        this._result = { value: result, error, gaps, used, status, ms: Math.round(performance.now() - started) };
        this._rememberStates(refs.entities);
        this._evaluating = false;
    }

    /** Each entity, data source, variable and theme token the template uses, with its value and where it came from. */
    _used(refs, applied) {
        const rows = [];
        const states = applied.hass?.states ?? {};
        for (const id of refs.entities) {
            const st = states[id];
            rows.push({
                kind: 'entity', icon: 'mdi:home-outline', name: id,
                value: st ? haFormatState(applied.hass, st) : '',
                source: !st ? 'missing' : applied.testEntities.includes(id) ? 'test' : 'live',
            });
        }
        const dsm = window.lcards?.core?.dataSourceManager;
        for (const name of refs.datasources) {
            const isTest = applied.ds[name] !== undefined;
            const data = isTest ? { v: applied.ds[name] } : dsm?.getSource?.(name)?.getCurrentData?.();
            rows.push({
                kind: 'ds', icon: 'mdi:database', name,
                value: data && data.v !== undefined && data.v !== null ? String(data.v) : '',
                source: isTest ? 'test' : data ? 'live' : 'missing',
            });
        }
        const cardVars = this.config?.variables ?? {};
        for (const name of refs.variables) {
            const isTest = applied.variables[name] !== undefined;
            const v = isTest ? applied.variables[name] : cardVars[name];
            rows.push({
                kind: 'variable', icon: 'mdi:variable', name,
                value: v === undefined ? '' : typeof v === 'object' ? JSON.stringify(v) : String(v),
                source: isTest ? 'test' : v !== undefined ? 'card' : 'missing',
            });
        }
        const tm = window.lcards?.core?.themeManager;
        for (const path of refs.themeTokens) {
            const v = tm?.getToken?.(path);
            rows.push({
                kind: 'theme', icon: 'mdi:palette', name: path,
                value: v === undefined || v === null ? '' : typeof v === 'object' ? JSON.stringify(v) : String(v),
                source: v === undefined || v === null ? 'missing' : 'theme',
            });
        }
        return rows;
    }

    _rememberStates(ids) {
        this._seenStates = new Map(ids.map(id => [id, this.hass?.states?.[id]]));
    }

    _usedStatesChanged() {
        for (const [id, st] of this._seenStates) if (this.hass?.states?.[id] !== st) return true;
        return false;
    }

    /** Re-evaluate when a data source the template uses updates. */
    _syncSubscriptions(names) {
        const dsm = window.lcards?.core?.dataSourceManager;
        for (const [name, unsub] of this._subscriptions) {
            if (!names.includes(name)) {
                unsub?.();
                this._subscriptions.delete(name);
            }
        }
        for (const name of names) {
            if (this._subscriptions.has(name)) continue;
            const source = dsm?.getSource?.(name);
            if (typeof source?.subscribe !== 'function') continue;
            this._subscriptions.set(name, source.subscribe(() => this._scheduleEvaluate()));
        }
    }

    _unsubscribeAll() {
        for (const unsub of this._subscriptions.values()) unsub?.();
        this._subscriptions.clear();
        clearTimeout(this._evalTimer);
    }

    _scheduleEvaluate() {
        clearTimeout(this._evalTimer);
        this._evalTimer = setTimeout(() => this._evaluate(), 250);
    }

    // ─── Completion data ────────────────────────────────────────────────────

    _completionData() {
        const { value: test } = this._test;
        const applied = withTestValues({ hass: this.hass, entityId: this._entityId, test });
        const dsm = window.lcards?.core?.dataSourceManager;
        return {
            entity: applied.entity,
            states: applied.hass?.states ?? {},
            datasources: [...new Set([...(dsm?.sources?.keys?.() ?? []), ...Object.keys(applied.ds)])],
            themeTokens: window.lcards?.core?.themeManager?.getActiveTheme?.()?.tokens ?? {},
            variables: { ...(this.config?.variables ?? {}), ...applied.variables },
            config: this.config ?? {},
        };
    }

    // ─── Handlers ───────────────────────────────────────────────────────────

    get _editor() {
        return /** @type {any} */ (this.renderRoot.querySelector('lcards-template-editor'));
    }

    _onTemplate(e) {
        e.stopPropagation();
        this._template = e.detail.value;
        this._evaluate();
    }

    _insert(text, caret = 0) {
        const editor = this._editor;
        editor?.insert(text, caret);
    }

    _loadExample(id) {
        const example = EXAMPLE_TEMPLATES[id];
        if (!example) return;
        this._template = example.template;
        this._testText = example.test ? configToYaml(example.test) : '';
        this._evaluate();
    }

    _onEntity(e) {
        e.stopPropagation();
        this._entityId = e.detail.value ?? '';
        this._evaluate();
    }

    _onTestValues(e) {
        e.stopPropagation();
        this._testText = e.detail.value ?? '';
        this._scheduleEvaluate();
    }

    _close() {
        this.open = false;
        this.dispatchEvent(new CustomEvent('sandbox-closed', { bubbles: true, composed: true }));
    }

    _save() {
        this._editor?.flush();
        this.dispatchEvent(new CustomEvent('template-save', {
            detail: { path: this._path, value: this._template },
            bubbles: true,
            composed: true,
        }));
        this._close();
    }

    // ─── Render ─────────────────────────────────────────────────────────────

    render() {
        if (!this.open) return nothing;
        return html`
            <ha-dialog
                open
                flexcontent
                ?prevent-scrim-close=${!!this._path}
                header-title=${this._path ? `Template: ${this._path}` : 'Template Sandbox'}
                @closed=${(e) => { e.stopPropagation(); if (e.target === e.currentTarget) this._close(); }}>
                <div class="dialog-content">
                    <div class="studio-layout">
                        <div class="config-panel">
                            <div class="tab-content">
                                ${this._renderEditor()}
                                ${this._renderContext()}
                            </div>
                        </div>
                        <div class="preview-panel">
                            ${this._renderResult()}
                            ${this._renderUsed()}
                            ${this._renderSyntax()}
                        </div>
                    </div>
                </div>
                <div slot="footer">
                    <ha-button appearance="plain" @click=${() => copyTextToClipboard(this._editor?.value ?? this._template)}>
                        <ha-icon icon="mdi:content-copy" slot="start"></ha-icon>
                        Copy template
                    </ha-button>
                    ${this._path ? html`
                        <ha-button appearance="plain" data-dialog="close">Cancel</ha-button>
                        <ha-button variant="brand" @click=${this._save}>
                            <ha-icon icon="mdi:check" slot="start"></ha-icon>
                            Save to ${this._path}
                        </ha-button>
                    ` : html`<ha-button appearance="plain" data-dialog="close">Close</ha-button>`}
                </div>
            </ha-dialog>
        `;
    }

    _renderEditor() {
        const kinds = templateKinds(this._template);
        return html`
            <div class="editor-head">
                <h3>Template</h3>
                <div class="kinds">${kinds.map(k => html`<span class="kind">${k}</span>`)}</div>
            </div>
            <lcards-template-editor
                .value=${this._template}
                .getCompletionData=${() => this._completionData()}
                @value-changed=${this._onTemplate}>
            </lcards-template-editor>
            <div class="inserts">
                <span class="hint">Insert</span>
                ${INSERTS.map(i => html`
                    <ha-button size="s" appearance="outlined" variant="brand" @click=${() => this._insert(i.text, i.caret ?? 0)}>${i.label}</ha-button>
                `)}
            </div>
            <div class="examples">
                <ha-selector
                    .hass=${this.hass}
                    .label=${'Load an example'}
                    .required=${false}
                    .selector=${{ select: { mode: 'dropdown', options: getExampleIds().map(id => ({ value: id, label: EXAMPLE_TEMPLATES[id].name })) } }}
                    .value=${''}
                    @value-changed=${(e) => { e.stopPropagation(); if (e.detail.value) this._loadExample(e.detail.value); }}>
                </ha-selector>
            </div>
        `;
    }

    _renderContext() {
        const live = this._entityId ? this.hass?.states?.[this._entityId] : null;
        const { error } = this._test;
        return html`
            <lcards-form-section
                header="Context"
                description="What entity means, and test values to try the template with"
                icon="mdi:tune"
                ?expanded=${true}>
                <ha-selector
                    .hass=${this.hass}
                    .label=${'Entity'}
                    .required=${false}
                    .selector=${{ entity: {} }}
                    .value=${this._entityId}
                    @value-changed=${this._onEntity}>
                </ha-selector>
                <p class="hint entity-live">
                    ${!this._entityId ? 'No entity: {entity.…} has nothing to read.'
                        : live ? `Live: ${haFormatState(this.hass, live)} · ${Object.keys(live.attributes ?? {}).length} attributes`
                        : `${this._entityId} isn't in Home Assistant: give it test values below.`}
                </p>
                <p class="hint">
                    Test values (YAML) replace live ones: <code>entity:</code> state and attributes,
                    <code>states:</code> other entities by ID, <code>ds:</code> data sources, <code>variables:</code>.
                </p>
                <ha-code-editor
                    mode="yaml"
                    class="test-values"
                    .hass=${this.hass}
                    .value=${this._testText}
                    @value-changed=${this._onTestValues}>
                </ha-code-editor>
                ${error ? html`<div class="banner error test-error">${error}</div>` : nothing}
            </lcards-form-section>
        `;
    }

    _renderResult() {
        const r = this._result;
        if (!r) {
            return html`
                <div class="result">
                    <div class="value placeholder">The result shows here as you type.</div>
                </div>
            `;
        }
        const status = STATUS[r.status];
        return html`
            <div class="result">
                <div class="status ${r.status}">
                    <ha-icon icon=${status.icon}></ha-icon>
                    ${status.text}
                    <span class="time">${this._evaluating ? 'Running…' : `${r.ms} ms`}</span>
                </div>
                <div class="value">${r.error || r.value || ' '}</div>
                ${r.gaps.length ? html`
                    <ul class="gaps">${r.gaps.map(g => html`<li>Not resolved: <code>${g}</code></li>`)}</ul>
                ` : nothing}
            </div>
        `;
    }

    _renderUsed() {
        const used = this._result?.used ?? [];
        if (!used.length) return nothing;
        return html`
            <lcards-form-section header="What it used" icon="mdi:link-variant" ?expanded=${true}>
                <table class="used">
                    ${used.map(u => html`
                        <tr>
                            <td><ha-icon icon=${u.icon}></ha-icon></td>
                            <td class="name">${u.name}</td>
                            <td class="val">
                                ${u.kind === 'theme' && isCssColor(u.value) ? html`<span class="swatch" style=${styleMap({ background: u.value })}></span>` : nothing}
                                ${u.value || '-'}
                            </td>
                            <td><span class="src ${u.source === 'card' || u.source === 'theme' ? 'live' : u.source}">${u.source}</span></td>
                        </tr>
                    `)}
                </table>
            </lcards-form-section>
        `;
    }

    _renderSyntax() {
        return html`
            <lcards-form-section header="Syntax" icon="mdi:code-braces" ?expanded=${!this._template}>
                <div class="syntax">
                    ${SYNTAX.map(([code, text]) => html`
                        <button @click=${() => this._insert(code)} title="Insert">
                            <code>${code}</code><span>${text}</span>
                        </button>
                    `)}
                </div>
                <p class="docs"><a href=${TEMPLATES_DOCS_URL} target="_blank" rel="noopener">Templates guide</a></p>
            </lcards-form-section>
        `;
    }
}

if (!customElements.get('lcards-template-sandbox')) customElements.define('lcards-template-sandbox', LCARdSTemplateSandbox);
