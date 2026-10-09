/**
 * @fileoverview LCARdS Data Grid Configuration Studio
 *
 * Full-screen editor with a live preview. Two modes:
 * - Decorative: generated values (format, refresh, per-column format)
 * - Data: a spreadsheet of cells (text, entity, template), header rows,
 *   row/column/cell style overrides, conditional colours and cell actions
 *
 * The working copy is migrated (migrateDataGridConfig) and normalised on open:
 * every row is `{ values: [cellObject], style, header }`, so shared editors
 * (colour section v2, padding editor) address any cell by path, e.g.
 * `rows.2.values.1.style.color`. Save compacts it back (plain rows and string
 * cells where nothing else is set) so the user's YAML stays short.
 *
 * @element lcards-data-grid-studio-dialog-v4
 * @fires config-changed - On save (detail: { config }); not bubbling
 * @fires closed - When the dialog closes; not bubbling
 */

import { LitElement, html, css } from 'lit';
import { createRef, ref } from 'lit/directives/ref.js';
import { lcardsLog } from '../../utils/lcards-logging.js';
import { editorStyles } from '../base/editor-styles.js';
import { studioDialogStyles } from './studio-dialog-styles.js';
import { migrateDataGridConfig } from '../../data-grid/data-grid-config-migration.js';
import {
    ENTITY_ID, normalizeRows, dataColumnCount, countTracks, expandTracks, joinTracks, toPx
} from '../../data-grid/data-grid-model.js';
import '../components/shared/lcards-form-section.js';
import '../components/shared/lcards-message.js';
import '../components/shared/lcards-style-hierarchy-diagram.js';
import '../components/editors/lcards-color-section-v2.js';
import '../components/editors/lcards-padding-editor.js';
import '../components/editors/lcards-grid-layout.js';
import '../components/editors/lcards-font-selector.js';
import '../components/lcards-animation-editor.js';
import '../components/lcards-filter-editor.js';
import { copyTextToClipboard } from '../../utils/clipboard-utils.js';

const COLOR_STATES = ['default', 'active', 'inactive', 'unavailable', 'zero', 'non_zero'];
const FORMAT_OPTIONS = [
    { value: 'digit', label: 'Digit (0042, 1337)' },
    { value: 'float', label: 'Float (42.17, 3.14)' },
    { value: 'alpha', label: 'Alpha (AB, XY)' },
    { value: 'hex', label: 'Hex (A3F1, 00FF)' },
    { value: 'mixed', label: 'Mixed (various)' }
];
const TEXT_TRANSFORM = [
    { value: 'none', label: 'None' },
    { value: 'uppercase', label: 'UPPERCASE' },
    { value: 'lowercase', label: 'lowercase' },
    { value: 'capitalize', label: 'Capitalize' }
];
const WHITE_SPACE = [
    { value: 'nowrap', label: 'No wrap (truncate with ellipsis)' },
    { value: 'normal', label: 'Wrap (word boundaries)' },
    { value: 'pre-wrap', label: 'Wrap (preserve line breaks)' },
    { value: 'pre-line', label: 'Wrap (collapse spaces, preserve line breaks)' }
];
const V_ALIGN = [
    { value: 'flex-start', label: 'Top' },
    { value: 'center', label: 'Center' },
    { value: 'flex-end', label: 'Bottom' },
    { value: 'baseline', label: 'Baseline' }
];
const H_ALIGN = [
    { value: 'left', label: 'Left' },
    { value: 'center', label: 'Center' },
    { value: 'right', label: 'Right' }
];
const ITEM_ALIGN = ['stretch', 'start', 'end', 'center'].map(v => ({ value: v, label: v[0].toUpperCase() + v.slice(1) }));
const CONTENT_ALIGN = ['start', 'end', 'center', 'stretch', 'space-around', 'space-between', 'space-evenly']
    .map(v => ({ value: v, label: v.replace('-', ' ').replace(/^\w/, c => c.toUpperCase()) }));
const TEMPLATE_EXAMPLES = [
    { category: 'Basic', items: [
        { label: 'Entity state', template: "{{ states('sensor.temperature') }}" },
        { label: 'Entity attribute', template: "{{ state_attr('light.kitchen', 'brightness') }}" },
        { label: 'DataSource value', template: '{datasource:my_source:.1f}' }
    ] },
    { category: 'Formatted numbers', items: [
        { label: 'Temperature', template: "{{ states('sensor.temp') | float | round(1) }}°C" },
        { label: 'Percentage', template: "{{ states('sensor.battery') | int }}%" },
        { label: 'Watts to kW', template: "{{ (states('sensor.power') | float / 1000) | round(2) }} kW" }
    ] },
    { category: 'Conditionals', items: [
        { label: 'On/Off', template: "{{ 'ON' if is_state('light.kitchen', 'on') else 'OFF' }}" },
        { label: 'Threshold', template: "{{ 'HOT' if states('sensor.temp') | float > 25 else 'OK' }}" }
    ] },
    { category: 'Time', items: [
        { label: 'Last changed', template: '{{ relative_time(states.sensor.temperature.last_changed) }}' },
        { label: 'Current time', template: "{{ now().strftime('%H:%M') }}" }
    ] }
];

const isObject = (v) => !!v && typeof v === 'object' && !Array.isArray(v);
const clone = (v) => JSON.parse(JSON.stringify(v ?? {}));
const isEmptyValue = (v) => v === undefined || v === null || v === '' || (isObject(v) && Object.keys(v).length === 0);

/** Cell as an object (`{ value }` for plain cells). */
const toCellObject = (cell) => (isObject(cell) ? cell : { value: cell ?? '' });

/** Text shown for a cell in the spreadsheet. */
function cellLabel(cell) {
    const c = toCellObject(cell);
    if (c.value !== undefined && c.value !== '') return String(c.value);
    if (c.entity) return c.attribute ? `${c.entity} · ${c.attribute}` : c.entity;
    return '';
}

/** Drop empty keys; `{ default: x }` colours collapse to `x`. Returns undefined when empty. */
function pruneStyle(style) {
    if (!isObject(style)) return undefined;
    const out = {};
    for (const [k, v] of Object.entries(style)) {
        if (isEmptyValue(v)) continue;
        if (isObject(v) && (k === 'color' || k === 'background')) {
            const states = Object.fromEntries(Object.entries(v).filter(([, c]) => !isEmptyValue(c)));
            const keys = Object.keys(states);
            if (!keys.length) continue;
            out[k] = keys.length === 1 && keys[0] === 'default' ? states.default : states;
        } else {
            out[k] = v;
        }
    }
    return Object.keys(out).length ? out : undefined;
}

/**
 * Compact the normalised working copy for saving.
 * @param {Object} working
 * @returns {Object}
 */
export function compactDataGridConfig(working) {
    const out = clone(working);
    const data = out.data_mode === 'data';

    for (const key of ['style', 'header_style']) {
        const s = pruneStyle(out[key]);
        if (s) out[key] = s; else delete out[key];
    }

    if (data) {
        delete out.format;
        delete out.refresh_interval;
        delete out.refresh_cells;
        out.rows = (out.rows || []).map(row => {
            const values = (row.values || []).map(cell => {
                const c = { ...toCellObject(cell) };
                const style = pruneStyle(c.style);
                if (style) c.style = style; else delete c.style;
                for (const k of Object.keys(c)) if (isEmptyValue(c[k]) && k !== 'value') delete c[k];
                if (c.value === '' && c.entity) delete c.value;
                const keys = Object.keys(c);
                return keys.length === 1 && keys[0] === 'value' ? c.value : (keys.length ? c : '');
            });
            const style = pruneStyle(row.style);
            if (!style && !row.header) return values;
            return { values, ...(style ? { style } : {}), ...(row.header ? { header: true } : {}) };
        });
        if (!out.cell_tap_action || isEmptyValue(out.cell_tap_action)) delete out.cell_tap_action;
    } else {
        delete out.rows;
        delete out.cell_tap_action;
        if (out.refresh_cells === 1) delete out.refresh_cells;
    }

    if (Array.isArray(out.columns)) {
        out.columns = out.columns.map(col => {
            const c = {};
            const style = pruneStyle(col?.style);
            if (style) c.style = style;
            if (!data && col?.format) c.format = col.format;
            return c;
        });
        while (out.columns.length && !Object.keys(out.columns[out.columns.length - 1]).length) out.columns.pop();
        if (!out.columns.length) delete out.columns;
    }

    if (isObject(out.highlight_changes)) {
        const h = Object.fromEntries(Object.entries(out.highlight_changes).filter(([, v]) => !isEmptyValue(v)));
        out.highlight_changes = Object.keys(h).length ? h : true;
    } else if (!out.highlight_changes) {
        delete out.highlight_changes;
    }
    if (Array.isArray(out.animations) && !out.animations.length) delete out.animations;
    if (Array.isArray(out.filters) && !out.filters.length) delete out.filters;
    return out;
}

export class LCARdSDataGridStudioDialogV4 extends LitElement {
    static get properties() {
        return {
            hass: { type: Object },
            _workingConfig: { type: Object, state: true },
            _activeTab: { type: String, state: true },
            _stylesSubTab: { type: String, state: true },
            _activeCellEdit: { type: Object, state: true }, // { row, col, cell }
            _activeRowEdit: { type: Number, state: true },
            _activeColumnEdit: { type: Number, state: true },
            _showGridLines: { type: Boolean, state: true },
            _showAnimations: { type: Boolean, state: true }
        };
    }

    constructor() {
        super();
        this.hass = null;
        this._initialConfig = null;
        this._workingConfig = {};
        this._activeTab = 'mode';
        this._stylesSubTab = 'hierarchy';
        this._activeCellEdit = null;
        this._activeRowEdit = null;
        this._activeColumnEdit = null;
        this._showGridLines = true;
        this._showAnimations = false;
        this._previewRef = createRef();
        this._previewTimer = null;
        this._previewCard = null;
    }

    /** Working config (shared editors read `editor.config`). */
    get config() {
        return this._workingConfig;
    }

    set config(value) {
        this._initialConfig = value;
    }

    connectedCallback() {
        super.connectedCallback();
        this._workingConfig = this._normalize(migrateDataGridConfig(clone(this._initialConfig)).config);
        this.updateComplete.then(() => this._updatePreviewCard());
    }

    disconnectedCallback() {
        super.disconnectedCallback();
        clearTimeout(this._previewTimer);
    }

    /** @param {Map<string, unknown>} changed */
    updated(changed) {
        super.updated(changed);
        if (changed.has('hass') && this._previewCard) this._previewCard.hass = this.hass;
    }

    /**
     * Normalised working copy: explicit data_mode, rows as `{ values: [cellObject], style, header }`.
     * @param {Object} config
     * @returns {Object}
     * @private
     */
    _normalize(config) {
        const cfg = clone(config);
        cfg.type = cfg.type || 'custom:lcards-data-grid';
        cfg.data_mode = cfg.data_mode || (Array.isArray(cfg.rows) && cfg.rows.length ? 'data' : 'decorative');
        cfg.grid = isObject(cfg.grid) ? cfg.grid : {};
        if (Array.isArray(cfg.rows)) {
            cfg.rows = normalizeRows(cfg.rows).map(r => ({
                values: r.values.map(c => clone(toCellObject(c))),
                ...(r.style ? { style: r.style } : {}),
                ...(r.header ? { header: true } : {})
            }));
        }
        if (cfg.data_mode === 'data' && !cfg.rows?.length) cfg.rows = this._sampleRows();
        return cfg;
    }

    /** @private */
    _sampleRows() {
        return [
            { values: [{ value: 'SYSTEM' }, { value: 'VALUE' }], header: true },
            { values: [{ value: 'CPU' }, { value: 'sensor.cpu_usage' }] },
            { values: [{ value: 'Memory' }, { value: 'sensor.memory_usage' }] }
        ];
    }

    get _isData() {
        return this._workingConfig.data_mode === 'data';
    }

    // ========================================================================
    // CONFIG ACCESS (shared editor interface: _getConfigValue / _setConfigValue)
    // ========================================================================

    /**
     * @param {string} path - dot path, numeric segments index arrays
     * @returns {*}
     */
    _getConfigValue(path) {
        let obj = this._workingConfig;
        for (const part of path.split('.')) {
            if (obj === undefined || obj === null) return undefined;
            obj = obj[part];
        }
        return obj;
    }

    /**
     * Set a value by path. Missing parents are created as arrays when the next
     * segment is numeric; empty values delete the key.
     * @param {string} path
     * @param {*} value
     */
    _setConfigValue(path, value) {
        const parts = path.split('.');
        let obj = this._workingConfig;
        for (let i = 0; i < parts.length - 1; i++) {
            const key = parts[i];
            if (!isObject(obj[key]) && !Array.isArray(obj[key])) {
                obj[key] = /^\d+$/.test(parts[i + 1]) ? [] : {};
            }
            obj = obj[key];
        }
        const last = parts[parts.length - 1];
        if (isEmptyValue(value)) {
            if (Array.isArray(obj)) obj[Number(last)] = undefined; else delete obj[last];
        } else {
            obj[last] = value;
        }
        this._changed();
    }

    /** Re-render and refresh the preview. @private */
    _changed() {
        this._workingConfig = { ...this._workingConfig };
        clearTimeout(this._previewTimer);
        this._previewTimer = setTimeout(() => this._updatePreviewCard(), 300);
    }

    // ========================================================================
    // TRACKS (rows / columns)
    // ========================================================================

    /** @param {'row'|'col'} axis @returns {number} */
    _trackCount(axis) {
        const cfg = this._workingConfig;
        if (this._isData) {
            return axis === 'row' ? cfg.rows.length : Math.max(1, dataColumnCount(cfg.rows));
        }
        return countTracks(cfg.grid[this._templateKey(axis)]) || (axis === 'row' ? 8 : 12);
    }

    /** @private */
    _templateKey(axis) {
        return axis === 'row' ? 'grid-template-rows' : 'grid-template-columns';
    }

    /**
     * Apply an edit to the axis template's track list. Templates that are not a
     * fixed track list (auto-fill) are left alone; a missing template is only
     * created in decorative mode, where it defines the grid size.
     * @param {'row'|'col'} axis
     * @param {(tracks: string[], fallback: string) => void} edit
     * @private
     */
    _editTemplate(axis, edit) {
        const key = this._templateKey(axis);
        const fallback = axis === 'row' ? 'auto' : '1fr';
        const current = this._workingConfig.grid[key];
        let tracks;
        if (current) {
            tracks = expandTracks(current);
            if (!tracks) return;
        } else {
            if (this._isData) return;
            tracks = Array(this._trackCount(axis)).fill(fallback);
        }
        edit(tracks, fallback);
        this._workingConfig.grid[key] = joinTracks(tracks.length ? tracks : [fallback]);
    }

    /** New empty row matching the current column count. @private */
    _emptyRow() {
        return { values: Array.from({ length: this._trackCount('col') }, () => ({ value: '' })) };
    }

    /**
     * Resize an axis to n tracks (data rows/cells and the template follow).
     * @param {'row'|'col'} axis
     * @param {number} n
     */
    _setTrackCount(axis, n) {
        n = Math.max(1, Math.min(50, Math.floor(Number(n)) || 1));
        const cfg = this._workingConfig;
        if (this._isData) {
            if (axis === 'row') {
                while (cfg.rows.length < n) cfg.rows.push(this._emptyRow());
                cfg.rows.length = n;
            } else {
                for (const row of cfg.rows) {
                    while (row.values.length < n) row.values.push({ value: '' });
                    row.values.length = n;
                }
                if (Array.isArray(cfg.columns)) cfg.columns.length = Math.min(cfg.columns.length, n);
            }
        }
        this._editTemplate(axis, (tracks, fallback) => {
            while (tracks.length < n) tracks.push(tracks[tracks.length - 1] || fallback);
            tracks.length = n;
        });
        this._closeEditors();
        this._changed();
    }

    /**
     * Insert an empty track at index i.
     * @param {'row'|'col'} axis
     * @param {number} i
     */
    _insertTrack(axis, i) {
        const cfg = this._workingConfig;
        if (axis === 'row') {
            cfg.rows.splice(i, 0, this._emptyRow());
        } else {
            for (const row of cfg.rows) row.values.splice(i, 0, { value: '' });
            if (Array.isArray(cfg.columns) && cfg.columns.length > i) cfg.columns.splice(i, 0, {});
        }
        this._editTemplate(axis, (tracks, fallback) => tracks.splice(i, 0, tracks[i] || fallback));
        this._closeEditors();
        this._changed();
    }

    /**
     * Remove track i (at least one track always remains).
     * @param {'row'|'col'} axis
     * @param {number} i
     */
    _removeTrack(axis, i) {
        if (this._trackCount(axis) <= 1) return;
        const cfg = this._workingConfig;
        if (axis === 'row') {
            cfg.rows.splice(i, 1);
        } else {
            for (const row of cfg.rows) row.values.splice(i, 1);
            if (Array.isArray(cfg.columns)) cfg.columns.splice(i, 1);
        }
        this._editTemplate(axis, (tracks) => tracks.splice(i, 1));
        this._closeEditors();
        this._changed();
    }

    /**
     * Swap track i with its neighbour (dir -1 / +1); the editor follows it.
     * @param {'row'|'col'} axis
     * @param {number} i
     * @param {number} dir
     */
    _moveTrack(axis, i, dir) {
        const j = i + dir;
        if (j < 0 || j >= this._trackCount(axis)) return;
        const swap = (arr) => {
            if (!Array.isArray(arr)) return;
            const len = Math.max(arr.length, i + 1, j + 1);
            for (let k = arr.length; k < len; k++) arr[k] = axis === 'col' && arr === this._workingConfig.columns ? {} : { value: '' };
            [arr[i], arr[j]] = [arr[j], arr[i]];
        };
        const cfg = this._workingConfig;
        if (axis === 'row') {
            swap(cfg.rows);
            this._activeRowEdit = j;
        } else {
            cfg.rows.forEach(row => swap(row.values));
            swap(cfg.columns);
            this._activeColumnEdit = j;
        }
        this._editTemplate(axis, (tracks) => { [tracks[i], tracks[j]] = [tracks[j], tracks[i]]; });
        this._changed();
    }

    /** @private */
    _closeEditors() {
        this._activeCellEdit = null;
        this._activeRowEdit = null;
        this._activeColumnEdit = null;
    }

    // ========================================================================
    // RENDER
    // ========================================================================

    static get styles() {
        return [
            editorStyles,
            studioDialogStyles,
            css`
            :host {
                display: block;
            }

            .dialog-content {
                display: flex;
                flex-direction: column;
                min-height: 70vh;
                max-height: 80vh;
            }

            .tab-content {
                flex: 1;
                overflow-y: auto;
                overflow-x: hidden;
                padding: var(--ha-space-4);
                min-height: 0;
            }

            ha-tab-group {
                flex-shrink: 0;
            }

            ha-tab-group-tab {
                flex-shrink: 0;
                min-width: 120px;
                white-space: nowrap;
            }

            .canvas-toolbar-button:not(.active) {
                opacity: 0.5;
            }

            .preview-container {
                flex: 1;
                padding: var(--ha-space-6);
                background: var(--primary-background-color);
            }

            .preview-container lcards-data-grid {
                display: block;
                width: 100%;
                min-height: 300px;
            }

            lcards-form-section {
                display: block;
                margin-bottom: var(--ha-space-5);
            }

            lcards-form-section:last-child {
                margin-bottom: 0;
            }

            /* Mode selector cards */
            .mode-selector {
                display: grid;
                grid-template-columns: repeat(2, 1fr);
                gap: var(--ha-space-3);
                margin-bottom: var(--ha-space-6);
            }

            .mode-card {
                padding: var(--ha-space-5);
                border: var(--ha-border-width-md) solid var(--divider-color);
                border-radius: var(--ha-border-radius-md);
                cursor: pointer;
                transition: border-color var(--ha-animation-duration-normal, 0.2s) ease;
                text-align: center;
                background: var(--card-background-color);
            }

            .mode-card:hover {
                border-color: var(--secondary-text-color);
            }

            .mode-card.active {
                border-color: var(--primary-color);
                background: color-mix(in srgb, var(--primary-color) 10%, var(--card-background-color));
            }

            .mode-icon {
                --mdc-icon-size: 48px;
                margin-bottom: var(--ha-space-3);
                color: var(--secondary-text-color);
            }

            .mode-card.active .mode-icon {
                color: var(--primary-color);
            }

            .mode-title {
                font-size: 16px;
                font-weight: 600;
                margin-bottom: 6px;
                color: var(--primary-text-color);
            }

            .mode-description {
                font-size: 12px;
                color: var(--secondary-text-color);
                line-height: 1.4;
            }

            /* Spreadsheet */
            .sheet {
                display: grid;
                gap: 2px;
                margin-top: var(--ha-space-4);
                background: var(--divider-color);
                padding: 2px;
                border-radius: var(--ha-border-radius-sm);
            }

            .sheet-corner,
            .sheet-cell {
                background: var(--card-background-color);
                padding: var(--ha-space-2);
            }

            .sheet-header {
                background: var(--primary-color);
                color: var(--text-primary-color);
                padding: var(--ha-space-2);
                text-align: center;
                font-weight: 600;
                font-size: 11px;
                cursor: pointer;
            }

            .sheet-header.selected {
                outline: var(--ha-border-width-md) solid var(--primary-text-color);
                outline-offset: -2px;
            }

            .sheet-cell {
                min-height: 36px;
                cursor: pointer;
                border: var(--ha-border-width-sm) solid transparent;
                overflow: hidden;
                text-overflow: ellipsis;
                white-space: nowrap;
                font-size: 13px;
            }

            .sheet-cell:hover,
            .sheet-cell.selected {
                border-color: var(--primary-color);
            }

            .sheet-cell.header-row {
                font-weight: 700;
                text-transform: uppercase;
            }

            .sheet-cell .styled {
                color: var(--primary-color);
                margin-left: var(--ha-space-1);
            }

            .sheet-empty {
                opacity: 0.3;
            }

            .button-row {
                display: flex;
                flex-wrap: wrap;
                gap: var(--ha-space-2);
                margin-top: var(--ha-space-3);
            }

            .op-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
                gap: var(--ha-space-2);
            }

            .cell-type-toggle {
                display: flex;
                gap: var(--ha-space-2);
                margin-bottom: var(--ha-space-4);
            }

            .cell-type-toggle ha-button {
                flex: 1;
            }

            .field-label {
                display: block;
                font-size: 14px;
                font-weight: 600;
                margin: var(--ha-space-3) 0 var(--ha-space-2);
                color: var(--primary-text-color);
            }

            .hint {
                font-size: 12px;
                color: var(--secondary-text-color);
                margin-top: var(--ha-space-1);
            }

            details.overrides {
                margin-top: var(--ha-space-4);
            }

            details.overrides > summary {
                cursor: pointer;
                font-weight: 600;
                padding: var(--ha-space-2) 0;
                user-select: none;
            }

            .overrides-body {
                margin-top: var(--ha-space-3);
                padding-left: var(--ha-space-3);
                border-left: var(--ha-border-width-lg) solid var(--primary-color);
            }

            .example {
                display: grid;
                grid-template-columns: 1fr auto auto;
                gap: var(--ha-space-2);
                align-items: center;
                padding: var(--ha-space-2);
                border: var(--ha-border-width-sm) solid var(--divider-color);
                border-radius: var(--ha-border-radius-sm);
                margin-bottom: var(--ha-space-2);
            }

            .example code {
                font-size: 11px;
                color: var(--secondary-text-color);
                word-break: break-all;
            }

            @media (max-width: 768px) {
                .mode-selector {
                    grid-template-columns: 1fr;
                }
            }
        `];
    }

    render() {
        const tabs = [
            { id: 'mode', label: 'Data Mode', icon: 'mdi:view-grid' },
            { id: 'grid-structure', label: 'Grid Structure', icon: 'mdi:table-settings' },
            { id: 'grid-styles', label: 'Grid Styles', icon: 'mdi:palette' },
            { id: 'effects', label: 'Effects', icon: 'mdi:auto-fix' },
            { id: 'advanced', label: 'Advanced', icon: 'mdi:cog' }
        ];
        return html`
            <ha-dialog open @closed=${this._onDialogClosed} header-title="Data Grid Studio">
                <div class="dialog-content">
                    <div class="studio-layout">
                        <div class="config-panel">
                            <ha-tab-group @wa-tab-show=${(e) => this._onTab(e, '_activeTab')}>
                                ${tabs.map(t => html`
                                    <ha-tab-group-tab value=${t.id} ?active=${this._activeTab === t.id}>
                                        <ha-icon icon=${t.icon}></ha-icon>
                                        ${t.label}
                                    </ha-tab-group-tab>
                                `)}
                            </ha-tab-group>
                            <div class="tab-content">${this._renderActiveTab()}</div>
                        </div>

                        <div class="preview-panel">
                            <div class="canvas-toolbar">
                                <div class="canvas-toolbar-buttons">
                                    <button
                                        class="canvas-toolbar-button ${this._showGridLines ? 'active' : ''}"
                                        @click=${() => this._togglePreview('_showGridLines')}
                                        title="Toggle grid lines">
                                        <ha-icon icon="mdi:grid"></ha-icon>
                                    </button>
                                    <button
                                        class="canvas-toolbar-button ${this._showAnimations ? 'active' : ''}"
                                        @click=${() => this._togglePreview('_showAnimations')}
                                        title="Toggle animations">
                                        <ha-icon icon="mdi:animation-play"></ha-icon>
                                    </button>
                                </div>
                            </div>
                            <div class="preview-container">
                                <div ${ref(this._previewRef)}></div>
                            </div>
                        </div>
                    </div>
                </div>

                <div slot="footer">
                    <ha-button appearance="plain" @click=${this._close}>Cancel</ha-button>
                    <ha-button variant="brand" @click=${this._handleSave}>
                        <ha-icon icon="mdi:check" slot="start"></ha-icon>
                        Save
                    </ha-button>
                </div>
            </ha-dialog>
        `;
    }

    /**
     * Only the dialog's own `closed` cancels; closes bubbling from pickers and
     * selects inside it must not close the studio (or reach the card editor).
     * @param {Event} e
     * @private
     */
    _onDialogClosed(e) {
        e.stopPropagation();
        if (e.target === e.currentTarget) this._close();
    }

    /** @private */
    _onTab(e, prop) {
        const value = e.target.activeTab?.getAttribute('value');
        if (value) this[prop] = value;
    }

    /** @private */
    _renderActiveTab() {
        switch (this._activeTab) {
            case 'grid-structure': return this._renderGridStructureTab();
            case 'grid-styles': return this._renderGridStylesTab();
            case 'effects': return this._renderEffectsTab();
            case 'advanced': return this._renderAdvancedTab();
            default: return this._renderModeTab();
        }
    }

    // ── Small field helpers ──────────────────────────────────────────────────

    /** Dropdown bound to a config path ('' option = inherit/unset). @private */
    _select(path, label, options, { fallback = '', inherit = false } = {}) {
        const opts = inherit ? [{ value: '', label: '(Inherit)' }, ...options] : options;
        return html`
            <ha-selector
                .hass=${this.hass}
                .selector=${{ select: { mode: 'dropdown', options: opts } }}
                .label=${label}
                .value=${this._getConfigValue(path) ?? fallback}
                @value-changed=${(e) => this._setConfigValue(path, e.detail.value)}
                @closed=${(e) => e.stopPropagation()}>
            </ha-selector>
        `;
    }

    /** Text input bound to a config path. @private */
    _text(path, label, hint = '', placeholder = '') {
        return html`
            <ha-input
                label=${label}
                .value=${String(this._getConfigValue(path) ?? '')}
                placeholder=${placeholder}
                hint=${hint}
                @input=${(e) => this._setConfigValue(path, e.target.value)}>
            </ha-input>
        `;
    }

    /** Number box bound to a config path. @private */
    _number(path, label, { min = 0, max = 1000, step = 1, unit = undefined, fallback = undefined } = {}) {
        return html`
            <ha-selector
                .hass=${this.hass}
                .selector=${{ number: { mode: 'box', min, max, step, unit_of_measurement: unit } }}
                .label=${label}
                .value=${this._getConfigValue(path) ?? fallback}
                @value-changed=${(e) => this._setConfigValue(path, e.detail.value)}>
            </ha-selector>
        `;
    }

    /** Colour section v2 (plain colour or state map) for a style key. @private */
    _colors(basePath, header, entityId = '') {
        return html`
            ${['color', 'background'].map(key => html`
                <lcards-color-section-v2
                    .editor=${this}
                    .entityId=${entityId}
                    basePath=${`${basePath}.${key}`}
                    header=${`${header}: ${key === 'color' ? 'Text' : 'Background'}`}
                    .suggestedStates=${entityId ? COLOR_STATES : ['default']}
                    ?allowCustomStates=${!!entityId}
                    ?expanded=${false}>
                </lcards-color-section-v2>
            `)}
        `;
    }

    /**
     * Style override block for a cell, row, column or header (one renderer for all).
     * @param {string} basePath - path of the style object, e.g. `rows.2.style`
     * @param {string} label - e.g. 'Row'
     * @param {string} [entityId] - entity for state-map colour suggestions
     * @private
     */
    _renderStyleOverrides(basePath, label, entityId = '') {
        const style = this._getConfigValue(basePath);
        const active = isObject(style) && Object.values(style).some(v => !isEmptyValue(v));
        return html`
            <details class="overrides" ?open=${active}>
                <summary>
                    <ha-icon icon="mdi:palette"></ha-icon>
                    ${label} style overrides ${active ? '(active)' : ''}
                </summary>
                <div class="overrides-body">
                    <lcards-message type="info">
                        Empty fields inherit. Order (later wins): grid, header, column, row, cell.
                        ${entityId ? ' Colours can change with the entity state (e.g. above:80).' : ''}
                    </lcards-message>
                    ${this._colors(basePath, label, entityId)}
                    <lcards-grid-layout>
                        ${this._text(`${basePath}.font_size`, 'Font size', 'px number or CSS length', 'Inherit')}
                        ${this._number(`${basePath}.font_weight`, 'Font weight', { min: 100, max: 900, step: 100 })}
                    </lcards-grid-layout>
                    <lcards-grid-layout>
                        ${this._select(`${basePath}.text_transform`, 'Text transform', TEXT_TRANSFORM, { inherit: true })}
                        ${this._text(`${basePath}.letter_spacing`, 'Letter spacing', '', 'Inherit')}
                    </lcards-grid-layout>
                    <lcards-grid-layout>
                        ${this._select(`${basePath}.align`, 'Horizontal align', H_ALIGN, { inherit: true })}
                        ${this._select(`${basePath}.align_items`, 'Vertical align', V_ALIGN, { inherit: true })}
                    </lcards-grid-layout>
                    ${this._select(`${basePath}.white_space`, 'Text wrapping', WHITE_SPACE, { inherit: true })}
                    <ha-button appearance="plain" .disabled=${!active} @click=${() => this._setConfigValue(basePath, undefined)}>
                        <ha-icon icon="mdi:eraser" slot="start"></ha-icon>
                        Clear ${label.toLowerCase()} styles
                    </ha-button>
                </div>
            </details>
        `;
    }

    // ========================================================================
    // MODE TAB
    // ========================================================================

    _renderModeTab() {
        const modes = [
            { id: 'decorative', icon: 'mdi:shimmer', title: 'Decorative', description: 'Generated LCARS-style values' },
            { id: 'data', icon: 'mdi:table-edit', title: 'Data', description: 'Your text, entities and templates' }
        ];
        return html`
            <lcards-form-section header="Data Mode" description="Choose how the grid gets its data" icon="mdi:view-grid" ?expanded=${true}>
                <div class="mode-selector">
                    ${modes.map(mode => html`
                        <div class="mode-card ${this._workingConfig.data_mode === mode.id ? 'active' : ''}"
                            @click=${() => this._setMode(mode.id)}>
                            <ha-icon class="mode-icon" icon=${mode.icon}></ha-icon>
                            <div class="mode-title">${mode.title}</div>
                            <div class="mode-description">${mode.description}</div>
                        </div>
                    `)}
                </div>
                <lcards-message type="info">
                    Switching modes keeps the other mode's settings until you save; only the active mode's keys are saved.
                </lcards-message>
            </lcards-form-section>
        `;
    }

    /** @private */
    _setMode(mode) {
        this._workingConfig.data_mode = mode;
        if (mode === 'data' && !this._workingConfig.rows?.length) this._workingConfig.rows = this._sampleRows();
        this._closeEditors();
        this._changed();
    }

    // ========================================================================
    // GRID STRUCTURE TAB
    // ========================================================================

    _renderGridStructureTab() {
        const grid = this._workingConfig.grid;
        return html`
            <lcards-form-section header="Grid Dimensions" description="Rows, columns and spacing" icon="mdi:ruler" ?expanded=${true}>
                ${this._isData ? html`
                    <lcards-message type="info">
                        Rows and columns follow the data below. Reducing them removes cells.
                    </lcards-message>
                ` : ''}
                <lcards-grid-layout>
                    ${/** @type {Array<'row'|'col'>} */ (['row', 'col']).map(axis => html`
                        <ha-selector
                            .hass=${this.hass}
                            .selector=${{ number: { min: 1, max: 50, mode: 'box' } }}
                            .value=${this._trackCount(axis)}
                            .label=${axis === 'row' ? 'Rows' : 'Columns'}
                            @value-changed=${(e) => this._setTrackCount(axis, e.detail.value)}>
                        </ha-selector>
                    `)}
                </lcards-grid-layout>
                <ha-selector
                    .hass=${this.hass}
                    .selector=${{ number: { min: 0, max: 50, mode: 'box', unit_of_measurement: 'px' } }}
                    .value=${toPx(grid.gap) ?? 8}
                    .label=${'Gap'}
                    @value-changed=${(e) => this._setConfigValue('grid.gap', `${Number(e.detail.value) || 0}px`)}>
                </ha-selector>
            </lcards-form-section>

            ${this._isData ? this._renderDataEditor() : this._renderDecorativeConfig()}
        `;
    }

    _renderDecorativeConfig() {
        const cols = this._trackCount('col');
        return html`
            <lcards-form-section header="Decorative Values" description="Generated LCARS data" icon="mdi:shimmer" ?expanded=${true}>
                ${this._select('format', 'Format', FORMAT_OPTIONS, { fallback: 'mixed' })}
                <lcards-grid-layout>
                    ${this._number('refresh_interval', 'Refresh interval', { min: 0, max: 60000, step: 100, unit: 'ms', fallback: 0 })}
                    ${this._number('refresh_cells', 'Cells changed per refresh', { min: 0.05, max: 1, step: 0.05, fallback: 1 })}
                </lcards-grid-layout>
                <div class="hint">Refresh interval 0 keeps the values fixed. 1 changes every cell; 0.2 changes a fifth of them each time.</div>
            </lcards-form-section>

            <lcards-form-section header="Column Formats" description="Override the format per column" icon="mdi:table-column" ?expanded=${false}>
                <lcards-grid-layout>
                    ${Array.from({ length: cols }, (_, c) => this._select(`columns.${c}.format`, `Column ${c + 1}`, FORMAT_OPTIONS, { inherit: true }))}
                </lcards-grid-layout>
            </lcards-form-section>
        `;
    }

    _renderDataEditor() {
        const rows = this._workingConfig.rows;
        const cols = this._trackCount('col');
        const edit = this._activeCellEdit;
        return html`
            <lcards-form-section header="Data Editor" description="Click a cell to edit it, or a header for row/column options" icon="mdi:table-edit" ?expanded=${true}>
                <lcards-message type="info">
                    A cell can hold static text, an entity (shows its state, e.g. sensor.temperature),
                    a template ({{ states('sensor.temp') }}°C), a DataSource token ({datasource:name:.1f}) or JavaScript ([[[ ... ]]]).
                </lcards-message>

                <div class="sheet" style="grid-template-columns: auto repeat(${cols}, minmax(0, 1fr));">
                    <div class="sheet-corner"></div>
                    ${Array.from({ length: cols }, (_, c) => html`
                        <div class="sheet-header ${this._activeColumnEdit === c ? 'selected' : ''}"
                            @click=${() => this._openEditor('column', c)}>Col ${c + 1}</div>
                    `)}
                    ${rows.map((row, r) => html`
                        <div class="sheet-header ${this._activeRowEdit === r ? 'selected' : ''}"
                            @click=${() => this._openEditor('row', r)}>Row ${r + 1}${row.header ? ' (H)' : ''}</div>
                        ${Array.from({ length: cols }, (_, c) => {
                            const cell = row.values[c];
                            const label = cellLabel(cell);
                            const styled = isObject(cell) && (cell.style || cell.tap_action || cell.hold_action || cell.double_tap_action);
                            return html`
                                <div class="sheet-cell ${row.header ? 'header-row' : ''} ${edit?.row === r && edit?.col === c ? 'selected' : ''}"
                                    title=${label}
                                    @click=${() => this._openCellEditor(r, c)}>
                                    ${label || html`<span class="sheet-empty">-</span>`}${styled ? html`<span class="styled">•</span>` : ''}
                                </div>
                            `;
                        })}
                    `)}
                </div>

                <div class="button-row">
                    <ha-button @click=${() => this._insertTrack('row', rows.length)}>
                        <ha-icon icon="mdi:table-row-plus-after" slot="start"></ha-icon>
                        Add Row
                    </ha-button>
                    <ha-button @click=${() => this._insertTrack('col', cols)}>
                        <ha-icon icon="mdi:table-column-plus-after" slot="start"></ha-icon>
                        Add Column
                    </ha-button>
                </div>

                ${edit ? this._renderCellEditor() : ''}
                ${this._activeRowEdit !== null ? this._renderTrackEditor('row', this._activeRowEdit) : ''}
                ${this._activeColumnEdit !== null ? this._renderTrackEditor('col', this._activeColumnEdit) : ''}
            </lcards-form-section>

            <lcards-form-section header="Cell Actions" description="What tapping a cell does" icon="mdi:gesture-tap" ?expanded=${false}>
                <span class="field-label">Default tap action for entity cells</span>
                <ha-selector
                    .hass=${this.hass}
                    .selector=${{ ui_action: {} }}
                    .value=${this._workingConfig.cell_tap_action}
                    @value-changed=${(e) => this._setConfigValue('cell_tap_action', e.detail.value)}>
                </ha-selector>
                <div class="hint">Leave empty to keep cells inert. Cells with their own tap action (cell editor) use that instead.</div>
            </lcards-form-section>
        `;
    }

    /** @private */
    _openEditor(kind, index) {
        const prop = kind === 'row' ? '_activeRowEdit' : '_activeColumnEdit';
        const was = this[prop];
        this._closeEditors();
        this[prop] = was === index ? null : index;
    }

    /** @private */
    _openCellEditor(row, col) {
        const cell = toCellObject(this._workingConfig.rows[row]?.values[col]);
        const isEntity = (!cell.value && !!cell.entity) || ENTITY_ID.test(String(cell.value ?? ''));
        this._closeEditors();
        this._activeCellEdit = {
            row, col,
            type: isEntity ? 'entity' : 'text',
            value: isEntity ? '' : String(cell.value ?? ''),
            entity: cell.entity || (isEntity ? String(cell.value) : ''),
            attribute: cell.attribute || ''
        };
    }

    /** Path of the cell being edited (creating the cell object if needed). @private */
    _cellPath() {
        const { row, col } = this._activeCellEdit;
        const values = this._workingConfig.rows[row].values;
        if (!isObject(values[col])) values[col] = toCellObject(values[col]);
        return `rows.${row}.values.${col}`;
    }

    /** Write the edited content (value/entity/attribute); style and actions are live. @private */
    _saveCellContent() {
        const e = this._activeCellEdit;
        const path = this._cellPath();
        const cell = this._getConfigValue(path);
        delete cell.value; delete cell.entity; delete cell.attribute;
        if (e.type === 'entity') {
            if (e.attribute) Object.assign(cell, { entity: e.entity, attribute: e.attribute });
            else cell.value = e.entity;
        } else {
            cell.value = e.value;
            if (e.entity) cell.entity = e.entity;
        }
        this._activeCellEdit = null;
        this._changed();
    }

    _renderCellEditor() {
        const e = this._activeCellEdit;
        const path = this._cellPath();
        const setEdit = (patch) => { this._activeCellEdit = { ...this._activeCellEdit, ...patch }; };
        return html`
            <lcards-form-section header="Edit Cell (Row ${e.row + 1}, Col ${e.col + 1})" ?expanded=${true}>
                <div class="cell-type-toggle">
                    <ha-button appearance=${e.type === 'entity' ? 'accent' : 'plain'} @click=${() => setEdit({ type: 'entity' })}>
                        <ha-icon icon="mdi:home-assistant" slot="start"></ha-icon>
                        Entity
                    </ha-button>
                    <ha-button appearance=${e.type === 'text' ? 'accent' : 'plain'} @click=${() => setEdit({ type: 'text' })}>
                        <ha-icon icon="mdi:text" slot="start"></ha-icon>
                        Text or template
                    </ha-button>
                </div>

                ${e.type === 'entity' ? html`
                    <ha-selector
                        .hass=${this.hass}
                        .selector=${{ entity: {} }}
                        .label=${'Entity'}
                        .value=${e.entity}
                        @value-changed=${(ev) => setEdit({ entity: ev.detail.value || '' })}>
                    </ha-selector>
                    ${e.entity ? html`
                        <ha-selector
                            .hass=${this.hass}
                            .selector=${{ attribute: { entity_id: e.entity } }}
                            .label=${'Attribute (optional)'}
                            .value=${e.attribute}
                            @value-changed=${(ev) => setEdit({ attribute: ev.detail.value || '' })}>
                        </ha-selector>
                    ` : ''}
                    <div class="hint">Shows the entity state (or attribute), formatted by Home Assistant.</div>
                ` : html`
                    <span class="field-label">Cell content</span>
                    <ha-code-editor
                        mode="jinja2"
                        .value=${e.value}
                        @value-changed=${(ev) => setEdit({ value: ev.detail.value })}
                        dir="ltr"
                        autofocus>
                    </ha-code-editor>
                    <div class="hint">Static text, an entity id, a template ({{ ... }}), a DataSource token or JavaScript ([[[ ... ]]]).</div>
                    <ha-selector
                        .hass=${this.hass}
                        .selector=${{ entity: {} }}
                        .label=${'Entity for colours and actions (optional)'}
                        .value=${e.entity}
                        @value-changed=${(ev) => setEdit({ entity: ev.detail.value || '' })}>
                    </ha-selector>
                `}

                <div class="button-row">
                    <ha-button @click=${this._saveCellContent}>
                        <ha-icon icon="mdi:check" slot="start"></ha-icon>
                        Apply
                    </ha-button>
                    <ha-button appearance="plain" @click=${() => { this._activeCellEdit = null; }}>
                        <ha-icon icon="mdi:close" slot="start"></ha-icon>
                        Close
                    </ha-button>
                </div>

                ${this._renderStyleOverrides(`${path}.style`, 'Cell', e.entity)}

                <details class="overrides" ?open=${!!this._getConfigValue(`${path}.tap_action`)}>
                    <summary><ha-icon icon="mdi:gesture-tap"></ha-icon> Cell actions</summary>
                    <div class="overrides-body">
                        ${['tap_action', 'hold_action', 'double_tap_action'].map(key => html`
                            <span class="field-label">${key.replace(/_/g, ' ').replace(/^\w/, c => c.toUpperCase())}</span>
                            <ha-selector
                                .hass=${this.hass}
                                .selector=${{ ui_action: {} }}
                                .value=${this._getConfigValue(`${path}.${key}`)}
                                @value-changed=${(ev) => this._setConfigValue(`${path}.${key}`, ev.detail.value)}>
                            </ha-selector>
                        `)}
                    </div>
                </details>

                ${e.type === 'text' ? this._renderTemplateExamples() : ''}
            </lcards-form-section>
        `;
    }

    _renderTemplateExamples() {
        return html`
            <lcards-form-section header="Template Examples" description="Insert or copy common patterns" ?expanded=${false}>
                ${TEMPLATE_EXAMPLES.map(group => html`
                    <span class="field-label">${group.category}</span>
                    ${group.items.map(item => html`
                        <div class="example">
                            <div>
                                <div>${item.label}</div>
                                <code>${item.template}</code>
                            </div>
                            <ha-icon-button .label=${'Insert into cell'}
                                @click=${() => { this._activeCellEdit = { ...this._activeCellEdit, value: item.template }; }}>
                                <ha-icon icon="mdi:arrow-left-bold"></ha-icon>
                            </ha-icon-button>
                            <ha-icon-button .label=${'Copy'} @click=${() => copyTextToClipboard(item.template)}>
                                <ha-icon icon="mdi:content-copy"></ha-icon>
                            </ha-icon-button>
                        </div>
                    `)}
                `)}
            </lcards-form-section>
        `;
    }

    /**
     * Row or column operations plus its style overrides.
     * @param {'row'|'col'} axis
     * @param {number} i
     * @private
     */
    _renderTrackEditor(axis, i) {
        const isRow = axis === 'row';
        const count = this._trackCount(axis);
        const name = isRow ? 'Row' : 'Column';
        const icons = isRow
            ? ['mdi:table-row-plus-before', 'mdi:table-row-plus-after', 'mdi:arrow-up-bold', 'mdi:arrow-down-bold']
            : ['mdi:table-column-plus-before', 'mdi:table-column-plus-after', 'mdi:arrow-left-bold', 'mdi:arrow-right-bold'];
        return html`
            <lcards-form-section header="${name} ${i + 1}" description="Insert, move, delete and style" ?expanded=${true}>
                <div class="op-grid">
                    <ha-button @click=${() => this._insertTrack(axis, i)}><ha-icon icon=${icons[0]} slot="start"></ha-icon>Insert before</ha-button>
                    <ha-button @click=${() => this._insertTrack(axis, i + 1)}><ha-icon icon=${icons[1]} slot="start"></ha-icon>Insert after</ha-button>
                    <ha-button .disabled=${i === 0} @click=${() => this._moveTrack(axis, i, -1)}><ha-icon icon=${icons[2]} slot="start"></ha-icon>Move ${isRow ? 'up' : 'left'}</ha-button>
                    <ha-button .disabled=${i >= count - 1} @click=${() => this._moveTrack(axis, i, 1)}><ha-icon icon=${icons[3]} slot="start"></ha-icon>Move ${isRow ? 'down' : 'right'}</ha-button>
                    <ha-button variant="danger" .disabled=${count <= 1} @click=${() => this._removeTrack(axis, i)}><ha-icon icon="mdi:delete" slot="start"></ha-icon>Delete ${name.toLowerCase()}</ha-button>
                    <ha-button appearance="plain" @click=${() => this._closeEditors()}><ha-icon icon="mdi:close" slot="start"></ha-icon>Close</ha-button>
                </div>
                ${isRow ? html`
                    <ha-switch
                        .checked=${!!this._workingConfig.rows[i]?.header}
                        @change=${(e) => this._setConfigValue(`rows.${i}.header`, e.target.checked || undefined)}>
                        Header row (uses the header style)
                    </ha-switch>
                ` : ''}
                ${this._renderStyleOverrides(isRow ? `rows.${i}.style` : `columns.${i}.style`, name)}
            </lcards-form-section>
        `;
    }

    // ========================================================================
    // GRID STYLES TAB
    // ========================================================================

    _renderGridStylesTab() {
        const subTabs = [
            { id: 'hierarchy', label: 'Style Hierarchy', icon: 'mdi:file-tree' },
            { id: 'table', label: 'Grid-wide', icon: 'mdi:table' },
            { id: 'header', label: 'Header Rows', icon: 'mdi:table-row' }
        ];
        return html`
            <ha-tab-group @wa-tab-show=${(e) => this._onTab(e, '_stylesSubTab')}>
                ${subTabs.map(tab => html`
                    <ha-tab-group-tab value=${tab.id} ?active=${this._stylesSubTab === tab.id}>
                        <ha-icon icon=${tab.icon}></ha-icon>
                        ${tab.label}
                    </ha-tab-group-tab>
                `)}
            </ha-tab-group>
            ${this._stylesSubTab === 'hierarchy' ? html`
                <lcards-form-section header="Style Hierarchy" description="Which style wins" icon="mdi:file-tree" ?expanded=${true}>
                    <lcards-style-hierarchy-diagram></lcards-style-hierarchy-diagram>
                </lcards-form-section>
            ` : ''}
            ${this._stylesSubTab === 'table' ? this._renderGridWideStyles() : ''}
            ${this._stylesSubTab === 'header' ? html`
                <lcards-message type="info">
                    Applies to rows marked as header rows (open a row in Grid Structure and turn on Header row),
                    on top of the built-in header look: bold, uppercase, divider line.
                </lcards-message>
                ${this._renderStyleOverrides('header_style', 'Header')}
            ` : ''}
        `;
    }

    _renderGridWideStyles() {
        return html`
            <lcards-message type="info">
                Defaults for every cell. Override per row, column or cell in the Grid Structure tab.
            </lcards-message>

            <lcards-form-section header="Typography" description="Font settings for all cells" icon="mdi:format-font" ?expanded=${false}>
                <lcards-font-selector
                    .hass=${this.hass}
                    .value=${this._workingConfig.style?.font_family || ''}
                    .showPreview=${true}
                    .label=${'Font family'}
                    @value-changed=${(e) => this._setConfigValue('style.font_family', e.detail.value)}>
                </lcards-font-selector>
                <lcards-grid-layout>
                    ${this._text('style.font_size', 'Font size', 'px number or CSS length (default 24)', '24')}
                    ${this._number('style.font_weight', 'Font weight', { min: 100, max: 900, step: 100, fallback: 400 })}
                </lcards-grid-layout>
                <lcards-grid-layout>
                    ${this._select('style.text_transform', 'Text transform', TEXT_TRANSFORM, { fallback: 'none' })}
                    ${this._text('style.letter_spacing', 'Letter spacing', "e.g. '0.05em'", 'normal')}
                </lcards-grid-layout>
                ${this._text('style.line_height', 'Line height', "e.g. '1.5'", 'normal')}
            </lcards-form-section>

            <lcards-form-section header="Alignment & Wrapping" description="Text wrapping and alignment" icon="mdi:format-align-center" ?expanded=${false}>
                ${this._select('style.white_space', 'Text wrapping', WHITE_SPACE, { fallback: 'nowrap' })}
                <lcards-grid-layout>
                    ${this._select('style.align', 'Horizontal align', H_ALIGN, { fallback: 'right' })}
                    ${this._select('style.align_items', 'Vertical align', V_ALIGN, { fallback: 'center' })}
                </lcards-grid-layout>
            </lcards-form-section>

            <lcards-form-section header="Padding" description="Space inside each cell" icon="mdi:move-resize" ?expanded=${false}>
                <lcards-padding-editor
                    .editor=${this}
                    .config=${this._workingConfig}
                    path="style.padding"
                    label="Cell padding">
                </lcards-padding-editor>
            </lcards-form-section>

            ${this._colors('style', 'Cells')}

            <lcards-form-section header="Borders" description="Cell borders" icon="mdi:border-all" ?expanded=${false}>
                <lcards-grid-layout>
                    ${this._number('style.border_width', 'Border width', { min: 0, max: 20, unit: 'px' })}
                    ${this._text('style.border_color', 'Border colour', 'Any CSS colour or var(--...)')}
                </lcards-grid-layout>
                ${this._select('style.border_style', 'Border style',
                    ['solid', 'dashed', 'dotted', 'double', 'groove', 'ridge', 'inset', 'outset', 'none']
                        .map(v => ({ value: v, label: v[0].toUpperCase() + v.slice(1) })), { fallback: 'solid' })}
            </lcards-form-section>
        `;
    }

    // ========================================================================
    // EFFECTS TAB
    // ========================================================================

    _renderEffectsTab() {
        const highlight = this._workingConfig.highlight_changes;
        const h = isObject(highlight) ? highlight : {};
        return html`
            <lcards-form-section header="Animations" description="Add the cascade-color preset for the classic LCARS colour waterfall" icon="mdi:animation" ?expanded=${true}>
                <lcards-animation-editor
                    .hass=${this.hass}
                    .animations=${this._workingConfig.animations || []}
                    @animations-changed=${(e) => this._setConfigValue('animations', e.detail.value)}>
                </lcards-animation-editor>
                <div class="hint">
                    cascade-color params for the grid: pattern (default, niagara, fast, custom), speed_multiplier, duration,
                    timing (pattern: custom) and colors { start, text, end }.
                </div>
            </lcards-form-section>

            <lcards-form-section header="Highlight Changes" description="Animate cells when their value changes" icon="mdi:flash" ?expanded=${!!highlight}>
                <ha-switch
                    .checked=${!!highlight}
                    @change=${(e) => this._setConfigValue('highlight_changes', e.target.checked ? { preset: 'pulse' } : undefined)}>
                    Highlight changed cells
                </ha-switch>
                ${highlight ? html`
                    <lcards-grid-layout>
                        <ha-selector
                            .hass=${this.hass}
                            .selector=${{ select: { mode: 'dropdown', options: [{ value: 'pulse', label: 'Pulse' }, { value: 'glow', label: 'Glow' }] } }}
                            .label=${'Preset'}
                            .value=${h.preset || 'pulse'}
                            @value-changed=${(e) => this._setHighlight('preset', e.detail.value)}
                            @closed=${(e) => e.stopPropagation()}>
                        </ha-selector>
                        <ha-selector
                            .hass=${this.hass}
                            .selector=${{ number: { mode: 'box', min: 50, max: 5000, step: 50, unit_of_measurement: 'ms' } }}
                            .label=${'Duration'}
                            .value=${h.duration ?? 500}
                            @value-changed=${(e) => this._setHighlight('duration', e.detail.value)}>
                        </ha-selector>
                    </lcards-grid-layout>
                    <ha-selector
                        .hass=${this.hass}
                        .selector=${{ number: { mode: 'box', min: 1, max: 500 } }}
                        .label=${'Most cells animated at once'}
                        .value=${h.max_cells}
                        @value-changed=${(e) => this._setHighlight('max_cells', e.detail.value)}>
                    </ha-selector>
                ` : ''}
            </lcards-form-section>

            <lcards-form-section header="Filters" description="CSS filters on the whole grid (blur, brightness, ...)" icon="mdi:auto-fix" ?expanded=${false}>
                <lcards-filter-editor
                    .hass=${this.hass}
                    .filters=${this._workingConfig.filters || []}
                    @filters-changed=${(e) => this._setConfigValue('filters', e.detail.value)}>
                </lcards-filter-editor>
            </lcards-form-section>
        `;
    }

    /** @private */
    _setHighlight(key, value) {
        const current = this._workingConfig.highlight_changes;
        this._workingConfig.highlight_changes = isObject(current) ? current : {};
        this._setConfigValue(`highlight_changes.${key}`, value);
    }

    // ========================================================================
    // ADVANCED TAB
    // ========================================================================

    _renderAdvancedTab() {
        return html`
            <lcards-message type="info">
                CSS Grid properties of the grid container. In decorative mode the templates also set the grid size.
            </lcards-message>

            <lcards-form-section header="Grid Template" description="Row and column sizing" icon="mdi:table-cog" ?expanded=${true}>
                ${this._text('grid.grid-template-rows', 'Grid template rows', "e.g. 'repeat(8, auto)', '40px 1fr'", 'auto')}
                ${this._text('grid.grid-template-columns', 'Grid template columns', "e.g. 'repeat(12, 1fr)', '100px 1fr 80px'", 'repeat(N, 1fr)')}
                <lcards-grid-layout>
                    ${this._text('grid.gap', 'Gap', "e.g. '8px'", '8px')}
                    ${this._text('grid.row-gap', 'Row gap')}
                </lcards-grid-layout>
                ${this._text('grid.column-gap', 'Column gap')}
            </lcards-form-section>

            <lcards-form-section header="Flow & Alignment" description="Item placement and alignment" icon="mdi:arrow-decision" ?expanded=${false}>
                ${this._select('grid.grid-auto-flow', 'Auto flow',
                    ['row', 'column', 'row dense', 'column dense'].map(v => ({ value: v, label: v })), { inherit: true })}
                <lcards-grid-layout>
                    ${this._select('grid.justify-items', 'Justify items', ITEM_ALIGN, { inherit: true })}
                    ${this._select('grid.align-items', 'Align items', ITEM_ALIGN, { inherit: true })}
                </lcards-grid-layout>
                <lcards-grid-layout>
                    ${this._select('grid.justify-content', 'Justify content', CONTENT_ALIGN, { inherit: true })}
                    ${this._select('grid.align-content', 'Align content', CONTENT_ALIGN, { inherit: true })}
                </lcards-grid-layout>
                <lcards-grid-layout>
                    ${this._text('grid.grid-auto-columns', 'Auto columns', 'Width of implicit columns')}
                    ${this._text('grid.grid-auto-rows', 'Auto rows', 'Height of implicit rows')}
                </lcards-grid-layout>
            </lcards-form-section>
        `;
    }

    // ========================================================================
    // PREVIEW
    // ========================================================================

    /** @private */
    _togglePreview(prop) {
        this[prop] = !this[prop];
        this._updatePreviewCard();
    }

    /** Rebuild the preview card from the compacted working config. @private */
    _updatePreviewCard() {
        const container = this._previewRef.value;
        if (!container) return;
        container.replaceChildren();

        const config = compactDataGridConfig(this._workingConfig);
        if (!this._showAnimations && Array.isArray(config.animations)) {
            config.animations = config.animations.map(a => ({ ...a, enabled: false }));
        }

        const card = /** @type {any} */ (document.createElement('lcards-data-grid'));
        try {
            card.setConfig(config);
        } catch (error) {
            lcardsLog.warn('[DataGridStudio] Preview config rejected', error);
            return;
        }
        card.hass = this.hass;
        container.appendChild(card);
        this._previewCard = card;

        if (this._showGridLines) {
            card.updateComplete?.then(() => {
                const style = document.createElement('style');
                style.textContent = `.grid-cell { outline: var(--ha-border-width-md) dashed color-mix(in srgb, var(--primary-color) 60%, transparent); outline-offset: -1px; }`;
                card.shadowRoot?.appendChild(style);
            });
        }
    }

    // ========================================================================
    // SAVE / CLOSE
    // ========================================================================

    _handleSave() {
        const config = compactDataGridConfig(this._workingConfig);
        this.dispatchEvent(new CustomEvent('config-changed', { detail: { config } }));
        this._close();
    }

    _close() {
        this.dispatchEvent(new CustomEvent('closed'));
    }
}

if (!customElements.get('lcards-data-grid-studio-dialog-v4')) customElements.define('lcards-data-grid-studio-dialog-v4', LCARdSDataGridStudioDialogV4);
