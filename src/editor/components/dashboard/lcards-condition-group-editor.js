/**
 * LCARdS Condition Group Editor
 *
 * Visual editor for a `when` condition object matching the RulesEngine schema.
 * Supports nested ALL/ANY/NOT groups and all condition types.
 *
 * @element lcards-condition-group-editor
 * @fires value-changed - When conditions change (detail: { value: whenObject })
 *
 * @property {Object} value - The `when` condition object
 * @property {Object} hass  - Home Assistant instance
 */

import { LitElement, html, css } from 'lit';
import { lcardsLog } from '../../../utils/lcards-logging.js';

const CONDITION_TYPES = [
    { category: 'Entity', items: [
        { value: 'entity',      label: 'Entity State' },
        { value: 'entity_attr', label: 'Entity Attribute' }
    ]},
    { category: 'Template', items: [
        { value: 'jinja2',      label: 'Jinja2 Template' },
        { value: 'javascript',  label: 'JavaScript Template' }
    ]},
    { category: 'Time', items: [
        { value: 'time_between',   label: 'Time Between' },
        { value: 'weekday_in',     label: 'Weekday' },
        { value: 'sun_elevation',  label: 'Sun Elevation' }
    ]},
    { category: 'System', items: [
        { value: 'perf_metric',    label: 'Performance Metric' },
        { value: 'flag',           label: 'Debug Flag' },
        { value: 'random_chance',  label: 'Random Chance' }
    ]},
    { category: 'DataSource', items: [
        { value: 'map_range_cond', label: 'Map Range Condition' }
    ]},
    { category: 'Logic', items: [
        { value: 'all', label: 'ALL (AND sub-group)' },
        { value: 'any', label: 'ANY (OR sub-group)' },
        { value: 'not', label: 'NOT (negate)' }
    ]}
];

const ALL_TYPE_OPTIONS = CONDITION_TYPES.flatMap(c => c.items.map(i => ({ value: i.value, label: `${c.category}: ${i.label}` })));

const ENTITY_OPERATORS = [
    { value: 'equals',     label: 'equals' },
    { value: 'not_equals', label: 'not equals' },
    { value: 'above',      label: 'above' },
    { value: 'below',      label: 'below' },
    { value: 'in',         label: 'in list' },
    { value: 'not_in',     label: 'not in list' },
    { value: 'regex',      label: 'regex match' }
];

const WEEKDAYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];

export class LCARdSConditionGroupEditor extends LitElement {
    static get properties() {
        return {
            value:       { type: Object },
            hass:        { type: Object },
            _operator:   { type: String, state: true },   // 'all' | 'any' | 'single'
            _conditions: { type: Array, state: true }
        };
    }

    constructor() {
        super();
        this.value = null;
        this.hass = null;
        this._operator = 'single';
        this._conditions = [];
    }

    static get styles() {
        return css`
            :host { display: block; }

            .group-header {
                display: flex;
                align-items: center;
                gap: 8px;
                margin-bottom: 12px;
            }

            .group-header ha-selector {
                flex: 0 0 180px;
                margin-bottom: 0;
            }

            .conditions-list {
                display: flex;
                flex-direction: column;
                gap: 8px;
            }

            .condition-row {
                display: flex;
                gap: 8px;
                align-items: flex-start;
                background: var(--secondary-background-color, rgba(0,0,0,0.05));
                border-radius: 8px;
                padding: 8px;
                border: 1px solid var(--divider-color, #e0e0e0);
            }

            .condition-row .type-select {
                flex: 0 0 200px;
            }

            .condition-row .condition-fields {
                flex: 1;
                display: flex;
                flex-direction: column;
                gap: 8px;
            }

            .condition-row .delete-btn {
                flex: 0 0 auto;
                background: none;
                border: none;
                cursor: pointer;
                padding: 4px;
                border-radius: 4px;
                color: var(--error-color, #f44336);
                display: inline-flex;
                align-items: center;
                justify-content: center;
                width: 32px;
                height: 32px;
                margin-top: 4px;
            }

            .condition-row .delete-btn:hover {
                background: var(--error-color, #f44336);
                color: white;
            }

            .add-btn {
                display: flex;
                align-items: center;
                gap: 4px;
                margin-top: 8px;
                background: none;
                border: 1px dashed var(--primary-color, #03a9f4);
                border-radius: 8px;
                color: var(--primary-color, #03a9f4);
                cursor: pointer;
                padding: 8px 16px;
                width: 100%;
                justify-content: center;
                font-size: 13px;
                transition: all 0.2s;
            }

            .add-btn:hover {
                background: var(--primary-color, #03a9f4);
                color: white;
            }

            .inline-grid {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 8px;
            }

            .nested-group {
                border: 1px solid var(--primary-color, #03a9f4);
                border-radius: 8px;
                padding: 8px;
            }

            ha-selector {
                display: block;
            }

            ha-entity-picker {
                display: block;
                width: 100%;
            }
        `;
    }

    /** Parse the `value` (when object) into internal operator + conditions array */
    willUpdate(changedProps) {
        if (changedProps.has('value')) {
            this._parseValue(this.value);
        }
    }

    _parseValue(val) {
        if (!val || typeof val !== 'object' || Object.keys(val).length === 0) {
            this._operator = 'single';
            this._conditions = [];
            return;
        }
        if (val.all) {
            this._operator = 'all';
            this._conditions = Array.isArray(val.all) ? [...val.all] : [];
        } else if (val.any) {
            this._operator = 'any';
            this._conditions = Array.isArray(val.any) ? [...val.any] : [];
        } else {
            // Single condition object
            this._operator = 'single';
            this._conditions = [val];
        }
    }

    /** Build the `when` object from internal state and fire value-changed */
    _emit() {
        let result;
        if (this._operator === 'all') {
            result = { all: [...this._conditions] };
        } else if (this._operator === 'any') {
            result = { any: [...this._conditions] };
        } else {
            // single
            result = this._conditions.length > 0 ? this._conditions[0] : null;
        }
        this.dispatchEvent(new CustomEvent('value-changed', {
            detail: { value: result },
            bubbles: true,
            composed: true
        }));
    }

    _handleOperatorChange(e) {
        const newOp = e.detail.value;
        if (newOp === this._operator) return;

        // When switching to single, keep only first condition
        if (newOp === 'single' && this._conditions.length > 1) {
            this._conditions = [this._conditions[0]];
        }
        this._operator = newOp;
        this._emit();
    }

    _handleAddCondition() {
        const newCond = { _type: 'entity', entity: '' };
        if (this._operator === 'single' && this._conditions.length === 0) {
            this._conditions = [newCond];
        } else if (this._operator === 'single') {
            // Promote to 'all'
            this._operator = 'all';
            this._conditions = [...this._conditions, newCond];
        } else {
            this._conditions = [...this._conditions, newCond];
        }
        this._emit();
    }

    _handleDeleteCondition(index) {
        const updated = [...this._conditions];
        updated.splice(index, 1);
        this._conditions = updated;
        this._emit();
    }

    _handleConditionTypeChange(index, newType) {
        const updated = [...this._conditions];
        updated[index] = { _type: newType };
        this._conditions = updated;
        this._emit();
    }

    _handleConditionFieldChange(index, field, value) {
        const updated = [...this._conditions];
        updated[index] = { ...updated[index], [field]: value };
        this._conditions = updated;
        this._emit();
    }

    _handleNestedGroupChange(index, e) {
        const updated = [...this._conditions];
        const nestedType = updated[index]._type || 'all';
        const nestedVal = e.detail.value;
        if (nestedType === 'not') {
            // not wraps a single condition
            updated[index] = { _type: 'not', not: nestedVal };
        } else {
            // all or any – value IS { all: [...] } or { any: [...] }
            updated[index] = { _type: nestedType, ...(nestedVal || {}) };
        }
        this._conditions = updated;
        this._emit();
    }

    /** Detect the effective type of a stored condition object */
    _getConditionType(cond) {
        if (!cond) return 'entity';
        if (cond._type) return cond._type;
        if (cond.all) return 'all';
        if (cond.any) return 'any';
        if (cond.not) return 'not';
        if (cond.entity !== undefined && cond.attribute !== undefined) return 'entity_attr';
        if (cond.entity !== undefined) return 'entity';
        if (cond.template !== undefined && cond.template_type === 'javascript') return 'javascript';
        if (cond.template !== undefined) return 'jinja2';
        if (cond.time_range !== undefined || cond.after !== undefined) return 'time_between';
        if (cond.weekdays !== undefined) return 'weekday_in';
        if (cond.sun_elevation !== undefined || cond.sun !== undefined) return 'sun_elevation';
        if (cond.metric !== undefined) return 'perf_metric';
        if (cond.flag !== undefined) return 'flag';
        if (cond.probability !== undefined) return 'random_chance';
        if (cond.datasource !== undefined) return 'map_range_cond';
        return 'entity';
    }

    render() {
        const operatorOptions = [
            { value: 'all',    label: 'ALL (AND)' },
            { value: 'any',    label: 'ANY (OR)' },
            { value: 'single', label: 'Single condition' }
        ];

        return html`
            <div>
                <div class="group-header">
                    <ha-selector
                        .hass=${this.hass}
                        .label=${'Operator'}
                        .selector=${{ select: { mode: 'dropdown', options: operatorOptions } }}
                        .value=${this._operator}
                        @value-changed=${this._handleOperatorChange}>
                    </ha-selector>
                </div>

                <div class="conditions-list">
                    ${this._conditions.map((cond, idx) => this._renderConditionRow(cond, idx))}
                </div>

                ${(this._operator !== 'single' || this._conditions.length === 0) ? html`
                    <button class="add-btn" @click=${this._handleAddCondition}>
                        <ha-icon icon="mdi:plus"></ha-icon>
                        Add Condition
                    </button>
                ` : ''}
            </div>
        `;
    }

    _renderConditionRow(cond, index) {
        const type = this._getConditionType(cond);

        return html`
            <div class="condition-row">
                <div class="type-select">
                    <ha-selector
                        .hass=${this.hass}
                        .label=${'Type'}
                        .selector=${{ select: { mode: 'dropdown', options: ALL_TYPE_OPTIONS } }}
                        .value=${type}
                        @value-changed=${(e) => this._handleConditionTypeChange(index, e.detail.value)}>
                    </ha-selector>
                </div>
                <div class="condition-fields">
                    ${this._renderConditionFields(cond, type, index)}
                </div>
                <button class="delete-btn" @click=${() => this._handleDeleteCondition(index)} title="Remove condition">
                    <ha-icon icon="mdi:delete"></ha-icon>
                </button>
            </div>
        `;
    }

    _renderConditionFields(cond, type, index) {
        const set = (field, val) => this._handleConditionFieldChange(index, field, val);

        switch (type) {
            case 'entity':
                return this._renderEntityFields(cond, index, false);
            case 'entity_attr':
                return this._renderEntityFields(cond, index, true);
            case 'jinja2':
                return html`
                    <ha-selector
                        .hass=${this.hass}
                        .label=${'Jinja2 Template'}
                        .helper=${"Must evaluate to true/false, e.g. {{ states('sensor.temp') | float > 20 }}"}
                        .selector=${{ template: {} }}
                        .value=${cond.template || ''}
                        @value-changed=${(e) => { set('template', e.detail.value); set('_type', 'jinja2'); }}>
                    </ha-selector>
                `;
            case 'javascript':
                return html`
                    <ha-selector
                        .hass=${this.hass}
                        .label=${'JavaScript Template'}
                        .helper=${"Return true/false, e.g. [[[ return states['sensor.temp'].state > 20; ]]]"}
                        .selector=${{ text: { multiline: true } }}
                        .value=${cond.template || ''}
                        @value-changed=${(e) => { set('template', e.detail.value); set('template_type', 'javascript'); set('_type', 'javascript'); }}>
                    </ha-selector>
                `;
            case 'time_between':
                return html`
                    <div class="inline-grid">
                        <ha-selector
                            .hass=${this.hass}
                            .label=${'Start time (HH:MM)'}
                            .selector=${{ text: {} }}
                            .value=${cond.after || ''}
                            @value-changed=${(e) => set('after', e.detail.value)}>
                        </ha-selector>
                        <ha-selector
                            .hass=${this.hass}
                            .label=${'End time (HH:MM)'}
                            .selector=${{ text: {} }}
                            .value=${cond.before || ''}
                            @value-changed=${(e) => set('before', e.detail.value)}>
                        </ha-selector>
                    </div>
                `;
            case 'weekday_in':
                return html`
                    <ha-selector
                        .hass=${this.hass}
                        .label=${'Weekdays'}
                        .selector=${{ select: {
                            multiple: true,
                            options: WEEKDAYS.map(d => ({ value: d, label: d.charAt(0).toUpperCase() + d.slice(1) }))
                        } }}
                        .value=${cond.weekdays || []}
                        @value-changed=${(e) => set('weekdays', e.detail.value)}>
                    </ha-selector>
                `;
            case 'sun_elevation':
                return html`
                    <div class="inline-grid">
                        <ha-selector
                            .hass=${this.hass}
                            .label=${'Above (degrees)'}
                            .selector=${{ number: { min: -90, max: 90, mode: 'box' } }}
                            .value=${cond.above ?? ''}
                            @value-changed=${(e) => set('above', e.detail.value)}>
                        </ha-selector>
                        <ha-selector
                            .hass=${this.hass}
                            .label=${'Below (degrees)'}
                            .selector=${{ number: { min: -90, max: 90, mode: 'box' } }}
                            .value=${cond.below ?? ''}
                            @value-changed=${(e) => set('below', e.detail.value)}>
                        </ha-selector>
                    </div>
                `;
            case 'perf_metric':
                return html`
                    <ha-selector
                        .hass=${this.hass}
                        .label=${'Metric Key'}
                        .selector=${{ text: {} }}
                        .value=${cond.metric || ''}
                        @value-changed=${(e) => set('metric', e.detail.value)}>
                    </ha-selector>
                    <div class="inline-grid">
                        <ha-selector
                            .hass=${this.hass}
                            .label=${'Above'}
                            .selector=${{ number: { mode: 'box' } }}
                            .value=${cond.above ?? ''}
                            @value-changed=${(e) => set('above', e.detail.value)}>
                        </ha-selector>
                        <ha-selector
                            .hass=${this.hass}
                            .label=${'Below'}
                            .selector=${{ number: { mode: 'box' } }}
                            .value=${cond.below ?? ''}
                            @value-changed=${(e) => set('below', e.detail.value)}>
                        </ha-selector>
                    </div>
                `;
            case 'flag':
                return html`
                    <ha-selector
                        .hass=${this.hass}
                        .label=${'Flag Name'}
                        .selector=${{ text: {} }}
                        .value=${cond.flag || ''}
                        @value-changed=${(e) => set('flag', e.detail.value)}>
                    </ha-selector>
                    <ha-selector
                        .hass=${this.hass}
                        .label=${'Is Enabled'}
                        .selector=${{ boolean: {} }}
                        .value=${cond.is !== undefined ? cond.is : true}
                        @value-changed=${(e) => set('is', e.detail.value)}>
                    </ha-selector>
                `;
            case 'random_chance':
                return html`
                    <ha-selector
                        .hass=${this.hass}
                        .label=${'Probability (0–1)'}
                        .helper=${'e.g. 0.3 = 30% chance'}
                        .selector=${{ number: { min: 0, max: 1, step: 0.01, mode: 'box' } }}
                        .value=${cond.probability ?? 0.5}
                        @value-changed=${(e) => set('probability', e.detail.value)}>
                    </ha-selector>
                `;
            case 'map_range_cond':
                return html`
                    <ha-entity-picker
                        .hass=${this.hass}
                        .value=${cond.entity || ''}
                        label="Entity"
                        allow-custom-entity
                        @value-changed=${(e) => set('entity', e.detail.value)}>
                    </ha-entity-picker>
                    <div class="inline-grid">
                        <ha-selector
                            .hass=${this.hass}
                            .label=${'Input Min'}
                            .selector=${{ number: { mode: 'box' } }}
                            .value=${cond.input_min ?? 0}
                            @value-changed=${(e) => set('input_min', e.detail.value)}>
                        </ha-selector>
                        <ha-selector
                            .hass=${this.hass}
                            .label=${'Input Max'}
                            .selector=${{ number: { mode: 'box' } }}
                            .value=${cond.input_max ?? 100}
                            @value-changed=${(e) => set('input_max', e.detail.value)}>
                        </ha-selector>
                        <ha-selector
                            .hass=${this.hass}
                            .label=${'Output Min'}
                            .selector=${{ number: { mode: 'box' } }}
                            .value=${cond.output_min ?? 0}
                            @value-changed=${(e) => set('output_min', e.detail.value)}>
                        </ha-selector>
                        <ha-selector
                            .hass=${this.hass}
                            .label=${'Output Max'}
                            .selector=${{ number: { mode: 'box' } }}
                            .value=${cond.output_max ?? 100}
                            @value-changed=${(e) => set('output_max', e.detail.value)}>
                        </ha-selector>
                    </div>
                    <ha-selector
                        .hass=${this.hass}
                        .label=${'Comparison Operator'}
                        .selector=${{ select: { mode: 'dropdown', options: ENTITY_OPERATORS } }}
                        .value=${cond.operator || 'equals'}
                        @value-changed=${(e) => set('operator', e.detail.value)}>
                    </ha-selector>
                `;
            case 'all':
            case 'any': {
                const nestedVal = type === 'all'
                    ? (cond.all ? { all: cond.all } : null)
                    : (cond.any ? { any: cond.any } : null);
                return html`
                    <div class="nested-group">
                        <lcards-condition-group-editor
                            .hass=${this.hass}
                            .value=${nestedVal}
                            @value-changed=${(e) => this._handleNestedGroupChange(index, e)}>
                        </lcards-condition-group-editor>
                    </div>
                `;
            }
            case 'not': {
                const notVal = cond.not || null;
                return html`
                    <div class="nested-group">
                        <lcards-condition-group-editor
                            .hass=${this.hass}
                            .value=${notVal}
                            @value-changed=${(e) => this._handleConditionFieldChange(index, 'not', e.detail.value)}>
                        </lcards-condition-group-editor>
                    </div>
                `;
            }
            default:
                return html`<div>Unknown condition type: ${type}</div>`;
        }
    }

    _renderEntityFields(cond, index, showAttr) {
        const set = (field, val) => this._handleConditionFieldChange(index, field, val);
        return html`
            <ha-entity-picker
                .hass=${this.hass}
                .value=${cond.entity || ''}
                label="Entity"
                allow-custom-entity
                @value-changed=${(e) => set('entity', e.detail.value)}>
            </ha-entity-picker>
            ${showAttr ? html`
                <ha-selector
                    .hass=${this.hass}
                    .label=${'Attribute'}
                    .selector=${{ text: {} }}
                    .value=${cond.attribute || ''}
                    @value-changed=${(e) => set('attribute', e.detail.value)}>
                </ha-selector>
            ` : ''}
            <ha-selector
                .hass=${this.hass}
                .label=${'Operator'}
                .selector=${{ select: { mode: 'dropdown', options: ENTITY_OPERATORS } }}
                .value=${cond.operator || 'equals'}
                @value-changed=${(e) => set('operator', e.detail.value)}>
            </ha-selector>
            <ha-selector
                .hass=${this.hass}
                .label=${'Value'}
                .selector=${{ text: {} }}
                .value=${cond.value !== undefined ? String(cond.value) : (cond.state !== undefined ? String(cond.state) : '')}
                @value-changed=${(e) => set('value', e.detail.value)}>
            </ha-selector>
        `;
    }
}

customElements.define('lcards-condition-group-editor', LCARdSConditionGroupEditor);
