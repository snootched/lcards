/**
 * @fileoverview LCARdS Select Menu Editor — v2
 *
 * Visual configuration editor for the lcards-select-menu card.
 *
 * Tab structure:
 *   1. Config  - Domain-filtered entity picker, ha-selector preset dropdown, ID / dimensions
 *   2. Grid    - Columns, row height, gaps, flow, alignment
 *   3. Style   - Background/text colour, typography, border (via lcards-color-section-v2)
 *   4. Options - Draggable reorderable list; entity-linked or manual mode; per-option editing
 *   5. Actions - Card-level actions with clear priority explanations
 *   + utility tabs (YAML, DataSources, ThemeBrowser, Provenance, etc.)
 *
 */

import { html, css } from 'lit';
import { lcardsLog } from '../../utils/lcards-logging.js';
import { LCARdSBaseEditor } from '../base/LCARdSBaseEditor.js';
import { LCARdSFormFieldHelper as FormField } from '../components/shared/lcards-form-field.js';

// Shared editor components
import '../components/shared/lcards-message.js';
import '../components/shared/lcards-form-section.js';
import '../components/shared/lcards-form-field.js';

// Style editors
import '../components/editors/lcards-color-section-v2.js';

// Utility tab components
import '../components/datasources/lcards-datasource-editor-tab.js';
import '../components/templates/lcards-template-evaluation-tab.js';
import '../components/theme-browser/lcards-theme-token-browser-tab.js';
import '../components/provenance/lcards-provenance-tab.js';

// @ts-ignore - TS2417: static side extends - getConfigElement signature
export class LCARdSSelectMenuEditor extends LCARdSBaseEditor {

    static get properties() {
        return {
            ...super.properties,
            _expandedOption: { type: String, state: true },
            _dragIndex:      { type: Number, state: true },
            _dragOverIndex:  { type: Number, state: true },
            _confirmAction:  { type: Object, state: true },
        };
    }

    static get styles() {
        return [
            super.styles,
            css`
                /* ── Options list (matches LCARS background-animation-editor style) ── */
                .options-list {
                    display: flex;
                    flex-direction: column;
                    gap: 16px;
                }

                .option-row {
                    background: var(--card-background-color, var(--ha-card-background, #1c1c1c));
                    border: 1px solid var(--divider-color, #333);
                    border-radius: var(--ha-card-border-radius, 12px);
                    overflow: hidden;
                    transition: transform 0.1s ease, opacity 0.1s ease;
                }
                .option-row.drag-over {
                    transform: translateY(-3px);
                    border-color: var(--primary-color, #ff9900);
                }
                .option-row.dragging { opacity: 0.4; }

                .option-header {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    padding: 12px;
                    cursor: pointer;
                    user-select: none;
                    background: var(--secondary-background-color, #2d2d2d);
                }
                .option-header:hover {
                    background: var(--primary-background-color, #383838);
                }

                .drag-handle {
                    cursor: grab;
                    color: var(--secondary-text-color, #888);
                    flex-shrink: 0;
                    display: flex;
                    align-items: center;
                    --mdc-icon-size: 20px;
                }
                .drag-handle:active { cursor: grabbing; }

                .option-icon {
                    color: var(--primary-color, #ff9900);
                    --mdc-icon-size: 24px;
                    flex-shrink: 0;
                }

                .option-info {
                    flex: 1;
                    min-width: 0;
                }

                .option-title-row {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    margin-bottom: 4px;
                }

                .option-title {
                    font-weight: 600;
                    font-size: 18px;
                }

                .option-details {
                    font-size: 12px;
                    color: var(--secondary-text-color, #888);
                    font-family: monospace;
                }

                .option-actions {
                    display: flex;
                    gap: 4px;
                }

                .layer-badge {
                    font-size: 11px;
                    padding: 2px 8px;
                    background: var(--primary-color);
                    color: var(--text-primary-color);
                    border-radius: 12px;
                    font-weight: 600;
                }

                ha-icon-button {
                    --mdc-icon-button-size: 36px;
                    --mdc-icon-size: 20px;
                }

                .expand-icon {
                    transition: transform 0.2s;
                    flex-shrink: 0;
                }

                .expand-icon.expanded {
                    transform: rotate(180deg);
                }

                .option-body {
                    padding: 16px 14px;
                    background: var(--card-background-color, #1c1c1c);
                    border-top: 1px solid var(--divider-color, #333);
                    display: flex;
                    flex-direction: column;
                    gap: 10px;
                }

                /* ── Add option row ── */
                .add-option-row {
                    display: flex;
                    gap: 8px;
                    align-items: center;
                    margin-top: 8px;
                }
                .add-option-row ha-textfield { flex: 1; }

                /* ── Entity sync strip ── */
                .entity-sync-strip {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    padding: 8px 10px;
                    background: color-mix(in srgb, var(--primary-color, #ff9900) 15%, transparent);
                    border-radius: 6px;
                    font-size: 12px;
                    margin-bottom: 8px;
                }
            `
        ];
    }

    constructor() {
        super();
        this.cardType                 = 'select-menu';
        this._expandedOption          = null;
        this._dragIndex               = -1;
        this._dragOverIndex           = -1;
        this._addOptionValue          = '';
        this._confirmAction           = null;
        this._buttonTemplateDialogRef = null;
        lcardsLog.debug('[LCARdSSelectMenuEditor] Initialized');
    }

    // =========================================================================
    // HELPERS
    // =========================================================================

    _getPresetOptions() {
        const spm   = window.lcards?.core?.stylePresetManager;
        const names = spm?.getAvailablePresets?.('button') || [];
        return [
            { value: '', label: '\u2014 None \u2014' },
            ...names.map(name => ({
                value: name,
                label: name.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
            }))
        ];
    }

    _getWorkingOptionsList() {
        const cfg   = this.config?.options;
        const eid   = this.config?.entity;
        const eOpts = (eid && this.hass) ? (this.hass.states[eid]?.attributes?.options || []) : [];

        if (!cfg) return eOpts.map(v => ({
            value: v, label: v, icon: null,
            tap_action: null, hold_action: null, double_tap_action: null,
        }));

        if (Array.isArray(cfg)) {
            return cfg.map(o => ({
                value:             o.value,
                label:             o.label             ?? o.value,
                icon:              o.icon              ?? null,
                tap_action:        o.tap_action        ?? null,
                hold_action:       o.hold_action       ?? null,
                double_tap_action: o.double_tap_action ?? null,
            }));
        }
        return eOpts.map(v => {
            const ov = cfg[v] || {};
            return {
                value:             v,
                label:             ov.label             ?? v,
                icon:              ov.icon              ?? null,
                tap_action:        ov.tap_action        ?? null,
                hold_action:       ov.hold_action       ?? null,
                double_tap_action: ov.double_tap_action ?? null,
            };
        });
    }

    _hasExplicitOptions() { return !!this.config?.options; }

    _hasEntityOptionMismatch() {
        const eid = this.config?.entity;
        if (!eid || !this.hass || !this._hasExplicitOptions()) return false;
        const eOpts = new Set(this.hass.states[eid]?.attributes?.options || []);
        const cOpts = new Set(this._getWorkingOptionsList().map(o => o.value));
        return [...eOpts].some(v => !cOpts.has(v)) || [...cOpts].some(v => !eOpts.has(v));
    }

    _syncFromEntity() {
        const eid   = this.config?.entity;
        const eOpts = this.hass?.states[eid]?.attributes?.options || [];
        const byVal = Object.fromEntries(this._getWorkingOptionsList().map(o => [o.value, o]));
        const newOpts = eOpts.map(v => {
            const prev  = byVal[v] || {};
            const entry = { value: v };
            if (prev.label && prev.label !== v) entry.label             = prev.label;
            if (prev.icon)              entry.icon              = prev.icon;
            if (prev.tap_action)        entry.tap_action        = prev.tap_action;
            if (prev.hold_action)       entry.hold_action       = prev.hold_action;
            if (prev.double_tap_action) entry.double_tap_action = prev.double_tap_action;
            return entry;
        });
        this._updateConfig({ options: newOpts });
    }

    _setOptionField(index, field, value) {
        const opts      = this._getWorkingOptionsList().map(o => this._minimal(o));
        const row       = { ...opts[index] };
        if (value === undefined || value === null || value === '') {
            delete row[field];
        } else {
            row[field] = value;
        }
        opts[index] = this._minimal(row);
        this._updateConfig({ options: opts });
    }

    _minimal(row) {
        const out = { value: row.value };
        if (row.label && row.label !== row.value) out.label             = row.label;
        if (row.icon)              out.icon              = row.icon;
        if (row.tap_action)        out.tap_action        = row.tap_action;
        if (row.hold_action)       out.hold_action       = row.hold_action;
        if (row.double_tap_action) out.double_tap_action = row.double_tap_action;
        return out;
    }

    _moveOption(from, to) {
        if (from === to) return;
        const opts = this._getWorkingOptionsList().map(o => this._minimal(o));
        const [item] = opts.splice(from, 1);
        opts.splice(to, 0, item);
        this._updateConfig({ options: opts });
    }

    _removeOption(index) {
        const opts = this._getWorkingOptionsList().map(o => this._minimal(o));
        opts.splice(index, 1);
        this._updateConfig({ options: opts.length ? opts : undefined });
    }

    _addManualOption(value) {
        if (!value?.trim()) return;
        const opts = this._getWorkingOptionsList().map(o => this._minimal(o));
        if (opts.find(o => o.value === value)) return;
        opts.push({ value: value.trim() });
        this._updateConfig({ options: opts });
        this._addOptionValue = '';
        this.requestUpdate();
    }

    _clearExplicitOptions() {
        const cfg = { ...this.config };
        delete cfg.options;
        this.dispatchEvent(new CustomEvent('config-changed', { detail: { config: cfg } }));
    }

    _setOptionValueKey(index, newValue) {
        const opts    = this._getWorkingOptionsList().map(o => this._minimal(o));
        opts[index]   = this._minimal({ ...opts[index], value: newValue });
        this._updateConfig({ options: opts });
        this._expandedOption = newValue;
        this.requestUpdate();
    }

    // =========================================================================
    // TABS
    // =========================================================================

    _getTabDefinitions() {
        return [
            { label: 'Config',  content: () => this._renderConfigTab() },
            { label: 'Grid',    content: () => this._renderGridTab() },
            { label: 'Style',   content: () => this._renderStyleTab() },
            { label: 'Options', content: () => this._renderOptionsTab() },
            { label: 'Actions', content: () => this._renderActionsTab() },
            ...this._getUtilityTabs(),
        ];
    }

    // ── Config Tab ────────────────────────────────────────────────────────────

    _renderConfigTab() {
        return html`
            <lcards-form-section
                header="Entity"
                description="The input_select or select entity whose options become buttons"
                icon="mdi:list-box-outline"
                ?expanded=${true}
                outlined>
                <ha-selector
                    .hass=${this.hass}
                    .label=${'Entity'}
                    .helper=${'Only input_select and select domains are shown'}
                    .selector=${{
                        entity: { filter: [{ domain: 'input_select' }, { domain: 'select' }] }
                    }}
                    .value=${this.config?.entity || ''}
                    @value-changed=${(e) => this._setConfigValue('entity', e.detail.value || undefined)}>
                </ha-selector>
            </lcards-form-section>

            <lcards-form-section
                header="Style Preset"
                description="Button look applied to all options: lozenge, filled, outline, pill…"
                icon="mdi:palette-outline"
                ?expanded=${true}
                outlined>
                <ha-selector
                    .hass=${this.hass}
                    .label=${'Button Preset'}
                    .helper=${'Named style from StylePresetManager. Overridable per-option via style: config.'}
                    .selector=${{ select: { mode: 'dropdown', options: this._getPresetOptions() } }}
                    .value=${this.config?.preset || ''}
                    @value-changed=${(e) => this._setConfigValue('preset', e.detail.value || undefined)}>
                </ha-selector>
            </lcards-form-section>

            <lcards-form-section
                header="Card Identification"
                description="ID and tags for rules engine and animation targeting"
                icon="mdi:tag"
                ?expanded=${false}
                ?outlined=${true}
                headerLevel="4">
                ${FormField.renderField(this, 'id', {
                    label: 'Card ID',
                    helper: 'Unique identifier for rules engine targeting'
                })}
                ${FormField.renderField(this, 'tags', {
                    label: 'Tags',
                    helper: 'Tags for rules engine categorization'
                })}
            </lcards-form-section>

            <lcards-form-section
                header="Card Dimensions"
                description="Override height/width — most layouts size automatically"
                icon="mdi:resize"
                ?expanded=${false}
                ?outlined=${true}
                headerLevel="4">
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
                    ${FormField.renderField(this, 'height')}
                    ${FormField.renderField(this, 'width')}
                </div>
            </lcards-form-section>
        `;
    }

    // ── Style Tab ─────────────────────────────────────────────────────────────

    _renderStyleTab() {
        const template = this.config?.button_template;
        return html`
            <lcards-form-section
                header="Button Style Template"
                description="Shared style applied to all option buttons"
                icon="mdi:palette-outline"
                ?expanded=${true}
                outlined>

                <lcards-message type=${template ? 'success' : 'info'}>
                    ${template ? html`
                        A button template is configured. The settings below describe what
                        the template controls — click <strong>Edit Button Style…</strong> to change it.
                    ` : html`
                        No template set yet. Click <strong>Configure Button Style…</strong> to open
                        the full lcards-button editor and define the shared look for every option button.
                    `}
                    <ul style="margin:8px 0 0;padding-left:18px;line-height:1.9">
                        <li>
                            <strong>style</strong> — fill colour, border, radius per state
                            (<code>active</code> = selected option, <code>inactive</code> = all others,
                            <code>hover</code>, <code>pressed</code>…)
                        </li>
                        <li>
                            <strong>text.default</strong> — font size, weight, transform, letter-spacing
                            for all text layers
                        </li>
                        <li>
                            <strong>text.label</strong> — styling for the button's primary
                            <em>label</em> layer (centered text), which displays each option's
                            <strong>Label</strong> field (set per-option on the Options tab).
                            The label <em>content</em> is always injected from the option —
                            only style properties (colour, size, weight…) belong here.
                        </li>
                        <li><strong>min_height / padding</strong> — button sizing</li>
                        <li><strong>animations</strong> — entrance/exit effects</li>
                    </ul>
                    <div style="margin-top:6px;font-size:12px;color:var(--secondary-text-color)">
                        Preset is set on the Config tab. Each option's label, icon, and actions
                        are set on the Options tab and are never part of this template.
                    </div>
                </lcards-message>

                <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:8px">
                    <ha-button raised @click=${() => this._openButtonTemplateEditor()}>
                        <ha-icon icon="mdi:pencil" slot="start"></ha-icon>
                        ${template ? 'Edit Button Style…' : 'Configure Button Style…'}
                    </ha-button>
                    ${template ? html`
                        <ha-button @click=${() => this._updateConfig({ button_template: undefined })}>
                            <ha-icon icon="mdi:delete-outline" slot="start"></ha-icon>
                            Clear Template
                        </ha-button>` : ''}
                </div>
            </lcards-form-section>
        `;
    }

    // ── Grid Tab ──────────────────────────────────────────────────────────────

    _renderGridTab() {
        const g = this.config?.grid || {};
        return html`
            <lcards-form-section
                header="Layout"
                description="Columns and row height"
                icon="mdi:view-grid-outline"
                ?expanded=${true}
                outlined>

                <lcards-message type="info">
                    Defaults: 1 column, 56 px row height — matching a standard HA button card row.
                    Increase columns to show options side-by-side.
                </lcards-message>

                <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:8px">
                    <ha-selector
                        .hass=${this.hass}
                        .label=${'Columns'}
                        .helper=${'Number (e.g. 3) or CSS (e.g. repeat(auto-fill, 100px))'}
                        .selector=${{ text: {} }}
                        .value=${g.columns !== undefined ? String(g.columns) : ''}
                        @value-changed=${(e) => {
                            const v = e.detail.value;
                            const n = Number(v);
                            this._setConfigValue('grid.columns', !v ? undefined : (isNaN(n) ? v : n));
                        }}>
                    </ha-selector>
                    <ha-selector
                        .hass=${this.hass}
                        .label=${'Row Height'}
                        .helper=${'e.g. 56px or minmax(40px,auto). Default: 56px'}
                        .selector=${{ text: {} }}
                        .value=${g['grid-auto-rows'] || ''}
                        @value-changed=${(e) => this._setConfigValue('grid.grid-auto-rows', e.detail.value || undefined)}>
                    </ha-selector>
                </div>
            </lcards-form-section>

            <lcards-form-section
                header="Spacing"
                description="Gaps between option buttons"
                icon="mdi:arrow-expand-all"
                ?expanded=${true}
                outlined>
                <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px">
                    <ha-selector
                        .hass=${this.hass}
                        .label=${'Gap (all)'}
                        .helper=${'e.g. 4px. Overridden by row/col gap below.'}
                        .selector=${{ text: {} }}
                        .value=${g.gap || ''}
                        @value-changed=${(e) => this._setConfigValue('grid.gap', e.detail.value || undefined)}>
                    </ha-selector>
                    <ha-selector
                        .hass=${this.hass}
                        .label=${'Row Gap'}
                        .selector=${{ text: {} }}
                        .value=${g['row-gap'] || ''}
                        @value-changed=${(e) => this._setConfigValue('grid.row-gap', e.detail.value || undefined)}>
                    </ha-selector>
                    <ha-selector
                        .hass=${this.hass}
                        .label=${'Column Gap'}
                        .selector=${{ text: {} }}
                        .value=${g['column-gap'] || ''}
                        @value-changed=${(e) => this._setConfigValue('grid.column-gap', e.detail.value || undefined)}>
                    </ha-selector>
                </div>
            </lcards-form-section>

            <lcards-form-section
                header="Advanced CSS Grid"
                description="Power-user CSS Grid overrides"
                icon="mdi:code-braces"
                ?expanded=${false}
                outlined>
                <div style="display:flex;flex-direction:column;gap:8px">
                    <ha-selector
                        .hass=${this.hass}
                        .label=${'grid-template-columns (overrides Columns above)'}
                        .helper=${'Full CSS e.g. 60px 1fr 60px'}
                        .selector=${{ text: {} }}
                        .value=${g['grid-template-columns'] || ''}
                        @value-changed=${(e) => this._setConfigValue('grid.grid-template-columns', e.detail.value || undefined)}>
                    </ha-selector>
                    <ha-selector
                        .hass=${this.hass}
                        .label=${'grid-auto-flow'}
                        .selector=${{
                            select: {
                                mode: 'dropdown',
                                options: [
                                    { value: '',              label: 'row (default)' },
                                    { value: 'column',        label: 'column' },
                                    { value: 'row dense',     label: 'row dense' },
                                    { value: 'column dense',  label: 'column dense' },
                                ]
                            }
                        }}
                        .value=${g['grid-auto-flow'] || ''}
                        @value-changed=${(e) => this._setConfigValue('grid.grid-auto-flow', e.detail.value || undefined)}>
                    </ha-selector>
                    <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
                        <ha-selector
                            .hass=${this.hass}
                            .label=${'justify-items'}
                            .selector=${{ select: { mode: 'dropdown', options: [
                                {value:'',label:'(default)'},
                                {value:'start',label:'start'},
                                {value:'end',label:'end'},
                                {value:'center',label:'center'},
                                {value:'stretch',label:'stretch'},
                            ]}}}
                            .value=${g['justify-items'] || ''}
                            @value-changed=${(e) => this._setConfigValue('grid.justify-items', e.detail.value || undefined)}>
                        </ha-selector>
                        <ha-selector
                            .hass=${this.hass}
                            .label=${'align-items'}
                            .selector=${{ select: { mode: 'dropdown', options: [
                                {value:'',label:'(default)'},
                                {value:'start',label:'start'},
                                {value:'end',label:'end'},
                                {value:'center',label:'center'},
                                {value:'stretch',label:'stretch'},
                            ]}}}
                            .value=${g['align-items'] || ''}
                            @value-changed=${(e) => this._setConfigValue('grid.align-items', e.detail.value || undefined)}>
                        </ha-selector>
                    </div>
                </div>
            </lcards-form-section>
        `;
    }

    // ── Options Tab ───────────────────────────────────────────────────────────

    _renderOptionsTab() {
        const hasEntity   = !!this.config?.entity;
        const hasExplicit = this._hasExplicitOptions();
        const mismatch    = this._hasEntityOptionMismatch();
        const options     = this._getWorkingOptionsList();

        return html`
            <lcards-form-section
                header="Options Source"
                description="Pull from entity automatically, or manage options manually"
                icon="mdi:shape-plus"
                ?expanded=${true}
                outlined>

                <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:4px">
                    <ha-button
                            ?raised=${!hasExplicit}
                            @click=${() => hasExplicit ? this._requestConfirm('switch-to-entity') : null}>
                        <ha-icon icon="mdi:link-variant" slot="start"></ha-icon>
                        Entity-linked${!hasExplicit ? ' \u2713' : ''}
                    </ha-button>
                    <ha-button
                            ?raised=${hasExplicit}
                            @click=${() => !hasExplicit ? this._requestConfirm('switch-to-manual') : null}>
                        <ha-icon icon="mdi:playlist-edit" slot="start"></ha-icon>
                        Manual / Overrides${hasExplicit ? ' \u2713' : ''}
                    </ha-button>
                </div>

                ${!hasExplicit ? html`
                    <lcards-message type="info">
                        Options are read automatically from the entity attribute.<br>
                        Switch to <strong>Manual / Overrides</strong> to reorder, rename, filter,
                        or create options that aren't in the entity.
                    </lcards-message>
                    ${!hasEntity ? html`
                        <lcards-message type="warning">
                            No entity set. Configure one on the Config tab, or use Manual mode
                            to define options without an entity.
                        </lcards-message>` : ''}
                ` : html`
                    ${mismatch ? html`
                        <div class="entity-sync-strip">
                            <ha-icon icon="mdi:sync-alert"></ha-icon>
                            <span style="flex:1">Entity options have changed since last sync.</span>
                            <ha-button dense @click=${() => this._requestConfirm('sync-from-entity')}>
                                Reset from entity…
                            </ha-button>
                        </div>` : ''}
                    <lcards-message type="info">
                        Options below are stored in your card config.<br>
                        <strong>Drag</strong> to reorder &nbsp;\u2022&nbsp;
                        <strong>click a row</strong> to edit &nbsp;\u2022&nbsp;
                        <strong>trash icon</strong> to remove.<br>
                        Entity: ${hasEntity ? this.config.entity : '<em>none (manual-only)</em>'}
                    </lcards-message>
                `}
            </lcards-form-section>

            <lcards-form-section
                header="Options List"
                description="${options.length} option${options.length !== 1 ? 's' : ''}"
                icon="mdi:format-list-bulleted"
                ?expanded=${true}
                outlined>

                ${options.length === 0 ? html`
                    <lcards-message type="info">
                        No options yet.
                        ${hasEntity && !hasExplicit
                            ? 'Waiting for entity to load, or switch to Manual mode.'
                            : hasEntity
                                ? 'Click "Sync from entity" above to populate.'
                                : 'Add options below.'}
                    </lcards-message>` : ''}

                <div class="options-list"
                     @dragover=${(e) => e.preventDefault()}
                     @drop=${(e) => { e.preventDefault(); this._onListDrop(); }}>
                    ${options.map((opt, i) => this._renderOptionRow(opt, i, hasExplicit))}
                </div>

                ${this._renderAddRow(hasExplicit)}
            </lcards-form-section>

            ${this._renderConfirmDialog()}
        `;
    }

    _renderOptionRow(opt, index, interactive) {
        const isExpanded = this._expandedOption === opt.value;
        const isDragging = this._dragIndex === index;
        const isDragOver = this._dragOverIndex === index;
        const hasCustomLabel = opt.label && opt.label !== opt.value;
        const displayTitle   = hasCustomLabel ? opt.label : opt.value;

        return html`
            <div class="option-row ${isDragging ? 'dragging' : ''} ${isDragOver ? 'drag-over' : ''}"
                 draggable="true"
                 @dragstart=${(e) => this._onDragStart(e, index)}
                 @dragend=${()   => { this._dragIndex = -1; this._dragOverIndex = -1; this.requestUpdate(); }}
                 @dragenter=${(e) => { e.preventDefault(); this._dragOverIndex = index; this.requestUpdate(); }}>

                <div class="option-header"
                     @click=${() => { this._expandedOption = isExpanded ? null : opt.value; this.requestUpdate(); }}>

                    <!-- Drag handle -->
                    <ha-icon
                        class="drag-handle"
                        icon="mdi:drag"
                        @click=${(e) => e.stopPropagation()}>
                    </ha-icon>

                    <!-- Option icon -->
                    <ha-icon
                        class="option-icon"
                        icon=${opt.icon || 'mdi:circle-small'}>
                    </ha-icon>

                    <!-- Info block -->
                    <div class="option-info">
                        <div class="option-title-row">
                            <span class="option-title">${displayTitle}</span>
                            ${opt.icon         ? html`<span class="layer-badge">ICON</span>` : ''}
                            ${opt.tap_action   ? html`<span class="layer-badge">TAP</span>` : ''}
                            ${(opt.hold_action || opt.double_tap_action) ? html`<span class="layer-badge">ACT</span>` : ''}
                        </div>
                        ${hasCustomLabel ? html`<div class="option-details">${opt.value}</div>` : ''}
                    </div>

                    <!-- Action buttons -->
                    <div class="option-actions">
                        ${interactive ? html`
                            <ha-icon-button
                                @click=${(e) => { e.stopPropagation(); this._removeOption(index); }}
                                .label=${'Delete'}
                                .path=${'M19,4H15.5L14.5,3H9.5L8.5,4H5V6H19M6,19A2,2 0 0,0 8,21H16A2,2 0 0,0 18,19V7H6V19Z'}>
                            </ha-icon-button>` : ''}
                    </div>

                    <!-- Expand chevron -->
                    <ha-icon
                        class="expand-icon ${isExpanded ? 'expanded' : ''}"
                        icon="mdi:chevron-down">
                    </ha-icon>
                </div>

                ${isExpanded ? html`
                    <div class="option-body">
                        ${this._renderOptionBody(opt, index, interactive)}
                    </div>` : ''}
            </div>
        `;
    }

    _renderOptionBody(opt, index, interactive) {
        // Label, icon, and per-option tap action are ALWAYS editable.
        // (Editing in entity-linked mode auto-promotes to object-form overrides.)
        // Add / remove / reorder / rename value-key require interactive (manual) mode.
        return html`
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
                    ${interactive ? html`
                        <ha-selector
                            .hass=${this.hass}
                            .label=${'Value (entity key, case-sensitive)'}
                            .selector=${{ text: {} }}
                            .value=${opt.value}
                            @value-changed=${(e) => {
                                if (e.detail.value && e.detail.value !== opt.value)
                                    this._setOptionValueKey(index, e.detail.value);
                            }}>
                        </ha-selector>` : html`
                        <div>
                            <div style="font-size:11px;color:var(--secondary-text-color);padding-bottom:2px">Entity value (read-only)</div>
                            <div style="font-size:13px;font-family:var(--lcars-font,'Antonio',sans-serif);letter-spacing:0.04em;color:var(--primary-color,#ff9900)">${opt.value}</div>
                        </div>`}

                    <ha-selector
                        .hass=${this.hass}
                        .label=${'Display Label'}
                        .helper=${'Override the visible name (leave blank to use value)'}
                        .selector=${{ text: {} }}
                        .value=${opt.label !== opt.value ? (opt.label || '') : ''}
                        @value-changed=${(e) => this._setOptionField(index, 'label', e.detail.value || undefined)}>
                    </ha-selector>
                </div>

                <ha-selector
                    .hass=${this.hass}
                    .label=${'Icon (optional, e.g. mdi:home)'}
                    .selector=${{ icon: {} }}
                    .value=${opt.icon || ''}
                    @value-changed=${(e) => this._setOptionField(index, 'icon', e.detail.value || undefined)}>
                </ha-selector>

                <div style="font-size:12px;color:var(--secondary-text-color);margin-top:2px">
                    <strong>Per-option actions</strong> — override card-level actions for this option only.
                    Leave as “None” to fall back to the card-level setting.
                </div>
                <ha-selector
                    .hass=${this.hass}
                    .label=${'Tap action (this option only)'}
                    .selector=${{ ui_action: {} }}
                    .value=${opt.tap_action || { action: 'none' }}
                    @value-changed=${(e) => {
                        const v = e.detail.value;
                        this._setOptionField(index, 'tap_action',
                            (!v || v.action === 'none') ? undefined : v);
                    }}>
                </ha-selector>
                <ha-selector
                    .hass=${this.hass}
                    .label=${'Hold action (this option only)'}
                    .selector=${{ ui_action: {} }}
                    .value=${opt.hold_action || { action: 'none' }}
                    @value-changed=${(e) => {
                        const v = e.detail.value;
                        this._setOptionField(index, 'hold_action',
                            (!v || v.action === 'none') ? undefined : v);
                    }}>
                </ha-selector>
                <ha-selector
                    .hass=${this.hass}
                    .label=${'Double-tap action (this option only)'}
                    .selector=${{ ui_action: {} }}
                    .value=${opt.double_tap_action || { action: 'none' }}
                    @value-changed=${(e) => {
                        const v = e.detail.value;
                        this._setOptionField(index, 'double_tap_action',
                            (!v || v.action === 'none') ? undefined : v);
                    }}>
                </ha-selector>
        `;
    }

    _renderAddRow(interactive) {
        if (!interactive) {
            return html`
                <ha-button style="margin-top:8px;width:100%" @click=${() => this._syncFromEntity()}>
                    <ha-icon icon="mdi:plus" slot="start"></ha-icon>
                    Switch to Manual mode to add / edit options
                </ha-button>`;
        }
        return html`
            <div class="add-option-row">
                <ha-textfield
                    label="New option value"
                    .value=${this._addOptionValue}
                    @input=${(e) => { this._addOptionValue = e.target.value; }}
                    @keydown=${(e) => { if (e.key === 'Enter') this._addManualOption(this._addOptionValue); }}>
                </ha-textfield>
                <ha-icon-button
                    .label=${'Add option'}
                    .path=${'M19,13H13V19H11V13H5V11H11V5H13V11H19V13Z'}
                    @click=${() => this._addManualOption(this._addOptionValue)}>
                </ha-icon-button>
            </div>
        `;
    }

    _onDragStart(event, index) {
        this._dragIndex = index;
        event.dataTransfer.effectAllowed = 'move';
        event.dataTransfer.setData('text/plain', String(index));
        this.requestUpdate();
    }

    _onListDrop() {
        if (this._dragIndex >= 0 && this._dragOverIndex >= 0 && this._dragIndex !== this._dragOverIndex) {
            this._moveOption(this._dragIndex, this._dragOverIndex);
        }
        this._dragIndex = -1; this._dragOverIndex = -1;
        this.requestUpdate();
    }

    // ── Actions Tab ───────────────────────────────────────────────────────────

    _renderActionsTab() {
        return html`
            <!-- Priority info first so user understands the model before configuring -->
            <lcards-message type="info">
                <strong>How actions work:</strong><br>
                ① <strong>Per-option tap action</strong> (Options tab) — highest priority; overrides the card-level tap action for that specific option only.<br>
                ② <strong>Card-level Tap Action</strong> (below) — applied to all options that have no per-option action set.<br>
                ③ <strong>Default</strong> — when neither above is set, tapping calls <code>select_option</code> / <code>input_select.select_option</code> automatically.<br>
                <hr style="border:none;border-top:1px solid var(--divider-color);margin:6px 0">
                <strong>Hold</strong> and <strong>Double-Tap</strong> default to <em>no action</em>
                (they will not fall through to the tap action). Set them here as a card-wide default,
                or override per-option on the Options tab.
            </lcards-message>

            <lcards-form-section
                header="Tap Action"
                description="Override the built-in select_option call for ALL options. Per-option tap actions (Options tab) take priority."
                icon="mdi:gesture-tap"
                ?expanded=${false}
                outlined>
                <ha-selector
                    .hass=${this.hass}
                    .label=${'Tap action (all options)'}
                    .helper=${'Overrides the default select_option call. Leave blank for default behavior.'}
                    .selector=${{ ui_action: {} }}
                    .value=${this.config?.tap_action || { action: 'none' }}
                    @value-changed=${(e) => {
                        const v = e.detail.value;
                        this._setConfigValue('tap_action', (!v || v.action === 'none') ? undefined : v);
                    }}>
                </ha-selector>
            </lcards-form-section>

            <lcards-form-section
                header="Hold Action"
                description="Long-press on any option button. Per-option (Options tab) overrides this."
                icon="mdi:gesture-tap-button"
                ?expanded=${false}
                outlined>
                <ha-selector
                    .hass=${this.hass}
                    .label=${'Hold action'}
                    .selector=${{ ui_action: {} }}
                    .value=${this.config?.hold_action || { action: 'none' }}
                    @value-changed=${(e) => {
                        const v = e.detail.value;
                        this._setConfigValue('hold_action', (!v || v.action === 'none') ? undefined : v);
                    }}>
                </ha-selector>
            </lcards-form-section>

            <lcards-form-section
                header="Double-Tap Action"
                description="Double-tap on any option button. Per-option (Options tab) overrides this."
                icon="mdi:gesture-double-tap"
                ?expanded=${false}
                outlined>
                <ha-selector
                    .hass=${this.hass}
                    .label=${'Double-tap action'}
                    .selector=${{ ui_action: {} }}
                    .value=${this.config?.double_tap_action || { action: 'none' }}
                    @value-changed=${(e) => {
                        const v = e.detail.value;
                        this._setConfigValue('double_tap_action', (!v || v.action === 'none') ? undefined : v);
                    }}>
                </ha-selector>
            </lcards-form-section>
        `;
    }

    // =========================================================================
    // CONFIRM DIALOGS
    // =========================================================================

    _requestConfirm(action) {
        this._confirmAction = action;
        this.requestUpdate();
    }

    _cancelConfirm() {
        this._confirmAction = null;
        this.requestUpdate();
    }

    _executeConfirmedAction() {
        const action = this._confirmAction;
        this._confirmAction = null;
        this.requestUpdate();
        if      (action === 'switch-to-entity') this._clearExplicitOptions();
        else if (action === 'switch-to-manual') this._syncFromEntity();
        else if (action === 'sync-from-entity') this._syncFromEntity();
    }

    _renderConfirmDialog() {
        if (!this._confirmAction) return '';
        const messages = {
            'switch-to-entity': {
                title: 'Switch to Entity-linked?',
                body:  'This will remove all stored option overrides. Options will be read live from the entity. This cannot be undone.',
            },
            'switch-to-manual': {
                title: 'Switch to Manual / Overrides?',
                body:  'This will copy the current entity options into your config so you can reorder, rename, or add options. The entity will no longer be the live source.',
            },
            'sync-from-entity': {
                title: 'Reset options from entity?',
                body:  'This will replace your stored options with the current entity options, preserving existing labels, icons, and actions for matching values. Values not in the entity will be removed.',
            },
        };
        const { title, body } = messages[this._confirmAction] || { title: 'Confirm', body: 'Are you sure?' };
        return html`
            <ha-dialog open .headerTitle=${title} @closed=${() => this._cancelConfirm()}>
                <p style="margin:0;line-height:1.6">${body}</p>
                <div slot="footer" style="display:flex;gap:8px;justify-content:flex-end">
                    <ha-button appearance="plain" variant="neutral" @click=${() => this._cancelConfirm()}>Cancel</ha-button>
                    <ha-button variant="danger"                     @click=${() => this._executeConfirmedAction()}>Confirm</ha-button>
                </div>
            </ha-dialog>
        `;
    }

    // =========================================================================
    // BUTTON TEMPLATE SUB-EDITOR
    // =========================================================================

    _openButtonTemplateEditor() {
        if (!customElements.get('hui-card-element-editor')) {
            lcardsLog.warn('[LCARdSSelectMenuEditor] hui-card-element-editor not available');
            return;
        }

        // Close any already-open instance
        if (this._buttonTemplateDialogRef) {
            this._buttonTemplateDialogRef.remove();
            this._buttonTemplateDialogRef = null;
        }

        // Always provide type so hui-card-element-editor can find the card editor.
        // type is stripped before saving to button_template storage.
        const savedTemplate = this.config?.button_template || {};
        const editorValue = JSON.parse(JSON.stringify({
            ...savedTemplate,
            type: 'custom:lcards-button',   // always present so hui-card-element-editor can find the card editor
        }));

        const dialog = document.createElement('ha-dialog');
        // @ts-ignore - TS2339: auto-suppressed
        dialog.headerTitle = 'Button Style Template';
        dialog.setAttribute('prevent-scrim-close', '');
        this._buttonTemplateDialogRef = dialog;

        const container = document.createElement('div');
        container.style.cssText = 'padding:16px;min-height:300px;min-width:min(480px,90vw);box-sizing:border-box';

        const editor = document.createElement('hui-card-element-editor');
        // @ts-ignore - TS2339: auto-suppressed
        editor.hass     = this.hass;
        // @ts-ignore - TS2339: auto-suppressed
        editor.lovelace = this._getButtonTemplateLovelace();
        // @ts-ignore - TS2339: auto-suppressed
        editor.value    = editorValue;

        let pending = editorValue;

        editor.addEventListener('config-changed', (e) => {
            // @ts-ignore - TS2339: auto-suppressed
            if (e.detail?.config && typeof e.detail.config === 'object' && e.detail.config.type) {
                // @ts-ignore - TS2339: auto-suppressed
                pending = e.detail.config;
            }
        });
        editor.addEventListener('value-changed', (e) => {
            // @ts-ignore - TS2339: auto-suppressed
            if (e.detail?.value && typeof e.detail.value === 'object' && e.detail.value.type) {
                // @ts-ignore - TS2339: auto-suppressed
                pending = e.detail.value;
            }
        });

        container.appendChild(editor);
        dialog.appendChild(container);

        const footer = document.createElement('div');
        footer.setAttribute('slot', 'footer');
        footer.style.cssText = 'display:flex;gap:8px;justify-content:flex-end';

        const cancelBtn = document.createElement('ha-button');
        cancelBtn.setAttribute('appearance', 'plain');
        cancelBtn.setAttribute('variant', 'neutral');
        cancelBtn.textContent = 'Cancel';
        // @ts-ignore - TS2339: auto-suppressed
        cancelBtn.addEventListener('click', () => { dialog.open = false; });

        const saveBtn = document.createElement('ha-button');
        saveBtn.setAttribute('variant', 'brand');
        saveBtn.textContent = 'Save';
        saveBtn.addEventListener('click', () => {
            if (pending?.type) {
                this._updateConfig({ button_template: this._sanitizeButtonTemplate(pending) });
            }
            // @ts-ignore - TS2339: auto-suppressed
            dialog.open = false;
        });

        footer.appendChild(cancelBtn);
        footer.appendChild(saveBtn);
        dialog.appendChild(footer);

        dialog.addEventListener('closed', () => {
            dialog.remove();
            if (this._buttonTemplateDialogRef === dialog) {
                this._buttonTemplateDialogRef = null;
            }
        });

        document.body.appendChild(dialog);
        // @ts-ignore - TS2339: auto-suppressed
        setTimeout(() => { dialog.open = true; }, 10);
    }

    _getButtonTemplateLovelace() {
        // Unwrap: lovelace may be the wrapper object (has .config) or the plain config
        let lovelaceConfig = this.lovelace?.config || this.lovelace || {};
        if (!lovelaceConfig.views) {
            lovelaceConfig = { ...lovelaceConfig, views: [] };
        }
        if (lovelaceConfig.views.length === 0) {
            lovelaceConfig = { ...lovelaceConfig, views: [{ title: 'Home', path: 'home', cards: [] }] };
        }
        return lovelaceConfig;
    }

    /**
     * Strip keys from a button config that are managed per-option or at the
     * card level and must not live inside button_template.
     *
     * Per-option  : entity, icon, show_icon
     * Actions     : tap_action, hold_action, double_tap_action
     *               (managed per-option on the Options tab or card-level on Actions tab)
     * Card-level  : type (always set by _renderOption), preset (Config tab), id, tags
     * Partially   : text.label.content (label string) — only that leaf is stripped;
     *               text.default.* and text.label.* style props are kept so the
     *               template can control typography across all option buttons.
     */
    _sanitizeButtonTemplate(cfg) {
        if (!cfg || typeof cfg !== 'object') return cfg;
        const STRIP = new Set([
            'type',
            'entity',
            'icon',
            'show_icon',
            'preset',
            'tap_action',
            'hold_action',
            'double_tap_action',
            'id',
            'tags',
        ]);
        const out = Object.fromEntries(
            Object.entries(cfg).filter(([k]) => !STRIP.has(k))
        );
        // Strip text.label.content (per-option label string) but keep all other
        // text sub-keys (text.default.*, text.label color/size/weight, etc.)
        if (out.text != null) {
            const { content: _dropped, ...restLabel } = out.text?.label || {};
            const mergedText = {
                ...out.text,
                ...(Object.keys(restLabel).length ? { label: restLabel } : {}),
            };
            // If 'label' ended up empty (only had content), remove it
            if (!Object.keys(restLabel).length) delete mergedText.label;
            // If text is now entirely empty, drop the key
            if (Object.keys(mergedText).length) {
                out.text = mergedText;
            } else {
                delete out.text;
            }
        }
        return out;
    }
}

customElements.define('lcards-select-menu-editor', LCARdSSelectMenuEditor);
