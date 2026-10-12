/**
 * @fileoverview LCARdS Template Evaluation Tab (Main Engineering > Templates)
 *
 * Every config field that holds a template, one row each: the template, its
 * live result (Jinja2 included) and common syntax mistakes. "Open in sandbox"
 * loads the whole field into the template sandbox, which can save it back.
 *
 * @element lcards-template-evaluation-tab
 * @property {Object} editor - Parent card editor (LCARdSBaseEditor)
 * @property {Object} config - Full card configuration
 * @property {Object} hass - Home Assistant instance
 */

import { LitElement, html, css, nothing } from 'lit';
import { UnifiedTemplateEvaluator } from '../../../core/templates/UnifiedTemplateEvaluator.js';
import { lcardsLog } from '../../../utils/lcards-logging.js';
import { copyTextToClipboard } from '../../../utils/clipboard-utils.js';
import { messageStyles } from '../../base/surface-styles.js';
import { renderLauncher, launcherStyles } from '../shared/launcher.js';
import { templateContext, templateFields, templateRefs, unresolvedParts, withValueAt, pathSegments } from './template-context.js';
import './lcards-template-sandbox.js';

export class LCARdSTemplateEvaluationTab extends LitElement {
    static get properties() {
        return {
            editor: { type: Object },
            config: { type: Object },
            hass: { type: Object },
            _rows: { type: Array, state: true },
            _sandboxOpen: { type: Boolean, state: true },
            _sandboxInitialData: { type: Object, state: true },
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
        this._rows = [];
        this._sandboxOpen = false;
        this._sandboxInitialData = null;
        this._run = 0;
        this._seenStates = new Map();
    }

    static get styles() {
        return [messageStyles, launcherStyles, css`
            :host {
                display: block;
            }

            .fields {
                display: flex;
                flex-direction: column;
                background: var(--primary-background-color);
                border-radius: var(--ha-border-radius-lg);
                padding: var(--ha-space-1) var(--ha-space-4);
            }

            .field {
                display: flex;
                flex-direction: column;
                gap: var(--ha-space-1);
                padding: var(--ha-space-3) 0;
                border-bottom: var(--ha-border-width-sm) solid var(--divider-color);
            }

            .field:last-child {
                border-bottom: none;
            }

            .field-head {
                display: flex;
                align-items: center;
                gap: var(--ha-space-2);
            }

            .path {
                flex: 1;
                min-width: 0;
                font-family: var(--code-font-family, monospace);
                font-size: 13px;
                font-weight: 600;
                color: var(--primary-text-color);
                overflow-wrap: anywhere;
            }

            .kind {
                padding: 1px var(--ha-space-2);
                border-radius: var(--ha-border-radius-pill);
                font-size: 11px;
                font-weight: 600;
                background: color-mix(in srgb, var(--primary-color) 18%, transparent);
                color: var(--primary-text-color);
                white-space: nowrap;
            }

            .actions {
                display: flex;
                --ha-icon-button-size: 32px;
                --mdc-icon-size: 18px;
                color: var(--primary-color);
            }

            .template {
                font-family: var(--code-font-family, monospace);
                font-size: 12px;
                color: var(--secondary-text-color);
                white-space: pre-wrap;
                overflow-wrap: anywhere;
                max-height: 6.5em;
                overflow-y: auto;
            }

            .result {
                display: flex;
                align-items: flex-start;
                gap: var(--ha-space-2);
                font-size: 13px;
                color: var(--primary-text-color);
            }

            .result ha-icon {
                --mdc-icon-size: 16px;
                flex: none;
                margin-top: 1px;
            }

            .result.ok ha-icon { color: var(--success-color); }
            .result.partial ha-icon { color: var(--warning-color); }
            .result.failed ha-icon { color: var(--error-color); }

            .result .value {
                font-family: var(--code-font-family, monospace);
                overflow-wrap: anywhere;
                white-space: pre-wrap;
            }

            .result.pending {
                color: var(--secondary-text-color);
            }

            .mistake {
                font-size: 12px;
                color: var(--warning-color);
            }

            .mistake code {
                font-family: var(--code-font-family, monospace);
            }

            .empty {
                margin: 0;
            }
        `];
    }

    updated(changed) {
        if (changed.has('config')) this._discover();
        else if (changed.has('hass') && this._statesChanged()) this._evaluate();
    }

    _discover() {
        this._rows = templateFields(this.config ?? {}).map(f => ({ ...f, status: 'pending', result: '' }));
        this._evaluate();
    }

    /** Evaluate every field the way the card does (Jinja2 included). */
    async _evaluate() {
        const run = ++this._run;
        const config = this.config ?? {};
        const entity = config.entity ? this.hass?.states?.[config.entity] ?? null : null;
        const used = new Set();
        const rows = await Promise.all(this._rows.map(async (row) => {
            templateRefs(row.value, { entityId: config.entity }).entities.forEach(id => used.add(id));
            try {
                const evaluator = new UnifiedTemplateEvaluator({
                    hass: this.hass,
                    context: templateContext({
                        hass: this.hass,
                        config,
                        entity,
                        theme: window.lcards?.core?.themeManager?.getActiveTheme?.(),
                    }),
                    dataSourceManager: window.lcards?.core?.dataSourceManager,
                });
                const result = String(await evaluator.evaluateAsync(row.value) ?? '');
                const gaps = unresolvedParts(result);
                const status = gaps.length && result.trim() === row.value.trim() ? 'failed' : gaps.length ? 'partial' : 'ok';
                return { ...row, result, status };
            } catch (err) {
                lcardsLog.debug('[TemplateEvaluationTab] Evaluation failed', { path: row.path, error: err?.message });
                return { ...row, result: err?.message ?? String(err), status: 'failed' };
            }
        }));
        if (run !== this._run) return;
        this._seenStates = new Map([...used].map(id => [id, this.hass?.states?.[id]]));
        this._rows = rows;
    }

    _statesChanged() {
        for (const [id, st] of this._seenStates) if (this.hass?.states?.[id] !== st) return true;
        return false;
    }

    render() {
        const kinds = new Set(this._rows.flatMap(r => r.kinds));
        const issues = this._rows.filter(r => r.status === 'failed' || r.status === 'partial' || r.mistakes.length).length;
        return html`
            ${renderLauncher({
                icon: 'mdi:code-braces-box',
                title: 'Templates',
                description: "Every template in this card's config, evaluated live. Test one, or try new ones, in the sandbox.",
                stats: [
                    { value: this._rows.length, label: this._rows.length === 1 ? 'field with a template' : 'fields with templates' },
                    { value: kinds.size, label: kinds.size === 1 ? 'kind' : 'kinds' },
                    ...(issues ? [{ value: issues, label: issues === 1 ? 'needs a look' : 'need a look' }] : []),
                ],
                actions: [{ label: 'Open sandbox', icon: 'mdi:flask-outline', onClick: () => this._openSandbox() }],
            })}
            ${this._rows.length ? html`
                <div class="fields">${this._rows.map(row => this._renderRow(row))}</div>
            ` : html`<p class="hint empty">No templates in this card's config yet. Try one in the sandbox.</p>`}
            <lcards-template-sandbox
                .hass=${this.hass}
                .config=${this.config}
                .open=${this._sandboxOpen}
                .initialData=${this._sandboxInitialData}
                @sandbox-closed=${this._handleSandboxClosed}
                @template-save=${this._handleSave}>
            </lcards-template-sandbox>
        `;
    }

    _renderRow(row) {
        const icon = { ok: 'mdi:check-circle', partial: 'mdi:alert', failed: 'mdi:close-circle', pending: 'mdi:timer-sand' }[row.status];
        return html`
            <div class="field">
                <div class="field-head">
                    <span class="path">${row.path}</span>
                    ${row.kinds.map(k => html`<span class="kind">${k}</span>`)}
                    <div class="actions">
                        <ha-icon-button .label=${'Copy template'} title="Copy template" @click=${() => copyTextToClipboard(row.value)}>
                            <ha-icon icon="mdi:content-copy"></ha-icon>
                        </ha-icon-button>
                        <ha-icon-button .label=${'Open in sandbox'} title="Open in sandbox" @click=${() => this._openSandbox({ template: row.value, path: row.path })}>
                            <ha-icon icon="mdi:flask-outline"></ha-icon>
                        </ha-icon-button>
                    </div>
                </div>
                <div class="template">${row.value}</div>
                <div class="result ${row.status}">
                    <ha-icon icon=${icon}></ha-icon>
                    <span class="value">${row.status === 'pending' ? 'Evaluating…' : row.result || '(empty)'}</span>
                </div>
                ${row.mistakes.map(m => html`<div class="mistake"><code>${m.match}</code>: ${m.message}</div>`)}
            </div>
        `;
    }

    /** @param {{template?: string, path?: string}} [initialData] */
    _openSandbox(initialData = {}) {
        this._sandboxInitialData = { entity: this.config?.entity, ...initialData };
        this._sandboxOpen = true;
    }

    _handleSandboxClosed() {
        this._sandboxOpen = false;
        this._sandboxInitialData = null;
    }

    /** "Save to <path>": write the field through the editor (configs are frozen; copy, don't mutate). */
    _handleSave(e) {
        const { path, value } = e.detail ?? {};
        if (!path || !this.editor?._updateConfig) return;
        const root = pathSegments(path)[0];
        const next = withValueAt(this.editor.config ?? this.config ?? {}, path, value);
        this.editor._updateConfig({ [root]: next[root] });
        lcardsLog.debug('[TemplateEvaluationTab] Saved template to', path);
    }
}

if (!customElements.get('lcards-template-evaluation-tab')) customElements.define('lcards-template-evaluation-tab', LCARdSTemplateEvaluationTab);
