/**
 * @fileoverview LCARdS Filter Editor Component
 *
 * Reusable visual editor for CSS and SVG filter configuration.
 * Supports stackable filters with add/remove/reorder capabilities.
 *
 * Features:
 * - List-based UI (similar to animation editor)
 * - Add/duplicate/delete/reorder filters
 * - Dynamic parameter forms per filter type
 * - CSS filters: blur, brightness, contrast, saturate, hue-rotate, grayscale, sepia, invert, opacity, drop-shadow
 * - SVG filters (future): feGaussianBlur, feColorMatrix, feBlend, etc.
 *
 * Usage:
 * ```html
 * <lcards-filter-editor
 *   .hass=${this.hass}
 *   .filters=${this.config.filters}
 *   @filters-changed=${this._handleFiltersChanged}>
 * </lcards-filter-editor>
 * ```
 *
 * Config Format:
 * ```yaml
 * filters:
 *   - type: blur
 *     value: 5px
 *   - type: brightness
 *     value: 1.2
 *   - type: saturate
 *     value: 0.8
 * ```
 *
 * @fires filters-changed - Dispatched when filter configuration changes
 */

import { LitElement, html, css } from 'lit';
import { lcardsLog } from '../../utils/lcards-logging.js';
import './shared/lcards-form-section.js';
import './shared/lcards-color-picker.js';
import './shared/lcards-message.js';

export class LCARdSFilterEditor extends LitElement {

    static get properties() {
        return {
            hass: { type: Object },
            filters: { type: Array }, // Array of filter objects
            _expandedFilters: { type: Object } // Track which filters are expanded
        };
    }

    constructor() {
        super();
        /** @type {any} */
        this.hass = undefined;
        this.filters = [];
        this._expandedFilters = {};
        this._draggedIndex = null;
        lcardsLog.debug('[FilterEditor] Initialized');
    }

    static get styles() {
        return css`
            :host {
                display: block;
            }

            .filter-editor {
                display: flex;
                flex-direction: column;
                gap: 12px;
            }

            .add-button {
                width: 100%;
            }

            .filter-list {
                display: flex;
                flex-direction: column;
                gap: 8px;
            }

            .filter-item {
                background: var(--card-background-color);
                border: 1px solid var(--divider-color);
                border-radius: var(--ha-card-border-radius, 12px);
                overflow: hidden;
            }

            .filter-header {
                display: flex;
                align-items: center;
                gap: 12px;
                padding: 12px;
                cursor: pointer;
                user-select: none;
                background: var(--secondary-background-color);
            }

            .filter-header:hover {
                background: var(--primary-background-color);
            }

            .drag-handle {
                cursor: grab;
                color: var(--secondary-text-color);
                padding: 4px;
                margin-left: -4px;
            }

            .drag-handle:hover {
                color: var(--primary-text-color);
            }

            .drag-handle:active {
                cursor: grabbing;
            }

            .filter-item.dragging {
                opacity: 0.5;
            }

            .filter-item.drag-over {
                border-top: 3px solid var(--primary-color);
            }

            .filter-icon {
                color: var(--primary-color);
                --mdc-icon-size: 24px;
            }

            .filter-info {
                flex: 1;
                min-width: 0;
            }

            .filter-type-row {
                display: flex;
                align-items: center;
                gap: 8px;
                margin-bottom: 4px;
            }

            .filter-type {
                font-weight: 600;
                font-size: 18px;
            }

            .filter-value {
                font-size: 12px;
                color: var(--secondary-text-color);
                font-family: monospace;
            }

            .filter-actions {
                display: flex;
                gap: 4px;
            }

            .expand-icon {
                transition: transform 0.2s;
            }

            .expand-icon.expanded {
                transform: rotate(180deg);
            }

            .filter-content {
                padding: 16px;
                border-top: 1px solid var(--divider-color);
            }

            .param-grid {
                display: grid;
                gap: 16px;
            }

            .param-grid.two-col {
                grid-template-columns: 1fr 1fr;
            }

            .param-grid.three-col {
                grid-template-columns: 1fr 1fr 1fr;
            }

            .empty-state {
                text-align: center;
                padding: 32px 16px;
                color: var(--secondary-text-color);
            }

            .empty-state ha-icon {
                font-size: 48px;
                opacity: 0.3;
                margin-bottom: 12px;
            }

            /* Button styling for raised appearance */
            ha-button[raised] {
                --mdc-theme-primary: var(--primary-color);
            }

            .filter-chain-info {
                background: var(--primary-background-color);
                border: 1px solid var(--divider-color);
                border-radius: var(--ha-card-border-radius, 12px);
                padding: 12px;
                margin-bottom: 12px;
                font-size: 13px;
            }

            .filter-chain-info strong {
                color: var(--primary-color);
            }
        `;
    }

    render() {
        const filterCount = this.filters?.length || 0;
        const hasSvgFilters = this.filters?.some(f => f.mode === 'svg');

        return html`
            <div class="filter-editor">
                <!-- Add Filter Button -->
                <ha-button
                    class="add-button"
                    @click=${this._addFilter}>
                    <ha-icon icon="mdi:plus" slot="start"></ha-icon>
                    Add Filter
                </ha-button>

                <!-- Filter Chain Info -->
                ${hasSvgFilters ? this._renderFilterChainInfo() : ''}

                <!-- Filter List -->
                ${filterCount === 0 ? this._renderEmptyState() : html`
                    <div class="filter-list">
                        ${this.filters.map((filter, index) => this._renderFilterItem(filter, index))}
                    </div>
                `}
            </div>
        `;
    }

    /**
     * Render filter chain information
     * @returns {TemplateResult}
     * @private
     */
    _renderFilterChainInfo() {
        return html`
            <div class="filter-chain-info">
                <ha-icon icon="mdi:information" style="float: left; margin-right: 8px;"></ha-icon>
                <strong>SVG Filters Auto-Chain:</strong> Each filter processes the output of the previous one.
                <strong>Order matters!</strong> Drag filters to reorder.
                <br><br>
                <strong>Common Patterns:</strong>
                <ul style="margin: 8px 0 0 0; padding-left: 24px;">
                    <li><strong>Glow:</strong> Blur → Blend (screen/lighten)</li>
                    <li><strong>Distortion:</strong> Turbulence → Displacement Map</li>
                    <li><strong>Drop Shadow:</strong> Offset → Blur → Blend</li>
                    <li><strong>Color Effects:</strong> Color Matrix (stack multiple)</li>
                </ul>
            </div>
        `;
    }

    /**
     * Render empty state
     * @returns {TemplateResult}
     * @private
     */
    _renderEmptyState() {
        return html`
            <div class="empty-state">
                <ha-icon icon="mdi:blur"></ha-icon>
                <div style="font-weight: 500; margin-bottom: 8px;">No filters configured</div>
                <div style="font-size: 13px;">
                    Click "Add Filter" to apply visual effects like blur, brightness, saturation, etc.
                </div>
            </div>
        `;
    }

    /**
     * Render single filter item
     * @param {Object} filter - Filter configuration
     * @param {number} index - Filter index
     * @returns {TemplateResult}
     * @private
     */
    _renderFilterItem(filter, index) {
        const isExpanded = this._expandedFilters[index] || false;
        const filterMode = filter.mode || 'css'; // 'css' or 'svg'
        const filterType = filter.type || 'blur';
        const filterValue = this._getFilterValueDisplay(filter);
        const isDragging = this._draggedIndex === index;

        return html`
            <div
                class="filter-item ${isDragging ? 'dragging' : ''}"
                draggable="true"
                @dragstart=${(e) => this._handleDragStart(e, index)}
                @dragend=${(e) => this._handleDragEnd(e)}
                @dragover=${(e) => this._handleDragOver(e, index)}
                @drop=${(e) => this._handleDrop(e, index)}>
                <!-- Filter Header -->
                <div class="filter-header" @click=${() => this._toggleExpanded(index)}>
                    <!-- Drag Handle -->
                    <ha-icon
                        class="drag-handle"
                        icon="mdi:drag"
                        @click=${(e) => e.stopPropagation()}>
                    </ha-icon>

                    <ha-icon
                        class="filter-icon"
                        icon=${this._getFilterIcon(filterType)}>
                    </ha-icon>

                    <div class="filter-info">
                        <div class="filter-type-row">
                            <span class="filter-type">${this._getFilterDisplayName(filterType)}</span>
                            <ha-button
                                size="small"
                                appearance="filled"
                                variant="success"
                                .label=${filterMode.toUpperCase()}
                                ?disabled=${false}>
                                ${filterMode.toUpperCase()}
                            </ha-button>
                        </div>
                        <div class="filter-value">${filterValue}</div>
                    </div>

                    <div class="filter-actions">
                        <ha-icon-button
                            @click=${(e) => this._duplicateFilter(index, e)}
                            .label=${'Duplicate'}
                            .path=${'M19,21H8V7H19M19,5H8A2,2 0 0,0 6,7V21A2,2 0 0,0 8,23H19A2,2 0 0,0 21,21V7A2,2 0 0,0 19,5M16,1H4A2,2 0 0,0 2,3V17H4V3H16V1Z'}>
                        </ha-icon-button>
                        <ha-icon-button
                            @click=${(e) => this._deleteFilter(index, e)}
                            .label=${'Delete'}
                            .path=${'M19,4H15.5L14.5,3H9.5L8.5,4H5V6H19M6,19A2,2 0 0,0 8,21H16A2,2 0 0,0 18,19V7H6V19Z'}>
                        </ha-icon-button>
                    </div>

                    <ha-icon
                        class="expand-icon ${isExpanded ? 'expanded' : ''}"
                        icon="mdi:chevron-down">
                    </ha-icon>
                </div>

                <!-- Filter Content (Expanded) -->
                ${isExpanded ? html`
                    <div class="filter-content">
                        ${this._renderFilterForm(filter, index)}
                    </div>
                ` : ''}
            </div>
        `;
    }

    /**
     * Render filter configuration form
     * @param {Object} filter - Filter configuration
     * @param {number} index - Filter index
     * @returns {TemplateResult}
     * @private
     */
    _renderFilterForm(filter, index) {
        const filterMode = filter.mode || 'css';
        const filterType = filter.type || 'blur';
        const description = this._getFilterDescription(filterType);

        return html`
            <lcards-form-section
                header="Filter Type"
                headerLevel="4"
                ?expanded=${true}>

                <ha-selector
                    // @ts-ignore - TS2339: auto-suppressed
                    .hass=${this.hass}
                    .selector=${{
                        select: {
                            options: this._getFilterTypeOptions()
                        }
                    }}
                    .value=${filterType}
                    .label=${'Filter Effect'}
                    @value-changed=${(e) => this._updateFilter(index, 'type', e.detail.value)}>
                </ha-selector>

                ${description ? html`
                    <lcards-message type="info" .message=${description}></lcards-message>
                ` : ''}
            </lcards-form-section>

            ${this._renderFilterParameters(filter, index)}
        `;
    }

    /**
     * Render filter-specific parameters
     * @param {Object} filter - Filter configuration
     * @param {number} index - Filter index
     * @returns {TemplateResult}
     * @private
     */
    _renderFilterParameters(filter, index) {
        const filterType = filter.type || 'blur';

        return html`
            <lcards-form-section
                header="Parameters"
                headerLevel="4"
                ?expanded=${true}>
                ${this._renderParametersForType(filter, index, filterType)}
            </lcards-form-section>
        `;
    }

    /**
     * Render parameters based on filter type
     * @param {Object} filter - Filter configuration
     * @param {number} index - Filter index
     * @param {string} type - Filter type
     * @returns {TemplateResult}
     * @private
     */
    _renderParametersForType(filter, index, type) {
        // CSS Filters
        switch (type) {
            case 'blur':
                return this._renderBlurParams(filter, index);
            case 'brightness':
                return this._renderBrightnessParams(filter, index);
            case 'contrast':
                return this._renderContrastParams(filter, index);
            case 'saturate':
                return this._renderSaturateParams(filter, index);
            case 'hue-rotate':
                return this._renderHueRotateParams(filter, index);
            case 'grayscale':
                return this._renderGrayscaleParams(filter, index);
            case 'sepia':
                return this._renderSepiaParams(filter, index);
            case 'invert':
                return this._renderInvertParams(filter, index);
            case 'opacity':
                return this._renderOpacityParams(filter, index);
            case 'drop-shadow':
                return this._renderDropShadowParams(filter, index);
            // SVG Filter Primitives
            case 'feGaussianBlur':
                return this._renderFeGaussianBlurParams(filter, index);
            case 'feColorMatrix':
                return this._renderFeColorMatrixParams(filter, index);
            case 'feOffset':
                return this._renderFeOffsetParams(filter, index);
            case 'feBlend':
                return this._renderFeBlendParams(filter, index);
            case 'feComposite':
                return this._renderFeCompositeParams(filter, index);
            case 'feMorphology':
                return this._renderFeMorphologyParams(filter, index);
            case 'feTurbulence':
                return this._renderFeTurbulenceParams(filter, index);
            case 'feDisplacementMap':
                return this._renderFeDisplacementMapParams(filter, index);
            default:
                return html`<div style="color: var(--error-color);">Unknown filter type: ${type}</div>`;
        }
    }

    /**
     * Render blur filter parameters
     * @private
     */
    _renderBlurParams(filter, index) {
        return html`
            <ha-textfield
                type="text"
                label="Blur Radius"
                .value=${filter.value || '0px'}
                @input=${(e) => this._updateFilter(index, 'value', e.target.value)}
                helper-text="e.g., 0px, 2px, 5px, 10px">
            </ha-textfield>
        `;
    }

    /**
     * Render brightness filter parameters
     * @private
     */
    _renderBrightnessParams(filter, index) {
        return html`
            <ha-selector
                // @ts-ignore - TS2339: auto-suppressed
                .hass=${this.hass}
                .selector=${{ number: { min: 0, max: 3, step: 0.1, mode: 'slider' } }}
                .value=${filter.value ?? 1}
                .label=${'Brightness'}
                @value-changed=${(e) => this._updateFilter(index, 'value', e.detail.value)}>
            </ha-selector>
            <lcards-message type="info" .message=${'0 = black, 1 = normal, 2+ = brighter'}></lcards-message>
        `;
    }

    /**
     * Render contrast filter parameters
     * @private
     */
    _renderContrastParams(filter, index) {
        return html`
            <ha-selector
                // @ts-ignore - TS2339: auto-suppressed
                .hass=${this.hass}
                .selector=${{ number: { min: 0, max: 3, step: 0.1, mode: 'slider' } }}
                .value=${filter.value ?? 1}
                .label=${'Contrast'}
                @value-changed=${(e) => this._updateFilter(index, 'value', e.detail.value)}>
            </ha-selector>
            <lcards-message type="info" .message=${'0 = gray, 1 = normal, 2+ = higher contrast'}></lcards-message>
        `;
    }

    /**
     * Render saturate filter parameters
     * @private
     */
    _renderSaturateParams(filter, index) {
        return html`
            <ha-selector
                // @ts-ignore - TS2339: auto-suppressed
                .hass=${this.hass}
                .selector=${{ number: { min: 0, max: 3, step: 0.1, mode: 'slider' } }}
                .value=${filter.value ?? 1}
                .label=${'Saturation'}
                @value-changed=${(e) => this._updateFilter(index, 'value', e.detail.value)}>
            </ha-selector>
            <lcards-message type="info" .message=${'0 = grayscale, 1 = normal, 2+ = oversaturated'}></lcards-message>
        `;
    }

    /**
     * Render hue-rotate filter parameters
     * @private
     */
    _renderHueRotateParams(filter, index) {
        return html`
            <ha-selector
                // @ts-ignore - TS2339: auto-suppressed
                .hass=${this.hass}
                .selector=${{ number: { min: 0, max: 360, step: 1, mode: 'slider' } }}
                .value=${typeof filter.value === 'string' ? parseInt(filter.value) : (filter.value ?? 0)}
                .label=${'Hue Rotation (degrees)'}
                @value-changed=${(e) => this._updateFilter(index, 'value', `${e.detail.value}deg`)}>
            </ha-selector>
            <lcards-message type="info" .message=${'Rotates colors around the color wheel (0-360°)'}></lcards-message>
        `;
    }

    /**
     * Render grayscale filter parameters
     * @private
     */
    _renderGrayscaleParams(filter, index) {
        return html`
            <ha-selector
                // @ts-ignore - TS2339: auto-suppressed
                .hass=${this.hass}
                .selector=${{ number: { min: 0, max: 1, step: 0.1, mode: 'slider' } }}
                .value=${filter.value ?? 0}
                .label=${'Grayscale Amount'}
                @value-changed=${(e) => this._updateFilter(index, 'value', e.detail.value)}>
            </ha-selector>
            <lcards-message type="info" .message=${'0 = color, 1 = fully grayscale'}></lcards-message>
        `;
    }

    /**
     * Render sepia filter parameters
     * @private
     */
    _renderSepiaParams(filter, index) {
        return html`
            <ha-selector
                // @ts-ignore - TS2339: auto-suppressed
                .hass=${this.hass}
                .selector=${{ number: { min: 0, max: 1, step: 0.1, mode: 'slider' } }}
                .value=${filter.value ?? 0}
                .label=${'Sepia Amount'}
                @value-changed=${(e) => this._updateFilter(index, 'value', e.detail.value)}>
            </ha-selector>
            <lcards-message type="info" .message=${'0 = normal, 1 = full sepia tone (vintage effect)'}></lcards-message>
        `;
    }

    /**
     * Render invert filter parameters
     * @private
     */
    _renderInvertParams(filter, index) {
        return html`
            <ha-selector
                // @ts-ignore - TS2339: auto-suppressed
                .hass=${this.hass}
                .selector=${{ number: { min: 0, max: 1, step: 0.1, mode: 'slider' } }}
                .value=${filter.value ?? 0}
                .label=${'Invert Amount'}
                @value-changed=${(e) => this._updateFilter(index, 'value', e.detail.value)}>
            </ha-selector>
            <lcards-message type="info" .message=${'0 = normal, 1 = fully inverted (negative)'}></lcards-message>
        `;
    }

    /**
     * Render opacity filter parameters
     * @private
     */
    _renderOpacityParams(filter, index) {
        return html`
            <ha-selector
                // @ts-ignore - TS2339: auto-suppressed
                .hass=${this.hass}
                .selector=${{ number: { min: 0, max: 1, step: 0.1, mode: 'slider' } }}
                .value=${filter.value ?? 1}
                .label=${'Opacity'}
                @value-changed=${(e) => this._updateFilter(index, 'value', e.detail.value)}>
            </ha-selector>
            <lcards-message type="info" .message=${'0 = transparent, 1 = fully opaque'}></lcards-message>
        `;
    }

    /**
     * Render drop-shadow filter parameters
     * @private
     */
    _renderDropShadowParams(filter, index) {
        const shadow = filter.value || { x: 0, y: 0, blur: 0, color: '#000000' };

        return html`
            <div class="param-grid two-col">
                <ha-textfield
                    type="number"
                    label="X Offset (px)"
                    .value=${shadow.x ?? 0}
                    @input=${(e) => this._updateDropShadowParam(index, 'x', e.target.value)}>
                </ha-textfield>
                <ha-textfield
                    type="number"
                    label="Y Offset (px)"
                    .value=${shadow.y ?? 0}
                    @input=${(e) => this._updateDropShadowParam(index, 'y', e.target.value)}>
                </ha-textfield>
            </div>
            <ha-textfield
                type="text"
                label="Blur Radius"
                .value=${shadow.blur || '0px'}
                @input=${(e) => this._updateDropShadowParam(index, 'blur', e.target.value)}
                helper-text="e.g., 0px, 2px, 5px">
            </ha-textfield>
            <lcards-color-picker
                // @ts-ignore - TS2339: auto-suppressed
                .hass=${this.hass}
                .value=${shadow.color || '#000000'}
                .label=${'Shadow Color'}
                @value-changed=${(e) => this._updateDropShadowParam(index, 'color', e.detail.value)}>
            </lcards-color-picker>
        `;
    }

    /**
     * Update drop-shadow parameter
     * @private
     */
    _updateDropShadowParam(index, param, value) {
        const filter = { ...this.filters[index] };
        const shadow = { ...(filter.value || {}) };
        shadow[param] = value;
        filter.value = shadow;

        const updatedFilters = [...this.filters];
        updatedFilters[index] = filter;
        this._emitChange(updatedFilters);
    }

    // ============================
    // SVG Filter Parameter Renderers
    // ============================

    /**
     * Render feGaussianBlur parameters
     * @private
     */
    _renderFeGaussianBlurParams(filter, index) {
        const value = filter.value || { stdDeviation: 0 };

        return html`
            <ha-selector
                // @ts-ignore - TS2339: auto-suppressed
                .hass=${this.hass}
                .selector=${{ number: { min: 0, max: 50, step: 0.5, mode: 'slider' } }}
                .value=${value.stdDeviation ?? 0}
                .label=${'Standard Deviation'}
                @value-changed=${(e) => this._updateSvgFilterParam(index, 'stdDeviation', e.detail.value)}>
            </ha-selector>
            <lcards-message type="info" .message=${'Amount of blur (0 = no blur, higher = more blur)'}></lcards-message>
        `;
    }

    /**
     * Render feColorMatrix parameters
     * @private
     */
    _renderFeColorMatrixParams(filter, index) {
        const value = filter.value || { type: 'saturate', values: 1 };

        return html`
            <ha-selector
                // @ts-ignore - TS2339: auto-suppressed
                .hass=${this.hass}
                .selector=${{
                    select: {
                        options: [
                            { value: 'matrix', label: 'Matrix (4x5)' },
                            { value: 'saturate', label: 'Saturate' },
                            { value: 'hueRotate', label: 'Hue Rotate' },
                            { value: 'luminanceToAlpha', label: 'Luminance to Alpha' }
                        ]
                    }
                }}
                .value=${value.type || 'saturate'}
                .label=${'Matrix Type'}
                @value-changed=${(e) => this._updateSvgFilterParam(index, 'type', e.detail.value)}>
            </ha-selector>

            ${value.type === 'saturate' ? html`
                <ha-selector
                    // @ts-ignore - TS2339: auto-suppressed
                    .hass=${this.hass}
                    .selector=${{ number: { min: 0, max: 3, step: 0.1, mode: 'slider' } }}
                    .value=${value.values ?? 1}
                    .label=${'Saturation'}
                    @value-changed=${(e) => this._updateSvgFilterParam(index, 'values', e.detail.value)}
                    style="margin-top: 12px;">
                </ha-selector>
                <lcards-message type="info" .message=${'0 = grayscale, 1 = normal, >1 = oversaturated'}></lcards-message>
            ` : ''}

            ${value.type === 'hueRotate' ? html`
                <ha-selector
                    // @ts-ignore - TS2339: auto-suppressed
                    .hass=${this.hass}
                    .selector=${{ number: { min: 0, max: 360, step: 1, mode: 'slider' } }}
                    .value=${value.values ?? 0}
                    .label=${'Hue Rotation (degrees)'}
                    @value-changed=${(e) => this._updateSvgFilterParam(index, 'values', e.detail.value)}
                    style="margin-top: 12px;">
                </ha-selector>
            ` : ''}

            ${value.type === 'matrix' ? html`
                <ha-textfield
                    type="text"
                    label="Matrix Values (4x5 = 20 numbers)"
                    .value=${Array.isArray(value.values) ? value.values.join(' ') : (value.values || '')}
                    @input=${(e) => this._updateSvgFilterParam(index, 'values', e.target.value)}
                    helper-text="Space-separated numbers (e.g., 1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 1 0)"
                    style="margin-top: 12px;">
                </ha-textfield>
            ` : ''}

            <lcards-message type="info" .message=${'Combines two inputs: Uses previous filter + SourceGraphic. Advanced compositing for complex layering effects.'}></lcards-message>
        `;
    }

    /**
     * Render feOffset parameters
     * @private
     */
    _renderFeOffsetParams(filter, index) {
        const value = filter.value || { dx: 0, dy: 0 };

        return html`
            <div class="param-grid two-col">
                <ha-textfield
                    type="number"
                    label="dx (horizontal offset)"
                    .value=${value.dx ?? 0}
                    step="1"
                    @input=${(e) => this._updateSvgFilterParam(index, 'dx', e.target.value)}>
                </ha-textfield>
                <ha-textfield
                    type="number"
                    label="dy (vertical offset)"
                    .value=${value.dy ?? 0}
                    step="1"
                    @input=${(e) => this._updateSvgFilterParam(index, 'dy', e.target.value)}>
                </ha-textfield>
            </div>
            <lcards-message type="info" .message=${'Offset in pixels (positive = right/down, negative = left/up)'}></lcards-message>
        `;
    }

    /**
     * Render feBlend parameters
     * @private
     */
    _renderFeBlendParams(filter, index) {
        const value = filter.value || { mode: 'normal' };

        return html`
            <ha-selector
                // @ts-ignore - TS2339: auto-suppressed
                .hass=${this.hass}
                .selector=${{
                    select: {
                        options: [
                            { value: 'normal', label: 'Normal' },
                            { value: 'multiply', label: 'Multiply' },
                            { value: 'screen', label: 'Screen' },
                            { value: 'darken', label: 'Darken' },
                            { value: 'lighten', label: 'Lighten' },
                            { value: 'overlay', label: 'Overlay' },
                            { value: 'color-dodge', label: 'Color Dodge' },
                            { value: 'color-burn', label: 'Color Burn' },
                            { value: 'hard-light', label: 'Hard Light' },
                            { value: 'soft-light', label: 'Soft Light' },
                            { value: 'difference', label: 'Difference' },
                            { value: 'exclusion', label: 'Exclusion' },
                            { value: 'hue', label: 'Hue' },
                            { value: 'saturation', label: 'Saturation' },
                            { value: 'color', label: 'Color' },
                            { value: 'luminosity', label: 'Luminosity' }
                        ]
                    }
                }}
                .value=${value.mode || 'normal'}
                .label=${'Blend Mode'}
                @value-changed=${(e) => this._updateSvgFilterParam(index, 'mode', e.detail.value)}>
            </ha-selector>
            <lcards-message type="info" .message=${'Blends with previous filter: Uses output from the filter above. Try after Blur for glow effects (screen/lighten mode).'}></lcards-message>
        `;
    }

    /**
     * Render feComposite parameters
     * @private
     */
    _renderFeCompositeParams(filter, index) {
        const value = filter.value || { operator: 'over' };

        return html`
            <ha-selector
                // @ts-ignore - TS2339: auto-suppressed
                .hass=${this.hass}
                .selector=${{
                    select: {
                        options: [
                            { value: 'over', label: 'Over' },
                            { value: 'in', label: 'In' },
                            { value: 'out', label: 'Out' },
                            { value: 'atop', label: 'Atop' },
                            { value: 'xor', label: 'XOR' },
                            { value: 'arithmetic', label: 'Arithmetic' }
                        ]
                    }
                }}
                .value=${value.operator || 'over'}
                .label=${'Composite Operator'}
                @value-changed=${(e) => this._updateSvgFilterParam(index, 'operator', e.detail.value)}>
            </ha-selector>

            ${value.operator === 'arithmetic' ? html`
                <div style="margin-top: 16px; padding: 12px; background: var(--card-background-color); border: 1px solid var(--divider-color); border-radius: 4px;">
                    <div style="font-weight: 500; margin-bottom: 12px;">Arithmetic Coefficients</div>
                    <div style="font-size: 12px; color: var(--secondary-text-color); margin-bottom: 12px;">
                        result = k1*i1*i2 + k2*i1 + k3*i2 + k4
                    </div>
                    <div class="param-grid">
                        <ha-textfield type="number" label="k1" .value=${value.k1 ?? 0} step="0.1" @input=${(e) => this._updateSvgFilterParam(index, 'k1', e.target.value)}></ha-textfield>
                        <ha-textfield type="number" label="k2" .value=${value.k2 ?? 0} step="0.1" @input=${(e) => this._updateSvgFilterParam(index, 'k2', e.target.value)}></ha-textfield>
                        <ha-textfield type="number" label="k3" .value=${value.k3 ?? 0} step="0.1" @input=${(e) => this._updateSvgFilterParam(index, 'k3', e.target.value)}></ha-textfield>
                        <ha-textfield type="number" label="k4" .value=${value.k4 ?? 0} step="0.1" @input=${(e) => this._updateSvgFilterParam(index, 'k4', e.target.value)}></ha-textfield>
                    </div>
                </div>
            ` : ''}

            <lcards-message type="info" .message=${'Combines two inputs: Uses previous filter + SourceGraphic. Advanced compositing for complex layering effects.'}></lcards-message>
        `;
    }

    /**
     * Render feMorphology parameters
     * @private
     */
    _renderFeMorphologyParams(filter, index) {
        const value = filter.value || { operator: 'erode', radius: 1 };

        return html`
            <ha-selector
                // @ts-ignore - TS2339: auto-suppressed
                .hass=${this.hass}
                .selector=${{
                    select: {
                        options: [
                            { value: 'erode', label: 'Erode (Thin)' },
                            { value: 'dilate', label: 'Dilate (Fatten)' }
                        ]
                    }
                }}
                .value=${value.operator || 'erode'}
                .label=${'Operator'}
                @value-changed=${(e) => this._updateSvgFilterParam(index, 'operator', e.detail.value)}>
            </ha-selector>

            <ha-selector
                // @ts-ignore - TS2339: auto-suppressed
                .hass=${this.hass}
                .selector=${{ number: { min: 0, max: 20, step: 0.5, mode: 'slider' } }}
                .value=${value.radius ?? 1}
                .label=${'Radius'}
                @value-changed=${(e) => this._updateSvgFilterParam(index, 'radius', e.detail.value)}
                style="margin-top: 12px;">
            </ha-selector>
            <lcards-message type="info" .message=${'Erode makes shapes thinner, dilate makes them fatter'}></lcards-message>
        `;
    }

    /**
     * Render feTurbulence parameters
     * @private
     */
    _renderFeTurbulenceParams(filter, index) {
        const value = filter.value || { type: 'turbulence', baseFrequency: 0.05, numOctaves: 1 };

        return html`
            <ha-selector
                // @ts-ignore - TS2339: auto-suppressed
                .hass=${this.hass}
                .selector=${{
                    select: {
                        options: [
                            { value: 'turbulence', label: 'Turbulence (Cloudy)' },
                            { value: 'fractalNoise', label: 'Fractal Noise' }
                        ]
                    }
                }}
                .value=${value.type || 'turbulence'}
                .label=${'Noise Type'}
                @value-changed=${(e) => this._updateSvgFilterParam(index, 'type', e.detail.value)}>
            </ha-selector>

            <ha-selector
                // @ts-ignore - TS2339: auto-suppressed
                .hass=${this.hass}
                .selector=${{ number: { min: 0, max: 1, step: 0.01, mode: 'slider' } }}
                .value=${value.baseFrequency ?? 0.05}
                .label=${'Base Frequency'}
                @value-changed=${(e) => this._updateSvgFilterParam(index, 'baseFrequency', e.detail.value)}
                style="margin-top: 12px;">
            </ha-selector>

            <ha-selector
                // @ts-ignore - TS2339: auto-suppressed
                .hass=${this.hass}
                .selector=${{ number: { min: 1, max: 10, step: 1, mode: 'slider' } }}
                .value=${value.numOctaves ?? 1}
                .label=${'Octaves (Detail Level)'}
                @value-changed=${(e) => this._updateSvgFilterParam(index, 'numOctaves', e.detail.value)}
                style="margin-top: 12px;">
            </ha-selector>

            <ha-textfield
                type="number"
                label="Seed (randomization)"
                .value=${value.seed ?? 0}
                @input=${(e) => this._updateSvgFilterParam(index, 'seed', e.target.value)}
                style="margin-top: 12px;">
            </ha-textfield>

            <lcards-message type="info" .message=${'Generates Perlin noise patterns for organic textures'}></lcards-message>
        `;
    }

    /**
     * Render feDisplacementMap parameters
     * @private
     */
    _renderFeDisplacementMapParams(filter, index) {
        const value = filter.value || { scale: 10, xChannelSelector: 'R', yChannelSelector: 'G' };

        return html`
            <ha-selector
                // @ts-ignore - TS2339: auto-suppressed
                .hass=${this.hass}
                .selector=${{ number: { min: 0, max: 200, step: 5, mode: 'slider' } }}
                .value=${value.scale ?? 10}
                .label=${'Displacement Scale'}
                @value-changed=${(e) => this._updateSvgFilterParam(index, 'scale', e.detail.value)}>
            </ha-selector>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-top: 12px;">
                <ha-selector
                    // @ts-ignore - TS2339: auto-suppressed
                    .hass=${this.hass}
                    .selector=${{
                        select: {
                            options: [
                                { value: 'R', label: 'Red' },
                                { value: 'G', label: 'Green' },
                                { value: 'B', label: 'Blue' },
                                { value: 'A', label: 'Alpha' }
                            ]
                        }
                    }}
                    .value=${value.xChannelSelector || 'R'}
                    .label=${'X Channel'}
                    @value-changed=${(e) => this._updateSvgFilterParam(index, 'xChannelSelector', e.detail.value)}>
                </ha-selector>

                <ha-selector
                    // @ts-ignore - TS2339: auto-suppressed
                    .hass=${this.hass}
                    .selector=${{
                        select: {
                            options: [
                                { value: 'R', label: 'Red' },
                                { value: 'G', label: 'Green' },
                                { value: 'B', label: 'Blue' },
                                { value: 'A', label: 'Alpha' }
                            ]
                        }
                    }}
                    .value=${value.yChannelSelector || 'G'}
                    .label=${'Y Channel'}
                    @value-changed=${(e) => this._updateSvgFilterParam(index, 'yChannelSelector', e.detail.value)}>
                </ha-selector>
            </div>

            <lcards-message type="info" icon="mdi:lightbulb-on" .message=${'Perfect combo: Add Turbulence filter right before this! Turbulence generates the displacement map for distortion effects.'}></lcards-message>
        `;
    }

    /**
     * Update SVG filter parameter (handles nested objects)
     * @private
     */
    _updateSvgFilterParam(index, param, value) {
        const filter = { ...this.filters[index] };
        const filterValue = { ...(filter.value || {}) };

        // Auto-set mode to 'svg' for SVG filters
        if (filter.type && filter.type.startsWith('fe')) {
            filter.mode = 'svg';
        }

        filterValue[param] = value;
        filter.value = filterValue;

        const updatedFilters = [...this.filters];
        updatedFilters[index] = filter;
        this._emitChange(updatedFilters);
    }

    /**
     * Get filter type options
     * @returns {Array}
     * @private
     */
    _getFilterTypeOptions() {
        return [
            // CSS Filters
            { value: 'blur', label: 'Blur (CSS)' },
            { value: 'brightness', label: 'Brightness (CSS)' },
            { value: 'contrast', label: 'Contrast (CSS)' },
            { value: 'saturate', label: 'Saturation (CSS)' },
            { value: 'hue-rotate', label: 'Hue Rotate (CSS)' },
            { value: 'grayscale', label: 'Grayscale (CSS)' },
            { value: 'sepia', label: 'Sepia (CSS)' },
            { value: 'invert', label: 'Invert (CSS)' },
            { value: 'opacity', label: 'Opacity (CSS)' },
            { value: 'drop-shadow', label: 'Drop Shadow (CSS)' },
            // SVG Filter Primitives
            { value: 'feGaussianBlur', label: 'Gaussian Blur (SVG)' },
            { value: 'feColorMatrix', label: 'Color Matrix (SVG)' },
            { value: 'feOffset', label: 'Offset (SVG)' },
            { value: 'feBlend', label: 'Blend (SVG)' },
            { value: 'feComposite', label: 'Composite (SVG)' },
            { value: 'feMorphology', label: 'Morphology (SVG)' },
            { value: 'feTurbulence', label: 'Turbulence/Noise (SVG)' },
            { value: 'feDisplacementMap', label: 'Displacement Map (SVG)' }
        ];
    }

    /**
     * Get filter icon
     * @param {string} type - Filter type
     * @returns {string} MDI icon
     * @private
     */
    _getFilterIcon(type) {
        const iconMap = {
            // CSS Filters
            'blur': 'mdi:blur',
            'brightness': 'mdi:brightness-6',
            'contrast': 'mdi:contrast-box',
            'saturate': 'mdi:palette',
            'hue-rotate': 'mdi:palette-swatch',
            'grayscale': 'mdi:image-filter-black-white',
            'sepia': 'mdi:image-filter-vintage',
            'invert': 'mdi:invert-colors',
            'opacity': 'mdi:opacity',
            'drop-shadow': 'mdi:shadow',
            // SVG Filter Primitives
            'feGaussianBlur': 'mdi:blur-radial',
            'feColorMatrix': 'mdi:matrix',
            'feOffset': 'mdi:arrow-expand-all',
            'feBlend': 'mdi:layers-triple',
            'feComposite': 'mdi:vector-combine',
            'feMorphology': 'mdi:shape',
            'feTurbulence': 'mdi:waves',
            'feDisplacementMap': 'mdi:image-filter-drama'
        };
        return iconMap[type] || 'mdi:filter';
    }

    /**
     * Get filter display name
     * @param {string} type - Filter type
     * @returns {string}
     * @private
     */
    _getFilterDisplayName(type) {
        const nameMap = {
            // CSS Filters
            'blur': 'Blur',
            'brightness': 'Brightness',
            'contrast': 'Contrast',
            'saturate': 'Saturation',
            'hue-rotate': 'Hue Rotate',
            'grayscale': 'Grayscale',
            'sepia': 'Sepia',
            'invert': 'Invert',
            'opacity': 'Opacity',
            'drop-shadow': 'Drop Shadow',
            // SVG Filter Primitives
            'feGaussianBlur': 'Gaussian Blur',
            'feColorMatrix': 'Color Matrix',
            'feOffset': 'Offset',
            'feBlend': 'Blend Mode',
            'feComposite': 'Composite',
            'feMorphology': 'Morphology',
            'feTurbulence': 'Turbulence',
            'feDisplacementMap': 'Displacement Map'
        };
        return nameMap[type] || type;
    }

    /**
     * Get filter description
     * @param {string} type - Filter type
     * @returns {string}
     * @private
     */
    _getFilterDescription(type) {
        const descriptions = {
            // CSS Filters
            'blur': 'Applies Gaussian blur to soften edges and create depth effects.',
            'brightness': 'Adjusts the brightness level. 1 = normal, <1 = darker, >1 = brighter.',
            'contrast': 'Adjusts the contrast. 1 = normal, <1 = less contrast, >1 = more contrast.',
            'saturate': 'Adjusts color saturation. 0 = grayscale, 1 = normal, >1 = oversaturated.',
            'hue-rotate': 'Rotates colors around the color wheel (0-360 degrees).',
            'grayscale': 'Converts to grayscale. 0 = full color, 1 = complete grayscale.',
            'sepia': 'Applies sepia tone effect. 0 = normal, 1 = full sepia.',
            'invert': 'Inverts colors. 0 = normal, 1 = fully inverted.',
            'opacity': 'Adjusts transparency. 0 = fully transparent, 1 = fully opaque.',
            'drop-shadow': 'Creates a drop shadow behind the element.',
            // SVG Filter Primitives
            'feGaussianBlur': 'SVG blur filter - smoother than CSS blur, chains with other SVG filters.',
            'feColorMatrix': 'Powerful color transformation using matrix operations. Supports hue rotation, saturation, and custom color mapping.',
            'feOffset': 'Shifts the filter result by dx/dy pixels. Essential for creating shadow effects when combined with blur.',
            'feBlend': 'Blends the current filter result with another input using various blend modes (multiply, screen, overlay, etc.).',
            'feComposite': 'Combines two inputs using Porter-Duff compositing operators or arithmetic operations.',
            'feMorphology': 'Erodes (thins) or dilates (fattens) shapes. Useful for creating outline effects or adjusting edge thickness.',
            'feTurbulence': 'Generates Perlin noise patterns for organic textures. Commonly used with displacement maps for distortion.',
            'feDisplacementMap': 'Warps/distorts the image based on color values from another source. Perfect for wavy, liquid, or turbulent effects.'
        };
        return descriptions[type] || '';
    }

    /**
     * Get filter value display string
     * @param {Object} filter - Filter configuration
     * @returns {string}
     * @private
     */
    _getFilterValueDisplay(filter) {
        const type = filter.type || 'blur';
        const value = filter.value;

        if (type === 'drop-shadow') {
            const shadow = value || {};
            return `${shadow.x || 0}px ${shadow.y || 0}px ${shadow.blur || '0px'} ${shadow.color || '#000000'}`;
        }

        if (typeof value === 'string') {
            return value;
        }

        if (typeof value === 'number') {
            if (type === 'blur') return `${value}px`;
            if (type === 'hue-rotate') return `${value}deg`;
            return value.toString();
        }

        return 'Not set';
    }

    /**
     * Toggle filter expanded state
     * @param {number} index - Filter index
     * @private
     */
    _toggleExpanded(index) {
        this._expandedFilters = {
            ...this._expandedFilters,
            [index]: !this._expandedFilters[index]
        };
        this.requestUpdate();
    }

    /**
     * Add new filter
     * @private
     */
    _addFilter() {
        const newFilter = {
            mode: 'css',
            type: 'blur',
            value: '0px'
        };

        const updatedFilters = [...(this.filters || []), newFilter];
        this._expandedFilters[updatedFilters.length - 1] = true;
        this._emitChange(updatedFilters);
    }

    /**
     * Duplicate filter
     * @param {number} index - Filter index
     * @param {Event} e - Click event
     * @private
     */
    _duplicateFilter(index, e) {
        e.stopPropagation();
        const filterToDuplicate = { ...this.filters[index] };
        const updatedFilters = [...this.filters];
        updatedFilters.splice(index + 1, 0, filterToDuplicate);
        this._expandedFilters[index + 1] = true;
        this._emitChange(updatedFilters);
    }

    /**
     * Delete filter
     * @param {number} index - Filter index
     * @param {Event} e - Click event
     * @private
     */
    _deleteFilter(index, e) {
        e.stopPropagation();
        const updatedFilters = this.filters.filter((_, i) => i !== index);
        delete this._expandedFilters[index];
        this._emitChange(updatedFilters);
    }

    /**
     * Update filter property
     * @param {number} index - Filter index
     * @param {string} property - Property name
     * @param {*} value - New value
     * @private
     */
    _updateFilter(index, property, value) {
        const updatedFilters = [...this.filters];
        updatedFilters[index] = {
            ...updatedFilters[index],
            [property]: value
        };

        // Auto-detect mode based on filter type
        if (property === 'type') {
            const svgFilterTypes = ['feGaussianBlur', 'feColorMatrix', 'feOffset', 'feBlend', 'feComposite', 'feMorphology', 'feTurbulence', 'feDisplacementMap'];
            const newMode = svgFilterTypes.includes(value) ? 'svg' : 'css';
            updatedFilters[index].mode = newMode;

            // Reset value to appropriate default for the new filter type
            if (newMode === 'svg') {
                updatedFilters[index].value = {};
            } else {
                // CSS filter defaults
                updatedFilters[index].value = value === 'blur' ? '0px' : (value === 'hue-rotate' ? '0deg' : 1);
            }

            lcardsLog.debug('[FilterEditor] Type changed, auto-set mode:', { type: value, mode: newMode });
        }

        this._emitChange(updatedFilters);
    }

    /**
     * Emit filters-changed event
     * @param {Array} filters - Updated filters array
     * @private
     */
    _emitChange(filters) {
        lcardsLog.debug('[FilterEditor] Filters changed:', filters);
        this.filters = filters;
        this.dispatchEvent(new CustomEvent('filters-changed', {
            detail: { value: filters }, // Use 'value' to match animation editor pattern
            bubbles: true,
            composed: true
        }));
        // Force re-render to update mode badges and other computed values
        this.requestUpdate();
    }

    /**
     * Handle drag start
     * @param {DragEvent} e - Drag event
     * @param {number} index - Filter index
     * @private
     */
    _handleDragStart(e, index) {
        this._draggedIndex = index;
        e.dataTransfer.effectAllowed = 'move';
        // @ts-ignore - TS2345: auto-suppressed
        e.dataTransfer.setData('text/plain', index);
        this.requestUpdate();
    }

    /**
     * Handle drag end
     * @param {DragEvent} e - Drag event
     * @private
     */
    _handleDragEnd(e) {
        this._draggedIndex = null;
        // Remove drag-over class from all items
        this.shadowRoot.querySelectorAll('.filter-item').forEach(item => {
            item.classList.remove('drag-over');
        });
        this.requestUpdate();
    }

    /**
     * Handle drag over
     * @param {DragEvent} e - Drag event
     * @param {number} index - Drop target index
     * @private
     */
    _handleDragOver(e, index) {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';

        if (this._draggedIndex === null || this._draggedIndex === index) {
            return;
        }

        // Add drag-over visual indicator
        const items = this.shadowRoot.querySelectorAll('.filter-item');
        items.forEach(item => item.classList.remove('drag-over'));
        items[index]?.classList.add('drag-over');
    }

    /**
     * Handle drop
     * @param {DragEvent} e - Drag event
     * @param {number} dropIndex - Drop target index
     * @private
     */
    _handleDrop(e, dropIndex) {
        e.preventDefault();
        e.stopPropagation();

        const dragIndex = this._draggedIndex;
        if (dragIndex === null || dragIndex === dropIndex) {
            return;
        }

        // Reorder filters
        const updatedFilters = [...this.filters];
        const [draggedItem] = updatedFilters.splice(dragIndex, 1);
        updatedFilters.splice(dropIndex, 0, draggedItem);

        // Update expanded state to follow moved items
        const newExpandedState = {};
        Object.keys(this._expandedFilters).forEach(oldIndex => {
            const idx = parseInt(oldIndex);
            let newIndex = idx;

            if (idx === dragIndex) {
                newIndex = dropIndex;
            } else if (dragIndex < dropIndex && idx > dragIndex && idx <= dropIndex) {
                newIndex = idx - 1;
            } else if (dragIndex > dropIndex && idx >= dropIndex && idx < dragIndex) {
                newIndex = idx + 1;
            }

            newExpandedState[newIndex] = this._expandedFilters[oldIndex];
        });

        this._expandedFilters = newExpandedState;
        this._draggedIndex = null;

        // Remove drag-over class
        this.shadowRoot.querySelectorAll('.filter-item').forEach(item => {
            item.classList.remove('drag-over');
        });

        this._emitChange(updatedFilters);
    }
}

customElements.define('lcards-filter-editor', LCARdSFilterEditor);
