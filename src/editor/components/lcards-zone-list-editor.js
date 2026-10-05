/**
 * @fileoverview LCARdS Zone List Editor
 *
 * Visual editor for config.zones — custom/override named zones.
 * Each zone defines a named rectangular area (x, y, width, height) in the
 * card's SVG coordinate space.  Text fields route to a zone by name using the
 * `zone:` key.  A zone defined here can either create a brand-new named area
 * or override the bounds of an auto-calculated card zone (e.g. 'body').
 *
 * Supports both pixel (px) and percentage (%) dimensions per zone.
 * Percent values are resolved at render time against the card's pixel dimensions.
 *
 * Usage:
 * ```html
 * <lcards-zone-list-editor
 *   .zones=${this.config.zones}
 *   @zones-changed=${this._handleZonesChanged}>
 * </lcards-zone-list-editor>
 * ```
 *
 * Config format emitted via zones-changed:
 * ```yaml
 * zones:
 *   sidebar:
 *     x: 0
 *     y: 0
 *     width: 80
 *     height_percent: 100    # mix px + percent is supported
 *   value_area:
 *     x_percent: 30
 *     y_percent: 20
 *     width_percent: 70
 *     height_percent: 60
 * ```
 *
 * @fires zones-changed - { detail: { value: Object } } updated zones config object
 */

import { LitElement, html, css, nothing } from 'lit';
import { lcardsLog } from '../../utils/lcards-logging.js';
import { editorWidgetStyles } from './editors/editor-widget-styles.js';

export class LCARdSZoneListEditor extends LitElement {

    static get properties() {
        return {
            zones: { type: Object },
            _expandedIndex: { type: Number, state: true },
        };
    }

    constructor() {
        super();
        this.zones = {};
        this._expandedIndex = null;
        lcardsLog.debug('[ZoneListEditor] Initialized');
    }

    static get styles() {
        return [
            editorWidgetStyles,
            css`
                :host {
                    display: block;
                }

                .zone-editor {
                    display: flex;
                    flex-direction: column;
                    gap: 8px;
                }

                .empty-state {
                    text-align: center;
                    padding: 24px 16px;
                    color: var(--secondary-text-color);
                    border: 1px dashed var(--divider-color);
                    border-radius: var(--ha-card-border-radius, 12px);
                }

                .empty-state-title {
                    font-weight: 500;
                    margin-bottom: 8px;
                }

                .empty-state-desc {
                    font-size: 13px;
                    line-height: 1.5;
                }

                .unit-row {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    margin-bottom: 16px;
                }

                .unit-row span {
                    font-size: 13px;
                    font-weight: 500;
                    color: var(--secondary-text-color);
                    white-space: nowrap;
                }

                .unit-select {
                    flex: 1;
                }

                .dim-grid {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 12px;
                    margin-bottom: 16px;
                }

                .help-text {
                    font-size: 12px;
                    color: var(--secondary-text-color);
                    line-height: 1.5;
                    padding: 10px 12px;
                    background: var(--secondary-background-color);
                    border-radius: 6px;
                    margin-top: 8px;
                }

                .help-text code {
                    font-family: monospace;
                    background: var(--code-editor-background-color, rgba(0,0,0,0.1));
                    padding: 1px 4px;
                    border-radius: 3px;
                }
            `
        ];
    }

    // ──────────────────────────────────────────────────────────────
    // Data helpers
    // ──────────────────────────────────────────────────────────────

    /** Convert config object → ordered array for rendering */
    _toArray() {
        if (!this.zones || typeof this.zones !== 'object') return [];
        return Object.entries(this.zones).map(([name, def]) => ({ name, ...(def || {}) }));
    }

    /** Convert array back → config object (preserves order) */
    _toConfig(arr) {
        const out = {};
        for (const { name, ...rest } of arr) {
            if (name) out[name] = rest;
        }
        return out;
    }

    _emit(arr) {
        this.dispatchEvent(new CustomEvent('zones-changed', {
            detail: { value: this._toConfig(arr) },
            bubbles: true,
            composed: true
        }));
    }

    /** Detect whether a zone def uses percent mode for any axis */
    _isPercent(zone) {
        return zone.x_percent != null || zone.y_percent != null ||
               zone.width_percent != null || zone.height_percent != null;
    }

    /** Build a subtitle string summarising bounds for the collapsed header */
    _subtitle(zone) {
        if (this._isPercent(zone)) {
            const xp   = zone.x_percent   ?? '?';
            const yp   = zone.y_percent   ?? '?';
            const wp   = zone.width_percent  ?? '?';
            const hp   = zone.height_percent ?? '?';
            return `x:${xp}% y:${yp}% w:${wp}% h:${hp}%`;
        }
        const x = zone.x ?? '?';
        const y = zone.y ?? '?';
        const w = zone.width  ?? '?';
        const h = zone.height ?? '?';
        return `x:${x}px y:${y}px w:${w}px h:${h}px`;
    }

    // ──────────────────────────────────────────────────────────────
    // Mutation helpers
    // ──────────────────────────────────────────────────────────────

    _addZone() {
        const arr = this._toArray();
        let n = arr.length + 1;
        while (arr.some(z => z.name === `zone_${n}`)) n++;
        arr.push({ name: `zone_${n}`, x: 0, y: 0, width: 100, height: 50 });
        this._expandedIndex = arr.length - 1;
        this._emit(arr);
    }

    _deleteZone(e, index) {
        e.stopPropagation();
        const arr = this._toArray();
        arr.splice(index, 1);
        if (this._expandedIndex >= arr.length) this._expandedIndex = null;
        this._emit(arr);
    }

    _moveZone(e, index, dir) {
        e.stopPropagation();
        const arr = this._toArray();
        const target = index + dir;
        if (target < 0 || target >= arr.length) return;
        [arr[index], arr[target]] = [arr[target], arr[index]];
        this._expandedIndex = target;
        this._emit(arr);
    }

    _updateField(index, field, value) {
        const arr = this._toArray();
        arr[index] = { ...arr[index], [field]: value };
        this._emit(arr);
    }

    _rename(index, newName) {
        const arr = this._toArray();
        arr[index] = { ...arr[index], name: newName };
        this._emit(arr);
    }

    /**
     * Switch a zone between px and percent unit mode.
     * Converts existing values proportionally if possible (assume 500px card as an
     * approximation when the actual card size is unknown to the editor component).
     */
    _toggleUnits(index, usePercent) {
        const arr = this._toArray();
        const z = arr[index];
        if (usePercent) {
            // Strip px fields, initialise percent fields from existing px (÷500 heuristic)
            // or keep existing percent values if already present.
            arr[index] = {
                name: z.name,
                x_percent:      z.x_percent      ?? (z.x      != null ? parseFloat((z.x      / 5).toFixed(1)) : 0),
                y_percent:      z.y_percent      ?? (z.y      != null ? parseFloat((z.y      / 5).toFixed(1)) : 0),
                width_percent:  z.width_percent  ?? (z.width  != null ? parseFloat((z.width  / 5).toFixed(1)) : 50),
                height_percent: z.height_percent ?? (z.height != null ? parseFloat((z.height / 5).toFixed(1)) : 100),
            };
        } else {
            // Strip percent fields, seed px from existing px or percent (×5 heuristic).
            arr[index] = {
                name: z.name,
                x:      z.x      ?? (z.x_percent      != null ? Math.round(z.x_percent      * 5) : 0),
                y:      z.y      ?? (z.y_percent      != null ? Math.round(z.y_percent      * 5) : 0),
                width:  z.width  ?? (z.width_percent  != null ? Math.round(z.width_percent  * 5) : 100),
                height: z.height ?? (z.height_percent != null ? Math.round(z.height_percent * 5) : 50),
            };
        }
        this._emit(arr);
    }

    // ──────────────────────────────────────────────────────────────
    // Render
    // ──────────────────────────────────────────────────────────────

    render() {
        const arr = this._toArray();
        return html`
            <div class="zone-editor">

                <ha-button class="add-button" @click=${this._addZone}>
                    <ha-icon icon="mdi:plus" slot="start"></ha-icon>
                    Add Zone
                </ha-button>

                ${arr.length === 0 ? this._renderEmptyState() : html`
                    <div class="editor-list">
                        ${arr.map((zone, i) => this._renderItem(zone, i, arr.length))}
                    </div>
                `}

            </div>
        `;
    }

    _renderEmptyState() {
        return html`
            <div class="empty-state">
                <div class="empty-state-title">No custom zones defined</div>
                <div class="empty-state-desc">
                    Custom zones let you define named rectangular areas that text fields
                    can target via <code>zone:</code>. They can override auto-calculated
                    card zones (e.g. <code>body</code>) or add entirely new ones.
                </div>
            </div>
        `;
    }

    _renderItem(zone, index, total) {
        const isExpanded = this._expandedIndex === index;
        const usePercent = this._isPercent(zone);

        return html`
            <div class="editor-item">

                <div class="editor-item-header"
                     @click=${() => { this._expandedIndex = isExpanded ? null : index; this.requestUpdate(); }}>

                    <ha-icon class="editor-item-icon" icon="mdi:vector-rectangle"></ha-icon>

                    <div class="editor-item-info">
                        <div class="editor-item-title">${zone.name || '(unnamed)'}</div>
                        <div class="editor-item-subtitle">${this._subtitle(zone)}</div>
                    </div>

                    <div class="editor-item-actions">
                        <ha-icon-button
                            .label=${'Move Up'}
                            .disabled=${index === 0}
                            @click=${(e) => this._moveZone(e, index, -1)}>
                            <ha-icon icon="mdi:arrow-up"></ha-icon>
                        </ha-icon-button>
                        <ha-icon-button
                            .label=${'Move Down'}
                            .disabled=${index === total - 1}
                            @click=${(e) => this._moveZone(e, index, 1)}>
                            <ha-icon icon="mdi:arrow-down"></ha-icon>
                        </ha-icon-button>
                        <ha-icon-button
                            .label=${'Delete'}
                            @click=${(e) => this._deleteZone(e, index)}>
                            <ha-icon icon="mdi:delete"></ha-icon>
                        </ha-icon-button>
                    </div>

                    <ha-icon
                        class="expand-icon ${isExpanded ? 'expanded' : ''}"
                        icon="mdi:chevron-down">
                    </ha-icon>

                </div>

                ${isExpanded ? this._renderItemContent(zone, index, usePercent) : nothing}

            </div>
        `;
    }

    _renderItemContent(zone, index, usePercent) {
        return html`
            <div class="editor-item-content">

                <!-- Zone name -->
                <div class="form-row">
                    <ha-selector
                        .selector=${{ text: {} }}
                        .value=${zone.name}
                        .label=${'Zone name: referenced as zone: in text fields'}
                        @value-changed=${(e) => this._rename(index, e.detail.value)}>
                    </ha-selector>
                </div>

                <!-- Unit mode toggle -->
                <div class="unit-row">
                    <span>Units:</span>
                    <div class="unit-select">
                        <ha-selector
                            .selector=${{ select: {
                                options: [
                                    { value: 'px',      label: 'Pixels (px)' },
                                    { value: 'percent', label: 'Percent (%)' }
                                ],
                                mode: 'dropdown'
                            }}}
                            .value=${usePercent ? 'percent' : 'px'}
                            @value-changed=${(e) => this._toggleUnits(index, e.detail.value === 'percent')}>
                        </ha-selector>
                    </div>
                </div>

                <!-- Dimension inputs — px mode -->
                ${!usePercent ? html`
                    <div class="dim-grid">
                        <ha-selector
                            .selector=${{ number: { min: 0, step: 1, mode: 'box', unit_of_measurement: 'px' } }}
                            .value=${zone.x ?? 0}
                            .label=${'X  (left edge)'}
                            @value-changed=${(e) => this._updateField(index, 'x', e.detail.value)}>
                        </ha-selector>
                        <ha-selector
                            .selector=${{ number: { min: 0, step: 1, mode: 'box', unit_of_measurement: 'px' } }}
                            .value=${zone.y ?? 0}
                            .label=${'Y  (top edge)'}
                            @value-changed=${(e) => this._updateField(index, 'y', e.detail.value)}>
                        </ha-selector>
                        <ha-selector
                            .selector=${{ number: { min: 0, step: 1, mode: 'box', unit_of_measurement: 'px' } }}
                            .value=${zone.width ?? 100}
                            .label=${'Width'}
                            @value-changed=${(e) => this._updateField(index, 'width', e.detail.value)}>
                        </ha-selector>
                        <ha-selector
                            .selector=${{ number: { min: 0, step: 1, mode: 'box', unit_of_measurement: 'px' } }}
                            .value=${zone.height ?? 50}
                            .label=${'Height'}
                            @value-changed=${(e) => this._updateField(index, 'height', e.detail.value)}>
                        </ha-selector>
                    </div>
                ` : nothing}

                <!-- Dimension inputs — percent mode -->
                ${usePercent ? html`
                    <div class="dim-grid">
                        <ha-selector
                            .selector=${{ number: { min: 0, max: 100, step: 0.1, mode: 'box', unit_of_measurement: '%' } }}
                            .value=${zone.x_percent ?? 0}
                            .label=${'X  (left edge)'}
                            @value-changed=${(e) => this._updateField(index, 'x_percent', e.detail.value)}>
                        </ha-selector>
                        <ha-selector
                            .selector=${{ number: { min: 0, max: 100, step: 0.1, mode: 'box', unit_of_measurement: '%' } }}
                            .value=${zone.y_percent ?? 0}
                            .label=${'Y  (top edge)'}
                            @value-changed=${(e) => this._updateField(index, 'y_percent', e.detail.value)}>
                        </ha-selector>
                        <ha-selector
                            .selector=${{ number: { min: 0, max: 100, step: 0.1, mode: 'box', unit_of_measurement: '%' } }}
                            .value=${zone.width_percent ?? 50}
                            .label=${'Width'}
                            @value-changed=${(e) => this._updateField(index, 'width_percent', e.detail.value)}>
                        </ha-selector>
                        <ha-selector
                            .selector=${{ number: { min: 0, max: 100, step: 0.1, mode: 'box', unit_of_measurement: '%' } }}
                            .value=${zone.height_percent ?? 100}
                            .label=${'Height'}
                            @value-changed=${(e) => this._updateField(index, 'height_percent', e.detail.value)}>
                        </ha-selector>
                    </div>
                ` : nothing}

                <div class="help-text">
                    Reference this zone in any text field with <code>zone: ${zone.name || 'zone_name'}</code>.
                    Percent values are resolved against the card's rendered pixel size at runtime.
                    You can also mix units per axis (e.g. <code>x: 10</code> with <code>height_percent: 100</code>).
                </div>

            </div>
        `;
    }
}

if (!customElements.get('lcards-zone-list-editor')) {
    customElements.define('lcards-zone-list-editor', LCARdSZoneListEditor);
}
