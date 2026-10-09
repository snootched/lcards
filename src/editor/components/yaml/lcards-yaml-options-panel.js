/**
 * @fileoverview "Options here" panel for the LCARdS YAML editor
 *
 * Shows what can go at the cursor (from editor/utils/yaml-options-model.js):
 * the keys for the current mapping with type, default and description, or
 * the allowed values for the key being edited. Insert / value clicks are
 * fired as events; the YAML editor applies them to CodeMirror.
 *
 * @element lcards-yaml-options-panel
 * @fires option-insert - detail: { option }
 * @fires value-pick - detail: { value }
 */

import { LitElement, html, css } from 'lit';
import { docsUrl } from '../../utils/yaml-docs-links.js';

export class LCARdSYamlOptionsPanel extends LitElement {
    static get properties() {
        return {
            panel: { type: Object },
            _filter: { type: String, state: true }
        };
    }

    constructor() {
        super();
        /** @type {import('../../utils/yaml-options-model.js').OptionsPanel|null} */
        this.panel = null;
        this._filter = '';
    }

    static get styles() {
        return css`
            :host {
                display: block;
                font-size: 12px;
                color: #abb2bf;
                background: #21252b;
                border: var(--ha-border-width-sm) solid var(--divider-color, #181a1f);
                border-radius: var(--ha-border-radius-sm);
                overflow: hidden;
            }

            .head {
                display: flex;
                align-items: center;
                gap: var(--ha-space-2);
                padding: 6px var(--ha-space-2);
                border-bottom: var(--ha-border-width-sm) solid #181a1f;
                font-weight: 600;
                color: #d7dae0;
            }

            .crumb {
                font-family: 'Consolas', 'Monaco', monospace;
                font-weight: 400;
                color: #61afef;
                overflow: hidden;
                text-overflow: ellipsis;
                white-space: nowrap;
            }

            .filter {
                margin-left: auto;
                width: 140px;
                padding: 2px 6px;
                border: var(--ha-border-width-sm) solid #3e4451;
                border-radius: var(--ha-border-radius-sm);
                background: #282c34;
                color: #d7dae0;
                font-size: 12px;
            }

            .body {
                max-height: 240px;
                overflow: auto;
                padding: 0 var(--ha-space-2);
            }

            :host([fill]) .body {
                max-height: none;
            }

            ul {
                list-style: none;
                margin: 0;
                padding: 0;
            }

            li {
                padding: 6px 0;
                border-bottom: var(--ha-border-width-sm) solid #2c313a;
            }

            .row {
                display: flex;
                flex-wrap: wrap;
                align-items: baseline;
                gap: 6px;
            }

            .key {
                font-family: 'Consolas', 'Monaco', monospace;
                font-size: 13px;
                color: #e06c75;
            }

            .meta {
                font-family: 'Consolas', 'Monaco', monospace;
                color: #7f848e;
            }

            .actions {
                margin-left: auto;
                display: flex;
                gap: var(--ha-space-1);
            }

            button,
            a.btn {
                padding: 1px 8px;
                border: var(--ha-border-width-sm) solid #3e4451;
                border-radius: var(--ha-border-radius-sm);
                background: #282c34;
                color: #d7dae0;
                font-size: 12px;
                cursor: pointer;
                text-decoration: none;
            }

            button:hover,
            a.btn:hover {
                border-color: #61afef;
            }

            .desc {
                margin-top: 2px;
                color: #9da5b4;
            }

            .note {
                padding: 6px 0;
                color: #9da5b4;
            }

            .chips {
                display: flex;
                flex-wrap: wrap;
                gap: var(--ha-space-1);
                padding-bottom: var(--ha-space-2);
            }
        `;
    }

    render() {
        const p = this.panel;
        if (!p) return html``;
        const showFilter = p.kind === 'options' && p.options.length > 8;
        return html`
            <div class="head">
                <span>Options here</span>
                <span class="crumb" title=${p.crumb}>${p.crumb}</span>
                ${showFilter ? html`
                    <input class="filter" type="search" placeholder="Filter"
                        .value=${this._filter}
                        @input=${(e) => { this._filter = e.target.value; }}
                        @keydown=${(e) => e.stopPropagation()}>
                ` : ''}
            </div>
            <div class="body">
                ${p.kind === 'values' ? this._renderValues(p) : this._renderOptions(p)}
            </div>
        `;
    }

    _renderValues(p) {
        return html`
            <div class="note">
                <span class="key">${p.key}</span>
                ${p.type ? html`<span class="meta"> ${p.type}</span>` : ''}
                ${p.description ? html`<div class="desc">${p.description}</div>` : ''}
                ${p.docs ? html` <a class="btn" href=${docsUrl(p.docs)} target="_blank" rel="noopener">Docs</a>` : ''}
            </div>
            ${p.choices.length ? html`
                <div class="chips">
                    ${p.choices.map(c => html`
                        <button type="button" @click=${() => this._fire('value-pick', { value: c.value })}>${c.label}</button>
                    `)}
                </div>
            ` : ''}
        `;
    }

    _renderOptions(p) {
        const needle = this._filter.trim().toLowerCase();
        const options = needle
            ? p.options.filter(o => o.key.includes(needle) || (o.description || '').toLowerCase().includes(needle))
            : p.options;
        if (!p.options.length) {
            return html`<div class="note">Nothing more to add here. Move the cursor into a section (for example under <code>style:</code>) to see its options.</div>`;
        }
        return html`
            <ul>
                ${options.map(o => html`
                    <li>
                        <div class="row">
                            <span class="key">${o.key}</span>
                            <span class="meta">${o.type}</span>
                            ${o.default !== undefined ? html`<span class="meta">default ${JSON.stringify(o.default)}</span>` : ''}
                            <span class="actions">
                                <button type="button" @click=${() => this._fire('option-insert', { option: o })}>Insert</button>
                                ${o.docs ? html`<a class="btn" href=${docsUrl(o.docs)} target="_blank" rel="noopener">Docs</a>` : ''}
                            </span>
                        </div>
                        ${o.description ? html`<div class="desc">${o.description}</div>` : ''}
                    </li>
                `)}
            </ul>
        `;
    }

    _fire(name, detail) {
        this.dispatchEvent(new CustomEvent(name, { detail }));
    }
}

if (!customElements.get('lcards-yaml-options-panel')) customElements.define('lcards-yaml-options-panel', LCARdSYamlOptionsPanel);
