/**
 * @fileoverview LCARdS Rule Apply Editor
 *
 * YAML editor for the `apply` section of a rule. The patches are too wide and
 * per-card-type for form fields, so this is the LCARdS YAML editor with a schema
 * built from the page (rule-apply-schema.js): completion, hover help and the
 * "Options here" panel know every overlay ID on the page, and a patch for one
 * completes against that card's own schema. A reference table lists the IDs,
 * types and tags to target.
 *
 * @element lcards-rule-apply-editor
 * @fires value-changed - When apply object changes (detail: { value: applyObject })
 *
 * @property {Object} value  - The `apply` object
 * @property {Object} hass   - Home Assistant instance
 * @property {Object} editor - Parent editor instance (for the card's id and type)
 */

import { LitElement, html, css } from 'lit';
import { configToYaml, yamlToConfig } from '../../utils/yaml-utils.js';
import '../shared/lcards-form-section.js';
import '../yaml/lcards-yaml-editor.js';
import { copyTextToClipboard } from '../../../utils/clipboard-utils.js';
import { messageStyles } from '../../base/surface-styles.js';
import { ruleApplySchema, pageSchemaOptions, cardTypeOf } from './rule-apply-schema.js';
import { showPromptDialog } from '../../../views/layout-edit-dialogs.js';

export class LCARdSRuleApplyEditor extends LitElement {
    static get properties() {
        return {
            value:           { type: Object },
            hass:            { type: Object },
            editor:          { type: Object },
            _yamlText:       { type: String,  state: true },
            _yamlError:      { type: String,  state: true },
            _refExpanded:    { type: Boolean, state: true }
        };
    }

    constructor() {
        super();
        /** @type {any} */
        this.hass = undefined;
        /** @type {any} the card's LCARdSBaseEditor */
        this.editor = undefined;
        this.value = {};
        this._yamlText = '';
        this._yamlError = '';
        this._refExpanded = false;
        /** The object this editor last emitted (its YAML is already in the editor) */
        this._emitted = null;
        this._schema = null;
    }

    static get styles() {
        return [messageStyles, css`
            :host { display: block; }

            .yaml-error {
                color: var(--error-color);
                font-size: 12px;
                margin-top: var(--ha-space-1);
            }

            .table-wrapper {
                overflow-x: auto;
            }

            .ref-table {
                min-width: 100%;
                width: max-content;
                border-collapse: collapse;
                font-size: 13px;
            }

            .ref-table th {
                padding: var(--ha-space-2) var(--ha-space-3);
                text-align: left;
                font-weight: 600;
                font-size: 12px;
                color: var(--secondary-text-color);
                border-bottom: var(--ha-border-width-md) solid var(--divider-color);
                white-space: nowrap;
            }

            .ref-table td {
                padding: var(--ha-space-1) var(--ha-space-3);
                border-bottom: var(--ha-border-width-sm) solid var(--divider-color);
                white-space: nowrap;
                color: var(--secondary-text-color);
            }

            .ref-table tr:last-child td {
                border-bottom: none;
            }

            .ref-table tbody tr:hover {
                background: color-mix(in srgb, var(--primary-text-color) 6%, transparent);
            }

            .ref-id {
                font-family: var(--code-font-family, monospace);
                font-weight: 600;
                color: var(--primary-text-color);
            }

            .ref-table ha-icon-button {
                --ha-icon-button-size: 28px;
                --mdc-icon-size: 16px;
            }

            .ref-empty {
                margin: 0;
            }

            .starter {
                display: flex;
                align-items: center;
                justify-content: space-between;
                flex-wrap: wrap;
                gap: var(--ha-space-2);
                margin-bottom: var(--ha-space-2);
            }

            .selectors {
                margin: var(--ha-space-2) 0 0;
            }

            .selectors code {
                font-family: var(--code-font-family, monospace);
            }
        `];
    }

    // ─── Lifecycle ────────────────────────────────────────────────────────────

    willUpdate(changedProps) {
        if (changedProps.has('value') && this.value !== this._emitted) {
            this._syncFromValue();
        }
    }

    connectedCallback() {
        super.connectedCallback();
        // Built once per open: the overlays on the page don't change while the dialog is up.
        this._schema = null;
    }

    _syncFromValue() {
        try {
            const value = this.value || {};
            this._yamlText = Object.keys(value).length ? configToYaml(value) : '';
            this._yamlError = '';
        } catch (err) {
            this._yamlError = String(err);
        }
    }

    // ─── Helpers ─────────────────────────────────────────────────────────────

    _getDiscoverableOverlays() {
        try {
            return window.lcards?.core?.systemsManager?.getAllTargetableOverlays() || [];
        } catch (e) {
            return [];
        }
    }

    /** The Apply schema for this page (see rule-apply-schema.js). */
    _getSchema() {
        if (!this._schema) this._schema = ruleApplySchema(pageSchemaOptions(this.editor));
        return this._schema;
    }

    /** Fire the YAML editor's pending change now (call before saving). */
    flush() {
        // @ts-ignore - TS2339: lcards-yaml-editor
        this.renderRoot?.querySelector('lcards-yaml-editor')?.flush?.();
    }

    _emit(newValue) {
        this._emitted = newValue;
        this.value = newValue;
        this.dispatchEvent(new CustomEvent('value-changed', {
            detail: { value: newValue },
            bubbles: true,
            composed: true
        }));
    }

    // ─── Handlers ────────────────────────────────────────────────────────────

    /** The YAML editor already waits for typing to pause before it fires. */
    _handleYamlChange(e) {
        e.stopPropagation();
        const text = e.detail.value;
        this._yamlText = text;
        try {
            const parsed = text.trim() ? yamlToConfig(text) : {};
            this._yamlError = '';
            this._emit(parsed || {});
        } catch (err) {
            this._yamlError = `YAML error: ${err.message}`;
        }
    }

    // ─── Render ──────────────────────────────────────────────────────────────

    /**
     * Fill an empty Apply with this card's overlay key, ready for its changes. A
     * card without an id gets a new random one on every page load, so a rule
     * can't target it: ask for an id first and set it on the card.
     */
    async _startWithCard() {
        const config = this.editor?.config ?? {};
        let id = config.id;
        if (!id) {
            const taken = new Set(this._getDiscoverableOverlays().map(o => o.id));
            const base = String(config.entity ?? '').split('.')[1] || cardTypeOf(config).replace(/-/g, '_') || 'card';
            let suggestion = base;
            for (let n = 2; taken.has(suggestion); n++) suggestion = `${base}_${n}`;
            id = await showPromptDialog({
                title: 'Give this card an id',
                message: 'Rules target cards by id. This card has none, so it gets a new random one on every page load.',
                label: 'Card ID',
                value: suggestion,
                confirmText: 'Set id',
            });
            if (!id) return;
            if (!/^[a-zA-Z_][a-zA-Z0-9_-]*$/.test(id)) {
                this._yamlError = 'A card id starts with a letter or _, then letters, digits, _ or -.';
                return;
            }
            this.editor._updateConfig({ id });
            this._schema = null; // the new id is a target now
        }
        this._yamlError = '';
        this._yamlText = `overlays:\n  ${id}:\n    `;
    }

    render() {
        const cardId = this.editor?.config?.id;
        return html`
            ${!this._yamlText.trim() ? html`
                <div class="starter">
                    <span class="hint">Type an overlay ID, or start with this card. Ctrl+Space lists what can go next.</span>
                    <ha-button appearance="outlined" variant="brand" size="s" @click=${() => this._startWithCard()}>
                        <ha-icon icon="mdi:target" slot="start"></ha-icon>
                        ${cardId ? `Start with ${cardId}` : 'Start with this card'}
                    </ha-button>
                </div>
            ` : ''}
            <lcards-yaml-editor
                .hass=${this.hass}
                .schema=${this._getSchema()}
                .value=${this._yamlText}
                @value-changed=${this._handleYamlChange}>
            </lcards-yaml-editor>
            ${this._yamlError ? html`<div class="yaml-error">${this._yamlError}</div>` : ''}

            <lcards-form-section
                header="Targets on this page"
                description="Overlay IDs, card types and tags you can change"
                icon="mdi:layers-search"
                ?expanded=${this._refExpanded}
                ?outlined=${false}
                @expanded-changed=${(e) => this._refExpanded = e.detail.expanded}>
                ${this._renderOverlayReference()}
            </lcards-form-section>
        `;
    }

    _renderOverlayReference() {
        const overlays = this._getDiscoverableOverlays();

        if (overlays.length === 0) {
            return html`<p class="hint ref-empty">No targets on this page yet: cards register when they render.</p>`;
        }

        return html`
            <div class="table-wrapper"><table class="ref-table">
                <thead>
                    <tr><th>ID</th><th>Type</th><th>Tags</th><th></th></tr>
                </thead>
                <tbody>
                    ${overlays.map(ov => html`
                        <tr>
                            <td class="ref-id">${ov.id}</td>
                            <td>${ov.type || '-'}</td>
                            <td>${ov.tags?.length ? ov.tags.join(', ') : '-'}</td>
                            <td>
                                <ha-icon-button .label=${'Copy ID'} title="Copy ID" @click=${() => copyTextToClipboard(ov.id)}>
                                    <ha-icon icon="mdi:content-copy"></ha-icon>
                                </ha-icon-button>
                            </td>
                        </tr>
                    `)}
                </tbody>
            </table></div>
            <p class="hint selectors">
                Selectors: <code>all</code>, <code>type:button</code>, <code>tag:name</code>,
                <code>pattern:regex</code>; <code>exclude: [id]</code> skips IDs.
            </p>
        `;
    }
}

if (!customElements.get('lcards-rule-apply-editor')) customElements.define('lcards-rule-apply-editor', LCARdSRuleApplyEditor);
