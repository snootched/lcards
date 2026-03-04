/**
 * LCARdS Rule Editor Dialog
 *
 * Modal dialog for creating or editing a single rule configuration.
 *
 * @element lcards-rule-editor-dialog
 * @fires save   - When rule is saved (detail: { rule: {...} })
 * @fires cancel - When dialog is cancelled
 *
 * @property {Object}  hass   - Home Assistant instance
 * @property {string}  mode   - 'add' | 'edit'
 * @property {Object}  rule   - Rule object to edit (edit mode)
 * @property {boolean} open   - Dialog open state
 * @property {Object}  editor - Parent editor instance (for config access)
 */

import { LitElement, html, css } from 'lit';
import { lcardsLog } from '../../../utils/lcards-logging.js';
import '../shared/lcards-dialog.js';
import '../shared/lcards-form-section.js';
import './lcards-condition-group-editor.js';
import './lcards-rule-apply-editor.js';

export class LCARdSRuleEditorDialog extends LitElement {
    static get properties() {
        return {
            hass:     { type: Object },
            mode:     { type: String },
            rule:     { type: Object },
            open:     { type: Boolean },
            editor:   { type: Object },
            _ruleId:   { type: String, state: true },
            _ruleName: { type: String, state: true },
            _priority: { type: Number, state: true },
            _enabled:  { type: Boolean, state: true },
            _stop:     { type: Boolean, state: true },
            _when:     { type: Object, state: true },
            _apply:    { type: Object, state: true },
            _errors:   { type: Object, state: true },
            _applyWarning: { type: Boolean, state: true }
        };
    }

    constructor() {
        super();
        this.mode = 'add';
        this.open = false;
        this.rule = null;
        this._resetForm();
    }

    static get styles() {
        return css`
            :host { display: block; }

            lcards-dialog {
                --mdc-dialog-min-width: 680px;
                --mdc-dialog-max-width: 900px;
            }

            .form-content {
                display: flex;
                flex-direction: column;
                gap: 16px;
                padding: 8px 0;
            }

            ha-selector {
                display: block;
                margin-bottom: 12px;
            }

            .identity-grid {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 12px;
                align-items: start;
            }

            .identity-right {
                display: grid;
                grid-template-columns: 1fr 1fr 1fr;
                gap: 12px;
                align-items: start;
            }

            .error-text {
                color: var(--error-color, #f44336);
                font-size: 12px;
                margin-top: -8px;
                margin-bottom: 4px;
            }

            ha-alert {
                display: block;
                margin-bottom: 8px;
            }

            @media (max-width: 600px) {
                lcards-dialog {
                    --mdc-dialog-min-width: 95vw;
                }
                .identity-grid {
                    grid-template-columns: 1fr;
                }
                .identity-right {
                    grid-template-columns: 1fr;
                }
            }
        `;
    }

    _resetForm() {
        const r = this.rule || {};
        this._ruleId   = r.id   || '';
        this._ruleName = r.name || '';
        this._priority = r.priority !== undefined ? r.priority : 0;
        this._enabled  = r.enabled  !== false;
        this._stop     = r.stop     === true;
        this._when     = r.when     || null;
        this._apply    = r.apply    || {};
        this._errors   = {};
        this._applyWarning = false;
    }

    willUpdate(changedProps) {
        if (changedProps.has('open') && this.open) {
            this._resetForm();
        }
    }

    // ─── Validation ────────────────────────────────────────────────────────────

    /**
     * Validate the rule ID field, updating this._errors.id and returning validity.
     * @param {boolean} [silent=false] - If true, don't update this._errors (for pre-check)
     * @returns {boolean} Whether the ID is valid
     */
    _validateId(silent = false) {
        const id = this._ruleId ? this._ruleId.trim() : '';
        let error = null;

        if (!id) {
            error = 'Rule ID is required';
        } else if (!/^[a-zA-Z_][a-zA-Z0-9_-]*$/.test(id)) {
            error = 'ID must start with a letter or _, then letters/digits/_ or -';
        } else if (this.mode === 'add') {
            const existing = this.editor?.config?.rules || [];
            if (existing.some(r => r.id === id)) {
                error = `A rule with id "${id}" already exists`;
            }
        }

        if (!silent) {
            if (error) {
                this._errors = { ...this._errors, id: error };
            } else {
                const next = { ...this._errors };
                delete next.id;
                this._errors = next;
            }
        }
        return error === null;
    }

    _isValid() {
        return this._validateId(true);
    }

    // ─── Handlers ──────────────────────────────────────────────────────────────

    _handleSave() {
        if (!this._validateId()) return;

        const ruleRaw = {
            id:       this._ruleId.trim(),
            name:     this._ruleName || undefined,
            priority: this._priority,
            enabled:  this._enabled,
            stop:     this._stop,
            when:     this._when || undefined,
            apply:    this._apply || {}
        };

        // Build clean rule object — preserve false/0 values but drop undefined
        const rule = Object.fromEntries(
            Object.entries(ruleRaw).filter(([, v]) => v !== undefined)
        );

        // Warn when apply is effectively empty. On the first Save click we show the
        // inline warning and return early so the user can see it. On the second click
        // (warning already visible) we proceed — treating it as a confirmed save.
        const hasApplyContent = rule.apply && (
            Object.keys(rule.apply.overlays || {}).length > 0 ||
            (rule.apply.tags && rule.apply.tags.length > 0) ||
            (rule.apply.animations && rule.apply.animations.length > 0) ||
            (rule.apply.profiles_add && rule.apply.profiles_add.length > 0) ||
            (rule.apply.profiles_remove && rule.apply.profiles_remove.length > 0)
        );
        if (!hasApplyContent && !this._applyWarning) {
            lcardsLog.warn('[RuleEditorDialog] Apply section is empty — showing warning before save:', rule.id);
            this._applyWarning = true;
            return;  // First click — show warning, don't save yet
        }

        lcardsLog.debug('[RuleEditorDialog] Saving rule:', rule.id);

        this.dispatchEvent(new CustomEvent('save', {
            detail: { rule },
            bubbles: true,
            composed: true
        }));

        // Self-close so the dialog hides immediately even before the parent updates
        this.open = false;
    }

    _handleCancel() {
        this.dispatchEvent(new CustomEvent('cancel', {
            bubbles: true,
            composed: true
        }));
    }

    _ignoreKeydown(e) {
        e.stopPropagation();
    }

    // ─── Render ────────────────────────────────────────────────────────────────

    render() {
        if (!this.open) return html``;

        return html`
            <lcards-dialog
                .open=${this.open}
                scrimClickAction=""
                escapeKeyAction="">

                <span slot="heading">
                    ${this.mode === 'add' ? 'Add Rule' : `Edit Rule: ${this.rule?.id || ''}`}
                </span>

                <div style="padding: 0 24px 8px;" @keydown=${this._ignoreKeydown}>
                    ${this._renderForm()}
                </div>

                <div slot="primaryAction">
                    <ha-button
                        appearance="plain"
                        @click=${this._handleCancel}>
                        Cancel
                    </ha-button>
                    <ha-button
                        variant="brand"
                        appearance="accent"
                        @click=${this._handleSave}
                        ?disabled=${!this._isValid()}>
                        ${this.mode === 'add' ? 'Create Rule' : 'Save Rule'}
                    </ha-button>
                </div>
            </lcards-dialog>
        `;
    }

    _renderForm() {
        return html`
            <div class="form-content">

                <!-- Rule Identity -->
                <lcards-form-section
                    header="Rule Identity"
                    icon="mdi:identifier"
                    ?expanded=${true}
                    ?outlined=${false}>

                    <!-- ID + Name row -->
                    <div class="identity-grid">
                        <div>
                            <ha-selector
                                .hass=${this.hass}
                                .label=${'Rule ID *'}
                                .helper=${'Unique identifier: letters, digits, _ or - (must start with letter or _)'}
                                .selector=${{ text: {} }}
                                .value=${this._ruleId}
                                .disabled=${this.mode === 'edit'}
                                @value-changed=${(e) => {
                                    this._ruleId = e.detail.value;
                                    this._validateId();
                                }}>
                            </ha-selector>
                            ${this._errors.id ? html`<div class="error-text">${this._errors.id}</div>` : ''}
                        </div>
                        <div>
                            <ha-selector
                                .hass=${this.hass}
                                .label=${'Name (optional)'}
                                .helper=${'Human-readable label for this rule'}
                                .selector=${{ text: {} }}
                                .value=${this._ruleName}
                                @value-changed=${(e) => this._ruleName = e.detail.value}>
                            </ha-selector>
                        </div>
                    </div>

                    <!-- Priority + Enabled + Stop row -->
                    <div class="identity-right">
                        <ha-selector
                            .hass=${this.hass}
                            .label=${'Priority'}
                            .helper=${'Higher values execute first (0–1000)'}
                            .selector=${{ number: { min: 0, max: 1000, mode: 'box' } }}
                            .value=${this._priority}
                            @value-changed=${(e) => this._priority = e.detail.value}>
                        </ha-selector>

                        <ha-selector
                            .hass=${this.hass}
                            .label=${'Enabled'}
                            .helper=${'Disable to temporarily skip this rule'}
                            .selector=${{ boolean: {} }}
                            .value=${this._enabled}
                            @value-changed=${(e) => this._enabled = e.detail.value}>
                        </ha-selector>

                        <ha-selector
                            .hass=${this.hass}
                            .label=${'Stop Processing'}
                            .helper=${'When true, lower-priority rules will not be evaluated after this one matches'}
                            .selector=${{ boolean: {} }}
                            .value=${this._stop}
                            @value-changed=${(e) => this._stop = e.detail.value}>
                        </ha-selector>
                    </div>
                </lcards-form-section>

                <!-- Conditions (when) -->
                <lcards-form-section
                    header="Conditions"
                    description="Rule fires when these conditions are met. Leave empty to always apply."
                    icon="mdi:filter"
                    ?expanded=${true}
                    ?outlined=${false}>

                    <lcards-condition-group-editor
                        .hass=${this.hass}
                        .value=${this._when}
                        @value-changed=${(e) => this._when = e.detail.value}>
                    </lcards-condition-group-editor>
                </lcards-form-section>

                <!-- Apply -->
                <lcards-form-section
                    header="Apply"
                    description="What to change when the rule fires"
                    icon="mdi:magic-staff"
                    ?expanded=${true}
                    ?outlined=${false}>

                    ${this._applyWarning ? html`
                        <ha-alert alert-type="warning">
                            The Apply section is empty — this rule will fire but do nothing.
                            Add at least one overlay target or tag target.
                        </ha-alert>
                    ` : ''}

                    <lcards-rule-apply-editor
                        .hass=${this.hass}
                        .editor=${this.editor}
                        .value=${this._apply}
                        @value-changed=${(e) => {
                            this._apply = e.detail.value;
                            this._applyWarning = false;
                        }}>
                    </lcards-rule-apply-editor>
                </lcards-form-section>

            </div>
        `;
    }
}

customElements.define('lcards-rule-editor-dialog', LCARdSRuleEditorDialog);
