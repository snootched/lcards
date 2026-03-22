/**
 * @fileoverview LCARdS Rule Apply Editor
 *
 * Pure-YAML editor for the `apply` section of a rule.
 *
 * The overlay patch schema is too wide and per-card-type to be expressed as form
 * fields, so we expose the full `apply` object as a YAML editor and provide a
 * read-only reference panel listing all currently-discoverable overlay targets
 * (via window.lcards.core.systemsManager) so users can look up IDs and selectors
 * without leaving the editor.
 *
 * @element lcards-rule-apply-editor
 * @fires value-changed - When apply object changes (detail: { value: applyObject })
 *
 * @property {Object} value  - The `apply` object
 * @property {Object} hass   - Home Assistant instance
 * @property {Object} editor - Parent editor instance (for context)
 */

import { LitElement, html, css } from 'lit';
import { lcardsLog } from '../../../utils/lcards-logging.js';
import { configToYaml, yamlToConfig } from '../../utils/yaml-utils.js';
import '../shared/lcards-form-section.js';

/** MDI path for content-copy icon */
const MDI_COPY = 'M19,21H8V7H19M19,5H8A2,2 0 0,0 6,7V21A2,2 0 0,0 8,23H19A2,2 0 0,0 21,21V7A2,2 0 0,0 19,5M16,1H4A2,2 0 0,0 2,3V17H4V3H16V1Z';

export class LCARdSRuleApplyEditor extends LitElement {
    static get properties() {
        return {
            value:           { type: Object },
            hass:            { type: Object },
            editor:          { type: Object },
            _yamlText:       { type: String,  state: true },
            _yamlError:      { type: String,  state: true },
            _refExpanded:    { type: Boolean, state: true },
            _yamlFromUser:   { type: Boolean, state: true }
        };
    }

    constructor() {
        super();
        /** @type {any} */
        this.hass = undefined;
        this.value = {};
        this._yamlText = '';
        this._yamlError = '';
        this._refExpanded = false;
        this._yamlFromUser = false;
        this._yamlTimer = null;
    }

    static get styles() {
        return css`
            :host { display: block; }

            .yaml-error {
                color: var(--error-color, #f44336);
                font-size: 12px;
                margin-top: 4px;
            }

            /* Reference panel — matches rules-table style */
            .table-wrapper {
                overflow-x: auto;
                margin: 0 -12px;
                padding: 0 12px;
            }

            .ref-table {
                min-width: 100%;
                width: max-content;
                border-collapse: collapse;
                background: var(--card-background-color, #fff);
                border-radius: 8px;
                overflow: hidden;
            }

            .ref-table thead th {
                background: var(--secondary-background-color, #f5f5f5);
                padding: 12px;
                text-align: left;
                font-weight: 600;
                font-size: 12px;
                text-transform: uppercase;
                letter-spacing: 0.5px;
                border-bottom: 2px solid var(--divider-color, #e0e0e0);
                white-space: nowrap;
            }

            .ref-table tbody tr:hover {
                background: var(--secondary-background-color, #f5f5f5);
            }

            .ref-table td {
                padding: 12px;
                border-bottom: 1px solid var(--divider-color, #e0e0e0);
                white-space: nowrap;
            }

            .ref-table tr:last-child td {
                border-bottom: none;
            }

            .ref-id {
                font-family: monospace;
                font-size: 13px;
                font-weight: 600;
            }

            .ref-type { color: var(--secondary-text-color); }

            .ref-tags {
                color: var(--secondary-text-color);
                font-size: 13px;
            }

            .ref-source {
                color: var(--secondary-text-color);
                font-size: 13px;
            }

            .copy-btn {
                display: inline-flex;
                align-items: center;
                justify-content: center;
                background: none;
                border: none;
                cursor: pointer;
                padding: 4px;
                border-radius: 4px;
                color: var(--secondary-text-color);
                opacity: 0.5;
                transition: opacity 0.15s;
            }
            .copy-btn:hover { opacity: 1; }

            .ref-empty {
                color: var(--secondary-text-color);
                font-style: italic;
                padding: 12px;
            }

            .selectors-info {
                margin-top: 8px;
                padding: 8px 10px;
                background: var(--secondary-background-color, rgba(0,0,0,0.03));
                border-radius: 6px;
                font-size: 11px;
                color: var(--secondary-text-color);
                line-height: 1.6;
            }

            .selectors-info code {
                font-family: monospace;
                background: var(--card-background-color, #fff);
                padding: 1px 3px;
                border-radius: 3px;
            }
        `;
    }

    // ─── Lifecycle ────────────────────────────────────────────────────────────

    willUpdate(changedProps) {
        if (changedProps.has('value')) {
            this._syncFromValue();
        }
    }

    _syncFromValue() {
        // Skip resync while the user is actively typing YAML to avoid cursor jumps
        if (this._yamlFromUser) return;
        try {
            this._yamlText = configToYaml(this.value || {});
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

    _emit(newValue) {
        this.value = newValue;
        this.dispatchEvent(new CustomEvent('value-changed', {
            detail: { value: newValue },
            bubbles: true,
            composed: true
        }));
    }

    // ─── Handlers ────────────────────────────────────────────────────────────

    _handleYamlChange(e) {
        const text = e.detail.value;
        this._yamlText = text;
        this._yamlFromUser = true;
        clearTimeout(this._yamlTimer);
        this._yamlTimer = setTimeout(() => {
            this._yamlFromUser = false;
            try {
                const parsed = yamlToConfig(text);
                this._yamlError = '';
                this._emit(parsed || {});
            } catch (err) {
                this._yamlError = `YAML error: ${err.message}`;
            }
        }, 750);
    }

    _copyToClipboard(text) {
        navigator.clipboard?.writeText(text).catch(() => {
            lcardsLog.warn('[LCARdSRuleApplyEditor] clipboard copy failed');
        });
    }

    // ─── Render ──────────────────────────────────────────────────────────────

    render() {
        return html`
            <div @value-changed=${(e) => e.stopPropagation()}>

                <!-- YAML editor — always expanded, always the primary UI -->
                <lcards-form-section
                    header="Apply (YAML)"
                    description="Define overlay patches, animations, profiles and base SVG changes"
                    icon="mdi:code-braces"
                    ?expanded=${true}
                    ?outlined=${false}>

                    <ha-code-editor
                        // @ts-ignore - TS2339: auto-suppressed
                        .hass=${this.hass}
                        .value=${this._yamlText}
                        mode="yaml"
                        @value-changed=${this._handleYamlChange}>
                    </ha-code-editor>
                    ${this._yamlError
                        ? html`<div class="yaml-error">${this._yamlError}</div>`
                        : ''}
                </lcards-form-section>

                <!-- Discoverable overlay reference — collapsed by default -->
                <lcards-form-section
                    header="Overlay Reference"
                    description="Live overlay IDs and tags discoverable from registered cards"
                    icon="mdi:layers-search"
                    ?expanded=${this._refExpanded}
                    ?outlined=${false}
                    @expanded-changed=${(e) => this._refExpanded = e.detail.expanded}>

                    ${this._renderOverlayReference()}
                </lcards-form-section>

            </div>
        `;
    }

    _renderOverlayReference() {
        const overlays = this._getDiscoverableOverlays();

        if (overlays.length === 0) {
            return html`
                <div class="ref-empty">
                    No overlay targets discovered yet. Open a card in the Lovelace editor that
                    uses LCARdS overlays to populate this list.
                </div>
            `;
        }

        return html`
            <div class="table-wrapper"><table class="ref-table">
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Type</th>
                        <th>Tags</th>
                        <th>Source card</th>
                        <th></th>
                    </tr>
                </thead>
                <tbody>
                    ${overlays.map(ov => html`
                        <tr>
                            <td class="ref-id">${ov.id}</td>
                            <td class="ref-type">${ov.type || '—'}</td>
                            <td class="ref-tags">${ov.tags?.length ? ov.tags.join(', ') : '—'}</td>
                            <td class="ref-source">${ov.sourceCardId || '—'}</td>
                            <td>
                                <button
                                    class="copy-btn"
                                    title="Copy ID to clipboard"
                                    @click=${() => this._copyToClipboard(ov.id)}>
                                    <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
                                        <path d="${MDI_COPY}"/>
                                    </svg>
                                </button>
                            </td>
                        </tr>
                    `)}
                </tbody>
            </table></div>

            <div class="selectors-info">
                <strong>Bulk selectors:</strong>
                <code>all</code> — every overlay ·
                <code>type:&lt;typename&gt;</code> ·
                <code>tag:&lt;tagname&gt;</code> ·
                <code>pattern:&lt;regex&gt;</code> ·
                <code>exclude: [id, …]</code>
            </div>
        `;
    }
}

customElements.define('lcards-rule-apply-editor', LCARdSRuleApplyEditor);

